import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";

function verifyToken(cookie: string | undefined): boolean {
  if (!cookie) return false;

  const parts = cookie.split(":");
  if (parts.length !== 2) return false;

  const [expiresStr, hash] = parts;
  const expires = Number(expiresStr);

  if (isNaN(expires) || Date.now() > expires) return false;

  const password = (process.env.CLARI_PASSWORD ?? "").trim();
  const secret = (process.env.CLARI_SESSION_SECRET ?? "").trim();
  const expected = createHash("sha256")
    .update(`${password}:${secret}:${expires}`)
    .digest("hex");

  return hash === expected;
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith("/login") ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/b/") ||
    pathname.startsWith("/brief") ||
    pathname.startsWith("/api/b/") ||
    pathname.startsWith("/api/brief")
  ) {
    return NextResponse.next();
  }

  const token = request.cookies.get("clari_auth")?.value;

  if (!verifyToken(token)) {
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|public/).*)"],
};
