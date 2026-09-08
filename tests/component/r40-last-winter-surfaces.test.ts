// =================================================================================================
// ⭐⭐⭐ ROUND 40 #14b – THE WARNING REACHES THREE SCREENS, AND THEY ALL READ ONE NUMBER
// =================================================================================================
//
// THE OWNER, 08.09: «да, это именно то, о чем я и говорил. Где-то тренер может подсветить, где-то
// она сама, где-то финальный экран сезона. Давай сделаем.»
//
// The engine-level claims – one derivation, his «сезон-два» window, the exact boundary and the zero
// draws – are pinned in `tests/r40-last-winter.test.ts`. THIS file is the other half CLAUDE.md asks
// for: «Prefer a mounted test to a source pin», so every sentence below is read off a real component
// through the real cascade, and the two dialogs that GREW are measured against a phone.
//
//   1. HER VOICE lands on the winter card, in the age branch, under everything that was already
//      there – and never on the plateau card or on the final one.
//   2. THE SEASON'S CLOSING SCREEN carries it in its own reporting voice, between her line and the
//      parent's scrap, with neither of them moved.
//   3. THE COACH says it on his card in the market list, and Home keeps its short read.
//   4. ⭐ ALL THREE MOVE TOGETHER when the walk's target moves – the mounted form of the pin that
//      matters, because a screen that re-derived the count would pass the engine test and fail here.
//   5. BOTH DIALOGS STILL FIT A 375x667 PHONE with the new line on them (round-20 #3's standing rule).
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import { createPinia, setActivePinia } from 'pinia'
// ⚠ THE REAL STYLESHEET, or the fit measurements at the foot of this file read an empty cascade and
// pass vacuously – `measureDialog` refuses a document with no `<style>` in it for that reason.
import '../../src/style.css'
import RetirementDialog from '../../src/components/RetirementDialog.vue'
import SeasonSummaryDialog from '../../src/components/SeasonSummaryDialog.vue'
import HomeScreen from '../../src/components/screens/HomeScreen.vue'
import CoachMarketScreen from '../../src/components/screens/CoachMarketScreen.vue'
import { useGameStore } from '../../src/stores/game'
import { createWorld, toSnapshot } from '../../src/engine/world'
import type { WorldState } from '../../src/engine/world'
import { coachDeclineNote, lastWinterIn } from '../../src/engine/world/coachMarket'
import { herLastWinterLine, seasonLastWinterLine } from '../../src/composables/declineVoice'
import { ENDINGS } from '../../src/engine/ending'
import { physicalMean } from '../../src/engine/development'
import { WEEKS_PER_YEAR } from '../../src/engine/season/calendar'
import { DEFAULT_PROFILE } from '../../src/shared/protocol'
import type { RetirementOffer, SeasonHistoryEntry, SeasonSummary, SeasonTrackRow, Snapshot } from '../../src/shared/protocol'
import type { LadderTrack } from '../../src/engine/season/types'
import { assertDismissReachable, setViewport, PHONE } from './fits'

// ⚠ THIS RUNNER HAS NO localStorage AND HomeScreen READS IT – the same shim r38-decline-voice,
// r39-decline-surfaces and round24-coach-card carry, for the reason quoted there in full.
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

/** Rendered text with the template's own wrapping collapsed – what a reader sees. */
const said = (text: string): string => text.replace(/\s+/g, ' ').trim()

const EMPTY_ROW: SeasonTrackRow = { points: 0, wins: 0, losses: 0 }
function season(seasonIndex: number, wtaRank: number): SeasonHistoryEntry {
  const byTrack = {
    domestic: { ...EMPTY_ROW },
    itf: { ...EMPTY_ROW },
    wta: { ...EMPTY_ROW, endRank: wtaRank },
  } as Record<LadderTrack, SeasonTrackRow>
  return { seasonIndex, endRank: wtaRank, points: 0, wins: 0, losses: 0, fundsDeltaCents: 0, endFundsCents: 0, byTrack }
}

/** A synthetic career inside the warning window, found by sweeping the share rather than by writing
 *  one down – so a moved band or a moved window re-finds its own fixture. `seasonWeek` matters on
 *  Home alone, whose plate rotates with the season's third (round 39 #2b).
 *
 *  ⚠ SYNTHETIC, NEVER A SAVE: `createWorld` plus a week and a peak under this file's hand. */
function inWindow(winters: number, opts: { ageYears?: number; seasonWeek?: number; seasons?: SeasonHistoryEntry[] } = {}): WorldState {
  const ageYears = opts.ageYears ?? 41
  for (let share = 0.95; share > 0.45; share -= 0.002) {
    const world = createWorld('r40-lw-surfaces', { ...DEFAULT_PROFILE, coachTier: 'middle' })
    world.week = Math.round((ageYears - 14) * WEEKS_PER_YEAR) + (opts.seasonWeek ?? 0)
    world.peakPhysical = physicalMean(world.skills) / share
    world.seasonHistory = opts.seasons ?? [season(20, 125)]
    if (lastWinterIn(world) === winters) return world
  }
  throw new Error(`no share gives ${winters} winters at ${ageYears} – the window has moved`)
}

