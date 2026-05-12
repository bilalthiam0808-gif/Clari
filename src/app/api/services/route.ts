import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/supabase-admin";
import { verifyToken } from "@/lib/auth";
import { DEFAULT_SERVICES } from "@/lib/defaultServices";

function auth(req: NextRequest) {
  return verifyToken(req.cookies.get("clari_auth")?.value);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toClient(row: any) {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    basePrice: row.base_price,
    description: row.description ?? "",
    options: row.options ?? [],
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toDB(body: any) {
  return {
    id: body.id,
    name: body.name,
    category: body.category,
    base_price: body.basePrice,
    description: body.description ?? "",
    options: body.options ?? [],
  };
}

export async function GET(req: NextRequest) {
  if (!auth(req)) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { data, error } = await db.from("services").select("*").order("inserted_at");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (!data || data.length === 0) {
    const { data: seeded, error: seedErr } = await db
      .from("services")
      .insert(DEFAULT_SERVICES)
      .select();
    if (seedErr) return NextResponse.json({ error: seedErr.message }, { status: 500 });
    return NextResponse.json((seeded ?? []).map(toClient));
  }

  return NextResponse.json(data.map(toClient));
}

export async function POST(req: NextRequest) {
  if (!auth(req)) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const body = await req.json();
  const { data, error } = await db.from("services").insert(toDB(body)).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(toClient(data));
}
