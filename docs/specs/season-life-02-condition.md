# Spec — Season Life slice B: condition/fatigue + availability gate (Wave 1, keystone)

**Branch:** `feat/condition-gate` · **Worktree:** `/Users/letulip/Projects/Claude/tb-condition`
**Depends on:** nothing (off current `main`, save schema v11 → **v12**).
**Ships with match-strength coupling OFF** so ZERO stored match records change and the v11 golden
match fixtures stay byte-identical.

Read these in full before writing code (line numbers are hints from a prior reading — anchor on
symbol names): `src/engine/world.ts`, `src/engine/economy.ts`, `src/engine/season/calendar.ts`,
`src/engine/migrations.ts`, `src/shared/protocol.ts`, `src/ui/HomeScreen.vue`.

## Goal
A per-week **condition** (0–100, 100 = fresh) that drains with training/tournaments and recovers
with rest, plus an **availability gate** that genuinely stops a player entering every tournament —
surfaced so it reads as a body getting tired, not a hidden rule. This is the keystone; Slice C
(injuries + physio) will populate the `injury` field that this slice wires but leaves `null`.

## THE INVARIANT (do not break)
The per-week **MAIN** RNG stream (`rng` passed to `tickWeek`) draw count/order must be **byte-identical**
before and after this slice, and must never depend on player input, funds, plan, or condition. New
randomness is a purpose-scoped sub-stream `rngFromSeed(seed + ':purpose:' + key)` or a post-draw
multiply. `accrueCondition` uses **zero** RNG (pure arithmetic). See test **B1** below — it is
mandatory and blocks merge.

## WorldState additions (`world.ts` ~61-102)
Add exactly four fields (all persist automatically via `JSON.stringify` in `compressWorld`):
```
condition: number                    // 0..100, 100 = fresh; written only by accrueCondition. fatigue is derived (100 - condition), NOT stored.
injury: { kind: string; severity: 'minor'|'moderate'|'major'|'severe'; weeksRemaining: number; totalWeeks: number; sinceWeek: number } | null   // null = healthy. Stays null in slice B; Slice C populates it.
injuryHistory: Array<{ kind: string; severity: string; week: number; weeksOut: number }>   // append-only, prune to last 20
physioActive: boolean                // default = (profile.coachSetup === 'hired')
```

## Save migration v11 → v12
- Bump `SAVE_SCHEMA_VERSION = 12` (`world.ts:38`).
- In `migrations.ts`, append AFTER the `if (v < 11)` block and BEFORE the final version guard, in the
  same append-only/idempotent/deterministic style:
```
if (v < 12) {
  // v12 added Season-Life availability: persisted condition + injury/physio state (Slices B+C).
  // Pre-v12 saves never stored these; backfill to a healthy default. condition=100 also keeps the
  // (currently-off) match-strength coupling neutral, so no historical shift.
  if (typeof save.condition !== 'number') save.condition = 100
  if (save.injury === undefined) save.injury = null
  if (!Array.isArray(save.injuryHistory)) save.injuryHistory = []
  if (typeof save.physioActive !== 'boolean') save.physioActive = save.profile?.coachSetup === 'hired'
  v = 12
}
```
- Initialize the same four fields in `createWorld` (condition:100, injury:null, injuryHistory:[],
  physioActive: profile.coachSetup==='hired') and in `seedWorldForV6`.
- **Golden-save corpus:** every v11 fixture must load with identical seed/week/funds/results/rank/
  cohort and ONLY the four new fields at the defaults above. Add a `tests/fixtures/saves/v12.json`
  following the existing corpus pattern. Re-running `migrateSave` on a v12 save is a no-op.

## Economy knobs (`economy.ts`) — add what B uses
```
ECONOMY.condition = {
  start: 100, min: 0, max: 100,
  restBase: 4, restSlope: 6, trainSlope: 6,
  tournamentStrain: { local: 8, regional: 16, national: 26, itf: 34 },
  offSeasonGain: 4,          // extra recovery on off-season (weeks 49-51) and exam weeks
  matchStrengthFloor: 1.0,   // condFactor = floor + (1-floor)*(condition/100); 1.0 = coupling OFF. DO NOT wire the coupling in this slice.
}
ECONOMY.availability = {
  minConditionToEnter: { local: 20, regional: 30, national: 40, itf: 45 },
  examWeeks: [[24, 25]],     // season-week offsets blacked out for school
}
```
(The injury* knobs and `ECONOMY.physio` belong to Slice C — do not add them here.)

