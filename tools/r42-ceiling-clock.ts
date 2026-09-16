// ROUND 42 #38 – WHEN DOES SHE ARRIVE AT THE CEILING, AND DO TWO GIRLS ARRIVE AT DIFFERENT TIMES?
//
//   npx vite-node tools/r42-ceiling-clock.ts [--seeds N] [--weeks N] [--careers N] [--skip-real]
//
// THE OWNER, 15.09: «может быть разные девочки в разное время к потолку приходят всё-таки? колледж
// или нет, тренер или нет, хорошо тренировали или нет».
//
// Raised off round 42 #22, whose finding was that at the end of a career all five wings read the
// saturated register at once. The question this file answers is the measurable form of his:
//
//   HOW LONG does a girl take to reach 90% of each wing's ceiling, and HOW FAR APART are those times
//   across the routes a player actually chooses – coach tier, college against tour, plan quality,
//   the load she carries.
//
// THE CLOCK IS ITEM 22'S OWN NUMBER. `fill = skills[k] / potential[k] >= 0.90` is the `done` rung the
// coach eye already speaks on – the owner's own 0.90 – so the time measured here is the time until
// the screen says «that serve is as good as it is going to get». The second column is round 34 #2b's
// REALISATION, `(skills[k] - born[k]) / (potential[k] - born[k]) >= 0.90`: the share of the room she
// was born with that she has actually filled. They answer different questions and both are printed,
// because a wing born nearly full reads `done` on week one while having realised nothing.
//
// ⚠⚠ MEASUREMENT ONLY. This file imports the engine and counts. It writes NO engine number; §C
// mutates `ECONOMY` inside one arm and puts it back with the restored value asserted (CLAUDE.md
// invariant 5's «prove the arm», and the gotcha about a null arm whose reader is absent).
//
// ⚠ RNG DISCIPLINE (CLAUDE.md invariant 2). Nothing here touches MAIN. `growWeek` derives its own
// `<seed>:growth:<week>` sub-stream at the call site, exactly as the tick derives it; the only
// randomness this FILE owns is the lumpy-load arm's per-week match count, drawn off the
// purpose-scoped key `r42-ceiling-clock:load:<seed>:<week>`. No `Math.random`, no `new Date`.
//
// =================================================================================================
// WHY TWO WALKS, AND WHY NEITHER ALONE WOULD BE HONEST
// =================================================================================================
//
//   §A/§B – THE `growWeek` WALK. `growWeek` is the only thing in this engine that moves
//     `world.skills` (world/phaseGrowth.ts §3b-bis depends on that by name), and it is pure and
//     total. A walk that feeds it exactly what `world/phaseGrowth.ts` feeds it IS the engine's
//     growth – so every route lever is isolated, provable and cheap, and N can be large.
//
//   §D – THE REAL-CAREER CROSS-CHECK. `openCareer` + `stepCareerWeek` out of `tools/econ-bench.ts`,
//     the harness this house already walks careers with: real entries, real matches, real money,
//     real knocks, real injuries. Small N. Its only job is to say whether §A's arms land where real
//     careers land. A clean walk nobody checked against a career is a model, not a measurement.
//
// The predicted-vs-measured record is `docs/specs/time-to-the-ceiling-2026-09.md`, whose §0 was
// written and committed to before this file was run once.

import {
  growWeek,
  rollPotential,
  SKILL_KEYS,
  type KidSkills,
  type SkillKey,
} from '../src/engine/development'
import { startingSkills, withHeadStart } from '../src/engine/world/player'
import { coachFactor, type StyleFit } from '../src/engine/coach'
import { ECONOMY } from '../src/engine/economy'
import { ENDINGS } from '../src/engine/ending'
import { rngFromSeed } from '../src/engine/rng'
import { planFromWeek, sessionDays } from '../src/engine/plan'
import { kidAgeExact } from '../src/engine/world'
import { COLLEGE_TIERS } from '../src/engine/collegeOffer'
import { COLLEGE_TRIP_WEEKS } from '../src/engine/world/college'
import { WEEKS_IN_SEASON } from '../src/shared/dates'
import {
  DEFAULT_PROFILE,
  type CoachTier,
  type CollegeTier,
  type PlayerProfile,
  type SessionKind,
} from '../src/shared/protocol'
import { openCareer, stepCareerWeek, POLICIES, PRESETS } from './econ-bench'

const args = process.argv.slice(2)
const argOf = (name: string, fallback: number): number => {
  const i = args.indexOf(`--${name}`)
  return i >= 0 && args[i + 1] ? Number(args[i + 1]) : fallback
}
/** How many careers per arm. The clock is a per-wing quantile, so it wants an n in the hundreds. */
const SEEDS = argOf('seeds', 200)
/** 14 -> 35. Long enough to catch the slowest arrival AND the decline that can take a wing back
 *  below the line, which is its own answer to «does she stay at the ceiling». */
