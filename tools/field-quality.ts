// FIELD QUALITY BENCH – the measurement the living-field slice exists to move (01.08), widened to
// the whole six-rung W family by W2-FIELD2 (02.08).
//
//   npx vite-node tools/field-quality.ts [--seeds N] [--events N] [--no-before] [--no-exclusivity]
//   npx vite-node tools/field-quality.ts --storey-probe
//   npx vite-node tools/field-quality.ts --bands "w15=0.35:0.85,w100=0.08:0.39"
//
// THE QUESTION: who is actually in a W draw, and what does that field do to a strong junior who
// enters it? The reference build is the owner's real case – the ITF-#6 girl who won five W15
// titles in a row losing one match total: serve 66 / ret 50 / composure 57 / stamina 54 /
// groundstrokes 65.
//
// BEFORE = the shipped engine's W15 field: `selectEntrants` over the LIVE cohort, positioned by
// the MIXED canonical table (the exact inputs tickWeek's shadow path used before the field ring).
// ⚠ IT IS THE PRE-FIELD UNIVERSE, NOT A FROZEN HISTORICAL NUMBER: the arm reads today's
// `entrantPctBand`, so its figure moves whenever the band does (W2-FIELD2's re-measure took it from
// 85.3% to 82.8% without touching the arm). What it is for is the contrast that started the slice —
// the mixed table hands a strong junior four W15 titles in five — and that survives any band.
// AFTER = the field slice as it stands: LIVE cohort ∪ derived field pros, positioned by the merged
// W standings, WITH the week-exclusivity rule applied exactly as `computeShadowTournament` applies
// it. Both sides run the FULL engine path for her events – same `seed:kidtour:<id>` sub-streams,
// same `rivalMatchPlayer` builds, same `runTournament` bracket with her real match engine – so the
// title probability is the engine's own answer, not a model of it.
//
// STANCE: each world first TICKS 40 real engine weeks (no entries, the canonical brackets running
// as they always do), so the probe reads a LIVE mid-season ledger – earned points, real rival
// fatigue – which is the state the owner's careers actually met their W15s in, not the fresh
// pre-history table of week 0. Every event is then measured "as if drawn this week", the preview's
// own stance. What varies per event is the event-scoped stream (field entry jitter, the bracket
// shuffle, her matches), which is exactly the variance a season of W-rungs has. Bench-first
// discipline: the constants in fieldPros.ts's FIELD table and the W rungs' `entrantPctBand`s move
// only with a re-run of this file in hand.
//
// ⚠ WHAT W2-FIELD2 ADDED, and why each column exists:
//
//   * ALL SIX RUNGS, not W15+W35. The file was written when the W family was three rungs and the
//     ladder above W35 was a ×5 cliff; W2-LADDER shipped W50/W75/WTA 125 and the fourth storey
//     (`tourElite`) exists to make the 125's field beat W100's the way W35's beats W15's. That
//     claim is a MONOTONICITY over six numbers and cannot be read off a two-rung printout.
//   * THE BACKFILL COLUMN (`out-of-band`). W100's own band comment records the failure mode this
//     catches: a "prestige" draw quietly half made of `selectEntrants`' out-of-window backfill.
//     Week exclusivity narrows every lower rung's candidate window on a shared week, so the share
//     of entrants who came from OUTSIDE the tier's `entrantPctBand` is the direct evidence that a
//     window still fills honestly. Printed per rung, and per rung on SHARED weeks alone.
//   * THE MERGED TABLE'S HEAD. The fourth storey's whole job is that the top of the W standings
//     reads like a real one; a points ladder is the only way to see it.
//   * THE PRO SHARE. How much of a rung's field is derived rather than LIVE – the number that says
//     whether the population is carrying the rung or the 199-strong cohort still is.

