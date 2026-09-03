// HER AGE: the band and the girl, and the birthday that lands in the feed.
//
// ⚠ DEPENDENCY DIRECTION. `WorldState` is a TYPE-ONLY import (erased at compile time), so world.ts
// imports these values with no runtime cycle. Only `markBirthday` touches the world; everything else
// is pure arithmetic over (week, birthMonth, birthDay) and draws on no RNG stream at all.
import { WEEKS_PER_YEAR } from '../season/calendar'
import { daysInBirthMonth, weekMonth, weekOfDate, weekStartDay, weekYear } from '../../shared/dates'
import { addEvent } from './ledger'
import type { WorldState } from '../world'

/** Detailed weekly simulation starts here; childhood becomes a prologue (Phase 6). */
export const START_AGE_YEARS = 14

// =================================================================================================
// ONE CLOCK, AND IT IS HERS. The owner's ruling of 09.08, and what is left of the other one.
// =================================================================================================
//
// The owner, 30.07: «девочка, родившаяся в декабре, по идее, в этой возрастной группе должна на момент
// января иметь возраст 13 лет, согласно году рождения и началу занятий в теннис. Или нет?»
//
// YES. And the reasoning is worth writing down, because it turns on how tennis is organised:
//
//   ⚠ TENNIS IS A CALENDAR-YEAR SPORT. Unlike hockey (August cutoff) or school (September), the ITF
//   junior circuit bands by YEAR OF BIRTH and runs its season January to November with December off. The
//   game already has that right - week 1 is January and OFF_SEASON_WEEKS are 49-52 - so there is no
//   cutoff to move. What was wrong is the AGE.
//
//   The career opens in January 2031 with her in the 14s, so every girl in her band was born in 2017. A
//   girl born in January turns 14 that same month; a girl born in December turns 14 ELEVEN MONTHS LATER
//   and is genuinely THIRTEEN for almost the whole season - playing the same draws, against the same
//   girls. That is the relative age effect in its primary form, and it is a fact about her age rather
//   than a modifier applied to it.
//
// ⚠⚠ AND THEN THE SPLIT WAS MADE INTO TWO AGES, WHICH WAS THE MISTAKE. This file used to describe
// `ageAtWeek` as "THE BAND / THE CAREER CLOCK" and hand it to every gate in the game, so a December
// girl was told she was 14 while `growWeek` developed her as 13, and the two numbers disagreed by a
// full year FOR THE WHOLE CAREER (measured on the owner's own save: band 14 / girl 13 at week 0, band
// 18 / girl 17 at week 208). It printed 16 on Home from week 104 while her own birthday note said «She
// is sixteen this week» at week 154 - fifty weeks apart, both from the engine - and it let a girl born
// in March enter a W15 at 15.83 because `TIERS.w15.minAgeYears = 16` was being asked of the band.
//
// The owner's ruling, 09.08: «Есть год рождения и дата. Это всё. Если она родилась в середине декабря
// и пошла на теннис, то на начало игры ей всё ещё 13, кстати, так же, как и всем остальным, кто
// родился НЕ на 1й неделе января. Дальше когда ДР – тогда и +1 год.»
//
//   `kidAgeExact` / `kidAgeYears` IS HER AGE. Everywhere a surface prints one and everywhere a rule
//   asks how old she is: the printed age, the tier gates, both entry allowances, the medical refusal,
//   the academy band, the album. One clock, off a birth date, and it is the only one she has.
//
// ⚠ `ageAtWeek` DID NOT DISAPPEAR - IT STOPPED BEING AN AGE. It keeps exactly one job, and the job is
// not about her at all: `coachById(world.seed, ageAtWeek(world.week), world.coachId)` DERIVES THE COACH
// ROSTER, a purely functional market with nothing persisted but the chosen id, which is what lets a
// saved coach resolve years later without a migration. Make that input depend on her birthday and every
// December career's roster re-rolls and their hired coach resolves to a different person or to nobody.
// So it is THE MARKET'S RESTOCKING CLOCK: a market of coaches for 14-year-olds does not restock because
// one girl has a late birthday. Read `ageAtWeek` for the coach and his prices, `kidAgeYears` for her.
//
// THE COHORT IS THE OTHER EXCEPTION, and it is not one. Rival players carry their OWN `ageYears` and
// `season/tournament.ts` asks `isTierAgeOpen(event.tier, p.ageYears)` of it - a band, because a cohort
// player has no birth date to be exact about. That is their clock, not hers, and it stays.

