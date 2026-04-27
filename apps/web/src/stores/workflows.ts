import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { api } from '@/lib/api'
import type { WorkflowSummary, WorkflowDefinition, CreateWorkflowRequest, UpdateWorkflowRequest } from '@vipsos/workflow-schema'

// The API returns Postgres snake_case rows; map to frontend camelCase shape
function mapRow(row: Record<string, unknown>): WorkflowSummary {
  return {
    workflowId: row.id as string,
    name: row.name as string,
    status: row.status as WorkflowSummary['status'],
    lastRunAt: row.last_run_at as string | undefined,
    lastRunStatus: row.last_run_status as WorkflowSummary['lastRunStatus'],
    updatedAt: row.updated_at as string,
    trigger: (row.definition as { trigger: WorkflowSummary['trigger'] })?.trigger ?? { type: 'manual' },
  }
}

export const useWorkflowsStore = defineStore('workflows', () => {
  const summaries = ref<WorkflowSummary[]>([])
  const definitions = ref<Map<string, WorkflowDefinition>>(new Map())
  const loading = ref(false)
  const error = ref<string | null>(null)

  const publishedCount = computed(
    () => summaries.value.filter((w) => w.status === 'published').length,
  )

  async function fetchAll() {
    loading.value = true
    error.value = null
    try {
      const data = await api.get<Record<string, unknown>[]>('/workflows')
      summaries.value = (data ?? []).map(mapRow)
    } catch (e: unknown) {
      error.value = e instanceof Error ? e.message : 'Failed to load workflows'
    } finally {
      loading.value = false
    }
  }

  async function fetchDefinition(workflowId: string): Promise<WorkflowDefinition | undefined> {
    try {
      // The API returns the raw Postgres row: { id, name, status, version, definition: { trigger, nodes, edges }, ... }
      // The workflow graph is nested inside row.definition (a JSONB column).
      const row = await api.get<Record<string, unknown>>(`/workflows/${workflowId}`)
      if (!row) return undefined

      const inner = (row.definition ?? {}) as {
        trigger?: WorkflowDefinition['trigger']
        nodes?: WorkflowDefinition['nodes']
        edges?: WorkflowDefinition['edges']
      }

      const def: WorkflowDefinition = {
        workflowId: row.id as string,
        name: row.name as string,
        status: row.status as WorkflowDefinition['status'],
        version: (row.version as number) ?? 1,
        trigger: inner.trigger ?? { type: 'manual' },
        nodes: inner.nodes ?? [],
        edges: inner.edges ?? [],
      }

      definitions.value.set(workflowId, def)
      return def
    } catch {
      return undefined
    }
  }

  async function create(payload: CreateWorkflowRequest): Promise<WorkflowSummary> {
    const raw = await api.post<Record<string, unknown>>('/workflows', payload)
    if (!raw) throw new Error('Create workflow returned no data')
    const summary = mapRow(raw)
    summaries.value.unshift(summary)
    return summary
  }

  async function update(workflowId: string, payload: UpdateWorkflowRequest): Promise<WorkflowSummary> {
    const data = await api.put<WorkflowSummary>(`/workflows/${workflowId}`, payload)
    if (!data) throw new Error('Update workflow returned no data')
    const idx = summaries.value.findIndex((w) => w.workflowId === workflowId)
    if (idx !== -1) summaries.value[idx] = data
    return data
  }

  async function remove(workflowId: string) {
    await api.delete(`/workflows/${workflowId}`)
    summaries.value = summaries.value.filter((w) => w.workflowId !== workflowId)
    definitions.value.delete(workflowId)
  }

  function getDefinition(workflowId: string): WorkflowDefinition | undefined {
    return definitions.value.get(workflowId)
  }

  function getSummary(workflowId: string): WorkflowSummary | undefined {
    return summaries.value.find((s) => s.workflowId === workflowId)
  }

  return {
    summaries, definitions, loading, error, publishedCount,
    fetchAll, fetchDefinition, create, update, remove,
    getDefinition, getSummary,
  }
})
