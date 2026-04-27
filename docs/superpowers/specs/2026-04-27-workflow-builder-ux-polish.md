# Workflow Builder — UI/UX Polish Design Spec

**Date:** 2026-04-27
**Status:** Approved
**Scope:** Visual and interaction refinements to the Workflow Builder — node components, palette, canvas, inspector, and auth shell.

---

## 1. Goals

Bring the Workflow Builder closer to professional data-integration tools (n8n as reference). Specific problems to fix:

1. Nodes are too large (200px wide, ~44px tall) — users zoom out to see multi-node flows.
2. Node handles are low-opacity, single per side — no multi-output support.
3. Palette shows only 4 generic type names — registered connectors are invisible at build time.
4. No data preview on nodes — users must open Run logs to understand what each node produces.
5. Canvas is a plain grey/white surface — no spatial reference grid.
6. Login and Signup pages render inside the full AppShell (sidebar + topbar visible behind the form).

---

## 2. Node Component Redesign

All four node types (Source, Destination, Transform, Branch) are rebuilt with a shared compact layout.

### 2.1 Layout

```
┌────────────────────────┐  ← 5px accent bar (color per type)
│ [icon]  Node name       │  ← 24×24 icon, 12px bold name
│         sub-label       │  ← 10px muted (method, table, etc.)
├────────────────────────┤
│ Schema │ Output         │  ← tabbed preview band
│ id · name · email…     │
└────────────────────────┘
```

- **Width:** 160px fixed
- **Total height:** ~80px (varies slightly with sub-label length)
- **Accent bar:** 5px tall, border-radius top only, color-coded by type
  - Source: `blue-500`
  - Destination: `green-500`
  - Transform: `amber-500`
  - Branch: `purple-500`
- **Icon:** 24×24 rounded square, tinted background matching accent color at 10% opacity
- **Status dot:** 8×8px circle, top-right corner, unchanged from current behaviour (hidden when `pending`)

### 2.2 Handles

| Node type   | Input handles | Output handles |
|-------------|---------------|----------------|
| Source      | 0             | 1 (default) + configurable |
| Destination | 1             | 0 |
| Transform   | 1             | 1 (default) + configurable |
| Branch      | 1             | 2 fixed (true / false) |

Handles are 10×10px filled circles, `border-2`, fully opaque (no `opacity-60`). Multiple output handles stack vertically on the right edge, evenly spaced. Vue Flow `Handle` positions are set programmatically based on the count.

### 2.3 Tabbed Preview Band

A thin strip at the bottom of every node, separated by a `border-t`.

**Schema tab** (default, always visible):
- Shows field names inferred from the node's `config` object at render time — no API call required.
- HTTP/REST: `{ method } · { url path }` → field list derived from last known response shape, or `Configure node to preview` if unconfigured.
- Postgres: column names from the `query` string (best-effort parse), or table name.
- StatCan: `table_code` value.
- Fallback: `—` when config is empty.

**Output tab** (populated after a run):
- Shows: `✓ N rows · X kB` (success) or `✗ Error: <short message>` (failure).
- Before first run: muted italic `Run to see output`.
- Data sourced from the run log entries already stored in `run_logs` — no new backend work needed.

Tab state is local to the component (no store). Clicking a tab label switches the visible content.

---

## 3. Node Palette Redesign

The left sidebar (`NodePalette.vue`) is restructured into three labelled sections with a search bar.

### 3.1 Structure

```
┌─────────────────────────┐
│ 🔍 Search nodes…        │
├─────────────────────────┤
│ DATA FLOW ─────────     │
│  ↳ Source               │
│  ↳ Destination          │
├─────────────────────────┤
│ LOGIC ──────────        │
│  ↳ Transform            │
│  ↳ Branch               │
├─────────────────────────┤
│ CONNECTORS ─────────    │
│  ↳ HTTP / REST          │
│  ↳ Postgres             │
│  ↳ StatCan              │
└─────────────────────────┘
```

**Search:** filters by name across all three sections; empty state shows "No nodes match".

**Data Flow** — generic Source and Destination nodes. User picks the connector type inside the inspector after dropping onto the canvas. Unchanged drag behaviour.

**Logic** — Transform and Branch. Unchanged.

**Connectors** — one entry per registered connector (`http-rest`, `postgres`, `statcan`). Dragging a connector item onto the canvas creates a **Source** node with `config.connectorType` pre-set to that connector. The inspector opens automatically so the user can fill in remaining config (URL, query, table code).

