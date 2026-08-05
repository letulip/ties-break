// W4-SCHOOL – school ends, and every surface agrees about when.
//
// THE REPORT THIS FILE IS THE NET FOR, from the owner's own playtest, twice: «Школа должна когда-то
// закончиться, ей уже 21» and, a day later, «и школа с уроками в 22 года всё еще со мной». Nothing
// in the game knew school ends: `isExamWeek` was a pure function of the season week, the calendar
// drew an eight-o'clock lesson block at every age for ever, and the one surface that HAD modelled a
// real school year (`kidLife.gradeOf`) was read by nothing else.
//
// The measurements behind the numbers pinned here are in docs/specs/school-ends-2026-08.md; this
// file is the behaviour, and it is written so that each `it` fails for one reason.
import { describe, it, expect } from 'vitest'
import {
  createWorld,
  toSnapshot,
  bookVacation,
  schoolEndWeek,
  schoolIsOver,
  schoolIsOverForBand,
  isExamWeek,
  isBlackoutWeek,
} from '../src/engine/world'
import { assertPlannable } from '../src/engine/world/planner'
import { migrateSave } from '../src/engine/migrations'
import { summerLoadFactor, summerConditionCost, summerBlockWeek } from '../src/engine/world/summer'
import { markSchoolEnd } from '../src/engine/world/milestones'
import { schoolTile } from '../src/engine/kidLife'
import { kidAgeExact } from '../src/engine/world/age'
import { ECONOMY } from '../src/engine/economy'
import { WEEKS_PER_YEAR } from '../src/engine/season/calendar'
import { SCHOOL_YEAR_TURNS_AT } from '../src/engine/kidLife'
import { seasonYear } from '../src/shared/dates'
import { calendarWeekFor, type CalendarWeekFacts } from '../src/composables/weekDays'
import { weekGridFor, bandFor } from '../src/composables/weekGrid'
import { DEFAULT_PROFILE, WEEK_PLAN_PRESETS } from '../src/shared/protocol'
import type { WorldState } from '../src/engine/world'

const BIRTH_MONTHS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] as const

