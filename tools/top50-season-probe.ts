/**
 * top50-season-probe – round 29 item 14. WHAT DOES A SEASON AT THE TOP OF THE LADDER LOOK LIKE?
 *
 * The owner, on his own save at WTA #23, after season 2045:
 *   «Ни одной победы в 45 году, только 2е место на 500 и 250 и 2 взрыва ярости за год по случаю
 *    полосы вылетов в 1м раунде – не самый удачный год для 23 ракетки мира»
 *
 * Two findings are already on the table and his season sits on the SEAM between them
 * (docs/specs/the-drought-2026-08.md §4c, docs/research/title-drought-reality.md §3a):
 *   ours at #81-120 = 66.1% title-less, real 52.5% – nearly right;
 *   ours in the top 50 = 15.3% title-less, real 50.0% – 35 points too generous.
 * He is at #23. So this file measures the top of OUR ladder in three ways his complaint names:
 *
 *   §A THE DROUGHT BY RANK BAND, at a finer grain than the drought spec's "top 50": per-season
 *      title-less rate binned on her WTA rank at the season's last live week.
 *   §B THE SHAPE OF A TITLE-LESS SEASON: the best finish she reached. "Two runner-ups and no
 *      title" is a specific claim and it has a distribution.
 *   §C THE ANGER CROSSINGS. `computeLossStreak` is a RAW COUNT of consecutive competitive losses
 *      with a per-streak threshold drawn from ANGER_STREAK_MIN..MAX and NO rank term at all
 *      (the function's own comment: "computeLossStreak knows nothing of ranks"). So: does the
 *      crossing rate RISE with her ranking? If it does, the instrument is backwards – she is
 *      punished for climbing.
 *
 * ⚠ MEASUREMENT ONLY, and it reuses the drought harness rather than building a second one: the
 * corpus (9 econ-bench presets x N seeds), the `player` policy, the fourteen-to-horizon span, the
 * fork/retirement answers and ARM 1's `assertResolved` are all `drought-probe.ts`'s, imported or
 * copied verbatim. No engine constant is patched, shadowed or temporarily written; every career is
 * advanced through `stepCareerWeek`, the public path.
 *
 * ⚠ THE PER-WEEK READS ARE `computeLossStreak` AND `world.results`, AND BOTH ARE INERT.
 * `computeLossStreak` folds `world.events` and draws from `rngFromSeed(seed:angry:<startWeek>)` –
 * a purpose-scoped sub-stream that persists nothing and never touches MAIN – and `world.results`
 * is a plain array read. Neither reaches the memoised `fieldProsOf` that `growth-pace-probe` §2c
 * caught moving its own corpus through `tableSize`. It is still proved rather than asserted:
 * `--noWatch` drops both reads and prints the same FINGERPRINT line for the diff.
 *
 *   npx vite-node tools/top50-season-probe.ts -- [--seeds N] [--watch|--noWatch] [--json PATH]
 */
import { openCareer, stepCareerWeek, PRESETS, POLICIES, type Preset, type Policy } from './econ-bench'
import { FULL_CAREER_WEEKS } from './endings-bench'
import { answerFork, answerRetirement, computeLossStreak, seasonIndexOf, type WorldState } from '../src/engine/world'
import { TIERS, TIER_LADDER } from '../src/engine/season/calendar'
import { KID_ID } from '../src/engine/world/constants'
import type { TierId } from '../src/engine/season/types'
import { writeFileSync } from 'node:fs'

const args = process.argv.slice(2)
const argOf = (name: string, fallback: number): number => {
  const i = args.indexOf(`--${name}`)
  return i >= 0 && args[i + 1] ? Number(args[i + 1]) : fallback
}
const argStr = (name: string): string | null => {
  const i = args.indexOf(`--${name}`)
  return i >= 0 && args[i + 1] ? args[i + 1] : null
}
const SEEDS = argOf('seeds', 10)
const WATCH = !args.includes('--noWatch')
const JSON_OUT = argStr('json')
const POLICY: Policy = POLICIES[1] // `player`, the drought spec's MAIN arm

