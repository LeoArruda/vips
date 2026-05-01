# Transformation Layer — Design Spec

**Date:** 2026-04-30
**Status:** Approved
**Goal:** Implement all 13 transformation types from the Transformation Layer PRD as distinct canvas nodes with full frontend configuration UIs and in-memory TypeScript execution in the runtime worker.

---

## 1. Context and Current State

The workflow builder canvas currently has one transformation type: `transform.map`. Its inspector panel shows a dropdown with five hardcoded options (map / filter / join / aggregate / split) and an output count. No actual per-type configuration exists, and the runtime worker has no transform execution logic.

This spec replaces that stub with a complete transformation system covering all 13 types defined in `docs/superpowers/Transformation.md`.

---

## 2. Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Scope | All 13 types, end-to-end | Full PRD coverage |
| Canvas representation | 13 distinct `NodeType` entries | Instant visual readability — type is obvious from color + icon |
| Execution model | In-memory TypeScript | Pure functions, no extra infrastructure, consistent with Bun runtime |
| Field awareness | Live schema propagation through graph | Inspectors show real field pickers before any run |
| Code Step languages | JavaScript / TypeScript only | Bun-native, no sidecar containers needed |

---

## 3. Type System

### 3.1 New `NodeType` values (`packages/workflow-schema/src/types.ts`)

```typescript
export type NodeType =
  | 'connector.source'
  | 'connector.destination'
  | 'transform.map'        // Field Mapping
  | 'transform.filter'     // Record Filtering
  | 'transform.join'       // Join
  | 'transform.merge'      // Merge / Upsert
  | 'transform.union'      // Union
  | 'transform.convert'    // Data Type Conversion
  | 'transform.derive'     // Derived Columns / Formulas
  | 'transform.aggregate'  // Aggregation
  | 'transform.flatten'    // Flatten Nested JSON
  | 'transform.lookup'     // Lookup / Reference Data Enrichment
  | 'transform.validate'   // Validation Rules
  | 'transform.cleanse'    // Standardization & Cleansing
  | 'transform.code'       // Code Step
  | 'logic.branch'
  | 'trigger'

export type TransformNodeType = Extract<NodeType, `transform.${string}`>
```

### 3.2 `SchemaField` type

```typescript
export interface SchemaField {
  name: string
  type: 'string' | 'number' | 'boolean' | 'date' | 'object' | 'array' | 'unknown'
  nullable?: boolean
}
```

### 3.3 `WorkflowNode` gains `outputSchema`

```typescript
export interface WorkflowNode {
  id: string
  type: NodeType
  label: string
  config: Record<string, unknown>
  connectorId?: string
  outputSchema?: SchemaField[]   // populated when a node is configured; persisted in JSONB
  position?: { x: number; y: number }
}
```

---

## 4. Schema Propagation

### 4.1 How schemas flow

When a source node inspector saves its config, it writes `outputSchema` into the node's config via `store.updateNodeConfig()`. This persists to the backend as part of the workflow definition's JSONB `definition` field.

When a transform inspector opens, it reads the schema of all immediately upstream nodes via a new builder store selector.

### 4.2 Builder store addition (`apps/web/src/stores/builder.ts`)

```typescript
function getUpstreamSchema(nodeId: string): SchemaField[] {
  const incomingEdges = edges.value.filter(e => e.target === nodeId)
  const schemas = incomingEdges.flatMap(e => {
    const sourceNode = nodes.value.find(n => n.id === e.source)
    return (sourceNode?.data.config.outputSchema as SchemaField[] | undefined) ?? []
  })
  const seen = new Set<string>()
  return schemas.filter(f => seen.has(f.name) ? false : (seen.add(f.name), true))
}
```

For single-input nodes, `getUpstreamSchema` returns a flat deduplicated `SchemaField[]`. For Join, Union, and Merge — which have two input handles — the inspectors need left and right schemas separately. A second selector is added for this case:

