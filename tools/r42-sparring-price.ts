/**
 * r42-sparring-price – ROUND 42 #19 / #45, THE SPARRING SEAT, PRICED WITHOUT BEING BUILT.
 *
 * ⚠⚠⚠ THE SEAT IS NOT BUILT AND THIS FILE DOES NOT BUILD IT. Two keys short, and both are stop
 * conditions the builder brief names explicitly («No schema move – v78 already carries the two keys.
 * If you need a third, STOP and report»):
 *
 *   1. `world.form` DOES NOT EXIST. The seat's entire effect, per the-form-and-the-sparring §4, is
 *      «while hired, the RHYTHM channel's drift is cut by rung». The rhythm channel is §1b of that
 *      same spec and ships in its wave F1 – `world.form`, `rustAfterWeeks`, `rustFloor`, the reader
 *      at `kidMatchPlayerFor`. None of it is on this tree: `git grep rustAfterWeeks -- src` is empty
 *      and `SAVE_SCHEMA_VERSION` is 78 with no `form` key in `state.ts` or in any migration. A seat
 *      built now would cut a drift that does not drift.
 *   2. `sparringTravels` DOES NOT EXIST either. The owner's 15.09 override gives the seat «the same
 *      galochka "ездит"» every other seat has, and every other travelling seat persists its stance
 *      (`coachOnEventWeeks`, `masseurTravels`). v78 was scoped before that override and carries
 *      `sparringHired` and `sparringRung` only.
 *
 * SO THIS FILE MEASURES THE TWO THINGS THAT CAN BE MEASURED HONESTLY TODAY, so that his numbers land
 * on a table rather than on an argument:
 *
 *   §1 THE RUST CENSUS – how much rust a real career actually makes. Weeks with no completed
 *      competitive match, the runs longer than the proposed `rustAfterWeeks = 3`, and – the question
 *      the travel switch turns on – what SHARE of those weeks she is on the road for rather than at
 *      home. Nothing about form is assumed; this is the calendar and the results ledger.
 *   §2 THE MONEY – what the seat costs at each rung in each stance, with the travelling arm's fare
 *      taken from the REAL fare model (`masseurTravelFareFor`, i.e. `staffSeatFareCents`, the
 *      round-22 one-aircraft rule) rather than from a second estimate of a plane ticket.
 *   §3 THE DRIFT THAT WOULD BE CUT – §1b's own proposed constants (−0.4/wk past a 3-week gap, floor
 *      −4) applied post-hoc to the measured gaps, at each rung, in both stances. That is a
 *      PREDICTION off measured calendars, not a measurement of a mechanic: the mechanic is not built.
 *      It is labelled as such everywhere it prints.
 *
 * ⚠ §1's road/home split is the whole travel question and it is measured rather than assumed. A
 * tournament in this engine occupies ONE week, so the prior is that almost every rust week is a home
 * week and the travelling stance buys almost nothing – but a prior is not a number, and the owner is
 * being asked to price a switch.
 *
 * ⚠ NO try/catch ANYWHERE: a throw is a finding (house bench law). A figure with no denominator
 * prints `–`, never `0.0`.
 *
 * Run:  npx vite-node tools/r42-sparring-price.ts
 *       npx vite-node tools/r42-sparring-price.ts -- --seeds 2 --weeks 400
 */
import { KID_ID, masseurTravelFareFor } from '../src/engine/world'
import { WEEKS_PER_YEAR } from '../src/engine/season/calendar'
import { openCareer, stepCareerWeek, PRESETS, POLICIES } from './econ-bench'

const args = process.argv.slice(2)
const argOf = (name: string, fallback: number): number => {
  const i = args.indexOf(`--${name}`)
  return i >= 0 && args[i + 1] ? Number(args[i + 1]) : fallback
}
const SEEDS = argOf('seeds', 4)
const WEEKS = argOf('weeks', 600)
const POLICY = POLICIES[1]

/** ⚠ PROPOSALS FROM THE SPEC, QUOTED HERE RATHER THAN INVENTED – the-form-and-the-sparring §4 and
 *  §1b. None of these constants exists in `ECONOMY`, because the mechanic does not exist. */
