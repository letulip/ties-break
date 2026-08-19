// HER LIFE OFF THE COURT - the three tiles of screen C's attribute grid that are not about results.
//
// The design's grid (docs/design/README.md §"C. Kid Profile") reads Personality / Confidence / Mood
// / School / Friends / Coach. Four of those six had an engine behind them; three did not, and the
// screen substituted dry facts (Rank / Born / Family) rather than invent one. The owner overruled
// that, 29.07: «school вполне по какой-то международной системе от возраста и месяца вполне можем
// считать, personality - это вот её play style отражением может быть, friends можно что-то
// рандомное там писать... Сухие факты грустно, пусть как в макете сделает.»
//
// So all three are DERIVED, and derived HERE rather than in the component, for the reason
// KidScreen's own header states: that screen is not allowed to derive a fact of its own. A line
// that lives in the engine can be tested; a line that lives in a template is a decoration.
//
// THE THREE RULES THIS MODULE KEEPS, all inherited from engine/diary.ts:
//
//  1. FACTS FIRST. Every line is selected BY facts the simulation already holds - her birth month,
//     her play style, the calendar, her injury, her travel bills, her losing run - and may assert
//     nothing they do not carry.
//  2. PURPOSE-SCOPED RANDOMNESS ONLY. Selection draws from `seed:friends:*` sub-streams, created
//     fresh and thrown away at SNAPSHOT time. ⚠ Zero draws on the MAIN weekly stream, so the frozen
//     capture (41550 draws / e6b0c709) cannot move by construction: nothing here runs in the tick.
//  3. STABLE PER WEEK. Same career, same week, same line - across re-renders, reloads and reruns.
//
// The module is PURE: it never imports world.ts (world.ts imports it), and everything it needs
// arrives as a narrow `KidLifeWorldView` the engine assembles in toSnapshot - the same dependency
// shape diary.ts and radar.ts already have.
//
// Player copy: English, short dash "-" only, and SHORT. The design's cells are 115px wide with
// `white-space: nowrap` on both value lines (a wrapped line pushes the tile out of its row), which
// is about seventeen characters at 11.5px/600. That is a real constraint on the writing and it is
// pinned in tests/kidLife.test.ts, not left to a careful author.

import { rngFromSeed } from './rng'
import { ECONOMY } from './economy'
import { isExamWeek, isOffSeasonWeek, isSummerWeek, WEEKS_PER_YEAR } from './season/calendar'
import { kidBirthYear } from './world/age'
import { seasonYear } from '../shared/dates'
import type { KidLife, KidLifeTile, PlayStyle } from '../shared/protocol'

/** The widest a tile line may be, in characters.
 *
 *  ⚠ THE REAL CONSTRAINT IS PIXELS: 89px of text inside the cell at 375pt (the narrowest phone the
 *  app supports - the design's own base is 390), at 11.5px Manrope with -0.01em tracking. Every
 *  line below was MEASURED against that in the browser, which is the only place font metrics exist;
 *  six of them were rewritten when the measurement said they clipped. This character cap is the
 *  cheap proxy the suite can check without a font, and it is deliberately one below where the
 *  measured lines sit - it catches the careless line, and the browser catches the wide one. */
export const TILE_LINE_MAX = 16

