import { describe, it, expect } from 'vitest'
import {
  selectEntrants,
  resolveDoubleBookings,
  runTournament,
  standardSeedOrder,
  isEntrantBand,
  topBandForPercentile,
  weekFieldExclusion,
  JUNIOR_TOUR,
} from '../../src/engine/season/tournament'
import { TIERS, TIER_LADDER, isTierAgeOpen } from '../../src/engine/season/calendar'
import { fieldProsFor, mergedWtaRanking, universeForTier } from '../../src/engine/season/fieldPros'
import { generateCohort } from '../../src/engine/season/cohort'
import { rngFromSeed } from '../../src/engine/rng'
import { simulateMatch } from '../../src/engine/match/engine'
import type { AiPlayer, RankingRow, SeasonEvent, TierId } from '../../src/engine/season/types'
import type { MatchPlayer, Surface } from '../../src/engine/match/types'
import { rivalGroundstrokes } from '../../src/engine/season/rival'

// ⚠ A COHORT ROW IS NO LONGER A `MatchPlayer` (v25). `AiPlayer` is now
// `Omit<MatchPlayer, 'groundstrokes'>` on purpose: a rival does not STORE the fifth attribute,
// because `driftCohort`'s four main-stream draws per player are what the frozen capture is made of,
// so her groundstroke is derived at match time. This helper is the same derivation production uses
// (`rivalMatchPlayer`, minus the surface and condition scaling these bracket tests deliberately do
// without), so what goes into the draw here is what would go into a real one.
const asField = (ps: AiPlayer[]): MatchPlayer[] =>
  ps.map((p) => ({ ...p, groundstrokes: rivalGroundstrokes(p) }))

function ev(tier: TierId, week: number, surface: Surface = 'hard'): SeasonEvent {
  return { id: `0-w${week}-${tier}`, week, tier, surface, travelCostCents: 100_00, deadlineWeek: week - 2 }
}

// Rank the cohort by array order: cohort[i] gets rank i+1.
function rankByOrder(cohort: AiPlayer[]): RankingRow[] {
  return cohort.map((p, i) => ({ playerId: p.id, points: cohort.length - i, rank: i + 1 }))
}

function kidPlayer(): MatchPlayer {
  return { id: 'kid', name: 'The Kid', serve: 52, ret: 50, composure: 55, stamina: 54, groundstrokes: 51 }
}

const cohort = generateCohort('tourney-cohort', 199)
const ranking = rankByOrder(cohort)

describe('standardSeedOrder — seeded bracket', () => {
  it('is a permutation of 1..n with the top two seeds in opposite halves', () => {
    for (const n of [8, 16, 32]) {
      const order = standardSeedOrder(n)
      expect(order.length).toBe(n)
      expect([...order].sort((a, b) => a - b)).toEqual(Array.from({ length: n }, (_, i) => i + 1))
      const half = n / 2
      const posOf = (seed: number) => order.indexOf(seed)
      expect(posOf(1)).toBeLessThan(half) // seed 1 in the first half
      expect(posOf(2)).toBeGreaterThanOrEqual(half) // seed 2 in the second half
    }
  })
})

// RE-PINNED by ladder-up Part B. `bandForPercentile` (one tier per player: top 25% national,
// next regional, rest local) is gone. Six tiers over a 199-strong cohort cannot be partitioned –
// four of them are 32-draws, so disjoint bands would leave ~33 candidates each and every J300
// would run with the same 32 players. Entrant windows now OVERLAP per tier (TierDef.entrantPctBand),
// mirroring the kid's overlapping enterPointBand, and `topBandForPercentile` names a player's
// strongest rung (which is what the cohort pre-history earns its results at).
describe('entrant percentile windows', () => {
  it('isEntrantBand answers the window inclusively', () => {
    expect(isEntrantBand('local', 0.75)).toBe(true)
    expect(isEntrantBand('local', 0.2)).toBe(false)
    expect(isEntrantBand('j300', 0.1)).toBe(true)
    expect(isEntrantBand('j300', 0.4)).toBe(false)
  })

  it('the windows overlap – a good junior is a candidate for several rungs at once', () => {
    const openAt = (pct: number) => TIER_LADDER.filter((t) => isEntrantBand(t, pct))
    expect(openAt(0.3).length).toBeGreaterThan(1)
    expect(openAt(0.5).length).toBeGreaterThan(1)
  })

  it('topBandForPercentile names the strongest rung a player belongs to', () => {
    expect(topBandForPercentile(0.05)).toBe('j300')
    expect(topBandForPercentile(0.35)).toBe('j60')
    expect(topBandForPercentile(0.5)).toBe('j30')
    expect(topBandForPercentile(0.95)).toBe('local')
  })
})

