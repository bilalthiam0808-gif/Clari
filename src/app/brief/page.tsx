"use client";

import { useState, useEffect } from "react";
import { useTheme } from "@/hooks/useTheme";
import ThemeToggle from "@/components/ThemeToggle";

// ─── Types ────────────────────────────────────────────────────────────────────

type Category = "Graphisme" | "Motion Design" | "Site web";

type ServiceOption = {
  id: string;
  label: string;
  price: string;
  isPercent?: boolean;
};

type Service = {
  id: string;
  name: string;
  category: Category;
  basePrice: string;
  description: string;
  options: ServiceOption[];
};

// ─── Style questions par service ──────────────────────────────────────────────

type StyleQuestion = {
  question: string;
  type: "single" | "multi" | "text";
  choices?: string[];
  placeholder?: string;
};

const STYLE_QUESTIONS: Record<Category, StyleQuestion[]> = {
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
    // Section I — Identité et vision
    { question: "Quels sont les objectifs de ce site ?", type: "multi", choices: ["Vendre des produits ou services en ligne", "Générer des prises de rendez-vous", "Informer / présenter mon activité", "Montrer mon portfolio / mes réalisations", "Rassurer des investisseurs ou des partenaires", "Recruter des talents", "Fidéliser mes clients existants", "Éduquer / partager des ressources", "Lancer une communauté en ligne"] },
    { question: "URL de votre site actuel (si existant)", type: "text", placeholder: "Ex : https://monsite.com" },
    { question: "Vos réseaux sociaux actifs (URLs ou @)", type: "text", placeholder: "Ex : @instagram / linkedin.com/in/..." },
    { question: "Avez-vous déjà un site existant ?", type: "single", choices: ["Non — première création", "Oui — refonte complète", "Oui — améliorations ciblées"] },
    { question: "Citez 3 mots-clés qui définissent l'image de votre marque", type: "text", placeholder: "Ex : Luxe, Proximité, Innovation" },
    { question: "Votre client idéal s'adresse à…", type: "multi", choices: ["Des particuliers (B2C)", "Des professionnels / entreprises (B2B)", "Les deux"] },
    { question: "Tranche d'âge principale de votre cible", type: "single", choices: ["18 – 30 ans", "30 – 50 ans", "50 ans et plus"] },
    { question: "Principal frein à l'achat de votre client", type: "single", choices: ["Le prix", "Manque de confiance", "Manque de temps", "Manque d'information"] },
    { question: "Citez 3 concurrents — ce que vous aimez et n'aimez pas", type: "text", placeholder: "Ex : Concurrent 1 — URL / J'aime : ... / Je n'aime pas : ..." },
    { question: "Pourquoi un client vous choisirait-il VOUS plutôt qu'un autre ?", type: "text", placeholder: "Votre valeur ajoutée, votre différence..." },
    // Section II — Univers visuel
    { question: "Quelle ambiance visuelle correspond à votre marque ?", type: "single", choices: ["Minimaliste & Épuré — style Apple / Hermès", "Moderne & Dark — ambiance tech ou luxe", "Chaleureux & Humain — couleurs douces, photos authentiques", "Brutaliste & Audacieux — grosses typos, couleurs vives", "Luxe & Premium — tons or/crème/noir, haute couture"] },
    { question: "Quel niveau d'animation souhaitez-vous ?", type: "single", choices: ["Statique — aucune animation", "Subtil — apparitions fluides au scroll", "Immersif / Effet Wow — 3D, parallaxe, scroll-storytelling"] },
    { question: "Références visuelles — sites qui vous inspirent", type: "text", placeholder: "Ex : https://site1.com — Ce qui m'inspire : ...\nhttps://site2.com — Ce qui m'inspire : ..." },
    // Section III — Structure et pages
    { question: "Quel type de site préférez-vous ?", type: "single", choices: ["One-Page — tout sur une seule page", "Multi-pages — chaque section a sa propre page", "Je ne sais pas — je m'en remets à vous"] },
    { question: "Le site doit-il être en plusieurs langues ?", type: "single", choices: ["Non — uniquement en français", "Oui — Français + Anglais", "Oui — autre combinaison"] },
    { question: "Quelles pages souhaitez-vous ?", type: "multi", choices: ["Accueil", "À Propos", "Services", "Contact", "Portfolio", "Études de cas", "Showreel", "Témoignages", "Blog", "FAQ", "Partenaires", "Mentions Légales / RGPD"] },
    // Section IV — Modules interactifs
    { question: "Quels modules interactifs souhaitez-vous ?", type: "multi", choices: ["Comparateur Avant / Après", "Compteurs dynamiques (ex: 150 projets réalisés)", "Modèle 3D manipulable", "Timeline interactive", "Scroll-Storytelling", "Logo animé au chargement", "Flux Instagram / TikTok intégré", "Carte Google interactive"] },
    // Section V — Contenu et assets
    { question: "Avez-vous rédigé les textes pour le site ?", type: "single", choices: ["Oui — textes prêts", "J'ai des brouillons à corriger", "J'ai besoin d'une rédaction complète"] },
    { question: "Avez-vous des visuels (images) pour le site ?", type: "single", choices: ["Photos pro HD disponibles", "Photos de mauvaise qualité", "Besoin d'un shooting ou rendu 3D", "On peut utiliser des images stock"] },
    // Section VI — Plateforme et autonomie
    { question: "Gestion du site après lancement", type: "single", choices: ["Autonomie totale — je veux modifier seul(e) sans coder", "Sur-mesure & performance — je confie la maintenance"] },
    { question: "Quelle plateforme préférez-vous ?", type: "single", choices: ["WordPress", "Shopify", "Next.js / Sur-mesure", "Je ne sais pas"] },
    // Section VII — Fonctionnalités techniques
    { question: "Quelles fonctionnalités souhaitez-vous ?", type: "multi", choices: ["Formulaire de contact", "Prise de rendez-vous en ligne (type Calendly)", "Inscription à une newsletter", "Paiement sécurisé en ligne", "Avis clients synchronisés (Google Reviews / Trustpilot)", "Statistiques de trafic (Google Analytics ou Matomo)", "Optimisation SEO — apparaître sur Google", "Bandeau cookies RGPD conforme", "Intégration réseaux sociaux"] },
    // Section VIII — Logistique et budget
    { question: "Avez-vous déjà un nom de domaine ?", type: "single", choices: ["Oui — j'ai déjà mon domaine", "Non — j'ai besoin d'aide"] },
    { question: "Avez-vous déjà un hébergeur ?", type: "single", choices: ["Oui — j'ai déjà un hébergeur", "Non — j'ai besoin d'une recommandation"] },
    { question: "Délai idéal pour le projet", type: "single", choices: ["Urgent", "Sous 1 mois", "Sous 3 mois", "Pas de contrainte"] },
    { question: "Souhaitez-vous un forfait de maintenance mensuelle ?", type: "single", choices: ["Oui", "Non", "Je veux en savoir plus"] },
    { question: "Votre enveloppe budgétaire", type: "single", choices: ["Moins de 1 500 €", "1 500 € – 3 500 €", "3 500 € – 7 000 €", "Plus de 7 000 €", "Je préfère ne pas le préciser"] },
    // Section IX — Le mot de la fin
    { question: "Y a-t-il une envie particulière, un détail ou une fonctionnalité magique dont nous n'avons pas parlé ?", type: "text", placeholder: "Partagez vos idées librement..." },
  ],
};

