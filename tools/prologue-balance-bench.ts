// THE PROLOGUE BALANCE BENCH – phase 9, measured (docs/specs/childhood-prologue-balance-2026-09.md).
//
// Invariant 5: a balance change ships with a bench run and a spec recording PREDICTED vs MEASURED.
// This is that bench, and it prints its own CONTROL beside every number so the "before" is not a
// figure somebody remembered – the same shape `tools/childhood-bench.ts` uses in its PART A.
//
//   PART A – THE LADDER. The rung every reachable childhood arrives on, over all 32 runs x 3
//   origins, against the even fifth of weighted `teaching` this pass replaces.
//
//   PART B – THE SPAN. What the card table can move her mean attribute by, against what the MODEL
//   can (neglected -> devoted). The pass widens the first without touching the second.
//
//   PART C – THE RESERVE. What each background opens on, against the flat $8k / $25k / $120k the
//   game has always used and against the swing this pass narrows.
//
//   PART D – THE RUNWAY. ⭐⭐ THE ACCEPTANCE, AND IT IS A CONDITION RATHER THAN A NUMBER: the poorest
//   arrival must survive its first season with the coach it ARRIVES WITH. Walked, not argued – a
//   real career from week 0 under the game's own entry policy, reporting the week the family first
//   goes under water.
//
//   PART E – THE WEEKLY FIGURE. What the nine years cost per week, which is the sentence the
//   handover now carries, beside what a coach costs per week in the game she is about to play.
//
// ⚠⚠ THE CONTROL ARMS ARE TRANSCRIPTIONS AND THE LIVE ARMS ARE READ FROM SOURCE. `BEFORE_OPTIONS`
// and `beforeCoachTier` / `beforeFundsCents` below are the shipped values this pass replaces, typed
// out once; everything else walks `PROLOGUE_CARDS`, `prologueCoachTier` and `prologueFundsCents` as
// they actually are. So the AFTER column can never go stale, and the BEFORE column is a fixed
// reference that says what changed.
//
// ⚠ PART D BUILDS WORLDS AND TICKS THEM, which every other part of this file does not. It uses
// `stepCareerWeek` from `tools/econ-bench.ts` rather than a second copy of the entry policy – that
// function exists precisely so the world's evolution is defined in one place.
import {
  createWorld,
  openingCoachId,
  prologueCoachTier,
  PROLOGUE_COACH_LADDER,
  STARTING_FUNDS_CENTS,
  type WorldState,
} from '../src/engine/world'
import { rngFromSeed } from '../src/engine/rng'
import { financeWindow } from '../src/engine/world/ledger'
import { ECONOMY, prologueFundsCents } from '../src/engine/economy'
import { SKILL_KEYS } from '../src/engine/development'
import { startingSkills, withHeadStart } from '../src/engine/world/player'
import {
  childhoodArrival,
  devotedChildhood,
  medianChildhood,
  neglectedChildhood,
  weightAt,
  type ChildhoodYear,
} from '../src/engine/childhood'
import { WEEKS_IN_SEASON } from '../src/shared/dates'
import { APPETITE_AT, CARD_AGES, PROLOGUE_CARDS } from '../src/prologue/cards'
import {
  EMPTY_RUN,
  cardFor,
  chosenYears,
  spentCents,
  withOrigin,
  withPick,
  type PrologueRun,
} from '../src/prologue/run'
import { DEFAULT_PROFILE, WEEK_PLAN_PRESETS, type CoachTier, type FamilyBackground, type PlayerProfile } from '../src/shared/protocol'
import { coachWeeklyBandCents } from '../src/engine/coach'
import { POLICIES, stepCareerWeek } from './econ-bench'

const BACKGROUNDS: readonly FamilyBackground[] = ['working', 'middle', 'wealthy']
const DECISION_AGES = PROLOGUE_CARDS.filter((c) => c.options).map((c) => c.age)
/** seeds for the pure-arithmetic parts (A, B, C) – they are cheap */
const SEEDS = 4000
/** seeds for PART D, which builds and ticks a world per seed */
const CAREER_SEEDS = 24
/** PART D walks three seasons so "the runway" is a number rather than a yes/no */
const CAREER_WEEKS = 3 * WEEKS_IN_SEASON

const money = (cents: number) => `$${Math.round(cents / 100).toLocaleString('en-US')}`

/** Every childhood the table can produce: four binary decisions at 8..11 settle the twelfth's face,
 *  and the face offers two answers of its own. 2^4 x 2 = 32. */
