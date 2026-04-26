export type WorkflowStatus = 'draft' | 'published' | 'archived'
export type RunStatus = 'queued' | 'running' | 'success' | 'failed'
export type NodeStatus = 'pending' | 'running' | 'success' | 'failed' | 'skipped'
export type TriggerType = 'manual' | 'schedule' | 'webhook'
export type NodeType =
  | 'connector.source'
  | 'connector.destination'
  | 'transform.map'
  | 'logic.branch'
  | 'trigger'
export type ConnectorCategory = 'database' | 'saas' | 'storage' | 'messaging' | 'analytics'
export type AuthMethod = 'oauth2' | 'api-key' | 'basic' | 'none'
export type LogLevel = 'info' | 'warn' | 'error'
export type MemberRole = 'admin' | 'builder' | 'operator' | 'partner'

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
  position?: { x: number; y: number }
}

export interface WorkflowEdge {
  id: string
  source: string
  target: string
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

export interface CreateWorkflowRequest {
  name: string
  description?: string
  trigger: WorkflowTrigger
  nodes?: WorkflowNode[]
  edges?: WorkflowEdge[]
}

export interface UpdateWorkflowRequest {
  name?: string
  description?: string
  status?: WorkflowStatus
  trigger?: WorkflowTrigger
  nodes?: WorkflowNode[]
  edges?: WorkflowEdge[]
}

export interface CreateConnectorRequest {
  type: string
  name: string
  config: Record<string, unknown>
}

export interface CreateSecretRequest {
  name: string
  value: string
}
