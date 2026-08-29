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
// ⚠⚠⚠ RE-AIMED BY ROUND 29 PART THREE P3, 29.08 – NOT ONE ARM DELETED, AND THE ITEM'S CLAIM IS
// UNCHANGED: «the percentage the card prints must be a percentage OF the figure the card prints
// beside it». What P3 changed is that there are now TWO rates on one week. A title week pays a
// prize at her ramp (50% at the cap) and a result bonus at the manager's commission's complement
// (85%), so «the rate» is no longer a single number the writer can copy down – `accrueKidShare`
// stores the week's EFFECTIVE rate instead (`cents / baseCents`), which is what makes #10's
// identity hold by construction rather than by there happening to be one rate in the game.
// ⚠ THE THREE FIGURES THAT MOVED, and each is arithmetic rather than a judgement call:
//   * `bps` on this fixture: 5000 -> 5583, which is 0.5P + 0.85 x 0.2P over 0.5P + 0.2P.
//   * the ratio he measured: 1.20 -> 1.34, i.e. 1 + bonusShare x (1 - commission) / ramp. His 1.20
//     is the same formula with the bonus at her ramp, and it is still reproduced by the formula –
//     see §1's last arm, which now DERIVES the number from the two constants instead of pinning it.
//   * §2's tolerance: 3 cents -> half a percentage point of the base, because `kidSharePct` is a
//     WHOLE percent and 55.83% renders as 56%. ⚠ That is a rounding the old fixture never showed:
//     with one rate the effective rate was a whole number of percent by construction.
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
// ⚠ AND P3's OWN THREE, applied alone and reverted:
//   * `bankSponsorCheque` reverted to her ramp -> the fixture arm's «two rates really are live»
//     bound goes RED alone (the effective rate collapses back onto the ramp exactly).
//   * `ECONOMY.managerCommission.bps` 1500 -> 2500 -> the fixture arm's literal pin and §1's ratio
//     arm go RED together, which is the pair that has to see a retune.
//   * `accrueKidShare` storing the handed-in `bps` again instead of the effective one -> §1's
//     identity arm and §2's label arm go RED together, which is the defect this item is about
//     arriving by a new route.
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
import { ECONOMY, kidPrizeShareBps, managerCommissionBps } from '../src/engine/economy'
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
    // here asks the engine for its expectation, which is correct for a retune and therefore BLIND
    // to one; these are the literals that see a rate move. ⚠ RE-AIMED BY P3: there are two rates to
    // watch now, and `kidShare.bps` is neither of them – it is the week's effective blend.
    expect(ECONOMY.kidShare.capBps, 'the ramp still caps at half – his save says 5000').toBe(5000)
    expect(managerCommissionBps(), 'and the manager keeps the shipped 15%').toBe(1500)
    expect(kidPrizeShareBps(age)).toBe(ECONOMY.kidShare.capBps)
    // ⭐⭐ AND BOTH RULES ARE REALLY LIVE ON THIS ONE WEEK, which is the P3 fact and the arm that
    // reddens if the commission is reverted: the blend sits STRICTLY between the prize ramp and the
    // sponsor rate. A week paying only a prize would read exactly 5000; only a sponsor cheque, 8500.
    expect(row.kidShare!.bps, 'above the prize ramp – a sponsor cheque pays her more').toBeGreaterThan(
      ECONOMY.kidShare.capBps,
    )
    expect(row.kidShare!.bps, 'and below the sponsor rate – a prize cheque pays her less').toBeLessThan(
      10_000 - managerCommissionBps(),
    )
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

    // ⚠ RE-AIMED BY P3, AND THE CLAIM IS THE SAME ONE: her credit is the STATED share of the
    // recorded base. It used to be stated by the ramp, because the ramp was the only rate; it is
    // stated by `bps` now, which is the week's effective rate over both rules.
    // ⚠ THE TOLERANCE IS REAL AND IS NOT SLOP. `bps` is a whole number of basis points, so the
    // rounding it carries is at most half a basis point of the base, plus the per-cheque cent.
    expect(Math.abs(cents - Math.round((baseCents! * bps) / 10_000))).toBeLessThanOrEqual(
      Math.round(baseCents! / 20_000) + 3,
    )
    // ⚠ AND THE ANTI-VACUITY BOUND, because the line above is nearly true by construction: the
    // effective rate has to be a rate a real pair of rules could produce. The ramp's cap is the
    // floor here (the prize is the larger cheque) and the sponsor rate is the ceiling.
    expect(bps).toBeGreaterThanOrEqual(kidPrizeShareBps(26))
    expect(bps).toBeLessThanOrEqual(10_000 - managerCommissionBps())
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

  it('the ratio he measured falls straight out of it – 1.34 against the prize row, and 1.20 was the pre-P3 form of the same formula', () => {
    const { world, week } = capWeekWithBonus()
    const row = world.financeWeeks.find((w) => w.week === week)!
    // ⭐ HIS OWN NUMBER, RE-DERIVED RATHER THAN RE-PINNED. 24 of the 27 weeks in his save landed on
    // exactly 1.20, and that figure was `1 + bonusShare x ramp / ramp` – her cut of the prize plus
    // her cut of the result bonus, over the family's net prize row. ⚠ P3 CHANGED ONE TERM OF IT:
    // the bonus is a sponsor cheque, so her share of it went from the ramp to the commission's
    // complement, and the same formula now reads 1.34. The formula is asserted rather than the
    // number, so a retune of EITHER rate has to explain itself against his report instead of
    // silently agreeing with a literal.
    const deal = world.offers.find((o) => o.kind === 'kit' && o.state === 'signed')
    const bonusShare = (deal?.terms as KitOfferTerms | undefined)?.bonusShare ?? 0
    expect(bonusShare, 'the fixture really carries a result bonus – his save is a tour deal').toBeGreaterThan(0)
    const ramp = kidPrizeShareBps(26) / 10_000
    const expected = 1 + (bonusShare * (1 - managerCommissionBps() / 10_000)) / ramp
    const ratio = row.kidShare!.cents / (row.byCategory.prize ?? 1)
    expect(ratio).toBeCloseTo(expected, 2)
    // ...and what that formula evaluates to on the shipped numbers, said out loud so the report and
    // the code carry the same figure.
    expect(expected).toBeCloseTo(1.34, 2)
  })
})