const WEEKS = argOf('weeks', 21 * WEEKS_IN_SEASON)
/** Careers per preset in §D – the real-engine cross-check, which is minutes rather than seconds. */
const REAL_CAREERS = argOf('careers', 6)
const REAL_WEEKS = argOf('realweeks', 12 * WEEKS_IN_SEASON)
const SKIP_REAL = args.includes('--skip-real')

const pad = (s: string | number, w: number) => String(s).padStart(w)
const padE = (s: string | number, w: number) => String(s).padEnd(w)
const WING: Record<SkillKey, string> = {
  serve: 'serve',
  ret: 'ret',
  composure: 'compos',
  stamina: 'stamina',
  groundstrokes: 'ground',
}

// =================================================================================================
// THE ROUTE – every lever the player actually pulls, and nothing else
// =================================================================================================

interface Route {
  id: string
  label: string
  group: string
  coachTier: CoachTier
  /** the read `coachFitFor` produces for her game – held explicitly so the arm is the arm */
  fit: StyleFit
  /** 4 / 5 / 6, which `planTrainPct` projects to train 60 / 75 / 85 */
  sessions: number
  /** what every session in the week is. `general` is the all-ones `aimWeights` vector. */
  kind: SessionKind
  /** matches a week outside college. A whole number is flat; `lumpy` draws instead. */
  matches: number
  lumpy?: boolean
  /** the training-load knob – `KNOCK_REST_GROWTH` is 0.35, the summer block is above 1 */
  loadFactor?: number
  /** null = straight to the tour at nineteen */
  college: CollegeTier | null
}

const R = (r: Partial<Route> & { id: string; label: string; group: string }): Route => ({
  coachTier: 'middle',
  fit: 'good',
  sessions: 5,
  kind: 'general',
  matches: 0,
  college: null,
  ...r,
})

/** A seven-day matrix of `sessions` days, one session each, all of one kind – the shape
 *  `planWeek`'s own default draws, with the kind swapped. Read through `planFromWeek` so `train`
 *  is the engine's projection and never a number typed here. */
function planOf(sessions: number, kind: SessionKind) {
  const days = new Set(sessionDays(sessions))
  const week: SessionKind[][] = []
  for (let d = 0; d < 7; d++) week.push(days.has(d) ? [kind] : [])
  return planFromWeek(week)
}

// =================================================================================================
// ONE CAREER, WALKED THROUGH `growWeek` EXACTLY AS `world/phaseGrowth.ts` CALLS IT
// =================================================================================================

interface Clock {
  /** her AGE the first time `skills[k] / potential[k] >= 0.90`, or null if it never happened.
   *  ⚠ AN AGE AND NOT A WEEK NUMBER, read off `kidAgeExact` – the same call `growWeek` is fed – so
   *  no arithmetic of this tool's own stands between the crossing and the number printed. */
  fill: Record<SkillKey, number | null>
  /** her age the first time the REALISED share of her born headroom reaches 0.90 */
  real: Record<SkillKey, number | null>
  /** was it already true at birth? (the wing whose roll came up short – it is «done» on day one) */
  bornDone: Record<SkillKey, boolean>
  /** ⭐ HER AGE WHEN SHE LEAVES THE CEILING AGAIN, or null if she never does inside the horizon.
   *  The other half of the owner's question: a career has an ARRIVAL and a DEPARTURE, and the
   *  departure is where `ageWeight` (stamina 1.6, ret 1.2, ground 1.0, serve 0.6) and the route's
   *  own `declineStart` (27 direct, 29 college) do their work. */
  fellBack: Record<SkillKey, number | null>
  born: KidSkills
  potential: KidSkills
  end: KidSkills
}

