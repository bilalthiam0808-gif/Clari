"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      if (res.ok) {
        router.push("/");
        router.refresh();
      } else {
        const data = await res.json();
        setError(data.error || "Accès refusé");
      }
    } catch {
      setError("Erreur de connexion. Réessayez.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      minHeight: "100vh",
      background: "#0F0F0F",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "24px",
      fontFamily: "inherit",
    }}>
      <div style={{ width: "100%", maxWidth: "360px" }}>

        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "48px", justifyContent: "center" }}>
          <div style={{ width: "32px", height: "32px", background: "#7F77DD", borderRadius: "9px", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="17" height="17" viewBox="0 0 17 17" fill="none">
              <path d="M2.5 8.5h12M8.5 3.5l5 5-5 5" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <span style={{ fontSize: "18px", fontWeight: 700, color: "#FFF", letterSpacing: "-0.02em" }}>Clari</span>
        </div>

        {/* Card */}
        <div style={{
          background: "#1A1A1A",
          border: "0.5px solid #2A2A2A",
          borderRadius: "16px",
          padding: "32px",
        }}>
          <h1 style={{ fontSize: "18px", fontWeight: 600, color: "#FFF", marginBottom: "6px", textAlign: "center" }}>
            Accès privé
          </h1>
          <p style={{ fontSize: "13px", color: "#666", textAlign: "center", marginBottom: "28px" }}>
            Entrez votre mot de passe pour accéder à Clari.
          </p>

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              autoFocus
              style={{
                background: "#111",
                border: `0.5px solid ${error ? "#E05858" : "#333"}`,
                borderRadius: "10px",
                padding: "12px 16px",
                fontSize: "15px",
                color: "#FFF",
                outline: "none",
                fontFamily: "inherit",
                width: "100%",
                letterSpacing: "0.1em",
              }}
            />

            {error && (
              <div style={{ fontSize: "12px", color: "#E05858", textAlign: "center", padding: "6px 0" }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !password}
              style={{
                background: loading || !password ? "#2A2A2A" : "#7F77DD",
                color: loading || !password ? "#555" : "#FFF",
                border: "none",
                borderRadius: "10px",
                padding: "13px",
                fontSize: "14px",
                fontWeight: 600,
                cursor: loading || !password ? "not-allowed" : "pointer",
                fontFamily: "inherit",
                transition: "all 150ms",
                marginTop: "4px",
              }}
            >
              {loading ? "Vérification..." : "Accéder →"}
            </button>
          </form>
        </div>

        <p style={{ fontSize: "11px", color: "#333", textAlign: "center", marginTop: "24px" }}>
          Propulsé par <span style={{ color: "#7F77DD" }}>Clari</span>
        </p>
      </div>
    </div>
  );
}