Palette width stays at `w-52` (208px). Section labels use a horizontal rule style (`::after` pseudo-element fills remaining space).

---

## 4. Configurable Output Handles (Inspector)

The right-side inspector panel gains an **Outputs** section for Source and Transform nodes (not Destination or Branch, which have fixed output counts).

### 4.1 Data model

`outputs` is stored inside the existing `config` object on each node, so it serializes through the existing `updateNodeConfig` path and round-trips to the backend with no schema changes:

```typescript
// inside BuilderNodeData.config
config.outputs?: number  // defaults to 1 if absent
```

The node component reads `props.data.config.outputs ?? 1` to render the correct number of `<Handle>` elements. No new store actions are needed.

### 4.2 Inspector UI

```
OUTPUTS ───────────────
  ● Output 1  · default
  ● Output 2           ×
  [+ Add destination]
```

- **Output 1** is always present and has no × button.
- Each additional output row has an × that decrements `outputs` and removes the last handle.
- **"+ Add destination"** is a dashed-border button that increments `outputs` by 1. Maximum: 5 outputs.
- Changes are written immediately via `updateNodeConfig` (same as other inspector fields).

### 4.3 Canvas rendering

`SourceNode.vue` and `TransformNode.vue` compute handle positions from `props.data.config.outputs ?? 1`:

```
topOffset(i, total) = ((i + 1) / (total + 1)) * 100 + '%'
```

Each handle is a `<Handle type="source" :style="{ top: topOffset(i, outputs) }">`.

---

## 5. Dotted Grid Canvas Background

`WorkflowCanvas.vue` adds Vue Flow's built-in `<Background>` component:

```vue
<Background variant="dots" :gap="20" :size="1" color="#e2e8f0" />
```

No custom CSS required. The dots provide spatial reference without distracting from nodes.

---

## 6. Auth Pages — Standalone Layout

`LoginView.vue` and `SignUpView.vue` currently render inside `AppShell`, exposing the full sidebar and topbar behind the form.

**Fix:** update `App.vue`'s `useShell` computed to exclude auth routes:

```typescript
const AUTH_ROUTES = ['/auth/login', '/auth/signup']
const useShell = computed(() => !AUTH_ROUTES.some(r => route.path.startsWith(r)) && route.path !== '/embedded')
```

No changes to the view components themselves.

---

## 7. Files Changed

| Action | File | Change |
|--------|------|--------|
| Modify | `apps/web/src/components/workflow/nodes/SourceNode.vue` | Compact layout, accent bar, tabbed preview, dynamic output handles |
| Modify | `apps/web/src/components/workflow/nodes/DestinationNode.vue` | Compact layout, accent bar, tabbed preview |
| Modify | `apps/web/src/components/workflow/nodes/TransformNode.vue` | Compact layout, accent bar, tabbed preview, dynamic output handles |
| Modify | `apps/web/src/components/workflow/nodes/LogicNode.vue` | Compact layout, accent bar, tabbed preview, 2 fixed outputs |
| Modify | `apps/web/src/components/workflow/NodePalette.vue` | 3-section layout, search bar, connector items |
| Modify | `apps/web/src/components/workflow/WorkflowCanvas.vue` | Add `<Background variant="dots">` |
| Modify | `apps/web/src/components/workflow/inspector/SourceInspector.vue` | Add Outputs section with "+ Add destination" |
| Modify | `apps/web/src/components/workflow/inspector/TransformInspector.vue` | Add Outputs section with "+ Add destination" |
| Modify | `apps/web/src/stores/builder.ts` | Add `outputs?: number` to `BuilderNodeData` |
| Modify | `apps/web/src/App.vue` | Exclude `/auth/*` routes from AppShell |

---

## 8. Out of Scope

- Connector auto-discovery from a backend registry (connectors are hard-coded in the palette for this phase)
- Schema inference via live API calls or query parsing beyond best-effort string matching
- Drag-to-reorder outputs in the inspector
- Collapsible or minimised node mode
- Node search / filter on the canvas
- Any backend changes — all changes are frontend only

---

## 9. Success Criteria

- A 4-node workflow (Source → Transform → Branch → Destination) fits on a 1440px screen without zooming
- Dropping a "Postgres" connector from the palette creates a Source node with `connectorType: "postgres"` pre-set
- Adding a second output handle in the inspector renders a second handle on the canvas and accepts a new connection
- Schema tab shows field hints on a configured node without running the workflow
- Output tab shows row count after a successful run
- Login and Signup pages render with no sidebar or topbar visible
