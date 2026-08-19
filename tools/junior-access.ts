// JUNIOR ACCESS – what the ladder actually admits her to, at what age and at what rank.
//
//   npx vite-node tools/junior-access.ts -- [--seeds N] [--weeks N] [--policy 0|1] [--json PATH]
//
// THE QUESTION (docs/plans/college-and-the-junior-ladder.md, P1). Two rules land in this wave and
// they push in OPPOSITE directions, so the whole point of this file is that each gets its OWN
// number: the Junior Accelerator (a junior may not stand above W15 unless she is a top-20 junior)
// slows her down, and the Play Down rules (a WTA top-50 is barred from every W event, a top-150 from
// W15/W35) push her UP by closing the rungs she has outgrown. Added together they would be one
// number hiding two findings.
//
// ⚠⚠ THE ARMS ARE TREE STATES, NOT PATCHED KNOBS, AND THAT IS DELIBERATE. `tools/opener-price-bench.ts`
// and `tools/big-draw-cost.ts` patch a shipped constant in memory and put it back, which is the right
// idiom when the counterfactual IS a constant. Here it is not: the pre-P1 W15 door read a POINT BAND
// and the post-P1 one reads a RANKING, and no setting of any table turns one into the other. A
// sentinel that meant "fall back to the rule we just deleted" would have kept the old rule alive as a
// dead branch in shipped engine code, which is worse than a second checkout. So an arm is a git tree:
//
//     baseline  git worktree at the commit before P1        (the shipped ladder)
//     step 1    + the Accelerator and the W15 reserved place
//     step 2    + the Play Down rules
//
// This file is IDENTICAL in every arm (copy it into the worktree) and takes no arm flag, so nothing
// in it can be conditioned on which arm it is. Same seeds, same presets, same policy, same horizon:
// the engine is deterministic, so the only difference between two runs is the rule.
//
// ⚠ IT SHADOWS `tools/ladder-baseline.ts` (P0) ON PURPOSE AND SAYS SO. P0's frozen baseline is the
// artefact every later phase reports against; this file was written while that one was still being
// built, so it captures the same columns in the same shape rather than blocking on it. Where the two
// disagree, P0 is the baseline of record and this is a second reading of the same careers.
//
// MEASUREMENT ONLY: no engine constant is written from here, nothing is patched, and every draw is
// the world's own. Input-independence (CLAUDE.md invariant 2) is why the same seeds can be read many
// ways – nothing this file does touches the world's dice.
import { writeFileSync } from 'node:fs'
import { openCareer, stepCareerWeek, POLICIES, PRESETS, zeroByTier, mean, median, type Preset } from './econ-bench'
import { kidAgeExact, kidPoints, tierFloorOpen } from '../src/engine/world'
// ⚠⚠ THE COLLEGE COLUMN BELOW IS A COUNTERFACTUAL SINCE 16.08.2026, NOT A READING OF THE SHIPPED
// GAME. The owner removed the rule that closed the college door on a result («Колледж – это
// независимая ветка карьеры … альтернативная»); in the game as it ships the third answer is on the
// fork card in 100% of careers. What this file prints is what the PRE-16.08 rule WOULD have done on
// this population, kept so the frozen battery's arms stay comparable on the dimension the
// junior-access phases moved most. `tools/retired-college-rule.ts` is the one definition of it.
import { RETIRED_COLLEGE_RUNG, retiredCollegeDoorOpen } from './retired-college-rule'
import { ENDINGS } from '../src/engine/ending'
import { TIERS, TIER_LADDER, TIER_SHORT, WEEKS_PER_YEAR } from '../src/engine/season/calendar'
import type { TierId } from '../src/engine/season/types'

// --- args -------------------------------------------------------------------------------------

const args = process.argv.slice(2)
const argOf = (name: string, fallback: number): number => {
  const i = args.indexOf(`--${name}`)
  return i >= 0 && args[i + 1] ? Number(args[i + 1]) : fallback
}
const strOf = (name: string): string | null => {
  const i = args.indexOf(`--${name}`)
  return i >= 0 && args[i + 1] ? args[i + 1] : null
}
/** seeds PER PRESET. n = SEEDS x 9. Default 6 x 9 = 54, which clears the plan's n >= 50. */
const SEEDS = argOf('seeds', 6)
/** 416 = fourteen to TWENTY-TWO. The plan's P0 asks for rank at 19 AND 21, so the horizon has to
 *  reach past 21 – `tools/college-fork.ts`' 312 (to twenty) cannot answer the second one. */
