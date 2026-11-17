import { NextResponse } from "next/server";
import { adminToken, passwordMatches } from "@/lib/admin";
import { clientIp, rateLimit } from "@/lib/rate-limit";

export async function POST(request: Request) {
  if (!rateLimit(`admin:${clientIp(request)}`)) {
    return NextResponse.json({ ok: false, error: "Too many attempts. Please wait and try again." }, { status: 429 });
  }
  const password = process.env.ADMIN_PASSWORD;
  if (!password) {
    return NextResponse.json({ ok: false, error: "Admin access is not configured." }, { status: 503 });
  }
  const body = (await request.json().catch(() => null)) as { password?: unknown } | null;
  const given = typeof body?.password === "string" ? body.password : "";
  if (!passwordMatches(given)) {
    return NextResponse.json({ ok: false, error: "That password is not correct." }, { status: 401 });
  }
  const response = NextResponse.json({ ok: true });
  response.cookies.set("admin_session", adminToken(password), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 12,
  });
  return response;
}