function walk(seed: string, route: Route, weeks: number): Clock {
  const profile: PlayerProfile = { ...DEFAULT_PROFILE, coachTier: route.coachTier }
  // ⚠ THE CEILING IS FED THE BIRTH BUILD AND THE BUILD IS HEAD-STARTED – world.ts:1470/1547, and the
  // two are deliberately different objects. Copied rather than approximated: a walk that rolled the
  // ceiling off the head-started build would hand every June girl a different ceiling than the game
  // gives her.
  const birth = startingSkills(seed, profile)
  const potential = rollPotential(seed, birth)
  const born = withHeadStart(birth, profile.birthMonth)
  let skills: KidSkills = { ...born }

  const plan = planOf(route.sessions, route.kind)
  const collegeCoach = route.college ? coachFactor(COLLEGE_TIERS[route.college].coachesAt, 'good') : 0
  const forkAge = ENDINGS.forkAgeYears
  const routes = ECONOMY.development.ageRoutes

  const fill = {} as Record<SkillKey, number | null>
  const real = {} as Record<SkillKey, number | null>
  const bornDone = {} as Record<SkillKey, boolean>
  const fellBack = {} as Record<SkillKey, number | null>
  const bornAge = kidAgeExact(0, profile.birthMonth, profile.birthDay)
  for (const k of SKILL_KEYS) {
    fill[k] = born[k] / potential[k] >= 0.9 ? bornAge : null
    real[k] = null
    bornDone[k] = fill[k] !== null
    fellBack[k] = null
  }

  let collegeFrom: number | null = null
  for (let w = 1; w <= weeks; w++) {
    const age = kidAgeExact(w, profile.birthMonth, profile.birthDay)
    // THE FORK, at the age the engine itself asks it. Before it, `ageCurveOf(undefined, …)` answers
    // the shipped pair for every career; after it, the route's own – which is the whole of round 31
    // #10 and the only channel in which «college or not» reaches development before the freeze.
    if (collegeFrom === null && route.college !== null && age >= forkAge) collegeFrom = w
    const forked = age >= forkAge
    const inCollege =
      collegeFrom !== null && w >= collegeFrom && w < collegeFrom + ENDINGS.collegeYears * WEEKS_IN_SEASON
    const bounds = !forked
      ? ECONOMY.development.ageCurve
      : route.college !== null
        ? { ...ECONOMY.development.ageCurve, ...routes.college }
        : { ...ECONOMY.development.ageCurve, ...routes.direct }

    // WHO IS COACHING HER THIS WEEK. Inside the freeze it is the programme (an OVERRIDE, not an
    // addition – `collegeCoachFactor`'s own rule); outside it, the rung the family bought. ⚠ READ
    // PER WEEK AND NOT HOISTED, so §C's mutation of `ECONOMY.coach.developmentFactor` is visible to
    // this walk rather than baked in before the arm applies.
    const coachMul = inCollege ? collegeCoach : coachFactor(route.coachTier, route.fit)

    // HER MATCH LOAD. Inside the freeze it is the squad's two trips a year, which is what makes the
    // college match bonus almost nothing over 208 weeks.
    let matches: number
    if (inCollege && route.college !== null) {
      const seasonWeek = w % WEEKS_IN_SEASON
      matches = (COLLEGE_TRIP_WEEKS as readonly number[]).includes(seasonWeek)
        ? COLLEGE_TIERS[route.college].matchesPerWeek
        : 0
    } else if (route.lumpy) {
      // THE TOOL'S OWN AND ONLY DRAW, on its own purpose-scoped key. A real calendar is lumpy – she
      // plays three matches in a tournament week and none in the fortnight around it – and the
      // question this arm asks is whether that lumpiness costs her anything against the same mean.
      const u = rngFromSeed(`r42-ceiling-clock:load:${seed}:${w}`)()
      matches = u < route.matches / 3 ? 3 : 0
    } else {
      matches = route.matches
    }

    skills = growWeek({
      skills,
      potential,
      ageYears: age,
      plan,
      // ⚠ `coach: null` WITH AN EXPLICIT OVERRIDE IS THE SAME MULTIPLICATION POSITION, not a
      // shortcut: `growWeek` reads `args.coachFactorOverride ?? coachFactor(tierOf(coach), …)`, and
      // `coachFactor(tier, fit)` above is the engine's own function on the engine's own ladder. The
      // override slot is exactly how `collegeCoachFactor` reaches this term in the shipped tick.
      coach: null,
      coachFactorOverride: coachMul,
      playStyle: profile.playStyle,
      matchesThisWeek: matches,
      loadFactor: route.loadFactor ?? 1,
      bounds,
      seed,
      week: w,
    })

    for (const k of SKILL_KEYS) {
      const f = skills[k] / potential[k]
      if (fill[k] === null && f >= 0.9) fill[k] = age
      else if (fill[k] !== null && fellBack[k] === null && f < 0.9) fellBack[k] = age
      if (real[k] === null) {
        const room = potential[k] - born[k]
        if (room > 0 && (skills[k] - born[k]) / room >= 0.9) real[k] = age
      }
    }
  }
  return { fill, real, bornDone, fellBack, born, potential, end: skills }
}

// =================================================================================================
// READING THE CLOCKS – ages, not week numbers, because that is how the game reads
// =================================================================================================

/** Week 0 is her 14th birthday week in every career this file walks (`createWorld` opens at 14).
 *  §D reads its crossings off real world weeks, so it needs the conversion the §A/§B walk does not. */
const ageOf = (week: number): number => 14 + week / WEEKS_IN_SEASON

function quantile(xs: number[], q: number): number {
  if (xs.length === 0) return NaN
  const s = [...xs].sort((a, b) => a - b)
  const i = (s.length - 1) * q
  const lo = Math.floor(i)
  const hi = Math.ceil(i)
  // ⚠ THE EQUALITY ARM IS NOT A SHORTCUT, IT IS THE CENSORING. `never` is coded +Infinity, and
  // interpolating between two Infinities is `Infinity + (Infinity - Infinity) * f` = NaN – which
  // printed as «no data» in the first run where the honest answer was «never». Measured: the
  // knock-rest arm's serve column read `–` while 42% of its wings had genuinely never arrived.
  if (lo === hi || s[lo] === s[hi]) return s[lo]
  return s[lo] + (s[hi] - s[lo]) * (i - lo)
}

