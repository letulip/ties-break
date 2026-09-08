// =================================================================================================
// ⭐⭐⭐ ROUND 39 #2a/#2b/#13c – THE DECLINE READ CHANGES ADDRESS: long on the coach card, short on Home
// =================================================================================================
//
// The owner, 08.09, reading round 38's sentence on Home: «„Past her peak – down 57 places on the
// year, and her body has about 6 more seasons in it." – вот это как раз можно на карточку тренера в
// списке тренеров перенести, много текста. А вот на home хотелось бы увидеть что-то короткое, емкое
// и яркое (в плане цвета), как было до этого про потолок и прочее.»
//
// So: #2a – the LONG sentence renders on the CURRENT coach's card in the market list and no longer
// on Home. #2b – Home keeps a SHORT plate of the same state, in the old ceiling plate's treatment
// (11px / 600 / accent – round 24's own measured register). #13c – «down 1 places» gains a singular,
// pinned here at the engine level where the sentence is written.
//
// ⚠ EVERY COPY ASSERTION IS READ AS RENDERED off a mounted component, r38-decline-voice's rule; the
// engine-level arms (#13c, the short wording) read the same functions the snapshot wires.
import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import { createPinia, setActivePinia } from 'pinia'
// The real stylesheet: the market card's classes and the root tokens live here.
import '../../src/style.css'
import HomeScreen from '../../src/components/screens/HomeScreen.vue'
import CoachMarketScreen from '../../src/components/screens/CoachMarketScreen.vue'
import { useGameStore } from '../../src/stores/game'
import { createWorld, toSnapshot } from '../../src/engine/world'
import type { WorldState } from '../../src/engine/world'
import { coachDeclineNote, coachDeclineShort } from '../../src/engine/world/coachMarket'
import { physicalMean } from '../../src/engine/development'
import { DEFAULT_PROFILE } from '../../src/shared/protocol'
import type { SeasonHistoryEntry, SeasonTrackRow } from '../../src/shared/protocol'
import type { LadderTrack } from '../../src/engine/season/types'

// ⚠ THIS RUNNER HAS NO localStorage AND HomeScreen READS IT – the same shim r38-decline-voice and
// round24-coach-card carry, for the reason quoted there in full.
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

const EMPTY_ROW: SeasonTrackRow = { points: 0, wins: 0, losses: 0 }
function season(seasonIndex: number, wtaRank: number | null): SeasonHistoryEntry {
  const byTrack = {
    domestic: { ...EMPTY_ROW },
    itf: { ...EMPTY_ROW },
    wta: wtaRank === null ? { ...EMPTY_ROW } : { ...EMPTY_ROW, endRank: wtaRank },
  } as Record<LadderTrack, SeasonTrackRow>
  return {
    seasonIndex,
    endRank: wtaRank ?? 0,
    points: 0,
    wins: 0,
    losses: 0,
    fundsDeltaCents: 0,
    endFundsCents: 0,
    byTrack,
  }
}

/** r38-decline-voice's fixture shape: a career past its peak, with the ranks under the test's own
 *  hand. `coachTier` decides whether the market list has a `current` card to carry the sentence. */
function pastPeakWorld(opts: { seasons: SeasonHistoryEntry[]; share?: number; ageYears?: number; coachTier?: 'middle' | 'self' }): WorldState {
  const world = createWorld('r39-surfaces', { ...DEFAULT_PROFILE, coachTier: opts.coachTier ?? 'middle' })
  const years = opts.ageYears ?? 35
  world.week = Math.round((years - 14) * 52)
  world.peakPhysical = physicalMean(world.skills) / (opts.share ?? 0.8)
  world.seasonHistory = opts.seasons
  return world
}

function mountHome(world: WorldState) {
  const store = useGameStore()
  store.snapshot = toSnapshot(world)
  return mount(HomeScreen, { props: { recapFresh: false }, global: { stubs: { teleport: true } } })
}

async function mountMarketCoaches(world: WorldState) {
  const store = useGameStore()
  store.snapshot = toSnapshot(world)
  const wrapper = mount(CoachMarketScreen, { global: { stubs: { teleport: true } } })
  const pill = wrapper.findAll('.tb-seg .tab-pill').find((b) => b.text() === 'Coaches')
  await pill!.trigger('click')
  await nextTick()
  return wrapper
}

