import jsPDF from "jspdf";
import type { ProfileData } from "./generateDevis";

function fmtMoney(n: number): string {
  return Math.round(n).toString().replace(/(\d)(?=(\d{3})+$)/g, "$1 ");
}

function addImageRounded(doc: jsPDF, b64: string, fmt: string, x: number, y: number, size: number, r: number) {
  try {
    const sf = doc.internal.scaleFactor;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ph: number = (doc.internal.pageSize as any).height ?? (doc.internal.pageSize as any).getHeight();
    const k = 0.5522847498;
    function tx(v: number) { return (v * sf).toFixed(3); }
    function ty(v: number) { return ((ph - v) * sf).toFixed(3); }
    const path = [
      `${tx(x + r)} ${ty(y)} m`,
      `${tx(x + size - r)} ${ty(y)} l`,
      `${tx(x + size - r + r * k)} ${ty(y)} ${tx(x + size)} ${ty(y + r - r * k)} ${tx(x + size)} ${ty(y + r)} c`,
      `${tx(x + size)} ${ty(y + size - r)} l`,
      `${tx(x + size)} ${ty(y + size - r + r * k)} ${tx(x + size - r + r * k)} ${ty(y + size)} ${tx(x + size - r)} ${ty(y + size)} c`,
      `${tx(x + r)} ${ty(y + size)} l`,
      `${tx(x + r - r * k)} ${ty(y + size)} ${tx(x)} ${ty(y + size - r + r * k)} ${tx(x)} ${ty(y + size - r)} c`,
      `${tx(x)} ${ty(y + r)} l`,
      `${tx(x)} ${ty(y + r - r * k)} ${tx(x + r - r * k)} ${ty(y)} ${tx(x + r)} ${ty(y)} c`,
      "h W n",
    ].join(" ");
    doc.saveGraphicsState();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (doc as any).internal.write(path);
    doc.addImage(b64, fmt, x, y, size, size);
    doc.restoreGraphicsState();
  } catch {
    doc.addImage(b64, fmt, x, y, size, size);
  }
}

type FactureData = {
  factureId: string;
  clientName: string;
  clientEmail: string;
  serviceName: string;
  amount: number;
  status: string;
  issuedAt: string;
  dueAt?: string | null;
  notes?: string | null;
};

function fmtDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" });
}