const RUST_AFTER_WEEKS = 3
const DRIFT_PER_WEEK = 0.4
const RUST_FLOOR = 4
const RUNGS = [
  { label: 'rung 1 · a college hitter', weeklyCents: 500_00, cut: 0.6 },
  { label: 'rung 2 · a journeyman pro', weeklyCents: 900_00, cut: 0.35 },
  { label: 'rung 3 · a top-100 partner', weeklyCents: 1400_00, cut: 0.15 },
]

const m = (c: number): string => `$${Math.round(c / 100).toLocaleString('en-US')}`
const padL = (s: string, n: number): string => s.padStart(n)
const padR = (s: string, n: number): string => s.padEnd(n)
const mean = (xs: number[]): number => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0)
const med = (xs: number[]): number => {
  if (xs.length === 0) return 0
  const s = [...xs].sort((a, b) => a - b)
  return s[Math.floor(s.length / 2)]
}

interface CareerRead {
  key: string
  weeksWalked: number
  /** weeks after her first professional-era week with NO completed competitive match */
  gapWeeks: number
  /** of those, weeks she was entered in an event anyway – the ones only a TRAVELLING seat reaches */
  gapWeeksOnRoad: number
  /** weeks inside a run longer than `rustAfterWeeks` – the only ones the rhythm channel would drift on */
  driftingWeeks: number
  driftingWeeksOnRoad: number
  /** the longest single run of matchless weeks */
  longestGap: number
  /** Σ of the per-week drift §1b would have accrued, floor-clamped. Tenths. */
  driftAccrued: number
  /** the fare the travelling stance would have paid, off the REAL fare model */
  fareCentsIfTravelling: number
  /** weeks the seat would be on the payroll: every week she is not at college / on a family week.
   *  Approximated here by the whole walk, and the approximation is NAMED rather than hidden. */
  paidWeeks: number
}

function readCareer(preset: typeof PRESETS[number], i: number): CareerRead {
  const { world, rng } = openCareer(preset, i, POLICY)
  const playedWeeks = new Set<number>()
  /** event id -> the week it is held, for every event she was ever entered in */
  const enteredAt = new Map<string, number>()
  /** event id -> the fare the travelling stance would pay for it */
  const fareOf = new Map<string, number>()
  for (let w = 0; w < WEEKS; w++) {
    // ⚠⚠ THE ENTRIES ARE READ WHILE THEY ARE STILL IN THE FUTURE, AND THE FIRST DRAFT OF THIS LOOP
    // DID NOT – it asked for entries at `e.week === world.week` and got ZERO of them, over 36
    // careers, because the tick consumes an entry as it resolves it. The bench printed «road share
    // 0.0%, fares $0» and it read like a finding. It was a broken instrument, and the difference was
    // one diagnostic: 0 entries at their own week against 474 seen for a future week on one career.
    // Recorded here because a 0.0% that is TRUE and a 0.0% that is BROKEN print identically.
    const heldHired = world.masseurHired
    const heldTravels = world.masseurTravels
    world.masseurHired = true
    world.masseurTravels = true
    for (const e of world.season) {
      if (!world.entries.includes(e.id) || enteredAt.has(e.id)) continue
      enteredAt.set(e.id, e.week)
      // ⚠ THE FARE IS READ BY LENDING THE MASSEUR'S FLAGS FOR ONE CALL AND HANDING THEM BACK. The
      // seat's fare rides `staffSeatFareCents` by the round-22 ruling – one travel model, never a
      // second – and `masseurTravelFareFor` is that model's only exported reader. Nothing is charged
      // and nothing is left set, so the career walks exactly as it would have.
      // ⚠ ONE READ PER EVENT, at the first week she holds the entry: a fare is charged once, and an
      // entry is visible for several weeks running before its own.
      fareOf.set(e.id, masseurTravelFareFor(world, e))
    }
    world.masseurHired = heldHired
    world.masseurTravels = heldTravels

    stepCareerWeek(world, rng, POLICY)
    for (const r of world.results) {
      if (r.playerId === KID_ID) playedWeeks.add(r.week)
    }
  }
  // ⚠ A WEEK SHE ENTERED BUT NEVER PLAYED is the only shape «away, and no match» can take in this
  // engine – a withdrawal, a walkover, an injury that swallowed the week. A tournament occupies ONE
  // week and writes its result row that week, so there is no two-week swing to go cold inside. This
  // set IS the travelling stance's whole reach, and it is measured rather than assumed.
  const roadWeeks = new Set<number>()
  let fareCents = 0
  for (const [id, week] of enteredAt) {
    fareCents += fareOf.get(id) ?? 0
    if (!playedWeeks.has(week)) roadWeeks.add(week)
  }

  // ⚠ THE LEDGER IS PRUNED TO THE RANKING WINDOW, so `playedWeeks` is accumulated week by week above
  // rather than folded once at the end – a single fold would have seen only the last 52 weeks and
  // reported a career of almost nothing but rust, which is the prettiest possible version of a
  // number this file exists to be honest about.
  let gapWeeks = 0
  let gapOnRoad = 0
  let drifting = 0
  let driftingOnRoad = 0
  let longest = 0
  let run = 0
  let drift = 0
  for (let week = 0; week < WEEKS; week++) {
    if (playedWeeks.has(week)) {
      run = 0
      continue
    }
    run++
    gapWeeks++
    const onRoad = roadWeeks.has(week)
    if (onRoad) gapOnRoad++
    if (run > longest) longest = run
    if (run > RUST_AFTER_WEEKS) {
      drifting++
      if (onRoad) driftingOnRoad++
      drift = Math.min(RUST_FLOOR, drift + DRIFT_PER_WEEK)
    }
  }
  return {
    key: `${preset.label}#${i}`,
    weeksWalked: WEEKS,
    gapWeeks,
    gapWeeksOnRoad: gapOnRoad,
    driftingWeeks: drifting,
    driftingWeeksOnRoad: driftingOnRoad,
    longestGap: longest,
    driftAccrued: drift,
    fareCentsIfTravelling: fareCents,
    paidWeeks: WEEKS,
  }
}

