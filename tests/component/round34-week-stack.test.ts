// ⭐⭐⭐ ROUND 34 #14 – A WEEK THAT STACKS SEVERAL RUNGS SHE MAY ENTER OFFERS A CARD FOR EACH.
//
// The owner's ruling: he had asked in an earlier round about several cards from the AVAILABLE ones
// on one week, he would like to look at it, it changes no game mechanic at all, it is purely an
// interface change to swipeable cards – and there is then no conflict, because there is a CHOICE.
// (His Russian is quoted verbatim in docs/rounds/round-34.md item 14 and on `weekEventStack`.)
//
// ⚠ MOUNTED, NOT PINNED, AND THAT IS THE WHOLE POINT OF THE ITEM. The claim is "the screen draws
// two cards on this week and none on that one", which no source pin can tell apart from a hidden
// element. The fixture is a real career through the real protocol, and the stacked week is SEARCHED
// FOR rather than assumed – a test that silently landed on a one-card week would assert nothing and
// stay green for ever.
//
// ⚠ THE PAIR IS THE GUARD. "Draws a card for each" and "draws none where she can play nothing" are
// asserted in the same file on the same careers, so no single mutation satisfies both: a screen that
// always stacks fails the second, one that never stacks fails the first.
//
// ⚠ MUTATION-VERIFIED – four mutations, each applied alone, and the four verdicts differ, which is
// what says these are independent claims rather than one claim written five times:
//   * `weekEventStack` returning `[lead]` – the shipped-until-today one-row collapse – reddens 4 of
//     5 and leaves the empty-week arm GREEN, which is exactly the pair described above;
//   * dropping the `eventActionable` filter from its tail reddens 1 (the «only what she can play»
//     assertion inside the first arm);
//   * `.week-stack.swipeable`'s `overflow-x: visible` reddens 1 (the phone arm's reachability half);
//   * `.week-stack.swipeable > .event-card`'s `width` raised to 130% reddens 1 (the phone arm's
//     width half). ⚠ IT DID NOT, on the first draft: `availableWidth` stops at an element's PARENT
//     by its own contract, so measuring the ROOM a card sits in scored a card wider than the phone
//     as fitting. The assertion reads the card's own USED width now, and that is what bites.
import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import '../../src/style.css'
import SeasonScreen from '../../src/components/screens/SeasonScreen.vue'
import { useGameStore } from '../../src/stores/game'
import type { Snapshot, UpcomingEvent } from '../../src/shared/protocol'
import { TIERS } from '../../src/engine/season/calendar'
import { eventActionable, feedContext, feedShows, preferredWeekEvent, weekEventStack } from '../../src/composables/tierState'
import { UPCOMING_WEEKS } from '../../src/engine/world/constants'
import { weekRange } from '../../src/shared/dates'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { migrateSave } from '../../src/engine/migrations'
import { tickWeek, toSnapshot, type WorldState } from '../../src/engine/world'
import { rngFromSeed } from '../../src/engine/rng'
import { mountSeason } from '../helpers/mountSeason'
import { PHONE, availableWidth, boxOf, lengthPx, rowItemWidth, setViewport } from './fits'

/** The feed's filter, asked with exactly the four keys SeasonScreen passes – so this file cannot
 *  disagree with the screen about which events are even candidates. */
function visibleOn(snap: Snapshot, week: number): UpcomingEvent[] {
  const feed = feedContext({
    ageYears: snap.ageYears,
    tierOpen: snap.tierOpen,
    activeLadder: snap.activeLadder,
    upcoming: snap.upcoming,
  })
  return snap.upcoming.filter((e) => e.week === week && feedShows(e, feed))
}

/** Every week in the horizon, with the stack the screen will render for it. */
function stacksIn(snap: Snapshot): { week: number; stack: UpcomingEvent[] }[] {
  const out: { week: number; stack: UpcomingEvent[] }[] = []
  for (let w = snap.week + 1; w <= snap.week + UPCOMING_WEEKS; w++) {
    out.push({ week: w, stack: weekEventStack(visibleOn(snap, w), snap.week) })
  }
  return out
}

/** ⚠⚠ THE FIXTURE IS THE SHIPPED GOLDEN SAVE, NOT A FRESH CAREER, AND THAT IS A MEASURED CHOICE.
 *  A `createWorld(seed)` career that nobody plays never leaves the Local rung – probed over 340
 *  weeks x 3 seeds it opened `local` and nothing else, so it never puts two candidates on one week
 *  and every assertion below would have been thrown rather than asserted. `v46.json` is the same
 *  save `round16-surfaces.test.ts` mounts this screen against: a real career at week 155 whose feed
 *  carries the stacked weeks the item is about (probed: 26 stacked and 34 dead weeks over a 30-week
 *  walk). Nothing here is hand-made; the world is read, migrated and ticked. */
