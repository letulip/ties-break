/**
 * r42-team-budget-cap – ROUND 42 #42. THE TEAM BUDGET SPENDS AGAINST THE WHOLE PAYROLL, SO WHAT IS
 * THE RIGHT CAP FOR THREE SEATS?
 *
 * THE OWNER, 15.09: «committed должен это и показывать». The tile lists coach + masseur +
 * psychologist and its meter counted only the coach, so three rows adding to $843 sat under a
 * «committed» of $343.
 *
 * ⚠⚠ THIS IS NOT A DISPLAY CHANGE, WHICH IS WHY THERE IS A BENCH AT ALL. `committedCents` is the
 * figure the meter draws against the CAP, and that cap is `familyWeeklyIncomeCents` – the very
 * denominator `coachMarket`'s `overBudgetCents` is cut from. Folding the payroll into one side
 * without the other would make the meter say the week is full while the card under it says the rung
 * fits. So the engine moved too, and this file measures what that did.
 *
 * ⚠ AND «WHO CAN BE HIRED» IS HONESTLY «WHO IS FLAGGED». `hireCoach` never consults the budget –
 * `overBudgetCents` colours a card and nothing else, which is what keeps this inside «мы ни за что не
 * наказываем» – so every count below is a count of WARNINGS, not of refusals. Said here because the
 * item's own phrase is the stronger one.
 *
 * ⚠⚠ THE PREDICTION IS WRITTEN DOWN IN docs/specs/team-budget-payroll-2026-09.md §3 **BEFORE** THIS
 * FILE WAS FIRST RUN (invariant 5). The cap's own number is the OWNER'S off this table.
 *
 * ⚠ THREE BACKGROUNDS, NOT FOUR. The item's brief says «across the four backgrounds»;
 * `FamilyBackground` is `wealthy | middle | working` and has been since the profile was written. What
 * there are nine of is econ-bench PRESETS (background x opening coach rung), and those are the cells
 * printed below – said out loud rather than quietly printing three rows under a promise of four.
 *
 * ⚠ NO try/catch ANYWHERE: a throw is a finding (house bench law). A rate with no denominator prints
 * `–`, never `0.0`.
 *
 * Run:  npx vite-node tools/r42-team-budget-cap.ts
 *       npx vite-node tools/r42-team-budget-cap.ts -- --seeds 6
 */
import {
  coachMarket,
  hireMasseur,
  hirePsychologist,
  coachBilling,
  masseurUnlocked,
  psychologistUnlocked,
  supportPayrollWeeklyCents,
  type WorldState,
} from '../src/engine/world'
// ⚠ `familyWeeklyIncomeCents` and `householdWeekly` are NOT on the `engine/world` barrel – they are
// screen-facing derivations and are imported from the module that owns them, which is what
// `node scripts/world-map.mjs` says. Asked of the engine's own functions either way: the whole point
// of this bench is that it reads the same arithmetic the meter and the cards read.
import { familyWeeklyIncomeCents, householdWeekly } from '../src/engine/world/coachMarket'
import { openCareer, stepCareerWeek, PRESETS, POLICIES, mean, median } from './econ-bench'
import { money, num, padL, padR } from './_corridor'

const args = process.argv.slice(2)
const argOf = (name: string, fallback: number): number => {
  const i = args.indexOf(`--${name}`)
  return i >= 0 && args[i + 1] ? Number(args[i + 1]) : fallback
}
/** seeds PER PRESET. n = seeds x 9 careers. */
const SEEDS = argOf('seeds', 4)
/** The weeks the market is read at – junior, on-ramp, mid-career, peak. A cap is a thing a family
 *  meets repeatedly, so one snapshot at one week would price it for one moment of one career. */
const SAMPLE_WEEKS = [104, 208, 312, 416]
const WEEKS = SAMPLE_WEEKS[SAMPLE_WEEKS.length - 1]
/** ⚠ THE SAME POLICY ITEMS 25 AND 41 USE, so the three prints describe one family. */
const POLICY = POLICIES[1]