const WEEKS = argOf('weeks', 416)
const JSON_OUT = strOf('json')
/** Default 1 = the rebuilt "reasonable parent" policy, which is the arm every question here is about
 *  (POLICIES[0], the grinder, never plays the paid rungs, so it cannot see a W-series rule at all). */
const POLICY = POLICIES[argOf('policy', 1)] ?? POLICIES[1]
const LABEL = strOf('label') ?? 'run'

// --- helpers ----------------------------------------------------------------------------------

const pad = (s: string | number, w: number) => String(s).padStart(w)
const padE = (s: string | number, w: number) => String(s).padEnd(w)
const rule = (n = 108) => '-'.repeat(n)
function section(title: string): void {
  console.log(`\n${rule()}\n${title}\n${rule()}`)
}
const usd = (cents: number) => `$${Math.round(cents / 100).toLocaleString('en-US')}`
const pctOf = (part: number, whole: number) => (whole === 0 ? '  –' : `${((100 * part) / whole).toFixed(0)}%`)
const meanOf = (xs: number[]) => (xs.length === 0 ? null : mean(xs))
const show = (x: number | null, digits = 1) => (x === null ? '   –' : x.toFixed(digits))

/** The rungs a career can actually be admitted to, in ladder order. */
const RUNGS: readonly TierId[] = TIER_LADDER
/** The professional rungs the two rules are about, for the headline tables. */
const W_RUNGS: readonly TierId[] = ['w15', 'w35', 'w50', 'w75', 'w100', 'wta125']
/** The rungs at or above the one that shuts the college ending today – `tools/college-fork.ts`' own
 *  definition, kept identical so the two files' closure figures are the same measurement. */
const COLLEGE_CLOSERS: readonly TierId[] = TIER_LADDER.slice(TIER_LADDER.indexOf(RETIRED_COLLEGE_RUNG))
/** The ages the per-age tables break on: 14 through 21, i.e. the whole junior window plus two years
 *  past it, which is where a rule that only bites juniors has to stop showing up. */
const AGES = [14, 15, 16, 17, 18, 19, 20, 21] as const

function quantile(xs: number[], q: number): number | null {
  if (xs.length === 0) return null
  const s = [...xs].sort((a, b) => a - b)
  const i = (s.length - 1) * q
  const lo = Math.floor(i)
  const hi = Math.ceil(i)
  return lo === hi ? s[lo] : s[lo] + (s[hi] - s[lo]) * (i - lo)
}

// =================================================================================================
// ONE CAREER
// =================================================================================================

interface Row {
  /** ⚠ THE KEY IS PRESET+INDEX, NOT THE SEED. `openCareer` builds `bench-<background>-<index>` and
   *  the nine presets carry only THREE backgrounds, so a seed string names three different careers.
   *  `tools/college-fork.ts` was caught by exactly this and says so. */
  key: string
  preset: string
  /** entries committed, per rung, over the whole horizon */
  entries: Record<TierId, number>
  /** entries committed in the season she was `age` – index by age, W rungs only and all rungs */
  wEntriesByAge: Record<number, number>
  entriesByAge: Record<number, number>
  /** her exact age the first week she committed to an event of this rung */
  firstEntryAge: Partial<Record<TierId, number>>
  /** her WTA rank that same week – "at what rank does the rung admit her", which is the question a
   *  ladder is for and is NOT the rung's own cut. null where she held no W ranking at all. */
  firstEntryRankWta: Partial<Record<TierId, number | null>>
  /** ...and her ITF junior rank that week, which is the standing the Accelerator reads */
  firstEntryRankItf: Partial<Record<TierId, number | null>>
  /** her age the first week the rung's FLOOR alone stopped refusing her (`tierFloorOpen`) – the
   *  calendar's own verdict, so "the door opened" and "she walked through it" stay two facts */
  floorOpenAge: Partial<Record<TierId, number>>
  /** her age the first week `bestFinishByTier` held a counting finish at this rung */
  firstCountingAge: Partial<Record<TierId, number>>
  /** WTA / ITF rank read on her birthday at each age */
  rankWtaAt: Record<number, number | null>
  rankItfAt: Record<number, number | null>
  /** best (lowest) WTA rank ever held while genuinely ranked */
  bestRankWta: number | null
  /** the year-end ITF junior rank the wrap banked, by season index */
  juniorYearEnd: (number | null)[]

