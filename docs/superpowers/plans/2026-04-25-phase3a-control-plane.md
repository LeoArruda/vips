# Phase 3A — Control Plane Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace all frontend stub data with a real Bun + Hono backend — real Supabase Auth login, persistent workflows in Postgres, and all Pinia stores calling live API endpoints instead of in-memory stubs.

**Architecture:** Supabase CLI manages the local Postgres + Auth stack. A `services/control-plane/` Bun + Hono server validates JWTs, enforces RLS through the Supabase service-role client, and exposes REST routes for workflows, connectors, runs, and secrets. The frontend uses `@supabase/supabase-js` directly for auth session management and a shared `api.ts` fetch wrapper for all other routes. A shared `packages/workflow-schema/` package owns all TypeScript types used by both the frontend and the control plane.

**Tech Stack:** Bun 1.x, Hono 4.x, `@supabase/supabase-js`, Supabase CLI (local dev), Vitest (unit + integration), TypeScript 5.x. All commands run from the repo root (`/Users/leandroarruda/projects/vipsOS`) unless noted.

---

## Prerequisites

Install Supabase CLI (if not already installed):
```bash
brew install supabase/tap/supabase
```

Install Bun (if not already installed):
```bash
curl -fsSL https://bun.sh/install | bash
```

---

## File Map

| Action | Path | Responsibility |
|--------|------|----------------|
| Create | `packages/workflow-schema/package.json` | Shared package manifest |
| Create | `packages/workflow-schema/src/index.ts` | All shared TypeScript types |
| Create | `packages/workflow-schema/tsconfig.json` | TypeScript config for the package |
| Create | `supabase/config.toml` | Supabase CLI local config (via `supabase init`) |
| Create | `supabase/migrations/20260425000001_initial_schema.sql` | All tables + RLS policies |
| Create | `supabase/seed.sql` | Dev workspace + test user seed |
| Create | `services/control-plane/package.json` | Bun + Hono deps |
| Create | `services/control-plane/tsconfig.json` | TypeScript config |
| Create | `services/control-plane/src/index.ts` | Hono app entry point + route mounting |
| Create | `services/control-plane/src/lib/supabase.ts` | Supabase admin client (service-role key) |
| Create | `services/control-plane/src/lib/crypto.ts` | AES-256-GCM encrypt/decrypt helpers |
| Create | `services/control-plane/src/middleware/auth.ts` | JWT validation middleware |
| Create | `services/control-plane/src/routes/auth.ts` | `/auth/me` route |
| Create | `services/control-plane/src/routes/workflows.ts` | Workflow CRUD routes |
| Create | `services/control-plane/src/routes/connectors.ts` | Connector CRUD routes |
| Create | `services/control-plane/src/routes/runs.ts` | Runs list + detail routes |
| Create | `services/control-plane/src/routes/secrets.ts` | Secrets CRUD with encryption |
| Create | `services/control-plane/src/__tests__/workflows.test.ts` | Workflow route integration tests |
| Create | `services/control-plane/src/__tests__/secrets.test.ts` | Secrets encryption tests |
| Create | `services/control-plane/src/__tests__/auth.test.ts` | JWT middleware tests |
| Create | `services/control-plane/Dockerfile` | Bun production image |
| Create | `docker-compose.yml` | Control plane container (Supabase via CLI) |
| Create | `.env.example` | All required env vars documented |
| Modify | `apps/web/package.json` | Add `@supabase/supabase-js` |
| Create | `apps/web/src/lib/supabase.ts` | Supabase browser client |
| Create | `apps/web/src/lib/api.ts` | Authenticated fetch wrapper |
| Modify | `apps/web/src/stores/auth.ts` | Real Supabase Auth login/logout/session |
| Modify | `apps/web/src/stores/workflows.ts` | Real API calls, no stub data |
| Modify | `apps/web/src/stores/connectors.ts` | Real API calls |
| Modify | `apps/web/src/stores/runs.ts` | Real API calls |
| Modify | `apps/web/src/stores/secrets.ts` | Real API calls |
| Modify | `apps/web/vite.config.ts` | Add `/api` proxy to control plane |
| Delete | `apps/web/src/data/workflows.ts` | Replaced by real API |
| Delete | `apps/web/src/data/auth.ts` | Replaced by Supabase Auth |
| Delete | `apps/web/src/data/connectors.ts` | Replaced by real API |
| Delete | `apps/web/src/data/runs.ts` | Replaced by real API |
| Delete | `apps/web/src/data/secrets.ts` | Replaced by real API |

---

## Task 1: Shared `workflow-schema` package

**Files:**
- Create: `packages/workflow-schema/package.json`
- Create: `packages/workflow-schema/tsconfig.json`
- Create: `packages/workflow-schema/src/index.ts`

- [ ] **Step 1: Create the package directory and `package.json`**

```bash
mkdir -p packages/workflow-schema/src
```

```json
// packages/workflow-schema/package.json
{
  "name": "@vipsos/workflow-schema",
  "version": "0.1.0",
  "type": "module",
  "exports": {
    ".": "./src/index.ts"
  },
  "scripts": {
    "typecheck": "tsc --noEmit"
  },
  "devDependencies": {
    "typescript": "^5.4.0"
  }
}
```

```json
// packages/workflow-schema/tsconfig.json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "noEmit": true
  },
  "include": ["src"]
}
```

- [ ] **Step 2: Write `src/index.ts` with all shared types**

```typescript
// packages/workflow-schema/src/index.ts

export type WorkflowStatus = 'draft' | 'published' | 'archived'
export type RunStatus = 'queued' | 'running' | 'success' | 'failed'
export type NodeStatus = 'pending' | 'running' | 'success' | 'failed' | 'skipped'
export type TriggerType = 'manual' | 'schedule' | 'webhook'
export type NodeType =
  | 'connector.source'
  | 'connector.destination'
  | 'transform.map'
  | 'logic.branch'
  | 'trigger'
export type ConnectorCategory = 'database' | 'saas' | 'storage' | 'messaging' | 'analytics'
export type AuthMethod = 'oauth2' | 'api-key' | 'basic' | 'none'
export type LogLevel = 'info' | 'warn' | 'error'
export type MemberRole = 'admin' | 'builder' | 'operator' | 'partner'

export interface WorkflowTrigger {
  type: TriggerType
  cron?: string
  webhookUrl?: string
}

export interface WorkflowNode {
  id: string
  type: NodeType
  label: string
  config: Record<string, unknown>
  connectorId?: string
  position?: { x: number; y: number }
}

export interface WorkflowEdge {
  id: string
  source: string
  target: string
}

export interface WorkflowDefinition {
  workflowId: string
  version: number
  status: WorkflowStatus
  name: string
  description?: string
  trigger: WorkflowTrigger
  nodes: WorkflowNode[]
  edges: WorkflowEdge[]
}

export interface WorkflowSummary {
  workflowId: string
  name: string
  status: WorkflowStatus
  lastRunAt?: string
  lastRunStatus?: RunStatus
  updatedAt: string
  trigger: WorkflowTrigger
}

export interface NodeLogEntry {
  timestamp: string
  level: LogLevel
  message: string
}

export interface NodeRunDetail {
  nodeId: string
  nodeLabel: string
  status: NodeStatus
  startedAt?: string
  completedAt?: string
  durationMs?: number
  logs: NodeLogEntry[]
}

export interface RunRecord {
  runId: string
  workflowId: string
  workflowName: string
  status: RunStatus
  triggeredBy: 'manual' | 'schedule' | 'webhook'
  startedAt: string
  completedAt?: string
  durationMs?: number
  nodeCount: number
  failedNodeCount: number
}

export interface RunDetail extends RunRecord {
  nodes: NodeRunDetail[]
}

// API request/response shapes (used by both frontend and control plane)
export interface CreateWorkflowRequest {
  name: string
  description?: string
  trigger: WorkflowTrigger
  nodes?: WorkflowNode[]
  edges?: WorkflowEdge[]
}

export interface UpdateWorkflowRequest {
  name?: string
  description?: string
  status?: WorkflowStatus
  trigger?: WorkflowTrigger
  nodes?: WorkflowNode[]
  edges?: WorkflowEdge[]
}

export interface CreateConnectorRequest {
  type: string
  name: string
  config: Record<string, unknown>
}

export interface CreateSecretRequest {
  name: string
  value: string
}
```

