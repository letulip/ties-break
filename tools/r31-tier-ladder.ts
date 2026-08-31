/**
 * r31 #3 – IS A CHEAPER TIER AN EASIER FIRST ROUND? And if not, WHY not.
 *
 * THE FINDING THIS EXISTS TO SETTLE (docs/rounds/round-31.md #3, measured on the owner's w896 save,
 * n=1..5 per tier on ONE save and ONE week):
 *
 *     Local Open              1865   43%
 *     Regional Championship   1783   54%
 *     Junior Tour 30          1610   75%
 *     World Tour 15           1315   95%
 *     World Tour 500          1744   61%
 *     World Tour 1000         1676   69%
 *
 * A neighbourhood Local Open reads as a HARDER first round than a World Tour 1000. That is either a
 * real inversion or five cards of noise, and a constant must not move until the difference is known.
 *
 * ⚠ SO THIS TOOL DOES NOT ASK "IS IT INVERTED". It asks WHAT MAKES THE OPPONENT WHO SHE IS, and
 * prints every step between the tier and the girl across the net, per tier, over many seeds and many
 * weeks:
 *
 *   band      – the strength of the ENTRANT POOL the rung's `entrantPctBand` selects (mean rating of
 *               every candidate, before any draw). If the pool is not capped to the tier, the
 *               inversion is in `calendar.ts` and nothing downstream can repair it.
 *   drawn     – the strength of the 8/16/32 who actually ENTER. `selectEntrants` fills from the TOP
 *               of the band (`key = position + rng × drawSize`), so this is always stronger than the
 *               band and the gap is the position bias.
 *   R1 opp    – the one she meets. The gap between `drawn` and `R1 opp` is SEEDING: an unseeded kid
 *               is shuffled into the tail, and a seed's neighbour is always an unseeded slot.
 *   seeded%   – how often her round-one opponent is one of the `seedsFor(drawSize)` seeds. This is
 *               the "seeding protection fails on small draws" hypothesis, stated as a number.
 *   herSeed   – her own seed index in the field (`kidSeedIndexIn`), and whether it is inside the
 *               seeded head. A seeded kid cannot meet a seed in round one at all.
 *   backfill% – the share of entrants who came from OUTSIDE the band, through `selectEntrants`'
 *               nearest-position backfill. That path sorts BEST-STANDING-FIRST, so if it fires on a
 *               small rung it imports the strongest players in the world into a Local Open.
 *
 * ⚠ IT DRIVES THE GAME'S OWN PREVIEW, NOT A MODEL OF ONE. The `chance` and `opp rating` columns come
 * out of `upcomingEvents` – the same call the Season screen makes, the same one the round measured.
 * The decomposition columns re-run `selectEntrants`/`buildDraw` on the same sub-stream in the same
 * order, which is what `preview.ts`'s own `drawnField` does; nothing about entry or seeding is
 * re-implemented here.
 *
 * TWO ARMS, and they answer different halves:
 *   --sweep N     N fresh careers ticked `--weeks` weeks, every card observed every `--every` weeks
 *                 from `--from`. ⚠ THE HORIZON IS ITSELF A MEASUREMENT: at 120 weeks the ladder is
 *                 already monotone and nothing is wrong, because the conveyor has not yet turned a
 *                 class over. Use `--from 500 --every 8 --weeks 950` to reach the steady state the
 *                 owner's saves are in.
 *   --save <path> the owner's own career, read-only. Reproduces the round's table so the sweep can
 *                 be trusted to be measuring the same thing he saw.
 *
 * ⚠ THE "BEFORE" COLUMN OF docs/specs/tier-ladder-and-band.md CANNOT BE TAKEN WITH THIS FILE, and
 * that is a property of the fix rather than an oversight: it imports `aiSelectionRanking`, which the
 * pre-change engine does not export. The A arm was measured with a reduced twin importing only
 * symbols BOTH arms have (`upcomingEvents`, `createWorld`, `tickWeek`), byte-identical in the two
 * worktrees – md5 checked – run in a detached worktree at origin/main with the reader confirmed
 * absent (`git grep aiSelectionRanking -- src` empty). To re-take it, revert the engine commit into
 * a worktree of its own and run that twin, never this file.
 *
 * ⚠ MEASUREMENT ONLY. Imports the engine read-only, changes no constant, ships no fixture. The
 * owner's saves are never written back and nothing is derived from one beyond the aggregates below.
 *
 * Run:
 *   npx vite-node tools/r31-tier-ladder.ts -- --sweep 8 --weeks 120
 *   npx vite-node tools/r31-tier-ladder.ts -- --save ~/Downloads/tennis-sim_alice-cfbv_w896.tsave
 */