// --- 1. HER VOICE, ON THE WINTER CARD -------------------------------------------------------------

const AGE: RetirementOffer = { askedWeek: 1453, seasonIndex: 27, reason: 'age', final: false }
const PLATEAU: RetirementOffer = { askedWeek: 700, seasonIndex: 12, reason: 'plateau', final: false }
const FINAL: RetirementOffer = { askedWeek: 1453, seasonIndex: 27, reason: 'age', final: true }

/** ⚠⚠ ASSIGNED, NEVER `$patch`ED, AND THIS COST AN HOUR – WORTH THE SENTENCE. Pinia's `$patch`
 *  DEEP-MERGES: patching a second offer over a first one calls `mergeReactiveObjects(target, patch)`,
 *  which writes the patch's fields INTO the object already in the state – and the object already in
 *  the state is the module-level `AGE` const this file shares between arms. Three `showOffer` calls
 *  in one test turned `AGE` into `PLATEAU` for the rest of the FILE, and the arms that failed were
 *  the two that ran afterwards, which is as misleading as a test failure gets. A whole-object
 *  assignment replaces the snapshot instead of merging into it, so nothing this file exports can be
 *  edited by a store. (`last-word.test.ts` patches too and is safe: one offer per test, on a pinia
 *  its `beforeEach` has just replaced, so the target is always null and the merge never recurses.) */
function showOffer(offer: RetirementOffer, over: Record<string, unknown> = {}): void {
  useGameStore().snapshot = {
      ageYears: 41,
      week: 1453,
      kidRank: 88,
      fundsCents: 1234_00,
      oneMoreYearCount: 0,
      careerTotals: { earnedCents: 0, spentCents: 0, prizeCents: 0 },
      seed: 'r40-lw-card',
      physicalShare: 0.6,
      coachMarket: [],
      seasonHistory: [],
      lastWinterIn: null,
      retirementOffer: offer,
      ...over,
    } as unknown as Snapshot
}

describe('round 40 #14b (1) – her own voice on the winter card', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('⭐ the age card carries her warning, and it is the engine\'s own count', () => {
    for (const n of [1, 2]) {
      showOffer(AGE, { lastWinterIn: n })
      const w = mount(RetirementDialog)
      const line = w.find('.retire-last-winter')
      expect(line.exists(), `no warning on the card at ${n} winters`).toBe(true)
      expect(said(line.text())).toBe(herLastWinterLine(n))
      w.unmount()
    }
  })

  it('⚠ ...and everything that was already on that card is untouched', () => {
    showOffer(AGE, { lastWinterIn: 2 })
    const w = mount(RetirementDialog)
    // Round 30 #7's lede, byte for byte, with the new paragraph under it rather than in place of it.
    expect(said(w.get('.retire-lede').text())).toBe(
      'Twenty-nine is when the question starts being asked, not a countdown to anything. There is no wrong answer, and she can say no for as many winters as her body gives her.',
    )
    expect(w.get('.retire-title').text()).toBe('Is there another year in this?')
    // Both answers are still there: a warning is not a decision, and the door stays open.
    expect(w.findAll('.retire-answer')).toHaveLength(2)
    expect(w.text()).toContain('One more year')
    w.unmount()
  })

  it('⚠ silent when the engine says nothing, and on the two cards it may never appear on', () => {
    showOffer(AGE, { lastWinterIn: null })
    const quiet = mount(RetirementDialog)
    expect(quiet.find('.retire-last-winter').exists(), 'the card spoke on a null count').toBe(false)
    quiet.unmount()

    // ⚠⚠ THE FINAL CARD IS HER LAST WORD AND NOTHING MAY TALK OVER IT. The engine already returns
    // null there (the last winter IS this one), and the template is in the age branch besides – so
    // this arm forces the field non-null to prove the card cannot render it even then.
    showOffer(FINAL, { lastWinterIn: 1 })
    const last = mount(RetirementDialog)
    expect(last.find('.retire-last-winter').exists(), 'the warning appeared on her last word').toBe(false)
    expect(last.text()).not.toContain('after this one')
    last.unmount()

    // ...and the plateau card is a RESULTS reading, 24-28, where the share is exactly 1 and a body
    // projection would be a projection off a constant (r39 #14b's own measurement).
    showOffer(PLATEAU, { lastWinterIn: 2 })
    const plateau = mount(RetirementDialog)
    expect(plateau.find('.retire-last-winter').exists(), 'the warning appeared on the plateau card').toBe(false)
    plateau.unmount()
  })
})

