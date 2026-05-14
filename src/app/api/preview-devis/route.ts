import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { generateDevisPDF } from "@/lib/generateDevis";

export async function POST(req: NextRequest) {
  if (!verifyToken(req.cookies.get("clari_auth")?.value)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const body = await req.json();
  const { clientName, clientEmail, clientPhone, clientCity,
    serviceName, serviceCategory, basePrice, selectedOptions,
    total, brandName, sector, target, brandDesc, clientNote,
    projectId, createdAt } = body;

  if (!clientName || !clientEmail) {
    return NextResponse.json({ error: "Données manquantes" }, { status: 400 });
  }

  const pdfBase64 = generateDevisPDF({
    clientName, clientEmail, clientPhone, clientCity,
    serviceName, serviceCategory, basePrice,
    selectedOptions: selectedOptions ?? [],
    total: Number(total) || 0,
    brandName, sector, target, brandDesc, clientNote,
    projectId, createdAt,
  });

  return NextResponse.json({ pdfBase64 });
}
