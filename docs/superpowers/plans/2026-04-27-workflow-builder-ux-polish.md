# Workflow Builder UX Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refine the Workflow Builder with compact nodes, tabbed preview bands, a 3-section palette with connector items, configurable output handles, dotted canvas grid, and standalone auth pages.

**Architecture:** All changes are frontend-only. Each node component is rewritten around a shared `useNodePreview` composable that computes the schema hint and tab state from `props.data.config`. Connector drag items pass `initialConfig` through the drag event so `addNode` can pre-populate the new node's config and auto-select it. The `outputs` count lives in `config.outputs` so it round-trips through the existing `updateNodeConfig` / save path with no backend changes.

**Tech Stack:** Vue 3 Composition API, `<script setup>`, Tailwind CSS, Vue Flow (`@vue-flow/core`, `@vue-flow/background`), Vitest, Vue Test Utils.

---

## File Map

| Action | Path | Responsibility |
|--------|------|----------------|
| Modify | `apps/web/src/App.vue` | Exclude `/auth/*` routes from AppShell |
| Modify | `apps/web/src/components/workflow/WorkflowCanvas.vue` | Always render VueFlow (background visible in all states); parse richer drag payload |
| Modify | `apps/web/src/stores/builder.ts` | `addNode` accepts `initialConfig` + `label`; auto-selects new node |
| Modify | `apps/web/src/components/workflow/NodePalette.vue` | 3-section layout, search bar, connector drag items |
| Create | `apps/web/src/components/workflow/nodes/useNodePreview.ts` | Schema-hint + output-hint + tab state composable |
| Create | `apps/web/src/components/workflow/nodes/__tests__/useNodePreview.test.ts` | Unit tests for composable |
| Modify | `apps/web/src/components/workflow/nodes/SourceNode.vue` | Compact layout, accent bar, tabbed preview, dynamic output handles |
| Modify | `apps/web/src/components/workflow/nodes/DestinationNode.vue` | Compact layout, accent bar, tabbed preview |
| Modify | `apps/web/src/components/workflow/nodes/TransformNode.vue` | Compact layout, accent bar, tabbed preview, dynamic output handles |
| Modify | `apps/web/src/components/workflow/nodes/LogicNode.vue` | Compact layout, accent bar, tabbed preview, 2 fixed outputs |
| Modify | `apps/web/src/components/workflow/inspector/SourceInspector.vue` | Add Outputs section (+ Add destination / × remove) |
| Modify | `apps/web/src/components/workflow/inspector/TransformInspector.vue` | Add Outputs section |

---

## Task 1: Fix auth pages — render outside AppShell

**Files:**
- Modify: `apps/web/src/App.vue`

- [ ] **Step 1: Update `useShell` computed**

Open `apps/web/src/App.vue` and replace the existing `useShell` line:

```vue
<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import AppShell from '@/components/layout/AppShell.vue'

const route = useRoute()
const auth = useAuthStore()
const useShell = computed(
  () => !route.path.startsWith('/auth/') && route.path !== '/embedded',
)

onMounted(() => auth.init())
</script>

<template>
  <AppShell v-if="useShell">
    <RouterView />
  </AppShell>
  <RouterView v-else />
</template>
```

- [ ] **Step 2: Verify in browser**

Run `cd apps/web && npm run dev`, open `http://localhost:5173/auth/login`. Confirm the sidebar and topbar are **not** visible — only the login card on a blank background.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/App.vue
git commit -m "fix(shell): exclude /auth/* routes from AppShell"
```

---

## Task 2: Dotted grid background visible in all canvas states

**Files:**
- Modify: `apps/web/src/components/workflow/WorkflowCanvas.vue`

The `<Background>` component only renders inside `<VueFlow>`. Currently VueFlow is conditionally rendered only when nodes exist, so empty/no-workflow states show a plain grey surface. Fix by always rendering VueFlow and overlaying the empty-state messages.

- [ ] **Step 1: Restructure WorkflowCanvas template**

Replace the entire `<template>` block in `apps/web/src/components/workflow/WorkflowCanvas.vue`:

```vue
<template>
  <div class="relative h-full w-full" @dragover="onDragOver" @drop="onDrop">
    <!-- VueFlow always rendered so Background dots are always visible -->
    <VueFlow
      :nodes="store.nodes"
      :edges="store.edges"
      :node-types="nodeTypes"
      :default-edge-options="defaultEdgeOptions"
      fit-view-on-init
      class="h-full w-full"
      @node-click="onNodeClick"
      @pane-click="onPaneClick"
    >
      <Background :variant="BackgroundVariant.Dots" :gap="20" :size="1.5" color="#d1d5db" />
      <Controls />
      <MiniMap v-if="hasNodes" node-color="#e5e7eb" mask-color="rgba(255,255,255,0.7)" />
    </VueFlow>

    <!-- Overlay: no workflow selected -->
    <div
      v-if="!workflowSelected"
      class="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-3 text-muted-foreground"
    >
      <div class="text-5xl opacity-20">⬡</div>
      <p class="text-sm">No workflow loaded. Select one from Workflows.</p>
    </div>

    <!-- Overlay: workflow selected but canvas is empty -->
    <div
      v-else-if="!hasNodes"
      class="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-3 text-muted-foreground"
    >
      <div class="text-5xl opacity-20">⬡</div>
      <p class="text-sm font-medium">Drag a node from the left panel to get started</p>
      <p class="text-xs">Add a Source node and configure it in the inspector</p>
    </div>
  </div>
</template>
```

- [ ] **Step 2: Verify in browser**

Navigate to the builder. With no nodes, the dotted grid should be visible behind the empty-state message. With nodes, the grid should also be visible.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/components/workflow/WorkflowCanvas.vue
git commit -m "feat(builder): show dotted grid background in all canvas states"
```

