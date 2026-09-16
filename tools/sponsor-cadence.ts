/**
 * sponsor-cadence – ROUND 42 #5, RE-RUN FOR #43. HOW OFTEN DOES THE SHOP ACTUALLY CHIP IN?
 *
 * THE OWNER, 15.09: «Спонсор деньгами реально засыпает рабочую раз в 3-4 недели» – and then, off
 * this bench's own printed table: «сними потолок, а кулдаун давай 4» (round 42 #43).
 *
 * ⭐⭐⭐ ROUND 42 #43 – `seasonCap` IS GONE FROM THE ENGINE, constant and reader both, so it is gone
 * from the arms too: an arm can no longer set a dial that does not exist. The cap-bearing arms of the
 * #5 run are NOT re-printed here – their numbers are in the spec's §3 table and the engine can no
 * longer produce them. What survives is a cooldown sweep, because the cooldown is now the whole
 * mechanism and it is the one constant he would move next.
 *
 * ⚠⚠ THE PREDICTION IS WRITTEN DOWN IN docs/specs/sponsor-cadence-2026-09.md §3 **BEFORE** THIS FILE
 * WAS FIRST RUN (invariant 5). The measured column goes back into that table, misses included.
 *
 * WHAT IT MEASURES. Real careers through the shipped engine – no second implementation of the gate,
 * of the bill or of the wallet. The cameo weeks are read off the rows the tick actually wrote, so a
 * cheque counted here is a cheque the player would have seen.
 *
 * ⚠ THE A ARM IS THE PRE-WAVE RULE SPELLED AS A SETTING OF THE DIAL: `cooldownWeeks 0` IS a
 * memoryless weekly Bernoulli at `ECONOMY.sponsor.rollChance`, which is exactly what the block was
 * before this item (and, with the cap gone, the ONLY thing that separates it from the shipped arm). It is not the old CODE – the old code rolled on MAIN
 * and this rolls on the cameo's own sub-stream – and that difference is deliberate and harmless: two
 * independent uniform streams tested at the same p are the same process, and running the A arm
 * through the new derivation is what makes the two columns differ by the DIAL and by nothing else.
 *
 * ⚠ ACTUATION IS PROVEN IN THE RUN, NOT ASSUMED. The last arm sets `cooldownWeeks` to an absurd 40;
 * if its cadence does not collapse, the dial is not wired and every other row is a null. The report
 * says so out loud rather than printing a table nobody can trust.
 *
 * ⚠ NO try/catch ANYWHERE: a throw is a finding (house bench law). A rate with no denominator prints
 * `–`, never `0.0`.
 *
 * Run:  npx vite-node tools/sponsor-cadence.ts
 *       npx vite-node tools/sponsor-cadence.ts -- --seeds 8 --weeks 208
 */
import { ECONOMY } from '../src/engine/economy'
import { WEEKS_PER_YEAR } from '../src/engine/season/calendar'
import { openCareer, stepCareerWeek, PRESETS, POLICIES, mean, median } from './econ-bench'

const args = process.argv.slice(2)
const argOf = (name: string, fallback: number): number => {
  const i = args.indexOf(`--${name}`)
  return i >= 0 && args[i + 1] ? Number(args[i + 1]) : fallback
}
/** seeds PER PRESET. n = seeds x PRESETS.length careers per arm. */
const SEEDS = argOf('seeds', 6)
/** Four seasons from fourteen – the junior years, which is where his working family lives and where
 *  the need gate stands open week after week. */
const WEEKS = argOf('weeks', 4 * WEEKS_PER_YEAR)

/** The one row the cameo writes. ⚠ Matched on the TEXT because `category: 'sponsor'` has five other
 *  writers in this engine (retainers, ad cheques, the shoot clash, the kit rollover) and the amount
 *  bands overlap. Measurement only – nothing here changes the string, which is his. */
const CAMEO_LINE = 'A local sponsor chipped in!'

