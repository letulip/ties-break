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

import { expect } from 'vitest'
import { createHash } from 'node:crypto'
import { sponsorWindowClosesAt } from '../src/engine/offers'
import { physicalMean } from '../src/engine/development'
import type { PlayerProfile } from '../src/shared/protocol'
import { openCareer, stepCareerWeek, PRESETS, POLICIES } from '../tools/econ-bench'

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
  middleGrinder: '7221e296175e4d5c5d948b2ca119f0749dae780989ac1dfaa83000c54040075d',  /** PRESETS[8] · 120k wealthy family, elite coach · grinder policy (never travels)
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
   *  which is what a renumbered collision looks like from inside a fixture. */
  eliteGrinder: 'add71849dd0bb4d3fb108dff3f114714ef7f79b9504f18363ccc6d6343463e54',  /** PRESETS[0] · 8k working family, SELF-COACHED · player policy (switch on, nobody to send)
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
  selfTravelling: '9483832576c76819ef7af5108cd19d9c2106367463634c4179b1037703f6ba0e',}

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
export const PRE_V69 = {
  middleGrinder: 'bfd7f443e449f6494bb240f57936d159722c3185f4f03588f642fe3772ba6d19',
  eliteGrinder: '788c3019855633c1745d0704ada1b63883d0cbc792f8c5f6e8499c3c5f7d1493',
  selfTravelling: '5ecb5c3aa7ee68c4132c8e9342370a1d0df6c652a6532bfd12b13e248f3b4917',}

/** ⭐⭐ THE SAME THREE CAREERS AS THEY HASHED WHEN THE DEFAULT GIRL WAS CALLED `Vera` – the identity
 *  that proves the 02.09 re-stamp moved HER NAME and nothing else. These are the verbatim v69
 *  constants as they stood at `prologue/wave` cd59f31c, and `careerHashUnderTheOldName` reproduces
 *  all three byte for byte by walking the same career with `kidName: 'Vera'` put back before birth.
 *
 *  ⚠ IT IS NOT A SCHEMA ROLL-BACK, so it is `careerHashUnderTheOldName` and not `careerHashAtSchema`
 *  that reproduces it – the same distinction `PRE_R28B` makes, and for the same reason: what moved
 *  is a VALUE a career carries, not a version number stamped on it. The per-key diff, the two keys
 *  it moved and why the second one is her name being printed are on that function. */
export const PRE_NAME_VERA = {
  middleGrinder: '69d0c91b32f5b4887916f7ef75277a4e523d629c0a28b39c9cb807478690b71b',
  eliteGrinder: '45637f25400c50612ce94f6bdc01fec05150f6c524e1cb1830b8050deec1f3cf',
  selfTravelling: 'bf63a4b2804fb68fd1c3fb117b95fdeb8d83813b3873ce4f17b77766fd1d4d0e',}

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
  middleGrinder: 'c9d9365ebffc3042d36f4a1c6aeb2ca9cd68302f0d837438876495676c13fb78',
  eliteGrinder: 'bf21097f5ebd72170a43a160ebb3a5d22544a280e41840d347f07a5b97e4dbd9',
  selfTravelling: '759d232cc2d4e4d1de95f84157b75f1762e294fb089b7c8546568df6eb3a31d2',}

export const PRE_V67 = {
  middleGrinder: '4dbb2b451125c65b7a96ac8b822eee217cced395cb757a22c6662044467efccf',
  eliteGrinder: 'e9f4df9c6b71c1d568f0669fb5e2a3f63cf8e1a41097033089e27f6f6d1ed705',
  selfTravelling: '30cb81893ef1fe87b8c6ff66479998652531ae4749c545e96fa19f72d59608e4',}

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
  middleGrinder: 'a73621cc5024464eed6f5ff60205bf16da4cd8e3adc22b532d1e872051e0c72a',
  eliteGrinder: 'e829801d144faef389c500e373c6ee198188212fdf3dbc013de43b45ee3c00f1',
  selfTravelling: '2e3742ac45973ecbb5a3907fb544232d9463b85782fe3bbc247d036e8672190c',}

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
export const PRE_R28B = {
  middleGrinder: '7221e296175e4d5c5d948b2ca119f0749dae780989ac1dfaa83000c54040075d',
  eliteGrinder: '048e21b55e2febe0b2c0846b2587b9b1c0cd58acceeb5d3be0ac94f4b45da7f2',
  selfTravelling: '9483832576c76819ef7af5108cd19d9c2106367463634c4179b1037703f6ba0e',}

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
  middleGrinder: '5dc5f36a6a1862b105243afeff90936c4dcfaba63ac2f2a162352be28ff4a4ac',
  eliteGrinder: '170b3ea47e87cb0ced6e98d6056e6beb577563572f174a8b3e3c795de03a43cc',
  selfTravelling: 'ec5852b6004db17522ea24345ada1a5eb74b262f7e206f2a0d820a18e49f39cb',
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
  middleGrinder: '4e2fc724eea51f3dd2998fafb470b91bfa2e3027e9b77102b033a55fa064a08b',
  eliteGrinder: 'f2eff30bc3df270c1325bd737d8da8a7ea202160d3c3399c7d3d47baf5072fa2',
  selfTravelling: '16b8142f731ba539d60f94ddfed362a25699ee3d248c8ae41cc0ba4f015ad7cb',
}

