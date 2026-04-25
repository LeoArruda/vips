# vipsOS Phase 1 — Weeks 3–4: Dashboard, Connectors, Run Inspector

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build the remaining three demo screens — Overview Dashboard, Connectors Catalog + Detail, and Run Inspector — plus fix the /runs route. All screens use stub data from existing Pinia stores.

**Architecture:** All new components are presentational (data comes from stores via props or composables). No new stores needed. Add `/runs` list route. RunDetailView reads `RunDetail` from `useRunsStore().getDetail(id)`. ConnectorDetailView reads `ConnectorDetail` from `useConnectorsStore().getDetail(id)`.

**Tech Stack:** Vue 3, TypeScript, Tailwind CSS v4, Lucide Vue Next, existing stores

---

## File Map

```
apps/web/src/
  views/
    DashboardView.vue          # stat tiles + recent runs + failed runs section
    ConnectorsView.vue         # search + category filter + card grid
    ConnectorDetailView.vue    # connector header + actions + auth requirements
    RunsView.vue               # NEW: list of all runs (add /runs route)
    RunDetailView.vue          # execution timeline + per-node log accordion
  components/
    ui/
      StatTile.vue             # reusable stat card (label, value, icon, color)
    connectors/
      ConnectorCard.vue        # connector card: logo, name, category, install CTA
    runs/
      NodeStatusBadge.vue      # colored status pill: pending/running/success/failed
  router/
    index.ts                   # add /runs route
  components/layout/
    AppSidebar.vue             # verify /runs link is wired
```

---

## Task 1: StatTile UI component

**Files:**
- Create: `apps/web/src/components/ui/StatTile.vue`

- [ ] **Step 1: Create StatTile.vue**

`apps/web/src/components/ui/StatTile.vue`:
```vue
<script setup lang="ts">
import type { Component } from 'vue'

defineProps<{
  label: string
  value: string | number
  icon?: Component
  colorClass?: string
  subtext?: string
}>()
</script>

<template>
  <div class="rounded-lg border bg-background p-4">
    <div class="flex items-start justify-between">
      <div>
        <p class="text-sm text-muted-foreground">{{ label }}</p>
        <p class="mt-1 text-2xl font-bold tracking-tight">{{ value }}</p>
        <p v-if="subtext" class="mt-0.5 text-xs text-muted-foreground">{{ subtext }}</p>
      </div>
      <div
        v-if="icon"
        class="flex h-9 w-9 items-center justify-center rounded-md"
        :class="colorClass ?? 'bg-muted text-muted-foreground'"
      >
        <component :is="icon" class="h-4 w-4" />
      </div>
    </div>
  </div>
</template>
```

- [ ] **Step 2: Commit**

```bash
cd /Users/leandroarruda/projects/vipsOS && git add apps/web/src/components/ui/ && git commit -m "feat: add StatTile UI component"
```

---

## Task 2: Build DashboardView

**Files:**
- Modify: `apps/web/src/views/DashboardView.vue`

DashboardView shows 6 stat tiles in a grid, a recent runs table, and a failed runs section.

- [ ] **Step 1: Update DashboardView.vue**

`apps/web/src/views/DashboardView.vue`:
```vue
<script setup lang="ts">
import { useRunsStore } from '@/stores/runs'
import StatTile from '@/components/ui/StatTile.vue'
import {
  GitBranch,
  CheckCircle2,
  XCircle,
  Plug,
  Activity,
  TrendingUp,
} from 'lucide-vue-next'
import { dashboardStats } from '@/data/dashboard'
import { useRouter } from 'vue-router'

const router = useRouter()
const runsStore = useRunsStore()

const statusColors: Record<string, string> = {
  success: 'text-green-600',
  failed: 'text-red-600',
  running: 'text-blue-600',
  pending: 'text-muted-foreground',
  cancelled: 'text-muted-foreground',
}

const statusBg: Record<string, string> = {
  success: 'bg-green-100 text-green-700',
  failed: 'bg-red-100 text-red-700',
  running: 'bg-blue-100 text-blue-700',
  pending: 'bg-muted text-muted-foreground',
  cancelled: 'bg-muted text-muted-foreground',
}

function formatDuration(ms?: number): string {
  if (!ms) return '—'
  if (ms < 1000) return `${ms}ms`
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`
  return `${Math.floor(ms / 60000)}m ${Math.floor((ms % 60000) / 1000)}s`
}
</script>

