import { describe, it, expect } from 'vitest'
import {
  createWorld,
  tickWeek,
  enterEvent,
  recomputeKidRank,
  skipTournament,
  closeTournament,
  KID_ID,
  START_AGE_YEARS,
  type WorldState,
} from '../src/engine/world'
import { migrateSave } from '../src/engine/migrations'
import { rngFromSeed, resumeMain, mainStateConsistent } from '../src/engine/rng'
import { TIERS, TIER_LADDER, isTierAgeOpen, WEEKS_PER_YEAR } from '../src/engine/season/calendar'
import type { SeasonResult } from '../src/engine/season/ranking'

const EVENTS_CAP = 400 // mirrors world.ts

describe('world (phase-3 living season)', () => {
  it('same seed -> identical world after 520 weeks', () => {
    const runs = [0, 1].map(() => {
      const world = createWorld('deterministic')
      const rng = rngFromSeed(world.seed)
      for (let i = 0; i < 520; i++) tickWeek(world, rng)
      return world
    })
    expect(runs[0]).toEqual(runs[1])
  })

  it('training-heavy plans cost more than light ones (same seed, same draws)', () => {
    const run = (plan: { train: number; rest: number }) => {
      const world = createWorld('plan-cost')
      world.plan = plan
      const rng = rngFromSeed(world.seed)
      for (let i = 0; i < 200; i++) tickWeek(world, rng)
      return world
    }
    const grind = run({ train: 85, rest: 15 })
    const light = run({ train: 60, rest: 40 })
    expect(grind.week).toBe(light.week)
    expect(grind.fundsCents).toBeLessThan(light.fundsCents)
  })

  it('grows a cohort and a rolling season from the seed', () => {
    const world = createWorld('grows')
    expect(world.cohort.length).toBe(199)
    // at least 26 future weeks are always scheduled
    const future = world.season.filter((e) => e.week > world.week)
    expect(future.length).toBeGreaterThanOrEqual(1)
    const maxWeek = Math.max(...world.season.map((e) => e.week))
    expect(maxWeek - world.week).toBeGreaterThanOrEqual(26)
    // the season keeps rolling as time passes
    const rng = rngFromSeed(world.seed)
    for (let i = 0; i < 100; i++) tickWeek(world, rng)
    const maxAfter = Math.max(...world.season.map((e) => e.week))
    expect(maxAfter - world.week).toBeGreaterThanOrEqual(26)
  })

  it('caps the event feed but never prunes keep:true events', () => {
    const world = createWorld('bounded')
    const rng = rngFromSeed(world.seed)
    for (let i = 0; i < 500; i++) tickWeek(world, rng)
    expect(world.week).toBe(500)
    // non-kept events are capped
    const nonKept = world.events.filter((e) => !e.keep)
    expect(nonKept.length).toBeLessThanOrEqual(EVENTS_CAP)
    // the week-0 "career started" keep:true info event survives 500 weeks of pruning
    const start = world.events.find((e) => e.week === 0 && e.type === 'info')
    expect(start).toBeTruthy()
    expect(start!.keep).toBe(true)
  })

  it('records prevKidRank as the kid rank from the START of the resolved week', () => {
    const world = createWorld('prev-rank')
    expect(world.prevKidRank).toBeNull()
    const rng = rngFromSeed(world.seed)
    for (let i = 0; i < 20; i++) {
      const rankBeforeTick = world.kidRank
      tickWeek(world, rng)
      expect(world.prevKidRank).toBe(rankBeforeTick)
    }
  })

  it('cohort drift is identical week-by-week regardless of entry choices (RNG discipline)', () => {
    const entered = createWorld('discipline')
    const skipped = createWorld('discipline')
    const rngA = rngFromSeed('discipline')
    const rngB = rngFromSeed('discipline')

    // The entered world commits to the earliest still-open event; the skipped world does not.
    //
    // ⚠ ...THAT SHE IS OLD ENOUGH FOR (task #17). The block below can grant her any book of results
    // in any table, and no book of results makes a fourteen-year-old sixteen: W15/W35/W100 open at
    // 16/16/17 and this seed's earliest still-open event is now one of them. The guard is about RNG
    // DISCIPLINE - that entering an event cannot move the main weekly stream - so WHICH event she
    // enters is scaffolding, and the filter keeps the scaffolding standing. It has to be `find`
    // rather than a hardcoded tier for the same reason it always was: the calendar decides.
    const age = START_AGE_YEARS + Math.floor(entered.week / WEEKS_PER_YEAR)
    const target = entered.season.find((e) => e.deadlineWeek >= entered.week && isTierAgeOpen(e.tier, age))
    expect(target).toBeTruthy()
    // r-gate (season-life-01b): points-based eligibility. This guard is about RNG discipline, not the
    // ladder, so grant throwaway results worth what the rung asks ONLY for the enterEvent gate
    // check, then drop them before any tick – the main-stream draws must stay byte-identical to the
    // skipped world.
    //
    // TWO LADDERS (docs/specs/two-ladders.md): the earliest still-open event on this seed is a J60,
    // which is an ACCEPTANCE LIST – it reads her ITF rank and refuses to read a position at all
    // until she owns a counting ITF result, so a single minPoints marker (j60's band is [0, MAX])
    // opened nothing. Four J300 titles put her inside the list; `recomputeKidRank` is what the gate
    // actually reads, so the cache is restored alongside the ledger and the world the ticks see is
    // byte-identical to the one before this block, exactly as it always was.
    const rank = entered.kidRank
    const rankDomestic = entered.kidRankDomestic
    const ledger = entered.results
    const def = TIERS[target!.tier]
    const grant: SeasonResult[] =
      def.enterPct === undefined
        ? // a domestic rung, or j30 the on-ramp, which reads her DOMESTIC standing whatever it is
          def.enterPointBand[0] > 0
          ? [{ playerId: KID_ID, week: entered.week, points: def.enterPointBand[0], tier: 'national' }]
          : []
        : Array.from({ length: 4 }, () => ({
            playerId: KID_ID,
            week: entered.week,
            points: 300,
            tier: 'j300' as const,
          }))
    if (grant.length > 0) {
      entered.results = [...ledger, ...grant]
      recomputeKidRank(entered)
    }
    enterEvent(entered, target!.id)
    entered.results = ledger
    entered.kidRank = rank
    entered.kidRankDomestic = rankDomestic
    expect(entered.entries).toContain(target!.id)
    expect(skipped.entries).toHaveLength(0)

    for (let w = 0; w < 60; w++) {
      tickWeek(entered, rngA)
      // A reveal week pauses; finalize + close it so time keeps moving. The main-stream draws
      // (drift + AI) already ran during the tick, so this never touches the cohort or the rng.
      if (entered.pendingTournament) {
        skipTournament(entered)
        closeTournament(entered)
      }
      tickWeek(skipped, rngB)
      // Entering / skipping must never perturb the main weekly stream, so cohort
      // drift lands identically in both worlds every single week.
      expect(entered.cohort).toEqual(skipped.cohort)
    }
    // ...but the kid actually played, so only the entered world has kid match events.
    expect(entered.events.some((e) => e.type === 'match')).toBe(true)
    expect(skipped.events.some((e) => e.type === 'match')).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// Save/reload replay of the AI world. The canonical AI tournaments run on the event-scoped
// stream `seed:aitour:<event.id>`, derived from two IMMUTABLE things – the world seed and the
// event id – so a reloaded career resolves the same brackets by construction, not because the
// worker managed to fast-forward the main stream onto exactly the right draw.
// ---------------------------------------------------------------------------
describe('AI tournaments replay across a save/reload', () => {
  // Result rows worth a tier's CHAMPION points – the winners of the brackets that resolved from
  // `fromWeek` on. Keyed by week + points so two events stacked in one week stay distinct.
  const CHAMPION_POINTS = new Set(TIER_LADDER.map((t) => TIERS[t].points[0]))
  function championsFrom(world: WorldState, fromWeek: number): string[] {
    return world.results
      .filter((r) => r.playerId !== KID_ID && r.week >= fromWeek && CHAMPION_POINTS.has(r.points))
      .map((r) => `w${r.week}:${r.points}:${r.playerId}`)
      .sort()
  }

  function newWorld(freezeCohort: boolean): WorldState {
    const world = createWorld('replay-mid-season')
    // Frozen skills isolate the RNG question: drift still draws its 4 per player, it just lands
    // on +0, so a diverging main stream can no longer reach the brackets through the cohort.
    if (freezeCohort) for (const p of world.cohort) p.growth = 0
    return world
  }

  // v35: ticked through `resumeMain(world.rngMain)` — the worker's own arrangement — so the
  // persisted position advances with the draws and the deep-equal below can include it.
  function runTo(week: number, freezeCohort = false): WorldState {
    const world = newWorld(freezeCohort)
    const rng = resumeMain(world.rngMain)
    for (let i = 0; i < week; i++) tickWeek(world, rng)
    return world
  }

  function saveReload(world: WorldState): WorldState {
    // The real round-trip the worker performs: a JSON payload back through migrateSave.
    return migrateSave(JSON.parse(JSON.stringify(world))) as unknown as WorldState
  }

  // ⚠ THE THEOREM THE WHOLE v35 FEATURE RESTS ON (P3): a straight run and a run that was saved,
  // migrated and resumed are THE SAME WORLD — not the same champions, not the same results, the
  // same EVERYTHING, `rngMain` included. Champions-only was the honest assertion while the resumed
  // stream was rebuilt by replay; now that the position is state, the deep-equal is the contract.
  it('a mid-season save/reload resumes into the SAME world (full deep-equal, rngMain included)', () => {
    const straight = runTo(30)

    const reloaded = saveReload(runTo(20))
    // What the worker does on load now: verify the persisted pair, resume from it. No replay.
    expect(mainStateConsistent(reloaded.seed, reloaded.rngMain)).toBe(true)
    const restored = resumeMain(reloaded.rngMain)
    for (let i = 0; i < 10; i++) tickWeek(reloaded, restored)

    // Non-vacuity: the window really contained brackets to reproduce.
    expect(championsFrom(straight, 21).length).toBeGreaterThan(0)
    expect(reloaded.rngMain).toEqual(straight.rngMain)
    expect(reloaded).toEqual(straight)
  })

  it('...even if the reloaded main stream lands on the WRONG draw (replay-safe by construction)', () => {
    const straight = runTo(30, true)

    const reloaded = saveReload(runTo(20, true))
    // A deliberately BROKEN restore: a stream that never saw the first 20 weeks, so every
    // main-stream draw from here on is the wrong one. The brackets must not care.
    const wrong = rngFromSeed(reloaded.seed)
    for (let i = 0; i < 10; i++) tickWeek(reloaded, wrong)

    expect(championsFrom(straight, 21).length).toBeGreaterThan(0)
    expect(championsFrom(reloaded, 21)).toEqual(championsFrom(straight, 21))
  })
})

describe('score presentation', () => {
  it('flipScore mirrors every set', async () => {
    const { flipScore } = await import('../src/engine/world')
    expect(flipScore('2-6 6-4 1-6')).toBe('6-2 4-6 6-1')
    expect(flipScore('7-6')).toBe('6-7')
  })
})
