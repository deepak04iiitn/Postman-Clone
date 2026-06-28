# Implementation Plan
## API Client Platform — Postman Clone

**Stack:** Next.js (TypeScript) · FastAPI (Python) · SQLite  
**Document Version:** 1.0  
**Based on:** PRD v1.0

---

## Table of Contents

1. [Project Structure](#1-project-structure)
2. [Phase 0 — Project Scaffolding & Tooling](#2-phase-0--project-scaffolding--tooling)
3. [Phase 1 — Server Foundation](#3-phase-1--server-foundation)
4. [Phase 2 — Client Shell & Layout](#4-phase-2--client-shell--layout)
5. [Phase 3 — Request Builder UI](#5-phase-3--request-builder-ui)
6. [Phase 4 — Request Runner & Response Viewer](#6-phase-4--request-runner--response-viewer)
7. [Phase 5 — Collections CRUD](#7-phase-5--collections-crud)
8. [Phase 6 — Environments & Variables](#8-phase-6--environments--variables)
9. [Phase 7 — History](#9-phase-7--history)
10. [Phase 8 — Polish & UX](#10-phase-8--polish--ux)
11. [Phase 9 — Seed Data & Final Integration](#11-phase-9--seed-data--final-integration)
12. [Phase 10 — Bonus Features (Optional)](#12-phase-10--bonus-features-optional)
13. [Dependency Map](#13-dependency-map)
14. [Definition of Done](#14-definition-of-done)

---

## 1. Project Structure

```
Postman-Clone/
├── backend/
│   ├── app/
│   │   ├── main.py               # FastAPI app entry point
│   │   ├── database.py           # SQLite connection & session
│   │   ├── models.py             # SQLAlchemy ORM models
│   │   ├── schemas.py            # Pydantic request/response schemas
│   │   ├── seed.py               # Seed script
│   │   └── routers/
│   │       ├── collections.py
│   │       ├── requests.py
│   │       ├── environments.py
│   │       ├── history.py
│   │       └── runner.py
│   ├── requirements.txt
│   └── .env
│
├── frontend/                     # Already scaffolded (Next.js)
│   ├── app/                      # Next.js App Router (root, no src/ prefix)
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   └── globals.css
│   ├── components/
│   │   ├── layout/               # Shell, Sidebar, TopBar, TabBar
│   │   ├── request/              # RequestBuilder, URL bar, tabs
│   │   ├── response/             # ResponseViewer, status bar
│   │   ├── shared/               # KeyValueTable, Modal, Toast, ResizeHandle
│   │   └── modals/               # SaveRequest, ManageEnvironments, ConfirmDelete
│   ├── hooks/                    # Custom React hooks
│   ├── store/                    # Zustand state management
│   ├── lib/
│   │   ├── api.ts                # API client (fetch wrappers)
│   │   └── variableResolver.ts
│   ├── types/                    # Shared TypeScript interfaces
│   ├── package.json
│   └── tsconfig.json
│
├── docs/
│   ├── PRD.md
│   └── IMPLEMENTATION_PLAN.md
└── README.md
```

> **Note:** `frontend/` was bootstrapped with `create-next-app` and uses the App Router with the `app/` directory directly at the root of `frontend/` (no `src/` wrapper). All new folders (`components/`, `hooks/`, `store/`, `lib/`, `types/`) are created at the same level as `app/`.

---

## 2. Phase 0 — Project Scaffolding & Tooling

**Goal:** Have both apps running locally with a single `README` command.

> `frontend/` is already scaffolded. Focus of this phase is wiring up the `backend/` and installing missing `frontend/` packages.

### Step 0.1 — Initialise the monorepo root

- [ ] Create `README.md` at `Postman-Clone/` root with setup instructions (fill in detail at the end)
- [ ] Create root `.gitignore` covering `node_modules`, `__pycache__`, `*.db`, `.env`, `.next`

### Step 0.2 — Server scaffold

- [ ] Create `backend/app/` directory
- [ ] Create `backend/requirements.txt` with pinned versions:
  ```
  fastapi
  uvicorn[standard]
  sqlalchemy
  httpx
  python-dotenv
  pydantic
  ```
- [ ] Create `backend/.env` with `DATABASE_URL=sqlite:///./postman_clone.db`
- [ ] Create `backend/app/main.py`:
  - Instantiate `FastAPI` app
  - Add CORS middleware allowing `http://localhost:3000`
  - Mount all routers under `/api` prefix (runner under `/runner`)
  - Add a `GET /health` endpoint returning `{ "status": "ok" }`
- [ ] Verify: run `uvicorn app.main:app --reload` from inside `backend/` — starts without errors

### Step 0.3 — Client: install missing packages

`frontend/` is already created. Install the additional packages it needs:

- [ ] From inside `frontend/`, run:
  ```
  npm install zustand @tanstack/react-query react-resizable-panels sonner
  ```
- [ ] Create `frontend/types/index.ts` with shared TypeScript interfaces mirroring all DB models
- [ ] Verify: `npm run dev` from `frontend/` serves `http://localhost:3000`

---

## 3. Phase 1 — Server Foundation

**Goal:** All CRUD and runner endpoints exist and return correct shapes. No client work yet.

### Step 1.1 — Database setup

- [ ] Create `backend/app/database.py`:
  - SQLAlchemy engine pointing at SQLite
  - `SessionLocal` factory
  - `Base` declarative base
  - `get_db` dependency
  - `init_db()` function to create all tables on startup
- [ ] Call `init_db()` in `main.py` on the `startup` event

### Step 1.2 — ORM Models (`backend/app/models.py`)

Define one class per table. All primary keys are UUIDs generated server-side.

- [ ] `Collection` — id, name, description, created_at, updated_at
- [ ] `Request` — id, collection_id (FK), name, method, url, headers (JSON), params (JSON), body_type, body_content, auth_type, auth_config (JSON), created_at, updated_at
- [ ] `Environment` — id, name, created_at
- [ ] `EnvironmentVariable` — id, environment_id (FK), key, value, enabled
- [ ] `History` — id, method, url, headers (JSON), params (JSON), body_type, body_content, auth_type, auth_config (JSON), status_code, response_time_ms, response_size_bytes, response_headers (JSON), response_body, error, sent_at

> JSON columns: store as `Text`, serialise/deserialise in the router layer using `json.dumps` / `json.loads`.

### Step 1.3 — Pydantic Schemas (`backend/app/schemas.py`)

For each model, define:
- A `Base` schema (shared fields)
- A `Create` schema (input fields only)
- A `Read` schema (full model incl. id, timestamps)
- An `Update` schema (all optional fields) where needed

Schemas needed:
- [ ] `CollectionCreate`, `CollectionRead`, `CollectionUpdate`
- [ ] `RequestCreate`, `RequestRead`, `RequestUpdate`
- [ ] `EnvironmentCreate`, `EnvironmentRead`
- [ ] `EnvironmentVariableCreate`, `EnvironmentVariableRead`
- [ ] `HistoryRead`
- [ ] `RunnerRequestIn`, `RunnerResponseOut`

### Step 1.4 — Collections Router (`routers/collections.py`)

- [ ] `GET /api/collections` — list all collections with their child requests
- [ ] `POST /api/collections` — create collection, return 201
- [ ] `PATCH /api/collections/{id}` — rename (name only)
- [ ] `DELETE /api/collections/{id}` — cascade-delete child requests, return 204

### Step 1.5 — Requests Router (`routers/requests.py`)

- [ ] `POST /api/collections/{id}/requests` — create a new saved request
- [ ] `PUT /api/requests/{id}` — full update of a saved request
- [ ] `DELETE /api/requests/{id}` — delete, return 204

### Step 1.6 — Environments Router (`routers/environments.py`)

- [ ] `GET /api/environments` — list all environments (without variables)
- [ ] `POST /api/environments` — create
- [ ] `PATCH /api/environments/{id}` — rename
- [ ] `DELETE /api/environments/{id}` — cascade-delete variables, return 204
- [ ] `GET /api/environments/{id}/variables` — return variable list for env
- [ ] `PUT /api/environments/{id}/variables` — replace all variables (delete existing, insert new)

### Step 1.7 — History Router (`routers/history.py`)

- [ ] `GET /api/history` — list all, newest first, return summary fields
- [ ] `GET /api/history/{id}` — single entry with full fields (for re-open)
- [ ] `DELETE /api/history/{id}` — delete single entry
- [ ] `DELETE /api/history` — clear all

### Step 1.8 — Runner Router (`routers/runner.py`)

This is the core proxy endpoint.

- [ ] `POST /runner/send` — accept `RunnerRequestIn`:
  1. Resolve any `{{variable}}` patterns if server resolves (client resolves instead — see Phase 4)
  2. Build the outbound HTTP request using **`httpx`** (async client):
     - Set method, URL, headers (array → dict), query params
     - Set body based on `body_type` (`raw`, `form-data`, `urlencoded`, `none`)
     - Inject auth header: `Bearer` → `Authorization: Bearer <token>`, `Basic` → `Authorization: Basic <base64>`
  3. Record start time, execute, record end time
  4. On success: persist history entry, return `RunnerResponseOut`
  5. On `httpx.TimeoutException` or network error: persist error history entry, return error shape
  6. Set a request timeout of 30 seconds

### Step 1.9 — Verify all endpoints

- [ ] Open `http://localhost:8000/docs` (Swagger UI)
- [ ] Manually hit each endpoint with valid payloads and confirm shapes
- [ ] Confirm cascade deletes work for collections → requests and environments → variables

---

## 4. Phase 2 — Client Shell & Layout

**Goal:** The three-panel Postman-like shell renders with navigation working. No real data yet.

### Step 2.1 — Global layout (`frontend/app/layout.tsx`)

- [ ] Set up Tailwind base styles, dark background (`#1a1a2e` or match Postman's dark grey)
- [ ] Wrap app with `QueryClientProvider` (React Query) and `Toaster` (Sonner)
- [ ] Add a `ToastProvider` if not using Sonner globally

### Step 2.2 — Top bar (`components/layout/TopBar.tsx`)

- [ ] Left: Logo / app name "Postman Clone"
- [ ] Centre: `New` button (dispatches "open blank tab" action to store)
- [ ] Right: Environment selector dropdown (placeholder options for now)
- [ ] Right: Avatar / user placeholder (hardcoded "Default User")

### Step 2.3 — Sidebar (`components/layout/Sidebar.tsx`)

- [ ] Two tabs: `Collections` | `History`
- [ ] Toggle between views on click
- [ ] Collections tab: renders empty state "Create your first collection"
- [ ] History tab: renders empty state "Requests you send will appear here"
- [ ] Sidebar is wrapped in a `ResizablePanel` (via `react-resizable-panels`)

### Step 2.4 — Tab bar (`components/layout/TabBar.tsx`)

- [ ] Renders a horizontal list of open request tabs
- [ ] Each tab: method badge + request name (or "New Request") + close `×` button
- [ ] Unsaved tab shows a dot `●` before the name
- [ ] `[+]` button opens a new blank request tab
- [ ] Tabs sourced from Zustand store (see Step 2.6)

### Step 2.5 — Main panel (`components/layout/MainPanel.tsx`)

- [ ] Renders the active tab's `RequestBuilder` + `ResponseViewer` split
- [ ] Split is a vertical `ResizablePanel` (top = request, bottom = response)
- [ ] If no tabs open: show a "Welcome" empty state

### Step 2.6 — Zustand store (`frontend/store/tabStore.ts` and `frontend/store/appStore.ts`)

- [ ] `tabStore`:
  - `tabs: Tab[]` — each tab holds all request state fields
  - `activeTabId: string`
  - Actions: `openTab`, `closeTab`, `setActiveTab`, `updateTab`, `markTabDirty`, `markTabSaved`
- [ ] `appStore`:
  - `selectedEnvironmentId: string | null`
  - `collections: Collection[]`
  - `environments: Environment[]`
  - `history: HistoryEntry[]`
  - Actions: hydrate each on app mount via React Query

### Step 2.7 — Wire up resizable panels

- [ ] `react-resizable-panels` already installed in Step 0.3
- [ ] Sidebar: min width 200px, default 260px, max 400px, drag handle on right edge
- [ ] Request/response split: default 50/50, drag handle between them
- [ ] Panels should maintain their sizes across tab switches (store sizes in `appStore`)

---

## 5. Phase 3 — Request Builder UI

**Goal:** Full request builder renders in the client and state is tracked per-tab in the store.

### Step 3.1 — URL bar (`components/request/UrlBar.tsx`)

- [ ] Method dropdown with options: `GET POST PUT PATCH DELETE HEAD OPTIONS`
  - Each method has a coloured badge (GET=green, POST=yellow, PUT=blue, PATCH=purple, DELETE=red)
- [ ] URL text input — updates tab state on change
- [ ] `Send` button (triggers runner, disabled while loading)
- [ ] `Save` button (opens SaveRequest modal)

### Step 3.2 — Request tab navigation (`components/request/RequestTabs.tsx`)

- [ ] Sub-tabs: `Params | Authorization | Headers | Body | Pre-request Script | Tests`
- [ ] Pre-request Script tab: shows code editor with `// Coming soon` (placeholder)
- [ ] Tests tab: shows code editor with `// Coming soon` (placeholder)

### Step 3.3 — Key-value table (`components/shared/KeyValueTable.tsx`)

Reusable component used for Params, Headers, form-data, urlencoded.

- [ ] Props: `rows`, `onChange`, `placeholder` for key/value columns
- [ ] Each row: enabled checkbox | key input | value input | delete button
- [ ] Last row is always a blank "add new" row
- [ ] Tab key in last cell appends a new blank row
- [ ] Clicking delete removes the row
- [ ] Emits updated rows array on every change

### Step 3.4 — Params tab (`components/request/ParamsTab.tsx`)

- [ ] Renders `KeyValueTable` with current tab's `params`
- [ ] On change: update tab's `params` in store AND sync URL query string in real time
  - Enabled params are appended to the URL; disabled ones are removed
  - Editing the URL directly parses query string back into the params table

### Step 3.5 — Headers tab (`components/request/HeadersTab.tsx`)

- [ ] Renders `KeyValueTable` with current tab's `headers`
- [ ] On change: update tab's `headers` in store

### Step 3.6 — Body tab (`components/request/BodyTab.tsx`)

- [ ] Body type selector: `None | raw | form-data | x-www-form-urlencoded`
- [ ] **None:** renders nothing
- [ ] **raw:** `<textarea>` for body content + language selector (Text | JSON)
  - JSON mode: auto-format button (pretty-prints JSON)
- [ ] **form-data:** `KeyValueTable` for key-value pairs
- [ ] **x-www-form-urlencoded:** `KeyValueTable` for key-value pairs

### Step 3.7 — Authorization tab (`components/request/AuthTab.tsx`)

- [ ] Auth type selector: `None | Bearer Token | Basic Auth`
- [ ] **None:** renders nothing
- [ ] **Bearer Token:** single input for token value
- [ ] **Basic Auth:** username input + password input
- [ ] These values are stored in the tab's `auth_type` + `auth_config` fields

---

## 6. Phase 4 — Request Runner & Response Viewer

**Goal:** Clicking Send fires the request through the server proxy and shows the response.

### Step 4.1 — Variable resolver (`frontend/lib/variableResolver.ts`)

- [ ] `resolveVariables(text: string, variables: EnvVariable[]): string`
  - Replace all `{{key}}` occurrences with matching variable value
  - If no match found, leave as-is
- [ ] Apply resolver to: URL, header values, param values, body content (raw)

### Step 4.2 — API client (`frontend/lib/api.ts`)

- [ ] Create typed `fetch` wrappers for all server endpoints
- [ ] All requests to `http://localhost:8000`
- [ ] `sendRequest(payload: RunnerRequestIn): Promise<RunnerResponseOut>`
- [ ] Error handling: catch network failures and return a normalised error object

### Step 4.3 — Send handler (in tab store or hook)

- [ ] `useSendRequest` hook:
  1. Read current tab state from store
  2. Read selected environment variables from store
  3. Apply `resolveVariables` to URL, headers, params, body
  4. Build auth header client-side before sending:
     - Bearer: add `Authorization: Bearer <token>` to headers array
     - Basic: compute `btoa(username:password)`, add `Authorization: Basic <b64>` header
  5. Call `api.sendRequest(payload)`
  6. Set loading state on tab (disables Send button, shows spinner)
  7. On response: store result in tab's `response` field, clear loading state
  8. History will be auto-recorded by the server

### Step 4.4 — Response viewer (`components/response/ResponseViewer.tsx`)

- [ ] Shows nothing until a request has been sent (initial empty state: "Hit Send to get a response")
- [ ] **Status bar:**
  - `Status: 200 OK` — coloured pill: green (2xx), orange (4xx), red (5xx), grey (error)
  - `Time: 143 ms`
  - `Size: 5.19 KB` (format bytes to KB/MB)
- [ ] **Body tab:**
  - Toggle: `Pretty | Raw`
  - Pretty: syntax-highlighted JSON using `<pre>` + manual colouring or a library like `react-json-view-lite`
  - Raw: plain `<textarea>` (read-only)
- [ ] **Headers tab:** read-only `KeyValueTable` with response headers
- [ ] **Error state:** if `error` is non-null, show error message prominently instead of body/headers

---

## 7. Phase 5 — Collections CRUD

**Goal:** Collections and saved requests are fully manageable from the sidebar.

### Step 5.1 — Collections sidebar (`components/layout/CollectionsSidebar.tsx`)

- [ ] Fetch collections on mount via React Query: `GET /api/collections`
- [ ] Render as tree: collection header → child requests
- [ ] Collection is collapsible (click to expand/collapse)
- [ ] `+` button at top of sidebar → inline name input → Enter confirms → `POST /api/collections`

### Step 5.2 — Collection context menu

- [ ] Right-click (or `…` button on hover) shows dropdown:
  - **Rename:** replaces name with inline input → Enter → `PATCH /api/collections/{id}`
  - **Add Request:** opens SaveRequest modal with this collection pre-selected
  - **Delete:** opens ConfirmDelete modal → `DELETE /api/collections/{id}`
- [ ] On success: invalidate React Query cache for collections, show toast

### Step 5.3 — Request context menu (within a collection)

- [ ] Right-click (or `…` button) on a request item shows:
  - **Rename:** inline input → `PUT /api/requests/{id}` (name only)
  - **Delete:** ConfirmDelete modal → `DELETE /api/requests/{id}`

### Step 5.4 — Open saved request

- [ ] Clicking a request in the sidebar opens a new tab pre-filled with all request fields
- [ ] Tab is linked to the saved request id (so Save updates rather than creates)

### Step 5.5 — Save Request modal (`components/modals/SaveRequestModal.tsx`)

- [ ] Fields: Request Name (text), Collection (dropdown of all collections)
- [ ] Submit: `POST /api/collections/{id}/requests`
- [ ] If tab is editing an existing saved request: Submit button calls `PUT /api/requests/{id}` instead
- [ ] On success: mark tab as saved, show toast "Request saved"

---

## 8. Phase 6 — Environments & Variables

**Goal:** Environments can be created and selected; variables resolve in requests.

### Step 6.1 — Environment selector dropdown (in TopBar)

- [ ] Fetch environments from `GET /api/environments` via React Query
- [ ] Dropdown options: "No Environment" + one entry per environment
- [ ] Selecting an environment stores id in `appStore.selectedEnvironmentId`
- [ ] "Manage Environments" link at bottom of dropdown → opens ManageEnvironments modal

### Step 6.2 — Manage Environments modal (`components/modals/ManageEnvironmentsModal.tsx`)

- [ ] Left panel: list of all environments + "Add Environment" button
  - Clicking an environment selects it in the modal (shows its variables on right)
  - Delete button per environment → ConfirmDelete → `DELETE /api/environments/{id}`
- [ ] Right panel: variable key-value table for the selected environment
  - Columns: enabled checkbox, Key, Value, delete button
  - Changes are tracked locally in component state
  - `Save` button → `PUT /api/environments/{id}/variables`
  - On save: show toast "Environment saved"
- [ ] "Add Environment" button: prompt for name → `POST /api/environments`

### Step 6.3 — Variable resolution at send time

- [ ] In `useSendRequest` hook, after selecting the active environment, fetch its variables via `GET /api/environments/{id}/variables`
- [ ] Pass variables to `resolveVariables` before sending
- [ ] Variables in the URL are visible but unresolved in the input; resolution only happens at send time

---

## 9. Phase 7 — History

**Goal:** Every sent request is logged and browsable; entries can be re-opened or deleted.

### Step 7.1 — History sidebar (`components/layout/HistorySidebar.tsx`)

- [ ] Fetch history from `GET /api/history` via React Query
- [ ] Invalidate query after every send (so history updates automatically)
- [ ] Each entry shows:
  - Method badge (coloured)
  - URL (truncated if long)
  - Status code pill (coloured)
  - Timestamp (relative, e.g. "2 min ago")
- [ ] Empty state: "Requests you send will appear here"

### Step 7.2 — Re-open from history

- [ ] Clicking a history entry fetches `GET /api/history/{id}` to get full details
- [ ] Opens a new unsaved tab pre-filled with all request fields from that entry

### Step 7.3 — Clear history

- [ ] "Clear All" button at top of history tab → ConfirmDelete modal → `DELETE /api/history`
- [ ] Per-entry delete button: `DELETE /api/history/{id}` (no confirmation needed for single entry, or add small icon button)
- [ ] On success: invalidate history query, show toast

---

## 10. Phase 8 — Polish & UX

**Goal:** The app feels like Postman — smooth, responsive, and complete.

### Step 8.1 — Tab management polish

- [ ] Unsaved tab dot indicator: show `●` prefix when `tab.isDirty === true`
- [ ] Closing an unsaved tab (isDirty): show browser `confirm()` or a custom modal "Save changes?" with Save / Discard / Cancel
- [ ] Tab overflow: if many tabs are open, add horizontal scroll on the tab bar

### Step 8.2 — Toast notifications (`sonner`)

Add toasts for all user-facing actions:
- [ ] Collection created / renamed / deleted
- [ ] Request saved / updated / deleted
- [ ] Environment saved / deleted
- [ ] History cleared
- [ ] Send error (network failure)

### Step 8.3 — Shared modals (`components/modals/ConfirmDeleteModal.tsx`)

- [ ] Generic confirm modal: title, message, "Delete" (red) + "Cancel" buttons
- [ ] Used for: delete collection, delete request, delete environment, clear history

### Step 8.4 — Loading states

- [ ] Send button: show spinner and disable while request is in-flight
- [ ] Collections sidebar: show skeleton while loading
- [ ] History sidebar: show skeleton while loading

### Step 8.5 — Empty states

- [ ] Collections tab, no collections: centred message + "Create Collection" button
- [ ] History tab, no history: centred message
- [ ] Response viewer before first send: "Send a request to see the response"

### Step 8.6 — Placeholder / "Coming Soon" sections

Ensure these are visible in the UI:
- [ ] Top bar nav: Team Workspaces, Mock Servers, API Documentation, Monitors → each shows a modal or page with "Coming Soon" banner
- [ ] Authorization tab: always visible even when "None" selected
- [ ] Pre-request Script tab: renders Monaco-style editor (or `<textarea>`) with `// Coming soon`
- [ ] Tests tab: same as above
- [ ] User avatar area: shows "Default User" hardcoded text/avatar

### Step 8.7 — Key-value table keyboard UX

- [ ] Tab key from last field in a row moves to next row's first field
- [ ] Tab key from last field in the last row adds a new blank row

### Step 8.8 — Method badge colours

Apply consistent colours everywhere method is displayed:
- `GET` → green
- `POST` → yellow/orange
- `PUT` → blue
- `PATCH` → purple
- `DELETE` → red
- `HEAD` / `OPTIONS` → grey

---

## 11. Phase 9 — Seed Data & Final Integration

**Goal:** Running the seed script populates the DB so the app is demo-ready on first launch.

### Step 9.1 — Seed script (`backend/app/seed.py`)

Structure:
1. Check if data already exists (skip if seeded)
2. Create collections:
   - [ ] **JSONPlaceholder** with 4 requests (GET posts, GET post/1, POST post, DELETE post/1)
   - [ ] **HTTPBin** with 3 requests (GET /get, POST /post, GET /status/404)
   - [ ] **ReqRes** with 2 requests using `{{baseUrl}}` variable
3. Create environments:
   - [ ] **ReqRes Production** — `baseUrl` = `https://reqres.in/api`
   - [ ] **Local Dev** — `baseUrl` = `http://localhost:3000/api`
4. Create 5 history entries with realistic data:
   - [ ] Mix of JSONPlaceholder and HTTPBin requests
   - [ ] Varying status codes: 200, 201, 404, 200, 200
   - [ ] Realistic `response_time_ms` values (80–350ms)
   - [ ] Realistic `response_size_bytes`

### Step 9.2 — Auto-seed on startup

- [ ] In `main.py` startup event: call `seed.run_seed()` after `init_db()`
- [ ] Seed function is idempotent (safe to call on every restart)

### Step 9.3 — End-to-end smoke test

Walk through each PRD checklist item manually:
- [ ] Open app → collections sidebar shows all 3 seeded collections
- [ ] Click a request → opens in tab with all fields pre-filled
- [ ] Send request → response viewer shows status, time, size, body
- [ ] History tab updates with the new entry
- [ ] Create a new collection → appears in sidebar
- [ ] Save a request → appears under the collection
- [ ] Delete a collection → removed from sidebar (with child requests)
- [ ] Select ReqRes Production environment → set `{{baseUrl}}/users` → Send → resolves correctly
- [ ] Edit environment variables → Save → changes persist
- [ ] Click history entry → opens as new tab
- [ ] Clear history → history tab empty

### Step 9.4 — README

- [ ] Setup instructions (clone → server setup → client setup → run)
- [ ] Architecture overview (diagram from PRD)
- [ ] API endpoint reference table
- [ ] Database schema summary
- [ ] Assumptions section
- [ ] Bonus features status

---

## 12. Phase 10 — Bonus Features (Optional)

Only after all core features pass the smoke test in Phase 9.

### Step 10.1 — Dark mode

- [ ] Add Tailwind `dark:` class variants throughout
- [ ] Toggle in top bar (sun/moon icon)
- [ ] Persist preference in `localStorage`

### Step 10.2 — Import / Export Collections

- [ ] Export: `GET /api/collections/{id}/export` returns Postman Collection v2 JSON
- [ ] Import: `POST /api/collections/import` accepts a Postman Collection v2 JSON file
- [ ] Client: Export button in collection context menu, Import button in sidebar header

### Step 10.3 — Code snippet generation

- [ ] `components/response/CodeSnippetPanel.tsx`
- [ ] Generate cURL, Fetch, and Axios snippets from current request state
- [ ] Copy to clipboard button

### Step 10.4 — Keyboard shortcuts

| Shortcut | Action |
|---|---|
| `Ctrl+Enter` | Send request |
| `Ctrl+S` | Save request |
| `Ctrl+T` | New tab |
| `Ctrl+W` | Close tab |
| `Ctrl+/` | Focus URL bar |

### Step 10.5 — Cookie management

- [ ] New "Cookies" tab in request builder (placeholder or functional)
- [ ] If functional: server stores cookies per domain and re-sends them

---

## 13. Dependency Map

```
Phase 0 (Scaffolding)
    └── Phase 1 (Server / API)
            ├── Phase 4 (Runner) ─────────────────────┐
            └── Phase 2 (Client Shell)                 │
                    └── Phase 3 (Request Builder)       │
                            └── Phase 4 (Runner + Response Viewer) ◄──┘
                                    ├── Phase 5 (Collections)
                                    ├── Phase 6 (Environments)
                                    └── Phase 7 (History)
                                            └── Phase 8 (Polish)
                                                    └── Phase 9 (Seed + Integration)
                                                            └── Phase 10 (Bonus)
```

---

## 14. Definition of Done

A phase is **done** when:

1. All checkboxes in that phase are ticked
2. No TypeScript compiler errors (`tsc --noEmit`)
3. No Python import or runtime errors (`uvicorn` starts cleanly)
4. The specific features of that phase work end-to-end in the browser
5. No regressions in previously completed phases

The overall project is **done** when:

- [ ] All PRD delivery checklist items are satisfied (Section 10 of PRD)
- [ ] The app seeds itself on first run and is immediately usable
- [ ] The README enables a fresh clone to run the app in under 5 minutes
- [ ] The Postman-like 3-panel layout, tab system, and request/response cycle all work correctly

---

*End of Implementation Plan*
