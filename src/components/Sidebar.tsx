"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

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

export default function Sidebar() {
  const pathname = usePathname();

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
                {item.label === "Briefs" ? "Briefs reçus" : item.label}
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
                padding: "6px 16px",
                borderRadius: "8px",
                textDecoration: "none",
                color: isActive ? "var(--accent-light)" : "var(--text3)",
                transition: "color 100ms",
                minWidth: "60px",
              }}
            >
              <span style={{ color: isActive ? "var(--accent)" : "var(--text3)" }}>
                {item.icon}
              </span>
              <span style={{ fontSize: "10px", fontWeight: isActive ? 500 : 400, letterSpacing: "0.02em" }}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
