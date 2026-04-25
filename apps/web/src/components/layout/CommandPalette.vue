<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useShellStore } from '@/stores/shell'
import { useRouter } from 'vue-router'
import { Search } from 'lucide-vue-next'

const shell = useShellStore()
const router = useRouter()
const query = ref('')

const commands = [
  { id: 'dashboard', label: 'Go to Dashboard', path: '/dashboard' },
  { id: 'workflows', label: 'Go to Workflows', path: '/workflows' },
  { id: 'connectors', label: 'Go to Connectors', path: '/connectors' },
  { id: 'runs', label: 'Go to Runs', path: '/runs' },
  { id: 'templates', label: 'Browse Templates', path: '/templates' },
  { id: 'secrets', label: 'Manage Secrets', path: '/secrets' },
  { id: 'monitoring', label: 'Open Monitoring', path: '/monitoring' },
  { id: 'marketplace', label: 'Browse Marketplace', path: '/marketplace' },
  { id: 'members', label: 'Manage Members', path: '/members' },
  { id: 'settings', label: 'Open Settings', path: '/settings' },
]

const filtered = computed(() =>
  query.value.trim()
    ? commands.filter(c => c.label.toLowerCase().includes(query.value.toLowerCase()))
    : commands
)

function select(path: string) {
  router.push(path)
  shell.closeCommandPalette()
  query.value = ''
}

function onKeydown(e: KeyboardEvent) {
  if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
    e.preventDefault()
    shell.openCommandPalette()
  }
  if (e.key === 'Escape') shell.closeCommandPalette()
}

onMounted(() => window.addEventListener('keydown', onKeydown))
onUnmounted(() => window.removeEventListener('keydown', onKeydown))
</script>

<template>
  <Teleport to="body">
    <div v-if="shell.commandPaletteOpen"
      class="fixed inset-0 z-50 flex items-start justify-center bg-black/50 pt-[20vh]"
      @click="shell.closeCommandPalette()">
      <div class="w-full max-w-md overflow-hidden rounded-xl border bg-background shadow-2xl" @click.stop>
        <div class="flex items-center gap-3 border-b px-4 py-3">
          <Search class="h-4 w-4 shrink-0 text-muted-foreground" />
          <input v-model="query" placeholder="Search or type a command…" autofocus
            class="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground" />
          <kbd class="rounded border px-1.5 py-0.5 text-xs text-muted-foreground">ESC</kbd>
        </div>
        <div class="max-h-64 overflow-y-auto py-1">
          <button v-for="cmd in filtered" :key="cmd.id"
            class="flex w-full items-center gap-3 px-4 py-2.5 text-sm hover:bg-muted"
            @click="select(cmd.path)">
            {{ cmd.label }}
          </button>
          <p v-if="filtered.length === 0" class="px-4 py-3 text-sm text-muted-foreground">
            No results for "{{ query }}"
          </p>
        </div>
      </div>
    </div>
  </Teleport>
</template>