const SECTORS = ["Mode", "Beauté", "Food & Restauration", "Tech", "Santé & Bien-être", "Sport", "Immobilier", "Éducation", "Autre"];
const SOURCES = ["Instagram", "Bouche à oreille", "Google", "Recommandation d'un ami", "LinkedIn", "Autre"];

const categoryColors: Record<string, { bg: string; color: string }> = {
  "Graphisme":     { bg: "#1A1A2E", color: "#CECBF6" },
  "Motion Design": { bg: "#1A0D2E", color: "#C4B8F0" },
  "Site web":      { bg: "#0A1A12", color: "#9FE1CB" },
};

function getCategoryColor(cat: string) {
  return categoryColors[cat] || { bg: "var(--surface)", color: "var(--text2)" };
}

const SERVICE_INFO: { key: Category; displayName: string; icon: React.ReactNode; description: string }[] = [
  {
    key: "Graphisme",
    displayName: "Design graphic",
    description: "Logo, identité visuelle, supports graphiques",
    icon: (
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
        <rect x="4" y="4" width="8" height="8" rx="2" stroke="currentColor" strokeWidth="1.4"/>
        <rect x="16" y="4" width="8" height="8" rx="2" stroke="currentColor" strokeWidth="1.4"/>
        <rect x="4" y="16" width="8" height="8" rx="2" stroke="currentColor" strokeWidth="1.4"/>
        <circle cx="20" cy="20" r="4" stroke="currentColor" strokeWidth="1.4"/>
      </svg>
    ),
  },
  {
    key: "Motion Design",
    displayName: "Motion design",
    description: "Animations, vidéos motion, habillage graphique",
    icon: (
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
        <path d="M8 7l14 7-14 7V7Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/>
      </svg>
    ),
  },
  {
    key: "Site web",
    displayName: "Site web",
    description: "Sites vitrines, e-commerce, portfolio, sur-mesure",
    icon: (
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
        <rect x="3" y="5" width="22" height="18" rx="3" stroke="currentColor" strokeWidth="1.4"/>
        <path d="M3 11h22" stroke="currentColor" strokeWidth="1.4"/>
        <circle cx="8" cy="8" r="1.2" fill="currentColor"/>
        <circle cx="12" cy="8" r="1.2" fill="currentColor"/>
      </svg>
    ),
  },
];

