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
