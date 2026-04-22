import type { DashboardStats } from '@/types'
import { runRecords } from './runs'

export const dashboardStats: DashboardStats = {
  totalWorkflows: 4,
  activeWorkflows: 3,
  totalRunsToday: 12,
  failedRunsToday: 1,
  successRate: 91.7,
  connectorCount: 8,
  recentRuns: runRecords,
  failedRuns: runRecords.filter((r) => r.status === 'failed'),
}
