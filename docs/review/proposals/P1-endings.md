<!-- Build-ready proposal derived from the 2026-08-01 full review (docs/review/). Reviewed at b7a9358. -->

# P1 – Career Endings: bankruptcy, retirement, the last injury, and the reckoning

One-line: gives every career a terminal state – bankruptcy with a grace window, age-out/retirement, career-ending injury – plus the end-of-career reckoning screen, so the game's honest-brutal economics finally has a bite.

**Priority:** Tier 1 – product-critical · **Effort:** L (2-5d) · **Risk:** med

## Why (problem)

- **No run can end.** `world.fundsCents < 0` adds a `'funds'` stop reason and the weeks keep ticking (src/engine/world.ts:4853); retirement has no code path; the conveyor retires every rival (`CONVEYOR.hardRetireAge: 34`, src/engine/season/conveyor.ts:67) but cannot touch her – she is not in `world.cohort`. Confirmed critical by two independent reviewers (docs/review/README.md:33, docs/review/04-concept-plot-narrative.md:22, docs/review/03-game-design-mechanics.md:26).
- **The promise is public.** concept-ru.md:33 sells six finales (champion / solid pro / eternal qualifier / bankruptcy / burnout / injury). docs/specs/adult-tour-and-endings.md shipped its ladder half (W15/W35/W100 with `prizeCents`, season/calendar.ts:281-336; `maxAgeYears: 18` on J tiers, calendar.ts:128/161/207) but not one of its §4 endings.
- **A bankrupt family today gets an unending nothing** – the exact anticlimax a game whose brand is honesty cannot afford (review 04, finding 1). The 60-80% survival target in docs/specs/career-outcome-targets.md is unwireable as a bench gate until bankruptcy is a state, not a stall.
- **All the data already exists.** Her age: `kidAgeYears`/`birthdayTurning` (world.ts:1263, 1287). Her injuries: `rollInjury` + persisted `injuryHistory` (world.ts:1917-2043, field at world.ts:359). Her life for the epilogue: `world.milestones` (v18, world.ts:412), `trophiesByTier` (v31), `seasonHistory` (v14). Her money: the `accrueFinance` choke point (world.ts:509-520). This is a pure state machine over shipped state – which is why the review ranked it action #1.

