# UX Refinement Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Apply the approved UX refinement spec — compact layout density, slate+indigo color system, collapsible sidebar with smooth animation, and Apple SF Pro typography — across the entire vipsOS frontend without touching any store logic, routes, or test files.

**Architecture:** CSS-first approach using Tailwind v4's native CSS variable system in `style.css`. Sidebar collapse state lives in a new `useShellStore` field (already exists) with localStorage persistence. All view changes are Tailwind class substitutions — no structural Vue changes.

**Tech Stack:** Vue 3 `<script setup lang="ts">`, Tailwind CSS v4, Pinia. All commands run from `apps/web/`. The existing test suite (`npm test`) must pass after every task.

---

## File Map

| Action | Path | Responsibility |
|--------|------|----------------|
| Modify | `src/style.css` | Font stack, CSS tokens (sidebar colors, indigo accent, slate-50 bg) |
| Modify | `src/stores/shell.ts` | Add `sidebarCollapsed` ref + localStorage persistence |
| Replace | `src/components/layout/AppSidebar.vue` | Dark sidebar, collapse/expand, tooltips, chevron, keyboard shortcut |
| Modify | `src/components/layout/AppShell.vue` | Wire collapsed state to main area width transition |
| Modify | `src/components/layout/AppTopBar.vue` | Height `h-10`, border color |
| Modify | `src/views/MonitoringView.vue` | Compact density (reference view) |
| Modify | `src/views/DashboardView.vue` | Compact density |
| Modify | `src/views/WorkflowsView.vue` | Compact density |
| Modify | `src/views/RunsView.vue` | Compact density |
| Modify | `src/views/RunDetailView.vue` | Compact density |
| Modify | `src/views/AlertsView.vue` | Compact density |
| Modify | `src/views/EnvironmentsView.vue` | Compact density |
| Modify | `src/views/AuditView.vue` | Compact density |
| Modify | `src/views/BillingView.vue` | Compact density |
| Modify | `src/views/MarketplaceView.vue` | Compact density |
| Modify | `src/views/MarketplaceListingView.vue` | Compact density |
| Modify | `src/views/ConnectorBuilderView.vue` | Compact density |
| Modify | `src/views/ConnectorsView.vue` | Compact density |
| Modify | `src/views/ConnectorDetailView.vue` | Compact density |
| Modify | `src/views/TemplatesView.vue` | Compact density |
| Modify | `src/views/SecretsView.vue` | Compact density |
| Modify | `src/views/TriggersView.vue` | Compact density |
| Modify | `src/views/MembersView.vue` | Compact density |
| Modify | `src/views/SettingsView.vue` | Compact density |
| Modify | `src/views/ProfileView.vue` | Compact density |
| Modify | `src/views/auth/LoginView.vue` | Compact density |
| Modify | `src/views/auth/SignUpView.vue` | Compact density |
| Modify | `src/views/OnboardingView.vue` | Compact density |

---

## Density Class Substitution Reference

Every view follows these exact Tailwind class replacements. Memorise this table — it is the rule for all Task 4 steps.

| Location | Old class(es) | New class(es) |
|---|---|---|
| Page header outer div | `px-6 py-4` | `px-[18px] py-[11px]` |
| Page `<h1>` title | `text-xl font-semibold` | `text-[15px] font-semibold tracking-tight` |
| Page subtitle `<p>` | `text-sm text-muted-foreground` | `text-[11.5px] text-muted-foreground` |
| Content scroll wrapper | `p-6 space-y-6` | `p-[18px] space-y-3` |
| Content scroll wrapper | `p-6` (no space-y) | `p-[18px]` |
| KPI card grid | `gap-4` | `gap-2` |
| KPI card outer div | `p-4` | `p-[11px]` |
| KPI value | `text-3xl font-bold` | `text-[22px] font-bold tracking-tight` |
| KPI label | `text-sm font-medium` | `text-[10.5px] font-medium` |
| Panel/card border div | `p-4` | `p-[11px]` |
| Panel header | `px-4 py-3` or `px-4 py-2` | `px-3 py-[7px]` |
| Panel header text | `text-sm font-semibold` | `text-[11.5px] font-semibold` |
| Table `<th>` | `px-4 py-3` | `px-3 py-2` |
| Table `<th>` text | `text-sm font-medium` | `text-[10.5px] font-medium` |
| Table `<td>` | `px-4 py-2.5` or `px-4 py-3` | `px-3 py-[7px]` |
| Table `<td>` text | `text-sm` | `text-[11.5px]` |
| Primary button | `bg-foreground text-background` | `bg-indigo-500 text-white hover:bg-indigo-600` |
| Rounded corners (cards) | `rounded-lg` | `rounded-[7px]` |
| Rounded corners (btns) | `rounded-md` | `rounded-[5px]` |
| Badge (active/selected) | `bg-muted text-foreground` or `bg-foreground text-background` | `bg-indigo-500 text-white` |
| Topbar height | `h-14` | `h-10` |

