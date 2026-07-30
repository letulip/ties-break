import { describe, it, expect } from 'vitest'
import type { KidSkills } from '../src/engine/development'
import {
  SURFACE_STYLE_DELTAS,
  SURFACE_STYLE_MAX_DELTA,
  applySurfaceStyle,
  surfaceStyleAffinity,
  surfaceStyleHint,
  surfaceStyleMultipliers,
  type SkillKey,
} from '../src/engine/match/style'
import { simulateMatch, fastMatchProbability } from '../src/engine/match/engine'
import type { MatchOptions, MatchPlayer, Surface } from '../src/engine/match/types'
import type { PlayStyle } from '../src/shared/protocol'
import {
  createWorld,
  tickWeek,
  enterEvent,
  bookPractice,
  conditionMatchFactor,
  kidMatchPlayer,
  kidMatchPlayerFor,
  skipTournament,
  closeTournament,
  KID_ID,
  type WorldState,
} from '../src/engine/world'
import { rngFromSeed } from '../src/engine/rng'
import { SURFACE_BLOCKS, buildSeason, surfaceBlockFor } from '../src/engine/season/calendar'

// ---------------------------------------------------------------------------
// surface x play-style (docs/specs/surface-style.md).
//
// The table is the KID's only build choice meeting the calendar's only physical axis. Everything
// here is pure arithmetic: no RNG is drawn, ever, and `all-court` must stay byte-neutral so the
// frozen main-stream pins (tests/condition.test.ts B1, tests/injuries.test.ts C1) cannot move.
// ---------------------------------------------------------------------------

const STYLES: PlayStyle[] = ['aggressive', 'counterpuncher', 'serve-first', 'all-court']
const SURFACES: Surface[] = ['hard', 'clay', 'grass']
// ⚠ FIVE SINCE v25, and this list is what makes the sum-to-zero sweep below cover the new column:
// the aggressive baseliner's row gained a `groundstrokes` delta (the attribute her style is actually
// about), and a four-key list would have walked straight past it.
const SKILLS: SkillKey[] = ['serve', 'ret', 'composure', 'stamina', 'groundstrokes']

/** The calendar's real surface mix, MEASURED off the real calendar rather than hard-coded.
 *
 *  It used to be the literal `{ hard: .5, clay: .35, grass: .15 }` of the old flat per-event draw.
 *  The season-block slice made the surface a function of the WEEK, so a copied constant would now be
 *  a second source of truth that silently drifts every time the block table is tuned – and the whole
 *  point of the "is all-court dominated?" check is that it weights the surfaces the way a blind
 *  enter-everything player ACTUALLY meets them. Derived once here, so tuning the blocks re-weights
 *  the balance check for free. Measured under the shipped table: hard .512 / clay .366 / grass .122
 *  (the flat mix's .50/.35/.15 is preserved to within ~1.5 points on hard and ~3 on grass, which is
 *  the season-block slice's own design constraint). */
const CALENDAR_MIX: Record<Surface, number> = (() => {
  const tally: Record<Surface, number> = { hard: 0, clay: 0, grass: 0 }
  let n = 0
  for (let s = 0; s < 60; s++) {
    for (const e of buildSeason(`style-mix-${s}`, 0, 52)) {
      tally[e.surface]++
      n++
    }
  }
  return { hard: tally.hard / n, clay: tally.clay / n, grass: tally.grass / n }
})()

function basePlayer(id: string, name: string): MatchPlayer {
  return { id, name, serve: 50, ret: 50, composure: 50, stamina: 50, groundstrokes: 50 }
}

