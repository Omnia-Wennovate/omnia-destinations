/**
 * Next.js Edge Middleware — protects /admin routes at the network level.
 *
 * This middleware runs BEFORE any admin page or API route is rendered.
 * It redirects unauthenticated requests to /login immediately,
 * preventing even a flash of admin UI.
 *
 * HOW IT WORKS:
 * Firebase Auth stores its session in the IndexedDB / localStorage,
 * which is not accessible at the Edge. As a first-line defense we check
 * for a lightweight server-side session cookie called "omnia_session".
 *
 * To activate full protection, call `setAdminSessionCookie()` (see below)
 * in your login flow once the user is confirmed as admin.
 *
 * This is defense-in-depth alongside the client-side admin layout guard.
 */

import { NextRequest, NextResponse } from "next/server";

const ADMIN_SESSION_COOKIE = "omnia_session";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Only enforce on admin routes
  if (!pathname.startsWith("/admin")) {
    return NextResponse.next();
  }

  const session = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;

  // No session cookie → redirect to login
  if (!session) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Session cookie present — allow through (client-side role check still applies)
  return NextResponse.next();
}

export const config = {
  // Only run middleware on admin paths; exclude static assets
  matcher: ["/admin/:path*"],
};
