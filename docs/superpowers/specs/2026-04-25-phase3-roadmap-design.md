# Phase 3 Roadmap — Functional Product Design Spec

**Date:** 2026-04-25
**Status:** Approved
**Goal:** Deliver a functional end-to-end product in 4 planning cycles — real auth, persistent workflows, and actual data movement through HTTP/REST, Postgres, and StatCan connectors, deployable via Docker Compose on a local network.

---

## 1. Context and Current State

The vipsOS frontend (Phase 1 + Phase 2, Waves 1–3) is complete:
- Vue 3 + Pinia + Vue Flow workflow studio
- All major UI surfaces implemented with stub data
- Collapsible sidebar, slate+indigo design system, compact layout
- 57 Vitest tests covering all Pinia stores

**What does not yet exist:**
- No backend — all data is in-memory TypeScript stubs
- No real authentication
- No database persistence
- No workflow execution
- No connector runtime

Phase 3 replaces every stub with a real, working system.

---

## 2. Functional Target

By the end of Phase 3D, a user on the local network can:

1. Sign up and log in with a real email/password account
2. Create, save, and reload a workflow across sessions
3. Build a workflow with HTTP/REST, Postgres, and StatCan nodes
4. Run the workflow and watch real data flow through the nodes
5. See structured logs and node-level status in the Runs view
6. Operate the entire system from a single `docker compose up` command

---

## 3. Updated Technology Stack

| Layer | Technology | Notes |
|---|---|---|
| Frontend | Vue 3 + TypeScript + Vite + Pinia + Vue Router + Vue Flow | Unchanged from Phase 2 |
| Control plane API | Bun + Hono | Lightweight, fast, first-class TypeScript |
| Auth | Supabase Auth (local Docker) | JWT, user management, RLS |
| Database | Supabase Postgres (local Docker) | Replaces planned SQLite phase entirely |
| Worker runtime | Bun + TypeScript (Docker container) | Executes workflow graphs |
| Connectors | TypeScript modules | HTTP/REST, Postgres, StatCan |
| Deployment | Docker Compose | All services, local network |
| Unit testing | Vitest + MSW | Existing + expanded |
| API integration testing | Supertest + real local Supabase | Against seeded test DB |
| E2E testing | Playwright | Full Docker Compose stack |
| Container scanning | Trivy | Pre-deploy gate |
| OWASP scanning | OWASP ZAP baseline | Pre-deploy gate |
| Future worker performance | Rust | Post Phase 3D — not in this roadmap |

**Architecture.md update required:** Replace "SQLite for Phase 1, Postgres for MVP Phase" with "Supabase Postgres from Phase 3A onward."

---

## 4. Monorepo Structure (additions)

```
apps/web                        # Vue 3 frontend (existing)
services/
  control-plane/                # Bun + Hono API server
    src/
      routes/                   # auth, workflows, connectors, runs, secrets
      middleware/               # JWT validation, rate limiting, CORS
      db/                       # Supabase client + query helpers
      index.ts                  # Entry point
    Dockerfile
  runtime/                      # Bun worker — executes workflow graphs
    src/
      executor/                 # Graph traversal and node execution
      connectors/
        http-rest/              # Generic HTTP/REST connector
        postgres/               # Postgres query connector
        statcan/                # Statistics Canada WDS API connector
      queue/                    # Job polling / dispatch
      index.ts
    Dockerfile
packages/
  workflow-schema/              # Shared TypeScript types for workflow graphs
  connector-sdk/                # Connector interface definition
docker-compose.yml              # All services: Supabase, control-plane, runtime, frontend
docker-compose.prod.yml         # Production profile (no dev server, built frontend)
.env.example                    # All required env vars documented, no secrets committed
```

---

## 5. Phase 3A — Control Plane

**Deliverable:** Frontend connects to a real backend. Real login, persistent workflows, real sessions. Stub data files removed from `apps/web`.

### 5.1 Control Plane API Routes

| Method | Route | Description |
|---|---|---|
| POST | `/auth/login` | Delegates to Supabase Auth, returns JWT |
| POST | `/auth/logout` | Invalidates session |
| GET | `/auth/me` | Returns current user from JWT |
| GET/POST | `/workflows` | List / create workflows |
| GET/PUT/DELETE | `/workflows/:id` | Get / update / delete workflow |
| GET | `/workflows/:id/versions` | Version history |
| GET/POST | `/connectors` | Installed connectors per workspace |
| GET | `/runs` | Run history (records created in 3B) |
| GET | `/runs/:id` | Run detail + log lines |
| GET/POST | `/secrets` | List / create encrypted secrets |
| DELETE | `/secrets/:id` | Delete secret |

### 5.2 Database Schema (Supabase Postgres)