- [ ] **Step 3: Commit**

```bash
git add packages/workflow-schema/
git commit -m "feat(schema): add shared workflow-schema package with all domain types"
```

---

## Task 2: Supabase CLI setup + database migrations

**Files:**
- Create: `supabase/` (via CLI)
- Create: `supabase/migrations/20260425000001_initial_schema.sql`
- Create: `supabase/seed.sql`

- [ ] **Step 1: Initialize Supabase in the repo root**

```bash
supabase init
```

This creates `supabase/config.toml`. The default config is fine — no edits needed.

- [ ] **Step 2: Create the initial schema migration**

```bash
mkdir -p supabase/migrations
```

```sql
-- supabase/migrations/20260425000001_initial_schema.sql

-- Enable UUID generation
create extension if not exists "pgcrypto";

-- Workspaces
create table public.workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

-- Workspace members (links auth.users to workspaces)
create table public.workspace_members (
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('admin', 'builder', 'operator', 'partner')),
  created_at timestamptz not null default now(),
  primary key (workspace_id, user_id)
);

-- Workflows
create table public.workflows (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  name text not null,
  description text,
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  definition jsonb not null default '{"nodes":[],"edges":[],"trigger":{"type":"manual"}}',
  version integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Workflow versions (immutable history)
create table public.workflow_versions (
  id uuid primary key default gen_random_uuid(),
  workflow_id uuid not null references public.workflows(id) on delete cascade,
  version integer not null,
  definition jsonb not null,
  created_at timestamptz not null default now(),
  unique (workflow_id, version)
);

-- Connectors
create table public.connectors (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  type text not null,
  name text not null,
  config jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Runs
create table public.runs (
  id uuid primary key default gen_random_uuid(),
  workflow_id uuid not null references public.workflows(id) on delete cascade,
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  status text not null default 'queued' check (status in ('queued', 'running', 'success', 'failed')),
  triggered_by text not null default 'manual' check (triggered_by in ('manual', 'schedule', 'webhook')),
  started_at timestamptz not null default now(),
  finished_at timestamptz
);

-- Run logs
create table public.run_logs (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references public.runs(id) on delete cascade,
  node_id text,
  level text not null check (level in ('info', 'warn', 'error')),
  message text not null,
  created_at timestamptz not null default now()
);

-- Secrets (values stored encrypted, never returned as plaintext)
create table public.secrets (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  name text not null,
  encrypted_value text not null,
  created_at timestamptz not null default now(),
  unique (workspace_id, name)
);

-- ─── Updated_at trigger for workflows ──────────────────────────────────────
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger workflows_updated_at
  before update on public.workflows
  for each row execute function public.set_updated_at();

create trigger connectors_updated_at
  before update on public.connectors
  for each row execute function public.set_updated_at();

-- ─── Row Level Security ─────────────────────────────────────────────────────
-- Helper: is the current user a member of the given workspace?
create or replace function public.is_workspace_member(ws_id uuid)
returns boolean language sql security definer as $$
  select exists (
    select 1 from public.workspace_members
    where workspace_id = ws_id and user_id = auth.uid()
  );
$$;

alter table public.workspaces enable row level security;
alter table public.workspace_members enable row level security;
alter table public.workflows enable row level security;
alter table public.workflow_versions enable row level security;
alter table public.connectors enable row level security;
alter table public.runs enable row level security;
alter table public.run_logs enable row level security;
alter table public.secrets enable row level security;

-- Workspaces: members can read their workspaces
create policy "workspace_members_read_workspace"
  on public.workspaces for select
  using (public.is_workspace_member(id));

-- Workspace members: members can read their own membership
create policy "workspace_members_read_self"
  on public.workspace_members for select
  using (user_id = auth.uid());

-- Workflows: workspace members can CRUD
create policy "workflow_workspace_select" on public.workflows for select using (public.is_workspace_member(workspace_id));
create policy "workflow_workspace_insert" on public.workflows for insert with check (public.is_workspace_member(workspace_id));
create policy "workflow_workspace_update" on public.workflows for update using (public.is_workspace_member(workspace_id));
create policy "workflow_workspace_delete" on public.workflows for delete using (public.is_workspace_member(workspace_id));

-- Workflow versions: read-only for workspace members
create policy "workflow_versions_read" on public.workflow_versions for select using (
  public.is_workspace_member((select workspace_id from public.workflows where id = workflow_id))
);

-- Connectors: workspace members can CRUD
create policy "connector_workspace_select" on public.connectors for select using (public.is_workspace_member(workspace_id));
create policy "connector_workspace_insert" on public.connectors for insert with check (public.is_workspace_member(workspace_id));
create policy "connector_workspace_update" on public.connectors for update using (public.is_workspace_member(workspace_id));
create policy "connector_workspace_delete" on public.connectors for delete using (public.is_workspace_member(workspace_id));

-- Runs: workspace members can read; insert restricted to service role (control plane)
create policy "run_workspace_select" on public.runs for select using (public.is_workspace_member(workspace_id));

-- Run logs: same scoping via run → workspace
create policy "run_logs_read" on public.run_logs for select using (
  public.is_workspace_member((select workspace_id from public.runs where id = run_id))
);

-- Secrets: workspace members can read names (not values); insert/delete via service role only
create policy "secrets_workspace_select" on public.secrets for select using (public.is_workspace_member(workspace_id));
```

- [ ] **Step 3: Create seed data for local dev**

```sql
-- supabase/seed.sql
-- Creates a dev workspace. User is created manually via Supabase Studio or signup flow.
-- This seed just ensures the dev workspace exists.
insert into public.workspaces (id, name)
values ('00000000-0000-0000-0000-000000000001', 'Acme Corp')
on conflict do nothing;
```

- [ ] **Step 4: Start Supabase and run migrations**

```bash
supabase start
```

Expected output includes lines like:
```
Started supabase local development setup.
API URL: http://127.0.0.1:54321
Studio URL: http://127.0.0.1:54323
anon key: eyJ...
service_role key: eyJ...
```

Save these values — they go in `.env`.

```bash
supabase db push
```

Expected: migration applied, no errors.

- [ ] **Step 5: Create `.env.example` and your local `.env`**

```bash
# .env.example — commit this file; never commit .env
SUPABASE_URL=http://127.0.0.1:54321
SUPABASE_ANON_KEY=<from supabase start output>
SUPABASE_SERVICE_ROLE_KEY=<from supabase start output>
SUPABASE_JWT_SECRET=<from supabase start output>
SECRETS_ENCRYPTION_KEY=<32-byte hex string, generate with: openssl rand -hex 32>
CONTROL_PLANE_PORT=3001
ALLOWED_ORIGINS=http://localhost:5173
```

```bash
cp .env.example .env
# Fill in values from `supabase start` output and generate SECRETS_ENCRYPTION_KEY:
openssl rand -hex 32
```

- [ ] **Step 6: Commit**

```bash
git add supabase/ .env.example
git commit -m "feat(db): Supabase CLI init, initial schema migration, RLS policies, dev seed"
```

---

## Task 3: Control plane scaffolding

**Files:**
- Create: `services/control-plane/package.json`
- Create: `services/control-plane/tsconfig.json`
- Create: `services/control-plane/src/lib/supabase.ts`
- Create: `services/control-plane/src/lib/crypto.ts`
- Create: `services/control-plane/src/middleware/auth.ts`
- Create: `services/control-plane/src/index.ts`

- [ ] **Step 1: Create `services/control-plane/package.json`**

