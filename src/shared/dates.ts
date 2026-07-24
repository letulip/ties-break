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

/** The calendar year the week's Monday falls in – used to group weeks into "season years"
 *  (e.g. for the year-end wrap-up milestone label, "Season 2031 wrap-up"). */
export function weekYear(week: number): number {
  return weekStart(week).year
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
