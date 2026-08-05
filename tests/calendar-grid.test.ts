// =================================================================================================
// SCREEN H, SECOND PASS – THE TIME x DAY GRID (docs/specs/calendar-week-grid.md §3)
// =================================================================================================
//
// `feat/calendar` shipped the week as seven day columns. The design has always held a richer drawing
// of the same screen - a time x day grid with coloured blocks sitting at hours - and this suite is
// what keeps that drawing honest, because a grid of hours is the easiest surface in this whole app
// on which to invent a fact.
//
// THREE RULINGS ARE PINNED HERE, and all three are the owner's (30.07):
//
//   (a) THE ENGINE KEEPS NO TIME OF DAY. «Времени суток у движка нет и не будет – полностью
//       поддерживаю, это просто визуализация недели.» So every hour below is a display convention,
//       and the one thing a convention may not do is contradict a fact the app already prints. The
//       sentence under the grid says "5 sessions - 4 on court, 1 in the gym"; the grid draws exactly
//       one tennis block on a day the plan bought one session, and that is checked as arithmetic
//       against `weekDays.ts` rather than trusted to the table's author.
//
//   (b) ⚠ THE BOUNDARY – AND THE OWNER OVERRULED IT ON 31.07. It used to read: «...для тех, где нет
//       отпусков, чемпионатов и поездок», a week away / off / in exams / laid up keeps the day strip
//       it has. Asked directly whether the exam fortnight should draw hours he answered «очень даже
//       должна, никакой разницы. Просто содержание сетки будет другим», and he is right - the grid
//       already ran on display conventions for the ordinary week, so refusing them for the other
//       four was a line drawn where the argument happened to stop rather than a matter of honesty.
//       What this file pins now is the replacement rule: EVERY week draws, and each draws the week
//       it actually is - the trip has no drills in it, the family week has no tennis at all, the
//       exam week keeps exactly the sessions the plan bought.
//
//   (c) THE AGE BAND IS A PARAMETER FROM THE FIRST VERSION. «...надо заложить в архитектуру.» The
//       completeness test is the mechanical half of that instruction: a band that is half added -
//       a row in the table covering three of the four ordinary day kinds - fails here instead of
//       silently drawing an empty column in a shipped build.
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import {
  GRID_END_HOUR,
  GRID_HOURS,
  GRID_START_HOUR,
  ORDINARY_KINDS,
  bandFor,
  blockOffset,
  dayBlocksFor,
  hourLabel,
  hourTop,
  isOrdinaryKind,
  populatedBands,
  weekGridFor,
  type AgeBand,
  type BlockKind,
  type DayBlock,
  type OrdinaryKind,
} from '../src/composables/weekGrid'
import { EXAM_NOTES, FRIDGE_NOTES, TRIP_NOTES, fridgeNoteFor } from '../src/composables/fridgeNote'
import {
  SUMMER_WEEKS,
  calendarWeekFor,
  gymDayIndex,
  isSummerWeek,
  sessionDays,
  sessionsForPlan,
  type CalendarWeek,
  type CalendarWeekFacts,
  type DayKind,
} from '../src/composables/weekDays'
import { weekDayNumbers } from '../src/shared/dates'
import { DEFAULT_PROFILE, WEEK_PLAN_PRESETS } from '../src/shared/protocol'
import { ECONOMY } from '../src/engine/economy'
import { OFF_SEASON_WEEKS, WEEKS_PER_YEAR } from '../src/engine/season/calendar'

const read = (rel: string) => readFileSync(new URL(rel, import.meta.url), 'utf8')
/** Comments are not code. The house helper (tests/calendar-screen.test.ts, tests/knock.test.ts):
 *  this codebase documents at length, INCLUDING documenting what it deliberately did not do, so a
 *  `not.toContain` over raw source fails on a note that merely names the thing it forbids. */
const codeOf = (src: string) =>
  src
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/^\s*\/\/.*$/gm, '')
const screen = read('../src/components/screens/CalendarScreen.vue')
const module_ = read('../src/composables/weekGrid.ts')
const sheet = read('../src/style.css')

/** A plain snapshot-shaped fact bag – the `facts()` idiom tests/calendar-screen.test.ts keeps. */
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
    ...over,
  }
}
/** The grid the screen would draw for a week, at the age the game opens on. */
function gridFor(over: Partial<CalendarWeekFacts> = {}, week = 6, age = 14) {
  return weekGridFor(calendarWeekFor(facts(over), week), age, weekDayNumbers(week))
}

/** What the plan made of a day, spelled out HERE rather than imported from the composable that
 *  applies it. Two independent spellings is the point: if the grid ever stops putting the exam
 *  week's sessions on the days the plan bought, this diverges instead of agreeing with the bug. */
function planRoleOf(week: CalendarWeek, index: number): OrdinaryKind {
  const session = new Set(sessionDays(week.sessions))
  return !session.has(index) ? 'rest' : index === week.gymIndex ? 'gym' : 'court'
}

/** Every day kind there is – the four the plan mixes, and the four a whole week is made of. Spelled
 *  out rather than imported so that a ninth `DayKind` is a decision somebody has to make here too. */
const ALL_KINDS: DayKind[] = ['court', 'gym', 'rest', 'match', 'away', 'off', 'school', 'rehab']
const DAY_INDEXES = [0, 1, 2, 3, 4, 5, 6] as const

/** ⚠ SWEPT OVER EVERY DAY OF EVERY WEEK, not just over the four ordinary shapes. The whole-week
 *  kinds are shaped by the day INDEX and by the role the plan would have given the day, so a block
 *  that runs off the bottom of the canvas or a label that breaks mid-word can now hide on a
 *  Wednesday of a trip week - which is exactly where nobody looks. */
// ⚠ EVERY CONTEXT AN `off` WEEK CAN CARRY, not just the default one (31.07). `off` serves the
// off-season block, the six named family packages and the generic family week, and the arc it draws
// depends ENTIRELY on the context - so a sweep that passes no context checked exactly one of eight
// drawings and would have let a block run off the bottom of the canvas on the other seven.
// Built off the catalogue, so a seventh package is swept the day it is added.
const OFF_CONTEXTS: { offSeason?: boolean; vacationId?: string; summer?: boolean }[] = [
  {},
  { offSeason: true },
  ...ECONOMY.vacation.packages.map((p) => ({ vacationId: p.id })),
]

// ⚠ ...AND EVERY ONE OF THEM IN AND OUT OF THE SUMMER HOLIDAYS (R15-8). Summer reshapes the
// ordinary day kinds - school out, the light study in - so its labels and its overlap behaviour
// have to be swept exactly like every other shape's, and the doubled matrix is also what pins the
// owner's boundary: the family and vacation arcs must draw the SAME week whichever half of the
// year it is booked in (their own suite asserts that identity below).
const SWEEP_CONTEXTS = OFF_CONTEXTS.flatMap((ctx) => [ctx, { ...ctx, summer: true }])

const ALL_BLOCKS = (): DayBlock[] =>
  populatedBands().flatMap((band) =>
    ALL_KINDS.flatMap((kind) =>
      DAY_INDEXES.flatMap((index) =>
        (ORDINARY_KINDS as readonly OrdinaryKind[]).flatMap((role) =>
          SWEEP_CONTEXTS.flatMap((ctx) => dayBlocksFor(kind, band, { index, role, ...ctx })),
        ),
      ),
    ),
  )

