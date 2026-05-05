import { describe, it, expect } from 'bun:test'
import { execute } from '../../transforms/join.ts'

const leftRecords = [
  { user_id: 1, name: 'Alice' },
  { user_id: 2, name: 'Bob' },
  { user_id: 3, name: 'Carol' },
]
const rightRecords = [
  { order_user_id: 1, amount: 100 },
  { order_user_id: 2, amount: 200 },
]

function makeCtx(right = rightRecords) {
  return { log: () => {}, getNodeOutput: (_id: string) => right }
}

const baseConfig = {
  leftKey: 'user_id',
  rightKey: 'order_user_id',
  joinType: 'inner',
  _upstreamNodeIds: [{ source: 'left-node', handle: 'input-left' }, { source: 'right-node', handle: 'input-right' }],
}

describe('transform.join', () => {
  it('inner join returns only matching rows', async () => {
    const result = await execute(leftRecords, baseConfig, makeCtx())
    expect(result).toHaveLength(2)
    expect(result.map(r => r.name).sort()).toEqual(['Alice', 'Bob'])
  })

  it('left join keeps all left rows', async () => {
    const config = { ...baseConfig, joinType: 'left' }
    const result = await execute(leftRecords, config, makeCtx())
    expect(result).toHaveLength(3)
  })

  it('joined row merges both record fields', async () => {
    const result = await execute(leftRecords, baseConfig, makeCtx())
    const alice = result.find(r => r.name === 'Alice')
    expect(alice?.amount).toBe(100)
  })
})
