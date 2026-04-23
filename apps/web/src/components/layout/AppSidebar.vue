<script setup lang="ts">
import { RouterLink, useRoute } from 'vue-router'
import {
  LayoutDashboard, GitBranch, Plug, PlayCircle, FileText, KeyRound,
  Activity, Bell, Globe, Server, ClipboardList, ShoppingBag,
} from 'lucide-vue-next'

const route = useRoute()

const navGroups = [
  {
    label: null,
    items: [
      { label: 'Dashboard', to: '/dashboard', icon: LayoutDashboard },
    ],
  },
  {
    label: 'BUILD',
    items: [
      { label: 'Workflows', to: '/workflows', icon: GitBranch },
      { label: 'Connectors', to: '/connectors', icon: Plug },
      { label: 'Templates', to: '/templates', icon: FileText },
      { label: 'Secrets', to: '/secrets', icon: KeyRound },
    ],
  },
  {
    label: 'OPERATE',
    items: [
      { label: 'Runs', to: '/runs', icon: PlayCircle },
      { label: 'Monitoring', to: '/monitoring', icon: Activity },
      { label: 'Alerts', to: '/alerts', icon: Bell },
    ],
  },
  {
    label: 'ECOSYSTEM',
    items: [
      { label: 'Marketplace', to: '/marketplace', icon: ShoppingBag },
    ],
  },
  {
    label: 'PLATFORM',
    items: [
      { label: 'Environments', to: '/environments', icon: Server },
      { label: 'Audit', to: '/audit', icon: ClipboardList },
    ],
  },
]

function isActive(to: string) {
  return route.path === to || (to !== '/dashboard' && route.path.startsWith(to))
}
</script>

<template>
  <aside class="flex h-full w-60 flex-col border-r bg-background">
    <div class="flex h-14 items-center border-b px-4">
      <span class="text-lg font-bold tracking-tight">vipsOS</span>
    </div>

    <nav class="flex-1 overflow-y-auto px-2 py-3">
      <template v-for="group in navGroups" :key="group.label ?? 'top'">
        <p v-if="group.label"
          class="mb-1 mt-3 px-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
          {{ group.label }}
        </p>
        <RouterLink
          v-for="item in group.items"
          :key="item.to"
          :to="item.to"
          class="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-muted"
          :class="isActive(item.to) ? 'bg-muted text-foreground' : 'text-muted-foreground'"
        >
          <component :is="item.icon" class="h-4 w-4 shrink-0" />
          {{ item.label }}
        </RouterLink>
      </template>
    </nav>

    <div class="border-t px-2 py-2">
      <RouterLink to="/settings" class="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground">
        <Globe class="h-4 w-4" />
        Settings
      </RouterLink>
    </div>
  </aside>
</template>