function everyRun(origin: FamilyBackground = 'middle'): PrologueRun[] {
  const out: PrologueRun[] = []
  const step = (i: number, run: PrologueRun): void => {
    if (i === DECISION_AGES.length - 1) {
      for (const opt of cardFor(12, run).options ?? []) out.push(withPick(run, 12, opt.id))
      return
    }
    for (const opt of PROLOGUE_CARDS.find((c) => c.age === DECISION_AGES[i])?.options ?? []) {
      step(i + 1, withPick(run, DECISION_AGES[i], opt.id))
    }
  }
  step(0, withOrigin(EMPTY_RUN, origin))
  return out
}

const RUNS = everyRun()
const CHEAPEST = RUNS.reduce((a, b) => (spentCents(a) <= spentCents(b) ? a : b))
const DEAREST = RUNS.reduce((a, b) => (spentCents(a) >= spentCents(b) ? a : b))

// =================================================================================================
// THE CONTROLS – the shipped rules this pass replaces, transcribed once
// =================================================================================================

/** what the eight paired options were before the widening: [share, teaching] */
const BEFORE_OPTIONS: Readonly<Record<string, readonly [number, number]>> = {
  municipal: [0.6, 0.35],
  club: [0.85, 0.8],
  group: [0.6, 0.45],
  'one-to-one': [0.85, 1],
  'stay-home': [0.7, 0.5],
  enter: [0.75, 0.5],
  'ordinary-school': [0.6, 0.5],
  'sports-school': [0.95, 0.85],
  'let-her-stop': [0.35, 0.3],
  'finish-the-year': [0.75, 0.6],
  'keep-the-size': [0.7, 0.6],
  'give-her-the-year': [1, 0.95],
}

/** the shipped rung rule: an even fifth of weighted `teaching`, blind to the family */
function beforeCoachTier(years: readonly ChildhoodYear[]): CoachTier {
  const ladder: readonly CoachTier[] = ['self', 'budget', 'middle', 'high', 'elite']
  return ladder[Math.max(0, Math.min(4, Math.floor(taughtShare(years) * 5)))]
}

/** the shipped reserve model: the clamped spend over `startingFundsCents.middle` */
function beforeFundsCents(background: FamilyBackground, spent: number): number {
  const base = ECONOMY.startingFundsCents[background]
  const { referenceSpendCents, spendSwingCents } = ECONOMY.prologue
  const moved = Math.max(-spendSwingCents, Math.min(spendSwingCents, referenceSpendCents - spent))
  return Math.round(base * (1 + moved / ECONOMY.startingFundsCents.middle))
}

function taughtShare(years: readonly ChildhoodYear[]): number {
  let taught = 0
  let mass = 0
  for (const y of years) {
    const w = weightAt(y.age)
    taught += w * Math.max(0, Math.min(1, y.teaching))
    mass += w
  }
  return mass > 0 ? taught / mass : 0
}

/** The years a run comes to under the CONTROL option numbers – the same walk through the same nine
 *  cards with only the eight paired options put back to what they were. `APPETITE_AT` is the card
 *  table's own copy of `appetiteAt`, pinned against the real function by `tests/prologue-cards
 *  .test.ts`, so the before-arm converts share to practice exactly the way `run.ts` does. */
function beforeYears(run: PrologueRun): ChildhoodYear[] {
  return chosenYears(run).map((y) => {
    const card = cardFor(y.age, run)
    const optId = card.sameAsLastYear ? run.picks[12] : card.options ? run.picks[y.age] : undefined
    const before = optId === undefined ? undefined : BEFORE_OPTIONS[optId]
    if (!before) return y
    return { age: y.age, practice: before[0] * APPETITE_AT[y.age], teaching: before[1], focus: y.focus }
  })
}

function meanAttrAt14(years: readonly ChildhoodYear[]): number {
  let total = 0
  for (let i = 0; i < SEEDS; i++) {
    const seed = `balance-${i}`
    const born = withHeadStart(startingSkills(seed, DEFAULT_PROFILE), DEFAULT_PROFILE.birthMonth)
    const arrival = childhoodArrival(born, years)
    let m = 0
    for (const k of SKILL_KEYS) m += arrival[k]
    total += m / SKILL_KEYS.length
  }
  return total / SEEDS
}

// =================================================================================================
console.log('=== PART A – the rung she arrives on, over 32 runs x 3 origins ===\n')
// =================================================================================================

