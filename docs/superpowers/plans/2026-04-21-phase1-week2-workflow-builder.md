# vipsOS Phase 1 — Week 2: Workflow Builder Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the Workflow Builder screen — Vue Flow canvas with custom node types, drag-from-palette, node config panel, and a simulated run animation.

**Architecture:** `useBuilderStore` (Pinia) owns all canvas state: nodes, edges, selected node, running state. `WorkflowBuilderView` composes four child components — `WorkflowToolbar`, `NodePalette`, `WorkflowCanvas`, `NodeConfigPanel` — in a split-panel layout. Positions are pre-computed for the three demo workflows. The simulated run animates each node through `pending → running → success` with async delays.

**Tech Stack:** Vue Flow (`@vue-flow/core`), Pinia, Vue Router, Lucide Vue Next, Tailwind CSS v4

---

## File Map

```
apps/web/src/
  stores/
    builder.ts                           # useBuilderStore — canvas state + simulation
    __tests__/
      builder.test.ts                    # store tests
  components/
    workflow/
      nodes/
        SourceNode.vue                   # custom Vue Flow node: connector.source / trigger
        TransformNode.vue                # custom Vue Flow node: transform.map
        DestinationNode.vue              # custom Vue Flow node: connector.destination
        LogicNode.vue                    # custom Vue Flow node: logic.branch
      WorkflowCanvas.vue                 # <VueFlow> wrapper + node-type registration
      NodePalette.vue                    # left panel — draggable node-type tiles
      NodeConfigPanel.vue                # right panel — selected node label + config
      WorkflowToolbar.vue                # top bar — name + Save/Publish/Run buttons
  views/
    WorkflowBuilderView.vue              # wires all four components; loads from route param
    WorkflowsView.vue                    # list of workflows with Open-in-builder buttons
```

---

## Task 1: Builder Pinia store + tests

**Files:**
- Create: `apps/web/src/stores/builder.ts`
- Create: `apps/web/src/stores/__tests__/builder.test.ts`

- [ ] **Step 1: Write the failing tests**

`apps/web/src/stores/__tests__/builder.test.ts`:
```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useBuilderStore } from '../builder'

describe('useBuilderStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('starts with empty nodes and edges', () => {
    const store = useBuilderStore()
    expect(store.nodes).toHaveLength(0)
    expect(store.edges).toHaveLength(0)
  })

  it('loads wf_001 with 3 nodes and 2 edges', () => {
    const store = useBuilderStore()
    store.loadWorkflow('wf_001')
    expect(store.nodes).toHaveLength(3)
    expect(store.edges).toHaveLength(2)
  })

  it('loads wf_002 with 4 nodes and 3 edges', () => {
    const store = useBuilderStore()
    store.loadWorkflow('wf_002')
    expect(store.nodes).toHaveLength(4)
    expect(store.edges).toHaveLength(3)
  })

  it('selectedNodeId starts as null', () => {
    const store = useBuilderStore()
    store.loadWorkflow('wf_001')
    expect(store.selectedNodeId).toBeNull()
  })

  it('selectNode sets selectedNodeId', () => {
    const store = useBuilderStore()
    store.loadWorkflow('wf_001')
    store.selectNode('source_1')
    expect(store.selectedNodeId).toBe('source_1')
  })

  it('selectedNode computed returns the selected node', () => {
    const store = useBuilderStore()
    store.loadWorkflow('wf_001')
    store.selectNode('source_1')
    expect(store.selectedNode?.id).toBe('source_1')
    expect(store.selectedNode?.data.label).toBeTruthy()
  })

  it('clearSelection resets selectedNodeId to null', () => {
    const store = useBuilderStore()
    store.loadWorkflow('wf_001')
    store.selectNode('source_1')
    store.clearSelection()
    expect(store.selectedNodeId).toBeNull()
  })

  it('addNode appends a new node at the given position', () => {
    const store = useBuilderStore()
    store.loadWorkflow('wf_001')
    const before = store.nodes.length
    store.addNode('connector.source', { x: 100, y: 200 })
    expect(store.nodes).toHaveLength(before + 1)
    expect(store.nodes[store.nodes.length - 1].position).toEqual({ x: 100, y: 200 })
  })

  it('isRunning starts as false', () => {
    const store = useBuilderStore()
    expect(store.isRunning).toBe(false)
  })

  it('returns undefined for unknown workflow id', () => {
    const store = useBuilderStore()
    store.loadWorkflow('nonexistent')
    expect(store.nodes).toHaveLength(0)
  })
})
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
cd /Users/leandroarruda/projects/vipsOS/apps/web && npm test -- --reporter=verbose 2>&1 | tail -20
```

