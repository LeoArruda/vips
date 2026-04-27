import { describe, it, expect } from 'bun:test'
import { executeRun } from '../executor/runner.ts'
import type { WorkflowDefinition } from '@vipsos/workflow-schema'
import type { RunContext } from '../executor/runner.ts'

function makeDefinition(nodes: WorkflowDefinition['nodes'], edges: WorkflowDefinition['edges'] = []): WorkflowDefinition {
  return {
    workflowId: 'wf-test',
    version: 1,
    status: 'published',
    name: 'Test Workflow',
    trigger: { type: 'manual' },
    nodes,
    edges,
  }
}

function makeContext(overrides?: Partial<RunContext>) {
  const logs: Array<{ nodeId: string | null; level: string; message: string }> = []
  const patches: Array<{ status: string; finished_at?: string }> = []

  const ctx: RunContext = {
    runId: 'run-1',
    postLog: async (nodeId, level, message) => { logs.push({ nodeId, level, message }) },
    patchRun: async (fields) => { patches.push(fields) },
    ...overrides,
  }

  return { ctx, logs, patches }
}

describe('executeRun', () => {
  it('patches running then success for a workflow with no executable nodes', async () => {
    const { ctx, patches } = makeContext()
    await executeRun(makeDefinition([{ id: 't1', type: 'trigger', label: 'Start', config: {} }]), ctx)
    expect(patches[0].status).toBe('running')
    expect(patches[patches.length - 1].status).toBe('success')
    expect(patches[patches.length - 1].finished_at).toBeTruthy()
  })

  it('patches failed and stops when a node has no connectorType', async () => {
    const { ctx, patches, logs } = makeContext()
    const def = makeDefinition([
      { id: 'n1', type: 'connector.source', label: 'Broken Node', config: {} },
    ])
    await executeRun(def, ctx)
    expect(patches[0].status).toBe('running')
    const failPatch = patches.find((p) => p.status === 'failed')
    expect(failPatch).toBeTruthy()
    expect(failPatch?.finished_at).toBeTruthy()
    const errorLog = logs.find((l) => l.level === 'error')
    expect(errorLog?.message).toContain('connectorType')
  })

  it('stops executing remaining nodes after a node fails', async () => {
    const { ctx, patches, logs } = makeContext()
    const def = makeDefinition([
      { id: 'n1', type: 'connector.source', label: 'Will Fail', config: {} },
      { id: 'n2', type: 'connector.source', label: 'Should Not Run', config: { connectorType: 'http-rest', url: 'http://localhost:1' } },
    ], [{ id: 'e1', source: 'n1', target: 'n2' }])

    await executeRun(def, ctx)

    const successCount = patches.filter((p) => p.status === 'success').length
    expect(successCount).toBe(0)
    expect(patches.find((p) => p.status === 'failed')).toBeTruthy()

    const n2Log = logs.find((l) => l.nodeId === 'n2' && l.message.includes('Starting'))
    expect(n2Log).toBeUndefined()
  })
})
