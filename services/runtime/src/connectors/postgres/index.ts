import type { Connector, ConnectorConfig, ConnectorResult } from '@vipsos/connector-sdk'
import postgres from 'postgres'

export const postgresConnector: Connector = {
  id: 'postgres',
  name: 'Postgres',

  async execute(config: ConnectorConfig, _inputs: Record<string, unknown>): Promise<ConnectorResult> {
    const { query, params = [] } = config.settings as { query: string; params?: unknown[] }
    const connectionString = config.secrets.connection_string
    const logs: ConnectorResult['logs'] = []

    if (!connectionString) {
      return {
        success: false,
        output: {},
        logs: [{ level: 'error', message: 'Missing secret: connection_string' }],
        error: 'Missing connection_string secret',
      }
    }

    if (!query?.trim()) {
      return {
        success: false,
        output: {},
        logs: [{ level: 'error', message: 'query is required' }],
        error: 'query is required',
      }
    }

    const sql = postgres(connectionString, { max: 1, connect_timeout: 10 })

    try {
      const rows = await sql.unsafe(query, params as string[])
      logs.push({ level: 'info', message: `Query returned ${rows.length} row(s)` })
      return {
        success: true,
        output: { rows: rows as Record<string, unknown>[], rowCount: rows.length },
        logs,
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      logs.push({ level: 'error', message: msg })
      return { success: false, output: {}, logs, error: msg }
    } finally {
      await sql.end({ timeout: 5 })
    }
  },
}
