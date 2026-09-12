// THE FROZEN-CAREER APPARATUS – the eighteen constants, the walk that produces them, and the
// per-key protocol that governs both.
//
// ⚠ WHY THIS EXISTS. `tests/coach-travel-edge.test.ts` was one 2,571-line file and it walked into
// birpc's unraisable 60 s RPC window on CI: `43 passed (43)`, `Test Files 1 passed (1)`, and then
// one unhandled `Timeout calling "onTaskUpdate"` – exit 1 at 62,889 ms of test time on a two-core
// runner. That is the all-green-non-zero shape scripts/units.mjs's header was written about, and
// `scripts/units.mjs` had already given this file a process of its own, so the FILE was the unit
// and the file had to be cut – exactly as radar's was on 11.08 and fatigue-bench-policy's on 27.08.
// It is now three, and the last two share everything below this header:
//
//   coach-travel-edge-helping.test.ts        the travel helping – claims 1-3 of the design header
//   coach-travel-edge.test.ts                the live hashes and the v62-v67 rungs (KEEPS the path)
//   coach-travel-edge-older-schemas.test.ts  the P5/v49 - v61 rungs below them
//
// ⚠⚠ AND TWO FILES WOULD NOT HAVE DONE IT, which is the finding worth carrying. The honest seam is
// behaviour / frozen identity – they are two different kinds of test that happen to share a fixture
// – but that seam does not move the number. MEASURED SOLO before anything was touched, one vitest
// process, `--project unit --reporter=json`, 43 tests in 28.09 s of test time:
//
//     the byte-identity describe            27.65 s   20 cases · 55 career walks at ~0.50 s each
//     the other seven describes              0.43 s   23 cases
//
// **98.5 % of the cost is in ONE describe.** Cutting the behaviour off it buys 0.43 s of the 62.9 s
// that failed, so the frozen half alone would still have read ~62 s on that runner – a file left
// sitting ON the wall, which is the thing fatigue-bench-policy spent two weeks proving is not a
// cut. The second seam therefore runs through the version ladder itself, and it is the only seam
// here that moves the number. Solo, same invocation, after the cut:
//
//     coach-travel-edge                     12.6 s   10 cases  (FROZEN · PRE_R28B · v62-v67)
//     coach-travel-edge-older-schemas       15.0 s   10 cases  (v61 down to P5/v49)
//     coach-travel-edge-helping              0.9 s   23 cases
//
// The largest is 15.06 s, which is where radar's largest third landed. This file's own local -> CI
// factor is 2.24x (62,889 / 28,083 ms, the same 43 tests on both), so 15.06 s projects to ~34 s on
// that runner and needs a further 1.8x unlucky stretch to reach the wall; the other frozen file
// projects to ~28 s and the behaviour file to ~1 s.
//
// ⚠ IT IS A SPLIT AND NOT A DIET. Every seed, every preset, every policy, every 156-week horizon
// and all 43 test names crossed over unchanged, and NOT ONE HASH MOVED – the same 18 constants
// reproduce from the same walk. Both frozen files keep the ORIGINAL describe name, deliberately, so
// every full test name is still the name it was and nothing outside can have been pointed at
// nothing. scripts/units.mjs's own rule is what governs the shape of the cut: trimming seeds until
// a file fits buys speed with coverage, and that trade is made deliberately and measured, never as
// a side effect of making a wall.
//
// ⚠⚠ AND THE CONSTANTS DID NOT SPLIT WITH THE TESTS. `careerHashAtSchema`'s key-peeling is the one
// piece of this apparatus that must never have two truths – it drops `assets`, then `peakPhysical`,
// then the masseur's three, in reverse order of the appends that created them, and every one of the
// eighteen older identities reproduces only because it is the SAME code – so the walk, the peel and
// the whole ladder live HERE, once, and the two test files import them. Duplicating them into two
// halves is the hand-maintained second copy `scripts/heavy-tests.mjs` exists to make impossible.
//
// ⚠ SO "THIS FILE" IN EVERY BLOCK BELOW MEANS THIS ONE. The per-key diff protocol, the
// control-is-your-own-change rule, the twice-caught `PRE_V64` and the zsh word-split warnings were
// written when the constants and the tests were one file. They are the record of the CONSTANTS, so
// they travelled with the constants rather than being left behind or summarised. A wave that moves
// a frozen career answers to this module and re-freezes the constants in it.
//
// ⚠ RE-STAMP, 12.09 (round 41, items 15+27 – the owner's A1: junior ad letters from 16, her prize
// share from her first W start). ONE career moved – 8k · self-coached · player – on every rung:
// the policy accepts a junior ad letter, the shoot weeks shift her calendar (results, rank,
// trophies), and the under-18 split moves the money keys. The protocol ran before the re-freeze:
// tools/frozen-key-diff.ts --preset 0 --policy 1 on both trees – 13 keys moved (careerTotals,
// events, financeWeeks, fundsCents, kidFundsCents, kidRankWta, lastSeasonSummary, nextEventId,
// offers, prevKidRankWta, results, seasonHistory, trophiesByTier) and **rngMain is byte-identical
// (d84bcbf0c481 on both)** – values moved, the stream did not, which is the stop condition and the
// fairness law holding. Both grinder careers reproduced untouched. 25 constants re-stamped (24
// unique – selfTravelling shares one value across two adjacent rungs). Full table:
// docs/rounds/round-41.md, the coordinator's tail.

import { expect } from 'vitest'
import { createHash } from 'node:crypto'
import { sponsorWindowClosesAt } from '../src/engine/offers'
import { physicalMean } from '../src/engine/development'
import type { PlayerProfile } from '../src/shared/protocol'
import { openCareer, stepCareerWeek, PRESETS, POLICIES } from '../tools/econ-bench'

