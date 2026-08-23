---
type: review
status: audit
area: project-review
canonical: false
last-reviewed: 2026-08-18
baseline: 13d8f95a8e4581008a0c209d676d578b00d68200
---

# Ties Break principles and product review

> Point-in-time audit of `main` at `13d8f95` on 2026-08-18. It describes evidence, not current
> project truth forever. Recheck a finding against code and tests before implementing it.

> **Superseded for current planning:** the [23 August re-review](../review-principles-2026-08-23/README.md)
> rechecks every review area against `origin/main` at `52a5f13` and includes a fix matrix for this
> audit. Keep this set as the historical baseline for that comparison.

## Verdict

Ties Break is no longer merely a promising PoC. Its deterministic simulation, transactional
worker, long-lived saves, measured economy, complete career ending, and mounted UI regression suite
form a credible MVP foundation. The architecture is unusually serious for a solo, mobile-first
game: Vue does not leak into the engine, match presentation cannot choose outcomes, money is cents,
and every save generation from v0 through v52 has a fixture.

The next risk is **not insufficient abstraction**. It is that hard-won behavior is distributed
across a few high-context hubs and sometimes duplicated at the exact boundary where honesty
matters. Two current examples deserve correction before cosmetic refactoring:

1. scoring and live probability contain separate tiebreak server-rotation algorithms;
2. economy and calendar form a runtime import cycle which already caused a real browser TDZ crash.

The repo is also paying an exceptional retrieval tax. Production TS/Vue contains about 83,000
physical lines, while tests contain about 83,000; several central files are 20k–59k rough tokens
each. Much of the production bulk is valuable reasoning, but historical incident essays and stale
future notes now act as a second specification layer. Splitting files without first clarifying and
compressing that prose would merely scatter the same cost.

## Highest-priority findings

| Priority | ID | Finding | First move |
| --- | --- | --- | --- |
| P1 | TB-01 | Tiebreak serve rotation is duplicated in scoring and live probability | One pure shared module plus parity tests |
| P1 | TB-02 | Economy/calendar runtime cycle already caused a browser initialization crash | Make `shared/dates.ts` own the 52-week constant |
| P1 | TB-03 | Canonical context routes materially contradict schema v52 and shipped endings | Refresh packs and supersede dated roadmaps |
| P1 | TB-04 | A manual skipped event restores eight fewer condition points than an equivalent free week | Characterize, fix, and rerun fatigue evidence |
| P2 | TB-05 | UI reconstructs authoritative tier eligibility and has disagreed with the engine before | Project neutral verdicts into the snapshot |
| P2 | TB-06 | Worker command types do not constrain their legal reply type | Add request-to-reply typing at the client boundary |
| P2 | TB-07 | Runtime module cycles remain in coach/cohort/development and world projection | Extract neutral leaves; make world modules a DAG |
| P2 | TB-08 | `tickWeek`, protocol, and large screens remain high-conflict, high-context hubs | Extract cohesive phases, not a framework |
| P2 | TB-09 | Source-text tests have become a parallel test architecture | Keep policy pins; migrate behavior pins when touched |
| P2 | TB-10 | Production comments and “current” documents include stale specifications | Keep invariants near code; archive history and superseded docs |

No P0 was found. The reviewed state has strong career-integrity controls; none of the findings is
evidence that existing saves are generally corrupt or that match outcomes are nondeterministic.

## Review set

1. [Method and measured baseline](01-method-and-baseline.md)
2. [DRY, KISS, YAGNI, and SOLID](02-principles-review.md)
3. [Architecture and code structure](03-architecture-and-code.md)
4. [Product, plot, design, and mechanics](04-product-design-and-mechanics.md)
5. [Testing, documentation, and tooling](05-testing-docs-and-tooling.md)
6. [Token and context optimization](06-token-and-context.md)
7. [Detailed proposal roadmap](07-proposals-and-roadmap.md)

## What not to simplify

- Do not replace explicit discriminated unions and the worker `switch` with a dynamic command bus.
- Do not DRY old migrations together or remove one-fixture-per-schema coverage.
- Do not hide tuned `TIERS` or `ECONOMY` exceptions behind inheritance/default magic.
- Do not split one migration, tier, DTO, or comment into one file each.
- Do not remove serialized statistical tests, sharding, retries, or quiet reporting; they answer a
  measured runner limitation.
- Do not make `Snapshot` screen-specific until profiling demonstrates a transfer problem. Modularize
  its types first while preserving one simple runtime snapshot.

The right direction is **fewer independent truths, smaller retrieval cones, and explicit ordered
orchestration**—not more layers.