<template>
  <div>
    <div class="mb-5">
      <h1 class="text-2xl font-semibold tracking-tight">Dashboard</h1>
      <p class="mt-1 text-sm text-muted-foreground">Platform health and activity overview</p>
    </div>

    <!-- Stat tiles -->
    <div class="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-6">
      <StatTile
        label="Total Workflows"
        :value="dashboardStats.totalWorkflows"
        :icon="GitBranch"
        color-class="bg-blue-50 text-blue-600"
      />
      <StatTile
        label="Active"
        :value="dashboardStats.activeWorkflows"
        :icon="Activity"
        color-class="bg-green-50 text-green-600"
      />
      <StatTile
        label="Runs Today"
        :value="dashboardStats.totalRunsToday"
        :icon="TrendingUp"
        color-class="bg-purple-50 text-purple-600"
      />
      <StatTile
        label="Failed Today"
        :value="dashboardStats.failedRunsToday"
        :icon="XCircle"
        color-class="bg-red-50 text-red-600"
      />
      <StatTile
        label="Success Rate"
        :value="`${dashboardStats.successRate}%`"
        :icon="CheckCircle2"
        color-class="bg-emerald-50 text-emerald-600"
      />
      <StatTile
        label="Connectors"
        :value="dashboardStats.connectorCount"
        :icon="Plug"
        color-class="bg-amber-50 text-amber-600"
      />
    </div>

    <!-- Recent runs -->
    <div class="mb-6">
      <h2 class="mb-3 text-sm font-semibold">Recent Runs</h2>
      <div class="divide-y rounded-lg border">
        <div
          v-for="run in runsStore.records"
          :key="run.runId"
          class="flex cursor-pointer items-center gap-4 px-4 py-3 transition-colors hover:bg-muted/50"
          @click="router.push(`/runs/${run.runId}`)"
        >
          <span
            class="rounded-full px-2.5 py-0.5 text-xs font-medium capitalize"
            :class="statusBg[run.status] ?? 'bg-muted text-muted-foreground'"
          >
            {{ run.status }}
          </span>
          <div class="min-w-0 flex-1">
            <p class="truncate text-sm font-medium">{{ run.workflowName }}</p>
            <p class="text-xs text-muted-foreground">{{ run.triggeredBy }} · {{ run.startedAt.replace('T', ' ').slice(0, 16) }}Z</p>
          </div>
          <span class="text-xs tabular-nums text-muted-foreground">
            {{ formatDuration(run.durationMs) }}
          </span>
        </div>
      </div>
    </div>

    <!-- Failed runs -->
    <div v-if="dashboardStats.failedRuns.length > 0">
      <h2 class="mb-3 text-sm font-semibold text-red-600">Failed Runs</h2>
      <div class="divide-y rounded-lg border border-red-200">
        <div
          v-for="run in dashboardStats.failedRuns"
          :key="run.runId"
          class="flex cursor-pointer items-center gap-4 px-4 py-3 transition-colors hover:bg-red-50/50"
          @click="router.push(`/runs/${run.runId}`)"
        >
          <XCircle class="h-4 w-4 flex-shrink-0 text-red-500" />
          <div class="min-w-0 flex-1">
            <p class="truncate text-sm font-medium">{{ run.workflowName }}</p>
            <p class="text-xs text-muted-foreground">
              {{ run.failedNodeCount }} node(s) failed · {{ run.startedAt.replace('T', ' ').slice(0, 16) }}Z
            </p>
          </div>
          <span class="text-xs font-medium text-red-600">View →</span>
        </div>
      </div>
    </div>
  </div>
</template>
```

- [ ] **Step 2: Run build to verify**

```bash
cd /Users/leandroarruda/projects/vipsOS/apps/web && npm run build 2>&1 | tail -5
```

Expected: build succeeds.

- [ ] **Step 3: Commit**

```bash
cd /Users/leandroarruda/projects/vipsOS && git add apps/web/src/views/DashboardView.vue && git commit -m "feat: build DashboardView with stat tiles, recent runs, and failed runs"
```

---

## Task 3: ConnectorCard component + ConnectorsView

**Files:**
- Create: `apps/web/src/components/connectors/ConnectorCard.vue`
- Modify: `apps/web/src/views/ConnectorsView.vue`

- [ ] **Step 1: Create ConnectorCard.vue**

`apps/web/src/components/connectors/ConnectorCard.vue`:
```vue
<script setup lang="ts">
import type { ConnectorCard } from '@/types'

