// app/api/domains/purchase/route.ts
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { purchaseDomain } from '@/lib/vercel';
import { getUserCredits, deductCredits, ensureCreditsTable } from '@/lib/db';

import { logStripeEvent, ensureStripeLogsTable } from '@/lib/stripe-logger';

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
      await logStripeEvent({
        eventType: 'domain.purchase',
        eventId: 'unauthorized',
        status: 'error',
        message: 'Unauthorized attempt to purchase domain'
      });
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Ensure tables exist
    await ensureCreditsTable();
    await ensureStripeLogsTable();

    const body = await req.json();
    const { domain, siteId, price }: { domain: string; siteId?: string; price?: number } = body;

    if (!domain || typeof domain !== 'string') {
      return NextResponse.json({ error: 'Domain is required' }, { status: 400 });
    }

    // Basic domain validation
    const domainRegex = /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    if (!domainRegex.test(domain)) {
      return NextResponse.json({ error: 'Invalid domain format' }, { status: 400 });
    }

    // Validate price
    if (!price || price <= 0) {
      return NextResponse.json({ error: 'Valid price is required' }, { status: 400 });
    }

    // Price should be in cents
    if (price < 100 || price > 50000) { // Between $1 and $500
      return NextResponse.json({ error: 'Invalid price range' }, { status: 400 });
    }

    // Generate project ID for the domain if siteId is provided
    let projectId: string | undefined;
    if (siteId) {
      projectId = `site-${siteId}`;
    }

    await logStripeEvent({
      eventType: 'domain.purchase',
      eventId: `domain_${domain}`,
      userId,
      amount: price / 100, // Convert cents to dollars for logging
      status: 'processing',
      message: `Starting domain purchase for ${domain}`,
      metadata: { domain, siteId, projectId, price }
    });

    // Create Stripe checkout session for domain purchase
    const stripe = getStripe();

    // Create or retrieve customer
    let customer;
    try {
      const customers = await stripe.customers.list({
        email: `${userId}@clerk.local`,
        limit: 1
      });

      if (customers.data.length > 0) {
        customer = customers.data[0];
      } else {
        customer = await stripe.customers.create({
          email: `${userId}@clerk.local`,
          metadata: {
            clerkUserId: userId,
          },
        });
      }
    } catch (error) {
      console.error('Error managing Stripe customer:', error);
    }

    const baseUrl = process.env.NODE_ENV === 'development'
      ? 'http://localhost:3000'
      : (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000');

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: {
            name: `Domain: ${domain}`,
            description: `Registration and setup for ${domain}`,
          },
          unit_amount: price,
        },
        quantity: 1,
      }],
      mode: 'payment',
      customer: customer?.id,
      success_url: `${baseUrl}/dashboard?domain_success=true&domain=${encodeURIComponent(domain)}&siteId=${siteId || ''}`,
      cancel_url: `${baseUrl}/dashboard?domain_canceled=true`,
      metadata: {
        userId,
        domain,
        siteId: siteId || '',
        type: 'domain_purchase',
      },
      allow_promotion_codes: true,
      billing_address_collection: 'auto',
    });

    await logStripeEvent({
      eventType: 'domain.checkout_created',
      eventId: session.id,
      userId,
      amount: price / 100, // Convert cents to dollars for logging
      status: 'success',
      message: `Created domain checkout session for ${domain}`,
      metadata: {
        domain,
        siteId,
        sessionUrl: session.url
      }
    });

    return NextResponse.json({ checkoutUrl: session.url });

    await logStripeEvent({
      eventType: 'domain.purchase',
      eventId: `domain_${domain}`,
      userId,
      amount: DOMAIN_PRICING.creditsCost,
      status: 'success',
      message: `Successfully purchased domain ${domain}`,
      metadata: {
        domain,
        siteId,
        projectId,
        verified: purchaseResult.verified,
        nameservers: purchaseResult.nameservers
      }
    });

  } catch (error) {
    const errorMessage = getErrorMessage(error);

    await logStripeEvent({
      eventType: 'domain.purchase',
      eventId: 'purchase_failed',
      userId: userId || 'unknown',
      status: 'error',
      message: `Failed to purchase domain: ${errorMessage}`,
      metadata: { error: errorMessage }
    });

    console.error('Error purchasing domain:', error);
    return NextResponse.json(
      { error: 'Failed to purchase domain' },
      { status: 500 }
    );
  }
}