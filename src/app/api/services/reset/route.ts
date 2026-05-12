import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/supabase-admin";
import { verifyToken } from "@/lib/auth";
import { DEFAULT_SERVICES } from "@/lib/defaultServices";

export async function POST(req: NextRequest) {
  if (!verifyToken(req.cookies.get("clari_auth")?.value)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  await db.from("services").delete().neq("id", "");
  const { data, error } = await db.from("services").insert(DEFAULT_SERVICES).select();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data);
}
