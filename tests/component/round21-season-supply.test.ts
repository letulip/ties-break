// ROUND 21 #2b – THE SEASON HEADER RECONCILES ITSELF WITH THE FEED UNDER IT.
//
// The owner's report is two sentences about one screen: there are lots of tournaments on the season
// page at the top, and he does not see them in the feed. His screenshot reads
// `2039 · W42 · 9 left to enter over 10 weeks · WTA 500 2 · WTA 250 1 · WTA 125 1 · W75 1 · +4 lower`.
//
// ⚠ NEITHER NUMBER WAS WRONG, WHICH IS WHY THIS IS A COPY FIX AND NOT AN ENGINE ONE. `seasonSupply`
// counts every rung the engine opens to her, across the whole rest of the season, gated by the same
// `entryStatus` that governs entering. `calendarRows` draws eight weeks, of the rungs that pay into
// her tables, ONE ROW PER WEEK, and a week she has booked renders as the booking. Six independent
// reasons the two sets differ, measured over 18 careers x 676 weeks in tools/empty-week-census.ts:
// 78.3% of the events the header counts never reach the feed, and 5.2% of her non-blackout weeks
// carried tennis she could have entered that the feed never drew a card for.
//
// ⚠⚠ AND THE GAME ALREADY SAID SO, IN A `title`. The attribute on that line has read "including the
// rare ones the eight-week feed cannot show" since it shipped. A `title` is a HOVER tooltip and this
// is a phone game, so the explanation existed the whole time in the one place the device cannot
// reach. Same failure family as round-20 #3 (a dialog measured by what it says, never by what the
// screen can hold), which is why the assertion below is about what is RENDERED and not about the
// attribute.
//
// ⚠ MUTATION-VERIFIED – each applied alone (`|s|` is this file, `|ss|` season-screen.test.ts):
//
//   * the `<span class="season-supply-here">` deleted, i.e. the shipped state -> |s| the
//     reconciliation test and the arithmetic test. Nothing in |ss|;
//   * `supplyOnScreen` returning `supplyLine.total` -> |s| BOTH the reconciliation test and the
//     arithmetic test, because the `v-if` guard then hides the line as designed. Predicted "the
//     arithmetic test alone" and that was wrong: the two claims are not separable through this
//     mutation, and the ledger says so rather than the prediction;
//   * `supplyOnScreen` counting every row rather than `kind === 'event'` rows -> |s| the
//     arithmetic test. This is the mutation that says the number is read off the surface the parent
//     can see, not off `visibleUpcoming`, which is the mistake the line exists to correct;
//   * the `v-if="supplyOnScreen < supplyLine.total"` guard removed -> |s| the once-ness test, which
//     is the half that keeps a reconciliation from becoming noise on a week where nothing needs
//     reconciling.
import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import SeasonScreen from '../../src/components/screens/SeasonScreen.vue'
import { useGameStore } from '../../src/stores/game'
import type { Snapshot } from '../../src/shared/protocol'
import { careerSnapshot } from '../helpers/career'
import { mountSeason } from '../helpers/mountSeason'

/** A real career through the real protocol, as every other SeasonScreen test builds one. */
const snapshotAfter = (weeks: number, seed = 'r21-supply'): Snapshot => careerSnapshot(weeks, seed)

/** The header's own count, off the snapshot rather than off the string – so the test compares two
 *  numbers the app computed and not a number this file re-derived. */
function headerTotal(snapshot: Snapshot): number {
  return (snapshot.seasonSupply?.rows ?? []).reduce((n, r) => n + r.open, 0)
}

/** How many tournament CARDS the feed drew. `.event-card` is the class on the `<Card>` that only
 *  renders for `row.kind === 'event'`, which is the one surface the parent can actually read. */
function cardsDrawn(wrapper: ReturnType<typeof mountSeason>): number {
  return wrapper.findAll('.event-card').length
}

