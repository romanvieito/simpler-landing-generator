// app/api/leads/route.ts
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { ensureContactSubmissionsTable, ensureSitesTable, getAllContactSubmissionsForUser } from '@/lib/db';

export async function GET() {
  const authResult = await auth();
  let userId = authResult.userId;

  // In development, use a test user ID if not authenticated
  if (!userId && process.env.NODE_ENV === 'development') {
    userId = 'test_user_development';
  }

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
