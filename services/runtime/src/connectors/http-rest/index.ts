import type { Connector, ConnectorConfig, ConnectorResult } from '@vipsos/connector-sdk'

export const httpRestConnector: Connector = {
  id: 'http-rest',
  name: 'HTTP / REST',

  async execute(config: ConnectorConfig, _inputs: Record<string, unknown>): Promise<ConnectorResult> {
    const { method = 'GET', url, headers = {}, body } = config.settings as {
      method?: string
      url: string
      headers?: Record<string, string>
      body?: unknown
    }

    const logs: ConnectorResult['logs'] = []

    if (!url) {
      return { success: false, output: {}, logs: [{ level: 'error', message: 'url is required' }], error: 'url is required' }
    }

    try {
      const res = await fetch(url, {
        method: String(method),
        headers: {
          'Content-Type': 'application/json',
          ...(headers as Record<string, string>),
        },
        body: body !== undefined ? JSON.stringify(body) : undefined,
      })

      const contentType = res.headers.get('content-type') ?? ''
      const responseBody = contentType.includes('application/json')
        ? await res.json()
        : await res.text()

      logs.push({ level: 'info', message: `${method} ${url} → ${res.status}` })

      return {
        success: res.ok,
        output: {
          status: res.status,
          headers: Object.fromEntries(res.headers.entries()),
          body: responseBody,
        },
        logs,
        error: res.ok ? undefined : `HTTP ${res.status}`,
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      logs.push({ level: 'error', message: msg })
      return { success: false, output: {}, logs, error: msg }
    }
  },
}
