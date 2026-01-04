// lib/db.ts
import { sql } from '@vercel/postgres';

export async function ensureSitesTable() {
  await sql`
    CREATE TABLE IF NOT EXISTS sites (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      title TEXT,
      description TEXT,
      plan JSON,
      html TEXT NOT NULL,
      vercel_url TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `;
}

export async function ensureContactSubmissionsTable() {
  await sql`
    CREATE TABLE IF NOT EXISTS contact_submissions (
      id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      site_id TEXT NOT NULL,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      message TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      FOREIGN KEY (site_id) REFERENCES sites(id) ON DELETE CASCADE
    );
  `;
}

export async function ensureCreditsTable() {
  await sql`
    CREATE TABLE IF NOT EXISTS user_credits (
      user_id TEXT PRIMARY KEY,
      balance INTEGER NOT NULL DEFAULT 0,
      last_free_credits_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  `;
  
  // Migration: Add last_free_credits_at column if it doesn't exist
  await sql`
    ALTER TABLE user_credits 
    ADD COLUMN IF NOT EXISTS last_free_credits_at TIMESTAMPTZ;
  `;
}

export async function ensureCreditTransactionsTable() {
  await sql`
    CREATE TABLE IF NOT EXISTS credit_transactions (
      id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      user_id TEXT NOT NULL,
      amount INTEGER NOT NULL,
      type TEXT NOT NULL CHECK (type IN ('purchase', 'usage', 'refund', 'free_grant')),
      description TEXT,
      stripe_payment_id TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      FOREIGN KEY (user_id) REFERENCES user_credits(user_id) ON DELETE CASCADE
    );
  `;
  
  // Migration: Drop old constraint and add new one with 'free_grant'
  // This is safe because it will fail silently if constraint doesn't exist or already has free_grant
  await sql`
    DO $$ 
    BEGIN
      -- Drop the old constraint if it exists
      ALTER TABLE credit_transactions DROP CONSTRAINT IF EXISTS credit_transactions_type_check;
      
      -- Add the new constraint with all types including 'free_grant'
      ALTER TABLE credit_transactions 
      ADD CONSTRAINT credit_transactions_type_check 
      CHECK (type IN ('purchase', 'usage', 'refund', 'free_grant'));
    EXCEPTION
      WHEN duplicate_object THEN NULL;
    END $$;
  `;
}

export async function insertSite(args: {
  userId: string;
  title: string;
  description: string;
  plan: any;
  html: string;
  vercelUrl: string | null;
}) {
  const id = crypto.randomUUID();
  await sql`
    INSERT INTO sites (id, user_id, title, description, plan, html, vercel_url)
    VALUES (${id}, ${args.userId}, ${args.title}, ${args.description}, ${JSON.stringify(args.plan)}, ${args.html}, ${args.vercelUrl})
  `;
  return { id };
}

export async function listSites({ userId }: { userId: string }) {
  const { rows } = await sql`
    SELECT id, title, description, vercel_url, created_at
    FROM sites
    WHERE user_id = ${userId}
    ORDER BY created_at DESC
    LIMIT 100
  `;
  return rows;
}

export async function getSite({ id, userId }: { id: string; userId: string }) {
  const { rows } = await sql`
    SELECT id, title, description, plan, html, vercel_url, created_at
    FROM sites
    WHERE id = ${id} AND user_id = ${userId}
    LIMIT 1
  `;
  return rows[0] || null;
}

export async function deleteSite({ id, userId }: { id: string; userId: string }) {
  await sql`DELETE FROM sites WHERE id = ${id} AND user_id = ${userId}`;
}

export async function updateSiteUrl({
  id,
  userId,
  vercelUrl,
}: {
  id: string | null;
  userId: string;
  vercelUrl: string;
}) {
  if (!id) return;

  await sql`
    UPDATE sites
    SET vercel_url = ${vercelUrl}
    WHERE id = ${id} AND user_id = ${userId}
  `;
}

export async function insertContactSubmission(args: {
  siteId: string;
  name: string;
  email: string;
  message: string;
}) {
  await sql`
    INSERT INTO contact_submissions (site_id, name, email, message)
    VALUES (${args.siteId}, ${args.name}, ${args.email}, ${args.message})
  `;
}

