"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "@/components/Toaster";

// ─── Types ────────────────────────────────────────────────────────────────────

type BriefData = {
  selectedService?: string;
  serviceCategory?: string;
  totalEstime?: number;
  brandName?: string;
  sector?: string;
  brandDesc?: string;
  target?: string;
  hasIdentity?: string;
  styleAnswers?: Record<string, string[]>;
  selectedOptions?: string[];
  clientPhone?: string;
  clientCity?: string;
  clientNote?: string;
  clientSource?: string;
};

type Project = {
  id: string;
  clientName: string;
  clientEmail: string;
  serviceId: string;
  serviceName: string;
  status: "En attente" | "Brief reçu" | "Devis envoyé" | "Signé";
  slug: string;
  createdAt: string;
  briefData?: BriefData;
  source?: string;
  notes?: string | null;
  signatureName?: string | null;
  signedAt?: string | null;
};

type ServiceOption = {
  id: string;
  label: string;
  price: string;
  isPercent?: boolean;
};

type Service = {
  id: string;
  name: string;
  category: string;
  basePrice: string;
  options: ServiceOption[];
};

// ─── Questions de style par catégorie (doit rester aligné avec /brief et /b/[slug]) ───

const STYLE_QUESTIONS: Record<string, { question: string }[]> = {
  "Graphisme": [
    { question: "Quel type de logo souhaitez-vous ?" },
    { question: "Quel univers visuel vous correspond ?" },
    { question: "Quelle direction typographique ?" },
    { question: "Quelle palette de couleurs vous attire ?" },
  ],
  "Motion Design": [
    { question: "Quel style d'animation ?" },
    { question: "Quelle ambiance sonore ?" },
    { question: "Quelle durée approximative ?" },
    { question: "Quel univers visuel vous correspond ?" },
  ],
  "Site web": [
    { question: "Quels sont les objectifs de ce site ?" },
    { question: "URL de votre site actuel (si existant)" },
    { question: "Vos réseaux sociaux actifs (URLs ou @)" },
    { question: "Avez-vous déjà un site existant ?" },
    { question: "Citez 3 mots-clés qui définissent l'image de votre marque" },
    { question: "Votre client idéal s'adresse à…" },
    { question: "Tranche d'âge principale de votre cible" },
    { question: "Principal frein à l'achat de votre client" },
    { question: "Citez 3 concurrents — ce que vous aimez et n'aimez pas" },
    { question: "Pourquoi un client vous choisirait-il VOUS plutôt qu'un autre ?" },
    { question: "Quelle ambiance visuelle correspond à votre marque ?" },
    { question: "Quel niveau d'animation souhaitez-vous ?" },
    { question: "Références visuelles — sites qui vous inspirent" },
    { question: "Quel type de site préférez-vous ?" },
    { question: "Le site doit-il être en plusieurs langues ?" },
    { question: "Quelles pages souhaitez-vous ?" },
    { question: "Quels modules interactifs souhaitez-vous ?" },
    { question: "Avez-vous rédigé les textes pour le site ?" },
    { question: "Avez-vous des visuels (images) pour le site ?" },
    { question: "Gestion du site après lancement" },
    { question: "Quelle plateforme préférez-vous ?" },
    { question: "Quelles fonctionnalités souhaitez-vous ?" },
    { question: "Avez-vous déjà un nom de domaine ?" },
    { question: "Avez-vous déjà un hébergeur ?" },
    { question: "Délai idéal pour le projet" },
    { question: "Souhaitez-vous un forfait de maintenance mensuelle ?" },
    { question: "Votre enveloppe budgétaire" },
    { question: "Y a-t-il une envie particulière, un détail ou une fonctionnalité magique dont nous n'avons pas parlé ?" },
  ],
};

// ─── Couleurs ─────────────────────────────────────────────────────────────────

const statusColors: Record<string, { bg: string; color: string }> = {
  "En attente":   { bg: "#1A1200", color: "#FAC775" },
  "Brief reçu":   { bg: "#0A1A12", color: "#5DCAA5" },
  "Devis envoyé": { bg: "#1A1A2E", color: "#CECBF6" },
  "Signé":        { bg: "#0A1220", color: "#7DD3FC" },
};

