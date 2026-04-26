import { defineStore } from 'pinia'
import { ref } from 'vue'
import { api } from '@/lib/api'

export interface RunRecord {
  id: string
  workflow_id: string
  status: 'queued' | 'running' | 'success' | 'failed'
  triggered_by: string
  started_at: string
  finished_at?: string
}

export interface RunDetail extends RunRecord {
  logs: Array<{ id: string; node_id?: string; level: string; message: string; created_at: string }>
}

export const useRunsStore = defineStore('runs', () => {
  const runs = ref<RunRecord[]>([])
  const loading = ref(false)

  async function fetchAll() {
    loading.value = true
    try {
      runs.value = (await api.get<RunRecord[]>('/runs')) ?? []
    } finally {
      loading.value = false
    }
  }

  async function fetchDetail(runId: string): Promise<RunDetail | undefined> {
    return api.get<RunDetail>(`/runs/${runId}`)
  }

  async function triggerRun(workflowId: string): Promise<RunRecord> {
    const data = await api.post<RunRecord>('/runs', { workflowId, triggeredBy: 'manual' })
    if (!data) throw new Error('Trigger run returned no data')
    runs.value.unshift(data)
    return data
  }

  return { runs, loading, fetchAll, fetchDetail, triggerRun }
})
