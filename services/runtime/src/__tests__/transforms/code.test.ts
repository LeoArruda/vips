import { describe, it, expect } from 'bun:test'
import { execute } from '../../transforms/code.ts'

const ctx = { log: () => {}, getNodeOutput: () => [] }

describe('transform.code', () => {
  it('executes user code and returns transformed records', async () => {
    const records = [{ price: 10, qty: 2 }, { price: 5, qty: 4 }]
    const config = { code: 'return records.map(r => ({ ...r, total: r.price * r.qty }))', timeoutSeconds: 5 }
    const result = await execute(records, config, ctx)
    expect(result[0].total).toBe(20)
    expect(result[1].total).toBe(20)
  })

  it('returns empty array when code returns empty array', async () => {
    const config = { code: 'return []', timeoutSeconds: 5 }
    expect(await execute([{ id: 1 }], config, ctx)).toEqual([])
  })

  it('throws when code does not return an array', async () => {
    const config = { code: 'return "not an array"', timeoutSeconds: 5 }
    await expect(execute([{ id: 1 }], config, ctx)).rejects.toThrow()
  })

  it('throws on timeout', async () => {
    const config = { code: 'while(true){}', timeoutSeconds: 1 }
    await expect(execute([{ id: 1 }], config, ctx)).rejects.toThrow(/timeout/i)
  }, 4000)
})
