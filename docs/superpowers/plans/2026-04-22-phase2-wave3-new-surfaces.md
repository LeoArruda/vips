# Phase 2 Wave 3 — New Surfaces

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement all 8 new surfaces that have no prior wireframe (Monitoring, Alerts, Environments, Billing, Audit, Marketplace, Connector Builder, Embedded), plus add all 11 supporting flows and 10 failure states as inline interactions within existing pages.

**Architecture:** Each surface follows the same pattern as previous waves: typed stub data → Pinia store → Vue view. `MarketplaceCard` is extracted as a shared component since it's used in both the Marketplace view and the Connectors catalog. `EmbeddedView` uses its own layout (no `AppShell`). Supporting flows and failure states are added as inline interactions within the views already built.

**Tech Stack:** Vue 3 `<script setup lang="ts">`, Pinia, Tailwind CSS, Vitest + @vue/test-utils. All commands from `apps/web/`. Logo fetching uses `https://logo.clearbit.com/{domain}` with an initials+color avatar fallback.

**Prerequisite:** Wave 1 and Wave 2 plans must be complete.

---

## File Map

| Action | Path | Responsibility |
|--------|------|---------------|
| Create | `src/types/operations.ts` | Environment, MonitoringStats, AlertRule, Incident, AuditEntry, BillingInfo, MarketplaceListing, ConnectorDraft types |
| Create | `src/data/monitoring.ts` | Stub monitoring stats and live run feed |
| Create | `src/data/environments.ts` | Stub environments / data planes |
| Create | `src/data/alerts.ts` | Stub alert rules and incidents |
| Create | `src/data/audit.ts` | Stub audit entries |
| Create | `src/data/billing.ts` | Stub billing and usage data |
| Create | `src/data/marketplace.ts` | Stub marketplace listings |
| Create | `src/data/connector-draft.ts` | Stub connector drafts |
| Create | `src/stores/monitoring.ts` | useMonitoringStore |
| Create | `src/stores/environments.ts` | useEnvironmentsStore |
| Create | `src/stores/marketplace.ts` | useMarketplaceStore |
| Create | `src/stores/__tests__/monitoring.test.ts` | Store tests |
| Create | `src/stores/__tests__/environments.test.ts` | Store tests |
| Create | `src/stores/__tests__/marketplace.test.ts` | Store tests |
| Replace | `src/views/MonitoringView.vue` | 3-zone observability dashboard |
| Replace | `src/views/AlertsView.vue` | Alert rules + incidents |
| Replace | `src/views/EnvironmentsView.vue` | Card grid + slide-over detail |
| Replace | `src/views/BillingView.vue` | Plan + usage meters |
| Replace | `src/views/AuditView.vue` | Filterable audit table |
| Create | `src/components/marketplace/MarketplaceCard.vue` | Logo + fallback avatar card |
| Replace | `src/views/MarketplaceView.vue` | Hub with 3 tabs + search/filter |
| Replace | `src/views/MarketplaceListingView.vue` | Listing detail page |
| Replace | `src/views/ConnectorBuilderView.vue` | 5-step wizard |
| Replace | `src/views/EmbeddedView.vue` | 3-screen iframe-safe flow |
| Modify | `src/views/WorkflowsView.vue` | Add duplicate, archive, export inline flows |
| Modify | `src/views/ConnectorsView.vue` | Add expired-auth warning banner + reconnect flow |

---

## Task 1: Operations types and stub data

**Files:**
- Create: `src/types/operations.ts`
- Create: `src/data/monitoring.ts`
- Create: `src/data/environments.ts`
- Create: `src/data/alerts.ts`
- Create: `src/data/audit.ts`
- Create: `src/data/billing.ts`
- Create: `src/data/marketplace.ts`
- Create: `src/data/connector-draft.ts`

- [ ] **Step 1: Create operations types**

```typescript
// src/types/operations.ts
export type EnvironmentType = 'cloud' | 'agent'
export type EnvironmentHealth = 'healthy' | 'degraded' | 'offline'
export type AlertSeverity = 'critical' | 'warning' | 'info'
export type AlertDestination = 'slack' | 'email' | 'webhook'
export type MarketplaceCategory = 'CRM' | 'Databases' | 'Cloud Storage' | 'Marketing' | 'Finance' | 'Analytics' | 'Communication'
export type MarketplacePricing = 'free' | 'per-use' | 'subscription'
export type CertificationStatus = 'certified' | 'community' | 'draft'
export type ConnectorDraftStep = 'metadata' | 'auth' | 'endpoints' | 'schema' | 'test'

export interface WorkerHealth {
  workerId: string
  name: string
  health: EnvironmentHealth
  activeRuns: number
}

export interface MonitoringStats {
  activeRuns: number
  failedLastHour: number
  workersDegraded: number
  workers: WorkerHealth[]
}

export interface LiveRunEntry {
  runId: string
  workflowName: string
  status: 'running' | 'success' | 'failed'
  startedAt: string
  durationMs?: number
}

export interface Environment {
  envId: string
  name: string
  type: EnvironmentType
  health: EnvironmentHealth
  workerCount: number
  region?: string
  agentVersion?: string
  assignedWorkflows: string[]
}

export interface AlertRule {
  ruleId: string
  name: string
  condition: string
  threshold: string
  destinations: AlertDestination[]
  enabled: boolean
}

export interface Incident {
  incidentId: string
  ruleId: string
  ruleName: string
  severity: AlertSeverity
  triggeredAt: string
  resolvedAt?: string
  acknowledged: boolean
}

export interface AuditEntry {
  entryId: string
  actor: string
  action: string
  resourceType: string
  resourceName: string
  timestamp: string
  diff?: { before: string; after: string }
}

export interface UsageMeter {
  dimension: string
  used: number
  limit: number
  unit: string
}

export interface BillingInfo {
  plan: string
  renewsAt: string
  seatCount: number
  meters: UsageMeter[]
}

export interface MarketplaceListing {
  listingId: string
  name: string
  publisher: string
  domain: string
  category: MarketplaceCategory
  description: string
  pricing: MarketplacePricing
  priceLabel: string
  certification: CertificationStatus
  installs: number
  type: 'connector' | 'template'
}

export interface ConnectorDraft {
  draftId: string
  name: string
  currentStep: ConnectorDraftStep
  metadata: Record<string, unknown>
  authConfig: Record<string, unknown>
}
```

- [ ] **Step 2: Create stub data files**

```typescript
// src/data/monitoring.ts
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
```

```typescript
// src/data/environments.ts
import type { Environment } from '@/types/operations'

export const stubEnvironments: Environment[] = [
  { envId: 'env_001', name: 'Cloud (default)', type: 'cloud', health: 'healthy', workerCount: 3, region: 'us-east-1', agentVersion: '1.4.2', assignedWorkflows: ['wf_001', 'wf_002', 'wf_003'] },
  { envId: 'env_002', name: 'On-Premise EU', type: 'agent', health: 'degraded', workerCount: 2, region: 'eu-west-1', agentVersion: '1.3.8', assignedWorkflows: ['wf_004'] },
]
```

```typescript
// src/data/alerts.ts
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
```

```typescript
// src/data/audit.ts
import type { AuditEntry } from '@/types/operations'

export const stubAuditEntries: AuditEntry[] = [
  { entryId: 'ae_001', actor: 'alex@acme.io', action: 'published', resourceType: 'workflow', resourceName: 'Salesforce → BigQuery Sync', timestamp: new Date(Date.now() - 1800000).toISOString() },
  { entryId: 'ae_002', actor: 'alex@acme.io', action: 'rotated', resourceType: 'secret', resourceName: 'postgres-prod-creds', timestamp: new Date(Date.now() - 3600000).toISOString(), diff: { before: '***old***', after: '***new***' } },
  { entryId: 'ae_003', actor: 'jordan@acme.io', action: 'invited', resourceType: 'member', resourceName: 'casey@acme.io', timestamp: new Date(Date.now() - 86400000).toISOString() },
  { entryId: 'ae_004', actor: 'alex@acme.io', action: 'updated_role', resourceType: 'member', resourceName: 'sam@acme.io', timestamp: new Date(Date.now() - 172800000).toISOString(), diff: { before: 'builder', after: 'operator' } },
]
```

```typescript
// src/data/billing.ts
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
```

