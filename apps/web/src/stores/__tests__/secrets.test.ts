import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useSecretsStore } from '../secrets'

vi.mock('@/lib/api', () => ({
  api: {
    get: vi.fn().mockResolvedValue([
      { id: 's1', name: 'API_KEY', created_at: '2026-01-01' },
    ]),
    post: vi.fn().mockResolvedValue(
      { id: 's2', name: 'DB_PASS', created_at: '2026-01-02' }
    ),
    delete: vi.fn().mockResolvedValue(undefined),
  },
}))

describe('useSecretsStore (API-backed)', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('fetchAll loads secrets from API (names only)', async () => {
    const store = useSecretsStore()
    await store.fetchAll()
    expect(store.secrets.length).toBe(1)
    expect(store.secrets[0].name).toBe('API_KEY')
  })

  it('create adds secret to list', async () => {
    const store = useSecretsStore()
    const result = await store.create('DB_PASS', 'secret123')
    expect(result.id).toBe('s2')
    expect(store.secrets.length).toBe(1)
  })

  it('remove deletes secret from list', async () => {
    const store = useSecretsStore()
    store.secrets = [{ id: 's1', name: 'API_KEY', created_at: '' }]
    await store.remove('s1')
    expect(store.secrets.length).toBe(0)
  })
})