import { readFileSync } from 'node:fs'
import { decodeExportFile } from '../src/engine/saveCodec'
import { createWorld, tickWeek, type WorldState } from '../src/engine/world'
import { DEFAULT_PROFILE } from '../src/shared/protocol'
import { rngFromSeed } from '../src/engine/rng'
import { ECONOMY } from '../src/engine/economy'
import { ratingOf } from '../src/engine/match/rating'
import { upcomingEvents } from '../src/engine/world/snapshot'
import { kidMatchPlayerFor } from '../src/engine/world/player'
import { coachTravelFareFor } from '../src/engine/world/sponsors'
import { fieldProsOf, rankingFor } from '../src/engine/world/ladder'
import { aiSelectionRanking } from '../src/engine/world/weekField'
import { TIERS, TIER_LADDER } from '../src/engine/season/calendar'
import { universeForTier } from '../src/engine/season/fieldPros'
import { rivalConditions, rivalMatchPlayer } from '../src/engine/season/rival'
import {
  JUNIOR_TOUR,
  buildDraw,
  firstRoundOpponent,
  isEntrantBand,
  kidSeedIndexIn,
  seedsFor,
  selectEntrants,
  weekFieldExclusion,
} from '../src/engine/season/tournament'
import type { AiPlayer, RankingRow, SeasonEvent, TierId } from '../src/engine/season/types'

const argv = process.argv.slice(2)
const numArg = (name: string, fallback: number): number => {
  const i = argv.indexOf(`--${name}`)
  return i >= 0 && argv[i + 1] ? Number(argv[i + 1]) : fallback
}
const saves: string[] = []
for (let i = 0; i < argv.length; i++) if (argv[i] === '--save') saves.push(argv[++i])
const SWEEP = argv.includes('--sweep') ? numArg('sweep', 8) : saves.length ? 0 : 8
const WEEKS = numArg('weeks', 120)

interface Row {
  chance: number[]
  oppRating: number[]
  kidRating: number[]
  bandRating: number[]
  drawnRating: number[]
  oppSeeded: number[]
  herSeeded: number[]
  backfill: number[]
  bandLabel: string[]
  poolN: number[]
  fitShare: number[]
  poolPct: number[]
  posRatingRho: number[]
  poolAge: number[]
  drawnAge: number[]
  headRat: number[]
}
const rowFor = (m: Map<TierId, Row>, t: TierId): Row => {
  let r = m.get(t)
  if (!r) {
    r = {
      chance: [], oppRating: [], kidRating: [], bandRating: [], drawnRating: [], oppSeeded: [],
      herSeeded: [], backfill: [], bandLabel: [], poolN: [], fitShare: [], poolPct: [], posRatingRho: [],
      poolAge: [], drawnAge: [], headRat: [],
    }
    m.set(t, r)
  }
  return r
}
const mean = (xs: readonly number[]): number => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : NaN)

