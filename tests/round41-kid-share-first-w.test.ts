// ROUND 41 #27 – HER SHARE OF THE PRIZE STARTS AT HER FIRST W-SERIES CHEQUE, NOT AT EIGHTEEN.
//
// HIS QUESTION, 12.09: «может быть начать отчисления не в 18, а в 16 лет уже или вообще с момента,
// когда она в первый раз на w серию приходит? это же всё таки ее призовые» – and his ruling, option
// A1, the same day: «призовые падают на её счёт с первого старта W-серии независимо от возраста –
// согласен».
//
// ⚠⚠⚠ THE ITEM'S HARDEST QUESTION WAS «WHAT IS THE TRIGGER», AND THE ANSWER IS THAT IT NEEDS NO
// TRIGGER AT ALL. §1 is that finding, stated as tests rather than as a comment:
//
//   1. PRIZE MONEY EXISTS ON THE PROFESSIONAL TRACK ONLY. Every `wta`-track tier in `calendar.ts`
//      carries a `prize` table; not one domestic or ITF-junior rung does, and the engine says why at
//      the finalize site – junior tennis pays nothing, ever (ITF Juniors Reg 31 a) i)).
//   2. THE SPLIT IS INSIDE `if (prize > 0)`. So it is reached on a W-series result and on nothing
//      else, and «her share of every prize cheque, whatever her age» and «her share from her first
//      W-series start» are the SAME SET OF CHEQUES.
//
// So the ramp is age-only – a flat `startBps` below eighteen, the shipped ladder from it – and there
// is no `wtaEverCounted`-shaped gate anywhere. A gate would have been a predicate that can only ever
// answer true where it is asked, and this repo has dug out nine dead guards in three days.
//
// ⚠⚠ AND `wtaEverCounted` WOULD HAVE BEEN THE WRONG FACT, WHICH §1 ALSO PINS. It means «a W result
// has ever SCORED» – it reads `bestFinishByTier` and asks whether the tier's points table pays that
// finish more than zero – and a W15 first-round exit pays **$130 and zero points**. A trigger built
// on it would have refused her a share of the first cheque she ever earned, which is the opposite of
// «в первый раз на w серию приходит».
//
// ⚠ NOTHING FROM EIGHTEEN MOVED. The curve is continuous across her birthday (10% either side), the
// cap still lands at 26, and every figure the shipped surfaces quote from eighteen onward is the
// figure they quoted before. §3 is that claim.
//
// ⚠ NO SCHEMA MOVE, ZERO DRAWS: `kidFundsCents` is a v54 field and the ramp is integer arithmetic.
// `SAVE_SCHEMA_VERSION` stays 74; `tests/condition.test.ts` is green and unmodified.
//
// MUTATIONS, each applied alone to the engine, run, reverted. Control 9/9 green before and after,
// and 23/23 across this file and `round23-kid-share.test.ts` together – the pair is run as one,
// because the item's whole shape is «the new floor, and nothing above it moved».
// ⚠ THE COUNTS ARE READ OFF THE RUNS AND NOT PREDICTED:
//   N1 `kidPrizeShareBps` returning 0 below `fromAgeYears` again – the shipped rule
//                                             -> 12 red: 7 here (both §1 cheque arms, both §2 arms,
//                                                §3's walk, §4's note, §5's wire) and 5 in round 23.
//                                                ⚠ §1's catalogue arm stays GREEN, which is right:
//                                                «only the professional track pays» is a fact about
//                                                the tiers and not about the ramp.
//   N2 `ownAccountNote`'s balance clause deleted (the note back on the rate alone)
//                                             -> 3 red: §4's pair and §5's wire here, plus round
//                                                23's «silent before eighteen» arm. Nothing else
//                                                moves – a note is not a transfer.
//   N3 `kidPrizeShareBps` returning `capBps` below `fromAgeYears` (an absurd junior share)
//                                             -> 9 red, and the one that matters is §2's CONTINUITY
//                                                line: a junior floor at half the cheque is not a
//                                                floor under his ladder, it is a cliff over it.
import { describe, it, expect } from 'vitest'
import {
  closeTournament,
  createWorld,
  kidAgeYears,
  skipTournament,
  tickWeek,
  toSnapshot,
  type WorldState,
} from '../src/engine/world'
// ⚠ FROM THE LADDER'S OWN LEAF –  does not re-export it, and this file asks the
// question of the function the professional arm itself reads.
import { wtaEverCounted } from '../src/engine/world/ladder'
import { TIERS, W_SERIES, WEEKS_PER_YEAR } from '../src/engine/season/calendar'
import { ECONOMY, kidPrizeShareBps, kidPrizeShareCents } from '../src/engine/economy'
import { ownAccountNote, type KidLifeWorldView } from '../src/engine/kidLife'
import { rngFromSeed } from '../src/engine/rng'
import { DEFAULT_PROFILE } from '../src/shared/protocol'
import type { TierId } from '../src/engine/season/types'

