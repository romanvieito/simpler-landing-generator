// app/api/subdomain-handler/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getSiteByCustomDomain, getSiteBySubdomain } from '@/lib/db';

export async function GET(request: NextRequest) {
  const host = request.headers.get('host') || '';
  console.log('Subdomain handler called for host:', host);

  // Extract subdomain from host
  const subdomain = host.replace(/\.easyland\.site$/, '');

  if (!subdomain || subdomain === 'easyland' || subdomain === 'www') {
    // Root domain - redirect to main app or show default content
    return NextResponse.redirect(new URL('/', request.url));
  }

  try {
    const fullDomain = `${subdomain}.easyland.site`;

    // First try to find site by custom domain (for purchased custom domains)
    let site = await getSiteByCustomDomain(fullDomain);

    // If not found by custom domain, try to find by subdomain (for published sites)
    if (!site) {
      site = await getSiteBySubdomain(fullDomain);
    }

    if (!site || !site.html) {
      // Site not found - show 404 or default content
      const notFoundHtml = `
        <!DOCTYPE html>
        <html>
          <head>
            <title>Site Not Found</title>
            <style>
              body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
              h1 { color: #666; }
            </style>
          </head>
          <body>
            <h1>Site Not Found</h1>
            <p>The site <strong>${fullDomain}</strong> doesn't exist yet.</p>
            <p>Create your landing page at <a href="https://easyland.site">easyland.site</a></p>
          </body>
        </html>
      `;
      return new NextResponse(notFoundHtml, {
        status: 404,
        headers: { 'Content-Type': 'text/html' }
      });
    }

    // Return the site's HTML
    return new NextResponse(site.html, {
      status: 200,
      headers: { 'Content-Type': 'text/html' }
    });

  } catch (error) {
    console.error('Error in subdomain handler:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}