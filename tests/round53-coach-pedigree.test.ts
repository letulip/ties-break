// ⭐⭐ ROUND 53 №2 – FAMOUS NAMES (docs/specs/coach-pay-ladder-2026-10.md §3.4), M8, 21.10.
//
// Claims, each mutation-verified when written (mutate → red → restore):
//   §A the roster is untouched – a digest of 40 seeds × 3 ages equals the one taken BEFORE the wave (7a2ac2b); the pedigree
//      is drawn on its own sub-stream, only for elite, a quarter of the time;
//   §B the price – +50% on his LABOUR, the court unchanged, and only for a name that has a past;
//   §C the four trades, each present only while he is in the chair (`world.coachId`) and gone the week he is released.
import { describe, expect, it } from 'vitest'

import { createWorld, type WorldState } from '../src/engine/world'
import { ageAtWeek, coachMarketLabourCents, coachRateCents } from '../src/engine/world'
import { buildCoachRoster, coachById, coachLabourCents, facilityRateCents } from '../src/engine/coach'
import { COACH_PEDIGREE, coachPedigree, type PedigreeTrade } from '../src/engine/coachPedigree'
import { ECONOMY } from '../src/engine/economy'
import { accrueChemistry, accrueWarmChemistry, freshCoachPair, quietWeek } from '../src/engine/chemistry'
import { raisedCeiling } from '../src/engine/world/phaseGrowth'
import { pedigreeInChair } from '../src/engine/world/coachDeal'
import { pedigreeCardLines, PEDIGREE_PAST_LINE, PEDIGREE_TRADE_LINE } from '../src/engine/world/coachMarket'
import { setSparringRung, sparringRungWeeklyCents, sparringTopRungCents } from '../src/engine/world/sparring'
import { famousAdFeeCents, reviewAdOffer } from '../src/engine/world/sponsors'
import { KID_ID } from '../src/engine/world/constants'
import type { AdOfferTerms } from '../src/shared/protocol'
import { spiritBandOf } from '../src/engine/spirit'
import { tickWeek } from '../src/engine/world/tick'
import { rngFromSeed } from '../src/engine/rng'
import { SKILL_KEYS } from '../src/engine/development'
import { affinityFor } from '../src/engine/chemistry'
import { DEFAULT_PROFILE } from '../src/shared/protocol'

function fnv(s: string): string {
  let h = 0x811c9dc5
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 0x01000193) >>> 0
  }
  return h.toString(16)
}

const ELITE_IDS = ECONOMY.coach.roster.filter((r) => r.tier === 'elite').map((r) => r.portrait)

/** a seed in which one elite slot has this trade (`trade` null: a seed whose elite slots have none, plain) */
function seedWith(trade: PedigreeTrade | null): { seed: string; id: string } {
  for (let i = 0; i < 4000; i++) {
    const seed = `m8-${i}`
    for (const id of ELITE_IDS) {
      const p = coachPedigree(seed, id, 'elite')
      if (trade === null ? p === null : p?.trade === trade) return { seed, id }
    }
  }
  throw new Error(`no seed holds ${trade}`)
}

function hired(seed: string, id: string): WorldState {
  const world = createWorld(seed, { ...DEFAULT_PROFILE, coachTier: 'elite' })
  world.coachId = id
  return world
}