const K = ECONOMY.kidShare
const ageOf = (w: WorldState): number => kidAgeYears(w.week, w.profile.birthMonth, w.profile.birthDay)

// =================================================================================================
// §1 – WHY THERE IS NO GATE: THE CATALOGUE IS THE GATE
// =================================================================================================
describe('§1 «from her first W-series start» is a fact about the catalogue', () => {
  it('⭐⭐⭐ prize money exists on the professional track and NOWHERE else', () => {
    const paying: TierId[] = []
    const silent: TierId[] = []
    for (const id of Object.keys(TIERS) as TierId[]) {
      const prize = (TIERS[id] as { prizeCents?: readonly number[] }).prizeCents
      const pays = Array.isArray(prize) && prize.some((c) => c > 0)
      ;(pays ? paying : silent).push(id)
    }
    // ⚠ EVERY paying tier is on the professional track...
    for (const id of paying) expect(TIERS[id].track, `${id} pays and must be professional`).toBe('wta')
    // ...and every professional tier pays, so the two sets are one set and the equivalence is exact
    // in both directions. A domestic rung that gained a prize table tomorrow reddens here, which is
    // exactly the day this item would need a real trigger.
    for (const id of silent) expect(TIERS[id].track, `${id} is silent and must not be professional`).not.toBe('wta')
    expect(paying.length, 'the paying set is not empty').toBeGreaterThan(0)
    expect(silent.length, 'and neither is the silent one').toBeGreaterThan(0)
  })

  it('⭐⭐⭐ `wtaEverCounted` is the WRONG fact – a W15 first-round exit pays money and no points', () => {
    // ⚠ THE CHEAPEST W RUNG, READ OFF THE CATALOGUE. The last index of a tier's tables is «lost in
    // her first match», and the two tables disagree about it: the points row is zero and the prize
    // row is not. That one cell is the whole argument against a `wtaEverCounted` trigger.
    const w15 = TIERS.w15 as unknown as { points: readonly number[]; prizeCents: readonly number[] }
    const last = w15.points.length - 1
    expect(w15.points[last], 'a first-round exit scores nothing').toBe(0)
    expect(w15.prizeCents[last], '...and is paid anyway').toBeGreaterThan(0)
    // ...so a career whose only W result is that exit has «never counted» while holding a cheque.
    const world = createWorld('r41-27-gate', { ...DEFAULT_PROFILE, coachTier: 'self' })
    world.bestFinishByTier.w15 = last
    expect(wtaEverCounted(world), 'the shipped predicate says she has never been there').toBe(false)
    // ⚠ AND THE SHARE IS PAID ANYWAY, which is the ruling. This is the arm that would go red if a
    // `wtaEverCounted` gate were ever put in front of the split.
    expect(kidPrizeShareCents(w15.prizeCents[last], 15), 'her tenth of the smallest cheque in the game')
      .toBe(Math.round((w15.prizeCents[last] * K.startBps) / 10_000))
  })

  it('⚠ every W-series rung is a rung she can be paid on, at any age the game can reach', () => {
    for (const tier of W_SERIES) {
      const prize = (TIERS[tier] as unknown as { prizeCents: readonly number[] }).prizeCents
      for (const age of [13, 15, 16, 17, 18, 26]) {
        const hers = kidPrizeShareCents(prize[0], age)
        expect(hers, `${tier} at ${age}`).toBeGreaterThan(0)
        expect(hers).toBeLessThanOrEqual(prize[0])
      }
    }
  })
})

