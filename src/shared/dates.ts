// Round 5 item 1 – real dates. Pure: week N -> a calendar date range, no engine/DOM deps.
// The career's week 0 always starts Monday, Jan 6, 2031 (a fixed fictional epoch), and every
// week spans a Monday..Sunday of the real calendar.
//
// Dash style (owner instruction): en dash "–" only, never an em dash, in all display text.
//
// =================================================================================================
// ⚠⚠ THE CALENDAR RE-ANCHORS EVERY SEASON. Owner approved 11.08, and it is the ROOT this file used
// to have three separate workarounds for.
// =================================================================================================
//
// It used to run CONTINUOUSLY off one epoch: `weekStart(week) = Jan 6 2031 + 7*week days`. A season
// is 52 weeks = 364 days and a Gregorian year is 365.2425, so the whole career SLID ~1.24 days
// earlier every season – a full week every ~5.6 seasons, and a long career meets the consequences
// three or four times. Three symptoms were paid for separately before the cause was named:
//
//   * SEASON 5 VANISHED from the Stats table. `weekYear(208) === weekYear(260) === 2035` – the
//     season's opening Monday had walked back over New Year – so the wrap-up's dedup guard read
//     season 5 as already banked and dropped its row. Worked around with a season-index re-key
//     (migrations v16) and `seasonYear`, not fixed.
//   * SCHOOL WAS DRAWN IN AUGUST (round-16 #16): season-week offset 34, the first week after the
//     summer holidays, is 1 Sep 2031 in season 0 and then 30 Aug '32, 29 Aug '33, 28 Aug '34.
//   * The surface blocks and the exam fortnight are season-week spans that name real months in
//     their comments, and every one of those names was going quietly stale.
//
// THE FIX: a season is anchored to the FIRST MONDAY OF ITS OWN YEAR, not to the season before it.
//
//     seasonIndex   = floor(week / WEEKS_IN_SEASON)
//     weekStart(w)  = firstMonday(EPOCH_YEAR + seasonIndex) + (w mod WEEKS_IN_SEASON) * 7 days
//
// No drift, ever. The ~1.24 days a season are absorbed at the New Year boundary, where nobody can
// look: in a year the calendar needs 53 weeks to cover, the gap between one season's last Monday
// and the next season's first Monday is 14 days instead of 7, and one real calendar week simply
// belongs to no career week. The player only ever reads dates, and the dates are now permanently
// correct.
//
// ⚠ AND `weekYear` STOPPED BEING ABLE TO COLLIDE. Season N opens in EPOCH_YEAR + N by construction,
// so `weekYear(week) === seasonYear(floor(week / WEEKS_IN_SEASON))` identically, for every week of
// every career. The season-5 collision is not scanned around any more – it cannot be expressed.
// See the note on `weekYear` for what that does and does NOT license.
//
// ⚠ WHAT THIS DELIBERATELY DOES NOT TOUCH. The ENGINE's week index is still absolute and still
// counts straight through (`seed:injury:87`, the frozen MAIN capture, the save format, every bench).
// Nothing here draws from any RNG stream; this file imports nothing at all.

const MS_PER_DAY = 24 * 60 * 60 * 1000

/** The calendar year season 0 opens in – Monday 6 Jan 2031 is still week 0.
 *
 *  ⚠ A LITERAL, where it used to be `weekYear(0)`. `weekYear` now anchors on the season, so deriving
 *  the epoch year from it would be circular (and a temporal-dead-zone crash at module load). This is
 *  the ONE place the epoch year is stated; `weekYear(0)` still returns it, and tests pin that. */
const EPOCH_YEAR = 2031

/** A season is exactly 52 career weeks – THE ONLY 52 IN THE ENGINE since TB-02. Declared up here
 *  because `weekStart` is now a function OF the season index. `WEEKS_PER_YEAR` in
 *  engine/season/calendar.ts is an alias of this (it used to be its own literal, kept equal by a
 *  comment), and engine/economy.ts reads this directly rather than the calendar's copy – that edge
 *  was half of a runtime import cycle that crashed the browser at module load. */
export const WEEKS_IN_SEASON = 52

const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
] as const

interface Ymd {
  month: number // 0-11
  day: number
  year: number
}

