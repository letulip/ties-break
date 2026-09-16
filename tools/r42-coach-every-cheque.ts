/**
 * r42-coach-every-cheque – ROUND 42 #41. WHAT 10% OF **EVERY** CHEQUE DOES TO THE FAMILY.
 *
 * THE OWNER, 15.09: «я вообще не понял почему мы снова обсуждаем разные проценты, если уже есть
 * исследование на 10% безусловных отчислений с любых призовых, независимо от глубины прохода. И мы
 * говорили, что это будет сделано». The receipt is his own research file –
 * docs/research/team-economics-2026-09.md §2 and finding 3.1.
 *
 * ⚠⚠ THE PREDICTION IS WRITTEN DOWN IN docs/specs/coach-every-cheque-2026-09.md §3 **BEFORE** THIS
 * FILE WAS FIRST RUN (invariant 5). The measured column goes back into that table, misses named as
 * misses. THE NUMBERS STAY HIS: this prints what the change does, it does not argue for it.
 *
 * ⭐ THE CORRIDOR PRINT IS ITEM 25'S, NOT A SECOND ONE (`tools/_corridor.ts`). The brief said so:
 * «the shape item 25's bench already prints – reuse that instrument rather than writing a third
 * one». So §1 and §2 are row-for-row comparable with docs/specs/kid-share-ramp-2026-09.md §4.
 *
 * THE ARMS, on identical seeds and presets:
 *   A · BEFORE   coach 1000 / 500 / 0      – round 24's shape: a title, half a final, nothing else.
 *   B · AFTER    coach 1000 / 1000 / 1000  – what ships: 10% of every cheque, at every finish.
 *   M · +MASSEUR B, plus masseur everyBps 300 – THE OPEN QUESTION he must rule, priced.
 *   0 · ACTUATION coach 5000 everywhere    – an absurd half of every cheque; the wallet must move or
 *                                            every table above is a null («prove the arm», CLAUDE.md).
 *
 * ⚠⚠ THE THING THE ITEM WAS PARKED ON IS §3, NOT §1. «What it does to a mid-career family already
 * near the edge» is a question about a COHORT and not about a mean, so §3 reads the same careers
 * split three ways – by background, by whether the BEFORE arm ever went under water, and by the
 * bottom quartile of the BEFORE arm's own wallet – and prints the survival change per cohort.
 *
 * ⚠ NO try/catch ANYWHERE: a throw is a finding (house bench law). A figure with no denominator
 * prints `–`, never `0.0`.
 *
 * Run:  npx vite-node tools/r42-coach-every-cheque.ts
 *       npx vite-node tools/r42-coach-every-cheque.ts -- --seeds 4 --short
 */
import { ECONOMY } from '../src/engine/economy'
import { WEEKS_PER_YEAR } from '../src/engine/season/calendar'
import { hireMasseur, masseurUnlocked } from '../src/engine/world'
import { openCareer, stepCareerWeek, PRESETS, POLICIES, mean, median } from './econ-bench'
import { corridor, money, num, padL, padR, readCorridor, signedPct, type CorridorRead } from './_corridor'

const args = process.argv.slice(2)
const argOf = (name: string, fallback: number): number => {
  const i = args.indexOf(`--${name}`)
  return i >= 0 && args[i + 1] ? Number(args[i + 1]) : fallback
}
/** seeds PER PRESET. n = seeds x 9 careers per arm – item 25's own corpus size. */
const SEEDS = argOf('seeds', 4)
/** ⭐ ITEM 25'S TWO HORIZONS, so the two specs' tables sit beside each other. */
const HORIZONS = [400, 600]
/** §1 and §3 only – for a repair pass on the cohort split, which is the expensive part to get right
 *  and the cheap part to re-run. */
