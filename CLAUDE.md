# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**vipsOS** is a **Modern Visual Integration Operating System** — a platform for visually designing, running, and operating integration workflows. It combines visual workflow orchestration, connector-based integrations, a decoupled execution runtime, multi-tenant SaaS controls, and future marketplace/ecosystem capabilities.

This is pre-implementation: the repo currently contains product, architecture, and design documentation only. No application code exists yet.

## Repository Documentation

Read these files before making any architectural decisions:

- [`Vision.md`](./Vision.md) — product direction, target users, differentiators, and product principles
- [`Architecture.md`](./Architecture.md) — system boundaries, runtime design, and implementation guardrails
- [`AGENTS.md`](./AGENTS.md) — implementation behavior, coding standards, and decision heuristics
- [`UI/UI-Inventory.md`](./UI/UI-Inventory.md) — all major UI surfaces and their modules
- [`UI/Design-System.md`](./UI/Design-System.md) — visual system, component categories, and design principles
- [`UI/User-Flows.md`](./UI/User-Flows.md) — key end-user journeys
- [`UI/mockup/index.html`](./UI/mockup/index.html) — mid-fidelity wireframes
- [`UI/mockup/VipsOS Wireframes — all.html`](<./UI/mockup/VipsOS Wireframes — all.html>) — low-fidelity wireframe overview

## Intended Tech Stack

- **Frontend**: Vue 3, TypeScript, Vite, Pinia, Vue Router, Vue Flow (workflow canvas)
- **Execution workers**: Rust (recommended for performance-critical paths)
- **Persistence**: Postgres (relational metadata), object storage (artifacts), message queue (dispatch/events)

## Recommended Monorepo Structure

The codebase should evolve toward these module boundaries:

```
apps/web                  # Vue 3 frontend
services/control-plane    # Auth, workflow registry, orchestration, billing, marketplace
services/runtime          # Execution workers, connector runtime, step runtime
packages/workflow-schema  # Shared workflow types and validation (used by both planes)
packages/connector-sdk    # Connector development framework
packages/ui               # Shared design system components
packages/shared           # Stable cross-boundary utilities only
```

## Core Architectural Principles

These are non-negotiable constraints — not preferences:

1. **Control plane / data plane separation**: workflow definitions, scheduling, and metadata live in the control plane; actual execution happens in the runtime plane. Workers must be deployable outside vendor infrastructure.
2. **Workflows are versioned backend entities**: the Vue canvas is an editor, not the source of truth. Workflow definitions are backend-managed graphs with lifecycle semantics (draft/published, version history).
3. **Connectors are pluggable packages**: never hard-code external systems into frontend or core runtime logic.
4. **Secrets are sensitive infrastructure data**: never flow through UI state, logs, or debug paths beyond initial submission.
5. **Observability is a core feature**: every workflow run must emit structured events with node-level status transitions and traceable errors.

## Build Sequence (Phase 1 Priority)

Focus early work on foundations before ecosystem features:

1. Workflow schema and versioning model (`packages/workflow-schema`)
2. Core frontend shell + workflow studio v1
3. Orchestration coordinator basics
4. Execution worker contract
5. Connector metadata model
6. Logs and run history
7. Auth and workspace boundaries

Do not prioritize marketplace features, connector breadth, or AI-generated workflows before the runtime trust layer is established.

## Key Anti-Patterns to Avoid

- Business logic inside Vue view components
- Connector-specific code in generic workflow or runtime paths
- Execution logic that assumes co-location with the control plane
- Passing secret values through workflow state or logs
- Workflows stored as ad-hoc JSON without version semantics
- Shared packages created to avoid imports rather than for true cross-boundary reuse
