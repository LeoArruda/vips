import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { NodeType, NodeStatus } from '@/types'
import { useWorkflowsStore } from './workflows'

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

export const useBuilderStore = defineStore('builder', () => {
  const nodes = ref<BuilderNode[]>([])
  const edges = ref<BuilderEdge[]>([])
  const selectedNodeId = ref<string | null>(null)
  const currentWorkflowId = ref<string | null>(null)
  const isRunning = ref(false)

  const selectedNode = computed(
    () => nodes.value.find((n) => n.id === selectedNodeId.value) ?? null,
  )

  async function loadWorkflow(workflowId: string) {
    currentWorkflowId.value = workflowId
    selectedNodeId.value = null
    nodes.value = []
    edges.value = []

    const workflowsStore = useWorkflowsStore()

    // Try in-memory cache first; if absent, fetch from the API
    let def = workflowsStore.getDefinition(workflowId)
    if (!def) {
      def = await workflowsStore.fetchDefinition(workflowId)
    }

    if (!def || !def.nodes?.length) return

    const positions = WORKFLOW_POSITIONS[workflowId] ?? {}
    nodes.value = def.nodes.map((n, i) => ({
      id: n.id,
      type: nodeTypeToVueFlowType(n.type),
      position: n.position ?? positions[n.id] ?? { x: 50 + i * 270, y: 150 },
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

  async function saveWorkflow() {
    if (!currentWorkflowId.value) return
    const workflowsStore = useWorkflowsStore()
    const workflowNodes = nodes.value.map((n) => ({
      id: n.id,
      type: n.data.nodeType,
      label: n.data.label,
      config: n.data.config,
      connectorId: n.data.connectorId,
      position: n.position,
    }))
    const workflowEdges = edges.value.map((e) => ({ id: e.id, source: e.source, target: e.target }))
    await workflowsStore.update(currentWorkflowId.value, { nodes: workflowNodes, edges: workflowEdges })
    // Invalidate the cache so the next loadWorkflow fetches the freshly saved definition
    await workflowsStore.fetchDefinition(currentWorkflowId.value)
  }

  async function publishWorkflow() {
    if (!currentWorkflowId.value) return
    await saveWorkflow()
    const workflowsStore = useWorkflowsStore()
    await workflowsStore.update(currentWorkflowId.value, { status: 'published' })
  }

  function selectNode(nodeId: string | null) {
    selectedNodeId.value = nodeId
  }

  function clearSelection() {
    selectedNodeId.value = null
  }

  function updateNodeConfig(nodeId: string, config: Record<string, unknown>) {
    nodes.value = nodes.value.map((n) =>
      n.id === nodeId ? { ...n, data: { ...n.data, config: { ...n.data.config, ...config } } } : n,
    )
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
  }

  function resetNodeStatuses() {
    nodes.value = nodes.value.map((n) => ({ ...n, data: { ...n.data, status: 'pending' as NodeStatus } }))
  }

  function applyRunLogs(logs: Array<{ node_id?: string; level: string; message: string }>) {
    // Group all logs by node so we can derive status + output in one pass per node
    const byNode = new Map<string, Array<{ level: string; message: string }>>()
    for (const log of logs) {
      if (!log.node_id) continue
      if (!byNode.has(log.node_id)) byNode.set(log.node_id, [])
      byNode.get(log.node_id)!.push(log)
    }

    for (const [nid, nodeLogs] of byNode) {
      const starting  = nodeLogs.some((l) => l.message.includes('Starting node'))
      const completed = nodeLogs.some((l) => l.message.includes('completed successfully'))
      const errorLog  = nodeLogs.find((l) => l.level === 'error')

      let status: NodeStatus = 'pending'
      if (starting)   status = 'running'
      if (completed)  status = 'success'
      if (errorLog)   status = 'failed'

      // Extract row / data-point count from any connector-specific log message
      let lastRunOutput: Record<string, unknown> | undefined
      for (const log of nodeLogs) {
        const countMatch = log.message.match(/(\d+)\s+(row|data point)/i)
        if (countMatch) { lastRunOutput = { rowCount: parseInt(countMatch[1]) }; break }
        // HTTP: "GET url → 200" — treat as 1 response
        if (log.message.match(/→\s*\d{3}/)) { lastRunOutput = { rowCount: 1 }; break }
      }
      if (errorLog) lastRunOutput = { error: errorLog.message }

      nodes.value = nodes.value.map((n) => {
        if (n.id !== nid) return n
        const config = lastRunOutput !== undefined
          ? { ...n.data.config, lastRunOutput }
          : n.data.config
        return { ...n, data: { ...n.data, status, config } }
      })
    }
  }

  function setAllNodeStatus(status: NodeStatus) {
    nodes.value = nodes.value.map((n) => ({ ...n, data: { ...n.data, status } }))
  }

  async function simulateRun() {
    if (isRunning.value) return
    isRunning.value = true

    nodes.value = nodes.value.map((n) => ({
      ...n,
      data: { ...n.data, status: 'pending' as NodeStatus },
    }))

    for (const node of nodes.value) {
      await sleep(300)
      nodes.value = nodes.value.map((n) =>
        n.id === node.id ? { ...n, data: { ...n.data, status: 'running' as NodeStatus } } : n,
      )
      await sleep(700)
      nodes.value = nodes.value.map((n) =>
        n.id === node.id ? { ...n, data: { ...n.data, status: 'success' as NodeStatus } } : n,
      )
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
    loadWorkflow,
    selectNode,
    clearSelection,
    addNode,
    addEdge,
    updateNodeConfig,
    saveWorkflow,
    publishWorkflow,
    resetNodeStatuses,
    applyRunLogs,
    setAllNodeStatus,
    simulateRun,
  }
})