/** The dial, as a bench arm. ⚠ `ECONOMY` is `as const`, so an arm reaches it through the cast the
 *  house benches already use (`tools/band-vs-field.ts`, `tools/fatigue-bench.ts`).
 *  ⭐ ROUND 42 #43 – one field, not two: `seasonCap` no longer exists on `ECONOMY.sponsor`. */
interface Dials {
  cooldownWeeks: number
}
const DIALS = ECONOMY.sponsor as unknown as Dials
const SHIPPED: Dials = { cooldownWeeks: DIALS.cooldownWeeks }

interface Arm {
  label: string
  dials: Dials
  /** the arm the report leads with, and the one the spec's predicted column is about */
  headline?: boolean
}

const ARMS: Arm[] = [
  { label: 'A · BEFORE – no cooldown, no cap', dials: { cooldownWeeks: 0 } },
  { label: 'B · HIS RULING – cooldown 4 ⭐', dials: { cooldownWeeks: 4 }, headline: true },
  { label: '   cooldown 5', dials: { cooldownWeeks: 5 } },
  { label: '   cooldown 6 (the #5 arm, no cap)', dials: { cooldownWeeks: 6 } },
  { label: '   cooldown 8', dials: { cooldownWeeks: 8 } },
  { label: 'ACTUATION · cooldown 40', dials: { cooldownWeeks: 40 } },
]

interface CareerRead {
  background: string
  /** the weeks a cheque actually landed, ascending */
  weeks: number[]
  centsTotal: number
  /** the largest number of cheques any one season of this career took */
  maxInSeason: number
  seasons: number
}

function runCareer(presetIndex: number, seedIndex: number): CareerRead {
  const preset = PRESETS[presetIndex]
  const { world, rng } = openCareer(preset, seedIndex, POLICIES[0])
  const weeks: number[] = []
  let centsTotal = 0
  for (let w = 0; w < WEEKS; w++) {
    stepCareerWeek(world, rng, POLICIES[0])
    if (world.ending) break
    for (const e of world.events) {
      if (e.week === world.week && e.category === 'sponsor' && e.text === CAMEO_LINE) {
        weeks.push(e.week)
        centsTotal += e.amountCents ?? 0
      }
    }
  }
  const bySeason = new Map<number, number>()
  for (const w of weeks) {
    const s = Math.floor(w / WEEKS_PER_YEAR)
    bySeason.set(s, (bySeason.get(s) ?? 0) + 1)
  }
  const counts = [...bySeason.values()]
  return {
    background: preset.background,
    weeks,
    centsTotal,
    maxInSeason: counts.length === 0 ? 0 : Math.max(...counts),
    seasons: Math.max(1, Math.ceil(WEEKS / WEEKS_PER_YEAR)),
  }
}

function runArm(arm: Arm): CareerRead[] {
  DIALS.cooldownWeeks = arm.dials.cooldownWeeks
  const out: CareerRead[] = []
  for (let p = 0; p < PRESETS.length; p++) {
    for (let s = 0; s < SEEDS; s++) out.push(runCareer(p, s))
  }
  return out
}

interface Cadence {
  careers: number
  cheques: number
  perSeason: number
  dollarsPerSeason: number
  meanGap: number | null
  medianGap: number | null
  minGap: number | null
  gapsUnder5: number
  /** ⭐ ROUND 42 #43 – gaps that land EXACTLY on the cooldown floor. With `cooldownWeeks` 4 this is
   *  «did the four-week cadence he complained about come back», counted rather than reassured. */
  gapsAtFloor: number
  gaps: number
  maxInSeason: number
}

