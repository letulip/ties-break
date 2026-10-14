// r51 №7 (13.10) – THE HIRED COACH'S SENTENCE ABOUT A TRIP, UNDER A RUSSIAN LOCALE, MOUNTED. The owner: «Your coach would save her... нет перевода ни в попапе при заявке, ни на самой карточке в Сезоне».
//
// WHAT WAS WRONG. The engine wrote the sentence as finished English into `UpcomingEvent.coachCaution` and four screens printed that string: the entry confirm (two message shapes), Season's card, the next-tournament panel and the
// Calendar's marker card. The sentence now arrives ALSO as a ref (`coachCautionC`), and all four read it through `coachCautionText` (composables/eventCard.ts) – the engine's ref rendered under the player's locale, the string where there is no ref.
//
// WHAT THIS FILE ASKS, AND WHY EACH ARM CAN FAIL.
//   · FOUR SURFACES × the engine's own card (the owner's own sentence, «would save her for the…») and a posed tired-body line: the text the screen prints is the EXPECTED RUSSIAN – built here from ru.json rows by hand, hole by hole, not
//     by calling the renderer the screen calls (so a hole reader that stops reading the table's word, or a row that stops compiling, reds a surface even if the screen is wired right) – and no English word survives in it once the
//     tournament's own name (raw, like every name in the app) is taken out;
//   · TEN REFS on one surface, each of the engine's sentences posed onto a real card (two of them – «will not move anything», «even a title here would not move her ranking» – cannot be reached through the engine in any pose that
//     leaves the card open: the gate locks it first, see the characterisation arm in tests/i18n-coach-caution.test.ts, so they are posed here the way the brief asked);
//   · THE ENTRY CONFIRM'S BOTH SHAPES: `{caution} Enter {event} ({week}, {surface})? {fee}` (only the coach objects) and `… anyway? …` (she is also under the rung, the sentence is spliced before the engine's fatigue line);
//   · ENGLISH IS BYTE-IDENTICAL on every surface, and a card with a string but no ref (an old snapshot) still prints the string.
//
// ⚠ NO CYRILLIC IS TYPED HERE: every Russian expectation is read from the real src/i18n/ru.json by key, so a re-worded row follows the screen instead of reddening it, and an absent row fails loudly.
// ⚠ RE-AIMED 13.10 (architect): the entry confirm's FATIGUE HALF is now under test too – `cautionDetail` (the fatigue gate's own sentence, engine/world/medical.ts) crosses through engineText at both sinks (SeasonScreen askEnter, CalendarScreen caution-note) since the same-day architect tail after B4 reported it raw.
//   The arm below asserts the coach's half is Russian and says nothing about the half after it.
// ⚠ MUTATION-VERIFIED 13.10 – see the commit message for the three runs (the three screens put back to `{{ x.coachCaution }}`; the snapshot putting `coachCautionC` back off the wire; the hole-table row removed).
// ⚠ CUT 14.10 (r52, the radar law – scripts/units.mjs): the header's «TEN REFS» arm, and only it, lives in i18n-r51-b4-coach-caution-poses.test.ts now. This file keeps the four surfaces, the tired-body sentence and the seams around the ref – so it still mounts the Calendar, which tests/calendar-screen.test.ts names. What the halves share is tests/helpers/coachCautionSurfaces.ts.
import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import CalendarScreen from '../../src/components/screens/CalendarScreen.vue'
import NextTournamentPanel from '../../src/components/NextTournamentPanel.vue'
import { useGameStore } from '../../src/stores/game'
import { toSnapshot } from '../../src/engine/world'
import { TIERS } from '../../src/engine/season/calendar'
import type { Snapshot, UpcomingEvent } from '../../src/shared/protocol'
import { mountSeason } from '../helpers/mountSeason'
import { LEGACY } from '../helpers/coachCautionPoses'
import { aheadCard, cardOf, expectedRu, inRussian, LATIN_WORD, namesIn, posed, RU, useCautionLifecycle, withoutNames } from '../helpers/coachCautionSurfaces'
import { EVENT_ID, tiredWithACoach } from '../helpers/r41EntryWarning'

useCautionLifecycle()

// --- the cards ------------------------------------------------------------------------------------------------------

/** A tired career with a hired coach, the fixture's one National as the only card (the round-41 idiom: the feed narrowed to the card under test). */
function tiredCard(): { snap: Snapshot; card: UpcomingEvent } {
  const { world } = tiredWithACoach('r51-b4-tired-ui')
  const full = toSnapshot(world)
  const mine = full.upcoming.filter((u) => u.id === EVENT_ID)
  expect(mine.length, 'the fixture event is inside the horizon').toBe(1)
  expect(mine[0]!.coachCaution, 'precondition: he says the «empty» line').toBe(LEGACY.empty)
  return { snap: { ...full, upcoming: mine }, card: mine[0]! }
}

// --- the four surfaces ----------------------------------------------------------------------------------------------