/** THE COACH MARKET'S RESTOCKING CLOCK - NOT HER AGE. Whole years since the career opened, birth month
 *  deliberately absent, so the derived roster is the same for every girl in the band.
 *
 *  ⚠ IF YOU ARE ASKING HOW OLD SHE IS, THIS IS THE WRONG FUNCTION - use `kidAgeYears` / `kidAgeAt`. See
 *  the note above: this input must stay birth-month-free or every December career's coach re-rolls. */
export function ageAtWeek(week: number): number {
  return START_AGE_YEARS + Math.floor(week / WEEKS_PER_YEAR)
}

/** Her BIRTH YEAR: the band's year, which is the same for every girl in it. The career opens in the
 *  January of `seasonYear(0)`, so a girl in the START_AGE band was born START_AGE years before it. */
export function kidBirthYear(): number {
  return weekYear(0) - START_AGE_YEARS
}

/** HER REAL AGE in `week`, fractional, off the game's own calendar.
 *
 *  A January girl is 14.0 at week 0; a December girl is 13.08 and does not turn 14 until week ~48. Feeds
 *  development (`growWeek`), her eligibility allowance, the injury table and every surface that prints an
 *  age - everything, in short, that is about the GIRL rather than about her age group. */
export function kidAgeExact(week: number, birthMonth: number, birthDay: number): number {
  const { month, day } = birthDate(birthMonth, birthDay)
  const year = weekYear(week)
  const m = weekMonth(week)
  const d = weekStartDay(week)
  // Has her birthday in THIS calendar year already arrived, by the Monday this week starts on?
  const turned = m > month || (m === month && d >= day)
  const whole = year - kidBirthYear() - (turned ? 0 : 1)
  // Months elapsed since that birthday, with the day carried as a fraction of the current month, so
  // the answer rises smoothly inside the year and crosses New Year without a step.
  // ⚠⚠ THE WHOLE YEAR COMES FROM THE DATE TEST ALONE, AND THE FRACTION MAY NEVER MOVE IT. Both drafts
  // of this line got that wrong in opposite directions and both were caught by the guards rather than
  // by reading: scaling the day gap by the CURRENT month dropped a year (born 30 January, asked in the
  // week of 1 February, printed twenty the week after she was told she turned twenty-one), and scaling
  // it by HER month let it exceed twelve and ADD one (born 1 February, week of Monday 31 January:
  // `11 + 30/28` is 12.07, so her sixteenth arrived a week early). A fraction that can change `floor`
  // is a second clock wearing a decimal point, which is the exact thing the 09.08 ruling abolished.
  //
  // So `whole` is the answer and `frac` is only ever presentation: clamped into [0, 1) by
  // construction, so `Math.floor(kidAgeExact(...)) === whole` for every date and every week.
  const monthsWhole = turned ? m - month : m - month + 12
  const dayFrac = (d - day) / daysInBirthMonth(month)
  const frac = Math.min(0.999999, Math.max(0, (monthsWhole + dayFrac) / 12))
  return whole + frac
}

/** ...and the whole-years version, which is what the age-keyed tables want. */
export function kidAgeYears(week: number, birthMonth: number, birthDay: number): number {
  return Math.floor(kidAgeExact(week, birthMonth, birthDay))
}

/** HER AGE IN `week`, whole years, read off the world's own profile - the ONE clock, at the call sites
 *  that hold a world and a week rather than a birth month.
 *
 *  ⚠ IT EXISTS SO THE RULING HAS ONE SPELLING. Nine gates (both entry caps, the tier age block, the
 *  ladder ceiling, both mandatory arms, the academy band, the snapshot, the album) each had
 *  `ageAtWeek(week)` and each would otherwise have grown its own `kidAgeYears(week,
 *  world.profile.birthMonth)`. One name means a later question about which age a rule reads has one
 *  place to be answered, and it is why `git grep kidAgeAt` is the audit of the ruling. */
export function kidAgeAt(world: WorldState, week: number): number {
  return kidAgeYears(week, world.profile.birthMonth, world.profile.birthDay)
}