  // --- the college door ---
  collegeShutAge: number | null
  collegeShutTier: TierId | null
  collegeOpenAtFork: boolean

  // --- survival and money ---
  prizeBy19Cents: number
  prizeCents: number
  endingKind: string | null
  endingAge: number | null
  weeksLived: number
}

function runOne(preset: Preset, index: number): Row {
  const { world, rng } = openCareer(preset, index, POLICY)
  const entries = zeroByTier()
  const wEntriesByAge: Record<number, number> = {}
  const entriesByAge: Record<number, number> = {}
  const firstEntryAge: Partial<Record<TierId, number>> = {}
  const firstEntryRankWta: Partial<Record<TierId, number | null>> = {}
  const firstEntryRankItf: Partial<Record<TierId, number | null>> = {}
  const floorOpenAge: Partial<Record<TierId, number>> = {}
  const firstCountingAge: Partial<Record<TierId, number>> = {}
  const rankWtaAt: Record<number, number | null> = {}
  const rankItfAt: Record<number, number | null> = {}
  let bestRankWta: number | null = null
  let collegeShutAge: number | null = null
  let collegeShutTier: TierId | null = null
  let collegeOpenAtFork = true
  let forkSeen = false
  let prizeBy19Cents = 0
  let prizeCents = 0
  let weeksLived = 0

  // The finance ledger is pruned to a 60-week trailing window, so a cumulative line has to be folded
  // week by week as it goes – `runCareer`'s own `seenWeeks` idiom.
  const seenWeeks = new Set<number>()

  for (let i = 0; i < WEEKS; i++) {
    const weekOfEntry = world.week
    const ageAtEntry = kidAgeExact(weekOfEntry, world.profile.birthMonth, world.profile.birthDay)
    const ageBucket = Math.floor(ageAtEntry)
    const e = stepCareerWeek(world, rng, POLICY)
    weeksLived = i + 1
    for (const t of RUNGS) {
      if (e[t] <= 0) continue
      entries[t] += e[t]
      entriesByAge[ageBucket] = (entriesByAge[ageBucket] ?? 0) + e[t]
      if (TIERS[t].track === 'wta') wEntriesByAge[ageBucket] = (wEntriesByAge[ageBucket] ?? 0) + e[t]
      if (firstEntryAge[t] === undefined) {
        firstEntryAge[t] = ageAtEntry
        // "Unranked is not a rank" – the same guard the entry gate carries. A table's own size prints
        // as a number and would read as a place.
        firstEntryRankWta[t] = kidPoints(world, 'wta') > 0 ? (world.kidRankWta ?? null) : null
        firstEntryRankItf[t] = kidPoints(world, 'itf') > 0 ? world.kidRank : null
      }
    }
    const ageNow = kidAgeExact(world.week, world.profile.birthMonth, world.profile.birthDay)
    for (const t of RUNGS) {
      if (floorOpenAge[t] === undefined && tierFloorOpen(world, t)) floorOpenAge[t] = ageNow
      if (firstCountingAge[t] !== undefined) continue
      const finish = world.bestFinishByTier[t]
      if (finish === undefined || finish >= TIERS[t].points.length - 1) continue
      if (TIERS[t].points[finish] > 0) firstCountingAge[t] = ageNow
    }
    if (kidPoints(world, 'wta') > 0 && typeof world.kidRankWta === 'number') {
      if (bestRankWta === null || world.kidRankWta < bestRankWta) bestRankWta = world.kidRankWta
    }
    for (const a of AGES) {
      if (rankWtaAt[a] === undefined && ageNow >= a) {
        rankWtaAt[a] = kidPoints(world, 'wta') > 0 ? (world.kidRankWta ?? null) : null
        rankItfAt[a] = kidPoints(world, 'itf') > 0 ? world.kidRank : null
      }
    }
    for (const fw of world.financeWeeks) {
      if (seenWeeks.has(fw.week)) continue
      seenWeeks.add(fw.week)
      const prize = Math.max(0, fw.byCategory.prize ?? 0)
      prizeCents += prize
      if (kidAgeExact(fw.week, world.profile.birthMonth, world.profile.birthDay) < ENDINGS.forkAgeYears) prizeBy19Cents += prize
    }
    if (collegeShutAge === null && !retiredCollegeDoorOpen(world)) {
      collegeShutAge = ageNow
      for (const t of COLLEGE_CLOSERS) {
        const finish = world.bestFinishByTier[t]
        if (finish === undefined || finish >= TIERS[t].points.length - 1) continue
        if (TIERS[t].points[finish] > 0) {
          collegeShutTier = t
          break
        }
      }
    }
    if (!forkSeen && ageNow >= ENDINGS.forkAgeYears) {
      forkSeen = true
      collegeOpenAtFork = retiredCollegeDoorOpen(world)
    }
    if (world.ending) break
  }

  return {
    key: `${preset.background}-${preset.coachTier}-${index}`,
    preset: preset.label,
    entries,
    wEntriesByAge,
    entriesByAge,
    firstEntryAge,
    firstEntryRankWta,
    firstEntryRankItf,
    floorOpenAge,
    firstCountingAge,
    rankWtaAt,
    rankItfAt,
    bestRankWta,
    juniorYearEnd: world.seasonHistory.map((h) => (h.byTrack ? (h.byTrack.itf?.endRank ?? null) : h.endRank)),
    collegeShutAge,
    collegeShutTier,
    collegeOpenAtFork,
    prizeBy19Cents,
    prizeCents,
    endingKind: world.ending?.type ?? null,
    endingAge: world.ending ? kidAgeExact(world.week, world.profile.birthMonth, world.profile.birthDay) : null,
    weeksLived,
  }
}

