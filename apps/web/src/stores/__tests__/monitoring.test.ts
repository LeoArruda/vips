import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useMonitoringStore } from '../monitoring'

describe('useMonitoringStore', () => {
  beforeEach(() => { setActivePinia(createPinia()) })

  it('exposes monitoring stats', () => {
    const store = useMonitoringStore()
    expect(store.stats.activeRuns).toBeGreaterThan(0)
  })

  it('exposes live run feed', () => {
    const store = useMonitoringStore()
    expect(store.liveRuns.length).toBeGreaterThan(0)
  })

  it('counts degraded workers', () => {
    const store = useMonitoringStore()
    const expected = store.stats.workers.filter(w => w.health !== 'healthy').length
    expect(store.degradedWorkerCount).toBe(expected)
  })
})
