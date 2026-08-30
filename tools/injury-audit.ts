// THE INJURY AUDIT – what the body actually does over a whole playing life, measured on the
// re-priced week.
//
//   npx vite-node tools/injury-audit.ts [--seeds N] [--presets N] [--arm plays-on|realistic]
//                                       [--base X] [--slope X] [--play X] [--flatAge] [--flatLoad]
//                                       [--ageCurve "13:0.85,...,default:X"] [--riskReduction X]
//                                       [--noRecurrence] [--flatSeverityAge]
//                                       [--tauBump X] [--severityBump X] [--halfLife N]
//
// WHY IT EXISTS. `tools/pro-season-probe.ts` measures ONE professional schedule from a clean body –
// it is the re-price's acceptance harness and it deliberately starts at sixteen with no junior
// mileage. `tools/endings-bench.ts` measures how careers END. Neither can answer the questions the
// owner asked on 04.08 («снова посмотреть на нашу усталость и травмы на данный момент»), because
// all of them are about the DISTRIBUTION of injury over a whole life:
//
//   PREVALENCE   by severity, per season and per career, and by AGE BAND
//   WEEKS LOST   per season, and the shape of the tail (the number the epilogue prints)
//   ATTRIBUTION  how much of the rate is fatigue-driven vs age-driven vs load-driven
//   THE TOP END  is `severe` reachable at all, and how often - the endings wave found a rule keyed
//                on TWO of them could never fire, and «check that severe is not simply mis-scaled»
//   THE ENDING   the weeks-lost threshold #4 fires on, swept the way bankruptcy's N was swept
//
// ⚠ ATTRIBUTION IS MEASURED BY COUNTERFACTUAL ARMS, NOT BY DECOMPOSING A SUM, and the difference is
// worth stating because it changes what the number means. `injuryTau` is a product of factors, so an
// algebraic split would answer "what fraction of the threshold does each factor contribute on the
// weeks she actually lived" – which silently conditions on a career that those very factors shaped.
// Re-running the whole life with ONE axis neutralised answers the question that was asked: how many
// injuries does this axis cause. It carries a feedback term (fewer injuries -> more weeks played ->
// more fatigue), it is reported as a rate difference rather than a share, and the caveat is printed
// with the table.
//
// MEASUREMENT ONLY: every week goes through `stepCareerWeek`, the same public path the econ and
// endings benches use. No engine number is written from here – the knob patches below are CLI-only
// counterfactual arms (the fatigue bench's `withScenario` idiom), never written back to any file.
import { PRESETS, POLICIES, openCareer, stepCareerWeek, mean, median, type Preset, type Policy } from './econ-bench'
import { answerFork, answerRetirement, kidAgeYears } from '../src/engine/world'
import { ENDINGS } from '../src/engine/ending'
import { ageAtPhysicalShare } from '../src/engine/development'
import { ECONOMY } from '../src/engine/economy'
import { bodyPartOf } from '../src/engine/body'
import { WEEKS_PER_YEAR } from '../src/engine/season/calendar'
import type { InjurySeverity, CareerEndingType } from '../src/shared/protocol'

const argv = process.argv.slice(2)
const num = (name: string, fallback: number): number => {
  const i = argv.indexOf(`--${name}`)
  return i >= 0 && argv[i + 1] ? Number(argv[i + 1]) : fallback
}
const str = (name: string, fallback: string): string => {
  const i = argv.indexOf(`--${name}`)
  return i >= 0 && argv[i + 1] ? argv[i + 1] : fallback
}
const flag = (name: string): boolean => argv.includes(`--${name}`)