```typescript
// src/data/marketplace.ts
import type { MarketplaceListing } from '@/types/operations'

export const stubListings: MarketplaceListing[] = [
  { listingId: 'ml_001', name: 'Salesforce CRM', publisher: 'Salesforce Inc.', domain: 'salesforce.com', category: 'CRM', description: 'Sync contacts, leads, and opportunities bidirectionally.', pricing: 'per-use', priceLabel: '$0.02 / 1k records', certification: 'certified', installs: 14200, type: 'connector' },
  { listingId: 'ml_002', name: 'HubSpot', publisher: 'HubSpot Inc.', domain: 'hubspot.com', category: 'CRM', description: 'Contacts, deals, forms, and email campaigns.', pricing: 'subscription', priceLabel: '$15 / month', certification: 'certified', installs: 9800, type: 'connector' },
  { listingId: 'ml_003', name: 'BigQuery', publisher: 'Google LLC', domain: 'google.com', category: 'Analytics', description: 'Read and write large-scale analytical datasets.', pricing: 'free', priceLabel: 'Free', certification: 'certified', installs: 22100, type: 'connector' },
  { listingId: 'ml_004', name: 'Slack', publisher: 'Slack Technologies', domain: 'slack.com', category: 'Communication', description: 'Send messages, manage channels, react to events.', pricing: 'free', priceLabel: 'Free', certification: 'certified', installs: 31400, type: 'connector' },
  { listingId: 'ml_005', name: 'Snowflake', publisher: 'Snowflake Inc.', domain: 'snowflake.com', category: 'Databases', description: 'Cloud data warehouse with high-performance queries.', pricing: 'per-use', priceLabel: '$0.05 / 1k rows', certification: 'certified', installs: 7600, type: 'connector' },
  { listingId: 'ml_006', name: 'Stripe', publisher: 'Stripe Inc.', domain: 'stripe.com', category: 'Finance', description: 'Capture payment events and reconcile transactions.', pricing: 'free', priceLabel: 'Free', certification: 'certified', installs: 18700, type: 'connector' },
  { listingId: 'ml_007', name: 'CRM Contact Sync', publisher: 'vipsOS Templates', domain: 'vipsos.io', category: 'CRM', description: 'Sync contacts from any CRM to your data warehouse.', pricing: 'free', priceLabel: 'Free', certification: 'certified', installs: 2340, type: 'template' },
  { listingId: 'ml_008', name: 'Payment Pipeline', publisher: 'vipsOS Templates', domain: 'vipsos.io', category: 'Finance', description: 'Capture Stripe events and route to analytics.', pricing: 'free', priceLabel: 'Free', certification: 'certified', installs: 1870, type: 'template' },
]
```

```typescript
// src/data/connector-draft.ts
import type { ConnectorDraft } from '@/types/operations'

export const stubConnectorDrafts: ConnectorDraft[] = []
```

- [ ] **Step 3: Commit**

```bash
git add src/types/operations.ts src/data/monitoring.ts src/data/environments.ts src/data/alerts.ts src/data/audit.ts src/data/billing.ts src/data/marketplace.ts src/data/connector-draft.ts
git commit -m "feat(wave3): add operations types and all stub data"
```

---

## Task 2: Pinia stores — Monitoring, Environments, Marketplace

**Files:**
- Create: `src/stores/monitoring.ts`
- Create: `src/stores/environments.ts`
- Create: `src/stores/marketplace.ts`
- Create: `src/stores/__tests__/monitoring.test.ts`
- Create: `src/stores/__tests__/environments.test.ts`
- Create: `src/stores/__tests__/marketplace.test.ts`

- [ ] **Step 1: Write failing store tests**

```typescript
// src/stores/__tests__/monitoring.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useMonitoringStore } from '../monitoring'

describe('useMonitoringStore', () => {
  beforeEach(() => { setActivePinia(createPinia()) })

  it('exposes monitoring stats', () => {
    const store = useMonitoringStore()
    expect(store.stats.activeRuns).toBeGreaterThan(0)
  })

  it('exposes live run feed', () => {
    const store = useMonitoringStore()
    expect(store.liveRuns.length).toBeGreaterThan(0)
  })

  it('counts degraded workers', () => {
    const store = useMonitoringStore()
    const expected = store.stats.workers.filter(w => w.health !== 'healthy').length
    expect(store.degradedWorkerCount).toBe(expected)
  })
})
```

```typescript
// src/stores/__tests__/environments.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useEnvironmentsStore } from '../environments'

describe('useEnvironmentsStore', () => {
  beforeEach(() => { setActivePinia(createPinia()) })

  it('loads stub environments', () => {
    const store = useEnvironmentsStore()
    expect(store.environments.length).toBeGreaterThan(0)
  })

  it('finds environment by id', () => {
    const store = useEnvironmentsStore()
    expect(store.findById('env_001')?.name).toBe('Cloud (default)')
  })

  it('returns null for unknown id', () => {
    const store = useEnvironmentsStore()
    expect(store.findById('nonexistent')).toBeUndefined()
  })
})
```

```typescript
// src/stores/__tests__/marketplace.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useMarketplaceStore } from '../marketplace'

describe('useMarketplaceStore', () => {
  beforeEach(() => { setActivePinia(createPinia()) })

  it('loads stub listings', () => {
    const store = useMarketplaceStore()
    expect(store.listings.length).toBeGreaterThan(0)
  })

  it('filters connectors only', () => {
    const store = useMarketplaceStore()
    const connectors = store.byType('connector')
    expect(connectors.every(l => l.type === 'connector')).toBe(true)
  })

  it('finds listing by id', () => {
    const store = useMarketplaceStore()
    expect(store.findById('ml_001')?.name).toBe('Salesforce CRM')
  })
})
```

- [ ] **Step 2: Run — expect FAIL**

```bash
cd apps/web && npm test -- monitoring environments marketplace
```
Expected: module not found errors.

- [ ] **Step 3: Implement stores**

```typescript
// src/stores/monitoring.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { stubMonitoringStats, stubLiveRuns } from '@/data/monitoring'

export const useMonitoringStore = defineStore('monitoring', () => {
  const stats = ref({ ...stubMonitoringStats })
  const liveRuns = ref([...stubLiveRuns])
  const degradedWorkerCount = computed(() =>
    stats.value.workers.filter(w => w.health !== 'healthy').length
  )
  return { stats, liveRuns, degradedWorkerCount }
})
```

```typescript
// src/stores/environments.ts
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { stubEnvironments } from '@/data/environments'
import type { Environment } from '@/types/operations'

export const useEnvironmentsStore = defineStore('environments', () => {
  const environments = ref<Environment[]>(stubEnvironments)
  function findById(envId: string) {
    return environments.value.find(e => e.envId === envId)
  }
  return { environments, findById }
})
```

```typescript
// src/stores/marketplace.ts
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { stubListings } from '@/data/marketplace'
import type { MarketplaceListing } from '@/types/operations'

export const useMarketplaceStore = defineStore('marketplace', () => {
  const listings = ref<MarketplaceListing[]>(stubListings)
  function byType(type: 'connector' | 'template') {
    return listings.value.filter(l => l.type === type)
  }
  function findById(listingId: string): MarketplaceListing | undefined {
    return listings.value.find(l => l.listingId === listingId)
  }
  return { listings, byType, findById }
})
```

- [ ] **Step 4: Run — expect PASS**

```bash
cd apps/web && npm test -- monitoring environments marketplace
```
Expected: 9 tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/stores/monitoring.ts src/stores/environments.ts src/stores/marketplace.ts src/stores/__tests__/monitoring.test.ts src/stores/__tests__/environments.test.ts src/stores/__tests__/marketplace.test.ts
git commit -m "feat(wave3): add Monitoring, Environments, Marketplace stores with tests"
```

---

## Task 3: MonitoringView

**Files:**
- Replace: `src/views/MonitoringView.vue`

- [ ] **Step 1: Replace stub with full MonitoringView**

```vue
<!-- src/views/MonitoringView.vue -->
<script setup lang="ts">
import { useMonitoringStore } from '@/stores/monitoring'
import { Activity, AlertTriangle, Server } from 'lucide-vue-next'

const store = useMonitoringStore()

const healthColor: Record<string, string> = {
  healthy: 'text-green-500',
  degraded: 'text-amber-500',
  offline: 'text-red-500',
}

const healthDot: Record<string, string> = {
  healthy: 'bg-green-500',
  degraded: 'bg-amber-500',
  offline: 'bg-red-500',
}

const statusColor: Record<string, string> = {
  running: 'text-blue-500',
  success: 'text-green-600',
  failed: 'text-red-500',
}

function elapsed(startedAt: string, durationMs?: number): string {
  if (durationMs) return `${(durationMs / 1000).toFixed(1)}s`
  const ms = Date.now() - new Date(startedAt).getTime()
  return `${Math.floor(ms / 1000)}s`
}
</script>