// =================================================================================================
// 1. WHEN
// =================================================================================================
describe('W4-SCHOOL – school ends at the end of the school year, and never at nineteen', () => {
  it('every birth month leaves on a 1 September, at a real age between 18.00 and 18.92', () => {
    // The owner's ruling: «Конец школы – в конце учебного года.» So the leaving week is always the
    // September the school year turns over on – never her birthday, which falls mid-term for eleven
    // girls in twelve.
    for (const bm of BIRTH_MONTHS) {
      const w = schoolEndWeek(bm)
      expect(w % WEEKS_PER_YEAR, `month ${bm} does not leave in September`).toBe(SCHOOL_YEAR_TURNS_AT)
      const age = kidAgeExact(w, bm)
      expect(age, `month ${bm} leaves before eighteen`).toBeGreaterThanOrEqual(18)
      expect(age, `month ${bm} is still at school at nineteen`).toBeLessThan(19)
    }
  })

  it('...and it is the same arithmetic the School tile has always used', () => {
    // ⚠ THE POINT OF THE WHOLE WAVE. `gradeOf` returned null past the last grade long before this
    // branch; nothing else read it. If these two ever disagree, some surface is back to inventing a
    // second school calendar.
    for (const bm of BIRTH_MONTHS) {
      const end = schoolEndWeek(bm)
      for (const week of [end - 1, end]) {
        const seasonIndex = Math.floor(week / WEEKS_PER_YEAR)
        const tile = schoolTile({
          seed: 's',
          week,
          ageYears: 14 + seasonIndex,
          seasonYear: seasonYear(seasonIndex),
          playStyle: 'all-court',
          birthMonth: bm,
          injured: false,
          weeksAway: 0,
          lossStreak: 0,
          weeksSinceTitle: null,
        })
        const done = tile.lead === "School's done"
        expect(done, `month ${bm} week ${week}: tile and predicate disagree`).toBe(schoolIsOver(week, bm))
      }
    }
  })

  it('is monotone – she never goes back', () => {
    for (const bm of [1, 6, 9, 12]) {
      let seen = false
      for (let w = 0; w < WEEKS_PER_YEAR * 25; w++) {
        const over = schoolIsOver(w, bm)
        if (over) seen = true
        expect(over || !seen, `month ${bm} went back to school at week ${w}`).toBe(true)
      }
    }
  })

  it('⚠ THE REPORT ITSELF: past school the exam fortnight never comes again, at any offset', () => {
    for (const bm of BIRTH_MONTHS) {
      const end = schoolEndWeek(bm)
      for (const [lo, hi] of ECONOMY.availability.examWeeks) {
        for (let offset = lo; offset <= hi; offset++) {
          // the last exam block she ever sits...
          const before = Math.floor((end - 1) / WEEKS_PER_YEAR) * WEEKS_PER_YEAR + offset
          if (before < end) expect(isExamWeek(before, schoolIsOver(before, bm)), `m${bm} w${before}`).toBe(true)
          // ...and every one after it, out to twenty-two and beyond.
          for (const season of [6, 8, 12, 20]) {
            const w = season * WEEKS_PER_YEAR + offset
            expect(isExamWeek(w, schoolIsOver(w, bm)), `m${bm} w${w}`).toBe(false)
            // ...and it stops being a tournament blackout with it, off-season aside.
            expect(isBlackoutWeek(w, schoolIsOver(w, bm)), `m${bm} w${w} still blacked out`).toBe(false)
          }
        }
      }
    }
  })

  it('the rivals leave too, on the band clock – or the tour would pay THEM two weeks a year she loses', () => {
    // They carry no birth month. `schoolIsOverForBand` is the January-August half of the band, which
    // is one September and not one girl.
    expect(schoolIsOverForBand(schoolEndWeek(6) - 1)).toBe(false)
    expect(schoolIsOverForBand(schoolEndWeek(6))).toBe(true)
    for (const bm of [1, 2, 3, 4, 5, 6, 7, 8]) expect(schoolEndWeek(bm)).toBe(schoolEndWeek(6))
  })
})

// =================================================================================================
// 2. THE MOMENT
// =================================================================================================
function tickTo(world: WorldState, week: number): void {
  // The leaving beat is pure state and needs no tick machinery around it; drive it directly so this
  // test cannot fail for a reason that is about tournaments.
  while (world.week < week) {
    world.week++
    markSchoolEnd(world)
  }
}

describe('W4-SCHOOL – the player is told, once', () => {
  it('the feed keeps the line and the album keeps the row, on exactly the leaving week', () => {
    const w = createWorld('school-beat')
    const end = schoolEndWeek(w.profile.birthMonth)
    tickTo(w, end - 1)
    expect(w.milestones.some((m) => m.type === 'school')).toBe(false)
    tickTo(w, end)
    const row = w.milestones.find((m) => m.type === 'school')
    expect(row, 'the album never learned she left').toBeDefined()
    expect(row?.week).toBe(end)
    const line = w.events.filter((e) => e.type === 'milestone' && e.milestoneKey === 'school')
    expect(line, 'the feed never said so').toHaveLength(1)
    // ⚠ NEVER PRUNED. The ledger caps at 400 rows oldest-first and a career runs to 1,300 weeks.
    expect(line[0].keep).toBe(true)
  })

  it('...and it cannot double, however many times the week is replayed', () => {
    const w = createWorld('school-beat-2')
    const end = schoolEndWeek(w.profile.birthMonth)
    tickTo(w, end)
    for (let i = 0; i < 5; i++) markSchoolEnd(w)
    expect(w.milestones.filter((m) => m.type === 'school')).toHaveLength(1)
    expect(w.events.filter((e) => e.milestoneKey === 'school')).toHaveLength(1)
  })
})

