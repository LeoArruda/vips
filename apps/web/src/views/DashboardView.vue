<script setup lang="ts">
import { useRunsStore } from '@/stores/runs'
import StatTile from '@/components/ui/StatTile.vue'
import {
  GitBranch,
  CheckCircle2,
  XCircle,
  Plug,
  Activity,
  TrendingUp,
} from 'lucide-vue-next'
import { dashboardStats } from '@/data/dashboard'
import { useRouter } from 'vue-router'

const router = useRouter()
const runsStore = useRunsStore()

const statusBg: Record<string, string> = {
  success: 'bg-green-100 text-green-700',
  failed: 'bg-red-100 text-red-700',
  running: 'bg-blue-100 text-blue-700',
  pending: 'bg-muted text-muted-foreground',
  cancelled: 'bg-muted text-muted-foreground',
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
      <h1 class="text-[15px] font-semibold tracking-tight">Dashboard</h1>
      <p class="mt-1 text-[11.5px] text-muted-foreground">Platform health and activity overview</p>
    </div>

    <!-- Stat tiles -->
    <div class="mb-6 grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-6">
      <StatTile
        label="Total Workflows"
        :value="dashboardStats.totalWorkflows"
        :icon="GitBranch"
        color-class="bg-blue-50 text-blue-600"
      />
      <StatTile
        label="Active"
        :value="dashboardStats.activeWorkflows"
        :icon="Activity"
        color-class="bg-green-50 text-green-600"
      />
      <StatTile
        label="Runs Today"
        :value="dashboardStats.totalRunsToday"
        :icon="TrendingUp"
        color-class="bg-purple-50 text-purple-600"
      />
      <StatTile
        label="Failed Today"
        :value="dashboardStats.failedRunsToday"
        :icon="XCircle"
        color-class="bg-red-50 text-red-600"
      />
      <StatTile
        label="Success Rate"
        :value="`${dashboardStats.successRate}%`"
        :icon="CheckCircle2"
        color-class="bg-emerald-50 text-emerald-600"
      />
      <StatTile
        label="Connectors"
        :value="dashboardStats.connectorCount"
        :icon="Plug"
        color-class="bg-amber-50 text-amber-600"
      />
    </div>

    <!-- Recent runs -->
    <div class="mb-6">
      <h2 class="mb-3 text-[11.5px] font-semibold">Recent Runs</h2>
      <div class="divide-y rounded-[7px] border">
        <div
          v-for="run in runsStore.records"
          :key="run.runId"
          class="flex cursor-pointer items-center gap-4 px-3 py-[7px] transition-colors hover:bg-muted/50"
          @click="router.push(`/runs/${run.runId}`)"
        >
          <span
            class="rounded-full px-2.5 py-0.5 text-xs font-medium capitalize"
            :class="statusBg[run.status] ?? 'bg-muted text-muted-foreground'"
          >
            {{ run.status }}
          </span>
          <div class="min-w-0 flex-1">
            <p class="truncate text-[11.5px] font-medium">{{ run.workflowName }}</p>
            <p class="text-xs text-muted-foreground">
              {{ run.triggeredBy }} · {{ run.startedAt.replace('T', ' ').slice(0, 16) }}Z
            </p>
          </div>
          <span class="text-xs tabular-nums text-muted-foreground">
            {{ formatDuration(run.durationMs) }}
          </span>
        </div>
      </div>
    </div>

    <!-- Failed runs -->
    <div v-if="dashboardStats.failedRuns.length > 0">
      <h2 class="mb-3 text-[11.5px] font-semibold text-red-600">Failed Runs</h2>
      <div class="divide-y rounded-[7px] border border-red-200">
        <div
          v-for="run in dashboardStats.failedRuns"
          :key="run.runId"
          class="flex cursor-pointer items-center gap-4 px-3 py-[7px] transition-colors hover:bg-red-50/50"
          @click="router.push(`/runs/${run.runId}`)"
        >
          <XCircle class="h-4 w-4 flex-shrink-0 text-red-500" />
          <div class="min-w-0 flex-1">
            <p class="truncate text-[11.5px] font-medium">{{ run.workflowName }}</p>
            <p class="text-xs text-muted-foreground">
              {{ run.failedNodeCount }} node(s) failed ·
              {{ run.startedAt.replace('T', ' ').slice(0, 16) }}Z
            </p>
          </div>
          <span class="text-xs font-medium text-red-600">View →</span>
        </div>
      </div>
    </div>
  </div>
</template>