// --- the counterfactual arms (CLI only, never persisted) -----------------------------------------
const KNOBS = ECONOMY.availability as unknown as {
  injuryBaseChance: number
  injuryFatigueSlope: number
  injuryPlayingMultiplier: number
  ageInjuryFactor: { [age: number]: number; default: number }
  consecutivePlayFactor: number[]
}
KNOBS.injuryBaseChance = num('base', KNOBS.injuryBaseChance)
KNOBS.injuryFatigueSlope = num('slope', KNOBS.injuryFatigueSlope)
KNOBS.injuryPlayingMultiplier = num('play', KNOBS.injuryPlayingMultiplier)
// ⭐ ROUND 30 #26 – THE PROTECTION AXIS, so a floor on it can be BRACKETED rather than asserted.
// `physioRiskFactor` reads this and nothing else beside the rung's quality, so `--riskReduction 1`
// makes the medical team worth exactly nothing at every rung and at every age – which is the UPPER
// bound on what a floor that closes at the top of the age curve can cost a population. Same CLI-only
// idiom as the rest of this block: nothing is written back to any file.
;(ECONOMY.physio as unknown as { riskReduction: number }).riskReduction = num(
  'riskReduction',
  ECONOMY.physio.riskReduction,
)
if (flag('flatAge')) KNOBS.ageInjuryFactor = { default: 1 }
// ⭐ ROUND 30 #26 – A WHOLE CANDIDATE AGE CURVE, SWAPPED IN FOR ONE RUN. Same CLI-only counterfactual
// idiom as `--flatAge` directly above: nothing is written back to any file, and the arm is printed in
// the header so no output can be misfiled.
//
// ⚠ THE SPEC IS A FULL REPLACEMENT AND `default:` IS REQUIRED, deliberately. A "merge onto the
// shipped rows" form would make the printed arm ambiguous – the reader could not tell a 14 that was
// stated from a 14 that was inherited – and the whole point of this flag is that what it prints is
// EXACTLY what would be pasted into `ECONOMY.availability.ageInjuryFactor`. One edit to apply.
//
//   --ageCurve "13:0.85,14:0.9,15:1.05,16:1.2,17:1.05,18:0.95,19:0.8,...,default:1.6"
const ageCurveSpec = str('ageCurve', '')
if (ageCurveSpec) {
  const table: { [age: number]: number; default: number } = { default: NaN }
  for (const pair of ageCurveSpec.split(',')) {
    const [k, v] = pair.split(':')
    if (k === undefined || v === undefined || Number.isNaN(Number(v))) throw new Error(`--ageCurve: bad pair "${pair}"`)
    if (k.trim() === 'default') table.default = Number(v)
    else table[Number(k)] = Number(v)
  }
  if (Number.isNaN(table.default)) throw new Error('--ageCurve: the spec must carry a `default:` rung')
  KNOBS.ageInjuryFactor = table
}
if (flag('flatLoad')) {
  KNOBS.consecutivePlayFactor = [1, 1, 1, 1, 1]
  KNOBS.injuryPlayingMultiplier = 1
}
// ⭐ ROUND 30 #27 – THE TWO NEW LIMBS, EACH WITH ITS OWN OFF SWITCH, so section 6's clustering
// columns have a CONTROL rather than an assertion. Same CLI-only counterfactual idiom as everything
// above: nothing is written back to any file, and both arms are printed in the header.
//
// ⚠ `--noRecurrence` MUST NEUTRALISE ALL THREE OF ITS FACTORS AT ONCE or it is not a control. The
// mechanic is one state quantity (`recurrenceLoad`) read by a tau multiply, a severity escalation
// and a region tilt; switching off two of the three would measure a half-mechanic and attribute the
// result to the whole one. Zeroing the two bumps makes `1 + bump x load` exactly 1, and a `partTilt`
// of 1 makes the region tilt the identity – which is why the tilt strength lives in this knob group
// rather than beside body.ts's own two tilts.
const RECUR = ECONOMY.availability.recurrence as unknown as {
  tauBump: number
  severityBump: number
  partTilt: number
  halfLifeWeeks: number
  loadCap: number
}
if (flag('noRecurrence')) {
  RECUR.tauBump = 0
  RECUR.severityBump = 0
  RECUR.partTilt = 1
}
RECUR.tauBump = num('tauBump', RECUR.tauBump)
RECUR.severityBump = num('severityBump', RECUR.severityBump)
RECUR.halfLifeWeeks = num('halfLife', RECUR.halfLifeWeeks)
// ⚠ `--flatSeverityAge` IS THE OTHER HALF OF THE SAME DISCIPLINE. Limb 1 (severity by age) and limb
// 2 (recurrence) both land on `escalatedBands`, so measuring either one needs the other held still.
const SEV_AGE = ECONOMY.availability as unknown as { severityAgeFactor: { [age: number]: number; default: number } }
if (flag('flatSeverityAge')) SEV_AGE.severityAgeFactor = { default: 1 }

const SEEDS = num('seeds', 10)
const PRESET_COUNT = num('presets', PRESETS.length)
/** `plays-on` = the endings spec's own maximum-exposure arm: she refuses every retirement offer,
 *  turns professional at the fork, and money never latches the career shut. It is the denominator
 *  that means anything for a LATE-career event (endings-and-the-album.md §2). `realistic` is the
 *  shipped game with every latch live. */
const ARM = str('arm', 'plays-on') as 'plays-on' | 'realistic'
/** econ-bench's two entry policies: `grinder` enters everything affordable (the naive parent),
 *  `player` keeps a reserve and refuses to race below a rest floor. Both are shipped arms. */
