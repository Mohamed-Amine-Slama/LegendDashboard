/**
 * Edge-runtime-safe constants. Imported by `middleware.ts` (which runs in
 * the Edge runtime and CAN'T pull in `lib/auth.ts` because that uses
 * `node:crypto` and `next/headers`).
 */
export const SESSION_COOKIE = "lvs_admin";
