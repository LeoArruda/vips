import { describe, it, expect } from 'bun:test'
import { execute } from '../../transforms/convert.ts'

const ctx = { log: () => {}, getNodeOutput: () => [] }

describe('transform.convert', () => {
  it('converts string to number', async () => {
    const records = [{ price: '9.99' }]
    const config = { conversions: [{ field: 'price', targetType: 'number', format: '' }] }
    const result = await execute(records, config, ctx)
    expect(typeof result[0].price).toBe('number')
    expect(result[0].price).toBe(9.99)
  })

  it('converts number to string', async () => {
    const records = [{ code: 42 }]
    const config = { conversions: [{ field: 'code', targetType: 'string', format: '' }] }
    expect(typeof (await execute(records, config, ctx))[0].code).toBe('string')
  })

  it('converts string to boolean (truthy values)', async () => {
    const records = [{ active: 'true' }, { active: '1' }, { active: 'false' }]
    const config = { conversions: [{ field: 'active', targetType: 'boolean', format: '' }] }
    const result = await execute(records, config, ctx)
    expect(result[0].active).toBe(true)
    expect(result[1].active).toBe(true)
    expect(result[2].active).toBe(false)
  })

  it('leaves null values as null', async () => {
    const records = [{ val: null }]
    const config = { conversions: [{ field: 'val', targetType: 'number', format: '' }] }
    expect((await execute(records, config, ctx))[0].val).toBeNull()
  })
})