Expected: builder.test.ts fails with `Cannot find module '../builder'`.

- [ ] **Step 3: Implement the store**

`apps/web/src/stores/builder.ts`:
```typescript
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { NodeType, NodeStatus } from '@/types'
import { useWorkflowsStore } from './workflows'

export interface BuilderNodeData {
  label: string
  config: Record<string, unknown>
  connectorId?: string
  nodeType: NodeType
  status: NodeStatus
}

export interface BuilderNode {
  id: string
  type: string
  position: { x: number; y: number }
  data: BuilderNodeData
}

export interface BuilderEdge {
  id: string
  source: string
  target: string
}

const WORKFLOW_POSITIONS: Record<string, Record<string, { x: number; y: number }>> = {
  wf_001: {
    source_1: { x: 50, y: 150 },
    transform_1: { x: 320, y: 150 },
    dest_1: { x: 590, y: 150 },
  },
  wf_002: {
    source_1: { x: 50, y: 200 },
    logic_1: { x: 320, y: 200 },
    dest_success: { x: 590, y: 80 },
    dest_failed: { x: 590, y: 320 },
  },
  wf_004: {
    source_1: { x: 50, y: 150 },
    dest_1: { x: 370, y: 150 },
  },
}

function nodeTypeToVueFlowType(type: NodeType): string {
  switch (type) {
    case 'connector.source':
      return 'sourceNode'
    case 'connector.destination':
      return 'destinationNode'
    case 'transform.map':
      return 'transformNode'
    case 'logic.branch':
      return 'logicNode'
    case 'trigger':
      return 'sourceNode'
    default:
      return 'sourceNode'
  }
}

function defaultLabelForType(type: NodeType): string {
  const labels: Record<NodeType, string> = {
    'connector.source': 'Source',
    'connector.destination': 'Destination',
    'transform.map': 'Transform',
    'logic.branch': 'Branch',
    trigger: 'Trigger',
  }
  return labels[type] ?? 'Node'
}

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms))

export const useBuilderStore = defineStore('builder', () => {
  const nodes = ref<BuilderNode[]>([])
  const edges = ref<BuilderEdge[]>([])
  const selectedNodeId = ref<string | null>(null)
  const currentWorkflowId = ref<string | null>(null)
  const isRunning = ref(false)

  const selectedNode = computed(
    () => nodes.value.find((n) => n.id === selectedNodeId.value) ?? null,
  )

  function loadWorkflow(workflowId: string) {
    const workflowsStore = useWorkflowsStore()
    const def = workflowsStore.getDefinition(workflowId)
    if (!def) return

    currentWorkflowId.value = workflowId
    const positions = WORKFLOW_POSITIONS[workflowId] ?? {}

    nodes.value = def.nodes.map((n, i) => ({
      id: n.id,
      type: nodeTypeToVueFlowType(n.type),
      position: positions[n.id] ?? { x: 50 + i * 270, y: 150 },
      data: {
        label: n.label,
        config: n.config,
        connectorId: n.connectorId,
        nodeType: n.type,
        status: 'pending' as NodeStatus,
      },
    }))

    edges.value = def.edges.map((e) => ({
      id: e.id,
      source: e.source,
      target: e.target,
    }))

    selectedNodeId.value = null
  }

  function selectNode(nodeId: string | null) {
    selectedNodeId.value = nodeId
  }

  function clearSelection() {
    selectedNodeId.value = null
  }

  function addNode(type: NodeType, position: { x: number; y: number }) {
    const id = `node_${Date.now()}`
    nodes.value.push({
      id,
      type: nodeTypeToVueFlowType(type),
      position,
      data: {
        label: defaultLabelForType(type),
        config: {},
        nodeType: type,
        status: 'pending',
      },
    })
  }

  async function simulateRun() {
    if (isRunning.value) return
    isRunning.value = true

    nodes.value = nodes.value.map((n) => ({
      ...n,
      data: { ...n.data, status: 'pending' as NodeStatus },
    }))

    for (const node of nodes.value) {
      await sleep(300)
      nodes.value = nodes.value.map((n) =>
        n.id === node.id ? { ...n, data: { ...n.data, status: 'running' as NodeStatus } } : n,
      )
      await sleep(700)
      nodes.value = nodes.value.map((n) =>
        n.id === node.id ? { ...n, data: { ...n.data, status: 'success' as NodeStatus } } : n,
      )
    }

    isRunning.value = false
  }

  return {
    nodes,
    edges,
    selectedNodeId,
    selectedNode,
    currentWorkflowId,
    isRunning,
    loadWorkflow,
    selectNode,
    clearSelection,
    addNode,
    simulateRun,
  }
})
```