// =================================================================================================
// 1. SCHOOL - two cut-offs that do not agree, which is the whole interest of this tile
// =================================================================================================
//
// THE TENNIS YEAR RUNS ON 1 JANUARY. ITF junior age groups are by YEAR OF BIRTH, so a January girl
// is up to eleven months older than a December girl in the same draw (docs/specs/relative-age.md §2)
// - and the DRAW is what bands by the year, never the girl.
//
// ⚠ SO `ageYears` HERE IS HERS, NOT THE BAND'S, since the one-clock ruling (09.08, world/age.ts).
// This note used to say it was "START_AGE_YEARS + floor(week/52), so she turns on the season boundary
// whatever month she was actually born in", which was the defect rather than the design: this tile
// takes `birthMonth` two arguments later, so the old wiring let the School line reason from her real
// birthday while the age beside it came off a clock that had never heard of it.
//
// THE SCHOOL YEAR RUNS ON 1 SEPTEMBER. The convention this module picks, and states here as the
// spec asks:
//
//   * the school year begins in September and the intake cut-off is 1 September;
//   * a girl born in September-December belongs to the cohort that STARTS school that September,
//     so she is among the OLDEST in her class; a girl born January-August belongs to the cohort
//     that started the PREVIOUS September, so she is among the youngest;
//   * grade numbering is the North American one the design's own mockup uses ("10th grade"), where
//     a class beginning its year at age 5-6 is Grade 1.
//
// WHY THAT MATTERS, and it is the reason this tile is not just a number: the two orders are
// DIFFERENT. On the draw the order is January (oldest) to December (youngest). In the classroom it
// is September (oldest) to August (youngest). So a January girl is the oldest in her tennis age
// group and only mid-table in her class, while a December girl is the youngest on every draw sheet
// she plays and one of the oldest in the room at school. The tile shows the classroom half, because
// the tour half is what the rest of the game already is.
//
// ⚠ CONSISTENT WITH docs/specs/relative-age.md, which is designed but not yet built. That spec puts
// the effect on PHYSICAL development inside the 1-January age band and touches nothing else; this
// module only reads `birthMonth` and prints words. Neither moves a draw, and when the spec lands
// its `relativeAge(birthMonth) = (12 - birthMonth) / 12` keeps meaning exactly what it means today.

/** The month the school year turns over: 1 September. */
export const SCHOOL_CUTOFF_MONTH = 9

/** The season-week offset whose Monday is 1 September. Career week 0 is Monday 6 Jan 2031
 *  (shared/dates.ts), and 6 Jan + 34*7 days = 1 Sep 2031 exactly.
 *
 *  ⚠ IT IS APPROXIMATE, AND SINCE THE SEASON RE-ANCHOR IT IS APPROXIMATE BY A BOUNDED AMOUNT. This
 *  used to say the Monday "drifts ~1.25 days earlier per season" and leave it there, which was true
 *  and unbounded: a 364-day season against a Gregorian 365.2425 walked it out of September for good
 *  (27 Aug by season 4, 26 Aug by 5, 20 Aug by 10 - the round-16 #16 report). `shared/dates.ts` now
 *  anchors each season to the first Monday of its OWN year, so a season's first Monday is always
 *  Jan 1-7 and this offset can only ever land in the seven days Aug 27 - Sep 2, cycling rather than
 *  walking away. Measured:
 *
 *      s0 Sep 1 '31   s1 Aug 30 '32   s2 Aug 29 '33   s3 Aug 28 '34   s4 Aug 27 '35
 *      s5 Sep 1 '36   s6 Aug 31 '37   s7 Aug 30 '38   s8 Aug 29 '39   s9 Aug 27 '40
 *
 *  ⚠⚠ SO IT IS STILL AUGUST MOST SEASONS, AND `isSummerWeek`'S CALENDAR CEILING IS STILL WHAT KEEPS
 *  SCHOOL OUT OF IT. Re-anchoring bounded the error; it did not remove it. Do not read the fix in
 *  shared/dates.ts as licence to revert 7dd25d8 - see docs/specs/season-anchor.md §3d.
 *
 *  Kept as an offset because the derivation stays pure integer arithmetic instead of a date lookup,
 *  and because school ending is a SEASON fact (the last grade's September), not a date lookup. */
export const SCHOOL_YEAR_TURNS_AT = 34

/** True once the current season has passed its September - i.e. the school year that is running
 *  now began in THIS season's autumn rather than the previous one's. */
function pastSeptember(week: number): boolean {
  return ((week % WEEKS_PER_YEAR) + WEEKS_PER_YEAR) % WEEKS_PER_YEAR >= SCHOOL_YEAR_TURNS_AT
}

/** THE SCHOOL COHORT a girl belongs to, as the calendar year its September fell in. Born in
 *  September-December of year B she starts school with the September of year B; born January-August
 *  she started with the September of B-1. This one line is the whole cut-off. */
function schoolCohortYear(birthYear: number, birthMonth: number): number {
  return birthMonth >= SCHOOL_CUTOFF_MONTH ? birthYear : birthYear - 1
}

