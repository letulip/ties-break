/**
 * growth-age-sweep – WHEN DOES SHE STOP GETTING BETTER, AND WHICH HALF OF THE MODEL STOPS HER?
 *
 * The owner, 11.08, looking at his own seventeen-year-old: «про возраст собрать статистику и
 * получить замер было бы интересно». So this brings numbers, and it ships nothing.
 *
 * ⚠ MEASUREMENT ONLY. Every arm patches `ECONOMY.development.ageCurve` in place and restores it in a
 * `finally` – the same move `tools/potential-band-sweep.ts`, `tools/skill-ceiling.ts` §4 and
 * `tools/fatigue-bench.ts` make on the live ECONOMY object. `ECONOMY` is `as const`, i.e. deeply
 * readonly to the COMPILER and an ordinary mutable object at RUNTIME; a harness that sweeps a
 * shipped constant has to say so once and out loud. No constant, no test bound and no engine
 * behaviour is changed by this file, and `main` exits 1 if the curve is not back where it started.
 *
 * ⚠ THE OWNER'S SAVES ARE PERSONAL. `--save` reads one through the game's own import door
 * (`decodeExportFile`), exactly as tools/round15-read.ts does, and NOTHING is committed from it:
 * no fixture, no path, no career. Only the aggregate placement quoted in docs/specs/ leaves.
 *
 * WHY THIS TOOL EXISTS. docs/specs/potential-band-2026-08.md closed on a caveat rather than an
 * answer: raising the potential floor "changes the AMOUNT, not the TIMING – `growWeek` stays
 * asymptotic, so ~58% still arrives by eighteen. If the real complaint is 'nothing left at
 * seventeen', the dial is the age curve – a different question, unmeasured here." This is that
 * question, and §1 is the whole of it.
 *
 * ⚠⚠ THE CRUX IS A DECOMPOSITION, NOT A SWEEP. Two INDEPENDENT mechanisms make a week's growth fade,
 * and a tuning suggestion that cannot tell them apart is guesswork:
 *
 *     gain = ageFactor(age) x K x headroom x luck x aim        (development.ts, growWeek)
 *              \_ THE AGE RATE _/         \_ THE ASYMPTOTE _/
 *
 *   THE AGE RATE falls from `peakRate` to `plateauRate` as she ages – a dial, `ECONOMY.development
 *     .ageCurve`, with four numbers in it.
 *   THE ASYMPTOTE shrinks `headroom = potential - skills` as she climbs – NOT a dial at all. It is
 *     the shape of the model.
 *
 * Because the gain is their PRODUCT, the fade decomposes EXACTLY, and in logs it is additive. §1a
 * does that split on the live trajectory (unbiased – it is arithmetic over what actually happened);
 * §1b holds one factor fixed and varies the other, which is the same question asked the way the
 * brief asks it; §1c prices the only dial the owner can actually turn, and finds it eats itself.
 *
 * THE SECTIONS
 *   §1  THE DECOMPOSITION. Age rate versus asymptote, at 17, at 20, at 23. THE ANSWER TO THE BRIEF.
 *   §2  THE REALISATION CURVE. Share of lifetime headroom realised by each age 14..30 – deciles, not
 *       means, because the owner's complaints have twice turned out to be about the shape.
 *   §3  WHEN DOES A WEEK STOP BEING PERCEPTIBLE? Against the radar's OWN floors (CEILING_FLOOR_HALF,
 *       TRAINING_FOG_FLOOR) rather than an invented threshold – the game already owns a number for
 *       "movement a person could claim to have seen".
 *   §4  THE PEAK, twice: by SKILLS and by RESULTS. They need not be the same age, because the field
 *       moves too, and the difference is the interesting part.
 *   §5  THE VARIANTS – and §1 decides whether this section means anything.
 *   §6  WHAT BREAKS. Guard windows re-run under each variant, plus the anchors that are not tests.
 *   §7  A REAL CAREER, PLACED (optional, `--save`) – read locally, never committed.
 *
 * Run:
 *   npx vite-node tools/growth-age-sweep.ts -- [--seeds 12] [--only 1,2,3]
 *   npx vite-node tools/growth-age-sweep.ts -- --only 7 --save /path/x.tsave
 */
import { readFileSync } from 'node:fs'
import { openCareer, stepCareerWeek, runCareer as benchRunCareer, PRESETS, POLICIES, type Preset, type Policy } from './econ-bench'
import { FULL_CAREER_WEEKS } from './endings-bench'
import { answerFork, answerRetirement, startingSkills, type WorldState } from '../src/engine/world'
import { kidAgeExact } from '../src/engine/world/age'
import { withHeadStart } from '../src/engine/world/player'
import { decodeExportFile } from '../src/engine/saveCodec'
import {
  SKILL_KEYS,
  ageFactor,
  growWeek,
  relativeAgeHeadStart,
  rollPotential,
  type KidSkills,
} from '../src/engine/development'
import { ECONOMY } from '../src/engine/economy'
import { bestFitCoachAt, type Coach } from '../src/engine/coach'
import { CEILING_FLOOR_HALF, TRAINING_FOG_FLOOR, TRAINING_STEP } from '../src/engine/radar'
import { TIER_LADDER, WEEKS_PER_YEAR } from '../src/engine/season/calendar'
import { DEFAULT_PROFILE, WEEK_PLAN_PRESETS, type PlayerProfile } from '../src/shared/protocol'
import type { TierId } from '../src/engine/season/types'

// -------------------------------------------------------------------------------------------------
// args
// -------------------------------------------------------------------------------------------------
const args = process.argv.slice(2)
const argOf = (name: string, fallback: number): number => {
  const i = args.indexOf(`--${name}`)
  return i >= 0 && args[i + 1] ? Number(args[i + 1]) : fallback
}
const SEEDS = argOf('seeds', 12)
const onlyArg = args.indexOf('--only') >= 0 ? (args[args.indexOf('--only') + 1] ?? '') : ''
const ONLY = new Set(onlyArg.split(',').filter(Boolean))
const wants = (section: string): boolean => ONLY.size === 0 || ONLY.has(section)
const SAVES: string[] = []
for (let i = 0; i < args.length; i++) if (args[i] === '--save') SAVES.push(args[++i])

/** The ages the tables are indexed by. 14 is where the game starts; 30 is a year past `declineStart`,
 *  so the decline is visible rather than merely asserted. */
const AGES: number[] = Array.from({ length: 17 }, (_, i) => 14 + i)
const START_AGE = 14

