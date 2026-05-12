"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";

// ─── Types ────────────────────────────────────────────────────────────────────

type Category = "Graphisme" | "Motion Design" | "Site web";

type ServiceOption = {
  id: string;
  label: string;
  price: string;
  isPercent?: boolean;
};

type Project = {
  id: string;
  clientName: string;
  clientEmail: string;
  serviceId: string;
  serviceName: string;
  slug: string;
};

type Service = {
  id: string;
  name: string;
  category: Category;
  basePrice: string;
  description: string;
  options: ServiceOption[];
};

// ─── Style questions génériques par catégorie ─────────────────────────────────

const STYLE_QUESTIONS: Record<Category, { question: string; type: "single" | "multi"; choices: string[] }[]> = {
  "Graphisme": [
    { question: "Quel type de logo souhaitez-vous ?", type: "single", choices: ["Wordmark", "Lettermark", "Combiné", "Emblème"] },
    { question: "Quel univers visuel vous correspond ?", type: "multi", choices: ["Minimaliste", "Premium", "Vintage", "Ludique", "Organique", "Tech"] },
    { question: "Quelle direction typographique ?", type: "single", choices: ["Serif élégant", "Sans-serif moderne", "Manuscrit", "Géométrique"] },
    { question: "Quelle palette de couleurs vous attire ?", type: "multi", choices: ["Tons naturels", "Monochromatique", "Vifs et contrastés", "Pastels", "Sombres et profonds"] },
  ],
  "Motion Design": [
    { question: "Quel style d'animation ?", type: "single", choices: ["Dynamique et rapide", "Doux et fluide", "Cinématique", "Minimaliste", "Typographique"] },
    { question: "Quelle ambiance sonore ?", type: "single", choices: ["Avec musique", "Sans musique", "Je fournis la musique"] },
    { question: "Quelle durée approximative ?", type: "single", choices: ["Moins de 10s", "10 à 30s", "30s à 1 min", "Plus d'1 min"] },
    { question: "Quel univers visuel vous correspond ?", type: "multi", choices: ["Minimaliste", "Premium", "Coloré et dynamique", "Sombre et moderne", "Organique"] },
  ],
  "Site web": [
    { question: "Combien de pages estimez-vous avoir besoin ?", type: "single", choices: ["1 à 3 pages", "4 à 7 pages", "8 pages et plus"] },
    { question: "Quel univers visuel vous correspond ?", type: "single", choices: ["Minimaliste", "Premium", "Coloré et dynamique", "Sombre et moderne", "Organique"] },
    { question: "Quelle plateforme préférez-vous ?", type: "single", choices: ["WordPress", "Shopify", "Sur-mesure", "Pas de préférence"] },
    { question: "Avez-vous besoin d'une boutique en ligne ?", type: "single", choices: ["Oui, c'est essentiel", "Peut-être plus tard", "Non"] },
  ],
};

const SECTORS = ["Mode", "Beauté", "Food & Restauration", "Tech", "Santé & Bien-être", "Sport", "Immobilier", "Éducation", "Autre"];
const SOURCES = ["Instagram", "Bouche à oreille", "Google", "Recommandation d'un ami", "LinkedIn", "Autre"];

// ─── Helpers visuels ──────────────────────────────────────────────────────────

const categoryColors: Record<Category, { bg: string; color: string }> = {
  "Graphisme":     { bg: "#1A1A2E", color: "#CECBF6" },
  "Motion Design": { bg: "#1A0D2E", color: "#C4B8F0" },
  "Site web":      { bg: "#0A1A12", color: "#9FE1CB" },
};