```typescript
function getUpstreamSchemaPerHandle(nodeId: string): Record<string, SchemaField[]> {
  const incomingEdges = edges.value.filter(e => e.target === nodeId)
  return Object.fromEntries(incomingEdges.map(e => {
    const src = nodes.value.find(n => n.id === e.source)
    const schema = (src?.data.config.outputSchema as SchemaField[] | undefined) ?? []
    return [e.targetHandle ?? e.source, schema]
  }))
}
```

JoinInspector, UnionInspector, and MergeInspector call `getUpstreamSchemaPerHandle` so they can present left-field and right-field pickers independently.

### 4.3 `useUpstreamSchema` composable (`apps/web/src/composables/useUpstreamSchema.ts`)

```typescript
export function useUpstreamSchema(nodeId: Ref<string>) {
  const store = useBuilderStore()
  return computed(() => store.getUpstreamSchema(nodeId.value))
}
```

All 13 inspector sub-components call this composable to populate field-picker dropdowns.

### 4.4 Schema inference per source type

| Source | Inference method |
|---|---|
| Postgres | Parse `SELECT` column list from query; `[{ name: '*', type: 'unknown' }]` for `SELECT *` |
| HTTP/REST | Parse response JSON keys on first successful sample run |
| StatCan | Fixed: `refPer · value · uom · scalar` hardcoded at config time |

### 4.5 Output schema computation per transform type

Each inspector sub-component writes `outputSchema` back after saving config:

| Type | Output schema |
|---|---|
| Filter / Cleanse / Validate | Same as input schema (records removed or flagged, fields unchanged) |
| Map / Convert / Derive | Declared target fields from the mapping / conversion / formula config |
| Aggregate | Grouping fields + declared aggregate aliases |
| Join / Union / Merge | Union of selected output fields from both inputs |
| Flatten | Inferred from selected JSON paths |
| Lookup | Input schema + declared enrichment fields from reference |
| Code Step | User-declared output schema (manual — code is opaque) |

---

## 5. Frontend — Transform Registry

### 5.1 Registry definition (`apps/web/src/transforms/registry.ts`)

```typescript
interface TransformDefinition {
  type: TransformNodeType
  label: string
  description: string
  icon: Component           // lucide-vue-next icon, markRaw wrapped
  accentColor: string       // hex
  paletteGroup: 'shape' | 'combine' | 'quality' | 'code'
  inputCount: 1 | 2         // 2 for Join, Union, Merge; 1 for all others
  inspectorComponent: Component
}

export const TRANSFORM_REGISTRY: Record<TransformNodeType, TransformDefinition>
```

### 5.2 Registry entries

| NodeType | Label | Accent color | Palette group | Icon |
|---|---|---|---|---|
| `transform.map` | Map Fields | `#f59e0b` | shape | ArrowLeftRight |
| `transform.filter` | Filter | `#ef4444` | shape | Filter |
| `transform.derive` | Derive | `#f97316` | shape | Type |
| `transform.convert` | Convert | `#10b981` | shape | RefreshCw |
| `transform.aggregate` | Aggregate | `#06b6d4` | shape | BarChart2 |
| `transform.flatten` | Flatten JSON | `#0ea5e9` | shape | Maximize2 |
| `transform.join` | Join | `#8b5cf6` | combine | Combine |
| `transform.union` | Union | `#14b8a6` | combine | ArrowDown |
| `transform.merge` | Merge | `#a16207` | combine | ListOrdered |
| `transform.lookup` | Lookup | `#6366f1` | quality | Search |
| `transform.validate` | Validate | `#84cc16` | quality | Shield |
| `transform.cleanse` | Cleanse | `#ec4899` | quality | Trash2 |
| `transform.code` | Code Step | `#64748b` | code | Code2 |

---

## 6. Frontend — Canvas Layer

### 6.1 `TransformNode.vue` (single shared component)

- Reads `props.data.nodeType` (already present in `BuilderNodeData`)
- Looks up `TRANSFORM_REGISTRY[nodeType]` for `accentColor` and `icon`
- Renders: accent bar (registry color) · icon box · label · type sub-label · Schema/Output preview band
- Status dot behavior unchanged from existing implementation
- Multi-input handle: Join, Union, Merge render two `type="target"` handles (top and bottom left) via `inputCount` computed from registry metadata