const POLICY = POLICIES.find((p) => p.id === str('policy', 'grinder')) ?? POLICIES[0]
/** A whole playing life, as `tools/endings-bench.ts` defines it: the age an undamaged body crosses
 *  `ENDINGS.lastOfferPeakShare`, rounded up, plus the two years that cover a once-a-year question
 *  asked of a whole-year age. It read `ENDINGS.stopAskingAgeYears`, which the long goodbye's step 2
 *  deleted.
 *
 *  ⚠ DERIVED HERE RATHER THAN IMPORTED FROM THE BENCH, AND THE REASON IS A TRAP WORTH NAMING:
 *  IMPORTING A BENCH RUNS IT. Every bench in `tools/` carries the same autorun guard, and one of its
 *  three clauses is `TB_BENCH_RUN === '1'` – which is exactly how a probe like this one gets invoked
 *  by hand on a runner version that strips the entry file from `argv`. So `import { FULL_CAREER_WEEKS
 *  } from './endings-bench'` would silently prepend a twelve-minute endings bench to every injury
 *  audit. Measured 26.08 in the other direction: `TB_BENCH_RUN=1 vite-node tools/endings-bench.ts`
 *  runs the WHOLE OF `econ-bench` first, because `endings-bench` imports it. */
const FULL_CAREER_WEEKS =
  (Math.ceil(ageAtPhysicalShare(ENDINGS.lastOfferPeakShare)) + 2 - 14 + 1) * WEEKS_PER_YEAR

const SEVERITIES: InjurySeverity[] = ['minor', 'moderate', 'major', 'severe']

interface Onset {
  week: number
  age: number
  severity: InjurySeverity
  weeksOut: number
  /** ⭐ ROUND 30 #27 – WHICH OF THE TWELVE REGIONS, which is what makes clustering measurable at all.
   *  Read through `bodyPartOf` rather than by splitting `kind` on its first space: "lower back" is
   *  two words and the naive split answers "lower" for it. */
  part: string | null
  /** her condition the week the roll landed (post-accrual read, one week's recovery late) */
  condition: number
  /** weeks her body had already lost, as `weeksLostSoFar` reads it (the ENDING's own accumulator) */
  weeksLostBefore: number
  /** ...and the same total counted WITHOUT the 20-entry history prune */
  trueWeeksLostBefore: number
}

interface SeasonRow {
  season: number
  age: number
  onsets: Onset[]
  weeksInjured: number
  weeksLived: number
  meanCondition: number
  played: number
}

interface CareerRow {
  seed: string
  preset: string
  seasons: SeasonRow[]
  onsets: Onset[]
  ending: CareerEndingType | null
  endedAge: number | null
  weeksLived: number
  /** the longest `injuryHistory` ever reached – the prune check (it is capped at 20) */
  maxHistoryLength: number
}

function runCareer(preset: Preset, index: number, policy: Policy): CareerRow {
  const { world, rng, seed } = openCareer(preset, index, policy)
  const row: CareerRow = {
    seed,
    preset: preset.label,
    seasons: [],
    onsets: [],
    ending: null,
    endedAge: null,
    weeksLived: 0,
    maxHistoryLength: 0,
  }
  let season: SeasonRow | null = null
  let condSum = 0
  /** every RECOVERED layoff, un-pruned – so the audit can see what the 20-entry cap hides.
   *  Counted here rather than read off `injuryHistory`, which is exactly the point: the engine
   *  prunes that list to its last 20 rows, and `weeksLostSoFar` (the career-ending accumulator)
   *  reads the pruned list. */
  let trueWeeksLost = 0
  let liveTotalWeeks = 0

  for (let i = 0; i < FULL_CAREER_WEEKS && world.ending === null; i++) {
    if (ARM === 'plays-on') world.debtSinceWeek = null
    const wasInjured = world.injury !== null
    const conditionAtRoll = world.condition
    const weeksLostBefore = world.injuryHistory.reduce((s, h) => s + h.weeksOut, 0)

    // ⚠ ENTRIES COMMITTED, NOT `pendingTournament`. `stepCareerWeek` resolves the reveal inside
    // itself, so a caller that looks at `world.pendingTournament` afterwards always sees null and
    // measures zero events a season. Its RETURN VALUE is the per-tier entry count, which is the
    // honest count of events she committed to.
    const entered = stepCareerWeek(world, rng, policy)
    const enteredCount = Object.values(entered).reduce((s, n) => s + n, 0)

    const idx = Math.floor(world.week / WEEKS_PER_YEAR)
    if (!season || season.season !== idx) {
      if (season) {
        season.meanCondition = season.weeksLived === 0 ? 0 : condSum / season.weeksLived
        row.seasons.push(season)
      }
      condSum = 0
      season = {
        season: idx,
        age: kidAgeYears(world.week, world.profile.birthMonth, world.profile.birthDay),
        onsets: [],
        weeksInjured: 0,
        weeksLived: 0,
        meanCondition: 0,
        played: 0,
      }
    }
    season.weeksLived += 1
    row.weeksLived += 1
    condSum += world.condition
    season.played += enteredCount

    // she cleared this week: bank the layoff at full length, whether or not the prune kept it
    if (wasInjured && world.injury === null) {
      trueWeeksLost += liveTotalWeeks
      liveTotalWeeks = 0
    }
    if (world.injuryHistory.length > row.maxHistoryLength) row.maxHistoryLength = world.injuryHistory.length

    if (world.injury !== null) {
      season.weeksInjured += 1
      if (world.injury.sinceWeek === world.week) {
        liveTotalWeeks = world.injury.totalWeeks
        const onset: Onset = {
          week: world.week,
          age: kidAgeYears(world.week, world.profile.birthMonth, world.profile.birthDay),
          severity: world.injury.severity,
          weeksOut: world.injury.totalWeeks,
          part: bodyPartOf(world.injury.kind),
          condition: conditionAtRoll,
          weeksLostBefore,
          trueWeeksLostBefore: trueWeeksLost,
        }
        season.onsets.push(onset)
        row.onsets.push(onset)
      }
    }

    // answer whatever the world raises, the endings bench's own arm shape
    if (world.fork !== null && world.fork.answer === null) answerFork(world, 'continue')
    if (world.retirementOffer !== null) {
      answerRetirement(world, ARM === 'plays-on' ? world.retirementOffer.final : true)
    }
  }
  if (season) {
    season.meanCondition = season.weeksLived === 0 ? 0 : condSum / season.weeksLived
    row.seasons.push(season)
  }
  if (world.ending) {
    row.ending = world.ending.type
    row.endedAge = world.ending.ageYears
  }
  return row
}