console.log('BEFORE – an even fifth of weighted `teaching`, and the family is not in the answer.')
console.log('⚠ THE BEFORE ARM IS THE OLD RULE ON THE OLD TABLE. Feeding it the widened table instead')
console.log('  is a contaminated control, and it prints a different answer – both rows are below.')
{
  for (const [label, pick] of [['old rule, old table', beforeYears], ['old rule, NEW table', chosenYears]] as const) {
    const tally: Record<string, number> = {}
    for (const run of RUNS) {
      const rung = beforeCoachTier(pick(run))
      tally[rung] = (tally[rung] ?? 0) + 1
    }
    console.log(
      `  ${label.padEnd(20)} ` +
        Object.entries(tally)
          .map(([k, n]) => `${k} ${n}/32`)
          .join('   '),
    )
  }
  console.log('  ⚠ the defect he found in play – a MIDDLE family on the dearest branch – arrived on')
  console.log(
    `     ${beforeCoachTier(beforeYears(DEAREST))}, and the widened table would have made the same rule reach ` +
      `${beforeCoachTier(chosenYears(DEAREST))}`,
  )
}

console.log('\nAFTER – his ladder, the origin picks the pair and the childhood picks within it:')
for (const bg of BACKGROUNDS) {
  const tally: Record<string, number> = {}
  for (const run of everyRun(bg)) {
    const rung = prologueCoachTier(bg, chosenYears(run))
    tally[rung] = (tally[rung] ?? 0) + 1
  }
  const [cheap, dear] = PROLOGUE_COACH_LADDER[bg]
  console.log(
    `  ${bg.padEnd(9)} ruled [${cheap}, ${dear}]  measured  ` +
      Object.entries(tally)
        .map(([k, n]) => `${k} ${n}/32`)
        .join('   '),
  )
}
{
  const reached = new Set<string>()
  for (const bg of BACKGROUNDS) for (const run of everyRun(bg)) reached.add(prologueCoachTier(bg, chosenYears(run)))
  console.log(`  rungs reachable at all: ${[...reached].sort().join(', ')}  (of self/budget/middle/high/elite)`)
  const ordinary = taughtShare(medianChildhood())
  const shares = RUNS.map((r) => taughtShare(chosenYears(r))).sort((a, b) => a - b)
  console.log(
    `  the branch cut is the ORDINARY childhood's own teaching: ${ordinary.toFixed(4)}` +
      `   run shares span [${shares[0].toFixed(4)}, ${shares[shares.length - 1].toFixed(4)}]`,
  )
  let cheapSide = 0
  for (const s of shares) if (s < ordinary) cheapSide++
  console.log(`  cheap branch ${cheapSide}/32   dear branch ${32 - cheapSide}/32`)
  // the alternative selector, measured rather than asserted
  let agree = 0
  for (const run of RUNS) {
    const byTeaching = taughtShare(chosenYears(run)) >= ordinary
    const byMoney = spentCents(run) >= ECONOMY.prologue.referenceSpendCents
    if (byTeaching === byMoney) agree++
  }
  console.log(`  ⚠ the money selector would agree on ${agree}/32 runs – see the spec's §1`)
}

// =================================================================================================
console.log('\n=== PART B – what the card table can move her by, against what the MODEL can ===\n')
// =================================================================================================

const modelLo = meanAttrAt14(neglectedChildhood())
const modelMid = meanAttrAt14(medianChildhood())
const modelHi = meanAttrAt14(devotedChildhood())
const modelSpan = modelHi - modelLo
console.log(
  `MODEL   neglected ${modelLo.toFixed(3)}   median ${modelMid.toFixed(3)}   devoted ${modelHi.toFixed(3)}` +
    `   span ${modelSpan.toFixed(3)}`,
)
for (const [label, pick] of [['BEFORE', beforeYears], ['AFTER ', chosenYears]] as const) {
  const means = RUNS.map((r) => meanAttrAt14(pick(r))).sort((a, b) => a - b)
  const span = means[means.length - 1] - means[0]
  console.log(
    `${label}  worst ${means[0].toFixed(3)}   best ${means[means.length - 1].toFixed(3)}` +
      `   span ${span.toFixed(3)}   = ${((span / modelSpan) * 100).toFixed(1)}% of the model`,
  )
}

// =================================================================================================
console.log('\n=== PART C – the reserve she starts the game with ===\n')
// =================================================================================================