---

## Task 3: Extend builder store — addNode accepts initialConfig, auto-selects

**Files:**
- Modify: `apps/web/src/stores/builder.ts`

- [ ] **Step 1: Update `addNode` signature and body**

In `apps/web/src/stores/builder.ts`, replace the `addNode` function:

```typescript
function addNode(
  type: NodeType,
  position: { x: number; y: number },
  initialConfig: Record<string, unknown> = {},
  label?: string,
) {
  const id = `node_${Date.now()}`
  nodes.value.push({
    id,
    type: nodeTypeToVueFlowType(type),
    position,
    data: {
      label: label ?? defaultLabelForType(type),
      config: initialConfig,
      nodeType: type,
      status: 'pending',
    },
  })
  selectedNodeId.value = id   // auto-open inspector
}
```

- [ ] **Step 2: Run existing tests to confirm no regressions**

```bash
cd apps/web && npm test -- --run
```

Expected: all tests pass (51+).

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/stores/builder.ts
git commit -m "feat(builder): addNode accepts initialConfig and label, auto-selects new node"
```

---

## Task 4: Node palette — 3-section layout, search, connector items

**Files:**
- Modify: `apps/web/src/components/workflow/NodePalette.vue`
- Modify: `apps/web/src/components/workflow/WorkflowCanvas.vue` (onDrop parser)

Connector palette items encode `{ type, config, label }` as JSON in the drag payload so the canvas can create a pre-configured node. Generic items encode just the node type string (backward-compatible).

- [ ] **Step 1: Rewrite NodePalette.vue**

```vue
<script setup lang="ts">
import { ref, computed } from 'vue'
import {
  ArrowRightFromLine, ArrowRightToLine, ArrowLeftRight,
  GitBranch, Globe, Database, Table2,
} from 'lucide-vue-next'
import type { NodeType } from '@/types'

interface PaletteItem {
  key: string
  label: string
  description: string
  icon: unknown
  accentColor: string
  dragType: NodeType
  dragConfig?: Record<string, unknown>
}

const sections: Array<{ title: string; items: PaletteItem[] }> = [
  {
    title: 'Data Flow',
    items: [
      { key: 'source', label: 'Source', description: 'Read from any connector', icon: ArrowRightFromLine, accentColor: '#3b82f6', dragType: 'connector.source' },
      { key: 'destination', label: 'Destination', description: 'Write to any connector', icon: ArrowRightToLine, accentColor: '#22c55e', dragType: 'connector.destination' },
    ],
  },
  {
    title: 'Logic',
    items: [
      { key: 'transform', label: 'Transform', description: 'Map / reshape data', icon: ArrowLeftRight, accentColor: '#f59e0b', dragType: 'transform.map' },
      { key: 'branch', label: 'Branch', description: 'Conditional routing', icon: GitBranch, accentColor: '#a855f7', dragType: 'logic.branch' },
    ],
  },
  {
    title: 'Connectors',
    items: [
      { key: 'http-rest', label: 'HTTP / REST', description: 'GET · POST · PUT · DELETE', icon: Globe, accentColor: '#3b82f6', dragType: 'connector.source', dragConfig: { connectorType: 'http-rest' } },
      { key: 'postgres', label: 'Postgres', description: 'Query or write rows', icon: Database, accentColor: '#22c55e', dragType: 'connector.source', dragConfig: { connectorType: 'postgres' } },
      { key: 'statcan', label: 'StatCan', description: 'Statistics Canada data', icon: TableProperties, accentColor: '#ca8a04', dragType: 'connector.source', dragConfig: { connectorType: 'statcan' } },
    ],
  },
]

const search = ref('')

const filtered = computed(() => {
  const q = search.value.trim().toLowerCase()
  if (!q) return sections
  return sections
    .map((s) => ({ ...s, items: s.items.filter((i) => i.label.toLowerCase().includes(q) || i.description.toLowerCase().includes(q)) }))
    .filter((s) => s.items.length > 0)
})

function onDragStart(event: DragEvent, item: PaletteItem) {
  if (!event.dataTransfer) return
  // Encode type + optional config + optional label as JSON
  const payload = item.dragConfig
    ? JSON.stringify({ type: item.dragType, config: item.dragConfig, label: item.label })
    : item.dragType   // plain string for generic items — backward-compatible
  event.dataTransfer.setData('application/vueflow-node', payload)
  event.dataTransfer.effectAllowed = 'move'
}
</script>

<template>
  <aside class="flex w-52 flex-shrink-0 flex-col border-r bg-background">
    <!-- Search -->
    <div class="border-b px-2 py-2">
      <div class="flex items-center gap-1.5 rounded-md border bg-muted/40 px-2 py-1.5">
        <svg class="h-3 w-3 flex-shrink-0 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <input
          v-model="search"
          placeholder="Search nodes…"
          class="flex-1 bg-transparent text-xs outline-none placeholder:text-muted-foreground"
        />
      </div>
    </div>

    <!-- Sections -->
    <div class="flex-1 overflow-y-auto py-1">
      <!-- Empty search state -->
      <div v-if="filtered.length === 0" class="px-3 py-6 text-center text-xs text-muted-foreground">
        No nodes match "{{ search }}"
      </div>

      <template v-for="section in filtered" :key="section.title">
        <!-- Section label with divider -->
        <div class="flex items-center gap-2 px-3 pb-1 pt-3">
          <span class="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60">{{ section.title }}</span>
          <div class="flex-1 border-t border-border/50" />
        </div>

        <!-- Items -->
        <div
          v-for="item in section.items"
          :key="item.key"
          draggable="true"
          class="mx-1.5 mb-0.5 flex cursor-grab items-center gap-2.5 rounded-[5px] border bg-background px-2 py-[5px] shadow-sm transition-colors hover:bg-muted active:cursor-grabbing"
          @dragstart="onDragStart($event, item)"
        >
          <div
            class="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-[5px]"
            :style="{ background: item.accentColor + '18' }"
          >
            <component :is="item.icon" class="h-3.5 w-3.5" :style="{ color: item.accentColor }" />
          </div>
          <div>
            <div class="text-[11.5px] font-semibold leading-tight text-foreground">{{ item.label }}</div>
            <div class="text-[10px] leading-tight text-muted-foreground">{{ item.description }}</div>
          </div>
        </div>
      </template>
    </div>

    <div class="border-t px-3 py-[7px]">
      <p class="text-xs text-muted-foreground">Drag a node onto the canvas</p>
    </div>
  </aside>
