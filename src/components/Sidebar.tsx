"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";

const navItems = [
  {
    label: "Dashboard",
    href: "/",
    icon: (
      <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
        <rect x="1" y="1" width="5.5" height="5.5" rx="1.5" stroke="currentColor" strokeWidth="1.2"/>
        <rect x="8.5" y="1" width="5.5" height="5.5" rx="1.5" stroke="currentColor" strokeWidth="1.2"/>
        <rect x="1" y="8.5" width="5.5" height="5.5" rx="1.5" stroke="currentColor" strokeWidth="1.2"/>
        <rect x="8.5" y="8.5" width="5.5" height="5.5" rx="1.5" stroke="currentColor" strokeWidth="1.2"/>
      </svg>
    ),
  },
  {
    label: "Mes services",
    href: "/services",
    icon: (
      <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
        <path d="M2 4h11M2 7.5h11M2 11h7" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    label: "Projets",
    href: "/projets",
    icon: (
      <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
        <rect x="1" y="1" width="13" height="13" rx="2" stroke="currentColor" strokeWidth="1.2"/>
        <path d="M4 7.5h7M7.5 4v7" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    label: "Briefs",
    href: "/briefs",
    icon: (
      <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
        <path d="M2 3.5h11M2 7.5h11M2 11.5h6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
        <circle cx="12" cy="11.5" r="2" stroke="currentColor" strokeWidth="1.2"/>
      </svg>
    ),
  },
];

const logoutIcon = (
  <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
    <path d="M5.5 2H3a1 1 0 00-1 1v9a1 1 0 001 1h2.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
    <path d="M10 10l3-2.5L10 5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M13 7.5H6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
  </svg>
);

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [newBriefs, setNewBriefs] = useState(0);

  useEffect(() => {
    fetch("/api/projects")
      .then(r => r.ok ? r.json() : [])
      .then(data => {
        if (Array.isArray(data)) {
          setNewBriefs(data.filter(p => p.briefData && p.status === "Brief reçu").length);
        }
      })
      .catch(() => {});
  }, [pathname]);

  async function logout() {
    await fetch("/api/auth/login", { method: "DELETE" });
    router.push("/login");
  }

  return (
    <>
      {/* ── Desktop sidebar ── */}
      <aside
        className="sidebar-desktop"
        style={{
          width: "220px",
          background: "#111111",
          borderRight: "0.5px solid var(--border)",
          flexDirection: "column",
          padding: "20px 0",
          flexShrink: 0,
          height: "100vh",
          position: "sticky",
          top: 0,
        }}
      >
        {/* Logo */}
        <div style={{ padding: "0 16px 20px", borderBottom: "0.5px solid var(--border)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{
              width: "30px", height: "30px",
              background: "var(--accent)",
              borderRadius: "8px",
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0,
            }}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M3 8h10M8 4l4 4-4 4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <span style={{ fontSize: "16px", fontWeight: 600, color: "var(--text)" }}>Clari</span>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ padding: "14px 10px", flex: 1, display: "flex", flexDirection: "column", gap: "2px" }}>
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  padding: "8px 14px",
                  borderRadius: "8px",
                  cursor: "pointer",
                  background: isActive ? "var(--surface)" : "transparent",
                  border: isActive ? "0.5px solid var(--border)" : "0.5px solid transparent",
                  color: isActive ? "var(--text)" : "var(--text2)",
                  fontSize: "13px",
                  fontWeight: isActive ? 500 : 400,
                  textDecoration: "none",
                  transition: "all 100ms ease",
                }}
              >
                {item.icon}
                <span style={{ flex: 1 }}>{item.label === "Briefs" ? "Briefs reçus" : item.label}</span>
                {item.href === "/briefs" && newBriefs > 0 && (
                  <span style={{
                    minWidth: "18px", height: "18px",
                    background: "var(--accent)",
                    color: "#fff",
                    borderRadius: "9px",
                    fontSize: "10px",
                    fontWeight: 700,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    padding: "0 5px",
                    flexShrink: 0,
                  }}>
                    {newBriefs}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Plan */}
        <div style={{ padding: "0 12px" }}>
          <div style={{
            background: "var(--accent-bg)",
            border: "0.5px solid rgba(127,119,221,0.3)",
            borderRadius: "8px",
            padding: "10px 12px",
          }}>
            <div style={{ fontSize: "11px", color: "var(--accent-light)", fontWeight: 500, marginBottom: "2px" }}>
              Plan Gratuit
            </div>
            <div style={{ fontSize: "11px", color: "var(--text3)" }}>1/3 projets ce mois</div>
          </div>

          {/* Logout */}
          <button
            onClick={logout}
            style={{
              display: "flex", alignItems: "center", gap: "10px",
              width: "100%", padding: "8px 14px", marginTop: "6px",
              borderRadius: "8px", cursor: "pointer",
              background: "transparent", border: "0.5px solid transparent",
              color: "var(--text3)", fontSize: "13px",
              fontFamily: "inherit", transition: "color 100ms",
            }}
            onMouseEnter={e => (e.currentTarget.style.color = "var(--text2)")}
            onMouseLeave={e => (e.currentTarget.style.color = "var(--text3)")}
          >
            {logoutIcon}
            Déconnexion
          </button>
        </div>
      </aside>

      {/* ── Mobile bottom nav ── */}
      <nav className="bottom-nav">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "4px",
                padding: "6px 12px",
                borderRadius: "8px",
                textDecoration: "none",
                color: isActive ? "var(--accent-light)" : "var(--text3)",
                transition: "color 100ms",
                minWidth: "56px",
                position: "relative",
              }}
            >
              <span style={{ color: isActive ? "var(--accent)" : "var(--text3)", position: "relative" }}>
                {item.icon}
                {item.href === "/briefs" && newBriefs > 0 && (
                  <span style={{
                    position: "absolute", top: "-4px", right: "-6px",
                    minWidth: "14px", height: "14px",
                    background: "var(--accent)",
                    color: "#fff",
                    borderRadius: "7px",
                    fontSize: "8px", fontWeight: 700,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    padding: "0 3px",
                  }}>
                    {newBriefs}
                  </span>
                )}
              </span>
              <span style={{ fontSize: "10px", fontWeight: isActive ? 500 : 400, letterSpacing: "0.02em" }}>
                {item.label}
              </span>
            </Link>
          );
        })}

        {/* Logout mobile */}
        <button
          onClick={logout}
          style={{
            display: "flex", flexDirection: "column", alignItems: "center", gap: "4px",
            padding: "6px 12px", borderRadius: "8px",
            background: "none", border: "none",
            color: "var(--text3)", cursor: "pointer",
            minWidth: "56px", fontFamily: "inherit",
          }}
        >
          {logoutIcon}
          <span style={{ fontSize: "10px", letterSpacing: "0.02em" }}>Sortir</span>
        </button>
      </nav>
    </>
  );
}
