import { NextRequest, NextResponse } from "next/server";
import { createHash, timingSafeEqual } from "crypto";

// ─── Rate limiting (in-memory, best-effort on serverless) ─────────────────────
const attempts = new Map<string, { count: number; resetAt: number }>();
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes

function getIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown"
  );
}

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = attempts.get(ip);
  if (!entry || now > entry.resetAt) {
    attempts.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }
  entry.count += 1;
  return entry.count > MAX_ATTEMPTS;
}

function clearAttempts(ip: string) {
  attempts.delete(ip);
}

// ─── Token with expiry ─────────────────────────────────────────────────────────
const SESSION_DAYS = 30;

function buildToken(expires: number): string {
  const password = (process.env.CLARI_PASSWORD ?? "").trim();
  const secret = (process.env.CLARI_SESSION_SECRET ?? "").trim();
  const hash = createHash("sha256")
    .update(`${password}:${secret}:${expires}`)
    .digest("hex");
  return `${expires}:${hash}`;
}

// ─── Route handlers ────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  const ip = getIp(request);

  if (isRateLimited(ip)) {
    return NextResponse.json(
      { error: "Trop de tentatives. Réessayez dans 15 minutes." },
      { status: 429 }
    );
  }

  const { password } = await request.json();

  if (!password) {
    return NextResponse.json({ error: "Mot de passe requis" }, { status: 400 });
  }

  const storedPassword = (process.env.CLARI_PASSWORD ?? "").trim();
  const inputPassword = (password as string).trim();
  const inputBuf = Buffer.from(inputPassword);
  const expectedBuf = Buffer.from(storedPassword);

  const isMatch =
    inputBuf.length === expectedBuf.length &&
    timingSafeEqual(inputBuf, expectedBuf);

  if (!isMatch) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 401 });
  }

  clearAttempts(ip);

  const expires = Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000;
  const token = buildToken(expires);
  const response = NextResponse.json({ ok: true });

  response.cookies.set("clari_auth", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: SESSION_DAYS * 24 * 60 * 60,
    path: "/",
  });

  return response;
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.delete("clari_auth");
  return response;
}
