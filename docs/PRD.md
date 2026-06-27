# Product Requirements Document
## API Client Platform — Postman Clone
**Type:** SDE Fullstack Take-Home Assignment  
**Stack:** Next.js (TypeScript) · FastAPI (Python) · SQLite  
**Version:** 1.0

---

## Table of Contents

1. [Overview](#1-overview)
2. [Tech Stack](#2-tech-stack)
3. [Architecture](#3-architecture)
4. [Database Schema](#4-database-schema)
5. [Feature Specifications](#5-feature-specifications)
   - 5.1 Workspace Layout & Navigation
   - 5.2 Request Builder
   - 5.3 Send Request & Response Viewer
   - 5.4 Collections (CRUD)
   - 5.5 Environments & Variables
   - 5.6 History
   - 5.7 UI / Postman Experience
6. [Mocked / Placeholder Sections](#6-mocked--placeholder-sections)
7. [Bonus Features](#7-bonus-features)
8. [Seed Data](#8-seed-data)
9. [Assumptions](#9-assumptions)
10. [Delivery Checklist](#10-delivery-checklist)

---

## 1. Overview

A browser-based Postman clone where developers can build, send, and inspect real HTTP requests. The app should visually and functionally feel like Postman. Requests are sent through a Python backend proxy (to bypass browser CORS limits). Collections, history, and environments are persisted in SQLite.

---

## 2. Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js with TypeScript |
| Backend | Python with FastAPI or Django |
| Database | SQLite |
| HTTP Proxy | Backend sends outbound requests on behalf of the browser |

No other stack decisions are prescribed by the assignment. Keep library choices simple and standard.

---

## 3. Architecture

```
Browser (Next.js)
    |
    |-- CRUD calls --> FastAPI backend --> SQLite
    |
    |-- Send request --> FastAPI runner --> External API
                              |
                         Returns response to browser
```

The backend has two responsibilities:
1. CRUD API for collections, environments, history
2. A request runner endpoint that executes the actual HTTP call and returns the result

---

## 4. Database Schema

### `collections`
| Column | Type | Notes |
|---|---|---|
| id | TEXT | Primary key (UUID) |
| name | TEXT | Collection name |
| description | TEXT | Optional |
| created_at | DATETIME | |
| updated_at | DATETIME | |

### `requests`
Saved requests that belong to a collection.

| Column | Type | Notes |
|---|---|---|
| id | TEXT | Primary key (UUID) |
| collection_id | TEXT | Foreign key → collections.id |
| name | TEXT | Display name |
| method | TEXT | GET / POST / PUT / PATCH / DELETE / HEAD / OPTIONS |
| url | TEXT | May contain `{{variables}}` |
| headers | JSON | Array of `{key, value, enabled}` |
| params | JSON | Array of `{key, value, enabled}` |
| body_type | TEXT | none / raw / form-data / urlencoded |
| body_content | TEXT | Raw string or serialised form pairs |
| auth_type | TEXT | none / bearer / basic |
| auth_config | JSON | `{token}` or `{username, password}` |
| created_at | DATETIME | |
| updated_at | DATETIME | |

### `environments`
| Column | Type | Notes |
|---|---|---|
| id | TEXT | Primary key (UUID) |
| name | TEXT | e.g. "Production", "Local" |
| created_at | DATETIME | |

### `environment_variables`
| Column | Type | Notes |
|---|---|---|
| id | TEXT | Primary key (UUID) |
| environment_id | TEXT | Foreign key → environments.id |
| key | TEXT | Variable name, e.g. `baseUrl` |
| value | TEXT | Variable value |
| enabled | BOOLEAN | Default true |

### `history`
Auto-recorded on every sent request.

| Column | Type | Notes |
|---|---|---|
| id | TEXT | Primary key (UUID) |
| method | TEXT | |
| url | TEXT | Resolved URL (after variable substitution) |
| headers | JSON | Sent headers |
| params | JSON | Sent query params |
| body_type | TEXT | |
| body_content | TEXT | |
| auth_type | TEXT | |
| auth_config | JSON | |
| status_code | INTEGER | Null on network error |
| response_time_ms | INTEGER | |
| response_size_bytes | INTEGER | |
| response_headers | JSON | |
| response_body | TEXT | |
| error | TEXT | Null on success |
| sent_at | DATETIME | |

---

## 5. Feature Specifications

---

### 5.1 Workspace Layout & Navigation

The app shell must replicate Postman's three-panel layout.

**Layout:**
```
┌──────────────────────────────────────────────────────┐
│  Top bar: Logo | New | [Environment selector ▾]      │
├─────────────────┬────────────────────────────────────┤
│  Sidebar        │  Tab bar: [GET /users ×] [+]       │
│                 ├────────────────────────────────────┤
│  [Collections]  │                                    │
│  [History]      │   Request Builder + Response Panel  │
│                 │                                    │
│  Search bar     │                                    │
│  Collection     │                                    │
│  tree           │                                    │
└─────────────────┴────────────────────────────────────┘
```

**Sidebar — Collections tab:**
- Shows a tree: Collection → Request items
- Each collection has a context menu: Rename, Add Request, Delete
- Each request has a context menu: Rename, Delete

**Sidebar — History tab:**
- Reverse-chronological list of sent requests

**Top bar:**
- Environment selector dropdown (lists all environments + "No Environment")
- New button → opens a blank unsaved request tab

---

### 5.2 Request Builder

**URL bar:**
- Method dropdown: `GET POST PUT PATCH DELETE HEAD OPTIONS`
- URL text input
- Send button
- Save button (opens Save to Collection modal)

**Params tab:**
- Key-value table synced with the URL query string
- Columns: enabled checkbox, Key, Value, delete button
- Checking/unchecking a row adds/removes it from the URL in real time
- Empty row at the bottom to add new entries

**Headers tab:**
- Same key-value table structure as Params

**Body tab:**
Body type selector: `None | raw | form-data | x-www-form-urlencoded`

- **None:** No body UI
- **raw:** Text area or code editor; language selector (Text, JSON)
- **form-data:** Key-value table (Key, Value, delete)
- **x-www-form-urlencoded:** Key-value table (Key, Value, delete)

**Authorization tab:**
Auth type selector: `None | Bearer Token | Basic Auth`

- **None:** Nothing shown
- **Bearer Token:** Single input for token. Auto-injects `Authorization: Bearer <token>` header at send time
- **Basic Auth:** Username and Password inputs. Auto-injects `Authorization: Basic <base64>` at send time

---

### 5.3 Send Request & Response Viewer

**Variable resolution (before sending):**
- Scan URL, header values, param values, and body for `{{variableName}}`
- Replace with values from the currently selected environment
- Unresolved variables: leave as-is

**Backend runner endpoint: `POST /runner/send`**

Request body sent by frontend:
```json
{
  "method": "GET",
  "url": "https://jsonplaceholder.typicode.com/users",
  "headers": [{ "key": "Accept", "value": "application/json", "enabled": true }],
  "params": [],
  "body_type": "none",
  "body_content": null,
  "auth_type": "none",
  "auth_config": {}
}
```

Backend behaviour:
1. Build and execute the HTTP request using an HTTP client library
2. Record the result in the `history` table
3. Return the response to the frontend

Response on success:
```json
{
  "status_code": 200,
  "response_time_ms": 143,
  "response_size_bytes": 5312,
  "headers": { "Content-Type": "application/json" },
  "body": "...",
  "error": null
}
```

Response on failure:
```json
{
  "status_code": null,
  "response_time_ms": 30000,
  "response_size_bytes": 0,
  "headers": {},
  "body": null,
  "error": "Request timed out"
}
```

**Response panel:**

Status bar:
```
Status: 200 OK  |  Time: 143 ms  |  Size: 5.19 KB
```
Status colour: green for 2xx, orange for 4xx, red for 5xx.

Body tab:
- Toggle: Pretty | Raw
- Pretty: JSON syntax highlighted, formatted
- Raw: plain text

Headers tab:
- Read-only table of response headers

Error state:
- Show the error message clearly when the request fails

---

### 5.4 Collections (CRUD)

**Create:**
- Click + in sidebar → inline name input → Enter to confirm
- `POST /api/collections`

**Rename:**
- Double-click name or context menu → Rename
- `PATCH /api/collections/{id}`

**Delete:**
- Context menu → Delete → confirmation
- `DELETE /api/collections/{id}` — deletes all child requests too

**Save request to collection:**
- Click Save in the request builder
- Modal: Request Name, Collection dropdown
- `POST /api/collections/{id}/requests`

**Edit saved request:**
- Click saved request in sidebar → opens in tab with all fields pre-filled
- Changes do not auto-save; user clicks Save
- `PUT /api/requests/{id}`

**Delete saved request:**
- Context menu → Delete
- `DELETE /api/requests/{id}`

---

### 5.5 Environments & Variables

**Manage Environments modal:**
- Opened from the environment selector dropdown
- Lists all environments
- Add Environment button
- Delete environment button

**Variable table (per environment):**
- Columns: enabled checkbox, Key, Value, delete button
- `PUT /api/environments/{id}/variables` — saves all variables at once

**Variable resolution:**
- Pattern: `{{variableName}}` in URL, headers, params, body
- Resolved at send time using the selected environment's variables

**CRUD endpoints:**
- `GET /api/environments` — list all
- `POST /api/environments` — create
- `PATCH /api/environments/{id}` — rename
- `DELETE /api/environments/{id}` — delete (cascade variables)
- `GET /api/environments/{id}/variables` — get variables
- `PUT /api/environments/{id}/variables` — replace all variables

---

### 5.6 History

**Auto-logging:**
- Every request sent through the runner is recorded in history automatically

**History sidebar tab:**
- List of entries, newest first
- Each entry shows: method, URL, status code, timestamp

**Re-open from history:**
- Click an entry → opens a new tab pre-filled with all request fields from that entry

**Clear history:**
- Clear All button with confirmation → `DELETE /api/history`
- Single entry delete → `DELETE /api/history/{id}`

---

### 5.7 UI / Postman Experience

The goal is for the app to feel like Postman, not a generic form-and-fetch tool.

**Tabs:**
- Multiple open requests as tabs
- Unsaved tab shows a dot indicator
- Closing an unsaved tab prompts "Save changes?"

**Resizable panels:**
- Sidebar is resizable (drag handle)
- Request/response split is resizable

**Key-value tables:**
- Same component used for Params, Headers, form-data, urlencoded
- Tab key moves between cells; Tab on last cell adds a new row

**Toasts / notifications:**
- Show brief non-blocking toasts for actions: saved, renamed, deleted, errors

**Modals:**
- Save Request
- Manage Environments
- Confirm Delete

**Empty states:**
- No collections: "Create your first collection" message
- No history: "Requests you send will appear here"

**Loading states:**
- Send button shows loading indicator while request is in-flight

---

## 6. Mocked / Placeholder Sections

These must be visible in the UI but can show a simple "Coming Soon" message:

| Section | Placeholder |
|---|---|
| Team Workspaces | "Coming Soon" |
| Mock Servers | "Coming Soon" |
| API Documentation | "Coming Soon" |
| Monitors | "Coming Soon" |
| User Authentication | Hardcoded default user shown in UI; no login/logout |
| Pre-request Scripts | Tab visible, editor shows `// Coming soon` |
| Test Scripts | Tab visible, editor shows `// Coming soon` |

---

## 7. Bonus Features

Optional. Only implement if core features are fully complete.

- Import / Export collections as Postman Collection v2 JSON
- Code snippet generation (cURL, fetch, etc.)
- Pre-request and test scripts (sandboxed JS execution)
- Cookie management
- Dark mode
- Keyboard shortcuts

---

## 8. Seed Data

Run a seed script on first setup. The app must be immediately usable without manual data entry.

**Collections:**

1. **JSONPlaceholder**
   - GET `https://jsonplaceholder.typicode.com/posts` — "Get All Posts"
   - GET `https://jsonplaceholder.typicode.com/posts/1` — "Get Post by ID"
   - POST `https://jsonplaceholder.typicode.com/posts` — "Create Post"
   - DELETE `https://jsonplaceholder.typicode.com/posts/1` — "Delete Post"

2. **HTTPBin**
   - GET `https://httpbin.org/get` — "Simple GET"
   - POST `https://httpbin.org/post` — "Echo POST Body"
   - GET `https://httpbin.org/status/404` — "404 Error"

3. **ReqRes** (uses environment variable)
   - GET `{{baseUrl}}/users` — "List Users"
   - POST `{{baseUrl}}/users` — "Create User"

**Environments:**

1. **ReqRes Production** — `baseUrl` = `https://reqres.in/api`
2. **Local Dev** — `baseUrl` = `http://localhost:3000/api`

**History:**
- 5 pre-seeded entries pointing at JSONPlaceholder and HTTPBin, with realistic status codes and response times

---

## 9. Assumptions

1. Single user — no auth middleware needed; assume a default logged-in user
2. All data belongs to a single workspace
3. The frontend never calls external APIs directly — all requests go through the backend proxy
4. SQLite is sufficient given the single-user scope
5. File upload in form-data body can be a placeholder input

---

## 10. Delivery Checklist

**Code:**
- [ ] Next.js project with TypeScript
- [ ] FastAPI backend with SQLite
- [ ] Database schema created via migration or init script
- [ ] Seed script populates sample data

**Features:**
- [ ] Workspace shell (sidebar, tabs, top nav, env selector)
- [ ] Request builder (method, URL, params, headers, body, auth)
- [ ] Variable resolution with `{{syntax}}`
- [ ] Send via backend proxy
- [ ] Response viewer (pretty/raw body, headers, status bar)
- [ ] Collections full CRUD
- [ ] Environments full CRUD
- [ ] History auto-log, re-open, clear
- [ ] All placeholder sections visible in UI
- [ ] Toast notifications
- [ ] Resizable panels
- [ ] App seeded and usable on first launch

**Documentation:**
- [ ] README with setup instructions
- [ ] Architecture overview
- [ ] Database schema
- [ ] Assumptions listed

---

*End of PRD*