import { describe, it, expect, spyOn, afterEach } from 'bun:test'
import statcanFixture from './fixtures/statcan-response.json'
import { statcanConnector } from '../connectors/statcan/index.ts'

let fetchSpy: ReturnType<typeof spyOn<typeof globalThis, 'fetch'>> | undefined

afterEach(() => {
  fetchSpy?.mockRestore()
})

function mockFetch(body: unknown, status = 200) {
  fetchSpy = spyOn(globalThis, 'fetch').mockResolvedValue(
    new Response(JSON.stringify(body), {
      status,
      headers: { 'content-type': 'application/json' },
    }),
  )
}

describe('statcanConnector', () => {
  it('fetches and normalizes StatCan data points', async () => {
    mockFetch(statcanFixture)
    const result = await statcanConnector.execute(
      { type: 'statcan', settings: { table_code: '14-10-0287-01' }, secrets: {} },
      {},
    )
    expect(result.success).toBe(true)
    const rows = result.output.rows as Array<{ refPer: string; value: number; uom: string; scalar: string }>
    expect(rows.length).toBe(3)
    expect(rows[0].refPer).toBe('2024-01')
    expect(rows[0].value).toBe(5.7)
    expect(rows[0].uom).toBe('Percent')
    expect(rows[0].scalar).toBe('units')
  })

  it('returns error on non-200 response', async () => {
    mockFetch('Not Found', 404)
    const result = await statcanConnector.execute(
      { type: 'statcan', settings: { table_code: '00-00-0000-00' }, secrets: {} },
      {},
    )
    expect(result.success).toBe(false)
    expect(result.error).toContain('404')
  })

  it('returns error when table_code is missing', async () => {
    const result = await statcanConnector.execute(
      { type: 'statcan', settings: {}, secrets: {} },
      {},
    )
    expect(result.success).toBe(false)
    expect(result.error).toContain('table_code')
  })
})
