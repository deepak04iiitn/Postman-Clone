import type {
  Collection,
  CollectionCreate,
  CollectionUpdate,
  SavedRequest,
  SavedRequestCreate,
  SavedRequestUpdate,
  Environment,
  EnvironmentCreate,
  EnvironmentVariable,
  EnvironmentVariableCreate,
  HistoryEntry,
  RunnerRequest,
  RunnerResponse,
} from "@/types";

const BASE = "http://localhost:8000";

async function request<T>(
  path: string,
  init?: RequestInit
): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json", ...init?.headers },
    ...init,
  });
  if (res.status === 204) return undefined as T;
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(`${res.status} ${text}`);
  }
  return res.json();
}

// ── Collections ──────────────────────────────────────────────
export const collectionsApi = {
  list: () => request<Collection[]>("/api/collections"),
  create: (body: CollectionCreate) =>
    request<Collection>("/api/collections", { method: "POST", body: JSON.stringify(body) }),
  rename: (id: string, body: CollectionUpdate) =>
    request<Collection>(`/api/collections/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
  delete: (id: string) =>
    request<void>(`/api/collections/${id}`, { method: "DELETE" }),
};

// ── Requests ─────────────────────────────────────────────────
export const requestsApi = {
  create: (collectionId: string, body: SavedRequestCreate) =>
    request<SavedRequest>(`/api/collections/${collectionId}/requests`, {
      method: "POST",
      body: JSON.stringify(body),
    }),
  update: (id: string, body: SavedRequestUpdate) =>
    request<SavedRequest>(`/api/requests/${id}`, { method: "PUT", body: JSON.stringify(body) }),
  delete: (id: string) =>
    request<void>(`/api/requests/${id}`, { method: "DELETE" }),
};

// ── Environments ──────────────────────────────────────────────
export const environmentsApi = {
  list: () => request<Environment[]>("/api/environments"),
  create: (body: EnvironmentCreate) =>
    request<Environment>("/api/environments", { method: "POST", body: JSON.stringify(body) }),
  rename: (id: string, name: string) =>
    request<Environment>(`/api/environments/${id}`, { method: "PATCH", body: JSON.stringify({ name }) }),
  delete: (id: string) =>
    request<void>(`/api/environments/${id}`, { method: "DELETE" }),
  getVariables: (id: string) =>
    request<EnvironmentVariable[]>(`/api/environments/${id}/variables`),
  setVariables: (id: string, vars: EnvironmentVariableCreate[]) =>
    request<EnvironmentVariable[]>(`/api/environments/${id}/variables`, {
      method: "PUT",
      body: JSON.stringify(vars),
    }),
};

// ── History ───────────────────────────────────────────────────
export const historyApi = {
  list: () => request<HistoryEntry[]>("/api/history"),
  get: (id: string) => request<HistoryEntry>(`/api/history/${id}`),
  delete: (id: string) => request<void>(`/api/history/${id}`, { method: "DELETE" }),
  clear: () => request<void>("/api/history", { method: "DELETE" }),
};

// ── Runner ────────────────────────────────────────────────────
export async function sendRequest(payload: RunnerRequest): Promise<RunnerResponse> {
  try {
    return await request<RunnerResponse>("/runner/send", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  } catch (err) {
    return {
      status_code: null,
      response_time_ms: 0,
      response_size_bytes: 0,
      headers: {},
      body: null,
      error: err instanceof Error ? err.message : "Network error",
    };
  }
}
