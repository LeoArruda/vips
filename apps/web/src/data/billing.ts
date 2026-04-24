import type { BillingInfo } from '@/types/operations'

export const stubBilling: BillingInfo = {
  plan: 'Growth',
  renewsAt: '2026-05-22',
  seatCount: 4,
  meters: [
    { dimension: 'Workflow runs', used: 84200, limit: 100000, unit: 'runs' },
    { dimension: 'Data volume', used: 38, limit: 50, unit: 'GB' },
    { dimension: 'Active connectors', used: 4, limit: 10, unit: 'connectors' },
    { dimension: 'Marketplace items', used: 1, limit: 3, unit: 'items' },
  ],
}
