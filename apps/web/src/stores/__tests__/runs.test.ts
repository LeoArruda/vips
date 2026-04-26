import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useRunsStore } from '../runs'

vi.mock('@/lib/api', () => ({
  api: {
    get: vi.fn().mockResolvedValue([
      { id: 'r1', workflow_id: 'wf1', status: 'success', triggered_by: 'manual', started_at: '2026-01-01' },
    ]),
    post: vi.fn().mockResolvedValue(
      { id: 'r2', workflow_id: 'wf1', status: 'queued', triggered_by: 'manual', started_at: '2026-01-02' }
    ),
  },
}))

describe('useRunsStore (API-backed)', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('fetchAll loads runs from API', async () => {
    const store = useRunsStore()
    await store.fetchAll()
    expect(store.runs.length).toBe(1)
    expect(store.runs[0].id).toBe('r1')
  })

  it('triggerRun adds run to list', async () => {
    const store = useRunsStore()
    const result = await store.triggerRun('wf1')
    expect(result.status).toBe('queued')
    expect(store.runs.length).toBe(1)
  })
})
