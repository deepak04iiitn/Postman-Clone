"use client";

export default function ResponseViewer() {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
      <svg width="48" height="48" viewBox="0 0 48 48" fill="none" className="text-pm-border" aria-hidden>
        <circle cx="24" cy="24" r="20" stroke="currentColor" strokeWidth="1.5" />
        <path d="M16 24h16M24 16l8 8-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <p className="text-pm-muted text-xs">
        Hit <span className="text-pm-text font-medium">Send</span> to get a response
      </p>
    </div>
  );
}