</template>
```

- [ ] **Step 2: Update `onDrop` in WorkflowCanvas.vue to parse JSON payload**

In `apps/web/src/components/workflow/WorkflowCanvas.vue`, replace the `onDrop` function:

```typescript
function onDrop(event: DragEvent) {
  event.preventDefault()
  const raw = event.dataTransfer?.getData('application/vueflow-node')
  if (!raw) return

  const position: XYPosition = screenToFlowCoordinate({
    x: event.clientX,
    y: event.clientY,
  })

  // Connector items encode JSON { type, config, label }; generic items are plain strings
  try {
    const parsed = JSON.parse(raw) as { type: NodeType; config?: Record<string, unknown>; label?: string }
    store.addNode(parsed.type, position, parsed.config ?? {}, parsed.label)
  } catch {
    store.addNode(raw as NodeType, position)
  }
}
```

- [ ] **Step 3: Verify in browser**

1. Drag "HTTP / REST" from the Connectors section onto the canvas.
2. Confirm a Source node appears with `connectorType: "http-rest"` already set (the inspector should show the HTTP fields immediately).
3. Confirm the search bar filters nodes by name.

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/components/workflow/NodePalette.vue \
        apps/web/src/components/workflow/WorkflowCanvas.vue
git commit -m "feat(builder): 3-section palette (Data Flow / Logic / Connectors) with search and connector drag items"
```

---

## Task 5: Create useNodePreview composable

**Files:**
- Create: `apps/web/src/components/workflow/nodes/useNodePreview.ts`
- Create: `apps/web/src/components/workflow/nodes/__tests__/useNodePreview.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `apps/web/src/components/workflow/nodes/__tests__/useNodePreview.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'
import { useNodePreview } from '../useNodePreview'

describe('useNodePreview — schemaHint', () => {
  it('returns — for empty config', () => {
    const { schemaHint } = useNodePreview(() => ({}))
    expect(schemaHint.value).toBe('—')
  })

  it('returns — for unknown connectorType', () => {
    const { schemaHint } = useNodePreview(() => ({ connectorType: 'unknown' }))
    expect(schemaHint.value).toBe('unknown')
  })

  it('formats http-rest with full URL', () => {
    const { schemaHint } = useNodePreview(() => ({
      connectorType: 'http-rest',
      method: 'POST',
      url: 'https://api.example.com/users',
    }))
    expect(schemaHint.value).toBe('POST · api.example.com/users')
  })

  it('formats http-rest with root path omitted', () => {
    const { schemaHint } = useNodePreview(() => ({
      connectorType: 'http-rest',
      method: 'GET',
      url: 'https://api.example.com',
    }))
    expect(schemaHint.value).toBe('GET · api.example.com')
  })

  it('prompts to configure when http-rest url is empty', () => {
    const { schemaHint } = useNodePreview(() => ({ connectorType: 'http-rest', method: 'GET', url: '' }))
    expect(schemaHint.value).toBe('GET · configure URL')
  })

  it('extracts table from postgres FROM clause', () => {
    const { schemaHint } = useNodePreview(() => ({
      connectorType: 'postgres',
      query: 'SELECT id, name FROM public.workflows LIMIT 5',
    }))
    expect(schemaHint.value).toBe('→ public.workflows')
  })

  it('prompts to configure when postgres query is empty', () => {
    const { schemaHint } = useNodePreview(() => ({ connectorType: 'postgres', query: '' }))
    expect(schemaHint.value).toBe('configure query')
  })

  it('formats statcan with table code', () => {
    const { schemaHint } = useNodePreview(() => ({
      connectorType: 'statcan',
      table_code: '14-10-0287-01',
    }))
    expect(schemaHint.value).toBe('table 14-10-0287-01')
  })

  it('prompts to configure when statcan table_code is empty', () => {
    const { schemaHint } = useNodePreview(() => ({ connectorType: 'statcan', table_code: '' }))
    expect(schemaHint.value).toBe('configure table code')
  })
})

describe('useNodePreview — outputHint', () => {
  it('returns null when no lastRunOutput', () => {
    const { outputHint } = useNodePreview(() => ({}))
    expect(outputHint.value).toBeNull()
  })

  it('returns row count on success', () => {
    const { outputHint } = useNodePreview(() => ({ lastRunOutput: { rowCount: 42 } }))
    expect(outputHint.value).toBe('✓ 42 rows')
  })

  it('returns 0 rows when rowCount absent', () => {
    const { outputHint } = useNodePreview(() => ({ lastRunOutput: {} }))
    expect(outputHint.value).toBe('✓ 0 rows')
  })

  it('returns truncated error message', () => {
    const { outputHint } = useNodePreview(() => ({ lastRunOutput: { error: 'Connection refused' } }))
    expect(outputHint.value).toBe('✗ Connection refused')
  })
})