- [ ] **Step 4: Run tests to confirm all pass**

```bash
npm test 2>&1 | tail -10
```

Expected: all 33 tests pass (23 existing + 10 new).

- [ ] **Step 5: Commit**

```bash
cd /Users/leandroarruda/projects/vipsOS && git add apps/web/src/stores/ && git commit -m "feat: add useBuilderStore for workflow canvas state and run simulation"
```

---

## Task 2: Custom Vue Flow node components

**Files:**
- Create: `apps/web/src/components/workflow/nodes/SourceNode.vue`
- Create: `apps/web/src/components/workflow/nodes/TransformNode.vue`
- Create: `apps/web/src/components/workflow/nodes/DestinationNode.vue`
- Create: `apps/web/src/components/workflow/nodes/LogicNode.vue`

Each node receives `data: BuilderNodeData` from Vue Flow and shows: status-colored border, icon, label. Handle positions are set by Vue Flow via `<Handle>`.

- [ ] **Step 1: Create SourceNode.vue**

`apps/web/src/components/workflow/nodes/SourceNode.vue`:
```vue
<script setup lang="ts">
import { Handle, Position } from '@vue-flow/core'
import { ArrowRightFromLine } from 'lucide-vue-next'
import type { BuilderNodeData } from '@/stores/builder'

const props = defineProps<{ data: BuilderNodeData; selected: boolean }>()
</script>

<template>
  <div
    class="min-w-[160px] rounded-lg border-2 bg-background p-3 shadow-sm transition-all"
    :class="{
      'border-blue-500 ring-2 ring-blue-500/20': props.selected,
      'border-border': !props.selected && props.data.status === 'pending',
      'border-blue-400 animate-pulse': props.data.status === 'running',
      'border-green-500': props.data.status === 'success',
      'border-red-500': props.data.status === 'failed',
    }"
  >
    <Handle type="source" :position="Position.Right" />
    <div class="flex items-center gap-2">
      <div class="flex h-7 w-7 items-center justify-center rounded-md bg-blue-50 text-blue-600">
        <ArrowRightFromLine class="h-3.5 w-3.5" />
      </div>
      <div>
        <div class="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
          Source
        </div>
        <div class="text-sm font-medium leading-tight">{{ props.data.label }}</div>
      </div>
    </div>
  </div>
</template>
```

- [ ] **Step 2: Create TransformNode.vue**

`apps/web/src/components/workflow/nodes/TransformNode.vue`:
```vue
<script setup lang="ts">
import { Handle, Position } from '@vue-flow/core'
import { ArrowLeftRight } from 'lucide-vue-next'
import type { BuilderNodeData } from '@/stores/builder'

const props = defineProps<{ data: BuilderNodeData; selected: boolean }>()
</script>

<template>
  <div
    class="min-w-[160px] rounded-lg border-2 bg-background p-3 shadow-sm transition-all"
    :class="{
      'border-blue-500 ring-2 ring-blue-500/20': props.selected,
      'border-border': !props.selected && props.data.status === 'pending',
      'border-blue-400 animate-pulse': props.data.status === 'running',
      'border-green-500': props.data.status === 'success',
      'border-red-500': props.data.status === 'failed',
    }"
  >
    <Handle type="target" :position="Position.Left" />
    <Handle type="source" :position="Position.Right" />
    <div class="flex items-center gap-2">
      <div class="flex h-7 w-7 items-center justify-center rounded-md bg-purple-50 text-purple-600">
        <ArrowLeftRight class="h-3.5 w-3.5" />
      </div>
      <div>
        <div class="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
          Transform
        </div>
        <div class="text-sm font-medium leading-tight">{{ props.data.label }}</div>
      </div>
    </div>
  </div>
</template>
```

- [ ] **Step 3: Create DestinationNode.vue**

