import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE } from "@/lib/auth-constants";

/**
 * Gate every route except /login and /api/auth/* behind a session cookie.
 *
 * NOTE: Middleware can't use crypto.timingSafeEqual or async cookies(),
 * so it only checks the cookie's *presence*. The actual constant-time
 * password verification happens on /api/auth/login and on each protected
 * server-side data call (lib/auth → isAuthenticated()).
 */
const PUBLIC_PATHS = [
  "/login",
  "/api/auth/login",
  "/api/auth/logout",
  "/api/health",
];

function isPublic(pathname: string): boolean {
  return PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (isPublic(pathname)) return NextResponse.next();

  const cookie = req.cookies.get(SESSION_COOKIE)?.value;
  if (cookie) return NextResponse.next();

  // Send everyone unauthenticated to the login page.
  // For API calls, return 401 instead of redirecting.
  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = req.nextUrl.clone();
  url.pathname = "/login";
  url.searchParams.set("from", pathname);
  return NextResponse.redirect(url);
}

export const config = {
  // Skip Next internal routes + static assets.
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
