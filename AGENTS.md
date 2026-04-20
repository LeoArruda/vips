# AGENTS.md

## Purpose

This file defines how coding agents should work in this repository.

The project is a **Modern Visual Integration Operating System** built to let users visually design, run, and operate integration workflows with flexible deployment models, strong observability, and a pluggable ecosystem of connectors and workflow nodes.

Agents working in this repository must optimize for:
- product coherence
- architectural clarity
- maintainability
- extensibility
- production-readiness
- developer ergonomics
- strong user experience

This file is intentionally opinionated.

## 1. Product Context

This product is not only an ETL tool and not only a workflow builder.

It combines:
- visual workflow orchestration
- connector-based integrations
- decoupled execution runtime
- multi-tenant SaaS controls
- hybrid and dedicated deployment support
- observability and governance
- future ecosystem and marketplace support

Every contribution should reinforce this platform direction.

## 2. Primary Repository Goals

Agents should help implement a system that:
- allows workflows to be designed visually
- stores workflows as backend-managed graph definitions
- executes workflows reliably through a runtime engine
- supports connector and node extensibility
- separates control plane concerns from execution plane concerns
- can evolve into a marketplace and embedded integration platform

When in doubt, preserve architectural separation and product flexibility.

## 3. General Agent Behavior

### 3.1 Think in Systems
Do not implement isolated features without understanding where they fit in the product.

### 3.2 Respect Layer Boundaries
Keep frontend, control plane, execution runtime, and extension systems decoupled.

### 3.3 Prefer Explicit Contracts
Use typed interfaces, schema validation, and documented payload shapes.

### 3.4 Optimize for Maintainability
Choose patterns that future contributors can understand and safely extend.

### 3.5 Avoid Premature Complexity
Do not introduce infrastructure or abstractions that do not yet support a real need.

### 3.6 But Do Not Paint the Product Into a Corner
Simple first implementations are welcome, but not if they block hybrid execution, connector extensibility, or workflow versioning later.

## 4. Source of Truth Rules

### 4.1 Vision.md
Use [`Vision.md`](./Vision.md) to understand product direction, target users, differentiators, and product principles.

### 4.2 Architecture.md
Use [`Architecture.md`](./Architecture.md) to understand system boundaries, runtime design, and implementation guardrails.

### 4.3 PRD.md
When available later, use the PRD for detailed product requirements and prioritization.

### 4.4 This File
Use [`AGENTS.md`](./AGENTS.md) to guide implementation behavior, collaboration style, and code quality expectations.

If files conflict:
1. PRD defines immediate product requirements
2. Architecture defines technical boundaries
3. Vision defines strategic direction
4. AGENTS defines implementation behavior

If conflict remains unresolved, prefer the decision that preserves long-term product flexibility.

## 5. Expected Agent Roles

A single agent may cover multiple roles, but the work should still reflect these concerns.

### 5.1 Product-Aware Agent
- understands why a feature exists
- preserves user value and business intent

### 5.2 Frontend Agent
- builds modern, clean, maintainable Vue 3 interfaces
- treats the workflow studio as a core product surface

### 5.3 Backend / Control Plane Agent
- designs clear APIs
- maintains strong domain boundaries
- treats workflow definitions and versions as first-class entities

### 5.4 Runtime / Execution Agent
- focuses on reliability, isolation, retries, and observability
- treats execution as a production-grade system, not a demo layer

### 5.5 Platform / Extension Agent
- enables connectors, nodes, marketplace assets, and SDKs to evolve cleanly

## 6. Mandatory Architectural Rules

Agents must follow these rules.

### Rule 1: Do Not Tie Workflow Behaviour to Frontend State
The Vue canvas is an editor, not the runtime truth.

### Rule 2: Workflows Must Be Stored as Versioned Definitions
Do not treat workflows as ad hoc JSON blobs without lifecycle semantics.

### Rule 3: Connectors Must Be Pluggable
Do not hard-code external systems into the product in ways that block future connector packaging or marketplace behaviour.

### Rule 4: Execution Must Remain Decoupled
Do not assume jobs always run in the same process or infrastructure as the control plane.

### Rule 5: Secrets Must Be Handled as Sensitive Infrastructure Data
Never casually pass secret values through logs, UI state, or unsafe debug paths.

### Rule 6: Observability Is Part of the Product
Execution without logs, status transitions, and traceable errors is incomplete.

### Rule 7: Favor Typed Boundaries
Use clear schemas for API payloads, workflow definitions, node configs, and connector metadata.

## 7. Frontend Guidance

### Frontend Goals
- premium SaaS feel
- fast and clear workflow editing
- predictable state management
- reusable design system patterns
- strong form and validation behaviour

### Frontend Expectations
- use Vue 3 and TypeScript
- keep components focused and composable
- separate visual rendering from domain logic
- treat the workflow canvas as one module, not the whole app
- use backend-derived schemas where possible for dynamic configuration UIs

### Frontend Anti-Patterns
- business logic hidden inside view components
- connector-specific hacks in generic workflow UI
- oversized “god components” for the workflow studio
- implicit state coupling between unrelated modules

### Frontend mockups
- low-fi wireframe examples page [page](./UI/mockup/VipsOS%20Wireframes%20—%20all.html)
- mid-fi wireframe examples index [page](./UI/mockup/index.html)

