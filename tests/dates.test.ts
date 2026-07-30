import { describe, it, expect } from 'vitest'
import { weekDayNumbers, weekRange, weekYear } from '../src/shared/dates'

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
