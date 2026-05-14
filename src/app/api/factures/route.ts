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

export async function GET(req: NextRequest) {
  if (!auth(req)) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const email = req.nextUrl.searchParams.get("email");
  let query = db.from("factures").select("*").order("inserted_at", { ascending: false });
  if (email) query = query.eq("client_email", email);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json((data ?? []).map(toClient));
}

export async function POST(req: NextRequest) {
  if (!auth(req)) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const body = await req.json();
  const { projectId, clientName, clientEmail, serviceName, amount, dueAt, notes } = body;

  if (!clientName || !clientEmail || !serviceName || amount === undefined) {
    return NextResponse.json({ error: "Données manquantes" }, { status: 400 });
  }

  const { data, error } = await db.from("factures").insert({
    project_id: projectId ?? null,
    client_name: clientName,
    client_email: clientEmail,
    service_name: serviceName,
    amount: Number(amount),
    status: "En attente",
    due_at: dueAt ?? null,
    notes: notes ?? null,
  }).select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(toClient(data));
}
