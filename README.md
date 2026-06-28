# Postman Clone

A browser-based Postman clone where developers can build, send, and inspect real HTTP requests. All outbound requests are proxied through a Python/FastAPI backend to bypass browser CORS restrictions. Collections, environments, and history are persisted in a local SQLite database.

---

## Evaluator Testing Guide

> Open the deployed link — no setup needed. Follow each section below to verify all features.

### What's Pre-loaded

The app auto-seeds on first launch:
- **3 collections** — JSONPlaceholder, HTTPBin, Variable Demo (left sidebar)
- **2 environments** — JSONPlaceholder Env, Local Dev (top-right dropdown)
- **5 history entries** — visible under the History tab immediately

---

### 1. Send a GET Request

1. Click **New** in the top bar — a blank request tab opens
2. Enter this URL in the URL bar:
   ```
   https://jsonplaceholder.typicode.com/posts/1
   ```
3. Click **Send**

**Expected:** Response panel shows `200 OK`, response time in ms, size in KB, and a JSON body with `id`, `title`, `body`, `userId`.

---

### 2. Query Parameters

1. With the tab from step 1 still open, click the **Params** sub-tab
2. Add a new row: key `_limit`, value `3`
3. Notice the URL bar instantly updates to `...posts/1?_limit=3`
4. Click **Send**

**Expected:** Response returns an array of 3 items. Unchecking the row's checkbox removes the param from the URL.

---

### 3. Custom Request Headers

1. Click **New** → enter URL `https://httpbin.org/get`
2. Click the **Headers** sub-tab
3. Add a row: key `X-Evaluator`, value `hello`
4. Click **Send**

**Expected:** `200 OK`. In the JSON response body, look inside `"headers"` — you'll see `"X-Evaluator": "hello"` echoed back by httpbin.

---

### 4. POST Request with JSON Body

1. Click **New** → change method to **POST** using the dropdown
2. Enter URL:
   ```
   https://jsonplaceholder.typicode.com/posts
   ```
3. Click the **Body** sub-tab → select **raw** → choose **JSON** from the language dropdown
4. Paste:
   ```json
   {"title": "Evaluator Test", "body": "Hello", "userId": 1}
   ```
5. Click **Send**

**Expected:** `201 Created` with a response body showing the new resource with an auto-assigned `id: 101`.

---

### 5. Bearer Token Authorization

1. Click **New** → enter URL `https://httpbin.org/bearer`
2. Click the **Authorization** sub-tab
3. Select **Bearer Token** from the auth type list on the left
4. Enter token: `abc123`
5. Click **Send**

**Expected:** `200 OK` with response body:
```json
{ "authenticated": true, "token": "abc123" }
```

---

### 6. Basic Auth Authorization

1. Click **New** → enter URL `https://httpbin.org/basic-auth/user/pass`
2. Click the **Authorization** sub-tab → select **Basic Auth**
3. Enter username: `user`, password: `pass`
4. Click **Send**

**Expected:** `200 OK` with `"authenticated": true`. (Wrong credentials return `401`.)

---

### 7. Collections — Create, Save & Reopen

1. In the left sidebar, click **+** next to the "Collections" heading
2. Type `My Test Collection` and press **Enter** — collection appears in the sidebar
3. Open a new request tab, enter any URL, click **Save**
4. In the modal, enter a request name, select `My Test Collection`, click **Save**
5. Click the collection in the sidebar to expand it — the saved request appears
6. Click the saved request

**Expected:** It reopens in a new tab with all fields (URL, method, headers, etc.) pre-filled exactly as saved.

---

### 8. Rename & Delete (Collections / Requests)

1. Hover over a collection name — a **⋯** (three-dot) button appears
2. Click it → context menu shows **Add Request**, **Rename**, **Delete**
3. Click **Rename** → edit the name inline → press **Enter**
4. Click **⋯** again → **Delete** → confirm in the modal

**Expected:** Name updates immediately on rename. Collection and all its requests are removed on delete.

