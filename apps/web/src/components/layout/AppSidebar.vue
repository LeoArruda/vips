<script setup lang="ts">
import { RouterLink, useRoute } from 'vue-router'
import { LayoutDashboard, GitBranch, Plug, PlayCircle } from 'lucide-vue-next'

const route = useRoute()

const navItems = [
  { label: 'Dashboard', to: '/dashboard', icon: LayoutDashboard },
  { label: 'Workflows', to: '/workflows', icon: GitBranch },
  { label: 'Connectors', to: '/connectors', icon: Plug },
  { label: 'Runs', to: '/runs', icon: PlayCircle },
]
</script>

<template>
  <aside class="flex h-full w-60 flex-col border-r bg-background">
    <div class="flex h-14 items-center border-b px-4">
      <span class="text-lg font-bold tracking-tight">vipsOS</span>
    </div>

    <nav class="flex-1 space-y-1 px-2 py-3">
      <RouterLink
        v-for="item in navItems"
        :key="item.to"
        :to="item.to"
        class="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-muted"
        :class="route.path.startsWith(item.to) ? 'bg-muted text-foreground' : 'text-muted-foreground'"
      >
        <component :is="item.icon" class="h-4 w-4 shrink-0" />
        {{ item.label }}
      </RouterLink>
    </nav>
  </aside>
</template>