const SHORT = args.includes('--short')
const START_AGE = 14
/** ⚠⚠ `POLICIES[1]` ('player') AND NOT `POLICIES[0]`, AND THE CHOICE IS ITEM 25'S, INHERITED ON
 *  PURPOSE. The 'grinder' arm keeps no reserve and bankrupts most of the corpus on a 400-week
 *  horizon, which makes «the family's corridor» a question about who died first. Two arms measured
 *  on two different policies would also not be readable against item 25's shipped table. */
const POLICY = POLICIES[1]

/** The three rates of one seat, as a bench arm. ⚠ `ECONOMY` is `as const`, so an arm reaches it
 *  through the cast the house benches already use (`tools/band-vs-field.ts`, `tools/fatigue-bench.ts`). */
interface Rates {
  titleBps: number
  finalBps: number
  everyBps: number
}
const COACH = ECONOMY.staffShare.coach as unknown as Rates
const MASSEUR = ECONOMY.staffShare.masseur as unknown as Rates
const SHIPPED_COACH: Rates = { ...COACH }
const SHIPPED_MASSEUR: Rates = { ...MASSEUR }

interface Arm {
  label: string
  coach: Rates
  masseur: Rates
  /** ⭐⭐ §4 ONLY, AND IT IS THE REPAIR OF A NULL ARM. The first run of this bench measured the
   *  masseur question at «$0 against $0 – 0 of 36 careers whose masseur was paid a share at all»,
   *  because `econ-bench`'s walk never hires a support seat: the question had no subject. So the
   *  masseur arms HIRE HIM the week the seat unlocks, both of them, and the only difference between
   *  the two columns is his `everyBps`. ⚠ A comparison where one arm hires and the other does not
   *  would price the SEAT, not the rate. */
  hireMasseurSeat?: boolean
}
const BEFORE: Arm = {
  label: 'A · BEFORE 10/5/0',
  coach: { titleBps: 1000, finalBps: 500, everyBps: 0 },
  masseur: { ...SHIPPED_MASSEUR },
}
const AFTER: Arm = {
  label: 'B · AFTER 10 everywhere',
  coach: { titleBps: 1000, finalBps: 1000, everyBps: 1000 },
  masseur: { ...SHIPPED_MASSEUR },
}
/** ⭐ THE QUESTION HE RULES: does the masseur follow the coach onto every cheque, or stay a
 *  title-and-final bonus? `everyBps: 300` is «the same road, at his own rate» – the round-24 sizing
 *  («по-меньше чем тренеру», roughly a third) carried onto the tail, which is the only shape of the
 *  change that does not also re-rule his rate. */
const AFTER_MASSEUR: Arm = {
  label: 'M · +masseur 3 everywhere',
  coach: { ...AFTER.coach },
  masseur: { titleBps: 300, finalBps: 150, everyBps: 300 },
  hireMasseurSeat: true,
}
/** §4's control: the SAME hired seat on round 24's rates, so the two columns differ by one number. */
const AFTER_MASSEUR_CONTROL: Arm = {
  label: 'M0 · masseur on round 24 rates',
  coach: { ...AFTER.coach },
  masseur: { ...SHIPPED_MASSEUR },
  hireMasseurSeat: true,
}
const ABSURD: Arm = {
  label: '0 · ACTUATION coach 50%',
  coach: { titleBps: 5000, finalBps: 5000, everyBps: 5000 },
  masseur: { ...SHIPPED_MASSEUR },
}

interface Read extends CorridorRead {
  /** ⭐ THE CENTS THE COACH ACTUALLY TOOK over the whole walk, folded off the durable ledger the
   *  engine wrote (`FinanceWeek.coachCut.cents`) rather than re-derived from the finishes – so this
   *  is what the wallet was really debited by and not a second opinion about it. */
  coachCutCents: number
  /** how many WEEKS of the walk paid the coach a result share at all – the «is the memo still
   *  almost always silent?» reading item 41 names as a side effect. */
  coachCutWeeks: number
  /** the cents the masseur took, same fold, for the open question in §4. ⚠ The masseur's share has
   *  no memo of its own, so this is folded off the `staff` expense rows the engine wrote. */
  masseurCutCents: number
  /** the gross prize the tennis produced over the walk – the family's banked part plus her share,
   *  which is how `tests/prize-money.test.ts` reassembles a cheque. The denominator of «what share
   *  of the prize money does the coach take». */
  grossPrizeCents: number
  /** how many pro cheques the walk collected at all, for the per-cheque view in §2. */
  prizeCheques: number
  /** ⭐ IS THERE A COACH AT ALL? A self-coached family cannot be touched by this item, and §3's
   *  cohorts are meaningless without it – the first run measured the poorest quartile moving by
   *  exactly $0 and the explanation is in this field, not in the balance. */
  coached: boolean
}

