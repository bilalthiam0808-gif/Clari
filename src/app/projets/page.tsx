"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";

type Service = {
  id: string;
  name: string;
  category: string;
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
};

const statusColors: Record<string, { bg: string; color: string }> = {
  "En attente":   { bg: "#1A1200", color: "#FAC775" },
  "Brief reçu":   { bg: "#0A1A12", color: "#5DCAA5" },
  "Devis envoyé": { bg: "#1A1A2E", color: "#CECBF6" },
};

function generateSlug(clientName: string): string {
  const base = clientName
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 20);
  const uid = Math.random().toString(36).slice(2, 8);
  return `${base}-${uid}`;
}

export default function ProjetsPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copiedGeneric, setCopiedGeneric] = useState(false);
  const [newProjectSlug, setNewProjectSlug] = useState<string | null>(null);

  // Formulaire
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [serviceId, setServiceId] = useState("");

  // Chargement depuis localStorage
  useEffect(() => {
    const savedProjects = localStorage.getItem("clari_projects");
    if (savedProjects) setProjects(JSON.parse(savedProjects));

    const savedServices = localStorage.getItem("clari_services");
    if (savedServices) setServices(JSON.parse(savedServices));
  }, []);


  function openModal() {
    setClientName("");
    setClientEmail("");
    setServiceId(services[0]?.id || "");
    setNewProjectSlug(null);
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    setNewProjectSlug(null);
  }

  function createProject() {
    if (!clientName || !clientEmail || !serviceId) return;
    const service = services.find((s) => s.id === serviceId);
    const slug = generateSlug(clientName);
    const newProject: Project = {
      id: Date.now().toString(),
      clientName,
      clientEmail,
      serviceId,
      serviceName: service?.name || "",
      status: "En attente",
      slug,
      createdAt: new Date().toLocaleDateString("fr-FR"),
    };
    const updated = [newProject, ...projects];
    setProjects(updated);
    localStorage.setItem("clari_projects", JSON.stringify(updated));
    setNewProjectSlug(slug);
  }

  function copyLink(slug: string, id: string) {
    const link = `${window.location.origin}/b/${slug}`;
    navigator.clipboard.writeText(link);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  function deleteProject(id: string) {
    const updated = projects.filter((p) => p.id !== id);
    setProjects(updated);
    localStorage.setItem("clari_projects", JSON.stringify(updated));
  }

  const inputStyle = {
    background: "#111111",
    border: "0.5px solid var(--border)",
    borderRadius: "8px",
    padding: "10px 14px",
    fontSize: "13px",
    color: "var(--text)",
    width: "100%",
    outline: "none",
    fontFamily: "inherit",
  };

  const labelStyle = {
    fontSize: "11px",
    color: "var(--text2)",
    textTransform: "uppercase" as const,
    letterSpacing: "0.06em",
    marginBottom: "6px",
    display: "block",
    fontWeight: 500,
  };

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden", background: "var(--bg)" }}>
      <Sidebar />

      <main style={{ flex: 1, overflow: "auto", padding: "28px 32px" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "28px" }}>
          <div>
            <h1 style={{ fontSize: "20px", fontWeight: 600, color: "var(--text)", marginBottom: "2px" }}>Projets</h1>
            <p style={{ fontSize: "13px", color: "var(--text2)" }}>
              Crée un projet par client et envoie-lui le lien unique de son formulaire.
            </p>
          </div>
          <button
            onClick={openModal}
            style={{
              background: "var(--accent)",
              color: "#fff",
              border: "none",
              borderRadius: "10px",
              padding: "9px 18px",
              fontSize: "13px",
              fontWeight: 500,
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            + Nouveau projet
          </button>
        </div>

        {/* Lien générique */}
        <div style={{ background: "var(--accent-bg)", border: "0.5px solid rgba(127,119,221,0.3)", borderRadius: "12px", padding: "16px 20px", marginBottom: "20px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "16px" }}>
          <div>
            <div style={{ fontSize: "13px", fontWeight: 500, color: "var(--accent-light)", marginBottom: "3px" }}>
              🔗 Lien générique
            </div>
            <div style={{ fontSize: "12px", color: "var(--text3)" }}>
              Envoie ce lien à n&apos;importe quel client — il choisira lui-même sa catégorie et sa prestation.
            </div>
          </div>
          <button
            onClick={() => {
              if (typeof window !== "undefined") {
                navigator.clipboard.writeText(`${window.location.origin}/brief`);
                setCopiedGeneric(true);
                setTimeout(() => setCopiedGeneric(false), 2000);
              }
            }}
            style={{
              background: copiedGeneric ? "rgba(29,158,117,0.15)" : "rgba(127,119,221,0.15)",
              color: copiedGeneric ? "var(--success)" : "var(--accent-light)",
              border: `0.5px solid ${copiedGeneric ? "rgba(29,158,117,0.4)" : "rgba(127,119,221,0.4)"}`,
              borderRadius: "8px", padding: "8px 14px", fontSize: "12px", fontWeight: 500,
              cursor: "pointer", fontFamily: "inherit", flexShrink: 0,
              display: "flex", alignItems: "center", gap: "6px", transition: "all 150ms",
            }}
          >
            {copiedGeneric ? (
              <>
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M2 6l3.5 3.5L10 2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Copié !
              </>
            ) : (
              <>
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <rect x="1" y="4" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.1"/>
                  <path d="M3.5 4V2.5A1.5 1.5 0 015 1H9.5A1.5 1.5 0 0111 2.5V7A1.5 1.5 0 019.5 8.5H8" stroke="currentColor" strokeWidth="1.1"/>
                </svg>
                Copier /brief
              </>
            )}
          </button>
        </div>

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "10px", marginBottom: "24px" }}>
          {[
            { label: "Total projets", value: projects.length },
            { label: "En attente", value: projects.filter((p) => p.status === "En attente").length },
            { label: "Briefs reçus", value: projects.filter((p) => p.status === "Brief reçu").length },
          ].map((stat) => (
            <div key={stat.label} style={{
              background: "var(--surface)",
              border: "0.5px solid var(--border)",
              borderRadius: "10px",
              padding: "14px 16px",
            }}>
              <div style={{ fontSize: "22px", fontWeight: 600, color: "var(--text)", lineHeight: 1.2 }}>{stat.value}</div>
              <div style={{ fontSize: "11px", color: "var(--text2)", marginTop: "4px", textTransform: "uppercase", letterSpacing: "0.06em" }}>{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Liste des projets */}
        {projects.length === 0 ? (
          <div style={{
            background: "var(--surface)",
            border: "0.5px solid var(--border)",
            borderRadius: "12px",
            padding: "60px 20px",
            textAlign: "center",
          }}>
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none" style={{ margin: "0 auto 12px", opacity: 0.2, display: "block" }}>
              <path d="M6 8h20M6 14h20M6 20h12" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
              <circle cx="24" cy="22" r="5" stroke="white" strokeWidth="1.5"/>
              <path d="M24 20v2l1 1" stroke="white" strokeWidth="1.2" strokeLinecap="round"/>
            </svg>
            <p style={{ fontSize: "13px", color: "var(--text2)", marginBottom: "16px" }}>
              Aucun projet pour l&apos;instant. Crée ton premier projet pour générer un lien client.
            </p>
            {services.length === 0 && (
              <p style={{ fontSize: "12px", color: "var(--error)", marginBottom: "12px" }}>
                ⚠ Tu dois d&apos;abord créer au moins un service dans &quot;Mes services&quot;.
              </p>
            )}
            <button
              onClick={openModal}
              disabled={services.length === 0}
              style={{
                background: "transparent",
                color: services.length > 0 ? "var(--accent)" : "var(--text3)",
                border: `0.5px solid ${services.length > 0 ? "var(--accent)" : "var(--border)"}`,
                borderRadius: "10px",
                padding: "8px 16px",
                fontSize: "13px",
                fontWeight: 500,
                cursor: services.length > 0 ? "pointer" : "not-allowed",
                fontFamily: "inherit",
              }}
            >
              Créer mon premier projet →
            </button>
          </div>
        ) : (
          <div style={{
            background: "var(--surface)",
            border: "0.5px solid var(--border)",
            borderRadius: "12px",
            overflow: "hidden",
          }}>
            {/* En-tête tableau */}
            <div style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr 120px 100px 160px 40px",
              padding: "10px 20px",
              borderBottom: "0.5px solid var(--border)",
              fontSize: "11px",
              color: "var(--text3)",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
            }}>
              <span>Client</span>
              <span>Service</span>
              <span>Statut</span>
              <span>Date</span>
              <span>Lien unique</span>
              <span></span>
            </div>

            {/* Lignes */}
            {projects.map((project, i) => {
              const status = statusColors[project.status];
              const isLast = i === projects.length - 1;
              return (
                <div
                  key={project.id}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr 120px 100px 160px 40px",
                    padding: "14px 20px",
                    borderBottom: isLast ? "none" : "0.5px solid var(--border)",
                    alignItems: "center",
                    cursor: "pointer",
                    transition: "background 100ms",
                  }}
                  onClick={() => router.push(`/projets/${project.id}`)}
                  onMouseEnter={e => (e.currentTarget.style.background = "var(--surface2)")}
                  onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                >
                  {/* Client */}
                  <div>
                    <div style={{ fontSize: "13px", fontWeight: 500, color: "var(--text)", marginBottom: "2px" }}>{project.clientName}</div>
                    <div style={{ fontSize: "11px", color: "var(--text3)" }}>{project.clientEmail}</div>
                  </div>

                  {/* Service */}
                  <div style={{ fontSize: "12px", color: "var(--text2)" }}>{project.serviceName}</div>

                  {/* Statut */}
                  <div>
                    <span style={{
                      fontSize: "11px", fontWeight: 500,
                      padding: "3px 9px", borderRadius: "6px",
                      background: status.bg, color: status.color,
                    }}>
                      {project.status}
                    </span>
                  </div>

                  {/* Date */}
                  <div style={{ fontSize: "12px", color: "var(--text3)" }}>{project.createdAt}</div>

                  {/* Lien */}
                  <button
                    onClick={(e) => { e.stopPropagation(); copyLink(project.slug, project.id); }}
                    style={{
                      background: copiedId === project.id ? "var(--success-bg)" : "var(--accent-bg)",
                      color: copiedId === project.id ? "var(--success)" : "var(--accent-light)",
                      border: `0.5px solid ${copiedId === project.id ? "rgba(29,158,117,0.4)" : "rgba(127,119,221,0.3)"}`,
                      borderRadius: "6px",
                      padding: "5px 10px",
                      fontSize: "11px",
                      fontWeight: 500,
                      cursor: "pointer",
                      fontFamily: "inherit",
                      display: "flex",
                      alignItems: "center",
                      gap: "5px",
                      transition: "all 150ms",
                    }}
                  >
                    {copiedId === project.id ? (
                      <>
                        <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                          <path d="M2 5.5L4.5 8L9 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        Copié !
                      </>
                    ) : (
                      <>
                        <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                          <rect x="1" y="3" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.1"/>
                          <path d="M3 3V2a1 1 0 011-1h5a1 1 0 011 1v5a1 1 0 01-1 1H8" stroke="currentColor" strokeWidth="1.1"/>
                        </svg>
                        Copier le lien
                      </>
                    )}
                  </button>

                  {/* Supprimer */}
                  <button
                    onClick={(e) => { e.stopPropagation(); deleteProject(project.id); }}
                    style={{ background: "none", border: "none", color: "var(--text3)", cursor: "pointer", fontSize: "16px", padding: "4px", textAlign: "center" }}
                  >
                    ×
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* MODAL */}
      {showModal && (
        <div
          onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}
          style={{
            position: "fixed", inset: 0,
            background: "rgba(0,0,0,0.7)",
            display: "flex", alignItems: "center", justifyContent: "center",
            zIndex: 50, padding: "20px",
          }}
        >
          <div style={{
            background: "var(--surface)",
            border: "0.5px solid var(--border-hover)",
            borderRadius: "16px",
            padding: "28px",
            width: "100%",
            maxWidth: "480px",
          }}>
            {/* En-tête */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px" }}>
              <h2 style={{ fontSize: "16px", fontWeight: 600, color: "var(--text)" }}>
                {newProjectSlug ? "Projet créé !" : "Nouveau projet"}
              </h2>
              <button onClick={closeModal} style={{ background: "none", border: "none", color: "var(--text2)", cursor: "pointer", fontSize: "20px", lineHeight: 1 }}>×</button>
            </div>

            {/* Étape 1 — Formulaire */}
            {!newProjectSlug ? (
              <>
                {services.length === 0 ? (
                  <div style={{
                    background: "var(--error-bg)",
                    border: "0.5px solid rgba(226,75,74,0.3)",
                    borderRadius: "8px",
                    padding: "12px 14px",
                    fontSize: "13px",
                    color: "var(--error)",
                    marginBottom: "20px",
                  }}>
                    Tu n&apos;as pas encore créé de service. Va dans &quot;Mes services&quot; pour en ajouter un d&apos;abord.
                  </div>
                ) : (
                  <>
                    <div style={{ marginBottom: "16px" }}>
                      <label style={labelStyle}>Nom du client</label>
                      <input
                        value={clientName}
                        onChange={(e) => setClientName(e.target.value)}
                        placeholder="Ex : Sophie Martin"
                        style={inputStyle}
                        autoFocus
                      />
                    </div>

                    <div style={{ marginBottom: "16px" }}>
                      <label style={labelStyle}>Email du client</label>
                      <input
                        value={clientEmail}
                        onChange={(e) => setClientEmail(e.target.value)}
                        placeholder="Ex : sophie@exemple.com"
                        type="email"
                        style={inputStyle}
                      />
                    </div>

                    <div style={{ marginBottom: "24px" }}>
                      <label style={labelStyle}>Service associé</label>
                      <select
                        value={serviceId}
                        onChange={(e) => setServiceId(e.target.value)}
                        style={{ ...inputStyle, cursor: "pointer" }}
                      >
                        {services.map((s) => (
                          <option key={s.id} value={s.id} style={{ background: "#1A1A1A" }}>
                            {s.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
                      <button
                        onClick={closeModal}
                        style={{
                          background: "transparent", color: "var(--text2)",
                          border: "0.5px solid var(--border)", borderRadius: "10px",
                          padding: "9px 18px", fontSize: "13px", cursor: "pointer", fontFamily: "inherit",
                        }}
                      >
                        Annuler
                      </button>
                      <button
                        onClick={createProject}
                        disabled={!clientName || !clientEmail || !serviceId}
                        style={{
                          background: clientName && clientEmail && serviceId ? "var(--accent)" : "var(--surface2)",
                          color: clientName && clientEmail && serviceId ? "#fff" : "var(--text3)",
                          border: "none", borderRadius: "10px",
                          padding: "9px 20px", fontSize: "13px", fontWeight: 500,
                          cursor: clientName && clientEmail && serviceId ? "pointer" : "not-allowed",
                          fontFamily: "inherit",
                        }}
                      >
                        Générer le lien →
                      </button>
                    </div>
                  </>
                )}
              </>
            ) : (
              /* Étape 2 — Lien généré */
              <>
                <div style={{
                  background: "var(--success-bg)",
                  border: "0.5px solid rgba(29,158,117,0.3)",
                  borderRadius: "10px",
                  padding: "16px",
                  marginBottom: "20px",
                  textAlign: "center",
                }}>
                  <div style={{ fontSize: "12px", color: "var(--success)", marginBottom: "8px", fontWeight: 500 }}>
                    Lien unique généré
                  </div>
                  <div style={{
                    fontSize: "12px",
                    color: "var(--text2)",
                    wordBreak: "break-all",
                    fontFamily: "monospace",
                    background: "var(--surface2)",
                    borderRadius: "6px",
                    padding: "8px 12px",
                  }}>
                    {typeof window !== "undefined" ? `${window.location.origin}/b/${newProjectSlug}` : `/b/${newProjectSlug}`}
                  </div>
                </div>

                <p style={{ fontSize: "12px", color: "var(--text2)", marginBottom: "20px", lineHeight: 1.6 }}>
                  Envoie ce lien à ton client par email ou message. Il accèdera à son formulaire personnalisé sans avoir besoin de créer un compte.
                </p>

                <div style={{ display: "flex", gap: "10px" }}>
                  <button
                    onClick={() => {
                      if (typeof window !== "undefined") {
                        navigator.clipboard.writeText(`${window.location.origin}/b/${newProjectSlug}`);
                      }
                    }}
                    style={{
                      flex: 1,
                      background: "var(--accent)",
                      color: "#fff",
                      border: "none",
                      borderRadius: "10px",
                      padding: "10px",
                      fontSize: "13px",
                      fontWeight: 500,
                      cursor: "pointer",
                      fontFamily: "inherit",
                      display: "flex", alignItems: "center", justifyContent: "center", gap: "6px",
                    }}
                  >
                    <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                      <rect x="1" y="4" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.2"/>
                      <path d="M4 4V2.5A1.5 1.5 0 015.5 1H10a1.5 1.5 0 011.5 1.5V7A1.5 1.5 0 0110 8.5H8.5" stroke="currentColor" strokeWidth="1.2"/>
                    </svg>
                    Copier le lien
                  </button>
                  <button
                    onClick={closeModal}
                    style={{
                      background: "transparent", color: "var(--text2)",
                      border: "0.5px solid var(--border)", borderRadius: "10px",
                      padding: "10px 16px", fontSize: "13px", cursor: "pointer", fontFamily: "inherit",
                    }}
                  >
                    Fermer
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
