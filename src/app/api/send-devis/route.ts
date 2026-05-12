import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: NextRequest) {
  const { clientEmail, clientName, serviceName, total, pdfBase64, projectId } = await req.json();

  if (!clientEmail || !pdfBase64) {
    return NextResponse.json({ error: "Données manquantes" }, { status: 400 });
  }

  const { data, error } = await resend.emails.send({
    from: process.env.FROM_EMAIL || "Clari <onboarding@resend.dev>",
    to: clientEmail,
    subject: `Votre devis — ${serviceName}`,
    html: `
      <div style="font-family: Inter, Arial, sans-serif; max-width: 560px; margin: 0 auto; color: #111;">
        <h2 style="margin-bottom: 4px;">Bonjour ${clientName},</h2>
        <p style="color: #555;">Merci pour votre brief. Veuillez trouver ci-joint votre devis pour la prestation <strong>${serviceName}</strong>.</p>
        <div style="background: #f5f5f5; border-radius: 10px; padding: 20px 24px; margin: 24px 0; text-align: center;">
          <div style="font-size: 13px; color: #888; margin-bottom: 4px; text-transform: uppercase; letter-spacing: 0.06em;">Total estimé</div>
          <div style="font-size: 32px; font-weight: 700; color: #7F77DD;">${Number(total).toLocaleString("fr-FR")} €</div>
        </div>
        <p style="color: #555;">N&rsquo;hésitez pas à me contacter pour toute question ou ajustement.</p>
        <p style="color: #555; margin-top: 32px;">Cordialement</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 32px 0;" />
        <p style="font-size: 11px; color: #aaa;">Devis généré via Clari — réf. ${projectId}</p>
      </div>
    `,
    attachments: [
      {
        filename: `devis-${clientName.toLowerCase().replace(/\s+/g, "-")}.pdf`,
        content: Buffer.from(pdfBase64, "base64"),
      },
    ],
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ success: true, data });
}