import {
  createWorld,
  tickWeek,
  kidMatchPlayerFor,
  acceptanceRank,
  inTrack,
  startingSkills,
  KID_ID,
} from '../src/engine/world'
import { BEST_N_BY_TRACK, computeRanking } from '../src/engine/season/ranking'
import { rngFromSeed } from '../src/engine/rng'
import { ECONOMY } from '../src/engine/economy'
import { power } from '../src/engine/season/cohort'
import { rivalConditions, rivalMatchPlayer } from '../src/engine/season/rival'
import {
  isEntrantBand,
  kidSeedIndexIn,
  runTournament,
  selectEntrants,
  weekFieldExclusion,
} from '../src/engine/season/tournament'
import { TIERS, TIER_LADDER, isTierAgeOpen } from '../src/engine/season/calendar'
import { fastMatchProbability } from '../src/engine/match/engine'
import { rollPotential } from '../src/engine/development'
import type { MatchPlayer } from '../src/engine/match/types'
import { fieldProsFor, isFieldProId, mergedWtaRanking, universeForTier } from '../src/engine/season/fieldPros'
import type { AiPlayer, RankingRow, SeasonEvent, TierId } from '../src/engine/season/types'
import type { WorldState } from '../src/engine/world'

const args = process.argv.slice(2)
const argOf = (name: string, fallback: number): number => {
  const i = args.indexOf(`--${name}`)
  return i >= 0 && args[i + 1] ? Number(args[i + 1]) : fallback
}
const SEED_COUNT = argOf('seeds', 10)
const MIN_EVENTS = argOf('events', 200)
const WITH_BEFORE = !args.includes('--no-before')
/** `--no-exclusivity` re-runs the AFTER arm with W2-FIELD2's week-exclusivity rule OFF – the direct
 *  before/after receipt for that half of the wave, on identical seeds and identical streams. */
const WITH_EXCL = !args.includes('--no-exclusivity')

/** The owner's reference strong-junior build (ITF-#6, five W15 titles in a row). */
const REF_BUILD = { serve: 66, ret: 50, composure: 57, stamina: 54, groundstrokes: 65 }

// --- MODE 1: THE STOREY PROBE (--storey-probe) ---------------------------------------------------
//
// «Core-skill band for the new storey must sit above elite's [56,66] by a MEASURED amount, not a
// guessed one.» Two measurements bound it from opposite sides, and between them there is exactly one
// band left to choose:
//
//   THE CEILING, from the KID's own talent roll. `rollPotential` (engine/development.ts) hands every
//   attribute `startingSkills` + U(4, 26), so a career's reachable core is a measurable distribution
//   and its top end is the hardest player this game can ever produce. A world #1 above THAT is a
//   world #1 no career can beat, which would make the tour the game is climbing towards a painted
//   backdrop. So the storey's top sits just under the p99 career's ceiling: reachable, and only by a
//   career that rolled near-max talent and realised it.
//
//   THE FLOOR, from the match engine. `fastMatchProbability` is the closed form that resolves every
//   AI-vs-AI match; the reference strong-junior build (the girl who is meant to win 15-35% of the
//   W15s she enters) must find the MEDIAN of the new storey roughly as hard as a W15 title is easy.
//   That is the storey being a storey rather than a re-labelling of the one below it: a median elite
//   is a coin flip for her, a median tourElite must not be.
//
// The width and the ±6 attribute spread copy the storey below; only the position is solved for.
if (args.includes('--storey-probe')) {
  const flat = (core: number, id: string): MatchPlayer => ({
    id,
    name: id,
    serve: core,
    ret: core,
    composure: core,
    stamina: core,
    groundstrokes: core,
  })
  const ref: MatchPlayer = { id: 'ref', name: 'ref', ...REF_BUILD }
  const beats = (a: MatchPlayer, b: MatchPlayer) =>
    fastMatchProbability(a, b, { surface: 'hard', tour: 'wta', seed: '' })
  const refPower = (REF_BUILD.serve + REF_BUILD.ret + REF_BUILD.composure + REF_BUILD.stamina) / 4
  console.log(`STOREY PROBE – reference build power ${refPower.toFixed(2)}, closed-form P(she wins) vs a flat core`)
  for (let c = 54; c <= 84; c += 2) {
    console.log(`  core ${c}: P(ref beats) ${(100 * beats(ref, flat(c, `c${c}`))).toFixed(1)}%`)
  }
  // THE CEILING: what a career can actually become. 20,000 talent rolls off the real function, read
  // as the mean-of-four the pyramid's `core` is denominated in.
  const ceilings: number[] = []
  for (let i = 0; i < 20000; i++) {
    const seed = `ceiling-probe-${i}`
    const pot = rollPotential(seed, startingSkills(seed, { background: 'middle' } as never))
    ceilings.push((pot.serve + pot.ret + pot.composure + pot.stamina) / 4)
  }
  const sorted = [...ceilings].sort((a, b) => a - b)
  const pct = (q: number) => sorted[Math.min(sorted.length - 1, Math.floor(q * sorted.length))]
  console.log(
    `  KID CEILING (20k rolls of rollPotential, mean-of-four): p50 ${pct(0.5).toFixed(1)} · p90 ${pct(0.9).toFixed(1)}` +
      ` · p99 ${pct(0.99).toFixed(1)} · max ${sorted[sorted.length - 1].toFixed(1)}`,
  )
  console.log(`  elite storey's measured mean core 61.8: P(ref beats her) ${(100 * beats(ref, flat(61.8, 'e'))).toFixed(1)}%`)
  process.exit(0)
}