// =================================================================================================
// THE RUN
// =================================================================================================

const rows: Row[] = []
for (const preset of PRESETS) {
  for (let i = 0; i < SEEDS; i++) rows.push(runOne(preset, i))
}
const n = rows.length

console.log(`\njunior-access · ${LABEL} · n=${n} (${PRESETS.length} presets x ${SEEDS} seeds) · ${WEEKS} weeks (14 -> ${(14 + WEEKS / WEEKS_PER_YEAR).toFixed(0)}) · policy ${POLICY.id}`)

// --- 1. ADMISSION: age and rank at the first entry to every rung --------------------------------
section('1. FIRST ADMISSION – the age and the rank at which each rung actually takes her')
console.log(
  `${padE('rung', 9)}${pad('ever %', 8)}${pad('n', 5)}${pad('age', 7)}${pad('p25', 7)}${pad('p75', 7)}` +
    `${pad('W rank', 9)}${pad('ITF rank', 10)}${pad('floor age', 11)}${pad('1st count', 11)}`,
)
const admission: Record<string, unknown>[] = []
for (const t of RUNGS) {
  const ages = rows.map((r) => r.firstEntryAge[t]).filter((x): x is number => x !== undefined)
  if (ages.length === 0 && rows.every((r) => r.entries[t] === 0)) continue
  const wr = rows.map((r) => r.firstEntryRankWta[t]).filter((x): x is number => typeof x === 'number')
  const ir = rows.map((r) => r.firstEntryRankItf[t]).filter((x): x is number => typeof x === 'number')
  const fo = rows.map((r) => r.floorOpenAge[t]).filter((x): x is number => x !== undefined)
  const fc = rows.map((r) => r.firstCountingAge[t]).filter((x): x is number => x !== undefined)
  const cell = {
    rung: t,
    everPct: (100 * ages.length) / n,
    n: ages.length,
    age: meanOf(ages),
    p25: quantile(ages, 0.25),
    p75: quantile(ages, 0.75),
    rankWta: meanOf(wr),
    rankItf: meanOf(ir),
    floorAge: meanOf(fo),
    countAge: meanOf(fc),
  }
  admission.push(cell)
  console.log(
    `${padE(TIER_SHORT[t], 9)}${pad(pctOf(ages.length, n), 8)}${pad(ages.length, 5)}${pad(show(cell.age), 7)}` +
      `${pad(show(cell.p25), 7)}${pad(show(cell.p75), 7)}${pad(show(cell.rankWta, 0), 9)}${pad(show(cell.rankItf, 0), 10)}` +
      `${pad(show(cell.floorAge), 11)}${pad(show(cell.countAge), 11)}`,
  )
}
console.log(
  '\n"ever %" = share of careers that ever committed to the rung · "age"/"W rank"/"ITF rank" are read\n' +
    'at that FIRST entry · "floor age" = the first week `tierFloorOpen` stopped refusing (the calendar\'s\n' +
    'own verdict, which is not the same fact as her entering) · "1st count" = first counting finish.',
)