<template>
  <div class="flex h-full flex-col overflow-auto">
    <div class="border-b px-6 py-4">
      <h1 class="text-xl font-semibold">Monitoring</h1>
      <p class="mt-0.5 text-sm text-muted-foreground">Real-time platform health</p>
    </div>

    <div class="flex-1 overflow-y-auto p-6 space-y-6">
      <!-- KPI row -->
      <div class="grid grid-cols-3 gap-4">
        <div class="rounded-lg border bg-background p-4">
          <div class="flex items-center gap-2 mb-1">
            <Activity class="h-4 w-4 text-green-500" />
            <p class="text-sm font-medium text-muted-foreground">Active Runs</p>
          </div>
          <p class="text-3xl font-bold text-green-600">{{ store.stats.activeRuns }}</p>
        </div>
        <div class="rounded-lg border bg-background p-4">
          <div class="flex items-center gap-2 mb-1">
            <AlertTriangle class="h-4 w-4 text-red-500" />
            <p class="text-sm font-medium text-muted-foreground">Failed (last 1h)</p>
          </div>
          <p class="text-3xl font-bold text-red-600">{{ store.stats.failedLastHour }}</p>
        </div>
        <div class="rounded-lg border bg-background p-4">
          <div class="flex items-center gap-2 mb-1">
            <Server class="h-4 w-4 text-amber-500" />
            <p class="text-sm font-medium text-muted-foreground">Workers Degraded</p>
          </div>
          <p class="text-3xl font-bold text-amber-600">{{ store.degradedWorkerCount }}</p>
        </div>
      </div>

      <!-- Middle zone -->
      <div class="grid grid-cols-3 gap-4">
        <!-- Throughput placeholder -->
        <div class="col-span-2 rounded-lg border p-4">
          <p class="mb-3 text-sm font-semibold">Throughput (24h)</p>
          <div class="flex h-24 items-end gap-1">
            <div v-for="(h, i) in Array.from({ length: 24 }, (_, i) => Math.floor(Math.random() * 80) + 20)"
              :key="i"
              class="flex-1 rounded-t bg-blue-200"
              :style="{ height: h + '%' }" />
          </div>
          <div class="mt-1 flex justify-between text-xs text-muted-foreground">
            <span>00:00</span><span>12:00</span><span>now</span>
          </div>
        </div>

        <!-- Worker health -->
        <div class="rounded-lg border p-4">
          <p class="mb-3 text-sm font-semibold">Worker Health</p>
          <div class="space-y-2">
            <div v-for="w in store.stats.workers" :key="w.workerId"
              class="flex items-center gap-2">
              <span class="h-2 w-2 rounded-full" :class="healthDot[w.health]" />
              <span class="flex-1 text-sm">{{ w.name }}</span>
              <span class="text-xs" :class="healthColor[w.health]">{{ w.health }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Live run feed -->
      <div class="rounded-lg border">
        <div class="border-b px-4 py-3">
          <p class="text-sm font-semibold">Live Run Feed</p>
        </div>
        <table class="w-full text-sm">
          <thead class="bg-muted/50">
            <tr>
              <th class="px-4 py-2 text-left font-medium text-muted-foreground">Workflow</th>
              <th class="px-4 py-2 text-left font-medium text-muted-foreground">Status</th>
              <th class="px-4 py-2 text-left font-medium text-muted-foreground">Started</th>
              <th class="px-4 py-2 text-left font-medium text-muted-foreground">Duration</th>
            </tr>
          </thead>
          <tbody class="divide-y">
            <tr v-for="r in store.liveRuns" :key="r.runId" class="hover:bg-muted/30">
              <td class="px-4 py-2.5 font-medium">{{ r.workflowName }}</td>
              <td class="px-4 py-2.5">
                <span class="capitalize font-medium" :class="statusColor[r.status]">{{ r.status }}</span>
              </td>
              <td class="px-4 py-2.5 text-muted-foreground">{{ new Date(r.startedAt).toLocaleTimeString() }}</td>
              <td class="px-4 py-2.5 text-muted-foreground">{{ elapsed(r.startedAt, r.durationMs) }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Unavailable worker failure state -->
      <div v-if="store.degradedWorkerCount > 0"
        class="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 flex items-center gap-2">
        <AlertTriangle class="h-4 w-4 shrink-0" />
        {{ store.degradedWorkerCount }} worker(s) degraded. Runs may be delayed. Check Environments for details.
      </div>
    </div>
  </div>
</template>
```

- [ ] **Step 2: Commit**

```bash
git add src/views/MonitoringView.vue
git commit -m "feat(wave3): implement MonitoringView with KPI row, worker health, live feed"
```

---

## Task 4: AlertsView

**Files:**
- Replace: `src/views/AlertsView.vue`

- [ ] **Step 1: Replace stub with full AlertsView**

```vue
<!-- src/views/AlertsView.vue -->
<script setup lang="ts">
import { ref } from 'vue'
import { stubAlertRules, stubIncidents } from '@/data/alerts'
import { Plus, Bell, AlertTriangle, ToggleRight, ToggleLeft, CheckCircle } from 'lucide-vue-next'

const incidents = ref([...stubIncidents])
const rules = ref([...stubAlertRules])
const showCreate = ref(false)

const severityColor: Record<string, string> = {
  critical: 'bg-red-100 text-red-700',
  warning: 'bg-amber-100 text-amber-700',
  info: 'bg-blue-100 text-blue-700',
}

function acknowledge(incidentId: string) {
  const inc = incidents.value.find(i => i.incidentId === incidentId)
  if (inc) inc.acknowledged = true
}

function resolve(incidentId: string) {
  const inc = incidents.value.find(i => i.incidentId === incidentId)
  if (inc) inc.resolvedAt = new Date().toISOString()
}
</script>

<template>
  <div class="flex h-full flex-col overflow-auto">
    <div class="flex items-center justify-between border-b px-6 py-4">
      <div>
        <h1 class="text-xl font-semibold">Alerts</h1>
        <p class="mt-0.5 text-sm text-muted-foreground">
          {{ incidents.filter(i => !i.resolvedAt).length }} open incident(s)
        </p>
      </div>
      <button class="flex items-center gap-2 rounded-md bg-foreground px-3 py-2 text-sm font-medium text-background hover:bg-foreground/90"
        @click="showCreate = true">
        <Plus class="h-4 w-4" /> New rule
      </button>
    </div>

    <div class="flex-1 overflow-y-auto p-6 space-y-6">
      <!-- Open incidents -->
      <div v-if="incidents.some(i => !i.resolvedAt)">
        <h2 class="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Open Incidents</h2>
        <div class="space-y-2">
          <div v-for="inc in incidents.filter(i => !i.resolvedAt)" :key="inc.incidentId"
            class="flex items-center gap-3 rounded-lg border p-4">
            <AlertTriangle class="h-4 w-4 shrink-0" :class="inc.severity === 'critical' ? 'text-red-500' : 'text-amber-500'" />
            <div class="flex-1">
              <p class="font-medium text-sm">{{ inc.ruleName }}</p>
              <p class="text-xs text-muted-foreground">Triggered {{ new Date(inc.triggeredAt).toLocaleString() }}</p>
            </div>
            <span class="rounded-full px-2.5 py-0.5 text-xs font-medium capitalize" :class="severityColor[inc.severity]">
              {{ inc.severity }}
            </span>
            <div class="flex gap-2">
              <button v-if="!inc.acknowledged"
                class="rounded-md border px-2.5 py-1 text-xs font-medium hover:bg-muted"
                @click="acknowledge(inc.incidentId)">Acknowledge</button>
              <button class="flex items-center gap-1 rounded-md border px-2.5 py-1 text-xs font-medium hover:bg-muted"
                @click="resolve(inc.incidentId)">
                <CheckCircle class="h-3 w-3" /> Resolve
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Alert rules -->
      <div>
        <h2 class="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Alert Rules</h2>
        <div class="overflow-hidden rounded-lg border">
          <table class="w-full text-sm">
            <thead class="bg-muted/50">
              <tr>
                <th class="px-4 py-3 text-left font-medium text-muted-foreground">Name</th>
                <th class="px-4 py-3 text-left font-medium text-muted-foreground">Condition</th>
                <th class="px-4 py-3 text-left font-medium text-muted-foreground">Destinations</th>
                <th class="px-4 py-3 text-left font-medium text-muted-foreground">Enabled</th>
              </tr>
            </thead>
            <tbody class="divide-y">
              <tr v-for="rule in rules" :key="rule.ruleId" class="hover:bg-muted/30">
                <td class="px-4 py-3 font-medium">{{ rule.name }}</td>
                <td class="px-4 py-3 text-muted-foreground text-xs">{{ rule.condition }} ({{ rule.threshold }})</td>
                <td class="px-4 py-3">
                  <div class="flex gap-1">
                    <span v-for="d in rule.destinations" :key="d"
                      class="rounded-full bg-muted px-2 py-0.5 text-xs capitalize">{{ d }}</span>
                  </div>
                </td>
                <td class="px-4 py-3">
                  <ToggleRight v-if="rule.enabled" class="h-5 w-5 text-green-500" />
                  <ToggleLeft v-else class="h-5 w-5 text-muted-foreground" />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Create rule modal -->
    <div v-if="showCreate" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      @click.self="showCreate = false">
      <div class="w-full max-w-md rounded-xl border bg-background p-6 shadow-lg">
        <h2 class="text-lg font-semibold">Create Alert Rule</h2>
        <div class="mt-4 space-y-3">
          <div>
            <label class="mb-1 block text-sm font-medium">Rule name</label>
            <input type="text" placeholder="e.g. Failed run spike" class="w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" />
          </div>
          <div>
            <label class="mb-1 block text-sm font-medium">Metric</label>
            <select class="w-full rounded-md border px-3 py-2 text-sm outline-none">
              <option>Failed runs</option>
              <option>Worker health</option>
              <option>Usage quota</option>
            </select>
          </div>
          <div>
            <label class="mb-1 block text-sm font-medium">Notify via</label>
            <div class="flex gap-2">
              <label v-for="d in ['Slack', 'Email', 'Webhook']" :key="d" class="flex items-center gap-1.5 text-sm">
                <input type="checkbox" /> {{ d }}
              </label>
            </div>
          </div>
        </div>
        <div class="mt-4 flex gap-2">
          <button class="flex-1 rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted" @click="showCreate = false">Cancel</button>
          <button class="flex-1 rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background hover:bg-foreground/90" @click="showCreate = false">Create rule</button>
        </div>
      </div>
    </div>
  </div>
</template>
```

- [ ] **Step 2: Commit**

```bash
git add src/views/AlertsView.vue
git commit -m "feat(wave3): implement AlertsView with incident management and alert rules"
```

---

## Task 5: EnvironmentsView

**Files:**
- Replace: `src/views/EnvironmentsView.vue`

- [ ] **Step 1: Replace stub with full EnvironmentsView**

```vue
<!-- src/views/EnvironmentsView.vue -->
<script setup lang="ts">
import { ref } from 'vue'
import { useEnvironmentsStore } from '@/stores/environments'
import type { Environment } from '@/types/operations'
import { Server, Plus, X, Wifi } from 'lucide-vue-next'

const store = useEnvironmentsStore()
const selectedEnv = ref<Environment | null>(null)

const healthColor: Record<string, string> = {
  healthy: 'text-green-500',
  degraded: 'text-amber-500',
  offline: 'text-red-500',
}

const healthBorder: Record<string, string> = {
  healthy: 'border-green-200',
  degraded: 'border-amber-200',
  offline: 'border-red-200',
}
</script>

<template>
  <div class="flex h-full flex-col overflow-auto">
    <div class="border-b px-6 py-4">
      <h1 class="text-xl font-semibold">Environments</h1>
      <p class="mt-0.5 text-sm text-muted-foreground">Manage execution data planes</p>
    </div>

    <div class="flex-1 overflow-y-auto p-6">
      <div class="grid grid-cols-3 gap-4">
        <div v-for="env in store.environments" :key="env.envId"
          class="cursor-pointer rounded-lg border-2 p-4 hover:shadow-sm transition-shadow"
          :class="healthBorder[env.health]"
          @click="selectedEnv = env">
          <div class="flex items-start justify-between mb-2">
            <Server class="h-5 w-5 text-muted-foreground" />
            <span class="rounded-full px-2 py-0.5 text-xs font-medium bg-muted capitalize">{{ env.type }}</span>
          </div>
          <h3 class="font-semibold text-sm">{{ env.name }}</h3>
          <p class="mt-1 text-xs text-muted-foreground">{{ env.region }}</p>
          <div class="mt-3 flex items-center gap-1.5">
            <span class="h-2 w-2 rounded-full" :class="env.health === 'healthy' ? 'bg-green-500' : env.health === 'degraded' ? 'bg-amber-500' : 'bg-red-500'" />
            <span class="text-xs capitalize" :class="healthColor[env.health]">{{ env.health }}</span>
            <span class="ml-auto text-xs text-muted-foreground">{{ env.workerCount }} worker{{ env.workerCount !== 1 ? 's' : '' }}</span>
          </div>
        </div>

        <!-- Add environment card -->
        <div class="cursor-pointer rounded-lg border-2 border-dashed p-4 flex flex-col items-center justify-center gap-2 text-muted-foreground hover:bg-muted/30 hover:text-foreground transition-colors">
          <Plus class="h-6 w-6" />
          <span class="text-sm font-medium">Add Environment</span>
        </div>
      </div>
    </div>

    <!-- Environment detail slide-over -->
    <div v-if="selectedEnv" class="fixed inset-0 z-40 flex justify-end" @click.self="selectedEnv = null">
      <div class="h-full w-96 overflow-y-auto border-l bg-background shadow-xl">
        <div class="flex items-center justify-between border-b px-4 py-3">
          <h2 class="font-semibold">{{ selectedEnv.name }}</h2>
          <button class="rounded-md p-1 hover:bg-muted" @click="selectedEnv = null">
            <X class="h-4 w-4" />
          </button>
        </div>

        <div class="p-4 space-y-5">
          <!-- Status -->
          <div>
            <p class="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Status</p>
            <div class="flex items-center gap-2">
              <span class="h-2.5 w-2.5 rounded-full" :class="selectedEnv.health === 'healthy' ? 'bg-green-500' : 'bg-amber-500'" />
              <span class="capitalize text-sm font-medium" :class="healthColor[selectedEnv.health]">{{ selectedEnv.health }}</span>
              <span class="text-muted-foreground text-sm">· {{ selectedEnv.workerCount }} workers · v{{ selectedEnv.agentVersion }}</span>
            </div>
          </div>

          <!-- Connectivity test -->
          <div>
            <p class="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Connectivity</p>
            <button class="flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm font-medium hover:bg-muted">
              <Wifi class="h-3.5 w-3.5" /> Test connection
            </button>
          </div>

          <!-- Assigned workflows -->
          <div>
            <p class="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Assigned Workflows</p>
            <div class="space-y-1">
              <div v-for="wfId in selectedEnv.assignedWorkflows" :key="wfId"
                class="rounded-md bg-muted/50 px-3 py-1.5 text-sm text-muted-foreground">{{ wfId }}</div>
            </div>
          </div>

          <!-- Agent install instructions -->
          <div v-if="selectedEnv.type === 'agent'">
            <p class="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Agent Install</p>
            <pre class="rounded-md bg-muted p-3 text-xs overflow-x-auto">curl -fsSL https://install.vipsos.io | sh
vipsos-agent register --token &lt;TOKEN&gt;</pre>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
```

- [ ] **Step 2: Commit**

```bash
git add src/views/EnvironmentsView.vue
git commit -m "feat(wave3): implement EnvironmentsView with card grid and detail slide-over"
```

---

## Task 6: BillingView and AuditView

**Files:**
- Replace: `src/views/BillingView.vue`
- Replace: `src/views/AuditView.vue`

- [ ] **Step 1: Replace BillingView**

```vue
<!-- src/views/BillingView.vue -->
<script setup lang="ts">
import { stubBilling } from '@/data/billing'
import { TrendingUp } from 'lucide-vue-next'

const billing = stubBilling

function usagePercent(used: number, limit: number): number {
  return Math.min(Math.round((used / limit) * 100), 100)
}
</script>

<template>
  <div class="flex h-full flex-col overflow-auto">
    <div class="border-b px-6 py-4">
      <h1 class="text-xl font-semibold">Billing & Usage</h1>
    </div>

    <div class="flex-1 overflow-y-auto p-6 space-y-6 max-w-2xl">
      <!-- Plan overview -->
      <div class="rounded-lg border p-5">
        <div class="flex items-start justify-between">
          <div>
            <p class="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Current Plan</p>
            <p class="mt-1 text-2xl font-bold">{{ billing.plan }}</p>
          </div>
          <button class="rounded-md bg-foreground px-3 py-1.5 text-sm font-medium text-background hover:bg-foreground/90">
            Upgrade
          </button>
        </div>
        <div class="mt-3 flex gap-6 text-sm text-muted-foreground">
          <span>Renews {{ billing.renewsAt }}</span>
          <span>{{ billing.seatCount }} seats</span>
        </div>
      </div>

      <!-- Usage meters -->
      <div>
        <h2 class="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Usage</h2>
        <div class="space-y-4">
          <div v-for="meter in billing.meters" :key="meter.dimension">
            <div class="mb-1.5 flex items-center justify-between text-sm">
              <span class="font-medium">{{ meter.dimension }}</span>
              <span class="text-muted-foreground">
                {{ meter.used.toLocaleString() }} / {{ meter.limit.toLocaleString() }} {{ meter.unit }}
              </span>
            </div>
            <div class="h-2 overflow-hidden rounded-full bg-muted">
              <div class="h-full rounded-full transition-all"
                :class="usagePercent(meter.used, meter.limit) >= 90 ? 'bg-red-500' : usagePercent(meter.used, meter.limit) >= 70 ? 'bg-amber-500' : 'bg-green-500'"
                :style="{ width: usagePercent(meter.used, meter.limit) + '%' }" />
            </div>
            <div v-if="usagePercent(meter.used, meter.limit) >= 90"
              class="mt-1 flex items-center gap-1 text-xs text-red-600">
              <TrendingUp class="h-3 w-3" /> Approaching limit — consider upgrading
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
```

- [ ] **Step 2: Replace AuditView**

```vue
<!-- src/views/AuditView.vue -->
<script setup lang="ts">
import { ref, computed } from 'vue'
import { stubAuditEntries } from '@/data/audit'
import { ChevronDown, ChevronRight } from 'lucide-vue-next'

const search = ref('')
const expandedId = ref<string | null>(null)

const filtered = computed(() =>
  stubAuditEntries.filter(e =>
    [e.actor, e.action, e.resourceType, e.resourceName]
      .some(f => f.toLowerCase().includes(search.value.toLowerCase()))
  )
)

function toggle(id: string) {
  expandedId.value = expandedId.value === id ? null : id
}
</script>

<template>
  <div class="flex h-full flex-col overflow-auto">
    <div class="border-b px-6 py-4">
      <h1 class="text-xl font-semibold">Audit & Activity</h1>
      <p class="mt-0.5 text-sm text-muted-foreground">Governance trail for all platform actions</p>
    </div>

    <div class="flex-1 overflow-y-auto p-6">
      <div class="mb-4">
        <input v-model="search" placeholder="Search by actor, action, or resource…"
          class="w-full max-w-sm rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" />
      </div>

      <div class="overflow-hidden rounded-lg border">
        <table class="w-full text-sm">
          <thead class="bg-muted/50">
            <tr>
              <th class="w-6 px-4 py-3" />
              <th class="px-4 py-3 text-left font-medium text-muted-foreground">Timestamp</th>
              <th class="px-4 py-3 text-left font-medium text-muted-foreground">Actor</th>
              <th class="px-4 py-3 text-left font-medium text-muted-foreground">Action</th>
              <th class="px-4 py-3 text-left font-medium text-muted-foreground">Resource</th>
            </tr>
          </thead>
          <tbody class="divide-y">
            <template v-for="entry in filtered" :key="entry.entryId">
              <tr class="hover:bg-muted/30" :class="entry.diff ? 'cursor-pointer' : ''"
                @click="entry.diff && toggle(entry.entryId)">
                <td class="px-4 py-3 text-muted-foreground">
                  <ChevronDown v-if="entry.diff && expandedId === entry.entryId" class="h-3.5 w-3.5" />
                  <ChevronRight v-else-if="entry.diff" class="h-3.5 w-3.5" />
                </td>
                <td class="px-4 py-3 text-muted-foreground text-xs">{{ new Date(entry.timestamp).toLocaleString() }}</td>
                <td class="px-4 py-3">{{ entry.actor }}</td>
                <td class="px-4 py-3 capitalize font-medium">{{ entry.action }}</td>
                <td class="px-4 py-3 text-muted-foreground">
                  <span class="capitalize">{{ entry.resourceType }}</span>: {{ entry.resourceName }}
                </td>
              </tr>
              <tr v-if="entry.diff && expandedId === entry.entryId" class="bg-muted/20">
                <td colspan="5" class="px-4 py-3">
                  <div class="grid grid-cols-2 gap-3">
                    <div class="rounded-md border bg-background p-2.5">
                      <p class="mb-1 text-xs font-semibold text-red-600">Before</p>
                      <pre class="text-xs text-muted-foreground">{{ entry.diff.before }}</pre>
                    </div>
                    <div class="rounded-md border bg-background p-2.5">
                      <p class="mb-1 text-xs font-semibold text-green-600">After</p>
                      <pre class="text-xs text-muted-foreground">{{ entry.diff.after }}</pre>
                    </div>
                  </div>
                </td>
              </tr>
            </template>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>
```

- [ ] **Step 3: Commit**

```bash
git add src/views/BillingView.vue src/views/AuditView.vue
git commit -m "feat(wave3): implement BillingView with usage meters and AuditView with diff expansion"
```

---

## Task 7: MarketplaceCard component and MarketplaceView

**Files:**
- Create: `src/components/marketplace/MarketplaceCard.vue`
- Replace: `src/views/MarketplaceView.vue`
- Replace: `src/views/MarketplaceListingView.vue`

- [ ] **Step 1: Create MarketplaceCard with logo + fallback**

```vue
<!-- src/components/marketplace/MarketplaceCard.vue -->
<script setup lang="ts">
import { ref } from 'vue'
import type { MarketplaceListing } from '@/types/operations'

const props = defineProps<{ listing: MarketplaceListing }>()
const emit = defineEmits<{ click: [] }>()

const logoError = ref(false)
const logoUrl = `https://logo.clearbit.com/${props.listing.domain}`

// Deterministic color from domain name
function avatarColor(domain: string): string {
  const colors = ['bg-blue-500', 'bg-purple-500', 'bg-green-500', 'bg-amber-500', 'bg-red-500', 'bg-pink-500']
  const idx = domain.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) % colors.length
  return colors[idx]
}

const certBadge: Record<string, string> = {
  certified: 'bg-purple-100 text-purple-700',
  community: 'bg-blue-100 text-blue-700',
  draft: 'bg-muted text-muted-foreground',
}
</script>

<template>
  <div class="cursor-pointer rounded-lg border p-4 hover:shadow-sm transition-shadow"
    @click="emit('click')">
    <div class="flex items-center gap-3 mb-3">
      <div class="h-9 w-9 flex-shrink-0 rounded-lg overflow-hidden">
        <img v-if="!logoError" :src="logoUrl" :alt="listing.name"
          class="h-full w-full object-contain"
          @error="logoError = true" />
        <div v-else class="h-full w-full flex items-center justify-center text-white text-xs font-bold"
          :class="avatarColor(listing.domain)">
          {{ listing.name.substring(0, 2).toUpperCase() }}
        </div>
      </div>
      <div class="flex-1 min-w-0">
        <p class="font-semibold text-sm leading-tight truncate">{{ listing.name }}</p>
        <p class="text-xs text-muted-foreground truncate">{{ listing.publisher }}</p>
      </div>
      <span class="rounded-full px-2 py-0.5 text-xs font-medium shrink-0" :class="certBadge[listing.certification]">
        {{ listing.certification }}
      </span>
    </div>
    <p class="text-xs text-muted-foreground line-clamp-2 mb-3">{{ listing.description }}</p>
    <div class="flex items-center justify-between">
      <span class="text-xs font-medium" :class="listing.pricing === 'free' ? 'text-green-600' : 'text-purple-600'">
        {{ listing.priceLabel }}
      </span>
      <button class="rounded-md bg-foreground px-2.5 py-1 text-xs font-medium text-background hover:bg-foreground/90"
        @click.stop>
        {{ listing.type === 'connector' ? 'Install' : 'Use' }}
      </button>
    </div>
  </div>
</template>
```

- [ ] **Step 2: Replace MarketplaceView**

```vue
<!-- src/views/MarketplaceView.vue -->
<script setup lang="ts">
import { ref, computed } from 'vue'
import { useMarketplaceStore } from '@/stores/marketplace'
import { useRouter } from 'vue-router'
import MarketplaceCard from '@/components/marketplace/MarketplaceCard.vue'
import type { MarketplaceCategory } from '@/types/operations'

const store = useMarketplaceStore()
const router = useRouter()

const activeTab = ref<'connector' | 'template' | 'publisher'>('connector')
const search = ref('')
const selectedCategory = ref<MarketplaceCategory | 'All'>('All')
const selectedPricing = ref<'all' | 'free' | 'per-use' | 'subscription'>('all')

const categories: (MarketplaceCategory | 'All')[] = ['All', 'CRM', 'Databases', 'Cloud Storage', 'Marketing', 'Finance', 'Analytics', 'Communication']

const filtered = computed(() => {
  return store.byType(activeTab.value === 'publisher' ? 'connector' : activeTab.value).filter(l => {
    const matchSearch = !search.value || l.name.toLowerCase().includes(search.value.toLowerCase()) ||
      l.description.toLowerCase().includes(search.value.toLowerCase()) ||
      l.publisher.toLowerCase().includes(search.value.toLowerCase())
    const matchCategory = selectedCategory.value === 'All' || l.category === selectedCategory.value
    const matchPricing = selectedPricing.value === 'all' || l.pricing === selectedPricing.value
    return matchSearch && matchCategory && matchPricing
  })
})

function goToListing(listingId: string) {
  router.push(`/marketplace/${listingId}`)
}
</script>

<template>
  <div class="flex h-full flex-col overflow-auto">
    <div class="border-b px-6 py-4">
      <h1 class="text-xl font-semibold">Marketplace</h1>
      <p class="mt-0.5 text-sm text-muted-foreground">Certified connectors and workflow templates</p>
    </div>

    <!-- Tabs -->
    <div class="border-b px-6">
      <div class="flex gap-1">
        <button v-for="tab in [['connector', 'Connectors'], ['template', 'Templates'], ['publisher', 'Publisher Portal']]"
          :key="tab[0]"
          class="px-4 py-3 text-sm font-medium border-b-2 transition-colors"
          :class="activeTab === tab[0] ? 'border-foreground text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground'"
          @click="activeTab = tab[0] as typeof activeTab">
          {{ tab[1] }}
        </button>
      </div>
    </div>

    <div class="flex-1 overflow-y-auto p-6">
      <!-- Publisher portal placeholder -->
      <div v-if="activeTab === 'publisher'" class="max-w-lg">
        <h2 class="text-lg font-semibold mb-2">Publisher Portal</h2>
        <p class="text-sm text-muted-foreground mb-4">Manage your listings, track revenue, and submit for certification.</p>
        <button class="rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background hover:bg-foreground/90">
          Submit new listing
        </button>
      </div>

      <template v-else>
        <!-- Search + filters -->
        <div class="mb-5 space-y-3">
          <div class="flex gap-3">
            <input v-model="search" placeholder="Search marketplace…"
              class="flex-1 max-w-sm rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" />
            <select v-model="selectedPricing"
              class="rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring">
              <option value="all">All pricing</option>
              <option value="free">Free</option>
              <option value="per-use">Per use</option>
              <option value="subscription">Subscription</option>
            </select>
          </div>
          <div class="flex gap-2 flex-wrap">
            <button v-for="cat in categories" :key="cat"
              class="rounded-full px-3 py-1 text-sm font-medium transition-colors"
              :class="selectedCategory === cat ? 'bg-foreground text-background' : 'border hover:bg-muted'"
              @click="selectedCategory = cat">
              {{ cat }}
            </button>
          </div>
        </div>

        <!-- Grid -->
        <div v-if="filtered.length > 0" class="grid grid-cols-3 gap-4">
          <MarketplaceCard v-for="listing in filtered" :key="listing.listingId" :listing="listing"
            @click="goToListing(listing.listingId)" />
        </div>
        <div v-else class="py-12 text-center text-sm text-muted-foreground">
          No listings found for "{{ search }}"
        </div>
      </template>
    </div>
  </div>
</template>
```

- [ ] **Step 3: Replace MarketplaceListingView**

```vue
<!-- src/views/MarketplaceListingView.vue -->
<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useMarketplaceStore } from '@/stores/marketplace'
import { ArrowLeft } from 'lucide-vue-next'

