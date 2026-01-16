import { NextRequest, NextResponse } from 'next/server';
import { Webhook } from 'svix';
import { headers } from 'next/headers';
import { analytics } from '@/lib/mixpanel';

/**
 * Clerk webhook endpoint for tracking user authentication events
 * Handles user.created and session.created events
 */

const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;

export async function POST(request: NextRequest) {
  if (!webhookSecret) {
    console.error('CLERK_WEBHOOK_SECRET not configured');
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 500 });
  }

  // Get the headers
  const headerPayload = await headers();
  const svix_id = headerPayload.get('svix-id');
  const svix_timestamp = headerPayload.get('svix-timestamp');
  const svix_signature = headerPayload.get('svix-signature');

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return NextResponse.json({ error: 'Missing webhook headers' }, { status: 400 });
  }

  // Get the body
  const payload = await request.json();
  const body = JSON.stringify(payload);

  // Verify the webhook signature
  const wh = new Webhook(webhookSecret);

  let evt: any;

  try {
    evt = wh.verify(body, {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature,
    }) as any;
  } catch (err) {
    console.error('Error verifying webhook:', err);
    return NextResponse.json({ error: 'Webhook verification failed' }, { status: 400 });
  }

  const { type, data } = evt;

  try {
    switch (type) {
      case 'user.created':
        // User signed up
        console.log('🎉 User signed up:', data.id);
        analytics.userSignedUp(data.id, data.email_addresses?.[0]?.email_address || `${data.id}@clerk.local`);
        break;

      case 'session.created':
        // User signed in (session created)
        console.log('🔑 User signed in:', data.user_id);
        // Note: We don't have immediate access to email in session events, so we'll use a placeholder
        // The email will be updated when the user is identified in the MixpanelProvider
        analytics.userSignedIn(data.user_id, `${data.user_id}@clerk.local`);
        break;

      default:
        console.log('📨 Unhandled webhook event type:', type);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error processing webhook:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}