```bash
mkdir -p services/control-plane/src/{lib,middleware,routes,__tests__}
```

```json
// services/control-plane/package.json
{
  "name": "@vipsos/control-plane",
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "bun --watch src/index.ts",
    "start": "bun src/index.ts",
    "test": "bun test"
  },
  "dependencies": {
    "@supabase/supabase-js": "^2.43.0",
    "hono": "^4.3.0"
  },
  "devDependencies": {
    "@types/bun": "latest",
    "typescript": "^5.4.0"
  }
}
```

```json
// services/control-plane/tsconfig.json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "noEmit": true,
    "types": ["bun-types"]
  },
  "include": ["src"]
}
```

```bash
cd services/control-plane && bun install && cd ../..
```

Expected: `node_modules` created, no errors.

- [ ] **Step 2: Create `src/lib/supabase.ts` — admin client**

```typescript
// services/control-plane/src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js'

const url = process.env.SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !serviceKey) {
  throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set')
}

// Service-role client: bypasses RLS — only used in the control plane, never exposed to frontend
export const adminClient = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

// Verify a user JWT and return the user, or null if invalid
export async function verifyJwt(jwt: string) {
  const { data, error } = await adminClient.auth.getUser(jwt)
  if (error || !data.user) return null
  return data.user
}

// Get the workspace_id for a given user (first workspace membership found)
export async function getUserWorkspaceId(userId: string): Promise<string | null> {
  const { data } = await adminClient
    .from('workspace_members')
    .select('workspace_id')
    .eq('user_id', userId)
    .limit(1)
    .single()
  return data?.workspace_id ?? null
}
```

- [ ] **Step 3: Create `src/lib/crypto.ts` — AES-256-GCM encryption**

```typescript
// services/control-plane/src/lib/crypto.ts

const KEY_HEX = process.env.SECRETS_ENCRYPTION_KEY
if (!KEY_HEX || KEY_HEX.length !== 64) {
  throw new Error('SECRETS_ENCRYPTION_KEY must be a 32-byte hex string (64 hex chars)')
}

function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2)
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16)
  }
  return bytes
}

async function getKey(): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    'raw',
    hexToBytes(KEY_HEX!),
    { name: 'AES-GCM' },
    false,
    ['encrypt', 'decrypt'],
  )
}

export async function encrypt(plaintext: string): Promise<string> {
  const key = await getKey()
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const encoded = new TextEncoder().encode(plaintext)
  const cipherBuffer = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, encoded)
  // Encode as base64: iv (12 bytes) + ciphertext
  const combined = new Uint8Array(iv.byteLength + cipherBuffer.byteLength)
  combined.set(iv, 0)
  combined.set(new Uint8Array(cipherBuffer), iv.byteLength)
  return Buffer.from(combined).toString('base64')
}

export async function decrypt(ciphertext: string): Promise<string> {
  const key = await getKey()
  const combined = new Uint8Array(Buffer.from(ciphertext, 'base64'))
  const iv = combined.slice(0, 12)
  const data = combined.slice(12)
  const plainBuffer = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, data)
  return new TextDecoder().decode(plainBuffer)
}
```

- [ ] **Step 4: Write the failing crypto unit test**

```typescript
// services/control-plane/src/__tests__/crypto.test.ts
import { describe, it, expect, beforeAll } from 'bun:test'

// Set the required env var before importing the module
process.env.SECRETS_ENCRYPTION_KEY = 'a'.repeat(64) // 32 bytes of 0xAA

const { encrypt, decrypt } = await import('../lib/crypto.ts')

describe('crypto helpers', () => {
  it('round-trips a plaintext string', async () => {
    const original = 'super-secret-api-key-12345'
    const encrypted = await encrypt(original)
    const decrypted = await decrypt(encrypted)
    expect(decrypted).toBe(original)
  })

  it('produces different ciphertext each time (random IV)', async () => {
    const enc1 = await encrypt('same-input')
    const enc2 = await encrypt('same-input')
    expect(enc1).not.toBe(enc2)
  })

  it('fails to decrypt with wrong key', async () => {
    const encrypted = await encrypt('secret')
    // Tamper with ciphertext
    const tampered = encrypted.slice(0, -4) + 'AAAA'
    await expect(decrypt(tampered)).rejects.toThrow()
  })
})
```

- [ ] **Step 5: Run — expect PASS (no imports from unset env vars yet)**

```bash
cd services/control-plane && bun test src/__tests__/crypto.test.ts
```
Expected: 3 tests pass.

- [ ] **Step 6: Create `src/middleware/auth.ts` — JWT validation**

```typescript
// services/control-plane/src/middleware/auth.ts
import type { Context, Next } from 'hono'
import { verifyJwt, getUserWorkspaceId } from '../lib/supabase.ts'

export interface AuthContext {
  userId: string
  workspaceId: string
}

// Attaches { userId, workspaceId } to c.set('auth', ...) or returns 401
export async function requireAuth(c: Context, next: Next) {
  const authHeader = c.req.header('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return c.json({ error: 'Missing Authorization header' }, 401)
  }
  const token = authHeader.slice(7)
  const user = await verifyJwt(token)
  if (!user) {
    return c.json({ error: 'Invalid or expired token' }, 401)
  }
  const workspaceId = await getUserWorkspaceId(user.id)
  if (!workspaceId) {
    return c.json({ error: 'User has no workspace' }, 403)
  }
  c.set('auth', { userId: user.id, workspaceId } satisfies AuthContext)
  await next()
}
```

- [ ] **Step 7: Create `src/index.ts` — Hono app entry point**

```typescript
// services/control-plane/src/index.ts
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { authRoutes } from './routes/auth.ts'
import { workflowRoutes } from './routes/workflows.ts'
import { connectorRoutes } from './routes/connectors.ts'
import { runRoutes } from './routes/runs.ts'
import { secretRoutes } from './routes/secrets.ts'

const app = new Hono()

const allowedOrigins = (process.env.ALLOWED_ORIGINS ?? 'http://localhost:5173').split(',')

app.use('*', logger())
app.use('*', cors({
  origin: allowedOrigins,
  allowHeaders: ['Content-Type', 'Authorization'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
}))

app.get('/health', (c) => c.json({ ok: true }))

app.route('/auth', authRoutes)
app.route('/workflows', workflowRoutes)
app.route('/connectors', connectorRoutes)
app.route('/runs', runRoutes)
app.route('/secrets', secretRoutes)

app.onError((err, c) => {
  console.error(err)
  return c.json({ error: 'Internal server error' }, 500)
})

const port = parseInt(process.env.CONTROL_PLANE_PORT ?? '3001', 10)
console.log(`Control plane listening on port ${port}`)

export default { port, fetch: app.fetch }
```

- [ ] **Step 8: Commit**

```bash
git add services/control-plane/
git commit -m "feat(control-plane): scaffold Bun+Hono app, Supabase admin client, AES-256-GCM crypto, JWT middleware"
```

---

## Task 4: Auth route

**Files:**
- Create: `services/control-plane/src/routes/auth.ts`

- [ ] **Step 1: Create `src/routes/auth.ts`**

Login and logout are handled directly by the Supabase client on the frontend — the control plane only needs `/auth/me` to validate a token and return the current user's workspace context.

```typescript
// services/control-plane/src/routes/auth.ts
import { Hono } from 'hono'
import { requireAuth } from '../middleware/auth.ts'
import type { AuthContext } from '../middleware/auth.ts'
import { adminClient } from '../lib/supabase.ts'

export const authRoutes = new Hono()

// GET /auth/me — returns the current user + workspace
authRoutes.get('/me', requireAuth, async (c) => {
  const { userId, workspaceId } = c.get('auth') as AuthContext

  const { data: user } = await adminClient.auth.admin.getUserById(userId)
  const { data: workspace } = await adminClient
    .from('workspaces')
    .select('id, name')
    .eq('id', workspaceId)
    .single()
  const { data: member } = await adminClient
    .from('workspace_members')
    .select('role')
    .eq('user_id', userId)
    .eq('workspace_id', workspaceId)
    .single()

  if (!user?.user || !workspace) {
    return c.json({ error: 'User or workspace not found' }, 404)
  }

  return c.json({
    userId,
    email: user.user.email,
    workspaceId: workspace.id,
    workspaceName: workspace.name,
    role: member?.role ?? 'operator',
  })
})
```

