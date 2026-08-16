/**
 * draw-vs-band – THE BAND IS NOT THE DRAW, finally measured.
 *
 * `tools/winrate-read.ts` [B] reports her mean match-win probability against the eligible BAND –
 * every player whose ranking percentile falls inside the rung's `entrantPctBand`. At wta500 that
 * number is 83.6% for the owner's Naomi. He then played a season of wta500s at full condition and
 * won ONE match in NINE entries. Both figures are correct; the gap between them is this file.
 *
 * A 32-draw is not a random 32 of the band. `selectEntrants` keys entry on STANDINGS POSITION plus
 * a jitter of one draw-size, so the draw is filled from the TOP of the band; she arrives at her own
 * standing, is seeded or not on everybody's terms (`kidSeedIndexIn` → `buildDraw`), and round one
 * pairs seed 1 against slot 32. `docs/specs/the-wall-2026-08.md` §0 states this in one line and
 * nobody had measured it.
 *
 * WHAT IT PRINTS, per tier, per save:
 *   – her win rate BY ROUND (R1 / R2 / QF / SF / F), so "dies at the first hurdle" and "loses
 *     uniformly" are distinguishable rather than assertable;
 *   – the mean STRENGTH (`power`, the cohort's own mean-of-four) of the opponent she actually meets
 *     in each round, against the band's mean and against her own;
 *   – how often she is seeded, who her R1 opponent is (median rank, share who are seeds);
 *   – the finish distribution and the expected ranking points per entry.
 *
 * ⚠ IT DRIVES THE GAME'S OWN DRAW, NOT A MODEL OF ONE. Every event below is run exactly as
 * `computeShadowTournament` (world.ts) runs it: merged W standings over LIVE cohort ∪ field pros,
 * `weekFieldExclusion`, `selectEntrants` and `runTournament` sharing ONE `seed:kidtour:<id>`
 * sub-stream in that order, opponents built through `rivalMatchPlayer` at their real fatigue, her
 * matches resolved by the full point engine. Nothing about seeding or the bracket is re-implemented
 * here – the only arithmetic this file owns is counting.
 *
 * THE TRIALS. One event = one draw (its sub-stream is keyed by `event.id`), so n comes from events.
 * The tool deals FUTURE year-blocks of this career's own calendar – `buildSeason(`${seed}:s<chunk>`,
 * …)`, the exact call `ensureSeason` makes – and runs every event of the tier in them. The world is
 * held at TODAY (her build, the standings, the cohort's fatigue): the preview's own stance, "the
 * field she would meet if it started now". What varies across trials is the event-scoped stream –
 * entry jitter, the unseeded shuffle, her matches – which is the variance a season actually has.
 *
 * CONDITION IS HELD FRESH (`--condition`, default 95 = the middle of the owner's 90-100) so fatigue
 * cannot confound the draw. The factor at 90 vs 100 is printed so the reader can see it is noise.
 *
 * ⚠ MEASUREMENT ONLY. Imports the engine read-only, changes no constant, ships no fixture.
 *
 * ⚠ THE SAVES ARE PERSONAL AND ARE NEVER COMMITTED, and neither is anything derived from one beyond
 * the aggregate statistics quoted in docs/specs/. Same rule as tools/winrate-read.ts and
 * tools/round16-read.ts.
 *
 * Run:
 *   npx vite-node tools/draw-vs-band.ts -- --save /path/a.tsave [--save /path/b.tsave] [--chunks 60]
 */
