# Workflow Builder — Graph persistence & canvas state design

**Date:** 2026-04-30  
**Status:** Approved (persistence option **C — hybrid**; spec reviewed 2026-04-30)  
**Scope:** How the Workflow Builder records, edits, and persists **nodes**, **edges**, and **positions** so deletes and layout stay correct across reloads, without ad-hoc fixes scattered across the canvas and stores.

---

## 1. Goals

1. **One mental model:** The workflow graph is a single document; the UI edits it; persistence is predictable.
2. **Deletes stick:** Removing nodes or edges must not reappear after navigation or reload unless the user undoes or the server rejects the change with a clear recovery path.
3. **Layout stays sane:** Positions reflect what the user placed or what the server stored—no silent overrides from demo-only layout maps for real workflow IDs.
4. **Fewer moving parts:** Canvas components orchestrate interaction; **one** layer owns “when and what to send to the API.”
5. **Professional defaults:** Hybrid autosave (option **C**) balances correctness for structural edits with less write churn during drag.

---

## 2. Current pain (baseline)

- **Dual representation:** Vue Flow types + Pinia `BuilderNode` / `BuilderEdge` vs API `definition.nodes` / `definition.edges` invite drift (e.g. save paths that omit edges, or partial PUT merge semantics).
- **Layout override:** `WORKFLOW_POSITIONS` keyed by demo IDs fills missing positions; for UUID workflows this produces **disorganized** layouts when `position` is missing or stale.
- **Persistence sprawl:** Manual Save, delete handlers that save, publish doing multiple updates—hard to reason about ordering and “last write wins.”
- **Silent failure risk:** If a PUT fails after local mutation, the UI can diverge from the server until reload.

---

## 3. Chosen product behavior: **Option C (hybrid)**

| Change class | Examples | Persist behavior |
|--------------|----------|------------------|
| **Structural** | Add node, delete node, delete edge, connect nodes, disconnect (edge remove), inspector edits that affect graph identity or config payload | **Persist soon:** enqueue a save immediately or after a **short** debounce (e.g. 0–150 ms) so a burst of related updates (multi-select delete) coalesce to **one** PUT. |
| **Positional only** | Node drag (`node-drag-stop`), batch nudge | **Debounced persist:** flush after **quiet period** (recommended **400–800 ms** after last drag stop) **or** on explicit **Save** / **Publish** / **route leave** (whichever comes first). |

**Explicit Save** remains as **“flush now”** for all pending changes (structural + positional), for user reassurance and for offline-slow networks.

**Publish** always sends a **full** current graph (nodes + edges + positions) together with `status` so the server never re-merges graph slices from a stale read of `current.definition`.

---

## 4. Architecture

### 4.1 Single pipeline

Introduce a narrow **graph persistence boundary** (name illustrative: `persistWorkflowGraph` or `useWorkflowGraphPersistence`):

- **Input:** Current draft graph from the editor (normalized `WorkflowNode[]` / `WorkflowEdge[]` aligned with `@vipsos/workflow-schema` or a dedicated internal type that maps 1:1).
- **Output:** `PUT /workflows/:id` with `{ nodes, edges, trigger? }` as required by the control plane today; no duplicate ad-hoc `update` calls from leaf UI components.

The **builder store** (or composable it calls) is the **only** module that invokes `workflowsStore.update` for graph content. `WorkflowCanvas.vue` emits events or calls store actions; it does **not** call the API.

### 4.2 Serialization

- **`toApiDefinitionSlice(draft)`** — Pinia / Vue Flow → payload fields (`nodes`, `edges`). Unit-tested.
- **`fromApiDefinition(row)`** — GET single workflow → normalized draft + Vue Flow `type` mapping. Unit-tested round-trip for shape (positions optional on nodes only where API allows).

### 4.3 Layout rules

- **Real workflows (UUID ids):** Never apply `WORKFLOW_POSITIONS` (or any demo map). Use `node.position` from server; if absent, use a **single** deterministic layout helper (e.g. grid index by stable sort of `id`) **once after load**, then treat resulting positions as user-owned and persist on next structural save or debounced position flush.
- **Seeded demos (`wf_001`, etc.):** May keep static positions for fixtures **only** if those workflows remain in the product; prefer moving demo data to JSON fixtures loaded like any other workflow to avoid two code paths.

### 4.4 Vue Flow integration

- Prefer **controlled** graph updates aligned with Vue Flow docs: parent owns `nodes` / `edges`; handle library update events where applicable so internal state and Pinia do not fight.
- All mutations (add, remove, connect, drag end) go through **store actions** that update the draft and call **`schedulePersist(kind: 'structural' | 'positional')`**.

### 4.5 Debouncing & coalescing

- **Structural queue:** Leading/trailing debounce ≤ **150 ms**; always coalesce to **one** in-flight PUT per workflow (latest draft wins: if a PUT is in flight, queue one follow-up flush after ACK or failure).
- **Positional queue:** Debounce **400–800 ms** from last position change; same single-flight rule.
- **Flush triggers:** User clicks **Save**; user clicks **Publish**; **`onBeforeRouteLeave`** / `onDeactivated` when leaving the builder route; optional **window `beforeunload`** if there is dirty state (browser may still ignore—Save CTA remains primary).

### 4.6 Errors & concurrency

- On **failed persist:** Surface a non-blocking error (toast or inline banner); keep local draft; offer **Retry** and **Reload from server** (discard local). Do not silently revert structural deletes without user context.
- **Future:** If multi-tab editing appears, add `version` / `updated_at` optimistic locking on PUT; out of scope for this spec’s first implementation unless already trivial with existing columns.

---

## 5. Non-goals (this iteration)

- Operational transform / CRDT for simultaneous multi-user node editing.
- Replacing Postgres JSONB with normalized `workflow_nodes` tables (optional later).
- Changing runtime execution semantics—only builder persistence and canvas state.

---

## 6. Testing

1. **Unit:** `toApiDefinitionSlice` / `fromApiDefinition` round-trip; structural vs positional scheduler coalescing (timers with Vitest fake timers).
2. **Integration (control plane):** PUT with nodes+edges, GET same id, assert graph equality (existing route patterns).
3. **E2E (optional):** Delete node → leave builder → return → node absent; drag node → short wait → reload → position stable within tolerance.

---

## 7. Migration / rollout

1. Implement persistence module + scheduler behind the builder store API used by canvas and toolbar.
2. Remove or quarantine `WORKFLOW_POSITIONS` for non-demo IDs; verify UUID flows only use persisted positions.
3. Delete redundant direct `update` paths from components once the store exposes `schedulePersist` / `flushPendingGraph`.
4. Keep **Save** and **Publish** as explicit flush points during rollout so power users can force sync while autosave is validated.

---

## 8. Self-review (spec quality)

| Check | Result |
|-------|--------|
| Placeholders | None intentional; numeric debounce ranges are recommendations and may be tuned in implementation. |
| Internal consistency | Hybrid C matches scheduler split; publish full-graph rule kept from prior analysis. |
| Scope | Focused on builder persistence and layout source of truth; no unrelated UI. |
| Ambiguity | “Structural” explicitly includes edge delete/connect and inspector config that affects saved nodes; positional is drag-only. |

---

## 9. Approval

- **Persistence product choice:** **C — hybrid** (user confirmed).  
- **Next step after spec approval:** Use `writing-plans` to produce an implementation plan (file touch list, order of refactors, test additions). **No implementation until this spec is reviewed.**