`apps/web/src/components/workflow/nodes/DestinationNode.vue`:
```vue
<script setup lang="ts">
import { Handle, Position } from '@vue-flow/core'
import { ArrowRightToLine } from 'lucide-vue-next'
import type { BuilderNodeData } from '@/stores/builder'

const props = defineProps<{ data: BuilderNodeData; selected: boolean }>()
</script>

<template>
  <div
    class="min-w-[160px] rounded-lg border-2 bg-background p-3 shadow-sm transition-all"
    :class="{
      'border-blue-500 ring-2 ring-blue-500/20': props.selected,
      'border-border': !props.selected && props.data.status === 'pending',
      'border-blue-400 animate-pulse': props.data.status === 'running',
      'border-green-500': props.data.status === 'success',
      'border-red-500': props.data.status === 'failed',
    }"
  >
    <Handle type="target" :position="Position.Left" />
    <div class="flex items-center gap-2">
      <div class="flex h-7 w-7 items-center justify-center rounded-md bg-emerald-50 text-emerald-600">
        <ArrowRightToLine class="h-3.5 w-3.5" />
      </div>
      <div>
        <div class="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
          Destination
        </div>
        <div class="text-sm font-medium leading-tight">{{ props.data.label }}</div>
      </div>
    </div>
  </div>
</template>
```

- [ ] **Step 4: Create LogicNode.vue**

`apps/web/src/components/workflow/nodes/LogicNode.vue`:
```vue
<script setup lang="ts">
import { Handle, Position } from '@vue-flow/core'
import { GitBranch } from 'lucide-vue-next'
import type { BuilderNodeData } from '@/stores/builder'

const props = defineProps<{ data: BuilderNodeData; selected: boolean }>()
</script>

<template>
  <div
    class="min-w-[160px] rounded-lg border-2 bg-background p-3 shadow-sm transition-all"
    :class="{
      'border-blue-500 ring-2 ring-blue-500/20': props.selected,
      'border-border': !props.selected && props.data.status === 'pending',
      'border-blue-400 animate-pulse': props.data.status === 'running',
      'border-green-500': props.data.status === 'success',
      'border-red-500': props.data.status === 'failed',
    }"
  >
    <Handle type="target" :position="Position.Left" />
    <Handle type="source" :position="Position.Right" id="a" style="top: 30%" />
    <Handle type="source" :position="Position.Right" id="b" style="top: 70%" />
    <div class="flex items-center gap-2">
      <div class="flex h-7 w-7 items-center justify-center rounded-md bg-amber-50 text-amber-600">
        <GitBranch class="h-3.5 w-3.5" />
      </div>
      <div>
        <div class="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
          Logic
        </div>
        <div class="text-sm font-medium leading-tight">{{ props.data.label }}</div>
      </div>
    </div>
  </div>
</template>
```

- [ ] **Step 5: Run build to verify no TypeScript errors**

```bash
cd /Users/leandroarruda/projects/vipsOS/apps/web && npm run build 2>&1 | tail -10
```

Expected: build succeeds.

- [ ] **Step 6: Commit**

```bash
cd /Users/leandroarruda/projects/vipsOS && git add apps/web/src/components/workflow/ && git commit -m "feat: add custom Vue Flow node components (source, transform, destination, logic)"
```

---

## Task 3: WorkflowCanvas component

**Files:**
- Create: `apps/web/src/components/workflow/WorkflowCanvas.vue`

WorkflowCanvas wraps `<VueFlow>` with the four custom node types registered, handles node-click to call `selectNode`, handles drop to call `addNode`, and shows a placeholder when no workflow is loaded.

- [ ] **Step 1: Create WorkflowCanvas.vue**

`apps/web/src/components/workflow/WorkflowCanvas.vue`:
```vue
<script setup lang="ts">
import { computed, markRaw } from 'vue'
import { VueFlow, useVueFlow } from '@vue-flow/core'
import { Controls } from '@vue-flow/controls'
import { MiniMap } from '@vue-flow/minimap'
import '@vue-flow/core/dist/style.css'
import '@vue-flow/controls/dist/style.css'
import '@vue-flow/minimap/dist/style.css'
import type { NodeMouseEvent, XYPosition } from '@vue-flow/core'
import { useBuilderStore } from '@/stores/builder'
import SourceNode from './nodes/SourceNode.vue'
import TransformNode from './nodes/TransformNode.vue'
import DestinationNode from './nodes/DestinationNode.vue'
import LogicNode from './nodes/LogicNode.vue'
import type { NodeType } from '@/types'

const store = useBuilderStore()
const { screenToFlowCoordinate } = useVueFlow()

const nodeTypes = {
  sourceNode: markRaw(SourceNode),
  transformNode: markRaw(TransformNode),
  destinationNode: markRaw(DestinationNode),
  logicNode: markRaw(LogicNode),
}

const hasWorkflow = computed(() => store.nodes.length > 0)

function onNodeClick({ node }: NodeMouseEvent) {
  store.selectNode(node.id)
}

function onPaneClick() {
  store.clearSelection()
}

function onDragOver(event: DragEvent) {
  event.preventDefault()
  if (event.dataTransfer) {
    event.dataTransfer.dropEffect = 'move'
  }
}

function onDrop(event: DragEvent) {
  event.preventDefault()
  const type = event.dataTransfer?.getData('application/vueflow-node') as NodeType | undefined
  if (!type) return

  const position: XYPosition = screenToFlowCoordinate({
    x: event.clientX,
    y: event.clientY,
  })

  store.addNode(type, position)
}
</script>

<template>
  <div class="relative h-full w-full" @dragover="onDragOver" @drop="onDrop">
    <VueFlow
      v-if="hasWorkflow"
      :nodes="store.nodes"
      :edges="store.edges"
      :node-types="nodeTypes"
      fit-view-on-init
      class="h-full w-full"
      @node-click="onNodeClick"
      @pane-click="onPaneClick"
    >
      <Controls />
      <MiniMap />
    </VueFlow>

    <div
      v-else
      class="flex h-full flex-col items-center justify-center gap-3 text-muted-foreground"
    >
      <div class="text-4xl">⬡</div>
      <p class="text-sm">No workflow loaded. Select one from the Workflows list.</p>
    </div>
  </div>
</template>
```

