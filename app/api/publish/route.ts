// app/api/publish/route.ts
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { deployStaticHtml } from '@/lib/vercel';
import { updateSiteUrl } from '@/lib/db';

export async function POST(req: Request) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json() as { html: string; nameHint?: string; siteId?: string | null; exactName?: boolean };
    const { html, nameHint, siteId, exactName } = body;

    if (!html || typeof html !== 'string') {
      return NextResponse.json({ error: 'Missing HTML' }, { status: 400 });
    }

    if (!siteId) {
      return NextResponse.json({ error: 'Missing siteId - site must be saved before publishing' }, { status: 400 });
    }

    // Replace relative API URLs with absolute URLs pointing to the main app
    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined);
    if (!appUrl) {
      return NextResponse.json(
        { error: 'Server configuration error: NEXT_PUBLIC_APP_URL not set' },
        { status: 500 }
      );
    }

    let processedHtml = html;

    // 1. First, handle SITE_ID_PLACEHOLDER if it exists (handles both literal and URL-encoded versions)
    // Replace the placeholder with the actual contact API path
    processedHtml = processedHtml.replace(
      /(\{\{SITE_ID_PLACEHOLDER\}\}|%7B%7BSITE_ID_PLACEHOLDER%7D%7D)/g,
      `/api/contact/${siteId}`
    );

    // 2. Then convert all relative /api/contact/ URLs (HTML attrs + inline JS fetch URLs) to absolute URLs
    // Ensure appUrl doesn't have a trailing slash for consistency
    const baseUrl = appUrl.endsWith('/') ? appUrl.slice(0, -1) : appUrl;

    // Replace occurrences that are inside quotes (covers action/href/src/fetch URLs etc).
    // Avoids touching already-absolute URLs (they won't match because they won't start with "/api/...").
    processedHtml = processedHtml.replace(
      /(["'])\/api\/contact\//g,
      `$1${baseUrl}/api/contact/`
    );

    // Publish target project:
    // - If VERCEL_PUBLISH_PROJECT is set, we deploy all sites into a single dedicated Vercel project.
    //   This avoids creating a new project per site and makes "Deployment Protection" a one-time setting.
    // - Otherwise (backward compatible), we create/use a per-site project name.
    // - If exactName is true, use nameHint as the project name for URL renaming.
    const sharedProject = (process.env.VERCEL_PUBLISH_PROJECT || '').trim();
    const name = sharedProject || (exactName && nameHint ? nameHint : `site-${siteId}`);

    const url = await deployStaticHtml({
      name,
      html: processedHtml,
      alias: exactName ? nameHint : undefined
    });

    try {
      await updateSiteUrl({ id: siteId, userId, vercelUrl: url } as any);
    } catch (e) {
      // non-fatal
      console.warn('Failed to update site with published URL', e);
    }

    return NextResponse.json({ url });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json({ error: e?.message ?? 'Failed to publish' }, { status: 500 });
  }
}
