// app/api/sites/check-subdomain/route.ts
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getSiteByCustomDomain } from '@/lib/db';

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
    const { subdomain, excludeSiteId }: { subdomain: string; excludeSiteId?: string } = body;

    if (!subdomain || typeof subdomain !== 'string') {
      return NextResponse.json({ error: 'Subdomain is required' }, { status: 400 });
    }

    // Validate subdomain format
    const subdomainRegex = /^[a-zA-Z0-9-]+\.easyland\.site$/;
    if (!subdomainRegex.test(subdomain)) {
      return NextResponse.json({ error: 'Invalid subdomain format. Must be subdomain.easyland.site' }, { status: 400 });
    }

    // Check if subdomain is already taken
    const existingSite = await getSiteByCustomDomain(subdomain);

    // If site exists and it's not the site we're excluding (current site), then it's taken
    const isTaken = existingSite && existingSite.id !== excludeSiteId;

    return NextResponse.json({
      subdomain,
      available: !isTaken,
      taken: isTaken
    });
  } catch (error) {
    console.error('Error checking subdomain availability:', error);
    return NextResponse.json(
      { error: 'Failed to check subdomain availability' },
      { status: 500 }
    );
  }
}