// =================================================================================================
// ⭐⭐⭐ RE-STAMPED FOR WAVE 3's T16b + THE KNOCK DRAIN (12.09.2026) – **ALL SEVENTY-FIVE**, WHICH IS
// EVERY CELL IN THIS MODULE AND THE FIRST TIME THAT HAS HAPPENED. `rngMain` IS BYTE-IDENTICAL ON ALL
// THREE CAREERS AND THE FROZEN MAIN CAPTURE IS UNMOVED.
// =================================================================================================
//
// WHAT MOVED THEM, AND IT IS **TWO CHANGES DELIBERATELY MEASURED AS ONE**. The brief ruled them into a
// single commit for exactly this reason: both reach these careers, and taken separately they would have
// forced two full re-stamps of the same seventy-five cells.
//
//   (1) T16b – THE WIDENER (the owner's ruling 12.09, «мне это не очень нравится»). T16's two
//       DETERMINISTIC classes come out of `world/knock.ts` `knockNeedsTheParent`; `'warn'` becomes the
//       second widener of `coachEscalates`' doubt zone beside `REPEAT_DOUBT` (`WARN_DOUBT` 3), and
//       `ESCALATE_CAUTION` takes the one authorised step, 3.5 -> 4.5. T16's own bench had flattened the
//       coach ladder from a 2x budget-to-elite span to 1.08x and dropped the Elite coach from deciding
//       95% of knocks alone to 31%.
//   (2) THE SHARED KNOCK DRAIN (`tools/_knocks.ts`, the wave's point 5). `tools/econ-bench.ts` – THE
//       HARNESS THIS MODULE WALKS ITS CAREERS WITH – never answered a knock. An undecided knock does not
//       expire, it blocks time, and `rollKnock` raises no new one while it is open, so one escalation
//       latched the slot for the rest of the walk. It now answers `'rest'`, the same answer in every
//       policy and preset.
//
// ⚠⚠ AND (2) IS WHY `selfTravelling` MOVED, WHICH T16 COULD NOT DO. T16's note ends «`coachManagesLoad`
// is false, so `coachDecidesKnock` is never called on this career and T16 cannot touch it» – still true,
// and irrelevant now: a self-coached career escalates EVERY knock to a parent who, on this harness, was
// never there. The drain is the parent. So all twenty-five `selfTravelling` cells move for the first
// time since they were frozen, and they move for a HARNESS reason rather than an engine one.
//
// ⚠ PER-KEY DIFF TAKEN FIRST, as this file's protocol demands, with MY OWN CHANGE NEUTRALISED IN PLACE
// as the control – `src/engine/coachLoad.ts`, `src/engine/world/knock.ts` and `tools/econ-bench.ts`
// restored from `HEAD` for the A arm and copied back for B, which is the whole of this step's
// behavioural reach on a bench walk (the other five drained tools are not on this path). Both arms
// verified before they were read, CLAUDE.md's null-arm check run in BOTH directions:
//
//     A: WARN_DOUBT 0 · ESCALATE_CAUTION 3.5 · T16 classes 1 · widener call 0 · drainKnock 0
//     B: WARN_DOUBT 5 · ESCALATE_CAUTION 4.5 · T16 classes 0 · widener call 1 · drainKnock 2
//
// `tools/frozen-key-diff.ts`, all three careers, 156 weeks:
//
//   · 5/0 (25k middle, middle coach, grinder)  – **19 KEYS OF 78**: `careerTotals`, `condition`,
//     `events`, `financeWeeks`, `fundsCents` (`b21ba5cff6cf` -> `e5e35fcd6a3b`), `injuryHistory`,
//     `knock`, `knockHistory`, `lastSeasonSummary`, `medicalWithdrawalWeek`, `nextEventId`, `offers`,
//     `peakPhysical`, `prevKidRankDomestic`, `results` (`817a59ad94bb` -> `e3d93f1e624b`),
//     `seasonEntries`, `seasonHistory`, `skills`, `trophiesByTier`. ⚠ `bond` did NOT move
//     (`6299debd6743` both arms).
//   · 8/0 (120k wealthy, elite coach, grinder) – **25 KEYS OF 78**: the nineteen above less
//     `medicalWithdrawalWeek`, `offers` and `seasonEntries`, plus `bestFinishByTier`, `bond`
//     (`1a6562590ef1` -> `6299debd6743`), `internationalEntryWeeks`, `kidRank`, `milestones`,
//     `prevKidRank`, `seasonRecord`, `seasonStartRank` and `seasonWins`; `results` `2e333910e713` ->
//     `3db6720ce659`, `fundsCents` `73eda5bc634a` -> `62f148b9763c`.
//   · 0/1 (8k working, self-coached, PLAYER)   – **EXACTLY 6 KEYS OF 79**: `events`, `knock`,
//     `knockHistory`, `nextEventId`, `peakPhysical`, `skills`. ⭐ AND WHAT DID NOT MOVE IS THE
//     INTERESTING HALF: `results`, `fundsCents`, `bond`, `condition` and `spirit` are all byte-identical
//     on this career. Resting the knocks she had been left holding changes her TRAINING and her feed
//     over 156 weeks; it does not change a match she played or a cheque the family banked.
//
// ⚠⚠ WHAT DID **NOT** MOVE IS THE HALF THE BRIEF NAMED AS THE STOP CONDITION, AND IT HOLDS ON ALL
// THREE: `rngMain` is byte-identical – `1dbff28caca2` (5/0), `aebc8101d6df` (8/0), `d84bcbf0c481`
// (0/1), the same three strings T5, T6, T15 and T16 recorded. Neither change takes a draw on any
// stream: the widener is arithmetic over a ledger flag and an integer comparison, and the drain is an
// existing command answered at an existing moment.
//
// ⭐ THE JAM, MEASURED ON BOTH ARMS (`arrived / escalated / weeks holding an open knock / open at 156`):
//
//     career   A (T16, no drain)                 B (T16b + drain)
//     5/0      4 · 3 · **47** · yes              6 · 0 · **0** · no
//     8/0      3 · 2 · **39** · yes              6 · 0 · **0** · no
//     0/1      3 · 3 · **106** · yes             7 · 0 · **0** · no
//
// ⚠ THE BRIEF PREDICTED «~2» AND THE ANSWER IS **0**, which is worth stating rather than rounding to
// the prediction: ~2 was the PRE-T16 reading, when the rare escalation still sat open for a week or two
// before the walk ended. A drain that answers in the same tick leaves no week holding one at all. Note
// the other column too – ARRIVALS GO UP on every career (4->6, 3->6, 3->7), because an open knock was
// blocking the next one. These fixtures now walk MORE game than they did, not less; T16's own note
// flagged the opposite direction as «worth its own look», and this is that look.
//
// ⚠⚠ EVERY NEW VALUE WAS COMPUTED BY RUNNING THE EXPORTED HELPERS (`careerHash`, `careerHashAtSchema`
// at all twenty-two rungs, `careerHashUnderTheOldName`, `careerHashUnderTheWindowRule`) INSIDE A
// THROW-AWAY VITEST HARNESS THAT WROTE THEM TO A FILE beside the constant each one was compared
// against – never transcribed from a failure message, which elides a hash with an ellipsis. It reported
// **75 MOVED / 0 HELD**, the file's mtime was checked against the run's start, and the splice rewrote
// exactly 75 lines (`git diff --numstat` 75/75). ⚠ 72 DISTINCT OLD VALUES FOR 75 CELLS: `PRE_R28B`'s
// three ARE `FROZEN`'s three (they have been equal since T8), so three replacements are shared – and
// the harness computed all six independently, which is what proves the equality still holds.
//
// ⚠ THE FROZEN MAIN CAPTURE IS UNMOVED AND NOT RE-PINNED: 41550 draws / hash `e6b0c709`,
// tests/condition.test.ts, green on this tree. It holds BY CONSTRUCTION and the per-key `rngMain`
// identity above confirms it from the other side.
//
// =================================================================================================
// ⭐⭐⭐ RE-STAMPED FOR WAVE 3's T16 (11.09.2026, KNOCK ESCALATION) – FIFTY CONSTANTS, AND IT IS THE
// FIRST RE-STAMP IN THIS FILE THAT MOVES `results` AND THE WALLET. `rngMain` IS BYTE-IDENTICAL ON
// ALL THREE CAREERS AND THE MAIN CAPTURE IS UNMOVED.
// =================================================================================================
//
// WHAT MOVED THEM. T16 (the owner's ruling 11.09, «давай попробуем») puts two DETERMINISTIC classes
// beside `coachEscalates`' probabilistic doubt zone in `world/knock.ts` `knockNeedsTheParent`: a knock
// on a REPEATED part, and any knock arriving on a `'warn'` medical-clearance week, now go to the
// parent at every `coachManagesLoad` rung. T12 had measured the coach answering 232 of 280 knocks, so
// the bond table's −3/−5 push rows priced a decision the parent was almost never offered.
//
// ⚠⚠ AND THIS ONE CHANGES THE TENNIS, WHICH NO WAVE-3 RE-STAMP BEFORE IT DID. T5, T6, T8 and T15 all
// ended their note with «`results`, `rngMain` and the wallet are BYTE-IDENTICAL». That is NOT true
// here and it was never going to be: WHO ANSWERS A KNOCK decides whether she rests or trains through
// it, which decides her condition, her injuries and therefore which matches she plays. The brief
// named this in advance and told me to quantify it rather than stop.
//
// ⚠ PER-KEY DIFF TAKEN FIRST, as this file's protocol demands, with MY OWN CHANGE NEUTRALISED IN
// PLACE as the control – `src/engine/world/knock.ts` restored from `HEAD` for the A arm and copied
// back for B, which is the whole of T16's behavioural reach (it is one file, one predicate and one
// call site). Both arms verified before they were read: `grep -c knockNeedsTheParent` returns 0 on A
// and 3 on B – CLAUDE.md's null-arm check run in both directions. `tools/frozen-key-diff.ts`, all
// three careers, 156 weeks, 80 keys each:
//
//   · 0/1 (8k working, self-coached, PLAYER)   – **0 keys. BYTE-IDENTICAL.** ⭐ And this is the
//     strongest single statement available about the reach of the change: `coachManagesLoad('self')`
//     is false, so `coachDecidesKnock` is never called on this career and T16 cannot touch it. All
//     TWENTY-FIVE `selfTravelling` constants in this file reproduce, measured rather than promised.
//   · 8/0 (120k wealthy, elite coach, grinder) – **13 KEYS OF 80**: `careerTotals`, `condition`,
//     `events`, `financeWeeks`, `fundsCents` (`941f30c12e89` -> `73eda5bc634a`), `knock`,
//     `knockHistory`, `lastSeasonSummary`, `medicalWithdrawalWeek`, `nextEventId`, `peakPhysical`,
//     `seasonHistory`, `skills`. ⚠ `bond` (`1a6562590ef1`) and `results` (`2e333910e713`) did NOT
//     move on this arm – her escalated knocks are never ANSWERED on a bench walk, so no bond delta is
//     ever taken, and this career's match results survive the changed condition path intact.
//   · 5/0 (25k middle, middle coach, grinder)  – **20 KEYS OF 80**: the thirteen above plus `bond`
//     (`a21855da08cb` -> `6299debd6743`), `results` (`6158655025ef` -> `817a59ad94bb`),
//     `injuryHistory`, `offers`, `prevKidRankDomestic`, `seasonEntries` and `trophiesByTier`;
//     `fundsCents` `e5e35fcd6a3b` -> `b21ba5cff6cf`.
//
// ⚠⚠ WHAT DID **NOT** MOVE IS THE HALF THE BRIEF NAMED AS THE STOP CONDITION, AND IT HOLDS ON ALL
// THREE: `rngMain` is byte-identical – `1dbff28caca2` (5/0), `aebc8101d6df` (8/0), `d84bcbf0c481`
// (0/1), the same three strings T5, T6 and T15 recorded. T16 takes NO DRAW on any stream: the
// predicate is a ledger flag, one integer comparison and `coachEscalates`' arithmetic.
//
// ⭐ AND THE MECHANISM BEHIND THE WIDTH IS MEASURED, NOT INFERRED, because «20 keys» from a predicate
// that takes no dice deserves an explanation. `tools/econ-bench.ts` NEVER ANSWERS A KNOCK – it ticks
// directly and no bench taps a dialog – and an undecided knock never expires («Undecided knocks never
// expire – they block time instead», world/knock.ts) while `rollKnock` refuses to raise a new one
// while any knock is open. So on THIS harness the first escalation T16 adds latches the slot open for
// the rest of the walk. Probed on both arms, 156 weeks:
//
//     career                    knocks arrived   escalated   first   weeks with one open   open at 156
//     5/0  before T16                  6             1        w133            2                 no
//     5/0  after  T16                  4             3        w 87           47                yes
//     8/0  before T16                  4             1        w 64           25                 no
//     8/0  after  T16                  3             2        w 64           39                yes
//     0/1  either way                  3             3        w  7          106                yes
//
// ⚠ IT IS A PROPERTY OF THE HARNESS AND NOT OF PLAY: in the game `pendingKnock` blocks `advanceWeeks`,
// so the player cannot walk past an unanswered knock – which is the whole point of the step. 0/1 has
// carried exactly this shape since long before T16 (self-coached, every knock escalates, nobody
// answers), which is why its identity is the control it is.
//
// ⚠⚠ EVERY NEW VALUE WAS COMPUTED BY RUNNING THE EXPORTED HELPERS (`careerHash`,
// `careerHashAtSchema` at all twenty-two rungs, `careerHashUnderTheOldName`,
// `careerHashUnderTheWindowRule`) INSIDE A THROW-AWAY VITEST HARNESS THAT WROTE THEM TO A FILE beside
// the constant each one was compared against – never transcribed from a failure message, which elides
// a hash with an ellipsis. ⚠ The first attempt exited 1 on vitest's 20 s per-test timeout (the walk
// is 47 s) while still writing a complete file; the run was REPEATED with `--testTimeout=600000` and
// the verdict taken from the green one, with the file's mtime checked against its start. It reported
// **50 MOVED / 25 HELD**, and the 25 held are every `selfTravelling` value in the file. The splice
// rewrote exactly 50 lines (`git diff --numstat` 50/50).
//
// ⚠ THE FROZEN MAIN CAPTURE IS UNMOVED AND NOT RE-PINNED: 41550 draws / hash `e6b0c709`,
// tests/condition.test.ts, green on this tree. It holds BY CONSTRUCTION and the per-key `rngMain`
// identity above confirms it from the other side.
//
// =================================================================================================
// ⭐⭐⭐ RE-STAMPED FOR WAVE 3's T5 LAG-TABLE MOVE (11.09.2026) – TWENTY-FIVE CONSTANTS, EVERY ONE OF
// THEM `eliteGrinder`, AND NOT ONE NEW DRAW ANYWHERE IN THE MOVE.
// ⚠ SUPERSEDED BY THE BLOCK ABOVE for `middleGrinder` and `eliteGrinder`; its `selfTravelling`
// statements still stand, character for character.
// =================================================================================================
//
// WHAT MOVED THEM. `ECONOMY.life.lag.open` went from `{ zeroChance: 0.45, min: 1, max: 5 }` to
// `{ zeroChance: 0.70, min: 1, max: 4 }` – who-she-is §4's «Feed lag» row, moved by the owner on the
// wave-3 census miss («двигать таблицу – ок»). It is a PARAMETER move and not a draw move:
// `drawRawLag` reads the same one uniform off the same `seed:life:partner:<sinceWeek>:lag` key and
// compares it with a different threshold. `eliteGrinder` met somebody at week 137, her register is
// `open`, so her raw lag – and with it `knownWeek`, and with it the WEEK the feed row and the `'met'`
// row land – is a different number. The other two careers meet nobody inside 156 weeks.
//
// ⚠ PER-KEY DIFF TAKEN FIRST, as this file's protocol demands, at `a74caca5` with the constant as the
// ONLY difference between the arms – the whole of this step's behavioural reach, since nothing else
// reads the table. Both arms verified before they were read (`grep -c "zeroChance: 0.45"` returns 1
// on A and 0 on B, `zeroChance: 0.70` 0 on A and 1 on B – CLAUDE.md's null-arm check run in both
// directions). `tools/frozen-key-diff.ts`, all three careers, 156 weeks, **78 keys each**:
//
//   · 5/0 (25k middle, middle coach, grinder)  – **0 keys. Byte-identical.** She meets nobody.
//   · 0/1 (8k working, self-coached, PLAYER)   – **0 keys. Byte-identical.** She meets nobody.
//   · 8/0 (120k wealthy, elite coach, grinder) – **EXACTLY 3 KEYS OF 78**: `events`
//     (`ec95ee9ddeb2` -> `8bdd452b4fdd`), `lifeLog` (`df59d088f9c0` -> `3c5d0e9449b8`) and
//     `loveEpisodes` (`f7c55b26eeff` -> `d447eb28e502`).
//
// ⚠⚠ AND WHAT DID **NOT** MOVE IS THE HALF THE BRIEF NAMED AS THE STOP CONDITION: `results`, `rngMain`
// and the wallet are BYTE-IDENTICAL on all three arms – on 8/0 they still read `2e333910e713`,
// `aebc8101d6df` and `941f30c12e89`, the same three strings T6 and T15 recorded – and so are `bond`,
// `spirit`, `condition`, `careerTotals` and `financeWeeks`. A lag is a DISCLOSURE date; it touched
// neither the tennis nor the money.
//
// ⚠ TWO PLACES WHERE THE MEASUREMENT DISAGREED WITH THE BRIEF, recorded rather than smoothed over,
// because the protocol's whole point is that the diff is taken and not predicted:
//
//   · the brief expected `lifeLog`, `events` and **`nextEventId`**. `nextEventId` did NOT move
//     (`7e46d737fdca` on both arms) – the SAME NUMBER of feed rows is written either way, only on a
//     different week, so the id counter ends the walk where it ended before.
//   · `loveEpisodes` DID move and the brief did not name it. `knownWeek` is a FIELD ON THE ROW, not
//     a fact stored elsewhere, so the episode list is the first thing a moved lag rewrites.
//
// ⚠⚠ WHY TWENTY-FIVE AND NOT THREE: `events` predates every peel `careerHashAtSchema` has – T6's own
// paragraph below worked this out the first time – so there is no rung low enough to drop it, and all
// twenty-five `eliteGrinder` constants move together, from `FROZEN` down to `PRE_V50`. ⭐⭐ And the
// statement that survives is the same one T6 left: `middleGrinder` and `selfTravelling` reproduce on
// ALL FIFTY of their cells, measured rather than promised.
//
// ⚠⚠ EVERY NEW VALUE WAS COMPUTED BY RUNNING THE EXPORTED HELPERS (`careerHash`,
// `careerHashAtSchema`, `careerHashUnderTheWindowRule`, `careerHashUnderTheOldName`) inside a
// throw-away vitest harness that WROTE THEM TO A FILE together with the constant each one was being
// compared against – never transcribed from a failure message, which elides a hash with an ellipsis.
// The harness was then RE-RUN against the spliced file and reported **held 75 / moved 0**: every one
// of the seventy-five cells in this module reproduces from the code as it now stands. The harness is
// deleted; the re-run is the proof, and it is repeatable by anybody who re-runs the two test files.
//
// ⚠ THE FROZEN MAIN CAPTURE IS UNMOVED AND NOT RE-PINNED: 41550 draws / hash `e6b0c709`,
// tests/condition.test.ts, green on this tree. It holds BY CONSTRUCTION – this step added no stream,
// no draw and no call, and `drawRawLag` never touched MAIN in the first place – and the per-key
// `rngMain` identity above confirms it from the other side.
//
// =================================================================================================
// ⭐⭐⭐ RE-STAMPED FOR WAVE 3's T15 (11.09.2026, THE TIER-1 SOFT SURFACE) – THE SAME TWELVE, AND THE
// CROSS-CHECK THE BLOCK BELOW LEFT FOR THIS STEP **DID NOT MATCH. THAT IS THE FINDING.**
// =================================================================================================
//
// WHAT MOVED THEM. T15 turns the tier-1 raise back on through the SOFT path (who-she-is §5b's SOFT
// BLOCK CONCRETIZED amendment): `rollSmallTalk` is called from `world/phaseHerWeek.ts` again, the
// kind is declared NON-BLOCKING, `pendingLifeBeat` narrows to blocking rows, and a soft row is
// answerable from a Home card for three weeks. So `lifeLog` fills on all three careers again.
//
// ⚠ PER-KEY DIFF TAKEN FIRST, as this file's protocol demands, with MY OWN CHANGE NEUTRALISED IN
// PLACE as the control – the single `rollSmallTalk(world)` call commented out, which is вариант 3's
// state exactly and is the WHOLE of T15's behavioural reach on a bench walk (the `blocking` registry,
// the TTL selector, the snapshot field and the Home card write nothing into a career: the first two
// only answer questions ABOUT a row, and the last two are surface). Both arms verified before they
// were read – `grep -c '^  rollSmallTalk(world)'` returns 0 on A and 1 on B, which is CLAUDE.md's
// null-arm check run in both directions. `tools/frozen-key-diff.ts`, all three careers, 156 weeks,
// headers checked against the invocations:
//
//   · 5/0 (25k middle, middle coach, grinder)  – **EXACTLY 1 KEY OF 80**: `lifeLog`
//     (`4f53cda18c2b`, which is `JSON.stringify([])`, -> `97e136febb30`).
//   · 8/0 (120k wealthy, elite coach, grinder) – **EXACTLY 1 KEY OF 80**: `lifeLog`
//     (`e2b09e7534fb`, T6's `'met'`-only log, -> `df59d088f9c0`).
//   · 0/1 (8k working, self-coached, PLAYER)   – **EXACTLY 1 KEY OF 80**: `lifeLog`
//     (`4f53cda18c2b` -> `4eddca3f246c`).
//
// ⚠⚠ AND WHAT DID **NOT** MOVE IS THE HALF THE BRIEF NAMED AS THE STOP CONDITION: `results`,
// `rngMain` and the wallet are BYTE-IDENTICAL on all three arms – on 8/0 they read `2e333910e713`,
// `aebc8101d6df` and `941f30c12e89`, the same three strings T6's own note records – and so are
// `bond`, `spirit`, `condition`, `careerTotals`, `financeWeeks`, `loveEpisodes`, `events` and
// `nextEventId`. `bond` in particular is untouched because the rows are RAISED AND NOT ANSWERED: a
// bench never taps a card, and a tier-1 reply is priced zero even when somebody does.
//
// ⚠⚠⚠ THE CROSS-CHECK THE PREVIOUS BLOCK LEFT («T8's are the ones to expect») **FAILED, AND IT WAS
// RIGHT TO FAIL.** T8's twelve were `FROZEN` 2688dcd1…/99d79959…/e3353d96…; T15's are
// 4db60d5a…/8ffcb7c9…/501a24c5…. The reason is measured rather than guessed, and it is a real
// difference in BEHAVIOUR rather than in accounting – the two paths raise a different NUMBER of rows:
//
//   · T8 (the hard pause): `tools/econ-bench.ts` walks with `tickWeek` and never drains a beat, so
//     the first row raised stayed unanswered for ever – and T8's own gate refused every later raise
//     while ANY row was pending. Each career therefore ended the walk with exactly ONE small-talk row
//     (8/0 also carries T6's `'met'` row). **PROVED BY RECONSTRUCTION, not by inference**: hashing
//     `[{week:1,kind:'small-talk',detail:'question',answer:null}]` gives `0df08747a27a`, which is
//     T8's own recorded `lifeLog` hash for 5/0 character for character; `[…@5, met@139]` gives
//     `34d43fbd658b` (8/0) and `[…@20]` gives `82084efb4618` (0/1). All three of T8's values are
//     reproduced exactly by a log holding ONE row.
//   · T15 (the soft path): the row stops blocking, the window expires after three weeks, and she
//     comes back – 11, 6 and 10 rows on the three careers, all `answer: null`, capped four a season
//     and never two live at once. The FIRST hit is on the same week in both paths (1, 5 and 20), so
//     the dice are identical: what changed is that the career does not fall silent after it.
//
// ⭐ SO THE RIGHT READING OF THE MISMATCH IS «THE DEFERRAL'S SIDE EFFECT WAS INVISIBLE UNTIL NOW»:
// under the hard pause a walked career got ONE conversation per lifetime, which nobody could have
// noticed while the step was reverted the same day. The soft path is the ruled behaviour and these
// twelve are its first honest measurement.
//
// ⚠ AND THE RUNGS BELOW `lifeLog` ARE UNTOUCHED, WHICH IS THE OTHER HALF OF «ONE KEY». `PRE_V73`
// (`careerHashAtSchema(…, 72)`) is where the peel drops `lifeLog` – v73 is the version that ADDED it
// – and it was RE-RUN on this tree: `9d4480f3b374…`, `a8506c9358a3…`, `91eb11a3acdf…`, the three
// values already in this file, unchanged. Drop `lifeLog` and the entire serialisation comes back.
//
// ⚠⚠ EVERY NEW VALUE WAS COMPUTED BY RUNNING THE EXPORTED HELPERS (`careerHash`,
// `careerHashAtSchema(…, 73)`, `careerHashUnderTheOldName`, `careerHashUnderTheWindowRule`) AND
// WRITTEN TO A FILE, never transcribed from a failure message – vitest elides a hash with an
// ellipsis, which is how a wrong constant survives a wave. ⚠ AND THE FILE'S OWN MTIME WAS CHECKED
// AGAINST THE RUN: the first attempt at this measurement read a STALE file from an earlier session's
// re-stamp (the run itself had exited 1 – `coachTravelEdgeFixtures.ts` imports `expect`, so it
// cannot be driven by `vite-node`), which would have stamped four-day-old numbers into this file.
// The verdict came out of the log, the values out of a file written after it.
//
// ⚠ THE FROZEN MAIN CAPTURE IS UNMOVED AND NOT RE-PINNED: 41550 draws / hash `e6b0c709`,
// tests/condition.test.ts, green on this tree. It holds BY CONSTRUCTION – `rollSmallTalk` takes no
// `Rng` and pulls only from the private `seed:life:smalltalk:<week>` sub-stream – and the per-key
// `rngMain` identity above confirms it from the other side.
//
// =================================================================================================
// ⭐⭐⭐ WAVE 3's T8 RE-STAMP WAS **UN-STAMPED** THE SAME DAY (11.09.2026) – AND THE TWELVE CONSTANTS
// COMING BACK TO THEIR OLD VALUES, CHARACTER FOR CHARACTER, IS THE PROOF THAT THE DEFERRAL IS TOTAL.
// ⚠ SUPERSEDED BY THE BLOCK ABOVE (T15 re-stamped the same twelve a third time); kept because its
// identity is what proves the deferral was total while it stood, and because its «expected» list is
// the cross-check T15 measured against and found wrong – see above for why.
// =================================================================================================
//
// WHAT HAPPENED. T8 shipped tier-1 small talk with a HARD pause and re-stamped twelve constants for
// it – `FROZEN`, `PRE_R28B`, `PRE_NAME_VERA` and the `PRE_V74` rung, across all three careers, ONE
// KEY OF EIGHTY on each and every time it was `lifeLog`. Then the owner ruled **«ВАРИАНТ 3»: THE
// RAISE REVERTED, THE ENGINE KEPT.** `docs/specs/who-she-is-2026-09.md` §5b prices tier 1 «soft –
// answerable, never lost», the brief asked for «the standard machinery (pause, queue,
// re-validation)» which is tier 2's HARD pause, and a soft beat needs a surface. So the ENGINE stays
// – the hazard, the cap, the subject derivation, the constants, the option table, her eighteen
// drafted lines – and the single call that RAISED the beat in `world/phaseHerWeek.ts` is gone.
//
// ⚠⚠ AND THIS IS WHY THE NEXT RE-STAMP IS ALREADY FORESEEABLE, WHICH IS WORTH SAYING HERE RATHER
// THAN LEAVING FOR SOMEBODY TO REDISCOVER. T15 (§5b's SOFT BLOCK CONCRETIZED amendment) turns the
// raise back on through a soft path, so `lifeLog` will fill again on all three careers – and these
// same twelve will have to move again, to values T8 already printed once. **T8's are the ones to
// expect**: `FROZEN` 2688dcd1…/99d79959…/e3353d96…, `PRE_V74` 4d257ece…/944b568d…/da9a8cdb…,
// `PRE_NAME_VERA` 778f9675…/7f458b50…/f9662f0b…, `PRE_R28B` the same three as `FROZEN`. ⚠ EXPECTED
// IS NOT MEASURED: T15 also adds the TTL and the blocking flag, so the per-key diff is taken again
// from scratch and these are a cross-check, never a source.
//
// ⚠⚠ AND THAT IS EXACTLY WHY THIS BLOCK IS AN IDENTITY AND NOT A RE-STAMP. T8's own per-key diff
// named the whole of its reach: `lifeLog` and nothing else, with `results`, `rngMain`, the wallet,
// `bond`, `spirit`, `condition`, `careerTotals`, `financeWeeks`, `loveEpisodes`, `events` and
// `nextEventId` byte-identical, and the row itself raised by ONE call. Remove the call and `lifeLog`
// is empty again on all three careers – so every one of the twelve must come back to the string it
// held at `36257a01~1`. If even one had not, something OTHER than the raise had moved, and the right
// answer would have been to stop rather than to stamp a third value.
//
// ⚠⚠ MEASURED, NOT REVERTED. The twelve were RE-RUN through the exported helpers on this tree
// (`careerHash(5,0)/(8,0)/(0,1)`, `careerHashAtSchema(…, 73)` for `PRE_V74`,
// `careerHashUnderTheOldName` for `PRE_NAME_VERA`, `careerHashUnderTheWindowRule` for `PRE_R28B`'s
// two kit-letter careers and plain `careerHash` for `selfTravelling`, which is how the test asserts
// it), WRITTEN TO A FILE, and compared against the pre-T8 strings read out of git – never
// transcribed from a failure message, which elides a hash with an ellipsis. **ALL TWELVE: MATCH.**
// A `git diff 36257a01~1 -- tests/coachTravelEdgeFixtures.ts` filtered to 64-hex lines is EMPTY.
//
// ⚠ AND THE RUNGS BELOW `lifeLog` WERE NEVER TOUCHED BY EITHER MOVE (nor will T15 touch them).
// `PRE_V73`
// (`careerHashAtSchema(…, 72)`) is where the peel drops `lifeLog` – v73 is the version that ADDED
// it – so it reproduced unchanged THROUGH T8 and reproduces unchanged now; `PRE_V72` likewise. The
// deferral could only ever have reached the three rungs above that peel, and it reached all three.
//
// ⚠ THE FROZEN MAIN CAPTURE NEVER MOVED IN EITHER DIRECTION: 41550 draws / hash `e6b0c709`,
// tests/condition.test.ts, green on this tree. It held BY CONSTRUCTION under T8 – the tier-1 roll
// takes no `Rng` and pulls only from a private `seed:life:smalltalk:<week>` sub-stream – and holds
// now for the stronger reason that the stream is never derived at all.
//
// =================================================================================================
// ⭐⭐⭐ RE-STAMPED AGAIN FOR WAVE 3's T6 (11.09.2026, THE DELIVERY) – AND IT IS THE WIDEST RE-STAMP
// THIS FILE HAS EVER TAKEN: TWENTY-FIVE CONSTANTS, EVERY ONE OF THEM `eliteGrinder`, AND THE OTHER
// TWO CAREERS BYTE-IDENTICAL ON EVERY RUNG.
// =================================================================================================
//
// WHAT MOVED THEM. T6 delivers the news on `knownWeek`: a KEPT feed row (`type: 'life'`, no
// `amountCents`) plus a `'met'` row in `lifeLog`, on the same tick. `eliteGrinder` met somebody at
// week 137 when T3 landed and her shaved lag lands inside the walk, so this career is told inside 156
// weeks and two of its keys gain a row. The other two careers meet nobody and did not move at all.
//
// ⚠ PER-KEY DIFF TAKEN FIRST, as this file's protocol demands, with MY OWN CHANGE NEUTRALISED IN
// PLACE as the control – the single `deliverKnownPartner(world)` call in `world/phaseHerWeek.ts`
// gated off, which is the WHOLE of T6's behavioural change (the per-kind options record, the new
// `WorldEventType` member and `DiaryFacts.partnerKnown` write nothing into a career: the first two
// are shape, the third is snapshot-only and never persisted). `tools/frozen-key-diff.ts` on all
// three careers, 156 weeks:
//
//   · 5/0 (25k middle, grinder)              – **0 keys. Byte-identical.** She meets nobody.
//   · 0/1 (8k working, self-coached, PLAYER)  – **0 keys. Byte-identical.** She meets nobody.
//   · 8/0 (120k wealthy, elite, grinder)      – **EXACTLY 3 KEYS OF 80**, and they are the three the
//     step claims to write: `events` (`7a7e95124752` -> `ec95ee9ddeb2`), `lifeLog` (`4f53cda18c2b`,
//     which is `JSON.stringify([])`, -> `e2b09e7534fb`) and `nextEventId` (`46ff18131a6d` ->
//     `7e46d737fdca`).
//
// ⚠⚠ AND WHAT DID **NOT** MOVE IS THE LOAD-BEARING HALF, because the brief named exactly this as the
// thing that would have stopped the step: `results`, `rngMain` and the wallet are BYTE-IDENTICAL –
// `2e333910e713`, `aebc8101d6df` and `941f30c12e89` on both arms – and so are `bond`, `spirit`,
// `condition`, `careerTotals`, `financeWeeks` and `loveEpisodes` itself. Delivery changed neither the
// tennis nor the money. `bond` in particular is untouched BECAUSE THE BEAT IS RAISED AND NOT
// ANSWERED: the row goes in with `answer: null`, and only `answerLifeBeat` – a player command no
// bench calls – moves the number.
//
// ⚠⚠ WHY TWENTY-FIVE AND NOT FIVE, WHICH IS THE CHARACTER OF THIS STEP AND IS STATED RATHER THAN
// DISCOVERED. T3 wrote a NEW key, so `careerHashAtSchema`'s peel undid it and every rollback rung
// stayed green. T4 changed the VALUE of a key introduced at v72, so the two rungs above v72 moved
// and `PRE_V72` – which peels `spirit` itself – held. T6 changes the value of `events` and
// `nextEventId`, and those predate EVERY peel this file has: there is no rung low enough to drop
// them. So all twenty-five `eliteGrinder` constants move together, from `FROZEN` down to `PRE_V50`,
// and that is the honest shape of «a career lived something inside the walk» rather than «a schema
// gained a field».
//
// ⭐⭐ THE STATEMENT THAT SURVIVES, AND IT IS THE ONE WORTH READING: `middleGrinder` and
// `selfTravelling` reproduce on ALL TWENTY-FIVE RUNGS, untouched, and «untouched» here is a measured
// property of this pass rather than a promise – `careerHash(5, 0)` and `careerHash(0, 1)` were RUN
// and returned `50374fbf5769…` and `8c52158189bf…`, the values already in this file. A career that
// meets nobody is the same career it was before the private life existed, every key, every rung.
//
// ⚠⚠ EVERY NEW VALUE WAS COMPUTED BY RUNNING THE EXPORTED HELPERS (`careerHash`,
// `careerHashAtSchema`, `careerHashUnderTheWindowRule`, `careerHashUnderTheOldName`) and written to a
// file, never transcribed from a failure message – vitest elides a hash with an ellipsis, which is
// how a wrong constant survives a wave. ⚠ `FROZEN.eliteGrinder` and `PRE_R28B.eliteGrinder` are the
// SAME string again after the re-stamp, exactly as they were before it: this career holds no kit
// letter for the window rule to rewrite, so `careerHashUnderTheWindowRule(8, 0)` has always been
// `careerHash(8, 0)` here.
//
// ⚠ THE FROZEN MAIN CAPTURE IS UNMOVED AND NOT RE-PINNED: 41550 draws / hash `e6b0c709`,
// tests/condition.test.ts, green on this tree. It held BY CONSTRUCTION and for the plainest reason a
// step in this wave has had: `deliverKnownPartner` takes no `Rng`, derives no stream and reads facts
// the world already holds – `loveEpisodes`, `lifeLog` and `week`. The per-key `rngMain` identity
// above confirms it from the other side.
//
// =================================================================================================
// ⭐⭐⭐ RE-STAMPED AGAIN FOR WAVE 3's T4 (11.09.2026, THE ATTACHMENT LIFT) – AND THIS ONE IS NOT A
// SCHEMA MOVE. NO KEY WAS ADDED, NO DRAW WAS TAKEN, AND ONE EXISTING KEY CHANGED VALUE ON ONE CAREER.
// =================================================================================================
//
// WHAT MOVED THEM. `accrueSpirit`'s weekly return now walks toward `baseline + attachmentLift` (75)
// instead of a flat `baseline` (70) for as long as `activeEpisode` returns a row – the private life's
// effective baseline (the build plan §1b, «lifts a little and stays lifted»). `eliteGrinder` met
// somebody at week 137 when T3 landed, so from that week on she is a lifted girl and her `spirit` is
// a different number. The other two careers meet nobody inside 156 weeks and did not move at all.
//
// ⚠ PER-KEY DIFF TAKEN FIRST, as this file's protocol demands, with MY OWN CHANGE REVERTED IN PLACE
// as the control – the lift term alone neutralised (`s.baseline + (activeEpisode(world) === null ? 0
// : 0)`), which is the whole of the behavioural change and nothing else. `tools/frozen-key-diff.ts`
// on all three careers, 156 weeks:
//
//   · 5/0 (25k middle, grinder)             – **0 keys. Byte-identical.** She meets nobody.
//   · 0/1 (8k working, self-coached, PLAYER) – **0 keys. Byte-identical.** She meets nobody.
//   · 8/0 (120k wealthy, elite, grinder)     – **EXACTLY 1 KEY OF 79, and it is `spirit`**
//     (`ff5a1ae012af` -> `f369cb89fc62`). `rngMain`, `results`, `events`, the wallet, the body, the
//     skills, `condition`, `bond`, `loveEpisodes` – every one of the other seventy-eight identical.
//
// ⚠⚠ AND THE ONE KEY THAT DID **NOT** MOVE IS THE LOAD-BEARING HALF: `results` IS BYTE-IDENTICAL, so
// the lift changed nobody's match. That is not luck, it is `spiritMatchFactor`'s shape – flat 1.0
// from the knee (60) upward, so a lifted 75 and a baseline 70 play exactly the same tennis. The lift
// buys DISTANCE FROM THE KNEE for the weeks something knocks her down, never a stat rebate. A wave
// that moved `results` here would be a far bigger fact than a re-stamp and would stop at the gate.
//
// ⚠⚠ THE TRAIL ITSELF, PRINTED RATHER THAN INFERRED, because «one key moved» only reassures if the
// shape inside it is the thing the step claims to write. Her spirit, control -> lifted, weeks 136-141:
//
//     control  136:70   137:70   138:70   139:70   140:70   141:70     …  final 70
//     lifted   136:70   137:73   138:75   139:75   140:75   141:75     …  final 75
//
// She is a FIERY girl (intense, 3/wk return), and the first step lands in week 137 – THE ARRIVAL'S
// OWN WEEK, not the one after it. That is the order pin of T4 reproduced on a frozen career: it is
// why `rollArrival` sits immediately before `accrueSpirit` in `world/phaseHerWeek.ts`. Two steps
// (3 then 2) and she holds at 75 – a moved TARGET reached through the standing return rule, never a
// bump: a `+5` perturbation would have put her at 75 in one week and then decayed her back to 70.
//
// ⚠⚠ FIVE CONSTANTS MOVE AND EVERY ONE OF THEM IS `eliteGrinder` – `FROZEN`, `PRE_R28B`,
// `PRE_NAME_VERA` and, UNLIKE T3, the two SCHEMA ROLLBACK rungs `PRE_V74` and `PRE_V73` as well. That
// difference is the whole character of this step and it is stated here rather than discovered: T3
// wrote a NEW key, so peeling the key undid it and both rungs stayed green; T4 changes the value of
// an OLD one (`spirit` arrived at v72), and no peel can un-move a value that the rolled-back shape
// still contains. Those two rungs going red beside a red freeze is exactly what their own
// «⚠ IF THIS GOES RED BESIDE A RED FREEZE, the wave moved a career and not just a schema» was
// written to say, and it is saying it correctly.
//
// ⭐⭐ AND THE RUNG THAT **HELD** IS THE STRONGEST STATEMENT AVAILABLE HERE. `PRE_V72` –
// `careerHashAtSchema(…, 71)` – peels `spirit`, `bond` and `temperament` themselves, because v72 is
// the version that added them. It reproduces on all three careers, UNTOUCHED: the career as it stood
// before the private life existed at all is byte-identical, every key, including `results`,
// `rngMain` and the wallet. Every `PRE_V*` rung below v72 holds for the same reason and none of them
// was re-written.
//
// ⚠⚠ EVERY NEW VALUE WAS COMPUTED BY RUNNING THE EXPORTED HELPERS (`careerHash`,
// `careerHashAtSchema`, `careerHashUnderTheWindowRule`, `careerHashUnderTheOldName`), never
// transcribed from a failure message – vitest elides a hash with an ellipsis, which is how a wrong
// constant survives a wave.
//
// ⚠ THE FROZEN MAIN CAPTURE IS UNMOVED AND NOT RE-PINNED: 41550 draws / hash `e6b0c709`,
// tests/condition.test.ts, green on this tree. It held BY CONSTRUCTION – `accrueSpirit` takes no
// `Rng` and reaches no stream at all, which the per-key `rngMain` identity above confirms from the
// other side.
//
// =================================================================================================
// ⭐⭐ RE-STAMPED FOR v74 (11.09.2026, THE PRIVATE LIFE – WAVE 3) – ONE KEY WAS APPENDED TO THE WORLD
// AND NOT ONE OTHER BYTE OF ANY CAREER MOVED. The narrowest legitimate re-freeze this file
// recognises, in v49's own sense, and the wave-2 block directly below is the pattern it repeats.
// =================================================================================================
//
// WHAT MOVED THEM. `SAVE_SCHEMA_VERSION` 73 -> 74, and `createWorld`'s literal gains ONE key:
// `loveEpisodes` – every attachment this career has lived, append-only, the ACTIVE one DERIVED from
// the list (`activeEpisode`: the last row with `endedWeek === null`) rather than stored beside it.
// Every frozen career carries it and every frozen career carries it EMPTY.
//
// ⭐⭐ AND THE REASON IT IS EMPTY IS STRONGER HERE THAN AT ANY RUNG ABOVE IT, which is the sentence
// worth carrying. v73's `lifeLog` was empty because the walk stops at 156 weeks and the only beat
// that wave raised opens at ~241 – a fact about THESE CAREERS. This wave's T1 ships the list, the
// migration and the selector and **no writer whatsoever**: the arrival hazard is T3. So the list is
// empty because nothing in the tree can append to it – a fact about the TREE – and this rung
// therefore proves nothing yet about a career that lives an attachment inside 156 weeks. The step
// that adds `rollArrival` answers that question, by reproducing here or by not.
//
// ⭐⭐ THE PER-KEY DIFF IS TAKEN AS AN IDENTITY RATHER THAN AS A REPORT, WHICH IS STRICTLY STRONGER –
// v72's and v73's own note, repeated. `PRE_V74` below is `careerHashAtSchema(…, 73)` – this world
// with the one new key peeled and the version rolled back – and its three values are the VERBATIM
// v73 `FROZEN` constants, character for character:
//
//     middleGrinder   c7d3eb487706…   eliteGrinder   3a6b22de71f3…   selfTravelling   e2f230aaeffe…
//
// So the diff is `schemaVersion` + `loveEpisodes` and provably nothing else – all eighty keys,
// `rngMain` and `results` and `events` and the wallet included.
//
// ⚠ AND THE PER-KEY TOOL WAS RUN FIRST ANYWAY, BEFORE A CONSTANT WAS TOUCHED, because that is the
// order this file's protocol fixes and the identity above is only available AFTER the peel is
// written. `tools/frozen-key-diff.ts` on all three careers (`--preset 5 --policy 0`,
// `--preset 8 --policy 0`, `--preset 0 --policy 1`), control = this branch at `cb3a3a18` with no
// edit in the tree, reports exactly TWO moved lines on each: `schemaVersion`, and `loveEpisodes`
// APPEARING, with hash `4f53cda18c2b` – which is `JSON.stringify([])` and is the same hash `assets`
// carries on these careers. Seventy-seven other keys byte-identical.
//
// ⚠⚠ THE FROZEN MAIN CAPTURE IS UNMOVED AND NOT RE-PINNED: 41550 draws / hash `e6b0c709`,
// tests/condition.test.ts, green on this tree. It held BY CONSTRUCTION and for the plainest reason
// any rung in this file has had: the step takes NO DRAW ON ANY STREAM AT ALL – `createWorld` writes
// a literal `[]` and the migration writes a literal `[]`.
//
// ⚠ EVERY `PRE_V*` RUNG BELOW IS UNTOUCHED and still reproduces, because `careerHashAtSchema` peels
// the new key ahead of all ten of its older peels – see its v74 note. Nine constants move (`FROZEN`,
// `PRE_R28B`, `PRE_NAME_VERA`); the rest do not, and «untouched» there is a property of this pass
// rather than a promise: they were not re-written with their own values.
//
// ⚠⚠ EVERY NEW VALUE WAS COMPUTED BY RUNNING THE EXPORTED HELPERS, never copied from a failing test
// report – vitest elides a hash with an ellipsis, which is how a wrong constant survives a wave.
//
// =================================================================================================
// ⭐⭐ RE-STAMPED FOR v73 (09.09.2026, THE PRIVATE LIFE – WAVE 2) – ONE KEY WAS APPENDED TO THE WORLD
// AND NOT ONE OTHER BYTE OF ANY CAREER MOVED. The narrowest legitimate re-freeze this file
// recognises, in v49's own sense, and the wave-1 block directly below is the pattern it repeats.
// =================================================================================================
//
// WHAT MOVED THEM. `SAVE_SCHEMA_VERSION` 72 -> 73, and `createWorld`'s literal gains ONE key:
// `lifeLog` – every life beat this career has lived, append-only, the row's own `answer: null` being
// the pending state. Every frozen career carries it and every frozen career carries it EMPTY, which
// is a fact about these careers rather than about the field: the only beat wave 2 raises is the
// fork's own opinion, the fork opens at week ~241, and this walk stops at 156.
//
// ⭐⭐ THE PER-KEY DIFF IS TAKEN AS AN IDENTITY RATHER THAN AS A REPORT, WHICH IS STRICTLY STRONGER –
// v72's own note, repeated. `PRE_V73` below is `careerHashAtSchema(…, 72)` – this world with the one
// new key peeled and the version rolled back – and its three values are the VERBATIM v72 `FROZEN`
// constants, character for character:
//
//     middleGrinder   9d4480f3b374…   eliteGrinder   13fe091bbf8a…   selfTravelling   91eb11a3acdf…
//
// So the diff is `schemaVersion` + `lifeLog` and provably nothing else – all eighty keys, `rngMain`
// and `results` and `events` and the wallet included.
//
// ⭐⭐ AND THAT IDENTITY IS ALSO THE PROOF THAT THE WAVE'S THREE NEW MECHANISMS CANNOT REACH A CAREER
// THAT NEVER GETS TO THE FORK. `advanceRefusal` gained a member, `answerFork` gained a refusal, and
// the fork's opening tick gained a want-draw on `seed:life:fork:<seasonIndex>` – and if any of the
// three had fired inside 156 weeks the rollback could not reproduce anything, because the beat moves
// `bond` and a refused advance moves the calendar. It reproduces exactly, on all three careers.
// That is the wave's «stop-after-any-step» claim measured rather than argued.
//
// ⚠⚠ THE FROZEN MAIN CAPTURE IS UNMOVED AND NOT RE-PINNED: 41550 draws / hash `e6b0c709`,
// tests/condition.test.ts, green on this tree. It held BY CONSTRUCTION – the wave's one draw is on
// the purpose-scoped `seed:life:fork:<seasonIndex>` sub-stream, re-derived at the call site, and the
// two deltas are arithmetic.
//
// ⚠ EVERY `PRE_V*` RUNG BELOW IS UNTOUCHED and still reproduces, because `careerHashAtSchema` peels
// the new key ahead of all nine of its older peels – see its v73 note. Nine constants move (`FROZEN`,
// `PRE_R28B`, `PRE_NAME_VERA`); the rest do not, and «untouched» there is a property of this pass
// rather than a promise: they were not re-written with their own values.
//
// ⚠⚠ EVERY NEW VALUE WAS COMPUTED BY RUNNING THE EXPORTED HELPERS, never copied from a failing test
// report – vitest elides a hash with an ellipsis, which is how a wrong constant survives a wave.
//
// =================================================================================================
// ⭐⭐ RE-STAMPED FOR v72 (09.09.2026, THE PRIVATE LIFE – WAVE 1) – THREE KEYS WERE APPENDED TO THE
// WORLD AND NOT ONE OTHER BYTE OF ANY CAREER MOVED. The narrowest legitimate re-freeze this file
// recognises, in v49's own sense (v66-v71 repeated), and it is the FIRST time that shape has been
// claimed for an append of MORE THAN A VERSION NUMBER – so it is measured harder, not asserted.
// =================================================================================================
//
// WHAT MOVED THEM. `SAVE_SCHEMA_VERSION` 71 -> 72, and `createWorld`'s literal gains three keys:
// `spirit` (the weather – how she is this week), `bond` (the standing) and `temperament` (who she
// is). Every frozen career carries all three from week 0, and `spirit` MOVES week by week – so this
// is not the `ageCurve`/`brandStrengthSeed` shape where the new key is unreachable in 156 weeks. The
// hashes had to move, and the question worth answering was whether anything ELSE did.
//
// ⭐⭐ THE PER-KEY DIFF IS TAKEN AS AN IDENTITY RATHER THAN AS A REPORT, WHICH IS STRICTLY STRONGER.
// `PRE_V72` below is `careerHashAtSchema(…, 71)` – this world with exactly the three new keys peeled
// and the version rolled back – and its three values are the VERBATIM v71 `FROZEN` constants,
// character for character:
//
//     middleGrinder   294a473b91e3…   eliteGrinder   e1ad5f37d518…   selfTravelling   b96bf3ba8965…
//
// A key-by-key report says "these keys moved"; this says «drop the three new keys and the ENTIRE
// serialisation comes back byte for byte» – all seventy-odd of them, `rngMain` and `results` and
// `events` and the wallet included. So the diff is `schemaVersion` + `spirit` + `bond` +
// `temperament` and provably nothing else, and no per-key tool run could have said more.
//
// ⭐⭐ AND THAT IDENTITY IS ALSO THE PROOF THAT THE MATCH SEAM DID NOT BITE. `spiritMatchFactor` is a
// real multiplier on her five wings and it would have changed WHO WINS the moment spirit went under
// the knee (60) – which would have moved her results, her ranking, her cheques and her body, and the
// rollback above could not then reproduce anything. It reproduces exactly, on all three careers over
// 156 weeks: spirit stayed at or above the knee throughout, factor 1.0, tennis unmoved. That is the
// wave's «migrated saves play byte-identical matches until something moves her» claim, measured on
// three careers rather than argued.
//
// ⚠⚠ THE FROZEN MAIN CAPTURE IS UNMOVED AND NOT RE-PINNED: 41550 draws / hash `e6b0c709`,
// tests/condition.test.ts, green on this tree. It held BY CONSTRUCTION – both weekly rules are pure
// arithmetic with no `Rng` at all, and the one draw the wave takes (`temperamentFor`) is on the
// purpose-scoped `seed:temperament` sub-stream, taken once at birth, never on MAIN.
//
// ⚠ EVERY `PRE_V*` RUNG BELOW IS UNTOUCHED and still reproduces, because `careerHashAtSchema` peels
// the three new keys ahead of all eight of its older peels – see its v72 note. Nine constants move
// (`FROZEN`, `PRE_R28B`, `PRE_NAME_VERA`); fifty-four do not, and «untouched» there is a property of
// this pass rather than a promise: they were not re-written with their own values.
//
// ⚠⚠ EVERY NEW VALUE WAS COMPUTED BY RUNNING THE EXPORTED HELPERS, never copied from a failing test
// report – vitest elides a hash with an ellipsis, which is how a wrong constant survives a wave.
//
// =================================================================================================
// ⭐⭐ RE-STAMPED FOR v71 (08.09.2026, ROUND 39 #5 – wave EF) – THE SCHEMA NUMBER MOVED AND NOT ONE
// OTHER BYTE, WHICH IS THE NARROWEST LEGITIMATE RE-FREEZE THIS FILE RECOGNISES (v49's own sense,
// v66/v67/v68/v69 repeated).
// =================================================================================================
//
// WHAT MOVED THEM. `SAVE_SCHEMA_VERSION` 70 -> 71: round 39 #5 adds `world.brandFounded` so a
// REPEAT merch-brand founding can be priced at the market (`assetEntryPriceCents`), and the same
// wave's round 39 #3 moves the ad-contract term onto the band. NEITHER reaches a frozen career:
// `brandFounded` is written only by `buyAsset` on a business rung (no frozen policy buys the shelf)
// and never by `createWorld`, and an ad letter cannot arrive before eighteen while the walk stops at
// week 156 (age ~17).
//
// PER-KEY DIFF TAKEN FIRST, AS THE PROTOCOL DEMANDS. Control = a detached worktree at `436f9cac`
// (this wave's base – provably the tree the constants were last green on), reader-absence checked in
// the negative direction: `git grep brandFounded -- src` returns 0 files there and 4 on the branch.
// `tools/frozen-key-diff.ts` on the three frozen careers, control vs branch:
//
//     · 5/0 (25k middle, grinder)              **1 of 74 keys: `schemaVersion`**
//     · 8/0 (120k wealthy, elite, grinder)     **1 of 74 keys: `schemaVersion`**
//     · 0/1 (8k working, self-coached, PLAYER) **1 of 74 keys: `schemaVersion`**
//
// `rngMain` byte-identical on all three (the diff names schemaVersion alone), and the frozen MAIN
// capture is unmoved and not re-pinned: 41550 / e6b0c709, green on this tree.
//
// THE RE-CUT, mechanically: the three live constants and their two transform twins (`PRE_R28B`,
// `PRE_NAME_VERA`) move to the new stamp; every `PRE_V*` rung below is UNTOUCHED and still
// reproduces, and the new `PRE_V71` rung holds the v70 stamp so the identity «rolling ONLY the
// schema number back to 70 reproduces the v70 hashes byte for byte» is asserted rather than
// remembered. Every value was COMPUTED by running the exported helpers, never copied from a report.
// =================================================================================================
// =================================================================================================
// ⭐⭐ RE-FROZEN FOR ROUND 38 #17 (07.09.2026) – THE FIT SPAN WIDENS, AND ONLY THE COACHED CAREERS
// FELT IT. FORTY-TWO OF THE SIXTY-THREE CONSTANTS MOVE; NOT ONE `selfTravelling` VALUE IS TOUCHED.
// =================================================================================================
//
// ⚠ THIS IS THE SINGLE RE-CUT THAT OWES THREE AGENTS A DIFF, in the discipline re-freeze #13 below
// set: three agents in this wave moved these careers and each correctly declined to re-freeze rather
// than bake in the others' unattributed movement. Round 38 C4 moved them earlier in the same wave and
// its own diff against the wave start is the block directly under this one; this note names only what
// #17 added ON TOP of it, which is why its control is C4's own commit and not the wave's start.
//
// WHAT MOVED THEM. `ECONOMY.coach.fitFactor` **1.05/0.94 -> 1.25/0.75**, ruled by the owner from the
// real sport – Björn Borg's career-long coach was not a star coach, and the partnership was what
// mattered. The fit span is now **x1.667 against the coach ladder's x1.402** (`developmentFactor`,
// self 0.82 to elite 1.15), so the MATCH outweighs the TIER, which is the whole of the item. A change
// to what a coach is worth every week of a career cannot leave a COACHED career's development,
// results, rankings or wallet untouched: a narrow diff would have been the alarming outcome here.
//
// PER-KEY DIFF TAKEN FIRST, AS THIS FILE DEMANDS, and on THE THREE CAREERS THIS FILE ACTUALLY FREEZES
// (5/0, 8/0, 0/1) rather than on the 0/1/2 shorthand – the round-30 #27 note's warning, obeyed.
// `tools/frozen-key-diff.ts`, 156 weeks, headers read against the invocation on all six captures
// (`# preset N policy M weeks 156`). ⚠ THE CONTROL IS A DETACHED WORKTREE AT `cffdcb11`, C4's own
// commit – and it is PROVABLY the tree these constants were last cut from rather than merely an
// earlier one: `git diff cffdcb11 HEAD --` over this module and its two test files is EMPTY, and all
// twenty-three cases are green there. Reader check run in both directions before anything was
// measured: `fitFactor` reads 1.05/0.94 on the control and 1.25/0.75 here.
//
//     · 5/0  (25k middle, MIDDLE COACH, grinder)   **36 of 73 keys**
//     · 8/0  (120k wealthy, ELITE COACH, grinder)  **24 of 73** – and the control had 72, not 73
//     · 0/1  (8k working, SELF-COACHED, player)    **0 keys. Byte-identical, all seventy-four.**
//
// ⭐⭐ WHICH CAREER MOVED *IS* THE MEASUREMENT, exactly as it was for round-29 #20 and round-30 #27.
// The two arms that HOLD A HIRED COACH moved; the self-coached arm did not move one byte. A fit
// factor prices how well a coach and a player match, and a family with no coach has no match to
// price – so the change is unreachable there BY CONSTRUCTION, not by luck. Twenty-one of the
// sixty-three constants – every `selfTravelling` value in this file, across `FROZEN`, `PRE_R28B`,
// `PRE_NAME_VERA` and all eighteen `PRE_V*` rungs – are UNTOUCHED and still reproduce, which is the
// cheapest possible statement of the blast radius. (The diff handed to this pass was taken at presets
// 0/1/2 × policy 1 and read 0 / 30 / 36 of 74 / 72 / 73; only its FIRST arm is a career this file
// freezes, and it agrees exactly – 0 of 74 – with the 0/1 line above.)
//
// ⚠ `medicalWithdrawalWeek` APPEARS ON THE ELITE ARM, and a key that exists only sometimes is exactly
// what a whole-world hash is worst at explaining, so it is named rather than left to a count. The
// control's capture carries 72 keys and no such marker; this one carries 73. `phaseHerWeek` writes it
// when the doctor withdraws her from an entered event, so the wealthy career now forfeits one it used
// to play – a different body, not a different rule: her training weeks moved, so her condition did.
//
// ⭐⭐ AND THE KEY THAT MATTERS DID NOT MOVE: `rngMain` IS BYTE-IDENTICAL ON ALL THREE, control and
// branch – `1dbff28caca2` on 5/0, `aebc8101d6df` on 8/0, `d84bcbf0c481` on 0/1, the same three values
// every note since round 35 quotes. It held BY CONSTRUCTION: `coachFactor` is a product of two
// constants and takes no `Rng` at all, and `growWeek` draws its one weekly luck value BEFORE the
// per-skill loop, in the same position, off the same key – so the multiplier is POST-DRAW arithmetic
// and no stream is added, removed or re-ordered. The world's identity is intact with it: `seed`,
// `week`, `profile`, `potential`, `plan`, `college`, `fork`, `birthdays`, `schemaVersion`, `coachId`
// and the whole coach contour are among the unmoved on every arm. ⚠⚠ THE FROZEN MAIN CAPTURE IS
// UNMOVED AND NOT RE-PINNED: 41550 draws / hash `e6b0c709`, tests/condition.test.ts.
//
// ⭐⭐ THE CAUSE IS ATTRIBUTED AND NOT ASSUMED, AND IT WAS MEASURED ON THIS TREE rather than argued
// from the diff: with `ECONOMY.coach.fitFactor` ALONE put back to 1.05/0.94 on this head – every
// other byte held fixed, CLAUDE.md's own-change-reverted form run inside the tree – **all twenty-three
// cases go green**. So the fit span is the whole of the movement, and the two other candidates are
// ruled OUT rather than merely left unmentioned:
//   · #17's OTHER dial, `plateauRate` 0.0009 -> 0.0027, cannot reach these careers at all. The walk
//     stops at week 156, she is 16.6, and the plateau first bites at 23.
//   · #18 (a decade of campaigns remembered) is invisible to a bench policy that never SIGNS an ad
//     letter – the same argument round 32 #5's note below makes, and `offers` is among the unmoved on
//     both grinder arms.
//
// ⚠ NO SCHEMA MOVED. `SAVE_SCHEMA_VERSION` stays 70, nothing is persisted that was not persisted
// before, and no `PRE_V*` rung is re-aimed – each still rolls its own version back on the world it is
// taken from. The rollback identities are RE-ANCHORED, which is the SECOND kind of move this file
// distinguishes: not a schema field, but a change to what a career IS. Rolling `schemaVersion` back on
// a career that trained under a wider fit cannot reproduce one that trained under the old span, so all
// forty-two moved constants were re-taken from the new walk in ONE mechanical pass, and they go on
// doing their job exactly as `PRE_V50`'s own paragraph promised.
//
// ⚠⚠ AND EVERY NEW VALUE WAS COMPUTED, NEVER COPIED OUT OF A TEST REPORT. Vitest elides a hash with
// an ellipsis – `expected '9d7c5393fa4314d6959e10dec52e1aa70b6e7…'` – so a constant pasted from a
// failing run is silently wrong in a way nothing here would catch until the next wave went red for no
// nameable reason. All sixty-three were produced by RUNNING the same exported helpers the two test
// files assert with (`careerHash`, `careerHashAtSchema`, `careerHashUnderTheWindowRule`,
// `careerHashUnderTheOldName`), written to a file and spliced in one key at a time; the twenty-one
// that reproduced were left byte-untouched by that same pass rather than re-written with their own
// values, so «untouched» here is a property of the diff and not a promise.
//
// =================================================================================================
// ⭐⭐⭐ RE-FROZEN FOR ROUND 38 C4 (07.09.2026) – ONE CALIBRATED CLOSED FORM, READ BY EVERYONE.
// =================================================================================================
//
// ⚠ ALL SIXTY-THREE CONSTANTS MOVED – `FROZEN`, `PRE_R28B`, `PRE_NAME_VERA` and every `PRE_V*` set,
// three careers each. That is the widest re-stamp this file has taken since the 02.09 rename, and it
// is expected rather than alarming: C4 put composure and stamina into the closed form
// (`calibratedPServe`, engine/match/point.ts), and the closed form is what resolves EVERY AI-vs-AI
// match in the game. A change to who wins in the field is a change to every ranking, every
// acceptance cut and every cheque downstream of one. See docs/specs/one-closed-form-2026-09.md.
//
// PER-KEY DIFF TAKEN FIRST, as this file demands – `tools/frozen-key-diff.ts`, the three frozen
// careers at their own preset/policy pairs (5/0, 8/0, 0/1), 156 weeks, against a worktree at
// `8d0b6bf4` – this branch's own start, with nothing else on it, so the control IS this change
// reverted:
//
//     middleGrinder    (preset 5, policy 0)   36 of 72 keys moved
//     eliteGrinder     (preset 8, policy 0)   34 of 73 keys moved
//     selfTravelling   (preset 0, policy 1)   32 of 74 keys moved
//
// ⚠ ZSH ATE THE FIRST ATTEMPT AT THAT DIFF, and it is recorded because this file already carries a
// warning about the same shell. `for pp in "5 0"; do set -- $pp; … --preset $1 --policy $2` does NOT
// word-split in zsh, so all three "different careers" ran as `--preset NaN --policy NaN` – i.e. the
// tool's own fallbacks, the same career three times – and the diff it produced was fiction (it even
// showed `rngMain` moving, which is what made it worth checking rather than believing). Use
// `${pp%%:*}` / `${pp##*:}` on a `5:0` string, and read the `# preset N policy M` header the tool
// prints back before trusting a single line under it.
//
// ⭐⭐ WHAT DID NOT MOVE IS THE HEADLINE, AND IT WAS MEASURED DIRECTLY RATHER THAN READ OFF A HASH.
// `rngMain` is byte-identical in all three, and so is the whole MAIN stream underneath it: the same
// 156-week walk, instrumented to count and hash every draw, reads
//
//     preset 5/0   124,649 draws   3e2b2e12          preset 8/0   124,652 draws   54c7cf1f
//     preset 0/1   124,652 draws   edbb8f16          – identical on both arms, all three careers
//
// C4 adds no draw to any stream and moves none: `nerveAndLegs` is arithmetic over two numbers each
// player already carried. `seed`, `careerId`, `profile`, `potential`, `schemaVersion`, `week`,
// `birthdays`, `college`, `fork`, `plan` and twenty-three other keys are unmoved in all three – 34
// of the ~73 in total, counted rather than quoted.
//
// ⚠ AND THE COHORT MOVED WITHOUT THE STREAM MOVING, WHICH LOOKS IMPOSSIBLE AND IS NOT. `driftCohort`
// spends exactly four MAIN draws per player in cohort order, and that sequence is byte-identical –
// but the ARRAY is not the same array. Diffed member by member on `middleGrinder`: exactly ONE id
// differs (`ai-42` left, `ai-s3-20` joined), the order differs, and 171 of 199 rivals then carry
// different attributes. The cause is `season/conveyor.ts`: `stayChance` reads a player's STANDING in
// the field, standing is downstream of results, and C4 moved results – so a different girl stopped
// at the season boundary, and from that point the same draws land on different players.
//
// Her own place moved with it, which is the readable half of the same finding:
// `kidRank` 74 -> 36 (middleGrinder), 54 -> 64 (eliteGrinder), 73 -> 45 (selfTravelling).

