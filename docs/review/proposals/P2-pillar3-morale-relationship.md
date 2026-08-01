<!-- Build-ready proposal derived from the 2026-08-01 full review (docs/review/). Reviewed at b7a9358. -->

# P2 – Pillar 3 Minimum Viable Psyche: morale + parent-kid bond as mechanics

One-line: A two-variable psyche layer (kid morale, parent-kid bond) wired only to levers that already exist, persisted at schema v35, feeding diary tone, a small honest match-day composure factor, and the quit-arc trigger surface – with zero MAIN-stream draws by construction.

**Priority:** Tier 1 – product-critical · **Effort:** L (2-5d) · **Risk:** med

## Why (problem)

- The game's most differentiating promise is prose. README.md:24 sells pillar 3 in present tense ("Morale, parent-child relationship, burnout, school-vs-tennis, growth spurts"), and docs/lore/setting.md:86-88 – a doc that opens with "everything here is read out of the shipped build" – claims she "has morale … a relationship with the parent … and the right to quit". `grep -rn "morale|burnout|relationship" src/engine` finds nothing mechanical: only an academy comment (academy.ts:49), sponsor-contract prose (world.ts:3061, 3456) and a physio note (coach.ts:233). Confirmed twice by review skeptics (docs/review/03-game-design-mechanics.md:24, 04-concept-plot-narrative.md:24).
- The only cost of a pushy-parent grind today is physical. The knock is a real two-cost decision (engine/knock.ts, measured negative-EV in tools/knock-rate.ts), injuries and condition bite – but there is no rebellion, no relationship debt, no path to the quit arc. docs/specs/career-outcome-targets.md:52 explicitly defers the quit mechanic to "the morale system (Phase 6)"; the 5-10% quit target (line 25) is unwireable until this lands.
- The wiring targets already exist and are idle: composure enters the point model only on break points at max 0.03 (match/point.ts:56, 124-126) and review 03:32 names it "the natural carrier for a future morale coupling"; the diary has full mood plumbing (DiaryFacts/WeekClaims licences, diary.ts:1934); the Kid screen's Confidence tile currently just mirrors `snapshot.condition`, duplicating Home's ring (KidScreen.vue:15).

## What (proposed change)

One new pure engine module, `src/engine/psyche.ts`, and one new persisted field `world.psyche: { morale: number; bond: number; lowMoraleWeeks: number }` (schema v34 → v35).

**Two variables, different physics:**
- `morale` (0..100, start 70) – how she feels about tennis this month. Fast: moves with the week's load, results, injuries, holidays; drifts 5%/week toward a setpoint of 60 (a kid's natural buoyancy).
- `bond` (0..100, start 75) – the trust account. Slow: moves ONLY on parent decisions (knock pushes, flying her out hurt, grinding through exams/off-season, skipped vacations, birthdays), never on scorelines. Regresses 0.5/week toward 70 – old wounds heal over about a season, which is what makes the quit arc "reversible" per career-outcome-targets.md:48.

**Every update is pure arithmetic, ZERO draws on any stream.** This is the strongest possible answer to the frozen-capture invariant (tests/condition.test.ts B1, 41550 draws / e6b0c709): nothing to prove per-stream because the tick takes no new draws at all. Any copy-selection randomness happens at snapshot time on purpose-scoped streams (`seed:psyche:<week>`), the exact pattern kidLife.ts:20-22 and buildKnockPrompt (knock.ts:366) already use.

**Weekly deltas (starting numbers – the bench tunes them):**