/** THE FIRST WEEK OF THE AGE-YEAR CONTAINING `week` – the opening of her birthday-to-birthday window
 *  (P2, docs/specs/age-eligibility-window-2026-08.md).
 *
 *  ⚠ IT EXISTS FOR THE PRUNE, NOT FOR THE COUNT. The two entry allowances answer "is this ledger row
 *  inside the same age-year as this event?" by comparing `kidAgeAt` on the two weeks, which needs no
 *  boundary at all and cannot disagree with the age clock by construction. What DOES need a boundary
 *  is `pruneInternationalEntries`, because a prune has to know the earliest week anything can still
 *  read – and after P2 that is her birthday rather than the season's first Monday.
 *
 *  A BACKWARD SCAN, and it is exact rather than arithmetic on purpose: `kidAgeExact` is built on
 *  `weekYear`/`weekMonth`, which are the game's own calendar and are monotone in the week, so walking
 *  back while the age is unchanged lands on the first week of the band whatever the calendar does
 *  around New Year. Bounded by one year of weeks (the table is one row per year of her life), and by
 *  week 0 for the first, part-year band a career opens in.
 *
 *  ⚠ AND MEMOISED, FOR THE MEASURED REASON `weekStart` IS (16.08). The scan is exact and cheap per
 *  step, but it is up to 52 steps and it sits under both merit arms, which sit under both entry
 *  allowances, which are asked for every event on every card of every week. Pure function of
 *  (`birthMonth`, `week`) – `kidAgeAt` reads nothing else off the world – so the key is both, and a
 *  second career with a different birth month gets its own answers rather than the first one's. */
const WINDOW_START_MEMO = new Map<string, number>()

export function ageWindowStartWeek(world: WorldState, week: number): number {
  const birthMonth = world.profile.birthMonth
  const key = `${birthMonth}:${Math.floor(week)}`
  const hit = WINDOW_START_MEMO.get(key)
  if (hit !== undefined) return hit
  const age = kidAgeAt(world, week)
  let from = Math.floor(week)
  while (from > 0 && kidAgeAt(world, from - 1) === age) from--
  WINDOW_START_MEMO.set(key, from)
  return from
}

/** Her birth date, clamped to a date a calendar can hold. Both entry points below clamp through this
 *  one helper, so a nonsense profile cannot make them disagree about which date they are discussing. */
function birthDate(birthMonth: number, birthDay: number): { month: number; day: number } {
  const month = Math.max(1, Math.min(12, Math.round(birthMonth)))
  return { month, day: Math.max(1, Math.min(daysInBirthMonth(month), Math.round(birthDay))) }
}