interface ArmRead {
  /** median age at 0.90 fill over the careers that ever got there – ⚠ A SURVIVOR MEDIAN, so it is
   *  only readable beside `never[k]`. `medC` below is the censored-aware one. */
  med: Record<SkillKey, number>
  /** ⭐⭐ THE CENSORED-AWARE MEDIAN, and it exists because the survivor one LIED IN THE FIRST RUN.
   *  Crippling a lever makes the slow wings drop out of the sample entirely, so the median of what
   *  is left FALLS – the arm proof read «the worse coach arrives sooner», which is survivorship and
   *  not an effect. Never-reached is coded +Infinity, so a wing over half of whose careers never get
   *  there reads `never` instead of a number that is true only of its lucky tail. */
  medC: Record<SkillKey, number>
  p10: Record<SkillKey, number>
  p90: Record<SkillKey, number>
  /** share of careers whose wing NEVER reached 0.90 fill inside the horizon */
  never: Record<SkillKey, number>
  bornDone: Record<SkillKey, number>
  /** ⭐ share that reached it BY TWENTY – the statistic no survivorship can invert, and the one §C
   *  proves its arms on. A lever that helps always raises it; a lever that hurts always lowers it. */
  by20: Record<SkillKey, number>
  /** median age she LEAVES the ceiling again, over the careers that did */
  fellBack: Record<SkillKey, number>
  fellBackShare: Record<SkillKey, number>
  /** the realisation clock, same reading */
  realMed: Record<SkillKey, number>
  realNever: Record<SkillKey, number>
  /** the five wings folded together – the one number a route comparison needs */
  allMed: number
  allMedC: number
  allP10: number
  allP90: number
  allNever: number
  allBy20: number
}

function readArm(route: Route, seeds: number, weeks: number): ArmRead {
  const per: Record<SkillKey, number[]> = {} as Record<SkillKey, number[]>
  const perC: Record<SkillKey, number[]> = {} as Record<SkillKey, number[]>
  const perBack: Record<SkillKey, number[]> = {} as Record<SkillKey, number[]>
  const perReal: Record<SkillKey, number[]> = {} as Record<SkillKey, number[]>
  const nev = {} as Record<SkillKey, number>
  const bd = {} as Record<SkillKey, number>
  const fb = {} as Record<SkillKey, number>
  const b20 = {} as Record<SkillKey, number>
  const rn = {} as Record<SkillKey, number>
  for (const k of SKILL_KEYS) {
    per[k] = []
    perC[k] = []
    perBack[k] = []
    perReal[k] = []
    nev[k] = 0
    bd[k] = 0
    fb[k] = 0
    b20[k] = 0
    rn[k] = 0
  }
  const all: number[] = []
  const allC: number[] = []
  for (let s = 0; s < seeds; s++) {
    const c = walk(`r42clock-${s}`, route, weeks)
    for (const k of SKILL_KEYS) {
      const t = c.fill[k]
      if (t === null) {
        nev[k]++
        perC[k].push(Infinity)
        allC.push(Infinity)
      } else {
        per[k].push(t)
        perC[k].push(t)
        all.push(t)
        allC.push(t)
        if (t <= 20) b20[k]++
      }
      if (c.bornDone[k]) bd[k]++
      if (c.fellBack[k] !== null) {
        fb[k]++
        perBack[k].push(c.fellBack[k] as number)
      }
      if (c.real[k] === null) rn[k]++
      else perReal[k].push(c.real[k] as number)
    }
  }
  const med = {} as Record<SkillKey, number>
  const medC = {} as Record<SkillKey, number>
  const p10 = {} as Record<SkillKey, number>
  const p90 = {} as Record<SkillKey, number>
  const realMed = {} as Record<SkillKey, number>
  const never = {} as Record<SkillKey, number>
  const realNever = {} as Record<SkillKey, number>
  const bornDone = {} as Record<SkillKey, number>
  const fellBack = {} as Record<SkillKey, number>
  const fellBackShare = {} as Record<SkillKey, number>
  const by20 = {} as Record<SkillKey, number>
  for (const k of SKILL_KEYS) {
    med[k] = quantile(per[k], 0.5)
    medC[k] = quantile(perC[k], 0.5)
    p10[k] = quantile(perC[k], 0.1)
    p90[k] = quantile(perC[k], 0.9)
    realMed[k] = quantile(perReal[k], 0.5)
    never[k] = nev[k] / seeds
    realNever[k] = rn[k] / seeds
    bornDone[k] = bd[k] / seeds
    fellBack[k] = quantile(perBack[k], 0.5)
    fellBackShare[k] = fb[k] / seeds
    by20[k] = b20[k] / seeds
  }
  const slots = seeds * SKILL_KEYS.length
  return {
    med,
    medC,
    p10,
    p90,
    never,
    bornDone,
    by20,
    fellBack,
    fellBackShare,
    realMed,
    realNever,
    allMed: quantile(all, 0.5),
    allMedC: quantile(allC, 0.5),
    allP10: quantile(allC, 0.1),
    allP90: quantile(allC, 0.9),
    allNever: 1 - all.length / slots,
    allBy20: all.filter((x) => x <= 20).length / slots,
  }
}

