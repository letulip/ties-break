---
type: execution-plan
status: draft
area: project-review-roadmap
canonical: false
last-reviewed: 2026-08-23
baseline: 52a5f13f7080550af80460ae3306f047ca7079e6
---

# Detailed proposals and roadmap

## How to use this roadmap

This is a dependency-aware catalogue, not an instruction to build everything. One wave should land
and be verified before the next begins. Product decisions have explicit stop/go gates so a solo
developer does not spend weeks implementing an option that was never chosen.

Effort assumes one experienced developer familiar with the repository:

- **XS:** under one focused day;
- **S:** 1–2 days;
- **M:** 3–5 days;
- **L:** 1–2 weeks;
- **XL:** 3+ weeks plus design/calibration.

Simulation/phone QA time is included where it is intrinsic, but elapsed time can be longer on a
part-time schedule.

## Recommended order

| Wave | Outcome | Estimated focused effort |
| --- | --- | ---: |
| 0. Correctness and current truth | Remove two live defects and repair broken guards/routes | 3–5 days |
| 1. Typed boundaries and accessibility | Make illegal replies/prose parsing harder and irreversible choices usable | 1–2 weeks |
| 2. Retrieval-aware decomposition | Stop integration hubs and source pins from refilling | 3–5 weeks, split into small PRs |
| 3. Career-loop mechanics | Reduce dead presses; calibrate real player and college costs | 2–3 weeks |
| 4. Adult agency and relationship promise | Make one adult decision hers and give it a persistent echo | 3–6 weeks |
| 5. Bounded hygiene | Tools/docs/CSS/release signals without a cleanup rewrite | 1–2 weeks plus ongoing |

For a solo developer averaging three focused project days per week, waves 0–2 are roughly six to
nine calendar weeks. The whole catalogue is roughly four to seven months. It is reasonable to stop
after wave 1 and reassess player evidence before paying for deeper decomposition/product work.

## Wave 0 – Correctness and current truth

### R2-01 – Correct college financial event typing

**Priority / effort / risk:** P1 / XS / low.

Change tuition event type from `income` to `expense`. Add a focused test that proves:

- funds decrease by the weekly quote;
- event amount is negative;
- type is `expense` and category is `tuition`;
- Money totals remain unchanged from the signed ledger.

Run focused college/finance tests and the normal gate. This should not bump the save schema.

### R2-02 – Project a structured injury report

**Priority / effort / risk:** P1 / S–M / medium at UI boundary.

Add a derived Snapshot view containing:

- circumstance kind and optional opponent/round facts;
- cancelled entry id/label/week rows;
- forfeited/stranded entry rows;
- total refund cents.

Construct it beside snapshot projection from structured state/events, not rendered English. Rewrite
the dialog as formatter only. Mutation-test by changing event wording while the mounted report stays
correct. No persistence or migration unless a missing fact truly cannot be derived.

### R2-03 – Repair the two false architecture guards

**Priority / effort / risk:** P1 / XS–S / low.

1. Replace literal NUL bytes in `import-cycles.test.ts`; add a scoped tracked-text NUL check.
2. Export the real sim runner argument builder; test the actual `--project sim`,
   `--no-file-parallelism` and dot-reporter arguments.

Prove each guard with a mutation: remove a sim flag; introduce a tiny import cycle; both must fail.

### R2-04 – Restore current documentation and add freshness ownership

**Priority / effort / risk:** P1 / S / low code risk.

Correct round/schema/e2e/birthday/college statements. Mark superseded rulings/plans rather than
rewriting history. Add `CLAUDE.md` to context-audit inputs/budget. Add a wave-close requirement that
updates the active ledger/router and a mechanical check for the schema/current-wave facts that have
repeatedly rotted.

Acceptance: a new reviewer following `context-index` reaches no known false current statement;
context audit passes; old anchors/history remain available.

## Wave 1 – Typed boundaries and accessible decisions

### R2-05 – Correlate worker requests and replies

**Priority / effort / risk:** P2 / M / medium.

Implement `ReplyFor<Request>` through a readable type map or typed methods. Add central snapshot
application/assertion and compile-time tests for wrong command/reply pairs. Preserve:

- explicit worker switch;
- transactional commit-before-swap semantics;
- error/revision/restart-generation behaviour;
- transfer lists for save bytes.