// -------------------------------------------------------------------------------------------------
// THE CELLS – four background x coach cells, chosen to SPAN the two axes rather than to sample them
// -------------------------------------------------------------------------------------------------
//
// The development rate is `ageFactor x trainFactor x coachFactor x matchBonus`, and of those the cell
// moves exactly one: `coachFactor`, which runs 0.82 (self) to 1.21 (elite x great fit). The BACKGROUND
// moves it only indirectly – through what the family can afford to keep paying for – so a cell list
// that varied money at a fixed rung would be measuring the same growth curve four times. These four
// span the rung ladder end to end AND keep each rung on the money that can actually sustain it.
const CELLS: Array<{ label: string; preset: Preset }> = [
  { label: '8k  · working · self-coached', preset: PRESETS[0] },
  { label: '8k  · working · middle coach', preset: PRESETS[2] },
  { label: '25k · middle  · middle coach', preset: PRESETS[5] },
  { label: '120k· wealthy · elite coach', preset: PRESETS[8] },
]

// -------------------------------------------------------------------------------------------------
// THE VARIANTS – every one of them is a change to the AGE CURVE and nothing else
// -------------------------------------------------------------------------------------------------

interface Variant {
  label: string
  /** the ageCurve keys this arm overrides */
  patch: Record<string, number>
  why: string
}

const VARIANTS: Variant[] = [
  { label: 'baseline', patch: {}, why: 'as shipped: growthEnd 18, plateauRate .0009, declineStart 29' },
  { label: 'growthEnd 18->21', patch: { growthEnd: 21 }, why: 'the steep window runs three years longer' },
  { label: 'growthEase .5->.25', patch: { growthEase: 0.25 }, why: 'the steep window eases off half as much' },
  { label: 'plateauStart 23->27', patch: { plateauStart: 27 }, why: 'the taper into the plateau runs four years longer' },
  { label: 'plateauRate .0009->.0031', patch: { plateauRate: 0.0031 }, why: 'the peak CLIMBS instead of maintaining (x3.4)' },
  { label: 'peakRate x1.5', patch: { peakRate: 0.0093 }, why: 'the control: steeper EVERYWHERE, not later' },
  { label: 'declineStart 29->32', patch: { declineStart: 32 }, why: 'the career ends three years later' },
  {
    label: 'LATE SHAPE (3 dials)',
    patch: { growthEnd: 21, plateauStart: 27, plateauRate: 0.0031 },
    why: 'everything that pushes growth later, together',
  },
]

/** Patch the live age curve, run, and put it back whatever happens. Keys are set INDIVIDUALLY rather
 *  than by replacing the object, because `ageFactor` and `declineFactor` read
 *  `ECONOMY.development.ageCurve` fresh on every call and a replaced object would leave any captured
 *  reference pointing at the old one. */
function withCurve<T>(patch: Record<string, number>, fn: () => T): T {
  const c = ECONOMY.development.ageCurve as unknown as Record<string, number>
  const saved: Record<string, number> = {}
  for (const k of Object.keys(patch)) {
    saved[k] = c[k]
    c[k] = patch[k]
  }
  try {
    return fn()
  } finally {
    for (const k of Object.keys(saved)) c[k] = saved[k]
  }
}

/** The shipped curve, captured ONCE at module load so the exit guard compares against the real
 *  thing rather than against whatever a leaking arm left behind. */
const SHIPPED_CURVE: Record<string, number> = { ...(ECONOMY.development.ageCurve as unknown as Record<string, number>) }

// -------------------------------------------------------------------------------------------------
// small helpers
// -------------------------------------------------------------------------------------------------
function pctl(xs: readonly number[], q: number): number {
  if (xs.length === 0) return NaN
  const s = [...xs].sort((a, b) => a - b)
  return s[Math.min(s.length - 1, Math.max(0, Math.floor(q * s.length)))]
}
function mean(xs: readonly number[]): number {
  return xs.length === 0 ? NaN : xs.reduce((a, b) => a + b, 0) / xs.length
}
function pad(s: string | number, w: number): string {
  return String(s).padStart(w)
}
function padEnd(s: string | number, w: number): string {
  return String(s).padEnd(w)
}
function f1(x: number): string {
  return Number.isFinite(x) ? x.toFixed(1) : '   –'
}
function f2(x: number): string {
  return Number.isFinite(x) ? x.toFixed(2) : '   –'
}
function pct(x: number): string {
  return Number.isFinite(x) ? `${(100 * x).toFixed(1)}%` : '   –'
}
function money(cents: number): string {
  const sign = cents < 0 ? '-' : ''
  return `${sign}$${Math.abs(Math.round(cents / 100)).toLocaleString('en-US')}`
}
function rule(n = 110): string {
  return '='.repeat(n)
}
function meanFive(s: KidSkills): number {
  return SKILL_KEYS.reduce((a, k) => a + s[k], 0) / SKILL_KEYS.length
}
/** Mean-of-five REMAINING headroom, which is the quantity `growWeek` multiplies the rate by. */
function headroomOf(skills: KidSkills, potential: KidSkills): number {
  return SKILL_KEYS.reduce((a, k) => a + Math.max(0, potential[k] - skills[k]), 0) / SKILL_KEYS.length
}

// =================================================================================================
// THE CAREER TRACE – one full career through the real engine, bucketed by integer age
// =================================================================================================

interface AgeBucket {
  weeks: number
  /** net mean-of-five skill moved during this year of her life (negative past declineStart) */
  gained: number
  /** mean over the year's weeks of the mean-of-five remaining headroom */
  headroom: number
  /** mean over the year's weeks of ageFactor(exact age) – the DIAL's own value on her path */
  ageF: number
  /** share of her lifetime headroom realised at the END of this year */
  realised: number
  /** mean-of-five skill at the END of this year */
  skill: number
  /** best (lowest) professional rank seen during this year, once she has been paid */
  bestWta: number | null
  /** prize money booked during this year */
  prizeCents: number
  /** the strongest rung she had ever reached by the end of this year */
  bestRung: TierId | null
}

interface Trace {
  byAge: Map<number, AgeBucket>
  /** the age at which her mean-of-five skill was highest */
  peakSkillAge: number
  peakSkill: number
  /** the age at which her professional rank was best, and the rank */
  peakRankAge: number | null
  peakRank: number | null
  /** the age of her best earning year */
  peakPrizeAge: number | null
  /** her lifetime headroom, mean-of-five: what she had to climb from the build the game starts her on */
  lifetimeHeadroom: number
}

/** ⚠ THE DENOMINATOR IS THE HEADROOM SHE STARTS THE GAME WITH, not the true roll. `rollPotential` is
 *  fed her BIRTH build while `createWorld` hands her the HEAD-STARTED one, so a January girl begins
 *  the game already ~1.1 points up every wing. "Share of lifetime headroom realised" is a statement
 *  about the climb the PLAYER is asked to make, so the distance from where week 1 puts her is the
 *  honest denominator. §7 prints both readings for a real save, because a save is the one place the
 *  two are ever confused. */
