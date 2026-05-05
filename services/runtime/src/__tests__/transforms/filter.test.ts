import { describe, it, expect } from 'bun:test'
import { execute } from '../../transforms/filter.ts'

const ctx = { log: () => {}, getNodeOutput: () => [] }

describe('transform.filter', () => {
  it('returns all records when no conditions', async () => {
    const r = [{ id: 1 }, { id: 2 }]
    expect(await execute(r, {}, ctx)).toEqual(r)
  })

  it('filters by equality (AND logic)', async () => {
    const records = [{ status: 'active', tier: 'pro' }, { status: 'active', tier: 'free' }, { status: 'inactive', tier: 'pro' }]
    const config = {
      logic: 'AND',
      conditions: [
        { field: 'status', operator: '=', value: 'active' },
        { field: 'tier', operator: '=', value: 'pro' },
      ],
    }
    const result = await execute(records, config, ctx)
    expect(result).toHaveLength(1)
    expect(result[0].tier).toBe('pro')
  })

  it('filters by OR logic', async () => {
    const records = [{ role: 'admin' }, { role: 'editor' }, { role: 'viewer' }]
    const config = {
      logic: 'OR',
      conditions: [
        { field: 'role', operator: '=', value: 'admin' },
        { field: 'role', operator: '=', value: 'editor' },
      ],
    }
    const result = await execute(records, config, ctx)
    expect(result).toHaveLength(2)
  })

  it('supports is-null operator', async () => {
    const records = [{ email: null }, { email: 'a@b.com' }]
    const config = { conditions: [{ field: 'email', operator: 'is-null', value: '' }] }
    const result = await execute(records, config, ctx)
    expect(result).toHaveLength(1)
    expect(result[0].email).toBeNull()
  })

  it('supports contains operator', async () => {
    const records = [{ name: 'Alice Smith' }, { name: 'Bob Jones' }]
    const config = { conditions: [{ field: 'name', operator: 'contains', value: 'Smith' }] }
    const result = await execute(records, config, ctx)
    expect(result).toHaveLength(1)
  })
})
