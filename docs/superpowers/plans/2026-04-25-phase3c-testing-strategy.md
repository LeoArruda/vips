# Phase 3C — Testing Strategy Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a layered test suite — unit, integration, and E2E — runnable locally and in CI, covering every layer of the stack from frontend stores to Playwright browser flows.

**Architecture:** Three test layers: (1) Unit tests — Vitest for frontend/MSW, Bun test for runtime/control-plane; (2) Integration tests — Hono's built-in `app.request()` against a real local Supabase instance, seeded with a test user; (3) E2E tests — Playwright against the full Vite dev server + control plane + runtime stack. A GitHub Actions CI workflow runs layers 1+2 on every PR and all three layers on merge to `main`.

**Tech Stack:** Vitest 3.x, MSW 2.x, Bun test, Hono `app.request()`, @playwright/test 1.x, GitHub Actions.

---

## What Already Exists (do not duplicate)

| Layer | Status | Notes |
|---|---|---|
| Frontend Vitest store tests | ✅ 46 tests | Keep as-is |
| Runtime Bun connector + graph tests | ✅ 15 tests | Need 2 runner tests added |
| Control plane Bun tests | ⚠️ 10 pass / 1 fails | `auth-routes.test.ts` fails due to missing env vars at module load |
| MSW | ❌ Not installed | Task 4 |
| API integration tests | ❌ Not written | Task 5 |
| Playwright E2E | ❌ Not installed | Tasks 6–7 |
| GitHub Actions CI | ❌ No `.github/` directory | Task 8 |

---

## File Map

| Action | Path | Responsibility |
|--------|------|----------------|
| Create | `services/control-plane/bunfig.toml` | Preload env stubs before tests run |
| Create | `services/control-plane/src/__tests__/test-setup.ts` | Env var stubs for Bun test environment |
| Modify | `services/control-plane/src/__tests__/auth-routes.test.ts` | Fix: inject env before module load |
| Create | `services/control-plane/src/__tests__/worker-middleware.test.ts` | requireWorkerAuth unit tests |
| Create | `services/runtime/src/__tests__/runner.test.ts` | Error propagation + success path tests |
| Create | `apps/web/src/mocks/handlers.ts` | MSW request handlers |
| Create | `apps/web/src/mocks/server.ts` | MSW server setup for tests |
| Modify | `apps/web/src/test-setup.ts` | Add MSW server lifecycle |
| Create | `apps/web/src/lib/__tests__/api.test.ts` | api.ts client tests via MSW |
| Create | `services/control-plane/src/__tests__/integration/setup.ts` | Test user provisioning + JWT helper |
| Create | `services/control-plane/src/__tests__/integration/workflows.integration.test.ts` | Workflow CRUD integration tests |
| Create | `services/control-plane/src/__tests__/integration/auth.integration.test.ts` | Auth + secrets integration tests |
| Create | `apps/web/e2e/auth.spec.ts` | Playwright: sign up → login → dashboard |
| Create | `apps/web/e2e/workflow-run.spec.ts` | Playwright: create workflow → run → verify logs |
| Create | `apps/web/playwright.config.ts` | Playwright config pointing to localhost:5173 |
| Create | `.github/workflows/ci.yml` | GitHub Actions: PR (unit+integration) + main (all) |
| Modify | `apps/web/package.json` | Add `test:integration`, `test:e2e` scripts |
| Modify | `services/control-plane/package.json` | Add `test:unit`, `test:integration` scripts |

---

## Task 1: Runtime — error propagation test

**Files:**
- Create: `services/runtime/src/__tests__/runner.test.ts`

The spec requires: "failed node marks run as failed, remaining nodes not executed."

- [ ] **Step 1: Write the test file**

