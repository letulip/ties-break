/**
 * r44-decline-seats – WHAT FOUR PAID SEATS TAKE OFF THE DECLINE, AND WHETHER A STAFFED VETERAN STILL
 * AGES. The bench arm `docs/specs/the-decline-and-the-seats-2026-09.md` §4 demands before any
 * constant in `ECONOMY.development.declineCare` may be chosen (CLAUDE.md invariant 5).
 *
 * THE OWNER, 17.09: «все эти специалисты должны его если не тормозить, то хотя бы сглаживать, а
 * может у кого-то и тормозить даже немного» – and «строй и меряй».
 *
 * ⚠⚠ THE SPEC DELIBERATELY SHIPPED WITH NO NUMBERS IN ITS §4 TABLE, and this file is the reason: the
 * constants are supposed to come out of a measurement rather than out of somebody's taste. So the
 * two questions §4 names are PASS/FAIL and they are printed as verdicts, not as a table for a reader
 * to interpret:
 *
 *   Q1  DOES A FULLY-STAFFED CAREER STILL DECLINE?  It must. «A seat that stops ageing is an
 *       immortality button.» §2 prints her retained share at 33 under the fullest team money can
 *       buy, and its Q1b prints the arithmetic bound that makes the answer structural, not lucky.
 *   Q2  IS THE STAFFED-VS-UNSTAFFED GAP SOMETHING A PLAYER WOULD FEEL, rather than noise? §2 prints
 *       it in POINTS of each attribute, which is the unit the radar and the match engine spend.
 *
 * FIVE SECTIONS:
 *
 *   §0  THE ACTUATION ARM (`--actuate`), AND IT IS NOT OPTIONAL. Runs §2's walk with every constant
 *       at 0 and again at an absurd 0.90, and prints both. ⚠⚠ IF THOSE NUMBERS DO NOT MOVE, THE ARM
 *       IS NOT WIRED AND EVERY OTHER FIGURE IN THIS FILE IS A FICTION – CLAUDE.md's «a null result is
 *       a claim and needs the same provenance check as a positive one», and the chemistry bench's own
 *       hard-won rule after round 42 found an arm writing a property nothing read.
 *   §1  THE CURVE, AGAINST THE SPEC'S OWN PUBLISHED TABLE. ⚠⚠ IT DOES NOT REPRODUCE, AND THE DEFECT
 *       IS IN THE TABLE: the spec's 96.0 / 92.2 / 89.7 / 93.5 at 28.76 was computed against the RAW
 *       `ECONOMY.development.ageWeight` values rather than through `ageWeightOf`, which divides them
 *       by their own mean of 1.1. This section prints THREE rows at every age – what the spec says,
 *       what a raw walk gives, and what `growWeek` does – so the diagnosis is on the record instead
 *       of being re-derived by whoever next tries to reproduce the page.
 *   §2s THE SWEEP: how the coach's one fitted constant was chosen, against four criteria written
 *       down before the run. The two SEAT constants are derived from the `ageWeight` ladder and are
 *       not swept – see the block above §2s for the derivation.
 *   §2  THE ISOLATED GAP: what each seat, each rung and the whole team are worth, per attribute, at
 *       29 / 31 / 33. Exact, and identical to the bit between arms when the constants are 0.
 *   §3  THE LIVE ARM: real careers walked through `tickWeek` to 33 with the seats hired and without,
 *       which is the only thing that can prove the wiring reaches the SHIPPED tick and that the
 *       stand-downs are honoured. It also counts the weeks each seat actually worked past her
 *       `declineStart`, because a shield that never lands is worth nothing whatever its constant says.
 *
 * ⚠⚠ §1 AND §2 WALK `growWeek` ITSELF AND RE-IMPLEMENT NOTHING. Past `declineStart` `ageFactor`
 * returns 0, so the whole GAIN term of that function is zero and what it does to a physical attribute
 * IS the decline – `r38-decline-shape.ts` and `r39-body-seasons.ts` run under the same licence, but
 * they re-typed the arithmetic and this one does not. A bench that re-implements the formula it is
 * measuring cannot catch a wiring defect, which is exactly what §0 exists to catch.
 *
 * ⚠ AND IT IS A WEEKLY LOOP RATHER THAN A CLOSED FORM, for `ageAtPhysicalShare`'s own recorded
 * reason: the engine raises her age every tick, so the loss compounds against a continuously rising
 * factor, and a closed form would have to integrate a piecewise-linear factor and would drift from
 * what the engine does.
 *
 * ⚠ ONE DIAGNOSIS WAS TRIED AND IS WRONG, RECORDED SO IT IS NOT TRIED AGAIN. The first guess at why
 * the spec's §1 table would not reproduce was that it had evaluated `declineFactor` once a year and
 * held it constant across the 52 weeks – the mistake its own predecessor `r38-decline-shape.ts`
 * documents. It had not: a constant-factor walk does not reproduce the page either. The cause is the
 * RAW weights, and §1 proves it by reproducing all twenty published numbers to the last decimal.
 *
 * Run: npm run bench:decline
 *      npm run bench:decline -- --actuate
 *      npm run bench:decline -- --seeds 6 --live
 */
