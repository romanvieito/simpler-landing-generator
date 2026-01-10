import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

/**
 * Clerk middleware: protect authenticated app APIs, but keep certain endpoints public.
 *
 * Public endpoints (must work from published landing pages / third-party services):
 * - Contact form submissions: /api/contact/:siteId (POST)
 * - Stripe webhook: /api/credits/webhook (POST)
 */
const isProtectedApiRoute = createRouteMatcher(["/api/(.*)"]);
const isPublicApiRoute = createRouteMatcher([
  "/api/contact(.*)",
  "/api/credits/webhook(.*)",
  "/api/test-env(.*)",
  "/api/credits/create-checkout-session(.*)", // Allow checkout creation for testing
  "/api/credits/balance(.*)", // Allow balance checking for testing
  "/api/subdomain-handler(.*)", // Allow subdomain handler for published sites
]);

// Disable Clerk protection in development for easier testing
const isDevelopment = process.env.NODE_ENV === 'development';

export default clerkMiddleware(async (auth, request) => {
  // Handle subdomain routing for easyland.site
  const host = request.headers.get('host') || '';

  // Check if this is a subdomain (not the root domain or www)
  const isSubdomain = host.endsWith('.easyland.site') &&
                     host !== 'easyland.site' &&
                     !host.startsWith('www.');

  console.log('Middleware check:', { host, isSubdomain, pathname: request.nextUrl.pathname });

  if (isSubdomain && request.nextUrl.pathname === '/') {
    console.log('Rewriting subdomain request to handler');
    // Rewrite subdomain requests to the subdomain handler
    return NextResponse.rewrite(new URL('/api/subdomain-handler', request.url));
  }

  // Skip authentication in development for easier testing
  if (isDevelopment) return;

  if (!isProtectedApiRoute(request)) return;
  if (isPublicApiRoute(request)) return;
  await auth.protect();
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};

