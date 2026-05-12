"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";

type BriefData = {
  selectedService?: string;
  serviceCategory?: string;
  totalEstime?: number;
  brandName?: string;
  sector?: string;
  brandDesc?: string;
  clientNote?: string;
  selectedOptions?: string[];
};

type Project = {
  id: string;
  clientName: string;
  clientEmail: string;
  serviceId: string;
  serviceName: string;
  status: "En attente" | "Brief reçu" | "Devis envoyé";
  slug: string;
  createdAt: string;
  briefData?: BriefData;
  source?: string;
};

const categoryColors: Record<string, { bg: string; color: string }> = {
  "Graphisme":     { bg: "#1A1A2E", color: "#CECBF6" },
  "Motion Design": { bg: "#1A0D2E", color: "#C4B8F0" },
  "Site web":      { bg: "#0A1A12", color: "#9FE1CB" },
};

function getCategoryColor(cat?: string) {
  if (!cat) return { bg: "#1A1A1A", color: "#888" };
  return categoryColors[cat] || { bg: "#1A1A1A", color: "#888888" };
}

export default function BriefsPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [filter, setFilter] = useState<"all" | "brief" | "devis">("all");

  useEffect(() => {
    fetch("/api/projects")
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setProjects(data); });
  }, []);

  const briefs = projects.filter(p => p.briefData);
  const filtered = briefs.filter(p => {
    if (filter === "brief") return p.status === "Brief reçu";
    if (filter === "devis") return p.status === "Devis envoyé";
    return true;
  });

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden", background: "var(--bg)" }}>
      <Sidebar />

      <main className="admin-main" style={{ flex: 1, overflow: "auto", padding: "28px 32px" }}>

        {/* Header */}
        <div className="briefs-header" style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "28px" }}>
          <div>
            <h1 style={{ fontSize: "20px", fontWeight: 600, color: "var(--text)", marginBottom: "2px" }}>Briefs reçus</h1>
            <p style={{ fontSize: "13px", color: "var(--text2)" }}>
              {briefs.length} brief{briefs.length > 1 ? "s" : ""} reçu{briefs.length > 1 ? "s" : ""} — cliquez sur un dossier pour voir le détail.
            </p>
          </div>

          {briefs.length > 0 && (
            <div className="briefs-filter" style={{ display: "flex", gap: "6px" }}>
              {([
                { key: "all", label: "Tous" },
                { key: "brief", label: "Brief reçu" },
                { key: "devis", label: "Devis envoyé" },
              ] as { key: typeof filter; label: string }[]).map(f => (
                <button key={f.key} onClick={() => setFilter(f.key)}
                  style={{ padding: "6px 14px", borderRadius: "8px", fontSize: "12px", fontWeight: 500, cursor: "pointer", fontFamily: "inherit", background: filter === f.key ? "var(--accent-bg)" : "transparent", color: filter === f.key ? "var(--accent-light)" : "var(--text3)", border: filter === f.key ? "0.5px solid rgba(127,119,221,0.4)" : "0.5px solid var(--border)", transition: "all 100ms" }}>
                  {f.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* État vide */}
        {briefs.length === 0 ? (
          <div style={{ background: "var(--surface)", border: "0.5px solid var(--border)", borderRadius: "12px", padding: "72px 20px", textAlign: "center" }}>
            <div style={{ width: "48px", height: "48px", borderRadius: "50%", background: "var(--surface2)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
              <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                <path d="M4 5h14M4 9h14M4 13h8" stroke="var(--text3)" strokeWidth="1.4" strokeLinecap="round"/>
                <circle cx="17" cy="16" r="3.5" stroke="var(--text3)" strokeWidth="1.3"/>
              </svg>
            </div>
            <p style={{ fontSize: "14px", fontWeight: 500, color: "var(--text)", marginBottom: "6px" }}>Aucun brief reçu pour l&apos;instant</p>
            <p style={{ fontSize: "13px", color: "var(--text2)", maxWidth: "320px", margin: "0 auto" }}>
              Les briefs apparaissent ici dès qu&apos;un client remplit son formulaire via un lien projet ou le lien générique.
            </p>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ background: "var(--surface)", border: "0.5px solid var(--border)", borderRadius: "12px", padding: "40px 20px", textAlign: "center" }}>
            <p style={{ fontSize: "13px", color: "var(--text2)" }}>Aucun brief dans ce filtre.</p>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(320px, 100%), 1fr))", gap: "12px" }}>
            {filtered.map(project => {
              const brief = project.briefData!;
              const col = getCategoryColor(brief.serviceCategory);

              return (
                <div
                  key={project.id}
                  onClick={() => router.push(`/projets/${project.id}`)}
                  style={{ background: "var(--surface)", border: "0.5px solid var(--border)", borderRadius: "14px", padding: "20px", cursor: "pointer", transition: "border-color 150ms, background 150ms" }}
                  onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = "var(--border-hover)"; (e.currentTarget as HTMLDivElement).style.background = "var(--surface2)"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = "var(--border)"; (e.currentTarget as HTMLDivElement).style.background = "var(--surface)"; }}
                >
                  {/* En-tête */}
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "14px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: "var(--accent-bg)", border: "0.5px solid rgba(127,119,221,0.2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <span style={{ fontSize: "13px", fontWeight: 700, color: "var(--accent-light)" }}>
                          {project.clientName.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <div style={{ fontSize: "14px", fontWeight: 600, color: "var(--text)", marginBottom: "2px" }}>{project.clientName}</div>
                        <div style={{ fontSize: "11px", color: "var(--text3)" }}>{project.clientEmail}</div>
                      </div>
                    </div>
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ color: "var(--text3)", flexShrink: 0, marginTop: "2px" }}>
                      <path d="M4 7h6M7 4l3 3-3 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>

                  {/* Prestation */}
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" }}>
                    {brief.serviceCategory && (
                      <span style={{ fontSize: "10px", fontWeight: 500, padding: "2px 7px", borderRadius: "4px", background: col.bg, color: col.color }}>{brief.serviceCategory}</span>
                    )}
                    <span style={{ fontSize: "12px", color: "var(--text2)" }}>{brief.selectedService || project.serviceName}</span>
                  </div>

                  {/* Résumé marque */}
                  {brief.brandName && (
                    <div style={{ fontSize: "12px", color: "var(--text2)", marginBottom: "8px" }}>
                      <span style={{ color: "var(--text3)" }}>Marque : </span>{brief.brandName}
                      {brief.sector && <span style={{ color: "var(--text3)" }}> — {brief.sector}</span>}
                    </div>
                  )}

                  {/* Note client */}
                  {brief.clientNote && (
                    <div style={{ fontSize: "12px", color: "var(--text2)", background: "var(--surface2)", borderRadius: "6px", padding: "8px 10px", marginBottom: "12px", lineHeight: 1.5, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
                      &ldquo;{brief.clientNote}&rdquo;
                    </div>
                  )}

                  {/* Pied de carte */}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: "10px", borderTop: "0.5px solid var(--border)" }}>
                    <div style={{ fontSize: "11px", color: "var(--text3)" }}>
                      {project.createdAt}
                      {brief.selectedOptions && brief.selectedOptions.length > 0 && (
                        <span style={{ marginLeft: "8px" }}>• {brief.selectedOptions.length} option{brief.selectedOptions.length > 1 ? "s" : ""}</span>
                      )}
                    </div>
                    {brief.totalEstime !== undefined && (
                      <div style={{ fontSize: "15px", fontWeight: 700, color: "var(--accent)" }}>{brief.totalEstime.toLocaleString("fr-FR")} €</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