---

## Task 1: CSS Foundation — Font Stack, Tokens, Indigo Accent

**Files:**
- Modify: `src/style.css`

- [ ] **Step 1: Update `:root` design tokens and font stack in `style.css`**

Replace the entire `:root` block and add font variables. The key changes: add sidebar tokens, swap `--background` to slate-50, wire indigo as primary, reduce `--radius`.

```css
/* src/style.css — full file replacement */
@import "tailwindcss";
@import "tw-animate-css";

@custom-variant dark (&:is(.dark *));

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-card: var(--card);
  --color-card-foreground: var(--card-foreground);
  --color-popover: var(--popover);
  --color-popover-foreground: var(--popover-foreground);
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  --color-secondary: var(--secondary);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-muted: var(--muted);
  --color-muted-foreground: var(--muted-foreground);
  --color-accent: var(--accent);
  --color-accent-foreground: var(--accent-foreground);
  --color-destructive: var(--destructive);
  --color-border: var(--border);
  --color-input: var(--input);
  --color-ring: var(--ring);
  --color-success: var(--success);
  --color-warning: var(--warning);
  --color-danger: var(--danger);
  --color-info: var(--info);
  --radius-sm: calc(var(--radius) - 4px);
  --radius-md: calc(var(--radius) - 2px);
  --radius-lg: var(--radius);
  --radius-xl: calc(var(--radius) + 4px);
}

@layer base {
  :root {
    /* Surfaces */
    --background: oklch(0.984 0.002 247.839);   /* slate-50  #f8fafc */
    --foreground: oklch(0.129 0.042 264.695);   /* slate-900 #0f172a */
    --card: oklch(1 0 0);                        /* white */
    --card-foreground: oklch(0.129 0.042 264.695);
    --popover: oklch(1 0 0);
    --popover-foreground: oklch(0.129 0.042 264.695);

    /* Primary = indigo-500 */
    --primary: oklch(0.585 0.233 277.117);       /* #6366f1 */
    --primary-foreground: oklch(1 0 0);          /* white */

    --secondary: oklch(0.968 0.007 247.896);     /* slate-100 */
    --secondary-foreground: oklch(0.129 0.042 264.695);
    --muted: oklch(0.968 0.007 247.896);         /* slate-100 */
    --muted-foreground: oklch(0.554 0.024 264.364); /* slate-500 */

    /* Accent = indigo-50 tint (hover backgrounds) */
    --accent: oklch(0.962 0.018 272.314);        /* indigo-50 */
    --accent-foreground: oklch(0.585 0.233 277.117);

    --destructive: oklch(0.577 0.245 27.325);
    --border: oklch(0.929 0.013 255.508);        /* slate-200 #e2e8f0 */
    --input: oklch(0.929 0.013 255.508);
    --ring: oklch(0.585 0.233 277.117);          /* indigo-500 */
    --radius: 0.4375rem;                         /* 7px */

    /* Status */
    --success: oklch(0.527 0.154 150.069);
    --warning: oklch(0.769 0.188 70.08);
    --danger: oklch(0.577 0.245 27.325);
    --info: oklch(0.623 0.214 259.815);

    /* Sidebar (raw hex — not Tailwind utilities, used in AppSidebar scoped styles) */
    --sidebar-bg: #0f172a;
    --sidebar-border: #1e293b;
    --sidebar-hover: #1e293b;
    --sidebar-active: #6366f1;
    --sidebar-text: #94a3b8;
    --sidebar-section: #475569;

    /* Font stacks */
    --font-sans: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text',
                 system-ui, 'Segoe UI', sans-serif;
    --font-mono: ui-monospace, 'SF Mono', Menlo, 'Cascadia Code', monospace;
  }
}

@layer base {
  * {
    @apply border-border outline-ring/50;
  }
  body {
    @apply bg-background text-foreground;
    font-family: var(--font-sans);
    font-size: 13px;
    line-height: 1.5;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }
  code, pre, kbd, samp {
    font-family: var(--font-mono);
  }
}

/* ─── Vue Flow — n8n-style handle circles ─────────────────────────────────── */
.vue-flow__handle {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  border: 2px solid #9ca3af;
  background-color: white;
  transition: border-color 0.15s, background-color 0.15s;
}
.vue-flow__handle:hover {
  border-color: #4b5563;
  background-color: #f3f4f6;
}
.vue-flow__handle.connectable:hover {
  border-color: #3b82f6;
  background-color: #eff6ff;
}

/* ─── Vue Flow — edge arrows ──────────────────────────────────────────────── */
.vue-flow__edge-path {
  stroke: #6b7280;
  stroke-width: 2;
}
.vue-flow__edge.selected .vue-flow__edge-path,
.vue-flow__edge:hover .vue-flow__edge-path {
  stroke: #374151;
  stroke-width: 2.5;
}
```