import { readFileSync } from 'node:fs'
import { decodeExportFile } from '../src/engine/saveCodec'
import type { WorldState } from '../src/engine/world'
import { kidMatchPlayerFor } from '../src/engine/world/player'
import { conditionMatchFactor } from '../src/engine/condition'
import { fastMatchProbability } from '../src/engine/match/engine'
import { rngFromSeed } from '../src/engine/rng'
import { ECONOMY } from '../src/engine/economy'
import { kidAgeExact } from '../src/engine/world/age'
import { acceptanceRank, cohortIds, fieldProsOf, inTrack, rankingFor } from '../src/engine/world/ladder'
import { BEST_N_BY_TRACK, computeRanking } from '../src/engine/season/ranking'
import { buildSeason, TIERS, isTierAgeOpen } from '../src/engine/season/calendar'
import { power } from '../src/engine/season/cohort'
import { finishLabel, stageLabel } from '../src/engine/world/labels'
import { rivalConditions, rivalMatchPlayer } from '../src/engine/season/rival'
import { mergedWtaRanking, universeForTier } from '../src/engine/season/fieldPros'
import {
  JUNIOR_TOUR as TOUR,
  isEntrantBand,
  kidSeedIndexIn,
  runTournament,
  seedsFor,
  selectEntrants,
  weekFieldExclusion,
} from '../src/engine/season/tournament'
import { KID_ID, SEASON_CHUNK } from '../src/engine/world/constants'
import type { AiPlayer, RankingRow, SeasonEvent, TierId } from '../src/engine/season/types'

// --- args ----------------------------------------------------------------------------------------
const args = process.argv.slice(2)
const saves: string[] = []
for (let i = 0; i < args.length; i++) if (args[i] === '--save') saves.push(args[++i])
const numArg = (name: string, fallback: number): number => {
  const i = args.indexOf(`--${name}`)
  return i >= 0 && args[i + 1] ? Number(args[i + 1]) : fallback
}
/** how many future year-blocks of this career's calendar to deal – the trial count's only handle */
const CHUNKS = numArg('chunks', 60)
/** FRESH, the owner's actual playing condition. 90-100; 95 is the middle. */
const CONDITION = numArg('condition', 95)

/** The rungs the question is about: W100 upward, where the acceptance list starts biting. */
const RUNGS: readonly TierId[] = ['w100', 'wta125', 'wta250', 'wta500', 'wta1000', 'slam']

/** Round names for a 32-draw, by round index. `runTournament` counts round 0 = first round. */
/** ⚠ NAMED FROM THE DRAW, NOT FROM A FIXED LIST. This was `['R1','R2','QF','SF','F']` and it crashed
 *  the moment a Slam became a 128-draw on 14.08 – seven rounds indexing a five-long array, a
 *  `padStart` of undefined, and the whole Slam section lost. `stageLabel` is the engine's own namer
 *  and it takes the draw size, so a deeper rung names itself. */
const roundName = (round: number, drawSize: number): string => {
  const s = stageLabel(round, drawSize)
  return s === 'Final' ? 'F' : s === 'Semifinal' ? 'SF' : s === 'Quarterfinal' ? 'QF' : s.replace('Round of ', 'R')
}
/** Finish index → what she reached. `finishes[id] = rounds - round`, 0 = champion. */
/** ⚠ THE SAME 32-DRAW ASSUMPTION AS `roundName`, and it printed `undefined 41.3%` for the two rounds
 *  a 128-draw added rather than crashing – the quieter half of the same bug. A finish index is
 *  "rounds - matches won", so index 0 is the champion and the last index is losing your opener;
 *  `finishLabel` is the engine's own namer for exactly that. */
const finishName = (finish: number): string => {
  if (finish === 0) return 'WON'
  const s = finishLabel(finish)
  return s === 'Runner-up' ? 'final' : s === 'Semifinalist' ? 'semi' : s === 'Quarterfinalist' ? 'quarter' : `${s.replace('Round of ', 'R')} exit`
}

function mean(xs: readonly number[]): number {
  return xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : NaN
}
function median(xs: readonly number[]): number {
  if (!xs.length) return NaN
  const s = [...xs].sort((a, b) => a - b)
  return s.length % 2 ? s[(s.length - 1) / 2] : (s[s.length / 2 - 1] + s[s.length / 2]) / 2
}
function pad(s: string | number, n: number): string {
  return String(s).padStart(n)
}
function pct(n: number, d: number): string {
  return d === 0 ? '   – ' : `${((100 * n) / d).toFixed(1).padStart(5)}`
}

async function load(path: string): Promise<WorldState> {
  return (await decodeExportFile(new Uint8Array(readFileSync(path)))) as WorldState
}