describe('selectEntrants — percentile bands per tier', () => {
  // ⚠ THE W RUNGS RUN OVER THEIR OWN UNIVERSE (W2-LADDER re-aim; the L6 note in
  // tests/ladder.test.ts carries the whole argument). Their entrant bands are MEASURED against the
  // merged ~500-row population the engine actually hands them (universeForTier: cohort ∪ field
  // pros), and the W2-LADDER windows are tight enough that a bare 199-cohort cannot hold a draw's
  // worth of seventeen-and-overs inside them - the backfill would escape the band and this suite
  // would be asserting a scarcity the real path does not have. The junior and domestic rungs keep
  // the bare-cohort fixture they always had.
  const pros = fieldProsFor('tourney-cohort', 0, cohort.map((p) => p.name))
  const wUniverse = universeForTier('w15', cohort, pros)
  const wRanking = rankByOrder(wUniverse)
  const isW = (tier: TierId) => TIERS[tier].track === 'wta'

  for (const tier of TIER_LADDER) {
    it(`${tier}: fills to drawSize with in-band players, seeded by rank`, () => {
      const universe = isW(tier) ? wUniverse : cohort
      const table = isW(tier) ? wRanking : ranking
      const total = table.length
      const rankOf = new Map(table.map((r) => [r.playerId, r.rank]))
      const entrants = selectEntrants(ev(tier, 10), universe, table, rngFromSeed(`sel-${tier}`))
      expect(entrants.length).toBe(TIERS[tier].drawSize)
      const ranks = entrants.map((p) => rankOf.get(p.id)!)
      for (const rank of ranks) expect(isEntrantBand(tier, rank / total), tier).toBe(true)
      // entrants are returned in seed order = ascending rank
      expect(ranks).toEqual([...ranks].sort((a, b) => a - b))
      // unique entrants
      expect(new Set(entrants.map((p) => p.id)).size).toBe(entrants.length)
    })
  }

  it('is deterministic given the same rng seed', () => {
    const a = selectEntrants(ev('regional', 10), cohort, ranking, rngFromSeed('same'))
    const b = selectEntrants(ev('regional', 10), cohort, ranking, rngFromSeed('same'))
    expect(a).toEqual(b)
  })
})

// Expected total points a full single-elim draw awards, given TierDef.points.
function expectedTotalPoints(tier: TierId): number {
  const pts = TIERS[tier].points
  const rounds = Math.log2(TIERS[tier].drawSize)
  let total = pts[0] // champion
  for (let v = 1; v <= rounds; v++) total += pts[v] * 2 ** (v - 1)
  return total
}

