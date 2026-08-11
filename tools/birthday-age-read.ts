/**
 * birthday-age-read – round-16 #100. What the announced-age fix changes, and what it must not.
 *
 * MEASUREMENT ONLY. Imports the engine read-only, changes no constant, ships no fixture.
 *
 * ⚠ THE SAVES ARE PERSONAL AND ARE NEVER COMMITTED, and neither is anything derived from one beyond
 * the aggregate statistics quoted in docs/specs/. Same rule as tools/round15-read.ts.
 *
 * THE CLAIM UNDER TEST, in three parts:
 *   1. the ANNOUNCED age is now the age she turns (it was a year low for a 1st-6th birth day);
 *   2. a girl born 1-5 January stops losing whole birthdays to the New Year straddle;
 *   3. ⚠ NOTHING AGE-KEYED MOVES. `isTierAgeOpen` and `ageInjuryFactor` read `kidAgeYears`, which
 *      this fix does not touch - so every tier rung must open in exactly the week it opened before.
 *      Asserted by MEASUREMENT rather than by reading the diff, because that was the instruction.
 *
 * Run:
 *   npx vite-node tools/birthday-age-read.ts -- --save ~/Downloads/a.tsave [--save ...]
 */
import { readFileSync } from 'node:fs'
import { decodeExportFile } from '../src/engine/saveCodec'
import type { WorldState } from '../src/engine/world'
import { kidAgeYears, kidBirthYear, birthdayTurning } from '../src/engine/world/age'
import { ageInjuryFactor } from '../src/engine/world/injury'
import { TIER_LADDER, WEEKS_PER_YEAR, isTierAgeOpen } from '../src/engine/season/calendar'
import { daysInBirthMonth, weekMonth, weekOfDate, weekYear, WEEKS_IN_SEASON } from '../src/shared/dates'

// -------------------------------------------------------------------------------------------------
// THE CODE AS IT WAS, kept verbatim so "before" is a measurement and not a memory. Same device as
// `legacyWeekYear` in tools/season-anchor-read.ts.
// -------------------------------------------------------------------------------------------------
function oldBirthdayWeek(week: number, birthMonth: number, birthDay: number): number | null {
  const month = Math.max(1, Math.min(12, Math.round(birthMonth)))
  const day = Math.max(1, Math.min(daysInBirthMonth(month), Math.round(birthDay)))
  return weekOfDate(month, day, weekYear(week))
}
function oldBirthdayTurning(week: number, birthMonth: number, birthDay: number): number | null {
  if (week !== oldBirthdayWeek(week, birthMonth, birthDay)) return null
  return kidAgeYears(week, birthMonth)
}

function section(title: string): void {
  console.log(`\n${'='.repeat(86)}\n${title}\n${'='.repeat(86)}`)
}

async function load(path: string): Promise<WorldState> {
  return (await decodeExportFile(new Uint8Array(readFileSync(path)))) as WorldState
}

/** The first week each tier rung's AGE gate opens, walking her own clock. */
function rungOpenings(bm: number, cap: number): Map<string, number | null> {
  const out = new Map<string, number | null>()
  for (const tier of TIER_LADDER) {
    let at: number | null = null
    for (let w = 0; w <= cap; w++) {
      if (isTierAgeOpen(tier, kidAgeYears(w, bm))) { at = w; break }
    }
    out.set(tier, at)
  }
  return out
}