const n2 = (x: number): string => (Number.isFinite(x) ? x.toFixed(2) : Number.isNaN(x) ? '  –  ' : ' never')
const pc = (x: number): string => (100 * x).toFixed(0) + '%'

// =================================================================================================
// THE ARMS
// =================================================================================================

const BASELINE = R({
  id: 'baseline',
  label: 'baseline – middle coach, neutral fit, 5 general sessions, no matches, tour',
  group: 'baseline',
})

const ARMS: Route[] = [
  BASELINE,
  // --- coach tier, fit held neutral: the rung on its own -----------------------------------------
  ...(['self', 'budget', 'middle', 'high', 'elite'] as CoachTier[]).map((t) =>
    R({ id: `coach-${t}`, label: `coach ${t} (neutral fit)`, group: 'coach', coachTier: t }),
  ),
  // --- coach tier WITH the fit read, which is the spread a family really lives in ----------------
  R({ id: 'coach-worst', label: 'coach self, off fit (0.82 x 0.75)', group: 'coach+fit', coachTier: 'self', fit: 'off' }),
  R({ id: 'coach-best', label: 'coach elite, great fit (1.15 x 1.25)', group: 'coach+fit', coachTier: 'elite', fit: 'great' }),
  // --- plan SIZE: how big the week is ------------------------------------------------------------
  R({ id: 'plan-light', label: 'plan light – 4 general sessions (train 60)', group: 'plan', sessions: 4 }),
  R({ id: 'plan-balanced', label: 'plan balanced – 5 general sessions (train 75)', group: 'plan', sessions: 5 }),
  R({ id: 'plan-grind', label: 'plan grind – 6 general sessions (train 85)', group: 'plan', sessions: 6 }),
  // --- the match load ----------------------------------------------------------------------------
  R({ id: 'load-0', label: 'load – no matches at all', group: 'load', matches: 0 }),
  R({ id: 'load-1', label: 'load – 1 match a week', group: 'load', matches: 1 }),
  R({ id: 'load-2', label: 'load – 2 matches a week', group: 'load', matches: 2 }),
  R({ id: 'load-3', label: 'load – 3 matches a week (the cap)', group: 'load', matches: 3 }),
  R({ id: 'load-lumpy', label: 'load – the same mean, drawn lumpy (3 on a tournament week, 0 otherwise)', group: 'load', matches: 1.2, lumpy: true }),
  R({ id: 'load-flat12', label: 'load – a flat 1.2 matches a week, the same mean', group: 'load', matches: 1.2 }),
  // --- the TRAINING load knob, the other channel of «the load she carries» -----------------------
  R({ id: 'train-knocked', label: 'training load – every week at the knock-rest rate (0.35)', group: 'trainload', loadFactor: 0.35 }),
  R({ id: 'train-summer', label: 'training load – every week at the summer double (school loadFactor)', group: 'trainload', loadFactor: ECONOMY.school.loadFactor }),
  // --- college against the tour, at each rung of the programme ladder ----------------------------
  R({ id: 'tour', label: 'tour – straight on at nineteen (curve 22/27)', group: 'college', college: null }),
  ...(['state', 'national', 'private'] as CollegeTier[]).map((t) =>
    R({ id: `college-${t}`, label: `college ${t} (programme coaches at ${COLLEGE_TIERS[t].coachesAt}, curve 23/29)`, group: 'college', college: t }),
  ),
  // ...and the same fork under a SELF-coached family, where the programme is a promotion -----------
  R({ id: 'tour-self', label: 'tour, self-coached family', group: 'college-self', coachTier: 'self', college: null }),
  R({ id: 'college-self-private', label: 'college private, self-coached family', group: 'college-self', coachTier: 'self', college: 'private' }),
  // --- the two corners a player can actually stand in --------------------------------------------
  R({ id: 'corner-worst', label: 'WORST realistic – self/off, light plan, no matches', group: 'corner', coachTier: 'self', fit: 'off', sessions: 4, matches: 0 }),
  R({ id: 'corner-best', label: 'BEST realistic – elite/great, grind plan, 3 matches a week', group: 'corner', coachTier: 'elite', fit: 'great', sessions: 6, matches: 3 }),
  // --- and the plan's AIM, which is the only lever that is per-WING ------------------------------
  R({ id: 'aim-serve', label: 'aim – every session serve & return', group: 'aim', sessions: 6, kind: 'serve' }),
  R({ id: 'aim-fitness', label: 'aim – every session fitness', group: 'aim', sessions: 6, kind: 'fitness' }),
  R({ id: 'aim-rally', label: 'aim – every session rally', group: 'aim', sessions: 6, kind: 'rally' }),
  R({ id: 'aim-matchplay', label: 'aim – every session match play', group: 'aim', sessions: 6, kind: 'matchplay' }),
]

// =================================================================================================
// §A – WHAT SHE IS BORN WITH, because the clock cannot be read without it
// =================================================================================================

