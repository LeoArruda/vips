import { describe, it, expect } from 'bun:test'
import { execute } from '../../transforms/derive.ts'

const ctx = { log: () => {}, getNodeOutput: () => [] }

describe('transform.derive', () => {
  it('adds a computed field to each record', async () => {
    const records = [{ price: 10, qty: 3 }]
    const config = { formulas: [{ outputField: 'total', expression: 'record.price * record.qty' }] }
    const result = await execute(records, config, ctx)
    expect(result[0].total).toBe(30)
    expect(result[0].price).toBe(10)
  })

  it('handles string concatenation', async () => {
    const records = [{ first: 'Alice', last: 'Smith' }]
    const config = { formulas: [{ outputField: 'fullName', expression: 'record.first + " " + record.last' }] }
    expect((await execute(records, config, ctx))[0].fullName).toBe('Alice Smith')
  })

  it('logs a warning and sets field to null when expression throws', async () => {
    const warnings: string[] = []
    const warnCtx = { log: (_l: string, msg: string) => { warnings.push(msg) }, getNodeOutput: () => [] }
    const records = [{ price: 10 }]
    const config = { formulas: [{ outputField: 'bad', expression: 'record.nonexistent.deep' }] }
    const result = await execute(records, config, warnCtx as typeof ctx)
    expect(result[0].bad).toBeNull()
    expect(warnings.length).toBeGreaterThan(0)
  })
})
