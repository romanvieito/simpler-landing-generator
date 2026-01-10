// app/api/credits/clear-conversion/route.ts
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { clearPendingConversion } from '@/lib/db';

export async function POST() {
  try {
    const authResult = await auth();
    let userId = authResult.userId;

    // In development, use a test user ID if not authenticated
    if (!userId && process.env.NODE_ENV === 'development') {
      userId = 'test_user_development';
    }

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await clearPendingConversion(userId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error clearing pending conversion:', error);
    return NextResponse.json(
      { error: 'Failed to clear pending conversion' },
      { status: 500 }
    );
  }
}
