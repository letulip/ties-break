import { describe, it, expect } from 'vitest'
import {
  TIERS,
  TIER_LADDER,
  SURFACE_BLOCKS,
  buildSeason,
  isOffSeasonWeek,
  surfaceBlockFor,
  surfaceForWeek,
  OFF_SEASON_WEEKS,
  WEEKS_PER_YEAR,
} from '../../src/engine/season/calendar'
import type { Surface } from '../../src/engine/match/types'
import { ECONOMY } from '../../src/engine/economy'
import { rngFromSeed } from '../../src/engine/rng'
import type { FamilyBackground } from '../../src/shared/protocol'
import type { SeasonEvent, TierId } from '../../src/engine/season/types'

// The BASE travel draw (background-independent pickInt) of the first event of
// buildSeason('travel-pin', 0, 52) – byte-for-byte the pre-corridor value. Each background now
// applies a per-trip corridor factor on top of this, but the base draw must not drift (RNG identity).
// RE-PINNED by ladder-up Part B: 31564 -> 196133. The pin is "the base travel draw of the FIRST
// event of buildSeason('travel-pin', 0, 52)", and with the J family that first event is a Junior
// Tour 60 (band $1,100-2,400) instead of a Local Open (band $60-120) – a different tier, hence a
// different band, hence a different base. The PROPERTY under test is unchanged: the base pickInt
// is byte-stable and the background corridor is applied on top of it.
const TRAVEL_PIN_BASE = 196133

// Re-derive the per-trip corridor factor exactly as makeEvent does: one uniform roll from the
// purpose-scoped sub-stream keyed by the event, mapped into the background's [lo,hi] corridor.
function travelFactor(seedStr: string, e: SeasonEvent, background: FamilyBackground): number {
  const [cLo, cHi] = ECONOMY.travelBgFactor[background]
  const roll = rngFromSeed(`${seedStr}:travelbg:${e.week}:${e.tier}`)()
  return cLo + roll * (cHi - cLo)
}

// RE-PINNED by ladder-up Part B: the catalogue is the six-rung ladder now, so the counter is
// derived from TIERS instead of listing the (then four) tiers by hand.
const SEASON_COUNTS: Record<TierId, number> = { local: 26, regional: 13, national: 6, j30: 26, j60: 17, j300: 4 }

function countByTier(events: SeasonEvent[]): Record<TierId, number> {
  const c = Object.fromEntries(Object.keys(TIERS).map((t) => [t, 0])) as Record<TierId, number>
  for (const e of events) c[e.tier]++
  return c
}

describe('TIERS — tier catalogue', () => {
  it('has exactly the six tiers with the spec economy numbers (whole cents)', () => {
    // RE-PINNED by ladder-up Part B: `itf` was replaced by the live j30/j60/j300 family.
    // The J-level numbers themselves are pinned in tests/ladder.test.ts (L2).
    expect(Object.keys(TIERS).sort()).toEqual(['j30', 'j300', 'j60', 'local', 'national', 'regional'])

    expect(TIERS.local.drawSize).toBe(8)
    expect(TIERS.local.everyNWeeks).toBe(2)
    expect(TIERS.local.entryFeeCents).toBe(40_00)
    expect(TIERS.local.travelCostCents).toEqual([60_00, 120_00])
    expect(TIERS.local.points).toEqual([30, 18, 10, 5])

    expect(TIERS.regional.drawSize).toBe(16)
    expect(TIERS.regional.everyNWeeks).toBe(4)
    expect(TIERS.regional.entryFeeCents).toBe(75_00)
    expect(TIERS.regional.travelCostCents).toEqual([150_00, 400_00])
    expect(TIERS.regional.points).toEqual([80, 48, 28, 14, 6])

    expect(TIERS.national.drawSize).toBe(32)
    expect(TIERS.national.everyNWeeks).toBe(13)
    expect(TIERS.national.secondHalfBonus).toBe(2) // R9-20 densification
    expect(TIERS.national.entryFeeCents).toBe(120_00)
    expect(TIERS.national.travelCostCents).toEqual([400_00, 900_00])
    expect(TIERS.national.points).toEqual([200, 120, 70, 35, 15, 6])
  })

  it('no tier is locked any more – every rung is scheduled', () => {
    // RE-PINNED by ladder-up Part B (was: "itf is present but locked (everyNWeeks 0)").
    for (const t of Object.values(TIERS)) expect(t.everyNWeeks).toBeGreaterThan(0)
  })

  it('each tier points array length matches rounds + 1', () => {
    for (const t of Object.values(TIERS)) {
      const rounds = Math.log2(t.drawSize)
      expect(t.points.length).toBe(rounds + 1)
    }
  })

  it('every id field equals its record key', () => {
    for (const [key, def] of Object.entries(TIERS)) expect(def.id).toBe(key)
  })
})

