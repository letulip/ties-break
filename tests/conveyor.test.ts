import { describe, it, expect, vi } from 'vitest'

// The career-level tests below tick five to ten seasons to reach the turnover they are about.
vi.setConfig({ testTimeout: 180_000 })

import { createWorld, tickWeek, enterEvent, skipTournament, closeTournament, type WorldState } from '../src/engine/world'
import { CONVEYOR, renewCohort, stayChance } from '../src/engine/season/conveyor'
import { generateCohort, power } from '../src/engine/season/cohort'
import { rngFromSeed } from '../src/engine/rng'
import { DEFAULT_PROFILE } from '../src/shared/protocol'
import type { AiPlayer } from '../src/engine/season/types'

function career(seed: string, weeks: number): WorldState {
  const world = createWorld(seed, { ...DEFAULT_PROFILE, background: 'wealthy', coachSetup: 'hired' })
  const rng = rngFromSeed(world.seed)
  for (let w = 0; w < weeks; w++) {
    for (const e of world.season) {
      if (e.week > world.week && !world.entries.includes(e.id)) {
        try {
          enterEvent(world, e.id)
        } catch {
          /* gated – fine */
        }
      }
    }
    tickWeek(world, rng)
    if (world.pendingTournament) {
      skipTournament(world)
      closeTournament(world)
    }
  }
  return world
}

const meanAge = (c: AiPlayer[]) => c.reduce((s, p) => s + p.ageYears, 0) / c.length

describe('who stays (pure)', () => {
  it('is kind to juniors, brutal at the crunch, and steady after it', () => {
    const mid = 0.5
    expect(stayChance(15, mid)).toBe(CONVEYOR.juniorStay)
    expect(stayChance(CONVEYOR.juniorEndAge, mid)).toBe(CONVEYOR.juniorStay)
    // The year the junior tour ends is the hardest year of a career, by a distance.
    expect(stayChance(CONVEYOR.juniorEndAge + 1, mid)).toBeLessThan(stayChance(CONVEYOR.juniorEndAge, mid))
    expect(stayChance(CONVEYOR.juniorEndAge + 1, mid)).toBeLessThan(stayChance(CONVEYOR.juniorEndAge + 2, mid))
  })

  it('reads her standing: the strong continue and the weak do not', () => {
    for (const age of [19, 22, 27]) {
      expect(stayChance(age, 1)).toBeGreaterThan(stayChance(age, 0.5))
      expect(stayChance(age, 0.5)).toBeGreaterThan(stayChance(age, 0))
    }
    // ...and being averagely good at nineteen is nearer to stopping than to a career.
    const lo = stayChance(19, 0)
    const midv = stayChance(19, 0.5)
    const hi = stayChance(19, 1)
    expect(midv - lo).toBeLessThan(hi - midv)
  })

  it('ends every career: the chance fades from `fadeFromAge` and is zero at `hardRetireAge`', () => {
    expect(stayChance(CONVEYOR.fadeFromAge - 1, 1)).toBeGreaterThan(stayChance(CONVEYOR.fadeFromAge, 1))
    for (let age = CONVEYOR.fadeFromAge; age < CONVEYOR.hardRetireAge; age++) {
      expect(stayChance(age + 1, 1)).toBeLessThan(stayChance(age, 1))
    }
    expect(stayChance(CONVEYOR.hardRetireAge, 1)).toBe(0)
    expect(stayChance(CONVEYOR.hardRetireAge + 5, 1)).toBe(0)
  })
})

