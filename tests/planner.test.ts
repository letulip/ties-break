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
  medicalBlock,
  bookVacation,
  cancelVacation,
  bookPractice,
  cancelPractice,
  practiceCaution,
  consecutivePracticeWeeks,
  injuryTau,
  toSnapshot,
  skipTournament,
  closeTournament,
  SAVE_SCHEMA_VERSION,
  KID_ID,
  type WorldState,
  practiceCoachRateFor,
  hireCoach,
} from '../src/engine/world'
import { migrateSave } from '../src/engine/migrations'
import { bestFitCoachAt, coachById } from '../src/engine/coach'
import { rngFromSeed } from '../src/engine/rng'
import {
  ECONOMY,
  recommendVacationPackage,
  vacationPackage,
  vacationPriceCents,
  practiceFeeCents,
} from '../src/engine/economy'
import { TIERS } from '../src/engine/season/calendar'
import { DEFAULT_PROFILE, type FamilyBackground, type PlayerProfile } from '../src/shared/protocol'
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
// Season planner (docs/specs/season-planner.md) — vacations + practice matches.
// Schema v13. ALL new randomness lives on the purpose-scoped sub-streams
// `seed:vacation:week:packageId` (price quotes) and `seed:practice:week` (court
// fee) / `seed:practicematch:week` (the friendly itself); player bookings are
// PURE STATE. The MAIN weekly draw stream must stay byte-identical to the frozen
// B1/C1 capture (see REF below) – P1 below re-proves it with a booking-heavy career.
// ---------------------------------------------------------------------------

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
// ⚠ RE-PINNED, FOR THE LAST TIME A CALENDAR CHANGE CAN DO IT: 51642 -> 41550 draws (hash
// cae178fc -> e6b0c709) by the AI sub-stream refactor. The canonical AI tournaments left the MAIN
// weekly stream for their own event-scoped `seed:aitour:<event.id>` stream, so the calendar's size
// is no longer part of the weekly draw count – the flaw that forced the earlier 45239 -> 51642
// move. P1's actual claim – that PLANNER BOOKINGS never perturb that stream – is unchanged and
// still proven below: both tests book something every single week and still reproduce the capture
// exactly.
//
// ⚠ kidRank RE-PINNED 140 -> 141 by the rival-life slice, deliberately. P1's claim is about the
// PLAYER's bookings, and that claim is untouched: count and hash still reproduce byte-for-byte
// under a career that books something every week. What moved is the AI world – rivals now tire
// from their own schedule and read the surface through a play style – so one more junior finishes
// the year in the points. Zero RNG draws were added; only outcomes changed.
// Full reasoning at the REF declaration in tests/condition.test.ts.
// 141 -> 140 at wave-3 integration: the surface x style table changes which of her matches she wins, so a different junior ends the year holding counting points. The STREAM is untouched (count/hash identical) - only the ranking derived from it moved.
//
// ⚠ kidRank RE-PINNED 140 -> 133 by wave B "first-round loss pays ZERO", deliberately. P1's claim
// is about the PLAYER's bookings and is untouched: a career that books something every single week
// still reproduces count 41550 / hash e6b0c709 byte-for-byte. What moved is the AI table – a
// first-round exit now banks nothing (`awardAiPoints` writes only when `points > 0`), so seven
// fewer juniors end the year with counting points and the point-less kid sits inside a bigger
// 0-point tie. Full reasoning at the REF declaration in tests/condition.test.ts.
// ⚠ RE-PINNED 133 -> 135 (29.07, partial seeding). The DRAW SEQUENCE did not move - `count` and
// `hash` above are untouched and still pass, which is the fact this block exists to protect. What
// moved is her RANK, a companion pin carried alongside: the bracket now seeds only the top 8 of 32
// and shuffles everyone else, the kid included, so her results in a 52-week window differ and so
// does the rank they earn. See docs/specs/rank-plateau.md.
// ⚠ RE-PINNED 135 -> 126 (29.07, the two ladders). `count`/`hash`/`head`/`tail` did NOT move; the
// stream is untouched and that is what this block guards. What moved is the MEANING of kidRank: it
// is now her place in the ITF table, not in a single mixed one, so it is a different number about a
// different question. See docs/specs/two-ladders.md.
  // ⚠⚠⚠ AND THE TWO ROUND-15 SLICES BOTH TOUCHED THIS FIELD, from opposite directions. Both notes
  // below are kept because both facts are live: the fifth attribute (v25) re-derived the number and
  // found it unmoved, and the ranking fix changed what the number MEANS. The value here is measured
  // with BOTH in, not carried over from either branch.