describe('surface x style — the table', () => {
  it('all-court is flat on every surface and every attribute', () => {
    for (const surface of SURFACES) {
      const mult = surfaceStyleMultipliers('all-court', surface)
      for (const k of SKILLS) expect(mult[k]).toBe(1)
      expect(surfaceStyleAffinity('all-court', surface)).toBe('neutral')
    }
  })

  it('every other style has at least one favoured and one unfavoured surface', () => {
    for (const style of STYLES) {
      if (style === 'all-court') continue
      const affinities = SURFACES.map((s) => surfaceStyleAffinity(style, s))
      expect(affinities).toContain('suits')
      expect(affinities).toContain('against')
    }
  })

  it('no free lunch: each style/attribute sums to zero across the three surfaces', () => {
    // The property that keeps `all-court` from being dominated: a specialist only ever TRADES
    // surfaces, she is never handed a net bonus for existing. all-court's payoff is the zero row.
    for (const style of STYLES) {
      for (const k of SKILLS) {
        const sum = SURFACES.reduce((acc, s) => acc + (SURFACE_STYLE_DELTAS[style][s][k] ?? 0), 0)
        expect(sum).toBeCloseTo(0, 12)
      }
    }
  })

  it('magnitudes stay conservative and composure is never touched by the court', () => {
    expect(SURFACE_STYLE_MAX_DELTA).toBeLessThanOrEqual(0.06)
    for (const style of STYLES) {
      for (const s of SURFACES) {
        const row = SURFACE_STYLE_DELTAS[style][s]
        expect(row.composure ?? 0).toBe(0) // nerves are hers, not the court's
        for (const k of SKILLS) expect(Math.abs(row[k] ?? 0)).toBeLessThanOrEqual(SURFACE_STYLE_MAX_DELTA)
      }
    }
  })

  it('the spec\'s direction table: serve-first loves grass, counterpuncher loves clay, aggressive loves hard', () => {
    expect(surfaceStyleAffinity('serve-first', 'grass')).toBe('suits')
    expect(surfaceStyleAffinity('serve-first', 'clay')).toBe('against')
    expect(surfaceStyleAffinity('serve-first', 'hard')).toBe('neutral')
    expect(surfaceStyleAffinity('counterpuncher', 'clay')).toBe('suits')
    expect(surfaceStyleAffinity('counterpuncher', 'grass')).toBe('against')
    expect(surfaceStyleAffinity('counterpuncher', 'hard')).toBe('neutral')
    expect(surfaceStyleAffinity('aggressive', 'hard')).toBe('suits')
    expect(surfaceStyleAffinity('aggressive', 'grass')).toBe('suits')
    expect(surfaceStyleAffinity('aggressive', 'clay')).toBe('against')
  })

  it('the calendar hint says something only when the court has an opinion (short dash, no Cyrillic)', () => {
    expect(surfaceStyleHint('serve-first', 'grass')).toBe('Grass – suits her game')
    expect(surfaceStyleHint('serve-first', 'clay')).toBe('Clay – not her surface')
    expect(surfaceStyleHint('serve-first', 'hard')).toBeNull()
    for (const s of SURFACES) expect(surfaceStyleHint('all-court', s)).toBeNull()
    for (const style of STYLES) {
      for (const s of SURFACES) {
        const hint = surfaceStyleHint(style, s)
        if (hint === null) continue
        expect(hint).not.toContain('—') // player copy: short dash only
        expect(/[Ѐ-ӿ]/.test(hint)).toBe(false)
      }
    }
  })
})

describe('surface x style — applySurfaceStyle is a pure function of (player, style, surface)', () => {
  it('returns a new player, never mutates the input, and keeps id/name', () => {
    const p = basePlayer('kid', 'Vera Martin')
    const out = applySurfaceStyle(p, 'serve-first', 'grass')
    expect(out).not.toBe(p)
    expect(p.serve).toBe(50) // untouched
    expect(out.id).toBe('kid')
    expect(out.name).toBe('Vera Martin')
  })

  it('all-court returns byte-identical attributes (the pin-safety property)', () => {
    const p: MatchPlayer = { id: 'k', name: 'K', serve: 47.3, ret: 51.9, composure: 38.5, stamina: 44.1, groundstrokes: 49.7 }
    for (const surface of SURFACES) {
      const out = applySurfaceStyle(p, 'all-court', surface)
      expect(out.serve).toBe(p.serve)
      expect(out.ret).toBe(p.ret)
      expect(out.composure).toBe(p.composure)
      expect(out.stamina).toBe(p.stamina)
      expect(out.groundstrokes).toBe(p.groundstrokes)
    }
  })

  it('multiplies exactly the attributes the table names', () => {
    const p = basePlayer('k', 'K')
    const grass = applySurfaceStyle(p, 'serve-first', 'grass')
    expect(grass.serve).toBeCloseTo(50 * (1 + SURFACE_STYLE_DELTAS['serve-first'].grass.serve!), 12)
    expect(grass.ret).toBe(50) // untouched attribute stays byte-identical
    expect(grass.composure).toBe(50)
    const clay = applySurfaceStyle(p, 'counterpuncher', 'clay')
    expect(clay.ret).toBeCloseTo(50 * (1 + SURFACE_STYLE_DELTAS.counterpuncher.clay.ret!), 12)
    expect(clay.stamina).toBeCloseTo(50 * (1 + SURFACE_STYLE_DELTAS.counterpuncher.clay.stamina!), 12)
    expect(clay.serve).toBe(50)
  })

  it('takes any MatchPlayer — it never reaches into world state (reusable for the AI cohort later)', () => {
    const ai: MatchPlayer = { id: 'ai-7', name: 'A. Rival', serve: 62, ret: 58, composure: 70, stamina: 64, groundstrokes: 60 }
    const out = applySurfaceStyle(ai, 'counterpuncher', 'clay')
    expect(out.ret).toBeGreaterThan(ai.ret)
    expect(applySurfaceStyle.length).toBe(3) // (player, style, surface)
  })
})

