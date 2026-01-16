// app/api/admin/sites/route.ts
import { NextResponse } from 'next/server';
import { getAllSites } from '@/lib/db';

export async function GET() {
  try {
    // Simple admin check - you could make this more sophisticated
    // For now, just check if we're in development or add an admin header check
    const isDevelopment = process.env.NODE_ENV === 'development';

    // In production, you might want to add proper admin authentication
    // For now, we'll allow access in development and with a simple check
    if (!isDevelopment) {
      // You could add a header check or JWT token validation here
      // For now, just return unauthorized
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const sites = await getAllSites();
    return NextResponse.json({ sites });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json({ error: e?.message ?? 'Failed to list all sites' }, { status: 500 });
  }
}