//
// ⚠⚠ kidRank RE-PINNED 126 -> 119 (30.07, fix/ranking-truth) - and the re-pin above was WRONG about
// which table 126 came from. `recomputeRankAndMilestones`, the tick's last writer of `world.kidRank`,
// still ranked with no track predicate, so 126 was the MIXED (both-ladders) place while the comment
// claimed ITF. 119 is the ITF place, now by construction: there is one writer. P1's own claim - that
// PLANNER BOOKINGS never perturb the main stream - is UNTOUCHED and still proves itself: a career that
// books something every single week reproduces count 41550 / hash e6b0c709 byte-for-byte, re-derived
// on this branch both before and after the fix. Full reasoning, and the arithmetic that identifies
// which table each number came from, at the REF declaration in tests/condition.test.ts. The
// one-writer property is now pinned directly by B1c there.
// ⚠ 121, MEASURED WITH BOTH ROUND-15 SLICES IN. The ranking fix alone gives 119; v25's rally term
// changes which juniors end the year holding points, and the two compose to 121. Neither branch was
// wrong - this is what the merged code produces, measured here rather than carried over.
// ⚠ kidRank RE-PINNED 121 -> 120 (30.07, task 55's cohort half). `count` and `hash` are UNTOUCHED and
// still reproduce byte-for-byte - the birth months come off their own sub-stream and the head start is
// post-draw arithmetic. What moved is which juniors hold points, because every rival now sits inside her
// own birth year. Full reasoning at the REF declaration in tests/condition.test.ts.
//
// ⚠⚠ kidRank RE-PINNED AGAIN 120 -> 164 (31.07, task #17, the adult rungs), and `count` 41550 and
// `hash` e6b0c709 are AGAIN untouched and re-derived byte-for-byte on this branch. THE FROZEN CAPTURE
// DID NOT MOVE: the calendar grew from 92 events a season to 139, and since the AI sub-stream
// refactor the calendar's size is no longer part of the weekly draw count at all (see the REF note in
// tests/round9.test.ts, "for the last time a calendar change can do it"). What moved is that a much
// fuller calendar leaves far more juniors holding a counting result, so the tie at the FLOOR of the
// table - which is where a point-less kid sits - is shared by fewer people and its dense rank is
// deeper. Same mechanism as the note above, forty times the scale. Full reasoning at the REF
// declaration in tests/condition.test.ts.
//
// ⚠⚠ kidRank RE-PINNED 164 -> 154 (31.07, §4.1, the junior age cap). `count` 41550 and `hash`
// e6b0c709 are UNTOUCHED and re-derived byte-for-byte on this branch, which is what P1 exists to
// protect and which this slice tested harder than any before it: the age cap genuinely changes the
// per-event draw COUNT on the J rungs (a J30 field is different people now), and the main stream
// still does not notice, because every one of those draws comes off the event-scoped
// `seed:aitour:<id>` / `seed:kidtour:<id>` sub-stream. Full reasoning at the REF declaration in
// tests/condition.test.ts.
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
//
// ⚠ THE CROSS-VERSION CONSTANT RETIRED AT v35 (P3, rng-persistence): `count`/`hash` left this
// object because no loaded career depends on the historical draw count any more — the position is
// persisted per career, and P1 below is PAIRWISE now: a booking-heavy career against the
// nothing-booked baseline, same harness, same code, byte-identical MAIN taps. The single
// documented capture (and the regime-change story) lives at the REF declaration in
// tests/condition.test.ts B1. `kidRank` stays: it was never the capture, it is the companion
// MEASUREMENT, and the whole re-pin history above is the argument for keeping it pinned.
// ⚠ RE-PINNED 152 -> 138 by W2-LADDER: TIER_LADDER 9 -> 12 re-spaces `tierPhase`, the calendar
// re-deals, and the AI year resolves on different event sub-streams. P1's pairwise A/B halves are
// untouched and still byte-identical; the mechanism note lives at the B1 REF in
// tests/condition.test.ts.
// ⚠ RE-PINNED 138 -> 137 BY W2-FIELD2 (the W family's entrant windows re-measured). `selectEntrants`
// is ONE function, so a W rung's `entrantPctBand` is read by the CANONICAL `seed:aitour:` brackets
// as well as by her shadow draws: the family's floors rose (w15 0.15 -> 0.35, w35 0.08 -> 0.25, and
// so on up), a different slice of the 199-cohort is therefore drawn into the W events, and
// `resolveDoubleBookings` leaves a different set of girls free for the same week's J draws. A
// different set of juniors ends the year holding counting ITF points and her dense place moves by
// one - the same post-draw composition mechanism every re-pin above records. THE CAPTURE ITSELF IS
// UNTOUCHED: count 41550 and hash e6b0c709 reproduce byte-for-byte.
// ⚠ RE-PINNED 137 -> 125 BY W2-FATIGUE (the fatigue re-price). `recoveryBase` 1 -> 8 reaches every
// body in the world through the one shared condition math, so the strength coupling resolves the
// year's brackets on a fresher field and a different set of juniors ends it holding counting points.
// The A/B assertions ABOVE this line are the ones this block exists for and they are untouched: the
// booking-heavy career's draw count and hash still equal the baseline career's byte-for-byte, which
// is what "the planner never perturbs the main stream" means. Full argument at the B1 REF in
// tests/condition.test.ts.
//
// ⚠ RE-PINNED 125 -> 123 BY W2-WINDOW, calendar rather than rule: placement is seeded now and every
// tier's count is measured against the PLAYABLE span, so the cohort meets a different set of draws.
// The A/B halves above are again untouched - the placement jitter is drawn from a purpose-scoped
// sub-stream (`:calweek:`), never MAIN, so both arms still tap identical MAIN sequences.
// ⚠ RE-PINNED 123 -> 121 by W2-WINDOW's DOMESTIC RE-PRICE (surcharge 0/1/2 -> 1/2/3): the cohort
// carries the same condition math the kid does, so a dearer domestic week resolves the year's
// brackets on a slightly more tired field and a different set of juniors ends it in the points.
// Post-draw again; the A/B halves above are untouched.
// ⚠ RE-PINNED 121 -> 123 BY W3-ACT2 (content, not a rule): the four act-3 rungs add 30 events a
// season, so the cohort meets 30 more draws and a different set of juniors ends the year holding
// counting ITF points. The declaration this one mirrors is tests/condition.test.ts B1's REF; the
// frozen MAIN capture is untouched by construction (every bracket runs on `seed:aitour:<id>`).
// ⚠⚠ RE-PINNED 123 -> 89 BY W3-FIELD3 (04.08) – a RULE this time, and the largest move this
// companion has taken since the adult rungs. The W-track canonical brackets draw from LIVE cohort ∪
// 364 derived professionals and a professional leaves NO ledger row, so the season's ~98 W events
// stop landing on the 199 juniors altogether (W result rows per rival over a 20-week window: 6.79 ->
// 0.00). The cohort plays out the year fresher, its J draws resolve differently, and a different set
// of juniors ends the year holding counting ITF points. THE A/B HALVES ABOVE THIS LINE ARE THE POINT
// OF THIS BLOCK AND THEY ARE UNTOUCHED: the booking-heavy career and the baseline still take
// byte-identical MAIN sequences (same count, same hash), asserted two lines before this constant is
// ever read. Full argument at the B1 REF in tests/condition.test.ts.
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
// ⚠ RE-AIMED AGAIN BY W4-LIVES (04.08): 90 -> 89, ONE place. The professionals have careers now
// (FIELD.career) - they age +1 a season and retire - so the population's AGE HISTOGRAM changed
// shape, `selectEntrants` gates candidates on age, a W event's entrant set changed, which JUNIORS a
// W week books changed, and the J draws those juniors were no longer free for changed with it.
// Second-order, on a different track from the one this number folds. SHE DID NOTHING DIFFERENT.
//
// ⚠⚠ AND IN THIS FILE THE A/B IS THE POINT: `draws.length` and `hashOf(draws)` are asserted two
// lines ABOVE this constant and both still pass, so input-independence - the fairness property -
// is untouched. Only the world's own outcome moved.
//
// ⚠ AND RE-AIMED A THIRD TIME BY LADDER-PACE STEP 1 (05.08): 89 -> 90, ONE place, SAME MECHANISM.
// `FIELD.size` 364 -> 520 makes the W universe 719 candidates instead of 563 and `selectEntrants`
// spends one draw per candidate, so a W event's entrant set changed, so which JUNIORS a W week books
// changed, so the J draws they were no longer free for changed. ⚠⚠ AND IN THIS FILE THE A/B IS
// STILL THE POINT: `draws.length` and `hashOf(draws)` are asserted two lines above and both pass on
// the deeper field, so input-independence survives a change to the size of the world.
//
// ⚠ AND RE-AIMED A FOURTH TIME BY POINTS-BY-THE-BOOK (05.08): 90 -> 91, ONE place, SAME MECHANISM.
// Correction 2 re-prices W15 (10 -> 15) and W35 (20 -> 35) to the WTA's own chart, so every LIVE
// girl's professional book changes, so her row moves in the merged W table, so `selectEntrants`'
// percentile bands land on different people, so which JUNIORS a W week books changes, so the J draws
// they were no longer free for change. ⚠⚠ AND IN THIS FILE THE A/B IS STILL THE POINT:
// `draws.length` and `hashOf(draws)` are asserted two lines above and both pass on the re-priced
// table, so input-independence survives a change to what the tour PAYS.
//
// ⚠ AND RE-AIMED A FIFTH TIME BY POPULATION-1600 (05.08): 91 -> 87, four places, SAME MECHANISM.
// `FIELD.size` 520 -> 1,600 makes the W universe 1,799 candidates instead of 719, and
// `selectEntrants` spends one draw per candidate off `seed:aitour:<id>` / `seed:kidtour:<id>` - so a
// W event's entrant set changed, so which JUNIORS a W week books changed, so the J draws they were
// no longer free for changed. ⚠⚠ AND IN THIS FILE THE A/B IS STILL THE POINT: `draws.length` and
// `hashOf(draws)` are asserted two lines above and both pass against a world three times the size,
// so input-independence survives tripling the population.
// ⚠ RE-PINNED 87 -> 89 BY P1 – JUNIOR ACCESS (15.08). W15's on-ramp stopped reading 120 ITF junior
// points and started reading an ITF junior RANKING, on both sides of the tour (one door, by design),
// so a slightly different two-of-thirty-two hold the on-ramp slots at a W15 and the J draws those
// juniors were no longer free for changed. Post-draw arithmetic once more: the capture is asserted
// above this line and reproduces byte-for-byte (41550 / e6b0c709) – P1 draws on no stream at all.
// See the same note on tests/condition.test.ts B1's REF. docs/specs/junior-access-2026-08.md.
const REF = { kidRank: 89 }
// ⚠ CHECKED AND HELD AT v25 (30.07, the fifth attribute), and the checking is the point - this
// number was expected to move and did not. `count`/`hash`/`head`/`tail` cannot move by
// construction: v25 adds no draw to any stream the weekly tick walks. Her build's fifth number
// comes off a draw APPENDED to `seed:kid` and her ceiling's off one appended to `seed:potential`
// (appending leaves every earlier draw byte-identical); `growWeek` still spends exactly one luck
// draw for the week; and the COHORT deliberately stores no fifth attribute at all (`AiPlayer =
// Omit<MatchPlayer, 'groundstrokes'>`, derived at match time) so `driftCohort` still spends exactly
// four main-stream draws per player - which is literally what 41550 is made of.
//
// kidRank COULD still have moved, and briefly did: `basePServe` now carries a rally term, so
// asymmetric matchups resolve differently and a different set of juniors can end the year in the
// points. It read 127 mid-slice and came back to 126 once the aggressive baseliner's groundstroke
// cost was split across clay AND grass (match/style.ts) - which is the retune that kept the grass
// window the server's. So this is the pre-v25 value, arrived at again rather than left alone.

