"use client";

import { useState, useEffect } from "react";

type ToastType = "success" | "error" | "info";
type ToastItem = { id: number; message: string; type: ToastType };

export function toast(message: string, type: ToastType = "success") {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("clari:toast", { detail: { message, type } }));
}

const COLORS: Record<ToastType, { text: string; bg: string; border: string }> = {
  success: { text: "#1D9E75", bg: "rgba(29,158,117,0.12)", border: "rgba(29,158,117,0.4)" },
  error:   { text: "#E24B4A", bg: "rgba(226,75,74,0.12)",  border: "rgba(226,75,74,0.4)" },
  info:    { text: "#CECBF6", bg: "rgba(127,119,221,0.12)", border: "rgba(127,119,221,0.4)" },
};

function Icon({ type }: { type: ToastType }) {
  if (type === "success") return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0 }}>
      <circle cx="7" cy="7" r="6" stroke="#1D9E75" strokeWidth="1.2"/>
      <path d="M4 7l2 2 4-4" stroke="#1D9E75" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
  if (type === "error") return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0 }}>
      <circle cx="7" cy="7" r="6" stroke="#E24B4A" strokeWidth="1.2"/>
      <path d="M7 4v3M7 9.5v.5" stroke="#E24B4A" strokeWidth="1.3" strokeLinecap="round"/>
    </svg>
  );
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0 }}>
      <circle cx="7" cy="7" r="6" stroke="#CECBF6" strokeWidth="1.2"/>
      <path d="M7 6v4M7 4.5v.5" stroke="#CECBF6" strokeWidth="1.2" strokeLinecap="round"/>
    </svg>
  );
}

export function Toaster() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    function handler(e: Event) {
      const { message, type } = (e as CustomEvent<{ message: string; type: ToastType }>).detail;
      const id = Date.now() + Math.random();
      setToasts(prev => [...prev, { id, message, type }]);
      setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500);
    }
    window.addEventListener("clari:toast", handler);
    return () => window.removeEventListener("clari:toast", handler);
  }, []);

  if (!toasts.length) return null;

  return (
    <div className="toaster-container" style={{
      position: "fixed",
      bottom: "24px",
      right: "24px",
      display: "flex",
      flexDirection: "column",
      gap: "8px",
      zIndex: 9999,
      pointerEvents: "none",
    }}>
      {toasts.map(t => {
        const c = COLORS[t.type];
        return (
          <div key={t.id} style={{
            padding: "11px 16px",
            borderRadius: "10px",
            fontSize: "13px",
            fontWeight: 500,
            color: c.text,
            background: c.bg,
            border: `0.5px solid ${c.border}`,
            backdropFilter: "blur(12px)",
            display: "flex",
            alignItems: "center",
            gap: "9px",
            boxShadow: "0 4px 20px rgba(0,0,0,0.35)",
            minWidth: "220px",
            maxWidth: "340px",
            animation: "toast-in 180ms ease-out",
          }}>
            <Icon type={t.type} />
            {t.message}
          </div>
        );
      })}
    </div>
  );
}
