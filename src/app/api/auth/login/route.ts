import { NextRequest, NextResponse } from "next/server";
import { createHash, timingSafeEqual } from "crypto";

function expectedToken(): string {
  const password = process.env.CLARI_PASSWORD ?? "";
  const secret = process.env.CLARI_SESSION_SECRET ?? "";
  return createHash("sha256").update(password + secret).digest("hex");
}

export async function POST(request: NextRequest) {
  const { password } = await request.json();

  if (!password) {
    return NextResponse.json({ error: "Mot de passe requis" }, { status: 400 });
  }

  const storedPassword = process.env.CLARI_PASSWORD ?? "";
  const inputBuf = Buffer.from(password);
  const expectedBuf = Buffer.from(storedPassword);

  const isMatch =
    inputBuf.length === expectedBuf.length &&
    timingSafeEqual(inputBuf, expectedBuf);

  if (!isMatch) {
    return NextResponse.json({ error: "Mot de passe incorrect" }, { status: 401 });
  }

  const token = expectedToken();
  const response = NextResponse.json({ ok: true });

  response.cookies.set("clari_auth", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30, // 30 jours
    path: "/",
  });

  return response;
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.delete("clari_auth");
  return response;
}