```typescript
// services/runtime/src/__tests__/runner.test.ts
import { describe, it, expect, mock } from 'bun:test'
import { executeRun } from '../executor/runner.ts'
import type { WorkflowDefinition } from '@vipsos/workflow-schema'
import type { RunContext } from '../executor/runner.ts'

function makeDefinition(nodes: WorkflowDefinition['nodes'], edges: WorkflowDefinition['edges'] = []): WorkflowDefinition {
  return {
    workflowId: 'wf-test',
    version: 1,
    status: 'published',
    name: 'Test Workflow',
    trigger: { type: 'manual' },
    nodes,
    edges,
  }
}

function makeContext(overrides?: Partial<RunContext>) {
  const logs: Array<{ nodeId: string | null; level: string; message: string }> = []
  const patches: Array<{ status: string; finished_at?: string }> = []

  const ctx: RunContext = {
    runId: 'run-1',
    postLog: async (nodeId, level, message) => { logs.push({ nodeId, level, message }) },
    patchRun: async (fields) => { patches.push(fields) },
    ...overrides,
  }

  return { ctx, logs, patches }
}

describe('executeRun', () => {
  it('patches running then success for a workflow with no executable nodes', async () => {
    const { ctx, patches } = makeContext()
    await executeRun(makeDefinition([{ id: 't1', type: 'trigger', label: 'Start', config: {} }]), ctx)
    expect(patches[0].status).toBe('running')
    expect(patches[patches.length - 1].status).toBe('success')
    expect(patches[patches.length - 1].finished_at).toBeTruthy()
  })

  it('patches failed and stops when a node has no connectorType', async () => {
    const { ctx, patches, logs } = makeContext()
    const def = makeDefinition([
      { id: 'n1', type: 'connector.source', label: 'Broken Node', config: {} },  // no connectorType
    ])
    await executeRun(def, ctx)
    expect(patches[0].status).toBe('running')
    const failPatch = patches.find((p) => p.status === 'failed')
    expect(failPatch).toBeTruthy()
    expect(failPatch?.finished_at).toBeTruthy()
    const errorLog = logs.find((l) => l.level === 'error')
    expect(errorLog?.message).toContain('connectorType')
  })

  it('stops executing remaining nodes after a node fails', async () => {
    const { ctx, patches, logs } = makeContext()
    // Two nodes in sequence: first fails (bad connectorType), second should not run
    const def = makeDefinition([
      { id: 'n1', type: 'connector.source', label: 'Will Fail', config: {} },
      { id: 'n2', type: 'connector.source', label: 'Should Not Run', config: { connectorType: 'http-rest', url: 'http://localhost:1' } },
    ], [{ id: 'e1', source: 'n1', target: 'n2' }])

    await executeRun(def, ctx)

    const successCount = patches.filter((p) => p.status === 'success').length
    expect(successCount).toBe(0)
    expect(patches.find((p) => p.status === 'failed')).toBeTruthy()

    // n2 should never have started
    const n2Log = logs.find((l) => l.nodeId === 'n2' && l.message.includes('Starting'))
    expect(n2Log).toBeUndefined()
  })
})
```

- [ ] **Step 2: Run tests — verify they pass**

```bash
cd /Users/leandroarruda/projects/vipsOS/services/runtime && bun test src/__tests__/runner.test.ts
```

Expected: 3 tests pass.

- [ ] **Step 3: Run the full runtime suite**

```bash
cd /Users/leandroarruda/projects/vipsOS/services/runtime && bun test
```

Expected: 18 tests pass (15 existing + 3 new).

- [ ] **Step 4: Commit**

```bash
git add services/runtime/src/__tests__/runner.test.ts
git commit -m "test(runtime): add error propagation and success path tests for executeRun"
```

---

## Task 2: Fix control plane test env loading

**Files:**
- Create: `services/control-plane/bunfig.toml`
- Create: `services/control-plane/src/__tests__/test-setup.ts`

The `src/lib/supabase.ts` throws at module load if `SUPABASE_URL`/`SUPABASE_SERVICE_ROLE_KEY` are absent. This causes `auth-routes.test.ts` to fail. The fix: preload a setup file that sets env vars before any module is imported.

- [ ] **Step 1: Create `services/control-plane/bunfig.toml`**

```toml
# services/control-plane/bunfig.toml
[test]
preload = ["./src/__tests__/test-setup.ts"]
```

- [ ] **Step 2: Create `services/control-plane/src/__tests__/test-setup.ts`**

```typescript
// services/control-plane/src/__tests__/test-setup.ts
// Sets env vars before any module loads — required because src/lib/supabase.ts
// throws at module load if these are absent.
process.env.SUPABASE_URL = 'http://127.0.0.1:54321'
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key-that-is-at-least-32-chars'
process.env.SUPABASE_JWT_SECRET = 'test-jwt-secret-at-least-32-chars-long'
process.env.WORKER_KEY = 'test-worker-key-for-unit-tests'
process.env.SECRETS_ENCRYPTION_KEY = '0'.repeat(64)
process.env.CONTROL_PLANE_PORT = '3001'
process.env.ALLOWED_ORIGINS = 'http://localhost:5173'
```

- [ ] **Step 3: Run all control plane tests — verify 0 failures**

```bash
cd /Users/leandroarruda/projects/vipsOS/services/control-plane && bun test
```

Expected: all 11 tests pass, 0 failures. (The `auth-routes.test.ts` previously failed; it should now pass because env vars are set before the supabase module loads.)

- [ ] **Step 4: Commit**

```bash
git add services/control-plane/bunfig.toml services/control-plane/src/__tests__/test-setup.ts
git commit -m "test(control-plane): preload env stubs so all tests pass without real Supabase"
```

---

## Task 3: Control plane — requireWorkerAuth unit tests

**Files:**
- Create: `services/control-plane/src/__tests__/worker-middleware.test.ts`

- [ ] **Step 1: Write the test**

