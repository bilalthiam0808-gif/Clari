"use client";

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

type Facture = { amount: number; status: string; issuedAt: string };

function buildMonthlyCA(factures: Facture[]) {
  const now = new Date();
  const months: { label: string; key: string; facture: number; encaisse: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const label = d.toLocaleDateString("fr-FR", { month: "short" });
    months.push({ label, key, facture: 0, encaisse: 0 });
  }
  for (const f of factures) {
    if (!f.issuedAt) continue;
    const key = f.issuedAt.slice(0, 7);
    const m = months.find(m => m.key === key);
    if (!m) continue;
    m.facture += f.amount;
    if (f.status === "Payée") m.encaisse += f.amount;
  }
  return months;
}

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

export default function DashboardClient({ initialProjects, initialFactures }: { initialProjects: Project[]; initialFactures: Facture[] }) {
  const router = useRouter();
  const projects = initialProjects;
  const monthlyCA = buildMonthlyCA(initialFactures);
  const maxCA = Math.max(...monthlyCA.map(m => m.facture), 1);

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
              {total > 0
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
            { label: "Projets actifs", value: String(actifs) },
            { label: "Briefs reçus", value: String(briefs) },
            { label: "Devis envoyés", value: String(devis) },
            { label: "Taux de conversion", value: conversion !== null ? `${conversion}%` : "—" },
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
            {recents.length > 0 && (
              <button onClick={() => router.push("/projets")} style={{ fontSize: "12px", color: "var(--accent)", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit" }}>
                Voir tous →
              </button>
            )}
          </div>

          {recents.length === 0 ? (
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

        {/* CA mensuel */}
        <div style={{ background: "var(--surface)", border: "0.5px solid var(--border)", borderRadius: "12px", padding: "20px 24px", marginTop: "12px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
            <span style={{ fontSize: "13px", fontWeight: 500, color: "var(--text)" }}>Chiffre d&apos;affaires mensuel</span>
            <div style={{ display: "flex", gap: "14px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <div style={{ width: "8px", height: "8px", borderRadius: "2px", background: "var(--accent)" }} />
                <span style={{ fontSize: "11px", color: "var(--text3)" }}>Facturé</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <div style={{ width: "8px", height: "8px", borderRadius: "2px", background: "var(--success)" }} />
                <span style={{ fontSize: "11px", color: "var(--text3)" }}>Encaissé</span>
              </div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "flex-end", gap: "8px", height: "120px" }}>
            {monthlyCA.map(m => (
              <div key={m.key} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "4px", height: "100%" }}>
                <div style={{ flex: 1, width: "100%", display: "flex", alignItems: "flex-end", gap: "3px" }}>
                  <div title={`Facturé : ${m.facture.toLocaleString("fr-FR")} €`}
                    style={{ flex: 1, background: "var(--accent)", borderRadius: "3px 3px 0 0", height: `${Math.round((m.facture / maxCA) * 100)}%`, minHeight: m.facture > 0 ? "3px" : "0", transition: "height 400ms ease", opacity: 0.85 }} />
                  <div title={`Encaissé : ${m.encaisse.toLocaleString("fr-FR")} €`}
                    style={{ flex: 1, background: "var(--success)", borderRadius: "3px 3px 0 0", height: `${Math.round((m.encaisse / maxCA) * 100)}%`, minHeight: m.encaisse > 0 ? "3px" : "0", transition: "height 400ms ease" }} />
                </div>
                <span style={{ fontSize: "10px", color: "var(--text3)", textTransform: "capitalize" }}>{m.label}</span>
              </div>
            ))}
          </div>
          {initialFactures.length === 0 && (
            <p style={{ fontSize: "12px", color: "var(--text3)", textAlign: "center", marginTop: "12px" }}>Aucune facture enregistrée pour l&apos;instant.</p>
          )}
        </div>

      </main>
    </div>
  );
}
