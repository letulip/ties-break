import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { TIERS, buildSeason, TIER_LADDER, tierFromLabel, isOffSeasonWeek } from '../src/engine/season/calendar'
import { selectEntrants } from '../src/engine/season/tournament'
import { generateCohort } from '../src/engine/season/cohort'
import { rngFromSeed } from '../src/engine/rng'
import { ECONOMY } from '../src/engine/economy'
import { WIN_IMMUNITY_WEEKS } from '../src/shared/avatarEmotion'
import {
  createWorld,
  enterEvent,
  isTierEligible,
  isTierAgeOpen,
  kidPoints,
  recomputeKidRank,
  availabilityStatus,
  tickWeek,
  skipTournament,
  closeTournament,
  matchDrain,
  financeWindow,
  KID_ID,
  START_AGE_YEARS,
  type WorldState,
} from '../src/engine/world'
import type { AiPlayer, RankingRow, SeasonEvent, TierId } from '../src/engine/season/types'

// ---------------------------------------------------------------------------
// Ladder-up Part B — the J-level family (docs/specs/ladder-up.md + ladder-up-impl.md).
// The inert `itf` tier is replaced by three live junior-tour levels: j30/j60 dense (the
// real tour's bread and butter, 75% of all events) plus a rare prestige j300. Bands
// OVERLAP so there is ALWAYS somewhere to go, and NO J level pays prize money.
// ---------------------------------------------------------------------------

const ALL_TIERS = Object.keys(TIERS) as TierId[]

function countByTier(events: SeasonEvent[]): Record<TierId, number> {
  const c = Object.fromEntries(ALL_TIERS.map((t) => [t, 0])) as Record<TierId, number>
  for (const e of events) c[e.tier]++
  return c
}

describe('L1 — the tier catalogue is the J family (itf is gone)', () => {
  it('has exactly six tiers and no `itf` anywhere', () => {
    expect([...ALL_TIERS].sort()).toEqual(['j30', 'j300', 'j60', 'local', 'national', 'regional'])
    expect(ALL_TIERS).not.toContain('itf')
  })

  it('TIER_LADDER orders the catalogue weakest -> strongest and covers every tier', () => {
    expect([...TIER_LADDER].sort()).toEqual([...ALL_TIERS].sort())
    expect(TIER_LADDER).toEqual(['local', 'regional', 'national', 'j30', 'j60', 'j300'])
  })

  it('every id field equals its record key, and no tier is locked any more', () => {
    for (const [key, def] of Object.entries(TIERS)) {
      expect(def.id).toBe(key)
      expect(def.everyNWeeks).toBeGreaterThan(0)
    }
  })

  it('points array length still matches rounds + 1 for every tier', () => {
    for (const t of Object.values(TIERS)) {
      expect(t.points.length).toBe(Math.log2(t.drawSize) + 1)
    }
  })
})

