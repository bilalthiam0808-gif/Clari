import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/supabase-admin";
import { DEFAULT_SERVICES } from "@/lib/defaultServices";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toClient(row: any) {
  return { id: row.id, name: row.name, category: row.category, basePrice: row.base_price ?? row.basePrice, description: row.description ?? "", options: row.options ?? [] };
}

export async function GET() {
  const { data, error } = await db.from("services").select("*").order("inserted_at");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (!data || data.length === 0) {
    return NextResponse.json(DEFAULT_SERVICES.map(s => ({ ...s, basePrice: s.base_price })));
  }

  return NextResponse.json(data.map(toClient));
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const row = {
    id: body.id,
    client_name: body.clientName,
    client_email: body.clientEmail,
    service_id: body.serviceId,
    service_name: body.serviceName,
    status: body.status ?? "Brief reçu",
    slug: body.slug,
    created_at: body.createdAt,
    brief_data: body.briefData ?? null,
    source: body.source ?? null,
  };
  const { data, error } = await db.from("projects").insert(row).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data);
}
