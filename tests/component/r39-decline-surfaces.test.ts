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
// ⚠⚠ #2b RE-AIMED BY THE REOPEN (owner, 08.09), ruling on wave A's three draft arms: «Past her peak
// хорошо и коротко, остальное всё пусть на карточке тренера живет, может быть разве что – about 4
// seasons left еще можно оставить. И до этого были фразочки про то, что ей недалеко до потолка, что
// потолок достигнут и прочее, вот это тоже всё-таки можно показывать буквально в 3-5 слов на home».
// So the plate (now `.coach-room-short`, `Snapshot.coachRoomShort` behind it) says «Past her peak –
// about N seasons left» past her peak – the two rank arms live on the coach card's long sentence
// ALONE – and a GROWING career's headroom band in 3-5 words the rest of the career. Exactly one of
// the two reads at a time; the engine-side derivation pins live in tests/r39-coach-short.test.ts.
//
// ⚠⚠ AND RE-AIMED AGAIN BY THE SECOND REOPEN (owner, 08.09, on the static sentence that produced):
// «слушай, а можно же чередовать как раз на спаде эти фразочки … «she's down N places» в начале
// сезона, например или в конце наоборот, «she's below her best» … это даст живости и вариативности,
// уберет статичность». The DECLINE half of the plate now rotates on the season's own third – early
// his year clause, late his below-best ladder, mid the clause he kept – so every arm here that
// wants one particular sentence NAMES its week, and the guards that hold in every phase (no long
// clause on Home, no verdict on a child, the plate's colour) are swept across all three. The
// GROWING half is untouched. Nothing was deleted; the ⚠ notes on each arm say what moved and why.
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
import { coachDeclineNote, coachDeclineShort, coachRoomBandOf, coachRoomBandShort } from '../../src/engine/world/coachMarket'
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
 *  hand. `coachTier` decides whether the market list has a `current` card to carry the sentence.
 *
 *  ⚠⚠ `seasonWeek` JOINED THE FIXTURE ON THE 08.09 RE-REOPEN – Home's plate rotates on where the
 *  week sits in its season, so an arm that wants one particular sentence has to name its phase.
 *  `(years - 14) * 52` is a whole number of seasons, so the default is season-week 0 = the EARLY
 *  third. The market list's LONG sentence does not rotate, so #2a's arms below name nothing. */