import { ECONOMY } from '../src/engine/economy'
import {
  ageCurveOf,
  declineFactor,
  growWeek,
  isPhysicalSkill,
  PHYSICAL_SKILL_KEYS,
  type AgeCurveBounds,
  type KidSkills,
  type SkillKey,
} from '../src/engine/development'
import { coachFactor } from '../src/engine/coach'
import { ageWeightOf } from '../src/engine/development'
import { basePServe } from '../src/engine/match/point'
import { pMatchBo3 } from '../src/engine/match/closedForm'
import { kidMatchPlayer } from '../src/engine/world/player'
import type { MatchOptions } from '../src/engine/match/types'
import { WEEKS_PER_YEAR } from '../src/engine/season/calendar'
import { kidAgeExact } from '../src/engine/world/age'
import { weeksLostSoFar } from '../src/engine/ending'
import { masseurUnlocked, masseurWorksThisWeek } from '../src/engine/world/masseur'
import { sparringUnlocked, sparringWorksThisWeek } from '../src/engine/world/sparring'
import { isCompetitionWeek } from '../src/engine/world/knock'
import {
  answerFork,
  answerRetirement,
  hireMasseur,
  hireSparring,
  pendingBirthday,
  setMasseurSessions,
  setMasseurTravels,
  setSparringRung,
  setSparringTravels,
  type WorldState,
} from '../src/engine/world'
import { PRESETS, POLICIES, openCareer, stepCareerWeek, type Preset, type Policy } from './econ-bench'
import { answerBirthdayNeutral } from './_birthday'
import { drainLifeBeats } from './_lifeBeats'
import { DEFAULT_PROFILE, WEEK_PLAN_PRESETS, type WeekPlan } from '../src/shared/protocol'

const args = process.argv.slice(2)
const flag = (name: string, fallback: number): number => {
  const i = args.indexOf(`--${name}`)
  return i >= 0 && args[i + 1] ? Number(args[i + 1]) : fallback
}
const ACTUATE = args.includes('--actuate')
const LIVE = args.includes('--live') || !ACTUATE
const SEEDS = flag('seeds', 4)

const f1 = (x: number) => x.toFixed(1)
const f2 = (x: number) => x.toFixed(2)
const pad = (s: string | number, n: number) => String(s).padEnd(n)
const padL = (s: string | number, n: number) => String(s).padStart(n)
const signed = (x: number) => (x >= 0 ? `+${f2(x)}` : f2(x))

// =================================================================================================
// THE ISOLATED WALK – the engine's own `growWeek`, past `declineStart`, one week at a time
// =================================================================================================

/** HER PEAK BUILD, and it is the owner's own from the spec's §3 rather than a round number: «serve
 *  66 · return 59 · stamina 61 · groundstrokes 63 … composure 78». The share of peak this walk
 *  reports is independent of it (the loss is proportional per attribute), but the POINTS column is
 *  not, and points are the unit the question is really asked in. */
const PEAK: KidSkills = { serve: 66, ret: 59, composure: 78, stamina: 61, groundstrokes: 63 }

/** His career's own decline age, measured off his save before any of this was built (spec §1). */
const HIS_DECLINE_START = 25.99
const HIS_BOUNDS: AgeCurveBounds = { plateauStart: 23, declineStart: HIS_DECLINE_START }

/** The shipped default plan – it reaches nothing here (`ageFactor` is 0 past the peak, so the whole
 *  rate is 0 whatever `trainFactor` returns) and is passed because `growWeek` requires one. */
const PLAN: WeekPlan = WEEK_PLAN_PRESETS.balanced

/** A TEAM, as the decline reads one. `null` for a seat that is not working; `coachRate` is what
 *  `coachFactor` would return for the arm's coach and is handed to `growWeek` as
 *  `coachFactorOverride`, which is the one input that sets the maintenance term directly. */
interface Arm {
  label: string
  masseurBonus: number | null
  sparringDriftCut: number | null
  coachRate: number
}

const masseurRung = (n: number) => ECONOMY.masseur.rungs[n].conditionBonusPerWeek
const sparringRung = (n: number) => ECONOMY.sparring.rungs[n].driftCut
/** the parent on the court – `coachFitFor(null, …)` is `ECONOMY.coach.selfFit` by its own definition */
const SELF_RATE = coachFactor('self', ECONOMY.coach.selfFit)
const ELITE_RATE = coachFactor('elite', 'great')
const MIDDLE_RATE = coachFactor('middle', 'good')

const NOBODY: Arm = { label: 'nobody – self-coached', masseurBonus: null, sparringDriftCut: null, coachRate: SELF_RATE }
const EVERYBODY: Arm = {
  label: 'the whole team, top rungs',
  masseurBonus: masseurRung(2),
  sparringDriftCut: sparringRung(2),
  coachRate: ELITE_RATE,
}

/** ⭐⭐ ONE WEEK OF DECLINE, THROUGH THE SHIPPED FUNCTION. `ageFactor` returns 0 from `declineStart`,
 *  so `rate` is 0, so `gain` is 0 for every attribute and what comes back is `skills - loss` exactly.
 *  `potential` is handed her own build for the same reason – the headroom term is multiplied by a
 *  zero rate and cannot matter – and `matchesThisWeek: 0` keeps the match bonus out of a product
 *  that is already zero.
 *
 *  ⚠ `coachFactorOverride` IS HOW THE ARM'S COACH ENTERS, and it is the real input rather than a
 *  bench hook: `growWeek` fills `care.coachRate` from the same term its growth rate spends, so the
 *  override sets both, which is precisely the property this bench is here to check. */
function declineWeek(skills: KidSkills, age: number, bounds: AgeCurveBounds, arm: Arm, week: number): KidSkills {
  return growWeek({
    skills,
    potential: skills,
    ageYears: age,
    plan: PLAN,
    coach: null,
    playStyle: 'all-court',
    matchesThisWeek: 0,
    seed: 'r44-decline',
    week,
    bounds,
    coachFactorOverride: arm.coachRate,
    care: {
      masseurConditionBonus: arm.masseurBonus,
      sparringDriftCut: arm.sparringDriftCut,
      coachRate: arm.coachRate,
    },
  })
}

/** Walk from `bounds.declineStart` to `toAge`, returning the build she is left with. */
function walkTo(toAge: number, bounds: AgeCurveBounds, arm: Arm): KidSkills {
  let skills: KidSkills = { ...PEAK }
  let age = bounds.declineStart
  let week = 0
  while (age < toAge) {
    skills = declineWeek(skills, age, bounds, arm, week++)
    age += 1 / WEEKS_PER_YEAR
  }
  return skills
}

