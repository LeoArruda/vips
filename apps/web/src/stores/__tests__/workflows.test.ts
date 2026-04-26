import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useWorkflowsStore } from '../workflows'

vi.mock('@/lib/api', () => ({
  api: {
    get: vi.fn().mockResolvedValue([
      {
        id: 'wf_1',
        name: 'Test Flow',
        status: 'draft',
        updated_at: new Date().toISOString(),
        definition: { trigger: { type: 'manual' } },
      },
    ]),
    post: vi.fn().mockResolvedValue({
      workflowId: 'wf_new',
      name: 'New Flow',
      status: 'draft',
      updatedAt: new Date().toISOString(),
      trigger: { type: 'manual' },
    }),
    put: vi.fn().mockResolvedValue({
      workflowId: 'wf_1',
      name: 'Updated Flow',
      status: 'published',
      updatedAt: new Date().toISOString(),
      trigger: { type: 'manual' },
    }),
    delete: vi.fn().mockResolvedValue(undefined),
  },
}))

describe('useWorkflowsStore (API-backed)', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('fetchAll loads and maps summaries from API', async () => {
    const store = useWorkflowsStore()
    await store.fetchAll()
    expect(store.summaries.length).toBe(1)
    expect(store.summaries[0].workflowId).toBe('wf_1')
    expect(store.summaries[0].name).toBe('Test Flow')
    expect(store.summaries[0].trigger.type).toBe('manual')
  })

  it('create adds new workflow to summaries', async () => {
    const store = useWorkflowsStore()
    const result = await store.create({ name: 'New Flow', trigger: { type: 'manual' } })
    expect(result.name).toBe('New Flow')
    expect(store.summaries.length).toBe(1)
  })

  it('remove deletes from summaries', async () => {
    const store = useWorkflowsStore()
    store.summaries = [{ workflowId: 'wf_1', name: 'Flow', status: 'draft', updatedAt: '', trigger: { type: 'manual' } }]
    await store.remove('wf_1')
    expect(store.summaries.length).toBe(0)
  })

  it('publishedCount counts only published workflows', () => {
    const store = useWorkflowsStore()
    store.summaries = [
      { workflowId: 'a', name: 'A', status: 'published', updatedAt: '', trigger: { type: 'manual' } },
      { workflowId: 'b', name: 'B', status: 'draft', updatedAt: '', trigger: { type: 'manual' } },
    ]
    expect(store.publishedCount).toBe(1)
  })
})
