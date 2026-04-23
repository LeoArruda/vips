# Phase 2 Wave 2 — Port Existing Mockups to Vue

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Port all existing HTML wireframes in `UI/mockup/` to functional Vue views, plus add the three global overlays (Notifications, Workspace Switcher, Command Palette) to the app shell. After Wave 2 the demo covers all core builder and admin flows without dead-end navigation.

**Architecture:** Each view reads from a new Pinia store backed by typed stub data in `src/data/`. The three overlays are registered globally in `AppShell.vue` and toggled via a shared `useShellStore`. `RunDetailView` gains retry + version-diff inline interactions.

**Tech Stack:** Vue 3 `<script setup lang="ts">`, Pinia, Tailwind CSS, Vitest + @vue/test-utils. All commands from `apps/web/`. Reference mockups in `../../UI/mockup/` for layout details.

**Prerequisite:** Wave 1 plan must be complete (stub views already exist for all routes).

---

## File Map

| Action | Path | Responsibility |
|--------|------|---------------|
| Create | `src/types/platform.ts` | Secret, Trigger, Member, Template types |
| Create | `src/data/secrets.ts` | Stub secrets |
| Create | `src/data/triggers.ts` | Stub triggers/schedules |
| Create | `src/data/members.ts` | Stub members + roles |
| Create | `src/data/templates.ts` | Stub workflow templates |
| Create | `src/stores/secrets.ts` | useSecretsStore |
| Create | `src/stores/triggers.ts` | useTriggersStore |
| Create | `src/stores/members.ts` | useMembersStore |
| Create | `src/stores/__tests__/secrets.test.ts` | Store tests |
| Create | `src/stores/__tests__/triggers.test.ts` | Store tests |
| Create | `src/stores/__tests__/members.test.ts` | Store tests |
| Replace | `src/views/TriggersView.vue` | Full triggers/schedules page |
| Replace | `src/views/SecretsView.vue` | Secrets & credentials page |
| Replace | `src/views/MembersView.vue` | Team members & roles page |
| Replace | `src/views/TemplatesView.vue` | Templates library page |
| Modify | `src/views/RunDetailView.vue` | Add retry button + schema diff panel |
| Replace | `src/views/SettingsView.vue` | Tabbed workspace settings |
| Replace | `src/views/ProfileView.vue` | User profile page |
| Create | `src/stores/shell.ts` | useShellStore — overlay toggle state |
| Create | `src/components/layout/NotificationsPanel.vue` | Slide-over notifications drawer |
| Create | `src/components/layout/WorkspaceSwitcher.vue` | Workspace switcher dropdown |
| Create | `src/components/layout/CommandPalette.vue` | ⌘K command palette overlay |
| Modify | `src/components/layout/AppTopBar.vue` | Wire notification + workspace switcher buttons |
| Modify | `src/components/layout/AppShell.vue` | Mount global overlays |

---

## Task 1: Platform types and stub data

**Files:**
- Create: `src/types/platform.ts`
- Create: `src/data/secrets.ts`
- Create: `src/data/triggers.ts`
- Create: `src/data/members.ts`
- Create: `src/data/templates.ts`

- [ ] **Step 1: Create platform types**

```typescript
// src/types/platform.ts
export type SecretScope = 'workspace' | 'environment' | 'connector'
export type SecretRotationState = 'ok' | 'due' | 'overdue'
export type MemberRole = 'admin' | 'builder' | 'operator' | 'partner'
export type MemberStatus = 'active' | 'invited' | 'suspended'
export type TriggerKind = 'schedule' | 'webhook' | 'manual' | 'event'
export type TemplateCategory = 'crm' | 'analytics' | 'finance' | 'marketing' | 'devops'

export interface Secret {
  secretId: string
  name: string
  scope: SecretScope
  environment: string
  linkedTo: string[]
  rotationState: SecretRotationState
  lastRotatedAt: string
  createdAt: string
}

export interface TriggerConfig {
  triggerId: string
  workflowId: string
  workflowName: string
  kind: TriggerKind
  cron?: string
  webhookUrl?: string
  timezone?: string
  enabled: boolean
  nextRunAt?: string
  lastRunAt?: string
}

export interface Member {
  memberId: string
  name: string
  email: string
  role: MemberRole
  status: MemberStatus
  joinedAt: string
}

export interface WorkflowTemplate {
  templateId: string
  name: string
  description: string
  category: TemplateCategory
  connectors: string[]
  usageCount: number
  featured: boolean
}
```

- [ ] **Step 2: Create stub data files**

```typescript
// src/data/secrets.ts
import type { Secret } from '@/types/platform'

export const stubSecrets: Secret[] = [
  { secretId: 'sec_001', name: 'postgres-prod-creds', scope: 'connector', environment: 'prod', linkedTo: ['conn_001'], rotationState: 'ok', lastRotatedAt: '2026-03-01T00:00:00Z', createdAt: '2025-09-01T00:00:00Z' },
  { secretId: 'sec_002', name: 'salesforce-oauth-token', scope: 'connector', environment: 'prod', linkedTo: ['conn_003'], rotationState: 'due', lastRotatedAt: '2025-10-01T00:00:00Z', createdAt: '2025-09-15T00:00:00Z' },
  { secretId: 'sec_003', name: 'stripe-api-key', scope: 'workspace', environment: 'prod', linkedTo: ['wf_002'], rotationState: 'overdue', lastRotatedAt: '2025-06-01T00:00:00Z', createdAt: '2025-06-01T00:00:00Z' },
  { secretId: 'sec_004', name: 'bigquery-service-account', scope: 'connector', environment: 'prod', linkedTo: ['conn_002'], rotationState: 'ok', lastRotatedAt: '2026-02-15T00:00:00Z', createdAt: '2025-09-20T00:00:00Z' },
]
```

```typescript
// src/data/triggers.ts
import type { TriggerConfig } from '@/types/platform'

export const stubTriggers: TriggerConfig[] = [
  { triggerId: 'tr_001', workflowId: 'wf_001', workflowName: 'Salesforce → BigQuery Sync', kind: 'schedule', cron: '0 8 * * *', timezone: 'UTC', enabled: true, nextRunAt: '2026-04-23T08:00:00Z', lastRunAt: '2026-04-22T08:00:00Z' },
  { triggerId: 'tr_002', workflowId: 'wf_002', workflowName: 'Stripe Payments Pipeline', kind: 'webhook', webhookUrl: 'https://hooks.vipsos.io/wf_002/abc123', enabled: true, lastRunAt: '2026-04-22T06:30:00Z' },
  { triggerId: 'tr_003', workflowId: 'wf_004', workflowName: 'Nightly Archive', kind: 'schedule', cron: '0 2 * * *', timezone: 'America/New_York', enabled: false, nextRunAt: undefined, lastRunAt: '2026-04-21T02:00:00Z' },
]
```

