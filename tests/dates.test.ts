import { describe, it, expect } from 'vitest'
import {
  seasonYear,
  weekDayNumbers,
  weekMonth,
  weekOfDate,
  weekRange,
  weekYear,
  WEEKS_IN_SEASON,
} from '../src/shared/dates'

describe('weekRange', () => {
  it('week 0 is the career epoch: Monday Jan 6 – Sunday Jan 12, 2031', () => {
    expect(weekRange(0)).toBe('Jan 6–12, 2031')
  })

  it('formats a plain same-month week with a bare day–day range', () => {
    expect(weekRange(1)).toBe('Jan 13–19, 2031')
  })

  it('widens to "Mon D – Mon D, YYYY" when the week crosses a month boundary', () => {
    // week 3: Mon Jan 27 – Sun Feb 2, 2031
    expect(weekRange(3)).toBe('Jan 27 – Feb 2, 2031')
  })

  it('widens further to carry both years when the week crosses a year boundary', () => {
    // week 51: Mon Dec 29, 2031 – Sun Jan 4, 2032
    expect(weekRange(51)).toBe('Dec 29, 2031 – Jan 4, 2032')
  })

  it('never uses an em dash, only the en dash "–"', () => {
    for (const w of [0, 3, 51, 100]) expect(weekRange(w)).not.toMatch(/—/)
  })

  it('is a pure function of the week index (deterministic, no Date mutation leakage)', () => {
    expect(weekRange(20)).toBe(weekRange(20))
  })
})

// The calendar grid's column heads ("Mon 27"). Same `weekStart` every range in this file counts
// from, so the heads over the grid and the span printed above them are the same seven days.
describe('weekDayNumbers', () => {
  it('week 0 is the epoch week, Monday first', () => {
    expect(weekDayNumbers(0)).toEqual([6, 7, 8, 9, 10, 11, 12])
  })

  it('a month boundary needs no special case – the numbers are real dates', () => {
    // week 3: Mon Jan 27 – Sun Feb 2, 2031
    expect(weekDayNumbers(3)).toEqual([27, 28, 29, 30, 31, 1, 2])
  })

  it('always seven, and always the days `weekRange` names as the ends of the same week', () => {
    for (const w of [0, 3, 51, 100, 260]) {
      const days = weekDayNumbers(w)
      expect(days.length, `week ${w}`).toBe(7)
      for (const d of days) expect(d, `week ${w}`).toBeGreaterThan(0)
      // the first and last are the Monday and the Sunday the human range prints
      expect(weekRange(w), `week ${w}`).toContain(String(days[0]))
      expect(weekRange(w), `week ${w}`).toContain(String(days[6]))
    }
  })
})

describe('weekYear', () => {
  it('week 0 falls in 2031', () => {
    expect(weekYear(0)).toBe(2031)
  })

  it('a week wholly inside a year returns that year', () => {
    expect(weekYear(25)).toBe(2031)
  })

  it('a year-crossing week is keyed by its Monday (start) year', () => {
    // week 51 starts Dec 29, 2031 (even though it ends in 2032)
    expect(weekYear(51)).toBe(2031)
  })

  it('the next season year begins at week 52', () => {
    expect(weekYear(52)).toBe(2032)
  })
})

