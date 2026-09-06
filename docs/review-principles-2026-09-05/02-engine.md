---
type: review
status: audit
area: project-review
canonical: false
last-reviewed: 2026-09-05
baseline: 98e3560b
---

# Engine – 5 September 2026 review

## Verdict

The engine's load-bearing invariants hold under test, not just under reading: purity is green, there are zero runtime import cycles among 119 modules (every back-edge into `engine/world` is `import type`), the MAIN stream stayed byte-identical between a no-action arm and an arm firing fifteen kinds of command over three seeds and 156 weeks, the closed-form and live probability paths agree to 1e-16, the migration chain is contiguous 1..70 with a fixture per rung, and every cents literal in the economy tables carries the `_00` convention. The worker's candidate-commit pipeline and the single-transaction CAS autosave are the best-designed code in the repository.

Three things matter most. First, the round-35 promise "the draw is a fact" (v70) breaks on season-boundary weeks: the conveyor retires the promised opponent in tick phase 1 before her match plays in phase 5, and the bracket silently draws someone else – reproduced on 3 of 20 boundary-week events, 0 of 301 elsewhere. Second, the import gate's spine stops at v38, so a file declaring v70 without any of eight later required fields is adopted and autosaved before its snapshot throws – the exact "crash wearing a valid header" the gate was written to prevent. Third, the chance the Season card prints (`fastMatchProbability`) and the match she actually plays (`simulateMatch`) run different models; stamina and composure move her real win rate by up to 5 pp away from the number on the card, and never move an AI-vs-AI result at all.

Nothing here is a P0. The rest is P3 hygiene: dropped error codes at the worker boundary, three unvalidated wire payloads, two snapshot fields nobody reads, 70 exports with no external consumer, and comments still growing 3.6 lines per code line added.

## Method

**Read in full** (about 6.5k of the 58.5k lines, 11%): `engine/rng.ts`, `engine/world/state.ts`, `worker/sim.worker.ts`, `worker/client.ts`, `shared/protocol/messages.ts`, `db/saves.ts`, `engine/saveCodec.ts`, `engine/match/engine.ts`, `match/closedForm.ts`, `match/liveProb.ts`, `match/point.ts`, `match/scoring.ts` (code lines), `engine/world/draw.ts`, and in `engine/world.ts` the top-level map plus `createWorld`, `replayMainState`, `maxMainDraws`, `tickWeek`, `advanceWeeks` and `finalizeTournament` (code lines only, comments stripped).

**Read in part** (another ~8%): `engine/saveGuard.ts` (bounds walk, spine, version guards), `engine/migrations.ts` (entry, the pre-v18 path, steps v66–v70, the exit check), `engine/world/phaseFinance.ts` (`resolveBaseCosts` code lines), `engine/world/phaseHerWeek.ts:150-200`, `engine/world/snapshot.ts:385-410`, `engine/season/ranking.ts:340-385`, `engine/coach.ts:436-452`, `engine/world/college.ts:1170-1194`, `shared/money.ts`.

**Covered by scripts and greps only** (the remaining ~80%): `economy.ts`, `offers.ts`, `season/calendar.ts`, `season/tournament.ts`, `season/preview.ts`, `season/fieldPros.ts`, `radar.ts`, `kidLife.ts`, `diary/*`, `world/coachMarket.ts`, `world/sponsors.ts`, `world/college.ts`, `world/ladder.ts`, `world/medical.ts`, `world/birthday.ts`, `world/injury.ts`, `world/milestones.ts`, `world/endings.ts`, `world/shop.ts`, `world/assets.ts`, the other `shared/protocol/*` modules. No claim below about those files goes beyond what a grep or an AST scan can see.

**Ran** (scratch directory `/private/tmp/claude-501/-Users-letulip-Projects-Claude/d9605995-63ce-46b9-9b1d-99d710f56e1c/scratchpad/rv36-E`, referred to as `$S` below):