const MID_SEASON_WEEK = 20
const LATE_SEASON_WEEK = 51
function pastPeakWorld(opts: {
  seasons: SeasonHistoryEntry[]
  share?: number
  ageYears?: number
  coachTier?: 'middle' | 'self'
  seasonWeek?: number
}): WorldState {
  const world = createWorld('r39-surfaces', { ...DEFAULT_PROFILE, coachTier: opts.coachTier ?? 'middle' })
  const years = opts.ageYears ?? 35
  world.week = Math.round((years - 14) * 52) + (opts.seasonWeek ?? 0)
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

/** All three decline variants true at once: s19 #68 → s20 #125 is a 57-place year, and the career
 *  best #20 is 105 places up. The default week is season-week 0 – the early third. */
const PAST_PEAK = (seasonWeek = 0) =>
  pastPeakWorld({ seasons: [season(16, 20), season(19, 68), season(20, 125)], seasonWeek })

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

  it('⭐⭐ THE ITEM: mid-season the plate is the seasons clause, and nothing longer (⚠ re-aimed: MID)', () => {
    // ⚠ RE-AIMED 08.09: wave A's draft rendered «down 57 places on the year» here and the owner
    // ruled the rank arms off Home – «остальное всё пусть на карточке тренера живет, может быть
    // разве что – about 4 seasons left еще можно оставить». The fixture still FELL 57 places on
    // the year, so a plate that reaches for the rank fact goes red below, not merely different.
    //
    // ⚠⚠ RE-AIMED AGAIN BY THE RE-REOPEN (08.09) AND THE GUARD IS INTACT – it names its week now.
    // He asked the plate to rotate («чередовать … уберет статичность»), and the clause he kept holds
    // the MIDDLE third; the long form's tells – the body clause and the LONG rank clause – are still
    // barred from Home in every phase, which is what the arm below the rotation one sweeps.
    const world = PAST_PEAK(MID_SEASON_WEEK)
    const snapshot = toSnapshot(world)
    const wrapper = mountHome(world)
    const plate = wrapper.find('.coach-room-short')
    expect(plate.exists(), 'no short plate on Home').toBe(true)
    expect(plate.text().replace(/\s+/g, ' ').trim()).toBe(snapshot.coachRoomShort.replace(/\s+/g, ' ').trim())
    expect(plate.text()).toMatch(/^Past her peak – about \d+ seasons? left$/)
    // the LONG rank clauses live on the coach card's long sentence ALONE, in every phase
    expect(plate.text()).not.toContain('down 57 places on the year')
    expect(plate.text()).not.toContain('places below her best season')
    // the LONG sentence's tell – the body clause – may not be on Home any more (#2a)
    expect(wrapper.find('.coach-decline').exists(), 'the round-38 long paragraph is still rendered').toBe(false)
    expect(wrapper.get('.coach-card').text()).not.toContain('more seasons in it')
    expect(wrapper.get('.coach-card').text()).not.toContain('places')
    wrapper.unmount()
  })

  it('⭐⭐⭐ THE RE-REOPEN, AS RENDERED: the plate says three different things across the season', () => {
    // The owner, 08.09, on the single sentence wave A2 shipped: «слушай, а можно же чередовать как
    // раз на спаде эти фразочки … «she's down N places» в начале сезона, например или в конце
    // наоборот, «she's below her best» … это даст живости и вариативности, уберет статичность».
    // The engine-side sweep is tests/r39-coach-short.test.ts; what this arm proves is that HOME
    // renders whichever sentence the engine chose, at three weeks of one career.
    const seen: string[] = []
    for (const [phase, sw] of [
      ['early', 0],
      ['mid', MID_SEASON_WEEK],
      ['late', LATE_SEASON_WEEK],
    ] as const) {
      setActivePinia(createPinia())
      const world = PAST_PEAK(sw)
      const snapshot = toSnapshot(world)
      const wrapper = mountHome(world)
      const plate = wrapper.find('.coach-room-short')
      expect(plate.exists(), `${phase}: no plate`).toBe(true)
      const text = plate.text().replace(/\s+/g, ' ').trim()
      // the screen prints the engine's own field and adds no condition of its own
      expect(text, `${phase}: the screen and the engine disagree`).toBe(snapshot.coachRoomShort.replace(/\s+/g, ' ').trim())
      seen.push(text)
      // whichever sentence it is, the long form's tells stay off Home in every phase
      expect(wrapper.get('.coach-card').text(), `${phase}: the body clause is on Home`).not.toContain('more seasons in it')
      expect(wrapper.get('.coach-card').text(), `${phase}: the long year clause is on Home`).not.toContain('on the year')
      expect(wrapper.find('.coach-decline').exists(), `${phase}: the round-38 paragraph came back`).toBe(false)
      wrapper.unmount()
    }
    // HIS ASK, AS RENDERED: not one sentence three times.
    expect(new Set(seen).size, `the plate is still static: ${seen.join(' | ')}`).toBe(3)
    expect(seen[0], 'early is not his year clause').toBe("she's down 57 places")
    expect(seen[1], 'mid is not the clause he kept').toMatch(/^Past her peak – about \d+ seasons? left$/)
    expect(seen[2], 'late is not his below-best clause').toMatch(/^she's (below|far below|way below) her best$/)
  })

  it('⭐ ...with the colour class APPLIED through the real cascade – the plate is accent, weight 600, on BOTH reads', () => {
    // The owner asked for «яркое (в плане цвета), как было до этого про потолок»; the old plate's
    // rule (round 24, `.coach-room`) was 11px / 600 / var(--accent). Read the computed style off the
    // mounted element so a deleted or misspelled rule fails here rather than shipping grey.
    // ⚠ attachTo: the cascade is only real for elements that are IN the document – the same rule
    // birthday-dialog.test.ts records; an off-document mount computes color as ''.
    // ⚠ RE-AIMED 08.09: the plate carries either read now, so BOTH states are measured – the
    // renamed selector missing from either the template or the stylesheet ships grey and fails here.
    // ⚠ WIDENED BY THE RE-REOPEN: every phase of the rotation is measured, because «яркое» is about
    // the plate and not about which of his sentences is in it – a variant rendered outside the
    // plate's own element would read grey and pass the string arms above.
    const growing = createWorld('r39-colour-young', { ...DEFAULT_PROFILE, coachTier: 'middle' })
    for (const [state, world] of [
      ['declining (early)', PAST_PEAK(0)],
      ['declining (mid)', PAST_PEAK(MID_SEASON_WEEK)],
      ['declining (late)', PAST_PEAK(LATE_SEASON_WEEK)],
      ['growing', growing],
    ] as const) {
      setActivePinia(createPinia())
      const store = useGameStore()
      store.snapshot = toSnapshot(world)
      const wrapper = mount(HomeScreen, {
        props: { recapFresh: false },
        attachTo: document.body,
        global: { stubs: { teleport: true } },
      })
      const el = wrapper.get('.coach-room-short').element as HTMLElement
      expect(el.textContent?.trim(), `${state}: an empty plate would make the measurement vacuous`).not.toBe('')
      const style = getComputedStyle(el)
      const accent = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim()
      expect(accent, 'the app stylesheet did not load – the measurement would be vacuous').not.toBe('')
      const painted = style.color.trim()
      expect(
        painted === accent || painted.replace(/\s+/g, '') === accent.replace(/\s+/g, ''),
        `${state}: the plate is not accent-coloured: color="${painted}", --accent="${accent}"`,
      ).toBe(true)
      expect(style.fontWeight, `${state}: the plate lost the old treatment weight`).toBe('600')
      wrapper.unmount()
    }
  })

  it('⚠ a growing fourteen-year-old sees the band short – and never a verdict (⚠ re-aimed, the 08.09 reopen)', () => {
    // ⚠ RE-AIMED 08.09: wave A pinned NO plate of either length here, and the owner reversed the
    // growing half by his own word – «И до этого были фразочки про то, что ей недалеко до потолка…
    // вот это тоже всё-таки можно показывать буквально в 3-5 слов на home». What this arm still
    // guards is the round-34 core: no ageing verdict on a child (the decline gate), no digit (the
    // fog rule), and nothing invented – the plate is the engine's own band row, in 3-5 words.
    const world = createWorld('r39-home-young', { ...DEFAULT_PROFILE, coachTier: 'middle' })
    world.seasonHistory = [season(0, 411), season(1, 198)]
    const wrapper = mountHome(world)
    const plate = wrapper.find('.coach-room-short')
    expect(plate.exists(), 'the growing read the owner asked back is not rendered').toBe(true)
    expect(plate.text().replace(/\s+/g, ' ').trim()).toBe(coachRoomBandShort(coachRoomBandOf(world)!))
    expect(plate.text()).not.toContain('Past her peak')
    expect(plate.text(), 'a figure leaked onto a growing career\'s plate').not.toMatch(/\d/)
    expect(wrapper.get('.coach-card').text()).not.toContain('Past her peak')
    // non-vacuity: the card itself rendered
    expect(wrapper.get('.coach-line').text()).not.toBe('')
    wrapper.unmount()
  })

  it('⚠ the short follows the long note\'s own seasons figure – one derivation under both (⚠ re-aimed twice)', () => {
    // ⚠ RE-AIMED 08.09: wave A's three draft arms compressed three different clauses, and the owner
    // kept ONE – «может быть разве что – about 4 seasons left еще можно оставить». All three worlds
    // that used to pick three arms now read the seasons clause, with the long sentence keeping its
    // three arms on the coach card; the full engine-side sweep is tests/r39-coach-short.test.ts.
    // ⚠⚠ RE-AIMED AGAIN BY THE RE-REOPEN: MID season, where the seasons clause is the phase's own
    // variant. The claim – that the plate's N is the LONG sentence's N, one derivation under both –
    // is unchanged and is what the arm still measures.
    const fell = pastPeakWorld({ seasons: [season(19, 68), season(20, 125)], seasonWeek: MID_SEASON_WEEK })
    const belowBest = pastPeakWorld({ seasons: [season(16, 20), season(20, 125)], seasonWeek: MID_SEASON_WEEK })
    const atBest = pastPeakWorld({ seasons: [season(20, 30)], seasonWeek: MID_SEASON_WEEK })
    for (const world of [fell, belowBest, atBest]) {
      const long = coachDeclineNote(world).match(/about (\d+) more seasons? in it/)
      expect(long).not.toBeNull()
      const n = Number(long![1])
      expect(coachDeclineShort(world)).toBe(`Past her peak – about ${n} ${n === 1 ? 'season' : 'seasons'} left`)
    }
    // ...and the long note still distinguishes the three worlds – the arms moved, they did not die.
    expect(coachDeclineNote(fell)).toContain('down 57 places on the year')
    expect(coachDeclineNote(belowBest)).toContain('105 places below her best season')
    expect(coachDeclineNote(atBest)).toContain('no coach buys that back')
  })
})