/** ⭐ SPEARMAN OVER (STANDINGS POSITION, RATING) FOR THE WHOLE UNIVERSE – the one number that says
 *  whether a percentile window can strength-cap anything at all. `entrantPctBand` selects on
 *  POSITION; if position does not track strength, the window is selecting a slice of noise and every
 *  constant downstream is tuning a table that does not sort. +1 = the standings and the ratings agree
 *  perfectly, 0 = the table says nothing about who is good. */
function positionRatingRho(universe: readonly AiPlayer[], posOf: ReadonlyMap<string, number>, total: number, surface: SeasonEvent['surface']): number {
  const rows = universe
    .map((p) => ({ pos: posOf.get(p.id) ?? total - 1, rat: ratingOf(rivalMatchPlayer(p, surface, ECONOMY.condition.max), surface, JUNIOR_TOUR) }))
    .filter((r) => Number.isFinite(r.rat))
  if (rows.length < 3) return NaN
  const rank = (key: 'pos' | 'rat'): Map<number, number> => {
    const order = [...rows].sort((a, b) => a[key] - b[key])
    const m = new Map<number, number>()
    order.forEach((r, i) => m.set(rows.indexOf(r), i))
    return m
  }
  const rp = rank('pos')
  const rr = rank('rat')
  const n = rows.length
  let d2 = 0
  for (let i = 0; i < n; i++) {
    const d = (rp.get(i) ?? 0) - (rr.get(i) ?? 0)
    d2 += d * d
  }
  // Position ascends as strength DESCENDS, so a healthy table gives -1 here; negate so the printed
  // number reads "how well the table sorts by strength", +1 = perfectly.
  return -(1 - (6 * d2) / (n * (n * n - 1)))
}

/** THE DECOMPOSITION, and every line of it is a call the engine already makes on this event.
 *  Returns null on a rung whose universe this world cannot fill (nothing to say, not a zero). */