const shareOf = (skills: KidSkills, k: SkillKey) => skills[k] / PEAK[k]

// =================================================================================================
// §0 THE ACTUATION ARM
// =================================================================================================

/** ⚠⚠ MUTATES `ECONOMY` FOR THE DURATION OF ONE CALL AND PUTS IT BACK. This is the only place in
 *  this file that writes a constant, it is a bench device, and it exists because the alternative –
 *  «trust that the wiring is right» – is the exact mistake that produced round 42's fictional arm.
 *  The restore runs in a `finally`, so a throw cannot leave the table moved. */
function withCare<T>(masseur: number, sparring: number, coach: number, body: () => T): T {
  const c = ECONOMY.development.declineCare
  const before = { m: c.masseur.topRungShare, s: c.sparring.topRungShare, k: c.coachMaintenanceTop }
  c.masseur.topRungShare = masseur
  c.sparring.topRungShare = sparring
  c.coachMaintenanceTop = coach
  try {
    return body()
  } finally {
    c.masseur.topRungShare = before.m
    c.sparring.topRungShare = before.s
    c.coachMaintenanceTop = before.k
  }
}

function actuation(): void {
  console.log('='.repeat(100))
  console.log('§0 THE ACTUATION ARM – set the constants absurd and watch the output move, or stop reading')
  console.log('='.repeat(100))
  console.log('')
  console.log('  Her retained share of each attribute at 33, walked from declineStart 25.99, FULLY STAFFED.')
  console.log('  If the 0.00 row and the 0.90 row are the same, `declineCare` is not wired and §1-§3 are fiction.')
  console.log('')
  console.log(`  ${pad('shares set to', 16)}${PHYSICAL_SKILL_KEYS.map((k) => padL(k, 16)).join('')}`)
  for (const share of [0, 0.9]) {
    const left = withCare(share, share, share, () => walkTo(33, HIS_BOUNDS, EVERYBODY))
    const cells = PHYSICAL_SKILL_KEYS.map((k) => padL(`${f1(100 * shareOf(left, k))}%  (${f1(left[k])})`, 16)).join('')
    console.log(`  ${pad(f2(share), 16)}${cells}`)
  }
  const flat = withCare(0, 0, 0, () => walkTo(33, HIS_BOUNDS, EVERYBODY))
  const bare = withCare(0, 0, 0, () => walkTo(33, HIS_BOUNDS, NOBODY))
  const same = PHYSICAL_SKILL_KEYS.every((k) => flat[k] === bare[k])
  console.log('')
  console.log(`  AND THE BASELINE NULL: staffed and unstaffed at share 0 are byte-identical – ${same ? 'YES' : 'NO – THE ARM IS BROKEN'}`)
  console.log('  (that is the «today no seat touches the decline» claim, proven rather than asserted)')
  console.log('')
}

// =================================================================================================
// §1 THE CURVE, AGAINST THE SPEC'S OWN PUBLISHED TABLE
// =================================================================================================

/** THE SPEC'S OWN §1 TABLE, TRANSCRIBED, so the comparison below is against what it PRINTS and not
 *  against what a reader remembers it printing. */
const SPEC_TABLE: Record<string, number[]> = {
  '27.00': [98.8, 97.5, 96.7, 97.9],
  '28.00': [97.3, 94.7, 93.0, 95.5],
  '28.76': [96.0, 92.2, 89.7, 93.5],
  '30.00': [93.7, 87.8, 84.1, 89.7],
  '32.00': [89.3, 79.8, 74.0, 82.8],
}

/** ⚠⚠ THE SAME WALK WITH THE **RAW** `ageWeight` VALUES INSTEAD OF `ageWeightOf`'s NORMALISED ONES –
 *  the arm that identifies what the spec's table was actually computed from. It exists ONLY as a
 *  diagnosis and is not what the engine does; see §1's verdict. Deliberately not `growWeek`, because
 *  `growWeek` cannot be made to do this – which is the point. */
function rawWeightWalk(toAge: number): Record<string, number> {
  const raw = ECONOMY.development.ageWeight as Record<string, number>
  const left: Record<string, number> = {}
  for (const k of PHYSICAL_SKILL_KEYS) left[k] = 1
  let age = HIS_BOUNDS.declineStart
  while (age < toAge) {
    const d = declineFactor(age, HIS_BOUNDS)
    for (const k of PHYSICAL_SKILL_KEYS) left[k] *= 1 - d * (raw[k] ?? 1)
    age += 1 / WEEKS_PER_YEAR
  }
  return left
}