```typescript
// src/data/members.ts
import type { Member } from '@/types/platform'

export const stubMembers: Member[] = [
  { memberId: 'u_001', name: 'Alex Rivera', email: 'alex@acme.io', role: 'admin', status: 'active', joinedAt: '2025-09-01T00:00:00Z' },
  { memberId: 'u_002', name: 'Jordan Kim', email: 'jordan@acme.io', role: 'builder', status: 'active', joinedAt: '2025-10-15T00:00:00Z' },
  { memberId: 'u_003', name: 'Sam Patel', email: 'sam@acme.io', role: 'operator', status: 'active', joinedAt: '2026-01-10T00:00:00Z' },
  { memberId: 'u_004', name: 'Casey Chen', email: 'casey@acme.io', role: 'builder', status: 'invited', joinedAt: '2026-04-20T00:00:00Z' },
]
```

```typescript
// src/data/templates.ts
import type { WorkflowTemplate } from '@/types/platform'

export const stubTemplates: WorkflowTemplate[] = [
  { templateId: 'tpl_001', name: 'CRM Contact Sync', description: 'Sync contacts from any CRM to your data warehouse on a schedule.', category: 'crm', connectors: ['Salesforce', 'BigQuery'], usageCount: 2340, featured: true },
  { templateId: 'tpl_002', name: 'Payment Pipeline', description: 'Capture Stripe events and route them to your analytics platform.', category: 'finance', connectors: ['Stripe', 'Segment'], usageCount: 1870, featured: true },
  { templateId: 'tpl_003', name: 'Lead Enrichment', description: 'Enrich inbound HubSpot leads with company data automatically.', category: 'marketing', connectors: ['HubSpot', 'Clearbit'], usageCount: 980, featured: false },
  { templateId: 'tpl_004', name: 'Error Alert Pipeline', description: 'Capture application errors and route alerts to Slack and PagerDuty.', category: 'devops', connectors: ['Datadog', 'Slack', 'PagerDuty'], usageCount: 645, featured: false },
  { templateId: 'tpl_005', name: 'Marketing Attribution', description: 'Join ad spend data with CRM revenue for ROI reporting.', category: 'analytics', connectors: ['Google Ads', 'Salesforce', 'BigQuery'], usageCount: 412, featured: false },
]
```

- [ ] **Step 3: Commit**

```bash
git add src/types/platform.ts src/data/secrets.ts src/data/triggers.ts src/data/members.ts src/data/templates.ts
git commit -m "feat(wave2): add platform types and stub data"
```

---

## Task 2: Pinia stores — Secrets, Triggers, Members

**Files:**
- Create: `src/stores/secrets.ts`
- Create: `src/stores/triggers.ts`
- Create: `src/stores/members.ts`
- Create: `src/stores/__tests__/secrets.test.ts`
- Create: `src/stores/__tests__/triggers.test.ts`
- Create: `src/stores/__tests__/members.test.ts`

- [ ] **Step 1: Write failing store tests**

```typescript
// src/stores/__tests__/secrets.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useSecretsStore } from '../secrets'

describe('useSecretsStore', () => {
  beforeEach(() => { setActivePinia(createPinia()) })

  it('loads stub secrets', () => {
    const store = useSecretsStore()
    expect(store.secrets.length).toBeGreaterThan(0)
  })

  it('counts secrets needing rotation', () => {
    const store = useSecretsStore()
    const expected = store.secrets.filter(s => s.rotationState !== 'ok').length
    expect(store.rotationAlertCount).toBe(expected)
  })

  it('filters secrets by scope', () => {
    const store = useSecretsStore()
    const connectorSecrets = store.byScope('connector')
    expect(connectorSecrets.every(s => s.scope === 'connector')).toBe(true)
  })
})
```

```typescript
// src/stores/__tests__/triggers.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useTriggersStore } from '../triggers'

describe('useTriggersStore', () => {
  beforeEach(() => { setActivePinia(createPinia()) })

  it('loads stub triggers', () => {
    const store = useTriggersStore()
    expect(store.triggers.length).toBeGreaterThan(0)
  })

  it('toggles enabled state', () => {
    const store = useTriggersStore()
    const initial = store.triggers[0].enabled
    store.toggle(store.triggers[0].triggerId)
    expect(store.triggers[0].enabled).toBe(!initial)
  })

  it('returns only enabled triggers', () => {
    const store = useTriggersStore()
    expect(store.enabled.every(t => t.enabled)).toBe(true)
  })
})
```

```typescript
// src/stores/__tests__/members.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useMembersStore } from '../members'

describe('useMembersStore', () => {
  beforeEach(() => { setActivePinia(createPinia()) })

  it('loads stub members', () => {
    const store = useMembersStore()
    expect(store.members.length).toBeGreaterThan(0)
  })

  it('counts active members', () => {
    const store = useMembersStore()
    const expected = store.members.filter(m => m.status === 'active').length
    expect(store.activeCount).toBe(expected)
  })

  it('finds a member by id', () => {
    const store = useMembersStore()
    expect(store.findById('u_001')?.name).toBe('Alex Rivera')
  })
})
```

- [ ] **Step 2: Run — expect FAIL**

```bash
cd apps/web && npm test -- secrets triggers members
```
Expected: module not found errors.

- [ ] **Step 3: Implement the three stores**

```typescript
// src/stores/secrets.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { stubSecrets } from '@/data/secrets'
import type { Secret, SecretScope } from '@/types/platform'

export const useSecretsStore = defineStore('secrets', () => {
  const secrets = ref<Secret[]>(stubSecrets)
  const rotationAlertCount = computed(() =>
    secrets.value.filter(s => s.rotationState !== 'ok').length
  )
  function byScope(scope: SecretScope) {
    return secrets.value.filter(s => s.scope === scope)
  }
  return { secrets, rotationAlertCount, byScope }
})
```

