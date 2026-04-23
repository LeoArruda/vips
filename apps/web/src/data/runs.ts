import type { RunRecord, RunDetail } from '@/types'

export const runRecords: RunRecord[] = [
  {
    runId: 'run_001',
    workflowId: 'wf_001',
    workflowName: 'Salesforce → BigQuery Sync',
    status: 'success',
    triggeredBy: 'schedule',
    startedAt: '2026-04-19T08:00:00Z',
    completedAt: '2026-04-19T08:02:31Z',
    durationMs: 151000,
    nodeCount: 3,
    failedNodeCount: 0,
  },
  {
    runId: 'run_002',
    workflowId: 'wf_002',
    workflowName: 'Stripe Payments Pipeline',
    status: 'failed',
    triggeredBy: 'webhook',
    startedAt: '2026-04-19T06:30:00Z',
    completedAt: '2026-04-19T06:30:04Z',
    durationMs: 4200,
    nodeCount: 4,
    failedNodeCount: 1,
  },
  {
    runId: 'run_003',
    workflowId: 'wf_004',
    workflowName: 'Postgres → Snowflake Replication',
    status: 'success',
    triggeredBy: 'schedule',
    startedAt: '2026-04-19T09:15:00Z',
    completedAt: '2026-04-19T09:15:48Z',
    durationMs: 48000,
    nodeCount: 2,
    failedNodeCount: 0,
  },
]

export const runDetails: RunDetail[] = [
  {
    runId: 'run_002',
    workflowId: 'wf_002',
    workflowName: 'Stripe Payments Pipeline',
    status: 'failed',
    triggeredBy: 'webhook',
    startedAt: '2026-04-19T06:30:00Z',
    completedAt: '2026-04-19T06:30:04Z',
    durationMs: 4200,
    nodeCount: 4,
    failedNodeCount: 1,
    nodes: [
      {
        nodeId: 'source_1',
        nodeLabel: 'Stripe Webhook',
        status: 'success',
        startedAt: '2026-04-19T06:30:00.000Z',
        completedAt: '2026-04-19T06:30:00.400Z',
        durationMs: 400,
        logs: [
          {
            timestamp: '2026-04-19T06:30:00.100Z',
            level: 'info',
            message: 'Received webhook event: payment_intent.succeeded',
          },
          {
            timestamp: '2026-04-19T06:30:00.400Z',
            level: 'info',
            message: 'Payload validated, 1 event extracted',
          },
        ],
      },
      {
        nodeId: 'logic_1',
        nodeLabel: 'Route by Status',
        status: 'success',
        startedAt: '2026-04-19T06:30:00.400Z',
        completedAt: '2026-04-19T06:30:00.500Z',
        durationMs: 100,
        logs: [
          {
            timestamp: '2026-04-19T06:30:00.500Z',
            level: 'info',
            message: 'Condition matched: routing to success branch',
          },
        ],
      },
      {
        nodeId: 'dest_success',
        nodeLabel: 'Postgres',
        status: 'failed',
        startedAt: '2026-04-19T06:30:00.500Z',
        completedAt: '2026-04-19T06:30:04.000Z',
        durationMs: 3500,
        logs: [
          {
            timestamp: '2026-04-19T06:30:00.500Z',
            level: 'info',
            message: 'Connecting to Postgres at db.internal:5432...',
          },
          {
            timestamp: '2026-04-19T06:30:02.000Z',
            level: 'warn',
            message: 'Retry 1/3 — connection timeout after 1500ms',
          },
          {
            timestamp: '2026-04-19T06:30:03.000Z',
            level: 'warn',
            message: 'Retry 2/3 — connection timeout after 1000ms',
          },
          {
            timestamp: '2026-04-19T06:30:04.000Z',
            level: 'error',
            message: 'Failed after 3 retries: connection refused on port 5432',
          },
        ],
      },
    ],
  },
]