const route = useRoute()
const router = useRouter()
const store = useMarketplaceStore()
const logoError = ref(false)

const listing = computed(() => store.findById(route.params.id as string))
const logoUrl = computed(() => listing.value ? `https://logo.clearbit.com/${listing.value.domain}` : '')

function avatarColor(domain: string): string {
  const colors = ['bg-blue-500', 'bg-purple-500', 'bg-green-500', 'bg-amber-500']
  return colors[domain.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % colors.length]
}
</script>

<template>
  <div class="flex h-full flex-col overflow-auto">
    <div class="border-b px-6 py-4">
      <button class="mb-3 flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        @click="router.back()">
        <ArrowLeft class="h-4 w-4" /> Back to Marketplace
      </button>
      <div v-if="listing" class="flex items-center gap-4">
        <div class="h-12 w-12 rounded-xl overflow-hidden shrink-0">
          <img v-if="!logoError" :src="logoUrl" :alt="listing.name" class="h-full w-full object-contain"
            @error="logoError = true" />
          <div v-else class="h-full w-full flex items-center justify-center text-white text-sm font-bold"
            :class="avatarColor(listing.domain)">
            {{ listing.name.substring(0, 2).toUpperCase() }}
          </div>
        </div>
        <div>
          <h1 class="text-xl font-semibold">{{ listing.name }}</h1>
          <p class="text-sm text-muted-foreground">{{ listing.publisher }} · {{ listing.category }}</p>
        </div>
        <div class="ml-auto flex gap-2">
          <button class="rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted">View docs</button>
          <button class="rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background hover:bg-foreground/90">
            {{ listing.type === 'connector' ? 'Install' : 'Use template' }}
          </button>
        </div>
      </div>
    </div>

    <div v-if="listing" class="flex-1 overflow-y-auto p-6">
      <div class="grid grid-cols-3 gap-6">
        <div class="col-span-2 space-y-5">
          <div class="rounded-lg border p-5">
            <h2 class="mb-2 font-semibold">Overview</h2>
            <p class="text-sm text-muted-foreground">{{ listing.description }}</p>
          </div>
          <div class="rounded-lg border p-5">
            <h2 class="mb-3 font-semibold">Screenshots</h2>
            <div class="grid grid-cols-2 gap-3">
              <div v-for="i in 2" :key="i" class="h-32 rounded-md bg-muted flex items-center justify-center text-xs text-muted-foreground">
                Screenshot {{ i }}
              </div>
            </div>
          </div>
        </div>
        <div class="space-y-4">
          <div class="rounded-lg border p-4">
            <p class="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Pricing</p>
            <p class="text-lg font-bold" :class="listing.pricing === 'free' ? 'text-green-600' : 'text-foreground'">
              {{ listing.priceLabel }}
            </p>
          </div>
          <div class="rounded-lg border p-4 space-y-2 text-sm">
            <div class="flex justify-between"><span class="text-muted-foreground">Certification</span><span class="capitalize">{{ listing.certification }}</span></div>
            <div class="flex justify-between"><span class="text-muted-foreground">Installs</span><span>{{ listing.installs.toLocaleString() }}</span></div>
            <div class="flex justify-between"><span class="text-muted-foreground">Publisher</span><span>{{ listing.publisher }}</span></div>
          </div>
        </div>
      </div>
    </div>

    <div v-else class="flex-1 flex items-center justify-center text-muted-foreground">
      Listing not found.
    </div>
  </div>