// =================================================================================================
// §2 – THE RAMP: A FLAT TENTH BELOW EIGHTEEN
// =================================================================================================
describe('§2 the junior share – a flat tenth, and the curve is continuous', () => {
  it('⭐⭐⭐ every age below eighteen answers `startBps`, and eighteen answers the same', () => {
    for (let age = 10; age < K.fromAgeYears; age++) {
      expect(kidPrizeShareBps(age), `age ${age}`).toBe(K.startBps)
    }
    // ⚠ CONTINUITY IS THE PROPERTY, NOT THE VALUE – there is no step at her birthday, which is what
    // makes this a floor under the shipped ramp rather than a second ramp.
    expect(kidPrizeShareBps(K.fromAgeYears)).toBe(kidPrizeShareBps(K.fromAgeYears - 1))
    // ...and the ladder above it is untouched: +stepBps a birthday to the cap, reached at 26.
    for (let age = K.fromAgeYears; age <= 40; age++) {
      const expected = Math.min(K.capBps, K.startBps + (age - K.fromAgeYears) * K.stepBps)
      expect(kidPrizeShareBps(age), `age ${age}`).toBe(expected)
    }
    expect(kidPrizeShareBps(26)).toBe(K.capBps)
  })

  it('⭐⭐ a junior cheque splits to the cent, and the family keeps the remainder', () => {
    for (const prize of [130_00, 2_200_00, 14_500_00, 1, 7]) {
      for (const age of [13, 14, 15, 16, 17]) {
        const hers = kidPrizeShareCents(prize, age)
        expect(hers + (prize - hers), `age ${age} of ${prize}`).toBe(prize)
        expect(hers).toBe(Math.round((prize * K.startBps) / 10_000))
        expect(hers, 'and she is never handed the whole cheque').toBeLessThan(prize)
      }
    }
  })
})

// =================================================================================================
// §3 – A REAL CAREER: THE MONEY LANDS, AND IT LANDS OFF W-SERIES WEEKS ONLY
// =================================================================================================
describe('§3 a walked career – the account fills years before her eighteenth', () => {
  it('⭐⭐⭐ every cent she is paid before eighteen came off a professional cheque', () => {
    // A real ticked career that enters what it can afford – the shape `round23-kid-share.test.ts`
    // walks, kept short: the claim is about WHICH weeks pay her, not about how much.
    const world = createWorld('r41-27-walk', { ...DEFAULT_PROFILE, coachTier: 'middle' })
    const rng = rngFromSeed(world.seed)
    let paidWeeks = 0
    let hers = 0
    while (ageOf(world) < K.fromAgeYears && !world.ending) {
      world.fundsCents = Math.max(world.fundsCents, 200_000_00)
      const before = world.kidFundsCents ?? 0
      for (const e of world.season) {
        if (e.week > world.week && e.week <= world.week + 3 && world.week <= e.deadlineWeek && !world.entries.includes(e.id)) {
          world.entries.push(e.id)
          break
        }
      }
      tickWeek(world, rng)
      if (world.pendingTournament) {
        skipTournament(world)
        closeTournament(world)
      }
      const moved = (world.kidFundsCents ?? 0) - before
      if (moved <= 0) continue
      paidWeeks++
      hers += moved
      // ⚠ THE WEEK IS READ OFF THE LEDGER RATHER THAN OFF A PREDICATE – the `prize` row the till
      // booked for the family the same week, which only `finalizeTournament`'s `if (prize > 0)` can
      // write, and only a `wta` rung can reach.
      const prizeRow = world.events.find((e) => e.week === world.week && e.category === 'prize')
      expect(prizeRow, `w${world.week}: her account moved with no prize cheque behind it`).toBeDefined()
      expect(moved, `w${world.week}: her cut is the ramp's own tenth of the gross`).toBe(
        Math.round(((prizeRow!.amountCents! + moved) * K.startBps) / 10_000),
      )
    }
    // ⚠ THE ARM HAS TO CONTAIN THE THING IT IS PROVING. A career that never won a junior cheque
    // would pass every line above with the item reverted.
    expect(paidWeeks, 'she really was paid in the junior years').toBeGreaterThan(0)
    expect(hers, 'and it reached her own account').toBe(world.kidFundsCents)
    expect(ageOf(world)).toBe(K.fromAgeYears)
  })
})

