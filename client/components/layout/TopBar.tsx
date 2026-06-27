"use client";

import { useTabStore } from "@/store/tabStore";
import { useAppStore } from "@/store/appStore";
import { useQuery } from "@tanstack/react-query";
import type { Environment } from "@/types";

async function fetchEnvironments(): Promise<Environment[]> {
  const res = await fetch("http://localhost:8000/api/environments");
  if (!res.ok) return [];
  return res.json();
}

export default function TopBar() {
  const openTab = useTabStore((s) => s.openTab);
  const { selectedEnvironmentId, setSelectedEnvironment } = useAppStore();

  const { data: environments = [] } = useQuery({
    queryKey: ["environments"],
    queryFn: fetchEnvironments,
  });

  return (
    <header className="flex items-center h-11 px-3 gap-3 bg-pm-navbar border-b border-pm-border flex-shrink-0 select-none">
      {/* ── Left: logo + brand ───────────────────────────── */}
      <div className="flex items-center gap-2 min-w-0">
        {/* Postman-style orange hexagon logo */}
        <svg width="20" height="20" viewBox="0 0 32 32" fill="none" aria-hidden>
          <rect width="32" height="32" rx="6" fill="#EF5C33" />
          <path
            d="M22 10.5L16 7l-6 3.5v7L16 21l6-3.5v-7z"
            stroke="white"
            strokeWidth="1.5"
            fill="none"
          />
          <circle cx="16" cy="14" r="2" fill="white" />
        </svg>
        <span className="text-pm-text font-semibold text-sm tracking-tight">
          Postman Clone
        </span>
      </div>

      {/* ── Divider ──────────────────────────────────────── */}
      <div className="w-px h-5 bg-pm-border" />

      {/* ── New request button ───────────────────────────── */}
      <button
        onClick={() => openTab()}
        className="flex items-center gap-1.5 px-3 h-7 rounded text-xs font-medium
                   bg-pm-orange text-white hover:bg-pm-orange-dim transition-colors"
      >
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
          <path d="M6 1v10M1 6h10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
        New
      </button>

      {/* ── Spacer ───────────────────────────────────────── */}
      <div className="flex-1" />

      {/* ── Coming-soon nav links ────────────────────────── */}
      {(["Workspaces", "Reports", "Explore"] as const).map((label) => (
        <button
          key={label}
          title="Coming Soon"
          className="hidden sm:block px-2 h-7 rounded text-xs text-pm-muted
                     hover:text-pm-text hover:bg-pm-hover transition-colors"
        >
          {label}
        </button>
      ))}

      <div className="w-px h-5 bg-pm-border" />

      {/* ── Environment selector ─────────────────────────── */}
      <div className="relative flex items-center">
        <select
          value={selectedEnvironmentId ?? ""}
          onChange={(e) =>
            setSelectedEnvironment(e.target.value || null)
          }
          className="appearance-none h-7 pl-3 pr-7 rounded text-xs
                     bg-pm-input border border-pm-border text-pm-text
                     hover:border-pm-muted focus:outline-none focus:border-pm-orange
                     cursor-pointer transition-colors"
        >
          <option value="">No Environment</option>
          {environments.map((env) => (
            <option key={env.id} value={env.id}>
              {env.name}
            </option>
          ))}
        </select>
        {/* dropdown chevron */}
        <svg
          width="10"
          height="10"
          viewBox="0 0 10 10"
          className="absolute right-2 pointer-events-none text-pm-muted"
          fill="none"
          aria-hidden
        >
          <path d="M2 3.5l3 3 3-3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
      </div>

      {/* ── User avatar ──────────────────────────────────── */}
      <div
        title="Default User"
        className="flex items-center justify-center w-7 h-7 rounded-full
                   bg-pm-orange text-white text-xs font-bold cursor-default select-none"
      >
        D
      </div>
    </header>
  );
}