// =================================================================================================
// (c) THE AGE BAND – the completeness the owner asked for
// =================================================================================================
describe('the layout table is complete for every band it carries', () => {
  it('⚠ every populated band covers every day kind – all EIGHT of them now', () => {
    // THE HALF-ADDED BAND is the failure this exists for: a later hand adds `senior-school` with a
    // court day and a gym day in it, forgets rest and match, and two columns of a shipped week
    // render empty with no error anywhere.
    //
    // ⚠ WIDENED, NOT WEAKENED (31.07): it swept the four ordinary kinds because they were the only
    // ones drawn. All eight draw now, so all eight are covered - and the two travel days of a trip
    // week are exactly the kind of column that would render empty unnoticed, because nobody opens a
    // career on a Sunday of a tournament week to check.
    const bands = populatedBands()
    expect(bands.length, 'no band is populated at all').toBeGreaterThan(0)
    for (const band of bands) {
      for (const kind of ALL_KINDS) {
        for (const index of DAY_INDEXES) {
          expect(
            dayBlocksFor(kind, band, { index, role: 'court' }).length,
            `band ${band} has nothing for a ${kind} day on index ${index}`,
          ).toBeGreaterThan(0)
        }
      }
    }
  })

  it('⚠ and every band `bandFor` can return is one of them – no age falls off the table', () => {
    // The other half of the same hole: a threshold added to BAND_FROM without a shape row would
    // return a band that draws nothing. Swept over every age this game could ever reach, and then
    // some - she starts at 14 and the adult-tour spec ends careers well before 60.
    for (let age = 0; age <= 60; age++) {
      expect(populatedBands(), `age ${age} lands on an unpopulated band`).toContain(bandFor(age))
      // ⚠ AND THE SAME HOLE ON THE OTHER AXIS (W4-SCHOOL): `bandFor` gained a second argument, so
      // the sweep has to cover both answers or a half-added `full-time` row ships unnoticed.
      expect(populatedBands(), `age ${age}, school over, lands nowhere`).toContain(bandFor(age, true))
    }
  })

  it('she starts at fourteen, and fourteen is the school band', () => {
    expect(bandFor(14)).toBe('school')
    expect(module_).toContain("export type AgeBand = 'school' | 'senior-school' | 'full-time'")
    // ⚠ RE-AIMED, NOT WEAKENED (W4-SCHOOL). This read `toEqual(['school'])` and its note said the
    // other two rows are "a place to put a decision rather than a decision already taken". The owner
    // has now taken one of them – «Школа должна когда-то закончиться... Конец школы – в конце
    // учебного года» – so `full-time` is populated and `senior-school` is still not. The property
    // the line was defending is unchanged and is asserted below: a band in the table is COMPLETE,
    // and a band that is not in it draws nothing rather than borrowing somebody else's day.
    expect(populatedBands().sort()).toEqual(['full-time', 'school'])
    expect(populatedBands()).not.toContain('senior-school')
    // ⚠ AND IT IS NOT AN AGE RUNG, which is the part a future reader will get wrong. School ends at
    // the September after her last grade, and for a September-born girl that is a whole year later
    // in absolute time than for an August-born one – so the answer arrives as DATA on the week and
    // an age alone can never produce it. Twenty-two and still at school is a real (if unhappy) row.
    expect(bandFor(22)).toBe('school')
    expect(bandFor(14, true)).toBe('full-time')
    expect(bandFor(22, true)).toBe('full-time')
  })

  it('a band with no row draws nothing rather than borrowing the school day', () => {
    // Unreachable today (the test above pins that), and it must stay honest if it ever is reached:
    // drawing a fourteen-year-old's school day for an adult would be the invention the module's
    // header refuses. An empty column is at least not a lie.
    //
    // ⚠ AND THE GATE IS ON THE BAND, WHICH IS WHY THE TRIP WEEK IS IN THIS SWEEP TOO. A trip arc
    // carries no school furniture, so it was tempting to let it answer for any band - and that is
    // precisely how a half-added band would ship looking half-finished instead of failing here.
    // ⚠ RE-AIMED (W4-SCHOOL): `full-time` left this list because it has a row now. The rule and its
    // sweep are untouched – `senior-school` is still the band nobody has designed, and it is still
    // required to draw an empty column rather than a fourteen-year-old's school day.
    for (const band of ['senior-school'] as AgeBand[]) {
      for (const kind of ALL_KINDS) {
        for (const index of DAY_INDEXES) expect(dayBlocksFor(kind, band, { index, role: 'court' })).toEqual([])
      }
    }
  })

  it('the band is a PARAMETER of the layout function, not a constant inside it', () => {
    // The owner's instruction was architectural: «надо заложить в архитектуру». A signature that
    // takes the band is the whole of what he asked for, so it is pinned as a signature.
    //
    // ⚠ RE-AIMED (31.07): the signature grew a third parameter - the DAY, because the four weeks the
    // grid used to refuse are a sequence rather than a mix (a trip travels out before it comes home,
    // an exam falls on the day the school puts it). The rule pinned here is unchanged and is the
    // only one it ever meant: the BAND is a parameter and not a constant. So it matches the
    // signature's opening rather than its full arity, the same way the screen's call-site pin below
    // stopped re-typing every argument the composable earns.
    expect(module_).toContain('export function dayBlocksFor(kind: DayKind, band: AgeBand')
    // ⚠ RE-AIMED to the signature's OPENING for the same reason `dayBlocksFor`'s pin already is
    // (W4-SCHOOL): `bandFor` gained `schoolOver`, because school ending is not expressible as an age.
    expect(module_).toContain('export function bandFor(ageYears: number')
  })
})

// =================================================================================================
// (a) THE BLOCKS THEMSELVES – inside the canvas, and never a fact the week does not contain
// =================================================================================================
/** WHAT THE WEEK BOUGHT, in sessions, for the day this sweep is looking at (W4-SCHOOL).
 *
 *  ⚠ IT IS A PROPERTY OF THE BAND AND NOT A LOOSENING OF THE RULE. The `school` band buys one
 *  session a day, the `full-time` band buys two on a court day – the morning school used to own,
 *  which is exactly what `ECONOMY.school.loadFactor` prices and what the read-out under the grid
 *  says out loud. Every other day of every band still buys one, and the exam kind resolves to its
 *  plan ROLE (`examDay`), so it is asked the role's question. */
function sessionsBought(band: AgeBand, kind: DayKind, role: OrdinaryKind): number {
  if (band !== 'full-time') return 1
  const effective = kind === 'school' ? (role === 'match' ? 'court' : role) : kind
  return effective === 'court' ? 2 : 1
}

