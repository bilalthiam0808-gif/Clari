import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyToken } from "@/lib/auth";
import { db } from "@/lib/supabase-admin";
import ProjetsClient from "./ProjetsClient";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toProject(row: any) {
  return {
    id: row.id,
    clientName: row.client_name,
    clientEmail: row.client_email,
    serviceId: row.service_id,
    serviceName: row.service_name,
    status: row.status,
    slug: row.slug,
    createdAt: row.created_at,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toService(row: any) {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
  };
}

export default async function ProjetsPage() {
  const cookieStore = await cookies();
  if (!verifyToken(cookieStore.get("clari_auth")?.value)) redirect("/login");

  const [{ data: projects }, { data: services }] = await Promise.all([
    db.from("projects").select("id, client_name, client_email, service_id, service_name, status, slug, created_at").order("inserted_at", { ascending: false }),
    db.from("services").select("id, name, category").order("inserted_at"),
  ]);

  return (
    <ProjetsClient
      initialProjects={(projects ?? []).map(toProject)}
      initialServices={(services ?? []).map(toService)}
    />
  );
}