/** ⭐ THE SAME THREE CAREERS AS THEY HASHED UNDER v58 – the identity that proves the v59 re-freeze
 *  (the masseur, travelling team step 1) moved the schema number, ADDED one inert key, and touched
 *  nothing else. These are the v58-era `FROZEN` values verbatim; `careerHashAtSchema(…, 58)` drops
 *  the key v59 added before hashing, because a v58 serialisation never held it. */
export const PRE_V59 = {
  middleGrinder: 'a7a08b68ae8369ffe9ac86e9945925b98f0982a190e19531d52a1f2a592dab02',
  eliteGrinder: 'c020ef625b806c90ff6044eaa7e83ba7322ab254d95eb3f1cb546f3a9aec0e85',
  selfTravelling: '7d733d427b102dfd21026e436cdecdec942c19503a019c8a4fb2a13b48162976',
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
  middleGrinder: 'ed64798a8c860d64dd521bbf6733b0d2443dc09559d70795a8f8b6e555f76a1b',
  eliteGrinder: '2a5a63a11cfa76eafb12ddb0dbff9446c2007834bc936ae9cfe72372ea7e0a43',
  selfTravelling: 'f21d5b8f072ef4a38491e79b9de0099597bcc215784f5fd10f01edaa03704be7',
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
  middleGrinder: '23840384ca420f20653863bcbb3c01d2d0a788cb9a8f5ff67a42cee43b3cda63',
  eliteGrinder: '0343c5591e41219135cf4a6a2040c00cb33cff87852c0ee08e88a9cc55fd327d',
  selfTravelling: '72228f4261134ef3c15c045b20ed29e69d32cfac95da85417cc51d3779cf5b64',
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
  middleGrinder: '55d222e9e825799eaff8d34ba4bc2745a0c90f66cf741e09523d97d83bf40498',
  eliteGrinder: 'c11d4d4b034f5e4beabb1dc4cc5ce114ad1e7964bd65d21a3ea91a37e05e5ffc',
  selfTravelling: 'e1494ca9e2ce19e10d71a62764c1f4808f4277a41ffb55b271cea0103e43225a',
}

export const PRE_V63 = {
  middleGrinder: 'ff87a601fec47d421cfa41d7ab0fe3fe3b675982ff31f916085a0ed958a8e32b',
  eliteGrinder: 'ae840c1142a86681463501ad323fcd9199f6f9ccfcddb415f645ef0a2ebf01e0',
  selfTravelling: 'e20d4a6bf95d5fbfa5b4b810490994623bcc08385deeb7b6ebe8ed89a0fe9df6',
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
  middleGrinder: '82d41c0d79516597f89775f7903b72778c39b11c465f5d1d453d23a7e66bc046',
  eliteGrinder: '88181aeaa8a66dc54dd97a73bdd85121c4b43f901bc07370c1d85e9e0af2939c',
  selfTravelling: '83a2426eb94f5b0f69c7046de480efdee823625ff44bd620c42038d0a290c437',
}

/** ⭐ THE SAME THREE CAREERS AS THEY HASHED UNDER v59 – the identity that proves the v60 re-freeze
 *  (round 26 #6, the College League walked through the tour's flow) moved the schema number and
 *  NOTHING ELSE. These are the v59-era `FROZEN` values verbatim, and unlike v59's rollback no key
 *  is dropped before hashing: v60's new field is `college.leagueReveal`, nested inside a
 *  `CollegeState` that is null in every one of these careers, so their top-level serialisation is
 *  the same 69 keys it was. */
