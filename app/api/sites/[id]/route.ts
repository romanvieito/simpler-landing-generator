// app/api/sites/[id]/route.ts
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { deleteSite, getSite, updateSiteCustomDomain } from '@/lib/db';
import { addSubdomainCNAME, removeSubdomainCNAME } from '@/lib/dns';

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Params) {
  const { userId } = await auth();
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
  const { userId } = await auth();
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
  const { userId } = await auth();
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

    // Validate subdomain format
    const domainRegex = /^[a-zA-Z0-9-]+\.easyland\.site$/;
    if (customDomain && !domainRegex.test(customDomain)) {
      return NextResponse.json({
        error: 'Custom domain must be a subdomain of easyland.site (e.g., mysite.easyland.site)'
      }, { status: 400 });
    }

    // Warn about shared project limitation
    if (customDomain && isSharedProject) {
      console.warn('⚠️  Setting custom domain in shared Vercel project mode');
      console.warn('⚠️  This domain will serve the same content as all other domains');
      console.warn('⚠️  For proper custom domains, remove VERCEL_PUBLISH_PROJECT env var');
    }

    // If we're setting a new custom domain, add DNS record
    if (customDomain && customDomain !== currentCustomDomain) {
      console.log(`Setting custom domain: ${customDomain}`);
      const dnsSuccess = await addSubdomainCNAME(customDomain);
      if (!dnsSuccess) {
        return NextResponse.json({
          error: 'Failed to configure DNS for custom domain. Please try again.'
        }, { status: 500 });
      }
    }

    // If we're removing a custom domain, remove DNS record
    if (!customDomain && currentCustomDomain) {
      console.log(`Removing custom domain: ${currentCustomDomain}`);
      // Note: DNS removal is optional as the record can stay
      // await removeSubdomainCNAME(currentCustomDomain);
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
