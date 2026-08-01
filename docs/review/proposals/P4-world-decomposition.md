<!-- Build-ready proposal derived from the 2026-08-01 full review (docs/review/). Reviewed at b7a9358. -->

# P4 – world.ts staged decomposition

One-line: Split the 5,521-line world.ts god module into 15 single-concern engine modules behind an unchanged public barrel, in 15 mechanical, individually-green extractions with zero behavior change.

**Priority:** Tier 2 – engine debt · **Effort:** L (2-5d) · **Risk:** low

## Why (problem)

- `src/engine/world.ts` is 5,521 lines (verified by `wc -l`), 161 top-level functions, 111 exports (review 01-architecture.md:21-22). It holds the 245-line `WorldState` interface (world.ts:200-443), the tick pipeline (`tickWeek` world.ts:4171-4493, `advanceWeeks` 4780-4859), all entry/arrival/medical gates (1329-1785), injuries (1786-2054), the knock (2055-2319), the coach market (2434-2645), sponsors (3107-3367), the academy review (3401-3479), the tournament reveal machinery (3480-3985), the commands (`enterEvent` 4587+), and the 263-line `toSnapshot` (5259-5521).
- It is the permanent merge hot-spot: every feature wave edits this one file, and it grew 228 lines during the review window alone (docs/review/README.md:17). With the one-branch-per-wave workflow, two concurrent waves conflict here by construction (review 01:22).
- The extraction pattern that works everywhere else stops at this file's door: diary, radar, knock, kidLife, coachLoad, offers, condition are clean world-free leaves that world.ts composes (world.ts:123-169 documents each import's direction), but orchestration, gates, commands and snapshot assembly all pile into one file (review 01:22, 02:26).
- The repo already proved the safe recipe on itself: `condition.ts` was "extracted verbatim out of world.ts" and "world.ts re-exports every symbol below under its historical name, so all existing call sites and test imports keep working unchanged" (src/engine/condition.ts:3-10; the re-export lives at world.ts:1161). This proposal is that recipe, applied 15 more times.
- The blast radius of renames is why shims are mandatory, not optional: `from '../src/engine/world'` (or equivalent) appears in 55 of 91 test files, ~18 tools/ benches, and 14 src/ files (9 components, 2 composables, db/saves.ts, worker/sim.worker.ts, engine/migrations.ts) – all grep-verified.

## What (proposed change)

Create `src/engine/world/` with 15 modules; `src/engine/world.ts` stays at its current path and becomes a pure barrel (explicit named re-exports plus the layering doc comment). Every existing import of `engine/world` – tests, tools, worker, UI, migrations – keeps working byte-for-byte because the barrel re-exports every symbol under its historical name. No export renames, no signature changes, no logic changes, no schema bump.

Extraction order follows the internal call graph bottom-up, so at every step an extracted module only imports leaves or already-extracted modules – never the barrel. This is load-bearing, not aesthetic: verified call-graph facts force it, e.g. `rollInjury` calls `withdrawEvent` and `refundPractice` (world.ts:1916-2054 body), so commands and planner must be extracted before the health module; `entryStatus` calls `rankIn` (world.ts:1634-1723 body), so the ladder-view helpers at 5023-5155 belong to the ranking module, not the snapshot.

