import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { db } from "@/lib/supabase-admin";

export async function GET() {
  const { data, error } = await db.from("settings").select("*").eq("id", "main").single();
  if (error && error.code !== "PGRST116") {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data ?? {});
}

export async function POST(req: NextRequest) {
  if (!verifyToken(req.cookies.get("clari_auth")?.value)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const body = await req.json();
  const { nom, prenom, email_pro, telephone, adresse, siret, site_web } = body;

  const { error } = await db.from("settings").upsert({
    id: "main",
    nom, prenom, email_pro, telephone, adresse, siret, site_web,
    updated_at: new Date().toISOString(),
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