/** UTC ms of the first Monday of `year` – the anchor a whole season hangs off.
 *
 *  Jan 1 falls on some weekday; the first Monday is 0..6 days later, so the anchor is always in
 *  Jan 1..Jan 7. `getUTCDay` is 0=Sunday, hence the Sunday-is-7 fold. */
function firstMondayUtc(year: number): number {
  const jan1 = Date.UTC(year, 0, 1)
  const dow = new Date(jan1).getUTCDay() || 7 // 1 Mon .. 7 Sun
  return jan1 + ((8 - dow) % 7) * MS_PER_DAY
}

/** UTC ms of the Monday that opens career `week`. THE ONE place the mapping lives.
 *
 *  Total for negative weeks too, and it has to be: entry deadlines and `weekOfDate` both reach
 *  behind week 0. Week -1 is season -1's offset 51, i.e. the Monday before the career opened. */
function weekStartUtc(week: number): number {
  const w = Math.floor(week)
  const seasonIndex = Math.floor(w / WEEKS_IN_SEASON)
  const offset = w - seasonIndex * WEEKS_IN_SEASON // 0..51 for every integer, negatives included
  return firstMondayUtc(EPOCH_YEAR + seasonIndex) + offset * 7 * MS_PER_DAY
}

function ymdAt(utc: number): Ymd {
  const d = new Date(utc)
  return { month: d.getUTCMonth(), day: d.getUTCDate(), year: d.getUTCFullYear() }
}

/** ⚠⚠ MEMOISED, AND THE REASON IS A MEASURED 25x, NOT A MICRO-OPTIMISATION (16.08).
 *
 *  P2's birthday-to-birthday window made the age clock a HOT path. `ageWindowStartWeek` walks back a
 *  year of weeks asking `kidAgeAt` at each step, `kidAgeExact` asks `weekMonth` AND `weekYear`, and
 *  both land here - so one window question cost ~104 `new Date` allocations, and the two entry
 *  allowances ask it for every event on every card of every week. Nothing was wrong with the answers;
 *  the garbage was the problem.
 *
 *  IT IS INVISIBLE ON ONE FILE AND FATAL ON EIGHT. `tests/plan.test.ts` + three of its neighbours run
 *  in 9s alone either way - a single worker has all the heap it needs. The bulk shard runs 136 files
 *  across eight workers, and there the churn tipped the whole run into GC: **74s -> 1877s, with 16
 *  files timing out and zero assertion failures.** That is the same shape as the contention hazard
 *  CLAUDE.md records, which is exactly why it took a before-and-after on the same machine to tell the
 *  two apart rather than a guess about which one it looked like.
 *
 *  PURE FUNCTION OF AN INTEGER, so the memo cannot be wrong: `weekStartUtc` floors its argument and
 *  reads nothing but constants. FROZEN because the value is now SHARED - every caller in this file
 *  reads fields off it and none mutates, and freezing is what makes that a guarantee rather than a
 *  habit for the next reader. The map is bounded by the weeks a session actually asks about
 *  (a career is ~700; a bench sweep re-asks the same ones), so it does not grow with time. */
const WEEK_START_MEMO = new Map<number, Ymd>()

/** First day (Monday) of the given career week, as {month, day, year}. */
function weekStart(week: number): Ymd {
  const key = Math.floor(week)
  const hit = WEEK_START_MEMO.get(key)
  if (hit !== undefined) return hit
  const value = Object.freeze(ymdAt(weekStartUtc(key)))
  WEEK_START_MEMO.set(key, value)
  return value
}

/** Last day (Sunday) of the given career week, as {month, day, year}. */
function weekEnd(week: number): Ymd {
  return ymdAt(weekStartUtc(week) + 6 * MS_PER_DAY)
}

