// app/api/credits/webhook/route.ts
import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { getStripe } from '@/lib/stripe';
import { addCredits, ensureCreditsTable, ensureCreditTransactionsTable } from '@/lib/db';
import { logStripeEvent, ensureStripeLogsTable } from '@/lib/stripe-logger';

// Helper function to safely get error message
const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
};

// Store processed event IDs to handle idempotency
const processedEvents = new Set<string>();

export async function POST(req: Request) {
  let event: any;

  try {
    // Ensure all required tables exist
    await ensureCreditsTable();
    await ensureCreditTransactionsTable();
    await ensureStripeLogsTable();

    const body = await req.text();
    const headersList = await headers();
    const sig = headersList.get('stripe-signature');
    const stripe = getStripe();

    if (!sig) {
      await logStripeEvent({
        eventType: 'webhook_error',
        eventId: 'no_signature',
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
        eventId: 'signature_verification_failed',
        status: 'error',
        message: `Webhook signature verification failed: ${err.message}`
      });
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    // Check for idempotency - skip if already processed
    if (processedEvents.has(event.id)) {
      await logStripeEvent({
        eventType: event.type,
        eventId: event.id,
        status: 'warning',
        message: 'Event already processed (idempotency check)'
      });
      return NextResponse.json({ received: true, status: 'already_processed' });
    }

    await logStripeEvent({
      eventType: event.type,
      eventId: event.id,
      status: 'success',
      message: `Processing webhook event: ${event.type}`,
      metadata: {
        created: event.created,
        livemode: event.livemode
      }
    });

    // Handle different event types
    const result = await handleWebhookEvent(event);

    // Mark event as processed
    processedEvents.add(event.id);

    // Clean up old processed events (keep last 1000)
    if (processedEvents.size > 1000) {
      const toDelete = Array.from(processedEvents).slice(0, 100);
      toDelete.forEach(id => processedEvents.delete(id));
    }

    await logStripeEvent({
      eventType: event.type,
      eventId: event.id,
      userId: (result as any).userId || undefined,
      sessionId: (result as any).sessionId || undefined,
      amount: (result as any).credits ? parseInt((result as any).credits) : undefined,
      status: 'success',
      message: `Successfully processed webhook event: ${event.type}`,
      metadata: result
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
        eventId: event.id || 'unknown',
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
        eventId: 'unknown',
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

    case 'invoice.payment_succeeded':
      return await handleInvoicePaymentSucceeded(event.data.object, stripe);

    case 'invoice.payment_failed':
      return await handleInvoicePaymentFailed(event.data.object, stripe);

    case 'customer.subscription.created':
    case 'customer.subscription.updated':
    case 'customer.subscription.deleted':
      // Handle subscription events if needed in the future
      console.log(`Subscription event: ${event.type}`);
      return { status: 'subscription_event_handled' };

    default:
      console.log(`Unhandled event type: ${event.type}`);
      return { status: 'unhandled_event_type' };
  }
}

async function handleCheckoutSessionCompleted(session: any, stripe: any) {
  try {
    const { userId, credits, packageType } = session.metadata;

    if (!userId || !credits) {
      await logStripeEvent({
        eventType: 'checkout.session.completed',
        eventId: session.id,
        status: 'error',
        message: 'Checkout session missing required metadata',
        metadata: { userId, credits, packageType, sessionId: session.id }
      });
      return { status: 'missing_metadata', userId, credits };
    }

    // Double-check payment was successful
    if (session.payment_status !== 'paid') {
      await logStripeEvent({
        eventType: 'checkout.session.completed',
        eventId: session.id,
        userId,
        status: 'warning',
        message: `Checkout session payment not completed: ${session.payment_status}`,
        metadata: { sessionId: session.id, paymentStatus: session.payment_status }
      });
      return { status: 'payment_not_completed', paymentStatus: session.payment_status };
    }

    // Add credits to user account
    const result = await addCredits({
      userId,
      amount: parseInt(credits),
      type: 'purchase',
      description: `Purchased ${credits} credits (${packageType})`,
      stripePaymentId: session.payment_intent,
    });

    await logStripeEvent({
      eventType: 'checkout.session.completed',
      eventId: session.id,
      userId,
      amount: parseInt(credits),
      status: 'success',
      message: `Successfully added ${credits} credits to user account`,
      metadata: {
        sessionId: session.id,
        packageType,
        newBalance: result,
        paymentIntent: session.payment_intent
      }
    });

    // Update customer metadata if we have a customer
    if (session.customer) {
      try {
        await stripe.customers.update(session.customer, {
          metadata: {
            lastPurchase: new Date().toISOString(),
            totalCreditsPurchased: (parseInt(session.customer.metadata?.totalCreditsPurchased || '0') + parseInt(credits)).toString(),
          },
        });
        await logStripeEvent({
          eventType: 'customer.metadata.updated',
          eventId: session.id,
          userId,
          status: 'success',
          message: 'Updated customer metadata with purchase info',
          metadata: { customerId: session.customer }
        });
      } catch (error) {
        await logStripeEvent({
          eventType: 'customer.metadata.update_failed',
          eventId: session.id,
          userId,
          status: 'warning',
          message: `Failed to update customer metadata: ${getErrorMessage(error)}`,
          metadata: { customerId: session.customer, error: getErrorMessage(error) }
        });
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
    await logStripeEvent({
      eventType: 'checkout.session.completed',
      eventId: session.id || 'unknown',
      userId: session.metadata?.userId,
      status: 'error',
      message: `Error processing checkout session: ${getErrorMessage(error)}`,
      metadata: { error: getErrorMessage(error), stack: error instanceof Error ? error.stack : undefined, sessionData: session }
    });
    throw error;
  }
}

async function handleAsyncPaymentSucceeded(session: any, stripe: any) {
  console.log(`Async payment succeeded for session ${session.id}`);
  // Handle async payment success (e.g., bank transfers, etc.)
  // For now, treat it the same as completed checkout
  return await handleCheckoutSessionCompleted(session, stripe);
}

async function handleAsyncPaymentFailed(session: any, stripe: any) {
  console.error(`Async payment failed for session ${session.id}`);
  // Log the failure - we might want to send notifications or take other actions
  return {
    status: 'async_payment_failed',
    sessionId: session.id,
    reason: session.payment_status
  };
}

async function handleInvoicePaymentSucceeded(invoice: any, stripe: any) {
  console.log(`Invoice payment succeeded: ${invoice.id}`);
  // Invoice payments are automatically handled by checkout.session.completed
  // This is just for additional logging/monitoring
  return { status: 'invoice_payment_succeeded', invoiceId: invoice.id };
}

async function handleInvoicePaymentFailed(invoice: any, stripe: any) {
  console.error(`Invoice payment failed: ${invoice.id}`);
  // Log failed invoice payments for manual review
  return {
    status: 'invoice_payment_failed',
    invoiceId: invoice.id,
    customerId: invoice.customer
  };
}
