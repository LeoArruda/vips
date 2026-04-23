import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useSecretsStore } from '../secrets'

describe('useSecretsStore', () => {
  beforeEach(() => { setActivePinia(createPinia()) })

  it('loads stub secrets', () => {
    const store = useSecretsStore()
    expect(store.secrets.length).toBeGreaterThan(0)
  })

  it('counts secrets needing rotation', () => {
    const store = useSecretsStore()
    const expected = store.secrets.filter(s => s.rotationState !== 'ok').length
    expect(store.rotationAlertCount).toBe(expected)
  })

  it('filters secrets by scope', () => {
    const store = useSecretsStore()
    const connectorSecrets = store.byScope('connector')
    expect(connectorSecrets.every(s => s.scope === 'connector')).toBe(true)
  })
})