function runTrace(preset: Preset, index: number, policy: Policy, weeks = FULL_CAREER_WEEKS): Trace {
  const { world, rng } = openCareer(preset, index, policy)
  const start: KidSkills = { ...world.skills }
  const potential: KidSkills = { ...world.potential }
  const lifetime = headroomOf(start, potential)
  const byAge = new Map<number, AgeBucket>()
  const bucket = (age: number): AgeBucket => {
    let b = byAge.get(age)
    if (!b) {
      b = { weeks: 0, gained: 0, headroom: 0, ageF: 0, realised: 0, skill: 0, bestWta: null, prizeCents: 0, bestRung: null }
      byAge.set(age, b)
    }
    return b
  }

  let peakSkill = meanFive(world.skills)
  let peakSkillAge = START_AGE
  let peakRank: number | null = null
  let peakRankAge: number | null = null
  let prevPrize = world.careerTotals.prizeCents

  for (let i = 0; i < weeks && world.ending === null; i++) {
    // The endings bench's own `sweepGrace` trick: a career that dies of money at seventeen measures
    // the family's bank balance, not the age curve. Every arm gets the same defusal.
    world.debtSinceWeek = null
    const before = meanFive(world.skills)
    const headBefore = headroomOf(world.skills, potential)
    const exactAge = kidAgeExact(world.week, world.profile.birthMonth)
    const af = ageFactor(exactAge)

    stepCareerWeek(world, rng, policy)
    if (world.fork !== null && world.fork.answer === null) answerFork(world, 'continue')
    // `plays-on`: one more year to everything until the game stops asking. An arm measuring a GROWTH
    // curve has to, or half the careers stop before the curve does.
    if (world.retirementOffer !== null) answerRetirement(world, world.retirementOffer.final)

    const age = Math.floor(exactAge)
    const b = bucket(age)
    b.weeks++
    b.gained += meanFive(world.skills) - before
    b.headroom += headBefore
    b.ageF += af
    b.skill = meanFive(world.skills)
    b.realised = lifetime > 0 ? (b.skill - meanFive(start)) / lifetime : 1
    b.prizeCents += world.careerTotals.prizeCents - prevPrize
    prevPrize = world.careerTotals.prizeCents
    for (const t of TIER_LADDER) if (world.bestFinishByTier[t] !== undefined) b.bestRung = t

    const m = meanFive(world.skills)
    if (m > peakSkill) {
      peakSkill = m
      peakSkillAge = exactAge
    }
    // Guarded on having been PAID – money-decomposition's rule against the point-less dense-rank-1 tie.
    if (world.careerTotals.prizeCents > 0) {
      const wta = world.kidRankWta ?? world.cohort.length + 1
      if (b.bestWta === null || wta < b.bestWta) b.bestWta = wta
      if (peakRank === null || wta < peakRank) {
        peakRank = wta
        peakRankAge = exactAge
      }
    }
  }

  for (const b of byAge.values()) {
    if (b.weeks > 0) {
      b.headroom /= b.weeks
      b.ageF /= b.weeks
    }
  }
  let peakPrizeAge: number | null = null
  let bestPrize = 0
  for (const [age, b] of byAge) if (b.prizeCents > bestPrize) ((bestPrize = b.prizeCents), (peakPrizeAge = age))

  return { byAge, peakSkillAge, peakSkill, peakRankAge, peakRank, peakPrizeAge, lifetimeHeadroom: lifetime }
}

/** Every cell x seed, once. The single most expensive thing this tool does, so §1a, §2, §3 and §4 all
 *  read the SAME traces rather than each paying for their own careers. */
function traceCell(preset: Preset, seeds: number, weeks = FULL_CAREER_WEEKS): Trace[] {
  return Array.from({ length: seeds }, (_, i) => runTrace(preset, i, POLICIES[1], weeks))
}

const TRACE_CACHE = new Map<string, Trace[]>()
function tracesFor(cell: { label: string; preset: Preset }): Trace[] {
  const key = cell.label
  let t = TRACE_CACHE.get(key)
  if (!t) {
    t = traceCell(cell.preset, SEEDS)
    TRACE_CACHE.set(key, t)
  }
  return t
}

/** Mean over seeds of one bucket field, at one age. Seeds whose career ended before that age
 *  contribute nothing – which is why `weeks` is reported beside every row that could be thinned. */
function atAge(traces: Trace[], age: number, get: (b: AgeBucket) => number): number {
  const xs = traces.map((t) => t.byAge.get(age)).filter((b): b is AgeBucket => b !== undefined && b.weeks > 0).map(get)
  return mean(xs)
}
function seedsAtAge(traces: Trace[], age: number): number {
  return traces.filter((t) => (t.byAge.get(age)?.weeks ?? 0) > 0).length
}

// =================================================================================================
// §1  THE DECOMPOSITION – AGE RATE versus ASYMPTOTE. The crux, and the answer to the brief.
// =================================================================================================

/** ⚠ THE GROWTH-ONLY PROBE, and it exists so §1b can freeze ONE factor at a time. The real engine
 *  cannot freeze headroom – nothing in `growWeek` takes such an argument, and adding one would be a
 *  shipped change. So the probe calls the SHIPPED `growWeek` in a loop and freezes a factor by what
 *  it PASSES:
 *
 *    the age rate  ->  hand it `ageYears: 14` every week, so `ageFactor` returns its age-14 value.
 *    the asymptote ->  hand it `potential: skills + H0` every week, so `headroom` is pinned at H0.
 *
 *  No engine code is touched by either. The probe drops the calendar (no tournaments, no injuries,
 *  no money), which is the point: it is the growth arithmetic ALONE, and §1a covers the live path. */
interface ProbeArm {
  label: string
  freezeAge: boolean
  freezeHeadroom: boolean
}
const PROBE_ARMS: ProbeArm[] = [
  { label: 'BOTH LIVE (the model)', freezeAge: false, freezeHeadroom: false },
  { label: 'AGE RATE FROZEN at 14', freezeAge: true, freezeHeadroom: false },
  { label: 'ASYMPTOTE OFF (headroom pinned)', freezeAge: false, freezeHeadroom: true },
  { label: 'BOTH FROZEN', freezeAge: true, freezeHeadroom: true },
]

interface ProbeRow {
  age: number
  /** mean-of-five points gained in that year */
  gained: number
  headroom: number
  ageF: number
}