// --- run -----------------------------------------------------------------------------------------
const policy = POLICY
const careers: CareerRow[] = []
for (const preset of PRESETS.slice(0, PRESET_COUNT)) {
  for (let s = 0; s < SEEDS; s++) careers.push(runCareer(preset, s, policy))
}
const seasons = careers.flatMap((c) => c.seasons).filter((s) => s.weeksLived >= WEEKS_PER_YEAR - 2)
const onsets = careers.flatMap((c) => c.onsets)

const pct = (n: number, d: number) => (d === 0 ? '   – ' : `${((100 * n) / d).toFixed(1).padStart(5)}%`)
const f = (x: number, d = 2) => x.toFixed(d)
const quantile = (xs: number[], q: number): number => {
  if (xs.length === 0) return 0
  const s = [...xs].sort((a, b) => a - b)
  return s[Math.min(s.length - 1, Math.floor(q * s.length))]
}

console.log('')
console.log('THE INJURY AUDIT – a whole playing life on the re-priced week')
console.log(
  `  ${PRESETS.slice(0, PRESET_COUNT).length} presets x ${SEEDS} seeds = ${careers.length} careers, arm "${ARM}", policy "${policy.label}"`,
)
console.log(
  `  knobs: base ${KNOBS.injuryBaseChance} + slope ${KNOBS.injuryFatigueSlope}/fatigue pt, x${KNOBS.injuryPlayingMultiplier} playing, ` +
    `cap ${ECONOMY.availability.injuryChanceCap} · recoveryBase ${ECONOMY.condition.recoveryBase}` +
    ` · physio.riskReduction ${ECONOMY.physio.riskReduction}`,
)
// ⭐ ROUND 30 #27 – BOTH NEW LIMBS IN THE HEADER, for exactly the reason the age arm is: a run graded
// on a table the output does not name is a run a later reader will guess at.
console.log(
  `  severityAgeFactor${flag('flatSeverityAge') ? ' (--flatSeverityAge)' : ' (shipped)'}: ` +
    Object.entries(SEV_AGE.severityAgeFactor)
      .map(([k, v]) => `${k}:${v}`)
      .join(', '),
)
console.log(
  `  recurrence${flag('noRecurrence') ? ' (--noRecurrence)' : ''}: tauBump ${RECUR.tauBump} · severityBump ${RECUR.severityBump}` +
    ` · partTilt ${RECUR.partTilt} · halfLife ${RECUR.halfLifeWeeks}w · loadCap ${RECUR.loadCap}`,
)
console.log(
  `  ${seasons.length} FULL seasons lived · ${onsets.length} onsets · mean seasons per career ${f(mean(careers.map((c) => c.seasons.length)), 1)}`,
)
// ⭐ THE AGE ARM, ALWAYS PRINTED – shipped or counterfactual, in the exact shape `ECONOMY` holds it.
// A table this run was graded on that the output does not name is a table a later reader will guess.
console.log(
  `  ageInjuryFactor${ageCurveSpec ? ' (--ageCurve)' : flag('flatAge') ? ' (--flatAge)' : ' (shipped)'}: ` +
    Object.entries(KNOBS.ageInjuryFactor)
      .map(([k, v]) => `${k}:${v}`)
      .join(', '),
)

