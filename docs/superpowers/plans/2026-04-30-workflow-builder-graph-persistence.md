# Workflow Builder — Graph persistence (hybrid C) implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refactor the Workflow Builder so graph edits (structure + position) flow through one persistence pipeline with hybrid autosave (structural soon, positional debounced), explicit flush on Save/Publish/navigation, correct layout for UUID workflows, and visible handling of persist failures—matching `docs/superpowers/specs/2026-04-30-workflow-builder-graph-persistence-design.md`.

**Architecture:** Add a small **serialization module** (`builderNodesToWorkflowPayload`) plus a **persist scheduler** inside the Pinia builder store (or a dedicated composable used only by that store). All `workflowsStore.update` calls for graph `nodes`/`edges` go through `flushGraphToServer()`. Mutations call `markDirty('structural' | 'positional')` which arms separate debounced timers. Single in-flight PUT: if a flush is running, queue exactly one rerun after it settles. Remove per-action `saveWorkflow` from canvas delete handlers in favor of structural scheduling; keep explicit Save/Publish as `flushNow()`.

**Tech Stack:** Vue 3, Pinia, Vue Router, `@vue-flow/core`, Vitest (fake timers), `@vipsos/workflow-schema`, existing `apps/web/src/stores/workflows.ts` API client.

**Spec coverage map:** §3 hybrid table → Tasks 3–4; §4.1 single pipeline → Tasks 2–3; §4.2 serialization → Task 1; §4.3 layout → Task 5; §4.4 Vue Flow → Task 6; §4.5 debounce/single-flight → Tasks 2–4; §4.6 errors → Task 7; §6 testing → Tasks 1, 4, 8; §7 rollout → integrated in tasks.

---

## File map (create / modify)

| Path | Responsibility |
|------|----------------|
| `apps/web/src/workflow/graphPayload.ts` (new) | Pure `builderNodesToWorkflowPayload`, `builderEdgesToWorkflowPayload`; types aligned with `UpdateWorkflowRequest` |
| `apps/web/src/workflow/__tests__/graphPayload.test.ts` (new) | Unit tests for serialization shape |
| `apps/web/src/workflow/layoutFallback.ts` (new) | `layoutNodesWithoutPosition(ids): Record<string, {x,y}>` grid helper for UUID loads |
| `apps/web/src/stores/builder.ts` (modify) | Scheduler state, `flushGraphToServer`, `markDirty`, refactor `saveWorkflow`/`publishWorkflow`/`loadWorkflow`; thin/remove `removeNodesAndSave` immediate PUT pattern |
| `apps/web/src/components/workflow/WorkflowCanvas.vue` (modify) | Call store mutations + `markDirty` only; remove direct persist from delete if moved to store |
| `apps/web/src/views/WorkflowBuilderView.vue` (modify) | `onBeforeRouteLeave` / `onDeactivated` → `store.flushPendingGraph()` |
| `apps/web/src/components/workflow/WorkflowToolbar.vue` (modify) | Wire Save/Publish to `flushNow`; surface persist errors from store |
| `apps/web/src/components/workflow/NodeConfigPanel.vue` (modify) | Inspector changes call `updateNodeConfig` + `markDirty('structural')` if not already in store |
| `apps/web/src/stores/__tests__/builder-persist-scheduler.test.ts` (new) | Fake timers + mock `workflows` store: structural debounce, positional debounce, single-flight queue |

---

### Task 1: Graph payload serialization (pure functions)

**Files:**
- Create: `apps/web/src/workflow/graphPayload.ts`
- Create: `apps/web/src/workflow/__tests__/graphPayload.test.ts`

- [ ] **Step 1: Write failing tests**

Create `apps/web/src/workflow/__tests__/graphPayload.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'
import { builderNodesToWorkflowPayload, builderEdgesToWorkflowPayload } from '../graphPayload'
import type { BuilderNode, BuilderEdge } from '@/stores/builder'

describe('graphPayload', () => {
  it('maps builder nodes to workflow API node shape', () => {
    const nodes: BuilderNode[] = [
      {
        id: 'n1',
        type: 'sourceNode',
        position: { x: 10, y: 20 },
        data: {
          label: 'L',
          config: { a: 1 },
          connectorId: 'c1',
          nodeType: 'connector.source',
          status: 'pending',
        },
      },
    ]
    const out = builderNodesToWorkflowPayload(nodes)
    expect(out).toEqual([
      {
        id: 'n1',
        type: 'connector.source',
        label: 'L',
        config: { a: 1 },
        connectorId: 'c1',
        position: { x: 10, y: 20 },
      },
    ])
  })

  it('maps builder edges', () => {
    const edges: BuilderEdge[] = [{ id: 'e1', source: 'a', target: 'b' }]
    expect(builderEdgesToWorkflowPayload(edges)).toEqual([{ id: 'e1', source: 'a', target: 'b' }])
  })
})
```

- [ ] **Step 2: Run tests — expect FAIL**

Run: `npm --prefix apps/web run test -- src/workflow/__tests__/graphPayload.test.ts`  
Expected: FAIL (module not found or function undefined).