describe('round-21 #2b – the season header says how much of its count is on screen', () => {
  beforeEach(() => setActivePinia(createPinia()))

  /** Walk until the fixture is in the state the item is about: the header counting more than the
   *  feed can draw. It is the ordinary state (measured at 78.3% of counted events), so this finds
   *  one quickly – but it is SEARCHED FOR rather than assumed, because a test that silently landed
   *  on an agreeing week would assert nothing and stay green for ever. */
  function aWeekWhereTheyDisagree(): { snapshot: Snapshot; weeks: number } {
    for (const weeks of [6, 10, 14, 20, 26, 32, 40, 52, 64, 80]) {
      const snapshot = snapshotAfter(weeks)
      const store = useGameStore()
      store.snapshot = snapshot
      const wrapper = mount(SeasonScreen, { global: { stubs: { teleport: true } } })
      const total = headerTotal(snapshot)
      const cards = cardsDrawn(wrapper)
      wrapper.unmount()
      if (total > 0 && cards < total) return { snapshot, weeks }
    }
    throw new Error('no week in the fixture had the header counting more than the feed draws')
  }

  it('when the header counts more than the feed draws, it says so on screen', () => {
    const { snapshot, weeks } = aWeekWhereTheyDisagree()
    const wrapper = mountSeason(snapshot)

    const line = wrapper.find('.season-supply')
    expect(line.exists(), 'the planning counter is on the screen').toBe(true)
    const here = wrapper.find('.season-supply-here')
    expect(here.exists(), `week ${weeks}: the header counts ${headerTotal(snapshot)} and draws ${cardsDrawn(wrapper)} cards`).toBe(true)
    expect(here.text()).toMatch(/^\d+ of them on the cards below$/)

    // ⚠ RENDERED, NOT AN ATTRIBUTE. The `title` on this line has carried the same fact since it
    // shipped and a title is a hover tooltip; the whole item is that a phone cannot reach it. So the
    // assertion is on the element's TEXT, and reading it out of `line.attributes('title')` would
    // pass on the exact build the owner was looking at.
    expect(line.text(), 'the reconciliation is in the copy, not in a tooltip').toContain('on the cards below')

    wrapper.unmount()
  })

  it('the number it prints is the feed\'s own card count, not the header\'s', () => {
    const { snapshot } = aWeekWhereTheyDisagree()
    const wrapper = mountSeason(snapshot)

    const printed = Number(wrapper.find('.season-supply-here').text().match(/^(\d+)/)![1])
    const total = headerTotal(snapshot)
    const cards = cardsDrawn(wrapper)

    // The whole point of the line: it names the SECOND number. If it named the first it would say
    // nothing, and if it were read off `visibleUpcoming` it would count events the parent cannot
    // see - stacked weeks collapse to one row and a booked week draws its booking instead.
    expect(printed, `printed ${printed}, cards drawn ${cards}, header counts ${total}`).toBe(cards)
    expect(printed, 'and it is genuinely smaller than the count above it').toBeLessThan(total)

    wrapper.unmount()
  })

  it('and it stays quiet on a week where the two agree', () => {
    // A reconciliation that fires when there is nothing to reconcile is noise on the tightest strip
    // on the screen. Rather than hunt for an agreeing week in the fixture - a season where every
    // counted event fits the eight-week feed is rare by construction - the store is handed a supply
    // whose total matches the cards actually drawn.
    const snapshot = snapshotAfter(10)
    const store = useGameStore()
    store.snapshot = snapshot
    const probe = mount(SeasonScreen, { global: { stubs: { teleport: true } } })
    const cards = cardsDrawn(probe)
    probe.unmount()
    expect(cards, 'the fixture draws at least one card, or this test proves nothing').toBeGreaterThan(0)

    // One row carrying exactly the drawn count: total === supplyOnScreen, so the guard must hide it.
    store.snapshot = {
      ...snapshot,
      seasonSupply: { ...snapshot.seasonSupply!, rows: [{ tier: 'local' as const, open: cards, entered: 0 }] },
    }
    const wrapper = mount(SeasonScreen, { global: { stubs: { teleport: true } } })
    expect(wrapper.find('.season-supply').exists(), 'the counter is still drawn').toBe(true)
    expect(wrapper.find('.season-supply-here').exists(), 'but the reconciliation is not').toBe(false)
    wrapper.unmount()
  })
})
