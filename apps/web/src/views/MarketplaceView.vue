<script setup lang="ts">
import { ref, computed } from 'vue'
import { useMarketplaceStore } from '@/stores/marketplace'
import { useRouter } from 'vue-router'
import MarketplaceCard from '@/components/marketplace/MarketplaceCard.vue'
import type { MarketplaceCategory } from '@/types/operations'

const store = useMarketplaceStore()
const router = useRouter()

const activeTab = ref<'connector' | 'template' | 'publisher'>('connector')
const search = ref('')
const selectedCategory = ref<MarketplaceCategory | 'All'>('All')
const selectedPricing = ref<'all' | 'free' | 'per-use' | 'subscription'>('all')

const categories: (MarketplaceCategory | 'All')[] = [
  'All', 'CRM', 'Databases', 'Cloud Storage', 'Marketing', 'Finance', 'Analytics', 'Communication'
]

const filtered = computed(() => {
  const type = activeTab.value === 'publisher' ? 'connector' : activeTab.value
  return store.byType(type).filter(l => {
    const matchSearch = !search.value ||
      l.name.toLowerCase().includes(search.value.toLowerCase()) ||
      l.description.toLowerCase().includes(search.value.toLowerCase()) ||
      l.publisher.toLowerCase().includes(search.value.toLowerCase())
    const matchCategory = selectedCategory.value === 'All' || l.category === selectedCategory.value
    const matchPricing = selectedPricing.value === 'all' || l.pricing === selectedPricing.value
    return matchSearch && matchCategory && matchPricing
  })
})

function goToListing(listingId: string) {
  router.push(`/marketplace/${listingId}`)
}
</script>

<template>
  <div class="flex h-full flex-col overflow-auto">
    <div class="border-b px-[18px] py-[11px]">
      <h1 class="text-[15px] font-semibold tracking-tight">Marketplace</h1>
      <p class="mt-0.5 text-[11.5px] text-muted-foreground">Certified connectors and workflow templates</p>
    </div>

    <!-- Tabs -->
    <div class="border-b px-[18px]">
      <div class="flex gap-1">
        <button v-for="[key, label] in [['connector', 'Connectors'], ['template', 'Templates'], ['publisher', 'Publisher Portal']]"
          :key="key"
          class="px-4 py-3 text-sm font-medium border-b-2 transition-colors"
          :class="activeTab === key ? 'border-foreground text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground'"
          @click="activeTab = key as typeof activeTab">
          {{ label }}
        </button>
      </div>
    </div>

    <div class="flex-1 overflow-y-auto p-[18px]">
      <!-- Publisher portal placeholder -->
      <div v-if="activeTab === 'publisher'" class="max-w-lg">
        <h2 class="text-lg font-semibold mb-2">Publisher Portal</h2>
        <p class="text-[11.5px] text-muted-foreground mb-4">Manage your listings, track revenue, and submit for certification.</p>
        <button class="rounded-[5px] bg-indigo-500 px-4 py-2 text-[11.5px] font-medium text-white hover:bg-indigo-600">
          Submit new listing
        </button>
      </div>

      <template v-else>
        <!-- Search + filters -->
        <div class="mb-5 space-y-3">
          <div class="flex gap-3">
            <input v-model="search" placeholder="Search marketplace…"
              class="flex-1 max-w-sm rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" />
            <select v-model="selectedPricing"
              class="rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring">
              <option value="all">All pricing</option>
              <option value="free">Free</option>
              <option value="per-use">Per use</option>
              <option value="subscription">Subscription</option>
            </select>
          </div>
          <div class="flex gap-2 flex-wrap">
            <button v-for="cat in categories" :key="cat"
              class="rounded-full px-3 py-1 text-[11.5px] font-medium transition-colors"
              :class="selectedCategory === cat ? 'bg-indigo-500 text-white' : 'border hover:bg-muted'"
              @click="selectedCategory = cat">
              {{ cat }}
            </button>
          </div>
        </div>

        <!-- Card grid -->
        <div v-if="filtered.length > 0" class="grid grid-cols-3 gap-2">
          <MarketplaceCard v-for="listing in filtered" :key="listing.listingId"
            :listing="listing" @click="goToListing(listing.listingId)" />
        </div>
        <div v-else class="py-12 text-center text-sm text-muted-foreground">
          No listings found for "{{ search }}"
        </div>
      </template>
    </div>
  </div>
</template>
