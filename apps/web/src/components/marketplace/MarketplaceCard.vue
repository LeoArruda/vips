<script setup lang="ts">
import { ref } from 'vue'
import type { MarketplaceListing } from '@/types/operations'

const props = defineProps<{ listing: MarketplaceListing }>()
const emit = defineEmits<{ click: [] }>()

const logoError = ref(false)
const logoUrl = `https://logo.clearbit.com/${props.listing.domain}`

function avatarColor(domain: string): string {
  const colors = ['bg-blue-500', 'bg-purple-500', 'bg-green-500', 'bg-amber-500', 'bg-red-500', 'bg-pink-500']
  const idx = domain.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) % colors.length
  return colors[idx]
}

const certBadge: Record<string, string> = {
  certified: 'bg-purple-100 text-purple-700',
  community: 'bg-blue-100 text-blue-700',
  draft: 'bg-muted text-muted-foreground',
}
</script>

<template>
  <div class="cursor-pointer rounded-[7px] border p-[11px] hover:shadow-sm transition-shadow"
    @click="emit('click')">
    <div class="flex items-center gap-3 mb-3">
      <div class="h-9 w-9 flex-shrink-0 rounded-lg overflow-hidden">
        <img v-if="!logoError" :src="logoUrl" :alt="listing.name"
          class="h-full w-full object-contain"
          @error="logoError = true" />
        <div v-else class="h-full w-full flex items-center justify-center text-white text-xs font-bold"
          :class="avatarColor(listing.domain)">
          {{ listing.name.substring(0, 2).toUpperCase() }}
        </div>
      </div>
      <div class="flex-1 min-w-0">
        <p class="font-semibold text-sm leading-tight truncate">{{ listing.name }}</p>
        <p class="text-xs text-muted-foreground truncate">{{ listing.publisher }}</p>
      </div>
      <span class="rounded-full px-2 py-0.5 text-xs font-medium shrink-0"
        :class="certBadge[listing.certification]">
        {{ listing.certification }}
      </span>
    </div>
    <p class="text-xs text-muted-foreground line-clamp-2 mb-3">{{ listing.description }}</p>
    <div class="flex items-center justify-between">
      <span class="text-xs font-medium"
        :class="listing.pricing === 'free' ? 'text-green-600' : 'text-purple-600'">
        {{ listing.priceLabel }}
      </span>
      <button class="rounded-[5px] bg-indigo-500 px-2.5 py-1 text-xs font-medium text-white hover:bg-indigo-600"
        @click.stop>
        {{ listing.type === 'connector' ? 'Install' : 'Use' }}
      </button>
    </div>
  </div>
</template>
