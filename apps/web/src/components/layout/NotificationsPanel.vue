<script setup lang="ts">
import { useShellStore } from '@/stores/shell'
import { X, AlertTriangle, Info } from 'lucide-vue-next'

const shell = useShellStore()

const notifications = [
  { id: 1, type: 'error', title: 'Stripe Payments Pipeline failed', time: '6 min ago' },
  { id: 2, type: 'warning', title: 'Salesforce OAuth token expiring soon', time: '1 hr ago' },
  { id: 3, type: 'info', title: 'Nightly Archive completed successfully', time: '2 hr ago' },
]

const iconMap = { error: AlertTriangle, warning: AlertTriangle, info: Info }
const colorMap = { error: 'text-red-500', warning: 'text-amber-500', info: 'text-blue-500' }
</script>

<template>
  <Teleport to="body">
    <div v-if="shell.notificationsOpen" class="fixed inset-0 z-40" @click="shell.toggleNotifications()">
      <div class="absolute right-0 top-0 h-full w-80 border-l bg-background shadow-xl" @click.stop>
        <div class="flex items-center justify-between border-b px-4 py-3">
          <h2 class="text-sm font-semibold">Notifications</h2>
          <button class="rounded-md p-1 hover:bg-muted" @click="shell.toggleNotifications()">
            <X class="h-4 w-4" />
          </button>
        </div>
        <div class="divide-y overflow-y-auto">
          <div v-for="n in notifications" :key="n.id" class="flex gap-3 px-4 py-3 hover:bg-muted/30">
            <component :is="iconMap[n.type as keyof typeof iconMap]" class="mt-0.5 h-4 w-4 shrink-0"
              :class="colorMap[n.type as keyof typeof colorMap]" />
            <div>
              <p class="text-sm font-medium">{{ n.title }}</p>
              <p class="mt-0.5 text-xs text-muted-foreground">{{ n.time }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>
