// DOES THE ON-RAMP LOCK BEHIND HER?
//
// Owner, 31.07, playing: «бусинка много времени за сезон провела на J серии, побеждая и занимая там
// крутые места, получила global спонсора и возможность w15, но теперь не может играть в J серии,
// потому что ранг в national упал. Это нормально?»
//
// THE MECHANISM, from the code. `tierOpenFor` treats the BOTTOM rung of each table as an on-ramp
// read off the table below it, because "a player cannot hold a ranking in a table she has never
// played in" (world.ts). So J30 - the only J rung with no acceptance list - is gated on her DOMESTIC
// best-6 against `[250, MAX]`, while J60 and J300 are gated on her ITF rank.
//
// But domestic points are a ROLLING 52-WEEK best-6 (ranking.ts, WINDOW_WEEKS). A season spent
// abroad earns no domestic results, so the old ones age out and the domestic sum decays toward zero
// - and the on-ramp, which is re-checked every single week rather than crossed once, closes behind
// her. The better she does on the international table, the more certainly it shuts.
//
// THIS TOOL DOES NOT ARGUE THAT. IT COUNTS IT. Same careers as the econ bench - same presets, same
// policies, same entry policy - reporting how many weeks a girl who is ON the ITF table is locked
// out of its bottom rung, and how often she is locked out of J30 while J60/J300 stand open, which is
// the state that cannot be defended on any reading.
//
// ⚠ WHAT IT READ, BEFORE AND AFTER THE v34 LATCH - this is the tool's whole point, so the numbers
// live with it rather than only in the commit that moved them:
//
//                                                    before      after
//   through the J30 door, then shut out again        209/216      0/216
//   locked out of J30 while J60/J300 stood OPEN      160/216      0/216
//   weeks in that state, median / worst               53 / 151       -
//   18+, nothing open on the ITF or WTA tables       188/216      7/216
//
// The seven that remain never cleared the W15 standard at all: a girl who did not make it, which
// wants an ending (task #47) rather than a rule change. Re-run this after any change to the entry
// gates - a regression here is silent on every screen and invisible to a unit test, because the
// damage is a rung quietly missing from a calendar.
//
// Run: npx vite-node tools/j30-onramp-lock.ts

import { PRESETS, POLICIES, openCareer, stepCareerWeek } from './econ-bench'
// HER age, not the band: the J rungs gate on the one clock since 09.08 (src/engine/world/age.ts),
// so a bench that counted the 18+ wall off the band would count it up to eleven months early.
import { kidAgeAt, kidPoints, tierOpenFor } from '../src/engine/world'
import { TIERS, TIER_LADDER } from '../src/engine/season/calendar'

const WEEKS = 312 // 14 -> 20, the horizon the adult tour needs
const SEEDS = 12
const J30_FLOOR = TIERS.j30.enterPointBand[0]

interface Row {
  label: string
  /** careers that ever held an ITF ranking at all - the only ones this question applies to */
  onTable: number
  /** ⚠ THE HONEST DENOMINATOR. A fresh kid is locked out of J30 until she earns 250 domestic
   *  points, and that is the on-ramp DOING ITS JOB, not the bug. This counts only careers that
   *  were once through the door and were later shut out again - the ratchet, not the queue. */
  everLocked: number
  /** ...and of those, ever locked out of J30 while J60 or J300 stood open */
  everAbsurd: number
  /** weeks in that absurd state, per career that reached it */
  absurdWeeks: number[]
  /** her domestic best-6 at the moment the lock first bit */
  domAtLock: number[]
  /** her ITF rank at that same moment */
  itfAtLock: number[]
  /** ⚠ THE SAME RULE SHAPE ONE TABLE UP, and it lands harder. W15 is the WTA arm's on-ramp and it
   *  reads her ITF JUNIOR best-6 against [120, MAX]. The J rungs close at 18 on AGE, so from her
   *  eighteenth birthday she cannot earn another junior point - and 52 weeks later the junior
   *  window is empty and W15 shuts too, while W35/W100 want a professional rank she may not hold.
   *  Weeks at 18+ with NO rung open anywhere on any table: nothing in the world she may enter. */
  strandedWeeks: number[]
}

const rows: Row[] = []

