"use client";

import { useState, useEffect } from "react";

type Profile = {
  nom?: string; prenom?: string; email_pro?: string;
  telephone?: string; adresse?: string; siret?: string; site_web?: string;
};

type FactureFormState = {
  clientName: string;
  clientEmail: string;
  serviceName: string;
  amount: string;
  issuedAt: string;
  dueAt: string;
  notes: string;
};

type Props = {
  // Create mode: pass client info + optional project defaults
  mode: "create" | "edit";
  clientName: string;
  clientEmail: string;
  projectId?: string | null;
  // Edit mode: pass existing facture data
  factureId?: string;
  initial?: Partial<FactureFormState>;
  onClose: () => void;
  onSaved: (facture: FactureRow) => void;
};

export type FactureRow = {
  id: string; projectId: string | null; clientName: string; clientEmail: string;
  serviceName: string; amount: number; status: string;
  issuedAt: string; dueAt: string | null; paidAt: string | null; notes: string | null;
};

function today() {
  return new Date().toISOString().slice(0, 10);
}

export default function FactureEditorModal({ mode, clientName, clientEmail, projectId, factureId, initial, onClose, onSaved }: Props) {
  const [profile, setProfile] = useState<Profile>({});
  const [state, setState] = useState<FactureFormState>({
    clientName: initial?.clientName ?? clientName,
    clientEmail: initial?.clientEmail ?? clientEmail,
    serviceName: initial?.serviceName ?? "",
    amount: initial?.amount ?? "",
    issuedAt: initial?.issuedAt ?? today(),
    dueAt: initial?.dueAt ?? "",
    notes: initial?.notes ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/settings").then(r => r.ok ? r.json() : {}).then(d => setProfile(d)).catch(() => {});
  }, []);

  function set<K extends keyof FactureFormState>(field: K, value: FactureFormState[K]) {
    setState(s => ({ ...s, [field]: value }));
  }

  async function handleSave() {
    if (!state.serviceName.trim() || !state.amount) { setError("Prestation et montant requis."); return; }
    setSaving(true); setError("");
    try {
      let res: Response;
      if (mode === "edit" && factureId) {
        res = await fetch(`/api/factures/${factureId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            serviceName: state.serviceName,
            amount: parseFloat(state.amount),
            issuedAt: state.issuedAt || null,
            dueAt: state.dueAt || null,
            notes: state.notes || null,
          }),
        });
      } else {
        res = await fetch("/api/factures", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            projectId: projectId ?? null,
            clientName: state.clientName,
            clientEmail: state.clientEmail,
            serviceName: state.serviceName,
            amount: parseFloat(state.amount),
            issuedAt: state.issuedAt || null,
            dueAt: state.dueAt || null,
            notes: state.notes || null,
          }),
        });
      }
      if (!res.ok) { setError("Erreur lors de la sauvegarde."); return; }
      const saved = await res.json();
      onSaved(saved);
    } catch {
      setError("Erreur réseau.");
    } finally {
      setSaving(false);
    }
  }

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

  const hasProfile = !!(profile.prenom || profile.nom);
  const profileFields = [
    { label: "Nom", value: [profile.prenom, profile.nom].filter(Boolean).join(" ") },
    { label: "Email pro", value: profile.email_pro },
    { label: "Téléphone", value: profile.telephone },
    { label: "SIRET", value: profile.siret },
    { label: "Adresse", value: profile.adresse },
    { label: "Site web", value: profile.site_web },
  ].filter(f => f.value);

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200, padding: "20px" }}>
      <div style={{ background: "var(--bg)", borderRadius: "16px", border: "0.5px solid var(--border)", width: "100%", maxWidth: "560px", maxHeight: "90vh", display: "flex", flexDirection: "column" }}>

        {/* Header */}
        <div style={{ padding: "22px 24px 18px", borderBottom: "0.5px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
          <div>
            <h2 style={{ fontSize: "17px", fontWeight: 600, color: "var(--text)", marginBottom: "2px" }}>
              {mode === "edit" ? "Modifier la facture" : "Nouvelle facture"}
            </h2>
            <p style={{ fontSize: "12px", color: "var(--text3)" }}>
              Pour <strong style={{ color: "var(--text2)" }}>{clientName}</strong>
            </p>
          </div>
          <button onClick={onClose} style={{ width: "32px", height: "32px", border: "0.5px solid var(--border)", borderRadius: "8px", background: "transparent", color: "var(--text3)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M1 1l10 10M11 1L1 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
          </button>
        </div>

        {/* Scrollable body */}
        <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px" }}>

          {/* Votre profil */}
          <div style={section}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
              <div style={sectionTitle}>Facturé par</div>
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
            <div style={sectionTitle}>Facturé à</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <div>
                <label style={lbl}>Nom du client</label>
                <input
                  value={state.clientName}
                  onChange={e => set("clientName", e.target.value)}
                  style={input}
                  disabled={mode === "edit"}
                />
              </div>
              <div>
                <label style={lbl}>Email</label>
                <input
                  value={state.clientEmail}
                  onChange={e => set("clientEmail", e.target.value)}
                  style={input}
                  disabled={mode === "edit"}
                />
              </div>
            </div>
          </div>

          {/* Prestation + montant */}
          <div style={section}>
            <div style={sectionTitle}>Prestation</div>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div>
                <label style={lbl}>Description de la prestation</label>
                <input
                  value={state.serviceName}
                  onChange={e => set("serviceName", e.target.value)}
                  placeholder="Ex : Site web vitrine, Identité visuelle…"
                  style={input}
                />
              </div>
              <div>
                <label style={{ ...lbl, color: "var(--accent-light)" }}>Montant (€)</label>
                <input
                  type="number"
                  value={state.amount}
                  onChange={e => set("amount", e.target.value)}
                  placeholder="Ex : 2500"
                  style={{ ...input, fontSize: "20px", fontWeight: 700, color: "var(--accent)", padding: "12px" }}
                />
              </div>
            </div>
          </div>

          {/* Dates */}
          <div style={section}>
            <div style={sectionTitle}>Dates</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <div>
                <label style={lbl}>Date d&apos;émission</label>
                <input type="date" value={state.issuedAt} onChange={e => set("issuedAt", e.target.value)} style={input} />
              </div>
              <div>
                <label style={lbl}>Échéance</label>
                <input type="date" value={state.dueAt} onChange={e => set("dueAt", e.target.value)} style={input} />
              </div>
            </div>
          </div>

          {/* Notes */}
          <div style={section}>
            <div style={sectionTitle}>Notes</div>
            <textarea
              value={state.notes}
              onChange={e => set("notes", e.target.value)}
              rows={3}
              placeholder="Ex : Acompte de 50 % versé, reste à régler à la livraison…"
              style={{ ...input, resize: "vertical" }}
            />
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: "16px 24px", borderTop: "0.5px solid var(--border)", flexShrink: 0, background: "var(--bg)" }}>
          {error && (
            <p style={{ fontSize: "12px", color: "#E24B4A", marginBottom: "10px" }}>{error}</p>
          )}
          <div style={{ display: "flex", gap: "10px" }}>
            <button onClick={onClose} style={{ flex: 1, padding: "10px", borderRadius: "9px", border: "0.5px solid var(--border)", background: "transparent", color: "var(--text2)", fontSize: "13px", fontWeight: 500, cursor: "pointer", fontFamily: "inherit" }}>
              Annuler
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !state.serviceName.trim() || !state.amount}
              style={{ flex: 2, padding: "10px", borderRadius: "9px", border: "none", background: "var(--accent)", color: "#FFF", fontSize: "13px", fontWeight: 600, cursor: (saving || !state.serviceName.trim() || !state.amount) ? "not-allowed" : "pointer", fontFamily: "inherit", opacity: (!state.serviceName.trim() || !state.amount) ? 0.5 : 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}
            >
              {saving ? (
                <>
                  <div style={{ width: "14px", height: "14px", border: "2px solid rgba(255,255,255,0.4)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.6s linear infinite" }} />
                  Enregistrement…
                </>
              ) : mode === "edit" ? "Enregistrer les modifications" : "Créer la facture"}
            </button>
          </div>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  );
}
