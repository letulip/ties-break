// ONE CLOCK – what her age actually gates, measured for three birthdays.
//
//   npx vite-node tools/one-clock.ts [--seeds N] [--weeks N]
//
// ⚠ WHY IT EXISTS. The owner's ruling 1 of 09.08 (docs/specs/round15-triage.md): «Есть год
// рождения и дата. Это всё... Дальше когда ДР – тогда и +1 год.» The engine held TWO ages –
// `ageAtWeek` (the BAND, birth-month-free) and `kidAgeExact` (the GIRL, off the real calendar) –
// and every gate except development read the band. This bench measures what changes when they all
// read the girl, for the three birthdays that bracket the effect: January (the oldest in her band),
// June (the median, and the onboarding default) and December (the youngest).
//
// ⚠ THE NUMBER THAT DECIDES WHETHER THE RULING SHIPS is the last block: a December girl becomes
// W15-eligible eleven months later than a January one and holds a smaller junior allowance for
// every season of her career. That is the relative age effect in its primary form and it is what
// the game set out to model – but if it costs her so much of her season that the career stops being
// playable, that is a finding for the owner and not a knob to turn quietly. So the arm counts DEAD
// WEEKS (weeks with nothing enterable) beside the entries.
//
// MEASUREMENT ONLY. It calls engine predicates and counts. No engine number is written from here.

import {
  availabilityStatus,
  createWorld,
  entryCapUsage,
  proEntryCapUsage,
  answerFork,
  answerRetirement,
  type WorldState,
} from '../src/engine/world'
import { ageAtWeek, kidAgeExact, kidAgeYears, birthdayWeek } from '../src/engine/world/age'
import { TIERS, TIER_LADDER, WEEKS_PER_YEAR } from '../src/engine/season/calendar'
import { ECONOMY } from '../src/engine/economy'
import { rngFromSeed } from '../src/engine/rng'
import { DEFAULT_PROFILE, WEEK_PLAN_PRESETS } from '../src/shared/protocol'
import { KID_ID, recomputeKidRank } from '../src/engine/world'
import { POLICIES, stepCareerWeek, zeroByTier } from './econ-bench'
import type { SeasonEvent, TierId } from '../src/engine/season/types'

const argv = process.argv.slice(2)
const argOf = (name: string, fallback: number): number => {
  const i = argv.indexOf(`--${name}`)
  return i >= 0 && argv[i + 1] ? Number(argv[i + 1]) : fallback
}
const SEEDS = argOf('seeds', 12)
const WEEKS = argOf('weeks', 208)

const MONTHS: Record<number, string> = { 1: 'January', 6: 'June', 12: 'December' }
const BIRTH_MONTHS = [1, 6, 12]
const pad = (s: string | number, w: number) => String(s).padEnd(w)
const padL = (s: string | number, w: number) => String(s).padStart(w)
const money = (cents: number) => `$${Math.round(cents / 100).toLocaleString('en-US')}`

function section(title: string): void {
  console.log(`\n${'='.repeat(96)}\n${title}\n${'='.repeat(96)}`)
}

/** A world in which NOTHING except the age clock can refuse an entry: money, domestic points and an
 *  ITF/WTA book that clears every acceptance list. The same fixture shape `tests/age-caps.ts` uses,
 *  for the same reason – a probe that trips over an affordability gate measures the wrong rule. */
function openWorld(seed: string, birthMonth: number): WorldState {
  const world = createWorld(seed, { ...DEFAULT_PROFILE, birthMonth, birthDay: 15, coachTier: 'self' })
  world.fundsCents = 9_999_999_00
  world.plan = { ...WEEK_PLAN_PRESETS.balanced }
  world.results.push({ playerId: KID_ID, week: 0, points: 1000, tier: 'national' })
  for (let i = 0; i < 4; i++) world.results.push({ playerId: KID_ID, week: 0, points: 300, tier: 'j300' })
  world.results.push({ playerId: KID_ID, week: 0, points: 400, tier: 'w100' })
  recomputeKidRank(world)
  return world
}

function probeEvent(week: number, tier: TierId): SeasonEvent {
  return {
    id: `probe-${tier}-${week}`,
    week,
    tier,
    surface: 'hard',
    travelCostCents: 100_00,
    deadlineWeek: week - 2,
  }
}

/** IS THE AGE GATE THE THING REFUSING THIS EVENT? Read off the engine's own refusal, never
 *  re-derived here – `availabilityStatus` is the one predicate every surface consults, and its age
 *  arm is the only one that says «opens at» / «has aged out». A cap refusal or a blackout answers
 *  false, which is what makes this "when does her age open the door", not "when can she play". */
