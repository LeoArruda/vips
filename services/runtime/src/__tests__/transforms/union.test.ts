import { describe, it, expect } from 'bun:test'
import { execute } from '../../transforms/union.ts'

const leftRecords = [{ id: 1, name: 'Alice' }, { id: 2, name: 'Bob' }]
const rightRecords = [{ id: 2, name: 'Bob' }, { id: 3, name: 'Carol' }]

const ctx = { log: () => {}, getNodeOutput: (_id: string) => rightRecords }
const baseConfig = {
  _upstreamNodeIds: [{ source: 'left', handle: 'input-left' }, { source: 'right', handle: 'input-right' }],
}

describe('transform.union', () => {
  it('stacks all records from both inputs', async () => {
    const result = await execute(leftRecords, baseConfig, ctx)
    expect(result).toHaveLength(4)
  })

  it('deduplicates rows by full content when deduplicate: true', async () => {
    const config = { ...baseConfig, deduplicate: true }
    const result = await execute(leftRecords, config, ctx)
    expect(result).toHaveLength(3)
  })
})