function reproduceTheSpec(): void {
  console.log('='.repeat(100))
  console.log('§1 THE CURVE REPRODUCED – his own career, declineStart 25.99, nobody on the payroll')
  console.log('='.repeat(100))
  console.log('')
  console.log('  ⚠⚠ THE SPEC\'S §1 TABLE DOES NOT REPRODUCE, AND THE REASON IS A REAL DEFECT IN THE TABLE.')
  console.log('     It was computed with the RAW `ECONOMY.development.ageWeight` values (0.6/1.2/1.6/1.0)')
  console.log('     rather than through `ageWeightOf`, which divides them by their own mean of 1.1 – the')
  console.log('     normalisation that function\'s header calls «THE WHOLE SAFETY OF THE FEATURE». Every')
  console.log('     published number is therefore ~10% too steep. Both columns are printed; the RAW one')
  console.log('     reproduces the spec to the last decimal, which is the proof rather than a hunch.')
  console.log('')
  console.log(`  ${pad('age', 8)}${pad('column', 14)}${PHYSICAL_SKILL_KEYS.map((k) => padL(k, 14)).join('')}`)
  for (const age of [27, 28, 28.76, 30, 32]) {
    const engine = withCare(0, 0, 0, () => walkTo(age, HIS_BOUNDS, NOBODY))
    const raw = rawWeightWalk(age)
    const said = SPEC_TABLE[f2(age)]
    const rawMatches = PHYSICAL_SKILL_KEYS.every((k, i) => Math.abs(100 * raw[k] - said[i]) < 0.06)
    console.log(
      `  ${pad(f2(age), 8)}${pad('spec §1 says', 14)}${said.map((v) => padL(`${v.toFixed(1)}%`, 14)).join('')}`,
    )
    console.log(
      `  ${pad('', 8)}${pad('raw weights', 14)}${PHYSICAL_SKILL_KEYS.map((k) => padL(`${f1(100 * raw[k])}%`, 14)).join('')}  <- ${rawMatches ? 'REPRODUCES THE SPEC' : 'does not match'}`,
    )
    console.log(
      `  ${pad('', 8)}${pad('THE ENGINE', 14)}${PHYSICAL_SKILL_KEYS.map((k) => padL(`${f1(100 * shareOf(engine, k))}%`, 14)).join('')}  <- `
        + '`growWeek` through `ageWeightOf`',
    )
    console.log('')
  }
  console.log(`  normalised weights the engine actually spends: ${PHYSICAL_SKILL_KEYS.map((k) => `${k} ${ageWeightOf(k).toFixed(4)}`).join(' · ')}`)
  // ONE SEASON OF IT, the number the spec's §1 uses to rule the decline OUT as the cause of his
  // 70% -> 53%: «one season of it is about 1.5 points». ⚠ IT SURVIVES THE CORRECTION – which is why
  // §1's ARGUMENT stands even though its table does not.
  const at28 = withCare(0, 0, 0, () => walkTo(28, HIS_BOUNDS, NOBODY))
  const at29 = withCare(0, 0, 0, () => walkTo(29, HIS_BOUNDS, NOBODY))
  const seasonPoints = PHYSICAL_SKILL_KEYS.reduce((a, k) => a + (at28[k] - at29[k]), 0) / PHYSICAL_SKILL_KEYS.length
  console.log(`  one season of decline, 28 -> 29, mean over the four: ${f2(seasonPoints)} points (the spec says «about 1.5»)`)
  console.log('  ⭐ SO §1\'s CONCLUSION IS UNHARMED AND SLIGHTLY STRENGTHENED: the slope is even gentler than')
  console.log('     it published, so «a point and a half of skill does not move a win rate seventeen points»')
  console.log('     holds a fortiori. What has to be corrected is the table, not the reading of it.')
  console.log('')
}

// =================================================================================================
// §2 THE ISOLATED GAP – what each seat is worth, and whether she still ages
// =================================================================================================

function arms(): Arm[] {
  return [
    NOBODY,
    { label: 'masseur only, top rung', masseurBonus: masseurRung(2), sparringDriftCut: null, coachRate: SELF_RATE },
    { label: 'masseur only, entry rung', masseurBonus: masseurRung(0), sparringDriftCut: null, coachRate: SELF_RATE },
    { label: 'partner only, top rung', masseurBonus: null, sparringDriftCut: sparringRung(2), coachRate: SELF_RATE },
    { label: 'partner only, entry rung', masseurBonus: null, sparringDriftCut: sparringRung(0), coachRate: SELF_RATE },
    { label: 'middle coach only (good fit)', masseurBonus: null, sparringDriftCut: null, coachRate: MIDDLE_RATE },
    { label: 'elite coach only (great fit)', masseurBonus: null, sparringDriftCut: null, coachRate: ELITE_RATE },
    EVERYBODY,
  ]
}