**workspaces** — `id`, `name`, `created_at`
**users** — managed by Supabase Auth (`auth.users`)
**workspace_members** — `workspace_id`, `user_id`, `role`
**workflows** — `id`, `workspace_id`, `name`, `status` (draft/published/archived), `definition` (JSONB), `version`, `created_at`, `updated_at`
**workflow_versions** — `id`, `workflow_id`, `version`, `definition` (JSONB), `created_at`
**connectors** — `id`, `workspace_id`, `type`, `name`, `config` (JSONB, non-secret fields only)
**runs** — `id`, `workflow_id`, `workspace_id`, `status` (queued/running/success/failed), `started_at`, `finished_at`
**run_logs** — `id`, `run_id`, `node_id`, `level`, `message`, `created_at`
**secrets** — `id`, `workspace_id`, `name`, `encrypted_value`, `created_at`

RLS policies: all tables scoped to `workspace_id` matching the authenticated user's workspace membership.

### 5.3 Frontend Wiring

- Remove all `src/data/*.ts` stub files
- Pinia stores updated to call real API endpoints via a shared `api.ts` client (wraps `fetch`, injects JWT header)
- Login/logout flow wired to real auth endpoints
- Workflow save/load wired to `/workflows`
- `workflow-schema` package imported by both frontend and control plane — single source of truth for graph types

### 5.4 Docker Compose (Phase 3A)

Services:
- `supabase` — official Supabase local stack (auth + Postgres + Studio)
- `control-plane` — Bun + Hono, port 3001
- `frontend` (dev) — Vite dev server, port 5173, proxies `/api` to control-plane

---

## 6. Phase 3B — Execution Runtime

**Deliverable:** A workflow with HTTP/REST, Postgres, and StatCan nodes runs and moves real data. Logs stream back and are visible in the Runs view.

### 6.1 Connector SDK Interface

```typescript
// packages/connector-sdk/src/index.ts
export interface ConnectorConfig {
  type: string
  settings: Record<string, unknown>  // non-secret config
  secrets: Record<string, string>    // injected at dispatch time
}

export interface ConnectorResult {
  success: boolean
  output: Record<string, unknown>
  logs: Array<{ level: 'info' | 'warn' | 'error'; message: string }>
  error?: string
}

export interface Connector {
  id: string
  name: string
  execute(config: ConnectorConfig, inputs: Record<string, unknown>): Promise<ConnectorResult>
}
```

### 6.2 Three Connectors

**HTTP/REST connector**
- Config: `method`, `url`, `headers`, `body`
- Executes an HTTP request, returns `{ status, headers, body }`
- Supports JSON and plain text response parsing

**Postgres connector**
- Config: `connection_string` (from secrets), `query`, `params`
- Executes a parameterized SQL query (no string interpolation — prevents injection)
- Returns `{ rows, rowCount }`

**StatCan connector**
- Config: `table_code` (e.g., `"14-10-0287-01"` for Labour Force Survey), `members` (optional filter)
- Calls `https://www150.statcan.gc.ca/t1/tbl1/en/dtbl/<table_code>/json` (public REST, no auth required)
- Also supports the WDS vector endpoint: `https://www150.statcan.gc.ca/t1/tbl1/en/tv.action?pid=<table_code>` for specific series
- Returns structured rows normalized to: `{ refPer: string, value: number, uom: string, scalar: string }`
- Handles StatCan's response envelope: extracts `vectorDataPoint` array from the WDS JSON wrapper

### 6.3 Worker Execution Model

1. Control plane creates a `run` record (status: `queued`) and enqueues a job
2. Worker polls the control plane for pending jobs (simple HTTP polling, 2s interval — no Redis dependency in Phase 3B)
3. Worker fetches the workflow definition and resolves execution order (topological sort of the node graph)
4. For each node in order: load connector, inject secrets from env, call `connector.execute()`, write output to next node's inputs
5. Each log line POSTed to `/runs/:id/logs` in real time
6. On completion: PATCH `/runs/:id` with final status and `finished_at`

### 6.4 Docker Compose (Phase 3B additions)

- `runtime` service added — Bun worker container, polls control plane
- Secrets injected via Docker environment variables (never in image layers)
- Postgres test database service added for connector testing

---

## 7. Phase 3C — Testing Strategy

**Deliverable:** A layered test suite covering the full stack, runnable locally and in CI.

### 7.1 Layer 1 — Unit Tests (Vitest)

**Frontend (`apps/web`):**
- All existing store tests retained and expanded
- New: API client tests using MSW (Mock Service Worker) to intercept fetch calls
- New: `workflow-schema` validation tests — malformed graphs rejected correctly
- Target: 80%+ branch coverage on all stores and schema utilities

**Control plane (`services/control-plane`):**
- Route handler unit tests with mocked Supabase client
- Middleware tests: JWT validation rejects missing/expired tokens
- Secrets encryption/decryption round-trip test

**Runtime (`services/runtime`):**
- Each connector tested in isolation with a mock HTTP server (http-rest), a local Postgres test container (postgres), and a recorded StatCan response fixture (statcan)
- Executor unit test: correct topological sort of a 4-node graph
- Error propagation test: failed node marks run as failed, remaining nodes not executed

### 7.2 Layer 2 — API Integration Tests (Supertest)

