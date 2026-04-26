export interface ConnectorConfig {
  type: string
  settings: Record<string, unknown>
  secrets: Record<string, string>
}

export interface ConnectorResult {
  success: boolean
  output: Record<string, unknown>
  logs: Array<{ level: 'info' | 'warn' | 'error'; message: string }>
  error?: string
}

export interface Connector {
  id: string
  name: string
  execute(config: ConnectorConfig, inputs: Record<string, unknown>): Promise<ConnectorResult>
}
