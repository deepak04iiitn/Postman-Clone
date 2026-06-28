"use client";

import { useState, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { useTabStore } from "@/store/tabStore";
import { useAppStore } from "@/store/appStore";
import { environmentsApi } from "@/lib/api";
import ManageEnvironmentsModal from "@/components/modals/ManageEnvironmentsModal";
import { cn } from "@/lib/utils";

export default function TopBar() {
  const [envDropdownOpen, setEnvDropdownOpen] = useState(false);
  const [showEnvModal, setShowEnvModal] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const openTab = useTabStore((s) => s.openTab);
  const { selectedEnvironmentId, setSelectedEnvironment } = useAppStore();

  const { data: environments = [] } = useQuery({
    queryKey: ["environments"],
    queryFn: environmentsApi.list,
  });

  const selectedEnv = environments.find((e) => e.id === selectedEnvironmentId);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setEnvDropdownOpen(false);
      }
    }
    if (envDropdownOpen) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [envDropdownOpen]);

  return (
    <>
      <header className="flex items-center h-11 px-3 gap-3 bg-pm-navbar border-b border-pm-border shrink-0 select-none">

        {/* ── Left: logo + brand ─────────────────────────── */}
        <div className="flex items-center gap-2 min-w-0">
          <svg width="20" height="20" viewBox="0 0 32 32" fill="none" aria-hidden>
            <rect width="32" height="32" rx="6" fill="#EF5C33" />
            <path d="M22 10.5L16 7l-6 3.5v7L16 21l6-3.5v-7z"
              stroke="white" strokeWidth="1.5" fill="none" />
            <circle cx="16" cy="14" r="2" fill="white" />
          </svg>
          <span className="text-pm-text font-semibold text-sm tracking-tight">
            Postman Clone
          </span>
        </div>

        <div className="w-px h-5 bg-pm-border" />

        {/* ── New request ────────────────────────────────── */}
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

        <div className="flex-1" />

        {/* ── Coming-soon nav links ──────────────────────── */}
        {(["Workspaces", "Reports", "Explore"] as const).map((label) => (
          <button
            key={label}
            onClick={() => toast.info(`${label} — Coming Soon`, {
              description: "This feature is not yet available in this build.",
              duration: 2500,
            })}
            className="hidden sm:block px-2 h-7 rounded text-xs text-pm-muted
                       hover:text-pm-text hover:bg-pm-hover transition-colors"
          >
            {label}
          </button>
        ))}

        <div className="w-px h-5 bg-pm-border" />

        {/* ── Environment selector (custom dropdown) ─────── */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setEnvDropdownOpen((o) => !o)}
            className={cn(
              "flex items-center gap-2 px-3 h-7 rounded text-xs transition-colors min-w-[140px] max-w-[200px]",
              "bg-pm-input border hover:border-pm-muted",
              envDropdownOpen ? "border-pm-orange" : "border-pm-border"
            )}
          >
            {/* globe / env icon */}
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none"
              className="shrink-0 text-pm-muted" aria-hidden>
              <circle cx="6" cy="6" r="5" stroke="currentColor" strokeWidth="1.2" />
              <path d="M6 1c-1.5 1.5-2 3-2 5s.5 3.5 2 5M6 1c1.5 1.5 2 3 2 5s-.5 3.5-2 5M1 6h10"
                stroke="currentColor" strokeWidth="1.2" />
            </svg>
            <span className="flex-1 truncate text-left text-pm-text">
              {selectedEnv?.name ?? "No Environment"}
            </span>
            <svg width="9" height="9" viewBox="0 0 9 9" fill="none"
              className={cn("shrink-0 text-pm-muted transition-transform",
                envDropdownOpen && "rotate-180")} aria-hidden>
              <path d="M1.5 3l3 3 3-3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
            </svg>
          </button>

          {/* Dropdown panel */}
          {envDropdownOpen && (
            <div className="absolute right-0 top-full mt-1 z-50 w-56
                            bg-pm-sidebar border border-pm-border rounded shadow-xl overflow-hidden">
              {/* No environment */}
              <button
                onClick={() => { setSelectedEnvironment(null); setEnvDropdownOpen(false); }}
                className={cn(
                  "flex items-center w-full px-3 py-2 text-xs transition-colors hover:bg-pm-hover",
                  !selectedEnvironmentId ? "text-pm-orange font-medium" : "text-pm-muted"
                )}
              >
                <span className="flex-1 text-left">No Environment</span>
                {!selectedEnvironmentId && (
                  <svg width="11" height="11" viewBox="0 0 11 11" fill="none" aria-hidden>
                    <path d="M1.5 5.5l3 3 5-5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                  </svg>
                )}
              </button>

              {environments.length > 0 && (
                <div className="border-t border-pm-border" />
              )}

              {/* Environment options */}
              {environments.map((env) => (
                <button
                  key={env.id}
                  onClick={() => { setSelectedEnvironment(env.id); setEnvDropdownOpen(false); }}
                  className={cn(
                    "flex items-center w-full px-3 py-2 text-xs transition-colors hover:bg-pm-hover",
                    selectedEnvironmentId === env.id
                      ? "text-pm-orange font-medium"
                      : "text-pm-text"
                  )}
                >
                  <span className="flex-1 truncate text-left">{env.name}</span>
                  {selectedEnvironmentId === env.id && (
                    <svg width="11" height="11" viewBox="0 0 11 11" fill="none" aria-hidden>
                      <path d="M1.5 5.5l3 3 5-5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                    </svg>
                  )}
                </button>
              ))}

              {/* Manage Environments link */}
              <div className="border-t border-pm-border">
                <button
                  onClick={() => { setEnvDropdownOpen(false); setShowEnvModal(true); }}
                  className="flex items-center gap-2 w-full px-3 py-2 text-xs
                             text-pm-orange hover:bg-pm-hover transition-colors"
                >
                  <svg width="11" height="11" viewBox="0 0 11 11" fill="none" aria-hidden>
                    <circle cx="5.5" cy="5.5" r="4.5" stroke="currentColor" strokeWidth="1.2" />
                    <path d="M5.5 3v2.5l2 1.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                  </svg>
                  Manage Environments
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ── User avatar ────────────────────────────────── */}
        <div
          title="Default User"
          className="flex items-center justify-center w-7 h-7 rounded-full
                     bg-pm-orange text-white text-xs font-bold cursor-default"
        >
          D
        </div>
      </header>

      {/* Manage Environments modal */}
      {showEnvModal && (
        <ManageEnvironmentsModal onClose={() => setShowEnvModal(false)} />
      )}
    </>
  );
}