const categoryIcons: Record<Category, JSX.Element> = {
  "Graphisme": (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <circle cx="9" cy="9" r="7" stroke="currentColor" strokeWidth="1.2"/>
      <path d="M6 9h6M9 6v6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
    </svg>
  ),
  "Motion Design": (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M6 5l8 4-8 4V5Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
    </svg>
  ),
  "Site web": (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <rect x="2" y="3" width="14" height="12" rx="2" stroke="currentColor" strokeWidth="1.2"/>
      <path d="M2 7h14" stroke="currentColor" strokeWidth="1.2"/>
      <circle cx="5" cy="5" r="0.8" fill="currentColor"/>
      <circle cx="8" cy="5" r="0.8" fill="currentColor"/>
    </svg>
  ),
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function ClientForm() {
  const params = useParams();
  const slug = params.slug as string;

  const [project, setProject] = useState<Project | null>(null);
  const [allServices, setAllServices] = useState<Service[]>([]);
  const [notFound, setNotFound] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [step, setStep] = useState(1);

  // Étape 1 — Service sélectionné
  const [selectedService, setSelectedService] = useState<Service | null>(null);

  // Étape 2 — Contexte marque
  const [brandName, setBrandName] = useState("");
  const [sector, setSector] = useState("");
  const [brandDesc, setBrandDesc] = useState("");
  const [target, setTarget] = useState("");
  const [hasIdentity, setHasIdentity] = useState<"Oui" | "Non" | "">("");

  // Étape 3 — Style visuel
  const [styleAnswers, setStyleAnswers] = useState<Record<number, string[]>>({});

  // Étape 4 — Options
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);

  // Étape 5 — Coordonnées
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [clientCity, setClientCity] = useState("");
  const [clientNote, setClientNote] = useState("");
  const [clientSource, setClientSource] = useState("");

  // ─── Chargement ───────────────────────────────────────────────────────────

  useEffect(() => {
    const savedProjects = localStorage.getItem("clari_projects");
    const savedServices = localStorage.getItem("clari_services");

    if (!savedProjects) { setNotFound(true); return; }

    const projects: Project[] = JSON.parse(savedProjects);
    const foundProject = projects.find((p) => p.slug === slug);
    if (!foundProject) { setNotFound(true); return; }

    setProject(foundProject);
    setClientName(foundProject.clientName);
    setClientEmail(foundProject.clientEmail);

    if (savedServices) {
      const services: Service[] = JSON.parse(savedServices);
      setAllServices(services);

      // Pré-sélectionner le service lié au projet
      const linked = services.find((s) => s.id === foundProject.serviceId);
      if (linked) setSelectedService(linked);
    }
  }, [slug]);

  // ─── Calcul du total ───────────────────────────────────────────────────────

  function getTotal(): number {
    if (!selectedService) return 0;
    const base = parseFloat(selectedService.basePrice) || 0;
    const fixedExtras = selectedService.options
      .filter((o) => !o.isPercent && selectedOptions.includes(o.id))
      .reduce((sum, o) => sum + (parseFloat(o.price) || 0), 0);
    const subtotal = base + fixedExtras;
    const percentExtra = selectedService.options
      .filter((o) => o.isPercent && selectedOptions.includes(o.id))
      .reduce((max, o) => Math.max(max, parseFloat(o.price) || 0), 0);
    return Math.round(subtotal * (1 + percentExtra / 100));
  }

  function toggleOption(optId: string) {
    const opt = selectedService?.options.find(o => o.id === optId);
    setSelectedOptions(prev => {
      if (prev.includes(optId)) return prev.filter(o => o !== optId);
      if (opt?.isPercent) {
        // Délais exclusifs entre eux — on déselectionne les autres % d'abord
        const withoutPercents = prev.filter(o =>
          !selectedService?.options.find(s => s.id === o)?.isPercent
        );
        return [...withoutPercents, optId];
      }
      return [...prev, optId];
    });
  }

  // ─── Style visuel helpers ──────────────────────────────────────────────────

  function toggleStyle(qIndex: number, choice: string, type: "single" | "multi") {
    setStyleAnswers((prev) => {
      const current = prev[qIndex] || [];
      if (type === "single") return { ...prev, [qIndex]: [choice] };
      return {
        ...prev,
        [qIndex]: current.includes(choice)
          ? current.filter((c) => c !== choice)
          : [...current, choice],
      };
    });
  }

  function isStyleSelected(qIndex: number, choice: string) {
    return (styleAnswers[qIndex] || []).includes(choice);
  }

  // ─── Submit ────────────────────────────────────────────────────────────────

  function handleSubmit() {
    const savedProjects = localStorage.getItem("clari_projects");
    if (savedProjects && project) {
      const projects = JSON.parse(savedProjects);
      const updated = projects.map((p: Project & { status: string }) =>
        p.id === project.id
          ? {
              ...p,
              status: "Brief reçu",
              briefData: {
                selectedService: selectedService?.name,
                serviceCategory: selectedService?.category,
                totalEstime: getTotal(),
                brandName, sector, brandDesc, target, hasIdentity,
                styleAnswers,
                selectedOptions,
                clientPhone, clientCity, clientNote, clientSource,
              },
            }
          : p
      );
      localStorage.setItem("clari_projects", JSON.stringify(updated));
    }
    setSubmitted(true);
  }

  // ─── Styles communs ────────────────────────────────────────────────────────

  const inputStyle: React.CSSProperties = {
    background: "#1A1A1A",
    border: "0.5px solid #2A2A2A",
    borderRadius: "8px",
    padding: "10px 14px",
    fontSize: "14px",
    color: "#FFFFFF",
    width: "100%",
    outline: "none",
    fontFamily: "inherit",
  };

  const labelStyle: React.CSSProperties = {
    fontSize: "11px",
    color: "#888888",
    textTransform: "uppercase",
    letterSpacing: "0.06em",
    marginBottom: "6px",
    display: "block",
    fontWeight: 500,
  };

  const btnPrimary: React.CSSProperties = {
    flex: 1,
    background: "#7F77DD",
    color: "#FFFFFF",
    border: "none",
    borderRadius: "10px",
    padding: "13px",
    fontSize: "14px",
    fontWeight: 500,
    cursor: "pointer",
    fontFamily: "inherit",
  };

  const btnSecondary: React.CSSProperties = {
    background: "transparent",
    color: "#888888",
    border: "0.5px solid #2A2A2A",
    borderRadius: "10px",
    padding: "13px 20px",
    fontSize: "13px",
    cursor: "pointer",
    fontFamily: "inherit",
  };

  // ─── États de chargement ───────────────────────────────────────────────────

  if (notFound) return (
    <div style={{ minHeight: "100vh", background: "#0F0F0F", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
      <div style={{ textAlign: "center" }}>
        <h1 style={{ fontSize: "18px", fontWeight: 600, color: "#FFFFFF", marginBottom: "8px" }}>Lien introuvable</h1>
        <p style={{ fontSize: "13px", color: "#888888" }}>Ce lien n&apos;existe pas ou a été désactivé.</p>
      </div>
    </div>
  );

  if (!project) return (
    <div style={{ minHeight: "100vh", background: "#0F0F0F", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ width: "24px", height: "24px", border: "2px solid #2A2A2A", borderTopColor: "#7F77DD", borderRadius: "50%", animation: "spin 0.6s linear infinite" }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  // ─── Page de confirmation ──────────────────────────────────────────────────

  if (submitted) return (
    <div style={{ minHeight: "100vh", background: "#0F0F0F", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
      <div style={{ maxWidth: "480px", width: "100%", textAlign: "center" }}>
        <div style={{ width: "56px", height: "56px", background: "#0A1A12", border: "0.5px solid rgba(29,158,117,0.4)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M5 12l5 5L19 7" stroke="#1D9E75" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <h1 style={{ fontSize: "22px", fontWeight: 600, color: "#FFFFFF", marginBottom: "10px" }}>Brief envoyé !</h1>
        <p style={{ fontSize: "14px", color: "#888888", lineHeight: 1.7, marginBottom: "28px" }}>
          Merci <strong style={{ color: "#FFF" }}>{clientName}</strong>. Ton brief a bien été transmis. Tu vas recevoir ton devis à l&apos;adresse <strong style={{ color: "#FFF" }}>{clientEmail}</strong>.
        </p>
        <div style={{ background: "#1A1A1A", border: "0.5px solid #2A2A2A", borderRadius: "12px", padding: "16px 20px", marginBottom: "20px" }}>
          <div style={{ fontSize: "11px", color: "#555555", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "4px" }}>Total estimé</div>
          {selectedService && (
            <div style={{ fontSize: "12px", color: "#666", marginBottom: "6px" }}>{selectedService.name}</div>
          )}
          <div style={{ fontSize: "28px", fontWeight: 600, color: "#7F77DD" }}>{getTotal()} €</div>
        </div>
        <p style={{ fontSize: "12px", color: "#444" }}>Propulsé par <span style={{ color: "#7F77DD", fontWeight: 500 }}>Clari</span></p>
      </div>
    </div>
  );

  // ─── Variables dérivées ────────────────────────────────────────────────────

  const STEP_LABELS = ["Prestation", "Contexte", "Style", "Options", "Contact"];
  const category = selectedService?.category;
  const catColor = category ? categoryColors[category] : { bg: "#1A1A2E", color: "#CECBF6" };
  const styleQuestions = category ? (STYLE_QUESTIONS[category] || []) : [];
  const serviceOptions = selectedService?.options || [];

  // ─── Rendu ─────────────────────────────────────────────────────────────────

  return (
    <div style={{ minHeight: "100vh", background: "#0F0F0F", fontFamily: "inherit" }}>

      {/* Header sticky */}
      <div style={{ borderBottom: "0.5px solid #2A2A2A", padding: "14px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, background: "rgba(15,15,15,0.96)", backdropFilter: "blur(8px)", zIndex: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{ width: "26px", height: "26px", background: "#7F77DD", borderRadius: "7px", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M2 7h10M7 3l4 4-4 4" stroke="white" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <span style={{ fontSize: "14px", fontWeight: 600, color: "#FFFFFF" }}>Clari</span>
        </div>

        {/* Stepper */}
        <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
          {STEP_LABELS.map((label, i) => {
            const num = i + 1;
            const isDone = num < step;
            const isActive = num === step;
            return (
              <div key={label} style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "3px" }}>
                  <div style={{
                    width: "20px", height: "20px", borderRadius: "50%",
                    background: isDone ? "#1D9E75" : isActive ? "#7F77DD" : "#222",
                    border: `1.5px solid ${isDone ? "#1D9E75" : isActive ? "#7F77DD" : "#333"}`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: "9px", fontWeight: 600,
                    color: isDone || isActive ? "#FFF" : "#555",
                    transition: "all 200ms",
                  }}>
                    {isDone ? (
                      <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
                        <path d="M1.5 4.5l2 2L7.5 2" stroke="white" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    ) : num}
                  </div>
                  <span style={{ fontSize: "9px", color: isActive ? "#CECBF6" : isDone ? "#5DCAA5" : "#444", letterSpacing: "0.02em" }}>{label}</span>
                </div>
                {i < 4 && <div style={{ width: "16px", height: "1px", background: isDone ? "#1D9E75" : "#222", marginBottom: "12px", transition: "all 200ms" }} />}
              </div>
            );
          })}
        </div>
      </div>

      {/* Contenu */}
      <div style={{ maxWidth: "620px", margin: "0 auto", padding: "40px 24px 140px" }}>

        {/* ── ÉTAPE 1 — Choix du service ─────────────────────────────────────── */}
        {step === 1 && (
          <div>
            <h1 style={{ fontSize: "24px", fontWeight: 600, color: "#FFF", marginBottom: "8px", lineHeight: 1.3 }}>
              Quelle prestation vous intéresse ?
            </h1>
            <p style={{ fontSize: "13px", color: "#888", marginBottom: "28px" }}>
              Bonjour <strong style={{ color: "#FFF" }}>{project.clientName}</strong> 👋 — sélectionnez la prestation qui correspond à votre projet.
            </p>

            {allServices.length === 0 ? (
              <div style={{ background: "#1A1A1A", border: "0.5px solid #2A2A2A", borderRadius: "12px", padding: "40px 20px", textAlign: "center" }}>
                <p style={{ fontSize: "13px", color: "#666" }}>Aucune prestation disponible pour le moment.</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "32px" }}>
                {allServices.map((svc) => {
                  const isSelected = selectedService?.id === svc.id;
                  const col = categoryColors[svc.category] || { bg: "#1A1A1A", color: "#888" };
                  const icon = categoryIcons[svc.category];
                  return (
                    <div
                      key={svc.id}
                      onClick={() => setSelectedService(svc)}
                      style={{
                        display: "flex", justifyContent: "space-between", alignItems: "flex-start",
                        padding: "16px 18px",
                        background: isSelected ? "#1A1A2E" : "#1A1A1A",
                        border: `${isSelected ? "1.5px" : "0.5px"} solid ${isSelected ? "#7F77DD" : "#2A2A2A"}`,
                        borderRadius: "12px",
                        cursor: "pointer",
                        transition: "all 100ms",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "flex-start", gap: "14px" }}>
                        {/* Icône catégorie */}
                        <div style={{
                          width: "38px", height: "38px", borderRadius: "10px",
                          background: col.bg, color: col.color,
                          display: "flex", alignItems: "center", justifyContent: "center",
                          flexShrink: 0,
                        }}>
                          {icon}
                        </div>

                        {/* Texte */}
                        <div>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                            <span style={{ fontSize: "15px", color: isSelected ? "#FFF" : "#DDD", fontWeight: isSelected ? 600 : 400 }}>{svc.name}</span>
                            <span style={{ fontSize: "10px", padding: "2px 8px", borderRadius: "4px", background: col.bg, color: col.color, fontWeight: 500 }}>{svc.category}</span>
                          </div>
                          {svc.description && (
                            <div style={{ fontSize: "12px", color: "#666", lineHeight: 1.5 }}>{svc.description}</div>
                          )}
                          {svc.options.length > 0 && (
                            <div style={{ fontSize: "11px", color: "#555", marginTop: "6px" }}>
                              {svc.options.length} option{svc.options.length > 1 ? "s" : ""} disponible{svc.options.length > 1 ? "s" : ""}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Prix + radio */}
                      <div style={{ display: "flex", alignItems: "center", gap: "12px", flexShrink: 0, marginLeft: "12px" }}>
                        <div style={{ textAlign: "right" }}>
                          <div style={{ fontSize: "16px", fontWeight: 600, color: isSelected ? "#CECBF6" : "#888" }}>
                            {parseFloat(svc.basePrice).toLocaleString("fr-FR")} €
                          </div>
                          <div style={{ fontSize: "10px", color: "#444" }}>à partir de</div>
                        </div>
                        <div style={{
                          width: "18px", height: "18px", borderRadius: "50%",
                          border: `1.5px solid ${isSelected ? "#7F77DD" : "#444"}`,
                          background: isSelected ? "#7F77DD" : "transparent",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          flexShrink: 0,
                        }}>
                          {isSelected && <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#fff" }} />}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <button
              onClick={() => setStep(2)}
              disabled={!selectedService}
              style={{ ...btnPrimary, width: "100%", opacity: selectedService ? 1 : 0.4 }}
            >
              Continuer →
            </button>
          </div>
        )}

        {/* ── ÉTAPE 2 — Contexte de la marque ───────────────────────────────── */}
        {step === 2 && (
          <div>
            <h2 style={{ fontSize: "22px", fontWeight: 600, color: "#FFF", marginBottom: "8px" }}>Contexte de votre marque</h2>
            <p style={{ fontSize: "13px", color: "#888", marginBottom: "28px" }}>Ces informations permettent de comprendre votre univers avant d&apos;aborder les choix visuels.</p>

            <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginBottom: "32px" }}>
              <div>
                <label style={labelStyle}>Nom de votre entreprise / marque *</label>
                <input value={brandName} onChange={(e) => setBrandName(e.target.value)} placeholder="Ex : Studio Taarys" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Domaine d&apos;activité *</label>
                <select value={sector} onChange={(e) => setSector(e.target.value)} style={{ ...inputStyle, cursor: "pointer" }}>
                  <option value="">Sélectionnez un secteur</option>
                  {SECTORS.map((s) => <option key={s} value={s} style={{ background: "#1A1A1A" }}>{s}</option>)}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Décrivez vos produits ou services *</label>
                <textarea value={brandDesc} onChange={(e) => setBrandDesc(e.target.value)} placeholder="Ex : Nous vendons des bijoux faits main à destination des femmes urbaines..." rows={3} style={{ ...inputStyle, resize: "vertical" }} />
              </div>
              <div>
                <label style={labelStyle}>Qui est votre cible principale ? *</label>
                <input value={target} onChange={(e) => setTarget(e.target.value)} placeholder="Ex : Femmes 25-40 ans, CSP+" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Avez-vous déjà une identité visuelle existante ? *</label>
                <div style={{ display: "flex", gap: "10px" }}>
                  {["Oui", "Non"].map((v) => (
                    <button key={v} onClick={() => setHasIdentity(v as "Oui" | "Non")}
                      style={{ flex: 1, padding: "10px", borderRadius: "8px", fontSize: "13px", fontWeight: 500, cursor: "pointer", fontFamily: "inherit", border: `${hasIdentity === v ? "1.5px" : "0.5px"} solid ${hasIdentity === v ? "#7F77DD" : "#2A2A2A"}`, background: hasIdentity === v ? "#1A1A2E" : "transparent", color: hasIdentity === v ? "#CECBF6" : "#888", transition: "all 100ms" }}>
                      {v}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div style={{ display: "flex", gap: "10px" }}>
              <button onClick={() => setStep(1)} style={btnSecondary}>← Retour</button>
              <button
                onClick={() => setStep(3)}
                disabled={!brandName || !sector || !brandDesc || !target || !hasIdentity}
                style={{ ...btnPrimary, opacity: brandName && sector && brandDesc && target && hasIdentity ? 1 : 0.4 }}
              >
                Continuer →
              </button>
            </div>
          </div>
        )}

        {/* ── ÉTAPE 3 — Style visuel ─────────────────────────────────────────── */}
        {step === 3 && (
          <div>
            <h2 style={{ fontSize: "22px", fontWeight: 600, color: "#FFF", marginBottom: "8px" }}>Style visuel</h2>
            <p style={{ fontSize: "13px", color: "#888", marginBottom: "28px" }}>Vos choix guideront la direction créative. Vous pouvez sélectionner plusieurs réponses quand c&apos;est indiqué.</p>

            <div style={{ display: "flex", flexDirection: "column", gap: "28px", marginBottom: "32px" }}>
              {styleQuestions.map((q, qIndex) => (
                <div key={qIndex}>
                  <div style={{ fontSize: "14px", fontWeight: 500, color: "#FFF", marginBottom: "12px" }}>
                    {q.question}
                    {q.type === "multi" && <span style={{ fontSize: "11px", color: "#555", fontWeight: 400, marginLeft: "8px" }}>Plusieurs choix possibles</span>}
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                    {q.choices.map((choice) => {
                      const isSelected = isStyleSelected(qIndex, choice);
                      return (
                        <button key={choice} onClick={() => toggleStyle(qIndex, choice, q.type)}
                          style={{ padding: "8px 14px", borderRadius: "8px", fontSize: "13px", fontWeight: isSelected ? 500 : 400, cursor: "pointer", fontFamily: "inherit", border: `${isSelected ? "1.5px" : "0.5px"} solid ${isSelected ? "#7F77DD" : "#2A2A2A"}`, background: isSelected ? "#1A1A2E" : "#1A1A1A", color: isSelected ? "#CECBF6" : "#888", transition: "all 100ms" }}>
                          {choice}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}

              {/* Références visuelles */}
              <div>
                <div style={{ fontSize: "14px", fontWeight: 500, color: "#FFF", marginBottom: "4px" }}>
                  Avez-vous des références à partager ?
                  <span style={{ fontSize: "11px", color: "#555", fontWeight: 400, marginLeft: "8px" }}>Optionnel</span>
                </div>
                <p style={{ fontSize: "12px", color: "#555", marginBottom: "10px" }}>Liens vers des sites, des logos ou des visuels qui vous inspirent.</p>
                <textarea placeholder="Ex : https://monsite.com, https://instagram.com/..." rows={2} style={{ ...inputStyle, resize: "vertical" }} />
              </div>
            </div>

            <div style={{ display: "flex", gap: "10px" }}>
              <button onClick={() => setStep(2)} style={btnSecondary}>← Retour</button>
              <button onClick={() => setStep(4)} style={btnPrimary}>Continuer →</button>
            </div>
          </div>
        )}

        {/* ── ÉTAPE 4 — Options & livrables ─────────────────────────────────── */}
        {step === 4 && (
          <div>
            <h2 style={{ fontSize: "22px", fontWeight: 600, color: "#FFF", marginBottom: "8px" }}>Options et livrables</h2>
            <p style={{ fontSize: "13px", color: "#888", marginBottom: "28px" }}>
              {serviceOptions.length > 0
                ? "Sélectionnez les options souhaitées. Le total se met à jour en temps réel."
                : "Aucune option supplémentaire disponible pour cette prestation."}
            </p>

            {serviceOptions.length > 0 ? (
              <div style={{ marginBottom: "32px" }}>
                {/* Options fixes */}
                {serviceOptions.filter(o => !o.isPercent).length > 0 && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "16px" }}>
                    {serviceOptions.filter(o => !o.isPercent).map((opt) => {
                      const isSelected = selectedOptions.includes(opt.id);
                      return (
                        <div key={opt.id} onClick={() => toggleOption(opt.id)}
                          style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 16px", background: isSelected ? "#1A1A2E" : "#1A1A1A", border: `${isSelected ? "1.5px" : "0.5px"} solid ${isSelected ? "#7F77DD" : "#2A2A2A"}`, borderRadius: "10px", cursor: "pointer", transition: "all 100ms" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                            <div style={{ width: "16px", height: "16px", borderRadius: "4px", border: `1.5px solid ${isSelected ? "#7F77DD" : "#444"}`, background: isSelected ? "#7F77DD" : "transparent", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                              {isSelected && <svg width="9" height="9" viewBox="0 0 9 9" fill="none"><path d="M1.5 4.5l2 2L7.5 2" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                            </div>
                            <span style={{ fontSize: "13px", color: isSelected ? "#FFF" : "#BBB", fontWeight: isSelected ? 500 : 400 }}>{opt.label}</span>
                          </div>
                          <span style={{ fontSize: "13px", color: isSelected ? "#CECBF6" : "#555", fontWeight: 600, flexShrink: 0, marginLeft: "12px" }}>
                            +{parseFloat(opt.price).toLocaleString("fr-FR")} €
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Options de délai (%) */}
                {serviceOptions.filter(o => o.isPercent).length > 0 && (
                  <div>
                    <div style={{ fontSize: "11px", color: "#555", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "8px" }}>
                      Délai de livraison <span style={{ color: "#444", textTransform: "none", letterSpacing: 0 }}>— un seul choix</span>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                      {serviceOptions.filter(o => o.isPercent).map((opt) => {
                        const isSelected = selectedOptions.includes(opt.id);
                        return (
                          <div key={opt.id} onClick={() => toggleOption(opt.id)}
                            style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 16px", background: isSelected ? "rgba(239,159,39,0.08)" : "#1A1A1A", border: `${isSelected ? "1.5px" : "0.5px"} solid ${isSelected ? "#EF9F27" : "#2A2A2A"}`, borderRadius: "10px", cursor: "pointer", transition: "all 100ms" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                              <div style={{ width: "16px", height: "16px", borderRadius: "50%", border: `1.5px solid ${isSelected ? "#EF9F27" : "#444"}`, background: isSelected ? "#EF9F27" : "transparent", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                                {isSelected && <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#fff" }} />}
                              </div>
                              <span style={{ fontSize: "13px", color: isSelected ? "#FFF" : "#BBB", fontWeight: isSelected ? 500 : 400 }}>{opt.label}</span>
                            </div>
                            <span style={{ fontSize: "13px", color: isSelected ? "#EF9F27" : "#555", fontWeight: 600, flexShrink: 0, marginLeft: "12px" }}>
                              +{opt.price}%
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div style={{ background: "#1A1A1A", border: "0.5px solid #2A2A2A", borderRadius: "10px", padding: "24px 20px", textAlign: "center", marginBottom: "32px" }}>
                <p style={{ fontSize: "13px", color: "#555" }}>Continuer pour finaliser votre brief.</p>
              </div>
            )}

            <div style={{ display: "flex", gap: "10px" }}>
              <button onClick={() => setStep(3)} style={btnSecondary}>← Retour</button>
              <button onClick={() => setStep(5)} style={btnPrimary}>Continuer →</button>
            </div>
          </div>
        )}

        {/* ── ÉTAPE 5 — Coordonnées ──────────────────────────────────────────── */}
        {step === 5 && (
          <div>
            <h2 style={{ fontSize: "22px", fontWeight: 600, color: "#FFF", marginBottom: "8px" }}>Vos coordonnées</h2>
            <p style={{ fontSize: "13px", color: "#888", marginBottom: "28px" }}>Le devis sera envoyé à votre adresse email.</p>

            <div style={{ display: "flex", flexDirection: "column", gap: "14px", marginBottom: "32px" }}>
              <div>
                <label style={labelStyle}>Prénom et nom *</label>
                <input value={clientName} onChange={(e) => setClientName(e.target.value)} placeholder="Sophie Martin" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Adresse email *</label>
                <input value={clientEmail} onChange={(e) => setClientEmail(e.target.value)} placeholder="sophie@exemple.com" type="email" style={inputStyle} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={labelStyle}>Téléphone <span style={{ color: "#444", textTransform: "none", letterSpacing: 0 }}>(optionnel)</span></label>
                  <input value={clientPhone} onChange={(e) => setClientPhone(e.target.value)} placeholder="+33 6 00 00 00 00" style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Ville / Pays <span style={{ color: "#444", textTransform: "none", letterSpacing: 0 }}>(optionnel)</span></label>
                  <input value={clientCity} onChange={(e) => setClientCity(e.target.value)} placeholder="Paris, France" style={inputStyle} />
                </div>
              </div>
              <div>
                <label style={labelStyle}>Précisions ou contexte supplémentaire <span style={{ color: "#444", textTransform: "none", letterSpacing: 0 }}>(optionnel)</span></label>
                <textarea value={clientNote} onChange={(e) => setClientNote(e.target.value)} placeholder="Des informations complémentaires sur votre projet..." rows={3} style={{ ...inputStyle, resize: "vertical" }} />
              </div>
              <div>
                <label style={labelStyle}>Comment avez-vous entendu parler de nous ? <span style={{ color: "#444", textTransform: "none", letterSpacing: 0 }}>(optionnel)</span></label>
                <select value={clientSource} onChange={(e) => setClientSource(e.target.value)} style={{ ...inputStyle, cursor: "pointer" }}>
                  <option value="">Sélectionner</option>
                  {SOURCES.map((s) => <option key={s} value={s} style={{ background: "#1A1A1A" }}>{s}</option>)}
                </select>
              </div>
            </div>

            <div style={{ display: "flex", gap: "10px" }}>
              <button onClick={() => setStep(4)} style={btnSecondary}>← Retour</button>
              <button
                onClick={handleSubmit}
                disabled={!clientName || !clientEmail}
                style={{ ...btnPrimary, opacity: clientName && clientEmail ? 1 : 0.4 }}
              >
                Envoyer mon brief →
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Barre de prix sticky ──────────────────────────────────────────── */}
      {step > 1 && selectedService && (
        <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: "rgba(26,26,26,0.97)", borderTop: "0.5px solid #2A2A2A", padding: "12px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", backdropFilter: "blur(8px)" }}>
          <div>
            <div style={{ fontSize: "10px", color: "#555", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "2px" }}>Total estimé</div>
            <div style={{ fontSize: "20px", fontWeight: 600, color: "#FFF" }}>
              {getTotal().toLocaleString("fr-FR")} €
              {selectedOptions.length > 0 && (
                <span style={{ fontSize: "11px", color: "#7F77DD", fontWeight: 400, marginLeft: "8px" }}>
                  {selectedOptions.length} option{selectedOptions.length > 1 ? "s" : ""}
                </span>
              )}
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: "12px", color: "#CCC", fontWeight: 500 }}>{selectedService.name}</div>
            {selectedService.category && (
              <div style={{ fontSize: "10px", padding: "2px 6px", borderRadius: "4px", background: catColor.bg, color: catColor.color, display: "inline-block", marginTop: "3px" }}>
                {selectedService.category}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