```typescript
// src/stores/triggers.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { stubTriggers } from '@/data/triggers'
import type { TriggerConfig } from '@/types/platform'

export const useTriggersStore = defineStore('triggers', () => {
  const triggers = ref<TriggerConfig[]>(stubTriggers)
  const enabled = computed(() => triggers.value.filter(t => t.enabled))
  function toggle(triggerId: string) {
    const t = triggers.value.find(t => t.triggerId === triggerId)
    if (t) t.enabled = !t.enabled
  }
  return { triggers, enabled, toggle }
})
```

```typescript
// src/stores/members.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { stubMembers } from '@/data/members'
import type { Member } from '@/types/platform'

export const useMembersStore = defineStore('members', () => {
  const members = ref<Member[]>(stubMembers)
  const activeCount = computed(() => members.value.filter(m => m.status === 'active').length)
  function findById(memberId: string): Member | undefined {
    return members.value.find(m => m.memberId === memberId)
  }
  return { members, activeCount, findById }
})
```

- [ ] **Step 4: Run — expect PASS**

```bash
cd apps/web && npm test -- secrets triggers members
```
Expected: 9 tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/stores/secrets.ts src/stores/triggers.ts src/stores/members.ts src/stores/__tests__/
git commit -m "feat(wave2): add Secrets, Triggers, Members stores with tests"
```

---

## Task 3: TriggersView

**Files:**
- Replace: `src/views/TriggersView.vue`

Reference wireframe: `UI/mockup/triggers.html`

- [ ] **Step 1: Replace stub with full TriggersView**

```vue
<!-- src/views/TriggersView.vue -->
<script setup lang="ts">
import { ref } from 'vue'
import { useTriggersStore } from '@/stores/triggers'
import { RouterLink } from 'vue-router'
import { Plus, ToggleLeft, ToggleRight, Webhook, Clock } from 'lucide-vue-next'

const store = useTriggersStore()
const showCreate = ref(false)

function formatCron(cron: string) {
  const map: Record<string, string> = {
    '0 8 * * *': 'Daily at 08:00',
    '0 2 * * *': 'Daily at 02:00',
    '0 * * * *': 'Every hour',
  }
  return map[cron] ?? cron
}
</script>

<template>
  <div class="flex h-full flex-col overflow-auto">
    <div class="flex items-center justify-between border-b px-6 py-4">
      <div>
        <h1 class="text-xl font-semibold">Triggers & Schedules</h1>
        <p class="mt-0.5 text-sm text-muted-foreground">
          {{ store.enabled.length }} active trigger{{ store.enabled.length !== 1 ? 's' : '' }}
        </p>
      </div>
      <button class="flex items-center gap-2 rounded-md bg-foreground px-3 py-2 text-sm font-medium text-background hover:bg-foreground/90"
        @click="showCreate = true">
        <Plus class="h-4 w-4" /> Add trigger
      </button>
    </div>

    <div class="flex-1 overflow-y-auto p-6">
      <div class="overflow-hidden rounded-lg border">
        <table class="w-full text-sm">
          <thead class="bg-muted/50">
            <tr>
              <th class="px-4 py-3 text-left font-medium text-muted-foreground">Workflow</th>
              <th class="px-4 py-3 text-left font-medium text-muted-foreground">Type</th>
              <th class="px-4 py-3 text-left font-medium text-muted-foreground">Schedule / URL</th>
              <th class="px-4 py-3 text-left font-medium text-muted-foreground">Next run</th>
              <th class="px-4 py-3 text-left font-medium text-muted-foreground">Enabled</th>
            </tr>
          </thead>
          <tbody class="divide-y">
            <tr v-for="t in store.triggers" :key="t.triggerId" class="hover:bg-muted/30">
              <td class="px-4 py-3">
                <RouterLink :to="`/workflows`" class="font-medium hover:underline">
                  {{ t.workflowName }}
                </RouterLink>
              </td>
              <td class="px-4 py-3">
                <span class="flex items-center gap-1.5 text-muted-foreground">
                  <Clock v-if="t.kind === 'schedule'" class="h-3.5 w-3.5" />
                  <Webhook v-else class="h-3.5 w-3.5" />
                  {{ t.kind }}
                </span>
              </td>
              <td class="px-4 py-3 text-muted-foreground">
                <span v-if="t.cron">{{ formatCron(t.cron) }} ({{ t.timezone }})</span>
                <code v-else-if="t.webhookUrl" class="rounded bg-muted px-1.5 py-0.5 text-xs">
                  {{ t.webhookUrl }}
                </code>
              </td>
              <td class="px-4 py-3 text-muted-foreground">
                {{ t.nextRunAt ? new Date(t.nextRunAt).toLocaleString() : '—' }}
              </td>
              <td class="px-4 py-3">
                <button @click="store.toggle(t.triggerId)" class="text-muted-foreground hover:text-foreground">
                  <ToggleRight v-if="t.enabled" class="h-5 w-5 text-green-500" />
                  <ToggleLeft v-else class="h-5 w-5" />
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Create trigger modal placeholder -->
      <div v-if="showCreate" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
        @click.self="showCreate = false">
        <div class="w-full max-w-md rounded-xl border bg-background p-6 shadow-lg">
          <h2 class="text-lg font-semibold">Add Trigger</h2>
          <p class="mt-1 text-sm text-muted-foreground">Choose a type to configure.</p>
          <div class="mt-4 grid grid-cols-2 gap-3">
            <button class="rounded-lg border p-4 text-left hover:bg-muted" @click="showCreate = false">
              <Clock class="mb-2 h-5 w-5 text-muted-foreground" />
              <div class="font-medium">Schedule</div>
              <div class="mt-0.5 text-xs text-muted-foreground">Run on a cron or interval</div>
            </button>
            <button class="rounded-lg border p-4 text-left hover:bg-muted" @click="showCreate = false">
              <Webhook class="mb-2 h-5 w-5 text-muted-foreground" />
              <div class="font-medium">Webhook</div>
              <div class="mt-0.5 text-xs text-muted-foreground">Trigger on HTTP POST</div>
            </button>
          </div>
          <button class="mt-4 text-sm text-muted-foreground hover:text-foreground" @click="showCreate = false">Cancel</button>
        </div>
      </div>
    </div>
  </div>
</template>
```

- [ ] **Step 2: Commit**

```bash
git add src/views/TriggersView.vue
git commit -m "feat(wave2): implement TriggersView with toggle and create modal"
```

---

## Task 4: SecretsView

**Files:**
- Replace: `src/views/SecretsView.vue`

Reference wireframe: `UI/mockup/secrets.html`

- [ ] **Step 1: Replace stub with full SecretsView**

```vue
<!-- src/views/SecretsView.vue -->
<script setup lang="ts">
import { ref, computed } from 'vue'
import { useSecretsStore } from '@/stores/secrets'
import { KeyRound, AlertTriangle, RotateCw, Plus } from 'lucide-vue-next'

