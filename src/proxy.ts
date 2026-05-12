import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";

function expectedToken(): string {
  const password = (process.env.CLARI_PASSWORD ?? "").trim();
  const secret = (process.env.CLARI_SESSION_SECRET ?? "").trim();
  return createHash("sha256").update(password + secret).digest("hex");
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/login") || pathname.startsWith("/api/auth")) {
    return NextResponse.next();
  }

  const token = request.cookies.get("clari_auth")?.value;

  if (token !== expectedToken()) {
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|public/).*)"],
};