</template>
```

- [ ] **Step 4: Commit**

```bash
git add src/components/marketplace/ src/views/MarketplaceView.vue src/views/MarketplaceListingView.vue
git commit -m "feat(wave3): implement Marketplace hub with MarketplaceCard (logo+fallback), search/filter, listing detail"
```

---

## Task 8: ConnectorBuilderView — 5-step wizard

**Files:**
- Replace: `src/views/ConnectorBuilderView.vue`

- [ ] **Step 1: Replace stub with full ConnectorBuilderView**

```vue
<!-- src/views/ConnectorBuilderView.vue -->
<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const step = ref(1)
const totalSteps = 5

const stepLabels = ['Metadata', 'Auth', 'Endpoints', 'Schema', 'Test & Publish']

const metadata = ref({ name: '', category: '', description: '', version: '1.0.0' })
const auth = ref({ type: 'api-key', callbackUrl: '' })
const endpoints = ref([{ name: '', method: 'GET', urlTemplate: '', paginationType: 'none', cursorField: '' }])
const sampleResponse = ref('')
const testStatus = ref<'idle' | 'running' | 'pass' | 'fail'>('idle')

const canProceed = computed(() => {
  if (step.value === 1) return !!metadata.value.name
  if (step.value === 3) return endpoints.value.some(e => e.name && e.urlTemplate)
  return true
})

