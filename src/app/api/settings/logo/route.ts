import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { db } from "@/lib/supabase-admin";

export async function POST(req: NextRequest) {
  if (!verifyToken(req.cookies.get("clari_auth")?.value)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get("logo") as File | null;
  if (!file) return NextResponse.json({ error: "Fichier manquant" }, { status: 400 });

  const ext = file.name.split(".").pop()?.toLowerCase() || "png";
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const { error: uploadError } = await db.storage
    .from("logos")
    .upload(`logo.${ext}`, buffer, {
      contentType: file.type,
      upsert: true,
    });

  if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 });

  const { data: urlData } = db.storage.from("logos").getPublicUrl(`logo.${ext}`);
  const url = urlData.publicUrl + `?t=${Date.now()}`;

  const { error: dbError } = await db.from("settings").upsert({
    id: "main",
    logo_url: url,
    updated_at: new Date().toISOString(),
  });

  if (dbError) return NextResponse.json({ error: dbError.message }, { status: 500 });
  return NextResponse.json({ url });
}
