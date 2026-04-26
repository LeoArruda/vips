import { defineStore } from 'pinia'
import { ref } from 'vue'
import { api } from '@/lib/api'

export interface ConnectorRecord {
  id: string
  type: string
  name: string
  config: Record<string, unknown>
  created_at: string
}

export const useConnectorsStore = defineStore('connectors', () => {
  const connectors = ref<ConnectorRecord[]>([])
  const loading = ref(false)

  async function fetchAll() {
    loading.value = true
    try {
      connectors.value = (await api.get<ConnectorRecord[]>('/connectors')) ?? []
    } finally {
      loading.value = false
    }
  }

  async function create(payload: { type: string; name: string; config?: Record<string, unknown> }) {
    const data = await api.post<ConnectorRecord>('/connectors', payload)
    if (!data) throw new Error('Create connector returned no data')
    connectors.value.unshift(data)
    return data
  }

  async function remove(id: string) {
    await api.delete(`/connectors/${id}`)
    connectors.value = connectors.value.filter((c) => c.id !== id)
  }

  return { connectors, loading, fetchAll, create, remove }
})