// --- 2. ENTRIES PER SEASON BY AGE ---------------------------------------------------------------
section('2. ENTRIES PER SEASON BY AGE – all rungs, and the W series alone')
console.log(`${padE('age', 6)}${pad('all', 8)}${pad('W only', 9)}${pad('careers', 9)}`)
const byAge: Record<string, unknown>[] = []
for (const a of AGES) {
  const live = rows.filter((r) => r.weeksLived >= (a - 13) * WEEKS_PER_YEAR)
  if (live.length === 0) continue
  const all = mean(live.map((r) => r.entriesByAge[a] ?? 0))
  const w = mean(live.map((r) => r.wEntriesByAge[a] ?? 0))
  byAge.push({ age: a, all, w, careers: live.length })
  console.log(`${padE(a, 6)}${pad(all.toFixed(1), 8)}${pad(w.toFixed(1), 9)}${pad(live.length, 9)}`)
}

// --- 3. ENTRIES PER CAREER BY RUNG --------------------------------------------------------------
section('3. ENTRIES PER CAREER BY RUNG')
const perRung: Record<string, unknown>[] = []
let line = ''
for (const t of RUNGS) {
  const m = mean(rows.map((r) => r.entries[t]))
  perRung.push({ rung: t, mean: m })
  if (m > 0 || W_RUNGS.includes(t)) line += `${TIER_SHORT[t]} ${m.toFixed(1)}   `
}
console.log(line)

// --- 4. RANK AT THE MILESTONE AGES --------------------------------------------------------------
section('4. RANK AT 17 / 19 / 21, AND CAREER-HIGH')
console.log(`${padE('age', 6)}${pad('W ranked', 10)}${pad('W mean', 9)}${pad('W median', 10)}${pad('ITF ranked', 12)}${pad('ITF median', 12)}`)
const ranks: Record<string, unknown>[] = []
for (const a of AGES) {
  const w = rows.map((r) => r.rankWtaAt[a]).filter((x): x is number => typeof x === 'number')
  const it = rows.map((r) => r.rankItfAt[a]).filter((x): x is number => typeof x === 'number')
  ranks.push({ age: a, wN: w.length, wMean: meanOf(w), wMedian: w.length ? median(w) : null, itfN: it.length, itfMedian: it.length ? median(it) : null })
  console.log(
    `${padE(a, 6)}${pad(w.length, 10)}${pad(show(meanOf(w), 0), 9)}${pad(w.length ? median(w).toFixed(0) : '–', 10)}` +
      `${pad(it.length, 12)}${pad(it.length ? median(it).toFixed(0) : '–', 12)}`,
  )
}
const best = rows.map((r) => r.bestRankWta).filter((x): x is number => typeof x === 'number')
console.log(`\ncareer-high W rank: n=${best.length}  mean ${show(meanOf(best), 0)}  median ${best.length ? median(best).toFixed(0) : '–'}  best ${best.length ? Math.min(...best) : '–'}`)

// --- 5. THE COLLEGE DOOR ------------------------------------------------------------------------
section('5. THE COLLEGE DOOR')
const shut = rows.filter((r) => r.collegeShutAge !== null)
const shutAges = shut.map((r) => r.collegeShutAge as number)
console.log(`closed in ${shut.length} of ${n} careers (${pctOf(shut.length, n)}), mean age ${show(meanOf(shutAges))}, median ${shutAges.length ? median(shutAges).toFixed(1) : '–'}`)
console.log(`open at the fork (${ENDINGS.forkAgeYears}) in ${rows.filter((r) => r.collegeOpenAtFork).length} of ${n} (${pctOf(rows.filter((r) => r.collegeOpenAtFork).length, n)})`)
const byCloser = new Map<string, number>()
for (const r of shut) byCloser.set(r.collegeShutTier ?? 'unknown', (byCloser.get(r.collegeShutTier ?? 'unknown') ?? 0) + 1)
console.log('closed by:  ' + [...byCloser].map(([t, c]) => `${t} ${c}`).join('   '))
const shutBucket: Record<string, number> = {}
for (const a of shutAges) {
  const b = String(Math.floor(a))
  shutBucket[b] = (shutBucket[b] ?? 0) + 1
}
console.log('closure age distribution:  ' + Object.entries(shutBucket).sort().map(([a, c]) => `${a}: ${c}`).join('   '))