describe('useNodePreview — tab state', () => {
  it('starts with schema tab active', () => {
    const { activeTab } = useNodePreview(() => ({}))
    expect(activeTab.value).toBe('schema')
  })

  it('tab can be toggled to output', () => {
    const { activeTab } = useNodePreview(() => ({}))
    activeTab.value = 'output'
    expect(activeTab.value).toBe('output')
  })
})
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
cd apps/web && npm test -- --run --reporter=verbose 2>&1 | grep "useNodePreview"
```

Expected: all `useNodePreview` tests fail with "Cannot find module".

- [ ] **Step 3: Create the composable**

Create `apps/web/src/components/workflow/nodes/useNodePreview.ts`:

```typescript
import { ref, computed } from 'vue'

export function useNodePreview(getConfig: () => Record<string, unknown>) {
  const activeTab = ref<'schema' | 'output'>('schema')

  const schemaHint = computed((): string => {
    const c = getConfig()
    const ct = c.connectorType as string | undefined
    if (!ct) return '—'

    if (ct === 'http-rest') {
      const method = (c.method as string | undefined) ?? 'GET'
      const url = (c.url as string | undefined) ?? ''
      if (!url) return `${method} · configure URL`
      try {
        const { hostname, pathname } = new URL(url)
        return `${method} · ${hostname}${pathname === '/' ? '' : pathname}`
      } catch {
        return `${method} · ${url}`
      }
    }

    if (ct === 'postgres') {
      const query = ((c.query as string | undefined) ?? '').trim()
      if (!query) return 'configure query'
      const match = query.match(/FROM\s+([^\s;,()\n]+)/i)
      return match ? `→ ${match[1]}` : query.slice(0, 28)
    }

    if (ct === 'statcan') {
      const code = (c.table_code as string | undefined) ?? ''
      return code ? `table ${code}` : 'configure table code'
    }

    return ct
  })

  const outputHint = computed((): string | null => {
    const out = getConfig().lastRunOutput as
      | { rowCount?: number; error?: string }
      | undefined
    if (!out) return null
    if (out.error) return `✗ ${out.error.slice(0, 32)}`
    return `✓ ${out.rowCount ?? 0} rows`
  })

  return { activeTab, schemaHint, outputHint }
}
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
cd apps/web && npm test -- --run --reporter=verbose 2>&1 | grep -E "useNodePreview|Tests"
```

Expected: all `useNodePreview` tests pass.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/components/workflow/nodes/useNodePreview.ts \
        apps/web/src/components/workflow/nodes/__tests__/useNodePreview.test.ts
git commit -m "feat(builder): add useNodePreview composable — schema hint, output hint, tab state"
```

---

## Task 6: Redesign SourceNode

**Files:**
- Modify: `apps/web/src/components/workflow/nodes/SourceNode.vue`

- [ ] **Step 1: Rewrite SourceNode.vue**

```vue
<script setup lang="ts">
import { computed, ref } from 'vue'
import { Handle, Position } from '@vue-flow/core'
import { Globe } from 'lucide-vue-next'
import type { BuilderNodeData } from '@/stores/builder'
import { useNodePreview } from './useNodePreview'

const props = defineProps<{ data: BuilderNodeData; selected: boolean }>()

const outputCount = computed(() => (props.data.config.outputs as number | undefined) ?? 1)

function handleTop(i: number, total: number): string {
  return `${((i + 1) / (total + 1)) * 100}%`
}

const { activeTab, schemaHint, outputHint } = useNodePreview(() => props.data.config)
</script>

<template>
  <div
    class="relative w-40 overflow-visible rounded-lg border bg-white shadow-sm"
    :class="{
      'border-blue-500 ring-2 ring-blue-500/20 shadow-blue-100 shadow-md': props.selected,
      'border-slate-200': !props.selected && props.data.status === 'pending',
      'border-blue-400': !props.selected && props.data.status === 'running',
      'border-green-500': !props.selected && props.data.status === 'success',
      'border-red-500': !props.selected && props.data.status === 'failed',
    }"
  >
    <!-- Accent bar -->
    <div class="h-[5px] rounded-t-[7px] bg-blue-500" />

    <!-- Output handles (dynamic count) -->
    <Handle
      v-for="i in outputCount"
      :key="i"
      type="source"
      :position="Position.Right"
      :id="`output-${i - 1}`"
      :style="{ top: handleTop(i - 1, outputCount.value) }"
      class="!h-2.5 !w-2.5 !border-2 !border-blue-400 !bg-white"
    />

    <!-- Icon + name -->
    <div class="flex items-center gap-2 px-3 pb-1 pt-[7px]">
      <div class="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-[5px] bg-blue-50">
        <Globe class="h-3.5 w-3.5 text-blue-500" />
      </div>
      <span class="truncate text-[12px] font-semibold leading-tight text-slate-800">{{ props.data.label }}</span>
    </div>

    <!-- Sub-label -->
    <div class="truncate px-3 pb-[6px] text-[10px] leading-tight text-slate-400">{{ schemaHint }}</div>

    <!-- Preview band -->
    <div class="rounded-b-[7px] border-t border-slate-100">
      <div class="flex">
        <button
          class="flex-1 py-[3px] text-[10px] font-semibold transition-colors"
          :class="activeTab === 'schema' ? 'border-b-2 border-indigo-500 text-indigo-600' : 'text-slate-400 hover:text-slate-600'"
          @click.stop="activeTab = 'schema'"
        >Schema</button>
        <button
          class="flex-1 py-[3px] text-[10px] font-semibold transition-colors"
          :class="activeTab === 'output' ? 'border-b-2 border-indigo-500 text-indigo-600' : 'text-slate-400 hover:text-slate-600'"
          @click.stop="activeTab = 'output'"
        >Output</button>
      </div>
      <div class="px-3 py-[4px]">
        <template v-if="activeTab === 'schema'">
          <span class="block truncate font-mono text-[10px] text-violet-600">{{ schemaHint }}</span>
        </template>
        <template v-else>
          <span v-if="outputHint" class="block truncate font-mono text-[10px] text-green-600">{{ outputHint }}</span>
          <span v-else class="block truncate text-[10px] italic text-slate-300">Run to see output</span>
        </template>
      </div>
    </div>

    <!-- Status dot -->
    <div
      v-if="props.data.status !== 'pending'"
      class="absolute -right-1 -top-1 h-2 w-2 rounded-full border border-white"
      :class="{
        'animate-pulse bg-blue-500': props.data.status === 'running',
        'bg-green-500': props.data.status === 'success',
        'bg-red-500': props.data.status === 'failed',
      }"
    />
  </div>
</template>
```

