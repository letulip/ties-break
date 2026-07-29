import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { ECONOMY } from '../src/engine/economy'
import { flipScore, isExamWeek } from '../src/engine/world'
import { WEEKS_PER_YEAR } from '../src/engine/season/calendar'

// ---------------------------------------------------------------------------
// Round 12, wave B — PRESENTATION ONLY. No engine file is touched by any of these items;
// every one of them reads facts the Snapshot already carries.
// FILE NAME: round12-VIEW.test.ts, never round12.test.ts – wave A owns that name on its own
// branch, and rounds 10 AND 11 both hit the add/add collision before the split was adopted.
//
//   R12-1/14  exam weeks SAY exams: the green off-season treatment, the row label "Exams",
//             and the event card names the block instead of silently losing "+ Plan week".
//   R12-8b    a small red "injury" chip on every calendar card the layoff covers, and the
//             planner sheet's Vacation tab renders the layoff refusal instead of throwing it.
//   R12-12    the this-week tournament plaque carries its SCORE on its own line.
//
// The file-reading tests are deliberate: these are facts about a TEMPLATE or a STYLESHEET,
// and those are exactly the facts that silently rot. Same discipline as round10/round11-view.
// ---------------------------------------------------------------------------

const seasonScreen = readFileSync(new URL('../src/components/screens/SeasonScreen.vue', import.meta.url), 'utf8')
const planSheet = readFileSync(new URL('../src/components/PlanWeekSheet.vue', import.meta.url), 'utf8')
const worldSrc = readFileSync(new URL('../src/engine/world.ts', import.meta.url), 'utf8')
const css = readFileSync(new URL('../src/style.css', import.meta.url), 'utf8')

/** The body of a CSS rule, by selector (every occurrence – the round-10 lesson). */
function cssBodies(selector: string): string[] {
  const out: string[] = []
  for (let from = 0; ; ) {
    const i = css.indexOf(`${selector} {`, from)
    if (i < 0) return out
    out.push(css.slice(i, css.indexOf('}', i)))
    from = i + 1
  }
}

/** A template/script slice between two unique markers – asserts both exist so a moved block
 *  fails HERE instead of silently producing an empty string (the round-10 lying-test trap). */
function slice(src: string, from: string, to: string): string {
  const i = src.indexOf(from)
  const j = src.indexOf(to, i)
  expect(i, `marker not found: ${from}`).toBeGreaterThanOrEqual(0)
  expect(j, `marker not found: ${to}`).toBeGreaterThan(i)
  return src.slice(i, j)
}

