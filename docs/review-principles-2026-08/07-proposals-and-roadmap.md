---
type: review
status: audit
area: project-review
canonical: false
last-reviewed: 2026-08-18
baseline: 13d8f95a8e4581008a0c209d676d578b00d68200
---

# Detailed proposals and roadmap

## How to use this catalogue

These are implementation proposals, not authorization to combine them into one rewrite. Each wave
should have one branch, explicit behavioral characterization, and a full `npm run check` before
delivery. Balance changes require their relevant simulation evidence.

Effort is a solo-developer engineering estimate:

- **XS:** less than one focused day;
- **S:** one to two days;
- **M:** three to seven days;
- **L:** one to three weeks;
- **XL:** multi-week product feature with design/calibration uncertainty.

Estimates exclude app-store release work, translation, new art, and waiting for external feedback.

## Recommended wave order

| Wave | Proposals | Outcome | Estimate |
| --- | --- | --- | --- |
| A — Restore truth and correctness | PR-01 to PR-04 | One current roadmap, honest probability, acyclic season constant, consistent recovery | 1–2 weeks |
| B — Dependency direction | PR-05 to PR-08 | Remaining SCCs removed, typed RPC replies, engine/viz direction corrected | 1–2 weeks |
| C — One authority at the UI boundary | PR-09 to PR-11 | Engine verdicts and stable protocol modules; duplicated presentation reduced | 2–3 weeks |
| D — Retrieval-aware decomposition | PR-12 to PR-16 | Smaller tick/protocol/SFC context and fewer behavior pins | 3–6 weeks incrementally |
| E — Product depth decision | PR-17 and PR-18 | Honest third pillar and clear exhibition role | 3–8 weeks depending on choice |
| F — Hygiene as touched | PR-19 to PR-22 | Less dormant/CSS/tool/document surface and measured token savings | Ongoing, 1–3 weeks total |

Waves C and D can be split into smaller feature-owned branches. Do not start a broad protocol/world
move while a balance or save-schema wave is editing the same hubs.

## Wave A — Restore truth and correctness

### PR-01 — Refresh canonical project truth

**Priority:** P1
**Effort:** S
**Risk:** Low implementation risk; high value for every future task.

**Problem:** canonical packs describe schema v36/v45, no complete endings, bankruptcy-only stops,
and future v35–v39 work while runtime is v52 with a shipped epilogue. README says planning phase.

**Change:**

1. update the five packs from code and current tests;
2. create one concise current `now / next / later` delivery document;
3. mark August roadmaps/launch plans historical or superseded;
4. mark original specs superseded when a corrected current spec exists;
5. remove volatile counts/versions or route to their owning symbols;
6. add `context:audit` to CI and a small owner-to-pack freshness map.

**Acceptance:**

- a new contributor following `context-index.md` reaches no known contradictory current document;
- context audit passes;
- schema/endings routes name current owner files/tests rather than copied old numbers;
- exactly one current delivery plan and one current mechanic-state spec per affected area.

### PR-02 — One tiebreak-serving algorithm

**Priority:** P1
**Effort:** XS–S
**Risk:** Low if pure extraction; core correctness if done incorrectly.

**Problem:** scoring and live probability own identical server-rotation helpers.

**Change:** create `engine/match/tiebreakServe.ts`, move `tbFlip`, `tiebreakServer`, and
`tiebreakOpenerFrom`, and import them in both modules. Expose only functions actually required.

**Verification:**

- existing scoring and probability suites remain byte-for-behavior identical;
- property/table tests cover opener, point index, and current server across arbitrary in-progress
  tiebreak states;
- no new RNG draw and no visualization dependency enters scoring.

### PR-03 — Remove the economy/calendar cycle

**Priority:** P1
**Effort:** XS–S
**Risk:** Low code change; high regression value because the failure was browser-only.

**Problem:** economy and calendar import each other. A TDZ crash already forced a duplicated literal.

**Change:** make `shared/dates.ts` own `WEEKS_IN_SEASON`; both modules import it. Calendar may
re-export `WEEKS_PER_YEAR` for compatibility. Replace the deliberate `52` and the function use only
after import order is acyclic.

**Acceptance:**

- the import graph has no economy↔calendar SCC;
- direct imports of economy and calendar initialize in either order;
- calendar/economy tests and production build pass;
- exactly one runtime owner remains for season length.

