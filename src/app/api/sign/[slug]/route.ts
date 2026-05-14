import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { db } from "@/lib/supabase-admin";

const resend = new Resend(process.env.RESEND_API_KEY);

function esc(s: unknown): string {
  if (typeof s !== "string") return "";
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const { data: project, error } = await db
    .from("projects")
    .select("id, client_name, client_email, service_name, status, slug, brief_data, signature_name, signed_at")
    .eq("slug", slug)
    .single();

  if (error || !project) return NextResponse.json({ error: "Projet introuvable" }, { status: 404 });

  if (project.status !== "Devis envoyé" && project.status !== "Signé") {
    return NextResponse.json({ error: "Ce lien n'est pas encore actif." }, { status: 403 });
  }

  return NextResponse.json({
    clientName:    project.client_name,
    clientEmail:   project.client_email,
    serviceName:   project.service_name,
    status:        project.status,
    totalEstime:   project.brief_data?.totalEstime ?? null,
    selectedService: project.brief_data?.selectedService ?? project.service_name,
    signatureName: project.signature_name ?? null,
    signedAt:      project.signed_at ?? null,
  });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { signatureName } = await req.json();

  if (!signatureName?.trim()) {
    return NextResponse.json({ error: "Nom de signature requis" }, { status: 400 });
  }

  const { data: project, error } = await db
    .from("projects")
    .select("id, client_name, client_email, service_name, status, brief_data")
    .eq("slug", slug)
    .single();

  if (error || !project) return NextResponse.json({ error: "Projet introuvable" }, { status: 404 });
  if (project.status === "Signé") return NextResponse.json({ error: "Devis déjà signé" }, { status: 409 });
  if (project.status !== "Devis envoyé") return NextResponse.json({ error: "Devis non disponible" }, { status: 403 });

  const now = new Date().toISOString();
  const { error: updateErr } = await db
    .from("projects")
    .update({ status: "Signé", signature_name: signatureName.trim(), signed_at: now })
    .eq("id", project.id);

  if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 500 });

  const safeName    = esc(project.client_name);
  const safeSig     = esc(signatureName.trim());
  const safeService = esc(project.service_name);
  const total       = project.brief_data?.totalEstime;
  const dateStr     = new Date(now).toLocaleString("fr-FR", { day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" });
  const from        = process.env.FROM_EMAIL || "Clari <onboarding@resend.dev>";

  // Email confirmation client
  resend.emails.send({
    from,
    to: project.client_email,
    subject: `Votre devis est signé — ${safeService}`,
    html: `
      <div style="font-family:Inter,Arial,sans-serif;max-width:560px;margin:0 auto;color:#111;">
        <h2 style="margin-bottom:4px;">Bonjour ${safeName},</h2>
        <p style="color:#555;margin-top:0;">Votre signature a bien été enregistrée pour la prestation <strong>${safeService}</strong>.</p>
        <div style="background:#f0faf6;border-left:3px solid #1D9E75;padding:14px 18px;margin:20px 0;border-radius:0 8px 8px 0;">
          <p style="margin:0 0 4px;font-size:13px;color:#555;">Signé par : <strong>${safeSig}</strong></p>
          <p style="margin:0 0 4px;font-size:13px;color:#555;">Le : <strong>${dateStr}</strong></p>
          ${total ? `<p style="margin:0;font-size:13px;color:#555;">Montant : <strong style="color:#1D9E75;">${total.toLocaleString("fr-FR")} €</strong></p>` : ""}
        </div>
        <p style="color:#555;">Je vous recontacte très prochainement pour démarrer le projet.</p>
        <p style="color:#555;margin-top:32px;">Cordialement</p>
        <hr style="border:none;border-top:1px solid #eee;margin:24px 0;"/>
        <p style="font-size:11px;color:#aaa;">Ce message confirme votre acceptation électronique du devis via Clari.</p>
      </div>
    `,
  }).catch(() => {});

  // Email notification admin
  resend.emails.send({
    from,
    to: from.includes("<") ? from.split("<")[1].replace(">", "") : from,
    subject: `✅ Devis signé — ${project.client_name}`,
    html: `
      <div style="font-family:Inter,Arial,sans-serif;max-width:560px;margin:0 auto;color:#111;">
        <h2>${project.client_name} a signé son devis</h2>
        <p style="color:#555;">Prestation : <strong>${safeService}</strong></p>
        <p style="color:#555;">Signé sous le nom : <strong>${safeSig}</strong></p>
        <p style="color:#555;">Date : ${dateStr}</p>
        ${total ? `<p style="color:#555;">Montant : <strong>${total.toLocaleString("fr-FR")} €</strong></p>` : ""}
      </div>
    `,
  }).catch(() => {});

  return NextResponse.json({ ok: true, signedAt: now });
}
