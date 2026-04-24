import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useTriggersStore } from '../triggers'

describe('useTriggersStore', () => {
  beforeEach(() => { setActivePinia(createPinia()) })

  it('loads stub triggers', () => {
    const store = useTriggersStore()
    expect(store.triggers.length).toBeGreaterThan(0)
  })

  it('toggles enabled state', () => {
    const store = useTriggersStore()
    const initial = store.triggers[0].enabled
    store.toggle(store.triggers[0].triggerId)
    expect(store.triggers[0].enabled).toBe(!initial)
  })

  it('returns only enabled triggers', () => {
    const store = useTriggersStore()
    expect(store.enabled.every(t => t.enabled)).toBe(true)
  })
})
