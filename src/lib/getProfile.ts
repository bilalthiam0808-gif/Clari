import { db } from "./supabase-admin";
import type { ProfileData } from "./generateDevis";

const MIME_TO_FORMAT: Record<string, string> = {
  "image/png":  "PNG",
  "image/jpeg": "JPEG",
  "image/jpg":  "JPEG",
  "image/webp": "WEBP",
  "image/gif":  "GIF",
};

function extToFormat(url: string): string {
  const ext = url.split("?")[0].split(".").pop()?.toLowerCase() ?? "";
  if (ext === "jpg" || ext === "jpeg") return "JPEG";
  if (ext === "webp") return "WEBP";
  if (ext === "gif") return "GIF";
  return "PNG";
}

export async function getProfileForPDF(): Promise<ProfileData | undefined> {
  const { data } = await db.from("settings").select("*").eq("id", "main").single();
  if (!data) return undefined;

  const profile: ProfileData = {
    nom:       data.nom ?? undefined,
    prenom:    data.prenom ?? undefined,
    email_pro: data.email_pro ?? undefined,
    telephone: data.telephone ?? undefined,
    adresse:   data.adresse ?? undefined,
    siret:     data.siret ?? undefined,
    site_web:  data.site_web ?? undefined,
    logo_url:  data.logo_url ?? undefined,
  };

  if (data.logo_url) {
    try {
      const resp = await fetch(data.logo_url);
      if (resp.ok) {
        const buffer = await resp.arrayBuffer();
        profile.logoBase64 = Buffer.from(buffer).toString("base64");
        const ct = resp.headers.get("content-type") ?? "";
        profile.logoFormat = MIME_TO_FORMAT[ct.split(";")[0].trim()] ?? extToFormat(data.logo_url);
      }
    } catch {
      // logo optional — continue without it
    }
  }

  return profile;
}
