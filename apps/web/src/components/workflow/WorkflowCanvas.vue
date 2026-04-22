<script setup lang="ts">
import { computed, markRaw } from 'vue'
import { VueFlow, MarkerType, useVueFlow } from '@vue-flow/core'
import { Controls } from '@vue-flow/controls'
import { MiniMap } from '@vue-flow/minimap'
import { Background, BackgroundVariant } from '@vue-flow/background'
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
      :default-edge-options="defaultEdgeOptions"
      fit-view-on-init
      class="h-full w-full"
      @node-click="onNodeClick"
      @pane-click="onPaneClick"
    >
      <Background :variant="BackgroundVariant.Dots" :gap="20" :size="1" color="#d1d5db" />
      <Controls />
      <MiniMap node-color="#e5e7eb" mask-color="rgba(255,255,255,0.7)" />
    </VueFlow>

    <div
      v-else
      class="flex h-full flex-col items-center justify-center gap-3 bg-gray-50 text-muted-foreground"
    >
      <div class="text-5xl opacity-20">⬡</div>
      <p class="text-sm">No workflow loaded. Select one from Workflows.</p>
    </div>
  </div>
</template>
