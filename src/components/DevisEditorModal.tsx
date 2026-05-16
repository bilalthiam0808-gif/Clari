"use client";

import { useState, useEffect } from "react";

type ServiceOption = { id: string; label: string; price: string; isPercent?: boolean };

type Profile = {
  nom?: string; prenom?: string; email_pro?: string;
  telephone?: string; adresse?: string; siret?: string; site_web?: string;
};

type DevisEditorState = {
  clientName: string; clientEmail: string; clientPhone: string; clientCity: string;
  serviceName: string; serviceCategory: string; basePrice: string;
  selectedOptionIds: string[];
  brandName: string; sector: string; target: string; brandDesc: string; clientNote: string;
  total: string;
};

type Props = {
  project: {
    id: string; slug: string; clientName: string; clientEmail: string;
    serviceName: string; createdAt: string;
    briefData?: {
      clientPhone?: string; clientCity?: string; selectedService?: string;
      serviceCategory?: string; totalEstime?: number; brandName?: string;
      sector?: string; target?: string; brandDesc?: string; clientNote?: string;
      selectedOptions?: string[];
    } | null;
  };
  service: {
    id: string; name: string; category: string; basePrice: string;
    options: ServiceOption[];
  } | null;
  onClose: () => void;
  onSent: () => void;
};

