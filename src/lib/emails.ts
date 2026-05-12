import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

function esc(str: unknown): string {
  if (typeof str !== "string") return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");
}

export async function sendBriefNotifications({
  clientName,
  clientEmail,
  serviceName,
  totalEstime,
  projectId,
}: {
  clientName: string;
  clientEmail: string;
  serviceName: string;
  totalEstime?: number;
  projectId: string;
}) {
  if (!process.env.RESEND_API_KEY || !process.env.FROM_EMAIL) return;

  const from = process.env.FROM_EMAIL;
  const safeName = esc(clientName);
  const safeService = esc(serviceName);
  const safeEmail = esc(clientEmail);
  const safeId = esc(projectId);
  const totalStr = totalEstime ? totalEstime.toLocaleString("fr-FR") + " €" : null;

  // ── Notif admin ──────────────────────────────────────────────────────────────
  resend.emails.send({
    from,
    to: from,
    subject: `Nouveau brief reçu — ${safeName}`,
    html: `
      <div style="font-family:Inter,Arial,sans-serif;max-width:560px;margin:0 auto;color:#111;">
        <div style="background:#7F77DD;border-radius:10px 10px 0 0;padding:20px 24px;">
          <h2 style="margin:0;color:#fff;font-size:18px;">Nouveau brief reçu</h2>
        </div>
        <div style="background:#f9f8ff;border:1px solid #e8e6fb;border-top:none;border-radius:0 0 10px 10px;padding:24px;">
          <table style="width:100%;border-collapse:collapse;">
            <tr style="border-bottom:1px solid #eee;">
              <td style="padding:10px 0;color:#888;font-size:12px;width:130px;text-transform:uppercase;letter-spacing:.05em;">Client</td>
              <td style="padding:10px 0;font-weight:600;">${safeName}</td>
            </tr>
            <tr style="border-bottom:1px solid #eee;">
              <td style="padding:10px 0;color:#888;font-size:12px;text-transform:uppercase;letter-spacing:.05em;">Email</td>
              <td style="padding:10px 0;">${safeEmail}</td>
            </tr>
            <tr style="border-bottom:1px solid #eee;">
              <td style="padding:10px 0;color:#888;font-size:12px;text-transform:uppercase;letter-spacing:.05em;">Prestation</td>
              <td style="padding:10px 0;font-weight:500;">${safeService}</td>
            </tr>
            ${totalStr ? `<tr>
              <td style="padding:10px 0;color:#888;font-size:12px;text-transform:uppercase;letter-spacing:.05em;">Total estimé</td>
              <td style="padding:10px 0;font-size:22px;font-weight:700;color:#7F77DD;">${totalStr}</td>
            </tr>` : ""}
          </table>
          <p style="font-size:11px;color:#aaa;margin-top:20px;border-top:1px solid #eee;padding-top:12px;">Réf. projet : ${safeId}</p>
        </div>
      </div>
    `,
  }).catch(() => {});

  // ── Confirmation client ───────────────────────────────────────────────────────
  resend.emails.send({
    from,
    to: clientEmail,
    subject: `Votre brief a bien été reçu — ${safeService}`,
    html: `
      <div style="font-family:Inter,Arial,sans-serif;max-width:560px;margin:0 auto;color:#111;">
        <h2 style="margin-bottom:6px;">Bonjour ${safeName},</h2>
        <p style="color:#555;margin-top:0;">Votre brief pour la prestation <strong>${safeService}</strong> a bien été reçu.</p>
        <div style="background:#f9f8ff;border-left:3px solid #7F77DD;padding:14px 18px;margin:24px 0;border-radius:0 8px 8px 0;">
          <p style="margin:0;color:#555;font-size:14px;line-height:1.6;">
            Vous recevrez votre devis personnalisé dans les <strong>48h</strong>.<br/>
            En cas de question, répondez simplement à cet email.
          </p>
        </div>
        ${totalStr ? `<p style="color:#555;">Total estimé : <strong style="color:#7F77DD;">${totalStr}</strong></p>` : ""}
        <p style="color:#555;margin-top:32px;">À très bientôt,</p>
        <hr style="border:none;border-top:1px solid #eee;margin:32px 0;"/>
        <p style="font-size:11px;color:#aaa;">Ce message a été envoyé automatiquement suite à la soumission de votre brief.</p>
      </div>
    `,
  }).catch(() => {});
}
