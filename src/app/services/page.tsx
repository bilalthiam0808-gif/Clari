import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyToken } from "@/lib/auth";
import { db } from "@/lib/supabase-admin";
import { DEFAULT_SERVICES } from "@/lib/defaultServices";
import ServicesClient from "./ServicesClient";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toService(row: any) {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    basePrice: row.base_price,
    description: row.description ?? "",
    options: row.options ?? [],
  };
}

export default async function ServicesPage() {
  const cookieStore = await cookies();
  if (!verifyToken(cookieStore.get("clari_auth")?.value)) redirect("/login");

  let { data } = await db.from("services").select("*").order("inserted_at");

  if (!data || data.length === 0) {
    const { data: seeded } = await db.from("services").insert(DEFAULT_SERVICES).select();
    data = seeded ?? [];
  }

  return <ServicesClient initialServices={(data ?? []).map(toService)} />;
}
