"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";

type Project = {
  id: string;
  clientName: string;
  clientEmail: string;
  serviceName: string;
  status: "En attente" | "Brief reçu" | "Devis envoyé";
  createdAt: string;
  briefData?: { totalEstime?: number; serviceCategory?: string };
};

const statusColors: Record<string, { bg: string; color: string }> = {
  "En attente":   { bg: "#1A1200", color: "#FAC775" },
  "Brief reçu":   { bg: "#0A1A12", color: "#5DCAA5" },
  "Devis envoyé": { bg: "#1A1A2E", color: "#CECBF6" },
};

const categoryColors: Record<string, { bg: string; color: string }> = {
  "Graphisme":     { bg: "#1A1A2E", color: "#CECBF6" },
  "Motion Design": { bg: "#1A0D2E", color: "#C4B8F0" },
  "Site web":      { bg: "#0A1A12", color: "#9FE1CB" },
};

export default function Dashboard() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    fetch("/api/projects")
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setProjects(data); })
      .finally(() => setMounted(true));
  }, []);

  const total = projects.length;
  const briefs = projects.filter(p => p.briefData).length;
  const devis = projects.filter(p => p.status === "Devis envoyé").length;
  const actifs = projects.filter(p => p.status !== "Devis envoyé").length;
  const conversion = briefs > 0 ? Math.round((devis / briefs) * 100) : null;

  const recents = [...projects]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "var(--bg)" }}>
      <Sidebar />

      <main className="admin-main" style={{ flex: 1, overflow: "auto", padding: "28px 32px" }}>

        {/* Header */}
        <div className="dashboard-header" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "28px" }}>
          <div>
            <h1 style={{ fontSize: "20px", fontWeight: 600, color: "var(--text)", marginBottom: "2px" }}>Dashboard</h1>
            <p style={{ fontSize: "13px", color: "var(--text2)" }}>
              {mounted && total > 0
                ? `${total} projet${total > 1 ? "s" : ""} au total`
                : "Bienvenue sur Clari — configure tes services et envoie ton premier lien client."}
            </p>
          </div>
          <button
            onClick={() => router.push("/projets")}
            style={{ background: "var(--accent)", color: "#fff", border: "none", borderRadius: "10px", padding: "9px 18px", fontSize: "13px", fontWeight: 500, cursor: "pointer", fontFamily: "inherit" }}>
            + Nouveau projet
          </button>
        </div>

        {/* Stats */}
        <div className="stats-grid-4" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "10px", marginBottom: "28px" }}>
          {[
            { label: "Projets actifs", value: mounted ? String(actifs) : "—" },
            { label: "Briefs reçus", value: mounted ? String(briefs) : "—" },
            { label: "Devis envoyés", value: mounted ? String(devis) : "—" },
            { label: "Taux de conversion", value: mounted && conversion !== null ? `${conversion}%` : "—" },
          ].map((stat) => (
            <div key={stat.label} style={{ background: "var(--surface)", border: "0.5px solid var(--border)", borderRadius: "10px", padding: "14px 16px" }}>
              <div style={{ fontSize: "22px", fontWeight: 600, color: "var(--text)", lineHeight: 1.2 }}>{stat.value}</div>
              <div style={{ fontSize: "11px", color: "var(--text2)", marginTop: "4px", textTransform: "uppercase", letterSpacing: "0.06em" }}>{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Projets récents */}
        <div style={{ background: "var(--surface)", border: "0.5px solid var(--border)", borderRadius: "12px", overflow: "hidden" }}>
          <div style={{ padding: "14px 20px", borderBottom: "0.5px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: "13px", fontWeight: 500, color: "var(--text)" }}>Projets récents</span>
            {mounted && recents.length > 0 && (
              <button onClick={() => router.push("/projets")} style={{ fontSize: "12px", color: "var(--accent)", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit" }}>
                Voir tous →
              </button>
            )}
          </div>

          {!mounted || recents.length === 0 ? (
            <div style={{ padding: "48px 20px", textAlign: "center" }}>
              <p style={{ fontSize: "13px", color: "var(--text2)", marginBottom: "16px" }}>
                Crée tes services, puis génère un lien unique à envoyer à ton client.
              </p>
              <a href="/services" style={{ display: "inline-block", background: "transparent", color: "var(--accent)", border: "0.5px solid var(--accent)", borderRadius: "10px", padding: "8px 16px", fontSize: "13px", fontWeight: 500, textDecoration: "none" }}>
                Configurer mes services →
              </a>
            </div>
          ) : (
            <div>
              {recents.map((p, i) => {
                const status = statusColors[p.status];
                const catColor = p.briefData?.serviceCategory
                  ? (categoryColors[p.briefData.serviceCategory] || { bg: "#1A1A1A", color: "#888" })
                  : null;
                return (
                  <div
                    key={p.id}
                    onClick={() => router.push(`/projets/${p.id}`)}
                    style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 20px", borderBottom: i < recents.length - 1 ? "0.5px solid var(--border)" : "none", cursor: "pointer", transition: "background 100ms" }}
                    onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.background = "var(--surface2)"}
                    onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.background = "transparent"}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <div style={{ width: "34px", height: "34px", borderRadius: "9px", background: "rgba(127,119,221,0.12)", border: "0.5px solid rgba(127,119,221,0.2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--accent-light)" }}>
                          {p.clientName.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <div style={{ fontSize: "13px", fontWeight: 500, color: "var(--text)", marginBottom: "2px" }}>{p.clientName}</div>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          {catColor && (
                            <span style={{ fontSize: "9px", fontWeight: 500, padding: "1px 6px", borderRadius: "3px", background: catColor.bg, color: catColor.color }}>{p.briefData?.serviceCategory}</span>
                          )}
                          <span style={{ fontSize: "11px", color: "var(--text3)" }}>{p.serviceName}</span>
                        </div>
                      </div>
                    </div>
                    <div className="recent-row-right" style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      {p.briefData?.totalEstime !== undefined && (
                        <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--accent)" }}>{p.briefData.totalEstime.toLocaleString("fr-FR")} €</span>
                      )}
                      <span style={{ fontSize: "10px", fontWeight: 500, padding: "3px 8px", borderRadius: "5px", background: status.bg, color: status.color, whiteSpace: "nowrap" }}>{p.status}</span>
                      <span className="recent-row-date" style={{ fontSize: "11px", color: "var(--text3)", whiteSpace: "nowrap" }}>{p.createdAt}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </main>
    </div>
  );
}