/** THE CALENDAR MONTH the week's Monday falls in, 1-12.
 *
 *  Exported for the age model (world.ts `kidAgeExact`) and for her birthday. A REAL-CALENDAR fact about a
 *  date, like `weekYear` below and with the same warning: it is not a season identity. The epoch is Monday
 *  6 Jan 2031, so week 0 is January and the season's own week 1 is too - see the note on the season start
 *  in docs/specs/relative-age.md.
 *
 *  ⚠ THAT LAST SENTENCE IS NOW A GUARANTEE RATHER THAN AN OBSERVATION. Since the re-anchor every season
 *  opens on the first Monday of its own year, which is always Jan 1-7, so EVERY season's week 1 is in
 *  January - it used to be true of the early seasons and to walk off with the drift. What did NOT become
 *  a guarantee is any later offset: offset 34, the school-year turn, still lands in August most seasons
 *  (docs/specs/season-anchor.md §3d). A season-week offset is not a month. */
export function weekMonth(week: number): number {
  return weekStart(week).month + 1
}

/** THE DAY OF THE MONTH the week's Monday falls on, 1-31 – the third of the three numbers that make
 *  a week's Monday a real date (`weekYear`, `weekMonth`, this).
 *
 *  ⚠ IT EXISTS FOR THE AGE CLOCK, AND FOR ONE DEFECT IT CLOSES (18.08). `kidAgeExact` was built on
 *  the MONTH alone, so a girl's age rose on the first Monday of her birth month rather than on her
 *  birthday: measured across all 365 birth dates, **287 of them** printed an age she had not reached,
 *  by up to SIX WEEKS, and a 31 December date could print 19 while she was 17. The owner's ruling of
 *  09.08 is the standard it failed – «Есть год рождения и дата. Это всё… Дальше когда ДР – тогда и
 *  +1 год» – and a date needs a day.
 *
 *  ⚠ ONE NUMBER RATHER THAN THE WHOLE `Ymd`, deliberately. The internal shape is frozen and shared
 *  between every formatter in this file; handing it out would make the module's public surface a
 *  struct that callers could come to depend on the layout of. Three scalar readers compose into a
 *  date wherever one is genuinely needed, and nowhere else has needed one in eleven waves. */
export function weekStartDay(week: number): number {
  return weekStart(week).day
}

/** Month names in full, for the ONE label that is about a person rather than about a week. */
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
] as const

/** ⭐ "12 June" – HER BIRTH DATE. Day and month, NO WEEK AND NO YEAR (owner, 11.08: «а можно просто
 *  день и месяц без недель? B-Day 12 june или вроде того»).
 *
 *  ⚠ IT EXISTS BECAUSE THE PLAYER WAS NEVER TOLD EITHER NUMBER. `profile.birthDay` and
 *  `profile.birthMonth` have existed since v25 and they drive the relative-age effect, `kidAgeExact`,
 *  the injury age curve and the birthday itself – and no surface printed them. A parent who does not
 *  know their daughter's birthday is the one fact the game must not withhold.
 *
 *  ⚠ AND THE FORMAT IS WHAT MAKES IT IMMUNE TO A CALENDAR CHANGE. The WEEK her birthday lands in is
 *  derived (`birthdayWeek`) and moved once already when the seasons re-anchored; the day and the month
 *  cannot move, because they are her birth date and have been stored since v25. Printing the DATE
 *  rather than the week is therefore both what he asked for and the version that never needs revisiting.
 *
 *  Here rather than on the screen for the reason every other formatter in this file is: the moment a
 *  component spells a date itself, two components spell it two ways. Full month names and not the
 *  three-letter `MONTHS`, because this line sits beside her age in prose and "12 Jun" reads as a fixture. */
export function birthDateLabel(birthMonth: number, birthDay: number): string {
  const m = Math.max(1, Math.min(12, Math.round(birthMonth)))
  const d = Math.max(1, Math.min(daysInBirthMonth(m), Math.round(birthDay)))
  return `${d} ${MONTH_NAMES[m - 1]}`
}

/** How many days her birth month has.
 *
 *  ⚠ FEBRUARY IS 28, NOT 29, AND THAT IS PRINCIPLED RATHER THAN LAZY. Her birth year is the band's year -
 *  2017 for a career opening in 2031 - which is not a leap year, so 29 February is not a date she can have
 *  been born on. Offering it would mean either a girl with a birthday every four years or a silent clamp,
 *  and both are worse than not offering it. */
export function daysInBirthMonth(month: number): number {
  const m = Math.max(1, Math.min(12, Math.round(month)))
  return [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][m - 1]
}

