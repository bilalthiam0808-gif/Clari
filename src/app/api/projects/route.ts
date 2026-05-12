import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/supabase-admin";
import { verifyToken } from "@/lib/auth";

function auth(req: NextRequest) {
  return verifyToken(req.cookies.get("clari_auth")?.value);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toClient(row: any) {
  return {
    id: row.id,
    clientName: row.client_name,
    clientEmail: row.client_email,
    serviceId: row.service_id,
    serviceName: row.service_name,
    status: row.status,
    slug: row.slug,
    createdAt: row.created_at,
    briefData: row.brief_data,
    source: row.source,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toDB(body: any) {
  return {
    id: body.id,
    client_name: body.clientName,
    client_email: body.clientEmail,
    service_id: body.serviceId,
    service_name: body.serviceName,
    status: body.status ?? "En attente",
    slug: body.slug,
    created_at: body.createdAt,
    brief_data: body.briefData ?? null,
    source: body.source ?? null,
  };
}

export async function GET(req: NextRequest) {
  if (!auth(req)) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { data, error } = await db.from("projects").select("*").order("inserted_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json((data ?? []).map(toClient));
}

export async function POST(req: NextRequest) {
  if (!auth(req)) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const body = await req.json();
  const { data, error } = await db.from("projects").insert(toDB(body)).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(toClient(data));
}