- [ ] **Step 2: Verify tests still pass**

```bash
cd apps/web && npm test -- --run
```
Expected: 57 tests pass.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/style.css
git commit -m "style: apply SF Pro font stack, slate-50 bg, indigo primary, 7px radius"
```

---

## Task 2: Collapsible Sidebar

**Files:**
- Modify: `src/stores/shell.ts`
- Replace: `src/components/layout/AppSidebar.vue`

- [ ] **Step 1: Replace `src/stores/shell.ts` with the expanded version**

```typescript
// src/stores/shell.ts
import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

const SIDEBAR_KEY = 'vipsos:sidebar-collapsed'

export const useShellStore = defineStore('shell', () => {
  const notificationsOpen = ref(false)
  const workspaceSwitcherOpen = ref(false)
  const commandPaletteOpen = ref(false)
  const sidebarCollapsed = ref(localStorage.getItem(SIDEBAR_KEY) === 'true')

  watch(sidebarCollapsed, (val) => {
    localStorage.setItem(SIDEBAR_KEY, String(val))
  })

  function toggleNotifications() { notificationsOpen.value = !notificationsOpen.value }
  function toggleWorkspaceSwitcher() { workspaceSwitcherOpen.value = !workspaceSwitcherOpen.value }
  function openCommandPalette() { commandPaletteOpen.value = true }
  function closeCommandPalette() { commandPaletteOpen.value = false }
  function toggleSidebar() { sidebarCollapsed.value = !sidebarCollapsed.value }

  return {
    notificationsOpen, workspaceSwitcherOpen, commandPaletteOpen, sidebarCollapsed,
    toggleNotifications, toggleWorkspaceSwitcher, openCommandPalette, closeCommandPalette, toggleSidebar,
  }
})
```

- [ ] **Step 2: Replace `AppSidebar.vue` with the collapsible version**

```vue
<!-- src/components/layout/AppSidebar.vue -->
<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import {
  LayoutDashboard, GitBranch, Plug, PlayCircle, FileText, KeyRound,
  Activity, Bell, Globe, Server, ClipboardList, ShoppingBag, ChevronLeft,
} from 'lucide-vue-next'
import { useShellStore } from '@/stores/shell'

const route = useRoute()
const shell = useShellStore()

const navGroups = [
  {
    label: null,
    items: [{ label: 'Dashboard', to: '/dashboard', icon: LayoutDashboard }],
  },
  {
    label: 'BUILD',
    items: [
      { label: 'Workflows', to: '/workflows', icon: GitBranch },
      { label: 'Connectors', to: '/connectors', icon: Plug },
      { label: 'Templates', to: '/templates', icon: FileText },
      { label: 'Secrets', to: '/secrets', icon: KeyRound },
    ],
  },
  {
    label: 'OPERATE',
    items: [
      { label: 'Runs', to: '/runs', icon: PlayCircle },
      { label: 'Monitoring', to: '/monitoring', icon: Activity },
      { label: 'Alerts', to: '/alerts', icon: Bell },
    ],
  },
  {
    label: 'ECOSYSTEM',
    items: [{ label: 'Marketplace', to: '/marketplace', icon: ShoppingBag }],
  },
  {
    label: 'PLATFORM',
    items: [
      { label: 'Environments', to: '/environments', icon: Server },
      { label: 'Audit', to: '/audit', icon: ClipboardList },
    ],
  },
]

function isActive(to: string) {
  return route.path === to || (to !== '/dashboard' && route.path.startsWith(to))
}

function handleKeydown(e: KeyboardEvent) {
  if ((e.metaKey || e.ctrlKey) && e.key === '\\') {
    e.preventDefault()
    shell.toggleSidebar()
  }
}

onMounted(() => document.addEventListener('keydown', handleKeydown))
onUnmounted(() => document.removeEventListener('keydown', handleKeydown))
</script>

<template>
  <aside :class="['sidebar', shell.sidebarCollapsed ? 'collapsed' : '']">
    <!-- Header: logo + toggle (toggle always visible) -->
    <div class="sidebar-header">
      <span class="sidebar-logo">vipsOS</span>
      <button class="toggle-btn" :title="shell.sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'"
        @click="shell.toggleSidebar()">
        <ChevronLeft class="chevron" :size="13" stroke-width="2.5" />
      </button>
    </div>

    <!-- Nav -->
    <nav class="sidebar-nav">
      <template v-for="group in navGroups" :key="group.label ?? 'top'">
        <p v-if="group.label" class="nav-section">{{ group.label }}</p>
        <div v-for="item in group.items" :key="item.to" class="nav-item-wrapper">
          <RouterLink
            :to="item.to"
            :class="['nav-item', isActive(item.to) ? 'active' : '']"
          >
            <component :is="item.icon" class="nav-icon" :size="13" stroke-width="2" />
            <span class="nav-label">{{ item.label }}</span>
          </RouterLink>
          <span v-if="shell.sidebarCollapsed" class="nav-tooltip">{{ item.label }}</span>
        </div>
      </template>
    </nav>

    <!-- Footer -->
    <div class="sidebar-footer">
      <div class="nav-item-wrapper">
        <RouterLink to="/settings" :class="['nav-item', isActive('/settings') ? 'active' : '']">
          <Globe class="nav-icon" :size="13" stroke-width="2" />
          <span class="nav-label">Settings</span>
        </RouterLink>
        <span v-if="shell.sidebarCollapsed" class="nav-tooltip">Settings</span>
      </div>
    </div>
  </aside>
