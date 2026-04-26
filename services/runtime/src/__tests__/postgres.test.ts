import { describe, it, expect } from 'bun:test'
import { postgresConnector } from '../connectors/postgres/index.ts'

const CONN = process.env.SUPABASE_DB_URL ?? 'postgresql://postgres:postgres@127.0.0.1:54322/postgres'

describe('postgresConnector', () => {
  it('executes a SELECT and returns rows', async () => {
    const result = await postgresConnector.execute(
      { type: 'postgres', settings: { query: 'SELECT 1 AS one, 2 AS two' }, secrets: { connection_string: CONN } },
      {},
    )
    expect(result.success).toBe(true)
    expect(result.output.rowCount).toBe(1)
    const rows = result.output.rows as Array<{ one: number; two: number }>
    expect(rows[0].one).toBe(1)
  })

  it('fails gracefully on invalid SQL', async () => {
    const result = await postgresConnector.execute(
      { type: 'postgres', settings: { query: 'INVALID SQL STATEMENT' }, secrets: { connection_string: CONN } },
      {},
    )
    expect(result.success).toBe(false)
    expect(result.error).toBeTruthy()
    expect(result.logs[0].level).toBe('error')
  })

  it('fails when connection_string secret is missing', async () => {
    const result = await postgresConnector.execute(
      { type: 'postgres', settings: { query: 'SELECT 1' }, secrets: {} },
      {},
    )
    expect(result.success).toBe(false)
    expect(result.error).toContain('connection_string')
  })

  it('fails gracefully on unreachable host', async () => {
    const result = await postgresConnector.execute(
      {
        type: 'postgres',
        settings: { query: 'SELECT 1' },
        secrets: { connection_string: 'postgresql://bad:bad@localhost:9999/nope' },
      },
      {},
    )
    expect(result.success).toBe(false)
  })
})
