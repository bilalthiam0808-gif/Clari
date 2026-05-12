import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/supabase-admin";
import { verifyToken } from "@/lib/auth";

function auth(req: NextRequest) {
  return verifyToken(req.cookies.get("clari_auth")?.value);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toClient(row: any) {
  return { id: row.id, name: row.name, category: row.category, basePrice: row.base_price, description: row.description ?? "", options: row.options ?? [] };
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!auth(req)) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const patch = { name: body.name, category: body.category, base_price: body.basePrice, description: body.description ?? "", options: body.options ?? [] };
  const { data, error } = await db.from("services").update(patch).eq("id", id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(toClient(data));
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!auth(req)) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id } = await params;
  const { error } = await db.from("services").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
