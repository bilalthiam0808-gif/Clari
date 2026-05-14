"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import { toast } from "@/components/Toaster";

type Service = { id: string; name: string; category: string };

type BriefData = {
  clientPhone?: string;
  clientCity?: string;
  totalEstime?: number;
  selectedService?: string;
  serviceCategory?: string;
};

type Project = {
  id: string;
  clientName: string;
  clientEmail: string;
  serviceId: string;
  serviceName: string;
  status: string;
  slug: string;
  createdAt: string;
  briefData: BriefData | null;
  source?: string;
};

type Facture = {
  id: string;
  projectId: string | null;
  clientName: string;
  clientEmail: string;
  serviceName: string;
  amount: number;
  status: "En attente" | "Envoyée" | "Payée" | "En retard";
  issuedAt: string;
  dueAt: string | null;
  paidAt: string | null;
  notes: string | null;
};

type Client = {
  name: string;
  email: string;
  phone?: string;
  city?: string;
  projects: Project[];
};

const statusColors: Record<string, { bg: string; color: string }> = {
  "En attente":   { bg: "#1A1200", color: "#FAC775" },
  "Brief reçu":   { bg: "#0A1A12", color: "#5DCAA5" },
  "Devis envoyé": { bg: "#1A1A2E", color: "#CECBF6" },
  "Signé":        { bg: "#0A1220", color: "#7DD3FC" },
};

const factureStatusColors: Record<string, { bg: string; color: string }> = {
  "En attente": { bg: "#1A1200", color: "#FAC775" },
  "Envoyée":    { bg: "#1A1A2E", color: "#CECBF6" },
  "Payée":      { bg: "#0A1A12", color: "#5DCAA5" },
  "En retard":  { bg: "#1A0808", color: "#E24B4A" },
};

const FACTURE_STATUSES = ["En attente", "Envoyée", "Payée", "En retard"] as const;

function generateSlug(name: string): string {
  const base = name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 20);
  return `${base}-${Math.random().toString(36).slice(2, 8)}`;
}

function groupByClient(projects: Project[]): Client[] {
  const map = new Map<string, Client>();
  for (const p of projects) {
    const key = p.clientEmail.toLowerCase();
    if (!map.has(key)) map.set(key, { name: p.clientName, email: p.clientEmail, projects: [] });
    const c = map.get(key)!;
    if (!c.phone && p.briefData?.clientPhone) c.phone = p.briefData.clientPhone;
    if (!c.city && p.briefData?.clientCity) c.city = p.briefData.clientCity;
    c.projects.push(p);
  }
  return Array.from(map.values());
}

function fmtDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
}

