import type { Member } from '@/types/platform'

export const stubMembers: Member[] = [
  { memberId: 'u_001', name: 'Alex Rivera', email: 'alex@acme.io', role: 'admin', status: 'active', joinedAt: '2025-09-01T00:00:00Z' },
  { memberId: 'u_002', name: 'Jordan Kim', email: 'jordan@acme.io', role: 'builder', status: 'active', joinedAt: '2025-10-15T00:00:00Z' },
  { memberId: 'u_003', name: 'Sam Patel', email: 'sam@acme.io', role: 'operator', status: 'active', joinedAt: '2026-01-10T00:00:00Z' },
  { memberId: 'u_004', name: 'Casey Chen', email: 'casey@acme.io', role: 'builder', status: 'invited', joinedAt: '2026-04-20T00:00:00Z' },
]
