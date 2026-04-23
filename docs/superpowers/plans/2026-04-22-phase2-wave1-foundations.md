# Phase 2 Wave 1 — Auth, Onboarding & Builder UX

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add login/signup, a 4-step onboarding wizard, and fix the Workflow Builder with color-coded nodes and a context-sensitive inspector panel — giving the demo a proper entry point and a usable canvas.

**Architecture:** `useAuthStore` drives route guards via `router.beforeEach`. The builder is refactored from a generic `NodeConfigPanel` (shows raw config keys) to a `NodeInspector` that renders type-specific panels (Source / Transform / Destination / Control). Node components get color-coded headers and always-visible handles.

**Tech Stack:** Vue 3 `<script setup lang="ts">`, Pinia setup-store pattern, Vue Router 5, Vue Flow, Tailwind CSS, Vitest + @vue/test-utils. All commands run from `apps/web/`.

---

## File Map

| Action | Path | Responsibility |
|--------|------|---------------|
| Create | `src/types/auth.ts` | Auth, User, Org types |
| Create | `src/data/auth.ts` | Stub session data |
| Create | `src/stores/auth.ts` | useAuthStore — session, isAuthenticated, login, logout |
| Create | `src/stores/__tests__/auth.test.ts` | Store unit tests |
| Create | `src/views/auth/LoginView.vue` | Login form |
| Create | `src/views/auth/SignUpView.vue` | Sign-up form |
| Create | `src/views/OnboardingView.vue` | 4-step wizard |
| Modify | `src/router/index.ts` | Add auth routes, onboarding, route guard |
| Modify | `src/components/layout/AppSidebar.vue` | Grouped nav (BUILD / OPERATE / ECOSYSTEM / PLATFORM) |
| Modify | `src/components/layout/__tests__/AppSidebar.test.ts` | Update for new nav groups |
| Create | `src/components/workflow/inspector/SourceInspector.vue` | Source node fields |
| Create | `src/components/workflow/inspector/TransformInspector.vue` | Transform node fields |
| Create | `src/components/workflow/inspector/DestinationInspector.vue` | Destination node fields |
| Create | `src/components/workflow/inspector/ControlInspector.vue` | Control node fields |
| Modify | `src/components/workflow/NodeConfigPanel.vue` | Replace generic config with NodeInspector dispatch |
| Modify | `src/components/workflow/nodes/SourceNode.vue` | Color strip + always-visible handle |
| Modify | `src/components/workflow/nodes/TransformNode.vue` | Amber color + handles |
| Modify | `src/components/workflow/nodes/DestinationNode.vue` | Green color + handles |
| Modify | `src/components/workflow/nodes/LogicNode.vue` | Purple color + handles |

---

## Task 1: Add auth types and stub data

**Files:**
- Create: `src/types/auth.ts`
- Create: `src/data/auth.ts`

- [ ] **Step 1: Create auth types**

```typescript
// src/types/auth.ts
export interface User {
  userId: string
  name: string
  email: string
  role: 'admin' | 'builder' | 'operator' | 'partner'
  avatarInitial: string
}

export interface Organization {
  orgId: string
  name: string
  industry?: string
}

export interface AuthSession {
  user: User
  org: Organization
  workspaceId: string
  workspaceName: string
  onboardingComplete: boolean
}
```

- [ ] **Step 2: Create stub session data**

```typescript
// src/data/auth.ts
import type { AuthSession } from '@/types/auth'

export const stubSession: AuthSession = {
  user: {
    userId: 'u_001',
    name: 'Alex Rivera',
    email: 'alex@acme.io',
    role: 'admin',
    avatarInitial: 'A',
  },
  org: {
    orgId: 'org_001',
    name: 'Acme Corp',
    industry: 'Technology',
  },
  workspaceId: 'ws_001',
  workspaceName: 'Production',
  onboardingComplete: false,
}
```

- [ ] **Step 3: Commit**

```bash
git add src/types/auth.ts src/data/auth.ts
git commit -m "feat(auth): add auth types and stub session data"
```

---

## Task 2: useAuthStore

**Files:**
- Create: `src/stores/auth.ts`
- Create: `src/stores/__tests__/auth.test.ts`

- [ ] **Step 1: Write the failing tests**

```typescript
// src/stores/__tests__/auth.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useAuthStore } from '../auth'

describe('useAuthStore', () => {
  beforeEach(() => { setActivePinia(createPinia()) })

  it('starts unauthenticated', () => {
    const store = useAuthStore()
    expect(store.isAuthenticated).toBe(false)
    expect(store.session).toBeNull()
  })

  it('authenticates after login', () => {
    const store = useAuthStore()
    store.login('alex@acme.io', 'password')
    expect(store.isAuthenticated).toBe(true)
    expect(store.session?.user.email).toBe('alex@acme.io')
  })

  it('clears session on logout', () => {
    const store = useAuthStore()
    store.login('alex@acme.io', 'password')
    store.logout()
    expect(store.isAuthenticated).toBe(false)
    expect(store.session).toBeNull()
  })

  it('marks onboarding complete', () => {
    const store = useAuthStore()
    store.login('alex@acme.io', 'password')
    store.completeOnboarding()
    expect(store.session?.onboardingComplete).toBe(true)
  })
})
```

- [ ] **Step 2: Run — expect FAIL**

```bash
cd apps/web && npm test -- auth
```
Expected: `Cannot find module '../auth'`

- [ ] **Step 3: Implement useAuthStore**

```typescript
// src/stores/auth.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { stubSession } from '@/data/auth'
import type { AuthSession } from '@/types/auth'

export const useAuthStore = defineStore('auth', () => {
  const session = ref<AuthSession | null>(null)

  const isAuthenticated = computed(() => session.value !== null)

  function login(_email: string, _password: string) {
    // Demo: accept any credentials and load stub session
    session.value = { ...stubSession }
  }

  function logout() {
    session.value = null
  }

  function completeOnboarding() {
    if (session.value) session.value.onboardingComplete = true
  }

  return { session, isAuthenticated, login, logout, completeOnboarding }
})
```

- [ ] **Step 4: Run — expect PASS**

