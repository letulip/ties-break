// =================================================================================================
// R2-13 PHASE 1, THE UI HALF – MOUNTED, BECAUSE THE CLAIMS ARE ABOUT WHAT IS ON SCREEN
// =================================================================================================
//
// Two claims, and neither can be made by a source pin:
//
//   1. THE PILL IS THERE ON A QUIET WEEK AND NOWHERE ELSE. A pin would go green on a gate that reads
//      the right field and renders anyway – exactly the note round21-popup-order.test.ts makes.
//   2. THE FOUR WEEKS REPORT WHAT THEY DID, and the way out of that report is on a phone. The second
//      half is round-20 #3's law (CLAUDE.md: "any dialog you add or lengthen gets a mounted
//      assertion that its dismiss control's box is inside a 375x667 viewport"), and it is mutated
//      here so a green run cannot be the cascade merely existing.
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { assertDismissReachable, setViewport, NARROW_PHONE, PHONE } from './fits'
// ⚠ THE REAL STYLESHEET, OR THE FIT MEASUREMENTS BELOW ARE VACUOUS. `fits.ts` reads the cascade
// through `getComputedStyle`, and vitest only keeps stylesheets because the component project sets
// `css: true` – a global sheet still has to be imported by the file that measures against it
// (college-warning.test.ts does the same, one line, same reason).
import '../../src/style.css'

// The shell imports the service-worker registration and the component project resolves no virtual
// module for it – the same mock round19-wrapup / round21-popup-order install, for the same reason.
vi.mock('../../src/pwa', async () => {
  const { ref } = await import('vue')
  return { needRefresh: ref(false), applyUpdate: () => {}, UPDATE_CHECK_MS: 3600_000 }
})

import App from '../../src/App.vue'
import SplashScreen from '../../src/components/SplashScreen.vue'
import WeekSpanReport from '../../src/components/WeekSpanReport.vue'
import { useGameStore } from '../../src/stores/game'
import {
  MULTI_WEEK_SPAN,
  QUIET_WINDOW_WEEKS,
  advanceWeeks,
  createWorld,
  enterEvent,
  spanDigest,
  spanWorthOffering,
  toSnapshot,
  type SpanWeek,
  type WorldState,
} from '../../src/engine/world'
import { resumeMain } from '../../src/engine/rng'
import { setDayCrossOff } from '../../src/composables/dayCross'
import { DEFAULT_PROFILE, type WorldEvent } from '../../src/shared/protocol'
import type { SeasonEvent } from '../../src/engine/season/types'

// ⚠ THIS RUNNER HAS NO localStorage AND THE SHELL'S WATERMARKS ARE localStorage. Same shim as
// round19-wrapup / round20-ui / round21-popup-order – supply the browser's object, do not weaken
// the app.
const backing = new Map<string, string>()
Object.defineProperty(globalThis, 'localStorage', {
  configurable: true,
  value: {
    getItem: (k: string) => (backing.has(k) ? backing.get(k)! : null),
    setItem: (k: string, v: string) => void backing.set(k, String(v)),
    removeItem: (k: string) => void backing.delete(k),
    clear: () => backing.clear(),
    key: (i: number) => [...backing.keys()][i] ?? null,
    get length() {
      return backing.size
    },
  },
})

function row(id: number, week: number, text: string, amountCents?: number): WorldEvent {
  return amountCents === undefined ? { id, week, type: 'info', text } : { id, week, type: 'expense', text, amountCents }
}

/** A span the size of a real quiet fortnight: a coaching bill, a court bill, a sponsor letter, a
 *  diary line. The exact three things R2-13 names as unacceptable to swallow. */
const DIGEST: SpanWeek[] = [
  { week: 13, rows: [row(1, 13, 'Coaching – standard private coach', -32000), row(2, 13, 'Court hire', -9000)] },
  { week: 14, rows: [row(3, 14, 'A local shop offered her a kit deal.'), row(4, 14, 'Stringing', -2500)] },
  { week: 15, rows: [row(5, 15, 'She went to bed talking about her serve.')] },
  { week: 16, rows: [row(6, 16, 'Savings interest', 1800), row(7, 16, 'Coaching – standard private coach', -32000)] },
]

