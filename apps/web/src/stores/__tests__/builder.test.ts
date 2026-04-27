import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useBuilderStore } from '../builder'

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

vi.mock('../workflows', () => ({
  useWorkflowsStore: () => ({
    getDefinition: (id: string) => stubDefinitions[id] ?? undefined,
    fetchDefinition: async (id: string) => stubDefinitions[id] ?? undefined,
    update: vi.fn().mockResolvedValue({}),
  }),
}))

describe('useBuilderStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('starts with empty nodes and edges', () => {
    const store = useBuilderStore()
    expect(store.nodes).toHaveLength(0)
    expect(store.edges).toHaveLength(0)
  })

  it('loads wf_001 with 3 nodes and 2 edges', () => {
    const store = useBuilderStore()
    store.loadWorkflow('wf_001')
    expect(store.nodes).toHaveLength(3)
    expect(store.edges).toHaveLength(2)
  })

  it('loads wf_002 with 4 nodes and 3 edges', () => {
    const store = useBuilderStore()
    store.loadWorkflow('wf_002')
    expect(store.nodes).toHaveLength(4)
    expect(store.edges).toHaveLength(3)
  })

  it('selectedNodeId starts as null', () => {
    const store = useBuilderStore()
    store.loadWorkflow('wf_001')
    expect(store.selectedNodeId).toBeNull()
  })

  it('selectNode sets selectedNodeId', () => {
    const store = useBuilderStore()
    store.loadWorkflow('wf_001')
    store.selectNode('source_1')
    expect(store.selectedNodeId).toBe('source_1')
  })

  it('selectedNode computed returns the selected node', () => {
    const store = useBuilderStore()
    store.loadWorkflow('wf_001')
    store.selectNode('source_1')
    expect(store.selectedNode?.id).toBe('source_1')
    expect(store.selectedNode?.data.label).toBeTruthy()
  })

  it('clearSelection resets selectedNodeId to null', () => {
    const store = useBuilderStore()
    store.loadWorkflow('wf_001')
    store.selectNode('source_1')
    store.clearSelection()
    expect(store.selectedNodeId).toBeNull()
  })

  it('addNode appends a new node at the given position', () => {
    const store = useBuilderStore()
    store.loadWorkflow('wf_001')
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

  it('returns empty nodes for unknown workflow id', () => {
    const store = useBuilderStore()
    store.loadWorkflow('nonexistent')
    expect(store.nodes).toHaveLength(0)
  })
})
