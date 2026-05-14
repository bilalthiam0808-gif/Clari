"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";

type Service = { id: string; name: string; category: string };

type Project = {
  id: string;
  clientName: string;
  clientEmail: string;
  serviceId: string;
  serviceName: string;
  status: string;
  slug: string;
  createdAt: string;
  briefData: Record<string, unknown> | null;
};

type Client = {
  name: string;
  email: string;
  projects: Project[];
};

const statusColors: Record<string, { bg: string; color: string }> = {
  "En attente":   { bg: "#1A1200", color: "#FAC775" },
  "Brief reçu":   { bg: "#0A1A12", color: "#5DCAA5" },
  "Devis envoyé": { bg: "#1A1A2E", color: "#CECBF6" },
};

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
    map.get(key)!.projects.push(p);
  }
  return Array.from(map.values());
}

export default function ClientsPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [mounted, setMounted] = useState(false);
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [generatedSlug, setGeneratedSlug] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form state
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

  function openModal() {
    setClientName("");
    setClientEmail("");
    setServiceId(services[0]?.id ?? "");
    setGeneratedSlug(null);
    setCopied(false);
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    setGeneratedSlug(null);
  }

  async function createClient() {
    if (!clientName.trim() || !clientEmail.trim() || !serviceId) return;
    setSaving(true);
    const service = services.find(s => s.id === serviceId);
    const slug = generateSlug(clientName);
    const id = crypto.randomUUID();
    const body = {
      id,
      clientName: clientName.trim(),
      clientEmail: clientEmail.trim(),
      serviceId,
      serviceName: service?.name ?? "",
      status: "En attente",
      slug,
      createdAt: new Date().toISOString(),
      briefData: null,
    };
    const res = await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setSaving(false);
    if (res.ok) {
      const created = await res.json();
      setProjects(prev => [created, ...prev]);
      setGeneratedSlug(slug);
    }
  }

  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const briefUrl = generatedSlug ? `${origin}/b/${generatedSlug}` : "";

  function copyLink() {
    navigator.clipboard.writeText(briefUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const clients = groupByClient(projects);
  const filtered = search
    ? clients.filter(c =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.email.toLowerCase().includes(search.toLowerCase())
      )
    : clients;

  const inputBase: React.CSSProperties = {
    background: "var(--surface2)", border: "0.5px solid var(--border)", borderRadius: "8px",
    padding: "9px 12px", fontSize: "13px", color: "var(--text)", fontFamily: "inherit",
    outline: "none", width: "100%",
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
          <button onClick={openModal}
            style={{ display: "flex", alignItems: "center", gap: "8px", padding: "9px 18px", borderRadius: "9px", fontSize: "13px", fontWeight: 500, cursor: "pointer", fontFamily: "inherit", background: "var(--accent)", color: "#FFF", border: "none" }}>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M6 1v10M1 6h10" stroke="white" strokeWidth="1.5" strokeLinecap="round"/></svg>
            Nouveau client
          </button>
        </div>

        {/* Search */}
        <div style={{ position: "relative", marginBottom: "20px", maxWidth: "360px" }}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--text3)", pointerEvents: "none" }}>
            <circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.2"/>
            <path d="M9.5 9.5l3 3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
          </svg>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher un client…"
            style={{ ...inputBase, paddingLeft: "34px" }} />
        </div>

        {/* Client list */}
        {!mounted ? null : filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 0", color: "var(--text3)", fontSize: "13px" }}>
            {search ? "Aucun client trouvé pour cette recherche." : "Aucun client pour l'instant."}
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {filtered.map(client => {
              const isOpen = expanded === client.email;
              const latestProject = client.projects[0];
              const statusCol = statusColors[latestProject?.status ?? "En attente"] ?? { bg: "#1A1200", color: "#FAC775" };
              return (
                <div key={client.email} style={{ background: "var(--surface)", border: "0.5px solid var(--border)", borderRadius: "14px", overflow: "hidden" }}>

                  {/* Row header */}
                  <button onClick={() => setExpanded(isOpen ? null : client.email)}
                    style={{ width: "100%", display: "flex", alignItems: "center", gap: "14px", padding: "14px 16px", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", textAlign: "left" }}>
                    {/* Avatar */}
                    <div style={{ width: "34px", height: "34px", borderRadius: "10px", background: "var(--accent-bg)", border: "0.5px solid rgba(127,119,221,0.3)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--accent-light)" }}>
                        {client.name.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase()}
                      </span>
                    </div>
                    {/* Name / email */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: "13px", fontWeight: 500, color: "var(--text)", marginBottom: "2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{client.name}</div>
                      <div style={{ fontSize: "11px", color: "var(--text3)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{client.email}</div>
                    </div>
                    {/* Project count */}
                    <span style={{ fontSize: "11px", color: "var(--text3)", flexShrink: 0 }}>
                      {client.projects.length} projet{client.projects.length > 1 ? "s" : ""}
                    </span>
                    {/* Latest status */}
                    <span style={{ fontSize: "10px", fontWeight: 500, padding: "3px 9px", borderRadius: "5px", background: statusCol.bg, color: statusCol.color, border: `0.5px solid ${statusCol.color}40`, flexShrink: 0 }}>
                      {latestProject?.status ?? "—"}
                    </span>
                    {/* Chevron */}
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ flexShrink: 0, transform: isOpen ? "rotate(180deg)" : "rotate(0)", transition: "transform 150ms", color: "var(--text3)" }}>
                      <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>

                  {/* Expanded projects */}
                  {isOpen && (
                    <div style={{ borderTop: "0.5px solid var(--border)", background: "var(--surface2)" }}>
                      {client.projects.map(p => {
                        const sc = statusColors[p.status] ?? { bg: "#1A1200", color: "#FAC775" };
                        const link = `${origin}/b/${p.slug}`;
                        return (
                          <div key={p.id} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px 16px", borderBottom: "0.5px solid var(--border)" }}>
                            {/* Service name */}
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: "12px", fontWeight: 500, color: "var(--text)", marginBottom: "2px" }}>{p.serviceName}</div>
                              <div style={{ fontSize: "11px", color: "var(--text3)" }}>{new Date(p.createdAt).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" })}</div>
                            </div>
                            {/* Status badge */}
                            <span style={{ fontSize: "10px", fontWeight: 500, padding: "3px 9px", borderRadius: "5px", background: sc.bg, color: sc.color, border: `0.5px solid ${sc.color}40`, flexShrink: 0 }}>
                              {p.status}
                            </span>
                            {/* Brief link */}
                            <button onClick={() => { navigator.clipboard.writeText(link); }}
                              title="Copier le lien du formulaire"
                              style={{ display: "flex", alignItems: "center", gap: "5px", padding: "5px 10px", borderRadius: "7px", border: "0.5px solid var(--border)", background: "transparent", color: "var(--text3)", fontSize: "11px", cursor: "pointer", fontFamily: "inherit", flexShrink: 0 }}>
                              <svg width="11" height="11" viewBox="0 0 11 11" fill="none"><rect x="1" y="3.5" width="6.5" height="6.5" rx="1.5" stroke="currentColor" strokeWidth="1.1"/><path d="M3.5 3.5V2.5a1.5 1.5 0 0 1 1.5-1.5h3a1.5 1.5 0 0 1 1.5 1.5v3a1.5 1.5 0 0 1-1.5 1.5H8" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round"/></svg>
                              Lien
                            </button>
                            {/* View project */}
                            <button onClick={() => router.push(`/projets/${p.id}`)}
                              title="Voir le projet"
                              style={{ display: "flex", alignItems: "center", gap: "5px", padding: "5px 10px", borderRadius: "7px", border: "0.5px solid var(--border)", background: "transparent", color: "var(--text3)", fontSize: "11px", cursor: "pointer", fontFamily: "inherit", flexShrink: 0 }}>
                              <svg width="11" height="11" viewBox="0 0 11 11" fill="none"><path d="M1 5.5s1.8-3.5 4.5-3.5S10 5.5 10 5.5s-1.8 3.5-4.5 3.5S1 5.5 1 5.5Z" stroke="currentColor" strokeWidth="1.1"/><circle cx="5.5" cy="5.5" r="1.5" stroke="currentColor" strokeWidth="1.1"/></svg>
                              Projet
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Modal — Nouveau client */}
      {showModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: "20px" }}>
          <div style={{ background: "var(--surface)", borderRadius: "16px", border: "0.5px solid var(--border)", width: "100%", maxWidth: "420px", padding: "28px" }}>

            {!generatedSlug ? (
              <>
                <h2 style={{ fontSize: "16px", fontWeight: 600, color: "var(--text)", marginBottom: "4px" }}>Nouveau client</h2>
                <p style={{ fontSize: "12px", color: "var(--text3)", marginBottom: "24px" }}>
                  Un lien personnalisé sera généré pour ce client.
                </p>

                <div style={{ display: "flex", flexDirection: "column", gap: "14px", marginBottom: "24px" }}>
                  <div>
                    <label style={{ fontSize: "11px", color: "var(--text3)", fontWeight: 500, letterSpacing: "0.05em", textTransform: "uppercase", display: "block", marginBottom: "6px" }}>Nom complet</label>
                    <input value={clientName} onChange={e => setClientName(e.target.value)}
                      placeholder="Ex : Sophie Martin"
                      style={inputBase} />
                  </div>
                  <div>
                    <label style={{ fontSize: "11px", color: "var(--text3)", fontWeight: 500, letterSpacing: "0.05em", textTransform: "uppercase", display: "block", marginBottom: "6px" }}>Email</label>
                    <input type="email" value={clientEmail} onChange={e => setClientEmail(e.target.value)}
                      placeholder="Ex : sophie@exemple.com"
                      style={inputBase} />
                  </div>
                  <div>
                    <label style={{ fontSize: "11px", color: "var(--text3)", fontWeight: 500, letterSpacing: "0.05em", textTransform: "uppercase", display: "block", marginBottom: "6px" }}>Service</label>
                    <select value={serviceId} onChange={e => setServiceId(e.target.value)} style={{ ...inputBase, appearance: "none" }}>
                      {services.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </div>
                </div>

                <div style={{ display: "flex", gap: "10px" }}>
                  <button onClick={closeModal} style={{ flex: 1, padding: "10px", borderRadius: "9px", border: "0.5px solid var(--border)", background: "transparent", color: "var(--text2)", fontSize: "13px", fontWeight: 500, cursor: "pointer", fontFamily: "inherit" }}>
                    Annuler
                  </button>
                  <button onClick={createClient} disabled={saving || !clientName.trim() || !clientEmail.trim() || !serviceId}
                    style={{ flex: 1, padding: "10px", borderRadius: "9px", border: "none", background: "var(--accent)", color: "#FFF", fontSize: "13px", fontWeight: 500, cursor: saving ? "not-allowed" : "pointer", fontFamily: "inherit", opacity: (!clientName.trim() || !clientEmail.trim() || !serviceId) ? 0.5 : 1 }}>
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
                <p style={{ fontSize: "12px", color: "var(--text3)", marginBottom: "20px" }}>
                  Partagez ce lien à <strong style={{ color: "var(--text2)" }}>{clientName}</strong> pour qu'il remplisse son formulaire.
                </p>

                <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 12px", background: "var(--surface2)", border: "0.5px solid var(--border)", borderRadius: "9px", marginBottom: "20px" }}>
                  <span style={{ fontSize: "12px", color: "var(--text2)", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{briefUrl}</span>
                  <button onClick={copyLink}
                    style={{ display: "flex", alignItems: "center", gap: "5px", padding: "5px 10px", borderRadius: "7px", border: "0.5px solid var(--border)", background: "var(--surface)", color: copied ? "var(--success)" : "var(--text2)", fontSize: "11px", fontWeight: 500, cursor: "pointer", fontFamily: "inherit", flexShrink: 0, transition: "color 150ms" }}>
                    {copied ? (
                      <svg width="11" height="11" viewBox="0 0 11 11" fill="none"><path d="M1.5 5.5l2.5 2.5L9.5 2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    ) : (
                      <svg width="11" height="11" viewBox="0 0 11 11" fill="none"><rect x="1" y="3.5" width="6.5" height="6.5" rx="1.5" stroke="currentColor" strokeWidth="1.1"/><path d="M3.5 3.5V2.5a1.5 1.5 0 0 1 1.5-1.5h3a1.5 1.5 0 0 1 1.5 1.5v3a1.5 1.5 0 0 1-1.5 1.5H8" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round"/></svg>
                    )}
                    {copied ? "Copié !" : "Copier"}
                  </button>
                </div>

                <button onClick={closeModal}
                  style={{ width: "100%", padding: "10px", borderRadius: "9px", border: "0.5px solid var(--border)", background: "transparent", color: "var(--text2)", fontSize: "13px", fontWeight: 500, cursor: "pointer", fontFamily: "inherit" }}>
                  Fermer
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
