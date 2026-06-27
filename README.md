# Postman Clone

A browser-based Postman clone where developers can build, send, and inspect real HTTP requests. Requests are proxied through a Python backend to bypass browser CORS limits. Collections, history, and environments are persisted in SQLite.

---

## Tech Stack

| Layer     | Technology                        |
|-----------|-----------------------------------|
| Client    | Next.js 16 (TypeScript, Tailwind) |
| Server    | Python · FastAPI                  |
| Database  | SQLite (via SQLAlchemy)           |
| HTTP Proxy| `httpx` — server sends outbound requests on behalf of the browser |

---

## Architecture

```
Browser (Next.js client)
    |
    |-- CRUD calls --> FastAPI server --> SQLite
    |
    |-- Send request --> FastAPI runner --> External API
                              |
                         Returns response to browser
```

---

## Project Structure

```
Postman-Clone/
├── client/       # Next.js frontend
├── server/       # FastAPI backend
└── docs/         # PRD and implementation plan
```

---

## Setup & Running

### Prerequisites

- Node.js 18+
- Python 3.11+

### 1. Server

```bash
cd server

# Create and activate a virtual environment
python -m venv .venv
# Windows:
.venv\Scripts\activate
# macOS/Linux:
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start the server (runs on http://localhost:8000)
uvicorn app.main:app --reload
```

The server auto-creates the SQLite database and seeds sample data on first run.

Swagger UI: [http://localhost:8000/docs](http://localhost:8000/docs)

### 2. Client

```bash
cd client

# Install dependencies
npm install

# Start the dev server (runs on http://localhost:3000)
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## API Overview

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| GET | `/api/collections` | List all collections |
| POST | `/api/collections` | Create a collection |
| PATCH | `/api/collections/{id}` | Rename a collection |
| DELETE | `/api/collections/{id}` | Delete collection + requests |
| POST | `/api/collections/{id}/requests` | Save a request |
| PUT | `/api/requests/{id}` | Update a saved request |
| DELETE | `/api/requests/{id}` | Delete a saved request |
| GET | `/api/environments` | List all environments |
| POST | `/api/environments` | Create an environment |
| PATCH | `/api/environments/{id}` | Rename an environment |
| DELETE | `/api/environments/{id}` | Delete environment + variables |
| GET | `/api/environments/{id}/variables` | Get environment variables |
| PUT | `/api/environments/{id}/variables` | Replace all variables |
| GET | `/api/history` | List request history |
| GET | `/api/history/{id}` | Get single history entry |
| DELETE | `/api/history/{id}` | Delete a history entry |
| DELETE | `/api/history` | Clear all history |
| POST | `/runner/send` | Proxy and execute an HTTP request |

---

## Database Schema

| Table | Purpose |
|-------|---------|
| `collections` | Named groups of saved requests |
| `requests` | Saved requests belonging to a collection |
| `environments` | Named sets of variables (e.g. Production, Local) |
| `environment_variables` | Key-value pairs per environment |
| `history` | Auto-logged record of every sent request |

---

## Assumptions

1. Single user — no authentication middleware; a default user is assumed
2. All data belongs to a single workspace
3. The client never calls external APIs directly — all requests go through the server proxy
4. SQLite is sufficient for single-user scope
5. File upload in form-data body is a placeholder input

---

## Seed Data

On first startup the server populates:

- **Collections:** JSONPlaceholder, HTTPBin, ReqRes (with `{{baseUrl}}` variable)
- **Environments:** ReqRes Production, Local Dev
- **History:** 5 pre-seeded entries with realistic status codes and response times
