<script setup lang="ts">
import type { BuilderNodeData } from '@/stores/builder'
import type { SchemaField } from '@/types'

defineProps<{
  data: BuilderNodeData
  nodeId: string
  upstreamSchema: SchemaField[]
}>()
</script>

<template>
  <div class="p-4 text-sm italic text-muted-foreground">Code Step inspector — coming soon</div>
</template>
