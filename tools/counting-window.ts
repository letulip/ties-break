/**
 * counting-window – the owner's question, 13.08: «почему при этом всём Оливия пришла к 21, а Наоми
 * только к 26? Удача?» – and my answer to it must not be a story. Two girls, one of them measurably
 * STRONGER on court at every rung and ranked worse, so the points have to be coming from somewhere
 * other than winning. This opens the box and reads the eighteen slots her ranking actually is.
 *
 * ⚠ IT REBUILDS THE ENGINE'S OWN FOLD, it does not re-implement it. `windowSlots(list, 18)` is the
 * function `computeRanking` and `windowedBestSum` both call, imported here rather than copied, so a
 * disagreement between this tool and the table she sees is impossible by construction.
 *
 * ⚠ WHAT «FOR SHOWING UP» MEANS, AND IT IS DERIVED FROM THE ENGINE'S TABLES, NOT ASSERTED. A result
 * carries the points it paid; `TIERS[tier].points` inverts that to a FINISH index, and the last
 * index of that array is "lost her first match". Above WTA 250 those last entries are not zero –
 * a Slam pays 130 and a 1000 pays 65 for a first-round exit – so a row can bank real ranking points
 * with no match won. Matches won = (points.length - 1) - finish, on the same table.
 *
 * The counterfactual re-folds through `rankingFor` with the participation rows removed. That is
 * arithmetic on her own ledger inside the real merged table (live cohort ∪ derived field pros), so
 * the place it prints is the place the game would have shown her.
 *
 * MEASUREMENT ONLY. Read-only, changes no constant, ships no fixture. The save is personal and is
 * never committed – same rule as tools/career-vs-bench.ts and tools/round18-read.ts.
 *
 * Run:
 *   npx vite-node tools/counting-window.ts -- --save ~/Downloads/a.tsave
 *   npx vite-node tools/counting-window.ts -- --save a.tsave --save b.tsave    # side by side
 */
import { readFileSync } from 'node:fs'
import { decodeExportFile } from '../src/engine/saveCodec'
import type { WorldState } from '../src/engine/world'
import { BEST_N_BY_TRACK, MANDATORY_SLOTS, isCountingResult, windowSlots, type SeasonResult } from '../src/engine/season/ranking'
import { TIERS } from '../src/engine/season/calendar'
import { rankingFor } from '../src/engine/world/ladder'
import { finishLabel } from '../src/engine/world/labels'
import { KID_ID } from '../src/engine/world/constants'
import { kidAgeYears } from '../src/engine/world/age'
import { weekLabel } from '../src/shared/dates'
import type { LadderTrack, TierId } from '../src/engine/season/types'

const WINDOW_WEEKS = 52

function section(t: string): void {
  console.log(`\n${'='.repeat(96)}\n${t}\n${'='.repeat(96)}`)
}

/** The finish this row's payout corresponds to, read back off the tier's own points table. `null`
 *  when the row has no tier (pre-r5 saves, AI rows) or the payout is not in the table – stated
 *  rather than guessed, because a guessed finish would invent the very number being measured. */
function finishOf(r: SeasonResult): number | null {
  if (!r.tier) return null
  const i = TIERS[r.tier].points.indexOf(r.points)
  return i < 0 ? null : i
}

/** Matches won to reach that finish: the tier's rounds (points.length - 1) minus the finish index. */
function winsOf(r: SeasonResult): number | null {
  const f = finishOf(r)
  return f === null || !r.tier ? null : TIERS[r.tier].points.length - 1 - f
}

/** Her rows inside the ranking's rolling window, on one track, sorted exactly as the fold sorts. */
function windowRows(w: WorldState, track: LadderTrack): SeasonResult[] {
  return (w.results ?? [])
    .filter(
      (r) =>
        isCountingResult(r) &&
        r.playerId === KID_ID &&
        r.tier !== undefined &&
        TIERS[r.tier].track === track &&
        r.week <= w.week &&
        w.week - r.week <= WINDOW_WEEKS,
    )
    .sort((a, b) => b.points - a.points || b.week - a.week)
}

