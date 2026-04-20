# Architecture.md

## 1. Purpose

This document defines the target architecture for the **Modern Visual Integration Operating System**.

It describes the major system components, their responsibilities, design principles, and recommended implementation boundaries. It is intentionally product-aware and implementation-oriented, but not yet a low-level engineering specification.

---

## 2. Architectural Goals

The architecture must support:
- visual workflow authoring
- reliable, scalable workflow execution
- decoupled control plane and data plane
- extensible connectors and workflow nodes
- multi-tenant SaaS operations
- dedicated and self-hosted execution models
- strong observability and governance
- future ecosystem growth through marketplace capabilities

---

## 3. High-Level Architecture

The system should be composed of five major layers:

1. **Frontend Application**
2. **Control Plane Services**
3. **Execution Plane / Worker Runtime**
4. **Extension Layer (Connectors, Nodes, Marketplace Assets)**
5. **Shared Platform Services**

At a high level:

```text
Vue 3 Frontend
    |
    v
Control Plane APIs
    |
    +--> Metadata, Auth, Billing, Secrets, Workflow Registry
    |
    +--> Scheduler / Orchestration Coordinator
    |
    v
Execution Plane / Workers
    |
    +--> Connectors
    +--> Transform Steps
    +--> Custom Logic Nodes
    |
    v
External Systems / SaaS APIs / Databases / Destinations
```

The control plane manages product state and orchestration intent.
The execution plane runs the work.

---

## 4. Core Architectural Principle

### Control Plane and Data Plane Separation

This is the defining system principle.

The product must separate:
- **Control Plane**: user experience, workflow definitions, metadata, configuration, scheduling, policy, observability coordination
- **Data Plane / Execution Plane**: actual connector execution, data transfer, transformation, and runtime processing

Benefits:
- supports shared SaaS mode
- supports customer-hosted workers
- improves enterprise adoption
- limits blast radius
- enables scalable runtime isolation

This separation should be present from the beginning, even if the earliest deployment is simple.

---

## 5. Frontend Architecture

### Recommended Stack
- Vue 3
- TypeScript
- Vite
- Pinia
- Vue Router
- Vue Flow for workflow canvas
- Component library selected for long-term theming and consistency

### Frontend Modules

#### 5.1 Application Shell
- navigation
- workspace switching
- environment switching
- command/search palette
- notifications
- user settings

#### 5.2 Workflow Studio
- node canvas
- drag and drop node placement
- edge connection handling
- validation feedback
- right-side property panel
- bottom run/log panel
- top actions: save, validate, publish, run

#### 5.3 Connector Management UI
- connector catalog
- installed connectors
- connection setup flows
- auth forms
- connector health and version status

#### 5.4 Execution Monitoring UI
- run history
- live workflow execution view
- per-node logs
- alerts and failure summaries
- replay / rerun controls

#### 5.5 Admin and Governance UI
- users and roles
- secrets references
- environments
- audit logs
- usage and billing
- marketplace management

### Frontend Design Rule
The frontend is an **authoring and operating surface**, not the source of truth for workflow behavior. Workflow definitions must be stored and validated by the backend.

---

## 6. Workflow Model

### Workflow Representation
A workflow must be represented as a backend-managed graph definition, not as raw frontend state.

Recommended model:
- workflow metadata
- workflow version
- nodes
- edges
- node configuration payloads
- validation state
- retry policies
- trigger definitions
- secrets references
- execution options

### Why This Matters
This allows:
- versioning
- validation independent of UI
- import/export
- API-driven workflow creation
- future YAML/JSON editing
- future AI-generated workflows
- clean runtime interpretation

### Suggested Conceptual Shape

```json
{
  "workflowId": "wf_123",
  "version": 3,
  "status": "draft",
  "trigger": {
    "type": "schedule",
    "cron": "0 * * * *"
  },
  "nodes": [
    {
      "id": "source_1",
      "type": "connector.source",
      "config": {}
    },
    {
      "id": "transform_1",
      "type": "transform.map",
      "config": {}
    },
    {
      "id": "dest_1",
      "type": "connector.destination",
      "config": {}
    }
  ],
  "edges": [
    { "source": "source_1", "target": "transform_1" },
    { "source": "transform_1", "target": "dest_1" }
  ]
}
```

This is illustrative only. Final schema can evolve.

