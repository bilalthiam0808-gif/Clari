import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { db } from "@/lib/supabase-admin";
import { verifyToken } from "@/lib/auth";
import { generateFacturePDF } from "@/lib/generateFacture";

const resend = new Resend(process.env.RESEND_API_KEY);

function esc(s: unknown): string {
  if (typeof s !== "string") return "";
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function fmtDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!verifyToken(req.cookies.get("clari_auth")?.value)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { id } = await params;

  const { data: facture, error: fetchErr } = await db
    .from("factures")
    .select("*")
    .eq("id", id)
    .single();

  if (fetchErr || !facture) {
    return NextResponse.json({ error: "Facture introuvable" }, { status: 404 });
  }

  const pdfBase64 = generateFacturePDF({
    factureId:   facture.id,
    clientName:  facture.client_name,
    clientEmail: facture.client_email,
    serviceName: facture.service_name,
    amount:      Number(facture.amount),
    status:      facture.status,
    issuedAt:    facture.issued_at,
    dueAt:       facture.due_at,
    notes:       facture.notes,
  });

  const ref = facture.id.replace(/-/g, "").slice(0, 8).toUpperCase();
  const safeName    = esc(facture.client_name);
  const safeService = esc(facture.service_name);
  const amount      = Number(facture.amount).toLocaleString("fr-FR");
  const from        = process.env.FROM_EMAIL || "Clari <onboarding@resend.dev>";

  const html = `
    <div style="font-family:Inter,Arial,sans-serif;max-width:560px;margin:0 auto;color:#111;">
      <h2 style="margin-bottom:4px;">Bonjour ${safeName},</h2>
      <p style="color:#555;margin-top:0;">
        Veuillez trouver ci-joint votre facture pour la prestation <strong>${safeService}</strong>.
      </p>
      <div style="background:#f0faf6;border-left:3px solid #1D9E75;padding:14px 18px;margin:20px 0;border-radius:0 8px 8px 0;">
        <p style="margin:0 0 4px;color:#555;font-size:13px;">N° de facture : <strong>${ref}</strong></p>
        <p style="margin:0 0 4px;color:#555;font-size:13px;">Montant : <strong style="color:#1D9E75;">${amount} €</strong></p>
        ${facture.due_at ? `<p style="margin:0;color:#555;font-size:13px;">Échéance : <strong>${fmtDate(facture.due_at)}</strong></p>` : ""}
      </div>
      <p style="color:#555;">N'hésitez pas à me contacter pour toute question concernant cette facture.</p>
      <p style="color:#555;margin-top:32px;">Cordialement</p>
      <hr style="border:none;border-top:1px solid #eee;margin:24px 0;"/>
      <p style="font-size:11px;color:#aaa;">Ce message a été envoyé via Clari.</p>
    </div>
  `;

  const { error: mailErr } = await resend.emails.send({
    from,
    to: facture.client_email,
    subject: `Facture N°${ref} — ${safeService}`,
    html,
    attachments: [{ filename: `facture-${ref}.pdf`, content: pdfBase64 }],
  });

  if (mailErr) return NextResponse.json({ error: mailErr.message }, { status: 400 });

  // Passe le statut en "Envoyée" si encore "En attente"
  if (facture.status === "En attente") {
    await db.from("factures").update({ status: "Envoyée" }).eq("id", id);
  }

  return NextResponse.json({ ok: true, ref });
}