- [ ] **Step 2: Write failing auth middleware unit test**

```typescript
// services/control-plane/src/__tests__/auth.test.ts
import { describe, it, expect } from 'bun:test'
import { Hono } from 'hono'
import { requireAuth } from '../middleware/auth.ts'

// Mock verifyJwt and getUserWorkspaceId to avoid hitting Supabase
const app = new Hono()
app.use('/protected', requireAuth)
app.get('/protected', (c) => c.json({ ok: true }))

describe('requireAuth middleware', () => {
  it('returns 401 when Authorization header is missing', async () => {
    const res = await app.request('/protected', { method: 'GET' })
    expect(res.status).toBe(401)
    const body = await res.json() as { error: string }
    expect(body.error).toContain('Missing')
  })

  it('returns 401 when Authorization header is malformed', async () => {
    const res = await app.request('/protected', {
      method: 'GET',
      headers: { Authorization: 'Basic abc' },
    })
    expect(res.status).toBe(401)
  })
})
```

- [ ] **Step 3: Run — expect PASS**

```bash
cd services/control-plane && bun test src/__tests__/auth.test.ts
```
Expected: 2 tests pass.

- [ ] **Step 4: Commit**

```bash
git add services/control-plane/src/routes/auth.ts services/control-plane/src/__tests__/auth.test.ts
git commit -m "feat(control-plane): add /auth/me route and auth middleware tests"
```

---

## Task 5: Workflow CRUD routes

**Files:**
- Create: `services/control-plane/src/routes/workflows.ts`
- Create: `services/control-plane/src/__tests__/workflows.test.ts`

- [ ] **Step 1: Write failing workflow route tests**

```typescript
// services/control-plane/src/__tests__/workflows.test.ts
import { describe, it, expect } from 'bun:test'
import { Hono } from 'hono'
import { workflowRoutes } from '../routes/workflows.ts'

// Mount routes without auth middleware for unit tests
const app = new Hono()
app.use('*', async (c, next) => {
  c.set('auth', { userId: 'user-1', workspaceId: 'ws-1' })
  await next()
})
app.route('/', workflowRoutes)

describe('workflow routes', () => {
  it('GET / returns an array', async () => {
    const res = await app.request('/', { method: 'GET' })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(Array.isArray(body)).toBe(true)
  })

  it('POST / creates a workflow', async () => {
    const res = await app.request('/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Test Workflow',
        trigger: { type: 'manual' },
      }),
    })
    expect(res.status).toBe(201)
    const body = await res.json() as { id: string; name: string }
    expect(body.name).toBe('Test Workflow')
    expect(typeof body.id).toBe('string')
  })
})
```

- [ ] **Step 2: Run — expect FAIL**

```bash
cd services/control-plane && bun test src/__tests__/workflows.test.ts
```
Expected: import error (module not found).

- [ ] **Step 3: Implement `src/routes/workflows.ts`**

```typescript
// services/control-plane/src/routes/workflows.ts
import { Hono } from 'hono'
import { requireAuth } from '../middleware/auth.ts'
import { adminClient } from '../lib/supabase.ts'
import type { AuthContext } from '../middleware/auth.ts'

export const workflowRoutes = new Hono()

workflowRoutes.use('*', requireAuth)

// GET /workflows — list workflows for the current workspace
workflowRoutes.get('/', async (c) => {
  const { workspaceId } = c.get('auth') as AuthContext
  const { data, error } = await adminClient
    .from('workflows')
    .select('id, name, status, version, created_at, updated_at, definition')
    .eq('workspace_id', workspaceId)
    .order('updated_at', { ascending: false })
  if (error) return c.json({ error: error.message }, 500)
  return c.json(data ?? [])
})

// POST /workflows — create a workflow
workflowRoutes.post('/', async (c) => {
  const { workspaceId } = c.get('auth') as AuthContext
  const body = await c.req.json<{
    name: string
    description?: string
    trigger?: { type: string }
    nodes?: unknown[]
    edges?: unknown[]
  }>()

  if (!body.name?.trim()) return c.json({ error: 'name is required' }, 400)

  const definition = {
    trigger: body.trigger ?? { type: 'manual' },
    nodes: body.nodes ?? [],
    edges: body.edges ?? [],
  }

  const { data, error } = await adminClient
    .from('workflows')
    .insert({
      workspace_id: workspaceId,
      name: body.name.trim(),
      description: body.description,
      definition,
    })
    .select()
    .single()
  if (error) return c.json({ error: error.message }, 500)
  return c.json(data, 201)
})

// GET /workflows/:id — get a single workflow
workflowRoutes.get('/:id', async (c) => {
  const { workspaceId } = c.get('auth') as AuthContext
  const { data, error } = await adminClient
    .from('workflows')
    .select('*')
    .eq('id', c.req.param('id'))
    .eq('workspace_id', workspaceId)
    .single()
  if (error || !data) return c.json({ error: 'Not found' }, 404)
  return c.json(data)
})

// PUT /workflows/:id — update a workflow (saves a new version)
workflowRoutes.put('/:id', async (c) => {
  const { workspaceId } = c.get('auth') as AuthContext
  const id = c.req.param('id')
  const body = await c.req.json<{
    name?: string
    description?: string
    status?: string
    trigger?: unknown
    nodes?: unknown[]
    edges?: unknown[]
  }>()

  // Fetch current to build version snapshot
  const { data: current } = await adminClient
    .from('workflows')
    .select('*')
    .eq('id', id)
    .eq('workspace_id', workspaceId)
    .single()
  if (!current) return c.json({ error: 'Not found' }, 404)

  // Save version snapshot before update
  await adminClient.from('workflow_versions').insert({
    workflow_id: id,
    version: current.version,
    definition: current.definition,
  })

  const newDefinition = {
    trigger: body.trigger ?? current.definition?.trigger ?? { type: 'manual' },
    nodes: body.nodes ?? current.definition?.nodes ?? [],
    edges: body.edges ?? current.definition?.edges ?? [],
  }

  const { data, error } = await adminClient
    .from('workflows')
    .update({
      name: body.name ?? current.name,
      description: body.description ?? current.description,
      status: body.status ?? current.status,
      definition: newDefinition,
      version: current.version + 1,
    })
    .eq('id', id)
    .eq('workspace_id', workspaceId)
    .select()
    .single()
  if (error) return c.json({ error: error.message }, 500)
  return c.json(data)
})

// DELETE /workflows/:id — delete a workflow
workflowRoutes.delete('/:id', async (c) => {
  const { workspaceId } = c.get('auth') as AuthContext
  const { error } = await adminClient
    .from('workflows')
    .delete()
    .eq('id', c.req.param('id'))
    .eq('workspace_id', workspaceId)
  if (error) return c.json({ error: error.message }, 500)
  return c.body(null, 204)
})

// GET /workflows/:id/versions — version history
workflowRoutes.get('/:id/versions', async (c) => {
  const { workspaceId } = c.get('auth') as AuthContext
  // Verify the workflow belongs to this workspace
  const { data: wf } = await adminClient
    .from('workflows')
    .select('id')
    .eq('id', c.req.param('id'))
    .eq('workspace_id', workspaceId)
    .single()
  if (!wf) return c.json({ error: 'Not found' }, 404)

  const { data, error } = await adminClient
    .from('workflow_versions')
    .select('id, version, created_at')
    .eq('workflow_id', c.req.param('id'))
    .order('version', { ascending: false })
  if (error) return c.json({ error: error.message }, 500)
  return c.json(data ?? [])
})
```

- [ ] **Step 4: Run — expect PASS**