function growthProbe(preset: Preset, seedIndex: number, arm: ProbeArm, matchesPerWeek = 1): ProbeRow[] {
  const seed = `growth-probe-${preset.background}-${seedIndex}`
  const profile: PlayerProfile = { ...DEFAULT_PROFILE, background: preset.background, coachTier: preset.coachTier }
  const birth = startingSkills(seed, profile)
  const skills: KidSkills = withHeadStart(birth, profile.birthMonth)
  const truePotential = rollPotential(seed, birth)
  const H0: KidSkills = {} as KidSkills
  for (const k of SKILL_KEYS) H0[k] = Math.max(0, truePotential[k] - skills[k])
  const coach: Coach | null = preset.coachTier === 'self' ? null : bestFitCoachAt(seed, START_AGE, preset.coachTier, profile.playStyle)
  const plan = WEEK_PLAN_PRESETS.balanced

  const out: ProbeRow[] = []
  let cur: KidSkills = { ...skills }
  for (const age of AGES) {
    let gained = 0
    let headSum = 0
    let afSum = 0
    for (let w = 0; w < WEEKS_PER_YEAR; w++) {
      const exactAge = age + w / WEEKS_PER_YEAR
      const potThisWeek: KidSkills = arm.freezeHeadroom ? ({} as KidSkills) : truePotential
      if (arm.freezeHeadroom) for (const k of SKILL_KEYS) potThisWeek[k] = cur[k] + H0[k]
      headSum += headroomOf(cur, potThisWeek)
      afSum += ageFactor(arm.freezeAge ? START_AGE : exactAge)
      const before = meanFive(cur)
      cur = growWeek({
        skills: cur,
        potential: potThisWeek,
        ageYears: arm.freezeAge ? START_AGE : exactAge,
        plan,
        coach,
        playStyle: profile.playStyle,
        matchesThisWeek: matchesPerWeek,
        seed,
        week: (age - START_AGE) * WEEKS_PER_YEAR + w,
      })
      gained += meanFive(cur) - before
    }
    out.push({ age, gained, headroom: headSum / WEEKS_PER_YEAR, ageF: afSum / WEEKS_PER_YEAR })
  }
  return out
}

/** The log-share attribution. All three ratios are below 1 on a fading curve, so every log is
 *  negative and the shares are a partition of the fade. Returned as percentages of the TOTAL. */
function logShares(ageRatio: number, headRatio: number, totalRatio: number): { age: number; head: number; other: number } {
  const la = Math.log(ageRatio)
  const lh = Math.log(headRatio)
  const lt = Math.log(totalRatio)
  if (!Number.isFinite(lt) || lt === 0) return { age: NaN, head: NaN, other: NaN }
  return { age: (100 * la) / lt, head: (100 * lh) / lt, other: (100 * (lt - la - lh)) / lt }
}

function section1(): void {
  console.log(`\n${rule()}`)
  console.log('§1  THE DECOMPOSITION – THE AGE RATE versus THE ASYMPTOTE. Which one actually stops her?')
  console.log(rule())
  console.log(`
  growWeek:  gain = ageFactor(age) x K x headroom x luck x aim,  K = trainFactor x coach x matchBonus
                      \\_ THE AGE RATE _/       \\_ THE ASYMPTOTE _/

  The gain is a PRODUCT, so the fade decomposes exactly and in logs it is additive. Everything below
  is indexed to age ${START_AGE}: "a week at this age is worth X% of a week at fourteen".
`)

  // --- (a) THE EXACT SPLIT, ON THE LIVE TRAJECTORY -------------------------------------------
  console.log(`  (a) THE EXACT SPLIT, on the real engine's own trajectory – ${SEEDS} careers a cell, "player" policy.\n`)
  console.log(`      The three columns MULTIPLY to the fourth, by construction. "other" is K (match bonus, coach`)
  console.log(`      churn, the summer block) and it is printed so nothing hides in a residual.\n`)
  for (const cell of CELLS) {
    const traces = tracesFor(cell)
    const base = {
      gain: atAge(traces, START_AGE, (b) => b.gained),
      head: atAge(traces, START_AGE, (b) => b.headroom),
      ageF: atAge(traces, START_AGE, (b) => b.ageF),
    }
    console.log(`  ${cell.label}   (headroom at 14: ${f1(base.head)} pts mean-of-five, a week gains ${f2(base.gain / WEEKS_PER_YEAR)} pts)\n`)
    console.log(
      `    ${padEnd('age', 6)}${pad('AGE RATE', 14)}${pad('ASYMPTOTE', 14)}${pad('other (K)', 12)}${pad('= a week is', 16)}` +
        `${pad('fade owed to', 15)}${pad('fade owed to', 16)}${pad('seeds', 7)}`,
    )
    console.log(
      `    ${padEnd('', 6)}${pad('ageF/ageF14', 14)}${pad('head/head14', 14)}${pad('residual', 12)}${pad('worth (vs 14)', 16)}` +
        `${pad('THE AGE RATE', 15)}${pad('THE ASYMPTOTE', 16)}${pad('', 7)}`,
    )
    for (const age of AGES) {
      if (age > 28) continue // past declineStart the gain is negative and a ratio means nothing
      const g = atAge(traces, age, (b) => b.gained)
      const h = atAge(traces, age, (b) => b.headroom)
      const a = atAge(traces, age, (b) => b.ageF)
      const rg = g / base.gain
      const rh = h / base.head
      const ra = a / base.ageF
      const s = logShares(ra, rh, rg)
      console.log(
        `    ${padEnd(age, 6)}${pad(`x${f2(ra)}`, 14)}${pad(`x${f2(rh)}`, 14)}${pad(`x${f2(rg / (ra * rh))}`, 12)}` +
          `${pad(`${(100 * rg).toFixed(1)}%`, 16)}${pad(Number.isFinite(s.age) ? `${s.age.toFixed(0)}%` : '–', 15)}` +
          `${pad(Number.isFinite(s.head) ? `${s.head.toFixed(0)}%` : '–', 16)}${pad(seedsAtAge(traces, age), 7)}`,
      )
    }
    console.log('')
  }

  // --- (b) HOLD ONE FIXED AND VARY THE OTHER --------------------------------------------------
  console.log(`\n  (b) HOLD ONE FIXED AND VARY THE OTHER – the growth arithmetic alone, no calendar.\n`)
  console.log(`      Each arm calls the SHIPPED growWeek and freezes a factor by what it PASSES (ageYears: 14,`)
  console.log(`      or potential re-pinned to skills+H0 every week). No engine code is touched by either.\n`)
  const PROBE_SEEDS = 200
  for (const cell of CELLS) {
    console.log(`  ${cell.label}\n`)
    console.log(`    ${padEnd('arm', 34)}${AGES.filter((a) => a <= 28).map((a) => pad(a, 7)).join('')}`)
    for (const arm of PROBE_ARMS) {
      const rows: ProbeRow[][] = Array.from({ length: PROBE_SEEDS }, (_, i) => growthProbe(cell.preset, i, arm))
      const g14 = mean(rows.map((r) => r[0].gained))
      const cells = AGES.filter((a) => a <= 28).map((age) => {
        const idx = AGES.indexOf(age)
        const g = mean(rows.map((r) => r[idx].gained))
        return pad(`${(100 * (g / g14)).toFixed(0)}%`, 7)
      })
      console.log(`    ${padEnd(arm.label, 34)}${cells.join('')}`)
    }
    console.log('')
  }
  console.log(`    HOW TO READ IT. "ASYMPTOTE OFF" is the fade the AGE RATE causes on its own; "AGE RATE FROZEN"`)
  console.log(`    is the fade the ASYMPTOTE causes on its own. ⚠ THE TWO INTERACT, so these are not a partition:`)
  console.log(`    a frozen-high age rate eats the headroom FASTER, which is why the frozen-age arm fades harder`)
  console.log(`    than the asymptote's share in (a). (a) is the unbiased split; (b) is the mechanism.`)

  // --- (c) THE DIAL EATS ITSELF ----------------------------------------------------------------
  console.log(`\n\n  (c) ⚠ THE DIAL EATS ITSELF – what a LATER growthEnd actually buys, after the asymptote answers.\n`)
  console.log(`      A later growthEnd raises the rate at 17. It also raises the rate at 14, 15 and 16 – so she`)
  console.log(`      arrives at 17 with LESS headroom left, and the gain is the product of the two.\n`)
  const probeCells = [CELLS[0], CELLS[3]]
  for (const cell of probeCells) {
    console.log(`  ${cell.label}\n`)
    console.log(
      `    ${padEnd('variant', 26)}${['17', '20', '23'].map((a) => pad(`age ${a}`, 30)).join('')}`,
    )
    console.log(
      `    ${padEnd('', 26)}${['17', '20', '23'].map(() => `${pad('rate', 9)}${pad('headroom', 10)}${pad('a week', 11)}`).join('')}`,
    )
    // ONCE per cell, not once per variant: the baseline arm is the same 200 careers every time.
    const baseRows: ProbeRow[][] = Array.from({ length: PROBE_SEEDS }, (_, i) => growthProbe(cell.preset, i, PROBE_ARMS[0]))
    for (const v of VARIANTS) {
      const rows: ProbeRow[][] = withCurve(v.patch, () =>
        Array.from({ length: PROBE_SEEDS }, (_, i) => growthProbe(cell.preset, i, PROBE_ARMS[0])),
      )
      const cellsOut = [17, 20, 23].map((age) => {
        const idx = AGES.indexOf(age)
        const a = mean(rows.map((r) => r[idx].ageF)) / mean(baseRows.map((r) => r[idx].ageF))
        const h = mean(rows.map((r) => r[idx].headroom)) / mean(baseRows.map((r) => r[idx].headroom))
        const g = mean(rows.map((r) => r[idx].gained)) / mean(baseRows.map((r) => r[idx].gained))
        return `${pad(`x${f2(a)}`, 9)}${pad(`x${f2(h)}`, 10)}${pad(`x${f2(g)}`, 11)}`
      })
      console.log(`    ${padEnd(v.label, 26)}${cellsOut.join('')}`)
    }
    console.log('')
  }
  console.log(`    Every number is a RATIO TO BASELINE at the same age. A variant whose "rate" column is x1.25 and`)
  console.log(`    whose "a week" column is x1.15 has had a quarter of its lift eaten by the asymptote before it`)
  console.log(`    reached the player. Read the age-23 block for what a plateau dial is worth on an empty tank.`)
}

