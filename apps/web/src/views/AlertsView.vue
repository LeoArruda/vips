<script setup lang="ts">
import { ref } from 'vue'
import { stubAlertRules, stubIncidents } from '@/data/alerts'
import { Plus, AlertTriangle, ToggleRight, ToggleLeft, CheckCircle } from 'lucide-vue-next'

const incidents = ref([...stubIncidents])
const rules = ref([...stubAlertRules])
const showCreate = ref(false)

const severityColor: Record<string, string> = {
  critical: 'bg-red-100 text-red-700',
  warning: 'bg-amber-100 text-amber-700',
  info: 'bg-blue-100 text-blue-700',
}

function acknowledge(incidentId: string) {
  const inc = incidents.value.find(i => i.incidentId === incidentId)
  if (inc) inc.acknowledged = true
}

function resolve(incidentId: string) {
  const inc = incidents.value.find(i => i.incidentId === incidentId)
  if (inc) inc.resolvedAt = new Date().toISOString()
}
</script>

<template>
  <div class="flex h-full flex-col overflow-auto">
    <div class="flex items-center justify-between border-b px-[18px] py-[11px]">
      <div>
        <h1 class="text-[15px] font-semibold tracking-tight">Alerts</h1>
        <p class="mt-0.5 text-[11.5px] text-muted-foreground">
          {{ incidents.filter(i => !i.resolvedAt).length }} open incident(s)
        </p>
      </div>
      <button class="flex items-center gap-2 rounded-[5px] bg-indigo-500 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-600"
        @click="showCreate = true">
        <Plus class="h-4 w-4" /> New rule
      </button>
    </div>

    <div class="flex-1 overflow-y-auto p-[18px] space-y-3">
      <!-- Open incidents -->
      <div v-if="incidents.some(i => !i.resolvedAt)">
        <h2 class="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Open Incidents</h2>
        <div class="space-y-2">
          <div v-for="inc in incidents.filter(i => !i.resolvedAt)" :key="inc.incidentId"
            class="flex items-center gap-3 rounded-[7px] border p-[11px]">
            <AlertTriangle class="h-4 w-4 shrink-0"
              :class="inc.severity === 'critical' ? 'text-red-500' : 'text-amber-500'" />
            <div class="flex-1">
              <p class="font-medium text-sm">{{ inc.ruleName }}</p>
              <p class="text-xs text-muted-foreground">Triggered {{ new Date(inc.triggeredAt).toLocaleString() }}</p>
            </div>
            <span class="rounded-full px-2.5 py-0.5 text-xs font-medium capitalize"
              :class="severityColor[inc.severity]">{{ inc.severity }}</span>
            <div class="flex gap-2">
              <button v-if="!inc.acknowledged"
                class="rounded-md border px-2.5 py-1 text-xs font-medium hover:bg-muted"
                @click="acknowledge(inc.incidentId)">Acknowledge</button>
              <button class="flex items-center gap-1 rounded-md border px-2.5 py-1 text-xs font-medium hover:bg-muted"
                @click="resolve(inc.incidentId)">
                <CheckCircle class="h-3 w-3" /> Resolve
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Alert rules -->
      <div>
        <h2 class="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Alert Rules</h2>
        <div class="overflow-hidden rounded-[7px] border">
          <table class="w-full text-sm">
            <thead class="bg-muted/50">
              <tr>
                <th class="px-3 py-2 text-left text-[10.5px] font-medium text-muted-foreground">Name</th>
                <th class="px-3 py-2 text-left text-[10.5px] font-medium text-muted-foreground">Condition</th>
                <th class="px-3 py-2 text-left text-[10.5px] font-medium text-muted-foreground">Destinations</th>
                <th class="px-3 py-2 text-left text-[10.5px] font-medium text-muted-foreground">Enabled</th>
              </tr>
            </thead>
            <tbody class="divide-y">
              <tr v-for="rule in rules" :key="rule.ruleId" class="hover:bg-muted/30">
                <td class="px-3 py-[7px] text-[11.5px] font-medium">{{ rule.name }}</td>
                <td class="px-3 py-[7px] text-[11.5px] text-muted-foreground text-xs">{{ rule.condition }} ({{ rule.threshold }})</td>
                <td class="px-3 py-[7px] text-[11.5px]">
                  <div class="flex gap-1">
                    <span v-for="d in rule.destinations" :key="d"
                      class="rounded-full bg-muted px-2 py-0.5 text-xs capitalize">{{ d }}</span>
                  </div>
                </td>
                <td class="px-3 py-[7px] text-[11.5px]">
                  <ToggleRight v-if="rule.enabled" class="h-5 w-5 text-green-500" />
                  <ToggleLeft v-else class="h-5 w-5 text-muted-foreground" />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Create rule modal -->
    <div v-if="showCreate" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      @click.self="showCreate = false">
      <div class="w-full max-w-md rounded-[7px] border bg-background p-[18px] shadow-lg">
        <h2 class="text-lg font-semibold">Create Alert Rule</h2>
        <div class="mt-4 space-y-3">
          <div>
            <label class="mb-1 block text-sm font-medium">Rule name</label>
            <input type="text" placeholder="e.g. Failed run spike"
              class="w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" />
          </div>
          <div>
            <label class="mb-1 block text-sm font-medium">Metric</label>
            <select class="w-full rounded-md border px-3 py-2 text-sm outline-none">
              <option>Failed runs</option>
              <option>Worker health</option>
              <option>Usage quota</option>
            </select>
          </div>
          <div>
            <label class="mb-1 block text-sm font-medium">Notify via</label>
            <div class="flex gap-3">
              <label v-for="d in ['Slack', 'Email', 'Webhook']" :key="d" class="flex items-center gap-1.5 text-sm">
                <input type="checkbox" /> {{ d }}
              </label>
            </div>
          </div>
        </div>
        <div class="mt-4 flex gap-2">
          <button class="flex-1 rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted"
            @click="showCreate = false">Cancel</button>
          <button class="flex-1 rounded-[5px] bg-indigo-500 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-600"
            @click="showCreate = false">Create rule</button>
        </div>
      </div>
    </div>
  </div>
</template>
