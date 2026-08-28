// ⭐⭐⭐ ROUND 29 #10 – HER CUT, ITS BASE, AND THE LABEL THAT NAMES BOTH.
//
// THE OWNER, off save `alice-cfbv_w780`: «По результатам w500 мне пишут Income +$29,046 · Spent
// -$6,883 · Balance +$22,164 · Her cut 50% $27,600 – это не 50% по сравнению с income».
//
// ⚠⚠ THE SPLIT WAS NEVER WRONG. Two readings of this were filed before anybody drove the engine –
// «95%» (a division that should have been an addition, and he corrected it himself) and then a
// «variable term» in the ratio – and BOTH came from reasoning about the ratio instead of reading
// the writer. What the writer does: `finalizeTournament` banks the family `prize − herShare`, so
// the ledger's prize row is ALREADY NET, while `kidShare.cents` is her half of the GROSS – and of
// the kit contract's result bonus, which is a second gross cheque worth `bonusShare × the same
// prize table`. At the cap (5000 bps) and a `tour` kit deal (bonusShare 0.2) that is
// 0.5P + 0.5×0.2P = 0.6P of her cut against a 0.5P prize row: the 1.20 he measured, exactly, with
// no variable term anywhere. His two drifting weeks (1.22, 1.26) are the quarterly retainer's own
// $750 landing on a tournament week – weeks 728 / 741 / 754 / 767, thirteen apart to the week.
//
// **So the label lied about its base and the money did not.** «50%» stood beside `Income`, which is
// the family's REMAINDER of the very cheque being split and therefore the one figure it can never
// be 50% of. The base – the gross – was the only number never on the card. This file measures both
// halves of the repair: the SPLIT against the base the engine really used, and the LABEL against
// that same base, so the two cannot drift apart again.
//
// ⚠ MUTATION-VERIFIED. Each applied alone against this file and reverted, and each was watched:
//   * `ECONOMY.kidShare.capBps` 5000 -> 4000, i.e. THE SPLIT MOVED -> §1's identity arm stays GREEN
//     (correctly – it asks the ramp for its expectation, so the game moves and the test moves with
//     it) and §1's «it is really the cap» guard plus §2's label arm go RED. That is why the guard
//     exists: without it the identity arm alone would pass on any rate at all.
//   * `accrueKidShare` given `familyShare` instead of `prize` as its base – THE ORIGINAL DEFECT,
//     rebuilt -> §1's identity arm and §2's label arm both go RED, together. This is the mutation
//     the whole file is for.
//   * `bankSponsorCheque` passing `herCents` as its base instead of `grossCents` -> §1's
//     multi-cheque arm goes RED alone.
//   * the memo's `of ${formatCents(base)}` dropped from WeekRecapCard -> §2 alone goes RED.
import { describe, it, expect, vi } from 'vitest'

// A real career walked to the cap birthday is ~1,350 ticks; the runner is shared with heavier suites.
vi.setConfig({ testTimeout: 300_000 })

import {
  KID_ID,
  closeTournament,
  createWorld,
  enterEvent,
  kidAgeYears,
  skipTournament,
  tickWeek,
  toSnapshot,
  type WorldState,
} from '../src/engine/world'
import { sponsorStandingOf } from '../src/engine/world/sponsors'
import { kitTermsFor, signOffer } from '../src/engine/offers'
import { ECONOMY, kidPrizeShareBps, kidPrizeShareCents } from '../src/engine/economy'
import { rngFromSeed } from '../src/engine/rng'
import { TIERS, WEEKS_PER_YEAR } from '../src/engine/season/calendar'
import { DEFAULT_PROFILE, type KitOfferTerms, type Offer, type Snapshot } from '../src/shared/protocol'
import type { SeasonEvent, TierId } from '../src/engine/season/types'
import type { SeasonResult } from '../src/engine/season/ranking'

/** `week-recap-kid-share.test.ts`'s helper, unchanged. */
function enterEligible(world: WorldState, event: SeasonEvent): void {
  const min = TIERS[event.tier as TierId].enterPointBand[0]
  const marker: SeasonResult = { playerId: KID_ID, week: world.week, points: min, tier: event.tier }
  if (min > 0) world.results.push(marker)
  enterEvent(world, event.id)
  if (min > 0) world.results = world.results.filter((r) => r !== marker)
}

/** `round28-sponsor-cut.test.ts`'s helper, unchanged: the terms are the ENGINE's own (`kitTermsFor`)
 *  and the signature is the engine's own, never a hand-built contract that goes stale silently. */
