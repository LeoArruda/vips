# UX Refinement — Design Spec

**Date:** 2026-04-25
**Status:** Approved
**Scope:** Visual polish pass over the existing Phase 2 UI — layout density, color system, sidebar behavior, and typography. No new features or routes. All changes are purely presentational and apply globally across every view.

---

## 1. Problem Statement

The Phase 2 UI is functionally complete but visually rough: type is too large, padding is excessive, and the monochrome black/white palette reads as unfinished rather than modern. The sidebar has no collapse mechanism, consuming permanent horizontal space. The platform needs to feel like a premium B2B SaaS product before Phase 3 backend work begins.

---

## 2. Design Decisions

### 2.1 Layout Density — Compact & Refined

Reduce all spacing and type scales to produce an information-dense, elegant layout. Reference: Linear, Vercel dashboard.

| Token | Current (approx.) | Refined |
|---|---|---|
| Page title | `text-xl` (20px) | `15px / font-semibold` |
| Section subtitle | `text-sm` (14px) | `11.5px / text-muted-foreground` |
| KPI stat number | `text-3xl` (30px) | `22px / font-bold / tracking-tight` |
| Body / table text | `text-sm` (14px) | `11.5–12px` |
| Content area padding | `p-6` (24px) | `18px` |
| Card / panel padding | `p-4` (16px) | `11px` |
| Card gap | `gap-4` (16px) | `8px` |
| Border radius (cards) | `rounded-lg` (8px) | `7px` |
| Border radius (buttons, badges) | `rounded-md` (6px) | `5–6px` |

### 2.2 Color System — Slate + Indigo

Replace the pure black/white neutral palette with a layered slate system and indigo as the primary accent.

| Role | Token | Hex |
|---|---|---|
| Sidebar background | `--sidebar-bg` | `#0f172a` (slate-900) |
| Sidebar border | `--sidebar-border` | `#1e293b` (slate-800) |
| Sidebar text (inactive) | `--sidebar-text` | `#94a3b8` (slate-400) |
| Sidebar section label | `--sidebar-section` | `#475569` (slate-600) |
| Content background | `--content-bg` | `#f8fafc` (slate-50) |
| Card / panel background | `--card-bg` | `#ffffff` |
| Border (cards, inputs) | `--border` | `#e2e8f0` (slate-200) |
| Body text | `--text-body` | `#334155` (slate-700) |
| Heading text | `--text-heading` | `#0f172a` (slate-900) |
| Muted text | `--text-muted` | `#94a3b8` (slate-400) |
| Primary accent | `--accent` | `#6366f1` (indigo-500) |
| Primary hover | `--accent-hover` | `#4f46e5` (indigo-600) |
| Active nav item bg | `--nav-active-bg` | `#6366f1` |
| Active nav hover | `--nav-hover-bg` | `#1e293b` (slate-800) |
| Topbar background | `--topbar-bg` | `#ffffff` |
| Topbar border | `--topbar-border` | `#e2e8f0` |

Status colors are unchanged:

| Status | Color |
|---|---|
| Success / healthy | `#16a34a` (green-600) |
| Failed / danger | `#dc2626` (red-600) |
| Warning / degraded | `#d97706` (amber-600) |
| Running / info | `#2563eb` (blue-600) |

Badge backgrounds use 50-level tints of their respective status color (e.g. `#eff6ff` for running).

### 2.3 Sidebar — Collapsible with Smooth Animated Resize

The sidebar gains a toggle mechanism. Content area reflows with a CSS width transition.

**Expanded state**
- Width: `184px`
- Shows: logo, chevron toggle, section labels, icon + label nav items

**Collapsed state**
- Width: `46px`
- Shows: chevron toggle (rotated 180°), icon-only nav items
- Logo and section labels fade out (`opacity: 0`)
- Nav labels fade out (`opacity: 0`)
- Hovering any icon shows a tooltip to the right with the item label

**Transition**
```css
transition: width 0.22s cubic-bezier(0.4, 0, 0.2, 1);
```
Applied to both the sidebar and the main content area so they animate together.

**Toggle button**
- Always visible regardless of collapsed state
- Position: top-right of sidebar header, `26×26px`, `border-radius: 5px`, `background: #1e293b`
- Icon: left-pointing chevron SVG, rotates `180deg` when collapsed via CSS transition
- Keyboard shortcut: `⌘\` (registered globally)

**Tooltips (collapsed only)**
- Appear on hover, positioned `left: 46px` of the nav item
- Style: `background: #1e293b`, `color: #f1f5f9`, `border-radius: 5px`, `font-size: 11px`
- Controlled via CSS (`:hover .nav-tooltip { opacity: 1 }`) — no JS needed

