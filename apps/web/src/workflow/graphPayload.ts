import type { WorkflowEdge, WorkflowNode } from '@vipsos/workflow-schema'
import type { BuilderEdge, BuilderNode } from '@/stores/builder'

export function builderNodesToWorkflowPayload(nodes: BuilderNode[]): WorkflowNode[] {
  return nodes.map((n) => ({
    id: n.id,
    type: n.data.nodeType,
    label: n.data.label,
    config: n.data.config,
    connectorId: n.data.connectorId,
    position: n.position,
  }))
}

export function builderEdgesToWorkflowPayload(edges: BuilderEdge[]): WorkflowEdge[] {
  return edges.map((e) => ({ id: e.id, source: e.source, target: e.target }))
}