### 6.2 `NodePalette.vue` update

The palette "Transforms" section is built dynamically from `TRANSFORM_REGISTRY`:

```typescript
const transformSections = [
  { group: 'shape',   title: 'SHAPE' },
  { group: 'combine', title: 'COMBINE' },
  { group: 'quality', title: 'QUALITY' },
  { group: 'code',    title: 'CODE' },
].map(s => ({
  ...s,
  items: Object.values(TRANSFORM_REGISTRY).filter(t => t.paletteGroup === s.group)
}))
```

Adding a new transform type requires only a registry entry — no palette edits.

### 6.3 `builder.ts` — node type mapping

`nodeTypeToVueFlowType()` maps all `transform.*` types to `'transformNode'` (the single shared component). The existing `transform.map → transformNode` mapping is extended to cover all 13 subtypes.

---

## 7. Frontend — Inspector Layer

### 7.1 `TransformInspector.vue` (dispatch shell)

Reads `props.data.nodeType`, looks up `inspectorComponent` from the registry, dynamically mounts it:

```vue
<component
  :is="TRANSFORM_REGISTRY[data.nodeType]?.inspectorComponent"
  :data="data"
  :node-id="nodeId"
  :upstream-schema="upstreamSchema"
/>
```

### 7.2 Sub-inspector contract

All 13 sub-inspectors share this props interface:

```typescript
defineProps<{
  data: BuilderNodeData
  nodeId: string
  upstreamSchema: SchemaField[]
}>()
```

All save via `store.updateNodeConfig(nodeId, { ...changes, outputSchema: computedOutputSchema })`.

### 7.3 Sub-inspector files (`apps/web/src/components/workflow/inspector/transforms/`)

```
FieldMappingInspector.vue    FilterInspector.vue
JoinInspector.vue            MergeInspector.vue
UnionInspector.vue           ConvertInspector.vue
DeriveInspector.vue          AggregateInspector.vue
FlattenInspector.vue         LookupInspector.vue
ValidateInspector.vue        CleanseInspector.vue
CodeInspector.vue
```

### 7.4 Inspector tab structure (consistent across all types)

- **Config** — type-specific configuration (conditions, mappings, keys, formulas, etc.)
- **Output** — output schema preview; auto-computed except for Code Step (manual declaration)
- **Errors** — error handling mode (fail / warn / quarantine / skip) + quarantine target field

### 7.5 Field pickers

All dropdowns that reference field names are built from `upstreamSchema`:

```vue
<select v-model="selectedField">
  <option v-for="f in upstreamSchema" :key="f.name" :value="f.name">
    {{ f.name }} ({{ f.type }})
  </option>
</select>
```

Free-text fallback is always available for fields not yet in the propagated schema.

---

## 8. Runtime — Executor Layer

### 8.1 Module structure (`services/runtime/src/transforms/`)

```
index.ts          — TRANSFORM_EXECUTORS registry
field-mapping.ts  filter.ts       join.ts
merge.ts          union.ts        convert.ts
derive.ts         aggregate.ts    flatten.ts
lookup.ts         validate.ts     cleanse.ts
code.ts
```

### 8.2 `TransformFn` contract

```typescript
export type TransformFn = (
  records: Record<string, unknown>[],
  config: Record<string, unknown>,
  ctx: TransformContext
) => Promise<Record<string, unknown>[]>

interface TransformContext {
  log: (level: 'info' | 'warn' | 'error', msg: string) => void
  getNodeOutput: (nodeId: string) => Record<string, unknown>[]
}
```

Each file exports a single `execute` function conforming to `TransformFn`. `index.ts` assembles `TRANSFORM_EXECUTORS`.

### 8.3 Graph executor integration (`services/runtime/src/executor/graph.ts`)

