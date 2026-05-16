import jsPDF from "jspdf";

// jsPDF's Helvetica doesn't support   (narrow no-break space) used by fr-FR locale
function fmtMoney(n: number): string {
  return Math.round(n).toString().replace(/(\d)(?=(\d{3})+$)/g, "$1 ");
}

// Clip subsequent drawing to a rounded rectangle, then restore after addImage
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

type Option = {
  label: string;
  price: string;
  isPercent?: boolean;
};

type DevisData = {
  clientName: string;
  clientEmail: string;
  clientPhone?: string;
  clientCity?: string;
  serviceName: string;
  serviceCategory?: string;
  basePrice?: number;
  selectedOptions: Option[];
  total: number;
  brandName?: string;
  sector?: string;
  target?: string;
  brandDesc?: string;
  clientNote?: string;
  projectId: string;
  createdAt: string;
};

export type ProfileData = {
  nom?: string;
  prenom?: string;
  email_pro?: string;
  telephone?: string;
  adresse?: string;
  siret?: string;
  site_web?: string;
  logo_url?: string;
  logoBase64?: string;
  logoFormat?: string;
};

export function generateDevisPDF(data: DevisData, profile?: ProfileData): string {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const W = 210;
  const margin = 20;
  const contentW = W - margin * 2;
  let y = 0;

  const accent = [127, 119, 221] as [number, number, number];
  const dark = [15, 15, 15] as [number, number, number];
  const gray = [100, 100, 100] as [number, number, number];
  const lightGray = [240, 240, 240] as [number, number, number];

  const hasProfile = !!(profile?.prenom || profile?.nom);

  // ── Header background
  doc.setFillColor(...accent);
  doc.rect(0, 0, W, 48, "F");

  // DEVIS label
  doc.setFont("helvetica", "bold");
  doc.setFontSize(28);
  doc.setTextColor(255, 255, 255);
  doc.text("DEVIS", margin, 22);

  // Service name
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(220, 215, 255);
  doc.text(data.serviceName, margin, 31);

  // Logo in header top-right if available
  if (profile?.logoBase64 && profile?.logoFormat) {
    addImageRounded(doc, profile.logoBase64, profile.logoFormat, W - margin - 22, 5, 22, 4);
  }

  // Date + ref
  const refX = profile?.logoBase64 ? W - margin - 26 : W - margin;
  doc.setFontSize(9);
  doc.setTextColor(200, 200, 255);
  const dateStr = new Date().toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" });
  doc.text(`Date : ${dateStr}`, refX, 18, { align: "right" });
  doc.text(`Réf. : ${data.projectId.slice(0, 8).toUpperCase()}`, refX, 25, { align: "right" });

  y = 60;

  if (hasProfile) {
    // ── Two-column layout: prestataire (left) + client (right)
    const colW = (contentW - 6) / 2;

    // Prestataire block (left)
    doc.setFillColor(...lightGray);
    doc.roundedRect(margin, y, colW, 44, 3, 3, "F");

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
    if (profile.adresse) {
      const addrLines = doc.splitTextToSize(profile.adresse, colW - 16) as string[];
      doc.text(addrLines.slice(0, 2), margin + 8, py);
      py += addrLines.slice(0, 2).length * 4.5;
    }
    if (profile.siret) {
      doc.setFontSize(7.5);
      doc.text(`SIRET : ${profile.siret}`, margin + 8, y + 40);
    }

    // Client block (right)
    const clientX = margin + colW + 6;
    doc.setFillColor(...lightGray);
    doc.roundedRect(clientX, y, colW, 44, 3, 3, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(...gray);
    doc.text("POUR", clientX + 8, y + 8);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(...dark);
    doc.text(data.clientName, clientX + 8, y + 17);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(...gray);
    let clientInfo = data.clientEmail;
    if (data.clientPhone) clientInfo += `  ·  ${data.clientPhone}`;
    if (data.clientCity) clientInfo += `  ·  ${data.clientCity}`;
    const clientInfoLines = doc.splitTextToSize(clientInfo, colW - 16) as string[];
    doc.text(clientInfoLines, clientX + 8, y + 24);

    if (data.brandName) {
      doc.text(
        `Marque : ${data.brandName}${data.sector ? ` — ${data.sector}` : ""}`,
        clientX + 8, y + 38
      );
    }

    y += 56;
  } else {
    // ── Single client block (no profile)
    doc.setFillColor(...lightGray);
    doc.roundedRect(margin, y, contentW, 40, 3, 3, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(...gray);
    doc.text("CLIENT", margin + 8, y + 8);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.setTextColor(...dark);
    doc.text(data.clientName, margin + 8, y + 17);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(...gray);
    let clientInfo = data.clientEmail;
    if (data.clientPhone) clientInfo += `  ·  ${data.clientPhone}`;
    if (data.clientCity) clientInfo += `  ·  ${data.clientCity}`;
    doc.text(clientInfo, margin + 8, y + 25);

    if (data.brandName) {
      doc.text(`Marque : ${data.brandName}${data.sector ? ` — ${data.sector}` : ""}`, margin + 8, y + 33);
    }

    y += 52;
  }

  // ── Prestation section title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(...gray);
  doc.text("DÉTAIL DE LA PRESTATION", margin, y);
  y += 5;

  doc.setDrawColor(...lightGray);
  doc.setLineWidth(0.3);
  doc.line(margin, y, W - margin, y);
  y += 6;

  // Base service row
  const basePriceDisplay = data.basePrice ? `${fmtMoney(data.basePrice)} €` : "—";
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(...dark);
  doc.text(data.serviceName, margin, y);
  doc.setFont("helvetica", "bold");
  doc.text(basePriceDisplay, W - margin, y, { align: "right" });
  y += 5;

  if (data.serviceCategory) {
    doc.setFont("helvetica", "italic");
    doc.setFontSize(8);
    doc.setTextColor(...gray);
    doc.text(data.serviceCategory, margin, y);
    y += 4;
  }

  y += 3;

  // Options rows
  if (data.selectedOptions.length > 0) {
    data.selectedOptions.forEach(opt => {
      doc.setDrawColor(...lightGray);
      doc.line(margin, y, W - margin, y);
      y += 5;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(...dark);
      doc.text(`+ ${opt.label}`, margin + 4, y);

      const priceStr = opt.isPercent
        ? `+${opt.price}%`
        : `+${fmtMoney(parseFloat(opt.price))} €`;
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...accent);
      doc.text(priceStr, W - margin, y, { align: "right" });
      y += 2;
    });
    y += 4;
  }

  // Total line
  doc.setDrawColor(...dark);
  doc.setLineWidth(0.5);
  doc.line(margin, y, W - margin, y);
  y += 8;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(...dark);
  doc.text("TOTAL ESTIMÉ", margin, y);

  doc.setFontSize(18);
  doc.setTextColor(...accent);
  doc.text(`${fmtMoney(data.total)} €`, W - margin, y, { align: "right" });
  y += 14;

  // ── Brand context (if available)
  if (data.brandDesc || data.target) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(...gray);
    doc.text("CONTEXTE DU PROJET", margin, y);
    y += 5;
    doc.setDrawColor(...lightGray);
    doc.setLineWidth(0.3);
    doc.line(margin, y, W - margin, y);
    y += 6;

    if (data.target) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(...gray);
      doc.text("Cible :", margin, y);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...dark);
      doc.text(data.target, margin + 18, y);
      y += 6;
    }

    if (data.brandDesc) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(...gray);
      doc.text("Description :", margin, y);
      y += 5;
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...dark);
      const lines = doc.splitTextToSize(data.brandDesc, contentW) as string[];
      doc.text(lines, margin, y);
      y += lines.length * 5 + 4;
    }
  }

  // ── Client note
  if (data.clientNote) {
    doc.setFillColor(248, 247, 255);
    const noteLines = doc.splitTextToSize(`"${data.clientNote}"`, contentW - 16) as string[];
    const noteH = noteLines.length * 5 + 12;
    doc.roundedRect(margin, y, contentW, noteH, 3, 3, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(...gray);
    doc.text("NOTE DU CLIENT", margin + 8, y + 7);

    doc.setFont("helvetica", "italic");
    doc.setFontSize(9);
    doc.setTextColor(...dark);
    doc.text(noteLines, margin + 8, y + 13);
    y += noteH + 8;
  }

  // ── Footer
  const footerY = 280;
  doc.setDrawColor(...lightGray);
  doc.setLineWidth(0.3);
  doc.line(margin, footerY, W - margin, footerY);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(180, 180, 180);

  const footerLeft = hasProfile
    ? [profile?.prenom, profile?.nom].filter(Boolean).join(" ") + (profile?.site_web ? ` · ${profile.site_web}` : "")
    : "Devis généré via Clari · Ce document est une estimation et ne constitue pas un engagement contractuel.";

  doc.text(footerLeft, margin, footerY + 5);
  doc.text(`Créé le ${data.createdAt}`, W - margin, footerY + 5, { align: "right" });

  return doc.output("datauristring").split(",")[1];
}
