// ⭐⭐ ROUND-24 – THE TEAM'S SHARE OF THE PRIZE MONEY (docs/plans/the-team-share.md, re-ruled 22.08).
//
// THE OWNER, verbatim where it matters:
//   «3млн призовые из них отчисляется процент дочери (скажем 30 для примера) и тренеру (скажем 10
//    для примера) – это будет 900к дочери и 300к тренеру плюс остальные расходы»
//   «тренер может не ездить, но долю получать наверное за победы или 2е места вполне может.
//    За 2е только по-меньше»
//   ...and the masseur, the same day: «мне всё-таки кажется, что массажисту тоже можно за призовые
//    месте давать бонус, может по-меньше чем тренеру, но давать, давай тоже сделаем»
//
// WHAT THIS FILE PINS, in the order the mechanic can fail:
//   1. THE RATES – title 10% / final 5% (coach), 3% / 1.5% (masseur), below a final NOTHING – as
//      LITERALS (the round23-kid-share discipline: a ladder checked against the object under test
//      is a tautology), through the ONE mechanism both takers share.
//   2. ⭐ HIS OWN 3M EXAMPLE, reproduced to the cent – 900к дочери, 300к тренеру.
//   3. ROUNDING – every share rounds ONCE, the family keeps the remainder, the pieces re-add.
//   4. THE FINALIZE WIRING – gross, the expense rows in the seats' own categories, funds moved by
//      exactly the arithmetic, careerTotals absorbing the rows through addEvent's one choke point.
//   5. THE GATES – no coach = no coach share; no masseur = no masseur share; below a final nothing;
//      the kid's ramp untouched beside them; independent of every travel switch by construction
//      (the fixtures never flip one).
//
// ⚠ RNG: pure arithmetic at finalize on a decided cheque – zero draws on any stream; the frozen
// MAIN capture (41550 / e6b0c709) in tests/condition.test.ts is the cross-file witness.
import { describe, it, expect } from 'vitest'
import {
  createWorld,
  hireMasseur,
  openingCoachId,
  skipTournament,
  closeTournament,
  tickWeek,
  KID_ID,
  type WorldState,
} from '../src/engine/world'
import { ECONOMY, kidPrizeShareCents, staffPrizeShareCents, staffResultShareBps } from '../src/engine/economy'
import { TIERS } from '../src/engine/season/calendar'
import { rngFromSeed } from '../src/engine/rng'
import { DEFAULT_PROFILE } from '../src/shared/protocol'
import type { SeasonEvent } from '../src/engine/season/types'

// =================================================================================================
// 1 – THE RATES, THROUGH THE ONE MECHANISM
// =================================================================================================
describe('the rates – one mechanism, two takers, his numbers', () => {
  it('⭐ coach: title 10%, final 5% («за 2е только по-меньше» – half), below a final NOTHING', () => {
    expect(staffResultShareBps('coach', 0)).toBe(1000)
    expect(staffResultShareBps('coach', 1)).toBe(500)
    for (const finish of [2, 3, 4, 5, 6, 7]) expect(staffResultShareBps('coach', finish), `finish ${finish}`).toBe(0)
  })

  it('⭐ masseur: title 3%, final 1.5% – «по-меньше чем тренеру», roughly a third at both rungs', () => {
    expect(staffResultShareBps('masseur', 0)).toBe(300)
    expect(staffResultShareBps('masseur', 1)).toBe(150)
    for (const finish of [2, 3, 4, 5]) expect(staffResultShareBps('masseur', finish), `finish ${finish}`).toBe(0)
    // The sizing relation itself, so a retune that inverts it has to come here and be looked at.
    expect(staffResultShareBps('masseur', 0)).toBeLessThan(staffResultShareBps('coach', 1))
  })

  it('the rates are the object, not the code – a retune moves the function without an edit', () => {
    const saved = ECONOMY.staffShare.coach.titleBps
    Object.assign(ECONOMY.staffShare.coach, { titleBps: 1500 })
    try {
      expect(staffResultShareBps('coach', 0)).toBe(1500)
      expect(staffPrizeShareCents('coach', 1_000_00, 0)).toBe(150_00)
    } finally {
      Object.assign(ECONOMY.staffShare.coach, { titleBps: saved })
    }
  })
})

// =================================================================================================
// 2 – ⭐ HIS OWN WORKED EXAMPLE, TO THE CENT
// =================================================================================================
describe('the 3M example – «это будет 900к дочери и 300к тренеру плюс остальные расходы»', () => {
  const PRIZE = 3_000_000_00

  it('⭐⭐ at the age-22 rung (30%) with a coach: 900k hers, 300k the coach`s, 1.8M the family`s', () => {
    const hers = kidPrizeShareCents(PRIZE, 22) // his «скажем 30 для примера» is the shipped age-22 rung
    const coach = staffPrizeShareCents('coach', PRIZE, 0) // his «скажем 10 для примера» is the title rate
    expect(hers).toBe(900_000_00)
    expect(coach).toBe(300_000_00)
    expect(PRIZE - hers - coach, 'the family`s remainder – «плюс остальные расходы» come off this').toBe(1_800_000_00)
  })

  it('...and with the masseur on the payroll his slice is 90k – a third of the coach`s, off the same gross', () => {
    const masseur = staffPrizeShareCents('masseur', PRIZE, 0)
    expect(masseur).toBe(90_000_00)
    expect(PRIZE - kidPrizeShareCents(PRIZE, 22) - staffPrizeShareCents('coach', PRIZE, 0) - masseur).toBe(1_710_000_00)
  })

  it('the final pays half the title, on the same example: 150k coach, 45k masseur', () => {
    expect(staffPrizeShareCents('coach', PRIZE, 1)).toBe(150_000_00)
    expect(staffPrizeShareCents('masseur', PRIZE, 1)).toBe(45_000_00)
  })
})