Do not combine this with protocol file splitting; stabilize the seam first.

### R2-06 – Restore engine/presentation dependency direction

**Priority / effort / risk:** P2 / M / medium.

Inventory rally, stats, serve-speed, court and clock consumers. Choose either neutral shared
presentation contracts or move presentation-only modules under `viz/match`. Add an architecture
guard and fixed-record parity tests. No interface/service layer and no outcome model change.

### R2-07 – One accessible blocking-dialog shell

**Priority / effort / risk:** P1 design / S–M / medium because overlays block careers.

Wrap Fork, Retirement, Injury and Confirm in the existing focus utility/shell pattern. Verify:

- role/name/modal semantics;
- initial focus, tab containment, restoration and Escape policy;
- overlay precedence is unchanged;
- dismiss/decision controls remain inside a 375×667 viewport.

Do not unify each dialog's content/actions into a generic schema.

### R2-08 – Finish career-watermark consolidation

**Priority / effort / risk:** P2 / S–M / low–medium.

Move App's this-week, trophy, season, injury, college and tour marks onto the existing generic
watermark/career-sync primitives. Explicitly test career switching, missing-key policy and storage
exceptions. Keep overlay precedence in App.

## Wave 2 – Retrieval-aware decomposition

### R2-09 – Split protocol behind its public path

**Priority / effort / risk:** P2 / L / medium–high fan-out.

Sequence:

1. remove engine-only birthday catalogue data from protocol;
2. add cohesive domain modules (profile/planning, events/finance, diary/narrative,
   competition/ladder, offers/staff, career/endings);
3. split Snapshot and typed commands/replies;
4. re-export from `shared/protocol` using correct `export type` boundaries.

Acceptance: production build passes, existing import path remains valid, no circular runtime edge,
and representative tasks open materially less unrelated code.

### R2-10 – Extract persisted schema and weekly phases

**Priority / effort / risk:** P2 / L–XL / high due determinism/order.

First move only `WorldState`/version/type composition to `world/state.ts` or `world/schema.ts` without
changing serialization. Then characterize phase boundaries and extract:

- season boundary and recurring obligations;
- finance/staff/college bill;
- body/planner and player competition;
- development/life/birthday/school;
- AI competition/ranking/finalization.

`tickWeek` remains a plainly ordered recipe. No callbacks into the facade, registry, event bus or
draw reordering. For fixed seeds compare RNG `{s,n}`, finance, injuries, entries, rankings, events,
endings and final snapshot at each move.

### R2-11 – Extract UI state owners, one screen at a time

**Priority / effort / risk:** P2 / L per two screens / medium.

- Calendar: `useDayCrossSweep` plus mounted fake-timer tests.
- MatchViewer: one playback/visibility clock, one audio-cue composable, prop-driven controls/readout.
- Season: planner/event list and move/remove the sandbox; screen stays store-aware.
- App: navigation/watermarks/blocking flow, but one centralized overlay priority remains.
- Home: split college/staff panels only if their independent change rate continues.

Each extraction is its own PR or small wave. Never allow two clock/timer owners.

### R2-12 – Ratchet source/docs/tools lifecycle

**Priority / effort / risk:** P2 / M / low.

- Safe marker-region helper that throws on absent markers.
- Baseline allowlist preventing new raw source slices and new unclassified docs.
- Compact current-decision index in front of the append-only archive.
- Tools registry and archival `tsconfig.tools.json`.
- Context-audit delta report for newly over-budget/growing source files.

Warnings remain warnings; no arbitrary line/comment hard gate.

## Wave 3 – Career-loop mechanics

### R2-13 – Safe multi-week / next-decision advance

**Priority / effort / risk:** P1 product / M / medium–high interaction risk.

Phase 1 exposes the already supported four-week advance only when the engine can stop before a
blocking event. Phase 2 generalizes to “next decision/event” if playtesting still shows dead presses.

The command must stop before birthdays, injuries, reveal/arrival, offers, finance crises, fork,
retirement, ending or any response. It must preserve MAIN input independence and surface every
intermediate financial/narrative result. Test one stop reason at a time and collision precedence.

### R2-14 – Add reasonable-player and sponsor-aware balance arms

**Priority / effort / risk:** P1 mechanics / S–M plus sim time / low code, medium tuning.

Keep grinder corridors. Add:

- one reasonable-player release corridor;
- one sponsor-aware staff/travel grid;
- median plus bad/good tail reporting;
- predicted vs measured spec before changing numbers.

No tuning ships merely because a new arm differs; first decide which outcome is intended.

### R2-15 – Decide college role and competition semantics

**Priority / effort / risk:** P2 / M–L / product decision first.

Decision A: compact interlude or second act. If compact, clarify copy and stop. If second act, prototype
one pre-year stance and prove it changes a visible trade-off before adding state.

Separately model the championship as unranked competition, reuse measured condition/development
costs, and verify national-selection causality remains. Do not build college-only match physics.

## Wave 4 – Adult agency and relationship promise

### R2-16 – Make one adult decision genuinely hers

**Priority / effort / risk:** P1 product / M–L / high narrative compatibility.

Use current career facts to derive a visible preference at the school fork. The player responds
rather than selects her future. Persist only the minimal chosen/preference/response facts needed for
later echo. Reuse the ask/hold/depart flow and prove old saves migrate deterministically.

Do retirement only after the interaction works at nineteen; otherwise two inconsistent systems will
be built at once.

### R2-17 – Minimum relationship mechanic through one complete beat

**Priority / effort / risk:** P2 positioning / L–XL / high design and balance.

Specify one slow, partly observable relationship dimension only after R2-16 proves an input and
reaction. Requirements:

- few existing actions feed it; no daily-life simulator;
- reactions explain direction without exposing an optimizer number;
- repeated pushing is not always dominant;
- at least one later callback/ending consequence;
- old-save migration and deterministic tests;
- README third pillar matches what actually ships.

If this cannot be made visible and meaningful in one authored beat, rescope the third pillar instead
of persisting hidden numbers.

### R2-18 – Enforce adult narrative knowledge and simplify copy

**Priority / effort / risk:** P2 / S–M / editorial.

Share stage predicates, rename the misleading at-home claim, add college gift pools, remove
residence assumptions and deduplicate CollegeYearCard rules. Add licence tests based on facts/stage,
not a small blacklist of forbidden words. Rename the internal 31+ portrait stage with a compatibility
asset alias.

## Wave 5 – Bounded hygiene and release readiness

Only after the product/boundary waves:

- remove verified orphan CSS in screenshot-checked batches;
- make owner decisions on dormant handoff/conduct/art seams and remove only what is declined;
- add correctness-only lint if selected rules catch defects TypeScript/tests do not;
- add report-only unit/component coverage, then decide whether any threshold earns its cost;
- use quiet CI and avoid duplicate typecheck;
- add build id/changelog/tagging when external testers need reproducible releases.

## Dependency map

```text
R2-01 tuition ─────────────────────────────────────────────── independent
R2-02 injury DTO ──> R2-09 protocol split
R2-03 guards ──────> R2-10 phases / R2-12 pin lifecycle
R2-04 truth ───────> every later wave

R2-05 typed replies ──> R2-09 protocol split
R2-06 engine/viz ─────> R2-11 MatchViewer extraction
R2-07 dialog shell ───> R2-16 adult-decision scene
R2-08 watermarks ─────> R2-11 App extraction

R2-13 cadence ────────> playtest evidence for product depth
R2-14 balance arms ───> R2-15 college tuning / R2-17 relationship tuning
R2-16 adult agency ───> R2-17 relationship mechanic
```

## Stop/go checks

- After wave 0: if canonical truth still requires manual archaeology, fix ownership before adding
  more documentation.
- After wave 1: compile-time mutation must reject a wrong worker reply; copy mutation must not break
  injury facts; keyboard-only player must complete every irreversible dialog.
- After each decomposition PR: fixed-seed RNG/state parity and production build are mandatory.
- Before college depth: decide compact interlude vs second act in writing.
- Before relationship state: demonstrate one complete visible input → reaction → later echo.
- Before balance tuning: run both grinder and reasonable-player/sponsor-aware arms.

## Definition of success

The programme succeeds when:

- domain facts cross boundaries as types, not English strings;
- the current context route is short and factually current;
- new features stop increasing `tickWeek`, protocol and App by default;
- behaviour tests, not source spelling, protect user interactions;
- quiet stretches of a career no longer require a press every week;
- the daughter makes at least one consequential adult decision herself;
- the project retains deterministic saves, transparent economics and an auditable weekly order.