function savedWorld(): WorldState {
  return migrateSave(
    JSON.parse(readFileSync(resolve(process.cwd(), 'tests/fixtures/saves/v46.json'), 'utf8')),
  ) as WorldState
}

interface Found {
  stacked: { snap: Snapshot; week: number; stack: UpcomingEvent[] } | null
  dead: { snap: Snapshot; week: number; hidden: UpcomingEvent[] } | null
}
let CACHE: Found | null = null

/** One walk, cached: five tests share the search rather than each paying for it. */
function search(): Found {
  if (CACHE) return CACHE
  const found: Found = { stacked: null, dead: null }
  const world = savedWorld()
  const rng = rngFromSeed(world.seed)
  for (let i = 0; i < 30 && !(found.stacked && found.dead); i++) {
    const snap = toSnapshot(world)
    if (!snap.vacations.length && !snap.practices.length) {
      if (!found.stacked) {
        const hit = stacksIn(snap).find((s) => s.stack.length > 1)
        if (hit) found.stacked = { snap, week: hit.week, stack: hit.stack }
      }
      if (!found.dead) {
        for (let w = snap.week + 1; w <= snap.week + UPCOMING_WEEKS; w++) {
          const onWeek = snap.upcoming.filter((e) => e.week === w)
          if (onWeek.length > 0 && visibleOn(snap, w).length === 0) {
            found.dead = { snap, week: w, hidden: onWeek }
            break
          }
        }
      }
    }
    tickWeek(world, rng)
  }
  CACHE = found
  return found
}

/** A week of that career's feed with more than ONE card on it. Searched, never assumed: a fixture
 *  that quietly landed on a flat week would make every assertion below vacuous. */
function careerWithAStackedWeek(): { snap: Snapshot; week: number; stack: UpcomingEvent[] } {
  const hit = search().stacked
  if (!hit) throw new Error('no week in the fixture stacked two enterable rungs – the fixture, not the screen')
  return hit
}

/** ...and one carrying tennis she can play NOTHING of. The measurement put these at 12 of 48
 *  eventful weeks at WTA #111, so they are the ordinary state rather than a corner – and they are
 *  the half of the item that must NOT change. */
function careerWithADeadWeek(): { snap: Snapshot; week: number; hidden: UpcomingEvent[] } {
  const hit = search().dead
  if (!hit) throw new Error('no week in the fixture carried only tennis she cannot play')
  return hit
}

/** The tier headings the screen drew for one week. Cards are found by the week's own date range –
 *  `weekRange` is the app's one formatter and the row prints its answer, so no date is re-derived
 *  here; `TIERS[t].label` is the catalogue's own string, so no label is either. */
function cardLabelsFor(wrapper: { findAll: (s: string) => { find: (s: string) => { text: () => string } }[] }, week: number): string[] {
  const dates = weekRange(week)
  return wrapper
    .findAll('.event-card')
    .filter((c) => c.find('.event-dates').text().includes(dates))
    .map((c) => c.find('.event-tier').text().trim())
}

describe('round 34 #14 – a stacked week offers a card for each rung she may enter', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('renders one card per enterable rung on the week, in one swipeable strip', () => {
    const { snap, week, stack } = careerWithAStackedWeek()
    expect(stack.length, 'the fixture must stack at least two').toBeGreaterThan(1)
    const w = mountSeason(snap)

    const strips = w.findAll('.week-stack')
    expect(strips.length, 'every drawn week is a strip').toBeGreaterThan(0)
    expect(
      strips.filter((s) => s.classes().includes('swipeable')).length,
      'the stacked week is the swipeable one',
    ).toBeGreaterThan(0)

    // ⚠ THE ASSERTION IS ON THE TIERS, NOT ON A COUNT. A screen that drew the same card twice would
    // satisfy "two cards" and would be a bug; the headings must name the DIFFERENT rungs the engine
    // put on that week, in the order the rule puts them.
    const drawn = cardLabelsFor(w, week)
    const expected = stack.map((e) => TIERS[e.tier].label)
    expect(drawn, `week ${week} draws ${expected.length} cards`).toEqual(expected)
    expect(new Set(drawn).size, 'and they are different rungs').toBe(expected.length)

    // ...and every card past the lead is a rung she can ACT on, which is what «из доступных» means.
    for (const e of stack.slice(1)) {
      expect(eventActionable(e, snap.week), `${e.id} earned a card she cannot use`).toBe(true)
      expect(e.outgrown ?? false, `${e.id} is a rung she has passed`).toBe(false)
    }
    w.unmount()
  })

  it("the LEAD card is still `preferredWeekEvent`'s answer – R15-9's pick is not retired", () => {
    // ⭐ The half of the change that is deliberately invisible: rounds 31/32/33 all built on "the
    // card this week shows", and that sentence is still true of the FIRST card.
    const { snap, week, stack } = careerWithAStackedWeek()
    expect(stack[0].id).toBe(preferredWeekEvent(visibleOn(snap, week))!.id)
    const w = mountSeason(snap)
    expect(cardLabelsFor(w, week)[0]).toBe(TIERS[stack[0].tier].label)
    w.unmount()
  })

  it('a week carrying nothing she can play still renders NO card at all', () => {
    // ⚠⚠ THE HALF THAT MUST NOT MOVE. 12 of 48 eventful weeks at WTA #111 show her nothing, because
    // every event on them is a rung she has outgrown, aged out of, or cannot reach – and the fix for
    // the stacked weeks must not turn those into a swipe through cards she cannot enter.
    const { snap, week, hidden } = careerWithADeadWeek()
    expect(hidden.length, 'the week must actually carry tennis').toBeGreaterThan(0)
    expect(weekEventStack(visibleOn(snap, week), snap.week)).toEqual([])
    const w = mountSeason(snap)
    expect(cardLabelsFor(w, week), `week ${week} must draw nothing`).toEqual([])
    w.unmount()
  })

  it('the whole feed draws exactly the cards the rule says, week by week', () => {
    // The count as a property rather than as one week: a screen that stacked the wrong weeks, or
    // stacked every week, disagrees with this immediately.
    const { snap } = careerWithAStackedWeek()
    // ⚠ A BOOKED WEEK DRAWS ITS BOOKING INSTEAD OF ITS TENNIS, so the fixture is asserted to carry
    // none rather than the assertion being weakened to allow for them.
    expect(snap.vacations.length + snap.practices.length, 'unbooked fixture, or this count is not the rule').toBe(0)
    const w = mountSeason(snap)
    const expected = stacksIn(snap).reduce((n, s) => n + s.stack.length, 0)
    expect(w.findAll('.event-card').length).toBe(expected)
    expect(expected, 'and the feed is not empty').toBeGreaterThan(0)
    w.unmount()
  })
})

