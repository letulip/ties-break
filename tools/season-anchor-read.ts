/**
 * season-anchor-read – THE BLAST RADIUS of re-anchoring the calendar per season, measured on real
 * careers through the game's own import door.
 *
 * `shared/dates.ts` used to run one continuous 364-day cycle off a fixed epoch against a Gregorian
 * 365.2425, so the whole calendar slid ~1.24 days earlier every season. It now anchors each season
 * to the first Monday of its OWN year. `src/engine/world/age.ts` is the one engine node that branches
 * on a real date (`kidAgeExact` -> `weekMonth`/`weekYear`, `birthdayWeek` -> `weekOfDate`), and
 * `isTierAgeOpen` reads `kidAgeAt`, so the change can move WHICH WEEK a rung opens and WHICH WEEK her
 * birthday falls in. This prints both, before and against, for every save handed to it.
 *
 * BEFORE = the old arithmetic, re-implemented here in six lines and nowhere else.
 * AFTER  = the shipped `shared/dates.ts` / `world/age.ts`, imported.
 *
 * MEASUREMENT ONLY. Imports the engine read-only, changes no constant, ships no fixture.
 *
 * ⚠ THE SAVES ARE PERSONAL AND ARE NEVER COMMITTED, and neither is anything derived from one beyond
 * the aggregate statistics quoted in docs/specs/. Same rule as tools/round15-read.ts.
 *
 * Run:
 *   npx vite-node tools/season-anchor-read.ts -- --save /path/a.tsave [--save /path/b.tsave]
 */
import { readFileSync } from 'node:fs'
import { decodeExportFile } from '../src/engine/saveCodec'
import type { WorldState } from '../src/engine/world'
import { kidAgeYears, kidAgeExact, birthdayWeek, kidBirthYear } from '../src/engine/world/age'
import { schoolEndWeek } from '../src/engine/kidLife'
import { TIER_LADDER, TIERS, WEEKS_PER_YEAR, isSummerWeek, isTierAgeOpen } from '../src/engine/season/calendar'
import { daysInBirthMonth, weekDayNumbers, weekMonth, weekRange, weekYear, WEEKS_IN_SEASON } from '../src/shared/dates'

// --- THE OLD CALENDAR, frozen here so the comparison needs no git stash --------------------------
const LEGACY_EPOCH_UTC = Date.UTC(2031, 0, 6) // Monday, Jan 6, 2031
const MS_PER_DAY = 24 * 60 * 60 * 1000

function oldDate(dayOffset: number): Date {
  return new Date(LEGACY_EPOCH_UTC + dayOffset * MS_PER_DAY)
}
const oldWeekMonth = (w: number): number => oldDate(w * 7).getUTCMonth() + 1
const oldWeekYear = (w: number): number => oldDate(w * 7).getUTCFullYear()
function oldWeekOfDate(month: number, day: number, year: number): number {
  const target = Date.UTC(year, month - 1, day)
  return Math.floor(Math.floor((target - LEGACY_EPOCH_UTC) / MS_PER_DAY) / 7)
}
/** The old `kidAgeExact`, verbatim, with the old date functions under it. */
function oldKidAgeYears(week: number, birthMonth: number): number {
  const month = Math.max(1, Math.min(12, Math.round(birthMonth)))
  return Math.floor(oldWeekYear(week) - kidBirthYear() + (oldWeekMonth(week) - month) / 12)
}
function oldBirthdayWeek(week: number, birthMonth: number, birthDay: number): number {
  const month = Math.max(1, Math.min(12, Math.round(birthMonth)))
  const day = Math.max(1, Math.min(daysInBirthMonth(month), Math.round(birthDay)))
  return oldWeekOfDate(month, day, oldWeekYear(week))
}

// --- shared shapes ------------------------------------------------------------------------------
interface Clock {
  label: string
  ageYears: (week: number, bm: number, bd: number) => number
  birthdayWeek: (week: number, bm: number, bd: number) => number | null
}
const OLD: Clock = { label: 'before', ageYears: (w: number, bm: number, _bd: number) => oldKidAgeYears(w, bm), birthdayWeek: oldBirthdayWeek }
const NEW: Clock = { label: 'after ', ageYears: kidAgeYears, birthdayWeek }

/** Every career week in `[0, cap)` that IS her birthday week, under `clock`. This is exactly the
 *  predicate `birthdayTurning` uses (`week === birthdayWeek(week, ...)`), so a season that gains or
 *  loses one shows up here as a season with two entries or none. */