describe('buildSeason — determinism', () => {
  it('same seed + span produces a deep-equal season', () => {
    const a = buildSeason('world-1:season', 0, 52)
    const b = buildSeason('world-1:season', 0, 52)
    expect(a).toEqual(b)
  })

  it('a different seed changes surfaces / travel costs', () => {
    const a = buildSeason('seed-A', 0, 52)
    const b = buildSeason('seed-B', 0, 52)
    expect(a).not.toEqual(b)
  })
})

describe('buildSeason — 52-week structure', () => {
  const events = buildSeason('struct-seed', 0, 52)

  it('yields the ladder-up season counts (26 local / 13 regional / 6 national / 26 j30 / 17 j60 / 4 j300)', () => {
    expect(countByTier(events)).toEqual(SEASON_COUNTS)
  })

  it('never schedules two events of the SAME tier in one week', () => {
    // RE-PINNED by ladder-up Part B (was: "never schedules two events in the same week"). The J
    // family takes the season to ~92 events over 49 playable weeks, so a global one-per-week rule
    // no longer fits – and should not: the owner's point is that a week becomes a CHOICE between
    // events. Uniqueness is now per (week, tier), which is exactly what keeps the event ids unique.
    const keys = events.map((e) => `${e.week}:${e.tier}`)
    expect(new Set(keys).size).toBe(keys.length)
  })

  it('deadline is always the end of week - 2', () => {
    for (const e of events) expect(e.deadlineWeek).toBe(e.week - 2)
  })

  it('tiers DO share weeks now, and the strongest rung sorts first inside a week', () => {
    // RE-PINNED by ladder-up Part B (was: "local events never share a week with a national event").
    // Lower tiers no longer bend around higher ones – they run alongside them, which is the whole
    // "always somewhere to go" requirement. Ordering inside a week is strongest-first.
    const perWeek = new Map<number, number>()
    for (const e of events) perWeek.set(e.week, (perWeek.get(e.week) ?? 0) + 1)
    expect([...perWeek.values()].some((n) => n > 1)).toBe(true)
    const rung = (t: TierId) => TIER_LADDER.indexOf(t)
    for (let i = 1; i < events.length; i++) {
      if (events[i].week !== events[i - 1].week) continue
      expect(rung(events[i].tier)).toBeLessThan(rung(events[i - 1].tier))
    }
  })

  it('all weeks fall inside the requested span and events come sorted', () => {
    for (const e of events) {
      expect(e.week).toBeGreaterThanOrEqual(0)
      expect(e.week).toBeLessThan(52)
    }
    const weeks = events.map((e) => e.week)
    expect(weeks).toEqual([...weeks].sort((x, y) => x - y))
  })

  it('every event has a valid surface and a travel cost within its tier band × the middle corridor', () => {
    // buildSeason defaults to the middle background: travel = round(base * factor), base ∈ [lo,hi],
    // factor ∈ middle's corridor. So the factored value lives in [lo*corLo, hi*corHi], not [lo,hi].
    const [cLo, cHi] = ECONOMY.travelBgFactor.middle
    for (const e of events) {
      expect(['hard', 'clay', 'grass']).toContain(e.surface)
      const [lo, hi] = TIERS[e.tier].travelCostCents
      expect(e.travelCostCents).toBeGreaterThanOrEqual(Math.round(lo * cLo))
      expect(e.travelCostCents).toBeLessThanOrEqual(Math.round(hi * cHi))
    }
  })

  it('ids follow the `${year}-w${week}-${tier}` shape and are unique', () => {
    const ids = new Set<string>()
    for (const e of events) {
      expect(e.id).toBe(`${Math.floor(e.week / 52)}-w${e.week}-${e.tier}`)
      ids.add(e.id)
    }
    expect(ids.size).toBe(events.length)
  })
})