/** THE CALENDAR YEAR of the birthday this week MARKS, or null when it marks none. The primitive both
 *  public functions below are written on, so they cannot answer differently.
 *
 *  ⭐⭐⭐ ROUND 34 #3 – A BIRTHDAY IS MARKED IN THE WEEK THE ONE CLOCK TICKS, NOT IN THE WEEK THE DATE
 *  FALLS IN. The owner, playing: «Увидел попап про 15 летите … а затем на home перешёл, а там написано
 *  14 лет. Подозреваю, что это из-за дат: ДР 15го, а начало недели 14го, но раз мы показали попап – то
 *  уже можно и возраст менять, либо сам попап в таких случаях в конце недели показать» – and his
 *  diagnosis was exact. A career week is Monday..Sunday; `kidAgeExact` answers for the MONDAY (the
 *  right question for a rule that governs a whole week, see the ruling above); a birthday on the
 *  Tuesday therefore sat one week ahead of the age the Home line printed. He named both fixes and
 *  this is the second of them, «показать в конце недели»: the note, the popup, the confetti and the
 *  diary fact all move to the week her age actually changes.
 *
 *  ⚠ THE FIRST FIX WAS NOT TAKEN, AND THE ONE-CLOCK RULING IS THE REASON. Bumping the printed age
 *  inside the birthday week means bumping `Snapshot.ageYears` – and that field is not a caption. The
 *  ladder's card, the week grid's band, the prize share and the portrait stage all read it, so it
 *  would open a tier in the UI a week before `kidAgeAt` opens it in the engine; giving Home a display
 *  age of its own would be a second clock on the wire in so many words. Moving the announcement moves
 *  nothing but the announcement.
 *
 *  ⭐⭐ SO THE OLD CARRY CLAUSE IS NOW THE WHOLE RULE, and that is the shape of the fix. It already
 *  read "the first career week whose Monday is on or after her date"; it was reached only when
 *  `weekOfDate` could not place the date at all. Promoting it makes the predicate exactly
 *  «`kidAgeYears(week) > kidAgeYears(week - 1)`» – the clock's own tick – so the announcement cannot
 *  disagree with the printed age by construction rather than by a pin. Measured before the change
 *  over all 365 birth dates and fourteen seasons: **4365 of 5106 announcements (85%) printed an age
 *  Home did not yet agree with**, on every one of the 365 dates; the clock ticked in a week nothing
 *  was said 4359 times, and something was said in a week the clock had not ticked 4359 times. After:
 *  0, 0 and 0.
 *
 *  ⚠ AND IT RETIRES THE WHOLE LOST-BIRTHDAY CLASS instead of patching it a fourth time. The three
 *  previous fixes here (round-16 #100's date read, the 1-5 January straddle, 18.08's carry for the
 *  dates the calendar has no week for) were all the same defect: a date can fail to land in a career
 *  week, and a predicate written on the DATE then loses the birthday in silence. The clock cannot
 *  lose one – it steps by exactly one year exactly once per calendar year, whatever the calendar does
 *  around New Year – so 31 December and 1-6 January are ordinary dates here now.
 *
 *  ⚠ THREE CANDIDATE YEARS, AND ALL THREE ARE STILL NEEDED. The Monday that ticks the clock can be in
 *  the year before her date (never – it is on or after it), in its own year, or in the NEXT one: a 31
 *  December birthday is marked by a Monday in January, so `weekYear(week)` is already the following
 *  year and her own year would never be a candidate without `monday - 1`. `monday + 1` is its mirror,
 *  for a girl born 1-5 January whose marking Monday can still sit in the old year's last career week.
 *
 *  ⚠ AND IT CANNOT DOUBLE-FIRE. Two candidate years are twelve months apart and the transition window
 *  is one week wide, so at most one year in the loop can answer for any week.
 *
 *  ⚠ `week > 0` IS NOT DEFENSIVE, IT IS THE CAREER'S OWN START, and the note it carried before this
 *  change still holds: without it the clause fires at week 0 for a date a whole YEAR before the game
 *  opens – a girl born 1 January would be announced turning THIRTEEN in her first week, because week 0
 *  is the first Monday past 1 January 2030 as surely as it is past 1 January 2031. Anything before
 *  week 0 is prologue and has no week to be announced in. ⚠ ROUND 34 WIDENED WHAT THAT COSTS BY ONE
 *  DATE: week 0's Monday is 6 January 2031, so a girl born exactly on the 6th has her fourteenth in
 *  the career's first week, where there is no previous week for the clock to have ticked from – she
 *  opens the game at fourteen (`kidAgeYears(0) === 14`, which is the honest number) and her first
 *  marked birthday is her fifteenth. The six dates 7-12 January used to be announced AT week 0 as
 *  «turning 14» while Home printed 13 – the owner's own complaint, in the first week of the game –
 *  and are marked in week 1 now, where the two agree. */
function birthdayYearIn(week: number, birthMonth: number, birthDay: number): number | null {
  const { month, day } = birthDate(birthMonth, birthDay)
  const monday = weekYear(week)
  if (week <= 0) return null
  for (const year of [monday - 1, monday, monday + 1]) {
    if (mondayOnOrAfter(week, month, day, year) && !mondayOnOrAfter(week - 1, month, day, year)) {
      return year
    }
  }
  return null
}

/** Is the Monday that opens `week` on or after (`month`, `day`) of `year`? The three scalar readers
 *  composed into one date comparison – see `weekStartDay` in shared/dates.ts for why they are scalars. */
function mondayOnOrAfter(week: number, month: number, day: number, year: number): boolean {
  if (week < 0) return false
  const wy = weekYear(week)
  if (wy !== year) return wy > year
  const wm = weekMonth(week)
  return wm > month || (wm === month && weekStartDay(week) >= day)
}

/** The career week that MARKS her birthday for the calendar year containing `week`, or null if the
 *  calendar cannot place that date at all.
 *
 *  ⚠ THE WEEK HER DAY IS KEPT IN, and the day is still what decides it. The owner asked for the day
 *  precisely so this lands right: «мы же будем ее с ДР на неделе поздравлять (и подарки дарить,
 *  кстати), чтобы точно знать на какой нам нужен день».
 *
 *  ⭐⭐ ROUND 34 #3 MOVED IT ONE WEEK FOR A MID-WEEK DATE, and it had to move WITH the predicate or the
 *  two would answer differently about the same birthday – which is this function's whole reason for
 *  being written on `birthdayYearIn`. The marked week is the first career week whose MONDAY has
 *  reached her date, i.e. the week `kidAgeYears` says she is a year older in; for a birthday that
 *  falls on a Monday that is the week containing it, and for every other day it is the week after.
 *  See `birthdayYearIn` for the owner's complaint and the measurement.
 *
 *  CAN BE NEGATIVE, and the caller must not assume every season has one: a girl born 1-5 January had
 *  her birthday before week 0 began, so her first in-game one is the following year. `birthdayTurning`
 *  compares against the current week, so that resolves itself. */
