import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import {
  createWorld,
  tickWeek,
  enterEvent,
  advanceWeeks,
  accrueCondition,
  availabilityStatus,
  entryStatus,
  isBlackoutWeek,
  medicalBlock,
  medicalClearance,
  restRecoveryBonus,
  summerBlockWeek,
  summerConditionCost,
  summerLoadFactor,
  toSnapshot,
  skipTournament,
  closeTournament,
  inTrack,
  KID_ID,
  type WorldState,
} from '../src/engine/world'
import { BEST_N_BY_TRACK, computeRanking } from '../src/engine/season/ranking'
// v47: the week joins the RNG-invariance sweep – see the ⚠ in `variants` and B1d below.
import { planFromWeek } from '../src/engine/plan'
import { SESSION_KINDS, type SessionKind } from '../src/shared/protocol'
import { rngFromSeed } from '../src/engine/rng'
import { ECONOMY } from '../src/engine/economy'
import { SUMMER_WEEKS, TIERS, TIER_LADDER, WEEKS_PER_YEAR, isSummerWeek } from '../src/engine/season/calendar'
// The holidays' ceiling is a REAL-CALENDAR fact since round-16 #16 - see `isSummerWeek`.
import { weekMonth } from '../src/shared/dates'
import type { SeasonEvent, TierId } from '../src/engine/season/types'

/** ⚠ W4: PUT THE CAREER INSIDE THE KNOCK COOLDOWN, so the advance under test cannot be interrupted.
 *
 *  The tests below assert a SPECIFIC stop reason, and a knock does not merely add a second reason -
 *  it BLOCKS the advance (`advanceWeeks` returns early and ticks nothing). Answering it and pressing
 *  on is not equivalent either, because the deadline check is a PRE-TICK guard gated on `i > 0` (so a
 *  single step always progresses): a restarted advance skips it, which is exactly how the first draft
 *  of this fix walked past the deadline it was asserting.
 *
 *  So the fixture states, in world terms, "she had a knock last week": one retired row puts her inside
 *  KNOCK_COOLDOWN_WEEKS and nothing new can arrive for four weeks - longer than any advance here. A
 *  legitimate world state, not a switch, and it leaves the reason under test the only one in play. */
function noKnocksFor(world: WorldState): void {
  world.knockHistory = [{ part: 'wrist', sinceWeek: world.week, untilWeek: world.week, choice: 'rest' }]
}


// ---------------------------------------------------------------------------
// Season-Life slice B — condition/fatigue + availability gate.
// ---------------------------------------------------------------------------

// FNV-1a over the stringified draw stream: a compact, order-sensitive fingerprint
// of the MAIN RNG sequence (see B1).
function fnv1a(s: string): string {
  let h = 0x811c9dc5
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return (h >>> 0).toString(16).padStart(8, '0')
}
function hashOf(draws: number[]): string {
  return fnv1a(draws.map((d) => d.toString()).join(','))
}

// Add a controlled event to a world's calendar (id-targeted, so the generated season
// around it is irrelevant). deadlineWeek defaults to week - 2 (the engine convention).
function injectEvent(world: WorldState, partial: { week: number; tier: TierId; id?: string; deadlineWeek?: number }): SeasonEvent {
  const e: SeasonEvent = {
    id: partial.id ?? `inj-${partial.week}-${partial.tier}`,
    week: partial.week,
    tier: partial.tier,
    surface: 'hard',
    travelCostCents: 100_00,
    deadlineWeek: partial.deadlineWeek ?? partial.week - 2,
  }
  world.season.push(e)
  world.season.sort((a, b) => a.week - b.week)
  return e
}

function giveKidPoints(world: WorldState, points: number): void {
  world.results.push({ playerId: KID_ID, week: world.week, points, tier: 'national' })
}

