import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { NodeType, NodeStatus } from '@/types'
import { builderNodesToWorkflowPayload, builderEdgesToWorkflowPayload } from '@/workflow/graphPayload'
import { positionsForNodesMissingLayout } from '@/workflow/layoutFallback'
import { useWorkflowsStore } from './workflows'

const STRUCTURAL_DEBOUNCE_MS = 100
const POSITIONAL_DEBOUNCE_MS = 500

export interface BuilderNodeData {
  label: string
  config: Record<string, unknown>
  connectorId?: string
  nodeType: NodeType
  status: NodeStatus
}

export interface BuilderNode {
  id: string
  type: string
  position: { x: number; y: number }
  data: BuilderNodeData
}

export interface BuilderEdge {
  id: string
  source: string
  target: string
  sourceHandle?: string
  targetHandle?: string
}

const WORKFLOW_POSITIONS: Record<string, Record<string, { x: number; y: number }>> = {
  wf_001: {
    source_1: { x: 50, y: 150 },
    transform_1: { x: 320, y: 150 },
    dest_1: { x: 590, y: 150 },
  },
  wf_002: {
    source_1: { x: 50, y: 200 },
    logic_1: { x: 320, y: 200 },
    dest_success: { x: 590, y: 80 },
    dest_failed: { x: 590, y: 320 },
  },
  wf_004: {
    source_1: { x: 50, y: 150 },
    dest_1: { x: 370, y: 150 },
  },
}

function isDemoWorkflowId(workflowId: string): boolean {
  return Object.prototype.hasOwnProperty.call(WORKFLOW_POSITIONS, workflowId)
}

function nodeTypeToVueFlowType(type: NodeType): string {
  switch (type) {
    case 'connector.source':
      return 'sourceNode'
    case 'connector.destination':
      return 'destinationNode'
    case 'transform.map':
      return 'transformNode'
    case 'logic.branch':
      return 'logicNode'
    case 'trigger':
      return 'sourceNode'
    default:
      return 'sourceNode'
  }
}

function defaultLabelForType(type: NodeType): string {
  const labels: Record<NodeType, string> = {
    'connector.source': 'Source',
    'connector.destination': 'Destination',
    'transform.map': 'Transform',
    'logic.branch': 'Branch',
    trigger: 'Trigger',
  }
  return labels[type] ?? 'Node'
}

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms))

export interface NodeRunOutput {
  rowCount?: number
  schema?: string   // e.g. "id · name · email"
  error?: string
}

