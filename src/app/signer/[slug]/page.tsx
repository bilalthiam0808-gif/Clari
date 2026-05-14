"use client";

import { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";

type SignData = {
  clientName: string;
  clientEmail: string;
  serviceName: string;
  status: string;
  totalEstime: number | null;
  selectedService: string;
  signatureName: string | null;
  signedAt: string | null;
};

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleString("fr-FR", {
    day: "2-digit", month: "long", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

export default function SignerPage() {
  const { slug } = useParams<{ slug: string }>();

  const [data, setData] = useState<SignData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [signing, setSigning] = useState(false);
  const [signed, setSigned] = useState(false);
  const [signedAt, setSignedAt] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch(`/api/sign/${slug}`)
      .then(r => r.ok ? r.json() : r.json().then((e: { error: string }) => Promise.reject(e.error)))
      .then((d: SignData) => {
        setData(d);
        if (d.status === "Signé") {
          setSigned(true);
          setSignedAt(d.signedAt);
          setName(d.signatureName ?? "");
        }
      })
      .catch((msg: string) => setError(msg ?? "Lien introuvable"));
  }, [slug]);

  async function handleSign() {
    if (!name.trim()) { inputRef.current?.focus(); return; }
    setSigning(true);
    try {
      const res = await fetch(`/api/sign/${slug}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ signatureName: name.trim() }),
      });
      const json = await res.json();
      if (!res.ok) { setError(json.error ?? "Erreur lors de la signature"); return; }
      setSigned(true);
      setSignedAt(json.signedAt);
    } finally {
      setSigning(false);
    }
  }

  const container: React.CSSProperties = {
    minHeight: "100vh",
    background: "#0F0F0F",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "24px 16px",
    fontFamily: "Inter, -apple-system, sans-serif",
  };

  const card: React.CSSProperties = {
    background: "#161616",
    border: "0.5px solid #2A2A2A",
    borderRadius: "20px",
    padding: "40px",
    width: "100%",
    maxWidth: "480px",
    boxShadow: "0 24px 64px rgba(0,0,0,0.5)",
  };

  if (error) return (
    <div style={container}>
      <div style={{ ...card, textAlign: "center" }}>
        <div style={{ width: "48px", height: "48px", borderRadius: "50%", background: "rgba(226,75,74,0.12)", border: "0.5px solid rgba(226,75,74,0.3)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <circle cx="10" cy="10" r="8" stroke="#E24B4A" strokeWidth="1.3"/>
            <path d="M10 6v5M10 13.5v.5" stroke="#E24B4A" strokeWidth="1.4" strokeLinecap="round"/>
          </svg>
        </div>
        <p style={{ fontSize: "15px", fontWeight: 600, color: "#fff", marginBottom: "8px" }}>Lien non disponible</p>
        <p style={{ fontSize: "13px", color: "#666" }}>{error}</p>
      </div>
    </div>
  );

  if (!data) return (
    <div style={container}>
      <div style={{ width: "28px", height: "28px", border: "2px solid #2A2A2A", borderTopColor: "#1D9E75", borderRadius: "50%", animation: "spin 0.65s linear infinite" }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  const amount = data.totalEstime;

  return (
    <div style={container}>
      <div style={card}>

        {/* Logo / brand */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "32px" }}>
          <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: "linear-gradient(135deg, #1D9E75, #15785A)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M3 8.5l3 3 7-7" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <span style={{ fontSize: "14px", fontWeight: 600, color: "#fff", letterSpacing: "-0.01em" }}>Clari</span>
        </div>

        {signed ? (
          /* ── État signé ── */
          <div style={{ textAlign: "center" }}>
            <div style={{ width: "64px", height: "64px", borderRadius: "50%", background: "rgba(29,158,117,0.12)", border: "1px solid rgba(29,158,117,0.4)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px" }}>
              <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                <path d="M5 14l6 6 12-12" stroke="#1D9E75" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h2 style={{ fontSize: "20px", fontWeight: 700, color: "#fff", marginBottom: "8px" }}>Devis signé ✓</h2>
            <p style={{ fontSize: "13px", color: "#888", marginBottom: "28px" }}>Merci {data.clientName} — votre acceptation a bien été enregistrée.</p>

            <div style={{ background: "rgba(29,158,117,0.07)", border: "0.5px solid rgba(29,158,117,0.25)", borderRadius: "12px", padding: "18px 20px", textAlign: "left" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}>
                <span style={{ fontSize: "12px", color: "#666" }}>Prestation</span>
                <span style={{ fontSize: "12px", fontWeight: 600, color: "#ccc" }}>{data.selectedService}</span>
              </div>
              {amount !== null && (
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}>
                  <span style={{ fontSize: "12px", color: "#666" }}>Montant</span>
                  <span style={{ fontSize: "13px", fontWeight: 700, color: "#1D9E75" }}>{amount.toLocaleString("fr-FR")} €</span>
                </div>
              )}
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}>
                <span style={{ fontSize: "12px", color: "#666" }}>Signé par</span>
                <span style={{ fontSize: "12px", fontWeight: 600, color: "#ccc" }}>{name}</span>
              </div>
              {signedAt && (
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontSize: "12px", color: "#666" }}>Le</span>
                  <span style={{ fontSize: "12px", color: "#888" }}>{fmtDate(signedAt)}</span>
                </div>
              )}
            </div>

            <p style={{ fontSize: "12px", color: "#555", marginTop: "20px" }}>
              Un email de confirmation a été envoyé à {data.clientEmail}
            </p>
          </div>
        ) : (
          /* ── Formulaire de signature ── */
          <>
            <h1 style={{ fontSize: "22px", fontWeight: 700, color: "#fff", marginBottom: "6px", letterSpacing: "-0.02em" }}>
              Signature du devis
            </h1>
            <p style={{ fontSize: "14px", color: "#888", marginBottom: "28px" }}>
              Bonjour {data.clientName}, veuillez lire et signer votre devis ci-dessous.
            </p>

            {/* Récapitulatif devis */}
            <div style={{ background: "#1A1A1A", border: "0.5px solid #2A2A2A", borderRadius: "12px", padding: "20px", marginBottom: "24px" }}>
              <div style={{ fontSize: "10px", fontWeight: 600, color: "#555", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "14px" }}>Récapitulatif</div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
                <div>
                  <div style={{ fontSize: "15px", fontWeight: 600, color: "#fff", marginBottom: "2px" }}>{data.selectedService}</div>
                  <div style={{ fontSize: "12px", color: "#666" }}>{data.clientEmail}</div>
                </div>
                {amount !== null && (
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: "10px", color: "#555", marginBottom: "2px" }}>Total estimé</div>
                    <div style={{ fontSize: "22px", fontWeight: 700, color: "#1D9E75", letterSpacing: "-0.02em" }}>
                      {amount.toLocaleString("fr-FR")} €
                    </div>
                  </div>
                )}
              </div>

              <div style={{ borderTop: "0.5px solid #2A2A2A", paddingTop: "12px", fontSize: "12px", color: "#555", lineHeight: 1.6 }}>
                En signant ce document, j&apos;accepte les termes du devis et m&apos;engage à donner suite à cette prestation.
              </div>
            </div>

            {/* Champ nom */}
            <div style={{ marginBottom: "16px" }}>
              <label style={{ display: "block", fontSize: "12px", fontWeight: 500, color: "#888", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                Votre nom complet *
              </label>
              <input
                ref={inputRef}
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleSign()}
                placeholder="Prénom Nom"
                style={{
                  width: "100%",
                  background: "#1A1A1A",
                  border: "0.5px solid #333",
                  borderRadius: "10px",
                  padding: "12px 16px",
                  fontSize: "15px",
                  color: "#fff",
                  fontFamily: "inherit",
                  outline: "none",
                  boxSizing: "border-box",
                  transition: "border-color 150ms",
                }}
                onFocus={e => (e.currentTarget.style.borderColor = "rgba(29,158,117,0.6)")}
                onBlur={e => (e.currentTarget.style.borderColor = "#333")}
              />
              <p style={{ fontSize: "11px", color: "#555", marginTop: "6px" }}>
                Ce nom sera enregistré comme preuve d&apos;acceptation électronique.
              </p>
            </div>

            {/* Bouton signer */}
            <button
              onClick={handleSign}
              disabled={signing || !name.trim()}
              style={{
                width: "100%",
                padding: "14px 24px",
                borderRadius: "12px",
                fontSize: "14px",
                fontWeight: 600,
                fontFamily: "inherit",
                cursor: signing || !name.trim() ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "10px",
                background: signing || !name.trim()
                  ? "rgba(29,158,117,0.15)"
                  : "linear-gradient(135deg, #1D9E75 0%, #15785A 100%)",
                color: signing || !name.trim() ? "#1D9E75" : "#fff",
                border: "none",
                boxShadow: signing || !name.trim() ? "none" : "0 4px 20px rgba(29,158,117,0.3)",
                transition: "all 150ms",
                opacity: !name.trim() ? 0.5 : 1,
              }}
            >
              {signing ? (
                <>
                  <div style={{ width: "16px", height: "16px", border: "2px solid #1D9E75", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.65s linear infinite" }} />
                  Signature en cours…
                </>
              ) : (
                <>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M2 8.5l4 4 8-8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Signer et accepter le devis
                </>
              )}
            </button>

            <p style={{ fontSize: "11px", color: "#444", textAlign: "center", marginTop: "16px" }}>
              Signature électronique — Clari · {data.clientEmail}
            </p>
          </>
        )}
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