// =================================================================================================
// 3 – ROUNDING: EVERY SHARE ONCE, THE FAMILY KEEPS THE REMAINDER
// =================================================================================================
describe('rounding – four hands on one cheque and no cent lost or invented', () => {
  it('for awkward cheques the pieces re-add to the prize exactly', () => {
    for (const prize of [130_00, 2_200_00, 55_555_55, 3_000_000_00, 1, 7, 999_99]) {
      for (const finish of [0, 1, 2]) {
        const hers = kidPrizeShareCents(prize, 22)
        const coach = staffPrizeShareCents('coach', prize, finish)
        const masseur = staffPrizeShareCents('masseur', prize, finish)
        const family = prize - hers - coach - masseur
        expect(hers + coach + masseur + family, `prize ${prize} finish ${finish}`).toBe(prize)
        expect(coach).toBeGreaterThanOrEqual(0)
        expect(masseur).toBeGreaterThanOrEqual(0)
        expect(family).toBeGreaterThanOrEqual(0)
      }
    }
  })
})

// =================================================================================================
// 4/5 – THE FINALIZE WIRING, ON A DRIVEN WEEK
// =================================================================================================

/** The condition.test seed trick: a private injury sub-stream that cannot fire before `through`,
 *  so a random layoff cannot turn the driven play week into a walkover. */
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

/** A career ticked INTO a W15 play week (id-targeted event, calendar cleared), reveal spawned,
 *  and the FINISH SET BY THE TEST – `finishes[KID_ID]` is exactly what `finalizeTournament` reads,
 *  so forcing a title asks the real function the real question without gambling on a 13-year-old
 *  beating a professional draw. */
function drivenFinish(prefix: string, finish: number, staff: { coach?: boolean; masseur?: boolean }) {
  const world = createWorld(injuryProofSeed(prefix, 6), DEFAULT_PROFILE)
  world.bestFinishByTier.w15 = 0 // the pro ladder – the masseur hire is legal, the track is wta
  if (staff.coach) world.coachId = openingCoachId(world.seed, { ...world.profile, coachTier: 'middle' })
  else world.coachId = null
  if (staff.masseur) hireMasseur(world, true)
  world.physioActive = false
  world.season = []
  const event: SeasonEvent = {
    id: `share-${prefix}`,
    week: 5,
    tier: 'w15',
    surface: 'hard',
    travelCostCents: 500_00,
    deadlineWeek: 3,
  }
  world.season.push(event)
  world.entries.push(event.id)
  const rng = rngFromSeed(world.seed)
  while (world.week < event.week) tickWeek(world, rng)
  expect(world.pendingTournament, 'the reveal spawned').not.toBeNull()
  world.pendingTournament!.result.finishes[KID_ID] = finish
  return { world, event }
}

const shareRows = (world: WorldState, who: 'Coach' | 'Masseur') =>
  world.events.filter((e) => e.week === world.week && e.text.startsWith(`${who}'s share of the prize money`))