```bash
cd apps/web && npm test -- auth
```
Expected: 4 tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/stores/auth.ts src/stores/__tests__/auth.test.ts
git commit -m "feat(auth): add useAuthStore with login/logout/onboarding"
```

---

## Task 3: LoginView

**Files:**
- Create: `src/views/auth/LoginView.vue`

- [ ] **Step 1: Create LoginView**

```vue
<!-- src/views/auth/LoginView.vue -->
<script setup lang="ts">
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const email = ref('')
const password = ref('')
const error = ref('')
const auth = useAuthStore()
const router = useRouter()
const route = useRoute()

function submit() {
  if (!email.value || !password.value) {
    error.value = 'Please enter your email and password.'
    return
  }
  auth.login(email.value, password.value)
  const redirect = (route.query.redirect as string) || '/dashboard'
  router.push(redirect)
}
</script>

<template>
  <div class="flex min-h-screen items-center justify-center bg-muted/40">
    <div class="w-full max-w-sm rounded-xl border bg-background p-8 shadow-sm">
      <div class="mb-6 text-center">
        <h1 class="text-2xl font-bold tracking-tight">Sign in to vipsOS</h1>
        <p class="mt-1 text-sm text-muted-foreground">Enter your credentials to continue</p>
      </div>

      <form class="space-y-4" @submit.prevent="submit">
        <div>
          <label class="mb-1.5 block text-sm font-medium">Email</label>
          <input
            v-model="email"
            type="email"
            placeholder="you@company.com"
            class="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none ring-offset-background focus:ring-2 focus:ring-ring"
          />
        </div>
        <div>
          <label class="mb-1.5 block text-sm font-medium">Password</label>
          <input
            v-model="password"
            type="password"
            placeholder="••••••••"
            class="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none ring-offset-background focus:ring-2 focus:ring-ring"
          />
        </div>

        <p v-if="error" class="text-sm text-red-500">{{ error }}</p>

        <button
          type="submit"
          class="w-full rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background hover:bg-foreground/90"
        >
          Sign in
        </button>
      </form>

      <div class="my-4 flex items-center gap-3">
        <div class="flex-1 border-t" />
        <span class="text-xs text-muted-foreground">OR</span>
        <div class="flex-1 border-t" />
      </div>

      <button
        class="w-full rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted"
        @click="submit"
      >
        Continue with SSO
      </button>

      <p class="mt-4 text-center text-sm text-muted-foreground">
        Don't have an account?
        <RouterLink to="/auth/signup" class="font-medium underline underline-offset-4">Sign up</RouterLink>
      </p>
    </div>
  </div>
</template>
```

- [ ] **Step 2: Commit**

```bash
git add src/views/auth/LoginView.vue
git commit -m "feat(auth): add LoginView with email/password and SSO placeholder"
```

---

## Task 4: SignUpView

**Files:**
- Create: `src/views/auth/SignUpView.vue`

- [ ] **Step 1: Create SignUpView**

```vue
<!-- src/views/auth/SignUpView.vue -->
<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const name = ref('')
const email = ref('')
const password = ref('')
const agreed = ref(false)
const error = ref('')
const auth = useAuthStore()
const router = useRouter()

function submit() {
  if (!name.value || !email.value || !password.value) {
    error.value = 'All fields are required.'
    return
  }
  if (!agreed.value) {
    error.value = 'You must agree to the terms.'
    return
  }
  auth.login(email.value, password.value)
  router.push('/onboarding')
}
</script>

<template>
  <div class="flex min-h-screen items-center justify-center bg-muted/40">
    <div class="w-full max-w-sm rounded-xl border bg-background p-8 shadow-sm">
      <div class="mb-6 text-center">
        <h1 class="text-2xl font-bold tracking-tight">Create your account</h1>
        <p class="mt-1 text-sm text-muted-foreground">Get started with vipsOS</p>
      </div>

      <form class="space-y-4" @submit.prevent="submit">
        <div>
          <label class="mb-1.5 block text-sm font-medium">Full name</label>
          <input v-model="name" type="text" placeholder="Alex Rivera"
            class="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" />
        </div>
        <div>
          <label class="mb-1.5 block text-sm font-medium">Work email</label>
          <input v-model="email" type="email" placeholder="you@company.com"
            class="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" />
        </div>
        <div>
          <label class="mb-1.5 block text-sm font-medium">Password</label>
          <input v-model="password" type="password" placeholder="Min. 8 characters"
            class="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" />
        </div>
        <label class="flex items-start gap-2 text-sm">
          <input v-model="agreed" type="checkbox" class="mt-0.5 h-4 w-4 rounded border" />
          <span class="text-muted-foreground">
            I agree to the <a href="#" class="underline">Terms of Service</a> and <a href="#" class="underline">Privacy Policy</a>
          </span>
        </label>

        <p v-if="error" class="text-sm text-red-500">{{ error }}</p>

        <button type="submit"
          class="w-full rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background hover:bg-foreground/90">
          Create account
        </button>
      </form>

      <p class="mt-4 text-center text-sm text-muted-foreground">
        Already have an account?
        <RouterLink to="/auth/login" class="font-medium underline underline-offset-4">Sign in</RouterLink>
      </p>
    </div>
  </div>
