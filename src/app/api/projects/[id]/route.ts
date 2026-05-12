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

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!auth(req)) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id } = await params;

  const { data: project, error: pErr } = await db.from("projects").select("*").eq("id", id).single();
  if (pErr || !project) return NextResponse.json({ error: "Introuvable" }, { status: 404 });

  const { data: service } = await db.from("services").select("*").eq("id", project.service_id).single();

  return NextResponse.json({
    project: toClient(project),
    service: service ? {
      id: service.id,
      name: service.name,
      category: service.category,
      basePrice: service.base_price,
      description: service.description ?? "",
      options: service.options ?? [],
    } : null,
  });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!auth(req)) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();

  const patch: Record<string, unknown> = {};
  if (body.status !== undefined) patch.status = body.status;
  if (body.briefData !== undefined) patch.brief_data = body.briefData;

  const { data, error } = await db.from("projects").update(patch).eq("id", id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(toClient(data));
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!auth(req)) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id } = await params;
  const { error } = await db.from("projects").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