// ===========================================================================
// R12-1/14 — exam weeks must SAY exams.
// ===========================================================================
describe('R12-1/14 — exam weeks say "Exams", in green, and the event card says why', () => {
  it('THE WEEKS THE LABEL LEANS ON: exams are weeks 23-24 of every season year', () => {
    expect(ECONOMY.availability.examWeeks).toEqual([[23, 24]])
    for (const year of [0, 1, 2]) {
      expect(isExamWeek(year * WEEKS_PER_YEAR + 23)).toBe(true)
      expect(isExamWeek(year * WEEKS_PER_YEAR + 24)).toBe(true)
      expect(isExamWeek(year * WEEKS_PER_YEAR + 22)).toBe(false)
      expect(isExamWeek(year * WEEKS_PER_YEAR + 25)).toBe(false)
    }
  })

  it('the week card is titled "Exams" – the owner\'s word, not the old "School exams"', () => {
    // ⚠ RE-AIMED by wave 2 (28.07): the one-line row became a card, so the label lives in
    // `weekTitle` rather than inline in the template. The WORD is the fact R12-1/14 pinned.
    expect(seasonScreen).toContain("row.kind === 'exam' ? 'Exams'")
    expect(seasonScreen).not.toContain('School exams')
    expect(seasonScreen).toContain('{{ weekTitle(row) }}')
  })

  it('an exam week is AFFIRMED, never dimmed – the rule survives its row becoming a card', () => {
    // ⚠ RE-AIMED by wave 2. R12-1/14 gave exams the off-season's green frame so the week stopped
    // looking like a rendering accident. Wave 2 gave the OFF-SEASON a painting - a frozen lake at
    // sunset says "family week" better than a border ever did - so the pair no longer share a rule.
    // What R12-1/14 was actually protecting is unchanged and still pinned: the exam week is stated
    // in the accent colour, not greyed out.
    const exam = cssBodies('.week-card.exam')
    expect(exam.length).toBe(1)
    expect(exam[0]).toContain('border-color: var(--accent)')
    expect(exam[0]).toContain('background: rgba(217, 242, 79, 0.04)')
    expect(exam[0]).not.toContain('opacity')
    expect(exam[0]).not.toContain('var(--line)')
    // ...and the off-season says it with art instead, which is why it needs no frame.
    expect(cssBodies('.calendar-row-muted.off-season')).toEqual([])
    expect(seasonScreen).toContain('weekArtUrl(row.week)')
  })

  it('exam weeks stay nobody\'s to plan – the flag rode into CalendarRow, the rule did not move', () => {
    const rows = slice(seasonScreen, 'const calendarRows', 'function packageLabel')
    expect(rows).toContain('!exam &&') // plannable still excludes the exam block
    expect(rows).toContain('exam,') // ...and the row now CARRIES the fact for the template
  })

  it('the event card fills the silent "+ Plan week" hole with the reason', () => {
    // The pill sits exactly where the button would have been: a v-else-if on the same slot.
    const controls = slice(seasonScreen, '<button v-if="row.plannable"', '<!-- A PLANNED week')
    expect(controls).toContain('v-else-if="examReasonShows(row)"')
    expect(controls).toContain('Exams this week')
  })

  it('the reason never prints twice: the unavailable-lock card is the one that already says it', () => {
    // lockLabel words the unavailable (non-vacation) lock as "Exams this week"...
    const lock = slice(seasonScreen, 'function lockLabel', 'function examReasonShows')
    expect(lock).toContain("'Exams this week'")
    expect(lock).not.toContain('School exams')
    // ...and examReasonShows stands down exactly when that pill renders.
    const gate = slice(seasonScreen, 'function examReasonShows', '// --- R11-5a')
    expect(gate).toContain("e.ineligibleReason === 'unavailable'")
    expect(gate).toContain('!entriesClosed(e)') // an entries-closed exam card must still say it
  })
})

// ===========================================================================
// R12-8b — the layoff is visible on week plaques, and the sheet's refusal is legible.
// ===========================================================================
describe('R12-8b — a red "injury" chip on every card the layoff covers', () => {
  it('EVERY calendar card kind carries the chip: event, vacation (both renderings), practice, muted', () => {
    // ⚠ RE-AIMED 4 -> 5 (29.07, the vacation cards). The protected fact has not moved: every card
    // kind the layoff can cover must wear the chip. What changed is that a booked family week now
    // has TWO renderings - the painted card, and the plain row it falls back to for a package with
    // no art yet - and BOTH have to carry it, which is precisely why the count went up rather than
    // across. If this fires again, count the card kinds in the template and re-aim; do not delete.
    const chip = 'class="pill avail-chip red" :title="layoffNote">injury</span>'
    expect(seasonScreen.split(chip).length - 1).toBe(5)
    // each is gated on the row's own layoff read, never on "is she hurt right now"
    expect(seasonScreen.split('v-if="row.injured"').length - 1).toBe(5)
  })

  it('the chip is the availability-chip idiom: 6px, not the capsule, not a circle', () => {
    const rule = cssBodies('.avail-chip')[0]
    expect(rule).toContain('border-radius: 6px')
    expect(rule).not.toContain('50%')
  })

  it('THE WINDOW IS EXCLUSIVE of the return week, in both consumers', () => {
    // She is back at the TOP of week `week + weeksRemaining`. The sheet no longer mirrors the
    // inequality by hand - the R12-5b seam replaced the copy with the engine's own `layoffBlock`
    // (one comparison, `layoffCoversWeek`, for the sheet, the throw and the tournament lock).
    // SeasonScreen still mirrors it on snapshot facts; the sheet is pinned to the shared predicate.
    expect(seasonScreen).toContain('w < s.week + s.injury.weeksRemaining')
    expect(planSheet).toContain('layoffBlock({ currentWeek:')
    expect(planSheet).not.toMatch(/props\.week < s\.week \+ s\.injury\.weeksRemaining/)
  })

  it('the chip explains itself with the tournament lock\'s own words', () => {
    // round-12 follow-up: both sites route through weekLabel() – the pin moved with the wording
    // (it existed to keep the two surfaces IDENTICAL, and that property is what it still asserts).
    expect(seasonScreen).toContain('`Injured – back ${weekLabel(s.week + s.injury.weeksRemaining)}`')
    expect(planSheet).toContain('`Injured – back ${weekLabel(s.week + s.injury.weeksRemaining)}.`')
  })

  it('the Vacation tab renders the layoff refusal instead of throwing it', () => {
    // the tab's own closing tag sits at 6-space indent; the pkg-effect's inner
    // </template> is inline, so this cut takes the WHOLE tab, pkg-actions included
    const vacation = slice(planSheet, '<!-- ---------------- Vacation', '\n      </template>')
    expect(vacation).toContain('v-if="layoff"')
    expect(vacation).toContain('{{ layoffNote }}')
    // Book disables WITH the reason on screen – the R10-16 doctrine, not a dead control
    expect(vacation).toContain(':disabled="!!layoff || !row.affordable || game.busy"')
    // ...and "Out of reach" stands down while the layoff is the real blocker
    expect(vacation).toContain('v-if="!layoff && !row.affordable"')
  })

  it('the practice tab IS wired now - the R12-5b seam landed (this pin used to assert the opposite)', () => {
    const practice = slice(planSheet, "<template v-if=\"tab === 'practice'\">", '<!-- ---------------- Vacation')
    // layoff outranks the doctor (availabilityStatus order: injured > medical), one hard block at
    // a time, and the button is disabled WITH the reason - never a throwing click.
    expect(practice).toContain('v-if="layoff"')
    expect(practice).toContain(':disabled="!!layoff || !!medical')
    expect(practice).toMatch(/layoff \? 'Injured'/)
  })
})