function isolatedGap(): void {
  console.log('='.repeat(100))
  console.log(`§2 WHAT EACH SEAT IS WORTH – shipped constants (masseur ${ECONOMY.development.declineCare.masseur.topRungShare} · partner ${ECONOMY.development.declineCare.sparring.topRungShare} · coach ${ECONOMY.development.declineCare.coachMaintenanceTop})`)
  console.log('='.repeat(100))
  if (ECONOMY.development.declineCare.coachMaintenanceTop === 0) {
    // ⚠ THE COACH ROWS BELOW READ +0.00 ON PURPOSE AND IT IS NOT A WIRING FAULT. `coachMaintenanceTop`
    // ships at 0: the sweep above chose 0.08 and the gate then found that 0.08 turns nine assertions
    // red across `peak-physical`, `recovery-fade` and `ending`, all of them pinning that the share of
    // her peak is a function of AGE ALONE («a share threshold must not be a different rule for a rich
    // girl than for a poor one»). The row is built, measured and held for the owner's ruling – see
    // docs/specs/the-decline-and-the-seats-2026-09.md §6g. §2s above is what it WOULD be worth.
    console.log('')
    console.log('  ⚠⚠ THE COACH ROW IS HELD AT 0 (spec §6g) – its rows below read +0.00 by design, not by defect.')
    console.log('     The sweep chose 0.08; at 0.08 the gate goes red on nine assertions that pin «the share of')
    console.log('     her peak is a function of AGE ALONE». That collision is the owner\'s to rule on.')
  }
  for (const age of [29, 31, 33]) {
    console.log('')
    console.log(`  AT ${age}, walked from declineStart 25.99 – share of her own peak, and the POINTS against nobody`)
    console.log(`  ${pad('team', 30)}${PHYSICAL_SKILL_KEYS.map((k) => padL(k, 17)).join('')}`)
    const bare = walkTo(age, HIS_BOUNDS, NOBODY)
    for (const arm of arms()) {
      const left = walkTo(age, HIS_BOUNDS, arm)
      const cells = PHYSICAL_SKILL_KEYS.map((k) =>
        padL(`${f1(100 * shareOf(left, k))}%  ${signed(left[k] - bare[k])}`, 17),
      ).join('')
      console.log(`  ${pad(arm.label, 30)}${cells}`)
    }
  }

  // ------------------------------------------------------------------------------------------- Q1
  console.log('')
  console.log('  ' + '-'.repeat(96))
  console.log('  Q1 · DOES A FULLY-STAFFED CAREER STILL DECLINE? (it must – a seat that stops ageing is an immortality button)')
  const staffed33 = walkTo(33, HIS_BOUNDS, EVERYBODY)
  const bare33 = walkTo(33, HIS_BOUNDS, NOBODY)
  const stillFalls = PHYSICAL_SKILL_KEYS.every((k) => staffed33[k] < PEAK[k])
  const worstHeld = Math.max(...PHYSICAL_SKILL_KEYS.map((k) => shareOf(staffed33, k)))
  console.log(`     fully staffed at 33 holds ${PHYSICAL_SKILL_KEYS.map((k) => `${k} ${f1(100 * shareOf(staffed33, k))}%`).join(' · ')}`)
  console.log(`     every physical attribute is still BELOW its peak: ${stillFalls ? 'YES – PASS' : 'NO – FAIL, THIS SHIPS NOTHING'}`)
  console.log(`     the best-preserved attribute is at ${f1(100 * worstHeld)}% of peak, so the answer does not depend on which one you look at`)

  // -------------------------------------------------------------------------------------------- Q2
  console.log('')
  console.log('  Q2 · IS THE GAP SOMETHING A PLAYER WOULD FEEL? (the unit is POINTS, which is what the match engine spends)')
  for (const k of PHYSICAL_SKILL_KEYS) {
    const gap = staffed33[k] - bare33[k]
    console.log(
      `     ${pad(k, 16)}${padL(f2(bare33[k]), 7)} -> ${padL(f2(staffed33[k]), 7)}   ${padL(signed(gap), 7)} points  (${f1(100 * (gap / PEAK[k]))} pp of peak)`,
    )
  }
  const meanGap = PHYSICAL_SKILL_KEYS.reduce((a, k) => a + (staffed33[k] - bare33[k]), 0) / PHYSICAL_SKILL_KEYS.length
  // The yardstick is the spec's own: one season of ageing is about 1.5 points, so «how many seasons
  // of decline has the payroll handed back» is the honest way to say whether the gap is felt.
  const seasonAt28 = walkTo(28, HIS_BOUNDS, NOBODY)
  const seasonAt29 = walkTo(29, HIS_BOUNDS, NOBODY)
  const oneSeason =
    PHYSICAL_SKILL_KEYS.reduce((a, k) => a + (seasonAt28[k] - seasonAt29[k]), 0) / PHYSICAL_SKILL_KEYS.length
  console.log(`     mean over the four: ${signed(meanGap)} points = ${f1(meanGap / oneSeason)} SEASONS of ageing handed back`)

  // -------------------------------------------------------------------------------------------- Q1b
  console.log('')
  console.log('  Q2b · AND IN THE UNIT THE PLAYER ACTUALLY READS – her chance of winning a best-of-three')
  console.log('        against a fixed opponent at the elite band the spec\'s §3 names (65-70, taken at 67).')
  for (const [label, build] of [
    ['nobody on the payroll', bare33],
    ['the whole team, top rungs', staffed33],
    ['her own peak, for scale', PEAK],
  ] as [string, KidSkills][]) {
    console.log(`        ${pad(label, 28)}${padL(`${f1(100 * winChanceAgainstElite(build))}%`, 9)}`)
  }
  const dP = 100 * (winChanceAgainstElite(staffed33) - winChanceAgainstElite(bare33))
  console.log(`        the payroll is worth ${signed(dP)} percentage points of match-win probability at 33`)

  console.log('')
  console.log('  Q1b · AND THE BOUND IS STRUCTURAL, NOT TUNED. Every factor in the shield is `1 - share`')
  console.log('        with share clamped below 1, so the product is > 0 for ANY constants. Proof by absurdity:')
  const absurd = withCare(0.99, 0.99, 0.99, () => walkTo(33, HIS_BOUNDS, EVERYBODY))
  const absurdFalls = PHYSICAL_SKILL_KEYS.every((k) => absurd[k] < PEAK[k])
  console.log(
    `        at shares of 0.99 she still falls: ${absurdFalls ? 'YES' : 'NO'} – ${PHYSICAL_SKILL_KEYS.map((k) => `${k} ${f1(100 * shareOf(absurd, k))}%`).join(' · ')}`,
  )
  console.log('')
}

