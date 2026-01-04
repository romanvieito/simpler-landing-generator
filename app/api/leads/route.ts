// app/api/leads/route.ts
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { ensureContactSubmissionsTable, ensureSitesTable, getAllContactSubmissionsForUser } from '@/lib/db';

export async function GET() {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await ensureSitesTable();
    await ensureContactSubmissionsTable();
    const leads = await getAllContactSubmissionsForUser({ userId });
    return NextResponse.json({ leads });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json({ error: e?.message ?? 'Failed to get leads' }, { status: 500 });
  }
}
