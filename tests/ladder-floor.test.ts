// THE LADDER FLOOR – the lower bound is a sorting key, not a wall (owner ruling on backlog #84,
// 06.08; docs/specs/ladder-floor-2026-08.md).
//
// WHAT THIS FILE PROTECTS, and each of the four is a claim that failed on the owner's own save
// before the change (165 of 189 future events blocked, 112 of them `outgrown`, 27 of his 46
// remaining event weeks with nothing enterable on them at all):
//
//   1. THE TWO CEILINGS HAVE ONE CONSEQUENCE. `outgrewTier` (a domestic band's ceiling) and
//      `tierOutgrown` (the sliding window's) must behave identically, or the player meets a gate
//      that cannot be explained. world.ts has demanded this in a comment since 05.08; `hasOutgrown`
//      is where it became a property, and this is where it is a test.
//   2. NEITHER OF THEM REFUSES. A rung she has passed is enterable and SAYS it is passed.
//   3. THE UPPER BOUND IS UNTOUCHED. An acceptance cut is the tour's own rule; a rung she has not
//      reached still refuses her, with the same words.
//   4. THE CALENDAR AND THE TURNSTILE STILL AGREE (R10-5). `tierOpenFor` and `entryStatus` are one
//      rule read at two surfaces; the ceiling had to leave BOTH of them or a rung would be shut on
//      the calendar and open at the door. That is not a hypothetical - the first cut of this change
//      left the domestic ceiling inside `tierFloorOpen` via `isTierEligible`, and the sweep below
//      is what fails when it does.
import { describe, it, expect } from 'vitest'
import {
  createWorld,
  entryStatus,
  enterEvent,
  hasOutgrown,
  tierOpenFor,
  tierOutgrown,
  outgrewTier,
  kidPoints,
  recomputeKidRank,
  tickWeek,
  kidAgeYears,
  toSnapshot,
  KID_ID,
  type WorldState,
} from '../src/engine/world'
import { bookClosedTo, coachLadderNote, openingCoachId } from '../src/engine/world'
import { feedContext, feedShows, preferredWeekEvent } from '../src/composables/tierState'
import { TIERS, TIER_LADDER } from '../src/engine/season/calendar'
import { BEST_N_BY_TRACK } from '../src/engine/season/ranking'
import { resumeMain } from '../src/engine/rng'
import type { SeasonEvent, TierId } from '../src/engine/season/types'
import type { CoachTier } from '../src/shared/protocol'

function injectEvent(world: WorldState, week: number, tier: TierId): SeasonEvent {
  const e: SeasonEvent = {
    id: `floor-${week}-${tier}`,
    week,
    tier,
    surface: 'hard',
    travelCostCents: 100_00,
    deadlineWeek: week - 2,
  }
  world.season.push(e)
  world.season.sort((a, b) => a.week - b.week)
  return e
}

/** A world with a DOMESTIC book of `points`, which is the currency the domestic bands and the ITF
 *  on-ramp are written in. */
function domesticWorld(seed: string, points: number): WorldState {
  const world = createWorld(seed)
  world.condition = 100
  world.fundsCents = 50_000_00
  world.season = []
  if (points > 0) world.results.push({ playerId: KID_ID, week: world.week, points, tier: 'national' })
  recomputeKidRank(world)
  return world
}

