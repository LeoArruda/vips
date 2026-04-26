import { describe, it, expect } from 'bun:test'
import { topoSort } from '../executor/graph.ts'
import type { WorkflowNode, WorkflowEdge } from '@vipsos/workflow-schema'

function node(id: string): WorkflowNode {
  return { id, type: 'connector.source', label: id, config: {} }
}

describe('topoSort', () => {
  it('sorts a linear chain A→B→C', () => {
    const nodes = [node('C'), node('A'), node('B')]
    const edges: WorkflowEdge[] = [
      { id: 'e1', source: 'A', target: 'B' },
      { id: 'e2', source: 'B', target: 'C' },
    ]
    const sorted = topoSort(nodes, edges)
    expect(sorted.map((n) => n.id)).toEqual(['A', 'B', 'C'])
  })

  it('sorts a diamond: A→B, A→C, B→D, C→D', () => {
    const nodes = [node('A'), node('B'), node('C'), node('D')]
    const edges: WorkflowEdge[] = [
      { id: 'e1', source: 'A', target: 'B' },
      { id: 'e2', source: 'A', target: 'C' },
      { id: 'e3', source: 'B', target: 'D' },
      { id: 'e4', source: 'C', target: 'D' },
    ]
    const sorted = topoSort(nodes, edges)
    const ids = sorted.map((n) => n.id)
    expect(ids[0]).toBe('A')
    expect(ids[ids.length - 1]).toBe('D')
    expect(ids).toContain('B')
    expect(ids).toContain('C')
  })

  it('handles a single node with no edges', () => {
    const sorted = topoSort([node('A')], [])
    expect(sorted.map((n) => n.id)).toEqual(['A'])
  })

  it('throws on cyclic graph', () => {
    const nodes = [node('A'), node('B')]
    const edges: WorkflowEdge[] = [
      { id: 'e1', source: 'A', target: 'B' },
      { id: 'e2', source: 'B', target: 'A' },
    ]
    expect(() => topoSort(nodes, edges)).toThrow('cycle')
  })
})
