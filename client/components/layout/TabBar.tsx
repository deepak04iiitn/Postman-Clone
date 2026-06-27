"use client";

import { useTabStore } from "@/store/tabStore";
import { cn, METHOD_COLORS } from "@/lib/utils";
import type { HttpMethod } from "@/types";

export default function TabBar() {
  const { tabs, activeTabId, openTab, closeTab, setActiveTab } = useTabStore();

  return (
    <div className="flex items-end h-9 bg-pm-surface border-b border-pm-border flex-shrink-0 overflow-x-auto overflow-y-hidden">
      {/* ── Tabs ─────────────────────────────────────────── */}
      {tabs.map((tab) => {
        const isActive = tab.id === activeTabId;
        return (
          <div
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "group relative flex items-center gap-1.5 h-full px-3 min-w-0 max-w-[180px]",
              "border-r border-pm-border cursor-pointer select-none flex-shrink-0",
              "transition-colors text-xs",
              isActive
                ? "bg-pm-bg text-pm-text"
                : "bg-pm-surface text-pm-muted hover:bg-pm-hover hover:text-pm-text"
            )}
          >
            {/* orange top border on active */}
            {isActive && (
              <span className="absolute inset-x-0 top-0 h-[2px] bg-pm-orange rounded-b-none" />
            )}

            {/* method badge */}
            <span
              className={cn(
                "text-[10px] font-bold flex-shrink-0",
                METHOD_COLORS[tab.method as HttpMethod] ?? "text-pm-muted"
              )}
            >
              {tab.method}
            </span>

            {/* dirty dot */}
            {tab.isDirty && (
              <span className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-pm-orange" />
            )}

            {/* tab name */}
            <span className="truncate flex-1 min-w-0">{tab.name}</span>

            {/* close button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                closeTab(tab.id);
              }}
              className={cn(
                "flex-shrink-0 w-4 h-4 flex items-center justify-center rounded",
                "text-pm-muted hover:text-pm-text hover:bg-pm-active transition-colors",
                "opacity-0 group-hover:opacity-100",
                isActive && "opacity-100"
              )}
              aria-label="Close tab"
            >
              <svg width="8" height="8" viewBox="0 0 8 8" fill="none" aria-hidden>
                <path d="M1 1l6 6M7 1L1 7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        );
      })}

      {/* ── New tab button ────────────────────────────────── */}
      <button
        onClick={() => openTab()}
        className="flex items-center justify-center flex-shrink-0 w-8 h-full
                   text-pm-muted hover:text-pm-text hover:bg-pm-hover transition-colors"
        aria-label="New request tab"
      >
        <svg width="11" height="11" viewBox="0 0 11 11" fill="none" aria-hidden>
          <path d="M5.5 1v9M1 5.5h9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </button>
    </div>
  );
}
