// app/api/sites/[id]/route.ts
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { deleteSite, getSite } from '@/lib/db';

type Params = { params: { id: string } };

export async function GET(_req: Request, { params }: Params) {
  const { userId } = await auth();

  try {
    const site = await getSite({ id: params.id, userId });
    if (!site) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ site });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json({ error: e?.message ?? 'Failed to fetch site' }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: Params) {
  const { userId } = await auth();

  try {
    await deleteSite({ id: params.id, userId });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json({ error: e?.message ?? 'Failed to delete site' }, { status: 500 });
  }
}