// =================================================================================================
// §2s THE SWEEP – how the three constants were CHOSEN, against criteria written before it ran
// =================================================================================================
//
// ⭐⭐⭐ THE TWO SEAT CONSTANTS ARE DERIVED FROM THE SHIPPED `ageWeight` LADDER AND ARE NOT FITTED,
// which is what stops them being taste. Each seat moves its attribute exactly ONE RUNG DOWN that
// ladder and no further:
//
//   masseur   stamina 1.6 -> the return's 1.2, i.e. `1 - 1.2/1.6` = 0.25
//             «weekly body work makes her legs age like her return, and never slower than that»
//   partner   return 1.2 -> the groundstrokes' 1.0, i.e. `1 - 1.0/1.2` = 0.1667
//             «match-style practice makes her return age like her rally, and never slower than that»
//
// ⚠⚠ AND THE SHAPE IS SELF-LIMITING BY CONSTRUCTION, which is the property that made this anchor
// worth preferring to a round number: NO SEAT CAN EVER MAKE ITS ATTRIBUTE THE SLOWEST-AGEING ONE.
// The serve is the last thing to go with or without a payroll, which is the sentence `ageWeight`'s
// own row writes («a serve is a career extender»), and no amount of money reverses the order the
// tuned table puts the four in.
//
// ⚠ IT ALSO MEANS THE PARTNER'S SHIELD IS SMALLER THAN THE MASSEUR'S WHILE HIS BILL IS LARGER, and
// that is said out loud rather than smoothed: the ladder's own steps are uneven, the seats are
// priced on their OTHER channels (rust and recovery), and re-pricing a seat is not this spec's to do.
//
// ⭐ THE COACH'S ONE CONSTANT IS THE FITTED ONE. The sweep below moves it against four criteria
// written down before the run, in invariant 5's own shape – «they are written down so the run can
// embarrass them»:
//
//   C1  the fully-staffed team must absorb NO MORE THAN A THIRD of the total decline at 33.
//       Above that the payroll is worth more than the clock and the spec's «immortality button»
//       objection starts to bite in spirit even though it cannot bite in arithmetic.
//   C2  the staffed-vs-unstaffed gap must be AT LEAST ONE SEASON of ageing. Below that it is inside
//       the size of a single lucky season and «you paid and you cannot tell» is true again.
//   C3  ...and AT MOST TWO seasons.
//   C4  the COACH ALONE must be worth at least HALF a season at 33, because §4's own ⭐ says a family
//       paying elite money for a twenty-eight-year-old is «buying nothing at all» and a row that
//       fixes that has to be visible on its own, not only inside a full team.

const RAW_WEIGHT = ECONOMY.development.ageWeight as Record<string, number>
const LADDER_MASSEUR = 1 - (RAW_WEIGHT.ret ?? 1) / (RAW_WEIGHT.stamina ?? 1)
const LADDER_SPARRING = 1 - (RAW_WEIGHT.groundstrokes ?? 1) / (RAW_WEIGHT.ret ?? 1)

/** ⚠ ONE FIXED SYNTHETIC OPPONENT AT THE ELITE BAND'S MIDDLE, built through `kidMatchPlayer` so the
 *  composition is the engine's own. The spec's §3: «she is at 47 on four attributes where the tour's
 *  elite sit at 65-70». 67 is that band's middle, and composure is held at her own so the read is
 *  about the BODY. Zero draws: `basePServe` and `pMatchBo3` are closed forms. */
function winChanceAgainstElite(build: KidSkills): number {
  const profile = { ...DEFAULT_PROFILE, kidName: 'A', kidLastName: 'B' }
  const her = kidMatchPlayer({ seed: 'r44-her', profile, skills: build })
  const elite = kidMatchPlayer({
    seed: 'r44-elite',
    profile: { ...profile, kidName: 'C', kidLastName: 'D' },
    skills: { serve: 67, ret: 67, composure: build.composure, stamina: 67, groundstrokes: 67 },
  })
  const opts: MatchOptions = { surface: 'hard', tour: 'wta', seed: 'r44' }
  return pMatchBo3(basePServe(her, elite, opts), basePServe(elite, her, opts))
}

function sweep(): void {
  console.log('='.repeat(100))
  console.log('§2s HOW THE COACH\'S CONSTANT WAS CHOSEN – the sweep, against criteria fixed before it ran')
  console.log('='.repeat(100))
  console.log('')
  console.log(`  the two seat constants are DERIVED, not swept: masseur ${f2(LADDER_MASSEUR)} (stamina -> the return's weight) ·`)
  console.log(`  partner ${f2(LADDER_SPARRING)} (return -> the groundstrokes' weight). See the block above for why.`)
  console.log('')
  console.log('  C1 team absorbs <= 33% of the decline · C2 gap >= 1 season · C3 gap <= 2 seasons · C4 coach alone >= 0.5 season')
  console.log('')
  const bare = withCare(0, 0, 0, () => walkTo(33, HIS_BOUNDS, NOBODY))
  const at28 = withCare(0, 0, 0, () => walkTo(28, HIS_BOUNDS, NOBODY))
  const at29 = withCare(0, 0, 0, () => walkTo(29, HIS_BOUNDS, NOBODY))
  const oneSeason = PHYSICAL_SKILL_KEYS.reduce((a, k) => a + (at28[k] - at29[k]), 0) / PHYSICAL_SKILL_KEYS.length
  const totalLoss = PHYSICAL_SKILL_KEYS.reduce((a, k) => a + (PEAK[k] - bare[k]), 0)
  console.log(`  yardsticks: one season = ${f2(oneSeason)} points · the whole decline to 33 = ${f2(totalLoss)} points over the four`)
  console.log('')
  console.log(
    `  ${pad('seat scale', 12)}${pad('coach', 8)}${padL('absorbed', 10)}${padL('gap pts', 9)}${padL('seasons', 9)}${padL('coach alone', 13)}${padL('win pp', 8)}  verdict`,
  )
  for (const scale of [0.5, 1, 1.5]) {
    for (const coach of [0, 0.02, 0.04, 0.06, 0.08, 0.1, 0.14, 0.2]) {
      const m = LADDER_MASSEUR * scale
      const p = LADDER_SPARRING * scale
      const team = withCare(m, p, coach, () => walkTo(33, HIS_BOUNDS, EVERYBODY))
      const coachOnly = withCare(m, p, coach, () =>
        walkTo(33, HIS_BOUNDS, { label: 'coach', masseurBonus: null, sparringDriftCut: null, coachRate: ELITE_RATE }),
      )
      const gap = PHYSICAL_SKILL_KEYS.reduce((a, k) => a + (team[k] - bare[k]), 0) / PHYSICAL_SKILL_KEYS.length
      const coachGap =
        PHYSICAL_SKILL_KEYS.reduce((a, k) => a + (coachOnly[k] - bare[k]), 0) / PHYSICAL_SKILL_KEYS.length
      const absorbed = PHYSICAL_SKILL_KEYS.reduce((a, k) => a + (team[k] - bare[k]), 0) / totalLoss
      const winPp = 100 * (winChanceAgainstElite(team) - winChanceAgainstElite(bare))
      const c1 = absorbed <= 1 / 3
      const c2 = gap >= oneSeason
      const c3 = gap <= 2 * oneSeason
      const c4 = coachGap >= 0.5 * oneSeason
      const all = c1 && c2 && c3 && c4
      console.log(
        `  ${pad(f2(scale), 12)}${pad(f2(coach), 8)}${padL(`${f1(100 * absorbed)}%`, 10)}${padL(signed(gap), 9)}${padL(f2(gap / oneSeason), 9)}${padL(f2(coachGap / oneSeason), 13)}${padL(signed(winPp), 8)}  ` +
          `${all ? '⭐ MEETS ALL FOUR' : [c1 ? '' : 'C1', c2 ? '' : 'C2', c3 ? '' : 'C3', c4 ? '' : 'C4'].filter(Boolean).join('+') + ' fails'}`,
      )
    }
  }
  console.log('')
  console.log('  ⭐ THE SELECTION RULE, AND IT IS A RULE RATHER THAN A PREFERENCE: at seat scale 1.00 – the')
  console.log('     derived row – take the SMALLEST coach term that meets all four criteria. «Smallest» is')
  console.log('     the spec\'s own word for this row («a small maintenance term», «all four, slightly»), so')
  console.log('     the criteria set the floor and the spec sets the direction; nothing is left to taste.')
  console.log('')
}