// --- 1. the per-season picture --------------------------------------------------------------------
console.log('\n  1. PER SEASON (a season = a full 52-week block actually lived)')
console.log('     seasons with >= 1 onset of any severity   ' + pct(seasons.filter((s) => s.onsets.length > 0).length, seasons.length) + '   research anchor 46-54%')
console.log('     onsets per season                         ' + f(mean(seasons.map((s) => s.onsets.length))).padStart(6))
console.log('     weeks lost per season                     ' + f(mean(seasons.map((s) => s.weeksInjured)), 1).padStart(6))
console.log('     mean condition                            ' + f(mean(seasons.map((s) => s.meanCondition)), 0).padStart(6))
// ⚠ THE 'band' COLUMN IS THE WEEKLY ROLL'S TABLE, AND SINCE ROUND 16 THAT IS NOT THE ONLY ONE (#13).
// The retirement door draws from `retirementSeverityBands` – same four labels, different odds and a
// shorter moderate – so an onset counted here may have been rolled against a band this column does
// not print. This audit's population is careers, which contain both doors, so read the column as
// "the weekly roll's design", never as "the band this onset came from".
// `tools/injury-cause-probe.ts` is the instrument that separates them; it reports the mix per door.
console.log('\n     severity      onsets/season   seasons carrying >=1   mean weeks out   band (WEEKLY roll)')
for (const sev of SEVERITIES) {
  const band = ECONOMY.availability.severityBands.find((b) => b.severity === sev)!
  const share = onsets.filter((o) => o.severity === sev)
  console.log(
    `     ${sev.padEnd(10)}   ${f(mean(seasons.map((s) => s.onsets.filter((o) => o.severity === sev).length)), 3).padStart(11)}   ` +
      `${pct(seasons.filter((s) => s.onsets.some((o) => o.severity === sev)).length, seasons.length).padStart(20)}   ` +
      `${f(mean(share.map((o) => o.weeksOut)), 1).padStart(14)}   ${band.weeksLo}-${band.weeksHi}w`,
  )
}

// --- 2. by age band ---------------------------------------------------------------------------------
console.log('\n  2. BY AGE BAND (the age curve peaks at 16 by construction – this is what it produces)')
const BANDS: [string, number, number][] = [
  ['13-15', 13, 15],
  ['16-18', 16, 18],
  ['19-22', 19, 22],
  ['23-28', 23, 28],
  ['29+', 29, 99],
]
// ⚠ `played` IS THE CONTROL COLUMN, not decoration. The research band this table is graded against
// (46-54% for juniors, 30-54% for pros) is a prevalence per SEASON PLAYED, so a band that shows a low
// rate on eight events a year is not the same finding as one that shows it on twenty.
console.log('     band     seasons   events/season   onsets/season   prevalence   wks lost/season   mean cond   ageFactor')
for (const [label, lo, hi] of BANDS) {
  const rows = seasons.filter((s) => s.age >= lo && s.age <= hi)
  if (rows.length === 0) continue
  const table = ECONOMY.availability.ageInjuryFactor
  const factors = [...new Set(Array.from({ length: hi - lo + 1 }, (_, i) => table[lo + i] ?? table.default))]
  console.log(
    `     ${label.padEnd(8)} ${String(rows.length).padStart(7)}   ${f(mean(rows.map((r) => r.played)), 1).padStart(13)}   ` +
      `${f(mean(rows.map((r) => r.onsets.length))).padStart(13)}   ` +
      `${pct(rows.filter((r) => r.onsets.length > 0).length, rows.length)}   ${f(mean(rows.map((r) => r.weeksInjured)), 1).padStart(15)}   ` +
      `${f(mean(rows.map((r) => r.meanCondition)), 0).padStart(9)}   ${factors.join('/')}`,
  )
}