function section(title: string): void {
  console.log(`\n${'='.repeat(104)}\n${title}\n${'='.repeat(104)}`)
}

// --- one event, run exactly as computeShadowTournament runs it -----------------------------------

interface RoundSample {
  round: number
  won: boolean
  /** the opponent's core, in the cohort's own mean-of-four currency */
  oppCore: number
  /** her opponent's place in the merged W table */
  oppRank: number
  /** was the opponent one of the draw's `seedsFor(32)` = 8 seeds? */
  oppSeeded: boolean
  /** the closed form's answer for this exact pairing – the bracket variance removed */
  p: number
}

interface EventSample {
  seeded: boolean
  /** her standings position among the 32 in the draw, 1 = best */
  seedIndex: number
  /** the same place, computed against the table the SEASON CARD seeds her by – see `TierCtx.card` */
  seedIndexCard: number
  seededCard: boolean
  finish: number
  rounds: RoundSample[]
  /** the mean core of the other 31 in her draw */
  drawCore: number
  /** how many of the other 31 are STRONGER than she is, in the same currency */
  drawAbove: number
  /** ⚠ THE COUNTERFACTUAL ARM, and it is NOT the shipped path – see `runEvent`. The identical draw
   *  replayed with her spliced in at her place in the kid-INCLUSIVE table, i.e. seeded when her
   *  standing earns it. Prices the seeding defect on its own, apart from the field. */
  finishCard: number
  wonR1Card: boolean
}

interface TierCtx {
  universe: AiPlayer[]
  ranking: RankingRow[]
  /** THE OTHER TABLE, and it is not a hypothetical: `upcomingEvents` (world/snapshot.ts) previews a
   *  W card with `rankingFor(world, 'wta')`, which HAS a row for her, while the bracket USED to be
   *  seeded by the kid-free fold above. Carried so the seeded/unseeded split can be read both ways.
   *
   *  ⚠ AND SINCE ROUND-21 #4 IT IS ALSO WHAT SEEDS THE BRACKET, here and in the engine. This tool
   *  found the defect precisely because it carried both tables and printed which one the draw used;
   *  the line it printed - "the bracket's fold has a row for her? NO" - was the whole bug. */
  card: RankingRow[]
  fatigue: Map<string, number>
  /** everyone eligible to enter: the age gate and the percentile band, kid excluded */
  band: AiPlayer[]
  posOf: Map<string, number>
  rankOf: Map<string, number>
  /** her own build in the cohort's currency, so "stronger than her" is one comparison everywhere */
  kidCore: number
}

function tierContext(world: WorldState, tier: TierId): TierCtx {
  // The shadow path's own three inputs, verbatim (world.ts computeShadowTournament).
  const pros = fieldProsOf(world)
  const universe = universeForTier(tier, world.cohort, pros)
  const ranking = mergedWtaRanking(
    computeRanking(
      world.results.filter((r) => r.playerId !== KID_ID),
      world.week,
      BEST_N_BY_TRACK.wta,
      cohortIds(world),
      inTrack('wta'),
    ),
    pros,
  )
  const fatigue = rivalConditions(world.results, world.week)
  const posOf = new Map<string, number>()
  ranking.forEach((r, i) => posOf.set(r.playerId, i))
  const rankOf = new Map<string, number>()
  ranking.forEach((r) => rankOf.set(r.playerId, r.rank))
  const total = ranking.length || universe.length
  const pctOf = (id: string) => ((posOf.get(id) ?? total - 1) + 1) / total
  // THE BAND – `selectEntrants`' own two filters, in its own order, minus her. This is exactly the
  // population winrate-read [B] averages over, so the 83.6% it prints is reproducible from here.
  const band = universe.filter(
    (p) => p.id !== KID_ID && isTierAgeOpen(tier, p.ageYears) && isEntrantBand(tier, pctOf(p.id)),
  )
  const kidCore = (world.skills.serve + world.skills.ret + world.skills.composure + world.skills.stamina) / 4
  return { universe, ranking, card: rankingFor(world, 'wta'), fatigue, band, posOf, rankOf, kidCore }
}

