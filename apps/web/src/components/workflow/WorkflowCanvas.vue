<script setup lang="ts">
import { computed, markRaw } from 'vue'
import { VueFlow, MarkerType, useVueFlow } from '@vue-flow/core'
import { Controls } from '@vue-flow/controls'
import { MiniMap } from '@vue-flow/minimap'
import { Background, BackgroundVariant } from '@vue-flow/background'
import '@vue-flow/core/dist/style.css'
import '@vue-flow/controls/dist/style.css'
import '@vue-flow/minimap/dist/style.css'
import type { NodeMouseEvent, XYPosition, Connection } from '@vue-flow/core'
import { useBuilderStore } from '@/stores/builder'
import SourceNode from './nodes/SourceNode.vue'
import TransformNode from './nodes/TransformNode.vue'
import DestinationNode from './nodes/DestinationNode.vue'
import LogicNode from './nodes/LogicNode.vue'
import type { NodeType } from '@/types'

const store = useBuilderStore()
const { screenToFlowCoordinate } = useVueFlow()

// Vue Flow requires strict NodeProps on custom nodes; cast to avoid TS error
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const nodeTypes: Record<string, any> = {
  sourceNode: markRaw(SourceNode),
  transformNode: markRaw(TransformNode),
  destinationNode: markRaw(DestinationNode),
  logicNode: markRaw(LogicNode),
}

const defaultEdgeOptions = {
  type: 'smoothstep',
  markerEnd: { type: MarkerType.ArrowClosed, color: '#6b7280', width: 16, height: 16 },
  style: { stroke: '#9ca3af', strokeWidth: 2 },
}

// Show the canvas whenever a workflow is selected — even if it has no nodes yet.
// The empty-nodes state gets its own lighter prompt; the "no workflow" state is for null currentWorkflowId.
const workflowSelected = computed(() => store.currentWorkflowId !== null)
const hasNodes = computed(() => store.nodes.length > 0)

function onNodeClick({ node }: NodeMouseEvent) {
  store.selectNode(node.id)
}

function onPaneClick() {
  store.clearSelection()
}

function onConnect(connection: Connection) {
  store.addEdge(connection)
}

function onDragOver(event: DragEvent) {
  event.preventDefault()
  if (event.dataTransfer) {
    event.dataTransfer.dropEffect = 'move'
  }
}

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
    const validTypes = ['connector.source', 'connector.destination', 'transform.map', 'logic.branch', 'trigger'] as const
    if (!(validTypes as readonly string[]).includes(raw)) return
    store.addNode(raw as NodeType, position)
  }
}
</script>

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
      @connect="onConnect"
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