// ---------------------------------------------------------------------------
// The direction proof. Closed form first (exact, zero variance), then the
// Monte-Carlo the spec asks for (paired seeds: the same RNG stream on both
// surfaces, so only the table moves the result).
// ---------------------------------------------------------------------------

function styled(style: PlayStyle, surface: Surface, id: string): MatchPlayer {
  return applySurfaceStyle(basePlayer(id, id), style, surface)
}

function closedFormWinRate(styleA: PlayStyle, styleB: PlayStyle, surface: Surface): number {
  const a = styled(styleA, surface, 'a')
  const b = styled(styleB, surface, 'b')
  return fastMatchProbability(a, b, { surface, tour: 'wta', seed: '' })
}

function monteCarloWinRate(styleA: PlayStyle, styleB: PlayStyle, surface: Surface, n: number): number {
  const a = styled(styleA, surface, 'a')
  const b = styled(styleB, surface, 'b')
  let wins = 0
  for (let i = 0; i < n; i++) {
    const opts: MatchOptions = { surface, tour: 'wta', seed: `style-mc-${i}` }
    if (simulateMatch(a, b, opts).winner === 0) wins++
  }
  return wins / n
}

describe('surface x style — the direction proof (serve-first vs counterpuncher)', () => {
  it('closed form: grass favours the serve-first kid, clay favours the counterpuncher', () => {
    const grass = closedFormWinRate('serve-first', 'counterpuncher', 'grass')
    const hard = closedFormWinRate('serve-first', 'counterpuncher', 'hard')
    const clay = closedFormWinRate('serve-first', 'counterpuncher', 'clay')
    expect(grass).toBeGreaterThan(0.5)
    expect(clay).toBeLessThan(0.5)
    expect(hard).toBeCloseTo(0.5, 10) // identical builds, both flat on hard
    expect(grass - clay).toBeGreaterThan(0.05)
  })

  it('Monte-Carlo (paired seeds): she wins more on grass than on clay', () => {
    const N = 1200
    const grass = monteCarloWinRate('serve-first', 'counterpuncher', 'grass', N)
    const clay = monteCarloWinRate('serve-first', 'counterpuncher', 'clay', N)
    expect(grass).toBeGreaterThan(0.5)
    expect(clay).toBeLessThan(0.5)
    expect(grass - clay).toBeGreaterThan(0.04) // ~4x the 1-sigma sampling noise at N=1200
  })
})

describe('surface x style — all-court is not dominated', () => {
  it('against every specialist there is a surface where all-court is the better build', () => {
    for (const style of STYLES) {
      if (style === 'all-court') continue
      const best = Math.max(...SURFACES.map((s) => closedFormWinRate('all-court', style, s)))
      expect(best).toBeGreaterThan(0.5)
    }
  })

  it('over the calendar mix all-court stays within a point of every specialist', () => {
    for (const style of STYLES) {
      if (style === 'all-court') continue
      const weighted = SURFACES.reduce((acc, s) => acc + CALENDAR_MIX[s] * closedFormWinRate('all-court', style, s), 0)
      expect(weighted).toBeGreaterThan(0.49)
      expect(weighted).toBeLessThan(0.51)
    }
  })
})

