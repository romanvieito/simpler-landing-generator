// app/api/credits/balance/route.ts
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getUserCredits, ensureCreditsTable, ensureCreditTransactionsTable } from '@/lib/db';

export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Ensure tables exist
    await ensureCreditsTable();
    await ensureCreditTransactionsTable();

    const balance = await getUserCredits({ userId });

    return NextResponse.json({ balance });
  } catch (error) {
    console.error('Error fetching credit balance:', error);
    return NextResponse.json(
      { error: 'Failed to fetch credit balance' },
      { status: 500 }
    );
  }
}