export function birthdayWeek(week: number, birthMonth: number, birthDay: number): number | null {
  if (birthdayYearIn(week, birthMonth, birthDay) !== null) return week
  const { month, day } = birthDate(birthMonth, birthDay)
  const year = weekYear(week)
  const at = weekOfDate(month, day, year)
  // A date the calendar has no career week for has no week CONTAINING it either, and that is the one
  // honest absence here (see `weekOfDate`). Otherwise the mark is that week when its Monday has already
  // reached the date, and the next one when it has not – the Monday after `at` is always past a date
  // inside `at`, whatever the season re-anchor does to the gap between them.
  if (at === null) return null
  return mondayOnOrAfter(at, month, day, year) ? at : at + 1
}

/** Is `week` her birthday week, and if so what age does she turn? Null on every other week.
 *
 *  DERIVED, NOT PERSISTED - a pure comparison of the calendar against her birth date, so it cannot drift
 *  out of step with the profile; it reads the profile and nothing else.
 *
 *  ⚠ THE AGE COMES OFF THE BIRTHDAY'S OWN CALENDAR YEAR, AND NOTHING ELSE GETS A VOTE (round-16 #100).
 *  It used to return `kidAgeYears(week, birthMonth)` - the MONTH clock, read off the week's MONDAY - and
 *  that is a year LOW for every girl born on the 1st-6th of a month, because a week that contains the 4th
 *  starts on a Monday that is usually still in the month before. Found by the season-anchor slice on the
 *  owner's own save (docs/specs/season-anchor.md §7): born 2 February, the game announced FIFTEEN TWICE
 *  and never announced nineteen. Measured across all 365 birth dates it was 466 wrong announcements over
 *  66 dates - the 1st to the 6th of all eleven months from February on.
 *
 *  ⚠ AND `kidAgeExact` IS NOT THE BUG, WHICH IS WHY IT IS UNTOUCHED. It takes a birth MONTH and no day,
 *  by signature and on purpose: it is the development / injury / tier-gate clock, and it answers "how old
 *  is she at the START of this week" - the right question for a rule that governs a whole week.
 *
 *  ⭐⭐ ROUND 34 #3 CLOSED THE ONE WEEK THEY WERE ALLOWED TO DIFFER BY, AND THE NOTE HERE USED TO LICENSE
 *  IT. It read: «An ANNOUNCEMENT is about a DATE. So this reads the date, that reads the month, and the
 *  two are allowed to differ for the ONE week a year between her birthday and the Monday after it
 *  (pinned, bounded at one week).» The owner met that week on screen – the popup said fifteen and Home
 *  said fourteen – and the licence is withdrawn: this fires in the week her age CHANGES, so the two
 *  agree everywhere. See `birthdayYearIn` for his words, the fix he chose and the measurement. Still no
 *  age-keyed gate moves – `kidAgeExact` is untouched, which is the whole point of moving this instead. */
export function birthdayTurning(week: number, birthMonth: number, birthDay: number): number | null {
  const year = birthdayYearIn(week, birthMonth, birthDay)
  return year === null ? null : year - kidBirthYear()
}