// =================================================================================================
// §2  THE REALISATION CURVE
// =================================================================================================

function section2(): void {
  console.log(`\n${rule()}`)
  console.log('§2  THE REALISATION CURVE – share of LIFETIME HEADROOM realised by each age. Deciles, not means.')
  console.log(rule())
  console.log(`
  LIFETIME HEADROOM = mean over her five skills of (ceiling - the build week 1 hands her). "Realised"
  is how much of that climb is behind her. ⚠ It can FALL past 29: declineFactor takes physical points
  back, and a curve that only ever rises would be hiding the end of the career.

  ${SEEDS} careers a cell, "player" policy, bankruptcy defused, every retirement offer refused.
`)
  for (const cell of CELLS) {
    const traces = tracesFor(cell)
    console.log(`  ${cell.label}   (lifetime headroom: median ${f1(pctl(traces.map((t) => t.lifetimeHeadroom), 0.5))} pts mean-of-five)\n`)
    console.log(`    ${padEnd('age', 6)}${['p10', 'p25', 'p50', 'p75', 'p90'].map((q) => pad(q, 9)).join('')}${pad('mean', 9)}${pad('pts gained', 12)}${pad('seeds', 7)}`)
    for (const age of AGES) {
      const xs = traces.map((t) => t.byAge.get(age)).filter((b): b is AgeBucket => b !== undefined && b.weeks > 0).map((b) => b.realised)
      if (xs.length === 0) continue
      const gained = atAge(traces, age, (b) => b.gained)
      console.log(
        `    ${padEnd(age, 6)}${[0.1, 0.25, 0.5, 0.75, 0.9].map((q) => pad(pct(pctl(xs, q)), 9)).join('')}` +
          `${pad(pct(mean(xs)), 9)}${pad(`${gained >= 0 ? '+' : ''}${f2(gained)}`, 12)}${pad(xs.length, 7)}`,
      )
    }
    console.log('')
  }
}

// =================================================================================================
// §3  WHEN DOES A WEEK STOP BEING PERCEPTIBLE?
// =================================================================================================

function section3(): void {
  console.log(`\n${rule()}`)
  console.log("§3  WHEN DOES A WEEK STOP BEING PERCEPTIBLE? – against the RADAR'S OWN floors, not an invented one")
  console.log(rule())
  console.log(`
  ⚠ THE GAME ALREADY OWNS A NUMBER FOR THIS, so nothing here is invented. engine/radar.ts:

    CEILING_FLOOR_HALF = ${CEILING_FLOOR_HALF}   the outer haze never narrows past it – the tightest the ceiling
                            is ever known to is an ${2 * CEILING_FLOOR_HALF}-point window.
    TRAINING_FOG_FLOOR = ${TRAINING_FOG_FLOOR}   "the narrowest fog movement is ever measured against ... at three
                            points the tightest a notch ever gets is three points of real improvement,
                            which is a thing a person can actually see happen to a tennis player."
    TRAINING_STEP      = ${TRAINING_STEP}   one notch = one fog width of CUMULATIVE movement.

  So the honest question is not "does she gain anything" – she always gains something – but HOW LONG
  UNTIL THE NEXT NOTCH. Below: points gained in that season, and the years to move ${TRAINING_FOG_FLOOR} more points at
  that season's pace. A career is 24 seasons long; anything over ~5 years is never.
`)
  for (const cell of CELLS) {
    const traces = tracesFor(cell)
    console.log(`  ${cell.label}\n`)
    console.log(
      `    ${padEnd('age', 6)}${pad('pts/season', 12)}${pad('pts/week', 11)}${pad(`yrs to +${TRAINING_FOG_FLOOR}`, 12)}` +
        `${pad(`yrs to +${CEILING_FLOOR_HALF}`, 12)}${pad('verdict', 22)}${pad('one wing, aimed x5', 22)}`,
    )
    for (const age of AGES) {
      if (seedsAtAge(traces, age) === 0) continue
      const g = atAge(traces, age, (b) => b.gained)
      const yrsFog = g > 0 ? TRAINING_FOG_FLOOR / g : Infinity
      const yrsCeil = g > 0 ? CEILING_FLOOR_HALF / g : Infinity
      // `aimWeights` renormalises to sum SKILL_KEYS.length, so a week of nothing but one single-target
      // session kind puts the whole vector on one wing: aim = 5. That is the FASTEST a wing can move.
      const aimed = g * SKILL_KEYS.length
      const verdict =
        g <= 0 ? 'DECLINING' : yrsFog <= 1 ? 'plainly visible' : yrsFog <= 2.5 ? 'visible in a season' : yrsFog <= 5 ? 'barely, over years' : 'INVISIBLE'
      console.log(
        `    ${padEnd(age, 6)}${pad(`${g >= 0 ? '+' : ''}${f2(g)}`, 12)}${pad((g / WEEKS_PER_YEAR).toFixed(3), 11)}` +
          `${pad(Number.isFinite(yrsFog) ? f1(yrsFog) : 'never', 12)}${pad(Number.isFinite(yrsCeil) ? f1(yrsCeil) : 'never', 12)}` +
          `${pad(verdict, 22)}${pad(`${aimed >= 0 ? '+' : ''}${f1(aimed)} pts/season`, 22)}`,
      )
    }
    console.log('')
  }
  console.log(`  ⚠ THE LAST COLUMN IS THE ONE THAT IS NOT ABOUT AGE AT ALL. \`aimWeights\` renormalises to sum 5, so a`)
  console.log(`    season pointed entirely at one wing moves it five times as fast as an ordinary week moves the`)
  console.log(`    average. The training dials are a perceptibility lever the age curve is not.`)
}

