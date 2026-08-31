import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isPublicRoute = createRouteMatcher(["/sign-in(.*)", "/sign-up(.*)"]);

export default clerkMiddleware(async (auth, req) => {
  if (isPublicRoute(req)) return;

  await auth.protect();

  // Route the root path to a role-appropriate landing page. This has to happen
  // here rather than in app/(auth)/page.tsx: that segment has a loading.tsx, so
  // the shell is already flushed by the time a page-level redirect() throws,
  // which surfaces as a client-side error before the redirect lands.
  if (req.nextUrl.pathname === "/") {
    const { sessionClaims } = await auth();
    const metadata = sessionClaims?.metadata;
    const role = metadata?.role;

    const canAccessStartups =
      role === "admin" ||
      role === "mentor" ||
      !!metadata?.founderOfMultipleStartups;

    return NextResponse.redirect(
      new URL(canAccessStartups ? "/startups" : "/user-journey-map", req.url)
    );
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