// =================================================================================================
// §4 – HER PAGE: THE NOTE FOLLOWS THE ACCOUNT, NOT THE BIRTHDAY
// =================================================================================================
describe('§4 the note on her own page', () => {
  const view = (over: Partial<KidLifeWorldView>): KidLifeWorldView =>
    ({
      seed: 'r41-27-note',
      week: 100,
      ageYears: 16,
      seasonYear: 2032,
      playStyle: 'all-court',
      birthMonth: 6,
      injured: false,
      weeksAway: 0,
      lossStreak: 0,
      weeksSinceTitle: null,
      college: null,
      kidFundsCents: 0,
      ownsBrand: false,
      ...over,
    }) as KidLifeWorldView

  it('⭐⭐⭐ a junior with money in her account is told about it, and one without is not', () => {
    // ⚠⚠ THE GATE MOVED FROM HER AGE TO HER ACCOUNT, and this is the pair that pins it. Before this
    // item `ownAccountNote` returned '' whenever `kidPrizeShareBps` was zero, which was every age
    // below eighteen; the rate is never zero now, so a note left on that guard would have explained
    // the terms of an empty account to a ten-year-old.
    expect(ownAccountNote(view({ ageYears: 16, kidFundsCents: 0 })), 'nothing has reached her').toBe('')
    expect(ownAccountNote(view({ ageYears: 10, kidFundsCents: 0 })), 'and a child is not told either').toBe('')
    const paid = ownAccountNote(view({ ageYears: 16, kidFundsCents: 4_300_00 }))
    expect(paid, 'a junior who has been paid gets the sentence').not.toBe('')
    expect(paid).toContain('$4,300')
    expect(paid, 'and it states the rule at her own rate').toContain(`${K.startBps / 100}% of every prize cheque`)
  })

  it('⭐⭐ nothing an eighteen-year-old used to be told has been taken away', () => {
    // The regression guard: the note speaks from her eighteenth EVEN ON AN EMPTY ACCOUNT, exactly as
    // it always has, so no career loses a sentence it had before this item.
    const empty18 = ownAccountNote(view({ ageYears: 18, kidFundsCents: 0 }))
    expect(empty18, 'the eighteenth still speaks on its own').not.toBe('')
    expect(empty18).toContain('10% of every prize cheque')
    const at26 = ownAccountNote(view({ ageYears: 26, kidFundsCents: 100_00 }))
    expect(at26, 'and the cap still says it goes no higher').toContain('goes no higher')
  })
})

// =================================================================================================
// §5 – THE SNAPSHOT: THE SCREENS FOLLOW THE ENGINE WITHOUT A TEMPLATE EDIT
// =================================================================================================
describe('§5 the surfaces', () => {
  it('⭐⭐ a junior career that has been paid carries the sentence on the wire', () => {
    const world = createWorld('r41-27-snap', { ...DEFAULT_PROFILE, coachTier: 'self' })
    world.week = 2 * WEEKS_PER_YEAR
    expect(ageOf(world), 'the fixture is a junior').toBeLessThan(K.fromAgeYears)
    expect(toSnapshot(world).life.ownAccount, 'nothing yet, so nothing said').toBe('')
    world.kidFundsCents = 1_250_00
    const snap = toSnapshot(world)
    expect(snap.life.ownAccount, 'and the moment there is money, the wire carries it').toContain('$1,250')
    // ⚠ THE MONEY SCREEN'S STRIP NEEDS NO EDIT AND THIS IS WHY: its own gate falls through to this
    // string («which is exactly when `ownAccountNote` returns '' too», MoneyScreen.vue), so the
    // strip appears exactly when the engine has something to say. The mounted proof is in
    // `tests/component/round26-money-share.test.ts`.
    expect(snap.life.ownAccount.length).toBeGreaterThan(0)
  })
})