const PAST_PEAK = () => pastPeakWorld({ seasons: [season(16, 20), season(19, 68), season(20, 125)] })

describe('round 39 #2a – the long sentence lives on the current coach card in the list', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('⭐⭐ THE ITEM: the current card carries the whole engine sentence, as rendered', async () => {
    const world = PAST_PEAK()
    const snapshot = toSnapshot(world)
    const wrapper = await mountMarketCoaches(world)
    const row = wrapper.find('.cm-row.current')
    expect(row.exists(), 'no current-coach card in the list – the fixture must hire one').toBe(true)
    const line = row.find('.cm-decline')
    expect(line.exists(), 'the decline read is not on his card').toBe(true)
    // The screen owns the emphasis and the engine owns the words – the market rule since round 23.
    expect(line.text().replace(/\s+/g, ' ').trim()).toBe(snapshot.coachDeclineNote.replace(/\s+/g, ' ').trim())
    // ...and it really is the LONG form: the rank move and the body clause, both.
    expect(line.text()).toContain('down 57 places on the year')
    expect(line.text()).toMatch(/her body has about \d+ more seasons? in it/)
    wrapper.unmount()
  })

  it('⭐ ...and the hint above the list stands down rather than saying it twice', async () => {
    const wrapper = await mountMarketCoaches(PAST_PEAK())
    // The same screen may not print the same sentence twice: while his card carries it, the
    // headroom hint (which falls through to the decline read since round 38 #7b) renders nothing.
    expect(wrapper.find('.cm-room-note').exists()).toBe(false)
    expect(wrapper.findAll('.cm-decline')).toHaveLength(1)
    wrapper.unmount()
  })

  it('⭐ self-coached: no card to carry it, so the fallthrough above the list keeps the read', async () => {
    const world = pastPeakWorld({ seasons: [season(19, 68), season(20, 125)], coachTier: 'self' })
    const wrapper = await mountMarketCoaches(world)
    expect(wrapper.find('.cm-row.current').exists(), 'a self-coached market has no current row').toBe(false)
    const hint = wrapper.find('.cm-room-note')
    expect(hint.exists(), 'the decline read vanished with the coach – round 38 #7b regressed').toBe(true)
    expect(hint.text()).toContain('Past her peak')
    wrapper.unmount()
  })

  it('⚠ a growing career still reads a headroom band above the list, and no card carries a verdict', async () => {
    const world = createWorld('r39-young', { ...DEFAULT_PROFILE, coachTier: 'middle' })
    world.seasonHistory = [season(0, 411), season(1, 198)]
    const wrapper = await mountMarketCoaches(world)
    expect(wrapper.find('.cm-room-band').exists(), 'round 23/24: the band left the market screen').toBe(true)
    expect(wrapper.find('.cm-decline').exists(), 'a decline verdict on a growing career').toBe(false)
    wrapper.unmount()
  })
})

