import { describe, it, expect } from 'bun:test'
import { execute } from '../../transforms/validate.ts'

const ctx = { log: () => {}, getNodeOutput: () => [] }

describe('transform.validate', () => {
  it('passes all records when rules are met', async () => {
    const records = [{ name: 'Alice' }, { name: 'Bob' }]
    const config = { rules: [{ field: 'name', rule: 'required', params: '', errorMode: 'fail' }] }
    expect(await execute(records, config, ctx)).toHaveLength(2)
  })

  it('skip mode drops failing records', async () => {
    const records = [{ email: 'valid@example.com' }, { email: null }]
    const config = { rules: [{ field: 'email', rule: 'not-null', params: '', errorMode: 'skip' }] }
    const result = await execute(records, config, ctx)
    expect(result).toHaveLength(1)
    expect(result[0].email).toBe('valid@example.com')
  })

  it('warn mode keeps all records and logs warning', async () => {
    const warnings: string[] = []
    const warnCtx = { log: (_l: string, msg: string) => { warnings.push(msg) }, getNodeOutput: () => [] }
    const records = [{ age: 5 }]
    const config = { rules: [{ field: 'age', rule: 'min-value', params: '18', errorMode: 'warn' }] }
    const result = await execute(records, config, warnCtx as typeof ctx)
    expect(result).toHaveLength(1)
    expect(warnings.length).toBeGreaterThan(0)
  })

  it('quarantine mode routes failing record to _quarantine field', async () => {
    const records = [{ name: 'A' }, { name: 'Valid Name' }]
    const config = { rules: [{ field: 'name', rule: 'min-length', params: '3', errorMode: 'quarantine' }] }
    const result = await execute(records, config, ctx)
    const failing = result.find(r => r._quarantine)
    expect(failing).toBeTruthy()
    expect(failing?._quarantine).toContain('min-length')
  })
})
