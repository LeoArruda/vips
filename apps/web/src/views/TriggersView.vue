<script setup lang="ts">
import { ref } from 'vue'
import { useTriggersStore } from '@/stores/triggers'
import { RouterLink } from 'vue-router'
import { Plus, ToggleLeft, ToggleRight, Webhook, Clock } from 'lucide-vue-next'

const store = useTriggersStore()
const showCreate = ref(false)

function formatCron(cron: string) {
  const map: Record<string, string> = {
    '0 8 * * *': 'Daily at 08:00',
    '0 2 * * *': 'Daily at 02:00',
    '0 * * * *': 'Every hour',
  }
  return map[cron] ?? cron
}
</script>

<template>
  <div class="flex h-full flex-col overflow-auto">
    <div class="flex items-center justify-between border-b px-6 py-4">
      <div>
        <h1 class="text-xl font-semibold">Triggers & Schedules</h1>
        <p class="mt-0.5 text-sm text-muted-foreground">
          {{ store.enabled.length }} active trigger{{ store.enabled.length !== 1 ? 's' : '' }}
        </p>
      </div>
      <button class="flex items-center gap-2 rounded-md bg-foreground px-3 py-2 text-sm font-medium text-background hover:bg-foreground/90"
        @click="showCreate = true">
        <Plus class="h-4 w-4" /> Add trigger
      </button>
    </div>

    <div class="flex-1 overflow-y-auto p-6">
      <div class="overflow-hidden rounded-lg border">
        <table class="w-full text-sm">
          <thead class="bg-muted/50">
            <tr>
              <th class="px-4 py-3 text-left font-medium text-muted-foreground">Workflow</th>
              <th class="px-4 py-3 text-left font-medium text-muted-foreground">Type</th>
              <th class="px-4 py-3 text-left font-medium text-muted-foreground">Schedule / URL</th>
              <th class="px-4 py-3 text-left font-medium text-muted-foreground">Next run</th>
              <th class="px-4 py-3 text-left font-medium text-muted-foreground">Enabled</th>
            </tr>
          </thead>
          <tbody class="divide-y">
            <tr v-for="t in store.triggers" :key="t.triggerId" class="hover:bg-muted/30">
              <td class="px-4 py-3">
                <RouterLink to="/workflows" class="font-medium hover:underline">
                  {{ t.workflowName }}
                </RouterLink>
              </td>
              <td class="px-4 py-3">
                <span class="flex items-center gap-1.5 text-muted-foreground">
                  <Clock v-if="t.kind === 'schedule'" class="h-3.5 w-3.5" />
                  <Webhook v-else class="h-3.5 w-3.5" />
                  {{ t.kind }}
                </span>
              </td>
              <td class="px-4 py-3 text-muted-foreground">
                <span v-if="t.cron">{{ formatCron(t.cron) }} ({{ t.timezone }})</span>
                <code v-else-if="t.webhookUrl" class="rounded bg-muted px-1.5 py-0.5 text-xs">
                  {{ t.webhookUrl }}
                </code>
              </td>
              <td class="px-4 py-3 text-muted-foreground">
                {{ t.nextRunAt ? new Date(t.nextRunAt).toLocaleString() : '—' }}
              </td>
              <td class="px-4 py-3">
                <button @click="store.toggle(t.triggerId)" class="text-muted-foreground hover:text-foreground">
                  <ToggleRight v-if="t.enabled" class="h-5 w-5 text-green-500" />
                  <ToggleLeft v-else class="h-5 w-5" />
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="showCreate" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
        @click.self="showCreate = false">
        <div class="w-full max-w-md rounded-xl border bg-background p-6 shadow-lg">
          <h2 class="text-lg font-semibold">Add Trigger</h2>
          <p class="mt-1 text-sm text-muted-foreground">Choose a type to configure.</p>
          <div class="mt-4 grid grid-cols-2 gap-3">
            <button class="rounded-lg border p-4 text-left hover:bg-muted" @click="showCreate = false">
              <Clock class="mb-2 h-5 w-5 text-muted-foreground" />
              <div class="font-medium">Schedule</div>
              <div class="mt-0.5 text-xs text-muted-foreground">Run on a cron or interval</div>
            </button>
            <button class="rounded-lg border p-4 text-left hover:bg-muted" @click="showCreate = false">
              <Webhook class="mb-2 h-5 w-5 text-muted-foreground" />
              <div class="font-medium">Webhook</div>
              <div class="mt-0.5 text-xs text-muted-foreground">Trigger on HTTP POST</div>
            </button>
          </div>
          <button class="mt-4 text-sm text-muted-foreground hover:text-foreground" @click="showCreate = false">Cancel</button>
        </div>
      </div>
    </div>
  </div>
</template>