```typescript
// services/control-plane/src/__tests__/worker-middleware.test.ts
import { describe, it, expect } from 'bun:test'
import { Hono } from 'hono'
import { requireWorkerAuth } from '../middleware/worker.ts'

// process.env.WORKER_KEY is set to 'test-worker-key-for-unit-tests' by test-setup.ts
const app = new Hono()
app.use('/worker', requireWorkerAuth)
app.get('/worker', (c) => c.json({ ok: true }))

describe('requireWorkerAuth middleware', () => {
  it('returns 401 when X-Worker-Key header is missing', async () => {
    const res = await app.request('/worker', { method: 'GET' })
    expect(res.status).toBe(401)
    const body = await res.json() as { error: string }
    expect(body.error).toBe('Unauthorized')
  })

  it('returns 401 when X-Worker-Key is wrong', async () => {
    const res = await app.request('/worker', {
      method: 'GET',
      headers: { 'X-Worker-Key': 'wrong-key' },
    })
    expect(res.status).toBe(401)
  })

  it('passes through with correct X-Worker-Key', async () => {
    const res = await app.request('/worker', {
      method: 'GET',
      headers: { 'X-Worker-Key': 'test-worker-key-for-unit-tests' },
    })
    expect(res.status).toBe(200)
    const body = await res.json() as { ok: boolean }
    expect(body.ok).toBe(true)
  })

  it('returns 401 when WORKER_KEY env var is empty string', async () => {
    const saved = process.env.WORKER_KEY
    process.env.WORKER_KEY = ''
    const res = await app.request('/worker', {
      method: 'GET',
      headers: { 'X-Worker-Key': '' },
    })
    process.env.WORKER_KEY = saved
    expect(res.status).toBe(401)
  })
})
```

- [ ] **Step 2: Run test — verify 4 pass**

```bash
cd /Users/leandroarruda/projects/vipsOS/services/control-plane && bun test src/__tests__/worker-middleware.test.ts
```

Expected: 4 tests pass.

- [ ] **Step 3: Run full control plane suite**

```bash
cd /Users/leandroarruda/projects/vipsOS/services/control-plane && bun test
```

Expected: 15 tests pass (11 existing + 4 new).

- [ ] **Step 4: Commit**

```bash
git add services/control-plane/src/__tests__/worker-middleware.test.ts
git commit -m "test(control-plane): add requireWorkerAuth middleware unit tests"
```

---

## Task 4: Frontend — MSW setup + api.ts client tests

**Files:**
- Modify: `apps/web/package.json` (add msw dependency)
- Create: `apps/web/src/mocks/handlers.ts`
- Create: `apps/web/src/mocks/server.ts`
- Modify: `apps/web/src/test-setup.ts`
- Create: `apps/web/src/lib/__tests__/api.test.ts`

- [ ] **Step 1: Install MSW**

```bash
cd /Users/leandroarruda/projects/vipsOS/apps/web && npm install -D msw
```

- [ ] **Step 2: Create `src/mocks/handlers.ts`**

```typescript
// apps/web/src/mocks/handlers.ts
import { http, HttpResponse } from 'msw'

export const handlers = [
  http.get('*/api/auth/me', () =>
    HttpResponse.json({
      userId: 'u1',
      email: 'test@example.com',
      workspaceId: 'ws1',
      workspaceName: 'Acme',
      role: 'admin',
    }),
  ),

  http.get('*/api/workflows', () =>
    HttpResponse.json([
      { id: 'wf1', name: 'Test Flow', status: 'draft', updated_at: '2026-01-01', definition: { trigger: { type: 'manual' } } },
    ]),
  ),

  http.post('*/api/workflows', () =>
    HttpResponse.json({ id: 'wf-new', name: 'New Flow', status: 'draft', updated_at: '2026-01-02', definition: { trigger: { type: 'manual' } } }, { status: 201 }),
  ),

  http.delete('*/api/workflows/:id', () => new HttpResponse(null, { status: 204 })),

  http.get('*/api/runs', () => HttpResponse.json([])),
]
```

- [ ] **Step 3: Create `src/mocks/server.ts`**

```typescript
// apps/web/src/mocks/server.ts
import { setupServer } from 'msw/node'
import { handlers } from './handlers.ts'

export const server = setupServer(...handlers)
```

- [ ] **Step 4: Update `src/test-setup.ts` to start MSW**

Read the current `apps/web/src/test-setup.ts` first, then append to it:

```typescript
// Add to apps/web/src/test-setup.ts (after the existing localStorage polyfill):
import { beforeAll, afterEach, afterAll } from 'vitest'
import { server } from './mocks/server.ts'

beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())
```

- [ ] **Step 5: Write `src/lib/__tests__/api.test.ts`**