| Trigger (existing lever) | morale | bond |
|---|---|---|
| drift/regression | +0.05×(60−m) | +0.5 toward 70 |
| plan.train ≥ 85 / ≤ 60 (WEEK_PLAN_PRESETS, protocol.ts:72-76) | −2 / +1 | – |
| exam week (isExamWeek, calendar.ts:481) and train > 60 / train ≥ 85 | −3 | −2 |
| off-season week (calendar.ts:470) at train ≤ 75 / ≥ 85 | +2 / – | – / −2 |
| vacation week resolved (resolveVacation, world.ts:2751) | +6 | +4 |
| season ends with zero vacations booked (boundary block, world.ts:4181) | – | −6 |
| birthday week (birthdayTurning, beside markBirthday world.ts:1310) | +2 | +3 |
| knock week pushed through (knockGoverns, knock.ts:291) / rest week | −2/wk / +1 | – |
| knock decision at decideKnock (world.ts:2304): push / push on repeat part / rest | – | −3 / −5 / +2 |
| played hurt: arrival clearance === 'warn' (medicalClearance world.ts:1403; band economy.ts:934-941) | −4 | −4 |
| injury onset / each laid-up week | −6 / −1 | – |
| finalizeTournament (beside seasonWins++ world.ts:3672-3675): title / lost final / early exit / loss streak ≥ 3 | +6 / +2 / −2 / extra −2 | never |

Sanity: an all-grind no-results career equilibrates near morale 20 (low band); an all-light one near 80. A push-everything season costs bond ~25-30 net against the regression; a caring career sits 75-85.

**Three outputs, all small and honest:**
1. **Match-day composure factor** at the composition point kidMatchPlayerFor (world.ts:670-697), multiplying composure only, beside conditionMatchFactor: neutral band morale 40..80 → exactly 1.0; linear to 0.92 at 0 and 1.03 at 100. Since composure only acts on break points via BIG_POINT_MAX_PENALTY 0.03, the worst case moves p by ~0.0012 on break points – Klaassen-Magnus subtle, as calibrated. Zero RNG, post-derivation multiply on an input; migrated saves land at morale 70 → factor 1.0 → byte-identical matches until psyche actually moves.
2. **Diary tone**: DiaryFacts (protocol.ts:1107) gains `moraleBand`/`bondBand`; WeekClaims (diary.ts:1934) gains `lowMorale`/`highMorale`/`strainedBond` licences; ~8-12 new lines across WEEK_NOTES and the condition pool, honesty-pinned like every other licence.
3. **Quit-arc trigger surface (hook only, no flow)**: `quitPressure(psyche): 0..3`. Level 1 = morale < 35 or bond < 50 (coach warns); level 2 = morale < 25 and bond < 45 (her lines change, explicit warning); level 3 = level 2 held 6 consecutive weeks (`lowMoraleWeeks`, persisted) – ARMED. This delivers exactly the "foreseeable, never a dice roll" signal ladder career-outcome-targets.md:45-47 requires. The quit flow itself is out of scope and belongs to the endings package; the contract is documented in psyche.ts's header.