- [ ] **Step 3: Implement `graphPayload.ts`**

Create `apps/web/src/workflow/graphPayload.ts`:

```typescript
import type { WorkflowEdge, WorkflowNode } from '@vipsos/workflow-schema'
import type { BuilderEdge, BuilderNode } from '@/stores/builder'

export function builderNodesToWorkflowPayload(nodes: BuilderNode[]): WorkflowNode[] {
  return nodes.map((n) => ({
    id: n.id,
    type: n.data.nodeType,
    label: n.data.label,
    config: n.data.config,
    connectorId: n.data.connectorId,
    position: n.position,
  }))
}

export function builderEdgesToWorkflowPayload(edges: BuilderEdge[]): WorkflowEdge[] {
  return edges.map((e) => ({ id: e.id, source: e.source, target: e.target }))
}
```

- [ ] **Step 4: Run tests — expect PASS**

Run: `npm --prefix apps/web run test -- src/workflow/__tests__/graphPayload.test.ts`  
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/workflow/graphPayload.ts apps/web/src/workflow/__tests__/graphPayload.test.ts
git commit -m "feat(web): add workflow graph payload serializers"
```

---

### Task 2: Persist scheduler module (unit-tested in isolation)

**Files:**
- Create: `apps/web/src/stores/__tests__/builder-persist-scheduler.test.ts`
- Modify: `apps/web/src/stores/builder.ts` (integrate after tests define expected API)

Implement **in builder store** (keeps one Pinia owner; avoids circular imports):

- Refs: `persistStructuralTimer`, `persistPositionalTimer`, `persistInFlight`, `persistQueued`
- `markDirty(kind: 'structural' | 'positional')` — clears prior timer of that lane; structural uses `setTimeout(..., 100)`; positional uses `setTimeout(..., 500)` (pick values in 100–150 and 400–800 per spec).
- `async flushGraphToServer()` — builds payload via `builderNodesToWorkflowPayload` / `builderEdgesToWorkflowPayload`, calls `workflowsStore.update(id, { nodes, edges })`, then `fetchDefinition(id)`. Sets `persistError` ref to `null` on success; on catch sets `persistError` message and rethrows.
- **Single-flight:** if `flushGraphToServer` re-enters while `persistInFlight`, set `persistQueued = true` and return immediately; in `finally` of the in-flight flush, if `persistQueued`, clear flag and call `flushGraphToServer()` once.

- [ ] **Step 1: Write failing scheduler tests**

In `apps/web/src/stores/__tests__/builder-persist-scheduler.test.ts`, mock `@/lib/api` or `../workflows` like existing `builder.test.ts`, use `vi.useFakeTimers()`, `loadWorkflow`, call `markDirty('structural')` twice quickly, advance timers 100ms, assert `update` called once; then test positional debounce 500ms; test double `flushNow` queues second run (single-flight).

- [ ] **Step 2: Run tests — FAIL**

Run: `npm --prefix apps/web run test -- src/stores/__tests__/builder-persist-scheduler.test.ts`

- [ ] **Step 3: Implement scheduler + wire `saveWorkflow` to `flushGraphToServer`**

Replace inline `nodes.value.map(...)` in `saveWorkflow` with imports from `graphPayload.ts`. Implement `flushPendingGraph` alias = `flushGraphToServer` for route leave.

- [ ] **Step 4: Run builder + new tests**

Run: `npm --prefix apps/web run test -- src/stores/__tests__/builder.test.ts src/stores/__tests__/builder-persist-scheduler.test.ts`  
Fix any regressions (adjust mocks if `saveWorkflow` timing changes).

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/stores/builder.ts apps/web/src/stores/__tests__/builder-persist-scheduler.test.ts apps/web/src/workflow/graphPayload.ts
git commit -m "feat(web): add graph persist scheduler and use serializers in save"
```

---

### Task 3: Route mutations through `markDirty` (remove ad-hoc saves from canvas)

**Files:**
- Modify: `apps/web/src/stores/builder.ts`
- Modify: `apps/web/src/components/workflow/WorkflowCanvas.vue`
- Modify: `apps/web/src/components/workflow/NodeConfigPanel.vue`

- [ ] **Step 1: Refactor `removeNodesAndSave` / `removeEdgesAndSave`**

Replace internal `await saveWorkflow()` with: mutate graph, then `markDirty('structural')`. Keep **snapshot rollback** only if you still await an immediate flush; **preferred:** remove try/rollback from delete path and rely on `persistError` + refetch for failures (spec §4.6). Minimum change: call `markDirty('structural')` after mutations and drop `await saveWorkflow()` from delete/edge delete so deletes are not double-saving.

- [ ] **Step 2: `addNode` / `addEdge` / `updateNodeConfig`**

After each successful mutation, call `markDirty('structural')`.

- [ ] **Step 3: `updateNodePosition`**

Call `markDirty('positional')` only (from `onNodeDragStop`).

- [ ] **Step 4: Canvas**