describe('runTournament — bracket integrity', () => {
  for (const tier of ['local', 'regional', 'national'] as const) {
    const event = ev(tier, 12, 'clay')
    const entrants = asField(selectEntrants(event, cohort, ranking, rngFromSeed(`ent-${tier}`)))

    it(`${tier}: drawSize-1 matches, each with a winner from its pairing`, () => {
      const result = runTournament(event, entrants, null, 'W', rngFromSeed(`run-${tier}`))
      expect(result.eventId).toBe(event.id)
      expect(result.matches.length).toBe(TIERS[tier].drawSize - 1)
      for (const m of result.matches) {
        expect([m.aId, m.bId]).toContain(m.winnerId)
        expect(m.aId).not.toBe(m.bId)
      }
    })

    it(`${tier}: finishes cover every entrant, exactly one champion, histogram matches the bracket`, () => {
      const result = runTournament(event, entrants, null, 'W', rngFromSeed(`run2-${tier}`))
      const drawSize = TIERS[tier].drawSize
      const rounds = Math.log2(drawSize)
      expect(Object.keys(result.finishes).length).toBe(drawSize)
      const champions = Object.values(result.finishes).filter((f) => f === 0)
      expect(champions.length).toBe(1)
      // finish histogram: finish 0 → 1, finish v → 2^(v-1)
      const hist: Record<number, number> = {}
      for (const f of Object.values(result.finishes)) {
        expect(f).toBeGreaterThanOrEqual(0)
        expect(f).toBeLessThanOrEqual(rounds)
        hist[f] = (hist[f] ?? 0) + 1
      }
      expect(hist[0]).toBe(1)
      for (let v = 1; v <= rounds; v++) expect(hist[v]).toBe(2 ** (v - 1))
      // champion = winner of the final (the single round rounds-1 match)
      const final = result.matches.filter((m) => m.round === rounds - 1)
      expect(final.length).toBe(1)
      const championId = Object.keys(result.finishes).find((id) => result.finishes[id] === 0)
      expect(final[0].winnerId).toBe(championId)
    })

    it(`${tier}: total awarded points equal the tier's structural total`, () => {
      const result = runTournament(event, entrants, null, 'W', rngFromSeed(`run3-${tier}`))
      const pts = TIERS[tier].points
      let awarded = 0
      for (const id of Object.keys(result.finishes)) awarded += pts[result.finishes[id]]
      expect(awarded).toBe(expectedTotalPoints(tier))
    })

    it(`${tier}: is deterministic given the same rng`, () => {
      const a = runTournament(event, entrants, null, 'W', rngFromSeed(`det-${tier}`))
      const b = runTournament(event, entrants, null, 'W', rngFromSeed(`det-${tier}`))
      expect(a).toEqual(b)
    })
  }
})

describe('runTournament — the kid enters', () => {
  const event = ev('local', 20, 'grass')
  const entrants = asField(selectEntrants(event, cohort, ranking, rngFromSeed('kid-ent')))
  const kid = kidPlayer()

  it('keeps the draw at drawSize by bumping the lowest-ranked entrant, kid included', () => {
    const result = runTournament(event, entrants, kid, 'world-seed', rngFromSeed('kid-run'))
    expect(Object.keys(result.finishes)).toContain('kid')
    expect(Object.keys(result.finishes).length).toBe(TIERS.local.drawSize)
    // the lowest-ranked entrant (last in seed order) was bumped out
    const bumped = entrants[entrants.length - 1].id
    expect(Object.keys(result.finishes)).not.toContain(bumped)
  })

  it("kid's matches carry a seed + score and reproduce via simulateMatch", () => {
    const result = runTournament(event, entrants, kid, 'world-seed', rngFromSeed('kid-run'))
    const lookup = (id: string): MatchPlayer =>
      id === kid.id ? kid : entrants.find((p) => p.id === id)!
    const kidMatches = result.matches.filter((m) => m.aId === kid.id || m.bId === kid.id)
    expect(kidMatches.length).toBeGreaterThanOrEqual(1)
    for (const m of kidMatches) {
      expect(m.seed).toBeTruthy()
      expect(m.score).toBeTruthy()
      const a = lookup(m.aId)
      const b = lookup(m.bId)
      const replay = simulateMatch(a, b, { surface: event.surface, tour: JUNIOR_TOUR, seed: m.seed! })
      const replayWinner = replay.winner === 0 ? m.aId : m.bId
      expect(replayWinner).toBe(m.winnerId)
      expect(replay.sets.map((s) => `${s.a}-${s.b}`).join(' ')).toBe(m.score)
    }
  })

  it('AI-AI matches never carry a seed or score', () => {
    const result = runTournament(event, entrants, kid, 'world-seed', rngFromSeed('kid-run'))
    for (const m of result.matches) {
      if (m.aId !== kid.id && m.bId !== kid.id) {
        expect(m.seed).toBeUndefined()
        expect(m.score).toBeUndefined()
      }
    }
  })
})