/** The masseur's result share, folded off the rows the engine wrote. ⚠ MATCHED ON THE TEXT, because
 *  `category: 'staff'` also carries his weekly salary and the psychologist's, and a fold that took
 *  the whole category would report a salary as a share. The prefix is the engine's own literal at
 *  the accrue site in `finalizeTournament` – measurement only, nothing here changes a string. */
const MASSEUR_SHARE_PREFIX = "Masseur's share of the prize money"

function runCareer(presetIndex: number, seedIndex: number, weeks: number, hireMasseurSeat: boolean): Read {
  const preset = PRESETS[presetIndex]
  const { world, rng } = openCareer(preset, seedIndex, POLICY)
  let weeksUnderWater = 0
  for (let w = 0; w < weeks; w++) {
    stepCareerWeek(world, rng, POLICY)
    if (world.fundsCents < 0) weeksUnderWater++
    if (world.ending) break
    // ⚠ §4's arms only – see `Arm.hireMasseurSeat`. It is done identically in BOTH masseur columns,
    // so the difference between them is the rate and nothing else.
    if (hireMasseurSeat && !(world.masseurHired ?? false) && masseurUnlocked(world)) hireMasseur(world, true)
  }
  let coachCutCents = 0
  let coachCutWeeks = 0
  let grossPrizeCents = 0
  let prizeCheques = 0
  // ⚠ `financeWeeks` PRUNES ON A 60-WEEK WINDOW for the per-week memo fields and NOT for the fold
  // below – so `coachCut` read here is the RETAINED window, not the career. That is named rather
  // than papered over: §2 prints the window's own reading and says what it is. The career-length
  // figure that IS honest is the `coaching` expense category in `careerTotals`, but it holds the
  // weekly bill too and cannot be split. See §2's note.
  for (const fw of world.financeWeeks) {
    if (fw.coachCut && fw.coachCut.cents > 0) {
      coachCutCents += fw.coachCut.cents
      coachCutWeeks++
    }
    const kidPrize = fw.kidShare?.prize?.cents ?? 0
    const prizeRow = fw.byCategory.prize ?? 0
    if (prizeRow > 0 || kidPrize > 0) {
      grossPrizeCents += prizeRow + kidPrize
      prizeCheques++
    }
  }
  let masseurCutCents = 0
  for (const e of world.events) {
    if (e.category === 'staff' && e.text.startsWith(MASSEUR_SHARE_PREFIX)) masseurCutCents += -(e.amountCents ?? 0)
  }
  return {
    ...readCorridor(world, preset.background, weeksUnderWater),
    coachCutCents,
    coachCutWeeks,
    masseurCutCents,
    grossPrizeCents,
    prizeCheques,
    coached: world.coachId !== null,
  }
}

function runArm(arm: Arm, weeks: number, seeds: number): Read[] {
  Object.assign(COACH, arm.coach)
  Object.assign(MASSEUR, arm.masseur)
  const out: Read[] = []
  for (let p = 0; p < PRESETS.length; p++) {
    for (let s = 0; s < seeds; s++) out.push(runCareer(p, s, weeks, arm.hireMasseurSeat ?? false))
  }
  return out
}

function restore(): void {
  // ⚠ A bench that leaves the engine on its last arm is a bench that lies to whatever runs after it
  // in the same process. Restored after every section, not only at the end.
  Object.assign(COACH, SHIPPED_COACH)
  Object.assign(MASSEUR, SHIPPED_MASSEUR)
}