### PR-04 — Equal recovery for equal match-free weeks

**Priority:** P1
**Effort:** S plus bench runtime
**Risk:** Medium because it changes shipped condition traces.

**Problem:** manual skip adds only the rest bonus; medical withdrawal adds the full free-week
difference, currently eight points more.

**Change:** first add an equivalence characterization showing both paths. Capture before
distributions for condition/injury outcomes. Update skip recovery to
`recoveryBase - matchWeekRecoveryBase + restRecoveryBonus`, then update the test and evidence.

**Acceptance:**

- equivalent match-free scenarios end with equal condition;
- ledger, entry forfeiture, rankings, week closure, and stop reasons remain unchanged;
- zero RNG-state movement is demonstrated;
- the relevant fatigue/injury bench has documented before/after results and an explicit tuning
  decision.

## Wave B — Dependency direction and boundary typing

### PR-05 — Extract neutral names and collapse the coach SCC

**Priority:** P2
**Effort:** S
**Risk:** Low.

Move surnames/name selection from cohort to `engine/season/names.ts`. Coach and cohort import the
leaf. Verify deterministic name generation for fixed seeds and confirm coach, cohort, and
development no longer form a runtime SCC. Do not create a person factory or name service.

### PR-06 — Move ladder-rank projection out of snapshot

**Priority:** P2
**Effort:** XS–S
**Risk:** Low.

Move `kidLadderRank` to the ladder domain. College and snapshot import it from there. Confirm the
world module graph no longer contains birthday/college/snapshot and coachMarket/ending/college/
snapshot cycles. Snapshot must remain projection-only; mutation modules must not import it.

### PR-07 — Correlate worker requests and replies

**Priority:** P2
**Effort:** M
**Risk:** Medium at a central boundary; behavior should remain unchanged.

**Design:**

```ts
type SuccessReply = {
  tick: SnapshotReply
  advance: SnapshotReply
  exportSave: ExportReply
  peekSave: PeekReply
  // ...
}

type ReplyFor<R extends WorkerRequest> = SuccessReply[R['type']] | ErrorReply
```

The exact shape may use overloads or typed client methods if it produces clearer call sites. Add one
central `applySnapshotReply` that throws/asserts on an impossible success rather than silently
leaving stale state. Keep worker dispatch explicit and exhaustive.

**Acceptance:** a deliberately wrong success type fails TypeScript at both client and store tests;
all current command/error behavior and restart generation semantics remain unchanged; production
build passes.

### PR-08 — Restore engine/presentation dependency direction

**Priority:** P2
**Effort:** M
**Risk:** Medium because match display types are widely used.

Inventory consumers of rally, match stats, serve speed, `COURT`, timeline, and match clock. Choose
one owner:

- neutral presentation contracts/clock math in `shared/matchPresentation`, or
- all explicitly presentation-only modules under `viz/match`.

Outcome/scoring modules must not import presentation runtime. Add an architecture source test for
the allowed edge, then remove the old cross-import. Verify generated match records and rendered
replay are unchanged for fixed fixtures.

## Wave C — One authority at the UI boundary

### PR-09 — Project per-tier entry verdicts

**Priority:** P2
**Effort:** M–L
**Risk:** Medium; eligibility precedence is subtle.

Define a presentation-neutral DTO with stable reason codes, relevant threshold/cut, cap use,
outgrown status, and next eligible/scheduled week. Construct it beside engine availability and entry
gates; include it in snapshot or a typed worker query. Rewrite `tierState` to format/decorate rather
than decide.

**Acceptance:**

- table tests cover age, point band, open latch, junior/pro cap, acceptance, medical/layoff, and
  scheduling precedence;
- mounted Season and Calendar tests show the same reason as engine command rejection;
- removing the old UI classifier causes tests to fail before the new projection is wired;
- snapshot additions remain migration-free because snapshot is derived.

### PR-10 — Project quotes for command-affecting UI

**Priority:** P2
**Effort:** M
**Risk:** Medium if scope expands.

Start only with PlanWeekSheet. Have the engine/snapshot provide the price and structured caution/
block reasons it will enforce. UI owns copy and visual hierarchy. Do not move all display copy or
build a universal view-model layer. Extend to Home warnings only after a second demonstrated rule
copy remains.

### PR-11 — Consolidate tournament presentation, not actions

