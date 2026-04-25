<script setup lang="ts">
import { ref } from 'vue'
import { useEnvironmentsStore } from '@/stores/environments'
import type { Environment } from '@/types/operations'
import { Server, Plus, X, Wifi } from 'lucide-vue-next'

const store = useEnvironmentsStore()
const selectedEnv = ref<Environment | null>(null)

const healthBorder: Record<string, string> = {
  healthy: 'border-green-200',
  degraded: 'border-amber-200',
  offline: 'border-red-200',
}

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
</script>

<template>
  <div class="flex h-full flex-col overflow-auto">
    <div class="border-b px-[18px] py-[11px]">
      <h1 class="text-[15px] font-semibold tracking-tight">Environments</h1>
      <p class="mt-0.5 text-[11.5px] text-muted-foreground">Manage execution data planes</p>
    </div>

    <div class="flex-1 overflow-y-auto p-[18px]">
      <div class="grid grid-cols-3 gap-2">
        <div v-for="env in store.environments" :key="env.envId"
          class="cursor-pointer rounded-[7px] border-2 p-[11px] hover:shadow-sm transition-shadow"
          :class="healthBorder[env.health]"
          @click="selectedEnv = env">
          <div class="flex items-start justify-between mb-2">
            <Server class="h-5 w-5 text-muted-foreground" />
            <span class="rounded-full bg-muted px-2 py-0.5 text-xs font-medium capitalize">{{ env.type }}</span>
          </div>
          <h3 class="font-semibold text-sm">{{ env.name }}</h3>
          <p class="mt-1 text-xs text-muted-foreground">{{ env.region }}</p>
          <div class="mt-3 flex items-center gap-1.5">
            <span class="h-2 w-2 rounded-full" :class="healthDot[env.health]" />
            <span class="text-xs capitalize" :class="healthColor[env.health]">{{ env.health }}</span>
            <span class="ml-auto text-xs text-muted-foreground">
              {{ env.workerCount }} worker{{ env.workerCount !== 1 ? 's' : '' }}
            </span>
          </div>
        </div>

        <div class="cursor-pointer rounded-[7px] border-2 border-dashed p-[11px] flex flex-col items-center justify-center gap-2 text-muted-foreground hover:bg-muted/30 hover:text-foreground transition-colors">
          <Plus class="h-6 w-6" />
          <span class="text-sm font-medium">Add Environment</span>
        </div>
      </div>
    </div>

    <!-- Environment detail slide-over -->
    <div v-if="selectedEnv" class="fixed inset-0 z-40 flex justify-end" @click.self="selectedEnv = null">
      <div class="h-full w-96 overflow-y-auto border-l bg-background shadow-xl">
        <div class="flex items-center justify-between border-b px-3 py-[7px]">
          <h2 class="text-[11.5px] font-semibold">{{ selectedEnv.name }}</h2>
          <button class="rounded-md p-1 hover:bg-muted" @click="selectedEnv = null">
            <X class="h-4 w-4" />
          </button>
        </div>

        <div class="p-[11px] space-y-3">
          <div>
            <p class="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Status</p>
            <div class="flex items-center gap-2">
              <span class="h-2.5 w-2.5 rounded-full"
                :class="selectedEnv.health === 'healthy' ? 'bg-green-500' : selectedEnv.health === 'degraded' ? 'bg-amber-500' : 'bg-red-500'" />
              <span class="capitalize text-sm font-medium" :class="healthColor[selectedEnv.health]">{{ selectedEnv.health }}</span>
              <span class="text-muted-foreground text-sm">· {{ selectedEnv.workerCount }} workers · v{{ selectedEnv.agentVersion }}</span>
            </div>
          </div>

          <div>
            <p class="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Connectivity</p>
            <button class="flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm font-medium hover:bg-muted">
              <Wifi class="h-3.5 w-3.5" /> Test connection
            </button>
          </div>

          <div>
            <p class="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Assigned Workflows</p>
            <div class="space-y-1">
              <div v-for="wfId in selectedEnv.assignedWorkflows" :key="wfId"
                class="rounded-md bg-muted/50 px-3 py-1.5 text-sm text-muted-foreground">{{ wfId }}</div>
            </div>
          </div>

          <div v-if="selectedEnv.type === 'agent'">
            <p class="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Agent Install</p>
            <pre class="rounded-md bg-muted p-3 text-xs overflow-x-auto">curl -fsSL https://install.vipsos.io | sh
vipsos-agent register --token &lt;TOKEN&gt;</pre>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