for (const preset of PRESETS) {
  for (const policy of POLICIES) {
    const row: Row = {
      label: `${preset.label} · ${policy.label}`,
      onTable: 0,
      everLocked: 0,
      everAbsurd: 0,
      absurdWeeks: [],
      domAtLock: [],
      itfAtLock: [],
      strandedWeeks: [],
    }
    for (let i = 0; i < SEEDS; i++) {
      const { world, rng } = openCareer(preset, i, policy)
      let onTable = false
      let wasOpen = false // she has been through the door at least once
      let locked = false
      let absurd = 0
      let stranded = 0
      let recorded = false
      for (let w = 0; w < WEEKS; w++) {
        stepCareerWeek(world, rng, policy)
        // The 18+ wall, counted independently of everything below: from her eighteenth birthday the
        // J rungs are shut on age, so if the WTA on-ramp has also closed there is nothing anywhere.
        // ⚠ NOT "nothing at all" - `local` has a floor of zero, so something is ALWAYS open and that
        // measure reads 0/216 while saying nothing. A nineteen-year-old entering local domestic
        // events is not a career. The honest test is whether any rung of the two REAL tables - the
        // international one she came up on and the professional one she is stepping into - is open.
        if (kidAgeAt(world, world.week) >= TIERS.j30.maxAgeYears!) {
          const real = TIER_LADDER.filter((t) => TIERS[t].track !== 'domestic')
          if (!real.some((t) => tierOpenFor(world, t))) stranded++
        }
        // Only a career with a counting international result is on the table at all; everybody else
        // sits at the `cohort.length + 1` fallback, which is not a rank. Same test the brand bench uses.
        const ranked = world.results.some((r) => r.tier === 'j30' || r.tier === 'j60' || r.tier === 'j300')
        if (!ranked) continue
        onTable = true
        // The J rungs are U18 whatever her points do, so an 18-year-old locked out is the AGE rule
        // doing its job and is not this question.
        if (kidAgeAt(world, world.week) >= TIERS.j30.maxAgeYears!) continue
        if (tierOpenFor(world, 'j30')) {
          wasOpen = true
          continue
        }
        if (!wasOpen) continue // still queueing for the on-ramp, which is what an on-ramp is for
        locked = true
        if (!recorded) {
          recorded = true
          row.domAtLock.push(kidPoints(world, 'domestic'))
          row.itfAtLock.push(world.kidRank)
        }
        if (tierOpenFor(world, 'j60') || tierOpenFor(world, 'j300')) absurd++
      }
      if (onTable) row.onTable++
      if (locked) row.everLocked++
      if (absurd > 0) {
        row.everAbsurd++
        row.absurdWeeks.push(absurd)
      }
      if (stranded > 0) row.strandedWeeks.push(stranded)
    }
    rows.push(row)
  }
}

const med = (xs: number[]) => (xs.length === 0 ? 0 : [...xs].sort((a, b) => a - b)[Math.floor(xs.length / 2)])
const pad = (s: string | number, n: number) => String(s).padStart(n)

console.log(`\nJ30 IS GATED ON DOMESTIC POINTS [${J30_FLOOR}, MAX]; J60/J300 ARE GATED ON ITF RANK.`)
console.log(`${SEEDS} seeds x ${WEEKS} weeks (14 -> 20), U18 weeks only, careers holding an ITF ranking.\n`)
console.log(
  `${'preset · policy'.padEnd(38)} ${pad('on ITF', 7)} ${pad('locked', 7)} ${pad('J60 open', 9)} ${pad('wks', 5)}  ${pad('dom pts', 8)} ${pad('ITF #', 6)}`,
)
for (const r of rows) {
  console.log(
    `${r.label.padEnd(38)} ${pad(r.onTable, 7)} ${pad(r.everLocked, 7)} ${pad(r.everAbsurd, 9)} ${pad(med(r.absurdWeeks), 5)}  ${pad(med(r.domAtLock), 8)} ${pad(med(r.itfAtLock) || '-', 6)}`,
  )
}

const onTable = rows.reduce((n, r) => n + r.onTable, 0)
const locked = rows.reduce((n, r) => n + r.everLocked, 0)
const absurd = rows.reduce((n, r) => n + r.everAbsurd, 0)
const allAbsurdWeeks = rows.flatMap((r) => r.absurdWeeks)
console.log(`\nACROSS ALL ${rows.length * SEEDS} CAREERS`)
console.log(`  ever held an ITF ranking                     : ${onTable}`)
console.log(`  ...through the door once, then shut out again : ${locked}/${onTable}`)
console.log(`  ...locked out of J30 with J60/J300 OPEN      : ${absurd}/${onTable}`)
console.log(`  weeks in that state, median / worst          : ${med(allAbsurdWeeks)} / ${Math.max(0, ...allAbsurdWeeks)}`)
console.log(`  her domestic best-6 when the lock first bit  : median ${med(rows.flatMap((r) => r.domAtLock))} against a floor of ${J30_FLOOR}`)

const strandedCareers = rows.flatMap((r) => r.strandedWeeks)
console.log(`\nTHE SAME RULE ONE TABLE UP - 18+, NOTHING OPEN ON THE ITF OR WTA TABLES`)
console.log(`  careers with at least one such week          : ${strandedCareers.length}/${rows.length * SEEDS}`)
console.log(`  weeks stranded, median / worst               : ${med(strandedCareers)} / ${Math.max(0, ...strandedCareers)}`)
