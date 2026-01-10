// app/api/webhooks/domain-purchase/route.ts
import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import Stripe from 'stripe';
import { getStripe } from '@/lib/stripe';
import { purchaseDomain } from '@/lib/vercel';
import { updateSiteCustomDomain } from '@/lib/db';
import { logStripeEvent } from '@/lib/stripe-logger';

const stripe = getStripe();
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

export async function POST(req: Request) {
  try {
    const body = await req.text();
    const headersList = await headers();
    const sig = headersList.get('stripe-signature');

    if (!sig || !webhookSecret) {
      return NextResponse.json({ error: 'Webhook signature missing' }, { status: 400 });
    }

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;

      // Check if this is a domain purchase
      if (session.metadata?.type === 'domain_purchase') {
        const { userId, domain, siteId } = session.metadata;

        if (!domain || !userId) {
          console.error('Missing domain or userId in domain purchase metadata');
          return NextResponse.json({ error: 'Invalid metadata' }, { status: 400 });
        }

        await logStripeEvent({
          eventType: 'domain.webhook_received',
          eventId: event.id,
          userId,
          status: 'success',
          message: `Received domain purchase webhook for ${domain}`,
          metadata: { domain, siteId, sessionId: session.id }
        });

        try {
          // Purchase the domain from Vercel
          const projectId = siteId ? `site-${siteId}` : undefined;
          const purchaseResult = await purchaseDomain({
            domain,
            projectId,
          });

          // Update the site with the custom domain if siteId is provided
          if (siteId) {
            await updateSiteCustomDomain({
              id: siteId,
              userId,
              customDomain: domain,
            });
          }

        await logStripeEvent({
          eventType: 'domain.purchase_completed',
          eventId: event.id,
          userId,
          status: 'success',
          message: `Successfully purchased and configured domain ${domain} (NO auto-renewal)`,
          metadata: {
            domain,
            siteId,
            projectId,
            verified: purchaseResult.verified,
            nameservers: purchaseResult.nameservers,
            renewalDisabled: true, // Domains do NOT auto-renew
            renewalNote: 'Users must manually renew through Domain Management Dashboard'
          }
        });

        } catch (error) {
          console.error('Error purchasing domain from Vercel:', error);
          await logStripeEvent({
            eventType: 'domain.purchase_failed',
            eventId: event.id,
            userId,
            status: 'error',
            message: `Failed to purchase domain ${domain} from Vercel`,
            metadata: { domain, siteId, error: error instanceof Error ? error.message : String(error) }
          });
        }
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Domain purchase webhook error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}