// ---------------------------------------------------------------------------
// B1 — THE INVARIANT (blocks merge). The MAIN RNG stream must never depend on
// player input, funds, plan, or condition — proved PAIRWISE, baseline against
// action-laden run, under the same code. Reference values captured from the
// step-1c-stubbed (pre-slice) build for seed "bench-working-0", weeks 1..52.
//
// ⚠ DOWNGRADED AT v35 FROM LOAD-BEARING TO DOCUMENTATION (P3, rng-persistence).
// Until v35 this count/hash was a CHANGE-GATE: the load path rebuilt every
// career's stream position by replaying its weeks, so the per-week draw count
// had to be stable across code versions or every loaded save silently moved
// onto the wrong draw — and any feature adding a MAIN draw was forbidden, on
// pain of the re-pin ritual this comment block's own history documents three
// times. The position is now PERSISTED PER CAREER (`WorldState.rngMain`) and
// a load verifies-and-resumes, so no career anywhere depends on the historical
// count being reproducible. What this REF is now: the documented measurement
// of what a bench-working-0 year costs the main stream — kept because it makes
// an ACCIDENTAL drift loud and the composition arithmetic below it legible.
// A wave that legitimately adds, removes or reorders a MAIN draw UPDATES THESE
// NUMBERS FREELY (and the migration-replay pin in tests/migrations.test.ts
// with them, consciously — see the tripwire note there). What it must still
// prove is the PAIRWISE half: its action arm and its baseline arm tap
// identical sequences. Player choices cannot re-roll the world's dice; that
// half is permanent, and it is the half every test below asserts.
// ---------------------------------------------------------------------------
//
// ⚠ RE-PINNED, FOR THE LAST TIME A CALENDAR CHANGE CAN DO IT: 51642 -> 41550, hash cae178fc ->
// e6b0c709 (the AI sub-stream refactor). History of this number: 45239 (pre-ladder) -> 51642
// (ladder-up Part B, the J family) -> 41550 (here).
//
// WHY IT MOVED, AND WHY IT STOPS MOVING NOW. The two previous moves were forced by the same
// design flaw: the canonical AI tournaments drew from the MAIN weekly stream – one draw per
// entrant-band candidate plus one per AI-AI match, per scheduled event – so the calendar's SIZE
// was part of the weekly draw count. Any content change (a new tier, a denser cadence, one extra
// event) re-based this pin by construction; the ladder-up slice moved it for exactly that reason.
//
// The AI bracket now runs on its own EVENT-scoped stream `seed:aitour:<event.id>`, the mirror of
// the kid's `seed:kidtour:<event.id>`. What is left on the main stream is base costs + cohort
// drift and nothing else: 52 x (4 x 199 cohort drift + 3 base costs) + 2 sponsor-gift draws =
// 41550. That is a function of the COHORT SIZE and the career length, not of the calendar – so
// from here on, adding tiers and events is free and this pin no longer moves with content. The
// composition is proved exhaustively, week by week, in B1b below.
//
// WHAT DID NOT MOVE – the property this test actually exists to protect: the per-week draw count
// is still INDEPENDENT of player input. Every other test in this describe block is untouched and
// green: condition/plan/funds/physio variants, entering and playing an event, planner bookings
// (P1), a mid-run injury (C1), a post-deadline skip (R9-9).
//
// NOTE ON hash/head/tail: `recordRun` taps the RAW generator, so `draws` is by construction the
// first N outputs of rngFromSeed('bench-working-0'). hash and tail are therefore pure functions of
// N and carry no information beyond `count` (head is N-independent and never changes). They are
// kept because they make an accidental drift loud, but the real guards are the variance tests.
const REF = {
  count: 41550,
  hash: 'e6b0c709',
  head: [
    0.29022555728442967, 0.879210032755509, 0.9903593938797712, 0.8499038522131741, 0.3840416269376874,
    0.6166684734635055, 0.3415204482153058, 0.8582294869702309,
  ],
  tail: [
    0.09633621200919151, 0.14082618593238294, 0.7656564658973366, 0.16811327124014497, 0.9865698856301606,
    0.8267154651694, 0.7829126522410661, 0.4907760114874691,
  ],
  // 131 (pre-slice) -> 143 (Part A, cohort pre-history) -> 141 (Part B, the J family) -> 140 (the
  // AI sub-stream) -> 141 (RIVALS BECOME REAL). A CONSEQUENCE of the stream, never the stream
  // itself: the point-less kid shares the dense rank of the whole 0-point group, so this number is
  // just "how many AI ended the year holding counting points".
  //
  // ⚠ RE-PINNED 140 -> 141 BY THE RIVAL-LIFE SLICE, DELIBERATELY. Rivals now arrive at a draw
  // carrying the fatigue of their own recent schedule and coloured by how their style suits the
  // surface, so AI-vs-AI matches resolve differently and a different set of juniors ends the year
  // in the points – one fewer, here. That is the POINT of the slice. What did NOT move, and is the
  // thing this test exists to protect, is everything above: count 41550, hash e6b0c709, head and
  // tail are all byte-identical, because both halves are pure derivations that draw no RNG.
  // 141 -> 140 at wave-3 integration: the surface x style table changes which of her matches she wins, so a different junior ends the year holding counting points. The STREAM is untouched (count/hash identical) - only the ranking derived from it moved.
  //
  // ⚠ RE-PINNED 140 -> 133 BY WAVE B "first-round loss pays ZERO" (tune/first-round-zero),
  // DELIBERATELY, and it is the LARGEST move this number has ever made. Mechanism, in one line:
  // `awardAiPoints` only writes a ledger row when `points > 0`, so with every tier's first-round
  // value now 0, the ~half of each 32-draw that loses its opener stops banking anything at all.
  // Seven fewer juniors end the year holding counting points, and the kid – still point-less at
  // week 52 in this fixture – shares the dense rank of a 0-point group that is now seven larger.
  // The number means exactly what the note above says it means ("how many AI ended the year
  // holding counting points"), so a DROP here is the change landing, not a regression.
  // The STREAM is untouched and that is the whole point of this test: count 41550, hash e6b0c709,
  // head and tail all still byte-identical, because points are post-draw arithmetic – they are
  // read off a table AFTER the bracket has already been resolved by the RNG.
  // ⚠ RE-PINNED 133 -> 135 (29.07, partial seeding). `count`/`hash`/`head`/`tail` above did NOT
  // move - the main stream is untouched, which is what this block guards. Her RANK moved, because
  // the bracket now seeds the top 8 and shuffles the rest, herself included.
  // ⚠ RE-PINNED 135 -> 126 (29.07, the two ladders). `count`/`hash`/`head`/`tail` did NOT move; the
  // stream is untouched and that is what this block guards. What moved is the MEANING of kidRank: it
  // is now her place in the ITF table, not in a single mixed one, so it is a different number about a
  // different question. See docs/specs/two-ladders.md.
  // ⚠⚠⚠ AND THE TWO ROUND-15 SLICES BOTH TOUCHED THIS FIELD, from opposite directions. Both notes
  // below are kept because both facts are live: the fifth attribute (v25) re-derived the number and
  // found it unmoved, and the ranking fix changed what the number MEANS. The value here is measured
  // with BOTH in, not carried over from either branch.
  //
  // ⚠⚠ RE-PINNED 126 -> 119 (30.07, fix/ranking-truth) - AND THE RE-PIN ABOVE WAS WRONG.
  //
  // READ THIS BEFORE TRUSTING THAT LAST PARAGRAPH. It claimed 126 was "her place in the ITF table".
  // It was not. `recomputeRankAndMilestones` - the weekly tick's step 5, and the LAST writer of
  // `world.kidRank` in every code path - still called `computeRanking(results, week, ids)` with NO
  // track predicate, so it folded BOTH ladders into one table and wrote that mixed place into the
  // field. `recomputeKidRank` did write the real ITF rank, but only at `createWorld` and at
  // migration, so every tick overwrote it. 126 was the MIXED number wearing an ITF label.
  //
  // 119 is the ITF rank, and it is now the ITF rank BY CONSTRUCTION rather than by coincidence:
  // `recomputeRankAndMilestones` defers to `recomputeKidRank`, the one writer. Checkable against the
  // definition this block already states above ("how many AI ended the year holding counting
  // points"): at week 52 of this fixture 118 AI hold counting ITF points, and the point-less kid
  // shares the dense rank of the 0-point group -> #119. The mixed table has 125 point-holders ->
  // #126, exactly the old number. The arithmetic says which table each number came from, so this
  // re-pin is verifiable rather than a matter of taste.
  //
  // WHAT DID NOT MOVE - and it is the whole reason this is a companion field rather than the capture:
  // `count` 41550, `hash` e6b0c709, `head` and `tail` are BYTE-IDENTICAL, re-derived on this branch
  // both before and after the fix. Nothing in the fix draws; it swaps which of two pure folds over an
  // existing ledger gets cached in a field. THE FROZEN MAIN CAPTURE HAS NOT MOVED and must not be
  // re-pinned for this.
  //
  // Four items on the owner's 30.07 playtest list were this one bug: Home and the season wrap-up read
  // `world.kidRank` (mixed, #4) while the Stats table rendered `computeStandings` (ITF, #128); the ITF
  // acceptance gate compared a mixed rank against an ITF acceptance list; and `kidRankDomestic` was
  // never refreshed after `createWorld`, so it held its week-0 value for a whole career (75 here,
  // against a true 100). B1c below pins the one-writer property directly, so this cannot come back.
  // ⚠ 121, MEASURED WITH BOTH ROUND-15 SLICES IN. The ranking fix alone gives 119; v25's rally term
  // changes which juniors end the year holding points, and the two compose to 121. Neither branch was
  // wrong - this is the number the merged code produces, and it was measured here rather than carried
  // over from either side. Same check as before: it is the ITF fold, and the mixed fold is elsewhere.
  // ⚠⚠ RE-PINNED 121 -> 120 (30.07, task 55's COHORT HALF), and the four numbers above are the reason this
  // is a re-pin and not a regression: `count` 41550, `hash` e6b0c709, `head` and `tail` are asserted BEFORE
  // this line and every one of them still passes byte-for-byte. The stream did not move, and it could not
  // have: the cohort's birth months come off their own `seed:aibirth:<id>` sub-stream and the head start is
  // arithmetic applied AFTER `makeJunior`'s thirteen draws, so neither the count nor the order of a single
  // main-stream value changed.
  //
  // WHAT MOVED IS WHO IS GOOD. Every rival now sits somewhere inside her own birth year, so the older girls
  // in each band are a point or so stronger and the younger ones a point weaker - which changes who wins
  // brackets, which changes which juniors end the season holding counting points, which moves the dense
  // rank the point-less kid shares by one place. One place, from a change that touches all 199 of them,
  // is the size of effect to expect from a ~1.1-point shift inside a 30-70 spread.
  //
  // ⚠⚠⚠ RE-PINNED 120 -> 164 (31.07, task #17, THE ADULT RUNGS), and this is the one number in this
  // object that moved. Read the four above it first, because they are the whole argument: `count`
  // 41550, `hash` e6b0c709, `head` and `tail` are asserted BEFORE this line and every one of them
  // still passes byte-for-byte, re-derived on this branch. THE FROZEN CAPTURE DID NOT MOVE. It could
  // not have, and the reason is written down in tests/round9.test.ts: the AI sub-stream refactor took
  // the calendar's SIZE out of the weekly draw count ("re-pinned, for the last time a calendar change
  // can do it"), so adding forty-seven events a season to the calendar costs the main stream exactly
  // nothing. This branch is the first change to test that claim in anger, and it holds.
  //
  // WHAT MOVED IS HOW MANY JUNIORS OWN A COUNTING RESULT. The calendar went from 92 events a season
  // to 139, so far more of the cohort ends the year holding points - and the kid, who holds none,
  // shares the tie at the FLOOR of the table with correspondingly fewer people, which pushes the
  // dense rank they all share downward. It is the same mechanism as the 121 -> 120 note above, at
  // forty times the scale: she did not get worse, the table got fuller underneath her. The number is
  // deliberately kept in this object and asserted right after the four capture values, so the next
  // person to see it move has the disproof of "the capture moved" on the four lines above it.
  //
  // ⚠⚠⚠ RE-PINNED 164 -> 154 (31.07, §4.1, THE JUNIOR AGE CAP - `maxAgeYears: 18` on j30/j60/j300).
  // Read the four above it first, exactly as the note above demands, because they are again the
  // whole argument: `count` 41550, `hash` e6b0c709, `head` and `tail` are asserted BEFORE this line
  // and every one of them still passes byte-for-byte. THE FROZEN CAPTURE DID NOT MOVE.
  //
  // AND THIS BRANCH IS THE HARDEST TEST THAT CLAIM HAS HAD. The adult-rungs slice argued the capture
  // was safe because the calendar's SIZE had left the weekly draw count; this slice changes
  // something strictly more dangerous - the NUMBER OF DRAWS `selectEntrants` SPENDS PER EVENT. The
  // age gate narrows the candidate pool on the three J rungs, so their per-event draw count really
  // does move and a J30 field really is different people. The main stream still does not notice,
  // and the reason is structural rather than lucky: every draw selectEntrants spends comes off the
  // EVENT-scoped `seed:aitour:<id>` / `seed:kidtour:<id>` sub-stream, while the MAIN stream carries
  // base costs plus `driftCohort`'s four draws per rival per week - which is literally what 41550 is
  // made of. "A narrower candidate pool cannot move the capture" is now measured, not argued.
  //
  // WHAT MOVED IS THAT THE ITF TABLE FINALLY AGES PEOPLE OUT. The J rungs are U18, so a rival who
  // turns 19 stops entering them; her existing ITF results then roll out of the 52-week ranking
  // window and are never replaced, and she drops to the tie at the floor. The table above the
  // point-less kid is therefore SHALLOWER by about ten distinct totals, so the dense rank she shares
  // improves by ten. She did not get better - the juniors above her graduated, which is exactly what
  // a real junior ranking does and what our ITF table has never once done before this commit. It is
  // the same mechanism as the 120 -> 164 note above, running in the opposite direction and for a
  // better reason: that number moved because the table got FULLER, this one because it now EMPTIES
  // at the top the way the sport does.
  // ⚠ RE-PINNED 154 -> 150 AT THE round-20 MERGE, and the number is why this had to be re-derived
  // rather than resolved. `fix/no-double-booking` measured 162 on its base and `feat/junior-age-cap`
  // measured 154 on its own; neither is the answer, because BOTH make the table above a point-less kid
  // shallower and they stack. A rival can no longer play two of a week's tournaments, and a rival
  // turning 19 now ages out of the J rungs and her results roll out of the 52-week window unreplaced -
  // so fewer distinct totals sit above a girl who holds none. Taking either side's pin would have
  // shipped a number nobody had measured. The STREAM is untouched: count 41550 and hash e6b0c709
  // reproduce byte-for-byte, which is what this block actually guards.
  // ⚠ RE-AIMED 150 -> 151 BY THE EQUIPMENT / SERVE-SPEED SLICE (docs/specs/equipment-and-serve-speed.md),
  // and this is the SECOND time this pin has moved for the reason its own note above predicted: the
  // match model gained a leg, so asymmetric matchups resolve differently and a different set of
  // juniors ends the year in the points. Two legs were added this time - her kit multiplies her
  // attributes at the composition point, and `basePServe` gained a PACE term keyed on the age gap.
  //
  // ⚠ THE CAPTURE ITSELF DID NOT MOVE, AND THAT WAS CHECKED BEFORE THIS LINE WAS TOUCHED: count 41550
  // and hash e6b0c709 reproduce byte-for-byte, verified directly against a raw-tapped 52-tick run. It
  // cannot move by construction either - equipment condition is `week - lastPurchaseWeek` over a
  // constant, the purchase weeks come off the `seed:gear:<category>` sub-streams that already existed,
  // the shoe/injury term is a POST-DRAW multiply on a threshold `rollInjury` has already drawn
  // against, and the pace term is pure arithmetic inside `basePServe`. Zero draws are added to, or
  // removed from, any stream the weekly tick walks.
  //
  // So the STREAM is the invariant and the RANK is a measurement: 151 is one place lower off a
  // point-less kid in a shallow table, which is what a girl whose strings are four weeks old looks
  // like next to a cohort that has no kit at all.
  // ⚠ RE-PINNED 151 -> 152 BY R15-6 (01.08, the W-family reprice), the same class of move this pin's
  // own history documents twice already. TWO of the three levers reach this fixture and both are
  // post-draw: the W availability floors (60/65/70 -> 50/55/60) govern which SIXTEEN-PLUS RIVALS are
  // fit to take a W15/W35 draw in the kid's first season, and the W surcharges (6/7/8 -> 4/5/6) set
  // what those weeks cost them - so a different set of juniors ends the year in the points and her
  // dense ITF place moves by one. Attributed by partial revert (scratchpad probe, R15 report): floors
  // alone -> 157, surcharges alone -> 138, the per-family run ladder alone -> no effect at this
  // horizon; ALL THREE reverted reproduces 151 exactly, so nothing else in the round touches this
  // fixture. THE CAPTURE ITSELF DID NOT MOVE: count 41550 and hash e6b0c709 reproduce byte-for-byte
  // (asserted first, in this very test), which is what this block actually guards - fatigue,
  // availability and rival condition are all post-draw arithmetic by construction.
  // ⚠ RE-PINNED 152 -> 138 BY W2-LADDER (the three new W rungs), the calendar-shape move this pin's
  // history has absorbed at every ladder change. TIER_LADDER grew 9 -> 12, so `tierPhase` (0.5 +
  // index/length) re-spaces every tier's ideal weeks and the whole calendar re-deals: same counts
  // per rung for the old nine, different WEEKS, therefore different event ids, different
  // `seed:aitour:<id>` sub-streams, and a different set of juniors ends the year holding counting
  // points. Post-draw composition change end to end - count 41550 and hash e6b0c709 reproduce
  // byte-for-byte, asserted lines above this number.
  // ⚠ RE-PINNED 138 -> 137 BY W2-FIELD2 (the W family's entrant windows re-measured). `selectEntrants`
  // is ONE function, so a W rung's `entrantPctBand` is read by the CANONICAL `seed:aitour:` brackets
  // as well as by her shadow draws: the family's floors rose (w15 0.15 -> 0.35, w35 0.08 -> 0.25, and
  // so on up), a different slice of the 199-cohort is therefore drawn into the W events, and
  // `resolveDoubleBookings` leaves a different set of girls free for the same week's J draws. A
  // different set of juniors ends the year holding counting ITF points and her dense place moves by
  // one - the same post-draw composition mechanism every re-pin above records. THE CAPTURE ITSELF IS
  // UNTOUCHED: count 41550 and hash e6b0c709 reproduce byte-for-byte.
  // ⚠ RE-PINNED 137 -> 125 BY W2-FATIGUE (the fatigue re-price, docs/specs/fatigue-reprice-2026-08.md).
  // `recoveryBase` went 1 -> 8, so EVERY body in the world - the kid's and all 199 rivals', through
  // the one shared `rivalCondition` reconstruction - carries a different condition into every week.
  // Condition is an input to `conditionMatchFactor`, which scales a player's strength below the knee,
  // so a fresher field resolves brackets differently and a different set of juniors ends the year
  // holding counting ITF points. Her dense place among the point-less improves by twelve: she did not
  // get better, the table above her got shallower - the same mechanism as every re-pin above, driven
  // this time by the one knob that reaches every player at once.
  // THE CAPTURE ITSELF DID NOT MOVE, and it cannot: count 41550 and hash e6b0c709 (plus head and
  // tail) are asserted BEFORE this line in this very test and reproduce byte-for-byte. Condition is
  // post-draw arithmetic end to end - `accrueCondition` draws nothing on any stream, and the strength
  // coupling is a multiplier applied inside the EVENT-scoped shadow tournament.
  //
  // ⚠ RE-PINNED 125 -> 123 BY W2-WINDOW, and the mechanism is the calendar rather than a rule.
  // Placement is seeded now (`buildSeason` spent its seed on surfaces and travel only, so every
  // world played the same weeks for ever) and every tier's count is measured against the PLAYABLE
  // span instead of the calendar year - so the cohort meets a different set of draws and a
  // different set of juniors ends the year holding counting points. THE CAPTURE ITSELF DID NOT
  // MOVE and could not: count 41550 and hash e6b0c709 (plus head and tail) are asserted above this
  // line in this very test and reproduce byte-for-byte, because the placement jitter is drawn from
  // a purpose-scoped sub-stream (`:calweek:`) and never from MAIN.
  //
  // ⚠ RE-PINNED 123 -> 121 BY W2-WINDOW'S DOMESTIC RE-PRICE (tierMatchFatigue 0/1/2 -> 1/2/3).
  // The cohort runs the same condition math the kid does, so a dearer domestic week resolves the
  // year's brackets on a slightly more tired field and a different set of juniors ends it holding
  // counting points. Post-draw arithmetic again: count 41550 and hash e6b0c709 are asserted above
  // and reproduce byte-for-byte.
  //
  // ⚠ RE-PINNED 121 -> 123 BY W3-ACT2, and it is the same mechanism a fourth time: CONTENT, not a
  // rule. The four act-3 rungs put 30 more events a season on the calendar, so the cohort is drawn
  // into 30 more draws, arrives at the rest of the year fractionally more tired, and a different
  // set of juniors ends it holding counting ITF points. Post-draw arithmetic end to end - every
  // one of those brackets runs on its own `seed:aitour:<id>` sub-stream - so count 41550 and hash
  // e6b0c709 are asserted above this line and reproduce byte-for-byte.
  //
  // ⚠⚠ RE-PINNED 123 -> 89 BY W3-FIELD3 (04.08), and this one is a RULE rather than content - the
  // biggest move this companion has taken since the adult rungs, and worth reading as a measurement
  // of the wave rather than as an update. The W-track canonical brackets now draw from LIVE cohort ∪
  // 364 derived professionals, and a professional leaves no ledger row, so the ~98 W events a season
  // stop landing on the cohort entirely: W result rows per rival over a 20-week window measure 6.79
  // before the seam and 0.00 after. The juniors therefore end the year fresher (median condition 28-36
  // -> 95-100, tests/rivals.test.ts C2) and play out a year of J draws that resolve differently, so a
  // different set of them ends it holding counting ITF points and she sits 34 places higher among
  // them. SHE DID NOTHING DIFFERENT - this fixture's kid is the stub build and enters nothing.
  //
  // THE CAPTURE ITSELF IS UNTOUCHED, WHICH IS WHAT THIS TEST IS FOR: count 41550, hash e6b0c709,
  // head and tail are all asserted ABOVE this line in the same test and reproduce byte-for-byte on
  // this branch. Every draw the wave moved is on a `seed:aitour:<id>` sub-stream; MAIN still carries
  // base costs + `driftCohort`'s 4 x 199 and nothing else.
  // ⚠⚠ RE-PINNED 89 -> 90 BY W3-ONRAMP (04.08) – a RULE again, and the exact counter-move to the one
  // above. W3-FIELD3 took the ~98 W events a season off the cohort entirely and this wave hands a
  // SHARE of them back: a W draw holds `ON_RAMP.slots` (2 of 32) for LIVE players who clear the rung's
  // own acceptance door – the kid's door, asked of a cohort id. Measured, tools/w-onramp-probe.ts:
  // LIVE W ledger rows 0.0 -> ~125 a season (~0.6 per cohort player), against ~3,170 before
  // W3-FIELD3. So a couple of dozen juniors of the 199 now hold counting W points, and a table sorted
  // on points puts them ahead of a kid who holds none. Note the SIZE and the direction: two places,
  // downward - the W rows the cohort now earns are on a DIFFERENT track from the one this number folds,
  // so what reaches it is the second-order re-deal of who ends the junior year in the points, not the
  // professional table itself. SHE DID NOTHING DIFFERENT – this fixture's kid
  // enters nothing at all, which is the cleanest possible statement of "the world moved, not her".
  //
  // THE CAPTURE AND THE A/B ARE UNTOUCHED, WHICH IS WHAT THIS BLOCK IS FOR: count 41550, hash
  // e6b0c709, head and tail all reproduce byte-for-byte and are asserted before this constant is ever
  // read. Every draw the on-ramp spends is APPENDED to the event's own `seed:aitour:<id>` sub-stream,
  // after the professional side of the draw has already been keyed.
  //
  // ⚠ RE-AIMED AGAIN BY W4-LIVES (04.08): 90 -> 89, ONE place, same family as the paragraph above and
  // the same verdict. The professionals have careers now (FIELD.career): they age +1 a season and
  // retire, so the population's AGE HISTOGRAM changed shape - and `selectEntrants` gates candidates
  // on age, so a W event's entrant set changed, so which JUNIORS a W week books changed, so the J
  // draws those juniors were no longer free for changed. Second-order, on a different track from the
  // one this number folds, and once again SHE DID NOTHING DIFFERENT.
  //
  // THE CAPTURE IS AGAIN UNTOUCHED, which is the assertion this block exists for: count 41550, hash
  // e6b0c709, head and tail all reproduce byte-for-byte and are checked BEFORE this constant is ever
  // read. Every draw W4-LIVES adds is on `seed:fieldcareer:<n>:<k>` or `seed:fieldform:<n>:<season>`
  // - fresh purpose-scoped sub-streams that the weekly tick never walks.
  //
  // ⚠ AND RE-AIMED A THIRD TIME BY LADDER-PACE STEP 1 (05.08): 89 -> 90, ONE place, SAME MECHANISM
  // AGAIN. `FIELD.size` 364 -> 520 makes the W universe 719 candidates instead of 563, and
  // `selectEntrants` spends one draw per candidate off `seed:aitour:<id>` / `seed:kidtour:<id>` - so
  // a W event's entrant set changed, so which JUNIORS a W week books changed, so the J draws those
  // juniors were no longer free for changed. `fieldPros.ts`' own header names this as the licensed
  // downstream class: "the composition of the W rungs' event sub-streams... Entrant sets are a
  // documented mutable class". Different track from the one this number folds, and once again SHE
  // DID NOTHING DIFFERENT.
  //
  // THE CAPTURE IS UNTOUCHED FOR THE THIRD TIME: count 41550, hash e6b0c709, head and tail all
  // reproduce byte-for-byte and are checked BEFORE this constant is read. The fifth storey adds no
  // draw to any stream the weekly tick walks - it is 156 more reads of `seed:field:<n>:c<k>`, which
  // is a fresh generator per player.
  //
  // ⚠ AND RE-AIMED A FOURTH TIME BY POINTS-BY-THE-BOOK (05.08): 90 -> 91, ONE place, and it is the
  // SAME SECOND-ORDER MECHANISM for the fourth time running. Correction 2 re-prices W15 (10 -> 15)
  // and W35 (20 -> 35) to the rulebook's own chart, so every LIVE girl's professional BOOK changes,
  // so her row moves in the merged W table, so `selectEntrants`' percentile bands land on different
  // people, so which JUNIORS a W week books changes, so the J draws those juniors were no longer
  // free for change. This constant folds the ITF table, which no correction in that wave touches:
  // once again SHE DID NOTHING DIFFERENT and the number moved on a different track.
  //
  // THE CAPTURE IS UNTOUCHED FOR THE FOURTH TIME: count 41550, hash e6b0c709, head and tail all
  // reproduce byte-for-byte and are asserted BEFORE this constant is read (line above). No
  // correction in that wave draws on any stream at all - two are constants and one is a filter over
  // the ledger - so the MAIN sequence cannot see them.
  //
  // ⚠ AND RE-AIMED A FIFTH TIME BY POPULATION-1600 (05.08): 91 -> 87, four places, SAME SECOND-ORDER
  // MECHANISM FOR THE FIFTH TIME RUNNING - and this is the largest move of the five for the obvious
  // reason. `FIELD.size` 520 -> 1,600 makes the W universe 1,799 candidates instead of 719, and
  // `selectEntrants` spends one draw per candidate off `seed:aitour:<id>` / `seed:kidtour:<id>`, so a
  // W event's entrant set changed, so which JUNIORS a W week books changed, so the J draws those
  // juniors were no longer free for changed. `fieldPros.ts`' own header names this as the licensed
  // downstream class ("Entrant sets are a documented mutable class"). This constant folds the ITF
  // table, which the population does not touch: once more SHE DID NOTHING DIFFERENT.
  //
  // ⚠ FIVE RE-AIMS IN FIVE WAVES IS ITSELF WORTH A SENTENCE, because "it moved again" is exactly how
  // a guard stops being read. What makes each one safe is not that the number is small but that the
  // MAIN capture is asserted BEFORE this line and has never moved: the constant is a companion
  // measurement on a different track, and the invariant that blocks a merge is the hash above it.
  //
  // THE CAPTURE IS UNTOUCHED FOR THE FIFTH TIME: count 41550, hash e6b0c709, head and tail all
  // reproduce byte-for-byte and are asserted BEFORE this constant is read. The three new storeys add
  // no draw to any stream the weekly tick walks - they are 1,080 more reads of
  // `seed:field:<n>:c<k>`, a fresh generator per player.
  kidRank: 87,
  //// ⚠ CHECKED AND HELD AT v25 (30.07, the fifth attribute), and the checking is the point - this
  //// number was expected to move and did not. `count`/`hash`/`head`/`tail` cannot move by
  //// construction: v25 adds no draw to any stream the weekly tick walks. Her build's fifth number
  //// comes off a draw APPENDED to `seed:kid` and her ceiling's off one appended to `seed:potential`
  //// (appending leaves every earlier draw byte-identical); `growWeek` still spends exactly one luck
  //// draw for the week; and the COHORT deliberately stores no fifth attribute at all (`AiPlayer =
  //// Omit<MatchPlayer, 'groundstrokes'>`, derived at match time) so `driftCohort` still spends exactly
  //// four main-stream draws per player - which is literally what 41550 is made of.
  ////
  //// kidRank COULD still have moved, and briefly did: `basePServe` now carries a rally term, so
  //// asymmetric matchups resolve differently and a different set of juniors can end the year in the
  //// points. It read 127 mid-slice and came back to 126 once the aggressive baseliner's groundstroke
  //// cost was split across clay AND grass (match/style.ts) - which is the retune that kept the grass
  //// window the server's. So this is the pre-v25 value, arrived at again rather than left alone.
}