/** ...and one with a PROFESSIONAL book, aged into the W era – the arm where the ceiling is the
 *  sliding window rather than a band. Same shape as the unranked-sentinel suite's `worldAt`.
 *
 *  ⚠ RE-AIMED, NOT WEAKENED (one-clock ruling, 09.08): it ticked until `ageAtWeek` reached `age`, and
 *  that is the coach market's restocking clock now, not hers. `tierOutgrown` gates on HER age, so a
 *  June default profile arrived at week 156 aged SIXTEEN, W75 (17+) refused her, and the window
 *  ceiling this file is about stopped existing. Ticking to her real age restores the fixture's own
 *  contract and costs not one assertion.
 *
 *  ⚠⚠ AND RE-AIMED AGAIN BY P3 (16.08, docs/specs/acceptance-cuts-corrected-2026-08.md) – THE BOOK
 *  MOVED, THE CONTRACT DID NOT. Every case here that wants "a climbed professional" passed a book of
 *  **140**, chosen because it cleared W75's #450 cut and not W100's #350. The sourced chain took
 *  w75 450 → 300 and w100 350 → 240, and the BOOK standing on each door moved with the cut: W75's
 *  price went 90 → **189** and W100's 147 → **272**. A 140-point book therefore stopped opening W75
 *  at all, so `tierOutgrown('w15')` went false and twelve cases lost the precondition they exist to
 *  measure – they were failing on scaffolding, not on the sliding window.
 *
 *  **The book is now 250**, which is the same POSITION on the new ladder: past W75, short of W100.
 *  Not one assertion, threshold or claim in this file is touched, and none is relaxed. The sweep's
 *  ladder likewise re-spaces 10 / 50 / 75 / 140 / 400 → 10 / 50 / **170** / **200** / 400 so its
 *  five rungs still straddle the doors rather than bunching below them.
 *
 *  ⚠ 250 IS THE MIDDLE OF THE WINDOW, NOT THE FIRST VALUE THAT PASSED, and that is deliberate –
 *  the whole failure above was a fixture parked next to a threshold. The window was bisected against
 *  the real fixture rather than computed from a fresh table, because this world is TICKED to
 *  seventeen and its cohort has earned points meanwhile, so the merged table here is deeper than the
 *  one `tools/acceptance-cuts.ts --only 1` prints: **200 does not open W75 yet and 300 already opens
 *  W100** (the case below asserts W100 stays shut). 250 sits between the two with room on both
 *  sides, so the next small ladder move does not silently land on it again. */
function proWorld(seed: string, age: number, book: number): WorldState {
  const world = createWorld(seed)
  const rng = resumeMain(world.rngMain)
  while (kidAgeYears(world.week, world.profile.birthMonth, world.profile.birthDay) < age) tickWeek(world, rng)
  world.condition = 100
  world.fundsCents = 50_000_00
  world.season = []
  if (book > 0) world.results.push({ playerId: KID_ID, week: world.week, points: book, tier: 'w15' })
  world.onRampCleared = { itf: true, wta: true }
  // ⚠⚠ RE-AIMED A THIRD TIME, AND THIS TIME BY UNDOING THE SECOND (16.08). P1's note, kept below the
  // line because it is exactly the reasoning that had to be reversed, read: *"A junior now meets the
  // Junior Accelerator in front of the W rungs ... with no banked year-end junior standing she holds
  // no Accelerator places, W35 and up are shut whatever her professional book says, and the SLIDING
  // WINDOW – the whole subject of this file – has nothing left to slide over. A banked year-end
  // junior #1 puts her past that gate."* True while the Accelerator was a ceiling; the owner's
  // correction of 16.08 made it a reserved place, so a junior enters on her own cut and needs no
  // banked standing at all – and a banked **#1** now buys her three real W100 places, which turned
  // "an acceptance cut she is outside still refuses" green-to-red for the right reason: she was
  // inside a different door. Diagnosed the honest way, by reading the fixture rather than the rule.
  //
  // ⚠ 21 IS THE ROW THAT HOLDS NOTHING – the Accelerator's own table ends at "21+ : nothing above
  // W15" – so the workaround is neutralised rather than deleted. The row stays because other cases
  // here read a banked season; only the standing it carries changes, and the SLIDING WINDOW is once
  // again the only thing these cases measure. The Accelerator's own suite is
  // tests/junior-access.test.ts.
  world.seasonHistory = [
    {
      seasonIndex: 0,
      endRank: 21,
      points: 0,
      wins: 0,
      losses: 0,
      byTrack: {
        domestic: { points: 0, wins: 0, losses: 0 },
        itf: { endRank: 21, points: 0, wins: 0, losses: 0 },
        wta: { points: 0, wins: 0, losses: 0 },
      },
      fundsDeltaCents: 0,
      endFundsCents: 0,
    },
  ]
  recomputeKidRank(world)
  return world
}

// =================================================================================================
// 1 + 2. THE TWO CEILINGS, ONE CONSEQUENCE – AND THE CONSEQUENCE IS NOT A REFUSAL
// =================================================================================================

