"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { collectionsApi, requestsApi } from "@/lib/api";
import { useTabStore } from "@/store/tabStore";
import { cn, METHOD_COLORS } from "@/lib/utils";
import ConfirmDeleteModal from "@/components/modals/ConfirmDeleteModal";
import type { Collection, SavedRequest, HttpMethod } from "@/types";

// ── Context menu ─────────────────────────────────────────────
interface MenuProps {
  items: { label: string; danger?: boolean; onClick: () => void }[];
  onClose: () => void;
}

function ContextMenu({ items, onClose }: MenuProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  return (
    <div
      ref={ref}
      className="absolute right-0 top-full z-50 mt-0.5 min-w-[150px]
                 bg-pm-sidebar border border-pm-border rounded shadow-xl overflow-hidden"
    >
      {items.map((item) => (
        <button
          key={item.label}
          onClick={() => { item.onClick(); onClose(); }}
          className={cn(
            "flex w-full items-center px-3 py-2 text-xs transition-colors hover:bg-pm-hover",
            item.danger ? "text-method-delete" : "text-pm-text"
          )}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}

// ── Collection row ───────────────────────────────────────────
interface CollectionRowProps {
  collection: Collection;
  isExpanded: boolean;
  onToggle: () => void;
  onRename: (newName: string) => void;
  onDelete: () => void;
  onAddRequest: () => void;
}

function CollectionRow({
  collection, isExpanded, onToggle, onRename, onDelete, onAddRequest,
}: CollectionRowProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState(collection.name);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) inputRef.current?.select();
  }, [editing]);

  function commitRename() {
    const trimmed = editName.trim();
    if (trimmed && trimmed !== collection.name) onRename(trimmed);
    setEditing(false);
  }

  return (
    <div className="relative group/col">
      <div
        onClick={onToggle}
        className="flex items-center gap-1.5 px-2 py-1.5 cursor-pointer
                   hover:bg-pm-hover transition-colors select-none"
      >
        {/* chevron */}
        <svg
          width="10" height="10" viewBox="0 0 10 10" fill="none"
          className={cn("flex-shrink-0 text-pm-muted transition-transform", isExpanded && "rotate-90")}
          aria-hidden
        >
          <path d="M3 2l4 3-4 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        </svg>

        {/* folder icon */}
        <svg width="13" height="13" viewBox="0 0 13 13" fill="none"
          className="flex-shrink-0 text-pm-muted" aria-hidden>
          <path d="M1 3.5A1.5 1.5 0 012.5 2h2.382a1.5 1.5 0 011.118.5L6.5 3H10.5A1.5 1.5 0 0112 4.5v5A1.5 1.5 0 0110.5 11h-8A1.5 1.5 0 011 9.5v-6z"
            stroke="currentColor" strokeWidth="1.1" fill="none" />
        </svg>

        {/* name or inline editor */}
        {editing ? (
          <input
            ref={inputRef}
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            onBlur={commitRename}
            onKeyDown={(e) => {
              if (e.key === "Enter") commitRename();
              if (e.key === "Escape") { setEditName(collection.name); setEditing(false); }
            }}
            onClick={(e) => e.stopPropagation()}
            className="flex-1 min-w-0 px-1 py-0.5 bg-pm-input border border-pm-orange
                       rounded text-xs text-pm-text focus:outline-none"
          />
        ) : (
          <span className="flex-1 min-w-0 truncate text-xs text-pm-text font-medium">
            {collection.name}
          </span>
        )}

        {/* ⋯ menu button */}
        <div className="relative flex-shrink-0">
          <button
            onClick={(e) => { e.stopPropagation(); setMenuOpen((o) => !o); }}
            className="opacity-0 group-hover/col:opacity-100 w-5 h-5 flex items-center
                       justify-center rounded text-pm-muted hover:text-pm-text hover:bg-pm-active
                       transition-all"
            aria-label="Collection options"
          >
            <svg width="13" height="3" viewBox="0 0 13 3" fill="currentColor" aria-hidden>
              <circle cx="1.5" cy="1.5" r="1.5" /><circle cx="6.5" cy="1.5" r="1.5" /><circle cx="11.5" cy="1.5" r="1.5" />
            </svg>
          </button>
          {menuOpen && (
            <ContextMenu
              onClose={() => setMenuOpen(false)}
              items={[
                { label: "Add Request", onClick: onAddRequest },
                { label: "Rename", onClick: () => setEditing(true) },
                { label: "Delete", danger: true, onClick: onDelete },
              ]}
            />
          )}
        </div>
      </div>
    </div>
  );
}

// ── Request row ──────────────────────────────────────────────
interface RequestRowProps {
  request: SavedRequest;
  onOpen: () => void;
  onRename: (newName: string) => void;
  onDelete: () => void;
}

function RequestRow({ request, onOpen, onRename, onDelete }: RequestRowProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState(request.name);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) inputRef.current?.select();
  }, [editing]);

  function commitRename() {
    const trimmed = editName.trim();
    if (trimmed && trimmed !== request.name) onRename(trimmed);
    setEditing(false);
  }

  return (
    <div className="relative group/req">
      <div
        onClick={onOpen}
        className="flex items-center gap-2 pl-7 pr-2 py-1.5 cursor-pointer
                   hover:bg-pm-hover transition-colors select-none"
      >
        {/* method badge */}
        <span className={cn("text-[10px] font-bold flex-shrink-0 w-10",
          METHOD_COLORS[request.method as HttpMethod] ?? "text-pm-muted")}>
          {request.method}
        </span>

        {/* name or inline editor */}
        {editing ? (
          <input
            ref={inputRef}
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            onBlur={commitRename}
            onKeyDown={(e) => {
              if (e.key === "Enter") commitRename();
              if (e.key === "Escape") { setEditName(request.name); setEditing(false); }
            }}
            onClick={(e) => e.stopPropagation()}
            className="flex-1 min-w-0 px-1 py-0.5 bg-pm-input border border-pm-orange
                       rounded text-xs text-pm-text focus:outline-none"
          />
        ) : (
          <span className="flex-1 min-w-0 truncate text-xs text-pm-muted">
            {request.name}
          </span>
        )}

        {/* ⋯ menu */}
        <div className="relative flex-shrink-0">
          <button
            onClick={(e) => { e.stopPropagation(); setMenuOpen((o) => !o); }}
            className="opacity-0 group-hover/req:opacity-100 w-5 h-5 flex items-center
                       justify-center rounded text-pm-muted hover:text-pm-text hover:bg-pm-active
                       transition-all"
            aria-label="Request options"
          >
            <svg width="13" height="3" viewBox="0 0 13 3" fill="currentColor" aria-hidden>
              <circle cx="1.5" cy="1.5" r="1.5" /><circle cx="6.5" cy="1.5" r="1.5" /><circle cx="11.5" cy="1.5" r="1.5" />
            </svg>
          </button>
          {menuOpen && (
            <ContextMenu
              onClose={() => setMenuOpen(false)}
              items={[
                { label: "Rename", onClick: () => setEditing(true) },
                { label: "Delete", danger: true, onClick: onDelete },
              ]}
            />
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main CollectionsSidebar ──────────────────────────────────
export default function CollectionsSidebar() {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [isCreating, setIsCreating] = useState(false);
  const [newColName, setNewColName] = useState("");
  const newColRef = useRef<HTMLInputElement>(null);

  const [confirmDelete, setConfirmDelete] = useState<{
    title: string; message: string; onConfirm: () => void;
  } | null>(null);

  const queryClient = useQueryClient();
  const openTab = useTabStore((s) => s.openTab);

  const { data: collections = [], isLoading } = useQuery({
    queryKey: ["collections"],
    queryFn: collectionsApi.list,
  });

  useEffect(() => {
    if (isCreating) newColRef.current?.focus();
  }, [isCreating]);

  function toggleExpanded(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  async function createCollection() {
    const name = newColName.trim();
    if (!name) { setIsCreating(false); return; }
    try {
      await collectionsApi.create({ name });
      queryClient.invalidateQueries({ queryKey: ["collections"] });
      toast.success(`Collection "${name}" created`);
    } catch {
      toast.error("Failed to create collection");
    }
    setNewColName("");
    setIsCreating(false);
  }

  const renameCollection = useCallback(async (id: string, name: string) => {
    try {
      await collectionsApi.rename(id, { name });
      queryClient.invalidateQueries({ queryKey: ["collections"] });
      toast.success("Collection renamed");
    } catch {
      toast.error("Failed to rename collection");
    }
  }, [queryClient]);

  const deleteCollection = useCallback(async (id: string, name: string) => {
    setConfirmDelete({
      title: "Delete Collection",
      message: `Delete "${name}" and all its requests? This cannot be undone.`,
      onConfirm: async () => {
        try {
          await collectionsApi.delete(id);
          queryClient.invalidateQueries({ queryKey: ["collections"] });
          toast.success("Collection deleted");
        } catch {
          toast.error("Failed to delete collection");
        }
        setConfirmDelete(null);
      },
    });
  }, [queryClient]);

  const renameRequest = useCallback(async (id: string, name: string) => {
    try {
      await requestsApi.update(id, { name });
      queryClient.invalidateQueries({ queryKey: ["collections"] });
      toast.success("Request renamed");
    } catch {
      toast.error("Failed to rename request");
    }
  }, [queryClient]);

  const deleteRequest = useCallback(async (id: string, name: string) => {
    setConfirmDelete({
      title: "Delete Request",
      message: `Delete "${name}"? This cannot be undone.`,
      onConfirm: async () => {
        try {
          await requestsApi.delete(id);
          queryClient.invalidateQueries({ queryKey: ["collections"] });
          toast.success("Request deleted");
        } catch {
          toast.error("Failed to delete request");
        }
        setConfirmDelete(null);
      },
    });
  }, [queryClient]);

  function openSavedRequest(req: SavedRequest) {
    openTab({
      savedRequestId: req.id,
      name: req.name,
      method: req.method as HttpMethod,
      url: req.url,
      headers: req.headers,
      params: req.params,
      bodyType: req.body_type as "none" | "raw" | "form-data" | "urlencoded",
      bodyContent: req.body_content ?? "",
      authType: req.auth_type as "none" | "bearer" | "basic",
      authConfig: req.auth_config as Record<string, string>,
      isDirty: false,
    });
  }

  // ── Render ────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex flex-col gap-2 p-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-7 rounded bg-pm-hover animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <>
      {/* Header toolbar */}
      <div className="flex items-center justify-between px-3 py-1.5 flex-shrink-0">
        <span className="text-[11px] text-pm-muted font-medium uppercase tracking-wide">
          Collections
        </span>
        <button
          onClick={() => setIsCreating(true)}
          title="New Collection"
          className="w-6 h-6 flex items-center justify-center rounded text-pm-muted
                     hover:text-pm-text hover:bg-pm-hover transition-colors"
          aria-label="New Collection"
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
            <path d="M6 1v10M1 6h10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      {/* Inline new-collection input */}
      {isCreating && (
        <div className="px-3 pb-1.5 flex-shrink-0">
          <input
            ref={newColRef}
            value={newColName}
            onChange={(e) => setNewColName(e.target.value)}
            onBlur={createCollection}
            onKeyDown={(e) => {
              if (e.key === "Enter") createCollection();
              if (e.key === "Escape") { setIsCreating(false); setNewColName(""); }
            }}
            placeholder="Collection name…"
            className="w-full px-2 py-1 rounded bg-pm-input border border-pm-orange
                       text-xs text-pm-text placeholder:text-pm-muted focus:outline-none"
          />
        </div>
      )}

      {/* Empty state */}
      {collections.length === 0 && !isCreating && (
        <div className="flex flex-col items-center justify-center flex-1 gap-3 px-6 text-center">
          <svg width="36" height="36" viewBox="0 0 40 40" fill="none" className="text-pm-border" aria-hidden>
            <rect x="4" y="4" width="14" height="14" rx="2" stroke="currentColor" strokeWidth="1.5" />
            <rect x="22" y="4" width="14" height="14" rx="2" stroke="currentColor" strokeWidth="1.5" />
            <rect x="4" y="22" width="14" height="14" rx="2" stroke="currentColor" strokeWidth="1.5" />
            <rect x="22" y="22" width="14" height="14" rx="2" stroke="currentColor" strokeWidth="1.5" />
          </svg>
          <p className="text-pm-muted text-xs leading-relaxed">
            Create your first collection<br />to organise your requests
          </p>
          <button
            onClick={() => setIsCreating(true)}
            className="px-3 h-7 rounded text-xs font-medium border border-pm-border
                       text-pm-text hover:bg-pm-hover transition-colors"
          >
            + New Collection
          </button>
        </div>
      )}

      {/* Collection tree */}
      <div className="overflow-y-auto flex-1">
        {collections.map((col) => (
          <div key={col.id}>
            <CollectionRow
              collection={col}
              isExpanded={expanded.has(col.id)}
              onToggle={() => toggleExpanded(col.id)}
              onRename={(name) => renameCollection(col.id, name)}
              onDelete={() => deleteCollection(col.id, col.name)}
              onAddRequest={() => {
                // Open a blank tab; user will Save into this collection
                openTab();
                toast.info(`Save the request into "${col.name}"`);
              }}
            />

            {expanded.has(col.id) && col.requests.map((req) => (
              <RequestRow
                key={req.id}
                request={req}
                onOpen={() => openSavedRequest(req)}
                onRename={(name) => renameRequest(req.id, name)}
                onDelete={() => deleteRequest(req.id, req.name)}
              />
            ))}
          </div>
        ))}
      </div>

      {/* Confirm-delete modal */}
      {confirmDelete && (
        <ConfirmDeleteModal
          title={confirmDelete.title}
          message={confirmDelete.message}
          onConfirm={confirmDelete.onConfirm}
          onCancel={() => setConfirmDelete(null)}
        />
      )}
    </>
  );
}