function decompose(
  world: WorldState,
  event: SeasonEvent,
  ranking: RankingRow[],
  cohort: AiPlayer[],
  excluded: ReadonlySet<string> | undefined,
  /** WHERE SHE STANDS – the tier's own track's table, as `previewEvent` now takes it. */
  standing: RankingRow[],
): {
  band: number
  drawn: number
  oppSeeded: boolean
  herSeeded: boolean
  backfill: number
  poolN: number
  fitShare: number
  poolPct: number
  rho: number
  poolAge: number
  drawnAge: number
  headRat: number
} | null {
  const kid = kidMatchPlayerFor(world, event.surface, coachTravelFareFor(world, event) > 0)
  const conditions = rivalConditions(world.results, world.week)
  const total = ranking.length || cohort.length
  const posOf = new Map<string, number>()
  ranking.forEach((r, i) => posOf.set(r.playerId, i))
  const pctOf = (id: string) => ((posOf.get(id) ?? total - 1) + 1) / total

  // THE POOL, before any draw: everybody the rung's own window admits.
  const pool = cohort.filter((p) => isEntrantBand(event.tier, pctOf(p.id)))
  const bandRating = mean(pool.map((p) => ratingOf(rivalMatchPlayer(p, event.surface, ECONOMY.condition.max), event.surface, JUNIOR_TOUR)))

  // THE DRAW, on the event's own sub-stream in the preview's own order.
  const rng = rngFromSeed(`${world.seed}:kidtour:${event.id}`)
  const picked = selectEntrants(event, cohort, ranking, rng, conditions, excluded)
  const entrants = picked.map((p) => rivalMatchPlayer(p, event.surface, ECONOMY.condition.max))
  const drawnRating = mean(entrants.map((p) => ratingOf(p, event.surface, JUNIOR_TOUR)))
  const inBand = new Set(pool.map((p) => p.id))
  const backfill = picked.length ? picked.filter((p) => !inBand.has(p.id)).length / picked.length : 0

  const kidSeedIndex = kidSeedIndexIn(entrants, standing, kid.id)
  const alive = buildDraw(event, entrants, kid, kidSeedIndex, rng)
  const opp = firstRoundOpponent(alive, kid)
  if (!opp) return null
  const seeds = seedsFor(alive.length)
  // A player is a seed iff she holds one of the first `seeds` STANDINGS places in the field – which
  // is exactly the slice `buildDraw` places by `standardSeedOrder` rather than shuffling.
  const field = entrants.slice(0, TIERS[event.tier].drawSize - 1)
  field.splice(Math.max(0, Math.min(kidSeedIndex, field.length)), 0, kid)
  const seedIds = new Set(field.slice(0, seeds).map((p) => p.id))
  // HOW MANY OF THE POOL THE FATIGUE FLOOR LEAVES STANDING, and where the pool sits in the table.
  // If a rung's window admits 90 players and 12 are fit, `selectEntrants` is not choosing from the
  // window at all – it is taking everybody who can stand up.
  const floor = ECONOMY.availability.minConditionToEnter[event.tier]
  const fitShare = pool.length ? pool.filter((p) => (conditions.get(p.id) ?? ECONOMY.condition.max) >= floor).length / pool.length : 0
  return {
    band: bandRating,
    drawn: drawnRating,
    oppSeeded: seedIds.has(opp.id),
    herSeeded: seedIds.has(kid.id),
    backfill,
    poolN: pool.length,
    fitShare,
    poolPct: pool.length ? mean(pool.map((p) => pctOf(p.id))) : NaN,
    rho: positionRatingRho(cohort, posOf, total, event.surface),
    poolAge: mean(pool.map((p) => p.ageYears)),
    drawnAge: mean(picked.map((p) => p.ageYears)),
    // THE HEAD OF THE WINDOW, with no jitter, no fatigue gate and no backfill: the `drawSize` best
    // POSITIONED players the window admits. If this is already inverted the cause is upstream of
    // every selection rule and lies in the table the window is a window ON.
    headRat: mean(
      [...pool]
        .sort((a, b) => (posOf.get(a.id) ?? total - 1) - (posOf.get(b.id) ?? total - 1))
        .slice(0, TIERS[event.tier].drawSize)
        .map((p) => ratingOf(rivalMatchPlayer(p, event.surface, ECONOMY.condition.max), event.surface, JUNIOR_TOUR)),
    ),
  }
}

function observe(world: WorldState, by: Map<TierId, Row>): void {
  // ⚠ THE SAME TWO TABLES `upcomingEvents` HANDS THE PREVIEW – selection and standing – or the
  // decomposition below would describe a preview nobody renders.
  const selRanking = aiSelectionRanking(world)
  let wtaCtx: { ranking: RankingRow[] } | null = null
  for (const e of upcomingEvents(world)) {
    const r = rowFor(by, e.tier)
    const ch = e.preview.firstMatchChance as number | null
    if (ch !== null) r.chance.push(ch)
    if (e.preview.opponentRating !== null) r.oppRating.push(e.preview.opponentRating)
    r.kidRating.push(e.preview.kidRating)
    r.bandLabel.push(e.preview.fieldStrength)

    const seasonEvent = world.season.find((s) => s.id === e.id)
    if (!seasonEvent) continue
    const isWta = TIERS[e.tier].track === 'wta'
    let d: ReturnType<typeof decompose> = null
    if (isWta) {
      wtaCtx ??= { ranking: rankingFor(world, 'wta') }
      const universe = universeForTier(e.tier, world.cohort, fieldProsOf(world))
      const excluded = weekFieldExclusion(
        seasonEvent,
        world.season,
        universe,
        wtaCtx.ranking,
        world.seed,
        rivalConditions(world.results, world.week),
      )
      d = decompose(world, seasonEvent, wtaCtx.ranking, universe, excluded, wtaCtx.ranking)
    } else {
      d = decompose(world, seasonEvent, selRanking, world.cohort, undefined, rankingFor(world, TIERS[e.tier].track))
    }
    if (!d) continue
    r.bandRating.push(d.band)
    r.drawnRating.push(d.drawn)
    r.oppSeeded.push(d.oppSeeded ? 1 : 0)
    r.herSeeded.push(d.herSeeded ? 1 : 0)
    r.backfill.push(d.backfill)
    r.poolN.push(d.poolN)
    r.fitShare.push(d.fitShare)
    r.poolPct.push(d.poolPct)
    r.posRatingRho.push(d.rho)
    r.poolAge.push(d.poolAge)
    r.drawnAge.push(d.drawnAge)
    r.headRat.push(d.headRat)
  }
}