const categoryColors: Record<string, { bg: string; color: string }> = {
  "Graphisme":     { bg: "#1A1A2E", color: "#CECBF6" },
  "Motion Design": { bg: "#1A0D2E", color: "#C4B8F0" },
  "Site web":      { bg: "#0A1A12", color: "#9FE1CB" },
};

function getCategoryColor(cat: string) {
  return categoryColors[cat] || { bg: "#1A1A1A", color: "#888" };
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function ProjetDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [project, setProject] = useState<Project | null>(null);
  const [service, setService] = useState<Service | null>(null);
  const [dbQuestions, setDbQuestions] = useState<Record<string, { question: string }[]>>({});
  const [notFound, setNotFound] = useState(false);
  const [copied, setCopied] = useState(false);
  const [sending, setSending] = useState(false);
  const [sendStatus, setSendStatus] = useState<"idle" | "success" | "error">("idle");
  const [previewing, setPreviewing] = useState(false);
  const [notes, setNotes] = useState("");
  const notesSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    fetch(`/api/projects/${id}`)
      .then(r => { if (!r.ok) throw new Error(); return r.json(); })
      .then(({ project, service: svc }) => {
        setProject(project);
        setNotes(project.notes ?? "");
        if (svc) setService(svc);
      })
      .catch(() => setNotFound(true));
    fetch("/api/form-questions")
      .then(r => r.ok ? r.json() : {})
      .then(data => setDbQuestions(data))
      .catch(() => {});
  }, [id]);

  async function updateStatus(newStatus: Project["status"]) {
    if (!project) return;
    setProject(prev => prev ? { ...prev, status: newStatus } : prev);
    await fetch(`/api/projects/${project.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
  }

  function copyLink() {
    if (project) {
      navigator.clipboard.writeText(`${window.location.origin}/b/${project.slug}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  function buildDevisPayload() {
    if (!project?.briefData) return null;
    const brief = project.briefData;
    const resolvedOpts = service && brief.selectedOptions
      ? service.options.filter(o => brief.selectedOptions?.includes(o.id))
      : [];
    return {
      clientEmail: project.clientEmail,
      clientName: project.clientName,
      clientPhone: brief.clientPhone,
      clientCity: brief.clientCity,
      serviceName: brief.selectedService || project.serviceName,
      serviceCategory: brief.serviceCategory,
      basePrice: service ? parseFloat(service.basePrice) : undefined,
      selectedOptions: resolvedOpts,
      total: brief.totalEstime ?? 0,
      brandName: brief.brandName,
      sector: brief.sector,
      target: brief.target,
      brandDesc: brief.brandDesc,
      clientNote: brief.clientNote,
      projectId: project.id,
      slug: project.slug,
      createdAt: project.createdAt,
    };
  }

  async function handleSendDevis() {
    const payload = buildDevisPayload();
    if (!payload) return;
    setSending(true);
    setSendStatus("idle");
    try {
      const res = await fetch("/api/send-devis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) { setSendStatus("error"); }
      else { setSendStatus("success"); updateStatus("Devis envoyé"); }
    } catch {
      setSendStatus("error");
    } finally {
      setSending(false);
    }
  }

  async function previewDevis() {
    const payload = buildDevisPayload();
    if (!payload) return;
    setPreviewing(true);
    try {
      const res = await fetch("/api/preview-devis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
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

  function handleNotesChange(value: string) {
    setNotes(value);
    if (notesSaveTimer.current) clearTimeout(notesSaveTimer.current);
    notesSaveTimer.current = setTimeout(async () => {
      if (!project) return;
      const res = await fetch(`/api/projects/${project.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: value }),
      });
      if (res.ok) toast("Note sauvegardée", "info");
      else toast("Erreur de sauvegarde", "error");
    }, 1200);
  }

  if (notFound) return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ textAlign: "center" }}>
        <p style={{ color: "var(--text2)", marginBottom: "16px" }}>Projet introuvable.</p>
        <Link href="/projets" style={{ color: "var(--accent)", fontSize: "13px" }}>← Retour aux projets</Link>
      </div>
    </div>
  );

  if (!project) return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ width: "24px", height: "24px", border: "2px solid #2A2A2A", borderTopColor: "#7F77DD", borderRadius: "50%", animation: "spin 0.6s linear infinite" }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  const brief = project.briefData;
  const hasBrief = !!brief;
  const status = statusColors[project.status];
  const catColor = getCategoryColor(brief?.serviceCategory || "");
  const styleQuestions = brief?.serviceCategory
    ? (dbQuestions[brief.serviceCategory]?.length
        ? dbQuestions[brief.serviceCategory]
        : (STYLE_QUESTIONS[brief.serviceCategory] || []))
    : [];

  // Résoudre les options sélectionnées
  const resolvedOptions = service && brief?.selectedOptions
    ? service.options.filter(o => brief.selectedOptions?.includes(o.id))
    : [];

  const sectionStyle: React.CSSProperties = {
    background: "var(--surface)",
    border: "0.5px solid var(--border)",
    borderRadius: "12px",
    padding: "20px 24px",
    marginBottom: "12px",
  };

  const sectionTitle: React.CSSProperties = {
    fontSize: "11px",
    fontWeight: 600,
    color: "var(--text3)",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    marginBottom: "16px",
  };

  const fieldLabel: React.CSSProperties = {
    fontSize: "11px",
    color: "var(--text3)",
    textTransform: "uppercase",
    letterSpacing: "0.06em",
    marginBottom: "4px",
    fontWeight: 500,
  };

  const fieldValue: React.CSSProperties = {
    fontSize: "13px",
    color: "var(--text)",
    lineHeight: 1.6,
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>

      {/* Header sticky */}
      <div className="detail-header" style={{ position: "sticky", top: 0, background: "rgba(15,15,15,0.96)", backdropFilter: "blur(8px)", borderBottom: "0.5px solid var(--border)", padding: "14px 32px", display: "flex", alignItems: "center", justifyContent: "space-between", zIndex: 10 }}>
        <div className="detail-header-left" style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <button onClick={() => router.push("/projets")}
            style={{ background: "none", border: "0.5px solid var(--border)", borderRadius: "8px", padding: "6px 12px", cursor: "pointer", color: "var(--text2)", fontSize: "12px", fontFamily: "inherit", display: "flex", alignItems: "center", gap: "6px", flexShrink: 0 }}>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M8 2L4 6l4 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Projets
          </button>
          <div style={{ overflow: "hidden" }}>
            <span style={{ fontSize: "15px", fontWeight: 600, color: "var(--text)", display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{project.clientName}</span>
            <span className="detail-service-name" style={{ fontSize: "13px", color: "var(--text3)" }}>{project.serviceName}</span>
          </div>
        </div>
        <div className="detail-header-right" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "11px", fontWeight: 500, padding: "4px 10px", borderRadius: "6px", background: status.bg, color: status.color, whiteSpace: "nowrap" }}>{project.status}</span>
          <button onClick={copyLink}
            style={{ background: copied ? "rgba(29,158,117,0.1)" : "var(--accent-bg)", color: copied ? "var(--success)" : "var(--accent-light)", border: `0.5px solid ${copied ? "rgba(29,158,117,0.3)" : "rgba(127,119,221,0.3)"}`, borderRadius: "8px", padding: "6px 12px", fontSize: "12px", cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", gap: "5px", whiteSpace: "nowrap" }}>
            {copied ? "✓ Copié" : "Copier le lien"}
          </button>
        </div>
      </div>

      <div style={{ maxWidth: "780px", margin: "0 auto", padding: "32px 24px 60px" }}>

        {/* Carte client */}
        <div style={{ background: "var(--surface)", border: "0.5px solid var(--border)", borderRadius: "14px", padding: "24px", marginBottom: "16px", display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            {/* Avatar initiales */}
            <div style={{ width: "46px", height: "46px", borderRadius: "12px", background: "var(--accent-bg)", border: "0.5px solid rgba(127,119,221,0.3)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <span style={{ fontSize: "16px", fontWeight: 600, color: "var(--accent-light)" }}>
                {project.clientName.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
              </span>
            </div>
            <div>
              <div style={{ fontSize: "18px", fontWeight: 600, color: "var(--text)", marginBottom: "4px" }}>{project.clientName}</div>
              <div style={{ fontSize: "13px", color: "var(--text2)", marginBottom: "2px" }}>{project.clientEmail}</div>
              {brief?.clientPhone && <div style={{ fontSize: "12px", color: "var(--text3)" }}>{brief.clientPhone}</div>}
              {brief?.clientCity && <div style={{ fontSize: "12px", color: "var(--text3)" }}>{brief.clientCity}</div>}
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: "11px", color: "var(--text3)", marginBottom: "4px" }}>Créé le</div>
            <div style={{ fontSize: "13px", color: "var(--text2)" }}>{project.createdAt}</div>
            {project.source === "brief_generique" && (
              <div style={{ fontSize: "10px", color: "var(--text3)", marginTop: "6px", padding: "2px 6px", borderRadius: "4px", background: "var(--surface2)", display: "inline-block" }}>Via lien générique</div>
            )}
          </div>
        </div>

        {/* Changer le statut */}
        <div className="status-selector" style={{ background: "var(--surface)", border: "0.5px solid var(--border)", borderRadius: "12px", padding: "14px 20px", marginBottom: "16px", display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={{ fontSize: "11px", color: "var(--text3)", textTransform: "uppercase", letterSpacing: "0.06em", marginRight: "4px" }}>Statut</span>
          {(["En attente", "Brief reçu", "Devis envoyé", "Signé"] as Project["status"][]).map(s => {
            const col = statusColors[s];
            const isActive = project.status === s;
            return (
              <button key={s} onClick={() => updateStatus(s)}
                style={{ padding: "5px 12px", borderRadius: "6px", fontSize: "12px", fontWeight: 500, cursor: "pointer", fontFamily: "inherit", background: isActive ? col.bg : "transparent", color: isActive ? col.color : "var(--text3)", border: isActive ? `1px solid ${col.color}40` : "0.5px solid var(--border)", transition: "all 100ms" }}>
                {s}
              </button>
            );
          })}
        </div>

        {/* ── Timeline ── */}
        {(() => {
          const isSigned = project.status === "Signé";
          const steps: { label: string; done: boolean; date?: string }[] = [
            { label: "Projet créé",  done: true, date: project.createdAt },
            { label: "Brief reçu",   done: project.status === "Brief reçu" || project.status === "Devis envoyé" || isSigned },
            { label: "Devis envoyé", done: project.status === "Devis envoyé" || isSigned },
            { label: "Signé",        done: isSigned, date: project.signedAt ?? undefined },
          ];
          return (
            <div style={{ background: "var(--surface)", border: "0.5px solid var(--border)", borderRadius: "12px", padding: "16px 20px", marginBottom: "12px", display: "flex", alignItems: "center", gap: "0" }}>
              {steps.map((step, i) => (
                <div key={step.label} style={{ display: "flex", alignItems: "center", flex: i < steps.length - 1 ? 1 : "none" }}>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "4px", flexShrink: 0 }}>
                    <div style={{ width: "24px", height: "24px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", background: step.done ? "var(--success)" : "var(--surface2)", border: step.done ? "none" : "1.5px solid var(--border)", transition: "all 200ms" }}>
                      {step.done
                        ? <svg width="11" height="11" viewBox="0 0 11 11" fill="none"><path d="M2 5.5l2.5 2.5L9 2.5" stroke="#fff" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
                        : <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "var(--border)" }} />
                      }
                    </div>
                    <span style={{ fontSize: "10px", fontWeight: 500, color: step.done ? "var(--text2)" : "var(--text3)", whiteSpace: "nowrap" }}>{step.label}</span>
                    {step.date && <span style={{ fontSize: "9px", color: "var(--text3)" }}>{step.date}</span>}
                  </div>
                  {i < steps.length - 1 && (
                    <div style={{ flex: 1, height: "1.5px", background: steps[i + 1].done ? "var(--success)" : "var(--border)", margin: "0 8px", marginBottom: "18px", transition: "background 200ms" }} />
                  )}
                </div>
              ))}
            </div>
          );
        })()}

        {/* ── BRIEF ── */}
        {hasBrief ? (
          <>
            {/* Prestation + total */}
            <div style={{ ...sectionStyle, display: "grid", gridTemplateColumns: "1fr auto", gap: "20px", alignItems: "center" }}>
              <div>
                <div style={sectionTitle}>Prestation choisie</div>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  {brief.serviceCategory && (
                    <span style={{ fontSize: "10px", fontWeight: 500, padding: "2px 8px", borderRadius: "4px", background: catColor.bg, color: catColor.color }}>{brief.serviceCategory}</span>
                  )}
                  <span style={{ fontSize: "16px", fontWeight: 600, color: "var(--text)" }}>{brief.selectedService || project.serviceName}</span>
                </div>
                {service && (
                  <div style={{ fontSize: "12px", color: "var(--text3)", marginTop: "4px" }}>Prix de base : {parseFloat(service.basePrice).toLocaleString("fr-FR")} €</div>
                )}
              </div>
              {brief.totalEstime !== undefined && (
                <div style={{ background: "var(--surface2)", borderRadius: "10px", padding: "12px 18px", textAlign: "center" }}>
                  <div style={{ fontSize: "10px", color: "var(--text3)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "4px" }}>Total estimé</div>
                  <div style={{ fontSize: "24px", fontWeight: 700, color: "var(--accent)" }}>{brief.totalEstime.toLocaleString("fr-FR")} €</div>
                </div>
              )}
            </div>

            {/* Options sélectionnées */}
            {resolvedOptions.length > 0 && (
              <div style={sectionStyle}>
                <div style={sectionTitle}>Options sélectionnées</div>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  {resolvedOptions.map(opt => (
                    <div key={opt.id} style={{ display: "flex", justifyContent: "space-between", padding: "8px 12px", background: "var(--surface2)", borderRadius: "8px", fontSize: "13px" }}>
                      <span style={{ color: "var(--text2)" }}>{opt.label}</span>
                      <span style={{ color: opt.isPercent ? "#EF9F27" : "var(--accent)", fontWeight: 500 }}>
                        +{opt.isPercent ? `${opt.price}%` : `${parseFloat(opt.price).toLocaleString("fr-FR")} €`}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Prévisualisation + envoi */}
            <div style={{ display: "flex", gap: "10px", marginBottom: "12px" }}>
              <button
                onClick={previewDevis}
                disabled={previewing}
                style={{
                  flex: 1,
                  padding: "12px",
                  borderRadius: "12px",
                  fontSize: "13px",
                  fontWeight: 500,
                  fontFamily: "inherit",
                  cursor: previewing ? "not-allowed" : "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
                  background: "transparent",
                  color: "var(--accent-light)",
                  border: "0.5px solid rgba(127,119,221,0.4)",
                  transition: "all 150ms",
                  opacity: previewing ? 0.6 : 1,
                }}
              >
                <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
                  <path d="M1 7.5S3.5 2 7.5 2s6.5 5.5 6.5 5.5S12.5 13 7.5 13 1 7.5 1 7.5z" stroke="currentColor" strokeWidth="1.2"/>
                  <circle cx="7.5" cy="7.5" r="2" stroke="currentColor" strokeWidth="1.2"/>
                </svg>
                {previewing ? "Génération…" : "Prévisualiser"}
              </button>
            </div>

            {/* Bouton envoyer le devis */}
            {project.status !== "Devis envoyé" && (
              <div style={{ marginBottom: "12px" }}>
                <button
                  onClick={handleSendDevis}
                  disabled={sending}
                  style={{
                    width: "100%",
                    padding: "14px 24px",
                    borderRadius: "12px",
                    fontSize: "14px",
                    fontWeight: 600,
                    fontFamily: "inherit",
                    cursor: sending ? "not-allowed" : "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "10px",
                    background: sending ? "rgba(29,158,117,0.1)" : "linear-gradient(135deg, #1D9E75 0%, #15785A 100%)",
                    color: sending ? "#1D9E75" : "#fff",
                    border: sending ? "1px solid rgba(29,158,117,0.4)" : "none",
                    boxShadow: sending ? "none" : "0 4px 16px rgba(29,158,117,0.25)",
                    transition: "all 150ms",
                    opacity: sending ? 0.7 : 1,
                  }}
                >
                  {sending ? (
                    <>
                      <div style={{ width: "16px", height: "16px", border: "2px solid #1D9E75", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.6s linear infinite" }} />
                      Envoi en cours…
                    </>
                  ) : (
                    <>
                      <svg width="17" height="17" viewBox="0 0 17 17" fill="none">
                        <path d="M2 8.5L15 2l-4 6.5 4 6.5L2 8.5z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
                      </svg>
                      Accepter et envoyer le devis
                    </>
                  )}
                </button>

                {sendStatus === "success" && (
                  <div style={{ marginTop: "8px", padding: "10px 14px", borderRadius: "8px", background: "rgba(29,158,117,0.1)", border: "0.5px solid rgba(29,158,117,0.4)", display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", color: "#1D9E75" }}>
                    <svg width="15" height="15" viewBox="0 0 15 15" fill="none"><circle cx="7.5" cy="7.5" r="6.5" stroke="#1D9E75" strokeWidth="1.2"/><path d="M4.5 7.5l2 2 4-4" stroke="#1D9E75" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    Devis envoyé avec succès à {project.clientEmail}
                  </div>
                )}
                {sendStatus === "error" && (
                  <div style={{ marginTop: "8px", padding: "10px 14px", borderRadius: "8px", background: "rgba(226,75,74,0.1)", border: "0.5px solid rgba(226,75,74,0.4)", display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", color: "#E24B4A" }}>
                    <svg width="15" height="15" viewBox="0 0 15 15" fill="none"><circle cx="7.5" cy="7.5" r="6.5" stroke="#E24B4A" strokeWidth="1.2"/><path d="M7.5 4.5v4M7.5 10.5v.5" stroke="#E24B4A" strokeWidth="1.3" strokeLinecap="round"/></svg>
                    Erreur lors de l&apos;envoi. Vérifiez votre clé API Resend dans <code style={{ fontSize: "11px", background: "rgba(226,75,74,0.1)", padding: "1px 5px", borderRadius: "4px" }}>.env.local</code>.
                  </div>
                )}
              </div>
            )}

            {project.status === "Devis envoyé" && (
              <div style={{ marginBottom: "12px", padding: "12px 16px", borderRadius: "10px", background: "rgba(29,158,117,0.08)", border: "0.5px solid rgba(29,158,117,0.3)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px", fontSize: "13px", color: "#1D9E75" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="7" stroke="#1D9E75" strokeWidth="1.2"/><path d="M5 8l2 2 4-4" stroke="#1D9E75" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  Devis envoyé à {project.clientEmail}
                </div>
                <button
                  onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/signer/${project.slug}`); toast("Lien de signature copié", "info"); }}
                  style={{ background: "rgba(29,158,117,0.15)", color: "#1D9E75", border: "0.5px solid rgba(29,158,117,0.4)", borderRadius: "7px", padding: "4px 10px", fontSize: "11px", fontWeight: 500, cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap" }}>
                  Copier lien signature
                </button>
              </div>
            )}

            {project.status === "Signé" && project.signatureName && (
              <div style={{ marginBottom: "12px", padding: "16px 20px", borderRadius: "12px", background: "rgba(125,211,252,0.06)", border: "0.5px solid rgba(125,211,252,0.3)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" }}>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M2 8l4 4 8-8" stroke="#7DD3FC" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  <span style={{ fontSize: "12px", fontWeight: 600, color: "#7DD3FC", textTransform: "uppercase", letterSpacing: "0.06em" }}>Devis signé</span>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                  <div>
                    <div style={{ fontSize: "10px", color: "#555", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "2px" }}>Signé par</div>
                    <div style={{ fontSize: "13px", fontWeight: 500, color: "#ccc" }}>{project.signatureName}</div>
                  </div>
                  {project.signedAt && (
                    <div>
                      <div style={{ fontSize: "10px", color: "#555", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "2px" }}>Le</div>
                      <div style={{ fontSize: "13px", color: "#aaa" }}>{new Date(project.signedAt).toLocaleString("fr-FR", { day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}</div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Contexte de la marque */}
            {(brief.brandName || brief.sector || brief.brandDesc || brief.target) && (
              <div style={sectionStyle}>
                <div style={sectionTitle}>Contexte de la marque</div>
                <div className="brief-context-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                  {brief.brandName && (
                    <div>
                      <div style={fieldLabel}>Nom / marque</div>
                      <div style={fieldValue}>{brief.brandName}</div>
                    </div>
                  )}
                  {brief.sector && (
                    <div>
                      <div style={fieldLabel}>Secteur</div>
                      <div style={fieldValue}>{brief.sector}</div>
                    </div>
                  )}
                  {brief.target && (
                    <div>
                      <div style={fieldLabel}>Cible principale</div>
                      <div style={fieldValue}>{brief.target}</div>
                    </div>
                  )}
                  {brief.hasIdentity && (
                    <div>
                      <div style={fieldLabel}>Identité visuelle existante</div>
                      <div style={fieldValue}>{brief.hasIdentity}</div>
                    </div>
                  )}
                  {brief.brandDesc && (
                    <div style={{ gridColumn: "1 / -1" }}>
                      <div style={fieldLabel}>Description</div>
                      <div style={{ ...fieldValue, background: "var(--surface2)", borderRadius: "8px", padding: "12px 14px" }}>{brief.brandDesc}</div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Style visuel */}
            {brief.styleAnswers && Object.keys(brief.styleAnswers).length > 0 && (
              <div style={sectionStyle}>
                <div style={sectionTitle}>Composition</div>
                <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                  {Object.entries(brief.styleAnswers).map(([qIndex, answers]) => {
                    if (!answers || answers.length === 0) return null;
                    const qData = styleQuestions[parseInt(qIndex)];
                    return (
                      <div key={qIndex}>
                        <div style={fieldLabel}>{qData?.question || `Question ${parseInt(qIndex) + 1}`}</div>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                          {answers.map((a: string) => (
                            <span key={a} style={{ fontSize: "12px", padding: "4px 10px", borderRadius: "6px", background: "var(--accent-bg)", color: "var(--accent-light)", border: "0.5px solid rgba(127,119,221,0.2)" }}>{a}</span>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Note client */}
            {brief.clientNote && (
              <div style={sectionStyle}>
                <div style={sectionTitle}>Note du client</div>
                <div style={{ fontSize: "13px", color: "var(--text)", lineHeight: 1.7, background: "var(--surface2)", borderRadius: "8px", padding: "14px 16px" }}>
                  {brief.clientNote}
                </div>
              </div>
            )}

            {/* Source */}
            {brief.clientSource && (
              <div style={{ ...sectionStyle, padding: "12px 20px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={fieldLabel}>Comment nous a trouvés :</span>
                  <span style={{ fontSize: "13px", color: "var(--text2)" }}>{brief.clientSource}</span>
                </div>
              </div>
            )}

          </>
        ) : (
          /* Pas encore de brief */
          <div style={{ ...sectionStyle, textAlign: "center", padding: "48px 24px" }}>
            <div style={{ width: "44px", height: "44px", borderRadius: "50%", background: "#1A1200", border: "0.5px solid rgba(250,199,117,0.3)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <circle cx="10" cy="10" r="8" stroke="#FAC775" strokeWidth="1.3"/>
                <path d="M10 6v4M10 13v1" stroke="#FAC775" strokeWidth="1.4" strokeLinecap="round"/>
              </svg>
            </div>
            <p style={{ fontSize: "14px", fontWeight: 500, color: "var(--text)", marginBottom: "6px" }}>Brief non reçu</p>
            <p style={{ fontSize: "13px", color: "var(--text3)", marginBottom: "20px" }}>Le client n&apos;a pas encore rempli son formulaire.</p>
            <button onClick={copyLink}
              style={{ background: "var(--accent-bg)", color: "var(--accent-light)", border: "0.5px solid rgba(127,119,221,0.3)", borderRadius: "10px", padding: "9px 18px", fontSize: "13px", fontWeight: 500, cursor: "pointer", fontFamily: "inherit" }}>
              Renvoyer le lien au client
            </button>
          </div>
        )}

        {/* Note interne — toujours visible */}
        <div style={sectionStyle}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" }}>
            <div style={sectionTitle}>Note interne</div>
            <span style={{ fontSize: "10px", color: "var(--text3)", padding: "1px 7px", borderRadius: "4px", background: "var(--surface2)", border: "0.5px solid var(--border)" }}>Admin uniquement</span>
          </div>
          <textarea
            value={notes}
            onChange={e => handleNotesChange(e.target.value)}
            placeholder="Contexte interne, négociations, contraintes, feedback oral du client…"
            rows={3}
            style={{
              width: "100%", background: "var(--surface2)", border: "0.5px solid var(--border)",
              borderRadius: "8px", padding: "10px 14px", fontSize: "13px", color: "var(--text)",
              fontFamily: "inherit", outline: "none", resize: "vertical", lineHeight: 1.6,
              transition: "border-color 150ms",
            }}
            onFocus={e => (e.currentTarget.style.borderColor = "rgba(127,119,221,0.5)")}
            onBlur={e => (e.currentTarget.style.borderColor = "var(--border)")}
          />
          <p style={{ fontSize: "11px", color: "var(--text3)", marginTop: "6px" }}>Sauvegardée automatiquement</p>
        </div>
      </div>
    </div>
  );
}
