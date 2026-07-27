import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { TIERS, TIER_LADDER } from '../src/engine/season/calendar'
import { surfaceStyleAffinity, surfaceStyleHint, SURFACE_STYLE_DELTAS } from '../src/engine/match/style'
import { HORIZON_WEEKS, isTierOpen, pointsLockNote, tierState, type TierStateInput } from '../src/composables/tierState'
import { resultShowsOnHerFace } from '../src/composables/kidEmotion'
import type { PlayStyle, WorldEvent, WorldMatch } from '../src/shared/protocol'
import type { Surface } from '../src/engine/match/types'
import type { TierId } from '../src/engine/season/types'

// ---------------------------------------------------------------------------
// Round 11, wave C — PRESENTATION ONLY. No engine file is touched by any of these
// FILE NAME: this lives in round11-VIEW.test.ts, not round11.test.ts, because wave A created a
// file of that name on its own branch in parallel and the two collided add/add at integration —
// the exact conflict round 10 hit before it (round10.test.ts / round10-view.test.ts). Same split,
// same reason: correctness tests in round11.test.ts, presentation tests here.
// items; every one of them reads data the Snapshot already carries.
//
//   R11-15  the surface PILL comes back to the calendar card corner (this REVERTS
//           R10-11's ringed dot), with the surface name inside the pill and only
//           the fit verdict underneath it.
//   R11-2   a PRACTICE match must not swap the win/loss avatar. Tournaments do; a
//           friendly at the club does not.
//   R11-14  "Practice match + coach" on ONE line in the calendar.
//   R11-5a  "locked – needs N pts" told apart from "unlocked, nothing scheduled".
//
// The file-reading tests are deliberate: three of these four items are facts about a
// TEMPLATE or a STYLESHEET, and those are exactly the facts that silently rot. Same
// discipline as tests/round10.test.ts.
// ---------------------------------------------------------------------------

const seasonScreen = readFileSync(new URL('../src/components/screens/SeasonScreen.vue', import.meta.url), 'utf8')
const homeScreen = readFileSync(new URL('../src/components/screens/HomeScreen.vue', import.meta.url), 'utf8')
const kidEmotionSrc = readFileSync(new URL('../src/composables/kidEmotion.ts', import.meta.url), 'utf8')
const css = readFileSync(new URL('../src/style.css', import.meta.url), 'utf8')

/** The body of a CSS rule, by selector (every occurrence – see the round-10 lesson). */
function cssBodies(selector: string): string[] {
  const out: string[] = []
  for (let from = 0; ; ) {
    const i = css.indexOf(`${selector} {`, from)
    if (i < 0) return out
    out.push(css.slice(i, css.indexOf('}', i)))
    from = i + 1
  }
}

const STYLES = Object.keys(SURFACE_STYLE_DELTAS) as PlayStyle[]
const SURFACES: Surface[] = ['hard', 'clay', 'grass']

/** The `.event-card-top` block of the calendar card. Sliced forward from the opening tag – a plain
 *  `indexOf('<div class="controls"')` finds the RESCUE card's controls, which sit ABOVE this one and
 *  silently produce an empty string (the round-10 "the test lies about a passing file" trap). */
function eventCardTop(): string {
  const from = seasonScreen.indexOf('<div class="event-card-top">')
  expect(from).toBeGreaterThan(0)
  return seasonScreen.slice(from, seasonScreen.indexOf('<div class="controls"', from))
}