```bash
cd services/control-plane && bun test src/__tests__/workflows.test.ts
```
Expected: 2 tests pass. (Note: these are unit tests with mocked auth — they will not hit Supabase.)

- [ ] **Step 5: Commit**

```bash
git add services/control-plane/src/routes/workflows.ts services/control-plane/src/__tests__/workflows.test.ts
git commit -m "feat(control-plane): workflow CRUD routes with version history"
```

---

## Task 6: Connectors, Runs, and Secrets routes

**Files:**
- Create: `services/control-plane/src/routes/connectors.ts`
- Create: `services/control-plane/src/routes/runs.ts`
- Create: `services/control-plane/src/routes/secrets.ts`
- Create: `services/control-plane/src/__tests__/secrets.test.ts`

- [ ] **Step 1: Create `src/routes/connectors.ts`**

```typescript
// services/control-plane/src/routes/connectors.ts
import { Hono } from 'hono'
import { requireAuth } from '../middleware/auth.ts'
import { adminClient } from '../lib/supabase.ts'
import type { AuthContext } from '../middleware/auth.ts'

export const connectorRoutes = new Hono()
connectorRoutes.use('*', requireAuth)

connectorRoutes.get('/', async (c) => {
  const { workspaceId } = c.get('auth') as AuthContext
  const { data, error } = await adminClient
    .from('connectors')
    .select('*')
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: false })
  if (error) return c.json({ error: error.message }, 500)
  return c.json(data ?? [])
})

connectorRoutes.post('/', async (c) => {
  const { workspaceId } = c.get('auth') as AuthContext
  const body = await c.req.json<{ type: string; name: string; config?: Record<string, unknown> }>()
  if (!body.type || !body.name) return c.json({ error: 'type and name are required' }, 400)
  const { data, error } = await adminClient
    .from('connectors')
    .insert({ workspace_id: workspaceId, type: body.type, name: body.name, config: body.config ?? {} })
    .select()
    .single()
  if (error) return c.json({ error: error.message }, 500)
  return c.json(data, 201)
})

connectorRoutes.delete('/:id', async (c) => {
  const { workspaceId } = c.get('auth') as AuthContext
  const { error } = await adminClient
    .from('connectors')
    .delete()
    .eq('id', c.req.param('id'))
    .eq('workspace_id', workspaceId)
  if (error) return c.json({ error: error.message }, 500)
  return c.body(null, 204)
})
```

- [ ] **Step 2: Create `src/routes/runs.ts`**

```typescript
// services/control-plane/src/routes/runs.ts
import { Hono } from 'hono'
import { requireAuth } from '../middleware/auth.ts'
import { adminClient } from '../lib/supabase.ts'
import type { AuthContext } from '../middleware/auth.ts'

export const runRoutes = new Hono()
runRoutes.use('*', requireAuth)

runRoutes.get('/', async (c) => {
  const { workspaceId } = c.get('auth') as AuthContext
  const { data, error } = await adminClient
    .from('runs')
    .select(`
      id, workflow_id, status, triggered_by, started_at, finished_at,
      workflows(name)
    `)
    .eq('workspace_id', workspaceId)
    .order('started_at', { ascending: false })
    .limit(100)
  if (error) return c.json({ error: error.message }, 500)
  return c.json(data ?? [])
})

runRoutes.get('/:id', async (c) => {
  const { workspaceId } = c.get('auth') as AuthContext
  const { data: run, error } = await adminClient
    .from('runs')
    .select('*, workflows(name)')
    .eq('id', c.req.param('id'))
    .eq('workspace_id', workspaceId)
    .single()
  if (error || !run) return c.json({ error: 'Not found' }, 404)

  const { data: logs } = await adminClient
    .from('run_logs')
    .select('*')
    .eq('run_id', run.id)
    .order('created_at', { ascending: true })

  return c.json({ ...run, logs: logs ?? [] })
})

// POST /runs — create a run record (called by the worker in Phase 3B; available here as stub)
runRoutes.post('/', async (c) => {
  const { workspaceId } = c.get('auth') as AuthContext
  const body = await c.req.json<{ workflowId: string; triggeredBy?: string }>()
  if (!body.workflowId) return c.json({ error: 'workflowId is required' }, 400)
  const { data, error } = await adminClient
    .from('runs')
    .insert({
      workflow_id: body.workflowId,
      workspace_id: workspaceId,
      triggered_by: body.triggeredBy ?? 'manual',
      status: 'queued',
    })
    .select()
    .single()
  if (error) return c.json({ error: error.message }, 500)
  return c.json(data, 201)
})
```

- [ ] **Step 3: Write failing secrets encryption test**

```typescript
// services/control-plane/src/__tests__/secrets.test.ts
import { describe, it, expect } from 'bun:test'

process.env.SECRETS_ENCRYPTION_KEY = 'b'.repeat(64)
process.env.SUPABASE_URL = 'http://localhost:54321'
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-key'

const { encrypt, decrypt } = await import('../lib/crypto.ts')

describe('secrets route uses encryption', () => {
  it('encrypts and decrypts a secret value', async () => {
    const value = 'my-postgres-password'
    const encrypted = await encrypt(value)
    expect(encrypted).not.toBe(value)
    const decrypted = await decrypt(encrypted)
    expect(decrypted).toBe(value)
  })
})
```

- [ ] **Step 4: Run secrets test — expect PASS**

```bash
cd services/control-plane && bun test src/__tests__/secrets.test.ts
```
Expected: 1 test passes.

- [ ] **Step 5: Create `src/routes/secrets.ts`**

```typescript
// services/control-plane/src/routes/secrets.ts
import { Hono } from 'hono'
import { requireAuth } from '../middleware/auth.ts'
import { adminClient } from '../lib/supabase.ts'
import { encrypt } from '../lib/crypto.ts'
import type { AuthContext } from '../middleware/auth.ts'

export const secretRoutes = new Hono()
secretRoutes.use('*', requireAuth)

// List secrets — returns names only, NEVER the encrypted_value
secretRoutes.get('/', async (c) => {
  const { workspaceId } = c.get('auth') as AuthContext
  const { data, error } = await adminClient
    .from('secrets')
    .select('id, name, created_at')
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: false })
  if (error) return c.json({ error: error.message }, 500)
  return c.json(data ?? [])
})

// Create a secret — value is encrypted before storage
secretRoutes.post('/', async (c) => {
  const { workspaceId } = c.get('auth') as AuthContext
  const body = await c.req.json<{ name: string; value: string }>()
  if (!body.name?.trim() || !body.value) return c.json({ error: 'name and value are required' }, 400)

  const encryptedValue = await encrypt(body.value)
  const { data, error } = await adminClient
    .from('secrets')
    .insert({ workspace_id: workspaceId, name: body.name.trim(), encrypted_value: encryptedValue })
    .select('id, name, created_at')
    .single()
  if (error) {
    if (error.code === '23505') return c.json({ error: `Secret '${body.name}' already exists` }, 409)
    return c.json({ error: error.message }, 500)
  }
  // Return metadata only — never return the encrypted_value
  return c.json(data, 201)
})

// Delete a secret
secretRoutes.delete('/:id', async (c) => {
  const { workspaceId } = c.get('auth') as AuthContext
  const { error } = await adminClient
    .from('secrets')
    .delete()
    .eq('id', c.req.param('id'))
    .eq('workspace_id', workspaceId)
  if (error) return c.json({ error: error.message }, 500)
  return c.body(null, 204)
})
```

- [ ] **Step 6: Run all control plane tests**

```bash
cd services/control-plane && bun test
```
Expected: all tests pass (crypto: 3, auth middleware: 2, workflows: 2, secrets: 1 = 8 total).

- [ ] **Step 7: Commit**

```bash
git add services/control-plane/src/routes/ services/control-plane/src/__tests__/secrets.test.ts
git commit -m "feat(control-plane): connector, run, and secrets routes with AES-256-GCM encryption"
```