// --- 2. THE SEASON'S CLOSING SCREEN ---------------------------------------------------------------

const SUMMARY: SeasonSummary = {
  seasonYear: 2062,
  endRank: 88,
  startRank: 74,
  points: 640,
  wins: 24,
  losses: 14,
  bestResultText: 'Semifinalist',
  fundsDeltaCents: 41_200_00,
  spentCents: 180_000_00,
  earnedCents: 221_200_00,
  weeksInjured: 2,
  academyCoveredCents: 0,
  rankTrack: 'wta',
  rankInTrack: 88,
}

/** Same rule as `showOffer` above: assigned, never patched. */
function wrap(over: Record<string, unknown>): void {
  useGameStore().snapshot = {
      ageYears: 41,
      week: 1453,
      seed: 'r40-lw-wrap',
      physicalShare: 0.6,
      schoolEndsWeek: 200,
      lastWinterIn: null,
      lastSeasonSummary: SUMMARY,
      ...over,
    } as unknown as Snapshot
}

describe('round 40 #14b (2) – the season\'s closing screen', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('⭐ the wrap-up carries the warning in its own voice, at every count in the window', () => {
    for (const n of [1, 2]) {
      wrap({ lastWinterIn: n })
      const w = mount(SeasonSummaryDialog, { global: { stubs: { teleport: true } } })
      const line = w.find('.season-last-winter')
      expect(line.exists(), `no warning on the wrap at ${n} winters`).toBe(true)
      expect(said(line.text())).toBe(seasonLastWinterLine(n))
      w.unmount()
    }
  })

  it('⚠ ...beside her line and the parent\'s scrap, neither of which moved', () => {
    wrap({ lastWinterIn: 1 })
    const w = mount(SeasonSummaryDialog, { global: { stubs: { teleport: true } } })
    expect(w.find('.season-her-line').exists(), 'round 31 #9 line vanished').toBe(true)
    expect(w.text()).toContain('Off-season now:')
    expect(w.get('.season-summary-title').text()).toBe("That's a season.")
    // ⚠ HER line and THIS line are two different objects: three voices, and the card may not merge
    // two of them into one paragraph.
    expect(w.get('.season-her-line').text()).not.toBe(w.get('.season-last-winter').text())
    w.unmount()
  })

  it('⚠ every wrap before the window is byte-identical – no line, not an empty one', () => {
    wrap({ lastWinterIn: null })
    const w = mount(SeasonSummaryDialog, { global: { stubs: { teleport: true } } })
    expect(w.find('.season-last-winter').exists(), 'the wrap spoke on a null count').toBe(false)
    expect(w.text()).not.toContain('nobody asks her again')
    w.unmount()
  })
})

// --- 3. THE COACH ---------------------------------------------------------------------------------

async function mountMarketCoaches(world: WorldState) {
  useGameStore().snapshot = toSnapshot(world)
  const wrapper = mount(CoachMarketScreen, { global: { stubs: { teleport: true } } })
  const pill = wrapper.findAll('.tb-seg .tab-pill').find((b) => b.text() === 'Coaches')
  await pill!.trigger('click')
  await nextTick()
  return wrapper
}

function mountHome(world: WorldState) {
  useGameStore().snapshot = toSnapshot(world)
  return mount(HomeScreen, { props: { recapFresh: false }, global: { stubs: { teleport: true } } })
}

describe('round 40 #14b (3) – the coach, long on his card and short on Home', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('⭐ his card in the market list says which winter is the last one', async () => {
    const world = inWindow(2)
    const wrapper = await mountMarketCoaches(world)
    const line = wrapper.find('.cm-row.current .cm-decline')
    expect(line.exists(), 'no decline read on his card').toBe(true)
    // The screen owns the emphasis and the engine owns the words – the market rule since round 23.
    expect(said(line.text())).toBe(said(coachDeclineNote(world)))
    expect(line.text()).toContain('her last winter is 2 seasons away')
    // ⚠ AND THE CLAUSE IT REPLACED IS GONE RATHER THAN DOUBLED: one body clause per sentence.
    expect(line.text()).not.toContain('more seasons in it')
    wrapper.unmount()
  })

  it('⭐ Home keeps a SHORT read – the long sentence stays off it (round 39 #2a)', () => {
    // ⚠ THE MID THIRD: the plate rotates on the season's own phase and the body clause is the
    // middle of that rotation. A fixture that named no week would be asserting something true of
    // every week of the year, which is a stronger claim than #2b's design makes.
    const world = inWindow(1, { seasonWeek: 20 })
    const w = mountHome(world)
    const plate = w.find('.coach-room-short')
    expect(plate.exists(), 'Home lost its short plate').toBe(true)
    expect(said(plate.text())).toContain('her last winter is next')
    // The long sentence may not follow it onto Home – #2a's whole ruling.
    expect(w.text()).not.toContain('no coach buys that back')
    w.unmount()
  })
})