// ===========================================================================
// R11-15 — the pill is back, and the surface name is printed EXACTLY ONCE.
// ===========================================================================
describe('R11-15 — the surface pill returns to the card corner (reverts R10-11)', () => {
  it('the event card renders a PILL carrying the surface name, not a ringed dot', () => {
    const card = eventCardTop()
    expect(card).toContain('class="pill surface-pill"')
    expect(card).toContain('{{ row.event.surface }}') // the NAME lives inside the pill
    expect(card).not.toContain('surface-dot') // the R10-11 dot is gone
    // ...and the stylesheet no longer carries a rule for it either.
    expect(cssBodies('.surface-dot')).toEqual([])
    expect(cssBodies('.surface-badge.aff-suits .surface-dot')).toEqual([])
  })

  it('the line under the pill is the VERDICT only – the name is never printed twice', () => {
    const card = eventCardTop()
    // the caption binds the stripped `fit`, never the engine's full sentence
    expect(card).toContain('.fit')
    expect(card).not.toContain('.caption')
    // exactly ONE render of the surface name in the whole card top
    expect(card.split('{{ row.event.surface }}').length - 1).toBe(1)
    // and it is conditional – a neutral court gets the pill and nothing else
    expect(card).toContain('v-if="surfaceView(row.event.surface).fit"')
  })

  it('THE STRIP THE COMPONENT SLICES: every engine hint is "<Surface> – <verdict>"', () => {
    // surfaceFit() in SeasonScreen takes the tail after the first "– ". That is only correct while
    // surfaceStyleHint keeps prefixing the surface name; if the engine's copy is ever reworded, this
    // fails HERE rather than shipping "Grass – suits her game" under a pill that already says grass.
    for (const style of STYLES) {
      for (const surface of SURFACES) {
        const hint = surfaceStyleHint(style, surface)
        if (hint === null) {
          expect(surfaceStyleAffinity(style, surface)).toBe('neutral')
          continue
        }
        const dash = hint.indexOf('– ')
        expect(dash, `${style}/${surface}: "${hint}" has no short-dash separator`).toBeGreaterThan(0)
        const name = hint.slice(0, dash).trim()
        const fit = hint.slice(dash + 2)
        expect(name.toLowerCase()).toBe(surface)
        // the tail – what the card actually prints – must NOT name the surface again
        expect(fit.toLowerCase()).not.toContain(surface)
        expect(fit).not.toMatch(/[—А-Яа-яЁё]/) // player copy: short dash, no Cyrillic
      }
    }
  })

  it('the pill keeps the CAPSULE radius (a wide element is never 50%)', () => {
    // The R10-11 dot was a true circle at 50%; a pill is wide, so 50% would render an ellipse.
    // The convention (owner 26.07) is the named token – see round10.test.ts for the measurement.
    for (const body of cssBodies('.surface-pill')) expect(body).not.toContain('50%')
    expect(cssBodies('.pill').some((b) => b.includes('border-radius: var(--radius-pill)'))).toBe(true)
  })

  it('the badge is still a STACK – the good half of R10-11 survives the revert', () => {
    const badge = cssBodies('.surface-badge')[0]
    expect(badge).toContain('flex-direction: column')
    // the emoji stays hidden from assistive tech: it is the colour, the name next to it is the word
    const card = seasonScreen.slice(seasonScreen.indexOf('class="pill surface-pill"'))
    expect(card.slice(0, 300)).toContain('aria-hidden="true"')
    // ...and the pill carries the engine's whole sentence as its title
    expect(seasonScreen).toContain(':title="surfaceView(row.event.surface).title"')
  })
})

