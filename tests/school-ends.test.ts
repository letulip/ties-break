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
import { planFromWeek } from '../src/engine/plan'
import { WEEKS_PER_YEAR } from '../src/engine/season/calendar'
import { SCHOOL_YEAR_TURNS_AT } from '../src/engine/kidLife'
import { seasonYear, weekMonth } from '../src/shared/dates'
import { calendarWeekFor, type CalendarWeekFacts } from '../src/composables/weekDays'
import { weekGridFor, bandFor } from '../src/composables/weekGrid'
import { DEFAULT_PROFILE, WEEK_PLAN_PRESETS, type SessionKind } from '../src/shared/protocol'
import type { WorldState } from '../src/engine/world'

const BIRTH_MONTHS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] as const

// =================================================================================================
// 1. WHEN
// =================================================================================================
describe('W4-SCHOOL – school ends at the end of the school year, and never at nineteen', () => {
  // ⚠ THE UPPER BOUND MOVED 18.92 -> 19.00 WHEN THE CALENDAR WAS RE-ANCHORED (wave/flags-grant),
  // and the old bound was passing on a bug rather than on the rule.
  //
  // `SCHOOL_YEAR_TURNS_AT` is a season-week OFFSET whose Monday is meant to be 1 September. Under the
  // old continuous calendar the whole year slid ~1.24 days earlier a season, so by season 5 that
  // Monday had walked into AUGUST – the same drift that drew school in August (round-16 #16) – and a
  // September-born girl's leaving week read as month 8, one twelfth of a year short of nineteen.
  // Measured, both calendars, tools/season-anchor-read.ts:
  //
  //     birth month   leaving week   month before   month after   age before   age after
  //       1-8            242              8              8          18.00-18.58  unchanged
  //       9              294              8              9          18.92        19.00
  //       10-12          294              8              9          18.67-18.83  +1 month
  //
  // 19.00 IS THE RULE, NOT A REGRESSION. The cut-off is September (`SCHOOL_CUTOFF_MONTH`), so a
  // September-born girl is the youngest in her school cohort and leaves a full school year after an
  // August-born one – this file asserts exactly that two `it`s below. Her leaving September IS the
  // September she turns nineteen, and `schoolIsOver` is `week >= schoolEndWeek`, so on that week she
  // is already OUT. Nothing here is "still at school at nineteen" – the owner's report («и школа с
  // уроками в 22 года всё еще со мной») is about school running on for YEARS, which the strict upper
  // bound below still refuses.
  it('every birth month leaves on a 1 September, at a real age between 18.00 and 19.00', () => {
    // The owner's ruling: «Конец школы – в конце учебного года.» So the leaving week is always the
    // September the school year turns over on – never her birthday, which falls mid-term for eleven
    // girls in twelve.
    for (const bm of BIRTH_MONTHS) {
      const w = schoolEndWeek(bm)
      expect(w % WEEKS_PER_YEAR, `month ${bm} does not leave in September`).toBe(SCHOOL_YEAR_TURNS_AT)
      const age = kidAgeExact(w, bm)
      expect(age, `month ${bm} leaves before eighteen`).toBeGreaterThanOrEqual(18)
      expect(age, `month ${bm} is still at school AFTER nineteen`).toBeLessThanOrEqual(19)
    }
  })

  // ⚠ BOTH ENDS OF THE COHORT, PINNED EXACTLY, so the bound above cannot be quietly relaxed again.
  // Widening `< 19` to `<= 19` bought room for one case and one only; these two assertions say which
  // case, and they fail on any drift in either direction rather than tolerating it.
  it('...and the two ends of the school cohort are exact: August 18.00, September 19.00', () => {
    // An August-born girl is the OLDEST in her school cohort (the cut-off is September) and leaves on
    // the September she turns eighteen. A September-born girl is the youngest, leaves a full school
    // year later, and her leaving September IS the September she turns nineteen.
    expect(kidAgeExact(schoolEndWeek(8), 8), 'the oldest in the class').toBe(18)
    expect(kidAgeExact(schoolEndWeek(9), 9), 'the youngest in the class').toBe(19)
    // ...and they are a whole school year apart, which is the cut-off doing its job.
    expect(schoolEndWeek(9) - schoolEndWeek(8)).toBe(WEEKS_PER_YEAR)
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

  // ⚠⚠ RE-AIMED FOR v47, NOT WEAKENED – BOTH ASSERTIONS ARE THE ONES THAT WERE HERE, PLUS THE ARM THAT
  // IS NEW. The freed hours are still worth `ECONOMY.school.loadFactor`; what changed is that she has
  // to actually take them. Until v47 the post-school bonus was a property of the WINDOW, granted
  // whether or not she was on court twice a day, because the plan was one scalar and nobody could
  // decide that she was. The owner ruled the consequence in advance (10.08: «да»): the bonus follows
  // the DOUBLING, not the calendar – see docs/specs/training-dials.md §3 and engine/world/summer.ts.
  // «а тренировки и прогресс должны удвоиться» is unchanged as a claim about what leaving school MAKES
  // POSSIBLE; it is now his to take rather than the calendar's to hand over.
  it('a post-school training week develops at ECONOMY.school.loadFactor and costs its conditionCost', () => {
    const w = past('school-load')
    // she is on court twice a day – six sessions across three days, which is what the mornings buy
    w.plan = planFromWeek([['general', 'general'], ['general', 'general'], ['general', 'general'], [], [], [], []])
    expect(summerBlockWeek(w)).toBe(true)
    expect(summerLoadFactor(w)).toBe(ECONOMY.school.loadFactor)
    expect(summerConditionCost(w)).toBe(ECONOMY.school.conditionCost)
    // ...and the new arm: the same week, the same freed mornings, spent as six single days. The window
    // opened and she did not walk through it, so it buys nothing – which is the whole v47 change, and
    // the reason a MIGRATED career's post-school weeks come back at 1 until he ticks a second session.
    w.plan = planFromWeek([['general'], ['general'], ['general'], ['general'], ['general'], ['general'], []])
    expect(summerBlockWeek(w)).toBe(true)
    expect(summerLoadFactor(w)).toBe(1)
    expect(summerConditionCost(w)).toBe(0)
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

    // ⚠ RE-AIMED AT v47 (spec §3, ruled in advance by the owner). «Two sessions a day» used to be a
    // property of the WINDOW – printed on every school-free week, over a plan that could not double
    // anything. `summerLoadFactor` now follows `doublingShare`, so the sentence follows what he built.
    // Both assertions are kept, on a week whose plan really does double; the flat week gets its own.
    const doubled: SessionKind[][] = [['general', 'serve'], [], ['general', 'rally'], [], ['general'], [], []]
    const cal = calendarWeekFor(
      facts({ week: end + 3, plan: { ...WEEK_PLAN_PRESETS.balanced, week: doubled }, planDayCapacity: 2 }),
      end + 4,
    )
    expect(cal.title).toBe('Training week')
    expect(cal.readout).not.toContain('school')
    expect(cal.readout).toContain('two sessions a day')

    const flat = calendarWeekFor(facts({ week: end + 3, planDayCapacity: 2 }), end + 4)
    expect(flat.readout).not.toContain('two sessions a day')
    expect(flat.readout).toContain('room to double up')
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

// =================================================================================================
// ROUND-21 #6 – THE SHIFT, AS AN ASYMMETRY. «Если день рождения в декабре, то вся школа уже
// закончилась и в сентябре вроде бы её быть не должно, мы это обсуждали. Надо везде по коду
// проверить этот сдвиг.»
// =================================================================================================
//
// ⚠ WHAT THE SWEEP FOUND, because the answer is not "one site was patched". Every place in the game
// that decides a school, exam or term fact already asks HER birth month – the engine through
// `schoolIsOver(week, world.profile.birthMonth)`, the screens through `snap.schoolEndsWeek` (which
// IS `schoolEndWeek(profile.birthMonth)`), the cohort deliberately through `schoolIsOverForBand`.
// Two sites decided a school fact from something else and both are fixed on this branch: the School
// tile's exam line took a literal `false`, and HerWeekTab's capacity line blamed school for a
// one-session week whatever the real reason was.
//
// ⚠⚠ AND THE SEPTEMBER HE IS LOOKING AT IS NOT A DEFECT – IT IS THE CUT-OFF, AND IT IS A DESIGN
// QUESTION RATHER THAN A BUG. Measured here: the ITF band is one birth YEAR (everyone in the 14s was
// born 2017) but the school year turns over on 1 September, so the band splits in two and the halves
// leave school FIFTY-TWO WEEKS APART – January-August at career week 242, September-December at 294.
// A December-born girl therefore sits a whole extra school year, and the September he is reporting
// (career weeks 243-246, September 2035) is a 12th-grade month for her and a post-school month for
// the other half of her own age group. Both are 18.00-19.00 at their leaving week, so neither
// violates «школа уже после 18 вроде не должна быть»; what he is objecting to is the SPLIT.
//
// This block PINS the split rather than removing it, because removing it moves 52 weeks of a
// December career onto `ECONOMY.school.loadFactor` – a balance change, and balance is measured, not
// guessed (CLAUDE.md invariant 4). The day the owner rules, THIS is the test that changes, and the
// number it changes by is written down here.
describe('round-21 #6 – the school clock reads her birth month, and the shift is 52 weeks', () => {
  const SEPTEMBER = 9
  /** Every career week whose Monday falls in September, over eight seasons. */
  const septembers = Array.from({ length: 8 * WEEKS_PER_YEAR }, (_, w) => w).filter(
    (w) => weekMonth(w) === SEPTEMBER,
  )
  const schoolSeptembers = (bm: number) => septembers.filter((w) => !schoolIsOver(w, bm))

  it('every birth month: no September school week from her leaving week on – and one before it', () => {
    // His sentence, read per girl, and it already holds for all twelve months. The second half is
    // what keeps the first from passing vacuously.
    for (const bm of BIRTH_MONTHS) {
      const end = schoolEndWeek(bm)
      const after = schoolSeptembers(bm).filter((w) => w >= end)
      expect(after, `birth month ${bm} still has September school after week ${end}`).toEqual([])
      const before = schoolSeptembers(bm).filter((w) => w < end)
      expect(before.length, `birth month ${bm} never had a September at school`).toBeGreaterThan(0)
    }
  })

  it('⚠ THE SHIFT: September 2035 is school for a December girl and not for a June one', () => {
    // The asymmetry, and it is the whole point – an assertion that answered the same for both birth
    // months would not be testing the shift at all. Career weeks 243-246 are the September that
    // opens a December-born girl's LAST school year and the first September a June-born girl has
    // already left school in.
    const sept2035 = septembers.filter((w) => w >= 243 && w <= 246)
    expect(sept2035, 'the epoch moved – re-measure before touching the rule').toEqual([243, 244, 245, 246])
    for (const w of sept2035) {
      expect(schoolIsOver(w, 6), `June-born, week ${w}`).toBe(true)
      expect(schoolIsOver(w, 12), `December-born, week ${w}`).toBe(false)
    }
    // ...and it reaches the SCREEN, not only the predicate: the drawn calendar keeps the lesson
    // block for one of them and drops it for the other, on the very same week.
    for (const [bm, wantsSchool] of [[6, false], [12, true]] as const) {
      const week = 244
      const cal = calendarWeekFor(
        facts({ week: week - 1, profile: { ...DEFAULT_PROFILE, birthMonth: bm }, schoolEndsWeek: schoolEndWeek(bm) }),
        week,
      )
      expect(cal.schoolOver, `birth month ${bm}`).toBe(!wantsSchool)
      const blocks = weekGridFor(cal, 17, [1, 2, 3, 4, 5, 6, 7]).flatMap((d) => d.blocks)
      expect(blocks.some((b) => b.kind === 'school'), `birth month ${bm} lesson block`).toBe(wantsSchool)
    }
  })

  it('...and the split is exactly one season wide, on both ends of the cut-off', () => {
    // The number the owner's ruling would move, written down so a silent drift is a red test.
    expect(schoolEndWeek(8)).toBe(242)
    expect(schoolEndWeek(9)).toBe(242 + WEEKS_PER_YEAR)
    for (const bm of BIRTH_MONTHS) {
      expect(schoolEndWeek(bm), `birth month ${bm}`).toBe(bm >= 9 ? 294 : 242)
    }
    // The last September each half is at school in, likewise 52 weeks apart.
    const lastSchoolSeptember = (bm: number) => Math.max(...schoolSeptembers(bm))
    expect(lastSchoolSeptember(12) - lastSchoolSeptember(6)).toBe(WEEKS_PER_YEAR)
  })

  it('the School tile decides its exam line from her birth month, not from a literal', () => {
    // The one engine site the sweep found deciding a school fact from a constant. The two agree on
    // every week the game can produce, which is why the fix is free – and the constant is gone, which
    // is why it cannot stop agreeing.
    const [lo, hi] = ECONOMY.availability.examWeeks[0]
    for (const bm of BIRTH_MONTHS) {
      for (let season = 0; season < 8; season++) {
        for (let offset = lo; offset <= hi; offset++) {
          const week = season * WEEKS_PER_YEAR + offset
          const tile = schoolTile({
            seed: 'exam-line',
            week,
            ageYears: Math.floor(kidAgeExact(week, bm)),
            seasonYear: seasonYear(Math.floor(week / WEEKS_PER_YEAR)),
            playStyle: 'all-court',
            birthMonth: bm,
            injured: false,
            weeksAway: 0,
            lossStreak: 0,
            weeksSinceTitle: null,
          })
          // Past her leaving week the tile is "School's done" and no exam line may survive on it.
          if (schoolIsOver(week, bm)) {
            expect(tile.lead, `bm ${bm} week ${week}`).toBe("School's done")
            expect(tile.note, `bm ${bm} week ${week}`).not.toBe('Exams this week')
          } else {
            expect(tile.note, `bm ${bm} week ${week}`).toBe('Exams this week')
          }
        }
      }
    }
  })
})