// --- §2 what the coach actually took -------------------------------------------------------------

function cutSection(title: string, before: Read[], after: Read[]): void {
  console.log(`\n${title}\n`)
  console.log(`  ${padR('', 46)}${padL('BEFORE 10/5/0', 18)}${padL('AFTER 10 flat', 18)}${padL('delta', 18)}`)
  const row = (label: string, a: number, b: number, fmt: (x: number) => string) =>
    console.log(`  ${padR(label, 46)}${padL(fmt(a), 18)}${padL(fmt(b), 18)}${padL(`${fmt(b - a)}  ${signedPct(b - a, a)}`, 18)}`)
  row("the COACH's cut, mean per career", mean(before.map((c) => c.coachCutCents)), mean(after.map((c) => c.coachCutCents)), money)
  row("the COACH's cut, median", median(before.map((c) => c.coachCutCents)), median(after.map((c) => c.coachCutCents)), money)
  row('gross prize in the same window, mean', mean(before.map((c) => c.grossPrizeCents)), mean(after.map((c) => c.grossPrizeCents)), money)
  const share = (rows: Read[]) => {
    const g = rows.reduce((s, c) => s + c.grossPrizeCents, 0)
    return g === 0 ? 0 : (100 * rows.reduce((s, c) => s + c.coachCutCents, 0)) / g
  }
  console.log(
    `  ${padR('his cut as a share of that gross prize', 46)}${padL(`${share(before).toFixed(2)}%`, 18)}` +
      `${padL(`${share(after).toFixed(2)}%`, 18)}${padL(`${(share(after) - share(before)).toFixed(2)} pp`, 18)}`,
  )
  // ⭐ ITEM 41'S NAMED SIDE EFFECT: «once the cut is on every cheque, item 11's memo line is almost
  // never silent». Counted rather than asserted.
  const paying = (rows: Read[]) => {
    const ch = rows.reduce((s, c) => s + c.prizeCheques, 0)
    return ch === 0 ? null : (100 * rows.reduce((s, c) => s + c.coachCutWeeks, 0)) / ch
  }
  const pb = paying(before)
  const pa = paying(after)
  console.log(
    `  ${padR('⭐ prize weeks that pay him at all (item 11)', 46)}${padL(pb === null ? '–' : `${pb.toFixed(1)}%`, 18)}` +
      `${padL(pa === null ? '–' : `${pa.toFixed(1)}%`, 18)}`,
  )
  console.log(
    '\n  ⚠ THE CUT AND THE GROSS ARE BOTH READ OFF `financeWeeks`, WHICH PRUNES ON A 60-WEEK WINDOW.' +
      '\n    So these are «the retained window of the career», identically for both arms and therefore' +
      '\n    a sound COMPARISON – but they are NOT career totals and must not be quoted as such.',
  )
}

// --- §3 the cohort that parked the item ------------------------------------------------------------

/** One cohort's before/after, in the four numbers that say whether a family is in trouble. */
function cohort(label: string, before: Read[], after: Read[]): void {
  if (before.length === 0) {
    console.log(`  ${padR(label, 34)}${padL('– no careers in this cohort –', 30)}`)
    return
  }
  const under = (rows: Read[]) => rows.filter((c) => c.weeksUnderWater > 0).length
  const dead = (rows: Read[]) => rows.filter((c) => c.ended !== null).length
  const wkUnder = (rows: Read[]) => mean(rows.map((c) => c.weeksUnderWater))
  // ⭐⭐ THE COLUMN THAT EXPLAINS A ZERO. A cohort with no coach in it cannot move under this item at
  // all, and the first run of this bench printed a poorest quartile moving by exactly $0 with no
  // account of itself. «Coached» is the account.
  const coached = (rows: Read[]) => rows.filter((c) => c.coached).length
  console.log(
    `  ${padR(label, 34)}${padL(money(median(before.map((c) => c.fundsCents))), 15)}` +
      `${padL(money(median(after.map((c) => c.fundsCents))), 15)}` +
      `${padL(signedPct(median(after.map((c) => c.fundsCents)) - median(before.map((c) => c.fundsCents)), median(before.map((c) => c.fundsCents))), 10)}` +
      `${padL(`${under(before)}→${under(after)}`, 12)}${padL(`${num(wkUnder(before))}→${num(wkUnder(after))}`, 14)}` +
      `${padL(`${dead(before)}→${dead(after)}`, 10)}${padL(`${coached(before)}/${before.length}`, 10)}` +
      `${padL(money(mean(after.map((c) => c.coachCutCents))), 14)}${padL(`${before.length}`, 5)}`,
  )
}