function ageRefuses(world: WorldState, week: number, tier: TierId): boolean {
  const s = availabilityStatus(world, probeEvent(week, tier))
  if (s.level !== 'blocked') return false
  const d = s.detail ?? ''
  return d.includes('opens at') || d.includes('aged out')
}

/** The first week in [0, horizon) at which the age gate stops refusing `tier`, or null. */
function firstOpen(world: WorldState, tier: TierId, horizon: number): number | null {
  for (let w = 0; w < horizon; w++) if (!ageRefuses(world, w, tier)) return w
  return null
}

/** ...and the first week AFTER that at which it refuses again (she ages out), or null. */
function firstClosed(world: WorldState, tier: TierId, from: number, horizon: number): number | null {
  for (let w = from; w < horizon; w++) if (ageRefuses(world, w, tier)) return w
  return null
}

// =================================================================================================
// A – THE CLOCK ITSELF: the band, the girl, and where they disagree
// =================================================================================================
function clockArm(): void {
  section('A – THE CLOCK: the band against the girl, at every season boundary')
  console.log(`  ${pad('week', 8)}${pad('band', 8)}${BIRTH_MONTHS.map((m) => pad(`girl(${MONTHS[m].slice(0, 3)})`, 14)).join('')}`)
  for (let s = 0; s <= 5; s++) {
    const w = s * WEEKS_PER_YEAR
    const cells = BIRTH_MONTHS.map((m) => pad(`${kidAgeYears(w, m)}  (${kidAgeExact(w, m).toFixed(2)})`, 14))
    console.log(`  ${pad(`w${w}`, 8)}${pad(ageAtWeek(w), 8)}${cells.join('')}`)
  }
  console.log('')
  for (const m of BIRTH_MONTHS) {
    const bdays = [0, 1, 2, 3, 4].map((s) => birthdayWeek(s * WEEKS_PER_YEAR, m, 15))
    console.log(`  ${pad(MONTHS[m], 10)} birthday weeks: ${bdays.join(', ')}`)
  }
}

// =================================================================================================
// B – WHAT THE AGE GATE OPENS, AND WHEN. Asked of the engine, not of a formula.
// =================================================================================================
function gateArm(): void {
  section(`B – THE AGE GATE, through availabilityStatus (horizon ${WEEKS} weeks)`)
  console.log(`  ${pad('birthday', 12)}${pad('J30 opens', 12)}${pad('J30 closes', 12)}${pad('W15 opens', 12)}${pad('W35 opens', 12)}${pad('WTA250 opens', 14)}`)
  for (const m of BIRTH_MONTHS) {
    const world = openWorld('clock-gate', m)
    const horizon = 6 * WEEKS_PER_YEAR
    const j30 = firstOpen(world, 'j30', horizon)
    const j30Close = j30 === null ? null : firstClosed(world, 'j30', j30 + 1, horizon)
    const cells = [
      pad(j30 === null ? 'never' : `w${j30}`, 12),
      pad(j30Close === null ? '-' : `w${j30Close}`, 12),
      pad(firstOpen(world, 'w15', horizon) === null ? 'never' : `w${firstOpen(world, 'w15', horizon)}`, 12),
      pad(firstOpen(world, 'w35', horizon) === null ? 'never' : `w${firstOpen(world, 'w35', horizon)}`, 12),
      pad(firstOpen(world, 'wta250', horizon) === null ? 'never' : `w${firstOpen(world, 'wta250', horizon)}`, 14),
    ]
    console.log(`  ${pad(MONTHS[m], 12)}${cells.join('')}`)
  }
}

// =================================================================================================
// C – THE TWO ALLOWANCES, season by season. The ITF junior cap and the WTA AER.
// =================================================================================================
function allowanceArm(): void {
  section('C – THE ALLOWANCES per season block, through entryCapUsage / proEntryCapUsage')
  const cap = (n: number) => (n >= Number.MAX_SAFE_INTEGER ? 'unlim' : String(n))
  for (const m of BIRTH_MONTHS) {
    const world = openWorld('clock-cap', m)
    const junior: string[] = []
    const pro: string[] = []
    let juniorTotal = 0
    for (let s = 0; s < 4; s++) {
      const w = s * WEEKS_PER_YEAR + 2
      const j = entryCapUsage(world, w).limit
      junior.push(padL(cap(j), 7))
      pro.push(padL(cap(proEntryCapUsage(world, w).limit), 7))
      juniorTotal += Math.min(j, 40) // a season cannot offer more than ~40 usable weeks
    }
    console.log(`  ${pad(MONTHS[m], 10)} ITF junior: ${junior.join('')}   (4-season allowance ${juniorTotal})`)
    console.log(`  ${pad('', 10)} WTA AER   : ${pro.join('')}`)
  }
}

