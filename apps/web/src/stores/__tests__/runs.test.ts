import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useRunsStore } from '../runs'

describe('useRunsStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('exposes run records from stub data', () => {
    const store = useRunsStore()
    expect(store.records.length).toBeGreaterThan(0)
  })

  it('returns a run detail by id', () => {
    const store = useRunsStore()
    const detail = store.getDetail('run_002')
    expect(detail).toBeDefined()
    expect(detail?.nodes.length).toBeGreaterThan(0)
  })

  it('returns undefined for an unknown run id', () => {
    const store = useRunsStore()
    expect(store.getDetail('nonexistent')).toBeUndefined()
  })

  it('returns runs filtered by workflow id', () => {
    const store = useRunsStore()
    const runs = store.getByWorkflow('wf_002')
    expect(runs.length).toBeGreaterThan(0)
    expect(runs.every((r) => r.workflowId === 'wf_002')).toBe(true)
  })

  it('returns empty array when no runs match the workflow id', () => {
    const store = useRunsStore()
    expect(store.getByWorkflow('nonexistent').length).toBe(0)
  })
})