/** ⭐ THE CAP FRACTIONS SWEPT. 1.00 is what ships – the cap is the week's income, whole – and it is
 *  in the list rather than assumed so the shipped column is read the same way as every candidate. */
const CAP_FRACTIONS = [1.0, 0.9, 0.8, 0.7, 0.6, 0.5]

interface Sample {
  background: string
  preset: string
  week: number
  incomeCents: number
  /** the coach she is actually on, weekly – 0 when self-coached */
  coachCents: number
  /** masseur + psychologist, the seats the meter used to ignore */
  payrollCents: number
  /** the household's whole weekly outgoing, the strip's own figure */
  householdOutCents: number
  /** every rung on the market, priced for this family */
  rungCents: number[]
  /** how many rungs the SHIPPED denominator flags (income − payroll) */
  flaggedAfter: number
  /** how many the OLD denominator flagged (income alone) */
  flaggedBefore: number
  /** is the coach she is ON flagged under the new denominator? ⚠ the reading that would feel like a
   *  punishment: a family told its own standing arrangement no longer fits. */
  currentOverAfter: boolean
  currentOverBefore: boolean
  seatsFilled: number
}

/** Walk one career, filling every seat the moment it unlocks, and read the market at each sample
 *  week. ⚠ FILLING EVERY SEAT IS THE ARM, NOT A BIAS: the item exists because the tile lists three
 *  people, and a family with one seat filled cannot answer a question about three. The self-coached
 *  presets stay self-coached, which is what keeps the corpus honest at the other end. */
function runCareer(presetIndex: number, seedIndex: number): Sample[] {
  const preset = PRESETS[presetIndex]
  const { world, rng } = openCareer(preset, seedIndex, POLICY)
  const out: Sample[] = []
  for (let w = 0; w < WEEKS; w++) {
    stepCareerWeek(world, rng, POLICY)
    if (world.ending) break
    if (!(world.masseurHired ?? false) && masseurUnlocked(world)) hireMasseur(world, true)
    if (!(world.psychologistHired ?? false) && psychologistUnlocked(world)) hirePsychologist(world, true)
    if (SAMPLE_WEEKS.includes(world.week)) out.push(readSample(world, preset.background, preset.label))
  }
  return out
}

function readSample(world: WorldState, background: string, presetLabel: string): Sample {
  const incomeCents = familyWeeklyIncomeCents(world)
  const payrollCents = supportPayrollWeeklyCents(world)
  const rows = coachMarket(world)
  const billing = coachBilling(world)
  const current = rows.find((r) => r.current)
  const coachCents = current?.weeklyCents ?? 0
  const budgetAfter = Math.max(0, incomeCents - payrollCents)
  return {
    background,
    preset: presetLabel,
    week: world.week,
    incomeCents,
    coachCents,
    payrollCents,
    householdOutCents: householdWeekly(world, billing.weeklyCents).outgoingCents,
    rungCents: rows.map((r) => r.weeklyCents),
    flaggedAfter: rows.filter((r) => r.weeklyCents > budgetAfter).length,
    flaggedBefore: rows.filter((r) => r.weeklyCents > incomeCents).length,
    currentOverAfter: coachCents > budgetAfter,
    currentOverBefore: coachCents > incomeCents,
    seatsFilled:
      (world.coachId !== null ? 1 : 0) + ((world.masseurHired ?? false) ? 1 : 0) + ((world.psychologistHired ?? false) ? 1 : 0),
  }
}

const pctOf = (a: number, b: number) => (b === 0 ? null : (100 * a) / b)