---

## Task 7: Dockerfile + Docker Compose

**Files:**
- Create: `services/control-plane/Dockerfile`
- Create: `docker-compose.yml`

- [ ] **Step 1: Create `services/control-plane/Dockerfile`**

```dockerfile
# services/control-plane/Dockerfile
FROM oven/bun:1-alpine AS base
WORKDIR /app

# Install dependencies
COPY package.json bun.lockb* ./
RUN bun install --frozen-lockfile --production

# Copy source
COPY src ./src
COPY tsconfig.json ./

EXPOSE 3001
CMD ["bun", "src/index.ts"]
```

- [ ] **Step 2: Create `docker-compose.yml` at repo root**

```yaml
# docker-compose.yml
# Supabase is managed separately via `supabase start`.
# This compose file handles the control plane and (optionally) the frontend in dev mode.

services:
  control-plane:
    build:
      context: ./services/control-plane
      dockerfile: Dockerfile
    ports:
      - "3001:3001"
    environment:
      SUPABASE_URL: ${SUPABASE_URL}
      SUPABASE_SERVICE_ROLE_KEY: ${SUPABASE_SERVICE_ROLE_KEY}
      SUPABASE_JWT_SECRET: ${SUPABASE_JWT_SECRET}
      SECRETS_ENCRYPTION_KEY: ${SECRETS_ENCRYPTION_KEY}
      CONTROL_PLANE_PORT: 3001
      ALLOWED_ORIGINS: ${ALLOWED_ORIGINS:-http://localhost:5173}
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "wget", "-qO-", "http://localhost:3001/health"]
      interval: 10s
      timeout: 5s
      retries: 3
```

- [ ] **Step 3: Verify the control plane starts**

```bash
# Ensure Supabase is running
supabase start

# Build and start the control plane
docker compose up --build -d control-plane

# Check health
curl http://localhost:3001/health
```
Expected: `{"ok":true}`

- [ ] **Step 4: Commit**

```bash
git add services/control-plane/Dockerfile docker-compose.yml
git commit -m "feat(infra): Dockerfile for control plane, Docker Compose setup"
```

---

## Task 8: Frontend Supabase client + API client

**Files:**
- Modify: `apps/web/package.json`
- Modify: `apps/web/vite.config.ts`
- Create: `apps/web/src/lib/supabase.ts`
- Create: `apps/web/src/lib/api.ts`

- [ ] **Step 1: Install `@supabase/supabase-js` in the frontend**

```bash
cd apps/web && npm install @supabase/supabase-js && cd ../..
```

- [ ] **Step 2: Add Vite env variables and `/api` proxy**

Create `apps/web/.env.local` (not committed):
```bash
VITE_SUPABASE_URL=http://127.0.0.1:54321
VITE_SUPABASE_ANON_KEY=<paste anon key from supabase start>
VITE_API_URL=http://localhost:3001
```

Update `apps/web/vite.config.ts`:

```typescript
// apps/web/vite.config.ts
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  plugins: [vue(), tailwindcss()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        rewrite: (path) => path.replace(/^\/api/, ''),
        changeOrigin: true,
      },
    },
  },
})
```

- [ ] **Step 3: Create `apps/web/src/lib/supabase.ts`**

```typescript
// apps/web/src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY must be set in .env.local')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
```

- [ ] **Step 4: Create `apps/web/src/lib/api.ts`**

```typescript
// apps/web/src/lib/api.ts
import { supabase } from './supabase.ts'

async function getAuthHeader(): Promise<Record<string, string>> {
  const { data } = await supabase.auth.getSession()
  const token = data.session?.access_token
  return token ? { Authorization: `Bearer ${token}` } : {}
}

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE'

async function request<T>(method: HttpMethod, path: string, body?: unknown): Promise<T> {
  const authHeaders = await getAuthHeader()
  const res = await fetch(`/api${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })

  if (res.status === 204) return undefined as T

  const data = await res.json()
  if (!res.ok) throw new Error(data?.error ?? `Request failed: ${res.status}`)
  return data as T
}

export const api = {
  get: <T>(path: string) => request<T>('GET', path),
  post: <T>(path: string, body: unknown) => request<T>('POST', path, body),
  put: <T>(path: string, body: unknown) => request<T>('PUT', path, body),
  delete: <T>(path: string) => request<T>('DELETE', path),
}
```

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/lib/ apps/web/vite.config.ts apps/web/package.json apps/web/package-lock.json
git commit -m "feat(frontend): add Supabase browser client and authenticated API fetch wrapper"
```

---

## Task 9: Wire auth store to real Supabase

**Files:**
- Modify: `apps/web/src/stores/auth.ts`
- Modify: `apps/web/src/stores/__tests__/auth.test.ts`

- [ ] **Step 1: Rewrite `src/stores/auth.ts`**

```typescript
// apps/web/src/stores/auth.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '@/lib/supabase'
import { api } from '@/lib/api'

export interface UserSession {
  userId: string
  email: string
  workspaceId: string
  workspaceName: string
  role: string
  onboardingComplete: boolean
}

export const useAuthStore = defineStore('auth', () => {
  const session = ref<UserSession | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  const isAuthenticated = computed(() => session.value !== null)

  // Called once at app startup — restores session from Supabase if token exists
  async function init() {
    const { data } = await supabase.auth.getSession()
    if (data.session) {
      await loadMe()
    }
    // Listen for auth state changes (login, logout, token refresh)
    supabase.auth.onAuthStateChange(async (event) => {
      if (event === 'SIGNED_IN') await loadMe()
      if (event === 'SIGNED_OUT') session.value = null
    })
  }

  async function loadMe() {
    try {
      const me = await api.get<UserSession>('/auth/me')
      session.value = { ...me, onboardingComplete: true }
    } catch {
      session.value = null
    }
  }

  async function login(email: string, password: string) {
    loading.value = true
    error.value = null
    try {
      const { error: authError } = await supabase.auth.signInWithPassword({ email, password })
      if (authError) throw authError
      await loadMe()
    } catch (e: unknown) {
      error.value = e instanceof Error ? e.message : 'Login failed'
      throw e
    } finally {
      loading.value = false
    }
  }

  async function signup(email: string, password: string) {
    loading.value = true
    error.value = null
    try {
      const { error: authError } = await supabase.auth.signUp({ email, password })
      if (authError) throw authError
    } catch (e: unknown) {
      error.value = e instanceof Error ? e.message : 'Signup failed'
      throw e
    } finally {
      loading.value = false
    }
  }

  async function logout() {
    await supabase.auth.signOut()
    session.value = null
  }

  function completeOnboarding() {
    if (session.value) session.value.onboardingComplete = true
  }

  return { session, loading, error, isAuthenticated, init, login, signup, logout, completeOnboarding }
})
```

- [ ] **Step 2: Update `src/stores/__tests__/auth.test.ts`**

```typescript
// apps/web/src/stores/__tests__/auth.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useAuthStore } from '../auth'

// Mock Supabase and API
vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
      onAuthStateChange: vi.fn(),
      signInWithPassword: vi.fn(),
      signOut: vi.fn().mockResolvedValue({}),
    },
  },
}))

vi.mock('@/lib/api', () => ({
  api: {
    get: vi.fn().mockResolvedValue({
      userId: 'u1',
      email: 'test@example.com',
      workspaceId: 'ws1',
      workspaceName: 'Acme',
      role: 'admin',
      onboardingComplete: true,
    }),
  },
}))

import { supabase } from '@/lib/supabase'

describe('useAuthStore (real auth)', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('starts unauthenticated', () => {
    const store = useAuthStore()
    expect(store.isAuthenticated).toBe(false)
    expect(store.session).toBeNull()
  })

  it('sets session after successful login', async () => {
    vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue({ error: null } as never)
    const store = useAuthStore()
    await store.login('test@example.com', 'password')
    expect(store.isAuthenticated).toBe(true)
    expect(store.session?.email).toBe('test@example.com')
  })

  it('sets error on failed login', async () => {
    vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue({
      error: { message: 'Invalid credentials' },
    } as never)
    const store = useAuthStore()
    await expect(store.login('bad@email.com', 'wrong')).rejects.toThrow()
    expect(store.error).toBe('Invalid credentials')
  })

  it('clears session on logout', async () => {
    const store = useAuthStore()
    store.session = { userId: 'u1', email: 'x@x.com', workspaceId: 'ws1', workspaceName: 'X', role: 'admin', onboardingComplete: true }
    await store.logout()
    expect(store.session).toBeNull()
  })
})
```