/** Her grade in the school year running NOW, or null once she is past the last one.
 *
 *  `birthYear` is her ITF birth year - the BAND's year, which is the same for every girl in it and is
 *  what `kidBirthYear()` returns. `schoolYearStart` is the calendar year the current school year began in.
 *  Grade G runs from age G+5 to G+6 on 1 September, which gives G = start - cohort - 6. */
export function gradeOf(birthYear: number, birthMonth: number, schoolYearStart: number): number | null {
  const grade = schoolYearStart - schoolCohortYear(birthYear, birthMonth) - 6
  return grade >= 1 && grade <= ECONOMY.school.lastGrade ? grade : null
}

// =================================================================================================
// ...AND WHEN IT ENDS (W4-SCHOOL). The owner: «Конец школы – в конце учебного года.»
// =================================================================================================
//
// ⚠ THIS IS THE SAME ARITHMETIC AS `gradeOf` AND IT HAD BETTER STAY THAT WAY, which is why it is
// derived from it rather than written beside it. The School tile has said "School finished" past the
// last grade since it shipped; every other surface in the game - the exam blackout, the day grid's
// eight-o'clock lesson block, the diary, the planner's refusal - ignored it, which is how a
// twenty-two-year-old professional ended up still sitting papers. One derivation, read everywhere.
//
// WHAT IT MEANS FOR HER AGE, measured over all twelve birth months (docs/specs/school-ends-2026-08.md
// §2): she leaves at career week 242 (born January-August) or 294 (September-December), always at
// season-week offset 34 - the 1 September the school year turns over on - and always at a REAL age
// between 18.00 and 18.92. Never before eighteen and never at nineteen, so it satisfies «школа уже
// после 18 вроде не должна быть» for every girl the game can generate, and it clears the act-3 fork
// (`ENDINGS.forkAgeYears` = 19) before that fork is ever raised. The two cannot contradict each
// other: she is out of school BEFORE she is asked whether to turn professional or take the
// scholarship, which is the order those questions come in for a real player.
//
// ZERO STATE. It is a pure function of (week, birthMonth), so a career loaded from a save answers it
// the same way the tick does, a save taken at twenty-two is out of school the moment it is read, and
// nothing can drift out of step with `world.week`. The v43 migration exists for the MOMENT (the
// milestone row), never for the fact.

/** THE CAREER WEEK SCHOOL ENDS: the 1 September on which she would have started a thirteenth grade.
 *
 *  `gradeOf`'s own arithmetic solved for the year instead of the grade. Grade G runs from the
 *  September of `cohort + G + 6`, so the year after the last one is `cohort + lastGrade + 7`, and
 *  the career week of that September is `SCHOOL_YEAR_TURNS_AT` plus whole seasons since the epoch. */
export function schoolEndWeek(birthMonth: number): number {
  const cohort = schoolCohortYear(kidBirthYear(), birthMonth)
  // `seasonYear(0)` is the epoch year, so this is its inverse and there is no second definition of
  // what year a season is (shared/dates.ts owns that, here as everywhere else).
  const seasonIndex = cohort + ECONOMY.school.lastGrade + 7 - seasonYear(0)
  return seasonIndex * WEEKS_PER_YEAR + SCHOOL_YEAR_TURNS_AT
}

/** Is she out of school in `week`? The one predicate every surface reads.
 *
 *  ⚠ TAKES THE WEEK IT IS ASKED ABOUT, not "now". The calendar's look-ahead, the Season screen's
 *  rows and the planner all ask about FUTURE weeks, and a boolean captured at the current week would
 *  quietly paint a lesson block on a week she will not be at school in. */
export function schoolIsOver(week: number, birthMonth: number): boolean {
  return week >= schoolEndWeek(birthMonth)
}

/** The COHORT'S school end, on the band clock (`ageAtWeek`), for the rivals who have no birth month.
 *
 *  The band's median birth month is 6.5 (`relativeAgeYears`), and `schoolCohortYear` only asks
 *  whether the month is September or later - so every month from January to August gives the same
 *  September, and 6 is that whole half of the band rather than one girl in it. It matters for one
 *  thing only: the extra recovery a blackout week pays, which the rivals must stop being paid at
 *  roughly the same time she does or the tour would quietly favour them for two weeks a year. */