// =================================================================================================
// ⭐⭐ RE-FREEZE #13 – 19.08.2026, ONE FOR THE WHOLE OF ROUND 23.
// =================================================================================================
//
// ⚠ DELIBERATELY ONE, AND THAT IS THE POINT. Three separate agents in this wave moved these careers
// and each correctly declined to re-freeze: #12/#13 (the domestic table becomes season-to-date) went
// red first, #18's schema bump to v54 is a second independent reason, and #3b's retirement news a
// third. Three competing re-freezes, each baking in the others' unattributed movement, is how a hash
// pin dies quietly - so they reported, and this is the single re-cut that owes them all a diff.
//
// PER-KEY DIFF TAKEN FIRST, as this file demands - `tools/frozen-key-diff.ts`, all three presets,
// policy 1, against a worktree at `c518ad1`, the wave's own start.
//
// ⚠ AND RE-TAKEN AFTER THE LAST FIX, which is why it can be trusted against THESE hashes. The first
// cut of this note was written, correctly, before the season-table zero-rank rule was narrowed to
// the domestic fold - and three more edits then moved these careers again. A diff describing a tree
// that is not the frozen one is a stale comment of exactly the kind this round spent the day
// removing, so it was measured a second time on the tree these hashes were cut from. Both readings
// agree: 39 of 66 moved, `rngMain` unmoved, 27 unmoved.
//
// ⚠ 39 OF 66 KEYS MOVED, and for a wave that changed WHICH TABLE a domestic result is folded into,
// added a persisted field of her own, and put two new kinds of row in the feed, a narrow diff would
// have been the alarming outcome. The rank caches, the money, the ledgers and the season history all
// move together because they are all downstream of the same fold.
//
// ⭐⭐ AND THE KEY THAT MATTERS DID NOT MOVE: `rngMain` IS BYTE-IDENTICAL IN ALL THREE PRESETS. The
// world's identity is intact with it - `seed`, `week`, `profile`, `potential`, `cohort`, `season`,
// `plan`, `college`, `fork`, `birthdays`; 27 keys unmoved in total. `schemaVersion` moved on purpose
// (53 -> 54) and `kidFundsCents` is the field that moved it.

// =================================================================================================
// ⭐⭐ RE-FREEZE #12 – 19.08.2026. THE WIDEST DIFF THIS FILE HAS EVER TAKEN, and by a long way.
// =================================================================================================
//
// PER-KEY DIFF TAKEN FIRST, as this file demands - `tools/frozen-key-diff.ts`, all three presets,
// policy 1, 156 weeks. The control was MY OWN CHANGE REVERTED in this same tree, never the previous
// commit, per CLAUDE.md's rule about shared checkouts.
//
// ⚠ 36 OF 65 KEYS MOVED. Every earlier re-freeze in this file moved between zero and a handful; this
// one moved more than half the world, and the honest reason is that TWO rules changed underneath it:
//
//   1. THE LIVE PROFESSIONAL TABLE WAS CORRECTED (season/fieldPros.ts `mergedWtaRanking`). v53 added
//      a pro's season winnings ON TOP of her derived book, which counted the same tennis twice and
//      inflated the table all season - measured +24% by mid-season, concentrated on the ~350 of 1600
//      pros who actually play. The acceptance cuts read that and refused the kid: a ten-season career
//      reached the W tour in NO season and finished on DOMESTIC events at 22. Winnings now REPLACE a
//      share of the book, the table's total is preserved by construction, and the same career turns
//      professional in season 2 and stays there.
//   2. THE AGE-ELIGIBILITY RULE NOW BINDS THE FIELD, not the kid alone (owner, 19.08). Four routes
//      into a W draw were gated - the entry list, the on-ramp's held slots, the slam wild cards, and
//      the shadow bracket's universe - so who is in a draw changed, and everything downstream of a
//      draw changed with it.
//
// A change to WHO IS IN EVERY PROFESSIONAL DRAW and to WHAT THE TABLE SAYS cannot leave a career's
// results, rankings, wallet, or development untouched, so a narrow diff here would have been the
// alarming outcome, not this one.
//
// ⭐⭐ AND THE KEY THAT MATTERS DID NOT MOVE: `rngMain` IS BYTE-IDENTICAL IN ALL THREE PRESETS. That
// is the invariant this file guards and it held by construction rather than by luck - both rules run
// off event-scoped sub-streams and pure derivation, and neither adds or removes a MAIN draw. Twenty
// -nine keys were identical in total, and they are the world's identity: `seed`, `week`,
// `schemaVersion`, `profile`, `potential`, `plan`, `college`, `fork`, `birthdays`, `rngMain`.
//
// ⚠ `cohort` MOVED PARTLY FOR A COSMETIC REASON and it is named here so nobody re-derives it later:
// 'Martin' was APPENDED to SURNAMES the same day (owner's request), and the pool's length is part of
// `pickInt`'s index arithmetic, so new careers draw different surnames. The draw COUNT is unchanged -
// which is exactly why `rngMain` did not move - and no persisted career is renamed.
// =================================================================================================
// ⚠⚠ A CAREER THAT DOES NOT TRAVEL IS BYTE-IDENTICAL – the invariant-2 claim, as a frozen capture
// =================================================================================================
//
// The three hashes below were measured at commit `2d7d336`, the commit BEFORE the travel helping,
// and they are the same three the changed engine produces: `sha256(JSON.stringify(world))` after 156
// weeks, which is the exact serialisation `compressWorld` feeds gzip, so "identical here" is
// "identical in a save". The two grinder careers hold a hired coach for the whole run with
// `coachOnEventWeeks` FALSE; the player-policy one has the switch ON and nobody to send.
//
// ⚠ THEY ARE A DOCUMENTED MEASUREMENT AND NOT A CHANGE-GATE, in exactly the sense CLAUDE.md's
// invariant 2 gives the frozen MAIN capture: a wave that legitimately moves a career updates them.
// What they may never do is move because of a change to the coach's edge that was supposed to be
// scoped to the trip.
// ⭐⭐ RE-FROZEN AT v49 (15.08), AND WHAT MOVED THEM WAS MEASURED KEY BY KEY BEFORE THEY WERE TOUCHED.
// The junior-travel stance is a persisted field (`coachOnJuniorEvents`, schema v49), so `createWorld`
// writes it and `SAVE_SCHEMA_VERSION` moved with it - and both of those are IN the serialisation
// these hashes are taken of. All three went red at once, which is exactly the alarm a wave touching
// coach travel should have to answer.
//
// ⚠ THE ANSWER IS A DIFF, NOT AN ASSERTION. Each of the 63/64 top-level keys of the week-156 career
// was hashed on its own, before and after: **`schemaVersion` (48 -> 49) and the new `coachOnJuniorEvents`
// key, and NOTHING ELSE.** Same funds, same results, same events, same rngMain, same everything the
// career actually is - the two differences are the schema bump's own footprint and could not have
// been avoided by any implementation of it. That is the "wave that legitimately moves a career"
// CLAUDE.md's invariant-2 note allows, and re-freezing without the per-key check would have been the
// thing it forbids.
//
// ⚠ AND THE STANCE IS `false` IN ALL THREE, asserted in `careerHash` below rather than assumed: these
// careers do not send the coach to junior events, so nothing about the new mechanic can be hiding
// inside the new numbers.
// ⭐⭐ RE-FROZEN AGAIN AT P1 (15.08, docs/specs/junior-access-2026-08.md), AND THE PER-KEY DIFF WAS
// TAKEN FIRST, EXACTLY AS THE PARAGRAPH ABOVE DEMANDS. This time the answer is the opposite shape and
// that is the point of writing it down: the v49 re-freeze moved TWO keys and both were the schema
// bump's own footprint; this one moves about THIRTY per career, and they are all downstream of the
// ladder. Measured, all 63/64 top-level keys hashed on their own on both sides (worktree at `ea8b97f`
// against this branch), the three careers agree on the moved set to within one or two keys:
//
//   MOVED   results · bestFinishByTier · trophiesByTier · entries · seasonEntries · seasonHistory ·
//           seasonRecord / seasonWins / seasonStartRank · kidRank / kidRankWta / kidRankDomestic and
//           their prev* companions · internationalEntryWeeks · fundsCents · financeWeeks ·
//           careerTotals · events · offers · milestones · knockHistory · injuryHistory · condition ·
//           skills · academy · nextEventId · walkoverWeek · lastSeasonSummary
//   UNMOVED **coachId · coachOnEventWeeks · coachOnJuniorEvents · coachSince · profile · seed ·
//           rngMain · cohort · schemaVersion**
//
// ⚠ READ THE SECOND LINE, NOT THE FIRST. What this file's frozen hashes are FOR is stated one
// paragraph up – *"what they may never do is move because of a change to the coach's edge that was
// supposed to be scoped to the trip"* – and every coach key, the profile and the schema are
// byte-identical. What moved is a career: she enters different tournaments, so she banks different
// results, holds different ranks and different money. A rule that changes which rungs a junior may
// stand on and left `results` untouched would be the thing to worry about.
//
// ⚠ AND `rngMain` IS AMONG THE UNMOVED, which is the invariant-2 half of the same check: P1 draws on
// no stream at all (an access rule is a post-draw gate), so the persisted MAIN position after 156
// weeks is the same in both trees. The frozen MAIN capture in tests/condition.test.ts is likewise
// untouched – count 41550, hash e6b0c709 – and is asserted before its own companion constant.
// ⭐⭐ RE-FROZEN AGAIN AT P2 (16.08, docs/specs/age-eligibility-window-2026-08.md), AND THE PER-KEY
// DIFF WAS TAKEN FIRST, AGAIN. All 63/64 top-level keys hashed on their own on both sides (a worktree
// at `4d49fc3` against this branch), and this time the three careers DISAGREE with each other in a way
// that is itself the evidence:
//
//   5:0  middle coach · grinder   MOVED **internationalEntryWeeks AND NOTHING ELSE** – 63 of 64 keys
//                                 byte-identical, `results` included. She never reaches a cap, so P2
//                                 changed no decision she made; what moved is how long the LEDGER is
//                                 kept, because `pruneInternationalEntries` now retains back to her
//                                 birthday instead of to New Year. A retention change, visible in the
//                                 whole-world hash and in nothing else.
//   8:0  elite coach · grinder    the junior allowance now bites on ONE window instead of two, so
//                                 results / ranks / money / milestones move. `proEntryWeeks` UNMOVED:
//                                 the grinder never enters a W event, so the pro half cannot show.
//   0:1  self-coached · player    both ledgers move, and with them `seasonEntries`, `results`, the
//                                 ranks and the wallet – this is the arm that actually plays the tour.
//
//   UNMOVED IN ALL THREE  **coachId · coachOnEventWeeks · coachOnJuniorEvents · profile · seed ·
//                         rngMain · cohort · schemaVersion · season**
//
// ⚠ READ THE LAST LINE, AS ALWAYS. What these hashes are FOR is one paragraph up – they may never
// move because of a change to the coach's edge that was supposed to be scoped to the trip – and every
// coach key, the profile, the schema and the calendar are byte-identical on all three careers. What
// moved is a career: an age rule that changed how many events a fifteen-year-old may enter and left
// `results` untouched would be the alarm.
//
// ⚠ AND `rngMain` IS AMONG THE UNMOVED on all three, which is the invariant-2 half: P2 draws on no
// stream at all (an entry allowance is a post-draw gate), so the persisted MAIN position after 156
// weeks is identical in both trees. The frozen MAIN capture in tests/condition.test.ts is likewise
// untouched – count 41550, hash e6b0c709.
// ⭐ AND RE-FROZEN ONCE MORE INSIDE THE SAME WAVE, FOR P2's OWN ITEM 6 (`w15.minAgeYears` 16 -> 14,
// the owner's ruling of 16.08) – PER-KEY DIFF TAKEN AGAIN, this time against the previous commit
// (`53223b3`) rather than against the start of the wave, so the number names ITS OWN change:
//
//   all three careers   32 of 64 keys moved, and they are the same 32 each time: `results`,
//                       `bestFinishByTier`, `entries`, `seasonEntries`, `seasonHistory`, the four
//                       rank caches and their prev* companions, `fundsCents`, `financeWeeks`,
//                       `careerTotals`, `skills`, `condition`, `events`, `milestones`, `offers`,
//                       `academy`, `trophiesByTier`, `knockHistory`, `injuryHistory`,
//                       `internationalEntryWeeks` – and on the player-policy arm `proEntryWeeks`.
//   UNMOVED IN ALL THREE  **coachId · coachOnEventWeeks · coachOnJuniorEvents · profile · seed ·
//                         rngMain · cohort · schemaVersion · season**
//
// A rung that opens two years earlier changes which tournaments a girl enters from the age of
// fourteen, so a career diverges early and stays diverged – that is the whole of the 32. What these
// hashes exist to catch is a coach change leaking past the trip, and every coach key, the profile,
// the calendar and the schema are byte-identical on all three careers.
//
// ⚠ `rngMain` IS AGAIN AMONG THE UNMOVED, on all three. An age gate is a post-draw filter, so the
// persisted MAIN position after 156 weeks is identical – and the frozen capture in
// tests/condition.test.ts is likewise untouched (count 41550, hash e6b0c709), asserted before its own
// companion constant, which did move (89 -> 93; the mechanism is written out there).
// ⭐⭐ RE-FROZEN AGAIN AT P3 (16.08, docs/specs/acceptance-cuts-corrected-2026-08.md), AND THE PER-KEY
// DIFF WAS TAKEN FIRST FOR THE FOURTH TIME – a worktree at `c04253f` (the commit this phase starts
// from) against this branch, all 64 top-level keys hashed on their own, on all three careers:
//
//   5:0  middle coach · grinder   28 keys, and ⚠ `ending`, `debtSinceWeek` and
//                                 `medicalWithdrawalWeek` are among them – THIS CAREER ENDS
//                                 DIFFERENTLY. A ladder that changes which tournaments she can
//                                 afford to enter changes what the money does, and this is the arm
//                                 where that shows as an ending rather than as a rank.
//   8:0  elite coach · grinder    27 keys – `results`, the rank caches, the season counters and the
//                                 wallet. No `ending`: the wealthy arm absorbs it.
//   0:1  self-coached · player    32 keys, the widest set – it is the arm that actually plays the
//                                 tour, so `entries`, `seasonEntries`, `proEntryWeeks` and even
//                                 `vacations` move with the rest.
//
//   UNMOVED IN ALL THREE  **coachId · coachOnEventWeeks · coachOnJuniorEvents · profile · seed ·
//                         rngMain · cohort · schemaVersion**
//
// ⚠ READ THE LAST LINE, AS ALWAYS. An acceptance cut decides which rungs she may enter, so a career
// diverges at the first door that moved and stays diverged – that is the whole of the 27-32. What
// these hashes exist to catch is a coach change leaking past the trip, and every coach key, the
// profile and the schema are byte-identical on all three.
//
// ⚠ AND `rngMain` IS AMONG THE UNMOVED FOR THE THIRD WAVE RUNNING, which is the invariant-2 half:
// an acceptance cut is a POST-DRAW GATE and taps no stream, so the persisted MAIN position after 156
// weeks is identical in both trees. The frozen MAIN capture in tests/condition.test.ts is therefore
// untouched (count 41550, hash e6b0c709) and needed no paragraph this time – ⚠ nor did its companion
// `REF.kidRank`, which is the one difference from P1 and P2: that constant reads a career whose
// doors P3 did not move.
// ⭐⭐ RE-FROZEN AGAIN AT P5 (16.08, docs/specs/college-as-a-second-act-2026-08.md), AND THE PER-KEY
// DIFF WAS TAKEN FIRST FOR THE FOURTH TIME – BUT NOT WITH A WORKTREE, BECAUSE A STRONGER ANSWER WAS
// AVAILABLE AND IT IS ASSERTED BELOW RATHER THAN REPORTED HERE.
//
// P5 spends the college freeze one year at a time and adds a national-team week inside it, and BOTH
// live behind `inCollege`. None of these three careers goes to college – `world.college` is `null` in
// all three at week 156, which is 32 weeks before the fork is even asked – so the only thing P5 can
// reach on them is `SAVE_SCHEMA_VERSION`, bumped 49 -> 50 for `CollegeState`'s new ledger.
//
// ⚠ SO THE CHECK IS AN IDENTITY, NOT A COMPARISON. Instead of hashing 64 keys on both sides of a
// worktree and reading which ones moved, `PRE_V50` below holds the OLD hashes and a case hashes the
// SAME live world with `schemaVersion` rolled back to 49 – and gets them back **byte for byte, all
// three**. That is not "the other keys look unmoved"; it is "there is no other difference at all".
// It is also self-evidencing forever: if a later wave moves one of these careers for a real reason,
// the rollback case goes red beside the freeze and says which kind of change it was.
//
// ⚠ AND `rngMain` IS AMONG THE UNMOVED FOR THE FOURTH WAVE RUNNING, by the same identity: the
// call-up draws on `seed:callup:<week>`, its own sub-stream, and is unreachable outside the freeze in
// any case. The frozen MAIN capture in tests/condition.test.ts is untouched (count 41550, hash
// e6b0c709).
//
// ⭐⭐ RE-FROZEN FOR THE FIFTH TIME (16.08), FOR THE OWNER'S AGE-GRID RULING – «настоящих порогов
// только два – 14 и 18 … Возрастное есть только по количеству сыгранных в год». `w35`/`w50`/`w75`/
// `w100` and the Slam moved to 14, the four WTA rungs to 15. PER-KEY DIFF TAKEN FIRST, as this file
// demands, from a worktree at `d595f5d` (the commit the wave starts from) against this branch, all
// 64 top-level keys hashed on their own:
//
//   ⚠⚠ THE SAME 27 KEYS ON ALL THREE CAREERS, AND `entries` IS NOT ONE OF THEM. Moved: `results`,
//   `bestFinishByTier`, `kidRank`, `kidRankWta`, the three `prev*` rank caches, `seasonStartRank`,
//   `seasonWins`, `seasonLosses`, `seasonRecord`, `seasonHistory`, `lastSeasonSummary`, `fundsCents`,
//   `financeWeeks`, `careerTotals`, `skills`, `condition`, `events`, `milestones`, `offers`,
//   `academy`, `trophiesByTier`, `knockHistory`, `injuryHistory`, `internationalEntryWeeks`,
//   `proEntryWeeks`, `nextEventId`.
//
//   UNMOVED IN ALL THREE  **entries · seasonEntries · coachId · coachOnEventWeeks ·
//                         coachOnJuniorEvents · profile · seed · rngMain · cohort · schemaVersion ·
//                         season · college · fork · ending · debtSinceWeek · knock · injury · kit ·
//                         potential · plan · vacations · practices · penalties · birthdays**
//
// ⭐ AND `entries` UNMOVED IS THE FINDING, NOT A FOOTNOTE. **She did not enter one different event.**
// Every previous re-freeze of this file moved `entries` – a rung that opens earlier is a rung she
// enters earlier. Not here: the three frozen careers are 156 weeks long (she is 16.6 at the end) and
// on the two grinder arms she plays nothing paid at all, while the acceptance cuts refuse her at the
// rungs whose floors moved. What moved is `results`, and the mechanism is worth naming because it is
// the one this file could otherwise be read as an alarm about: `selectEntrants` filters a draw's
// CANDIDATES on the same age gate, so opening W35+ to fourteen-year-olds changes which COHORT players
// fill the fields she meets. Different opponents, same calendar, different results.
//
// ⚠ AND `rngMain` IS AMONG THE UNMOVED FOR THE FIFTH WAVE RUNNING – an age gate is a POST-DRAW
// filter and taps no stream, so the persisted MAIN position after 156 weeks is identical and the
// frozen MAIN capture in tests/condition.test.ts is untouched (count 41550, hash e6b0c709).
//
// ⚠ `ending`, `college` AND `fork` ARE ALSO UNMOVED, which is the other ruling's half: the college
// rule was removed the same day, and none of these careers reaches the fork (week 156 is 32 weeks
// short of it), so nothing in that removal can reach a hash here by construction.
//
// ⭐⭐ RE-FROZEN FOR THE SIXTH TIME (16.08), FOR THE TWO ACCEPTANCE INVERSIONS –
// `docs/specs/the-ladder-is-monotone-2026-08.md` §2. `wta125.acceptsRank` 180 -> 210 (it was TIGHTER
// than the WTA 250 above it) and `j300.enterPct` 0.20 -> 0.25 (it was tighter than the rung's own
// field band, so the rung refused the population its draw is made of). PER-KEY DIFF TAKEN FIRST, as
// this file demands, from a worktree at `3198a11` against this branch, all 62 top-level keys hashed
// on their own on all three careers:
//
//   ⚠⚠ TWO OF THE THREE CAREERS DID NOT MOVE ONE BYTE. `middleGrinder` and `eliteGrinder` are
//   IDENTICAL – zero keys of sixty-two – and only the PLAYER arm moved, exactly as the P5 re-freeze
//   went. The grinder policy enters everything it can afford in ladder order and its two careers
//   never clear a J300's cut at either value.
//
//   MOVED, on `selfTravelling` alone (17 of 62): `results`, `bestFinishByTier`, `kidRank`,
//   `prevKidRank`, `seasonStartRank`, `seasonHistory`, `lastSeasonSummary`, `fundsCents`,
//   `financeWeeks`, `careerTotals`, `skills`, `events`, `nextEventId`, `milestones`, `offers`,
//   `academy`, `trophiesByTier`.
//
//   UNMOVED IN ALL THREE  **entries · seasonEntries · season · internationalEntryWeeks ·
//                         proEntryWeeks · rngMain · cohort · schemaVersion · profile · seed ·
//                         potential · plan · condition · kit · injury · injuryHistory · knock ·
//                         knockHistory · kidRankWta · kidRankDomestic · prevKidRankWta ·
//                         prevKidRankDomestic · seasonWins · seasonLosses · seasonRecord · college ·
//                         fork · ending · debtSinceWeek · vacations · practices · penalties ·
//                         birthdays · coachId · coachOnEventWeeks · coachOnJuniorEvents ·
//                         onRampCleared · physioActive · recoveryBuff · suspendedUntilWeek ·
//                         retirementOffer · pendingTournament · oneMoreYearCount · careerId · week**
//
// ⭐⭐ AND THE MECHANISM IS MEASURED RATHER THAN INFERRED, WHICH IS THE POINT OF DOING THE DIFF. The
// three unmoved ledgers above (`entries`, `internationalEntryWeeks`, `proEntryWeeks`) say she played
// the same WEEKS, and a per-tier count of her 156 weeks of entries says why:
//
//     tier      before                                          after
//     j60       12                                              **11**
//     j300      0                                               **1**
//     everything else (j30 13 · local 10 · regional 12 · national 2 · w15 7 · w35 3)   unchanged
//     TOTAL     59                                              **59**
//
// **ONE J60 BECAME ONE J300, ON THE SAME WEEK.** The entry policy takes at most one event a week and
// walks the calendar strongest-first, so the moment the prestige rung's cut reached her the swap was
// free – same week, same allowance, one rung up. Her ITF rank at week 156 moved **#46 -> #21** on
// that single event (a J300 pays 300/210/140/100/60 against a J60's table) and the family is $425
// lighter for the bigger fee and trip. That is the fix working, on exactly one week of one career.
//
// ⚠ THE WTA 125 HALF CANNOT REACH THESE HASHES AT ALL, and that is arithmetic rather than luck: she
// is 16.6 at week 156 and the baseline's median rank at 17 is #375, so a door at 210 refuses her
// exactly as a door at 180 did. Everything above is `j300` alone.
//
// ⚠ AND `rngMain` IS AMONG THE UNMOVED FOR THE SIXTH WAVE RUNNING – an acceptance cut is a gate on an
// entry, not a draw, so the persisted MAIN position after 156 weeks is identical and the frozen MAIN
// capture in tests/condition.test.ts is untouched (count 41550, hash e6b0c709).
// =================================================================================================
// ⭐⭐ RE-FROZEN AN EIGHTH TIME (17.08, THE SKILL LAW - docs/specs/the-skill-gap-2026-08.md), AND
// THIS IS THE WIDEST DIFF IN THIS FILE'S HISTORY BY A WIDE MARGIN. Every previous re-freeze moved
// ONE key of sixty-four. This one moves TWENTY-EIGHT, and that is the honest shape of the change
// rather than an alarm: `season/fieldPros.ts` replaced eight uniform core bands with one curve
// fitted to the live 2026 WTA Elo list, so EVERY professional in the world has a different strength.
// A career that plays professionals therefore diverges everywhere at once.
//
// THE PER-KEY DIFF WAS TAKEN FIRST, AS THE PROTOCOL DEMANDS - `tools/frozen-key-diff.ts`, all three
// presets, a worktree at this commit with `a412162` reverted (`git revert --no-commit`) against this
// branch. Reader check on the control: `grep -c coreForStanding src/engine/season/fieldPros.ts`
// returns 0 and the shipped uniform draw is present.
//
//   MOVED (28 of 64, middle-grinder; 28 elite-grinder; 24 self-travelling): results · events ·
//     kidRank · kidRankWta · kidRankDomestic · prevKidRank(+Wta/Domestic) · seasonStartRank ·
//     seasonHistory · lastSeasonSummary · bestFinishByTier · trophiesByTier · careerTotals ·
//     fundsCents · financeWeeks · milestones · offers · academy · knockHistory · injuryHistory ·
//     condition · walkoverWeek · medicalWithdrawalWeek · nextEventId · seasonEntries ·
//     internationalEntryWeeks · proEntryWeeks · onRampCleared · vacations · skills
//
//   ⚠ `skills` IS ON THAT LIST AND IT IS THE ONE WORTH NAMING. Her own attributes moved - not
//   because development changed (it did not; `SKILL_K`, `RALLY_K` and `PACE_K` are untouched and
//   `src/engine/match/` does not change at all in this wave) but because a different set of match
//   results feeds a different condition and a different training week. It is a SECOND-ORDER effect
//   of the field, reached through her body, and it is exactly what a wave that re-deals the world's
//   strength should produce.
//
//   UNMOVED (36 of 64): seed · profile · plan · potential · cohort · coachOnEventWeeks ·
//     coachOnJuniorEvents · college · fork · schemaVersion · and the rest of the static contour.
//
// ⚠⚠ **`rngMain` UNMOVED, ON ALL THREE CAREERS, AND IT WAS CHECKED RATHER THAN ASSUMED** - which is
// the load-bearing half and the one the last five re-freezes each verified in turn. Hashes, named:
// middle-grinder `1dbff28caca2` both sides · elite-grinder `aebc8101d6df` both sides ·
// self-travelling `d84bcbf0c481` both sides. A rank-to-core re-deal is POST-DRAW arithmetic:
// `makeFieldPro` still takes exactly one uniform, in the same position, off the same key, and the
// new core is arithmetic on it. **So the frozen MAIN capture in tests/condition.test.ts is untouched
// - count 41550, hash e6b0c709 - and needs no re-pin.** Its COMPANION constant `kidRank` did move,
// 93 -> 88, and is re-pinned there with its own paragraph; the input-independence A/B halves in
// tests/planner.test.ts still pass, which is the fairness property and is not a hash.
//
// ⚠ AND THE POINTS TABLE DID NOT MOVE AT ALL, measured separately: the merged 1,600-row professional
// ranking hashes identically on both arms across five worlds, so every acceptance cut still admits
// exactly the same population. What changed is how strong each of those places is, not who is in it.
//
// ⚠ THE ROLLBACK IDENTITIES BELOW ARE RE-ANCHORED, NOT BROKEN, and the file has precedent language
// for exactly this case: this wave changed the CAREER, not a schema field, so `PRE_V52`/`PRE_V51`/
// `PRE_V50` are re-taken against the new world. Swapping only `schemaVersion` on the SAME live world
// still reproduces them byte for byte, which is the property those constants exist to assert.
// =================================================================================================
// ⭐⭐ RE-FROZEN A NINTH TIME (18.08, THE OWNER'S RENAME) – AND THIS IS THE NARROWEST DIFF IN THE
// FILE'S HISTORY: **ONE KEY OF SIXTY-FOUR, `events`, ON ALL THREE CAREERS.** The owner asked for the
// four professional rungs to join the World Tour family («WTA 125/250/500/1000 – переименовать в
// World Tour по аналогии с предыдущими»), so `TIERS.wta125.label` … `TIERS.wta1000.label` are
// "World Tour 125" … "World Tour 1000" now. Nothing else moved: the tier IDS did not change, and a
// label is display.
//
// PER-KEY DIFF TAKEN FIRST, as this file demands – `tools/frozen-key-diff.ts`, all three presets, a
// detached worktree at `46998dd` (this branch with nothing of the rename in it) against this tree.
// Reader check on the control: the A tree's `calendar.ts` still carries `label: 'WTA 125'` and this
// one carries `label: 'World Tour 125'`.
//
//   MOVED (1 of 64 · 1 of 64 · 1 of 63):  **events**
//
//   UNMOVED IN ALL THREE (everything else, and the four worth naming out loud): **results ·
//     entries · seasonEntries · trophiesByTier · bestFinishByTier · kidRank(+Wta/Domestic) ·
//     fundsCents · financeWeeks · skills · condition · milestones · offers · academy · cohort ·
//     rngMain · schemaVersion** – i.e. every ledger keyed by tier id, which is the proof that the
//     ids did not move with the names.
//
// ⭐⭐ AND THE MECHANISM IS MEASURED RATHER THAN INFERRED. Dumping `world.events[].text` on both arms
// (middle-grinder): **16 lines of 400 differ, and all sixteen are the same sentence with one word
// changed** – "🏆 P. Delgado won the WTA 500." -> "🏆 P. Delgado won the World Tour 500.". Same
// winner, same week, same rung; only the spelling of the rung. ⚠ AND SHE IS IN NONE OF THEM: at week
// 156 she is 16.6 and has never entered a professional rung, so every one of the sixteen is TOUR
// NEWS about the AI field. A rename that had reached her career would have shown up in `results`,
// and `results` is byte-identical.
//
// ⚠ `rngMain` IS AMONG THE UNMOVED FOR THE NINTH WAVE RUNNING – a label is not a draw – so the frozen
// MAIN capture in tests/condition.test.ts is untouched (count 41550, hash e6b0c709).
// =================================================================================================
/** ⚠⚠ RE-TAKEN ONCE OVER THE COLLECTED ROUND 26, NOT MERGED (24.08). Two branches of the same round
 *  moved these careers for different reasons – the college flow's schema v59→v60, and the field
 *  news's new farewell/turnover lines – and merging two re-freezes TEXTUALLY yields hashes that
 *  belong to neither tree. The agent that moved them second said so in its own report, and this is
 *  that instruction carried out: the block is taken whole from one side and every constant re-taken
 *  against the collected tree.
 *
 *  ⚠ PER-KEY DIFF FIRST, control = the branch base in a detached worktree, headers checked against
 *  the invocation on all three arms: **exactly three keys of 69 differ – `schemaVersion`, `events`
 *  and `nextEventId`** – and every one is accounted for. `rngMain`, `results`, `season`, `cohort`,
 *  `fundsCents`, `kidRank` and `skills` are byte-identical, which is the claim that matters: no
 *  career's tennis moved, only the version number and the news rows the world now prints.
 *
 *  ⚠ AND THE HEADER CHECK EARNED ITS KEEP A FOURTH TIME. The first run of this diff printed
 *  `# preset 0 policy 1` for all three arms – zsh word-splitting had eaten the flags, exactly as
 *  this file's protocol warns. Those captures were thrown away and the arms re-run with explicit
 *  arguments. Read the header before believing any diff built from this tool. */