describe('the two ceilings are the same event for the player', () => {
  it('the DOMESTIC band ceiling admits her, and says she is past the rung', () => {
    const world = domesticWorld('floor-band', 122) // local's band is [0, 85]
    expect(outgrewTier('local', kidPoints(world, 'domestic')), 'the band ceiling is crossed').toBe(true)
    const ev = injectEvent(world, world.week + 3, 'local')
    const gate = entryStatus(world, ev)
    expect(gate.level, 'the lower bound is a sorting key, not a wall').not.toBe('blocked')
    expect(gate.outgrown).toBe(true)
    expect(() => enterEvent(world, ev.id)).not.toThrow()
    expect(world.entries).toContain(ev.id)
  })

  it('the SLIDING WINDOW ceiling admits her too, and says the same thing', () => {
    // A book that opens W75 closes W15 behind it - the rung three above, `tierOutgrown`'s own rule.
    const world = proWorld('floor-window', 17, 250)
    expect(tierOutgrown(world, 'w15'), 'the window ceiling is crossed').toBe(true)
    const ev = injectEvent(world, world.week + 3, 'w15')
    const gate = entryStatus(world, ev)
    expect(gate.level).not.toBe('blocked')
    expect(gate.outgrown).toBe(true)
    expect(() => enterEvent(world, ev.id)).not.toThrow()
  })

  it('⚠ ONE FUNCTION ANSWERS BOTH – the drift world.ts demands be impossible', () => {
    // The claim is not "both happen to say true today". It is that there is ONE answer: `hasOutgrown`
    // is true exactly when either ceiling is, on every rung of the ladder, at every book. Written as
    // an equivalence so a future arm added to one and not the other fails here.
    for (const [seed, world] of [
      ['band', domesticWorld('floor-eq-band', 122)],
      ['fresh', domesticWorld('floor-eq-fresh', 0)],
      ['deep', domesticWorld('floor-eq-deep', 600)],
      ['pro', proWorld('floor-eq-pro', 17, 250)],
      ['pro-early', proWorld('floor-eq-early', 17, 10)],
    ] as const) {
      for (const tier of TIER_LADDER) {
        const bandTrack = TIERS[tier].track === 'wta' ? 'itf' : 'domestic'
        const either =
          outgrewTier(tier, kidPoints(world, bandTrack)) || tierOutgrown(world, tier)
        expect(hasOutgrown(world, tier), `${seed} / ${tier}`).toBe(either)
      }
    }
  })
})

// =================================================================================================
// 3. THE UPPER BOUND IS THE TOUR'S OWN RULE AND IS UNTOUCHED
// =================================================================================================

describe('the upper bound stays a wall', () => {
  it('a domestic rung below her floor still refuses, with its own words', () => {
    const world = domesticWorld('floor-below', 0)
    const ev = injectEvent(world, world.week + 3, 'national') // floor 150
    const gate = entryStatus(world, ev)
    expect(gate.level).toBe('blocked')
    expect(gate.reason).toBe('locked')
    expect(gate.pointsToEnter).toBe(TIERS.national.enterPointBand[0])
    expect(tierOpenFor(world, 'national')).toBe(false)
  })

  it('an acceptance cut she is outside still refuses', () => {
    const world = proWorld('floor-cut', 17, 10) // a ten-point book stands nowhere near W100's cut
    const ev = injectEvent(world, world.week + 3, 'w100')
    const gate = entryStatus(world, ev)
    expect(gate.level).toBe('blocked')
    expect(gate.reason).toBe('locked')
    expect(gate.rankToEnter).toBe(TIERS.w100.acceptsRank)
    expect(tierOpenFor(world, 'w100')).toBe(false)
  })

  it('...and outgrowing a rung never opens one above it', () => {
    // The failure this forbids is the mirror of the one the wave fixes: a ceiling that stopped
    // refusing must not become a reason to ADMIT. `hasOutgrown` is a label; it enters nothing.
    // ⚠ THE BOOK MOVED 250 -> 200 ON 19.08, AND THE CLAIM DID NOT. Both halves of this arm still
    // have to hold together - she HAS outgrown w15, and the rung above is STILL shut - which is what
    // makes it a guard rather than an assertion about one number.
    //
    // Why it had to move: the live professional table changed what 250 points is WORTH. Measured on
    // this seed, the same career holding 250 stood 277th before the correction and 226th after, and
    // the W100 acceptance cut falls between those two - so at 250 she now clears it ON MERIT. That is
    // not the failure this arm forbids: she is admitted by her RANK, never by `hasOutgrown`, which
    // enters nothing and is still only a label. A witness sitting on the cut tests the cut, not the
    // rule; 200 restores the margin the arm was written with (swept: 180 and 200 both outgrow w15
    // with W100 shut, 250 does not).
    const world = proWorld('floor-no-lift', 17, 200)
    expect(hasOutgrown(world, 'w15')).toBe(true)
    expect(tierOpenFor(world, 'wta125')).toBe(false)
    expect(tierOpenFor(world, 'w100')).toBe(false)
  })
})

// =================================================================================================
// 4. THE CALENDAR AND THE TURNSTILE ARE ONE RULE (R10-5, re-asked for the new shape)
// =================================================================================================

