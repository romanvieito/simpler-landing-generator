// app/api/credits/create-checkout-session/route.ts
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getStripe, CREDIT_PACKAGES, type CreditPackage, validateStripeConfig } from '@/lib/stripe';
import { ensureCreditsTable, ensureCreditTransactionsTable } from '@/lib/db';
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
  let packageType: CreditPackage | null = null;

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
        eventType: 'checkout_session.create',
        eventId: 'unauthorized',
        status: 'error',
        message: 'Unauthorized attempt to create checkout session'
      });
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Ensure tables exist
    await ensureCreditsTable();
    await ensureCreditTransactionsTable();
    await ensureStripeLogsTable();

    const body = await req.json();
    const { packageType: requestedPackageType, quantity: requestedQuantity }: { packageType?: CreditPackage; quantity?: number } = body;

    let packageType: CreditPackage | null = null;
    let credits: number;
    let price: number; // in cents
    let packageName: string;
    let packageDescription: string;

    if (requestedPackageType) {
      // Using predefined package
      packageType = requestedPackageType;
      if (!CREDIT_PACKAGES[packageType]) {
        await logStripeEvent({
          eventType: 'checkout_session.create',
          eventId: 'invalid_package',
          userId,
          status: 'error',
          message: `Invalid package type requested: ${packageType}`
        });
        return NextResponse.json({ error: 'Invalid package type' }, { status: 400 });
      }
      const pkg = CREDIT_PACKAGES[packageType];
      credits = pkg.credits;
      price = pkg.price;
      packageName = pkg.name;
      packageDescription = pkg.description;
    } else if (requestedQuantity && requestedQuantity > 0) {
      // Custom quantity - $1 per credit
      credits = requestedQuantity;
      price = credits * 100; // $1 per credit in cents
      packageName = `${credits} Credits`;
      packageDescription = 'Custom credit package';
    } else {
      return NextResponse.json({ error: 'Either packageType or quantity must be provided' }, { status: 400 });
    }

    // Validate Stripe configuration (skip in development for UI testing)
    try {
      validateStripeConfig();
    } catch (error) {
      if (process.env.NODE_ENV !== 'development') {
        throw error;
      }
      // In development, log the warning but continue
      console.warn('Stripe configuration warning:', getErrorMessage(error));
    }

    const stripe = getStripe();

    // Create or retrieve customer
    let customer;
    try {
      // Try to find existing customer by userId in metadata
      const customers = await stripe.customers.list({
        email: `${userId}@clerk.local`, // Use a placeholder email based on userId
        limit: 1
      });

      if (customers.data.length > 0) {
        customer = customers.data[0];
        await logStripeEvent({
          eventType: 'customer.found',
          eventId: `customer_${customer.id}`,
          userId,
          status: 'success',
          message: 'Found existing Stripe customer',
          metadata: { customerId: customer.id }
        });
      } else {
        // Create new customer
        customer = await stripe.customers.create({
          email: `${userId}@clerk.local`,
          metadata: {
            clerkUserId: userId,
          },
        });
        await logStripeEvent({
          eventType: 'customer.created',
          eventId: `customer_${customer.id}`,
          userId,
          status: 'success',
          message: 'Created new Stripe customer',
          metadata: { customerId: customer.id }
        });
      }
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      await logStripeEvent({
        eventType: 'customer.error',
        eventId: 'customer_management_failed',
        userId,
        status: 'warning',
        message: `Error managing Stripe customer: ${errorMessage}`,
        metadata: { error: errorMessage }
      });
      // Continue without customer for now
    }

    // Get the base URL for success/cancel URLs
    // In development, always use localhost regardless of env var
    const baseUrl = process.env.NODE_ENV === 'development'
      ? 'http://localhost:3000'
      : (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000');

    // Create checkout session - use price_data in development or for custom quantities
    const isDevelopment = process.env.NODE_ENV === 'development';
    const usePriceData = isDevelopment || !packageType; // Always use price_data for custom quantities or in development

    const lineItem = usePriceData ? {
      price_data: {
        currency: 'usd',
        product_data: {
          name: packageName,
          description: packageDescription,
        },
        unit_amount: price,
      },
      quantity: 1,
    } : {
      price: CREDIT_PACKAGES[packageType!].priceId,
      quantity: 1,
    };

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [lineItem],
      mode: 'payment',
      customer: customer?.id,
      success_url: `${baseUrl}/?success=true&session_id={CHECKOUT_SESSION_ID}&credits=${credits}`,
      cancel_url: `${baseUrl}/?canceled=true`,
      metadata: {
        userId,
        packageType: packageType || 'custom',
        credits: credits.toString(),
      },
      allow_promotion_codes: true, // Allow discount codes
      billing_address_collection: 'auto',
      invoice_creation: {
        enabled: true, // Create invoices for better record keeping
      },
    });

    await logStripeEvent({
      eventType: 'checkout_session.created',
      eventId: session.id,
      userId,
      amount: credits,
      status: 'success',
      message: `Created checkout session for ${credits} credits`,
      metadata: {
        packageType: packageType || 'custom',
        customerId: customer?.id,
        sessionUrl: session.url
      }
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    const errorMessage = getErrorMessage(error);
    const stackTrace = error instanceof Error ? error.stack : undefined;

    await logStripeEvent({
      eventType: 'checkout_session.create',
      eventId: 'creation_failed',
      userId: userId || 'unknown',
      status: 'error',
      message: `Failed to create checkout session: ${errorMessage}`,
      metadata: {
        packageType,
        error: errorMessage,
        stack: stackTrace
      }
    });

    console.error('Error creating checkout session:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