export async function getContactSubmissions({ siteId, userId }: { siteId: string; userId: string }) {
  // First verify the user owns the site
  const siteCheck = await sql`
    SELECT id FROM sites WHERE id = ${siteId} AND user_id = ${userId} LIMIT 1
  `;

  if (siteCheck.rows.length === 0) {
    throw new Error('Site not found or access denied');
  }

  const { rows } = await sql`
    SELECT id, name, email, message, created_at
    FROM contact_submissions
    WHERE site_id = ${siteId}
    ORDER BY created_at DESC
  `;

  return rows;
}

export async function getAllContactSubmissionsForUser({ userId }: { userId: string }) {
  const { rows } = await sql`
    SELECT cs.id, cs.name, cs.email, cs.message, cs.created_at, s.title as site_title, s.id as site_id
    FROM contact_submissions cs
    JOIN sites s ON cs.site_id = s.id
    WHERE s.user_id = ${userId}
    ORDER BY cs.created_at DESC
    LIMIT 100
  `;

  return rows;
}

// Credit management functions
export async function refreshFreeCredits({ userId }: { userId: string }) {
  // Ensure user has a credits record
  await ensureUserCredits({ userId });

  // Check if user needs free credits top-up
  const { rows } = await sql`
    SELECT balance, last_free_credits_at
    FROM user_credits
    WHERE user_id = ${userId}
    LIMIT 1
  `;

  if (rows.length === 0) return;

  const { balance, last_free_credits_at } = rows[0];
  const now = new Date();
  const lastGrant = last_free_credits_at ? new Date(last_free_credits_at) : null;
  
  // Check if 24 hours have passed since last grant (or never granted) and balance is below 3
  const shouldGrant = balance < 3 && (!lastGrant || (now.getTime() - lastGrant.getTime()) >= 24 * 60 * 60 * 1000);

  if (shouldGrant) {
    // Set balance to 3 and update last_free_credits_at
    await sql`
      UPDATE user_credits
      SET balance = 3, last_free_credits_at = NOW(), updated_at = NOW()
      WHERE user_id = ${userId}
    `;

    // Record the free grant transaction
    const amountGranted = 3 - balance;
    await sql`
      INSERT INTO credit_transactions (user_id, amount, type, description)
      VALUES (${userId}, ${amountGranted}, 'free_grant', 'Daily free credits top-up')
    `;
  }
}

export async function getUserCredits({ userId }: { userId: string }) {
  // First, refresh free credits if eligible
  await refreshFreeCredits({ userId });

  const { rows } = await sql`
    SELECT balance
    FROM user_credits
    WHERE user_id = ${userId}
    LIMIT 1
  `;

  return rows[0]?.balance ?? 0;
}

export async function ensureUserCredits({ userId }: { userId: string }) {
  await sql`
    INSERT INTO user_credits (user_id, balance)
    VALUES (${userId}, 0)
    ON CONFLICT (user_id) DO NOTHING
  `;
}

export async function addCredits({ userId, amount, type, description, stripePaymentId }: {
  userId: string;
  amount: number;
  type: 'purchase' | 'usage' | 'refund' | 'free_grant';
  description?: string;
  stripePaymentId?: string;
}) {
  // Ensure user has a credits record
  await ensureUserCredits({ userId });

  // Update balance
  await sql`
    UPDATE user_credits
    SET balance = balance + ${amount}, updated_at = NOW()
    WHERE user_id = ${userId}
  `;

  // Record transaction
  await sql`
    INSERT INTO credit_transactions (user_id, amount, type, description, stripe_payment_id)
    VALUES (${userId}, ${amount}, ${type}, ${description || null}, ${stripePaymentId || null})
  `;

  return await getUserCredits({ userId });
}

export async function deductCredits({ userId, amount, description }: {
  userId: string;
  amount: number;
  description?: string;
}) {
  const currentBalance = await getUserCredits({ userId });

  if (currentBalance < amount) {
    throw new Error('Insufficient credits');
  }

  return await addCredits({
    userId,
    amount: -amount,
    type: 'usage',
    description: description || 'Website generation'
  });
}

export async function getCreditTransactions({ userId }: { userId: string }) {
  const { rows } = await sql`
    SELECT id, amount, type, description, stripe_payment_id, created_at
    FROM credit_transactions
    WHERE user_id = ${userId}
    ORDER BY created_at DESC
    LIMIT 50
  `;

  return rows;
}
