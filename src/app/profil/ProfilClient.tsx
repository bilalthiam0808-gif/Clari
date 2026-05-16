"use client";

import { useState, useRef } from "react";
import Sidebar from "@/components/Sidebar";
import { toast } from "@/components/Toaster";

type ProfileData = {
  nom?: string;
  prenom?: string;
  email_pro?: string;
  telephone?: string;
  adresse?: string;
  siret?: string;
  site_web?: string;
  logo_url?: string;
};

export default function ProfilClient({ initialData }: { initialData: ProfileData }) {
  const [form, setForm] = useState<ProfileData>({
    nom: initialData.nom ?? "",
    prenom: initialData.prenom ?? "",
    email_pro: initialData.email_pro ?? "",
    telephone: initialData.telephone ?? "",
    adresse: initialData.adresse ?? "",
    siret: initialData.siret ?? "",
    site_web: initialData.site_web ?? "",
  });
  const [logoUrl, setLogoUrl] = useState<string>(initialData.logo_url ?? "");
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function set(field: keyof ProfileData, value: string) {
    setForm(f => ({ ...f, [field]: value }));
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error();
      toast("Profil sauvegardé", "success");
    } catch {
      toast("Erreur lors de la sauvegarde", "error");
    } finally {
      setSaving(false);
    }
  }

  async function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingLogo(true);
    try {
      const fd = new FormData();
      fd.append("logo", file);
      const res = await fetch("/api/settings/logo", { method: "POST", body: fd });
      if (!res.ok) throw new Error();
      const { url } = await res.json();
      setLogoUrl(url);
      toast("Logo mis à jour", "success");
    } catch {
      toast("Erreur lors de l'upload du logo", "error");
    } finally {
      setUploadingLogo(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "9px 12px",
    borderRadius: "8px",
    border: "0.5px solid var(--border)",
    background: "var(--surface-2, var(--surface))",
    color: "var(--text)",
    fontSize: "13px",
    fontFamily: "inherit",
    outline: "none",
    boxSizing: "border-box",
  };

  const labelStyle: React.CSSProperties = {
    fontSize: "11px",
    fontWeight: 500,
    color: "var(--text3)",
    textTransform: "uppercase",
    letterSpacing: "0.06em",
    marginBottom: "6px",
    display: "block",
  };

  const fieldStyle: React.CSSProperties = { display: "flex", flexDirection: "column" };

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--bg)" }}>
      <Sidebar />
      <main className="admin-main" style={{ flex: 1, padding: "32px 28px", overflowY: "auto" }}>
        <div style={{ maxWidth: "640px" }}>
          {/* Header */}
          <div style={{ marginBottom: "28px" }}>
            <h1 style={{ fontSize: "20px", fontWeight: 600, color: "var(--text)", margin: 0 }}>
              Mon profil
            </h1>
            <p style={{ fontSize: "13px", color: "var(--text3)", marginTop: "4px" }}>
              Ces informations apparaîtront sur vos devis et factures.
            </p>
          </div>

          {/* Logo section */}
          <div style={{
            background: "var(--surface)",
            border: "0.5px solid var(--border)",
            borderRadius: "12px",
            padding: "20px",
            marginBottom: "16px",
          }}>
            <span style={labelStyle}>Logo</span>
            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
              <div
                onClick={() => logoUrl && window.open(logoUrl, "_blank")}
                style={{
                  width: "64px", height: "64px",
                  borderRadius: "10px",
                  border: "0.5px solid var(--border)",
                  background: "var(--bg)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  overflow: "hidden", flexShrink: 0,
                  cursor: logoUrl ? "zoom-in" : "default",
                  transition: "opacity 100ms",
                }}
                title={logoUrl ? "Cliquer pour voir en grand" : undefined}
              >
                {logoUrl ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img src={logoUrl} alt="Logo" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                ) : (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <rect x="3" y="3" width="18" height="18" rx="4" stroke="var(--text3)" strokeWidth="1.2"/>
                    <circle cx="8.5" cy="8.5" r="1.5" stroke="var(--text3)" strokeWidth="1.2"/>
                    <path d="M3 16l5-4 4 3 3-2.5 6 4.5" stroke="var(--text3)" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </div>
              <div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingLogo}
                  style={{
                    padding: "7px 14px",
                    borderRadius: "7px",
                    border: "0.5px solid var(--border)",
                    background: "var(--surface)",
                    color: "var(--text)",
                    fontSize: "12px",
                    fontWeight: 500,
                    cursor: uploadingLogo ? "not-allowed" : "pointer",
                    fontFamily: "inherit",
                    opacity: uploadingLogo ? 0.6 : 1,
                  }}
                >
                  {uploadingLogo ? "Upload en cours…" : logoUrl ? "Changer le logo" : "Ajouter un logo"}
                </button>
                <p style={{ fontSize: "11px", color: "var(--text3)", marginTop: "4px" }}>
                  PNG, JPG, SVG — max 2 Mo
                </p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                style={{ display: "none" }}
                onChange={handleLogoChange}
              />
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSave}>
            <div style={{
              background: "var(--surface)",
              border: "0.5px solid var(--border)",
              borderRadius: "12px",
              padding: "20px",
              display: "flex",
              flexDirection: "column",
              gap: "16px",
            }}>
              {/* Prénom + Nom */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div style={fieldStyle}>
                  <label style={labelStyle}>Prénom</label>
                  <input
                    style={inputStyle}
                    value={form.prenom}
                    onChange={e => set("prenom", e.target.value)}
                    placeholder="Billale"
                  />
                </div>
                <div style={fieldStyle}>
                  <label style={labelStyle}>Nom</label>
                  <input
                    style={inputStyle}
                    value={form.nom}
                    onChange={e => set("nom", e.target.value)}
                    placeholder="Thiam"
                  />
                </div>
              </div>

              {/* Email pro */}
              <div style={fieldStyle}>
                <label style={labelStyle}>Email professionnel</label>
                <input
                  type="email"
                  style={inputStyle}
                  value={form.email_pro}
                  onChange={e => set("email_pro", e.target.value)}
                  placeholder="contact@monentreprise.fr"
                />
              </div>

              {/* Téléphone */}
              <div style={fieldStyle}>
                <label style={labelStyle}>Téléphone</label>
                <input
                  type="tel"
                  style={inputStyle}
                  value={form.telephone}
                  onChange={e => set("telephone", e.target.value)}
                  placeholder="+33 6 00 00 00 00"
                />
              </div>

              {/* Adresse */}
              <div style={fieldStyle}>
                <label style={labelStyle}>Adresse</label>
                <textarea
                  style={{ ...inputStyle, resize: "vertical", minHeight: "64px" }}
                  value={form.adresse}
                  onChange={e => set("adresse", e.target.value)}
                  placeholder="12 rue de la Paix, 75001 Paris"
                />
              </div>

              {/* SIRET + Site web */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div style={fieldStyle}>
                  <label style={labelStyle}>SIRET</label>
                  <input
                    style={inputStyle}
                    value={form.siret}
                    onChange={e => set("siret", e.target.value)}
                    placeholder="123 456 789 00012"
                  />
                </div>
                <div style={fieldStyle}>
                  <label style={labelStyle}>Site web</label>
                  <input
                    type="url"
                    style={inputStyle}
                    value={form.site_web}
                    onChange={e => set("site_web", e.target.value)}
                    placeholder="https://monsite.fr"
                  />
                </div>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "16px" }}>
              <button
                type="submit"
                disabled={saving}
                style={{
                  padding: "9px 20px",
                  borderRadius: "8px",
                  background: "var(--accent)",
                  color: "#fff",
                  border: "none",
                  fontSize: "13px",
                  fontWeight: 500,
                  cursor: saving ? "not-allowed" : "pointer",
                  fontFamily: "inherit",
                  opacity: saving ? 0.7 : 1,
                }}
              >
                {saving ? "Sauvegarde…" : "Sauvegarder"}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