// =================================================================================================
// §3 THE LIVE ARM – real careers, the shipped tick, to thirty-three
// =================================================================================================

/** ⚠ A BENCH DEVICE, STATED RATHER THAN HIDDEN. The staffed arm pays roughly $100k a year more than
 *  the unstaffed one, and a family that goes bankrupt at thirty has not measured a decline – it has
 *  measured a wallet. Both arms are held above the same floor every week, so the entry policy's
 *  reserve test reads the same on both and money is a NON-FACTOR by construction rather than by
 *  hope. It is the same instrument `endings-bench.ts` reaches for when it defuses the bankruptcy
 *  latch to see a full debt spell. */
const SUBSIDY_CENTS = 5_000_000_00

interface LiveRow {
  seed: string
  label: string
  reachedAge: number
  declineStart: number
  /** her own per-attribute peak, tracked the way `world.peakPhysical` tracks the mean */
  peak: KidSkills
  end: KidSkills
  /** weeks past her `declineStart` in which each seat was actually WORKING */
  masseurWeeks: number
  sparringWeeks: number
  declineWeeks: number
  hiredWeek: number | null
  ending: string | null
}

function answerWhateverIsOpen(world: WorldState, rng: ReturnType<typeof openCareer>['rng']): void {
  if (world.fork !== null && world.fork.answer === null) {
    drainLifeBeats(world)
    answerFork(world, 'continue')
  }
  if (pendingBirthday(world) !== null) answerBirthdayNeutral(world)
  drainLifeBeats(world)
  // «one more year» until the game stops asking – the arm that keeps a body on court long enough to
  // be measured. `final: true` is the offer she cannot decline, so it is taken.
  if (world.retirementOffer !== null) answerRetirement(world, world.retirementOffer.final)
  void rng
}

function runLive(preset: Preset, index: number, policy: Policy, staffed: boolean, toAge: number): LiveRow {
  const { world, rng, seed } = openCareer(preset, index, policy)
  const peak: KidSkills = { ...world.skills }
  const row: LiveRow = {
    seed,
    label: staffed ? 'staffed' : 'bare',
    reachedAge: 14,
    declineStart: 0,
    peak,
    end: { ...world.skills },
    masseurWeeks: 0,
    sparringWeeks: 0,
    declineWeeks: 0,
    hiredWeek: null,
    ending: null,
  }
  for (let i = 0; i < (toAge - 14 + 1) * WEEKS_PER_YEAR; i++) {
    if (world.ending !== null) break
    const age = kidAgeExact(world.week, world.profile.birthMonth, world.profile.birthDay)
    if (age >= toAge) break
    world.fundsCents = Math.max(world.fundsCents, SUBSIDY_CENTS)
    // THE HIRE, THROUGH THE REAL COMMANDS AND THE REAL GATE – `masseurUnlocked` is her first
    // counting W-series result, so a career that never turns professional never hires, and the
    // bench cannot accidentally buy a seat the game would refuse.
    // ⚠ THE REFUSALS ARE CAUGHT RATHER THAN PRE-EMPTED, and that is the honest shape: the college
    // freeze throws its OWN sentence out of `guardNotEnded`, so a bench that re-derived «is she
    // frozen» would be keeping a second copy of the engine's rule. Try, and let the game say no.
    if (staffed) {
      if (!(world.masseurHired ?? false) && masseurUnlocked(world)) {
        try {
          hireMasseur(world, true)
          setMasseurSessions(world, ECONOMY.masseur.rungs[ECONOMY.masseur.rungs.length - 1].sessions)
          setMasseurTravels(world, true)
          row.hiredWeek ??= world.week
        } catch {
          /* the freeze, or an ended career – she is not hiring this week */
        }
      }
      if (!(world.sparringHired ?? false) && sparringUnlocked(world)) {
        try {
          hireSparring(world, true)
          setSparringRung(world, ECONOMY.sparring.rungs.length - 1)
          setSparringTravels(world, true)
          row.hiredWeek ??= world.week
        } catch {
          /* as above */
        }
      }
    }
    // ⚠ READ BEFORE THE TICK, which is the only honest moment: `growAndLive` spends the predicates
    // on the world as it stands when phase 4 runs, and `isCompetitionWeek` is what phase 3a asks.
    const bounds = ageCurveOf(world.ageCurve, weeksLostSoFar(world))
    if (age >= bounds.declineStart) {
      row.declineWeeks++
      if (masseurWorksThisWeek(world)) row.masseurWeeks++
      if (sparringWorksThisWeek(world, isCompetitionWeek(world))) row.sparringWeeks++
    }
    stepCareerWeek(world, rng, policy)
    answerWhateverIsOpen(world, rng)
    for (const k of PHYSICAL_SKILL_KEYS) if (world.skills[k] > peak[k]) peak[k] = world.skills[k]
    row.declineStart = ageCurveOf(world.ageCurve, weeksLostSoFar(world)).declineStart
  }
  row.reachedAge = kidAgeExact(world.week, world.profile.birthMonth, world.profile.birthDay)
  row.end = { ...world.skills }
  row.ending = world.ending?.type ?? null
  return row
}

