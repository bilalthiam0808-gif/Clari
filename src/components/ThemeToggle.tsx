"use client";

import { Theme } from "@/hooks/useTheme";

type Props = {
  theme: Theme;
  onToggle: () => void;
};

export default function ThemeToggle({ theme, onToggle }: Props) {
  return (
    <button
      onClick={onToggle}
      title={theme === "dark" ? "Passer en mode clair" : "Passer en mode sombre"}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: "32px",
        height: "32px",
        borderRadius: "8px",
        border: "0.5px solid var(--border)",
        background: "transparent",
        color: "var(--text3)",
        cursor: "pointer",
        flexShrink: 0,
        transition: "color 100ms, border-color 100ms",
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLButtonElement).style.color = "var(--text2)";
        (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--border-hover)";
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLButtonElement).style.color = "var(--text3)";
        (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--border)";
      }}
    >
      {theme === "dark" ? (
        /* Sun icon */
        <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
          <circle cx="7.5" cy="7.5" r="2.5" stroke="currentColor" strokeWidth="1.2"/>
          <path d="M7.5 1v1.5M7.5 12.5V14M1 7.5h1.5M12.5 7.5H14M2.9 2.9l1.1 1.1M11 11l1.1 1.1M11 2.9l-1.1 1.1M4 11l-1.1 1.1" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
        </svg>
      ) : (
        /* Moon icon */
        <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
          <path d="M7.5 1.875a3.75 3.75 0 0 0 5.625 5.625 5.625 5.625 0 1 1-5.625-5.625Z" fill="currentColor"/>
        </svg>
      )}
    </button>
  );
}