function signKit(world: WorldState, rung: 'tour' | 'premium' | 'icon'): KitOfferTerms {
  const terms = kitTermsFor(sponsorStandingOf(world), rung)
  if (!terms) throw new Error(`no kit terms at rung ${rung}`)
  const offer: Offer = {
    id: `kit-r29-${world.week}`,
    kind: 'kit',
    week: world.week,
    deadlineWeek: world.week + 4,
    state: 'open',
    terms,
  }
  world.offers.push(offer)
  signOffer(world.offers, offer.id, world.week)
  return terms
}

/** ⭐ A REAL PRIZE WEEK, WALKED – never a hand-set `financeWeeks` row.
 *
 *  ⚠ THE POINT OF WALKING IT IS THE SECOND CHEQUE. His save's ratio is 1.20 and not 1.00 precisely
 *  because a title week pays the tournament AND the kit contract's result bonus, through two
 *  different functions, into one `kidShare` row. A fixture that called `accrueKidShare` directly
 *  would assert the arithmetic of a single cheque and would have been green all through the defect.
 *
 *  Walked to the ramp's CAP (26) with a `tour` kit deal signed, which is his save's own shape.
 *  Walked once for the file: every claim below is about the same week. */
let cached: { world: WorldState; snap: Snapshot; week: number } | null = null
function capWeekWithBonus() {
  if (cached) return cached
  const world = createWorld('r29-kid-cut', { ...DEFAULT_PROFILE, birthMonth: 1, birthDay: 5 })
  const rng = rngFromSeed(world.seed)
  let signed = false
  while (world.week < WEEKS_PER_YEAR * 32) {
    // The family is kept solvent so the walk is about the cheques and not about a career dying –
    // `week-recap-kid-share.test.ts`'s own device.
    world.fundsCents = Math.max(world.fundsCents, 5_000_000_00)
    const age = kidAgeYears(world.week, world.profile.birthMonth, world.profile.birthDay)
    if (!signed && age >= ECONOMY.kidShare.fromAgeYears + 8) {
      try {
        signKit(world, 'tour')
        signed = true
      } catch {
        /* no rung open yet */
      }
    }
    const next = world.season.find(
      (e) =>
        e.week > world.week &&
        e.week <= world.week + 4 &&
        world.week <= e.deadlineWeek &&
        !world.entries.includes(e.id),
    )
    if (next) {
      try {
        enterEligible(world, next)
      } catch {
        /* the door was shut that week */
      }
    }
    tickWeek(world, rng)
    if (world.pendingTournament) {
      skipTournament(world)
      closeTournament(world)
    }
    const fw = world.financeWeeks.find((w) => w.week === world.week)
    // A week that split a cheque AND paid a prize row – i.e. a real tournament week, which is the
    // only kind his report is about.
    if (signed && fw?.kidShare?.baseCents && (fw.byCategory.prize ?? 0) > 0) {
      cached = { world, snap: toSnapshot(world), week: world.week }
      return cached
    }
  }
  throw new Error('the walk never reached a paid prize week with a kit deal live')
}

describe('round 29 #10 – the fixture is the week he was looking at', () => {
  it('a real prize week, at the cap, with a result bonus in it', () => {
    const { world, week } = capWeekWithBonus()
    const row = world.financeWeeks.find((w) => w.week === week)!
    const age = kidAgeYears(week, world.profile.birthMonth, world.profile.birthDay)

    expect(row.kidShare, 'the week really split a cheque').toBeTruthy()
    // ⚠ THE GUARD THAT STOPS THE IDENTITY ARM PASSING ON ANY RATE AT ALL. Every other assertion
    // here asks `kidPrizeShareBps` for its expectation, which is correct for a retune and therefore
    // BLIND to one; this is the single literal that sees the rate move.
    expect(row.kidShare!.bps, 'and she is at the shipped cap – his save says 5000').toBe(5000)
    expect(kidPrizeShareBps(age)).toBe(ECONOMY.kidShare.capBps)
    // The base must EXCEED the prize row, which is the whole defect in one assertion: the prize row
    // is net of her cut, and a second gross cheque (the result bonus) is in the base beside it.
    expect(row.kidShare!.baseCents!).toBeGreaterThan(row.byCategory.prize ?? 0)
  })
})

