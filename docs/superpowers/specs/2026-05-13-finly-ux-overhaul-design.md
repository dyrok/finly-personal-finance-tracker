# Finly UX Overhaul — Design Specification

**Date:** 2026-05-13
**Project:** Finly Personal Finance Tracker
**Approach:** Incremental Polish (3 Phases)

---

## Overview

A comprehensive UX overhaul of Finly, organized into 3 incremental phases to minimize risk and maximize reviewability. Each phase delivers visible improvements while maintaining the existing architecture.

---

## Phase 1 — Visual Foundation

### 1.1 Animations & Transitions

- **Page content:** Fade-in on load (`opacity 0→1`, `200ms ease-out`)
- **Stat cards:** Staggered entrance (`50ms` delay per card), value counters animate from `0` to actual value on mount
- **Tab switch:** Cross-fade content (`150ms ease-in-out`)
- **Toasts:** Slide in from top-right (`translateY -20px→0`, `300ms ease-out`), auto-dismiss after 4s
- **Charts:** Animate when scrolled into view via Intersection Observer

### 1.2 Card Styles & Elevation

- Default card: `shadow-sm`, hover → `shadow-md` with `200ms` transition
- Unified border radius: `rounded-xl` (16px) across all cards
- Subtle border: `border border-slate-100`, hover → `border-slate-200` with glow effect
- Stat cards: gradient background with subtle depth

### 1.3 Color Refinements

- Neutral palette shift: replace `slate` with `stone` (`stone-50` to `stone-900`)
- Positive values: accent `emerald-500` → `teal-500`
- Negative values: retain `rose-500` with subtle gradient
- Brand gradient: `from-brand-400 to-brand-600` for highlights
- **Dark mode:** Toggle in Settings, using `class="dark"` on `<html>`, CSS variables override light defaults

### 1.4 Micro-interactions

- Buttons: scale to `0.95` on press, spring back on release
- Form inputs: focus border `border-brand-400`, ring `ring-2 ring-brand-100`
- Transaction rows: hover highlight with left border accent (`border-l-2 border-brand-400`)
- Goal progress bars: animated fill on load (`width 0→actual%`, `600ms ease-out`)
- Pie chart slices: lift on hover (scale 1.05 + shadow)
- CSV export: loading spinner state during export

---

## Phase 2 — Accessibility & Responsiveness

### 2.1 Keyboard Navigation

- All interactive elements focusable with visible focus ring (`ring-2 ring-brand-400 ring-offset-2`)
- Tab order follows logical reading flow
- Modal dialogs trap focus (TransactionForm edit mode)
- Keyboard shortcuts:
  - `N` — new transaction
  - `E` — edit selected transaction
  - `Escape` — close modals/forms
  - `/` — focus search
- Skip-to-content link for screen readers (visible on focus)

### 2.2 Contrast & ARIA

- All text: WCAG AA contrast ratio (4.5:1 minimum)
- Icon-only buttons: `aria-label` attribute
- Dynamic content: toasts/alerts use `aria-live="polite"`
- Empty states: descriptive `aria-label` or `role="status"`
- Form fields: linked `id`/`for`, required fields marked `aria-required="true"`

### 2.3 Mobile Experience

- **Bottom navigation bar:** Dashboard, Transactions, Add (+), Goals, Settings
- **Cards:** Stack vertically on mobile, full-width layout
- **Charts:** Pie chart shows legend below chart below 480px viewport
- **Quick Add:** Full-screen modal on mobile (replaces sidebar card)
- **Touch targets:** Minimum `44x44px` for all interactive elements
- **Swipe gestures:** Swipe-to-delete transactions with undo toast

---

## Phase 3 — Navigation & Architecture

### 3.1 Tab Renaming

| Current Tab | New Name |
|-------------|----------|
| Dashboard | Overview |
| Transactions | History |
| Goals | Savings |
| Recurring | Automation |
| Report | Reports |
| Settings | Settings |

### 3.2 Layout Restructuring

**Overview (Dashboard):**
- Group stat cards into 2x2 grid on desktop
- Add "Quick Stats" summary strip above charts
- "Balance" card shows net positive/negative with icon

**Savings:**
- Goal categories: short-term / long-term tags
- Sort by deadline by default
- "Days remaining" badge on each goal
- Completed goals move to "Achievements" section

**Automation (Recurring):**
- Visual timeline showing next 5 occurrences per rule
- Status indicator: active (green) / paused (amber)
- Quick-toggle active/pause per rule

**Reports:**
- Monthly/Yearly toggle
- Export as PDF option (via browser print)

### 3.3 Data Hierarchy

- Transactions grouped by date: Today, Yesterday, This Week, Earlier
- Section headers with collapse/expand
- Overview: "Net Worth" stat (all-time total balance)
- Goals: "Achievements" wall for completed goals

---

## Technical Notes

### File Changes

| File | Changes |
|------|---------|
| `src/index.css` | Animations, dark mode variables, stone palette |
| `src/App.jsx` | Tab renaming, mobile nav, keyboard shortcuts |
| `src/pages/Dashboard.jsx` | Staggered stat cards, value animations, quick stats |
| `src/pages/Goals.jsx` | Categories, achievements section, timeline |
| `src/pages/Transactions.jsx` | Group by date, swipe-to-delete |
| `src/pages/Recurring.jsx` | Timeline, status toggle |
| `src/pages/Settings.jsx` | Dark mode toggle |
| `src/components/StatCard.jsx` | Value counter animation, gradient background |
| `src/components/TransactionForm.jsx` | Focus trapping, aria improvements |
| `src/components/Toaster.jsx` | Slide-in animation, aria-live |

### Dark Mode Implementation

```css
/* In index.css */
.dark {
  --bg-primary: #0f0f0f;
  --bg-card: #1a1a1a;
  --text-primary: #fafaf9;
  --text-secondary: #a8a29e;
}
```

Toggle: add `dark` class to `<html>` via Settings toggle.

---

## Scope Boundaries

**In scope:**
- All CSS/visual changes
- All accessibility improvements
- All navigation/architecture changes listed above
- Mobile-responsive layout improvements

**Out of scope:**
- Backend/data layer changes (localStorage remains)
- New data types or models
- Performance optimization (Phase 4 if needed)
- Export to PDF (browser print only, no server-side)

---

## Implementation Order

1. Phase 1 — Visual Foundation (CSS, animations, micro-interactions)
2. Phase 2 — Accessibility & Responsiveness (keyboard nav, ARIA, mobile nav)
3. Phase 3 — Navigation & Architecture (tab renaming, layout restructuring)

Each phase is reviewed and approved before starting the next.