// ⭐⭐ RE-FROZEN AT v66 (29.08, ROUND 29 PART FOUR P7 – the 'business' ledger category for the merch
// brand's and the academy's weekly income lines), AND THIS IS THE NARROWEST DIFF IN THIS FILE'S
// HISTORY: the v49 re-freeze moved TWO keys and both were the schema bump's footprint; THIS ONE
// MOVES EXACTLY ONE – `schemaVersion`, 65 -> 66 – on all three careers.
//
// THE PER-KEY DIFF WAS TAKEN FIRST, AS THE PROTOCOL DEMANDS – `tools/frozen-key-diff.ts`, presets
// 0/1/2 × policy 1, a DETACHED worktree at `14a18f0` (this wave branched from it and carries only
// its own commits, so the base IS this wave reverted) against this branch, headers checked against
// the invocation on both sides. The reader was confirmed ABSENT on the control arm before it was
// measured (`grep -c merchWeeklyIncomeCents src/engine/world/coachMarket.ts` returns 0 there) –
// CLAUDE.md's null-arm check run in the negative direction. The verdict, identical on all three:
//
//   MOVED    schemaVersion – and NOTHING else.
//   UNMOVED  every other key, `rngMain` INCLUDED, byte for byte.
//
// ⚠ AND ZERO MOVEMENT IS THE DERIVED EXPECTATION, NOT A RELIEF: the businesses earn only for a
// family that BOUGHT them, no bench policy buys the shelf (the v63 assertion three notes down says
// the shelf is EMPTY here), fame is derived and never persisted, and `resolveBusinessIncome` draws
// on no stream at all – so the frozen MAIN capture (41550 / e6b0c709) is untouched by construction
// and the walk below asserts the business inertness by name rather than leaving it to the hashes.
// `PRE_V66` below is the byte-level half of the same proof: rolling ONLY the version number back
// reproduces all three v65 constants exactly, which is what a pure bump on unmoved careers means.
//
// ⭐⭐ RE-FROZEN AGAIN AT v67 (30.08, ROUND 30 ITEM 25 – the units and name back-fills moved off the
// SHIPPED v66 step, which main declared while this wave was still amending it). SAME VERDICT AS THE
// v66 RE-FREEZE, AND BY A NARROWER ARGUMENT: v67 is a RENUMBER. Both steps are the v66 step's own
// former contents moved character for character, so «no career moved» is what the change MEANS and
// not merely what was hoped of it.
//
// THE PER-KEY DIFF WAS TAKEN FIRST, AS THE PROTOCOL DEMANDS – `tools/frozen-key-diff.ts`, presets
// 0/1/2 × policy 1, a DETACHED worktree at `89e0e794` against this branch. ⚠ THE CONTROL IS THIS
// WAVE REVERTED, not merely an earlier commit: `git log 89e0e794..HEAD` is four commits and all four
// are this repair's, so the base IS the change backed out. Headers checked against the invocation on
// both arms (`# preset N policy 1 weeks 156`). The verdict, identical on all three:
//
//   MOVED    schemaVersion – and NOTHING else. 1 key of 72, 72 and 73.
//   UNMOVED  every other key, `rngMain` INCLUDED, byte for byte (d84bcbf0c481 on all six captures).
//
// ⚠ ZERO MOVEMENT IS THE DERIVED EXPECTATION, NOT A RELIEF, and one layer in from v66's version of
// this sentence: v67's two steps write `units` and `name` onto ROWS of `assets`, and the shelf is
// EMPTY on all three frozen careers (the v63 assertion in `walkFrozenCareer`), so there is no row
// for either to reach. Neither takes a draw – the market is sub-stream reads keyed on the seed and a
// week – so the frozen MAIN capture (41550 / e6b0c709) is untouched by construction and UNMOVED in
// `tests/condition.test.ts`. `PRE_V67` below is the byte-level half: rolling ONLY the number back to
// 66 reproduces all three v66 constants exactly.
//
// =================================================================================================
// ⭐⭐ RE-FREEZE – 30.08.2026, ROUND 30 #27: SEVERITY BY AGE, RECURRENCE, AND THE FITTED AGE CURVE.
// =================================================================================================
//
// ⚠ THIS ONE MOVES CAREERS ON PURPOSE AND IS THE FIRST HERE THAT DOES. Every re-freeze above was a
// schema renumber, an inert seat, or a change that reached one career by accident of its policy. This
// wave re-prices the weekly injury threshold at every age (`ageInjuryFactor`, the curve fitted in
// docs/specs/age-injury-curve-2026-08.md §4b), scales the severity bands with age, and adds a
// recurrence term off `injuryHistory`. **Injuries change careers.** A NARROW diff would have been
// the alarming outcome here, not a wide one.
//
// PER-KEY DIFF TAKEN FIRST, AS THE PROTOCOL DEMANDS – `tools/frozen-key-diff.ts`, on THE THREE
// CAREERS THIS FILE ACTUALLY FREEZES (5/0, 8/0, 0/1), not on the 0/1/2 shorthand some notes above
// use. ⚠ THE CONTROL IS MY OWN ENGINE COMMIT REVERTED IN A DETACHED WORKTREE
// (`git revert --no-commit 79181697`), never an earlier commit – later commits on this branch touch
// tests only, so "the previous commit" would have measured those too. The reader was confirmed
// ABSENT on the control arm before it was measured (`git grep severityAgeFactor -- src` returns
// nothing there) and PRESENT on the branch arm, which is CLAUDE.md's null-arm check run in both
// directions. Headers checked against the invocation on all six captures
// (`# preset N policy M weeks 156`).
//
//   · 5/0 (25k middle, middle coach, grinder)  – **0 keys. Byte-identical on every one of them.**
//   · 0/1 (8k working, self-coached, PLAYER)   – **0 keys. Byte-identical on every one of them.**
//   · 8/0 (120k wealthy, elite coach, grinder) – **11 keys of 72**: `injuryHistory` and the ten
//     things downstream of one layoff landing differently – `careerTotals`, `events`, `financeWeeks`,
//     `fundsCents`, `knockHistory`, `lastSeasonSummary`, `nextEventId`, `peakPhysical`,
//     `seasonHistory`, `skills`.
//
// ⭐ AND WHICH ONE MOVED *IS* THE MEASUREMENT, exactly as it was for round-29 #20 above. All three
// careers stop at week 156, i.e. age 16.6 – so the ONLY rows of the new curve any of them can reach
// are the junior ones, which went to x0.7 of what they were. Two of the three walked 156 weeks
// without their timeline changing at all; the third took one injury on a different week. Recurrence
// and the severity-by-age limb are essentially unreachable at this horizon (the first needs a prior
// injury on the record, the second is 1.00 for every age up to 18 by construction), so this diff is
// the FREQUENCY curve alone and nothing else – which is why it is eleven keys and not forty.
//
// ⭐⭐ AND THE KEY THAT MATTERS DID NOT MOVE: `rngMain` IS BYTE-IDENTICAL ON ALL THREE –
// `1dbff28caca2` on 5/0, `aebc8101d6df` on 8/0, `d84bcbf0c481` on 0/1, the same on the control arm
// and on the branch. That is the load-bearing half and it is the whole reason this design is
// allowed: recurrence reads `injuryHistory`, which is a CONSEQUENCE OF PLAY, so a leak into the draw
// would have destroyed input-independence (invariant 2). Every limb is applied POST-DRAW –
// `kitInjuryFactor`'s own shape – and the frozen MAIN capture is untouched: 41550 / e6b0c709,
// VERIFIED unmoved in `tests/condition.test.ts` (51/51).
//
// ⚠ ONLY `eliteGrinder` IS RE-FROZEN, in `FROZEN` and in every `PRE_*` set below – eighteen
// constants, one per rung of the version ladder, and not one `middleGrinder` or `selfTravelling`
// value is touched. The eighteen failures the branch produced were all and only that career, which
// is the same finding as the per-key diff arriving by a second road.
//
// ⚠ NO SCHEMA MOVED. `injuryHistory` already carried `kind`, `severity`, `week` and `weeksOut`, so
// nothing new is persisted; `SAVE_SCHEMA_VERSION` stays 67 and `PRE_V67` above still reproduces the
// v66 constants for the two careers that did not move.
//
// =================================================================================================
// ⭐⭐ RE-STAMPED FOR v69 – 01.09.2026, ROUND 32 #4 (brand inertia) + #5 (collaborations as fame).
// =================================================================================================
//
// ⚠ ALL THREE CONSTANTS MOVE AND ALL THREE MOVE BY ONE KEY, which is the narrowest re-freeze this
// file recognises and the fourth version in a row to take it (v66, v67, v68, v69). The bump is
// `SAVE_SCHEMA_VERSION` 68 -> 69 for `brandStrengthSeed`, the pin the v68 -> v69 migration writes so a
// career already in play does not see its brand re-priced under it (docs/specs/brand-inertia-2026-08.md).
//
// PER-KEY DIFF TAKEN FIRST, AS THE PROTOCOL DEMANDS – `tools/frozen-key-diff.ts` on THE THREE CAREERS
// THIS FILE ACTUALLY FREEZES (5/0, 8/0, 0/1). ⚠ The control is the branch's own base in a separate
// worktree (`r32b/brand-multiple`, the commit this branch forked from and the only commits between
// them are this wave's), headers checked against the invocation on all six captures. The verdict,
// identical on all three:
//
//   MOVED    `schemaVersion` – and NOTHING else. 1 key of 72, on all three.
//   UNMOVED  every other key, `rngMain` AND `offers` INCLUDED, byte for byte.
//
// ⚠ THE COUNT IS THE HASHED KEYS AND NOT A DIFF LINE NUMBER, said because the first reading of this
// diff got it wrong: `59c59` in the output is WHERE the line sits, not how many there are. Counted
// (`tail -n +2 <capture> | wc -l`): 72 on every one of the six captures, and `brandStrengthSeed`
// appears on none of them.
//
// ⭐⭐ AND ZERO MOVEMENT IS THE DERIVED EXPECTATION HERE FOR TWO SEPARATE REASONS, one per item.
//   · #4 persists a PIN and not a stock: the only writer is the migration, so a career that is walked
//     rather than loaded never carries the key. ⚠ This was a design constraint and not luck – a stock
//     written weekly would have appeared on `selfTravelling`, whose fame is 2.55 at week 156 and first
//     goes positive at week 122 (measured). See `WorldState.brandStrengthSeed`.
//   · #5 changes how a SIGNED advertising letter is read, and no bench policy signs one: `econ-bench`
//     raises 102 ad letters over 780 weeks on preset 0 and every one of them expires. `offers` being
//     byte-identical is the independent confirmation that nothing about WHICH letters are written moved.
//
// ⚠ NEITHER ITEM TAKES A DRAW ON ANY STREAM. `world/brandStrength.ts` has no `Rng` argument, no clock
// and no `Math.random`; the fame floor's new term is a fold over dated shoot weeks; the migration reads
// `fameAt` and writes two numbers. The frozen MAIN capture in tests/condition.test.ts is untouched –
// count 41550, hash e6b0c709 – and `PRE_V69` below is the byte-level half of the same proof: rolling
// ONLY the version number back to 68 reproduces all three v68 constants exactly.
//
// =================================================================================================
// ⭐⭐ NOT RE-STAMPED – 01.09.2026, THE SAME DAY'S REVISION OF #4 AND EXTENSION OF #5.
// =================================================================================================
//
// He read the shipped result and stopped it: «На пятом году бренд стоит $166 060 при годовом доходе
// $1 352». The memory moved out of the valuation and into the REVENUE (`brandReachOf` =
// `max(fame, retention x strength)`), the separate worth floor was deleted, and #5's shoot addition
// gained a per-band half-life ladder. **NOT ONE CONSTANT IN THIS FILE MOVES**, and the per-key diff
// is what says so rather than the absence of a failing test.
//
// PER-KEY DIFF TAKEN FIRST, AS THE PROTOCOL DEMANDS – `tools/frozen-key-diff.ts` on the same three
// careers (5/0, 8/0, 0/1), against `r32c/brand-inertia-and-collabs` in its own worktree, headers
// checked on all six captures (`# preset N policy 1 weeks 156`). The verdict, on all three:
//
//   MOVED    nothing. **0 keys of 72 / 72 / 73. Byte-identical, every key, every career.**
//
// ⭐⭐ AND ZERO IS THE DERIVED EXPECTATION, for the same two reasons one paragraph up plus a third:
// `SAVE_SCHEMA_VERSION` DOES NOT MOVE either, because the revision persists nothing new – `retention`
// and the half-life ladder are constants and the reach is derived from two numbers the world already
// answers. A wave with no schema move and no reader inside a bench career must produce exactly this,
// and «must» is not proof, which is why it was run.
//
// =================================================================================================
// ⭐⭐ RE-STAMPED – 02.09.2026, THE OWNER'S DEFAULT PLAYER: `Vera Martin` -> `Alice Martin`.
// =================================================================================================
//
// «каждая прологовая карьера сейчас Вера Мартин – я просил сделать дефолт на Alice Martin.»
// One line moved – `DEFAULT_PROFILE.kidName` in src/shared/protocol/profile.ts – and `openCareer`
// spreads `DEFAULT_PROFILE`, so all three careers in this file were walked by a differently-named
// girl. **ALL SIXTY-THREE CONSTANTS ARE RE-STAMPED**: `FROZEN`, `PRE_R28B` and every one of the
// eighteen `PRE_V*` rungs, because every one of them is taken off this same walk.
//
// PER-KEY DIFF TAKEN FIRST, AS THE PROTOCOL DEMANDS – `tools/frozen-key-diff.ts` on the three
// careers this file freezes (5/0, 8/0, 0/1), against the branch's fork point in a separate worktree
// (`prologue/wave` at cd59f31c), headers checked on all six captures, 72 hashed keys on every one.
// The verdict, identical on all three:
//
//   MOVED    `profile` and `events`. **2 keys of 72.**
//   UNMOVED  every other key – `rngMain`, `cohort`, `results`, `season`, `offers`, `fundsCents`,
//            `skills`, `kidRank`, `financeWeeks` – byte for byte.
//
// ⚠ TWO KEYS AND NOT ONE, WHICH IS SAID PLAINLY BECAUSE IT IS THE ONE THING A READER WOULD WANT TO
// CHALLENGE. `events` carries her name in its TEXT – 177 / 186 / 194 occurrences across the three
// careers – so the second key is her name being PRINTED, not a second change. `PRE_NAME_VERA` and
// `careerHashUnderTheOldName` below are the byte-level half of that claim rather than the claim
// itself: walking the same career with `kidName: 'Vera'` put back BEFORE birth reproduces all three
// old constants exactly, so nothing but the name is in the difference.
//
// ⚠⚠ AND `rngMain` IS BYTE-IDENTICAL ON ALL THREE, which is the load-bearing half: no draw on any
// stream reads her name, so input-independence (invariant 2) is untouched and the frozen MAIN
// capture in tests/condition.test.ts stands unmoved – count 41550, hash e6b0c709, no re-pin.
//
// ⚠ `cohort` IS BYTE-IDENTICAL TOO, AND IT CONTAINS THE STRING 'Vera' 3 / 4 / 11 TIMES. Those are
// rival juniors drawn off the seed from the shared first-name pool; they have nothing to do with the
// profile, and a diff that had moved them would have meant the default reached the FIELD.
//
// ⚠ NO SCHEMA MOVED. `kidName` has been on `PlayerProfile` since v1, nothing is persisted that was
// not persisted before, `SAVE_SCHEMA_VERSION` stays 69, and no `PRE_V*` rung is re-aimed – each one
// still rolls its own version back on the world it is taken from and still reproduces.
// =================================================================================================
// RE-FROZEN AT THE ROUND-34 / PROLOGUE MERGE (03.09.2026), AND THE PER-KEY DIFF WAS TAKEN FIRST.
// =================================================================================================
//
// TWO branches re-cut this career independently and neither table described the merged tree:
// `prologue/wave` (merged to main as PR #120) and `round/34`. main's FROZEN carried 24 hashes and
// round 34's 21, and all 21 shared entries differed - so a textual merge was not available and the
// only honest answer was to re-cut once against the merged code.
//
// ⚠ THE PROTOCOL WAS FOLLOWED BEFORE ANYTHING WAS TOUCHED. The control was a detached worktree at
// `origin/main`, and `tools/frozen-key-diff.ts` was run on BOTH trees for four preset/policy pairs:
//
//     · 5/0 - 0 keys moved
//     · 8/0, 0/0, 0/1, 5/1 - **exactly ONE key each, and it is `events`**
//         b0f5dd2424a4  ->  4cbd0713b8dc
//
// ⭐ ONE KEY, AND IT IS THE KEY THE CHANGE IS ABOUT. Round 34 item 3 moved the birthday announcement
// off the week her DATE falls in and onto the week the CLOCK ticks (`birthdayYearIn` is now literally
// `kidAgeYears(w) > kidAgeYears(w-1)`), so "She is sixteen this week." slides week 127 -> 128 and the
// event id counter renumbers behind it. `rngMain` and `birthdays` are byte-identical on every arm,
// and the frozen MAIN capture (41550 / e6b0c709) never moved.
//
// ⚠ The re-cut itself was mechanical - every constant replaced by the value the merged walk actually
// produces, iterated to convergence - and it is ONE re-cut, not stacked on bundle E's: bundle E's
// table was discarded with the merge, not built upon.
// =================================================================================================
// ⭐⭐⭐ RE-FROZEN FOR ROUND 35 #14 (03.09.2026) – THE PUBLISHED DRAW IS HONOURED, SO THE CAREERS
// PLAYED DIFFERENT PEOPLE. PER-KEY DIFF TAKEN FIRST, AS THE PROTOCOL DEMANDS.
// =================================================================================================
//
// THE OWNER: «на неделе перед турниром случилась жеребьевка, мне сказали "играем против №118 шанс
// 71%", пошел турнир - соперник в первом раунде №76». The draw was stored nowhere and every reader
// re-derived it from a ranking, a condition map and a standing table that all move week to week, so
// the card at week − 1 and the bracket at week E named different girls on **293 of 489 draw weeks
// (59.9%)** (tools/r35-draw-fact.ts). It is now written down (`WorldState.drawnFirstRounds`, v70) and
// the bracket honours it.
//
// ⚠ THE CONTROL WAS **THIS BRANCH'S HEAD WITH MY CHANGE ABSENT** (a detached worktree at `a1c1109c`),
// never `origin/main` – thirty-three commits of this wave sit between them and comparing against
// main would have measured all of it. CLAUDE.md's null-arm provenance check was run in the negative
// direction before anything was measured: `git grep drawnFirstRounds -- src` returns **0 files on the
// control and 7 on the branch**, so the reader is provably absent from arm A.
//
// `tools/frozen-key-diff.ts`, five preset/policy pairs, 156 weeks:
//
//     · 5/0 (25k middle, grinder)              **22 of 73 keys**
//     · 8/0 (120k wealthy, elite, grinder)     **33 of 73**
//     · 0/1 (8k working, self-coached, PLAYER) **31 of 73**
//     · 0/0                                    **28 of 73**
//     · 5/1                                    **34 of 72**
//
// ⚠ A WIDE DIFF IS THE EXPECTED OUTCOME HERE AND A NARROW ONE WOULD HAVE BEEN THE ALARMING ONE. The
// change decides WHO SHE PLAYS IN ROUND ONE. Everything downstream of a match therefore moves
// together – `results`, `events`, `skills`, `fundsCents`, `trophiesByTier`, `bestFinishByTier`,
// `milestones`, `careerTotals`, `seasonHistory`, `injuryHistory`, `condition` – because a different
// opponent is a different result, a different cheque and a different week of strain. `schemaVersion`
// moved on purpose (69 -> 70) and `drawnFirstRounds` is the field that moved it.
//
// ⭐⭐ AND THE KEY THAT MATTERS DID NOT MOVE: `rngMain` IS BYTE-IDENTICAL ON ALL FIVE ARMS –
// `1dbff28caca2`, `aebc8101d6df`, `d84bcbf0c481`, `d84bcbf0c481`, `1dbff28caca2`, control and branch.
// That is the invariant this file guards and it held BY CONSTRUCTION rather than by luck: the
// recorder is a pure read of the preview path, `withPinnedFirstRound` exchanges two finished slots
// and takes no `rng` at all, and `seed:kidtour:<eventId>` is spent in the same order and to the same
// depth it always was. The DICE did not move, the PAIRINGS did. The world's identity is intact with
// it – `seed`, `week`, `profile`, `potential`, `cohort`, `season`, `plan`, `college`, `fork`,
// `birthdays`, `kit`, `assets`, `penalties`; 52 keys unmoved on 5/0.
//
// ⚠⚠ AND THE FROZEN MAIN CAPTURE IS UNMOVED AND NOT RE-PINNED: 41550 draws / hash `e6b0c709`,
// tests/condition.test.ts, green on this tree. A new persisted field should not draw on MAIN at all,
// and this one does not.
//
// ⚠ EVERY `PRE_*` SET BELOW IS RE-ANCHORED, WHICH IS THE SECOND KIND OF MOVE THIS FILE DISTINGUISHES
// – not a schema field, but a change to what a career IS (the 28.08 interest removal is the
// precedent). Rolling `schemaVersion` back on a career that played different opponents cannot
// reproduce a career that played the old ones, so all 63 constants were re-taken from the new walk in
// ONE mechanical pass, and they go on doing their job exactly as `PRE_V50`'s own paragraph promised.
// `careerHashAtSchema` gained the `drawnFirstRounds` peel and a `< 70` rung – see its own note, and
// note that this is the FIRST peel in that chain which is not a no-op on a frozen career.
// =================================================================================================
// ⭐⭐⭐ RE-FROZEN FOR E-01 (05.09.2026, THE ENGINE LANE OF THE 05.09 REVIEW) – THE PUBLISHED DRAW IS
// HONOURED **ACROSS THE SEASON BOUNDARY TOO**, AND ONE CAREER OF THREE PLAYED A DIFFERENT WEEK 52.
// PER-KEY DIFF TAKEN FIRST, AS THE PROTOCOL DEMANDS.
// =================================================================================================
//
// WHAT MOVED THEM. Round 35 #14 above made the draw a fact; the review found the promise breaking
// once a season, on the one week it can. `tickWeek` publishes the draw at week 52k − 1 (its step 8)
// and plays it at week 52k (its step 5) – with `seasonBoundaryAndObligations` in between, at step 1,
// running the junior conveyor. A promised girl retired there has left the field before her own match
// and `phaseHerWeek:167-171` falls back to a live draw with no record that a promise was broken.
// Measured by the lane on 3 of 20 boundary-week events against 0 of 301 elsewhere; reproduced here
// before the fix at `r35-fact-b` week 52, event `1-w52-regional` (the card said `ai-29`, the bracket
// played `ai-150`). `renewCohort` now takes a `keep` set and `phaseObligations` hands it every id in
// `world.drawnFirstRounds`.
//
// ⚠ THE CONTROL IS **THIS TREE WITH THE ONE ARGUMENT REMOVED**, not an earlier commit and not a
// worktree: the whole change is `keep` being passed at `phaseObligations`, so dropping that argument
// by hand IS the change backed out, with every other byte of the tree – this file included – held
// fixed. Reader check on arm A, in the negative direction CLAUDE.md prescribes: the call site reads
// `renewCohort(world.cohort, world.seed, seasonIndex)` there and `…, seasonIndex, promised)` here.
//
// `tools/frozen-key-diff.ts`, the three frozen preset/policy pairs, 156 weeks, headers checked
// against the invocation on all six captures (`# preset N policy M weeks 156`):
//
//     · 5/0 (25k middle, grinder)              **11 of 72 keys**
//     · 8/0 (120k wealthy, elite, grinder)     **0 keys. Byte-identical.**
//     · 0/1 (8k working, self-coached, PLAYER) **0 keys. Byte-identical.**
//
//   MOVED, on middleGrinder alone: **cohort · condition · events · fieldSeasonPoints ·
//     fieldSeasonTitles · kidRankDomestic · results · seasonLosses · seasonRecord · seasonWins ·
//     trophiesByTier** – i.e. one player kept in the field, the round-one match that follows from
//     her being there, and everything downstream of that match. `cohort` is the change itself;
//     `results` is the different opponent; the rest is what a different result does to a season.
//
//   UNMOVED ON ALL THREE, and these are the ones worth naming: **rngMain · schemaVersion · seed ·
//     week · profile · potential · season · plan · fundsCents · skills · entries · drawnFirstRounds**
//     – no schema move, no stream move, and the two careers that never held a boundary-week promise
//     did not feel the change at all, which is the shape a targeted exemption should have.
//
// ⭐⭐ AND THE KEY THAT MATTERS DID NOT MOVE, FOR THE FOURTEENTH WAVE RUNNING: `rngMain` is
// byte-identical on all three careers, control and branch – `1dbff28caca2`, `aebc8101d6df`,
// `d84bcbf0c481`, the same three values the round-35 block above quotes. It held BY CONSTRUCTION:
// `renewCohort` calls `rng()` once per player in cohort order BEFORE `keep` is consulted (the
// `resolveBaseCosts` discipline), the conveyor's stream is `seed:conveyor:<season>` and never MAIN,
// and the intake is built from the exempted `left` so the field size does not move either.
//
// ⚠⚠ THE FROZEN MAIN CAPTURE IS UNMOVED AND NOT RE-PINNED: 41550 draws / hash `e6b0c709`,
// tests/condition.test.ts, green on this tree.
//
// ⚠ ONLY `middleGrinder` IS RE-FROZEN, in `FROZEN` and in every `PRE_*` set below – twenty-one
// constants, and not one `eliteGrinder` or `selfTravelling` value in this file is touched. They
// still reproduce, which is the property those constants exist to assert.