- [ ] **Step 2: Run build to check for errors**

```bash
npm run build 2>&1 | tail -15
```

Expected: build succeeds.

- [ ] **Step 3: Commit**

```bash
cd /Users/leandroarruda/projects/vipsOS && git add apps/web/src/components/workflow/WorkflowCanvas.vue && git commit -m "feat: add WorkflowCanvas wrapping Vue Flow with custom node types"
```

---

## Task 4: NodePalette component

**Files:**
- Create: `apps/web/src/components/workflow/NodePalette.vue`

NodePalette shows draggable tiles for each node type. On `dragstart`, sets the node type into `dataTransfer`. Each tile shows an icon, type name, and brief description.

- [ ] **Step 1: Create NodePalette.vue**

`apps/web/src/components/workflow/NodePalette.vue`:
```vue
<script setup lang="ts">
import { ArrowRightFromLine, ArrowLeftRight, ArrowRightToLine, GitBranch } from 'lucide-vue-next'
import type { Component } from 'vue'
import type { NodeType } from '@/types'

interface PaletteItem {
  type: NodeType
  label: string
  description: string
  icon: Component
  colorClass: string
}

const paletteItems: PaletteItem[] = [
  {
    type: 'connector.source',
    label: 'Source',
    description: 'Read from a connector',
    icon: ArrowRightFromLine,
    colorClass: 'bg-blue-50 text-blue-600',
  },
  {
    type: 'transform.map',
    label: 'Transform',
    description: 'Map or reshape data',
    icon: ArrowLeftRight,
    colorClass: 'bg-purple-50 text-purple-600',
  },
  {
    type: 'connector.destination',
    label: 'Destination',
    description: 'Write to a connector',
    icon: ArrowRightToLine,
    colorClass: 'bg-emerald-50 text-emerald-600',
  },
  {
    type: 'logic.branch',
    label: 'Branch',
    description: 'Conditional routing',
    icon: GitBranch,
    colorClass: 'bg-amber-50 text-amber-600',
  },
]

function onDragStart(event: DragEvent, type: NodeType) {
  if (!event.dataTransfer) return
  event.dataTransfer.setData('application/vueflow-node', type)
  event.dataTransfer.effectAllowed = 'move'
}
</script>

<template>
  <aside class="flex w-52 flex-shrink-0 flex-col border-r bg-background">
    <div class="border-b px-4 py-3">
      <h2 class="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Node Types
      </h2>
    </div>
    <div class="flex-1 space-y-1.5 overflow-y-auto p-3">
      <div
        v-for="item in paletteItems"
        :key="item.type"
        draggable="true"
        class="flex cursor-grab items-center gap-3 rounded-md border bg-background p-2.5 shadow-sm transition-colors hover:bg-muted active:cursor-grabbing"
        @dragstart="onDragStart($event, item.type)"
      >
        <div
          class="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md"
          :class="item.colorClass"
        >
          <component :is="item.icon" class="h-4 w-4" />
        </div>
        <div>
          <div class="text-sm font-medium leading-tight">{{ item.label }}</div>
          <div class="text-xs text-muted-foreground">{{ item.description }}</div>
        </div>
      </div>
    </div>
    <div class="border-t px-4 py-3">
      <p class="text-xs text-muted-foreground">Drag a node onto the canvas</p>
    </div>
  </aside>
</template>
```