**Priority:** P2
**Effort:** S–M
**Risk:** Low.

Extract a pure `upcomingEventPresentation` and/or a small `TournamentOdds` display component for
venue URL, chance color/label, academy coverage, funds-short, and accessible ring text. Season and
Calendar retain separate enter/withdraw/confirm behavior.

Acceptance includes mounted tests for both screens, accessible names, one non-default academy
percentage, and no change to engine entry decisions.

## Wave D — Retrieval-aware decomposition

### PR-12 — Split protocol behind its existing import path

**Priority:** P2
**Effort:** L
**Risk:** Medium–high due broad type fan-out.

Split commands, responses/reply map, snapshot, profile/planning, events/finance, ladder/tournament,
offers/sponsors, and career/endings into cohesive modules. Preserve `shared/protocol` as a facade and
use correct type-only re-exports. Do this after PR-07 so the transport seam has a stable shape.

**Acceptance:**

- existing external import path remains valid;
- production build catches and passes all value/type exports;
- no module is created merely for one interface;
- engine primitives no longer conceptually depend on a UI aggregate where a neutral domain type is
  sufficient;
- representative tasks retrieve a materially smaller module set.

### PR-13 — Extract weekly lifecycle phases

**Priority:** P2
**Effort:** L
**Risk:** High; order and RNG are core invariants.

Before moving code, build fixed-seed characterization around every phase boundary: RNG state,
ledger, condition/injury, entries/tournament, ranking, events, endings, and final snapshot. Extract
named phases while keeping one explicit ordered `tickWeek` recipe. Start in the same file if that
makes review safer, then move cohesive phases to `world/*`.

Do not use an event bus, phase registry, dependency injection container, or callbacks into the
facade. Migrate behavior-shaped source pins alongside the relevant extraction.

### PR-14 — MatchViewer state-owner extraction

**Priority:** P2
**Effort:** L
**Risk:** Medium–high due timing, visibility, audio, and accessibility.

Extract exactly one playback clock/visibility composable and one audio-cue composable. Move controls
and commentary readout to prop-driven children. Characterize pause/resume, speed changes, hidden-tab
time, end applause, skip, retirement, reduced motion, and accessible live readout. Do not allow
children to own timers or re-import the full store.

### PR-15 — Season/App focused extraction

**Priority:** P2
**Effort:** L, best split into two branches
**Risk:** Medium.

- Season: event list, planner composable, practice/exhibition sections, and confirmation panels;
  screen remains the store-aware container.
- App: `useCareerWatermark`, navigation, and blocking-flow helpers; keep one centralized overlay
  precedence calculation.

Mounted tests must prove store switching, career-id switching, storage failures, dismissal, overlay
precedence, and mobile navigation. Do not turn every leaf into a store client.

### PR-16 — Source-pin retirement policy

**Priority:** P2
**Effort:** Ongoing M–L
**Risk:** Low when paired with behavior coverage.

Create an inventory of source pins classified as architecture, tooling/assets, behavior, copy/
layout, or occurrence/absence. Add a review rule that new pins require static-policy justification.
Convert the high-churn UI group as its owning feature is refactored. Make all slice helpers throw on
missing markers. Delete meta-infrastructure only when its consumers are gone.

## Wave E — Product depth

### PR-17 — Decide and implement the minimum relationship promise

**Priority:** P2 product / potentially P1 positioning
**Effort:** XL
**Risk:** High design/calibration scope.

First decide between:

1. **implement:** two slow hidden/blurred axes (wellbeing and trust), a small set of existing action
   inputs, observable reactions, a few refusal/negotiation thresholds, and ending consequences; or
2. **re-scope:** rewrite the third pillar to the personhood actually expressed by school, injuries,
   birthdays, imperfect knowledge, college, and retirement.

For implementation, write a mechanic spec before code: state, inputs, caps/decay, observability,
choices, failure states, save migration, snapshot, ending effects, and balance measures. Avoid a
large dialogue tree or daily-life simulation. A choice should have a persistent later echo.

**Acceptance:** player tests can explain why the daughter reacted without seeing an exact optimizer
formula; repeated pushing is not always dominant; old saves migrate; fixed seeds remain
deterministic; the README promise matches shipped mechanics.

### PR-18 — Give the exhibition sandbox one role

