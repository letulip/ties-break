// FIELD QUALITY BENCH – the measurement the living-field slice exists to move (01.08).
//
//   npx vite-node tools/field-quality.ts [--seeds N] [--events N]
//
// THE QUESTION: who is actually in a W15 draw, and what does that field do to a strong junior who
// enters it? The reference build is the owner's real case – the ITF-#6 girl who won five W15
// titles in a row losing one match total: serve 66 / ret 50 / composure 57 / stamina 54 /
// groundstrokes 65.
//
// BEFORE = the shipped engine's W15 field: `selectEntrants` over the LIVE cohort, positioned by
// the MIXED canonical table (the exact inputs tickWeek's shadow path used). AFTER = the field
// slice: LIVE cohort ∪ derived field pros, positioned by the merged W standings. Both sides run
// the FULL engine path for her events – same `seed:kidtour:<id>` sub-streams, same
// `rivalMatchPlayer` builds, same `runTournament` bracket with her real match engine – so the
// title probability is the engine's own answer, not a model of it.
//
// STANCE: each world first TICKS 40 real engine weeks (no entries, the canonical brackets running
// as they always do), so the probe reads a LIVE mid-season ledger – earned points, real rival
// fatigue – which is the state the owner's careers actually met their W15s in, not the fresh
// pre-history table of week 0. Every event is then measured "as if drawn this week", the preview's
// own stance. What varies per event is the event-scoped stream (field entry jitter, the bracket
// shuffle, her matches), which is exactly the variance a season of W15s has. Bench-first
// discipline: the constants in fieldPros.ts's FIELD table move only with a re-run of this file in
// hand.

import { createWorld, tickWeek, kidMatchPlayerFor, acceptanceRank, inTrack, KID_ID } from '../src/engine/world'
import { computeRanking } from '../src/engine/season/ranking'
import { rngFromSeed } from '../src/engine/rng'
import { ECONOMY } from '../src/engine/economy'
import { power } from '../src/engine/season/cohort'
import { rivalConditions, rivalMatchPlayer } from '../src/engine/season/rival'
import { selectEntrants, runTournament, kidSeedIndexIn } from '../src/engine/season/tournament'
import { fieldProsFor, mergedWtaRanking, universeForTier, FIELD } from '../src/engine/season/fieldPros'
import type { AiPlayer, RankingRow, SeasonEvent, TierId } from '../src/engine/season/types'
import type { WorldState } from '../src/engine/world'

const args = process.argv.slice(2)
const argOf = (name: string, fallback: number): number => {
  const i = args.indexOf(`--${name}`)
  return i >= 0 && args[i + 1] ? Number(args[i + 1]) : fallback
}
const SEED_COUNT = argOf('seeds', 10)
const MIN_EVENTS = argOf('events', 200)

/** The owner's reference strong-junior build (ITF-#6, five W15 titles in a row). */
const REF_BUILD = { serve: 66, ret: 50, composure: 57, stamina: 54, groundstrokes: 65 }

interface EventSample {
  fieldCore: number
  medianPos: number
  title: boolean
}

function median(xs: number[]): number {
  const s = [...xs].sort((a, b) => a - b)
  return s.length % 2 ? s[(s.length - 1) / 2] : (s[s.length / 2 - 1] + s[s.length / 2]) / 2
}
function mean(xs: number[]): number {
  return xs.reduce((a, b) => a + b, 0) / xs.length
}

/** One event, run exactly as computeShadowTournament runs it, against the given universe+ranking. */
function runEvent(
  world: WorldState,
  event: SeasonEvent,
  universe: AiPlayer[],
  ranking: RankingRow[],
  fatigue: Map<string, number>,
): EventSample {
  const kid = kidMatchPlayerFor(world, event.surface)
  const rng = rngFromSeed(`${world.seed}:kidtour:${event.id}`)
  const entrants = selectEntrants(event, universe, ranking, rng, fatigue)
  const field = entrants.map((p) => rivalMatchPlayer(p, event.surface, fatigue.get(p.id) ?? ECONOMY.condition.max))
  const result = runTournament(event, field, kid, world.seed, rng, kidSeedIndexIn(field, ranking, KID_ID))
  const posOf = new Map(ranking.map((r, i) => [r.playerId, i]))
  return {
    fieldCore: mean(entrants.map((p) => power(p))),
    medianPos: median(entrants.map((p) => (posOf.get(p.id) ?? ranking.length - 1) + 1)),
    title: result.finishes[KID_ID] === 0,
  }
}