Out of scope, explicitly: the quit ending (needs morale – career-outcome-targets.md defers it to Phase 6; it is P2's), the burnout finale (same dependency), and the full fork-at-19 decision screen (adult spec §7 B2) – though this package ships the engine command the fork will reuse.

## What (proposed change)

A terminal `CareerEnding` latch on `WorldState`, four ending types now, engineered so P2 can add `'quit'` without another redesign:

1. **`'bankruptcy'`** – funds below zero for `ENDINGS.bankruptcyGraceWeeks` CONSECUTIVE weeks (candidate N=8, swept by bench before pinning, per adult spec B4: "N is a design decision... measured before it is picked"). One bad week is never death: the spell counter (`debtSinceWeek`) resets the week funds recover. The existing `'funds'` stop (world.ts:4853) becomes the warning phase – it already halts every advance while below zero; we add the countdown to its copy and a debt strip on Money. Note: the spec's "unable to fund the cheapest entry" clause is redundant – with funds < 0 no entry fee is payable (`advanceWeeks` already tests `fundsCents >= TIERS[e.tier].entryFeeCents`), so consecutive-weeks-below-zero is the whole definition.
2. **`'injury'`** – a freshly rolled `'severe'` injury (top band, 2.5% of injuries, economy.ts:987-992) landing on a body with ≥2 prior `major`/`severe` entries in `injuryHistory`. A pure post-draw predicate: zero new draws, no re-mapping of the severity bands, rare enough to be a story (bench verifies ~1-2% of careers). The knock thread already aims repeat injuries at the same body part (world.ts:1949-1955), so the fiction writes itself.
3. **`'retired'`** – a player-initiated `retire` command, valid from age 19 (owner call 4, adult spec §6: "stop CAN be the right answer at 19... a real ending without shame"). This is the engine half of the future 19-fork; the fork's own decision screen ships later and just calls it.
4. **`'age-out'`** – forced on the birthday week she turns `ENDINGS.hardStopAgeYears` (= 34, single-sourced from `CONVEYOR.hardRetireAge`), per adult spec B6: "the game stops asking somewhere in the thirties, and before that it is hers to make" – the retire command is the "hers to make" half.

Plus **the reckoning screen**: a full-screen `EndingScreen.vue` takeover ("was it worth it") built on career-total earned vs spent (new persisted counters – `financeWeeks` prunes to a 60-week window, world.ts:350-352, so the totals are a new fact, exactly the argument `trophiesByTier` made at world.ts:305-318), the exact net (`fundsCents` vs `STARTING_FUNDS_CENTS`), seasons played, best season-end rank, titles, and the milestone ledger. An epilogue grade maps retired/aged-out careers onto the concept's champion / solid pro / eternal qualifier flavors from `seasonHistory` best `endRank` + W-tier titles – squaring five of concept-ru.md's six finales (burnout waits for P2). Per owner call 3 (adult spec §6, 30.07): a scroll, not a handover – one action, "Start a new career", which is also the "raise a new star" hook of decisions.md:15 in copy only.

Defended design choice: **the latch lives on the world and blocks at `advanceWeeks`/command level; `tickWeek` stays total (never early-returns on an ended world).** This is the one place a naive build corrupts saves: `restoreRng` (src/worker/sim.worker.ts:66-71) replays `tickWeek` on a default no-input probe world to restore the MAIN stream position, and a probe that goes bankrupt mid-replay must keep drawing identically. Runner-up (guard inside `tickWeek`) is listed under Risks – it breaks RNG restoration by construction.

## How (implementation sketch)

1. **`src/shared/protocol.ts`** – types first:
   - `StopReason` union (line 218): add `'ending'`; `STOP_PRECEDENCE` (line 243): prepend it – an ending outranks even the medical trio because its surface replaces the app shell.
   - New `CareerEndingType`/`CareerEnding { type, week, ageYears, detail?: string }`, `EndingView` (ending + reckoning numbers + grade), `DebtView { sinceWeek, weeks, graceWeeks }`.
   - `Snapshot` (line 1378): add `ending: EndingView | null` and `debt: DebtView | null`.
   - `ToWorker` (line 1608): add `{ id, type: 'retire' }`.
2. **`src/engine/ending.ts`** – new leaf module (no Vue/Pinia, no world import; the world calls it, same direction as engine/knock.ts): `ENDINGS` knobs (`bankruptcyGraceWeeks`, `retireMinAgeYears: 19`, `hardStopAgeYears` re-exported from `CONVEYOR.hardRetireAge`), `detectEnding(view): CareerEnding | null` over a narrow view `{ week, fundsCents, debtSinceWeek, injury, injuryHistory, birthMonth, birthDay }`, `epilogueGrade(seasonHistory, trophiesByTier)`, and the per-type copy.
3. **`src/engine/world.ts`** – state + wiring:
   - `WorldState` (line 200): `ending: CareerEnding | null`, `debtSinceWeek: number | null`, `careerTotals: { earnedCents: number; spentCents: number }`. Initialize in the `createWorld` literal (world.ts:4005).
   - `accrueFinance` (world.ts:514): also fold each signed delta into `careerTotals`. Zero draws.
   - End of `tickWeek` (function at world.ts:4171), after the step-6 housekeeping: update `debtSinceWeek` (set on first negative week, clear on recovery), then `if (!world.pendingTournament && world.ending === null) world.ending = detectEnding(...)`, then on latch `addEvent` one `keep` news row. Pure state, ZERO draws, and `tickWeek` gets NO early-return guard (see RNG note below).
   - `advanceWeeks` (world.ts:4780): top guard `if (world.ending) return ['ending']` beside the `pendingTournament`/`pendingKnock` returns (4781-4791); in the loop's stop collection (4833-4854) add `if (world.ending) stops.add('ending')`.
   - `retireCareer(world)` export: validates `kidAgeYears(...) >= ENDINGS.retireMinAgeYears` and no pending tournament/knock, latches `'retired'`.
   - A shared `guardNotEnded(world)` throw at the top of the mutating entry points: `enterEvent`, `withdrawEvent`/`cancelEntry`/`skipEvent`, `bookVacation`, `bookPractice`, `hireCoach`, `setCoachOnEventWeeks`, `decideKnock`, `signOffer`, `setPhysio`, `setPlan` – the engine re-validates every command; the worker is not the gate.
   - `toSnapshot` (world.ts:5259): emit `ending` via `buildEndingView(world)` (reckoning = `careerTotals`, net vs `STARTING_FUNDS_CENTS[background]`, `seasonHistory`, `trophiesByTier`, `milestones`) and `debt` while `fundsCents < 0`.
4. **Schema v35**: bump `SAVE_SCHEMA_VERSION` 34→35 (world.ts:177). Append the v34→v35 block in src/engine/migrations.ts (after line 858, same defensive/idempotent style as v33→v34 at 820-858): `ending: null`; `debtSinceWeek: fundsCents < 0 ? week : null` (the spell restarts on migration – generous, safe); `careerTotals` back-filled from `financeWindow(save.financeWeeks ?? [], 0)` – exact for careers younger than the 60-week window, documented undercount beyond it (the headline net stays exact via funds delta). No draws, no field removed.
5. **Worker (src/worker/sim.worker.ts)**: new `'retire'` case calling `retireCareer` + autosave + snapshot; `'tick'` (line 82) and `'advance'` handlers naturally no-op via the engine guards. `restoreRng` untouched.
6. **Store (src/stores/game.ts)**: `retire()` action mirroring `loadCareer` (line 265) shape.
7. **UI**:
   - `src/components/EndingScreen.vue`: full-screen takeover mounted in App.vue's top-level chain (after the OnboardingWizard branch, before the tab shell) whenever `game.snapshot?.ending` – gated on the SNAPSHOT FIELD, not the stop reason, for exactly the reason App.vue:659-668 gives for the knock: permanent state must survive any fresh snapshot. Four copy/art variants (typographic placeholders; owner art requested early per adult spec's own risk note), reckoning table, milestone strip, grade line, one primary button "Start a new career" reusing MoreScreen's existing reset-to-onboarding flow (MoreScreen.vue:335 and the swap noted at :172 – lift that handler to App or emit up). Reloading an ended career from the Careers list simply re-mounts the takeover – the list is the archive.
   - App.vue: gate `showKnock`/`showInjuryStop`/`showSeasonSummary`/stop toast (lines 627-708) on `!game.snapshot?.ending`; extend `STOP_REASON_TEXT.funds` with the grace countdown from `snapshot.debt`.
   - MoneyScreen.vue: a debt warning strip ("N weeks below zero – M until the money runs out for good") off `snapshot.debt`. MoreScreen.vue: a "Retire" danger-zone button (visible from age 19, existing ConfirmDialog pattern).