function shareRow(label: string, rows: Sample[]): void {
  if (rows.length === 0) {
    console.log(`  ${padR(label, 30)}${padL('– no samples –', 20)}`)
    return
  }
  const payrollShare = rows.map((r) => pctOf(r.coachCents + r.payrollCents, r.incomeCents)).filter((x): x is number => x !== null)
  const supportShare = rows.map((r) => pctOf(r.payrollCents, r.incomeCents)).filter((x): x is number => x !== null)
  const outShare = rows.map((r) => pctOf(r.householdOutCents, r.incomeCents)).filter((x): x is number => x !== null)
  console.log(
    `  ${padR(label, 30)}${padL(money(median(rows.map((r) => r.incomeCents))), 14)}` +
      `${padL(money(median(rows.map((r) => r.coachCents))), 13)}${padL(money(median(rows.map((r) => r.payrollCents))), 13)}` +
      `${padL(payrollShare.length === 0 ? '–' : `${median(payrollShare).toFixed(0)}%`, 14)}` +
      `${padL(supportShare.length === 0 ? '–' : `${median(supportShare).toFixed(0)}%`, 13)}` +
      `${padL(outShare.length === 0 ? '–' : `${median(outShare).toFixed(0)}%`, 14)}` +
      `${padL(num(mean(rows.map((r) => r.seatsFilled)), 2), 9)}${padL(rows.length, 7)}`,
  )
}