const store = useSecretsStore()
const search = ref('')

const filtered = computed(() =>
  store.secrets.filter(s => s.name.toLowerCase().includes(search.value.toLowerCase()))
)

const rotationBadge: Record<string, string> = {
  ok: 'bg-green-100 text-green-700',
  due: 'bg-amber-100 text-amber-700',
  overdue: 'bg-red-100 text-red-700',
}
</script>

<template>
  <div class="flex h-full flex-col overflow-auto">
    <div class="flex items-center justify-between border-b px-6 py-4">
      <div>
        <h1 class="text-xl font-semibold">Secrets & Credentials</h1>
        <p class="mt-0.5 text-sm text-muted-foreground">
          {{ store.rotationAlertCount }} secret{{ store.rotationAlertCount !== 1 ? 's' : '' }} need rotation
        </p>
      </div>
      <button class="flex items-center gap-2 rounded-md bg-foreground px-3 py-2 text-sm font-medium text-background hover:bg-foreground/90">
        <Plus class="h-4 w-4" /> New secret
      </button>
    </div>

    <div class="flex-1 overflow-y-auto p-6">
      <!-- Rotation alert banner -->
      <div v-if="store.rotationAlertCount > 0"
        class="mb-4 flex items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
        <AlertTriangle class="h-4 w-4 shrink-0" />
        {{ store.rotationAlertCount }} secret(s) are due or overdue for rotation. Rotate them to maintain security compliance.
      </div>

      <div class="mb-4">
        <input v-model="search" placeholder="Search secrets…"
          class="w-full max-w-sm rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" />
      </div>

      <div class="overflow-hidden rounded-lg border">
        <table class="w-full text-sm">
          <thead class="bg-muted/50">
            <tr>
              <th class="px-4 py-3 text-left font-medium text-muted-foreground">Name</th>
              <th class="px-4 py-3 text-left font-medium text-muted-foreground">Scope</th>
              <th class="px-4 py-3 text-left font-medium text-muted-foreground">Environment</th>
              <th class="px-4 py-3 text-left font-medium text-muted-foreground">Rotation</th>
              <th class="px-4 py-3 text-left font-medium text-muted-foreground">Last rotated</th>
              <th class="px-4 py-3 text-left font-medium text-muted-foreground"></th>
            </tr>
          </thead>
          <tbody class="divide-y">
            <tr v-for="s in filtered" :key="s.secretId" class="hover:bg-muted/30">
              <td class="px-4 py-3">
                <div class="flex items-center gap-2">
                  <KeyRound class="h-3.5 w-3.5 text-muted-foreground" />
                  <span class="font-medium">{{ s.name }}</span>
                </div>
              </td>
              <td class="px-4 py-3 text-muted-foreground capitalize">{{ s.scope }}</td>
              <td class="px-4 py-3 text-muted-foreground">{{ s.environment }}</td>
              <td class="px-4 py-3">
                <span class="rounded-full px-2.5 py-0.5 text-xs font-medium capitalize"
                  :class="rotationBadge[s.rotationState]">
                  {{ s.rotationState }}
                </span>
              </td>
              <td class="px-4 py-3 text-muted-foreground">
                {{ new Date(s.lastRotatedAt).toLocaleDateString() }}
              </td>
              <td class="px-4 py-3">
                <button class="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
                  <RotateCw class="h-3.5 w-3.5" /> Rotate
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>
```

- [ ] **Step 2: Commit**

```bash
git add src/views/SecretsView.vue
git commit -m "feat(wave2): implement SecretsView with rotation state and search"
```

---

## Task 5: MembersView

**Files:**
- Replace: `src/views/MembersView.vue`

Reference wireframe: `UI/mockup/members.html`

- [ ] **Step 1: Replace stub with full MembersView**

```vue
<!-- src/views/MembersView.vue -->
<script setup lang="ts">
import { ref } from 'vue'
import { useMembersStore } from '@/stores/members'
import { UserPlus } from 'lucide-vue-next'

const store = useMembersStore()
const showInvite = ref(false)
const inviteEmail = ref('')
const inviteRole = ref('builder')

const roleBadge: Record<string, string> = {
  admin: 'bg-purple-100 text-purple-700',
  builder: 'bg-blue-100 text-blue-700',
  operator: 'bg-amber-100 text-amber-700',
  partner: 'bg-green-100 text-green-700',
}

const statusBadge: Record<string, string> = {
  active: 'bg-green-100 text-green-700',
  invited: 'bg-amber-100 text-amber-700',
  suspended: 'bg-red-100 text-red-700',
}
</script>