// --- BAND OVERRIDES (--bands w15=0.30:0.85,w35=0.22:0.70) ----------------------------------------
//
// The sweep handle for `entrantPctBand`. A rung's window is the ONLY thing that separates its field
// from the rung below (L6's own note: entry is position-biased, so the FLOOR is what unlocks head
// rows), so re-measuring the family means running this file once per candidate set. The override is
// applied to the live `TIERS` table before any world is built – the tool is a measurement harness,
// and the numbers it settles on are then written into calendar.ts by hand, with the printout.
const bandArg = args.indexOf('--bands') >= 0 ? (args[args.indexOf('--bands') + 1] ?? '') : ''
for (const spec of bandArg.split(',').filter(Boolean)) {
  const [tier, band] = spec.split('=')
  const [lo, hi] = band.split(':').map(Number)
  TIERS[tier as TierId].entrantPctBand = [lo, hi]
}

/** The family, weakest rung first – the order every monotonicity claim below is read in. */
const W_RUNGS: readonly TierId[] = ['w15', 'w35', 'w50', 'w75', 'w100', 'wta125']
const rungOf = (t: TierId) => TIER_LADDER.indexOf(t)

interface EventSample {
  fieldCore: number
  medianPos: number
  title: boolean
  /** entrants who fell OUTSIDE the tier's own `entrantPctBand` – `selectEntrants`' backfill at work */
  outOfBand: number
  /** entrants who are derived professionals rather than LIVE cohort girls */
  pros: number
  /** candidates the window held for this draw, age gate and week exclusivity applied */
  candidates: number
  /** does a higher W rung run in the same week? A calendar fact, so the `*` rows below are the same
   *  set of events with the rule ON and OFF and the two printouts compare like with like. */
  shared: boolean
}

function median(xs: number[]): number {
  const s = [...xs].sort((a, b) => a - b)
  return s.length % 2 ? s[(s.length - 1) / 2] : (s[s.length / 2 - 1] + s[s.length / 2]) / 2
}
function mean(xs: number[]): number {
  return xs.reduce((a, b) => a + b, 0) / xs.length
}

/** How many players the tier's window actually holds for this event – the same three filters
 *  `selectEntrants` applies, in the same order (age gate, week exclusivity, percentile band), so a
 *  short window shows up here before it shows up as a backfilled draw. */
function candidatesFor(
  event: SeasonEvent,
  universe: readonly AiPlayer[],
  ranking: readonly RankingRow[],
  excluded: ReadonlySet<string>,
): number {
  const total = ranking.length || universe.length
  const posOf = new Map(ranking.map((r, i) => [r.playerId, i]))
  return universe.filter(
    (p) =>
      isTierAgeOpen(event.tier, p.ageYears) &&
      !excluded.has(p.id) &&
      isEntrantBand(event.tier, ((posOf.get(p.id) ?? total - 1) + 1) / total),
  ).length
}