describe('L2 — the J-level table (spec numbers)', () => {
  it('pins j30 – the dense entry level', () => {
    expect(TIERS.j30.label).toBe('Junior Tour 30')
    expect(TIERS.j30.drawSize).toBe(32)
    expect(TIERS.j30.entryFeeCents).toBe(200_00)
    expect(TIERS.j30.travelCostCents).toEqual([900_00, 2000_00])
    expect(TIERS.j30.everyNWeeks).toBe(2)
    expect(TIERS.j30.minAgeYears).toBe(13)
  })

  it('pins j60 – dense, one step up', () => {
    expect(TIERS.j60.label).toBe('Junior Tour 60')
    expect(TIERS.j60.drawSize).toBe(32)
    expect(TIERS.j60.entryFeeCents).toBe(250_00)
    expect(TIERS.j60.travelCostCents).toEqual([1100_00, 2400_00])
    expect(TIERS.j60.everyNWeeks).toBe(3)
    expect(TIERS.j60.minAgeYears).toBe(13)
  })

  it('pins j300 – rare, prestige', () => {
    expect(TIERS.j300.label).toBe('Junior Tour 300')
    expect(TIERS.j300.drawSize).toBe(32)
    expect(TIERS.j300.entryFeeCents).toBe(400_00)
    expect(TIERS.j300.travelCostCents).toEqual([1600_00, 3200_00])
    expect(TIERS.j300.everyNWeeks).toBe(13)
    expect(TIERS.j300.minAgeYears).toBe(13)
  })

  it('points scale with the level, at the REAL ITF ratios: j60 = 2x j30, j300 = 10x j30', () => {
    // ⚠ RE-AIMED for the two ladders (29.07). Was [400, 240, 140, 70, 30, 0] with the level scaling
    // asserted as x1.5 / x2.5 - our invention. These are ITF Reg 31's own singles rows, and the
    // convention every rung of the real ladder follows is that the GRADE NAME IS THE WINNER'S
    // POINTS. The ratios that fall out are the real ones: j60 is twice a j30 and j300 is TEN times
    // it, where ours paid 2.5x. That inversion is the whole reason for this slice - a flawless
    // season of J30s used to out-score a J300 title 2.4 to 1, so there was never a reason to get on
    // the expensive plane.
    //
    // The last element stays 0 at every rung and that is NOT the ITF table's number: Reg 31's "R32"
    // column means REACHED the round of 32 having won a round, which in a real J300 (draws of
    // 48-64) is a player who has already won. Our draws are 32, so the last finish index IS the
    // first-round loser, and Reg 31(a) pays nobody until they win a main-draw round.
    expect(TIERS.j30.points).toEqual([30, 18, 9, 5, 2, 0])
    expect(TIERS.j60.points).toEqual([60, 36, 18, 10, 5, 0])
    expect(TIERS.j300.points).toEqual([300, 210, 140, 100, 60, 0])
    expect(TIERS.j60.points[0]).toBe(TIERS.j30.points[0] * 2)
    expect(TIERS.j300.points[0]).toBe(TIERS.j30.points[0] * 10)
    // ...and the compression the real ladder has and ours never did: a title is worth FEWER single
    // wins as you climb. At j30 the title is 15 wins; at j300 it is 5.
    const titleOverOneWin = (t: 'j30' | 'j60' | 'j300') =>
      TIERS[t].points[0] / TIERS[t].points[TIERS[t].points.length - 2]
    expect(titleOverOneWin('j30')).toBeGreaterThan(titleOverOneWin('j60'))
    expect(titleOverOneWin('j60')).toBeGreaterThan(titleOverOneWin('j300'))
  })
})

describe('L3 — NO prize money at any level (juniors pay to play)', () => {
  it('no tier carries a prize field and the engine has no prize payout', () => {
    for (const t of Object.values(TIERS)) {
      expect(Object.keys(t)).not.toContain('prizeCents')
      expect(Object.keys(t)).not.toContain('prizeMoneyCents')
    }
    const src = readFileSync(new URL('../src/engine/world.ts', import.meta.url), 'utf8')
    expect(src).not.toMatch(/prize\w*Cents/)
  })

  it('a J-level week banks points but is pure OUTGOING money (entry + travel, no payout)', () => {
    // Walk seeds until one actually reaches the J30 week healthy – an injury before the event
    // auto-withdraws the entry (Season-Life slice C), and which seed does that is not the point here.
    let world: WorldState | undefined
    let played: SeasonEvent | undefined
    for (let i = 0; i < 25 && !world; i++) {
      const w = createWorld(`no-prize-${i}`)
      // Put her deep into the J band and drop her onto a j30 week.
      w.results.push({ playerId: KID_ID, week: 0, points: 1200, tier: 'national' })
      w.fundsCents = 500_000_00
      const j30 = w.season.find((e) => e.tier === 'j30' && e.deadlineWeek >= w.week)
      if (!j30) continue
      enterEvent(w, j30.id)
      const rng = rngFromSeed(w.seed)
      while (w.week < j30.week) tickWeek(w, rng)
      if (!w.pendingTournament) continue
      // ⚠ WIDENED by the random-draw change (28.07): she used to meet the top seed in every first
      // round, which meant a predictable early exit – and a first-round loss banks NO points
      // (wave B). Now the draw is random, so the seed walk also has to find a run she actually
      // SCORED in, or the "she banked points" assertion below is a coin flip. Resolving the run
      // inside the walk is the only way to know.
      skipTournament(w)
      closeTournament(w)
      if (!w.results.some((r) => r.playerId === KID_ID && r.week === j30.week)) continue
      world = w
      played = j30
    }
    expect(world, 'no seed in 25 produced a scoring J30 run').toBeTruthy()
    const week = financeWindow(world!.financeWeeks, played!.week).byCategory
    // travel is charged, and the ONLY positive buckets a J week may show are the parent's
    // contribution and savings interest – there is no prize bucket at any junior level.
    expect(week.travel).toBeLessThan(0)
    for (const [cat, amt] of Object.entries(week)) {
      if ((amt ?? 0) > 0) expect(['income', 'interest', 'sponsor']).toContain(cat)
    }
    // ...and she DID bank ranking points for the run.
    expect(world!.results.some((r) => r.playerId === KID_ID && r.week === played!.week)).toBe(true)
  })
})

