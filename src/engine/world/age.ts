// HER AGE: the band and the girl, and the birthday that lands in the feed.
//
// ⚠ DEPENDENCY DIRECTION. `WorldState` is a TYPE-ONLY import (erased at compile time), so world.ts
// imports these values with no runtime cycle. Only `markBirthday` touches the world; everything else
// is pure arithmetic over (week, birthMonth, birthDay) and draws on no RNG stream at all.
import { WEEKS_PER_YEAR } from '../season/calendar'
import { daysInBirthMonth, weekMonth, weekOfDate, weekYear } from '../../shared/dates'
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
export function kidAgeExact(week: number, birthMonth: number): number {
  const month = Math.max(1, Math.min(12, Math.round(birthMonth)))
  // Months elapsed since her birthday, as a fraction of a year, measured on the real calendar.
  const monthsIntoYear = weekMonth(week) - month
  const yearsSinceBirthYear = weekYear(week) - kidBirthYear()
  return yearsSinceBirthYear + monthsIntoYear / 12
}

/** ...and the whole-years version, which is what the age-keyed tables want. */
export function kidAgeYears(week: number, birthMonth: number): number {
  return Math.floor(kidAgeExact(week, birthMonth))
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
  return kidAgeYears(week, world.profile.birthMonth)
}

/** The career week her birthday falls in for the calendar year containing `week`, or null if that date is
 *  off the calendar.
 *
 *  ⚠ THE WEEK CONTAINING HER ACTUAL DATE, not the first week of her month - which is what this did before
 *  the day existed. The owner asked for the day precisely so this lands right: «мы же будем ее с ДР на
 *  неделе поздравлять (и подарки дарить, кстати), чтобы точно знать на какой нам нужен день».
 *
 *  CAN BE NEGATIVE, and the caller must not assume every season has one: a girl born 1-5 January had her
 *  birthday before week 0 began, so her first in-game one is the following year. `birthdayTurning`
 *  compares against the current week, so that resolves itself. */
export function birthdayWeek(week: number, birthMonth: number, birthDay: number): number | null {
  const month = Math.max(1, Math.min(12, Math.round(birthMonth)))
  const day = Math.max(1, Math.min(daysInBirthMonth(month), Math.round(birthDay)))
  return weekOfDate(month, day, weekYear(week))
}

/** Is `week` her birthday week, and if so what age does she turn? Null on every other week.
 *
 *  DERIVED, NOT PERSISTED - a pure comparison of the calendar against her birth date, so it cannot drift
 *  out of step with `kidAgeExact`; both read the profile and nothing else. */
export function birthdayTurning(week: number, birthMonth: number, birthDay: number): number | null {
  if (week !== birthdayWeek(week, birthMonth, birthDay)) return null
  // On her birthday week she has just reached this age, so the floor of her exact age IS the new number.
  return kidAgeYears(week, birthMonth)
}

/** Numbers she is old enough to be told in words. The notes are somebody's voice, and a parent does not
 *  say "she is 15 today". Past the junior years the words stop being the natural register, so the map
 *  covers the ages a career can actually reach and the caller falls back to the numeral. */
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
 *  where the player first meets it. */
export function markBirthday(world: WorldState): void {
  const turning = birthdayTurning(world.week, world.profile.birthMonth, world.profile.birthDay)
  if (turning === null) return
  const words = AGE_WORDS[turning] ?? String(turning)
  addEvent(world, {
    week: world.week,
    type: 'info',
    text: `She is ${words} this week.`,
  })
}
