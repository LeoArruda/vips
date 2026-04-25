<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useRunsStore } from '@/stores/runs'
import { CheckCircle2, XCircle, Clock } from 'lucide-vue-next'
import type { Component } from 'vue'

const router = useRouter()
const store = useRunsStore()

const statusIcons: Record<string, Component> = {
  success: CheckCircle2,
  failed: XCircle,
  running: Clock,
  pending: Clock,
}

const statusColors: Record<string, string> = {
  success: 'text-green-600',
  failed: 'text-red-600',
  running: 'text-blue-600',
  pending: 'text-muted-foreground',
}

const statusBg: Record<string, string> = {
  success: 'bg-green-100 text-green-700',
  failed: 'bg-red-100 text-red-700',
  running: 'bg-blue-100 text-blue-700',
  pending: 'bg-muted text-muted-foreground',
}

function formatDuration(ms?: number): string {
  if (!ms) return '—'
  if (ms < 1000) return `${ms}ms`
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`
  return `${Math.floor(ms / 60000)}m ${Math.floor((ms % 60000) / 1000)}s`
}
</script>

<template>
  <div class="h-full overflow-y-auto p-[18px]">
    <div class="mb-5">
      <h1 class="text-[15px] font-semibold tracking-tight">Runs</h1>
      <p class="mt-1 text-[11.5px] text-muted-foreground">{{ store.records.length }} recent runs</p>
    </div>

    <div class="divide-y rounded-[7px] border">
      <div
        v-for="run in store.records"
        :key="run.runId"
        class="flex cursor-pointer items-center gap-4 px-3 py-[7px] transition-colors hover:bg-muted/50"
        @click="router.push(`/runs/${run.runId}`)"
      >
        <component
          :is="statusIcons[run.status] ?? Clock"
          class="h-4 w-4 flex-shrink-0"
          :class="statusColors[run.status] ?? 'text-muted-foreground'"
        />
        <div class="min-w-0 flex-1">
          <p class="truncate text-[11.5px] font-medium">{{ run.workflowName }}</p>
          <p class="text-xs text-muted-foreground">
            {{ run.triggeredBy }} · {{ run.startedAt.replace('T', ' ').slice(0, 16) }}Z
          </p>
        </div>
        <span
          class="rounded-full px-2.5 py-0.5 text-xs font-medium capitalize"
          :class="statusBg[run.status] ?? 'bg-muted text-muted-foreground'"
        >
          {{ run.status }}
        </span>
        <span class="w-12 text-right text-xs tabular-nums text-muted-foreground">
          {{ formatDuration(run.durationMs) }}
        </span>
      </div>
    </div>
  </div>
</template>