8. **Bench**: `tools/endings-bench.ts` + `bench:endings` script (package.json:13-17 pattern), reusing econ-bench's `runCareer` preset/horizon machinery (tools/econ-bench.ts:14-24): per preset × ≥40 seeds × 14→20, report ending-type rates in BOTH bases (conditional and of-all-starts – the targets spec demands both), debt-spell length distribution, and a `bankruptcyGraceWeeks` sweep over {4, 6, 8, 12}; pin N from the sweep against the 60-80% survival row.

**RNG draw-count implications** (invariant 1): detection, the debt counter, the totals and the latch are pure state – zero draws on any stream; no new sub-stream is needed because all four endings are deterministic. `tickWeek` remains total: a latched world that is ticked anyway (only the `restoreRng` probe ever does) produces the identical MAIN draw sequence, so the frozen capture 41550/e6b0c709 (tests/condition.test.ts:82-110) cannot move and load-replay stays exact. The injury predicate reads the already-drawn band – `seed:injury:<week>` is byte-identical.

## Test plan

TDD order:

1. **tests/ending.test.ts (new, red first)**: grace latch fires at exactly N consecutive weeks and resets on one solvent week; severe-injury predicate needs both the fresh severe AND ≥2 prior major/severe; age-out fires on the week `birthdayTurning` says 34; `retireCareer` refuses under 19 and with a pending tournament/knock; `careerTotals` accrual reconciles with `financeWindow` over a short career; `epilogueGrade` classification table.
2. **Invariance (extend tests/condition.test.ts B1 block)**: a twin world driven below zero to a bankruptcy latch keeps the MAIN capture at 41550 draws / hash e6b0c709, and post-latch `tickWeek` calls still draw identically to the unended twin – the test that makes the `restoreRng` trap unbuildable.
3. **Schema**: bump → tests/goldenSaves.test.ts goes red by design (goldenSaves.test.ts:31-33) → add tests/fixtures/saves/v35.json per the corpus README → green; tests/migrations.test.ts cases for the v34→v35 back-fill (totals fold, debt spell restart, `ending: null`).
4. **Contract tests (tests/world.test.ts / round-style)**: `advanceWeeks` on an ended world returns `['ending']` without moving `world.week`; every guarded mutator throws; `'ending'` leads STOP_PRECEDENCE.
5. **Persistence (tests/saves.test.ts pattern)**: autosave→load round-trip of an ended career preserves `ending`, `week`, `careerTotals`; the loaded snapshot carries `ending`.
6. **Screen test** following the existing source-level screen-test pattern (e.g. tests/redesign-home.test.ts): EndingScreen gates on `snapshot.ending`, App.vue suppresses the other overlays behind it, MoreScreen's Retire is age-gated.
7. **Bench last**: `bench:endings` sweep → pin `bankruptcyGraceWeeks` → tests/endings-bench.test.ts (sim project, generous timeout like tests/econ-bench.test.ts:8) asserting determinism, career-ending-injury rate ≤2% of careers, and blended 14→18 survival inside 60-80% (career-outcome-targets.md ladder row) at the pinned N. Record the pinned N and the sweep table in docs (adult-tour-and-endings.md B4 marked shipped).