**Priority:** P3
**Effort:** XS for lab placement, M+ for real career mechanic
**Risk:** Product clarity.

Label and place the sandbox as a no-stakes training lab/demo, hide it from release, or give it normal
career cost/body/time consequences. Document the decision and test that the UI does not imply a
career action while bypassing the economy.

## Wave F — Bounded hygiene

### PR-19 — Comment and decision lifecycle

**Priority:** P2 retrieval
**Effort:** Ongoing; S per touched hub
**Risk:** Losing rationale if rushed.

Adopt the one-to-four-line invariant plus decision-ID convention. Start with protocol, world,
economy, calendar, and MatchViewer only as those files change. Add a compact area-to-current-decision
index; keep `decisions.md` append-only. Measure comment characters before/after but never gate on a
percentage.

### PR-20 — Remove verified dormant surface

**Priority:** P3
**Effort:** S–M
**Risk:** Save/API compatibility and asset provenance.

After final consumer checks:

- remove unconsumed ending handoff fields and reserved `conduct` member;
- remove the disabled future gender control but preserve the legacy save field if appropriate;
- resolve or remove the unwired weather prop;
- remove four verified unused exports;
- publish the seven future-life frames only when reachable, retaining masters;
- delete only verified orphan onboarding/finance CSS in screenshot-checked batches.

Each deletion should have a targeted test/build and a note if it changes public save/protocol shape.

### PR-21 — Consolidate shared small rules and UI variants

**Priority:** P3
**Effort:** M total, split by owner
**Risk:** Low.

Candidates with demonstrated repeat use: country names/flag emoji, horizon value, allocation
comparator, match stat rows, rank assignment, red/green ramp, world-match annotation, and
`SegmentedRow` chapter appearance. Extract one at a time with consumer tests. Do not create a
miscellaneous `utils.ts`; use domain-named modules.

### PR-22 — Tools, heavy lists, CSS, and measurement registry

**Priority:** P3
**Effort:** M
**Risk:** Accidentally dropping a reproducibility instrument.

Create one importable heavy-test manifest shared by Vite and runners. Add the tools registry and an
on-demand archival tools typecheck. Split global CSS into ordered tokens/base/shared/overlays/
feature imports only after orphan removal. Add generated reports for file size, cycles, source pins,
and doc lifecycle.

**Acceptance:** supported commands are discoverable; every retained probe has a reason/owner;
simulation serialization is unchanged; stylesheet cascade and screenshots are unchanged; generated
reports are clearly non-canonical.

## Proposal dependencies

```text
PR-01 current truth ───────────────────────────────────────────────┐
PR-03 economy cycle ──┐                                           │
PR-05 coach cycle ────┼─> PR-13 weekly decomposition              │
PR-06 world cycles ───┘                                           │
PR-07 typed replies ─────> PR-12 protocol split ─────> PR-09/10 UI verdicts
PR-11 event presentation ────────────────────────────> PR-15 Season extraction
PR-16 pin policy ────────────────────────────────────> PR-13/14/15 safe movement
PR-19 comment lifecycle ─────────────────────────────> every touched hot file
PR-17 relationship promise depends on PR-01 product truth and benefits from PR-09 verdict patterns
```

## Deliberately rejected proposals

- A clean-architecture or domain-driven rewrite.
- A generic command bus replacing the worker switch.
- One service/interface per engine domain.
- One file per migration, tier, DTO, or UI card.
- Screen-specific runtime snapshots before profiling transfer cost.
- A hard maximum file length or comment percentage.
- Removing balance tools, save fixtures, retries, or serialized tests for repository size.
- Adding Obsidian/vector search as a second source of truth before fixing Markdown lifecycle.
- A mass source-comment purge or automatic CSS deletion based only on text reachability.

## Definition of success

The review has been acted on successfully when:

- one rule owner determines both tiebreak scoring and probability;
- the named runtime cycles are gone;
- equal match-free mechanics produce equal recovery;
- every worker request is statically paired with legal success replies;
- UI entry explanations come from the same verdict used by the command;
- canonical context describes the shipped game and one current roadmap;
- weekly and match-viewer changes can be made in focused modules without hiding order/state owners;
- source pins are mostly policy, not UI behavior;
- the third product pillar is either mechanically true or honestly worded;
- measured representative tasks retrieve less text and fewer unrelated modules with identical
  deterministic behavior.
