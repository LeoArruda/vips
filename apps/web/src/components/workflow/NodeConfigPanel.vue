<script setup lang="ts">
import { computed } from 'vue'
import { X } from 'lucide-vue-next'
import { useBuilderStore } from '@/stores/builder'

const store = useBuilderStore()

const node = computed(() => store.selectedNode)

const typeLabel: Record<string, string> = {
  'connector.source': 'Source',
  'connector.destination': 'Destination',
  'transform.map': 'Transform',
  'logic.branch': 'Branch',
  trigger: 'Trigger',
}

const typeBadgeColor: Record<string, string> = {
  'connector.source': 'bg-blue-100 text-blue-700',
  'connector.destination': 'bg-emerald-100 text-emerald-700',
  'transform.map': 'bg-purple-100 text-purple-700',
  'logic.branch': 'bg-amber-100 text-amber-700',
  trigger: 'bg-blue-100 text-blue-700',
}

const configEntries = computed(() => {
  if (!node.value) return []
  return Object.entries(node.value.data.config)
})
</script>

<template>
  <aside v-if="node" class="flex w-72 flex-shrink-0 flex-col border-l bg-background">
    <div class="flex items-center justify-between border-b px-4 py-3">
      <h2 class="text-sm font-semibold">Node Config</h2>
      <button
        class="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
        aria-label="Close panel"
        @click="store.clearSelection()"
      >
        <X class="h-4 w-4" />
      </button>
    </div>

    <div class="flex-1 overflow-y-auto p-4">
      <div class="mb-4">
        <span
          class="inline-block rounded-full px-2.5 py-0.5 text-xs font-medium"
          :class="typeBadgeColor[node.data.nodeType] ?? 'bg-muted text-muted-foreground'"
        >
          {{ typeLabel[node.data.nodeType] ?? node.data.nodeType }}
        </span>
        <h3 class="mt-2 text-base font-semibold">{{ node.data.label }}</h3>
        <p v-if="node.data.connectorId" class="mt-0.5 text-xs text-muted-foreground">
          Connector: {{ node.data.connectorId }}
        </p>
      </div>

      <div v-if="configEntries.length > 0">
        <h4 class="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Configuration
        </h4>
        <dl class="space-y-2">
          <div
            v-for="[key, value] in configEntries"
            :key="key"
            class="rounded-md border bg-muted/30 px-3 py-2"
          >
            <dt class="text-xs font-medium text-muted-foreground">{{ key }}</dt>
            <dd class="mt-0.5 break-all text-sm">
              {{ typeof value === 'object' ? JSON.stringify(value) : String(value) }}
            </dd>
          </div>
        </dl>
      </div>

      <p v-else class="text-sm text-muted-foreground">No configuration yet.</p>
    </div>
  </aside>
</template>