---

### 9. Environments & `{{variable}}` Resolution

1. Click the top-right environment dropdown → select **JSONPlaceholder Env**
2. In the left sidebar, expand the **Variable Demo** collection
3. Click **List users** — the tab opens with URL `{{baseUrl}}/users`
4. Click **Send**

**Expected:** `{{baseUrl}}` resolves to `https://jsonplaceholder.typicode.com` at send time. Response is `200 OK` with a list of users.

5. Switch the dropdown back to **No Environment** and Send again

**Expected:** Request fails or returns an error because `{{baseUrl}}` is no longer resolved.

---

### 10. Manage Environments — Add a Variable

1. Top-right dropdown → click **Manage Environments**
2. Select **JSONPlaceholder Env** from the left panel
3. In the variable table, add a new row: key `version`, value `v1`
4. Click **Save**
5. Close the modal and reopen it

**Expected:** The `version` variable persists. You can now use `{{version}}` in any request URL or header when this environment is active.

---

### 11. History

1. Send a few requests (any URLs)
2. Click the **History** tab in the left sidebar
3. All sent requests appear grouped by **Today / Yesterday / Older**
4. Click any entry

**Expected:** It reopens as a new tab with the full request restored — URL, method, headers, body, and auth all pre-filled.

5. Hover over an entry → click the **×** icon that appears → confirm

**Expected:** That entry is removed. Click **Clear All** to wipe the entire history.

---

### 12. Search

1. With collections loaded, type `json` in the search bar above the sidebar

**Expected:** Only collections or requests whose name/URL/method contains "json" are shown. Collections auto-expand to reveal matching requests.

2. Switch to the **History** tab and type `GET` in the search bar

**Expected:** History filters to only GET entries in real time.

3. Click the **×** in the search bar

**Expected:** Full list is restored.

---

### 13. Multi-Tab & Dirty State

1. Click **+** three times to open three tabs
2. In one tab, change the URL to anything different
3. Notice a small **orange dot** appears on that tab — this means unsaved changes
4. Click the **×** to close that tab

**Expected:** A dialog appears: **"Unsaved Changes"** with three buttons — **Save**, **Discard**, **Cancel**.
- **Cancel** → dialog closes, tab stays open
- **Discard** → tab closes without saving
- **Save** → Save Request modal opens to persist the request

---

### 14. Pretty / Raw Response Toggle

1. Send `https://jsonplaceholder.typicode.com/posts/1`
2. In the response panel, click **Raw**

**Expected:** Plain unformatted JSON text.

3. Click **Pretty**

**Expected:** Syntax-highlighted, indented JSON with colour-coded keys, strings, numbers, and booleans.

---

### 15. Response Headers

1. After any successful Send, in the response panel click the **Headers** tab (next to **Body**)

**Expected:** A table listing all response headers (e.g. `Content-Type`, `Cache-Control`, `X-Powered-By`).

---

### 16. Light / Dark Mode

1. Click the **sun / moon icon** in the top-right area of the top bar

**Expected:** The entire UI instantly switches between light and dark themes. Refresh the page — the chosen theme is remembered via `localStorage`.

---

## Features

- **Request Builder** — HTTP method selector, URL bar, Params, Headers, Body (raw JSON/text, form-data, urlencoded), Authorization (Bearer, Basic Auth)
- **Request Runner** — Send requests through the server proxy; view status code, response time, response size, body (pretty-printed JSON or raw), and response headers
- **Collections** — Create, rename, and delete collections; save requests into collections; open saved requests in tabs
- **Environments & Variables** — Create named environments with key-value variables; select active environment from the top bar; `{{variableName}}` placeholders resolve at send time
- **History** — Every sent request is auto-logged; re-open any history entry as a new tab; delete individual entries or clear all
- **Multi-tab UI** — Open multiple requests simultaneously; dirty-tab dot indicator; Save/Discard/Cancel dialog on unsaved-tab close
- **Responsive dark theme** — Postman-like three-panel layout built with Tailwind CSS