// --- 6. SURVIVAL AND MONEY ----------------------------------------------------------------------
section('6. SURVIVAL AND MONEY')
const ended = rows.filter((r) => r.endingKind !== null)
const byKind = new Map<string, number>()
for (const r of ended) byKind.set(r.endingKind as string, (byKind.get(r.endingKind as string) ?? 0) + 1)
console.log(`careers that ended before the horizon: ${ended.length} of ${n} (${pctOf(ended.length, n)})`)
console.log('by kind:  ' + ([...byKind].map(([k, c]) => `${k} ${c}`).join('   ') || 'none'))
console.log(`prize banked by ${ENDINGS.forkAgeYears}: mean ${usd(mean(rows.map((r) => r.prizeBy19Cents)))}  median ${usd(median(rows.map((r) => r.prizeBy19Cents)))}`)
console.log(`prize banked to the horizon: mean ${usd(mean(rows.map((r) => r.prizeCents)))}  median ${usd(median(rows.map((r) => r.prizeCents)))}`)

// --- 7. THE JUNIOR STANDING THE ACCELERATOR READS ------------------------------------------------
section('7. YEAR-END ITF JUNIOR RANK, BY SEASON – the standing the Accelerator keys on')
console.log(`${padE('season', 8)}${padE('age', 6)}${pad('ranked', 8)}${pad('median', 8)}${pad('<=1', 6)}${pad('<=3', 6)}${pad('<=5', 6)}${pad('<=10', 7)}${pad('<=20', 7)}`)
const juniorTable: Record<string, unknown>[] = []
for (let s = 0; s < Math.ceil(WEEKS / WEEKS_PER_YEAR); s++) {
  const vals = rows.map((r) => r.juniorYearEnd[s]).filter((x): x is number => typeof x === 'number')
  if (vals.length === 0) continue
  const under = (k: number) => vals.filter((v) => v <= k).length
  juniorTable.push({ season: s, ranked: vals.length, median: median(vals), le1: under(1), le3: under(3), le5: under(5), le10: under(10), le20: under(20) })
  console.log(
    `${padE(s, 8)}${padE(14 + s, 6)}${pad(vals.length, 8)}${pad(median(vals).toFixed(0), 8)}` +
      `${pad(under(1), 6)}${pad(under(3), 6)}${pad(under(5), 6)}${pad(under(10), 7)}${pad(under(20), 7)}`,
  )
}
console.log('\n⚠ the ITF table holds cohort+1 rows, so a "rank" here is her place among the juniors this\nworld actually has – which is what every other ITF-rank surface in the game already means.')

if (JSON_OUT) {
  writeFileSync(
    JSON_OUT,
    JSON.stringify(
      {
        label: LABEL,
        n,
        seeds: SEEDS,
        weeks: WEEKS,
        policy: POLICY.id,
        admission,
        byAge,
        perRung,
        ranks,
        college: {
          shut: shut.length,
          n,
          meanAge: meanOf(shutAges),
          medianAge: shutAges.length ? median(shutAges) : null,
          openAtFork: rows.filter((r) => r.collegeOpenAtFork).length,
          byCloser: Object.fromEntries(byCloser),
          bucket: shutBucket,
        },
        survival: { ended: ended.length, byKind: Object.fromEntries(byKind) },
        money: {
          prizeBy19Mean: mean(rows.map((r) => r.prizeBy19Cents)),
          prizeBy19Median: median(rows.map((r) => r.prizeBy19Cents)),
          prizeMean: mean(rows.map((r) => r.prizeCents)),
        },
        juniorTable,
        careerHigh: { n: best.length, mean: meanOf(best), median: best.length ? median(best) : null },
      },
      null,
      2,
    ),
  )
  console.log(`\njson -> ${JSON_OUT}`)
}