function recordRun(mutate?: (w: WorldState) => void): { draws: number[]; world: WorldState } {
  const world = createWorld('bench-working-0')
  if (mutate) mutate(world)
  const base = rngFromSeed(world.seed)
  const draws: number[] = []
  const rng = () => {
    const v = base()
    draws.push(v)
    return v
  }
  for (let i = 0; i < 52; i++) tickWeek(world, rng)
  return { draws, world }
}

function aiResults(world: WorldState) {
  return world.results.filter((r) => r.playerId !== KID_ID)
}

describe('B1 — main-stream RNG invariance (blocks merge)', () => {
  it('matches the documented capture (⚠ informational pin since v35 — update freely with real draw changes)', () => {
    const { draws, world } = recordRun()
    expect(draws.length).toBe(REF.count)
    expect(hashOf(draws)).toBe(REF.hash)
    expect(draws.slice(0, 8)).toEqual(REF.head)
    expect(draws.slice(-8)).toEqual(REF.tail)
    // cohort/results/kidRank of the real slice match the stubbed build too.
    expect(world.kidRank).toBe(REF.kidRank)
  })

  it('the draw stream + cohort + AI results + kidRank never depend on condition/plan/funds/physio', () => {
    const base = recordRun()
    const baseHash = hashOf(base.draws)
    const variants: Array<(w: WorldState) => void> = [
      (w) => (w.condition = 0),
      (w) => (w.condition = 50),
      (w) => (w.condition = 100),
      (w) => (w.plan = { train: 100, rest: 0 }),
      (w) => (w.plan = { train: 60, rest: 40 }),
      (w) => (w.fundsCents = 1),
      (w) => (w.fundsCents = 9_999_999_00),
      (w) => (w.physioActive = true),
      (w) => (w.physioActive = false),
      // ⚠ v47 – THE WEEK IS THE PLAN, SO IT JOINS THE SWEEP (docs/specs/training-dials.md §11 item 8).
      //   Nothing above is removed or relaxed; these are added beside it. `plan.week` is the largest
      //   piece of player input the tick has ever read - seven days of session kinds - and invariant 2
      //   says a player's choices may never re-roll the world's dice. Every dial: each kind swept
      //   across a whole week, the volume at both ends, and a fully doubled week.
      ...SESSION_KINDS.map((kind) => (w: WorldState) => {
        w.plan = planFromWeek([[kind], [kind], [kind], [kind], [kind], [kind], []])
      }),
      (w) => (w.plan = planFromWeek([['general'], ['general'], ['general'], ['general'], [], [], []])),
      (w) =>
        (w.plan = planFromWeek([
          ['serve', 'serve'], ['rally', 'rally'], ['fitness', 'fitness'], [], [], [], [],
        ])),
      (w) =>
        (w.plan = planFromWeek([
          ['matchplay'], ['general', 'fitness'], [], ['serve'], ['rally'], ['serve'], [],
        ])),
    ]
    for (const mutate of variants) {
      const v = recordRun(mutate)
      expect(v.draws.length).toBe(base.draws.length)
      expect(hashOf(v.draws)).toBe(baseHash)
      expect(v.world.cohort).toEqual(base.world.cohort)
      expect(aiResults(v.world)).toEqual(aiResults(base.world))
      expect(v.world.kidRank).toBe(base.world.kidRank)
    }
  })

  it('entering (and playing) an event never perturbs the main stream (the guarded branch)', () => {
    const base = recordRun()
    const world = createWorld('bench-working-0')
    const raw = rngFromSeed(world.seed)
    const draws: number[] = []
    const rng = () => {
      const v = raw()
      draws.push(v)
      return v
    }
    // Fresh kid (0 pts) can always enter the earliest still-open local event.
    const target = world.season.find((e) => e.tier === 'local' && e.deadlineWeek >= world.week)!
    enterEvent(world, target.id)
    for (let i = 0; i < 52; i++) {
      tickWeek(world, rng)
      if (world.pendingTournament) {
        skipTournament(world)
        closeTournament(world)
      }
    }
    expect(draws.length).toBe(base.draws.length)
    expect(hashOf(draws)).toBe(hashOf(base.draws))
    expect(world.cohort).toEqual(base.world.cohort)
    expect(aiResults(world)).toEqual(aiResults(base.world))
    // ...but she actually played, so the entered run left a kid match record the baseline lacks.
    expect(world.events.some((e) => e.type === 'match')).toBe(true)
  })

  // ---------------------------------------------------------------------------
  // B1d — REPAINTING THE WHOLE WEEK, EVERY WEEK (v47, docs/specs/training-dials.md §11 item 8 and
  // §12 criterion 7). The variants above set a plan ONCE and let the career run; this is the
  // adversarial version of the same claim, and it is the one the training-dials wave owes.
  //
  // WHY IT IS A SEPARATE TEST. `plan.week` is the first control in the game the player can move every
  // single week, and it feeds three different consumers: `aimWeights` (a post-draw multiply inside
  // growWeek), `knockPartWeights` (a different TABLE for a draw that was already taken) and
  // `doublingShare` (integer arithmetic beside accrueCondition). A static plan exercises none of the
  // transitions between them. So this run rewrites the entire matrix before every tick, cycling
  // through all five kinds, all three volumes and a fully doubled week, and asserts the MAIN sequence
  // is byte-identical to a career where nobody touched anything.
  //
  // ⚠ WHAT IT WOULD CATCH: any draw whose COUNT or ORDER became a function of the ticks. That is the
  // one defect class this slice could have introduced and the one the brief calls a report-and-stop.
  // ---------------------------------------------------------------------------
  it('B1d — every dial swept every week taps an identical MAIN sequence to a no-action run', () => {
    const base = recordRun()
    const weeks: SessionKind[][][] = [
      [['general'], ['general'], ['general'], ['general'], ['general'], [], []],
      [['serve'], ['serve'], ['serve'], ['serve'], ['serve'], ['serve'], []],
      [['rally'], [], ['rally'], [], ['rally'], [], ['rally']],
      [['fitness', 'fitness'], ['matchplay', 'matchplay'], [], [], [], [], []],
      [['matchplay'], ['general'], ['serve'], ['rally'], [], [], []],
      [['serve', 'rally'], ['fitness', 'matchplay'], ['general', 'serve'], [], [], [], []],
    ]
    const world = createWorld('bench-working-0')
    const raw = rngFromSeed(world.seed)
    const draws: number[] = []
    const rng = () => {
      const v = raw()
      draws.push(v)
      return v
    }
    for (let i = 0; i < 52; i++) {
      // repainted BEFORE the tick, so the week that is about to resolve is the one he just built
      world.plan = planFromWeek(weeks[i % weeks.length])
      tickWeek(world, rng)
    }
    expect(draws.length).toBe(base.draws.length)
    expect(hashOf(draws)).toBe(hashOf(base.draws))
    expect(draws.slice(0, 8)).toEqual(base.draws.slice(0, 8))
    expect(draws.slice(-8)).toEqual(base.draws.slice(-8))
    expect(world.cohort).toEqual(base.world.cohort)
    expect(aiResults(world)).toEqual(aiResults(base.world))
    expect(world.kidRank).toBe(base.world.kidRank)
    // ...and the run really did aim the weeks somewhere, so this is not a green test about nothing.
    expect(world.plan.week).toBeDefined()
    expect(world.skills).not.toEqual(base.world.skills)
  })

  // ---------------------------------------------------------------------------
  // B1c — ONE WRITER, ONE MEANING. The guard the suite was missing, added because the bug it
  // catches shipped GREEN through everything above (30.07, fix/ranking-truth).
  //
  // `world.kidRank` had two writers with two different meanings. `recomputeKidRank` wrote the ITF
  // rank; `recomputeRankAndMilestones` - the tick's step 5, and the last writer in every path - wrote
  // a rank computed with NO track predicate, i.e. both ladders folded into one table. Every screen
  // that reads the cached field (Home, the season wrap-up) disagreed with the Stats table, which is
  // built fresh from the ITF fold at snapshot time. The owner found it by playing: #4 on Home,
  // #128 in Stats, same week.
  //
  // WHY NOTHING CAUGHT IT. The pins above assert `kidRank` equals a NUMBER, so they moved with the
  // bug and were re-pinned to it (see the 135 -> 126 note at REF). A number cannot notice that it has
  // started answering a different question. So this test asserts an IDENTITY instead: the cached
  // field must equal the fold it claims to be, and the domestic cache must equal the domestic fold.
  // That holds for any seed, any week and any career, and it fails the moment a second writer with a
  // different meaning appears - which is the actual invariant, and the only kind of assertion that
  // could have blocked this.
  //
  // Zero draws of its own: both folds are pure functions of the ledger already in the world.
  // ---------------------------------------------------------------------------
  /** Enter every event the ENGINE says she may enter, so the career climbs the ladder on its own and
   *  both ledgers fill. Asking `entryStatus` (rather than guessing a tier) is the same discipline the
   *  bug was about: never re-derive a rule a named function already owns. */
  function enterWhatSheCan(world: WorldState): void {
    const entered = new Set(world.season.filter((e) => world.entries.includes(e.id)).map((e) => e.week))
    // Strongest rung first, so the career actually climbs instead of grinding the bottom for ever.
    const byRung = [...world.season].sort((a, b) => TIER_LADDER.indexOf(b.tier) - TIER_LADDER.indexOf(a.tier))
    for (const e of byRung) {
      if (e.week <= world.week || world.week > e.deadlineWeek) continue
      if (world.entries.includes(e.id) || entered.has(e.week)) continue
      if (entryStatus(world, e).level === 'blocked') continue
      enterEvent(world, e.id)
      return
    }
  }

  it('B1c — after a tick, kidRank IS the ITF fold and kidRankDomestic IS the domestic fold', () => {
    const world = createWorld('bench-working-0')
    world.fundsCents = 9_999_999_00 // affordability is not what this test is about
    const rng = rngFromSeed(world.seed)
    let sawMixedDiverge = false
    let sawDomestic = false
    // Play a real career rather than an idle one: she must actually hold points, or the two folds
    // agree trivially and the test proves nothing.
    enterWhatSheCan(world)
    for (let i = 0; i < 120; i++) {
      tickWeek(world, rng)
      if (world.pendingTournament) {
        skipTournament(world)
        closeTournament(world)
      }
      world.fundsCents = 9_999_999_00
      enterWhatSheCan(world)
      if (world.results.some((r) => r.playerId === KID_ID && inTrack('domestic')(r))) sawDomestic = true

      const ids = [...world.cohort.map((c) => c.id), KID_ID]
      const itf = computeRanking(world.results, world.week, BEST_N_BY_TRACK.itf, ids, inTrack('itf'))
      const dom = computeRanking(world.results, world.week, BEST_N_BY_TRACK.domestic, ids, inTrack('domestic'))
      const mixed = computeRanking(world.results, world.week, BEST_N_BY_TRACK.itf, ids)
      const itfRank = itf.find((r) => r.playerId === KID_ID)!.rank
      const domRank = dom.find((r) => r.playerId === KID_ID)!.rank
      const mixedRank = mixed.find((r) => r.playerId === KID_ID)!.rank

      // THE INVARIANT: each cache is the fold it names, every week.
      expect(world.kidRank).toBe(itfRank)
      expect(world.kidRankDomestic).toBe(domRank)

      // ...and the mixed fold - the thing the old second writer produced - must be a DIFFERENT number
      // somewhere in the career, so this test is genuinely discriminating and not passing by
      // coincidence.
      //
      // ⚠ RE-AIMED AT THE ROUND-15 INTEGRATION, and the claim is the same one made honestly. It was
      // asserted EVERY week (`if (itfRank !== domRank) expect(mixedRank).not.toBe(itfRank)`), which is
      // stronger than the fact: the mixed fold CAN coincide with the ITF fold on a given week even
      // while the two ladders differ, and once v25's rally term moved which juniors hold points, it
      // did (139 == 139). One coincidental week does not make the test undiscriminating - a career
      // where mixed NEVER differs would. So the divergence is collected and asserted once, below.
      if (itfRank !== domRank && mixedRank !== itfRank) sawMixedDiverge = true
    }
    // The fixture really did exercise both ladders...
    //
    // ⚠ RE-AIMED 01.08 (R15-6): COLLECTED DURING THE LOOP, asserted once - the exact move the
    // mixed-diverge check above already made, for the same reason. It used to read the ledger AFTER
    // week 120, but `world.results` is the rolling 52-week ranking window: a career that spends its
    // last year on the international rungs (which is what a career that CLIMBS does, and the W
    // reprice let this fixture climb a little further) ages its domestic rows out of the window by
    // the end, and the assert failed on the pruning, not on the property. The property is "the
    // fixture exercised both ladders", and the loop is where that is observable.
    expect(sawDomestic, 'the fixture never held a domestic result - the folds were never both live').toBe(true)
    // ...and the mixed fold really is a third, different number, so the invariant above is not
    // satisfiable by a code path that simply returns the same rank three ways.
    expect(sawMixedDiverge, 'the mixed fold never differed - this test proves nothing').toBe(true)
  })

  it('B1c — the Stats standings and the cached kidRank can never disagree (the owner`s #4 vs #128)', () => {
    // The exact shape of the reported bug: `Snapshot.kidRank` (the cached field, read by Home and the
    // season wrap-up) against the kid`s row in `Snapshot.standings` (rebuilt from the ITF fold at
    // snapshot time, read by Stats). They are two paths to one fact and must agree at every tick.
    const world = createWorld('ranking-truth')
    world.fundsCents = 9_999_999_00
    const rng = rngFromSeed(world.seed)
    enterWhatSheCan(world)
    for (let i = 0; i < 120; i++) {
      tickWeek(world, rng)
      if (world.pendingTournament) {
        skipTournament(world)
        closeTournament(world)
      }
      world.fundsCents = 9_999_999_00
      enterWhatSheCan(world)
      const snap = toSnapshot(world)
      const kidRow = snap.standings.find((r) => r.isKid)
      expect(kidRow).toBeDefined()
      expect(kidRow!.rank).toBe(snap.kidRank)

      // THE ALIASES HOLD. `kidRank`/`standings`/`countingResults` are documented as the ITF ladder,
      // i.e. as aliases of `ladders.itf`. Two names for one fact is exactly how this bug began, so the
      // aliasing is asserted rather than trusted.
      expect(snap.standings).toEqual(snap.ladders.itf.standings)
      expect(snap.countingResults).toEqual(snap.ladders.itf.countingResults)
      if (snap.ladders.itf.rank !== null) expect(snap.ladders.itf.rank).toBe(snap.kidRank)

      // THE TWO LADDERS ARE SEPARATE CURRENCIES. Neither table's points may be the other's, and a
      // result counted by one must never be counted by the other.
      const domTiers = new Set(snap.ladders.domestic.countingResults.map((r) => r.tier))
      const itfTiers = new Set(snap.ladders.itf.countingResults.map((r) => r.tier))
      for (const t of domTiers) if (t) expect(TIERS[t].track).toBe('domestic')
      for (const t of itfTiers) if (t) expect(TIERS[t].track).toBe('itf')

      // `rank: null` MEANS "holds nothing in this table", in both directions - the property every
      // screen now leans on instead of counting results for itself.
      for (const track of ['domestic', 'itf'] as const) {
        const l = snap.ladders[track]
        expect(l.rank === null).toBe(l.countingResults.length === 0)
        if (l.countingResults.length === 0) expect(l.points).toBe(0)
      }

      // ACTIVE LADDER = the spec's rule: the international one once she holds a counting result there,
      // her national one before that (docs/specs/two-ladders.md, "Which rank is her rank").
      // ⚠ RE-AIMED, NOT WEAKENED (02.08, the Home-chip ruling): the professional table joined the
      // rule as a ONE-WAY DOOR. Any W finish that ever SCORED makes 'wta' the answer for the rest
      // of the career - read off `bestFinishByTier`, the never-pruned mark, because the result rows
      // themselves age out of the 52-week window (see `wtaEverCounted` in world.ts). A scored row
      // of the tier's points table IS a counting result (isCountingResult = points > 0). The junior
      // identity is unchanged for every week before that door; ladder-separation S7 pins the door
      // itself in both directions.
      const wtaEver = (Object.keys(snap.bestFinishByTier) as TierId[]).some(
        (t) => TIERS[t].track === 'wta' && TIERS[t].points[snap.bestFinishByTier[t]!] > 0,
      )
      expect(snap.activeLadder).toBe(
        wtaEver || snap.ladders.wta.rank !== null
          ? 'wta'
          : snap.ladders.itf.rank !== null
            ? 'itf'
            : 'domestic',
      )
    }
  })

  it('accrueCondition is pure arithmetic (zero draws): a poison rng is never called', () => {
    const w = createWorld('poison')
    w.condition = 50
    // accrueCondition takes no rng; proving it here documents the zero-draw contract.
    expect(() => accrueCondition(w, false)).not.toThrow()
    expect(accrueCondition.length).toBe(2) // (world, playedThisWeek) — no rng parameter
  })
})

