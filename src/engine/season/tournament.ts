// Package L – single-elimination tournaments. Pure: given the entrants, an
// optional kid, and an RNG, the bracket resolves deterministically. Kid matches
// run the full point engine under an event-scoped seed (replayable); AI-AI matches
// resolve from the closed-form win probability with a single RNG draw.

import { type Rng } from '../rng'
import type { MatchPlayer, Tour } from '../match/types'
import { simulateMatch, fastMatchProbability } from '../match/engine'
import { TIERS, TIER_LADDER } from './calendar'
import type { AiPlayer, MatchRecord, RankingRow, SeasonEvent, TierId, TournamentResult } from './types'

// Junior events run under WTA-average scoring (the project is WTA-first). Fixed so
// stored kid-match seeds reproduce exactly.
export const JUNIOR_TOUR: Tour = 'wta'

// AI entry ambition, by standings PERCENTILE (`(position + 1) / fieldSize`, 0 = best).
//
// Was a partition (top 25% → national, next → regional, rest → local) with exactly one tier per
// player. The J family broke that: six tiers, four of them 32-draws, over a 199-strong cohort
// leaves ~33 candidates per disjoint band – barely more than the draw itself, so every J300 would
// have run with the same 32 players. Windows now OVERLAP (TierDef.entrantPctBand), exactly like
// the kid's `enterPointBand`: a junior is a candidate for several rungs at once and the
// position-biased jitter below decides which draw she actually turns up in.
//
// The candidate COUNT per tier is a constant of the window, because percentiles are derived from
// ORDINAL POSITION and the positions are always a permutation of 0..n-1. That is what keeps
// `selectEntrants`' main-stream draw count independent of the ranking's CONTENT (and therefore of
// the kid's results and of player input) – the property the B1/C1 invariance tests pin.

/** True ⇔ a player at standings percentile `pct` is a candidate for `tier`'s draws. */
export function isEntrantBand(tier: TierId, pct: number): boolean {
  const [lo, hi] = TIERS[tier].entrantPctBand
  return pct >= lo && pct <= hi
}

/** The STRONGEST tier a player at percentile `pct` is a candidate for – her "home" level, used to
 *  give the cohort a coherent pre-history (season/prehistory.ts). Falls back to the entry tier. */
export function topBandForPercentile(pct: number): TierId {
  for (let i = TIER_LADDER.length - 1; i >= 0; i--) {
    if (isEntrantBand(TIER_LADDER[i], pct)) return TIER_LADDER[i]
  }
  return TIER_LADDER[0]
}

// Standard seeded-bracket slot order for a power-of-two draw: slot i holds the
// seed at index i (1-based). Seed 1 and seed 2 land in opposite halves; each round
// pairs adjacent slots. Built by the classic recursive fold.
export function standardSeedOrder(n: number): number[] {
  let seeds = [1, 2]
  while (seeds.length < n) {
    const sum = seeds.length * 2 + 1
    const next: number[] = []
    for (const s of seeds) {
      next.push(s)
      next.push(sum - s)
    }
    seeds = next
  }
  return seeds
}

