// ⭐ THE EMPTY-WEEK CENSUS – how many weeks of a career have no tennis on them at all.
//
//   npx vite-node tools/empty-week-census.ts [--seeds N] [--policy 1] [--from-age 14] [--to-age 26]
//
// THE OWNER'S QUESTION, 16.08, and it OVERRULES the acceptance test it replaces: «вообще не страшно,
// если иногда в сетке есть пустые недели, не вижу ничего плохого. Так что просто надо понять сколько
// пустых недель у нас есть вообще и оттуда отталкиваясь делать логику. До этого я играл – всё было
// нормально с календарем, меня более чем устраивало. Если сейчас так же – то это ок.»
//
// So the deliverable is a NUMBER and a COMPARISON, not a pass/fail. This tool exits 0 always; the
// verdict is the diff against the build he played (`6c7507b`), run in a worktree.
//
// ⚠⚠ WHY `tools/boredom-guard.ts` CANNOT ANSWER IT, stated here because the two look like the same
// tool and are not. The boredom guard inspects ONLY weeks where a W entry was REFUSED BY THE AER CAP
// – it starts from `entryStatus(...).reason === 'capped'` on the pro arm and asks what else that week
// offered. On the current build that is 674 weeks of 3,120 lived, of which 88 had no alternative. A
// week that is simply EMPTY – nothing refused because nothing was scheduled, or everything on it
// locked on rank – is INVISIBLE to it, because no refusal ever put the week on its list. The guard
// answers "does the cap strand her?"; this answers "how much of the calendar is blank?".
//
// THE THREE CLASSES, and the third is the whole reason the number means anything:
//
//   * PLAYABLE  – at least one scheduled event she could have entered, asked of the ENGINE's own gate
//                 (`entryStatus` level 'ok' or 'caution' – a fatigue caution is a playable week by the
//                 owner's own rule) at the LAST DECISION MOMENT for that event, its deadline week.
//                 An event she actually holds an entry for counts too, whatever the gate says today:
//                 the entry is honoured (`entryStatus` governs entering, not an entry already made).
//   * EMPTY     – a non-blackout week with no enterable event at all.
//   * BLACKOUT  – off-season, school exams, a booked family week, an injury layoff. ⚠ THESE ARE NOT
//                 EMPTY WEEKS. They are the calendar working: the tour is shut, or she is at her
//                 desk, or away with her family, or hurt. Counting them as "empty" would put ~7 weeks
//                 a season of deliberate design into a number the owner is reading as a defect, and
//                 the figure would be meaningless. They are reported separately and are OUT of the
//                 share's denominator.
//
// ⚠ AND THE POLICY IS NOT THE CALENDAR. The career is DRIVEN by `POLICIES[1]` (the player arm) so the
// world evolves the way a played career does – her rank, her money, her fatigue, her bookings all
// come from a plausible parent. But the CLASSIFICATION never asks the policy anything: a week the
// player arm declined to enter (too dear, too tired, a rung she has outgrown) is PLAYABLE, because
// tennis was there and she chose otherwise. Reading the policy's own refusals as empty weeks would
// measure the bench's opinions and call them the game's calendar.
//
// ⚠ THE READ IS AT THE DEADLINE, WHICH IS `tools/boredom-guard.ts`'s idiom and is deliberate. Entry
// lists close before the week is played, so "could she have entered" is a question about the moment
// the decision was live, with the AER allowance, her rank and her ranking book as they stood then.
// Each event is scored EXACTLY ONCE, the first week its deadline is not in the future, and the scan
// is by event id rather than by week so a season chunk appended later cannot be missed.
//
// ⚠ AN ENDED CAREER IS NOT A CALENDAR FACT. Bankruptcy and the career-ending injury latch an
// `ending`, after which `stepCareerWeek` enters nothing by construction; those weeks are counted in
// their own column and excluded from every share. The fork at nineteen is never answered (the
// baseline tool's own property, kept so the two tables describe the same careers).

import {
  entryStatus,
  isBlackoutWeek,
  schoolIsOver,
  layoffCovering,
  vacationForWeek,
  kidAgeAt,
} from '../src/engine/world'
import { isOffSeasonWeek, WEEKS_PER_YEAR } from '../src/engine/season/calendar'
import { openCareer, stepCareerWeek, POLICIES, PRESETS } from './econ-bench'

