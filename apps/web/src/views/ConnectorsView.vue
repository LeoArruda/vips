<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useConnectorsStore } from '@/stores/connectors'
import ConnectorCard from '@/components/connectors/ConnectorCard.vue'
import { Search, AlertTriangle } from 'lucide-vue-next'

const router = useRouter()
const store = useConnectorsStore()

const searchQuery = ref('')
const selectedCategory = ref('')

const categories = ['', 'database', 'saas', 'storage', 'messaging', 'analytics']
const categoryLabels: Record<string, string> = {
  '': 'All',
  database: 'Database',
  saas: 'SaaS',
  storage: 'Storage',
  messaging: 'Messaging',
  analytics: 'Analytics',
}

const filteredConnectors = computed(() => {
  let result = store.filterByCategory(selectedCategory.value)
  if (searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase()
    result = result.filter(
      (c) => c.name.toLowerCase().includes(q) || c.description.toLowerCase().includes(q),
    )
  }
  return result
})
</script>

<template>
  <div class="h-full overflow-y-auto p-[18px]">
    <div class="mb-5">
      <h1 class="text-[15px] font-semibold tracking-tight">Connectors</h1>
      <p class="mt-1 text-[11.5px] text-muted-foreground">
        {{ store.cards.length }} connectors · {{ store.installedCount }} installed
      </p>
    </div>

    <!-- Expired auth warning -->
    <div class="mb-4 flex items-center gap-3 rounded-[7px] border border-amber-200 bg-amber-50 px-3 py-[7px] text-[11.5px] text-amber-800">
      <AlertTriangle class="h-4 w-4 shrink-0" />
      <span><strong>Salesforce OAuth token</strong> has expired. Your workflows using this connector may fail.</span>
      <button class="ml-auto rounded-md border border-amber-300 bg-amber-100 px-3 py-1 text-xs font-medium hover:bg-amber-200">
        Reconnect
      </button>
    </div>

    <!-- Search + filter -->
    <div class="mb-4 flex flex-wrap items-center gap-3">
      <div class="relative min-w-48 flex-1">
        <Search class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search connectors…"
          class="w-full rounded-[5px] border bg-background py-2 pl-9 pr-3 text-[11.5px] outline-none focus:ring-2 focus:ring-primary/20"
        />
      </div>
      <div class="flex flex-wrap gap-1.5">
        <button
          v-for="cat in categories"
          :key="cat"
          class="rounded-full px-3 py-1 text-[10.5px] font-medium transition-colors"
          :class="
            selectedCategory === cat
              ? 'bg-primary text-primary-foreground'
              : 'border hover:bg-muted'
          "
          @click="selectedCategory = cat"
        >
          {{ categoryLabels[cat] }}
        </button>
      </div>
    </div>

    <!-- Empty state -->
    <div v-if="filteredConnectors.length === 0" class="py-12 text-center text-muted-foreground">
      <p class="text-[11.5px]">No connectors match your search.</p>
    </div>

    <!-- Card grid -->
    <div
      v-else
      class="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
    >
      <div
        v-for="connector in filteredConnectors"
        :key="connector.connectorId"
        class="cursor-pointer"
        @click="router.push(`/connectors/${connector.connectorId}`)"
      >
        <ConnectorCard :connector="connector" />
      </div>
    </div>
  </div>
</template>
