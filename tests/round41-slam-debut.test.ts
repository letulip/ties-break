// ⭐⭐⭐ ROUND 41 #18 PART TWO – THE SLAM MAIN-DRAW DEBUT IS A FACT THE CAREER KEEPS, AND IT IS FAME.
//
// THE OWNER, 12.09: «да, делаем fame за основу Шлема, надо полностью с математикой бренда
// разобраться… У тебя вся история супер-звезды есть… Федерер выиграл Шлем в 19, она тоже.» And the
// hole he was pointing at, from his own save: «У нее был вайлдкард на Шлем, когда она была #155» –
// a week that left NO trace in fame, because the floor could see only the champion and the
// runner-up of a 128-draw.
//
// What this file pins is the MECHANISM, in five sections, and deliberately not the tuning: `4` is
// calibration and docs/specs/the-fame-and-the-brand-2026-09.md §3.3 is where the frontier
// (+4 vs +5) is argued. A test that asserted the number would go red on the next honest retune and
// would teach nothing – the same rule tests/r38-fame-presence.test.ts states for its own rungs.
//
// ⚠ THE FORCED ENTRY IS NOT A CLAIM ABOUT THE DOOR. §1 pushes the event id straight onto
// `world.entries`, which bypasses `enterEvent`'s eligibility exactly as tests/condition.test.ts and
// tests/age-caps.test.ts do – the acceptance ladder is pinned in its own files and this one is about
// what `finalizeTournament` records once she is IN the draw. A real 128-draw costs ~16 ms.
//
// MUTATIONS, read off the run and recorded rather than claimed:
//   * the debut term deleted from `fameFloorOf`              -> 6 red
//   * `fireMilestone` at the fire site made unconditional    -> 2 red (the negative arm and §1's date)
//   * the debut week removed from `fameEventWeeks`           -> 1 red
//   * `keep: true` dropped from `fireMilestone`              -> 2 red (§3 and §1's keep assertion)
import { describe, expect, it } from 'vitest'
import { ECONOMY } from '../src/engine/economy'
import { rngFromSeed, type Rng } from '../src/engine/rng'
import {
  createWorld,
  tickWeek,
  skipTournament,
  closeTournament,
  fameFloorOf,
  fameEventWeeks,
  slamDebutWeekOf,
  SLAM_DEBUT_KEY,
  type WorldState,
} from '../src/engine/world'
import { decayAt, seasonFloorDecayAt } from '../src/engine/world/fame'
import { housekeep } from '../src/engine/world/bookkeeping'
import { EVENTS_CAP } from '../src/engine/world/constants'
import type { SeasonEvent, TierId } from '../src/engine/season/types'

/** A career four weeks old, with one event of `tier` played to the end in week 5. The draw is the
 *  REAL one – `tickWeek` runs the bracket and `skipTournament`/`closeTournament` are the same two
 *  calls the reveal UI makes. */
function careerThatPlays(seed: string, tiers: TierId[], pre?: (w: WorldState) => void): { world: WorldState; draws: number } {
  const world = createWorld(seed)
  const raw = rngFromSeed(world.seed)
  let draws = 0
  const rng: Rng = () => {
    draws++
    return raw()
  }
  for (let i = 0; i < 4; i++) tickWeek(world, rng)
  pre?.(world)
  draws = 0
  for (const [i, tier] of tiers.entries()) {
    const e: SeasonEvent = {
      id: `forced-${i}-${tier}`,
      week: world.week + 1,
      tier,
      surface: 'hard',
      travelCostCents: 100_00,
      deadlineWeek: world.week,
    }
    world.season.push(e)
    world.season.sort((a, b) => a.week - b.week)
    world.entries.push(e.id)
    tickWeek(world, rng)
    if (world.pendingTournament) {
      skipTournament(world)
      closeTournament(world)
    }
  }
  return { world, draws }
}

const debutRows = (w: WorldState) => w.events.filter((e) => e.milestoneKey === SLAM_DEBUT_KEY)

