/**
 * _corridor – THE FAMILY'S WEALTH CORRIDOR, READ ONE WAY BY EVERY BENCH THAT ASKS FOR IT.
 *
 * ⭐⭐⭐ ROUND 42 #41 – EXTRACTED, NOT WRITTEN. Every line below stood in `tools/r42-kid-share-ramp.ts`
 * (round 42 #25) and was carried here verbatim with its comments, because #41's brief said so in as
 * many words: «the shape item 25's bench already prints – reuse that instrument rather than writing a
 * third one». Two benches printing the family's corridor in two shapes is the same disease this repo
 * treats everywhere else – two surfaces asking different functions about one question – and it is
 * worse in a bench than in a screen, because the owner is asked to compare the two prints.
 *
 * ⚠ THE ONLY THING THAT MOVED IS THE COLUMN HEADINGS. `corridor()` took the two arm labels as
 * literals («BEFORE 5pp/50@26» / «AFTER 10pp/60@23»); they are parameters now so a second item can
 * name its own arms. Nothing else about the print, the order of the rows or the arithmetic changed,
 * which is what lets #25's shipped table and #41's new one be read against each other.
 *
 * ⚠ NO try/catch ANYWHERE: a throw is a finding (house bench law). A figure with no denominator
 * prints `–`, never `0.0`.
 */
import { kidAgeYears } from '../src/engine/world'
import type { WorldState } from '../src/engine/world'
import { mean, median } from './econ-bench'

export interface CorridorRead {
  background: string
  /** the family's wallet at the horizon */
  fundsCents: number
  /** her own account at the horizon */
  kidFundsCents: number
  /** the family's banked prize total – already net of her share, which is the point of reading it */
  familyPrizeCents: number
  /** ⭐ WHAT THE MONEY BUYS: the wallet in weeks of this family's own weekly burn */
  runwayWeeks: number | null
  /** weeks the wallet spent below zero over the whole walk */
  weeksUnderWater: number
  ended: string | null
  /** the comparability guard – two careers that played different tournaments are two lives */
  results: number
  ageYears: number
}

/** The family's own weekly burn at the horizon, read off the ledger the engine wrote rather than
 *  re-derived: the last 12 retained weeks of spending, averaged. `null` when nothing was spent. */
export function weeklyBurnCents(world: WorldState): number | null {
  const weeks = world.financeWeeks.slice(-12)
  if (weeks.length === 0) return null
  let spent = 0
  for (const w of weeks) for (const v of Object.values(w.byCategory)) if (v < 0) spent += -v
  return spent === 0 ? null : spent / weeks.length
}

/** One walked career, read into the corridor's own row. `weeksUnderWater` is counted by the CALLER
 *  as it walks, because it is a property of the whole walk and not of the world at the horizon. */
export function readCorridor(world: WorldState, background: string, weeksUnderWater: number): CorridorRead {
  const burn = weeklyBurnCents(world)
  return {
    background,
    fundsCents: world.fundsCents,
    kidFundsCents: world.kidFundsCents ?? 0,
    familyPrizeCents: world.careerTotals?.prizeCents ?? 0,
    runwayWeeks: burn === null ? null : world.fundsCents / burn,
    weeksUnderWater,
    ended: world.ending?.type ?? null,
    results: world.results.length,
    ageYears: kidAgeYears(world.week, world.profile.birthMonth, world.profile.birthDay),
  }
}

// --- formatting ------------------------------------------------------------------------------------

export const padR = (s: string | number, n: number) => String(s).padEnd(n)
export const padL = (s: string | number, n: number) => String(s).padStart(n)
export const money = (cents: number) => `$${Math.round(cents / 100).toLocaleString('en-US')}`
export const signedPct = (delta: number, base: number) =>
  base === 0 ? '–' : `${delta >= 0 ? '+' : ''}${((delta / base) * 100).toFixed(1)}%`
export const num = (x: number | null, d = 1) => (x === null ? '–' : x.toFixed(d))

/** ⭐ THE CORRIDOR PRINT ITSELF. `labels` names the two arms; everything else is #25's table. */
export function corridor(title: string, before: CorridorRead[], after: CorridorRead[], labels: [string, string]): void {
  console.log(`\n${title}  (${before.length} careers per arm)\n`)
  console.log(`  ${padR('', 40)}${padL(labels[0], 20)}${padL(labels[1], 20)}${padL('delta', 20)}`)
  const row = (label: string, a: number, b: number, fmt: (x: number) => string) =>
    console.log(`  ${padR(label, 40)}${padL(fmt(a), 20)}${padL(fmt(b), 20)}${padL(`${fmt(b - a)}  ${signedPct(b - a, a)}`, 20)}`)

  row('FAMILY wallet – mean', mean(before.map((c) => c.fundsCents)), mean(after.map((c) => c.fundsCents)), money)
  row('FAMILY wallet – median', median(before.map((c) => c.fundsCents)), median(after.map((c) => c.fundsCents)), money)
  row('FAMILY prize banked – mean', mean(before.map((c) => c.familyPrizeCents)), mean(after.map((c) => c.familyPrizeCents)), money)
  row('HER account – mean', mean(before.map((c) => c.kidFundsCents)), mean(after.map((c) => c.kidFundsCents)), money)
  row('HER account – median', median(before.map((c) => c.kidFundsCents)), median(after.map((c) => c.kidFundsCents)), money)

  // ⭐ WHAT THE MONEY BUYS – the wallet as weeks of this family's own burn, plus the two ways a
  // career can be hurt by having less of it. A corridor stated only in dollars says nothing about
  // whether the family can still afford the week.
  console.log('')
  const runway = (rows: CorridorRead[]) => median(rows.map((c) => c.runwayWeeks).filter((x): x is number => x !== null))
  console.log(
    `  ${padR('WHAT IT BUYS – wallet in weeks of its own burn', 46)}` +
      `${padL(num(runway(before)) + ' wks', 14)}${padL(num(runway(after)) + ' wks', 20)}`,
  )
  const under = (rows: CorridorRead[]) => rows.filter((c) => c.weeksUnderWater > 0).length
  console.log(
    `  ${padR('careers that were ever under water', 46)}` +
      `${padL(`${under(before)} of ${before.length}`, 14)}${padL(`${under(after)} of ${after.length}`, 20)}`,
  )
  const dead = (rows: CorridorRead[]) => rows.filter((c) => c.ended !== null).length
  console.log(
    `  ${padR('careers that ended before the horizon', 46)}` +
      `${padL(`${dead(before)} of ${before.length}`, 14)}${padL(`${dead(after)} of ${after.length}`, 20)}`,
  )
  let same = 0
  for (let i = 0; i < before.length; i++) if (before[i].results === after[i].results) same++
  console.log(
    `  ${padR('⚠ arms that played the same tournaments', 46)}` +
      `${padL(`${same} of ${before.length}`, 14)}${padL(`(comparability, not a result)`, 31)}`,
  )
}