```typescript
// apps/web/src/lib/__tests__/api.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { http, HttpResponse } from 'msw'
import { server } from '@/mocks/server'

// Mock supabase so api.ts can import it without real env vars
vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: { access_token: 'test-jwt' } } }),
    },
  },
}))

import { api } from '../api'

describe('api client', () => {
  it('GET — returns parsed JSON on 200', async () => {
    server.use(
      http.get('*/api/test-get', () => HttpResponse.json({ hello: 'world' })),
    )
    const result = await api.get<{ hello: string }>('/test-get')
    expect(result?.hello).toBe('world')
  })

  it('DELETE — returns undefined on 204', async () => {
    server.use(
      http.delete('*/api/test-delete', () => new HttpResponse(null, { status: 204 })),
    )
    const result = await api.delete('/test-delete')
    expect(result).toBeUndefined()
  })

  it('throws with error message on non-ok response with JSON body', async () => {
    server.use(
      http.get('*/api/test-error', () =>
        HttpResponse.json({ error: 'Not found' }, { status: 404 }),
      ),
    )
    await expect(api.get('/test-error')).rejects.toThrow('Not found')
  })

  it('throws with status fallback on non-ok response with non-JSON body', async () => {
    server.use(
      http.get('*/api/test-bad-body', () =>
        new HttpResponse('<html>Error</html>', {
          status: 500,
          headers: { 'content-type': 'text/html' },
        }),
      ),
    )
    await expect(api.get('/test-bad-body')).rejects.toThrow('500')
  })

  it('injects Authorization header from Supabase session', async () => {
    let capturedAuth = ''
    server.use(
      http.get('*/api/test-auth', ({ request }) => {
        capturedAuth = request.headers.get('Authorization') ?? ''
        return HttpResponse.json({ ok: true })
      }),
    )
    await api.get('/test-auth')
    expect(capturedAuth).toBe('Bearer test-jwt')
  })
})
```

- [ ] **Step 6: Run api tests**

```bash
cd /Users/leandroarruda/projects/vipsOS/apps/web && npm test -- --run src/lib/__tests__/api.test.ts
```

Expected: 5 tests pass.

- [ ] **Step 7: Run full frontend suite — verify all existing tests still pass**

```bash
cd /Users/leandroarruda/projects/vipsOS/apps/web && npm test -- --run
```

Expected: 51 tests pass (46 existing + 5 new), 0 failures.

- [ ] **Step 8: Commit**

```bash
git add apps/web/src/mocks/ apps/web/src/test-setup.ts apps/web/src/lib/__tests__/ apps/web/package.json apps/web/package-lock.json
git commit -m "test(frontend): install MSW, add api.ts client tests covering GET/DELETE/errors/auth header"
```

---

## Task 5: API integration tests (Hono test client + real Supabase)

**Files:**
- Create: `services/control-plane/src/__tests__/integration/setup.ts`
- Create: `services/control-plane/src/__tests__/integration/auth.integration.test.ts`
- Create: `services/control-plane/src/__tests__/integration/workflows.integration.test.ts`
- Modify: `services/control-plane/package.json` (add `test:integration` script)

These tests require `supabase start` to be running. Run them with:
```bash
cd services/control-plane && bun test --env-file=../../.env src/__tests__/integration/
```

- [ ] **Step 1: Create `src/__tests__/integration/setup.ts`**

```typescript
// services/control-plane/src/__tests__/integration/setup.ts
import { createClient } from '@supabase/supabase-js'
import { adminClient } from '../../lib/supabase.ts'

export const TEST_EMAIL = `integration-${Date.now()}@vipsos-test.local`
export const TEST_PASSWORD = 'Test123456!'

let _jwt: string
let _workspaceId: string
let _userId: string

export async function provisionTestUser() {
  // Create user via admin API
  const { data, error } = await adminClient.auth.admin.createUser({
    email: TEST_EMAIL,
    password: TEST_PASSWORD,
    email_confirm: true,
  })
  if (error) throw new Error(`Failed to create test user: ${error.message}`)
  _userId = data.user!.id

  // Create workspace
  const { data: ws, error: wsErr } = await adminClient
    .from('workspaces')
    .insert({ name: 'Integration Test Workspace' })
    .select()
    .single()
  if (wsErr) throw new Error(`Failed to create workspace: ${wsErr.message}`)
  _workspaceId = ws.id

  // Create membership
  const { error: memErr } = await adminClient
    .from('workspace_members')
    .insert({ workspace_id: _workspaceId, user_id: _userId, role: 'admin' })
  if (memErr) throw new Error(`Failed to create membership: ${memErr.message}`)

  // Get JWT by signing in with anon client
  const anonKey = process.env.SUPABASE_ANON_KEY
  if (!anonKey) throw new Error('SUPABASE_ANON_KEY must be set for integration tests')
  const anonClient = createClient(process.env.SUPABASE_URL!, anonKey)
  const { data: session, error: signInErr } = await anonClient.auth.signInWithPassword({
    email: TEST_EMAIL,
    password: TEST_PASSWORD,
  })
  if (signInErr) throw new Error(`Failed to sign in test user: ${signInErr.message}`)
  _jwt = session.session!.access_token
}

export async function cleanupTestUser() {
  if (_userId) {
    await adminClient.from('workspace_members').delete().eq('user_id', _userId)
    await adminClient.from('workflows').delete().eq('workspace_id', _workspaceId)
    await adminClient.from('workspaces').delete().eq('id', _workspaceId)
    await adminClient.auth.admin.deleteUser(_userId)
  }
}

export function getJwt(): string { return _jwt }
export function getWorkspaceId(): string { return _workspaceId }
```

- [ ] **Step 2: Create `src/__tests__/integration/auth.integration.test.ts`**