describe('tierOpenFor and entryStatus cannot disagree about a rung', () => {
  // ⚠ THIS IS THE SWEEP THAT CATCHES THE LEAK. Taking the ceiling out of `tierOpenFor` alone leaves
  // the domestic ceiling inside `tierFloorOpen` (it read the WHOLE band through `isTierEligible`),
  // and then Local is shut on the calendar at 86 points while `entryStatus`, which only ever tested
  // the floor, admits her. Both directions are asserted, over the whole domestic band and both
  // ends of the professional one.
  it('a rung the calendar holds open is never refused for a POINT reason at the door', () => {
    const worlds: WorldState[] = [
      ...[0, 40, 86, 122, 200, 260, 400, 600].map((p) => domesticWorld(`sweep-dom-${p}`, p)),
      ...[10, 50, 170, 200, 400].map((b) => proWorld(`sweep-pro-${b}`, 17, b)),
    ]
    let openSeen = 0
    let shutSeen = 0
    for (const world of worlds) {
      for (const tier of TIER_LADDER) {
        const ev = injectEvent(world, world.week + 3, tier)
        const gate = entryStatus(world, ev)
        const pointRefusal = gate.level === 'blocked' && gate.reason === 'locked'
        if (tierOpenFor(world, tier)) {
          openSeen++
          expect(pointRefusal, `w${world.week} ${tier}: the calendar says open, the turnstile says locked`).toBe(false)
        } else {
          shutSeen++
          // The converse: a rung the calendar shuts must refuse at the door for a POINT reason and
          // not merely because she happens to be injured or it is the off-season that week.
          //
          // ⚠ IT NEEDED AN EXEMPTION FOR ONE DAY AND NO LONGER DOES (18.08). The date-clock wave moved
          // a fixture into a week where she holds a WILD CARD, and `entryStatus` admitted her while the
          // calendar showed the rung shut - because `homeWildCardPlace` answered FALSE without an event
          // id, and `Snapshot.tierOpen` is built per rung with no event. The owner's ruling was short -
          // «есть дефект - чиним» - so the calendar learned to scan her own card for the same door, and
          // the strict assertion is back. If this ever needs an exemption again, something is admitting
          // at the turnstile that the screen cannot explain.
          expect(
            gate.level,
            `${world.seed} w${world.week} ev${ev.week} ${tier}: shut on the calendar, open at the door (reason ${gate.reason})`,
          ).toBe('blocked')
        }
      }
    }
    // ...and the sweep really visited both sides, so a rule that answered one way everywhere would
    // not pass by vacuity.
    expect(openSeen).toBeGreaterThan(20)
    expect(shutSeen).toBeGreaterThan(20)
  })

  // ⭐⭐ PR-09 / TB-05 – AND THE PROJECTED REASON CANNOT DISAGREE WITH THE PROJECTED VERDICT.
  //
  // `Snapshot.tierOpen` comes from `tierOpenFor`; `Snapshot.tierRefusal` comes from `tierVerdict`,
  // which runs the same `entryVerdict` the turnstile runs. Both are built per rung with no event.
  // Two answers to one question is precisely the shape this whole proposal exists to remove, so the
  // one thing that must never happen is a rung the calendar calls OPEN carrying a refusal, or a rung
  // it calls SHUT carrying none.
  //
  // ⚠ THIS IS THE NET UNDER THE UI CHANGE, not a restatement of the sweep above. `composables/
  // tierState.ts` now settles "locked" from `refusal` when it is present, so if this map could drift
  // from `tierOpen` the card would go back to disagreeing with `enterEvent` - the exact defect the
  // file's own note at the top of this sweep records ("the calendar says open, the turnstile says
  // locked"), arriving from a new direction.
  it('⭐ the projected REASON and the projected VERDICT are one answer, over the same sweep', () => {
    const worlds: WorldState[] = [
      ...[0, 40, 86, 122, 200, 260, 400, 600].map((p) => domesticWorld(`refusal-dom-${p}`, p)),
      ...[10, 50, 170, 200, 400].map((b) => proWorld(`refusal-pro-${b}`, 17, b)),
    ]
    const disagreements: string[] = []
    let openSeen = 0
    let shutSeen = 0
    for (const world of worlds) {
      const snap = toSnapshot(world)
      for (const tier of TIER_LADDER) {
        const open = snap.tierOpen[tier]
        const refusal = snap.tierRefusal?.[tier]
        if (open) {
          openSeen += 1
          if (refusal) disagreements.push(`${world.seed} ${tier}: open, yet refused '${refusal.reason}'`)
        } else {
          shutSeen += 1
          if (!refusal) disagreements.push(`${world.seed} ${tier}: shut, yet carries no reason`)
        }
      }
    }
    expect(disagreements, 'the card and the turnstile have parted again').toEqual([])
    // ...and both sides were really visited, or a projection that answered one way everywhere passes.
    expect(openSeen, 'no open rung in the whole sweep').toBeGreaterThan(20)
    expect(shutSeen, 'no shut rung in the whole sweep').toBeGreaterThan(20)
  })

  it('⚠ is not vacuous: the projection really names reasons, and the numbers behind them', () => {
    const reasons = new Set<string>()
    let withNumber = 0
    for (const p of [0, 86, 200, 400]) {
      const snap = toSnapshot(domesticWorld(`refusal-why-${p}`, p))
      for (const tier of TIER_LADDER) {
        const r = snap.tierRefusal?.[tier]
        if (!r) continue
        reasons.add(r.reason)
        if (r.pointsToEnter !== undefined || r.rankToEnter !== undefined || r.entryCap !== undefined) withNumber += 1
      }
    }
    expect(reasons.size, `reasons seen: ${[...reasons].join(', ')}`).toBeGreaterThan(0)
    expect(withNumber, 'not one refusal carried the number behind it – the UI would have nothing to print').toBeGreaterThan(0)
  })
})