// ===========================================================================
// R11-2 — a friendly is practice: it must not change how she looks.
// ===========================================================================
describe('R11-2 — no win/loss avatar swap for practice matches', () => {
  const match = { winnerId: 'kid' } as unknown as WorldMatch
  const tournamentRound: WorldEvent = { id: 1, week: 4, type: 'match', text: 'beat X', match }
  const friendly: WorldEvent = { id: 2, week: 4, type: 'match', text: 'beat Y', match, friendly: true }
  const news: WorldEvent = { id: 3, week: 4, type: 'info', text: 'a quiet week' }

  it('a tournament round shows on her face; a friendly does not', () => {
    expect(resultShowsOnHerFace(tournamentRound)).toBe(true)
    expect(resultShowsOnHerFace(friendly)).toBe(false)
    expect(resultShowsOnHerFace(news)).toBe(false)
  })

  it('the gate is what the emotion walk actually asks – not a parallel copy', () => {
    const walk = kidEmotionSrc.slice(
      kidEmotionSrc.indexOf('const lastResult'),
      kidEmotionSrc.indexOf('const lastTitle'),
    )
    expect(walk).toContain('resultShowsOnHerFace(e)')
    // the old unguarded `if (!match) continue` must not still be the only filter
    expect(walk).not.toMatch(/if \(!match\) continue/)
  })

  // PIN MOVED by F45-1 (27.07). This used to sweep THREE surfaces including App.vue. The owner has
  // since ruled the header avatar emotion-free entirely — «в хедере… всегда norm для возраста» — so
  // App.vue is no longer an emotional surface and asserting it reads the emotion composable would
  // now pin the bug. The R11-2 property this test exists for is unchanged for the surfaces that DO
  // show an emotion; the header's own rule is pinned in tests/round11-followups.test.ts.
  it('ONE predicate, not two copies: every EMOTIONAL portrait surface reads useKidEmotion', () => {
    const surfaces = ['../src/components/screens/HomeScreen.vue', '../src/components/screens/KidScreen.vue']
    for (const rel of surfaces) {
      const src = readFileSync(new URL(rel, import.meta.url), 'utf8')
      expect(src, rel).toContain('useKidEmotion')
      // none of them derives an emotion (or an avatar filename) of its own
      expect(src, rel).not.toContain('avatarEmotion(')
      expect(src, rel).not.toMatch(/avatars\/\$\{/)
    }
    // the header is not on the list any more – and must not quietly rejoin it
    const app = readFileSync(new URL('../src/App.vue', import.meta.url), 'utf8')
    expect(app).not.toContain('useKidEmotion')
    // TournamentFlow picks its finale art from `pending`, which only exists for a TOURNAMENT
    // reveal – a friendly never mounts it, so it needs no gate and must not grow one.
    const flow = readFileSync(new URL('../src/components/TournamentFlow.vue', import.meta.url), 'utf8')
    expect(flow).toContain('game.snapshot?.pending')
  })
})

// ===========================================================================
// R11-14 — the booking label on ONE line.
// ===========================================================================
describe('R11-14 — "Practice match + coach" is one line in the calendar', () => {
  it('the label is a single uninterrupted expression', () => {
    expect(seasonScreen).toContain("🎾 Practice match{{ row.practice.withCoach ? ' + coach' : '' }}")
  })

  it('the controls sit in their own band, so they can never squeeze the text again', () => {
    const row = seasonScreen.slice(
      seasonScreen.indexOf("row.kind === 'practice' && row.practice"),
      seasonScreen.indexOf('<!-- An empty week'),
    )
    expect(row).toContain('class="planned-actions"')
    // both controls are inside it
    expect(row.indexOf('askCancelPractice')).toBeGreaterThan(row.indexOf('planned-actions'))
    expect(row.indexOf('playPracticeWeek')).toBeGreaterThan(row.indexOf('planned-actions'))
    // the vacation row got the same shape – it is the same card
    const vac = seasonScreen.slice(
      seasonScreen.indexOf("row.kind === 'vacation' && row.vacation"),
      seasonScreen.indexOf("row.kind === 'practice' && row.practice"),
    )
    expect(vac).toContain('class="planned-actions"')
  })

  it('the planned row stacks instead of competing for width', () => {
    const rule = cssBodies('.calendar-row-muted.planned')[0]
    expect(rule).toContain('flex-direction: column')
    expect(cssBodies('.planned-actions')[0]).toContain('justify-content: flex-end')
  })
})

// ===========================================================================
// R11-5a — "locked" vs "nothing scheduled", as ONE rule.
// ===========================================================================
describe('R11-5a — the tier ladder tells a point lock apart from an empty calendar', () => {
  // The ITF annual entry cap (feat/junior-age-caps) added a fifth input. R11-5a is about the
  // point lock vs the empty calendar, so every case here runs with the allowance UNTOUCHED – the
  // cap has its own suite in tests/age-caps.test.ts.
  const base: TierStateInput = {
    ageYears: 16,
    points: 0,
    upcoming: [],
    horizonWeeks: HORIZON_WEEKS,
    entryCap: { used: 0, limit: 25, remaining: 25 },
  }
  const at = (points: number, upcoming: { tier: TierId; week: number }[] = []): TierStateInput => ({
    ...base,
    points,
    upcoming,
  })

  it('THE REPORT WAS STRUCTURALLY IMPOSSIBLE: j30 is a strict subset of national', () => {
    // The owner said he could enter a J30 but not a National. By the bands that cannot happen –
    // which is why the fix is a sentence, not a rule.
    const [natMin, natMax] = TIERS.national.enterPointBand
    const [j30Min, j30Max] = TIERS.j30.enterPointBand
    expect(j30Min).toBeGreaterThanOrEqual(natMin)
    expect(j30Max).toBeLessThanOrEqual(natMax)
    for (const points of [180, 200, 400, 1_000]) {
      const nat = tierState('national', at(points))
      const j30 = tierState('j30', at(points))
      expect(isTierOpen(j30) && !isTierOpen(nat), `${points} pts: J30 open but National not`).toBe(false)
    }
  })

  it('below the floor is LOCKED, and says what it costs', () => {
    const s = tierState('national', at(100))
    expect(s.kind).toBe('locked')
    expect(s.pointsToEnter).toBe(TIERS.national.enterPointBand[0])
    expect(s.note).toBe('Reach 150 pts')
    expect(isTierOpen(s)).toBe(false)
  })

  it('past the ceiling is OUTGROWN, unchanged', () => {
    const s = tierState('local', at(TIERS.local.enterPointBand[1] + 1))
    expect(s.kind).toBe('outgrown')
    expect(isTierOpen(s)).toBe(false)
  })

  it('open WITH an event on the calendar names the earliest one', () => {
    const s = tierState('national', at(200, [
      { tier: 'national', week: 30 },
      { tier: 'national', week: 24 },
      { tier: 'j30', week: 20 },
    ]))
    expect(s.kind).toBe('scheduled')
    expect(s.nextWeek).toBe(24)
    expect(isTierOpen(s)).toBe(true)
    // the DATE, never a week number – R11-6 owns week rendering and this must not pre-empt it
    expect(s.title).toMatch(/\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\b/)
    expect(s.note).not.toMatch(/W\d/)
  })

  it("THE OWNER'S CASE: open, nothing scheduled – and it says exactly that", () => {
    // 200 pts, a J30 on the calendar, no National anywhere in the horizon (national runs every
    // 13 weeks + 2 extras = 6 a season, against j30's ~26).
    const upcoming = [
      { tier: 'j30' as TierId, week: 12 },
      { tier: 'local' as TierId, week: 11 },
    ]
    const nat = tierState('national', at(200, upcoming))
    const j30 = tierState('j30', at(200, upcoming))
    expect(j30.kind).toBe('scheduled')
    expect(nat.kind).toBe('unscheduled')
    expect(isTierOpen(nat)).toBe(true) // she is NOT locked out – that was the whole confusion
    expect(nat.note).toContain(`${HORIZON_WEEKS} weeks`)
    expect(nat.note).not.toContain('Reach')
    expect(nat.title).toContain('not locked')
  })

  it('the age gate stays its own state (the junior tour is 13+)', () => {
    const s = tierState('j30', { ...at(1_000), ageYears: 12 })
    expect(s.kind).toBe('age-locked')
    expect(s.note).toBe(`Opens at ${TIERS.j30.minAgeYears}`)
  })

  it('every rung, every state, in player copy (short dash, no Cyrillic)', () => {
    for (const points of [0, 100, 200, 500, 1_000]) {
      for (const id of TIER_LADDER) {
        const s = tierState(id, at(points, [{ tier: 'local', week: 3 }]))
        expect(s.note, `${id}@${points}`).not.toMatch(/[—А-Яа-яЁё]/)
        expect(s.title, `${id}@${points}`).not.toMatch(/[—А-Яа-яЁё]/)
        expect(s.note.length, `${id}@${points} note is a chip label, not a sentence`).toBeLessThan(28)
      }
    }
  })

  it('ONE rule, many surfaces: neither screen re-derives a band', () => {
    for (const [name, src] of [['Home', homeScreen], ['Season', seasonScreen]] as const) {
      expect(src, name).toContain("composables/tierState")
      expect(src, name).not.toContain('enterPointBand')
    }
    // the Home ladder no longer reaches for the tier catalogue or the age gate at all
    expect(homeScreen).not.toContain('isTierAgeOpen')
    expect(homeScreen).not.toMatch(/TIERS\[/)
    // ...and the words of a point lock are written in exactly one place
    expect(homeScreen).not.toContain('Reach ')
    const lock = seasonScreen.slice(seasonScreen.indexOf('function lockLabel'), seasonScreen.indexOf('// --- R11-5a'))
    expect(lock).toContain('pointsLockNote(')
    expect(lock).not.toMatch(/`Reach \$/)
  })

  it('an event card keeps the ENGINE\'s own threshold, not the ladder\'s verdict', () => {
    // Found in the browser: reading the ladder's whole note here let a card the engine had locked
    // print the ladder's "open" state. Same words, but each surface keeps its authoritative number.
    expect(pointsLockNote(180)).toBe('Reach 180 pts')
    const lock = seasonScreen.slice(seasonScreen.indexOf('function lockLabel'), seasonScreen.indexOf('// --- R11-5a'))
    expect(lock).toContain('e.pointsToEnter')
  })

  it('the Season screen names the open-but-unscheduled tiers under the calendar', () => {
    expect(seasonScreen).toContain('openButUnscheduled')
    expect(seasonScreen).toContain('Also open to her:')
    const note = seasonScreen.slice(seasonScreen.indexOf('Also open to her:'))
    expect(note.slice(0, 220)).toContain('Not locked')
    expect(note.slice(0, 220)).not.toMatch(/[—А-Яа-яЁё]/)
  })

  it('the ladder chip has a state of its own for it', () => {
    expect(homeScreen).toContain("'waiting'")
    expect(cssBodies('.tier-chip.waiting').length).toBe(1)
  })
})
