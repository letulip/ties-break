import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync } from 'node:fs'
import { componentLogic } from './worldSource'
import { WEEKS_IN_SEASON, weekLabel, weekRange, weekYear } from '../src/shared/dates'
// The OLD continuous calendar, frozen in migrations.ts because the shipped v16 back-fill inverts it.
// Read here so the collision pin below can still state the defect it was written for – see its note.
import { legacyWeekYear } from '../src/engine/migrations'
import { WEEKS_PER_YEAR, OFF_SEASON_WEEKS, isOffSeasonWeek } from '../src/engine/season/calendar'

// ---------------------------------------------------------------------------
// R11-6 — week numbering resets with the season.
// Owner: «с нового года нумерацию недели надо обновлять, это нормально, не надо их насквозь
// считать.» The player was reading W53, W87, W120 because the engine counts weeks from the
// career's start and nothing ever resets.
//
// DISPLAY ONLY. The absolute index stays exactly where it is: every RNG sub-stream key
// (`seed:injury:87`), every pinned capture, the save format and the whole bench are keyed on it.
// Nothing in this round adds or moves a draw.
//
// Two halves, and the second is the load-bearing one:
//   1. the formatter's own arithmetic, pinned at the boundaries where an off-by-one lives;
//   2. a SOURCE-LEVEL guard (tests/round10.test.ts style) that no surface hand-rolls `W${week}`
//      any more. There was no shared formatter before this item — each screen invented its own —
//      so without the guard the next screen simply re-introduces the bug.
// ---------------------------------------------------------------------------

describe('weekLabel – the shared week formatter', () => {
  it('week 0 is the first week of the first season, not "W0"', () => {
    // 1-based, because no player counts "week zero" – and the engine's own first week IS her first.
    expect(weekLabel(0)).toBe("W1 '31")
  })

  it('counts up inside a season', () => {
    expect(weekLabel(1)).toBe("W2 '31")
    expect(weekLabel(13)).toBe("W14 '31")
  })

  it('week 51 is the LAST week of season 2031', () => {
    expect(weekLabel(51)).toBe("W52 '31")
  })

  it('week 52 RESETS: it is W1 of the next season, not W53', () => {
    // The item, in one assertion.
    expect(weekLabel(52)).toBe("W1 '32")
  })

  it('week 103/104 does it again a season later', () => {
    expect(weekLabel(103)).toBe("W52 '32")
    expect(weekLabel(104)).toBe("W1 '33")
  })

  it('the off-season reads as the last three weeks of the season, never as W1-W3 of the next', () => {
    // The engine's off-season is offsets 49-51; displayed 1-based that is W50-W52.
    expect(weekLabel(49)).toBe("W50 '31")
    expect(weekLabel(50)).toBe("W51 '31")
    expect(weekLabel(51)).toBe("W52 '31")
    for (const w of [49, 50, 51, 101, 102, 103]) expect(isOffSeasonWeek(w)).toBe(true)
    expect(isOffSeasonWeek(52)).toBe(false)
  })

  it('the season boundary is a clean 51 -> 52 hand-off (both halves change together)', () => {
    expect(weekLabel(51)).toBe("W52 '31")
    expect(weekLabel(52)).toBe("W1 '32")
    // ...and the real date range agrees that this is the turn of the year.
    expect(weekRange(51)).toBe('Dec 29, 2031 – Jan 4, 2032')
    expect(weekRange(52)).toBe('Jan 5–11, 2032')
  })

  it('never emits an in-season week outside 1..52, over ten seasons', () => {
    for (let w = 0; w < 10 * WEEKS_IN_SEASON; w++) {
      const n = Number(/^W(\d+) /.exec(weekLabel(w))![1])
      expect(n).toBeGreaterThanOrEqual(1)
      expect(n).toBeLessThanOrEqual(WEEKS_IN_SEASON)
    }
  })

  it('is total: a negative week (an entry deadline before the career started) still formats', () => {
    expect(weekLabel(-1)).toBe("W52 '30")
    expect(weekLabel(-52)).toBe("W1 '30")
  })

  it('obeys the player-copy rules: no em dash, no Cyrillic', () => {
    for (let w = 0; w < 300; w++) {
      expect(weekLabel(w)).not.toMatch(/—/)
      expect(weekLabel(w)).not.toMatch(/[Ѐ-ӿ]/)
    }
  })

  it('stays short – the status pill is 30px tall and carries funds beside it', () => {
    for (let w = 0; w < 10 * WEEKS_IN_SEASON; w++) expect(weekLabel(w).length).toBeLessThanOrEqual(8)
  })

  it('its season length IS the engine\'s season length', () => {
    // dates.ts is deliberately engine-free (world.ts imports IT), so the constant is restated
    // there. This is the pin that keeps the restatement honest.
    expect(WEEKS_IN_SEASON).toBe(WEEKS_PER_YEAR)
    expect(OFF_SEASON_WEEKS).toBe(3)
  })
})