// ---------------------------------------------------------------------------
// B1b — THE AI SUB-STREAM. Every scheduled event's canonical AI tournament now runs on its OWN
// event-scoped stream `seed:aitour:<event.id>` – the exact mirror of the kid's `seed:kidtour:
// <event.id>`. Both entrant selection AND the AI-vs-AI matches draw from it, so the MAIN weekly
// stream carries base costs + cohort drift and NOTHING else.
//
// This is what makes CALENDAR CONTENT FREE: a new tier, a densified cadence, an extra event – none
// of them can re-base the main stream any more, so the frozen B1/C1 pins stop moving every time the
// calendar is edited. (The ladder-up slice had to move them precisely because it could not.)
// ---------------------------------------------------------------------------
describe('B1b — the main stream is base costs + cohort drift, and nothing else', () => {
  it('every week draws exactly 3-4 base-cost values + 4 per cohort player', () => {
    const world = createWorld('bench-working-0')
    const base = rngFromSeed(world.seed)
    const draws: number[] = []
    const rng = () => {
      const v = base()
      draws.push(v)
      return v
    }
    const driftDraws = 4 * world.cohort.length // driftCohort: serve/ret/composure/stamina
    for (let i = 0; i < 52; i++) {
      const before = draws.length
      tickWeek(world, rng)
      const week = draws.slice(before)
      // resolveBaseCosts runs FIRST and draws, in order: the expense pickInt, the flavor pickInt,
      // the sponsor roll, and – only when that roll hits – the gift pickInt. Then driftCohort.
      // Nothing else on the main stream, so the week's length is fully determined by draw #2.
      const sponsorHit = week[2] < ECONOMY.sponsor.rollChance
      expect(week.length).toBe(driftDraws + (sponsorHit ? 4 : 3))
    }
    expect(draws.length).toBe(REF.count) // ...and the 52 weeks sum to the documented pin (informational since v35)
  })

  it('CONTENT IS FREE: extra events on the calendar never move the main stream', () => {
    const base = recordRun()
    const dense = recordRun((w) => {
      // 24 extra tournaments across the year – under the old MAIN-stream AI bracket this alone
      // added thousands of draws (one per band candidate + one per AI-AI match, per event).
      for (let week = 4; week <= 48; week += 4) {
        injectEvent(w, { week, tier: 'national', id: `extra-${week}-national` })
        injectEvent(w, { week, tier: 'j60', id: `extra-${week}-j60` })
      }
    })
    expect(dense.draws.length).toBe(base.draws.length)
    expect(hashOf(dense.draws)).toBe(hashOf(base.draws))
    expect(dense.world.cohort).toEqual(base.world.cohort)
    // ...and the extra brackets really did run – they just ran on their own streams.
    expect(aiResults(dense.world).length).toBeGreaterThan(aiResults(base.world).length)
  })

  it("an event's AI bracket is a pure function of (seed, event.id) – the main stream cannot move it", () => {
    // Same world, same calendar, but the main stream is advanced by a different number of draws
    // before the weeks resolve. `growth = 0` freezes the cohort's SKILLS (drift still draws its 4
    // per player, it just lands on +0), so the only thing the offset can still change is the
    // bracket's RNG. Under a MAIN-stream bracket that rewrites every AI result; under the
    // event-scoped stream nothing about the AI side can notice.
    const runWithOffset = (offset: number) => {
      const world = createWorld('aitour-purity')
      for (const p of world.cohort) p.growth = 0
      const rng = rngFromSeed(world.seed)
      for (let i = 0; i < offset; i++) rng() // desynchronise the main stream
      for (let i = 0; i < 12; i++) tickWeek(world, rng)
      return aiResults(world)
    }
    const a = runWithOffset(0)
    const b = runWithOffset(7)
    expect(b).toEqual(a)
    expect(a.length).toBeGreaterThan(0)
  })
})

