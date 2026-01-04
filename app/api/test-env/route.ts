import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    VERCEL_TOKEN: process.env.VERCEL_TOKEN ? 'SET' : 'NOT SET',
    VERCEL_TEAM_ID: process.env.VERCEL_TEAM_ID ? 'SET' : 'NOT SET',
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL ? 'SET' : 'NOT SET',
    hasToken: !!process.env.VERCEL_TOKEN,
    hasAppUrl: !!process.env.NEXT_PUBLIC_APP_URL,
  });
}