export default function ClientsPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [mounted, setMounted] = useState(false);
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);

  // Factures — keyed by client email
  const [factures, setFactures] = useState<Record<string, Facture[]>>({});
  const [loadingFactures, setLoadingFactures] = useState<Record<string, boolean>>({});

  // Relance state per key "id-type"
  const [relancing, setRelancing] = useState<Record<string, boolean>>({});
  const [relanced, setRelanced] = useState<Record<string, boolean>>({});

  // Envoi facture PDF
  const [sendingFacture, setSendingFacture] = useState<Record<string, boolean>>({});

  // Modal nouvelle facture
  const [showFactureModal, setShowFactureModal] = useState<{ client: Client; project: Project | null } | null>(null);
  const [fServiceName, setFServiceName] = useState("");
  const [fAmount, setFAmount] = useState("");
  const [fDueAt, setFDueAt] = useState("");
  const [fNotes, setFNotes] = useState("");
  const [fSaving, setFSaving] = useState(false);

  // Modal nouveau client
  const [showModal, setShowModal] = useState(false);
  const [generatedSlug, setGeneratedSlug] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [serviceId, setServiceId] = useState("");

  useEffect(() => {
    Promise.all([
      fetch("/api/projects").then(r => r.ok ? r.json() : []),
      fetch("/api/services").then(r => r.ok ? r.json() : []),
    ]).then(([p, s]) => {
      if (Array.isArray(p)) setProjects(p);
      if (Array.isArray(s)) setServices(s);
    }).finally(() => setMounted(true));
  }, []);

  const loadFactures = useCallback(async (email: string) => {
    if (factures[email] !== undefined) return;
    setLoadingFactures(l => ({ ...l, [email]: true }));
    const res = await fetch(`/api/factures?email=${encodeURIComponent(email)}`);
    const data = res.ok ? await res.json() : [];
    setFactures(f => ({ ...f, [email]: Array.isArray(data) ? data : [] }));
    setLoadingFactures(l => ({ ...l, [email]: false }));
  }, [factures]);

  function toggleExpanded(email: string) {
    if (expanded === email) { setExpanded(null); return; }
    setExpanded(email);
    loadFactures(email);
  }

  async function updateFactureStatus(factureId: string, email: string, status: Facture["status"]) {
    const res = await fetch(`/api/factures/${factureId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      const updated = await res.json();
      setFactures(f => ({ ...f, [email]: (f[email] ?? []).map(fa => fa.id === factureId ? updated : fa) }));
    }
  }

  async function deleteFacture(factureId: string, email: string) {
    if (!confirm("Supprimer cette facture ?")) return;
    const res = await fetch(`/api/factures/${factureId}`, { method: "DELETE" });
    if (res.ok) setFactures(f => ({ ...f, [email]: (f[email] ?? []).filter(fa => fa.id !== factureId) }));
  }

  function openFactureModal(client: Client, project: Project | null) {
    setFServiceName(project?.serviceName ?? "");
    setFAmount(project?.briefData?.totalEstime?.toString() ?? "");
    setFDueAt(""); setFNotes("");
    setShowFactureModal({ client, project });
  }

  async function createFacture() {
    if (!showFactureModal || !fServiceName || !fAmount) return;
    setFSaving(true);
    const { client, project } = showFactureModal;
    const res = await fetch("/api/factures", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        projectId: project?.id ?? null,
        clientName: client.name,
        clientEmail: client.email,
        serviceName: fServiceName,
        amount: parseFloat(fAmount),
        dueAt: fDueAt || null,
        notes: fNotes || null,
      }),
    });
    setFSaving(false);
    if (res.ok) {
      const created = await res.json();
      setFactures(f => ({ ...f, [client.email]: [created, ...(f[client.email] ?? [])] }));
      setShowFactureModal(null);
    }
  }

  async function relance(email: string, name: string, serviceName: string, amount: number | undefined, type: "devis" | "facture", key: string) {
    setRelancing(r => ({ ...r, [key]: true }));
    const res = await fetch("/api/relance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clientEmail: email, clientName: name, serviceName, total: amount, type }),
    });
    setRelancing(r => ({ ...r, [key]: false }));
    if (res.ok) {
      setRelanced(r => ({ ...r, [key]: true }));
      setTimeout(() => setRelanced(r => { const c = { ...r }; delete c[key]; return c; }), 4000);
    }
  }

  async function sendFacture(factureId: string, email: string) {
    setSendingFacture(s => ({ ...s, [factureId]: true }));
    const res = await fetch(`/api/factures/${factureId}/send`, { method: "POST" });
    setSendingFacture(s => ({ ...s, [factureId]: false }));
    if (res.ok) {
      const { ref } = await res.json();
      toast(`Facture N°${ref} envoyée à ${email}`, "success");
      // Mise à jour locale du statut
      setFactures(f => {
        const updated: Record<string, Facture[]> = {};
        for (const [k, arr] of Object.entries(f)) {
          updated[k] = arr.map(fa => fa.id === factureId && fa.status === "En attente" ? { ...fa, status: "Envoyée" } : fa);
        }
        return updated;
      });
    } else {
      toast("Erreur lors de l'envoi de la facture", "error");
    }
  }

  function exportClientsCSV() {
    const rows = [["Client", "Email", "Téléphone", "Ville", "Projets", "Dernier statut"]];
    for (const c of clients) {
      rows.push([c.name, c.email, c.phone ?? "", c.city ?? "", String(c.projects.length), c.projects[0]?.status ?? ""]);
    }
    const csv = rows.map(r => r.map(v => `"${v.replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "clients-clari.csv"; a.click();
    URL.revokeObjectURL(url);
    toast("Export téléchargé", "success");
  }

  function exportFacturesCSV() {
    const allFactures = Object.values(factures).flat();
    if (!allFactures.length) { toast("Aucune facture à exporter", "info"); return; }
    const rows = [["Client", "Email", "Prestation", "Montant (€)", "Statut", "Émise le", "Échéance", "Payée le"]];
    for (const f of allFactures) {
      rows.push([f.clientName, f.clientEmail, f.serviceName, String(f.amount), f.status, fmtDate(f.issuedAt), fmtDate(f.dueAt), fmtDate(f.paidAt)]);
    }
    const csv = rows.map(r => r.map(v => `"${v.replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "factures-clari.csv"; a.click();
    URL.revokeObjectURL(url);
    toast("Export téléchargé", "success");
  }

  function openModal() {
    setClientName(""); setClientEmail(""); setServiceId(services[0]?.id ?? "");
    setGeneratedSlug(null); setCopied(false); setShowModal(true);
  }

  async function createClient() {
    if (!clientName.trim() || !clientEmail.trim() || !serviceId) return;
    setSaving(true);
    const service = services.find(s => s.id === serviceId);
    const slug = generateSlug(clientName);
    const id = crypto.randomUUID();
    const res = await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, clientName: clientName.trim(), clientEmail: clientEmail.trim(), serviceId, serviceName: service?.name ?? "", status: "En attente", slug, createdAt: new Date().toISOString(), briefData: null }),
    });
    setSaving(false);
    if (res.ok) { const created = await res.json(); setProjects(prev => [created, ...prev]); setGeneratedSlug(slug); }
  }

  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const briefUrl = generatedSlug ? `${origin}/b/${generatedSlug}` : "";

  const clients = groupByClient(projects);
  const filtered = search
    ? clients.filter(c => c.name.toLowerCase().includes(search.toLowerCase()) || c.email.toLowerCase().includes(search.toLowerCase()))
    : clients;

  const inputBase: React.CSSProperties = {
    background: "var(--surface2)", border: "0.5px solid var(--border)", borderRadius: "8px",
    padding: "9px 12px", fontSize: "13px", color: "var(--text)", fontFamily: "inherit", outline: "none", width: "100%",
  };

  const sectionLabel: React.CSSProperties = {
    fontSize: "10px", fontWeight: 600, color: "var(--text3)", textTransform: "uppercase",
    letterSpacing: "0.08em", marginBottom: "10px",
  };

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden", background: "var(--bg)" }}>
      <Sidebar />
      <main className="admin-main" style={{ flex: 1, overflow: "auto", padding: "28px 32px" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "28px" }}>
          <div>
            <h1 style={{ fontSize: "20px", fontWeight: 600, color: "var(--text)", marginBottom: "2px" }}>Clients</h1>
            <p style={{ fontSize: "13px", color: "var(--text2)" }}>
              {mounted ? `${clients.length} client${clients.length > 1 ? "s" : ""}` : "Chargement…"}
            </p>
          </div>
          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <button onClick={exportClientsCSV} title="Exporter clients CSV"
              style={{ width: "34px", height: "34px", display: "flex", alignItems: "center", justifyContent: "center", border: "0.5px solid var(--border)", borderRadius: "9px", background: "transparent", color: "var(--text3)", cursor: "pointer" }}
              onMouseEnter={e => { e.currentTarget.style.color = "var(--text)"; e.currentTarget.style.borderColor = "var(--border-hover)"; }}
              onMouseLeave={e => { e.currentTarget.style.color = "var(--text3)"; e.currentTarget.style.borderColor = "var(--border)"; }}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 1v8M4.5 6.5L7 9l2.5-2.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/><path d="M2 10v1.5A1.5 1.5 0 003.5 13h7a1.5 1.5 0 001.5-1.5V10" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>
            </button>
            <button onClick={exportFacturesCSV} title="Exporter factures CSV"
              style={{ padding: "7px 13px", display: "flex", alignItems: "center", gap: "6px", border: "0.5px solid var(--border)", borderRadius: "9px", background: "transparent", color: "var(--text3)", fontSize: "12px", fontWeight: 500, cursor: "pointer", fontFamily: "inherit" }}
              onMouseEnter={e => { e.currentTarget.style.color = "var(--text)"; e.currentTarget.style.borderColor = "var(--border-hover)"; }}
              onMouseLeave={e => { e.currentTarget.style.color = "var(--text3)"; e.currentTarget.style.borderColor = "var(--border)"; }}>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M6 1v7M3.5 5.5L6 8l2.5-2.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/><path d="M1.5 9v1A1.5 1.5 0 003 11.5h6A1.5 1.5 0 0010.5 10V9" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>
              Factures
            </button>
            <button onClick={openModal}
              style={{ display: "flex", alignItems: "center", gap: "8px", padding: "9px 18px", borderRadius: "9px", fontSize: "13px", fontWeight: 500, cursor: "pointer", fontFamily: "inherit", background: "var(--accent)", color: "#FFF", border: "none" }}>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M6 1v10M1 6h10" stroke="white" strokeWidth="1.5" strokeLinecap="round"/></svg>
              Nouveau client
            </button>
          </div>
        </div>

        {/* Search */}
        <div style={{ position: "relative", marginBottom: "20px", maxWidth: "360px" }}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--text3)", pointerEvents: "none" }}>
            <circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.2"/>
            <path d="M9.5 9.5l3 3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
          </svg>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher un client…" style={{ ...inputBase, paddingLeft: "34px" }} />
        </div>

        {/* List */}
        {!mounted ? null : filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 0", color: "var(--text3)", fontSize: "13px" }}>
            {search ? "Aucun client trouvé." : "Aucun client pour l'instant."}
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {filtered.map(client => {
              const isOpen = expanded === client.email;
              const latestProject = client.projects[0];
              const statusCol = statusColors[latestProject?.status ?? "En attente"] ?? { bg: "#1A1200", color: "#FAC775" };
              const devisProjects = client.projects.filter(p => p.status === "Devis envoyé");
              const clientFactures = factures[client.email] ?? [];

              return (
                <div key={client.email} style={{ background: "var(--surface)", border: "0.5px solid var(--border)", borderRadius: "14px", overflow: "hidden" }}>

                  {/* Row header */}
                  <button onClick={() => toggleExpanded(client.email)}
                    style={{ width: "100%", display: "flex", alignItems: "center", gap: "14px", padding: "14px 16px", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", textAlign: "left" }}>
                    <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "var(--accent-bg)", border: "0.5px solid rgba(127,119,221,0.3)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--accent-light)" }}>
                        {client.name.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase()}
                      </span>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: "13px", fontWeight: 500, color: "var(--text)", marginBottom: "2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{client.name}</div>
                      <div style={{ fontSize: "11px", color: "var(--text3)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{client.email}{client.city ? ` · ${client.city}` : ""}</div>
                    </div>
                    <span style={{ fontSize: "11px", color: "var(--text3)", flexShrink: 0 }}>{client.projects.length} projet{client.projects.length > 1 ? "s" : ""}</span>
                    <span style={{ fontSize: "10px", fontWeight: 500, padding: "3px 9px", borderRadius: "5px", background: statusCol.bg, color: statusCol.color, border: `0.5px solid ${statusCol.color}40`, flexShrink: 0 }}>
                      {latestProject?.status ?? "—"}
                    </span>
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ flexShrink: 0, transform: isOpen ? "rotate(180deg)" : "rotate(0)", transition: "transform 150ms", color: "var(--text3)" }}>
                      <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>

                  {/* Expanded panel */}
                  {isOpen && (
                    <div style={{ borderTop: "0.5px solid var(--border)" }}>

                      {/* ── Coordonnées ── */}
                      <div style={{ padding: "16px 18px", borderBottom: "0.5px solid var(--border)", background: "var(--surface2)" }}>
                        <div style={sectionLabel}>Coordonnées</div>
                        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "16px", flexWrap: "wrap" }}>
                          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                              <svg width="13" height="13" viewBox="0 0 13 13" fill="none" style={{ color: "var(--text3)", flexShrink: 0 }}><rect x="1" y="2.5" width="11" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.1"/><path d="M1 4l5.5 3.5L12 4" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round"/></svg>
                              <a href={`mailto:${client.email}`} style={{ fontSize: "13px", color: "var(--text)", textDecoration: "none" }}
                                onMouseEnter={e => (e.currentTarget.style.color = "var(--accent-light)")}
                                onMouseLeave={e => (e.currentTarget.style.color = "var(--text)")}>
                                {client.email}
                              </a>
                            </div>
                            {client.phone ? (
                              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                <svg width="13" height="13" viewBox="0 0 13 13" fill="none" style={{ color: "var(--text3)", flexShrink: 0 }}><path d="M2 2.5C2 2.5 2.5 1 4 1.5s2 2.5 2 2.5-1 1-1 2 1.5 2.5 2.5 3.5 2.5 1.5 3.5 1-1-2-1-2S13 8 12.5 9.5s-2 1.5-2 1.5C4 12 1 6 1 3.5c0-1 1-1 1-1Z" stroke="currentColor" strokeWidth="1.1" strokeLinejoin="round"/></svg>
                                <a href={`tel:${client.phone}`} style={{ fontSize: "13px", color: "var(--text)", textDecoration: "none" }}
                                  onMouseEnter={e => (e.currentTarget.style.color = "var(--accent-light)")}
                                  onMouseLeave={e => (e.currentTarget.style.color = "var(--text)")}>
                                  {client.phone}
                                </a>
                              </div>
                            ) : (
                              <div style={{ fontSize: "11px", color: "var(--text3)", fontStyle: "italic" }}>Téléphone non renseigné</div>
                            )}
                            {client.city && (
                              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                <svg width="13" height="13" viewBox="0 0 13 13" fill="none" style={{ color: "var(--text3)", flexShrink: 0 }}><path d="M6.5 1a4 4 0 0 1 4 4c0 3-4 7.5-4 7.5S2.5 8 2.5 5a4 4 0 0 1 4-4Z" stroke="currentColor" strokeWidth="1.1"/><circle cx="6.5" cy="5" r="1.5" stroke="currentColor" strokeWidth="1.1"/></svg>
                                <span style={{ fontSize: "13px", color: "var(--text2)" }}>{client.city}</span>
                              </div>
                            )}
                          </div>
                          <div style={{ display: "flex", gap: "8px", flexShrink: 0 }}>
                            <a href={`mailto:${client.email}`} style={{ display: "flex", alignItems: "center", gap: "6px", padding: "7px 14px", borderRadius: "8px", border: "0.5px solid var(--border)", background: "var(--surface)", color: "var(--text2)", fontSize: "12px", textDecoration: "none", fontWeight: 500 }}>
                              <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><rect x="1" y="2" width="10" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.1"/><path d="M1 3.5l5 3.5 5-3.5" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round"/></svg>
                              Envoyer un email
                            </a>
                            {client.phone && (
                              <a href={`tel:${client.phone}`} style={{ display: "flex", alignItems: "center", gap: "6px", padding: "7px 14px", borderRadius: "8px", border: "0.5px solid var(--border)", background: "var(--surface)", color: "var(--text2)", fontSize: "12px", textDecoration: "none", fontWeight: 500 }}>
                                <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M1.5 2C1.5 2 2 1 3.5 1.5s1.5 2 1.5 2-.5.5-.5 1.5 1.5 2.5 2.5 3 2 .5 2.5-.5-1-2-1-2S12 7 11.5 8.5s-2 1-2 1C3.5 11 .5 6 .5 3.5c0-1 1-1.5 1-1.5Z" stroke="currentColor" strokeWidth="1.1" strokeLinejoin="round"/></svg>
                                Appeler
                              </a>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* ── Projets ── */}
                      <div style={{ padding: "16px 18px", borderBottom: "0.5px solid var(--border)" }}>
                        <div style={sectionLabel}>Projets ({client.projects.length})</div>
                        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                          {client.projects.map(p => {
                            const sc = statusColors[p.status] ?? { bg: "#1A1200", color: "#FAC775" };
                            return (
                              <div key={p.id} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "9px 12px", background: "var(--surface2)", borderRadius: "8px" }}>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <span style={{ fontSize: "13px", fontWeight: 500, color: "var(--text)" }}>{p.serviceName}</span>
                                  <span style={{ fontSize: "11px", color: "var(--text3)", marginLeft: "8px" }}>{fmtDate(p.createdAt)}</span>
                                </div>
                                {p.briefData?.totalEstime !== undefined && (
                                  <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--accent)", flexShrink: 0 }}>
                                    {p.briefData.totalEstime.toLocaleString("fr-FR")} €
                                  </span>
                                )}
                                <span style={{ fontSize: "10px", fontWeight: 500, padding: "2px 8px", borderRadius: "4px", background: sc.bg, color: sc.color, border: `0.5px solid ${sc.color}40`, flexShrink: 0 }}>
                                  {p.status}
                                </span>
                                <button onClick={() => router.push(`/projets/${p.id}`)} title="Voir le projet"
                                  style={{ width: "28px", height: "28px", flexShrink: 0, borderRadius: "6px", border: "0.5px solid var(--border)", background: "transparent", color: "var(--text3)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                  <svg width="11" height="11" viewBox="0 0 11 11" fill="none"><path d="M2 9l7-7M4 2h5v5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* ── Devis ── */}
                      <div style={{ padding: "16px 18px", borderBottom: "0.5px solid var(--border)" }}>
                        <div style={sectionLabel}>Devis ({devisProjects.length})</div>
                        {devisProjects.length === 0 ? (
                          <p style={{ fontSize: "12px", color: "var(--text3)", fontStyle: "italic", margin: 0 }}>Aucun devis envoyé pour ce client.</p>
                        ) : (
                          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                            {devisProjects.map(p => {
                              const keyD = `${p.id}-devis`;
                              return (
                                <div key={p.id} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "9px 12px", background: "var(--surface2)", borderRadius: "8px" }}>
                                  <div style={{ flex: 1, minWidth: 0 }}>
                                    <span style={{ fontSize: "13px", fontWeight: 500, color: "var(--text)" }}>{p.serviceName}</span>
                                    <span style={{ fontSize: "11px", color: "var(--text3)", marginLeft: "8px" }}>{fmtDate(p.createdAt)}</span>
                                  </div>
                                  {p.briefData?.totalEstime !== undefined && (
                                    <span style={{ fontSize: "13px", fontWeight: 700, color: "var(--accent)", flexShrink: 0 }}>
                                      {p.briefData.totalEstime.toLocaleString("fr-FR")} €
                                    </span>
                                  )}
                                  <span style={{ fontSize: "10px", fontWeight: 500, padding: "2px 8px", borderRadius: "4px", background: "#1A1A2E", color: "#CECBF6", border: "0.5px solid #CECBF640", flexShrink: 0 }}>Envoyé</span>
                                  {relanced[keyD] ? (
                                    <span style={{ fontSize: "11px", color: "var(--success)", display: "flex", alignItems: "center", gap: "4px", flexShrink: 0 }}>
                                      <svg width="11" height="11" viewBox="0 0 11 11" fill="none"><path d="M1.5 5.5l2.5 2.5L9.5 2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
                                      Envoyée
                                    </span>
                                  ) : (
                                    <button onClick={() => relance(p.clientEmail, p.clientName, p.serviceName, p.briefData?.totalEstime, "devis", keyD)}
                                      disabled={relancing[keyD]}
                                      style={{ display: "flex", alignItems: "center", gap: "5px", padding: "5px 10px", borderRadius: "7px", border: "0.5px solid rgba(127,119,221,0.4)", background: "var(--accent-bg)", color: "var(--accent-light)", fontSize: "11px", fontWeight: 500, cursor: "pointer", fontFamily: "inherit", flexShrink: 0, opacity: relancing[keyD] ? 0.6 : 1 }}>
                                      <svg width="11" height="11" viewBox="0 0 11 11" fill="none"><path d="M1 5.5h7M6 3l2.5 2.5L6 8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/><path d="M9.5 2v7" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>
                                      {relancing[keyD] ? "Envoi…" : "Relancer"}
                                    </button>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      {/* ── Factures ── */}
                      <div style={{ padding: "16px 18px" }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
                          <div style={sectionLabel}>Factures ({clientFactures.length})</div>
                          <button onClick={() => openFactureModal(client, client.projects[0] ?? null)}
                            style={{ display: "flex", alignItems: "center", gap: "5px", padding: "5px 10px", borderRadius: "7px", border: "0.5px solid var(--border)", background: "transparent", color: "var(--text2)", fontSize: "11px", fontWeight: 500, cursor: "pointer", fontFamily: "inherit" }}>
                            <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M5 1v8M1 5h8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>
                            Nouvelle facture
                          </button>
                        </div>

                        {loadingFactures[client.email] ? (
                          <div style={{ padding: "16px 0", display: "flex", justifyContent: "center" }}>
                            <div style={{ width: "18px", height: "18px", border: "2px solid var(--border)", borderTopColor: "var(--accent)", borderRadius: "50%", animation: "spin 0.6s linear infinite" }} />
                            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                          </div>
                        ) : clientFactures.length === 0 ? (
                          <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px 14px", background: "var(--surface2)", borderRadius: "8px", border: "0.5px dashed var(--border)" }}>
                            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ color: "var(--text3)", flexShrink: 0 }}><rect x="2" y="1" width="10" height="12" rx="1.5" stroke="currentColor" strokeWidth="1.1"/><path d="M4.5 4.5h5M4.5 7h5M4.5 9.5h3" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round"/></svg>
                            <span style={{ fontSize: "12px", color: "var(--text3)" }}>Aucune facture pour ce client.</span>
                          </div>
                        ) : (
                          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                            {clientFactures.map(fa => {
                              const fc = factureStatusColors[fa.status] ?? factureStatusColors["En attente"];
                              const keyF = `${fa.id}-facture`;
                              const isOverdue = fa.dueAt && fa.status !== "Payée" && new Date(fa.dueAt) < new Date();
                              return (
                                <div key={fa.id} style={{ padding: "10px 12px", background: "var(--surface2)", borderRadius: "8px", border: isOverdue ? "0.5px solid #E24B4A40" : "0.5px solid transparent" }}>
                                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                      <span style={{ fontSize: "13px", fontWeight: 500, color: "var(--text)" }}>{fa.serviceName}</span>
                                      <span style={{ fontSize: "11px", color: "var(--text3)", marginLeft: "8px" }}>émise le {fmtDate(fa.issuedAt)}</span>
                                      {fa.dueAt && <span style={{ fontSize: "11px", color: isOverdue ? "#E24B4A" : "var(--text3)", marginLeft: "6px" }}>· échéance {fmtDate(fa.dueAt)}</span>}
                                    </div>
                                    <span style={{ fontSize: "14px", fontWeight: 700, color: fa.status === "Payée" ? "var(--success)" : "var(--text)", flexShrink: 0 }}>
                                      {fa.amount.toLocaleString("fr-FR")} €
                                    </span>
                                    {/* Status selector */}
                                    <select value={fa.status}
                                      onChange={e => updateFactureStatus(fa.id, client.email, e.target.value as Facture["status"])}
                                      style={{ fontSize: "10px", fontWeight: 500, padding: "3px 6px", borderRadius: "5px", background: fc.bg, color: fc.color, border: `0.5px solid ${fc.color}40`, cursor: "pointer", fontFamily: "inherit", flexShrink: 0, appearance: "none" }}>
                                      {FACTURE_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                    {/* Envoyer PDF */}
                                    <button
                                      onClick={() => sendFacture(fa.id, fa.clientEmail)}
                                      disabled={sendingFacture[fa.id]}
                                      title="Envoyer la facture PDF par email"
                                      style={{ display: "flex", alignItems: "center", gap: "4px", padding: "4px 9px", borderRadius: "6px", border: "0.5px solid rgba(127,119,221,0.4)", background: "var(--accent-bg)", color: "var(--accent-light)", fontSize: "11px", fontWeight: 500, cursor: sendingFacture[fa.id] ? "not-allowed" : "pointer", fontFamily: "inherit", flexShrink: 0, opacity: sendingFacture[fa.id] ? 0.6 : 1 }}>
                                      {sendingFacture[fa.id] ? (
                                        <div style={{ width: "10px", height: "10px", border: "1.5px solid var(--accent-light)", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.6s linear infinite" }} />
                                      ) : (
                                        <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M5 1v6M2.5 4.5L5 7l2.5-2.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/><path d="M1.5 8.5h7" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>
                                      )}
                                      {sendingFacture[fa.id] ? "Envoi…" : "Envoyer"}
                                    </button>
                                    {/* Relancer */}
                                    {fa.status !== "Payée" && (
                                      relanced[keyF] ? (
                                        <span style={{ fontSize: "11px", color: "var(--success)", flexShrink: 0 }}>✓ Envoyée</span>
                                      ) : (
                                        <button onClick={() => relance(fa.clientEmail, fa.clientName, fa.serviceName, fa.amount, "facture", keyF)}
                                          disabled={relancing[keyF]}
                                          style={{ display: "flex", alignItems: "center", gap: "4px", padding: "4px 9px", borderRadius: "6px", border: "0.5px solid rgba(250,199,117,0.4)", background: "#1A1200", color: "#FAC775", fontSize: "11px", fontWeight: 500, cursor: "pointer", fontFamily: "inherit", flexShrink: 0, opacity: relancing[keyF] ? 0.6 : 1 }}>
                                          <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M1 5h6.5M6 2.5L8.5 5 6 7.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                                          {relancing[keyF] ? "…" : "Relancer"}
                                        </button>
                                      )
                                    )}
                                    {/* Delete */}
                                    <button onClick={() => deleteFacture(fa.id, client.email)}
                                      style={{ width: "26px", height: "26px", flexShrink: 0, borderRadius: "6px", border: "0.5px solid var(--border)", background: "transparent", color: "var(--text3)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                                      onMouseEnter={e => (e.currentTarget.style.color = "#E24B4A")}
                                      onMouseLeave={e => (e.currentTarget.style.color = "var(--text3)")}>
                                      <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M1.5 1.5l7 7M8.5 1.5l-7 7" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>
                                    </button>
                                  </div>
                                  {fa.notes && <div style={{ fontSize: "11px", color: "var(--text3)", marginTop: "6px", paddingTop: "6px", borderTop: "0.5px solid var(--border)" }}>{fa.notes}</div>}
                                  {fa.paidAt && <div style={{ fontSize: "11px", color: "var(--success)", marginTop: "4px" }}>Payée le {fmtDate(fa.paidAt)}</div>}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* ── Modal nouvelle facture ── */}
      {showFactureModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: "20px" }}>
          <div style={{ background: "var(--surface)", borderRadius: "16px", border: "0.5px solid var(--border)", width: "100%", maxWidth: "400px", padding: "28px" }}>
            <h2 style={{ fontSize: "16px", fontWeight: 600, color: "var(--text)", marginBottom: "4px" }}>Nouvelle facture</h2>
            <p style={{ fontSize: "12px", color: "var(--text3)", marginBottom: "22px" }}>Pour <strong style={{ color: "var(--text2)" }}>{showFactureModal.client.name}</strong></p>

            <div style={{ display: "flex", flexDirection: "column", gap: "14px", marginBottom: "24px" }}>
              <div>
                <label style={{ fontSize: "11px", color: "var(--text3)", fontWeight: 500, letterSpacing: "0.05em", textTransform: "uppercase", display: "block", marginBottom: "6px" }}>Prestation</label>
                <input value={fServiceName} onChange={e => setFServiceName(e.target.value)} placeholder="Ex : Site web vitrine" style={inputBase} />
              </div>
              <div>
                <label style={{ fontSize: "11px", color: "var(--text3)", fontWeight: 500, letterSpacing: "0.05em", textTransform: "uppercase", display: "block", marginBottom: "6px" }}>Montant (€)</label>
                <input type="number" value={fAmount} onChange={e => setFAmount(e.target.value)} placeholder="Ex : 2500" style={inputBase} />
              </div>
              <div>
                <label style={{ fontSize: "11px", color: "var(--text3)", fontWeight: 500, letterSpacing: "0.05em", textTransform: "uppercase", display: "block", marginBottom: "6px" }}>Date d&apos;échéance</label>
                <input type="date" value={fDueAt} onChange={e => setFDueAt(e.target.value)} style={inputBase} />
              </div>
              <div>
                <label style={{ fontSize: "11px", color: "var(--text3)", fontWeight: 500, letterSpacing: "0.05em", textTransform: "uppercase", display: "block", marginBottom: "6px" }}>Notes (optionnel)</label>
                <textarea value={fNotes} onChange={e => setFNotes(e.target.value)} rows={2} placeholder="Ex : Acompte de 50% versé…" style={{ ...inputBase, resize: "vertical" }} />
              </div>
            </div>

            <div style={{ display: "flex", gap: "10px" }}>
              <button onClick={() => setShowFactureModal(null)} style={{ flex: 1, padding: "10px", borderRadius: "9px", border: "0.5px solid var(--border)", background: "transparent", color: "var(--text2)", fontSize: "13px", fontWeight: 500, cursor: "pointer", fontFamily: "inherit" }}>Annuler</button>
              <button onClick={createFacture} disabled={fSaving || !fServiceName || !fAmount}
                style={{ flex: 1, padding: "10px", borderRadius: "9px", border: "none", background: "var(--accent)", color: "#FFF", fontSize: "13px", fontWeight: 500, cursor: "pointer", fontFamily: "inherit", opacity: (!fServiceName || !fAmount) ? 0.5 : 1 }}>
                {fSaving ? "Création…" : "Créer la facture"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal nouveau client ── */}
      {showModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: "20px" }}>
          <div style={{ background: "var(--surface)", borderRadius: "16px", border: "0.5px solid var(--border)", width: "100%", maxWidth: "420px", padding: "28px" }}>
            {!generatedSlug ? (
              <>
                <h2 style={{ fontSize: "16px", fontWeight: 600, color: "var(--text)", marginBottom: "4px" }}>Nouveau client</h2>
                <p style={{ fontSize: "12px", color: "var(--text3)", marginBottom: "24px" }}>Un lien personnalisé sera généré pour ce client.</p>
                <div style={{ display: "flex", flexDirection: "column", gap: "14px", marginBottom: "24px" }}>
                  <div>
                    <label style={{ fontSize: "11px", color: "var(--text3)", fontWeight: 500, letterSpacing: "0.05em", textTransform: "uppercase", display: "block", marginBottom: "6px" }}>Nom complet</label>
                    <input value={clientName} onChange={e => setClientName(e.target.value)} placeholder="Ex : Sophie Martin" style={inputBase} />
                  </div>
                  <div>
                    <label style={{ fontSize: "11px", color: "var(--text3)", fontWeight: 500, letterSpacing: "0.05em", textTransform: "uppercase", display: "block", marginBottom: "6px" }}>Email</label>
                    <input type="email" value={clientEmail} onChange={e => setClientEmail(e.target.value)} placeholder="Ex : sophie@exemple.com" style={inputBase} />
                  </div>
                  <div>
                    <label style={{ fontSize: "11px", color: "var(--text3)", fontWeight: 500, letterSpacing: "0.05em", textTransform: "uppercase", display: "block", marginBottom: "6px" }}>Service</label>
                    <select value={serviceId} onChange={e => setServiceId(e.target.value)} style={{ ...inputBase, appearance: "none" }}>
                      {services.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </div>
                </div>
                <div style={{ display: "flex", gap: "10px" }}>
                  <button onClick={() => setShowModal(false)} style={{ flex: 1, padding: "10px", borderRadius: "9px", border: "0.5px solid var(--border)", background: "transparent", color: "var(--text2)", fontSize: "13px", fontWeight: 500, cursor: "pointer", fontFamily: "inherit" }}>Annuler</button>
                  <button onClick={createClient} disabled={saving || !clientName.trim() || !clientEmail.trim() || !serviceId}
                    style={{ flex: 1, padding: "10px", borderRadius: "9px", border: "none", background: "var(--accent)", color: "#FFF", fontSize: "13px", fontWeight: 500, cursor: "pointer", fontFamily: "inherit", opacity: (!clientName.trim() || !clientEmail.trim() || !serviceId) ? 0.5 : 1 }}>
                    {saving ? "Création…" : "Créer le client"}
                  </button>
                </div>
              </>
            ) : (
              <>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "44px", height: "44px", borderRadius: "12px", background: "#0A1A12", border: "0.5px solid #5DCAA540", marginBottom: "16px" }}>
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M4 10l4 4L16 6" stroke="#5DCAA5" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </div>
                <h2 style={{ fontSize: "16px", fontWeight: 600, color: "var(--text)", marginBottom: "4px" }}>Client créé !</h2>
                <p style={{ fontSize: "12px", color: "var(--text3)", marginBottom: "20px" }}>Partagez ce lien à <strong style={{ color: "var(--text2)" }}>{clientName}</strong> pour qu'il remplisse son formulaire.</p>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 12px", background: "var(--surface2)", border: "0.5px solid var(--border)", borderRadius: "9px", marginBottom: "20px" }}>
                  <span style={{ fontSize: "12px", color: "var(--text2)", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{briefUrl}</span>
                  <button onClick={() => { navigator.clipboard.writeText(briefUrl); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
                    style={{ display: "flex", alignItems: "center", gap: "5px", padding: "5px 10px", borderRadius: "7px", border: "0.5px solid var(--border)", background: "var(--surface)", color: copied ? "var(--success)" : "var(--text2)", fontSize: "11px", fontWeight: 500, cursor: "pointer", fontFamily: "inherit", flexShrink: 0 }}>
                    {copied ? "Copié !" : "Copier"}
                  </button>
                </div>
                <button onClick={() => setShowModal(false)} style={{ width: "100%", padding: "10px", borderRadius: "9px", border: "0.5px solid var(--border)", background: "transparent", color: "var(--text2)", fontSize: "13px", fontWeight: 500, cursor: "pointer", fontFamily: "inherit" }}>Fermer</button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