function readOne(w: WorldState, label: string): void {
  const p = w.profile
  section(`${label} – week ${w.week} (${weekLabel(w.week)}), age ${kidAgeYears(w.week, p.birthMonth)}`)
  console.log(`rank (wta / itf)  : #${w.kidRankWta ?? '–'} / #${w.kidRank ?? '–'}`)

  const bestN = BEST_N_BY_TRACK.wta
  const all = windowRows(w, 'wta')
  const counted = windowSlots([...all], bestN)
  const inCounted = new Set(counted)
  const dropped = all.filter((r) => !inCounted.has(r))

  console.log(`professional rows in the 52-week window: ${all.length}   ·   counted: ${counted.length} of ${bestN}   ·   dropped: ${dropped.length}`)

  section('THE EIGHTEEN SLOTS HER RANKING IS')
  console.log('  #  week  tier        points   finish              matches won   how it was earned')
  let paidForWinning = 0
  let paidForShowingUp = 0
  let winsTotal = 0
  let missed = 0
  counted.forEach((r, i) => {
    const f = finishOf(r)
    const won = winsOf(r)
    // ⚠ THE THIRD KIND OF ROW, and it is not a finish at all: a SKIPPED mandatory banks a zero that
    // still occupies one of the eighteen (`mandatoryMiss`, the owner's own rule). Its payout is not
    // in the tier's points table, so `finishOf` returns null – naming it is the whole point.
    const skipped = r.mandatoryMiss === true
    const showedUp = !skipped && won === 0
    if (skipped) missed += 1
    else if (showedUp) paidForShowingUp += r.points
    else paidForWinning += r.points
    winsTotal += won ?? 0
    const how = skipped ? 'SKIPPED A MANDATORY – a zero holding a slot' : showedUp ? 'SHOWED UP – lost her first match' : 'won matches'
    console.log(
      `  ${String(i + 1).padStart(2)}  ${String(r.week).padStart(4)}  ${(r.tier ?? '?').padEnd(10)} ${String(r.points).padStart(6)}   ` +
        `${(skipped ? 'did not play' : f === null ? '?' : finishLabel(f)).padEnd(18)} ${String(skipped ? '–' : (won ?? '?')).padStart(11)}   ${how}`,
    )
  })
  const total = paidForWinning + paidForShowingUp
  console.log(`\n  total counted points : ${total}`)
  console.log(`  from WINNING matches : ${String(paidForWinning).padStart(5)}  (${Math.round((100 * paidForWinning) / Math.max(1, total))}%)   ${winsTotal} matches won across the counted slots`)
  console.log(
    `  from SHOWING UP      : ${String(paidForShowingUp).padStart(5)}  (${Math.round((100 * paidForShowingUp) / Math.max(1, total))}%)   ` +
      `${counted.filter((r) => r.mandatoryMiss !== true && winsOf(r) === 0).length} of ${counted.length} slots are first-round exits`,
  )
  if (missed) console.log(`  ⚠ and ${missed} slot(s) hold a ZERO for a mandatory she skipped – they pay nothing and cannot be dropped`)

  section('THE RESERVED SLOTS – §VIII.A.4.a.i, and what converted')
  for (const fam of MANDATORY_SLOTS) {
    const have = all.filter((r) => r.tier === fam.tier).length
    const used = Math.min(have, fam.slots)
    console.log(`  ${fam.tier.padEnd(10)} reserved ${fam.slots}   she has ${String(have).padStart(2)} results   ${used} reserved slots used, ${fam.slots - used} converted into open ones`)
  }

  if (dropped.length) {
    section('WHAT DID NOT FIT (in the window, outside the eighteen)')
    for (const r of dropped) {
      const f = finishOf(r)
      console.log(`      week ${String(r.week).padStart(4)}  ${(r.tier ?? '?').padEnd(10)} ${String(r.points).padStart(6)}   ${(f === null ? '?' : finishLabel(f)).padEnd(18)} ${winsOf(r) === 0 ? 'showed up' : 'won matches'}`)
    }
    // The weeks that bought nothing at all: she travelled, paid, lost her opener, and the row was
    // outside the eighteen anyway. This is the cost of a rung she cannot yet win on, in WEEKS.
    const wasted = dropped.filter((r) => winsOf(r) === 0)
    if (wasted.length) {
      console.log(
        `\n  ⚠ ${wasted.length} of those weeks bought NOTHING – no match won and outside the eighteen. ` +
          `Entry fees alone: $${wasted.reduce((n, r) => n + (r.tier ? TIERS[r.tier].entryFeeCents : 0), 0) / 100}`,
      )
    }
  }

  section('PER RUNG, INSIDE THE WINDOW – what an entry there was worth')
  const byTier: Record<string, { n: number; wins: number; pts: number; counted: number }> = {}
  for (const r of all) {
    const t = r.tier ?? '?'
    byTier[t] ??= { n: 0, wins: 0, pts: 0, counted: 0 }
    byTier[t].n += 1
    byTier[t].wins += winsOf(r) ?? 0
    byTier[t].pts += r.points
    if (inCounted.has(r)) byTier[t].counted += 1
  }
  console.log('  rung        entries  counted   matches won   points   pts/entry   pts per match won')
  const order = Object.keys(byTier).sort((a, b) => byTier[b].pts - byTier[a].pts)
  for (const t of order) {
    const v = byTier[t]
    console.log(
      `  ${t.padEnd(10)} ${String(v.n).padStart(7)}  ${String(v.counted).padStart(7)}   ${String(v.wins).padStart(11)}   ${String(v.pts).padStart(6)}   ${(v.pts / v.n).toFixed(1).padStart(9)}   ${v.wins ? (v.pts / v.wins).toFixed(1).padStart(17) : '–'.padStart(17)}`,
    )
  }

  section('THE COUNTERFACTUAL – re-folded through the real merged table')
  // ⚠ NOT A MODEL. `rankingFor` is the one fold every table-reader flows through, handed a world
  // whose only difference is which of HER rows exist. The field pros and the cohort are untouched,
  // so the place it prints is the place the game itself would have shown her.
  const withoutShowUp = { ...w, results: (w.results ?? []).filter((r) => !(r.playerId === KID_ID && winsOf(r) === 0)) }
  const withoutWins = { ...w, results: (w.results ?? []).filter((r) => !(r.playerId === KID_ID && (winsOf(r) ?? 1) > 0)) }
  const place = (world: WorldState): string => {
    const row = rankingFor(world, 'wta').find((r) => r.playerId === KID_ID)
    return row ? `#${row.rank} on ${row.points} pts` : 'not on the list at all'
  }
  console.log(`  as she stands                       : #${w.kidRankWta} on ${total} pts`)
  console.log(`  if first-round exits paid NOTHING   : ${place(withoutShowUp as WorldState)}`)
  console.log(`  if only first-round exits counted   : ${place(withoutWins as WorldState)}`)

  section('THE ACCESS CLIFF – what a rung is worth BEFORE she wins anything on it')
  // ⚠ THE POINT OF THIS SECTION. Above WTA 250 a first-round exit pays real points, and entry to
  // those rungs is an absolute rank cut (`acceptanceRank`). So crossing a cut is worth a fixed
  // number of points for turning up – and if that number is larger than the gap the cut sits in,
  // the ladder has a step in it that play cannot substitute for. Read off the live merged table.
  const merged = rankingFor(w, 'wta')
  const BIG: TierId[] = ['slam', 'wta1000', 'wta500', 'wta250']
  console.log('  rung       accepts to   a FIRST-ROUND EXIT pays   events a season   guaranteed for turning up')
  let guaranteed = 0
  for (const t of BIG) {
    const def = TIERS[t]
    const floor = def.points[def.points.length - 1]
    const n = def.anchorWeeks?.length ?? 0
    const reserved = MANDATORY_SLOTS.find((m) => m.tier === t)?.slots ?? 0
    if (reserved) guaranteed += floor * reserved
    console.log(
      `  ${t.padEnd(10)} #${String(def.acceptsRank ?? '–').padEnd(10)} ${String(floor).padStart(21)}   ${String(n).padStart(15)}   ` +
        `${reserved ? `${floor * reserved} (${reserved} reserved slots)` : 'not reserved'}`,
    )
  }
  console.log(`\n  A FULL RESERVED BOOK, EVERY FIRST MATCH LOST: ${guaranteed} points – without a single match won.`)
  for (const place of [15, 50, 65, 104, 120, 150, 200, 250]) {
    const row = merged.filter((r) => r.rank <= place).slice(-1)[0]
    console.log(`    #${String(place).padEnd(4)} on this table holds ${String(row?.points ?? 0).padStart(5)} pts${place === 104 ? '   <- the Slam cut' : place === 65 ? '   <- the WTA 1000 cut' : ''}`)
  }

  // The junior table beside it, because a career still half on the ITF ladder is a different
  // question – and it is the table `activeLadderOf` may still call hers.
  const itf = windowRows(w, 'itf')
  if (itf.length) {
    const itfCounted = windowSlots([...itf], BEST_N_BY_TRACK.itf)
    console.log(`\n  ITF table beside it: ${itf.length} rows in the window, best-${BEST_N_BY_TRACK.itf} counts ${itfCounted.reduce((n, r) => n + r.points, 0)} pts -> #${w.kidRank}`)
  }
}

async function main(): Promise<void> {
  const paths: string[] = []
  process.argv.forEach((a, i) => {
    if (a === '--save') paths.push(process.argv[i + 1].replace('~', process.env.HOME ?? ''))
  })
  if (!paths.length) throw new Error('usage: --save <file> [--save <file>]')
  for (const path of paths) {
    const w = (await decodeExportFile(new Uint8Array(readFileSync(path)))) as WorldState
    readOne(w, path.split('/').pop() ?? path)
  }
}

void main()
