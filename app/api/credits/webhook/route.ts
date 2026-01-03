// app/api/credits/webhook/route.ts
import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { getStripe } from '@/lib/stripe';
import { addCredits, ensureCreditsTable, ensureCreditTransactionsTable } from '@/lib/db';

export async function POST(req: Request) {
  try {
    // Ensure tables exist before processing webhook
    await ensureCreditsTable();
    await ensureCreditTransactionsTable();

    const body = await req.text();
    const headersList = await headers();
    const sig = headersList.get('stripe-signature');

    if (!sig) {
      return NextResponse.json({ error: 'No signature' }, { status: 400 });
    }

    const stripe = getStripe();
    let event: any;

    try {
      event = stripe.webhooks.constructEvent(
        body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET!
      );
    } catch (err: any) {
      console.error('Webhook signature verification failed:', err.message);
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const { userId, credits } = session.metadata;

      if (userId && credits) {
        await addCredits({
          userId,
          amount: parseInt(credits),
          type: 'purchase',
          description: `Purchased ${credits} credits`,
          stripePaymentId: session.payment_intent,
        });

        console.log(`Added ${credits} credits to user ${userId}`);
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}