console.log(
  `ROUND 42 #38 – TIME TO 90% OF EACH WING'S CEILING\n` +
    `   n = ${SEEDS} careers per arm, ${WEEKS} weeks each (14 -> ${ageOf(WEEKS).toFixed(0)}), ` +
    `${ARMS.length} arms\n`,
)

console.log('§A  WHAT SHE IS BORN WITH – the roll that decides how far there is to go')
{
  const bornFill: Record<SkillKey, number[]> = {} as Record<SkillKey, number[]>
  for (const k of SKILL_KEYS) bornFill[k] = []
  let doneAtBirth = 0
  let total = 0
  for (let s = 0; s < SEEDS; s++) {
    const profile: PlayerProfile = { ...DEFAULT_PROFILE }
    const birth = startingSkills(`r42clock-${s}`, profile)
    const potential = rollPotential(`r42clock-${s}`, birth)
    const born = withHeadStart(birth, profile.birthMonth)
    for (const k of SKILL_KEYS) {
      const f = born[k] / potential[k]
      bornFill[k].push(f)
      total++
      if (f >= 0.9) doneAtBirth++
    }
  }
  console.log('    wing      born fill p10   median   p90      born already «done» (>= 0.90)')
  for (const k of SKILL_KEYS) {
    console.log(
      `    ${padE(WING[k], 9)} ${pad(n2(quantile(bornFill[k], 0.1)), 11)} ${pad(n2(quantile(bornFill[k], 0.5)), 8)} ` +
        `${pad(n2(quantile(bornFill[k], 0.9)), 8)} ${pad(pc(bornFill[k].filter((x) => x >= 0.9).length / SEEDS), 12)}`,
    )
  }
  console.log(`    ⚠ ${pc(doneAtBirth / total)} of all wings are at or past 0.90 of their ceiling on week one.\n`)
}

// =================================================================================================
// §B – THE CLOCK, PER ARM
// =================================================================================================

const reads = new Map<string, ArmRead>()
console.log(
  '§B  THE CLOCK – her AGE the first time the wing reads 0.90 of its ceiling.\n' +
    '    ⚠ CENSORED MEDIANS: a wing more than half of whose careers never get there reads «never»,\n' +
    '      never a number true only of its lucky tail. `by 20` is the share that arrived by twenty.',
)
console.log(
  '    arm                                                       ' +
    SKILL_KEYS.map((k) => pad(WING[k], 8)).join('') +
    '    p10   med    p90   never  by 20',
)
for (const a of ARMS) {
  const r = readArm(a, SEEDS, WEEKS)
  reads.set(a.id, r)
  console.log(
    `    ${padE(a.label, 56)}  ` +
      SKILL_KEYS.map((k) => pad(n2(r.medC[k]), 8)).join('') +
      `  ${pad(n2(r.allP10), 6)} ${pad(n2(r.allMedC), 6)} ${pad(n2(r.allP90), 6)} ${pad(pc(r.allNever), 5)} ${pad(pc(r.allBy20), 6)}`,
  )
}

console.log('\n§B2 THE SAME CAREERS ON THE REALISATION CLOCK – age at 0.90 of her BORN headroom')
console.log(
  '    arm                                                       ' +
    SKILL_KEYS.map((k) => pad(WING[k], 8)).join('') +
    '   never reaches it',
)
for (const a of ARMS) {
  const r = reads.get(a.id) as ArmRead
  const meanNever = SKILL_KEYS.reduce((n, k) => n + r.realNever[k], 0) / SKILL_KEYS.length
  console.log(
    `    ${padE(a.label, 56)}  ` +
      SKILL_KEYS.map((k) => pad(n2(r.realNever[k] > 0.5 ? Infinity : r.realMed[k]), 8)).join('') +
      `   ${pad(pc(meanNever), 6)}`,
  )
}

console.log(
  '\n§B3 ...AND WHEN DOES SHE LEAVE IT AGAIN – median age the wing falls back below 0.90 fill.\n' +
    '    The ARRIVAL above has a DEPARTURE, and this is where `ageWeight` and the route\'s own\n' +
    '    `declineStart` (27 direct / 29 college) do their work. `–` = it never falls back.',
)
console.log('    arm                                                       ' + SKILL_KEYS.map((k) => pad(WING[k], 8)).join('') + '   share that fall back')
for (const a of ARMS) {
  const r = reads.get(a.id) as ArmRead
  const share = SKILL_KEYS.reduce((n, k) => n + r.fellBackShare[k], 0) / SKILL_KEYS.length
  console.log(
    `    ${padE(a.label, 56)}  ` +
      SKILL_KEYS.map((k) => pad(n2(r.fellBack[k]), 8)).join('') +
      `   ${pad(pc(share), 8)}`,
  )
}

// =================================================================================================
// §B4 – THE SPREAD, which is the whole question
// =================================================================================================