// =================================================================================================
// 5. THE FACT REACHES THE SCREEN, AND THE FEED AND THE STRIP READ IT DIFFERENTLY
// =================================================================================================

describe('the ceiling is carried to the UI as a label, never as a lock', () => {
  it('the snapshot carries a per-rung ceiling beside the per-rung floor', () => {
    const world = proWorld('floor-snap', 17, 250)
    const snap = toSnapshot(world)
    for (const tier of TIER_LADDER) {
      expect(typeof snap.tierOutgrown[tier], tier).toBe('boolean')
      expect(snap.tierOutgrown[tier], tier).toBe(hasOutgrown(world, tier))
    }
    // The one that matters: open AND passed at the same time, which `tierOpen` alone cannot say.
    expect(snap.tierOpen.w15).toBe(true)
    expect(snap.tierOutgrown.w15).toBe(true)
  })

  it('an outgrown card is eligible, carries the flag, and names no ineligible reason', () => {
    const world = domesticWorld('floor-card', 122)
    injectEvent(world, world.week + 3, 'local')
    const up = toSnapshot(world).upcoming.find((e) => e.tier === 'local')!
    expect(up.eligible).toBe(true)
    expect(up.ineligibleReason).toBeUndefined()
    expect(up.outgrown).toBe(true)
  })

  it('the FEED shows the rungs beneath her; the WORKING window does not', () => {
    // Two questions, two answers, and the split is the whole reason `working` exists: a week whose
    // only event is beneath her has to render (that is the defect being fixed), while the Home
    // strip's collapse is about the rungs her career is currently ABOUT.
    const world = proWorld('floor-feed', 17, 250)
    const snap = toSnapshot(world)
    const ctx = feedContext({
      ageYears: snap.ageYears ?? 0,
      tierOpen: snap.tierOpen,
      tierOutgrown: snap.tierOutgrown,
      upcoming: [],
    })
    expect(ctx.rungs).toContain('w15')
    expect(ctx.working).not.toContain('w15')
    expect(ctx.working.every((t) => ctx.rungs.includes(t))).toBe(true)
    // ...and a card on a rung beneath her still renders, which is the point of the whole wave.
    expect(feedShows({ id: 'x', tier: 'w15', entered: false }, ctx)).toBe(true)
  })

  it('the working window never empties, even when every open rung is behind her', () => {
    // "Everything is behind her" and "nothing is hers" are different sentences, and a blank strip
    // says the second one.
    const ctx = feedContext({
      ageYears: 22,
      tierOpen: { local: true, regional: true },
      tierOutgrown: { local: true, regional: true },
      upcoming: [],
    })
    expect(ctx.working).toEqual(['local', 'regional'])
  })

  it('the card still leads with the rung she has NOT passed', () => {
    // «Lead with the more relevant tournament of the week when there is one» – and the rule that
    // expresses it is the LADDER tiebreak, not an outgrown one. See `preferredWeekEvent`'s note for
    // why a "prefer not-outgrown" clause would have been wrong.
    const ev = (tier: TierId) => ({ tier, entered: false, eligible: true, id: tier })
    expect(preferredWeekEvent([ev('local'), ev('w50')])!.tier).toBe('w50')
    expect(preferredWeekEvent([ev('w50'), ev('local')])!.tier).toBe('w50')
    // ...and a week that only carries the rung beneath her still offers it, rather than nothing.
    expect(preferredWeekEvent([ev('local')])!.tier).toBe('local')
  })
})