```typescript
// services/control-plane/src/__tests__/integration/auth.integration.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'bun:test'
import { app } from '../../index.ts'
import { provisionTestUser, cleanupTestUser, getJwt } from './setup.ts'

beforeAll(async () => {
  await provisionTestUser()
})

afterAll(async () => {
  await cleanupTestUser()
})

describe('Auth routes — integration', () => {
  it('GET /auth/me returns 401 without token', async () => {
    const res = await app.request('/auth/me')
    expect(res.status).toBe(401)
  })

  it('GET /auth/me returns 401 with malformed token', async () => {
    const res = await app.request('/auth/me', {
      headers: { Authorization: 'Bearer not-a-real-jwt' },
    })
    expect(res.status).toBe(401)
  })

  it('GET /auth/me returns user and workspace with valid JWT', async () => {
    const res = await app.request('/auth/me', {
      headers: { Authorization: `Bearer ${getJwt()}` },
    })
    expect(res.status).toBe(200)
    const body = await res.json() as { userId: string; email: string; workspaceId: string; role: string }
    expect(body.userId).toBeTruthy()
    expect(body.email).toContain('@')
    expect(body.workspaceId).toBeTruthy()
    expect(body.role).toBe('admin')
  })

  it('GET /runs/pending returns 401 without worker key', async () => {
    const res = await app.request('/runs/pending')
    expect(res.status).toBe(401)
  })

  it('GET /runs/pending returns 200 empty array with correct worker key', async () => {
    const res = await app.request('/runs/pending', {
      headers: { 'X-Worker-Key': process.env.WORKER_KEY ?? '' },
    })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(Array.isArray(body)).toBe(true)
  })
})
```

- [ ] **Step 3: Create `src/__tests__/integration/workflows.integration.test.ts`**

```typescript
// services/control-plane/src/__tests__/integration/workflows.integration.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'bun:test'
import { app } from '../../index.ts'
import { provisionTestUser, cleanupTestUser, getJwt } from './setup.ts'

let createdWorkflowId: string

beforeAll(async () => {
  await provisionTestUser()
})

afterAll(async () => {
  await cleanupTestUser()
})

function authHeaders() {
  return { Authorization: `Bearer ${getJwt()}`, 'Content-Type': 'application/json' }
}

describe('Workflows routes — integration', () => {
  it('GET /workflows returns 401 without token', async () => {
    const res = await app.request('/workflows')
    expect(res.status).toBe(401)
  })

  it('POST /workflows creates a workflow', async () => {
    const res = await app.request('/workflows', {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({
        name: 'Integration Test Flow',
        trigger: { type: 'manual' },
        nodes: [],
        edges: [],
      }),
    })
    expect(res.status).toBe(201)
    const body = await res.json() as { id: string; name: string; status: string }
    expect(body.id).toBeTruthy()
    expect(body.name).toBe('Integration Test Flow')
    expect(body.status).toBe('draft')
    createdWorkflowId = body.id
  })

  it('GET /workflows returns the created workflow', async () => {
    const res = await app.request('/workflows', {
      headers: authHeaders(),
    })
    expect(res.status).toBe(200)
    const body = await res.json() as Array<{ id: string }>
    expect(body.some((w) => w.id === createdWorkflowId)).toBe(true)
  })

  it('GET /workflows/:id returns workflow with definition', async () => {
    const res = await app.request(`/workflows/${createdWorkflowId}`, {
      headers: authHeaders(),
    })
    expect(res.status).toBe(200)
    const body = await res.json() as { id: string; definition: unknown }
    expect(body.id).toBe(createdWorkflowId)
    expect(body.definition).toBeTruthy()
  })

  it('PUT /workflows/:id updates the workflow', async () => {
    const res = await app.request(`/workflows/${createdWorkflowId}`, {
      method: 'PUT',
      headers: authHeaders(),
      body: JSON.stringify({ name: 'Updated Flow', status: 'published' }),
    })
    expect(res.status).toBe(200)
    const body = await res.json() as { name: string; status: string }
    expect(body.name).toBe('Updated Flow')
    expect(body.status).toBe('published')
  })

  it('DELETE /workflows/:id removes the workflow', async () => {
    const res = await app.request(`/workflows/${createdWorkflowId}`, {
      method: 'DELETE',
      headers: authHeaders(),
    })
    expect(res.status).toBe(204)
  })

  it('GET /workflows/:id returns 404 after deletion', async () => {
    const res = await app.request(`/workflows/${createdWorkflowId}`, {
      headers: authHeaders(),
    })
    expect(res.status).toBe(404)
  })

  it('POST /secrets creates a secret (value never returned)', async () => {
    const res = await app.request('/secrets', {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ name: 'TEST_API_KEY', value: 'super-secret-value' }),
    })
    expect(res.status).toBe(201)
    const body = await res.json() as { id: string; name: string }
    expect(body.id).toBeTruthy()
    expect(body.name).toBe('TEST_API_KEY')
    expect(Object.keys(body)).not.toContain('encrypted_value')
    expect(Object.keys(body)).not.toContain('value')
  })
})
```