describe('L4 — the overlapping ladder: there is ALWAYS somewhere to go', () => {
  it('pins the DOMESTIC bands, and the international rungs gate on rank instead', () => {
    // ⚠ RE-AIMED for the two ladders. The point bands are a DOMESTIC instrument now and they did
    // not move, because the domestic point tables did not move either. The J rungs left the band
    // system entirely: an international entry is an ACCEPTANCE LIST, read off her ITF rank - the
    // same signal `entrantPctBand` already uses to pick the AI field, which is what finally makes
    // both sides of one event obey one rule (docs/specs/rank-plateau.md 2b).
    expect(TIERS.local.enterPointBand).toEqual([0, 85])
    expect(TIERS.regional.enterPointBand).toEqual([65, 230])
    expect(TIERS.national.enterPointBand).toEqual([150, Number.MAX_SAFE_INTEGER])
    // j30 is OPEN - the research is explicit that an unranked thirteen-year-old near home gets into
    // one, and that the gate up the ladder is the queue rather than the fee.
    expect(TIERS.j30.enterRank).toBeUndefined()
    expect(TIERS.j60.enterRank).toBe(120)
    expect(TIERS.j300.enterRank).toBe(50)
    // ...and the acceptance lists tighten as you climb, which is the ladder.
    expect(TIERS.j300.enterRank!).toBeLessThan(TIERS.j60.enterRank!)
  })

  it('every point total 0..5000 keeps at least one tier open – no gap, ever', () => {
    for (let pts = 0; pts <= 5000; pts++) {
      expect(ALL_TIERS.some((t) => isTierEligible(t, pts))).toBe(true)
    }
  })

  it('from 150 points up, at least TWO tiers are open at once (the handover overlaps)', () => {
    for (let pts = 150; pts <= 5000; pts++) {
      const open = ALL_TIERS.filter((t) => isTierEligible(t, pts))
      expect(open.length).toBeGreaterThanOrEqual(2)
    }
  })

  it('the DOMESTIC ladder opens in order and nothing above national ever closes', () => {
    // ⚠ RE-AIMED: "opens in order" was a statement about one ladder. There are two, and only the
    // domestic one is ordered by points - the J rungs are ordered by acceptance list instead (see
    // the band test above), so asserting a points ordering across all six now asserts nothing.
    const domestic: TierId[] = ['local', 'regional', 'national']
    const opensAt = (t: TierId) => TIERS[t].enterPointBand[0]
    for (let i = 1; i < domestic.length; i++) {
      expect(opensAt(domestic[i])).toBeGreaterThan(opensAt(domestic[i - 1]))
    }
    for (const t of ['national', 'j30', 'j60', 'j300'] as TierId[]) {
      expect(TIERS[t].enterPointBand[1]).toBe(Number.MAX_SAFE_INTEGER)
    }
  })
})

