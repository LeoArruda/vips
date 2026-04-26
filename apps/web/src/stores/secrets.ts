import { defineStore } from 'pinia'
import { ref } from 'vue'
import { api } from '@/lib/api'

export interface SecretRecord {
  id: string
  name: string
  created_at: string
}

export const useSecretsStore = defineStore('secrets', () => {
  const secrets = ref<SecretRecord[]>([])
  const loading = ref(false)

  async function fetchAll() {
    loading.value = true
    try {
      secrets.value = (await api.get<SecretRecord[]>('/secrets')) ?? []
    } finally {
      loading.value = false
    }
  }

  async function create(name: string, value: string): Promise<SecretRecord> {
    const data = await api.post<SecretRecord>('/secrets', { name, value })
    if (!data) throw new Error('Create secret returned no data')
    secrets.value.unshift(data)
    return data
  }

  async function remove(id: string) {
    await api.delete(`/secrets/${id}`)
    secrets.value = secrets.value.filter((s) => s.id !== id)
  }

  return { secrets, loading, fetchAll, create, remove }
})