describe('a block is drawable, and it is not an invention', () => {
  it('every block starts and ends inside the 07:00–19:00 span the grid draws', () => {
    for (const b of ALL_BLOCKS()) {
      expect(b.start, `${b.label} starts before the grid`).toBeGreaterThanOrEqual(GRID_START_HOUR)
      expect(b.start + b.span, `${b.label} runs past the bottom of the grid`).toBeLessThanOrEqual(GRID_END_HOUR)
      expect(b.span, `${b.label} is shorter than an hour`).toBeGreaterThanOrEqual(1)
      expect(Number.isInteger(b.start) && Number.isInteger(b.span), `${b.label} is not on whole hours`).toBe(true)
    }
    expect(ALL_BLOCKS().length, 'the sweep found no blocks at all').toBeGreaterThan(6)
  })

  it('no two blocks in one day overlap', () => {
    // ⚠ AND THE EXAM WEEK IS WHY THIS SWEEP GREW THE DAY LOOP. The papers are dropped INTO the
    // ordinary day's shape - that is the whole trick of the week, her session stays where it was -
    // so an exam scheduled at 15:00 would silently draw on top of the drill rather than beside it.
    for (const band of populatedBands()) {
      for (const kind of ALL_KINDS) {
        for (const index of DAY_INDEXES) {
          for (const role of ORDINARY_KINDS) {
            // ...and over every `off` context too - the six family packages each draw their own day -
            // and the whole matrix again inside the summer window (R15-8).
            for (const ctx of SWEEP_CONTEXTS) {
              const blocks = [...dayBlocksFor(kind, band, { index, role, ...ctx })].sort((a, b) => a.start - b.start)
              for (let i = 1; i < blocks.length; i++) {
                expect(
                  blocks[i].start,
                  `${band}/${kind}[${index}]/${role}/${JSON.stringify(ctx)}: "${blocks[i].label}" starts inside "${blocks[i - 1].label}"`,
                ).toBeGreaterThanOrEqual(blocks[i - 1].start + blocks[i - 1].span)
              }
            }
          }
        }
      }
    }
  })

  // ⚠ THE ONE ARITHMETIC THE GRID COULD LIE WITH. `weekDays.ts` sells the plan as "N sessions - M on
  // court, 1 in the gym" and prints that sentence directly under this grid. A day shape with two
  // tennis blocks on it would make the picture and the sentence disagree about the same week, off
  // the same `plan.train`, on the same screen - which is precisely the class of bug the day strip
  // itself was built to close (the story card and the calendar disagreeing about Sunday).
  //
  // ⚠ RE-AIMED FOR EIGHT KINDS, AND SHARPENED RATHER THAN LOOSENED (31.07). It used to read "more
  // than the PLAN bought" and it only ever looked at the four ordinary kinds, because they were the
  // only ones drawn. Now that a trip draws too, the naive widening would have been WRONG: a
  // tournament block is not a session the plan paid for, so counting it against `plan.train` would
  // measure the wrong thing and the rule would have had to be relaxed to pass. So the rule is
  // restated in three parts, each stricter than the one line it replaces:
  //
  //   1. NO DAY OF ANY KIND draws two pieces of sport. One day, one thing.
  //   2. `drills` MEANS "the session the plan bought". It may appear only on the weeks the plan owns
  //      - the ordinary mix and the exam fortnight, where her hours survive - and never on a trip,
  //      a family week or a layoff. That is the old arithmetic, now with a name it can be checked by.
  //   3. the weeks whose read-out says there is no tennis draw none.
  it('⚠ ONE session a day: the picture cannot claim more tennis than the WEEK bought', () => {
    const TENNIS: BlockKind[] = ['training', 'trainingAlt', 'drills', 'match', 'matchLong', 'tournament']
    for (const band of populatedBands()) {
      for (const kind of ALL_KINDS) {
        for (const index of DAY_INDEXES) {
          for (const role of ORDINARY_KINDS) {
            const where = `${band}/${kind}[${index}]/${role}`
            const blocks = dayBlocksFor(kind, band, { index, role })
            const tennis = blocks.filter((b) => TENNIS.includes(b.kind))
            const gym = blocks.filter((b) => b.kind === 'gym')
            // ⚠ RE-AIMED FOR THE FULL-TIME BAND (W4-SCHOOL), THE SAME WAY THE HOLIDAYS ARM ALREADY
            // RE-AIMED IT, AND FOR THE SAME REASON. The rule was never "one block of tennis" for its
            // own sake – it is «the picture cannot claim more tennis than the WEEK bought», and past
            // school the week buys two on a court day: `summerLoadFactor` returns
            // `ECONOMY.school.loadFactor` on it and `trainingReadout` says "two sessions a day"
            // underneath the grid. A guard that kept insisting on one would have made the picture
            // quieter than the week the engine is running, which is the failure it exists to catch.
            const bought = sessionsBought(band, kind, role)
            expect(tennis.length + gym.length, `${where} draws more than the ${bought} it bought`).toBeLessThanOrEqual(bought)

            // (1) the ordinary four, exactly as before – the day kinds that ARE a session draw one,
            // or the grid would be quieter than the week it is drawing.
            if (kind === 'court' || kind === 'match') expect(tennis.length, where).toBe(bought)
            if (kind === 'gym') expect(gym.length, where).toBe(1)
            if (kind === 'rest') expect(tennis.length + gym.length, where).toBe(0)

            // (2) the plan's own block, on the plan's own weeks only.
            const drills = blocks.filter((b) => b.kind === 'drills').length
            if (kind === 'away' || kind === 'off' || kind === 'rehab') {
              expect(drills, `${where} spends a session the plan did not buy`).toBe(0)
            }
            if (kind === 'school' && role === 'court') {
              expect(drills, `${where}: an exam day dropped the session the coach is billed for`).toBe(1)
            }

            // (3) the weeks that say "no tennis" out loud, and the one that says "no court".
            if (kind === 'off' || kind === 'rehab') {
              expect(tennis.length + gym.length, `${where}: the read-out says there is no tennis`).toBe(0)
            }
          }
        }
      }
    }
  })

  // ⚠ RE-AIMED FOR THE HOLIDAYS (W3-SUMMER), AND THE RULE IS THE SAME RULE. The sweep above passes no
  // `summer` context, so it kept passing untouched - which is exactly why this arm has to exist: a
  // guard that goes silent on a new week is worse than one that fails.
  //
  // The rule was never "one block of tennis" for its own sake. It is «the picture cannot claim more
  // tennis than the WEEK bought», and what the week buys changed: the owner ruled the holidays are a
  // real training block, so `summerBlockWeek` develops those weeks 40% harder and charges them 3
  // condition, and `trainingReadout` says "two sessions a day" underneath the grid. So on a summer
  // COURT day the honest picture is two, and everywhere else it is still one.
  it('⚠ TWO sessions a day in the holidays, and nowhere else - the engine bought them', () => {
    const TENNIS: BlockKind[] = ['training', 'trainingAlt', 'drills', 'match', 'matchLong', 'tournament']
    for (const band of populatedBands()) {
      for (const index of DAY_INDEXES) {
        for (const role of ORDINARY_KINDS) {
          for (const kind of ALL_KINDS) {
            const where = `summer ${band}/${kind}[${index}]/${role}`
            const blocks = dayBlocksFor(kind, band, { index, role, summer: true })
            const sport = blocks.filter((b) => TENNIS.includes(b.kind) || b.kind === 'gym')
            if (kind === 'court') {
              // The plan's own afternoon drill, plus the morning the school hours gave back.
              expect(sport.length, `${where} does not draw the block the engine is running`).toBe(2)
              expect(blocks.filter((b) => b.kind === 'drills').length, where).toBe(1)
              expect(blocks.filter((b) => b.kind === 'trainingAlt').length, where).toBe(1)
            } else {
              // ⚠ RE-AIMED FOR THE FULL-TIME BAND (W4-SCHOOL). In that band the holidays are not a
              // window at all – every week is school-free – so `dayBlocksFor` does NOT run the
              // summer transform there and a court-role day already draws its two. Same rule, asked
              // of the band it is being asked in.
              expect(
                sport.length,
                `${where} draws a second session the week did not buy`,
              ).toBeLessThanOrEqual(sessionsBought(band, kind, role))
            }
            // ⚠ AND THE DAY IS NO LONGER THAN A TERM-TIME DAY. The extra hour lives INSIDE the span
            // school used to own, which is the whole reason it may be drawn at all - the holidays give
            // hours back, they do not add them.
            const termTime = dayBlocksFor(kind, band, { index, role })
            const span = (bs: readonly { start: number; span: number }[]) =>
              bs.length === 0 ? 0 : Math.max(...bs.map((b) => b.start + b.span)) - Math.min(...bs.map((b) => b.start))
            expect(span(blocks), `${where} runs longer than the same day in term time`).toBeLessThanOrEqual(span(termTime))
          }
        }
      }
    }
  })

  it('⚠ AND A TRIP\'S TENNIS IS THE TRIP\'S, never the plan\'s – no round is named', () => {
    // The other half of the restatement. A tournament week has tennis in it and none of it is the
    // plan's, so the check is about WHICH block appears rather than how many: the event days wear
    // the outlined `tournament` block, the venue hit wears `training`, and neither is `drills`.
    const trip = DAY_INDEXES.map((index) => dayBlocksFor('away', 'school', { index, role: 'court' }))
    expect(trip.flat().some((b) => b.kind === 'tournament'), 'a trip week draws no tournament at all').toBe(true)
    expect(trip.flat().filter((b) => b.kind === 'travel').length, 'out and back').toBe(2)
    // ⚠ NOT ONE ROUND IS NAMED, and this is the pin for it: the week has not been played, so a block
    // reading "R2" on the Thursday would assert she came through Wednesday. Every event day says the
    // same thing, which is when the tournament is on - not how far she got.
    const eventLabels = new Set(trip.flat().filter((b) => b.kind === 'tournament').map((b) => b.label))
    expect(eventLabels.size, 'the event days do not all say the same thing').toBe(1)
    for (const b of trip.flat()) {
      expect(b.label, `"${b.label}" names a round`).not.toMatch(/\b(R\d|QF|SF|final|round|semi|quarter)\b/i)
    }
  })

  it('a whole week of blocks agrees with the plan the read-out sells', () => {
    // The same check one level up, on a real week: the number of court days in the grid IS the
    // number `calendarWeekFor` counted, at every preset.
    for (const preset of Object.values(WEEK_PLAN_PRESETS)) {
      const week = calendarWeekFor(facts({ plan: preset }), 6)
      const grid = weekGridFor(week, 14, weekDayNumbers(6))
      const courtCols = grid.filter((d) => d.blocks.some((b) => b.kind === 'drills')).length
      const gymCols = grid.filter((d) => d.blocks.some((b) => b.kind === 'gym')).length
      expect(courtCols, `${preset.train}: court days`).toBe(week.courtDays)
      expect(gymCols, `${preset.train}: the one gym day`).toBe(gymDayIndex(sessionsForPlan(preset.train)) === null ? 0 : 1)

      // ⚠ AND THE EXAM FORTNIGHT BUYS THE SAME TENNIS, which is the owner's whole point: «расходы на
      // тренера... всё еще при нас, просто ежедневная школа разбивается на ряд экзаменов». The coach
      // is billed that week, nothing in the engine gates training on an exam week, and this project
      // already settled that «на тренировку можно доехать» - so an exam week draws exactly the
      // sessions an ordinary week at the same preset draws, on exactly the same days.
      const examWeek = ECONOMY.availability.examWeeks[0][0]
      const exams = weekGridFor(calendarWeekFor(facts({ plan: preset, week: examWeek - 1 }), examWeek), 14, weekDayNumbers(examWeek))
      expect(exams.filter((d) => d.blocks.some((b) => b.kind === 'drills')).length, `${preset.train}: exam-week court days`)
        .toBe(week.courtDays)
      expect(exams.filter((d) => d.blocks.some((b) => b.kind === 'gym')).length, `${preset.train}: exam-week gym`).toBe(gymCols)
    }
  })

  // ⚠ CAUGHT IN THE BROWSER AT 375, not reasoned about: the grid drew "School" on a SATURDAY. The
  // shape table is keyed by day KIND, which is the right key for everything she chooses to do and
  // the wrong one for the single piece of furniture that is a fact about the DATE - and at the
  // grind preset Saturday is an ordinary court day (rest is claimed Sunday first, then midweek).
  it('⚠ SHE IS NOT AT SCHOOL AT THE WEEKEND, whatever the plan makes of those days', () => {
    for (const preset of Object.values(WEEK_PLAN_PRESETS)) {
      const grid = weekGridFor(calendarWeekFor(facts({ plan: preset }), 6), 14, weekDayNumbers(6))
      for (const day of grid.filter((d) => d.short === 'SAT' || d.short === 'SUN')) {
        expect(
          day.blocks.some((b) => b.kind === 'school' || b.kind === 'schoolLong'),
          `${preset.train}: ${day.short} has her in a classroom`,
        ).toBe(false)
      }
      // ...and the weekdays still do have school on them, or the rule has eaten the band's furniture
      const monday = grid[0]
      if (monday.kind !== 'rest') expect(monday.blocks.some((b) => b.kind === 'school')).toBe(true)
    }
    // ⚠ AND NO PAPER FALLS ON A SATURDAY EITHER. An exam is a `school` block, so the same rule covers
    // it - which is the argument for having put the weekday rule in the composer rather than in the
    // table, made a second time by a week the table did not exist for when it was written.
    const examWeek = ECONOMY.availability.examWeeks[0][0]
    const exams = weekGridFor(calendarWeekFor(facts({ week: examWeek - 1 }), examWeek), 14, weekDayNumbers(examWeek))
    for (const day of exams.filter((d) => d.short === 'SAT' || d.short === 'SUN')) {
      expect(day.blocks.some((b) => b.label === 'Exam'), `${day.short} sits a paper`).toBe(false)
    }
    // a layoff week is still a school week: she is off the court, not off the register
    const hurt = weekGridFor(
      calendarWeekFor(facts({ injury: { kind: 'ankle', severity: 'minor', weeksRemaining: 3, totalWeeks: 4 } }), 6),
      14,
      weekDayNumbers(6),
    )
    expect(hurt[0].blocks.some((b) => b.kind === 'school'), 'a laid-up Monday skipped school').toBe(true)
    expect(hurt[5].blocks.some((b) => b.kind === 'school'), 'a laid-up Saturday went to school').toBe(false)
  })

  it('the weekday rule only ever REMOVES – it cannot invent an hour', () => {
    // The direction is the whole argument for putting it in the composer rather than in the table:
    // the table stays the one place a day's shape is decided, and the weekend can only decline to
    // assert something, never add to it.
    //
    // ⚠ RUN OVER EVERY KIND OF WEEK NOW, not just the ordinary one: the composer's job grew (it hands
    // the table the day index and the plan's role), and "only ever removes" is the property that
    // stops that growth from turning into a second place where a day's shape gets decided.
    const weeks: [string, CalendarWeek][] = [
      ['ordinary', calendarWeekFor(facts(), 6)],
      ['exams', calendarWeekFor(facts({ week: ECONOMY.availability.examWeeks[0][0] - 1 }), ECONOMY.availability.examWeeks[0][0])],
      ['layoff', calendarWeekFor(facts({ injury: { kind: 'ankle', severity: 'minor', weeksRemaining: 3, totalWeeks: 4 } }), 6)],
    ]
    for (const [what, week] of weeks) {
      const grid = weekGridFor(week, 14, weekDayNumbers(week.week))
      for (const day of grid) {
        const shape = dayBlocksFor(day.kind, 'school', {
          index: day.index,
          role: day.kind === 'court' || day.kind === 'gym' || day.kind === 'rest' || day.kind === 'match'
            ? day.kind
            : planRoleOf(week, day.index),
        })
        expect(day.blocks.length, `${what}/${day.short}`).toBeLessThanOrEqual(shape.length)
        for (const block of day.blocks) {
          expect(shape, `${what}/${day.short} grew a block the table does not have`).toContainEqual(block)
        }
      }
    }
  })

  it('a booked friendly shows up as the day\'s main event, on the day the strip marks', () => {
    const grid = gridFor({ practices: [{ week: 6, paidCents: 3000, withCoach: false }] })
    const match = grid.filter((d) => d.blocks.some((b) => b.kind === 'matchLong'))
    expect(match.length).toBe(1)
    expect(match[0].short).toBe('SAT')
    // it is the longest block in her week – a practice match is not an hour after school
    const block = match[0].blocks.find((b) => b.kind === 'matchLong')!
    expect(block.span).toBeGreaterThanOrEqual(3)
  })

  it('player copy: every label says something, in the app\'s own dash, with no Cyrillic', () => {
    for (const b of ALL_BLOCKS()) {
      expect(b.label).not.toBe('')
      expect(b.label, 'long dash in a block label').not.toContain('—')
      expect(b.label, 'Cyrillic in a block label').not.toMatch(/[Ѐ-ӿ]/)
      expect(b.label.length, `"${b.label}" will not fit a 40px column`).toBeLessThanOrEqual(18)
    }
  })

  it('⚠ NO WORD LONGER THAN SIX CHARACTERS, because the column is 35px and it breaks mid-word', () => {
    // Measured in the browser at 375pt, not preferred: a block is about 35-40px wide and the label
    // wraps with `break-word`, so an eight-letter word has nowhere to break but inside itself -
    // "Strength" came out as "Streng / th" and the shipped "Practice match" as "Practi / ce match".
    // The rule was written down at COURT_SESSIONS and applied only to the two session lists; it is a
    // fact about EVERY label in the file, so it is swept over every label in the file. That is how
    // the one violator that shipped got found, and it is "Match play" now.
    for (const b of ALL_BLOCKS()) {
      for (const word of b.label.split(/[\s–-]+/)) {
        expect(word.length, `"${b.label}": "${word}" breaks mid-word in a 35px block`).toBeLessThanOrEqual(6)
      }
    }
  })
})

