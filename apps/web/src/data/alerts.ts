import type { AlertRule, Incident } from '@/types/operations'

export const stubAlertRules: AlertRule[] = [
  { ruleId: 'ar_001', name: 'Failed run spike', condition: 'failed_runs > threshold', threshold: '5 in 10 min', destinations: ['slack', 'email'], enabled: true },
  { ruleId: 'ar_002', name: 'Worker degraded', condition: 'worker_health == degraded', threshold: 'any worker', destinations: ['slack'], enabled: true },
  { ruleId: 'ar_003', name: 'Quota near limit', condition: 'usage > 90%', threshold: '90% of plan limit', destinations: ['email'], enabled: false },
]

export const stubIncidents: Incident[] = [
  { incidentId: 'inc_001', ruleId: 'ar_001', ruleName: 'Failed run spike', severity: 'critical', triggeredAt: new Date(Date.now() - 3600000).toISOString(), acknowledged: false },
  { incidentId: 'inc_002', ruleId: 'ar_002', ruleName: 'Worker degraded', severity: 'warning', triggeredAt: new Date(Date.now() - 7200000).toISOString(), resolvedAt: new Date(Date.now() - 3600000).toISOString(), acknowledged: true },
]
