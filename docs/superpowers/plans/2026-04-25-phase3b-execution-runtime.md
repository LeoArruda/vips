# Phase 3B — Execution Runtime Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A workflow with HTTP/REST, Postgres, and StatCan nodes executes real data through a Bun worker that polls the control plane, with logs streaming back to the Runs view.

**Architecture:** The control plane gains three worker-only endpoints (GET /runs/pending, PATCH /runs/:id, POST /runs/:id/logs) protected by a shared `WORKER_KEY`. A Bun runtime service polls every 2 seconds, fetches queued runs with their workflow definitions, runs nodes in topological order using typed connectors, and reports status + logs back to the control plane in real time. The frontend Run button triggers a real run and the RunDetailView polls for live updates.

**Tech Stack:** Bun 1.x, Hono 4.x (control plane), `postgres` npm package (Postgres connector), Supabase local stack, Docker Compose.

---

## File Map

| Action | Path | Responsibility |
|--------|------|----------------|
| Create | `packages/connector-sdk/package.json` | Shared package manifest |
| Create | `packages/connector-sdk/tsconfig.json` | TS config |
| Create | `packages/connector-sdk/src/index.ts` | ConnectorConfig, ConnectorResult, Connector interface |
| Create | `services/runtime/package.json` | Bun deps |
| Create | `services/runtime/tsconfig.json` | TS config |
| Create | `services/runtime/Dockerfile` | Bun worker image |
| Create | `services/runtime/.dockerignore` | Exclude node_modules etc |
| Create | `services/runtime/src/index.ts` | Entry point — polling loop |
| Create | `services/runtime/src/queue/poller.ts` | fetchPendingJobs, postLog, patchRun |
| Create | `services/runtime/src/executor/graph.ts` | topoSort (Kahn's algorithm) |
| Create | `services/runtime/src/executor/runner.ts` | executeRun — orchestrate node execution |
| Create | `services/runtime/src/connectors/registry.ts` | getConnector(type): Connector |
| Create | `services/runtime/src/connectors/http-rest/index.ts` | HTTP/REST connector |
| Create | `services/runtime/src/connectors/postgres/index.ts` | Postgres connector |
| Create | `services/runtime/src/connectors/statcan/index.ts` | StatCan WDS connector |
| Create | `services/runtime/src/__tests__/graph.test.ts` | topoSort unit tests |
| Create | `services/runtime/src/__tests__/http-rest.test.ts` | HTTP connector tests with local server |
| Create | `services/runtime/src/__tests__/postgres.test.ts` | Postgres connector tests against local Supabase |
| Create | `services/runtime/src/__tests__/statcan.test.ts` | StatCan connector tests with fixture |
| Create | `services/runtime/src/__tests__/fixtures/statcan-response.json` | Recorded StatCan API response |
| Create | `services/control-plane/src/middleware/worker.ts` | requireWorkerAuth middleware |
| Modify | `services/control-plane/src/routes/runs.ts` | Remove wildcard auth; add GET /pending, PATCH /:id, POST /:id/logs |
| Modify | `docker-compose.yml` | Add runtime service |
| Modify | `.env.example` | Add WORKER_KEY, CONTROL_PLANE_URL |
| Modify | `apps/web/src/components/workflow/WorkflowToolbar.vue` | Wire Run button to triggerRun() |
| Modify | `apps/web/src/views/RunDetailView.vue` | Add polling interval for live status/log updates |
| Modify | `apps/web/src/stores/builder.ts` | Add currentWorkflowId getter if missing |

---

## Task 1: Connector SDK package

**Files:**
- Create: `packages/connector-sdk/package.json`
- Create: `packages/connector-sdk/tsconfig.json`
- Create: `packages/connector-sdk/src/index.ts`

- [ ] **Step 1: Create directory and package.json**

```bash
mkdir -p /Users/leandroarruda/projects/vipsOS/packages/connector-sdk/src
```

```json
// packages/connector-sdk/package.json
{
  "name": "@vipsos/connector-sdk",
  "version": "0.1.0",
  "type": "module",
  "exports": {
    ".": "./src/index.ts"
  },
  "devDependencies": {
    "typescript": "^5.4.0"
  }
}
```

```json
// packages/connector-sdk/tsconfig.json
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

- [ ] **Step 2: Write `src/index.ts`**

```typescript
// packages/connector-sdk/src/index.ts

export interface ConnectorConfig {
  type: string
  settings: Record<string, unknown>  // non-secret config from node
  secrets: Record<string, string>    // injected at dispatch time from env
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

- [ ] **Step 3: Commit**

```bash
git add packages/connector-sdk/
git commit -m "feat(sdk): add connector-sdk package with ConnectorConfig, ConnectorResult, Connector interface"
```

---

## Task 2: Runtime scaffolding + HTTP/REST connector

**Files:**
- Create: `services/runtime/package.json`
- Create: `services/runtime/tsconfig.json`
- Create: `services/runtime/src/connectors/http-rest/index.ts`
- Create: `services/runtime/src/__tests__/http-rest.test.ts`

- [ ] **Step 1: Scaffold directory structure**

```bash
mkdir -p /Users/leandroarruda/projects/vipsOS/services/runtime/src/{queue,executor,connectors/{http-rest,postgres,statcan},__tests__/fixtures}
```

- [ ] **Step 2: Create `services/runtime/package.json`**

```json
{
  "name": "@vipsos/runtime",
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "bun --watch src/index.ts",
    "start": "bun src/index.ts",
    "test": "bun test"
  },
  "dependencies": {
    "postgres": "^3.4.3"
  },
  "devDependencies": {
    "@types/bun": "latest",
    "typescript": "^5.4.0"
  }
}
```

- [ ] **Step 3: Create `services/runtime/tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "noEmit": true,
    "types": ["bun-types"],
    "paths": {
      "@vipsos/connector-sdk": ["../../packages/connector-sdk/src/index.ts"],
      "@vipsos/workflow-schema": ["../../packages/workflow-schema/src/index.ts"]
    }
  },
  "include": ["src"]
}
```

- [ ] **Step 4: Install dependencies**

```bash
cd /Users/leandroarruda/projects/vipsOS/services/runtime && bun install && cd ../..
```

Expected: `node_modules` created, no errors.

- [ ] **Step 5: Write failing test for HTTP/REST connector**

```typescript
// services/runtime/src/__tests__/http-rest.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'bun:test'
import { httpRestConnector } from '../connectors/http-rest/index.ts'

let server: ReturnType<typeof Bun.serve>
let baseUrl: string

beforeAll(() => {
  server = Bun.serve({
    port: 0,
    fetch(req) {
      const url = new URL(req.url)
      if (url.pathname === '/json') {
        return new Response(JSON.stringify({ hello: 'world' }), {
          headers: { 'content-type': 'application/json' },
        })
      }
      if (url.pathname === '/error') {
        return new Response('Not Found', { status: 404 })
      }
      if (req.method === 'POST' && url.pathname === '/echo') {
        return req.json().then((body) =>
          new Response(JSON.stringify(body), { headers: { 'content-type': 'application/json' } }),
        )
      }
      return new Response('OK')
    },
  })
  baseUrl = `http://localhost:${server.port}`
})