export function schoolIsOverForBand(week: number): boolean {
  return schoolIsOver(week, 6)
}

/** Where she sits in her CLASS by age, 1 = the oldest. September-born first, August-born last -
 *  the exact reverse of the order the same twelve months give on a tennis draw sheet. */
export function classAgePosition(birthMonth: number): number {
  return (((birthMonth - SCHOOL_CUTOFF_MONTH) % 12) + 12) % 12 + 1
}

/** "8th grade" - every grade this game can reach (7 through 12) takes "th", but the suffix is
 *  spelled properly anyway so a future convention change cannot produce "12nd grade". */
function ordinal(n: number): string {
  const rem100 = n % 100
  if (rem100 >= 11 && rem100 <= 13) return `${n}th`
  return `${n}${['th', 'st', 'nd', 'rd'][n % 10] ?? 'th'}`
}

/** Her standing among classmates, in four bands of three months each: September-November at the top
 *  of the room, June-August at the bottom. The wording stays on AGE throughout ("oldest",
 *  "youngest") so it can never be misread as a mark. */
function classStanding(birthMonth: number): string {
  const pos = classAgePosition(birthMonth)
  if (pos <= 3) return 'Oldest in class'
  if (pos <= 6) return 'Older than most'
  if (pos <= 9) return 'Young in class'
  return 'Youngest of all'
}

/** THE SCHOOL TILE. Grade from age and birth month; the second line is the exam blackout when the
 *  calendar is holding one (ECONOMY.availability.examWeeks - real weeks, in which she cannot enter
 *  anything), the summer training block when the holidays are running, and her place in the class
 *  the rest of the time.
 *
 *  ⚠ THE SUMMER LINE IS A FACT ABOUT HER WEEK NOW, NOT DECORATION (W3-SUMMER). This module's own
 *  rule 1 is FACTS FIRST - "every line is selected BY facts the simulation already holds" - and until
 *  this wave the holidays held none: `isSummerWeek` was a display window and the engine did not gate
 *  on it, so a tile saying anything about summer would have been a line asserting more than the sim
 *  knew. The engine now develops and fatigues a summer week differently (engine/world/summer.ts), so
 *  the tile is reporting rather than colouring. It outranks the class standing because it is what the
 *  week IS; the exam fortnight still outranks it, and cannot collide with it anyway (weeks 23-24
 *  against 25-33). */
export function schoolTile(view: KidLifeWorldView): KidLifeTile {
  // ⚠ HER BIRTH YEAR IS THE BAND'S YEAR, NOT `seasonYear - ageYears` (one-clock ruling, 09.08). The
  // subtraction was exact only while `ageYears` was the band's - the two agreed by construction. They
  // do not now: a girl born in April is 13 through the January of 2031 and 14 from the April, so the
  // subtraction would call her born in 2018 for three months and 2017 for the rest, and her GRADE
  // would step a year in the middle of a school year and step back at the season boundary.
  //
  // `kidBirthYear()` is the career constant `schoolEndWeek` already reads, which is what makes this
  // literally «the SAME arithmetic» as `schoolIsOver` rather than merely a similar one - the claim
  // the note on this tile's `note` branch depends on.
  const birthYear = kidBirthYear()
  // Which September the school year running NOW began in: this season's, once it has passed.
  const schoolYearStart = view.seasonYear - (pastSeptember(view.week) ? 0 : 1)
  const grade = gradeOf(birthYear, view.birthMonth, schoolYearStart)
  if (grade === null) return { lead: 'School finished', note: 'No more bells' }
  return {
    lead: `${ordinal(grade)} grade`,
    // ⚠ HER BIRTH MONTH, NOT A CONSTANT (round-21 #6). This argument was the literal `false`, on the
    // reasoning that a grade exists, so she is at school, so an exam week is an exam week -
    // `schoolIsOver` and `gradeOf` being the SAME arithmetic (see `schoolEndWeek`) made the branch
    // unreachable-when-over rather than merely usually right. That reasoning is still true and the
    // constant is still gone, because the owner's ask was about the SHIFT rather than about this one
    // line: «Надо везде по коду проверить этот сдвиг.» A school fact decided from a literal is a
    // school fact that stops reading her birthday the day somebody re-shapes the arithmetic above it,
    // and it is exactly the shape `isExamWeek`'s own note calls "restores the bug silently". The two
    // expressions agree on every (week, birthMonth) the game can produce - measured over all twelve
    // months and eight seasons in tests/school-ends.test.ts - so this costs nothing today and cannot
    // drift tomorrow.
    note: isExamWeek(view.week, schoolIsOver(view.week, view.birthMonth))
      ? 'Exams this week'
      : isSummerWeek(view.week)
        ? 'Summer break'
        : classStanding(view.birthMonth),
  }
}

