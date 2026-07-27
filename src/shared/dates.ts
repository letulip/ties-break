// Round 5 item 1 – real dates. Pure: week N -> a calendar date range, no engine/DOM deps.
// The career's week 0 always starts Monday, Jan 6, 2031 (a fixed fictional epoch), so every
// week is a deterministic function of its index: week N spans
// [epoch + 7*N days, epoch + 7*N + 6 days] (Monday..Sunday).
//
// Dash style (owner instruction): en dash "–" only, never an em dash, in all display text.

const EPOCH_UTC = Date.UTC(2031, 0, 6) // Monday, Jan 6, 2031
const MS_PER_DAY = 24 * 60 * 60 * 1000

const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
] as const

interface Ymd {
  month: number // 0-11
  day: number
  year: number
}

function dateAtDay(dayOffset: number): Ymd {
  const d = new Date(EPOCH_UTC + dayOffset * MS_PER_DAY)
  return { month: d.getUTCMonth(), day: d.getUTCDate(), year: d.getUTCFullYear() }
}

/** First day (Monday) of the given career week, as {month, day, year}. */
function weekStart(week: number): Ymd {
  return dateAtDay(week * 7)
}

/** Last day (Sunday) of the given career week, as {month, day, year}. */
function weekEnd(week: number): Ymd {
  return dateAtDay(week * 7 + 6)
}

/** The calendar year the week's Monday falls in. A REAL-CALENDAR fact about a date, and nothing
 *  more – it is NOT a season identity and must never be used as one (see `seasonYear` below and
 *  the note above WEEKS_IN_SEASON: it collides at season 5). Kept because the date range genuinely
 *  needs the calendar year, and because the tests that pin the collision have to be able to name it. */
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
// The season year is the SEASON INDEX off the epoch year, NOT weekYear(week). A season is
// exactly 52 weeks = 364 days, so a season's opening Monday drifts ~1.25 days earlier each year and
// crosses back over New Year at season 5: weekYear(208) and weekYear(260) are BOTH 2035. A label
// built on that would print two consecutive seasons as '35 – the one thing it exists to prevent.
export const WEEKS_IN_SEASON = 52 // === WEEKS_PER_YEAR in engine/season/calendar.ts (pinned in tests)
const EPOCH_YEAR = weekYear(0) // 2031

/** THE ONE definition of a season's DISPLAY year, from its 0-based INDEX and nothing else.
 *
 *  Extracted out of `weekLabel` (fix/world-trio) because the label was not the only surface that
 *  needed it: the season wrap-up milestone, the wrap-up popup and the Stats season-by-season table
 *  each derived their own "Season 2035" from `weekYear(seasonFirstWeek)` – the exact date-derived
 *  year the note above says drifts – and the history table went further and used it as a season's
 *  IDENTITY, which silently dropped season 5 (both it and season 4 hashed to 2035). The identity is
 *  now the index everywhere; this is the only place that turns an index into a year to print, so
 *  every surface that names a season names the same one.
 *
 *  Total and strictly increasing by construction – two different seasons can never print alike. */
export function seasonYear(seasonIndex: number): number {
  return EPOCH_YEAR + seasonIndex
}

/** "W14 '31" – an absolute career week as the in-season week (1..52) + its season year.
 *  Total: defined for every integer, including the negative weeks entry deadlines can reach. */
export function weekLabel(week: number): string {
  const w = Math.floor(week)
  const offset = ((w % WEEKS_IN_SEASON) + WEEKS_IN_SEASON) % WEEKS_IN_SEASON
  const year = seasonYear(Math.floor(w / WEEKS_IN_SEASON))
  return `W${offset + 1} '${String(((year % 100) + 100) % 100).padStart(2, '0')}`
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