/** The career week whose Monday..Sunday span CONTAINS `month`/`day` of `year`, or null when that date is
 *  outside the career's calendar.
 *
 *  ⚠ CAN BE NEGATIVE, AND THE CALLER HAS TO MEAN IT. Week 0 starts Monday 6 Jan 2031, so 1-5 January 2031
 *  falls in week -1: a girl born on 3 January has already had her birthday by the time the career opens,
 *  and her first in-game one is in 2032. That is the honest answer rather than a bug - the career started
 *  after her birthday - and it is why the birthday check compares against the CURRENT week rather than
 *  assuming every season contains one.
 *
 *  ⚠ AND NULL IS NOW REACHABLE MID-CAREER, not only off the ends. Seasons re-anchor, so the calendar
 *  weeks a career covers are no longer one unbroken run: in a year that needs 53 weeks the New Year gap
 *  is 14 days rather than 7, and the real week inside that gap belongs to NO career week. A date there
 *  is honestly reported as absent, which is why the search below tries the season that owns `year` and
 *  then the tail of the one before it rather than doing division and trusting the answer.
 *
 *  ⚠ MEASURED ON ALL 365 BIRTH DATES BEFORE SHIPPING, twelve seasons each, because a birthday is the
 *  one thing this can silently take away. The re-anchor GIVES nine dates a birthday back (22-30
 *  December had eleven in twelve seasons on the old calendar and now have twelve) and costs exactly
 *  ONE date one: a girl born 31 December has no birthday week in season 9, because 31 Dec 2040 is the
 *  first day of a skipped week. 355 dates are unchanged. Not silently swallowed - `birthdayTurning`
 *  compares against the current week and already treats "no birthday this year" as a real answer, for
 *  the reason above. docs/specs/season-anchor.md §3e; whether she should be given it early is a policy
 *  question and the owner's. */
export function weekOfDate(month: number, day: number, year: number): number | null {
  const target = Date.UTC(year, Math.max(1, Math.min(12, Math.round(month))) - 1, Math.max(1, day))
  if (!Number.isFinite(target)) return null
  const seasonIndex = year - EPOCH_YEAR
  // A date in `year` sits either inside that year's own season or in the December tail of the season
  // before it (whose offset-51 Monday is always in December). Two candidates, both verified.
  for (const s of [seasonIndex, seasonIndex - 1]) {
    const offset = Math.floor((target - firstMondayUtc(EPOCH_YEAR + s)) / (7 * MS_PER_DAY))
    if (offset >= 0 && offset < WEEKS_IN_SEASON) return s * WEEKS_IN_SEASON + offset
  }
  return null
}

/** The FIRST career week whose Monday falls in `month` of `year`, or null when that month is outside the
 *  career's calendar.
 *
 *  Walks rather than computes: a season's anchor is a Monday and months are not week-aligned, so
 *  closed-form arithmetic would be off by up to six days twelve times a year. One season is 52
 *  comparisons and this is called at most once per season, so the loop is free.
 *
 *  ⚠ SCANS ONE SEASON, not the whole career, because re-anchoring made that exact: season N covers
 *  `year` = EPOCH_YEAR + N from its first Monday (always Jan 1-7) to its offset-51 Monday (always in
 *  December). No month of `year` can be reached from any other season's weeks. */
export function firstWeekOfMonth(month: number, year: number): number | null {
  const seasonIndex = year - EPOCH_YEAR
  for (let offset = 0; offset < WEEKS_IN_SEASON; offset++) {
    const w = seasonIndex * WEEKS_IN_SEASON + offset
    const d = weekStart(w)
    if (d.year === year && d.month + 1 === month) return w
  }
  return null
}

/** The calendar year the week's Monday falls in.
 *
 *  ⚠ IT CAN NO LONGER COLLIDE, AND THAT IS A PROPERTY, NOT A LICENCE. Since the re-anchor (see the
 *  header) season N opens on the first Monday of EPOCH_YEAR + N, so this is identically
 *  `seasonYear(floor(week / WEEKS_IN_SEASON))` for every week of every career – the season-5 clash
 *  that ate a row out of the Stats table is now unexpressible rather than worked around.
 *
 *  KEEP CALLING `seasonYear` WHERE YOU MEAN A SEASON. The two agreeing is arithmetic, not intent: this
 *  one answers "what does the calendar say", `seasonYear` answers "which season is this", and only the
 *  second is an identity you may key a record on. A future owner ruling that moves a season off its own
 *  January (a southern-hemisphere calendar, a split year) would part them again, and every call site
 *  that had quietly started meaning "season" would break at once. `tests/round13-nav.test.ts` still
 *  refuses `weekYear(` in the trophy cabinet for exactly this reason. */