- [ ] **Step 2: Verify in browser**

Open the builder, drop a Source node. Confirm:
- Node is ~160px wide, compact height
- Blue accent bar at top
- Schema/Output tab bar at bottom
- Schema tab shows config hint (or `—` if unconfigured)

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/components/workflow/nodes/SourceNode.vue
git commit -m "feat(builder): compact SourceNode — accent bar, tabbed preview, dynamic output handles"
```

---

## Task 7: Redesign DestinationNode

**Files:**
- Modify: `apps/web/src/components/workflow/nodes/DestinationNode.vue`

- [ ] **Step 1: Rewrite DestinationNode.vue**

```vue
<script setup lang="ts">
import { Handle, Position } from '@vue-flow/core'
import { Database } from 'lucide-vue-next'
import type { BuilderNodeData } from '@/stores/builder'
import { useNodePreview } from './useNodePreview'

const props = defineProps<{ data: BuilderNodeData; selected: boolean }>()
const { activeTab, schemaHint, outputHint } = useNodePreview(() => props.data.config)
</script>

<template>
  <div
    class="relative w-40 overflow-visible rounded-lg border bg-white shadow-sm"
    :class="{
      'border-green-500 ring-2 ring-green-500/20 shadow-green-100 shadow-md': props.selected,
      'border-slate-200': !props.selected && props.data.status === 'pending',
      'border-green-400': !props.selected && props.data.status === 'running',
      'border-green-600': !props.selected && props.data.status === 'success',
      'border-red-500': !props.selected && props.data.status === 'failed',
    }"
  >
    <!-- Accent bar -->
    <div class="h-[5px] rounded-t-[7px] bg-green-500" />

    <!-- Input handle -->
    <Handle
      type="target"
      :position="Position.Left"
      class="!h-2.5 !w-2.5 !border-2 !border-green-400 !bg-white"
    />

    <!-- Icon + name -->
    <div class="flex items-center gap-2 px-3 pb-1 pt-[7px]">
      <div class="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-[5px] bg-green-50">
        <Database class="h-3.5 w-3.5 text-green-600" />
      </div>
      <span class="truncate text-[12px] font-semibold leading-tight text-slate-800">{{ props.data.label }}</span>
    </div>

    <!-- Sub-label -->
    <div class="truncate px-3 pb-[6px] text-[10px] leading-tight text-slate-400">{{ schemaHint }}</div>

    <!-- Preview band -->
    <div class="rounded-b-[7px] border-t border-slate-100">
      <div class="flex">
        <button
          class="flex-1 py-[3px] text-[10px] font-semibold transition-colors"
          :class="activeTab === 'schema' ? 'border-b-2 border-indigo-500 text-indigo-600' : 'text-slate-400 hover:text-slate-600'"
          @click.stop="activeTab = 'schema'"
        >Schema</button>
        <button
          class="flex-1 py-[3px] text-[10px] font-semibold transition-colors"
          :class="activeTab === 'output' ? 'border-b-2 border-indigo-500 text-indigo-600' : 'text-slate-400 hover:text-slate-600'"
          @click.stop="activeTab = 'output'"
        >Output</button>
      </div>
      <div class="px-3 py-[4px]">
        <template v-if="activeTab === 'schema'">
          <span class="block truncate font-mono text-[10px] text-violet-600">{{ schemaHint }}</span>
        </template>
        <template v-else>
          <span v-if="outputHint" class="block truncate font-mono text-[10px] text-green-600">{{ outputHint }}</span>
          <span v-else class="block truncate text-[10px] italic text-slate-300">Run to see output</span>
        </template>
      </div>
    </div>

    <!-- Status dot -->
    <div
      v-if="props.data.status !== 'pending'"
      class="absolute -right-1 -top-1 h-2 w-2 rounded-full border border-white"
      :class="{
        'animate-pulse bg-green-400': props.data.status === 'running',
        'bg-green-600': props.data.status === 'success',
        'bg-red-500': props.data.status === 'failed',
      }"
    />
  </div>
</template>
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/src/components/workflow/nodes/DestinationNode.vue
git commit -m "feat(builder): compact DestinationNode — accent bar, tabbed preview"
```

---

## Task 8: Redesign TransformNode

**Files:**
- Modify: `apps/web/src/components/workflow/nodes/TransformNode.vue`

- [ ] **Step 1: Rewrite TransformNode.vue**

```vue
<script setup lang="ts">
import { computed } from 'vue'
import { Handle, Position } from '@vue-flow/core'
import { ArrowLeftRight } from 'lucide-vue-next'
import type { BuilderNodeData } from '@/stores/builder'
import { useNodePreview } from './useNodePreview'

const props = defineProps<{ data: BuilderNodeData; selected: boolean }>()

const outputCount = computed(() => (props.data.config.outputs as number | undefined) ?? 1)

function handleTop(i: number, total: number): string {
  return `${((i + 1) / (total + 1)) * 100}%`
}

const { activeTab, schemaHint, outputHint } = useNodePreview(() => props.data.config)