export default function DevisEditorModal({ project, service, onClose, onSent }: Props) {
  const brief = project.briefData;

  const [profile, setProfile] = useState<Profile>({});
  const [state, setState] = useState<DevisEditorState>({
    clientName: project.clientName,
    clientEmail: project.clientEmail,
    clientPhone: brief?.clientPhone ?? "",
    clientCity: brief?.clientCity ?? "",
    serviceName: brief?.selectedService ?? project.serviceName,
    serviceCategory: brief?.serviceCategory ?? service?.category ?? "",
    basePrice: service?.basePrice ?? "",
    selectedOptionIds: brief?.selectedOptions ?? [],
    brandName: brief?.brandName ?? "",
    sector: brief?.sector ?? "",
    target: brief?.target ?? "",
    brandDesc: brief?.brandDesc ?? "",
    clientNote: brief?.clientNote ?? "",
    total: String(brief?.totalEstime ?? ""),
  });

  const [previewing, setPreviewing] = useState(false);
  const [sending, setSending] = useState(false);
  const [sendStatus, setSendStatus] = useState<"idle" | "success" | "error">("idle");

  useEffect(() => {
    fetch("/api/settings").then(r => r.ok ? r.json() : {}).then(d => setProfile(d)).catch(() => {});
  }, []);

  function set<K extends keyof DevisEditorState>(field: K, value: DevisEditorState[K]) {
    setState(s => ({ ...s, [field]: value }));
  }

  function toggleOption(id: string) {
    setState(s => ({
      ...s,
      selectedOptionIds: s.selectedOptionIds.includes(id)
        ? s.selectedOptionIds.filter(x => x !== id)
        : [...s.selectedOptionIds, id],
    }));
  }

  function buildPayload() {
    const resolvedOpts = (service?.options ?? []).filter(o => state.selectedOptionIds.includes(o.id));
    return {
      clientName: state.clientName,
      clientEmail: state.clientEmail,
      clientPhone: state.clientPhone || undefined,
      clientCity: state.clientCity || undefined,
      serviceName: state.serviceName,
      serviceCategory: state.serviceCategory || undefined,
      basePrice: state.basePrice ? parseFloat(state.basePrice) : undefined,
      selectedOptions: resolvedOpts,
      total: parseFloat(state.total) || 0,
      brandName: state.brandName || undefined,
      sector: state.sector || undefined,
      target: state.target || undefined,
      brandDesc: state.brandDesc || undefined,
      clientNote: state.clientNote || undefined,
      projectId: project.id,
      slug: project.slug,
      createdAt: project.createdAt,
    };
  }

  async function handlePreview() {
    setPreviewing(true);
    try {
      const res = await fetch("/api/preview-devis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildPayload()),
      });
      if (!res.ok) return;
      const { pdfBase64 } = await res.json();
      const bytes = atob(pdfBase64);
      const uint8 = new Uint8Array(bytes.length);
      for (let i = 0; i < bytes.length; i++) uint8[i] = bytes.charCodeAt(i);
      const blob = new Blob([uint8], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank");
      setTimeout(() => URL.revokeObjectURL(url), 30000);
    } finally {
      setPreviewing(false);
    }
  }

  async function handleSend() {
    setSending(true);
    setSendStatus("idle");
    try {
      const res = await fetch("/api/send-devis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildPayload()),
      });
      if (!res.ok) setSendStatus("error");
      else { setSendStatus("success"); onSent(); }
    } catch {
      setSendStatus("error");
    } finally {
      setSending(false);
    }
  }

  const hasProfile = !!(profile.prenom || profile.nom);

  const input: React.CSSProperties = {
    width: "100%", background: "var(--surface2)", border: "0.5px solid var(--border)",
    borderRadius: "8px", padding: "9px 12px", fontSize: "13px", color: "var(--text)",
    fontFamily: "inherit", outline: "none", boxSizing: "border-box",
  };
  const lbl: React.CSSProperties = {
    fontSize: "11px", color: "var(--text3)", fontWeight: 500,
    letterSpacing: "0.05em", textTransform: "uppercase", display: "block", marginBottom: "5px",
  };
  const section: React.CSSProperties = {
    background: "var(--surface)", border: "0.5px solid var(--border)",
    borderRadius: "12px", padding: "20px", marginBottom: "12px",
  };
  const sectionTitle: React.CSSProperties = {
    fontSize: "11px", fontWeight: 600, color: "var(--text3)",
    textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "14px",
  };

  const profileFields = [
    { label: "Nom", value: [profile.prenom, profile.nom].filter(Boolean).join(" ") },
    { label: "Email pro", value: profile.email_pro },
    { label: "Téléphone", value: profile.telephone },
    { label: "SIRET", value: profile.siret },
    { label: "Adresse", value: profile.adresse },
    { label: "Site web", value: profile.site_web },
  ].filter(f => f.value);

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 200, display: "flex" }}>
      <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.55)" }} />

      <div style={{
        position: "relative", marginLeft: "auto", width: "min(680px, 100vw)",
        height: "100vh", background: "var(--bg)", borderLeft: "0.5px solid var(--border)",
        display: "flex", flexDirection: "column",
      }}>
        {/* Header */}
        <div style={{ padding: "20px 24px", borderBottom: "0.5px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
          <div>
            <h2 style={{ fontSize: "17px", fontWeight: 600, color: "var(--text)", marginBottom: "2px" }}>Éditeur de devis</h2>
            <p style={{ fontSize: "12px", color: "var(--text3)" }}>Modifiez avant d&apos;envoyer · {project.clientName}</p>
          </div>
          <button onClick={onClose} style={{ width: "32px", height: "32px", border: "0.5px solid var(--border)", borderRadius: "8px", background: "transparent", color: "var(--text3)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M1 1l10 10M11 1L1 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
          </button>
        </div>

        {/* Scrollable content */}
        <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px" }}>

          {/* Vos informations */}
          <div style={section}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
              <div style={sectionTitle}>Vos informations</div>
              <a href="/profil" target="_blank" rel="noreferrer" style={{ fontSize: "11px", color: "var(--accent-light)", textDecoration: "none" }}>Modifier →</a>
            </div>
            {hasProfile ? (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                {profileFields.map(f => (
                  <div key={f.label} style={{ padding: "8px 10px", background: "var(--surface2)", borderRadius: "8px" }}>
                    <div style={{ fontSize: "10px", color: "var(--text3)", marginBottom: "2px" }}>{f.label}</div>
                    <div style={{ fontSize: "12px", color: "var(--text2)" }}>{f.value}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ padding: "12px", background: "var(--surface2)", borderRadius: "8px", fontSize: "12px", color: "var(--text3)" }}>
                Aucun profil configuré.{" "}
                <a href="/profil" target="_blank" rel="noreferrer" style={{ color: "var(--accent-light)" }}>Configurer →</a>
              </div>
            )}
          </div>

          {/* Client */}
          <div style={section}>
            <div style={sectionTitle}>Client</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <div>
                <label style={lbl}>Nom complet</label>
                <input value={state.clientName} onChange={e => set("clientName", e.target.value)} style={input} />
              </div>
              <div>
                <label style={lbl}>Email</label>
                <input value={state.clientEmail} onChange={e => set("clientEmail", e.target.value)} style={input} />
              </div>
              <div>
                <label style={lbl}>Téléphone</label>
                <input value={state.clientPhone} onChange={e => set("clientPhone", e.target.value)} placeholder="Optionnel" style={input} />
              </div>
              <div>
                <label style={lbl}>Ville</label>
                <input value={state.clientCity} onChange={e => set("clientCity", e.target.value)} placeholder="Optionnel" style={input} />
              </div>
            </div>
          </div>

          {/* Prestation */}
          <div style={section}>
            <div style={sectionTitle}>Prestation</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "14px" }}>
              <div style={{ gridColumn: "1 / -1" }}>
                <label style={lbl}>Nom de la prestation</label>
                <input value={state.serviceName} onChange={e => set("serviceName", e.target.value)} style={input} />
              </div>
              <div>
                <label style={lbl}>Catégorie</label>
                <input value={state.serviceCategory} onChange={e => set("serviceCategory", e.target.value)} placeholder="Ex : Graphisme" style={input} />
              </div>
              <div>
                <label style={lbl}>Prix de base (€)</label>
                <input type="number" value={state.basePrice} onChange={e => set("basePrice", e.target.value)} style={input} />
              </div>
            </div>

            {service && service.options.length > 0 && (
              <div style={{ marginBottom: "14px" }}>
                <div style={{ ...lbl, marginBottom: "8px" }}>Options</div>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  {service.options.map(opt => {
                    const checked = state.selectedOptionIds.includes(opt.id);
                    return (
                      <label key={opt.id} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "8px 12px", background: checked ? "var(--accent-bg)" : "var(--surface2)", borderRadius: "8px", border: `0.5px solid ${checked ? "rgba(127,119,221,0.35)" : "var(--border)"}`, cursor: "pointer", transition: "all 100ms" }}>
                        <input type="checkbox" checked={checked} onChange={() => toggleOption(opt.id)} style={{ accentColor: "var(--accent)", flexShrink: 0 }} />
                        <span style={{ flex: 1, fontSize: "13px", color: "var(--text2)" }}>{opt.label}</span>
                        <span style={{ fontSize: "12px", fontWeight: 600, color: opt.isPercent ? "#EF9F27" : "var(--accent)", flexShrink: 0 }}>
                          +{opt.isPercent ? `${opt.price}%` : `${parseFloat(opt.price).toLocaleString("fr-FR")} €`}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}

            <div>
              <label style={{ ...lbl, color: "var(--accent-light)" }}>Total estimé (€)</label>
              <input
                type="number"
                value={state.total}
                onChange={e => set("total", e.target.value)}
                style={{ ...input, fontSize: "20px", fontWeight: 700, color: "var(--accent)", padding: "12px" }}
              />
            </div>
          </div>

          {/* Contexte */}
          <div style={section}>
            <div style={sectionTitle}>Contexte de la marque</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <div>
                <label style={lbl}>Nom de la marque</label>
                <input value={state.brandName} onChange={e => set("brandName", e.target.value)} placeholder="Optionnel" style={input} />
              </div>
              <div>
                <label style={lbl}>Secteur</label>
                <input value={state.sector} onChange={e => set("sector", e.target.value)} placeholder="Optionnel" style={input} />
              </div>
              <div style={{ gridColumn: "1 / -1" }}>
                <label style={lbl}>Cible principale</label>
                <input value={state.target} onChange={e => set("target", e.target.value)} placeholder="Optionnel" style={input} />
              </div>
              <div style={{ gridColumn: "1 / -1" }}>
                <label style={lbl}>Description du projet</label>
                <textarea value={state.brandDesc} onChange={e => set("brandDesc", e.target.value)} rows={3} placeholder="Optionnel" style={{ ...input, resize: "vertical" }} />
              </div>
            </div>
          </div>

          {/* Note client */}
          <div style={section}>
            <div style={sectionTitle}>Note du client</div>
            <textarea
              value={state.clientNote}
              onChange={e => set("clientNote", e.target.value)}
              rows={3}
              placeholder="Note ou demande spécifique du client…"
              style={{ ...input, resize: "vertical" }}
            />
          </div>
        </div>

        {/* Status messages */}
        {sendStatus === "success" && (
          <div style={{ padding: "12px 24px", background: "rgba(29,158,117,0.1)", borderTop: "0.5px solid rgba(29,158,117,0.3)", fontSize: "13px", color: "#1D9E75", display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none"><circle cx="7.5" cy="7.5" r="6.5" stroke="#1D9E75" strokeWidth="1.2"/><path d="M4.5 7.5l2 2 4-4" stroke="#1D9E75" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
            Devis envoyé avec succès à {state.clientEmail}
          </div>
        )}
        {sendStatus === "error" && (
          <div style={{ padding: "12px 24px", background: "rgba(226,75,74,0.1)", borderTop: "0.5px solid rgba(226,75,74,0.3)", fontSize: "13px", color: "#E24B4A", flexShrink: 0 }}>
            Erreur lors de l&apos;envoi. Vérifiez votre configuration Resend.
          </div>
        )}

        {/* Footer */}
        <div style={{ padding: "16px 24px", borderTop: "0.5px solid var(--border)", display: "flex", gap: "10px", flexShrink: 0, background: "var(--bg)" }}>
          <button onClick={onClose} style={{ padding: "10px 16px", borderRadius: "9px", border: "0.5px solid var(--border)", background: "transparent", color: "var(--text2)", fontSize: "13px", fontWeight: 500, cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap" }}>
            Fermer
          </button>
          <button
            onClick={handlePreview}
            disabled={previewing}
            style={{ padding: "10px 16px", borderRadius: "9px", border: "0.5px solid rgba(127,119,221,0.4)", background: "var(--accent-bg)", color: "var(--accent-light)", fontSize: "13px", fontWeight: 500, cursor: previewing ? "not-allowed" : "pointer", fontFamily: "inherit", opacity: previewing ? 0.6 : 1, display: "flex", alignItems: "center", gap: "6px", whiteSpace: "nowrap" }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M1 7S3.5 2 7 2s6 5 6 5-2.5 5-6 5-6-5-6-5Z" stroke="currentColor" strokeWidth="1.2"/><circle cx="7" cy="7" r="2" stroke="currentColor" strokeWidth="1.2"/></svg>
            {previewing ? "Génération…" : "Prévisualiser"}
          </button>
          <button
            onClick={handleSend}
            disabled={sending || sendStatus === "success"}
            style={{ flex: 1, padding: "10px 16px", borderRadius: "9px", border: "none", background: (sending || sendStatus === "success") ? "rgba(29,158,117,0.1)" : "linear-gradient(135deg, #1D9E75 0%, #15785A 100%)", color: (sending || sendStatus === "success") ? "#1D9E75" : "#fff", fontSize: "13px", fontWeight: 600, cursor: (sending || sendStatus === "success") ? "not-allowed" : "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", transition: "all 150ms", boxShadow: (sending || sendStatus === "success") ? "none" : "0 4px 14px rgba(29,158,117,0.25)" }}
          >
            {sending ? (
              <>
                <div style={{ width: "14px", height: "14px", border: "2px solid #1D9E75", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.6s linear infinite" }} />
                Envoi…
              </>
            ) : sendStatus === "success" ? "✓ Envoyé" : (
              <>
                <svg width="15" height="15" viewBox="0 0 15 15" fill="none"><path d="M2 7.5L13 2l-3.5 5.5L13 13 2 7.5z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/></svg>
                Envoyer le devis
              </>
            )}
          </button>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  );
}