/** One event, run exactly as computeShadowTournament runs it, against the given universe+ranking. */
function runEvent(
  world: WorldState,
  event: SeasonEvent,
  universe: AiPlayer[],
  ranking: RankingRow[],
  fatigue: Map<string, number>,
  /** the W-track week-exclusivity set; empty for the BEFORE arm and for a week with one W rung */
  excluded: ReadonlySet<string> = new Set(),
  shared = false,
): EventSample {
  const kid = kidMatchPlayerFor(world, event.surface)
  const rng = rngFromSeed(`${world.seed}:kidtour:${event.id}`)
  const entrants = selectEntrants(event, universe, ranking, rng, fatigue, excluded)
  const field = entrants.map((p) => rivalMatchPlayer(p, event.surface, fatigue.get(p.id) ?? ECONOMY.condition.max))
  const result = runTournament(event, field, kid, world.seed, rng, kidSeedIndexIn(field, ranking, KID_ID))
  const posOf = new Map(ranking.map((r, i) => [r.playerId, i]))
  const total = ranking.length || universe.length
  const pctOf = (id: string) => ((posOf.get(id) ?? total - 1) + 1) / total
  return {
    fieldCore: mean(entrants.map((p) => power(p))),
    medianPos: median(entrants.map((p) => (posOf.get(p.id) ?? ranking.length - 1) + 1)),
    title: result.finishes[KID_ID] === 0,
    outOfBand: entrants.filter((p) => !isEntrantBand(event.tier, pctOf(p.id))).length,
    pros: entrants.filter((p) => isFieldProId(p.id)).length,
    candidates: candidatesFor(event, universe, ranking, excluded),
    shared,
  }
}

function summarize(label: string, samples: EventSample[], tableSize: number): void {
  if (!samples.length) {
    console.log(`  ${label}: no events sampled`)
    return
  }
  const titles = samples.filter((s) => s.title).length
  const drawSize = 32
  console.log(
    `  ${label.padEnd(7)}: events ${String(samples.length).padStart(4)}` +
      `  core ${mean(samples.map((s) => s.fieldCore)).toFixed(1)}` +
      `  medPos ${String(Math.round(median(samples.map((s) => s.medianPos)))).padStart(3)}/${tableSize}` +
      `  P(title) ${((100 * titles) / samples.length).toFixed(1).padStart(5)}%` +
      `  pros ${((100 * mean(samples.map((s) => s.pros))) / drawSize).toFixed(0).padStart(3)}%` +
      `  out-of-band ${((100 * mean(samples.map((s) => s.outOfBand))) / drawSize).toFixed(1).padStart(4)}%` +
      `  cand min ${Math.min(...samples.map((s) => s.candidates))} (mean ${Math.round(mean(samples.map((s) => s.candidates)))})`,
  )
}

function eventsOf(world: WorldState, tier: TierId, cap: number): SeasonEvent[] {
  return world.season.filter((e) => e.tier === tier && e.week > world.week).slice(0, cap)
}

const before: EventSample[] = []
const after = new Map<TierId, EventSample[]>(W_RUNGS.map((t) => [t, []]))

const MID_SEASON_WEEKS = 40
let tableSize = 0

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
  const mixed = computeRanking(noKid, world.week, 6, ids)
  // AFTER: the slice's exact inputs – merged W standings over cohort ∪ field pros.
  const pros = fieldProsFor(world.seed, 0, world.cohort.map((p) => p.name))
  const mergedAi = mergedWtaRanking(computeRanking(noKid, world.week, BEST_N_BY_TRACK.wta, ids, inTrack('wta')), pros)
  const uni = universeForTier('w15', world.cohort, pros)
  const fatigue = rivalConditions(world.results, world.week)
  tableSize = mergedAi.length

  const perSeed = Math.ceil(MIN_EVENTS / SEED_COUNT)
  for (const tier of W_RUNGS) {
    for (const e of eventsOf(world, tier, perSeed)) {
      // The shipped path's own exclusion set: every W rung ABOVE this one on the same week draws
      // first, off its own `seed:kidtour:` stream, and its members leave this window.
      const shared = world.season.some(
        (o) => o.week === e.week && o.id !== e.id && TIERS[o.tier].track === 'wta' && rungOf(o.tier) > rungOf(e.tier),
      )
      const excluded = WITH_EXCL
        ? weekFieldExclusion(e, world.season, uni, mergedAi, world.seed, fatigue)
        : new Set<string>()
      after.get(tier)!.push(runEvent(world, e, uni, mergedAi, fatigue, excluded, shared))
      if (tier === 'w15' && WITH_BEFORE) before.push(runEvent(world, e, world.cohort, mixed, fatigue))
    }
  }
}