function main(): void {
  console.log('================================================================================')
  console.log('r42-sparring-price   ⚠⚠ THE SEAT IS NOT BUILT – see this file\'s header for the two')
  console.log('                        missing keys. Everything below prices it; nothing ships it.')
  console.log('================================================================================')

  const rows: CareerRead[] = []
  for (const preset of PRESETS) {
    for (let i = 0; i < SEEDS; i++) rows.push(readCareer(preset, i))
  }
  const seasons = WEEKS / WEEKS_PER_YEAR

  console.log(`\n§1  THE RUST CENSUS   (${PRESETS.length} presets x ${SEEDS} seeds x ${WEEKS} weeks = ${seasons.toFixed(1)} seasons each)`)
  console.log('    A "gap week" is a week with no completed competitive match. A "drifting week" is one')
  console.log(`    inside a run longer than the proposed rustAfterWeeks = ${RUST_AFTER_WEEKS} – the only kind §1b would`)
  console.log('    move the number on. "on road" = she ENTERED an event that week and still played no match.')
  console.log('')
  console.log(`  ${padR('', 10)}${padL('gap wks', 10)}${padL('/season', 10)}${padL('drifting', 10)}${padL('/season', 10)}${padL('on road', 10)}${padL('road share', 12)}${padL('longest', 10)}`)
  const tot = (f: (r: CareerRead) => number): number => rows.reduce((s, r) => s + f(r), 0)
  const line = (label: string, subset: CareerRead[]): void => {
    if (subset.length === 0) { console.log(`  ${padR(label, 10)}${padL('–', 10)}`); return }
    const g = mean(subset.map((r) => r.gapWeeks))
    const d = mean(subset.map((r) => r.driftingWeeks))
    const dr = mean(subset.map((r) => r.driftingWeeksOnRoad))
    console.log(
      `  ${padR(label, 10)}${padL(g.toFixed(0), 10)}${padL((g / seasons).toFixed(1), 10)}${padL(d.toFixed(0), 10)}` +
      `${padL((d / seasons).toFixed(1), 10)}${padL(dr.toFixed(1), 10)}${padL(d > 0 ? `${((dr / d) * 100).toFixed(1)}%` : '–', 12)}` +
      `${padL(med(subset.map((r) => r.longestGap)).toFixed(0), 10)}`,
    )
  }
  line('all', rows)
  for (const bg of ['working', 'middle', 'wealthy']) {
    line(bg, rows.filter((r) => r.key.includes(bg)))
  }
  console.log(`\n  ⭐ THE TRAVEL SWITCH'S WHOLE CASE IS THE "road share" COLUMN: it is the fraction of`)
  console.log('     drifting weeks a NOT-travelling seat cannot reach. Everything else, he covers at home.')

  console.log(`\n§2  WHAT THE SEAT COSTS   (per career over ${seasons.toFixed(1)} seasons, and per season)`)
  console.log('    Salary is flat per week while hired; the fare is the REAL model (staffSeatFareCents)')
  console.log('    read off every event week she actually entered.')
  console.log('')
  const fareTotal = mean(rows.map((r) => r.fareCentsIfTravelling))
  console.log(`  ${padR('rung', 28)}${padL('salary/season', 16)}${padL('+ fares/season', 16)}${padL('travelling/season', 20)}${padL('research $50-80k', 18)}`)
  for (const rung of RUNGS) {
    const salarySeason = rung.weeklyCents * WEEKS_PER_YEAR
    const fareSeason = fareTotal / seasons
    const inBand = salarySeason + fareSeason >= 50_000_00 && salarySeason + fareSeason <= 80_000_00
    console.log(
      `  ${padR(rung.label, 28)}${padL(m(salarySeason), 16)}${padL(m(fareSeason), 16)}${padL(m(salarySeason + fareSeason), 20)}${padL(inBand ? 'inside' : 'outside', 18)}`,
    )
  }
  console.log(`\n  (mean fare bill over the whole walk: ${m(fareTotal)} across every event week she entered;`)
  console.log('   the not-travelling stance pays none of it. ⚠ ONE READ PER ENTRY, so a withdrawal is counted')
  console.log('   as a fare the play arm would not actually have charged – this OVER-states the travelling bill.)')

  console.log('\n§3  THE DRIFT THAT WOULD BE CUT  ⚠⚠ PREDICTED, NOT MEASURED – the mechanic does not exist.')
  console.log('    §1b\'s proposal accrued post-hoc over the measured gaps, then the rung\'s cut applied.')
  console.log('    "ceiling" = a seat that travels and is therefore at every drifting week.')
  console.log('    "home only" = the same seat with the switch off; it cannot cut a week it was not at.')
  console.log('')
  const driftAll = mean(rows.map((r) => r.driftingWeeks)) * DRIFT_PER_WEEK
  const driftRoad = mean(rows.map((r) => r.driftingWeeksOnRoad)) * DRIFT_PER_WEEK
  const driftHome = driftAll - driftRoad
  console.log(`  ${padR('rung', 28)}${padL('ceiling (travels)', 20)}${padL('home only', 16)}${padL('the switch buys', 18)}`)
  for (const rung of RUNGS) {
    const ceiling = driftAll * (1 - rung.cut)
    const homeOnly = driftHome * (1 - rung.cut)
    console.log(
      `  ${padR(`${rung.label} (x${rung.cut})`, 28)}${padL(`${ceiling.toFixed(1)} tenths cut`, 20)}${padL(`${homeOnly.toFixed(1)}`, 16)}${padL(`${(ceiling - homeOnly).toFixed(1)} tenths`, 18)}`,
    )
  }
  console.log(`\n  raw drift a career accrues with NO seat: ${driftAll.toFixed(1)} tenths of accrual over the walk`)
  console.log(`  (${driftHome.toFixed(1)} of it at home, ${driftRoad.toFixed(1)} on the road), before §1c's 0.5/wk reversion,`)
  console.log(`  which the spec applies FIRST every week and which this post-hoc sum does NOT model.`)
  console.log('  ⚠⚠ SO THE ONE NUMBER NOBODY SHOULD QUOTE FROM THIS FILE IS "WHAT A SEASON OF RUST COSTS".')
  console.log('     Today it costs NOTHING: there is no form, no composure reader, no pp. The honest')
  console.log('     answer to that question is a wave F1 away, and it is named as missing rather than')
  console.log('     estimated here – an estimate would be exactly the null arm CLAUDE.md warns about.')

  console.log(`\n  n careers = ${rows.length}; total gap weeks across the corpus = ${tot((r) => r.gapWeeks)}`)
}

main()