Why a subdirectory rather than flat `gates.ts`/`commands.ts` in src/engine/ (review 01:22's sketch): 15 flat files with generic names would sit ambiguously next to real leaves like coach.ts and knock.ts, and the repo already uses subdirectories for cohesive clusters (`season/`, `match/`). No `world/index.ts` is ever created, so `./world` always resolves to world.ts. Runner-up under Alternatives.

**Target module map** (names + verified source ranges + approx lines):

| # | Module (src/engine/world/) | Contents (source lines in today's world.ts) | ~LOC |
|---|---|---|---|
| 1 | state.ts | `WorldState` + `PendingTournament` (190-443), `SAVE_SCHEMA_VERSION`/`START_AGE_YEARS`/`KID_ID` (177-183), `STARTING_FUNDS_CENTS`/`PARENT_INCOME_CENTS` (445-457), retention constants (494-501), micro-accessors `cohortIds`/`eventById` (699-706), `vacationForWeek`/`practiceForWeek` (2331-2340) | 330 |
| 2 | ledger.ts | `addEvent`/`accrueFinance` choke point (503-531), `seasonIndexOf`/`seasonStartWeek` (532-545), `financeWindow`/`financeSeries` (546-604), `finishLabel`/`prizeCentsFor`/`stageLabel` (1112-1154) | 150 |
| 3 | kid.ts | ages block incl. `ageAtWeek`/`kidAgeExact`/`birthdayTurning`/`markBirthday` (1201-1328), `startingSkills`/`kidMatchPlayer`/`kidMatchPlayerFor` (605-698) | 230 |
| 4 | ranking.ts | `ensureSeason` (707-730), ranking helpers + `recomputeKidRank` + `latchOnRamps` (731-837), `kidPoints`/`kidDomesticPoints` (4495-4514), ladder views `rankIn`/`prevRankIn`/`activeLadderOf`/`computeLadderView`/`computeCountingResults`/`computeStandings`/`kidLadderRank`/`playerShortName` (5023-5155) | 290 |
| 5 | seasonWrap.ts | `fireMilestone`/`captureMilestone` (838-854), `maybeFireSeasonWrapUp` (855-1064), `emptySeasonRecord`/`emptyTrophyLedger`/`copyTrophyLedger` (1074-1111), `turnOverField` (3368-3400), `reviewAcademy` (3401-3479) | 390 |
| 6 | coachMarket.ts | coach market block (2434-2645), `coachLoadNote`/`coachEntryLine` (4861-4895) | 245 |
| 7 | planner.ts | vacations/practices (2320-2433 minus the two accessors moved to state.ts), `bookPractice`…`resolvePractice`, `refundPractice`, `practiceCaution`, `prunePlannerBookings`, `pruneInternationalEntries` (2646-2898) | 355 |
| 8 | gates.ts | entry cap (1329-1382), `AvailabilityStatus`/`medicalClearance`/`medicalBlock`/`layoffCovering`/`layoffBlock`/`availabilityStatus` (1383-1633), `entryStatus` (1634-1723), arrival gate (1724-1785), eligibility `isTierEligible`/`acceptanceRank`/`tierOpenFor`/`outgrewTier` (4515-4586) | 530 |
| 9 | commands.ts | `enterEvent`/`withdrawEvent`/`cancelEntry`/`skipEvent` (4587-4779) | 195 |
| 10 | health.ts | `accrueCondition` (1180-1199), injuries + physio incl. `injuryTau`/`rollInjury`/`resolvePhysio` (1786-2054), knock world-side incl. `pendingKnock`/`expireKnock`/`rollKnock` (2055-2228), `radarViewOf`/`coachLoadViewOf`/`decideKnock` (2237-2319). `restRecoveryBonus` (1167-1179) moves to the existing leaf condition.ts (it is pure ECONOMY arithmetic; skipEvent needs it below commands) | 560 |
| 11 | upkeep.ts | flavor lists (459-493), `resolveInterest`/`resolveParentIncome`/`isCompetitionWeek`/`coachWorksThisWeek`/`resolveBaseCosts`/`resolveGear` (2899-3106) | 240 |
| 12 | sponsors.ts | sponsor review + `acceptOffer`/`declineOffer` + `travelCostFor`/`chargeTravel` (3107-3367) | 260 |
| 13 | tournament.ts | `flipScore`…`computeShadowTournament` (3480-3568), `recomputeRankAndMilestones`/`housekeep` (3569-3599), `finalizeTournament`/reveal/skip/close (3600-3848), AI tournaments (3849-3873), prunes (3874-3922), `computeLossStreak` (3923-3985) | 505 |
| 14 | lifecycle.ts | `createWorld`/`seedWorldForV6` (3986-4135), `releaseOutgrownEntries` (4136-4170), `tickWeek` (4171-4493), `advanceWeeks` (4780-4859) | 585 |
| 15 | snapshot.ts | `upcomingEvents` (4896-5001), `arrivalPreview` (5002-5022), `pendingView` (5155-5258), `toSnapshot` (5259-5521) | 495 |

world.ts after: ~150-200 lines – the layering comment (today's 48-56, updated), explicit `export {…} from './world/…'` blocks, and the two historical re-exports that already exist (condition/calendar at 1161-1162, 1327). Zero function bodies.

## How (implementation sketch)

**PR0 – the safety net (write first, before any move):**
1. `tests/worldBarrel.test.ts`: import `* as world from '../src/engine/world'`, pin `Object.keys(world).sort()` against a literal list captured from current main. Any accidentally dropped or newly-leaked barrel export fails loudly. (Type-only exports are invisible at runtime – `vue-tsc -b` guards those.)
2. Same file, second test: read `src/engine/world/*.ts` with node:fs (precedent: goldenSaves.test.ts reads fixtures) and assert no extracted module contains `from '../world'` or `from './world'` (barrel import = cycle) and that world.ts contains no `export *`. Passes vacuously until PR1.

**PR1..PR15 – one module per PR, in the table's exact order.** Per-PR mechanics, identical every time:
1. Create `src/engine/world/<name>.ts`; cut-paste the listed line ranges verbatim – bodies, banners, and the block comments (they carry design rationale, e.g. the wrap-up money-bug history at 857-889; they move with their code).
2. Add the module's own imports: leaf modules (rng, economy, coach, knock, offers, season/*, match/*, shared/*) plus already-extracted `./state`, `./ledger`, etc. `import type` for types, matching repo style. Never `../world`.
3. Private helpers now crossing the new boundary gain `export` in their new home (e.g. `refundPractice` from planner.ts for commands.ts and health.ts; `vacationBlackoutDetail` from planner.ts for gates.ts) but are NOT added to the barrel – the PR0 pin test enforces that the public surface never grows or shrinks.
4. In world.ts: delete the moved lines; add one explicit re-export block for every symbol that was previously exported (`export {…} from './world/<name>'`, `export type {…}` for types); add plain imports for symbols still called by bodies remaining in world.ts. `noUnusedLocals` (tsconfig.app.json) keeps the import list honest.
5. Gate: `npm run check` (vue-tsc -b --force + vitest unit + vite build – the exact ci.yml:18-24 sequence), then read the sim-project result per the test plan.

**RNG draw-count implications: none, and provably so.** Moving function definitions between files changes no call order, so the per-week MAIN-stream draw sequence is untouched; the frozen capture (count 41550, hash e6b0c709 – tests/injuries.test.ts:54-64 and the REF at tests/condition.test.ts:115-117) must pass unmodified after every single PR. Any diff touching those pinned numbers means the extraction was not mechanical – revert, do not re-pin. Two guard rules for the builder: no moved top-level statement may call `rngFromSeed` or mutate state at module scope (the moved module-level constants at 459-501 and 3072-3077 are static literals – verify per PR), and no reordering of statements inside any function body, ever.

**Schema/migration steps: none.** `SAVE_SCHEMA_VERSION` stays 34; no new golden fixture; migrations.ts's import block (migrations.ts:9-20: `emptySeasonRecord`, `isCappedTier`, `KID_ID`, `openingCoachId`, `seasonStartWeek`, `seedWorldForV6`, `startingSkills`, `WorldState`…) resolves through the barrel unchanged.

**UI wiring: none.** All 9 components/2 composables import the barrel; sim.worker.ts's 22-symbol import (sim.worker.ts:1-23) is untouched.

**Stop-rule.** The split is DONE when world.ts is a re-export-only composer with zero function bodies. What stays there permanently: the public-surface barrel and its layering comment. Explicitly out of scope – do not drift into: splitting `tickWeek`'s body into per-step functions (that reshapes code the draw-order discipline is pinned to), renumbering the fossilized step labels '0a00'/'0a0c-bis' (review 02:26 – comment-only, separate PR if ever), migrating tests/tools/UI to deep imports, moving UI-consumed constants to shared/ (review 01:31 – its own item), any tuning fix flagged in moved comments (e.g. the skipEvent under-payment noted at world.ts:4373-4377 stays as-is). Post-split rule for every future wave: new engine behavior = new or existing module under src/engine/world/ + one barrel line; a PR adding a function body to world.ts fails review.

## Test plan

TDD order – the net goes up before anything moves:
1. **PR0 first**: barrel-surface pin test + no-barrel-import/no-`export *` guard (above). These are the only new tests; everything else in this package is protected by tests that already exist, which is the point.
2. Per extraction PR, in order: `npm run check` (vue-tsc + 91-file unit project + vite build). The unit project already includes the three decisive suites: the frozen capture (tests/injuries.test.ts REF 41550/e6b0c709, tests/condition.test.ts:115), goldenSaves.test.ts (all 35 fixtures v0-v34 migrate to current schema), and world.test.ts/world-trio.test.ts exercising the moved orchestration through the barrel.
3. `npm run test:sim` per wave (at minimum after PR4, PR13, PR15): judge by the vitest reporter summary, not the exit code – `test:sim` currently exits 1 on green (review README:16, chapter 07), which is a separate fix.
4. Golden-save impact: zero. Acceptance asserts `SAVE_SCHEMA_VERSION === 34` and no files under tests/fixtures/saves/ change in any PR of this package.
5. What proves it works: after PR15, `git diff` of every PR shows only moves + import/re-export lines; frozen capture numbers never re-pinned; barrel pin list byte-identical from PR0 to PR15; `npm run build` bundle still builds (worker chunk unchanged in behavior).

## Acceptance criteria

- [ ] src/engine/world.ts ≤ 200 lines, contains no function bodies, only explicit named re-exports + doc comment; `./world` imports still resolve to it (no world/index.ts exists).
- [ ] All 15 modules exist with the mapped contents; no module imports the barrel; no `export *` anywhere in the package (enforced by test).
- [ ] tests/worldBarrel.test.ts pins the runtime export surface and it is identical before PR1 and after PR15.
- [ ] Frozen capture untouched: tests/injuries.test.ts and tests/condition.test.ts pass with count 41550 / hash e6b0c709 / head / tail unmodified in every PR – zero re-pins in the package's history.
- [ ] `SAVE_SCHEMA_VERSION` still 34; goldenSaves.test.ts green; tests/fixtures/saves/ has zero diffs.
- [ ] `npm run check` green after every PR; sim project green (by reporter output) after each wave.
- [ ] Zero changes under tests/ (except the new PR0 file), tools/, src/components, src/composables, src/stores, src/worker, src/db.
- [ ] Engine imports nothing from Vue/Pinia/UI (unchanged invariant, grep-verified at the end).

## Risks & alternatives

- **Merge conflict with an in-flight wave branch** – the very disease being cured can infect the cure (the file moved 228 lines during the review window). Mitigation: land this package in a quiet window or between waves; every PR is a pure move, so rebasing is re-cutting the same ranges, and the order allows pausing after any PR with the repo fully consistent.
- **Hidden coupling forces a placement change** (a callee discovered mid-PR that lives in a not-yet-extracted module). Rule: move the callee DOWN to the lowest module that needs it within the same PR, never import upward, never introduce a wrapper – the DAG order above already absorbed the two known traps (`rollInjury` → `withdrawEvent`/`refundPractice`; `entryStatus` → `rankIn`).
- **PR overhead / CI minutes**: 15 PRs is deliberate for reviewability, but if quota bites, fall back to one branch per wave (A = PR0-4, B = PR5-13, C = PR14-15) with one commit per extraction, each commit locally green via `npm run check`.
- **Alternative (runner-up): flat files in src/engine/** (`gates.ts`, `commands.ts`, `lifecycle.ts`, `snapshot.ts`, `worldState.ts`) per review 01:22. Fewer directories, but 15 generically-named files would blur the leaf-vs-world-facade distinction that world.ts:123-169 documents, and season// match/ set the subdirectory precedent. Same mechanics either way; switching is a rename.
- **Alternative rejected: big-bang split in one PR.** One 5,500-line diff is unreviewable and unrebase-able, and a single mistake poisons the whole tree; the per-PR frozen-capture gate is exactly the safety net the staged form buys.

## Dependencies

None hard. Coordination notes: the RNG-persistence proposal (schema v35, review README:15) rewrites the worker/`advanceWeeks` seam – do not run it concurrently with PR14 (lifecycle.ts); either strict order works. P1 (endings) and P2 (morale/relationship) both land in the tick pipeline, commands and snapshot – waves A+B are useful to them immediately, and finishing PR13-15 before those features branch confines their diffs to lifecycle.ts/commands.ts/snapshot.ts (~1,300 lines) instead of the 5,521-line hot-spot.