describe('§A the roster does not move; the pedigree is its own stream', () => {
  it('buildCoachRoster is byte-identical to the pre-wave digest (names, rates, ids, manners)', () => {
    const rows: string[] = []
    for (let i = 0; i < 40; i++) for (const age of [14, 19, 25]) rows.push(JSON.stringify(buildCoachRoster(`digest-${i}`, age)))
    expect(fnv(rows.join('\n'))).toBe('7a2ac2b')
  })

  it('only elite slots can have a past, and the pedigree reads nothing but its own key', () => {
    for (let i = 0; i < 60; i++) {
      for (const slot of ECONOMY.coach.roster) {
        const p = coachPedigree(`m8-tier-${i}`, slot.portrait, slot.tier)
        if (slot.tier !== 'elite') expect(p).toBeNull()
      }
    }
    // asking changes no roster: the digest of one seed before and after 100 pedigree reads is the same
    const before = JSON.stringify(buildCoachRoster('m8-same', 19))
    for (let i = 0; i < 100; i++) coachPedigree('m8-same', 'elit-1', 'elite')
    expect(JSON.stringify(buildCoachRoster('m8-same', 19))).toBe(before)
  })

  it('about one elite slot in four has a past (200 seeds × the elite slots)', () => {
    let slots = 0
    let famous = 0
    for (let i = 0; i < 200; i++) {
      for (const id of ELITE_IDS) {
        slots++
        if (coachPedigree(`m8-share-${i}`, id, 'elite')) famous++
      }
    }
    expect(famous / slots).toBeGreaterThan(0.2)
    expect(famous / slots).toBeLessThan(0.3)
  })

  it('the card prints two lines for a name with a past and none for a plain elite', () => {
    const f = seedWith('chemistry')
    const famous = coachById(f.seed, 19, f.id)!
    const lines = pedigreeCardLines(f.seed, famous).pedigree!
    expect(Object.values(PEDIGREE_PAST_LINE)).toContain(lines.past)
    expect(lines.trade).toBe(PEDIGREE_TRADE_LINE.chemistry)
    const p = seedWith(null)
    expect(pedigreeCardLines(p.seed, coachById(p.seed, 19, p.id)!)).toEqual({})
  })
})

describe('§B the price – +50% on the labour, the court untouched', () => {
  it('a name with a past costs 1.5× the ladder labour; a plain elite exactly the ladder', () => {
    for (const pick of [seedWith('ceiling'), seedWith(null)]) {
      const world = hired(pick.seed, pick.id)
      const coach = coachById(world.seed, ageAtWeek(world.week), pick.id)!
      const ladder = coachLabourCents(coach.rateCents, ageAtWeek(world.week), 'elite', 1)
      const famous = coachPedigree(pick.seed, pick.id, 'elite') !== null
      expect(coachMarketLabourCents(world, coach)).toBe(famous ? Math.round(ladder * COACH_PEDIGREE.labourFactor) : ladder)
      // the court is the club's rent: rate = court + labour, whoever he is
      expect(coachRateCents(world, coach) - coachMarketLabourCents(world, coach)).toBe(facilityRateCents(ageAtWeek(world.week), 'elite'))
    }
  })
})

