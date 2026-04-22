<script setup lang="ts">
import { ref } from 'vue'
import { Moon, Sun } from 'lucide-vue-next'

const isDark = ref(false)

function toggleTheme() {
  isDark.value = !isDark.value
  document.documentElement.classList.toggle('dark', isDark.value)
}
</script>

<template>
  <header class="flex h-14 items-center justify-between border-b bg-background px-4">
    <div class="flex items-center gap-2">
      <span class="text-sm text-muted-foreground">Workspace</span>
      <span class="text-sm font-medium">Production</span>
    </div>

    <button
      aria-label="Toggle theme"
      class="rounded-md p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      @click="toggleTheme"
    >
      <Moon v-if="!isDark" class="h-4 w-4" />
      <Sun v-else class="h-4 w-4" />
    </button>
  </header>
</template>