```typescript
if (node.type.startsWith('transform.')) {
  const fn = TRANSFORM_EXECUTORS[node.type as TransformNodeType]
  if (!fn) throw new Error(`Unknown transform type: ${node.type}`)
  output = await fn(upstreamRecords, node.config, ctx)
} else {
  output = await connector.execute(connectorConfig, inputs)
}
```

### 8.4 Per-type executor summary

| Type | Core operation |
|---|---|
| `transform.map` | Remap object keys per mapping rules; drop unmapped fields in strict mode |
| `transform.filter` | Condition group evaluator applied via `Array.filter()` |
| `transform.join` | Build hash table on right dataset; probe with left; emit joined rows |
| `transform.merge` | Diff source vs. target by match key; return insert / update / delete sets |
| `transform.union` | Concatenate datasets; optional deduplication pass |
| `transform.convert` | Per-field type coercion with format / locale config |
| `transform.derive` | Map over records adding computed field via expression evaluator |
| `transform.aggregate` | Group by keys; apply count / sum / avg / min / max per group |
| `transform.flatten` | Recursive JSON path expansion; array explosion multiplies rows |
| `transform.lookup` | Hash reference dataset; enrich each source record on key match |
| `transform.validate` | Evaluate rules per record; route failures to quarantine array |
| `transform.cleanse` | Apply trim / case / replace / null-norm rules per declared field |
| `transform.code` | Sandboxed user-defined JS/TS (see §8.5) |

### 8.5 Code Step execution

The Code Step runs user-provided JavaScript inside the Bun worker process.

**Security requirements:**
- User code must be treated as untrusted input.
- The implementation must use Bun's native Worker thread isolation (`new Worker`) or a dedicated sandboxing library rather than evaluating code in the main worker process.
- A Bun `Worker` spawned with `eval: true` runs in a separate V8 isolate with no access to the parent's module scope, file system, or environment variables — this is the required approach.
- Timeout is enforced by terminating the worker thread after `timeoutSeconds` (default: 30).
- Output must be validated as an array before being accepted.

**Interface contract:**
- Input: `records` — the upstream array of records, serialised via `postMessage`
- Output: the transformed array, returned via `postMessage` back to the main thread
- The user writes a function body that receives `records` and must return an array.

**Out of scope for Phase 3:** network access from Code Step, `import` / `require`, persistent state between runs. These require a more comprehensive execution policy and are deferred.

---

## 9. File Map

### New files

```
apps/web/src/transforms/registry.ts
apps/web/src/composables/useUpstreamSchema.ts
apps/web/src/components/workflow/inspector/transforms/
  FieldMappingInspector.vue  FilterInspector.vue  JoinInspector.vue
  MergeInspector.vue         UnionInspector.vue   ConvertInspector.vue
  DeriveInspector.vue        AggregateInspector.vue FlattenInspector.vue
  LookupInspector.vue        ValidateInspector.vue  CleanseInspector.vue
  CodeInspector.vue
services/runtime/src/transforms/
  index.ts  field-mapping.ts  filter.ts  join.ts  merge.ts  union.ts
  convert.ts  derive.ts  aggregate.ts  flatten.ts  lookup.ts
  validate.ts  cleanse.ts  code.ts
```

### Modified files

```
packages/workflow-schema/src/types.ts          — NodeType, WorkflowNode, new SchemaField
apps/web/src/stores/builder.ts                 — getUpstreamSchema selector, transform.* mapping
apps/web/src/components/workflow/nodes/TransformNode.vue     — registry-driven
apps/web/src/components/workflow/inspector/TransformInspector.vue — dispatch shell
apps/web/src/components/workflow/NodePalette.vue — dynamic Transforms section
services/runtime/src/executor/graph.ts         — transform branch in execution loop
```

---

## 10. Out of Scope

- Python, SQL, and Spark execution for Code Step
- Window aggregations (requires DB engine involvement)
- Fuzzy matching in Cleanse (performance cost; deferred)
- Temporal / as-of Lookup
- Pushdown optimisation to Postgres
- AI-assisted formula generation
- Network or file system access from Code Step
