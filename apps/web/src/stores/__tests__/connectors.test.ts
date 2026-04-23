import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useConnectorsStore } from '../connectors'

describe('useConnectorsStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('exposes connector cards from stub data', () => {
    const store = useConnectorsStore()
    expect(store.cards.length).toBeGreaterThan(0)
  })

  it('counts installed connectors via computed', () => {
    const store = useConnectorsStore()
    const expected = store.cards.filter((c) => c.installed).length
    expect(store.installedCount).toBe(expected)
  })

  it('returns a connector detail by id', () => {
    const store = useConnectorsStore()
    const detail = store.getDetail('conn_salesforce')
    expect(detail).toBeDefined()
    expect(detail?.actions.length).toBeGreaterThan(0)
  })

  it('returns undefined for an unknown connector id', () => {
    const store = useConnectorsStore()
    expect(store.getDetail('nonexistent')).toBeUndefined()
  })

  it('filters connectors by category', () => {
    const store = useConnectorsStore()
    const databases = store.filterByCategory('database')
    expect(databases.length).toBeGreaterThan(0)
    expect(databases.every((c) => c.category === 'database')).toBe(true)
  })

  it('returns all connectors when category is empty string', () => {
    const store = useConnectorsStore()
    expect(store.filterByCategory('').length).toBe(store.cards.length)
  })

  it('searches connectors by name case-insensitively', () => {
    const store = useConnectorsStore()
    expect(store.search('SALESFORCE').length).toBeGreaterThan(0)
    expect(store.search('salesforce')[0].name).toBe('Salesforce')
  })

  it('searches connectors by description', () => {
    const store = useConnectorsStore()
    const results = store.search('payment')
    expect(results.some((c) => c.name === 'Stripe')).toBe(true)
  })

  it('returns empty array for no search match', () => {
    const store = useConnectorsStore()
    expect(store.search('zzznomatch999').length).toBe(0)
  })
})