function addEndpoint() {
  endpoints.value.push({ name: '', method: 'GET', urlTemplate: '', paginationType: 'none', cursorField: '' })
}

function runTest() {
  testStatus.value = 'running'
  setTimeout(() => { testStatus.value = 'pass' }, 1200)
}

function publish() {
  router.push('/connectors')
}
</script>

<template>
  <div class="flex h-full flex-col overflow-auto">
    <div class="border-b px-6 py-4">
      <h1 class="text-xl font-semibold">Connector Builder</h1>
      <p class="mt-0.5 text-sm text-muted-foreground">Define and publish a custom connector</p>
    </div>

    <div class="flex-1 overflow-y-auto p-6 max-w-2xl">
      <!-- Stepper -->
      <div class="mb-8 flex items-center gap-1">
        <template v-for="(label, i) in stepLabels" :key="label">
          <div class="flex items-center gap-2">
            <div class="flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold shrink-0"
              :class="i + 1 < step ? 'bg-green-500 text-white' : i + 1 === step ? 'bg-foreground text-background' : 'border text-muted-foreground'">
              {{ i + 1 }}
            </div>
            <span class="text-sm font-medium hidden sm:block"
              :class="i + 1 === step ? 'text-foreground' : 'text-muted-foreground'">{{ label }}</span>
          </div>
          <div v-if="i < stepLabels.length - 1" class="flex-1 border-t mx-2"
            :class="i + 1 < step ? 'border-green-500' : ''" />
        </template>
      </div>

      <!-- Step 1: Metadata -->
      <div v-if="step === 1" class="space-y-4">
        <h2 class="font-semibold">Connector Metadata</h2>
        <div>
          <label class="mb-1.5 block text-sm font-medium">Name <span class="text-red-500">*</span></label>
          <input v-model="metadata.name" placeholder="My Custom API"
            class="w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" />
        </div>
        <div>
          <label class="mb-1.5 block text-sm font-medium">Category</label>
          <select v-model="metadata.category" class="w-full rounded-md border px-3 py-2 text-sm outline-none">
            <option value="">Select category</option>
            <option>CRM</option><option>Databases</option><option>Finance</option>
            <option>Marketing</option><option>Analytics</option><option>Communication</option>
          </select>
        </div>
        <div>
          <label class="mb-1.5 block text-sm font-medium">Description</label>
          <textarea v-model="metadata.description" rows="3"
            class="w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" />
        </div>
        <div>
          <label class="mb-1.5 block text-sm font-medium">Version</label>
          <input v-model="metadata.version" class="w-32 rounded-md border px-3 py-2 text-sm outline-none" />
        </div>
      </div>

      <!-- Step 2: Auth -->
      <div v-if="step === 2" class="space-y-4">
        <h2 class="font-semibold">Authentication</h2>
        <div>
          <label class="mb-2 block text-sm font-medium">Auth type</label>
          <div class="grid grid-cols-3 gap-2">
            <label v-for="t in ['oauth2', 'api-key', 'basic']" :key="t"
              class="flex cursor-pointer items-center justify-center rounded-md border px-3 py-2 text-sm font-medium capitalize"
              :class="auth.type === t ? 'border-foreground bg-muted' : ''">
              <input v-model="auth.type" type="radio" :value="t" class="sr-only" />
              {{ t }}
            </label>
          </div>
        </div>
        <div v-if="auth.type === 'oauth2'">
          <label class="mb-1.5 block text-sm font-medium">Callback URL</label>
          <input v-model="auth.callbackUrl" placeholder="https://api.example.com/oauth/callback"
            class="w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" />
        </div>
        <div v-if="auth.type === 'api-key'">
          <label class="mb-1.5 block text-sm font-medium">Header name</label>
          <input placeholder="X-API-Key" class="w-full rounded-md border px-3 py-2 text-sm outline-none" />
        </div>
      </div>

      <!-- Step 3: Endpoints -->
      <div v-if="step === 3" class="space-y-4">
        <div class="flex items-center justify-between">
          <h2 class="font-semibold">Endpoints</h2>
          <button class="text-sm text-muted-foreground hover:text-foreground" @click="addEndpoint">+ Add endpoint</button>
        </div>
        <div v-for="(ep, i) in endpoints" :key="i" class="rounded-lg border p-4 space-y-3">
          <div class="flex gap-2">
            <input v-model="ep.name" placeholder="Action name" class="flex-1 rounded-md border px-3 py-1.5 text-sm outline-none" />
            <select v-model="ep.method" class="rounded-md border px-3 py-1.5 text-sm outline-none">
              <option>GET</option><option>POST</option><option>PUT</option><option>DELETE</option>
            </select>
          </div>
          <input v-model="ep.urlTemplate" placeholder="https://api.example.com/v1/contacts"
            class="w-full rounded-md border px-3 py-1.5 text-sm outline-none" />
          <div class="flex gap-2">
            <select v-model="ep.paginationType" class="flex-1 rounded-md border px-3 py-1.5 text-sm outline-none">
              <option value="none">No pagination</option>
              <option value="cursor">Cursor-based</option>
              <option value="offset">Offset-based</option>
            </select>
            <input v-if="ep.paginationType === 'cursor'" v-model="ep.cursorField" placeholder="cursor field"
              class="flex-1 rounded-md border px-3 py-1.5 text-sm outline-none" />
          </div>
        </div>
      </div>

      <!-- Step 4: Schema -->
      <div v-if="step === 4" class="space-y-4">
        <h2 class="font-semibold">Schema Mapping</h2>
        <div>
          <label class="mb-1.5 block text-sm font-medium">Sample API response (JSON)</label>
          <textarea v-model="sampleResponse" rows="8" placeholder='{"id": "123", "email": "user@example.com"}'
            class="w-full rounded-md border px-3 py-2 text-sm font-mono outline-none focus:ring-2 focus:ring-ring" />
        </div>
        <!-- Schema mismatch failure state -->
        <div v-if="sampleResponse && !sampleResponse.trim().startsWith('{')"
          class="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Schema mismatch: expected a JSON object. Review the raw response and adjust.
        </div>
      </div>

      <!-- Step 5: Test & Publish -->
      <div v-if="step === 5" class="space-y-4">
        <h2 class="font-semibold">Test & Publish</h2>
        <p class="text-sm text-muted-foreground">Run a test against the live API to verify your connector works.</p>
        <button class="rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted"
          :disabled="testStatus === 'running'" @click="runTest">
          {{ testStatus === 'running' ? 'Running test…' : testStatus === 'pass' ? '✓ Test passed — run again' : testStatus === 'fail' ? '✗ Test failed — retry' : 'Run test' }}
        </button>
        <div v-if="testStatus === 'pass'" class="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          All endpoints responded successfully. Ready to save or submit for certification.
        </div>
      </div>

      <!-- Navigation -->
      <div class="mt-8 flex gap-3">
        <button v-if="step > 1" class="rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted"
          @click="step--">Back</button>
        <button v-if="step < totalSteps" :disabled="!canProceed"
          class="rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background disabled:opacity-50 hover:bg-foreground/90"
          @click="step++">Continue</button>
        <template v-if="step === totalSteps">
          <button class="rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted" @click="publish">
            Save as draft
          </button>
          <button class="rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background hover:bg-foreground/90"
            @click="publish">
            Submit for certification
          </button>
        </template>
      </div>
    </div>
  </div>
