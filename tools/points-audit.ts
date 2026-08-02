/**
 * POINTS AUDIT – "why do the world points look strange?" (owner, 02.08: «Вроде мировые очки
 * как-то странно считаются, надо проверить»)
 *
 * A magnifying glass over ONE career's professional table, built from the same functions the game
 * reads (computeRanking / mergedWtaRanking / fieldProsFor – nothing re-derived by hand), so what it
 * prints IS what the Stats screen folds. Three questions, each a numbered section:
 *
 *   1. HER LEDGER – every counting W-track result in the 52-week window, what best-6 keeps, what
 *      it drops. The sum printed here must equal her points everywhere the UI shows them.
 *   2. THE TABLE AROUND HER – live rows vs field rows in her neighbourhood, and the size of the
 *      zero-point tie block (every rostered junior with no W result shares one tail rank – if her
 *      "world rank" is that tie, the number is an artefact of the roster, not a standing).
 *   3. THE SEASON SEAM – her merged rank under THIS season's field vs the NEXT season's re-roll,
 *      zero play in between. The delta is what a player wakes up to at the boundary; phase W
 *      accepts it (per-season regeneration is the documented turnover model), but it has to be
 *      SEEN to be accepted, and this prints it.
 *
 * Reads an exported .tsave through the real import codec; nothing about the file enters the repo.
 *
 * Run:  npx vite-node tools/points-audit.ts -- --save ~/Downloads/<career>.tsave
 */
import { readFileSync } from 'node:fs'
import { decodeExportFile } from '../src/engine/saveCodec'
import { KID_ID, inTrack, seasonIndexOf, kidAgeYears, refreshDerivedRankCaches, type WorldState } from '../src/engine/world'
import { BEST_N_BY_TRACK, computeRanking, windowedBestSum, isCountingResult, type SeasonResult } from '../src/engine/season/ranking'
import { mergedWtaRanking, fieldProsFor, isFieldProId } from '../src/engine/season/fieldPros'
import type { RankingRow } from '../src/engine/season/types'

function args(): { save: string } {
  const i = process.argv.indexOf('--save')
  if (i === -1 || !process.argv[i + 1]) {
    console.error('usage: npx vite-node tools/points-audit.ts -- --save <path.tsave>')
    process.exit(1)
  }
  return { save: process.argv[i + 1] }
}

function liveWta(world: WorldState): RankingRow[] {
  const roster = [...world.cohort.map((p) => p.id), KID_ID]
  return computeRanking(world.results, world.week, BEST_N_BY_TRACK.wta, roster, inTrack('wta'))
}

function mergedAt(world: WorldState, seasonIndex: number): RankingRow[] {
  const pros = fieldProsFor(world.seed, seasonIndex, world.cohort.map((p) => p.name))
  return mergedWtaRanking(liveWta(world), pros)
}

function nameOf(world: WorldState, seasonIndex: number, id: string): string {
  if (id === KID_ID) return `>>> ${world.profile.kidName || 'KID'} <<<`
  if (isFieldProId(id)) {
    const pro = fieldProsFor(world.seed, seasonIndex, world.cohort.map((p) => p.name)).find((p) => p.id === id)
    return pro ? `${pro.name} [field ${pro.strengthTier}]` : id
  }
  return world.cohort.find((p) => p.id === id)?.name ?? id
}

async function main() {
  const { save } = args()
  const world = await decodeExportFile(new Uint8Array(readFileSync(save)))
  const season = seasonIndexOf(world.week)
  const kid = `${world.profile.kidName} ${world.profile.kidLastName}`.trim()
  const age = kidAgeYears(world.week, world.profile.birthMonth)
  console.log(`career "${kid}" seed=${world.seed} week=${world.week} (season index ${season}, age ${age})`)

  // 1. HER LEDGER ---------------------------------------------------------------------------------
  const isWta = inTrack('wta')
  const hers = world.results
    .filter((r: SeasonResult) => r.playerId === KID_ID && isWta(r) && isCountingResult(r))
    .filter((r: SeasonResult) => r.week <= world.week && world.week - r.week <= 52)
    .sort((a: SeasonResult, b: SeasonResult) => b.points - a.points || b.week - a.week)
  console.log(`\n1. her counting W results in the 52-week window: ${hers.length}`)
  hers.forEach((r: SeasonResult, i: number) => {
    const counted = i < BEST_N_BY_TRACK.wta ? 'COUNTED' : `dropped (best-${BEST_N_BY_TRACK.wta} full)`
    console.log(`   w${r.week}  ${r.tier ?? '?'}  ${String(r.points).padStart(3)} pts  ${counted}`)
  })
  const sum = windowedBestSum(world.results, world.week, KID_ID, BEST_N_BY_TRACK.wta, isWta)
  console.log(`   windowedBestSum = ${sum} pts  (the number every W surface shows for her)`)

  // 2. THE TABLE AROUND HER -----------------------------------------------------------------------
  const merged = mergedAt(world, season)
  const her = merged.find((r) => r.playerId === KID_ID)
  const stale = world.kidRankWta
  // The exact call the worker's adoption seam makes – so the tool PROVES the heal, not just the
  // diagnosis: after this line the stored cache and the recomputed table must agree.
  const healed = refreshDerivedRankCaches(world)
  console.log(`\n2. merged W table: ${merged.length} rows; stored kidRankWta=${stale}, recomputed=${her?.rank}`)
  console.log(`   adoption refresh: ${healed ? `HEALED (cache was stale, now ${world.kidRankWta})` : 'no-op (cache was already true)'}`)
  if (her) {
    const at = merged.findIndex((r) => r.playerId === KID_ID)
    const lo = Math.max(0, at - 5)
    merged.slice(lo, at + 6).forEach((r) => {
      console.log(`   #${String(r.rank).padStart(3)}  ${String(r.points).padStart(4)} pts  ${nameOf(world, season, r.playerId)}`)
    })
    const tie = merged.filter((r) => r.points === her.points).length
    if (her.points === 0)
      console.log(`   ⚠ she holds ZERO W points – her "rank" is a tie block of ${tie} zero-point rostered players`)
    else if (tie > 1) console.log(`   (${tie} players share this points value)`)
  }

  // 3. THE SEASON SEAM ----------------------------------------------------------------------------
  const nextMerged = mergedAt(world, season + 1)
  const herNext = nextMerged.find((r) => r.playerId === KID_ID)
  console.log(`\n3. season seam (field re-roll, zero play): rank #${her?.rank} -> #${herNext?.rank} at the season boundary`)
  const topNow = merged.slice(0, 3).map((r) => `${nameOf(world, season, r.playerId)} ${r.points}`)
  const topNext = nextMerged.slice(0, 3).map((r) => `${nameOf(world, season + 1, r.playerId)} ${r.points}`)
  console.log(`   top-3 now : ${topNow.join(' | ')}`)
  console.log(`   top-3 next: ${topNext.join(' | ')}`)
}

main()