export function weekYear(week: number): number {
  return weekStart(week).year
}

// --- R11-6: the ONE week label ------------------------------------------------------------
// Owner: «с нового года нумерацию недели надо обновлять, не надо их насквозь считать».
//
// The ENGINE keeps counting weeks from the career's start and never resets – every RNG
// sub-stream key (`seed:injury:87`), every pinned capture, the save format and the whole bench
// are keyed on that ABSOLUTE index. This is the display side of it, and the only place in the
// app where the shape of a week label is decided: before it, every surface hand-rolled its own
// `W${week}` and the player was reading "W87".
//
// FORMAT: `W14 '31` – the in-season week (1..52) plus a two-digit season year.
//   * the week alone cannot tell two seasons apart, and telling them apart is the whole point,
//     so the year has to be in the label itself – the status pill (30px tall) carries no date;
//   * two digits, because where a date IS printed it sits right next to this label and already
//     spells the year out in full ("W14 '31 · Jan 27 – Feb 2, 2031"). A second four-digit year
//     on the same line is length the news feed and the calendar cards cannot spare;
//   * the year is the same one the wrap-up popup and the season-by-season table already name
//     ("Season 2031"), so there is nothing new to learn – '31 IS that season.
//
// The season year is the SEASON INDEX off the epoch year, NOT weekYear(week) – and it was written
// that way BEFORE the re-anchor, when the two genuinely disagreed: a continuous 364-day season slid
// ~1.25 days a year and crossed back over New Year at season 5, so weekYear(208) and weekYear(260)
// were BOTH 2035 and a label built on the date would have printed two consecutive seasons as '35.
// The re-anchor removed that disagreement at the root (weekYear is now the same number), and this
// derivation stays exactly as it is: the label is naming a SEASON, and it should say so in code.
// `WEEKS_IN_SEASON` and `EPOCH_YEAR` now have to be declared above `weekStart`, which reads them.

/** THE ONE definition of a season's DISPLAY year, from its 0-based INDEX and nothing else.
 *
 *  Extracted out of `weekLabel` (fix/world-trio) because the label was not the only surface that
 *  needed it: the season wrap-up milestone, the wrap-up popup and the Stats season-by-season table
 *  each derived their own "Season 2035" from `weekYear(seasonFirstWeek)` – the exact date-derived
 *  year the note above says drifted – and the history table went further and used it as a season's
 *  IDENTITY, which silently dropped season 5 (both it and season 4 hashed to 2035). The identity is
 *  now the index everywhere; this is the only place that turns an index into a year to print, so
 *  every surface that names a season names the same one.
 *
 *  ⚠ THE RE-ANCHOR DID NOT MAKE THIS REDUNDANT. `weekYear` now returns the same number, but this is
 *  the function that MEANS a season – it is total for indices no career reaches and it needs no date
 *  arithmetic to be right. Reading a season's year off a week's date would be correct by coincidence.
 *
 *  Total and strictly increasing by construction – two different seasons can never print alike. */
export function seasonYear(seasonIndex: number): number {
  return EPOCH_YEAR + seasonIndex
}

/** The two facts EVERY week label is built from: the in-season week (1..52) and the SEASON year.
 *
 *  Extracted for the redesigned Home header, which prints the same week with the year spelled out
 *  in full ("W27 2033"). Both labels now read this one derivation instead of each running the
 *  modulo/`seasonYear` pair themselves – the short and the long form cannot name different weeks.
 *  Total: defined for every integer, including the negative weeks entry deadlines can reach. */