</template>
```

- [ ] **Step 2: Commit**

```bash
git add src/views/auth/SignUpView.vue
git commit -m "feat(auth): add SignUpView"
```

---

## Task 5: Router — auth routes and navigation guard

**Files:**
- Modify: `src/router/index.ts`

- [ ] **Step 1: Update router with auth routes and guard**

Replace the entire contents of `src/router/index.ts`:

```typescript
import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const PUBLIC_ROUTES = ['/auth/login', '/auth/signup', '/onboarding', '/embedded']

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', redirect: '/dashboard' },

    // Public
    { path: '/auth/login', name: 'login', component: () => import('@/views/auth/LoginView.vue'), meta: { public: true } },
    { path: '/auth/signup', name: 'signup', component: () => import('@/views/auth/SignUpView.vue'), meta: { public: true } },
    { path: '/onboarding', name: 'onboarding', component: () => import('@/views/OnboardingView.vue'), meta: { public: true } },
    { path: '/embedded', name: 'embedded', component: () => import('@/views/EmbeddedView.vue'), meta: { public: true } },

    // Protected
    { path: '/dashboard', name: 'dashboard', component: () => import('@/views/DashboardView.vue') },
    { path: '/workflows', name: 'workflows', component: () => import('@/views/WorkflowsView.vue') },
    { path: '/workflows/:id/builder', name: 'workflow-builder', component: () => import('@/views/WorkflowBuilderView.vue') },
    { path: '/connectors', name: 'connectors', component: () => import('@/views/ConnectorsView.vue') },
    { path: '/connectors/build', name: 'connector-builder', component: () => import('@/views/ConnectorBuilderView.vue') },
    { path: '/connectors/:id', name: 'connector-detail', component: () => import('@/views/ConnectorDetailView.vue') },
    { path: '/runs', name: 'runs', component: () => import('@/views/RunsView.vue') },
    { path: '/runs/:id', name: 'run-detail', component: () => import('@/views/RunDetailView.vue') },

    // Wave 2 (stubs — views created in wave2 plan)
    { path: '/triggers', name: 'triggers', component: () => import('@/views/TriggersView.vue') },
    { path: '/secrets', name: 'secrets', component: () => import('@/views/SecretsView.vue') },
    { path: '/members', name: 'members', component: () => import('@/views/MembersView.vue') },
    { path: '/templates', name: 'templates', component: () => import('@/views/TemplatesView.vue') },
    { path: '/settings', name: 'settings', component: () => import('@/views/SettingsView.vue') },
    { path: '/profile', name: 'profile', component: () => import('@/views/ProfileView.vue') },

    // Wave 3 (stubs — views created in wave3 plan)
    { path: '/monitoring', name: 'monitoring', component: () => import('@/views/MonitoringView.vue') },
    { path: '/alerts', name: 'alerts', component: () => import('@/views/AlertsView.vue') },
    { path: '/environments', name: 'environments', component: () => import('@/views/EnvironmentsView.vue') },
    { path: '/billing', name: 'billing', component: () => import('@/views/BillingView.vue') },
    { path: '/audit', name: 'audit', component: () => import('@/views/AuditView.vue') },
    { path: '/marketplace', name: 'marketplace', component: () => import('@/views/MarketplaceView.vue') },
    { path: '/marketplace/:id', name: 'marketplace-listing', component: () => import('@/views/MarketplaceListingView.vue') },
  ],
})

router.beforeEach((to) => {
  const isPublic = PUBLIC_ROUTES.some((p) => to.path.startsWith(p)) || to.meta.public
  if (isPublic) return true

  const auth = useAuthStore()
  if (!auth.isAuthenticated) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }
})

export default router
```

- [ ] **Step 2: Create placeholder views for Wave 2 + 3 (so router imports don't fail)**

Create each of these files with minimal content. Repeat this pattern for every stub view:

```vue
<!-- src/views/TriggersView.vue -->
<template><div class="p-6"><h1 class="text-xl font-semibold">Triggers</h1><p class="text-muted-foreground mt-1">Coming in Wave 2.</p></div></template>
```

Create the following stub files using the same pattern (replace title accordingly):
- `src/views/SecretsView.vue` — title "Secrets"
- `src/views/MembersView.vue` — title "Members"
- `src/views/TemplatesView.vue` — title "Templates"
- `src/views/SettingsView.vue` — title "Settings"
- `src/views/ProfileView.vue` — title "Profile"
- `src/views/MonitoringView.vue` — title "Monitoring"
- `src/views/AlertsView.vue` — title "Alerts"
- `src/views/EnvironmentsView.vue` — title "Environments"
- `src/views/BillingView.vue` — title "Billing"
- `src/views/AuditView.vue` — title "Audit"
- `src/views/MarketplaceView.vue` — title "Marketplace"
- `src/views/MarketplaceListingView.vue` — title "Marketplace Listing"
- `src/views/ConnectorBuilderView.vue` — title "Connector Builder"
- `src/views/EmbeddedView.vue` — title "Embedded" (no app shell needed for stub)

- [ ] **Step 3: Commit**

```bash
git add src/router/index.ts src/views/
git commit -m "feat(router): add auth guard and all Phase 2 routes with stub views"
```

---

## Task 6: OnboardingView — 4-step wizard

**Files:**
- Create: `src/views/OnboardingView.vue`

- [ ] **Step 1: Create OnboardingView**

```vue
<!-- src/views/OnboardingView.vue -->
<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const auth = useAuthStore()
const step = ref(1)

const org = ref({ name: '', industry: '', teamSize: '' })
const workspace = ref({ name: '', env: 'dev' })
const invites = ref([{ email: '', role: 'builder' }])

const industries = ['Technology', 'Finance', 'Healthcare', 'Retail', 'Education', 'Other']

function addInvite() {
  invites.value.push({ email: '', role: 'builder' })
}

function finish() {
  auth.completeOnboarding()
  router.push('/dashboard')
}

function nextStep() {
  if (step.value < 4) step.value++
  else finish()
}

function skip() {
  if (step.value < 4) step.value++
  else finish()
}
</script>