// ---------------------------------------------------------------------------
// ONE BODY, ONE WEEK — `resolveDoubleBookings` (fix/no-double-booking, 31.07).
//
// The owner: «они физически не могут сразу везде играть, ведь так?» They cannot, and until this
// rule existed nothing said so: `selectEntrants` is called once per event with no idea the other
// events exist, so the same rival was drawn into two of the same week's tournaments and played
// both. Measured on the live engine before the fix (tools/double-booked.ts, 6 careers x 156 weeks,
// counted off the results ledger): 14,381 of 45,675 player-weeks in a draw played twice — 31.5% —
// creating 17,301 appearances that no calendar week contains.
//
// These tests pin the RULE. The engine-level property ("no rival holds two rows for one week") is
// pinned in tests/rivals.test.ts C4, against a real career.
describe('resolveDoubleBookings — a rival cannot be in two of a week\'s draws', () => {
  const week = 12
  const drawFor = (tier: TierId) => ({
    event: ev(tier, week),
    entrants: selectEntrants(ev(tier, week), cohort, ranking, rngFromSeed(`wk-${tier}`)),
  })
  const posOf = new Map(ranking.map((r, i) => [r.playerId, i]))
  const pos = (id: string) => posOf.get(id) ?? ranking.length - 1

  it('the raw draws DO collide – the input to the rule is real, not a straw man', () => {
    const a = drawFor('j60')
    const b = drawFor('j30')
    const overlap = a.entrants.filter((p) => b.entrants.some((q) => q.id === p.id))
    expect(overlap.length).toBeGreaterThan(0)
  })

  it('no player appears twice, and every draw is still full and still in standings order', () => {
    const drawn = [drawFor('j60'), drawFor('j30'), drawFor('local')]
    const fields = resolveDoubleBookings(drawn, cohort, ranking)
    const seen = new Set<string>()
    for (const { event } of drawn) {
      const field = fields.get(event.id)!
      expect(field).toHaveLength(TIERS[event.tier].drawSize)
      // ...and `buildDraw` seeds off standings order, so the contract selectEntrants gives it holds
      expect(field.map((p) => pos(p.id))).toEqual([...field.map((p) => pos(p.id))].sort((a, b) => a - b))
      for (const p of field) {
        expect(seen.has(p.id), `${p.id} is in two draws`).toBe(false)
        seen.add(p.id)
      }
    }
  })

  it('the HIGHER TIER keeps her: the strongest rung plays exactly the field it drew', () => {
    // ...whichever order the events arrive in, because the rule sorts by TIER_LADDER itself rather
    // than trusting buildSeason's strongest-first emission order to stay that way.
    const j60 = drawFor('j60')
    const j30 = drawFor('j30')
    for (const order of [[j60, j30], [j30, j60]]) {
      const fields = resolveDoubleBookings(order, cohort, ranking)
      expect(fields.get(j60.event.id)!.map((p) => p.id)).toEqual(j60.entrants.map((p) => p.id))
      // ...and the weaker rung is the one that gives ground
      const lost = j30.entrants.filter((p) => j60.entrants.some((q) => q.id === p.id))
      expect(lost.length).toBeGreaterThan(0)
      for (const p of lost) expect(fields.get(j30.event.id)!.some((q) => q.id === p.id)).toBe(false)
    }
  })

  it('the loser backfills with the NEXT ELIGIBLE CANDIDATE BY STANDINGS POSITION – never a new draw', () => {
    const j60 = drawFor('j60')
    const j30 = drawFor('j30')
    const fields = resolveDoubleBookings([j60, j30], cohort, ranking)
    const kept = new Set(j30.entrants.map((p) => p.id))
    const booked = new Set(fields.get(j60.event.id)!.map((p) => p.id))
    const added = fields.get(j30.event.id)!.filter((p) => !kept.has(p.id))
    expect(added.length).toBeGreaterThan(0)
    // exactly the best-standing players who were free – the same tie-break selectEntrants' own two
    // backfills use, so a slot vacated by this rule is filled by the kind of player it would have been
    // ⚠ RE-AIMED AT THE round-20 MERGE, and the RULE did not move - the definition of "free" did.
    // `maxAgeYears: 18` landed on the J rungs in the same merge, so `isTierAgeOpen` now refuses a
    // nineteen-year-old for a J30 the way it always refused a twelve-year-old. The resolver honours
    // that (it inherits the same predicate); this expectation did not, so it asked for a backfill
    // list containing players the engine is correct to skip. A player who cannot enter the tier was
    // never "free" for it - the test was simply written before the ceiling existed.
    const free = cohort
      .filter((p) => !booked.has(p.id) && !kept.has(p.id) && isTierAgeOpen(j30.event.tier, p.ageYears))
      .sort((a, b) => pos(a.id) - pos(b.id))
      .slice(0, added.length)
    expect([...added].sort((a, b) => pos(a.id) - pos(b.id)).map((p) => p.id)).toEqual(free.map((p) => p.id))
  })

  it('a one-event week is returned UNTOUCHED – the engine cannot move on a week that cannot collide', () => {
    const only = drawFor('j300')
    const fields = resolveDoubleBookings([only], cohort, ranking)
    expect(fields.get(only.event.id)).toEqual([...only.entrants])
  })

  it('it is deterministic and takes NO Rng – the frozen MAIN capture cannot move through it', () => {
    // The whole design constraint of the fix, asserted structurally rather than trusted: this is
    // post-draw arithmetic. `selectEntrants` spends one main-... one SUB-stream draw per candidate and
    // that count must not depend on which events came earlier in the week, so the rule may not touch
    // the pool before the draw and may not draw anything of its own.
    expect(String(resolveDoubleBookings)).not.toMatch(/\brng\b/i)
    const drawn = [drawFor('j60'), drawFor('j30')]
    const once = resolveDoubleBookings(drawn, cohort, ranking)
    const twice = resolveDoubleBookings(drawn, cohort, ranking)
    for (const { event } of drawn) {
      expect(once.get(event.id)!.map((p) => p.id)).toEqual(twice.get(event.id)!.map((p) => p.id))
    }
  })

  it('honours the AGE GATE it inherits: a backfill never puts a child in an adult draw', () => {
    // The same rule `selectEntrants` states as "it is the universe and not just the band" – an age
    // rule a backfill can walk around is no rule at all. W15/W35 are 16+, W100 is 17+.
    const drawn = [drawFor('w100'), drawFor('w35'), drawFor('w15')]
    const fields = resolveDoubleBookings(drawn, cohort, ranking)
    const ageOf = new Map(cohort.map((p) => [p.id, p.ageYears]))
    for (const { event } of drawn) {
      const min = TIERS[event.tier].minAgeYears!
      for (const p of fields.get(event.id)!) expect(ageOf.get(p.id)!, `${p.id} in a ${event.tier}`).toBeGreaterThanOrEqual(min)
    }
  })
})

