<script setup lang="ts">
import AppSidebar from './AppSidebar.vue'
import AppTopBar from './AppTopBar.vue'
import NotificationsPanel from './NotificationsPanel.vue'
import WorkspaceSwitcher from './WorkspaceSwitcher.vue'
import CommandPalette from './CommandPalette.vue'
</script>

<template>
  <div class="flex h-screen overflow-hidden bg-background text-foreground">
    <AppSidebar />
    <div class="flex flex-1 flex-col overflow-hidden min-w-0 transition-all duration-[220ms] ease-[cubic-bezier(0.4,0,0.2,1)]">
      <AppTopBar />
      <main class="flex-1 overflow-hidden bg-background">
        <slot />
      </main>
    </div>
    <NotificationsPanel />
    <WorkspaceSwitcher />
    <CommandPalette />
  </div>
</template>
