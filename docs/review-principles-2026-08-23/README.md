---
type: review
status: audit
area: project-review
canonical: false
last-reviewed: 2026-08-23
baseline: 52a5f13f7080550af80460ae3306f047ca7079e6
---

# Ties Break full-project review – round two

> Point-in-time audit of `origin/main` at `52a5f13` on 23 August 2026. Code and tests remain the
> authority for shipped behaviour. This review is evidence and advice, not a new canonical product
> specification.

## Executive verdict

Ties Break is a credible, unusually disciplined solo-developed MVP. The worker is authoritative,
mutations are transactional, saves are migrated from every historical schema, randomness is
deterministic, money uses integer cents, and match presentation cannot choose match outcomes. The
recent college, academy, live-table, advertising and staff waves have also turned the career into a
more complete story rather than a collection of disconnected screens.

The project has fixed much of the previous review's highest-risk technical debt. The duplicated
tiebreak rule, three runtime import cycles, skipped-week recovery mismatch, heavy-test list
duplication and most tier-eligibility duplication are closed. Those are substantive fixes, not
cosmetic refactors.

The new risk is **growth without consolidation at the integration boundaries**:

- `world.ts` grew from 3,589 to 4,269 lines and `tickWeek` from 579 to 682 lines;
- `protocol.ts` grew from 3,466 to 3,960 lines;
- canonical delivery/save documents are stale again only days after their repair;
- source-reading tests remain a parallel test system;
- the story increasingly calls the daughter an adult while the parent still makes her largest
  adult decisions;
- new features have exposed two concrete boundary defects: college tuition is typed as income, and
  the injury UI parses English prose to recover domain facts.

The next wave should therefore favour **one source of truth, typed facts at boundaries, and fewer
low-information player actions**. It should not introduce a service layer, event bus, inheritance
hierarchy, universal view-model framework or a file per interface.

## Highest-priority findings

| Priority | Finding | First move |
| --- | --- | --- |
| P1 | College tuition is a negative financial event tagged `income` | Change it to `expense`; test type, sign and category |
| P1 | Injury reporting derives cancellations/refunds by parsing English strings | Add a derived structured `injuryReport` snapshot DTO |
| P1 | Canonical delivery/save truth is stale again (`round22`, schema v53 vs v59) | Add mechanically checked facts and a wave-close freshness rule |
| P1 | Adult copy says she has a preference, but the player can override it | Make her preference the decision and the parent response the choice |
| P1 | Hundreds of quiet weeks still require individual presses | Expose a safe four-week/next-decision advance that stops before choices |
| P1 | Balance release corridors still privilege the grinder policy | Add a reasonable-player and sponsor-aware integrated arm |
| P2 | Worker requests still return the entire `ToUI` union | Add request-to-reply typing and impossible-reply assertions |
| P2 | `world.ts`, `protocol.ts`, App and major screens are refilling after decomposition | Split only stable ownership seams behind compatibility facades |
| P2 | Engine presentation modules still import runtime values/types from `viz` | Move neutral presentation contracts or presentation-only modules |
| P2 | Irreversible dialogs lack the focus/modal treatment used by newer dialogs | Reuse one accessible dialog shell/focus utility |
| P2 | Source pins and binary-classified cycle test obstruct safe review/refactoring | Remove literal NULs; migrate behaviour pins when their features move |

No P0 was found. There is no evidence of general save corruption, nondeterministic careers or a
worker/UI state-ownership breach.

## Review set

1. [Method, baseline and change map](01-method-baseline-and-change-map.md)
2. [DRY, KISS, YAGNI, SOLID, architecture and code](02-principles-architecture-and-code.md)
3. [Product, plot, design and mechanics](03-product-plot-design-and-mechanics.md)
4. [Testing, documentation and tooling](04-testing-documentation-and-tooling.md)
5. [Token and context optimization](05-token-and-context-optimization.md)
6. [Previous-review fix matrix](06-previous-review-fix-matrix.md)
7. [Detailed proposals and roadmap](07-proposals-and-roadmap.md)

## What should remain deliberately simple

- Keep the explicit worker `switch`; typed replies do not require a command bus.
- Keep the ordered weekly recipe visible; phase extraction does not require an event framework.
- Keep historical migrations append-only and one fixture per schema.
- Keep explicit tuned rows in `TIERS` and `ECONOMY`; defaults/inheritance would hide exceptions.
- Keep deterministic statistical benches and their serial/sharded runners.
- Keep owner reasoning next to the code it governs. Correct comments that are false about current
  behaviour; do not impose a comment quota or purge history mechanically.
- Keep data-heavy editorial pools together unless an actual ownership/change seam appears.

The target is not “more architecture.” It is **fewer independent truths and smaller retrieval
cones without hiding the simulation's order**.
