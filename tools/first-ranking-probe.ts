// WHICH TABLE GIVES HER HER FIRST RANKING, AND IS THE DOMESTIC LADDER STILL PLAYED?
//
//   npx vite-node tools/first-ranking-probe.ts -- [--seeds N] [--weeks N] [--at W1,W2,...]
//
// WHY THIS EXISTS, AND IT IS A DEBT BEING PAID. Building the e2e corpus for round 21 measured, in
// passing, that at week 120 only **46 of 120** careers held domestic points while **114 of 120**
// held ITF ones – so after P1 her first ranking is the ITF one. That finding lives in a comment in
// `tools/e2e-fixtures.ts`, which is the wrong place for it: a fixture recipe is a place a
// measurement is USED, not a place it is kept. The comment says so itself and hands the question to
// P6. This is P6 taking it.
//
// AND THE TWO QUESTIONS IT SEPARATES ARE NOT THE SAME QUESTION. "Holds domestic points at week 120"
// is a read of a 52-WEEK WINDOW (`BEST_N_BY_TRACK.domestic` over `pruneResults`), so a girl who won
// a National at fourteen and never went back holds nothing at fifteen and a half – and that is not
// the same finding as "the domestic ladder was bypassed". This probe therefore asks BOTH:
//
//   * EVER  – did she ever earn a ranking on that table at all, and at what age
//   * HELD  – was she holding one at a fixed week, which is what the corpus measured
//
// A gap between them is a decay, not a bypass. Only the EVER column can say she skipped the rung.
//
// MEASUREMENT ONLY: nothing is patched and no engine number is written from here.
import { openCareer, stepCareerWeek, POLICIES, PRESETS, mean, median } from './econ-bench'
import { kidAgeExact, kidPoints } from '../src/engine/world'
import { kidLadderRank } from '../src/engine/world/snapshot'
import { LADDER_TRACKS } from '../src/shared/protocol'
import type { LadderTrack } from '../src/engine/season/types'

const args = process.argv.slice(2)
const argOf = (n: string, d: number) => {
  const i = args.indexOf(`--${n}`)
  return i >= 0 && args[i + 1] ? Number(args[i + 1]) : d
}
const SEEDS = argOf('seeds', 10)
const WEEKS = argOf('weeks', 676)
/** The weeks the HELD columns are read at. 120 is the corpus's own check week (the `junior` fixture),
 *  carried so this probe and `tools/e2e-fixtures.ts` are answering the same question at the same
 *  moment; the rest walk the horizon. */
const AT = (() => {
  const i = args.indexOf('--at')
  return i >= 0 && args[i + 1] ? args[i + 1].split(',').map(Number) : [52, 120, 208, 312, 416]
})()
const POLICY = POLICIES[1]

interface Row {
  key: string
  /** career week she first held a REAL ranking on that table (RANKABLE_MIN cleared), or null. */
  firstRankWeek: Partial<Record<LadderTrack, number>>
  firstRankAge: Partial<Record<LadderTrack, number>>
  /** ...and the softer read: the first week she held any point at all on it. */
  firstPointWeek: Partial<Record<LadderTrack, number>>
  /** which table carried her FIRST ranking of any kind – the corpus's actual question. */
  firstTable: LadderTrack | null
  /** was she HOLDING points on that table at each of the AT weeks. */
  heldAt: Record<number, Partial<Record<LadderTrack, boolean>>>
  endedWeek: number | null
}

