import { defineStore } from 'pinia'
import { ref } from 'vue'
import { stubListings } from '@/data/marketplace'
import type { MarketplaceListing } from '@/types/operations'

export const useMarketplaceStore = defineStore('marketplace', () => {
  const listings = ref<MarketplaceListing[]>(stubListings)
  function byType(type: 'connector' | 'template') {
    return listings.value.filter(l => l.type === type)
  }
  function findById(listingId: string): MarketplaceListing | undefined {
    return listings.value.find(l => l.listingId === listingId)
  }
  return { listings, byType, findById }
})