// =================================================================================================
// 3. THE LOAD
// =================================================================================================
describe('W4-SCHOOL – the freed hours, and the five weeks that are not hers to train through', () => {
  const past = (seed: string): WorldState => {
    const w = createWorld(seed)
    w.week = schoolEndWeek(w.profile.birthMonth) + 4 // an ordinary autumn week, well clear of summer
    return w
  }

  it('a post-school training week develops at ECONOMY.school.loadFactor and costs its conditionCost', () => {
    const w = past('school-load')
    expect(summerBlockWeek(w)).toBe(true)
    expect(summerLoadFactor(w)).toBe(ECONOMY.school.loadFactor)
    expect(summerConditionCost(w)).toBe(ECONOMY.school.conditionCost)
  })

  it('...and a week at school is byte-identical to the one it was', () => {
    const w = createWorld('school-load-2')
    w.week = 40 // she is fourteen, it is October, and nothing about her week has changed
    expect(summerLoadFactor(w)).toBe(1)
    expect(summerConditionCost(w)).toBe(0)
  })

  it('the refusals still refuse – a layoff and a booked family week are not two sessions a day', () => {
    const injured = past('school-load-3')
    injured.injury = {
      kind: 'ankle soreness',
      severity: 'minor',
      weeksRemaining: 2,
      totalWeeks: 3,
      sinceWeek: injured.week,
    }
    expect(summerLoadFactor(injured)).toBe(1)

    const away = past('school-load-4')
    bookVacation(away, away.week + 2, 'staycation')
    const holiday = { ...away, week: away.week + 2 } as WorldState
    expect(summerLoadFactor(holiday)).toBe(1)
  })

  it('⚠ THE RULING, AS AN ASSERTION: leaving school costs her body nothing', () => {
    // «Мы ни за что не наказываем.» The bench measured `conditionCost: 3` buying +0.00 skill and
    // costing +3.1 weeks in the treatment room per career (school-ends-2026-08.md §4). A non-zero
    // value here is the game charging her for growing up, and it must be a deliberate owner ruling
    // with a bench behind it rather than a value somebody copied off the summer block.
    expect(ECONOMY.school.conditionCost).toBe(0)
  })

  it('...and the load factor matches the summer block – one school-free week, one price', () => {
    expect(ECONOMY.school.loadFactor).toBe(ECONOMY.summerBlock.loadFactor)
  })
})

// =================================================================================================
// 4. THE SURFACES
// =================================================================================================
function facts(over: Partial<CalendarWeekFacts> = {}): CalendarWeekFacts {
  return {
    week: 5,
    plan: WEEK_PLAN_PRESETS.balanced,
    profile: DEFAULT_PROFILE,
    injury: null,
    knock: null,
    vacations: [],
    practices: [],
    upcoming: [],
    arrival: null,
    pending: undefined,
    schoolEndsWeek: schoolEndWeek(DEFAULT_PROFILE.birthMonth),
    ...over,
  }
}

