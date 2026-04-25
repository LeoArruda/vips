import type { TriggerConfig } from '@/types/platform'

export const stubTriggers: TriggerConfig[] = [
  { triggerId: 'tr_001', workflowId: 'wf_001', workflowName: 'Salesforce → BigQuery Sync', kind: 'schedule', cron: '0 8 * * *', timezone: 'UTC', enabled: true, nextRunAt: '2026-04-23T08:00:00Z', lastRunAt: '2026-04-22T08:00:00Z' },
  { triggerId: 'tr_002', workflowId: 'wf_002', workflowName: 'Stripe Payments Pipeline', kind: 'webhook', webhookUrl: 'https://hooks.vipsos.io/wf_002/abc123', enabled: true, lastRunAt: '2026-04-22T06:30:00Z' },
  { triggerId: 'tr_003', workflowId: 'wf_004', workflowName: 'Nightly Archive', kind: 'schedule', cron: '0 2 * * *', timezone: 'America/New_York', enabled: false, nextRunAt: undefined, lastRunAt: '2026-04-21T02:00:00Z' },
]