- [ ] **Step 2: Commit**

```bash
cd /Users/leandroarruda/projects/vipsOS && git add apps/web/src/components/workflow/NodePalette.vue && git commit -m "feat: add NodePalette with draggable node type tiles"
```

---

## Task 5: NodeConfigPanel component

**Files:**
- Create: `apps/web/src/components/workflow/NodeConfigPanel.vue`

Shows the selected node's label, type badge, and config key-value pairs. Hidden when no node is selected.

- [ ] **Step 1: Create NodeConfigPanel.vue**

`apps/web/src/components/workflow/NodeConfigPanel.vue`:
```vue
<script setup lang="ts">
import { computed } from 'vue'
import { X } from 'lucide-vue-next'
import { useBuilderStore } from '@/stores/builder'

const store = useBuilderStore()

const node = computed(() => store.selectedNode)

const typeLabel: Record<string, string> = {
  'connector.source': 'Source',
  'connector.destination': 'Destination',
  'transform.map': 'Transform',
  'logic.branch': 'Branch',
  trigger: 'Trigger',
}

const typeBadgeColor: Record<string, string> = {
  'connector.source': 'bg-blue-100 text-blue-700',
  'connector.destination': 'bg-emerald-100 text-emerald-700',
  'transform.map': 'bg-purple-100 text-purple-700',
  'logic.branch': 'bg-amber-100 text-amber-700',
  trigger: 'bg-blue-100 text-blue-700',
}

const configEntries = computed(() => {
  if (!node.value) return []
  return Object.entries(node.value.data.config)
})
</script>

<template>
  <aside
    v-if="node"
    class="flex w-72 flex-shrink-0 flex-col border-l bg-background"
  >
    <div class="flex items-center justify-between border-b px-4 py-3">
      <h2 class="text-sm font-semibold">Node Config</h2>
      <button
        class="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
        aria-label="Close panel"
        @click="store.clearSelection()"
      >
        <X class="h-4 w-4" />
      </button>
    </div>

    <div class="flex-1 overflow-y-auto p-4">
      <div class="mb-4">
        <span
          class="inline-block rounded-full px-2.5 py-0.5 text-xs font-medium"
          :class="typeBadgeColor[node.data.nodeType] ?? 'bg-muted text-muted-foreground'"
        >
          {{ typeLabel[node.data.nodeType] ?? node.data.nodeType }}
        </span>
        <h3 class="mt-2 text-base font-semibold">{{ node.data.label }}</h3>
        <p v-if="node.data.connectorId" class="mt-0.5 text-xs text-muted-foreground">
          Connector: {{ node.data.connectorId }}
        </p>
      </div>

      <div v-if="configEntries.length > 0">
        <h4 class="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Configuration
        </h4>
        <dl class="space-y-2">
          <div
            v-for="[key, value] in configEntries"
            :key="key"
            class="rounded-md border bg-muted/30 px-3 py-2"
          >
            <dt class="text-xs font-medium text-muted-foreground">{{ key }}</dt>
            <dd class="mt-0.5 break-all text-sm">
              {{ typeof value === 'object' ? JSON.stringify(value) : String(value) }}
            </dd>
          </div>
        </dl>
      </div>

      <p v-else class="text-sm text-muted-foreground">No configuration yet.</p>
    </div>
  </aside>
</template>
```

- [ ] **Step 2: Commit**

```bash
cd /Users/leandroarruda/projects/vipsOS && git add apps/web/src/components/workflow/NodeConfigPanel.vue && git commit -m "feat: add NodeConfigPanel showing selected node details"
```

---

## Task 6: WorkflowToolbar component

**Files:**
- Create: `apps/web/src/components/workflow/WorkflowToolbar.vue`

Shows the workflow name, status badge, and three action buttons: Save (no-op for demo), Publish (no-op), Run (calls `simulateRun`). The Run button shows a spinner while running.

- [ ] **Step 1: Create WorkflowToolbar.vue**

