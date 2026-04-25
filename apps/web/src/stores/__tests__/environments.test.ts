import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useEnvironmentsStore } from '../environments'

describe('useEnvironmentsStore', () => {
  beforeEach(() => { setActivePinia(createPinia()) })

  it('loads stub environments', () => {
    const store = useEnvironmentsStore()
    expect(store.environments.length).toBeGreaterThan(0)
  })

  it('finds environment by id', () => {
    const store = useEnvironmentsStore()
    expect(store.findById('env_001')?.name).toBe('Cloud (default)')
  })

  it('returns undefined for unknown id', () => {
    const store = useEnvironmentsStore()
    expect(store.findById('nonexistent')).toBeUndefined()
  })
})