<template>
  <div class="flex min-h-screen items-center justify-center bg-muted/40">
    <div class="w-full max-w-lg rounded-xl border bg-background p-8 shadow-sm">

      <!-- Stepper -->
      <div class="mb-8 flex items-center gap-2">
        <template v-for="n in 4" :key="n">
          <div
            class="flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold"
            :class="n <= step ? 'bg-foreground text-background' : 'border text-muted-foreground'"
          >{{ n }}</div>
          <div v-if="n < 4" class="flex-1 border-t" :class="n < step ? 'border-foreground' : ''" />
        </template>
      </div>

      <!-- Step 1: Organization -->
      <div v-if="step === 1">
        <h2 class="text-lg font-semibold">Create your organization</h2>
        <p class="mb-4 mt-1 text-sm text-muted-foreground">This is required to continue.</p>
        <div class="space-y-3">
          <div>
            <label class="mb-1 block text-sm font-medium">Organization name <span class="text-red-500">*</span></label>
            <input v-model="org.name" type="text" placeholder="Acme Corp"
              class="w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" />
          </div>
          <div>
            <label class="mb-1 block text-sm font-medium">Industry</label>
            <select v-model="org.industry" class="w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring">
              <option value="">Select industry</option>
              <option v-for="i in industries" :key="i" :value="i">{{ i }}</option>
            </select>
          </div>
        </div>
        <button :disabled="!org.name"
          class="mt-6 w-full rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background disabled:opacity-50 hover:bg-foreground/90"
          @click="nextStep">Continue</button>
      </div>

      <!-- Step 2: Workspace -->
      <div v-if="step === 2">
        <h2 class="text-lg font-semibold">Create your first workspace</h2>
        <p class="mb-4 mt-1 text-sm text-muted-foreground">Workspaces group your workflows and connectors.</p>
        <div class="space-y-3">
          <div>
            <label class="mb-1 block text-sm font-medium">Workspace name</label>
            <input v-model="workspace.name" type="text" placeholder="Production"
              class="w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" />
          </div>
          <div>
            <label class="mb-1 block text-sm font-medium">Environment</label>
            <div class="flex gap-2">
              <label v-for="env in ['dev', 'staging', 'prod']" :key="env"
                class="flex flex-1 cursor-pointer items-center justify-center rounded-md border px-3 py-2 text-sm font-medium"
                :class="workspace.env === env ? 'border-foreground bg-muted' : ''">
                <input v-model="workspace.env" type="radio" :value="env" class="sr-only" />
                {{ env }}
              </label>
            </div>
          </div>
        </div>
        <div class="mt-6 flex gap-2">
          <button class="flex-1 rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted" @click="skip">Skip</button>
          <button class="flex-1 rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background hover:bg-foreground/90" @click="nextStep">Continue</button>
        </div>
      </div>

      <!-- Step 3: Invite team -->
      <div v-if="step === 3">
        <h2 class="text-lg font-semibold">Invite your team</h2>
        <p class="mb-4 mt-1 text-sm text-muted-foreground">Add teammates by email. You can do this later too.</p>
        <div class="space-y-2">
          <div v-for="(invite, i) in invites" :key="i" class="flex gap-2">
            <input v-model="invite.email" type="email" placeholder="colleague@company.com"
              class="flex-1 rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" />
            <select v-model="invite.role" class="rounded-md border px-2 py-2 text-sm outline-none focus:ring-2 focus:ring-ring">
              <option value="admin">Admin</option>
              <option value="builder">Builder</option>
              <option value="operator">Operator</option>
            </select>
          </div>
          <button class="text-sm text-muted-foreground underline" @click="addInvite">+ Add another</button>
        </div>
        <div class="mt-6 flex gap-2">
          <button class="flex-1 rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted" @click="skip">Skip</button>
          <button class="flex-1 rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background hover:bg-foreground/90" @click="nextStep">Send invites</button>
        </div>
      </div>

      <!-- Step 4: First connector -->
      <div v-if="step === 4">
        <h2 class="text-lg font-semibold">Connect your first system</h2>
        <p class="mb-4 mt-1 text-sm text-muted-foreground">Pick a connector to get started. You can add more later.</p>
        <div class="grid grid-cols-3 gap-2">
          <button v-for="connector in ['Postgres', 'Salesforce', 'HubSpot', 'BigQuery', 'Stripe', 'Slack']" :key="connector"
            class="rounded-md border p-3 text-sm font-medium hover:bg-muted"
            @click="finish">
            {{ connector }}
          </button>
        </div>
        <div class="mt-6 flex gap-2">
          <button class="flex-1 rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted" @click="finish">Skip for now</button>
        </div>
      </div>

    </div>
  </div>
</template>
```

- [ ] **Step 2: Commit**

```bash
git add src/views/OnboardingView.vue
git commit -m "feat(onboarding): add 4-step onboarding wizard"
```

---

## Task 7: Update AppSidebar with grouped navigation

**Files:**
- Modify: `src/components/layout/AppSidebar.vue`
- Modify: `src/components/layout/__tests__/AppSidebar.test.ts`

- [ ] **Step 1: Write failing tests for new nav groups**

Replace `src/components/layout/__tests__/AppSidebar.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia } from 'pinia'
import { createRouter, createWebHashHistory } from 'vue-router'
import AppSidebar from '../AppSidebar.vue'

const router = createRouter({
  history: createWebHashHistory(),
  routes: [{ path: '/:pathMatch(.*)*', component: { template: '<div />' } }],
})

describe('AppSidebar', () => {
  const mountSidebar = () =>
    mount(AppSidebar, { global: { plugins: [router, createPinia()] } })

  it('renders the app name', async () => {
    const wrapper = mountSidebar()
    await router.isReady()
    expect(wrapper.text()).toContain('vipsOS')
  })

  it('renders BUILD group with Workflows, Connectors, Templates, Secrets', async () => {
    const wrapper = mountSidebar()
    await router.isReady()
    const text = wrapper.text()
    expect(text).toContain('Workflows')
    expect(text).toContain('Connectors')
    expect(text).toContain('Templates')
    expect(text).toContain('Secrets')
  })

  it('renders OPERATE group with Runs, Monitoring, Alerts', async () => {
    const wrapper = mountSidebar()
    await router.isReady()
    const text = wrapper.text()
    expect(text).toContain('Runs')
    expect(text).toContain('Monitoring')
    expect(text).toContain('Alerts')
  })

  it('renders ECOSYSTEM group with Marketplace', async () => {
    const wrapper = mountSidebar()
    await router.isReady()
    expect(wrapper.text()).toContain('Marketplace')
  })

  it('renders PLATFORM group with Environments and Audit', async () => {
    const wrapper = mountSidebar()
    await router.isReady()
    const text = wrapper.text()
    expect(text).toContain('Environments')
    expect(text).toContain('Audit')
  })
})
```

- [ ] **Step 2: Run — expect FAIL**

```bash
cd apps/web && npm test -- AppSidebar
```
Expected: failures on Monitoring, Alerts, Marketplace, Environments, Audit.

- [ ] **Step 3: Replace AppSidebar with grouped nav**

```vue
<!-- src/components/layout/AppSidebar.vue -->
<script setup lang="ts">
import { RouterLink, useRoute } from 'vue-router'
import {
  LayoutDashboard, GitBranch, Plug, PlayCircle, FileText, KeyRound,
  Activity, Bell, Globe, Server, ClipboardList, ShoppingBag,
} from 'lucide-vue-next'

const route = useRoute()

