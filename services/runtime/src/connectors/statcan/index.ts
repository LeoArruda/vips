import type { Connector, ConnectorConfig, ConnectorResult } from '@vipsos/connector-sdk'

interface StatCanResponse {
  productId?: number
  uom?: string
  scalar?: string
  object?: Array<{ refPer: string; value: string; symbols?: string; status?: string }>
}

export const statcanConnector: Connector = {
  id: 'statcan',
  name: 'Statistics Canada',

  async execute(config: ConnectorConfig, _inputs: Record<string, unknown>): Promise<ConnectorResult> {
    const { table_code } = config.settings as { table_code?: string }
    const logs: ConnectorResult['logs'] = []

    if (!table_code) {
      return {
        success: false,
        output: {},
        logs: [{ level: 'error', message: 'table_code is required' }],
        error: 'table_code is required',
      }
    }

    const url = `https://www150.statcan.gc.ca/t1/tbl1/en/dtbl/${table_code}/json`

    try {
      const res = await fetch(url)
      if (!res.ok) {
        const msg = `StatCan API returned ${res.status} for table ${table_code}`
        return { success: false, output: {}, logs: [{ level: 'error', message: msg }], error: msg }
      }

      const json = (await res.json()) as StatCanResponse
      logs.push({ level: 'info', message: `Fetched table ${table_code} from Statistics Canada` })

      const rows = (json.object ?? []).map((point) => ({
        refPer: point.refPer,
        value: parseFloat(point.value),
        uom: json.uom ?? 'unknown',
        scalar: json.scalar ?? 'units',
      }))

      logs.push({ level: 'info', message: `Normalized ${rows.length} data point(s)` })

      return {
        success: true,
        output: { rows, rowCount: rows.length },
        logs,
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      logs.push({ level: 'error', message: msg })
      return { success: false, output: {}, logs, error: msg }
    }
  },
}
