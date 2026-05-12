import jsPDF from "jspdf";

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

export function generateDevisPDF(data: DevisData): string {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const W = 210;
  const margin = 20;
  const contentW = W - margin * 2;
  let y = 0;

  const accent = [127, 119, 221] as [number, number, number];
  const dark = [15, 15, 15] as [number, number, number];
  const gray = [100, 100, 100] as [number, number, number];
  const lightGray = [240, 240, 240] as [number, number, number];

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

  // Date + ref right-aligned
  doc.setFontSize(9);
  doc.setTextColor(200, 200, 255);
  const dateStr = new Date().toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" });
  doc.text(`Date : ${dateStr}`, W - margin, 18, { align: "right" });
  doc.text(`Réf. : ${data.projectId.slice(0, 8).toUpperCase()}`, W - margin, 25, { align: "right" });

  y = 60;

  // ── Client block
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
  const basePriceDisplay = data.basePrice ? `${data.basePrice.toLocaleString("fr-FR")} €` : "—";
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
        : `+${parseFloat(opt.price).toLocaleString("fr-FR")} €`;
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
  doc.text(`${data.total.toLocaleString("fr-FR")} €`, W - margin, y, { align: "right" });
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
  doc.text("Devis généré via Clari · Ce document est une estimation et ne constitue pas un engagement contractuel.", margin, footerY + 5);
  doc.text(`Créé le ${data.createdAt}`, W - margin, footerY + 5, { align: "right" });

  return doc.output("datauristring").split(",")[1];
}