// -------------------------------------------------------------------------------------------------
// ARM 1 – drought-probe.ts's guard, verbatim reasoning: nothing may read a half-revealed draw
// -------------------------------------------------------------------------------------------------
function assertResolved(world: WorldState, where: string): void {
  if (world.pendingTournament !== null) {
    throw new Error(`top50-season-probe: READ BEFORE RESOLUTION at ${where} – week ${world.week}`)
  }
}

const paidRank = (w: WorldState): number | null => {
  const raw = w.kidRankWta
  return w.careerTotals.prizeCents > 0 && typeof raw === 'number' ? raw : null
}

/** finish index read back off the tier's own points table (counting-window.ts's inversion) */
function finishOf(tier: TierId, points: number): number | null {
  const i = TIERS[tier].points.indexOf(points)
  return i < 0 ? null : i
}

interface SeasonRow {
  seasonIndex: number
  weeksLived: number
  complete: boolean
  entries: number
  titles: number
  /** the FINISH INDEX of her best result that season, 0 = champion, 1 = runner-up. null = played none */
  bestFinish: number | null
  /** how many runner-up finishes */
  runnerUps: number
  /** entries where she won no match at all */
  firstRoundExits: number
  rankEnd: number | null
  /** anger crossings whose week falls in this season */
  crossings: number
  /** losing runs that REACHED their own threshold but were never sampled AT it (the `===` skip) */
  skippedCrossings: number
  /** the rungs she entered this season */
  tiers: Set<TierId>
}

interface Crossing {
  week: number
  seasonIndex: number
  rank: number | null
  runLength: number
  angerAt: number
}

interface Career {
  cell: string
  index: number
  weeks: number
  ending: string | null
  seasons: SeasonRow[]
  crossings: Crossing[]
  bestWta: number | null
}