**Persistence**
- Collapsed state stored in `localStorage` under key `vipsos:sidebar-collapsed`
- Restored on page load

### 2.4 Typography — Apple SF Pro with Cross-Platform Fallbacks

```css
font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text',
             system-ui, 'Segoe UI', sans-serif;
```

- On macOS/iOS: renders as SF Pro (system font, zero download cost)
- On Windows: Segoe UI (equally excellent for dense UI)
- On Linux: system-ui default

Monospace (logs, IDs, cron expressions, JSON):
```css
font-family: ui-monospace, 'SF Mono', Menlo, 'Cascadia Code', monospace;
```

**No external font CDN dependency.** This keeps the app fast and consistent at all network conditions.

---

## 3. Implementation Scope

### What changes

| File | Change |
|---|---|
| `tailwind.config.*` or CSS variables | Add slate/indigo design tokens; set default font-family |
| `src/index.css` or `src/assets/main.css` | Override Tailwind base: font stack, font-size base, color variables |
| `src/components/layout/AppShell.vue` | Wire sidebar collapsed state, emit/provide to children |
| `src/components/layout/AppSidebar.vue` | Full rewrite: dark bg, collapse logic, chevron toggle, tooltips, localStorage persistence, `⌘\` shortcut |
| `src/components/layout/AppTopBar.vue` | White background (`#fff`), refined height (`40px`), `12px` font size, slate-200 border |
| All `src/views/*.vue` | Reduce padding classes, type scale, card gaps throughout |
| All `src/components/**/*.vue` | Adjust padding, font sizes, border colors to match new tokens |

### What does NOT change

- Routing, store logic, stub data — untouched
- Component structure and slot hierarchy — untouched
- Test suite — no new tests needed (purely visual)
- `EmbeddedView` layout — already uses its own standalone shell

---

## 4. CSS Token Strategy

Use CSS custom properties in `src/assets/main.css` (or `src/index.css`) rather than extending Tailwind's config. This avoids Tailwind config churn and works natively with Tailwind v4's CSS variable support.

```css
/* src/assets/main.css — design tokens */
:root {
  /* Sidebar */
  --sidebar-bg:      #0f172a;
  --sidebar-border:  #1e293b;
  --sidebar-hover:   #1e293b;
  --sidebar-active:  #6366f1;
  --sidebar-text:    #94a3b8;
  --sidebar-section: #475569;

  /* Content surfaces */
  --content-bg:      #f8fafc;
  --card-bg:         #ffffff;
  --border:          #e2e8f0;

  /* Typography */
  --text-heading:    #0f172a;
  --text-body:       #334155;
  --text-muted:      #94a3b8;

  /* Accent */
  --accent:          #6366f1;
  --accent-hover:    #4f46e5;

  /* Font stacks */
  --font-sans: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text',
               system-ui, 'Segoe UI', sans-serif;
  --font-mono: ui-monospace, 'SF Mono', Menlo, 'Cascadia Code', monospace;
}

body {
  font-family: var(--font-sans);
  background: var(--content-bg);
  color: var(--text-body);
}
```

Tailwind utility classes continue to be used for spacing, layout, and one-off color values. The custom properties are referenced directly in component `style` blocks where Tailwind doesn't have a matching utility.

---

## 5. Execution Order

Apply changes in this sequence to avoid visual regressions between steps:

1. **Font stack + CSS base** — set the font-family and remove any explicit `font-sans` overrides
2. **Sidebar** — implement collapse/expand, dark bg, tooltips, localStorage, keyboard shortcut
3. **Topbar** — height, font size, border color
4. **Global type scale** — reduce `text-xl` page titles to `text-[15px]`, `text-3xl` stats to `text-[22px]`, `text-sm` body to `text-[11.5px]`
5. **Global spacing** — reduce `p-6` content areas to `p-[18px]`, `p-4` cards to `p-[10px]`, `gap-4` grids to `gap-2`
6. **Color tokens** — apply sidebar dark theme, slate content bg, indigo accent to buttons/badges/active states
7. **Per-view pass** — walk each view and fix anything the global rules didn't catch

---

## 6. Success Criteria

- Sidebar collapses and expands with a smooth animation; chevron always visible
- Collapsed sidebar shows icon tooltips on hover
- Collapsed state persists across page reloads
- Page titles feel compact and editorial (not blocky)
- KPI numbers are prominent but not oversized
- Content background is slate-50 (not pure white)
- All primary actions (buttons, active nav, badges) use indigo
- Status colors (green/red/amber/blue) remain clearly distinct
- All 57 existing tests still pass after changes
