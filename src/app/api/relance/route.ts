import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { verifyToken } from "@/lib/auth";

const resend = new Resend(process.env.RESEND_API_KEY);

function esc(s: unknown): string {
  if (typeof s !== "string") return "";
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

export async function POST(req: NextRequest) {
  if (!verifyToken(req.cookies.get("clari_auth")?.value)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const body = await req.json();
  const { clientEmail, clientName, serviceName, total, type } = body;

  if (!clientEmail || !clientName || !type) {
    return NextResponse.json({ error: "Données manquantes" }, { status: 400 });
  }

  const safeName = esc(clientName);
  const safeService = esc(serviceName);
  const safeTotal = typeof total === "number" ? total.toLocaleString("fr-FR") + " €" : null;
  const from = process.env.FROM_EMAIL || "Clari <onboarding@resend.dev>";

  let subject: string;
  let html: string;

  if (type === "devis") {
    subject = `Relance — Votre devis pour ${safeService}`;
    html = `
      <div style="font-family:Inter,Arial,sans-serif;max-width:560px;margin:0 auto;color:#111;">
        <h2 style="margin-bottom:4px;">Bonjour ${safeName},</h2>
        <p style="color:#555;margin-top:0;">Je me permets de revenir vers vous concernant le devis que je vous ai envoyé pour la prestation <strong>${safeService}</strong>.</p>
        ${safeTotal ? `<div style="background:#f9f8ff;border-left:3px solid #7F77DD;padding:14px 18px;margin:20px 0;border-radius:0 8px 8px 0;">
          <p style="margin:0;color:#555;font-size:14px;">Total estimé : <strong style="color:#7F77DD;">${safeTotal}</strong></p>
        </div>` : ""}
        <p style="color:#555;">Avez-vous eu l'occasion de le consulter ? N'hésitez pas à me contacter pour toute question ou ajustement.</p>
        <p style="color:#555;margin-top:32px;">Cordialement</p>
        <hr style="border:none;border-top:1px solid #eee;margin:24px 0;"/>
        <p style="font-size:11px;color:#aaa;">Ce message est une relance automatique envoyée via Clari.</p>
      </div>
    `;
  } else {
    subject = `Relance — Facture ${safeService}`;
    html = `
      <div style="font-family:Inter,Arial,sans-serif;max-width:560px;margin:0 auto;color:#111;">
        <h2 style="margin-bottom:4px;">Bonjour ${safeName},</h2>
        <p style="color:#555;margin-top:0;">Je me permets de vous contacter concernant la facture en attente de règlement pour la prestation <strong>${safeService}</strong>.</p>
        ${safeTotal ? `<div style="background:#fff8f0;border-left:3px solid #FAC775;padding:14px 18px;margin:20px 0;border-radius:0 8px 8px 0;">
          <p style="margin:0;color:#555;font-size:14px;">Montant dû : <strong style="color:#EF9F27;">${safeTotal}</strong></p>
        </div>` : ""}
        <p style="color:#555;">Si vous avez déjà effectué le règlement, merci de ne pas tenir compte de ce message. Dans le cas contraire, je reste disponible pour tout renseignement.</p>
        <p style="color:#555;margin-top:32px;">Cordialement</p>
        <hr style="border:none;border-top:1px solid #eee;margin:24px 0;"/>
        <p style="font-size:11px;color:#aaa;">Ce message est une relance automatique envoyée via Clari.</p>
      </div>
    `;
  }

  const { error } = await resend.emails.send({ from, to: clientEmail, subject, html });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({ ok: true });
}