const navGroups = [
  {
    label: null,
    items: [
      { label: 'Dashboard', to: '/dashboard', icon: LayoutDashboard },
    ],
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
    items: [
      { label: 'Marketplace', to: '/marketplace', icon: ShoppingBag },
    ],
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
</script>

<template>
  <aside class="flex h-full w-60 flex-col border-r bg-background">
    <div class="flex h-14 items-center border-b px-4">
      <span class="text-lg font-bold tracking-tight">vipsOS</span>
    </div>

    <nav class="flex-1 overflow-y-auto px-2 py-3">
      <template v-for="group in navGroups" :key="group.label ?? 'top'">
        <p v-if="group.label"
          class="mb-1 mt-3 px-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
          {{ group.label }}
        </p>
        <RouterLink
          v-for="item in group.items"
          :key="item.to"
          :to="item.to"
          class="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-muted"
          :class="isActive(item.to) ? 'bg-muted text-foreground' : 'text-muted-foreground'"
        >
          <component :is="item.icon" class="h-4 w-4 shrink-0" />
          {{ item.label }}
        </RouterLink>
      </template>
    </nav>

    <div class="border-t px-2 py-2">
      <RouterLink to="/settings" class="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground">
        <Globe class="h-4 w-4" />
        Settings
      </RouterLink>
    </div>
  </aside>
</template>
```

- [ ] **Step 4: Run — expect PASS**

```bash
cd apps/web && npm test -- AppSidebar
```
Expected: all 5 tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/components/layout/AppSidebar.vue src/components/layout/__tests__/AppSidebar.test.ts
git commit -m "feat(nav): group sidebar into BUILD / OPERATE / ECOSYSTEM / PLATFORM"
```

---

## Task 8: Node Inspector — context-sensitive panels

**Files:**
- Create: `src/components/workflow/inspector/SourceInspector.vue`
- Create: `src/components/workflow/inspector/TransformInspector.vue`
- Create: `src/components/workflow/inspector/DestinationInspector.vue`
- Create: `src/components/workflow/inspector/ControlInspector.vue`
- Modify: `src/components/workflow/NodeConfigPanel.vue`

- [ ] **Step 1: Create SourceInspector**

```vue
<!-- src/components/workflow/inspector/SourceInspector.vue -->
<script setup lang="ts">
import { ref } from 'vue'
import type { BuilderNodeData } from '@/stores/builder'

const props = defineProps<{ data: BuilderNodeData }>()
const emit = defineEmits<{ update: [config: Record<string, unknown>] }>()

const host = ref((props.data.config.host as string) ?? '')
const port = ref((props.data.config.port as string) ?? '5432')
const database = ref((props.data.config.database as string) ?? '')
const secretRef = ref((props.data.config.secretRef as string) ?? '')
const query = ref((props.data.config.query as string) ?? '')
const syncMode = ref((props.data.config.syncMode as string) ?? 'full')
const testStatus = ref<'idle' | 'testing' | 'ok' | 'error'>('idle')

function save() {
  emit('update', { host: host.value, port: port.value, database: database.value, secretRef: secretRef.value, query: query.value, syncMode: syncMode.value })
}

function testConnection() {
  testStatus.value = 'testing'
  setTimeout(() => { testStatus.value = 'ok' }, 800)
}
</script>

<template>
  <div class="space-y-4 p-4">
    <div>
      <p class="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Connection</p>
      <input v-model="host" placeholder="Host / Address" @change="save"
        class="mb-2 w-full rounded-md border bg-background px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-ring" />
      <div class="flex gap-2">
        <input v-model="port" placeholder="Port" @change="save"
          class="w-20 rounded-md border bg-background px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-ring" />
        <input v-model="database" placeholder="Database" @change="save"
          class="flex-1 rounded-md border bg-background px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-ring" />
      </div>
    </div>

    <div>
      <p class="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Auth</p>
      <input v-model="secretRef" placeholder="🔑 Secret reference (e.g. secret:db-creds)" @change="save"
        class="w-full rounded-md border bg-background px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-ring" />
    </div>

    <div>
      <p class="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Query</p>
      <textarea v-model="query" placeholder="SELECT * FROM table" rows="3" @change="save"
        class="w-full rounded-md border bg-background px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-ring" />
    </div>

    <div>
      <p class="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Sync Mode</p>
      <div class="flex gap-2">
        <label v-for="mode in ['full', 'incremental']" :key="mode"
          class="flex flex-1 cursor-pointer items-center justify-center rounded-md border px-2 py-1.5 text-xs font-medium"
          :class="syncMode === mode ? 'border-foreground bg-muted' : ''">
          <input v-model="syncMode" type="radio" :value="mode" class="sr-only" @change="save" />
          {{ mode }}
        </label>
      </div>
    </div>

    <button @click="testConnection"
      class="w-full rounded-md border px-3 py-1.5 text-sm font-medium hover:bg-muted"
      :class="testStatus === 'ok' ? 'border-green-500 text-green-600' : testStatus === 'error' ? 'border-red-500 text-red-600' : ''">
      {{ testStatus === 'testing' ? 'Testing…' : testStatus === 'ok' ? '✓ Connected' : testStatus === 'error' ? '✗ Failed' : 'Test Connection' }}
    </button>
  </div>
</template>
```

- [ ] **Step 2: Create TransformInspector**

```vue
<!-- src/components/workflow/inspector/TransformInspector.vue -->
<script setup lang="ts">
import { ref } from 'vue'
import type { BuilderNodeData } from '@/stores/builder'

defineProps<{ data: BuilderNodeData }>()

interface FieldMapping { from: string; to: string }
interface TypeCoercion { fromType: string; toType: string }

const transformType = ref('map')
const mappings = ref<FieldMapping[]>([{ from: '', to: '' }])
const coercions = ref<TypeCoercion[]>([])
const newFieldExpr = ref('')

const transformTypes = ['map', 'filter', 'join', 'aggregate', 'split']

function addMapping() { mappings.value.push({ from: '', to: '' }) }
function removeMapping(i: number) { mappings.value.splice(i, 1) }
function addCoercion() { coercions.value.push({ fromType: 'string', toType: 'date' }) }
</script>

<template>
  <div class="space-y-4 p-4">
    <div>
      <p class="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Transform Type</p>
      <select v-model="transformType"
        class="w-full rounded-md border bg-background px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-ring">
        <option v-for="t in transformTypes" :key="t" :value="t">{{ t }}</option>
      </select>
    </div>

    <div>
      <div class="mb-2 flex items-center justify-between">
        <p class="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Field Mappings</p>
        <button class="text-xs text-muted-foreground hover:text-foreground" @click="addMapping">+ Add</button>
      </div>
      <div class="space-y-1.5">
        <div v-for="(m, i) in mappings" :key="i" class="flex items-center gap-1.5">
          <input v-model="m.from" placeholder="source.field"
            class="flex-1 rounded-md border bg-background px-2 py-1 text-xs outline-none focus:ring-1 focus:ring-ring" />
          <span class="text-xs text-muted-foreground">→</span>
          <input v-model="m.to" placeholder="dest.field"
            class="flex-1 rounded-md border bg-background px-2 py-1 text-xs outline-none focus:ring-1 focus:ring-ring" />
          <button class="text-xs text-muted-foreground hover:text-red-500" @click="removeMapping(i)">✕</button>
        </div>
      </div>
    </div>

    <div>
      <div class="mb-2 flex items-center justify-between">
        <p class="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Type Coercions</p>
        <button class="text-xs text-muted-foreground hover:text-foreground" @click="addCoercion">+ Add</button>
      </div>
      <div class="space-y-1.5">
        <div v-for="(c, i) in coercions" :key="i" class="flex items-center gap-1.5">
          <input v-model="c.fromType" placeholder="string"
            class="flex-1 rounded-md border bg-background px-2 py-1 text-xs outline-none" />
          <span class="text-xs opacity-50">→</span>
          <input v-model="c.toType" placeholder="date"
            class="flex-1 rounded-md border bg-background px-2 py-1 text-xs outline-none" />
        </div>
      </div>
    </div>

    <div>
      <p class="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">New Field / Expression</p>
      <textarea v-model="newFieldExpr" placeholder="e.g. fullName = firstName + ' ' + lastName" rows="2"
        class="w-full rounded-md border bg-background px-3 py-1.5 text-xs outline-none focus:ring-2 focus:ring-ring" />
    </div>
  </div>
</template>
```

- [ ] **Step 3: Create DestinationInspector**

```vue
<!-- src/components/workflow/inspector/DestinationInspector.vue -->
<script setup lang="ts">
import { ref } from 'vue'
import type { BuilderNodeData } from '@/stores/builder'

defineProps<{ data: BuilderNodeData }>()

const connectorInstance = ref('')
const targetObject = ref('')
const writeMode = ref('upsert')
const matchKey = ref('')
const onError = ref('skip')
</script>

<template>
  <div class="space-y-4 p-4">
    <div>
      <p class="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Connection</p>
      <input v-model="connectorInstance" placeholder="🔑 Connector instance"
        class="w-full rounded-md border bg-background px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-ring" />
    </div>

    <div>
      <p class="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Target Object</p>
      <input v-model="targetObject" placeholder="e.g. Contact, Lead, Account"
        class="w-full rounded-md border bg-background px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-ring" />
    </div>

    <div>
      <p class="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Write Mode</p>
      <div class="flex gap-2">
        <label v-for="mode in ['upsert', 'append', 'replace']" :key="mode"
          class="flex flex-1 cursor-pointer items-center justify-center rounded-md border px-2 py-1.5 text-xs font-medium"
          :class="writeMode === mode ? 'border-foreground bg-muted' : ''">
          <input v-model="writeMode" type="radio" :value="mode" class="sr-only" />
          {{ mode }}
        </label>
      </div>
    </div>

    <div>
      <p class="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Match Key (dedup)</p>
      <input v-model="matchKey" placeholder="e.g. email, externalId"
        class="w-full rounded-md border bg-background px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-ring" />
    </div>

    <div>
      <p class="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">On Error</p>
      <div class="flex gap-2">
        <label v-for="opt in ['skip', 'fail', 'retry']" :key="opt"
          class="flex flex-1 cursor-pointer items-center justify-center rounded-md border px-2 py-1.5 text-xs font-medium"
          :class="onError === opt ? 'border-foreground bg-muted' : ''">
          <input v-model="onError" type="radio" :value="opt" class="sr-only" />
          {{ opt }}
        </label>
      </div>
    </div>
  </div>
</template>
```

- [ ] **Step 4: Create ControlInspector**

```vue
<!-- src/components/workflow/inspector/ControlInspector.vue -->
<script setup lang="ts">
import { ref } from 'vue'
import type { BuilderNodeData } from '@/stores/builder'

defineProps<{ data: BuilderNodeData }>()

const controlType = ref('branch')
const condition = ref('')
const truePath = ref('next node')
const falsePath = ref('error handler')
const maxAttempts = ref(3)
const backoffSeconds = ref(30)

const controlTypes = ['branch', 'wait', 'retry', 'merge', 'filter']
</script>

<template>
  <div class="space-y-4 p-4">
    <div>
      <p class="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Control Type</p>
      <select v-model="controlType"
        class="w-full rounded-md border bg-background px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-ring">
        <option v-for="t in controlTypes" :key="t" :value="t">{{ t }}</option>
      </select>
    </div>

    <div>
      <p class="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Condition</p>
      <input v-model="condition" placeholder="e.g. status == 'active'"
        class="w-full rounded-md border bg-background px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-ring" />
    </div>

    <div>
      <p class="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Branches</p>
      <div class="space-y-1.5">
        <div class="flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm">
          <span class="text-green-600">✓ True</span>
          <span class="mx-1 text-muted-foreground">→</span>
          <input v-model="truePath" class="flex-1 bg-transparent text-sm outline-none" />
        </div>
        <div class="flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm">
          <span class="text-red-500">✗ False</span>
          <span class="mx-1 text-muted-foreground">→</span>
          <input v-model="falsePath" class="flex-1 bg-transparent text-sm outline-none" />
        </div>
      </div>
    </div>

    <div>
      <p class="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Retry Policy</p>
      <div class="flex gap-2">
        <div class="flex-1">
          <label class="mb-1 block text-xs text-muted-foreground">Max attempts</label>
          <input v-model.number="maxAttempts" type="number" min="1" max="10"
            class="w-full rounded-md border bg-background px-3 py-1.5 text-sm outline-none" />
        </div>
        <div class="flex-1">
          <label class="mb-1 block text-xs text-muted-foreground">Backoff (s)</label>
          <input v-model.number="backoffSeconds" type="number" min="0"
            class="w-full rounded-md border bg-background px-3 py-1.5 text-sm outline-none" />
        </div>
      </div>
    </div>
  </div>
</template>
```

- [ ] **Step 5: Replace NodeConfigPanel with NodeInspector dispatch**

Replace the entire contents of `src/components/workflow/NodeConfigPanel.vue`:

```vue
<!-- src/components/workflow/NodeConfigPanel.vue -->
<script setup lang="ts">
import { computed } from 'vue'
import { X } from 'lucide-vue-next'
import { useBuilderStore } from '@/stores/builder'
import SourceInspector from './inspector/SourceInspector.vue'
import TransformInspector from './inspector/TransformInspector.vue'
import DestinationInspector from './inspector/DestinationInspector.vue'
import ControlInspector from './inspector/ControlInspector.vue'

const store = useBuilderStore()
const node = computed(() => store.selectedNode)

const nodeColor: Record<string, string> = {
  'connector.source': 'bg-blue-500',
  'connector.destination': 'bg-green-500',
  'transform.map': 'bg-amber-500',
  'logic.branch': 'bg-purple-500',
  trigger: 'bg-blue-500',
}

const nodeLabel: Record<string, string> = {
  'connector.source': 'Source',
  'connector.destination': 'Destination',
  'transform.map': 'Transform',
  'logic.branch': 'Control',
  trigger: 'Trigger',
}

const inspectorComponent = computed(() => {
  if (!node.value) return null
  const type = node.value.data.nodeType
  if (type === 'connector.source' || type === 'trigger') return SourceInspector
  if (type === 'transform.map') return TransformInspector
  if (type === 'connector.destination') return DestinationInspector
  if (type === 'logic.branch') return ControlInspector
  return null
})
</script>

<template>
  <aside v-if="node" class="flex w-80 flex-shrink-0 flex-col border-l bg-background">
    <!-- Header with node type color -->
    <div class="flex items-center justify-between border-b px-4 py-3">
      <div class="flex items-center gap-2">
        <span class="h-3 w-3 rounded-full" :class="nodeColor[node.data.nodeType] ?? 'bg-muted'" />
        <div>
          <p class="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            {{ nodeLabel[node.data.nodeType] ?? node.data.nodeType }}
          </p>
          <h2 class="text-sm font-semibold leading-tight">{{ node.data.label }}</h2>
        </div>
      </div>
      <button class="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
        aria-label="Close panel" @click="store.clearSelection()">
        <X class="h-4 w-4" />
      </button>
    </div>

    <!-- Context-sensitive inspector -->
    <div class="flex-1 overflow-y-auto">
      <component :is="inspectorComponent" v-if="inspectorComponent" :data="node.data" />
      <p v-else class="p-4 text-sm text-muted-foreground">No inspector available for this node type.</p>
    </div>
  </aside>
</template>
```

- [ ] **Step 6: Commit**

```bash
git add src/components/workflow/inspector/ src/components/workflow/NodeConfigPanel.vue
git commit -m "feat(builder): replace generic config panel with context-sensitive NodeInspector"
```

---

## Task 9: Node color coding and visible handles

**Files:**
- Modify: `src/components/workflow/nodes/SourceNode.vue`
- Modify: `src/components/workflow/nodes/TransformNode.vue`
- Modify: `src/components/workflow/nodes/DestinationNode.vue`
- Modify: `src/components/workflow/nodes/LogicNode.vue`

- [ ] **Step 1: Update SourceNode (blue) — add input handle visibility**

Replace the `<Handle>` in `src/components/workflow/nodes/SourceNode.vue` with always-visible handles:

```vue
<!-- src/components/workflow/nodes/SourceNode.vue -->
<script setup lang="ts">
import { Handle, Position } from '@vue-flow/core'
import { ArrowRightFromLine } from 'lucide-vue-next'
import type { BuilderNodeData } from '@/stores/builder'

const props = defineProps<{ data: BuilderNodeData; selected: boolean }>()
</script>

<template>
  <div
    class="relative flex min-w-[200px] overflow-visible rounded-lg border bg-white shadow-sm transition-all"
    :class="{
      'border-blue-500 shadow-blue-100 shadow-md ring-2 ring-blue-500/20': props.selected,
      'border-gray-200': !props.selected && props.data.status === 'pending',
      'border-blue-400': !props.selected && props.data.status === 'running',
      'border-green-500': !props.selected && props.data.status === 'success',
      'border-red-500': !props.selected && props.data.status === 'failed',
    }"
  >
    <Handle
      type="source"
      :position="Position.Right"
      class="!h-3 !w-3 !border-2 !border-blue-400 !bg-white opacity-0 transition-opacity group-hover:opacity-100 hover:!opacity-100"
    />
    <div class="flex w-12 flex-shrink-0 items-center justify-center rounded-l-lg bg-blue-500 py-3">
      <ArrowRightFromLine class="h-5 w-5 text-white" />
    </div>
    <div class="flex flex-1 flex-col justify-center px-3 py-2.5">
      <div class="text-[10px] font-semibold uppercase tracking-widest text-gray-400">Source</div>
      <div class="mt-0.5 text-sm font-semibold leading-tight text-gray-800">{{ props.data.label }}</div>
    </div>
    <div v-if="props.data.status !== 'pending'"
      class="absolute -right-1 -top-1 h-3 w-3 rounded-full border-2 border-white"
      :class="{
        'animate-pulse bg-blue-500': props.data.status === 'running',
        'bg-green-500': props.data.status === 'success',
        'bg-red-500': props.data.status === 'failed',
      }" />
  </div>
</template>
```

- [ ] **Step 2: Update TransformNode (amber)**

Replace `src/components/workflow/nodes/TransformNode.vue` contents with the same structure, using `bg-amber-500` for the icon strip and `border-amber-500` for selection, and label "Transform":

```vue
<!-- src/components/workflow/nodes/TransformNode.vue -->
<script setup lang="ts">
import { Handle, Position } from '@vue-flow/core'
import { ArrowLeftRight } from 'lucide-vue-next'
import type { BuilderNodeData } from '@/stores/builder'

const props = defineProps<{ data: BuilderNodeData; selected: boolean }>()
</script>

<template>
  <div
    class="relative flex min-w-[200px] overflow-visible rounded-lg border bg-white shadow-sm transition-all"
    :class="{
      'border-amber-500 shadow-amber-100 shadow-md ring-2 ring-amber-500/20': props.selected,
      'border-gray-200': !props.selected && props.data.status === 'pending',
      'border-amber-400': !props.selected && props.data.status === 'running',
      'border-green-500': !props.selected && props.data.status === 'success',
      'border-red-500': !props.selected && props.data.status === 'failed',
    }"
  >
    <Handle type="target" :position="Position.Left"
      class="!h-3 !w-3 !border-2 !border-amber-400 !bg-white opacity-60 hover:!opacity-100" />
    <Handle type="source" :position="Position.Right"
      class="!h-3 !w-3 !border-2 !border-amber-400 !bg-white opacity-60 hover:!opacity-100" />
    <div class="flex w-12 flex-shrink-0 items-center justify-center rounded-l-lg bg-amber-500 py-3">
      <ArrowLeftRight class="h-5 w-5 text-white" />
    </div>
    <div class="flex flex-1 flex-col justify-center px-3 py-2.5">
      <div class="text-[10px] font-semibold uppercase tracking-widest text-gray-400">Transform</div>
      <div class="mt-0.5 text-sm font-semibold leading-tight text-gray-800">{{ props.data.label }}</div>
    </div>
    <div v-if="props.data.status !== 'pending'"
      class="absolute -right-1 -top-1 h-3 w-3 rounded-full border-2 border-white"
      :class="{
        'animate-pulse bg-amber-500': props.data.status === 'running',
        'bg-green-500': props.data.status === 'success',
        'bg-red-500': props.data.status === 'failed',
      }" />
  </div>
</template>
```

- [ ] **Step 3: Update DestinationNode (green)**

```vue
<!-- src/components/workflow/nodes/DestinationNode.vue -->
<script setup lang="ts">
import { Handle, Position } from '@vue-flow/core'
import { ArrowRightToLine } from 'lucide-vue-next'
import type { BuilderNodeData } from '@/stores/builder'

const props = defineProps<{ data: BuilderNodeData; selected: boolean }>()
</script>

<template>
  <div
    class="relative flex min-w-[200px] overflow-visible rounded-lg border bg-white shadow-sm transition-all"
    :class="{
      'border-green-500 shadow-green-100 shadow-md ring-2 ring-green-500/20': props.selected,
      'border-gray-200': !props.selected && props.data.status === 'pending',
      'border-green-400': !props.selected && props.data.status === 'running',
      'border-green-600': !props.selected && props.data.status === 'success',
      'border-red-500': !props.selected && props.data.status === 'failed',
    }"
  >
    <Handle type="target" :position="Position.Left"
      class="!h-3 !w-3 !border-2 !border-green-400 !bg-white opacity-60 hover:!opacity-100" />
    <div class="flex w-12 flex-shrink-0 items-center justify-center rounded-l-lg bg-green-500 py-3">
      <ArrowRightToLine class="h-5 w-5 text-white" />
    </div>
    <div class="flex flex-1 flex-col justify-center px-3 py-2.5">
      <div class="text-[10px] font-semibold uppercase tracking-widest text-gray-400">Destination</div>
      <div class="mt-0.5 text-sm font-semibold leading-tight text-gray-800">{{ props.data.label }}</div>
    </div>
    <div v-if="props.data.status !== 'pending'"
      class="absolute -right-1 -top-1 h-3 w-3 rounded-full border-2 border-white"
      :class="{
        'animate-pulse bg-green-400': props.data.status === 'running',
        'bg-green-600': props.data.status === 'success',
        'bg-red-500': props.data.status === 'failed',
      }" />
  </div>
</template>
```

- [ ] **Step 4: Update LogicNode (purple)**

```vue
<!-- src/components/workflow/nodes/LogicNode.vue -->
<script setup lang="ts">
import { Handle, Position } from '@vue-flow/core'
import { GitBranch } from 'lucide-vue-next'
import type { BuilderNodeData } from '@/stores/builder'

const props = defineProps<{ data: BuilderNodeData; selected: boolean }>()
</script>

<template>
  <div
    class="relative flex min-w-[200px] overflow-visible rounded-lg border bg-white shadow-sm transition-all"
    :class="{
      'border-purple-500 shadow-purple-100 shadow-md ring-2 ring-purple-500/20': props.selected,
      'border-gray-200': !props.selected && props.data.status === 'pending',
      'border-purple-400': !props.selected && props.data.status === 'running',
      'border-green-500': !props.selected && props.data.status === 'success',
      'border-red-500': !props.selected && props.data.status === 'failed',
    }"
  >
    <Handle type="target" :position="Position.Left"
      class="!h-3 !w-3 !border-2 !border-purple-400 !bg-white opacity-60 hover:!opacity-100" />
    <Handle type="source" :position="Position.Right" id="true"
      class="!h-3 !w-3 !border-2 !border-purple-400 !bg-white opacity-60 hover:!opacity-100" style="top: 30%" />
    <Handle type="source" :position="Position.Right" id="false"
      class="!h-3 !w-3 !border-2 !border-purple-400 !bg-white opacity-60 hover:!opacity-100" style="top: 70%" />
    <div class="flex w-12 flex-shrink-0 items-center justify-center rounded-l-lg bg-purple-500 py-3">
      <GitBranch class="h-5 w-5 text-white" />
    </div>
    <div class="flex flex-1 flex-col justify-center px-3 py-2.5">
      <div class="text-[10px] font-semibold uppercase tracking-widest text-gray-400">Control</div>
      <div class="mt-0.5 text-sm font-semibold leading-tight text-gray-800">{{ props.data.label }}</div>
    </div>
  </div>
</template>
```

- [ ] **Step 5: Run all tests to verify nothing broke**

```bash
cd apps/web && npm test
```
Expected: all existing tests still pass.

- [ ] **Step 6: Commit**

```bash
git add src/components/workflow/nodes/
git commit -m "feat(builder): color-coded nodes (blue/amber/green/purple) with visible handles"
```

---

## Task 10: Wave 1 verification

- [ ] **Step 1: Start dev server and verify the full login → onboarding → dashboard flow**

```bash
cd apps/web && npm run dev
```

Open http://localhost:5173. Verify:
1. `/` redirects to `/auth/login` (not authenticated)
2. Login with any email/password → redirects to `/onboarding`
3. Complete step 1 (org name required) → steps 2–4 skippable
4. Finishing onboarding → `/dashboard`
5. Sidebar shows BUILD / OPERATE / ECOSYSTEM / PLATFORM groups
6. Navigate to a workflow → open builder → click a node → inspector panel shows type-specific fields
7. Source node shows blue strip + host/port/database fields
8. Transform node shows amber strip + field mappings
9. Destination node shows green strip + write mode
10. LogicNode shows purple strip + branching fields

- [ ] **Step 2: Run full test suite**

```bash
cd apps/web && npm test
```
Expected: all tests pass.

- [ ] **Step 3: Final Wave 1 commit**

```bash
git add -A
git commit -m "feat: Wave 1 complete — auth, onboarding, builder UX with node inspector"
```