</template>

<style scoped>
.sidebar {
  width: 184px;
  min-width: 184px;
  height: 100%;
  background: var(--sidebar-bg);
  border-right: 1px solid var(--sidebar-border);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  transition: width 0.22s cubic-bezier(0.4, 0, 0.2, 1),
              min-width 0.22s cubic-bezier(0.4, 0, 0.2, 1);
  flex-shrink: 0;
}
.sidebar.collapsed { width: 46px; min-width: 46px; }

.sidebar-header {
  display: flex;
  align-items: center;
  padding: 11px 8px 9px;
  gap: 6px;
  flex-shrink: 0;
  border-bottom: 1px solid var(--sidebar-border);
}

.sidebar-logo {
  font-size: 13px;
  font-weight: 700;
  color: #f1f5f9;
  letter-spacing: -0.02em;
  white-space: nowrap;
  overflow: hidden;
  flex: 1;
  max-width: 120px;
  transition: opacity 0.15s, max-width 0.22s cubic-bezier(0.4, 0, 0.2, 1);
}
.collapsed .sidebar-logo { opacity: 0; max-width: 0; }

.toggle-btn {
  width: 26px;
  height: 26px;
  border-radius: 5px;
  background: var(--sidebar-border);
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  flex-shrink: 0;
  margin-left: auto;
  color: #94a3b8;
  transition: background 0.15s;
}
.toggle-btn:hover { background: #334155; }

.chevron {
  transition: transform 0.22s cubic-bezier(0.4, 0, 0.2, 1);
}
.collapsed .chevron { transform: rotate(180deg); }

.sidebar-nav {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 6px 0;
}

.nav-section {
  padding: 5px 10px 2px;
  font-size: 9.5px;
  font-weight: 600;
  color: var(--sidebar-section);
  letter-spacing: 0.07em;
  text-transform: uppercase;
  white-space: nowrap;
  transition: opacity 0.12s;
}
.collapsed .nav-section { opacity: 0; }

.nav-item-wrapper {
  position: relative;
  margin: 1px 5px;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 5px 7px;
  border-radius: 5px;
  cursor: pointer;
  white-space: nowrap;
  overflow: hidden;
  transition: background 0.12s;
  text-decoration: none;
  color: var(--sidebar-text);
}
.nav-item:hover { background: var(--sidebar-hover); }
.nav-item.active {
  background: var(--sidebar-active);
  color: #ffffff;
}

.nav-icon { flex-shrink: 0; }

.nav-label {
  font-size: 12px;
  font-weight: 500;
  white-space: nowrap;
  transition: opacity 0.12s;
}
.collapsed .nav-label { opacity: 0; }

.nav-tooltip {
  position: absolute;
  left: calc(100% + 10px);
  top: 50%;
  transform: translateY(-50%);
  background: #1e293b;
  color: #f1f5f9;
  font-size: 11px;
  font-weight: 500;
  padding: 4px 9px;
  border-radius: 5px;
  white-space: nowrap;
  pointer-events: none;
  opacity: 0;
  transition: opacity 0.1s;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  z-index: 50;
}
.nav-item-wrapper:hover .nav-tooltip { opacity: 1; }

.sidebar-footer {
  border-top: 1px solid var(--sidebar-border);
  padding: 5px 0;
  flex-shrink: 0;
}
</style>
```

- [ ] **Step 3: Run tests**

```bash
cd apps/web && npm test -- --run
```
Expected: 57 tests pass.

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/stores/shell.ts apps/web/src/components/layout/AppSidebar.vue
git commit -m "feat(sidebar): collapsible icon rail with smooth resize, tooltips, keyboard shortcut"
```

---

## Task 3: AppShell + AppTopBar

**Files:**
- Modify: `src/components/layout/AppShell.vue`
- Modify: `src/components/layout/AppTopBar.vue`

- [ ] **Step 1: Update `AppShell.vue` to give the main area a transition matching the sidebar**

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
    <div class="flex flex-1 flex-col overflow-hidden min-w-0 transition-all duration-[220ms] ease-[cubic-bezier(0.4,0,0.2,1)]">
      <AppTopBar />
      <main class="flex-1 overflow-hidden bg-background">
        <slot />
      </main>
    </div>
    <NotificationsPanel />
    <WorkspaceSwitcher />
    <CommandPalette />
  </div>
</template>
```

- [ ] **Step 2: Update `AppTopBar.vue` — height `h-10`, slate-200 border**

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
  <header class="flex h-10 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-4">
    <button
      class="flex items-center gap-1.5 rounded-[5px] px-2 py-1 text-[12px] font-medium text-slate-700 hover:bg-slate-100"
      @click="shell.toggleWorkspaceSwitcher()">
      <span>{{ auth.session?.workspaceName ?? 'Workspace' }}</span>
      <ChevronsUpDown class="h-3 w-3 text-slate-400" />
    </button>

    <div class="flex items-center gap-1">
      <button
        class="relative rounded-[5px] p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
        @click="shell.toggleNotifications()">
        <Bell class="h-3.5 w-3.5" />
        <span class="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-red-500" />
      </button>
      <RouterLink to="/profile"
        class="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-500 text-[10px] font-semibold text-white hover:ring-2 hover:ring-indigo-300">
        {{ auth.session?.user.avatarInitial ?? '?' }}
      </RouterLink>
    </div>
  </header>
</template>
```

- [ ] **Step 3: Run tests**

```bash
cd apps/web && npm test -- --run
```
Expected: 57 tests pass.

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/components/layout/AppShell.vue apps/web/src/components/layout/AppTopBar.vue
git commit -m "style(shell): refine topbar to h-10, slate border, indigo avatar, smooth main area transition"
```

---

## Task 4: MonitoringView — Reference Density Implementation

Apply the compact density spec to `MonitoringView.vue` as the reference implementation. The class substitution table in the File Map section above governs every change.

**Files:**
- Modify: `src/views/MonitoringView.vue`

- [ ] **Step 1: Replace the template of `MonitoringView.vue`**

Keep the `<script setup>` block unchanged. Replace only `<template>`:

```vue
<template>
  <div class="flex h-full flex-col overflow-auto">
    <div class="border-b px-[18px] py-[11px]">
      <h1 class="text-[15px] font-semibold tracking-tight">Monitoring</h1>
      <p class="mt-0.5 text-[11.5px] text-muted-foreground">Real-time platform health</p>
    </div>

    <div class="flex-1 overflow-y-auto p-[18px] space-y-3">
      <!-- KPI row -->
      <div class="grid grid-cols-3 gap-2">
        <div class="rounded-[7px] border bg-card p-[11px]">
          <div class="flex items-center gap-1.5 mb-1">
            <Activity class="h-3.5 w-3.5 text-green-500" />
            <p class="text-[10.5px] font-medium text-muted-foreground">Active Runs</p>
          </div>
          <p class="text-[22px] font-bold tracking-tight text-green-600">{{ store.stats.activeRuns }}</p>
        </div>
        <div class="rounded-[7px] border bg-card p-[11px]">
          <div class="flex items-center gap-1.5 mb-1">
            <AlertTriangle class="h-3.5 w-3.5 text-red-500" />
            <p class="text-[10.5px] font-medium text-muted-foreground">Failed (last 1h)</p>
          </div>
          <p class="text-[22px] font-bold tracking-tight text-red-600">{{ store.stats.failedLastHour }}</p>
        </div>
        <div class="rounded-[7px] border bg-card p-[11px]">
          <div class="flex items-center gap-1.5 mb-1">
            <Server class="h-3.5 w-3.5 text-amber-500" />
            <p class="text-[10.5px] font-medium text-muted-foreground">Workers Degraded</p>
          </div>
          <p class="text-[22px] font-bold tracking-tight text-amber-600">{{ store.degradedWorkerCount }}</p>
        </div>
      </div>

      <!-- Middle zone -->
      <div class="grid grid-cols-3 gap-2">
        <div class="col-span-2 rounded-[7px] border p-[11px]">
          <p class="mb-2 text-[11.5px] font-semibold">Throughput (24h)</p>
          <div class="flex h-20 items-end gap-0.5">
            <div v-for="(h, i) in Array.from({ length: 24 }, (_, i) => Math.floor(Math.random() * 80) + 20)"
              :key="i"
              class="flex-1 rounded-t bg-indigo-200"
              :style="{ height: h + '%' }" />
          </div>
          <div class="mt-1 flex justify-between text-[10px] text-muted-foreground">
            <span>00:00</span><span>12:00</span><span>now</span>
          </div>
        </div>

        <div class="rounded-[7px] border p-[11px]">
          <p class="mb-2 text-[11.5px] font-semibold">Worker Health</p>
          <div class="space-y-1.5">
            <div v-for="w in store.stats.workers" :key="w.workerId" class="flex items-center gap-2">
              <span class="h-1.5 w-1.5 rounded-full shrink-0" :class="healthDot[w.health]" />
              <span class="flex-1 text-[11.5px]">{{ w.name }}</span>
              <span class="text-[10.5px]" :class="healthColor[w.health]">{{ w.health }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Live run feed -->
      <div class="rounded-[7px] border overflow-hidden">
        <div class="border-b px-3 py-[7px]">
          <p class="text-[11.5px] font-semibold">Live Run Feed</p>
        </div>
        <table class="w-full text-[11.5px]">
          <thead class="bg-muted/50">
            <tr>
              <th class="px-3 py-2 text-left text-[10.5px] font-medium text-muted-foreground">Workflow</th>
              <th class="px-3 py-2 text-left text-[10.5px] font-medium text-muted-foreground">Status</th>
              <th class="px-3 py-2 text-left text-[10.5px] font-medium text-muted-foreground">Started</th>
              <th class="px-3 py-2 text-left text-[10.5px] font-medium text-muted-foreground">Duration</th>
            </tr>
          </thead>
          <tbody class="divide-y">
            <tr v-for="r in store.liveRuns" :key="r.runId" class="hover:bg-muted/30">
              <td class="px-3 py-[7px] font-medium">{{ r.workflowName }}</td>
              <td class="px-3 py-[7px]">
                <span class="capitalize font-medium" :class="statusColor[r.status]">{{ r.status }}</span>
              </td>
              <td class="px-3 py-[7px] text-muted-foreground">{{ new Date(r.startedAt).toLocaleTimeString() }}</td>
              <td class="px-3 py-[7px] text-muted-foreground">{{ elapsed(r.startedAt, r.durationMs) }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Degraded worker failure state -->
      <div v-if="store.degradedWorkerCount > 0"
        class="rounded-[7px] border border-amber-200 bg-amber-50 px-3 py-2.5 text-[11.5px] text-amber-800 flex items-center gap-2">
        <AlertTriangle class="h-3.5 w-3.5 shrink-0" />
        {{ store.degradedWorkerCount }} worker(s) degraded. Runs may be delayed. Check Environments for details.
      </div>
    </div>
  </div>
</template>
```

- [ ] **Step 2: Run tests**

```bash
cd apps/web && npm test -- --run
```
Expected: 57 tests pass.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/views/MonitoringView.vue
git commit -m "style(monitoring): compact density — tight padding, smaller type, indigo throughput bars"
```

---

## Task 5: Dashboard, Workflows, Runs, RunDetail Density Pass

**Files:**
- Modify: `src/views/DashboardView.vue`
- Modify: `src/views/WorkflowsView.vue`
- Modify: `src/views/RunsView.vue`
- Modify: `src/views/RunDetailView.vue`

Apply the substitution table from the File Map reference. Key patterns per view:

- [ ] **Step 1: Update `DashboardView.vue`**

In `DashboardView.vue`, apply these substitutions throughout the template:
- `px-6 py-4` → `px-[18px] py-[11px]` on the page header div
- `text-xl font-semibold` → `text-[15px] font-semibold tracking-tight` on `<h1>`
- `text-sm text-muted-foreground` → `text-[11.5px] text-muted-foreground` on the subtitle `<p>`
- `p-6 space-y-6` → `p-[18px] space-y-3` on the scroll wrapper
- `gap-4` → `gap-2` on any grid
- `p-4` → `p-[11px]` on stat cards and panels
- `text-3xl font-bold` → `text-[22px] font-bold tracking-tight` on stat numbers
- `text-sm font-medium text-muted-foreground` (KPI label) → `text-[10.5px] font-medium text-muted-foreground`
- `text-sm font-semibold` (panel header) → `text-[11.5px] font-semibold`
- `px-4 py-3` (table headers/cells) → `px-3 py-2` (th) and `px-3 py-[7px]` (td)
- `rounded-lg` on cards → `rounded-[7px]`
- `bg-foreground text-background` buttons → `bg-indigo-500 text-white hover:bg-indigo-600`

- [ ] **Step 2: Update `WorkflowsView.vue`**

Same substitution table. Additionally:
- The `openMenuId` dropdown menu — change `right-4 top-10` positioning to `right-3 top-9` to stay aligned after padding reduction
- The status badge `bg-green-100 text-green-700` / `bg-muted text-muted-foreground` pattern: keep as-is (these are workflow status badges, not primary action badges)
- `bg-foreground text-background` on "New Workflow" button → `bg-indigo-500 text-white hover:bg-indigo-600`

- [ ] **Step 3: Update `RunsView.vue`**

Same substitution table. The "retry" or action buttons should use `bg-indigo-500 text-white`.

- [ ] **Step 4: Update `RunDetailView.vue`**

Same substitution table. The retry button and any primary CTA → `bg-indigo-500 text-white hover:bg-indigo-600`.

- [ ] **Step 5: Run tests**

```bash
cd apps/web && npm test -- --run
```
Expected: 57 tests pass.

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/views/DashboardView.vue apps/web/src/views/WorkflowsView.vue \
  apps/web/src/views/RunsView.vue apps/web/src/views/RunDetailView.vue
git commit -m "style(views): compact density on Dashboard, Workflows, Runs, RunDetail"
```

---

## Task 6: Operate + Platform Views Density Pass

**Files:**
- Modify: `src/views/AlertsView.vue`
- Modify: `src/views/EnvironmentsView.vue`
- Modify: `src/views/AuditView.vue`
- Modify: `src/views/BillingView.vue`

Apply the full substitution table from the File Map reference to all four views.

- [ ] **Step 1: Update `AlertsView.vue`**

Apply substitution table. Additionally:
- The "New rule" button: `bg-foreground text-background` → `bg-indigo-500 text-white hover:bg-indigo-600`
- The modal "Create rule" button: same substitution
- `rounded-xl` on modal → `rounded-[7px]`

- [ ] **Step 2: Update `EnvironmentsView.vue`**

Apply substitution table. The environment card grid uses `gap-4` → `gap-2`. The slide-over panel:
- Width stays `w-96`
- `px-4 py-3` header → `px-3 py-[7px]`
- Internal section spacing `space-y-5` → `space-y-3`

- [ ] **Step 3: Update `AuditView.vue`**

Apply substitution table. The search input `max-w-sm` stays. Expanded diff rows: inner `p-2.5` → `p-2`.

- [ ] **Step 4: Update `BillingView.vue`**

Apply substitution table. The progress bars stay the same height (`h-2`). The "Upgrade" button: `bg-foreground text-background` → `bg-indigo-500 text-white hover:bg-indigo-600`. `max-w-2xl` container stays.

- [ ] **Step 5: Run tests**

```bash
cd apps/web && npm test -- --run
```
Expected: 57 tests pass.

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/views/AlertsView.vue apps/web/src/views/EnvironmentsView.vue \
  apps/web/src/views/AuditView.vue apps/web/src/views/BillingView.vue
git commit -m "style(views): compact density on Alerts, Environments, Audit, Billing"
```

---

## Task 7: Ecosystem + Build Views Density Pass

**Files:**
- Modify: `src/views/MarketplaceView.vue`
- Modify: `src/views/MarketplaceListingView.vue`
- Modify: `src/views/ConnectorBuilderView.vue`
- Modify: `src/views/ConnectorsView.vue`
- Modify: `src/views/ConnectorDetailView.vue`
- Modify: `src/views/TemplatesView.vue`

Apply the substitution table. Key notes per view:

- [ ] **Step 1: Update `MarketplaceView.vue`**

Apply substitution table. Tab bar padding `px-6` → `px-[18px]`. Category pill buttons that are currently `bg-foreground text-background` (active state) → `bg-indigo-500 text-white`. The `Install` / `Use` buttons on `MarketplaceCard.vue`:
- Also update `src/components/marketplace/MarketplaceCard.vue`: `bg-foreground text-background` → `bg-indigo-500 text-white hover:bg-indigo-600`, card padding `p-4` → `p-[11px]`, `rounded-lg` → `rounded-[7px]`

- [ ] **Step 2: Update `MarketplaceListingView.vue`**

Apply substitution table. The "Install" / "Use template" button: `bg-foreground text-background` → `bg-indigo-500 text-white hover:bg-indigo-600`.

- [ ] **Step 3: Update `ConnectorBuilderView.vue`**

Apply substitution table. Step indicator circles: active step `bg-foreground text-background` → `bg-indigo-500 text-white`. "Continue" button: `bg-foreground text-background` → `bg-indigo-500 text-white disabled:opacity-50`. "Submit for certification" button: same.

- [ ] **Step 4: Update `ConnectorsView.vue` and `ConnectorDetailView.vue`**

Apply substitution table to both. In `ConnectorsView.vue`: any "Install" or primary CTA → indigo. In `ConnectorDetailView.vue`: same.

- [ ] **Step 5: Update `TemplatesView.vue`**

Apply substitution table. Any "Use template" primary button → `bg-indigo-500 text-white hover:bg-indigo-600`.

- [ ] **Step 6: Update `WorkflowBuilderView.vue`**

The builder view has a different layout (full canvas). Apply only the toolbar and panel areas:
- The toolbar bar height: any `h-14` or `py-3` → `py-2`, `text-sm` labels → `text-[11.5px]`
- The node palette panel: `p-4` → `p-[11px]`, `text-sm` → `text-[11.5px]`, `gap-4` between node cards → `gap-2`
- The node inspector/config panel: `px-4 py-3` section headers → `px-3 py-[7px]`, `text-sm` → `text-[11.5px]`
- Primary "Run workflow" or "Save" buttons: `bg-foreground text-background` → `bg-indigo-500 text-white hover:bg-indigo-600`
- Do NOT change the canvas area or `WorkflowCanvas.vue` — leave Vue Flow layout untouched

- [ ] **Step 7: Run tests**

```bash
cd apps/web && npm test -- --run
```
Expected: 57 tests pass.

- [ ] **Step 8: Commit**

```bash
git add apps/web/src/views/MarketplaceView.vue apps/web/src/views/MarketplaceListingView.vue \
  apps/web/src/views/ConnectorBuilderView.vue apps/web/src/views/ConnectorsView.vue \
  apps/web/src/views/ConnectorDetailView.vue apps/web/src/views/TemplatesView.vue \
  apps/web/src/views/WorkflowBuilderView.vue \
  apps/web/src/components/marketplace/MarketplaceCard.vue
git commit -m "style(views): compact density on Marketplace, ConnectorBuilder, Connectors, Templates, Builder"
```

---

## Task 8: Admin + Auth Views Density Pass

**Files:**
- Modify: `src/views/SecretsView.vue`
- Modify: `src/views/TriggersView.vue`
- Modify: `src/views/MembersView.vue`
- Modify: `src/views/SettingsView.vue`
- Modify: `src/views/ProfileView.vue`
- Modify: `src/views/auth/LoginView.vue`
- Modify: `src/views/auth/SignUpView.vue`
- Modify: `src/views/OnboardingView.vue`

Apply the substitution table. Notes per view:

- [ ] **Step 1: Update `SecretsView.vue`, `TriggersView.vue`, `MembersView.vue`**

Apply the full substitution table to all three.
- `SecretsView.vue`: "Add Secret" / "Rotate" primary buttons → indigo
- `TriggersView.vue`: "New trigger" button → indigo; toggle active state stays (it's a functional indicator, not a primary action)
- `MembersView.vue`: "Invite member" button → indigo; the "Invite" button inside the modal → indigo

- [ ] **Step 2: Update `SettingsView.vue` and `ProfileView.vue`**

Apply substitution table. Save/update buttons → `bg-indigo-500 text-white hover:bg-indigo-600`. Tab active state: current `border-foreground text-foreground` → `border-indigo-500 text-indigo-600`.

- [ ] **Step 3: Update auth views: `LoginView.vue`, `SignUpView.vue`, `OnboardingView.vue`**

These have a centered card layout — apply the substitution table where applicable:
- `rounded-xl` on the card → `rounded-[7px]`
- "Sign in" / "Create account" submit button: `bg-foreground text-background` → `bg-indigo-500 text-white hover:bg-indigo-600`
- `OnboardingView.vue`: step indicator active state → `bg-indigo-500`; "Continue" / "Finish" buttons → indigo

- [ ] **Step 4: Run tests**

```bash
cd apps/web && npm test -- --run
```
Expected: 57 tests pass.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/views/SecretsView.vue apps/web/src/views/TriggersView.vue \
  apps/web/src/views/MembersView.vue apps/web/src/views/SettingsView.vue \
  apps/web/src/views/ProfileView.vue apps/web/src/views/auth/LoginView.vue \
  apps/web/src/views/auth/SignUpView.vue apps/web/src/views/OnboardingView.vue
git commit -m "style(views): compact density on Secrets, Triggers, Members, Settings, Profile, Auth"
```

---

## Task 9: Final Verification

- [ ] **Step 1: Run full test suite**

```bash
cd apps/web && npm test -- --run
```
Expected: all 57 tests pass.

- [ ] **Step 2: Start dev server and walk through the success criteria**

```bash
cd apps/web && npm run dev
```

Verify each item from the spec:
1. Sidebar collapses/expands with smooth `0.22s` animation — chevron always visible
2. Collapsed sidebar shows icon tooltips on hover
3. `⌘\` (or `Ctrl+\`) toggles the sidebar — test it
4. Reload the page — collapsed state persists (localStorage key `vipsos:sidebar-collapsed`)
5. Page titles are compact — not blocky (compare `/monitoring` vs before)
6. KPI numbers are `22px`, prominent but not oversized
7. Content background is slate-50 (off-white) — not pure white
8. All primary buttons are indigo `#6366f1` — "New Workflow", "Install", "Upgrade", "Sign in"
9. Active nav item is indigo
10. Status badges (Running/Failed/Success) remain clearly distinct in their green/red/blue
11. Topbar is `h-10`, border is slate-200, avatar is indigo
12. Walk: `/auth/login` → login → `/dashboard` → `/workflows` → `/monitoring` → `/marketplace` → `/environments` → `/embedded?brand=Demo`

- [ ] **Step 3: Final commit**

```bash
git add -A
git commit -m "feat: UX refinement complete — compact layout, slate+indigo palette, SF Pro, collapsible sidebar"
```