---

## Tech Stack

| Layer       | Technology                                          |
|-------------|-----------------------------------------------------|
| Frontend    | Next.js 15 · React 19 · TypeScript · Tailwind CSS  |
| State       | Zustand (UI state) · TanStack React Query (server state) |
| Notifications | Sonner (toasts)                                 |
| Backend     | Python · FastAPI · Uvicorn                          |
| ORM         | SQLAlchemy 2.x                                      |
| Database    | SQLite (file: `backend/postman_clone.db`)            |
| HTTP Proxy  | `httpx` — backend sends outbound requests on behalf of the browser |

---

## Architecture

```
Browser (Next.js frontend)
    │
    ├── CRUD calls ──────────► FastAPI backend ──► SQLite
    │   (collections, envs,        │
    │    history, requests)         └── Auto-seeds demo data on first run
    │
    └── Send request ─────────► FastAPI /runner/send ──► External API
                                         │
                                   Returns proxied response
                                   + logs to History table
```

---

## Project Structure

```
Postman-Clone/
├── frontend/                 # Next.js frontend
│   ├── app/                  # Next.js App Router (layout, providers, globals)
│   ├── components/
│   │   ├── layout/           # TopBar, Sidebar, TabBar, MainPanel, CollectionsSidebar, HistorySidebar
│   │   ├── modals/           # SaveRequestModal, ManageEnvironmentsModal, ConfirmDeleteModal
│   │   ├── request/          # RequestBuilder, UrlBar, RequestTabs, ParamsTab, HeadersTab, BodyTab, AuthTab
│   │   ├── response/         # ResponseViewer
│   │   └── shared/           # KeyValueTable
│   ├── hooks/                # useSendRequest
│   ├── lib/                  # api.ts, utils.ts, variableResolver.ts
│   ├── store/                # tabStore.ts (Zustand), appStore.ts (Zustand)
│   └── types/                # index.ts — shared TypeScript interfaces
│
├── backend/                  # FastAPI backend
│   ├── app/
│   │   ├── main.py           # App entry point; lifespan runs init_db + seed
│   │   ├── database.py       # SQLAlchemy engine, session, Base
│   │   ├── models.py         # ORM models (Collection, Request, Environment, History)
│   │   ├── schemas.py        # Pydantic schemas for request/response validation
│   │   ├── seed.py           # Idempotent demo-data seeder
│   │   └── routers/
│   │       ├── collections.py
│   │       ├── requests.py
│   │       ├── environments.py
│   │       ├── history.py
│   │       └── runner.py     # POST /runner/send — proxy + history log
│   └── requirements.txt
│
└── docs/
    ├── PRD.md
    └── IMPLEMENTATION_PLAN.md
```

---

## Setup & Running

### Prerequisites

- **Node.js** 18 or later
- **Python** 3.11 or later

### 1. Backend

```bash
cd backend

# Create and activate a virtual environment
python -m venv .venv

# Windows
.venv\Scripts\activate
# macOS / Linux
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start the backend  (auto-creates DB + seeds demo data on first run)
uvicorn app.main:app --reload
# Backend runs at http://localhost:8000
# Swagger UI at http://localhost:8000/docs
```

### 2. Frontend

```bash
cd frontend

# Install dependencies
npm install

# Start the dev server
npm run dev
# Frontend runs at http://localhost:3000
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Seed Data

On first startup the backend automatically populates the database:

| Type | Name | Contents |
|------|------|----------|
| Collection | **JSONPlaceholder** | GET posts, GET post/1, POST post, DELETE post/1 |
| Collection | **HTTPBin** | GET /get (with query param), POST /post, GET /status/404 |
| Collection | **Variable Demo** | GET `{{baseUrl}}/users`, GET `{{baseUrl}}/users/1` |
| Environment | **JSONPlaceholder Env** | `baseUrl` = `https://jsonplaceholder.typicode.com` |
| Environment | **Local Dev** | `baseUrl` = `http://localhost:3000/api`, `authToken` = `dev-secret-token` |
| History | 5 entries | Mix of JSONPlaceholder & HTTPBin; status codes 200, 200, 201, 404, 200; response times 89–347 ms |

