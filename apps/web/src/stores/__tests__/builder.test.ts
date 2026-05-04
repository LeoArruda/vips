import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useBuilderStore } from '../builder'
import { __updateMock as updateMock } from '../workflows'
import type { SchemaField } from '@/types'

// Stub definitions matching the previous hard-coded data
const stubDefinitions: Record<string, { nodes: unknown[]; edges: unknown[] }> = {
  wf_001: {
    nodes: [
      { id: 'source_1', type: 'connector.source', label: 'Salesforce', config: {}, connectorId: 'conn_sf' },
      { id: 'transform_1', type: 'transform.map', label: 'Map Fields', config: {} },
      { id: 'dest_1', type: 'connector.destination', label: 'BigQuery', config: {}, connectorId: 'conn_bq' },
    ],
    edges: [
      { id: 'e1', source: 'source_1', target: 'transform_1' },
      { id: 'e2', source: 'transform_1', target: 'dest_1' },
    ],
  },
  wf_002: {
    nodes: [
      { id: 'source_1', type: 'connector.source', label: 'Stripe Webhook', config: {}, connectorId: 'conn_stripe' },
      { id: 'logic_1', type: 'logic.branch', label: 'Route by Status', config: {} },
      { id: 'dest_success', type: 'connector.destination', label: 'Postgres', config: {}, connectorId: 'conn_pg' },
      { id: 'dest_failed', type: 'connector.destination', label: 'Slack Alert', config: {}, connectorId: 'conn_slack' },
    ],
    edges: [
      { id: 'e1', source: 'source_1', target: 'logic_1' },
      { id: 'e2', source: 'logic_1', target: 'dest_success' },
      { id: 'e3', source: 'logic_1', target: 'dest_failed' },
    ],
  },
}

vi.mock('../workflows', () => {
  const __updateMock = vi.fn().mockResolvedValue({})
  return {
    useWorkflowsStore: () => ({
      getDefinition: (id: string) => stubDefinitions[id] ?? undefined,
      fetchDefinition: async (id: string) => stubDefinitions[id] ?? undefined,
      update: __updateMock,
    }),
    __updateMock,
  }
})

