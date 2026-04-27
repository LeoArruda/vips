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

  function loadWorkflow(workflowId: string) {
    const workflowsStore = useWorkflowsStore()
    const def = workflowsStore.getDefinition(workflowId)
    if (!def) return

    currentWorkflowId.value = workflowId
    const positions = WORKFLOW_POSITIONS[workflowId] ?? {}

    nodes.value = def.nodes.map((n, i) => ({
      id: n.id,
      type: nodeTypeToVueFlowType(n.type),
      position: positions[n.id] ?? { x: 50 + i * 270, y: 150 },
      data: {
        label: n.label,
        config: n.config,
        connectorId: n.connectorId,
        nodeType: n.type,
        status: 'pending' as NodeStatus,
      },
    }))

    edges.value = def.edges.map((e) => ({
      id: e.id,
      source: e.source,
      target: e.target,
    }))

    selectedNodeId.value = null
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

  function addNode(type: NodeType, position: { x: number; y: number }) {
    const id = `node_${Date.now()}`
    nodes.value.push({
      id,
      type: nodeTypeToVueFlowType(type),
      position,
      data: {
        label: defaultLabelForType(type),
        config: {},
        nodeType: type,
        status: 'pending',
      },
    })
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
    updateNodeConfig,
    simulateRun,
  }
})
