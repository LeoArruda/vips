import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useShellStore = defineStore('shell', () => {
  const notificationsOpen = ref(false)
  const workspaceSwitcherOpen = ref(false)
  const commandPaletteOpen = ref(false)

  function toggleNotifications() { notificationsOpen.value = !notificationsOpen.value }
  function toggleWorkspaceSwitcher() { workspaceSwitcherOpen.value = !workspaceSwitcherOpen.value }
  function openCommandPalette() { commandPaletteOpen.value = true }
  function closeCommandPalette() { commandPaletteOpen.value = false }

  return { notificationsOpen, workspaceSwitcherOpen, commandPaletteOpen, toggleNotifications, toggleWorkspaceSwitcher, openCommandPalette, closeCommandPalette }
})
