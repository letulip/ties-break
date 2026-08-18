// DID THE PLAY DOWN RULE FIRE, AND DID IT EVER LEAVE HER WITH NOTHING?
//
//   npx vite-node tools/play-down-probe.ts -- [--seeds N] [--weeks N]
//
// WHY THIS EXISTS. `tools/junior-access.ts` measured step 2 at +1.8% prize and two more majors over
// 54 careers – a delta small enough that "it is nearly inert on this horizon" and "it never fires"
// are the same number to the naked eye, and they are completely different findings. This separates
// them by counting the refusals themselves rather than their consequences.
//
// AND IT ANSWERS THE ONE RISK THE RULE CARRIES, which the spec predicted (Q7) and must not merely
// assert: a girl inside #150 has W15 and W35 shut by THIS rule and, if she is still a junior,
// everything above them shut by the Accelerator. If that ever leaves a week with nothing enterable
// at all, it is the boredom failure the owner has ruled against twice – so the probe counts weeks
// with an empty feed, on the same careers, in the same run. `tools/boredom-guard.ts` is the tool
// that asks this question of the whole ladder; this is the same question asked of one rule.
//
// MEASUREMENT ONLY: nothing is patched and no engine number is written from here.
import { openCareer, stepCareerWeek, POLICIES, PRESETS, mean, median } from './econ-bench'
import { kidAgeExact, kidPoints, playDownBars, tierFloorOpen, PLAY_DOWN } from '../src/engine/world'
import { TIER_LADDER, TIER_SHORT, W_SERIES, isTierAgeOpen } from '../src/engine/season/calendar'
import type { TierId } from '../src/engine/season/types'

const args = process.argv.slice(2)
const argOf = (n: string, d: number) => {
  const i = args.indexOf(`--${n}`)
  return i >= 0 && args[i + 1] ? Number(args[i + 1]) : d
}
const SEEDS = argOf('seeds', 3)
const WEEKS = argOf('weeks', 416)
const POLICY = POLICIES[1]

interface Row {
  everInside150: boolean
  everInside50: boolean
  ageInside150: number | null
  ageInside50: number | null
  /** weeks in which the rule shut at least one W rung she would otherwise have been able to enter */
  barredWeeks: number
  /** ...broken out per rung */
  barredAt: Partial<Record<TierId, number>>
  /** ⚠ THE BOREDOM CHECK: weeks with NO rung of the whole sixteen open to her at all */
  emptyWeeks: number
  /** ...and of those, the ones where the play down rule was one of the reasons */
  emptyWhileBarred: number
}

const rows: Row[] = []
for (const preset of PRESETS) {
  for (let i = 0; i < SEEDS; i++) {
    const { world, rng } = openCareer(preset, i, POLICY)
    const row: Row = {
      everInside150: false,
      everInside50: false,
      ageInside150: null,
      ageInside50: null,
      barredWeeks: 0,
      barredAt: {},
      emptyWeeks: 0,
      emptyWhileBarred: 0,
    }
    for (let w = 0; w < WEEKS; w++) {
      stepCareerWeek(world, rng, POLICY)
      if (world.ending) break
      const age = kidAgeExact(world.week, world.profile.birthMonth, world.profile.birthDay)
      const rank = kidPoints(world, 'wta') > 0 ? (world.kidRankWta ?? null) : null
      if (rank !== null && rank <= PLAY_DOWN.fromLowW && !row.everInside150) {
        row.everInside150 = true
        row.ageInside150 = age
      }
      if (rank !== null && rank <= PLAY_DOWN.fromAllW && !row.everInside50) {
        row.everInside50 = true
        row.ageInside50 = age
      }
      let barredHere = false
      for (const t of W_SERIES) {
        if (!playDownBars(world, t)) continue
        barredHere = true
        row.barredAt[t] = (row.barredAt[t] ?? 0) + 1
      }
      if (barredHere) row.barredWeeks += 1
      // "Nothing open" is the LADDER's own verdict over every rung she is old enough for – the same
      // `tierFloorOpen` the calendar reads, asked of the whole catalogue.
      const open = TIER_LADDER.filter((t) => isTierAgeOpen(t, Math.floor(age)) && tierFloorOpen(world, t))
      if (open.length === 0) {
        row.emptyWeeks += 1
        if (barredHere) row.emptyWhileBarred += 1
      }
    }
    rows.push(row)
  }
}

const n = rows.length
const pct = (part: number) => `${((100 * part) / n).toFixed(0)}%`
console.log(`\nplay-down-probe · n=${n} (${PRESETS.length} presets x ${SEEDS} seeds) · ${WEEKS} weeks · policy ${POLICY.id}\n`)

const in150 = rows.filter((r) => r.everInside150)
const in50 = rows.filter((r) => r.everInside50)
console.log(`careers that ever reach WTA top ${PLAY_DOWN.fromLowW}:  ${in150.length} of ${n} (${pct(in150.length)})`)
if (in150.length) {
  const ages = in150.map((r) => r.ageInside150 as number)
  console.log(`  ...first at age    mean ${mean(ages).toFixed(1)}   median ${median(ages).toFixed(1)}   earliest ${Math.min(...ages).toFixed(1)}`)
}
console.log(`careers that ever reach WTA top ${PLAY_DOWN.fromAllW}:   ${in50.length} of ${n} (${pct(in50.length)})`)
if (in50.length) {
  const ages = in50.map((r) => r.ageInside50 as number)
  console.log(`  ...first at age    mean ${mean(ages).toFixed(1)}   median ${median(ages).toFixed(1)}   earliest ${Math.min(...ages).toFixed(1)}`)
}

const barred = rows.filter((r) => r.barredWeeks > 0)
console.log(`\ncareers the rule ever refused:      ${barred.length} of ${n} (${pct(barred.length)})`)
console.log(`weeks per career it was refusing:  mean ${mean(rows.map((r) => r.barredWeeks)).toFixed(1)}   median ${median(rows.map((r) => r.barredWeeks)).toFixed(0)}   max ${Math.max(...rows.map((r) => r.barredWeeks))}`)
console.log('\nrefusals by rung (career-weeks in which that rung was shut BY THIS RULE):')
for (const t of W_SERIES) {
  const total = rows.reduce((s, r) => s + (r.barredAt[t] ?? 0), 0)
  console.log(`  ${TIER_SHORT[t].padEnd(6)} ${String(total).padStart(6)}`)
}

const empty = rows.reduce((s, r) => s + r.emptyWeeks, 0)
const emptyBarred = rows.reduce((s, r) => s + r.emptyWhileBarred, 0)
console.log(`\n⚠ THE BOREDOM CHECK – weeks with NOTHING open on the whole ladder:`)
console.log(`  total across ${n} careers      ${empty}`)
console.log(`  ...of them, weeks in which this rule was also refusing   ${emptyBarred}`)
console.log(`  careers with any such week     ${rows.filter((r) => r.emptyWeeks > 0).length} of ${n}`)