defineProps<{ connector: ConnectorCard }>()

const categoryColors: Record<string, string> = {
  database: 'bg-blue-100 text-blue-700',
  saas: 'bg-purple-100 text-purple-700',
  storage: 'bg-amber-100 text-amber-700',
  messaging: 'bg-green-100 text-green-700',
  analytics: 'bg-rose-100 text-rose-700',
}

const authLabels: Record<string, string> = {
  oauth2: 'OAuth 2.0',
  'api-key': 'API Key',
  basic: 'Basic Auth',
  none: 'No Auth',
}
</script>

<template>
  <div class="flex flex-col rounded-lg border bg-background p-4 transition-shadow hover:shadow-md">
    <!-- Header -->
    <div class="mb-3 flex items-start justify-between">
      <div
        class="flex h-10 w-10 items-center justify-center rounded-md bg-muted text-sm font-bold text-muted-foreground"
      >
        {{ connector.logoInitial }}
      </div>
      <div class="flex items-center gap-1.5">
        <span
          v-if="connector.installed"
          class="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700"
        >
          Installed
        </span>
        <span
          v-if="connector.certified"
          class="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700"
        >
          ✓ Certified
        </span>
      </div>
    </div>

    <!-- Info -->
    <h3 class="text-sm font-semibold">{{ connector.name }}</h3>
    <p class="mt-0.5 text-xs text-muted-foreground">{{ connector.description }}</p>

    <!-- Chips -->
    <div class="mt-3 flex flex-wrap gap-1.5">
      <span
        class="rounded-full px-2 py-0.5 text-xs font-medium capitalize"
        :class="categoryColors[connector.category] ?? 'bg-muted text-muted-foreground'"
      >
        {{ connector.category }}
      </span>
      <span class="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
        {{ authLabels[connector.authMethod] ?? connector.authMethod }}
      </span>
    </div>

    <!-- CTA -->
    <div class="mt-4 flex-1 flex items-end">
      <button
        class="w-full rounded-md border py-1.5 text-xs font-medium transition-colors hover:bg-muted"
      >
        {{ connector.installed ? 'Configure' : 'Install' }}
      </button>
    </div>
  </div>
</template>
```

- [ ] **Step 2: Update ConnectorsView.vue**

`apps/web/src/views/ConnectorsView.vue`:
```vue
<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useConnectorsStore } from '@/stores/connectors'
import ConnectorCard from '@/components/connectors/ConnectorCard.vue'
import { Search } from 'lucide-vue-next'

const router = useRouter()
const store = useConnectorsStore()

const searchQuery = ref('')
const selectedCategory = ref('')

const categories = ['', 'database', 'saas', 'storage', 'messaging', 'analytics']
const categoryLabels: Record<string, string> = {
  '': 'All',
  database: 'Database',
  saas: 'SaaS',
  storage: 'Storage',
  messaging: 'Messaging',
  analytics: 'Analytics',
}

const filteredConnectors = computed(() => {
  let result = store.filterByCategory(selectedCategory.value)
  if (searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase()
    result = result.filter(
      (c) => c.name.toLowerCase().includes(q) || c.description.toLowerCase().includes(q),
    )
  }
  return result
})

function openDetail(connectorId: string) {
  router.push(`/connectors/${connectorId}`)
}
</script>

<template>
  <div>
    <div class="mb-5">
      <h1 class="text-2xl font-semibold tracking-tight">Connectors</h1>
      <p class="mt-1 text-sm text-muted-foreground">
        {{ store.cards.length }} connectors · {{ store.installedCount }} installed
      </p>
    </div>

    <!-- Search + filter -->
    <div class="mb-4 flex flex-wrap items-center gap-3">
      <div class="relative flex-1 min-w-48">
        <Search class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search connectors…"
          class="w-full rounded-md border bg-background py-2 pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-primary/20"
        />
      </div>
      <div class="flex gap-1.5 flex-wrap">
        <button
          v-for="cat in categories"
          :key="cat"
          class="rounded-full px-3 py-1 text-xs font-medium transition-colors"
          :class="
            selectedCategory === cat
              ? 'bg-primary text-primary-foreground'
              : 'border hover:bg-muted'
          "
          @click="selectedCategory = cat"
        >
          {{ categoryLabels[cat] }}
        </button>
      </div>
    </div>

    <!-- Empty state -->
    <div v-if="filteredConnectors.length === 0" class="py-12 text-center text-muted-foreground">
      <p class="text-sm">No connectors match your search.</p>
    </div>

    <!-- Card grid -->
    <div
      v-else
      class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
    >
      <div
        v-for="connector in filteredConnectors"
        :key="connector.connectorId"
        class="cursor-pointer"
        @click="openDetail(connector.connectorId)"
      >
        <ConnectorCard :connector="connector" />
      </div>
    </div>
  </div>