// =================================================================================================
// 6. THE COACH AS SCHEDULER – his opinion about WHICH EVENT (the owner, 08.08)
// =================================================================================================
//
// The ladder floor put a decision in the player's hands that the engine used to make by refusing.
// This is the person he is already paying making that decision informed. What it must be:
//   * SILENT about the rung she is on – her working rung is where the coach wants her;
//   * SILENT when there is nothing better – she should play, which is exactly what the owner ruled;
//   * SILENT on a self-coached career – nobody is being paid to have a view (the load wave's rule);
//   * GRADED BY HIS OWN RUNG, which is what makes paying for him a decision again;
//   * ADVICE, never a block, at every rung – the standing rule of this game.

describe('the coach has an opinion about WHICH event, and it is only ever advice', () => {
  const rungOf = (t: CoachTier) => t

  it('he says nothing about the rung she is on', () => {
    const world = proWorld('coach-working', 17, 250)
    const w75 = injectEvent(world, world.week + 3, 'w75')
    expect(hasOutgrown(world, 'w75')).toBe(false)
    expect(coachLadderNote(world, w75, rungOf('elite'))).toBeNull()
  })

  it('he says nothing when there is nothing better – she should play', () => {
    // A rung she has passed, an empty calendar around it, and a book with room: no argument, so no
    // sentence. This is the case the owner's ruling is ABOUT and the one a nagging coach would ruin.
    const world = proWorld('coach-silent', 17, 250)
    const w15 = injectEvent(world, world.week + 3, 'w15')
    expect(hasOutgrown(world, 'w15')).toBe(true)
    expect(coachLadderNote(world, w15, rungOf('elite'))).toBeNull()
  })

  it('nobody is being paid to have a view on a self-coached career', () => {
    const world = proWorld('coach-self', 17, 250)
    const w15 = injectEvent(world, world.week + 3, 'w15')
    injectEvent(world, world.week + 3, 'w75')
    expect(coachLadderNote(world, w15, rungOf('elite'))).not.toBeNull()
    expect(coachLadderNote(world, w15, rungOf('self'))).toBeNull()
  })

  it('THIS WEEK: he names the better event on the same week, at every hired rung', () => {
    const world = proWorld('coach-thisweek', 17, 250)
    const w15 = injectEvent(world, world.week + 3, 'w15')
    injectEvent(world, world.week + 3, 'w75')
    for (const tier of ['budget', 'middle', 'high', 'elite'] as const) {
      const said = coachLadderNote(world, w15, tier)
      expect(said, tier).toContain(TIERS.w75.label)
      expect(said, tier).toContain('is the week')
    }
  })

  it('THE BLOCK AHEAD: how far he sees is his own rung, which is what paying for him buys', () => {
    const world = proWorld('coach-ahead', 17, 250)
    const w15 = injectEvent(world, world.week + 3, 'w15')
    injectEvent(world, world.week + 6, 'w75') // three weeks after the trip in question
    // A budget coach is on the court with her and does not volunteer a plan three weeks out.
    expect(coachLadderNote(world, w15, rungOf('budget'))).toBeNull()
    expect(coachLadderNote(world, w15, rungOf('middle'))).toBeNull() // horizon 2
    // ...and the rungs that plan see it, and NAME it - a caution that only says no is a guard rail.
    for (const tier of ['high', 'elite'] as const) {
      const said = coachLadderNote(world, w15, tier)
      expect(said, tier).toContain(TIERS.w75.label)
      expect(said, tier).toContain('in 3 weeks')
    }
  })

  it('THE BOOK: only a coach who keeps it can make the arithmetic argument', () => {
    // Eighteen counting W results, every one of them worth more than a W15 title: her window is
    // full and nothing here can enter it. That is a fact about a ledger somebody has to be keeping.
    const world = proWorld('coach-book', 19, 0)
    for (let i = 0; i < BEST_N_BY_TRACK.wta; i++) {
      world.results.push({ playerId: KID_ID, week: world.week - i, points: 100, tier: 'w75' })
    }
    recomputeKidRank(world)
    const w15 = injectEvent(world, world.week + 3, 'w15')
    expect(hasOutgrown(world, 'w15')).toBe(true)
    expect(bookClosedTo(world, 'w15')).toBe(true)
    expect(coachLadderNote(world, w15, rungOf('budget'))).toBeNull()
    for (const tier of ['middle', 'high', 'elite'] as const) {
      expect(coachLadderNote(world, w15, tier), tier).toContain('would not move her ranking')
    }
  })

  it('...and a window with ROOM is never called closed', () => {
    const world = proWorld('coach-book-room', 19, 0)
    for (let i = 0; i < BEST_N_BY_TRACK.wta - 1; i++) {
      world.results.push({ playerId: KID_ID, week: world.week - i, points: 100, tier: 'w75' })
    }
    recomputeKidRank(world)
    expect(bookClosedTo(world, 'w15')).toBe(false)
  })

  // ===============================================================================================
  // ⚠ THE CLAIM IS LICENSED BY THE ARITHMETIC IT BORROWS (the owner, 12.08: «the National Series is
  // the week - this one will not move anything. Enter World Tour 35?» ... «что вообще довольно
  // странно по самой формулировке»). "Will not move anything" was clause 2's sentence said without
  // clause 2's test: measured on tools/coach-ladder-claim-probe.ts, 87% of the cards it dismissed
  // had ROOM in their own best-N book, and 84% of the alternatives it held up paid into a different
  // table - usually a domestic rung against her professional card. The four tests below are the fix:
  // each half-sentence fires exactly when it is true, and the alternative is never off her ladder.
  // ===============================================================================================

  it('⚠ a book with ROOM never hears "will not move anything" - he says what he knows instead', () => {
    // Same fixture as THIS WEEK above: one counting w15 result, so her professional window has
    // seventeen empty slots and a title here WOULD move her ranking. The old clause 1 dismissed
    // exactly this card, which is the owner's complaint made of arithmetic.
    const world = proWorld('coach-honest', 17, 250)
    const w15 = injectEvent(world, world.week + 3, 'w15')
    injectEvent(world, world.week + 3, 'w75')
    expect(bookClosedTo(world, 'w15')).toBe(false)
    for (const tier of ['budget', 'middle', 'high', 'elite'] as const) {
      const said = coachLadderNote(world, w15, tier)
      expect(said, tier).toContain('she has outgrown this one')
      expect(said, tier).not.toContain('will not move anything')
    }
  })

  it('⚠ ...and a SHUT book earns the strong claim - from the coaches who keep the book', () => {
    // Eighteen counting rows, each worth more than a W15 title: the window really cannot take it,
    // so "will not move anything" is true - and the same-week alternative is still named, which is
    // what makes clause 1 more useful than clause 2 when both are available.
    const world = proWorld('coach-strong', 19, 0)
    for (let i = 0; i < BEST_N_BY_TRACK.wta; i++) {
      world.results.push({ playerId: KID_ID, week: world.week - i, points: 100, tier: 'w75' })
    }
    recomputeKidRank(world)
    const w15 = injectEvent(world, world.week + 3, 'w15')
    // The rung beside it must be one she has NOT walked past: at this book the sliding window has
    // closed everything up to wta125, so the terminal rungs are where a genuine alternative lives.
    injectEvent(world, world.week + 3, 'wta250')
    expect(hasOutgrown(world, 'w15')).toBe(true)
    expect(bookClosedTo(world, 'w15')).toBe(true)
    expect(hasOutgrown(world, 'wta250')).toBe(false)
    expect(tierOpenFor(world, 'wta250')).toBe(true)
    for (const tier of ['middle', 'high', 'elite'] as const) {
      const said = coachLadderNote(world, w15, tier)
      expect(said, tier).toContain(TIERS.wta250.label)
      expect(said, tier).toContain('will not move anything')
    }
    // A budget coach sees the same two draws in front of him but is not keeping her best-N book
    // (`coachReadsTheBook`), so the book's sentence is not his to say - the outgrown one is.
    const budget = coachLadderNote(world, w15, rungOf('budget'))
    expect(budget).toContain(TIERS.wta250.label)
    expect(budget).toContain('she has outgrown this one')
    expect(budget).not.toContain('will not move anything')
  })

  it('⚠ THE OWNER\'S OWN CARD: a domestic rung is never held up against the table she is climbing', () => {
    // His screenshot's exact shape: a professional card, a National-track event on the same week.
    // The preconditions prove the old picker WOULD have named it (open, not outgrown, same week) -
    // and the book has room, so the sentence it hung on the card was false twice over. The
    // professional arm is a one-way door (`activeLadderOf`); the coach does not point back through
    // it, and with nothing else to say he says nothing.
    const world = proWorld('coach-owner-card', 17, 250)
    world.results.push({ playerId: KID_ID, week: world.week, points: 160, tier: 'national' })
    recomputeKidRank(world)
    const w15 = injectEvent(world, world.week + 3, 'w15')
    injectEvent(world, world.week + 3, 'national')
    expect(hasOutgrown(world, 'w15')).toBe(true)
    expect(hasOutgrown(world, 'national')).toBe(false)
    expect(tierOpenFor(world, 'national')).toBe(true)
    expect(bookClosedTo(world, 'w15')).toBe(false)
    for (const tier of ['budget', 'middle', 'high', 'elite'] as const) {
      expect(coachLadderNote(world, w15, tier), tier).toBeNull()
    }
  })

  it('⚠ a card that pays into a table she has LEFT is told the table, not a false "nothing"', () => {
    // The other direction of the same defect: a domestic card in her international era. A Local
    // title still moves her national standing (the book has room), so "will not move anything" is
    // false - the true and useful sentence names the currency. Court-visible facts, so every hired
    // rung may say it, budget included.
    const world = createWorld('coach-cross')
    world.condition = 100
    world.fundsCents = 50_000_00
    world.season = []
    world.results.push({ playerId: KID_ID, week: world.week, points: 122, tier: 'national' })
    world.results.push({ playerId: KID_ID, week: world.week, points: 60, tier: 'j30' })
    world.onRampCleared = { itf: true, wta: false }
    recomputeKidRank(world)
    const local = injectEvent(world, world.week + 3, 'local')
    injectEvent(world, world.week + 3, 'j30')
    expect(hasOutgrown(world, 'local')).toBe(true)
    expect(hasOutgrown(world, 'j30')).toBe(false)
    expect(tierOpenFor(world, 'j30')).toBe(true)
    expect(bookClosedTo(world, 'local')).toBe(false)
    for (const tier of ['budget', 'middle', 'high', 'elite'] as const) {
      const said = coachLadderNote(world, local, tier)
      expect(said, tier).toContain(TIERS.j30.label)
      expect(said, tier).toContain('national points, not the table she is climbing')
      expect(said, tier).not.toContain('will not move anything')
    }
  })

  it('⚠ IT IS ADVICE AND NEVER A BLOCK – at every rung, on every line he has', () => {
    // The standing rule of this game: the parent may push. `coachCaution` turns the button from
    // "Enter" into "Push through"; it must never turn it off.
    const world = proWorld('coach-never-blocks', 17, 250)
    const w15 = injectEvent(world, world.week + 3, 'w15')
    injectEvent(world, world.week + 3, 'w75')
    for (const tier of ['budget', 'middle', 'high', 'elite'] as const) {
      expect(coachLadderNote(world, w15, tier), tier).not.toBeNull()
      expect(entryStatus(world, w15).level, tier).not.toBe('blocked')
    }
    expect(() => enterEvent(world, w15.id)).not.toThrow()
  })

  it('the card carries what he says, and only about a trip she can take', () => {
    const world = proWorld('coach-card', 17, 250)
    world.coachId = openingCoachId(world.seed, { ...world.profile, coachTier: 'elite' })
    injectEvent(world, world.week + 3, 'w15')
    injectEvent(world, world.week + 3, 'w75')
    const up = toSnapshot(world).upcoming.find((e) => e.tier === 'w15')!
    expect(up.eligible).toBe(true)
    expect(up.coachCaution).toBeTruthy()
    // ...and never on a card the gate refuses: he speaks about trips she can take (the load wave's
    // own rule, and the reason "the advice never locks a card" stays verifiable).
    for (const e of toSnapshot(world).upcoming) {
      if (!e.eligible && !e.entered) expect(e.coachCaution, e.tier).toBeUndefined()
    }
  })
})

describe('the leftovers', () => {
  it('the card still leads with the rung she has NOT passed (regression guard)', () => {
    // «Lead with the more relevant tournament of the week when there is one» – and the rule that
    // expresses it is the LADDER tiebreak, not an outgrown one. See `preferredWeekEvent`'s note for
    // why a "prefer not-outgrown" clause would have been wrong.
    const ev = (tier: TierId) => ({ tier, entered: false, eligible: true, id: tier })
    expect(preferredWeekEvent([ev('local'), ev('w50')])!.tier).toBe('w50')
    expect(preferredWeekEvent([ev('w50'), ev('local')])!.tier).toBe('w50')
    // ...and a week that only carries the rung beneath her still offers it, rather than nothing.
    expect(preferredWeekEvent([ev('local')])!.tier).toBe('local')
  })
})