/**
 * ⭐ ROUND-21 #6 – THE ONE LINE THAT EXPLAINS THE SEPTEMBER, on the tile he found it on.
 *
 * ⚠ THE BEHAVIOUR IS CORRECT AND STAYS – that is the owner's ruling, and this is the whole of what
 * changes. His report: «Если день рождения в декабре, то вся школа уже закончилась и в сентябре вроде
 * бы её быть не должно, мы это обсуждали.» Round-21 #6 swept 35 sites and measured the answer: the
 * ITF band is one birth YEAR (every girl in the 14s shares a year) but the school year turns over on
 * 1 September, so the band splits and the two halves leave school 52 weeks apart – `schoolEndWeek`
 * returns career week 242 for January-August and 294 for September-December. In the September in
 * between, a December girl is in her final school year while her own age group has already left.
 *
 * ⚠ WHICH IS TRUE, AND READS ON SCREEN EXACTLY LIKE A BUG. Nothing anywhere said why, so the tile
 * printed "12th grade" in a month the rest of her year was done with school and offered no account of
 * itself. That is the defect this closes: not the clock, the silence around it.
 *
 * ⚠ AND IT IS SAID ONLY WHERE IT IS TRUE. `schoolCohortYear` is the whole cut-off in one line – born
 * in September or later she starts (and therefore finishes) a year behind the girls born earlier in
 * her own birth year – so this speaks for exactly those four months and is silent for the other
 * eight, where "she finishes later than the others" would be false. It is also silent once she is
 * out: `gradeOf` returning null is "School finished", which needs no explanation at all.
 *
 * ⚠ NOT A TILE LINE. Both `KidLifeTile` lines are `nowrap` on a 17-character budget; this is a
 * sentence and it renders under the grid (see `KidLife.schoolWhy`). Player copy: short dash only.
 *
 * Pure: `schoolCohortYear`'s own comparison and a grade lookup. Zero draws, nothing persisted.
 */
export function schoolCutOffNote(view: KidLifeWorldView): string {
  if (view.birthMonth < SCHOOL_CUTOFF_MONTH) return ''
  const schoolYearStart = view.seasonYear - (pastSeptember(view.week) ? 0 : 1)
  if (gradeOf(kidBirthYear(), view.birthMonth, schoolYearStart) === null) return ''
  return (
    'School runs on a 1 September cut-off and her birthday falls after it – so her last school year ' +
    'ends the summer after she turns 18, a year later than girls born earlier in the same tennis year.'
  )
}

// =================================================================================================
// 2. PERSONALITY - her play style, read as a person
// =================================================================================================
//
// The owner: «personality - это вот её play style отражением может быть». `playStyle` is picked at
// onboarding and never changes, so this tile is the one fixed thing on the grid - which is right:
// it is the export's own pairing for the paper scrap on the hero, where the mockup puts
// "Right-Handed" and we put her style. The scrap names the tennis fact; this names the girl.
//
// NOT ONE OF THESE LINES IS ABOUT TENNIS. That is the whole instruction and the only way the tile
// earns its place next to Mood: a counterpuncher who "returns everything" has told the player
// nothing they cannot read off the scrap two inches above. Register from engine/diary.ts - the
// parent observing, short, plain, present tense, no adjectives she could not have seen.
export const PERSONALITY: Record<PlayStyle, KidLifeTile> = {
  // She goes first and she goes now. A parent's word for it is not "aggressive", it is this.
  aggressive: { lead: 'Impatient', note: 'Wants it now' },
  // The one who outlasts the argument. Patient is the compliment; stubborn is what it costs.
  counterpuncher: { lead: 'Patient', note: 'And stubborn' },
  // She backs herself - and would never dream of saying so out loud.
  'serve-first': { lead: 'Backs herself', note: 'Never says so' },
  // No weapon, no hole: the girl who signs up for everything and is fine at all of it.
  'all-court': { lead: 'Curious', note: 'Tries everything' },
}

