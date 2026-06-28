"use client";

import { useState } from "react";
import { useAppStore } from "@/store/appStore";
import { cn } from "@/lib/utils";
import CollectionsSidebar from "./CollectionsSidebar";
import HistorySidebar from "./HistorySidebar";

function CollectionsIcon({ active }: { active: boolean }) {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none"
      className={active ? "text-pm-orange" : "text-pm-muted"}>
      <rect x="1" y="1" width="5.5" height="5.5" rx="1" stroke="currentColor" strokeWidth="1.3" />
      <rect x="1" y="8.5" width="5.5" height="5.5" rx="1" stroke="currentColor" strokeWidth="1.3" />
      <rect x="8.5" y="1" width="5.5" height="5.5" rx="1" stroke="currentColor" strokeWidth="1.3" />
      <rect x="8.5" y="8.5" width="5.5" height="5.5" rx="1" stroke="currentColor" strokeWidth="1.3" />
    </svg>
  );
}

function HistoryIcon({ active }: { active: boolean }) {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none"
      className={active ? "text-pm-orange" : "text-pm-muted"}>
      <circle cx="7.5" cy="7.5" r="6" stroke="currentColor" strokeWidth="1.3" />
      <path d="M7.5 4v3.5l2.5 1.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

const TABS = [
  { key: "collections" as const, label: "Collections", Icon: CollectionsIcon },
  { key: "history"     as const, label: "History",     Icon: HistoryIcon },
];

export default function Sidebar() {
  const { sidebarTab, setSidebarTab } = useAppStore();
  const [searchQuery, setSearchQuery] = useState("");

  // Reset search when switching tabs
  function handleTabSwitch(key: "collections" | "history") {
    setSidebarTab(key);
    setSearchQuery("");
  }

  return (
    <div className="flex flex-col h-full bg-pm-sidebar overflow-hidden">
      {/* ── Tab switcher ─────────────────────────────────── */}
      <div className="flex border-b border-pm-border flex-shrink-0">
        {TABS.map(({ key, label, Icon }) => (
          <button
            key={key}
            onClick={() => handleTabSwitch(key)}
            className={cn(
              "flex flex-1 flex-col items-center gap-1 py-2 text-[11px] font-medium transition-colors",
              sidebarTab === key
                ? "text-pm-orange border-b-2 border-pm-orange -mb-px"
                : "text-pm-muted hover:text-pm-text"
            )}
          >
            <Icon active={sidebarTab === key} />
            {label}
          </button>
        ))}
      </div>

      {/* ── Search bar ───────────────────────────────────── */}
      <div className="px-3 py-2 flex-shrink-0">
        <div className="relative">
          <svg
            width="13" height="13" viewBox="0 0 13 13" fill="none"
            className="absolute left-2.5 top-1/2 -translate-y-1/2 text-pm-muted pointer-events-none"
            aria-hidden
          >
            <circle cx="5.5" cy="5.5" r="4" stroke="currentColor" strokeWidth="1.3" />
            <path d="M9 9l2.5 2.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
          </svg>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={sidebarTab === "collections" ? "Search collections" : "Search history"}
            className="w-full pl-7 pr-3 h-7 rounded text-xs bg-pm-input
                       border border-pm-border text-pm-text placeholder:text-pm-muted
                       focus:outline-none focus:border-pm-orange transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-pm-muted hover:text-pm-text"
              aria-label="Clear search"
            >
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden>
                <path d="M1 1l8 8M9 1L1 9" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* ── Content ──────────────────────────────────────── */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {sidebarTab === "collections" ? (
          <CollectionsSidebar />
        ) : (
          <HistorySidebar searchQuery={searchQuery} />
        )}
      </div>
    </div>
  );
}