function weekParts(week: number): { inSeason: number; year: number } {
  const w = Math.floor(week)
  const offset = ((w % WEEKS_IN_SEASON) + WEEKS_IN_SEASON) % WEEKS_IN_SEASON
  return { inSeason: offset + 1, year: seasonYear(Math.floor(w / WEEKS_IN_SEASON)) }
}

/** "W14 '31" – an absolute career week as the in-season week (1..52) + its season year.
 *  Total: defined for every integer, including the negative weeks entry deadlines can reach. */
export function weekLabel(week: number): string {
  const { inSeason, year } = weekParts(week)
  return `W${inSeason} '${String(((year % 100) + 100) % 100).padStart(2, '0')}`
}

/** "Jun 3 – Jun 9" – the week's Monday..Sunday span, both months always named, NO year.
 *
 *  A second shape of `weekRange`, not a rival to it: the two share `weekStart`/`weekEnd`, so they
 *  can never disagree about which days a week covers. The difference is what the caller has already
 *  said. `weekRange` is used where the week is otherwise unidentified, so it must be self-contained
 *  ("Jan 27 – Feb 2, 2031"). This one is used where the YEAR IS ALREADY ON THE LINE (see
 *  `weekDateLine`), where repeating it reads as a stutter – and it names both months every time
 *  rather than contracting to "Jun 3–9", because the redesigned header is a fixed-width row and a
 *  span that changes shape mid-month made the line jump. */
export function weekSpan(week: number): string {
  const start = weekStart(week)
  const end = weekEnd(week)
  return `${MONTHS[start.month]} ${start.day} – ${MONTHS[end.month]} ${end.day}`
}

/** The seven day-of-month numbers of a career week, Monday first: `[27, 28, 29, 30, 1, 2, 3]`.
 *
 *  For the calendar grid's column heads, which the design dates ("Mon 27") the way any week view
 *  does. It lives HERE rather than in the screen for the reason every other formatter in this file
 *  does: `weekStart` is the one place a week's days are counted from, so the heads over the grid and
 *  the span printed in the header above them cannot disagree about which Monday this is. A month
 *  boundary needs no special case - the numbers come from real dates, one day apart. */
export function weekDayNumbers(week: number): number[] {
  return [0, 1, 2, 3, 4, 5, 6].map((d) => ymdAt(weekStartUtc(week) + d * MS_PER_DAY).day)
}

/** "W27 2033 · Jun 3 – Jun 9" – THE date line of the redesigned Home header (epic/redesign-home).
 *
 *  The owner's own format, and the one place it is spelled: OUR week label (the number the whole
 *  game speaks in) with the year written out IN FULL – the header has room the 30px status pill
 *  does not, and "'33" beside a real date range reads as a typo – then the week's actual calendar
 *  days. Every surface that wants this line calls this function; nothing re-composes it. */
export function weekDateLine(week: number): string {
  const { inSeason, year } = weekParts(week)
  return `W${inSeason} ${year} · ${weekSpan(week)}`
}

/** "Jan 6–12, 2031" – a human date range for one career week (Monday..Sunday).
 *  Widens its own format only as far as needed to stay unambiguous:
 *  same month:      "Jan 6–12, 2031"
 *  crosses months:  "Jan 27 – Feb 2, 2031"
 *  crosses years:   "Dec 29, 2031 – Jan 4, 2032" */
export function weekRange(week: number): string {
  const start = weekStart(week)
  const end = weekEnd(week)
  if (start.year !== end.year) {
    return `${MONTHS[start.month]} ${start.day}, ${start.year} – ${MONTHS[end.month]} ${end.day}, ${end.year}`
  }
  if (start.month !== end.month) {
    return `${MONTHS[start.month]} ${start.day} – ${MONTHS[end.month]} ${end.day}, ${end.year}`
  }
  return `${MONTHS[start.month]} ${start.day}–${end.day}, ${end.year}`
}

/** A SEASON-RELATIVE week range, for the surface-block strip: "W1-10" from zero-based offsets.
 *  Lives here with every other week label, and for the same reason: the moment a screen spells a
 *  week itself, two screens spell it two ways. (These are offsets inside a season, never absolute
 *  career weeks - the strip describes the shape every season has.) */
export function seasonWeekRange(fromOffset: number, toOffset: number): string {
  return `W${fromOffset + 1}-${toOffset + 1}`
}
