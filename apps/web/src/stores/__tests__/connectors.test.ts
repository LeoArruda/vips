import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useConnectorsStore } from '../connectors'

vi.mock('@/lib/api', () => ({
  api: {
    get: vi.fn().mockResolvedValue([
      { id: 'c1', type: 'http-rest', name: 'My HTTP', config: {}, created_at: '2026-01-01' },
    ]),
    post: vi.fn().mockResolvedValue(
      { id: 'c2', type: 'postgres', name: 'My DB', config: {}, created_at: '2026-01-02' }
    ),
    delete: vi.fn().mockResolvedValue(undefined),
  },
}))

describe('useConnectorsStore (API-backed)', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('fetchAll loads connectors from API', async () => {
    const store = useConnectorsStore()
    await store.fetchAll()
    expect(store.connectors.length).toBe(1)
    expect(store.connectors[0].id).toBe('c1')
  })

  it('create adds connector to list', async () => {
    const store = useConnectorsStore()
    const result = await store.create({ type: 'postgres', name: 'My DB' })
    expect(result.id).toBe('c2')
    expect(store.connectors.length).toBe(1)
  })

  it('remove deletes connector from list', async () => {
    const store = useConnectorsStore()
    store.connectors = [{ id: 'c1', type: 'http-rest', name: 'My HTTP', config: {}, created_at: '' }]
    await store.remove('c1')
    expect(store.connectors.length).toBe(0)
  })
})
