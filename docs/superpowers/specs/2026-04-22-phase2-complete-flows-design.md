# Phase 2 — Complete Flows Design Spec

**Date:** 2026-04-22  
**Status:** Approved for implementation planning  
**Milestone:** Interactive demo (internal design review → potential customer validation)

---

## 1. Goal

Extend the vipsOS Vue app from its Phase 1 foundation (Dashboard, Workflows, Builder, Connectors, Runs) into a fully walkable interactive demo covering all major product surfaces. Every user flow documented in `UI/User-Flows.md` must have a working screen by the end of Phase 2.

---

## 2. Scope

Six areas are in scope, all to be addressed in a single unified plan (design spec + phased implementation):

| Area | Flows covered |
|------|--------------|
| Auth & Onboarding | Flow 1 |
| Operations & Observability | Monitoring, Alerts, Audit |
| Platform Administration | Flows 10–12, 14 (Environments, Secrets, Members, Billing) |
| Ecosystem & Marketplace | Flows 8–9 (Connector Builder, Marketplace) |
| Embedded Experience | Flow 13 |
| Missing Interaction Flows | Flows 4, 6, 7 + all supporting flows + failure states |

---

## 3. Approach — Three Waves

**Wave 1 — Foundations** (highest demo impact, do first)  
Fix the biggest gaps: no login, confusing builder. Every other page depends on these feeling right.

**Wave 2 — Port Existing Mockups**  
HTML wireframes already exist; this wave implements them in Vue. Low design risk, high demo completeness gain.

**Wave 3 — New Surfaces**  
Pages with no prior mockup. Require fresh implementation against this spec.

---

## 4. App Architecture Changes

### 4.1 Sidebar Navigation — Updated Groups

```
Dashboard
─────────────────
BUILD
  Workflows
  Connectors
  Templates
  Secrets
─────────────────
OPERATE
  Runs
  Monitoring
  Alerts
─────────────────
ECOSYSTEM
  Marketplace
─────────────────
PLATFORM
  Environments
  Audit
  [Settings · Members · Billing — accessible from user menu / settings area]
```

### 4.2 New Vue Routes

```
// Wave 1 — public (no auth guard)
/auth/login              → LoginView
/auth/signup             → SignUpView
/onboarding              → OnboardingView (wizard)

// Wave 2 — port existing mockups
/triggers                → TriggersView
/secrets                 → SecretsView
/members                 → MembersView
/templates               → TemplatesView
/settings                → SettingsView (tabbed)
/profile                 → ProfileView

// Wave 3 — new surfaces
/monitoring              → MonitoringView
/alerts                  → AlertsView
/environments            → EnvironmentsView
/billing                 → BillingView
/audit                   → AuditView
/marketplace             → MarketplaceView
/marketplace/:id         → MarketplaceListingView
/connectors/build        → ConnectorBuilderView
/embedded                → EmbeddedView (iframe-safe, no app shell)
```

All protected routes (everything except `/auth/*`, `/onboarding`, `/embedded`) redirect to `/auth/login` when no session exists, preserving the intended destination in a `redirect` query param.

### 4.3 New Pinia Stores

| Store | Owns |
|-------|------|
| `useAuthStore` | session, user, org, route guards |
| `useSecretsStore` | secret list, rotation state, scope |
| `useTriggersStore` | schedules, cron configs, trigger state |
| `useMonitoringStore` | active runs, error trends, worker health |
| `useEnvironmentsStore` | data planes, agent status, workflow assignments |
| `useMarketplaceStore` | listings, categories, installed state |
| `useMembersStore` | users, roles, invitations |

---

## 5. Wave 1 — Foundations

### 5.1 Auth Flow

Screen sequence for an unauthenticated user:

```
/auth/login  →  (new user) /auth/signup  →  /onboarding  →  /dashboard
                (returning user) ──────────────────────────→  /dashboard
```

**Login screen:** email + password form, SSO button (Google/SAML placeholder), link to sign up, forgot password link.  
**Sign up screen:** name, email, password, agree to terms. On submit → redirect to `/onboarding`.  
**Route guard:** `router.beforeEach` checks `useAuthStore.isAuthenticated`. Unauthenticated requests to protected routes redirect to `/auth/login` with `redirect` query param for post-login return.

### 5.2 Onboarding Wizard — 4 Steps

Step 1 is required; steps 2–4 are skippable individually.

| Step | Required | Fields |
|------|----------|--------|
| 1 — Create Organization | Yes | Org name, industry, team size (optional) |
| 2 — Create Workspace | No | Workspace name, environment label (dev/prod) |
| 3 — Invite Team | No | Email list (multi-input), role per invite, skip available |
| 4 — Connect First System | No | Top connectors grid, launches setup wizard, skip → dashboard |