// =================================================================================================
// (b) THE BOUNDARY – which weeks may be drawn as a grid at all
// =================================================================================================
describe('⚠ the grid is drawn on EVERY week, and only its content differs', () => {
  it('an ordinary training week gets seven dated columns', () => {
    const grid = gridFor()
    expect(grid.length).toBe(7)
    expect(grid.map((d) => d.short)).toEqual(['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'])
    // the heads are dated off the shared formatter, never re-derived here
    expect(grid.map((d) => d.date)).toEqual(weekDayNumbers(6))
  })

  // ⚠ THIS TEST IS THE OVERRULED BOUNDARY, TURNED ROUND. It used to assert that each of these five
  // weeks drew NOTHING - `expect(grid).toBeNull()` - on the strength of «...для тех, где нет
  // отпусков, чемпионатов и поездок». The owner was asked directly and answered «очень даже должна
  // [рисоваться], никакой разницы. Просто содержание сетки будет другим», so the same five cases now
  // assert what each week DRAWS. Deleting the case list and starting again would have quietly lost
  // the coverage; every week that used to be pinned as blank is still pinned, now by its content.
  const trip = () => {
    const e = { id: 'e1', week: 6, tier: 'local', surface: 'hard', label: 'Local Open', entered: true,
      eligible: true, cancellable: false, deadlineWeek: 5, entryFeeCents: 0, travelCostCents: 0,
      preview: { firstMatchChance: 0.5, opponentName: 'M', fieldStrength: 'even', temperatureC: 20, crowd: 40 } }
    return gridFor({
      upcoming: [e as never],
      arrival: { eventId: 'e1', tier: 'local', week: 6, verdict: 'play', outgrown: false },
    })
  }
  const offSeason = () => {
    const w = WEEKS_PER_YEAR - OFF_SEASON_WEEKS
    return weekGridFor(calendarWeekFor(facts({ week: w - 1 }), w), 14, weekDayNumbers(w))
  }
  const examWeek = () => {
    const w = ECONOMY.availability.examWeeks[0][0]
    return weekGridFor(calendarWeekFor(facts({ week: w - 1 }), w), 14, weekDayNumbers(w))
  }
  const family = () => gridFor({ vacations: [{ week: 6, packageId: 'seaside', paidCents: 40000 }] })
  const layoff = () => gridFor({ injury: { kind: 'ankle', severity: 'minor', weeksRemaining: 3, totalWeeks: 4 } })

  it('⚠ not one of the five weeks that used to stand down draws an empty column', () => {
    const cases: [string, ReturnType<typeof gridFor>][] = [
      ['a tournament trip', trip()],
      ['a family week', family()],
      ['a layoff', layoff()],
      ['the off-season', offSeason()],
      ['an exam block', examWeek()],
    ]
    for (const [what, grid] of cases) {
      expect(grid.length, `${what} lost its seven columns`).toBe(7)
      for (const day of grid) {
        expect(day.blocks.length, `${what}: ${day.short} is an empty column`).toBeGreaterThan(0)
      }
    }
  })

  it('the trip week is a journey out, a hit, the draw, and a journey home', () => {
    const grid = trip()
    expect(grid[0].blocks[0].kind, 'Monday does not travel').toBe('travel')
    expect(grid[6].blocks[0].kind, 'Sunday does not come home').toBe('travel')
    expect(grid.filter((d) => d.blocks.some((b) => b.kind === 'tournament')).length).toBeGreaterThanOrEqual(3)
    // she is not at school and she is not spending the plan's sessions – the family is away
    expect(grid.flatMap((d) => d.blocks).some((b) => b.kind === 'school' || b.kind === 'drills')).toBe(false)
  })

  // ⚠ RE-AIMED (31.07): THESE ARE TWO DIFFERENT WEEKS AND THE TEST WAS TREATING THEM AS ONE. Both
  // arrive as the `off` kind, so this looped over a booked family week and the off-season together and
  // demanded no tennis in either. That was right about the holiday and WRONG ABOUT THE OFF-SEASON,
  // and wrong in a way the game itself contradicted: `coachWorksThisWeek` stands the coach down for a
  // booked vacation and for nothing else, and `growWeek` has no off-season branch - so the engine
  // bills a coach and moves her skills through a week this picture drew as doing nothing. In the real
  // sport the off-season IS the training block, the hardest physical work of the year, precisely
  // because there is no tournament to be fresh for.
  //
  // So the rule splits along the line the game already draws. Neither half is weakened: the holiday
  // still may not draw one minute of sport, and the off-season now has to draw some, because a week
  // that bills a coach and shows an empty court is the screen contradicting the ledger.
  it('a booked family week has no tennis in it, and is not empty either', () => {
    const blocks = family().flatMap((d) => d.blocks)
    for (const kind of ['drills', 'gym', 'training', 'trainingAlt', 'match', 'matchLong', 'tournament'] as BlockKind[]) {
      expect(blocks.some((b) => b.kind === kind), `a booked week drew ${kind}`).toBe(false)
    }
    expect(blocks.some((b) => b.kind === 'vacation'), "the family's own hours").toBe(true)
  })

  it('⚠ the OFF-SEASON is the training block, because the coach is billed for it', () => {
    const blocks = offSeason().flatMap((d) => d.blocks)
    // Court work and fitness, which is what the bill is for.
    expect(blocks.some((b) => b.kind === 'training' || b.kind === 'trainingAlt'), 'no court work').toBe(true)
    expect(blocks.some((b) => b.kind === 'gym'), 'no fitness work').toBe(true)
    // ...but nothing to PLAY: the tour is shut, so no match and no tournament may appear.
    for (const kind of ['match', 'matchLong', 'tournament', 'drills'] as BlockKind[]) {
      expect(blocks.some((b) => b.kind === kind), `the off-season drew ${kind}`).toBe(false)
    }
    // No school - it is the holidays - and at least one day genuinely off, because even a pre-season
    // block has one.
    expect(blocks.some((b) => b.kind === 'school'), 'the off-season drew school').toBe(false)
    expect(blocks.some((b) => b.kind === 'rest'), 'a block with no rest day at all').toBe(true)
  })

  it('⚠ the exam fortnight breaks school up and KEEPS her sessions – the owner\'s own sentence', () => {
    // «Просто ежедневная школа разбивается на ряд экзаменов в разное время», and «расходы на тренера,
    // спарринги и физио всё еще при нас». So: no 08-13 block anywhere, papers at more than one hour,
    // at least one weekday with no paper at all, and the plan's own sessions untouched.
    const grid = examWeek()
    const blocks = grid.flatMap((d) => d.blocks)
    const papers = blocks.filter((b) => b.label === 'Exam')
    expect(papers.length, 'no papers in the exam week').toBeGreaterThan(2)
    expect(new Set(papers.map((b) => b.start)).size, 'every paper at the same hour is not a scatter').toBeGreaterThan(1)
    expect(blocks.some((b) => b.kind === 'school' && b.span >= 5), 'the daily school block survived').toBe(false)
    expect(grid.slice(0, 5).some((d) => !d.blocks.some((b) => b.label === 'Exam')), 'a paper every single day').toBe(true)
    expect(blocks.some((b) => b.kind === 'drills'), 'she stopped training in the exam week').toBe(true)
  })

  it('a layoff keeps her hours and takes the sport out of them', () => {
    const grid = layoff()
    const blocks = grid.flatMap((d) => d.blocks)
    expect(blocks.some((b) => b.kind === 'physio'), 'nothing rehab-shaped in a rehab week').toBe(true)
    for (const kind of ['drills', 'gym', 'match', 'matchLong', 'tournament', 'training'] as BlockKind[]) {
      expect(blocks.some((b) => b.kind === kind), `a laid-up week drew ${kind}`).toBe(false)
    }
    // the physio hours land on the days the plan bought – the coach still works the week
    const week = calendarWeekFor(facts({ injury: { kind: 'ankle', severity: 'minor', weeksRemaining: 3, totalWeeks: 4 } }), 6)
    const worked = grid.filter((d) => d.blocks.some((b) => b.kind === 'physio')).map((d) => d.index)
    expect(worked).toEqual(sessionDays(week.sessions))
  })

  it('a rested knock is still an ordinary week – she is at home, not away', () => {
    // A knock leaves her at home on a week of rest days, which the grid draws as rest days.
    const grid = gridFor({ knock: { part: 'ankle', sinceWeek: 5, repeat: false, choice: 'rest', untilWeek: 6 } })
    expect(grid.every((d) => d.blocks.every((b) => b.kind !== 'drills'))).toBe(true)
  })

  it('the four ordinary kinds are exactly the ones `weekDays.ts` mixes', () => {
    // ⚠ `isOrdinaryWeek` IS GONE, and this is the pin that says so rather than a deletion nobody
    // reads: it was the boundary predicate, it gated the drawing, and a predicate that gates nothing
    // is worse than no predicate - the next hand would wire it back up. `isOrdinaryKind` stays,
    // because the SHAPE TABLE still has two halves: a day whose shape is a fact about its kind, and
    // a day whose shape is a fact about where it falls in the week.
    for (const kind of ['court', 'gym', 'rest', 'match'] as const) expect(isOrdinaryKind(kind)).toBe(true)
    for (const kind of ['away', 'off', 'school', 'rehab'] as const) expect(isOrdinaryKind(kind)).toBe(false)
    expect(module_).not.toContain('isOrdinaryWeek')
  })
})