## Weekly tick — new step "1c"
Insert ONE new linear step in `tickWeek` BETWEEN `resolveGear(world)` (~771) and
`const ids = cohortIds(world)` (~773) — it must sit here (not inside the `if (!world.pendingTournament)`
block) so it runs exactly once per real week including reveal weeks. In slice B step 1c is just:
```
// 1c. Season-Life availability. Pure state, zero main-stream draws.
//     Slice C will add rollInjury(world) above this and resolvePhysio(world) below it.
const playedThisWeek =
  world.season.some(e => e.week === world.week && world.entries.includes(e.id)) &&
  world.injury === null                 // a fresh injury (Slice C) => walkover; injury is always null in B
accrueCondition(world, playedThisWeek)
```
`accrueCondition(world, playedThisWeek)` — pure, clamp 0..100:
```
restGain    = restBase + restSlope * (plan.rest / 100)
trainStrain = trainSlope * (plan.train / 100)
matchStrain = playedThisWeek ? tournamentStrain[enteredTierThisWeek] : 0
offGain     = isBlackoutWeek(world.week) ? offSeasonGain : 0
condition   = clamp(condition + restGain - trainStrain - matchStrain + offGain, 0, 100)
```
Pivot check: balanced 75/25 non-playing = +1/wk; grind 100/0 = −2/wk; full rest 0/100 = +10/wk; one
national at balanced = +1 − 26 = −25 that week.

## Availability gate — ONE helper, three surfaces (fatigue is a SOFT choice)
**Owner rule:** fatigue must NOT forbid entry. A tough parent can say "everyone's tired, go compete,
rest after" — racing while exhausted is a deliberate player CHOICE with consequences, not a block.
Only `injured` and `unavailable` (school/exam) are HARD blocks; `fatigued` is a warned, enterable
caution.

`availabilityStatus(world, event) → { level: 'ok' | 'caution' | 'blocked'; reason?: 'injured'|'fatigued'|'unavailable'; detail?: string }`,
precedence **injured > unavailable > fatigued**:
- `injured` → `level: 'blocked'`: `world.injury !== null` (dead branch in B — always false — but wired).
- `unavailable` → `level: 'blocked'`: `isBlackoutWeek(event.week)` = off-season tail (49-51, already
  event-free) OR an exam block (`ECONOMY.availability.examWeeks`).
- `fatigued` → `level: 'caution'` (SOFT, enterable): `world.condition < ECONOMY.availability.minConditionToEnter[event.tier]`.
- else → `level: 'ok'`.

Wire the SAME helper at all three surfaces so engine and UI cannot desync:
1. **`enterEvent`** — after the point-band `outgrown` check (~841), before charging the fee (~842):
   throw ONLY when `level === 'blocked'`. For `level === 'caution'` (fatigued) DO NOT throw — allow
   entry; it is the player's choice. Copy for the hard blocks (short dash only): `"School exams this
   week – no tournaments."` / (C, dead in B) `"Injured – back in N weeks."`
2. **`upcomingEvents`** (~926-956) — call `availabilityStatus`. A fatigued event keeps
   `eligible: true` (she CAN enter); surface it via a NEW soft channel `cautionReason?: 'fatigued'` +
   `cautionDetail?: string` so the card renders enterable-but-flagged. `ineligibleReason` stays for
   HARD states only — widen it to `'locked'|'outgrown'|'injured'|'unavailable'` (those set
   `eligible: false`).
3. **`advanceWeeks` deadline-soon filter** (~892-898) — exclude only HARD-blocked events
   (`level === 'blocked'`). A fatigued event is enterable, so the sim MAY still stop-for-deadline on
   it so the player can make the tough call.

Consequence of pushing through is EMERGENT — add NO special penalty: playing fatigued already drains
condition further via `tournamentStrain` (immediate deeper hole) and, once Slice C lands, raises the
injury threshold via the playing multiplier. Do not add an extra fatigue-entry penalty.

Also guard the entered-then-injured branch (`world.ts:785-789`) as
`if (enteredThisWeek && world.injury === null) { chargeTravel; computeShadowTournament }` — a no-op in
B (injury always null) that prepares C's walkover. Do not otherwise alter travel/shadow/match logic.

## Protocol (`protocol.ts`)
- `Snapshot` += `condition: number`, `injury: {kind;severity;weeksRemaining;totalWeeks}|null`,
  `physioActive: boolean`. Populate all three in `toSnapshot` (`world.ts:1083-1112`); `injury` is
  always null in B.