console.log(
  `the swing: shipped ${(ECONOMY.prologue.spendSwingCents / ECONOMY.startingFundsCents.middle).toFixed(3)}` +
    ` of the family's own reserve (never written down)  ->  ${ECONOMY.prologue.reserveSwingShare.toFixed(3)} (named)`,
)
console.log('\nbackground   flat        BEFORE min  BEFORE max  AFTER min   AFTER max   AFTER median')
for (const bg of BACKGROUNDS) {
  const runs = everyRun(bg)
  const before = runs.map((r) => beforeFundsCents(bg, spentCents(r))).sort((a, b) => a - b)
  const after = runs.map((r) => prologueFundsCents(bg, spentCents(r))).sort((a, b) => a - b)
  console.log(
    `${bg.padEnd(12)} ${money(STARTING_FUNDS_CENTS[bg]).padEnd(11)} ${money(before[0]).padEnd(11)} ` +
      `${money(before[before.length - 1]).padEnd(11)} ${money(after[0]).padEnd(11)} ` +
      `${money(after[after.length - 1]).padEnd(11)} ${money(after[Math.floor(after.length / 2)])}`,
  )
}

// =================================================================================================
console.log(`\n=== PART D – the runway: does the poorest arrival survive its first season? ===`)
console.log(`(a real career from week 0 under econ-bench's own entry policy, ${CAREER_SEEDS} seeds, ${CAREER_WEEKS} weeks)\n`)
// =================================================================================================

/** ⭐ WHERE THE FIRST SEASON'S MONEY WENT – the acceptance asks what the runway is SPENT on, and the
 *  answer has to come off the same ledger the Money screen reads rather than off a guess. Walked to
 *  week 52 exactly, whatever happens after it. */
function firstSeasonSpend(bg: FamilyBackground, years: readonly ChildhoodYear[], funds: number, rung: CoachTier): Map<string, number> {
  const totals = new Map<string, number>()
  for (let i = 0; i < CAREER_SEEDS; i++) {
    const seed = `balance-runway-${bg}-${i}`
    const profile: PlayerProfile = { ...DEFAULT_PROFILE, background: bg }
    const world = createWorld(seed, profile, `rw-${i}`, { years, spentCents: 0 })
    world.profile = { ...world.profile, coachTier: rung }
    world.coachId = openingCoachId(seed, world.profile)
    world.fundsCents = funds
    const rng = rngFromSeed(world.seed)
    for (let w = 0; w < WEEKS_IN_SEASON; w++) stepCareerWeek(world, rng, POLICIES[0])
    const fold = financeWindow(world.financeWeeks, 0)
    for (const [cat, amt] of Object.entries(fold.byCategory)) {
      totals.set(cat, (totals.get(cat) ?? 0) + (amt ?? 0) / CAREER_SEEDS)
    }
  }
  return totals
}

function spendLine(label: string, totals: Map<string, number>): void {
  const rows = [...totals.entries()].sort((a, b) => a[1] - b[1])
  const spend = rows.filter(([, v]) => v < 0).map(([k, v]) => `${k} ${money(-v)}`)
  const income = rows.filter(([, v]) => v > 0).map(([k, v]) => `${k} +${money(v)}`)
  console.log(`  ${label.padEnd(26)} out: ${spend.join('  ')}`)
  console.log(`  ${''.padEnd(26)} in:  ${income.join('  ')}`)
}

/** The week the family first goes under water, or null if it never does inside the horizon. */
function underWaterWeek(seedIdx: number, bg: FamilyBackground, years: readonly ChildhoodYear[], funds: number, rung: CoachTier): number | null {
  const seed = `balance-runway-${bg}-${seedIdx}`
  const profile: PlayerProfile = { ...DEFAULT_PROFILE, background: bg }
  const world: WorldState = createWorld(seed, profile, `rw-${seedIdx}`, { years, spentCents: 0 })
  // ⚠⚠ THE RUNG HAS TO BE FORCED ON BOTH THE PROFILE AND `coachId`, OR THE ARM IS NULL. `createWorld`
  // derives the rung from the years and overwrites what the profile carried, and the weekly bill
  // reads `world.coachId` rather than `profile.coachTier` (world/player.ts says so in as many words).
  // The first draft of this walk set only the profile and printed BYTE-IDENTICAL rows for `high` and
  // `budget` – a null arm that looked exactly like a null result.
  world.profile = { ...world.profile, coachTier: rung }
  world.coachId = openingCoachId(seed, world.profile)
  world.fundsCents = funds
  const rng = rngFromSeed(world.seed)
  if (world.fundsCents < 0) return 0
  for (let w = 0; w < CAREER_WEEKS; w++) {
    stepCareerWeek(world, rng, POLICIES[0])
    if (world.fundsCents < 0) return world.week
  }
  return null
}