describe('the finalize wiring – gross, expense rows, the exact funds arithmetic', () => {
  it('⭐⭐ a coached W title pays the coach 10% of the GROSS cheque as a coaching expense row', () => {
    const { world } = drivenFinish('coach-title', 0, { coach: true })
    expect(world.coachId).not.toBeNull()
    const prize = TIERS.w15.prizeCents![0]
    const before = world.fundsCents
    const spentBefore = world.careerTotals.spentCents
    skipTournament(world)
    const rows = shareRows(world, 'Coach')
    expect(rows).toHaveLength(1)
    expect(rows[0].category, 'the wrap`s coaching line absorbs it through addEvent – no second tally').toBe('coaching')
    expect(rows[0].amountCents).toBe(-staffPrizeShareCents('coach', prize, 0))
    expect(rows[0].text).toBe(`Coach's share of the prize money – 10% of the ${TIERS.w15.label} cheque`)
    // The funds moved by exactly familyShare − coachShare: she is 13, so her ramp is 0 and the
    // family banked the whole cheque before the coach's slice came off it.
    expect(world.fundsCents - before).toBe(prize - staffPrizeShareCents('coach', prize, 0))
    expect(world.careerTotals.spentCents - spentBefore, 'the album`s denominator counts it as spend').toBe(
      staffPrizeShareCents('coach', prize, 0),
    )
    closeTournament(world)
  })

  it('⭐ the masseur`s slice lands beside it, under his own staff bucket, off the same gross', () => {
    const { world } = drivenFinish('both-title', 0, { coach: true, masseur: true })
    const prize = TIERS.w15.prizeCents![0]
    const before = world.fundsCents
    skipTournament(world)
    const masseurRows = shareRows(world, 'Masseur')
    expect(masseurRows).toHaveLength(1)
    expect(masseurRows[0].category).toBe('staff')
    expect(masseurRows[0].amountCents).toBe(-staffPrizeShareCents('masseur', prize, 0))
    expect(masseurRows[0].text).toBe(`Masseur's share of the prize money – 3% of the ${TIERS.w15.label} cheque`)
    expect(shareRows(world, 'Coach')).toHaveLength(1)
    expect(world.fundsCents - before).toBe(
      prize - staffPrizeShareCents('coach', prize, 0) - staffPrizeShareCents('masseur', prize, 0),
    )
    closeTournament(world)
  })

  it('a FINAL pays the half rates – 5% and 1.5%, the same rows', () => {
    const { world } = drivenFinish('both-final', 1, { coach: true, masseur: true })
    const prize = TIERS.w15.prizeCents![1]
    skipTournament(world)
    expect(shareRows(world, 'Coach')[0].amountCents).toBe(-staffPrizeShareCents('coach', prize, 1))
    expect(shareRows(world, 'Coach')[0].text).toContain('5% of the')
    expect(shareRows(world, 'Masseur')[0].amountCents).toBe(-staffPrizeShareCents('masseur', prize, 1))
    expect(shareRows(world, 'Masseur')[0].text).toContain('1.5% of the')
    closeTournament(world)
  })

  it('⭐ below a final NOTHING – «за победы или 2е места», not every cheque', () => {
    const { world } = drivenFinish('both-sf', 2, { coach: true, masseur: true })
    const prize = TIERS.w15.prizeCents![2]
    expect(prize, 'the semifinal cheque exists – there really was something to not share').toBeGreaterThan(0)
    const before = world.fundsCents
    skipTournament(world)
    expect(shareRows(world, 'Coach')).toHaveLength(0)
    expect(shareRows(world, 'Masseur')).toHaveLength(0)
    expect(world.fundsCents - before, 'the family banks the whole cheque').toBe(prize)
    closeTournament(world)
  })

  it('⭐ empty seats owe nothing: a self-coached family with no masseur pays no share on a title', () => {
    const { world } = drivenFinish('self-title', 0, {})
    expect(world.coachId).toBeNull()
    expect(world.masseurHired).toBe(false)
    const prize = TIERS.w15.prizeCents![0]
    const before = world.fundsCents
    skipTournament(world)
    expect(shareRows(world, 'Coach')).toHaveLength(0)
    expect(shareRows(world, 'Masseur')).toHaveLength(0)
    expect(world.fundsCents - before).toBe(prize)
    closeTournament(world)
  })

  it('⭐ OFF THE GROSS beside her ramp: with the kid`s share flowing, the coach still takes 10% of the FULL cheque', () => {
    // The house idiom for an arm: ECONOMY patched in place, restored in a finally. Pulling her
    // threshold down to the fixture`s age is what makes "gross, not net" a falsifiable claim here –
    // a share computed off the family`s part would come back 10% of 90%.
    const saved = ECONOMY.kidShare.fromAgeYears
    Object.assign(ECONOMY.kidShare, { fromAgeYears: 13 })
    try {
      const { world } = drivenFinish('gross-title', 0, { coach: true })
      const prize = TIERS.w15.prizeCents![0]
      const hers = kidPrizeShareCents(prize, 13)
      expect(hers, 'her ramp really is flowing in this arm').toBeGreaterThan(0)
      const before = world.fundsCents
      const kidBefore = world.kidFundsCents ?? 0
      skipTournament(world)
      expect(shareRows(world, 'Coach')[0].amountCents, 'ten percent of the cheque, not of the remainder').toBe(
        -staffPrizeShareCents('coach', prize, 0),
      )
      // ...and the four pieces re-add to the tournament`s cheque to the cent.
      const familyDelta = world.fundsCents - before
      const kidDelta = (world.kidFundsCents ?? 0) - kidBefore
      expect(familyDelta + kidDelta + staffPrizeShareCents('coach', prize, 0)).toBe(prize)
      expect(kidDelta, 'her ramp is untouched beside the team`s shares').toBe(hers)
      closeTournament(world)
    } finally {
      Object.assign(ECONOMY.kidShare, { fromAgeYears: saved })
    }
  })

  it('house law on both share rows: no Cyrillic, short dash only, no pronoun for either hire', () => {
    const { world } = drivenFinish('law-title', 0, { coach: true, masseur: true })
    skipTournament(world)
    for (const row of [...shareRows(world, 'Coach'), ...shareRows(world, 'Masseur')]) {
      expect(row.text).not.toMatch(/[Ѐ-ӿ]/)
      expect(row.text).not.toMatch(/—/)
      expect(row.text).not.toMatch(/\bhe\b|\bhis\b|\bhim\b|\bshe\b|\bher\b/i)
    }
    closeTournament(world)
  })
})
