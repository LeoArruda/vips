<script setup lang="ts">
import { computed } from 'vue'
import type { BuilderNodeData } from '@/stores/builder'
import { useBuilderStore } from '@/stores/builder'
import { TRANSFORM_REGISTRY } from '@/transforms/registry'
import type { TransformNodeType } from '@/types'
import { useUpstreamSchema } from '@/composables/useUpstreamSchema'

const props = defineProps<{ data: BuilderNodeData }>()
const store = useBuilderStore()

const nodeId = computed(() => store.selectedNode?.id ?? '')
const upstreamSchema = useUpstreamSchema(nodeId)

const inspectorComponent = computed(
  () => TRANSFORM_REGISTRY[props.data.nodeType as TransformNodeType]?.inspectorComponent ?? null,
)
</script>

<template>
  <component
    v-if="inspectorComponent && nodeId"
    :is="inspectorComponent"
    :data="props.data"
    :node-id="nodeId"
    :upstream-schema="upstreamSchema"
  />
  <div v-else class="p-4 text-sm italic text-muted-foreground">
    Unknown transform type: {{ props.data.nodeType }}
  </div>
</template>