- `UpcomingEvent`: widen `ineligibleReason` (HARD blocks only) to `'locked'|'outgrown'|'injured'|'unavailable'`; ADD a soft-warning channel `cautionReason?: 'fatigued'` and `cautionDetail?: string` (a fatigued event stays `eligible: true`).
- Leave `WorldEventType`/`WorldEventCategory` unions, `SeasonSummary.weeksInjured`, and `StopReason`
  to Slice C (B emits none of those events).

## UX (`HomeScreen.vue`)
- Condition row: replace the hard-coded `CONDITION_FILLED = 8` (~72) with
  `Math.round(snapshot.condition / 10)`; drop `title="Phase 4"` (~288). Keep the existing
  `conditionColor()` ramp; make the bar read amber approaching a tier floor and red below it.
- Add an availability chip near the condition row / "This week" block: `"Fit"` (green) /
  `"School break – exams"` (grey when current/next week is a blackout). The `"Injured …"` red state
  comes alive in C (bind to `snapshot.injury`, null in B). Copy uses short dash "–".
- Upcoming cards: `'fatigued'` is NOT disabled — Enter stays ACTIVE, styled as a risky choice
  (amber) with the warning "Exhausted – race anyway? Rest would be wiser." (a "Push through?" confirm
  is nice-to-have if cheap). HARD blocks render disabled with a physical reason: `'unavailable'` →
  `"School exams this week"` (grey); `'injured'` (C) → `"Injured until wk N"` (red).
  `'locked'/'outgrown'` unchanged.
- Add a small physio toggle bound to `snapshot.physioActive` near the condition row (its cost lever
  is billed in C; in B the toggle just reflects/sets the flag).

## Acceptance tests (write FIRST, TDD)
- **B1 invariance (blocks merge):** for seed `"bench-working-0"`, capture the full MAIN-stream draw
  sequence for weeks 1..52 from a build with step 1c stubbed vs. the real slice, and assert
  byte-identical; also assert cohort, results, kidRank, and every AI-tournament record match.
- **B2 condition dynamics:** from 60, balanced 75/25, no events, tick 10 → ~70 (+1/wk). Grind 100/0
  from 100, tick 30 → ~40 (−2/wk). Rest 0/100 from 40, tick 6 → 100 (clamped).
- **B3 tournament strain:** condition 100, balanced, enter+play one national → that week ~75.
- **B4 fatigue = soft choice:** condition 35 → `enterEvent(national)` SUCCEEDS (it is a choice), does
  NOT throw; `upcomingEvents` marks the national `eligible: true` with `cautionReason: 'fatigued'`;
  entering then playing drops condition by ~`tournamentStrain.national` that week. `enterEvent(local)`
  succeeds with no caution.
- **B4b hard blocks still throw:** force `world.injury` non-null → `enterEvent` THROWS on every tier,
  `eligible: false`, `ineligibleReason: 'injured'`; an event in an exam block → throws,
  `ineligibleReason: 'unavailable'`.
- **B5 school gate:** entering an event in an exam block throws (`level: 'blocked'`);
  `upcomingEvents` marks it `eligible: false`, `ineligibleReason: 'unavailable'`.
- **B6 three-surface parity:** for a fixed world, `fatigued` is consistently caution/enterable across
  all three surfaces (enterEvent does NOT throw; `upcomingEvents` → eligible + `cautionReason`;
  `advanceWeeks` MAY stop-for-deadline); `injured`/`unavailable` are consistently blocked (enterEvent
  throws; `eligible: false`; excluded from the deadline filter).
- **B7 snapshot/UI:** `toSnapshot` carries condition; `HomeScreen` shows `round(condition/10)` filled
  blocks; no "Phase 4" title.
- **B8 migration/golden corpus:** every v11 golden save loads with the four defaults and identical
  seed/week/funds/results/rank; re-running `migrateSave` on the v12 output changes nothing.

## Gate (Definition of Done)
`npx vue-tsc -b` → 0. `npx vitest run` → all green (incl. B1 invariance + golden corpus). `npm run
build` clean. Do NOT `git push`. Do NOT edit `docs/decisions.md`. Commit spec + code + tests on
`feat/condition-gate`. In your final summary, confirm B1 passes and list which files changed so the
architect can browser-verify the gate UI before the owner merges.