function edgeSection(before: Read[], after: Read[]): void {
  console.log(
    '\n\n§3 ⭐⭐ THE COHORT THAT PARKED THE ITEM – «a mid-career family already near the edge»\n' +
      '\n  ⚠ COHORTS ARE CUT ON THE **BEFORE** ARM AND THE SAME SEEDS ARE READ IN BOTH COLUMNS, which is' +
      '\n    the only honest way to ask «what happened to the families that were already struggling»:' +
      '\n    cutting on the after arm would select the families the change itself pushed down.\n',
  )
  console.log(
    `  ${padR('cohort (cut on the BEFORE arm)', 34)}${padL('wallet BEFORE', 15)}${padL('wallet AFTER', 15)}` +
      `${padL('delta', 10)}${padL('under water', 12)}${padL('wks under', 14)}${padL('ended', 10)}` +
      `${padL('coached', 10)}${padL('his cut AFTER', 14)}${padL('n', 5)}`,
  )
  const pairs = before.map((b, i) => ({ b, a: after[i] }))
  for (const bg of ['working', 'middle', 'wealthy']) {
    const sel = pairs.filter((p) => p.b.background === bg)
    cohort(`background · ${bg}`, sel.map((p) => p.b), sel.map((p) => p.a))
  }
  const wet = pairs.filter((p) => p.b.weeksUnderWater > 0)
  cohort('⭐ ever under water BEFORE', wet.map((p) => p.b), wet.map((p) => p.a))
  const dry = pairs.filter((p) => p.b.weeksUnderWater === 0)
  cohort('   never under water BEFORE', dry.map((p) => p.b), dry.map((p) => p.a))
  const sorted = [...pairs].sort((x, y) => x.b.fundsCents - y.b.fundsCents)
  const q = Math.max(1, Math.round(sorted.length / 4))
  const poor = sorted.slice(0, q)
  cohort('⭐ poorest quartile BEFORE', poor.map((p) => p.b), poor.map((p) => p.a))
  const rich = sorted.slice(-q)
  cohort('   richest quartile BEFORE', rich.map((p) => p.b), rich.map((p) => p.a))

  // ⭐⭐ AND THE SURVIVAL QUESTION, ASKED PER CAREER RATHER THAN PER MEAN: «whether careers that
  // survived now go under, and how many». A career is COUNTED ONLY WHEN ITS PAIR CHANGED STATE, so
  // the number is a census and not a difference of two counts that could hide two moves cancelling.
  let newlyUnder = 0
  let newlyDry = 0
  let newlyEnded = 0
  let newlySurvived = 0
  const newlyUnderRows: { b: Read; a: Read }[] = []
  for (const p of pairs) {
    if (p.b.weeksUnderWater === 0 && p.a.weeksUnderWater > 0) {
      newlyUnder++
      newlyUnderRows.push(p)
    }
    if (p.b.weeksUnderWater > 0 && p.a.weeksUnderWater === 0) newlyDry++
    if (p.b.ended === null && p.a.ended !== null) newlyEnded++
    if (p.b.ended !== null && p.a.ended === null) newlySurvived++
  }
  console.log(
    `\n  ⭐⭐ SURVIVAL, CAREER BY CAREER (n = ${pairs.length}):` +
      `\n     went under water only in the AFTER arm : ${newlyUnder}` +
      `\n     went under water only in the BEFORE arm: ${newlyDry}` +
      `\n     ended early only in the AFTER arm      : ${newlyEnded}` +
      `\n     ended early only in the BEFORE arm     : ${newlySurvived}`,
  )
  for (const p of newlyUnderRows) {
    console.log(
      `       · ${padR(p.b.background, 9)} wallet ${padL(money(p.b.fundsCents), 14)} -> ${padL(money(p.a.fundsCents), 14)}` +
        `, ${p.a.weeksUnderWater} weeks under, coach took ${money(p.a.coachCutCents)} (was ${money(p.b.coachCutCents)})`,
    )
  }
  console.log(
    '\n  ⚠ A CAREER THAT CHANGED STATE IN EITHER DIRECTION IS A CAREER WHOSE ENTRY DECISIONS MOVED,' +
      '\n    which is the policy re-deciding on a different wallet and not noise – but with a corpus this' +
      '\n    size a single career is one career, and the report says so rather than reading a rate off it.',
  )
}