// =================================================================================================
// THE CANVAS – percentages, so one declaration in the sheet moves the whole grid
// =================================================================================================
describe('a block lands where its hour is', () => {
  it('the top of the canvas is the first hour and the bottom is the last', () => {
    expect(hourTop(GRID_START_HOUR)).toBe('0%')
    expect(hourTop(GRID_END_HOUR)).toBe('100%')
    expect(blockOffset({ start: 7, span: 12, kind: 'rest', label: 'x' })).toEqual({ top: '0%', height: '100%' })
  })

  it('an hour is an hour wherever it falls', () => {
    const span = GRID_END_HOUR - GRID_START_HOUR
    for (let h = GRID_START_HOUR; h <= GRID_END_HOUR; h++) {
      expect(hourTop(h)).toBe(`${Math.round(((h - GRID_START_HOUR) / span) * 10000) / 100}%`)
    }
    // Two hours is twice one hour, to the two decimal places the offsets are rounded to (8.33 and
    // 16.67 – the rounding is deliberate: a percentage with fifteen digits in it in an inline style
    // is noise in every screenshot and every diff).
    const one = blockOffset({ start: 9, span: 1, kind: 'gym', label: 'x' })
    const two = blockOffset({ start: 9, span: 2, kind: 'gym', label: 'x' })
    expect(parseFloat(two.height)).toBeCloseTo(parseFloat(one.height) * 2, 1)
  })

  it('the labelled rules are every second hour, inside the span, and read as a clock', () => {
    expect(GRID_HOURS[0]).toBe(GRID_START_HOUR)
    expect(GRID_HOURS.at(-1)).toBe(GRID_END_HOUR)
    for (let i = 1; i < GRID_HOURS.length; i++) expect(GRID_HOURS[i] - GRID_HOURS[i - 1]).toBe(2)
    expect(hourLabel(7)).toBe('07:00')
    expect(hourLabel(19)).toBe('19:00')
  })
})