| Command | Output | Result |
| --- | --- | --- |
| `node scripts/engine-purity.mjs` | `$S/purity.txt` | ok – no vue/pinia in engine/worker/db/shared |
| grep for `Math.random`, `new Date(`, `Date.now`, `performance.now` | `$S/grep-random-date.txt` | 18 hits, all comments, deterministic `new Date(number)` constructions (`migrations.ts:162`, `shared/dates.ts:78,94`), or worker/db clock use the header explicitly allows (`sim.worker.ts:115-117`, `saves.ts:61,365`) |
| madge, type imports skipped (`$S/madge-runtime.mjs`, via `npx --yes madge`, cached under `~/.npm/_npx`) | `$S/madge-runtime.txt` | 119 modules, 649 runtime edges, **0 cycles**; no `world/*.ts` imports `engine/world.ts` at runtime. With type imports counted madge reports 177 cycles (`$S/madge.txt`), all through `import type` |
| `$S/probe-ab.ts` (vite-node) – input-independence A/B, 3 seeds × 156 weeks, 15 action kinds | `$S/probe-ab.txt` | MAIN `{s,n}` identical every week on all three seeds |
| `$S/probe-match.ts` – closed form vs live DP, tiebreak parity, Monte Carlo 5 matchups × 2 × 4000 | `$S/probe-match.txt` | see E-03 |
| `$S/probe-drawfact.ts` – recorded draw vs played draw, 4 seeds × 260 weeks | `$S/probe-drawfact.txt`, `$S/probe-drawfact2.txt` | see E-01 |
| `$S/probe-spine.ts` – v70 fixture with one required field removed, through gate, migration, snapshot, tick | `$S/probe-spine.txt` | see E-02 |
| `$S/probe-profile.ts`, `$S/probe-profile2.ts` – `createWorld` with out-of-domain profile values | `$S/probe-profile*.txt` | see E-06 |
| `npx vitest run tests/rng.test.ts tests/round35-draw-fact.test.ts` | `$S/vitest-rng-draw.txt` | 2 files, 24 tests passed, exit 0 |
| `$S/fn-lengths.mjs` (TS AST) – function code lines, parameter counts, boolean params | `$S/fn-lengths.txt` | 2,180 functions |
| `$S/comment-ratio.mjs` on this tree and on the 02.09 baseline worktree | `$S/comment-ratio.txt`, `$S/comment-ratio-prev.txt` | see E-11 |
| `$S/dead-exports2.mjs` – exports with no reference outside their file across src/tests/tools/scripts/e2e | `$S/dead-exports2.txt` | 70 value, 28 type |
| `$S/fields-vs-migrations.mjs` – every `WorldState` field vs `createWorld`, `migrations.ts`, the import spine | `$S/fields-vs-migrations.txt` | see What is good |
| `$S/snapshot-drift.mjs` – `Snapshot` interface vs `toSnapshot` keys vs UI reads | `$S/snapshot-drift.txt` | see E-07 |
| type-honesty and `.sort(` scans | `$S/type-honesty.txt`, `$S/grep-sort.txt` | 0 `as any`, 7 `as unknown as`, 0 `@ts-ignore`; 54 sort sites |

