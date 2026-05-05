import { describe, it, expect } from 'bun:test'
import { execute } from '../../transforms/flatten.ts'

const ctx = { log: () => {}, getNodeOutput: () => [] }

describe('transform.flatten', () => {
  it('flattens a nested object field using dot path', async () => {
    const records = [{ id: 1, address: { city: 'Toronto', postal: 'M5V' } }]
    const config = { paths: ['address'], explodeArrays: false }
    const result = await execute(records, config, ctx)
    expect(result[0]['address.city']).toBe('Toronto')
    expect(result[0]['address.postal']).toBe('M5V')
    expect(result[0].address).toBeUndefined()
  })

  it('leaves records unchanged for paths that do not exist', async () => {
    const records = [{ id: 1 }]
    const config = { paths: ['nonexistent'], explodeArrays: false }
    const result = await execute(records, config, ctx)
    expect(result[0]).toEqual({ id: 1 })
  })

  it('explodes array fields into multiple rows', async () => {
    const records = [{ id: 1, tags: ['a', 'b', 'c'] }]
    const config = { paths: ['tags'], explodeArrays: true }
    const result = await execute(records, config, ctx)
    expect(result).toHaveLength(3)
    expect(result.map(r => r.tags)).toEqual(['a', 'b', 'c'])
  })
})
