// ⭐⭐ ROUND 31 #4 – THE DRAW, ON THE SEASON CARD ITSELF.
//
// The owner, 31.08: «каждую неделю это другой турнир с другой соперницей в первом круге – разве
// такое бывает в реальности? по-моему они точно знают с кем будут играть в первом туре и этот
// персонаж не меняется, разве нет? Это применимо к любому турниру в нашей сетке» – and then, on how
// to fix it: «можно писать, что жеребьевки еще не было, а потом (когда она происходит за 1 неделю,
// 2, 3?) прямо на карточке турнира писать имя и ранг соперницы на 1й круг внизу возле этого круга с
// шансом, можно как раз в поле Coach says это делать элегантно».
//
// ⚠ MOUNTED, NOT PINNED. The whole item is about what a card SAYS in each of three states, and a
// source pin cannot tell a hidden ring from a rendered one. The fixture is a real career through the
// real protocol, exactly as the other component suites build one.
//
// ⚠ THE ASSERTIONS COME IN PAIRS ON PURPOSE. "Hides the ring" and "shows the ring" are asserted on
// the same screen in the same test, so no single mutation (always hide / always show) can satisfy
// both – the failure mode this repo names in tests/component/round29-next-tournament.test.ts.
import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import NextTournamentPanel from '../../src/components/NextTournamentPanel.vue'
import { useGameStore } from '../../src/stores/game'
import { createWorld, tickWeek, toSnapshot } from '../../src/engine/world'
import { rngFromSeed } from '../../src/engine/rng'
import { DRAW_LEAD_WEEKS } from '../../src/engine/season/preview'
import { DRAW_NOT_MADE_NOTE } from '../../src/composables/eventCard'
import { mountSeason } from '../helpers/mountSeason'
import type { Snapshot, UpcomingEvent } from '../../src/shared/protocol'

/** A career walked to a week whose feed holds BOTH kinds of card – one at its draw week and at
 *  least one ahead of it. Nothing is hand-made; the walk stops at the first week that qualifies. */
function feedWithBothStates(seed = 'r31-draw-reveal'): Snapshot {
  const world = createWorld(seed)
  const rng = rngFromSeed(world.seed)
  for (let i = 0; i < 200; i++) {
    tickWeek(world, rng)
    const snap = toSnapshot(world)
    const drawn = snap.upcoming.filter((e) => e.preview.drawMade)
    const pending = snap.upcoming.filter((e) => !e.preview.drawMade)
    if (world.week >= 8 && drawn.length > 0 && pending.length > 0) return snap
  }
  throw new Error('no week held both card states – the fixture, not the screen, is broken')
}