Ensure `WorkflowCanvas.vue` only calls store methods (no API). `onNodesDelete` → `removeNodes` (new internal batch remove **without** save) + `markDirty('structural')` OR keep `removeNodesAndSave` as a name that only marks dirty—rename to `removeNodes` + dirty for clarity.

- [ ] **Step 5: Run tests**

`npm --prefix apps/web run test -- src/stores/__tests__/builder.test.ts` — update tests that expected immediate `updateMock` call on delete to advance fake timers and/or call `flushGraphToServer` explicitly.

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/stores/builder.ts apps/web/src/components/workflow/WorkflowCanvas.vue apps/web/src/components/workflow/NodeConfigPanel.vue apps/web/src/stores/__tests__/builder.test.ts
git commit -m "refactor(web): route graph mutations through persist scheduler"
```

---

### Task 4: Explicit flush + Publish + `loadWorkflow` layout

**Files:**
- Modify: `apps/web/src/stores/builder.ts`
- Create: `apps/web/src/workflow/layoutFallback.ts`
- Modify: `apps/web/src/views/WorkflowBuilderView.vue`
- Modify: `apps/web/src/components/workflow/WorkflowToolbar.vue`

- [ ] **Step 1: `saveWorkflow` / toolbar**

`saveWorkflow()` becomes `await flushGraphToServer()` (clear debounce timers first). Toolbar `save()` already awaits `saveWorkflow` — ensure it awaits flush and shows `store.persistError` if set.

- [ ] **Step 2: `publishWorkflow`**

After `await saveWorkflow()`, second `update` must still send full `{ status, nodes, edges }` (already in codebase); ensure it uses `builderNodesToWorkflowPayload` for consistency.

- [ ] **Step 3: `loadWorkflow` layout**

Add `isDemoWorkflowId(id: string): boolean` — true only for keys in `WORKFLOW_POSITIONS` (`wf_001`, `wf_002`, `wf_004`). For UUID ids, **do not** use `WORKFLOW_POSITIONS`; if any node lacks `position`, apply `layoutFallback.ts` once:

```typescript
export function positionsForNodesMissingLayout(
  nodeIds: string[],
  indexById: Map<string, number>,
): Record<string, { x: number; y: number }> {
  const out: Record<string, { x: number; y: number }> = {}
  const sorted = [...nodeIds].sort()
  sorted.forEach((id, i) => {
    out[id] = { x: 50 + (i % 4) * 270, y: 150 + Math.floor(i / 4) * 140 }
  })
  return out
}
```

Use only for nodes where `n.position` is undefined/null.

- [ ] **Step 4: Route leave**

In `WorkflowBuilderView.vue`:

```typescript
import { onBeforeRouteLeave } from 'vue-router'
import { useBuilderStore } from '@/stores/builder'

const store = useBuilderStore()
onBeforeRouteLeave(async () => {
  await store.flushPendingGraph?.()
})
```

Expose `flushPendingGraph` on store as alias to `flushGraphToServer` (same as spec naming).

- [ ] **Step 5: Tests + commit**

Add unit test for `isDemoWorkflowId` + layout fallback. Commit: `feat(web): flush graph on save and route leave; UUID layout fallback`.

---

### Task 5: Error surface (minimal)

**Files:**
- Modify: `apps/web/src/stores/builder.ts` — export `persistError` ref, `clearPersistError`
- Modify: `apps/web/src/components/workflow/WorkflowToolbar.vue` — show `persistError` next to save error

- [ ] **Step 1:** Add `persistError = ref<string | null>(null)` set in `flushGraphToServer` catch.

- [ ] **Step 2:** Toolbar shows persist banner; "Retry" calls `flushGraphToServer` again; "Discard" calls `loadWorkflow(currentId)` and clears error.

- [ ] **Step 3:** Commit `feat(web): surface workflow graph persist errors in toolbar`.

---

### Task 6 (optional): Vue Flow `@update:nodes` / `@update:edges`

**Files:**
- Modify: `apps/web/src/components/workflow/WorkflowCanvas.vue`

- [ ] If internal Vue Flow mutations still fight Pinia, add `@update:nodes` / `@update:edges` handlers that replace store arrays (see `@vue-flow/core` docs for v1.48). Commit separately only if reproduction exists.

---

## Plan self-review

| Check | Result |
|-------|--------|
| Spec coverage | All §3–§7 items mapped to Tasks 1–6. |
| Placeholders | None. |
| Type consistency | `BuilderNode` / `WorkflowNode` used consistently with existing `builder.ts`. |
| Gaps | E2E Playwright optional per spec §6 — not scheduled as required task. |

---

## Execution handoff

**Plan complete and saved to `docs/superpowers/plans/2026-04-30-workflow-builder-graph-persistence.md`.**

Two execution options:

1. **Subagent-Driven (recommended)** — Dispatch a fresh subagent per task, review between tasks, fast iteration. **REQUIRED SUB-SKILL:** superpowers:subagent-driven-development.

2. **Inline Execution** — Execute tasks in this session with checkpoints. **REQUIRED SUB-SKILL:** superpowers:executing-plans.

**Which approach do you want?**
