import { describe, it, expect } from 'vitest'
import { builderNodesToWorkflowPayload, builderEdgesToWorkflowPayload } from '../graphPayload'
import type { BuilderNode, BuilderEdge } from '@/stores/builder'

describe('graphPayload', () => {
  it('maps builder nodes to workflow API node shape', () => {
    const nodes: BuilderNode[] = [
      {
        id: 'n1',
        type: 'sourceNode',
        position: { x: 10, y: 20 },
        data: {
          label: 'L',
          config: { a: 1 },
          connectorId: 'c1',
          nodeType: 'connector.source',
          status: 'pending',
        },
      },
    ]
    const out = builderNodesToWorkflowPayload(nodes)
    expect(out).toEqual([
      {
        id: 'n1',
        type: 'connector.source',
        label: 'L',
        config: { a: 1 },
        connectorId: 'c1',
        position: { x: 10, y: 20 },
      },
    ])
  })

  it('maps builder edges', () => {
    const edges: BuilderEdge[] = [{ id: 'e1', source: 'a', target: 'b' }]
    expect(builderEdgesToWorkflowPayload(edges)).toEqual([{ id: 'e1', source: 'a', target: 'b' }])
  })
})