function birthdayWeeks(clock: Clock, bm: number, bd: number, cap: number): number[] {
  const out: number[] = []
  for (let w = 0; w < cap; w++) if (w === clock.birthdayWeek(w, bm, bd)) out.push(w)
  return out
}

/** The first career week the tier's age gate is open, under `clock`, or null inside the horizon. */
function rungOpensAt(clock: Clock, tier: (typeof TIER_LADDER)[number], bm: number, bd: number, cap: number): number | null {
  for (let w = 0; w < cap; w++) if (isTierAgeOpen(tier, clock.ageYears(w, bm, bd))) return w
  return null
}

async function load(path: string): Promise<WorldState> {
  return (await decodeExportFile(new Uint8Array(readFileSync(path)))) as WorldState
}

function section(title: string): void {
  console.log(`\n${'='.repeat(96)}\n${title}\n${'='.repeat(96)}`)
}

function newYearGaps(): void {
  // --- the boundary the drift is absorbed at, once, for every season a career can reach ---------
  section('THE NEW YEAR GAP – where the ~1.24 days a season go, now that nothing drifts')
  console.log('  A season is 364 days; a year is 365.2425. Re-anchored, the slack lands between one')
  console.log("  season's last week and the next season's first: 0 skipped days, or 7 – one real")
  console.log('  calendar week that belongs to no career week, in the days nobody plays.')
  console.log('  s   season s week 51            season s+1 week 0             skipped')
  for (let s = 0; s < 12; s++) {
    const lastWeek = s * WEEKS_IN_SEASON + WEEKS_IN_SEASON - 1
    const nextWeek = (s + 1) * WEEKS_IN_SEASON
    // Both are Mondays; the run between them is 7 days (contiguous) or 14 (a week is skipped).
    const skipped = (mondayUtc(nextWeek) - mondayUtc(lastWeek)) / MS_PER_DAY - 7
    console.log(
      `  ${String(s).padStart(2)}  ${weekRange(lastWeek).padEnd(26)}  ${weekRange(nextWeek).padEnd(26)}  ` +
        `${skipped === 0 ? 'none' : `${skipped}d`}`,
    )
  }
}

/** The school leaving week is a season-week offset (`SCHOOL_YEAR_TURNS_AT` = 34, "the September the
 *  school year turns over on"), and its real MONTH is exactly what drifted. Prints the month and her
 *  age there for all twelve birth months, both calendars – the measurement behind the re-aimed bound
 *  in tests/school-ends.test.ts. Needs no save: it is a function of the birth month alone. */
function schoolLeavingAges(): void {
  section('SCHOOL LEAVING – the September offset, and what month it actually was')
  console.log('  bm  leave w   month before   month after   age before   age after')
  for (let bm = 1; bm <= 12; bm++) {
    const w = schoolEndWeek(bm)
    const ageB = oldWeekYear(w) - kidBirthYear() + (oldWeekMonth(w) - bm) / 12
    const ageA = kidAgeExact(w, bm, 1)
    const flag = Math.floor(ageB) !== Math.floor(ageA) ? '  ⚠ whole year differs' : ''
    console.log(
      `  ${String(bm).padStart(2)}  ${String(w).padStart(6)}   ${String(oldWeekMonth(w)).padStart(12)}   ` +
        `${String(weekMonth(w)).padStart(11)}   ${ageB.toFixed(2).padStart(10)}   ${ageA.toFixed(2).padStart(9)}${flag}`,
    )
  }
}

/** ⚠ THE ONE PLACE THE RE-ANCHOR CHANGES WHAT THE ENGINE DOES, not just what it prints.
 *
 *  `isSummerWeek` takes its floor from the season (`offset >= 25`) and its CEILING from the real
 *  calendar (`offset <= 33 || weekMonth(week) === 8`, round-16 #16). `weekMonth` moved, so the set of
 *  summer weeks moves with it - and a summer week develops and fatigues differently (world/summer.ts).
 *  Only offset 34 can be affected: 33 is inside the floor and 35's Monday is never August. */
function summerCeilingWeeks(): void {
  section('THE SUMMER CEILING – offset 34, the one week `isSummerWeek` can change its mind about')
  console.log('  s   Monday before      Monday after       summer before   summer after')
  for (let s = 0; s < 12; s++) {
    const w = s * WEEKS_IN_SEASON + 34
    const mB = oldWeekMonth(w)
    const d = oldDate(w * 7)
    const before = mB === 8 // the same predicate, on the old calendar
    const after = isSummerWeek(w)
    console.log(
      `  ${String(s).padStart(2)}  ${`${d.getUTCDate()}/${mB}/${d.getUTCFullYear()}`.padEnd(17)}  ` +
        `${weekRange(w).padEnd(18)} ${String(before).padEnd(15)} ${String(after)}` +
        `${before !== after ? '   ⚠ MOVED' : ''}`,
    )
  }
  console.log('  (before = the old calendar put its Monday in August, so the ceiling extended the block)')
}