// --- 2b. CLUSTERING – round 30 #27's PRIMARY evidence ---------------------------------------------
//
// ⭐⭐ THE OWNER'S COMPLAINT WAS TEXTURE, NOT FREQUENCY, so this is the section the recurrence limb is
// graded on and the rate columns above are not. «Ни одной травмы я не видел уже несколько сезонов»
// against a measured 0.68-0.78 onsets a season and his own lifetime 0.64: the number was never the
// problem. INDEPENDENT WEEKLY DRAWS PRODUCE EXACTLY THAT FORGETTABLE PATTERN. The question these
// columns answer is whether the same total now arrives in a shape a person remembers.
//
// ⚠ READ THEM AGAINST `--noRecurrence`, NEVER ON THEIR OWN. Every number here is non-zero under pure
// independence – twelve body regions means a repeat happens by chance about one time in twelve – so
// a "31% of onsets are repeats" line proves nothing without the control arm beside it.
console.log('\n  2b. CLUSTERING (round 30 #27 – the texture columns, read against --noRecurrence)')
{
  // Per career, walk the onsets in order and ask of each: had this body already broken this part?
  let repeats = 0
  let placed = 0
  const gaps: number[] = []
  const repeatGaps: number[] = []
  const freshGaps: number[] = []
  const seasonCounts: number[] = []
  let repeatWorse = 0
  let repeatSame = 0
  // ⚠⚠ THE LIFETIME COLUMN SATURATES AND THE WINDOWED ONE IS THE HONEST INSTRUMENT. "Has this body
  // ever broken this part before" reads ~59% even with the mechanic switched OFF – twelve regions and
  // a twenty-injury career means almost everything is a repeat by the end, so the metric runs out of
  // room to show anything. `recurrence.halfLifeWeeks` is the window the mechanic actually models, so
  // the second counter asks the question the DESIGN asks: was this part broken RECENTLY?
  const WINDOW = ECONOMY.availability.recurrence.halfLifeWeeks
  let recentRepeats = 0
  const SEV_RANK: Record<InjurySeverity, number> = { minor: 0, moderate: 1, major: 2, severe: 3 }
  for (const c of careers) {
    const ordered = [...c.onsets].sort((a, b) => a.week - b.week)
    const worstByPart = new Map<string, number>()
    const lastWeekByPart = new Map<string, number>()
    for (let i = 0; i < ordered.length; i++) {
      const o = ordered[i]
      if (i > 0) {
        const gap = o.week - ordered[i - 1].week
        gaps.push(gap)
        const recent = o.part !== null && (lastWeekByPart.get(o.part) ?? -Infinity) >= o.week - WINDOW
        ;(recent ? repeatGaps : freshGaps).push(gap)
      }
      if (o.part === null) continue
      placed++
      const prior = worstByPart.get(o.part)
      if (prior !== undefined) {
        repeats++
        if (SEV_RANK[o.severity] > prior) repeatWorse++
        else if (SEV_RANK[o.severity] === prior) repeatSame++
      }
      if ((lastWeekByPart.get(o.part) ?? -Infinity) >= o.week - WINDOW) recentRepeats++
      worstByPart.set(o.part, Math.max(prior ?? -1, SEV_RANK[o.severity]))
      lastWeekByPart.set(o.part, o.week)
    }
    for (const s of c.seasons) seasonCounts.push(s.onsets.length)
  }
  console.log(
    `     onsets that REPEAT a part this body already broke   ${pct(repeats, placed)}   ` +
      `(⚠ SATURATES - ~59% with the mechanic OFF)`,
  )
  console.log(
    `     ⭐ ...broken again INSIDE ${WINDOW}w of the last time     ${pct(recentRepeats, placed)}   ` +
      `(the window the half-life models - THIS is the column to read)`,
  )
  console.log(
    `     gap after a recent repeat / after a fresh part      ` +
      `${f(mean(repeatGaps), 1)}w (n=${repeatGaps.length})  vs  ${f(mean(freshGaps), 1)}w (n=${freshGaps.length})`,
  )
  console.log(
    `       ...of those repeats, LANDING WORSE than before    ${pct(repeatWorse, repeats)}` +
      `   same band ${pct(repeatSame, repeats)}`,
  )
  console.log(
    `     gap between consecutive onsets (weeks)              mean ${f(mean(gaps), 1)}  median ${f(median(gaps), 1)}  ` +
      `p10 ${quantile(gaps, 0.1)}  p90 ${quantile(gaps, 0.9)}`,
  )
  // ⭐ THE ONE LINE THAT SAYS "CLUSTERED" RATHER THAN "MORE". Under independent weekly draws the
  // per-season count is Poisson, whose variance EQUALS its mean, so the ratio sits at ~1. Clustering
  // is over-dispersion and pushes it above 1 – and it can rise while the mean does not move at all,
  // which is the whole design brief. This is the number to quote at him.
  const mSeason = mean(seasonCounts)
  const vSeason = mean(seasonCounts.map((n) => (n - mSeason) ** 2))
  console.log(
    `     onsets per season: mean ${f(mSeason, 3)}  variance ${f(vSeason, 3)}  ` +
      `⭐ VARIANCE/MEAN ${f(vSeason / Math.max(1e-9, mSeason), 3)}   (independent draws = 1.00)`,
  )
  const quiet3 = careers.filter((c) => {
    // the longest run of consecutive FULL seasons with no onset at all – his «несколько сезонов»
    let best = 0
    let run = 0
    for (const s of c.seasons) {
      run = s.onsets.length === 0 ? run + 1 : 0
      if (run > best) best = run
    }
    return best >= 3
  })
  console.log(
    `     careers with a 3+ season clean STRETCH              ${pct(quiet3.length, careers.length)}` +
      `   (the pattern he described – it should SURVIVE, not vanish)`,
  )
  console.log(
    `     seasons carrying 2+ onsets                          ` +
      pct(seasonCounts.filter((n) => n >= 2).length, seasonCounts.length) +
      `   (the other half of the same story)`,
  )
}

