// app/api/contact/[siteId]/route.ts
import { NextResponse } from 'next/server';
import { auth, currentUser, clerkClient } from '@clerk/nextjs/server';
import { ensureContactSubmissionsTable, insertContactSubmission, getSitePublic, getContactSubmissions } from '@/lib/db';
import { Resend } from 'resend';
import { analytics } from '@/lib/mixpanel';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

function withCors(resp: NextResponse) {
  resp.headers.set('Access-Control-Allow-Origin', '*');
  resp.headers.set('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  resp.headers.set('Access-Control-Allow-Headers', 'Content-Type, Accept');
  resp.headers.set('Access-Control-Max-Age', '86400');
  return resp;
}

export async function OPTIONS() {
  // Needed for cross-origin fetch() from published landing pages.
  return withCors(new NextResponse(null, { status: 204 }));
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ siteId: string }> }
) {
  try {
    const { siteId } = await params;

    // 1. Validate site exists first (publicly)
    const site = await getSitePublic(siteId);
    if (!site) {
      return withCors(NextResponse.json({ error: 'Site not found' }, { status: 404 }));
    }

    // Handle both JSON and form-encoded data
    const contentType = req.headers.get('content-type');
    let name, email, message;

    if (contentType?.includes('application/json')) {
      const body = await req.json();
      ({ name, email, message } = body);
    } else {
      // Handle form-encoded data
      const formData = await req.formData();
      name = formData.get('name')?.toString();
      email = formData.get('email')?.toString();
      message = formData.get('message')?.toString();
    }

    // Basic validation
    if (!name?.trim() || !email?.trim() || !message?.trim()) {
      return withCors(NextResponse.json(
        { error: 'Name, email, and message are required' },
        { status: 400 }
      ));
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return withCors(NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      ));
    }

    // Ensure database table exists
    await ensureContactSubmissionsTable();

    // Store the submission
    await insertContactSubmission({
      siteId,
      name: name.trim(),
      email: email.trim(),
      message: message.trim(),
    });

    // Track lead submitted in Mixpanel
    try {
      analytics.leadSubmitted(siteId, site.title || 'Untitled Site', email.trim());
    } catch (e) {
      console.warn('Failed to track lead submission in Mixpanel:', e);
    }

    // Send email notification if Resend is configured
    if (resend && site.user_id) {
      try {
        // Get user's email from Clerk using the site owner's ID
        const client = await clerkClient();
        const owner = await client.users.getUser(site.user_id);
        const ownerEmail = owner?.emailAddresses.find(e => e.id === owner.primaryEmailAddressId)?.emailAddress 
                        || owner?.emailAddresses[0]?.emailAddress;

        if (ownerEmail) {
          await resend.emails.send({
            from: 'Contact Forms <noreply@yourdomain.com>', // You'll need to configure this
            to: ownerEmail,
            subject: `New contact form submission: ${site.title || 'Landing Page'}`,
            html: `
              <h2>New Contact Form Submission</h2>
              <p><strong>Site:</strong> ${site.title || 'Untitled'}</p>
              <p><strong>Name:</strong> ${name}</p>
              <p><strong>Email:</strong> ${email}</p>
              <p><strong>Message:</strong></p>
              <p>${message.replace(/\n/g, '<br>')}</p>
              <hr>
              <p><small>Submitted at: ${new Date().toLocaleString()}</small></p>
            `,
          });
        }
      } catch (emailError) {
        console.error('Failed to send email notification:', emailError);
        // Don't fail the request if email fails
      }
    }

    // Check if this is an HTML form submission (not JSON)
    const acceptHeader = req.headers.get('accept');
    const isHtmlRequest = acceptHeader?.includes('text/html') ||
                         contentType?.includes('application/x-www-form-urlencoded');

    if (isHtmlRequest) {
      // Redirect back with success message
      // Note: req.url might be the API URL, we want to redirect back to the referrer if possible,
      // or just add a param to the current URL if it's the landing page itself.
      const referrer = req.headers.get('referer');
      if (referrer) {
        const successUrl = new URL(referrer);
        successUrl.searchParams.set('submitted', 'true');
        return withCors(NextResponse.redirect(successUrl.toString()));
      }
      
      const successUrl = new URL(req.url);
      successUrl.searchParams.set('submitted', 'true');
      return withCors(NextResponse.redirect(successUrl.origin + successUrl.pathname + '?submitted=true'));
    }

    return withCors(NextResponse.json({
      success: true,
      message: 'Contact form submitted successfully'
    }));

  } catch (e: any) {
    console.error('Contact form submission error:', e);
    return withCors(NextResponse.json(
      { error: e?.message ?? 'Failed to submit contact form' },
      { status: 500 }
    ));
  }
}

// GET endpoint to retrieve submissions for a site owner
export async function GET(
  req: Request,
  { params }: { params: Promise<{ siteId: string }> }
) {
  try {
    // Skip authentication in development for easier testing
    const isDevelopment = process.env.NODE_ENV === 'development';
    const { userId } = isDevelopment ? { userId: 'dev-user' } : await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { siteId } = await params;
    const submissions = await getContactSubmissions({ siteId, userId });

    return NextResponse.json({ submissions });

  } catch (e: any) {
    console.error('Failed to fetch contact submissions:', e);
    return NextResponse.json(
      { error: e?.message ?? 'Failed to fetch submissions' },
      { status: 500 }
    );
  }
}
