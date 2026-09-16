// =================================================================================================
// ⭐⭐ ROUND 43 #11 – THE BUILD LETTER ON PAPER, MOUNTED.
// =================================================================================================
//
// The owner, 16.09: «давай на почту присылать письмо про те объекты, которые у нас строятся в
// магазине, в момент, когда они достроены.»
//
// WHEN it is written, WHICH rungs write it and that it is never pruned are the engine's half, pinned
// in tests/round43-build-letter.test.ts. This file is the sheet: that the letter renders at all
// (a new `OfferKind` whose template arm is missing renders NOTHING and every engine test stays
// green), that it says what a notice says, and that it offers no decision – because a letter about
// something already paid for and already delivered has nothing to ask.
//
// ⚠ THE LETTER IS BUILT BY THE ENGINE, not typed here. `raiseBuildLetter` is the only writer, so the
// terms this file renders are the terms a career really carries; a hand-built object would drift the
// day the shape changes and this file would go on passing.
//
// ⚠ MUTATION-VERIFIED – the ARMS table at the foot of the file.
import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import '../../src/style.css'
import OfferLetter from '../../src/components/OfferLetter.vue'
import { raiseBuildLetter } from '../../src/engine/offers'
import { shopItem } from '../../src/engine/world'
import { weekLabel } from '../../src/shared/dates'
import type { Offer } from '../../src/shared/protocol'

/** One real letter, written by the engine's own raiser. `orderedWeek` and the arrival week are four
 *  years apart – `yacht-big`'s 208 weeks, the shelf's longest wait and the one the item is for. */
function buildLetter(orderedWeek = 100, arrivedWeek = 308): Offer {
  const offers: Offer[] = []
  return raiseBuildLetter(offers, arrivedWeek, {
    itemId: 'yacht-big',
    label: shopItem('yacht-big')!.label,
    orderedWeek,
  })
}

function mountLetter(offer: Offer, week = 320) {
  return mount(OfferLetter, { props: { offer, week }, attachTo: document.body })
}

describe('round 43 #11 – the sheet the delivery writes', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    document.body.innerHTML = ''
  })

  it('it renders at all – a kind with no template arm would be a silent blank', () => {
    const w = mountLetter(buildLetter())
    // ⚠⚠ THE ASSERTION THIS FILE EXISTS FOR. `OfferLetter`'s template is a `v-if` ladder over the
    // kinds; a new kind that nobody added an arm for falls off the end and paints an empty article,
    // and EVERY engine test in the repo stays green while the player's inbox opens onto nothing.
    expect(w.find('.offer-letter').exists(), 'the sheet is on screen').toBe(true)
    expect(w.text().trim().length, 'and it is not a blank page').toBeGreaterThan(80)
    w.unmount()
  })

  it('it names the thing, the week it was ordered, and the wait', () => {
    const offer = buildLetter(100, 308)
    const w = mountLetter(offer)
    const text = w.text().replace(/\s+/g, ' ')
    expect(text, 'the rung, by its own frozen label').toContain(shopItem('yacht-big')!.label)
    expect(text, 'the week the money left').toContain(weekLabel(100))
    // 208 weeks is four years exactly, and the sheet says it in a letter's words rather than in a
    // count of weeks. ⚠ COMPUTED FROM THE TWO WEEKS ON THE PAPER and never from `ShopItem.buildWeeks`
    // – the catalogue's figure is what the wait was MEANT to be, and a letter states what happened.
    expect(text, 'the wait, in years').toContain('4 years')
    expect(text, 'and it is filed on its arrival week').toContain(`Filed ${weekLabel(308)}`)
    w.unmount()
  })

  it('a NOTICE: nothing to sign, nothing to refuse', () => {
    const w = mountLetter(buildLetter())
    // The academy's and the squad's shape. A letter about something already paid for and already
    // standing in the harbour has no decision left in it, and a control here would invent one.
    expect(w.findAll('button'), 'no actions on a notice').toHaveLength(0)
    expect(w.text()).not.toContain('Sign')
    expect(w.text()).not.toContain('Refuse')
    w.unmount()
  })

  it('⚠ no money on it – the family paid on the ORDER', () => {
    const w = mountLetter(buildLetter())
    const text = w.text()
    // The shop's §3f: «the money leaves on order, the thing arrives N weeks later.» A figure here
    // would read as a bill for something bought four years ago, so the sheet says the opposite in
    // words instead.
    expect(text, 'no price anywhere on the paper').not.toMatch(/\$[\d,]/)
    expect(text, 'and it says so').toContain('nothing to pay')
    w.unmount()
  })

  it('the wait is stated in the letter`s own words across the whole ladder', () => {
    // ⚠ EVERY SPAN BELOW IS ONE A CAREER CAN REALLY PRODUCE, and that is the point of listing them:
    // the shelf's ten build-time rungs are 3, 6, 12, 52, 52, 78, 104, 156, 156 and 208 weeks, and
    // `deliverAssets` fires at `week >= readyWeek` so a multi-week skip can land past any of them.
    // The `weeks <= 1` floor in `buildWaitWord` is NOT asserted here – it is unreachable through the
    // shop, it is documented as a floor on the output rather than a guard, and a case for it would
    // be this file claiming coverage of something no career can reach.
    const cases: Array<[number, string]> = [
      [3, '3 weeks'],
      [6, '6 weeks'],
      [12, '3 months'],
      [52, 'a year'],
      [104, '2 years'],
      [156, '3 years'],
      [208, '4 years'],
      [215, '4 years'],
    ]
    for (const [weeks, said] of cases) {
      document.body.innerHTML = ''
      const w = mountLetter(buildLetter(100, 100 + weeks))
      expect(w.text().replace(/\s+/g, ' '), `${weeks} weeks reads as "${said}"`).toContain(said)
      w.unmount()
    }
  })
})

// ===========================================================================
// THE ARMS. Each applied to src, this file run, then reverted.
//
//   1. the `v-else-if="isBuild"` article deleted from OfferLetter.vue
//      -> RED [5]: every case. ⭐ THE ARM THIS FILE EXISTS FOR – with the arm gone the sheet paints
//         nothing and the whole engine suite stays green, because nothing engine-side can see a
//         template.
//   2. `buildWaitWord` returning a raw week count
//      -> RED [2]: the wait case, and the ladder sweep.
//   3. the two bullets replaced with a price line (`formatCents`)
//      -> RED [1]: the no-money case.
//   4. a Sign/Refuse foot copied onto the arm from the kit letter
//      -> RED [1]: the notice case.
//   5. `weekLabel(offer.week)` used in place of `weekLabel(terms.orderedWeek)` in the lead sentence
//      -> RED [1]: the naming case (the order week is no longer on the paper).
//   6. the `build` arm deleted from `subjectOf` in InboxSheet.vue (so it falls through to the kit
//      branch and reads the terms as a kit deal)
//      -> RED [2], in tests/component/round29-inbox-subjects.test.ts: its own build case, and the
//         whole-post case that counts fourteen distinct subjects. ⭐ That file is where a new kind's
//         subject belongs, because its round-29 #16 defect was exactly a notice inheriting a title
//         in silence.
// ===========================================================================