// =================================================================================================
// 3. FRIENDS - deterministic, and it moves
// =================================================================================================
//
// The owner: «friends можно что-то рандомное там писать». Two things make "random" mean something
// specific here, and both are load-bearing:
//
//  1. IT IS NOT RANDOM, IT IS SEEDED. This game never calls Math.random(). The name comes off
//     `seed:friends:year:<n>` and the line off `seed:friends:<week>` - purpose-scoped sub-streams
//     created at snapshot time, so the same career says the same thing on the same week forever and
//     the MAIN capture cannot move.
//
//  2. IT MOVES, because a tile that says one sentence from fourteen to nineteen is wallpaper. Two
//     different clocks drive it:
//       * THE NAME turns over with the SCHOOL YEAR - the same September the grade above it changes.
//         Whose girl is closest is a thing that resets when the timetable does, and for a girl who
//         spends a third of her weeks in another country it resets harder than for most. Never the
//         same name twice running, so the tile visibly moves at least once a season.
//       * THE LINE answers this week's facts: whether she is hurt, whether the family has been on
//         the road, whether she is on a losing run, whether she has just won something, and whether
//         the calendar has her at home for exams or the off-season.

/** Short first names, all <= 5 characters so every shape below fits the cell. Deliberately
 *  international: she meets people at school and in hotel lobbies in six countries. */
const FRIEND_NAMES = [
  'Emma', 'Mia', 'Sofia', 'Nina', 'Lena', 'Zoe', 'Iris', 'Maja',
  'Noor', 'Yuki', 'Alba', 'Ines', 'Sara', 'Elif', 'Hana', 'Aida',
] as const

/** How the first line names her. Two shapes, so the tile is not the same sentence with the noun
 *  swapped every September. */
const FRIEND_SHAPES: readonly ((name: string) => string)[] = [
  (n) => `Close to ${n}`,
  (n) => `${n} next door`,
]

/** How many weeks back the travel read looks. A quarter: long enough that one trip does not read as
 *  a life on the road, short enough that a quiet autumn shows up while it is still autumn. */
export const FRIENDS_WINDOW = 12
/** Weeks away inside that window at which the friendship is being conducted by phone. */
export const AWAY_OFTEN = 4
/** At or below this she has been home enough for it not to be a subject. */
export const AWAY_RARELY = 1
/** A losing run long enough that the people around her notice it. */
export const FRIENDS_LOSS_STREAK = 3
/** How fresh a title has to be for a friend to still be talking about it. */
export const FRIENDS_TITLE_WEEKS = 3

/** The week's facts, as the friends pool is allowed to see them. */
interface FriendFacts {
  injured: boolean
  /** W4-SCHOOL: two lines in the pool below name a classroom she has left. Facts first – rule 1 of
   *  this module – so the pool is told, rather than the lines being quietly reworded into vagueness.
   *  The bands stay TOTAL either way: both lines sit in bands that keep other members. */
  schoolOver: boolean
  exams: boolean
  offSeason: boolean
  /** weeks of the last `FRIENDS_WINDOW` in which the family paid to travel */
  weeksAway: number
  lossStreak: number
  weeksSinceTitle: number | null
}

/** True when nothing is keeping her at home and the travel read owns the line. */
const onTheOrdinaryClock = (f: FriendFacts): boolean => !f.injured && !f.exams && !f.offSeason

interface FriendLine {
  text: string
  license: (f: FriendFacts) => boolean
}

/** The pool. Every line is a plain observation a parent could make from the kitchen, and every one
 *  is licensed by a fact the simulation actually holds. The bands are TOTAL - injured, off-season,
 *  exam week and the three travel bands between them cover every week the engine can produce - so
 *  the tile can never come up empty (pinned in tests/kidLife.test.ts). */