On completion or skip-all: redirect to `/dashboard`.

### 5.3 Workflow Builder UX Fixes

**Problem:** Node connections are confusing; node types look identical; config panel feels disconnected; no validation feedback.

**Fixes:**

1. **Color-coded node types** — Source: blue (`#3b82f6`), Transform: amber (`#f59e0b`), Destination: green (`#22c55e`), Control: purple (`#a855f7`).
2. **Handles always visible on hover** with pulse animation; on drag, compatible target handles highlight.
3. **Edge labels** showing the data type flowing between nodes.
4. **Inline validation** — red border + tooltip on invalid connections (e.g. destination → source).
5. **Config panel header** mirrors selected node name, type badge, and color.

### 5.4 Node Inspector Panel (right-side, context-sensitive)

The builder uses a 3-column layout: Palette | Canvas | Inspector.

The Inspector panel changes based on selected node type. **Every future node type must include a defined inspector panel before implementation.**

#### Source Node (e.g. Postgres, REST API)
- Connection: host/address, port, database
- Auth: secret reference (linked from Secrets store)
- Query: table selector or SQL/query editor
- Sync: mode (full / incremental), cursor field
- Action: **Test Connection** button

#### Transform Node (e.g. Map Fields, Filter, Aggregate)
- Transform type: Map / Filter / Join / Aggregate / Split
- Field mappings: source field → destination field (add/remove rows)
- Type coercions: from type → to type (e.g. string → ISO date)
- New fields: expression / formula editor
- Computed preview of output schema

#### Destination Node (e.g. Salesforce, BigQuery)
- Connection: linked connector instance
- Target object: object type selector
- Write mode: Upsert / Append / Replace
- Match key: deduplication field
- On error: Skip / Fail / Retry

#### Control Node (e.g. Branch, Wait, Retry, Merge)
- Control type: Branch / Wait / Retry / Merge / Filter
- Condition: expression editor (field operator value)
- Branches: true path → next node, false path → error handler
- Retry policy: max attempts, backoff interval (seconds)

---

## 6. Wave 2 — Port Existing Mockups to Vue

Each item has an existing HTML wireframe in `UI/mockup/`. Implementation follows the mockup closely; deviations require a note in the PR.

| Vue View | Source Mockup | Flow |
|----------|--------------|------|
| `TriggersView` | `triggers.html` | Flow 6 — schedule workflow |
| `SecretsView` | `secrets.html` | Flow 11 — manage secrets |
| `MembersView` | `members.html` | Flow 12 — access management |
| `TemplatesView` | `templates.html` | Flow 4 — create from template |
| `RunDetailView` (refined) | `run-detail.html` | Flow 7 — debug failed run |
| `SettingsView` | `workspace-settings.html` | Settings tabbed layout |
| `ProfileView` | `profile.html` | User profile |
| `NotificationsPanel` | `notifications.html` | Notification drawer (global overlay, no route) |
| `WorkspaceSwitcher` | `workspace-switcher.html` | Workspace switcher (global overlay, no route) |
| `CommandPalette` | `command-palette.html` | Command palette (global overlay, no route — triggered by ⌘K) |

---

## 7. Wave 3 — New Surfaces

### 7.1 Monitoring / Observability

**Layout:** Three-zone dashboard.

- **Top KPI row:** Active Runs (green), Failed last 1h (red), Workers Degraded (amber)
- **Middle:** Throughput + Error Rate chart (24h sparkline) | Worker Health list (healthy / degraded / offline per worker)
- **Bottom:** Live run feed — auto-refreshing table showing workflow name, status, started at, duration

### 7.2 Environments / Data Planes

**Layout:** Card grid + detail panel.

- Each environment shown as a card: name, type (cloud managed / customer agent), worker count, health status
- Add Environment card (dashed border)
- Clicking an environment opens a slide-over panel: agent install instructions, assigned workflows list, version compatibility matrix, connectivity test button

### 7.3 Connector Builder

**Layout:** 5-step wizard (matches Flow 8).

| Step | Content |
|------|---------|
| 1 — Metadata | Name, logo upload, category, description, version |
| 2 — Auth | Auth type (OAuth2 / API key / Basic), fields config, callback URL |
| 3 — Endpoints | Action definitions (read/write), URL templates, pagination config, incremental cursor field |
| 4 — Schema | Response field mapper, sample response JSON preview, output schema editor |
| 5 — Test & Publish | Run against live API, review results, save as draft or submit for certification |

Progress is auto-saved between steps. Draft connectors appear in the Connectors catalog with a "Draft" badge.

### 7.4 Marketplace Hub

**Route:** `/marketplace` under ECOSYSTEM nav section.

