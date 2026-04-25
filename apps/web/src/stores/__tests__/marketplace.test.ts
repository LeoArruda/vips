import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useMarketplaceStore } from '../marketplace'

describe('useMarketplaceStore', () => {
  beforeEach(() => { setActivePinia(createPinia()) })

  it('loads stub listings', () => {
    const store = useMarketplaceStore()
    expect(store.listings.length).toBeGreaterThan(0)
  })

  it('filters connectors only', () => {
    const store = useMarketplaceStore()
    const connectors = store.byType('connector')
    expect(connectors.every(l => l.type === 'connector')).toBe(true)
  })

  it('finds listing by id', () => {
    const store = useMarketplaceStore()
    expect(store.findById('ml_001')?.name).toBe('Salesforce CRM')
  })
})