The seed is **idempotent** — safe to call on every restart; it skips if any collection already exists.

---

## API Reference

### Collections

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/collections` | List all collections (with nested requests) |
| POST | `/api/collections` | Create a collection |
| PATCH | `/api/collections/{id}` | Rename a collection |
| DELETE | `/api/collections/{id}` | Delete collection + all its requests |

### Requests

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/collections/{id}/requests` | Add a request to a collection |
| PUT | `/api/requests/{id}` | Update a saved request |
| DELETE | `/api/requests/{id}` | Delete a saved request |

### Environments

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/environments` | List all environments |
| POST | `/api/environments` | Create an environment |
| PATCH | `/api/environments/{id}` | Rename an environment |
| DELETE | `/api/environments/{id}` | Delete environment + all variables |
| GET | `/api/environments/{id}/variables` | Get all variables for an environment |
| PUT | `/api/environments/{id}/variables` | Replace all variables (full replacement) |

### History

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/history` | List all history entries (newest first) |
| GET | `/api/history/{id}` | Get a single history entry |
| DELETE | `/api/history/{id}` | Delete a single entry |
| DELETE | `/api/history` | Clear all history |

### Runner

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/runner/send` | Proxy and execute an HTTP request; auto-logs to history |

**Runner request body:**
```json
{
  "method": "GET",
  "url": "https://api.example.com/data",
  "headers": [{ "key": "Authorization", "value": "Bearer token", "enabled": true }],
  "params": [{ "key": "page", "value": "1", "enabled": true }],
  "body_type": "none",
  "body_content": null,
  "auth_type": "none",
  "auth_config": {}
}
```

### Utility

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check — returns `{"status": "ok"}` |

---

## Database Schema

| Table | Key Columns | Purpose |
|-------|-------------|---------|
| `collections` | `id`, `name`, `description` | Named groups of saved requests |
| `requests` | `id`, `collection_id`, `method`, `url`, `headers`, `params`, `body_type`, `body_content`, `auth_type`, `auth_config` | Saved requests belonging to a collection |
| `environments` | `id`, `name` | Named sets of variables |
| `environment_variables` | `id`, `environment_id`, `key`, `value`, `enabled` | Key-value pairs per environment |
| `history` | `id`, `method`, `url`, `status_code`, `response_time_ms`, `response_size_bytes`, `response_body`, `sent_at` | Auto-logged record of every sent request |

Complex fields (`headers`, `params`, `auth_config`, `response_headers`) are stored as JSON strings in `TEXT` columns.

---

## Assumptions

1. **Single user** — No authentication middleware; a single default user is assumed
2. **Single workspace** — All data lives in one workspace
3. **Proxy-only requests** — The frontend never calls external APIs directly; all requests go through `POST /runner/send`
4. **SQLite scope** — Sufficient for single-user, local-only use
5. **File upload** — `multipart/form-data` file fields are rendered as text inputs (full file upload not implemented)
6. **Variable resolution** — `{{variableName}}` placeholders are resolved client-side at send time using the selected environment's variables; the unresolved URL is shown in the input field

---

## Bonus Features Implemented

| Feature | Status |
|---------|--------|
| Dirty-tab indicator (orange dot) | Done |
| Save/Discard/Cancel dialog on unsaved-tab close | Done |
| Environment variable `{{placeholder}}` resolution | Done |
| Response JSON pretty-printing with syntax highlighting | Done |
| History grouped by Today / Yesterday / Older | Done |
| Skeleton loading states (collections, history) | Done |
| Custom resizable split panel (request / response) | Done |
| Manage Environments modal with inline variable editor | Done |
| "Coming Soon" toasts for unimplemented nav items | Done |