describe('§1 the fire site – finalizeTournament records the first Slam main draw', () => {
  it('writes ONE keep-row, dated at the week she played it', () => {
    const { world } = careerThatPlays('r41-debut-fires', ['slam'])
    // She really was in the draw: `bestFinishByTier` is written for every completed run.
    expect(world.bestFinishByTier.slam, 'the run reached finalizeTournament').toBeTypeOf('number')
    const rows = debutRows(world)
    expect(rows).toHaveLength(1)
    expect(rows[0].week).toBe(world.week)
    expect(rows[0].keep, 'the prune may never sacrifice it – world/bookkeeping.ts').toBe(true)
    expect(rows[0].type).toBe('milestone')
    expect(slamDebutWeekOf(world)).toBe(world.week)
  })

  it('⚠ THE NEGATIVE ARM – a World Tour 1000 run writes nothing, however deep she goes', () => {
    const { world } = careerThatPlays('r41-debut-negative', ['wta1000'])
    expect(world.bestFinishByTier.wta1000, 'the 1000 really was played').toBeTypeOf('number')
    expect(debutRows(world)).toHaveLength(0)
    expect(slamDebutWeekOf(world)).toBeNull()
  })

  it('a career that has played no Slam at all reads null and pays no debut fame', () => {
    const { world } = careerThatPlays('r41-debut-none', ['w15', 'w35'])
    expect(slamDebutWeekOf(world)).toBeNull()
    // Nothing on her shelf is a Slam, so the whole debut term is absent rather than zero-decayed.
    const withStep = fameFloorOf(world, world.week)
    const F = ECONOMY.fame as unknown as { slamDebutFloor: number }
    const shipped = F.slamDebutFloor
    try {
      F.slamDebutFloor = 999
      expect(fameFloorOf(world, world.week), 'no row, so the constant cannot reach her').toBe(withStep)
    } finally {
      F.slamDebutFloor = shipped
    }
  })

  it('THREE Slams write ONE row, and the date stays the first – the debut, not the appearance', () => {
    const { world } = careerThatPlays('r41-debut-thrice', ['slam', 'slam', 'slam'])
    const rows = debutRows(world)
    expect(rows).toHaveLength(1)
    // Three runs, three weeks; the row is dated at the earliest of them.
    expect(rows[0].week).toBe(world.week - 2)
    expect(slamDebutWeekOf(world)).toBe(world.week - 2)
    // ...and the floor therefore carries exactly ONE step, decayed from that first week.
    const F = ECONOMY.fame
    const oneStep = F.slamDebutFloor * decayAt(world.week - rows[0].week)
    const bare = { ...world, events: world.events.filter((e) => e.milestoneKey !== SLAM_DEBUT_KEY) } as WorldState
    expect(fameFloorOf(world, world.week) - fameFloorOf(bare, world.week)).toBeCloseTo(oneStep, 9)
  })
})

describe('§2 the fame read – the step, the clock, and the shape of the term', () => {
  /** The smallest world `fameFloorOf` will read, plus a debut row. Everything it touches is `??`-
   *  guarded, which is what lets this be two fields rather than a career. */
  const worldWithDebut = (week: number | null): WorldState =>
    ({
      events: week === null ? [] : [{ id: 1, week, type: 'milestone', text: 'x', keep: true, milestoneKey: SLAM_DEBUT_KEY }],
    }) as unknown as WorldState

  it('a fresh debut is worth exactly the constant, and nothing else on an empty career', () => {
    expect(fameFloorOf(worldWithDebut(100), 100)).toBeCloseTo(ECONOMY.fame.slamDebutFloor, 9)
    expect(fameFloorOf(worldWithDebut(null), 100)).toBe(0)
  })

  it('⚠ IT DECAYS ON THE TITLE CLOCK, NOT THE CAREER ONE – a Slam week is a RESULT', () => {
    const gap = ECONOMY.fame.halfLifeWeeks
    const aged = fameFloorOf(worldWithDebut(100), 100 + gap)
    expect(aged).toBeCloseTo(ECONOMY.fame.slamDebutFloor / 2, 9)
    // The discriminator: on the SEASON clock (312 w) the same gap would leave far more standing.
    expect(aged).not.toBeCloseTo(ECONOMY.fame.slamDebutFloor * seasonFloorDecayAt(gap), 3)
  })

  it('a debut still in the future contributes nothing – fame is an account of what has happened', () => {
    expect(fameFloorOf(worldWithDebut(200), 100)).toBe(0)
  })

  it('it is beneath a Slam TITLE by an order of magnitude, and at the World Tour 250 rung', () => {
    const F = ECONOMY.fame
    expect(F.slamDebutFloor).toBeLessThan(F.titleFloor.slam! / 4)
    expect(F.slamDebutFloor).toBeLessThan(F.slamFinalFloor)
    // «playing one» must never outrank «winning a 500», which is the ladder's own ordering.
    expect(F.slamDebutFloor).toBeLessThan(F.titleFloor.wta500!)
  })

  it('⚠ THE COUPLING – the debut week is on fameEventWeeks, or brandStrengthAt under-reads the peak', () => {
    expect(fameEventWeeks(worldWithDebut(137))).toContain(137)
    expect(fameEventWeeks(worldWithDebut(null))).not.toContain(137)
  })
})