const FRIEND_LINES: readonly FriendLine[] = [
  // --- she is hurt, so she is home, and being visited -----------------------------------------
  { text: 'She visits a lot', license: (f) => f.injured },
  { text: 'Comes by daily', license: (f) => f.injured },
  { text: 'Homework here', license: (f) => f.injured && !f.schoolOver },
  // --- the December weeks: nobody is anywhere ---------------------------------------------------
  { text: 'Home all month', license: (f) => !f.injured && f.offSeason },
  { text: 'Sleepovers now', license: (f) => !f.injured && f.offSeason },
  // --- exam fortnight ---------------------------------------------------------------------------
  { text: 'They revise', license: (f) => !f.injured && f.exams && !f.offSeason },
  { text: 'Studying, both', license: (f) => !f.injured && f.exams && !f.offSeason },
  // --- a season lived out of a suitcase ---------------------------------------------------------
  { text: 'Mostly by phone', license: (f) => onTheOrdinaryClock(f) && f.weeksAway >= AWAY_OFTEN },
  { text: 'Voice notes now', license: (f) => onTheOrdinaryClock(f) && f.weeksAway >= AWAY_OFTEN },
  { text: 'Away too much', license: (f) => onTheOrdinaryClock(f) && f.weeksAway >= AWAY_OFTEN },
  { text: 'Missing a lot', license: (f) => onTheOrdinaryClock(f) && f.weeksAway >= AWAY_OFTEN },
  // --- the in-between: a trip or two, nothing that costs her anybody ----------------------------
  {
    text: 'Good support',
    license: (f) => onTheOrdinaryClock(f) && f.weeksAway > AWAY_RARELY && f.weeksAway < AWAY_OFTEN,
  },
  {
    text: 'Texts every day',
    license: (f) => onTheOrdinaryClock(f) && f.weeksAway > AWAY_RARELY && f.weeksAway < AWAY_OFTEN,
  },
  {
    text: 'Still close',
    license: (f) => onTheOrdinaryClock(f) && f.weeksAway > AWAY_RARELY && f.weeksAway < AWAY_OFTEN,
  },
  // --- a stretch at home -------------------------------------------------------------------------
  { text: 'Over most days', license: (f) => onTheOrdinaryClock(f) && f.weeksAway <= AWAY_RARELY },
  { text: 'Over after class', license: (f) => onTheOrdinaryClock(f) && f.weeksAway <= AWAY_RARELY && !f.schoolOver },
  { text: 'Same as ever', license: (f) => onTheOrdinaryClock(f) && f.weeksAway <= AWAY_RARELY },
  { text: 'Two of a pair', license: (f) => onTheOrdinaryClock(f) && f.weeksAway <= AWAY_RARELY },
  // --- and two colours that cut across the bands, because a friend is who you tell ---------------
  // Deliberately overlapping: on a losing week these join whichever travel band is licensed, so the
  // tile can report the run without a band of its own.
  { text: 'She just listens', license: (f) => !f.injured && f.lossStreak >= FRIENDS_LOSS_STREAK },
  { text: 'Takes her side', license: (f) => !f.injured && f.lossStreak >= FRIENDS_LOSS_STREAK },
  {
    text: 'Proud of her',
    license: (f) => !f.injured && f.weeksSinceTitle !== null && f.weeksSinceTitle <= FRIENDS_TITLE_WEEKS,
  },
  {
    text: 'Watched it live',
    license: (f) => !f.injured && f.weeksSinceTitle !== null && f.weeksSinceTitle <= FRIENDS_TITLE_WEEKS,
  },
]

/** The 0-based index of the school year she is in - the clock the friend's NAME runs on. Chapter 0
 *  is the year already under way when the career opens; it turns over every September. */
export function schoolYearIndex(week: number): number {
  return Math.floor((week - SCHOOL_YEAR_TURNS_AT) / WEEKS_PER_YEAR) + 1
}

/** Who she is closest to in school year `index`, drawn once off that year's own sub-stream. Never
 *  the same girl two years running: a repeat would read as a bug rather than as a friendship. */