<template>
  <div class="flex h-full flex-col overflow-auto">
    <div class="flex items-center justify-between border-b px-6 py-4">
      <div>
        <h1 class="text-xl font-semibold">Members & Roles</h1>
        <p class="mt-0.5 text-sm text-muted-foreground">{{ store.activeCount }} active members</p>
      </div>
      <button class="flex items-center gap-2 rounded-md bg-foreground px-3 py-2 text-sm font-medium text-background hover:bg-foreground/90"
        @click="showInvite = true">
        <UserPlus class="h-4 w-4" /> Invite member
      </button>
    </div>

    <div class="flex-1 overflow-y-auto p-6">
      <div class="overflow-hidden rounded-lg border">
        <table class="w-full text-sm">
          <thead class="bg-muted/50">
            <tr>
              <th class="px-4 py-3 text-left font-medium text-muted-foreground">Name</th>
              <th class="px-4 py-3 text-left font-medium text-muted-foreground">Email</th>
              <th class="px-4 py-3 text-left font-medium text-muted-foreground">Role</th>
              <th class="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
              <th class="px-4 py-3 text-left font-medium text-muted-foreground">Joined</th>
              <th class="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody class="divide-y">
            <tr v-for="m in store.members" :key="m.memberId" class="hover:bg-muted/30">
              <td class="px-4 py-3">
                <div class="flex items-center gap-2.5">
                  <div class="flex h-7 w-7 items-center justify-center rounded-full bg-muted text-xs font-semibold">
                    {{ m.name.charAt(0) }}
                  </div>
                  <span class="font-medium">{{ m.name }}</span>
                </div>
              </td>
              <td class="px-4 py-3 text-muted-foreground">{{ m.email }}</td>
              <td class="px-4 py-3">
                <span class="rounded-full px-2.5 py-0.5 text-xs font-medium capitalize"
                  :class="roleBadge[m.role]">{{ m.role }}</span>
              </td>
              <td class="px-4 py-3">
                <span class="rounded-full px-2.5 py-0.5 text-xs font-medium capitalize"
                  :class="statusBadge[m.status]">{{ m.status }}</span>
              </td>
              <td class="px-4 py-3 text-muted-foreground">
                {{ new Date(m.joinedAt).toLocaleDateString() }}
              </td>
              <td class="px-4 py-3">
                <select class="rounded-md border bg-background px-2 py-1 text-xs outline-none focus:ring-1 focus:ring-ring">
                  <option value="admin">Admin</option>
                  <option value="builder">Builder</option>
                  <option value="operator">Operator</option>
                </select>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Invite modal -->
    <div v-if="showInvite" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      @click.self="showInvite = false">
      <div class="w-full max-w-sm rounded-xl border bg-background p-6 shadow-lg">
        <h2 class="text-lg font-semibold">Invite team member</h2>
        <div class="mt-4 space-y-3">
          <div>
            <label class="mb-1 block text-sm font-medium">Email</label>
            <input v-model="inviteEmail" type="email" placeholder="colleague@company.com"
              class="w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" />
          </div>
          <div>
            <label class="mb-1 block text-sm font-medium">Role</label>
            <select v-model="inviteRole" class="w-full rounded-md border px-3 py-2 text-sm outline-none">
              <option value="admin">Admin</option>
              <option value="builder">Builder</option>
              <option value="operator">Operator</option>
            </select>
          </div>
        </div>
        <div class="mt-4 flex gap-2">
          <button class="flex-1 rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted"
            @click="showInvite = false">Cancel</button>
          <button class="flex-1 rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background hover:bg-foreground/90"
            @click="showInvite = false">Send invite</button>
        </div>
      </div>
    </div>
  </div>
</template>
```

- [ ] **Step 2: Commit**

```bash
git add src/views/MembersView.vue
git commit -m "feat(wave2): implement MembersView with role management and invite modal"
```

---

## Task 6: TemplatesView

**Files:**
- Replace: `src/views/TemplatesView.vue`

Reference wireframe: `UI/mockup/templates.html`

- [ ] **Step 1: Replace stub with full TemplatesView**

```vue
<!-- src/views/TemplatesView.vue -->
<script setup lang="ts">
import { ref, computed } from 'vue'
import { stubTemplates } from '@/data/templates'
import { useRouter } from 'vue-router'
import { Star, Users } from 'lucide-vue-next'

const router = useRouter()
const search = ref('')
const selectedCategory = ref('all')

const categories = ['all', 'crm', 'analytics', 'finance', 'marketing', 'devops']

const filtered = computed(() =>
  stubTemplates.filter(t => {
    const matchesSearch = t.name.toLowerCase().includes(search.value.toLowerCase()) ||
      t.description.toLowerCase().includes(search.value.toLowerCase())
    const matchesCategory = selectedCategory.value === 'all' || t.category === selectedCategory.value
    return matchesSearch && matchesCategory
  })
)

function useTemplate(templateId: string) {
  // In demo: navigate to builder with template pre-loaded
  router.push('/workflows')
}
</script>

<template>
  <div class="flex h-full flex-col overflow-auto">
    <div class="border-b px-6 py-4">
      <h1 class="text-xl font-semibold">Templates</h1>
      <p class="mt-0.5 text-sm text-muted-foreground">Start from a proven workflow pattern</p>
    </div>

    <div class="flex-1 overflow-y-auto p-6">
      <!-- Search + category filter -->
      <div class="mb-6 flex flex-wrap items-center gap-3">
        <input v-model="search" placeholder="Search templates…"
          class="rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring w-64" />
        <div class="flex gap-2 flex-wrap">
          <button v-for="cat in categories" :key="cat"
            class="rounded-full px-3 py-1 text-sm font-medium capitalize transition-colors"
            :class="selectedCategory === cat ? 'bg-foreground text-background' : 'border hover:bg-muted'"
            @click="selectedCategory = cat">
            {{ cat }}
          </button>
        </div>
      </div>

      <!-- Featured templates -->
      <div v-if="filtered.some(t => t.featured)" class="mb-8">
        <h2 class="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Featured</h2>
        <div class="grid grid-cols-2 gap-4">
          <div v-for="t in filtered.filter(t => t.featured)" :key="t.templateId"
            class="rounded-lg border bg-gradient-to-br from-background to-muted/30 p-5 hover:shadow-sm">
            <div class="mb-2 flex items-start justify-between">
              <h3 class="font-semibold">{{ t.name }}</h3>
              <Star class="h-4 w-4 text-amber-400 fill-amber-400" />
            </div>
            <p class="mb-3 text-sm text-muted-foreground">{{ t.description }}</p>
            <div class="mb-3 flex flex-wrap gap-1.5">
              <span v-for="c in t.connectors" :key="c"
                class="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium">{{ c }}</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="flex items-center gap-1 text-xs text-muted-foreground">
                <Users class="h-3 w-3" /> {{ t.usageCount.toLocaleString() }} uses
              </span>
              <button class="rounded-md bg-foreground px-3 py-1.5 text-xs font-medium text-background hover:bg-foreground/90"
                @click="useTemplate(t.templateId)">
                Use template
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- All templates -->
      <div>
        <h2 class="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">All Templates</h2>
        <div class="grid grid-cols-3 gap-4">
          <div v-for="t in filtered.filter(t => !t.featured)" :key="t.templateId"
            class="rounded-lg border p-4 hover:shadow-sm">
            <h3 class="font-semibold">{{ t.name }}</h3>
            <p class="mt-1 text-sm text-muted-foreground line-clamp-2">{{ t.description }}</p>
            <div class="mt-2 flex flex-wrap gap-1">
              <span v-for="c in t.connectors" :key="c"
                class="rounded-full bg-muted px-2 py-0.5 text-xs">{{ c }}</span>
            </div>
            <div class="mt-3 flex items-center justify-between">
              <span class="text-xs text-muted-foreground">{{ t.usageCount.toLocaleString() }} uses</span>
              <button class="text-xs font-medium text-foreground underline underline-offset-2 hover:no-underline"
                @click="useTemplate(t.templateId)">Use</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