// ---------------------------------------------------------------------------
// SEASON BLOCKS x STYLE — what the block calendar does to the balance the surface-style slice
// measured, and to the hint the season planner shows.
//
// The season-block slice's promise was "re-distribute the surfaces across the year without
// re-tuning anybody's build". Both halves of that are asserted here: the YEAR-long spread is
// unchanged, and INSIDE a block it opens up – which is the payoff, because a block is a thing the
// player can plan for.
// ---------------------------------------------------------------------------
describe('season blocks x style — the balance survives, the calendar gains signal', () => {
  /** One style's win rate over a mix, averaged against the whole field (itself included) – the same
   *  read the surface-style slice reported as "all-court 50.0 / counter 50.4 / …". */
  function fieldWinRate(style: PlayStyle, mix: Record<Surface, number>): number {
    let acc = 0
    for (const opponent of STYLES) {
      for (const surface of SURFACES) acc += mix[surface] * closedFormWinRate(style, opponent, surface)
    }
    return acc / STYLES.length
  }

  /** The mix inside one block, measured off the real calendar. */
  function blockMix(blockId: string): Record<Surface, number> {
    const tally: Record<Surface, number> = { hard: 0, clay: 0, grass: 0 }
    let n = 0
    for (let s = 0; s < 60; s++) {
      for (const e of buildSeason(`style-mix-${s}`, 0, 52)) {
        if (surfaceBlockFor(e.week).id !== blockId) continue
        tally[e.surface]++
        n++
      }
    }
    return { hard: tally.hard / n, clay: tally.clay / n, grass: tally.grass / n }
  }

  const FLAT_MIX: Record<Surface, number> = { hard: 0.5, clay: 0.35, grass: 0.15 }

  it('the SEASON-long spread is essentially untouched – no build was re-balanced by the calendar', () => {
    // MEASURED (closed form, exact – zero sampling noise):
    //   FLAT   all-court 49.97 · counter 50.40 · aggressive 50.09 · serve-first 49.54  (spread 0.86)
    //   BLOCKS all-court 49.99 · counter 50.51 · aggressive 50.04 · serve-first 49.47  (spread 1.04)
    // The flat row reproduces the surface-style slice's own report (50.0 / 50.4 / 50.1 / 49.6), so
    // this is the same measurement, not a new one. Blocks widen the spread by 0.2 of a point.
    //
    // ⚠ RE-MEASURED AT v25 (the aggressive baseliner's groundstroke row). Every assertion below is a
    // RANGE and none of them moved; these are the numbers behind them:
    //   FLAT   all-court 49.83 · counter 50.26 · aggressive 50.52 · serve-first 49.40  (spread 1.12)
    //   BLOCKS all-court 49.84 · counter 50.39 · aggressive 50.47 · serve-first 49.30  (spread 1.17)
    // The aggressive baseliner gains about four tenths over the year and takes the top of the flat
    // row off the counterpuncher, which is the attribute her style never had starting to pay. The
    // spread widens by a quarter of a point and stays inside the same bounds, so the promise this
    // test exists for is intact: nobody was re-balanced by a calendar, and nobody is dominant.
    const spreadOf = (mix: Record<Surface, number>): number => {
      const rates = STYLES.map((s) => fieldWinRate(s, mix))
      return Math.max(...rates) - Math.min(...rates)
    }
    const flat = spreadOf(FLAT_MIX)
    const blocks = spreadOf(CALENDAR_MIX)
    expect(flat).toBeLessThan(0.015) // under 1.5 points: nobody is dominant over a year
    expect(blocks).toBeLessThan(0.015)
    // and the shift is small – a calendar change must not be a stealth balance patch
    expect(Math.abs(blocks - flat)).toBeLessThan(0.005)
    // every style still lands within a point of even money over the year
    for (const style of STYLES) {
      expect(fieldWinRate(style, CALENDAR_MIX), style).toBeGreaterThan(0.49)
      expect(fieldWinRate(style, CALENDAR_MIX), style).toBeLessThan(0.51)
    }
  })

  it('INSIDE a block the spread opens up – that is the signal the flat mix could not carry', () => {
    // MEASURED per block (closed form):
    //   clay swing   counter 52.21 · all-court 50.62 · serve-first 49.03 · aggressive 48.14 (4.07)
    //   grass window serve-first 50.99 · aggressive 50.85 · all-court 49.72 · counter 48.44 (2.54)
    //   hard swings  aggressive 50.8x · counter 50.0x · all-court 49.7x · serve-first 49.40 (1.4x)
    //
    // ⚠ RE-MEASURED AT v25, and the `best(grass)` assertion below is the reason the groundstroke row
    // is shaped the way it is. A grass BLOCK is 69% grass and 25% HARD, so a hard-court-only bonus
    // leaks into the grass window: at `hard +MID / clay -MID` the aggressive baseliner took the grass
    // window off the server (51.26 against 50.87) and this test caught it. Paying for the bonus across
    // clay AND grass instead restores the window and leaves the margin WIDER than it was pre-v25:
    //   clay swing   counter 52.38 · all-court 50.77 · serve-first 49.16 · aggressive 47.69 (4.70)
    //   grass window serve-first 51.05 · aggressive 50.72 · all-court 49.76 · counter 48.47 (2.59)
    // (grass margin 0.33 against 0.04 before; clay spread 4.70 against 4.15). Both blocks still favour
    // the build they are named for, and both got more decisive - which is what the axis is for.
    // A player who plans her season now gets 2.5-4 points of edge inside her block, against a
    // year-long spread of 1. THAT is what "the calendar tells you when your surface arrives" buys.
    const clay = blockMix('clay')
    const grass = blockMix('grass')
    const spreadOf = (mix: Record<Surface, number>): number => {
      const rates = STYLES.map((s) => fieldWinRate(s, mix))
      return Math.max(...rates) - Math.min(...rates)
    }
    expect(spreadOf(clay)).toBeGreaterThan(0.03) // >= 3 points inside the clay swing
    expect(spreadOf(grass)).toBeGreaterThan(0.02)
    expect(spreadOf(clay)).toBeGreaterThan(spreadOf(CALENDAR_MIX) * 2.5)
    // ...and it favours the RIGHT builds: the clay swing is the counterpuncher's season, the grass
    // window is the server's, and all-court is neither hero nor victim in either.
    const best = (mix: Record<Surface, number>) =>
      STYLES.reduce((a, b) => (fieldWinRate(b, mix) > fieldWinRate(a, mix) ? b : a))
    expect(best(clay)).toBe('counterpuncher')
    expect(best(grass)).toBe('serve-first')
    for (const mix of [clay, grass]) {
      expect(fieldWinRate('all-court', mix)).toBeGreaterThan(0.49)
      expect(fieldWinRate('all-court', mix)).toBeLessThan(0.51)
    }
  })

  it("the planner's surface hint CLUSTERS: her block is where 'suits her game' lives", () => {
    // The season planner renders surfaceStyleHint per calendar card (SeasonScreen surfaceNote), so
    // this is what the player actually reads. VERIFIED, not assumed: for each specialist, count the
    // "suits her game" cards inside her home block against everywhere else.
    const home: Partial<Record<PlayStyle, string>> = {
      counterpuncher: 'clay',
      'serve-first': 'grass',
      aggressive: 'hard-late',
    }
    for (const [style, blockId] of Object.entries(home) as [PlayStyle, string][]) {
      let inBlock = 0
      let inBlockTotal = 0
      let outside = 0
      let outsideTotal = 0
      for (let s = 0; s < 30; s++) {
        for (const e of buildSeason(`hint-${s}`, 0, 52)) {
          const suits = surfaceStyleHint(style, e.surface) === `${e.surface[0].toUpperCase()}${e.surface.slice(1)} – suits her game`
          if (surfaceBlockFor(e.week).id === blockId) {
            inBlockTotal++
            if (suits) inBlock++
          } else {
            outsideTotal++
            if (suits) outside++
          }
        }
      }
      const inRate = inBlock / inBlockTotal
      const outRate = outside / outsideTotal
      // her block really is her season: the hint fires far more often inside it…
      expect(inRate, `${style} in ${blockId}`).toBeGreaterThan(outRate * 1.5)
      // …and it is not a wall of green outside it either (the hint keeps meaning something)
      expect(inRate, `${style} in ${blockId}`).toBeGreaterThan(0.4)
    }
    // all-court never gets a hint at all – silence is its identity, and the planner shows nothing
    for (const surface of SURFACES) expect(surfaceStyleHint('all-court', surface)).toBeNull()
    // the block labels the planner strip shows are player copy: short dash only, no Cyrillic
    for (const b of SURFACE_BLOCKS) expect(b.label).not.toMatch(/[—А-Яа-яЁё]/)
  })
})