export function generateFacturePDF(data: FactureData, profile?: ProfileData): string {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const W = 210;
  const margin = 20;
  const contentW = W - margin * 2;
  let y = 0;

  const green  = [29, 158, 117]  as [number, number, number];
  const dark   = [15, 15, 15]    as [number, number, number];
  const gray   = [100, 100, 100] as [number, number, number];
  const light  = [240, 240, 240] as [number, number, number];
  const white  = [255, 255, 255] as [number, number, number];

  const ref = data.factureId.replace(/-/g, "").slice(0, 8).toUpperCase();
  const hasProfile = !!(profile?.prenom || profile?.nom);

  // ── Header background
  doc.setFillColor(...green);
  doc.rect(0, 0, W, 48, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(28);
  doc.setTextColor(...white);
  doc.text("FACTURE", margin, 22);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(180, 235, 215);
  doc.text(data.serviceName, margin, 31);

  // Logo in header top-right if available
  if (profile?.logoBase64 && profile?.logoFormat) {
    addImageRounded(doc, profile.logoBase64, profile.logoFormat, W - margin - 22, 5, 22, 4);
  }

  const refX = profile?.logoBase64 ? W - margin - 26 : W - margin;
  doc.setFontSize(9);
  doc.setTextColor(200, 240, 225);
  doc.text(`N° : ${ref}`, refX, 18, { align: "right" });
  doc.text(`Émise le : ${fmtDate(data.issuedAt)}`, refX, 25, { align: "right" });
  if (data.dueAt) {
    doc.text(`Échéance : ${fmtDate(data.dueAt)}`, refX, 32, { align: "right" });
  }

  y = 60;

  if (hasProfile) {
    // ── Two-column layout: prestataire (left) + client (right)
    const colW = (contentW - 6) / 2;

    // Prestataire block (left)
    doc.setFillColor(...light);
    doc.roundedRect(margin, y, colW, 36, 3, 3, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(...gray);
    doc.text("DE", margin + 8, y + 8);

    const fullName = [profile.prenom, profile.nom].filter(Boolean).join(" ");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(...dark);
    doc.text(fullName, margin + 8, y + 17);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(...gray);
    let py = y + 24;
    if (profile.email_pro) { doc.text(profile.email_pro, margin + 8, py); py += 5; }
    if (profile.telephone) { doc.text(profile.telephone, margin + 8, py); py += 5; }
    if (profile.siret) {
      doc.setFontSize(7.5);
      doc.text(`SIRET : ${profile.siret}`, margin + 8, y + 32);
    }

    // Client block (right)
    const clientX = margin + colW + 6;
    doc.setFillColor(...light);
    doc.roundedRect(clientX, y, colW, 36, 3, 3, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(...gray);
    doc.text("FACTURÉ À", clientX + 8, y + 8);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(...dark);
    doc.text(data.clientName, clientX + 8, y + 17);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(...gray);
    doc.text(data.clientEmail, clientX + 8, y + 24);

    y += 48;
  } else {
    // ── Single client block (no profile)
    doc.setFillColor(...light);
    doc.roundedRect(margin, y, contentW, 32, 3, 3, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(...gray);
    doc.text("FACTURÉ À", margin + 8, y + 8);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.setTextColor(...dark);
    doc.text(data.clientName, margin + 8, y + 17);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(...gray);
    doc.text(data.clientEmail, margin + 8, y + 25);

    y += 44;
  }

  // ── Status badge
  const isPaid = data.status === "Payée";
  const isLate = data.status === "En retard";
  const badgeBg = isPaid ? green : isLate ? [226, 75, 74] as [number, number, number] : [200, 200, 200] as [number, number, number];
  doc.setFillColor(...badgeBg);
  doc.roundedRect(margin, y, 36, 7, 1.5, 1.5, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(...white);
  doc.text(data.status.toUpperCase(), margin + 18, y + 5, { align: "center" });
  y += 14;

  // ── Prestation table
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(...gray);
  doc.text("DÉTAIL", margin, y);
  y += 4;

  doc.setDrawColor(...light);
  doc.setLineWidth(0.3);
  doc.line(margin, y, W - margin, y);
  y += 7;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(12);
  doc.setTextColor(...dark);
  doc.text(data.serviceName, margin, y);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text(`${fmtMoney(data.amount)} €`, W - margin, y, { align: "right" });
  y += 8;

  // Total line
  doc.setDrawColor(...dark);
  doc.setLineWidth(0.5);
  doc.line(margin, y, W - margin, y);
  y += 10;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(...dark);
  doc.text("TOTAL", margin, y);

  doc.setFontSize(20);
  doc.setTextColor(...green);
  doc.text(`${fmtMoney(data.amount)} €`, W - margin, y, { align: "right" });
  y += 16;

  // ── Due date reminder
  if (data.dueAt && !isPaid) {
    doc.setFillColor(240, 250, 246);
    doc.roundedRect(margin, y, contentW, 12, 2, 2, "F");
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(...gray);
    doc.text(`Paiement attendu avant le ${fmtDate(data.dueAt)}`, margin + 8, y + 8);
    y += 20;
  }

  // ── Notes
  if (data.notes) {
    doc.setFillColor(248, 252, 250);
    const lines = doc.splitTextToSize(data.notes, contentW - 16) as string[];
    const h = lines.length * 5 + 14;
    doc.roundedRect(margin, y, contentW, h, 3, 3, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(...gray);
    doc.text("NOTES", margin + 8, y + 8);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(...dark);
    doc.text(lines, margin + 8, y + 14);
    y += h + 8;
  }

  // ── Footer
  const footerY = 280;
  doc.setDrawColor(...light);
  doc.setLineWidth(0.3);
  doc.line(margin, footerY, W - margin, footerY);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(180, 180, 180);

  const footerLeft = hasProfile
    ? [profile?.prenom, profile?.nom].filter(Boolean).join(" ") + (profile?.site_web ? ` · ${profile.site_web}` : "")
    : "Facture générée via Clari · Merci de votre confiance.";

  doc.text(footerLeft, margin, footerY + 5);
  doc.text(`Réf. ${ref}`, W - margin, footerY + 5, { align: "right" });

  return doc.output("datauristring").split(",")[1];
}