describe('round 39 #2b – Home keeps the short plate, in the old ceiling plate treatment', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('⭐⭐ THE ITEM: the short form renders, the long form does not', () => {
    const world = PAST_PEAK()
    const snapshot = toSnapshot(world)
    const wrapper = mountHome(world)
    const plate = wrapper.find('.coach-decline-short')
    expect(plate.exists(), 'no short plate on Home').toBe(true)
    expect(plate.text().replace(/\s+/g, ' ').trim()).toBe(snapshot.coachDeclineShort.replace(/\s+/g, ' ').trim())
    expect(plate.text().startsWith('Past her peak – ')).toBe(true)
    expect(plate.text()).toContain('down 57 places on the year')
    // the LONG sentence's tell – the body clause – may not be on Home any more (#2a)
    expect(wrapper.find('.coach-decline').exists(), 'the round-38 long paragraph is still rendered').toBe(false)
    expect(wrapper.get('.coach-card').text()).not.toContain('more seasons in it')
    wrapper.unmount()
  })

  it('⭐ ...with the colour class APPLIED through the real cascade – the plate is accent, weight 600', () => {
    // The owner asked for «яркое (в плане цвета), как было до этого про потолок»; the old plate's
    // rule (round 24, `.coach-room`) was 11px / 600 / var(--accent). Read the computed style off the
    // mounted element so a deleted or misspelled rule fails here rather than shipping grey.
    // ⚠ attachTo: the cascade is only real for elements that are IN the document – the same rule
    // birthday-dialog.test.ts records; an off-document mount computes color as ''.
    const store = useGameStore()
    store.snapshot = toSnapshot(PAST_PEAK())
    const wrapper = mount(HomeScreen, {
      props: { recapFresh: false },
      attachTo: document.body,
      global: { stubs: { teleport: true } },
    })
    const el = wrapper.get('.coach-decline-short').element as HTMLElement
    const style = getComputedStyle(el)
    const accent = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim()
    expect(accent, 'the app stylesheet did not load – the measurement would be vacuous').not.toBe('')
    const painted = style.color.trim()
    expect(
      painted === accent || painted.replace(/\s+/g, '') === accent.replace(/\s+/g, ''),
      `the plate is not accent-coloured: color="${painted}", --accent="${accent}"`,
    ).toBe(true)
    expect(style.fontWeight, 'the plate lost the old treatment weight').toBe('600')
    wrapper.unmount()
  })

  it('⚠ a growing fourteen-year-old sees no plate – round 34 #2a holds for the short form too', () => {
    const world = createWorld('r39-home-young', { ...DEFAULT_PROFILE, coachTier: 'middle' })
    world.seasonHistory = [season(0, 411), season(1, 198)]
    const wrapper = mountHome(world)
    expect(wrapper.find('.coach-decline-short').exists()).toBe(false)
    expect(wrapper.get('.coach-card').text()).not.toContain('Past her peak')
    // non-vacuity: the card itself rendered
    expect(wrapper.get('.coach-line').text()).not.toBe('')
    wrapper.unmount()
  })

  it('⚠ the three short arms follow the long note arm for arm, one derivation under both', () => {
    // fell on the year -> the year clause; above yearly fall -> best season; at her best -> seasons.
    const fell = pastPeakWorld({ seasons: [season(19, 68), season(20, 125)] })
    expect(coachDeclineShort(fell)).toBe('Past her peak – down 57 places on the year')
    const belowBest = pastPeakWorld({ seasons: [season(16, 20), season(20, 125)] })
    expect(coachDeclineShort(belowBest)).toBe('Past her peak – 105 places below her best')
    const atBest = pastPeakWorld({ seasons: [season(20, 30)] })
    expect(coachDeclineShort(atBest)).toMatch(/^Past her peak – about \d+ seasons? left$/)
    // ...and each is the compressed clause of the long sentence on the same world, never a new fact.
    expect(coachDeclineNote(fell)).toContain('down 57 places on the year')
    expect(coachDeclineNote(belowBest)).toContain('105 places below her best season')
    expect(coachDeclineNote(atBest)).toContain('no coach buys that back')
  })
})

describe('round 39 #13c – «down 1 place», singular, in both rank arms', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('⭐ down 1 place / down 2 places – the year arm', () => {
    const one = pastPeakWorld({ seasons: [season(19, 8), season(20, 9)] })
    expect(coachDeclineNote(one)).toContain('down 1 place on the year')
    expect(coachDeclineNote(one)).not.toContain('1 places')
    expect(coachDeclineShort(one)).toBe('Past her peak – down 1 place on the year')
    const two = pastPeakWorld({ seasons: [season(19, 8), season(20, 10)] })
    expect(coachDeclineNote(two)).toContain('down 2 places on the year')
    expect(coachDeclineShort(two)).toBe('Past her peak – down 2 places on the year')
  })

  it('⚠ ...and the best-season arm, which had the identical defect one clause over', () => {
    // a gap between the seasons refuses the year arm, so the best-season arm speaks
    const one = pastPeakWorld({ seasons: [season(16, 8), season(20, 9)] })
    expect(coachDeclineNote(one)).toContain('1 place below her best season')
    expect(coachDeclineNote(one)).not.toContain('1 places')
    expect(coachDeclineShort(one)).toBe('Past her peak – 1 place below her best')
  })
})