describe('buildSeason — surface weighting', () => {
  it('roughly follows hard 50 / clay 35 / grass 15 over many seasons', () => {
    const tally = { hard: 0, clay: 0, grass: 0 }
    let total = 0
    for (let s = 0; s < 60; s++) {
      for (const e of buildSeason(`surf-${s}`, 0, 52)) {
        tally[e.surface]++
        total++
      }
    }
    // Loose bands — this only guards against a badly wrong weighting. UNCHANGED by the season-block
    // slice, which is the point of it: the blocks re-DISTRIBUTE the surfaces across the year without
    // re-tuning the year's mix, so this test kept passing untouched (measured 50.5 / 37.3 / 12.2).
    expect(tally.hard / total).toBeGreaterThan(0.4)
    expect(tally.hard / total).toBeLessThan(0.6)
    expect(tally.grass / total).toBeGreaterThan(0.08)
    expect(tally.grass / total).toBeLessThan(0.22)
    expect(tally.clay / total).toBeGreaterThan(0.27)
    expect(tally.clay / total).toBeLessThan(0.43)
  })
})

// ---------------------------------------------------------------------------
// SEASON STRUCTURE BY SURFACE (owner approved 26.07: "звучит круто").
//
// The surface used to be one flat per-event draw, which made the calendar's surface column noise:
// it told the player nothing and taxed a serve-first build blindly. It is now a BLOCK schedule –
// a pure function of the season week – so the calendar says WHEN her surface arrives and planning a
// season around it becomes a real decision.
//
// The four properties that matter, all asserted below:
//   1. the block table is a total, non-overlapping tiling of the season year, and repeats yearly;
//   2. the surface draw is still exactly ONE roll in exactly its old position, so the season
//      sub-stream – and with it every travel cost – is byte-identical;
//   3. the year's MIX is preserved (nobody's build gets re-balanced by a calendar change), and grass
//      stays a SHORT window;
//   4. each block is DOMINATED by its surface but never uniform – a stray hard event in the clay
//      swing is realistic, and it is what keeps the calendar from being a metronome.
// ---------------------------------------------------------------------------
const SURFACES: Surface[] = ['hard', 'clay', 'grass']
/** The pre-block flat mix. Reinstating it in every block IS the old engine, which is what makes the
 *  invariance tests below exact rather than approximate. */
const FLAT_MIX: Record<Surface, number> = { hard: 0.5, clay: 0.35, grass: 0.15 }

/** Run `fn` with every block's weights replaced (restored on return AND on a throw). The table is
 *  the owner's knob, so being able to swap it is also the thing under test. */
function withBlockWeights<T>(weights: Record<Surface, number>, fn: () => T): T {
  const saved = SURFACE_BLOCKS.map((b) => b.weights)
  try {
    for (const b of SURFACE_BLOCKS) b.weights = weights
    return fn()
  } finally {
    SURFACE_BLOCKS.forEach((b, i) => (b.weights = saved[i]))
  }
}

function tallySurfaces(events: SeasonEvent[]): Record<Surface, number> {
  const t: Record<Surface, number> = { hard: 0, clay: 0, grass: 0 }
  for (const e of events) t[e.surface]++
  return t
}