// =================================================================================================
// D – THE CAREER ARM: what a 208-week career actually enters, and how many weeks are dead
// =================================================================================================
interface CareerOut {
  entries: Record<TierId, number>
  total: number
  intl: number
  pro: number
  deadWeeks: number
  playableWeeks: number
  fundsCents: number
  rank: number
  ended: string | null
}

function runCareer(seed: string, birthMonth: number, weeks: number): CareerOut {
  const world = createWorld(seed, { ...DEFAULT_PROFILE, birthMonth, birthDay: 15, coachTier: 'self' })
  world.coachOnEventWeeks = POLICIES[1].coachOnEventWeeks
  const rng = rngFromSeed(world.seed)
  const entries = zeroByTier()
  let dead = 0
  let playable = 0
  for (let w = 0; w < weeks; w++) {
    // Does this week hold anything at all she may enter? Asked BEFORE the step, off the engine's
    // own gate, so "dead" means what the Season screen would show her: no card she can act on.
    const thisWeek = world.season.filter((e) => e.week === world.week)
    const anyOpen = thisWeek.some((e) => availabilityStatus(world, e).level !== 'blocked')
    if (thisWeek.length > 0) {
      if (anyOpen) playable++
      else dead++
    }
    const got = stepCareerWeek(world, rng, POLICIES[1])
    for (const t of TIER_LADDER) entries[t] += got[t]
    // The career can ask a question that HALTS the advance; a bench answers it and keeps going.
    // Same two answers `tools/ladder-floor.ts` gives, so the arms stay comparable.
    if (world.fork !== null && world.fork.answer === null) answerFork(world, 'continue')
    if (world.retirementOffer !== null) {
      answerRetirement(world, world.retirementOffer.reason === 'plateau' || world.retirementOffer.final)
    }
  }
  // ⚠ SUMMED FROM THE POLICY'S OWN COUNTER, never off `world.internationalEntryWeeks` – that ledger
  // is PRUNED to the current season block (planner.ts) because the cap is a per-season rule, so at
  // week 208 it holds two entries and reads as a career total of nothing.
  return {
    entries,
    total: TIER_LADDER.reduce((n, t) => n + entries[t], 0),
    intl: ECONOMY.entryCap.cappedTiers.reduce((n, t) => n + entries[t], 0),
    pro: ECONOMY.entryCap.cappedProTiers.reduce((n, t) => n + entries[t], 0),
    deadWeeks: dead,
    playableWeeks: playable,
    fundsCents: world.fundsCents,
    rank: world.kidRank,
    ended: world.ending?.type ?? null,
  }
}

function median(xs: number[]): number {
  const s = [...xs].sort((a, b) => a - b)
  return s.length % 2 ? s[(s.length - 1) / 2] : (s[s.length / 2 - 1] + s[s.length / 2]) / 2
}

function careerArm(): void {
  section(`D – THE CAREER: ${SEEDS} seeds x ${WEEKS} weeks, 'player' policy, self-coached`)
  console.log(
    `  ${pad('birthday', 12)}${padL('entries', 9)}${padL('intl', 7)}${padL('pro', 7)}${padL('playable', 10)}${padL('dead', 7)}${padL('funds', 12)}${padL('itf rank', 10)}  tier mix`,
  )
  for (const m of BIRTH_MONTHS) {
    const outs: CareerOut[] = []
    for (let i = 0; i < SEEDS; i++) outs.push(runCareer(`clock-${i}`, m, WEEKS))
    const mix = TIER_LADDER.map((t) => [t, median(outs.map((o) => o.entries[t]))] as const)
      .filter(([, n]) => n > 0)
      .map(([t, n]) => `${TIERS[t].label} ${n}`)
      .join(', ')
    console.log(
      `  ${pad(MONTHS[m], 12)}${padL(median(outs.map((o) => o.total)), 9)}${padL(median(outs.map((o) => o.intl)), 7)}` +
        `${padL(median(outs.map((o) => o.pro)), 7)}${padL(median(outs.map((o) => o.playableWeeks)), 10)}` +
        `${padL(median(outs.map((o) => o.deadWeeks)), 7)}${padL(money(median(outs.map((o) => o.fundsCents))), 12)}` +
        `${padL(median(outs.map((o) => o.rank)), 10)}  ${mix}`,
    )
    const ended = outs.filter((o) => o.ended !== null)
    if (ended.length) console.log(`  ${pad('', 12)}careers that ENDED early: ${ended.length}/${outs.length} (${ended.map((o) => o.ended).join(', ')})`)
  }
}

clockArm()
gateArm()
allowanceArm()
careerArm()
console.log('')
