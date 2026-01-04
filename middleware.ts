import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

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
]);

export default clerkMiddleware(async (auth, request) => {
  if (!isProtectedApiRoute(request)) return;
  if (isPublicApiRoute(request)) return;
  await auth.protect();
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};


