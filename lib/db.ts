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
  id: string;
  userId: string;
  vercelUrl: string;
}) {
  await sql`
    UPDATE sites
    SET vercel_url = ${vercelUrl}
    WHERE id = ${id} AND user_id = ${userId}
  `;
}