describe('weekLabel – the season year is the SEASON INDEX, not weekYear()', () => {
  it('agrees with weekYear for the seasons where they agree', () => {
    for (const season of [0, 1, 2, 3, 4]) {
      const firstWeek = season * WEEKS_IN_SEASON
      expect(weekLabel(firstWeek)).toBe(`W1 '${String((weekYear(firstWeek) % 100)).padStart(2, '0')}`)
    }
  })

  // ⚠ RE-AIMED BY THE SEASON RE-ANCHOR (wave/flags-grant). This asserted that the LIVE `weekYear`
  // diverges from the label at season 5. It no longer can: `shared/dates.ts` anchors each season to
  // the first Monday of its own year, so the ~1.24-day-a-season slide that produced the divergence
  // is gone and `weekYear(week) === seasonYear(floor(week / 52))` identically.
  //
  // NOT DELETED, AND NOT WEAKENED. The claim it was making has two halves and only one of them was
  // about the drift. The divergence is now stated against `legacyWeekYear` – the historical calendar
  // frozen in migrations.ts, which the shipped v16 back-fill still has to invert – so the reason the
  // label was built on the index survives; and the OUTPUT assertions are untouched, because what the
  // player reads must not move whatever the calendar underneath is doing.
  //
  // Blast radius measured on the owner's seven real saves before shipping: no rung opening week
  // moved, no season gained or lost a birthday. tools/season-anchor-read.ts, docs/specs/season-anchor.md.
  it('DIVERGED from weekYear at season 5 – and that divergence is why the label reads the index', () => {
    // A season is exactly 52 weeks = 364 days, so under the OLD continuous calendar a season's
    // opening Monday walked ~1.25 days earlier every year and stepped back over New Year at season
    // 5: seasons 4 and 5 BOTH started in a week whose Monday fell in 2035 (Jan 1 and Dec 31, 2035).
    expect(legacyWeekYear(4 * WEEKS_IN_SEASON)).toBe(2035)
    expect(legacyWeekYear(5 * WEEKS_IN_SEASON)).toBe(2035)
    // A label built on that would have printed two consecutive seasons as '35 and the player could
    // not tell them apart – the one thing this label exists to do. The season index cannot drift.
    expect(weekLabel(4 * WEEKS_IN_SEASON)).toBe("W1 '35")
    expect(weekLabel(5 * WEEKS_IN_SEASON)).toBe("W1 '36")
    // ...and the shipped calendar now agrees with the label instead of fighting it, which is the
    // belt beside those braces rather than a replacement for them.
    expect(weekYear(4 * WEEKS_IN_SEASON)).toBe(2035)
    expect(weekYear(5 * WEEKS_IN_SEASON)).toBe(2036)
  })

  it('never labels two different seasons the same, over a 15-season career', () => {
    const seen = new Set<string>()
    for (let s = 0; s < 15; s++) {
      const label = weekLabel(s * WEEKS_IN_SEASON)
      expect(seen.has(label)).toBe(false)
      seen.add(label)
    }
  })
})

// ---------------------------------------------------------------------------
// The guard. Every player-facing week goes through weekLabel(); nothing builds a label by hand.
// ---------------------------------------------------------------------------

const SRC = new URL('../src/', import.meta.url)