</template>
```

- [ ] **Step 2: Commit**

```bash
git add src/views/ConnectorBuilderView.vue
git commit -m "feat(wave3): implement ConnectorBuilderView with 5-step wizard"
```

---

## Task 9: EmbeddedView

**Files:**
- Replace: `src/views/EmbeddedView.vue`

Note: `EmbeddedView` uses its own minimal layout — no `AppShell`. The router already registers it as a public route.

- [ ] **Step 1: Replace stub with full EmbeddedView**

```vue
<!-- src/views/EmbeddedView.vue -->
<script setup lang="ts">
import { ref } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const brandName = (route.query.brand as string) || 'YourApp'
const step = ref<'select' | 'auth' | 'success' | 'error'>('select')
const selectedProvider = ref('')

const providers = ['Salesforce', 'HubSpot', 'Stripe', 'Slack', 'Postgres', 'Google Sheets']

function selectProvider(name: string) {
  selectedProvider.value = name
  step.value = 'auth'
}

function connect() {
  step.value = 'success'
}

function retryAuth() {
  step.value = 'auth'
}
</script>

<template>
  <div class="flex min-h-screen items-center justify-center bg-muted/40 p-4">
    <div class="w-full max-w-sm rounded-xl border bg-background shadow-sm overflow-hidden">
      <!-- Branded header -->
      <div class="border-b px-5 py-3 flex items-center gap-2">
        <div class="h-6 w-6 rounded bg-foreground" />
        <span class="text-sm font-semibold">{{ brandName }}</span>
        <span class="mx-1 text-muted-foreground">·</span>
        <span class="text-xs text-muted-foreground">Powered by vipsOS</span>
      </div>

      <!-- Step: Select provider -->
      <div v-if="step === 'select'" class="p-5">
        <h2 class="text-base font-semibold mb-1">Connect your app</h2>
        <p class="text-sm text-muted-foreground mb-4">Choose a provider to get started.</p>
        <div class="grid grid-cols-2 gap-2">
          <button v-for="p in providers" :key="p"
            class="rounded-lg border px-3 py-2.5 text-sm font-medium hover:bg-muted text-left"
            @click="selectProvider(p)">{{ p }}</button>
        </div>
      </div>

      <!-- Step: Authenticate -->
      <div v-if="step === 'auth'" class="p-5">
        <h2 class="text-base font-semibold mb-1">Connect {{ selectedProvider }}</h2>
        <p class="text-sm text-muted-foreground mb-4">
          Authorize access to sync your data securely.
        </p>
        <div class="mb-4 rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground">
          <p class="font-medium mb-1">Permissions requested:</p>
          <ul class="list-disc list-inside space-y-0.5">
            <li>Read contacts and accounts</li>
            <li>Write sync status back</li>
          </ul>
        </div>
        <div class="space-y-2">
          <button class="w-full rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background hover:bg-foreground/90"
            @click="connect">
            Authorize {{ selectedProvider }}
          </button>
          <button class="w-full rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted"
            @click="step = 'select'">
            Back
          </button>
        </div>
      </div>

      <!-- Step: Success -->
      <div v-if="step === 'success'" class="p-5 text-center">
        <div class="mb-3 text-4xl">✓</div>
        <h2 class="text-base font-semibold mb-1">Connected!</h2>
        <p class="text-sm text-muted-foreground mb-4">
          {{ selectedProvider }} is now syncing with {{ brandName }}. Your data will be ready shortly.
        </p>
        <button class="w-full rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background hover:bg-foreground/90">
          Done
        </button>
      </div>

      <!-- Step: Error -->
      <div v-if="step === 'error'" class="p-5 text-center">
        <div class="mb-3 text-4xl">✗</div>
        <h2 class="text-base font-semibold mb-1">Connection failed</h2>
        <p class="text-sm text-muted-foreground mb-4">
          Could not authorize {{ selectedProvider }}. Please try again or contact support.
        </p>
        <div class="space-y-2">
          <button class="w-full rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background hover:bg-foreground/90"
            @click="retryAuth">Try again</button>
          <button class="w-full rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted">Contact support</button>
        </div>
      </div>
    </div>
  </div>
