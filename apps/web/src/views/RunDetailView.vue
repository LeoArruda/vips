<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useRunsStore } from '@/stores/runs'
import type { RunDetail } from '@/stores/runs'
import { ArrowLeft } from 'lucide-vue-next'

const route = useRoute()
const router = useRouter()
const store = useRunsStore()

const detail = ref<RunDetail | undefined>(undefined)
let pollTimer: ReturnType<typeof setInterval> | undefined

async function loadDetail() {
  const data = await store.fetchDetail(route.params.id as string)
  if (data) detail.value = data
}

onMounted(async () => {
  await loadDetail()
  pollTimer = setInterval(async () => {
    if (detail.value?.status === 'queued' || detail.value?.status === 'running') {
      await loadDetail()
    } else {
      clearInterval(pollTimer)
    }
  }, 3000)
})

onUnmounted(() => {
  clearInterval(pollTimer)
})

const expandedNodes = ref<Set<string>>(new Set())

function toggleNode(nodeId: string) {
  if (expandedNodes.value.has(nodeId)) {
    expandedNodes.value.delete(nodeId)
  } else {
    expandedNodes.value.add(nodeId)
  }
}

const statusBg: Record<string, string> = {
  success: 'bg-green-100 text-green-700',
  failed: 'bg-red-100 text-red-700',
  running: 'bg-blue-100 text-blue-700',
  queued: 'bg-amber-100 text-amber-700',
  pending: 'bg-muted text-muted-foreground',
}

const logLevelColors: Record<string, string> = {
  info: 'text-blue-600',
  warn: 'text-amber-600',
  error: 'text-red-600',
}

function formatDuration(start?: string, end?: string): string {
  if (!start || !end) return '—'
  const ms = new Date(end).getTime() - new Date(start).getTime()
  if (ms < 1000) return `${ms}ms`
  return `${(ms / 1000).toFixed(2)}s`
}
</script>

<template>
  <div class="h-full overflow-y-auto p-[18px]">
    <!-- Not found -->
    <div v-if="!detail" class="py-12 text-center text-muted-foreground">
      <p class="text-sm">Run not found.</p>
      <button class="mt-3 text-sm text-primary underline" @click="router.push('/runs')">
        View all runs
      </button>
    </div>

    <div v-else>
      <!-- Back -->
      <button
        class="mb-4 flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        @click="router.push('/runs')"
      >
        <ArrowLeft class="h-4 w-4" />
        Runs
      </button>

      <!-- Run header -->
      <div class="mb-6 rounded-[7px] border bg-background p-[11px]">
        <div class="flex items-start justify-between">
          <div>
            <h1 class="text-[15px] font-semibold tracking-tight">{{ detail.workflow_id }}</h1>
            <p class="mt-0.5 text-[11.5px] text-muted-foreground">
              Run ID: {{ detail.id }} · Triggered by {{ detail.triggered_by }}
            </p>
          </div>
          <span
            class="rounded-full px-3 py-1 text-sm font-medium capitalize"
            :class="statusBg[detail.status] ?? 'bg-muted text-muted-foreground'"
          >
            {{ detail.status }}
          </span>
        </div>
        <div class="mt-3 flex flex-wrap gap-6 text-[11.5px] text-muted-foreground">
          <span>Started: {{ detail.started_at.replace('T', ' ').slice(0, 19) }}Z</span>
          <span v-if="detail.finished_at">Duration: {{ formatDuration(detail.started_at, detail.finished_at) }}</span>
        </div>
      </div>

      <!-- Log entries -->
      <h2 class="mb-3 text-[11.5px] font-semibold">Execution Logs</h2>
      <div class="rounded-[7px] border bg-background">
        <div v-if="detail.logs.length === 0" class="px-3 py-6 text-center text-[11.5px] text-muted-foreground">
          No logs available.
        </div>
        <div v-else class="divide-y">
          <div
            v-for="log in detail.logs"
            :key="log.id"
            class="flex items-start gap-3 px-3 py-[7px] font-mono text-xs"
          >
            <span class="shrink-0 text-muted-foreground">
              {{ log.created_at.slice(11, 23) }}
            </span>
            <span
              class="w-10 shrink-0 font-semibold uppercase"
              :class="logLevelColors[log.level] ?? 'text-muted-foreground'"
            >
              {{ log.level }}
            </span>
            <span v-if="log.node_id" class="shrink-0 text-muted-foreground">[{{ log.node_id }}]</span>
            <span class="text-foreground">{{ log.message }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