// =================================================================================================
// WEEK EXCLUSIVITY ON THE W TRACK (W2-FIELD2, act2-pro-tour.md §8.2) – «one pro plays one event a
// week», which is the fact the two-type feed already promises the player about HER.
//
// Why it needs its own guard rather than riding on `resolveDoubleBookings` above: that rule is
// post-draw arithmetic over the CANONICAL brackets and the LIVE cohort, and a field pro is in
// neither. Her shadow draws and the Season card's previews are the only place the merged universe
// exists, and there the two rungs' fields come from two independent `selectEntrants` calls that
// never meet. So the higher rung draws first and hands the lower one a list.
// =================================================================================================
describe('weekFieldExclusion — the higher W rung draws first', () => {
  const pros = fieldProsFor('excl-cohort', 0, cohort.map((p) => p.name))
  const universe = universeForTier('w15', cohort, pros)
  // The structure the engine draws against: pros by points, the point-less cohort beneath them.
  const merged = mergedWtaRanking(
    cohort.map((p) => ({ playerId: p.id, points: 0, rank: 1 })),
    pros,
  )
  const SEED = 'excl-seed'
  const week = 10
  /** A week carrying every W rung – the worst case the calendar can build, and the case that shows
   *  the rule is transitive (each rung excludes everyone ABOVE it, not just its immediate senior). */
  const season: SeasonEvent[] = (['w15', 'w35', 'w50', 'w75', 'w100', 'wta125'] as TierId[]).map((t) =>
    ev(t, week),
  )
  const drawWith = (tier: TierId, from: SeasonEvent[] = season) => {
    const e = from.find((x) => x.tier === tier)!
    const excluded = weekFieldExclusion(e, from, universe, merged, SEED)
    return {
      excluded,
      entrants: selectEntrants(e, universe, merged, rngFromSeed(`${SEED}:kidtour:${e.id}`), undefined, excluded),
    }
  }

  it('nobody drawn by a higher rung appears in a lower rung`s field, all the way down the family', () => {
    const seen = new Map<string, TierId>()
    // Strongest first, exactly as the rule resolves them.
    for (const tier of ['wta125', 'w100', 'w75', 'w50', 'w35', 'w15'] as TierId[]) {
      const { entrants } = drawWith(tier)
      expect(entrants).toHaveLength(TIERS[tier].drawSize)
      for (const p of entrants) {
        expect(seen.get(p.id), `${p.id} is in ${seen.get(p.id)} AND ${tier} in the same week`).toBeUndefined()
        seen.set(p.id, tier)
      }
    }
    // Six full draws off one week, and 192 different people played them.
    expect(seen.size).toBe(6 * 32)
  })

  it('the window still FILLS after the exclusion – no draw quietly made of backfill', () => {
    // W100's own band comment records the failure this catches: a "prestige" draw half filled by
    // `selectEntrants`' out-of-window backfill. Exclusivity narrows the window on a shared week, so
    // this is where it would first show.
    for (const tier of ['w15', 'w35', 'w50', 'w75', 'w100', 'wta125'] as TierId[]) {
      const { entrants } = drawWith(tier)
      const [lo, hi] = TIERS[tier].entrantPctBand
      const outOfBand = entrants.filter((p) => {
        const pct = (merged.findIndex((r) => r.playerId === p.id) + 1) / merged.length
        return pct < lo || pct > hi
      })
      expect(outOfBand.map((p) => p.id), `${tier} backfilled`).toEqual([])
      // ...and the age gate is still honoured through the narrower window.
      const min = TIERS[tier].minAgeYears!
      for (const p of entrants) expect(p.ageYears, `${p.id} in ${tier}`).toBeGreaterThanOrEqual(min)
    }
  })

  it('the order is TIER_LADDER, never the calendar`s – a reshuffled week resolves identically', () => {
    const reversed = [...season].reverse()
    for (const tier of ['w15', 'w50', 'w100'] as TierId[]) {
      const a = drawWith(tier, season)
      const b = drawWith(tier, reversed)
      expect([...b.excluded].sort()).toEqual([...a.excluded].sort())
      expect(b.entrants.map((p) => p.id)).toEqual(a.entrants.map((p) => p.id))
    }
  })

  it('scope fence: a non-W event and a lone W event both get the EMPTY set', () => {
    // The six junior/domestic rungs keep LIVE-only universes and are untouched by this wave
    // (living-field.md §8.3 books them for act 3), so the rule refuses them on its first line.
    const mixedWeek: SeasonEvent[] = [ev('j300', week), ev('j60', week), ev('w100', week)]
    for (const tier of ['j300', 'j60'] as TierId[]) {
      const e = mixedWeek.find((x) => x.tier === tier)!
      expect(weekFieldExclusion(e, mixedWeek, universe, merged, SEED).size).toBe(0)
    }
    // ...and a W rung with nothing above it on the week is byte-identical to the pre-rule draw.
    const lone = ev('w15', week)
    expect(weekFieldExclusion(lone, [lone], universe, merged, SEED).size).toBe(0)
    const withRule = selectEntrants(
      lone,
      universe,
      merged,
      rngFromSeed(`${SEED}:kidtour:${lone.id}`),
      undefined,
      weekFieldExclusion(lone, [lone], universe, merged, SEED),
    )
    const without = selectEntrants(lone, universe, merged, rngFromSeed(`${SEED}:kidtour:${lone.id}`))
    expect(withRule.map((p) => p.id)).toEqual(without.map((p) => p.id))
  })

  it('a DIFFERENT week is not touched, and the set is deterministic', () => {
    const other = season.map((e) => ev(e.tier, week + 1))
    const here = weekFieldExclusion(season.find((e) => e.tier === 'w15')!, [...season, ...other], universe, merged, SEED)
    const only = weekFieldExclusion(season.find((e) => e.tier === 'w15')!, season, universe, merged, SEED)
    expect([...here].sort()).toEqual([...only].sort())
    expect([...weekFieldExclusion(season[0], season, universe, merged, SEED)].sort()).toEqual(
      [...weekFieldExclusion(season[0], season, universe, merged, SEED)].sort(),
    )
  })
})
