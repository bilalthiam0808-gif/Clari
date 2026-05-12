import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/supabase-admin";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const { data: project, error: pErr } = await db
    .from("projects")
    .select("*")
    .eq("slug", slug)
    .single();

  if (pErr || !project) {
    return NextResponse.json({ error: "Projet introuvable" }, { status: 404 });
  }

  const { data: service } = await db
    .from("services")
    .select("*")
    .eq("id", project.service_id)
    .single();

  return NextResponse.json({
    project: {
      id: project.id,
      clientName: project.client_name,
      clientEmail: project.client_email,
      serviceId: project.service_id,
      serviceName: project.service_name,
      slug: project.slug,
    },
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

export async function POST(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const body = await req.json();

  const { data, error } = await db
    .from("projects")
    .update({ brief_data: body.brief_data, status: "Brief reçu" })
    .eq("slug", slug)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data);
}
