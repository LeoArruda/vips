# UI Inventory — Pages, Interfaces, and User Surfaces

## 1. Purpose

This document inventories the major user-facing interfaces required by the Modern Integration Platform. It is intended to guide product design, wireframing, and future mockups.

The objective is to define all meaningful product surfaces before visual design begins.

---

## 2. Main User Roles

The platform may serve multiple roles. Pages and workflows should reflect these users.

### 2.1 Admin / Platform Owner
Responsible for billing, security, environments, workspace setup, governance, and platform policy.

### 2.2 Builder / Integrations Engineer
Creates workflows, configures connectors, monitors runs, debugs failures, and manages versions.

### 2.3 Operations User / Analyst
Runs templates, reviews outcomes, monitors health, and resolves operational exceptions.

### 2.4 Partner / Contributor
Builds connectors, publishes templates, manages marketplace listings, and reviews certification status.

### 2.5 Embedded Customer User
Connects third-party systems inside a white-labeled experience.

---

## 3. Global Product Surfaces

### 3.1 Authentication
- Sign in
- Sign up
- SSO entry
- Password reset
- MFA verification

### 3.2 Onboarding
- Welcome flow
- Create organization
- Create workspace
- Invite team members
- First connector setup
- First workflow guidance

### 3.3 App Shell
- Global sidebar
- Contextual top bar
- Search / command palette
- Notifications
- User menu
- Workspace switcher

---

## 4. Page Inventory

## 4.1 Overview / Dashboard
Purpose: Provide a high-level summary of platform health and activity.

Key modules:
- workflow health summary
- recent runs
- failed runs requiring attention
- connector usage
- worker/environment health
- marketplace or template recommendations
- usage and billing highlights

Primary users:
- admin
- builder
- operations user

---

## 4.2 Workflows List
Purpose: Show all workflows in the workspace.

Key modules:
- searchable/filterable table or card view
- workflow status
- owner
- last run
- last modified
- environment
- tags
- draft/published status

Actions:
- create workflow
- duplicate
- archive
- open builder
- run now
- export definition

---

## 4.3 Workflow Builder
Purpose: Create and edit visual workflows.

Key modules:
- node palette
- canvas
- minimap
- properties/config drawer
- validation panel
- top toolbar for save, publish, run, test
- bottom logs or execution output panel

Supporting states:
- empty builder
- draft mode
- validation errors
- live execution mode

---

## 4.4 Workflow Detail
Purpose: View workflow summary, metadata, configuration, and recent execution history.

Key modules:
- header with name, owner, status
- recent runs
- configuration summary
- version history
- linked connectors
- linked templates
- audit trail

---

## 4.5 Run Detail / Execution Inspector
Purpose: Deep inspection of a workflow run.

Key modules:
- run timeline
- node-by-node status
- logs
- inputs/outputs
- retries
- errors
- related alerts

This page is critical for trust and debugging.

---

## 4.6 Templates Library
Purpose: Accelerate workflow creation with reusable templates.

Key modules:
- categorized template gallery
- filter by use case
- preview
- install/customize flow
- popularity/recommended tags

---

## 4.7 Connectors Catalog
Purpose: Browse available connectors.

Key modules:
- search and filtering
- categories
- connector cards
- supported auth methods
- certification status
- maintained by internal/community/partner

---

## 4.8 Connector Detail
Purpose: Explain one connector and support configuration.

Key modules:
- description
- supported actions
- auth requirements
- version history
- changelog
- certification state
- documentation links
- install/setup CTA

---

## 4.9 Connector Setup Wizard
Purpose: Guide the user through authentication and configuration.

Key modules:
- stepper
- field validation
- test connection
- auth callback status
- advanced options
- save as reusable credential/resource

---

## 4.10 Connector Builder
Purpose: Let users create custom connectors.

Key modules:
- API definition area
- auth setup
- endpoint mapping
- pagination and incremental sync setup
- sample response preview
- output schema mapping
- test mode
- publish/certify actions

---

## 4.11 Marketplace Home
Purpose: Present the broader ecosystem of connectors, templates, and extensions.

Key modules:
- featured listings
- categories
- partner highlights
- trending items
- community picks
- policy and trust indicators

---

## 4.12 Marketplace Listing Detail
Purpose: Explain and install a marketplace item.

Key modules:
- overview
- screenshots or visuals
- pricing
- trust badges
- versions
- reviews
- compatibility
- publisher details

---

## 4.13 Environments / Data Planes
Purpose: Manage shared workers, remote agents, or dedicated execution planes.

Key modules:
- environment list
- health indicators
- deployment status
- region/network info
- worker capacity
- version compatibility
- sync status with control plane

---

## 4.14 Secrets & Credentials
Purpose: Manage secrets used across workflows and connectors.

Key modules:
- secret inventory
- scope and permissions
- rotation state
- environment assignment
- access history

---

## 4.15 Monitoring / Observability
Purpose: Centralize system health.

Key modules:
- active runs
- failed runs
- throughput charts
- error trends
- connector instability indicators
- worker health
- queue depth

---

## 4.16 Alerts & Notifications
Purpose: Define and review alert rules.

Key modules:
- alert rules list
- create/edit alert
- destinations (Slack, email, webhook)
- thresholds
- recent incidents

---

## 4.17 Audit & Activity
Purpose: Provide governance and traceability.

Key modules:
- audit table
- who changed what
- object type
- before/after diff access
- filtering by resource and actor

---

## 4.18 Teams & Access
Purpose: Manage users, roles, and permissions.

Key modules:
- user list
- roles matrix
- invitations
- role assignment
- custom roles if supported later

---

## 4.19 Billing & Usage
Purpose: Show costs, usage, and plan information.

Key modules:
- plan overview
- usage meters
- active premium connectors
- invoices
- seat count
- overage indicators

---

## 4.20 Settings
Purpose: Manage organization, workspace, platform, and personalization settings.

Sections:
- general
- security
- environments
- integrations
- notifications
- branding for embedded UX

---

## 4.21 Embedded Connection Experience
Purpose: White-labeled experience inside customer products.

Key modules:
- provider selection
- connect account
- connection status
- reconnect flow
- permissions explanation
- error recovery

This surface must be simpler than the full app and highly branded.

---

## 4.22 Embedded Connection Management
Purpose: Let customer users manage their connected apps.

Key modules:
- existing connections
- last sync
- status
- reconnect/disconnect
- support links

---

## 4.23 Support & Docs Surfaces
Purpose: Improve self-service and reduce support load.

Key modules:
- in-app help center entry points
- setup help panels
- connector troubleshooting panels
- contextual documentation links

---

## 5. Cross-Cutting UI Patterns

These patterns repeat across many pages:
- list + detail
- wizard / stepper
- canvas + inspector
- dashboard card grid
- empty state with guided CTA
- run log viewer
- diff viewer
- approval/confirmation modal
- search/filter/sort toolbar

---

## 6. Priority Order for Mockups

To maximize value, mockup in this order:
1. app shell
2. overview dashboard
3. workflows list
4. workflow builder
5. run detail
6. connectors catalog
7. connector setup wizard
8. monitoring page
9. environments page
10. marketplace surfaces
11. teams/access and billing
12. embedded surfaces

---

## 7. Success Criteria

This UI inventory is successful when:
- every major user goal has a clear surface
- no critical workflow depends on undefined screens
- mockups can be prioritized without ambiguity
- component patterns can be reused across multiple pages