</template>
```

- [ ] **Step 2: Commit**

```bash
git add src/views/EmbeddedView.vue
git commit -m "feat(wave3): implement EmbeddedView with 3-screen iframe-safe flow"
```

---

## Task 10: Supporting flows — inline interactions

**Files:**
- Modify: `src/views/WorkflowsView.vue`
- Modify: `src/views/ConnectorsView.vue`

- [ ] **Step 1: Read WorkflowsView to understand current structure**

Read `src/views/WorkflowsView.vue` first.

- [ ] **Step 2: Add duplicate, archive, export to WorkflowsView**

In `WorkflowsView.vue`, add a row action menu to each workflow row. Add imports for `MoreHorizontal`, `Copy`, `Archive`, `Download` from `lucide-vue-next`. Add the following state and actions:

```typescript
// Add to <script setup>
import { ref } from 'vue'  // (if not already imported)
import { MoreHorizontal, Copy, Archive, Download } from 'lucide-vue-next'
import { useWorkflowsStore } from '@/stores/workflows'

const store = useWorkflowsStore()
const openMenuId = ref<string | null>(null)

function duplicate(workflowId: string) {
  const source = store.getSummary(workflowId)
  if (!source) return
  store.summaries.push({
    ...source,
    workflowId: `wf_${Date.now()}`,
    name: source.name + ' (copy)',
    status: 'draft',
    updatedAt: new Date().toISOString(),
  })
  openMenuId.value = null
}

function archive(workflowId: string) {
  const w = store.summaries.find(s => s.workflowId === workflowId)
  if (w) w.status = 'archived'
  openMenuId.value = null
}

function exportWorkflow(workflowId: string) {
  const def = store.getDefinition(workflowId)
  if (!def) return
  const blob = new Blob([JSON.stringify(def, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `workflow-${workflowId}.json`
  a.click()
  URL.revokeObjectURL(url)
  openMenuId.value = null
}
```

In the template, add a `⋮` menu button at the end of each row that shows a dropdown with Duplicate, Archive, Export options. Example (add after the last `<td>` in each row):

```vue
<td class="px-4 py-3 relative">
  <button class="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
    @click.stop="openMenuId = openMenuId === w.workflowId ? null : w.workflowId">
    <MoreHorizontal class="h-4 w-4" />
  </button>
  <div v-if="openMenuId === w.workflowId"
    class="absolute right-4 top-10 z-10 w-40 rounded-lg border bg-background shadow-md py-1">
    <button class="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-muted"
      @click="duplicate(w.workflowId)">
      <Copy class="h-3.5 w-3.5" /> Duplicate
    </button>
    <button class="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-muted"
      @click="exportWorkflow(w.workflowId)">
      <Download class="h-3.5 w-3.5" /> Export JSON
    </button>
    <button class="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-500 hover:bg-muted"
      @click="archive(w.workflowId)">
      <Archive class="h-3.5 w-3.5" /> Archive
    </button>
  </div>
</td>
```

Also add `@click="openMenuId = null"` on the outer wrapper div to close the menu when clicking elsewhere.

- [ ] **Step 3: Read ConnectorsView to understand current structure**

Read `src/views/ConnectorsView.vue`.

- [ ] **Step 4: Add expired-auth failure state to ConnectorsView**

In `ConnectorsView.vue`, add to `<script setup>`:

```typescript
import { AlertTriangle } from 'lucide-vue-next'
```

At the top of the template (inside the outer div, before the connector grid), add the expired-auth warning banner:

```vue
<div class="mx-6 mt-4 flex items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
  <AlertTriangle class="h-4 w-4 shrink-0" />
  <span><strong>Salesforce OAuth token</strong> has expired. Your workflows using this connector may fail.</span>
  <button class="ml-auto rounded-md border border-amber-300 bg-amber-100 px-3 py-1 text-xs font-medium hover:bg-amber-200">
    Reconnect
  </button>
</div>
```

- [ ] **Step 5: Add insufficient permissions failure state to MembersView**

In `src/views/MembersView.vue`, add a locked resource example at the bottom of the member list table. After the `</table>` closing tag, add:

```vue
<!-- Insufficient permissions failure state -->
<div class="mt-4 flex items-center gap-3 rounded-lg border border-muted px-4 py-3 text-sm text-muted-foreground">
  <span class="text-lg">🔒</span>
  <span>Some settings require <strong>Admin</strong> permissions. Contact your workspace admin to request access.</span>
</div>
```

- [ ] **Step 6: Note on deferred supporting flows**

The following two supporting flows from the spec require a `WorkflowDetailView` (version history tab) which is not in this plan. They are deferred to the next implementation cycle:

- **Rollback workflow version** — Workflow detail → Version history → Restore button + confirm modal
- **Compare workflow versions** — Workflow detail → Version history → Select 2 → diff view

All other 9 supporting flows are covered in this plan.

- [ ] **Step 7: Commit**

```bash
git add src/views/WorkflowsView.vue src/views/ConnectorsView.vue src/views/MembersView.vue
git commit -m "feat(wave3): add duplicate/archive/export flows, expired-auth banner, insufficient permissions state"
```

---

## Task 11: Final verification

- [ ] **Step 1: Run full test suite**

```bash
cd apps/web && npm test
```
Expected: all tests pass.

- [ ] **Step 2: Start dev server and walk the full demo**

```bash
cd apps/web && npm run dev
```

Verify the complete Phase 2 demo path:

1. **Entry:** `/auth/login` → login → `/onboarding` → finish → `/dashboard`
2. **Build:** Workflows → duplicate, archive, export JSON; open Builder → select each node type → inspector shows correct fields; Connectors → expired auth banner visible; Templates → category filter works; Secrets → rotation banner
3. **Operate:** Runs → open failed run → retry button; Monitoring → KPIs + worker health; Alerts → open incidents → acknowledge + resolve; Triggers → toggle
4. **Ecosystem:** Marketplace → tab switches, search filters, category pills, click card → listing detail page; navigate to Connector Builder → complete 5-step wizard
5. **Platform:** Environments → card grid → click → slide-over with install instructions; Billing → usage meters with color coding; Audit → search + expand diff
6. **Admin:** Members → invite modal; Settings → tab navigation; Profile → user info; `/settings` accessible from sidebar footer
7. **Embedded:** Navigate to `/embedded?brand=DemoApp` — provider selection → auth screen → success state
8. **Global overlays:** Bell icon → notifications; workspace name → switcher; ⌘K → command palette
9. **Failure states:** schema drift panel in failed run detail; expired auth banner on connectors; degraded worker banner on monitoring; quota near-limit indicator on billing

- [ ] **Step 3: Final Wave 3 commit**

```bash
git add -A
git commit -m "feat: Wave 3 complete — all new surfaces, supporting flows, and failure states"
```
