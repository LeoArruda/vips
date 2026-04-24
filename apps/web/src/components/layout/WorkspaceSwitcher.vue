<script setup lang="ts">
import { useShellStore } from '@/stores/shell'
import { useAuthStore } from '@/stores/auth'
import { Check } from 'lucide-vue-next'

const shell = useShellStore()
const auth = useAuthStore()

const workspaces = [
  { id: 'ws_001', name: 'Production', env: 'prod' },
  { id: 'ws_002', name: 'Staging', env: 'staging' },
  { id: 'ws_003', name: 'Development', env: 'dev' },
]
</script>

<template>
  <Teleport to="body">
    <div v-if="shell.workspaceSwitcherOpen" class="fixed inset-0 z-40" @click="shell.toggleWorkspaceSwitcher()">
      <div class="absolute left-64 top-14 w-56 rounded-lg border bg-background shadow-lg" @click.stop>
        <div class="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Workspaces
        </div>
        <div class="divide-y">
          <button v-for="ws in workspaces" :key="ws.id"
            class="flex w-full items-center gap-2 px-3 py-2.5 text-sm hover:bg-muted"
            @click="shell.toggleWorkspaceSwitcher()">
            <Check v-if="ws.id === auth.session?.workspaceId" class="h-3.5 w-3.5 text-foreground" />
            <span v-else class="h-3.5 w-3.5" />
            <span class="font-medium">{{ ws.name }}</span>
            <span class="ml-auto text-xs text-muted-foreground">{{ ws.env }}</span>
          </button>
        </div>
        <div class="border-t px-3 py-2">
          <button class="text-xs text-muted-foreground hover:text-foreground">+ Create workspace</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>