describe('useBuilderStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.useFakeTimers()
    updateMock.mockClear()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('starts with empty nodes and edges', () => {
    const store = useBuilderStore()
    expect(store.nodes).toHaveLength(0)
    expect(store.edges).toHaveLength(0)
  })

  it('loads wf_001 with 3 nodes and 2 edges', async () => {
    const store = useBuilderStore()
    await store.loadWorkflow('wf_001')
    expect(store.nodes).toHaveLength(3)
    expect(store.edges).toHaveLength(2)
  })

  it('loads wf_002 with 4 nodes and 3 edges', async () => {
    const store = useBuilderStore()
    await store.loadWorkflow('wf_002')
    expect(store.nodes).toHaveLength(4)
    expect(store.edges).toHaveLength(3)
  })

  it('selectedNodeId starts as null', async () => {
    const store = useBuilderStore()
    await store.loadWorkflow('wf_001')
    expect(store.selectedNodeId).toBeNull()
  })

  it('selectNode sets selectedNodeId', async () => {
    const store = useBuilderStore()
    await store.loadWorkflow('wf_001')
    store.selectNode('source_1')
    expect(store.selectedNodeId).toBe('source_1')
  })

  it('selectedNode computed returns the selected node', async () => {
    const store = useBuilderStore()
    await store.loadWorkflow('wf_001')
    store.selectNode('source_1')
    expect(store.selectedNode?.id).toBe('source_1')
    expect(store.selectedNode?.data.label).toBeTruthy()
  })

  it('clearSelection resets selectedNodeId to null', async () => {
    const store = useBuilderStore()
    await store.loadWorkflow('wf_001')
    store.selectNode('source_1')
    store.clearSelection()
    expect(store.selectedNodeId).toBeNull()
  })

  it('addNode appends a new node at the given position', async () => {
    const store = useBuilderStore()
    await store.loadWorkflow('wf_001')
    const before = store.nodes.length
    store.addNode('connector.source', { x: 100, y: 200 })
    expect(store.nodes).toHaveLength(before + 1)
    expect(store.nodes[store.nodes.length - 1].position).toEqual({ x: 100, y: 200 })
  })

  it('stores initialConfig on the new node', () => {
    const store = useBuilderStore()
    store.addNode('connector.source', { x: 0, y: 0 }, { connectorType: 'http-rest' })
    const node = store.nodes[store.nodes.length - 1]
    expect(node.data.config).toEqual({ connectorType: 'http-rest' })
  })

  it('uses supplied label instead of default', () => {
    const store = useBuilderStore()
    store.addNode('connector.source', { x: 0, y: 0 }, {}, 'HTTP / REST')
    expect(store.nodes[store.nodes.length - 1].data.label).toBe('HTTP / REST')
  })

  it('auto-selects the new node', () => {
    const store = useBuilderStore()
    store.addNode('connector.source', { x: 0, y: 0 })
    const id = store.nodes[store.nodes.length - 1].id
    expect(store.selectedNodeId).toBe(id)
  })

  it('isRunning starts as false', () => {
    const store = useBuilderStore()
    expect(store.isRunning).toBe(false)
  })

  it('returns empty nodes for unknown workflow id', async () => {
    const store = useBuilderStore()
    await store.loadWorkflow('nonexistent')
    expect(store.nodes).toHaveLength(0)
  })

  it('removeNodeAndSave persists node and edge deletions', async () => {
    const store = useBuilderStore()
    await store.loadWorkflow('wf_001')

    store.removeNodeAndSave('transform_1')
    await vi.advanceTimersByTimeAsync(150)

    expect(updateMock).toHaveBeenCalledWith(
      'wf_001',
      expect.objectContaining({
        nodes: [
          expect.objectContaining({ id: 'source_1' }),
          expect.objectContaining({ id: 'dest_1' }),
        ],
        edges: [],
      }),
    )
  })

  it('removeNodesAndSave issues a single PUT when deleting multiple nodes', async () => {
    const store = useBuilderStore()
    await store.loadWorkflow('wf_001')
    updateMock.mockClear()

    store.removeNodesAndSave(['transform_1', 'dest_1'])
    await vi.advanceTimersByTimeAsync(150)

    expect(updateMock).toHaveBeenCalledTimes(1)
    expect(updateMock).toHaveBeenCalledWith(
      'wf_001',
      expect.objectContaining({
        nodes: [expect.objectContaining({ id: 'source_1' })],
        edges: [],
      }),
    )
  })

  it('getUpstreamSchema returns [] for a source node with no incoming edges', async () => {
    const store = useBuilderStore()
    await store.loadWorkflow('wf_001')
    expect(store.getUpstreamSchema('source_1')).toEqual([])
  })

  it('getUpstreamSchema returns outputSchema from the direct upstream node', async () => {
    const store = useBuilderStore()
    await store.loadWorkflow('wf_001')
    const schema: SchemaField[] = [
      { name: 'id', type: 'number' },
      { name: 'email', type: 'string' },
    ]
    store.updateNodeConfig('source_1', { outputSchema: schema })
    expect(store.getUpstreamSchema('transform_1')).toEqual(schema)
  })

  it('getUpstreamSchema deduplicates fields present in multiple upstream schemas', () => {
    const store = useBuilderStore()
    store.addNode('connector.source', { x: 0, y: 0 })
    const n1 = store.nodes[store.nodes.length - 1].id
    store.addNode('connector.source', { x: 0, y: 100 })
    const n2 = store.nodes[store.nodes.length - 1].id
    store.addNode('transform.join', { x: 200, y: 50 })
    const n3 = store.nodes[store.nodes.length - 1].id
    store.addEdge({ source: n1, target: n3 })
    store.addEdge({ source: n2, target: n3 })

    const s1: SchemaField[] = [{ name: 'id', type: 'number' }, { name: 'name', type: 'string' }]
    const s2: SchemaField[] = [{ name: 'id', type: 'number' }, { name: 'email', type: 'string' }]
    store.updateNodeConfig(n1, { outputSchema: s1 })
    store.updateNodeConfig(n2, { outputSchema: s2 })

    const result = store.getUpstreamSchema(n3)
    const names = result.map(f => f.name)
    expect(names.filter(n => n === 'id')).toHaveLength(1)
    expect(names).toContain('name')
    expect(names).toContain('email')
  })

  it('getUpstreamSchemaPerHandle keys schema by targetHandle, falling back to source id', async () => {
    const store = useBuilderStore()
    await store.loadWorkflow('wf_001')
    const schema: SchemaField[] = [{ name: 'user_id', type: 'number' }]
    store.updateNodeConfig('source_1', { outputSchema: schema })
    const byHandle = store.getUpstreamSchemaPerHandle('transform_1')
    // edge e1 has no targetHandle, so key falls back to source id
    expect(byHandle['source_1']).toEqual(schema)
  })

  it('publishWorkflow second update includes graph so status-only merge cannot restore old nodes', async () => {
    const store = useBuilderStore()
    await store.loadWorkflow('wf_001')
    updateMock.mockClear()

    await store.publishWorkflow()

    const calls = updateMock.mock.calls
    expect(calls.length).toBeGreaterThanOrEqual(2)
    const last = calls[calls.length - 1]![1] as Record<string, unknown>
    expect(last.status).toBe('published')
    expect(Array.isArray(last.nodes)).toBe(true)
    expect(Array.isArray(last.edges)).toBe(true)
    expect((last.nodes as { id: string }[]).map((n) => n.id).sort()).toEqual(['dest_1', 'source_1', 'transform_1'].sort())
  })
})