export const FROZEN = {
  /** ⭐⭐ ONE OF THE THREE MOVED (28.08, ROUND 29 #20 – the owner's ruling 5 of 09.08: a booked family
   *  holiday stops the kit wearing), AND WHICH ONE IT IS *IS* THE MEASUREMENT. `selfTravelling` moved
   *  and the two grinders did not, because `POLICIES[0]` books no vacation at all
   *  (`vacationSpendShare: 0`, `offSeasonWeekOff: false`) while the player policy does. A change that
   *  only bites where a holiday exists is exactly the shape this change claims to have.
   *
   *  ⚠ PER-KEY DIFF TAKEN FIRST, as this file's protocol demands, and the control was **this branch
   *  with MY OWN COMMIT REVERTED** in a dedicated worktree (`git revert --no-commit 8ada9d3`) – not
   *  the previous commit. The reader was confirmed ABSENT on the control arm before it was measured
   *  (`git grep gearRestWeeks -- src` returns nothing there), which is CLAUDE.md's null-arm check run
   *  in the negative direction. `tools/frozen-key-diff.ts` on all three careers:
   *
   *    · 5/0 (25k middle, grinder)          – **0 keys. Byte-identical on every one of them.**
   *    · 8/0 (120k wealthy, elite, grinder) – **0 keys. Byte-identical on every one of them.**
   *    · 0/1 (8k working, self-coached, PLAYER) – **2 keys**: `events`, plus the new `gearRestWeeks`
   *      appearing for the first time. ⚠ AND THE `events` MOVE IS TWO MATCH SCORELINES over 156 weeks
   *      – same opponents, same rounds, same winners, and NOT ONE MONEY ROW. Her kit is a shade
   *      fresher coming off a holiday, so a few points inside a match she still won fall the other
   *      way. ⚠⚠ Note what did NOT move and was expected to: the gear BILL. The family's recurring
   *      buys are a schedule, not a clock, so a holiday changes the CONDITION of her kit, never its
   *      price – which is why `fundsCents` is identical on all three arms.
   *
   *  ⚠⚠ AND `rngMain` IS BYTE-IDENTICAL ON ALL THREE – `d84bcbf0c481` on 0/1, control and branch, and
   *  unmoved on both grinders. That is the load-bearing half: the wear pause rides in on the AGE that
   *  goes into `kitWearAt`, post-draw, and spends nothing on any stream. Input-independence is intact
   *  and the frozen MAIN capture is untouched: 41550 / e6b0c709.
   *
   *  ⚠ ONLY `selfTravelling` IS RE-FROZEN, in `FROZEN`, `PRE_R28B` and every `PRE_V*` set below.
   *  Every `middleGrinder` and `eliteGrinder` constant in this file is UNTOUCHED and still reproduces,
   *  which is the cheapest possible statement of the blast radius.
   *
   *  ⚠⚠ ALL THREE MOVED AGAIN (28.08, ROUND 29 #12 – the automatic interest on the current account
   *  removed at the owner's ruling), and so did every `PRE_*` set below them. This is the SECOND
   *  kind of move this file distinguishes: not a schema field, but a change to what a career IS.
   *
   *  ⚠ PER-KEY DIFF TAKEN FIRST, as this file's protocol demands, and the control was **this branch
   *  with MY OWN COMMIT REVERTED** in a dedicated worktree (`git revert --no-commit 74cb407`) – not
   *  the previous commit. The reader was confirmed present on the control arm before it was measured
   *  (`resolveInterest` in `world/phaseFinance.ts`), which is CLAUDE.md's null-arm check run in the
   *  positive direction. `tools/frozen-key-diff.ts` on all three arms:
   *
   *    · 5/0 (25k middle, grinder)  – **7 of 73 keys**: careerTotals, events, financeWeeks,
   *      fundsCents, lastSeasonSummary, nextEventId, seasonHistory. Money and the money's paper
   *      trail, and NOTHING else. A career that never travels makes no funded decision, so the
   *      removal reaches its wallet and stops there.
   *    · 8/0 (120k wealthy, elite, grinder) – **7 of 73**, the same seven.
   *    · 0/1 (8k working, self-coached, PLAYER) – **26 of 72**, and this one is the honest half:
   *      skills, results, kidRank, knock, injuryHistory, vacations, offers, peakPhysical and the
   *      rest. ⚠ THAT IS NOT A LEAK, IT IS THE ECONOMY. The player policy ENTERS tournaments and
   *      BOOKS vacations out of the wallet, so a family with $1,954 less over the horizon enters
   *      fewer, trains differently and finishes elsewhere. An income change that could not reach a
   *      career's results would not be an income change.
   *
   *  ⚠⚠ AND `rngMain` IS BYTE-IDENTICAL ON ALL THREE – `1dbff28caca2`, `aebc8101d6df`, `d84bcbf0c481`,
   *  control and branch. That is the load-bearing half and it is what separates this from a defect:
   *  the DICE did not move, the DECISIONS did. Input-independence is intact (a player choice may
   *  never re-roll the world's dice) and the frozen MAIN capture is untouched: 41550 / e6b0c709.
   *  `tests/round9.test.ts`' re-aimed zero-RNG arm proves the same thing from the other side.
   *
   *  ⚠ THE ROLLBACK IDENTITIES BELOW ARE RE-ANCHORED TO THE NEW WORLD and go on doing their job,
   *  exactly as `PRE_V50`'s own paragraph predicted the first time this happened: *"if a later wave
   *  moves one of these careers for a real reason, the rollback case goes red beside the freeze and
   *  says which kind of change it was."* It did, and it said so – all six hashes red rather than a
   *  single pair, which is the signature of a change that reaches every career rather than one. */
  /** PRESETS[5] · 25k middle family, middle coach · grinder policy (never travels) */
  /** ⚠ MOVED WITH ITS TWINS A FOURTH TIME (17.08, the college choice – schema v52). All three moved
   *  by exactly ONE KEY again, and `PRE_V52` below proves it: rolling `schemaVersion` back to 51 on
   *  the NEW world reproduces the old hashes byte for byte, for all three. */
  /** ⚠ MOVED WITH ITS TWINS AGAIN (21.08, round 24 – the freeze's hygiene, schema v55), and again by
   *  EXACTLY ONE KEY. `PRE_V55` below is the proof rather than the claim: rolling `schemaVersion`
   *  back to 54 on the NEW world reproduces the old hashes byte for byte, for all three careers.
   *
   *  ⚠ PER-KEY DIFF TAKEN FIRST, as this file's protocol demands, and the control was **this branch
   *  with MY OWN COMMIT REVERTED** in a dedicated worktree (`git revert --no-commit`) – not the
   *  previous commit, because B2's ranking wave landed on this branch between them and comparing
   *  against it would have measured both. `tools/frozen-key-diff.ts` on all three (preset/policy 5/0,
   *  8/0, 0/1), headers checked against the filenames: **one line of 66 differs, and it is
   *  `schemaVersion`.** `rngMain`, `results`, `season`, `cohort`, `events`, `fundsCents`, `kidRank`,
   *  `skills` – every one byte-identical.
   *
   *  ⚠ AND THAT IS BY CONSTRUCTION. Round 24's three rules all live inside the college freeze:
   *  `answerFork(…, 'college')` releases her entries, `resumeFromCollege` refuses on an open reveal,
   *  and `tickWeek` step 2 is gated on `inCollege`. Week 156 is 32 weeks short of the fork, so
   *  `world.fork` and `world.college` are both null here – asserted in `walkFrozenCareer`, not
   *  assumed. `rngMain` is untouched for the twelfth wave running: nothing this wave added draws on
   *  any stream, so the frozen MAIN capture in tests/condition.test.ts (count 41550, hash e6b0c709)
   *  is not re-pinned, and it was re-run green beside this re-freeze. */
  /** ⚠ MOVED WITH ITS TWINS ONCE MORE (22.08, round 24 – the student championship, schema v56), and
   *  again by EXACTLY ONE KEY. `PRE_V56` below is the proof rather than the claim: rolling
   *  `schemaVersion` back to 55 on the NEW world reproduces the previous three hashes byte for byte.
   *
   *  ⚠ PER-KEY DIFF TAKEN FIRST, control = **this branch with MY OWN COMMIT REVERTED** in a detached
   *  worktree (`git revert --no-commit`) – never the previous commit and never a worktree at HEAD.
   *  All three arms, headers checked against the filenames: **one line of 66 differs, and it is
   *  `schemaVersion`.**
   *
   *  ⚠ AND THAT IS BY CONSTRUCTION. The championship fires on `COLLEGE_LEAGUE.seasonWeek` behind
   *  `inCollege`, and the earned call-up reads `lastLeagueRun`, a field that only exists inside
   *  `world.college`. Week 156 is 32 weeks short of the fork, so both are null here – asserted in
   *  `walkFrozenCareer`, not assumed. `rngMain` is untouched for the thirteenth wave running: the
   *  new draws are on `seed:collegeleague:<week>` and `seed:collegematch:<week>:<r>`, and the
   *  call-up's own four pulls on `seed:callup:<week>` are byte-identical – only the threshold the
   *  first is compared against moved. The frozen MAIN capture (41550 / e6b0c709) is not re-pinned
   *  and was re-run green beside this re-freeze. */
  /** ⚠ MOVED WITH ITS TWINS ONCE MORE (22.08, round 24 – the college birthday, schema v57), and
   *  again by EXACTLY ONE KEY. `PRE_V57` below is the proof rather than the claim: rolling
   *  `schemaVersion` back to 56 on the NEW world reproduces the previous three hashes byte for byte.
   *
   *  ⚠ PER-KEY DIFF TAKEN FIRST, as this file's protocol demands. The wave was UNCOMMITTED and its
   *  agent the only one running, so "this branch with my own change reverted" IS a detached worktree
   *  at `1356712` – the shared tree held nothing but this wave on top of that commit. Verified both
   *  ways rather than assumed (the 17.08 null-arm hazard): `grep -c pendingYearStart` returns 0 in
   *  the A tree's engine and 6/2 (world.ts / protocol.ts) in B's, so the A arm lacks the change and
   *  the B arm contains its reader. All three arms (preset/policy 5/0, 8/0, 0/1), headers checked
   *  against the invocations: **one line of 66 differs, and it is `schemaVersion`**
   *  (7688b6ef5255 -> c837649cce43).
   *
   *  ⚠ AND THAT IS BY CONSTRUCTION. v57's field (`college.pendingYearStart`, the opening of a year
   *  paused on her birthday) lives on a college state that is null in all three careers – week 156
   *  is 32 weeks short of the fork, asserted in `walkFrozenCareer` – and `pendingBirthday`'s opened
   *  guard changes behaviour only when `world.college` exists or the latch is the resumable college
   *  one, neither of which a frozen career ever has. ⚠⚠ THE TOUR BIRTHDAY PATH IS BYTE-IDENTICAL:
   *  each of these careers holds three tour birthdays inside its 156 weeks, and every key that could
   *  see one – `birthdays`, `events`, `rngMain` – hashed identically on both arms. `rngMain` unmoved
   *  for the fourteenth wave running: a guard is not a draw, and the gift never was one
   *  (`seed:birthday:<age>`, never MAIN). The frozen MAIN capture (41550 / e6b0c709) is not
   *  re-pinned and was re-run green beside this re-freeze. */
  /** ⚠ MOVED WITH ITS TWINS ONCE MORE (22.08, round 24 #5 – the fork moves off her birthday, schema
   *  v58), and again by EXACTLY ONE KEY. `PRE_V58` below is the proof rather than the claim: rolling
   *  `schemaVersion` back to 57 on the NEW world reproduces the previous three hashes byte for byte.
   *
   *  ⚠ PER-KEY DIFF TAKEN FIRST, as this file's protocol demands. The wave was UNCOMMITTED and its
   *  agent the only one running, so "this branch with my own change reverted" IS a detached worktree
   *  at HEAD (`8b057bc`, a docs-only review commit on top of `7c64ea6` – five plan files, zero
   *  engine lines). All three arms (preset/policy 5/0, 8/0, 0/1), headers checked against the
   *  invocations: **one line of 66 differs, and it is `schemaVersion`** (c837649cce43 ->
   *  6208ef0f7750), on all three.
   *
   *  ⚠ AND THAT IS BY CONSTRUCTION. The redesign's whole machinery sits past these careers' horizon:
   *  the ask now fires at `schoolEndWeek(6)` = week 242 – measured, 86 weeks past the 156-week
   *  freeze (under the old birthday clock it was ≈283) – so `world.fork` is still null here
   *  (asserted in `walkFrozenCareer`, not assumed), no reservation exists, `fork.departsWeek` is
   *  never written, and `resolveCollegeDeparture` returns at its first guard on every one of the 156
   *  resolved weeks. `rngMain` is unmoved for the fifteenth wave running, and it is the load-bearing
   *  half: the ask is a week comparison, the reservation is state, and the departure draws nothing –
   *  the offer's own draws live on `seed:collegeoffer:<week>` and are not reached at all here. The
   *  frozen MAIN capture (41550 / e6b0c709) is not re-pinned and was re-run green beside this
   *  re-freeze. */
  /** ⚠ MOVED WITH ITS TWINS ONCE MORE (22.08, the travelling team step 1 – the masseur, schema
   *  v59), and for the first time the one line is a NEW KEY rather than a moved one: `masseurHired`
   *  appears (hash fcbcf165908d = `false`) beside the `schemaVersion` bump. `PRE_V59` below is the
   *  proof rather than the claim: rolling the schema back to 58 AND dropping that one key – which
   *  is what "this save at v58" literally means, the key did not exist – reproduces the previous
   *  three hashes byte for byte, for all three careers.
   *
   *  ⚠ PER-KEY DIFF TAKEN FIRST, as this file's protocol demands. The wave sat alone on
   *  `wave/staff-masseur` in its own worktree, so the control is a detached worktree at the branch
   *  base `2a398f0` – which IS this branch with the wave's one commit reverted. Verified both ways
   *  rather than assumed (the 17.08 null-arm hazard): `grep -c masseur` returns 0 in the A tree's
   *  engine and the B tree carries both the field and its readers. All three arms (preset/policy
   *  5/0, 8/0, 0/1), headers checked against the invocations: **`schemaVersion` moved
   *  (6208ef0f7750 -> 3e1e967e9b79) and `masseurHired` appeared, and NOTHING ELSE** – `rngMain`,
   *  `results`, `season`, `events`, `entries`, `fundsCents`, `condition`, `injury`,
   *  `injuryHistory`, `careerTotals`, `skills` – every other key byte-identical on all three.
   *
   *  ⚠ AND THAT IS BY CONSTRUCTION. The hire is pro-career gated (`activeLadderOf === 'wta'`) and
   *  no bench policy ever hires him, so `masseurHired` is false here – asserted in
   *  `walkFrozenCareer`, not assumed – and every effect (the salary, the +1 condition, the rehab
   *  cadence) sits behind `masseurWorksThisWeek`, which is false without a hire. `rngMain` is
   *  unmoved for the sixteenth wave running, and it is the load-bearing half: the hire is a
   *  boolean, the salary is a flat subtraction, and the rehab cadence is arithmetic off
   *  (week − sinceWeek) – ZERO draws on any stream by design. The frozen MAIN capture
   *  (41550 / e6b0c709) is not re-pinned and was re-run green beside this re-freeze. */
  /** ⚠ MOVED AGAIN BY STEP 2 OF THE SAME WAVE (22.08 – the dial and the seat, still schema v59:
   *  the version shipped to no player and was extended in place). TWO new keys this time, both
   *  inert by their written defaults: `masseurSessionsPerWeek` appears (hash 4b227777d4dd = `4`,
   *  the middle rung) and `masseurTravels` appears (fcbcf165908d = `false`). `PRE_V59` below still
   *  holds the v58-era constants, and the rollback identity now drops all THREE masseur keys –
   *  which is what "this save at v58" literally means.
   *
   *  ⚠ PER-KEY DIFF TAKEN FIRST, control = a detached worktree at `c976786` (this branch with
   *  step 2's work reverted – step 1's own commits stay in both arms, so the diff isolates step 2).
   *  Null-arm checked both ways (the 17.08 hazard): `grep -c masseurSessionsPerWeek` = 0 in the A
   *  tree's src, and the B tree carries the field plus its readers in six files. All three arms
   *  (preset/policy 5/0, 8/0, 0/1), headers checked against the invocations – and the check earned
   *  its keep: the first run's three arms all came back `# preset 0 policy 1` (a zsh word-split
   *  swallowed the flags) and was thrown away. The honest re-run: **`masseurSessionsPerWeek` and
   *  `masseurTravels` appeared, and NOTHING else moved** – `rngMain`, `schemaVersion` (59 both
   *  sides), `results`, `season`, `events`, `entries`, `fundsCents`, `condition`, `injury`,
   *  `injuryHistory`, `careerTotals`, `skills` – every other key byte-identical on all three arms.
   *
   *  ⚠ AND THAT IS BY CONSTRUCTION, twice over: no bench policy hires him (asserted in
   *  `walkFrozenCareer`), and step 2's every effect needs the hire AND a stance – the rung bill
   *  and cadence read `masseurWorksThisWeek` (false without a hire), the fare and the tour relief
   *  read `masseurTravels` (asserted false). `rngMain` is unmoved for the seventeenth wave
   *  running: the dial and the stance are plain state, the fare is a subtraction in the play arm,
   *  and the tour relief is post-strain arithmetic – ZERO draws on any stream. The frozen MAIN
   *  capture (41550 / e6b0c709) is not re-pinned and was re-run green beside this re-freeze. */
  /** ⚠ MOVED WITH ITS TWINS ONCE MORE (25.08, round 26 #6 – the College League is WALKED, schema
   *  v60), and again by EXACTLY ONE LINE, which this time is the `schemaVersion` number alone: the
   *  new field lives INSIDE `CollegeState` (`college.leagueReveal`), and `world.college` is null in
   *  all three of these careers, so not one key was added to their serialisation. `PRE_V60` below is
   *  the proof rather than the claim: rolling the schema back to 59 on the NEW world reproduces the
   *  previous three hashes byte for byte, for all three careers, with no key dropped.
   *
   *  ⚠ PER-KEY DIFF TAKEN FIRST, as this file's protocol demands, and the control is a detached
   *  worktree at the branch base `e9f76ff` – this branch with my own work reverted, never the
   *  previous commit. All three arms run separately with their flags checked against the printed
   *  headers (the zsh word-split that swallowed them once is recorded two paragraphs up). The
   *  result: **one line of 69 differs on every arm, and it is `schemaVersion`**
   *  (3e1e967e9b79 -> 39fa9ec190ee). `rngMain`, `results`, `season`, `cohort`, `events`, `entries`,
   *  `fundsCents`, `condition`, `injury`, `injuryHistory`, `careerTotals`, `skills`, `kidRank` –
   *  every other key byte-identical on all three.
   *
   *  ⚠ AND THAT IS BY CONSTRUCTION. Everything this wave added is behind the college freeze:
   *  `resolveCollegeLeague` opens the reveal on `COLLEGE_LEAGUE.seasonWeek` and only when
   *  `inCollege`, the pause is inside `resumeFromCollege`, and the amateur `pendingView` arm is
   *  reached only when a reveal is open. Week 156 is 32 weeks short of the fork, which
   *  `walkFrozenCareer` asserts rather than assumes. `rngMain` is unmoved for the eighteenth wave
   *  running, and it is the load-bearing half: the reveal is two integers and a cursor over rows the
   *  tick had already written – ZERO draws on any stream. The frozen MAIN capture
   *  (41550 / e6b0c709) is not re-pinned and was re-run green beside this re-freeze. */
  /** ⚠⚠ RE-AIMED, NOT WEAKENED (26.08, the long goodbye step 1 – schema v62: the stored peak
   *  physical). All three moved, and this is the first re-freeze in the block that had to move them:
   *  every "all three held" above belonged to a change living behind the college freeze, while
   *  `peakPhysical` is written by the WEEKLY TICK – 156 times inside each of these walks – so a
   *  frozen career that did NOT move would have meant the growth phase was not writing it at all.
   *
   *  ⚠ AND `PRE_V62` BELOW IS THE PROOF RATHER THAN THE CLAIM: rolling the schema back to 61 and
   *  dropping the one key v62 appended reproduces these three hashes byte for byte, so what the wave
   *  did to these careers is a number nothing reads yet. It CANNOT feed back into the tennis by
   *  construction – `Math.max` over `physicalMean(world.skills)`, taken on the line after `growWeek`,
   *  which is the engine's only writer of `world.skills` – and `walkFrozenCareer` now asserts the
   *  value is exactly today's mean rather than merely present, since at 16.6 nothing has declined.
   *  All EIGHT older rollback identities (PRE_V50…PRE_V61) reproduce their own constants unchanged,
   *  which is the second half of the same proof: `careerHashAtSchema` drops the new key first.
   *
   *  ⚠ `rngMain` UNMOVED for the twentieth wave running, and it is the load-bearing half: a running
   *  maximum is a comparison, and this wave adds no draw to any stream. The frozen MAIN capture is
   *  not re-pinned – count 41550, hash e6b0c709 – and was re-run green beside this re-freeze.
   *
   *  ⭐⭐ RE-FROZEN AGAIN (27.08, THE SHOP – slice 1, schema v63), AND ALL THREE MOVED BY EXACTLY ONE
   *  EMPTY KEY. `PRE_V63` below is the proof rather than the claim: `careerHashAtSchema(…, 62)` drops
   *  `assets` and rolls the number back, and all three previous hashes come back byte for byte. That
   *  identity IS acceptance §2e-4 – a save from before the shelf loads with `assets: []` and plays
   *  identically – measured on three careers rather than argued.
   *
   *  ⚠ AND UNLIKE v62 THIS ONE IS BOOKKEEPING, NOT A FINDING. `peakPhysical` had to move these hashes
   *  because the tick writes it 156 times; `assets` is written ONCE, by `createWorld`, as `[]`, and
   *  `revalueAssets` iterates it zero times on every tick of every one of these careers. None of them
   *  can reach the shelf at all – it opens on her first counting W-series result and 156 weeks ends at
   *  age 16.6 – which `walkFrozenCareer` now asserts directly instead of leaving to the reader.
   *
   *  ⚠ `rngMain` UNMOVED for the twenty-first wave running. Slice 1 draws NOTHING – `world/shop.ts`
   *  imports no RNG and takes no `Rng` argument – so the frozen MAIN capture is NOT re-pinned (count
   *  41550, hash e6b0c709) and was re-run green beside this re-freeze.
   *
   *  ⭐⭐ RE-FROZEN AGAIN (27.08, THE RETIREMENT HAZARD'S OWN CONDITION CURVE – docs/specs/
   *  retirement-shape-2026-08.md §13), AND THIS ONE MOVED CAREERS RATHER THAN KEYS. ALL THIRTEEN
   *  BLOCKS MOVED, INCLUDING EVERY ROLLBACK IDENTITY, and that is correct rather than alarming: the
   *  change decides WHO retires, a retirement opens a layoff, a layoff releases entries, and a
   *  career diverges from there. No rollback can undo it because no key was added to `WorldState` –
   *  `SAVE_SCHEMA_VERSION` did not move (the freshness is an additive OPTIONAL field on the
   *  `MatchPlayer` snapshot, absent ⇒ the pre-27.08 hazard, the same reading `age?` ships under).
   *
   *  ⚠ PER-KEY DIFF TAKEN FIRST, as this file's protocol demands – `tools/frozen-key-diff.ts`, all
   *  three arms (preset/policy 5/0, 8/0, 0/1), headers checked against the invocations. ⚠ AND THE
   *  CHECK EARNED ITS KEEP AGAIN: the first attempt used a `for` loop with `set -- $pp` and all
   *  three files came back `# preset 0 policy 0` – the same zsh word-split this file has already
   *  recorded twice. Re-run with explicit flags. ⚠ THE CONTROL WAS THIS CHANGE REVERTED, in a
   *  DETACHED WORKTREE at the same commit, never the previous commit.
   *
   *  WHAT MOVED: **29 of 72 keys** on 5/0, **28 of 72** on 8/0 – `results`, `events`, `entries`,
   *  `condition`, `skills`, `injuryHistory` and the ledgers downstream of them – and **1 of 71** on
   *  0/1, where the only key to move is `events`. That last cell is the clearest reading on the
   *  page: the 8k player-policy career suffers no DIFFERENT retirement inside 156 weeks, so the only
   *  thing that changed in it is the new optional field appearing on the `MatchPlayer` snapshots
   *  stored in its match records.
   *
   *  ⭐⭐ AND THE KEY THAT MATTERS DID NOT MOVE: `rngMain` IS BYTE-IDENTICAL IN ALL THREE ARMS
   *  (1dbff28caca2 / aebc8101d6df / d84bcbf0c481, before and after). The new term is arithmetic on
   *  state and draws nothing; the two retirement uniforms were already drawn unconditionally per
   *  match off `seed:ret`. So the frozen MAIN capture is NOT re-pinned – count 41550, hash e6b0c709
   *  – and `tests/condition.test.ts` was re-run green beside this re-freeze.
   *
   *  ⭐⭐ AND RE-FROZEN ONCE MORE ON TOP OF THAT, THE SAME DAY (27.08, ROUND 27 #6 – the
   *  national-team call-up through the tournament flow, schema v64). THIS BLOCK STACKS ON THE ONE
   *  ABOVE and the order is the history: the retirement fix landed on `main` at 13:47, round 27 #6
   *  through the evening, and this tree is the FIRST to carry both. ⚠⚠ WHICH IS WHY THE THREE
   *  CONSTANTS BELOW MATCH NEITHER SIDE OF THE MERGE – the retirement change moved the careers, v64
   *  moves the schema number, and every hash here was RE-DERIVED against the merged tree rather than
   *  inherited from whichever side made the test pass.
   *
   *  ⚠⚠ AND THAT IS THE TRAP THIS PARAGRAPH EXISTS TO RECORD. Git merges by LINE, and agreement on
   *  a line is not agreement on a fact: `PRE_V64` merged CLEANLY and was WRONG, because it exists on
   *  one side only and its values were taken before the retirement change ever reached these
   *  careers. Git raised markers over the three `FROZEN` values and these two prose blocks and over
   *  nothing else – so the twelve older identities below and `PRE_V64` all arrived unchallenged, and
   *  the one number that needed the most care was the one no marker pointed at. All thirteen sets
   *  were re-derived on the merged tree regardless; the twelve inherited ones reproduced, and
   *  `PRE_V64` did not.
   *
   *  ⚠ PER-KEY DIFF TAKEN FIRST, as this file's protocol demands, and ⚠ THE CONTROL IS THE MERGE'S
   *  OWN RESULT AGAINST `origin/main` (`8450d23`, in a detached worktree) – NOT the branch base,
   *  which predates the retirement change and would have measured the two waves together. That
   *  control is what isolates round 27 #6's contribution ON TOP OF the retirement change, which is
   *  the only question the merge raises. Null-arm checked both ways (the 17.08 hazard):
   *  `callUpReveal`, `settleCallUpLetter` and `callUpFor` match 0 files in the control's `src`/
   *  `tools`, and the merged tree carries the field plus its readers – the `world.offers` writer
   *  among them.
   *
   *  THE VERDICT, all three arms (preset/policy 5/0, 8/0, 0/1), ⚠ headers checked against the
   *  invocations – the zsh word-split this file has now recorded three times did NOT recur, each
   *  header read back its own preset and policy: **exactly one key differs – 1 of 71, 1 of 71 and
   *  1 of 70 – and it is `schemaVersion`** (da4ea2a5506f -> a68b412c4282). Not one key was added or
   *  dropped on any arm, and `results`, `offers`, `events`, `entries`, `condition`, `skills`,
   *  `injuryHistory`, `season`, `cohort`, `fundsCents`, `careerTotals` – every other key
   *  byte-identical on all three.
   *
   *  ⚠ AND ONE CORRECTION TO THE DENOMINATOR THE BLOCK ABOVE USES. It says «of 72», «of 72» and «of
   *  71»; `frozen-key-diff` prints 72/72/71 LINES on these arms and the first of them is its own
   *  `# preset … policy …` header, so the KEY counts are 71/71/70 – measured on `origin/main` itself,
   *  not only here. The retirement block's own reading is unaffected (what moved is what moved), but
   *  the denominators in it are each one too many, and this file is the wrong place to leave a
   *  number nobody re-counted.
   *
   *  ⭐⭐ SO THE «VERSION NUMBER ALONE» CLAIM SURVIVES THE RETIREMENT CHANGE, and it was VERIFIED
   *  rather than trusted: `careerHashAtSchema(…, 63)` on the MERGED tree reproduces origin/main's
   *  three post-retirement hashes byte for byte – 37a2a7b7…, 2ead13e9…, 8d6b056f… – which is
   *  exactly what `PRE_V64` below is now pinned to. The twelve older identities (PRE_V63…PRE_V50)
   *  reproduce origin/main's re-pinned constants unchanged as well – 36 of 36 set-arm cells, 39 of
   *  39 counting PRE_V64's own three – so the ones the line-merge inherited are RIGHT on this tree
   *  rather than merely uncontested.
   *
   *  ⚠ AND THE WAVE HAD TWO OTHER WAYS TO REACH THESE CAREERS, WHICH IS WHY THE IDENTITY IS WORTH
   *  MORE THAN THE PROSE. It adds a letter to `world.offers` (`settleCallUpLetter`) and it moves the
   *  call-up's roll into `callUpFor` – and `offers` is inside this hash. Both are guarded on
   *  `inCollege`, week 156 is 32 weeks short of the fork, and `walkFrozenCareer` asserts
   *  `world.college === null` rather than assuming it; if either had leaked, the rollback would not
   *  reproduce and this case would be red beside the freeze, naming the wave.
   *
   *  ⚠ `rngMain` UNMOVED for the twenty-second wave running, and ⚠⚠ ON A MERGE THAT IS THE STOP
   *  CONDITION RATHER THAN A REMARK: it is byte-identical across the control on every arm AND equal
   *  to the values the retirement block above records (1dbff28caca2 / aebc8101d6df / d84bcbf0c481),
   *  so round 27 #6 did not leak into the MAIN stream on top of the retirement change. Had it
   *  moved, nothing here would have been re-pinned. The letter asks `rollCallUp` a second time on
   *  `seed:callup:<tieWeek>` – the SAME per-week sub-stream the tick will derive, never MAIN and
   *  never a new key – and `playCallUpRubbers` is untouched where it always ran. The frozen MAIN
   *  capture is NOT re-pinned (count 41550, hash e6b0c709), `tests/condition.test.ts` is
   *  byte-identical at the base, on `origin/main`, on this branch and in this tree (blob f1c8d518),
   *  and it was re-run green beside this re-freeze.
   *
   *  ⭐⭐ AND RE-DERIVED A THIRD TIME FOR THE MERGE ITSELF (28.08), WHEN ROUND 28'S LEDGER BRANCH
   *  TOOK `origin/main` IN. This tree is the first to carry round 27 #6 BESIDE round 28 #17-b, and
   *  the two blocks above plus the one on `eliteGrinder` below are kept in the order they happened –
   *  the v64 call-up on 27.08, the offer-window ruling on 28.08. ⚠⚠ NOT ONE CONSTANT IN THIS FILE
   *  WAS INHERITED FROM EITHER SIDE: all fifteen sets were re-derived against the merged tree.
   *
   *  ⚠ PER-KEY DIFF TAKEN FIRST, and ⚠ THE CONTROL IS THIS MERGE REVERTED, IN A DETACHED WORKTREE –
   *  the branch's own pre-merge head `8f9d7af`, which is what `git revert -m 1` of this merge
   *  produces, and nothing else landed on the branch between. All three arms (preset/policy 5/0, 8/0,
   *  0/1), ⚠ each header read back and checked against the invocation that made it – `# preset 5
   *  policy 0`, `# preset 8 policy 0`, `# preset 0 policy 1`; the zsh word-split this file has now
   *  recorded three times did not recur. Null-arm checked both ways (the 17.08 hazard):
   *  `callUpReveal` matches 0 files in the control's `src`/`tools` and 6 in this tree's – five engine
   *  files, its readers among them, plus the generated symbol map.
   *
   *  THE VERDICT: **exactly one key differs – 1 of 71, 1 of 71 and 1 of 70 – and it is
   *  `schemaVersion`** (da4ea2a5506f -> a68b412c4282). Not one key was added or dropped on any arm.
   *  `results`, `offers`, `events`, `entries`, `condition`, `skills`, `injuryHistory`, `season`,
   *  `cohort`, `fundsCents`, `careerTotals`, `kidRank` – every other key byte-identical on all three.
   *  And that is the whole of what `origin/main` brings these careers: this branch ALREADY carried
   *  the retirement change, so round 27 #6 – all of it behind the college freeze – is the only delta
   *  the merge adds, and it is a version number.
   *
   *  ⚠⚠ AND THE CLEAN-MERGE TRAP THE PARAGRAPH ABOVE RECORDS CAUGHT TWO MORE, WHICH IS WHY IT IS
   *  KEPT RATHER THAN TIDIED. Git raised markers over three `FROZEN` values and two prose blocks and
   *  over NOTHING ELSE. Every set was re-derived anyway. The twelve older rollback identities
   *  (`PRE_V63`…`PRE_V50`) reproduced – **36 of 36 cells** – so what the line merge inherited there is
   *  right on this tree rather than merely uncontested. TWO SETS WERE NOT:
   *
   *    · `PRE_V64.eliteGrinder` – THE SAME CONSTANT THAT CAME THROUGH CLEAN AND WRONG ON 27.08,
   *      wrong again by the same mechanism. It arrived as `origin/main`'s `2ead13e9…`, which is that
   *      career BEFORE round 28 #17-b. The v63 shape of it on THIS tree is `32086f46…` – the branch's
   *      own post-ruling value, and the number the pre-merge branch head hashes to.
   *    · `PRE_R28B`, ALL THREE. It exists on ONE side only, so no marker could ever have pointed at
   *      it, and its values were taken before v64 existed. ⭐⭐ Corrected, they are `origin/main`'s
   *      OWN three frozen hashes – which is the sharper form of the same identity: put round 28
   *      #17-b's deadline rule back on this merged tree and you get `origin/main` byte for byte, on
   *      all three careers. Nothing else this branch carries reaches these fixtures at all.
   *
   *  ⚠ `rngMain` UNMOVED for the twenty-third wave running, and ⚠⚠ ON A MERGE THAT IS THE STOP
   *  CONDITION RATHER THAN A REMARK: byte-identical against the control on every arm
   *  (1dbff28caca2 / aebc8101d6df / d84bcbf0c481) AND equal to the values the retirement block above
   *  records. Had it moved, nothing here would have been re-pinned and this would be a leak report
   *  instead. The frozen MAIN capture is NOT re-pinned – count 41550, hash e6b0c709 – and
   *  `tests/condition.test.ts` is byte-identical at the branch base, on `origin/main`, on this branch
   *  and in this tree (blob f1c8d518).
   *
   *  ⭐⭐ RE-FROZEN FOR v65 (28.08) – THE CHAMPION OF EVERY AI TOURNAMENT IS NOW WRITTEN DOWN
   *  (`world.fieldSeasonTitles`), AND ALL THREE CAREERS MOVED BECAUSE ALL THREE CARRY IT. That is a
   *  different reason from v63's: `assets` was an EMPTY key appearing, this one fills itself ~187
   *  times a season in every career the engine has.
   *
   *  ⚠ PER-KEY DIFF TAKEN FIRST, as this file's protocol demands, and ⚠ THE CONTROL IS THIS CHANGE
   *  REVERTED, IN A DETACHED WORKTREE – at `a3ff9df`, the merge commit directly below, which is this
   *  branch with the champion wave absent and nothing else moved. (The wave's own branch measured
   *  itself against `8f9d7af`; that arm predates the merge of `origin/main` and would have credited
   *  this wave with round 27 #6 as well.) Verified BOTH ways rather than assumed (the 17.08 null-arm
   *  hazard): `grep -rl fieldSeasonTitles src/` returns NOTHING on the A tree and four files on B
   *  (`world/state.ts`, `world/phaseAiWeek.ts`, `world/milestones.ts`, `migrations.ts`), so the A arm
   *  genuinely lacks the change and the B arm contains its readers.
   *
   *  `tools/frozen-key-diff.ts` on all three arms (preset/policy 5/0, 8/0, 0/1), ⚠ headers read back
   *  and checked against the invocations: **exactly two lines differ on every arm, and one of them is
   *  a key that did not exist** – `fieldSeasonTitles` APPEARS (71 keys become 72 on the grinders, 70
   *  become 71 on the player arm), and `schemaVersion` goes 64 → 65 (a68b412c4282 → 108c995b953c).
   *  Nothing else on any arm.
   *
   *  ⚠ THE LIST THAT MATTERS, byte-identical on every arm: `rngMain`, `results`, `season`, `cohort`,
   *  `events`, `fundsCents`, `kidRank`, `skills`, `entries`, `seasonEntries`, `fieldSeasonPoints`,
   *  `trophiesByTier`, `careerTotals`, `offers`. **NOT ONE OF THESE THREE CAREERS PLAYED A DIFFERENT
   *  MATCH, WON A DIFFERENT TITLE OR BANKED A DIFFERENT CENT** – which is the whole claim of a change
   *  that only writes down what the bracket had already decided.
   *
   *  ⚠ `rngMain` UNMOVED (1dbff28caca2 / aebc8101d6df / d84bcbf0c481, before and after) is the
   *  load-bearing half, and it is true by construction: `recordTourChampion` reads
   *  `result.finishes`, a table the bracket has already filled in, and writes an integer. There is no
   *  draw on MAIN and none on any sub-stream. **So the frozen MAIN capture is NOT re-pinned – count
   *  41550, hash e6b0c709 – and `tests/condition.test.ts` was re-run green beside this re-freeze.**
   *
   *  `PRE_V65` below is the byte-level half of the same proof rather than a claim about it:
   *  `careerHashAtSchema(…, 64)` drops the one appended key and rolls the number back, and all three v64
   *  constants come back byte for byte – and `careerHashAtSchema(…, 63)` still reproduces the v63 ones
   *  underneath it, so the ladder has TWO working rungs below this one rather than one.
   *
   *  ⚠⚠ AND THE NUMBER THIS BLOCK NAMES IS 65 BECAUSE OF A COLLISION, NOT A COUNT. The wave shipped
   *  as v64 on its own branch, cut from round 28's ledger while that branch still read 63 – and
   *  `main` had meanwhile taken 64 for round 27 #6's call-up reveal. Two different v64 schemas, each
   *  a correct three-part move against the only chain it could see, and a save written by either
   *  unreadable by the other. The renumber moved all three parts together: the constant, the
   *  migration's PLACE in the append-only chain (it runs at `v === 64`, after the reveal), and the
   *  golden fixture – `v65.json`, with college's `v64.json` untouched beside it. */
  middleGrinder: 'fccff4a6b7f9d084e6be292fa22837b6d0178c8acc30dea1e370be8c9bcaaa69',  /** PRESETS[8] · 120k wealthy family, elite coach · grinder policy (never travels)
   *
   *  ⭐⭐ RE-FROZEN FOR ROUND 28 #17-b (28.08) – AND ALONE, WHICH IS THE FINDING, exactly as the
   *  16.08 re-freeze below was alone for its own reason. The owner's ruling put a kit letter's
   *  deadline back on the LETTER, and `Offer.deadlineWeek` is persisted state, so a career that was
   *  written to had to move. **Only this one was.** `middleGrinder` above and `selfTravelling` below
   *  are UNCHANGED: the 25k career's letters all land on the window's OPENING week, where `week + 4`
   *  and `sponsorWindowClosesAt` are the same number, and the 8k self-coached career clears no rung
   *  and is never written to at all.
   *
   *  ⚠ PER-KEY DIFF TAKEN FIRST, as this file's protocol demands: `tools/frozen-key-diff.ts
   *  --preset 8 --policy 0` on both trees with the ruling toggled on one line. **ONE key of 71
   *  differs, and it is `offers`.** `rngMain`, `results`, `season`, `cohort`, `events`, `fundsCents`,
   *  `kidRank`, `skills` – every one byte-identical. Inside `offers` it is ONE letter: `kit-152`,
   *  which arrived on window week 48, deadline 155 → 156, and is therefore still OPEN at the 156-week
   *  horizon instead of expired. That is the defect the ruling closes, caught by a fixture that was
   *  never written to look for it.
   *
   *  `PRE_R28B` + `careerHashUnderTheWindowRule` are the byte-level half of the same proof, and the
   *  frozen MAIN capture is NOT re-pinned – the ruling adds no draw on any stream.
   *
   *  ⭐⭐ AND MOVED ONCE MORE BY THE MERGE ITSELF (28.08), BY THE VERSION NUMBER ALONE – which makes
   *  this the one career of the three carrying BOTH of the day's re-freezes, and its constant matches
   *  NEITHER SIDE. `origin/main` never saw the ruling (`0116627527eb…` there); this branch never saw
   *  v64 (`32086f46…` here before the merge); the merged value is a third number that only this tree
   *  produces. Both halves are pinned rather than argued: `PRE_V64.eliteGrinder` rolls ONLY the
   *  version back to 63 and returns the pre-merge `32086f46…`, and `PRE_R28B.eliteGrinder` puts the
   *  window rule back and returns `origin/main`'s `0116627527eb…`. See the merge paragraph on
   *  `middleGrinder` for the control, the headers and the per-key verdict.
   *
   *  ⭐⭐ AND MOVED A THIRD TIME BY v65 (28.08, the champion tally), WITH BOTH ITS TWINS AND BY THE ONE
   *  APPENDED KEY – see the block on `middleGrinder`. `PRE_V65.eliteGrinder` is the byte-level half:
   *  drop `fieldSeasonTitles`, roll the number back to 64, and the merge value above comes back. So
   *  this career carries all three of the day's moves and its constant matches no branch that exists,
   *  which is what a renumbered collision looks like from inside a fixture.
   *
   *  ⭐⭐⭐ AND MOVED AGAIN – ALONE, AND **SOMEONE APPEARED IN HER LIFE** (11.09, the private life's
   *  wave 3 T3/T5: the arrival hazard). This is the answer the v74 rung's own note said would come:
   *  «T1 ships the list ... and NO WRITER AT ALL; `rollArrival` lands in T3. ... The step that adds
   *  the writer will answer the other question here, by reproducing or by not.» IT DOES NOT
   *  REPRODUCE, and that is the correct answer rather than a defect – the hazard opens at sixteen
   *  (ruled 23.08), these careers walk 156 weeks, and this girl turns sixteen at about week 128. She
   *  has ~28 eligible weeks and she is FIERY, the ×1.6 row of who-she-is §4's table – the likeliest
   *  girl in the game to meet somebody.
   *
   *  ⚠ PER-KEY DIFF TAKEN FIRST, as this file's protocol demands, and the control was **MY OWN
   *  CHANGE REVERTED IN PLACE** – the single call site `rollArrival(world)` in
   *  `world/phaseHerWeek.ts` commented out, which is the whole of the behavioural change – rather
   *  than the previous commit. A worktree was not available for this step (the brief forbids one),
   *  and in place is the same control here: nothing else was uncommitted and no other agent was
   *  working. `tools/frozen-key-diff.ts` on all three careers, 156 weeks:
   *
   *    · 5/0 (25k middle, grinder)              – **0 keys. Byte-identical.** `loveEpisodes` stayed
   *      `4f53cda18c2b`, which is the hash of `[]`.
   *    · 0/1 (8k working, self-coached, PLAYER)  – **0 keys. Byte-identical.** `loveEpisodes` `[]`.
   *    · 8/0 (120k wealthy, elite, grinder)      – **EXACTLY 1 KEY OF 79, and it is `loveEpisodes`**
   *      (`4f53cda18c2b` -> `f7c55b26eeff`). Every other key – `rngMain`, `results`, `events`, the
   *      wallet, the body, the skills, `condition`, `bond`, `spirit` – byte-identical.
   *
   *  ⚠⚠ THE ROW ITSELF, PRINTED RATHER THAN INFERRED, because «one key moved» only reassures if what
   *  is in it is the thing the step claims to write:
   *
   *      [{ id: 'p:137', sinceWeek: 137, endedWeek: null, knownWeek: 139, wants: 'open',
   *         partnerId: 'p:137' }]
   *
   *  One arrival, week 137, `endedWeek` null (wave 3 never writes an ending), a two-week disclosure
   *  lag – her bond is 50 by then, which is `strained`, so the shave divides by 1 and the raw draw
   *  was 2. Open register, open wants. Nothing invented and nobody named.
   *
   *  ⚠⚠ AND `rngMain` IS BYTE-IDENTICAL, which is the load-bearing half: `rollArrival` takes no
   *  `Rng` and pulls only from `seed:life:arrival:<week>` and the two `seed:life:partner:*` keys.
   *  The frozen MAIN capture is unmoved and NOT re-pinned – 41550 / e6b0c709, green on this tree.
   *
   *  ⚠ EVERY ROLLBACK IDENTITY BELOW STILL HOLDS, `PRE_V74`'s included: peeling `loveEpisodes` and
   *  rolling the number back to 73 reproduces the v73 hashes on all three careers, because the peel
   *  drops the key whatever is in it and nothing else in the world moved. Only the three LIVE hashes
   *  for THIS career move – `FROZEN`, `PRE_R28B` and `PRE_NAME_VERA` – and not one `middleGrinder`
   *  or `selfTravelling` value in this file is touched. Every new value was computed by RUNNING the
   *  exported helpers (`careerHash`, `careerHashUnderTheWindowRule`, `careerHashUnderTheOldName`),
   *  never transcribed from a failure message.
   *
   *  ⭐⭐⭐ AND MOVED ONCE MORE, THE SAME DAY, BY THE OTHER HALF OF THE SAME LAYER – **SHE IS LIFTED**
   *  (11.09, wave 3's T4: the attachment lift). The paragraph above ends «only the three LIVE hashes
   *  move»; this step moves FIVE, and the two extra ones are the schema-rollback rungs `PRE_V74` and
   *  `PRE_V73`. ⚠⚠ THAT DIFFERENCE IS THE WHOLE CHARACTER OF THE STEP AND NOT AN ESCALATION: T3 wrote
   *  a NEW key and peeling the key undid it, so both rungs stayed green; T4 changes the VALUE of an
   *  old one. `accrueSpirit`'s weekly return walks toward `baseline + attachmentLift` (75) instead of
   *  a flat 70 while `activeEpisode` returns a row, and `spirit` arrived at v72 – so the v73 and v74
   *  shapes still contain it and no peel can un-move it. Those two rungs going red beside a red
   *  freeze is precisely what their own «IF THIS GOES RED BESIDE A RED FREEZE, the wave moved a
   *  career and not just a schema» exists to say.
   *
   *  ⚠ PER-KEY DIFF TAKEN FIRST, control = MY OWN CHANGE REVERTED IN PLACE (the lift term alone
   *  neutralised). 5/0 and 0/1 BYTE-IDENTICAL on every key – they meet nobody. 8/0 moves **EXACTLY
   *  ONE KEY OF SEVENTY-NINE, `spirit`** (`ff5a1ae012af` -> `f369cb89fc62`). ⚠⚠ `results`, `events`,
   *  `rngMain` and the wallet are IDENTICAL, and that is the load-bearing half: `spiritMatchFactor`
   *  is flat 1.0 from the knee (60) up, so a lifted 75 plays the same tennis a baseline 70 does and
   *  the lift cannot have decided a match. Her trail, control -> lifted, from the arrival week:
   *
   *      control  136:70  137:70  138:70  139:70 … 156:70
   *      lifted   136:70  137:73  138:75  139:75 … 156:75
   *
   *  She is FIERY – intense, 3/wk – and the FIRST STEP LANDS IN WEEK 137, the arrival's own week,
   *  which is T4's order pin reproduced on a frozen career. Two steps and she holds: a moved target,
   *  never a bump. ⚠ `PRE_V72` and every rung below it are UNTOUCHED and still reproduce, because
   *  `careerHashAtSchema(…, 71)` peels `spirit` itself – the career as it stood before the private
   *  life existed is byte-identical, `results` and `rngMain` included. */
  eliteGrinder: 'aff3bf0b9366c7744ce6b9cbf0a43a52015fcdb84072fa0d31aebf7e5ac3e1a3',  /** PRESETS[0] · 8k working family, SELF-COACHED · player policy (switch on, nobody to send)
   *
   *  ⭐⭐ RE-FROZEN A FIFTH TIME (16.08) – AND ALONE, WHICH IS THE FINDING. The owner's correction of
   *  that afternoon made the Junior Accelerator a reserved place instead of a ceiling, so a junior
   *  enters a W rung on its own acceptance cut. The two GRINDER careers above did not move a bit; only
   *  the player arm did.
   *
   *  ⚠ AND THE PER-KEY DIFF SAYS SHE DID NOT ENTER ONE DIFFERENT EVENT (`tools/frozen-key-diff.ts`,
   *  the protocol this file demands, run against 3fc17ab). UNMOVED: `entries`, `seasonEntries`,
   *  `internationalEntryWeeks`, `proEntryWeeks`, `season`, `skills`, `potential`, `plan` – and
   *  `rngMain`, for the fifth wave running. MOVED: `results`, `kidRankWta`, `bestFinishByTier`,
   *  `events`, `fundsCents`, `careerTotals`, `trophiesByTier`, `academy`, `milestones`, `offers`.
   *
   *  So the change reached her through the COHORT and not through her own calendar: `proDoors` is
   *  "the kid's rule, line for line" by design, so the AI on-ramp reads the same corrected door, the
   *  fields she met are different fields, and her results moved with them. A career that never
   *  reached W35 in the first place could not have been freed by the correction, and was not.
   *
   *  ⚠ `rngMain` UNMOVED IS THE LOAD-BEARING HALF: an access rule is a post-draw gate, so the frozen
   *  MAIN capture in tests/condition.test.ts is untouched (count 41550, hash e6b0c709).
   *
   *  ⭐⭐ RE-FROZEN A SIXTH TIME (16.08) – AND ALONE AGAIN, WHICH IS THE SAME FINDING TWICE. The two
   *  grinder careers above are byte-identical across the acceptance-inversion fix; only this one
   *  moved, and the per-key block above has the receipt: ONE J60 became ONE J300 on the same week,
   *  and her ITF rank at 16.6 went #46 -> #21 on it.
   *
   *  ⭐⭐ RE-FROZEN A SEVENTH TIME (17.08, round 21 #4 – `TierDef.acceptsFromRank`), AND THIS TIME ALL
   *  THREE MOVED AND ALL THREE MOVED ON ONE KEY. `tools/frozen-key-diff.ts` was run on both trees –
   *  the protocol this file demands, `0d35f3d` against `6f64b01`, all three presets – and the diff is
   *  **one line of sixty-three, in every career: `events`.**
   *
   *  ⚠ UNMOVED, AND THIS IS THE LIST THAT MATTERS: `results`, `entries`, `seasonEntries`, `skills`,
   *  `potential`, `kidRankWta`, `bestFinishByTier`, `fundsCents`, `careerTotals`, `trophiesByTier`,
   *  `season`, `plan`, `offers`, `milestones` – and `rngMain`, for the seventh wave running.
   *  **NOT ONE OF THESE THREE CAREERS PLAYED A DIFFERENT MATCH.**
   *
   *  ⭐ WHY, AND IT IS CHECKED RATHER THAN ASSUMED: the freeze is 156 weeks, which ends at age 16.6,
   *  and `tools/ladder-baseline.ts` §3 measures **0.0 WTA 250 entries a year before age 17**. The
   *  rung this wave changed is one none of them has reached. What moved is the WORLD'S NEWS about it:
   *  the canonical `seed:aitour:` bracket of every WTA 250 now draws a different field, so a different
   *  professional wins it, so the feed item announcing her is a different item. Her career is
   *  untouched; the tour she reads about is not.
   *
   *  ⚠ `rngMain` UNMOVED IS AGAIN THE LOAD-BEARING HALF. `selectEntrants` spends its draws on the
   *  event-scoped `seed:aitour:` / `seed:kidtour:` sub-streams and never on MAIN, so the frozen MAIN
   *  capture in tests/condition.test.ts is untouched BY CONSTRUCTION – count 41550, hash e6b0c709 –
   *  and it is verified below rather than promised. */
  /** ⭐⭐ RE-FROZEN AN EIGHTH TIME (17.08, round 21 #2b – docs/specs/the-wild-cards-2026-08.md), AND
   *  ONLY THIS ONE OF THE THREE. The two grinder hashes above are untouched, which is this file's
   *  own signature for "a change that reached one career of three" and is the whole reason it holds
   *  three careers instead of one.
   *
   *  ⚠ PER-KEY DIFF TAKEN FIRST, as this file's protocol demands (`tools/frozen-key-diff.ts`, preset
   *  0 policy 1 – which IS this career). What moved: `results`, `events`, `entries`, `seasonEntries`,
   *  `seasonHistory`, `kidRank*`, `skills`, `condition`, `fundsCents`, `academy`, `knockHistory`,
   *  `injuryHistory`, `trophiesByTier`, `bestFinishByTier`. So unlike the last three re-freezes this
   *  one is NOT a schema field – **this career really did play a different season**, and the two
   *  rollback identities below move with it rather than reproducing the old values.
   *
   *  ⚠⚠ AND THE ATTRIBUTION WAS TAKEN RATHER THAN ASSUMED, because another agent was committing into
   *  this branch throughout. The A arm was built as **5737c40 with the engine commit fd66d52 reverted**
   *  – i.e. the wild card removed and everything else, that agent's college work included, held
   *  identical – and it reproduces **all three shipped constants byte for byte**, at all three schema
   *  versions. So 100% of this movement is the wild cards and none of it is theirs. Naming the arms as
   *  "before and after HEAD" would have credited this file with somebody else's change; measured that
   *  way first, it did.
   *
   *  ⭐ WHY THIS CAREER AND NOT THE OTHER TWO, and it is the shape of the mechanic rather than luck.
   *  The eight held places change who is in a **Slam** draw. A Slam draw is almost entirely derived
   *  professionals, and `runAiTournament` writes NO ledger row for a field pro – so a changed Slam
   *  usually changes nothing that any table can read. It bites only when a LIVE cohort player is in
   *  the draw, and then the merged W standings move, and then the fields of her own shadow draws move.
   *  That reached the player-policy career and not the two grinders.
   *
   *  ⚠ `rngMain` UNMOVED, for the eighth wave running, and it is again the load-bearing half. The
   *  wild-card pass draws on `seed:wildcard:<eventId>` and the host nation on `seed:host:<eventId>` –
   *  purpose-scoped sub-streams, re-derived at the call site, persisting nothing. The frozen MAIN
   *  capture in tests/condition.test.ts is untouched BY CONSTRUCTION – count 41550, hash e6b0c709 –
   *  and it is verified below rather than promised. */
  /** ⭐⭐ RE-FROZEN A NINTH TIME (17.08 – `wta500.acceptsFromRank = 50`, the owner's «давай 50»), AND
   *  IT IS THE SEVENTH RE-FREEZE'S FINDING REPEATING EXACTLY: all three moved, all three on ONE KEY,
   *  and the key is `events`.
   *
   *  ⚠ PER-KEY DIFF TAKEN FIRST, as this file's protocol demands (`tools/frozen-key-diff.ts`, all
   *  three presets). ⚠ AND THE CONTROL IS THIS CHANGE REVERTED, NOT THE PREVIOUS COMMIT – CLAUDE.md's
   *  shared-checkout rule – so the A arm is this very tree with the single `acceptsFromRank: 50` line
   *  removed and everything else, the second-seat work included, held identical.
   *
   *  **MOVED: `events`. UNMOVED, 62 keys of 63:** `results`, `entries`, `seasonEntries`, `season`,
   *  `skills`, `potential`, `kidRankWta`, `bestFinishByTier`, `fundsCents`, `careerTotals`,
   *  `trophiesByTier`, `plan`, `offers`, `milestones` – and `rngMain`, for the ninth wave running.
   *  **NOT ONE OF THESE THREE CAREERS PLAYED A DIFFERENT MATCH.**
   *
   *  ⭐ WHY, and it is the same argument as the seventh with one rung's name changed: the freeze ends
   *  at age 16.6 and none of these careers has ever entered a WTA 500 – `acceptsRank` is 120 and only
   *  6 of 54 measured careers ever clear it, let alone by sixteen. What moved is the WORLD'S NEWS: the
   *  canonical `seed:aitour:` bracket of every WTA 500 now draws from #50-120 instead of from the top
   *  of its band, so a different professional wins it, so the feed item announcing her is a different
   *  item. Their careers are untouched; the tour they read about is not.
   *
   *  ⚠ `rngMain` UNMOVED IS THE LOAD-BEARING HALF, again by construction rather than by luck:
   *  `selectEntrants` spends its draws on the event-scoped `seed:aitour:` / `seed:kidtour:`
   *  sub-streams and never on MAIN, so the frozen MAIN capture in tests/condition.test.ts is untouched
   *  – count 41550, hash e6b0c709 – and it is verified below rather than promised.
   *
   *  ⚠ AND ALL THREE MOVED THIS TIME, WHICH IS ITSELF THE SIGNAL. A change to a rung nobody has
   *  reached should reach all three careers equally through the feed, and it did – unlike the fifth,
   *  sixth and eighth re-freezes, which moved this career alone because they changed what SHE could
   *  enter. Three of three means "the world", one of three means "her". */
  /** ⭐⭐ RE-FROZEN A TENTH TIME (18.08 – the DATE CLOCK), AND THIS ONE IS NOTHING LIKE THE NINE BEFORE
   *  IT. Every previous re-freeze moved ONE key of sixty-three and the careers were byte-identical
   *  underneath; this one moves TWENTY-SEVEN, `results`, `skills`, `condition`, `fundsCents`,
   *  `kidRank` and `trophiesByTier` among them. **These three careers really did play different
   *  seasons**, and that is the change working rather than leaking.
   *
   *  ⚠ PER-KEY DIFF TAKEN FIRST, as this file's protocol demands, with the control built as THIS tree
   *  with the clock reverted (`git stash` of age.ts / dates.ts / endings.ts / migrations.ts) rather
   *  than as an older commit - CLAUDE.md's shared-checkout rule.
   *
   *  ⚠ UNMOVED, AND THE LIST IS THE ARGUMENT: `rngMain` (tenth wave running), `season`, `profile`,
   *  `potential`. Same world, same calendar, same dice, same ceiling - so nothing about the SIMULATION
   *  moved. What moved is which weeks her age gates opened on: `kidAgeExact` now turns on her birth
   *  DATE instead of the first Monday of her birth month, and measured across all 365 dates that is
   *  1-5 weeks LATER at every gate, never earlier. Different weeks eligible -> different events
   *  entered -> different results, money and development.
   *
   *  ⚠ `rngMain` UNMOVED IS AGAIN THE LOAD-BEARING HALF, and here it is doing more work than usual: a
   *  change that moves `results` COULD have moved the stream, and did not, because the age clock is a
   *  post-draw gate exactly like the acceptance rules before it. The frozen MAIN capture in
   *  tests/condition.test.ts is untouched - count 41550, hash e6b0c709 - and verified below. */
  /** ⭐⭐ RE-FROZEN AN ELEVENTH TIME (18.08 – `power()` over EVERY skill), AND THE NEW KEY IN THE DIFF
   *  NAMES THE CAUSE: **`cohort`**. Ten previous re-freezes never moved it; this one does, because
   *  `power()` is what `driftCohort`'s conveyor SORTS BY, and widening it from four attributes to five
   *  re-ranks all 199 rivals. Everything downstream - who she meets, what she wins - follows from that.
   *
   *  ⚠ PER-KEY DIFF FIRST, control = this tree with `power()` reverted to four attributes. 25-32 keys
   *  of 63 moved per career; UNMOVED in all three: `rngMain` (eleventh wave), `season`, `profile`,
   *  `potential`. Same world, same calendar, same dice, same ceilings.
   *
   *  ⚠⚠ AND THE FIRST TWO ATTEMPTS AT THIS MEASUREMENT WERE GARBAGE, WHICH IS WHY THE HEADERS ARE NOW
   *  CHECKED. One capture ran from the wrong directory and wrote a module-not-found stack trace into
   *  the arm file; the other bound its loop variables wrongly, so a file named for preset 5 carried
   *  `# preset 0 policy 1` in its own header. Both would have re-frozen these constants off a diff of
   *  two unrelated careers. `tools/frozen-key-diff.ts` prints that header for exactly this reason -
   *  read it, and check it against the filename, before believing any diff built from it.
   *
   *  ⚠ `rngMain` UNMOVED IS THE LOAD-BEARING HALF and it is doing real work here: `power()` is read by
   *  the conveyor's SORT, which is a post-draw ordering, so no draw moved. The frozen MAIN capture in
   *  tests/condition.test.ts is untouched - count 41550, hash e6b0c709 - and verified below. */
  /** ⭐⭐ AND MOVED AGAIN THE SAME DAY (21.08, round 24 #1 – the tick raises the academy's letters),
   *  BY ONE KEY AND ON TWO CAREERS OF THREE. This is a CONTENT move, not a schema one, and the split
   *  is the evidence: `eliteGrinder` is byte-identical here and in all four `PRE_*` sets below,
   *  because the 120k family never qualifies for a scholarship and so never receives a letter. The
   *  two that moved are the ones that do – measured, not inferred: `middleGrinder` (middle
   *  background) carries academy level 0.354 and three letters, `selfTravelling` (working background)
   *  carries 0.721 and three. The need factor is visible in which hashes moved.
   *
   *  ⚠ PER-KEY DIFF TAKEN FIRST, control = **this branch with my own commit reverted** in a detached
   *  worktree – not the previous commit, which carried two other agents' waves. All three arms
   *  (preset/policy 5/0, 8/0, 0/1), headers checked against the filenames: **exactly one key of 66
   *  differs and it is `offers`.** `rngMain`, `results`, `season`, `cohort`, `events`, `fundsCents`,
   *  `kidRank`, `skills` – every one byte-identical, on every arm.
   *
   *  ⚠⚠ SO THE `PRE_*` SETS ARE RE-TAKEN AGAINST THE NEW WORLD, on this file's own recorded
   *  precedent for a career-content wave (see the v52 block: *"this wave changed the CAREER, not a
   *  schema field, so PRE_V52/PRE_V51/PRE_V50 are re-taken against the new world"*). Rolling
   *  `schemaVersion` back on the OLD worlds cannot reproduce the new ones – a data key moved, not a
   *  version number – but the rollback IDENTITY keeps its meaning unchanged: swapping only
   *  `schemaVersion` on the new world still reproduces exactly these, which is all those lines ever
   *  claimed.
   *
   *  ⚠ `rngMain` UNMOVED IS AGAIN THE LOAD-BEARING HALF: raising a letter is arithmetic and one
   *  idempotent push, and the frozen MAIN capture is untouched – count 41550, hash e6b0c709. */
  /** ⚠ MOVED WITH `middleGrinder` AND WITHOUT `eliteGrinder` (21.08, round 24 #1). See the paragraph
   *  above: one key of 66 – `offers` – and this career is the one on the largest scholarship of the
   *  three. `PRE_V55` reproduces this exact value by rolling only `schemaVersion` back to 54. */
  /** ⚠ MOVED WITH BOTH TWINS (22.08, the college birthday, v57) by the version number alone – see
   *  the paragraph on `middleGrinder`, and `PRE_V57` below for the identity. */
  /** ⚠ MOVED WITH ITS TWINS a fourth time (22.08, round 24 #5, schema v58) – see the paragraph on
   *  `middleGrinder`, and `PRE_V58` below for the identity. */
  /** ⭐⭐ RE-FROZEN – ALONE OF THE THREE – FOR THE 22.08 RULINGS WAVE (recovery variant C, the
   *  dial's +1/+2/+3, per-match tour pricing, the return-week session, the team's prize shares),
   *  and the SPLIT IS THE ATTRIBUTION: the two grinder hashes are byte-identical across the whole
   *  wave, because week 156 ends at age 16.6 and neither grinder career has a counting W-series
   *  result – so `activeLadderOf` never says 'wta' for them and every one of the five changes is
   *  gated behind that door, a hire (none exists), or a wta cheque (none is won). This career –
   *  the 8k player-policy one – IS on the professional ladder inside the freeze, and variant C's
   *  base-5 pro weeks really did change the seasons it played.
   *
   *  ⚠ PER-KEY DIFF TAKEN FIRST, as this file demands: `tools/frozen-key-diff.ts` on both trees,
   *  control = a detached worktree at `53146b7` (this branch with every commit of the wave
   *  reverted – the agent was alone on the branch, so the branch base IS "my own change
   *  reverted"). Null-arm checked both ways (the 17.08 hazard): `grep -rl proPhaseRecoveryBase|
   *  staffPrizeShareCents|masseurTourWeekCents|masseurReturnDue` = 0 files in A's src, and B
   *  carries each constant plus its readers. All three arms, headers checked against the
   *  invocations – ⚠ and the check caught a THIRD zsh word-split (a `set -- $arm` loop fed every
   *  run `preset 0 policy 1`); those captures were thrown away and re-taken with explicit flags.
   *
   *  THE VERDICT: grinder arms **0 keys of 69 moved**. Player arm **25 value keys moved** –
   *  `condition`, `results`, `events`, `fundsCents`, `skills`, `kidRankWta`, `seasonHistory`,
   *  `careerTotals`, `trophiesByTier`, `bestFinishByTier`, `knock`, `academy`, `offers`,
   *  `milestones`, `financeWeeks`, `internationalEntryWeeks`, `proEntryWeeks`,
   *  `medicalWithdrawalWeek`, `lastSeasonSummary`, `nextEventId`, `prevKidRank`, `prevKidRankWta`,
   *  `seasonRecord`, `seasonStartRank`, `seasonWins` – a career that genuinely played different
   *  professional weeks on base 5. UNMOVED, and the list is the argument: **`rngMain`**
   *  (seventeenth wave running – nothing here draws), **`schemaVersion`** (59 both sides – the
   *  share mechanic persists NOTHING, verified rather than promised), `entries`, `seasonEntries`,
   *  `season`, `cohort`, `profile`, `potential`, `injury`, `injuryHistory`, `kidFundsCents`
   *  (under 18 at week 156), `coachId` (null – so ZERO share rows on this arm by the self-coached
   *  rule), and all three masseur keys on their defaults. Same calendar, same entries, same dice –
   *  what changed is how tired a professional week leaves her, which is exactly the ruling.
   *
   *  ⚠ THE `PRE_*` selfTravelling IDENTITIES ARE RE-TAKEN against the new world (the file's own
   *  precedent for a career-content wave – the v50/wild-cards paragraph): a data wave cannot be
   *  rolled back by a version number, but swapping ONLY `schemaVersion` on the new world still
   *  reproduces each, which is all those lines ever claimed. The frozen MAIN capture
   *  (41550 / e6b0c709) is untouched and was re-run green beside this re-freeze. */
  /** ⚠ MOVED WITH BOTH TWINS, TWICE OVER, AND THIS NUMBER IS THE MERGE'S OWN (27.08). The
   *  retirement hazard's condition curve moved the career and round 27 #6's v64 moved the schema
   *  number; this tree is the first to carry both, so the value is neither side's – see the two
   *  stacked paragraphs on `middleGrinder` for the control and the per-key verdict. `PRE_V64` rolls
   *  ONLY the version back and reproduces origin/main's post-retirement 8d6b056f… byte for byte,
   *  which is what makes this a version bump on a moved career rather than a second career move.
   *
   *  ⚠ AND MOVED A THIRD TIME BY v65 (28.08), with both twins and by the one appended key – the
   *  champion tally fills itself in every career, this one included. `PRE_V65` rolls it back to 64
   *  and reproduces the merge value; `PRE_V64` rolls it back to 63 and reproduces `8d6b056f…`.
   *
   *  ⚠ AND A FOURTH TIME BY v66 (29.08), with both twins and by `schemaVersion` ALONE – see the
   *  block over `FROZEN`. `PRE_V66` rolls only the number back and reproduces the v65 value.
   *
   *  ⚠ AND MOVED AGAIN BY v68 (31.08, ROUND 31 #10/#13 – the per-career age curve), with both twins
   *  and by `schemaVersion` ALONE. `PRE_V68` rolls only the number back and reproduces the v67 value.
   *  The per-key diff was taken FIRST, as this file's protocol demands, against this branch's own base
   *  (`r31d/wave-reconcile`) in a separate worktree: `npx vite-node tools/frozen-key-diff.ts --preset 0
   *  --policy 1` differs on **ONE key of sixty-one, `schemaVersion`**. `cohort`, `skills`, `results`,
   *  `rngMain`, `events`, `fundsCents` – every one byte-identical. The wave writes `ageCurve` when the
   *  fork at nineteen is answered and gives the cohort a derived (never stored) decline spread, and a
   *  frozen career is 156 weeks old: she is 16.6 and no rival is over 22, so neither reader is
   *  reachable. That is the claim, and this is its measurement rather than its assertion. */
  selfTravelling: 'c8d0bb8832aa9f897db52632ec5a34d6cd8588194dd846411b0de5c0b850e973',}