describe('season structure by surface — the block table', () => {
  it('tiles the whole season year exactly once, off-season included, with weights summing to 1', () => {
    const covered = new Array<number>(WEEKS_PER_YEAR).fill(0)
    for (const b of SURFACE_BLOCKS) {
      expect(b.to).toBeGreaterThanOrEqual(b.from)
      for (let w = b.from; w <= b.to; w++) covered[w]++
      const sum = SURFACES.reduce((s, x) => s + b.weights[x], 0)
      expect(sum, `${b.id} weights`).toBeCloseTo(1, 10)
      for (const s of SURFACES) expect(b.weights[s], `${b.id}.${s}`).toBeGreaterThanOrEqual(0)
      expect(b.label).not.toMatch(/[—А-Яа-яЁё]/) // player-facing: short dash only, no Cyrillic
    }
    // total AND non-overlapping – every week of the year in exactly one block
    expect(covered.every((n) => n === 1)).toBe(true)
    expect(new Set(SURFACE_BLOCKS.map((b) => b.id)).size).toBe(SURFACE_BLOCKS.length)
    // the existing off-season tail is carried as a block, so the lookup can never fall through
    const tail = SURFACE_BLOCKS.find((b) => b.id === 'off-season')!
    for (let w = 0; w < WEEKS_PER_YEAR; w++) {
      expect(isOffSeasonWeek(w)).toBe(w >= tail.from && w <= tail.to)
    }
  })

  it('surfaceBlockFor is a pure function of the SEASON week and repeats every year', () => {
    for (let w = 0; w < WEEKS_PER_YEAR; w++) {
      const block = surfaceBlockFor(w)
      for (const year of [0, 1, 2, 7]) expect(surfaceBlockFor(w + year * WEEKS_PER_YEAR)).toBe(block)
      expect(surfaceBlockFor(w)).toBe(surfaceBlockFor(w)) // same instance, no allocation per call
    }
    // ...and it is total for a negative week too (the pre-history / prologue direction)
    expect(surfaceBlockFor(-1).id).toBe(SURFACE_BLOCKS.find((b) => b.to === WEEKS_PER_YEAR - 1)!.id)
  })

  it('surfaceForWeek maps a roll cumulatively in (hard, clay, grass) order – the flat mix is the old rule', () => {
    // Flatten every block and the function must reproduce the historical thresholds EXACTLY:
    // r < .5 hard, r < .85 clay, else grass. One code path, no legacy branch.
    withBlockWeights(FLAT_MIX, () => {
      for (const week of [0, 12, 20, 27, 40, 50]) {
        expect(surfaceForWeek(week, 0)).toBe('hard')
        expect(surfaceForWeek(week, 0.4999)).toBe('hard')
        expect(surfaceForWeek(week, 0.5)).toBe('clay')
        expect(surfaceForWeek(week, 0.8499)).toBe('clay')
        expect(surfaceForWeek(week, 0.85)).toBe('grass')
        expect(surfaceForWeek(week, 0.999999)).toBe('grass')
      }
    })
    // and under the shipped table the SAME roll reads differently per block – that IS the feature
    const clayWeek = SURFACE_BLOCKS.find((b) => b.id === 'clay')!.from
    const grassWeek = SURFACE_BLOCKS.find((b) => b.id === 'grass')!.from
    expect(surfaceForWeek(clayWeek, 0.3)).toBe('clay')
    expect(surfaceForWeek(grassWeek, 0.3)).toBe('grass')
    expect(surfaceForWeek(0, 0.3)).toBe('hard')
    // a roll of exactly 1 (never produced by the rng, but the function must stay total)
    for (const b of SURFACE_BLOCKS) expect(SURFACES).toContain(surfaceForWeek(b.from, 1))
  })

  it('ZERO draw-order change: swapping the whole block table cannot move a travel cost', () => {
    // The surface still costs exactly ONE roll, in exactly the position the flat draw used it – and
    // the very next draw is the event's base travel cost. So the schedule and the whole economy side
    // of the calendar are byte-identical across any block table; only `surface` moves. This is what
    // let the season-block slice ship without re-pinning TRAVEL_PIN_BASE or the econ bench.
    const blocks = buildSeason('block-invariance', 0, 52)
    const flat = withBlockWeights(FLAT_MIX, () => buildSeason('block-invariance', 0, 52))
    expect(flat).toHaveLength(blocks.length)
    for (let i = 0; i < blocks.length; i++) {
      expect(flat[i].id).toBe(blocks[i].id)
      expect(flat[i].week).toBe(blocks[i].week)
      expect(flat[i].tier).toBe(blocks[i].tier)
      expect(flat[i].deadlineWeek).toBe(blocks[i].deadlineWeek)
      expect(flat[i].travelCostCents).toBe(blocks[i].travelCostCents) // byte-identical
    }
    // ...and the surfaces really did differ, or the comparison proved nothing
    expect(flat.some((e, i) => e.surface !== blocks[i].surface)).toBe(true)
  })

  it('each block is DOMINATED by its surface, and never uniform', () => {
    const perBlock = new Map<string, Record<Surface, number>>()
    for (let s = 0; s < 60; s++) {
      for (const e of buildSeason(`surf-${s}`, 0, 52)) {
        const id = surfaceBlockFor(e.week).id
        const row = perBlock.get(id) ?? { hard: 0, clay: 0, grass: 0 }
        row[e.surface]++
        perBlock.set(id, row)
      }
    }
    // MEASURED over 60 seasons (5520 events): hard-early 71.8% hard · clay 78.6% clay ·
    // grass 69.5% grass · hard-late 71.8% hard. Off-season carries no events at all.
    const dominant: Record<string, Surface> = {
      'hard-early': 'hard',
      clay: 'clay',
      grass: 'grass',
      'hard-late': 'hard',
    }
    for (const [id, surface] of Object.entries(dominant)) {
      const row = perBlock.get(id)!
      const n = row.hard + row.clay + row.grass
      expect(n, `${id} events`).toBeGreaterThan(100)
      // the block READS as its surface – a player can plan around the calendar column
      expect(row[surface] / n, `${id} dominant share`).toBeGreaterThan(0.6)
      // ...but it is NOT a metronome: the other two surfaces still show up
      expect(row[surface] / n, `${id} dominant share`).toBeLessThan(0.9)
      for (const other of SURFACES) expect(row[other], `${id}.${other}`).toBeGreaterThan(0)
    }
    expect(perBlock.get('off-season')).toBeUndefined() // the tail stays event-free
  })

  it('grass stays a SHORT window, and the surfaces cluster instead of alternating', () => {
    const grass = SURFACE_BLOCKS.find((b) => b.id === 'grass')!
    const playable = WEEKS_PER_YEAR - OFF_SEASON_WEEKS
    const grassWeeks = grass.to - grass.from + 1
    expect(grassWeeks).toBeLessThanOrEqual(8) // a real tour's grass season is weeks, not months
    expect(grassWeeks / playable).toBeLessThan(0.2) // never "grass is 40% of the year"
    // CLUSTERING, measured directly: an event is far likelier to share its surface with the events
    // around it than the flat mix could ever manage. Compare consecutive-event agreement.
    const agreement = (events: SeasonEvent[]): number => {
      let same = 0
      let pairs = 0
      for (let i = 1; i < events.length; i++) {
        if (events[i].week === events[i - 1].week) continue // same week – not a calendar step
        pairs++
        if (events[i].surface === events[i - 1].surface) same++
      }
      return same / pairs
    }
    let blocked = 0
    let flatAgree = 0
    for (let s = 0; s < 30; s++) {
      blocked += agreement(buildSeason(`clust-${s}`, 0, 52))
      flatAgree += withBlockWeights(FLAT_MIX, () => agreement(buildSeason(`clust-${s}`, 0, 52)))
    }
    // flat mix: agreement is just Σ p², ~0.395. Blocks push it far above that – the column has
    // structure a player can read.
    expect(flatAgree / 30).toBeLessThan(0.45)
    expect(blocked / 30).toBeGreaterThan(0.55)
  })

  it('no tier is surface-starved: every rung meets every court over a season', () => {
    const perTier = new Map<TierId, Record<Surface, number>>()
    for (let s = 0; s < 60; s++) {
      for (const e of buildSeason(`surf-${s}`, 0, 52)) {
        const row = perTier.get(e.tier) ?? { hard: 0, clay: 0, grass: 0 }
        row[e.surface]++
        perTier.set(e.tier, row)
      }
    }
    for (const tier of TIER_LADDER) {
      const row = perTier.get(tier)!
      const n = row.hard + row.clay + row.grass
      for (const s of SURFACES) {
        // a rung that never sees a surface would make a specialist's build unplayable at that level
        expect(row[s] / n, `${tier}/${s}`).toBeGreaterThan(0.02)
      }
    }
  })

  it('the whole thing is DATA: a one-block table collapses the season to a single surface', () => {
    // The owner's knob, exercised. (Also the degenerate case the tiling test forbids in the shipped
    // table – proved here to be a table property, not a code property.)
    const saved = SURFACE_BLOCKS.map((b) => ({ ...b }))
    try {
      for (const b of SURFACE_BLOCKS) b.weights = { hard: 0, clay: 1, grass: 0 }
      expect(tallySurfaces(buildSeason('one-block', 0, 52))).toMatchObject({ hard: 0, grass: 0 })
      expect(tallySurfaces(buildSeason('one-block', 0, 52)).clay).toBeGreaterThan(0)
    } finally {
      SURFACE_BLOCKS.forEach((b, i) => (b.weights = saved[i].weights))
    }
    expect(tallySurfaces(buildSeason('one-block', 0, 52)).hard).toBeGreaterThan(0) // restored
  })
})

