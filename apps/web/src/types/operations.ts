export type EnvironmentType = 'cloud' | 'agent'
export type EnvironmentHealth = 'healthy' | 'degraded' | 'offline'
export type AlertSeverity = 'critical' | 'warning' | 'info'
export type AlertDestination = 'slack' | 'email' | 'webhook'
export type MarketplaceCategory = 'CRM' | 'Databases' | 'Cloud Storage' | 'Marketing' | 'Finance' | 'Analytics' | 'Communication'
export type MarketplacePricing = 'free' | 'per-use' | 'subscription'
export type CertificationStatus = 'certified' | 'community' | 'draft'
export type ConnectorDraftStep = 'metadata' | 'auth' | 'endpoints' | 'schema' | 'test'

export interface WorkerHealth {
  workerId: string
  name: string
  health: EnvironmentHealth
  activeRuns: number
}

export interface MonitoringStats {
  activeRuns: number
  failedLastHour: number
  workersDegraded: number
  workers: WorkerHealth[]
}

export interface LiveRunEntry {
  runId: string
  workflowName: string
  status: 'running' | 'success' | 'failed'
  startedAt: string
  durationMs?: number
}

export interface Environment {
  envId: string
  name: string
  type: EnvironmentType
  health: EnvironmentHealth
  workerCount: number
  region?: string
  agentVersion?: string
  assignedWorkflows: string[]
}

export interface AlertRule {
  ruleId: string
  name: string
  condition: string
  threshold: string
  destinations: AlertDestination[]
  enabled: boolean
}

export interface Incident {
  incidentId: string
  ruleId: string
  ruleName: string
  severity: AlertSeverity
  triggeredAt: string
  resolvedAt?: string
  acknowledged: boolean
}

export interface AuditEntry {
  entryId: string
  actor: string
  action: string
  resourceType: string
  resourceName: string
  timestamp: string
  diff?: { before: string; after: string }
}

export interface UsageMeter {
  dimension: string
  used: number
  limit: number
  unit: string
}

export interface BillingInfo {
  plan: string
  renewsAt: string
  seatCount: number
  meters: UsageMeter[]
}

export interface MarketplaceListing {
  listingId: string
  name: string
  publisher: string
  domain: string
  category: MarketplaceCategory
  description: string
  pricing: MarketplacePricing
  priceLabel: string
  certification: CertificationStatus
  installs: number
  type: 'connector' | 'template'
}

export interface ConnectorDraft {
  draftId: string
  name: string
  currentStep: ConnectorDraftStep
  metadata: Record<string, unknown>
  authConfig: Record<string, unknown>
}
