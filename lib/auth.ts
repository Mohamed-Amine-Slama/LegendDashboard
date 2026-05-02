import "server-only";

import { cookies } from "next/headers";
import crypto from "node:crypto";
import { SESSION_COOKIE } from "./auth-constants";

/**
 * Minimal session: a signed HMAC of the admin password lives in an
 * httpOnly cookie. Middleware checks the cookie matches the current
 * password — if you rotate ADMIN_PASSWORD, all sessions invalidate.
 *
 * Not appropriate for multi-user environments — fine for a single-admin
 * tool. Upgrade to NextAuth + a `users` collection when adding more
 * editors.
 *
 * NOTE: Don't import this file from `middleware.ts` — Edge runtime can't
 * use `node:crypto` or `next/headers`. Use `lib/auth-constants.ts` for
 * the cookie name there.
 */

export { SESSION_COOKIE };
const SESSION_TTL_SECONDS = 60 * 60 * 12; // 12 hours

/** Derive the cookie value from the configured password. Constant per
 *  password — comparing this on every request gives us a stateless check. */
export function expectedSessionToken(): string {
  const secret = process.env.ADMIN_PASSWORD ?? "";
  if (!secret) return "";
  return crypto.createHash("sha256").update(`lvs::${secret}`).digest("hex");
}

export function checkPassword(submitted: string): boolean {
  const real = process.env.ADMIN_PASSWORD ?? "";
  if (!real || !submitted) return false;
  // Constant-time compare — slightly safer than `===` for secrets.
  const a = Buffer.from(submitted);
  const b = Buffer.from(real);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

export async function setSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, expectedSessionToken(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
}

export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

export async function isAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies();
  const submitted = cookieStore.get(SESSION_COOKIE)?.value;
  if (!submitted) return false;
  return submitted === expectedSessionToken();
}