// ===========================================================================
// R12-12 — the score gets its own line on the this-week tournament plaque.
// ===========================================================================
describe('R12-12 — the tournament plaque is two lines: sentence, then score', () => {
  const plaque = () => slice(seasonScreen, "<h2>This week's tournament</h2>", '</section>')

  it('the row stacks title and score; the score line only exists when a scoreline does', () => {
    const row = plaque()
    expect(row).toContain('class="bracket-lines"')
    expect(row).toContain('{{ plaqueLines(m).title }}')
    expect(row).toContain('v-if="plaqueLines(m).score"')
    expect(row).toContain('class="bracket-score">{{ plaqueLines(m).score }}')
    // the raw run-on sentence is gone from the plaque
    expect(row).not.toContain('<span>{{ m.text }}</span>')
  })

  it('the stack is a column and owns the flexible width (the watch button cannot refold it)', () => {
    const lines = cssBodies('.bracket-lines')[0]
    expect(lines).toContain('flex-direction: column')
    expect(lines).toContain('flex: 1')
    expect(cssBodies('.bracket-score').length).toBe(1)
  })

  it('the score comes off the RECORD, kid-perspective, never re-parsed from the sentence', () => {
    const split = slice(seasonScreen, 'function plaqueLines', '// R10-15')
    expect(split).toContain('m.bId === KID_ID ? flipScore(m.score)')
    // and the graceful floor: no stored scoreline (or a reworded sentence) = one line, as before
    expect(split).toContain('e.text.endsWith(score)')
  })

  it('THE FACT THE SPLIT LEANS ON: the engine sentence ends with the kid-perspective score', () => {
    // kidMatchEvent builds "<stage>: <kid> beat|lost to <opp> <kidScore>". If that sentence is ever
    // reworded so the score stops being the trailing token, the plaque silently degrades to one
    // line – this failure names the dependency instead.
    expect(worldSrc).toContain("${formatShortName(oppName)} ${kidScore ?? ''}`.trim()")
    expect(flipScore('2-6 6-4 1-6')).toBe('6-2 4-6 6-1')
    expect(flipScore('6-4')).toBe('4-6')
  })
})

// ===========================================================================
// Player copy – every string this wave added: short dash only, no Cyrillic.
// ===========================================================================
describe('round-12 wave B player copy', () => {
  it('no long dash, no Cyrillic in the strings this wave ships', () => {
    for (const s of [
      'Exams',
      'Exams this week',
      'injury',
      `Injured – back W23 '32`,
      'The layoff covers this week, so a family trip cannot be booked – the planner frees up once she is back.',
    ]) {
      expect(s).not.toMatch(/[—А-Яа-яЁё]/)
    }
    // and the two edited templates carry none anywhere in their player-facing additions
    for (const src of [seasonScreen, planSheet]) {
      expect(src).not.toContain('—')
    }
  })
})