function summarize(label: string, samples: EventSample[], tableSize: number): void {
  const titles = samples.filter((s) => s.title).length
  console.log(
    `  ${label}: events ${samples.length}  field mean core ${mean(samples.map((s) => s.fieldCore)).toFixed(1)}` +
      `  median entrant position ${Math.round(median(samples.map((s) => s.medianPos)))}/${tableSize}` +
      `  P(title) ${((100 * titles) / samples.length).toFixed(1)}%`,
  )
}

function eventsOf(world: WorldState, tier: TierId, cap: number): SeasonEvent[] {
  return world.season.filter((e) => e.tier === tier && e.week > world.week).slice(0, cap)
}

const before: EventSample[] = []
const afterW15: EventSample[] = []
const afterW35: EventSample[] = []

const MID_SEASON_WEEKS = 40

for (let s = 0; s < SEED_COUNT; s++) {
  const world = createWorld(`field-quality-${s}`)
  // Forty weeks of the real engine, exactly as the worker drives it: canonical AI brackets fill
  // the ledger, the cohort drifts and tires. She enters nothing – the AI world is independent of
  // her by construction, so this is the state ANY career meets at week 40.
  const rng = rngFromSeed(world.seed)
  for (let w = 0; w < MID_SEASON_WEEKS; w++) tickWeek(world, rng)
  // The reference build, fresh, in fresh kit – her five-in-a-row self at her best.
  world.skills = { ...REF_BUILD }
  world.condition = ECONOMY.condition.max

  const ids = world.cohort.map((p) => p.id)
  const noKid = world.results.filter((r) => r.playerId !== KID_ID)
  // BEFORE: the tick's exact inputs – the mixed canonical table over the LIVE cohort.
  const mixed = computeRanking(noKid, world.week, ids)
  // AFTER: the slice's exact inputs – merged W standings over cohort ∪ field pros.
  const pros = fieldProsFor(world.seed, 0, world.cohort.map((p) => p.name))
  const mergedAi = mergedWtaRanking(computeRanking(noKid, world.week, ids, inTrack('wta')), pros)
  const uni = universeForTier('w15', world.cohort, pros)
  const fatigue = rivalConditions(world.results, world.week)

  const perSeed = Math.ceil(MIN_EVENTS / SEED_COUNT)
  for (const e of eventsOf(world, 'w15', perSeed)) {
    before.push(runEvent(world, e, world.cohort, mixed, fatigue))
    afterW15.push(runEvent(world, e, uni, mergedAi, fatigue))
  }
  for (const e of eventsOf(world, 'w35', Math.ceil(perSeed / 2))) {
    afterW35.push(runEvent(world, e, uni, mergedAi, fatigue))
  }
}

console.log(`FIELD QUALITY – reference build serve 66/ret 50/comp 57/stam 54/ground 65, ${SEED_COUNT} worlds`)
console.log('W15, BEFORE (LIVE cohort over the mixed table – the shipped engine):')
summarize('w15 before', before, 199)
console.log('W15/W35, AFTER (cohort ∪ field pros over the merged W standings):')
summarize('w15 after ', afterW15, afterW15.length ? 199 + FIELD.size : 0)
summarize('w35 after ', afterW35, afterW35.length ? 199 + FIELD.size : 0)

// --- the calibration facts the pin test mirrors --------------------------------------------------
const world = createWorld('field-quality-cal')
const pros = fieldProsFor(world.seed, 0, world.cohort.map((p) => p.name))
const over50 = pros.filter((p) => p.wtaPoints > 50).length
const live = computeRanking(
  [{ playerId: KID_ID, week: 0, points: 50, tier: 'w15' as const }],
  0,
  [...world.cohort.map((p) => p.id), KID_ID],
  inTrack('wta'),
)
const merged = mergedWtaRanking(live, pros)
const herRank = merged.find((r) => r.playerId === KID_ID)?.rank
console.log('calibration:')
console.log(`  field pros holding > 50 W pts: ${over50} of ${pros.length}`)
console.log(`  a LIVE girl with five W15 titles (50 pts) lands #${herRank} of ${merged.length}`)
console.log(`  accepts – w35: top ${acceptanceRank(world, 'w35')}, w100: top ${acceptanceRank(world, 'w100')}`)
const byTier = new Map<string, number[]>()
for (const p of pros) {
  const list = byTier.get(p.strengthTier) ?? []
  list.push(power(p))
  byTier.set(p.strengthTier, list)
}
for (const [tier, cores] of byTier) {
  console.log(`  ${tier}: n ${cores.length}, mean core ${mean(cores).toFixed(1)}`)
}
