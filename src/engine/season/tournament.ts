// Package L – single-elimination tournaments. Pure: given the entrants, an
// optional kid, and an RNG, the bracket resolves deterministically. Kid matches
// run the full point engine under an event-scoped seed (replayable); AI-AI matches
// resolve from the closed-form win probability with a single RNG draw.

import { type Rng } from '../rng'
import type { MatchPlayer, Tour } from '../match/types'
import { simulateMatch, fastMatchProbability } from '../match/engine'
import { TIERS, TIER_LADDER, isTierAgeOpen } from './calendar'
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
 *  give the cohort a coherent pre-history (season/prehistory.ts). Falls back to the entry tier.
 *
 *  ⚠ THE PRE-HISTORY IS A JUNIOR PAST, AND THE ADULT RUNGS ARE EXCLUDED FROM IT ON PURPOSE (task
 *  #17). W100's entrant window is [0, 0.25] – identical to J300's, because both are the prestige rung
 *  of their own table – so the moment the W family joined TIER_LADDER this walk started handing the
 *  top quarter of the cohort a professional pre-history. A W result pays into the WTA table and not
 *  the ITF one, so the junior ranking THE GAME IS ABOUT emptied out: measured on the pinned career,
 *  the kid's opening ITF rank went #120 -> #1, not because she had improved but because the elite's
 *  points had left the table she is ranked in.
 *
 *  The right answer is not an age gate here (the cohort spans 13-19, so a gate would still have given
 *  the older third a professional past). It is that THE PROFESSIONAL TABLE STARTS EMPTY, for everyone,
 *  because nobody in this world has ever played a professional tournament: the rungs opened this
 *  release. Every WTA point in a career is therefore one somebody actually won, in a draw the engine
 *  actually ran – which is also what makes W35/W100's acceptance cut mean something instead of being
 *  measured against a fabrication. This function's own pre-adult behaviour is byte-identical, which is
 *  why every ranking pin in the suite still reads what it read yesterday.
 *
 *  Who is in a LIVE draw is a different question with a different answer – see the age gate in
 *  `selectEntrants` below, which is where age genuinely belongs. */
export function topBandForPercentile(pct: number): TierId {
  for (let i = TIER_LADDER.length - 1; i >= 0; i--) {
    const tier = TIER_LADDER[i]
    if (TIERS[tier].track === 'wta') continue
    if (isEntrantBand(tier, pct)) return tier
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

  // ⚠ WHO IS OLD ENOUGH TO BE HERE AT ALL – the universe this whole function draws from (task #17,
  // completed by §4.1). The cohort's own age band is [13, 19]: a junior field has always contained
  // the ones just starting and the ones about to age out, and that spread is what tells the two
  // tours apart. A W15 draw is the sixteen-and-overs; a J30 draw is the eighteen-and-unders; the
  // three-year overlap between them is deliberate and is what makes the fork at 19 a decision made
  // with evidence rather than a wall (see TierDef.maxAgeYears).
  //
  // BOTH ENDS OF THE RULE ARRIVED THROUGH THIS ONE LINE, and neither needed its own code. Task #17
  // added the minimum, so the adult tour's first season would not be played by thirteen-year-olds;
  // §4.1 added the maximum to `isTierAgeOpen` itself, so the junior tour stopped being played by
  // nineteen-year-olds. Measured on the shipped calendar before the ceiling: 13.7% of a J300 draw
  // and 11.3% of a J30 draw were 19 or older. That is the bug §1 of
  // docs/specs/adult-tour-and-endings.md names from the other side ("the field she meets there can
  // contain 28-year-olds"), and the fix is the same sentence for both: age is a fact about people,
  // not a label on a tier.
  //
  // IT IS THE UNIVERSE AND NOT JUST THE BAND, deliberately: both backfills below reach OUTSIDE the
  // entrant window, and an age rule that the backfills could walk around would be no rule at all -
  // the tired-elite path would have handed W100 slots straight to the children it just excluded,
  // and now would have handed J300 slots back to the adults who have just aged out of them.
  //
  // TOTAL: if the age gate leaves fewer players than the draw needs the whole cohort plays, because
  // a draw that cannot be filled is a crash rather than a compromise (same discipline as claimWeek's
  // gap retry). It cannot fire at the shipped numbers from either end - the J rungs want 32 of the
  // ~170 eighteen-and-unders and the youngest adult rung 32 of the ~82 sixteen-and-overs, in a 199
  // cohort whose conveyor intake keeps arriving at 13.
  const ofAge = cohort.filter((p) => isTierAgeOpen(event.tier, p.ageYears))
  const eligible = ofAge.length >= drawSize ? ofAge : cohort
  //
  // RNG: the age gate changes the candidate COUNT, and therefore the per-event draw count, on every
  // rung that HAS one - which since §4.1 means the J rungs too, not the W rungs alone. Their event
  // sub-streams are NOT byte-identical to the pre-cap ones and cannot be: a J30 field really is
  // different people now.
  //
  // ⚠ NONE OF THAT IS ON THE MAIN WEEKLY STREAM, which is the invariant that matters and the reason
  // this was safe to widen. Every draw here comes off the event-scoped `seed:aitour:<id>` /
  // `seed:kidtour:<id>` sub-stream (see the callers in world.ts), so the frozen MAIN capture -
  // 41550 draws / hash e6b0c709, which is `driftCohort` spending exactly four draws per rival per
  // week and nothing else - is untouched BY CONSTRUCTION rather than by luck. Verified: it
  // re-derives byte-for-byte on this branch. The three domestic rungs carry no age gate at all, so
  // their sub-streams are byte-identical as well.
  const band = eligible.filter((p) => isEntrantBand(event.tier, pctOf(p.id)))

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
    const fill = eligible
      .filter((p) => !have.has(p.id) && fit(p.id))
      .map((p) => ({ p, pos: posOf.get(p.id) ?? total - 1, key: 0 }))
      .sort((a, b) => a.pos - b.pos)
      .slice(0, drawSize - chosen.length)
    chosen = chosen.concat(fill)
  }

  // Last resort: a draw must be filled, so if everybody eligible is under the floor the tired ones
  // play after all - in key order, so the same players are not always the ones dragged in.
  //
  // ⚠ IT REACHES OUTSIDE THE BAND NOW, AND IT HAS TO (task #17). It used to top up from `keyed`,
  // i.e. from the entrant window alone, which was safe only because every window was deliberately
  // wider than its own draw - so this branch could never actually run short and the shortfall was
  // unreachable. The age gate above breaks that guarantee for the W rungs (W100's window is the top
  // quarter of the table, intersected with "seventeen or older"), and a draw that comes up short
  // does not degrade gracefully: `buildDraw` hands `standardSeedOrder` a non-power-of-two field and
  // the bracket reads `undefined` as a player. Falling back to everyone eligible cannot change any
  // pre-existing tier - reaching this line at all needed a cohort with fewer than `drawSize` fit
  // players AND a band too small to cover the rest, which on the six original rungs would have
  // crashed the same way years ago.
  if (chosen.length < drawSize) {
    const have = new Set(chosen.map((c) => c.p.id))
    const rest = keyed.filter((c) => !have.has(c.p.id))
    for (const p of eligible) {
      if (!have.has(p.id) && !rest.some((c) => c.p.id === p.id)) {
        rest.push({ p, pos: posOf.get(p.id) ?? total - 1, key: Number.MAX_SAFE_INTEGER })
      }
    }
    rest.sort((a, b) => a.key - b.key || a.pos - b.pos)
    chosen = chosen.concat(rest.slice(0, drawSize - chosen.length))
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
// WHY THE DRAW IS PART SEEDED AND PART RANDOM (the owner, 28.07: «в настоящем теннисе несеяная
// новичок попадает в сетку случайно – мне кажется нам тоже так надо делать», and its other half,
// 29.07, after the rank diagnosis).
//
// FIRST VERSION. She was appended last, which made her the LOWEST seed – and in a standard seeded
// bracket the lowest seed meets seed 1 in round one, by construction. At every draw size and every
// tier her first opponent was the strongest player in the field, every tournament of every career.
// That was fixed by trading her into a uniformly random slot.
//
// WHAT THAT LEFT, AND WHY IT WAS STILL WRONG. `standardSeedOrder` seeded the ENTIRE field, so every
// one of the other 31 players was protected – a mid-table AI met the player adjacent to her in the
// standings – while she alone carried the variance of a random draw. Measured (docs/specs/
// rank-plateau.md): her entries produced a scoring result 27% of the time against her direct rivals'
// 47%, and she sat five points of raw power above the players she was tied with on points. A rule
// that applies to exactly one player in the world is not a difficulty setting, it is a bug.
//
// A REAL DRAW SEEDS THE TOP AND RANDOMISES THE REST. The ITF seeds 8 of a 32-draw (4 of 16, 2 of 8);
// everybody else goes into the gaps by lot. So that is what this does, and the kid is nobody special
// in it: she takes her place in the field BY HER STANDING, is seeded when that standing earns it,
// and is drawn at random when it does not - on the same terms as every other unseeded player.
//
// TWO INVARIANTS, both load-bearing:
//   * every draw comes off the `rng` already passed in, which is the EVENT-scoped
//     `seed:kidtour:<id>` / `seed:aitour:<id>` sub-stream. Not one draw on the MAIN weekly stream –
//     the frozen capture (41550 / e6b0c709) cannot move, and its test proves it.
//   * the shuffle spends exactly one draw per unseeded player, a count that depends only on the
//     tier's draw size. It cannot depend on player input, on funds, or on who is in the field.
//
// `entrants` is a MatchPlayer[] (it was an AiPlayer[], which is a subtype, so every existing call
// site still type-checks): since the rival-life slice the caller hands in cohort rows ALREADY put
// through `rivalMatchPlayer` – surface/style modifier and condition factor applied – so the
// bracket sees exactly the players who take the court, and the cohort rows themselves stay pristine.
/** How many of a draw are seeded. The ITF shape: 8 of 32, 4 of 16, 2 of 8. */
export function seedsFor(drawSize: number): number {
  return Math.max(2, Math.floor(drawSize / 4))
}

/** Where the kid slots into a standings-ordered entrant list – simply how many of them outrank her.
 *  Exported because THREE callers have to agree on it to the place: the bracket that plays, the
 *  Season screen's preview of it, and the test that proves those two agree. */
export function kidSeedIndexIn(
  entrants: readonly MatchPlayer[],
  ranking: readonly RankingRow[],
  kidId: string,
): number {
  const posOf = new Map<string, number>()
  ranking.forEach((r, i) => posOf.set(r.playerId, i))
  const last = ranking.length
  const mine = posOf.get(kidId) ?? last
  return entrants.filter((p) => (posOf.get(p.id) ?? last) < mine).length
}

/** THE DRAW, as one function, because two callers need to agree on it to the slot: the bracket that
 *  actually plays, and the Season screen's preview of who she would meet.
 *
 *  `entrants` arrive SORTED BY STANDING (selectEntrants guarantees it). The kid, when she is in the
 *  field, is spliced in at `kidSeedIndex` – her place by standing, not the bottom – and the weakest
 *  entrant is bumped to keep the draw at `drawSize`. The top `seedsFor(drawSize)` then take the
 *  standard seed positions and EVERYBODY ELSE is shuffled into the remaining slots.
 *
 *  Exactly one draw per unseeded player, in a fixed order, off the event's own stream. */
export function buildDraw(
  event: SeasonEvent,
  entrants: readonly MatchPlayer[],
  kid: MatchPlayer | null,
  kidSeedIndex: number | null,
  rng: Rng,
): MatchPlayer[] {
  const drawSize = TIERS[event.tier].drawSize
  let field: MatchPlayer[]
  if (kid) {
    field = entrants.slice(0, drawSize - 1)
    const at = Math.max(0, Math.min(kidSeedIndex ?? field.length, field.length))
    field.splice(at, 0, kid)
  } else {
    field = entrants.slice(0, drawSize)
  }

  const seeded = seedsFor(field.length)
  // Fisher-Yates over the unseeded tail. `pool` is a copy: `field` stays in standings order so the
  // seed lookup below is unambiguous.
  const pool = field.slice(seeded)
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[pool[i], pool[j]] = [pool[j], pool[i]]
  }
  let next = 0
  return standardSeedOrder(field.length).map((s) => (s <= seeded ? field[s - 1] : pool[next++]))
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
  /** her place among the entrants by standing (see `kidSeedIndexIn`). Omitted ⇒ she goes in last,
   *  which is what an unranked newcomer deserves and what the tests that do not care want. */
  kidSeedIndex?: number,
): TournamentResult {
  let alive: MatchPlayer[] = buildDraw(event, entrants, kid, kidSeedIndex ?? null, rng)
  const rounds0 = alive.length

  const matches: MatchRecord[] = []
  const finishes: Record<string, number> = {}
  const rounds = Math.log2(rounds0)

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
