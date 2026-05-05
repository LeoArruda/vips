import { describe, it, expect } from 'bun:test'
import { execute } from '../../transforms/cleanse.ts'

const ctx = { log: () => {}, getNodeOutput: () => [] }

describe('transform.cleanse', () => {
  it('trims whitespace from a field', async () => {
    const records = [{ name: '  Alice  ' }]
    const config = { operations: [{ field: 'name', operation: 'trim', params: '' }] }
    const result = await execute(records, config, ctx)
    expect(result[0].name).toBe('Alice')
  })

  it('lowercases a field', async () => {
    const records = [{ email: 'ALICE@EXAMPLE.COM' }]
    const config = { operations: [{ field: 'email', operation: 'lowercase', params: '' }] }
    expect((await execute(records, config, ctx))[0].email).toBe('alice@example.com')
  })

  it('uppercases a field', async () => {
    const records = [{ code: 'us' }]
    const config = { operations: [{ field: 'code', operation: 'uppercase', params: '' }] }
    expect((await execute(records, config, ctx))[0].code).toBe('US')
  })

  it('replaces null with a default value', async () => {
    const records = [{ country: null }, { country: 'CA' }]
    const config = { operations: [{ field: 'country', operation: 'replace-null', params: 'UNKNOWN' }] }
    const result = await execute(records, config, ctx)
    expect(result[0].country).toBe('UNKNOWN')
    expect(result[1].country).toBe('CA')
  })

  it('replaces a substring using find::replace syntax', async () => {
    const records = [{ phone: '(416) 555-1234' }]
    const config = { operations: [{ field: 'phone', operation: 'replace', params: ' ::' }] }
    const result = await execute(records, config, ctx)
    expect(result[0].phone).toBe('(416)555-1234')
  })
})
