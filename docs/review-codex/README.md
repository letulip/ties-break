# Ties Break full project review

Review baseline: local `main` commit `6295175`, reviewed on 2026-08-01 on branch
`codex/full-project-review`.

## Executive verdict

Ties Break has a real identity and a technically serious simulation core. Its strongest work is the
combination of deterministic matches, honest family economics, a living tournament ladder,
imperfect-information development, expressive art, and a mobile-first presentation. This is not a
generic tennis manager with a new skin.

It is not yet the game promised by its own pitch. Today it is a polished junior-tennis
calendar/economics simulator with strong narrative texture. It does not yet deliver a complete
parent-child career, sustained daughter agency, a parent life, a paced path through hundreds of
weeks, or an ending. Those are not peripheral backlog items: they are the meaning of the name and
the product's main differentiation.

The engineering verdict is similarly split. Pure engine modules, deterministic RNG discipline,
strict TypeScript, migration coverage, and the small runtime dependency set are excellent. The
state/persistence boundary is the weak side: save restoration is not durable, worker commands are
not serialized, failed persistence can leave hidden mutations, multiple tabs can overwrite one
another, and worker crashes are not recoverable. These are higher priority than aesthetic
refactoring because they can make a player distrust a long career.

## Severity model

- **P0 / Critical**: blocks the promised product or can invalidate a career/release.
- **P1 / High**: material user harm, major architectural risk, or a core promise that is currently false.
- **P2 / Medium**: significant maintainability, accessibility, balance, security, or usability debt.
- **P3 / Low**: polish, hygiene, or future-facing hardening.

## What is unusually good

- A differentiated, research-backed product thesis: parenthood, cost, and observation rather than a
  generic avatar-stat treadmill ([README](../../README.md),
  [market research](../research/01-market-and-competitors.md)).
- Deterministic, purpose-scoped randomness and extensive invariance tests. The engine takes fairness
  seriously rather than using hidden rubber-banding.
- Pure, focused leaf modules for ranking, matches, development, condition, coaches, offers, academy,
  diary, and radar.
- Honest financial ledgers, bounded histories, corruption-detecting saves, two autosave generations,
  and migrations spanning schema v0 through v32.
- Strong visual art direction, typography, responsive composition, and a reusable token/component
  system. The live 390x844 pass had no horizontal overflow and the onboarding hierarchy remained
  legible.
- A tiny production dependency surface: Vue and Pinia only.
- No analytics, telemetry, remote game backend, or observed transmission of career data.

## Highest-priority findings

| Priority | Finding | Why it matters |
| --- | --- | --- |
| P0 | No complete career ending or epilogue | The advertised full-life arc and replay loop cannot be evaluated or completed. |
| P0 | Hundreds of mandatory one-week advances conflict with a 10-20 hour career | The core loop is likely to become repetitive long before adulthood. |
| P0 | “The child is a person” is not yet a mechanic | The daughter has flavor and art, but little preference, consent, resistance, trust, or agency. |
| P1 | Restore/load is not durable across an immediate relaunch | A rollback can appear successful, then silently return to the newer autosave. |
| P1 | Worker commands and autosaves are not serialized/transactional | Overlapping actions, save failure, or multiple tabs can create hidden or rolled-back progress. |
| P1 | The shipped Settings screen exposes `▶▶ 52 (dev)` | It bypasses normal stop rules, has no confirmation, mutates 52 weeks, and autosaves. |
| P1 | Worker crashes permanently wedge the client | The dead worker remains cached and requests have no timeout or recovery path. |
| P1 | The simulation calibration command is not a reliable gate | All 60 assertions passed, but Vitest still exited 1 on `onTaskUpdate` timeout. |
| P1 | Documentation is not a trustworthy source of current truth | Major specs say “not implemented” after shipping; README still says planning phase. |
| P1 | Modal/tour accessibility is structurally incomplete | Overlays lack dialog semantics, focus entry/trapping/restoration, inert background, and Escape behavior. |
| P2 | The integration and wire-contract modules are too large | `world.ts` is 5,293 lines; `protocol.ts` 1,574; comments often preserve history instead of current truth. |
| P2 | Production build mutates the authoring tree; masters have no backup | A normal build moves raw art into a gitignored, workstation-only directory. |

## Report set

1. [Product, concept, narrative, and ethics](01-product-and-narrative.md)
2. [Mechanics, progression, economy, and balance](02-mechanics-and-balance.md)
3. [Architecture, state, worker, and persistence](03-architecture-and-data.md)
4. [Code quality and developer principles](04-code-quality-and-principles.md)
5. [UX, visual design, interaction, and accessibility](05-ux-design-accessibility.md)
6. [Testing, security, performance, and operations](06-testing-security-operations.md)
7. [Prioritized action plan](07-prioritized-action-plan.md)
8. [Method, evidence, and limitations](08-method-and-evidence.md)
9. [Detailed proposal catalogue](09-detailed-proposals.md)
10. [Funding roadmap and investment estimate](10-funding-roadmap-and-investment-estimate.md)

## Bottom line

Do not start with a large `world.ts` rewrite. First protect career integrity, remove the shipped dev
escape hatch, make the test signal reliable, and decide what the honest v1 actually ends with. Then
build the minimum daughter-agency and time-compression spine that makes the title true. Refactor the
integration module incrementally behind characterization tests while that product spine is built.
