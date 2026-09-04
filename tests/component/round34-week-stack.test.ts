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
// ⚠ MUTATION-VERIFIED – six mutations, each applied alone, and the verdicts all differ, which is
// what says these are independent claims rather than one claim written seven times:
//   * `weekEventStack` returning `[lead]` – the one-row collapse rounds 31/32/33 built on – reddens
//     6 of 7 and leaves the empty-week arm GREEN, which is exactly the pair described above;
//   * dropping the `eventActionable` filter from its tail reddens 2 – the «only what she can play»
//     assertion inside the first arm, AND #14b's barred half, which is the assertion that says the
//     Play Down rule is what keeps «сильно перерощенные» out now that `hasOutgrown` is not asked;
//   * ⭐⭐ ROUND 34 #14b: putting the OUTGROWN clause back reddens the two #14b arms and leaves the
//     other five green – the sharpest verdict in the file, because it is the shipped-until-03.09
//     rule failing exactly and only the claim the owner's ruling added;
//   * ...and `coachLadderNote`'s `hasOutgrown` gate inverted reddens ONE – the arm that says the
//     card a stacked week now draws still carries the coach's argument. That is the fact
//     `tierOutgrown`'s own note calls «worth telling a parent before he books the flights», and its
//     own mutation is what proves the item did not quietly drop it;
//   * `.week-stack.swipeable`'s `overflow-x: visible` reddens 1 (the phone arm's reachability half);
//   * `.week-stack.swipeable > .event-card`'s `width` raised to 130% reddens 1 (the phone arm's
//     width half). ⚠ IT DID NOT, on the first draft: `availableWidth` stops at an element's PARENT
//     by its own contract, so measuring the ROOM a card sits in scored a card wider than the phone
//     as fitting. The assertion reads the card's own USED width now, and that is what bites.
//
// ⚠⚠ AND ONE MUTATION WENT GREEN WHEN IT SHOULD NOT HAVE, WHICH IS RECORDED BECAUSE IT NEARLY
// SHIPPED: #14b's first finder searched for its week by asking `weekEventStack` itself, so restoring
// the outgrown clause simply moved the search to a week that rule was happy with and all seven arms
// stayed green. A finder that consults the rule under test cannot fail on it. It reads the ENGINE
// (`playDownBars`, `hasOutgrown`) and the two predicates the item did not change instead.
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
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
// ⭐ ROUND 34 #14b – the two halves of `hasOutgrown` asked separately, off the same world the
// snapshot came from, so the test never has to name a rung by hand.
import { hasOutgrown, playDownBars } from '../../src/engine/world/ladder'
import { rngFromSeed } from '../../src/engine/rng'
import { mountSeason } from '../helpers/mountSeason'
import { PHONE, TABLET, availableWidth, boxOf, lengthPx, rowItemWidth, setViewport } from './fits'

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
        // ⚠ THE WIDEST WEEK, NOT THE FIRST ONE – strengthened by round 34 #14b, which made the
        // stacks longer (a rung she has merely outgrown now earns its own card). The phone arm below
        // is a round-20 #3 measurement and it must be taken against the worst case the fixture
        // offers, not against whichever two-card week happens to come first in the horizon.
        const hit = stacksIn(snap)
          .filter((s) => s.stack.length > 1)
          .sort((a, b) => b.stack.length - a.stack.length)[0]
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
    //
    // ⚠⚠ RE-AIMED BY ROUND 34 #14b – NOT DELETED, NOT LOOSENED, AND THE SECOND LINE IS NOW ITS OWN
    // INVERSE. It read `expect(e.outgrown ?? false).toBe(false)` and that assertion is the exact
    // thing the owner overruled on 03.09: «на какие-то можно и съездить, когда череда поражений идет
    // очень хочется что-то выиграть». What the pair was really guarding is «only what she could
    // actually play earns a second card», and that half is untouched and asserted below – the
    // enterability test simply became the WHOLE test rather than half of it, because "outgrown" was
    // never a fact about whether she may go. The new claim, that an outgrown rung she can enter DOES
    // earn a card, is asserted in its own describe block so a mutation cannot satisfy both.
    for (const e of stack.slice(1)) {
      expect(eventActionable(e, snap.week), `${e.id} earned a card she cannot use`).toBe(true)
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

// =================================================================================================
// ⭐⭐⭐ ROUND 34 #14b – «CAN SHE ENTER», NOT «HAS SHE OUTGROWN». The owner read the measurement and
// found the contradiction himself: «игра считает их ниже её достоинства – но при этом я в сетке вижу
// w50 турниры, я тебе об этом писал. Значит у нас где-то противоречие есть – надо разобраться.»
// His ruling: «ну сильно перерощенные да, а на какие-то можно и съездить, когда череда поражений
// идет очень хочется что-то выиграть, знаешь ли.»
//
// THE TWO HALVES ARE ONE WEEK OF ONE REAL CAREER, WHICH IS WHY THEY ARE IN ONE TEST. `hasOutgrown`
// is an OR of three facts and only one of them is a BAN, so the claim is a SPLIT and not a level:
//   * `playDownBars` – the sport refusing her for being too GOOD. `tierFloorOpen` shuts the rung, so
//     it never reaches the feed and draws no card. «Сильно перерощенные».
//   * the arithmetic ceilings (`outgrewTier` / `tierOutgrown`) – she may enter, so she gets her card.
// A screen that drew cards for both would fail the first assertion; one that drew neither fails the
// second; one that asked `hasOutgrown` again fails the second. There is no single mutation that
// satisfies the pair, which is the property this file's header asks of every arm in it.
//
// ⚠ THE ENGINE IS ASKED WHICH IS WHICH, rather than the test naming rungs. `playDownBars` and
// `hasOutgrown` are read off the same WorldState the snapshot was taken from, so the fixture cannot
// drift into a week where the two labels mean something else and stay green.
describe('round 34 #14b – a rung she may ENTER earns a card; a rung the sport BARS does not', () => {
  beforeEach(() => setActivePinia(createPinia()))

  /** The week that carries both halves: an event of a rung `playDownBars` shuts, AND a rung that is
   *  outgrown by the ARITHMETIC alone standing BEHIND the week's lead, enterable.
   *
   *  ⚠⚠ THE SEARCH IS DELIBERATELY BLIND TO `weekEventStack`, and the first draft was not – which is
   *  how it stayed green under the mutation that puts the outgrown clause back. A finder that asks
   *  the rule under test simply walks on to the next week the rule happens to like, so the arms it
   *  hands over are always satisfiable. Everything here comes from the engine (`playDownBars`,
   *  `hasOutgrown`) and from the two predicates the item did not change (`preferredWeekEvent`,
   *  `eventActionable`), so the week is chosen by the SITUATION and the screen is then asked what it
   *  did with it. */
  function weekWithBoth(): {
    snap: Snapshot
    week: number
    barred: UpcomingEvent[]
    outgrownBehindTheLead: UpcomingEvent[]
  } {
    const world = savedWorld()
    const rng = rngFromSeed(world.seed)
    for (let i = 0; i < 30; i++) {
      const snap = toSnapshot(world)
      if (!snap.vacations.length && !snap.practices.length) {
        for (let w = snap.week + 1; w <= snap.week + UPCOMING_WEEKS; w++) {
          const onWeek = snap.upcoming.filter((e) => e.week === w)
          const barred = onWeek.filter((e) => playDownBars(world, e.tier))
          const visible = visibleOn(snap, w)
          const lead = preferredWeekEvent(visible)
          const outgrownBehindTheLead = visible.filter(
            (e) =>
              lead !== null &&
              e.id !== lead.id &&
              eventActionable(e, snap.week) &&
              hasOutgrown(world, e.tier) &&
              !playDownBars(world, e.tier),
          )
          if (barred.length && outgrownBehindTheLead.length) return { snap, week: w, barred, outgrownBehindTheLead }
        }
      }
      tickWeek(world, rng)
    }
    throw new Error('no week carried both a barred rung and an arithmetically outgrown one – the fixture, not the screen')
  }

  it('draws NO card for a rung the Play Down rule bars, and one for a rung she has merely passed', () => {
    const { snap, week, barred, outgrownBehindTheLead } = weekWithBoth()
    // Non-vacuity, said out loud rather than left to the finder's throw: both loops below must run.
    expect(barred.length, 'the week must carry a barred rung').toBeGreaterThan(0)
    expect(outgrownBehindTheLead.length, '...and one she has merely passed').toBeGreaterThan(0)
    const w = mountSeason(snap)
    const drawn = cardLabelsFor(w, week)

    // ⚠ THE BARRED HALF FIRST, because it is the half that must NOT move: «сильно перерощенные да».
    // The rung is on the calendar this week and the screen must still refuse it a card.
    // ⚠⚠ ASKED TWICE, ON PURPOSE, AND THE SECOND ASK IS THE ONE THAT BITES. On the screen a barred
    // rung is stopped TWICE – `feedShows` never offers it (its rung is shut) and the stack's own
    // filter would refuse it – so "the screen drew no card" alone survives a mutation of either
    // layer and proves little. The second assertion hands `weekEventStack` the week's RAW list,
    // which is the only way to ask whether the STACK RULE itself still refuses her: it does, on the
    // engine's entry verdict, which is exactly what «сильно перерощенные» has to mean now that
    // `hasOutgrown` is no longer asked.
    const raw = snap.upcoming.filter((e) => e.week === week)
    const rawStack = weekEventStack(raw, snap.week)
    for (const e of barred) {
      expect(drawn, `${e.tier} is barred by the Play Down rule and must draw no card`).not.toContain(TIERS[e.tier].label)
      // ...and it is barred rather than merely absent: the engine's own refusal, on the card's data.
      expect(e.eligible, `${e.id} must be refused by the entry gate, not just hidden`).toBe(false)
      expect(
        rawStack.map((x) => x.id),
        `${e.id} must be refused by the stack rule itself, not only by the feed's filter`,
      ).not.toContain(e.id)
    }

    // ...and the arithmetic half, which is what the ruling CHANGED.
    for (const e of outgrownBehindTheLead) {
      expect(drawn, `${e.tier} is outgrown by arithmetic alone and must earn its card`).toContain(TIERS[e.tier].label)
      expect(e.outgrown, `${e.id} must still be LABELLED outgrown`).toBe(true)
      expect(eventActionable(e, snap.week), `${e.id} must be a card she can act on`).toBe(true)
    }
    // ...and the two sets are genuinely different rungs, or the test is comparing a thing with itself.
    expect(
      barred.every((b) => !outgrownBehindTheLead.some((o) => o.tier === b.tier)),
      'the barred and the merely-outgrown rungs must be different rungs',
    ).toBe(true)
    expect(drawn.length, 'and the week really does draw cards, so "no card" means refused').toBeGreaterThan(0)
    w.unmount()
  })

  it('the card it now draws still says what it is worth – the pill and the coach are untouched', () => {
    // ⚠⚠ THE FACT THAT MUST NOT BE LOST. `tierOutgrown`'s own note calls «even a title here cannot
    // move her book» a fact worth telling a parent before he books the flights, and the card is
    // where it is told: the `outgrown` pill and `coachLadderNote`, BOTH of which read `hasOutgrown` –
    // the function this item deliberately did not touch. So a rung that now earns a card carries the
    // same two sentences it carried when it led a week alone; the change can only put them on MORE
    // cards, never fewer.
    const { snap, week, outgrownBehindTheLead } = weekWithBoth()
    expect(outgrownBehindTheLead.length, 'or the loop below asserts nothing').toBeGreaterThan(0)
    const w = mountSeason(snap)
    const dates = weekRange(week)
    const cards = w.findAll('.event-card').filter((c) => c.find('.event-dates').text().includes(dates))
    for (const e of outgrownBehindTheLead) {
      const card = cards.find((c) => c.find('.event-tier').text().trim() === TIERS[e.tier].label)
      expect(card, `${e.tier} draws a card`).toBeTruthy()
      expect(card!.text(), 'the pill that says she is past this level').toContain('Outgrown')
      // The coach's argument is the engine's sentence, printed verbatim – the test asserts the
      // card CARRIES it rather than inventing what it should say.
      expect(e.coachCaution, `${e.id} must carry the coach's ladder note`).toBeTruthy()
      expect(card!.find('.coach-note').exists(), 'and the card must print it').toBe(true)
      expect(card!.find('.coach-note').text()).toBe(e.coachCaution)
    }
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

    // ⚠⚠ EVERY SWIPEABLE STRIP ON THE FEED, NOT THE FIRST ONE – widened by round 34 #14b. It read
    // the first strip in the DOM, and #14b made the stacks LONGER (the widest week of this fixture
    // went from two cards to four), so "the first strip" and "the worst case" stopped being the same
    // week. The count is asserted against the rule's own answer for the widest week, which is what
    // says the measurement really did reach it.
    const strips = w.findAll('.week-stack').filter((s) => s.classes().includes('swipeable'))
    expect(strips.length, `week ${week} must draw a swipeable strip`).toBeGreaterThan(0)
    const widest = Math.max(...strips.map((s) => s.findAll('.event-card').length))
    expect(widest, 'and the widest strip on screen is the widest stack the rule builds').toBe(
      careerWithAStackedWeek().stack.length,
    )
    expect(widest, 'which is more than one card, or this measurement is about nothing').toBeGreaterThan(1)

    for (const strip of strips) {
      const overflowX = getComputedStyle(strip.element).overflowX
      expect(
        ['auto', 'scroll'].includes(overflowX),
        `the strip is \`overflow-x: ${overflowX}\` – the cards past the first cannot be reached`,
      ).toBe(true)

      const cards = strip.findAll('.event-card')
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
    }
    w.unmount()
    document.body.innerHTML = ''
  })
})

// ⭐⭐⭐ ROUND 36 PHASE 2 – AND ON A TABLET THE SAME STRIP SHOWS TWO. The owner, on frame
// AD-season-tablet-768.png: «1 неделя = 1 ряд, максимум 2 карточки видно, свайп для 3+. Формат
// карточки, оформление и кнопки - мобильные, без изменений.»
//
// ⚠ IT LIVES IN THIS FILE BECAUSE IT IS THIS FILE'S MECHANISM. Round 34 #14 built the row and the
// swipe; phase 2 changed ONE number in it. A separate round-36 file would measure the same strip
// from a second place and the two would drift the first time a card's width moves.
//
// ⚠ THE WIDTH MUST BE SET BEFORE THE MOUNT. happy-dom evaluates a media query on an element's first
// computed-style read and then caches it (measured 04.09; the note is beside `TABLET` in fits.ts),
// so `setViewport` after mounting reads the phone's answer and looks exactly like a missing rule.
// MUTATION-VERIFIED, four, each applied alone:
//   * the tablet card width put back to 88% -> the two-card arm, ALONE;
//   * the `:has(> :nth-child(3))` width raised to the two-up half -> the three-or-more arm, ALONE,
//     which is what says «максимум 2» and «свайп для 3+» are two claims and not one;
//   * `.event-cards .week-card`'s width dropped -> the non-tournament arm, ALONE;
//   * the whole `@media` block moved to `min-width: 100000px` -> all THREE tablet arms, while the
//     phone arm stays green. That last asymmetry is rule 4 of this phase: nothing below 768 moved.
// ⚠ AND ONE MUTATION WENT GREEN WHEN IT SHOULD NOT HAVE, recorded because it was mine: `width: 88%`
// inserted ABOVE the tablet width in the SAME rule changes nothing, because the later declaration
// wins. A mutation has to be a replacement here, not an addition.
describe('round 36 phase 2 – a week is two cards wide on a tablet, and the third is a swipe away', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    document.body.innerHTML = ''
  })

  afterEach(() => {
    setViewport(PHONE)
    document.body.innerHTML = ''
  })

  /** A declared width as a FRACTION OF THE ROW it sits in, so the assertions below are about
   *  geometry rather than about a spelling.
   *
   *  ⚠ `lengthPx` is deliberately not widened for this. It folds `calc(<a>px ± <b>px)` and reads a
   *  `calc` mixing `%` with `px` as NaN, which its callers take as "no bound" – and six shipped
   *  rules are written in exactly that form (`calc(100% + 32px)` on the prologue heroes among them),
   *  so teaching the shared helper to read them would hand real bounds to tests that have been
   *  scoring them as unbounded since they were written. That is a change with its own measurement,
   *  not a thing to do in passing on the way to a layout claim. */
  function fracOfRow(width: string, room: number): number {
    const mix = /^calc\(\s*([\d.]+)%\s*([+-])\s*([\d.]+)px\s*\)$/.exec(width.trim())
    if (mix) {
      const px = (Number(mix[1]) / 100) * room + (mix[2] === '+' ? 1 : -1) * Number(mix[3])
      return px / room
    }
    return lengthPx(width, room) / room
  }

  /** Every swipeable strip on the feed, and the card widths inside it, as fractions of the row. */
  function stripWidths(vp: { width: number; height: number }): { cards: number; frac: number }[] {
    setViewport(vp)
    const { snap } = careerWithAStackedWeek()
    useGameStore().snapshot = snap
    const w = mount(SeasonScreen, { global: { stubs: { teleport: true } }, attachTo: document.body })
    expect(document.head.querySelector('style'), 'no stylesheet – this measurement would be vacuous').toBeTruthy()
    const out: { cards: number; frac: number }[] = []
    for (const strip of w.findAll('.week-stack').filter((s) => s.classes().includes('swipeable'))) {
      const cards = strip.findAll('.event-card')
      const room = availableWidth(cards[0].element, vp)
      const declared = getComputedStyle(cards[0].element).width
      expect(declared, 'the card declares no width – the measurement below would be about nothing').not.toBe('')
      out.push({ cards: cards.length, frac: fracOfRow(declared, room) })
    }
    w.unmount()
    return out
  }

  it('⭐ two cards fill the row – «максимум 2 карточки видно»', () => {
    const strips = stripWidths(TABLET)
    const pairs = strips.filter((s) => s.cards === 2)
    expect(pairs.length, 'the fixture must draw a two-card week, or this measures nothing').toBeGreaterThan(0)
    for (const strip of pairs) {
      // Half the row less half the 12px gutter: the pair and its gutter come to the whole row, so
      // both cards are on screen and there is nothing hanging past them.
      expect(strip.frac, 'a two-card week gives each card half the row').toBeCloseTo(0.5 - 6 / 736, 2)
      expect(2 * strip.frac + 12 / 736, 'and the pair fills the row exactly').toBeCloseTo(1, 2)
    }
  })

  it('⭐ …and a stack of three or more leaves an edge to swipe at – «свайп для 3+»', () => {
    const strips = stripWidths(TABLET)
    expect(strips.length, 'the fixture must draw a swipeable strip, or this measures nothing').toBeGreaterThan(0)
    const deep = strips.filter((s) => s.cards >= 3)
    expect(deep.length, 'and one of them must hold three or more, which is the case under test').toBeGreaterThan(0)
    for (const strip of deep) {
      // 88% of the row across TWO cards and one 12px gutter – the phone's own 12% of slack, spent on
      // the same affordance: the next card's edge showing past the second.
      expect(
        strip.frac,
        `a ${strip.cards}-card week gives each card ${(strip.frac * 100).toFixed(1)}% of the row – ` +
          'two of these plus a gutter must leave a sliver, or «свайп для 3+» has nothing to swipe at',
      ).toBeLessThan(0.47)
      expect(strip.frac, 'and it is still nearly half the row, not a third of it').toBeGreaterThan(0.4)
      // TWO CARDS VISIBLE, NOT THREE: the pair plus its gutter must still take most of the row.
      expect(2 * strip.frac, 'two cards fill the row').toBeGreaterThan(0.8)
    }
  })

  // ⭐⭐ D2 IN docs/specs/responsive-decisions-2026-09.md, AND IT IS THE CONTENTIOUS ONE. A week that
  // is not a tournament – training, off-season, exams, a booked vacation – is a card on the same
  // calendar, and `AD-season-tablet-768.png` draws it at half width like every other week. The
  // alternative (a lone card stretching) is a one-line change to the rule this pins, which is why
  // the decision document can offer it as a one-line answer.
  it('⭐ a week that is not a tournament takes the same half-row, as AD draws it', () => {
    setViewport(TABLET)
    const { snap } = careerWithAStackedWeek()
    useGameStore().snapshot = snap
    const w = mount(SeasonScreen, { global: { stubs: { teleport: true } }, attachTo: document.body })
    const cards = w.findAll('.week-card')
    expect(cards.length, 'the fixture must draw a non-tournament week, or this measures nothing').toBeGreaterThan(0)
    for (const card of cards) {
      const room = availableWidth(card.element, TABLET)
      const declared = getComputedStyle(card.element).width
      expect(declared, 'the card declares no width at 768').not.toBe('')
      expect(fracOfRow(declared, room), 'a training or off-season week is half a row too').toBeCloseTo(
        0.5 - 6 / room,
        2,
      )
    }
    w.unmount()
  })

  it('⚠ and the phone is untouched – the same strip is still 88% of ONE card there', () => {
    // The other half of «формат карточки … без изменений», and the guard on rule 4 of this phase:
    // nothing below 768 may move. 0.88 is round 34's own number, read back through the cascade.
    for (const strip of stripWidths(PHONE)) {
      expect(strip.frac, 'a phone still shows one card and the edge of the next').toBeCloseTo(0.88, 2)
    }
    // ...and a non-tournament week is still the full width of the phone, which is the other half of
    // «nothing below 768 may move» on this screen.
    const w = mount(SeasonScreen, { global: { stubs: { teleport: true } }, attachTo: document.body })
    for (const card of w.findAll('.week-card')) {
      const declared = getComputedStyle(card.element).width
      expect(declared === '' || declared === 'auto', 'a phone week card declares no width of its own').toBe(true)
    }
    w.unmount()
  })
})
