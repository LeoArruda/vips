<script setup lang="ts">
import { computed } from 'vue'
import { X } from 'lucide-vue-next'
import { useBuilderStore } from '@/stores/builder'
import SourceInspector from './inspector/SourceInspector.vue'
import TransformInspector from './inspector/TransformInspector.vue'
import DestinationInspector from './inspector/DestinationInspector.vue'
import ControlInspector from './inspector/ControlInspector.vue'

const store = useBuilderStore()
const node = computed(() => store.selectedNode)

const nodeColor: Record<string, string> = {
  'connector.source': 'bg-blue-500',
  'connector.destination': 'bg-green-500',
  'transform.map': 'bg-amber-500',
  'logic.branch': 'bg-purple-500',
  trigger: 'bg-blue-500',
}

const nodeLabel: Record<string, string> = {
  'connector.source': 'Source',
  'connector.destination': 'Destination',
  'transform.map': 'Transform',
  'logic.branch': 'Control',
  trigger: 'Trigger',
}

const inspectorComponent = computed(() => {
  if (!node.value) return null
  const type = node.value.data.nodeType
  if (type === 'connector.source' || type === 'trigger') return SourceInspector
  if (type === 'transform.map') return TransformInspector
  if (type === 'connector.destination') return DestinationInspector
  if (type === 'logic.branch') return ControlInspector
  return null
})
</script>

<template>
  <aside v-if="node" class="flex w-80 flex-shrink-0 flex-col border-l bg-background">
    <!-- Header with node type color -->
    <div class="flex items-center justify-between border-b px-3 py-[7px]">
      <div class="flex items-center gap-2">
        <span class="h-3 w-3 rounded-full" :class="nodeColor[node.data.nodeType] ?? 'bg-muted'" />
        <div>
          <p class="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            {{ nodeLabel[node.data.nodeType] ?? node.data.nodeType }}
          </p>
          <h2 class="text-[11.5px] font-semibold leading-tight">{{ node.data.label }}</h2>
        </div>
      </div>
      <button class="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
        aria-label="Close panel" @click="store.clearSelection()">
        <X class="h-4 w-4" />
      </button>
    </div>

    <!-- Context-sensitive inspector -->
    <div class="flex-1 overflow-y-auto">
      <component :is="inspectorComponent" v-if="inspectorComponent" :data="node.data" />
      <p v-else class="p-[11px] text-[11.5px] text-muted-foreground">No inspector available for this node type.</p>
    </div>
  </aside>
</template>