const args = process.argv.slice(2)
const argOf = (name: string, fallback: number): number => {
  const i = args.indexOf(`--${name}`)
  return i >= 0 && args[i + 1] !== undefined ? Number(args[i + 1]) : fallback
}

/** careers per preset – 2 x 9 presets = 18 careers, comfortably over the brief's n >= 12. */
const SEEDS = argOf('seeds', 2)
const POLICY = POLICIES[argOf('policy', 1)] ?? POLICIES[1]
const FROM_AGE = argOf('from-age', 14)
const TO_AGE = argOf('to-age', 26)

/** ⚠ THE AGE AXIS IS HERS, NOT THE WEEK COUNTER'S. A career opens at 14.0 and the brief asks for 14
 *  to 26, so the horizon is the last week she is still 26 – computed off `kidAgeAt` rather than
 *  assumed to be 13 x 52, because the birth month puts her birthday inside the season year. */
const WEEKS = (TO_AGE - FROM_AGE + 1) * WEEKS_PER_YEAR

interface AgeCell {
  playable: number
  empty: number
  blackout: number
  ended: number
}
const zeroCell = (): AgeCell => ({ playable: 0, empty: 0, blackout: 0, ended: 0 })

const byAge = new Map<number, AgeCell>()
const total = zeroCell()
/** why an empty week was empty – the classifier, so a share can be read as a cause rather than a mood */
const emptyReasons = new Map<string, number>()
/** blackout weeks by their own kind, so "the calendar working" is itself legible */
const blackoutKinds = new Map<string, number>()
let careersEnded = 0
/** ⚠ THE ONE PLACE THE POLICY COULD HIDE THE ANSWER, so it is measured rather than trusted. A booked
 *  family week is a blackout by the brief's own list – but it is the only blackout the BENCH books
 *  rather than the calendar, and `planRecoveryWeek` books it when she is run down, which correlates
 *  with a thin stretch of season. If a rescue week happens to land on a week that had nothing on it
 *  anyway, the census would count a blackout where an empty week lived. These two counters give the
 *  UPPER BOUND: fold every booked family week back into the denominator and the ones that were blank
 *  anyway back into the numerator. */
let vacationWeeks = 0
let vacationWeeksBlank = 0

const bump = (m: Map<string, number>, k: string): void => {
  m.set(k, (m.get(k) ?? 0) + 1)
}

let careers = 0
for (let s = 0; s < SEEDS; s++) {
  for (let p = 0; p < PRESETS.length; p++) {
    const { world, rng } = openCareer(PRESETS[p], s, POLICY)
    careers++
    /** target week -> was ANY event on it enterable when its entry list closed */
    const playableFor = new Map<number, boolean>()
    /** target week -> the refusal reasons of the events that were on it, for the classifier */
    const refusalsFor = new Map<number, string[]>()
    const scored = new Set<string>()

    for (let i = 0; i < WEEKS; i++) {
      // --- score every event whose entry list has now closed, exactly once ------------------------
      for (const e of world.season) {
        if (scored.has(e.id) || e.deadlineWeek > world.week) continue
        scored.add(e.id)
        const st = entryStatus(world, e)
        const held = world.entries.includes(e.id)
        const ok = held || st.level === 'ok' || st.level === 'caution'
        playableFor.set(e.week, (playableFor.get(e.week) ?? false) || ok)
        const rs = refusalsFor.get(e.week) ?? []
        rs.push(ok ? 'ok' : (st.reason ?? 'blocked'))
        refusalsFor.set(e.week, rs)
      }

      // --- classify the week she is living through -----------------------------------------------
      const week = world.week
      const age = kidAgeAt(world, week)
      const cell = byAge.get(age) ?? zeroCell()
      byAge.set(age, cell)
      const schoolOver = schoolIsOver(week, world.profile.birthMonth)
      if (world.ending !== null) {
        cell.ended++
        total.ended++
      } else if (isBlackoutWeek(week, schoolOver)) {
        cell.blackout++
        total.blackout++
        bump(blackoutKinds, isOffSeasonWeek(week) ? 'off-season' : 'school exams')
      } else if (vacationForWeek(world, week) !== undefined) {
        cell.blackout++
        total.blackout++
        bump(blackoutKinds, 'booked family week')
        vacationWeeks++
        if (playableFor.get(week) !== true) vacationWeeksBlank++
      } else if (layoffCovering(world, week) !== null) {
        cell.blackout++
        total.blackout++
        bump(blackoutKinds, 'injury layoff')
      } else if (playableFor.get(week) === true) {
        cell.playable++
        total.playable++
      } else {
        cell.empty++
        total.empty++
        const rs = refusalsFor.get(week)
        bump(emptyReasons, rs === undefined || rs.length === 0 ? 'no event scheduled at all' : [...new Set(rs)].sort().join('+'))
      }

      stepCareerWeek(world, rng, POLICY)
    }
    if (world.ending !== null) careersEnded++
    console.error(`  career ${careers}/${SEEDS * PRESETS.length} done`)
  }
}

