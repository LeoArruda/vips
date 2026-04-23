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
    <div class="flex flex-1 flex-col overflow-hidden">
      <AppTopBar />
      <main class="flex-1 overflow-hidden">
        <slot />
      </main>
    </div>
    <NotificationsPanel />
    <WorkspaceSwitcher />
    <CommandPalette />
  </div>
</template>