// selectEntrants – the AI field for an event. Candidates are the cohort players whose standings
// percentile falls inside the tier's (overlapping) entrant window; entry among them is stochastic
// (position-biased) so the field varies, but the returned array is seeded by standings position
// (best first). Exactly one RNG draw per candidate – a fixed pattern given the ranking.
//
// The band is keyed off the player's ORDINAL POSITION in the standings, not the
// dense `rank` field: dense ranks collapse every zero-point player onto a single
// rank number, so `rank / total` would be a meaningless percentile and would herd
// the whole field into one band. Position gives a true 0..1 spread.
export function selectEntrants(
  event: SeasonEvent,
  cohort: AiPlayer[],
  ranking: RankingRow[],
  rng: Rng,
): AiPlayer[] {
  const total = ranking.length || cohort.length
  const posOf = new Map<string, number>()
  ranking.forEach((r, i) => posOf.set(r.playerId, i)) // 0 = best standing
  const drawSize = TIERS[event.tier].drawSize

  // Percentile from position: (position + 1) / total lands in (0, 1]. Players
  // absent from the ranking sort to the back.
  const pctOf = (id: string) => ((posOf.get(id) ?? total - 1) + 1) / total
  const band = cohort.filter((p) => isEntrantBand(event.tier, pctOf(p.id)))

  // Position-biased stochastic entry: lower key = more likely to enter. Jitter is a
  // fraction of the draw so strong players usually enter but the field still moves.
  const jitter = drawSize
  const keyed = band.map((p) => {
    const pos = posOf.get(p.id) ?? total - 1
    return { p, pos, key: pos + rng() * jitter }
  })
  keyed.sort((a, b) => a.key - b.key)
  let chosen = keyed.slice(0, drawSize)

  // Defensive: if the band is thinner than the draw (not expected for the live
  // tiers), backfill with the nearest-positioned players outside the band.
  if (chosen.length < drawSize) {
    const have = new Set(chosen.map((c) => c.p.id))
    const fill = cohort
      .filter((p) => !have.has(p.id))
      .map((p) => ({ p, pos: posOf.get(p.id) ?? total - 1, key: 0 }))
      .sort((a, b) => a.pos - b.pos)
      .slice(0, drawSize - chosen.length)
    chosen = chosen.concat(fill)
  }

  // Seed order = ascending standings position (best first).
  chosen.sort((a, b) => a.pos - b.pos)
  return chosen.map((c) => c.p)
}

// Resolve one match. Kid matches (either side is the kid) run the full engine under
// a deterministic event-scoped seed and record seed + scoreline. AI-AI matches draw
// once against the closed-form win probability.
function playMatch(
  a: MatchPlayer,
  b: MatchPlayer,
  round: number,
  event: SeasonEvent,
  kid: MatchPlayer | null,
  worldSeed: string,
  rng: Rng,
): MatchRecord {
  const kidPlays = kid !== null && (a.id === kid.id || b.id === kid.id)
  if (kidPlays) {
    const seed = `${worldSeed}:${event.id}:r${round}`
    const res = simulateMatch(a, b, { surface: event.surface, tour: JUNIOR_TOUR, seed })
    const winnerId = res.winner === 0 ? a.id : b.id
    const score = res.sets.map((s) => `${s.a}-${s.b}`).join(' ')
    return { round, aId: a.id, bId: b.id, winnerId, seed, score }
  }
  const p = fastMatchProbability(a, b, { surface: event.surface, tour: JUNIOR_TOUR, seed: '' })
  const aWins = rng() < p
  return { round, aId: a.id, bId: b.id, winnerId: aWins ? a.id : b.id }
}

// runTournament – single-elimination from `entrants` (seed order, best first). When
// the kid enters it takes a slot, bumping the lowest-ranked entrant, and is seeded
// last. Losers get finish = rounds - round (0 = champion), indexing TierDef.points.
export function runTournament(
  event: SeasonEvent,
  entrants: AiPlayer[],
  kid: MatchPlayer | null,
  worldSeed: string,
  rng: Rng,
): TournamentResult {
  const drawSize = TIERS[event.tier].drawSize

  let field: MatchPlayer[]
  if (kid) {
    field = entrants.slice(0, drawSize - 1) // bump the lowest-ranked entrant
    field.push(kid) // the kid takes the freed slot (lowest seed)
  } else {
    field = entrants.slice(0, drawSize)
  }

  const order = standardSeedOrder(field.length)
  let alive: MatchPlayer[] = order.map((seed) => field[seed - 1])

  const matches: MatchRecord[] = []
  const finishes: Record<string, number> = {}
  const rounds = Math.log2(field.length)

  for (let round = 0; round < rounds; round++) {
    const winners: MatchPlayer[] = []
    for (let i = 0; i < alive.length; i += 2) {
      const a = alive[i]
      const b = alive[i + 1]
      const rec = playMatch(a, b, round, event, kid, worldSeed, rng)
      matches.push(rec)
      const winner = rec.winnerId === a.id ? a : b
      const loser = rec.winnerId === a.id ? b : a
      finishes[loser.id] = rounds - round
      winners.push(winner)
    }
    alive = winners
  }
  finishes[alive[0].id] = 0 // champion

  return { eventId: event.id, matches, finishes }
}
