// app/api/publish/route.ts
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { deployStaticHtml } from '@/lib/vercel';
import { makeSlug } from '@/lib/utils';
import { updateSiteUrl } from '@/lib/db';

export async function POST(req: Request) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json() as { html: string; nameHint?: string; siteId?: string | null };
    const { html, nameHint, siteId } = body;

    if (!html || typeof html !== 'string') {
      return NextResponse.json({ error: 'Missing HTML' }, { status: 400 });
    }

    // Replace relative API URLs with absolute URLs pointing to the main app
    const appUrl = process.env.NEXT_PUBLIC_APP_URL;
    let processedHtml = html;

    // 1. First, handle SITE_ID_PLACEHOLDER if it exists (handles both literal and URL-encoded versions)
    if (siteId) {
      // Replace the placeholder with the actual contact API path
      // We handle {{SITE_ID_PLACEHOLDER}}, %7B%7BSITE_ID_PLACEHOLDER%7D%7D, and variations
      processedHtml = processedHtml.replace(
        /(\{\{SITE_ID_PLACEHOLDER\}\}|%7B%7BSITE_ID_PLACEHOLDER%7D%7D)/g,
        `/api/contact/${siteId}`
      );
    }

    // 2. Then convert all relative /api/contact/ URLs to absolute if appUrl is available
    if (appUrl) {
      // Ensure appUrl doesn't have a trailing slash for consistency
      const baseUrl = appUrl.endsWith('/') ? appUrl.slice(0, -1) : appUrl;
      
      processedHtml = processedHtml.replace(
        /href="\/api\/contact\//g,
        `href="${baseUrl}/api/contact/`
      ).replace(
        /action="\/api\/contact\//g,
        `action="${baseUrl}/api/contact/`
      ).replace(
        /src="\/api\/contact\//g,
        `src="${baseUrl}/api/contact/`
      );

      // Also catch any other /api/contact/ instances not in attributes
      processedHtml = processedHtml.replace(
        /(?<![a-zA-Z0-9])\/api\/contact\//g,
        `${baseUrl}/api/contact/`
      );
    }

    const slug = makeSlug(nameHint || 'landing');
    const name = `${slug}-${Math.random().toString(36).slice(2, 7)}`;

    const url = await deployStaticHtml({ name, html: processedHtml });

    if (siteId) {
      try {
        await updateSiteUrl({ id: siteId, userId, vercelUrl: url } as any);
      } catch (e) {
        // non-fatal
        console.warn('Failed to update site with published URL', e);
      }
    }

    return NextResponse.json({ url });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json({ error: e?.message ?? 'Failed to publish' }, { status: 500 });
  }
}