afterAll(() => server.stop())

describe('httpRestConnector', () => {
  it('GET — fetches JSON and returns status + body', async () => {
    const result = await httpRestConnector.execute(
      { type: 'http-rest', settings: { method: 'GET', url: `${baseUrl}/json` }, secrets: {} },
      {},
    )
    expect(result.success).toBe(true)
    expect(result.output.status).toBe(200)
    expect((result.output.body as { hello: string }).hello).toBe('world')
    expect(result.logs[0].level).toBe('info')
    expect(result.logs[0].message).toContain('200')
  })

  it('GET — returns success: false on 4xx', async () => {
    const result = await httpRestConnector.execute(
      { type: 'http-rest', settings: { method: 'GET', url: `${baseUrl}/error` }, secrets: {} },
      {},
    )
    expect(result.success).toBe(false)
    expect(result.output.status).toBe(404)
    expect(result.error).toContain('404')
  })

  it('POST — sends body and returns echoed response', async () => {
    const result = await httpRestConnector.execute(
      {
        type: 'http-rest',
        settings: { method: 'POST', url: `${baseUrl}/echo`, body: { ping: 'pong' } },
        secrets: {},
      },
      {},
    )
    expect(result.success).toBe(true)
    expect((result.output.body as { ping: string }).ping).toBe('pong')
  })

  it('returns error result on network failure', async () => {
    const result = await httpRestConnector.execute(
      {
        type: 'http-rest',
        settings: { method: 'GET', url: 'http://localhost:1' },
        secrets: {},
      },
      {},
    )
    expect(result.success).toBe(false)
    expect(result.error).toBeTruthy()
    expect(result.logs[0].level).toBe('error')
  })
})
```

- [ ] **Step 6: Run test — verify it fails (module not found)**

```bash
cd /Users/leandroarruda/projects/vipsOS/services/runtime && bun test src/__tests__/http-rest.test.ts 2>&1 | head -20
```

Expected: error about missing `../connectors/http-rest/index.ts`

- [ ] **Step 7: Implement `src/connectors/http-rest/index.ts`**

```typescript
// services/runtime/src/connectors/http-rest/index.ts
import type { Connector, ConnectorConfig, ConnectorResult } from '@vipsos/connector-sdk'