function injectEvent(
  world: WorldState,
  partial: { week: number; tier: TierId; id?: string; deadlineWeek?: number },
): SeasonEvent {
  const e: SeasonEvent = {
    id: partial.id ?? `pl-${partial.week}-${partial.tier}`,
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

function bgProfile(background: FamilyBackground): PlayerProfile {
  return {
    kidName: 'Vera',
    kidLastName: 'Martin',
    gender: 'girl',
    country: 'US',
    background,
    coachTier: 'self',
    playStyle: 'all-court',
    birthMonth: 6,
    birthDay: 15,
  }
}

/** A week with no scheduled event, no blackout, safely in the future. */
function freeWeek(world: WorldState): number {
  for (let w = world.week + 1; w < world.week + 40; w++) {
    if (world.season.some((e) => e.week === w)) continue
    const offset = w % 52
    if (offset >= 49 || (offset >= 24 && offset <= 25)) continue
    return w
  }
  throw new Error('no free week')
}

// ---------------------------------------------------------------------------
// P1 — THE INVARIANT (blocks merge): bookings are pure state, quotes/friendlies
// live on private sub-streams, so the MAIN per-week draw sequence is untouched.
// ---------------------------------------------------------------------------
describe('P1 — main-stream RNG invariance with a planner-heavy career', () => {
  function record(mutate?: (w: WorldState, week: number) => void): { draws: number[]; world: WorldState } {
    const world = createWorld('bench-working-0')
    const base = rngFromSeed(world.seed)
    const draws: number[] = []
    const rng = () => {
      const v = base()
      draws.push(v)
      return v
    }
    for (let i = 0; i < 52; i++) {
      if (mutate) mutate(world, world.week)
      tickWeek(world, rng)
      if (world.pendingTournament) {
        skipTournament(world)
        closeTournament(world)
      }
    }
    return { draws, world }
  }

  it('booking a practice EVERY week never perturbs the main stream (A/B)', () => {
    const base = record()
    const { draws, world } = record((w) => {
      const next = w.week + 1
      w.fundsCents = 9_999_999_00
      try {
        bookPractice(w, next, false)
      } catch {
        /* blackout / conflict weeks are simply not bookable */
      }
    })
    expect(draws.length).toBe(base.draws.length)
    expect(hashOf(draws)).toBe(hashOf(base.draws))
    expect(world.kidRank).toBe(REF.kidRank)
    // ...and she really did play friendlies (the branch was exercised)
    expect(world.events.some((e) => e.friendly === true)).toBe(true)
  })

  it('booking vacations (incl. the buffed resort) never perturbs the main stream (A/B)', () => {
    const base = record()
    const { draws, world } = record((w) => {
      const next = w.week + 1
      w.fundsCents = 9_999_999_00
      try {
        bookVacation(w, next, next % 3 === 0 ? 'resort' : 'staycation')
      } catch {
        /* not bookable this week */
      }
    })
    expect(draws.length).toBe(base.draws.length)
    expect(hashOf(draws)).toBe(hashOf(base.draws))
    expect(world.kidRank).toBe(REF.kidRank)
    expect(world.events.some((e) => e.text.startsWith('Family vacation'))).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// P2 — schema v13 + migration.
// ---------------------------------------------------------------------------
describe('P2 — schema v13', () => {
  it('is at version 13 and a fresh world carries empty planner state', () => {
    // The planner landed AT v13; later slices keep bumping the schema (R10-9's season history is
    // v14), so this asserts "v13 or later" – the planner state below is what the case is about.
    expect(SAVE_SCHEMA_VERSION).toBeGreaterThanOrEqual(13)
    const w = createWorld('p2')
    expect(w.vacations).toEqual([])
    expect(w.practices).toEqual([])
    expect(w.recoveryBuff).toBeNull()
  })

  it('migrates a v12 save (append-only, idempotent)', () => {
    const v12 = JSON.parse(
      readFileSync(new URL('./fixtures/saves/v12.json', import.meta.url), 'utf8'),
    ) as Record<string, unknown>
    const migrated = migrateSave(structuredClone(v12))
    expect(migrated.schemaVersion).toBe(SAVE_SCHEMA_VERSION)
    expect(migrated.vacations).toEqual([])
    expect(migrated.practices).toEqual([])
    expect(migrated.recoveryBuff).toBeNull()
    // everything else untouched
    expect(migrated.condition).toBe(v12.condition)
    expect(migrated.week).toBe(v12.week)
    // idempotent
    expect(migrateSave(structuredClone(migrated))).toEqual(migrated)
  })

  it('keeps existing v13 planner state on re-migration (never resets a booking)', () => {
    const v13 = JSON.parse(
      readFileSync(new URL('./fixtures/saves/v13.json', import.meta.url), 'utf8'),
    ) as Record<string, unknown>
    const migrated = migrateSave(structuredClone(v13))
    expect(migrated.schemaVersion).toBe(SAVE_SCHEMA_VERSION)
    expect(migrated.vacations.length).toBeGreaterThan(0)
    expect(migrated.practices.length).toBeGreaterThan(0)
  })
})

// ---------------------------------------------------------------------------
// P3 — vacation catalogue + deterministic corridor pricing.
// ---------------------------------------------------------------------------
describe('P3 — vacation pricing (middle-anchored band × wealth corridor)', () => {
  // ⚠ RE-PINNED 03.08 (W2-FATIGUE §4, owner «надо все приподнять»): 12/14/16/20/25/30 ->
  // 18/22/26/32/40/48, PRICES UNTOUCHED. The table is denominated in rest weeks and `recoveryBase`
  // moved 1 -> 8 in the same pass, so the new ladder is 2.2 · 2.7 · 3.2 · 4.0 · 5.0 · 6.0 rest weeks
  // - the spec's §4 column to the decimal. Left where it was, the elite week would have been worth
  // under four rest weeks and the free one barely more than one, i.e. the ladder would have become a
  // rounding error rather than a decision. The buffs and buffWeeks are deliberately NOT re-tuned:
  // they are injury protection, which the same wave re-calibrates on its own axis.
  //
  // ⚠ RE-PINNED AGAIN 12.08, THE BOTTOM TWO ONLY (owner: «шифт-8 на всех: у первого будет
  // восстановление +10, у второго +18, у третьего и далее останется без изменений»):
  // 18/22 -> 10/18. The 03.08 lift left the free staycation four points behind a PAID week at
  // grandma's, so the free rung impersonated the paid ones and the picker's own "cheapest
  // sufficient" rule recommended it nearly always. The bottom now steps by 8 (10 -> 18 -> 26);
  // rungs three and up are untouched, exactly as the ruling says.
  it('has the owner-approved six packages with the spec gains and buffs', () => {
    const ids = ECONOMY.vacation.packages.map((p) => p.id)
    expect(ids).toEqual(['staycation', 'grandma', 'camping', 'seaside', 'resort', 'elite'])
    expect(ECONOMY.vacation.packages.map((p) => p.conditionGain)).toEqual([10, 18, 26, 32, 40, 48])
    expect(vacationPackage('resort')!.buffFactor).toBe(0.9)
    expect(vacationPackage('elite')!.buffFactor).toBe(0.85)
    expect(vacationPackage('staycation')!.buffFactor).toBe(1)
    expect(ECONOMY.vacation.buffWeeks).toBe(4)
    // the staycation is free; the ladder is strictly ascending in price
    expect(vacationPackage('staycation')!.priceCents).toEqual([0, 0])
    // ...and the gain ladder is strictly ascending too, which is what every copy licence and grid
    // arc in the game reads (diary.ts, weekGrid.ts): the sentences climb WITH the number.
    const gains = ECONOMY.vacation.packages.map((p) => p.conditionGain)
    for (let i = 1; i < gains.length; i++) expect(gains[i]).toBeGreaterThan(gains[i - 1])
    // The unit the table is written in (spec §4): every rung is denominated in rest weeks at the
    // repriced base, which is why the two knobs may never be re-tuned apart. ⚠ 12.08: the bottom
    // two moved with the owner's re-step (18/22 -> 10/18), so the free week is now worth 1.25 rest
    // weeks against grandma's 2.25 - a full rest-week between them where there was half of one.
    expect(gains.map((g) => g / ECONOMY.condition.recoveryBase)).toEqual([1.25, 2.25, 3.25, 4, 5, 6])
  })

  // ⚠ MONEY BUYS RECOVERY SPEED, NEVER RECOVERY (spec §4, and the rule act2-pro-tour.md §3 sets for
  // prize money): the SAME package must restore the SAME condition for every family, and only the
  // QUOTE may differ. It is true by construction - `resolveVacation` adds `pkg.conditionGain` flat
  // and the wealth corridor is applied only inside `vacationPriceCents` - and this test is what
  // keeps it true by construction rather than by luck, because the corridor is a one-line change
  // away from any number in this file. Both halves are asserted together on purpose: a version of
  // this test that only checked the gain would pass on a build that had also stopped charging
  // different families different prices, which would be the opposite bug.
  it('the wealth corridor prices the week and never scales the gain', () => {
    const backgrounds = ['working', 'middle', 'wealthy'] as const
    // Injuries OFF for the arithmetic: `kitWearAt` reads the BACKGROUND, so a live injury stream is
    // the one thing that could legitimately differ between the three worlds and it would tell us
    // nothing about the gain. Same patch idiom as P7 below, restored in `finally`.
    const av = ECONOMY.availability as unknown as { injuryBaseChance: number }
    const savedBase = av.injuryBaseChance
    try {
      av.injuryBaseChance = 0
      for (const pkg of ECONOMY.vacation.packages) {
        const gained = backgrounds.map((background) => {
          const w = createWorld('P3-corridor', { ...DEFAULT_PROFILE, background })
          w.fundsCents = 100_000_00
          w.physioActive = false
          w.condition = 40
          bookVacation(w, w.week + 1, pkg.id)
          tickWeek(w, rngFromSeed(w.seed))
          return w.condition
        })
        // the SAME package, the same week, the same starting condition -> the same body
        expect(new Set(gained).size, `${pkg.id} gain must not vary by background`).toBe(1)
        // ...and it is the catalogue's own number, on top of the free week's recovery (the default
        // plan is 75/25, so the slider pays +1) - the gain RIDES on the week, never replaces it.
        expect(gained[0], `${pkg.id} lands its catalogue gain`).toBe(
          40 + pkg.conditionGain + ECONOMY.condition.recoveryBase + 1,
        )
        // ...and the free package aside, the QUOTE does vary: working < middle < wealthy
        if (pkg.priceCents[1] > 0) {
          const quotes = backgrounds.map((b) => vacationPriceCents('P3-corridor', 1, pkg.id, b))
          expect(quotes[0], `${pkg.id} working < middle`).toBeLessThan(quotes[1])
          expect(quotes[1], `${pkg.id} middle < wealthy`).toBeLessThan(quotes[2])
        }
      }
    } finally {
      av.injuryBaseChance = savedBase
    }
  })

  // ⚠ W7 – EXACTLY ONE PACKAGE MAY QUOTE ZERO, and it is the one whose whole design is being free.
  // The owner: «Grandma's village регулярно стоит 0 или 3 доллара для 8к, мне кажется там можно
  // какой-то порог цены сделать». `grandma`'s band opened at 0, so a working family was quoted
  // $0.00-$40.00 uniformly - 1 in 78 quotes rendered "$0" and 1 in 7 came in under five dollars.
  //
  // THE CLAIM PINNED HERE IS NOT THE NUMBER, IT IS THE PROPERTY, because a number would just be the
  // catalogue read back to itself. What must stay true is that a PAID rung cannot quote free: a zero
  // quote falls through both of `bookVacation`'s free-package carve-outs (`priceCents > 0` guards the
  // affordability check AND the expense row), so a package that can roll 0 is a package that is
  // occasionally bookable at negative funds and invisible on the Money screen. That is a real bug
  // wearing a price tag, and it is what this test would catch if the floor were ever removed.
  it('only the FREE package can quote nothing - a paid rung never rolls $0', () => {
    for (const pkg of ECONOMY.vacation.packages) {
      const free = pkg.priceCents[1] === 0
      if (free) {
        expect(pkg.priceCents, `${pkg.id} is the free rung`).toEqual([0, 0])
        continue
      }
      expect(pkg.priceCents[0], `${pkg.id} can be quoted free`).toBeGreaterThan(0)
      // ...and no career, at any corridor, in any week, can talk it down to nothing
      for (const bg of ['working', 'middle', 'wealthy'] as FamilyBackground[]) {
        for (let w = 1; w <= 60; w++) {
          expect(vacationPriceCents('floor-seed', w, pkg.id, bg), `${pkg.id} w${w} ${bg}`).toBeGreaterThan(0)
        }
      }
    }
    // and the ladder still climbs: every rung's floor clears the one below it
    const floors = ECONOMY.vacation.packages.map((p) => p.priceCents[0])
    for (let i = 1; i < floors.length; i++) expect(floors[i]).toBeGreaterThan(floors[i - 1])
  })

  it('quotes deterministically off seed:vacation:week:packageId, inside band × corridor', () => {
    const quote = (bg: FamilyBackground) => vacationPriceCents('quote-seed', 7, 'seaside', bg)
    expect(quote('middle')).toBe(quote('middle')) // deterministic
    const [lo, hi] = vacationPackage('seaside')!.priceCents
    for (const bg of ['working', 'middle', 'wealthy'] as FamilyBackground[]) {
      const [cLo, cHi] = ECONOMY.wealthCorridor[bg]
      expect(quote(bg)).toBeGreaterThanOrEqual(Math.floor(lo * cLo))
      expect(quote(bg)).toBeLessThanOrEqual(Math.ceil(hi * cHi))
    }
    // same roll, disjoint corridors -> working < middle < wealthy for the SAME offer
    expect(quote('working')).toBeLessThan(quote('middle'))
    expect(quote('middle')).toBeLessThan(quote('wealthy'))
    // the quote is week- and package-scoped
    expect(vacationPriceCents('quote-seed', 8, 'seaside', 'middle')).not.toBe(quote('middle'))
    expect(vacationPriceCents('quote-seed', 7, 'resort', 'middle')).not.toBe(quote('middle'))
    // free package stays free in every corridor
    expect(vacationPriceCents('quote-seed', 7, 'staycation', 'wealthy')).toBe(0)
  })

  it('practice court fee is $30-80 × corridor off seed:practice:week; the coach costs HER coach\'s rate', () => {
    // ⚠ RE-AIMED BY THE OWNER'S RULING (R3): «справедливо будет завязать на стоимость выбранного
    // тренера или best-fit если не выбран». The coach half used to be a flat $120-250 band of its
    // own; it is now a share of the rate of the coach she actually employs. The band is gone, so
    // the assertion that bounded the extra by it is replaced by one that bounds it by HIS rate.
    //
    // THE COURT HALF IS UNTOUCHED AND STILL ASSERTED FIRST, which is the property that mattered
    // then and still does: the court draw comes first on `seed:practice:week`, so a coach-free
    // quote is byte-identical to every one this function has ever given.
    const fee = practiceFeeCents('court-seed', 4, 'middle', false)
    expect(fee).toBe(practiceFeeCents('court-seed', 4, 'middle', false))
    const [lo, hi] = ECONOMY.practice.courtFeeCents
    expect(fee).toBeGreaterThanOrEqual(Math.floor(lo * ECONOMY.wealthCorridor.middle[0]))
    expect(fee).toBeLessThanOrEqual(Math.ceil(hi * ECONOMY.wealthCorridor.middle[1]))
    expect(practiceFeeCents('court-seed', 4, 'working', false)).toBeLessThan(fee)
    // Adding the coach never moves the court part, and costs `coachHours x coachShare` of HIS rate.
    const rate = 50_00
    const extra = practiceFeeCents('court-seed', 4, 'middle', true, rate) - fee
    const hours = ECONOMY.practice.coachHours * ECONOMY.practice.coachShare
    expect(extra).toBeGreaterThanOrEqual(Math.floor(rate * hours * ECONOMY.wealthCorridor.middle[0]))
    expect(extra).toBeLessThanOrEqual(Math.ceil(rate * hours * ECONOMY.wealthCorridor.middle[1]))
    // A dearer coach really does make the friendly dearer - the point of the ruling.
    expect(practiceFeeCents('court-seed', 4, 'middle', true, 120_00)).toBeGreaterThan(
      practiceFeeCents('court-seed', 4, 'middle', true, 30_00),
    )
  })

  it('the friendly\'s coach IS her coach, and the cheapest rung when she has none', () => {
    // bgProfile is self-coached, so hire someone first - the point is that HIS rate is the price.
    const world = createWorld('p3-friendly', bgProfile('middle'))
    const target = bestFitCoachAt(world.seed, 14, 'high', world.profile.playStyle)!
    hireCoach(world, target.id)
    const hers = coachById(world.seed, 14, world.coachId)!
    expect(practiceCoachRateFor(world, 4)).toBe(hers.rateCents)
    // Self-coached: the best-fit coach at the cheapest hireable rung, because a family with no
    // coach is hiring one for a single afternoon rather than holding a retainer.
    hireCoach(world, null)
    const fallback = bestFitCoachAt(world.seed, 14, 'budget', world.profile.playStyle)!
    expect(practiceCoachRateFor(world, 4)).toBe(fallback.rateCents)
    expect(practiceCoachRateFor(world, 4)).toBeLessThan(hers.rateCents)
  })
})

// ---------------------------------------------------------------------------
// P4 — booking / cancelling (money + validation), mirroring entry withdrawal.
// ---------------------------------------------------------------------------
describe('P4 — booking and cancelling', () => {
  it('books a vacation: charges the quote, records it, refunds in full before the week starts', () => {
    const w = createWorld('p4-vac', bgProfile('middle'))
    const week = freeWeek(w)
    const price = vacationPriceCents(w.seed, week, 'seaside', 'middle')
    const before = w.fundsCents
    bookVacation(w, week, 'seaside')
    expect(w.fundsCents).toBe(before - price)
    expect(w.vacations).toEqual([{ week, packageId: 'seaside', paidCents: price }])
    expect(w.events.some((e) => e.category === 'vacation' && e.amountCents === -price)).toBe(true)

    cancelVacation(w, week)
    expect(w.fundsCents).toBe(before) // FULL refund (mirror of entry withdrawal)
    expect(w.vacations).toEqual([])
    expect(w.events.some((e) => e.category === 'vacation' && e.amountCents === price)).toBe(true)
  })

  it('books a practice with and without the coach and refunds on cancel', () => {
    const w = createWorld('p4-pra', bgProfile('middle'))
    const week = freeWeek(w)
    // ⚠ RE-AIMED (R3): the quote now needs HER coach's rate, because that is what the coach half
    // costs. `practiceCoachRateFor` is the one definition of it, and the engine bills through the
    // same call - so this stays a test that the BOOKING charges exactly the QUOTE, which is the
    // fact it exists for, rather than a second copy of the pricing.
    const fee = practiceFeeCents(w.seed, week, 'middle', true, practiceCoachRateFor(w, week))
    const before = w.fundsCents
    bookPractice(w, week, true)
    expect(w.fundsCents).toBe(before - fee)
    expect(w.practices).toEqual([{ week, paidCents: fee, withCoach: true }])
    cancelPractice(w, week)
    expect(w.fundsCents).toBe(before)
    expect(w.practices).toEqual([])
  })

  it('refuses double bookings, past weeks, blackout weeks, entered weeks and broke families', () => {
    const w = createWorld('p4-guard', bgProfile('middle'))
    const week = freeWeek(w)
    bookVacation(w, week, 'grandma')
    expect(() => bookVacation(w, week, 'camping')).toThrow(/already/i)
    expect(() => bookPractice(w, week, false)).toThrow(/vacation/i)
    expect(() => bookVacation(w, w.week, 'grandma')).toThrow(/future/i)
    expect(() => cancelVacation(w, w.week)).toThrow(/no vacation/i)
    expect(() => bookVacation(w, 24, 'grandma')).toThrow(/exam/i) // school-exam block
    expect(() => bookPractice(w, 50, false)).toThrow(/off-season/i) // off-season = family time
    // an ENTERED tournament week is not plannable
    const ev = injectEvent(w, { week: w.week + 4, tier: 'local' })
    enterEvent(w, ev.id)
    expect(() => bookPractice(w, ev.week, false)).toThrow(/entered/i)
    expect(() => bookVacation(w, ev.week, 'grandma')).toThrow(/entered/i)
    // no funds
    const poor = createWorld('p4-poor', bgProfile('working'))
    poor.fundsCents = 10
    expect(() => bookVacation(poor, freeWeek(poor), 'elite')).toThrow(/funds/i)
  })

  it('a vacation week is a hard availability block (level blocked / unavailable) naming the package', () => {
    const w = createWorld('p4-block', bgProfile('middle'))
    const week = w.week + 5
    const ev = injectEvent(w, { week, tier: 'local' })
    bookVacation(w, week, 'seaside')
    const status = availabilityStatus(w, ev)
    expect(status.level).toBe('blocked')
    expect(status.reason).toBe('unavailable')
    expect(status.detail).toBe('Family vacation – Seaside family hotel')
    expect(() => enterEvent(w, ev.id)).toThrow('Family vacation – Seaside family hotel')
    const up = toSnapshot(w).upcoming.find((e) => e.id === ev.id)!
    expect(up.eligible).toBe(false)
    expect(up.ineligibleReason).toBe('unavailable')
  })
})

// ---------------------------------------------------------------------------
// P5 — the vacation week in tick step 1c (gain, buff, blackout guarantee).
// ---------------------------------------------------------------------------
describe('P5 — vacation week mechanics', () => {
  it('applies the package gain on top of a FREE week (base + slider), clamped at 100', () => {
    const w = createWorld('p5-gain', bgProfile('middle'))
    w.physioActive = false
    w.plan = { train: 75, rest: 25 } // free-week ladder: base + slider 1
    w.condition = 50
    const week = freeWeek(w)
    bookVacation(w, week, 'camping')
    const rng = rngFromSeed(w.seed)
    while (w.week < week) tickWeek(w, rng)
    // ⚠ DERIVED FROM THE KNOBS SINCE W2-FATIGUE (recoveryBase 1 -> 8, camping +16 -> +26): the claim
    // under test is the COMPOSITION - the package gain rides ON TOP of the free week's own recovery,
    // it does not replace it - and hard-coding either half made a re-price look like a broken rule.
    const freeWeekGain = ECONOMY.condition.recoveryBase + 1 // base + the 75/25 slider
    const plainWeeks = week - 0 // ticks taken
    expect(w.condition).toBe(Math.min(100, 50 + freeWeekGain * plainWeeks + vacationPackage('camping')!.conditionGain))
    expect(w.events.some((e) => e.text.includes('Family vacation – Camping road-trip'))).toBe(true)
  })

  it('the resort/elite packages set recoveryBuff and cut injury tau for 4 weeks, then expire', () => {
    const w = createWorld('p5-buff', bgProfile('wealthy'))
    const week = freeWeek(w)
    bookVacation(w, week, 'elite')
    const rng = rngFromSeed(w.seed)
    while (w.week < week) tickWeek(w, rng)
    expect(w.recoveryBuff).toEqual({ untilWeek: week + ECONOMY.vacation.buffWeeks, factor: 0.85 })
    // tau is cut by exactly the factor (post-draw multiply)
    w.condition = 60
    const buffed = injuryTau(w)
    const unbuffed = (() => {
      const buff = w.recoveryBuff
      w.recoveryBuff = null
      const t = injuryTau(w)
      w.recoveryBuff = buff
      return t
    })()
    expect(buffed).toBeCloseTo(unbuffed * 0.85, 10)
    // expires after 4 weeks
    for (let i = 0; i < ECONOMY.vacation.buffWeeks + 1; i++) tickWeek(w, rng)
    expect(w.recoveryBuff).toBeNull()
  })

  it('back-to-back vacation weeks are allowed (a deep reset at 2× price)', () => {
    const w = createWorld('p5-b2b', bgProfile('wealthy'))
    const a = freeWeek(w)
    const b = a + 1
    expect(() => {
      bookVacation(w, a, 'seaside')
      bookVacation(w, b, 'seaside')
    }).not.toThrow()
    expect(w.vacations).toHaveLength(2)
  })
})

// ---------------------------------------------------------------------------
// P6 — practice matches: drain rule, 0 points, watchable record, week type.
// ---------------------------------------------------------------------------
describe('P6 — practice match mechanics', () => {
  function runToPractice(seed: string, plan = { train: 75, rest: 25 }, condition = 80) {
    const w = createWorld(seed, bgProfile('middle'))
    w.physioActive = false
    w.plan = plan
    const week = freeWeek(w)
    bookPractice(w, week, false)
    const rng = rngFromSeed(w.seed)
    while (w.week < week - 1) tickWeek(w, rng)
    w.condition = condition
    tickWeek(w, rng)
    return { w, week }
  }

  it('plays a friendly, drains max(1, local drain − 1), awards ZERO ranking points', () => {
    const { w } = runToPractice('p6-drain')
    const ev = w.events.find((e) => e.friendly === true)!
    expect(ev.type).toBe('match')
    expect(ev.match).toBeTruthy()
    expect(ev.text).toMatch(/Practice match/)
    // a replayable record: both skill snapshots + a seed (MatchReplay re-simulates from it)
    expect(ev.match!.seed).toBeTruthy()
    expect(ev.match!.a.id).toBe(KID_ID)
    expect(ev.match!.score).toBeTruthy()
    // zero ranking points: the kid's results ledger is untouched by a friendly
    expect(w.results.filter((r) => r.playerId === KID_ID)).toEqual([])
    // condition: entry 80 + practice-week recovery (base 1, slider FORFEITED) − drain(1..3)
    // ⚠ RE-PINNED 26.07 by the MATCH BASE RAISE: this re-derivation HARDCODED the old base (`? 2 : 1`)
    // and so would have silently disagreed with the engine on any friendly that was not straight
    // sets — it only kept passing because this seed produces a straight-sets one. Read off the live
    // knobs instead, so the test measures the rule rather than a snapshot of it. The drain ceiling
    // moves 2 → 3 with the base: max(1, local − 1) now grades (1 straight / 2 a 3-setter / 3 an
    // epic) where it used to clamp everything to 1. The canonical table is in
    // tests/fatigueReference.test.ts + docs/specs/fatigue-reference.md.
    const f = ECONOMY.condition.matchFatigue
    const sets = ev.match!.score!.split(' ')
    const tiebreaks = sets.filter((s) => s === '7-6' || s === '6-7').length
    const local = (sets.length >= 3 || tiebreaks >= 1 ? f.hardMatch : f.straightSets) + (tiebreaks > 2 ? f.extraTiebreaks : 0)
    const drain = Math.max(1, local - 1)
    expect(w.condition).toBe(80 + ECONOMY.condition.recoveryBase - drain)
    expect(drain).toBeGreaterThanOrEqual(1)
    expect(drain).toBeLessThanOrEqual(3)
  })

  it('a PRACTICE week keeps the base recovery but FORFEITS the slider bonus (owner ladder)', () => {
    // 60/40 earns +2 on a free week; on a practice week it earns the base only.
    const free = createWorld('p6-free', bgProfile('middle'))
    free.physioActive = false
    free.plan = { train: 60, rest: 40 }
    free.condition = 50
    accrueCondition(free, false)
    expect(free.condition).toBe(50 + ECONOMY.condition.recoveryBase + 2)

    const prac = createWorld('p6-prac', bgProfile('middle'))
    prac.physioActive = false
    prac.plan = { train: 60, rest: 40 }
    prac.condition = 50
    prac.practices.push({ week: prac.week, paidCents: 0, withCoach: false })
    accrueCondition(prac, false)
    expect(prac.condition).toBe(50 + ECONOMY.condition.recoveryBase) // slider bonus forfeited
  })

  it('an injury cancels + refunds every practice inside the layoff', () => {
    // Force the onset deterministically by patching the LIVE tau knobs (bench pattern:
    // patch, run, always restore) – the roll is unconditional, only tau moves.
    const av = ECONOMY.availability as unknown as { injuryBaseChance: number; injuryChanceCap: number }
    const savedBase = av.injuryBaseChance
    const savedCap = av.injuryChanceCap
    try {
      av.injuryBaseChance = 1
      av.injuryChanceCap = 1
      const w = createWorld('p6-inj', bgProfile('middle'))
      const week = w.week + 3
      bookPractice(w, week, false)
      const paid = w.practices[0].paidCents
      expect(paid).toBeGreaterThan(0)
      const fundsBefore = w.fundsCents
      tickWeek(w, rngFromSeed(w.seed)) // week 1: injury onset (tau = 1), layoff >= 1 week
      expect(w.injury).not.toBeNull()
      // she is back at world.week + weeksRemaining, so the practice week is swallowed iff
      // weeksRemaining > (practice week − current week)
      if (w.injury!.weeksRemaining > week - w.week) {
        // the layoff swallows the practice week -> booking cancelled, rental refunded
        expect(w.practices).toEqual([])
        expect(w.fundsCents).toBeGreaterThanOrEqual(fundsBefore + paid)
        expect(w.events.some((e) => e.category === 'practice' && e.amountCents === paid)).toBe(true)
      }
      // ...and while she is out, nothing new is bookable
      expect(() => bookPractice(w, w.week + 1, false)).toThrow(/injured/i)
    } finally {
      av.injuryBaseChance = savedBase
      av.injuryChanceCap = savedCap
    }
  })
})

// ---------------------------------------------------------------------------
// P7 — the practice guardrail (caution, never a hard block) — pure predicate.
// ---------------------------------------------------------------------------
describe('P7 — practice guardrail predicate', () => {
  it('flags a tired kid below the caution floor', () => {
    const tired = practiceCaution({ condition: 40, practiceWeeks: [], week: 10 })
    expect(tired.level).toBe('caution')
    expect(tired.reasons).toContain('tired')
    expect(tired.detail).toMatch(/worn out/i)
    const fresh = practiceCaution({ condition: 90, practiceWeeks: [], week: 10 })
    expect(fresh.level).toBe('ok')
    expect(fresh.reasons).toEqual([])
  })

  // Wave-2 tuning (fatigue bench 26.07): the 3-in-a-row arm used to fire on a perfectly fresh
  // kid – careful pushed through 8-11 cautions/season at condition 92, which trains the player to
  // click through the REAL ones. The streak arm is now gated on actual strain (below
  // cautionStreakCondition) OR on a longer run (cautionStreakAlways).
  it('stays QUIET on a 3-week streak while she is fresh (the warning-noise fix)', () => {
    const p = ECONOMY.practice
    expect(p.cautionStreakCondition).toBeLessThan(ECONOMY.condition.max)
    const fresh = practiceCaution({ condition: 92, practiceWeeks: [8, 9], week: 10 })
    expect(fresh.level).toBe('ok')
    expect(fresh.reasons).toEqual([])
    // exactly AT the strain gate is still quiet (the gate is "below")
    expect(practiceCaution({ condition: p.cautionStreakCondition, practiceWeeks: [8, 9], week: 10 }).level).toBe('ok')
  })

  it('flags the 3rd consecutive practice week once she is actually strained', () => {
    const third = practiceCaution({ condition: ECONOMY.practice.cautionStreakCondition - 1, practiceWeeks: [8, 9], week: 10 })
    expect(third.level).toBe('caution')
    expect(third.reasons).toContain('streak')
    expect(third.streakWeeks).toBe(3)
    expect(third.detail).toMatch(/3 match weeks in a row/)
    // a gap resets the streak
    expect(practiceCaution({ condition: 70, practiceWeeks: [7, 9], week: 10 }).level).toBe('ok')
    expect(consecutivePracticeWeeks([8, 9], 10)).toBe(2)
    expect(consecutivePracticeWeeks([7, 9], 10)).toBe(1)
    expect(consecutivePracticeWeeks([], 10)).toBe(0)
  })

  it('flags a 4-in-a-row run at ANY condition (a long streak is strain by itself)', () => {
    const long = practiceCaution({ condition: 100, practiceWeeks: [7, 8, 9], week: 10 })
    expect(long.level).toBe('caution')
    expect(long.reasons).toContain('streak')
    expect(long.streakWeeks).toBe(ECONOMY.practice.cautionStreakAlways)
    expect(long.detail).toMatch(/4 match weeks in a row/)
  })

  it('never BLOCKS the booking – the parent may push (owner philosophy)', () => {
    const w = createWorld('p7-push', bgProfile('middle'))
    // 20 is CHOSEN, not arbitrary: it is the owner's own "он вполне может сказать «предупреждаю»"
    // example, i.e. inside the warning band and ABOVE the medical floor – so what this test pins is
    // the GUARDRAIL's philosophy, not the absence of the doctor's veto (P7b owns that boundary).
    // Stated as an assertion so the day the floor is raised past it, this test says why it broke.
    w.condition = 20
    expect(w.condition).toBeGreaterThanOrEqual(ECONOMY.availability.medicalFloor)
    const week = freeWeek(w)
    expect(() => bookPractice(w, week, false)).not.toThrow()
    expect(w.practices).toHaveLength(1)
  })
})

// ---------------------------------------------------------------------------
// P7b — THE DOCTOR'S VETO REACHES THE FRIENDLY (owner 26.07: "the doctor who will
// not let her travel probably should not clear her for a friendly at condition 0").
//
// WHY THIS EXISTS, measured: the match-base raise (1 -> 2) made the friendly's
// `max(1, localDrain − 1)` subtraction real, so the "friendly treadmill" turned from
// a flat plateau into a −0.6/week slide, and the veto gated TOURNAMENTS only. Nothing
// stopped a practise-every-week policy from sitting at condition 0 for a third of a
// career (fatigue bench: worst cell 1.9% -> 32.7% of weeks at 0 across the base raise).
// The fix is candidate (b) from the doctor's-veto test: gate the BOOKING on the same
// floor, through the same predicate.
//
// TWO properties are non-negotiable here and both are asserted below:
//   1. ONE RULE, ONE OWNER – the friendly and the tournament read `medicalBlock`, so
//      they refuse for the same reason in the same words. No second threshold compare.
//   2. NO DEAD END – a refused practice week is still the parent's to plan (vacation,
//      training/rest, or nothing at all). A week where nothing is possible is the worst
//      item of the owner's last playtest (R10-3) and must never come back.
// It is a HARD block with NO warning band: fatigue for tournaments is a soft warned
// choice, but below the floor the doctor "точно не пустит" (owner, verbatim).
// ---------------------------------------------------------------------------
describe("P7b — the doctor's veto on a friendly", () => {
  const FLOOR = ECONOMY.availability.medicalFloor

  it('refuses the booking BELOW the floor, clears it AT the floor and above', () => {
    const below = createWorld('p7b-below', bgProfile('middle'))
    below.condition = FLOOR - 1
    const fundsBefore = below.fundsCents
    expect(() => bookPractice(below, freeWeek(below), false)).toThrow(/not cleared to play/i)
    expect(below.practices).toEqual([]) // nothing booked…
    expect(below.fundsCents).toBe(fundsBefore) // …and nothing charged for the refusal
    // the degenerate case the gate exists for
    const wrecked = createWorld('p7b-zero', bgProfile('middle'))
    wrecked.condition = ECONOMY.condition.min
    expect(() => bookPractice(wrecked, freeWeek(wrecked), false)).toThrow(/not cleared to play/i)
    // AT the floor she is cleared – the veto is strictly below, exactly like the entry gate
    const at = createWorld('p7b-at', bgProfile('middle'))
    at.condition = FLOOR
    expect(() => bookPractice(at, freeWeek(at), false)).not.toThrow()
    expect(at.practices).toHaveLength(1)
    const above = createWorld('p7b-above', bgProfile('middle'))
    above.condition = FLOOR + 1
    expect(() => bookPractice(above, freeWeek(above), false)).not.toThrow()
    expect(above.practices).toHaveLength(1)
  })

  it('refuses in the SAME WORDS the tournament gate uses – one predicate, three surfaces', () => {
    const w = createWorld('p7b-agree', bgProfile('middle'))
    w.condition = FLOOR - 1
    const ev = injectEvent(w, { week: w.week + 3, tier: 'local' })
    // the tournament surfaces
    const availability = availabilityStatus(w, ev)
    expect(availability.level).toBe('blocked')
    expect(availability.reason).toBe('medical')
    expect(entryStatus(w, ev).detail).toBe(availability.detail)
    expect(toSnapshot(w).upcoming.find((e) => e.id === ev.id)!.ineligibleReason).toBe('medical')
    // the practice surface: the SAME sentence, because both read `medicalBlock`
    let practiceReason = ''
    try {
      bookPractice(w, freeWeek(w), false)
    } catch (e) {
      practiceReason = (e as Error).message
    }
    expect(practiceReason).toBe(availability.detail)
    expect(practiceReason).toBe(medicalBlock(w.condition)!.detail)
    // …and the shared predicate is silent the moment she is cleared, so nothing above the floor
    // can pick up a hard refusal by accident
    expect(medicalBlock(FLOOR)).toBeNull()
    expect(medicalBlock(ECONOMY.condition.max)).toBeNull()
  })

  it('is the SAME KNOB as the tournament veto: floor 0 restores the old booking behaviour', () => {
    const av = ECONOMY.availability as { medicalFloor: number }
    const saved = av.medicalFloor
    try {
      av.medicalFloor = 0
      const w = createWorld('p7b-knob', bgProfile('middle'))
      w.condition = ECONOMY.condition.min
      expect(() => bookPractice(w, freeWeek(w), false)).not.toThrow()
    } finally {
      av.medicalFloor = saved
    }
  })

  it('leaves the refused week FULLY PLANNABLE – vacation, training/rest, or nothing at all', () => {
    const w = createWorld('p7b-plannable', bgProfile('middle'))
    w.condition = ECONOMY.condition.min // the worst case: the week must still be usable
    const week = freeWeek(w)
    expect(() => bookPractice(w, week, false)).toThrow(/not cleared to play/i)
    // 1. a VACATION on the very same week – the answer the sheet points the parent at. REST is
    //    never gated on the floor; gating it is how this fix would have become an R10-3 dead end.
    expect(() => bookVacation(w, week, 'grandma')).not.toThrow()
    expect(w.vacations).toHaveLength(1)
    cancelVacation(w, week) // and it is still cancellable, so nothing is one-way
    expect(w.vacations).toEqual([])
    // 2. plain TRAINING/REST commits and the week RECOVERS her instead of draining her – the whole
    //    point of the gate (a practice week would have paid base only, and drained 1-3 on top).
    w.plan = { train: 60, rest: 40 }
    const before = w.condition
    tickWeek(w, rngFromSeed(w.seed))
    expect(w.condition).toBeGreaterThan(before)
    // 3. and doing NOTHING still advances time (no state can trap the week)
    const at = w.week
    advanceWeeks(w, rngFromSeed(w.seed), 3)
    expect(w.week).toBeGreaterThan(at)
  })

  it('calls OFF a booked friendly whose week arrives below the floor, rental refunded in full', () => {
    // The booking gate reads her condition on BOOKING day and a booking is a week ahead, so the
    // floor is re-read on arrival – the same two-surface shape the tournament veto has (entry gate
    // + play-week check). Injury is switched off via the live tau knobs (bench pattern: patch, run,
    // always restore), because an injury outranks the medical branch and would pre-empt it.
    const av = ECONOMY.availability as unknown as { injuryBaseChance: number; injuryChanceCap: number }
    const savedBase = av.injuryBaseChance
    const savedCap = av.injuryChanceCap
    try {
      av.injuryBaseChance = 0
      av.injuryChanceCap = 0
      const w = createWorld('p7b-arrive', bgProfile('middle'))
      w.physioActive = false
      w.plan = { train: 60, rest: 40 } // free-week slider bonus = +2
      w.season = [] // no tournament anywhere near: the week is the friendly's alone
      w.condition = FLOOR + 20 // booked while the doctor was happy
      const week = w.week + 1
      bookPractice(w, week, false)
      const paid = w.practices[0].paidCents
      expect(paid).toBeGreaterThan(0)
      // …and then a bad week happens in between (a deep run, an injury scare): she arrives wrecked
      w.condition = 3
      tickWeek(w, rngFromSeed(w.seed))
      expect(w.week).toBe(week)
      expect(w.practices).toEqual([]) // the friendly is off
      expect(w.events.some((e) => e.type === 'match' && e.friendly === true)).toBe(false) // never played
      // MONEY: full refund, unlike the tournament withdrawal's forfeited entry fee. There is no
      // closed entry list holding a friendly's court rental, cancelPractice already refunds it in
      // full at any point before the week, and the practice sub-system's own precedent for "her body
      // called it off" (the injury branch) is a refund too. Asserted on the 'practice' CATEGORY,
      // which nets to zero – total funds also carry the week's ordinary income and bills.
      expect(w.events.some((e) => e.category === 'practice' && e.amountCents === paid)).toBe(true)
      expect(
        w.events.filter((e) => e.category === 'practice').reduce((s, e) => s + (e.amountCents ?? 0), 0),
      ).toBe(0)
      expect(w.events.some((e) => e.text.includes('not cleared to play'))).toBe(true)
      // CONDITION: the week ends match-free, so it pays the FULL free-week ladder (base 1 accrued by
      // accrueCondition + the slider bonus handed back here), and drains nothing.
      expect(w.condition).toBe(3 + ECONOMY.condition.recoveryBase + 2)
    } finally {
      av.injuryBaseChance = savedBase
      av.injuryChanceCap = savedCap
    }
  })

  it('surfaces the refusal in the planner sheet: disabled WITH the reason, never a throwing button', () => {
    // Source-level (the B7/P9 pattern): the sheet reads the engine's own `medicalBlock` and renders
    // its `detail`, so the sentence the player sees IS the sentence bookPractice would throw – the
    // two surfaces cannot drift into two different explanations of the same doctor.
    const src = readFileSync(new URL('../src/components/PlanWeekSheet.vue', import.meta.url), 'utf8')
    expect(src).toMatch(/medicalBlock/)
    expect(src).toMatch(/medical\.detail/)
    // R12-5b: the layoff gate now stands IN FRONT of the doctor on the same button
    expect(src).toMatch(/:disabled="!!layoff \|\| !!medical/)
    // …and it names what the week CAN still become, so the refusal is never a dead end
    expect(src).toMatch(/Vacation\s*\n?\s*tab/)
    // the guardrail's soft caution is still there for everything above the floor
    expect(src).toMatch(/caution\.level === 'caution'/)
  })
})

// ---------------------------------------------------------------------------
// P8 — advanceWeeks deadline filter: only stop for events she could ENTER.
// ---------------------------------------------------------------------------
describe('P8 — deadline stop respects the point band', () => {
  it('a 0-point kid is never stopped by a regional/national deadline', () => {
    // ⚠ RE-AIMED by the two ladders (29.07). The old claim was "a 0-point kid can only enter Local",
    // which was true when ONE points ladder gated everything. There are two now: the domestic rungs
    // still open by points and in order, and the international ones are an acceptance list. A J30
    // has no acceptance bar at all - the research is explicit that an unranked thirteen-year-old
    // near home gets into one, and that the gate up the ladder is the QUEUE, not the fee. So a
    // point-less kid is legitimately stopped by a J30 deadline: she really can enter it, if the
    // family can pay for the plane. The protected fact is unchanged and is now stated exactly:
    // she is not stopped for a rung she cannot enter.
    const w = createWorld('p8-fresh')
    const rng = rngFromSeed(w.seed)
    const stop = advanceWeeks(w, rng, 20)
    // She IS stopped now - and the test proves it is for the right reason. Every deadline that can
    // stop a point-less kid must belong to a rung she may actually enter: Local (open at 0 domestic
    // points) or a J30 (no acceptance bar). A Regional or National deadline still may not.
    if (stop.includes('deadline')) {
      const stoppable = w.season.filter(
        (e) => e.deadlineWeek >= w.week - 20 && e.deadlineWeek <= w.week && entryStatus(w, e).level !== 'blocked',
      )
      expect(stoppable.length).toBeGreaterThan(0)
      for (const e of stoppable) expect(['local', 'j30']).toContain(e.tier)
    }
  })

  it('a point-eligible kid IS stopped by the same deadline', () => {
    const w = createWorld('p8-eligible')
    giveKidPoints(w, 200) // national band [150, ∞)
    const nat = injectEvent(w, { week: w.week + 4, tier: 'national', deadlineWeek: w.week + 2 })
    w.season = [nat]
    // ⚠ W4: no knock may interrupt the advance under test - see noKnocksFor.
    noKnocksFor(w)
    expect(advanceWeeks(w, rngFromSeed(w.seed), 4)).toContain('deadline')
  })

  // ⚠⚠ RE-AIMED 06.08 (docs/specs/ladder-floor-2026-08.md), AND IT IS THE OPPOSITE ASSERTION. It
  // read "an OUTGROWN tier never stops the sim either", and it was right for the rule it was written
  // against: a deadline stop asks "do you want to enter this?", so it must not fire for an event she
  // cannot enter. The owner's ruling on backlog #84 makes an outgrown rung ENTERABLE, which means
  // the question is now a real one and the stop is now correct rather than noise. What P8 protects
  // is unchanged and is what is asserted: the stop fires exactly when the gate would admit her.
  it('an OUTGROWN tier DOES stop the sim now – the deadline asks a question she can answer', () => {
    const w = createWorld('p8-outgrown')
    giveKidPoints(w, 400) // past regional's 250 ceiling
    const reg = injectEvent(w, { week: w.week + 4, tier: 'regional', deadlineWeek: w.week + 2 })
    w.season = [reg]
    // ⚠ W4: no knock may interrupt the advance under test - see noKnocksFor.
    noKnocksFor(w)
    const gate = entryStatus(w, reg)
    expect(gate.level, 'the lower bound is a sorting key, not a wall').not.toBe('blocked')
    expect(gate.outgrown, '400 is past the band – still hers, and beneath her').toBe(true)
    expect(advanceWeeks(w, rngFromSeed(w.seed), 4)).toContain('deadline')
  })

  // ...and the half of the old claim that is still true, kept as its own case rather than lost with
  // it: a rung she has NOT REACHED still never stops the sim, because there she really can do
  // nothing. That is the 'locked' half of the band, and it is untouched by the 06.08 ruling.
  it('a rung below her floor still never stops the sim', () => {
    const w = createWorld('p8-below-floor')
    const nat = injectEvent(w, { week: w.week + 4, tier: 'national', deadlineWeek: w.week + 2 })
    w.season = [nat]
    noKnocksFor(w)
    expect(entryStatus(w, nat).reason).toBe('locked')
    expect(advanceWeeks(w, rngFromSeed(w.seed), 4)).not.toContain('deadline')
  })
})

// ---------------------------------------------------------------------------
// P9 — snapshot + UI wiring (source-level, mirroring the B7 pattern).
// ---------------------------------------------------------------------------
describe('P9 — snapshot + planner UI', () => {
  it('the snapshot carries bookings and the recovery buff', () => {
    const w = createWorld('p9-snap', bgProfile('middle'))
    const week = freeWeek(w)
    bookVacation(w, week, 'grandma')
    bookPractice(w, week + 1, true)
    const snap = toSnapshot(w)
    expect(snap.vacations).toEqual([{ week, packageId: 'grandma', paidCents: w.vacations[0].paidCents }])
    expect(snap.practices).toEqual([{ week: week + 1, paidCents: w.practices[0].paidCents, withCoach: true }])
    expect(snap.recoveryBuff).toBeNull()
  })

  it('SeasonScreen hides OUTGROWN events, keeps locked-ahead ones, and offers "+ Plan week"', () => {
    // ⚠ RE-AIMED by W2-LADDER §4, NOT WEAKENED: the hand-written outgrown arm
    // (`ineligibleReason !== 'outgrown'`) became a CONSEQUENCE of the two-type feed - an outgrown
    // rung sits below the working pair, so `feedShows` hides it without naming it - and the
    // spec-level claims this test is titled after all still hold: outgrown events disappear
    // (below-pair), the locked-ahead ADJACENT rung stays (the pair's aspirational half, rendered
    // through lockLabel), and the emptied weeks offer "+ Plan week". The rule's own unit guard is
    // tests/tier-window.test.ts; what is pinned here is that this screen consumes it.
    const src = readFileSync(new URL('../src/components/screens/SeasonScreen.vue', import.meta.url), 'utf8')
    expect(src).toMatch(/feedShows\(e, feed\.value\)/)
    expect(src).toContain('Plan week')
    expect(src).toContain('PlanWeekSheet')
    // locked-ahead events stay visible: the lock label is still rendered
    expect(src).toContain('lockLabel')
  })

  it('the planner sheet has both tabs, the guardrail warning and the pre-highlight', () => {
    const src = readFileSync(new URL('../src/components/PlanWeekSheet.vue', import.meta.url), 'utf8')
    expect(src).toContain('Practice')
    expect(src).toContain('Vacation')
    expect(src).toMatch(/practiceCaution/)
    expect(src).toMatch(/recommended/i)
    expect(src).toMatch(/coach/i)
  })

  it('the rescue prompt is an OFFER (never an auto-book)', () => {
    const src = readFileSync(new URL('../src/components/screens/SeasonScreen.vue', import.meta.url), 'utf8')
    expect(src).toMatch(/rescue/i)
    expect(src).toMatch(/worn out|worn down/i)
  })

  it('the worker + store expose the four planner commands', () => {
    const worker = readFileSync(new URL('../src/worker/sim.worker.ts', import.meta.url), 'utf8')
    const store = readFileSync(new URL('../src/stores/game.ts', import.meta.url), 'utf8')
    for (const cmd of ['bookVacation', 'cancelVacation', 'bookPractice', 'cancelPractice']) {
      expect(worker).toContain(cmd)
      expect(store).toContain(cmd)
    }
  })

  it('Home reads the practice strain (R13-3: folded from the removed chip into the note line)', () => {
    const src = readFileSync(new URL('../src/components/screens/HomeScreen.vue', import.meta.url), 'utf8')
    expect(src).toMatch(/practiceCaution|cautionCondition/)
  })
})

// ---------------------------------------------------------------------------
// P10 — the vacation OFFER (Wave-2 tuning): a wider band + a pre-highlight that
// slides DOWN the ladder as the deficit shrinks. Before this pass the offer only
// fired below 65 and the pick always needed >= 85, so seaside took 88% of every
// booking in the bench and grandma/camping were unreachable answers.
// ---------------------------------------------------------------------------
describe('P10 — vacation offer band + cheapest-sufficient pre-highlight', () => {
  const RICH = 9_999_999_00

  function pickAt(condition: number, seed = 'p10', week = 12, fundsCents = RICH): string | null {
    return recommendVacationPackage({ seed, week, background: 'wealthy', condition, fundsCents })
  }

  it('the offer band reaches mildly-tired weeks (<= 80), where a cheap package IS the answer', () => {
    expect(ECONOMY.practice.rescueCondition).toBeGreaterThanOrEqual(80)
    // …and the target the pre-highlight aims for stays where the owner put it.
    expect(ECONOMY.practice.rescueTargetCondition).toBe(85)
  })

  // ⚠ RE-AIMED 03.08 (W2-FATIGUE §4 lifted the table 12/14/16/20/25/30 -> 18/22/26/32/40/48). The
  // RULE is untouched and is the only thing this case tests - "the cheapest package that clears the
  // target" - so every boundary simply moved down the condition axis by the size of the lift. The
  // shape worth reading is that the ladder still SLIDES: each rung owns a band of deficits, none is
  // skipped, and the free week now covers a genuinely useful stretch (67-100 instead of 73-100).
  // ⚠ RE-AIMED AGAIN 12.08 (the owner's bottom-two re-step, 18/22 -> 10/18). Same rule, same
  // shape: each rung owns a band of deficits and none is skipped. What moved is WHERE the free
  // week stops being the answer - it now covers 75-100 (was 67-100), and the first paid rung owns
  // a real band of its own (67-74) instead of the 1-point sliver the old +4 gap left it.
  it('picks the CHEAPEST package sufficient for her CURRENT condition', () => {
    // gains: staycation +10 · grandma +18 · camping +26 · seaside +32 · resort +40 · elite +48,
    // target 85 -> the ladder slides down as the deficit shrinks.
    expect(pickAt(80)).toBe('staycation') // 80+10 = 90
    expect(pickAt(75)).toBe('staycation') // 75+10 = 85 (exactly sufficient)
    expect(pickAt(74)).toBe('grandma') // 74+10 = 84 short; +18 = 92
    expect(pickAt(67)).toBe('grandma') // 67+18 = 85 (exactly sufficient)
    expect(pickAt(66)).toBe('camping') // 66+18 = 84 short; +26 = 92
    expect(pickAt(58)).toBe('seaside') // +26 = 84 short; +32 = 90
    expect(pickAt(52)).toBe('resort')
    expect(pickAt(44)).toBe('elite')
  })

  it('a nearly-fresh kid gets the FREE staycation (the clamp at 100 counts as sufficient)', () => {
    expect(pickAt(95)).toBe('staycation')
    expect(pickAt(100)).toBe('staycation')
  })

  it('on a deep deficit nothing clears the target, so it falls back to the best she can afford', () => {
    expect(pickAt(20)).toBe('elite') // 20+48 = 68, still short – buy the biggest reset available
  })

  it('respects the wallet: only affordable packages, and null when even the free one is gone', () => {
    const week = 12
    const camping = vacationPriceCents('p10', week, 'camping', 'wealthy')
    // A family that can afford camping but not seaside gets camping even on a deep deficit.
    expect(recommendVacationPackage({ seed: 'p10', week, background: 'wealthy', condition: 30, fundsCents: camping })).toBe(
      'camping',
    )
    // The staycation is free, so it is always reachable – a budget of 0 still returns it.
    expect(recommendVacationPackage({ seed: 'p10', week, background: 'wealthy', condition: 30, fundsCents: 0 })).toBe(
      'staycation',
    )
    // …unless the prudence budget forbids even that (bench guard: negative funds).
    expect(
      recommendVacationPackage({ seed: 'p10', week, background: 'wealthy', condition: 30, fundsCents: 0, budgetCents: -1 }),
    ).toBeNull()
  })

  it('takes an explicit target override (the bench policies aim higher than the prompt)', () => {
    expect(pickAt(78)).toBe('staycation')
    expect(
      recommendVacationPackage({
        seed: 'p10',
        week: 12,
        background: 'wealthy',
        // ⚠ 78 -> 82 (12.08 bottom-two re-step): the free week's gain is 10 now, so clearing an
        // explicit target of 90 from below needs condition >= 80. Same boundary, same claim - the
        // override overrides - only the arithmetic under it moved with the owner's ladder.
        condition: 82,
        fundsCents: RICH,
        targetCondition: 90,
      }),
    ).toBe('staycation') // 82+10 = 92
    expect(
      recommendVacationPackage({
        seed: 'p10',
        week: 12,
        background: 'wealthy',
        // ⚠ 77 -> 71 (W2-FATIGUE §4), 71 -> 75 (12.08 re-step): the same boundary, moved by the
        // size of each ladder change - what is tested is that an explicit target really does
        // override the knob, not the number.
        condition: 75,
        fundsCents: RICH,
        targetCondition: 90,
      }),
    ).toBe('grandma') // 75+10 = 85 short of 90; +18 = 93
  })

  it('BOTH pre-highlight surfaces call the one shared helper (no third copy of the rule)', () => {
    const sheet = readFileSync(new URL('../src/components/PlanWeekSheet.vue', import.meta.url), 'utf8')
    const season = readFileSync(new URL('../src/components/screens/SeasonScreen.vue', import.meta.url), 'utf8')
    expect(sheet).toContain('recommendVacationPackage')
    expect(season).toContain('recommendVacationPackage')
    // the old off-season hard-code ("always seaside") is gone – the recommendation slides now
    expect(sheet).not.toMatch(/'seaside'/)
  })
})

// ---------------------------------------------------------------------------
// P10 — the money ledger keeps planner spend visible and nets refunds out.
// ---------------------------------------------------------------------------
describe('P10 — planner money', () => {
  it('vacation + practice spend land in their own finance categories and net out on cancel', () => {
    const w = createWorld('p10', bgProfile('middle'))
    const week = freeWeek(w)
    bookVacation(w, week, 'seaside')
    bookPractice(w, week + 1, false)
    const snap = toSnapshot(w)
    expect(snap.finance.window12w.byCategory.vacation!).toBeLessThan(0)
    expect(snap.finance.window12w.byCategory.practice!).toBeLessThan(0)
    cancelVacation(w, week)
    cancelPractice(w, week + 1)
    const after = toSnapshot(w)
    expect(after.finance.window12w.byCategory.vacation).toBe(0)
    expect(after.finance.window12w.byCategory.practice).toBe(0)
    expect(after.fundsCents).toBe(createWorld('p10', bgProfile('middle')).fundsCents)
  })

  it('the tier entry fee is untouched by the planner (no cross-talk)', () => {
    expect(TIERS.local.entryFeeCents).toBe(40_00)
  })
})