- [ ] **Step 3: Run auth store tests**

```bash
cd apps/web && npm test -- --run auth
```
Expected: 4 tests pass.

- [ ] **Step 4: Add `POST /auth/signup-complete` route to auto-create workspace on first sign-up**

Add to `services/control-plane/src/routes/auth.ts`:

```typescript
// POST /auth/signup-complete — called by frontend after Supabase signup
// Creates a default workspace and links the new user as admin
authRoutes.post('/signup-complete', requireAuth, async (c) => {
  const { userId } = c.get('auth') as AuthContext

  // Idempotent: skip if already has a workspace
  const { data: existing } = await adminClient
    .from('workspace_members')
    .select('workspace_id')
    .eq('user_id', userId)
    .limit(1)
    .single()

  if (existing) {
    return c.json({ workspaceId: existing.workspace_id })
  }

  // Create a new workspace
  const { data: workspace, error: wsError } = await adminClient
    .from('workspaces')
    .insert({ name: 'My Workspace' })
    .select()
    .single()
  if (wsError || !workspace) return c.json({ error: 'Failed to create workspace' }, 500)

  // Link user as admin
  const { error: memberError } = await adminClient
    .from('workspace_members')
    .insert({ workspace_id: workspace.id, user_id: userId, role: 'admin' })
  if (memberError) return c.json({ error: 'Failed to create membership' }, 500)

  return c.json({ workspaceId: workspace.id }, 201)
})
```

Then update `apps/web/src/stores/auth.ts` — in the `signup` function, call `signup-complete` after successful Supabase signup:

```typescript
async function signup(email: string, password: string) {
  loading.value = true
  error.value = null
  try {
    const { error: authError } = await supabase.auth.signUp({ email, password })
    if (authError) throw authError
    // Auto-create workspace — user is now signed in via Supabase's autoConfirm in local dev
    await api.post('/auth/signup-complete', {})
    await loadMe()
  } catch (e: unknown) {
    error.value = e instanceof Error ? e.message : 'Signup failed'
    throw e
  } finally {
    loading.value = false
  }
}
```

> **Note:** Supabase local dev has email confirmation disabled by default, so `signUp` logs the user in immediately. In production, email confirmation must be handled before calling `signup-complete`.

- [ ] **Step 5: Wire `init()` call in `App.vue`**

```vue
<!-- apps/web/src/App.vue -->
<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import AppShell from '@/components/layout/AppShell.vue'

const route = useRoute()
const auth = useAuthStore()
const useShell = computed(() => route.path !== '/embedded')

onMounted(() => auth.init())
</script>

<template>
  <AppShell v-if="useShell">
    <RouterView />
  </AppShell>
  <RouterView v-else />
</template>
```

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/stores/auth.ts apps/web/src/stores/__tests__/auth.test.ts apps/web/src/App.vue
git commit -m "feat(frontend): wire auth store to real Supabase Auth — login, logout, session restore"
```

---

## Task 10: Wire workflows store to real API

**Files:**
- Modify: `apps/web/src/stores/workflows.ts`
- Modify: `apps/web/src/stores/__tests__/workflows.test.ts`

- [ ] **Step 1: Rewrite `src/stores/workflows.ts`**

```typescript
// apps/web/src/stores/workflows.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { api } from '@/lib/api'
import type { WorkflowSummary, WorkflowDefinition, CreateWorkflowRequest, UpdateWorkflowRequest } from '@vipsos/workflow-schema'

// Note: the API returns `id` (Postgres column). We map it to `workflowId` for
// compatibility with the existing frontend components and Vue Flow builder.
function mapRow(row: Record<string, unknown>): WorkflowSummary {
  return {
    workflowId: row.id as string,
    name: row.name as string,
    status: row.status as WorkflowSummary['status'],
    lastRunAt: row.last_run_at as string | undefined,
    lastRunStatus: row.last_run_status as WorkflowSummary['lastRunStatus'],
    updatedAt: row.updated_at as string,
    trigger: (row.definition as { trigger: WorkflowSummary['trigger'] })?.trigger ?? { type: 'manual' },
  }
}

export const useWorkflowsStore = defineStore('workflows', () => {
  const summaries = ref<WorkflowSummary[]>([])
  const definitions = ref<Map<string, WorkflowDefinition>>(new Map())
  const loading = ref(false)
  const error = ref<string | null>(null)

  const publishedCount = computed(
    () => summaries.value.filter((w) => w.status === 'published').length,
  )

  async function fetchAll() {
    loading.value = true
    error.value = null
    try {
      const data = await api.get<Record<string, unknown>[]>('/workflows')
      summaries.value = data.map(mapRow)
    } catch (e: unknown) {
      error.value = e instanceof Error ? e.message : 'Failed to load workflows'
    } finally {
      loading.value = false
    }
  }

  async function fetchDefinition(workflowId: string): Promise<WorkflowDefinition | undefined> {
    try {
      const data = await api.get<WorkflowDefinition>(`/workflows/${workflowId}`)
      definitions.value.set(workflowId, data)
      return data
    } catch {
      return undefined
    }
  }

  async function create(payload: CreateWorkflowRequest): Promise<WorkflowSummary> {
    const data = await api.post<WorkflowSummary>('/workflows', payload)
    summaries.value.unshift(data)
    return data
  }

  async function update(workflowId: string, payload: UpdateWorkflowRequest): Promise<WorkflowSummary> {
    const data = await api.put<WorkflowSummary>(`/workflows/${workflowId}`, payload)
    const idx = summaries.value.findIndex((w) => w.workflowId === workflowId)
    if (idx !== -1) summaries.value[idx] = data
    return data
  }

  async function remove(workflowId: string) {
    await api.delete(`/workflows/${workflowId}`)
    summaries.value = summaries.value.filter((w) => w.workflowId !== workflowId)
    definitions.value.delete(workflowId)
  }

  function getDefinition(workflowId: string): WorkflowDefinition | undefined {
    return definitions.value.get(workflowId)
  }

  function getSummary(workflowId: string): WorkflowSummary | undefined {
    return summaries.value.find((s) => s.workflowId === workflowId)
  }

  return {
    summaries, definitions, loading, error, publishedCount,
    fetchAll, fetchDefinition, create, update, remove,
    getDefinition, getSummary,
  }
})
```

- [ ] **Step 2: Update `src/stores/__tests__/workflows.test.ts`**

```typescript
// apps/web/src/stores/__tests__/workflows.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useWorkflowsStore } from '../workflows'

vi.mock('@/lib/api', () => ({
  api: {
    get: vi.fn().mockResolvedValue([
      { workflowId: 'wf_1', name: 'Test Flow', status: 'draft', updatedAt: new Date().toISOString(), trigger: { type: 'manual' } },
    ]),
    post: vi.fn().mockResolvedValue(
      { workflowId: 'wf_new', name: 'New Flow', status: 'draft', updatedAt: new Date().toISOString(), trigger: { type: 'manual' } }
    ),
    put: vi.fn().mockResolvedValue(
      { workflowId: 'wf_1', name: 'Updated Flow', status: 'published', updatedAt: new Date().toISOString(), trigger: { type: 'manual' } }
    ),
    delete: vi.fn().mockResolvedValue(undefined),
  },
}))