// ---------------------------------------------------------------------------
// B2 — condition dynamics (pure INTEGER accumulator).
// Re-pinned deliberately for the round-9 OWNER REDESIGN: recovery is time-based
// (base +2 every week; the train/rest slider adds a threshold bonus on MATCH-FREE
// weeks only: 85/15 → +0, 75/25 → +1, 60/40 → +2), the slider never drains, and
// match fatigue lives in matchDrain/finalizeTournament instead. physioActive is
// pinned OFF for the pure numbers; the +2 physio bonus is covered in round9.test.ts.
// ---------------------------------------------------------------------------
describe('B2 — condition dynamics', () => {
  // RE-PINNED 25.07 (V2.1 shipped: recoveryBase 2 → 1): the free-week ladder is now
  // grind +1 / balanced +2 / light +3 – the owner wants every policy to ARRIVE at the season
  // wrap below 100, with the off-season + a planner vacation doing the restoring.
  // ⚠ RE-PINNED AGAIN 03.08 (W2-FATIGUE: recoveryBase 1 → 8, docs/specs/fatigue-reprice-2026-08.md
  // §3), so the free-week ladder reads grind +8 / balanced +9 / light +10. His V2.1 intent survives
  // the raise untouched - a policy still ARRIVES at the wrap below 100, because the professional
  // schedule the base was re-priced for drains ~12.5 an event; what changed is that the off-season
  // and a planner vacation can now actually close that deficit, which is §1's third clause.
  it('balanced 75/25, match-free: +9/wk', () => {
    const w = createWorld('b2-balanced')
    w.physioActive = false
    w.condition = 5
    w.plan = { train: 75, rest: 25 }
    for (let i = 0; i < 10; i++) accrueCondition(w, false)
    expect(w.condition).toBe(95) // base 8 + slider 1 – was +2/wk pre-W2
  })

  it('grind 85/15, match-free: +8/wk (base only – rest 15 earns no slider bonus)', () => {
    const w = createWorld('b2-grind')
    w.physioActive = false
    w.condition = 10
    w.plan = { train: 85, rest: 15 }
    for (let i = 0; i < 10; i++) accrueCondition(w, false)
    expect(w.condition).toBe(90) // base 8 only – was +1/wk pre-W2
  })

  it('light 60/40, match-free: +10/wk, clamped at 100', () => {
    const w = createWorld('b2-rest')
    w.physioActive = false
    w.condition = 75
    w.plan = { train: 60, rest: 40 }
    for (let i = 0; i < 4; i++) accrueCondition(w, false)
    expect(w.condition).toBe(100) // 75 → 85 → 95 → 100 → clamp
  })
})

// ---------------------------------------------------------------------------
// B3 — tournament fatigue. Re-pinned deliberately for round-9 R9-7 (owner redesign):
// fatigue is PER MATCH (matchDrain: scoreline grade + tier surcharge) and lands at
// finalizeTournament (the commit point) – accrueCondition applies NO match fatigue at
// tick time, so a skipped event week (R9-9) or a walkover costs none by construction.
// The per-match numbers + the finalize integration live in tests/round9.test.ts.
// ---------------------------------------------------------------------------
describe('B3 — tournament fatigue (per-match at finalize since round-9)', () => {
  it('accrueCondition applies NO match fatigue at tick, even on an entered national week', () => {
    const w = createWorld('b3')
    w.physioActive = false
    w.condition = 60
    w.plan = { train: 75, rest: 25 }
    const ev = injectEvent(w, { week: w.week, tier: 'national' })
    w.entries.push(ev.id)
    accrueCondition(w, true)
    // RE-PINNED 25.07 (V2 shipped): a match week earns NO base recovery at all
    // (matchWeekRecoveryBase 0) – and still no match fatigue at tick time.
    expect(w.condition).toBe(60)
  })
})

// ---------------------------------------------------------------------------
// B4 — fatigue is a SOFT, warned choice (not a hard block). A tired body is a
// tough-parent decision; racing anyway is allowed, with emergent consequences.
// ---------------------------------------------------------------------------
describe('B4 — fatigue is a soft, warned choice', () => {
  it('condition 35: national is enterable with a caution; local is clear; playing digs deeper', () => {
    // national: kid national-eligible and fatigued (35 < floor 40) – fatigue does NOT block entry.
    const wn = createWorld('b4-nat')
    giveKidPoints(wn, 200)
    wn.condition = 35
    const nat = injectEvent(wn, { week: wn.week + 2, tier: 'national' })
    const before = wn.fundsCents
    expect(() => enterEvent(wn, nat.id)).not.toThrow()
    expect(wn.entries).toContain(nat.id)
    expect(wn.fundsCents).toBe(before - TIERS.national.entryFeeCents)
    const un = toSnapshot(wn).upcoming.find((e) => e.id === nat.id)!
    expect(un.eligible).toBe(true) // she CAN enter
    expect(un.ineligibleReason).toBeUndefined()
    expect(un.cautionReason).toBe('fatigued') // ...but warned
    expect(un.cautionDetail).toBe('Exhausted – racing risks injury.')

    // local: fresh kid (0 pts, local eligible), condition 35 clears the floor of 20, no caution.
    const wl = createWorld('b4-loc')
    wl.condition = 35
    const loc = injectEvent(wl, { week: wl.week + 2, tier: 'local' })
    enterEvent(wl, loc.id)
    expect(wl.entries).toContain(loc.id)
    const ul = toSnapshot(wl).upcoming.find((e) => e.id === loc.id)!
    expect(ul.eligible).toBe(true)
    expect(ul.cautionReason).toBeUndefined()

    // Playing fatigued digs a deeper hole – emergent (per-match drain at finalize since
    // round-9, see tests/round9.test.ts), NO extra entry penalty. RE-PINNED 25.07 (V2
    // shipped): at tick time a match week accrues NOTHING (matchWeekRecoveryBase 0).
    const wp = createWorld('b4-play')
    wp.physioActive = false
    wp.condition = 35
    wp.plan = { train: 75, rest: 25 }
    const ev = injectEvent(wp, { week: wp.week, tier: 'national' })
    wp.entries.push(ev.id)
    accrueCondition(wp, true)
    expect(wp.condition).toBe(35) // unchanged at tick – was 37 pre-V2, 10 under the flat -26 strain
  })
})

// ---------------------------------------------------------------------------
// Hard blocks: injury (Slice C, wired) and school exams STOP entry on every
// surface; fatigue never does.
// ---------------------------------------------------------------------------
describe('hard availability blocks (injured / exams)', () => {
  // R10-17: the layoff is a RANGE of weeks, so these fixtures put the event under test INSIDE it
  // (3 weeks out, event at +2). What they assert is unchanged – an injured kid is hard-blocked on
  // every tier – but the layoff has to actually cover the event's week for that to be the question:
  // she is enterable again FROM `week + weeksRemaining`, which is the same week the news and the
  // planner have always named. tests/round10.test.ts owns the boundary itself.
  it('an injured kid is blocked on every reachable tier', () => {
    // local (fresh kid, point-eligible) -> injured throw.
    const wl = createWorld('hb-inj-l')
    wl.injury = { kind: 'wrist', severity: 'minor', weeksRemaining: 3, totalWeeks: 3, sinceWeek: wl.week }
    const loc = injectEvent(wl, { week: wl.week + 2, tier: 'local' })
    expect(() => enterEvent(wl, loc.id)).toThrow('Injured – back in 3 weeks.')
    const ul = toSnapshot(wl).upcoming.find((e) => e.id === loc.id)!
    expect(ul.eligible).toBe(false)
    expect(ul.ineligibleReason).toBe('injured')
    expect(ul.cautionReason).toBeUndefined()

    // national (national-eligible) -> injured throw too.
    const wn = createWorld('hb-inj-n')
    giveKidPoints(wn, 200)
    wn.injury = { kind: 'wrist', severity: 'minor', weeksRemaining: 3, totalWeeks: 3, sinceWeek: wn.week }
    const nat = injectEvent(wn, { week: wn.week + 2, tier: 'national' })
    expect(() => enterEvent(wn, nat.id)).toThrow('Injured – back in 3 weeks.')
    expect(toSnapshot(wn).upcoming.find((e) => e.id === nat.id)!.ineligibleReason).toBe('injured')
  })

  it('an exam-week event is unavailable (hard block) on entry and in upcoming', () => {
    const w = createWorld('hb-exam')
    w.week = 20
    w.condition = 100
    const ev = injectEvent(w, { week: 24, tier: 'local' }) // offset 24 ∈ examWeeks
    expect(() => enterEvent(w, ev.id)).toThrow('School exams this week – no tournaments.')
    const ue = toSnapshot(w).upcoming.find((e) => e.id === ev.id)!
    expect(ue.eligible).toBe(false)
    expect(ue.ineligibleReason).toBe('unavailable')
    expect(ue.cautionReason).toBeUndefined()
  })
})