/** ⚠ THE CASE NO SAVE ON FILE CAN COVER. The owner's careers are born in February, March, June and
 *  December; the birth date at risk from a re-anchor is one in the first days of JANUARY, because
 *  that is where the New Year gap falls. So sweep every birth date the onboarding wizard can produce
 *  – 365 of them – and count her birthdays season by season, both calendars, over twelve seasons.
 *  Prints only the dates where the two disagree, and says nothing at all when none do. */
function everyBirthDateSweep(): void {
  section('EVERY BIRTH DATE – does any season gain or lose a birthday? (12 seasons, 365 dates)')
  const cap = 12 * WEEKS_IN_SEASON
  const rows: string[] = []
  for (let bm = 1; bm <= 12; bm++) {
    for (let bd = 1; bd <= daysInBirthMonth(bm); bd++) {
      const before = birthdayWeeks(OLD, bm, bd, cap)
      const after = birthdayWeeks(NEW, bm, bd, cap)
      if (before.length === after.length) continue
      const missing = before
        .map((_, i) => i)
        .filter((i) => !after.some((a) => Math.floor(a / WEEKS_IN_SEASON) === Math.floor(before[i] / WEEKS_IN_SEASON)))
        .map((i) => `s${Math.floor(before[i] / WEEKS_IN_SEASON)}`)
      rows.push(
        `  born ${String(bd).padStart(2)}/${String(bm).padStart(2)}: before ${before.length}, after ${after.length}` +
          `   season(s) with no birthday after: ${missing.join(', ') || '-'}`,
      )
    }
  }
  console.log(rows.length ? rows.join('\n') : '  none – every birth date keeps one birthday per season, on both calendars')
  console.log(`  dates swept: 365`)
}

/** The Monday of a career week, as UTC ms, off the SHIPPED calendar's own exports – for the gap
 *  arithmetic above. Recomposed from `weekYear`/`weekMonth`/`weekDayNumbers[0]` rather than from a
 *  second copy of the mapping, so it cannot disagree with what the app prints. */
function mondayUtc(week: number): number {
  return Date.UTC(weekYear(week), weekMonth(week) - 1, weekDayNumbers(week)[0])
}