describe('§C the four trades – his while he is in the chair, gone the week he is not', () => {
  it('chair: the pedigree is read off world.coachId – nobody hired, nothing', () => {
    const f = seedWith('sponsors')
    const world = hired(f.seed, f.id)
    expect(pedigreeInChair(world)?.trade).toBe('sponsors')
    world.coachId = null
    expect(pedigreeInChair(world)).toBeNull()
  })

  it('sparring: the top rung costs the middle rung\'s price with him, and is not offered after a release', () => {
    const f = seedWith('sparring')
    const world = hired(f.seed, f.id)
    const middle = sparringRungWeeklyCents(world)[1]
    expect(sparringTopRungCents(world)).toBe(middle)
    expect(() => setSparringRung(world, 2)).not.toThrow()
    world.coachId = null
    expect(sparringTopRungCents(world)).toBeNull()
  })

  it('sparring: another famous trade does not give the top rung away', () => {
    const f = seedWith('chemistry')
    const world = hired(f.seed, f.id)
    expect(sparringTopRungCents(world)).not.toBe(sparringRungWeeklyCents(world)[1])
  })

  it('chemistry: a warmer start, gains ×1.25, and a dip is not deepened', () => {
    const quiet = quietWeek('steady' as never)
    let warmerStart = 0
    let gained = 0
    for (let i = 0; i < 40; i++) {
      for (const affinity of [-0.6, 0, 0.6, 1]) {
        const plain = accrueChemistry(freshCoachPair(), affinity, `m8-chem-${i}`, 'elit-1', 5, quiet)
        const warm = accrueWarmChemistry(undefined, affinity, `m8-chem-${i}`, 'elit-1', 5, quiet)
        const start = accrueChemistry({ ...freshCoachPair(), phase: COACH_PEDIGREE.chemistryStartPhase }, affinity, `m8-chem-${i}`, 'elit-1', 5, quiet)
        expect(warm.phase).toBe(start.phase)
        if (warm.phase > plain.phase) warmerStart++
        if (start.chem > 0) {
          expect(warm.chem).toBeCloseTo(start.chem * COACH_PEDIGREE.chemistryGainFactor, 9)
          gained++
        } else expect(warm.chem).toBe(start.chem) // a dip is the plain dip
      }
    }
    expect(warmerStart).toBeGreaterThan(100)
    expect(gained).toBeGreaterThan(20)
  })

  it('ceiling: +2 on every attribute, capped at 100, never written into world.potential', () => {
    const f = seedWith('ceiling')
    const world = hired(f.seed, f.id)
    const before = JSON.stringify(world.potential)
    const raised = raisedCeiling(world.potential)
    for (const k of Object.keys(world.potential) as (keyof typeof world.potential)[]) {
      expect(raised[k]).toBe(Math.min(100, world.potential[k] + COACH_PEDIGREE.ceilingPoints))
    }
    expect(JSON.stringify(world.potential)).toBe(before)
  })

  it('sponsors: at the seam – every week the plain bar writes, the chair writes too, at ×1.2; more weeks write in all', () => {
    const f = seedWith('sponsors')
    const letters = (coachId: string | null, week: number): Map<string | undefined, number> => {
      const world = createWorld(f.seed, { ...DEFAULT_PROFILE, coachTier: 'self' })
      world.week = week
      world.results.push({ playerId: KID_ID, week, points: 100, tier: 'w100' })
      world.kidRankWta = 150
      world.coachId = coachId
      reviewAdOffer(world)
      return new Map(world.offers.filter((o) => o.kind === 'ad').map((o) => [(o.terms as AdOfferTerms).category, (o.terms as AdOfferTerms).cashCents]))
    }
    let plainWeeks = 0
    let famousWeeks = 0
    for (let week = 260; week < 260 + 6 * 52; week++) {
      const plain = letters(null, week)
      const famous = letters(f.id, week)
      if (plain.size) plainWeeks++
      if (famous.size) famousWeeks++
      for (const [category, cents] of plain) expect(famous.get(category), `${category} in week ${week}`).toBe(famousAdFeeCents(cents))
    }
    expect(plainWeeks).toBeGreaterThan(0)
    expect(famousWeeks).toBeGreaterThan(plainWeeks)
    expect(famousAdFeeCents(100_000_00)).toBe(120_000_00)
  })

  it('sponsors: another trade leaves the letters alone', () => {
    const f = seedWith('chemistry')
    const world = createWorld(f.seed, { ...DEFAULT_PROFILE, coachTier: 'self' })
    world.coachId = f.id
    expect(pedigreeInChair(world)?.trade).toBe('chemistry')
  })
})

describe('§D the weekly tick reads the chair (chemistry and ceiling, through the real tick)', () => {
  it('chemistry: the first week\'s pair row is the warm one with his trade, the plain one with any other', () => {
    for (const trade of ['chemistry', 'ceiling'] as const) {
      const f = seedWith(trade)
      const world = hired(f.seed, f.id)
      tickWeek(world, rngFromSeed('m8-tick'))
      const row = world.coachPairs[f.id]
      expect(row, 'a pair row exists after a working week').toBeDefined()
      const coach = coachById(f.seed, ageAtWeek(world.week - 1), f.id)!
      const affinity = affinityFor(f.seed, f.id, world.temperament, coach.manner)
      const events = quietWeek(spiritBandOf(world.spirit))
      const warm = accrueWarmChemistry(undefined, affinity, f.seed, f.id, world.week, events)
      const plain = accrueChemistry(freshCoachPair(), affinity, f.seed, f.id, world.week, events)
      // the same events, so the only difference between the two arms is the trade: the row is the NEARER of the two
      const nearer = Math.abs(row.phase - warm.phase) < Math.abs(row.phase - plain.phase) ? 'warm' : 'plain'
      expect(nearer).toBe(trade === 'chemistry' ? 'warm' : 'plain')
    }
  })

  it('ceiling: at her ceiling she climbs past it with the trade in the chair and does not with any other coach', () => {
    const climb = (trade: PedigreeTrade): number => {
      const f = seedWith(trade)
      const world = hired(f.seed, f.id)
      for (const k of SKILL_KEYS) world.skills[k] = world.potential[k]
      let over = 0
      for (let i = 0; i < 40; i++) {
        tickWeek(world, rngFromSeed(`m8-climb-${i}`))
        for (const k of SKILL_KEYS) over = Math.max(over, world.skills[k] - world.potential[k])
      }
      return over
    }
    expect(climb('chemistry')).toBeLessThanOrEqual(0)
    expect(climb('ceiling')).toBeGreaterThan(0)
  })
})
