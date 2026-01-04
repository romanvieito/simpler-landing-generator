import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

/**
 * NOTE: This file is not used by Next.js middleware. The actual middleware entrypoint
 * is `middleware.ts` at the project root.
 *
 * Kept temporarily for reference; logic should stay in sync with `middleware.ts`.
 */
const isProtectedRoute = createRouteMatcher(["/api/(.*)"]);
const isPublicRoute = createRouteMatcher([
  "/api/contact(.*)",
  "/api/credits/webhook(.*)",
]);

export default clerkMiddleware(async (auth, request) => {
  if (isProtectedRoute(request)) {
    if (isPublicRoute(request)) return;
    await auth.protect();
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};