function runEvent(world: WorldState, event: SeasonEvent, season: SeasonEvent[], ctx: TierCtx): EventSample {
  const tier = event.tier
  const drawSize = TIERS[tier].drawSize
  const kid = kidMatchPlayerFor(world, event.surface)
  // ⚠ ONE STREAM, IN THIS ORDER. `selectEntrants` spends one number per band candidate and
  // `runTournament` continues from where it stopped – the same single `kidRng` the shadow run uses.
  // Two generators here would measure a draw the game never deals.
  const rng = rngFromSeed(`${world.seed}:kidtour:${event.id}`)
  const excluded = weekFieldExclusion(event, season, ctx.universe, ctx.ranking, world.seed, ctx.fatigue)
  const entrants = selectEntrants(event, ctx.universe, ctx.ranking, rng, ctx.fatigue, excluded)
  const field = entrants.map((p) =>
    rivalMatchPlayer(p, event.surface, ctx.fatigue.get(p.id) ?? ECONOMY.condition.max),
  )
  // ⚠ MIRRORS THE ENGINE'S OWN TWO-TABLE SPLIT (world.ts computeShadowTournament, round-21 #4).
  // `ctx.ranking` is the kid-FREE selection fold – right for who turns up, and the reason this tool
  // was able to catch the bug: handed to `kidSeedIndexIn` it cannot find her and returns LAST. Her
  // POSITION comes from the table that has her in it, which is what the engine now passes.
  const seedIndex = kidSeedIndexIn(field, ctx.card, KID_ID)
  const result = runTournament(event, field, kid, world.seed, rng, seedIndex)

  // WHO IS A SEED, read off the standings order `buildDraw` seeds from rather than off the bracket.
  // `buildDraw` takes `entrants.slice(0, drawSize - 1)` and splices her in at her standing, then
  // gives the top `seedsFor(drawSize)` of THAT list the seed positions. So a player is a seed iff
  // her place in this 32-long standings-ordered list is inside the first eight. Counting only.
  const at = Math.max(0, Math.min(seedIndex, drawSize - 1))
  const drawOrder: string[] = entrants.slice(0, drawSize - 1).map((p) => p.id)
  drawOrder.splice(at, 0, KID_ID)
  const drawPos = new Map<string, number>()
  drawOrder.forEach((id, i) => drawPos.set(id, i))
  const seeds = seedsFor(drawOrder.length)

  const byId = new Map(entrants.map((p) => [p.id, p]))
  const onCourt = new Map(field.map((p) => [p.id, p]))
  const opts = { surface: event.surface, tour: TOUR, seed: '' }
  const rounds: RoundSample[] = []
  for (const m of result.matches) {
    if (m.aId !== KID_ID && m.bId !== KID_ID) continue
    const oppId = m.aId === KID_ID ? m.bId : m.aId
    const ai = byId.get(oppId)
    const opp = onCourt.get(oppId)
    rounds.push({
      round: m.round,
      won: m.winnerId === KID_ID,
      oppCore: ai ? power(ai) : NaN,
      oppRank: ctx.rankOf.get(oppId) ?? ctx.ranking.length + 1,
      oppSeeded: (drawPos.get(oppId) ?? drawSize) < seeds,
      p: opp ? fastMatchProbability(kid, opp, opts) : NaN,
    })
  }
  rounds.sort((a, b) => a.round - b.round)

  // ⚠ THE COUNTERFACTUAL ARM. The SHIPPED bracket seeds her off `selRanking`, a fold that has no row
  // for her at all (`computeRanking(..., cohortIds(world), ...)`) – so `kidSeedIndexIn` returns the
  // sentinel and `buildDraw` splices her into the LAST standings slot of every draw, at every rung,
  // for ever. v21b's own comment says the opposite is intended ("she goes into the draw AT HER
  // STANDING … and is seeded, or not, on the terms everybody else gets"), and the Season card
  // already previews her off a table that HAS her row (`rankingFor(world, 'wta')`, snapshot.ts).
  // So this replays the SAME event – same sub-stream, from the same first number, same entrants,
  // same opponents – with only that one argument changed, which prices the defect on its own.
  // It is a measurement arm and nothing else: nothing here runs on the shipped path.
  const atCard = Math.max(0, Math.min(kidSeedIndexIn(field, ctx.card, KID_ID), drawSize - 1))
  const rngCard = rngFromSeed(`${world.seed}:kidtour:${event.id}`)
  selectEntrants(event, ctx.universe, ctx.ranking, rngCard, ctx.fatigue, excluded)
  const cardResult = runTournament(event, field, kid, world.seed, rngCard, atCard)
  const cardR1 = cardResult.matches.find((m) => m.round === 0 && (m.aId === KID_ID || m.bId === KID_ID))

  return {
    seeded: at < seeds,
    seedIndex: at + 1,
    seedIndexCard: atCard + 1,
    seededCard: atCard < seeds,
    finish: result.finishes[KID_ID],
    rounds,
    drawCore: mean(drawOrder.filter((id) => id !== KID_ID).map((id) => power(byId.get(id)!))),
    drawAbove: drawOrder.filter((id) => id !== KID_ID && power(byId.get(id)!) > ctx.kidCore).length,
    finishCard: cardResult.finishes[KID_ID],
    wonR1Card: cardR1 ? cardR1.winnerId === KID_ID : false,
  }
}

