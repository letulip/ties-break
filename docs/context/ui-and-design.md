---
type: context-pack
status: current
area: ui
canonical: true
last-reviewed: 2026-08-03
---

# UI and design context

## Current truth

- The production UI is Vue 3 with Pinia, driven by worker snapshots. Components must not reach into
  mutable engine state or duplicate engine eligibility decisions.
- `src/style.css` and reusable components under `src/components/ui` are production design-system
  evidence. `docs/design` prototypes and screenshots are visual references, not copyable runtime
  code.
- The match show combines a generated event log with Canvas visualization, timeline, audio, and
  replay controls.
- The application is an offline-first installable PWA. Update behavior, service-worker caching,
  safe areas, and mobile back/focus behavior are product behavior, not incidental CSS.
- Most existing tests inspect logic, templates, or source contracts in a Node environment; a green
  unit suite is not proof of rendered accessibility or phone behavior.

## Read order

1. The screen/component and its composables.
2. Reusable UI primitives and relevant global styles/tokens.
3. Snapshot/protocol fields providing the data.
4. Matching UI tests and the design reference for the named screen.

## Invariants

- Engine rules stay in the engine; the UI renders typed verdicts or invokes commands.
- Reuse shared money, date, surface, icon, and control helpers before adding another local copy.
- Dialogs and takeovers require semantics, focus entry/restoration, Escape/back behavior, and a
  usable narrow viewport.
- Respect reduced-motion and safe-area behavior.
- Source prototypes can inspire layout but must not introduce a second token/component system.

## Focused verification

- Run the matching screen/component test plus `tests/ui-control-system.test.ts` when controls change.
- Token/theme changes: `npm test -- tests/design-tokens.test.ts`.
- PWA changes: `npm test -- tests/pwa-update.test.ts` and a production build.
- Match visualization: the relevant `tests/viz` and match-view tests.

Use browser or device-level verification for layout, accessibility, focus, animation, caching, and
install/update behavior; source-string tests cannot establish those properties.

## Broaden context when

- A screen change modifies protocol data, worker commands, persistence, service-worker behavior, or
  global navigation.

