/**
 * plateau-probe – why the natural end says "the table would not move" to a girl who is climbing.
 *
 * MEASUREMENT ONLY. Imports the engine read-only, changes no constant, ships no fixture.
 *
 * ⚠ THE SAVE IS PERSONAL AND IS NEVER COMMITTED, and neither is anything derived from one beyond the
 * aggregate facts quoted in docs/. Same rule as tools/round18-read.ts.
 *
 * Run:
 *   npx vite-node tools/plateau-probe.ts -- --save ~/Downloads/a.tsave
 */
import { readFileSync } from 'node:fs'
import { decodeExportFile } from '../src/engine/saveCodec'
import type { WorldState } from '../src/engine/world'
import { plateauViewOf, lastRungSeasonIndexOf } from '../src/engine/world/endings'
import { plateauReading, retirementDue, ENDINGS } from '../src/engine/ending'
import { kidAgeYears } from '../src/engine/world/age'
import { seasonIndexOf } from '../src/engine/world/ledger'

function section(title: string): void {
  console.log(`\n${'='.repeat(86)}\n${title}\n${'='.repeat(86)}`)
}

async function main(): Promise<void> {
  const i = process.argv.indexOf('--save')
  const path = i >= 0 ? process.argv[i + 1].replace('~', process.env.HOME ?? '') : ''
  const w = (await decodeExportFile(new Uint8Array(readFileSync(path)))) as WorldState

  section('WHO, AND WHICH TABLE SHE IS ON')
  console.log(`week ${w.week}  ·  season ${seasonIndexOf(w.week)}  ·  age ${kidAgeYears(w.week, w.profile.birthMonth, w.profile.birthDay)}`)
  console.log(`kidRank (the ITF / international alias) = ${w.kidRank ?? '–'}`)
  console.log(`kidRankWta (the professional table)     = ${w.kidRankWta ?? '–'}`)
  console.log(`retirementOffer on the save             = ${JSON.stringify(w.retirementOffer)}`)

  section('WHAT THE SEASON RECORD HOLDS, PER SEASON')
  console.log('season   endRank(ITF)   byTrack.wta   byTrack.itf   byTrack.domestic   points')
  for (const s of w.seasonHistory) {
    const bt = (s as unknown as { byTrack?: Record<string, { endRank?: number }> }).byTrack
    const g = (k: string): string => {
      const r = bt?.[k]?.endRank
      return r === undefined ? '   –' : `#${String(r).padStart(3)}`
    }
    console.log(
      `  ${String(s.seasonIndex).padStart(2)}      #${String(s.endRank).padStart(4)}        ${g('wta')}          ${g('itf')}          ${g('domestic')}         ${String(s.points).padStart(5)}`,
    )
  }

  section('WHAT THE PLATEAU RULE READS, AND WHAT IT CONCLUDES')
  const view = plateauViewOf(w)
  const seasons = ENDINGS.plateauSeasons
  const window = view.seasonEndRanks.filter((s) => s.seasonIndex > view.seasonIndex - seasons)
  const before = view.seasonEndRanks.filter((s) => s.seasonIndex <= view.seasonIndex - seasons)
  console.log(`plateauSeasons = ${seasons}  ·  plateauRankBand = ${ENDINGS.plateauRankBand}  ·  fromAge = ${ENDINGS.plateauFromAgeYears}`)
  console.log(`window  (the last ${seasons} seasons): ${window.map((s) => `s${s.seasonIndex}:#${s.endRank}`).join('  ')}`)
  console.log(`before  (everything earlier):   ${before.map((s) => `s${s.seasonIndex}:#${s.endRank}`).join('  ')}`)
  console.log(`lastRungSeasonIndex = ${lastRungSeasonIndexOf(w)}`)
  if (window.length && before.length) {
    const bestBefore = Math.min(...before.map((s) => s.endRank))
    const bestInWindow = Math.min(...window.map((s) => s.endRank))
    const worstInWindow = Math.max(...window.map((s) => s.endRank))
    console.log(`\n  2a  bestInWindow #${bestInWindow} vs bestBefore #${bestBefore}  ->  ${bestInWindow < bestBefore ? 'IMPROVED, rule stops' : 'no improvement, rule continues'}`)
    console.log(`  2b  spread ${worstInWindow - bestInWindow} vs band ${ENDINGS.plateauRankBand}  ->  ${worstInWindow - bestInWindow <= ENDINGS.plateauRankBand ? 'FLAT, rule fires' : 'not flat, rule stops'}`)
  }
  console.log(`\nplateauReading = ${plateauReading(view)}`)
  console.log(`retirementDue  = ${JSON.stringify(retirementDue(view))}`)

  section('THE SAME QUESTION, ASKED OF THE TABLE SHE IS ACTUALLY ON')
  const wta = w.seasonHistory
    .map((s) => ({
      seasonIndex: s.seasonIndex,
      endRank: (s as unknown as { byTrack?: { wta?: { endRank?: number } } }).byTrack?.wta?.endRank,
    }))
    .filter((s): s is { seasonIndex: number; endRank: number } => s.endRank !== undefined)
  if (wta.length === 0) {
    console.log('no per-track wta ranks banked on this save (rows older than v46 carry none)')
  } else {
    const wView = { ...view, seasonEndRanks: wta }
    const win = wta.filter((s) => s.seasonIndex > view.seasonIndex - seasons)
    const bef = wta.filter((s) => s.seasonIndex <= view.seasonIndex - seasons)
    console.log(`window: ${win.map((s) => `s${s.seasonIndex}:#${s.endRank}`).join('  ')}`)
    console.log(`before: ${bef.map((s) => `s${s.seasonIndex}:#${s.endRank}`).join('  ')}`)
    console.log(`\nplateauReading on the professional table = ${plateauReading(wView)}`)
  }
}

void main()