interface Read {
  /** What the surface prints of his sentence (the confirm prints it inside a longer message, so that one is read whole). */
  text: string
  whole: boolean
}
const SURFACES: Array<[string, (snap: Snapshot, card: UpcomingEvent) => Promise<Read>]> = [
  [
    'Season card',
    async (snap, card) => {
      const w = mountSeason(snap)
      const note = cardOf(w, TIERS[card.tier].label).find('.coach-note')
      expect(note.exists(), 'the card prints a coach note').toBe(true)
      const text = note.text()
      w.unmount()
      return { text, whole: true }
    },
  ],
  [
    'entry confirm',
    async (snap, card) => {
      const w = mountSeason(snap)
      const enter = cardOf(w, TIERS[card.tier].label)
        .findAll('button')
        .find((b) => b.classes().includes('primary'))
      expect(enter, 'the card has its Enter control').toBeTruthy()
      await enter!.trigger('click')
      const dialog = w.find('.dialog-card')
      expect(dialog.exists(), 'the confirm opened').toBe(true)
      const text = dialog.find('.dialog-message').text()
      w.unmount()
      return { text, whole: false }
    },
  ],
  [
    'next-tournament panel',
    async (snap, card) => {
      useGameStore().snapshot = snap
      const w = mount(NextTournamentPanel, { props: { event: snap.upcoming.find((e) => e.id === card.id)! }, global: { stubs: { teleport: true } }, attachTo: document.body })
      const note = w.find('.coach-note')
      expect(note.exists(), 'the panel prints a coach note').toBe(true)
      const text = note.text()
      w.unmount()
      return { text, whole: true }
    },
  ],
  [
    'Calendar card',
    async (snap, card) => {
      useGameStore().snapshot = snap
      const w = mount(CalendarScreen, { global: { stubs: { teleport: true } }, attachTo: document.body })
      const markers = w.findAll('.cal-marker')
      expect(markers.length, 'the look-ahead lists the tournament as a marker').toBeGreaterThan(0)
      // the look-ahead is in week order and the posed card is the first enterable one
      await markers[0]!.trigger('click')
      const note = w.find('.coach-note')
      expect(note.exists(), `the marker card for ${card.label} prints a coach note`).toBe(true)
      const text = note.text()
      w.unmount()
      return { text, whole: true }
    },
  ],
]

describe('the engine\'s own sentence – «would save her for the…» – on all four surfaces, in Russian', () => {
  it.each(SURFACES)('%s prints the expected Russian row, with no English word left but the tournament\'s name', async (_name, read) => {
    await inRussian()
    const { snap, card, ref } = aheadCard()
    const { text, whole } = await read(snap, card)
    const russian = expectedRu(ref)
    if (whole) expect(text).toBe(russian)
    else expect(text).toContain(russian)
    expect(text, 'the engine\'s English is the bug').not.toContain('Your coach')
    expect(withoutNames(text, namesIn(ref)), 'and no English word survives next to the raw name').not.toMatch(whole ? LATIN_WORD : /Your coach|would save|week/)
  })

  it.each(SURFACES)('%s: English is byte-identical – the engine\'s string, as before', async (_name, read) => {
    const { snap, card } = aheadCard()
    const { text, whole } = await read(snap, card)
    if (whole) expect(text).toBe(card.coachCaution)
    else expect(text).toContain(card.coachCaution as string)
  })
})

describe('the tired-body sentence (the entry confirm\'s FIRST shape: she is under the rung too, his line is spliced before the fatigue line)', () => {
  it('the confirm opens on the fatigue shape and its coach half is the Russian row – the engine\'s English is gone from the message', async () => {
    await inRussian()
    const { snap, card } = tiredCard()
    expect(card.cautionReason, 'precondition: this is the fatigue shape of the confirm').toBe('fatigued')
    const { text } = await SURFACES[1]![1](snap, card)
    expect(text).toContain(RU[LEGACY.empty] as string)
    expect(text, 'the engine\'s English sentence is gone').not.toContain(LEGACY.empty)
    // ⚠ RE-AIMED 13.10 (architect, same day as B4): the fatigue HALF joined the net – the engine's
    // own `cautionDetail` now crosses through engineText at both sinks, so the Russian row must be
    // in the message and the raw English gone. Before that fix these two lines would be the red arm.
    const detail = card.cautionDetail
    expect(detail, 'precondition: the fatigue gate wrote its own sentence onto the card').toBeTruthy()
    expect(RU[detail!], 'the fatigue sentence has a Russian row to render').toBeTruthy()
    expect(text).toContain(RU[detail!] as string)
    expect(text, 'the fatigue sentence no longer prints raw').not.toContain(detail!)
  })

  it('and the Calendar marker card\'s fatigue line prints the same Russian row', async () => {
    await inRussian()
    const { snap, card } = tiredCard()
    useGameStore().snapshot = snap
    const w = mount(CalendarScreen, { global: { stubs: { teleport: true } }, attachTo: document.body })
    const markers = w.findAll('.cal-marker')
    expect(markers.length, 'the look-ahead lists the tournament as a marker').toBeGreaterThan(0)
    await markers[0]!.trigger('click')
    const note = w.find('.caution-note')
    expect(note.exists(), `the marker card for ${card.label} prints the fatigue line`).toBe(true)
    expect(note.text()).toBe(RU[card.cautionDetail!] as string)
    w.unmount()
  })

  it('and Season\'s card prints the same row under the pill', async () => {
    await inRussian()
    const { snap, card } = tiredCard()
    const { text } = await SURFACES[0]![1](snap, card)
    expect(text).toBe(RU[LEGACY.empty] as string)
  })
})

describe('the seams around the ref', () => {
  it('a card with the string and NO ref (an old snapshot) still prints the string', async () => {
    await inRussian()
    const { snap, card } = aheadCard()
    const w = mountSeason({ ...snap, upcoming: snap.upcoming.map((e) => (e.id === card.id ? { ...e, coachCautionC: undefined } : e)) })
    expect(cardOf(w, TIERS[card.tier].label).find('.coach-note').text()).toBe(card.coachCaution)
    w.unmount()
  })

  it('a card he said nothing on prints no note on any surface', async () => {
    await inRussian()
    const { snap, card } = aheadCard()
    const quiet = posed(snap, card.id, null)
    const w = mountSeason(quiet)
    expect(cardOf(w, TIERS[card.tier].label).find('.coach-note').exists()).toBe(false)
    w.unmount()
  })
})
