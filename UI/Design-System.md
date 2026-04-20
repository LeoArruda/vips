# Design System — Modern Integration Platform

## 1. Purpose

This design system defines the visual, interaction, and structural foundations for the Modern Integration Platform. Its purpose is to ensure that all product surfaces — administration, workflow building, monitoring, connector management, marketplace, embedded experiences, and enterprise controls — feel like one coherent platform.

This system is intended to support:
- high-complexity operational interfaces
- multi-tenant SaaS experiences
- visual workflow authoring
- enterprise-grade trust and clarity
- rapid product scaling without visual inconsistency

The design system must optimize for three attributes above all else:
- **clarity** for complex tasks
- **speed** for operational users
- **trust** for enterprise buyers

---

## 2. Design Principles

### 2.1 Clarity over decoration
Interfaces must explain complex workflows, connection states, and system outcomes without relying on dense text or visual noise.

### 2.2 Operational confidence
Users should always understand:
- what is configured
- what is running
- what failed
- what changed
- what action is available next

### 2.3 Progressive complexity
The UI should support both new users and expert operators. Simple paths should be visible first, while advanced controls remain accessible without overwhelming the layout.

### 2.4 System-first consistency
Patterns must repeat across all modules: forms, tables, panels, sidebars, status indicators, node properties, logs, and setup wizards.

### 2.5 Human-readable technicality
This platform is technical, but the interface should remain understandable to product managers, operations teams, analytics users, and administrators — not only engineers.

### 2.6 Visual hierarchy must do the work
Typography, spacing, and surface elevation should communicate structure so users can scan quickly.

### 2.7 Accessibility is a baseline
The design system must support keyboard navigation, clear focus states, adequate contrast, and semantic structure.

---

## 3. Brand and Product Personality

The platform should feel:
- modern
- precise
- capable
- intelligent
- calm under pressure

It should not feel:
- playful in a distracting way
- flashy or overly animated
- crowded
- dark-pattern driven
- enterprise-ugly

The emotional target is: **"powerful enough for platform teams, approachable enough for operations teams."**

---

## 4. Visual Style Direction

### 4.1 Overall style
A modern B2B product style with:
- strong use of whitespace
- high legibility
- subtle depth and separation
- restrained color usage
- crisp component edges with medium-large radius
- polished state feedback

### 4.2 Recommended visual attributes
- rounded corners: medium to large
- shadows: soft and sparse
- borders: subtle, used for structure
- icons: clean outline-first system
- motion: functional and brief
- layout density: adjustable, default medium

### 4.3 Surface model
Use layered surfaces:
- background canvas
- primary app shell
- panels/cards
- elevated overlays and dialogs
- transient states such as toasts and command menus

This is especially important in workflow-builder, logs, configuration drawers, and multi-pane screens.

---

## 5. Color System

### 5.1 Color roles
Define tokens by role, not by hard-coded use:
- background
- foreground
- surface
- surface-muted
- border
- border-strong
- primary
- primary-hover
- secondary
- accent
- success
- warning
- danger
- info
- focus-ring

### 5.2 Product behavior for color
Color must communicate system meaning:
- success = completed, healthy, verified
- warning = degraded, partial, needs attention
- danger = failed, blocked, destructive
- info = running, queued, informative state

Avoid using color alone to communicate meaning. Pair with iconography, labels, and status text.

### 5.3 Theming
Support at minimum:
- light theme
- dark theme

Future-ready support:
- custom enterprise branding for embedded surfaces
- high-contrast theme variant

---

## 6. Typography

### 6.1 Goals
Typography must support long operational sessions and dense information.

### 6.2 Recommended structure
- Display: reserved for marketing or large hero sections only
- Heading 1: page title
- Heading 2: section title
- Heading 3: subsection title
- Body: default reading text
- Body small: helper text and metadata
- Label: form labels and field headings
- Mono: logs, code, IDs, payloads, cron expressions, schema names

### 6.3 Tone
Typography should feel disciplined, not ornamental. Prioritize readability and hierarchy over brand personality.

---

## 7. Spacing and Layout System

### 7.1 Spacing model
Use a tokenized spacing scale. All paddings, gaps, margins, and panel spacing must map to system tokens.

### 7.2 Layout philosophy
The product will rely heavily on:
- app shell layout
- split-pane layout
- inspector panel layout
- builder canvas layout
- table + details layout
- wizard layout

### 7.3 Grid behavior
Use consistent responsive grid behavior across:
- dashboard cards
- settings pages
- connector galleries
- template catalogs
- workflow node panels

---

## 8. Iconography

Use a consistent icon library. Icons must be:
- recognizable at small sizes
- semantically stable
- paired with text when meaning may be ambiguous

Common icon categories:
- connectors
- auth/security
- workflow actions
- status/health
- logs/observability
- teams/governance
- marketplace

---

## 9. Motion and Interaction

### 9.1 Motion principles
Motion must explain state changes, not decorate the interface.

### 9.2 Use motion for
- panel open/close
- node selection
- drag and drop feedback
- loading transitions
- toast appearance
- validation feedback