describe('isOffSeasonWeek — Round 5 items 16/21', () => {
  it('flags exactly the last 3 weeks of year 0 (weeks 49, 50, 51)', () => {
    for (let w = 0; w < 49; w++) expect(isOffSeasonWeek(w)).toBe(false)
    expect(isOffSeasonWeek(49)).toBe(true)
    expect(isOffSeasonWeek(50)).toBe(true)
    expect(isOffSeasonWeek(51)).toBe(true)
    expect(isOffSeasonWeek(52)).toBe(false) // year 1 begins fresh
  })

  it('repeats every WEEKS_PER_YEAR weeks (every season year gets the same 3-week gap)', () => {
    for (let year = 0; year < 5; year++) {
      const base = year * WEEKS_PER_YEAR
      for (let off = 0; off < WEEKS_PER_YEAR - OFF_SEASON_WEEKS; off++) {
        expect(isOffSeasonWeek(base + off)).toBe(false)
      }
      for (let off = WEEKS_PER_YEAR - OFF_SEASON_WEEKS; off < WEEKS_PER_YEAR; off++) {
        expect(isOffSeasonWeek(base + off)).toBe(true)
      }
    }
  })
})

describe('buildSeason — off-season carries no events (Round 5 items 16/21)', () => {
  it('never places an event in an off-season week, over many seeds/years', () => {
    for (let year = 0; year < 6; year++) {
      for (let s = 0; s < 10; s++) {
        const events = buildSeason(`off-${year}-${s}`, year * 52, 52)
        for (const e of events) expect(isOffSeasonWeek(e.week)).toBe(false)
      }
    }
  })

  it('tier counts are unaffected by the reserved off-season weeks', () => {
    const events = buildSeason('off-counts', 0, 52)
    expect(countByTier(events)).toEqual(SEASON_COUNTS)
  })
})

