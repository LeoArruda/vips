import type { Secret } from '@/types/platform'

export const stubSecrets: Secret[] = [
  { secretId: 'sec_001', name: 'postgres-prod-creds', scope: 'connector', environment: 'prod', linkedTo: ['conn_001'], rotationState: 'ok', lastRotatedAt: '2026-03-01T00:00:00Z', createdAt: '2025-09-01T00:00:00Z' },
  { secretId: 'sec_002', name: 'salesforce-oauth-token', scope: 'connector', environment: 'prod', linkedTo: ['conn_003'], rotationState: 'due', lastRotatedAt: '2025-10-01T00:00:00Z', createdAt: '2025-09-15T00:00:00Z' },
  { secretId: 'sec_003', name: 'stripe-api-key', scope: 'workspace', environment: 'prod', linkedTo: ['wf_002'], rotationState: 'overdue', lastRotatedAt: '2025-06-01T00:00:00Z', createdAt: '2025-06-01T00:00:00Z' },
  { secretId: 'sec_004', name: 'bigquery-service-account', scope: 'connector', environment: 'prod', linkedTo: ['conn_002'], rotationState: 'ok', lastRotatedAt: '2026-02-15T00:00:00Z', createdAt: '2025-09-20T00:00:00Z' },
]