describe('round 31 #4 – the Season card, before and after the draw', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('every card is in exactly one of the two states, and each says so in the plaque', () => {
    const snap = feedWithBothStates()
    const w = mountSeason(snap)
    const cards = w.findAll('.event-card')
    expect(cards.length, 'the feed must hold cards at all').toBeGreaterThan(1)

    let pending = 0
    let drawn = 0
    for (const card of cards) {
      const line = card.find('.event-coach-line').text()
      const hasRing = card.find('.chance-ring').exists()
      if (line.endsWith(DRAW_NOT_MADE_NOTE)) {
        pending++
        // ⚠ THE THREE THINGS A PRE-DRAW CARD MUST NOT DO: name somebody, ring a number, or print a
        // percentage anywhere on itself.
        expect(hasRing, 'a ring on a card whose draw has not been made').toBe(false)
        expect(card.text(), 'a percentage before the draw').not.toMatch(/\d+\s*%/)
        expect(line).not.toContain('First round:')
      } else {
        drawn++
        expect(line, 'a drawn card must name the opponent in the plaque').toContain('First round:')
        expect(hasRing, 'no ring on a card whose draw HAS been made').toBe(true)
        expect(card.text()).toMatch(/\d+\s*%/)
      }
    }
    // Both arms populated, or half of the loop above proved nothing.
    expect(pending, 'no pre-draw card on screen').toBeGreaterThan(0)
    expect(drawn, 'no drawn card on screen').toBeGreaterThan(0)
    w.unmount()
  })

  it('the name and the rank on the card are the ENGINE\'s, not the screen\'s', () => {
    // «имя и ранг соперницы на 1й круг». The plaque may restate the preview and may not compute one.
    const snap = feedWithBothStates()
    const w = mountSeason(snap)
    const drawnLine = w
      .findAll('.event-coach-line')
      .map((n) => n.text())
      .find((t) => t.includes('First round:'))
    expect(drawnLine, 'no drawn card in the feed').toBeTruthy()
    const drawnEvents = snap.upcoming.filter((e) => e.preview.drawMade)
    expect(drawnEvents.length).toBeGreaterThan(0)
    // The card the feed picked for that week is one of them, and the sentence is built from its own
    // preview – name and rank together, so a screen that invented either goes red.
    const matched = drawnEvents.find(
      (e) =>
        drawnLine!.includes(e.preview.opponentName) &&
        drawnLine!.includes(e.preview.opponentRank === null ? 'Unranked' : `#${e.preview.opponentRank}`),
    )
    expect(matched, `plaque said "${drawnLine}"`).toBeTruthy()
    expect(matched!.preview.opponentName).not.toBe('')
    w.unmount()
  })

  it('the drawn card is the one a week away, and the pending ones are further out', () => {
    // The rule itself, read off the screen rather than off the constant: the only card that names
    // anybody is the one whose event is inside `DRAW_LEAD_WEEKS`. Entries closed a week earlier, so
    // he chooses on the band and then learns the opponent.
    const snap = feedWithBothStates()
    for (const e of snap.upcoming) {
      expect(e.preview.drawMade, `${e.id} at +${e.week - snap.week}`).toBe(e.week - snap.week <= DRAW_LEAD_WEEKS)
    }
  })
})

describe('round 31 #4 – the band does not move while the card sits on screen', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('the same event, read at two different weeks, reads the same field line', () => {
    // «эта полоса тоже должна быть более-менее статична ... может быть игрок планирует турниры и
    // выбирает более выгодные для себя». Read through the panel rather than off the snapshot, so it
    // is the SENTENCE the owner sees that is pinned and not only the engine's enum.
    //
    // ⚠ THE WORLD IS TICKED BETWEEN THE TWO MOUNTS. Standings, rivals' fatigue and her own results
    // all move; a fixture that mounted the same snapshot twice would be comparing a thing with
    // itself, which is the null-arm mistake CLAUDE.md records.
    const world = createWorld('r31-band-hold')
    const rng = rngFromSeed(world.seed)
    for (let i = 0; i < 14; i++) tickWeek(world, rng)

    const first = toSnapshot(world)
    // A card far enough out that it will still be on screen in three weeks' time.
    const target = first.upcoming.find((e) => e.week - first.week >= 5)
    expect(target, 'need a card with weeks left on it').toBeTruthy()
    const lineFor = (snap: Snapshot, event: UpcomingEvent): string => {
      useGameStore().snapshot = snap
      const w = mount(NextTournamentPanel, { props: { event } })
      const text = w.findAll('.nt-read-line').map((n) => n.text())[0]
      w.unmount()
      return text
    }
    const before = lineFor(first, target!)

    for (let i = 0; i < 3; i++) tickWeek(world, rng)
    const later = toSnapshot(world)
    const same = later.upcoming.find((e) => e.id === target!.id)
    expect(same, 'the card left the horizon – pick an earlier target').toBeTruthy()
    expect(later.week).toBe(first.week + 3)

    expect(lineFor(later, same!), `${target!.id} changed its field line in three weeks`).toBe(before)
    // ...and it is a real sentence rather than an empty string on both sides.
    expect(before.length).toBeGreaterThan(10)
  })
})