`apps/web/src/components/workflow/WorkflowToolbar.vue`:
```vue
<script setup lang="ts">
import { computed } from 'vue'
import { Play, Save, Rocket, Loader2 } from 'lucide-vue-next'
import { useBuilderStore } from '@/stores/builder'
import { useWorkflowsStore } from '@/stores/workflows'

const builderStore = useBuilderStore()
const workflowsStore = useWorkflowsStore()

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
</script>

<template>
  <div class="flex h-12 flex-shrink-0 items-center justify-between border-b bg-background px-4">
    <div class="flex items-center gap-2.5">
      <span class="font-semibold text-sm">
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
      <button
        class="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted"
        title="Save (demo)"
      >
        <Save class="h-3.5 w-3.5" />
        Save
      </button>
      <button
        class="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted"
        title="Publish (demo)"
      >
        <Rocket class="h-3.5 w-3.5" />
        Publish
      </button>
      <button
        class="flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
        :disabled="builderStore.isRunning || builderStore.nodes.length === 0"
        @click="builderStore.simulateRun()"
      >
        <Loader2 v-if="builderStore.isRunning" class="h-3.5 w-3.5 animate-spin" />
        <Play v-else class="h-3.5 w-3.5" />
        {{ builderStore.isRunning ? 'Running…' : 'Run' }}
      </button>
    </div>
  </div>
</template>
```

- [ ] **Step 2: Commit**

```bash
cd /Users/leandroarruda/projects/vipsOS && git add apps/web/src/components/workflow/WorkflowToolbar.vue && git commit -m "feat: add WorkflowToolbar with Save/Publish/Run buttons"
```

---

## Task 7: Wire WorkflowBuilderView

**Files:**
- Modify: `apps/web/src/views/WorkflowBuilderView.vue`

Replace the placeholder with the four components in a split-panel layout. On mount, load the workflow from the route param.

- [ ] **Step 1: Update WorkflowBuilderView.vue**

`apps/web/src/views/WorkflowBuilderView.vue`:
```vue
<script setup lang="ts">
import { onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useBuilderStore } from '@/stores/builder'
import WorkflowToolbar from '@/components/workflow/WorkflowToolbar.vue'
import NodePalette from '@/components/workflow/NodePalette.vue'
import WorkflowCanvas from '@/components/workflow/WorkflowCanvas.vue'
import NodeConfigPanel from '@/components/workflow/NodeConfigPanel.vue'

const route = useRoute()
const store = useBuilderStore()

function load() {
  const id = route.params.id as string
  if (id) store.loadWorkflow(id)
}

onMounted(load)
watch(() => route.params.id, load)
</script>

<template>
  <div class="flex h-full flex-col overflow-hidden">
    <WorkflowToolbar />
    <div class="flex flex-1 overflow-hidden">
      <NodePalette />
      <WorkflowCanvas class="flex-1" />
      <NodeConfigPanel />
    </div>
  </div>
</template>
```

- [ ] **Step 2: Run all tests to confirm still passing**

```bash
cd /Users/leandroarruda/projects/vipsOS/apps/web && npm test 2>&1 | tail -10
```

Expected: all tests pass.

- [ ] **Step 3: Run build to confirm no TypeScript errors**

```bash
npm run build 2>&1 | tail -10
```

Expected: build succeeds.

- [ ] **Step 4: Commit**

```bash
cd /Users/leandroarruda/projects/vipsOS && git add apps/web/src/views/WorkflowBuilderView.vue && git commit -m "feat: wire WorkflowBuilderView with toolbar, palette, canvas, and config panel"
```

---

## Task 8: Update WorkflowsView with workflow list

**Files:**
- Modify: `apps/web/src/views/WorkflowsView.vue`

Replace the placeholder with a list of workflow summaries. Each row shows name, status badge, trigger type, last run status, and an "Open" button that navigates to the builder.

- [ ] **Step 1: Update WorkflowsView.vue**

