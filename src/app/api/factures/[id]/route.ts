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
    projectId: row.project_id,
    clientName: row.client_name,
    clientEmail: row.client_email,
    serviceName: row.service_name,
    amount: row.amount,
    status: row.status,
    issuedAt: row.issued_at,
    dueAt: row.due_at,
    paidAt: row.paid_at,
    notes: row.notes,
    insertedAt: row.inserted_at,
  };
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!auth(req)) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();

  const patch: Record<string, unknown> = {};
  if (body.status !== undefined) {
    patch.status = body.status;
    if (body.status === "Payée") patch.paid_at = new Date().toISOString();
    if (body.status !== "Payée") patch.paid_at = null;
  }
  if (body.serviceName !== undefined) patch.service_name = body.serviceName;
  if (body.amount !== undefined) patch.amount = Number(body.amount);
  if (body.issuedAt !== undefined) patch.issued_at = body.issuedAt;
  if (body.dueAt !== undefined) patch.due_at = body.dueAt;
  if (body.notes !== undefined) patch.notes = body.notes;

  const { data, error } = await db.from("factures").update(patch).eq("id", id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(toClient(data));
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!auth(req)) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id } = await params;
  const { error } = await db.from("factures").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
