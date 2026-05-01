<script setup lang="ts">
import { Bell, ChevronsUpDown } from 'lucide-vue-next'
import { useShellStore } from '@/stores/shell'
import { useAuthStore } from '@/stores/auth'
import { RouterLink } from 'vue-router'

const shell = useShellStore()
const auth = useAuthStore()
</script>

<template>
  <header class="flex h-10 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-4">
    <button
      class="flex items-center gap-1.5 rounded-[5px] px-2 py-1 text-[12px] font-medium text-slate-700 hover:bg-slate-100"
      @click="shell.toggleWorkspaceSwitcher()">
      <span>{{ auth.session?.workspaceName ?? 'Workspace' }}</span>
      <ChevronsUpDown class="h-3 w-3 text-slate-400" />
    </button>

    <div class="flex items-center gap-1">
      <button
        class="relative rounded-[5px] p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
        @click="shell.toggleNotifications()">
        <Bell class="h-3.5 w-3.5" />
        <span class="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-red-500" />
      </button>
      <RouterLink to="/profile"
        class="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-500 text-[10px] font-semibold text-white hover:ring-2 hover:ring-indigo-300">
        {{ auth.session?.email?.[0]?.toUpperCase() ?? '?' }}
      </RouterLink>
    </div>
  </header>
</template>
