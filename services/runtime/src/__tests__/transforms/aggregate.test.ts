import { describe, it, expect } from 'bun:test'
import { execute } from '../../transforms/aggregate.ts'

const ctx = { log: () => {}, getNodeOutput: () => [] }

describe('transform.aggregate', () => {
  const records = [
    { region: 'East', revenue: 100 },
    { region: 'East', revenue: 200 },
    { region: 'West', revenue: 150 },
  ]

  it('groups by a field and counts rows', async () => {
    const config = {
      groupBy: ['region'],
      aggregations: [{ field: 'revenue', function: 'count', alias: 'n' }],
    }
    const result = await execute(records, config, ctx)
    expect(result).toHaveLength(2)
    const east = result.find(r => r.region === 'East')
    expect(east?.n).toBe(2)
  })

  it('sums a numeric field', async () => {
    const config = {
      groupBy: ['region'],
      aggregations: [{ field: 'revenue', function: 'sum', alias: 'total' }],
    }
    const result = await execute(records, config, ctx)
    const east = result.find(r => r.region === 'East')
    expect(east?.total).toBe(300)
  })

  it('computes average', async () => {
    const config = {
      groupBy: ['region'],
      aggregations: [{ field: 'revenue', function: 'avg', alias: 'avg_rev' }],
    }
    const result = await execute(records, config, ctx)
    const east = result.find(r => r.region === 'East')
    expect(east?.avg_rev).toBe(150)
  })

  it('finds min and max', async () => {
    const config = {
      groupBy: ['region'],
      aggregations: [
        { field: 'revenue', function: 'min', alias: 'min_r' },
        { field: 'revenue', function: 'max', alias: 'max_r' },
      ],
    }
    const result = await execute(records, config, ctx)
    const east = result.find(r => r.region === 'East')
    expect(east?.min_r).toBe(100)
    expect(east?.max_r).toBe(200)
  })
})