function runCareer(cell: string, preset: Preset, index: number): Career {
  const { world, rng } = openCareer(preset, index, POLICY)
  const seasons = new Map<number, SeasonRow>()
  const crossings: Crossing[] = []
  const seenResults = new Set<string>()
  const seenTitles = new Map<TierId, number>()
  /** the run currently open, keyed on its start week – so a crossing is counted exactly once */
  let openRunStart: number | null = null
  let openRunMax = 0
  let openRunAnger = 0
  let openRunHitExactly = false
  let bestWta: number | null = null
  let weeks = 0

  const rowFor = (si: number): SeasonRow => {
    let row = seasons.get(si)
    if (row === undefined) {
      row = {
        seasonIndex: si,
        weeksLived: 0,
        complete: false,
        entries: 0,
        titles: 0,
        bestFinish: null,
        runnerUps: 0,
        firstRoundExits: 0,
        rankEnd: null,
        crossings: 0,
        skippedCrossings: 0,
        tiers: new Set(),
      }
      seasons.set(si, row)
    }
    return row
  }

  const closeRun = (): void => {
    if (openRunStart === null) return
    if (openRunMax >= openRunAnger && !openRunHitExactly) {
      // the run was long enough to break her and the face never showed it – see §C
      rowFor(seasonIndexOf(openRunStart)).skippedCrossings++
    }
    openRunStart = null
    openRunMax = 0
    openRunAnger = 0
    openRunHitExactly = false
  }

  for (; weeks < FULL_CAREER_WEEKS && world.ending === null; weeks++) {
    const commitWeek = world.week
    const row = rowFor(seasonIndexOf(commitWeek))
    row.weeksLived++

    const entered = stepCareerWeek(world, rng, POLICY)
    assertResolved(world, `${cell}/${index} after step`)
    for (const t of TIER_LADDER) {
      if (entered[t] > 0) {
        row.entries += entered[t]
        row.tiers.add(t)
      }
    }

    // --- the cabinet, diffed (drought-probe's read: the ledger's own stamped week is authority) --
    for (const t of TIER_LADDER) {
      const cabinet = world.trophiesByTier[t]
      if (cabinet === undefined) continue
      const seen = seenTitles.get(t) ?? 0
      for (let k = seen; k < cabinet.titles.length; k++) rowFor(seasonIndexOf(cabinet.titles[k])).titles++
      seenTitles.set(t, cabinet.titles.length)
    }

    if (WATCH) {
      // --- her own result rows, read incrementally out of the 52-week window -------------------
      for (const r of world.results) {
        if (r.playerId !== KID_ID || !r.tier) continue
        const key = `${r.week}:${r.tier}:${r.points}`
        if (seenResults.has(key)) continue
        seenResults.add(key)
        const f = finishOf(r.tier as TierId, r.points)
        if (f === null) continue
        const rr = rowFor(seasonIndexOf(r.week))
        if (rr.bestFinish === null || f < rr.bestFinish) rr.bestFinish = f
        if (f === 1) rr.runnerUps++
        const rounds = TIERS[r.tier as TierId].points.length - 1
        if (rounds - f === 0) rr.firstRoundExits++
      }

      // --- the anger crossing, sampled the same way the snapshot computes it -------------------
      const streak = computeLossStreak(world)
      if (streak === null) {
        closeRun()
      } else {
        if (openRunStart !== streak.startWeek) {
          closeRun()
          openRunStart = streak.startWeek
          openRunAnger = streak.angerAt
        }
        openRunMax = Math.max(openRunMax, streak.losses)
        if (streak.losses === streak.angerAt && !openRunHitExactly) {
          openRunHitExactly = true
          const si = seasonIndexOf(world.week)
          rowFor(si).crossings++
          crossings.push({
            week: world.week,
            seasonIndex: si,
            rank: paidRank(world),
            runLength: streak.losses,
            angerAt: streak.angerAt,
          })
        }
      }
    }

    if (world.fork !== null && world.fork.answer === null) answerFork(world, 'continue')
    if (world.retirementOffer !== null) answerRetirement(world, world.retirementOffer.final)

    const rank = paidRank(world)
    if (rank !== null && (bestWta === null || rank < bestWta)) bestWta = rank
    rowFor(seasonIndexOf(commitWeek)).rankEnd = rank
  }
  closeRun()

  const list = [...seasons.values()].sort((a, b) => a.seasonIndex - b.seasonIndex)
  for (const s of list) s.complete = s.weeksLived === 52
  return { cell, index, weeks, ending: world.ending?.type ?? null, seasons: list, crossings, bestWta }
}

// -------------------------------------------------------------------------------------------------
// run
// -------------------------------------------------------------------------------------------------
const careers: Career[] = []
for (const preset of PRESETS) {
  for (let i = 0; i < SEEDS; i++) careers.push(runCareer(preset.label, preset, i))
}

const fp = careers.reduce(
  (a, c) => ({
    titles: a.titles + c.seasons.reduce((x, s) => x + s.titles, 0),
    seasons: a.seasons + c.seasons.length,
    weeks: a.weeks + c.weeks,
    best: a.best + (c.bestWta ?? 0),
  }),
  { titles: 0, seasons: 0, weeks: 0, best: 0 },
)
console.log(
  `FINGERPRINT titles=${fp.titles} seasons=${fp.seasons} weeks=${fp.weeks} bestSum=${fp.best} ` +
    `careers=${careers.length} watch=${WATCH ? 'ON' : 'OFF'}`,
)
if (!WATCH) process.exit(0)

// -------------------------------------------------------------------------------------------------
// output
// -------------------------------------------------------------------------------------------------
function section(t: string): void {
  console.log(`\n${'='.repeat(96)}\n${t}\n${'='.repeat(96)}`)
}
/** Wilson 95%, the drought spec's interval */
function wilson(k: number, n: number): [number, number] {
  if (n === 0) return [0, 0]
  const p = k / n
  const z = 1.96
  const d = 1 + (z * z) / n
  const c = p + (z * z) / (2 * n)
  const s = z * Math.sqrt((p * (1 - p)) / n + (z * z) / (4 * n * n))
  return [(100 * (c - s)) / d, (100 * (c + s)) / d]
}
const pct = (k: number, n: number): string =>
  n === 0 ? '   n/a' : `${((100 * k) / n).toFixed(1).padStart(5)}%`
