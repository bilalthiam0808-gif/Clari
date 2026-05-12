"use client";

import { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";

type Option = {
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
  description: string;
  options: Option[];
};

// ─── Couleurs par catégorie ───────────────────────────────────────────────────

const DEFAULT_CATEGORY_COLORS: Record<string, { bg: string; color: string }> = {
  "Graphisme":     { bg: "#1A1A2E", color: "#CECBF6" },
  "Motion Design": { bg: "#1A0D2E", color: "#C4B8F0" },
  "Site web":      { bg: "#0A1A12", color: "#9FE1CB" },
};

// Palette pour les catégories personnalisées
const EXTRA_COLORS: { bg: string; color: string }[] = [
  { bg: "#0A1218", color: "#78C5E0" },  // Bleu ciel
  { bg: "#1A0A0A", color: "#E08888" },  // Rose / rouge
  { bg: "#100A1A", color: "#C488E0" },  // Mauve
  { bg: "#0A1A10", color: "#78E0A8" },  // Vert menthe
  { bg: "#1A1200", color: "#E0C678" },  // Doré
  { bg: "#0A1015", color: "#78B4E0" },  // Bleu acier
];

function getCategoryColor(category: string, allCategories: string[]): { bg: string; color: string } {
  if (DEFAULT_CATEGORY_COLORS[category]) return DEFAULT_CATEGORY_COLORS[category];
  const customIndex = allCategories.filter(c => !DEFAULT_CATEGORY_COLORS[c]).indexOf(category);
  return EXTRA_COLORS[customIndex % EXTRA_COLORS.length] || { bg: "#1A1A1A", color: "#888888" };
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const DEFAULT_CATEGORIES = ["Graphisme", "Motion Design", "Site web"];

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [customCategories, setCustomCategories] = useState<string[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    fetch("/api/services")
      .then(r => r.json())
      .then((parsed: Service[]) => {
        if (Array.isArray(parsed) && parsed.length > 0) {
          setServices(parsed);
          const usedCustom = [...new Set(parsed.map((s: Service) => s.category))]
            .filter((c) => !DEFAULT_CATEGORIES.includes(c as string)) as string[];
          setCustomCategories(usedCustom);
        }
      })
      .finally(() => setMounted(true));
  }, []);

  // ─── Formulaire modal ───────────────────────────────────────────────────────

  const [name, setName] = useState("");
  const [category, setCategory] = useState<string>("Graphisme");
  const [showNewCatInput, setShowNewCatInput] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [basePrice, setBasePrice] = useState("");
  const [description, setDescription] = useState("");
  const [options, setOptions] = useState<Option[]>([{ id: "1", label: "", price: "", isPercent: false }]);

  const allCategories = [...DEFAULT_CATEGORIES, ...customCategories];

  function addCustomCategory() {
    const trimmed = newCatName.trim();
    if (!trimmed || allCategories.includes(trimmed)) return;
    const updated = [...customCategories, trimmed];
    setCustomCategories(updated);
    setCategory(trimmed);
    setNewCatName("");
    setShowNewCatInput(false);
  }

  function openCreateModal() {
    setEditingId(null);
    setName(""); setCategory("Graphisme"); setBasePrice(""); setDescription("");
    setOptions([{ id: "1", label: "", price: "", isPercent: false }]);
    setShowNewCatInput(false); setNewCatName("");
    setShowModal(true);
  }

  function openEditModal(service: Service) {
    setEditingId(service.id);
    setName(service.name); setCategory(service.category);
    setBasePrice(service.basePrice); setDescription(service.description);
    setOptions(service.options.length > 0 ? service.options : [{ id: "1", label: "", price: "", isPercent: false }]);
    setShowNewCatInput(false); setNewCatName("");
    setShowModal(true);
  }

  function addOption() {
    setOptions([...options, { id: Date.now().toString(), label: "", price: "", isPercent: false }]);
  }

  function removeOption(id: string) {
    setOptions(options.filter((o) => o.id !== id));
  }

  function updateOption(id: string, field: "label" | "price" | "isPercent", value: string | boolean) {
    setOptions(options.map((o) => (o.id === id ? { ...o, [field]: value } : o)));
  }

  async function saveService() {
    if (!name || !basePrice) return;
    const filteredOptions = options.filter((o) => o.label && o.price);

    if (editingId) {
      const body = { name, category, basePrice, description, options: filteredOptions };
      const res = await fetch(`/api/services/${editingId}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      if (res.ok) {
        const updated = await res.json();
        setServices(prev => prev.map(s => s.id === editingId ? updated : s));
      }
    } else {
      const body = { id: Date.now().toString(), name, category, basePrice, description, options: filteredOptions };
      const res = await fetch("/api/services", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      if (res.ok) {
        const created = await res.json();
        setServices(prev => [...prev, created]);
      }
    }
    closeModal();
  }

  function closeModal() { setShowModal(false); setEditingId(null); }

  async function deleteService(id: string) {
    setServices(prev => prev.filter(s => s.id !== id));
    await fetch(`/api/services/${id}`, { method: "DELETE" });
  }

  async function resetToDefault() {
    if (!confirm("Remettre le catalogue par défaut ? Tes modifications seront perdues.")) return;
    const res = await fetch("/api/services/reset", { method: "POST" });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) setServices(data);
    }
  }

  // ─── Styles ─────────────────────────────────────────────────────────────────

  const inputStyle = {
    background: "var(--surface)", border: "0.5px solid var(--border)",
    borderRadius: "8px", padding: "10px 14px",
    fontSize: "13px", color: "var(--text)", width: "100%",
    outline: "none", fontFamily: "inherit",
  };

  const labelStyle = {
    fontSize: "11px", color: "var(--text2)", textTransform: "uppercase" as const,
    letterSpacing: "0.06em", marginBottom: "6px", display: "block", fontWeight: 500,
  };

  // ─── Grouper par catégorie ───────────────────────────────────────────────────

  // Toutes les catégories présentes dans les services (dans l'ordre : défaut puis custom)
  const usedCategories = allCategories.filter(cat => services.some(s => s.category === cat));
  const grouped = usedCategories.reduce((acc, cat) => {
    acc[cat] = services.filter((s) => s.category === cat);
    return acc;
  }, {} as Record<string, Service[]>);

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden", background: "var(--bg)" }}>
      <Sidebar />

      <main className="admin-main" style={{ flex: 1, overflow: "auto", padding: "28px 32px" }}>

        {/* Header */}
        <div className="services-header" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "28px" }}>
          <div>
            <h1 style={{ fontSize: "20px", fontWeight: 600, color: "var(--text)", marginBottom: "2px" }}>Mes services</h1>
            <p style={{ fontSize: "13px", color: "var(--text2)" }}>
              {services.length} prestation{services.length > 1 ? "s" : ""} configurée{services.length > 1 ? "s" : ""} — modifiable à tout moment.
            </p>
          </div>
          <div className="services-header-btns" style={{ display: "flex", gap: "8px" }}>
            <button
              onClick={resetToDefault}
              style={{
                background: "transparent", color: "var(--text3)",
                border: "0.5px solid var(--border)", borderRadius: "10px",
                padding: "9px 14px", fontSize: "12px", cursor: "pointer", fontFamily: "inherit",
              }}
            >
              Réinitialiser le catalogue
            </button>
            <button
              onClick={openCreateModal}
              style={{
                background: "var(--accent)", color: "#fff", border: "none",
                borderRadius: "10px", padding: "9px 18px",
                fontSize: "13px", fontWeight: 500, cursor: "pointer", fontFamily: "inherit",
              }}
            >
              + Nouveau service
            </button>
          </div>
        </div>

        {/* Groupes par catégorie */}
        {usedCategories.map((cat) => {
          const catServices = grouped[cat] || [];
          const col = getCategoryColor(cat, allCategories);
          if (catServices.length === 0) return null;
          return (
            <div key={cat} style={{ marginBottom: "32px" }}>
              {/* En-tête catégorie */}
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
                <span style={{ fontSize: "11px", fontWeight: 600, padding: "3px 10px", borderRadius: "6px", background: col.bg, color: col.color }}>
                  {cat}
                </span>
                <span style={{ fontSize: "11px", color: "var(--text3)" }}>{catServices.length} prestation{catServices.length > 1 ? "s" : ""}</span>
              </div>

              {/* Grille */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "10px" }}>
                {catServices.map((service) => {
                  const isExpanded = expandedId === service.id;
                  const regularOpts = service.options.filter(o => !o.isPercent);
                  const delayOpts = service.options.filter(o => o.isPercent);
                  return (
                    <div key={service.id} style={{
                      background: "var(--surface)", border: "0.5px solid var(--border)",
                      borderRadius: "12px", padding: "18px 20px",
                    }}>
                      {/* Actions */}
                      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "10px" }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: "15px", fontWeight: 500, color: "var(--text)", marginBottom: "3px" }}>{service.name}</div>
                          {service.description && (
                            <div style={{ fontSize: "12px", color: "var(--text2)", lineHeight: 1.4 }}>{service.description}</div>
                          )}
                        </div>
                        <div style={{ display: "flex", gap: "4px", marginLeft: "10px", flexShrink: 0 }}>
                          <button onClick={() => openEditModal(service)} title="Modifier"
                            style={{ background: "none", border: "0.5px solid var(--border)", borderRadius: "6px", cursor: "pointer", color: "var(--text2)", padding: "4px 8px", fontSize: "11px", fontFamily: "inherit", display: "flex", alignItems: "center", gap: "4px" }}>
                            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                              <path d="M8.5 1.5L10.5 3.5L4 10H2v-2L8.5 1.5Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
                            </svg>
                            Modifier
                          </button>
                          <button onClick={() => deleteService(service.id)} title="Supprimer"
                            style={{ background: "none", border: "0.5px solid transparent", borderRadius: "6px", cursor: "pointer", color: "var(--text3)", padding: "4px 6px", fontSize: "15px", lineHeight: 1 }}>
                            ×
                          </button>
                        </div>
                      </div>

                      {/* Prix de base */}
                      <div style={{ background: "var(--surface2)", borderRadius: "8px", padding: "10px 14px", marginBottom: "10px" }}>
                        <div style={{ fontSize: "11px", color: "var(--text3)", marginBottom: "2px" }}>Prix de base</div>
                        <div style={{ fontSize: "18px", fontWeight: 600, color: "var(--text)" }}>
                          {parseFloat(service.basePrice).toLocaleString("fr-FR")} €
                        </div>
                      </div>

                      {/* Options — accordéon */}
                      {service.options.length > 0 && (
                        <div>
                          <button
                            onClick={() => setExpandedId(isExpanded ? null : service.id)}
                            style={{ background: "none", border: "none", color: "var(--text3)", cursor: "pointer", fontSize: "11px", padding: "0", fontFamily: "inherit", display: "flex", alignItems: "center", gap: "4px", marginBottom: isExpanded ? "8px" : "0" }}
                          >
                            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" style={{ transform: isExpanded ? "rotate(90deg)" : "none", transition: "transform 150ms" }}>
                              <path d="M3 2l4 3-4 3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                            {isExpanded ? "Masquer" : `Voir ${service.options.length} option${service.options.length > 1 ? "s" : ""}`}
                          </button>

                          {isExpanded && (
                            <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                              {regularOpts.map((opt) => (
                                <div key={opt.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "5px 10px", border: "0.5px solid var(--border)", borderRadius: "6px", fontSize: "12px" }}>
                                  <span style={{ color: "var(--text2)" }}>{opt.label}</span>
                                  <span style={{ color: "var(--accent)", fontWeight: 500 }}>+{opt.price} €</span>
                                </div>
                              ))}
                              {delayOpts.length > 0 && (
                                <>
                                  <div style={{ fontSize: "10px", color: "var(--text3)", textTransform: "uppercase", letterSpacing: "0.06em", marginTop: "4px", marginBottom: "2px" }}>Délais</div>
                                  {delayOpts.map((opt) => (
                                    <div key={opt.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "5px 10px", border: "0.5px solid rgba(239,159,39,0.2)", borderRadius: "6px", fontSize: "12px", background: "rgba(239,159,39,0.04)" }}>
                                      <span style={{ color: "var(--text2)" }}>{opt.label}</span>
                                      <span style={{ color: "#EF9F27", fontWeight: 500 }}>+{opt.price}%</span>
                                    </div>
                                  ))}
                                </>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}

        {/* Si vraiment vide */}
        {mounted && services.length === 0 && (
          <div style={{ background: "var(--surface)", border: "0.5px solid var(--border)", borderRadius: "12px", padding: "60px 20px", textAlign: "center" }}>
            <p style={{ fontSize: "13px", color: "var(--text2)", marginBottom: "16px" }}>Aucun service. Ajoute ta première prestation.</p>
            <button onClick={openCreateModal} style={{ background: "transparent", color: "var(--accent)", border: "0.5px solid var(--accent)", borderRadius: "10px", padding: "8px 16px", fontSize: "13px", fontWeight: 500, cursor: "pointer", fontFamily: "inherit" }}>
              Créer mon premier service →
            </button>
          </div>
        )}
      </main>

      {/* ── MODAL ──────────────────────────────────────────────────────────────── */}
      {showModal && (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50, padding: "20px" }}>
          <div className="modal-sheet" style={{ background: "var(--surface)", border: "0.5px solid var(--border-hover)", borderRadius: "16px", padding: "28px", width: "100%", maxWidth: "520px", maxHeight: "90vh", overflowY: "auto" }}>

            {/* Header modal */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px" }}>
              <h2 style={{ fontSize: "16px", fontWeight: 600, color: "var(--text)" }}>
                {editingId ? "Modifier le service" : "Nouveau service"}
              </h2>
              <button onClick={closeModal} style={{ background: "none", border: "none", color: "var(--text2)", cursor: "pointer", fontSize: "20px", lineHeight: 1 }}>×</button>
            </div>

            {/* Nom */}
            <div style={{ marginBottom: "16px" }}>
              <label style={labelStyle}>Nom de la prestation</label>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex : Création de logo" style={inputStyle} />
            </div>

            {/* Catégorie */}
            <div style={{ marginBottom: "16px" }}>
              <label style={labelStyle}>Catégorie</label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                {allCategories.map((cat) => {
                  const isSelected = category === cat;
                  const colors = getCategoryColor(cat, allCategories);
                  return (
                    <button key={cat} onClick={() => setCategory(cat)}
                      style={{ padding: "6px 14px", borderRadius: "8px", fontSize: "12px", fontWeight: 500, cursor: "pointer", border: isSelected ? `1.5px solid ${colors.color}` : "0.5px solid var(--border)", background: isSelected ? colors.bg : "transparent", color: isSelected ? colors.color : "var(--text2)", fontFamily: "inherit", transition: "all 100ms" }}>
                      {cat}
                    </button>
                  );
                })}

                {/* Ajouter une catégorie */}
                {showNewCatInput ? (
                  <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                    <input
                      value={newCatName}
                      onChange={(e) => setNewCatName(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") addCustomCategory(); if (e.key === "Escape") { setShowNewCatInput(false); setNewCatName(""); } }}
                      placeholder="Ex : Photographie"
                      autoFocus
                      style={{ background: "var(--surface2)", border: "0.5px solid var(--accent)", borderRadius: "8px", padding: "5px 10px", fontSize: "12px", color: "var(--text)", outline: "none", fontFamily: "inherit", width: "140px" }}
                    />
                    <button onClick={addCustomCategory}
                      style={{ background: "var(--accent)", color: "#fff", border: "none", borderRadius: "7px", padding: "5px 10px", fontSize: "12px", cursor: "pointer", fontFamily: "inherit", fontWeight: 500 }}>
                      OK
                    </button>
                    <button onClick={() => { setShowNewCatInput(false); setNewCatName(""); }}
                      style={{ background: "none", border: "none", color: "var(--text3)", cursor: "pointer", fontSize: "16px", lineHeight: 1, padding: "2px 4px" }}>
                      ×
                    </button>
                  </div>
                ) : (
                  <button onClick={() => setShowNewCatInput(true)}
                    style={{ padding: "5px 12px", borderRadius: "8px", fontSize: "12px", cursor: "pointer", border: "0.5px dashed var(--border-hover)", background: "transparent", color: "var(--text3)", fontFamily: "inherit", display: "flex", alignItems: "center", gap: "4px" }}>
                    <span style={{ fontSize: "14px", lineHeight: 1 }}>+</span> Nouvelle catégorie
                  </button>
                )}
              </div>
            </div>

            {/* Description */}
            <div style={{ marginBottom: "16px" }}>
              <label style={labelStyle}>Description courte <span style={{ color: "var(--text3)", textTransform: "none", letterSpacing: 0 }}>(optionnel)</span></label>
              <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Ex : Logo professionnel avec déclinaisons" style={inputStyle} />
            </div>

            {/* Prix de base */}
            <div style={{ marginBottom: "20px" }}>
              <label style={labelStyle}>Prix de base (€)</label>
              <input value={basePrice} onChange={(e) => setBasePrice(e.target.value)} placeholder="Ex : 300" type="number" style={inputStyle} />
            </div>

            {/* Options */}
            <div style={{ marginBottom: "24px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
                <label style={{ ...labelStyle, marginBottom: 0 }}>Options additionnelles</label>
                <button onClick={addOption} style={{ background: "var(--accent-bg)", color: "var(--accent-light)", border: "0.5px solid rgba(127,119,221,0.4)", borderRadius: "6px", padding: "4px 10px", fontSize: "11px", fontWeight: 500, cursor: "pointer", fontFamily: "inherit" }}>
                  + Ajouter
                </button>
              </div>
              <div style={{ fontSize: "10px", color: "var(--text3)", marginBottom: "8px" }}>
                Active "%" pour les options de délai (Express, Urgent) — le prix sera appliqué en pourcentage du total.
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {options.map((opt) => (
                  <div key={opt.id} style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                    <input value={opt.label} onChange={(e) => updateOption(opt.id, "label", e.target.value)} placeholder="Ex : Version animée du logo" style={{ ...inputStyle, flex: 2 }} />
                    <input value={opt.price} onChange={(e) => updateOption(opt.id, "price", e.target.value)} placeholder="Prix" type="number" style={{ ...inputStyle, flex: "0 0 70px" }} />
                    {/* Toggle % */}
                    <button
                      onClick={() => updateOption(opt.id, "isPercent", !opt.isPercent)}
                      title={opt.isPercent ? "Passer en montant fixe (€)" : "Passer en pourcentage (%)"}
                      style={{
                        flexShrink: 0, width: "34px", height: "34px",
                        borderRadius: "8px", border: `1.5px solid ${opt.isPercent ? "#EF9F27" : "var(--border)"}`,
                        background: opt.isPercent ? "rgba(239,159,39,0.1)" : "transparent",
                        color: opt.isPercent ? "#EF9F27" : "var(--text3)",
                        cursor: "pointer", fontFamily: "inherit",
                        fontSize: "12px", fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center",
                      }}
                    >
                      %
                    </button>
                    <button onClick={() => removeOption(opt.id)} style={{ background: "none", border: "none", color: "var(--text3)", cursor: "pointer", fontSize: "18px", padding: "4px", flexShrink: 0 }}>×</button>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
              <button onClick={closeModal} style={{ background: "transparent", color: "var(--text2)", border: "0.5px solid var(--border)", borderRadius: "10px", padding: "9px 18px", fontSize: "13px", cursor: "pointer", fontFamily: "inherit" }}>
                Annuler
              </button>
              <button onClick={saveService} disabled={!name || !basePrice}
                style={{ background: name && basePrice ? "var(--accent)" : "var(--surface2)", color: name && basePrice ? "#fff" : "var(--text3)", border: "none", borderRadius: "10px", padding: "9px 20px", fontSize: "13px", fontWeight: 500, cursor: name && basePrice ? "pointer" : "not-allowed", fontFamily: "inherit", transition: "all 100ms" }}>
                {editingId ? "Enregistrer les modifications" : "Enregistrer le service"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
