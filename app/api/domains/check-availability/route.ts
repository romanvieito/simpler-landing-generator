// app/api/domains/check-availability/route.ts
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { checkDomainAvailability } from '@/lib/vercel';

// Helper function to safely get error message
const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
};

export async function POST(req: Request) {
  let userId: string | null = null;

  try {
    const authResult = await auth();
    userId = authResult.userId;

    // In development, use a test user ID if not authenticated
    if (!userId && process.env.NODE_ENV === 'development') {
      userId = 'test_user_development';
      console.log('Using test user ID for development:', userId);
    }

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { domain }: { domain: string } = body;

    if (!domain || typeof domain !== 'string') {
      return NextResponse.json({ error: 'Domain is required' }, { status: 400 });
    }

    // Basic domain validation
    const domainRegex = /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    if (!domainRegex.test(domain)) {
      return NextResponse.json({ error: 'Invalid domain format' }, { status: 400 });
    }

    // Check domain availability
    const availability = await checkDomainAvailability(domain);

    return NextResponse.json({
      domain: availability.name,
      available: availability.available,
      price: availability.price,
      currency: availability.currency,
    });
  } catch (error) {
    const errorMessage = getErrorMessage(error);
    console.error('Error checking domain availability:', error);
    return NextResponse.json(
      { error: 'Failed to check domain availability' },
      { status: 500 }
    );
  }
}