const ci = (k: number, n: number): string => {
  if (n === 0) return ''
  const [lo, hi] = wilson(k, n)
  return `[${lo.toFixed(1)}-${hi.toFixed(1)}]`
}

/** COMPLETE seasons only – a season cut short by an ending cannot be asked whether it had a title */
const complete = careers.flatMap((c) => c.seasons.filter((s) => s.complete && s.entries > 0))

const BANDS: { label: string; lo: number; hi: number }[] = [
  { label: 'top 10', lo: 1, hi: 10 },
  { label: '#11-25', lo: 11, hi: 25 },
  { label: '#26-50', lo: 26, hi: 50 },
  { label: '#51-80', lo: 51, hi: 80 },
  { label: '#81-120', lo: 81, hi: 120 },
  { label: '#121-200', lo: 121, hi: 200 },
  { label: '#201+', lo: 201, hi: 1e9 },
]
const bandOf = (rank: number | null): string | null =>
  rank === null ? null : (BANDS.find((b) => rank >= b.lo && rank <= b.hi)?.label ?? null)

section(`§A THE DROUGHT BY RANK BAND – ${careers.length} careers (9 presets x ${SEEDS} seeds), policy '${POLICY.id}'`)
console.log('Complete seasons in which she entered at least one event, binned on her WTA rank at the')
console.log("season's last live week. `dry` = no title at any rung that season.\n")
console.log('band        seasons   dry    rate    Wilson 95%        entries/season  R1 exits/season')
for (const b of BANDS) {
  const rows = complete.filter((s) => bandOf(s.rankEnd) === b.label)
  if (rows.length === 0) continue
  const dry = rows.filter((s) => s.titles === 0).length
  const ent = rows.reduce((a, s) => a + s.entries, 0) / rows.length
  const r1 = rows.reduce((a, s) => a + s.firstRoundExits, 0) / rows.length
  console.log(
    `${b.label.padEnd(10)}${String(rows.length).padStart(8)}${String(dry).padStart(7)}  ${pct(dry, rows.length)}  ` +
      `${ci(dry, rows.length).padEnd(16)}  ${ent.toFixed(1).padStart(13)}  ${r1.toFixed(2).padStart(14)}`,
  )
}
const top50 = complete.filter((s) => s.rankEnd !== null && s.rankEnd <= 50)
const dry50 = top50.filter((s) => s.titles === 0).length
console.log(
  `\nTOP 50 (the drought spec's own row, recomputed here): ${dry50}/${top50.length} = ` +
    `${pct(dry50, top50.length)} ${ci(dry50, top50.length)}   – the spec printed 15.3%`,
)
const t25 = complete.filter((s) => s.rankEnd !== null && s.rankEnd <= 25)
const dry25 = t25.filter((s) => s.titles === 0).length
console.log(`TOP 25:  ${dry25}/${t25.length} = ${pct(dry25, t25.length)} ${ci(dry25, t25.length)}`)

section('§B THE SHAPE OF A SEASON IN THE TOP 25 – best finish, and how often it is a final she lost')
const shapeRows = t25
const finishTally = new Map<number, number>()
for (const s of shapeRows) finishTally.set(s.bestFinish ?? -1, (finishTally.get(s.bestFinish ?? -1) ?? 0) + 1)
console.log('best finish that season        seasons    share')
const FIN_LABEL = (f: number): string =>
  f === -1 ? 'never read' : f === 0 ? 'CHAMPION' : f === 1 ? 'runner-up' : f === 2 ? 'semi-final' : f === 3 ? 'quarter-final' : `earlier (f=${f})`