</template>
```

- [ ] **Step 3: Run build to verify**

```bash
cd /Users/leandroarruda/projects/vipsOS/apps/web && npm run build 2>&1 | tail -5
```

Expected: build succeeds.

- [ ] **Step 4: Commit**

```bash
cd /Users/leandroarruda/projects/vipsOS && git add apps/web/src/components/connectors/ apps/web/src/views/ConnectorsView.vue && git commit -m "feat: build Connectors catalog with search, category filter, and card grid"
```

---

## Task 4: ConnectorDetailView

**Files:**
- Modify: `apps/web/src/views/ConnectorDetailView.vue`

- [ ] **Step 1: Update ConnectorDetailView.vue**

`apps/web/src/views/ConnectorDetailView.vue`:
```vue
<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useConnectorsStore } from '@/stores/connectors'
import { ArrowLeft, ExternalLink, CheckCircle2 } from 'lucide-vue-next'

const route = useRoute()
const router = useRouter()
const store = useConnectorsStore()

const detail = computed(() => store.getDetail(route.params.id as string))

const authLabels: Record<string, string> = {
  oauth2: 'OAuth 2.0',
  'api-key': 'API Key',
  basic: 'Basic Auth',
  none: 'No Auth',
}

const categoryColors: Record<string, string> = {
  database: 'bg-blue-100 text-blue-700',
  saas: 'bg-purple-100 text-purple-700',
  storage: 'bg-amber-100 text-amber-700',
  messaging: 'bg-green-100 text-green-700',
  analytics: 'bg-rose-100 text-rose-700',
}
</script>

<template>
  <!-- Not found -->
  <div v-if="!detail" class="py-12 text-center text-muted-foreground">
    <p class="text-sm">Connector not found.</p>
    <button class="mt-3 text-sm text-primary underline" @click="router.back()">Go back</button>
  </div>

  <!-- Detail -->
  <div v-else>
    <!-- Back + header -->
    <button
      class="mb-4 flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      @click="router.push('/connectors')"
    >
      <ArrowLeft class="h-4 w-4" />
      Connectors
    </button>

    <div class="mb-6 flex items-start gap-4">
      <div
        class="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-xl bg-muted text-lg font-bold text-muted-foreground"
      >
        {{ detail.logoInitial }}
      </div>
      <div>
        <div class="flex items-center gap-2">
          <h1 class="text-2xl font-semibold tracking-tight">{{ detail.name }}</h1>
          <span
            v-if="detail.installed"
            class="rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700"
          >
            Installed
          </span>
        </div>
        <div class="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
          <span>v{{ detail.version }}</span>
          <span>·</span>
          <span
            class="rounded-full px-2 py-0.5 text-xs font-medium capitalize"
            :class="categoryColors[detail.category] ?? 'bg-muted text-muted-foreground'"
          >
            {{ detail.category }}
          </span>
          <span>·</span>
          <span>{{ authLabels[detail.authMethod] ?? detail.authMethod }}</span>
        </div>
        <p class="mt-2 text-sm text-muted-foreground">{{ detail.description }}</p>
      </div>
    </div>

    <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <!-- Supported actions -->
      <div>
        <h2 class="mb-3 text-sm font-semibold">Supported Actions</h2>
        <div class="divide-y rounded-lg border">
          <div
            v-for="action in detail.actions"
            :key="action.actionId"
            class="flex items-start gap-3 px-4 py-3"
          >
            <CheckCircle2 class="mt-0.5 h-4 w-4 flex-shrink-0 text-green-500" />
            <div>
              <p class="text-sm font-medium">{{ action.name }}</p>
              <p class="text-xs text-muted-foreground">{{ action.description }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Auth requirements -->
      <div>
        <h2 class="mb-3 text-sm font-semibold">Auth Requirements</h2>
        <div class="divide-y rounded-lg border">
          <div
            v-for="(req, i) in detail.authRequirements"
            :key="i"
            class="flex items-center gap-3 px-4 py-2.5"
          >
            <div class="h-1.5 w-1.5 rounded-full bg-muted-foreground/50" />
            <span class="text-sm">{{ req }}</span>
          </div>
        </div>

        <div v-if="detail.docsUrl" class="mt-4">
          <a
            :href="detail.docsUrl"
            target="_blank"
            rel="noopener noreferrer"
            class="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
          >
            <ExternalLink class="h-3.5 w-3.5" />
            View Documentation
          </a>
        </div>
      </div>
    </div>

    <!-- Install CTA -->
    <div class="mt-6 border-t pt-6">
      <button
        class="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
      >
        {{ detail.installed ? 'Configure Connector' : 'Install Connector' }}
      </button>
    </div>
  </div>
</template>
```

- [ ] **Step 2: Run build**

```bash
npm run build 2>&1 | tail -5
```

- [ ] **Step 3: Commit**

```bash
cd /Users/leandroarruda/projects/vipsOS && git add apps/web/src/views/ConnectorDetailView.vue && git commit -m "feat: build ConnectorDetailView with actions, auth requirements, and install CTA"
```

---

## Task 5: RunsView + /runs route

**Files:**
- Create: `apps/web/src/views/RunsView.vue`
- Modify: `apps/web/src/router/index.ts`

- [ ] **Step 1: Create RunsView.vue**

`apps/web/src/views/RunsView.vue`:
```vue
<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useRunsStore } from '@/stores/runs'
import { CheckCircle2, XCircle, Clock } from 'lucide-vue-next'