const subLabel = computed(() => {
  const count = outputCount.value
  return count > 1 ? `${count} outputs` : '1 output'
})
</script>

<template>
  <div
    class="relative w-40 overflow-visible rounded-lg border bg-white shadow-sm"
    :class="{
      'border-amber-500 ring-2 ring-amber-500/20 shadow-amber-100 shadow-md': props.selected,
      'border-slate-200': !props.selected && props.data.status === 'pending',
      'border-amber-400': !props.selected && props.data.status === 'running',
      'border-green-500': !props.selected && props.data.status === 'success',
      'border-red-500': !props.selected && props.data.status === 'failed',
    }"
  >
    <!-- Accent bar -->
    <div class="h-[5px] rounded-t-[7px] bg-amber-500" />

    <!-- Input handle -->
    <Handle
      type="target"
      :position="Position.Left"
      class="!h-2.5 !w-2.5 !border-2 !border-amber-400 !bg-white"
    />

    <!-- Output handles (dynamic count) -->
    <Handle
      v-for="i in outputCount"
      :key="i"
      type="source"
      :position="Position.Right"
      :id="`output-${i - 1}`"
      :style="{ top: handleTop(i - 1, outputCount.value) }"
      class="!h-2.5 !w-2.5 !border-2 !border-amber-400 !bg-white"
    />

    <!-- Icon + name -->
    <div class="flex items-center gap-2 px-3 pb-1 pt-[7px]">
      <div class="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-[5px] bg-amber-50">
        <ArrowLeftRight class="h-3.5 w-3.5 text-amber-500" />
      </div>
      <span class="truncate text-[12px] font-semibold leading-tight text-slate-800">{{ props.data.label }}</span>
    </div>

    <!-- Sub-label -->
    <div class="truncate px-3 pb-[6px] text-[10px] leading-tight text-slate-400">{{ subLabel }}</div>

    <!-- Preview band -->
    <div class="rounded-b-[7px] border-t border-slate-100">
      <div class="flex">
        <button
          class="flex-1 py-[3px] text-[10px] font-semibold transition-colors"
          :class="activeTab === 'schema' ? 'border-b-2 border-indigo-500 text-indigo-600' : 'text-slate-400 hover:text-slate-600'"
          @click.stop="activeTab = 'schema'"
        >Schema</button>
        <button
          class="flex-1 py-[3px] text-[10px] font-semibold transition-colors"
          :class="activeTab === 'output' ? 'border-b-2 border-indigo-500 text-indigo-600' : 'text-slate-400 hover:text-slate-600'"
          @click.stop="activeTab = 'output'"
        >Output</button>
      </div>
      <div class="px-3 py-[4px]">
        <template v-if="activeTab === 'schema'">
          <span class="block truncate font-mono text-[10px] text-violet-600">{{ subLabel }}</span>
        </template>
        <template v-else>
          <span v-if="outputHint" class="block truncate font-mono text-[10px] text-green-600">{{ outputHint }}</span>
          <span v-else class="block truncate text-[10px] italic text-slate-300">Run to see output</span>
        </template>
      </div>
    </div>

    <!-- Status dot -->
    <div
      v-if="props.data.status !== 'pending'"
      class="absolute -right-1 -top-1 h-2 w-2 rounded-full border border-white"
      :class="{
        'animate-pulse bg-amber-500': props.data.status === 'running',
        'bg-green-500': props.data.status === 'success',
        'bg-red-500': props.data.status === 'failed',
      }"
    />
  </div>
</template>
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/src/components/workflow/nodes/TransformNode.vue
git commit -m "feat(builder): compact TransformNode — accent bar, tabbed preview, dynamic output handles"
```

---

## Task 9: Redesign LogicNode (Branch)

**Files:**
- Modify: `apps/web/src/components/workflow/nodes/LogicNode.vue`

LogicNode has 2 fixed outputs (true/false) — no user-configurable count.

- [ ] **Step 1: Rewrite LogicNode.vue**

```vue
<script setup lang="ts">
import { Handle, Position } from '@vue-flow/core'
import { GitBranch } from 'lucide-vue-next'
import type { BuilderNodeData } from '@/stores/builder'
import { useNodePreview } from './useNodePreview'

const props = defineProps<{ data: BuilderNodeData; selected: boolean }>()
const { activeTab, outputHint } = useNodePreview(() => props.data.config)
</script>