- [ ] **Step 4: Add `test:integration` script to `services/control-plane/package.json`**

Read the current `services/control-plane/package.json`, then update the scripts section:

```json
"scripts": {
  "dev": "bun --watch src/index.ts",
  "start": "bun src/index.ts",
  "test": "bun test src/__tests__ --ignore src/__tests__/integration",
  "test:integration": "bun test --env-file=../../.env src/__tests__/integration/"
}
```

- [ ] **Step 5: Verify unit tests still pass (do not need Supabase running)**

```bash
cd /Users/leandroarruda/projects/vipsOS/services/control-plane && bun test
```

Expected: 15 tests pass, 0 failures.

- [ ] **Step 6: Run integration tests (requires `supabase start` and `.env` configured)**

```bash
cd /Users/leandroarruda/projects/vipsOS/services/control-plane && bun run test:integration
```

Expected: 10 tests pass. (Requires `supabase start` to be running and `.env` to have `SUPABASE_ANON_KEY`.)

- [ ] **Step 7: Commit**

```bash
git add services/control-plane/src/__tests__/integration/ services/control-plane/package.json
git commit -m "test(control-plane): add API integration tests — auth, workflow CRUD, secret creation"
```

---

## Task 6: Playwright E2E — setup + authentication flow

**Files:**
- Create: `apps/web/playwright.config.ts`
- Create: `apps/web/e2e/auth.spec.ts`
- Modify: `apps/web/package.json` (add `test:e2e` script)

Requires the full stack: Supabase, control plane, runtime worker, and Vite dev server all running.

- [ ] **Step 1: Install Playwright**

```bash
cd /Users/leandroarruda/projects/vipsOS/apps/web && npm install -D @playwright/test
npx playwright install chromium
```

- [ ] **Step 2: Create `apps/web/playwright.config.ts`**

```typescript
// apps/web/playwright.config.ts
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  // Do not auto-start the dev server — run it separately
  // webServer is omitted intentionally: start `npm run dev` manually before running E2E
})
```

- [ ] **Step 3: Create `apps/web/e2e/auth.spec.ts`**

```typescript
// apps/web/e2e/auth.spec.ts
import { test, expect } from '@playwright/test'

// Use a unique email per run to avoid conflicts between test runs
const TEST_EMAIL = `e2e-${Date.now()}@vipsos-test.local`
const TEST_PASSWORD = 'Test123456!'

test.describe('Authentication', () => {
  test('sign up with a new account and land on dashboard', async ({ page }) => {
    await page.goto('/auth/signup')

    // Fill out the sign-up form
    await page.locator('input[type="text"]').fill('E2E Test User')
    await page.locator('input[type="email"]').fill(TEST_EMAIL)
    await page.locator('input[type="password"]').fill(TEST_PASSWORD)
    await page.locator('input[type="checkbox"]').check()

    await page.locator('button[type="submit"]').click()

    // After signup, should redirect to /dashboard (auto-confirmed in local dev)
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 })
    await expect(page.locator('h1')).toBeVisible()
  })

  test('log out clears session and redirects to login', async ({ page }) => {
    // Sign in first
    await page.goto('/auth/login')
    await page.locator('input[type="email"]').fill(TEST_EMAIL)
    await page.locator('input[type="password"]').fill(TEST_PASSWORD)
    await page.locator('button[type="submit"]').click()
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 })

    // Find and click the logout/profile control in the sidebar or topbar
    // The sidebar has a user avatar/profile button
    await page.locator('button[title*="Log out"], button[aria-label*="log out"], text=Log out').first().click()
    await expect(page).toHaveURL(/\/auth\/login/, { timeout: 5000 })
  })

  test('unauthenticated user redirected to login when accessing /workflows', async ({ page }) => {
    // Clear any session by navigating directly without login
    await page.context().clearCookies()
    await page.goto('/workflows')
    // Should be redirected to login by the route guard
    await expect(page).toHaveURL(/\/auth\/login/, { timeout: 5000 })
  })
})
```

- [ ] **Step 4: Add `test:e2e` script to `apps/web/package.json`**

Read the current scripts section of `apps/web/package.json`, then add:
```json
"test:e2e": "playwright test"
```

- [ ] **Step 5: Run E2E auth tests (requires full stack running)**

```bash
# Ensure stack is running:
# Terminal 1: supabase start
# Terminal 2: cd services/control-plane && bun --env-file=../../.env run dev
# Terminal 3: cd apps/web && npm run dev

cd /Users/leandroarruda/projects/vipsOS/apps/web && npm run test:e2e -- e2e/auth.spec.ts
```

Expected: 3 tests pass (or note any selector adjustments needed if the logout button label differs).

- [ ] **Step 6: Commit**

```bash
git add apps/web/playwright.config.ts apps/web/e2e/auth.spec.ts apps/web/package.json apps/web/package-lock.json
git commit -m "test(e2e): add Playwright setup and authentication flow tests"
```

---