**UI surface**: the KidScreen Confidence tile switches from `snapshot.condition` to morale (same continuous hue ring, word not number – the radar's "axes without numbers" discipline). Bond gets NO meter: it surfaces as diary tone plus the quitPressure warning line on the snapshot (`snapshot.psyche.warning`), because the parent-as-observer rule (career-outcome-targets.md:52) forbids a trust gauge. Mood tile keeps the weekly result emotion. No new tile – the export's six are all in use (KidScreen.vue:308).

Alternative considered and rejected: deriving psyche from trailing state with no schema bump. Fails for the onRampCleared reason (world.ts WorldState field note): `results` prunes at 52 weeks and `events` at 400, so the ledger of decisions deletes itself and the bond becomes amnesiac. Runner-up listed below.

## How (implementation sketch)

1. **`src/engine/psyche.ts`** (new, pure, never imports world.ts – knock.ts/kidLife.ts dependency shape). Exports: `PsycheState`, `defaultPsyche()`, the constants table above, `weeklyPsycheDelta(view: PsycheWorldView)`, `knockDecisionDelta(choice, repeat)`, `playedHurtDelta()`, `resultDelta(finish, lossStreakLen)`, `seasonVacationAudit(hadVacation)`, `moraleComposureFactor(m)`, `moraleBand(m)`/`bondBand(b)`, `quitPressure(p)`. `PsycheWorldView` = { week, plan, examWeek, offSeasonWeek, vacationWeek, birthdayWeek, knockChoiceGoverning, injuredOnset, laidUp }.
2. **State + schema**: add `psyche` to WorldState beside `condition` (world.ts:~366); bump `SAVE_SCHEMA_VERSION` 34 → 35 (world.ts:177); init in createWorld (world.ts:4005). Coordinate the number: the RNG-stream-persist proposal also wants the next version – migrations are append-only, whoever lands second takes v36.
3. **Migration**: append a `if (v === 34)` block after migrations.ts:860, back-filling `{ morale: 70, bond: 75, lowMoraleWeeks: 0 }` – defensive and idempotent exactly like the v33→v34 block (migrations.ts:844-860). Neutral band → factor 1.0 → migrated careers play byte-identical matches on load.
4. **Tick wiring** (all pure state, zero draws): `accruePsyche(world)` as step 1d after resolvePhysio (world.ts:4289) – it must run after resolveVacation so the vacation week is visible; the played-hurt delta at step 2 where `clearance` is already in hand (world.ts:4334), applied only when she actually boards (arrival verdict 'ok'); the season vacation audit inside the `week % WEEKS_PER_YEAR === 0` block (world.ts:4181-4196); `lowMoraleWeeks` increment/reset inside accruePsyche.
5. **Decision wiring**: bond deltas in decideKnock (world.ts:2304); result deltas in finalizeTournament beside seasonWins++/seasonLosses++ (world.ts:3672-3675), reading streak length from computeLossStreak (world.ts:3968 – sub-stream only, safe).
6. **Match seam**: kidMatchPlayerFor gains optional `psyche` on its narrow arg type; composure line becomes `raw.composure * factor * moraleComposureFactor(world.psyche?.morale ?? 70)`. Absent psyche → 70 → 1.0, so every pure caller and every stored WorldMatch replay is untouched.
7. **Snapshot + diary**: `Snapshot.psyche: { morale, moraleBand, bond, bondBand, warning: string | null }` assembled in toSnapshot (world.ts:5259); DiaryWorldView/assembleDiaryFacts (diary.ts:140, 698) thread the bands; new WeekClaims licences + lines; warning copy selected on `seed:psyche:<week>` at snapshot time (never in the tick).
8. **UI**: KidScreen.vue Confidence tile (markup near line 362, hue note line 175) reads `snapshot.psyche.morale`; warning line rides the Weekly Story scrap. No component derives a fact of its own – the screen's standing rule.
9. **Bench**: `tools/psyche-bench.ts` + package.json `bench:psyche` (beside bench:knock, line 15).

**RNG draw-count implications, stated flat**: zero new draws on MAIN or any sub-stream inside the tick; the frozen capture 41550/e6b0c709 cannot move by construction. The composure factor changes some kid match OUTCOMES (same draw sequences on `seed:kidtour:<eventId>`, different p) – legal, same category as the rival-life re-pins – and cannot move AI-derived pins because the canonical AI world excludes the kid entirely (world.ts:4293-4295).

## Test plan

TDD order:
1. `tests/psyche.test.ts` FIRST, red: every delta in the table; clamps; equilibria (all-grind → ~20, all-light → ~80); bond regression heals a −30 season in ~60 weeks; `moraleComposureFactor` is exactly 1 on all of [40,80]; quitPressure levels, arming at 6 consecutive weeks, reset on recovery.
2. Invariance: run tests/condition.test.ts B1/B1b untouched – count/hash/head/tail identical is the merge gate. Add one variant in the B-block style: two 52-week careers differing only in forced psyche extremes consume identical MAIN streams.
3. Schema: migrations.test.ts case for v34 → v35 back-fill + idempotency; generate `tests/fixtures/saves/v35.json`; goldenSaves.test.ts:30-33 enforces it exists and the whole corpus migrates.
4. Match seam: kidMatchPlayerFor with psyche absent or morale 70 deep-equals the pre-slice MatchPlayer; calibration suite (tests/match/calibration.test.ts) untouched by construction – it never builds players through kidMatchPlayerFor.
5. Diary honesty: extend the licence sweeps (tests/diary.test.ts, tests/week-notes.test.ts pattern) – every new line unselectable outside its band.
6. Bench BEFORE tuning ships: 8 careers × 4 seasons × {light, balanced, grind} × {always-rest, always-push} × {vacations on/off}. Report per season: morale/bond mean and p10/p90, weeks in low band, played-hurt count, quit hooks armed. The headline the owner reads: **a pushy-parent grind now costs something measurable** – acceptance corridor: grind+push+no-vacation sits ≥ 20 bond points below balanced+rest by season 3, and arms the quit hook in > 0% but < 35% of those runs. Re-run bench:knock to confirm knock arrival rates unchanged (knockChance never reads psyche).

## Acceptance criteria

- [ ] `grep -rn "morale" src/engine` hits a real mechanical module; README.md:24 is true as written.
- [ ] tests/condition.test.ts B1: count 41550, hash e6b0c709, byte-identical – no re-pin.
- [ ] SAVE_SCHEMA_VERSION = 35, migration back-fills defaults, v35.json fixture in the corpus, full suite green.
- [ ] A migrated v34 save plays its next entered event byte-identically (factor 1.0 at morale 70).
- [ ] Composure is the only attribute morale touches; max effect bounded to [0.92, 1.03] and asserted in tests.
- [ ] Diary lines about her mood/the bond are licence-gated and pass the honesty sweep.
- [ ] bench:psyche shows the grind-vs-care spread inside the stated corridor; numbers recorded in the bench header, knock-rate.ts style.
- [ ] quitPressure ladder implemented, persisted counter survives reload, no quit flow shipped.
- [ ] Engine modules stay Vue/Pinia-free; psyche.ts never imports world.ts.

## Risks & alternatives

- **Tuning risk (med)**: the deltas are educated guesses; the bench + corridor is the mitigation, same method as knock.ts (numbers measured 30.07 before shipping). Bond regression too fast makes decisions weightless; too slow makes early mistakes unrecoverable – the 0.5/wk figure is the first knob to sweep.
- **Double-scaling composure**: conditionMatchFactor already multiplies composure; morale multiplies on top. Deliberate (tired AND miserable is worse than either) but must be documented at the composition point and bounded in tests.
- **Schema-number race** with the RNG-persist proposal – coordination note in How step 2.
- **Owner may want a visible bond meter**: resisted here on the parent-as-observer rule; cheap to add later, impossible to un-add.
- **Runner-up alternative**: morale only, bond deferred. Cheaper (M), but the quit spec's signal list separates "she withdraws" from "the relationship slides" (career-outcome-targets.md:45), and results-driven morale alone lets a winning grinder erase every pushed knock – the exact farming the knock design killed.
- **Honest fallback if the owner defers the build** – ship these two edits instead, same week: README.md:24 becomes "**The child is a person, not an asset.** Today: school-vs-tennis, a body with real limits (condition, knocks, injuries) and a diary that cannot lie. Designed, not yet mechanical: morale, the parent-child relationship, burnout." And setting.md:86-88 becomes "She is a person, not an asset: she has a body that wears, a school calendar that does not care about tennis, and a diary that cannot contradict the week. Morale, the relationship meter and the right to quit are designed (career-outcome-targets.md) and not yet in the build."

## Dependencies

None to build. Consumers: the endings package's quit half reads `quitPressure` (this proposal designs the trigger, not the flow); the diary parent-voice wave (review 04 rec 5) becomes possible once bond exists. Coordinate schema version with the RNG-stream-persistence proposal if both land in the same wave.