describe('one season of turnover', () => {
  it('keeps the field exactly as big as it was, and fills every vacated place with a 13-year-old', () => {
    const cohort = generateCohort('conv-size')
    const before = cohort.length
    const { left, joined } = renewCohort(cohort, 'conv-size', 1)
    expect(cohort.length).toBe(before)
    expect(joined.length).toBe(left.length)
    expect(joined.every((p) => p.ageYears === 13)).toBe(true)
    expect(left.length).toBeGreaterThan(0)
  })

  it('never recycles an identity – a newcomer cannot inherit a departed player’s result rows', () => {
    // THE failure this guards: `world.results` is keyed by playerId and holds 52 weeks. Hand a
    // newcomer the id of the player she replaced and she inherits that player's ranking points,
    // her fatigue reconstruction and her place in the standings.
    const cohort = generateCohort('conv-ids')
    const seen = new Set(cohort.map((p) => p.id))
    for (let season = 1; season <= 10; season++) {
      for (const p of cohort) p.ageYears += 1
      const { joined } = renewCohort(cohort, 'conv-ids', season)
      for (const p of joined) {
        expect(seen.has(p.id), `id ${p.id} was reused`).toBe(false)
        seen.add(p.id)
      }
      // ...and the live field never holds the same id twice.
      expect(new Set(cohort.map((p) => p.id)).size).toBe(cohort.length)
    }
  })

  it('is deterministic in (seed, season, field)', () => {
    const a = generateCohort('conv-det')
    const b = generateCohort('conv-det')
    renewCohort(a, 'conv-det', 3)
    renewCohort(b, 'conv-det', 3)
    expect(a).toEqual(b)
    // ...and a different season is a different draw.
    const c = generateCohort('conv-det')
    renewCohort(c, 'conv-det', 4)
    expect(c.map((p) => p.id)).not.toEqual(a.map((p) => p.id))
  })

  it('takes the weak and leaves the strong', () => {
    // Over many seasons of an age-19 field, the ones who continue are the better ones. Run it on a
    // synthetic field held at the crunch age so the effect is the crunch and nothing else.
    let kept = 0
    let kd = 0
    let ld = 0
    let lost = 0
    for (let season = 1; season <= 12; season++) {
      const cohort = generateCohort(`conv-merit-${season}`)
      for (const p of cohort) p.ageYears = CONVEYOR.juniorEndAge + 1
      const { left } = renewCohort(cohort, `conv-merit-${season}`, season)
      const leftIds = new Set(left.map((p) => p.id))
      for (const p of cohort) {
        if (p.ageYears !== CONVEYOR.juniorEndAge + 1) continue // a newcomer, not a survivor
        kept += 1
        kd += power(p)
      }
      for (const p of left) {
        lost += 1
        ld += power(p)
      }
      expect(leftIds.size).toBe(left.length)
    }
    expect(lost).toBeGreaterThan(0)
    expect(kd / kept).toBeGreaterThan(ld / lost)
  })
})

describe('the field over a career', () => {
  it('renews: the girls she came up with are mostly gone, and the size never moves', () => {
    const world = career('conv-life', 312) // six seasons, to her twentieth year
    expect(world.cohort.length).toBe(199)
    const original = world.cohort.filter((p) => /^ai-\d+$/.test(p.id)).length
    expect(original).toBeLessThan(140)
    expect(world.cohort.some((p) => /^ai-s\d+-\d+$/.test(p.id))).toBe(true)
    // Every id in the live field is unique, however many intakes have passed through it.
    expect(new Set(world.cohort.map((p) => p.id)).size).toBe(199)
  })

  it('stops the field ageing with her – the reason the conveyor exists', () => {
    // Before it, every rival aged exactly as she did: mean rival age walked 16 -> 26 over ten
    // seasons and kept going. With an intake underneath her it settles instead.
    const world = career('conv-age', 312)
    const age = meanAge(world.cohort)
    expect(age).toBeGreaterThan(16) // it does age – the field is not frozen either
    expect(age).toBeLessThan(20.5) // ...but nothing like the +6 of a cohort that only gets older
    expect(world.cohort.filter((p) => p.ageYears <= 18).length).toBeGreaterThan(60)
    expect(world.cohort.filter((p) => p.ageYears >= 19).length).toBeGreaterThan(60)
    expect(world.cohort.every((p) => p.ageYears < CONVEYOR.hardRetireAge)).toBe(true)
  })

  it('tells the player at the boundary, and names somebody they had heard of when it can', () => {
    // NB only the most recent intake notes survive: they are ordinary news, not milestones, so
    // `pruneEvents` takes them like anything else once the feed fills. What is asserted is their
    // SHAPE and their timing, over three careers so the optional clause is reached.
    const all = ['conv-news-1', 'conv-news-2', 'conv-news-3']
      .map((seed) => career(seed, 156))
      .flatMap((w) => w.events.filter((e) => e.text.startsWith('A new intake:')))
    expect(all.length).toBeGreaterThan(0)
    for (const e of all) {
      expect(e.type).toBe('info')
      expect(e.text).toMatch(/^A new intake: \d+ players have left the tour and \d+ thirteen-year-olds have taken their places\./)
      // one per season boundary, and never mid-season
      expect(e.week % 52).toBe(0)
    }
    expect(all.some((e) => /\(#\d+\) is among those who stopped\.$/.test(e.text))).toBe(true)
  })
})
