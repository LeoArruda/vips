<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useMarketplaceStore } from '@/stores/marketplace'
import { ArrowLeft } from 'lucide-vue-next'

const route = useRoute()
const router = useRouter()
const store = useMarketplaceStore()
const logoError = ref(false)

const listing = computed(() => store.findById(route.params.id as string))
const logoUrl = computed(() => listing.value ? `https://logo.clearbit.com/${listing.value.domain}` : '')

function avatarColor(domain: string): string {
  const colors = ['bg-blue-500', 'bg-purple-500', 'bg-green-500', 'bg-amber-500']
  return colors[domain.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % colors.length]
}
</script>

<template>
  <div class="flex h-full flex-col overflow-auto">
    <div class="border-b px-6 py-4">
      <button class="mb-3 flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        @click="router.back()">
        <ArrowLeft class="h-4 w-4" /> Back to Marketplace
      </button>
      <div v-if="listing" class="flex items-center gap-4">
        <div class="h-12 w-12 rounded-xl overflow-hidden shrink-0">
          <img v-if="!logoError" :src="logoUrl" :alt="listing.name"
            class="h-full w-full object-contain" @error="logoError = true" />
          <div v-else class="h-full w-full flex items-center justify-center text-white text-sm font-bold"
            :class="avatarColor(listing.domain)">
            {{ listing.name.substring(0, 2).toUpperCase() }}
          </div>
        </div>
        <div>
          <h1 class="text-xl font-semibold">{{ listing.name }}</h1>
          <p class="text-sm text-muted-foreground">{{ listing.publisher }} · {{ listing.category }}</p>
        </div>
        <div class="ml-auto flex gap-2">
          <button class="rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted">View docs</button>
          <button class="rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background hover:bg-foreground/90">
            {{ listing.type === 'connector' ? 'Install' : 'Use template' }}
          </button>
        </div>
      </div>
    </div>

    <div v-if="listing" class="flex-1 overflow-y-auto p-6">
      <div class="grid grid-cols-3 gap-6">
        <div class="col-span-2 space-y-5">
          <div class="rounded-lg border p-5">
            <h2 class="mb-2 font-semibold">Overview</h2>
            <p class="text-sm text-muted-foreground">{{ listing.description }}</p>
          </div>
          <div class="rounded-lg border p-5">
            <h2 class="mb-3 font-semibold">Screenshots</h2>
            <div class="grid grid-cols-2 gap-3">
              <div v-for="i in 2" :key="i"
                class="h-32 rounded-md bg-muted flex items-center justify-center text-xs text-muted-foreground">
                Screenshot {{ i }}
              </div>
            </div>
          </div>
        </div>
        <div class="space-y-4">
          <div class="rounded-lg border p-4">
            <p class="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Pricing</p>
            <p class="text-lg font-bold"
              :class="listing.pricing === 'free' ? 'text-green-600' : 'text-foreground'">
              {{ listing.priceLabel }}
            </p>
          </div>
          <div class="rounded-lg border p-4 space-y-2 text-sm">
            <div class="flex justify-between">
              <span class="text-muted-foreground">Certification</span>
              <span class="capitalize">{{ listing.certification }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-muted-foreground">Installs</span>
              <span>{{ listing.installs.toLocaleString() }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-muted-foreground">Publisher</span>
              <span>{{ listing.publisher }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-else class="flex-1 flex items-center justify-center text-muted-foreground">
      Listing not found.
    </div>
  </div>
</template>