describe('W4-SCHOOL – the calendar stops drawing lessons', () => {
  const END = schoolEndWeek(DEFAULT_PROFILE.birthMonth)

  it('⚠ NOT ONE school or study block survives, on any day of any week kind, past the leaving week', () => {
    // The owner's literal report: «и школа с уроками в 22 года всё еще со мной». Swept over the
    // whole-week kinds too, because FAMILY_ARC and all six VACATION_ARCS carry hand-written Study
    // hours that no band table could remove.
    const vacations = [{ week: END + 10, packageId: 'staycation', paidCents: 0 }]
    for (const week of [END, END + 5, END + 10, END + 26, END + 52 * 4]) {
      const cal = calendarWeekFor(facts({ week: week - 1, vacations }), week)
      expect(cal.schoolOver, `week ${week}`).toBe(true)
      const grid = weekGridFor(cal, 22, [1, 2, 3, 4, 5, 6, 7])
      for (const day of grid) {
        for (const b of day.blocks) {
          expect(['school', 'schoolLong', 'study'], `week ${week} day ${day.index}: ${b.label}`).not.toContain(b.kind)
        }
      }
    }
  })

  it('...and a term-time week BEFORE it still has them – a boundary, not a deletion', () => {
    // ⚠ NOT `END - 1`, and the reason is worth pinning: the leaving September is preceded by the
    // summer holidays (SUMMER_WEEKS 25-33), which already strip school. A test that used the week
    // before would have passed for the wrong reason and gone silent if the boundary broke. This is
    // an ordinary January of her last school year.
    const term = END - 30
    const cal = calendarWeekFor(facts({ week: term - 1 }), term)
    expect(cal.schoolOver).toBe(false)
    expect(cal.summer, 'the fixture drifted into the holidays again').toBe(false)
    const grid = weekGridFor(cal, 18, [1, 2, 3, 4, 5, 6, 7])
    const blocks = grid.flatMap((d) => d.blocks)
    expect(blocks.some((b) => b.kind === 'school'), 'she left a week early').toBe(true)
  })

  it('the band is the WEEK\'s answer and never an age – a September girl leaves a year after an August one', () => {
    expect(bandFor(22)).toBe('school')
    expect(bandFor(18, true)).toBe('full-time')
    expect(schoolEndWeek(9)).toBeGreaterThan(schoolEndWeek(8))
  })

  it('the exam fortnight is plannable again, and the read-out stops naming school', () => {
    const [lo] = ECONOMY.availability.examWeeks[0]
    const w = createWorld('school-plan')
    const end = schoolEndWeek(w.profile.birthMonth)
    const examAfter = Math.ceil((end - lo) / WEEKS_PER_YEAR) * WEEKS_PER_YEAR + lo
    w.week = examAfter - 6
    expect(() => assertPlannable(w, examAfter, 'practice')).not.toThrow()

    const cal = calendarWeekFor(facts({ week: end + 3 }), end + 4)
    expect(cal.title).toBe('Training week')
    expect(cal.readout).not.toContain('school')
    expect(cal.readout).toContain('two sessions a day')
  })

  it('the snapshot carries the WEEK and not a boolean, so a look-ahead can ask about a future week', () => {
    const w = createWorld('school-snap')
    const snap = toSnapshot(w)
    expect(snap.schoolEndsWeek).toBe(schoolEndWeek(w.profile.birthMonth))
    expect(snap.week).toBeLessThan(snap.schoolEndsWeek)
  })
})

// =================================================================================================
// 5. THE MIGRATION – his own save is the case
// =================================================================================================
describe('W4-SCHOOL – a career already past eighteen leaves school on load', () => {
  const v42 = (week: number, birthMonth = 6): Record<string, unknown> =>
    JSON.parse(
      JSON.stringify({
        ...createWorld('school-mig'),
        schemaVersion: 42,
        week,
        profile: { ...DEFAULT_PROFILE, birthMonth },
        milestones: [],
      }),
    )

  it('⚠ THE FACT NEEDS NO MIGRATION AT ALL – it is derived from two numbers every save has carried', () => {
    // This is the half that fixes the owner's report the instant the build reads his file.
    const twentyTwo = 8 * WEEKS_PER_YEAR + 10
    expect(schoolIsOver(twentyTwo, 6)).toBe(true)
    expect(isExamWeek(8 * WEEKS_PER_YEAR + 23, schoolIsOver(8 * WEEKS_PER_YEAR + 23, 6))).toBe(false)
  })

  it('...and the MOMENT is what v43 back-fills, at the week it happened', () => {
    const migrated = migrateSave(v42(schoolEndWeek(6) + 100))
    const row = migrated.milestones.find((m) => m.type === 'school')
    expect(row, 'his twenty-two-year-old never left school in the album').toBeDefined()
    expect(row?.week, 'the back-filled week is not the week it happened').toBe(schoolEndWeek(6))
  })

  it('a career that has NOT reached it gets nothing – the migration invents no history', () => {
    const migrated = migrateSave(v42(schoolEndWeek(6) - 10))
    expect(migrated.milestones.some((m) => m.type === 'school')).toBe(false)
  })

  it('...and it is idempotent: a save that already holds the row is left exactly as it is', () => {
    const once = migrateSave(v42(schoolEndWeek(6) + 100))
    const twice = migrateSave({ ...JSON.parse(JSON.stringify(once)), schemaVersion: 42 })
    expect(twice.milestones.filter((m) => m.type === 'school')).toHaveLength(1)
  })
})
