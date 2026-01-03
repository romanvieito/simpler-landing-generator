// app/api/save/route.ts
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { ensureSitesTable, insertSite } from '@/lib/db';

export async function POST(req: Request) {
  const { userId } = await auth();

  try {
    const body = await req.json();
    const { title, description, plan, html, vercelUrl } = body || {};
    if (!html || typeof html !== 'string') {
      return NextResponse.json({ error: 'Missing html' }, { status: 400 });
    }

    await ensureSitesTable();
    const { id } = await insertSite({
      userId,
      title: title || 'Landing',
      description: description || '',
      plan: plan || null,
      html,
      vercelUrl: vercelUrl || null,
    });

    return NextResponse.json({ id });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json({ error: e?.message ?? 'Failed to save' }, { status: 500 });
  }
}