---

## 7. Control Plane Architecture

The control plane owns platform coordination and product state.

### Recommended Responsibilities
- authentication and authorization
- tenant and workspace management
- workflow definitions and version registry
- connector registry metadata
- scheduling and orchestration intent
- secrets metadata and references
- environment and deployment configuration
- billing and usage tracking
- audit events
- marketplace catalog management
- API surface for frontend and SDKs

### Recommended Service Domains

#### 7.1 Identity and Access Service
- users
- organizations
- workspaces
- roles
- SSO integration later

#### 7.2 Workflow Registry Service
- workflow CRUD
- validation lifecycle
- version history
- draft / published states
- template derivation

#### 7.3 Orchestration Coordinator
- accepts run requests
- resolves workflow version
- builds execution plan
- dispatches work to runtime
- tracks run state

#### 7.4 Connector Registry Service
- connector metadata
- versions
- certifications
- compatibility records
- installation rules

#### 7.5 Marketplace Service
- publishable assets
- listings
- subscription or monetization metadata
- trust and review indicators

#### 7.6 Billing and Usage Service
- metering
- plan limits
- entitlement checks
- usage reporting

---

## 8. Execution Plane Architecture

The execution plane is where workflows actually run.

### Recommended Runtime Goals
- safe parallel execution
- clear task isolation
- retry support
- checkpointing where needed
- event streaming back to control plane
- support for tenant isolation and deployment isolation

### Recommended Core Components

#### 8.1 Scheduler / Dispatch Worker
- receives execution requests
- assigns jobs to execution workers
- manages concurrency and queueing

#### 8.2 Execution Worker
- executes node logic
- resolves dependencies
- streams logs and metrics
- reports state transitions

#### 8.3 Step Runtime
- standardized wrapper for node execution
- handles input/output contracts
- enforces retries, timeouts, and failure policies

#### 8.4 Connector Runtime
- loads connector packages
- executes connector operations
- handles schema discovery, incremental state, pagination, and data movement

#### 8.5 State Store / Checkpoint Layer
- stores cursor positions
- stores sync state
- supports resumability where applicable

### Suggested Technology Direction
- Rust for execution-heavy worker/runtime services
- queue/event layer for dispatch and state propagation
- containerized workers for isolation and portability

---

## 9. Connector Architecture

### Connector Types
The system should support:
- SaaS API source connectors
- SaaS API destination connectors
- database connectors
- file storage connectors
- webhook/event connectors
- custom internal connectors

### Connector Contract
Each connector should expose a standard capability model where applicable:
- authentication requirements
- connection test
- schema discovery
- extraction or write capabilities
- pagination strategy
- incremental sync support
- error surface contract

### Connector Packaging
Connectors should be versioned packages with metadata and validation rules.

### Connector Safety
The platform should support:
- sandboxing
- permission boundaries
- execution limits
- certification workflows
- signature or trust metadata later

---

## 10. Node System Architecture

Not every node is a connector.

The workflow studio should support multiple node families:
- trigger nodes
- connector nodes
- transform nodes
- logic nodes
- control flow nodes
- notification nodes
- custom code nodes
- manual approval nodes later

### Node Contract
Every node should define:
- node type
- input contract
- output contract
- config schema
- validation rules
- runtime behavior adapter

This enables a pluggable node system rather than hard-coded frontend behavior.

---

## 11. Scheduling and Trigger Architecture

The orchestration model should support:
- manual execution
- cron scheduling
- webhook-based triggers
- dependency triggers
- event-based triggers later

Scheduling metadata belongs in the control plane.
Execution belongs in the runtime.

The scheduler must support:
- deduplication rules
- concurrency control
- missed-run handling
- idempotency strategies where required

---

## 12. Observability Architecture

Observability is a core system, not an afterthought.

### Required Telemetry Types
- workflow run events
- node state transitions
- execution logs
- error traces
- duration and throughput metrics
- worker health metrics
- connector health metrics

### Observability Outcomes
- per-run inspection
- live canvas state updates
- operational dashboards
- alerting hooks
- support/debug workflows

### Recommended Pattern
Workers emit structured runtime events.
The control plane aggregates, stores, and serves observability data to the product surfaces.

---

## 13. Secrets and Credential Architecture

Credentials must never be treated as regular workflow data.