/** ⚠⚠ `cooldown` IS PASSED IN AND THE FIRST VERSION OF THIS FUNCTION READ IT OFF `DIALS`, WHICH WAS
 *  WRONG AND IS RECORDED RATHER THAN QUIETLY FIXED. Every arm is RUN first and PRINTED afterwards,
 *  by which point the shipped dials have been restored – so `P(gap=floor)` was measuring every arm
 *  against the SHIPPED cooldown of 4 and the header claimed the opposite. The bug was visible in the
 *  print: the actuation arm reported a «floor» share at 4 weeks while its own cooldown was 40. */
function cadenceOf(rows: CareerRead[], cooldown: number): Cadence {
  const gaps: number[] = []
  let cheques = 0
  let cents = 0
  let seasons = 0
  let maxInSeason = 0
  for (const r of rows) {
    cheques += r.weeks.length
    cents += r.centsTotal
    seasons += r.seasons
    maxInSeason = Math.max(maxInSeason, r.maxInSeason)
    for (let i = 1; i < r.weeks.length; i++) gaps.push(r.weeks[i] - r.weeks[i - 1])
  }
  return {
    careers: rows.length,
    cheques,
    perSeason: seasons === 0 ? 0 : cheques / seasons,
    dollarsPerSeason: seasons === 0 ? 0 : cents / 100 / seasons,
    meanGap: gaps.length === 0 ? null : mean(gaps),
    medianGap: gaps.length === 0 ? null : median(gaps),
    minGap: gaps.length === 0 ? null : Math.min(...gaps),
    gapsUnder5: gaps.filter((g) => g <= 4).length,
    gapsAtFloor: gaps.filter((g) => g === cooldown).length,
    gaps: gaps.length,
    maxInSeason,
  }
}

// --- formatting ------------------------------------------------------------------------------------

const padR = (s: string | number, n: number) => String(s).padEnd(n)
const padL = (s: string | number, n: number) => String(s).padStart(n)
const num = (x: number | null, d = 1) => (x === null ? '–' : x.toFixed(d))
const money = (x: number) => `$${Math.round(x).toLocaleString('en-US')}`
const pct = (num_: number, den: number) => (den === 0 ? '–' : `${((100 * num_) / den).toFixed(1)}%`)

function header(title: string): void {
  console.log(`\n  ${padR(title, 34)}${padL('cheques/season', 16)}${padL('$/season', 12)}${padL('vs BEFORE', 12)}` +
    `${padL('mean gap', 10)}${padL('median', 8)}${padL('min gap', 9)}${padL('P(gap<=4)', 11)}` +
    `${padL('P(gap=floor)', 14)}${padL('max/season', 12)}`)
}

/** ⭐ THE COLUMN HE MOVES THE DIAL ON: what the arm costs the family against the pre-wave rule, in
 *  percent of the cameo money it used to bank. `base` is arm A's own figure on the same careers. */
function row(label: string, c: Cadence, base: number | null): void {
  const delta =
    base === null || base === 0 ? '–' : `${c.dollarsPerSeason >= base ? '+' : ''}${((100 * (c.dollarsPerSeason - base)) / base).toFixed(0)}%`
  console.log(
    `  ${padR(label, 34)}${padL(num(c.perSeason, 2), 16)}${padL(money(c.dollarsPerSeason), 12)}${padL(delta, 12)}` +
      `${padL(num(c.meanGap), 10)}${padL(num(c.medianGap), 8)}${padL(num(c.minGap, 0), 9)}` +
      `${padL(pct(c.gapsUnder5, c.gaps), 11)}${padL(pct(c.gapsAtFloor, c.gaps), 14)}${padL(c.maxInSeason, 12)}`,
  )
}

