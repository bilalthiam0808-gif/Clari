"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Sidebar from "@/components/Sidebar";

type QType = "single" | "multi" | "text";
type FQ = { id: string; question: string; type: QType; choices: string[]; placeholder?: string };
type Cat = "Graphisme" | "Motion Design" | "Site web";

const CATS: Cat[] = ["Graphisme", "Motion Design", "Site web"];

const CAT_COLORS: Record<Cat, { bg: string; color: string }> = {
  "Graphisme":     { bg: "#1A1A2E", color: "#CECBF6" },
  "Motion Design": { bg: "#1A0D2E", color: "#C4B8F0" },
  "Site web":      { bg: "#0A1A12", color: "#9FE1CB" },
};

const DEFAULTS: Record<Cat, Omit<FQ, "id">[]> = {
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
    { question: "Quels sont les objectifs de ce site ?", type: "multi", choices: ["Vendre des produits ou services en ligne", "Générer des prises de rendez-vous", "Informer / présenter mon activité", "Montrer mon portfolio / mes réalisations", "Rassurer des investisseurs ou des partenaires", "Recruter des talents", "Fidéliser mes clients existants", "Éduquer / partager des ressources", "Lancer une communauté en ligne"] },
    { question: "URL de votre site actuel (si existant)", type: "text", choices: [], placeholder: "Ex : https://monsite.com" },
    { question: "Vos réseaux sociaux actifs (URLs ou @)", type: "text", choices: [], placeholder: "Ex : @instagram / linkedin.com/in/..." },
    { question: "Avez-vous déjà un site existant ?", type: "single", choices: ["Non — première création", "Oui — refonte complète", "Oui — améliorations ciblées"] },
    { question: "Citez 3 mots-clés qui définissent l'image de votre marque", type: "text", choices: [], placeholder: "Ex : Luxe, Proximité, Innovation" },
    { question: "Votre client idéal s'adresse à…", type: "multi", choices: ["Des particuliers (B2C)", "Des professionnels / entreprises (B2B)", "Les deux"] },
    { question: "Tranche d'âge principale de votre cible", type: "single", choices: ["18 – 30 ans", "30 – 50 ans", "50 ans et plus"] },
    { question: "Principal frein à l'achat de votre client", type: "single", choices: ["Le prix", "Manque de confiance", "Manque de temps", "Manque d'information"] },
    { question: "Citez 3 concurrents — ce que vous aimez et n'aimez pas", type: "text", choices: [], placeholder: "Ex : Concurrent 1 — URL / J'aime : ... / Je n'aime pas : ..." },
    { question: "Pourquoi un client vous choisirait-il VOUS plutôt qu'un autre ?", type: "text", choices: [], placeholder: "Votre valeur ajoutée, votre différence..." },
    { question: "Quelle ambiance visuelle correspond à votre marque ?", type: "single", choices: ["Minimaliste & Épuré — style Apple / Hermès", "Moderne & Dark — ambiance tech ou luxe", "Chaleureux & Humain — couleurs douces, photos authentiques", "Brutaliste & Audacieux — grosses typos, couleurs vives", "Luxe & Premium — tons or/crème/noir, haute couture"] },
    { question: "Quel niveau d'animation souhaitez-vous ?", type: "single", choices: ["Statique — aucune animation", "Subtil — apparitions fluides au scroll", "Immersif / Effet Wow — 3D, parallaxe, scroll-storytelling"] },
    { question: "Références visuelles — sites qui vous inspirent", type: "text", choices: [], placeholder: "Ex : https://site1.com — Ce qui m'inspire : ..." },
    { question: "Quel type de site préférez-vous ?", type: "single", choices: ["One-Page — tout sur une seule page", "Multi-pages — chaque section a sa propre page", "Je ne sais pas — je m'en remets à vous"] },
    { question: "Le site doit-il être en plusieurs langues ?", type: "single", choices: ["Non — uniquement en français", "Oui — Français + Anglais", "Oui — autre combinaison"] },
    { question: "Quelles pages souhaitez-vous ?", type: "multi", choices: ["Accueil", "À Propos", "Services", "Contact", "Portfolio", "Études de cas", "Showreel", "Témoignages", "Blog", "FAQ", "Partenaires", "Mentions Légales / RGPD"] },
    { question: "Quels modules interactifs souhaitez-vous ?", type: "multi", choices: ["Comparateur Avant / Après", "Compteurs dynamiques", "Modèle 3D manipulable", "Timeline interactive", "Scroll-Storytelling", "Logo animé au chargement", "Flux Instagram / TikTok intégré", "Carte Google interactive"] },
    { question: "Avez-vous rédigé les textes pour le site ?", type: "single", choices: ["Oui — textes prêts", "J'ai des brouillons à corriger", "J'ai besoin d'une rédaction complète"] },
    { question: "Avez-vous des visuels (images) pour le site ?", type: "single", choices: ["Photos pro HD disponibles", "Photos de mauvaise qualité", "Besoin d'un shooting ou rendu 3D", "On peut utiliser des images stock"] },
    { question: "Gestion du site après lancement", type: "single", choices: ["Autonomie totale — je veux modifier seul(e) sans coder", "Sur-mesure & performance — je confie la maintenance"] },
    { question: "Quelle plateforme préférez-vous ?", type: "single", choices: ["WordPress", "Shopify", "Next.js / Sur-mesure", "Je ne sais pas"] },
    { question: "Quelles fonctionnalités souhaitez-vous ?", type: "multi", choices: ["Formulaire de contact", "Prise de rendez-vous en ligne", "Inscription à une newsletter", "Paiement sécurisé en ligne", "Avis clients synchronisés", "Statistiques de trafic", "Optimisation SEO", "Bandeau cookies RGPD conforme", "Intégration réseaux sociaux"] },
    { question: "Avez-vous déjà un nom de domaine ?", type: "single", choices: ["Oui — j'ai déjà mon domaine", "Non — j'ai besoin d'aide"] },
    { question: "Avez-vous déjà un hébergeur ?", type: "single", choices: ["Oui — j'ai déjà un hébergeur", "Non — j'ai besoin d'une recommandation"] },
    { question: "Délai idéal pour le projet", type: "single", choices: ["Urgent", "Sous 1 mois", "Sous 3 mois", "Pas de contrainte"] },
    { question: "Souhaitez-vous un forfait de maintenance mensuelle ?", type: "single", choices: ["Oui", "Non", "Je veux en savoir plus"] },
    { question: "Votre enveloppe budgétaire", type: "single", choices: ["Moins de 1 500 €", "1 500 € – 3 500 €", "3 500 € – 7 000 €", "Plus de 7 000 €", "Je préfère ne pas le préciser"] },
    { question: "Y a-t-il une envie particulière ou une fonctionnalité dont nous n'avons pas parlé ?", type: "text", choices: [], placeholder: "Partagez vos idées librement..." },
  ],
};