describe('round 34 #14 – and it fits a 375x667 phone (round-20 #3)', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    document.body.innerHTML = ''
  })

  it('every card in a stacked week is narrower than the screen, and the strip can reach them', () => {
    // ⚠ THE FAILURE THIS GUARDS IS THE HORIZONTAL TWIN OF ROUND-20 #3. A dialog taller than the
    // phone put its dismiss control off the BOTTOM with nothing to scroll; a row of cards wider than
    // the phone puts the second card's Enter off the SIDE. Two things have to hold and they fail
    // differently: the strip must SCROLL (or the cards past the first are unreachable however wide
    // they are), and each card must be narrower than the viewport (or the first one is clipped
    // before anybody swipes).
    setViewport(PHONE)
    const { snap, week } = careerWithAStackedWeek()
    useGameStore().snapshot = snap
    const w = mount(SeasonScreen, { global: { stubs: { teleport: true } }, attachTo: document.body })
    expect(document.head.querySelector('style'), 'no stylesheet – this measurement would be vacuous').toBeTruthy()

    const strip = w.findAll('.week-stack').find((s) => s.classes().includes('swipeable'))
    expect(strip, `week ${week} must draw a swipeable strip`).toBeTruthy()

    const overflowX = getComputedStyle(strip!.element).overflowX
    expect(
      ['auto', 'scroll'].includes(overflowX),
      `the strip is \`overflow-x: ${overflowX}\` – the cards past the first cannot be reached`,
    ).toBe(true)

    const cards = strip!.findAll('.event-card')
    expect(cards.length, 'the strip must hold the whole stack').toBeGreaterThan(1)
    for (const card of cards) {
      // ⚠ THE CARD'S OWN USED WIDTH, NOT THE ROOM IT SITS IN. `availableWidth` stops at an element's
      // PARENT by its own contract, so measuring the room alone scored a card declared 130% wide as
      // fitting – caught by mutating exactly that and watching this test stay green.
      const outer = availableWidth(card.element, PHONE)
      const declared = lengthPx(getComputedStyle(card.element).width, outer)
      const used = Number.isFinite(declared) ? declared : outer
      expect(used, `a card in the strip is ${used.toFixed(0)}px wide inside a ${PHONE.width}px phone`).toBeLessThanOrEqual(
        PHONE.width,
      )
      expect(used, 'and it is a real box rather than a collapsed one').toBeGreaterThan(120)
      // ...and the control the card exists for fits ACROSS the room that card leaves it. `.controls`
      // wraps, so a red verdict here is "the button does not fit on the phone", not "it is
      // unreachable" – the strip's scroll is what answers reachability, one assertion up.
      const primary = card.find('.controls button, .controls .pill')
      expect(primary.exists(), 'every card carries a control').toBe(true)
      const room = availableWidth(primary.element, PHONE)
      expect(boxOf(primary.element, room).h, 'the control has a box, so there is something to press').toBeGreaterThan(0)
      expect(rowItemWidth(primary.element, room)).toBeLessThanOrEqual(room)
    }
    w.unmount()
    document.body.innerHTML = ''
  })
})