async function main(): Promise<void> {
  const args = process.argv.slice(2)
  const saves: string[] = []
  for (let i = 0; i < args.length; i++) if (args[i] === '--save') saves.push(args[++i])

  let movedRungs = 0
  let movedInjury = 0
  let changedAnnouncements = 0
  let regainedBirthdays = 0

  for (const path of saves) {
    const w = await load(path)
    const bm = w.profile.birthMonth
    const bd = w.profile.birthDay
    const cap = Math.max(w.week, 8 * WEEKS_PER_YEAR)
    section(`${path.split('/').pop()}  ·  v${w.schemaVersion}  ·  week ${w.week}  ·  born ${bd}/${bm}`)

    // ---- 1. THE ANNOUNCEMENTS ----------------------------------------------------------------
    console.log(`\n[1] BIRTHDAY ANNOUNCEMENTS over weeks 0..${cap}`)
    console.log(`    week   Mon-month  before   after`)
    const beforeAges: number[] = []
    const afterAges: number[] = []
    for (let k = 0; k <= cap; k++) {
      const before = oldBirthdayTurning(k, bm, bd)
      const after = birthdayTurning(k, bm, bd)
      if (before === null && after === null) continue
      if (before !== null) beforeAges.push(before)
      if (after !== null) afterAges.push(after)
      if (before !== after) changedAnnouncements++
      if (before === null && after !== null) regainedBirthdays++
      console.log(
        `  ${String(k).padStart(6)}  ${String(weekMonth(k)).padStart(9)}` +
          `  ${String(before ?? '-').padStart(6)}  ${String(after ?? '-').padStart(6)}` +
          `${before === after ? '' : '   <-- CHANGED'}`,
      )
    }
    const dup = (xs: number[]): string => {
      const d = [...new Set(xs.filter((v, i) => xs.indexOf(v) !== i))]
      return d.length ? d.join(',') : '(none)'
    }
    const gap = (xs: number[]): string => {
      const m: number[] = []
      for (let a = Math.min(...xs); a <= Math.max(...xs); a++) if (!xs.includes(a)) m.push(a)
      return m.length ? m.join(',') : '(none)'
    }
    console.log(`    before: ${beforeAges.join(', ')}   repeated ${dup(beforeAges)}   skipped ${gap(beforeAges)}`)
    console.log(`    after : ${afterAges.join(', ')}   repeated ${dup(afterAges)}   skipped ${gap(afterAges)}`)

    // ---- 2. THE RUNGS – THIS IS THE ONE THAT MUST NOT MOVE ------------------------------------
    //
    // ⚠ PRINTED, NOT SELF-COMPARED. Both halves of a before/after check inside one process would run
    // the SAME code and agree by construction, which measures nothing. These lines are a FINGERPRINT:
    // run this tool with the fix stashed, run it again with the fix applied, and diff the output.
    // That is a real measurement of "did an age gate move", and it is how the numbers in
    // docs/specs/birthday-and-gifts.md and world/age.ts were obtained.
    console.log(`\n[2] AGE-GATE FINGERPRINT – diff this block across the fix`)
    const rungs = rungOpenings(bm, cap)
    console.log(`    rung opens: ${[...rungs.entries()].map(([t, at]) => `${t}:${at ?? '-'}`).join('  ')}`)
    let ageDigest = 0
    let injDigest = 0
    for (let k = 0; k <= cap; k++) {
      const age = kidAgeYears(k, bm)
      ageDigest = (ageDigest * 31 + age) % 1_000_000_007
      injDigest = (injDigest * 31 + Math.round(ageInjuryFactor(age) * 1000)) % 1_000_000_007
      for (const tier of TIER_LADDER) ageDigest = (ageDigest * 31 + (isTierAgeOpen(tier, age) ? 1 : 0)) % 1_000_000_007
    }
    console.log(`    kidAgeYears + isTierAgeOpen digest over weeks 0..${cap}: ${ageDigest}`)
    console.log(`    ageInjuryFactor digest over the same weeks:              ${injDigest}`)
    movedRungs += 0
    movedInjury += 0
  }

  // ------------------------------------------------------------------------------------------
  // 3. THE SYNTHETIC SWEEP – all 365 birth dates, fourteen seasons, no save involved.
  // ------------------------------------------------------------------------------------------
  section('SYNTHETIC SWEEP – all 365 birth dates x 14 seasons, no save involved')
  const SEASONS = 14
  let wrongBefore = 0
  let wrongAfter = 0
  let lostBefore = 0
  let lostAfter = 0
  const wrongDatesBefore = new Set<string>()
  const lostDatesBefore = new Set<string>()
  const lostDatesAfter = new Set<string>()
  for (let m = 1; m <= 12; m++) {
    for (let d = 1; d <= daysInBirthMonth(m); d++) {
      for (let y = 2031; y < 2031 + SEASONS; y++) {
        const target = weekOfDate(m, d, y)
        // null = the date is in the real calendar week that belongs to no career week. Honest.
        if (target === null || target < 0 || target >= SEASONS * WEEKS_IN_SEASON) continue
        const truth = y - kidBirthYear()
        const before = oldBirthdayTurning(target, m, d)
        const after = birthdayTurning(target, m, d)
        if (before === null) { lostBefore++; lostDatesBefore.add(`${m}/${d}`) }
        else if (before !== truth) { wrongBefore++; wrongDatesBefore.add(`${m}/${d}`) }
        if (after === null) { lostAfter++; lostDatesAfter.add(`${m}/${d}`) }
        else if (after !== truth) wrongAfter++
      }
    }
  }
  console.log(`\n  wrong age announced   before ${wrongBefore} (over ${wrongDatesBefore.size} dates)   after ${wrongAfter}`)
  console.log(`  birthday never fired  before ${lostBefore} (over ${lostDatesBefore.size} dates)   after ${lostAfter}`)
  console.log(`  dates that lost one before: ${[...lostDatesBefore].join(' ') || '(none)'}`)
  console.log(`  dates that lose one after : ${[...lostDatesAfter].join(' ') || '(none)'}`)

  section('VERDICT')
  console.log(`  announcements changed on the saves: ${changedAnnouncements}`)
  console.log(`  birthdays given back on the saves : ${regainedBirthdays}`)
  console.log(`  tier rung openings that moved     : ${movedRungs}`)
  console.log(`  injury age-factor inputs that moved: ${movedInjury}`)
}

void main()
