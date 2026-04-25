export type SecretScope = 'workspace' | 'environment' | 'connector'
export type SecretRotationState = 'ok' | 'due' | 'overdue'
export type MemberRole = 'admin' | 'builder' | 'operator' | 'partner'
export type MemberStatus = 'active' | 'invited' | 'suspended'
export type TriggerKind = 'schedule' | 'webhook' | 'manual' | 'event'
export type TemplateCategory = 'crm' | 'analytics' | 'finance' | 'marketing' | 'devops'

export interface Secret {
  secretId: string
  name: string
  scope: SecretScope
  environment: string
  linkedTo: string[]
  rotationState: SecretRotationState
  lastRotatedAt: string
  createdAt: string
}

export interface TriggerConfig {
  triggerId: string
  workflowId: string
  workflowName: string
  kind: TriggerKind
  cron?: string
  webhookUrl?: string
  timezone?: string
  enabled: boolean
  nextRunAt?: string
  lastRunAt?: string
}

export interface Member {
  memberId: string
  name: string
  email: string
  role: MemberRole
  status: MemberStatus
  joinedAt: string
}

export interface WorkflowTemplate {
  templateId: string
  name: string
  description: string
  category: TemplateCategory
  connectors: string[]
  usageCount: number
  featured: boolean
}