/** ⭐⭐ THE AGE SHE REACHES BY THE END OF `week` – her age, plus a birthday that lands INSIDE it.
 *
 *  ⚠ IT EXISTED BECAUSE THE DATE CLOCK SPLIT TWO THINGS THAT USED TO COINCIDE (18.08): `kidAgeAt`
 *  answered for the week's MONDAY, `birthdayTurning` fired in the week CONTAINING her date, and for a
 *  birthday on any day but a Monday those were different weeks – so a rule meant to be raised ON HER
 *  BIRTHDAY (the fork at nineteen was the one) would have fired the Monday AFTER the cake.
 *
 *  ⭐⭐⭐ ROUND 34 #3 CLOSED THAT SPLIT AND THIS IS AN IDENTITY NOW – the honest note, kept in place of
 *  a quiet deletion. The announcement moved to the week the clock ticks, so `birthdayTurning(week)` is
 *  non-null only where `kidAgeAt(world, week)` already equals it and the `Math.max` can no longer
 *  choose the second argument. It is left standing because CALLER-LESS AND HARMLESS beats a fifth
 *  reader of `kidAgeAt` growing its own look-ahead later: if a future question really does need "the
 *  age she reaches by the end of this week" to differ from the Monday's, this is where that argument
 *  belongs, and it will need a reason of its own rather than the one round 34 spent.
 *
 *  ⚠ AND THE HALF THAT IS STILL LIVE: every GATE stays on `kidAgeAt`. An eligibility rule governs the
 *  whole week and must not open mid-week – that is the 09.08 ruling's own consequence and nothing here
 *  softens it. ⚠ CALLER-LESS SINCE ROUND 24 #5: the fork was the one caller until the owner moved its
 *  ask off her birthday to school's end («пункт 5 запускай как обсудили» – `forkDue` reads
 *  `schoolIsOver` now, docs/specs/college-departure-2026-08.md). */
export function kidAgeThroughWeek(world: WorldState, week: number): number {
  const turning = birthdayTurning(week, world.profile.birthMonth, world.profile.birthDay)
  return Math.max(kidAgeAt(world, week), turning ?? -1)
}

/** Numbers she is old enough to be told in words. The notes are somebody's voice, and a parent does not
 *  say "she is 15 today". Past the junior years the words stop being the natural register, so the map
 *  covers the ages a career can actually reach and the caller falls back to the numeral. */
/** ⭐⭐ HOW THIS GAME SPELLS AN AGE, in one place (19.08). Words while the number is one a parent would
 *  say out loud, the numeral once it stops being one.
 *
 *  ⚠ IT WAS A PRIVATE MAP AND ONE CALLER UNTIL THE VOICE WAVE WANTED A SECOND. `markBirthday` had
 *  `AGE_WORDS[turning] ?? String(turning)` inline; the birthday DIALOG then grew its own headings and
 *  spelled the same age as a numeral in five age bands and as a word in one - so the popup and the feed
 *  line it sits above disagreed about the same birthday, and the popup disagreed with itself.
 *
 *  ⚠ THE FALLBACK IS THE RULE, NOT A GUARD. Twenty is where the map stops on purpose: past it the
 *  numeral IS how it is said. So "she is twenty this week" and "27 today" are both correct, and both
 *  come out of this function rather than out of whoever is writing copy that day. */
export function ageInWords(age: number): string {
  return AGE_WORDS[age] ?? String(age)
}

const AGE_WORDS: Record<number, string> = {
  13: 'thirteen',
  14: 'fourteen',
  15: 'fifteen',
  16: 'sixteen',
  17: 'seventeen',
  18: 'eighteen',
  19: 'nineteen',
  20: 'twenty',
}

/** THE BIRTHDAY, in the feed. One line, in the family's own register, and it names the AGE because that is
 *  the fact of the week - the relative-age story is told by her age being 13 in a 14s draw, and this is
 *  where the player first meets it.
 *
 *  ⭐⭐⭐ ROUND 24 – THE COLLEGE VARIANT (`collegeBirthdayLine`, `atCollege`) IS GONE WITH THE RULING
 *  THAT CREATED IT. The 19.08 ruling gave the college years a feed line INSTEAD of the dialog
 *  («колледжевые годы получают не попап, а свою запись в дневнике») because a blocking prompt could
 *  not be answered inside a 52-week loop; the 22.08 ruling («да, день рождения делай») delivers the
 *  dialog – `resumeFromCollege` pauses the year on her birthday week and the parent answers on the
 *  live Home shell. The substitute's whole reason is gone, and two of its four lines («Old enough
 *  now that nobody thinks to tell you first», «the news reached you late») would be flatly
 *  contradicted by a gift dialog asked THAT week. One sentence for every birthday of her life; where
 *  she is that week is told by the shell around it and by the gift she is asked about. */
export function markBirthday(world: WorldState): void {
  const turning = birthdayTurning(world.week, world.profile.birthMonth, world.profile.birthDay)
  if (turning === null) return
  const words = ageInWords(turning)
  addEvent(world, {
    week: world.week,
    type: 'info',
    text: `She is ${words} this week.`,
  })
}
