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
      <span class="text-sm font-semibold">
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