async function main(): Promise<void> {
  const args = process.argv.slice(2)
  const saves: string[] = []
  for (let i = 0; i < args.length; i++) if (args[i] === '--save') saves.push(args[++i])
  if (!saves.length) throw new Error('need at least one --save')

  newYearGaps()
  schoolLeavingAges()
  summerCeilingWeeks()
  everyBirthDateSweep()

  for (const path of saves) {
    const w = await load(path)
    const bm = w.profile.birthMonth
    const bd = w.profile.birthDay
    const seasons = Math.floor(w.week / WEEKS_PER_YEAR)
    // Look one whole season PAST where she is now: a rung that opens after the save's week is still
    // a live career's future, and a shift there is a shift a player will meet.
    const cap = (seasons + 2) * WEEKS_PER_YEAR

    section(`${path.split('/').pop()}  ·  schema v${w.schemaVersion}  ·  week ${w.week}  ·  born ${bd}/${bm}`)

    // ---- 1. HER AGE RIGHT NOW ------------------------------------------------------------------
    console.log(`\n[1] HER AGE AT THE SAVED WEEK`)
    const ageBefore = OLD.ageYears(w.week, bm, bd)
    const ageAfter = NEW.ageYears(w.week, bm, bd)
    console.log(`  before ${ageBefore}   after ${ageAfter}   ${ageBefore === ageAfter ? 'SAME' : '⚠ MOVED'}`)
    console.log(`  the week she is in reads:  before ${weekRangeOld(w.week)}   after ${weekRange(w.week)}`)

    // ---- 2. BIRTHDAY WEEK PER SEASON -----------------------------------------------------------
    console.log(`\n[2] BIRTHDAY WEEK PER SEASON  (season = [s*52, s*52+51])`)
    const bdBefore = birthdayWeeks(OLD, bm, bd, cap)
    const bdAfter = birthdayWeeks(NEW, bm, bd, cap)
    const bySeason = (list: number[], s: number) =>
      list.filter((x) => Math.floor(x / WEEKS_IN_SEASON) === s)
    console.log(`  s   week before   week after    age announced   verdict`)
    for (let s = 0; s <= seasons + 1; s++) {
      const b = bySeason(bdBefore, s)
      const a = bySeason(bdAfter, s)
      // The age `birthdayTurning` ANNOUNCES on that week, both sides. It has to be compared as well
      // as the week: a birthday that keeps its slot but changes the number in "She is ___ this week"
      // would still be a career the player watched change under them.
      const ageB = b.map((x) => OLD.ageYears(x, bm, bd)).join(',') || '-'
      const ageA = a.map((x) => NEW.ageYears(x, bm, bd)).join(',') || '-'
      const shift = a.length !== b.length ? (a.length > b.length ? '⚠ GAINED' : '⚠ LOST') : b[0] === a[0] ? 'same week' : `moved ${a[0]! - b[0]!}w`
      const live = s * WEEKS_IN_SEASON <= w.week ? ' [played]' : ''
      console.log(
        `  ${String(s).padStart(2)}  ${(b.join(',') || '-').padEnd(12)}  ${(a.join(',') || '-').padEnd(12)}  ` +
          `${`${ageB} -> ${ageA}`.padEnd(15)} ${shift}${ageB === ageA ? '' : ' ⚠ AGE MOVED'}${live}`,
      )
    }
    console.log(`  TOTAL birthdays in [0,${cap}):  before ${bdBefore.length}   after ${bdAfter.length}`)
    // The one that matters for a career MID-FLIGHT: has a birthday she already saw moved to a week
    // she has not reached, or has one she has not seen been moved behind her?
    const seenBefore = bdBefore.filter((x) => x <= w.week).length
    const seenAfter = bdAfter.filter((x) => x <= w.week).length
    console.log(
      `  birthdays already PASSED at w${w.week}: before ${seenBefore}   after ${seenAfter}   ` +
        `${seenBefore === seenAfter ? 'SAME – nothing skipped or repeated' : '⚠ A BIRTHDAY CROSSES THE SAVE WEEK'}`,
    )

    // ---- 3. WHEN EACH RUNG OPENS ---------------------------------------------------------------
    console.log(`\n[3] THE WEEK EACH RUNG'S AGE GATE OPENS  (isTierAgeOpen o kidAgeAt)`)
    console.log(`  tier        minAge  before   after    shift   crosses w${w.week}?`)
    for (const t of TIER_LADDER) {
      const min = TIERS[t].minAgeYears
      const b = rungOpensAt(OLD, t, bm, bd, cap)
      const a = rungOpensAt(NEW, t, bm, bd, cap)
      const shift = b === null || a === null ? '?' : a - b
      const crosses =
        b !== null && a !== null && b !== a && Math.min(b, a) <= w.week && w.week < Math.max(b, a)
      console.log(
        `  ${t.padEnd(11)} ${String(min ?? '-').padStart(5)}   ` +
          `${String(b ?? '-').padStart(6)}   ${String(a ?? '-').padStart(6)}   ` +
          `${String(shift).padStart(5)}   ${crosses ? '⚠ YES – a gate flips for this save' : 'no'}`,
      )
    }

    // ---- 4. THE SEASON YEARS THE SAVE ALREADY BANKED -------------------------------------------
    // seasonHistory is keyed on the INDEX (v16), so nothing here should move – this is the check
    // that the re-anchor did not quietly re-label a row the player has already read.
    console.log(`\n[4] BANKED SEASON ROWS – the index is the identity, the year is derived`)
    console.log(`  rows: ${w.seasonHistory.map((r) => r.seasonIndex).join(', ') || 'none'}`)
    console.log(
      `  weekYear(seasonFirstWeek):  before [${w.seasonHistory.map((r) => oldWeekYear(r.seasonIndex * WEEKS_IN_SEASON)).join(', ')}]`,
    )
    console.log(
      `                              after  [${w.seasonHistory.map((r) => weekYear(r.seasonIndex * WEEKS_IN_SEASON)).join(', ')}]`,
    )
    console.log(`  lastSeasonSummary.seasonYear (stored): ${w.lastSeasonSummary?.seasonYear ?? '-'}`)
  }
}

/** The old `weekRange`, just enough of it to print the week she is standing in. */
function weekRangeOld(week: number): string {
  const M = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const s = oldDate(week * 7)
  const e = oldDate(week * 7 + 6)
  return `${M[s.getUTCMonth()]} ${s.getUTCDate()} – ${M[e.getUTCMonth()]} ${e.getUTCDate()}, ${e.getUTCFullYear()}`
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