// =================================================================================================
// PART 1 – THE CARD
// =================================================================================================
describe('R2-13 – the span report says what the four weeks did', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    document.body.innerHTML = ''
  })

  function mountReport(digest: SpanWeek[] = DIGEST, vp = PHONE) {
    // ⚠ THE VIEWPORT FIRST – happy-dom resolves lengths at `getComputedStyle` time.
    setViewport(vp)
    const w = mount(WeekSpanReport, { props: { from: 12, to: 16, digest }, attachTo: document.body })
    const card = document.querySelector('.dialog-overlay .dialog-card')!
    const dismiss = document.querySelector('.dialog-overlay .dialog-actions')!
    expect(card, 'the card is up – nothing below is vacuous').toBeTruthy()
    expect(dismiss.querySelectorAll('button').length, 'the actions ARE the way out').toBeGreaterThan(0)
    return { w, card, dismiss }
  }

  it('⚠⚠ NOTHING IS LOST IN THE RENDER – every row of every week is on the card', () => {
    const { w } = mountReport()
    const text = w.text()
    for (const week of DIGEST) {
      for (const r of week.rows) {
        expect(text, `week ${week.week}: "${r.text}" must be on the card`).toContain(r.text)
      }
    }
    // One section per week, in order, and the count is the digest's – so a template that silently
    // capped the list (v-for with a slice, "the last two weeks") would fail here rather than ship.
    const sections = w.findAll('.week-span-week')
    expect(sections.length, 'one section per week that had something').toBe(DIGEST.length)
    expect(w.findAll('.week-span-row').length, 'and one line per row').toBe(
      DIGEST.reduce((n, k) => n + k.rows.length, 0),
    )
    w.unmount()
  })

  it('⚠ money is rendered from CENTS through the shared formatter – no raw figures on screen', () => {
    const { w } = mountReport()
    const text = w.text()
    expect(text, '-32000 cents is $320').toContain('-$320')
    expect(text, 'and income keeps its sign').toContain('+$18')
    expect(text, 'the cents themselves never reach the player').not.toContain('32000')
    w.unmount()
  })

  it('⚠ the number of weeks it names is what it SPENT, not what the button offered', () => {
    // A span that stopped after two weeks must not say four. The card is told `from`/`to` and reads
    // the difference, which is the only honest source – the stop reasons never carry a distance.
    setViewport(PHONE)
    const w = mount(WeekSpanReport, { props: { from: 12, to: 14, digest: DIGEST.slice(0, 2) }, attachTo: document.body })
    expect(w.text()).toContain('2 weeks passed')
    expect(w.text()).not.toContain('4 weeks passed')
    w.unmount()
  })

  it('⚠ an empty span says so rather than rendering a blank card (R10-16)', () => {
    setViewport(PHONE)
    const w = mount(WeekSpanReport, { props: { from: 12, to: 16, digest: [] }, attachTo: document.body })
    expect(w.find('.week-span-empty').exists()).toBe(true)
    expect(w.text()).toContain('Nothing was raised')
    w.unmount()
  })

  it('⭐ on a 375x667 phone the way out of it is on the screen', () => {
    const { w, card, dismiss } = mountReport()
    assertDismissReachable(card, dismiss, PHONE, 'WeekSpanReport (a quiet four weeks)')
    w.unmount()
  })

  it('...and on the narrowest screen too', () => {
    const { w, card, dismiss } = mountReport(DIGEST, NARROW_PHONE)
    assertDismissReachable(card, dismiss, NARROW_PHONE, 'WeekSpanReport (a quiet four weeks)')
    w.unmount()
  })

  it('⭐ ...and on a BUSY four weeks, which is the version that grows', () => {
    // The failure mode round-20 #4 named is slow: "a dialog grows by one honest sentence at a time
    // and nothing objects until it is taller than a phone". This card grows by one CAREER WEEK at a
    // time, which is faster – so it is measured against a span that wrote fifteen rows a week.
    const busy: SpanWeek[] = [13, 14, 15, 16].map((week) => ({
      week,
      rows: Array.from({ length: 15 }, (_, i) => row(week * 100 + i, week, `A long enough ledger line about week ${week}, item ${i}`, -1234)),
    }))
    const { w, card, dismiss } = mountReport(busy)
    const fit = assertDismissReachable(card, dismiss, PHONE, 'WeekSpanReport (60 rows)')
    expect(fit.contentFloor, 'the fixture really is taller than the screen – otherwise the cap is untested').toBeGreaterThan(
      fit.available.height,
    )
    expect(fit.scrollable, 'so it has to scroll').toBe(true)
    w.unmount()
  })

  it('⚠⚠ MUTATION PROOF – take the height cap off and the SAME assertion goes red', () => {
    // Without this the three above are unfalsifiable: the cap lives on the shared `.dialog-card`
    // rule, so a green run would prove only that the cascade exists. This is the exact shape
    // `TourBriefingDialog` shipped in and the owner's career stopped on.
    const { w, card, dismiss } = mountReport()
    ;(card as HTMLElement).style.maxHeight = 'none'
    ;(card as HTMLElement).style.overflowY = 'visible'
    expect(() => assertDismissReachable(card, dismiss, PHONE, 'WeekSpanReport (cap removed)')).toThrow(
      /declares no height bound|taller than the screen|outside the viewport/,
    )
    w.unmount()
  })
})