// =================================================================================================
// §4  THE PEAK – by SKILLS, and separately by RESULTS
// =================================================================================================

function section4(): void {
  console.log(`\n${rule()}`)
  console.log("§4  THE PEAK, TWICE – development.ts's own header says 'peak 23-28'. Does the model do that?")
  console.log(rule())
  console.log(`
  ⚠ SKILLS AND RESULTS ARE TWO DIFFERENT PEAKS AND THEY NEED NOT COINCIDE, because the field moves
  too: driftCohort walks 199 juniors up their own curves and the professional table is a POINTS arc.
  Being at your best and being at your best RELATIVE TO THE ROOM are separate facts about a career.
`)
  console.log(
    `  ${padEnd('cell', 30)}${pad('peak SKILL age', 16)}${pad('peak skill', 12)}${pad('peak RANK age', 15)}` +
      `${pad('peak rank', 11)}${pad('peak PRIZE age', 16)}${pad('paid', 7)}`,
  )
  for (const cell of CELLS) {
    const traces = tracesFor(cell)
    const rankAges = traces.map((t) => t.peakRankAge).filter((x): x is number => x !== null)
    const ranks = traces.map((t) => t.peakRank).filter((x): x is number => x !== null)
    const prizeAges = traces.map((t) => t.peakPrizeAge).filter((x): x is number => x !== null)
    console.log(
      `  ${padEnd(cell.label, 30)}${pad(f1(pctl(traces.map((t) => t.peakSkillAge), 0.5)), 16)}` +
        `${pad(f1(pctl(traces.map((t) => t.peakSkill), 0.5)), 12)}` +
        `${pad(rankAges.length ? f1(pctl(rankAges, 0.5)) : '–', 15)}` +
        `${pad(ranks.length ? `#${pctl(ranks, 0.5).toFixed(0)}` : '–', 11)}` +
        `${pad(prizeAges.length ? f1(pctl(prizeAges, 0.5)) : '–', 16)}` +
        `${pad(`${ranks.length}/${traces.length}`, 7)}`,
    )
  }
  console.log(`\n  (medians over ${SEEDS} seeds. "peak rank age" is the age at her best professional rank, once paid.)`)

  console.log(`\n  THE SHAPE OF THE RESULTS CURVE – best professional rank and prize money, by age of her life:\n`)
  for (const cell of CELLS) {
    const traces = tracesFor(cell)
    console.log(`  ${cell.label}\n`)
    console.log(`    ${padEnd('age', 6)}${pad('median best rank', 18)}${pad('mean prize', 14)}${pad('best rung reached', 20)}${pad('mean skill', 12)}${pad('seeds', 7)}`)
    for (const age of AGES) {
      const n = seedsAtAge(traces, age)
      if (n === 0) continue
      const ranks = traces
        .map((t) => t.byAge.get(age)?.bestWta)
        .filter((x): x is number => x !== null && x !== undefined)
      const rungs = traces.map((t) => t.byAge.get(age)?.bestRung).filter((x): x is TierId => !!x)
      let topRung: TierId | null = null
      for (const t of TIER_LADDER) if (rungs.includes(t)) topRung = t
      console.log(
        `    ${padEnd(age, 6)}${pad(ranks.length ? `#${pctl(ranks, 0.5).toFixed(0)}` : '–', 18)}` +
          `${pad(money(atAge(traces, age, (b) => b.prizeCents)), 14)}${pad(topRung ?? '–', 20)}` +
          `${pad(f1(atAge(traces, age, (b) => b.skill)), 12)}${pad(n, 7)}`,
      )
    }
    console.log('')
  }
}

// =================================================================================================
// §5  THE VARIANTS
// =================================================================================================

interface VariantRow {
  realised18: number
  realised21: number
  realised25: number
  gained18to25: number
  peakSkill: number
  peakSkillAge: number
  peakRank: number | null
  paid: number
  /** the first age from which a whole SEASON no longer buys a fifth of a notch – i.e. §3's own
   *  "INVISIBLE" band, more than five years to the next TRAINING_FOG_FLOOR of movement */
  invisibleAt: number | null
}

/** §3's INVISIBLE threshold, restated as points per season so §5 can use the same yardstick:
 *  a season under this takes more than five years to earn one fog width. */
const INVISIBLE_PTS_PER_SEASON = TRAINING_FOG_FLOOR / 5

function variantRow(preset: Preset, seeds: number): VariantRow {
  const traces = traceCell(preset, seeds)
  const realisedAt = (age: number): number => atAge(traces, age, (b) => b.realised)
  let gained = 0
  for (let a = 18; a < 25; a++) gained += atAge(traces, a, (b) => b.gained) || 0
  let invisibleAt: number | null = null
  for (const age of AGES) {
    if (seedsAtAge(traces, age) === 0) continue
    if (atAge(traces, age, (b) => b.gained) < INVISIBLE_PTS_PER_SEASON) {
      invisibleAt = age
      break
    }
  }
  const ranks = traces.map((t) => t.peakRank).filter((x): x is number => x !== null)
  return {
    realised18: realisedAt(18),
    realised21: realisedAt(21),
    realised25: realisedAt(25),
    gained18to25: gained,
    peakSkill: mean(traces.map((t) => t.peakSkill)),
    peakSkillAge: pctl(traces.map((t) => t.peakSkillAge), 0.5),
    peakRank: ranks.length ? pctl(ranks, 0.5) : null,
    paid: ranks.length,
    invisibleAt,
  }
}

