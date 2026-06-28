# Postman Clone

A browser-based Postman clone where developers can build, send, and inspect real HTTP requests. All outbound requests are proxied through a Python/FastAPI backend to bypass browser CORS restrictions. Collections, environments, and history are persisted in a local SQLite database.

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
| Client      | Next.js 15 · React 19 · TypeScript · Tailwind CSS  |
| State       | Zustand (UI state) · TanStack React Query (server state) |
| Notifications | Sonner (toasts)                                 |
| Server      | Python · FastAPI · Uvicorn                          |
| ORM         | SQLAlchemy 2.x                                      |
| Database    | SQLite (file: `server/postman_clone.db`)            |
| HTTP Proxy  | `httpx` — server sends outbound requests on behalf of the browser |

---

## Architecture

```
Browser (Next.js client)
    │
    ├── CRUD calls ──────────► FastAPI server ──► SQLite
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
├── client/                   # Next.js frontend
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
├── server/                   # FastAPI backend
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

### 1. Server

```bash
cd server

# Create and activate a virtual environment
python -m venv .venv

# Windows
.venv\Scripts\activate
# macOS / Linux
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start the server  (auto-creates DB + seeds demo data on first run)
uvicorn app.main:app --reload
# Server runs at http://localhost:8000
# Swagger UI at http://localhost:8000/docs
```

### 2. Client

```bash
cd client

# Install dependencies
npm install

# Start the dev server
npm run dev
# Client runs at http://localhost:3000
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Seed Data

On first startup the server automatically populates the database:

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
3. **Proxy-only requests** — The client never calls external APIs directly; all requests go through `POST /runner/send`
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
