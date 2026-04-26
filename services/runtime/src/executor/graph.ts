import type { WorkflowNode, WorkflowEdge } from '@vipsos/workflow-schema'

export function topoSort(nodes: WorkflowNode[], edges: WorkflowEdge[]): WorkflowNode[] {
  const inDegree = new Map<string, number>()
  const adjacency = new Map<string, string[]>()

  for (const node of nodes) {
    inDegree.set(node.id, 0)
    adjacency.set(node.id, [])
  }

  for (const edge of edges) {
    if (!inDegree.has(edge.target)) inDegree.set(edge.target, 0)
    inDegree.set(edge.target, (inDegree.get(edge.target) ?? 0) + 1)
    adjacency.get(edge.source)?.push(edge.target)
  }

  const queue: string[] = []
  for (const [id, degree] of inDegree) {
    if (degree === 0) queue.push(id)
  }

  const sorted: string[] = []
  while (queue.length > 0) {
    const nodeId = queue.shift()!
    sorted.push(nodeId)
    for (const neighbor of adjacency.get(nodeId) ?? []) {
      const newDeg = (inDegree.get(neighbor) ?? 0) - 1
      inDegree.set(neighbor, newDeg)
      if (newDeg === 0) queue.push(neighbor)
    }
  }

  if (sorted.length !== nodes.length) {
    throw new Error('Workflow graph contains a cycle — cannot execute')
  }

  const nodeById = new Map(nodes.map((n) => [n.id, n]))
  return sorted.map((id) => nodeById.get(id)!).filter(Boolean)
}