function main(): void {
  const seasons = (WEEKS / WEEKS_PER_YEAR).toFixed(0)
  console.log('\n⭐⭐ ROUND 42 #5 – THE LOCAL SPONSOR\'S CADENCE, BEFORE AND AFTER')
  console.log(
    `\n  ${SEEDS} seeds x ${PRESETS.length} presets = ${SEEDS * PRESETS.length} careers per arm, ` +
      `${WEEKS} weeks (${seasons} seasons) from fourteen`,
  )
  console.log(
    `  the gate itself is UNTOUCHED: rollChance ${ECONOMY.sponsor.rollChance}, ` +
      `$${ECONOMY.sponsor.amountCents[0] / 100}-${ECONOMY.sponsor.amountCents[1] / 100}, ` +
      `runway ${ECONOMY.sponsor.runwayWeeks} court-weeks, no coach dearer than ${ECONOMY.sponsor.maxCoachTier}`,
  )
  console.log(`  ⭐ SHIPPED TODAY: cooldownWeeks ${SHIPPED.cooldownWeeks}, NO season cap (round 42 #43 – his ruling)`)
  console.log('  ⚠ «P(gap=floor)» is read against EACH ARM\'s OWN cooldown (passed into `cadenceOf`), so the shipped row')
  console.log('    answers his own question: a cooldown of 4 leaves a four-week gap LEGAL, and this is how often it happens.')

  const results = ARMS.map((arm) => ({ arm, rows: runArm(arm) }))
  // ⚠ Restore the shipped dials before anything else reads them – a bench that leaves the engine on
  // its last arm is a bench that lies to whatever runs after it in the same process.
  DIALS.cooldownWeeks = SHIPPED.cooldownWeeks

  console.log('\n\n§1 HIS FAMILY – «рабочая»: every working-background preset\n')
  header('arm')
  const workingBase = cadenceOf(results[0].rows.filter((r) => r.background === 'working'), results[0].arm.dials.cooldownWeeks)
    .dollarsPerSeason
  for (const { arm, rows } of results) {
    row(arm.label, cadenceOf(rows.filter((r) => r.background === 'working'), arm.dials.cooldownWeeks), workingBase)
  }

  console.log('\n\n§2 EVERY BACKGROUND, the whole corpus\n')
  header('arm')
  const allBase = cadenceOf(results[0].rows, results[0].arm.dials.cooldownWeeks).dollarsPerSeason
  for (const { arm, rows } of results) row(arm.label, cadenceOf(rows, arm.dials.cooldownWeeks), allBase)

  console.log('\n\n§3 PER BACKGROUND, before against after\n')
  const before = results[0]
  const after = results.find((r) => r.arm.headline)!
  console.log(`  ${padR('background', 12)}${padL('BEFORE $/season', 18)}${padL('AFTER $/season', 17)}` +
    `${padL('BEFORE /season', 17)}${padL('AFTER /season', 16)}${padL('BEFORE P(<=4)', 16)}${padL('AFTER P(<=4)', 15)}`)
  for (const bg of ['working', 'middle', 'wealthy']) {
    const b = cadenceOf(before.rows.filter((r) => r.background === bg), before.arm.dials.cooldownWeeks)
    const a = cadenceOf(after.rows.filter((r) => r.background === bg), after.arm.dials.cooldownWeeks)
    console.log(
      `  ${padR(bg, 12)}${padL(money(b.dollarsPerSeason), 18)}${padL(money(a.dollarsPerSeason), 17)}` +
        `${padL(num(b.perSeason, 2), 17)}${padL(num(a.perSeason, 2), 16)}` +
        `${padL(pct(b.gapsUnder5, b.gaps), 16)}${padL(pct(a.gapsUnder5, a.gaps), 15)}`,
    )
  }

  // --- the actuation proof, read off the run -------------------------------------------------------
  const absurdResult = results[results.length - 1]
  const absurd = cadenceOf(absurdResult.rows, absurdResult.arm.dials.cooldownWeeks)
  const shipped = cadenceOf(after.rows, after.arm.dials.cooldownWeeks)
  const baseline = cadenceOf(before.rows, before.arm.dials.cooldownWeeks)
  console.log('\n\n§4 ACTUATION – the dial must move the output, or the table above is a null\n')
  console.log(`  BEFORE (cooldown 0):      ${num(baseline.perSeason, 2)} cheques a season, min gap ${num(baseline.minGap, 0)}`)
  console.log(`  SHIPPED (cooldown ${SHIPPED.cooldownWeeks}):     ${num(shipped.perSeason, 2)} cheques a season, min gap ${num(shipped.minGap, 0)}`)
  console.log(`  ABSURD (cooldown 40):     ${num(absurd.perSeason, 2)} cheques a season, min gap ${num(absurd.minGap, 0)}`)
  const wired = absurd.perSeason < shipped.perSeason && shipped.perSeason < baseline.perSeason
  console.log(`  -> the cooldown is ${wired ? 'WIRED' : '**NOT WIRED – EVERY ROW ABOVE IS A NULL**'}`)
  const floorHeld = shipped.minGap === null || shipped.minGap >= SHIPPED.cooldownWeeks
  console.log(
    `  -> the shipped floor ${floorHeld ? 'HOLDS' : '**IS BROKEN**'}: no measured gap under ` +
      `${SHIPPED.cooldownWeeks} weeks (smallest seen: ${num(shipped.minGap, 0)})`,
  )
  // ⚠⚠ AND THE ABSURD ARM'S OWN FLOOR IS REPORTED, BECAUSE IT DOES NOT HOLD AND THE REASON IS
  // DOCUMENTED. `sponsorCameoWilling` carries the cooldown across the wrap from ONE previous season
  // only, and `world/sponsors.ts` names that as «exact to one season and not to the whole career …
  // a third-order case». At a cooldown near the length of a season it stops being third-order: the
  // previous season is walked with no carry of its own, so its chain can differ from the real one and
  // a straddling pair slips through. ⚠ THAT IS A PROPERTY OF THE ACTUATION DIAL, NOT OF THE SHIPPED
  // ONE – at 4 weeks of 52 the approximation cannot bite, which is exactly what the line above
  // measures. Printed rather than hidden: an actuation arm that quietly breaks an invariant would
  // teach the wrong lesson about the invariant.
  const absurdFloorHeld = absurd.minGap === null || absurd.minGap >= absurdResult.arm.dials.cooldownWeeks
  console.log(
    `  -> the ACTUATION arm's own floor ${absurdFloorHeld ? 'holds' : 'does NOT hold'} ` +
      `(cooldown ${absurdResult.arm.dials.cooldownWeeks}, smallest seen: ${num(absurd.minGap, 0)}) – ` +
      `${absurdFloorHeld ? 'nothing to explain' : 'the one-season carry approximation, named in world/sponsors.ts'}`,
  )
  // ⭐⭐ ROUND 42 #43 – AND THE CAP'S OLD PROOF IS REPLACED BY THE OPPOSITE ONE. There is no ceiling
  // any more, so the honest reading is what the tail actually does: the largest season any career in
  // the corpus took, printed rather than asserted. A run where that number never exceeds 3 would mean
  // the cap was decorative all along; a run where it does is the cap's removal doing visible work.
  console.log(
    `  -> NO SEASON CAP (his ruling): the fullest season any career took is ${shipped.maxInSeason} cheques ` +
      `(the removed cap was 3)`,
  )
  // ⭐⭐ ...AND THE ONE HE ASKED ABOUT, STATED AS A NUMBER AND NOT AS REASSURANCE.
  console.log(
    `  -> FOUR-WEEK GAPS: ${pct(shipped.gapsAtFloor, shipped.gaps)} of measured gaps land exactly on the ` +
      `${SHIPPED.cooldownWeeks}-week floor, ${pct(shipped.gapsUnder5, shipped.gaps)} are <= 4 weeks ` +
      `(BEFORE: ${pct(baseline.gapsUnder5, baseline.gaps)} were <= 4). A four-week gap is LEGAL under ` +
      `cooldown ${SHIPPED.cooldownWeeks} – this is how often it happens.`,
  )
}

main()