/** ⭐⭐ THE SAME THREE CAREERS AS THEY HASHED UNDER v66 – the identity that proves the v67 re-freeze
 *  moved the VERSION NUMBER and nothing else, in the exact sense v49 set and v66 repeated: the
 *  narrowest legitimate re-freeze this file recognises.
 *
 *  ⚠ v67 APPENDS NO WORLD KEY EITHER, and for a reason one layer further in than v66's. It writes
 *  `units` and `name` onto ROWS OF `assets` – fields inside an array element, not keys of the world –
 *  and `walkFrozenCareer` asserts that array is EMPTY on all three careers (the v63 note), so there
 *  is no row for either back-fill to reach. No bench policy buys anything from the shelf. So
 *  `careerHashAtSchema(…, 66)` – the same serialisation with one number changed, no key peeled –
 *  reproduces all three v66 constants byte for byte, and these ARE those constants, verbatim.
 *
 *  ⭐ AND THIS ONE HAD A SECOND REASON TO BE ZERO WORTH STATING SEPARATELY: v67 is a RENUMBER. Its
 *  two steps are the v66 step's own former contents, moved without a character changed, so «nothing
 *  moved» is what the change means rather than what it was hoped to do. The per-key diff over
 *  `FROZEN` is the independent half of the same finding. */
/** ⭐⭐⭐ THE SAME THREE CAREERS AS THEY HASHED UNDER v68 – the identity that proves the v69 re-freeze
 *  moved the VERSION NUMBER and nothing else, in the exact sense v49 set and v66 / v67 / v68 repeated:
 *  the narrowest legitimate re-freeze this file recognises.
 *
 *  ⚠⚠ v69 APPENDS A WORLD KEY – `brandStrengthSeed`, the brand's slow stock pinned at the week it
 *  arrived (round 32 #4) – AND NO CAREER IN THIS FILE CAN EVER CARRY IT, which is a STRONGER statement
 *  than v68's and not merely a repeat of it. v68's `ageCurve` is absent from these careers because
 *  they stop at week 156, before the fork that writes it; this key is absent because THE ONLY WRITER
 *  IS THE v68 -> v69 MIGRATION. `createWorld` does not write it, no phase of the weekly tick writes
 *  it, and `walkFrozenCareer` builds a live career and never migrates one – so the peel
 *  `careerHashAtSchema` performs is provably a no-op here today and for every future wave that keeps
 *  the writer where it is. That is a design choice and not an accident: a stock written weekly WOULD
 *  have landed on `selfTravelling` (her fame is 2.55 at week 156, first positive at week 122,
 *  measured), moved a second key, and made this re-freeze the owner's call rather than a renumber.
 *
 *  ⭐ MEASURED BEFORE THE CONSTANTS WERE TOUCHED, as this file's protocol demands, and against the
 *  branch's own base in a separate worktree (`r32b/brand-multiple`, the commit this branch forked
 *  from). `tools/frozen-key-diff.ts` on all three careers:
 *
 *    · 5/0 (25k middle, grinder)          – **1 key of 72: `schemaVersion`.**
 *    · 8/0 (120k wealthy, elite, grinder) – **1 key of 72: `schemaVersion`.**
 *    · 0/1 (8k working, self-coached, PLAYER) – **1 key of 72: `schemaVersion`.**
 *
 *  ⚠⚠ AND `rngMain` IS BYTE-IDENTICAL ON ALL THREE, which is the load-bearing half. Neither round 32
 *  #4 nor #5 takes a draw on any stream: fame and brand strength are folds over dated records the
 *  career already keeps, `world/brandStrength.ts` has no `Rng` argument and no clock, and the v69
 *  migration reads `fameAt` and writes two numbers. The frozen MAIN capture in tests/condition.test.ts
 *  is untouched – count 41550, hash e6b0c709 – and needs no re-pin. `offers` is byte-identical too,
 *  which is the independent confirmation that #5 changed how a signed letter is READ and not whether
 *  one is written. */
/** ⭐⭐⭐ THE SAME THREE CAREERS AS THEY HASHED UNDER v73 – the identity the v74 re-freeze rests on,
 *  and the wave-2 pattern (`PRE_V73` directly below) repeated one version up. These three values are
 *  the VERBATIM v73 `FROZEN` constants, character for character, and they are reproduced here by
 *  peeling exactly the ONE key v74 appended (`loveEpisodes`) and rolling the number back – so
 *  «nothing but that key moved» is an identity over the whole serialisation rather than a claim about
 *  a diff.
 *
 *  ⚠ THE PEEL REMOVES A KEY AND NEVER A ROW, for a reason one notch stronger than v73's below: T1
 *  ships the LIST, the migration and the derived selector, and **no writer at all**. `rollArrival`
 *  arrives in T3. So `loveEpisodes` is `[]` on every career in this file not because the walk is too
 *  short to reach a hazard but because there is nothing in the tree that could append a row – which
 *  is also why this rung says nothing yet about whether an attachment inside 156 weeks would move
 *  these hashes. The wave that adds the writer answers that, by reproducing here or not.
 *
 *  ⚠⚠ THE FROZEN MAIN CAPTURE IS UNMOVED AND NOT RE-PINNED: 41550 draws / hash `e6b0c709`,
 *  tests/condition.test.ts, green on this tree. It held BY CONSTRUCTION – this step takes no draw on
 *  any stream at all: `createWorld` writes a literal `[]` and the migration writes a literal `[]`.
 *
 *  ⚠⚠ RE-STAMPED 11.09 BY WAVE 3's T4 – `eliteGrinder` ALONE – AND THE SENTENCE ABOVE ABOUT «THE
 *  VERBATIM v73 `FROZEN` CONSTANTS» NO LONGER HOLDS FOR HER. It still holds, character for character,
 *  for `middleGrinder` and `selfTravelling`: they meet nobody inside 156 weeks and every byte of both
 *  is untouched. She does. T4 makes `accrueSpirit`'s return walk toward `baseline + attachmentLift`
 *  while someone is there, and `spirit` is a v72 key – so it is INSIDE the v73 shape this rung rolls
 *  back to, and peeling `loveEpisodes` cannot undo a value that the remaining shape still carries.
 *
 *  ⚠⚠ SO THIS RUNG DID EXACTLY WHAT IT WAS BUILT TO DO, and the re-stamp is the honest answer rather
 *  than a repair. Its case in tests/coach-travel-edge.test.ts carries the line «IF THIS GOES RED
 *  BESIDE A RED FREEZE, the wave moved a career and not just a schema»; T4 moved a career, on purpose,
 *  and this is what that looks like from inside the ladder. What the rung still proves for all three
 *  is that the PEEL is exact – the v74 key comes off and nothing else does.
 *
 *  ⭐⭐ AND THE CLAIM THAT SURVIVES WHOLE IS `PRE_V72`'s, one rung down: `careerHashAtSchema(…, 71)`
 *  peels `spirit`, `bond` and `temperament` themselves, and it reproduces on all three careers
 *  UNTOUCHED. The career as it stood before the private life existed at all is byte-identical –
 *  `results`, `events`, `rngMain` and the wallet included – which is the strongest statement about
 *  this layer's reach that this file can make, and it is made by a constant nobody had to re-write.
 *
 *  ⚠ Per-key diff first, control = the lift reverted in place: 1 key of 79 on 8/0 (`spirit`), 0 keys
 *  on the other two. Value computed by RUNNING `careerHashAtSchema(8, 0, 73)`. */
export const PRE_V74 = {
  middleGrinder: '94bf9526b0c5dd6e4e3a1913f77f3922c580cf6f7a9efd887d8297a87ed47499',
  eliteGrinder: '18bff5fd2b7dccf44c6218bc839ed7eec1bba39b51e8c81726e31e3c61320e0c',
  selfTravelling: 'ffe9d8f4f5c9c6f15998b664b74434e8d48d2c8bae531865e73b85b13c5cd479',}

/** ⭐⭐⭐ THE SAME THREE CAREERS AS THEY HASHED UNDER v72 – the identity the v73 re-freeze rests on,
 *  and the wave-1 pattern (`PRE_V72` directly below) repeated one version up. These three values are
 *  the VERBATIM v72 `FROZEN` constants, character for character, and they are reproduced here by
 *  peeling exactly the ONE key v73 appended (`lifeLog`) and rolling the number back – so «nothing but
 *  that key moved» is an identity over the whole serialisation rather than a claim about a diff.
 *
 *  ⚠ THE PEEL REMOVES A KEY AND NEVER A ROW, and that is a property of these careers rather than of
 *  the field. The only beat wave 2 raises is the fork's own opinion; the fork opens at week ~241 and
 *  `walkFrozenCareer` stops at 156, so every career here carries `lifeLog: []` and none of them has
 *  lived a beat. A wave that later raises a beat inside 156 weeks will move these hashes for a
 *  reason this rung will name precisely, by no longer reproducing.
 *
 *  ⚠ AND THE MACHINERY IS PROVED HARMLESS TO A CAREER THAT NEVER REACHES IT. `answerFork` gained a
 *  refusal, `advanceRefusal` gained a member and the fork's opening tick gained a draw on
 *  `seed:life:fork:<seasonIndex>` – and NONE of them can be reached before week 241, which is what
 *  this reproducing says about all three. The frozen MAIN capture is unmoved and NOT re-pinned:
 *  41550 / e6b0c709, and the one draw the wave takes is on a purpose-scoped sub-stream.
 *
 *  ⚠⚠ RE-STAMPED 11.09 BY WAVE 3's T4 – `eliteGrinder` ALONE, in step with `PRE_V74` one rung up and
 *  for the identical reason, which is set out in full there and over `FROZEN.eliteGrinder`: the
 *  attachment lift moves `spirit`, `spirit` is a v72 key, and both the v73 and the v74 shapes still
 *  contain it – so no peel at either rung can undo it. The paragraph above predicted the shape of
 *  this exactly («a wave that later raises a beat inside 156 weeks will move these hashes... by no
 *  longer reproducing»); what actually reached her was an ATTACHMENT rather than a beat, and the
 *  mechanism is the same. `middleGrinder` and `selfTravelling` are untouched and still ARE the
 *  verbatim v72 `FROZEN` constants. Value computed by RUNNING `careerHashAtSchema(8, 0, 72)`.
 *  ⭐ `PRE_V72` below is where the peel finally catches it – it drops `spirit` itself – and it
 *  reproduces on all three careers, unchanged. */
export const PRE_V73 = {
  middleGrinder: '6a3341f9dcdb45953c029f0bc17217c44ea09654ed8db14bab30e937dbbb19c2',
  eliteGrinder: 'd359cf19c75bc8f222b04a2bb1907d5118f5636ffdd497f4a85def512195d1f9',
  selfTravelling: '980aa4f13aff1c068dedfcac3ed2647ba4352bb7a8411ffe774efd7c65386370',}

/** ⭐⭐⭐ THE SAME THREE CAREERS AS THEY HASHED UNDER v71 – and this rung is not merely another one in
 *  the ladder, it is THE MEASUREMENT the v72 re-freeze rests on (see the block at the head of this
 *  file). These three values are the VERBATIM v71 `FROZEN` constants, character for character, and
 *  they are reproduced here by peeling exactly the three keys v72 appended and rolling the number
 *  back – so «nothing but those three keys moved» is an identity over the whole serialisation rather
 *  than a claim about a diff report.
 *
 *  ⚠ AND UNLIKE `PRE_V68`/`PRE_V69`, THE PEEL IS NOT A NO-OP HERE. `spirit`, `bond` and
 *  `temperament` are written by `createWorld` itself, every frozen career carries all three from
 *  week 0, and `spirit` moves week by week – so this rung really does remove something, and its
 *  reproducing is a statement about the other seventy-odd keys.
 *
 *  ⚠ IT IS ALSO WHERE THE MATCH SEAM IS PROVED HARMLESS ON THESE CAREERS. `spiritMatchFactor`
 *  multiplies her five wings, so any week below the knee (60) would have changed who won a match and
 *  with it her results, rank, wallet and body – and then no rollback could reproduce anything. It
 *  reproduces exactly, over 156 weeks, on all three.
 *
 *  ⭐⭐⭐ AND THAT IS WHY THIS RUNG IS THE ONE WAVE 3 NEVER MOVED, WHICH IS WORTH SAYING OUT LOUD
 *  (11.09, T4 – the attachment lift). The two rungs ABOVE it were re-stamped for `eliteGrinder`,
 *  because `spirit` survives their peels and the lift changes it. This one drops `spirit` itself, and
 *  it stayed GREEN and byte-identical on all three careers – so the whole of the private life, three
 *  waves of it, has left every key that predates it exactly as it was: `results`, `events`, `rngMain`,
 *  the wallet, the body, the skills, the calendar. ⚠ NOT ONE CONSTANT IN THIS SET WAS RE-WRITTEN and
 *  «untouched» here is a measured property of the T4 pass rather than a promise – the per-key diff
 *  reports `results` byte-identical directly, and the paragraph above is why: the lift moves her
 *  UPWARD from 70 and `spiritMatchFactor` is flat 1.0 from 60 up, so no week of hers changed a match. */