// --- §4 the masseur's open question ----------------------------------------------------------------

function masseurSection(after: Read[], both: Read[]): void {
  console.log(
    '\n\n§4 ⚠⚠ THE OPEN QUESTION – DOES THE MASSEUR FOLLOW? (the owner rules; this prices it)\n' +
      '\n  BOTH columns carry the coach on every cheque AND BOTH HIRE THE MASSEUR the week his seat' +
      '\n  unlocks. The only difference between them is his `everyBps`: round 24`s title-and-final bonus' +
      '\n  against the same road at his own 3% rate.' +
      '\n  ⚠ THE FIRST RUN OF THIS SECTION WAS A NULL ARM AND IT IS RECORDED RATHER THAN ERASED: it' +
      '\n    compared two arms neither of which ever hired him, printed $0 against $0, and said so.\n',
  )
  console.log(`  ${padR('', 46)}${padL('masseur 3/1.5/0', 20)}${padL('masseur 3/1.5/3', 20)}${padL('delta', 18)}`)
  const row = (label: string, a: number, b: number, fmt: (x: number) => string) =>
    console.log(`  ${padR(label, 46)}${padL(fmt(a), 20)}${padL(fmt(b), 20)}${padL(`${fmt(b - a)}  ${signedPct(b - a, a)}`, 18)}`)
  row("the MASSEUR's cut, mean per career", mean(after.map((c) => c.masseurCutCents)), mean(both.map((c) => c.masseurCutCents)), money)
  row('FAMILY wallet – mean', mean(after.map((c) => c.fundsCents)), mean(both.map((c) => c.fundsCents)), money)
  row('FAMILY wallet – median', median(after.map((c) => c.fundsCents)), median(both.map((c) => c.fundsCents)), money)
  const under = (rows: Read[]) => rows.filter((c) => c.weeksUnderWater > 0).length
  const dead = (rows: Read[]) => rows.filter((c) => c.ended !== null).length
  console.log(
    `  ${padR('careers ever under water', 46)}${padL(`${under(after)} of ${after.length}`, 20)}${padL(`${under(both)} of ${both.length}`, 20)}`,
  )
  console.log(
    `  ${padR('careers that ended before the horizon', 46)}${padL(`${dead(after)} of ${after.length}`, 20)}${padL(`${dead(both)} of ${both.length}`, 20)}`,
  )
  // ⚠ THE SEAT IS NOT ALWAYS FILLED, AND A ZERO HERE WOULD OTHERWISE READ AS «IT COSTS NOTHING».
  const withMasseur = both.filter((c) => c.masseurCutCents > 0).length
  console.log(
    `\n  ⚠ careers whose masseur was actually paid a share at all: ${withMasseur} of ${both.length}` +
      `${withMasseur === 0 ? '  — **NULL ARM: the seat is never filled on this corpus and §4 proves nothing**' : ''}`,
  )
}