```

- [ ] **Step 2: Commit**

```bash
git add src/views/TemplatesView.vue
git commit -m "feat(wave2): implement TemplatesView with category filter and featured section"
```

---

## Task 7: RunDetailView — retry button and schema diff

**Files:**
- Modify: `src/views/RunDetailView.vue`

Read the current file before editing:

- [ ] **Step 1: Read current RunDetailView**

Read `src/views/RunDetailView.vue` to see what exists. Then add the retry button next to failed nodes and a schema diff panel at the bottom of the run detail.

- [ ] **Step 2: Add retry action to useRunsStore**

Open `src/stores/runs.ts` and add a `retryNode` action:

```typescript
// Add inside the store's return, after existing actions:
function retryNode(runId: string, nodeId: string) {
  const run = runDetails.value.find(r => r.runId === runId)
  if (!run) return
  const node = run.nodes.find(n => n.nodeId === nodeId)
  if (node) node.status = 'running'
  // Simulate resolution after 1.5s
  setTimeout(() => {
    if (node) node.status = 'success'
  }, 1500)
}
```

Also add `retryNode` to the return object.

- [ ] **Step 3: Add retry button to RunDetailView failed nodes**

In `RunDetailView.vue`, find where each node row is rendered (the `v-for` over `run.nodes`). After the node status badge, add:

```vue
<button
  v-if="node.status === 'failed'"
  class="ml-auto flex items-center gap-1 rounded-md border px-2.5 py-1 text-xs font-medium hover:bg-muted"
  @click="store.retryNode(run.runId, node.nodeId)"
>
  <RotateCw class="h-3.5 w-3.5" /> Retry node
</button>
```

Import `RotateCw` from `lucide-vue-next` and `useRunsStore` if not already imported. Import `RotateCw` by adding it to the existing lucide import line.

- [ ] **Step 4: Add schema diff panel for schema-drift failure state**

At the bottom of `RunDetailView.vue` template (before closing `</div>`), add:

```vue
<!-- Schema drift panel — shown when any node has a schema_drift error in logs -->
<div v-if="run.nodes.some(n => n.logs.some(l => l.message.includes('schema')))"
  class="m-6 rounded-lg border border-amber-200 bg-amber-50 p-4">
  <h3 class="mb-2 text-sm font-semibold text-amber-800">Schema drift detected</h3>
  <p class="mb-3 text-xs text-amber-700">One or more nodes received unexpected fields. Review the diff below.</p>
  <div class="grid grid-cols-2 gap-3">
    <div class="rounded-md border bg-background p-3">
      <p class="mb-1.5 text-xs font-semibold text-muted-foreground">Expected schema</p>
      <pre class="text-xs text-green-700">{ "id": "string", "email": "string", "name": "string" }</pre>
    </div>
    <div class="rounded-md border bg-background p-3">
      <p class="mb-1.5 text-xs font-semibold text-muted-foreground">Actual schema</p>
      <pre class="text-xs text-red-600">{ "id": "string", "email": "string", "full_name": "string" }</pre>
    </div>
  </div>
</div>
```

- [ ] **Step 5: Commit**

```bash
git add src/views/RunDetailView.vue src/stores/runs.ts
git commit -m "feat(wave2): add retry node action and schema diff panel to RunDetailView"
```

---

## Task 8: SettingsView and ProfileView

**Files:**
- Replace: `src/views/SettingsView.vue`
- Replace: `src/views/ProfileView.vue`

Reference wireframes: `UI/mockup/workspace-settings.html`, `UI/mockup/profile.html`

- [ ] **Step 1: Replace SettingsView**

```vue
<!-- src/views/SettingsView.vue -->
<script setup lang="ts">
import { ref } from 'vue'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const activeTab = ref('general')
const tabs = ['general', 'security', 'notifications', 'branding']

const orgName = ref(auth.session?.org.name ?? '')
const workspaceName = ref(auth.session?.workspaceName ?? '')
</script>

<template>
  <div class="flex h-full flex-col overflow-auto">
    <div class="border-b px-6 py-4">
      <h1 class="text-xl font-semibold">Settings</h1>
    </div>

    <div class="flex flex-1 overflow-hidden">
      <!-- Tab nav -->
      <nav class="w-48 shrink-0 border-r p-4">
        <button v-for="tab in tabs" :key="tab"
          class="mb-1 w-full rounded-md px-3 py-2 text-left text-sm font-medium capitalize transition-colors hover:bg-muted"
          :class="activeTab === tab ? 'bg-muted text-foreground' : 'text-muted-foreground'"
          @click="activeTab = tab">
          {{ tab }}
        </button>
      </nav>

      <!-- Tab content -->
      <div class="flex-1 overflow-y-auto p-6">
        <div v-if="activeTab === 'general'" class="max-w-lg space-y-5">
          <div>
            <label class="mb-1.5 block text-sm font-medium">Organization name</label>
            <input v-model="orgName" class="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" />
          </div>
          <div>
            <label class="mb-1.5 block text-sm font-medium">Workspace name</label>
            <input v-model="workspaceName" class="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" />
          </div>
          <button class="rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background hover:bg-foreground/90">
            Save changes
          </button>
        </div>
        <div v-else-if="activeTab === 'security'" class="max-w-lg space-y-5">
          <div class="rounded-lg border p-4">
            <h3 class="font-medium">Two-factor authentication</h3>
            <p class="mt-1 text-sm text-muted-foreground">Add an extra layer of security to your account.</p>
            <button class="mt-3 rounded-md border px-3 py-1.5 text-sm font-medium hover:bg-muted">Enable 2FA</button>
          </div>
          <div class="rounded-lg border p-4">
            <h3 class="font-medium">SSO Configuration</h3>
            <p class="mt-1 text-sm text-muted-foreground">Connect your identity provider.</p>
            <button class="mt-3 rounded-md border px-3 py-1.5 text-sm font-medium hover:bg-muted">Configure SSO</button>
          </div>
        </div>
        <div v-else class="max-w-lg">
          <p class="text-sm text-muted-foreground capitalize">{{ activeTab }} settings coming soon.</p>
        </div>
      </div>
    </div>
  </div>
</template>
```

- [ ] **Step 2: Replace ProfileView**

```vue
<!-- src/views/ProfileView.vue -->
<script setup lang="ts">
import { ref } from 'vue'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const user = auth.session?.user
const displayName = ref(user?.name ?? '')
const email = ref(user?.email ?? '')
</script>