// ---------------------------------------------------------------------------
// B5 — school gate (exam weeks).
// ---------------------------------------------------------------------------
describe('B5 — school exam gate', () => {
  it('entering an event in an exam block is unavailable on all surfaces', () => {
    const w = createWorld('b5')
    w.week = 20
    w.condition = 100
    const ev = injectEvent(w, { week: 24, tier: 'local' }) // offset 24 ∈ examWeeks
    // ⚠ `false` = SHE IS STILL AT SCHOOL (W4-SCHOOL); this world is at week 20, age 14.
    expect(isBlackoutWeek(24, false)).toBe(true)
    // ...AND THE GUARD THIS WAVE ADDS: past her last school year the same week is NOT a blackout.
    // That is the whole bug the owner reported – «и школа с уроками в 22 года всё еще со мной».
    expect(isBlackoutWeek(24, true)).toBe(false)
    expect(() => enterEvent(w, ev.id)).toThrow('School exams this week – no tournaments.')
    const ue = toSnapshot(w).upcoming.find((e) => e.id === ev.id)!
    expect(ue.eligible).toBe(false)
    expect(ue.ineligibleReason).toBe('unavailable')
  })
})

// ---------------------------------------------------------------------------
// B6 — three-surface parity (enterEvent / upcomingEvents / advanceWeeks).
// ---------------------------------------------------------------------------
describe('B6 — three-surface parity', () => {
  it('fatigue is caution/enterable on all three surfaces (may stop-for-deadline)', () => {
    // Fatigued national, imminent deadline. Enterable everywhere; the sim MAY stop so the parent
    // can make the tough call.
    const w = createWorld('b6-fat')
    giveKidPoints(w, 200)
    w.condition = 35 // below national floor 40 -> caution, not block
    const nat = injectEvent(w, { week: w.week + 3, tier: 'national', deadlineWeek: w.week + 1 })
    w.season = [nat]

    // surface 1: enterEvent does NOT throw
    expect(() => enterEvent(w, nat.id)).not.toThrow()
    expect(w.entries).toContain(nat.id)
    // surface 2: upcoming keeps it eligible with a caution
    const ue = toSnapshot(w).upcoming.find((e) => e.id === nat.id)!
    expect(ue.eligible).toBe(true)
    expect(ue.cautionReason).toBe('fatigued')
    expect(ue.ineligibleReason).toBeUndefined()
    // surface 3: on a fresh (un-entered) copy advance MAY stop-for-deadline (it's enterable)
    const wa = createWorld('b6-fat')
    giveKidPoints(wa, 200)
    wa.condition = 35
    const natA = injectEvent(wa, { week: wa.week + 3, tier: 'national', deadlineWeek: wa.week + 1 })
    wa.season = [natA]
    // ⚠ W4: no knock may interrupt the advance under test - see noKnocksFor.
    noKnocksFor(wa)
    expect(advanceWeeks(wa, rngFromSeed(wa.seed), 4)).toContain('deadline')
  })

  it('a hard block (injured) is consistent on all three surfaces (never stops advance)', () => {
    const b = createWorld('b6-inj')
    giveKidPoints(b, 200)
    // R10-17: 4 weeks out so the +3 event under test sits INSIDE the layoff (she is enterable again
    // from week + weeksRemaining – see tests/round10.test.ts for the boundary itself).
    b.injury = { kind: 'ankle', severity: 'moderate', weeksRemaining: 4, totalWeeks: 6, sinceWeek: b.week }
    const nat = injectEvent(b, { week: b.week + 3, tier: 'national', deadlineWeek: b.week + 1 })
    b.season = [nat]

    // surface 1: enterEvent throws (hard block)
    expect(() => enterEvent(b, nat.id)).toThrow('Injured – back in 4 weeks.')
    // surface 2: upcoming marks it ineligible with the matching reason
    const ue = toSnapshot(b).upcoming.find((e) => e.id === nat.id)!
    expect(ue.eligible).toBe(false)
    expect(ue.ineligibleReason).toBe('injured')
    // surface 3: advance never stops-for-deadline on an event she hard-cannot enter
    expect(advanceWeeks(b, rngFromSeed(b.seed), 4)).not.toContain('deadline')
  })
})

// ---------------------------------------------------------------------------
// B7 — snapshot + HomeScreen.
// ---------------------------------------------------------------------------
describe('B7 — snapshot + UI', () => {
  it('toSnapshot carries condition, null injury, and the physio flag', () => {
    const w = createWorld('b7')
    w.condition = 73
    const snap = toSnapshot(w)
    expect(snap.condition).toBe(73)
    expect(snap.injury).toBeNull()
    expect(typeof snap.physioActive).toBe('boolean')
  })

  it('HomeScreen drives the condition RING off the real condition, never a hard-coded fill', () => {
    // ⚠ RE-AIMED by A2b (owner, 28.07): slice B's ten squares became the export's ProgressRing, so
    // `round(condition / 10)` (the number of filled squares) is gone. The fact this guards is
    // unchanged and is now checked at the arc: the sweep is the REAL condition, clamped to 0..100,
    // and the geometry comes from the radius rather than from a magic number.
    // ⚠ RE-AIMED AGAIN by U0 (docs/specs/ui-components.md #6): the ring is a shared component now –
    // `src/components/ui/ProgressRing.vue` – because Home's condition ring and the Season card's
    // chance ring were the same object written twice, and a percentage has to look like a percentage
    // everywhere. So the GEOMETRY and the clamp moved into it, and Home passes `value`.
    // The protected fact is unchanged and is checked in both halves, which is what makes the move
    // safe: Home hands the ring her REAL condition (never a constant, never a bucket), and the ring
    // clamps it to 0..1 and derives its dash offset from its own radius rather than a magic number.
    const src = readFileSync(new URL('../src/components/screens/HomeScreen.vue', import.meta.url), 'utf8')
    const ring = readFileSync(new URL('../src/components/ui/ProgressRing.vue', import.meta.url), 'utf8')
    expect(src).not.toContain('Phase 4')
    expect(src).toContain(':value="condition / 100"')
    expect(src).toContain('game.snapshot?.condition ?? 0')
    expect(ring).toMatch(/Math\.max\(0,\s*Math\.min\(1,\s*props\.value\)\)/)
    expect(ring).toMatch(/2 \* Math\.PI \* r/)
    expect(src).not.toContain('CONDITION_FILLED')
    expect(src).not.toContain('conditionFilled')
  })
})

// ---------------------------------------------------------------------------
// availabilityStatus precedence (injured > unavailable > fatigued).
// ---------------------------------------------------------------------------
describe('availabilityStatus precedence + levels', () => {
  it('unavailable (hard) outranks fatigued (soft) on the same event', () => {
    const w = createWorld('prec')
    w.condition = 5 // fatigued for every tier
    const ev = injectEvent(w, { week: 24, tier: 'national' }) // exam week -> unavailable
    expect(w.injury).toBeNull() // injury dead in B
    const status = availabilityStatus(w, ev)
    expect(status.level).toBe('blocked')
    expect(status.reason).toBe('unavailable')
  })

  it('fatigue on a clear week is a soft caution, not a block', () => {
    const w = createWorld('prec-fat')
    // ABOVE the medical floor (the doctor's veto below it is a HARD block – see the block below);
    // 20 is deep under national's floor of 40, so the soft fatigue caution is what surfaces.
    w.condition = 20
    const ev = injectEvent(w, { week: w.week + 2, tier: 'national' })
    const status = availabilityStatus(w, ev)
    expect(status.level).toBe('caution')
    expect(status.reason).toBe('fatigued')
    expect(status.detail).toBe('Exhausted – racing risks injury.')
  })

  it('a clear week at full condition is ok', () => {
    const w = createWorld('prec2')
    w.condition = 100
    const ev = injectEvent(w, { week: w.week + 2, tier: 'local' })
    expect(availabilityStatus(w, ev)).toEqual({ level: 'ok' })
  })
})

// ---------------------------------------------------------------------------
// THE DOCTOR'S VETO (owner R9-19b, cashed in by the Wave-2 fatigue bench): the ONE
// place where "the parent may push" yields to medicine. Below
// ECONOMY.availability.medicalFloor entering is a HARD block; above it fatigue stays
// the soft, warned CHOICE it has always been. This is the first hard body-gate in
// the game, and it is knob-driven so the owner can lower or disable it.
// ---------------------------------------------------------------------------
describe("the doctor's veto — medical floor", () => {
  const FLOOR = ECONOMY.availability.medicalFloor

  it('sits far below every tier caution floor, so normal play never meets it', () => {
    for (const [, floor] of Object.entries(ECONOMY.availability.minConditionToEnter)) {
      expect(FLOOR).toBeLessThan(floor)
    }
    expect(FLOOR).toBeGreaterThan(ECONOMY.condition.min)
  })

  it('blocks entry below the floor on all three surfaces, with the medical reason', () => {
    const w = createWorld('vet-block')
    w.condition = FLOOR - 1
    const loc = injectEvent(w, { week: w.week + 3, tier: 'local', deadlineWeek: w.week + 1 })
    w.season = [loc]

    // surface 1: availabilityStatus / enterEvent hard-refuse
    const status = availabilityStatus(w, loc)
    expect(status.level).toBe('blocked')
    expect(status.reason).toBe('medical')
    expect(status.detail).toBe('Not cleared to play – she needs rest.')
    expect(() => enterEvent(w, loc.id)).toThrow('Not cleared to play – she needs rest.')
    expect(w.entries).toEqual([])

    // surface 2: upcoming marks it ineligible with the same reason (and no soft caution)
    const up = toSnapshot(w).upcoming.find((e) => e.id === loc.id)!
    expect(up.eligible).toBe(false)
    expect(up.ineligibleReason).toBe('medical')
    expect(up.cautionReason).toBeUndefined()

    // surface 3: advance never stops-for-deadline on an event she hard-cannot enter. Condition 0,
    // because the pre-deadline ticks recover a couple of points before the guard is re-read.
    const wa = createWorld('vet-block')
    wa.condition = 0
    giveKidPoints(wa, 200)
    const nat = injectEvent(wa, { week: wa.week + 3, tier: 'national', deadlineWeek: wa.week + 1 })
    wa.season = [nat]
    expect(advanceWeeks(wa, rngFromSeed(wa.seed), 4)).not.toContain('deadline')
  })

  it('AT the floor she may still push through – fatigue above it stays a soft caution', () => {
    const w = createWorld('vet-floor')
    w.condition = FLOOR // the floor itself is cleared: the block is strictly below
    const loc = injectEvent(w, { week: w.week + 2, tier: 'local' })
    const status = availabilityStatus(w, loc)
    expect(status.level).toBe('caution') // below local's floor of 20 -> the OLD soft warning
    expect(status.reason).toBe('fatigued')
    expect(() => enterEvent(w, loc.id)).not.toThrow()
    expect(w.entries).toContain(loc.id)
  })

  it('injury still outranks it, and a blacked-out week still names the week-level reason', () => {
    const inj = createWorld('vet-inj')
    inj.condition = 0
    // R10-17: the layoff must cover the event's week for "injury outranks the veto" to be the
    // question being asked – 3 weeks out, event at +2.
    inj.injury = { kind: 'wrist', severity: 'minor', weeksRemaining: 3, totalWeeks: 3, sinceWeek: inj.week }
    const ev = injectEvent(inj, { week: inj.week + 2, tier: 'local' })
    expect(availabilityStatus(inj, ev).reason).toBe('injured')

    const exam = createWorld('vet-exam')
    exam.week = 20
    exam.condition = 0
    const examEv = injectEvent(exam, { week: 24, tier: 'local' })
    expect(availabilityStatus(exam, examEv).reason).toBe('unavailable')
  })

  it('is knob-driven: lowering the floor to 0 restores the pre-veto behaviour', () => {
    const av = ECONOMY.availability as { medicalFloor: number }
    const saved = av.medicalFloor
    try {
      av.medicalFloor = 0
      const w = createWorld('vet-knob')
      w.condition = 0
      const loc = injectEvent(w, { week: w.week + 2, tier: 'local' })
      expect(availabilityStatus(w, loc).level).toBe('caution')
      expect(() => enterEvent(w, loc.id)).not.toThrow()
    } finally {
      av.medicalFloor = saved
    }
  })
})

