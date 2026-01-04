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

    if (appUrl) {
      // Replace relative /api/contact/ URLs with absolute URLs
      processedHtml = html.replace(
        /\/api\/contact\/([^"'\s]+)/g,
        `${appUrl}/api/contact/$1`
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
