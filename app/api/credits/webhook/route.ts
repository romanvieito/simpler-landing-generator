// app/api/credits/webhook/route.ts
import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { getStripe } from '@/lib/stripe';
import { addCredits, ensureCreditsTable, ensureCreditTransactionsTable, setPendingConversion } from '@/lib/db';
import { logStripeEvent, ensureStripeLogsTable, getStripeLogsByType } from '@/lib/stripe-logger';
import { analytics } from '@/lib/mixpanel';

// Helper function to safely get error message
const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
};

export async function POST(req: Request) {
  let event: any;
  let body: string;

  try {
    // Ensure all required tables exist
    await ensureCreditsTable();
    await ensureCreditTransactionsTable();
    await ensureStripeLogsTable();

    body = await req.text();
    const headersList = await headers();
    const sig = headersList.get('stripe-signature');
    const stripe = getStripe();

    if (!sig) {
      await logStripeEvent({
        eventType: 'webhook_error',
        eventId: 'no_signature_' + Date.now(),
        status: 'error',
        message: 'Webhook received without signature'
      });
      return NextResponse.json({ error: 'No signature' }, { status: 400 });
    }

    // Verify webhook signature
    try {
      event = stripe.webhooks.constructEvent(
        body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET!
      );
    } catch (err: any) {
      await logStripeEvent({
        eventType: 'webhook_error',
        eventId: 'sig_fail_' + Date.now(),
        status: 'error',
        message: `Webhook signature verification failed: ${err.message}`,
        metadata: { signature: sig?.substring(0, 20) + '...' }
      });
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    // Check if event was already successfully processed
    // We use the database for this instead of a memory Set
    try {
      const existingLogs = await getStripeLogsByType(event.type, 50);
      const isProcessed = existingLogs.some(log => log.event_id === event.id && log.status === 'success' && log.message.includes('Successfully processed'));
      
      if (isProcessed) {
        console.log(`Event ${event.id} already processed, skipping.`);
        return NextResponse.json({ received: true, status: 'already_processed' });
      }
    } catch (e) {
      console.warn('Error checking idempotency, continuing anyway:', e);
    }

    // Initial log of receipt
    await logStripeEvent({
      eventType: event.type,
      eventId: event.id,
      status: 'warning', // 'warning' while processing
      message: `Processing webhook event: ${event.type}`,
      metadata: {
        created: event.created,
        livemode: event.livemode,
        apiVersion: event.api_version
      }
    });

    // Handle different event types
    const result = await handleWebhookEvent(event);

    // Final log of success
    await logStripeEvent({
      eventType: event.type,
      eventId: event.id,
      userId: (result as any).userId || undefined,
      sessionId: (result as any).sessionId || undefined,
      amount: (result as any).credits ? parseInt((result as any).credits) : undefined,
      status: 'success',
      message: `Successfully processed webhook event: ${event.type}`,
      metadata: { ...(result as any), eventId: event.id }
    });

    return NextResponse.json({
      received: true,
      eventId: event.id,
      type: event.type,
      result
    });

  } catch (error) {
    console.error('Webhook processing error:', error);

    // Log the error
    if (event) {
      await logStripeEvent({
        eventType: event.type || 'unknown',
        eventId: event.id || 'unknown_err_' + Date.now(),
        status: 'error',
        message: `Webhook processing failed: ${getErrorMessage(error)}`,
        metadata: {
          error: getErrorMessage(error),
          stack: error instanceof Error ? error.stack : undefined,
          eventData: event
        }
      });
    } else {
      await logStripeEvent({
        eventType: 'webhook_error',
        eventId: 'unknown_crash_' + Date.now(),
        status: 'error',
        message: `Webhook processing failed before event parsing: ${getErrorMessage(error)}`
      });
    }

    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}

async function handleWebhookEvent(event: any) {
  const stripe = getStripe();

  switch (event.type) {
    case 'checkout.session.completed':
      return await handleCheckoutSessionCompleted(event.data.object, stripe);

    case 'checkout.session.async_payment_succeeded':
      return await handleAsyncPaymentSucceeded(event.data.object, stripe);

    case 'checkout.session.async_payment_failed':
      return await handleAsyncPaymentFailed(event.data.object, stripe);

    default:
      console.log(`Unhandled event type: ${event.type}`);
      return { status: 'unhandled_event_type', type: event.type };
  }
}

async function handleCheckoutSessionCompleted(session: any, stripe: any) {
  try {
    const metadata = session.metadata || {};
    const { userId, credits, packageType } = metadata;

    if (!userId || !credits) {
      console.error('Missing metadata in session:', session.id, metadata);
      return { 
        status: 'missing_metadata', 
        userId: userId || 'unknown', 
        credits: credits || 'unknown',
        sessionId: session.id 
      };
    }

    // Double-check payment was successful
    if (session.payment_status !== 'paid') {
      console.warn('Payment not completed for session:', session.id, session.payment_status);
      return { status: 'payment_not_completed', paymentStatus: session.payment_status, sessionId: session.id };
    }

    // Add credits to user account
    const result = await addCredits({
      userId,
      amount: parseInt(credits),
      type: 'purchase',
      description: `Purchased ${credits} credits (${packageType || 'custom'})`,
      stripePaymentId: session.payment_intent || session.id,
    });

    // Track credits purchased in Mixpanel
    try {
      const amount = session.amount_total / 100; // Convert from cents to dollars
      analytics.creditsPurchased(amount, parseInt(credits), session.id);
    } catch (e) {
      console.warn('Failed to track credits purchase in Mixpanel:', e);
    }

    // Set pending conversion for Google Ads
    try {
      const amount = session.amount_total / 100;
      await setPendingConversion({ userId, amount });
    } catch (e) {
      console.warn('Failed to set pending conversion flag', e);
    }

    // Update customer metadata if we have a customer
    if (session.customer && typeof session.customer === 'string') {
      try {
        // We don't try to read old metadata to avoid expansion issues, 
        // Stripe will keep other metadata fields intact.
        await stripe.customers.update(session.customer, {
          metadata: {
            lastPurchase: new Date().toISOString(),
            clerkUserId: userId
          },
        });
      } catch (error) {
        console.warn('Failed to update customer metadata:', getErrorMessage(error));
        // Don't fail the whole process if just customer metadata update fails
      }
    }

    return {
      status: 'credits_added',
      userId,
      credits: parseInt(credits),
      newBalance: result,
      sessionId: session.id
    };

  } catch (error) {
    console.error('Error in handleCheckoutSessionCompleted:', error);
    throw error;
  }
}

async function handleAsyncPaymentSucceeded(session: any, stripe: any) {
  console.log(`Async payment succeeded for session ${session.id}`);
  return await handleCheckoutSessionCompleted(session, stripe);
}

async function handleAsyncPaymentFailed(session: any, stripe: any) {
  console.error(`Async payment failed for session ${session.id}`);
  return {
    status: 'async_payment_failed',
    sessionId: session.id,
    reason: session.payment_status
  };
}