interface Span {
  lever: string
  lo: string
  hi: string
}
const SPANS: Span[] = [
  { lever: 'coach tier (neutral fit)', lo: 'coach-self', hi: 'coach-elite' },
  { lever: 'coach tier + the fit read', lo: 'coach-worst', hi: 'coach-best' },
  { lever: 'plan size (light -> grind)', lo: 'plan-light', hi: 'plan-grind' },
  { lever: 'match load (0 -> 3 a week)', lo: 'load-0', hi: 'load-3' },
  { lever: 'training load (knock-rest -> summer)', lo: 'train-knocked', hi: 'train-summer' },
  { lever: 'college vs tour (middle-coached)', lo: 'tour', hi: 'college-private' },
  { lever: 'college vs tour (self-coached)', lo: 'tour-self', hi: 'college-self-private' },
  { lever: '⭐ the two realistic corners', lo: 'corner-worst', hi: 'corner-best' },
]

console.log('\n§B4 THE SPREAD – how many YEARS apart the two ends of each lever are (censored median)')
console.log('    lever                                  ' + SKILL_KEYS.map((k) => pad(WING[k], 8)).join('') + '   all wings')
for (const s of SPANS) {
  const lo = reads.get(s.lo) as ArmRead
  const hi = reads.get(s.hi) as ArmRead
  console.log(
    `    ${padE(s.lever, 38)}` +
      SKILL_KEYS.map((k) => pad(n2(lo.medC[k] - hi.medC[k]), 8)).join('') +
      `   ${pad(n2(lo.allMedC - hi.allMedC), 8)}` +
      `   (reach-by-20 ${pc(hi.allBy20)} vs ${pc(lo.allBy20)})`,
  )
}
{
  const b = reads.get('baseline') as ArmRead
  console.log(
    `\n    ⭐ AGAINST THE SEED SPREAD ON ONE ROUTE: the baseline's own p10-p90 is ` +
      `${n2(b.allP10)} -> ${n2(b.allP90)} = ${n2(b.allP90 - b.allP10)} years wide.\n` +
      `      A lever whose span is WIDER than that is a route the player can feel; a lever narrower\n` +
      `      than it is drowned by the dice she was born with.`,
  )
}

// =================================================================================================
// §C – THE ARM PROOF. Set a route lever to an absurd value and watch the clock move.
// =================================================================================================
//
// ⚠⚠ CLAUDE.md: «A null result is a claim and needs the same provenance check as a positive one …
// The cheapest sanity check is to set the constant to an absurd value and watch the output move; if
// it does not, the arm is wrong before the hypothesis is.» Two constants, two directions, and the
// shipped values are asserted back afterwards.

console.log(
  '\n§C  THE ARM PROOF – the readers ARE present, shown by moving them to absurd values.\n' +
    '    ⚠⚠ READ ON `reach by 20`, NOT ON THE MEDIAN. The first run of this section read its arms on\n' +
    '      the survivor median and every one of them moved the WRONG WAY: crippling the elite coach\n' +
    '      made the median «arrive» 1.5 years SOONER, because the slow wings stopped arriving at all\n' +
    '      and dropped out of the sample. That is survivorship, not an effect, and it is exactly the\n' +
    '      family of mistake CLAUDE.md\'s «prove the arm» note exists for. The reach rate cannot be\n' +
    '      inverted that way: a lever that helps always raises it.',
)
{
  // ⚠ THE CAST IS THE HOUSE PATTERN FOR A SENSITIVITY ARM (tools/r34-reachable-ceiling.ts:125-127):
  // the knobs are `readonly` so nothing can scribble on them by accident, and a measurement that
  // moves one on purpose says so in one place and puts it back below.
  const ladder = ECONOMY.coach.developmentFactor as Record<string, number>
  const dev = ECONOMY.development as { trainAt85: number; matchBonus: number }
  const endings = ENDINGS as { forkAgeYears: number }
  const keep = {
    self: ladder.self,
    elite: ladder.elite,
    train85: dev.trainAt85,
    bonus: dev.matchBonus,
    fork: endings.forkAgeYears,
  }
  const armOf = (id: string): Route => ARMS.find((a) => a.id === id) as Route
  const proof: { what: string; on: string; before: ArmRead; after: ArmRead }[] = []
  const run = (what: string, on: string, apply: () => void, undo: () => void) => {
    const before = reads.get(on) as ArmRead
    apply()
    const after = readArm(armOf(on), SEEDS, WEEKS)
    undo()
    proof.push({ what, on, before, after })
  }

  run('coach.developmentFactor.elite 1.15 -> 0.05', 'coach-elite', () => { ladder.elite = 0.05 }, () => { ladder.elite = keep.elite })
  run('coach.developmentFactor.self 0.82 -> 3.00', 'coach-self', () => { ladder.self = 3.0 }, () => { ladder.self = keep.self })
  run('development.trainAt85 1.28 -> 0.05', 'plan-grind', () => { dev.trainAt85 = 0.05 }, () => { dev.trainAt85 = keep.train85 })
  run('development.matchBonus 0.18 -> 1.00', 'load-3', () => { dev.matchBonus = 1.0 }, () => { dev.matchBonus = keep.bonus })
  // ⭐⭐ AND THE ONE THAT PROVES THE COLLEGE NULL IS A NULL AND NOT A DEAD WIRE. §B4 reports 0.00
  // years between college and tour; this arm moves the FORK from nineteen to fourteen, which is the
  // only thing standing between the college machinery and the clock. If the college arm separates
  // when the fork moves, the wiring is live and the null is about TIMING – the decision arriving
  // after the clock has stopped – rather than about a lever nothing reads.
  run('ENDINGS.forkAgeYears 19 -> 14, college private', 'college-private', () => { endings.forkAgeYears = 14 }, () => { endings.forkAgeYears = keep.fork })
  run('ENDINGS.forkAgeYears 19 -> 14, tour (the control)', 'tour', () => { endings.forkAgeYears = 14 }, () => { endings.forkAgeYears = keep.fork })

  console.log('    mutation                                      arm                reach-by-20   median      never')
  for (const p of proof) {
    console.log(
      `    ${padE(p.what, 44)}  ${padE(p.on, 16)}  ` +
        `${pad(pc(p.before.allBy20), 5)} -> ${pad(pc(p.after.allBy20), 5)}  ` +
        `${pad(n2(p.before.allMedC), 6)} -> ${pad(n2(p.after.allMedC), 6)}  ` +
        `${pad(pc(p.before.allNever), 5)} -> ${pad(pc(p.after.allNever), 5)}`,
    )
  }
  const restored =
    ladder.self === keep.self &&
    ladder.elite === keep.elite &&
    dev.trainAt85 === keep.train85 &&
    dev.matchBonus === keep.bonus &&
    endings.forkAgeYears === keep.fork
  const base = (reads.get('baseline') as ArmRead).allMedC
  const rerun = readArm(BASELINE, SEEDS, WEEKS).allMedC
  console.log(
    `    restored: ${restored ? 'every constant is back at its shipped value' : '⚠⚠ NOT RESTORED'}; ` +
      `the baseline re-walks to ${n2(rerun)} against its first reading of ${n2(base)} ` +
      `(${rerun === base ? 'identical' : '⚠⚠ DRIFTED'})`,
  )
}

