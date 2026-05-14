import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { verifyToken } from "@/lib/auth";
import { generateDevisPDF } from "@/lib/generateDevis";

const resend = new Resend(process.env.RESEND_API_KEY);

function escapeHtml(str: unknown): string {
  if (typeof str !== "string") return "";
  return str
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#x27;");
}

export async function POST(req: NextRequest) {
  if (!verifyToken(req.cookies.get("clari_auth")?.value)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const body = await req.json();
  const { clientEmail, clientName, serviceName, total, projectId, slug,
    clientPhone, clientCity, serviceCategory, basePrice,
    selectedOptions, brandName, sector, target, brandDesc, clientNote, createdAt } = body;

  if (!clientEmail || !clientName) {
    return NextResponse.json({ error: "Données manquantes" }, { status: 400 });
  }

  // Generate PDF server-side — jsPDF never shipped to the browser
  const pdfBase64 = generateDevisPDF({
    clientName, clientEmail, clientPhone, clientCity,
    serviceName, serviceCategory, basePrice,
    selectedOptions: selectedOptions ?? [],
    total: Number(total) || 0,
    brandName, sector, target, brandDesc, clientNote,
    projectId, createdAt,
  });

  const safeName    = escapeHtml(clientName);
  const safeService = escapeHtml(serviceName);
  const safeTotal   = Number(total) || 0;
  const safeId      = escapeHtml(projectId);
  const safeFile    = String(clientName).toLowerCase().replace(/[^a-z0-9]/g, "-").slice(0, 40);
  const baseUrl     = process.env.NEXT_PUBLIC_APP_URL || "https://clari.app";
  const signLink    = slug ? `${baseUrl}/signer/${escapeHtml(slug)}` : null;

  const { data, error } = await resend.emails.send({
    from: process.env.FROM_EMAIL || "Clari <onboarding@resend.dev>",
    to: clientEmail as string,
    subject: `Votre devis — ${safeService}`,
    html: `
      <div style="font-family:Inter,Arial,sans-serif;max-width:560px;margin:0 auto;color:#111;">
        <h2 style="margin-bottom:4px;">Bonjour ${safeName},</h2>
        <p style="color:#555;">Merci pour votre brief. Veuillez trouver ci-joint votre devis pour la prestation <strong>${safeService}</strong>.</p>
        <div style="background:#f5f5f5;border-radius:10px;padding:20px 24px;margin:24px 0;text-align:center;">
          <div style="font-size:13px;color:#888;margin-bottom:4px;text-transform:uppercase;letter-spacing:.06em;">Total estimé</div>
          <div style="font-size:32px;font-weight:700;color:#7F77DD;">${safeTotal.toLocaleString("fr-FR")} €</div>
        </div>
        ${signLink ? `
        <div style="background:#f0faf6;border-left:3px solid #1D9E75;border-radius:0 8px 8px 0;padding:14px 18px;margin:20px 0;">
          <p style="margin:0 0 10px;font-size:13px;color:#555;font-weight:600;">Accepter et signer le devis en ligne</p>
          <a href="${signLink}" style="display:inline-block;background:#1D9E75;color:#fff;text-decoration:none;padding:10px 20px;border-radius:8px;font-size:13px;font-weight:600;">&rarr; Signer le devis</a>
        </div>` : ""}
        <p style="color:#555;">N&rsquo;hésitez pas à me contacter pour toute question ou ajustement.</p>
        <p style="color:#555;margin-top:32px;">Cordialement</p>
        <hr style="border:none;border-top:1px solid #eee;margin:32px 0;"/>
        <p style="font-size:11px;color:#aaa;">Devis généré via Clari — réf. ${safeId}</p>
      </div>
    `,
    attachments: [{ filename: `devis-${safeFile}.pdf`, content: Buffer.from(pdfBase64, "base64") }],
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ success: true, data });
}