// --- the report ----------------------------------------------------------------------------------

function reportTier(world: WorldState, tier: TierId, samples: EventSample[], ctx: TierCtx): void {
  const n = samples.length
  const drawSize = TIERS[tier].drawSize
  const rounds = Math.log2(drawSize)
  const kidCore = (world.skills.serve + world.skills.ret + world.skills.composure + world.skills.stamina) / 4

  // The band's flat-field figure – winrate-read [B]'s own construction, on hard, so the two agree.
  const kidHard = kidMatchPlayerFor(world, 'hard')
  const bandProbs = ctx.band.map((p) =>
    fastMatchProbability(kidHard, rivalMatchPlayer(p, 'hard', ctx.fatigue.get(p.id) ?? ECONOMY.condition.max), {
      surface: 'hard',
      tour: TOUR,
      seed: '',
    }),
  )
  const accept = acceptanceRank(world, tier)
  console.log(
    `\n  ${TIERS[tier].label} (${tier})  ·  n = ${n} draws  ·  band ${ctx.band.length} players` +
      `  ·  accepts top ${accept ?? '–'} (she is wta #${world.kidRankWta ?? '––'})`,
  )
  console.log(
    `    her core ${kidCore.toFixed(1)}  ·  BAND mean core ${mean(ctx.band.map(power)).toFixed(1)}` +
      `  ·  DRAW mean core ${mean(samples.map((s) => s.drawCore)).toFixed(1)}` +
      `  ·  flat-field P(win) vs the band ${(100 * mean(bandProbs)).toFixed(1)}%`,
  )
  console.log(
    `    stronger than her: ${pct(ctx.band.filter((p) => power(p) > kidCore).length, ctx.band.length)}% of the BAND` +
      `  ·  ${pct(mean(samples.map((s) => s.drawAbove)), drawSize - 1)}% of her DRAW`,
  )
  const seededN = samples.filter((s) => s.seeded).length
  const seededCardN = samples.filter((s) => s.seededCard).length
  const r1 = samples.map((s) => s.rounds[0]).filter(Boolean)
  console.log(
    `    SEEDED in ${pct(seededN, n)}% of draws (top ${seedsFor(drawSize)} of ${drawSize}; median standing in the draw #${median(samples.map((s) => s.seedIndex))})` +
      `  ·  R1 opponent: median rank #${median(r1.map((r) => r.oppRank))}, ${pct(r1.filter((r) => r.oppSeeded).length, r1.length)}% are seeds (33.3% is the structural rate)`,
  )
  console.log(
    `    seeding table: the SEEDING fold has a row for her? ${ctx.card.some((r) => r.playerId === KID_ID) ? 'YES' : 'NO'}` +
      ` (the SELECTION fold deliberately does not: ${ctx.ranking.some((r) => r.playerId === KID_ID) ? 'YES' : 'NO'})` +
      `  ·  under the Season card's table (rankingFor 'wta', which does) she would be #${median(samples.map((s) => s.seedIndexCard))} and seeded in ${pct(seededCardN, n)}% of draws`,
  )

  console.log(
    `    round │  played  won   win%  │ opp core  vs band  │ opp rank (med) │ opp seeded │ closed-form P`,
  )
  console.log(`    ${'─'.repeat(96)}`)
  const bandCore = mean(ctx.band.map(power))
  for (let r = 0; r < rounds; r++) {
    const rs = samples.map((s) => s.rounds.find((x) => x.round === r)).filter((x): x is RoundSample => !!x)
    if (!rs.length) {
      console.log(`    ${roundName(r, drawSize).padStart(5)} │       0    –      –   │     –         –    │       –        │      –     │      –`)
      continue
    }
    const won = rs.filter((x) => x.won).length
    const core = mean(rs.map((x) => x.oppCore))
    const thin = rs.length < 30 ? '  ⚠ thin' : ''
    console.log(
      `    ${roundName(r, drawSize).padStart(5)} │ ${pad(rs.length, 7)} ${pad(won, 4)}  ${pct(won, rs.length)}% │` +
        `  ${core.toFixed(1).padStart(5)}   ${(core - bandCore >= 0 ? '+' : '')}${(core - bandCore).toFixed(1).padStart(5)}  │` +
        `   ${pad(median(rs.map((x) => x.oppRank)), 6)}       │  ${pct(rs.filter((x) => x.oppSeeded).length, rs.length)}%  │` +
        `   ${(100 * mean(rs.map((x) => x.p))).toFixed(1).padStart(5)}%${thin}`,
    )
  }

  // FINISHES + the points a season of this rung is worth per entry.
  const pts = TIERS[tier].points
  const finishCounts = new Array(pts.length).fill(0)
  for (const s of samples) finishCounts[s.finish]++
  console.log(
    `    finishes: ` +
      finishCounts
        .map((c, i) => `${finishName(i)} ${pct(c, n)}%`)
        .reverse()
        .join(' · '),
  )
  const epp = mean(samples.map((s) => pts[s.finish]))
  const prize = TIERS[tier].prizeCents
  console.log(
    `    expected ranking points per entry: ${epp.toFixed(1)} of ${pts[0]} for the title` +
      (prize ? `  ·  expected prize $${Math.round(mean(samples.map((s) => prize[s.finish])) / 100).toLocaleString('en-US')}` : ''),
  )
  // The counterfactual, one line: what the SEEDING alone is worth, same draws, same opponents.
  const eppCard = mean(samples.map((s) => pts[s.finishCard]))
  const r1Card = samples.filter((s) => s.wonR1Card).length
  const won = samples.filter((s) => s.finish === 0).length
  const wonCard = samples.filter((s) => s.finishCard === 0).length
  console.log(
    `    ⟂ counterfactual (seeded at her own standing, same draws): R1 ${pct(r1Card, n)}% vs ${pct(samples.filter((s) => s.rounds[0]?.won).length, n)}%` +
      `  ·  titles ${pct(wonCard, n)}% vs ${pct(won, n)}%  ·  points/entry ${eppCard.toFixed(1)} vs ${epp.toFixed(1)}`,
  )
}

