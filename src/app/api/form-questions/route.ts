import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/supabase-admin";
import { verifyToken } from "@/lib/auth";

function auth(req: NextRequest) {
  return verifyToken(req.cookies.get("clari_auth")?.value);
}

export async function GET() {
  const { data, error } = await db
    .from("form_questions")
    .select("category, questions");

  if (error) return NextResponse.json({}, { status: 500 });

  const result: Record<string, unknown> = {};
  for (const row of data ?? []) {
    result[row.category] = row.questions;
  }
  return NextResponse.json(result, {
    headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" },
  });
}

export async function POST(req: NextRequest) {
  if (!auth(req)) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const body = await req.json();
  const { category, questions } = body;

  if (!category || !Array.isArray(questions)) {
    return NextResponse.json({ error: "Données invalides" }, { status: 400 });
  }

  const { error } = await db
    .from("form_questions")
    .upsert(
      { category, questions, updated_at: new Date().toISOString() },
      { onConflict: "category" }
    );

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