export const useBuilderStore = defineStore('builder', () => {
  const nodes = ref<BuilderNode[]>([])
  const edges = ref<BuilderEdge[]>([])
  const selectedNodeId = ref<string | null>(null)
  const currentWorkflowId = ref<string | null>(null)
  const isRunning = ref(false)
  // Run outputs stored separately so VueFlow's node-data propagation is not in the critical path
  const nodeOutputs = ref<Record<string, NodeRunOutput>>({})

  const selectedNode = computed(
    () => nodes.value.find((n) => n.id === selectedNodeId.value) ?? null,
  )

  const persistError = ref<string | null>(null)
  let structuralTimerId: ReturnType<typeof setTimeout> | null = null
  let positionalTimerId: ReturnType<typeof setTimeout> | null = null
  let persistInFlight = false
  let persistQueued = false

  function clearPersistTimers() {
    if (structuralTimerId !== null) {
      clearTimeout(structuralTimerId)
      structuralTimerId = null
    }
    if (positionalTimerId !== null) {
      clearTimeout(positionalTimerId)
      positionalTimerId = null
    }
  }

  async function flushGraphToServer(): Promise<void> {
    const id = currentWorkflowId.value
    if (!id) return
    if (persistInFlight) {
      persistQueued = true
      return
    }
    persistInFlight = true
    persistQueued = false
    persistError.value = null
    const workflowsStore = useWorkflowsStore()
    try {
      await workflowsStore.update(id, {
        nodes: builderNodesToWorkflowPayload(nodes.value),
        edges: builderEdgesToWorkflowPayload(edges.value),
      })
      await workflowsStore.fetchDefinition(id)
    } catch (err) {
      persistError.value = err instanceof Error ? err.message : 'Failed to save workflow'
      throw err
    } finally {
      persistInFlight = false
      if (persistQueued) {
        persistQueued = false
        await flushGraphToServer()
      }
    }
  }

  function markDirty(kind: 'structural' | 'positional') {
    if (!currentWorkflowId.value) return
    const delay = kind === 'structural' ? STRUCTURAL_DEBOUNCE_MS : POSITIONAL_DEBOUNCE_MS
    if (kind === 'structural') {
      if (structuralTimerId !== null) clearTimeout(structuralTimerId)
      structuralTimerId = setTimeout(() => {
        structuralTimerId = null
        void flushGraphToServer()
      }, delay)
    } else {
      if (positionalTimerId !== null) clearTimeout(positionalTimerId)
      positionalTimerId = setTimeout(() => {
        positionalTimerId = null
        void flushGraphToServer()
      }, delay)
    }
  }

  async function flushPendingGraph(): Promise<void> {
    if (!currentWorkflowId.value) return
    clearPersistTimers()
    await flushGraphToServer()
  }

  function clearPersistError() {
    persistError.value = null
  }

  async function loadWorkflow(workflowId: string) {
    currentWorkflowId.value = workflowId
    selectedNodeId.value = null
    clearPersistTimers()
    persistError.value = null

    const workflowsStore = useWorkflowsStore()

    // Fetch fresh first so post-save deletions are always reflected.
    // Fall back to cache if the network request fails (transient error).
    const def =
      (await workflowsStore.fetchDefinition(workflowId)) ??
      workflowsStore.getDefinition(workflowId)

    // Clear + populate in one synchronous block AFTER the await so Vue batches
    // both assignments into a single reactive flush.  VueFlow never sees the
    // intermediate [] state, which prevents the "initialised: false → opacity 0"
    // blink caused by VueFlow creating new GraphNodes mid-cycle.
    nodes.value = []
    edges.value = []
    nodeOutputs.value = {}

    if (!def || !def.nodes?.length) return

    const useDemoMap = isDemoWorkflowId(workflowId)
    const demoPositions = WORKFLOW_POSITIONS[workflowId] ?? {}
    const idsMissingPos = def.nodes.filter((n) => !n.position).map((n) => n.id)
    const layoutFallback =
      !useDemoMap && idsMissingPos.length > 0 ? positionsForNodesMissingLayout(idsMissingPos) : {}

    nodes.value = def.nodes.map((n, i) => ({
      id: n.id,
      type: nodeTypeToVueFlowType(n.type),
      position:
        n.position ??
        (useDemoMap ? demoPositions[n.id] : layoutFallback[n.id]) ??
        { x: 50 + i * 270, y: 150 },
      data: {
        label: n.label,
        config: n.config,
        connectorId: n.connectorId,
        nodeType: n.type,
        status: 'pending' as NodeStatus,
      },
    }))
    edges.value = def.edges.map((e) => ({ id: e.id, source: e.source, target: e.target }))
  }

  async function discardPersistErrorAndReload(): Promise<void> {
    const id = currentWorkflowId.value
    clearPersistError()
    if (id) await loadWorkflow(id)
  }

  async function saveWorkflow() {
    if (!currentWorkflowId.value) return
    clearPersistTimers()
    await flushGraphToServer()
  }

  async function publishWorkflow() {
    if (!currentWorkflowId.value) return
    await saveWorkflow()
    const workflowsStore = useWorkflowsStore()
    await workflowsStore.update(currentWorkflowId.value, {
      status: 'published',
      nodes: builderNodesToWorkflowPayload(nodes.value),
      edges: builderEdgesToWorkflowPayload(edges.value),
    })
    await workflowsStore.fetchDefinition(currentWorkflowId.value)
  }

  function selectNode(nodeId: string | null) {
    selectedNodeId.value = nodeId
  }

  function clearSelection() {
    selectedNodeId.value = null
  }

  function updateNodePosition(nodeId: string, position: { x: number; y: number }) {
    const node = nodes.value.find((n) => n.id === nodeId)
    if (node) node.position = { ...position }
    markDirty('positional')
  }

  function removeNode(nodeId: string) {
    nodes.value = nodes.value.filter((n) => n.id !== nodeId)
    edges.value = edges.value.filter((e) => e.source !== nodeId && e.target !== nodeId)
    if (selectedNodeId.value === nodeId) selectedNodeId.value = null
    const outputs = { ...nodeOutputs.value }
    delete outputs[nodeId]
    nodeOutputs.value = outputs
  }

  /** Remove several nodes; debounced structural persist coalesces multi-select deletes. */
  function removeNodesAndSave(nodeIds: string[]) {
    if (!currentWorkflowId.value || nodeIds.length === 0) return
    for (const id of nodeIds) removeNode(id)
    markDirty('structural')
  }

  function removeNodeAndSave(nodeId: string) {
    removeNodesAndSave([nodeId])
  }

  function removeEdge(edgeId: string) {
    edges.value = edges.value.filter((e) => e.id !== edgeId)
  }

  function removeEdgesAndSave(edgeIds: string[]) {
    if (!currentWorkflowId.value || edgeIds.length === 0) return
    const idSet = new Set(edgeIds)
    edges.value = edges.value.filter((e) => !idSet.has(e.id))
    markDirty('structural')
  }

  function updateNodeConfig(nodeId: string, config: Record<string, unknown>) {
    const node = nodes.value.find((n) => n.id === nodeId)
    if (node) node.data = { ...node.data, config: { ...node.data.config, ...config } }
    markDirty('structural')
  }

  function addNode(
    type: NodeType,
    position: { x: number; y: number },
    initialConfig: Record<string, unknown> = {},
    label?: string,
  ) {
    const id = `node_${Date.now()}`
    nodes.value.push({
      id,
      type: nodeTypeToVueFlowType(type),
      position,
      data: {
        label: label ?? defaultLabelForType(type),
        config: initialConfig,
        nodeType: type,
        status: 'pending',
      },
    })
    selectedNodeId.value = id   // auto-open inspector
    markDirty('structural')
  }

  function addEdge(connection: { source: string; target: string; sourceHandle?: string | null; targetHandle?: string | null }) {
    const id = `edge_${Date.now()}`
    edges.value.push({
      id,
      source: connection.source,
      target: connection.target,
      sourceHandle: connection.sourceHandle ?? undefined,
      targetHandle: connection.targetHandle ?? undefined,
    })
    markDirty('structural')
  }

  function resetNodeStatuses() {
    for (const node of nodes.value) {
      node.data = { ...node.data, status: 'pending' as NodeStatus }
    }
    nodeOutputs.value = {}
  }

  function applyRunLogs(logs: Array<{ node_id?: string; level: string; message: string }>) {
    // Group logs by node
    const byNode = new Map<string, Array<{ level: string; message: string }>>()
    for (const log of logs) {
      if (!log.node_id) continue
      if (!byNode.has(log.node_id)) byNode.set(log.node_id, [])
      byNode.get(log.node_id)!.push(log)
    }

    const newOutputs: Record<string, NodeRunOutput> = { ...nodeOutputs.value }

    for (const [nid, nodeLogs] of byNode) {
      const starting  = nodeLogs.some((l) => l.message.includes('Starting node'))
      const completed = nodeLogs.some((l) => l.message.includes('completed successfully'))
      const errorLog  = nodeLogs.find((l) => l.level === 'error')

      let status: NodeStatus = 'pending'
      if (starting)  status = 'running'
      if (completed) status = 'success'
      if (errorLog)  status = 'failed'

      // Parse the structured "Output: N records · field1 · field2" log emitted by the runner
      const outputLog = nodeLogs.find((l) => l.message.startsWith('Output:'))
      if (outputLog) {
        const m = outputLog.message.match(/^Output:\s*(\d+)\s+\w+(?:\s*·\s*(.+))?/)
        if (m) {
          newOutputs[nid] = { rowCount: parseInt(m[1]), schema: m[2]?.trim() }
        } else {
          newOutputs[nid] = { rowCount: 0 }
        }
      }
      if (errorLog) newOutputs[nid] = { error: errorLog.message }

      const nodeToUpdate = nodes.value.find((n) => n.id === nid)
      if (nodeToUpdate) nodeToUpdate.data = { ...nodeToUpdate.data, status }
    }

    nodeOutputs.value = newOutputs
  }

  function setAllNodeStatus(status: NodeStatus) {
    for (const node of nodes.value) {
      node.data = { ...node.data, status }
    }
  }

  async function simulateRun() {
    if (isRunning.value) return
    isRunning.value = true

    for (const node of nodes.value) {
      node.data = { ...node.data, status: 'pending' as NodeStatus }
    }

    for (const node of nodes.value) {
      await sleep(300)
      node.data = { ...node.data, status: 'running' as NodeStatus }
      await sleep(700)
      node.data = { ...node.data, status: 'success' as NodeStatus }
    }

    isRunning.value = false
  }

  return {
    nodes,
    edges,
    selectedNodeId,
    selectedNode,
    currentWorkflowId,
    isRunning,
    nodeOutputs,
    persistError,
    loadWorkflow,
    selectNode,
    clearSelection,
    addNode,
    addEdge,
    removeNode,
    removeNodeAndSave,
    removeNodesAndSave,
    removeEdge,
    removeEdgesAndSave,
    updateNodePosition,
    updateNodeConfig,
    saveWorkflow,
    publishWorkflow,
    flushPendingGraph,
    clearPersistError,
    discardPersistErrorAndReload,
    resetNodeStatuses,
    applyRunLogs,
    setAllNodeStatus,
    simulateRun,
  }
})
