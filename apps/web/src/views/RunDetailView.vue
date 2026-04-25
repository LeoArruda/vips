<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useRunsStore } from '@/stores/runs'
import NodeStatusBadge from '@/components/runs/NodeStatusBadge.vue'
import { ArrowLeft, ChevronDown, ChevronRight, RotateCw } from 'lucide-vue-next'

const route = useRoute()
const router = useRouter()
const store = useRunsStore()

const detail = computed(() => store.getDetail(route.params.id as string))

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
  pending: 'bg-muted text-muted-foreground',
  cancelled: 'bg-muted text-muted-foreground',
}

const logLevelColors: Record<string, string> = {
  info: 'text-blue-600',
  warn: 'text-amber-600',
  error: 'text-red-600',
}

function formatDuration(ms?: number): string {
  if (!ms) return '—'
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
            <h1 class="text-[15px] font-semibold tracking-tight">{{ detail.workflowName }}</h1>
            <p class="mt-0.5 text-[11.5px] text-muted-foreground">
              Run ID: {{ detail.runId }} · Triggered by {{ detail.triggeredBy }}
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
          <span>Started: {{ detail.startedAt.replace('T', ' ').slice(0, 19) }}Z</span>
          <span v-if="detail.durationMs">Duration: {{ formatDuration(detail.durationMs) }}</span>
          <span>Nodes: {{ detail.nodeCount }} ({{ detail.failedNodeCount }} failed)</span>
        </div>
      </div>

      <!-- Node timeline -->
      <h2 class="mb-3 text-[11.5px] font-semibold">Execution Timeline</h2>
      <div class="space-y-2">
        <div
          v-for="node in detail.nodes"
          :key="node.nodeId"
          class="rounded-[7px] border bg-background"
        >
          <!-- Node header -->
          <button
            class="flex w-full items-center gap-3 px-3 py-[7px] text-left"
            @click="toggleNode(node.nodeId)"
          >
            <component
              :is="expandedNodes.has(node.nodeId) ? ChevronDown : ChevronRight"
              class="h-4 w-4 flex-shrink-0 text-muted-foreground"
            />
            <span class="flex-1 text-[11.5px] font-medium">{{ node.nodeLabel }}</span>
            <NodeStatusBadge :status="node.status" />
            <button
              v-if="node.status === 'failed'"
              class="ml-auto flex items-center gap-1 rounded-[5px] bg-indigo-500 text-white hover:bg-indigo-600 border-0 px-2.5 py-1 text-xs font-medium"
              @click.stop="store.retryNode(detail.runId, node.nodeId)"
            >
              <RotateCw class="h-3.5 w-3.5" /> Retry node
            </button>
            <span class="ml-2 text-xs tabular-nums text-muted-foreground">
              {{ formatDuration(node.durationMs) }}
            </span>
          </button>

          <!-- Log entries -->
          <div v-if="expandedNodes.has(node.nodeId)" class="border-t bg-muted/30 px-3 py-[7px]">
            <div v-if="node.logs.length === 0" class="text-xs text-muted-foreground">No logs.</div>
            <div v-else class="space-y-1.5 font-mono text-xs">
              <div v-for="(log, i) in node.logs" :key="i" class="flex gap-3">
                <span class="shrink-0 text-muted-foreground">
                  {{ log.timestamp.slice(11, 23) }}
                </span>
                <span
                  class="w-10 shrink-0 font-semibold uppercase"
                  :class="logLevelColors[log.level] ?? 'text-muted-foreground'"
                >
                  {{ log.level }}
                </span>
                <span class="text-foreground">{{ log.message }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Schema drift panel -->
      <div v-if="detail && detail.nodes.some(n => n.logs.some(l => l.message.toLowerCase().includes('schema')))"
        class="m-[18px] rounded-[7px] border border-amber-200 bg-amber-50 p-[11px]">
        <h3 class="mb-2 text-sm font-semibold text-amber-800">Schema drift detected</h3>
        <p class="mb-3 text-xs text-amber-700">One or more nodes received unexpected fields. Review the diff below.</p>
        <div class="grid grid-cols-2 gap-3">
          <div class="rounded-md border bg-background p-3">
            <p class="mb-1.5 text-xs font-semibold text-muted-foreground">Expected schema</p>
            <pre class="text-xs text-green-700">{ "id": "string", "email": "string", "name": "string" }</pre>
          </div>
          <div class="rounded-md border bg-background p-3">
            <p class="mb-1.5 text-xs font-semibold text-muted-foreground">Actual schema</p>
            <pre class="text-xs text-red-600">{ "id": "string", "email": "string", "full_name": "string" }</pre>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