describe("buildSeason — a career's first season never opens already-closed (round-5 item 2)", () => {
  it('places no first-block event before week 3, so every entry deadline is >= 1', () => {
    // Many seeds: the earliest event must never carry a deadline in the past at week 0.
    for (let s = 0; s < 40; s++) {
      const events = buildSeason(`first-${s}`, 0, 52)
      for (const e of events) {
        expect(e.week).toBeGreaterThanOrEqual(3)
        expect(e.deadlineWeek).toBeGreaterThanOrEqual(1)
      }
    }
  })

  it('still yields the full first-season counts inside the floored window', () => {
    expect(countByTier(buildSeason('first-counts', 0, 52))).toEqual(SEASON_COUNTS)
  })

  it('does NOT floor later year-blocks (they already start at 52, 104, …)', () => {
    const events = buildSeason('later', 52, 52)
    expect(Math.min(...events.map((e) => e.week))).toBeGreaterThanOrEqual(52)  })
})

describe('buildSeason — travel sits in a per-trip corridor by family background (Part B / increment 2)', () => {
  it('each background stays within its corridor of the SAME base draw; working < middle < wealthy per trip', () => {
    const seedStr = 'travel-bg'
    const working = buildSeason(seedStr, 0, 52, 'working')
    const middle = buildSeason(seedStr, 0, 52, 'middle')
    const wealthy = buildSeason(seedStr, 0, 52, 'wealthy')
    const baseline = buildSeason(seedStr, 0, 52) // no background arg ⇒ middle, identical corridor

    // Only travelCostCents changes – the schedule (weeks/tiers/surfaces) is background-independent.
    expect(middle.map((e) => e.week)).toEqual(working.map((e) => e.week))
    expect(middle.map((e) => e.tier)).toEqual(wealthy.map((e) => e.tier))
    expect(middle.map((e) => e.surface)).toEqual(working.map((e) => e.surface))
    expect(middle.map((e) => e.travelCostCents)).toEqual(baseline.map((e) => e.travelCostCents))

    for (let i = 0; i < middle.length; i++) {
      const e = middle[i]
      // Same underlying base draw flows through each corridor factor: recovering base = travel/factor
      // must agree across the three backgrounds (within the ±0.5-cent rounding of Math.round), i.e.
      // each background's factored travel really is "its corridor of the base".
      const baseW = working[i].travelCostCents / travelFactor(seedStr, e, 'working')
      const baseM = middle[i].travelCostCents / travelFactor(seedStr, e, 'middle')
      const baseWl = wealthy[i].travelCostCents / travelFactor(seedStr, e, 'wealthy')
      expect(Math.abs(baseW - baseM)).toBeLessThan(1)
      expect(Math.abs(baseWl - baseM)).toBeLessThan(1)
      // The corridors are disjoint (≤0.80 < 0.95..1.05 < 1.20≤), so drawn off the same roll the
      // ordering holds per trip, not just on average.
      expect(working[i].travelCostCents).toBeLessThan(middle[i].travelCostCents)
      expect(middle[i].travelCostCents).toBeLessThan(wealthy[i].travelCostCents)
    }

    // And the average ordering working < middle < wealthy holds across the whole schedule.
    const avg = (xs: SeasonEvent[]) => xs.reduce((s, e) => s + e.travelCostCents, 0) / xs.length
    expect(avg(working)).toBeLessThan(avg(middle))
    expect(avg(middle)).toBeLessThan(avg(wealthy))
  })

  it('the base travel draw does not drift, and the corridor factor is applied on top (RNG identity)', () => {
    const seedStr = 'travel-pin'
    const middle = buildSeason(seedStr, 0, 52, 'middle')
    const e0 = middle[0]
    // Recover the base draw from the factored middle value: it must round back to the pinned base,
    // proving the pickInt draw is byte-stable and the corridor factor is exactly makeEvent's.
    const recoveredBase = e0.travelCostCents / travelFactor(seedStr, e0, 'middle')
    expect(Math.round(recoveredBase)).toBe(TRAVEL_PIN_BASE)
    // The factored value itself lies inside middle's corridor of that base.
    const [cLo, cHi] = ECONOMY.travelBgFactor.middle
    expect(e0.travelCostCents).toBeGreaterThanOrEqual(Math.round(TRAVEL_PIN_BASE * cLo))
    expect(e0.travelCostCents).toBeLessThanOrEqual(Math.round(TRAVEL_PIN_BASE * cHi))
  })
})

describe('buildSeason — offset spans', () => {
  it('keeps every event inside [fromWeek, fromWeek + weeks) and counts scale', () => {
    const events = buildSeason('offset-seed', 52, 52)
    for (const e of events) {
      expect(e.week).toBeGreaterThanOrEqual(52)
      expect(e.week).toBeLessThan(104)
    }
    expect(countByTier(events)).toEqual(SEASON_COUNTS)
  })
})