function section5(): void {
  console.log(`\n${rule()}`)
  console.log('§5  THE VARIANTS – what each age-curve dial actually buys. ⚠ §1 decides whether this table matters.')
  console.log(rule())
  console.log(`\n  ${SEEDS} careers a cell, identical seeds across arms, full careers 14->38.\n`)
  for (const v of VARIANTS) console.log(`    ${padEnd(v.label, 26)} ${v.why}`)
  for (const cell of [CELLS[0], CELLS[2]]) {
    console.log(`\n  ${cell.label}\n`)
    console.log(
      `  ${padEnd('variant', 26)}${pad('realised@18', 13)}${pad('@21', 9)}${pad('@25', 9)}${pad('pts 18->25', 13)}` +
        `${pad('peak skill', 17)}${pad('peak age', 10)}${pad('median rank', 13)}${pad('invisible from', 16)}`,
    )
    let baseSkill = NaN
    for (const v of VARIANTS) {
      const r = withCurve(v.patch, () => variantRow(cell.preset, SEEDS))
      if (Number.isNaN(baseSkill)) baseSkill = r.peakSkill
      console.log(
        `  ${padEnd(v.label, 26)}${pad(pct(r.realised18), 13)}${pad(pct(r.realised21), 9)}${pad(pct(r.realised25), 9)}` +
          `${pad(`+${f2(r.gained18to25)}`, 13)}${pad(`${f2(r.peakSkill)} (${r.peakSkill - baseSkill >= 0 ? '+' : ''}${f2(r.peakSkill - baseSkill)})`, 17)}` +
          `${pad(f1(r.peakSkillAge), 10)}${pad(r.peakRank !== null ? `#${r.peakRank.toFixed(0)}` : '–', 13)}` +
          `${pad(r.invisibleAt !== null ? `age ${r.invisibleAt}` : 'never', 16)}`,
      )
    }
  }
  console.log(`\n  "invisible from" = the first age whose WHOLE SEASON moves her less than ${f1(INVISIBLE_PTS_PER_SEASON)} points – §3's own`)
  console.log(`  INVISIBLE band, i.e. over five years of training to earn one TRAINING_FOG_FLOOR (${TRAINING_FOG_FLOOR}) of movement.`)
  console.log(`\n  ⚠ READ THE realised@18 COLUMN AGAINST THE COMPLAINT. Every dial that raises the RATE (growthEnd,`)
  console.log(`  growthEase, peakRate) raises what is already DONE by eighteen – it finishes her SOONER, which is`)
  console.log(`  the opposite of "leave something to play for". Only plateauStart and plateauRate leave @18 alone.`)
}

// =================================================================================================
// §6  WHAT BREAKS
// =================================================================================================

interface Guard {
  file: string
  what: string
  window: [number, number]
  anchor: number
  run: () => number
}

function guards(): Guard[] {
  const working = PRESETS.find((p) => p.background === 'working' && p.coachTier === 'self')!
  const middleSelf = PRESETS.find((p) => p.background === 'middle' && p.coachTier === 'self')!
  return [
    {
      file: 'tests/econ-reach.test.ts',
      what: '14->18 pro proxy (middle·self, top-50 once ranked), of 30',
      window: [7, 21],
      anchor: 13,
      run: () => Array.from({ length: 30 }, (_, i) => benchRunCareer(middleSelf, i, 208).reachedWeek).filter((r) => r !== null).length,
    },
    {
      file: 'tests/econ-reach.test.ts',
      what: '14->16 domestic door (working·self, 250 pts), of 30',
      window: [4, 20],
      anchor: 11,
      run: () => Array.from({ length: 30 }, (_, i) => benchRunCareer(working, i, 104).reachedWeek).filter((r) => r !== null).length,
    },
  ]
}

function section6(): void {
  console.log(`\n${rule()}`)
  console.log('§6  WHAT BREAKS – the shipped guard windows, re-run under each variant. NOTHING IS RE-PINNED.')
  console.log(rule())
  for (const g of guards()) {
    console.log(`\n  ${g.file} · ${g.what}`)
    console.log(`  pinned window [${g.window[0]}, ${g.window[1]}], anchored at ${g.anchor}\n`)
    console.log(`  ${padEnd('variant', 26)}${pad('measured', 10)}${pad('vs anchor', 11)}   verdict`)
    for (const v of VARIANTS) {
      const n = withCurve(v.patch, g.run)
      const inWindow = n >= g.window[0] && n <= g.window[1]
      console.log(
        `  ${padEnd(v.label, 26)}${pad(n, 10)}${pad(`${n - g.anchor >= 0 ? '+' : ''}${n - g.anchor}`, 11)}   ` +
          `${inWindow ? 'inside the window' : '⚠ RED – outside the pinned window'}`,
      )
    }
  }

  // ⚠ THE ONE GUARD THAT IS A PROPERTY OF THE CURVE ITSELF rather than of a career, so it is re-run
  // here as arithmetic rather than as 30 simulations. tests/relative-age.test.ts pins the SIGN of the
  // relative-age catch-up at 14 and pins it to ZERO at 25 – "gone at the plateau, where age stops
  // mattering". A variant that is still sloping at 25 turns that assertion red.
  console.log(`\n\n  tests/relative-age.test.ts · the catch-up gap, as arithmetic over ageFactor alone`)
  console.log(`  pinned: rateGap(14) < 0 · |rateGap(14)| < 0.01 · rateGap(25) == 0 to 10 decimal places\n`)
  console.log(`  ${padEnd('variant', 26)}${pad('rateGap(14)', 14)}${pad('rateGap(25)', 14)}   verdict`)
  const RA_JAN = (6.5 - 1) / 12
  const RA_DEC = (6.5 - 12) / 12
  for (const v of VARIANTS) {
    const [g14, g25] = withCurve(v.patch, () => [
      ageFactor(14 + RA_JAN) - ageFactor(14 + RA_DEC),
      ageFactor(25 + RA_JAN) - ageFactor(25 + RA_DEC),
    ])
    const ok = g14 < 0 && Math.abs(g14) < 0.01 && Math.abs(g25) < 1e-10
    console.log(
      `  ${padEnd(v.label, 26)}${pad(g14.toExponential(2), 14)}${pad(g25.toExponential(2), 14)}   ` +
        `${ok ? 'inside' : '⚠ RED – rateGap(25) is no longer zero at the plateau'}`,
    )
  }

  console.log(`
  ⚠ AND THE ANCHORS THAT ARE NOT TESTS. Nothing goes red, but a variant makes each of them a lie
  until it is re-run:

    src/engine/development.ts        the file header's own calibration claim, "points ~17-18,
                                     top-100 ~4.5 yrs later, peak 23-28, decline ~29+", and
                                     ageFactor's docstring repeating it.                        §4
    src/engine/development.ts        SKILL_POINTS_PER_YEAR = 2.4, stated as MEASURED: "the skills
                                     run over 14->18 moved her mean attribute from 48.5 to
                                     57.0-58.6 ... i.e. ~2.4 points a year". Every variant that
                                     moves the 14->18 window moves the number that feeds the
                                     relative-age head start.                                    §2
    src/engine/economy.ts            each ageCurve key's own comment ("18-22: still climbing",
                                     "23-28: the peak. Maintenance, not growth.")               §1
    tools/skill-ceiling.ts §4        already carries growthEase / plateauStart / plateauRate /
                                     declineStart arms; shipping one makes its BASELINE the new
                                     row and its §1 analytic table stale.                        §5
    docs/specs/skill-model-audit-2026-08.md   §2's "~58% of headroom realised by eighteen" and
                                     §8's dial ranking are stated against the shipped curve.     §2
    docs/specs/potential-band-2026-08.md      its closing caveat quotes the same ~58%.           §2
    src/engine/coachLoad.ts / coach.ts        coachSeasonUplift quotes a season's gain to the
                                     player from ageFactor; a steeper curve re-prices every
                                     coach card in the game.                                     §5
`)
}