const pct = (n: number, d: number): string => (d === 0 ? '   – ' : `${((100 * n) / d).toFixed(1)}%`)
const perSeason = (n: number, weeks: number): string =>
  weeks === 0 ? '  – ' : ((n * WEEKS_PER_YEAR) / weeks).toFixed(1)

console.log('')
console.log(`EMPTY-WEEK CENSUS – ${careers} careers x ${WEEKS} weeks (ages ${FROM_AGE}-${TO_AGE}), policy "${POLICY.label}"`)
console.log(`  ${careersEnded} of ${careers} careers latched an ending inside the horizon`)
console.log('')
const lived = total.playable + total.empty + total.blackout + total.ended
const nonBlackout = total.playable + total.empty
console.log(`  weeks lived                     ${lived}`)
console.log(`  blackout (not empty – by design)${String(total.blackout).padStart(7)}   ${pct(total.blackout, lived)} of lived`)
console.log(`  after an ending (excluded)      ${String(total.ended).padStart(7)}   ${pct(total.ended, lived)} of lived`)
console.log(`  NON-BLACKOUT weeks              ${String(nonBlackout).padStart(7)}   <- the denominator`)
console.log(`    playable                      ${String(total.playable).padStart(7)}   ${pct(total.playable, nonBlackout)}`)
console.log(`    EMPTY                         ${String(total.empty).padStart(7)}   ${pct(total.empty, nonBlackout)}   = ${perSeason(total.empty, nonBlackout + total.blackout)} weeks per 52-week season`)
console.log(
  `  UPPER BOUND – every booked family week folded back in (${vacationWeeks} weeks, ${vacationWeeksBlank} of them blank anyway):` +
    ` ${pct(total.empty + vacationWeeksBlank, nonBlackout + vacationWeeks)} of non-blackout,` +
    ` ${perSeason(total.empty + vacationWeeksBlank, nonBlackout + total.blackout)} per season`,
)
console.log('')
console.log('  BY AGE (share of that age\'s non-blackout weeks, and empty weeks per season lived at that age)')
console.log('    age   lived  blackout   playable     EMPTY   share   /season')
for (let age = FROM_AGE; age <= TO_AGE; age++) {
  const c = byAge.get(age) ?? zeroCell()
  const l = c.playable + c.empty + c.blackout + c.ended
  if (l === 0) continue
  const nb = c.playable + c.empty
  console.log(
    `    ${String(age).padStart(3)} ${String(l).padStart(7)} ${String(c.blackout).padStart(9)} ` +
      `${String(c.playable).padStart(10)} ${String(c.empty).padStart(9)} ${pct(c.empty, nb).padStart(7)} ` +
      `${perSeason(c.empty, nb + c.blackout).padStart(9)}`,
  )
}
console.log('')
console.log('  WHY THE EMPTY WEEKS WERE EMPTY (the events that WERE on the week, by refusal reason)')
for (const [reason, n] of [...emptyReasons].sort((a, b) => b[1] - a[1])) {
  console.log(`    ${String(n).padStart(6)}  ${pct(n, total.empty).padStart(6)}  ${reason}`)
}
console.log('')
console.log('  BLACKOUT WEEKS BY KIND (for completeness – none of these is an empty week)')
for (const [kind, n] of [...blackoutKinds].sort((a, b) => b[1] - a[1])) {
  console.log(`    ${String(n).padStart(6)}  ${pct(n, total.blackout).padStart(6)}  ${kind}`)
}