// =================================================================================================
// THE SCREEN – it chooses between two drawings and derives neither of them itself
// =================================================================================================
describe('the calendar renders the grid it is handed', () => {
  it('⚠ ONE drawing of the week, on every week – the second one is deleted, not disabled', () => {
    const template = screen.slice(screen.indexOf('<template>'), screen.lastIndexOf('</template>'))
    expect(template).toContain('<div v-if="grid" class="cal-time">')
    // ⚠ RE-AIMED TWICE, AND THIS TIME IT LOST HALF ITS SUBJECT. It used to pin that the day strip was
    // the grid's alternative (`v-if="!grid"`), then that a stand-down line sat between the two saying
    // WHY the hours were not drawn. The owner overruled the boundary itself on 31.07 - the grid draws
    // on every week - so BOTH of those branches became unreachable, and an unreachable branch in this
    // codebase gets deleted rather than left for the next hand to wonder about. What the pin protects
    // now is that the deletion was real: no second drawing, no stand-down line, no CSS for either.
    expect(template, 'the day strip came back').not.toContain('cal-grid')
    expect(template, 'the stand-down line came back').not.toContain('cal-standdown')
    expect(screen, 'the deleted drawing left its stylesheet behind').not.toContain('.cal-day-mark')
    expect(screen, 'the deleted drawing left its stylesheet behind').not.toContain('.cal-day--court')
    // one composable answers what a week's hours are, and the screen does not re-derive it
    // ⚠ RE-AIMED (round-19): a fourth argument joined the call - the career SEED, which names the
    // court and gym sessions so two consecutive weeks do not read as a photocopy. The rule this pins
    // is that the screen COMPOSES and does not decide, so it matches the call's opening rather than
    // its full arity, which would have to be re-typed every time the composable earns a parameter.
    expect(screen).toContain('weekGridFor(week, snap.ageYears, weekDayNumbers(week.week)')
    expect(screen).not.toContain('isOrdinaryWeek')
  })

  it('HER AGE COMES OFF THE SNAPSHOT – the calendar does not compute it', () => {
    // Same discipline as the surface and the layoff window: the number the rest of the app already
    // uses, so this screen and the Kid screen cannot disagree about how old she is.
    expect(screen).toContain('snap.ageYears')
    expect(screen).not.toContain('birthMonth')
    expect(module_).not.toContain('birthMonth')
  })

  it('NOTHING NEW ON THE PAYLOAD: the grid is derived from facts already in hand', () => {
    // The spec's own rule (§3.5), and the cheapest place to check it is the module's imports: a
    // grid that needed a new fact would have to reach for the protocol or the engine.
    expect(module_).not.toContain("from '../shared/protocol'")
    expect(module_).not.toContain("from '../engine/")
    expect(module_).toContain("import type { CalendarDay, CalendarWeek, DayBeat, DayKind } from './weekDays'")
  })

  it('every block kind has a colour, and it is the design system\'s', () => {
    // The palette is written out as static rules on purpose (a `var(--event-${kind})` built in a
    // template is a reference no scanner can resolve). This is the pin that the map is COMPLETE:
    // a thirteenth kind added to the type with no rule would paint with no background at all.
    // ⚠ FOURTEEN NOW: `physio` and `vacation` joined the type when the four weeks the grid used to
    // refuse arrived with hours in them (a layoff has physio in it, a family week has the family).
    // Both take a `--cat-*` the wallet already declares - the same hue means the same thing on both
    // screens - which is exactly what this pin exists to keep true of a NEW kind as well as an old.
    const KINDS: BlockKind[] = [
      'training', 'trainingAlt', 'gym', 'school', 'schoolLong', 'drills',
      'match', 'matchLong', 'study', 'travel', 'rest', 'tournament', 'physio', 'vacation',
    ]
    for (const kind of KINDS) {
      const rule = screen.match(new RegExp(`\\.cal-block--${kind}\\s*\\{([^}]*)\\}`))
      expect(rule, `no colour rule for a ${kind} block`).not.toBeNull()
      // ⚠ RE-AIMED (round-19): the family moved from `--event-*` to `--cat-*`. The owner found the
      // calendar «грустно-унылые» and asked for the wallet's palette, which is the brighter set and
      // now means the same thing on both screens (see the `--cat-*` block in src/style.css). The RULE
      // is unchanged and is the one that matters: every kind has a rule, and its colour is a declared
      // token rather than a hex typed into a component.
      const token = rule![1].match(/var\((--cat-[a-z-]+)\)/)
      expect(token, `the ${kind} block is not painted from a declared palette`).not.toBeNull()
      expect(sheet, `${token![1]} is not on :root`).toContain(`${token![1]}:`)
    }
    // ...and the outlined one is the only one with a stroke, which is what the thirteenth token is
    expect(screen).toContain('border: var(--stroke-hair) solid var(--cat-coaching)')
  })

  it('the sweep still crosses the week out, on every kind of week', () => {
    // The crossing-out animation is shipped behaviour and the grid replaced a DRAWING, not the
    // screen's logic. ⚠ RE-AIMED (31.07): it used to say "on whichever drawing is up" - there is one
    // drawing now, and the classes it answers to are the grid's, which are the ones that survived.
    // The columns it strikes are the same seven on a trip week as on a training week, because the
    // sweep reads `d.index` and the week's kind never enters into it.
    expect(screen).toContain("'cal-time-day--crossed': d.index < crossed")
    expect(screen).toContain("'cal-col--crossed': d.index < crossed")
    expect(screen).toContain("'cal-col--held': d.index === heldIndex")
    // ...and the beat still washes the column it is going to hold on
    expect(screen).toContain("'cal-col--beat': d.beat !== null")
    // reduced motion kills the grid's animation too
    const reduced = screen.slice(screen.indexOf('@media (prefers-reduced-motion: reduce)'))
    expect(reduced).toContain('.cal-col--held')
  })

  it('no Cyrillic in the template, short dash only – the calendar\'s own copy rule', () => {
    const template = screen.slice(screen.indexOf('<template>'), screen.lastIndexOf('</template>'))
    expect(template).not.toMatch(/[Ѐ-ӿ]/)
    expect(template).not.toContain('—')
  })
})