/** WHAT SHE ACTUALLY LIVED, off the retained ledger – the reality check the model has to answer to.
 *  `pruneResults` keeps a rolling window, so this is the recent past and never the whole career;
 *  earlier seasons are in `seasonHistory` as win/loss totals and are printed beside it. */
function ledger(world: WorldState): void {
  console.log(`\n  HER OWN W-TRACK ROWS still in the results window (week ${world.week} back to the prune horizon)`)
  const rows = world.results.filter((r) => r.playerId === KID_ID && r.tier && TIERS[r.tier].track === 'wta')
  if (!rows.length) {
    console.log(`    (none retained – every W row she has is older than the window)`)
  } else {
    for (const tier of RUNGS) {
      const mine = rows.filter((r) => r.tier === tier)
      if (!mine.length) continue
      const pts = TIERS[tier].points
      const finishes = mine.map((r) => {
        const i = pts.indexOf(r.points)
        return i >= 0 ? i : pts.length - 1
      })
      const counts = new Array(pts.length).fill(0)
      for (const f of finishes) counts[f]++
      // Matches won = rounds survived. A finish of `f` means she won `rounds - f` matches.
      const roundsN = Math.log2(TIERS[tier].drawSize)
      const won = finishes.reduce((s, f) => s + (roundsN - f), 0)
      console.log(
        `    ${tier.padEnd(8)} entries ${pad(mine.length, 3)}  matches won ${pad(won, 3)}  ` +
          counts.map((c, i) => `${finishName(i)} ${c}`).reverse().join(' · '),
      )
    }
  }
  const wtaSeasons = world.seasonHistory.filter((h) => h.byTrack?.wta)
  if (wtaSeasons.length) {
    console.log(
      `    banked W seasons: ` +
        wtaSeasons
          .map((h) => `s${h.seasonIndex} ${h.byTrack!.wta!.wins}-${h.byTrack!.wta!.losses}`)
          .join(' · '),
    )
  }
}

