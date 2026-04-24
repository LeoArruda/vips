<script setup lang="ts">
import { useMonitoringStore } from '@/stores/monitoring'
import { Activity, AlertTriangle, Server } from 'lucide-vue-next'

const store = useMonitoringStore()

const healthDot: Record<string, string> = {
  healthy: 'bg-green-500',
  degraded: 'bg-amber-500',
  offline: 'bg-red-500',
}

const healthColor: Record<string, string> = {
  healthy: 'text-green-500',
  degraded: 'text-amber-500',
  offline: 'text-red-500',
}

const statusColor: Record<string, string> = {
  running: 'text-blue-500',
  success: 'text-green-600',
  failed: 'text-red-500',
}

function elapsed(startedAt: string, durationMs?: number): string {
  if (durationMs) return `${(durationMs / 1000).toFixed(1)}s`
  const ms = Date.now() - new Date(startedAt).getTime()
  return `${Math.floor(ms / 1000)}s`
}
</script>

<template>
  <div class="flex h-full flex-col overflow-auto">
    <div class="border-b px-6 py-4">
      <h1 class="text-xl font-semibold">Monitoring</h1>
      <p class="mt-0.5 text-sm text-muted-foreground">Real-time platform health</p>
    </div>

    <div class="flex-1 overflow-y-auto p-6 space-y-6">
      <!-- KPI row -->
      <div class="grid grid-cols-3 gap-4">
        <div class="rounded-lg border bg-background p-4">
          <div class="flex items-center gap-2 mb-1">
            <Activity class="h-4 w-4 text-green-500" />
            <p class="text-sm font-medium text-muted-foreground">Active Runs</p>
          </div>
          <p class="text-3xl font-bold text-green-600">{{ store.stats.activeRuns }}</p>
        </div>
        <div class="rounded-lg border bg-background p-4">
          <div class="flex items-center gap-2 mb-1">
            <AlertTriangle class="h-4 w-4 text-red-500" />
            <p class="text-sm font-medium text-muted-foreground">Failed (last 1h)</p>
          </div>
          <p class="text-3xl font-bold text-red-600">{{ store.stats.failedLastHour }}</p>
        </div>
        <div class="rounded-lg border bg-background p-4">
          <div class="flex items-center gap-2 mb-1">
            <Server class="h-4 w-4 text-amber-500" />
            <p class="text-sm font-medium text-muted-foreground">Workers Degraded</p>
          </div>
          <p class="text-3xl font-bold text-amber-600">{{ store.degradedWorkerCount }}</p>
        </div>
      </div>

      <!-- Middle zone -->
      <div class="grid grid-cols-3 gap-4">
        <div class="col-span-2 rounded-lg border p-4">
          <p class="mb-3 text-sm font-semibold">Throughput (24h)</p>
          <div class="flex h-24 items-end gap-1">
            <div v-for="(h, i) in Array.from({ length: 24 }, () => Math.floor(Math.random() * 80) + 20)"
              :key="i"
              class="flex-1 rounded-t bg-blue-200"
              :style="{ height: h + '%' }" />
          </div>
          <div class="mt-1 flex justify-between text-xs text-muted-foreground">
            <span>00:00</span><span>12:00</span><span>now</span>
          </div>
        </div>
        <div class="rounded-lg border p-4">
          <p class="mb-3 text-sm font-semibold">Worker Health</p>
          <div class="space-y-2">
            <div v-for="w in store.stats.workers" :key="w.workerId" class="flex items-center gap-2">
              <span class="h-2 w-2 rounded-full" :class="healthDot[w.health]" />
              <span class="flex-1 text-sm">{{ w.name }}</span>
              <span class="text-xs" :class="healthColor[w.health]">{{ w.health }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Live run feed -->
      <div class="rounded-lg border">
        <div class="border-b px-4 py-3">
          <p class="text-sm font-semibold">Live Run Feed</p>
        </div>
        <table class="w-full text-sm">
          <thead class="bg-muted/50">
            <tr>
              <th class="px-4 py-2 text-left font-medium text-muted-foreground">Workflow</th>
              <th class="px-4 py-2 text-left font-medium text-muted-foreground">Status</th>
              <th class="px-4 py-2 text-left font-medium text-muted-foreground">Started</th>
              <th class="px-4 py-2 text-left font-medium text-muted-foreground">Duration</th>
            </tr>
          </thead>
          <tbody class="divide-y">
            <tr v-for="r in store.liveRuns" :key="r.runId" class="hover:bg-muted/30">
              <td class="px-4 py-2.5 font-medium">{{ r.workflowName }}</td>
              <td class="px-4 py-2.5">
                <span class="capitalize font-medium" :class="statusColor[r.status]">{{ r.status }}</span>
              </td>
              <td class="px-4 py-2.5 text-muted-foreground">{{ new Date(r.startedAt).toLocaleTimeString() }}</td>
              <td class="px-4 py-2.5 text-muted-foreground">{{ elapsed(r.startedAt, r.durationMs) }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Degraded worker failure state -->
      <div v-if="store.degradedWorkerCount > 0"
        class="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 flex items-center gap-2">
        <AlertTriangle class="h-4 w-4 shrink-0" />
        {{ store.degradedWorkerCount }} worker(s) degraded. Runs may be delayed. Check Environments for details.
      </div>
    </div>
  </div>
</template>