export const PRE_V72 = {
  middleGrinder: '3e355ccc41131adf47f6b1d75bd2b6e26a8f2e63694cdf578f031fdb08d2db79',
  eliteGrinder: '5300631af1682075466657279ae20450d8cf9777fc32c5eb9546b450a5113b33',
  selfTravelling: '5053a03e64f29cb3945329d07fb2da4dbd3ea06f6328f4583b7670aa036ecc4c',}

/** ⭐⭐ THE SAME THREE CAREERS AS THEY HASHED UNDER v70 – the identity that proves the v71 re-freeze
 *  moved the VERSION NUMBER and nothing else, in the exact sense v49 set and v66/v67/v68/v69
 *  repeated: the narrowest legitimate re-freeze this file recognises.
 *
 *  ⚠ v71 DOES ADD A WORLD FIELD – `brandFounded`, round 39 #5's memory of a merch-brand founding –
 *  AND NO FROZEN CAREER CARRIES IT, the v68 `ageCurve` note's own shape one block down: the field is
 *  written by `buyAsset` on a business purchase (no frozen policy buys the shelf) and by the v71
 *  migration only where a merch brand is OWNED, never by `createWorld`. So there is nothing to peel:
 *  a v70 serialisation of this world is exactly this world with the number moved back. */
export const PRE_V71 = {
  middleGrinder: 'f7fb2a409812412555f2f32bc6088ff07a183455679f2579a873d52621785d84',
  eliteGrinder: '0478f910b291f88566f687f665bb24ad66317a89c14c9db89ab288e1e69966bf',
  selfTravelling: 'c2bfb872501c76f2ae3a9476fc82e3fdd5374f42235a0a3eb72aecc16cc29b4f',}

export const PRE_V69 = {
  middleGrinder: '4c0c09e07f39b58b5fbe5afdd6a70cbf2b331b46d171a1e1098fd29163f6971d',
  eliteGrinder: 'b1f15721e314ebb876d5dd0c167d8f51f7eaf65902db6cbb82eb8b7c69bbfd81',
  selfTravelling: '294ebda3db2fa6428cbf24747399e83d51d4749c624e8911ba0af46d4460a5b5',}

/** ⭐⭐ THE SAME THREE CAREERS AS THEY HASHED WHEN THE DEFAULT GIRL WAS CALLED `Vera` – the identity
 *  that proves the 02.09 re-stamp moved HER NAME and nothing else. These are the verbatim v69
 *  constants as they stood at `prologue/wave` cd59f31c, and `careerHashUnderTheOldName` reproduces
 *  all three byte for byte by walking the same career with `kidName: 'Vera'` put back before birth.
 *
 *  ⚠ IT IS NOT A SCHEMA ROLL-BACK, so it is `careerHashUnderTheOldName` and not `careerHashAtSchema`
 *  that reproduces it – the same distinction `PRE_R28B` makes, and for the same reason: what moved
 *  is a VALUE a career carries, not a version number stamped on it. The per-key diff, the two keys
 *  it moved and why the second one is her name being printed are on that function.
 *
 *  ⚠ RE-STAMPED FOR WAVE 3's ARRIVAL HAZARD (11.09) – `eliteGrinder` ALONE, in step with `FROZEN`
 *  and `PRE_R28B`, and the reason is set out in full over `FROZEN.eliteGrinder`: one key of
 *  seventy-nine moves, `loveEpisodes`, because someone appears in her life at week 137. ⚠⚠ AND THE
 *  IDENTITY THIS SET ASSERTS IS THE ONE THING THE RE-STAMP HAD TO PRESERVE, which it does: the
 *  arrival stream is keyed on `seed:life:arrival:<week>` and the girl's NAME is no part of any key
 *  in this wave, so putting `Vera` back before birth still reproduces – the same girl still meets
 *  the same person in the same week, under either name. A wave that had keyed a draw on her name
 *  would be red here beside a green freeze, which is exactly what this set is for.
 *
 *  ⚠ AND RE-STAMPED AGAIN THE SAME DAY, FOR T4's ATTACHMENT LIFT – `eliteGrinder` ALONE once more,
 *  the reason in full over `FROZEN.eliteGrinder`: someone is in her life from week 137, so her
 *  `spirit` walks toward 75 instead of a flat 70 and ONE key of seventy-nine moves. ⚠⚠ THE IDENTITY
 *  THIS SET ASSERTS SURVIVES INTACT, and for the same reason the arrival left it intact: nothing in
 *  this layer reads her NAME. The lift reads `activeEpisode` and her temperament and nothing else, so
 *  putting `Vera` back before birth reproduces the same lifted career week for week. Value computed
 *  by RUNNING `careerHashUnderTheOldName(8, 0)`. */
export const PRE_NAME_VERA = {
  middleGrinder: 'ccd7800a0e0ca4664fe9a4cf0d4a7f5f8f9521e6de25f22c998cb1a5db1804d8',
  eliteGrinder: 'a45008cb31ea432663ff173e32d314ee97045792b451ff5d087a7dda3f7c84e5',
  selfTravelling: '30712d5a7dabd04f8057ebca15a8d41949ccb8b2cc2e043bfea5d57dfdc3c90a',}

/** ⭐⭐ THE SAME THREE CAREERS AS THEY HASHED UNDER v67 – the identity that proves the v68 re-freeze
 *  moved the VERSION NUMBER and nothing else, in the exact sense v49 set and v66 / v67 repeated: the
 *  narrowest legitimate re-freeze this file recognises.
 *
 *  ⚠ v68 DOES APPEND A WORLD KEY – `ageCurve`, the per-career age curve of round 31 #10/#13 – AND NO
 *  FROZEN CAREER CARRIES IT, which is a stronger statement than the three sets below can make and is
 *  the whole reason this wave could be built at all. The curve is resolved when the FORK AT NINETEEN
 *  is answered (`answerFork`, world/endings.ts) rather than by `createWorld`, because the route is the
 *  fork's own answer and does not exist before it; these careers stop at week 156, age 16.6, with the
 *  fork never raised. `careerHashAtSchema` peels the key anyway – see its v68 note – and on these
 *  three that peel is provably a no-op, so `careerHashAtSchema(…, 67)` is the same serialisation with
 *  one number changed and reproduces all three v67 constants byte for byte. These ARE those
 *  constants, verbatim.
 *
 *  ⭐ AND THE SECOND HALF THE COHORT COULD HAVE BROKEN AND DID NOT. Round 31 #13 gives every rival a
 *  decline age of her own, derived off `seed:decline:<id>` and never stored – so `world.cohort` gains
 *  no field – and it is unreachable here for the same kind of reason: `COHORT.ageBand` tops out at 19,
 *  three seasons of `ageCohort` make that 22, and a decline age of 27.5-30.5 cannot bite a
 *  twenty-two-year-old. `driftCohort` still spends exactly four MAIN draws per player, in the same
 *  order, so the frozen capture (41550 / e6b0c709) is untouched and `rngMain` is byte-identical on all
 *  three careers. */
export const PRE_V68 = {
  middleGrinder: '4d3b70e98aa7d34825dee2da1def050091e6ae227e3b6a99ae338c41f2de0320',
  eliteGrinder: 'fccf8034476cc169f96ad1a2885edb4a3506c3191f9935d1eb0e50d8a7088397',
  selfTravelling: '7d7227b1f670b922241226c53a552ce40413128fe620de025364af40fb274fdd',}

export const PRE_V67 = {
  middleGrinder: '2e3f015c61ae76ae59f6aa56e21f18cd51eca01fcbf0955559aed2b17801c92d',
  eliteGrinder: '362452b2771efe907ff807c69d12e02932614bcad7ed6187eaa0e51d4232d619',
  selfTravelling: '94cd6d21f13a697bb13ec4efa18e363f9f0f8ba395193b17f2e39a653ebe4e51',}

/** ⭐⭐ THE SAME THREE CAREERS AS THEY HASHED UNDER v65 – the identity that proves the v66 re-freeze
 *  moved the VERSION NUMBER and nothing else, in the exact sense v49 set: the narrowest legitimate
 *  re-freeze this file recognises.
 *
 *  ⚠ v66 APPENDS NO KEY AT ALL – it widens `WorldEventCategory` with 'business' (round 29 part
 *  four P7), and a category is a VALUE inside `events` / `financeWeeks`, not a key of the world.
 *  No frozen career can hold one: the businesses earn only for a family that bought the shelf's
 *  earners, no bench policy buys anything (the v63 note in `walkFrozenCareer`), and the walk now
 *  asserts the absence by name. So `careerHashAtSchema(…, 65)` – the same serialisation with one
 *  number changed – reproduces all three v65 constants byte for byte, and these ARE those
 *  constants, verbatim. */
export const PRE_V66 = {
  middleGrinder: '64f32674563c0bddcf2f26eec351e0f5593d26d1b0d0bf80ee4750736ccb8ffc',
  eliteGrinder: 'b8eca84efdcd344c07fab0c6557a17df66a506bfad2672dac2ddc6ad5abeb64f',
  selfTravelling: 'fbc3d2d06ed30331318ae61db28c358cf15938fb8b8878565d5107eebc55d99b',}

/** ⭐⭐ THE SAME THREE CAREERS AS THEY HASHED BEFORE ROUND 28 #17-b – the identity that proves the
 *  re-freeze moved ONE FIELD, `Offer.deadlineWeek`, and nothing else.
 *
 *  ⚠ THIS ONE IS NOT A SCHEMA ROLL-BACK, WHICH IS WHY IT HAS ITS OWN RECONSTRUCTION. Every
 *  `PRE_V*` block above rolls a version NUMBER back on the new world; this ruling changed a value the
 *  engine writes into persisted state, so the reconstruction has to undo the RULE - see
 *  `careerHashUnderTheWindowRule`, which rewrites each kit letter's deadline to
 *  `sponsorWindowClosesAt` and applies the expiry that followed from it.
 *
 *  ⚠ AND `selfTravelling` IS UNCHANGED, WHICH IS HALF THE PROOF. The 8k self-coached career clears no
 *  rung and is never written to, so it holds no kit letter and did not move at all - the whole diff
 *  is confined to the inbox of the two careers that were. `rngMain` is untouched for the thirteenth
 *  wave running: the ruling adds no draw on any stream, so the frozen MAIN capture in
 *  tests/condition.test.ts (count 41550, hash e6b0c709) is not re-pinned, and the pairwise
 *  invariance block in tests/offers.test.ts was green beside this re-freeze.
 *
 *  ⚠⚠ RE-DERIVED BY THE MERGE OF `origin/main` (28.08), NOT WEAKENED – AND ALL THREE HAD TO MOVE,
 *  THROUGH A CLEAN MERGE THAT POINTED AT NONE OF THEM. This constant exists on ONE side only, so git
 *  could raise no marker over it; its three values were taken before round 27 #6's v64 existed, and
 *  the reconstruction below rebuilds a WHOLE WORLD, version number included. A line that merges
 *  without a conflict marker has been checked by nothing – that is now this file's third receipt for
 *  the rule, and `PRE_V64` is the second.
 *
 *  ⭐⭐ AND CORRECTED THEY SAY SOMETHING SHARPER THAN THEY DID BEFORE: these three ARE `origin/main`'s
 *  own frozen hashes, byte for byte. Put the window rule back on the merged tree and you do not get
 *  «the old numbers», you get `origin/main` – on all three careers at once. So round 28 #17-b is the
 *  ONLY thing this branch carries that reaches these fixtures, and the merge proved it by
 *  reconstruction rather than by reading the diff.
 */
/** ⚠ RE-TAKEN AGAIN AT v65 (28.08), NOT WEAKENED, AND FOR A REASON THAT IS NOT ABOUT THE WINDOW RULE AT
 *  ALL. These three are whole-world hashes like `FROZEN`'s – `careerHashUnderTheWindowRule` rewrites
 *  the inbox and hashes everything else unchanged – so the key v65 appends moves them exactly as it
 *  moves their twins, and holding the old numbers would have made this identity fail for a reason
 *  that has nothing to do with the ruling it exists to prove.
 *
 *  ⚠ THE SHAPE OF THE PROOF IS UNCHANGED AND STILL HOLDS, which is what re-taking has to preserve:
 *  `middleGrinder` is still IDENTICAL to `FROZEN.middleGrinder` (that career's kit letters all land
 *  on the window's opening week, where the two rules agree), `selfTravelling` is still identical to
 *  `FROZEN.selfTravelling` (a career that clears no rung is never written to), and only
 *  `eliteGrinder` differs from its `FROZEN` twin – the one letter, `kit-152`, that the ruling moves.
 *  Same three relations as before the re-take; the numbers moved together, the argument did not.
 *
 *  ⚠ RE-TAKEN A THIRD TIME AT v66 (29.08, round 29 part four P7), for v65's own recorded reason
 *  verbatim: these are whole-world hashes, so the schemaVersion 65 -> 66 bump moves them exactly as
 *  it moves their `FROZEN` twins – see the per-key protocol block over `FROZEN` (one key moved, on
 *  all three presets, `rngMain` included among the unmoved). All three relations above still hold:
 *  `middleGrinder` and `selfTravelling` equal their `FROZEN` twins, `eliteGrinder` differs by the
 *  one moved letter. The numbers moved together, the argument did not – again. */
/** ⚠ RE-STAMPED FOR v68 (31.08, round 31 #10/#13) AND FOR NO OTHER REASON. Unlike every `PRE_V*` set
 *  below, this one is NOT a schema roll-back – `careerHashUnderTheWindowRule` hashes the reconstructed
 *  world at the LIVE version, so a schema bump moves these three the same way it moves `FROZEN`, and
 *  the identity they assert (put the deadline back on the window and the pre-ruling career returns)
 *  is untouched. The per-key diff over the same three careers is ONE key, `schemaVersion` – see the
 *  v68 note over `FROZEN` – and the rewrite this helper applies reads only `offers`, which that diff
 *  reports byte-identical. */
/** ⚠ RE-STAMPED AGAIN FOR v69 (01.09, round 32 #4/#5) AND FOR NO OTHER REASON – v68's note above
 *  applies word for word, and the v69 per-key diff over the same three careers is again ONE key,
 *  `schemaVersion`, with `offers` – the only thing this helper's rewrite reads – byte-identical. All
 *  three relations still hold: `middleGrinder` and `selfTravelling` equal their `FROZEN` twins and
 *  `eliteGrinder` differs by the one moved letter. The numbers moved together, the argument did not. */
/** ⚠ AND RE-STAMPED FOR WAVE 3's ARRIVAL HAZARD (11.09) – `eliteGrinder` ALONE, the same one value
 *  `FROZEN` moved, for the reason set out in full over `FROZEN.eliteGrinder`: someone appears in her
 *  life at week 137 and `loveEpisodes` is the single key of seventy-nine that moves. The identity
 *  this set asserts is untouched – the window rewrite reads only `offers`, which the per-key diff
 *  reports byte-identical, so putting the deadline back still returns the pre-ruling career. ⚠ AND
 *  THE RELATION HOLDS AS BEFORE: this career's inbox was never written, so `PRE_R28B.eliteGrinder`
 *  still EQUALS `FROZEN.eliteGrinder`, both at the new value.
 *
 *  ⚠ AND RE-STAMPED AGAIN THE SAME DAY FOR T4's ATTACHMENT LIFT – `eliteGrinder` ALONE for the third
 *  time on one branch, the reason in full over `FROZEN.eliteGrinder`. Both halves above still hold
 *  and both were re-checked rather than assumed: the window rewrite reads only `offers`, which the
 *  per-key diff reports byte-identical, and this career's inbox is still unwritten – so
 *  `PRE_R28B.eliteGrinder` EQUALS `FROZEN.eliteGrinder` again, both at the newest value. Computed by
 *  RUNNING `careerHashUnderTheWindowRule(8, 0)`. */
export const PRE_R28B = {
  middleGrinder: 'fccff4a6b7f9d084e6be292fa22837b6d0178c8acc30dea1e370be8c9bcaaa69',
  eliteGrinder: 'aff3bf0b9366c7744ce6b9cbf0a43a52015fcdb84072fa0d31aebf7e5ac3e1a3',
  selfTravelling: 'c8d0bb8832aa9f897db52632ec5a34d6cd8588194dd846411b0de5c0b850e973',}

/** ⭐ THE SAME THREE CAREERS AS THEY HASHED UNDER v56 – the identity that proves the v57 re-freeze
 *  moved ONE key and nothing else.
 *
 *  ⚠ ALL THREE HELD, which is the signature of a change that reached no career at all. Round 24's
 *  college birthday pauses `resumeFromCollege` on her birthday week and persists the paused year's
 *  opening (`college.pendingYearStart`) – all of it behind a college state that is null in every
 *  frozen career, and behind a latch none of them ever wears. Week 156 is 32 weeks short of the
 *  fork, which `walkFrozenCareer` asserts rather than assumes. The THREE TOUR BIRTHDAYS inside each
 *  of these careers are the sharper half of the claim: `pendingBirthday`, `chooseGift` and
 *  `markBirthday` were all touched this wave, and `birthdays`, `events` and `rngMain` hashed
 *  byte-identical on both arms anyway – the change is confined to the freeze path, measured rather
 *  than promised.
 *
 *  ⚠ PER-KEY DIFF TAKEN FIRST, control = this tree's own wave absent (a detached worktree at
 *  `1356712`; the wave was uncommitted and its agent alone, so that IS "my own change reverted" –
 *  and it was verified to lack the change while the B arm was verified to contain its reader).
 *  Headers checked against the invocations on every arm (5/0, 8/0, 0/1).
 *
 *  ⚠ `rngMain` UNMOVED for the fourteenth wave running, and it is the load-bearing half: the pause
 *  is a break in a loop, the guard is a read, and the gift's offer lives on `seed:birthday:<age>` –
 *  none of it is a draw. The frozen MAIN capture is untouched: count 41550, hash e6b0c709. */
export const PRE_V57 = {
  middleGrinder: '66eab8e17b7831aec15884508e07b20e0d19daf7aeb4d7733dfa3ac29fcf2083',
  eliteGrinder: '8affaaff622da3ddc5a57a70c5daaf8633bc87c05f642f2727f75222563674f4',
  selfTravelling: 'a57886d8f4a22361140f52339d0a5a3f42e2474f4c34c17416a4dd90740c4b13',
}

/** ⭐ THE SAME THREE CAREERS AS THEY HASHED UNDER v57 – the identity that proves the v58 re-freeze
 *  moved ONE key and nothing else.
 *
 *  ⚠ ALL THREE MOVED TOGETHER, which is the signature of a schema bump rather than a career change.
 *  Round 24 #5 moved the fork's ask to `schoolEndWeek` (week 242 for these birth-month-6 careers,
 *  86 weeks past this freeze's horizon; the old birthday ask was ≈283) and made the college answer
 *  a reservation executed at the September departure – all of it unreachable in 156 weeks, which
 *  `walkFrozenCareer`'s own `world.fork` null assertion checks rather than assumes.
 *
 *  ⚠ PER-KEY DIFF TAKEN FIRST, control = **this branch with my own change reverted** in a detached
 *  worktree – the wave was uncommitted and its agent alone, so the worktree at HEAD (`8b057bc`,
 *  docs-only on top of `7c64ea6`) IS that control. Headers checked against the invocations on every
 *  arm (5/0, 8/0, 0/1): one line of 66 differs, `schemaVersion`, on all three.
 *
 *  ⚠ `rngMain` UNMOVED for the fifteenth wave running, and it is the load-bearing half: `forkDue`
 *  became a week comparison, the reservation is pure state, and `resolveCollegeDeparture` draws
 *  nothing on any stream. The frozen MAIN capture is untouched: count 41550, hash e6b0c709. */
export const PRE_V58 = {
  middleGrinder: '97372d914e9b87ca79519ea058ca58b9c92f5e757048c8f24b9d9fe52af3a0eb',
  eliteGrinder: 'e7da873bdd0d235881f93e3e09040c2c80ca894e163333eb452282a76422acf9',
  selfTravelling: 'c3bd893c27abee3600d0205ad4575bd0f64c9e4d2e13b396780eda9ba6bee903',
}

/** ⭐ THE SAME THREE CAREERS AS THEY HASHED UNDER v58 – the identity that proves the v59 re-freeze
 *  (the masseur, travelling team step 1) moved the schema number, ADDED one inert key, and touched
 *  nothing else. These are the v58-era `FROZEN` values verbatim; `careerHashAtSchema(…, 58)` drops
 *  the key v59 added before hashing, because a v58 serialisation never held it. */
export const PRE_V59 = {
  middleGrinder: '821b0d70ae7413b612702b7c7b6bccd67926ae7121db9a48cb82799cd1fd3e11',
  eliteGrinder: 'a9434783a544c626311028e4011e20dd52c5caa57d2263011917708b67ab461b',
  selfTravelling: 'dcdca0cf16bbf34f0c4b157e156daadc49218e7459fd470b65d65901e301f601',
}

/** ⭐ THE SAME THREE CAREERS AS THEY HASHED UNDER v60 – the identity that proves the v61 re-freeze
 *  (round 26 #2, second pass: the home university exists in every country) moved the schema number
 *  and NOTHING ELSE. These are the v60-era `FROZEN` values verbatim.
 *
 *  ⚠⚠ v61 IS THE FIRST VERSION IN THIS LADDER THAT **REMOVES** A FIELD RATHER THAN ADDING ONE –
 *  `CollegeQuote.open`, the boolean that said whether a college place was hers to pick. So unlike
 *  every rollback above it, the question this identity answers is not "did a new key leak into an
 *  ordinary career" but "did a REMOVED one ever live in one". It did not, and by construction: the
 *  field lives inside `fork.offer.quotes`, week 156 is 32 weeks short of the fork, and
 *  `walkFrozenCareer` ASSERTS `world.fork === null` rather than assuming it. No key is dropped
 *  before hashing here for the same reason v60's rollback dropped none: the field is nested, so the
 *  top-level serialisation is the same 69 keys it was.
 *
 *  ⚠ `rngMain` UNMOVED for the nineteenth wave running, and it is the load-bearing half: nothing
 *  this wave added or removed draws on any stream – deleting a boolean from a quote is not a roll,
 *  and `answerFork`'s fallback changed which ARRAY LOOKUP it uses and not how many dice it throws.
 *  The frozen MAIN capture is untouched: count 41550, hash e6b0c709, re-run green beside this
 *  re-freeze. */
export const PRE_V61 = {
  middleGrinder: '3231d7372b479154768342db7d556554b82ad66736f530ef812d714860778f15',
  eliteGrinder: 'aff3b7c206a20704c3a9c14cb5b2945c1ff25af70755613ebbd8025ffe003713',
  selfTravelling: '426dda7eaf917c7ff1bda66259f3b50da295e730a9e4ed5465654ba46f2a8365',
}

/** ⭐ THE SAME THREE CAREERS AS THEY HASHED UNDER v61 – the identity that proves the v62 re-freeze
 *  (the long goodbye, step 1: the stored peak physical) added ONE inert key and touched nothing
 *  else. These are the v61-era `FROZEN` values verbatim; `careerHashAtSchema(…, 61)` drops the key
 *  v62 added before hashing, because a v61 serialisation never held it.
 *
 *  ⚠⚠ ALL THREE MOVED, AND UNLIKE v55/v56/v57 THAT IS EXPECTED HERE RATHER THAN SUSPICIOUS. Every
 *  previous "all three held" was a change that lived behind the college freeze; this one lives in
 *  the WEEKLY TICK and reaches every career there has ever been, by design – `peakPhysical` is
 *  written on the line after `growWeek`, 156 times in each of these walks. A frozen career that had
 *  NOT moved would have meant the growth phase was not writing it.
 *
 *  ⚠ AND THE KEY IS THE ONLY THING THAT MOVED, which is what this identity is for: the peak is a
 *  `Math.max` over state `growWeek` has already computed, so it can neither feed back into her
 *  tennis nor reorder anything – no rule reads it yet (step 2 is the reader, and it is not built).
 *  `walkFrozenCareer` asserts the value is exactly today's `physicalMean`, so the new key is not
 *  merely present, it is the number the comment says it is.
 *
 *  ⚠ `rngMain` UNMOVED for the twentieth wave running, and it is the load-bearing half: a maximum is
 *  a comparison, not a roll, and this wave adds no draw to any stream. The frozen MAIN capture is
 *  untouched: count 41550, hash e6b0c709, re-run green beside this re-freeze. */
export const PRE_V62 = {
  middleGrinder: 'd9aa8523feacf80d6059c226d0f82b8eb51084c18676a85ff1cf210ada985540',
  eliteGrinder: 'fb779eaca04e421db25fdb3d0e2f17f77e3d947ebbc011cf6cb0b39b2d1a3fb8',
  selfTravelling: 'c57db4f00f772549f8028f17cbabc6ba3d0c7a476df28a7b050c5b63780d1f40',
}

/** ⭐ THE SAME THREE CAREERS AS THEY HASHED UNDER v62 – the identity that proves the v63 re-freeze
 *  (the shop, slice 1) added ONE EMPTY key and touched nothing else. These are the v62-era `FROZEN`
 *  values verbatim; `careerHashAtSchema(…, 62)` drops `assets` before hashing, because a v62
 *  serialisation never held it.
 *
 *  ⚠⚠ ALL THREE MOVED, AND HERE THAT IS PURE BOOKKEEPING RATHER THAN A FINDING – the opposite of
 *  v62, where a key written 156 times a career had to move them. `assets` is written ONCE, by
 *  `createWorld`, as `[]`, and `revalueAssets` loops over it zero times on every one of these 156
 *  ticks. The two things that moved are the schema number and the presence of an empty array.
 *
 *  ⚠ AND THAT IS THE WHOLE OF WHAT THIS WAVE DID TO A CAREER THAT NEVER OPENS THE SHOP, which is
 *  acceptance §2e-4 read as an identity rather than as a hope: drop the key, roll the number back,
 *  and the previous hashes come back byte for byte. If the shelf had touched a price, a fare, a
 *  rank or an event, the drop would not be enough and this case would be red beside the freeze.
 *
 *  ⚠ `rngMain` UNMOVED for the twenty-first wave running, and it is the load-bearing half: slice 1
 *  draws NOTHING – `world/shop.ts` imports no RNG and takes no `Rng` – so the frozen MAIN capture is
 *  not re-pinned (count 41550, hash e6b0c709) and was re-run green beside this re-freeze. */
/** ⭐ THE SAME THREE CAREERS AS THEY HASHED UNDER v63 – the identity that proves the v64 re-freeze
 *  (round 27 #6, the Nations Cup tie walked through the tour's flow) moved the schema number and
 *  NOTHING ELSE. These are the v63-era `FROZEN` values verbatim, and no key is dropped before
 *  hashing: v64's new field is `college.callUpReveal`, nested inside a `CollegeState` that is null
 *  in every one of these careers, so their top-level serialisation is the same list of keys it was.
 *  v60's rollback has exactly this shape and for exactly this reason.
 *
 *  ⚠⚠ THE INTERESTING ARM IS `offers`, NOT `college`. This wave puts a LETTER in the inbox a week
 *  before every tie, and `world.offers` is inside this hash – so if `settleCallUpLetter` had been
 *  reachable outside the freeze, or if moving the roll into `callUpFor` had changed what the roll
 *  returns, these three would not roll back. They do, on all three arms.
 *
 *  ⚠⚠ RE-PINNED BY THE MERGE OF `origin/main`, NOT WEAKENED – AND IT IS THE SHARPEST WARNING IN THIS
 *  FILE. These three moved because "the v63-era `FROZEN` values" is a moving target: the retirement
 *  hazard's condition curve (`7261b17`) re-froze every one of them before this branch was merged, so
 *  the numbers that stood here – daed02ec…, f722b0b3…, 34261cd3… – were the PRE-retirement v63 era
 *  and are now history that never existed on any shipped tree. ⚠ THE DANGER IS THAT NOTHING
 *  CONFLICTED: `PRE_V64` lives on this branch alone, so git took it CLEANLY and wrongly, while the
 *  two constants that DID conflict were the ones a reader would have looked at. A line that merges
 *  without a marker has not been checked by anything.
 *
 *  ⚠ SO THESE ARE NOW origin/main's OWN POST-RETIREMENT `FROZEN` VALUES, and that identity is the
 *  measurement rather than the argument: `careerHashAtSchema(…, 63)` on the MERGED tree reproduces
 *  them byte for byte on all three arms, which is the claim above re-proved on top of a change that
 *  moved every career. The per-key diff against `origin/main` agrees – one key of 71/71/70 differs
 *  and it is `schemaVersion` – and `rngMain` is byte-identical on every arm.
 *
 *  ⚠⚠ AND THE WARNING TWO PARAGRAPHS UP CAUGHT THIS VERY CONSTANT A SECOND TIME, ON THE NEXT MERGE
 *  (28.08, `origin/main` into round 28's ledger branch). It came through CLEANLY AGAIN – no marker,
 *  because it still lives on one side only – and `eliteGrinder` was WRONG AGAIN, for the mirror of
 *  the first reason: `2ead13e9…` is `origin/main`'s v63 shape of that career, taken before round 28
 *  #17-b put a kit letter's deadline back on the LETTER. The ruling is persisted state, so the 120k
 *  career this branch carries is not the one `origin/main` hashed. RE-AIMED, NOT WEAKENED: the value
 *  is now `32086f46…`, which is what `careerHashAtSchema(8, 0, 63)` returns on the merged tree and
 *  also what the pre-merge branch head hashes to – so the identity still asks exactly what it always
 *  asked, «does rolling ONLY the version back undo the whole of v64», and still answers yes.
 *
 *  ⚠ `middleGrinder` and `selfTravelling` are UNCHANGED through that merge, and the split is the
 *  attribution: round 28 #17-b reached the 120k career alone. Two constants of three holding is what
 *  a one-career change is supposed to look like here. */
export const PRE_V64 = {
  middleGrinder: '2c7fa80ddb4e8034ccb124f49aa4fa2a2d6ab0e27b6ecc26859768ba0c8c2ec0',
  eliteGrinder: 'd9d80f1a105b3dfd9619c481ae3dedefc8161eb55acb6b791d5581b801976306',
  selfTravelling: '40d412f62d921fccef512c07b297099c41193fe18a75b1f4fc70a02c66c1977c',
}

export const PRE_V63 = {
  middleGrinder: '7461dd0f663c143c21204aefe1d653fc99b6becbc7bd5c9dc22506ff0c3f11f6',
  eliteGrinder: '901308d3e4c42b97e5536681425ca7294e533218e7e99f884ffd3b9e3428b101',
  selfTravelling: 'bee7550ac21851ddaa4fece1ec4e5cabd6d49d4253c751d893535fde3e6e792a',
}

/** ⭐⭐ THE SAME THREE CAREERS AS THEY HASHED UNDER v64 – the identity that proves the v65 re-freeze
 *  moved the schema number and ONE APPENDED KEY, and nothing else in any of the three.
 *
 *  v65 records the champion of every AI tournament (`world.fieldSeasonTitles`), a fact these careers
 *  produce ~187 times a season and had been throwing away since the canonical brackets existed. So
 *  unlike v63's `assets` the new key is NOT empty here – it is full, in every career, which is
 *  precisely the change landing. That makes this identity the load-bearing one: if writing the
 *  champion had touched a draw, a rank, a cent or an event, dropping the key would NOT bring the old
 *  hashes back and this case would go red beside the freeze, naming the wave instead of leaving
 *  three hashes to drift.
 *
 *  ⚠⚠ THIS BLOCK ARRIVED AS A SECOND `const PRE_V64` AND THE MERGE CAUGHT IT AS A DUPLICATE
 *  IDENTIFIER, not as a hash. Its wave numbered itself v64 off a branch that still read 63, so when
 *  it landed beside round 27 #6's own `PRE_V64` – inserted a few lines apart, therefore NO CONFLICT
 *  MARKER – the file simply declared the name twice. That is the schema collision showing up in the
 *  one place a type-checker can see it, and it is the third thing on this merge that a clean line
 *  merge got wrong. Renamed with the version it now belongs to.
 *
 *  These are the v64-era `FROZEN` values verbatim – i.e. what the merge of `origin/main` re-pinned
 *  the day before. `careerHashAtSchema(…, 64)` drops `fieldSeasonTitles` and rolls the number back,
 *  and all three come back byte for byte; `PRE_V64` below then rolls the SAME world on to 63 and
 *  reproduces the v63 era underneath, which is what makes this an append-only chain rather than two
 *  unrelated pins. */
export const PRE_V65 = {
  middleGrinder: '7d32fb493db63fe4e8ed51ddd34bd2d32b69ddb17004f5785dd9400b40b1c4b4',
  eliteGrinder: '61bb0eaba7f8f3cc7145c14f2c8f2b91c79836506d38698fb2362e8099b1f37c',
  selfTravelling: '599692bf6ff792411ed8aa51f56a08585e49f23d46d45c645492a7caadb27891',
}

/** ⭐ THE SAME THREE CAREERS AS THEY HASHED UNDER v59 – the identity that proves the v60 re-freeze
 *  (round 26 #6, the College League walked through the tour's flow) moved the schema number and
 *  NOTHING ELSE. These are the v59-era `FROZEN` values verbatim, and unlike v59's rollback no key
 *  is dropped before hashing: v60's new field is `college.leagueReveal`, nested inside a
 *  `CollegeState` that is null in every one of these careers, so their top-level serialisation is
 *  the same 69 keys it was. */
export const PRE_V60 = {
  middleGrinder: '1cb6f69e02b71caf87891e93e2f1096bffcbd9852051ebdac73dac34a5da1deb',
  eliteGrinder: '8f37af6f5d33769662edc56c65e4d2b4e851d19b9baf2b18480e29e470d3b586',
  selfTravelling: 'aad187cd5378fad2c11500bea0e8d2d067e853d3b18b16a07c3a10948cd6960c',
}