// =================================================================================================
// §4 – THE FRIDGE NOTE. A pool with no licence on it, and the one constraint that survives.
// =================================================================================================
//
// ⚠ THIS POOL IS DELIBERATELY NOT LICENSED AGAINST THE WEEK, AND THAT REVERSES THE SPEC'S OWN FIRST
// PROPOSAL. The architect wanted it to reuse the diary's WEEK_NOTES honesty pin; the owner overruled
// it (30.07): «"не забудь дождевик" на неделе, когда она никуда не едет – в том-то и дело, что это
// ок! нам здесь нужны как раз максимально жизненные записки "от родителей на холодильнике"».
//
// He is right. The honesty pin exists to stop the game ASSERTING THINGS ABOUT THE WEEK THAT ARE
// FALSE, and a note on a fridge asserts nothing about the week - it is milk, the bins and a rain
// jacket. So there is nothing here for a pin to check, and these tests check the two things there
// ARE: that the pool stays domestic (which is what makes the licence unnecessary rather than merely
// skipped), and that the scrap does not change its mind between two looks at the same week.
describe('the fridge note is a parent\'s handwriting, and it claims nothing about the week', () => {
  it('⚠ THE ONE CONSTRAINT: nothing in the DOMESTIC pool is about tennis, a result, a trip, her body or money', () => {
    // Expressed as a vocabulary sweep because it CAN be - that is the whole reason the constraint is
    // a rule about content rather than a machine. A line that cannot say "match" cannot claim she
    // played one, whatever week it lands on.
    //
    // ⚠ AND IT SWEEPS `FRIDGE_NOTES` ONLY, WHICH IS A SPLIT AND NOT A LOOPHOLE (31.07). The owner
    // added «записочки в духе "удачи на экзамене" или "держим за тебя кулачки"» - notes that speak to
    // a week that HAS something in it. Those live in their own pools and are exempt from this sweep
    // BY DESIGN, and the exemption is stated here rather than expressed by quietly widening the
    // sweep's input: the domestic pool is the one that lands on any week at all, so it is the one
    // that may never make a claim. The sub-pools land on exactly the week their claim is true of,
    // and the test below is what holds them to it.
    const FORBIDDEN = [
      'tennis', 'court', 'racket', 'racquet', 'serve', 'match', 'matches', 'tournament', 'final',
      'win', 'won', 'wins', 'lose', 'lost', 'beat', 'draw', 'round', 'rank', 'ranking', 'points',
      'coach', 'train', 'training', 'practice', 'practise', 'drills', 'gym', 'fitness',
      'injury', 'injured', 'hurt', 'ankle', 'knee', 'wrist', 'shoulder', 'physio', 'rehab',
      'money', 'cash', 'cost', 'pay', 'paid', 'price', 'fee', 'fees', 'budget',
      'flight', 'plane', 'airport', 'trip', 'travel', 'hotel', 'luck',
    ]
    const bad: string[] = []
    for (const line of FRIDGE_NOTES) {
      for (const word of FORBIDDEN) {
        if (new RegExp(`\\b${word}\\b`, 'i').test(line)) bad.push(`"${line}"  – says "${word}"`)
      }
    }
    expect(bad.join('\n')).toBe('')
    // ...and the sweep is real: it catches the owner's own counter-example.
    expect(FORBIDDEN.some((w) => new RegExp(`\\b${w}\\b`, 'i').test('Good luck tomorrow!'))).toBe(true)
  })

  it('the pool is the size the brief asked for, with no duplicates', () => {
    expect(FRIDGE_NOTES.length).toBeGreaterThanOrEqual(40)
    expect(FRIDGE_NOTES.length).toBeLessThanOrEqual(60)
    expect(new Set(FRIDGE_NOTES).size).toBe(FRIDGE_NOTES.length)
    // the two week pools are deliberately small – they only have one week each to be true on
    for (const [what, pool] of [['exams', EXAM_NOTES], ['a trip', TRIP_NOTES]] as const) {
      expect(pool.length, `${what}: not enough scraps to avoid a photocopy`).toBeGreaterThanOrEqual(6)
      expect(new Set(pool).size, `${what}: duplicates`).toBe(pool.length)
      // ...and no line belongs to two pools, which would make the mood do nothing on that week
      for (const line of pool) expect(FRIDGE_NOTES, `"${line}" is in the domestic pool too`).not.toContain(line)
    }
  })

  it('⚠ THE WEEK POOLS MAY CLAIM ONE THING – the week\'s own fact – AND NOTHING ELSE', () => {
    // The honesty pin's own logic, not an exception to it: "Good luck in the exam" is forbidden on an
    // ordinary week because there is nothing to wish her luck for, and fine on the week she sits her
    // papers because it is simply true. So the sweep here is over the things that are NOT true yet on
    // either week: a RESULT, a ROUND, an opponent, a mark. The week has not been played when this
    // scrap is read - it is taped up beside a picture of the week ahead.
    const UNKNOWABLE = [
      'won', 'win', 'wins', 'lost', 'beat', 'champion', 'title', 'trophy', 'final', 'semi',
      'quarter', 'round', 'passed', 'failed', 'grade', 'mark', 'marks', 'score', 'ranked',
    ]
    for (const [what, pool] of [['exams', EXAM_NOTES], ['a trip', TRIP_NOTES]] as const) {
      for (const line of pool) {
        for (const word of UNKNOWABLE) {
          expect(
            new RegExp(`\\b${word}\\b`, 'i').test(line),
            `${what}: "${line}" claims "${word}", which the week has not decided yet`,
          ).toBe(false)
        }
      }
    }
    // ...and each pool really is about its own week, or the split buys nothing
    expect(EXAM_NOTES.some((l) => /exam/i.test(l)), 'the exam pool never mentions the exams').toBe(true)
    expect(TRIP_NOTES.some((l) => /luck|crossed|out there/i.test(l)), 'the trip pool wishes her nothing').toBe(true)
  })

  it('player copy: short dash only, no Cyrillic, and short enough to be a scrap', () => {
    for (const line of [...FRIDGE_NOTES, ...EXAM_NOTES, ...TRIP_NOTES]) {
      expect(line, 'long dash on the fridge').not.toContain('—')
      expect(line, 'Cyrillic on the fridge').not.toMatch(/[Ѐ-ӿ]/)
      expect(line.length, `"${line}" is a letter, not a note`).toBeLessThanOrEqual(56)
      expect(line, `"${line}" does not end`).toMatch(/[.!?]$/)
      expect(line[0], `"${line}" starts small`).toBe(line[0].toUpperCase())
    }
  })

  it('⚠ STABLE FOR A GIVEN (seed, week) – a scrap of paper does not change its mind', () => {
    // The failure this prevents is not subtle: a note picked at render time would be a different
    // line every time the tab was opened, which is the one thing a piece of paper cannot do.
    for (const week of [0, 1, 7, 51, 260]) {
      expect(fridgeNoteFor('abc', week)).toBe(fridgeNoteFor('abc', week))
      expect(FRIDGE_NOTES).toContain(fridgeNoteFor('abc', week))
      // the mood picks the POOL and nothing else – same week, same index, other paper
      expect(fridgeNoteFor('abc', week, 'exam')).toBe(fridgeNoteFor('abc', week, 'exam'))
      expect(EXAM_NOTES).toContain(fridgeNoteFor('abc', week, 'exam'))
      expect(TRIP_NOTES).toContain(fridgeNoteFor('abc', week, 'trip'))
      // ⚠ AND THE DEFAULT IS THE DOMESTIC POOL, unchanged line for unchanged line: adding the moods
      // must not have reshuffled a single scrap in a career that already existed.
      expect(fridgeNoteFor('abc', week, 'home')).toBe(fridgeNoteFor('abc', week))
    }
    // ...and it is a fact about the CAREER, not about this device: two careers on the same week
    // read different scraps.
    const across = new Set(['seed-a', 'seed-b', 'seed-c', 'seed-d'].map((s) => fridgeNoteFor(s, 12)))
    expect(across.size).toBeGreaterThan(1)
  })

  it('a season of weeks really does walk the pool, rather than sticking on one line', () => {
    // The avalanche step in the hash is what buys this; without it consecutive weeks land on
    // consecutive-ish indexes and a career reads the pool in order.
    const season = new Set(Array.from({ length: 52 }, (_, w) => fridgeNoteFor('a-real-seed', w)))
    expect(season.size).toBeGreaterThan(20)
    // no week is ever without a note
    for (let w = 0; w < 52; w++) expect(fridgeNoteFor('a-real-seed', w)).not.toBe('')
  })

  it('⚠ NOT ONE DRAW FROM THE SIM, AND NO SUB-STREAM EITHER', () => {
    // The MAIN-stream capture (41550 draws, e6b0c709) must not move, and a sub-stream is for
    // randomness the SIM owns - a venue photograph, a diary greeting. A note taped beside a calendar
    // is chosen by the screen that draws it. The cheapest place to prove that is the imports.
    //
    // ⚠ READ AS CODE, NOT AS PROSE, and this file tripped over it on the first run: the module's own
    // header EXPLAINS why it does not call `rngFromSeed`, and naming the thing it refuses to do was
    // enough to fail a raw `not.toContain`. It is the same lesson tests/calendar-screen.test.ts
    // learned in the opposite direction, and the same `codeOf` strip answers both.
    const pool = codeOf(read('../src/composables/fridgeNote.ts'))
    expect(pool).not.toContain('rngFromSeed')
    expect(pool).not.toContain("from '../engine/")
    expect(pool).not.toMatch(/^import /m) // it imports nothing at all
    expect(pool).not.toContain('Math.random')
    // ...and no licence machinery came in through the back door
    expect(pool).not.toContain('claims')
    expect(pool).not.toContain('license')
  })

  it('the note rides with the GRID, and its week is the grid\'s week', () => {
    // If the two read different weeks, the paper and the picture next to it would be about different
    // sevens of days.
    expect(screen).toContain('<PaperNote v-if="grid" class="cal-note"')
    // ⚠ RE-AIMED (31.07): a third argument joined the call - which POOL this week's scrap comes from.
    // The rule pinned is unchanged (one week, read once, shared by the paper and the picture), so it
    // matches the call's opening rather than its arity. The mapping itself is pinned just below.
    expect(screen).toContain('fridgeNoteFor(snap.seed, week.week')
    // the week's kind chooses the pool, and it is a total map – a ninth DayKind fails to compile
    expect(screen).toContain('const NOTE_MOOD: Record<DayKind, NoteMood>')
    expect(screen).toMatch(/away: 'trip',/)
    expect(screen).toMatch(/school: 'exam',/)
    // ...and a family week and a layoff stay DOMESTIC on purpose: how those weeks go is not a fact
    // the fridge has before they are played.
    expect(screen).toMatch(/off: 'home',/)
    expect(screen).toMatch(/rehab: 'home',/)
    // the design's own object: taped, torn, ruled, tilted off one of its own angles
    expect(screen).toContain(':tilt="-0.8" ruled torn tape')
  })
})