describe('L5 — the calendar densifies (J30/J60 are the bread and butter)', () => {
  const events = buildSeason('ladder-struct', 0, 52)

  it('yields the per-tier season counts, with j30+j60 the clear majority of J events', () => {
    const counts = countByTier(events)
    expect(counts).toEqual({ local: 26, regional: 13, national: 6, j30: 26, j60: 17, j300: 4 })
    const jTotal = counts.j30 + counts.j60 + counts.j300
    expect((counts.j30 + counts.j60) / jTotal).toBeGreaterThan(0.75)
  })

  it('never schedules two events of the SAME tier in one week (ids stay unique)', () => {
    const seen = new Set<string>()
    for (const e of events) {
      expect(e.id).toBe(`${Math.floor(e.week / 52)}-w${e.week}-${e.tier}`)
      expect(seen.has(e.id)).toBe(false)
      seen.add(e.id)
    }
  })

  // The event id is not just a label any more: it KEYS the tournament's RNG stream
  // (`seed:aitour:<id>` for the AI bracket, `seed:kidtour:<id>` for the kid's). Two events sharing
  // an id would silently share a stream, so uniqueness has to hold across the whole LIVE calendar –
  // multi-event weeks and every year-block a long career generates, not just one 52-week span.
  it('event ids stay globally unique over a multi-year live calendar (they key an RNG stream)', () => {
    const world = createWorld('id-uniqueness')
    const rng = rngFromSeed(world.seed)
    const idOf = new Map<string, string>() // id -> "week:tier" that first claimed it
    const collect = () => {
      for (const e of world.season) {
        const key = `${e.week}:${e.tier}`
        const prior = idOf.get(e.id)
        if (prior === undefined) idOf.set(e.id, key)
        else expect(prior).toBe(key) // same id ⇒ must be the same event, never a second one
      }
    }
    collect()
    for (let i = 0; i < 260; i++) {
      tickWeek(world, rng)
      collect()
    }
    // Five seasons' worth of distinct events actually got generated (not a vacuous pass), and a
    // week really does carry several of them.
    expect(idOf.size).toBeGreaterThan(400)
    const perWeek = new Map<string, number>()
    for (const key of idOf.values()) {
      const week = key.split(':')[0]
      perWeek.set(week, (perWeek.get(week) ?? 0) + 1)
    }
    expect([...perWeek.values()].some((n) => n > 1)).toBe(true)
  })

  it('DOES stack different tiers in a week – that is the CHOICE the owner asked for', () => {
    const perWeek = new Map<number, number>()
    for (const e of events) perWeek.set(e.week, (perWeek.get(e.week) ?? 0) + 1)
    expect([...perWeek.values()].some((n) => n > 1)).toBe(true)
    // ...and, because equal-cadence rungs are phase-staggered rather than piled on the same weeks,
    // essentially every playable week of the season carries something to enter.
    const playable = 52 - 3 /* off-season */ - 3 /* the floored first weeks */
    expect(perWeek.size).toBeGreaterThanOrEqual(playable - 1)
  })

  it('still keeps the off-season empty and the first block floored at week 3', () => {
    for (const e of events) {
      expect(isOffSeasonWeek(e.week)).toBe(false)
      expect(e.week).toBeGreaterThanOrEqual(3)
      expect(e.deadlineWeek).toBe(e.week - 2)
    }
  })

  it('R9-20: national densifies in the season SECOND half', () => {
    const nat = events.filter((e) => e.tier === 'national').map((e) => e.week)
    expect(nat.length).toBe(6)
    expect(nat.filter((w) => w >= 26).length).toBeGreaterThan(nat.filter((w) => w < 26).length)
  })

  it('holds for later year-blocks too', () => {
    const later = buildSeason('ladder-later', 52, 52)
    expect(countByTier(later)).toEqual({ local: 26, regional: 13, national: 6, j30: 26, j60: 17, j300: 4 })
    for (const e of later) expect(e.week).toBeGreaterThanOrEqual(52)
  })
})

describe('L6 — AI entrant fields step UP the ladder', () => {
  const cohort = generateCohort('ladder-field')
  // Standings position = array order, so percentile == (index + 1) / size.
  const ranking: RankingRow[] = cohort.map((p, i) => ({ playerId: p.id, points: cohort.length - i, rank: i + 1 }))
  const posOf = new Map(cohort.map((p, i) => [p.id, i]))
  const ev = (tier: TierId): SeasonEvent => ({
    id: `0-w10-${tier}`,
    week: 10,
    tier,
    surface: 'hard',
    travelCostCents: 100_00,
    deadlineWeek: 8,
  })
  const meanPos = (entrants: AiPlayer[]) =>
    entrants.reduce((s, p) => s + posOf.get(p.id)!, 0) / entrants.length

  it('every tier fills its draw from inside its own percentile window', () => {
    for (const tier of ALL_TIERS) {
      const entrants = selectEntrants(ev(tier), cohort, ranking, rngFromSeed(`f-${tier}`))
      expect(entrants.length).toBe(TIERS[tier].drawSize)
      const [lo, hi] = TIERS[tier].entrantPctBand
      for (const p of entrants) {
        const pct = (posOf.get(p.id)! + 1) / cohort.length
        expect(pct).toBeGreaterThanOrEqual(lo)
        expect(pct).toBeLessThanOrEqual(hi)
      }
      expect(new Set(entrants.map((p) => p.id)).size).toBe(entrants.length)
    }
  })

  it('a higher rung really is a harder field (mean standings position improves up the ladder)', () => {
    const means = TIER_LADDER.map((t) => meanPos(selectEntrants(ev(t), cohort, ranking, rngFromSeed(`m-${t}`))))
    for (let i = 1; i < means.length; i++) expect(means[i]).toBeLessThan(means[i - 1])
  })

  it('every window is wide enough that the field can actually vary', () => {
    for (const tier of ALL_TIERS) {
      const [lo, hi] = TIERS[tier].entrantPctBand
      const candidates = Math.round((hi - lo) * 199)
      expect(candidates).toBeGreaterThan(TIERS[tier].drawSize)
    }
  })
})

