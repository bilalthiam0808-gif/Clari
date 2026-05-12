import { createHash } from "crypto";

export function verifyToken(cookie: string | undefined): boolean {
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