for (const f of [...finishTally.keys()].sort((a, b) => a - b)) {
  console.log(`${FIN_LABEL(f).padEnd(30)}${String(finishTally.get(f)).padStart(8)}   ${pct(finishTally.get(f)!, shapeRows.length)}`)
}
const dryTop25 = shapeRows.filter((s) => s.titles === 0)
const dryFinal = dryTop25.filter((s) => s.bestFinish === 1).length
const dryTwoFinals = dryTop25.filter((s) => s.runnerUps >= 2).length
console.log(
  `\nOf the ${dryTop25.length} TITLE-LESS top-25 seasons: best finish was a LOST FINAL in ${dryFinal} ` +
    `(${pct(dryFinal, dryTop25.length)}); ${dryTwoFinals} had TWO OR MORE runner-ups (${pct(dryTwoFinals, dryTop25.length)}).`,
)
const anyTwoRU = shapeRows.filter((s) => s.runnerUps >= 2).length
console.log(`Of ALL ${shapeRows.length} top-25 seasons, ${anyTwoRU} carried 2+ runner-ups (${pct(anyTwoRU, shapeRows.length)}).`)

section('§C THE ANGER CROSSINGS BY RANK – does the trigger fire MORE the better she gets?')
console.log('Crossings are counted at the week she crossed; the band is her WTA rank at that week.')
console.log('The denominator is complete seasons that ENDED in that band, so the rate is per season.\n')
console.log('band        seasons  crossings  per season   seasons with >=1   >=2   R1 exits/season')
for (const b of BANDS) {
  const rows = complete.filter((s) => bandOf(s.rankEnd) === b.label)
  if (rows.length === 0) continue
  const cross = rows.reduce((a, s) => a + s.crossings, 0)
  const one = rows.filter((s) => s.crossings >= 1).length
  const two = rows.filter((s) => s.crossings >= 2).length
  const r1 = rows.reduce((a, s) => a + s.firstRoundExits, 0) / rows.length
  console.log(
    `${b.label.padEnd(10)}${String(rows.length).padStart(8)}${String(cross).padStart(11)}` +
      `${(cross / rows.length).toFixed(3).padStart(12)}   ${pct(one, rows.length)} ${ci(one, rows.length).padEnd(16)}` +
      ` ${pct(two, rows.length)}  ${r1.toFixed(2).padStart(6)}`,
  )
}
const allCross = careers.flatMap((c) => c.crossings)
console.log(`\ntotal crossings across the corpus: ${allCross.length}`)
const skipped = complete.reduce((a, s) => a + s.skippedCrossings, 0)
console.log(
  `losing runs that REACHED their own threshold but were never observed AT it (the \`===\` skip): ${skipped}` +
    ` – if this is > 0 a run can break her and the face never shows it.`,
)

section('§D THE SAME QUESTION, WITHOUT THE RANK BAND – crossings per season by career phase')
const byRankSeason = complete.filter((s) => s.rankEnd !== null)
const seasonsAt = (f: (s: SeasonRow) => boolean): string => {
  const rows = byRankSeason.filter(f)
  const cross = rows.reduce((a, s) => a + s.crossings, 0)
  const one = rows.filter((s) => s.crossings >= 1).length
  const two = rows.filter((s) => s.crossings >= 2).length
  return `${String(rows.length).padStart(5)} seasons, ${String(cross).padStart(4)} crossings, ${(cross / (rows.length || 1)).toFixed(3)}/season, >=1 in ${pct(one, rows.length)}, >=2 in ${pct(two, rows.length)}`
}
console.log(`inside the top 50 : ${seasonsAt((s) => s.rankEnd! <= 50)}`)
console.log(`#51-120           : ${seasonsAt((s) => s.rankEnd! > 50 && s.rankEnd! <= 120)}`)
console.log(`outside #120      : ${seasonsAt((s) => s.rankEnd! > 120)}`)

if (JSON_OUT) {
  writeFileSync(JSON_OUT, JSON.stringify(careers, (_k, v) => (v instanceof Set ? [...v] : v), 1))
  console.log(`\nwrote ${JSON_OUT}`)
}