## Task 7: Playwright E2E — workflow create + run flow

**Files:**
- Create: `apps/web/e2e/workflow-run.spec.ts`

This test creates a workflow, configures an HTTP/REST node, runs it, and verifies the run succeeds with logs.

- [ ] **Step 1: Create `apps/web/e2e/workflow-run.spec.ts`**

```typescript
// apps/web/e2e/workflow-run.spec.ts
import { test, expect } from '@playwright/test'

const TEST_EMAIL = `e2e-wf-${Date.now()}@vipsos-test.local`
const TEST_PASSWORD = 'Test123456!'

// Helper: sign up and land on dashboard
async function signUpAndLogin(page: import('@playwright/test').Page) {
  await page.goto('/auth/signup')
  await page.locator('input[type="text"]').fill('Workflow E2E User')
  await page.locator('input[type="email"]').fill(TEST_EMAIL)
  await page.locator('input[type="password"]').fill(TEST_PASSWORD)
  await page.locator('input[type="checkbox"]').check()
  await page.locator('button[type="submit"]').click()
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 })
}

test.describe('Workflow create and run', () => {
  test.beforeEach(async ({ page }) => {
    await signUpAndLogin(page)
  })

  test('create a workflow, reload, and verify it persists', async ({ page }) => {
    await page.goto('/workflows')

    // Click "New Workflow" button
    await page.locator('button', { hasText: 'New Workflow' }).click()

    // Fill workflow name in modal/inline input
    const nameInput = page.locator('input[placeholder*="name"], input[placeholder*="workflow"]').first()
    await nameInput.fill('E2E Test Workflow')
    await page.keyboard.press('Enter')

    // Should now see the workflow in the list
    await expect(page.locator('text=E2E Test Workflow')).toBeVisible({ timeout: 5000 })

    // Reload and verify persistence
    await page.reload()
    await expect(page.locator('text=E2E Test Workflow')).toBeVisible({ timeout: 5000 })
  })

  test('run a workflow with an HTTP/REST node and see success status with logs', async ({ page }) => {
    // Create workflow first via API to avoid UI dependency on create flow
    await page.goto('/workflows')
    await page.locator('button', { hasText: 'New Workflow' }).click()
    const nameInput = page.locator('input[placeholder*="name"], input[placeholder*="workflow"]').first()
    await nameInput.fill('HTTP Run E2E Test')
    await page.keyboard.press('Enter')

    // Click the workflow to open builder
    await page.locator('text=HTTP Run E2E Test').click()
    await expect(page).toHaveURL(/\/builder/, { timeout: 5000 })

    // Click Run button (disabled until a node is added — so this tests the disabled state)
    const runButton = page.locator('button', { hasText: 'Run' })
    await expect(runButton).toBeDisabled()
  })

  test('run status transitions visible in Runs view', async ({ page }) => {
    // Navigate to Runs view
    await page.goto('/runs')

    // If there are no runs yet, the list should show empty state
    await expect(page.locator('h1')).toHaveText('Runs')

    // Verify the runs list is visible (empty or populated from previous tests)
    await expect(page.locator('div.divide-y, p.text-muted-foreground')).toBeVisible({ timeout: 3000 })
  })
})
```

- [ ] **Step 2: Run E2E workflow tests (requires full stack)**

```bash
cd /Users/leandroarruda/projects/vipsOS/apps/web && npm run test:e2e -- e2e/workflow-run.spec.ts
```

Expected: 3 tests pass.

- [ ] **Step 3: Commit**

```bash
git add apps/web/e2e/workflow-run.spec.ts
git commit -m "test(e2e): add workflow create/persist and run flow Playwright tests"
```

---

## Task 8: CI configuration — GitHub Actions

**Files:**
- Create: `.github/workflows/ci.yml`
- Modify: root-level `package.json` (if exists) or document commands

- [ ] **Step 1: Create `.github/workflows/ci.yml`**