describe('§3 the prune law the whole design rests on', () => {
  it('⚠⚠ a debut row survives a feed swamped far past EVENTS_CAP, and its ordinary neighbours do not', () => {
    const { world } = careerThatPlays('r41-debut-prune', ['slam'])
    const debutWeek = slamDebutWeekOf(world)!
    // Flood the feed with ordinary rows written AFTER the debut, so an age-only prune would keep
    // them and drop it. The cap is spent by CLASS, and `kept` is not one of the two trimmed classes.
    const nextId = Math.max(...world.events.map((e) => e.id)) + 1
    for (let i = 0; i < EVENTS_CAP * 2; i++) {
      world.events.push({ id: nextId + i, week: world.week, type: 'info', text: `flood ${i}` })
    }
    housekeep(world)
    expect(world.events.length).toBeLessThanOrEqual(EVENTS_CAP + debutRows(world).length + 40)
    expect(debutRows(world), 'the keep-row is spliced back whole').toHaveLength(1)
    expect(slamDebutWeekOf(world)).toBe(debutWeek)
    // The sacrifice really did happen – otherwise this arm proves nothing about the prune.
    expect(world.events.filter((e) => e.text.startsWith('flood')).length).toBeLessThan(EVENTS_CAP * 2)
  })
})

describe('§4 RNG – the row costs the week no draw, and a second Slam cannot re-date it', () => {
  it('⚠⚠ the SAME forced Slam week spends the SAME number of MAIN draws whether the row is written or not', () => {
    // Arm A writes the row. Arm B already carries one (dated earlier), so `fireMilestone` returns at
    // its first line and writes nothing. If the write cost a draw, these two counts would differ –
    // and input-independence (the permanent law) would be broken by a milestone.
    const a = careerThatPlays('r41-debut-rng', ['slam'])
    const b = careerThatPlays('r41-debut-rng', ['slam'], (w) => {
      w.events.push({ id: 900_000, week: 2, type: 'milestone', text: 'x', keep: true, milestoneKey: SLAM_DEBUT_KEY })
    })
    expect(b.draws).toBe(a.draws)
    expect(a.draws).toBeGreaterThan(0)
    // ...and the pre-existing row is the one that stands: the FIRST Slam dates the career.
    expect(debutRows(b.world)).toHaveLength(1)
    expect(slamDebutWeekOf(b.world)).toBe(2)
  })

  it('the read is pure – asking twice on the same world gives the same answer and changes nothing', () => {
    const { world } = careerThatPlays('r41-debut-pure', ['slam'])
    const before = JSON.stringify(world.events)
    const first = fameFloorOf(world, world.week)
    expect(fameFloorOf(world, world.week)).toBe(first)
    expect(JSON.stringify(world.events)).toBe(before)
  })
})

describe('§5 no schema move, and no retroactivity', () => {
  it('⚠ a save that reached a Slam BEFORE this shipped carries no row and earns nothing back', () => {
    // Exactly the shape of the owner's own save: a Slam title and a lost Slam final on the shelf,
    // and no milestone row anywhere, because the mechanism did not exist when she played them.
    const legacy = {
      events: [],
      trophiesByTier: { slam: { titles: [314], finals: [234] } },
    } as unknown as WorldState
    expect(slamDebutWeekOf(legacy)).toBeNull()
    const F = ECONOMY.fame
    const expected = F.titleFloor.slam! * decayAt(405 - 314) + F.slamFinalFloor * decayAt(405 - 234)
    expect(fameFloorOf(legacy, 405), 'the title and the plate, and not one point more').toBeCloseTo(expected, 9)
  })
})
