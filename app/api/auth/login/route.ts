import { NextResponse } from "next/server";
import { checkPassword, setSessionCookie } from "@/lib/auth";

/**
 * POST /api/auth/login
 *   body: { password: string }
 *   200 { ok: true } + sets session cookie
 *   401 { error: "invalid password" }
 */
export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid body" }, { status: 400 });
  }

  const password =
    typeof body === "object" && body && "password" in body
      ? String((body as { password: unknown }).password ?? "")
      : "";

  if (!checkPassword(password)) {
    return NextResponse.json({ error: "invalid password" }, { status: 401 });
  }

  await setSessionCookie();
  return NextResponse.json({ ok: true });
}
