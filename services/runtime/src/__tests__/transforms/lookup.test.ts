import { describe, it, expect } from 'bun:test'
import { execute } from '../../transforms/lookup.ts'

const ctx = { log: () => {}, getNodeOutput: () => [] }

const countries = [
  { code: 'CA', name: 'Canada', continent: 'North America' },
  { code: 'US', name: 'United States', continent: 'North America' },
]

describe('transform.lookup', () => {
  it('enriches records with fields from inline reference data', async () => {
    const records = [{ user_id: 1, country_code: 'CA' }]
    const config = {
      lookupKey: 'country_code',
      inlineData: JSON.stringify(countries),
      enrichFields: [
        { sourceField: 'code', targetField: 'country_code' },
        { sourceField: 'name', targetField: 'country_name' },
      ],
    }
    const result = await execute(records, config, ctx)
    expect(result[0].country_name).toBe('Canada')
  })

  it('leaves records untouched when no match is found', async () => {
    const records = [{ country_code: 'XX' }]
    const config = {
      lookupKey: 'country_code',
      inlineData: JSON.stringify(countries),
      enrichFields: [{ sourceField: 'name', targetField: 'country_name' }],
    }
    const result = await execute(records, config, ctx)
    expect(result[0].country_name).toBeUndefined()
  })

  it('returns records unchanged when inlineData is not valid JSON', async () => {
    const warnings: string[] = []
    const warnCtx = { log: (_l: string, msg: string) => { warnings.push(msg) }, getNodeOutput: () => [] }
    const records = [{ code: 'CA' }]
    const config = { lookupKey: 'code', inlineData: 'not json', enrichFields: [] }
    const result = await execute(records, config, warnCtx as typeof ctx)
    expect(result).toEqual(records)
    expect(warnings.length).toBeGreaterThan(0)
  })
})
