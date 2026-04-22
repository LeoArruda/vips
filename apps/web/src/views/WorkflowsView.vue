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

        <div class="min-w-0 flex-1">
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