- Run against control plane + real local Supabase (Docker Compose test profile)
- Seeded test database with a test workspace and user
- Tests: full auth flow, workflow CRUD lifecycle, run creation, secret store/retrieve
- Assert: unauthenticated requests return 401, cross-workspace access returns 403
- Torn down and re-seeded between test suites

### 7.3 Layer 3 — End-to-End Tests (Playwright)

**Critical flows covered:**
1. Sign up → log in → land on dashboard
2. Create workflow → add HTTP + Postgres nodes → save → reload → verify persisted
3. Run workflow → see queued → running → success status transitions → open run → see log lines
4. StatCan ingestion flow: configure StatCan node → run → see rows in run output
5. Failure state: misconfigured Postgres connection string → run fails → error visible

**Test environment:** Full `docker-compose.yml` stack (all containers). Playwright launches its own browser against `http://localhost:5173`.

### 7.4 CI Strategy

| Trigger | Tests run |
|---|---|
| Every PR | Unit + API integration (fast, no full Docker stack) |
| Merge to `main` | Unit + API integration + E2E (full Docker Compose) |
| Manual trigger | Full suite + security scans |

**Commands:**
- `npm test` — unit tests only (Vitest, no network)
- `npm run test:integration` — API integration tests (requires Supabase Docker)
- `npm run test:e2e` — Playwright E2E (requires full Docker Compose stack)

---

## 8. Phase 3D — Security and Pre-Deploy Hardening

**Deliverable:** The system is safe to hand to a first external user on the local network. A production Docker Compose profile is ready.

### 8.1 Secrets Management

- Secrets stored encrypted in Postgres: `AES-256-GCM`, encryption key from `SECRETS_KEY` environment variable (never committed)
- Secrets API never returns `encrypted_value` — only name and metadata
- Worker receives secrets as environment variables injected at job dispatch time — not in the job payload
- Every secret access creates an audit log entry (`secrets_audit` table: `secret_id`, `accessor` (run_id), `accessed_at`)

### 8.2 Auth Hardening

- Supabase RLS policies on all tables: every query requires authenticated workspace membership
- Control plane validates JWT on every request via middleware — no route exceptions
- Access tokens: 15-minute expiry; refresh token rotation enabled in Supabase config
- CORS: locked to `ALLOWED_ORIGINS` env var in production profile (no wildcard)
- Rate limiting: 20 requests/minute on `/auth/*` endpoints (Hono rate-limit middleware)
- Headers: `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Strict-Transport-Security` (in production profile)

### 8.3 Dependency and Container Audit

- `npm audit --audit-level=high` runs in CI — build fails on high/critical CVEs
- Trivy scans control plane and runtime Docker images before production profile is declared ready
- Base images: `oven/bun:1-alpine` (control plane + runtime), `node:22-alpine` (if needed)
- No secrets in Dockerfiles, no `.env` files committed — `.env.example` only
- `docker-compose.prod.yml` uses `restart: unless-stopped` and `read_only: true` filesystem where possible

### 8.4 OWASP Checklist

| Threat | Mitigation |
|---|---|
| SQL injection | Parameterized queries enforced in Postgres connector — no string interpolation |
| XSS | Vue's default template escaping + `Content-Security-Policy` header |
| CSRF | Stateless JWT (no cookie sessions) — CSRF not applicable |
| IDOR | Supabase RLS + workspace scoping on all API queries |
| Broken auth | JWT expiry + rotation + rate limiting on auth endpoints |
| Sensitive data exposure | Secrets never in logs, responses, or job payloads |
| Security misconfiguration | Trivy image scan + pre-deploy runbook |

### 8.5 Pre-Deploy Runbook

A `docs/runbook-deploy.md` checklist created as part of this phase:
1. All required env vars set (validated against `.env.example`)
2. `npm audit` passes with no high/critical
3. Trivy scan passes on all images
4. OWASP ZAP baseline scan reports no high-risk findings
5. `docker compose -f docker-compose.prod.yml up` — all health checks green
6. Smoke test: sign up, create workflow, run it, verify logs

---

## 9. Success Criteria

Phase 3 is complete when:

- [ ] `docker compose up` starts the full stack from scratch on a clean machine
- [ ] A user can sign up, log in, and persist a workflow across restarts
- [ ] A workflow with HTTP/REST + Postgres + StatCan nodes executes and moves real data
- [ ] Run logs are visible in real time in the Runs view
- [ ] Unit + integration + E2E test suite all pass
- [ ] `npm audit` reports no high/critical CVEs
- [ ] Trivy reports no critical vulnerabilities in Docker images
- [ ] OWASP ZAP baseline scan reports no high-risk findings
- [ ] Pre-deploy runbook checklist is complete

---

## 10. Out of Scope for Phase 3

- Rust worker (future Phase 4)
- Connector marketplace publishing
- OAuth-based connectors (Salesforce, HubSpot) — requires OAuth flow in control plane
- Multi-region or cloud deployment
- Billing and usage metering (UI exists, backend wiring deferred)
- AI-assisted workflow authoring
- Load testing or performance benchmarking
- External penetration testing
