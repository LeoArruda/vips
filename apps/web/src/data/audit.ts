import type { AuditEntry } from '@/types/operations'

export const stubAuditEntries: AuditEntry[] = [
  { entryId: 'ae_001', actor: 'alex@acme.io', action: 'published', resourceType: 'workflow', resourceName: 'Salesforce → BigQuery Sync', timestamp: new Date(Date.now() - 1800000).toISOString() },
  { entryId: 'ae_002', actor: 'alex@acme.io', action: 'rotated', resourceType: 'secret', resourceName: 'postgres-prod-creds', timestamp: new Date(Date.now() - 3600000).toISOString(), diff: { before: '***old***', after: '***new***' } },
  { entryId: 'ae_003', actor: 'jordan@acme.io', action: 'invited', resourceType: 'member', resourceName: 'casey@acme.io', timestamp: new Date(Date.now() - 86400000).toISOString() },
  { entryId: 'ae_004', actor: 'alex@acme.io', action: 'updated_role', resourceType: 'member', resourceName: 'sam@acme.io', timestamp: new Date(Date.now() - 172800000).toISOString(), diff: { before: 'builder', after: 'operator' } },
]
