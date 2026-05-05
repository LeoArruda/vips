import { describe, it, expect } from 'bun:test'
import { execute } from '../../transforms/field-mapping.ts'

const ctx = { log: () => {}, getNodeOutput: () => [] }

describe('transform.map', () => {
  it('returns records unchanged when no mappings', async () => {
    const records = [{ id: 1, name: 'Alice' }]
    expect(await execute(records, {}, ctx)).toEqual(records)
  })

  it('renames a source field to the declared target field', async () => {
    const records = [{ first_name: 'Alice', extra: 'x' }]
    const config = { mappings: [{ sourceField: 'first_name', targetField: 'name' }] }
    const result = await execute(records, config, ctx)
    expect(result[0]).toHaveProperty('name', 'Alice')
    expect(result[0]).not.toHaveProperty('first_name')
    expect(result[0]).toHaveProperty('extra', 'x')
  })

  it('strict mode keeps only declared target fields', async () => {
    const records = [{ id: 1, email: 'a@b.com', extra: 'x' }]
    const config = {
      strictMode: true,
      mappings: [{ sourceField: 'email', targetField: 'email_address' }],
    }
    const result = await execute(records, config, ctx)
    expect(Object.keys(result[0])).toEqual(['email_address'])
    expect(result[0].email_address).toBe('a@b.com')
  })

  it('handles empty records array', async () => {
    expect(await execute([], { mappings: [{ sourceField: 'a', targetField: 'b' }] }, ctx)).toEqual([])
  })
})
