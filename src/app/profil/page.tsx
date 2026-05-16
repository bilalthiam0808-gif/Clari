import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyToken } from "@/lib/auth";
import { db } from "@/lib/supabase-admin";
import ProfilClient from "./ProfilClient";

export default async function ProfilPage() {
  const cookieStore = await cookies();
  if (!verifyToken(cookieStore.get("clari_auth")?.value)) redirect("/login");

  const { data } = await db.from("settings").select("*").eq("id", "main").single();

  return <ProfilClient initialData={data ?? {}} />;
}