/** ⭐ THE SAME THREE CAREERS AS THEY HASHED UNDER v55 – the identity that proves the v56 re-freeze
 *  moved ONE key and nothing else.
 *
 *  ⚠ ALL THREE HELD, which is the signature of a change that reached no career at all. Round 24's
 *  student championship (`engine/collegeLeague.ts`) fires only on `COLLEGE_LEAGUE.seasonWeek` INSIDE
 *  the college freeze, and the earned call-up reads a field that only exists inside it; week 156 is
 *  32 weeks short of the fork, which `walkFrozenCareer` asserts rather than assumes. So what the wave
 *  did to these three careers is the version number and nothing else.
 *
 *  ⚠ PER-KEY DIFF TAKEN FIRST, control = **this branch with my own commit reverted** in a detached
 *  worktree – never the previous commit and never a worktree at HEAD. Headers checked against the
 *  filenames on every arm (5/0, 8/0, 0/1).
 *
 *  ⚠ `rngMain` UNMOVED for the twelfth wave running, and it is the load-bearing half: the
 *  championship draws on `seed:collegeleague:<week>` and `seed:collegematch:<week>:<r>`, both
 *  re-derived at the call site, and the call-up's own four draws on `seed:callup:<week>` are
 *  byte-identical – only the threshold the first one is compared against moved. The frozen MAIN
 *  capture is untouched: count 41550, hash e6b0c709. */
export const PRE_V56 = {
  middleGrinder: '040d1c0d4d7d417fff3ef2658f88c3c69a739c1fe1ba477b607b9a3188a3261e',
  eliteGrinder: '358dfe2a5e95b3db887c674cb6e34dc28e124c8ecdc8a5ce54e84f6aa6e739e4',
  selfTravelling: 'fcd83fc3dfb255331771a2c5c70be2f183c5be67e58f4ae4c20693c4c3b77b8f',
}

/** ⭐ THE SAME THREE CAREERS AS THEY HASHED UNDER v54 – the identity that proves the v55 re-freeze
 *  moved ONE key and nothing else.
 *
 *  ⚠ ALL THREE HELD, which is the signature of a change that reached no career at all. Round 24's
 *  three rules are entirely inside the college freeze and week 156 is 32 weeks short of the fork, so
 *  what the wave did to these careers is the version number and nothing else. The per-key diff –
 *  control built as this branch with the wave's own commit reverted, never the previous commit –
 *  named `schemaVersion` and no other key, on all three. */
export const PRE_V55 = {
  middleGrinder: '9c75de1d8232b4953e25f320d9f8d67c6cab08b4e33a23764adcc1c9cbca43be',
  eliteGrinder: '58ff7cb44b99cda3c727f08c375628e402ed267a6b6c2ad6aaf56c097a8df016',
  selfTravelling: '11006d1cc568c0d834a4a02182882f0229957996d529dc2c09e08572ddc85f28',
}

/** ⭐⭐ RE-FROZEN A SEVENTH TIME (16.08, v51 – docs/specs/what-the-college-place-costs-2026-08.md) AND
 *  ALL THREE MOVED, WHICH IS THE OPPOSITE OF ALARMING – it is the signature of a change that reached
 *  no career at all.
 *
 *  Every previous re-freeze moved ONE career of three and the per-key diff said which and why. This
 *  one moved all three by exactly one key, and `PRE_V51` below is the proof: rolling `schemaVersion`
 *  back to 50 on the NEW world reproduces the OLD hashes byte for byte, for all three. Nothing else
 *  in these worlds is different.
 *
 *  ⚠ AND THAT IS BY CONSTRUCTION RATHER THAN BY LUCK. v51 adds `ForkState.offer` and a weekly tuition
 *  debit. Week 156 is 32 weeks short of the fork, so `world.fork` is still null here and there is no
 *  offer to measure; `resolveCollegeBill` returns at its first line because `inCollege` is false. Both
 *  facts are asserted in `walkFrozenCareer` so a future wave that made either reachable goes red with
 *  a reason instead of just a different hash. `rngMain` is untouched for the sixth wave running: the
 *  offer draws on a `seed:collegeoffer:<week>` sub-stream and the bill draws nothing at all, so the
 *  frozen MAIN capture (41550 / e6b0c709) is not re-pinned. */
/** ⭐ THE SAME THREE CAREERS AS THEY HASHED UNDER v51 – the identity that proves the v52 re-freeze
 *  moved ONE key and nothing else.
 *
 *  ⚠ AND ALL THREE HELD THIS TIME, which is worth stating because the previous two re-freezes could
 *  not say it: v52 replaces the SHAPE of `ForkState.offer` (a funding share becomes a place with a
 *  price) and adds a match-play term to `growWeek` that only fires inside the college freeze. Neither
 *  is reachable at week 156 – the fork is 32 weeks away and `world.college` is null – and
 *  `walkFrozenCareer` asserts both rather than assuming them. So the whole of what the college choice
 *  did to these three careers is the version number, and this block is the proof rather than the
 *  claim. `rngMain` is untouched for the seventh wave running: the offer draws on a
 *  `seed:collegeoffer:<week>` sub-stream (three draws now instead of one, still not MAIN) and the
 *  match term draws nothing at all, so the frozen MAIN capture (41550 / e6b0c709) is not re-pinned. */
/** ⚠ ALL THREE RE-ANCHORED WITH THE FREEZE (18.08, the rename), NOT BROKEN – the file's own
 *  precedent language for a wave that changes the CAREER rather than a schema field. The rename
 *  changed `events` on all three, so rolling `schemaVersion` back on the OLD worlds cannot reproduce
 *  the new ones; these are re-taken by swapping only `schemaVersion` on the new world, which is
 *  exactly the property the three PRE_ blocks assert. They go on doing their job: a later wave that
 *  moves one of these careers through anything but `SAVE_SCHEMA_VERSION` still goes red here beside
 *  a red freeze, and the pair is what says which kind of change it was. */
export const PRE_V52 = {
  middleGrinder: 'e645d6789d8d0e4bb9e63baeb27651f4bfe52b5e686efb0b058a2a2e2d3f7858',
  eliteGrinder: '7c1564c8c655ef4c42d46f9bb949ad9873cb4f3bd468a10a07d17e2a0d96a007',
  selfTravelling: '8ad93fa0f6d4591de253570895bd3c65afb9e8d6526848eda6505d9b7b626377',
}

/** ⭐ THE SAME THREE CAREERS AS THEY HASHED UNDER v50 – the identity that proves the v51 re-freeze
 *  moved ONE key and nothing else. */
export const PRE_V51 = {
  middleGrinder: 'ecfcff50e976541f874466480e8d0bd43ed047617f4c54fc449d70dc66d53e46',
  eliteGrinder: '757ccf666eef693c8d36e2ddaba78d953c76fd75b2f8d9e711cdbc57f42de147',
  /** ⚠ MOVED WITH THE FREEZE ABOVE (17.08, round 21 #2b) AND THAT IS THE HONEST OUTCOME, not a
   *  weakening. The v51 case asks "does rolling ONLY the schema back reproduce the v50 hashes" – and
   *  for the two grinders it still does, untouched. For THIS career it no longer can, because the
   *  wild cards changed the career itself and not a schema field: rolling the version back on a
   *  different season cannot produce the old season. The identity is re-anchored to the new world, so
   *  it goes on doing its job – if a LATER wave moves this career through anything but
   *  `SAVE_SCHEMA_VERSION`, this line goes red beside the freeze exactly as it just did. */
  selfTravelling: '53e657c1e132201936cee7a15ec49a60754f086ca0b6343a4088b8843021b500',
}

/** ⭐ THE SAME THREE CAREERS AS THEY HASHED UNDER v49, kept so the re-freeze above can PROVE its own
 *  claim rather than assert it. See the paragraph on `FROZEN`. */
export const PRE_V50 = {
  /** ⚠ MOVED WITH ITS TWINS A THIRD TIME (17.08, round 21 #4). These two grinder hashes had held
   *  across every previous wave, and they moved here for the reason the block on `FROZEN` records in
   *  full: the WTA 250's field changed, so the tour NEWS in `events` changed, and `events` is inside
   *  the hash. The rollback identity itself is untouched in meaning – swapping only `schemaVersion`
   *  on the new world still reproduces exactly this, which is what these three lines are for. */
  middleGrinder: 'c09eca5eec97f05d61e200d380cd8d09bddac23636a338988edb4d0f97ed254e',
  eliteGrinder: '6b7e0fd5844797b71d5804d579a31ca51ce23dee3a593b705f54fb1b32310c52',
  /** ⚠ MOVED WITH ITS TWIN ABOVE, AND THE PARAGRAPH ON `FROZEN` PREDICTED EXACTLY THIS: *"if a later
   *  wave moves one of these careers for a real reason, the rollback case goes red beside the freeze
   *  and says which kind of change it was."* It did, on 16.08, and it said so – both hashes red, and
   *  the per-key diff showing a career that really is different rather than a schema field that is.
   *  The identity below still does its own job: rolling `schemaVersion` back to 49 on the NEW world
   *  reproduces this, so nothing about P5's claim has been quietly lost in the re-freeze.
   *
   *  ⚠ MOVED WITH ITS TWIN A SECOND TIME (16.08, the acceptance inversions), for the same reason and
   *  with the same proof beside it. The two grinder rollback hashes above did NOT move, which is the
   *  identity doing its job: a change that reaches one career of three shows up in one pair of hashes
   *  of three, not in all six. */
  /** ⚠ MOVED WITH ITS TWIN A THIRD TIME (17.08, round 21 #2b), for the reason written on the v50
   *  line: this wave changed the CAREER, not a schema field, so the rollback is re-anchored to the
   *  new world. The two grinder hashes in this block did NOT move, which is the identity doing its
   *  job – a change that reaches one career of three shows up in one pair of hashes of three. */
  selfTravelling: '2218ddf21c0a6aef0f1937b3e27287c9de3fce262bcb4b703273b14f4b654973',
}

const FREEZE_WEEKS = 156

function walkFrozenCareer(
  presetIndex: number,
  policyIndex: number,
  force?: Partial<{ coachOnEventWeeks: boolean }>,
  profileOverride?: Partial<PlayerProfile>,
) {
  const { world, rng } = openCareer(PRESETS[presetIndex], 0, POLICIES[policyIndex], profileOverride)
  if (force?.coachOnEventWeeks !== undefined) world.coachOnEventWeeks = force.coachOnEventWeeks
  for (let w = 0; w < FREEZE_WEEKS; w++) stepCareerWeek(world, rng, POLICIES[policyIndex])
  // ⚠ v49: none of these three careers sends the coach to a junior event, so the hashes above are
  // about the mechanic being INERT here. Checked rather than assumed - a bench policy that started
  // ticking this would move the numbers for a reason the comment above says is impossible.
  expect(world.coachOnJuniorEvents, 'the v49 stance is present and OFF in the frozen careers').toBe(false)
  // ⚠ v50: and none of them goes to COLLEGE either – the fork sits far past week 156 – so
  // everything P5 added is unreachable here by construction, not by luck.
  expect(world.college, 'the v50 freeze is not entered by any frozen career').toBeNull()
  // ⚠ v64 (round 27 #6): ...so no NATIONS CUP INVITATION can be in this inbox either. Stated as its
  // own assertion rather than left to the null above, because this wave's new writer reaches a
  // different key: `settleCallUpLetter` pushes onto `world.offers`, which is INSIDE the career hash,
  // and a guard that stopped holding would otherwise show up only as three drifting hex strings.
  expect(
    world.offers.filter((o) => o.kind === 'call-up'),
    'the v64 invitation is unreachable in a frozen career: it is written only inside the freeze',
  ).toHaveLength(0)
  // ⚠ v51: and the fork is never RAISED here either, so there is no college offer to measure and no
  // tuition line to charge. ⚠ ROUND 24 #5 moved the ask off her birthday (≈283 for these
  // birth-month-6 careers) to `schoolEndWeek(6)` = 242 – measured, still 86 weeks past this freeze's
  // 156-week horizon. That is why all three hashes moved by exactly `schemaVersion` and nothing else
  // (see `PRE_V51`…`PRE_V58`), and it is checked rather than assumed: a wave that moved the fork
  // under week 156 would go red HERE, with a sentence, instead of three hashes drifting for a
  // reason nobody could name.
  expect(world.fork, 'the v51 offer is unreachable in a frozen career: the fork is never raised').toBeNull()
  // ⚠ v59: and none of them ever hires the masseur – the hire is pro-career gated and no bench
  // policy takes it – so everything the travelling team's step 1 added is inert here by
  // construction, not by luck. A policy that started hiring would move the hashes for a reason
  // this line names instead of leaving three hashes drifting.
  expect(world.masseurHired, 'the v59 seat is present and EMPTY in the frozen careers').toBe(false)
  // ⚠ v59 STEP 2: the dial stands on its written default and the travel stance is OFF – checked
  // rather than assumed, because every step-2 effect (the rung bill, the rung cadence, the tour
  // relief, the fare) sits behind the hire and the stance, and a policy that started moving either
  // would move the hashes for a reason these two lines name.
  expect(world.masseurSessionsPerWeek, 'the v59 dial is present and on its default').toBe(4)
  expect(world.masseurTravels, 'the v59 travel stance is present and OFF').toBe(false)
  // ⚠ 22.08 rulings wave: the return-week mark needs a HIRE at finalize, so it can never exist
  // here – asserted, because a key that appears only sometimes is exactly what a whole-world hash
  // is worst at explaining. And no share row can exist either: a share needs a wta cheque, which
  // the grinders never win inside 156 weeks, or a coach, which the player arm does not have.
  expect('masseurReturnDue' in world, 'no return-session mark in a masseur-less career').toBe(false)
  expect(
    world.events.some((e) => e.text.includes("share of the prize money") && e.type === 'expense'),
    'no staff share row in any frozen career',
  ).toBe(false)
  // ⚠ v62: and the stored peak is present and is TODAY. She is 16.6 at week 156, `declineFactor` opens
  // at 29, and before it her physical mean is non-decreasing – so the running maximum can only be the
  // value she is carrying. Checked rather than assumed, because it is the one thing that could make the
  // new key move a hash for a reason that is NOT a schema bump: a peak above today's mean here would
  // mean something took physical points off a sixteen-year-old.
  expect(world.peakPhysical, 'the v62 peak is present and is TODAY at 16.6 – nothing has declined yet')
    .toBeCloseTo(physicalMean(world.skills), 10)
  // ⚠ v63: the shelf is present and EMPTY in every frozen career, and it could not be otherwise –
  // the shop is open from week 0 since round 29 part two #6, and no bench policy in this
  // file buys anything, and 156 weeks ends at age 16.6. Asserted rather than assumed, because a key
  // that filled itself would move these hashes for a reason no comment could name.
  expect(world.assets, 'the v63 shelf is present and EMPTY in the frozen careers').toEqual([])
  // ⚠ v65: and the champion tally is present and FULL – the one key here that is asserted non-empty,
  // because unlike every field above it this one IS the change rather than a seat the change left
  // inert. Week 156 is `156 % 52 = 0`, three weeks past the season-2 wrap that cleared it, so what it
  // holds is the opening weeks of a new season and not a whole one; the shape is what matters here
  // (the census itself is measured in tests/ai-champions.test.ts). Asserted rather than assumed for
  // the mirror of every reason above: a wave that quietly STOPPED recording would leave three hashes
  // drifting with no comment able to name why, and this line names it instead.
  const recorded = Object.values(world.fieldSeasonTitles ?? {})
  expect(recorded.length, 'the v65 champion tally is present in the frozen careers').toBeGreaterThan(0)
  expect(
    recorded.reduce((sum, rung) => sum + Object.values(rung).reduce((a, b) => a + b, 0), 0),
    'the v65 champion tally holds this season-so-far, not nothing',
  ).toBeGreaterThan(0)
  // ⚠ v66 (round 29 part four P7): and no BUSINESS ever earns in a frozen career – the merch brand
  // and the academy's stages pay only a family that BOUGHT them, the shelf is empty here (the v63
  // assertion above), and `resolveBusinessIncome` books nothing at zero. Asserted on both persisted
  // surfaces the category can reach, because this wave's writer is a TILL phase and a policy that
  // started buying would otherwise show up only as three drifting hex strings.
  expect(
    world.events.some((e) => e.category === 'business'),
    'the v66 income lines are unreachable in a frozen career: nobody bought a business',
  ).toBe(false)
  expect(
    world.financeWeeks.some((w) => 'business' in w.byCategory),
    'the v66 category never reaches the per-week ledger of a frozen career',
  ).toBe(false)
  return world
}

export function careerHash(presetIndex: number, policyIndex: number, force?: Partial<{ coachOnEventWeeks: boolean }>): string {
  return createHash('sha256').update(JSON.stringify(walkFrozenCareer(presetIndex, policyIndex, force))).digest('hex')
}

/** The same walk, hashed with `schemaVersion` rolled back – the identity that proves the v50 re-freeze
 *  moved ONE key. Overwriting the value in place preserves `JSON.stringify`'s key order, so this is
 *  the same serialisation with one number changed and nothing else.
 *
 *  ⚠ v59: A ROLLBACK BELOW 59 ALSO DROPS THE MASSEUR'S THREE KEYS – `masseurHired`, and step 2's
 *  `masseurSessionsPerWeek` + `masseurTravels` – and that is what "this save at v58" means rather
 *  than a convenience: none of the three existed at any earlier schema, so a pre-59 serialisation
 *  containing any of them would be a shape no shipped version ever wrote. They are the LAST keys
 *  of `createWorld`'s literal (placed there for exactly this), so dropping them leaves every other
 *  key's order untouched and all seven older identities reproduce their constants byte for byte.
 *
 *  ⚠ RE-AIMED FOR v62, NOT WEAKENED, AND IT HAD TO BE. v62 appends `peakPhysical` – and it appends it
 *  AFTER the masseur's three, so those three stopped being the last keys of the literal. Left alone,
 *  every rollback below 62 (v59's included) would have hashed a "pre-v59 serialisation" that carried
 *  a key which did not exist at any schema at all, and the eight older identities would have gone red
 *  together for a reason none of their comments could explain. Dropping `peakPhysical` FIRST restores
 *  each older shape exactly: a rollback to 61 is the v61 world, and a rollback below 59 is that minus
 *  the masseur's three. Every one of the older constants below is unchanged and still reproduces. */
export function careerHashAtSchema(presetIndex: number, policyIndex: number, schemaVersion: number): string {
  const world = walkFrozenCareer(presetIndex, policyIndex)
  // ⚠ RE-AIMED FOR v63, NOT WEAKENED, AND FOR EXACTLY THE REASON v62's NOTE ABOVE GIVES ONE LAYER
  // DOWN. v63 appends `assets` AFTER `peakPhysical`, so `peakPhysical` stopped being the last key of
  // `createWorld`'s literal. The keys are therefore peeled in reverse order of when they were
  // appended – `assets`, then `peakPhysical`, then the masseur's three – and each older shape comes
  // back exactly: a rollback to 62 is this world minus `assets`, a rollback to 61 is that minus the
  // peak, and a rollback below 59 is that minus the masseur's three. Every one of the nine older
  // constants below is unchanged and still reproduces.
  // ⚠ RE-AIMED FOR v65, NOT WEAKENED, AND THE KEY THIS ONE PEELS IS NOT IN `createWorld`'s LITERAL
  // AT ALL – which is a difference worth stating, because the three notes above are about literal
  // order and this one is not. `fieldSeasonTitles` is written by `runAiTournament` on the first week
  // a bracket resolves, exactly as its twin `fieldSeasonPoints` is, so it joins the serialisation at
  // whatever position that first write gives it – ahead of `fieldSeasonPoints` on a career whose
  // first event is a domestic rung, since a junior draw pays no professional and creates no points
  // entry. That costs this identity nothing: object rest preserves the RELATIVE order of everything
  // it keeps, so dropping the new key alone restores precisely the v63 serialisation, whichever side
  // of its twin it landed on. Verified rather than argued – `PRE_V65` below reproduces all three v64
  // constants byte for byte, and `PRE_V64` the three v63 ones under them.
  // ⚠⚠ AND THE BOUNDARY IS `< 65`, NOT `< 64`, WHICH IS THE ONE LINE THE RENUMBER COULD NOT AFFORD TO
  // MISS. This chain merged CLEANLY at `< 64` – the champion wave's own number – and a clean line is
  // checked by nothing: left alone it would have peeled the key off the LIVE version and every
  // identity below would have gone red at once, for a reason none of their comments could name.
  // ⚠ RE-AIMED FOR ROUND-29 #20, NOT WEAKENED, AND IT PEELS AHEAD OF ALL FOUR ABOVE because it is the
  // newest key – the peel order is reverse order of arrival and `gearRestWeeks` arrived last. It is
  // the SECOND key here that is not in `createWorld`'s literal (the v65 note above argues the case for
  // the first): `recordGearRestWeek` writes it on the first week a booked family holiday resolves, so
  // it joins the serialisation at whatever position that write gives it, and on a career that never
  // books one it is absent entirely and this line is a no-op. Object rest keeps the RELATIVE order of
  // everything it retains, so dropping it alone restores precisely the pre-#20 serialisation wherever
  // it landed. ⚠⚠ AND THE BOUNDARY IS EVERY ROLLBACK, NOT A NEW RUNG: #20 ships as an OPTIONAL field
  // with NO schema move (absence already means "no rest recorded", which is the shipped behaviour), so
  // `SAVE_SCHEMA_VERSION` stays 65 and there is no version to branch on – the key simply did not exist
  // at any earlier shape, so every branch below drops it and only the live `world` keeps it. Verified
  // rather than argued: all the older constants below reproduce byte for byte with this line in place.
  // ⚠ RE-AIMED FOR v68 (round 31 #10/#13), NOT WEAKENED, AND IT PEELS AHEAD OF ALL FIVE BELOW because
  // `ageCurve` is the newest key and the peel order is reverse order of arrival. It is the THIRD key
  // here that is not in `createWorld`'s literal, and the only one that is BY DESIGN rather than by
  // accident of where its writer runs: the per-career age curve is resolved when the fork at nineteen
  // is answered, so a frozen career – 156 weeks, age 16.6 – never writes it and this line is a no-op
  // on every constant in this file. That is exactly what the wave claims, and `FROZEN` below is the
  // proof: all three careers reproduce byte for byte with a schema bump in the tree.
  // ⚠ RE-AIMED FOR v69 (round 32 #4 – the brand's slow stock), NOT WEAKENED, AND IT PEELS AHEAD OF
  // ALL SIX BELOW because `brandStrengthSeed` is the newest key and the peel order is reverse order of
  // arrival. ⭐⭐ IT IS THE FIRST KEY HERE THAT NO LIVE CAREER CAN EVER WRITE: the pin is written by the
  // v68 -> v69 MIGRATION and by nothing else – not `createWorld`, not a phase of the tick – and
  // `walkFrozenCareer` builds a live career, so this line is a no-op on every constant in this file
  // and will stay one. It is here anyway, because the invariant that keeps the next wave out of
  // trouble is «peel every key appended after the version being rolled back to», and an exception
  // argued from today's writer set is exactly how that invariant rots. Measured before it was written:
  // `tools/frozen-key-diff.ts` on all three careers reports ONE moved key, `schemaVersion` – see the
  // v69 note over `FROZEN`.
  // ⚠⚠ RE-AIMED FOR v70 (round 35 #14 – the published draw), NOT WEAKENED, AND IT PEELS AHEAD OF ALL
  // SEVEN BELOW because `drawnFirstRounds` is the newest key and the peel order is reverse order of
  // arrival. ⭐⭐ AND IT IS THE FIRST PEEL IN THIS CHAIN THAT IS **NOT** A NO-OP ON A FROZEN CAREER,
  // which is the sentence a later reader needs: every key peeled above is either unreachable inside
  // 156 weeks (`ageCurve`, the fork) or written by a migration a live career never runs
  // (`brandStrengthSeed`). This one is written by `tickWeek` on every week she has an entered event
  // one week out, so a frozen career carries it and the peel really does remove something.
  //
  // ⚠⚠ WHICH IS ALSO WHY NO `PRE_*` CONSTANT BELOW SURVIVED THIS WAVE, and that is the SECOND kind of
  // move this file distinguishes – not a schema field, but a change to what a career IS. Honouring a
  // published draw changes WHO SHE PLAYS in round one, so her results, points, rank, wallet, trophies
  // and body all move with it; rolling `schemaVersion` back on a career that played different
  // opponents cannot reproduce a career that played the old ones. Every rollback identity is
  // therefore RE-ANCHORED to the new world, exactly as they were on 28.08 when the current account's
  // interest was removed, and they go on doing their job: a later wave that moves one of these
  // careers through anything but `SAVE_SCHEMA_VERSION` still goes red here beside a red freeze, and
  // the pair is what says which kind of change it was.
  // ⚠⚠ RE-AIMED FOR v72 (the private life, wave 1), NOT WEAKENED, AND IT PEELS AHEAD OF ALL EIGHT
  // BELOW because `spirit`, `bond` and `temperament` are the newest keys and the peel order is
  // reverse order of arrival. They are the FIRST GROUP of three to arrive in one version – peeled in
  // one destructure because they arrived in one append, in the order `createWorld`'s literal lists
  // them, which is the order object rest preserves for everything it keeps.
  //
  // ⭐⭐ AND ALL THREE ARE WRITTEN BY `createWorld` ITSELF, so unlike `ageCurve` / `brandStrengthSeed`
  // this peel is emphatically NOT a no-op on a frozen career: every one of these worlds carries all
  // three, `spirit` moves week by week, and dropping them is what restores the exact v71 shape.
  // ⚠⚠ RE-AIMED FOR v73 (the private life, wave 2), NOT WEAKENED, AND IT PEELS AHEAD OF ALL NINE
  // BELOW because `lifeLog` is the newest key and the peel order is reverse order of arrival. It is
  // written by `createWorld` itself, so every career here carries it – but it carries it EMPTY, and
  // that is a property of these careers rather than of the field: the only beat wave 2 raises is the
  // fork's own opinion, the fork opens at week ~241, and this walk stops at 156. So the peel removes
  // a key and never a row, which is exactly what `PRE_V73` asserts.
  // ⚠⚠ RE-AIMED FOR v74 (the private life, wave 3), NOT WEAKENED, AND IT PEELS AHEAD OF ALL TEN
  // BELOW because `loveEpisodes` is the newest key and the peel order is reverse order of arrival.
  // It is written by `createWorld` itself, so every career here carries it – and it carries it
  // EMPTY, which is a property of these careers rather than of the field: the arrival hazard is
  // gated on `kidAgeExact >= 16` and this walk stops at 156 weeks, where she is 16.6 – but nothing
  // in THIS step draws at all, because T1 ships the list and the migration and no writer. So the
  // peel removes a key and never a row, exactly as v73's did, and `PRE_V74` asserts it.
  // ⚠ MEASURED BEFORE THIS LINE WAS WRITTEN, as this file's protocol demands: `tools/frozen-key-diff.ts`
  // on all three careers, a control capture taken at `cb3a3a18` before any edit, reports exactly TWO
  // moved keys – `schemaVersion`, and `loveEpisodes` appearing with the hash of `[]`.
  const { loveEpisodes: _episodes, ...preEpisodes } = world
  const { lifeLog: _beats, ...preBeats } = preEpisodes
  const { spirit: _spirit, bond: _bond, temperament: _temperament, ...preLife } = preBeats
  const { drawnFirstRounds: _draw, ...preDraw } = preLife
  const { brandStrengthSeed: _pin, ...preSeed } = preDraw
  const { ageCurve: _curve, ...preCurve } = preSeed
  const { gearRestWeeks: _rest, ...preRest } = preCurve
  const { fieldSeasonTitles: _titles, ...preTitles } = preRest
  const { assets: _assets, ...preAssets } = preTitles
  const { peakPhysical: _peak, ...prePeak } = preAssets
  const { masseurHired: _seat, masseurSessionsPerWeek: _dial, masseurTravels: _stance, ...preMasseur } = prePeak
  const shape =
    schemaVersion < 59
      ? preMasseur
      : schemaVersion < 62
        ? prePeak
        : schemaVersion < 63
          ? preAssets
          : schemaVersion < 65
            ? preTitles
            : schemaVersion < 68
              ? preCurve
              : schemaVersion < 69
                ? preSeed
                : schemaVersion < 70
                  ? preDraw
                  : schemaVersion < 72
                    ? preLife
                    : schemaVersion < 73
                      ? preBeats
                      : schemaVersion < 74
                        ? preEpisodes
                        : world
  return createHash('sha256').update(JSON.stringify({ ...shape, schemaVersion })).digest('hex')
}

/** ⚠⚠ ROUND 28 #17-b – THE PROOF THAT THE RE-FREEZE MOVED EXACTLY ONE FIELD, kept in the discipline
 *  this file already keeps for every schema roll-back: the diff is MEASURED before the constants are
 *  touched, never asserted afterwards.
 *
 *  The owner's ruling of 28.08 («…я не вижу проблем сделать слот в 5 недель») put a kit letter's
 *  deadline back on the LETTER – `kitOfferDeadline(week)` instead of `sponsorWindowClosesAt(week)`.
 *  `Offer.deadlineWeek` is PERSISTED state and these hashes are taken over the whole world, so every
 *  frozen career that was ever written to had to move. The career that was NOT written to did not
 *  move at all (the self-coached arm below, which clears no rung), and that is the first half of the
 *  proof: the diff is confined to the inbox.
 *
 *  ⭐⭐ AND THE PER-KEY DIFF WAS TAKEN FIRST, as this file's protocol demands and never after the
 *  fact: `npx vite-node tools/frozen-key-diff.ts --preset 8 --policy 0`, run on both trees with the
 *  ruling toggled on one line. **ONE key of 71 differs, and it is `offers`.** `rngMain`, `results`,
 *  `season`, `cohort`, `events`, `fundsCents`, `kidRank`, `skills` - every one byte-identical.
 *
 *  ⚠ AND INSIDE `offers` IT IS ONE LETTER, WHICH IS WORTH NAMING BECAUSE IT SHOWS THE RULE WORKING.
 *  Three of the four kit letters this career receives arrive on the window's OPENING week (47, 99,
 *  151), where `week + 4` and `sponsorWindowClosesAt` are the same number - so they did not move at
 *  all. The one that moved is `kit-152`, which arrived on window week 48: its deadline goes 155 → 156
 *  and it is therefore still OPEN at the 156-week horizon instead of expired. That is exactly the
 *  defect the ruling exists to close, caught in a fixture that was not written to look for it.
 *
 *  This is the byte-level half of the same proof. Rewrite each kit letter's deadline back to the
 *  window rule, apply the expiry that would have followed from it, and the OLD constants come back
 *  byte for byte - so nothing else in a career moved. Not a draw, not a cent, not a ranking. The
 *  ruling adds ZERO MAIN-stream draws, which the pairwise invariance block in tests/offers.test.ts
 *  asserts directly. */
export function careerHashUnderTheWindowRule(presetIndex: number, policyIndex: number): string {
  const world = walkFrozenCareer(presetIndex, policyIndex)
  const offers = world.offers.map((o) => {
    // `info` letters - the brand's goodbye, the tournament desk's receipts - carry
    // `deadlineWeek: week` from their own raise and were never touched by either rule.
    if (o.kind !== 'kit' || o.state === 'info') return o
    const deadlineWeek = sponsorWindowClosesAt(o.week)
    if (o.state !== 'open' || world.week <= deadlineWeek) return { ...o, deadlineWeek }
    // ⚠ AND THE EXPIRY THAT FOLLOWED FROM IT, BOTH FIELDS. `expireOffers` writes `state` AND
    // `decidedWeek` - the week it lapsed - and it runs every week, so a letter past its deadline was
    // gone on `deadlineWeek + 1`. Reconstructing only the state was this helper's first version and
    // it was wrong by exactly that one field, which is the kind of miss the byte-for-byte form
    // catches and a looser assertion would not.
    return { ...o, deadlineWeek, state: 'expired' as const, decidedWeek: deadlineWeek + 1 }
  })
  return createHash('sha256').update(JSON.stringify({ ...world, offers })).digest('hex')
}


/** ⚠⚠ 02.09.2026 – THE PROOF THAT THE `Vera -> Alice` DEFAULT MOVED HER NAME AND NOTHING ELSE, kept
 *  in the discipline this file already keeps for every re-freeze: the diff is MEASURED before the
 *  constants are touched, never asserted afterwards.
 *
 *  The owner asked for the default player to be `Alice Martin` («я просил сделать дефолт на Alice
 *  Martin»). `DEFAULT_PROFILE.kidName` is the ONE line that moved, and `openCareer` spreads
 *  `DEFAULT_PROFILE`, so every career in this file was walked by a differently-named girl.
 *
 *  ⭐⭐ THE PER-KEY DIFF WAS TAKEN FIRST, on all three careers, against the branch's fork point in a
 *  separate worktree (`prologue/wave` at cd59f31c, the commit this branch forked from), headers
 *  checked on all six captures (`# preset N policy 1 weeks 156`), 72 hashed keys on every one:
 *
 *    · 5/0 (25k middle, grinder)              – **2 keys of 72: `profile` and `events`.**
 *    · 8/0 (120k wealthy, elite, grinder)     – **2 keys of 72: `profile` and `events`.**
 *    · 0/1 (8k working, self-coached, PLAYER) – **2 keys of 72: `profile` and `events`.**
 *
 *  ⚠ TWO KEYS AND NOT ONE, AND THE SECOND ONE IS HER NAME BEING PRINTED. `events` carries her name
 *  in its TEXT – 177 / 186 / 194 occurrences of the string across the three careers – so a career
 *  whose girl is called something else writes the same events with a different word in them. That
 *  is a rendering consequence of the field, not a second change, and the identity below is what
 *  says so at byte level instead of leaving it as an argument.
 *
 *  ⚠⚠ AND EVERY OTHER KEY IS BYTE-IDENTICAL, `rngMain` INCLUDED (which is the load-bearing half:
 *  no draw reads her name, so input-independence is untouched and the frozen MAIN capture in
 *  tests/condition.test.ts stands unmoved at 41550 / e6b0c709). `cohort` is byte-identical too, and
 *  it is worth naming because it CONTAINS the string 'Vera' 3 / 4 / 11 times: those are rival
 *  juniors drawn off the seed, they have nothing to do with the profile, and a diff that had moved
 *  them would have meant the name reached the FIELD. It did not.
 *
 *  ⚠ NO SCHEMA MOVED. `kidName` has been on `PlayerProfile` since v1 and nothing is added, so
 *  `SAVE_SCHEMA_VERSION` stays 69 and every `PRE_V*` identity below is re-stamped rather than
 *  re-aimed – each one still rolls its own version back on the world it is taken from.
 *
 *  ⭐ THE RECONSTRUCTION IS A RE-WALK AND NOT A PATCH, and that distinction cost a measurement.
 *  Setting `world.profile.kidName` AFTER `openCareer` reproduces every key except `events` – the
 *  career's OPENING events are written by `createWorld` and already carry the old name – so the
 *  override goes in before the world exists, which is what `openCareer`'s fourth argument is for. */
export function careerHashUnderTheOldName(presetIndex: number, policyIndex: number): string {
  return createHash('sha256')
    .update(JSON.stringify(walkFrozenCareer(presetIndex, policyIndex, undefined, { kidName: 'Vera' })))
    .digest('hex')
}
