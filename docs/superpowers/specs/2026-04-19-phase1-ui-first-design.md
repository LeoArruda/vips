# vipsOS — Phase 1 Build Plan: UI-First Stakeholder Demo

## Context

vipsOS is a pre-implementation project (documentation only, no code yet) building a Modern Visual Integration Operating System. The immediate goal is a compelling, interactive demo for stakeholders/investors within 3–6 weeks. The developer is working solo. Stakeholders need to see the visual experience — a polished, interactive Vue 3 app with stub data is the right call. The backend and worker runtime will be built afterward, underneath the already-validated UI.

**Approach chosen:** UI-first with mock/stub data. No backend. No workers. All data is typed TypeScript stubs that Pinia stores consume directly — swappable for real API calls later without touching components.

---

## Stack

| Layer | Choice | Notes |
|-------|--------|-------|
| Framework | Vue 3 + TypeScript | Per Architecture.md |
| Backend | Bun + TypeScript | Per Architecture.md |
| Worker | Rust | Per Architecture.md |
| Build tool | Vite | Standard for Vue 3 |
| State | Pinia | One store per domain |
| Routing | Vue Router | One route per major screen |
| Workflow canvas | Vue Flow | Centrepiece of the product |
| Component library | Shadcn/Vue + Tailwind | Headless, token-friendly, supports light/dark |
| Stub data | `src/data/*.ts` (typed TS modules) | Direct imports in Pinia stores |

**Project location:** `apps/web/` (standalone Vite project for now; monorepo extraction deferred)

---

## Screens In Scope (Demo Arc)

These 5 screens tell the complete product story in a 10-minute demo:

| Priority | Screen | Demo role |
|----------|--------|-----------|
| 1 | App Shell | Frame: sidebar, top bar, workspace switcher, routing |
| 2 | Workflow Builder | Centrepiece: Vue Flow canvas, node palette, config panel |
| 3 | Overview Dashboard | Landing: health stats, recent runs, connector usage |
| 4 | Connectors Catalog | Ecosystem: browsable grid with search/filter |
| 5 | Run Detail / Execution Inspector | Trust: per-node logs, timeline, status |

**Demo script:** Land on dashboard → open workflow builder → drag nodes → configure a connector → click Run → watch simulated execution in run inspector.

**Deferred (post-demo):** Marketplace, teams/billing, secrets management, connector builder, environments, embedded surfaces.

---

## Stub Data Structure

```
apps/web/src/
  data/
    workflows.ts     # WorkflowSummary[], WorkflowDefinition (nodes/edges per Architecture.md schema)
    connectors.ts    # ConnectorCard[], ConnectorDetail
    runs.ts          # RunRecord[], RunDetail with per-node log entries
    dashboard.ts     # DashboardStats (counts, health summary)
  stores/
    workflows.ts     # useWorkflowsStore() — reads from data/, later from API
    connectors.ts    # useConnectorsStore()
    runs.ts          # useRunsStore()
```

Workflow definition shape follows the JSON model in `Architecture.md` (workflowId, version, status, trigger, nodes[], edges[]) — stub data is already schema-compatible with the future real backend.

Vue Flow canvas will be seeded with 3–4 pre-built example workflow graphs demonstrating:
- Simple: Source → Transform → Destination
- Branching: Source → Logic node → two Destination branches
- Scheduled: Cron trigger → multi-step pipeline

---

## Build Sequence

### Week 1 — Foundation
- [ ] Scaffold `apps/web` with Vite + Vue 3 + TypeScript
- [ ] Add Tailwind CSS + Shadcn/Vue
- [ ] Add Pinia + Vue Router
- [ ] Build App Shell: sidebar navigation, top bar, workspace switcher
- [ ] Wire routing skeleton (all 5 routes, placeholder views)
- [ ] Create `src/data/` stub files with typed sample data
- [ ] Create Pinia stores wired to stub data

### Week 2 — Workflow Builder
- [ ] Integrate Vue Flow into the builder view
- [ ] Build node palette (drag source, list of available node types)
- [ ] Implement 3 node types: Source, Transform, Destination (custom node components)
- [ ] Right-side config panel / property drawer (opens on node select)
- [ ] Load 3 example workflow graphs from stub data
- [ ] Top toolbar: Save, Publish, Run buttons (Run triggers stub animation)

### Week 3 — Dashboard + Connectors
- [ ] Overview Dashboard: stat tiles, recent runs list, failed runs section, health indicators
- [ ] Connectors Catalog: searchable + filterable card grid
- [ ] Connector card component (logo, name, auth method badge, category, install CTA)
- [ ] Connector Detail page (description, supported actions, auth requirements, version)

### Week 4 — Run Inspector + Polish
- [ ] Run Detail: execution timeline, per-node status badges, log viewer component
- [ ] Simulated "run" from workflow builder: animate node status through pending → running → success
- [ ] Apply design system tokens: spacing, radius, color roles (success/warning/danger/info)
- [ ] Dark/light theme toggle
- [ ] Empty states for all major screens
- [ ] Loading skeleton states

### Week 5–6 — Buffer + Demo Prep
- [ ] Visual polish pass (typography hierarchy, icon consistency, motion on node execution)
- [ ] Responsive edge cases
- [ ] Demo script rehearsal and refinement
- [ ] Fix anything that feels rough in a walkthrough

---

## Key Architectural Rules to Maintain (Even in the Stub Phase)

From `AGENTS.md` — even though there's no real backend yet:

1. **No business logic in view components** — keep it in Pinia stores and composables
2. **Workflow canvas state ≠ workflow definition** — the Vue Flow graph is an editor; the canonical definition lives in the store (and later, the backend)
3. **Connectors are data, not hardcoded UI** — connector cards are rendered from `connectors.ts` data, not by writing a Vue component per connector
4. **No stub data leaking into component templates** — always go through the store

---

## Verification (How to Know It's Demo-Ready)

- [ ] Can navigate between all 5 screens without errors
- [ ] Can open the workflow builder, drag a node onto the canvas, connect it to another node, and open its config panel
- [ ] Can click "Run" and watch all nodes animate through a simulated execution with status transitions
- [ ] Can browse the connectors catalog, search/filter, and open a connector detail page
- [ ] Can open a run detail and see per-node logs and a timeline
- [ ] Dark mode and light mode both look polished
- [ ] No console errors during the demo flow
- [ ] The demo script (dashboard → builder → run → inspector) flows in under 10 minutes

---

## Files To Create (Phase 1)

All new — no existing code to modify.

```
apps/web/
  index.html
  vite.config.ts
  tsconfig.json
  package.json
  tailwind.config.ts
  src/
    main.ts
    App.vue
    router/index.ts
    stores/
      workflows.ts
      connectors.ts
      runs.ts
    data/
      workflows.ts
      connectors.ts
      runs.ts
      dashboard.ts
    views/
      DashboardView.vue
      WorkflowsView.vue
      WorkflowBuilderView.vue
      ConnectorsView.vue
      ConnectorDetailView.vue
      RunDetailView.vue
    components/
      layout/
        AppShell.vue
        AppSidebar.vue
        AppTopBar.vue
      workflow/
        WorkflowCanvas.vue
        NodePalette.vue
        NodeConfigPanel.vue
        nodes/
          SourceNode.vue
          TransformNode.vue
          DestinationNode.vue
      connectors/
        ConnectorCard.vue
        ConnectorGrid.vue
      runs/
        RunTimeline.vue
        RunLogViewer.vue
        NodeStatusBadge.vue
      ui/
        StatTile.vue
        EmptyState.vue
        SkeletonLoader.vue
```
