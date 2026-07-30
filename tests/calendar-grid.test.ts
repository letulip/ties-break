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
//   (b) THE BOUNDARY. «...для тех, где нет отпусков, чемпионатов и поездок.» A week she spends at a
//       tournament, away with the family, in an exam blackout or laid up keeps the day strip it has.
//       Every one of those is swept below, from the same `calendarWeekFor` the screen reads.
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
  isOrdinaryWeek,
  populatedBands,
  weekGridFor,
  type AgeBand,
  type BlockKind,
  type DayBlock,
} from '../src/composables/weekGrid'
import { calendarWeekFor, gymDayIndex, sessionsForPlan, type CalendarWeekFacts } from '../src/composables/weekDays'
import { weekDayNumbers } from '../src/shared/dates'
import { DEFAULT_PROFILE, WEEK_PLAN_PRESETS } from '../src/shared/protocol'
import { ECONOMY } from '../src/engine/economy'
import { OFF_SEASON_WEEKS, WEEKS_PER_YEAR } from '../src/engine/season/calendar'

const read = (rel: string) => readFileSync(new URL(rel, import.meta.url), 'utf8')
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

const ALL_BLOCKS = (): DayBlock[] =>
  populatedBands().flatMap((band) => ORDINARY_KINDS.flatMap((kind) => dayBlocksFor(kind, band)))

// =================================================================================================
// (c) THE AGE BAND – the completeness the owner asked for
// =================================================================================================
describe('the layout table is complete for every band it carries', () => {
  it('⚠ every populated band covers every ordinary day kind', () => {
    // THE HALF-ADDED BAND is the failure this exists for: a later hand adds `senior-school` with a
    // court day and a gym day in it, forgets rest and match, and two columns of a shipped week
    // render empty with no error anywhere.
    const bands = populatedBands()
    expect(bands.length, 'no band is populated at all').toBeGreaterThan(0)
    for (const band of bands) {
      for (const kind of ORDINARY_KINDS) {
        expect(dayBlocksFor(kind, band).length, `band ${band} has nothing for a ${kind} day`).toBeGreaterThan(0)
      }
    }
  })

  it('⚠ and every band `bandFor` can return is one of them – no age falls off the table', () => {
    // The other half of the same hole: a threshold added to BAND_FROM without a shape row would
    // return a band that draws nothing. Swept over every age this game could ever reach, and then
    // some - she starts at 14 and the adult-tour spec ends careers well before 60.
    for (let age = 0; age <= 60; age++) {
      expect(populatedBands(), `age ${age} lands on an unpopulated band`).toContain(bandFor(age))
    }
  })

  it('she starts at fourteen, and fourteen is the school band', () => {
    expect(bandFor(14)).toBe('school')
    // ...and the other two rows exist in the TYPE and deliberately not in the table, which is what
    // makes them a place to put a decision rather than a decision already taken.
    expect(module_).toContain("export type AgeBand = 'school' | 'senior-school' | 'full-time'")
    expect(populatedBands()).toEqual(['school'])
  })

  it('a band with no row draws nothing rather than borrowing the school day', () => {
    // Unreachable today (the test above pins that), and it must stay honest if it ever is reached:
    // drawing a fourteen-year-old's school day for an adult would be the invention the module's
    // header refuses. An empty column is at least not a lie.
    for (const band of ['senior-school', 'full-time'] as AgeBand[]) {
      for (const kind of ORDINARY_KINDS) expect(dayBlocksFor(kind, band)).toEqual([])
    }
  })

  it('the band is a PARAMETER of the layout function, not a constant inside it', () => {
    // The owner's instruction was architectural: «надо заложить в архитектуру». A signature that
    // takes the band is the whole of what he asked for, so it is pinned as a signature.
    expect(module_).toContain('export function dayBlocksFor(kind: DayKind, band: AgeBand): DayBlock[]')
    expect(module_).toContain('export function bandFor(ageYears: number): AgeBand')
  })
})