/** Every view-layer source file: templates, composables and the store.
 *
 *  `engine` / `worker` / `viz` are skipped because they THINK in absolute weeks and must keep doing
 *  so – every RNG sub-stream key, save field and pinned capture is on that index. But the engine
 *  also WRITES strings a player reads, and those went unswept for a whole round (the ledger printed
 *  "Entry fee: Local Open (W57)" under a "W3 '32" header). That half of the guard now lives in
 *  tests/world-trio.test.ts, item 2 – the two together cover src/ with no gap. */
function viewFiles(dir = SRC, prefix = ''): string[] {
  const out: string[] = []
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'engine' || entry.name === 'worker' || entry.name === 'viz') continue
    const rel = `${prefix}${entry.name}`
    if (entry.isDirectory()) out.push(...viewFiles(new URL(`${entry.name}/`, dir), `${rel}/`))
    else if (entry.name.endsWith('.vue') || entry.name.endsWith('.ts')) out.push(rel)
  }
  return out
}

/** dates.ts is where the label is BUILT – it is the one file allowed to write `W${...}`. */
const FORMATTER = 'shared/dates.ts'
const FILES = viewFiles()
const CONSUMERS = FILES.filter((f) => f !== FORMATTER)
const read = (rel: string): string => readFileSync(new URL(rel, SRC), 'utf8')

/** The files that actually print a week. Listed, so a screen that STOPS printing one is noticed
 *  too – this list and the guard below have to stay true together. */
const WEEK_PRINTING_FILES = [
  // ⚠ App.vue LEFT this list in A2 (28.07): the shell's header was its only week-printing surface,
  // and the header is gone. It routes now and prints nothing – so requiring the import would pin a
  // dead import rather than a live rule. Home took the job (see the date-line test below).
  'components/CountingResultsTable.vue',
  'components/InjuryStopDialog.vue',
  'components/PlanWeekSheet.vue',
  'components/PracticeFlow.vue',
  'components/WeekRecapCard.vue',
  // The calendar (screen H) prints a week in three places: its header's date line, the week label on
  // every look-ahead row, and the entry deadline on the one event a marker opens. Added to this list
  // when the screen landed – a screen that dates seven weeks in a column is exactly the surface a raw
  // absolute week would be most visible on.
  'components/screens/CalendarScreen.vue',
  'components/screens/HomeScreen.vue',
  'components/screens/MoneyScreen.vue',
  'components/screens/MoreScreen.vue',
  'components/screens/SeasonScreen.vue',
  // R13-12: the This-week tab prints the week range and the entered event's week.
  'components/screens/ThisWeekScreen.vue',
]

/** Interpolations that mention a week but do NOT print one. Explicit, with the reason. */
const NOT_A_WEEK_LABEL = [
  // MoreScreen career row: this prints her AGE. The week is arithmetic, never shown.
  '14 + Math.floor(c.week / 52)',
  // SeasonScreen entry pill: the weeks are COMPARED, the output is the word "Closed"/"closes"
  // (the deadline week itself is printed right after it, formatted).
  // ⚠ RE-AIMED BY ROUND 34 #14: the card's markup is a `v-for` over `row.events` now, so the event
  // is the loop's `ev`. The exemption is the same one for the same reason – nothing is PRINTED here.
  "week > ev.deadlineWeek ? 'Closed' : 'closes'",
]