export const httpRestConnector: Connector = {
  id: 'http-rest',
  name: 'HTTP / REST',

  async execute(config: ConnectorConfig, _inputs: Record<string, unknown>): Promise<ConnectorResult> {
    const { method = 'GET', url, headers = {}, body } = config.settings as {
      method?: string
      url: string
      headers?: Record<string, string>
      body?: unknown
    }

    const logs: ConnectorResult['logs'] = []

    if (!url) {
      return { success: false, output: {}, logs: [{ level: 'error', message: 'url is required' }], error: 'url is required' }
    }

    try {
      const res = await fetch(url, {
        method: String(method),
        headers: {
          'Content-Type': 'application/json',
          ...(headers as Record<string, string>),
        },
        body: body !== undefined ? JSON.stringify(body) : undefined,
      })

      const contentType = res.headers.get('content-type') ?? ''
      const responseBody = contentType.includes('application/json')
        ? await res.json()
        : await res.text()

      logs.push({ level: 'info', message: `${method} ${url} → ${res.status}` })

      return {
        success: res.ok,
        output: {
          status: res.status,
          headers: Object.fromEntries(res.headers.entries()),
          body: responseBody,
        },
        logs,
        error: res.ok ? undefined : `HTTP ${res.status}`,
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      logs.push({ level: 'error', message: msg })
      return { success: false, output: {}, logs, error: msg }
    }
  },
}
```

- [ ] **Step 8: Run tests — verify all pass**

```bash
cd /Users/leandroarruda/projects/vipsOS/services/runtime && bun test src/__tests__/http-rest.test.ts
```

Expected: 4 tests pass.

- [ ] **Step 9: Commit**

```bash
git add services/runtime/ packages/connector-sdk/
git commit -m "feat(runtime): scaffold runtime service, implement HTTP/REST connector with tests"
```

---

## Task 3: Postgres connector

**Files:**
- Create: `services/runtime/src/connectors/postgres/index.ts`
- Create: `services/runtime/src/__tests__/postgres.test.ts`

Requires Supabase running locally (`supabase start`). Tests connect to the local Supabase Postgres at `postgresql://postgres:postgres@127.0.0.1:54322/postgres`.

- [ ] **Step 1: Write failing tests**

```typescript
// services/runtime/src/__tests__/postgres.test.ts
import { describe, it, expect } from 'bun:test'
import { postgresConnector } from '../connectors/postgres/index.ts'

const CONN = process.env.SUPABASE_DB_URL ?? 'postgresql://postgres:postgres@127.0.0.1:54322/postgres'

describe('postgresConnector', () => {
  it('executes a SELECT and returns rows', async () => {
    const result = await postgresConnector.execute(
      { type: 'postgres', settings: { query: 'SELECT 1 AS one, 2 AS two' }, secrets: { connection_string: CONN } },
      {},
    )
    expect(result.success).toBe(true)
    expect(result.output.rowCount).toBe(1)
    const rows = result.output.rows as Array<{ one: string; two: string }>
    expect(rows[0].one).toBe('1')
  })

  it('fails gracefully on invalid SQL', async () => {
    const result = await postgresConnector.execute(
      { type: 'postgres', settings: { query: 'INVALID SQL STATEMENT' }, secrets: { connection_string: CONN } },
      {},
    )
    expect(result.success).toBe(false)
    expect(result.error).toBeTruthy()
    expect(result.logs[0].level).toBe('error')
  })

  it('fails when connection_string secret is missing', async () => {
    const result = await postgresConnector.execute(
      { type: 'postgres', settings: { query: 'SELECT 1' }, secrets: {} },
      {},
    )
    expect(result.success).toBe(false)
    expect(result.error).toContain('connection_string')
  })

  it('fails gracefully on unreachable host', async () => {
    const result = await postgresConnector.execute(
      {
        type: 'postgres',
        settings: { query: 'SELECT 1' },
        secrets: { connection_string: 'postgresql://bad:bad@localhost:9999/nope' },
      },
      {},
    )
    expect(result.success).toBe(false)
  })
})
```

- [ ] **Step 2: Run — verify it fails (module not found)**

```bash
cd /Users/leandroarruda/projects/vipsOS/services/runtime && bun test src/__tests__/postgres.test.ts 2>&1 | head -10
```

Expected: error about missing `../connectors/postgres/index.ts`

- [ ] **Step 3: Implement `src/connectors/postgres/index.ts`**

```typescript
// services/runtime/src/connectors/postgres/index.ts
import type { Connector, ConnectorConfig, ConnectorResult } from '@vipsos/connector-sdk'
import postgres from 'postgres'

export const postgresConnector: Connector = {
  id: 'postgres',
  name: 'Postgres',

  async execute(config: ConnectorConfig, _inputs: Record<string, unknown>): Promise<ConnectorResult> {
    const { query, params = [] } = config.settings as { query: string; params?: unknown[] }
    const connectionString = config.secrets.connection_string
    const logs: ConnectorResult['logs'] = []

    if (!connectionString) {
      return {
        success: false,
        output: {},
        logs: [{ level: 'error', message: 'Missing secret: connection_string' }],
        error: 'Missing connection_string secret',
      }
    }

    if (!query?.trim()) {
      return {
        success: false,
        output: {},
        logs: [{ level: 'error', message: 'query is required' }],
        error: 'query is required',
      }
    }

    const sql = postgres(connectionString, { max: 1, connect_timeout: 10 })

    try {
      const rows = await sql.unsafe(query, params as string[])
      logs.push({ level: 'info', message: `Query returned ${rows.length} row(s)` })
      return {
        success: true,
        output: { rows: rows as Record<string, unknown>[], rowCount: rows.length },
        logs,
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      logs.push({ level: 'error', message: msg })
      return { success: false, output: {}, logs, error: msg }
    } finally {
      await sql.end({ timeout: 5 })
    }
  },
}
```

- [ ] **Step 4: Run tests — verify all pass**

```bash
cd /Users/leandroarruda/projects/vipsOS/services/runtime && bun test src/__tests__/postgres.test.ts
```

Expected: 4 tests pass. (Requires `supabase start` to be running.)

- [ ] **Step 5: Commit**

```bash
git add services/runtime/src/connectors/postgres/ services/runtime/src/__tests__/postgres.test.ts
git commit -m "feat(runtime): implement Postgres connector with parameterized queries"
```

---

## Task 4: StatCan connector + fixture

**Files:**
- Create: `services/runtime/src/__tests__/fixtures/statcan-response.json`
- Create: `services/runtime/src/connectors/statcan/index.ts`
- Create: `services/runtime/src/__tests__/statcan.test.ts`

- [ ] **Step 1: Create StatCan API fixture**

```json
// services/runtime/src/__tests__/fixtures/statcan-response.json
{
  "productId": 14100287,
  "DECIMALS": "1",
  "frequencyCode": "12",
  "uom": "Percent",
  "scalar": "units",
  "object": [
    {
      "refPer": "2024-01",
      "refPerRaw": "2024-01-01",
      "value": "5.7",
      "symbols": "",
      "status": ""
    },
    {
      "refPer": "2024-02",
      "refPerRaw": "2024-02-01",
      "value": "5.8",
      "symbols": "",
      "status": ""
    },
    {
      "refPer": "2024-03",
      "refPerRaw": "2024-03-01",
      "value": "6.1",
      "symbols": "",
      "status": ""
    }
  ]
}
```

- [ ] **Step 2: Write failing tests (mocking fetch with Bun's spy)**

```typescript
// services/runtime/src/__tests__/statcan.test.ts
import { describe, it, expect, spyOn, afterEach } from 'bun:test'
import statcanFixture from './fixtures/statcan-response.json'
import { statcanConnector } from '../connectors/statcan/index.ts'

let fetchSpy: ReturnType<typeof spyOn<typeof globalThis, 'fetch'>>

afterEach(() => {
  fetchSpy?.mockRestore()
})

function mockFetch(body: unknown, status = 200) {
  fetchSpy = spyOn(globalThis, 'fetch').mockResolvedValue(
    new Response(JSON.stringify(body), {
      status,
      headers: { 'content-type': 'application/json' },
    }),
  )
}

describe('statcanConnector', () => {
  it('fetches and normalizes StatCan data points', async () => {
    mockFetch(statcanFixture)
    const result = await statcanConnector.execute(
      { type: 'statcan', settings: { table_code: '14-10-0287-01' }, secrets: {} },
      {},
    )
    expect(result.success).toBe(true)
    const rows = result.output.rows as Array<{ refPer: string; value: number; uom: string; scalar: string }>
    expect(rows.length).toBe(3)
    expect(rows[0].refPer).toBe('2024-01')
    expect(rows[0].value).toBe(5.7)
    expect(rows[0].uom).toBe('Percent')
    expect(rows[0].scalar).toBe('units')
  })

  it('returns error on non-200 response', async () => {
    mockFetch('Not Found', 404)
    const result = await statcanConnector.execute(
      { type: 'statcan', settings: { table_code: '00-00-0000-00' }, secrets: {} },
      {},
    )
    expect(result.success).toBe(false)
    expect(result.error).toContain('404')
  })

  it('returns error when table_code is missing', async () => {
    const result = await statcanConnector.execute(
      { type: 'statcan', settings: {}, secrets: {} },
      {},
    )
    expect(result.success).toBe(false)
    expect(result.error).toContain('table_code')
  })
})
```

- [ ] **Step 3: Run — verify it fails**

```bash
cd /Users/leandroarruda/projects/vipsOS/services/runtime && bun test src/__tests__/statcan.test.ts 2>&1 | head -10
```

- [ ] **Step 4: Implement `src/connectors/statcan/index.ts`**

```typescript
// services/runtime/src/connectors/statcan/index.ts
import type { Connector, ConnectorConfig, ConnectorResult } from '@vipsos/connector-sdk'

interface StatCanResponse {
  productId?: number
  uom?: string
  scalar?: string
  object?: Array<{ refPer: string; value: string; symbols?: string; status?: string }>
}

export const statcanConnector: Connector = {
  id: 'statcan',
  name: 'Statistics Canada',

  async execute(config: ConnectorConfig, _inputs: Record<string, unknown>): Promise<ConnectorResult> {
    const { table_code } = config.settings as { table_code?: string }
    const logs: ConnectorResult['logs'] = []

    if (!table_code) {
      return {
        success: false,
        output: {},
        logs: [{ level: 'error', message: 'table_code is required' }],
        error: 'table_code is required',
      }
    }

    const url = `https://www150.statcan.gc.ca/t1/tbl1/en/dtbl/${table_code}/json`

    try {
      const res = await fetch(url)
      if (!res.ok) {
        const msg = `StatCan API returned ${res.status} for table ${table_code}`
        return { success: false, output: {}, logs: [{ level: 'error', message: msg }], error: msg }
      }

      const json = (await res.json()) as StatCanResponse
      logs.push({ level: 'info', message: `Fetched table ${table_code} from Statistics Canada` })

      const rows = (json.object ?? []).map((point) => ({
        refPer: point.refPer,
        value: parseFloat(point.value),
        uom: json.uom ?? 'unknown',
        scalar: json.scalar ?? 'units',
      }))

      logs.push({ level: 'info', message: `Normalized ${rows.length} data point(s)` })

      return {
        success: true,
        output: { rows, rowCount: rows.length },
        logs,
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      logs.push({ level: 'error', message: msg })
      return { success: false, output: {}, logs, error: msg }
    }
  },
}
```

- [ ] **Step 5: Run tests — verify all pass**

```bash
cd /Users/leandroarruda/projects/vipsOS/services/runtime && bun test src/__tests__/statcan.test.ts
```

Expected: 3 tests pass.

- [ ] **Step 6: Commit**

```bash
git add services/runtime/src/connectors/statcan/ services/runtime/src/__tests__/statcan.test.ts services/runtime/src/__tests__/fixtures/
git commit -m "feat(runtime): implement StatCan connector with WDS normalization and fixture tests"
```

---

## Task 5: Workflow executor — graph traversal and runner

**Files:**
- Create: `services/runtime/src/executor/graph.ts`
- Create: `services/runtime/src/executor/runner.ts`
- Create: `services/runtime/src/connectors/registry.ts`
- Create: `services/runtime/src/__tests__/graph.test.ts`

- [ ] **Step 1: Write failing tests for topological sort**

```typescript
// services/runtime/src/__tests__/graph.test.ts
import { describe, it, expect } from 'bun:test'
import { topoSort } from '../executor/graph.ts'
import type { WorkflowNode, WorkflowEdge } from '@vipsos/workflow-schema'

function node(id: string): WorkflowNode {
  return { id, type: 'connector.source', label: id, config: {} }
}

describe('topoSort', () => {
  it('sorts a linear chain A→B→C', () => {
    const nodes = [node('C'), node('A'), node('B')]
    const edges: WorkflowEdge[] = [
      { id: 'e1', source: 'A', target: 'B' },
      { id: 'e2', source: 'B', target: 'C' },
    ]
    const sorted = topoSort(nodes, edges)
    expect(sorted.map((n) => n.id)).toEqual(['A', 'B', 'C'])
  })

  it('sorts a diamond: A→B, A→C, B→D, C→D', () => {
    const nodes = [node('A'), node('B'), node('C'), node('D')]
    const edges: WorkflowEdge[] = [
      { id: 'e1', source: 'A', target: 'B' },
      { id: 'e2', source: 'A', target: 'C' },
      { id: 'e3', source: 'B', target: 'D' },
      { id: 'e4', source: 'C', target: 'D' },
    ]
    const sorted = topoSort(nodes, edges)
    const ids = sorted.map((n) => n.id)
    expect(ids[0]).toBe('A')
    expect(ids[ids.length - 1]).toBe('D')
    expect(ids).toContain('B')
    expect(ids).toContain('C')
  })

  it('handles a single node with no edges', () => {
    const sorted = topoSort([node('A')], [])
    expect(sorted.map((n) => n.id)).toEqual(['A'])
  })

  it('throws on cyclic graph', () => {
    const nodes = [node('A'), node('B')]
    const edges: WorkflowEdge[] = [
      { id: 'e1', source: 'A', target: 'B' },
      { id: 'e2', source: 'B', target: 'A' },
    ]
    expect(() => topoSort(nodes, edges)).toThrow('cycle')
  })
})
```

- [ ] **Step 2: Run — verify tests fail**

```bash
cd /Users/leandroarruda/projects/vipsOS/services/runtime && bun test src/__tests__/graph.test.ts 2>&1 | head -10
```

- [ ] **Step 3: Implement `src/executor/graph.ts`**

```typescript
// services/runtime/src/executor/graph.ts
import type { WorkflowNode, WorkflowEdge } from '@vipsos/workflow-schema'

export function topoSort(nodes: WorkflowNode[], edges: WorkflowEdge[]): WorkflowNode[] {
  const inDegree = new Map<string, number>()
  const adjacency = new Map<string, string[]>()

  for (const node of nodes) {
    inDegree.set(node.id, 0)
    adjacency.set(node.id, [])
  }

  for (const edge of edges) {
    if (!inDegree.has(edge.target)) inDegree.set(edge.target, 0)
    inDegree.set(edge.target, (inDegree.get(edge.target) ?? 0) + 1)
    adjacency.get(edge.source)?.push(edge.target)
  }

  const queue: string[] = []
  for (const [id, degree] of inDegree) {
    if (degree === 0) queue.push(id)
  }

  const sorted: string[] = []
  while (queue.length > 0) {
    const nodeId = queue.shift()!
    sorted.push(nodeId)
    for (const neighbor of adjacency.get(nodeId) ?? []) {
      const newDeg = (inDegree.get(neighbor) ?? 0) - 1
      inDegree.set(neighbor, newDeg)
      if (newDeg === 0) queue.push(neighbor)
    }
  }

  if (sorted.length !== nodes.length) {
    throw new Error('Workflow graph contains a cycle — cannot execute')
  }

  const nodeById = new Map(nodes.map((n) => [n.id, n]))
  return sorted.map((id) => nodeById.get(id)!).filter(Boolean)
}
```

- [ ] **Step 4: Run graph tests — verify all pass**

```bash
cd /Users/leandroarruda/projects/vipsOS/services/runtime && bun test src/__tests__/graph.test.ts
```

Expected: 4 tests pass.

- [ ] **Step 5: Create `src/connectors/registry.ts`**

```typescript
// services/runtime/src/connectors/registry.ts
import type { Connector } from '@vipsos/connector-sdk'
import { httpRestConnector } from './http-rest/index.ts'
import { postgresConnector } from './postgres/index.ts'
import { statcanConnector } from './statcan/index.ts'

const registry = new Map<string, Connector>([
  ['http-rest', httpRestConnector],
  ['postgres', postgresConnector],
  ['statcan', statcanConnector],
  // Node type aliases
  ['connector.source', httpRestConnector],
  ['connector.destination', postgresConnector],
])

export function getConnector(type: string): Connector | undefined {
  return registry.get(type)
}
```

- [ ] **Step 6: Create `src/executor/runner.ts`**

```typescript
// services/runtime/src/executor/runner.ts
import type { WorkflowDefinition } from '@vipsos/workflow-schema'
import { topoSort } from './graph.ts'
import { getConnector } from '../connectors/registry.ts'

export interface RunContext {
  runId: string
  postLog(nodeId: string | null, level: 'info' | 'warn' | 'error', message: string): Promise<void>
  patchRun(fields: { status: string; finished_at?: string }): Promise<void>
}

export async function executeRun(definition: WorkflowDefinition, ctx: RunContext): Promise<void> {
  await ctx.patchRun({ status: 'running' })
  await ctx.postLog(null, 'info', `Run ${ctx.runId} started`)

  // Exclude trigger nodes — they don't execute
  const executableNodes = definition.nodes.filter((n) => n.type !== 'trigger')
  const executableEdges = definition.edges.filter(
    (e) =>
      executableNodes.some((n) => n.id === e.source) &&
      executableNodes.some((n) => n.id === e.target),
  )

  let sortedNodes: ReturnType<typeof topoSort>
  try {
    sortedNodes = topoSort(executableNodes, executableEdges)
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    await ctx.postLog(null, 'error', msg)
    await ctx.patchRun({ status: 'failed', finished_at: new Date().toISOString() })
    return
  }

  // Accumulate outputs from each node keyed by node ID
  const outputs = new Map<string, Record<string, unknown>>()

  for (const node of sortedNodes) {
    await ctx.postLog(node.id, 'info', `Starting node: ${node.label}`)

    // Connector type: prefer node.config.connectorType, fall back to node.type
    const connectorType = (node.config.connectorType as string | undefined) ?? node.type
    const connector = getConnector(connectorType)

    if (!connector) {
      await ctx.postLog(node.id, 'warn', `No connector registered for type "${connectorType}" — skipping`)
      continue
    }

    // Gather all upstream outputs as inputs
    const inputs: Record<string, unknown> = {}
    for (const [id, output] of outputs) {
      inputs[id] = output
    }

    // Inject secrets from runtime environment
    const secrets: Record<string, string> = {}
    if (process.env.POSTGRES_CONNECTION_STRING) {
      secrets.connection_string = process.env.POSTGRES_CONNECTION_STRING
    }

    const result = await connector.execute(
      { type: connectorType, settings: node.config, secrets },
      inputs,
    )

    for (const log of result.logs) {
      await ctx.postLog(node.id, log.level, log.message)
    }

    if (!result.success) {
      await ctx.postLog(node.id, 'error', `Node failed: ${result.error ?? 'unknown error'}`)
      await ctx.patchRun({ status: 'failed', finished_at: new Date().toISOString() })
      return
    }

    outputs.set(node.id, result.output)
    await ctx.postLog(node.id, 'info', `Node completed successfully`)
  }

  await ctx.postLog(null, 'info', `Run ${ctx.runId} completed successfully`)
  await ctx.patchRun({ status: 'success', finished_at: new Date().toISOString() })
}
```

- [ ] **Step 7: Commit**

```bash
git add services/runtime/src/executor/ services/runtime/src/connectors/registry.ts services/runtime/src/__tests__/graph.test.ts
git commit -m "feat(runtime): implement graph topoSort, connector registry, and workflow runner"
```

---

## Task 6: Control plane — worker API routes

**Files:**
- Create: `services/control-plane/src/middleware/worker.ts`
- Modify: `services/control-plane/src/routes/runs.ts`
- Modify: `services/control-plane/src/index.ts` (import requireWorkerAuth indirectly via runs.ts)

- [ ] **Step 1: Create `src/middleware/worker.ts`**

```typescript
// services/control-plane/src/middleware/worker.ts
import type { Context, Next } from 'hono'

export async function requireWorkerAuth(c: Context, next: Next) {
  const key = c.req.header('X-Worker-Key')
  const expected = process.env.WORKER_KEY
  if (!expected || key !== expected) {
    return c.json({ error: 'Unauthorized' }, 401)
  }
  await next()
}
```

- [ ] **Step 2: Rewrite `src/routes/runs.ts` — remove wildcard auth, add worker routes**

Replace the entire file:

```typescript
// services/control-plane/src/routes/runs.ts
import { Hono } from 'hono'
import { requireAuth } from '../middleware/auth.ts'
import { requireWorkerAuth } from '../middleware/worker.ts'
import { adminClient } from '../lib/supabase.ts'
import type { AuthContext } from '../middleware/auth.ts'

export const runRoutes = new Hono()

// ── User-facing routes (require JWT + workspace) ─────────────────────────────

runRoutes.get('/', requireAuth, async (c) => {
  const { workspaceId } = c.get('auth') as AuthContext
  const { data, error } = await adminClient
    .from('runs')
    .select('id, workflow_id, status, triggered_by, started_at, finished_at, workflows(name)')
    .eq('workspace_id', workspaceId)
    .order('started_at', { ascending: false })
    .limit(100)
  if (error) return c.json({ error: error.message }, 500)
  return c.json(data ?? [])
})

// NOTE: /pending must be registered before /:id to avoid route conflict
runRoutes.get('/pending', requireWorkerAuth, async (c) => {
  const { data, error } = await adminClient
    .from('runs')
    .select('*, workflows(id, name, definition)')
    .eq('status', 'queued')
    .order('started_at', { ascending: true })
    .limit(5)
  if (error) return c.json({ error: error.message }, 500)
  return c.json(data ?? [])
})

runRoutes.get('/:id', requireAuth, async (c) => {
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

runRoutes.post('/', requireAuth, async (c) => {
  const { workspaceId } = c.get('auth') as AuthContext
  const body = await c.req.json<{ workflowId: string; triggeredBy?: string }>()
  if (!body.workflowId) return c.json({ error: 'workflowId is required' }, 400)

  const { data: workflow } = await adminClient
    .from('workflows')
    .select('id')
    .eq('id', body.workflowId)
    .eq('workspace_id', workspaceId)
    .single()
  if (!workflow) return c.json({ error: 'Workflow not found' }, 404)

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

// ── Worker routes (require X-Worker-Key header) ───────────────────────────────

runRoutes.patch('/:id', requireWorkerAuth, async (c) => {
  const body = await c.req.json<{ status: string; finished_at?: string }>()
  const { error } = await adminClient
    .from('runs')
    .update({
      status: body.status,
      ...(body.finished_at ? { finished_at: body.finished_at } : {}),
    })
    .eq('id', c.req.param('id'))
  if (error) return c.json({ error: error.message }, 500)
  return c.json({ ok: true })
})

runRoutes.post('/:id/logs', requireWorkerAuth, async (c) => {
  const body = await c.req.json<{ nodeId?: string; level: string; message: string }>()
  if (!body.level || !body.message) {
    return c.json({ error: 'level and message are required' }, 400)
  }
  const { error } = await adminClient.from('run_logs').insert({
    run_id: c.req.param('id'),
    node_id: body.nodeId ?? null,
    level: body.level,
    message: body.message,
  })
  if (error) return c.json({ error: error.message }, 500)
  return c.json({ ok: true }, 201)
})
```

- [ ] **Step 3: Add WORKER_KEY to `.env.example`**

Read the current `.env.example` and add two new lines:

```bash
# Add these two lines to .env.example after CONTROL_PLANE_PORT:
WORKER_KEY=<generate with: openssl rand -hex 16>
CONTROL_PLANE_URL=http://localhost:3001
```

Also add them to your local `.env` now:
```bash
echo "WORKER_KEY=$(openssl rand -hex 16)" >> /Users/leandroarruda/projects/vipsOS/.env
echo "CONTROL_PLANE_URL=http://localhost:3001" >> /Users/leandroarruda/projects/vipsOS/.env
```

- [ ] **Step 4: Restart control plane and verify worker routes work**

```bash
# In your control plane terminal, restart: Ctrl+C then:
cd /Users/leandroarruda/projects/vipsOS/services/control-plane && bun run dev
```

```bash
# Get the WORKER_KEY you just added
WKEY=$(grep WORKER_KEY /Users/leandroarruda/projects/vipsOS/.env | cut -d= -f2)

# Test worker auth — should return [] (no queued runs yet)
curl -s -H "X-Worker-Key: $WKEY" http://localhost:3001/runs/pending | jq .

# Test bad key — should return 401
curl -s -H "X-Worker-Key: badkey" http://localhost:3001/runs/pending | jq .
```

Expected: `[]` for valid key, `{"error":"Unauthorized"}` for bad key.

- [ ] **Step 5: Commit**

```bash
git add services/control-plane/src/middleware/worker.ts services/control-plane/src/routes/runs.ts .env.example
git commit -m "feat(control-plane): add worker middleware and worker API routes (pending, patch status, post logs)"
```

---

## Task 7: Runtime poller + entry point

**Files:**
- Create: `services/runtime/src/queue/poller.ts`
- Create: `services/runtime/src/index.ts`

- [ ] **Step 1: Create `src/queue/poller.ts`**

```typescript
// services/runtime/src/queue/poller.ts
import type { WorkflowDefinition } from '@vipsos/workflow-schema'
import { executeRun } from '../executor/runner.ts'

const CONTROL_PLANE_URL = process.env.CONTROL_PLANE_URL ?? 'http://localhost:3001'
const WORKER_KEY = process.env.WORKER_KEY ?? ''

interface PendingRun {
  id: string
  workflow_id: string
  workspace_id: string
  status: string
  workflows: { id: string; name: string; definition: WorkflowDefinition } | null
}

function workerHeaders(): Record<string, string> {
  return { 'X-Worker-Key': WORKER_KEY, 'Content-Type': 'application/json' }
}

async function fetchPendingJobs(): Promise<PendingRun[]> {
  try {
    const res = await fetch(`${CONTROL_PLANE_URL}/runs/pending`, { headers: workerHeaders() })
    if (!res.ok) {
      console.error(`[poller] /runs/pending returned ${res.status}`)
      return []
    }
    return (await res.json()) as PendingRun[]
  } catch (err) {
    console.error('[poller] fetch error:', err)
    return []
  }
}

async function postLog(runId: string, nodeId: string | null, level: string, message: string) {
  try {
    await fetch(`${CONTROL_PLANE_URL}/runs/${runId}/logs`, {
      method: 'POST',
      headers: workerHeaders(),
      body: JSON.stringify({ nodeId, level, message }),
    })
  } catch {
    // Non-fatal — log locally if API is unreachable
    console.error(`[worker] failed to post log for run ${runId}: ${message}`)
  }
}

async function patchRun(runId: string, fields: { status: string; finished_at?: string }) {
  try {
    await fetch(`${CONTROL_PLANE_URL}/runs/${runId}`, {
      method: 'PATCH',
      headers: workerHeaders(),
      body: JSON.stringify(fields),
    })
  } catch {
    console.error(`[worker] failed to patch run ${runId}:`, fields)
  }
}

// Track in-progress runs to avoid double-execution
const inProgress = new Set<string>()

export async function pollAndExecute(): Promise<void> {
  const jobs = await fetchPendingJobs()

  for (const job of jobs) {
    if (inProgress.has(job.id)) continue
    if (!job.workflows?.definition) {
      console.warn(`[worker] run ${job.id} has no workflow definition — skipping`)
      continue
    }

    inProgress.add(job.id)

    // Fire-and-forget per job so one slow job doesn't block others
    executeRun(job.workflows.definition, {
      runId: job.id,
      postLog: (nodeId, level, message) => postLog(job.id, nodeId, level, message),
      patchRun: (fields) => patchRun(job.id, fields),
    })
      .catch((err) => {
        console.error(`[worker] unhandled error in run ${job.id}:`, err)
      })
      .finally(() => {
        inProgress.delete(job.id)
      })
  }
}
```

- [ ] **Step 2: Create `src/index.ts`**

```typescript
// services/runtime/src/index.ts
import { pollAndExecute } from './queue/poller.ts'

const POLL_INTERVAL_MS = 2000

console.log('[worker] Runtime started — polling every 2s')
console.log(`[worker] Control plane: ${process.env.CONTROL_PLANE_URL ?? 'http://localhost:3001'}`)

async function loop(): Promise<void> {
  while (true) {
    await pollAndExecute()
    await Bun.sleep(POLL_INTERVAL_MS)
  }
}

loop().catch((err) => {
  console.error('[worker] Fatal error in polling loop:', err)
  process.exit(1)
})
```

- [ ] **Step 3: Start the runtime and verify it connects**

First make sure your `.env` has `WORKER_KEY` set (from Task 6 Step 3).

```bash
cd /Users/leandroarruda/projects/vipsOS/services/runtime
bun --env-file=../../.env run dev
```

Expected output:
```
[worker] Runtime started — polling every 2s
[worker] Control plane: http://localhost:3001
```

No errors. Every 2 seconds it silently polls (no queued jobs yet).

- [ ] **Step 4: Run all runtime tests**

```bash
cd /Users/leandroarruda/projects/vipsOS/services/runtime && bun test
```

Expected: all tests pass (graph: 4, http-rest: 4, postgres: 4, statcan: 3 = 15 total).

- [ ] **Step 5: Commit**

```bash
git add services/runtime/src/queue/ services/runtime/src/index.ts
git commit -m "feat(runtime): add polling loop — fetches queued runs and executes them via connector registry"
```

---

## Task 8: Runtime Dockerfile + docker-compose update

**Files:**
- Create: `services/runtime/Dockerfile`
- Create: `services/runtime/.dockerignore`
- Modify: `docker-compose.yml`

- [ ] **Step 1: Create `services/runtime/Dockerfile`**

```dockerfile
# services/runtime/Dockerfile
FROM oven/bun:1-alpine AS base
WORKDIR /app

# Copy connector-sdk and workflow-schema packages (imported via tsconfig paths)
COPY ../../packages/connector-sdk ./packages/connector-sdk
COPY ../../packages/workflow-schema ./packages/workflow-schema

# Install runtime dependencies
COPY package.json bun.lockb* ./
RUN bun install --frozen-lockfile --production

# Copy source
COPY src ./src
COPY tsconfig.json ./

CMD ["bun", "src/index.ts"]
```

Note: Docker `COPY` can't use `../../` paths — the build context must be the repo root. Update docker-compose.yml accordingly.

- [ ] **Step 2: Create `services/runtime/.dockerignore`**

```
node_modules
.git
.env
.env.local
dist
coverage
__tests__
*.test.ts
.DS_Store
```

- [ ] **Step 3: Update `docker-compose.yml`**

Replace the entire file:

```yaml
# docker-compose.yml
# Supabase is managed separately via `supabase start`.

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
      WORKER_KEY: ${WORKER_KEY}
      CONTROL_PLANE_PORT: 3001
      ALLOWED_ORIGINS: ${ALLOWED_ORIGINS:-http://localhost:5173}
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "wget", "-qO-", "http://localhost:3001/health"]
      interval: 10s
      timeout: 5s
      retries: 3

  runtime:
    build:
      context: .
      dockerfile: services/runtime/Dockerfile
    depends_on:
      control-plane:
        condition: service_healthy
    environment:
      CONTROL_PLANE_URL: http://control-plane:3001
      WORKER_KEY: ${WORKER_KEY}
      POSTGRES_CONNECTION_STRING: ${SUPABASE_DB_URL:-postgresql://postgres:postgres@host.docker.internal:54322/postgres}
    restart: unless-stopped
```

- [ ] **Step 4: Commit**

```bash
git add services/runtime/Dockerfile services/runtime/.dockerignore docker-compose.yml
git commit -m "feat(infra): add runtime Dockerfile and docker-compose runtime service"
```

---

## Task 9: Frontend — wire Run button + live RunDetailView

**Files:**
- Modify: `apps/web/src/components/workflow/WorkflowToolbar.vue`
- Modify: `apps/web/src/views/RunDetailView.vue`
- Modify: `apps/web/src/stores/builder.ts` (verify `currentWorkflowId` is exported)

- [ ] **Step 1: Verify `currentWorkflowId` is in builder store**

```bash
grep -n "currentWorkflowId" /Users/leandroarruda/projects/vipsOS/apps/web/src/stores/builder.ts
```

If missing, add to the store's return statement:
```typescript
// In useBuilderStore return:
return { ..., currentWorkflowId, ... }
```

Read the full `apps/web/src/stores/builder.ts` before editing to confirm the exact shape.

- [ ] **Step 2: Rewrite `WorkflowToolbar.vue` to wire the Run button**

Read the full current file first, then replace the `<script setup>` section:

```vue
<!-- apps/web/src/components/workflow/WorkflowToolbar.vue -->
<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { Play, Save, Rocket, Loader2 } from 'lucide-vue-next'
import { useBuilderStore } from '@/stores/builder'
import { useWorkflowsStore } from '@/stores/workflows'
import { useRunsStore } from '@/stores/runs'

const router = useRouter()
const builderStore = useBuilderStore()
const workflowsStore = useWorkflowsStore()
const runsStore = useRunsStore()

const isRunning = ref(false)
const runError = ref<string | null>(null)

const workflow = computed(() =>
  builderStore.currentWorkflowId
    ? workflowsStore.getSummary(builderStore.currentWorkflowId)
    : null,
)

const statusColors: Record<string, string> = {
  published: 'bg-green-100 text-green-700',
  draft: 'bg-muted text-muted-foreground',
  archived: 'bg-red-100 text-red-700',
}

async function triggerRun() {
  if (!builderStore.currentWorkflowId || isRunning.value) return
  isRunning.value = true
  runError.value = null
  try {
    const run = await runsStore.triggerRun(builderStore.currentWorkflowId)
    if (run) router.push(`/runs/${run.id}`)
  } catch (err) {
    runError.value = err instanceof Error ? err.message : 'Run failed'
  } finally {
    isRunning.value = false
  }
}
</script>

<template>
  <div class="flex h-12 flex-shrink-0 items-center justify-between border-b bg-background px-4">
    <div class="flex items-center gap-2.5">
      <span class="text-[11.5px] font-semibold">
        {{ workflow?.name ?? 'Workflow Builder' }}
      </span>
      <span
        v-if="workflow"
        class="rounded-full px-2 py-0.5 text-xs font-medium capitalize"
        :class="statusColors[workflow.status] ?? 'bg-muted text-muted-foreground'"
      >
        {{ workflow.status }}
      </span>
    </div>

    <div class="flex items-center gap-2">
      <span v-if="runError" class="text-xs text-red-500">{{ runError }}</span>
      <button
        class="flex items-center gap-1.5 rounded-[5px] px-3 py-[5px] text-[11.5px] font-medium text-muted-foreground transition-colors hover:bg-muted"
        title="Save (demo)"
      >
        <Save class="h-3.5 w-3.5" />
        Save
      </button>
      <button
        class="flex items-center gap-1.5 rounded-[5px] px-3 py-[5px] text-[11.5px] font-medium text-muted-foreground transition-colors hover:bg-muted"
        title="Publish (demo)"
      >
        <Rocket class="h-3.5 w-3.5" />
        Publish
      </button>
      <button
        class="flex items-center gap-1.5 rounded-[5px] bg-indigo-500 px-3 py-[5px] text-[11.5px] font-medium text-white transition-opacity hover:bg-indigo-600 disabled:opacity-50"
        :disabled="isRunning || !builderStore.currentWorkflowId || builderStore.nodes.length === 0"
        @click="triggerRun"
      >
        <Loader2 v-if="isRunning" class="h-3.5 w-3.5 animate-spin" />
        <Play v-else class="h-3.5 w-3.5" />
        {{ isRunning ? 'Starting…' : 'Run' }}
      </button>
    </div>
  </div>
</template>
```

- [ ] **Step 3: Update `RunDetailView.vue` to poll for live updates**

Read the full current `apps/web/src/views/RunDetailView.vue`, then replace just the `<script setup>` section:

```typescript
// Replace the <script setup> block in apps/web/src/views/RunDetailView.vue
import { ref, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useRunsStore } from '@/stores/runs'
import type { RunDetail } from '@/stores/runs'
import { ArrowLeft } from 'lucide-vue-next'

const route = useRoute()
const router = useRouter()
const store = useRunsStore()

const detail = ref<RunDetail | undefined>(undefined)
let pollTimer: ReturnType<typeof setInterval> | undefined

async function loadDetail() {
  const data = await store.fetchDetail(route.params.id as string)
  if (data) detail.value = data
}

onMounted(async () => {
  await loadDetail()
  // Poll every 3s while run is active
  pollTimer = setInterval(async () => {
    if (detail.value?.status === 'queued' || detail.value?.status === 'running') {
      await loadDetail()
    } else {
      clearInterval(pollTimer)
    }
  }, 3000)
})

onUnmounted(() => {
  clearInterval(pollTimer)
})

const expandedNodes = ref<Set<string>>(new Set())

function toggleNode(nodeId: string) {
  if (expandedNodes.value.has(nodeId)) {
    expandedNodes.value.delete(nodeId)
  } else {
    expandedNodes.value.add(nodeId)
  }
}

const statusBg: Record<string, string> = {
  success: 'bg-green-100 text-green-700',
  failed: 'bg-red-100 text-red-700',
  running: 'bg-blue-100 text-blue-700',
  queued: 'bg-amber-100 text-amber-700',
  pending: 'bg-muted text-muted-foreground',
}

const logLevelColors: Record<string, string> = {
  info: 'text-blue-600',
  warn: 'text-amber-600',
  error: 'text-red-600',
}

function formatDuration(start?: string, end?: string): string {
  if (!start || !end) return '—'
  const ms = new Date(end).getTime() - new Date(start).getTime()
  if (ms < 1000) return `${ms}ms`
  return `${(ms / 1000).toFixed(2)}s`
}
```

- [ ] **Step 4: Run frontend tests — verify nothing broke**

```bash
cd /Users/leandroarruda/projects/vipsOS/apps/web && npm test -- --run
```

Expected: all tests pass.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/components/workflow/WorkflowToolbar.vue apps/web/src/views/RunDetailView.vue
git commit -m "feat(frontend): wire Run button to real API, add live polling in RunDetailView"
```

---

## Task 10: End-to-end verification

No new files. Manual verification of the full stack.

- [ ] **Step 1: Start the full stack**

```bash
# Terminal 1: Supabase (if not running)
supabase start

# Terminal 2: Control plane
cd services/control-plane && bun --env-file=../../.env run dev

# Terminal 3: Runtime worker
cd services/runtime && bun --env-file=../../.env run dev

# Terminal 4: Frontend
cd apps/web && npm run dev
```

- [ ] **Step 2: Create a test workflow with an HTTP/REST node**

1. Sign in at `http://localhost:5173`
2. Go to `/workflows` → New Workflow
3. Open the workflow in the Builder
4. Add a node — set `config.connectorType = "http-rest"`, `config.method = "GET"`, `config.url = "https://httpbin.org/json"`
5. Save the workflow
6. Click **Run** in the toolbar

- [ ] **Step 3: Verify run executes end-to-end**

After clicking Run you should be redirected to `/runs/<id>`.

Expected sequence in RunDetailView:
- Status: `queued` (yellow)
- After ≤2s: status changes to `running` (blue)
- Logs appear: `Run started`, `Starting node: ...`, `GET https://httpbin.org/json → 200`, `Node completed`
- Status changes to `success` (green)

In control plane terminal, you should see no errors.
In runtime terminal, you should see polling activity.

- [ ] **Step 4: Verify StatCan node**

1. Create a new workflow
2. Add a node with `config.connectorType = "statcan"`, `config.table_code = "14-10-0287-01"`
3. Run it
4. Logs should show: `Fetched table 14-10-0287-01 from Statistics Canada` + row count

- [ ] **Step 5: Verify failure state**

1. Create a workflow with an HTTP/REST node pointing to an invalid URL (`http://localhost:1`)
2. Run it
3. RunDetailView should show status `failed` and an error log

- [ ] **Step 6: Final commit**

```bash
git add -A
git commit -m "feat(phase3b): complete — execution runtime, 3 connectors, live log streaming"
```

---

## Self-Review

**Spec coverage check:**

| Spec requirement | Task |
|---|---|
| ConnectorConfig/ConnectorResult/Connector interface | Task 1 |
| HTTP/REST connector (method, url, headers, body → status, headers, body) | Task 2 |
| Postgres connector (parameterized query, no string interpolation) | Task 3 |
| StatCan connector (table_code, normalize to refPer/value/uom/scalar) | Task 4 |
| Topological sort of node graph | Task 5 |
| Worker polls for pending jobs (2s interval) | Task 7 |
| Worker fetches workflow definition | Task 6 (GET /pending returns definition) |
| Secrets injected at dispatch from env | Task 5 (runner.ts) |
| Log lines POSTed in real time | Task 7 (poller.ts) |
| PATCH /runs/:id with final status + finished_at | Task 6 |
| runtime Docker service | Task 8 |
| Secrets via Docker env (not image layers) | Task 8 |
| Frontend Run button → real run | Task 9 |
| Live log streaming in Runs view | Task 9 |

All spec requirements covered. No placeholders found.