// =================================================================================================
// (a) THE BLOCKS THEMSELVES – inside the canvas, and never a fact the week does not contain
// =================================================================================================
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
    for (const band of populatedBands()) {
      for (const kind of ORDINARY_KINDS) {
        const blocks = [...dayBlocksFor(kind, band)].sort((a, b) => a.start - b.start)
        for (let i = 1; i < blocks.length; i++) {
          expect(
            blocks[i].start,
            `${band}/${kind}: "${blocks[i].label}" starts inside "${blocks[i - 1].label}"`,
          ).toBeGreaterThanOrEqual(blocks[i - 1].start + blocks[i - 1].span)
        }
      }
    }
  })

  // ⚠ THE ONE ARITHMETIC THE GRID COULD LIE WITH. `weekDays.ts` sells the plan as "N sessions - M on
  // court, 1 in the gym" and prints that sentence directly under this grid. A day shape with two
  // tennis blocks on it would make the picture and the sentence disagree about the same week, off
  // the same `plan.train`, on the same screen - which is precisely the class of bug the day strip
  // itself was built to close (the story card and the calendar disagreeing about Sunday).
  it('ONE session a day: the picture cannot claim more tennis than the plan bought', () => {
    const TENNIS: BlockKind[] = ['training', 'trainingAlt', 'drills', 'match', 'matchLong']
    for (const band of populatedBands()) {
      for (const kind of ORDINARY_KINDS) {
        const blocks = dayBlocksFor(kind, band)
        const tennis = blocks.filter((b) => TENNIS.includes(b.kind))
        const gym = blocks.filter((b) => b.kind === 'gym')
        expect(tennis.length + gym.length, `${band}/${kind} draws more than one session`).toBeLessThanOrEqual(1)
        // ...and the day kinds that ARE a session draw exactly one, or the grid would be quieter
        // than the week it is drawing.
        if (kind === 'court' || kind === 'match') expect(tennis.length, `${band}/${kind}`).toBe(1)
        if (kind === 'gym') expect(gym.length, `${band}/${kind}`).toBe(1)
        if (kind === 'rest') expect(tennis.length + gym.length, `${band}/rest`).toBe(0)
      }
    }
  })

  it('a whole week of blocks agrees with the plan the read-out sells', () => {
    // The same check one level up, on a real week: the number of court days in the grid IS the
    // number `calendarWeekFor` counted, at every preset.
    for (const preset of Object.values(WEEK_PLAN_PRESETS)) {
      const week = calendarWeekFor(facts({ plan: preset }), 6)
      const grid = weekGridFor(week, 14, weekDayNumbers(6))!
      expect(grid, `${preset.train}: no grid on an ordinary week`).not.toBeNull()
      const courtCols = grid.filter((d) => d.blocks.some((b) => b.kind === 'drills')).length
      const gymCols = grid.filter((d) => d.blocks.some((b) => b.kind === 'gym')).length
      expect(courtCols, `${preset.train}: court days`).toBe(week.courtDays)
      expect(gymCols, `${preset.train}: the one gym day`).toBe(gymDayIndex(sessionsForPlan(preset.train)) === null ? 0 : 1)
    }
  })

  it('a booked friendly shows up as the day\'s main event, on the day the strip marks', () => {
    const grid = gridFor({ practices: [{ week: 6, paidCents: 3000, withCoach: false }] })!
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
})

