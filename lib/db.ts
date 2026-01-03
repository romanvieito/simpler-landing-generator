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
