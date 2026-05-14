import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyToken } from "@/lib/auth";
import { db } from "@/lib/supabase-admin";
import BriefsClient from "./BriefsClient";

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

export default async function BriefsPage() {
  const cookieStore = await cookies();
  if (!verifyToken(cookieStore.get("clari_auth")?.value)) redirect("/login");

  const { data } = await db
    .from("projects")
    .select("id, client_name, client_email, service_name, status, created_at, brief_data")
    .not("brief_data", "is", null)
    .order("inserted_at", { ascending: false });

  return <BriefsClient initialProjects={(data ?? []).map(toProject)} />;
}