describe('L7 — age gate (13+), open immediately at our start age', () => {
  it('the J levels are shut below 13 and open from 13 up; the domestic ladder has no gate', () => {
    for (const t of ['j30', 'j60', 'j300'] as TierId[]) {
      expect(isTierAgeOpen(t, 12)).toBe(false)
      expect(isTierAgeOpen(t, 13)).toBe(true)
      expect(isTierAgeOpen(t, START_AGE_YEARS)).toBe(true)
    }
    for (const t of ['local', 'regional', 'national'] as TierId[]) {
      expect(isTierAgeOpen(t, 8)).toBe(true)
    }
  })

  it('availabilityStatus never blocks a 14-year-old on age (our start is above the gate)', () => {
    const world = createWorld('age-gate')
    for (const e of world.season) {
      const status = availabilityStatus(world, e)
      expect(status.detail ?? '').not.toMatch(/too young/i)
    }
  })
})

describe('L8 — she can only play ONE tournament a week', () => {
  it('a second entry in the same week is refused (and the first stands)', () => {
    const world = createWorld('one-per-week')
    // One-per-week is a CALENDAR rule, so the fixture has to clear every other gate first – and
    // since the two ladders (docs/specs/two-ladders.md) that is two piles, not one. The domestic
    // book opens the domestic rungs and j30's on-ramp; the international book is what j60 and j300
    // ask for, because they read her ITF RANK and refuse to read a position at all until she owns a
    // counting ITF result. The stacked pair this seed finds contains a J60, so without the second
    // pile the FIRST entry was refused and the rule under test was never reached.
    world.results.push({ playerId: KID_ID, week: 0, points: 1500, tier: 'national' })
    for (let i = 0; i < 4; i++) world.results.push({ playerId: KID_ID, week: 0, points: 300, tier: 'j300' })
    recomputeKidRank(world)
    world.fundsCents = 500_000_00
    const byWeek = new Map<number, SeasonEvent[]>()
    for (const e of world.season) {
      if (e.deadlineWeek < world.week) continue
      byWeek.set(e.week, [...(byWeek.get(e.week) ?? []), e])
    }
    const stacked = [...byWeek.values()].find((list) => list.length > 1)!
    expect(stacked).toBeTruthy()
    enterEvent(world, stacked[0].id)
    expect(() => enterEvent(world, stacked[1].id)).toThrow(/already entered in a tournament that week/i)
    expect(world.entries).toEqual([stacked[0].id])
  })
})

describe('L9 — the ECONOMY ripple covers every tier', () => {
  it('minConditionToEnter and tierMatchFatigue are exhaustive and rise up the ladder', () => {
    for (const key of ['minConditionToEnter'] as const) {
      const table = ECONOMY.availability[key] as Record<TierId, number>
      expect(Object.keys(table).sort()).toEqual([...ALL_TIERS].sort())
      for (let i = 1; i < TIER_LADDER.length; i++) {
        expect(table[TIER_LADDER[i]]).toBeGreaterThan(table[TIER_LADDER[i - 1]])
      }
    }
    const fatigue = ECONOMY.condition.tierMatchFatigue as Record<TierId, number>
    expect(Object.keys(fatigue).sort()).toEqual([...ALL_TIERS].sort())
    for (let i = 1; i < TIER_LADDER.length; i++) {
      expect(fatigue[TIER_LADDER[i]]).toBeGreaterThan(fatigue[TIER_LADDER[i - 1]])
    }
  })

  it('matchDrain extrapolates above national for the J levels', () => {
    // ⚠ RE-PINNED +1 each 26.07 (MATCH BASE RAISE, straightSets 1 → 2): the J extrapolation itself
    // is untouched – tierMatchFatigue is unchanged and the +1-per-rung shape is what this test is
    // about. Only the base under it moved, so every cell went up by exactly one.
    expect(matchDrain('national', '6-4 6-2')).toBe(4) // 2 + 2
    expect(matchDrain('j30', '6-4 6-2')).toBe(5) // 2 + 3 (was the itf pin)
    expect(matchDrain('j60', '6-4 6-2')).toBe(6)
    expect(matchDrain('j300', '6-4 6-2')).toBe(7)
  })

  it('WIN_IMMUNITY_WEEKS covers every tier (avatar emotion)', () => {
    expect(Object.keys(WIN_IMMUNITY_WEEKS).sort()).toEqual([...ALL_TIERS].sort())
  })
})

