import { describe, it, expect } from 'bun:test'
import { execute } from '../../transforms/merge.ts'

const sourceRecords = [
  { id: 1, name: 'Alice Updated' },
  { id: 3, name: 'New Carol' },
]
const targetRecords = [
  { id: 1, name: 'Alice' },
  { id: 2, name: 'Bob' },
]

const ctx = { log: () => {}, getNodeOutput: (_id: string) => targetRecords }
const config = {
  matchKey: 'id',
  strategy: 'upsert',
  _upstreamNodeIds: [{ source: 'src', handle: 'input-left' }, { source: 'tgt', handle: 'input-right' }],
}

describe('transform.merge', () => {
  it('upsert: updates existing and inserts new', async () => {
    const result = await execute(sourceRecords, config, ctx)
    const ops = result.map(r => r._op)
    expect(ops).toContain('update')
    expect(ops).toContain('insert')
  })

  it('delete: marks rows in target but not in source', async () => {
    const result = await execute(sourceRecords, config, ctx)
    const deleted = result.filter(r => r._op === 'delete')
    expect(deleted.some(r => (r as Record<string, unknown>).id === 2)).toBe(true)
  })
})