const rows: Row[] = []
for (let p = 0; p < PRESETS.length; p++) {
  for (let i = 0; i < SEEDS; i++) {
    const { world, rng } = openCareer(PRESETS[p], i, POLICY)
    const row: Row = {
      key: `${p}:${i}`,
      firstRankWeek: {},
      firstRankAge: {},
      firstPointWeek: {},
      firstTable: null,
      heldAt: Object.fromEntries(AT.map((w) => [w, {}])),
      endedWeek: null,
    }
    for (let w = 0; w < WEEKS; w++) {
      stepCareerWeek(world, rng, POLICY)
      if (world.ending && row.endedWeek === null) row.endedWeek = world.week
      if (world.ending) break
      const age = kidAgeExact(world.week, world.profile.birthMonth, world.profile.birthDay)
      for (const t of LADDER_TRACKS) {
        if (row.firstPointWeek[t] === undefined && kidPoints(world, t) > 0) row.firstPointWeek[t] = world.week
        if (row.firstRankWeek[t] === undefined && kidLadderRank(world, t) !== null) {
          row.firstRankWeek[t] = world.week
          row.firstRankAge[t] = age
          if (row.firstTable === null) row.firstTable = t
        }
      }
      if (row.heldAt[world.week]) {
        for (const t of LADDER_TRACKS) row.heldAt[world.week][t] = kidPoints(world, t) > 0
      }
    }
    rows.push(row)
  }
}

const n = rows.length
const pct = (part: number) => `${((100 * part) / n).toFixed(0)}%`
const one = (x: number) => x.toFixed(1)
console.log(`\nfirst-ranking-probe · n=${n} (${PRESETS.length} presets x ${SEEDS} seeds) · ${WEEKS} weeks · policy ${POLICY.id}\n`)

console.log('EVER – did she earn a ranking on that table at all, and when (age; RANKABLE_MIN cleared)')
console.log('  track       ever      first age  p25 / median / p75      first POINT, median age')
for (const t of LADDER_TRACKS) {
  const got = rows.filter((r) => r.firstRankWeek[t] !== undefined)
  const ages = got.map((r) => r.firstRankAge[t] as number).sort((a, b) => a - b)
  const q = (f: number) => (ages.length === 0 ? '–' : one(ages[Math.min(ages.length - 1, Math.floor((ages.length - 1) * f))]))
  const ptAges = rows
    .filter((r) => r.firstPointWeek[t] !== undefined)
    .map((r) => kidAgeExact(r.firstPointWeek[t] as number, 6, 1))
  console.log(
    `  ${t.padEnd(10)} ${String(got.length).padStart(3)}/${n} ${pct(got.length).padStart(5)}   ` +
      `${q(0.25).padStart(5)} / ${q(0.5).padStart(6)} / ${q(0.75).padStart(5)}        ` +
      `${ptAges.length ? one(median(ptAges)) : '–'} (n ${ptAges.length})`,
  )
}

console.log('\nWHICH TABLE CARRIED HER FIRST RANKING OF ANY KIND')
for (const t of LADDER_TRACKS) {
  const got = rows.filter((r) => r.firstTable === t)
  console.log(`  ${t.padEnd(10)} ${String(got.length).padStart(3)}/${n} ${pct(got.length).padStart(5)}`)
}
const never = rows.filter((r) => r.firstTable === null)
console.log(`  ${'(none)'.padEnd(10)} ${String(never.length).padStart(3)}/${n} ${pct(never.length).padStart(5)}`)

console.log('\nHELD – was she holding points on that table at that week (the corpus\'s own question)')
console.log(`  week   age    ${LADDER_TRACKS.map((t) => t.padEnd(12)).join('')}`)
for (const w of AT) {
  const alive = rows.filter((r) => r.endedWeek === null || r.endedWeek > w)
  const cells = LADDER_TRACKS.map((t) => {
    const held = alive.filter((r) => r.heldAt[w]?.[t]).length
    return `${held}/${alive.length} ${((100 * held) / Math.max(1, alive.length)).toFixed(0)}%`.padEnd(12)
  })
  console.log(`  ${String(w).padStart(4)}   ${one(kidAgeExact(w, 6, 1)).padStart(5)}  ${cells.join('')}`)
}

console.log('\n⚠ EVER minus HELD is a DECAY, not a bypass – the domestic window is 52 weeks wide.')
console.log(`  mean first domestic ranking age ${one(mean(rows.filter((r) => r.firstRankAge.domestic !== undefined).map((r) => r.firstRankAge.domestic as number)))}`)