## 8. Backend / Control Plane Guidance

### Backend Goals
- stable contracts
- clear domains
- secure multi-tenant behaviour
- version-aware workflow management
- orchestrator-friendly APIs

### Backend Expectations
- model domains explicitly
- validate inputs at the boundary
- treat workflows, connectors, runs, users, and secrets as distinct concepts
- build APIs that can support UI, CLI, and future SDK usage

### Backend Anti-Patterns
- mixing orchestration logic into generic CRUD handlers
- skipping validation because the frontend already validates
- embedding deployment-specific assumptions into core domain models

## 9. Runtime / Worker Guidance

### Runtime Goals
- reliability
- repeatability
- fault tolerance
- observable execution
- safe parallelism

### Runtime Expectations
- handle retries and timeouts explicitly
- emit structured events
- preserve execution context cleanly
- isolate tenant or workflow runtime concerns appropriately
- support remote execution registration patterns over time

### Runtime Anti-Patterns
- silent failures
- inconsistent log formats
- hidden side effects in node execution
- execution behaviour dependent on frontend-specific assumptions

## 10. Connector and Extension Guidance

### Extension Goals
- fast connector creation
- safe execution
- future marketplace readiness
- consistent developer experience

### Expectations
- define connector metadata clearly
- standardize capability contracts
- isolate connector packages from core platform code where possible
- plan for versioning and certification even if not fully implemented yet

### Anti-Patterns
- connector-specific logic leaking into core runtime paths
- no clear distinction between source, destination, and utility nodes
- weak typing of connector configuration and outputs

## 11. Workflow Design Guidance

Agents implementing workflow features should preserve these principles:
- workflows are graphs
- nodes and edges are explicit
- node configuration is schema-driven
- runtime semantics are backend-defined
- versions matter
- publish state matters
- validation should happen both client-side and server-side

Do not implement workflow editing in a way that makes import/export, templates, or future AI generation harder.

## 12. Repository Structure Guidance

The exact structure may evolve, but agents should push the codebase toward clear module ownership.

Recommended high-level areas:
- `apps/web` or equivalent for Vue frontend
- `services/control-plane` for core APIs and domain services
- `services/runtime` for execution workers/orchestrator runtime
- `packages/workflow-schema` for shared workflow types and validation
- `packages/connector-sdk` for extension development
- `packages/ui` for shared components/design system
- `packages/shared` for stable shared utilities only

Do not create a shared package just to avoid imports. Shared code must have a true cross-boundary purpose.

## 13. Coding Standards

### General
- prefer readability over cleverness
- keep functions and classes focused
- write code that can be safely extended
- use strong typing
- add comments only where intent is not obvious
- prefer to follow software design patterns

### Validation
- validate all external inputs
- validate workflow definitions at the domain boundary
- validate connector configs against explicit schemas

### Errors
- return useful errors
- preserve diagnostic context
- avoid vague catch-all failures

### Logging
- prefer structured logging
- include correlation and run identifiers where relevant
- never log secrets

## 14. Testing Expectations

Agents should produce code that is testable and, where feasible, add tests proportional to the change.

### Expected Test Types
- unit tests for domain logic
- integration tests for API boundaries
- schema validation tests
- runtime execution tests for workflow behavior
- frontend component tests for critical UI behavior

### High-Priority Test Areas
- workflow validation
- run orchestration
- connector execution contracts
- secrets handling
- permissions and access control

## 15. Documentation Expectations

When adding meaningful capabilities, agents should also update relevant documentation.

Examples:
- update architecture notes when changing system boundaries
- document workflow schema changes
- document new connector contracts
- explain operational assumptions where needed

Code should not silently redefine the architecture.

## 16. Delivery Style

When asked to implement or propose changes, agents should:
1. identify the layer being changed
2. explain trade-offs when they matter
3. keep changes scoped
4. avoid unnecessary rewrites
5. preserve future extensibility

When requirements are incomplete, choose the option that best aligns with:
- versioned workflows
- decoupled execution
- extension readiness
- multi-tenant SaaS safety

## 17. Preferred Early Priorities

Agents should bias early work toward these foundations:
- workflow schema and versioning model
- workflow studio fundamentals
- orchestration coordinator basics
- execution worker contract
- connector metadata model
- logs and run history
- auth and workspace boundaries

Do not over-prioritize cosmetic marketplace features before runtime trust exists.

## 18. Non-Goals for Early Implementation

Avoid prematurely building:
- a huge connector catalog without maintainability strategy
- AI-generated workflow features before workflow contracts are stable
- over-engineered micro-services where modules would do
- deep enterprise customizations before core product flow is solid
- fully generalized plugin systems with no real consumers

## 19. Decision Heuristics

When an agent faces multiple valid implementation options, prefer the one that:
1. keeps the architecture modular
2. preserves backend ownership of workflow semantics
3. improves observability
4. is easier to extend into hybrid execution
5. keeps UI clean and responsive
6. avoids hidden coupling

## 20. Final Instruction to Agents

Build this repository like a platform that may grow into a serious product company, not a prototype that happens to work.
Favour clear contracts, durable architecture, modern UX, and operational trust.