function runwayOn(label: string, bg: FamilyBackground, years: readonly ChildhoodYear[], funds: number, rung: CoachTier): void {
  const weeks: (number | null)[] = []
  for (let i = 0; i < CAREER_SEEDS; i++) weeks.push(underWaterWeek(i, bg, years, funds, rung))
  const sank = (weeks.filter((w) => w !== null) as number[]).sort((a, b) => a - b)
  const survivedSeason = weeks.filter((w) => w === null || w > WEEKS_IN_SEASON).length
  const median = sank.length ? sank[Math.floor(sank.length / 2)] : null
  console.log(
    `${label.padEnd(34)} ${money(funds).padEnd(10)} ${rung.padEnd(7)}` +
      ` season survived ${String(survivedSeason).padStart(2)}/${CAREER_SEEDS}` +
      `   under water: earliest wk ${sank.length ? String(sank[0]).padStart(3) : ' - '}` +
      `, median wk ${median === null ? `>${CAREER_WEEKS}` : String(median).padStart(3)}`,
  )
}

console.log('CONTROL – the wizard\'s own working-class career, flat $8,000, no prologue at all:')
for (const rung of ['self', 'budget', 'middle', 'high'] as const) {
  runwayOn(`  wizard flat / ${rung}`, 'working', beforeYears(CHEAPEST), STARTING_FUNDS_CENTS.working, rung)
}

console.log('\nBEFORE – the even fifth, the old table and the shipped reserve:')
for (const bg of ['working', 'middle'] as const) {
  for (const [name, run] of [['dearest ', DEAREST], ['cheapest', CHEAPEST]] as const) {
    runwayOn(
      `  ${bg} / ${name}`,
      bg,
      beforeYears(run),
      beforeFundsCents(bg, spentCents(run)),
      beforeCoachTier(beforeYears(run)),
    )
  }
}

console.log('\nAFTER – the ruled ladder, and the narrowed reserve:')
for (const bg of ['working', 'middle'] as const) {
  for (const [name, run] of [['dearest ', DEAREST], ['cheapest', CHEAPEST]] as const) {
    runwayOn(
      `  ${bg} / ${name}`,
      bg,
      chosenYears(run),
      prologueFundsCents(bg, spentCents(run)),
      prologueCoachTier(bg, chosenYears(run)),
    )
  }
}

// =================================================================================================
console.log('\n=== PART E – what the nine years cost per week, and what a coach costs per week ===\n')
// =================================================================================================

const weeks = CARD_AGES.length * WEEKS_IN_SEASON
console.log(`the childhood is ${CARD_AGES.length} cards x ${WEEKS_IN_SEASON} weeks = ${weeks} weeks`)
for (const [name, run] of [['cheapest', CHEAPEST], ['dearest ', DEAREST]] as const) {
  const total = spentCents(run)
  console.log(`  ${name}  ${money(total).padStart(9)} over the nine years  =  ${money(total / weeks)} a week`)
}
console.log('\n...and the game she is about to play bills a coach BY THE WEEK. The weekly band at 14, on')
console.log('the balanced plan, for a middle family (`coachWeeklyBandCents`, the engine\'s own quote):')
for (const rung of ['self', 'budget', 'middle', 'high', 'elite'] as const) {
  const [lo, hi] = coachWeeklyBandCents(rung, 14, WEEK_PLAN_PRESETS.balanced, 'middle')
  console.log(`  ${rung.padEnd(7)} ${money(lo)}-${money(hi)} a week`)
}

console.log('\n=== PART D2 – and what the poorest arrival\'s first season is SPENT on (mean of the seeds) ===\n')
spendLine(
  'BEFORE  working / dearest',
  firstSeasonSpend('working', beforeYears(DEAREST), beforeFundsCents('working', spentCents(DEAREST)), beforeCoachTier(beforeYears(DEAREST))),
)
spendLine(
  'AFTER   working / dearest',
  firstSeasonSpend('working', chosenYears(DEAREST), prologueFundsCents('working', spentCents(DEAREST)), prologueCoachTier('working', chosenYears(DEAREST))),
)
