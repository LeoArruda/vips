export type WorkflowStatus = 'draft' | 'published' | 'archived'
export type RunStatus = 'pending' | 'running' | 'success' | 'failed' | 'cancelled'
export type NodeStatus = 'pending' | 'running' | 'success' | 'failed' | 'skipped'
export type TriggerType = 'manual' | 'schedule' | 'webhook'
export type NodeType =
  | 'connector.source'
  | 'connector.destination'
  | 'transform.map'
  | 'transform.filter'
  | 'transform.join'
  | 'transform.merge'
  | 'transform.union'
  | 'transform.convert'
  | 'transform.derive'
  | 'transform.aggregate'
  | 'transform.flatten'
  | 'transform.lookup'
  | 'transform.validate'
  | 'transform.cleanse'
  | 'transform.code'
  | 'logic.branch'
  | 'trigger'

export type TransformNodeType = Extract<NodeType, `transform.${string}`>

export interface SchemaField {
  name: string
  type: 'string' | 'number' | 'boolean' | 'date' | 'object' | 'array' | 'unknown'
  nullable?: boolean
}
export type ConnectorCategory = 'database' | 'saas' | 'storage' | 'messaging' | 'analytics'
export type AuthMethod = 'oauth2' | 'api-key' | 'basic' | 'none'
export type LogLevel = 'info' | 'warn' | 'error'

export interface WorkflowTrigger {
  type: TriggerType
  cron?: string
  webhookUrl?: string
}

export interface WorkflowNode {
  id: string
  type: NodeType
  label: string
  config: Record<string, unknown>
  connectorId?: string
}

export interface WorkflowEdge {
  id: string
  source: string
  target: string
  sourceHandle?: string
  targetHandle?: string
}

export interface WorkflowDefinition {
  workflowId: string
  version: number
  status: WorkflowStatus
  name: string
  description?: string
  trigger: WorkflowTrigger
  nodes: WorkflowNode[]
  edges: WorkflowEdge[]
}

export interface WorkflowSummary {
  workflowId: string
  name: string
  status: WorkflowStatus
  lastRunAt?: string
  lastRunStatus?: RunStatus
  updatedAt: string
  trigger: WorkflowTrigger
}

export interface ConnectorCard {
  connectorId: string
  name: string
  description: string
  category: ConnectorCategory
  authMethod: AuthMethod
  logoInitial: string
  certified: boolean
  installed: boolean
}

export interface ConnectorAction {
  actionId: string
  name: string
  description: string
}

export interface ConnectorDetail extends ConnectorCard {
  version: string
  actions: ConnectorAction[]
  authRequirements: string[]
  docsUrl?: string
}

export interface NodeLogEntry {
  timestamp: string
  level: LogLevel
  message: string
}

export interface NodeRunDetail {
  nodeId: string
  nodeLabel: string
  status: NodeStatus
  startedAt?: string
  completedAt?: string
  durationMs?: number
  logs: NodeLogEntry[]
}

export interface RunRecord {
  runId: string
  workflowId: string
  workflowName: string
  status: RunStatus
  triggeredBy: 'manual' | 'schedule' | 'webhook'
  startedAt: string
  completedAt?: string
  durationMs?: number
  nodeCount: number
  failedNodeCount: number
}

export interface RunDetail extends RunRecord {
  nodes: NodeRunDetail[]
}

export interface DashboardStats {
  totalWorkflows: number
  activeWorkflows: number
  totalRunsToday: number
  failedRunsToday: number
  successRate: number
  connectorCount: number
  recentRuns: RunRecord[]
  failedRuns: RunRecord[]
}