<template>
  <div class="flex h-full flex-col overflow-auto">
    <div class="border-b px-6 py-4">
      <h1 class="text-xl font-semibold">My Profile</h1>
    </div>
    <div class="p-6">
      <div class="flex items-center gap-5 mb-8">
        <div class="flex h-16 w-16 items-center justify-center rounded-full bg-muted text-2xl font-bold">
          {{ user?.avatarInitial ?? '?' }}
        </div>
        <div>
          <p class="text-lg font-semibold">{{ user?.name }}</p>
          <p class="text-sm text-muted-foreground capitalize">{{ user?.role }}</p>
        </div>
      </div>
      <div class="max-w-lg space-y-4">
        <div>
          <label class="mb-1.5 block text-sm font-medium">Display name</label>
          <input v-model="displayName" class="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" />
        </div>
        <div>
          <label class="mb-1.5 block text-sm font-medium">Email</label>
          <input v-model="email" type="email" class="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" />
        </div>
        <button class="rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background hover:bg-foreground/90">
          Save changes
        </button>
      </div>
    </div>
  </div>
</template>
```

- [ ] **Step 3: Commit**

```bash
git add src/views/SettingsView.vue src/views/ProfileView.vue
git commit -m "feat(wave2): implement SettingsView and ProfileView"
```

---

## Task 9: Global overlays — shell store, Notifications, WorkspaceSwitcher, CommandPalette

**Files:**
- Create: `src/stores/shell.ts`
- Create: `src/components/layout/NotificationsPanel.vue`
- Create: `src/components/layout/WorkspaceSwitcher.vue`
- Create: `src/components/layout/CommandPalette.vue`
- Modify: `src/components/layout/AppTopBar.vue`
- Modify: `src/components/layout/AppShell.vue`

- [ ] **Step 1: Create useShellStore**

```typescript
// src/stores/shell.ts
import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useShellStore = defineStore('shell', () => {
  const notificationsOpen = ref(false)
  const workspaceSwitcherOpen = ref(false)
  const commandPaletteOpen = ref(false)

  function toggleNotifications() { notificationsOpen.value = !notificationsOpen.value }
  function toggleWorkspaceSwitcher() { workspaceSwitcherOpen.value = !workspaceSwitcherOpen.value }
  function openCommandPalette() { commandPaletteOpen.value = true }
  function closeCommandPalette() { commandPaletteOpen.value = false }

  return { notificationsOpen, workspaceSwitcherOpen, commandPaletteOpen, toggleNotifications, toggleWorkspaceSwitcher, openCommandPalette, closeCommandPalette }
})
```

- [ ] **Step 2: Create NotificationsPanel**

```vue
<!-- src/components/layout/NotificationsPanel.vue -->
<script setup lang="ts">
import { useShellStore } from '@/stores/shell'
import { X, CheckCircle, AlertTriangle, Info } from 'lucide-vue-next'

const shell = useShellStore()

const notifications = [
  { id: 1, type: 'error', title: 'Stripe Payments Pipeline failed', time: '6 min ago' },
  { id: 2, type: 'warning', title: 'Salesforce OAuth token expiring soon', time: '1 hr ago' },
  { id: 3, type: 'info', title: 'Nightly Archive completed successfully', time: '2 hr ago' },
]

const iconMap = { error: AlertTriangle, warning: AlertTriangle, info: Info, success: CheckCircle }
const colorMap = { error: 'text-red-500', warning: 'text-amber-500', info: 'text-blue-500', success: 'text-green-500' }
</script>

<template>
  <Teleport to="body">
    <div v-if="shell.notificationsOpen" class="fixed inset-0 z-40" @click="shell.toggleNotifications()">
      <div class="absolute right-0 top-0 h-full w-80 border-l bg-background shadow-xl" @click.stop>
        <div class="flex items-center justify-between border-b px-4 py-3">
          <h2 class="text-sm font-semibold">Notifications</h2>
          <button class="rounded-md p-1 hover:bg-muted" @click="shell.toggleNotifications()">
            <X class="h-4 w-4" />
          </button>
        </div>
        <div class="divide-y overflow-y-auto">
          <div v-for="n in notifications" :key="n.id" class="flex gap-3 px-4 py-3 hover:bg-muted/30">
            <component :is="iconMap[n.type as keyof typeof iconMap]" class="mt-0.5 h-4 w-4 shrink-0"
              :class="colorMap[n.type as keyof typeof colorMap]" />
            <div>
              <p class="text-sm font-medium">{{ n.title }}</p>
              <p class="mt-0.5 text-xs text-muted-foreground">{{ n.time }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>
```

- [ ] **Step 3: Create WorkspaceSwitcher**

```vue
<!-- src/components/layout/WorkspaceSwitcher.vue -->
<script setup lang="ts">
import { useShellStore } from '@/stores/shell'
import { useAuthStore } from '@/stores/auth'
import { Check } from 'lucide-vue-next'

const shell = useShellStore()
const auth = useAuthStore()

const workspaces = [
  { id: 'ws_001', name: 'Production', env: 'prod' },
  { id: 'ws_002', name: 'Staging', env: 'staging' },
  { id: 'ws_003', name: 'Development', env: 'dev' },
]
</script>

<template>
  <Teleport to="body">
    <div v-if="shell.workspaceSwitcherOpen" class="fixed inset-0 z-40" @click="shell.toggleWorkspaceSwitcher()">
      <div class="absolute left-64 top-14 w-56 rounded-lg border bg-background shadow-lg" @click.stop>
        <div class="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Workspaces
        </div>
        <div class="divide-y">
          <button v-for="ws in workspaces" :key="ws.id"
            class="flex w-full items-center gap-2 px-3 py-2.5 text-sm hover:bg-muted"
            @click="shell.toggleWorkspaceSwitcher()">
            <Check v-if="ws.id === auth.session?.workspaceId" class="h-3.5 w-3.5 text-foreground" />
            <span v-else class="h-3.5 w-3.5" />
            <span class="font-medium">{{ ws.name }}</span>
            <span class="ml-auto text-xs text-muted-foreground">{{ ws.env }}</span>
          </button>
        </div>
        <div class="border-t px-3 py-2">
          <button class="text-xs text-muted-foreground hover:text-foreground">+ Create workspace</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>
```

- [ ] **Step 4: Create CommandPalette**

```vue
<!-- src/components/layout/CommandPalette.vue -->
<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useShellStore } from '@/stores/shell'
import { useRouter } from 'vue-router'
import { Search } from 'lucide-vue-next'

