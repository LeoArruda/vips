import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useWorkflowsStore } from '../workflows'

describe('useWorkflowsStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('exposes workflow summaries from stub data', () => {
    const store = useWorkflowsStore()
    expect(store.summaries.length).toBeGreaterThan(0)
  })

  it('counts published workflows via computed', () => {
    const store = useWorkflowsStore()
    const expected = store.summaries.filter((w) => w.status === 'published').length
    expect(store.publishedCount).toBe(expected)
  })

  it('finds a workflow definition by id', () => {
    const store = useWorkflowsStore()
    const def = store.getDefinition('wf_001')
    expect(def).toBeDefined()
    expect(def?.workflowId).toBe('wf_001')
    expect(def?.nodes.length).toBeGreaterThan(0)
    expect(def?.edges.length).toBeGreaterThan(0)
  })

  it('returns undefined for an unknown workflow id', () => {
    const store = useWorkflowsStore()
    expect(store.getDefinition('nonexistent')).toBeUndefined()
  })

  it('finds a workflow summary by id', () => {
    const store = useWorkflowsStore()
    const summary = store.getSummary('wf_001')
    expect(summary?.name).toBe('Salesforce → BigQuery Sync')
  })

  it('returns undefined summary for an unknown id', () => {
    const store = useWorkflowsStore()
    expect(store.getSummary('nonexistent')).toBeUndefined()
  })
})
