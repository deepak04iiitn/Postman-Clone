"use client";

import { useState } from "react";
import { useTabStore } from "@/store/tabStore";
import UrlBar from "./UrlBar";
import RequestTabs, { type RequestSubTab } from "./RequestTabs";
import ParamsTab from "./ParamsTab";
import HeadersTab from "./HeadersTab";
import BodyTab from "./BodyTab";
import AuthTab from "./AuthTab";

export default function RequestBuilder() {
  const [activeSubTab, setActiveSubTab] = useState<RequestSubTab>("params");

  const tab = useTabStore((s) => s.tabs.find((t) => t.id === s.activeTabId));

  const paramCount = tab?.params.filter((p) => p.enabled && p.key).length ?? 0;
  const headerCount = tab?.headers.filter((h) => h.enabled && h.key).length ?? 0;

  function handleSend() {
    // Phase 4 will wire this up
    console.log("Send clicked — wired in Phase 4");
  }

  function handleSaveClick() {
    // Phase 5 will wire this up
    console.log("Save clicked — wired in Phase 5");
  }

  if (!tab) return null;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* URL bar */}
      <UrlBar onSend={handleSend} onSaveClick={handleSaveClick} />

      {/* Sub-tab navigation */}
      <RequestTabs
        active={activeSubTab}
        onChange={setActiveSubTab}
        paramCount={paramCount}
        headerCount={headerCount}
      />

      {/* Sub-tab content */}
      <div className="flex-1 overflow-hidden">
        {activeSubTab === "params"      && <ParamsTab />}
        {activeSubTab === "auth"        && <AuthTab />}
        {activeSubTab === "headers"     && <HeadersTab />}
        {activeSubTab === "body"        && <BodyTab />}
        {activeSubTab === "pre-request" && <ComingSoonEditor label="Pre-request Script" />}
        {activeSubTab === "tests"       && <ComingSoonEditor label="Tests" />}
      </div>
    </div>
  );
}

function ComingSoonEditor({ label }: { label: string }) {
  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex items-center px-4 py-2 border-b border-pm-border flex-shrink-0">
        <span className="text-xs text-pm-muted">{label}</span>
        <span className="ml-2 px-1.5 py-0.5 rounded text-[10px] bg-pm-active text-pm-muted">
          Coming Soon
        </span>
      </div>
      <textarea
        readOnly
        defaultValue="// Coming soon"
        className="flex-1 resize-none p-4 bg-transparent text-pm-muted text-xs
                   font-mono focus:outline-none leading-relaxed"
      />
    </div>
  );
}