// =================================================================================================
// §D – THE REAL-CAREER CROSS-CHECK, through econ-bench's own walk
// =================================================================================================

if (!SKIP_REAL) {
  console.log(
    `\n§D  REAL CAREERS – ${REAL_CAREERS} per preset, ${REAL_WEEKS} weeks, econ-bench's own ` +
      `walk (real entries, matches, money, knocks)`,
  )
  console.log('    preset                              ' + SKILL_KEYS.map((k) => pad(WING[k], 8)).join('') + '   all wings  never  careers')
  const picks = PRESETS.filter((p) =>
    ['25k  · middle  · self-coached', '25k  · middle  · middle coach', '120k · wealthy · elite coach'].includes(p.label),
  )
  for (const preset of picks) {
    const per: Record<SkillKey, number[]> = {} as Record<SkillKey, number[]>
    for (const k of SKILL_KEYS) per[k] = []
    const all: number[] = []
    let slots = 0
    let ended = 0
    for (let i = 0; i < REAL_CAREERS; i++) {
      const { world, rng } = openCareer(preset, i, POLICIES[1])
      const first = {} as Record<SkillKey, number | null>
      const { birthMonth, birthDay } = world.profile
      for (const k of SKILL_KEYS)
        first[k] = world.skills[k] / world.potential[k] >= 0.9 ? kidAgeExact(0, birthMonth, birthDay) : null
      for (let w = 0; w < REAL_WEEKS; w++) {
        stepCareerWeek(world, rng, POLICIES[1])
        for (const k of SKILL_KEYS) {
          if (first[k] === null && world.skills[k] / world.potential[k] >= 0.9) {
            first[k] = kidAgeExact(world.week, birthMonth, birthDay)
          }
        }
        if (world.ending) break
      }
      if (world.ending) ended++
      for (const k of SKILL_KEYS) {
        slots++
        // ⚠ CENSORED THE SAME WAY §B IS, for the same reason: a wing that never arrived must not
        // leave the sample and let the lucky ones speak for the preset.
        per[k].push(first[k] === null ? Infinity : (first[k] as number))
        all.push(first[k] === null ? Infinity : (first[k] as number))
      }
    }
    console.log(
      `    ${padE(preset.label, 34)}  ` +
        SKILL_KEYS.map((k) => pad(n2(quantile(per[k], 0.5)), 8)).join('') +
        `   ${pad(n2(quantile(all, 0.5)), 7)}  ${pad(pc(all.filter((x) => !Number.isFinite(x)).length / slots), 6)}` +
        `  ${pad(`${ended}/${REAL_CAREERS} ended early`, 20)}`,
    )
  }
  console.log(
    '    ⚠ THIS IS THE PROVENANCE CHECK AND NOT A SECOND HEADLINE. n is small, the policy books\n' +
      '      its own trips and its own rest, and a career that ends early stops its clock – so read\n' +
      '      it as «do §B\'s arms land where a real career lands», never as a quantile of its own.',
  )
}

console.log('\nDONE. The predicted-vs-measured record is docs/specs/time-to-the-ceiling-2026-09.md.')