describe('R11-6 guard – no surface prints a raw absolute week', () => {
  it('the formatter is defined exactly once, in shared/dates.ts', () => {
    const definitions = FILES.filter((f) => /export function weekLabel\b/.test(read(f)))
    expect(definitions).toEqual(['shared/dates.ts'])
  })

  it('no view file hand-rolls a "W<week>" label', () => {
    // `W${...}` in a script string, `W{{ ... }}` in a template, the spelled-out "week {{ ... }}",
    // AND `wk ${...}` – the fourth shape slipped through the original sweep unseen: the injury
    // surfaces wrote "back wk 70" and this guard's three patterns matched none of them, so the
    // owner met a raw absolute week in his very next playtest (round 12). A guard that enumerates
    // spellings is only as good as its enumeration – hence the widest net that stays cheap.
    const offenders = CONSUMERS.filter((f) => /W\$\{|W\{\{|\bweek \{\{|\bwk \$\{|\bwk \{\{/.test(read(f)))
    expect(offenders).toEqual([])
  })

  it('every interpolation that prints a week goes through weekLabel()', () => {
    const offenders: string[] = []
    for (const f of CONSUMERS) {
      for (const m of read(f).matchAll(/\{\{([^}]*)\}\}/g)) {
        const expr = m[1].trim()
        // Quoted copy ("Training week") is text, not a value – only the CODE is inspected.
        const code = expr.replace(/'[^']*'|"[^"]*"/g, "''")
        if (!/\bweek\b/.test(code)) continue // weeksInjured / totalWeeks / UPCOMING_WEEKS are not weeks
        // `weekOnly()` and `seasonWeekRange()` are BUILT on weekLabel / on the shared formatter and
        // live in the same place; they exist because a card that already prints the year must not
        // print it twice. They are the formatter, sliced - not a second spelling of it.
        //
        // ⚠⚠ ROUND 34 #19 ADDED `monthLabel(` TO THIS LIST, AND IT IS THE SAME ARGUMENT, NOT A
        // LOOSENING. The owner asked for a chart of the fund's unit price «с возможностью выбрать
        // промежуток», and its time axis names the MONTH a point falls in. `monthLabel` is declared
        // in shared/dates.ts beside `weekLabel`, reads the same `weekStart`, and prints «Jan '31» –
        // a formatted date, never an absolute week. What this guard exists to stop is a surface
        // printing the raw integer (the owner met «back wk 70» in a playtest); a sixth entry in a
        // list of shared formatters is exactly what the list is for, and the guard is unchanged for
        // every OTHER spelling – a `{{ row.week }}` on the same line would still be caught.
        if (
          expr.includes('weekLabel(') ||
          expr.includes('weekDates') ||
          expr.includes('weekRange(') ||
          expr.includes('weekOnly(') ||
          expr.includes('monthLabel(') ||
          expr.includes('seasonWeekRange(')
        ) {
          continue
        }
        if (NOT_A_WEEK_LABEL.includes(expr)) continue
        offenders.push(`${f}: {{ ${expr} }}`)
      }
    }
    expect(offenders).toEqual([])
  })

  it('every file that prints a week imports the shared formatter', () => {
    for (const f of WEEK_PRINTING_FILES) {
      expect({ file: f, importsIt: /import \{[^}]*\bweekLabel\b[^}]*\} from/.test(read(f)) }).toEqual({
        file: f,
        importsIt: true,
      })
    }
  })

  it('the date line – the week the player sees on Home – is formatted, and nothing hand-rolls it', () => {
    // ⚠ RE-AIMED by A2 (28.07): the app header's W/$ pill is gone, and with it the last surface
    // that dated the career in chrome. Home's hero line took the job, and it says MORE than the
    // pill did – the week number, the year in full and the week's real days – all from
    // shared/dates.ts. The guard that matters is unchanged: no screen spells a week itself.
    // ⚠ RE-AIMED BY P2-3/P2-6 (05.09), not weakened: the date the player reads is drawn twice now –
    // on the photograph and, from 1024, beside her face in the rail – so the call that formats it
    // moved into src/composables/kidIdentity.ts, which HomeScreen imports. `componentLogic` is the
    // SFC plus its composables, which is what a POSITIVE claim about a surface's logic must read if
    // it is to survive an extraction. The guard is unchanged: nothing hand-rolls a week.
    const home = componentLogic('components/screens/HomeScreen.vue')
    expect(home).toContain('weekDateLine(week.value)')
    expect(read('App.vue')).not.toContain('weekLabel(week)')
  })

  it('the news feed groups under a formatted week', () => {
    expect(read('components/screens/HomeScreen.vue')).toMatch(
      /class="news-week-label">\{\{ weekLabel\(group\.week\) \}\}/,
    )
  })

  it('the money ledger groups under a formatted week', () => {
    expect(read('components/screens/MoneyScreen.vue')).toMatch(
      /class="ledger-week-label">\{\{ weekLabel\(group\.week\) \}\}/,
    )
  })

  it('the best-6 table dates every counting result – two seasons share the 52-week window', () => {
    // Without the year, a result from W12 last season and one from W12 this season read alike.
    expect(read('components/CountingResultsTable.vue')).toMatch(/\{\{ weekLabel\(c\.week\) \}\}/)
  })
})