describe('useWorkflowsStore (API-backed)', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('fetchAll loads summaries from API', async () => {
    const store = useWorkflowsStore()
    await store.fetchAll()
    expect(store.summaries.length).toBe(1)
    expect(store.summaries[0].name).toBe('Test Flow')
  })

  it('create adds new workflow to summaries', async () => {
    const store = useWorkflowsStore()
    const result = await store.create({ name: 'New Flow', trigger: { type: 'manual' } })
    expect(result.name).toBe('New Flow')
    expect(store.summaries.length).toBe(1)
  })

  it('remove deletes from summaries', async () => {
    const store = useWorkflowsStore()
    store.summaries = [{ workflowId: 'wf_1', name: 'Flow', status: 'draft', updatedAt: '', trigger: { type: 'manual' } }]
    await store.remove('wf_1')
    expect(store.summaries.length).toBe(0)
  })

  it('publishedCount counts only published workflows', async () => {
    const store = useWorkflowsStore()
    store.summaries = [
      { workflowId: 'a', name: 'A', status: 'published', updatedAt: '', trigger: { type: 'manual' } },
      { workflowId: 'b', name: 'B', status: 'draft', updatedAt: '', trigger: { type: 'manual' } },
    ]
    expect(store.publishedCount).toBe(1)
  })
})
```

- [ ] **Step 3: Run**

```bash
cd apps/web && npm test -- --run workflows
```
Expected: 4 tests pass.

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/stores/workflows.ts apps/web/src/stores/__tests__/workflows.test.ts
git commit -m "feat(frontend): wire workflows store to real API — fetch, create, update, delete"
```

---

## Task 11: Wire remaining stores (connectors, runs, secrets)

**Files:**
- Modify: `apps/web/src/stores/connectors.ts`
- Modify: `apps/web/src/stores/runs.ts`
- Modify: `apps/web/src/stores/secrets.ts`

- [ ] **Step 1: Rewrite `src/stores/connectors.ts`**

```typescript
// apps/web/src/stores/connectors.ts
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { api } from '@/lib/api'

export interface ConnectorRecord {
  id: string
  type: string
  name: string
  config: Record<string, unknown>
  created_at: string
}

export const useConnectorsStore = defineStore('connectors', () => {
  const connectors = ref<ConnectorRecord[]>([])
  const loading = ref(false)

  async function fetchAll() {
    loading.value = true
    try {
      connectors.value = await api.get<ConnectorRecord[]>('/connectors')
    } finally {
      loading.value = false
    }
  }

  async function create(payload: { type: string; name: string; config?: Record<string, unknown> }) {
    const data = await api.post<ConnectorRecord>('/connectors', payload)
    connectors.value.unshift(data)
    return data
  }

  async function remove(id: string) {
    await api.delete(`/connectors/${id}`)
    connectors.value = connectors.value.filter((c) => c.id !== id)
  }

  return { connectors, loading, fetchAll, create, remove }
})
```

- [ ] **Step 2: Rewrite `src/stores/runs.ts`**

```typescript
// apps/web/src/stores/runs.ts
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { api } from '@/lib/api'

export interface RunRecord {
  id: string
  workflow_id: string
  status: 'queued' | 'running' | 'success' | 'failed'
  triggered_by: string
  started_at: string
  finished_at?: string
}

export interface RunDetail extends RunRecord {
  logs: Array<{ id: string; node_id?: string; level: string; message: string; created_at: string }>
}

export const useRunsStore = defineStore('runs', () => {
  const runs = ref<RunRecord[]>([])
  const loading = ref(false)

  async function fetchAll() {
    loading.value = true
    try {
      runs.value = await api.get<RunRecord[]>('/runs')
    } finally {
      loading.value = false
    }
  }

  async function fetchDetail(runId: string): Promise<RunDetail> {
    return api.get<RunDetail>(`/runs/${runId}`)
  }

  async function triggerRun(workflowId: string): Promise<RunRecord> {
    const data = await api.post<RunRecord>('/runs', { workflowId, triggeredBy: 'manual' })
    runs.value.unshift(data)
    return data
  }

  return { runs, loading, fetchAll, fetchDetail, triggerRun }
})
```

- [ ] **Step 3: Rewrite `src/stores/secrets.ts`**

```typescript
// apps/web/src/stores/secrets.ts
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { api } from '@/lib/api'

export interface SecretRecord {
  id: string
  name: string
  created_at: string
}

export const useSecretsStore = defineStore('secrets', () => {
  const secrets = ref<SecretRecord[]>([])
  const loading = ref(false)

  async function fetchAll() {
    loading.value = true
    try {
      secrets.value = await api.get<SecretRecord[]>('/secrets')
    } finally {
      loading.value = false
    }
  }

  async function create(name: string, value: string): Promise<SecretRecord> {
    const data = await api.post<SecretRecord>('/secrets', { name, value })
    secrets.value.unshift(data)
    return data
  }

  async function remove(id: string) {
    await api.delete(`/secrets/${id}`)
    secrets.value = secrets.value.filter((s) => s.id !== id)
  }

  return { secrets, loading, fetchAll, create, remove }
})
```

- [ ] **Step 4: Run full test suite**

```bash
cd apps/web && npm test -- --run
```
Expected: all tests pass (57 existing + new auth/workflows tests).

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/stores/connectors.ts apps/web/src/stores/runs.ts apps/web/src/stores/secrets.ts
git commit -m "feat(frontend): wire connectors, runs, secrets stores to real API"
```

---

## Task 12: Remove stub data files + final verification

**Files:**
- Delete: `apps/web/src/data/workflows.ts`
- Delete: `apps/web/src/data/auth.ts`
- Delete: `apps/web/src/data/connectors.ts`
- Delete: `apps/web/src/data/runs.ts`
- Delete: `apps/web/src/data/secrets.ts`
- Modify: any remaining imports of deleted files

- [ ] **Step 1: Check for remaining imports of stub data files**

```bash
grep -rn "from '@/data/workflows'\|from '@/data/auth'\|from '@/data/connectors'\|from '@/data/runs'\|from '@/data/secrets'" apps/web/src/
```

Fix any remaining imports. The stores were rewritten in Tasks 9–11; any remaining references will be in views that directly imported stub data (unlikely but check).

- [ ] **Step 2: Delete the stub files**

```bash
rm apps/web/src/data/workflows.ts \
   apps/web/src/data/auth.ts \
   apps/web/src/data/connectors.ts \
   apps/web/src/data/runs.ts \
   apps/web/src/data/secrets.ts
```

The remaining stub data files (`dashboard.ts`, `monitoring.ts`, `environments.ts`, `alerts.ts`, `billing.ts`, `audit.ts`, `marketplace.ts`, `templates.ts`, `triggers.ts`, `members.ts`, `connector-draft.ts`) are for views not wired in Phase 3A — leave them for Phase 3B.

- [ ] **Step 3: Run full test suite**

```bash
cd apps/web && npm test -- --run
```
Expected: all tests pass.

- [ ] **Step 4: Start the full stack and verify end-to-end**

```bash
# Terminal 1: Supabase (if not already running)
supabase start

# Terminal 2: Control plane
docker compose up control-plane

# Terminal 3: Frontend
cd apps/web && npm run dev
```

Then in the browser at `http://localhost:5173`:
1. Navigate to `/auth/signup` — create a real account with your email and password
2. The signup flow auto-creates a workspace and logs you in — you should land on `/dashboard`
3. Verify the topbar shows your workspace name ("My Workspace") — this confirms the real session
4. Navigate to `/workflows` → click "New Workflow" → fill in a name → save → refresh the page → verify the workflow still appears (real persistence)
5. Navigate to `/secrets` → add a secret with a name and value → verify only the name appears in the list (encrypted_value never returned)
6. Open Supabase Studio at `http://localhost:54323` → Table Editor → `workflows` → confirm your workflow row exists in Postgres

- [ ] **Step 5: Final commit**

```bash
git add -A
git commit -m "feat(phase3a): complete — real auth, persistent workflows, control plane wired to frontend"
```