// --- 4. ⭐ THE MOUNTED FORM OF THE ONE-DERIVATION PIN ---------------------------------------------

const setBand = (value: number): void => {
  ;(ENDINGS as unknown as { lastOfferPeakShare: number }).lastOfferPeakShare = value
}
const SHIPPED_BAND = ENDINGS.lastOfferPeakShare

describe('round 40 #14b (4) – move the target and every screen moves', () => {
  beforeEach(() => setActivePinia(createPinia()))
  afterEach(() => setBand(SHIPPED_BAND))

  it('⭐⭐ the coach card, the winter card and the wrap follow ONE derivation', async () => {
    // A career clear of the band: nothing is on any of the three.
    const world = createWorld('r40-lw-pin', { ...DEFAULT_PROFILE, coachTier: 'middle' })
    world.week = Math.round((41 - 14) * WEEKS_PER_YEAR) + 20
    world.peakPhysical = physicalMean(world.skills) / 0.72
    world.seasonHistory = [season(20, 125)]
    expect(lastWinterIn(world), 'the fixture is inside the window already').toBeNull()

    const quiet = await mountMarketCoaches(world)
    expect(quiet.find('.cm-row.current .cm-decline').text()).not.toContain('last winter')
    quiet.unmount()

    // ⚠ RAISE THE BAND: the same body, a nearer end. Every surface has to move, and to the SAME
    // number – a screen holding its own walk or its own threshold fails exactly here.
    let n: number | null = null
    for (let band = SHIPPED_BAND + 0.01; band < 0.72 && n === null; band += 0.01) {
      setBand(band)
      n = lastWinterIn(world)
    }
    expect(n, 'the band moved and the derivation did not follow').not.toBeNull()

    const loud = await mountMarketCoaches(world)
    expect(loud.find('.cm-row.current .cm-decline').text(), 'the coach card did not follow').toContain('last winter')
    loud.unmount()

    // The two off-season surfaces are handed the number the way the shell hands it to them.
    const snap = toSnapshot(world)
    expect(snap.lastWinterIn, 'the wire did not follow the derivation').toBe(n)
    useGameStore().snapshot = { ...snap, retirementOffer: { ...AGE } }
    const card = mount(RetirementDialog)
    expect(said(card.get('.retire-last-winter').text()), 'her card reads a second derivation').toBe(herLastWinterLine(n))
    card.unmount()

    useGameStore().snapshot = { ...snap, lastSeasonSummary: SUMMARY }
    const wrapCard = mount(SeasonSummaryDialog, { global: { stubs: { teleport: true } } })
    expect(said(wrapCard.get('.season-last-winter').text()), 'the wrap reads a second derivation').toBe(
      seasonLastWinterLine(n),
    )
    wrapCard.unmount()
  })
})

// --- 5. AND IT ALL STILL FITS A PHONE -------------------------------------------------------------
//
// CLAUDE.md's standing gotcha: «any dialog you add or lengthen gets a mounted assertion that its
// dismiss control's box is inside a 375x667 viewport». Both dialogs grew by one sentence here, and
// the two-winter form is the longer of the two counts on each.
describe('round 40 #14b (5) – the two dialogs that grew still fit a phone', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('the winter card, with the rung, her season word and the warning all on it', () => {
    setViewport(PHONE)
    showOffer(AGE, {
      lastWinterIn: 2,
      physicalShare: 0.6,
      seasonHistory: [season(24, 20), season(25, 68), season(26, 125)],
      coachMarket: [{ id: 'c1', name: 'Marco Ricci', current: true }],
    })
    const w = mount(RetirementDialog, { attachTo: document.body })
    expect(w.find('.retire-last-winter').exists(), 'the tallest card is missing the new line').toBe(true)
    expect(w.find('.retire-rung').exists(), 'the tallest card is missing the rung').toBe(true)
    assertDismissReachable(w.get('.retire-card').element, w.get('.retire-answers').element, PHONE, 'RetirementDialog (last winter)')
    w.unmount()
  })

  it('the season wrap, with her line and the warning on it', () => {
    setViewport(PHONE)
    wrap({ lastWinterIn: 2 })
    const w = mount(SeasonSummaryDialog, { global: { stubs: { teleport: true } }, attachTo: document.body })
    expect(w.find('.season-last-winter').exists(), 'the tallest wrap is missing the new line').toBe(true)
    assertDismissReachable(w.get('.season-summary').element, w.get('.dialog-actions').element, PHONE, 'SeasonSummaryDialog (last winter)')
    w.unmount()
  })
})