// =================================================================================================
// PART 2 – THE SHELL: WHEN THE PILL IS THERE, AND WHAT PRESSING IT PRODUCES
// =================================================================================================
describe('R2-13 – the span pill, in the real shell', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    backing.clear()
    document.body.innerHTML = ''
  })

  async function openShell(world: WorldState) {
    const game = useGameStore()
    vi.spyOn(game, 'init').mockResolvedValue(undefined)
    game.$patch({ ready: true, phase: 'ready' })
    // Assigned, never `$patch`ed – `$patch` deep-merges and these cases care about absent keys.
    game.snapshot = toSnapshot(world)
    const w = mount(App, { global: { stubs: { teleport: true } } })
    w.findComponent(SplashScreen).vm.$emit('done')
    await flushPromises()
    return { w, game }
  }

  /** A career on an ordinary training week – no entry ahead, nothing booked, nothing pending. */
  function quietWorld(seed: string): { world: WorldState; rng: () => number } {
    const world = createWorld(seed, DEFAULT_PROFILE)
    world.season = []
    return { world, rng: resumeMain(world.rngMain) }
  }

  it('⭐⭐ ON A QUIET WEEK THE PILL IS THERE, beside the week button and labelled with the span', async () => {
    const { world } = quietWorld('r2-13-ui-quiet')
    const { w } = await openShell(world)
    const pill = w.find('.span-weeks-btn')
    expect(pill.exists(), 'the quiet stretch is exactly what R2-13 exists for').toBe(true)
    // ⚠ AND IT DOES NOT SAY "Play", which is a real constraint and not a copy preference: the e2e
    // suite's `WEEK_ACTION_NAME` matches `Play .+` and is unscoped, so a second "Play ..." button on
    // Home makes every journey ambiguous under Playwright's strict mode. Asserted here because this
    // is the layer that can catch it in three seconds instead of in a browser.
    expect(pill.text()).toBe(`Next ${MULTI_WEEK_SPAN} weeks`)
    expect(pill.text()).not.toMatch(/^Play /)
    expect(w.find('.next-week-btn').exists(), 'and the week button is still the CTA beside it').toBe(true)
    w.unmount()
  })

  it('⚠⚠ ...AND IT IS GONE THE MOMENT THE ENGINE COULD NOT USE IT – a reveal is open', async () => {
    // The dead-click gate, mounted. `advanceWeeks` returns 'tournament' with no tick in this state.
    const world = createWorld('r2-13-ui-pending', DEFAULT_PROFILE)
    const event: SeasonEvent = {
      id: 'r2-13-ui-2-local',
      week: 2,
      tier: 'local',
      surface: 'hard',
      travelCostCents: 100_00,
      deadlineWeek: 0,
    }
    world.season = [event]
    enterEvent(world, event.id)
    advanceWeeks(world, resumeMain(world.rngMain), MULTI_WEEK_SPAN)
    expect(world.pendingTournament, 'the fixture really is standing on a reveal').not.toBeNull()

    const { w } = await openShell(world)
    expect(w.find('.span-weeks-btn').exists(), 'no span behind a reveal').toBe(false)
    w.unmount()
  })

  it('⚠ ...and gone behind an unanswered knock', async () => {
    const world = createWorld('r2-13-ui-knock', { ...DEFAULT_PROFILE, coachTier: 'self' })
    world.season = []
    world.knock = { part: 'wrist', sinceWeek: world.week, repeat: false, choice: null, untilWeek: world.week }
    const { w, game } = await openShell(world)
    expect(game.snapshot?.knockPrompt, 'the knock really is pending – neither half is vacuous').toBeTruthy()
    expect(w.find('.span-weeks-btn').exists()).toBe(false)
    w.unmount()
  })

  it('⚠ ...and gone on a week she is entered in – the 28.07 ruling, as a rendered fact', async () => {
    // «it was a testing shortcut that offered to skip the thing the player came to play». Her entry
    // arrives NEXT week, so the week button says "Play LOC" – and there is no span beside it.
    const world = createWorld('r2-13-ui-entered', DEFAULT_PROFILE)
    const event: SeasonEvent = {
      id: 'r2-13-ui-1-local',
      week: 1,
      tier: 'local',
      surface: 'hard',
      travelCostCents: 100_00,
      deadlineWeek: 0,
    }
    world.season = [event]
    enterEvent(world, event.id)
    const { w, game } = await openShell(world)
    expect(game.snapshot?.arrival, 'the entry really is on the week ahead').not.toBeNull()
    expect(w.find('.span-weeks-btn').exists()).toBe(false)
    w.unmount()
  })

  it('⭐⭐ PRESSING IT SPENDS FOUR WEEKS AND REPORTS ALL OF THEM – press to card, end to end', async () => {
    const { world, rng } = quietWorld('r2-13-ui-press')
    const { w, game } = await openShell(world)
    const from = world.week

    // The store is the ONLY thing stubbed, and it is stubbed onto the real engine: the worker is not
    // available here, so `advance` runs `advanceWeeks` in-process and republishes the snapshot –
    // which is precisely what `sim.worker.ts`'s `advance` handler does.
    const advance = vi.spyOn(game, 'advance').mockImplementation(async (weeks) => {
      advanceWeeks(world, rng, weeks)
      game.snapshot = toSnapshot(world)
    })

    await w.find('.span-weeks-btn').trigger('click')
    await flushPromises()

    expect(advance, 'one press, four weeks, one command').toHaveBeenCalledWith(MULTI_WEEK_SPAN)
    expect(world.week, 'and the engine really spent them').toBe(from + MULTI_WEEK_SPAN)

    const report = w.findComponent(WeekSpanReport)
    expect(report.exists(), 'the report is up').toBe(true)
    expect(report.text()).toContain(`${MULTI_WEEK_SPAN} weeks passed`)

    // ⚠⚠ THE CLAIM THAT MATTERS: what the card lists is what the weeks WROTE. Compared against the
    // world's own feed rather than against the digest the shell built, so a shell that filtered on
    // the way in would fail here.
    const raised = world.events.filter((e) => e.week > from && e.week <= world.week)
    expect(raised.length, 'four weeks of a career write something – otherwise this is vacuous').toBeGreaterThan(10)
    expect(w.findAll('.week-span-row').length, `all ${raised.length} rows are on the card`).toBe(raised.length)
    const shown = w.text()
    for (const e of raised) expect(shown, `"${e.text}" must be on the card`).toContain(e.text)

    // ...and the shell's digest is the engine's, week for week.
    expect(JSON.stringify(spanDigest(world.events, from, world.week)).length).toBeGreaterThan(0)
    expect(w.findAll('.week-span-week').length).toBe(spanDigest(world.events, from, world.week).length)

    // Closing it puts it away and leaves the career on the week it reached.
    await w.findAll('.dialog-actions button')[0].trigger('click')
    await flushPromises()
    expect(w.findComponent(WeekSpanReport).exists()).toBe(false)

    // ⚠ RE-AIMED BY ROUND 26 #1, AND THE FIXTURE IS THE REASON. The old line read "the next quiet
    // stretch offers the span again" as an unconditional `true`, which held only under the old gate.
    // The fixture starts with `world.season = []` and `ensureSeason` REBUILDS the calendar inside
    // the very first tick (bookkeeping.ts – it extends in year blocks until SEASON_MIN_FUTURE weeks
    // are covered), so the four weeks this case just spent have handed the career a full calendar.
    // Under the owner's rule that is no longer a quiet stretch, and asserting `true` here would be
    // asserting the old gate.
    const after = toSnapshot(world)
    expect(w.find('.span-weeks-btn').exists(), 'the pill follows the owner\'s rule and nothing else').toBe(
      spanWorthOffering(after.week, after.upcoming, after.injury),
    )
    // …and the re-arm itself, which is what this line was always for: clear his five-week window on
    // the world and the control comes back without anything else changing.
    world.season = world.season.filter((e) => e.week > world.week + QUIET_WINDOW_WEEKS)
    game.snapshot = toSnapshot(world)
    await flushPromises()
    expect(w.find('.span-weeks-btn').exists(), 'and the next quiet stretch offers the span again').toBe(true)
    w.unmount()
  })

  it('⚠ a single press raises NO span report – the card belongs to the span and to nothing else', async () => {
    // ⚠ THE SWEEP IS SWITCHED OFF FOR THIS ONE, AND THAT IS THE APP'S OWN SWITCH RATHER THAN A
    // WORKAROUND. With the day-cross animation on, a single press from Home DETOURS to the calendar
    // to run the sweep and spends the week there (`playWeek`'s three guards) – so the press under
    // test would never reach `game.advance` at all. `setDayCrossOff(true)` is the documented state
    // in which "there is nothing to detour FOR", which is exactly the arm this case wants.
    setDayCrossOff(true)
    const { world, rng } = quietWorld('r2-13-ui-single')
    const { w, game } = await openShell(world)
    const advance = vi.spyOn(game, 'advance').mockImplementation(async (weeks) => {
      advanceWeeks(world, rng, weeks)
      game.snapshot = toSnapshot(world)
    })
    await w.find('.next-week-btn').trigger('click')
    await flushPromises()
    expect(advance, 'one week, the ordinary press').toHaveBeenCalledWith(1)
    expect(world.week, 'the week was spent').toBe(1)
    expect(w.findComponent(WeekSpanReport).exists(), 'and no span card came with it').toBe(false)
    setDayCrossOff(false)
    w.unmount()
  })

  it('⚠ the report waits behind a blocking question and is not lost by waiting', async () => {
    // Round-21 #9's rule, inherited rather than re-argued: `'week-span'` is a member of the popup
    // set, so it waits for an idle screen exactly as the season summary does – and the wait cannot
    // strand it, because the thing it waits for always has an exit.
    const { world, rng } = quietWorld('r2-13-ui-held')
    const { w, game } = await openShell(world)
    const from = world.week
    vi.spyOn(game, 'advance').mockImplementation(async (weeks) => {
      advanceWeeks(world, rng, weeks)
      // The knock the engine could have raised on the last week of the span, put up by hand so the
      // case is about the ORDER rather than about hunting a seed that produces one.
      world.knock = { part: 'wrist', sinceWeek: world.week, repeat: false, choice: null, untilWeek: world.week }
      game.snapshot = toSnapshot(world)
    })
    await w.find('.span-weeks-btn').trigger('click')
    await flushPromises()
    expect(game.snapshot?.knockPrompt, 'the question is up').toBeTruthy()
    expect(w.findComponent(WeekSpanReport).exists(), 'so the report waits').toBe(false)

    // Answer it, and the report is the next thing on screen with its weeks intact.
    world.knock = null
    game.snapshot = toSnapshot(world)
    await flushPromises()
    const report = w.findComponent(WeekSpanReport)
    expect(report.exists(), 'held, not lost').toBe(true)
    expect(report.props('from')).toBe(from)
    expect(report.props('to')).toBe(world.week)
    w.unmount()
  })
})
