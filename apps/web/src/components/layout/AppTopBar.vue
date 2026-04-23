<script setup lang="ts">
import { Bell, ChevronsUpDown } from 'lucide-vue-next'
import { useShellStore } from '@/stores/shell'
import { useAuthStore } from '@/stores/auth'
import { RouterLink } from 'vue-router'

const shell = useShellStore()
const auth = useAuthStore()
</script>

<template>
  <header class="flex h-14 shrink-0 items-center justify-between border-b bg-background px-4">
    <button
      class="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm font-medium hover:bg-muted"
      @click="shell.toggleWorkspaceSwitcher()">
      <span>{{ auth.session?.workspaceName ?? 'Workspace' }}</span>
      <ChevronsUpDown class="h-3.5 w-3.5 text-muted-foreground" />
    </button>

    <div class="flex items-center gap-1">
      <button class="relative rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
        @click="shell.toggleNotifications()">
        <Bell class="h-4 w-4" />
        <span class="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-red-500" />
      </button>
      <RouterLink to="/profile"
        class="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-sm font-semibold hover:ring-2 hover:ring-ring">
        {{ auth.session?.user.avatarInitial ?? '?' }}
      </RouterLink>
    </div>
  </header>
</template>