// --- 3. the tail --------------------------------------------------------------------------------------
console.log('\n  3. WEEKS LOST – the distribution and its tail')
const lostPerSeason = seasons.map((s) => s.weeksInjured)
console.log(
  `     per season:  mean ${f(mean(lostPerSeason), 1)}  median ${f(median(lostPerSeason), 1)}  p75 ${quantile(lostPerSeason, 0.75)}  ` +
    `p90 ${quantile(lostPerSeason, 0.9)}  p99 ${quantile(lostPerSeason, 0.99)}  max ${Math.max(0, ...lostPerSeason)}`,
)
const perCareer = careers.map((c) => c.seasons.reduce((s, x) => s + x.weeksInjured, 0))
console.log(
  `     per career:  mean ${f(mean(perCareer), 1)}  median ${f(median(perCareer), 1)}  p90 ${quantile(perCareer, 0.9)}  ` +
    `max ${Math.max(0, ...perCareer)}   (careers lived ${f(mean(careers.map((c) => c.weeksLived / WEEKS_PER_YEAR)), 1)} seasons)`,
)
const buckets = [0, 1, 3, 6, 10, 16, 26]
console.log(
  '     season histogram: ' +
    buckets
      .map((b, i) => {
        const hi = buckets[i + 1] ?? Infinity
        const n = lostPerSeason.filter((x) => x >= b && x < hi).length
        return `${b}${hi === Infinity ? '+' : `-${hi - 1}`}w ${((100 * n) / Math.max(1, lostPerSeason.length)).toFixed(0)}%`
      })
      .join(' · '),
)

// --- 4. the top end -------------------------------------------------------------------------------
console.log('\n  4. THE TOP END – is `severe` reachable, and is it scaled like the top of a ladder?')
const everSevere = careers.filter((c) => c.onsets.some((o) => o.severity === 'severe'))
const everMajorPlus = careers.filter((c) => c.onsets.some((o) => o.severity === 'major' || o.severity === 'severe'))
console.log(`     careers that ever saw a fresh severe        ${pct(everSevere.length, careers.length)}`)
console.log(`     careers that ever saw major-or-worse        ${pct(everMajorPlus.length, careers.length)}`)
console.log(
  `     major+ layoffs per career                   mean ${f(mean(careers.map((c) => c.onsets.filter((o) => o.severity === 'major' || o.severity === 'severe').length)))}  ` +
    `max ${Math.max(0, ...careers.map((c) => c.onsets.filter((o) => o.severity === 'major' || o.severity === 'severe').length))}`,
)
console.log(
  `     severes per career                          mean ${f(mean(careers.map((c) => c.onsets.filter((o) => o.severity === 'severe').length)))}  ` +
    `max ${Math.max(0, ...careers.map((c) => c.onsets.filter((o) => o.severity === 'severe').length))}`,
)
// ⚠ 'designed' IS THE WEEKLY ROLL'S DESIGN AND THE OBSERVED MIX IS A BLEND OF TWO DOORS (round 16
// #13). Both columns are printed unchanged because the weekly design is still the reference this
// audit was built to grade – but a gap between them is NOT automatically a defect any more: the
// retirement door draws 80/15/4/1, and it supplies ~61% of a career's onsets, so the blend is
// expected to read lighter than the weekly design at every band above minor. Use
// `tools/injury-cause-probe.ts` to see the two apart before concluding anything from a gap here.
console.log('     observed severity mix (BOTH doors) vs the WEEKLY roll\'s designed bands:')
for (const sev of SEVERITIES) {
  const band = ECONOMY.availability.severityBands
  const i = band.findIndex((b) => b.severity === sev)
  const designed = band[i].cum - (i === 0 ? 0 : band[i - 1].cum)
  const ret = ECONOMY.availability.retirementSeverityBands
  const j = ret.findIndex((b) => b.severity === sev)
  const retDesigned = ret[j].cum - (j === 0 ? 0 : ret[j - 1].cum)
  console.log(
    `       ${sev.padEnd(9)} observed ${pct(onsets.filter((o) => o.severity === sev).length, onsets.length)}   ` +
      `designed ${(100 * designed).toFixed(1).padStart(5)}% weekly / ${(100 * retDesigned).toFixed(1).padStart(5)}% retirement`,
  )
}
console.log(
  `     longest injuryHistory ever held: max ${Math.max(0, ...careers.map((c) => c.maxHistoryLength))} of the 20-entry cap ` +
    `(careers at the cap: ${careers.filter((c) => c.maxHistoryLength >= 20).length})`,
)
// ⚠ THE PRUNE IS NOT COSMETIC: `weeksLostSoFar` – the career-ending accumulator – sums the PRUNED
// list, so a body past twenty layoffs starts forgetting the earliest ones. This is the size of that.
const pruneGap = onsets.filter((o) => o.trueWeeksLostBefore > o.weeksLostBefore)
console.log(
  `     onsets whose accumulator was already short of the truth: ${pct(pruneGap.length, onsets.length)}` +
    (pruneGap.length ? `  mean shortfall ${f(mean(pruneGap.map((o) => o.trueWeeksLostBefore - o.weeksLostBefore)), 1)}w` : ''),
)