console.log(`FIELD QUALITY – reference build serve 66/ret 50/comp 57/stam 54/ground 65, ${SEED_COUNT} worlds`)
if (WITH_BEFORE) {
  console.log('W15, BEFORE (LIVE cohort over the mixed table – the pre-field engine):')
  summarize('before', before, 199)
}
console.log(`AFTER (cohort ∪ field pros over the merged W standings, week exclusivity on), six rungs:`)
for (const tier of W_RUNGS) summarize(tier, after.get(tier)!, tableSize)

// --- the two family claims, computed rather than eyeballed ---------------------------------------
const cores = W_RUNGS.map((t) => ({ t, core: after.get(t)!.length ? mean(after.get(t)!.map((s) => s.fieldCore)) : NaN }))
const breaks = cores.filter((c, i) => i > 0 && !(c.core > cores[i - 1].core))
console.log(
  `  MONOTONE field strength (${cores.map((c) => `${c.t} ${c.core.toFixed(1)}`).join(' < ')}): ` +
    (breaks.length ? `✗ broken at ${breaks.map((b) => b.t).join(', ')}` : '✓'),
)
const titles = W_RUNGS.map((t) => {
  const s = after.get(t)!
  return { t, p: s.length ? (100 * s.filter((x) => x.title).length) / s.length : NaN }
})
const w15Title = titles[0].p
console.log(
  `  P(title) by rung: ${titles.map((x) => `${x.t} ${x.p.toFixed(1)}%`).join(' · ')}` +
    `  |  W15 target 15-35%: ${w15Title >= 15 && w15Title <= 35 ? '✓' : '✗'}`,
)
// The exclusivity receipt: shared weeks are where the rule actually bites, so they get their own row.
for (const tier of W_RUNGS) {
  const shared = after.get(tier)!.filter((s) => s.shared)
  if (shared.length) summarize(`${tier}*`, shared, tableSize)
}
console.log('  (* = only the weeks where a HIGHER W rung drew first – the exclusivity rule biting)')

// --- the calibration facts the pin test mirrors --------------------------------------------------
const world = createWorld('field-quality-cal')
const pros = fieldProsFor(world.seed, 0, world.cohort.map((p) => p.name))
const over50 = pros.filter((p) => p.wtaPoints > 50).length
const live = computeRanking(
  [{ playerId: KID_ID, week: 0, points: 50, tier: 'w15' as const }],
  0,
  BEST_N_BY_TRACK.wta,
  [...world.cohort.map((p) => p.id), KID_ID],
  inTrack('wta'),
)
const merged = mergedWtaRanking(live, pros)
const herRank = merged.find((r) => r.playerId === KID_ID)?.rank
console.log('calibration:')
console.log(`  field pros holding > 50 W pts: ${over50} of ${pros.length}`)
console.log(`  a LIVE girl with five W15 titles (50 pts) lands #${herRank} of ${merged.length} [target #40-80]`)
console.log(`  accepts – ${W_RUNGS.slice(1).map((t) => `${t}: top ${acceptanceRank(world, t)}`).join(', ')}`)
const byTier = new Map<string, number[]>()
for (const p of pros) {
  const list = byTier.get(p.strengthTier) ?? []
  list.push(power(p))
  byTier.set(p.strengthTier, list)
}
for (const [tier, cores2] of byTier) {
  const pts = pros.filter((p) => p.strengthTier === tier).map((p) => p.wtaPoints)
  console.log(
    `  ${tier.padEnd(10)}: n ${String(cores2.length).padStart(3)}  mean core ${mean(cores2).toFixed(1)}` +
      `  pts ${Math.min(...pts)}..${Math.max(...pts)} (median ${Math.round(median(pts))})`,
  )
}
// THE HEAD OF THE TABLE – the fourth storey's whole reason for existing, as a points ladder.
const head = [1, 2, 3, 5, 10, 20, 32, 50, 64, 100, 150, 200, 300]
console.log(
  `  merged table head: ${head
    .filter((n) => n <= merged.length)
    .map((n) => `#${n} ${merged[n - 1].points}`)
    .join(' · ')}`,
)