### Required Capabilities
- encrypted at rest
- scoped per tenant / workspace / environment
- secrets referenced by workflows, not embedded directly
- rotation support
- future integration with external secret managers

### Design Rule
The frontend should reference secret objects, never own secret material after submission.

---

## 14. Multi-Tenancy Model

### Required Entities
- Organization
- Workspace
- Environment
- User
- Role
- Workflow
- Connector Installation
- Secret Reference
- Run Record

### Isolation Requirements
- metadata isolation
- execution isolation policy support
- per-tenant quotas and limits
- auditable access paths

The model should support both:
- many small SaaS tenants
- large enterprise customers with dedicated runtime boundaries

---

## 15. Deployment Models

The product must support the following deployment models over time:

### 15.1 Shared Cloud
- vendor-hosted control plane
- vendor-hosted execution plane

### 15.2 Hybrid
- vendor-hosted control plane
- customer-hosted or dedicated execution workers

### 15.3 Dedicated Hosted
- separate customer-specific deployment operated by vendor

### 15.4 Self-Hosted / Private
- customer-hosted full stack later if strategically needed

### Architectural Implication
Every runtime interaction should assume network boundaries between control plane and worker plane.

---

## 16. API Strategy

The platform should be API-first.

### API Use Cases
- frontend operations
- CLI and automation
- embedded integration experiences
- customer scripting
- partner ecosystem support

### API Capabilities
- workflow CRUD
- publish and run
- run history
- connector installation and config
- secret references
- users and roles
- marketplace asset access

The internal service architecture can evolve, but external contracts should be stable and documented.

---

## 17. Persistence Strategy

### Recommended Data Categories

#### 17.1 Relational Metadata Store
Use Postgres or equivalent for:
- tenants
- workflows
- workflow versions
- connector metadata
- billing metadata
- user and role metadata
- run records

#### 17.2 Object Storage
Use object/blob storage for:
- execution artifacts
- exported workflow bundles
- larger logs if needed
- connector package artifacts

#### 17.3 Queue / Event Backbone
Use a messaging system for:
- run dispatch
- worker events
- observability streams
- async coordination

#### 17.4 Metrics / Log Backend
Use a suitable telemetry backend for runtime observability if scale requires separation from primary relational storage.

---

## 18. Security Considerations

The system should be designed for enterprise expansion.

### Must-Have Security Capabilities
- RBAC
- encrypted credentials
- audit logs
- tenant isolation
- secure worker registration
- signed execution requests or equivalent trust mechanism
- rate limiting and API protection
- software supply chain controls for connectors later

### Design Approach
Prefer explicit trust boundaries over implicit internal access assumptions.

---

## 19. Scalability Considerations

The system should scale in three dimensions:
- number of tenants
- number of workflows and runs
- runtime workload intensity

### Architectural Levers
- horizontally scalable workers
- queue-based execution
- event-driven status propagation
- stateless control-plane APIs where possible
- per-tenant or per-deployment isolation controls

---

## 20. Recommended Build Sequence

### Phase 1
- core frontend shell
- workflow studio v1
- workflow DSL / schema
- control plane basics
- orchestration coordinator
- basic workers
- 3 to 5 connectors
- logs and run history

### Phase 2
- connector SDK
- richer node catalog
- scheduling improvements
- retry policies
- secrets management maturity
- hybrid worker support

### Phase 3
- marketplace
- connector certification pipeline
- embedded toolkit
- advanced governance
- dedicated enterprise deployment automation

---

## 21. Architecture Guardrails

These rules should guide implementation:

1. Do not couple workflow execution logic to Vue canvas state.
2. Do not hard-code connectors into frontend logic.
3. Do not assume all execution happens inside vendor infrastructure.
4. Do not treat logs and observability as optional.
5. Do not allow secret values to propagate through UI state unnecessarily.
6. Do not design the first version in a way that blocks marketplace evolution.
7. Prefer stable contracts between layers over convenience shortcuts.

---

## 22. Final Architectural Position

This system should be built as a platform with product-grade UX, not as a monolithic integration app.

The frontend is the visual operating surface.
The control plane is the governance and coordination layer.
The execution plane is the runtime trust layer.
The extension layer is the long-term moat.

That separation is what allows the product to scale from a modern SaaS tool into a serious integration operating system.