describe('round 39 #13c – «down 1 place», singular, in both rank arms', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('⭐ down 1 place / down 2 places – the year arm, in BOTH lengths (⚠ re-aimed twice)', () => {
    // ⚠ RE-AIMED 08.09 (#2b reopen): the SHORT no longer carries the rank clauses at all – they
    // live in the long sentence alone – so the singular pins hold where the words still are, and
    // the short is pinned NOT to reach for the rank fact on exactly the world that has one. The
    // short's own singular («about 1 season left») is pinned in tests/r39-coach-short.test.ts.
    // ⚠⚠ RE-AIMED AGAIN BY THE RE-REOPEN, AND THE ARM GREW RATHER THAN SHRANK: the year clause is
    // back on Home in his shorter phrasing («she's down N places») for the EARLY third, so #13c's
    // singular now has to hold in two places and both are pinned. The mid-season arm keeps the
    // «no rank fact in the plate» guard exactly where the seasons clause is the engine's answer.
    const one = pastPeakWorld({ seasons: [season(19, 8), season(20, 9)] })
    expect(coachDeclineNote(one)).toContain('down 1 place on the year')
    expect(coachDeclineNote(one)).not.toContain('1 places')
    expect(coachDeclineShort(one), 'the short lost #13c\'s singular').toBe("she's down 1 place")
    const oneMid = pastPeakWorld({ seasons: [season(19, 8), season(20, 9)], seasonWeek: MID_SEASON_WEEK })
    expect(coachDeclineShort(oneMid)).not.toContain('place')
    expect(coachDeclineShort(oneMid)).toMatch(/^Past her peak – about \d+ seasons? left$/)
    const two = pastPeakWorld({ seasons: [season(19, 8), season(20, 10)] })
    expect(coachDeclineNote(two)).toContain('down 2 places on the year')
    expect(coachDeclineShort(two)).toBe("she's down 2 places")
    expect(coachDeclineShort(pastPeakWorld({ seasons: [season(19, 8), season(20, 10)], seasonWeek: MID_SEASON_WEEK }))).not.toContain('places')
  })

  it('⚠ ...and the best-season arm, which had the identical defect one clause over', () => {
    // a gap between the seasons refuses the year arm, so the best-season arm speaks
    const one = pastPeakWorld({ seasons: [season(16, 8), season(20, 9)] })
    expect(coachDeclineNote(one)).toContain('1 place below her best season')
    expect(coachDeclineNote(one)).not.toContain('1 places')
    // ⚠ re-aimed 08.09: the LONG best-season clause is the card's alone – Home's own below-best
    // phrasing is his digitless one, so #13c cannot reach it and the guard is that no COUNT of
    // places ever appears beside «below her best» on the plate.
    const late = pastPeakWorld({ seasons: [season(16, 8), season(20, 9)], seasonWeek: LATE_SEASON_WEEK })
    expect(coachDeclineShort(late)).toMatch(/^she's (below|far below|way below) her best$/)
    expect(coachDeclineShort(late), 'a count leaked into the plate\'s below-best clause').not.toMatch(/\d/)
    // ...and mid-season the clause is not reached for at all.
    expect(coachDeclineShort(pastPeakWorld({ seasons: [season(16, 8), season(20, 9)], seasonWeek: MID_SEASON_WEEK }))).not.toContain(
      'below her best',
    )
  })
})
