// app/api/sites/[id]/route.ts
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { deleteSite, getSite, updateSiteCustomDomain } from '@/lib/db';
import { addSubdomainCNAME, removeSubdomainCNAME } from '@/lib/dns';
import { purchaseDomain, checkDomainAvailability, getDomainStatus } from '@/lib/vercel';

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Params) {
  // Skip authentication in development for easier testing
  const isDevelopment = process.env.NODE_ENV === 'development';
  const { userId } = isDevelopment ? { userId: 'dev-user' } : await auth();
  const { id } = await params;

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const site = await getSite({ id, userId });
    if (!site) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ site });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json({ error: e?.message ?? 'Failed to fetch site' }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: Params) {
  // Skip authentication in development for easier testing
  const isDevelopment = process.env.NODE_ENV === 'development';
  const { userId } = isDevelopment ? { userId: 'dev-user' } : await auth();
  const { id } = await params;

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await deleteSite({ id, userId });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json({ error: e?.message ?? 'Failed to delete site' }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: Params) {
  // Skip authentication in development for easier testing
  const isDevelopment = process.env.NODE_ENV === 'development';
  const { userId } = isDevelopment ? { userId: 'dev-user' } : await auth();
  const { id } = await params;

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { customDomain } = body;

    if (typeof customDomain !== 'string') {
      return NextResponse.json({ error: 'Invalid customDomain' }, { status: 400 });
    }

    // Get current site data to check if custom domain is changing
    const currentSite = await getSite({ id, userId });
    const currentCustomDomain = currentSite?.custom_domain;

    // Check if we're in shared project mode
    const isSharedProject = !!(process.env.VERCEL_PUBLISH_PROJECT || '').trim();

    // Validate domain format - allow both easyland.site subdomains and full custom domains
    const subdomainRegex = /^[a-zA-Z0-9-]+\.easyland\.site$/;
    const fullDomainRegex = /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

    const isSubdomain = customDomain && subdomainRegex.test(customDomain);
    const isFullDomain = customDomain && fullDomainRegex.test(customDomain) && !subdomainRegex.test(customDomain);

    if (customDomain && !isSubdomain && !isFullDomain) {
      return NextResponse.json({
        error: 'Invalid domain format. Use either a subdomain of easyland.site (e.g., mysite.easyland.site) or purchase a full custom domain.'
      }, { status: 400 });
    }

    // For full custom domains, verify domain ownership (domains are purchased separately)
    if (isFullDomain) {
      // Check if domain is actually owned by this Vercel account
      try {
        const domainStatus = await getDomainStatus(customDomain);
        if (!domainStatus.verified) {
          return NextResponse.json({
            error: `Domain ${customDomain} is not verified in your Vercel account. Please purchase the domain first.`
          }, { status: 400 });
        }
      } catch (error) {
        return NextResponse.json({
          error: 'Failed to verify domain ownership. Please try again.'
        }, { status: 500 });
      }

      console.log(`Domain ${customDomain} verified and ready to be assigned to site`);
    }

    // For subdomains, add DNS record (non-blocking)
    if (isSubdomain && customDomain !== currentCustomDomain) {
      console.log(`Setting subdomain: ${customDomain}`);
      const dnsSuccess = await addSubdomainCNAME(customDomain);
      if (!dnsSuccess) {
        console.warn('⚠️ DNS setup failed, but continuing with subdomain assignment');
        console.warn('⚠️ Subdomain may not work until DNS is properly configured');
      }
    }

    // Warn about shared project limitation for subdomains
    if (isSubdomain && isSharedProject) {
      console.warn('⚠️  Setting custom subdomain in shared Vercel project mode');
      console.warn('⚠️  This domain will serve the same content as all other domains');
      console.warn('⚠️  For proper custom domains, remove VERCEL_PUBLISH_PROJECT env var');
    }

    // If we're removing a custom domain, clean up if needed
    if (!customDomain && currentCustomDomain) {
      console.log(`Removing custom domain: ${currentCustomDomain}`);
      // Note: DNS removal is optional as the record can stay
      // For purchased domains, they remain in Vercel account
    }

    await updateSiteCustomDomain({
      id,
      userId,
      customDomain: customDomain || null
    });

    return NextResponse.json({ success: true });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json({ error: e?.message ?? 'Failed to update site' }, { status: 500 });
  }
}