// ---------------------------------------------------------------------------
// The world composition point: condition factor x style table, applied ONCE.
// ---------------------------------------------------------------------------

function tickToPending(
  seed: string,
  mutate?: (w: WorldState) => void,
): { world: WorldState; eventId: string; skillsAtEntry: KidSkills } {
  const world = createWorld(seed)
  if (mutate) mutate(world)
  // The build the bracket saw: her skills at the START of the week that produced the tournament -
  // NOT at career start. She develops every week (v19), so the weeks this helper ticks through on
  // the way there move her too.
  let skillsAtEntry = { ...world.skills }
  const target = world.season.find((e) => e.tier === 'local' && e.deadlineWeek >= world.week)!
  enterEvent(world, target.id)
  const rng = rngFromSeed(world.seed)
  for (let i = 0; i < 12 && !world.pendingTournament; i++) {
    skillsAtEntry = { ...world.skills }
    tickWeek(world, rng)
  }
  if (!world.pendingTournament) throw new Error(`seed ${seed}: reveal never spawned – pick another seed`)
  return { world, eventId: target.id, skillsAtEntry }
}

/** ⚠ `atSkills` matters since Phase 4 (v19). She DEVELOPS, and the tick's order is deliberate: the
 *  shadow tournament (step 2) runs on the build she woke up with, and growth (step 3b) happens
 *  afterwards - you do not improve halfway through a tournament. So a snapshot taken inside the
 *  tick must be compared against her PRE-tick build, not against the one she finished the week
 *  with. Callers that never ticked can leave it out. */