// =================================================================================================
// ⚠ SIX HOLIDAYS, SIX WEEKS - AND THEY NARRATE A LADDER THAT WAS ALREADY IN THE MODEL
// =================================================================================================
//
// Owner, 31.07: «для каждого типа отпуска свое расписание недели, как думаешь? ... а то сейчас куда
// бы ни поехала и расписание одинаковое, и week recap, ну кроме картинки».
//
// The hard rule this suite exists to keep is NOT "they must differ" - six flavours of nothing would
// satisfy that and would drift the first time somebody re-tuned a package. It is that the drawing
// must be a readout of something real. `ECONOMY.vacation.packages` already differ by
// `conditionGain` (18 / 22 / 26 / 32 / 40 / 48 since the W2-FATIGUE lift - same order, one band
// higher), so the week HAS a ladder in it, and these tests
// pin the grid against THAT rather than against my taste in labels.
describe('each family package draws its own week', () => {
  const arcFor = (packageId: string) =>
    gridFor({ vacations: [{ week: 6, packageId, paidCents: 40000 }] })
  const kindsIn = (packageId: string) =>
    new Set(arcFor(packageId).flatMap((d) => d.blocks.map((b) => b.kind)))
  const IDS = ECONOMY.vacation.packages.map((p) => p.id)

  it('every package in the catalogue has an arc, and no two weeks are the same drawing', () => {
    // Derived from the catalogue, not a list of six strings: a seventh package added tomorrow fails
    // here rather than silently falling back to the generic family week.
    const drawings = new Set(IDS.map((id) => JSON.stringify(arcFor(id).map((d) => d.blocks))))
    expect(drawings.size, `${IDS.length} packages must draw ${IDS.length} different weeks`).toBe(IDS.length)
  })

  it('⚠ NO TENNIS ON ANY OF THEM - a family week is a family week', () => {
    // The one thing every arc must still agree on, and the reason the week exists at all. `physio`
    // and `gym` at the recovery end are NOT tennis: they are the treatment the package sells.
    const TENNIS = ['training', 'trainingAlt', 'drills', 'match', 'matchLong', 'tournament']
    for (const id of IDS) {
      for (const kind of TENNIS) {
        expect([...kindsIn(id)], `${id} put ${kind} in a week with no tennis in it`).not.toContain(kind)
      }
    }
  })

  it('the recovery ladder is drawn: the more the package gives her, the more of the week is treatment', () => {
    // `physio` hours against `conditionGain`, over the whole catalogue. Not a hand-written expectation
    // per package - a MONOTONICITY, so the two can never drift apart: re-tune a gain and this test
    // starts asking the arc to follow it.
    const physioHours = (id: string) =>
      arcFor(id)
        .flatMap((d) => d.blocks)
        .filter((b) => b.kind === 'physio')
        .reduce((n, b) => n + b.span, 0)
    const ladder = [...ECONOMY.vacation.packages].sort((a, b) => a.conditionGain - b.conditionGain)
    const hours = ladder.map((p) => physioHours(p.id))
    for (let i = 1; i < hours.length; i++) {
      expect(
        hours[i],
        `${ladder[i].id} (gain ${ladder[i].conditionGain}) must not draw less treatment than ${ladder[i - 1].id} (gain ${ladder[i - 1].conditionGain})`,
      ).toBeGreaterThanOrEqual(hours[i - 1])
    }
    // ...and the ends of the ladder are genuinely different weeks, or the monotonicity above is
    // satisfied by six zeroes.
    expect(hours[hours.length - 1], 'the top of the ladder draws no treatment at all').toBeGreaterThan(0)
    expect(hours[0], 'the cheapest package should not be a clinic').toBe(0)
  })

  it('the packages that travel spend a day at each end, and the staycation spends none', () => {
    // This is why grandma (14) and camping (16) sit below the seaside (20) for a similar kind of rest:
    // the road is part of the price, and the grid says so. The staycation's whole pitch is that there
    // is no journey - «no travel, no drills».
    const travelDays = (id: string) => arcFor(id).filter((d) => d.blocks.some((b) => b.kind === 'travel')).length
    expect(travelDays('staycation')).toBe(0)
    for (const id of IDS.filter((x) => x !== 'staycation')) {
      expect(travelDays(id), `${id} is a week away and must show the journey`).toBeGreaterThanOrEqual(1)
    }
  })

  it('an unknown package falls back to the generic family week rather than to an empty one', () => {
    // A save carrying a package this build does not know about (an older or newer catalogue) must
    // still draw a week. Degrading to today's behaviour is fine; degrading to seven blank columns is
    // the failure this screen was built to stop.
    const unknown = gridFor({ vacations: [{ week: 6, packageId: 'no-such-package', paidCents: 0 }] })
    expect(unknown.length).toBe(7)
    expect(unknown.every((d) => d.blocks.length > 0)).toBe(true)
  })
})

// =================================================================================================
// ⚠ R15-8 – THE SUMMER HOLIDAYS: less school on the calendar, and ONLY on the ordinary weeks
// =================================================================================================
//
// Owner, 01.08: «2 месяца обычно после экзаменов... просто меньше учебы в календаре писать,
// пару-тройку часов в неделю» - and, on the first draft's reach into the family weeks: «на
// каникулярных неделях Study снимается - чего это? там подготовка к экзаменам идет во всю». So the
// window reshapes the ORDINARY week only - school out, a light "Summer read" hour on two fixed
// weekdays - and the family/vacation arcs keep their study hours all year round.
describe('the summer holidays take the school out of the ordinary week', () => {
  const EXAM = ECONOMY.availability.examWeeks[0]

  it('the window opens the week after the last paper and is over long before the off-season', () => {
    expect(SUMMER_WEEKS[0]).toBe(EXAM[1] + 1)
    for (const w of [EXAM[0], EXAM[1]]) expect(isSummerWeek(w), `exam week ${w}`).toBe(false)
    for (let w = SUMMER_WEEKS[0]; w <= SUMMER_WEEKS[1]; w++) expect(isSummerWeek(w), `week ${w}`).toBe(true)
    for (let w = WEEKS_PER_YEAR - OFF_SEASON_WEEKS; w < WEEKS_PER_YEAR; w++) {
      expect(isSummerWeek(w), `off-season week ${w}`).toBe(false)
    }
    // ...and it is season-week arithmetic, so every season has a summer.
    expect(isSummerWeek(SUMMER_WEEKS[0] + WEEKS_PER_YEAR)).toBe(true)
    expect(isSummerWeek(EXAM[0] + WEEKS_PER_YEAR)).toBe(false)
    // The flag rides to the grid as DATA on the week - the same road offSeason takes.
    expect(calendarWeekFor(facts({ week: 25 }), 26).summer).toBe(true)
    expect(calendarWeekFor(facts(), 6).summer).toBe(false)
  })

  it('⚠ a summer ordinary week carries exactly the light study – two hours, TUE and THU, no school', () => {
    for (const preset of Object.values(WEEK_PLAN_PRESETS)) {
      const week = calendarWeekFor(facts({ plan: preset, week: 25 }), 26)
      const grid = weekGridFor(week, 14, weekDayNumbers(26))
      // No school block anywhere - it is the holidays.
      expect(grid.flatMap((d) => d.blocks).some((b) => b.kind === 'school' || b.kind === 'schoolLong'),
        `${preset.train}: school in the holidays`).toBe(false)
      // Exactly two study hours, on the two fixed weekdays, and they say what they are.
      const study = grid.flatMap((d) => d.blocks.filter((b) => b.kind === 'study').map((b) => ({ day: d.short, ...b })))
      expect(study.length, `${preset.train}: study hours`).toBe(2)
      expect(study.map((s) => s.day)).toEqual(['TUE', 'THU'])
      for (const s of study) {
        expect(s.label).toBe('Summer read')
        expect(s.span).toBe(1)
      }
      // ...and the plan's own tennis is untouched: the sessions are about the plan, not the term.
      const courtCols = grid.filter((d) => d.blocks.some((b) => b.kind === 'drills')).length
      expect(courtCols, `${preset.train}: summer court days`).toBe(week.courtDays)
    }
  })

  it('a booked friendly still owns its summer Saturday', () => {
    const grid = weekGridFor(
      calendarWeekFor(facts({ week: 25, practices: [{ week: 26, paidCents: 3000, withCoach: false }] }), 26),
      14,
      weekDayNumbers(26),
    )
    const match = grid.filter((d) => d.blocks.some((b) => b.kind === 'matchLong'))
    expect(match.length).toBe(1)
    expect(match[0].short).toBe('SAT')
  })

  it('⚠ the family and vacation arcs draw the IDENTICAL week in and out of the window', () => {
    // The owner's boundary, pinned as an identity rather than as a list of kept blocks: exam prep
    // runs through the holidays, so a week away in July studies exactly like a week away in March.
    const arcAt = (packageId: string, w: number) =>
      weekGridFor(
        calendarWeekFor(facts({ week: w - 1, vacations: [{ week: w, packageId, paidCents: 40000 }] }), w),
        14,
        weekDayNumbers(w),
      ).map((d) => d.blocks)
    for (const p of ECONOMY.vacation.packages) {
      expect(isSummerWeek(26)).toBe(true)
      expect(arcAt(p.id, 26), p.id).toEqual(arcAt(p.id, 6))
      // ...and the study hours really are still in the summer drawing, where the arc asserts them -
      // the identity above must not be satisfied by both halves losing them.
      const summer = arcAt(p.id, 26).flat()
      const termTime = arcAt(p.id, 6).flat()
      expect(summer.filter((b) => b.kind === 'study').length).toBe(termTime.filter((b) => b.kind === 'study').length)
    }
    // The generic family week too - a package the catalogue no longer knows still keeps its study.
    const generic = (w: number) =>
      weekGridFor(
        calendarWeekFor(facts({ week: w - 1, vacations: [{ week: w, packageId: 'no-such-package', paidCents: 0 }] }), w),
        14,
        weekDayNumbers(w),
      ).map((d) => d.blocks)
    expect(generic(26)).toEqual(generic(6))
    expect(generic(26).flat().some((b) => b.kind === 'study')).toBe(true)
  })

  it('the exam fortnight sits BEFORE the window and draws exactly what it always drew', () => {
    // Papers, scattered hours, her sessions standing - the existing exam suite pins the content;
    // this pins that summer cannot reach it: the fortnight ends the week before the window opens.
    const grid = weekGridFor(calendarWeekFor(facts({ week: EXAM[0] - 1 }), EXAM[0]), 14, weekDayNumbers(EXAM[0]))
    expect(grid.flatMap((d) => d.blocks).filter((b) => b.label === 'Exam').length).toBeGreaterThan(2)
    expect(grid.flatMap((d) => d.blocks).some((b) => b.label === 'Summer read')).toBe(false)
  })
})