<template>
  <div
    class="relative w-40 overflow-visible rounded-lg border bg-white shadow-sm"
    :class="{
      'border-purple-500 ring-2 ring-purple-500/20 shadow-purple-100 shadow-md': props.selected,
      'border-slate-200': !props.selected && props.data.status === 'pending',
      'border-purple-400': !props.selected && props.data.status === 'running',
      'border-green-500': !props.selected && props.data.status === 'success',
      'border-red-500': !props.selected && props.data.status === 'failed',
    }"
  >
    <!-- Accent bar -->
    <div class="h-[5px] rounded-t-[7px] bg-purple-500" />

    <!-- Input handle -->
    <Handle
      type="target"
      :position="Position.Left"
      class="!h-2.5 !w-2.5 !border-2 !border-purple-400 !bg-white"
    />

    <!-- True / False output handles (fixed positions) -->
    <Handle
      id="true"
      type="source"
      :position="Position.Right"
      style="top: 35%"
      class="!h-2.5 !w-2.5 !border-2 !border-purple-400 !bg-white"
    />
    <Handle
      id="false"
      type="source"
      :position="Position.Right"
      style="top: 65%"
      class="!h-2.5 !w-2.5 !border-2 !border-purple-400 !bg-white"
    />

    <!-- Icon + name -->
    <div class="flex items-center gap-2 px-3 pb-1 pt-[7px]">
      <div class="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-[5px] bg-purple-50">
        <GitBranch class="h-3.5 w-3.5 text-purple-500" />
      </div>
      <span class="truncate text-[12px] font-semibold leading-tight text-slate-800">{{ props.data.label }}</span>
    </div>

    <!-- Sub-label -->
    <div class="truncate px-3 pb-[6px] text-[10px] leading-tight text-slate-400">true / false</div>

    <!-- Preview band -->
    <div class="rounded-b-[7px] border-t border-slate-100">
      <div class="flex">
        <button
          class="flex-1 py-[3px] text-[10px] font-semibold transition-colors"
          :class="activeTab === 'schema' ? 'border-b-2 border-indigo-500 text-indigo-600' : 'text-slate-400 hover:text-slate-600'"
          @click.stop="activeTab = 'schema'"
        >Schema</button>
        <button
          class="flex-1 py-[3px] text-[10px] font-semibold transition-colors"
          :class="activeTab === 'output' ? 'border-b-2 border-indigo-500 text-indigo-600' : 'text-slate-400 hover:text-slate-600'"
          @click.stop="activeTab = 'output'"
        >Output</button>
      </div>
      <div class="px-3 py-[4px]">
        <template v-if="activeTab === 'schema'">
          <span class="block truncate font-mono text-[10px] text-violet-600">2 branches</span>
        </template>
        <template v-else>
          <span v-if="outputHint" class="block truncate font-mono text-[10px] text-green-600">{{ outputHint }}</span>
          <span v-else class="block truncate text-[10px] italic text-slate-300">Run to see output</span>
        </template>
      </div>
    </div>

    <!-- Status dot -->
    <div
      v-if="props.data.status !== 'pending'"
      class="absolute -right-1 -top-1 h-2 w-2 rounded-full border border-white"
      :class="{
        'animate-pulse bg-purple-500': props.data.status === 'running',
        'bg-green-500': props.data.status === 'success',
        'bg-red-500': props.data.status === 'failed',
      }"
    />
  </div>
</template>
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/src/components/workflow/nodes/LogicNode.vue
git commit -m "feat(builder): compact LogicNode — accent bar, tabbed preview, fixed true/false handles"
```

---

## Task 10: SourceInspector — Outputs section

**Files:**
- Modify: `apps/web/src/components/workflow/inspector/SourceInspector.vue`

- [ ] **Step 1: Add outputs reactive state and save logic**

In `SourceInspector.vue`, update the `<script setup>` block to add outputs tracking. Add after the existing `ref` declarations and update the `save()` and `watch` blocks:

```vue
<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import type { BuilderNodeData } from '@/stores/builder'
import { useBuilderStore } from '@/stores/builder'

const props = defineProps<{ data: BuilderNodeData }>()
const store = useBuilderStore()

type ConnectorType = 'http-rest' | 'postgres' | 'statcan' | ''

const connectorType = ref<ConnectorType>((props.data.config.connectorType as ConnectorType) ?? '')
const method = ref((props.data.config.method as string) ?? 'GET')
const url = ref((props.data.config.url as string) ?? '')
const pgQuery = ref((props.data.config.query as string) ?? '')
const tableCode = ref((props.data.config.table_code as string) ?? '')
const outputs = ref<number>((props.data.config.outputs as number | undefined) ?? 1)

const MAX_OUTPUTS = 5
const nodeId = computed(() => store.selectedNode?.id ?? '')

function save() {
  if (!nodeId.value) return
  const base: Record<string, unknown> = {
    connectorType: connectorType.value,
    outputs: outputs.value,
  }
  if (connectorType.value === 'http-rest') {
    Object.assign(base, { method: method.value, url: url.value })
  } else if (connectorType.value === 'postgres') {
    Object.assign(base, { query: pgQuery.value })
  } else if (connectorType.value === 'statcan') {
    Object.assign(base, { table_code: tableCode.value })
  }
  store.updateNodeConfig(nodeId.value, base)
}

function addOutput() {
  if (outputs.value < MAX_OUTPUTS) {
    outputs.value++
    save()
  }
}

function removeOutput() {
  if (outputs.value > 1) {
    outputs.value--
    save()
  }
}

watch(() => props.data, (d) => {
  connectorType.value = (d.config.connectorType as ConnectorType) ?? ''
  method.value = (d.config.method as string) ?? 'GET'
  url.value = (d.config.url as string) ?? ''
  pgQuery.value = (d.config.query as string) ?? ''
  tableCode.value = (d.config.table_code as string) ?? ''
  outputs.value = (d.config.outputs as number | undefined) ?? 1
}, { deep: true })
</script>
```

- [ ] **Step 2: Add Outputs section to the template**

Append the Outputs section inside the `<template>` in `SourceInspector.vue`, just before the closing `</div>` of the root element (after the existing connector config sections):

```vue
    <!-- Outputs section -->
    <div class="border-t pt-4">
      <p class="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Outputs</p>
      <div class="space-y-1">
        <!-- Output 1 — always present, not removable -->
        <div class="flex items-center gap-2 rounded-md border bg-muted/30 px-2.5 py-1.5">
          <div class="h-2 w-2 flex-shrink-0 rounded-full border-2 border-blue-400 bg-white" />
          <span class="flex-1 text-xs font-medium text-foreground">Output 1</span>
          <span class="text-[10px] text-muted-foreground">default</span>
        </div>

        <!-- Additional outputs -->
        <div
          v-for="i in outputs - 1"
          :key="i"
          class="flex items-center gap-2 rounded-md border bg-muted/30 px-2.5 py-1.5"
        >
          <div class="h-2 w-2 flex-shrink-0 rounded-full border-2 border-blue-400 bg-white" />
          <span class="flex-1 text-xs font-medium text-foreground">Output {{ i + 1 }}</span>
          <button
            class="text-muted-foreground/60 hover:text-red-400"
            :aria-label="`Remove output ${i + 1}`"
            @click="removeOutput"
          >×</button>
        </div>

        <!-- Add button -->
        <button
          v-if="outputs < MAX_OUTPUTS"
          class="flex w-full items-center gap-1.5 rounded-md border border-dashed px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-blue-400 hover:bg-blue-50 hover:text-blue-600"
          @click="addOutput"
        >
          <svg class="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Add destination
        </button>
      </div>
    </div>