**Not covered and why:** the full gates (rule 5); the balance of the tuned tables in `economy.ts` (5,126 lines, 90% comment by characters – grepped for unit slips only); the diary and narrative modules (no persisted state, no RNG beyond sub-streams by their own headers, and wording is the owner's); `check:tools` (tooling lane); the friendly sandbox's seed (UI lane – noted in the status table).

## Findings

| ID | Severity | Effort | Location | One-line summary |
| --- | --- | --- | --- | --- |
| E-01 | P1 | S | `engine/world/phaseHerWeek.ts:167-171`, `engine/world/phaseObligations.ts:59`, `engine/world.ts:1639/1662` | The v70 "draw is a fact" promise breaks on season-boundary weeks: the conveyor retires the promised opponent before her match plays (3/20 boundary events reproduced) |
| E-02 | P2 | XS | `engine/saveGuard.ts:176-245`, `worker/sim.worker.ts:561-571` | The import spine stops at v38; eight later required fields pass the gate when absent and the file is adopted and autosaved before `toSnapshot` throws |
| E-03 | P2 | S | `engine/season/preview.ts:765`, `engine/season/tournament.ts:1036/1055`, `engine/match/point.ts:242-269` | The card's chance and her match use different models; stamina/composure move her real win rate up to 5 pp off the printed number and never move an AI-vs-AI result |
| E-04 | P2 | XS | `engine/world.ts:1528-1530`, `worker/sim.worker.ts:148-153` | `maxMainDraws` leaves a 0.6% margin (804 vs 799.06 draws/week measured) and no test relates it to the tick's live cost; a breach turns every load into a replay |
| E-05 | P3 | XS | `worker/sim.worker.ts:643-651`, `shared/protocol/messages.ts:87`, `engine/saveGuard.ts:29-47` | `SaveFileError.code` never crosses the worker boundary although the gate's header says a UI can branch on it |
| E-06 | P3 | S | `worker/sim.worker.ts:247,305,314,506`, `engine/world.ts:1289-1314`, `db/saves.ts:65-73` | Three wire payloads the engine does not re-validate: `new.profile`, `tick/advance.weeks`, `saveNamed.name` |
| E-07 | P3 | XS | `shared/protocol/snapshot.ts:340,503`, `engine/world/snapshot.ts:1607,1673` | `onRampCleared` and `recoveryBuff` are built into every snapshot and read by nothing in the UI |
| E-08 | P3 | S | `$S/dead-exports2.txt`; e.g. `shared/dates.ts:254`, `engine/ending.ts:577`, `engine/offers.ts:1757`, `engine/radar.ts:111-277` | 70 value exports with no consumer outside their file, 3 with no consumer at all (one is the 02.09 review's open item) |
| E-09 | P3 | M | `engine/world.ts:91-444, 524-1008, 1997-2265` | `world.ts` decomposition status: a 354-line re-export barrel plus four blocks that still call back into the file's own state; ARCH-37 remains open, barrel importers 446 → 486 |
| E-10 | P3 | XS | `engine/season/preview.ts:672,206,646`, `engine/season/tournament.ts:432,1024,1223`, `engine/world/masseur.ts:220` | Nine parameter lists over five (the v70 `pinned` argument pushed three of them there) and one three-boolean signature |
| E-11 | P3 | – | `$S/comment-ratio.txt`; `engine/world/state.ts:491-497` | Comments grew 3.6 lines per code line added since 02.09; where the ratio is highest, plus one orphaned doc comment |
| E-12 | P3 | XS | `engine/world.ts:808,1487`, `engine/world/college.ts:1190-1191`, `engine/world/sponsors.ts:487`, `engine/world/milestones.ts:407`, `db/saves.ts:523` | Five hand-rolled dollar formatters duplicating `formatCents`, and one comparator that is not a total order |

### E-01 – The published draw is not kept across the season boundary (P1, S)

**What.** `recordDrawnFirstRounds` (`engine/world/draw.ts:75-94`) stores the first-round opponent's id for every entered event one week out, and `playHerWeek` reads it back (`engine/world/phaseHerWeek.ts:167`: `const promisedId = world.drawnFirstRounds?.[event.id]`). The reader looks the id up in the week's field, then in the whole universe, and if neither holds it falls back to a live draw with no record that a promise was broken:

```ts
// engine/world/phaseHerWeek.ts:167-171
const promisedId = world.drawnFirstRounds?.[event.id]
const promisedRow = promisedId ? universe.find((p) => p.id === promisedId) : undefined
const promised = promisedId
  ? (field.find((p) => p.id === promisedId) ??
    (promisedRow ? rivalField([promisedRow], event, fatigue)[0] : undefined))
  : undefined
```

Inside one tick the order is fixed by `tickWeek` (`engine/world.ts:1621-1694`): step 1 `seasonBoundaryAndObligations(world)` at :1639, step 5 `playHerWeek(...)` at :1662. The boundary phase runs the conveyor – `engine/world/phaseObligations.ts:59`: `const { left, joined } = renewCohort(world.cohort, world.seed, seasonIndex)` – which removes cohort rows. An event on a week that is a multiple of 52 therefore has its draw recorded at week 52k−1 (the bottom-of-tick call at `world.ts:1692`) and played at week 52k after the girl it named has left the cohort.

Reproduced with `$S/probe-drawfact.ts` (4 seeds × 260 weeks, entering the first enterable event every week, comparing the recorded id against the round-0 `MatchRecord` of the resulting `pendingTournament`):

```
played events with a recorded draw: 321, kept: 318, broken: 3, unrecorded (no card): 0, boundary-week events checked: 20
   df-a week 52 (BOUNDARY) event 1-w52-j30: card said ai-196, bracket played ai-7; ai-196 still in cohort after the tick: false; in p.players: false
   df-c week 156 (BOUNDARY) event 3-w156-j30: card said ai-52, bracket played ai-113; ai-52 still in cohort after the tick: false
   df-d week 52 (BOUNDARY) event 1-w52-regional: card said ai-84, bracket played ai-61; ai-84 still in cohort after the tick: false
```

Zero of 301 non-boundary events broke; 3 of 20 boundary events did (15%). `tests/round35-draw-fact.test.ts` passes (24/24 in `$S/vitest-rng-draw.txt`) because its walk does not put an entered event on a boundary week.

**Why it matters.** This is the owner's own complaint of 03.09 («мне сказали "играем против №118" … соперник в первом раунде №76») recurring once a season on the one week the calendar's first event can land on. The v70 comment on `WorldState.drawnFirstRounds` (`state.ts:945-981`) and the migration step (`migrations.ts:2360`) both state the promise unconditionally, so a reader of the code believes it is closed.

**Proposed response.** Keep the promise on the reader's side, not the writer's: exempt every id present in `world.drawnFirstRounds` from `renewCohort`'s departure set for that boundary (one filter in `phaseObligations.ts` around line 59, or a `keep: Set<string>` parameter on `renewCohort`, `engine/season/conveyor.ts:103`). The set is at most a handful of ids. Prove it with the probe above turned into a test in `tests/round35-draw-fact.test.ts`: walk a career whose entered event sits on week 52 and assert `kept === checked` including boundary weeks (mutate: remove the exemption, watch it fail). No save field, no migration, no wording. A second-best alternative that does need the owner – recording the opponent's `MatchPlayer` snapshot beside the id – is a schema move (v71 + migration + fixture) and is not recommended while the exemption works.

**Risk of the response.** The conveyor's departure set changes for careers that hold a boundary-week draw, so the eighteen frozen career hashes in `tests/coachTravelEdgeFixtures.ts` may move if any of those 156-week walks enters a week-52 event; a moved hash is a documented re-pin, not a regression. MAIN draws are untouched (`renewCohort` takes `seedStr`, not `rng`); confirm by re-running `$S/probe-ab.ts` after the change.

### E-02 – The import spine ends at v38 and the worker commits before it can build the reply (P2, XS)

**What.** `SPINE` in `engine/saveGuard.ts:176-245` lists 20 rules, the last of which are `proEntryWeeks` (since 36), `penalties` (since 38) and `rngMain` (since 35). Its own comment gives the rule for adding a row: a field "dereferenced … on the first availability read after load, so a v36 file without it is a crash wearing a valid header" (`saveGuard.ts:216-218`). Required fields added after v38 are not in it. `$S/probe-spine.ts` takes `tests/fixtures/saves/v70.json`, deletes one required field, and pushes the result through `guardPayloadBounds`, `guardDeclaredShape`, `migrateSave`, `toSnapshot` and one `tickWeek`:

```
birthdays                gate: passed | snapshot: THREW: Cannot read properties of undefined (reading 'some')      | first tick: ok
careerTotals             gate: passed | snapshot: THREW: Cannot read properties of undefined (reading 'prizeCents')| first tick: ok
milestones               gate: passed | snapshot: THREW: Cannot read properties of undefined (reading 'some')      | first tick: ok
internationalEntryWeeks  gate: passed | snapshot: THREW: … (reading 'filter')   | first tick: THREW: … (reading 'filter')
injuryHistory            gate: passed | snapshot: THREW: world.injuryHistory is not iterable | first tick: THREW: same
financeWeeks             gate: passed | snapshot: THREW: financeWeeks is not iterable        | first tick: THREW: … (reading 'find')
vacations                gate: passed | snapshot: THREW: … (reading 'find')     | first tick: THREW: … (reading 'find')
practices                gate: passed | snapshot: THREW: … (reading 'map')      | first tick: THREW: … (reading 'find')
seasonHistory            gate: REFUSED: This save file is malformed – "seasonHistory" must be a list
assets / knockHistory / kidFundsCents / peakPhysical / masseurSessionsPerWeek: gate passed, snapshot ok, tick ok (readers guard with ?? )
```

The ordering half: `case 'importSave'` (`worker/sim.worker.ts:561-571`) runs `decodeExportFile` → `ensureMainState` → `adoptAutosave(candidate)` → `world = candidate` → `snapshotMsg(...)`. The snapshot is built last, so when `toSnapshot` throws the file has already been adopted as the active world and written as the newest autosave; the queue converts the throw into an error reply (`sim.worker.ts:735-739`) and every later `getSnapshot`/`advance` throws the same way. `new` (:242-252) and `restoreSlot` (:543-560) have the same order.

**Why it matters.** The gate's charter (`saveGuard.ts:16-22`) is that "a file off the player's disk is the only input in the game that arrives from outside our own writers"; eight of the fields a v70 file must carry are not checked, and the consequence is not a refused import but a persisted career that cannot render. It needs a hand-edited or foreign file, so it is P2 rather than P0.

**Proposed response.** (1) Append spine rows for the eight fields above with their `since` versions (`birthdays` 48, `careerTotals` 39, `milestones` 18, `internationalEntryWeeks` 15, `injuryHistory` 12, `financeWeeks` 11, `vacations`/`practices` 13) – the existing `anArray` / `isObject` checkers suffice, and the existing refusal sentence pattern (`saveGuard.ts:268`) is reused, so no new wording. (2) In the three lifecycle cases, call `toSnapshot(candidate)` before `adoptAutosave`/`commitAutosave` and post that object – "the reply is DECIDED before it is posted" (`sim.worker.ts:730-733`) applied one step earlier. Test: the probe as `tests/saveGuard.test.ts` cases (each field removed must be refused with code `invalid-shape`), plus a worker-pipeline test that an import whose snapshot throws leaves `world` and the autosave untouched. Touches no save schema and no player-visible copy beyond the generated field name inside the existing sentence.

**Risk of the response.** Low. A spine row can only refuse files the engine itself never writes; the double `toSnapshot` on import/new/restore costs one extra snapshot build on three rare paths.

### E-03 – The card's chance and her match are two models (P2, S)

**What.** The Season card's percentage is `fastMatchProbability(kid, opp, …)` (`engine/season/preview.ts:765`), which is `pMatchBo3(basePServe(a,b), basePServe(b,a))` (`engine/match/engine.ts:21-23`): serve, return, groundstrokes, age pace and surface only (`point.ts:85-94`). Her bracket plays `simulateMatch` (`engine/season/tournament.ts:1036`), whose per-point probability is `modifiedPServe` (`point.ts:242-269`): momentum ±0.015, a break-point penalty scaled by `(1 − composure/100)`, and a fatigue term past point 120 scaled by `(1 − stamina/100)` on both sides. AI-vs-AI matches resolve with one Bernoulli against the closed form (`tournament.ts:1055`), so stamina and composure never touch the rest of the field. Measured with `$S/probe-match.ts` (4,000 matches per cell, hard/wta, SE ≈ 0.8 pp):

```
even 55s                          live=50.1%  closed=50.0%  delta= 0.1pp
kid +8 serve, low composure 30    live=54.9%  closed=56.7%  delta=-1.7pp   (momentum off: -0.9pp)
kid stamina 30 vs 90              live=44.9%  closed=50.0%  delta=-5.1pp   (momentum off: -4.2pp)
kid +10 all                       live=75.1%  closed=76.2%  delta=-1.0pp
kid -10 all, stamina 90 vs 40     live=28.4%  closed=23.8%  delta=+4.5pp
```

The closed form and the live DP themselves agree exactly (`pMatchBo3` vs `matchWinProbability(createScore(0|1))`: max |diff| 1.1e−16; tiebreak-from-6-6 parity 0.0), so the gap is entirely the point-loop modifiers; switching `momentum` off closes a fifth of the stamina gap (5.1 → 4.2 pp) and half of the composure gap (1.7 → 0.9 pp), the rest is fatigue and the break-point penalty.

**Why it matters.** The number on the card is systematically wrong in the direction of the stamina mismatch, by an amount larger than the card's own precision, and the previous review's PROD-35 was about exactly this promise. It also means two skills the player trains (stamina, composure) have no effect on the world's results except in her own matches – a design fact worth stating rather than discovering.

**Proposed response.** Engine side, one of two bounded changes: (a) make the card's probability use the same model by running a short Monte Carlo (200 matches of the same pair cost ~25 ms; the card already caches per event through `makeEventPreviewer`), or (b) fold an expected-fatigue correction into `fastMatchProbability` so the closed form carries the stamina difference (a calibration task: fit `Δp` against the MC table above, record predicted vs measured in a `docs/specs/` note per CLAUDE.md invariant 5). Whether the card's wording should say what the number is ("on serve strength" vs "expected") is the owner's – flag as an owner decision before either arm ships. Test: the probe table as a bench under `tools/` with the delta pinned under 1 pp for the stamina rows.

**Risk of the response.** (a) changes no results, only the displayed number; (b) changes AI-vs-AI outcomes if applied to the closed form the field uses, which would move rankings and every calibration band – apply it to the preview only unless the owner wants the field to feel stamina too.

### E-04 – The RNG plausibility bound has a 0.6% margin and no test against the live tick (P2, XS)

**What.** `maxMainDraws(weeks, cohortSize) = weeks * (8 + 4 * max(cohortSize, COHORT_SIZE))` (`engine/world.ts:1528-1530`; `COHORT_SIZE = 199`, `engine/season/cohort.ts:70`) = 804 per week. The tick's real cost is 3 base draws plus a fourth when the sponsor roll hits (`engine/world/phaseFinance.ts:567-569`) plus 4 per rival: `$S/probe-ab.txt` measures `n = 124654` after 156 weeks, 799.06 per week. The margin is 5 draws a week. `verifyMainState` (`worker/sim.worker.ts:148-153`) fails a load whose `n` exceeds the bound, and `ensureMainState` (:172-177) then replaces the position by `replayMainState` (`world.ts:1509-1515`) and reports `recovered: true`. The only tests that use `maxMainDraws` check stored fixtures against it (`tests/goldenSaves.test.ts:130`, `tests/e2e-fixtures.test.ts:185`); none checks the current tick's per-week cost against the bound, and the frozen-capture pin in `tests/condition.test.ts:138-139` is by design "a documented measurement, not a change-gate".

**Why it matters.** A wave that legitimately adds one MAIN draw per rival (or six flat draws) updates the pin as CLAUDE.md prescribes and ships; from then on every career played more than a few weeks under the new code fails the bound on every load, is replayed under current code on every load (the O(career) path v35 retired) and shows the repair flag every time. The comment calls the 8 "generous"; measured, it is 0.6%.

**Proposed response.** Derive the slack from the measured cost rather than a literal: keep the structure but make the per-week constant `MAIN_DRAWS_PER_WEEK_MAX` a named number with a test that asserts `measuredPerWeek(52-tick probe) * 1.25 <= bound(1 week)` (mutate: set the slack to 0 and watch it fail), and widen the flat term to something a wave cannot cross by accident (for example `2 * COHORT_SIZE`, giving 1,202/week – still an order of magnitude below any corruption pattern). No schema, no wording.

**Risk of the response.** None to existing saves: widening the bound can only accept more positions, and the s/n redundancy check (`rng.ts:97-100`) remains the sharp half of the verifier.

### E-05 – Save-file error codes stop at the worker (P3, XS)

**What.** `SaveFileError` carries seven machine-readable codes (`engine/saveGuard.ts:31-38`) and its header says "the code exists so tests (and any future UI that wants to branch) never match on prose" (:29-31). `errorMsg` in `worker/sim.worker.ts:643-651` maps only `StaleRevisionError` and `SaveConflictError` to a `code`; everything else becomes `{ ok: false, error: message }`. `WorkerErrorCode` (`shared/protocol/messages.ts:87`) is `'STALE_REVISION' | 'SAVE_CONFLICT'`. The store passes `res.code` through (`src/stores/game.ts:119`) but can only ever see those two.

**Why it matters.** A future UI cannot branch on `future-schema` vs `corrupted` without matching English, which is the failure mode the code was added to prevent; the claim in the header is currently false.

**Proposed response.** Add a third arm to `errorMsg` (`if (err instanceof SaveFileError) return { …, code: err.code }`) and widen `WorkerErrorCode` to include `SaveFileErrorCode`; `tests/worker-reply-correlation.test.ts` already drives the switch and can assert the code on a hostile `importSave`. No wording, no schema.

**Risk of the response.** None; `code` is additive on the error arm.

### E-06 – Three wire payloads the engine trusts (P3, S)

**What.** CLAUDE.md invariant 1 says every command is re-validated engine-side. Three payloads are not:

- `new.profile` goes straight into `createWorld` (`worker/sim.worker.ts:247`; `engine/world.ts:1289-1314`). `$S/probe-profile.ts`: `background: 'nope'` throws `TypeError: undefined is not iterable` from `engine/season/calendar.ts:1686` (`ECONOMY.travelBgFactor[background]`) inside `ensureSeason` – closed, but as a bare TypeError. `$S/probe-profile2.ts`: `birthMonth: 13`, `birthMonth: 0`, `birthDay: 31` in February, `kidName: ''`, `coachTier: 'bogus'`, `playStyle: 'bogus'`, `country: 'ZZ'` are all accepted, ticked eight weeks and reloaded through `migrateSave` without complaint (`coachTier: 'bogus'` silently yields a self-coached career).
- `tick.weeks` and `advance.weeks` bound loops unchecked (`sim.worker.ts:305`, `:314`); a non-integer runs `ceil(weeks)` ticks, `NaN` commits an empty revision.
- `saveNamed.name` is sanitised to `[a-z0-9-]{0,24}` (`db/saves.ts:65-73`), so two unsanitisable names collide on the slot `manual:<careerId>:`; the UI guards this (`MoreScreen.vue:221`, `:577`) but the engine side does not.

**Why it matters.** Today the only sender is the same-origin UI, so these are hygiene, but the invariant is stated without exception and `new` is the one command that creates persisted state from its payload.

**Proposed response.** A `profileShapeError(profile)` in `shared/protocol/profile.ts` beside `DEFAULT_PROFILE` (enumerations for background/coachTier/playStyle/country, 1–12 month, 1–`daysInBirthMonth` day, non-empty trimmed name up to a cap), called at the top of `case 'new'` like `planShapeError` is at `:413`; `Number.isInteger(weeks) && weeks >= 1 && weeks <= 52` at `:305`/`:314`; refuse an empty sanitised name in `writeNamed`. The refusal sentences are player-visible via the toast, so their wording is the owner's – propose them, do not invent them. Test: the two probe files as table-driven tests.

**Risk of the response.** A cap on `kidName` length could refuse a name the wizard currently accepts; align the cap with the wizard's own limit first.

### E-07 – Two snapshot fields with no reader (P3, XS)

**What.** `Snapshot.onRampCleared` (`shared/protocol/snapshot.ts:340`, built at `engine/world/snapshot.ts:1673`) and `Snapshot.recoveryBuff` (`:503`, built at `:1607`) have no reference anywhere in `src/components`, `src/stores`, `src/composables`, `src/viz`, `src/App.vue` or `src/shared` outside the protocol (`grep -rlw`, `$S/snapshot-drift.txt`; `lossStreak` and `seasonLosses`, first flagged by the script, are read by `shared/avatarEmotion.ts` and `StatsScreen.vue` respectively). Every other interface member is both set and read; no key set by `toSnapshot` is missing from the interface.

**Why it matters.** Contract drift in the quiet direction: the UI stopped reading them and nothing objected. Cost is bytes per snapshot, not correctness.

**Proposed response.** Either delete the two members and their two builder lines, or keep them with a comment naming the intended consumer. The interface is not persisted, so no schema move. Test: `tests/snapshot-contract.test.ts` asserting every `Snapshot` member has at least one reader outside the engine (the script above, as a test).

**Risk of the response.** None if a grep confirms no dynamic access (`snapshot[key]`) – none was found.

### E-08 – 70 exports with no external consumer, 3 with none at all (P3, S)

**What.** `$S/dead-exports2.mjs` lists every `export function|const|let|class` in engine/worker/shared/db with zero references in any other file across `src`, `tests`, `tools`, `scripts`, `e2e`: 70 value exports and 28 type exports. Three are referenced nowhere, not even in their own file: `firstWeekOfMonth` (`shared/dates.ts:254` – the 02.09 review's open YAGNI item), `ENDING_BLURB` (`engine/ending.ts:577`), `AD_TIERS` (`engine/offers.ts:1757`). The rest are used internally and exported for no consumer – the largest groups are twelve tuning constants in `engine/radar.ts:111-277`, seven in `engine/diary/travelHome.ts`, seven album slot builders in `engine/world/album.ts`, four each in `coachLoad.ts`, `kidLife.ts`, `knock.ts`, `match/rally.ts`, `offers.ts`. Spot-checked seven by `grep -rlw`: all confirmed.

**Why it matters.** Exported-but-unconsumed names widen the surface the world-symbol map and the barrel have to carry, and they defeat "find all references" as a change-impact tool.

**Proposed response.** Delete the three fully dead ones now (the previous review already asked for `firstWeekOfMonth`). For the 67 internal-only exports, drop the `export` keyword module by module when a wave touches the file; do not run a repository-wide sweep (the 02.09 review's explicit non-goal). Verify with `npm run map:world:check` and the purity script; no wording, no schema.

**Risk of the response.** A tool or bench under `tools/` may import one of them in a file the scan could not parse; the scan covered `tools/` and found none, but re-run `npm run check:tools` after each module.

### E-09 – `world.ts` decomposition status (P3, M – only if a feature pulls it)

**What.** `engine/world.ts` is 2,265 lines: 78 import lines, a re-export barrel from `:91` to `:444` (354 lines), and the blocks that remain because they call back into the file's own orchestration: `finalizeTournament` (`:524-1008`, 485 lines, 166 code – the largest non-generated function in the engine after `migrateSave` and `toSnapshot`), the reveal trio `revealTournamentRound`/`skipTournament`/`closeTournament` (`:1036-1227`), the prologue helpers (`:1228-1288`), `createWorld` (`:1289-1493`), `replayMainState`/`maxMainDraws`/`seedWorldForV6` (`:1509-1620`), `tickWeek` (`:1621-1694`), `skipEvent` (`:1707-1800`), `advanceWeeks` (`:1801-1922`), and the college trio (`:1997-2265`). Comment share is 75% by characters (116,066 vs 38,043). Barrel importers by the CLAUDE.md formula: **486** files (02.09: 446). madge confirms the design rule holds: every `world/*.ts` back-reference is `import type` and the runtime graph has 0 cycles.

**Why it matters.** ARCH-37 (02.09) is unchanged: the seams exist but nothing has pulled them. The barrel count grew by 40 in three days, so the compatibility surface is getting more expensive, not less.

**Proposed response.** None now – the previous review's ruling ("move either only when a feature needs the same boundary") stands and nothing in this wave needs it. When something does: `finalizeTournament` is the seam with the most independent state (prize split, cabinet, season record, staff shares, condition, milestones) and its pins are found by `git grep -l "engine/world.ts'" -- tests/` before the cut, per the CLAUDE.md procedure.

**Risk of the response.** N/A.

### E-10 – Parameter lists over five and a three-boolean signature (P3, XS each)

**What.** From `$S/fn-lengths.txt`: `previewEvent` 9 params (`engine/season/preview.ts:672`), `drawnField` 8 (`:206`), `page` 8 (`engine/world/album.ts:78`), `firstRoundDraw` 7 (`preview.ts:646`), `fillOnRamp` 7 (`engine/season/tournament.ts:432`), `playMatch` 7 (`:1024`), `runTournament` 7 (`:1223`), `fillWeekOnRamps` 7 and `fillWildCards` 7 (`engine/world/phaseAiWeek.ts:181`, `:256`). The v70 `pinned` argument is what took `previewEvent`, `firstRoundDraw` and `drawnField` past their previous counts. `masseurWorksInWeek(hired: boolean, frozen: boolean, bookedOff: boolean)` (`engine/world/masseur.ts:220`) is three positional booleans.

**Why it matters.** Positional argument lists of this length are where the next `pinned`-style threading goes wrong silently; a swapped boolean compiles.

**Proposed response.** An options object for the preview trio (`{ ranking, kid, excluded, standing, kidAtRest, rated, pinned }` – the shape `argsFor` in `engine/world/snapshot.ts:385-405` already builds) and a `{ hired, frozen, bookedOff }` object for the masseur predicate. Pure refactor; the frozen hashes prove identity.

**Risk of the response.** Source pins that match these signatures textually (`git grep -l "season/preview.ts'" -- tests/` first).

### E-11 – Comment volume: measured, not judged (P3, report only)

**What.** `$S/comment-ratio.mjs` on this tree versus the 02.09 baseline (`c6114b71`, `$S/comment-ratio-prev.txt`): comment lines 39,509 → 41,564 (+2,055), code lines 22,273 → 22,836 (+563) – **3.6 comment lines per code line added in three days**; overall ratio 1.77 → 1.82. Highest ratios (files over 150 lines): `engine/world/state.ts` 6.78 comment lines per code line (95% of characters), `engine/coachLoad.ts` 5.05, `engine/world/multiWeek.ts` 4.59, `engine/season/types.ts` 4.56, `shared/protocol/snapshot.ts` 4.24, `engine/world/brand.ts` 4.15, `shared/protocol/profile.ts` 3.91. Largest absolute: `economy.ts` 323,183 comment characters (90%; +27,097 since 02.09 against +1,678 code), `season/calendar.ts` 135,757 (90%, unchanged), `migrations.ts` 121,728 (+1,776), `world.ts` 116,066 (+10,664 against +1,769 code), `offers.ts` 100,060, `world/coachMarket.ts` 98,091 (+19,725, +25%, against +785 code). One structural slip: the doc comment for `seasonWins`/`seasonLosses` (`state.ts:491-493`) is followed directly by the doc comment for `medicalWithdrawalWeek` (`:494-496`), so it now sits above the wrong field and the two counters at `:503-504` carry no doc at all.

**Why it matters.** The 02.09 review's context-cost point stands and the rate has not slowed. These comments are owner rulings and reasoning (rule 10) – the number is reported for the owner's disposition, not as a purge target.

**Proposed response.** No purge. Fix the orphaned comment when `state.ts` is next touched (move `:491-493` to sit above `:503`). Apply the 02.09 "compress on touch" template where the ratio is highest.

**Risk of the response.** None.

### E-12 – Small catalogue (P3, XS)

**What.** (a) Five engine sites build dollar strings by hand – `$${Math.round(x / 100).toLocaleString('en-US')}` at `engine/world.ts:808` and `:1487`, `engine/world/sponsors.ts:487`, `engine/world/milestones.ts:407`, and `engine/world/college.ts:1190-1191` (with its own `Math.abs` and sign sentence) – while `formatCents` (`shared/money.ts:24-28`) produces the identical string for non-negative cents (`Math.round(cents/100)`, `toLocaleString('en-US')`, `$` prefix). The locale is pinned in every case, so this is DRY, not determinism. (b) `db/saves.ts:523` sorts with `(a, b) => (recNewer(a, b) ? -1 : 1)`, a comparator that never returns 0 and returns 1 for both orders of equal records; harmless on the two-element generation array, but not a total order. (c) Of the 54 `.sort(` sites in engine/worker/shared/db (`$S/grep-sort.txt`), none sorts without a comparator; the comparators that can tie (`preview.ts:310` by rating, `conveyor.ts:108` by power, `calendar.ts:2180` by week then rung) resolve ties by the stable sort over deterministic input order – acceptable under ES2019, worth knowing.

**Proposed response.** (a) Replace the four non-negative sites with `formatCents`; leave `college.ts:1190` (its sign handling is deliberate, `:1186-1189`). The output is byte-identical, so no wording moves – verify by pinning the four strings before and after. (b) Use `recNewer(a, b) ? -1 : recNewer(b, a) ? 1 : 0`.

**Risk of the response.** None measurable.

## Since the 2 September review

| Previous finding | Status now | Evidence |
| --- | --- | --- |
| R2-01 college tuition typed as negative `expense`/`tuition` | still fixed | `engine/world/college.ts:151` `category: 'tuition'` |
| R2-02 structured injury report on the snapshot | still fixed | `shared/protocol/snapshot.ts:197` `injuryReport`, built at `engine/world/snapshot.ts:1508` |
| R2-05 typed worker replies | still fixed | `shared/protocol/messages.ts:281-332` `REPLY_BY_COMMAND … satisfies Record<ToWorker['type'], …>`; `worker/client.ts:79-83` `replyMismatch` |
| R2-06 engine/presentation direction | still fixed | no `viz` import under engine/worker/shared/db (grep empty); `tests/engine-viz-direction.test.ts` present |
| R2-09 protocol split | still fixed | `shared/protocol.ts` 248 lines, 15 export statements; every `shared/protocol/*` → engine edge is `import type` (`competition.ts:9-11`, `events.ts:9-10`, …) |
| R2-10 state owner + explicit weekly phases | still fixed, now 8 steps | `engine/world/state.ts:314` `SAVE_SCHEMA_VERSION = 70`; `engine/world.ts:1621-1694` steps 0–8 (v70 added the draw record at :1633 and :1692) |
| R2-13 multi-week advance narrowed | not re-checked in depth | `engine/world/multiWeek.ts:322` `advanceRefusal`, `:264` `spanWeeksFor` present |
| ARCH-36 two owners for `WorldState`/`SAVE_SCHEMA_VERSION` routing | fixed (docs) | `docs/context/engine-symbol-map.md:43` now routes both to `src/engine/world/state.ts` |
| ARCH-37 remaining world seams | still open | E-09; barrel importers 446 → 486 |
| PROD-35 published opponent differs from the bracket | fixed on ordinary weeks, **open at the season boundary** | v70 `drawnFirstRounds` (`state.ts:981`, `draw.ts:75-94`); E-01: 0/301 broken off-boundary, 3/20 on boundary weeks |
| PROD-38 decision density before acceleration | not checked | product lane |
| `firstWeekOfMonth` unused | still open | `shared/dates.ts:254`, zero references in src/tests/tools/scripts/e2e (E-08) |
| Career handoff protocol fields dormant | not checked | `shared/protocol/career.ts:456` `HandoffView`, `:503` `handoff`; the word has hits in 14 UI files but whether they are this seam was not verified |
| Friendly sandbox seeded from the clock | still open by owner choice | `src/components/screens/SeasonScreen.vue:1343` `exhibition-${Date.now().toString(36)}` (UI lane) |
| Comment growth in `economy.ts` / `migrations.ts` | measured, still growing | `economy.ts` 296,086 → 323,183 comment chars; `migrations.ts` 119,952 → 121,728 (E-11) |
| QA-34 `check:tools` red | not checked | tooling lane |

## What is good

- **The RNG position is its own checksum.** `rng.ts:62-100`: `{s, n}` with `s = seed32 + n·STEP mod 2³²`, verified on load (`sim.worker.ts:148-153`), repaired loudly rather than silently, and the two implementations pinned to each other in `tests/rng.test.ts` (green in isolation). The conditional fourth draw in `resolveBaseCosts` is taken before the condition is read (`phaseFinance.ts:567-569`), which is exactly why the A/B in `$S/probe-ab.txt` holds: identical `{s, n}` on three seeds through entries, withdrawals, purchases, kit changes, coach hires, gifts, knocks, offers and two bankruptcies.
- **The worker is a transaction.** `mutate` (`sim.worker.ts:206-222`) clones, runs, persists, then commits; the queue serialises every message (`:725-751`) and a failed command cannot poison it; the client's generation token (`client.ts:134-172`) makes a late reply from a dead worker provably ignorable. `runAutosaveTx` (`db/saves.ts:250-345`) is one IndexedDB transaction over both stores with the careers row as a compare-and-swap anchor. E-02 asks only that the snapshot be built one step earlier on three lifecycle paths.
- **Two doors, two trust levels** in `saveCodec.ts:82-89` and `:111-144`: the DB door gets caps + checksum, the file door gets caps, header, checksum, bounded inflation, a bounds walk and the spine, all into locals. The design is right; the spine just needs its post-v38 rows.
- **Zero runtime cycles** across 119 modules and 649 edges; every `world/*.ts` back-reference to `engine/world` is `import type` (`state.ts:21-24` states the rule, madge confirms it).
- **Money is honest.** All 80 cents literals in `economy.ts` carry `_00`, 47 `Bps` keys, every formatter takes cents, and the only literal comparisons (`diary/facts.ts:229-230`) are written in cents.
- **The migration ladder is contiguous** (`v = 1 … 70`, one assignment per rung), `SAVE_SCHEMA_VERSION = 70` matches the last step (`migrations.ts:2360`) and `tests/fixtures/saves/v70.json` (`schemaVersion: 70`, `drawnFirstRounds` present); every required `WorldState` field is written by `createWorld`, and every required field added after v5 has a migration writer (`$S/fields-vs-migrations.txt`; `birthdays` and `coachOnJuniorEvents` are written through a cast at `migrations.ts:1500-1501` and `:1532-1533`).
- **Type honesty** is unusually good: 0 `as any`, 0 `@ts-ignore`/`@ts-expect-error`, 7 `as unknown as` (five on the migration path over partially-migrated saves, one in the worker's `postMessage` shim, one catalogue cast), and non-null `!` concentrated in `world/snapshot.ts` (13) and `world/college.ts` (8).
- **The match engine is internally consistent**: closed form, live DP and the scoring FSM's tiebreak rotation agree to floating-point precision, and the retirement sampler adds no draw to the match stream (`match/engine.ts:96-100`).