function report(title: string, by: Map<TierId, Row>): void {
  console.log(`\n${title}`)
  console.log(
    `  ${'tier'.padEnd(9)} ${'draw'.padStart(4)} ${'n'.padStart(5)} ${'chance'.padStart(7)} ${'oppRat'.padStart(7)} ` +
      `${'herRat'.padStart(7)} ${'band'.padStart(7)} ${'drawn'.padStart(7)} ${'seedOpp'.padStart(8)} ${'sheSeed'.padStart(8)} ` +
      `${'backfil'.padStart(8)} ${'poolN'.padStart(6)} ${'fit'.padStart(5)} ${'poolPct'.padStart(8)} ${'rho'.padStart(6)} ${'headRat'.padStart(8)} ${'poolAge'.padStart(8)} ${'drwAge'.padStart(7)}  bands`,
  )
  for (const tier of TIER_LADDER) {
    const r = by.get(tier)
    if (!r || !r.kidRating.length) continue
    const bands = ['favourite', 'even', 'strong']
      .map((b) => `${b[0]}${((r.bandLabel.filter((x) => x === b).length / r.bandLabel.length) * 100).toFixed(0)}%`)
      .join(' ')
    console.log(
      `  ${tier.padEnd(9)} ${String(TIERS[tier].drawSize).padStart(4)} ${String(r.kidRating.length).padStart(5)} ` +
        `${(mean(r.chance) * 100).toFixed(0).padStart(6)}% ${mean(r.oppRating).toFixed(0).padStart(7)} ` +
        `${mean(r.kidRating).toFixed(0).padStart(7)} ${mean(r.bandRating).toFixed(0).padStart(7)} ` +
        `${mean(r.drawnRating).toFixed(0).padStart(7)} ${(mean(r.oppSeeded) * 100).toFixed(0).padStart(7)}% ` +
        `${(mean(r.herSeeded) * 100).toFixed(0).padStart(7)}% ${(mean(r.backfill) * 100).toFixed(0).padStart(7)}% ` +
        `${mean(r.poolN).toFixed(0).padStart(6)} ${(mean(r.fitShare) * 100).toFixed(0).padStart(4)}% ` +
        `${mean(r.poolPct).toFixed(2).padStart(8)} ${mean(r.posRatingRho).toFixed(2).padStart(6)} ` +
        `${mean(r.headRat).toFixed(0).padStart(8)} ${mean(r.poolAge).toFixed(1).padStart(8)} ${mean(r.drawnAge).toFixed(1).padStart(7)}  ${bands}`,
    )
  }
  // ⭐ THE BAND, AS A DISTRIBUTION AND AGAINST THE RING BESIDE IT (round 31 #3 defect (b)). A band
  // that takes one value cannot be planned against, and a band that disagrees with its own ring is
  // a new defect rather than a fix – so both are printed, over every card and over the cards she
  // can actually ENTER, which is the population the owner plans from.
  const bands: { band: string; chance: number }[] = []
  for (const [, r] of by) r.bandLabel.forEach((b, i) => { if (i < r.chance.length) bands.push({ band: b, chance: r.chance[i] }) })
  console.log('')
  console.log('  BAND vs RING – the two readings the card shows side by side')
  for (const b of ['favourite', 'even', 'strong']) {
    const g = bands.filter((x) => x.band === b)
    if (!g.length) { console.log(`    ${b.padEnd(10)} n=0`); continue }
    // A `favourite` that shows a ring under 50%, or a `strong` that shows one over it, is the shape
    // the owner named: «says favourite and then shows 24%».
    const bad = b === 'favourite' ? g.filter((x) => x.chance < 0.5).length : b === 'strong' ? g.filter((x) => x.chance > 0.5).length : 0
    console.log(`    ${b.padEnd(10)} n=${String(g.length).padStart(5)}  mean ring ${(mean(g.map((x) => x.chance)) * 100).toFixed(1).padStart(5)}%  CONTRADICTS the ring on ${bad} (${((bad / g.length) * 100).toFixed(1)}%)`)
  }
  const all = by.size ? [...by.values()].flatMap((r) => r.bandLabel) : []
  const missing = ['favourite', 'even', 'strong'].filter((b) => !all.includes(b))
  console.log(`  BAND DISTRIBUTION over ${all.length} cards: ` + ['favourite', 'even', 'strong'].map((b) => `${b} ${all.filter((x) => x === b).length}`).join('  '))
  console.log(`    ${missing.length ? `⚠ DEGENERATE – never occurs: ${missing.join(', ')}` : '✓ all three bands occur'}`)

  // ⭐ MONOTONICITY, STATED AS THE CLAIM IT IS – and PER FAMILY, because the three ladders are three
  // ladders. Walking UP a family, the first round must not get easier. The cross-family step
  // (a J300 to a World Tour 15) is NOT a claim this makes: a W15 is the first rung of a different
  // tour and the round's own table shows it reading easier than a junior Slam feeder, which is the
  // shape docs/lore/setting.md §6 describes rather than a defect.
  const FAMILIES: ReadonlyArray<readonly [string, readonly TierId[]]> = [
    ['domestic', TIER_LADDER.filter((t) => TIERS[t].track === 'domestic')],
    ['itf     ', TIER_LADDER.filter((t) => TIERS[t].track === 'itf')],
    ['wta     ', TIER_LADDER.filter((t) => TIERS[t].track === 'wta')],
  ]
  let total = 0
  console.log('')
  for (const [name, rungs] of FAMILIES) {
    const seen = rungs.filter((t) => (by.get(t)?.chance.length ?? 0) > 0)
    const inversions: string[] = []
    for (let i = 1; i < seen.length; i++) {
      const lo = mean(by.get(seen[i - 1])!.chance)
      const hi = mean(by.get(seen[i])!.chance)
      if (hi > lo) inversions.push(`${seen[i]} (${(hi * 100).toFixed(0)}%) is EASIER than ${seen[i - 1]} (${(lo * 100).toFixed(0)}%)`)
    }
    total += inversions.length
    console.log(`  MONOTONICITY ${name} over ${seen.length} rungs: ${inversions.length} inversion(s)`)
    for (const s of inversions) console.log(`    \u26a0 ${s}`)
  }
  console.log(`  MONOTONICITY total: ${total} inversion(s)`)
}

if (SWEEP > 0) {
  const by = new Map<TierId, Row>()
  for (let s = 0; s < SWEEP; s++) {
    const seed = `ladder-${s}`
    const world = createWorld(seed, { ...DEFAULT_PROFILE })
    const rng = rngFromSeed(`${seed}:bench`)
    for (let w = 0; w < WEEKS; w++) {
      observe(world, by)
      tickWeek(world, rng)
    }
  }
  report(`SWEEP – ${SWEEP} careers × ${WEEKS} weeks, every upcoming card observed every week`, by)
}

for (const path of saves) {
  const world = (await decodeExportFile(new Uint8Array(readFileSync(path)))) as WorldState
  const by = new Map<TierId, Row>()
  observe(world, by)
  report(`SAVE ${path.split('/').pop()} – week ${world.week}, the cards on screen`, by)
}
