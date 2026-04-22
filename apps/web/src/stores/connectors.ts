import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { connectorCards, connectorDetails } from '@/data/connectors'
import type { ConnectorCard, ConnectorDetail } from '@/types'

export const useConnectorsStore = defineStore('connectors', () => {
  const cards = ref<ConnectorCard[]>(connectorCards)
  const details = ref<ConnectorDetail[]>(connectorDetails)

  const installedCount = computed(() => cards.value.filter((c) => c.installed).length)

  function getDetail(connectorId: string): ConnectorDetail | undefined {
    return details.value.find((d) => d.connectorId === connectorId)
  }

  function filterByCategory(category: string): ConnectorCard[] {
    if (!category) return cards.value
    return cards.value.filter((c) => c.category === category)
  }

  function search(query: string): ConnectorCard[] {
    const q = query.toLowerCase()
    return cards.value.filter(
      (c) => c.name.toLowerCase().includes(q) || c.description.toLowerCase().includes(q),
    )
  }

  return { cards, details, installedCount, getDetail, filterByCategory, search }
})
