import type { MonitoringStats, LiveRunEntry } from '@/types/operations'

export const stubMonitoringStats: MonitoringStats = {
  activeRuns: 142,
  failedLastHour: 7,
  workersDegraded: 1,
  workers: [
    { workerId: 'w_001', name: 'Worker-1', health: 'healthy', activeRuns: 58 },
    { workerId: 'w_002', name: 'Worker-2', health: 'healthy', activeRuns: 61 },
    { workerId: 'w_003', name: 'Worker-3', health: 'degraded', activeRuns: 23 },
  ],
}

export const stubLiveRuns: LiveRunEntry[] = [
  { runId: 'r_101', workflowName: 'Salesforce → BigQuery Sync', status: 'running', startedAt: new Date(Date.now() - 32000).toISOString() },
  { runId: 'r_102', workflowName: 'Stripe Payments Pipeline', status: 'failed', startedAt: new Date(Date.now() - 65000).toISOString(), durationMs: 65000 },
  { runId: 'r_103', workflowName: 'HubSpot Contact Enrichment', status: 'success', startedAt: new Date(Date.now() - 120000).toISOString(), durationMs: 120000 },
  { runId: 'r_104', workflowName: 'Nightly Archive', status: 'running', startedAt: new Date(Date.now() - 8000).toISOString() },
]