describe('L10 — UI surfaces cover the whole catalogue and stay fiction-safe', () => {
  const read = (rel: string) => readFileSync(new URL(rel, import.meta.url), 'utf8')

  it('TierGuide renders the whole ladder and the Home strip names every rung', () => {
    const guide = read('../src/components/TierGuide.vue')
    expect(guide).toContain('TIER_LADDER') // derived from the catalogue, never a hand-kept list
    expect(guide).not.toContain("'itf'")
    const home = read('../src/components/screens/HomeScreen.vue')
    for (const t of ALL_TIERS) expect(home).toContain(`'${t}'`)
    expect(home).not.toContain("'itf'")
  })

  it('player-facing copy drops the ITF trademark and keeps the short dash', () => {
    for (const rel of [
      '../src/components/TierGuide.vue',
      '../src/components/screens/HomeScreen.vue',
      '../src/components/screens/SeasonScreen.vue',
    ]) {
      const src = read(rel)
      expect(src).not.toMatch(/\bITF\b/) // fictional analogues only – ITF is a trademark
      expect(src.includes('—')).toBe(false) // short dash only
      // No Cyrillic in RENDERED copy. Script comments legitimately quote the owner in Russian
      // (the existing convention across the engine), so only the template is checked.
      const template = src.slice(src.indexOf('<template>'))
      expect(template).not.toMatch(/[Ѐ-ӿ]/)
    }
  })

  it('tierFromLabel resolves a summary line even though "Junior Tour 30" prefixes "Junior Tour 300"', () => {
    const labels = ALL_TIERS.map((t) => TIERS[t].label)
    expect(new Set(labels).size).toBe(labels.length)
    // The trap: j30's label IS a prefix of j300's, so a first-match scan mis-credits every J300.
    expect(TIERS.j300.label.startsWith(TIERS.j30.label)).toBe(true)
    for (const t of ALL_TIERS) {
      expect(tierFromLabel(`${TIERS[t].label} (hard, W12): Mirra – Champion (+1 pts)`)).toBe(t)
    }
    expect(tierFromLabel('Something else entirely')).toBeUndefined()
  })
})

describe('L11 — the whole career still runs (integration smoke)', () => {
  it('a 156-week career climbs the ladder and books J-level entries', () => {
    const world: WorldState = createWorld('ladder-smoke')
    const rng = rngFromSeed(world.seed)
    const entered = new Set<TierId>()
    for (let i = 0; i < 156; i++) {
      // Pretend she is elite: one huge counting result a week keeps her inside every top band, so
      // this measures pure CALENDAR reach (does the J family actually turn up and stay enterable?)
      // rather than re-testing the points ladder.
      world.results.push({ playerId: KID_ID, week: world.week, points: 5000, tier: 'j300' })
      for (const e of world.season) {
        if (world.entries.includes(e.id)) continue
        if (world.week > e.deadlineWeek || e.deadlineWeek - world.week > 3) continue
        if (world.season.some((x) => x.week === e.week && world.entries.includes(x.id))) continue
        if (!isTierEligible(e.tier, kidPoints(world, 'domestic'))) continue
        if (availabilityStatus(world, e).level === 'blocked') continue
        world.fundsCents = 500_000_00
        enterEvent(world, e.id)
        entered.add(e.tier)
      }
      tickWeek(world, rng)
      if (world.pendingTournament) {
        // fast-forward the reveal exactly like the benches do
        skipTournament(world)
        closeTournament(world)
      }
    }
    expect(entered.has('j30')).toBe(true)
    expect(entered.has('j60')).toBe(true)
    expect(entered.has('j300')).toBe(true)
  })
})