**Tabs:** Connectors | Templates | Publisher Portal (partner role only)

**Search + Filter bar (always visible):**
- Full-text search across name, description, publisher
- Category filter pills: All, CRM, Databases, Cloud Storage, Marketing, Finance, Analytics, Communication (stackable with search)
- Sort dropdown: Popular / Newest / A–Z / Price
- Pricing filter: All / Free / Paid / Subscription

**Connector / Template cards:**
- Icon: real company logo fetched via Clearbit or Brandfetch by domain. Fallback: initials + brand-color avatar. Never blank.
- Name, publisher, category tag
- Pricing (per-use / monthly / free)
- Certification badge (Certified / Community / Draft)
- Install / Subscribe CTA

**Listing detail page (`/marketplace/:id`):**
Overview, screenshots, pricing tiers, reviews, version history, compatibility matrix, publisher info, install/subscribe CTA.

**Publisher Portal tab:**
Manage listings (draft / submitted / live), revenue dashboard, submit new connector or template for certification, view review feedback.

### 7.5 Alerts & Notification Rules

**Layout:** Rules list + create/edit drawer.

- Alert rules table: name, condition, threshold, destinations, status (active/paused)
- Create/edit rule: condition builder (metric + operator + value), notification destinations (Slack, email, webhook), cooldown period
- Recent incidents list with acknowledge + resolve actions

### 7.6 Billing & Usage

- Plan overview: current plan, renewal date, seat count
- Usage meters per dimension: workflow runs, data volume, active connectors, premium marketplace items
- Overage indicators with upgrade CTA
- Invoice history table

### 7.7 Audit & Activity

- Filterable table: timestamp, actor, action, resource type, resource name
- Filters: by actor, resource type, date range
- Row expand: before/after diff for configuration changes

### 7.8 Embedded Connection Experience

**Route:** `/embedded` — rendered without app shell (iframe-safe, host-brandable via query params).

Three-screen flow:
1. **Select Provider** — grid of provider logos, host product branding in header
2. **Authenticate** — OAuth redirect or API key input, permissions explanation panel
3. **Success / Error state** — connected + sync readiness confirmation, or error recovery with retry CTA

---

## 8. Supporting Flows

All of these are inline interactions within existing pages — not new routes.

| Flow | Host page | UX trigger |
|------|-----------|-----------|
| Duplicate workflow | Workflows list | Row action menu → name modal |
| Rollback version | Workflow detail → Version history | Restore button + confirm modal |
| Archive workflow | Workflows list | Row action menu → confirm |
| Pause schedule / connector | Triggers / Connector detail | Toggle in page header |
| Reconnect expired auth | Connectors list | Warning badge → re-auth wizard |
| Retry failed node / run | Run Detail inspector | Retry button on failed node |
| Compare workflow versions | Workflow detail → Version history | Select 2 versions → diff view |
| Export workflow definition | Workflows list / detail | Action menu → download JSON |
| Import / use template | Templates library | Use template → replace-placeholders wizard |
| Rotate secret | Secrets page | Bulk action → new value + confirm |
| Respond to alert incident | Alerts → Incident detail | Acknowledge + resolve actions |

---

## 9. Failure States

Each failure state must have a specific UX treatment — not a generic error message.

| Failure | UX treatment |
|---------|-------------|
| Invalid connector credentials | Inline error on connector card + re-auth CTA |
| Expired OAuth token | Warning banner on Connectors list + reconnect flow |
| Schema drift | Diff view between expected and actual schema in Run Detail |
| Node misconfiguration | Red node border + inspector highlights the invalid field |
| Unavailable worker / data plane | Degraded status banner on Monitoring + Environments |
| Failed schedule trigger | Alert with next-run prediction + manual run CTA |
| Marketplace publication rejected | Rejection reason card + edit and resubmit CTA |
| Insufficient permissions | Lock icon on resource + "Contact admin" prompt |
| Billing / quota exceeded | Usage meter at 100% + upgrade plan CTA |
| Unsupported API response in Connector Builder | Schema mismatch warning in Step 4 with raw response preview |

---

## 10. Success Criteria

Phase 2 is complete when:

- A user can enter the app from `/auth/login`, complete onboarding, and reach the dashboard in a single uninterrupted flow
- All 14 flows from `UI/User-Flows.md` have at least a happy-path screen sequence in the Vue app
- All 11 supporting flows are reachable from their host pages
- All 10 failure states render a specific error UI (not a generic fallback)
- The Marketplace shows real or fallback logos, search filters work, and a listing detail page is reachable
- The Workflow Builder shows color-coded node types, visible handles, and a context-sensitive inspector panel for all 4 node types
- The demo can be walked end-to-end for an internal design review without dead-end navigation
