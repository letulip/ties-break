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
import { FRIDGE_NOTES, fridgeNoteFor } from '../src/composables/fridgeNote'
import { calendarWeekFor, gymDayIndex, sessionsForPlan, type CalendarWeekFacts } from '../src/composables/weekDays'
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

  // ⚠ CAUGHT IN THE BROWSER AT 375, not reasoned about: the grid drew "School" on a SATURDAY. The
  // shape table is keyed by day KIND, which is the right key for everything she chooses to do and
  // the wrong one for the single piece of furniture that is a fact about the DATE - and at the
  // grind preset Saturday is an ordinary court day (rest is claimed Sunday first, then midweek).
  it('⚠ SHE IS NOT AT SCHOOL AT THE WEEKEND, whatever the plan makes of those days', () => {
    for (const preset of Object.values(WEEK_PLAN_PRESETS)) {
      const grid = weekGridFor(calendarWeekFor(facts({ plan: preset }), 6), 14, weekDayNumbers(6))!
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
  })

  it('the weekday rule only ever REMOVES – it cannot invent an hour', () => {
    // The direction is the whole argument for putting it in the composer rather than in the table:
    // the table stays the one place a day's shape is decided, and the weekend can only decline to
    // assert something, never add to it.
    const grid = weekGridFor(calendarWeekFor(facts(), 6), 14, weekDayNumbers(6))!
    for (const day of grid) {
      const shape = dayBlocksFor(day.kind, 'school')
      expect(day.blocks.length, `${day.short}`).toBeLessThanOrEqual(shape.length)
      for (const block of day.blocks) {
        expect(shape, `${day.short} grew a block the table does not have`).toContainEqual(block)
      }
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
    const KINDS: BlockKind[] = [
      'training', 'trainingAlt', 'gym', 'school', 'schoolLong', 'drills',
      'match', 'matchLong', 'study', 'travel', 'rest', 'tournament',
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
  it('⚠ THE ONE CONSTRAINT: nothing in the pool is about tennis, a result, a trip, her body or money', () => {
    // Expressed as a vocabulary sweep because it CAN be - that is the whole reason the constraint is
    // a rule about content rather than a machine. A line that cannot say "match" cannot claim she
    // played one, whatever week it lands on.
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
  })

  it('player copy: short dash only, no Cyrillic, and short enough to be a scrap', () => {
    for (const line of FRIDGE_NOTES) {
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
    // A note beside a day strip would be a note on a week she is away for. And if the two read
    // different weeks, the paper and the picture next to it would be about different sevens of days.
    expect(screen).toContain('<PaperNote v-if="grid" class="cal-note"')
    expect(screen).toContain('fridgeNoteFor(snap.seed, week.week)')
    // the design's own object: taped, torn, ruled, tilted off one of its own angles
    expect(screen).toContain(':tilt="-0.8" ruled torn tape')
  })
})
