// Package L – single-elimination tournaments. Pure: given the entrants, an
// optional kid, and an RNG, the bracket resolves deterministically. Kid matches
// run the full point engine under an event-scoped seed (replayable); AI-AI matches
// resolve from the closed-form win probability with a single RNG draw.

import { type Rng } from '../rng'
import type { MatchPlayer, Tour } from '../match/types'
import { simulateMatch, fastMatchProbability } from '../match/engine'
import { TIERS, TIER_LADDER } from './calendar'
import { ECONOMY } from '../economy'
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
// ORDINAL POSITION and the positions are always a permutation of 0..n-1. `selectEntrants`' draw
// count is therefore independent of the ranking's CONTENT – it was what kept the MAIN weekly
// stream stable back when the AI brackets ran on it, and it still keeps each event's own
// `seed:aitour:<id>` / `seed:kidtour:<id>` stream aligned across replays of the same event.

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
  /** every cohort player's condition this week (`rivalConditions`). A player absent from it has no
   *  results in the fatigue window and is fresh. Optional so the bench and the older tests can call
   *  this without one - and when it is absent, nobody is gated, which is the pre-gate behaviour. */
  conditions?: ReadonlyMap<string, number>,
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

  // THE AVAILABILITY GATE, and it is the KID's gate applied to everybody (28.07, the owner).
  //
  // She has never been allowed to enter a tier below its condition floor; the cohort had no such
  // rule, so a rival wrecked to 0 turned up in a draw exactly as readily as a fresh one. The
  // measurement that produced this, by a player's home band over 6 careers x 120 weeks:
  //
  //   band     runs/wk  strain/wk  net/wk   median condition  weeks at or below 5
  //   local     0.00      0.00      +1.00        100                 0%
  //   regional  0.00      0.00      +1.00        100                 0%
  //   national  0.00      0.00      +1.00        100                 0%
  //   j30       0.19      0.92      -0.11         95                 0%
  //   j60       0.26      2.79      -2.06         73                 6%
  //   j300      0.64      7.58      -7.22         10                42%
  //
  // The elite played 0.64 events a week and took 7.58 strain against a recovery capped at 1 per
  // QUIET week: minus seven, every week, forever. One run cost about twelve idle weeks to repay,
  // so the top of the table lived at condition 10 and spent two weeks in five pinned at the floor.
  // Meanwhile the three lower bands played NOTHING - the field was an exhausted elite and a crowd
  // of extras. The fatigue model was working perfectly and changing nothing, because nothing ever
  // read it.
  //
  // Now a tired rival sits the week out, recovers, and comes back - and the draw she vacated goes
  // to the next echelon down, which is what makes the rest of the cohort play at all.
  //
  // THE DRAW COUNT IS UNTOUCHED, which is the constraint that matters: the gate is applied AFTER
  // every candidate's key has been drawn, never before, so `selectEntrants` still takes exactly one
  // number per band candidate. The event's sub-stream stays aligned across replays, and nothing on
  // the MAIN weekly stream moves.
  const floor = ECONOMY.availability.minConditionToEnter[event.tier]
  const fit = (id: string) => (conditions?.get(id) ?? ECONOMY.condition.max) >= floor
  let chosen = keyed.filter((c) => fit(c.p.id)).slice(0, drawSize)

  // Short of a full draw: reach OUTSIDE the band for the nearest-positioned players who are fit.
  // This is the same defensive backfill the thin-band case always had, and it is also the path that
  // lets a wrecked elite hand its slots to the tier below.
  if (chosen.length < drawSize) {
    const have = new Set(chosen.map((c) => c.p.id))
    const fill = cohort
      .filter((p) => !have.has(p.id) && fit(p.id))
      .map((p) => ({ p, pos: posOf.get(p.id) ?? total - 1, key: 0 }))
      .sort((a, b) => a.pos - b.pos)
      .slice(0, drawSize - chosen.length)
    chosen = chosen.concat(fill)
  }

  // Last resort: a draw must be filled, so if the whole cohort is under the floor the tired ones
  // play after all - in key order, so the same players are not always the ones dragged in.
  if (chosen.length < drawSize) {
    const have = new Set(chosen.map((c) => c.p.id))
    chosen = chosen.concat(keyed.filter((c) => !have.has(c.p.id)).slice(0, drawSize - chosen.length))
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

// runTournament – single-elimination from `entrants` (seed order, best first). When the kid enters
// she takes a slot, bumping the lowest-ranked entrant, and is then DRAWN INTO THE BRACKET AT
// RANDOM. Losers get finish = rounds - round (0 = champion), indexing TierDef.points.
//
// WHY THE DRAW IS RANDOM (28.07, the owner: «в настоящем теннисе несеяная новичок попадает в сетку
// случайно – мне кажется нам тоже так надо делать»).
//
// She used to be appended last, which made her the LOWEST seed – and in a standard seeded bracket
// the lowest seed meets seed 1 in round one, by construction. Measured directly: at every draw size
// (4, 8, 16, 32) and every tier, her first opponent was the strongest player in the field. Every
// tournament of every career. That is not a hard game, it is a broken draw: an unseeded newcomer in
// real tennis is drawn into the gaps between the seeds and can meet anybody.
//
// THE FIX IS ONE SWAP AND ONE DRAW. The AI keep their seeding relationships exactly; the kid trades
// places with whoever holds a uniformly random slot. So she can still draw the top seed – she just
// no longer draws them EVERY time.
//
// TWO INVARIANTS, both load-bearing:
//   * the draw comes off the `rng` already passed in, which is the event-scoped `seed:kidtour:<id>`
//     sub-stream. No new stream, and not one draw on the MAIN weekly stream – the frozen capture
//     cannot move.
//   * it is taken ONLY when a kid is in the field. An AI-only bracket (`kid === null`) takes no
//     extra draw and is byte-identical to before, so the cohort's own season is untouched and this
//     change is confined to the events she actually plays.
//
// `entrants` is a MatchPlayer[] (it was an AiPlayer[], which is a subtype, so every existing call
// site still type-checks): since the rival-life slice the caller hands in cohort rows ALREADY put
// through `rivalMatchPlayer` – surface/style modifier and condition factor applied – so the
// bracket sees exactly the players who take the court, and the cohort rows themselves stay pristine.
/** THE DRAW, as one function, because two callers need to agree on it to the draw: the bracket that
 *  actually plays, and the Season screen's preview of who she would meet. It mutates `alive` in
 *  place and takes EXACTLY ONE number off `rng`, so a preview that has consumed the same stream in
 *  the same order lands on the same slot.
 *
 *  She arrives appended last, which `standardSeedOrder` has already parked opposite seed 1 – the
 *  old, rigged position. One swap with a uniformly random slot fixes it; the player displaced takes
 *  the slot she came from, so every other seeding relationship survives. */
export function drawKidInto(alive: MatchPlayer[], kid: MatchPlayer, rng: Rng): void {
  const from = alive.findIndex((p) => p.id === kid.id)
  const to = Math.floor(rng() * alive.length)
  ;[alive[from], alive[to]] = [alive[to], alive[from]]
}

/** Who `kid` meets in round one of `alive`, once drawn. Round one pairs adjacent slots. */
export function firstRoundOpponent(alive: readonly MatchPlayer[], kid: MatchPlayer): MatchPlayer | null {
  const i = alive.findIndex((p) => p.id === kid.id)
  if (i < 0) return null
  return alive[i % 2 === 0 ? i + 1 : i - 1] ?? null
}

export function runTournament(
  event: SeasonEvent,
  entrants: MatchPlayer[],
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
  if (kid) drawKidInto(alive, kid, rng)

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
