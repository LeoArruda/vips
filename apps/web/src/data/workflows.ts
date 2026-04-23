import type { WorkflowSummary, WorkflowDefinition } from '@/types'

export const workflowSummaries: WorkflowSummary[] = [
  {
    workflowId: 'wf_001',
    name: 'Salesforce → BigQuery Sync',
    status: 'published',
    lastRunAt: '2026-04-19T08:00:00Z',
    lastRunStatus: 'success',
    updatedAt: '2026-04-18T14:30:00Z',
    trigger: { type: 'schedule', cron: '0 8 * * *' },
  },
  {
    workflowId: 'wf_002',
    name: 'Stripe Payments Pipeline',
    status: 'published',
    lastRunAt: '2026-04-19T06:30:00Z',
    lastRunStatus: 'failed',
    updatedAt: '2026-04-17T10:00:00Z',
    trigger: { type: 'webhook' },
  },
  {
    workflowId: 'wf_003',
    name: 'HubSpot Contact Enrichment',
    status: 'draft',
    updatedAt: '2026-04-19T11:00:00Z',
    trigger: { type: 'manual' },
  },
  {
    workflowId: 'wf_004',
    name: 'Postgres → Snowflake Replication',
    status: 'published',
    lastRunAt: '2026-04-19T09:15:00Z',
    lastRunStatus: 'success',
    updatedAt: '2026-04-15T09:00:00Z',
    trigger: { type: 'schedule', cron: '*/15 * * * *' },
  },
]

export const workflowDefinitions: WorkflowDefinition[] = [
  {
    workflowId: 'wf_001',
    version: 3,
    status: 'published',
    name: 'Salesforce → BigQuery Sync',
    description: 'Syncs Salesforce contacts to BigQuery daily.',
    trigger: { type: 'schedule', cron: '0 8 * * *' },
    nodes: [
      {
        id: 'source_1',
        type: 'connector.source',
        label: 'Salesforce',
        config: { object: 'Contact', fields: ['Id', 'Name', 'Email', 'AccountId'] },
        connectorId: 'conn_salesforce',
      },
      {
        id: 'transform_1',
        type: 'transform.map',
        label: 'Map Fields',
        config: { mappings: { id: 'Id', name: 'Name', email: 'Email' } },
      },
      {
        id: 'dest_1',
        type: 'connector.destination',
        label: 'BigQuery',
        config: { dataset: 'crm', table: 'contacts', writeDisposition: 'WRITE_TRUNCATE' },
        connectorId: 'conn_bigquery',
      },
    ],
    edges: [
      { id: 'e1', source: 'source_1', target: 'transform_1' },
      { id: 'e2', source: 'transform_1', target: 'dest_1' },
    ],
  },
  {
    workflowId: 'wf_002',
    version: 1,
    status: 'published',
    name: 'Stripe Payments Pipeline',
    description: 'Routes Stripe payment events to Postgres or Slack based on status.',
    trigger: { type: 'webhook' },
    nodes: [
      {
        id: 'source_1',
        type: 'connector.source',
        label: 'Stripe Webhook',
        config: { events: ['payment_intent.succeeded', 'payment_intent.failed'] },
        connectorId: 'conn_stripe',
      },
      {
        id: 'logic_1',
        type: 'logic.branch',
        label: 'Route by Status',
        config: { condition: 'event.type === "payment_intent.succeeded"' },
      },
      {
        id: 'dest_success',
        type: 'connector.destination',
        label: 'Postgres',
        config: { table: 'successful_payments' },
        connectorId: 'conn_postgres',
      },
      {
        id: 'dest_failed',
        type: 'connector.destination',
        label: 'Slack Alert',
        config: { channel: '#payments-alerts' },
        connectorId: 'conn_slack',
      },
    ],
    edges: [
      { id: 'e1', source: 'source_1', target: 'logic_1' },
      { id: 'e2', source: 'logic_1', target: 'dest_success' },
      { id: 'e3', source: 'logic_1', target: 'dest_failed' },
    ],
  },
  {
    workflowId: 'wf_004',
    version: 2,
    status: 'published',
    name: 'Postgres → Snowflake Replication',
    description: 'Incremental replication from Postgres to Snowflake every 15 minutes.',
    trigger: { type: 'schedule', cron: '*/15 * * * *' },
    nodes: [
      {
        id: 'source_1',
        type: 'connector.source',
        label: 'Postgres',
        config: { table: 'orders', incrementalKey: 'updated_at' },
        connectorId: 'conn_postgres',
      },
      {
        id: 'dest_1',
        type: 'connector.destination',
        label: 'Snowflake',
        config: { database: 'PROD', schema: 'PUBLIC', table: 'ORDERS' },
        connectorId: 'conn_snowflake',
      },
    ],
    edges: [{ id: 'e1', source: 'source_1', target: 'dest_1' }],
  },
]