```

- [ ] **Step 3: Verify in browser**

1. Drop a Source node on the canvas.
2. Open the inspector — confirm the Outputs section appears with "Output 1 · default".
3. Click "+ Add destination" — Output 2 appears with an ×.
4. Drag the node slightly to force a re-render — confirm 2 handles are visible on the right side of the node.
5. Click × on Output 2 — it disappears and the node returns to 1 handle.

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/components/workflow/inspector/SourceInspector.vue
git commit -m "feat(builder): SourceInspector — Outputs section with + Add destination / × remove"
```

---

## Task 11: TransformInspector — Outputs section

**Files:**
- Modify: `apps/web/src/components/workflow/inspector/TransformInspector.vue`

TransformInspector currently uses local state that is never persisted to the store. Wire `outputs` through `updateNodeConfig` so it persists.

- [ ] **Step 1: Add store wiring and outputs state**

Replace the entire `<script setup>` block in `TransformInspector.vue`:

```vue
<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { BuilderNodeData } from '@/stores/builder'
import { useBuilderStore } from '@/stores/builder'

const props = defineProps<{ data: BuilderNodeData }>()
const store = useBuilderStore()
const nodeId = computed(() => store.selectedNode?.id ?? '')

const transformType = ref((props.data.config.transformType as string | undefined) ?? 'map')
const outputs = ref<number>((props.data.config.outputs as number | undefined) ?? 1)
const MAX_OUTPUTS = 5

const transformTypes = ['map', 'filter', 'join', 'aggregate', 'split']

function save() {
  if (!nodeId.value) return
  store.updateNodeConfig(nodeId.value, {
    transformType: transformType.value,
    outputs: outputs.value,
  })
}

function addOutput() {
  if (outputs.value < MAX_OUTPUTS) { outputs.value++; save() }
}

function removeOutput() {
  if (outputs.value > 1) { outputs.value--; save() }
}

watch(() => props.data, (d) => {
  transformType.value = (d.config.transformType as string | undefined) ?? 'map'
  outputs.value = (d.config.outputs as number | undefined) ?? 1
}, { deep: true })
</script>
```

- [ ] **Step 2: Replace template with wired version + Outputs section**

Replace the entire `<template>` block in `TransformInspector.vue`:

```vue
<template>
  <div class="space-y-4 p-4">
    <div>
      <p class="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Transform Type</p>
      <select
        v-model="transformType"
        class="w-full rounded-md border bg-background px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-ring"
        @change="save"
      >
        <option v-for="t in transformTypes" :key="t" :value="t">{{ t }}</option>
      </select>
    </div>

    <!-- Outputs section -->
    <div class="border-t pt-4">
      <p class="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Outputs</p>
      <div class="space-y-1">
        <div class="flex items-center gap-2 rounded-md border bg-muted/30 px-2.5 py-1.5">
          <div class="h-2 w-2 flex-shrink-0 rounded-full border-2 border-amber-400 bg-white" />
          <span class="flex-1 text-xs font-medium text-foreground">Output 1</span>
          <span class="text-[10px] text-muted-foreground">default</span>
        </div>

        <div
          v-for="i in outputs - 1"
          :key="i"
          class="flex items-center gap-2 rounded-md border bg-muted/30 px-2.5 py-1.5"
        >
          <div class="h-2 w-2 flex-shrink-0 rounded-full border-2 border-amber-400 bg-white" />
          <span class="flex-1 text-xs font-medium text-foreground">Output {{ i + 1 }}</span>
          <button
            class="text-muted-foreground/60 hover:text-red-400"
            :aria-label="`Remove output ${i + 1}`"
            @click="removeOutput"
          >×</button>
        </div>

        <button
          v-if="outputs < MAX_OUTPUTS"
          class="flex w-full items-center gap-1.5 rounded-md border border-dashed px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-amber-400 hover:bg-amber-50 hover:text-amber-600"
          @click="addOutput"
        >
          <svg class="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Add destination
        </button>
      </div>
    </div>
  </div>
</template>
```

- [ ] **Step 3: Run full test suite**

```bash
cd apps/web && npm test -- --run
```

Expected: all tests pass (51+ including the new `useNodePreview` tests).

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/components/workflow/inspector/TransformInspector.vue
git commit -m "feat(builder): TransformInspector — wire to store, add Outputs section"
```

---

## Final verification

- [ ] **End-to-end check**

With Supabase + control plane + dev server running:

1. Open `http://localhost:5173/auth/login` — sidebar is absent, only login card visible.
2. Sign in → navigate to Workflows → open builder.
3. Dotted grid is visible on the empty canvas.
4. Drag "Postgres" from the Connectors section → Source node drops, inspector opens with `connectorType: "postgres"` pre-set, Outputs section visible.
5. Click "+ Add destination" → two handles appear on the right side of the node. Click × → back to one.
6. Drag a Transform node → compact amber node with "1 output" sub-label and Schema/Output tabs.
7. Drag a Branch node → compact purple node with "true / false" sub-label and two stacked right handles.
8. Click the Schema tab on an HTTP node configured with a URL → shows `GET · hostname/path`.
9. A 4-node canvas (Source → Transform → Branch + Destination) fits at 100% zoom on a 1440px screen.

- [ ] **Final commit and push**

```bash
git push origin feat/phase3c-testing-strategy
```