// ---------------------------------------------------------------------------
// THE DOCTOR CHECKS HER ON ARRIVAL (owner 26.07):
//   "врач точно не пустит ниже 15 на турнир, если она приезжает; скажем, с состоянием 20 врач
//    вполне может сказать «я вас предупреждаю о последствиях, формально запретить не могу»"
//
// The floor above gates ENTRY, and entries commit weeks ahead of the play week – so until now a run
// entered healthy could still be PLAYED at condition 0 with nothing intervening (the fatigue bench
// traced a grinder doing exactly that for 14 straight weeks). The floor is now re-read ON the play
// week, before the run resolves:
//   under the floor            -> WITHDRAWN on medical grounds (no travel, no run, 0 pts, fee gone);
//   [floor, warningCeiling)    -> she PLAYS and the doctor goes on record. A warning, never a block.
// Pure state, ZERO new RNG draws – proved against the main stream below.
// ---------------------------------------------------------------------------
describe('the doctor on ARRIVAL — the play-week re-check', () => {
  const FLOOR = ECONOMY.availability.medicalFloor
  const CEILING = ECONOMY.availability.medicalWarningCeiling

  /** A seed whose PRIVATE injury sub-stream cannot fire on weeks 1..`through` whatever her condition
   *  is: each of those weeks' FIRST draw is at or above ECONOMY.availability.injuryChanceCap, and tau
   *  is capped there. That makes these tests deterministic instead of 12%-per-week flaky – an injury
   *  would pre-empt the medical branch (injury outranks it, exactly as availabilityStatus says). */
  function injuryProofSeed(prefix: string, through: number): string {
    const cap = ECONOMY.availability.injuryChanceCap
    for (let i = 0; i < 400; i++) {
      const seed = `${prefix}-${i}`
      let clean = true
      for (let w = 1; w <= through && clean; w++) {
        if (rngFromSeed(`${seed}:injury:${w}`)() < cap) clean = false
      }
      if (clean) return seed
    }
    throw new Error('no injury-proof seed found')
  }

  /** A world entered in ONE local event at `playWeek`, ticked to the week BEFORE it, with the
   *  recovery knobs pinned flat (no physio, 85/15 so the slider bonus is 0) so the arithmetic below
   *  is exact. `condition` is set on the eve of the play week – past the deadline, so the entry can
   *  no longer be withdrawn/refunded and only the arrival check can act. */
  function arriveAt(seedPrefix: string, condition: number, playWeek = 6) {
    const world = createWorld(injuryProofSeed(seedPrefix, playWeek))
    world.physioActive = false
    world.plan = { train: 85, rest: 15 }
    world.season = []
    const event = injectEvent(world, { week: playWeek, tier: 'local', deadlineWeek: playWeek - 3 })
    enterEvent(world, event.id) // entered at full condition, pre-deadline
    const rng = rngFromSeed(world.seed)
    while (world.week < playWeek - 1) tickWeek(world, rng)
    expect(world.injury).toBeNull() // the seed guarantees it – the branch under test is the medical one
    world.condition = condition
    return { world, event, rng }
  }

  it('medicalClearance is the ONE pure rule every surface reads', () => {
    // THREE surfaces now, not two: the entry gate, this arrival check, and (26.07) the practice
    // booking – a friendly is a match, so the doctor's floor governs it too. `medicalBlock` is the
    // shared VERDICT wrapper, so all three refuse in the same words; the practice half of that is
    // asserted in tests/planner.test.ts P7b.
    expect(medicalBlock(FLOOR - 1)).toEqual({
      level: 'blocked',
      reason: 'medical',
      detail: 'Not cleared to play – she needs rest.',
    })
    expect(medicalBlock(FLOOR)).toBeNull()
    expect(medicalClearance(FLOOR - 1)).toBe('withdraw')
    expect(medicalClearance(ECONOMY.condition.min)).toBe('withdraw')
    expect(medicalClearance(FLOOR)).toBe('warn') // the floor itself is cleared – the veto is strictly below
    expect(medicalClearance(CEILING - 1)).toBe('warn')
    expect(medicalClearance(CEILING)).toBe('clear')
    expect(medicalClearance(ECONOMY.condition.max)).toBe('clear')
    // the owner's own example: "с состоянием 20 врач вполне может сказать…"
    expect(medicalClearance(20)).toBe('warn')
    // The band is non-empty, contains the owner's own example, and stays deep in the pathological
    // zone rather than nagging through normal play.
    expect(CEILING).toBeGreaterThan(FLOOR)
    expect(CEILING).toBeGreaterThan(20) // "с состоянием 20 врач вполне может сказать…" – 20 must warn
    expect(CEILING).toBeLessThan(ECONOMY.condition.max / 2)
    // It DELIBERATELY overlaps local's soft fatigue floor of 20 – the owner's example forces that,
    // and the two gates ask different questions: the tier floor is "is this event too big for her
    // right now?" (checked at ENTRY, per tier), the band is "is this body fit to compete at all?"
    // (checked on ARRIVAL, tier-independent). At condition 22 a local entry is 'ok' and the doctor
    // still speaks up on the day, which is the intended reading, not a conflict.
    expect(CEILING).toBeGreaterThan(ECONOMY.availability.minConditionToEnter.local)
    // ...and the entry gate is the same rule, not a copy of the comparison.
    const w = createWorld('clearance-gate')
    w.condition = FLOOR - 1
    const ev = injectEvent(w, { week: w.week + 2, tier: 'local' })
    expect(availabilityStatus(w, ev).reason).toBe('medical')
    w.condition = FLOOR
    expect(availabilityStatus(w, ev).reason).toBe('fatigued') // warn band = play + warn, never block
  })

  it('under the floor on the play week she is WITHDRAWN: no travel, no run, 0 pts, fee forfeited', () => {
    const { world, event, rng } = arriveAt('arrive-block', 0)
    tickWeek(world, rng)
    expect(world.week).toBe(event.week)

    // no run at all
    expect(world.pendingTournament).toBeNull()
    expect(world.events.some((e) => e.type === 'match')).toBe(false)
    expect(world.results.filter((r) => r.playerId === KID_ID)).toHaveLength(0) // 0 points
    // the entry is spent, not pending
    expect(world.entries).not.toContain(event.id)

    const weekEvents = world.events.filter((e) => e.week === world.week)
    // NO travel charge – she never boards, so the trip is never billed (nothing to refund either:
    // the whole travel category nets to exactly zero this week).
    expect(weekEvents.some((e) => e.text.startsWith('Travel to'))).toBe(false)
    expect(weekEvents.filter((e) => e.category === 'travel').reduce((s, e) => s + (e.amountCents ?? 0), 0)).toBe(0)
    expect(event.travelCostCents).toBeGreaterThan(0) // ...and there really was a trip to not charge
    // ENTRY FEE FORFEITED – the same rule skipEvent uses post-deadline, and the same rule the
    // injury walkover uses: the list closed with her on it. No refund event of any kind.
    expect(weekEvents.some((e) => e.text.startsWith('Entry refunded'))).toBe(false)
    expect(weekEvents.some((e) => e.category === 'entry' && (e.amountCents ?? 0) > 0)).toBe(false)

    // the news beat, in player copy: short dash, no Cyrillic
    const beat = weekEvents.find((e) => e.text.includes('not cleared to play'))
    expect(beat).toBeDefined()
    expect(beat!.text).toBe(
      `Withdrawn from the ${TIERS.local.label} – not cleared to play on medical advice. 0 pts, entry fee forfeited.`,
    )
    expect(beat!.text).not.toMatch(/[—А-Яа-яЁё]/)
  })

  it('the withdrawn week resolves as a normal NON-playing week – she gets the free-week recovery', () => {
    // accrueCondition ran with played = true (she was still entered), banking matchWeekRecoveryBase.
    // The withdrawal hands back the DIFFERENCE plus the rest-slider bonus, so the week pays exactly
    // what a match-free week pays – whatever the two knobs are set to.
    for (const plan of [{ train: 85, rest: 15 }, { train: 60, rest: 40 }]) {
      const { world, rng } = arriveAt(`arrive-recover-${plan.rest}`, 0)
      world.plan = plan
      tickWeek(world, rng)
      expect(world.condition).toBe(ECONOMY.condition.recoveryBase + restRecoveryBonus(plan.rest))
      expect(world.pendingTournament).toBeNull()
    }
  })

  it('an INJURY still outranks it: the walkover beat fires, not the medical one', () => {
    const { world, rng } = arriveAt('arrive-inj', 0)
    world.injury = { kind: 'wrist niggle', severity: 'minor', weeksRemaining: 3, totalWeeks: 3, sinceWeek: world.week }
    tickWeek(world, rng)
    const weekEvents = world.events.filter((e) => e.week === world.week)
    expect(weekEvents.some((e) => e.text.startsWith('Walkover'))).toBe(true)
    expect(weekEvents.some((e) => e.text.includes('not cleared to play'))).toBe(false)
  })

  it('inside the warning band she PLAYS, and the doctor goes on record', () => {
    const { world, rng } = arriveAt('arrive-warn', CEILING - 1)
    tickWeek(world, rng)
    // she plays: the run really is computed
    expect(world.pendingTournament).not.toBeNull()
    const weekEvents = world.events.filter((e) => e.week === world.week)
    expect(weekEvents.some((e) => e.text.startsWith('Travel to'))).toBe(true) // the trip IS billed
    const warning = weekEvents.find((e) => e.text.startsWith("Doctor's warning"))
    expect(warning).toBeDefined()
    expect(warning!.type).toBe('info') // somebody SAID something; nothing happened to her body
    // ⚠ RE-AIMED 09.08 FOR R15-7, AND NOT WEAKENED. The second sentence used to read "He can warn
    // you; he cannot forbid it". The owner's sighting was the coach roster - `buildCoachRoster` draws
    // from COACH_FIRST_M *or* COACH_FIRST_F, so women are on it by construction and the copy called
    // them all "he" - and the doctor is the same defect with even less behind it: the doctor is never
    // named, never pictured and never gendered anywhere in the engine, so the pronoun was pure guess.
    // Same fix as the coach lines: drop it. The protected facts are unchanged and all still asserted
    // here - the event names the doctor, names the TIER she was cleared for, says the clearance is
    // marginal, and says the warning cannot stop her.
    expect(warning!.text).toBe(
      `Doctor's warning – she is cleared for the ${TIERS.local.label}, but only just. A warning is all it is; nobody can forbid it.`,
    )
    expect(warning!.text).toContain('but only just')
    expect(warning!.text).toMatch(/nobody can forbid it/)
    // ...and no pronoun guesses at a professional the game never gendered. "she" stays, obviously -
    // that one is the girl, and she is the one fact in this sentence nobody is guessing at.
    expect(warning!.text).not.toMatch(/\b(he|his|him|himself)\b/i)
    expect(warning!.text).not.toMatch(/[—А-Яа-яЁё]/) // short dash only, no Cyrillic in player copy
    skipTournament(world)
    closeTournament(world)
    // ...and it really was a run. This used to be proven by "she has a result row", which relied on
    // every tier paying at every finish; wave B ("first-round loss pays ZERO") made a first-round
    // exit bank nothing, so a result row is no longer evidence that she PLAYED. Proven instead off
    // the two records finalizeTournament writes UNCONDITIONALLY, which is the stronger claim
    // anyway – the doctor's subject is whether she took the court, not whether she scored.
    expect(world.events.some((e) => e.type === 'tournament' && e.week === world.week)).toBe(true)
    expect(world.bestFinishByTier.local).toBeDefined()
  })

  it('above the band she plays in silence – the doctor has nothing to say', () => {
    const { world, rng } = arriveAt('arrive-clear', CEILING)
    tickWeek(world, rng)
    expect(world.pendingTournament).not.toBeNull()
    expect(world.events.filter((e) => e.week === world.week).some((e) => e.text.startsWith("Doctor's warning"))).toBe(
      false,
    )
  })

  it('both halves are knob-driven: floor 0 disables the veto, ceiling = floor silences the warning', () => {
    const av = ECONOMY.availability as { medicalFloor: number; medicalWarningCeiling: number }
    const savedFloor = av.medicalFloor
    const savedCeiling = av.medicalWarningCeiling
    try {
      // floor 0: at condition 0 she plays after all (the pre-veto engine)
      av.medicalFloor = 0
      const { world, rng } = arriveAt('arrive-knob-off', 0)
      tickWeek(world, rng)
      expect(world.pendingTournament).not.toBeNull()
      expect(world.events.some((e) => e.text.includes('not cleared to play'))).toBe(false)

      // ceiling pulled down to the floor: the band is empty, so nobody is ever warned
      av.medicalFloor = savedFloor
      av.medicalWarningCeiling = savedFloor
      expect(medicalClearance(savedFloor)).toBe('clear')
      const quiet = arriveAt('arrive-knob-quiet', savedFloor)
      tickWeek(quiet.world, quiet.rng)
      expect(quiet.world.pendingTournament).not.toBeNull()
      expect(quiet.world.events.some((e) => e.text.startsWith("Doctor's warning"))).toBe(false)
    } finally {
      av.medicalFloor = savedFloor
      av.medicalWarningCeiling = savedCeiling
    }
  })

  it('ZERO new draws: the arrival check cannot move the MAIN weekly stream', () => {
    // The strongest form of the claim – the SAME career, once with the withdrawal firing and once
    // with the floor switched off so she plays instead. The shadow run lives on its own event-scoped
    // stream, and the check itself is integer comparison, so the main sequence must be byte-equal.
    function record(disableFloor: boolean): { draws: number[]; withdrawn: boolean } {
      const av = ECONOMY.availability as { medicalFloor: number }
      const saved = av.medicalFloor
      try {
        if (disableFloor) av.medicalFloor = 0
        const world = createWorld(injuryProofSeed('arrive-draws', 6))
        world.physioActive = false
        world.plan = { train: 85, rest: 15 }
        world.season = []
        const event = injectEvent(world, { week: 6, tier: 'local', deadlineWeek: 3 })
        enterEvent(world, event.id)
        const base = rngFromSeed(world.seed)
        const draws: number[] = []
        const rng = () => {
          const v = base()
          draws.push(v)
          return v
        }
        for (let i = 0; i < 10; i++) {
          if (world.week === 5) world.condition = 0 // wrecked on the eve of the play week
          tickWeek(world, rng)
          if (world.pendingTournament) {
            skipTournament(world)
            closeTournament(world)
          }
        }
        return { draws, withdrawn: world.events.some((e) => e.text.includes('not cleared to play')) }
      } finally {
        av.medicalFloor = saved
      }
    }
    const pulled = record(false)
    const played = record(true)
    expect(pulled.withdrawn).toBe(true) // the branch under test really fired…
    expect(played.withdrawn).toBe(false) // …and really did not, in the reference run
    expect(pulled.draws.length).toBe(played.draws.length)
    expect(hashOf(pulled.draws)).toBe(hashOf(played.draws))
  })
})