`apps/web/src/views/WorkflowsView.vue`:
```vue
<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useWorkflowsStore } from '@/stores/workflows'
import { GitBranch, Clock, Webhook, Play, Plus } from 'lucide-vue-next'
import type { Component } from 'vue'
import type { WorkflowSummary } from '@/types'

const router = useRouter()
const store = useWorkflowsStore()

const triggerIcons: Record<string, Component> = {
  schedule: Clock,
  webhook: Webhook,
  manual: Play,
}

const statusColors: Record<string, string> = {
  published: 'bg-green-100 text-green-700',
  draft: 'bg-muted text-muted-foreground',
  archived: 'bg-red-100 text-red-700',
}

const runStatusColors: Record<string, string> = {
  success: 'text-green-600',
  failed: 'text-red-600',
  running: 'text-blue-600',
  pending: 'text-muted-foreground',
}

function openBuilder(wf: WorkflowSummary) {
  router.push(`/workflows/${wf.workflowId}/builder`)
}
</script>

<template>
  <div>
    <div class="mb-5 flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-semibold tracking-tight">Workflows</h1>
        <p class="mt-1 text-sm text-muted-foreground">
          {{ store.summaries.length }} workflows · {{ store.publishedCount }} published
        </p>
      </div>
      <button
        class="flex items-center gap-1.5 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
      >
        <Plus class="h-4 w-4" />
        New Workflow
      </button>
    </div>

    <div class="divide-y rounded-lg border">
      <div
        v-for="wf in store.summaries"
        :key="wf.workflowId"
        class="flex items-center gap-4 px-4 py-3"
      >
        <div class="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-md bg-muted">
          <GitBranch class="h-4 w-4 text-muted-foreground" />
        </div>

        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2">
            <span class="truncate text-sm font-medium">{{ wf.name }}</span>
            <span
              class="rounded-full px-2 py-0.5 text-xs font-medium capitalize"
              :class="statusColors[wf.status]"
            >
              {{ wf.status }}
            </span>
          </div>
          <div class="mt-0.5 flex items-center gap-3 text-xs text-muted-foreground">
            <span class="flex items-center gap-1">
              <component :is="triggerIcons[wf.trigger.type] ?? Play" class="h-3 w-3" />
              {{ wf.trigger.type }}
              <template v-if="wf.trigger.cron">({{ wf.trigger.cron }})</template>
            </span>
            <span
              v-if="wf.lastRunStatus"
              class="capitalize"
              :class="runStatusColors[wf.lastRunStatus] ?? ''"
            >
              Last run: {{ wf.lastRunStatus }}
            </span>
          </div>
        </div>

        <button
          class="rounded-md border px-3 py-1.5 text-sm font-medium transition-colors hover:bg-muted"
          @click="openBuilder(wf)"
        >
          Open
        </button>
      </div>
    </div>
  </div>
</template>
```

- [ ] **Step 2: Commit**

```bash
cd /Users/leandroarruda/projects/vipsOS && git add apps/web/src/views/WorkflowsView.vue && git commit -m "feat: add WorkflowsView with list of workflows and Open-in-builder buttons"
```

---

## Task 9: Browser verification

- [ ] **Step 1: Start the dev server**

```bash
cd /Users/leandroarruda/projects/vipsOS/apps/web && npm run dev
```

- [ ] **Step 2: Verify the demo flow in the browser**

Open http://localhost:5174 and perform:

1. **Dashboard** loads — sidebar shows Dashboard active
2. Click **Workflows** in the sidebar
3. The Workflows list shows 4 items with status badges and trigger types
4. Click **Open** on "Salesforce → BigQuery Sync"
5. URL changes to `/workflows/wf_001/builder`
6. The Workflow Builder loads with:
   - Toolbar showing workflow name "Salesforce → BigQuery Sync" and "published" badge
   - Left panel: Node Types palette with Source, Transform, Destination, Branch tiles
   - Canvas: 3 connected nodes (Salesforce → Map Fields → BigQuery) with edges
   - Minimap in corner
   - No config panel visible (nothing selected)
7. Click on the **Salesforce** node
   - Node gets a blue border + ring
   - Right panel opens: "Source" badge, "Salesforce", connector ID, config key-value pairs
8. Click elsewhere on the canvas
   - Node deselects, config panel closes
9. Drag a **Source** tile from the palette and drop it on the canvas
   - A new "Source" node appears at the drop position
10. Click **Run** in the toolbar
    - Button shows spinner and "Running…"
    - Nodes animate: gray → blue pulsing → green, sequentially
    - After all nodes complete, Run button re-enables
11. Go back to Workflows, click **Open** on "Stripe Payments Pipeline"
    - 4 nodes with branching layout (logic node with two destination branches)

- [ ] **Step 3: Stop the server**

- [ ] **Step 4: Run all tests**

```bash
npm test 2>&1 | tail -10
```

Expected: all tests pass (33 minimum).

---

## Week 2 Complete — Verification Checklist

- [ ] All tests pass (`npm test` shows ≥ 33 passing, 0 failing)
- [ ] `npm run build` succeeds with no TypeScript errors
- [ ] Workflow list shows all 4 workflows with correct badges and triggers
- [ ] Clicking "Open" navigates to the builder with the correct workflow loaded
- [ ] Canvas renders all nodes with correct labels and connections
- [ ] Clicking a node opens the config panel with its details
- [ ] Clicking the pane closes the config panel
- [ ] Dragging a node type from the palette and dropping it on the canvas creates a new node
- [ ] Clicking Run animates all nodes through pending → running → success
- [ ] No console errors during the demo flow