const router = useRouter()
const store = useRunsStore()

const statusIcons: Record<string, unknown> = {
  success: CheckCircle2,
  failed: XCircle,
  running: Clock,
  pending: Clock,
}

const statusColors: Record<string, string> = {
  success: 'text-green-600',
  failed: 'text-red-600',
  running: 'text-blue-600',
  pending: 'text-muted-foreground',
}

const statusBg: Record<string, string> = {
  success: 'bg-green-100 text-green-700',
  failed: 'bg-red-100 text-red-700',
  running: 'bg-blue-100 text-blue-700',
  pending: 'bg-muted text-muted-foreground',
}

function formatDuration(ms?: number): string {
  if (!ms) return '—'
  if (ms < 1000) return `${ms}ms`
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`
  return `${Math.floor(ms / 60000)}m ${Math.floor((ms % 60000) / 1000)}s`
}
</script>

<template>
  <div>
    <div class="mb-5">
      <h1 class="text-2xl font-semibold tracking-tight">Runs</h1>
      <p class="mt-1 text-sm text-muted-foreground">{{ store.records.length }} recent runs</p>
    </div>

    <div class="divide-y rounded-lg border">
      <div
        v-for="run in store.records"
        :key="run.runId"
        class="flex cursor-pointer items-center gap-4 px-4 py-3 transition-colors hover:bg-muted/50"
        @click="router.push(`/runs/${run.runId}`)"
      >
        <component
          :is="statusIcons[run.status] ?? Clock"
          class="h-4 w-4 flex-shrink-0"
          :class="statusColors[run.status] ?? 'text-muted-foreground'"
        />
        <div class="min-w-0 flex-1">
          <p class="truncate text-sm font-medium">{{ run.workflowName }}</p>
          <p class="text-xs text-muted-foreground">
            {{ run.triggeredBy }} · {{ run.startedAt.replace('T', ' ').slice(0, 16) }}Z
          </p>
        </div>
        <span
          class="rounded-full px-2.5 py-0.5 text-xs font-medium capitalize"
          :class="statusBg[run.status] ?? 'bg-muted text-muted-foreground'"
        >
          {{ run.status }}
        </span>
        <span class="w-12 text-right text-xs tabular-nums text-muted-foreground">
          {{ formatDuration(run.durationMs) }}
        </span>
      </div>
    </div>
  </div>
</template>
```

- [ ] **Step 2: Add /runs route to router/index.ts**

Open `apps/web/src/router/index.ts` and add before the `/runs/:id` route:

```typescript
    {
      path: '/runs',
      name: 'runs',
      component: () => import('@/views/RunsView.vue'),
    },
```

The routes array should look like:
```typescript
routes: [
  { path: '/', redirect: '/dashboard' },
  { path: '/dashboard', name: 'dashboard', component: () => import('@/views/DashboardView.vue') },
  { path: '/workflows', name: 'workflows', component: () => import('@/views/WorkflowsView.vue') },
  { path: '/workflows/:id/builder', name: 'workflow-builder', component: () => import('@/views/WorkflowBuilderView.vue') },
  { path: '/connectors', name: 'connectors', component: () => import('@/views/ConnectorsView.vue') },
  { path: '/connectors/:id', name: 'connector-detail', component: () => import('@/views/ConnectorDetailView.vue') },
  { path: '/runs', name: 'runs', component: () => import('@/views/RunsView.vue') },
  { path: '/runs/:id', name: 'run-detail', component: () => import('@/views/RunDetailView.vue') },
],
```

- [ ] **Step 3: Run build**

```bash
npm run build 2>&1 | tail -5
```

- [ ] **Step 4: Commit**

```bash
cd /Users/leandroarruda/projects/vipsOS && git add apps/web/src/views/RunsView.vue apps/web/src/router/ && git commit -m "feat: add RunsView list and /runs route"
```

---

## Task 6: NodeStatusBadge component + RunDetailView

**Files:**
- Create: `apps/web/src/components/runs/NodeStatusBadge.vue`
- Modify: `apps/web/src/views/RunDetailView.vue`

RunDetailView shows run header, an ordered list of nodes with status badges, and an expandable log accordion per node.

- [ ] **Step 1: Create NodeStatusBadge.vue**

`apps/web/src/components/runs/NodeStatusBadge.vue`:
```vue
<script setup lang="ts">
import { CheckCircle2, XCircle, Clock, Play, MinusCircle } from 'lucide-vue-next'
import type { NodeStatus } from '@/types'

const props = defineProps<{ status: NodeStatus }>()

const config: Record<NodeStatus, { icon: unknown; colorClass: string; label: string }> = {
  pending: { icon: Clock, colorClass: 'text-muted-foreground', label: 'Pending' },
  running: { icon: Play, colorClass: 'text-blue-600', label: 'Running' },
  success: { icon: CheckCircle2, colorClass: 'text-green-600', label: 'Success' },
  failed: { icon: XCircle, colorClass: 'text-red-600', label: 'Failed' },
  skipped: { icon: MinusCircle, colorClass: 'text-muted-foreground', label: 'Skipped' },
}
</script>

<template>
  <span class="flex items-center gap-1" :class="config[props.status]?.colorClass">
    <component :is="config[props.status]?.icon" class="h-3.5 w-3.5" />
    <span class="text-xs font-medium">{{ config[props.status]?.label }}</span>
  </span>
</template>
```

- [ ] **Step 2: Update RunDetailView.vue**

`apps/web/src/views/RunDetailView.vue`:
```vue
<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useRunsStore } from '@/stores/runs'
import NodeStatusBadge from '@/components/runs/NodeStatusBadge.vue'
import { ArrowLeft, ChevronDown, ChevronRight } from 'lucide-vue-next'

const route = useRoute()
const router = useRouter()
const store = useRunsStore()

const detail = computed(() => store.getDetail(route.params.id as string))

const expandedNodes = ref<Set<string>>(new Set())

function toggleNode(nodeId: string) {
  if (expandedNodes.value.has(nodeId)) {
    expandedNodes.value.delete(nodeId)
  } else {
    expandedNodes.value.add(nodeId)
  }
}

const statusBg: Record<string, string> = {
  success: 'bg-green-100 text-green-700',
  failed: 'bg-red-100 text-red-700',
  running: 'bg-blue-100 text-blue-700',
  pending: 'bg-muted text-muted-foreground',
  cancelled: 'bg-muted text-muted-foreground',
}

const logLevelColors: Record<string, string> = {
  info: 'text-blue-600',
  warn: 'text-amber-600',
  error: 'text-red-600',
}

function formatDuration(ms?: number): string {
  if (!ms) return '—'
  if (ms < 1000) return `${ms}ms`
  return `${(ms / 1000).toFixed(2)}s`
}
</script>

<template>
  <!-- Not found -->
  <div v-if="!detail" class="py-12 text-center text-muted-foreground">
    <p class="text-sm">Run not found.</p>
    <button class="mt-3 text-sm text-primary underline" @click="router.push('/runs')">
      View all runs
    </button>
  </div>

  <div v-else>
    <!-- Back -->
    <button
      class="mb-4 flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      @click="router.push('/runs')"
    >
      <ArrowLeft class="h-4 w-4" />
      Runs
    </button>

    <!-- Run header -->
    <div class="mb-6 rounded-lg border bg-background p-4">
      <div class="flex items-start justify-between">
        <div>
          <h1 class="text-xl font-semibold">{{ detail.workflowName }}</h1>
          <p class="mt-0.5 text-sm text-muted-foreground">
            Run ID: {{ detail.runId }} · Triggered by {{ detail.triggeredBy }}
          </p>
        </div>
        <span
          class="rounded-full px-3 py-1 text-sm font-medium capitalize"
          :class="statusBg[detail.status] ?? 'bg-muted text-muted-foreground'"
        >
          {{ detail.status }}
        </span>
      </div>
      <div class="mt-3 flex gap-6 text-sm text-muted-foreground">
        <span>Started: {{ detail.startedAt.replace('T', ' ').slice(0, 19) }}Z</span>
        <span v-if="detail.durationMs">
          Duration:
          {{ formatDuration(detail.durationMs) }}
        </span>
        <span>Nodes: {{ detail.nodeCount }} ({{ detail.failedNodeCount }} failed)</span>
      </div>
    </div>

    <!-- Node timeline -->
    <h2 class="mb-3 text-sm font-semibold">Execution Timeline</h2>
    <div class="space-y-2">
      <div
        v-for="node in detail.nodes"
        :key="node.nodeId"
        class="rounded-lg border bg-background"
      >
        <!-- Node header -->
        <button
          class="flex w-full items-center gap-3 px-4 py-3 text-left"
          @click="toggleNode(node.nodeId)"
        >
          <component
            :is="expandedNodes.has(node.nodeId) ? ChevronDown : ChevronRight"
            class="h-4 w-4 flex-shrink-0 text-muted-foreground"
          />
          <span class="flex-1 text-sm font-medium">{{ node.nodeLabel }}</span>
          <NodeStatusBadge :status="node.status" />
          <span class="ml-2 text-xs tabular-nums text-muted-foreground">
            {{ formatDuration(node.durationMs) }}
          </span>
        </button>

        <!-- Log entries -->
        <div v-if="expandedNodes.has(node.nodeId)" class="border-t bg-muted/30 px-4 py-3">
          <div v-if="node.logs.length === 0" class="text-xs text-muted-foreground">
            No logs.
          </div>
          <div v-else class="space-y-1.5 font-mono text-xs">
            <div v-for="(log, i) in node.logs" :key="i" class="flex gap-3">
              <span class="shrink-0 text-muted-foreground">
                {{ log.timestamp.slice(11, 23) }}
              </span>
              <span
                class="w-10 shrink-0 font-semibold uppercase"
                :class="logLevelColors[log.level] ?? 'text-muted-foreground'"
              >
                {{ log.level }}
              </span>
              <span class="text-foreground">{{ log.message }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
```

- [ ] **Step 3: Run build**

```bash
cd /Users/leandroarruda/projects/vipsOS/apps/web && npm run build 2>&1 | tail -5
```

Expected: build succeeds.

- [ ] **Step 4: Run all tests**

```bash
npm test 2>&1 | tail -8
```

Expected: 33 tests passing.

- [ ] **Step 5: Commit**

```bash
cd /Users/leandroarruda/projects/vipsOS && git add apps/web/src/components/runs/ apps/web/src/views/RunDetailView.vue && git commit -m "feat: build RunDetailView with execution timeline and log accordion"
```

---

## Task 7: Update AppShell — remove duplicate padding + fix builder height

The WorkflowBuilderView needs `h-full` to fill the main area. Currently the view sets its own height but the `<main>` element in AppShell doesn't have a `h-full` constraint. Fix by ensuring the main area passes full height to the view.

**Files:**
- Modify: `apps/web/src/components/layout/AppShell.vue`

- [ ] **Step 1: Update AppShell.vue main element**

The current AppShell main:
```html
<main class="flex-1 overflow-auto">
  <slot />
</main>
```

Update to pass height to slot content:
```html
<main class="flex-1 overflow-hidden">
  <div class="h-full overflow-auto">
    <slot />
  </div>
</main>
```

Wait — WorkflowBuilderView sets `overflow-hidden` on its own root and uses the full height. If main wraps in `overflow-auto`, the builder can't fill the space correctly.

Better approach: pass the `overflow-auto` inside the builder vs. outside it.

The simplest fix is to make main `overflow-hidden` and let each view handle its own scroll:

Open `apps/web/src/components/layout/AppShell.vue` and change the main element:
```html
<main class="flex-1 overflow-hidden">
  <slot />
</main>
```

Then for non-builder views, add `overflow-y-auto h-full` to their root divs and `p-6` stays.

Actually the current non-builder views all have `<div class="p-6">` at their root which doesn't have `h-full` or scroll. The parent `overflow-auto` was handling scroll.

The cleanest approach: keep `main` as `overflow-auto`, wrap the slot content in a div for non-builder routes, and let WorkflowBuilderView override with its own `h-full overflow-hidden`.

Actually the current state works: WorkflowBuilderView's root `flex flex-col overflow-hidden` combined with the AppShell's `main flex-1 overflow-auto` is slightly wrong because `h-full` in the builder view only gets the height if the parent has a defined height.

Let me fix AppShell to give `main` a `h-full` constraint with overflow hidden, and the content inside controls its own scrolling:

`apps/web/src/components/layout/AppShell.vue`:
```vue
<script setup lang="ts">
import AppSidebar from './AppSidebar.vue'
import AppTopBar from './AppTopBar.vue'
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
  </div>
</template>
```

Then non-builder views need to scroll themselves. Wrap their content in `overflow-y-auto h-full p-6`:

For DashboardView, ConnectorsView, ConnectorDetailView, RunsView, RunDetailView, WorkflowsView — update their root div to include `h-full overflow-y-auto p-6`.

- [ ] **Step 1: Update AppShell.vue**

`apps/web/src/components/layout/AppShell.vue`:
```vue
<script setup lang="ts">
import AppSidebar from './AppSidebar.vue'
import AppTopBar from './AppTopBar.vue'
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
  </div>
</template>
```

- [ ] **Step 2: Update all content views to scroll themselves**

For each of these files, change the root `<div class="p-6">` to `<div class="h-full overflow-y-auto p-6">`:

- `src/views/DashboardView.vue` — root div
- `src/views/WorkflowsView.vue` — root div
- `src/views/ConnectorsView.vue` — root div
- `src/views/ConnectorDetailView.vue` — both root divs (not found + detail)
- `src/views/RunsView.vue` — root div
- `src/views/RunDetailView.vue` — both root divs

For views with v-if/v-else at root, wrap in a single `<div class="h-full overflow-y-auto p-6">`.

- [ ] **Step 3: Run build**

```bash
npm run build 2>&1 | tail -5
```

- [ ] **Step 4: Run tests**

```bash
npm test 2>&1 | tail -8
```

- [ ] **Step 5: Commit**

```bash
cd /Users/leandroarruda/projects/vipsOS && git add apps/web/src/ && git commit -m "fix: AppShell overflow — views scroll themselves, builder fills viewport"
```

---

## Task 8: Final verification

- [ ] **Step 1: Start dev server**

```bash
cd /Users/leandroarruda/projects/vipsOS/apps/web && npm run dev
```

- [ ] **Step 2: Verify all screens in the browser**

Checklist:
1. `/dashboard` — 6 stat tiles render, recent runs list is clickable, failed runs section shows
2. `/workflows` — list of 4 workflows with status badges
3. `/workflows/wf_001/builder` — canvas loads with 3 connected nodes
4. `/connectors` — 8 connector cards in a grid, search works, category filter works
5. `/connectors/conn_salesforce` — detail page with actions and auth requirements
6. `/runs` — list of 3 runs
7. `/runs/run_002` — timeline with 3 nodes, click to expand shows logs
8. No console errors throughout

- [ ] **Step 3: Stop server**

- [ ] **Step 4: Final test run**

```bash
npm test 2>&1 | tail -8
```

Expected: all tests pass.