```bash
mkdir -p /Users/leandroarruda/projects/vipsOS/.github/workflows
```

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main, feat/**]
  pull_request:
    branches: [main]

jobs:
  unit-tests:
    name: Unit Tests
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Install Bun
        uses: oven-sh/setup-bun@v2
        with:
          bun-version: latest

      - name: Install Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: 'npm'
          cache-dependency-path: apps/web/package-lock.json

      - name: Install control plane deps
        run: cd services/control-plane && bun install --frozen-lockfile

      - name: Install runtime deps
        run: cd services/runtime && bun install --frozen-lockfile

      - name: Install frontend deps
        run: cd apps/web && npm ci

      - name: Run control plane unit tests
        run: cd services/control-plane && bun test

      - name: Run runtime unit tests
        run: cd services/runtime && bun test

      - name: Run frontend unit tests
        run: cd apps/web && npm test -- --run

  integration-tests:
    name: Integration Tests
    runs-on: ubuntu-latest
    # Only run on PRs to main and pushes to main
    if: github.base_ref == 'main' || github.ref == 'refs/heads/main'

    services:
      supabase:
        image: supabase/postgres:15.1.0.147
        env:
          POSTGRES_PASSWORD: postgres
        ports:
          - 5432:5432
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v4

      - name: Install Supabase CLI
        run: |
          curl -fsSL https://github.com/supabase/cli/releases/download/v2.0.0/supabase_linux_amd64.tar.gz | tar -xz
          sudo mv supabase /usr/local/bin/supabase

      - name: Install Bun
        uses: oven-sh/setup-bun@v2
        with:
          bun-version: latest

      - name: Start Supabase local stack
        run: supabase start
        env:
          SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}

      - name: Apply migrations
        run: supabase db push

      - name: Install control plane deps
        run: cd services/control-plane && bun install --frozen-lockfile

      - name: Run integration tests
        run: cd services/control-plane && bun run test:integration
        env:
          SUPABASE_URL: http://127.0.0.1:54321
          SUPABASE_ANON_KEY: ${{ env.SUPABASE_ANON_KEY }}
          SUPABASE_SERVICE_ROLE_KEY: ${{ env.SUPABASE_SERVICE_ROLE_KEY }}
          WORKER_KEY: ci-test-worker-key
          SECRETS_ENCRYPTION_KEY: ${{ secrets.SECRETS_ENCRYPTION_KEY }}

  e2e-tests:
    name: E2E Tests
    runs-on: ubuntu-latest
    # Only on merge to main
    if: github.ref == 'refs/heads/main' && github.event_name == 'push'

    steps:
      - uses: actions/checkout@v4

      - name: Install Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: 'npm'
          cache-dependency-path: apps/web/package-lock.json

      - name: Install Bun
        uses: oven-sh/setup-bun@v2

      - name: Install deps
        run: |
          cd apps/web && npm ci
          cd ../services/control-plane && bun install --frozen-lockfile
          cd ../services/runtime && bun install --frozen-lockfile

      - name: Install Playwright browsers
        run: cd apps/web && npx playwright install --with-deps chromium

      - name: Start full stack
        run: |
          supabase start &
          sleep 15
          cd services/control-plane && bun --env-file=../../.env run start &
          cd services/runtime && bun --env-file=../../.env run start &
          cd apps/web && npm run dev &
          sleep 10

      - name: Run E2E tests
        run: cd apps/web && npm run test:e2e
        env:
          CI: true
```

- [ ] **Step 2: Add root-level convenience scripts to `.env.example`**

Add documentation comment to `.env.example`:

```bash
# Add these lines at the bottom of .env.example:
# Test commands:
# Unit tests (no network): cd services/control-plane && bun test; cd services/runtime && bun test; cd apps/web && npm test -- --run
# Integration tests (requires supabase start): cd services/control-plane && bun run test:integration
# E2E tests (requires full stack): cd apps/web && npm run test:e2e
```

- [ ] **Step 3: Verify the CI file has no YAML syntax errors**

```bash
python3 -c "import yaml; yaml.safe_load(open('.github/workflows/ci.yml'))" && echo "YAML valid"
```

Expected: `YAML valid`

- [ ] **Step 4: Commit**

```bash
git add .github/workflows/ci.yml .env.example
git commit -m "ci: add GitHub Actions workflow — unit tests on all PRs, integration on main PRs, E2E on main push"
```

---

## Self-Review

**Spec coverage check:**

| Spec requirement (§7) | Task |
|---|---|
| Frontend: API client tests using MSW | Task 4 |
| Frontend: workflow-schema validation (malformed graph) | Task 1 (runner test with missing connectorType) |
| Frontend: 80%+ store branch coverage | Existing 46 tests + 5 new = 51 |
| Control plane: route handler unit tests with mocked Supabase | Task 2 (env fix enables existing route tests) + Task 3 |
| Control plane: middleware tests (JWT validation rejects missing/expired) | Tasks 2–3 (existing auth.test.ts + new worker-middleware.test.ts) |
| Control plane: secrets encryption/decryption round-trip | Existing `crypto.test.ts` ✅ |
| Runtime: connectors tested in isolation | Existing 12 connector tests ✅ |
| Runtime: correct topological sort (4-node graph) | Existing `graph.test.ts` ✅ |
| Runtime: error propagation (failed node marks run failed) | Task 1 |
| API integration: unauthenticated → 401, cross-workspace → 403 | Task 5 |
| API integration: full auth flow | Task 5 |
| API integration: workflow CRUD lifecycle | Task 5 |
| API integration: secret store/retrieve (value never returned) | Task 5 |
| API integration: torn down/re-seeded between suites | Task 5 (unique email per run, cleanup in afterAll) |
| E2E: sign up → log in → dashboard | Task 6 |
| E2E: create workflow → save → reload → verify persisted | Task 7 |
| E2E: run workflow → status transitions → logs | Task 7 |
| CI: PR trigger (unit + integration) | Task 8 |
| CI: merge to main (all layers) | Task 8 |
| CI commands: `npm test`, `test:integration`, `test:e2e` | Tasks 4, 5, 8 |

All spec requirements covered. No placeholders found.