// =================================================================================================
// W3-SUMMER — THE SUMMER TRAINING BLOCK
// =================================================================================================
//
// The owner's correction: «я играл и брал отпуска между турнирами пропуская и коучинговые сессии в
// том числе, если мы летом сделаем реальную нагрузку с 2 тренировками в день я не вижу ничего
// плохого, это как раз частично компенсирует недостаток тренерских недель в другие периоды».
//
// So the block is VOLUME - a fuller week, not a luckier one - and it has to be checked on both
// halves at once: it develops more AND it costs condition, and it is never mandatory.

describe('the summer training block — volume, its price, and the trade', () => {
  const summerWeek = SUMMER_WEEKS[0] + 2

  function worldAt(week: number): ReturnType<typeof createWorld> {
    const w = createWorld('summer-unit')
    w.week = week
    return w
  }

  it('fires only inside the window, and the window is the calendar’s', () => {
    // ⚠ SEASON 0 ONLY, AND THAT IS NOW STATED RATHER THAN ASSUMED (round-16 #16). This walk pinned
    // `offset >= 25 && offset <= 33` and called it "the calendar's window" - but a season is 364
    // days and the calendar's year is 365.25, so the two only agree in season 0. The season-0 walk
    // is unchanged by the fix (offset 34 of season 0 is Monday 1 September 2031, which is September
    // on both readings); the test below is the half this one could never see.
    for (let w = 0; w < WEEKS_PER_YEAR; w++) {
      const inWindow = w >= SUMMER_WEEKS[0] && w <= SUMMER_WEEKS[1]
      expect(summerBlockWeek(worldAt(w)), `week ${w}`).toBe(inWindow)
      expect(isSummerWeek(w), `isSummerWeek ${w}`).toBe(inWindow)
    }
    // ...every season, not just the first.
    expect(summerBlockWeek(worldAt(summerWeek + WEEKS_PER_YEAR * 3))).toBe(true)
  })

  it('⚠ and the holidays never end before September, however far the season has drifted', () => {
    // THE OWNER'S RULE, measured (round-16 #16, tools/round16-read.ts on his own save): «после
    // экзаменов каникулы и удвоенные тренировки до сентября». The old ceiling was the season offset
    // alone, so from season 1 the first week outside it started in AUGUST and the calendar drew a
    // school week there - w86 Mon 30 Aug 2032, w138 Mon 29 Aug 2033, w190 Mon 28 Aug 2034.
    //
    // Asserted on `isSummerWeek` rather than `summerBlockWeek` deliberately: this is the CALENDAR's
    // predicate and it is pure, where the block's answer also depends on whether the girl in the
    // world has left school by then (`pastSchool`), which is a different question.
    for (const w of [86, 138, 190]) {
      expect(weekMonth(w), `w${w} is an August Monday`).toBe(8)
      expect(isSummerWeek(w), `w${w} is holidays, not school`).toBe(true)
    }
    // ...and September is school again, on the same three seasons and on season 0, which never drifted.
    for (const w of [34, 87, 139, 191]) {
      expect(weekMonth(w), `w${w} is a September Monday`).toBe(9)
      expect(isSummerWeek(w), `w${w} is school`).toBe(false)
    }
    // The floor is untouched: the drift can never open the window before the last exam paper.
    const exam = ECONOMY.availability.examWeeks[0]
    for (const s of [0, 1, 2, 3]) {
      expect(isSummerWeek(exam[1] + s * WEEKS_PER_YEAR), `exam week, season ${s}`).toBe(false)
      expect(isSummerWeek(exam[1] + 1 + s * WEEKS_PER_YEAR), `first holiday week, season ${s}`).toBe(true)
    }
  })

  it('⚠ IT IS NEVER MANDATORY: a family week in July loses the block, and that is the trade', () => {
    const w = worldAt(summerWeek)
    expect(summerBlockWeek(w)).toBe(true)
    // A booked holiday inside the window: no block that week. She is not on court twice a day at
    // the seaside, and the package pays her its own rest instead (resolveVacation).
    w.vacations = [{ week: summerWeek, packageId: 'staycation', paidCents: 0 }]
    expect(summerBlockWeek(w)).toBe(false)
    expect(summerLoadFactor(w)).toBe(1)
    expect(summerConditionCost(w)).toBe(0)
    // ...and the following week, back home, the block is running again. A holiday costs one week,
    // not the summer.
    expect(summerBlockWeek(worldAt(summerWeek + 1))).toBe(true)
  })

  it('and every other week she is not training through is refused too', () => {
    const injured = worldAt(summerWeek)
    injured.injury = { kind: 'ankle strain', severity: 'moderate', weeksRemaining: 3, totalWeeks: 3, sinceWeek: summerWeek }
    expect(summerBlockWeek(injured), 'a layoff').toBe(false)

    const resting = worldAt(summerWeek)
    resting.knock = { part: 'wrist', sinceWeek: summerWeek - 1, untilWeek: summerWeek + 1, repeat: false, choice: 'rest' }
    expect(summerBlockWeek(resting), 'a rested knock').toBe(false)

    // ...and a tournament week: she earns the match bonus and pays the run's own fatigue instead.
    const playing = worldAt(summerWeek)
    playing.season = [
      { id: 'sum-1', week: summerWeek, tier: 'local', surface: 'hard', label: 'Local Open', deadlineWeek: summerWeek - 2 } as never,
    ]
    playing.entries = ['sum-1']
    expect(summerBlockWeek(playing), 'a tournament week').toBe(false)
  })

  // ⚠⚠ RE-AIMED FOR v47, NOT WEAKENED – EVERY ASSERTION BELOW IS THE ONE THAT WAS HERE, PLUS TWO.
  //
  // WHAT CHANGED AND WHY. Until v47 these two knobs were a property of the WINDOW: granted
  // automatically to every school-free training week, whether or not she was actually on court twice a
  // day, because the plan was one scalar and nobody could decide that she was. The read-out has been
  // printing «N days on, two sessions a day» over a plan that could not express it. v47 makes the days
  // the plan (docs/specs/training-dials.md), and the owner ruled the consequence IN ADVANCE, 10.08:
  // «да» – the bonus follows the DOUBLING, not the calendar, because paying it regardless would pay
  // him for a choice he did not make and would leave the doubled week and the undoubled one identical.
  //
  // So the test now says what the block was always describing: a FULLY DOUBLED school-free week
  // reproduces 1.4 and −3 exactly – the same numbers, unmoved – and the arm that is new is the
  // undoubled one, which gets 1.0 and 0. The line that used to be implicit («she is on court twice a
  // day») is now a fact on the world instead of an assumption in the fixture.
  it('the two knobs are the two halves, and they move in opposite directions', () => {
    const w = worldAt(summerWeek)
    // she is on court twice a day – which is what this block has always MEANT, now stated
    w.plan = planFromWeek([['general', 'general'], ['general', 'general'], ['general', 'general'], [], [], [], []])
    expect(summerLoadFactor(w)).toBe(ECONOMY.summerBlock.loadFactor)
    expect(summerLoadFactor(w)).toBeGreaterThan(1) // she develops MORE
    expect(summerConditionCost(w)).toBe(ECONOMY.summerBlock.conditionCost)
    expect(summerConditionCost(w)).toBeGreaterThan(0) // ...and the week is FULLER
    // ⚠ SHE STILL COMES OUT AHEAD. A free training week returns recoveryBase plus the slider; the
    // block may never turn an ordinary week into a net drain, or nine of them in a row would be a
    // punishment rather than a choice.
    expect(ECONOMY.summerBlock.conditionCost).toBeLessThan(ECONOMY.condition.recoveryBase)
    // ⚠ AND THE NEW HALF: a week she did NOT double is inside the same window and buys nothing. That
    // is the whole of the v47 change, and it is the reason a migrated career's summers come back at 1.
    w.plan = planFromWeek([['general'], ['general'], ['general'], ['general'], ['general'], [], []])
    expect(summerLoadFactor(w)).toBe(1)
    expect(summerConditionCost(w)).toBe(0)
  })

  it('a real career runs the block and pays for it, and the MAIN capture cannot see it', () => {
    // The end-to-end wiring, on a real tick: skills move further over a summer and condition sits
    // lower than the same career with the knobs zeroed - and neither run touches the main stream.
    //
    // ⚠ THE CONDITION HALF IS MEASURED FROM A DEFICIT, AND THAT IS A FINDING RATHER THAN A FIXTURE
    // CONVENIENCE. A career that only trains never plays a match, so `matchDrain` never fires,
    // `recoveryBase` (8/wk) outruns everything and her condition is pinned at the ceiling of 100 all
    // year - the block's -3 is clamped away and is genuinely invisible. That is TRUE of a girl who
    // never competes and useless as a measurement, so the run opens at a realistic mid-season
    // deficit, which is where a body that is actually racing spends the summer. tools/summer-bench.ts
    // reports the same thing from both ends: 0.0 on the training-only arm, real on the racing one.
    const run = (loadFactor: number, conditionCost: number) => {
      const shipped = { ...ECONOMY.summerBlock }
      Object.assign(ECONOMY.summerBlock, { loadFactor, conditionCost })
      try {
        const w = createWorld('summer-e2e')
        // ⚠ RE-AIMED FOR v47, NOT WEAKENED (see the note on the knobs test above). Since the bonus
        // follows the doubling rather than the calendar, the arm that is supposed to RUN the block has
        // to be a week she actually doubled – six sessions across three days, which is what «two
        // sessions a day» has always meant. Both arms below run this identical plan, so the only thing
        // that varies between them is still the pair of knobs, and every assertion is the one that was
        // here before.
        w.plan = planFromWeek([['general', 'general'], ['general', 'general'], ['general', 'general'], [], [], [], []])
        const rng = rngFromSeed(w.seed)
        for (let i = 0; i < SUMMER_WEEKS[0] - 1; i++) tickWeek(w, rng)
        w.condition = 20 // a body carrying half a season, which is whose summer this is
        // Read the condition FIVE weeks into the block, before nine weeks of recovery have taken
        // both arms back to the ceiling and hidden the difference behind the clamp.
        for (let i = 0; i < 5; i++) tickWeek(w, rng)
        const condition = w.condition
        while (w.week <= SUMMER_WEEKS[1]) tickWeek(w, rng)
        return { skills: { ...w.skills }, condition, draws: w.rngMain.n }
      } finally {
        Object.assign(ECONOMY.summerBlock, shipped)
      }
    }
    const on = run(ECONOMY.summerBlock.loadFactor, ECONOMY.summerBlock.conditionCost)
    const off = run(1, 0)
    expect(on.skills.serve).toBeGreaterThan(off.skills.serve)
    expect(on.skills.groundstrokes).toBeGreaterThan(off.skills.groundstrokes)
    expect(on.condition).toBeLessThan(off.condition)
    // ...and she is still RECOVERING across the block: a fuller week is not a net drain.
    expect(on.condition).toBeGreaterThan(20)
    // ⚠ ZERO DRAW IMPLICATIONS. Both halves are post-draw arithmetic, so the two runs walk the MAIN
    // stream to exactly the same position - which is what makes the frozen capture untouchable.
    expect(on.draws).toBe(off.draws)
  })
})
