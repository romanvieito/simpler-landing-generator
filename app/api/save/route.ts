// app/api/save/route.ts
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { sql } from '@vercel/postgres';
import { ensureSitesTable, insertSite } from '@/lib/db';

export async function POST(req: Request) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { id: existingId, title, description, plan, html, vercelUrl } = body || {};
    if (!html || typeof html !== 'string') {
      return NextResponse.json({ error: 'Missing html' }, { status: 400 });
    }

    await ensureSitesTable();

    // Replace placeholder with actual site ID
    const placeholderRegex = /(\{\{SITE_ID_PLACEHOLDER\}\}|%7B%7BSITE_ID_PLACEHOLDER%7D%7D)/g;
    
    // If updating an existing site
    if (existingId) {
      // Check if site exists and belongs to user
      const { rows } = await sql`
        SELECT id FROM sites WHERE id = ${existingId} AND user_id = ${userId} LIMIT 1
      `;
      
      if (rows.length === 0) {
        return NextResponse.json({ error: 'Site not found or access denied' }, { status: 404 });
      }

      // Replace placeholder with existing site ID
      const processedHtml = html.replace(placeholderRegex, `/api/contact/${existingId}`);

      // Update the existing site
      await sql`
        UPDATE sites
        SET title = ${title || 'Landing'},
            description = ${description || ''},
            plan = ${JSON.stringify(plan || null)},
            html = ${processedHtml},
            vercel_url = ${vercelUrl || null}
        WHERE id = ${existingId} AND user_id = ${userId}
      `;

      return NextResponse.json({ id: existingId });
    }

    // Creating a new site
    const id = crypto.randomUUID();
    const processedHtml = html.replace(placeholderRegex, `/api/contact/${id}`);

    // Insert with the processed HTML
    await sql`
      INSERT INTO sites (id, user_id, title, description, plan, html, vercel_url)
      VALUES (${id}, ${userId}, ${title || 'Landing'}, ${description || ''}, ${JSON.stringify(plan || null)}, ${processedHtml}, ${vercelUrl || null})
    `;

    return NextResponse.json({ id });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json({ error: e?.message ?? 'Failed to save' }, { status: 500 });
  }
}