### 9.3 Avoid
- long animations
- bouncing motion
- heavy page transitions
- ornamental motion in dense workflows

---

## 10. Core Interaction Patterns

### 10.1 Empty states
Every module must define empty states with:
- clear purpose
- explanation of value
- primary action
- optional guided setup

### 10.2 Loading states
Use skeletons where layout stability matters and spinners only for short, isolated operations.

### 10.3 Errors
Errors should explain:
- what failed
- where it failed
- likely reason
- next action

### 10.4 Success feedback
Use inline confirmation for small actions and toasts for transient confirmation. Larger operations should also update visible status regions.

### 10.5 Destructive actions
Use confirmation dialogs only for meaningful destructive actions. Prefer typed confirmation for irreversible operations.

---

## 11. Accessibility Requirements

The design system must enforce:
- WCAG-aware color contrast
- visible keyboard focus
- semantic headings
- form labels and descriptions
- accessible drag and drop alternatives where possible
- non-color status signals
- screen-reader compatible table and panel structure

Workflow builder accessibility should include keyboard selection and non-pointer ways to inspect node metadata.

---

## 12. Component Categories

### 12.1 Foundations
- color tokens
- typography tokens
- spacing tokens
- elevation tokens
- border radius tokens
- motion tokens
- z-index layering model

### 12.2 Primitives
- button
- icon button
- link
- input
- textarea
- select
- combobox
- checkbox
- radio group
- switch
- badge
- avatar
- tooltip
- divider
- tabs
- accordion
- breadcrumb

### 12.3 Composition components
- app sidebar
- top navigation
- page header
- section header
- card
- stat tile
- empty state
- search bar
- filter bar
- command palette
- table
- data grid
- properties panel
- split pane
- drawer
- modal
- stepper
- timeline
- activity feed

### 12.4 Workflow-specific components
- node card
- node port
- edge label
- minimap
- canvas toolbar
- run status overlay
- execution badge
- node config drawer
- template block
- branch editor
- validation summary panel

### 12.5 Data/ops components
- status pill
- health indicator
- log viewer
- code editor block
- JSON viewer
- diff viewer
- audit row
- schedule badge
- retry policy summary
- alert rule card

### 12.6 Marketplace and connector components
- connector card
- connector detail header
- install card
- auth method badge
- certification badge
- pricing badge
- version timeline
- rating row

---

## 13. Design Tokens

The implementation should expose tokens for:
- colors
- typography
- spacing
- radius
- border widths
- elevation
- durations
- easings
- breakpoints
- z-index levels

Tokens should be implementation-friendly for Vue 3 and compatible with Tailwind token mapping or CSS variables.

---

## 14. Navigation Model

Primary navigation should support these top-level areas:
- Home / Overview
- Workflows
- Connectors
- Templates
- Runs / Monitoring
- Marketplace
- Data Planes / Environments
- Teams & Access
- Settings
- Billing

Secondary navigation should be contextual within each module.

---

## 15. Product Areas the Design System Must Cover

The system must explicitly support all major interfaces:
- onboarding and workspace creation
- dashboard/overview
- workflow builder
- workflow detail and history
- connector setup and auth
- connector builder
- template library
- marketplace
- run monitoring and logs
- alerting
- environments and workers
- secrets management
- RBAC and audit
- billing and usage
- embedded setup pages
- admin settings

---

## 16. Recommended Documentation Set for the Design System

To be successful, the design system should be documented in layers:

### 16.1 Foundation documentation
Explain tokens, themes, typography, spacing, colors, icon style, and motion.

### 16.2 Component documentation
For each component define:
- purpose
- anatomy
- variants
- states
- spacing rules
- accessibility notes
- usage guidelines
- anti-patterns

### 16.3 Pattern documentation
Document compound patterns such as:
- setup wizards
- side-panel editing
- node configuration
- logs inspection
- confirmation flows
- table + detail page structure

### 16.4 Page blueprint documentation
Define the main pages and their reusable structure.

### 16.5 Workflow documentation
Map key end-user journeys so mockups are anchored in real work.

---

## 17. Recommended Deliverables

The design system initiative should produce:
- design principles document
- token definitions
- core component library
- page blueprints
- workflow maps
- content style guidance
- accessibility checklist
- interaction patterns guide
- embedded UI guidelines
- contributor guidance for future designers and developers

---

## 18. Success Criteria

The design system is successful when:
- new product pages can be designed faster and with less debate
- users encounter the same interaction logic across modules
- workflow builder feels coherent with admin/configuration surfaces
- engineering can implement components without ambiguity
- enterprise buyers perceive maturity and trust
- future designers can extend the system without reinventing patterns

---

## 19. Next Step Recommendation

Before producing high-fidelity screens, define:
1. foundational tokens
2. component inventory
3. page inventory
4. user flows
5. [low-fidelity](./mockup/VipsOS%20Wireframes%20—%20all.html) layouts for all major product surfaces 
6. [mid-fidelity](./mockup/index.html) for more design information.
Only then should you move into visual polish and final mockups.