function expectedKid(world: WorldState, surface: Surface, atSkills?: KidSkills): MatchPlayer {
  const raw = kidMatchPlayer(atSkills ? { ...world, skills: atSkills } : world)
  const factor = conditionMatchFactor(world.condition)
  return applySurfaceStyle(
    {
      ...raw,
      serve: raw.serve * factor,
      ret: raw.ret * factor,
      composure: raw.composure * factor,
      stamina: raw.stamina * factor,
      groundstrokes: raw.groundstrokes * factor,
    },
    world.profile.playStyle,
    surface,
  )
}

describe('surface x style — the single composition point in world.ts', () => {
  it('kidMatchPlayerFor composes the condition factor and the table multiplicatively', () => {
    const world = createWorld('sfx-compose')
    world.profile = { ...world.profile, playStyle: 'counterpuncher' }
    world.condition = 40
    const factor = conditionMatchFactor(world.condition)
    expect(factor).toBeLessThan(1)
    const raw = kidMatchPlayer(world)
    const out = kidMatchPlayerFor(world, 'clay')
    const mult = surfaceStyleMultipliers('counterpuncher', 'clay')
    expect(out.serve).toBeCloseTo(raw.serve * factor * mult.serve, 10)
    expect(out.ret).toBeCloseTo(raw.ret * factor * mult.ret, 10)
    expect(out.composure).toBeCloseTo(raw.composure * factor * mult.composure, 10)
    expect(out.stamina).toBeCloseTo(raw.stamina * factor * mult.stamina, 10)
    expect(out.groundstrokes).toBeCloseTo(raw.groundstrokes * factor * mult.groundstrokes, 10)
    expect(out.ret).toBeGreaterThan(raw.ret * factor) // clay lifts the counterpuncher's return
    // Pure: calling it again cannot compound (it never writes to the world).
    expect(kidMatchPlayerFor(world, 'clay')).toEqual(out)
    expect(world.condition).toBe(40)
  })

  it('an all-court kid is byte-identical to the pre-slice condition-only scaling', () => {
    const world = createWorld('sfx-neutral')
    world.condition = 55
    const factor = conditionMatchFactor(world.condition)
    const raw = kidMatchPlayer(world)
    for (const surface of SURFACES) {
      const out = kidMatchPlayerFor(world, surface)
      expect(out.serve).toBe(raw.serve * factor)
      expect(out.ret).toBe(raw.ret * factor)
      expect(out.composure).toBe(raw.composure * factor)
      expect(out.stamina).toBe(raw.stamina * factor)
      expect(out.groundstrokes).toBe(raw.groundstrokes * factor)
    }
  })

  it('a tournament run applies it ONCE: every round of the run carries the same snapshot', () => {
    // ⚠ SEED-WALKED by the random-draw change (28.07): this needs a MULTI-ROUND run (the whole
    // point is that every round carries the same build), and with a random draw the fixed seed
    // 'sfx-run' now goes out in the first round. Which seed survives a round is not the subject.
    let world!: WorldState
    let atEntry!: KidSkills
    for (let i = 0; i < 30; i++) {
      const r = tickToPending(`sfx-run-${i}`, (x) => {
        x.profile = { ...x.profile, playStyle: 'serve-first' }
      })
      const w = r.world
      const finish = w.pendingTournament!.result.finishes[KID_ID]
      const rounds = Math.log2(w.pendingTournament!.result.matches.length + 1)
      if (finish !== undefined && finish >= rounds) continue // lost round one
      world = w
      atEntry = r.skillsAtEntry
      break
    }
    expect(world, 'no seed in 30 gave her a multi-round run').toBeTruthy()
    const event = world.season.find((e) => e.id === world.pendingTournament!.eventId)!
    const expected = expectedKid(world, event.surface, atEntry)
    const stored = world.pendingTournament!.players[KID_ID]
    expect(stored.serve).toBeCloseTo(expected.serve, 10)
    expect(stored.ret).toBeCloseTo(expected.ret, 10)
    expect(stored.stamina).toBeCloseTo(expected.stamina, 10)
    skipTournament(world)
    // Every revealed kid match carries the SAME build – a per-match re-application would compound.
    const kidMatches = world.events.filter((e) => e.type === 'match' && e.match && !e.friendly)
    expect(kidMatches.length).toBeGreaterThanOrEqual(2)
    for (const ev of kidMatches) {
      const kidSide = ev.match!.aId === KID_ID ? ev.match!.a : ev.match!.b
      expect(kidSide!.serve).toBeCloseTo(expected.serve, 10)
      expect(kidSide!.stamina).toBeCloseTo(expected.stamina, 10)
    }
    closeTournament(world)
  })

  it('the practice friendly (home hard courts) goes through the same composition point', () => {
    const world = createWorld('sfx-practice')
    world.profile = { ...world.profile, playStyle: 'aggressive' }
    bookPractice(world, world.week + 1, false)
    const rng = rngFromSeed(world.seed)
    // Her build as the friendly saw it: growth (step 3b) lands after the match, and it moves each
    // attribute by a different amount, so even the RATIO below shifts if we read her afterwards.
    const skillsAtMatch = { ...world.skills }
    tickWeek(world, rng)
    const friendly = world.events.find((e) => e.type === 'match' && e.friendly)
    expect(friendly).toBeDefined()
    const kidSide = friendly!.match!.aId === KID_ID ? friendly!.match!.a : friendly!.match!.b
    const expected = expectedKid(world, 'hard', skillsAtMatch)
    // condition moved when the friendly resolved, so compare the RATIO the table imposes instead.
    const mult = surfaceStyleMultipliers('aggressive', 'hard')
    expect(mult.serve).toBeGreaterThan(1) // hard suits the aggressive kid
    expect(kidSide!.serve / kidSide!.composure).toBeCloseTo(expected.serve / expected.composure, 10)
  })
})

describe('surface x style — zero RNG', () => {
  it('the play style never perturbs the MAIN weekly stream', () => {
    function run(style: PlayStyle): { draws: number[]; kidServe: number } {
      const world = createWorld('sfx-stream')
      world.profile = { ...world.profile, playStyle: style }
      const target = world.season.find((e) => e.tier === 'local' && e.deadlineWeek >= world.week)!
      enterEvent(world, target.id)
      const raw = rngFromSeed(world.seed)
      const draws: number[] = []
      const rng = () => {
        const v = raw()
        draws.push(v)
        return v
      }
      let kidServe = 0
      for (let i = 0; i < 20; i++) {
        tickWeek(world, rng)
        if (world.pendingTournament) {
          kidServe = kidServe || world.pendingTournament.players[KID_ID].serve
          skipTournament(world)
          closeTournament(world)
        }
      }
      return { draws, kidServe }
    }
    const flat = run('all-court')
    const serveFirst = run('serve-first')
    expect(serveFirst.draws.length).toBe(flat.draws.length)
    expect(serveFirst.draws).toEqual(flat.draws)
    // ...and she really did play a differently-tuned match (unless the draw was on hard).
    expect(flat.kidServe).toBeGreaterThan(0)
  })
})
