import jsPDF from "jspdf";

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

export function generateFacturePDF(data: FactureData): string {
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

  doc.setFontSize(9);
  doc.setTextColor(200, 240, 225);
  doc.text(`N° : ${ref}`, W - margin, 18, { align: "right" });
  doc.text(`Émise le : ${fmtDate(data.issuedAt)}`, W - margin, 25, { align: "right" });
  if (data.dueAt) {
    doc.text(`Échéance : ${fmtDate(data.dueAt)}`, W - margin, 32, { align: "right" });
  }

  y = 60;

  // ── Client block
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
  doc.text(`${data.amount.toLocaleString("fr-FR")} €`, W - margin, y, { align: "right" });
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
  doc.text(`${data.amount.toLocaleString("fr-FR")} €`, W - margin, y, { align: "right" });
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
  doc.text("Facture générée via Clari · Merci de votre confiance.", margin, footerY + 5);
  doc.text(`Réf. ${ref}`, W - margin, footerY + 5, { align: "right" });

  return doc.output("datauristring").split(",")[1];
}