// =================================================================================================
// §7  A REAL CAREER, PLACED – optional, reads a personal save through the game's import door
// =================================================================================================

async function section7(paths: string[]): Promise<void> {
  console.log(`\n${rule()}`)
  console.log('§7  A REAL CAREER, PLACED ON THE CURVE – read locally, never committed')
  console.log(rule())
  console.log(`
  ⚠ TWO DENOMINATORS, AND THEY ARE NOT THE SAME NUMBER. Her ceiling is rolled off her BIRTH build,
  never the head-started one, so:
     TRUE roll     = potential - startingSkills(...)         what the dice gave her
     THE CLIMB     = potential - the build week 1 hands her  what the PLAYER is asked to do
  The realisation curve in §2 uses THE CLIMB, because that is the one a career can finish.
`)
  for (const path of paths) {
    const w = (await decodeExportFile(new Uint8Array(readFileSync(path)))) as WorldState
    const birth = startingSkills(w.seed, w.profile)
    const week1 = withHeadStart(birth, w.profile.birthMonth)
    const bump = relativeAgeHeadStart(w.profile.birthMonth)
    const age = kidAgeExact(w.week, w.profile.birthMonth)
    console.log(`\n  career at week ${w.week}, age ${f1(age)}, head start ${bump >= 0 ? '+' : ''}${f2(bump)}, coach rung ${w.coachId ? 'hired' : 'self'}\n`)
    console.log(
      `  ${padEnd('skill', 16)}${pad('week 1', 9)}${pad('now', 9)}${pad('ceiling', 10)}${pad('TRUE roll', 11)}` +
        `${pad('THE CLIMB', 11)}${pad('done', 9)}${pad('left', 9)}`,
    )
    let climbTotal = 0
    let doneTotal = 0
    for (const k of SKILL_KEYS) {
      const climb = w.potential[k] - week1[k]
      const done = w.skills[k] - week1[k]
      climbTotal += climb
      doneTotal += done
      console.log(
        `  ${padEnd(k, 16)}${pad(f1(week1[k]), 9)}${pad(f1(w.skills[k]), 9)}${pad(f1(w.potential[k]), 10)}` +
          `${pad(f1(w.potential[k] - birth[k]), 11)}${pad(f1(climb), 11)}${pad(pct(done / climb), 9)}${pad(f1(climb - done), 9)}`,
      )
    }
    console.log(
      `  ${padEnd('MEAN-OF-FIVE', 16)}${pad(f1(meanFive(week1)), 9)}${pad(f1(meanFive(w.skills)), 9)}${pad(f1(meanFive(w.potential)), 10)}` +
        `${pad('', 11)}${pad(f1(climbTotal / 5), 11)}${pad(pct(doneTotal / climbTotal), 9)}${pad(f1((climbTotal - doneTotal) / 5), 9)}`,
    )

    // Where she sits against the bench cells' own curve at her age.
    console.log(`\n  against the bench cells at age ${Math.floor(age)} (§2's realised column):\n`)
    for (const cell of CELLS) {
      const traces = tracesFor(cell)
      const xs = traces
        .map((t) => t.byAge.get(Math.floor(age)))
        .filter((b): b is AgeBucket => b !== undefined && b.weeks > 0)
        .map((b) => b.realised)
      if (xs.length === 0) continue
      console.log(
        `    ${padEnd(cell.label, 30)} p10 ${pad(pct(pctl(xs, 0.1)), 8)} p50 ${pad(pct(pctl(xs, 0.5)), 8)} p90 ${pad(pct(pctl(xs, 0.9)), 8)}` +
          `   hers ${pct(doneTotal / climbTotal)}`,
      )
    }

    // What is left, in the radar's own units.
    const leftMean = (climbTotal - doneTotal) / 5
    console.log(
      `\n  ⚠ WHAT IS LEFT, IN THE FOG'S OWN UNITS: ${f1(leftMean)} points mean-of-five against a TRAINING_FOG_FLOOR of` +
        ` ${TRAINING_FOG_FLOOR}\n     and a CEILING_FLOOR_HALF of ${CEILING_FLOOR_HALF}. Her whole remaining career is worth` +
        ` ${f1(leftMean / TRAINING_FOG_FLOOR)} notches on the average wing.`,
    )
    const worst = SKILL_KEYS.map((k) => ({ k, left: w.potential[k] - w.skills[k] })).sort((a, b) => a.left - b.left)[0]
    console.log(`     Her worst wing (${worst.k}) has ${f1(worst.left)} points left: ${f1(worst.left / TRAINING_FOG_FLOOR)} notches, forever.`)
  }
}

// -------------------------------------------------------------------------------------------------

async function main(): Promise<void> {
  const c = ECONOMY.development.ageCurve
  console.log(
    `\ngrowth-age-sweep · shipped curve: growthStart ${c.growthStart} · growthEnd ${c.growthEnd} · plateauStart ${c.plateauStart}` +
      ` · declineStart ${c.declineStart}\n                   peakRate ${c.peakRate} · growthEase ${c.growthEase} · plateauRate ${c.plateauRate}` +
      ` · declineRate ${c.declineRate} · declineAccel ${c.declineAccel}`,
  )
  console.log(`${SEEDS} career seeds a cell · ${CELLS.length} cells · ${VARIANTS.length} variants`)

  if (wants('1')) section1()
  if (wants('2')) section2()
  if (wants('3')) section3()
  if (wants('4')) section4()
  if (wants('5')) section5()
  if (wants('6')) section6()
  if (SAVES.length && wants('7')) await section7(SAVES)

  // ⚠ THE HARNESS'S OWN GUARD. Every arm restores what it patched in a `finally`; this proves it
  // rather than trusting it, because a sweep that leaks a constant into a later section publishes
  // numbers nobody can reproduce.
  const now = ECONOMY.development.ageCurve as unknown as Record<string, number>
  const drifted = Object.keys(SHIPPED_CURVE).filter((k) => now[k] !== SHIPPED_CURVE[k])
  console.log(
    `\n  age curve on exit: ${drifted.length === 0 ? 'restored, as shipped' : `⚠⚠ NOT RESTORED – ${drifted.join(', ')}`}`,
  )
  if (drifted.length > 0) process.exit(1)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