// --- 5. the career-ending sweep ---------------------------------------------------------------------
console.log('\n  5. THE CAREER-ENDING RULE – a fresh `severe` on a body that has already lost >= N weeks')
console.log(`     shipped N = ${ENDINGS.injuryPriorWeeksOut}. Swept the way bankruptcy's N was: one pass, exact for "would N have fired".`)
console.log('     N      careers where it would fire   median age at the firing severe')
for (const n of [0, 8, 12, 16, 20, 24, 30, 40, 52, 78]) {
  const firing = careers.filter((c) => c.onsets.some((o) => o.severity === 'severe' && o.weeksLostBefore >= n))
  const ages = firing.map((c) => c.onsets.find((o) => o.severity === 'severe' && o.weeksLostBefore >= n)!.age)
  console.log(
    `     ${String(n).padStart(2)}${n === ENDINGS.injuryPriorWeeksOut ? ' *' : '  '}   ${pct(firing.length, careers.length)}                        ${ages.length ? median(ages) : '–'}`,
  )
}
const severeOnsets = onsets.filter((o) => o.severity === 'severe')
console.log(
  `     at a fresh severe the body had already lost: mean ${f(mean(severeOnsets.map((o) => o.weeksLostBefore)), 1)}w  ` +
    `median ${f(median(severeOnsets.map((o) => o.weeksLostBefore)), 1)}w  max ${Math.max(0, ...severeOnsets.map((o) => o.weeksLostBefore))}w`,
)
console.log(
  `     ...and the ages a severe lands at: median ${severeOnsets.length ? median(severeOnsets.map((o) => o.age)) : '–'}  ` +
    `range ${severeOnsets.length ? Math.min(...severeOnsets.map((o) => o.age)) : '–'}-${severeOnsets.length ? Math.max(...severeOnsets.map((o) => o.age)) : '–'}`,
)

// --- 6. the condition an injury lands at --------------------------------------------------------------
console.log('\n  6. WHAT AN INJURY LANDS ON – her condition the week the roll went against her')
const cond = onsets.map((o) => o.condition)
console.log(
  `     mean ${f(mean(cond), 0)}  median ${f(median(cond), 0)}  p10 ${quantile(cond, 0.1)}  p90 ${quantile(cond, 0.9)}   ` +
    `(mean condition over all lived seasons: ${f(mean(seasons.map((s) => s.meanCondition)), 0)})`,
)
const CONDB: [string, number, number][] = [
  ['90-100', 90, 100],
  ['70-89', 70, 89],
  ['50-69', 50, 69],
  ['30-49', 30, 49],
  ['0-29', 0, 29],
]
console.log('     band      share of onsets')
for (const [label, lo, hi] of CONDB) {
  console.log(`     ${label.padEnd(9)} ${pct(cond.filter((c) => c >= lo && c <= hi).length, cond.length)}`)
}

// --- 7. endings, for context ---------------------------------------------------------------------------
const endingCounts = new Map<string, number>()
for (const c of careers) endingCounts.set(c.ending ?? 'none', (endingCounts.get(c.ending ?? 'none') ?? 0) + 1)
console.log(
  '\n  7. endings on this arm: ' +
    [...endingCounts.entries()].map(([k, v]) => `${k} ${pct(v, careers.length).trim()}`).join(' · '),
)
console.log('')