Golden-save impact: one new fixture (v35.json), zero changes to v0-v34 fixtures; all must still migrate green.

## Acceptance criteria

- [ ] Funds below zero for N consecutive weeks latches `'bankruptcy'`; a spell broken by one solvent week never does; N was picked from a bench sweep, not guessed.
- [ ] A fresh `'severe'` injury on ≥2 prior major/severe layoffs latches `'injury'`; bench shows it in ~1-2% of careers.
- [ ] `'age-out'` latches the week she turns 34; `retire` works from 19 and is refused younger.
- [ ] Ended world: `advanceWeeks` returns `['ending']` with no tick; all mutating engine commands refuse; reload shows the takeover again.
- [ ] `tickWeek` has no ended-world early return; MAIN capture 41550/e6b0c709 green; loading an ended career restores the RNG position exactly.
- [ ] SAVE_SCHEMA_VERSION = 35, append-only migration, v35.json fixture, full golden corpus green.
- [ ] EndingScreen shows type-specific copy, total earned vs total spent, exact net vs starting funds, seasons/best rank/titles/milestones, epilogue grade, and one working "Start a new career" path into onboarding.
- [ ] Money screen and the `'funds'` stop copy surface the grace countdown while in debt.
- [ ] `bench:endings` reports every rate in both bases; blended 14→18 survival lands in 60-80%.
- [ ] `grep -rn "vue\|pinia" src/engine/ending.ts` finds nothing.

## Risks & alternatives

- **The restoreRng trap** (highest): guarding `tickWeek` on `ending` desyncs the probe replay in sim.worker.ts:66-71 and silently shifts every loaded career onto a wrong stream. Mitigated by design (total `tickWeek`) and by test #2. P0/other proposals persisting RNG state (review README action 3) would retire this risk class entirely; P1 does not wait for it.
- **Grace N is a balance call.** Wrong N pushes survival outside 60-80%. It is one constant, swept before pinning, gated after.
- **Alternative bankruptcy shape (runner-up)**: a hard debt floor (`funds < -X`) – rejected: one catastrophic medical bill (severe onset + rehab, world.ts:1966-1978) could end a career in a week, which is exactly the instant death the spec's warning-phase demand forbids.
- **Alternative injury shape (runner-up)**: a new severity band above `'severe'` – rejected: re-mapping `severityBands` cum thresholds changes what existing careers' already-drawn sub-stream rolls mean; the accumulation predicate is post-draw and touches nothing shipped.
- **Ending as toast-only stop reason (runner-up)**: cheapest, but reproduces the "unending nothing" anticlimax the review flagged; the takeover IS the product here.
- **Art is the long pole** (adult spec's own closing risk): ship typographic placeholders, request the four ending frames from the owner at build start, not at the end.
- **Reckoning totals for pre-v35 careers undercount** (financeWeeks 60-week prune; `SeasonHistoryEntry.fundsDeltaCents` at protocol.ts:314+ nets income against expense so it cannot reconstruct gross) – accepted, documented in the migration block; the headline net is exact for everyone.

## Dependencies

None – this is deliberately the first Tier-1 package. Forward hooks: P2 (morale/relationship) plugs `'quit'` into the same `CareerEnding` union and the same takeover surface; the fork-at-19 decision screen (adult spec §7 B2) reuses the `retire` command and `EndingScreen`'s reckoning as its "everything on the table" view.