describe('round 29 #10 – §1 the SPLIT, against the base the engine actually used', () => {
  it('her credit is the stated share of the recorded base', () => {
    const { world, week } = capWeekWithBonus()
    const row = world.financeWeeks.find((w) => w.week === week)!
    const { cents, bps, baseCents } = row.kidShare!

    // ⚠ THE TOLERANCE IS REAL AND IS NOT SLOP. Each cheque rounds ONCE on its own way in
    // (`kidPrizeShareCents`' single-rounding rule, which is what makes the two balances re-add to
    // the cent), so a sum of rounded halves can differ from the rounded half of a sum by up to one
    // cent PER CHEQUE. A title week here banks at most three (prize, result bonus, retainer).
    expect(Math.abs(cents - kidPrizeShareCents(baseCents!, 26))).toBeLessThanOrEqual(3)
    expect(bps).toBe(kidPrizeShareBps(26))
  })

  it('the base is the GROSS of every cheque, so the family kept exactly the remainder', () => {
    const { world, week } = capWeekWithBonus()
    const row = world.financeWeeks.find((w) => w.week === week)!
    const { cents, baseCents } = row.kidShare!

    // What the family banked out of the same cheques. `byCategory.prize` is the net prize row and
    // the bonus lands under `income`; between them they are the base minus her cut, and the only
    // way that identity can hold is if the base really is the gross.
    const familyFromCheques = (row.byCategory.prize ?? 0) + (row.byCategory.income ?? 0)
    expect(familyFromCheques).toBeGreaterThan(0)
    // ⚠ `income` also carries the week's non-tennis cheques, so this is an INEQUALITY and not an
    // equality: the family's share of the split cheques is AT MOST what it banked under those two
    // categories, and it can never be more.
    expect(baseCents! - cents).toBeLessThanOrEqual(familyFromCheques)
    expect(baseCents!).toBeGreaterThan(cents)
  })

  it('a multi-cheque week sums its bases, not just its cents', () => {
    const { world, week } = capWeekWithBonus()
    const row = world.financeWeeks.find((w) => w.week === week)!
    const { baseCents } = row.kidShare!
    // The prize alone, reconstructed from the family's net row: `familyShare = prize − herShare`,
    // so at the cap the gross prize is twice the net row. The base must be STRICTLY larger, because
    // the result bonus is a second gross cheque on the same week.
    const grossPrizeAtCap = (row.byCategory.prize ?? 0) * 2
    expect(baseCents!).toBeGreaterThan(grossPrizeAtCap)
  })

  it('the ratio he measured falls straight out of it – 1.20 against the prize row', () => {
    const { world, week } = capWeekWithBonus()
    const row = world.financeWeeks.find((w) => w.week === week)!
    // ⭐ HIS OWN NUMBER, REPRODUCED. 24 of the 27 weeks in his save land on exactly 1.20; this is
    // that figure arriving from the engine rather than from a spreadsheet, and it is here so that a
    // future change to the bonus or the ramp has to explain itself against his report.
    const ratio = row.kidShare!.cents / (row.byCategory.prize ?? 1)
    expect(ratio).toBeCloseTo(1.2, 2)
  })
})

describe('round 29 #10 – §2 the LABEL, pinned against that same base', () => {
  it('the point the recap reads carries the base the ledger recorded', () => {
    const { snap, week } = capWeekWithBonus()
    const point = snap.finance.weekly12.find((p) => p.week === week)!
    expect(point.kidShareCents, 'her cut reached the snapshot').toBeGreaterThan(0)
    expect(point.kidShareBaseCents, 'and so did the base it is a share of').toBeGreaterThan(0)
    // ⚠⚠ THE ANTI-DRIFT ASSERTION, AND THE ONE THIS ITEM EXISTS FOR. The percentage the card prints
    // must be a percentage OF the figure the card prints beside it. Same tolerance as §1 and for
    // the same reason.
    const impliedCut = Math.round((point.kidShareBaseCents! * point.kidSharePct!) / 100)
    expect(Math.abs(impliedCut - point.kidShareCents!)).toBeLessThanOrEqual(3)
  })

  it('and the base is NOT the income figure beside it – his complaint, as an assertion', () => {
    const { snap, week } = capWeekWithBonus()
    const point = snap.finance.weekly12.find((p) => p.week === week)!
    // «это не 50% по сравнению с income», and it never was: income is the family's remainder. If a
    // future refactor ever makes the base equal the income figure, this item has been undone.
    expect(point.kidShareBaseCents).not.toBe(point.incomeCents)
    expect(point.kidShareBaseCents!).toBeGreaterThan(point.incomeCents)
  })
})