const shell = useShellStore()
const router = useRouter()
const query = ref('')

const commands = [
  { id: 'dashboard', label: 'Go to Dashboard', path: '/dashboard' },
  { id: 'workflows', label: 'Go to Workflows', path: '/workflows' },
  { id: 'connectors', label: 'Go to Connectors', path: '/connectors' },
  { id: 'runs', label: 'Go to Runs', path: '/runs' },
  { id: 'templates', label: 'Browse Templates', path: '/templates' },
  { id: 'secrets', label: 'Manage Secrets', path: '/secrets' },
  { id: 'monitoring', label: 'Open Monitoring', path: '/monitoring' },
  { id: 'marketplace', label: 'Browse Marketplace', path: '/marketplace' },
  { id: 'members', label: 'Manage Members', path: '/members' },
  { id: 'settings', label: 'Open Settings', path: '/settings' },
]

const filtered = computed(() =>
  query.value.trim()
    ? commands.filter(c => c.label.toLowerCase().includes(query.value.toLowerCase()))
    : commands
)

function select(path: string) {
  router.push(path)
  shell.closeCommandPalette()
  query.value = ''
}

function onKeydown(e: KeyboardEvent) {
  if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
    e.preventDefault()
    shell.openCommandPalette()
  }
  if (e.key === 'Escape') shell.closeCommandPalette()
}

onMounted(() => window.addEventListener('keydown', onKeydown))
onUnmounted(() => window.removeEventListener('keydown', onKeydown))
</script>

<template>
  <Teleport to="body">
    <div v-if="shell.commandPaletteOpen"
      class="fixed inset-0 z-50 flex items-start justify-center bg-black/50 pt-[20vh]"
      @click="shell.closeCommandPalette()">
      <div class="w-full max-w-md overflow-hidden rounded-xl border bg-background shadow-2xl" @click.stop>
        <div class="flex items-center gap-3 border-b px-4 py-3">
          <Search class="h-4 w-4 shrink-0 text-muted-foreground" />
          <input v-model="query" placeholder="Search or type a command…" autofocus
            class="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground" />
          <kbd class="rounded border px-1.5 py-0.5 text-xs text-muted-foreground">ESC</kbd>
        </div>
        <div class="max-h-64 overflow-y-auto py-1">
          <button v-for="cmd in filtered" :key="cmd.id"
            class="flex w-full items-center gap-3 px-4 py-2.5 text-sm hover:bg-muted"
            @click="select(cmd.path)">
            {{ cmd.label }}
          </button>
          <p v-if="filtered.length === 0" class="px-4 py-3 text-sm text-muted-foreground">
            No results for "{{ query }}"
          </p>
        </div>
      </div>
    </div>
  </Teleport>
</template>
```

- [ ] **Step 5: Update AppTopBar to wire notification + workspace switcher buttons**

Read `src/components/layout/AppTopBar.vue` first, then add:

```vue
<!-- src/components/layout/AppTopBar.vue -->
<script setup lang="ts">
import { Bell, ChevronsUpDown } from 'lucide-vue-next'
import { useShellStore } from '@/stores/shell'
import { useAuthStore } from '@/stores/auth'
import { RouterLink } from 'vue-router'

const shell = useShellStore()
const auth = useAuthStore()
</script>

<template>
  <header class="flex h-14 shrink-0 items-center justify-between border-b bg-background px-4">
    <button
      class="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm font-medium hover:bg-muted"
      @click="shell.toggleWorkspaceSwitcher()">
      <span>{{ auth.session?.workspaceName ?? 'Workspace' }}</span>
      <ChevronsUpDown class="h-3.5 w-3.5 text-muted-foreground" />
    </button>

    <div class="flex items-center gap-1">
      <button class="relative rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
        @click="shell.toggleNotifications()">
        <Bell class="h-4 w-4" />
        <span class="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-red-500" />
      </button>
      <RouterLink to="/profile"
        class="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-sm font-semibold hover:ring-2 hover:ring-ring">
        {{ auth.session?.user.avatarInitial ?? '?' }}
      </RouterLink>
    </div>
  </header>
</template>
```

- [ ] **Step 6: Update AppShell to mount global overlays**

Replace `src/components/layout/AppShell.vue`:

```vue
<!-- src/components/layout/AppShell.vue -->
<script setup lang="ts">
import AppSidebar from './AppSidebar.vue'
import AppTopBar from './AppTopBar.vue'
import NotificationsPanel from './NotificationsPanel.vue'
import WorkspaceSwitcher from './WorkspaceSwitcher.vue'
import CommandPalette from './CommandPalette.vue'
</script>

<template>
  <div class="flex h-screen overflow-hidden bg-background text-foreground">
    <AppSidebar />
    <div class="flex flex-1 flex-col overflow-hidden">
      <AppTopBar />
      <main class="flex-1 overflow-hidden">
        <slot />
      </main>
    </div>
    <NotificationsPanel />
    <WorkspaceSwitcher />
    <CommandPalette />
  </div>
</template>
```

- [ ] **Step 7: Commit**

```bash
git add src/stores/shell.ts src/components/layout/NotificationsPanel.vue src/components/layout/WorkspaceSwitcher.vue src/components/layout/CommandPalette.vue src/components/layout/AppTopBar.vue src/components/layout/AppShell.vue
git commit -m "feat(wave2): add NotificationsPanel, WorkspaceSwitcher, CommandPalette global overlays"
```

---

## Task 10: Wave 2 verification

- [ ] **Step 1: Run full test suite**

```bash
cd apps/web && npm test
```
Expected: all tests pass.

- [ ] **Step 2: Start dev server and verify**

```bash
cd apps/web && npm run dev
```

Walk through:
1. Login → onboarding → dashboard (Wave 1 still works)
2. Navigate to Triggers — table shows 3 entries, toggle pauses one
3. Navigate to Secrets — rotation alert banner visible, search filters list
4. Navigate to Members — invite modal opens
5. Navigate to Templates — category pills filter, "Use template" redirects to workflows
6. Navigate to Runs → open a failed run → retry button visible on failed node
7. Navigate to Settings → tabs switch content
8. Navigate to Profile → shows user details from auth store
9. Click bell icon → notifications drawer slides in
10. Click workspace name → workspace switcher opens
11. Press ⌘K → command palette opens, typing filters commands, Enter navigates

- [ ] **Step 3: Final Wave 2 commit**

```bash
git add -A
git commit -m "feat: Wave 2 complete — all existing mockups ported to Vue"
```
