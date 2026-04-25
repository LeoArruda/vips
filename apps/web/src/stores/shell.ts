// src/stores/shell.ts
import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

const SIDEBAR_KEY = 'vipsos:sidebar-collapsed'

export const useShellStore = defineStore('shell', () => {
  const notificationsOpen = ref(false)
  const workspaceSwitcherOpen = ref(false)
  const commandPaletteOpen = ref(false)
  const sidebarCollapsed = ref(localStorage.getItem(SIDEBAR_KEY) === 'true')

  watch(sidebarCollapsed, (val) => {
    localStorage.setItem(SIDEBAR_KEY, String(val))
  })

  function toggleNotifications() { notificationsOpen.value = !notificationsOpen.value }
  function toggleWorkspaceSwitcher() { workspaceSwitcherOpen.value = !workspaceSwitcherOpen.value }
  function openCommandPalette() { commandPaletteOpen.value = true }
  function closeCommandPalette() { commandPaletteOpen.value = false }
  function toggleSidebar() { sidebarCollapsed.value = !sidebarCollapsed.value }

  return {
    notificationsOpen, workspaceSwitcherOpen, commandPaletteOpen, sidebarCollapsed,
    toggleNotifications, toggleWorkspaceSwitcher, openCommandPalette, closeCommandPalette, toggleSidebar,
  }
})
