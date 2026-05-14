import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyToken } from "@/lib/auth";
import { db } from "@/lib/supabase-admin";
import DashboardClient from "./DashboardClient";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toProject(row: any) {
  return {
    id: row.id,
    clientName: row.client_name,
    clientEmail: row.client_email,
    serviceName: row.service_name,
    status: row.status,
    createdAt: row.created_at,
    briefData: row.brief_data,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toFacture(row: any) {
  return {
    amount: Number(row.amount),
    status: row.status as string,
    issuedAt: row.issued_at as string,
  };
}

export default async function DashboardPage() {
  const cookieStore = await cookies();
  if (!verifyToken(cookieStore.get("clari_auth")?.value)) redirect("/login");

  const [{ data: projects }, { data: factures }] = await Promise.all([
    db.from("projects").select("id, client_name, client_email, service_name, status, created_at, brief_data").order("inserted_at", { ascending: false }),
    db.from("factures").select("amount, status, issued_at"),
  ]);

  return (
    <DashboardClient
      initialProjects={(projects ?? []).map(toProject)}
      initialFactures={(factures ?? []).map(toFacture)}
    />
  );
}
