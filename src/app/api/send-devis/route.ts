import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { createHash } from "crypto";

const resend = new Resend(process.env.RESEND_API_KEY);

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

function escapeHtml(str: unknown): string {
  if (typeof str !== "string") return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");
}

const MAX_PDF_BYTES = 5 * 1024 * 1024; // 5 MB

export async function POST(req: NextRequest) {
  // Auth check — must have valid session cookie
  const token = req.cookies.get("clari_auth")?.value;
  if (!verifyToken(token)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const body = await req.json();
  const { clientEmail, clientName, serviceName, total, pdfBase64, projectId } = body;

  if (!clientEmail || !pdfBase64) {
    return NextResponse.json({ error: "Données manquantes" }, { status: 400 });
  }

  // Validate PDF size
  const pdfBytes = Buffer.byteLength(pdfBase64 as string, "base64");
  if (pdfBytes > MAX_PDF_BYTES) {
    return NextResponse.json({ error: "PDF trop volumineux" }, { status: 413 });
  }

  // Sanitize all interpolated values
  const safeName = escapeHtml(clientName);
  const safeService = escapeHtml(serviceName);
  const safeTotal = Number(total) || 0;
  const safeProjectId = escapeHtml(projectId);
  const safeFilename = (typeof clientName === "string" ? clientName : "client")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "-")
    .slice(0, 40);

  const { data, error } = await resend.emails.send({
    from: process.env.FROM_EMAIL || "Clari <onboarding@resend.dev>",
    to: clientEmail as string,
    subject: `Votre devis — ${safeService}`,
    html: `
      <div style="font-family: Inter, Arial, sans-serif; max-width: 560px; margin: 0 auto; color: #111;">
        <h2 style="margin-bottom: 4px;">Bonjour ${safeName},</h2>
        <p style="color: #555;">Merci pour votre brief. Veuillez trouver ci-joint votre devis pour la prestation <strong>${safeService}</strong>.</p>
        <div style="background: #f5f5f5; border-radius: 10px; padding: 20px 24px; margin: 24px 0; text-align: center;">
          <div style="font-size: 13px; color: #888; margin-bottom: 4px; text-transform: uppercase; letter-spacing: 0.06em;">Total estimé</div>
          <div style="font-size: 32px; font-weight: 700; color: #7F77DD;">${safeTotal.toLocaleString("fr-FR")} €</div>
        </div>
        <p style="color: #555;">N&rsquo;hésitez pas à me contacter pour toute question ou ajustement.</p>
        <p style="color: #555; margin-top: 32px;">Cordialement</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 32px 0;" />
        <p style="font-size: 11px; color: #aaa;">Devis généré via Clari — réf. ${safeProjectId}</p>
      </div>
    `,
    attachments: [
      {
        filename: `devis-${safeFilename}.pdf`,
        content: Buffer.from(pdfBase64 as string, "base64"),
      },
    ],
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ success: true, data });
}