function liveArm(): void {
  console.log('='.repeat(100))
  console.log(`§3 THE LIVE ARM – ${SEEDS} careers x 2 presets, walked through the shipped tick to 33`)
  console.log('='.repeat(100))
  console.log('')
  console.log('  ⚠ BOTH ARMS ARE HELD ABOVE THE SAME CASH FLOOR (see SUBSIDY_CENTS) so a $100k-a-year payroll')
  console.log('    cannot end a career and be read as a decline. What this arm proves is that the wiring reaches')
  console.log('    the SHIPPED tick and that the stand-downs are honoured; §2 is where the sizing is read off.')
  console.log('')
  const presets = [PRESETS[8], PRESETS[6]] // 120k wealthy elite, 25k middle high
  const policy = POLICIES[1] // the player arm – she rests, she skips, she survives to be old
  const rows: LiveRow[] = []
  for (const preset of presets) {
    for (let i = 0; i < SEEDS; i++) {
      rows.push(runLive(preset, i, policy, false, 33))
      rows.push(runLive(preset, i, policy, true, 33))
    }
  }
  const bare = rows.filter((r) => r.label === 'bare')
  const staffed = rows.filter((r) => r.label === 'staffed')
  const reached = (rs: LiveRow[]) => rs.filter((r) => r.declineWeeks > 0)

  console.log(`  careers that reached their own declineStart at all: bare ${reached(bare).length}/${bare.length} · staffed ${reached(staffed).length}/${staffed.length}`)
  console.log(`  careers that hired anybody (the gate is her first counting W-series result): ${staffed.filter((r) => r.hiredWeek !== null).length}/${staffed.length}`)
  console.log('')
  console.log('  ⭐ DID THE SHIELD EVER LAND – weeks past declineStart in which each seat was actually WORKING')
  console.log(`  ${pad('seed', 22)}${padL('decline wks', 12)}${padL('masseur', 10)}${padL('partner', 10)}${padL('reached', 9)}${padL('ending', 12)}`)
  for (const r of staffed) {
    console.log(
      `  ${pad(r.seed, 22)}${padL(r.declineWeeks, 12)}${padL(r.masseurWeeks, 10)}${padL(r.sparringWeeks, 10)}${padL(f1(r.reachedAge), 9)}${padL(r.ending ?? '–', 12)}`,
    )
  }
  console.log('')
  console.log('  ⭐ WHAT SHE RETAINED OF HER OWN PEAK, per attribute, at the age she reached')
  console.log(`  ${pad('seed', 22)}${pad('arm', 10)}${padL('age', 7)}${padL('ds', 7)}${PHYSICAL_SKILL_KEYS.map((k) => padL(k, 15)).join('')}`)
  for (let i = 0; i < bare.length; i++) {
    for (const r of [bare[i], staffed[i]]) {
      if (r.declineWeeks === 0) continue
      const cells = PHYSICAL_SKILL_KEYS.map((k) => padL(`${f1(100 * (r.end[k] / r.peak[k]))}%  ${f1(r.end[k])}`, 15)).join('')
      console.log(`  ${pad(r.seed, 22)}${pad(r.label, 10)}${padL(f1(r.reachedAge), 7)}${padL(f2(r.declineStart), 7)}${cells}`)
    }
  }
  console.log('')
  console.log('  ⚠ THE PAIRS ARE NOT A CLEAN CONTROL AND THAT IS A FINDING RATHER THAN A CAVEAT: the masseur')
  console.log('    already shortens layoffs, `weeksLostSoFar` already pulls `declineStart` earlier through')
  console.log('    `declinePullPerInjuryWeek`, and a staffed career therefore reaches its decline LATER as well')
  console.log('    as falling through it slower. The `ds` column above is that second effect, visible.')
  console.log('')
}

// =================================================================================================

console.log('')
console.log('r44-decline-seats – the bench arm for docs/specs/the-decline-and-the-seats-2026-09.md §4')
console.log(`shipped constants: masseur ${ECONOMY.development.declineCare.masseur.topRungShare} on ${ECONOMY.development.declineCare.masseur.skill} · partner ${ECONOMY.development.declineCare.sparring.topRungShare} on ${ECONOMY.development.declineCare.sparring.skill} · coach ${ECONOMY.development.declineCare.coachMaintenanceTop} on all four`)
console.log(`the ladder the coach's term is placed on: self ${f2(SELF_RATE)} -> elite+great ${f2(ELITE_RATE)} (middle+good ${f2(MIDDLE_RATE)})`)
console.log(`declineFactor at 26 / 29 / 33 on his curve: ${declineFactor(26, HIS_BOUNDS).toExponential(3)} / ${declineFactor(29, HIS_BOUNDS).toExponential(3)} / ${declineFactor(33, HIS_BOUNDS).toExponential(3)}`)
console.log(`isPhysicalSkill says the decline touches: ${PHYSICAL_SKILL_KEYS.join(', ')} (composure excluded: ${!isPhysicalSkill('composure')})`)
console.log('')

if (ACTUATE) actuation()
reproduceTheSpec()
sweep()
isolatedGap()
if (LIVE) liveArm()