function main(): void {
  console.log('\n⭐⭐ ROUND 42 #42 – THE TEAM BUDGET AGAINST THE WHOLE PAYROLL, AND WHAT CAP FITS THREE SEATS')
  console.log(
    `\n  ${SEEDS} seeds x ${PRESETS.length} presets, policy '${POLICY.label}', market read at weeks ` +
      `${SAMPLE_WEEKS.join(' / ')}; every seat is filled the week it unlocks`,
  )

  const samples: Sample[] = []
  for (let p = 0; p < PRESETS.length; p++) for (let s = 0; s < SEEDS; s++) samples.push(...runCareer(p, s))
  console.log(`  ${samples.length} market readings in all\n`)
  if (samples.length === 0) {
    console.log('  ⚠⚠ NO SAMPLES – every career ended before the first sample week. This print is a NULL ARM.')
    return
  }

  // --- §1 what the payroll actually costs ------------------------------------------------------------
  console.log('\n§1 WHAT THE PAYROLL COSTS, as a share of the week\'s income (medians)\n')
  console.log(
    `  ${padR('cell', 30)}${padL('income/wk', 14)}${padL('coach', 13)}${padL('support', 13)}` +
      `${padL('payroll/inc', 14)}${padL('support/inc', 13)}${padL('household/inc', 14)}${padL('seats', 9)}${padL('n', 7)}`,
  )
  for (const bg of ['working', 'middle', 'wealthy']) shareRow(`background · ${bg}`, samples.filter((r) => r.background === bg))
  console.log('')
  for (const week of SAMPLE_WEEKS) shareRow(`week ${week}`, samples.filter((r) => r.week === week))
  console.log('')
  shareRow('ALL', samples)
  console.log(
    '\n  ⚠ «household/inc» IS THE STRIP\'S OWN OUT FIGURE over the same income – the training bill, the' +
      '\n    payroll, the shelf and the upkeep. It is the number that says whether a cap of 100% of the' +
      '\n    week\'s income is a ceiling the family could ever actually reach.',
  )

  // --- §2 what the new denominator flags -------------------------------------------------------------
  console.log('\n\n§2 ⭐⭐ WHAT THE CHANGE DOES TO THE MARKET\'S WARNINGS (the item\'s own question)\n')
  console.log(
    `  ${padR('cell', 30)}${padL('rungs flagged BEFORE', 22)}${padL('rungs flagged AFTER', 22)}` +
      `${padL('her own coach flagged', 24)}${padL('n', 7)}`,
  )
  const flagRow = (label: string, rows: Sample[]) => {
    if (rows.length === 0) {
      console.log(`  ${padR(label, 30)}${padL('– no samples –', 22)}`)
      return
    }
    const rungs = rows.reduce((s, r) => s + r.rungCents.length, 0)
    const before = rows.reduce((s, r) => s + r.flaggedBefore, 0)
    const after = rows.reduce((s, r) => s + r.flaggedAfter, 0)
    const curBefore = rows.filter((r) => r.currentOverBefore).length
    const curAfter = rows.filter((r) => r.currentOverAfter).length
    console.log(
      `  ${padR(label, 30)}${padL(`${before} of ${rungs}  ${num(pctOf(before, rungs))}%`, 22)}` +
        `${padL(`${after} of ${rungs}  ${num(pctOf(after, rungs))}%`, 22)}` +
        `${padL(`${curBefore} -> ${curAfter} of ${rows.length}`, 24)}${padL(rows.length, 7)}`,
    )
  }
  for (const bg of ['working', 'middle', 'wealthy']) flagRow(`background · ${bg}`, samples.filter((r) => r.background === bg))
  console.log('')
  for (const week of SAMPLE_WEEKS) flagRow(`week ${week}`, samples.filter((r) => r.week === week))
  console.log('')
  flagRow('ALL', samples)

  // --- §3 the cap sweep ------------------------------------------------------------------------------
  console.log('\n\n§3 ⭐⭐⭐ THE CAP ITSELF – a cap sized for one seat against a payroll of three\n')
  console.log(
    '  Each row prices a cap of `fraction x the week\'s income`, with the SHIPPED payroll-inclusive' +
      '\n  denominator. 1.00 is what ships. The column that decides it is the last one: a cap that flags' +
      '\n  the coach a family is ALREADY PAYING is a cap that punishes a standing arrangement, and this' +
      '\n  game does not do that («мы ни за что не наказываем»).\n',
  )
  console.log(
    `  ${padR('cap', 10)}${padL('rungs flagged', 20)}${padL('her own coach flagged', 24)}` +
      `${padL('families over the cap', 24)}${padL('median free/wk', 18)}`,
  )
  for (const f of CAP_FRACTIONS) {
    let rungs = 0
    let flagged = 0
    let curFlagged = 0
    let overCap = 0
    const free: number[] = []
    for (const r of samples) {
      const cap = r.incomeCents * f
      const budget = Math.max(0, cap - r.payrollCents)
      rungs += r.rungCents.length
      flagged += r.rungCents.filter((c) => c > budget).length
      if (r.coachCents > budget) curFlagged++
      if (r.coachCents + r.payrollCents > cap) overCap++
      free.push(cap - r.coachCents - r.payrollCents)
    }
    console.log(
      `  ${padR(f.toFixed(2), 10)}${padL(`${flagged} of ${rungs}  ${num(pctOf(flagged, rungs))}%`, 20)}` +
        `${padL(`${curFlagged} of ${samples.length}  ${num(pctOf(curFlagged, samples.length))}%`, 24)}` +
        `${padL(`${overCap} of ${samples.length}  ${num(pctOf(overCap, samples.length))}%`, 24)}` +
        `${padL(money(median(free)), 18)}`,
    )
  }

  // --- §4 actuation ----------------------------------------------------------------------------------
  console.log('\n\n§4 ACTUATION – the payroll term must move the flags, or §2 is a null\n')
  let movedBySupport = 0
  let anySupport = 0
  for (const r of samples) {
    if (r.payrollCents > 0) anySupport++
    if (r.flaggedAfter !== r.flaggedBefore) movedBySupport++
  }
  console.log(`  readings whose support payroll is non-zero at all: ${anySupport} of ${samples.length}`)
  console.log(`  readings where the flagged count actually changed : ${movedBySupport} of ${samples.length}`)
  const wired = anySupport > 0 && movedBySupport > 0
  console.log(`  -> the payroll term is ${wired ? 'WIRED' : '**NOT WIRED – §2 AND §3 ARE NULLS**'}`)
  if (anySupport === 0) {
    console.log(
      '  ⚠⚠ THE SEATS ARE NEVER FILLED ON THIS CORPUS, so nothing here is about three seats. That is a' +
        '\n     finding about the WALK (the unlock never fires), not about the cap.',
    )
  }
}

main()