export const PRE_V60 = {
  middleGrinder: 'cab2828183832e124afe5415b9a6fa75dba94de6af97041dcb23842347909710',
  eliteGrinder: '8aa5d607db12922df533c42f87500de1f9defe351916345e9117b40ca6ca05dc',
  selfTravelling: '4262f0ad9a323708e9952709c0123c68db916734d41b8ec99d1fb14d641b4e50',
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
  middleGrinder: '5cd76dfd20a706e5f77b7500f55d53313b17d1c33ad62533fd47abf605288e29',
  eliteGrinder: 'a184e1bb21645a9645331946a50095241709996c7f92acc1aec2e4a5f58ff1b9',
  selfTravelling: '26aed0a3f833bca11b87f69976a35a3b5b17b333ca1aa78da011670d7e556a58',
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
  middleGrinder: '3b0cad273c01e060d13c44954c31bd197e0773b641aeb567748bd26b089953d9',
  eliteGrinder: '13142e2a629ea87ae07c67a51cd818f881062cab62f048c0600f36c5ef47bb26',
  selfTravelling: '1d06c069277e0ed88a509151e57fd48dbf9002ee2471a239eb7845c424713004',
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
  middleGrinder: 'db756021cc42d61e50997430aabd87b3595dee8d11890c3109cb0801009de73b',
  eliteGrinder: '07ca5941e4a9778f9d7a3d3683e673b8f7b3019c0312f08db496aa3d22a1caf5',
  selfTravelling: '4982624cff392d65c0cbe1c56d41cae2786e22e8c413aee85303e4f72c62c675',
}

/** ⭐ THE SAME THREE CAREERS AS THEY HASHED UNDER v50 – the identity that proves the v51 re-freeze
 *  moved ONE key and nothing else. */
export const PRE_V51 = {
  middleGrinder: 'a261f2fadff6df0b9772785f68ba02ed8b8d9fdb3cd3575c4a8b54a1adf14736',
  eliteGrinder: '90f9e314f22454c8ced7e64e77937efe04f08dfd0f4a069052dac4a0134cda8a',
  /** ⚠ MOVED WITH THE FREEZE ABOVE (17.08, round 21 #2b) AND THAT IS THE HONEST OUTCOME, not a
   *  weakening. The v51 case asks "does rolling ONLY the schema back reproduce the v50 hashes" – and
   *  for the two grinders it still does, untouched. For THIS career it no longer can, because the
   *  wild cards changed the career itself and not a schema field: rolling the version back on a
   *  different season cannot produce the old season. The identity is re-anchored to the new world, so
   *  it goes on doing its job – if a LATER wave moves this career through anything but
   *  `SAVE_SCHEMA_VERSION`, this line goes red beside the freeze exactly as it just did. */
  selfTravelling: 'e31f5a783050de3ec3a2bdc160af4eca2036881195879790cfece7689d76dea8',
}

/** ⭐ THE SAME THREE CAREERS AS THEY HASHED UNDER v49, kept so the re-freeze above can PROVE its own
 *  claim rather than assert it. See the paragraph on `FROZEN`. */
export const PRE_V50 = {
  /** ⚠ MOVED WITH ITS TWINS A THIRD TIME (17.08, round 21 #4). These two grinder hashes had held
   *  across every previous wave, and they moved here for the reason the block on `FROZEN` records in
   *  full: the WTA 250's field changed, so the tour NEWS in `events` changed, and `events` is inside
   *  the hash. The rollback identity itself is untouched in meaning – swapping only `schemaVersion`
   *  on the new world still reproduces exactly this, which is what these three lines are for. */
  middleGrinder: 'db7b8aab80e1ef1dcac072f793f1ad5c022b9d9dd219fd51b8b129c3c1d01700',
  eliteGrinder: '9ff077a82d37a21b1f8051dc2b0cc25d2c9e3dc26aa33257e837703e1b8f4133',
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
  selfTravelling: '359f8139839da4233ef1013779aaf9f28231ae0ae377988054d1a703ff9857ef',
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
  const { brandStrengthSeed: _pin, ...preSeed } = world
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