// =================================================================================================
// THE SEASON ANCHOR – the property the whole file exists to have (owner approved 11.08).
// =================================================================================================
//
// The calendar used to be one continuous 364-day cycle off Monday 6 Jan 2031 against a Gregorian
// 365.2425, so every date the game printed slid ~1.24 days earlier a season, for ever. Three
// symptoms were paid for separately – a whole season dropped out of the Stats table, school drawn in
// August, the surface blocks quietly outgrowing the months their comments name. Each season now
// re-anchors to the first Monday of its OWN year, which removes the cause instead of the symptoms.
//
// ⚠ THESE ARE THE ROOT-CAUSE PINS. `world-trio`, `week-numbering` and `trophy-cabinet` each keep a
// re-aimed pin on the collision the drift used to produce; these assert the property directly, on
// the calendar itself, so a future change that re-introduces a continuous epoch fails HERE first and
// with one obvious reason rather than in three files about seasons, labels and trophies.
describe('the season anchor – no drift, ever', () => {
  it('every season opens on the first Monday of its own year – Jan 1..Jan 7, for 40 seasons', () => {
    for (let s = 0; s < 40; s++) {
      const days = weekDayNumbers(s * WEEKS_IN_SEASON)
      expect(weekYear(s * WEEKS_IN_SEASON), `season ${s}`).toBe(seasonYear(s))
      // the opening Monday is in January, in the first seven days – it can never walk out of them
      expect(weekRange(s * WEEKS_IN_SEASON), `season ${s}`).toMatch(/^Jan /)
      expect(days[0], `season ${s} opens on Jan ${days[0]}`).toBeLessThanOrEqual(7)
    }
  })

  it('the date-derived year and the season identity are the SAME number, week by week', () => {
    // This is what makes the season-5 collision unexpressible rather than worked around.
    for (let w = 0; w < 40 * WEEKS_IN_SEASON; w++) {
      expect(weekYear(w), `week ${w}`).toBe(seasonYear(Math.floor(w / WEEKS_IN_SEASON)))
    }
  })

  it('week 0 is still Monday 6 Jan 2031 – the epoch did not move, only what follows it', () => {
    expect(weekRange(0)).toBe('Jan 6–12, 2031')
    expect(weekYear(0)).toBe(2031)
  })

  it('negative weeks stay total and stay one week apart from week 0', () => {
    // Entry deadlines and `weekOfDate` both reach behind the career's start; week -1 is season -1's
    // offset 51, and it must still be the Monday immediately before week 0.
    expect(weekRange(-1)).toBe('Dec 30, 2030 – Jan 5, 2031')
    expect(weekYear(-1)).toBe(2030)
    // A girl born 3 Jan 2031 had her birthday before the career opened – the case dates.ts documents.
    expect(weekOfDate(1, 3, 2031)).toBe(-1)
  })

  it('⚠ the slack lands at New Year, and a skipped week is honestly reported as absent', () => {
    // A 53-week calendar year cannot fit in 52 career weeks, so one real week belongs to no career
    // week. `weekOfDate` returns null there rather than guessing – `birthdayTurning` already treats
    // "no birthday week this year" as a real answer (a January girl at week 0 has the same shape).
    // Measured on the owner's seven saves: no live career loses a birthday to this. Season 4 -> 5 is
    // the first such boundary, and it is the exact pair the old calendar collided on.
    expect(weekRange(4 * WEEKS_IN_SEASON + 51)).toBe('Dec 24–30, 2035')
    expect(weekRange(5 * WEEKS_IN_SEASON)).toBe('Jan 7–13, 2036')
    // 31 Dec 2035 – 6 Jan 2036 is the week nobody plays.
    expect(weekOfDate(12, 31, 2035)).toBe(null)
    expect(weekOfDate(1, 5, 2036)).toBe(null)
    // ...and the days on either side of it still resolve, to the weeks that really hold them.
    expect(weekOfDate(12, 30, 2035)).toBe(4 * WEEKS_IN_SEASON + 51)
    expect(weekOfDate(1, 7, 2036)).toBe(5 * WEEKS_IN_SEASON)
  })

  it('weekOfDate is the inverse of weekStart wherever a week exists at all', () => {
    // The Monday of every week of 40 seasons, named by its own month/day/year, must resolve back to
    // the week that prints it. `weekMonth`/`weekYear`/`weekDayNumbers[0]` ARE that Monday.
    for (let w = 0; w < 40 * WEEKS_IN_SEASON; w++) {
      expect(weekOfDate(weekMonth(w), weekDayNumbers(w)[0], weekYear(w)), `week ${w}`).toBe(w)
    }
  })
})