function main(): void {
  console.log('\n⭐⭐ ROUND 42 #41 – THE COACH TAKES 10% OF EVERY CHEQUE: THE FAMILY CORRIDOR, BEFORE AND AFTER')
  console.log(
    `\n  shipped now: coach ${SHIPPED_COACH.titleBps / 100}% title / ${SHIPPED_COACH.finalBps / 100}% final / ` +
      `${SHIPPED_COACH.everyBps / 100}% every other finish` +
      `  ·  masseur ${SHIPPED_MASSEUR.titleBps / 100} / ${SHIPPED_MASSEUR.finalBps / 100} / ${SHIPPED_MASSEUR.everyBps / 100}`,
  )
  console.log(`  ${SEEDS} seeds x ${PRESETS.length} presets = ${SEEDS * PRESETS.length} careers per arm, policy '${POLICY.label}'`)

  const horizons = SHORT ? [HORIZONS[0]] : HORIZONS
  let firstBefore: Read[] = []
  let firstAfter: Read[] = []
  for (const weeks of horizons) {
    const age = START_AGE + weeks / WEEKS_PER_YEAR
    const before = runArm(BEFORE, weeks, SEEDS)
    const after = runArm(AFTER, weeks, SEEDS)
    restore()
    corridor(
      `\n§${weeks === HORIZONS[0] ? 1 : 2} THE FAMILY CORRIDOR AT WEEK ${weeks} (she is ~${age.toFixed(1)})`,
      before,
      after,
      ['BEFORE 10/5/0', 'AFTER 10 flat'],
    )
    cutSection(`   ...and what the coach actually took, at week ${weeks}`, before, after)
    if (weeks === HORIZONS[0]) {
      firstBefore = before
      firstAfter = after
    }
  }

  edgeSection(firstBefore, firstAfter)

  const masseurControl = runArm(AFTER_MASSEUR_CONTROL, HORIZONS[0], SEEDS)
  const both = runArm(AFTER_MASSEUR, HORIZONS[0], SEEDS)
  restore()
  masseurSection(masseurControl, both)

  // --- actuation ------------------------------------------------------------------------------------
  const absurdSeeds = Math.max(2, Math.floor(SEEDS / 2))
  const absurd = runArm(ABSURD, HORIZONS[0], absurdSeeds)
  const live = runArm(AFTER, HORIZONS[0], absurdSeeds)
  restore()
  console.log('\n\n§5 ACTUATION – the dial must move the output, or every table above is a null\n')
  const wLive = mean(live.map((c) => c.fundsCents))
  const wAbsurd = mean(absurd.map((c) => c.fundsCents))
  const cLive = mean(live.map((c) => c.coachCutCents))
  const cAbsurd = mean(absurd.map((c) => c.coachCutCents))
  console.log(`  coach 10% of every cheque: his cut ${money(cLive)}, family wallet ${money(wLive)}`)
  console.log(`  coach 50% of every cheque: his cut ${money(cAbsurd)}, family wallet ${money(wAbsurd)}`)
  console.log(`  -> the rate is ${cAbsurd > cLive && wAbsurd < wLive ? 'WIRED' : '**NOT WIRED – EVERY ROW ABOVE IS A NULL**'}`)
  console.log(
    `\n  ⚠ AND THE READER IS PRESENT IN BOTH ARMS BY CONSTRUCTION: every arm sets all three rates on ` +
      `the\n    live \`ECONOMY.staffShare\` object the engine reads, in one process, so «a constant without ` +
      `its\n    reader» (CLAUDE.md) cannot happen here – there is no second tree.`,
  )
  console.log(
    `\n  restored: coach ${COACH.titleBps}/${COACH.finalBps}/${COACH.everyBps}, ` +
      `masseur ${MASSEUR.titleBps}/${MASSEUR.finalBps}/${MASSEUR.everyBps}`,
  )
}

main()
