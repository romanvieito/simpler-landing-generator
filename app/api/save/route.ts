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
    const { title, description, plan, html, vercelUrl } = body || {};
    if (!html || typeof html !== 'string') {
      return NextResponse.json({ error: 'Missing html' }, { status: 400 });
    }

    await ensureSitesTable();

    // First insert with placeholder
    const { id } = await insertSite({
      userId,
      title: title || 'Landing',
      description: description || '',
      plan: plan || null,
      html: html.replace(/\{\{SITE_ID_PLACEHOLDER\}\}/g, `/api/contact/${crypto.randomUUID()}`), // temp placeholder
      vercelUrl: vercelUrl || null,
    });

    // Then update with the actual site ID
    await sql`
      UPDATE sites
      SET html = ${html.replace(/\{\{SITE_ID_PLACEHOLDER\}\}/g, `/api/contact/${id}`)}
      WHERE id = ${id} AND user_id = ${userId}
    `;

    return NextResponse.json({ id });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json({ error: e?.message ?? 'Failed to save' }, { status: 500 });
  }
}
