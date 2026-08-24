---
type: review
status: audit
area: project-review-method
canonical: false
last-reviewed: 2026-08-23
baseline: 52a5f13f7080550af80460ae3306f047ca7079e6
---

# Method, baseline and change map

## Scope and authority

This review covers the whole repository at `origin/main` commit `52a5f13` and explicitly revisits
the earlier audit on branch `codex/principles-review-2026-08-18`, commit `e9393b8` (baseline
`13d8f95`). The current code and tests were checked before inheriting an old conclusion.

The review used:

- canonical context packs for routes and declared invariants;
- current source and focused tests for runtime truth;
- Git history and the earlier review for before/after comparison;
- narrow static counts/searches and `context:audit --check --json` for corpus measurements;
- three independent read-only review passes covering principles/architecture, product/mechanics,
  and tests/docs/context.

No production behaviour was changed. No balance conclusion was inferred from a single career and no
long Monte-Carlo suite was run during the parallel inspection.

## Severity

- **P0:** data loss, broad corruption, security/privacy breach, or unusable release.
- **P1:** current correctness defect or product/architecture contradiction with material player or
  development cost.
- **P2:** significant maintainability, accessibility, design or verification risk.
- **P3:** bounded hygiene, clarity or lifecycle debt.

## Measured current baseline

| Area | Current | Earlier audit | Direction |
| --- | ---: | ---: | --- |
| `src` TS/Vue files | 189 | 180 | +9 |
| `src` TS/Vue lines | 91,941 | 83,106 | +8,835 |
| test TS files | 247 | 205 | +42 |
| test lines | 96,020 | 83,223 | +12,797 |
| tools TS/MJS files | 136 | 122 | +14 |
| tools lines | 46,600 | 42,924 | +3,676 |
| Markdown under `docs` | 263 files / 76,056 lines | 243 / 71,004 | +20 / +5,052 |
| estimated governed corpus | about 1.30M tokens | about 1.21M | growing |
| `world/*` modules | 27 | 26 | decomposition continued |
| mounted component test files | 56 by `*.test.ts` | 42 | improved |
| source-reading test files | 90 by the stated broad query | roughly 77–83 | also growing |

The source-reading count is the number of test files matching at least one of `readFileSync`,
`worldSource`, `engineModuleSource`, `componentLogic` or `componentFile`. It intentionally includes
static architecture/configuration tests as well as behaviour-shaped pins.

## Largest current production surfaces

| File | Lines | Review interpretation |
| --- | ---: | --- |
| `src/engine/world.ts` | 4,269 | mixed persisted state, compatibility facade and weekly integration hub |
| `src/style.css` | 4,062 | global system plus verified legacy blocks |
| `src/shared/protocol.ts` | 3,960 | multiple domain contracts plus snapshot and transport unions |
| `src/engine/economy.ts` | 2,934 | large but mostly cohesive tuning catalogue; do not split mechanically |
| `src/components/MatchViewer.vue` | 2,625 | playback clock, audio, rendering and readout owners |
| `src/components/screens/HomeScreen.vue` | 2,458 | grew substantially with college/staff surfaces |
| `src/components/screens/SeasonScreen.vue` | 2,414 | event feed, planner, confirmations and sandbox |
| `src/engine/season/calendar.ts` | 2,182 | data-heavy catalogue plus deterministic construction |
| `src/engine/migrations.ts` | 1,833 | intentionally append-only; size is largely justified |
| `src/viz/commentary.ts` | 1,815 | editorial data; split only by a demonstrated voice/ownership seam |
| `src/App.vue` | 1,521 | navigation, overlays, storage watermarks and lifecycle |
| `src/components/screens/CalendarScreen.vue` | 1,359 | grid, card orchestration and an independently stateful day-cross animation |

## Material improvements since the previous review

- The tiebreak server rule now has one runtime owner and parity coverage.
- The economy/calendar, coach/cohort/development and world projection cycles are closed.
- A real SCC detector guards runtime imports.
- Skipping and medical withdrawal no longer apply different recovery for equivalent free weeks.
- Tier eligibility is now derived from the engine verdict for the shipped application path.
- Heavy unit/simulation lists have one importable owner in `scripts/heavy-tests.mjs`.
- Shared test helpers now cover career snapshots, hashing, worker harnesses, source helpers and
  Season mounting.
- Tournament card facts, the red/green reading ramp, country flags, season horizon, competition
  ranking and the `SegmentedRow` chapter appearance were consolidated.
- Mounted component coverage and e2e smoke coverage both expanded.
- The generated world-symbol map is current and checked in the normal gate.
- College now has an ask/reserve/depart sequence, playable years, birthdays, a championship,
  selection consequences and a visible return.

## Regressions and recurrence

### Integration hubs refilled

Relative to the earlier audit, `world.ts` added 680 net lines, `protocol.ts` added 494, and
`tickWeek` expanded from about 579 to 682 lines (`src/engine/world.ts:3108-3789`). New product work
is still cheapest to land in the same two files, so the architecture has not yet changed the path of
least resistance.

### “Current truth” is stale again

- `docs/now-next-later.md:26-42` says round 22 is current; `origin/main` has merged through round 25.
- `docs/context/saves-and-worker.md:15-20` says schema v53; runtime is v59 at
  `src/engine/world.ts:466`, with fixtures through `v59.json`.
- `docs/rounds/README.md:36-44` stops at round 22 although round-23 and later ledgers exist.
- `docs/decisions.md:2390-2407` says college birthdays never pause or enter the ledger; current
  college birthday tests prove the opposite.

`context:audit` passes because it proves shape, metadata, links, selected duplicated facts and
budgets, not semantic freshness. That is a useful boundary, but it means the process still needs a
small set of mechanically sourced current facts and a wave-close owner.

### Test architecture grew in both directions

Mounted tests grew, which is good. Source readers also grew, so the repository now maintains both a
stronger behaviour suite and more structure-sensitive pins. This is not a reason to delete every
pin; it is evidence that the migration policy is not yet changing the default for new UI tests.

## Review limitations

- This is a static and focused-test review, not a complete playthrough of every seed.
- No full accessibility audit on physical devices was performed.
- Balance recommendations identify missing measurement arms; they do not invent replacement tuning
  numbers.
- “Human-like” copy is reviewed where it changes product meaning or life-stage honesty, not as a
  line-by-line rewrite of every string.