describe('round 29 #10 – §2 the LABEL, pinned against that same base', () => {
  it('the point the recap reads carries the base the ledger recorded', () => {
    const { snap, world, week } = capWeekWithBonus()
    const point = snap.finance.weekly12.find((p) => p.week === week)!
    expect(point.kidShareCents, 'her cut reached the snapshot').toBeGreaterThan(0)
    expect(point.kidShareBaseCents, 'and so did the base it is a share of').toBeGreaterThan(0)
    // ⚠⚠ THE ANTI-DRIFT ASSERTION, AND THE ONE THIS ITEM EXISTS FOR. The percentage the card prints
    // must be a percentage OF the figure the card prints beside it.
    // ⚠ RE-AIMED BY P3, AND THE TOLERANCE IS A REAL PROPERTY OF THE SCREEN RATHER THAN SLOP.
    // `kidSharePct` is a WHOLE percent (rounded once at the snapshot boundary, the owner's rule of
    // 26.08), so the most the printed percentage can misdescribe the printed cents by is HALF A
    // PERCENTAGE POINT of the base. With one rate in the game the effective rate happened to be a
    // whole percent and this never showed; a blend of 50% and 85% is 55.83% and renders as 56%.
    // ⚠ The original defect is still caught by a mile: it put the family's NET income in the base,
    // which is off by roughly the whole cut and not by half a point of it.
    const impliedCut = Math.round((point.kidShareBaseCents! * point.kidSharePct!) / 100)
    expect(Math.abs(impliedCut - point.kidShareCents!)).toBeLessThanOrEqual(
      Math.round(point.kidShareBaseCents! / 200) + 3,
    )
    // ...and the whole percent really is the ledger's own rate rounded, never a second derivation.
    const row = world.financeWeeks.find((w) => w.week === week)!
    expect(point.kidSharePct).toBe(Math.round(row.kidShare!.bps / 100))
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
