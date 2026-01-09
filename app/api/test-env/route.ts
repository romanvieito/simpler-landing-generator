import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    // Vercel
    VERCEL_TOKEN: process.env.VERCEL_TOKEN ? 'SET' : 'NOT SET',
    VERCEL_TEAM_ID: process.env.VERCEL_TEAM_ID ? 'SET' : 'NOT SET',

    // Stripe
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY ? 'SET' : 'NOT SET',
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ? 'SET' : 'NOT SET',
    STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET ? 'SET' : 'NOT SET',

    // App URL
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL ? 'SET' : 'NOT SET',

    // Clerk
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ? 'SET' : 'NOT SET',
    CLERK_SECRET_KEY: process.env.CLERK_SECRET_KEY ? 'SET' : 'NOT SET',

    // Anthropic
    ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY ? 'SET' : 'NOT SET',

    // Database
    POSTGRES_URL: process.env.POSTGRES_URL ? 'SET' : 'NOT SET',

    hasAllRequired: !!(
      process.env.STRIPE_SECRET_KEY &&
      process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY &&
      process.env.STRIPE_WEBHOOK_SECRET &&
      process.env.NEXT_PUBLIC_APP_URL &&
      process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY &&
      process.env.CLERK_SECRET_KEY &&
      process.env.ANTHROPIC_API_KEY &&
      process.env.POSTGRES_URL
    ),
  });
}