// --- main ----------------------------------------------------------------------------------------

async function main(): Promise<void> {
  if (!saves.length) throw new Error('need at least one --save')
  for (const path of saves) {
    const w0 = await load(path)
    // FRESH, cloned – the world on disk is never written and the engine never sees a mutated one.
    const world: WorldState = { ...w0, condition: CONDITION }
    const age = kidAgeExact(world.week, world.profile.birthMonth)
    section(`${path.split('/').pop()}  ·  v${world.schemaVersion}  ·  week ${world.week}  ·  age ${age.toFixed(1)}`)
    console.log(
      `  ${world.profile.kidName} ${world.profile.kidLastName} · ${world.profile.background} · coach ${world.profile.coachTier}` +
        ` · ${world.profile.playStyle} · saved condition ${w0.condition} → held at ${CONDITION}`,
    )
    console.log(
      `  skills: ` +
        (['serve', 'ret', 'groundstrokes', 'stamina', 'composure'] as const)
          .map((k) => `${k} ${world.skills[k].toFixed(1)}`)
          .join(' · '),
    )
    console.log(
      `  wta #${world.kidRankWta ?? '––'} · itf #${world.kidRank ?? '––'}` +
        ` · condition factor: 90 → ${conditionMatchFactor(90).toFixed(3)}, ${CONDITION} → ${conditionMatchFactor(CONDITION).toFixed(3)}, 100 → ${conditionMatchFactor(100).toFixed(3)}`,
    )

    // The calendar this career would be dealt next: `ensureSeason`'s own call, one year-block at a
    // time, starting past everything it already holds so no event id is drawn twice.
    let maxWeek = world.week
    for (const e of world.season) if (e.week > maxWeek) maxWeek = e.week
    const firstChunk = Math.floor(maxWeek / SEASON_CHUNK) + 1
    const blocks: SeasonEvent[][] = []
    for (let c = firstChunk; c < firstChunk + CHUNKS; c++) {
      blocks.push(buildSeason(`${world.seed}:s${c}`, c * SEASON_CHUNK, SEASON_CHUNK, world.profile.background))
    }
    console.log(`  trials: ${CHUNKS} future year-blocks of this career's own calendar (chunks ${firstChunk}..${firstChunk + CHUNKS - 1})`)
    ledger(world)

    for (const tier of RUNGS) {
      const ctx = tierContext(world, tier)
      const samples: EventSample[] = []
      for (const block of blocks) {
        for (const e of block) {
          if (e.tier !== tier) continue
          samples.push(runEvent(world, e, block, ctx))
        }
      }
      reportTier(world, tier, samples, ctx)
    }
  }
}

main().catch((e) => {
  console.error(e)
  process.exitCode = 1
})