function generateSlug(name: string): string {
  const base = name.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]/g, "-").replace(/-+/g, "-").slice(0, 20);
  const uid = Math.random().toString(36).slice(2, 8);
  return `${base}-${uid}`;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function BriefPage() {
  const { theme, toggle } = useTheme("light", "clari_client_theme");
  const [allServices, setAllServices] = useState<Service[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [step, setStep] = useState(1);

  // Étape 1 — Service père
  const [selectedService, setSelectedService] = useState<Service | null>(null);

  // Étape 2 — Contexte marque
  const [brandName, setBrandName] = useState("");
  const [sector, setSector] = useState("");
  const [brandDesc, setBrandDesc] = useState("");
  const [target, setTarget] = useState("");
  const [hasIdentity, setHasIdentity] = useState<"Oui" | "Non" | "">("");

  // Étape 3 — Style visuel
  const [styleAnswers, setStyleAnswers] = useState<Record<number, string[]>>({});
  const [autreAnswers, setAutreAnswers] = useState<Record<number, string>>({});

  // Étape 4 — Options
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);

  // Étape 5 — Coordonnées
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [clientCity, setClientCity] = useState("");
  const [clientNote, setClientNote] = useState("");
  const [clientSource, setClientSource] = useState("");

  useEffect(() => {
    fetch("/api/brief")
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setAllServices(data); });
  }, []);

  // Reset options & style quand le service change
  useEffect(() => {
    setSelectedOptions([]);
    setStyleAnswers({});
    setAutreAnswers({});
  }, [selectedService]);

  // Ordre d'affichage des services
  const defaultOrder = ["Graphisme", "Motion Design", "Site web"];
  const sortedServices = [
    ...defaultOrder.map(name => allServices.find(s => s.name === name || s.category === name)).filter(Boolean) as Service[],
    ...allServices.filter(s => !defaultOrder.includes(s.name) && !defaultOrder.includes(s.category)),
  ];

  // ─── Calcul du total ───────────────────────────────────────────────────────

  function getTotal(): number {
    if (!selectedService) return 0;
    const base = parseFloat(selectedService.basePrice) || 0;
    const fixedExtras = selectedService.options
      .filter(o => !o.isPercent && selectedOptions.includes(o.id))
      .reduce((sum, o) => sum + (parseFloat(o.price) || 0), 0);
    const subtotal = base + fixedExtras;
    const percentExtra = selectedService.options
      .filter(o => o.isPercent && selectedOptions.includes(o.id))
      .reduce((max, o) => Math.max(max, parseFloat(o.price) || 0), 0);
    return Math.round(subtotal * (1 + percentExtra / 100));
  }

  function toggleOption(optId: string) {
    const opt = selectedService?.options.find(o => o.id === optId);
    setSelectedOptions(prev => {
      if (prev.includes(optId)) return prev.filter(o => o !== optId);
      if (opt?.isPercent) {
        const withoutPercents = prev.filter(o =>
          !selectedService?.options.find(s => s.id === o)?.isPercent
        );
        return [...withoutPercents, optId];
      }
      return [...prev, optId];
    });
  }

  // ─── Style visuel ──────────────────────────────────────────────────────────

  function toggleStyle(qIndex: number, choice: string, type: "single" | "multi" | "text") {
    setStyleAnswers(prev => {
      const current = prev[qIndex] || [];
      if (type === "single") return { ...prev, [qIndex]: [choice] };
      return { ...prev, [qIndex]: current.includes(choice) ? current.filter(c => c !== choice) : [...current, choice] };
    });
  }

  function isStyleSelected(qIndex: number, choice: string) {
    return (styleAnswers[qIndex] || []).includes(choice);
  }

  // ─── Submit ────────────────────────────────────────────────────────────────

  async function handleSubmit() {
    if (!clientName || !clientEmail || !selectedService) return;

    const slug = generateSlug(clientName);
    const newProject = {
      id: Date.now().toString(),
      clientName, clientEmail,
      serviceId: selectedService.id,
      serviceName: selectedService.name,
      status: "Brief reçu",
      slug,
      createdAt: new Date().toLocaleDateString("fr-FR"),
      source: "brief_generique",
      briefData: {
        selectedService: selectedService.name,
        serviceCategory: selectedService.category,
        totalEstime: getTotal(),
        brandName, sector, brandDesc, target, hasIdentity,
        styleAnswers, autreAnswers, selectedOptions,
        clientPhone, clientCity, clientNote, clientSource,
      },
    };

    await fetch("/api/brief", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newProject),
    });
    setSubmitted(true);
  }

  // ─── Styles communs ────────────────────────────────────────────────────────

  const inputStyle: React.CSSProperties = {
    background: "var(--surface)", border: "0.5px solid var(--border)", borderRadius: "8px",
    padding: "10px 14px", fontSize: "14px", color: "var(--text)",
    width: "100%", outline: "none", fontFamily: "inherit",
  };

  const labelStyle: React.CSSProperties = {
    fontSize: "11px", color: "var(--text2)", textTransform: "uppercase",
    letterSpacing: "0.06em", marginBottom: "6px", display: "block", fontWeight: 500,
  };

  const btnPrimary: React.CSSProperties = {
    flex: 1, background: "var(--accent)", color: "#FFFFFF", border: "none",
    borderRadius: "10px", padding: "13px", fontSize: "14px", fontWeight: 500,
    cursor: "pointer", fontFamily: "inherit",
  };

  const btnSecondary: React.CSSProperties = {
    background: "transparent", color: "var(--text2)", border: "0.5px solid var(--border)",
    borderRadius: "10px", padding: "13px 20px", fontSize: "13px",
    cursor: "pointer", fontFamily: "inherit",
  };

  const STEP_LABELS = ["Service", "Contexte", "Style", "Options", "Contact"];

  const catColor = selectedService
    ? getCategoryColor(selectedService.category)
    : { bg: "#1A1A2E", color: "#CECBF6" };
  const styleQuestions = selectedService
    ? (STYLE_QUESTIONS[selectedService.category as Category] || [])
    : [];
  const serviceOptions = selectedService?.options || [];

  // ─── Page de confirmation ──────────────────────────────────────────────────

  if (submitted) return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
      <div style={{ maxWidth: "480px", width: "100%", textAlign: "center" }}>
        <div style={{ width: "56px", height: "56px", background: "#0A1A12", border: "0.5px solid rgba(29,158,117,0.4)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M5 12l5 5L19 7" stroke="#1D9E75" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <h1 style={{ fontSize: "22px", fontWeight: 600, color: "var(--text)", marginBottom: "10px" }}>Brief envoyé !</h1>
        <p style={{ fontSize: "14px", color: "var(--text2)", lineHeight: 1.7, marginBottom: "28px" }}>
          Merci <strong style={{ color: "var(--text)" }}>{clientName}</strong>. Votre brief a bien été reçu. Vous allez recevoir votre devis à <strong style={{ color: "var(--text)" }}>{clientEmail}</strong>.
        </p>
        {selectedService && (
          <div style={{ background: "var(--surface)", border: "0.5px solid var(--border)", borderRadius: "12px", padding: "16px 20px", marginBottom: "20px" }}>
            <div style={{ fontSize: "11px", color: "var(--text3)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "4px" }}>Total estimé</div>
            <div style={{ fontSize: "12px", color: "var(--text3)", marginBottom: "6px" }}>{selectedService.name}</div>
            <div style={{ fontSize: "28px", fontWeight: 600, color: "#7F77DD" }}>{getTotal().toLocaleString("fr-FR")} €</div>
          </div>
        )}
        <p style={{ fontSize: "12px", color: "var(--text3)" }}>Propulsé par <span style={{ color: "#7F77DD", fontWeight: 500 }}>Clari</span></p>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", fontFamily: "inherit" }}>

      {/* Header sticky */}
      <div style={{ borderBottom: "0.5px solid var(--border)", padding: "14px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, background: "var(--bg-blur)", backdropFilter: "blur(8px)", zIndex: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{ width: "26px", height: "26px", background: "#7F77DD", borderRadius: "7px", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M2 7h10M7 3l4 4-4 4" stroke="white" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <span style={{ fontSize: "14px", fontWeight: 600, color: "var(--text)" }}>Clari</span>
        </div>

        {/* Right: stepper + toggle */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          {/* Stepper */}
          <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
          {STEP_LABELS.map((label, i) => {
            const num = i + 1;
            const isDone = num < step;
            const isActive = num === step;
            return (
              <div key={label} style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "3px" }}>
                  <div style={{ width: "20px", height: "20px", borderRadius: "50%", background: isDone ? "#1D9E75" : isActive ? "#7F77DD" : "var(--surface2)", border: `1.5px solid ${isDone ? "#1D9E75" : isActive ? "#7F77DD" : "var(--border)"}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "9px", fontWeight: 600, color: isDone || isActive ? "#FFF" : "var(--text3)", transition: "all 200ms" }}>
                    {isDone ? <svg width="9" height="9" viewBox="0 0 9 9" fill="none"><path d="M1.5 4.5l2 2L7.5 2" stroke="white" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg> : num}
                  </div>
                  <span style={{ fontSize: "9px", color: isActive ? "var(--accent-light)" : isDone ? "#5DCAA5" : "var(--text3)", letterSpacing: "0.02em" }}>{label}</span>
                </div>
                {i < 4 && <div style={{ width: "12px", height: "1px", background: isDone ? "#1D9E75" : "var(--surface2)", marginBottom: "12px", transition: "all 200ms" }} />}
              </div>
            );
          })}
          </div>
          <ThemeToggle theme={theme} onToggle={toggle} />
        </div>
      </div>

      {/* Contenu */}
      <div style={{ maxWidth: "620px", margin: "0 auto", padding: "40px 24px 140px" }}>

        {/* ── ÉTAPE 1 — Service père ─────────────────────────────────────────── */}
        {step === 1 && (
          <div>
            <h1 style={{ fontSize: "24px", fontWeight: 600, color: "var(--text)", marginBottom: "8px", lineHeight: 1.3 }}>
              Bonjour 👋 Quel service vous intéresse ?
            </h1>
            <p style={{ fontSize: "13px", color: "var(--text2)", marginBottom: "32px" }}>
              Sélectionnez le service correspondant à votre projet. Vous choisirez ensuite les options qui vous conviennent.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "32px" }}>
              {sortedServices.map((svc) => {
                const isSelected = selectedService?.id === svc.id;
                const col = getCategoryColor(svc.category);
                const svcInfo = SERVICE_INFO.find(s => s.key === svc.category);
                return (
                  <div key={svc.id} onClick={() => setSelectedService(svc)}
                    style={{ display: "flex", alignItems: "center", gap: "18px", padding: "20px 22px", background: isSelected ? col.bg : "var(--surface)", border: `${isSelected ? "1.5px" : "0.5px"} solid ${isSelected ? col.color : "var(--border)"}`, borderRadius: "14px", cursor: "pointer", transition: "all 100ms" }}>
                    <div style={{ color: isSelected ? col.color : "var(--text3)", flexShrink: 0 }}>
                      {svcInfo?.icon || (
                        <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                          <rect x="4" y="4" width="20" height="20" rx="4" stroke="currentColor" strokeWidth="1.4"/>
                          <path d="M10 14h8M14 10v8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
                        </svg>
                      )}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: "16px", fontWeight: isSelected ? 600 : 500, color: isSelected ? "#FFF" : "var(--text)", marginBottom: "3px" }}>{svcInfo?.displayName || svc.name}</div>
                      <div style={{ fontSize: "13px", color: isSelected ? col.color : "var(--text3)" }}>
                        {svcInfo?.description || svc.description}
                      </div>
                    </div>
                    <div style={{ textAlign: "right", marginRight: "12px", flexShrink: 0 }}>
                      <div style={{ fontSize: "15px", fontWeight: 600, color: isSelected ? col.color : "var(--text3)" }}>
                        {parseFloat(svc.basePrice).toLocaleString("fr-FR")} €
                      </div>
                      <div style={{ fontSize: "10px", color: "var(--text3)" }}>à partir de</div>
                    </div>
                    <div style={{ width: "20px", height: "20px", borderRadius: "50%", border: `1.5px solid ${isSelected ? col.color : "#444"}`, background: isSelected ? col.color : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      {isSelected && <div style={{ width: "7px", height: "7px", borderRadius: "50%", background: "#fff" }} />}
                    </div>
                  </div>
                );
              })}
            </div>

            <button onClick={() => setStep(2)} disabled={!selectedService} style={{ ...btnPrimary, width: "100%", opacity: selectedService ? 1 : 0.4 }}>
              Continuer →
            </button>
          </div>
        )}

        {/* ── ÉTAPE 2 — Contexte de la marque ───────────────────────────────── */}
        {step === 2 && (
          <div>
            {selectedService && (
              <div style={{ marginBottom: "8px" }}>
                <span style={{ fontSize: "11px", fontWeight: 500, padding: "3px 10px", borderRadius: "6px", background: catColor.bg, color: catColor.color }}>{selectedService.name}</span>
              </div>
            )}
            <h2 style={{ fontSize: "22px", fontWeight: 600, color: "var(--text)", marginBottom: "8px" }}>Contexte de votre marque</h2>
            <p style={{ fontSize: "13px", color: "var(--text2)", marginBottom: "28px" }}>Ces informations permettent de comprendre votre univers avant d&apos;aborder les choix visuels.</p>

            <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginBottom: "32px" }}>
              <div>
                <label style={labelStyle}>Nom de votre entreprise / marque *</label>
                <input value={brandName} onChange={(e) => setBrandName(e.target.value)} placeholder="Ex : Studio Taarys" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Domaine d&apos;activité *</label>
                <select value={sector} onChange={(e) => setSector(e.target.value)} style={{ ...inputStyle, cursor: "pointer" }}>
                  <option value="">Sélectionnez un secteur</option>
                  {SECTORS.map(s => <option key={s} value={s} style={{ background: "var(--surface)" }}>{s}</option>)}
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
                  {["Oui", "Non"].map(v => (
                    <button key={v} onClick={() => setHasIdentity(v as "Oui" | "Non")}
                      style={{ flex: 1, padding: "10px", borderRadius: "8px", fontSize: "13px", fontWeight: 500, cursor: "pointer", fontFamily: "inherit", border: `${hasIdentity === v ? "1.5px" : "0.5px"} solid ${hasIdentity === v ? "#7F77DD" : "var(--border)"}`, background: hasIdentity === v ? "#1A1A2E" : "transparent", color: hasIdentity === v ? "#CECBF6" : "var(--text2)", transition: "all 100ms" }}>
                      {v}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div style={{ display: "flex", gap: "10px" }}>
              <button onClick={() => setStep(1)} style={btnSecondary}>← Retour</button>
              <button onClick={() => setStep(3)} disabled={!brandName || !sector || !brandDesc || !target || !hasIdentity} style={{ ...btnPrimary, opacity: brandName && sector && brandDesc && target && hasIdentity ? 1 : 0.4 }}>Continuer →</button>
            </div>
          </div>
        )}

        {/* ── ÉTAPE 3 — Composition ─────────────────────────────────────────── */}
        {step === 3 && (
          <div>
            <h2 style={{ fontSize: "22px", fontWeight: 600, color: "var(--text)", marginBottom: "8px", letterSpacing: "0.04em", textTransform: "uppercase" }}>Composition</h2>
            <p style={{ fontSize: "13px", color: "var(--text2)", marginBottom: "28px" }}>Décrivez votre projet dans le détail. Ces réponses servent de base à votre cahier des charges — soyez aussi précis que possible.</p>

            <div style={{ display: "flex", flexDirection: "column", gap: "28px", marginBottom: "32px" }}>
              {styleQuestions.map((q, qIndex) => (
                <div key={qIndex}>
                  <div style={{ fontSize: "14px", fontWeight: 500, color: "var(--text)", marginBottom: "12px" }}>
                    {q.question}
                    {q.type === "multi" && <span style={{ fontSize: "11px", color: "var(--text3)", fontWeight: 400, marginLeft: "8px" }}>Plusieurs choix possibles</span>}
                  </div>
                  {q.type === "text" ? (
                    <textarea
                      value={(styleAnswers[qIndex] || [])[0] || ""}
                      onChange={(e) => setStyleAnswers(prev => ({ ...prev, [qIndex]: [e.target.value] }))}
                      placeholder={q.placeholder || ""}
                      rows={2}
                      style={{ ...inputStyle, resize: "vertical" }}
                    />
                  ) : (
                    <>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                        {(q.choices || []).map(choice => {
                          const isSelected = isStyleSelected(qIndex, choice);
                          return (
                            <button key={choice} onClick={() => toggleStyle(qIndex, choice, q.type)}
                              style={{ padding: "8px 14px", borderRadius: "8px", fontSize: "13px", fontWeight: isSelected ? 500 : 400, cursor: "pointer", fontFamily: "inherit", border: `${isSelected ? "1.5px" : "0.5px"} solid ${isSelected ? "#7F77DD" : "var(--border)"}`, background: isSelected ? "#1A1A2E" : "var(--surface)", color: isSelected ? "#CECBF6" : "var(--text2)", transition: "all 100ms" }}>
                              {choice}
                            </button>
                          );
                        })}
                        <button onClick={() => toggleStyle(qIndex, "Autre", q.type)}
                          style={{ padding: "8px 14px", borderRadius: "8px", fontSize: "13px", fontWeight: isStyleSelected(qIndex, "Autre") ? 500 : 400, cursor: "pointer", fontFamily: "inherit", border: `${isStyleSelected(qIndex, "Autre") ? "1.5px" : "0.5px"} solid ${isStyleSelected(qIndex, "Autre") ? "#7F77DD" : "var(--border)"}`, background: isStyleSelected(qIndex, "Autre") ? "#1A1A2E" : "var(--surface)", color: isStyleSelected(qIndex, "Autre") ? "#CECBF6" : "#555", transition: "all 100ms", fontStyle: "italic" }}>
                          + Autre
                        </button>
                      </div>
                      {isStyleSelected(qIndex, "Autre") && (
                        <textarea
                          value={autreAnswers[qIndex] || ""}
                          onChange={(e) => setAutreAnswers(prev => ({ ...prev, [qIndex]: e.target.value }))}
                          placeholder="Précisez..."
                          rows={2}
                          style={{ ...inputStyle, resize: "vertical", marginTop: "10px" }}
                        />
                      )}
                    </>
                  )}
                </div>
              ))}
            </div>

            <div style={{ display: "flex", gap: "10px" }}>
              <button onClick={() => setStep(2)} style={btnSecondary}>← Retour</button>
              <button onClick={() => setStep(4)} style={btnPrimary}>Continuer →</button>
            </div>
          </div>
        )}

        {/* ── ÉTAPE 4 — Options ─────────────────────────────────────────────── */}
        {step === 4 && (
          <div>
            <h2 style={{ fontSize: "22px", fontWeight: 600, color: "var(--text)", marginBottom: "8px" }}>Options et livrables</h2>
            <p style={{ fontSize: "13px", color: "var(--text2)", marginBottom: "28px" }}>
              {serviceOptions.length > 0 ? "Sélectionnez les options souhaitées. Le total se met à jour en temps réel." : "Aucune option supplémentaire pour cette prestation."}
            </p>

            {serviceOptions.length > 0 ? (
              <div style={{ marginBottom: "32px" }}>
                {/* Options fixes */}
                {serviceOptions.filter(o => !o.isPercent).length > 0 && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "16px" }}>
                    {serviceOptions.filter(o => !o.isPercent).map(opt => {
                      const isSelected = selectedOptions.includes(opt.id);
                      return (
                        <div key={opt.id} onClick={() => toggleOption(opt.id)}
                          style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 16px", background: isSelected ? "#1A1A2E" : "var(--surface)", border: `${isSelected ? "1.5px" : "0.5px"} solid ${isSelected ? "#7F77DD" : "var(--border)"}`, borderRadius: "10px", cursor: "pointer", transition: "all 100ms" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                            <div style={{ width: "16px", height: "16px", borderRadius: "4px", border: `1.5px solid ${isSelected ? "#7F77DD" : "#444"}`, background: isSelected ? "#7F77DD" : "transparent", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                              {isSelected && <svg width="9" height="9" viewBox="0 0 9 9" fill="none"><path d="M1.5 4.5l2 2L7.5 2" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                            </div>
                            <span style={{ fontSize: "13px", color: isSelected ? "#FFF" : "var(--text2)", fontWeight: isSelected ? 500 : 400 }}>{opt.label}</span>
                          </div>
                          <span style={{ fontSize: "13px", color: isSelected ? "#CECBF6" : "#555", fontWeight: 600, flexShrink: 0, marginLeft: "12px" }}>
                            +{parseFloat(opt.price).toLocaleString("fr-FR")} €
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Délais en % */}
                {serviceOptions.filter(o => o.isPercent).length > 0 && (
                  <div>
                    <div style={{ fontSize: "11px", color: "var(--text3)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "8px" }}>
                      Délai de livraison <span style={{ color: "var(--text3)", textTransform: "none", letterSpacing: 0 }}>— un seul choix</span>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                      {serviceOptions.filter(o => o.isPercent).map(opt => {
                        const isSelected = selectedOptions.includes(opt.id);
                        return (
                          <div key={opt.id} onClick={() => toggleOption(opt.id)}
                            style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 16px", background: isSelected ? "rgba(239,159,39,0.08)" : "var(--surface)", border: `${isSelected ? "1.5px" : "0.5px"} solid ${isSelected ? "#EF9F27" : "var(--border)"}`, borderRadius: "10px", cursor: "pointer", transition: "all 100ms" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                              <div style={{ width: "16px", height: "16px", borderRadius: "50%", border: `1.5px solid ${isSelected ? "#EF9F27" : "#444"}`, background: isSelected ? "#EF9F27" : "transparent", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                                {isSelected && <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#fff" }} />}
                              </div>
                              <span style={{ fontSize: "13px", color: isSelected ? "#FFF" : "var(--text2)", fontWeight: isSelected ? 500 : 400 }}>{opt.label}</span>
                            </div>
                            <span style={{ fontSize: "13px", color: isSelected ? "#EF9F27" : "#555", fontWeight: 600, flexShrink: 0, marginLeft: "12px" }}>+{opt.price}%</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div style={{ background: "var(--surface)", border: "0.5px solid var(--border)", borderRadius: "10px", padding: "24px 20px", textAlign: "center", marginBottom: "32px" }}>
                <p style={{ fontSize: "13px", color: "var(--text3)" }}>Continuez pour finaliser votre brief.</p>
              </div>
            )}

            <div style={{ display: "flex", gap: "10px" }}>
              <button onClick={() => setStep(3)} style={btnSecondary}>← Retour</button>
              <button onClick={() => setStep(5)} style={btnPrimary}>Continuer →</button>
            </div>
          </div>
        )}

        {/* ── ÉTAPE 5 — Coordonnées ─────────────────────────────────────────── */}
        {step === 5 && (
          <div>
            <h2 style={{ fontSize: "22px", fontWeight: 600, color: "var(--text)", marginBottom: "8px" }}>Vos coordonnées</h2>
            <p style={{ fontSize: "13px", color: "var(--text2)", marginBottom: "28px" }}>Votre devis estimatif sera transmis à votre adresse email.</p>

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
                  <label style={labelStyle}>Téléphone <span style={{ color: "var(--text3)", textTransform: "none", letterSpacing: 0 }}>(optionnel)</span></label>
                  <input value={clientPhone} onChange={(e) => setClientPhone(e.target.value)} placeholder="+33 6 00 00 00 00" style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Ville / Pays <span style={{ color: "var(--text3)", textTransform: "none", letterSpacing: 0 }}>(optionnel)</span></label>
                  <input value={clientCity} onChange={(e) => setClientCity(e.target.value)} placeholder="Paris, France" style={inputStyle} />
                </div>
              </div>
              <div>
                <label style={labelStyle}>Précisions supplémentaires <span style={{ color: "var(--text3)", textTransform: "none", letterSpacing: 0 }}>(optionnel)</span></label>
                <textarea value={clientNote} onChange={(e) => setClientNote(e.target.value)} placeholder="Des informations complémentaires sur votre projet..." rows={3} style={{ ...inputStyle, resize: "vertical" }} />
              </div>
              <div>
                <label style={labelStyle}>Comment nous avez-vous trouvés ? <span style={{ color: "var(--text3)", textTransform: "none", letterSpacing: 0 }}>(optionnel)</span></label>
                <select value={clientSource} onChange={(e) => setClientSource(e.target.value)} style={{ ...inputStyle, cursor: "pointer" }}>
                  <option value="">Sélectionner</option>
                  {SOURCES.map(s => <option key={s} value={s} style={{ background: "var(--surface)" }}>{s}</option>)}
                </select>
              </div>
            </div>

            <div style={{ display: "flex", gap: "10px" }}>
              <button onClick={() => setStep(4)} style={btnSecondary}>← Retour</button>
              <button onClick={handleSubmit} disabled={!clientName || !clientEmail} style={{ ...btnPrimary, opacity: clientName && clientEmail ? 1 : 0.4 }}>
                Envoyer mon brief →
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Barre de prix sticky ──────────────────────────────────────────── */}
      {step > 1 && selectedService && (
        <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: "var(--bg-blur)", borderTop: "0.5px solid var(--border)", padding: "12px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", backdropFilter: "blur(8px)" }}>
          <div>
            <div style={{ fontSize: "10px", color: "var(--text3)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "2px" }}>Total estimé</div>
            <div style={{ fontSize: "20px", fontWeight: 600, color: "var(--text)" }}>
              {getTotal().toLocaleString("fr-FR")} €
              {selectedOptions.length > 0 && (
                <span style={{ fontSize: "11px", color: "#7F77DD", fontWeight: 400, marginLeft: "8px" }}>
                  {selectedOptions.length} option{selectedOptions.length > 1 ? "s" : ""}
                </span>
              )}
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: "12px", color: "var(--text2)", fontWeight: 500 }}>{SERVICE_INFO.find(s => s.key === selectedService.category)?.displayName || selectedService.name}</div>
            <div style={{ fontSize: "10px", padding: "2px 6px", borderRadius: "4px", background: catColor.bg, color: catColor.color, display: "inline-block", marginTop: "3px" }}>
              {selectedService.category}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
