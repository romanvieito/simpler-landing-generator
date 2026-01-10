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
      custom_domain TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `;

  // Migration: add custom_domain if it doesn't exist (older deployments)
  await sql`
    ALTER TABLE sites
    ADD COLUMN IF NOT EXISTS custom_domain TEXT;
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
      balance DECIMAL(10,4) NOT NULL DEFAULT 0,
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

  // Migration: Add pending_conversion_value if it doesn't exist
  await sql`
    ALTER TABLE user_credits
    ADD COLUMN IF NOT EXISTS pending_conversion_value DECIMAL(10,2) DEFAULT NULL;
  `;

  // Migration: Ensure the column is nullable if it was previously created as DEFAULT 0
  await sql`
    ALTER TABLE user_credits 
    ALTER COLUMN pending_conversion_value DROP DEFAULT,
    ALTER COLUMN pending_conversion_value SET DEFAULT NULL;
  `;

  // Migration: change balance from INTEGER to DECIMAL if it exists as INTEGER
  await sql`
    DO $$
    BEGIN
      -- Check if balance column is INTEGER and alter it to DECIMAL
      IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'user_credits'
        AND column_name = 'balance'
        AND data_type = 'integer'
      ) THEN
        ALTER TABLE user_credits ALTER COLUMN balance TYPE DECIMAL(10,4);
      END IF;
    END $$;
  `;
}

export async function ensureCreditTransactionsTable() {
  await sql`
    CREATE TABLE IF NOT EXISTS credit_transactions (
      id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      user_id TEXT NOT NULL,
      amount DECIMAL(10,4) NOT NULL,
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

  // Migration: change amount from INTEGER to DECIMAL if it exists as INTEGER
  await sql`
    DO $$
    BEGIN
      -- Check if amount column is INTEGER and alter it to DECIMAL
      IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'credit_transactions'
        AND column_name = 'amount'
        AND data_type = 'integer'
      ) THEN
        ALTER TABLE credit_transactions ALTER COLUMN amount TYPE DECIMAL(10,4);
      END IF;
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
  // In development, show all sites for easier testing
  const isDevelopment = process.env.NODE_ENV === 'development';

  if (isDevelopment) {
    const { rows } = await sql`
      SELECT id, title, description, vercel_url, custom_domain, created_at
      FROM sites
      ORDER BY created_at DESC
      LIMIT 100
    `;
    return rows;
  } else {
    const { rows } = await sql`
      SELECT id, title, description, vercel_url, custom_domain, created_at
      FROM sites
      WHERE user_id = ${userId}
      ORDER BY created_at DESC
      LIMIT 100
    `;
    return rows;
  }
}

export async function getSite({ id, userId }: { id: string; userId: string }) {
  // In development, allow access to any site for easier testing
  const isDevelopment = process.env.NODE_ENV === 'development';

  if (isDevelopment) {
    const { rows } = await sql`
      SELECT id, title, description, plan, html, vercel_url, custom_domain, created_at
      FROM sites
      WHERE id = ${id}
      LIMIT 1
    `;
    return rows[0] || null;
  } else {
    const { rows } = await sql`
      SELECT id, title, description, plan, html, vercel_url, custom_domain, created_at
      FROM sites
      WHERE id = ${id} AND user_id = ${userId}
      LIMIT 1
    `;
    return rows[0] || null;
  }
}

export async function getSitePublic(id: string) {
  const { rows } = await sql`
    SELECT id, user_id, title, description, vercel_url, custom_domain, created_at
    FROM sites
    WHERE id = ${id}
    LIMIT 1
  `;
  return rows[0] || null;
}

export async function updateSiteCustomDomain({
  id,
  userId,
  customDomain,
}: {
  id: string;
  userId: string;
  customDomain: string | null;
}) {
  // In development, allow updates to any site
  const isDevelopment = process.env.NODE_ENV === 'development';

  if (isDevelopment) {
    await sql`
      UPDATE sites
      SET custom_domain = ${customDomain}
      WHERE id = ${id}
    `;
  } else {
    await sql`
      UPDATE sites
      SET custom_domain = ${customDomain}
      WHERE id = ${id} AND user_id = ${userId}
    `;
  }
}

export async function getSiteDomainMeta({
  id,
  userId,
}: {
  id: string;
  userId: string;
}): Promise<{ id: string; vercel_url: string | null; custom_domain: string | null } | null> {
  // In development, allow access to any site
  const isDevelopment = process.env.NODE_ENV === 'development';

  if (isDevelopment) {
    const { rows } = await sql`
      SELECT id, vercel_url, custom_domain
      FROM sites
      WHERE id = ${id}
      LIMIT 1
    `;
    return rows[0] as { id: string; vercel_url: string | null; custom_domain: string | null } || null;
  } else {
    const { rows } = await sql`
      SELECT id, vercel_url, custom_domain
      FROM sites
      WHERE id = ${id} AND user_id = ${userId}
      LIMIT 1
    `;
    return rows[0] as { id: string; vercel_url: string | null; custom_domain: string | null } || null;
  }
}

export async function getSiteByCustomDomain(customDomain: string): Promise<{ id: string; html: string | null; title: string | null; description: string | null } | null> {
  const { rows } = await sql`
    SELECT id, html, title, description
    FROM sites
    WHERE custom_domain = ${customDomain}
    LIMIT 1
  `;
  return rows[0] as { id: string; html: string | null; title: string | null; description: string | null } || null;
}

export async function deleteSite({ id, userId }: { id: string; userId: string }) {
  // In development, allow deletion of any site
  const isDevelopment = process.env.NODE_ENV === 'development';

  if (isDevelopment) {
    await sql`DELETE FROM sites WHERE id = ${id}`;
  } else {
    await sql`DELETE FROM sites WHERE id = ${id} AND user_id = ${userId}`;
  }
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
  
  // Check if 24 hours have passed since last grant (or never granted) and balance is below 1
  const shouldGrant = balance < 1 && (!lastGrant || (now.getTime() - lastGrant.getTime()) >= 24 * 60 * 60 * 1000);

  if (shouldGrant) {
    // Set balance to 1 and update last_free_credits_at
    await sql`
      UPDATE user_credits
      SET balance = 1, last_free_credits_at = NOW(), updated_at = NOW()
      WHERE user_id = ${userId}
    `;

    // Record the free grant transaction
    const amountGranted = 1 - balance;
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

  return parseFloat(rows[0]?.balance ?? '0');
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

  return rows.map(row => ({
    ...row,
    amount: parseFloat(row.amount)
  }));
}

export async function setPendingConversion({ userId, amount }: { userId: string, amount: number }) {
  await sql`
    UPDATE user_credits
    SET pending_conversion_value = ${amount}, updated_at = NOW()
    WHERE user_id = ${userId}
  `;
}

export async function getPendingConversion(userId: string) {
  const { rows } = await sql`
    SELECT pending_conversion_value
    FROM user_credits
    WHERE user_id = ${userId}
    LIMIT 1
  `;
  const val = rows[0]?.pending_conversion_value;
  return val === null || val === undefined ? null : parseFloat(val);
}

export async function clearPendingConversion(userId: string) {
  await sql`
    UPDATE user_credits
    SET pending_conversion_value = NULL, updated_at = NOW()
    WHERE user_id = ${userId}
  `;
}