// =================================================================================================
// (b) THE BOUNDARY – which weeks may be drawn as a grid at all
// =================================================================================================
describe('the grid is drawn for the ordinary week and for nothing else', () => {
  it('an ordinary training week gets seven dated columns', () => {
    const grid = gridFor()!
    expect(grid).not.toBeNull()
    expect(grid.length).toBe(7)
    expect(grid.map((d) => d.short)).toEqual(['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'])
    // the heads are dated off the shared formatter, never re-derived here
    expect(grid.map((d) => d.date)).toEqual(weekDayNumbers(6))
  })

  it('⚠ every week another surface owns keeps the day strip – the grid returns null', () => {
    const cases: [string, ReturnType<typeof gridFor>][] = [
      ['a tournament trip', (() => {
        const e = { id: 'e1', week: 6, tier: 'local', surface: 'hard', label: 'Local Open', entered: true,
          eligible: true, cancellable: false, deadlineWeek: 5, entryFeeCents: 0, travelCostCents: 0,
          preview: { firstMatchChance: 0.5, opponentName: 'M', fieldStrength: 'even', temperatureC: 20, crowd: 40 } }
        return gridFor({
          upcoming: [e as never],
          arrival: { eventId: 'e1', tier: 'local', week: 6, verdict: 'play', outgrown: false },
        })
      })()],
      ['a family week', gridFor({ vacations: [{ week: 6, packageId: 'seaside', paidCents: 40000 }] })],
      ['a layoff', gridFor({ injury: { kind: 'ankle', severity: 'minor', weeksRemaining: 3, totalWeeks: 4 } })],
      ['the off-season', (() => {
        const w = WEEKS_PER_YEAR - OFF_SEASON_WEEKS
        return weekGridFor(calendarWeekFor(facts({ week: w - 1 }), w), 14, weekDayNumbers(w))
      })()],
      ['an exam block', (() => {
        const w = ECONOMY.availability.examWeeks[0][0]
        return weekGridFor(calendarWeekFor(facts({ week: w - 1 }), w), 14, weekDayNumbers(w))
      })()],
    ]
    for (const [what, grid] of cases) expect(grid, `${what} drew a grid of hours`).toBeNull()
  })

  it('a rested knock is still an ordinary week – she is at home, not away', () => {
    // The boundary is about weeks ANOTHER SURFACE owns, not about weeks with bad news in them. A
    // knock leaves her at home on a week of rest days, which is a shape the grid can draw honestly.
    const grid = gridFor({ knock: { part: 'ankle', sinceWeek: 5, repeat: false, choice: 'rest', untilWeek: 6 } })
    expect(grid).not.toBeNull()
    expect(grid!.every((d) => d.blocks.every((b) => b.kind !== 'drills'))).toBe(true)
  })

  it('the four ordinary kinds are exactly the ones `weekDays.ts` mixes', () => {
    for (const kind of ['court', 'gym', 'rest', 'match'] as const) expect(isOrdinaryKind(kind)).toBe(true)
    for (const kind of ['away', 'off', 'school', 'rehab'] as const) expect(isOrdinaryKind(kind)).toBe(false)
    expect(isOrdinaryWeek([])).toBe(false) // never a grid over nothing
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
  it('the grid is the ordinary week\'s drawing and the day strip is every other week\'s', () => {
    const template = screen.slice(screen.indexOf('<template>'), screen.lastIndexOf('</template>'))
    expect(template).toContain('<div v-if="grid" class="cal-time">')
    expect(template).toContain('v-else\n          class="cal-grid"')
    // one composable answers "may this week be a grid", and the screen does not re-derive it
    expect(screen).toContain('weekGridFor(week, snap.ageYears, weekDayNumbers(week.week))')
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
    const KINDS: BlockKind[] = [
      'training', 'trainingAlt', 'gym', 'school', 'schoolLong', 'drills',
      'match', 'matchLong', 'study', 'travel', 'rest', 'tournament',
    ]
    for (const kind of KINDS) {
      const rule = screen.match(new RegExp(`\\.cal-block--${kind}\\s*\\{([^}]*)\\}`))
      expect(rule, `no colour rule for a ${kind} block`).not.toBeNull()
      const token = rule![1].match(/var\((--event-[a-z-]+)\)/)
      expect(token, `the ${kind} block is not painted from the event palette`).not.toBeNull()
      expect(sheet, `${token![1]} is not on :root`).toContain(`${token![1]}:`)
    }
    // ...and the outlined one is the only one with a stroke, which is what the thirteenth token is
    expect(screen).toContain('border: var(--stroke-hair) solid var(--event-tournament-border)')
  })

  it('the sweep still crosses the week out, on whichever drawing is up', () => {
    // The crossing-out animation is shipped behaviour and the grid replaces a DRAWING, not the
    // screen's logic. Both drawings answer the same two pieces of state.
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