function withIds(qs: Omit<FQ, "id">[]): FQ[] {
  return qs.map(q => ({ ...q, choices: q.choices ?? [], id: crypto.randomUUID() }));
}

const TYPE_LABELS: Record<QType, string> = {
  single: "Choix unique",
  multi: "Choix multiple",
  text: "Texte libre",
};

export default function FormulairesPage() {
  const [active, setActive] = useState<Cat>("Graphisme");
  const [forms, setForms] = useState<Record<Cat, FQ[]>>({
    "Graphisme": [],
    "Motion Design": [],
    "Site web": [],
  });
  const [mounted, setMounted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<"saved" | "error" | null>(null);
  const [canUndo, setCanUndo] = useState<Record<Cat, boolean>>({ "Graphisme": false, "Motion Design": false, "Site web": false });
  const [canRedo, setCanRedo] = useState<Record<Cat, boolean>>({ "Graphisme": false, "Motion Design": false, "Site web": false });
  const undoStack = useRef<Record<Cat, FQ[][]>>({ "Graphisme": [], "Motion Design": [], "Site web": [] });
  const redoStack = useRef<Record<Cat, FQ[][]>>({ "Graphisme": [], "Motion Design": [], "Site web": [] });

  useEffect(() => {
    fetch("/api/form-questions")
      .then(r => r.ok ? r.json() : {})
      .then((data: Record<string, (Partial<FQ> & { question: string; type: QType })[]>) => {
        setForms({
          "Graphisme": data["Graphisme"]?.length ? data["Graphisme"].map(q => ({ ...q, id: q.id ?? crypto.randomUUID(), choices: q.choices ?? [] })) : withIds(DEFAULTS["Graphisme"]),
          "Motion Design": data["Motion Design"]?.length ? data["Motion Design"].map(q => ({ ...q, id: q.id ?? crypto.randomUUID(), choices: q.choices ?? [] })) : withIds(DEFAULTS["Motion Design"]),
          "Site web": data["Site web"]?.length ? data["Site web"].map(q => ({ ...q, id: q.id ?? crypto.randomUUID(), choices: q.choices ?? [] })) : withIds(DEFAULTS["Site web"]),
        });
      })
      .catch(() => {
        setForms({
          "Graphisme": withIds(DEFAULTS["Graphisme"]),
          "Motion Design": withIds(DEFAULTS["Motion Design"]),
          "Site web": withIds(DEFAULTS["Site web"]),
        });
      })
      .finally(() => setMounted(true));
  }, []);

  function update(cat: Cat, fn: (qs: FQ[]) => FQ[]) {
    setForms(prev => {
      undoStack.current[cat] = [...undoStack.current[cat], prev[cat]];
      redoStack.current[cat] = [];
      setCanUndo(u => ({ ...u, [cat]: true }));
      setCanRedo(r => ({ ...r, [cat]: false }));
      return { ...prev, [cat]: fn(prev[cat]) };
    });
  }

  const undo = useCallback(() => {
    const stack = undoStack.current[active];
    if (!stack.length) return;
    const prev = stack[stack.length - 1];
    undoStack.current[active] = stack.slice(0, -1);
    setForms(cur => {
      redoStack.current[active] = [...redoStack.current[active], cur[active]];
      setCanRedo(r => ({ ...r, [active]: true }));
      setCanUndo(u => ({ ...u, [active]: undoStack.current[active].length > 0 }));
      return { ...cur, [active]: prev };
    });
  }, [active]);

  const redo = useCallback(() => {
    const stack = redoStack.current[active];
    if (!stack.length) return;
    const next = stack[stack.length - 1];
    redoStack.current[active] = stack.slice(0, -1);
    setForms(cur => {
      undoStack.current[active] = [...undoStack.current[active], cur[active]];
      setCanUndo(u => ({ ...u, [active]: true }));
      setCanRedo(r => ({ ...r, [active]: redoStack.current[active].length > 0 }));
      return { ...cur, [active]: next };
    });
  }, [active]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === "z" && !e.shiftKey) { e.preventDefault(); undo(); }
      if ((e.ctrlKey || e.metaKey) && (e.key === "y" || (e.key === "z" && e.shiftKey))) { e.preventDefault(); redo(); }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [undo, redo]);

  function updateQ(i: number, patch: Partial<FQ>) {
    update(active, qs => qs.map((q, idx) => idx === i ? { ...q, ...patch } : q));
  }

  function removeQ(i: number) {
    update(active, qs => qs.filter((_, idx) => idx !== i));
  }

  function addQ() {
    update(active, qs => [...qs, { id: crypto.randomUUID(), question: "", type: "single", choices: [""] }]);
  }

  function moveQ(i: number, dir: -1 | 1) {
    update(active, qs => {
      const arr = [...qs];
      const j = i + dir;
      if (j < 0 || j >= arr.length) return arr;
      [arr[i], arr[j]] = [arr[j], arr[i]];
      return arr;
    });
  }

  function addChoice(qi: number) {
    update(active, qs => qs.map((q, i) => i === qi ? { ...q, choices: [...q.choices, ""] } : q));
  }

  function updateChoice(qi: number, ci: number, val: string) {
    update(active, qs => qs.map((q, i) => i === qi ? { ...q, choices: q.choices.map((c, j) => j === ci ? val : c) } : q));
  }

  function removeChoice(qi: number, ci: number) {
    update(active, qs => qs.map((q, i) => i === qi ? { ...q, choices: q.choices.filter((_, j) => j !== ci) } : q));
  }

  function resetToDefault() {
    if (!confirm(`Réinitialiser les questions "${active}" aux valeurs par défaut ?`)) return;
    update(active, () => withIds(DEFAULTS[active]));
  }

  async function save() {
    setSaving(true);
    setFeedback(null);
    try {
      const res = await fetch("/api/form-questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category: active, questions: forms[active] }),
      });
      setFeedback(res.ok ? "saved" : "error");
    } catch {
      setFeedback("error");
    } finally {
      setSaving(false);
      setTimeout(() => setFeedback(null), 3000);
    }
  }

  const qs = forms[active];
  const col = CAT_COLORS[active];

  const inputBase: React.CSSProperties = {
    background: "var(--surface2)", border: "0.5px solid var(--border)", borderRadius: "8px",
    padding: "8px 12px", fontSize: "13px", color: "var(--text)", fontFamily: "inherit",
    outline: "none", width: "100%",
  };

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden", background: "var(--bg)" }}>
      <Sidebar />

      <main className="admin-main" style={{ flex: 1, overflow: "auto", padding: "28px 32px" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "28px" }}>
          <div>
            <h1 style={{ fontSize: "20px", fontWeight: 600, color: "var(--text)", marginBottom: "2px" }}>Mes formulaires</h1>
            <p style={{ fontSize: "13px", color: "var(--text2)" }}>
              Personnalisez les questions posées à vos clients selon chaque service.
            </p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            {feedback === "saved" && (
              <span style={{ fontSize: "12px", color: "var(--success)", display: "flex", alignItems: "center", gap: "5px" }}>
                <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M2 6.5l3 3L11 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                Enregistré
              </span>
            )}
            {feedback === "error" && (
              <span style={{ fontSize: "12px", color: "var(--error)" }}>Erreur lors de l'enregistrement</span>
            )}
            {/* Undo */}
            <button onClick={undo} disabled={!canUndo[active]} title="Annuler (Ctrl+Z)"
              style={{ width: "32px", height: "32px", borderRadius: "8px", border: "0.5px solid var(--border)", background: "transparent", color: canUndo[active] ? "var(--text2)" : "var(--text3)", cursor: canUndo[active] ? "pointer" : "not-allowed", display: "flex", alignItems: "center", justifyContent: "center", opacity: canUndo[active] ? 1 : 0.35, transition: "all 100ms" }}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 5h6a4 4 0 1 1 0 8H4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/><path d="M2 5l2.5-2.5M2 5l2.5 2.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </button>
            {/* Redo */}
            <button onClick={redo} disabled={!canRedo[active]} title="Rétablir (Ctrl+Y)"
              style={{ width: "32px", height: "32px", borderRadius: "8px", border: "0.5px solid var(--border)", background: "transparent", color: canRedo[active] ? "var(--text2)" : "var(--text3)", cursor: canRedo[active] ? "pointer" : "not-allowed", display: "flex", alignItems: "center", justifyContent: "center", opacity: canRedo[active] ? 1 : 0.35, transition: "all 100ms" }}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M12 5H6a4 4 0 1 0 0 8h4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/><path d="M12 5l-2.5-2.5M12 5l-2.5 2.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </button>
            <div style={{ width: "0.5px", height: "20px", background: "var(--border)", margin: "0 2px" }} />
            <button onClick={save} disabled={saving}
              style={{ padding: "8px 18px", borderRadius: "8px", fontSize: "13px", fontWeight: 500, cursor: saving ? "not-allowed" : "pointer", fontFamily: "inherit", background: "var(--accent)", color: "#FFF", border: "none", opacity: saving ? 0.6 : 1, transition: "opacity 100ms" }}>
              {saving ? "Enregistrement…" : "Enregistrer"}
            </button>
          </div>
        </div>

        {/* Category tabs */}
        <div style={{ display: "flex", gap: "6px", marginBottom: "24px" }}>
          {CATS.map(cat => {
            const isActive = active === cat;
            const c = CAT_COLORS[cat];
            return (
              <button key={cat} onClick={() => setActive(cat)}
                style={{ padding: "7px 16px", borderRadius: "8px", fontSize: "12px", fontWeight: 500, cursor: "pointer", fontFamily: "inherit", background: isActive ? c.bg : "transparent", color: isActive ? c.color : "var(--text3)", border: isActive ? `0.5px solid ${c.color}40` : "0.5px solid var(--border)", transition: "all 100ms" }}>
                {cat}
              </button>
            );
          })}
          <button onClick={resetToDefault} style={{ marginLeft: "auto", padding: "7px 14px", borderRadius: "8px", fontSize: "11px", fontWeight: 400, cursor: "pointer", fontFamily: "inherit", background: "transparent", color: "var(--text3)", border: "0.5px solid var(--border)", transition: "all 100ms" }}>
            Réinitialiser par défaut
          </button>
        </div>

        {/* Info banner */}
        {mounted && (
          <div style={{ background: "var(--accent-bg)", border: `0.5px solid ${col.color}30`, borderRadius: "10px", padding: "10px 16px", marginBottom: "20px", display: "flex", alignItems: "center", gap: "10px" }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="6" stroke="var(--accent-light)" strokeWidth="1.2"/><path d="M7 6v4M7 4.5v.5" stroke="var(--accent-light)" strokeWidth="1.2" strokeLinecap="round"/></svg>
            <span style={{ fontSize: "12px", color: "var(--accent-light)" }}>
              <strong>{qs.length} question{qs.length > 1 ? "s" : ""}</strong> dans le formulaire <strong>{active}</strong> — cliquez sur "Enregistrer" pour appliquer vos modifications.
            </span>
          </div>
        )}

        {/* Questions list */}
        {!mounted ? null : (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "16px" }}>
            {qs.map((q, i) => (
              <div key={q.id} style={{ background: "var(--surface)", border: "0.5px solid var(--border)", borderRadius: "14px", overflow: "hidden" }}>

                {/* Card header */}
                <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "12px 16px", borderBottom: "0.5px solid var(--border)", background: "var(--surface2)" }}>
                  <span style={{ minWidth: "22px", height: "22px", borderRadius: "6px", background: col.bg, color: col.color, fontSize: "10px", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, border: `0.5px solid ${col.color}40` }}>{i + 1}</span>
                  <div style={{ flex: 1, fontSize: "12px", color: "var(--text3)", fontStyle: q.question ? "normal" : "italic" }}>
                    {q.question || "Question sans titre"}
                  </div>
                  {/* Type badge */}
                  <span style={{ fontSize: "10px", fontWeight: 500, padding: "2px 8px", borderRadius: "4px", background: q.type === "single" ? "#1A1A2E" : q.type === "multi" ? "#1A0D2E" : "var(--surface)", color: q.type === "single" ? "#CECBF6" : q.type === "multi" ? "#C4B8F0" : "var(--text3)", border: "0.5px solid var(--border)", flexShrink: 0 }}>
                    {TYPE_LABELS[q.type]}
                  </span>
                  {/* Reorder */}
                  <div style={{ display: "flex", gap: "2px", flexShrink: 0 }}>
                    <button onClick={() => moveQ(i, -1)} disabled={i === 0} style={{ width: "26px", height: "26px", borderRadius: "6px", border: "0.5px solid var(--border)", background: "transparent", color: i === 0 ? "var(--text3)" : "var(--text2)", cursor: i === 0 ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", opacity: i === 0 ? 0.4 : 1 }}>
                      <svg width="11" height="11" viewBox="0 0 11 11" fill="none"><path d="M2 7l3.5-4L9 7" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </button>
                    <button onClick={() => moveQ(i, 1)} disabled={i === qs.length - 1} style={{ width: "26px", height: "26px", borderRadius: "6px", border: "0.5px solid var(--border)", background: "transparent", color: i === qs.length - 1 ? "var(--text3)" : "var(--text2)", cursor: i === qs.length - 1 ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", opacity: i === qs.length - 1 ? 0.4 : 1 }}>
                      <svg width="11" height="11" viewBox="0 0 11 11" fill="none"><path d="M2 4l3.5 4L9 4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </button>
                  </div>
                  {/* Delete */}
                  <button onClick={() => removeQ(i)} style={{ width: "26px", height: "26px", borderRadius: "6px", border: "0.5px solid var(--border)", background: "transparent", color: "var(--error)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}
                    onMouseEnter={e => (e.currentTarget.style.background = "var(--error-bg)")}
                    onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                    <svg width="11" height="11" viewBox="0 0 11 11" fill="none"><path d="M2 2l7 7M9 2l-7 7" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>
                  </button>
                </div>

                {/* Card body */}
                <div style={{ padding: "16px" }}>

                  {/* Question text */}
                  <div style={{ marginBottom: "14px" }}>
                    <label style={{ fontSize: "10px", color: "var(--text3)", textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: "6px", fontWeight: 500 }}>Intitulé de la question</label>
                    <textarea value={q.question} rows={2} onChange={e => updateQ(i, { question: e.target.value })}
                      placeholder="Ex : Quel type de projet avez-vous ?"
                      style={{ ...inputBase, resize: "vertical" }} />
                  </div>

                  {/* Type selector */}
                  <div style={{ marginBottom: q.type !== "text" ? "14px" : "0" }}>
                    <label style={{ fontSize: "10px", color: "var(--text3)", textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: "8px", fontWeight: 500 }}>Type de réponse</label>
                    <div style={{ display: "flex", gap: "6px" }}>
                      {(["single", "multi", "text"] as QType[]).map(t => (
                        <button key={t} onClick={() => updateQ(i, { type: t, choices: t === "text" ? [] : (q.choices.length ? q.choices : [""]) })}
                          style={{ padding: "6px 14px", borderRadius: "7px", fontSize: "12px", fontWeight: 500, cursor: "pointer", fontFamily: "inherit", background: q.type === t ? "var(--accent-bg)" : "transparent", color: q.type === t ? "var(--accent-light)" : "var(--text3)", border: q.type === t ? "0.5px solid rgba(127,119,221,0.4)" : "0.5px solid var(--border)", transition: "all 100ms" }}>
                          {TYPE_LABELS[t]}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Choices (single / multi) */}
                  {q.type !== "text" && (
                    <div>
                      <label style={{ fontSize: "10px", color: "var(--text3)", textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: "8px", fontWeight: 500 }}>Réponses possibles</label>
                      <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginBottom: "8px" }}>
                        {q.choices.map((c, ci) => (
                          <div key={ci} style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                            <div style={{ width: q.type === "single" ? "14px" : "12px", height: q.type === "single" ? "14px" : "12px", borderRadius: q.type === "single" ? "50%" : "3px", border: "1.5px solid var(--border)", flexShrink: 0 }} />
                            <input value={c} onChange={e => updateChoice(i, ci, e.target.value)}
                              placeholder={`Réponse ${ci + 1}`}
                              style={{ ...inputBase, flex: 1 }} />
                            <button onClick={() => removeChoice(i, ci)} disabled={q.choices.length <= 1}
                              style={{ width: "28px", height: "28px", flexShrink: 0, borderRadius: "6px", border: "0.5px solid var(--border)", background: "transparent", color: q.choices.length <= 1 ? "var(--text3)" : "var(--error)", cursor: q.choices.length <= 1 ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", opacity: q.choices.length <= 1 ? 0.3 : 1 }}>
                              <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M1.5 1.5l7 7M8.5 1.5l-7 7" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>
                            </button>
                          </div>
                        ))}
                      </div>
                      <button onClick={() => addChoice(i)}
                        style={{ fontSize: "12px", color: "var(--accent-light)", background: "transparent", border: "none", cursor: "pointer", padding: 0, fontFamily: "inherit", display: "flex", alignItems: "center", gap: "5px" }}>
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M6 1v10M1 6h10" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>
                        Ajouter une réponse
                      </button>
                    </div>
                  )}

                  {/* Placeholder for text type */}
                  {q.type === "text" && (
                    <div>
                      <label style={{ fontSize: "10px", color: "var(--text3)", textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: "6px", fontWeight: 500 }}>Texte d'aide (placeholder)</label>
                      <input value={q.placeholder ?? ""} onChange={e => updateQ(i, { placeholder: e.target.value })}
                        placeholder="Ex : Décrivez votre projet..."
                        style={inputBase} />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Add question */}
        {mounted && (
          <button onClick={addQ}
            style={{ width: "100%", padding: "12px", borderRadius: "12px", border: "0.5px dashed var(--border)", background: "transparent", color: "var(--text3)", fontSize: "13px", fontWeight: 500, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", transition: "all 100ms", marginBottom: "40px" }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--accent)"; e.currentTarget.style.color = "var(--accent-light)"; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.color = "var(--text3)"; }}>
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M6.5 1v11M1 6.5h11" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>
            Ajouter une question
          </button>
        )}
      </main>
    </div>
  );
}