export function friendNameAt(seed: string, index: number): string {
  let previous = -1
  let pick = 0
  for (let i = 0; i <= index; i++) {
    pick = Math.floor(rngFromSeed(`${seed}:friends:year:${i}`)() * FRIEND_NAMES.length)
    if (pick === previous) pick = (pick + 1) % FRIEND_NAMES.length
    previous = pick
  }
  return FRIEND_NAMES[pick]
}

/** THE FRIENDS TILE. The name off the school year, the shape off the same draw, the line off the
 *  week's own facts - so it moves with the calendar AND with what is happening to her. */
export function friendsTile(view: KidLifeWorldView): KidLifeTile {
  const index = schoolYearIndex(view.week)
  const name = friendNameAt(seedSafe(view.seed), index)
  // A second draw on the year's stream picks how the line is phrased. Same stream, so a school year
  // is one decision: who, and how she is named.
  const shapeRng = rngFromSeed(`${seedSafe(view.seed)}:friends:shape:${index}`)
  const lead = FRIEND_SHAPES[Math.floor(shapeRng() * FRIEND_SHAPES.length)](name)

  const schoolOver = schoolIsOver(view.week, view.birthMonth)
  const facts: FriendFacts = {
    injured: view.injured,
    schoolOver,
    exams: isExamWeek(view.week, schoolOver),
    offSeason: isOffSeasonWeek(view.week),
    weeksAway: view.weeksAway,
    lossStreak: view.lossStreak,
    weeksSinceTitle: view.weeksSinceTitle,
  }
  const pool = FRIEND_LINES.filter((l) => l.license(facts))
  // The bands are total, so this fallback is unreachable - and it is here anyway, because a tile
  // with a blank second line is a worse failure than a plain one.
  if (pool.length === 0) return { lead, note: 'Still close' }
  const rng = rngFromSeed(`${seedSafe(view.seed)}:friends:${view.week}`)
  return { lead, note: pool[Math.floor(rng() * pool.length)].text }
}

/** A career always has a seed; this only keeps a hand-built test world from producing `undefined`
 *  inside a stream key, which would silently share one stream across careers. */
function seedSafe(seed: string): string {
  return seed || 'seed'
}

// =================================================================================================
// THE VIEW, AND THE ASSEMBLY
// =================================================================================================

/** The narrow slice of the world these three tiles are allowed to read. Assembled by toSnapshot -
 *  the structural type is what keeps this module free of a world.ts import cycle. */
export interface KidLifeWorldView {
  seed: string
  week: number
  /** HER age in whole years, off her own birth date (`kidAgeAt`) - not the 14 + season-index band it
   *  used to be (one-clock ruling, 09.08).
   *
   *  ⚠ AND `schoolTile` DELIBERATELY DOES NOT DERIVE HER BIRTH YEAR FROM IT. Standard age arithmetic
   *  is off by one before a birthday, so `seasonYear - ageYears` would move her school cohort twice a
   *  year; the tile reads `kidBirthYear()` instead. Kept on the view because it is the module's
   *  declared slice of the world, not because the school line still needs it. */
  ageYears: number
  /** the display year of the CURRENT season - `seasonYear(floor(week/52))`, the one year identity
   *  the whole app agrees on (shared/dates.ts). Passed in rather than re-derived, so this module
   *  cannot invent a second definition of what year it is. */
  seasonYear: number
  playStyle: PlayStyle
  /** 1-12 */
  birthMonth: number
  injured: boolean
  /** weeks of the last `FRIENDS_WINDOW` in which a travel bill was actually paid - the engine's own
   *  record of the family being somewhere else. */
  weeksAway: number
  /** her current run of consecutive competitive losses (0 when the last one was a win) */
  lossStreak: number
  /** weeks since her most recent title, or null if she has never won one */
  weeksSinceTitle: number | null
}

/** Everything screen C's three derived tiles need. Called once per snapshot. */
export function buildKidLife(view: KidLifeWorldView): KidLife {
  return {
    personality: PERSONALITY[view.playStyle] ?? PERSONALITY['all-court'],
    school: schoolTile(view),
    schoolWhy: schoolCutOffNote(view),
    friends: friendsTile(view),
  }
}
