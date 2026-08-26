// ⭐⭐⭐⭐ ROUND 26 #2, SECOND PASS – THE LADDER READS ANYWHERE, AND THE ROW STILL FITS A PHONE.
//
// The owner, having read the first pass's report (which proved the refusal internally consistent and
// then reported that 23 of the 24 playable countries could never meet it):
//
//   «по-моему в каждой стране есть домашний универ»
//
// He is overruling the RULE, not the sentence. Two things follow and this file measures both of them
// on a MOUNTED card with a real cascade, never on a source string:
//
//   1. THE WORDS. «A university out of state» was US administrative vocabulary whose own round-21
//      justification was that it «is not jargon here, it is the sourced reason the second price is
//      higher than the first» – and that reason was US residence, which he has just deleted. The
//      ladder reads HOME / AWAY FROM HOME / PRIVATE now, which is true of a family in Adelaide, in
//      Osaka and in Belgrade, and says the same thing about the price: she cannot sleep at home.
//   2. THE WIDTH, WHICH IS A MEASUREMENT AND NOT A REASSURANCE. `.fork-place-head` puts the caption
//      and the price on ONE line with `space-between`, and round 21 already lost a definite article
//      on this exact row because 46 character-units did not fit in the 44 a 320px card holds. The new
//      caption is TWO characters longer than the one it replaces, so the honest thing is an A/B on
//      the same mounted card at 320x568: swap the old caption back in and the modelled content floor
//      must not move. With a mutation arm, because a floor model that cannot see a wrap would make
//      that comparison meaningless.
//
// ⚠⚠ AND THE THIRD CLAIM IS AN ABSENCE, WHICH NEEDS ITS OWN INSTRUMENT. `.is-shut` and
// `.fork-place-refusal` left the template AND the stylesheet; a DOM check alone would still pass on a
// build that kept the CSS rule and merely stopped emitting the class. So the fade is asked for
// directly – the class is put onto a live row and the real cascade is read back.
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import ForkDialog from '../../src/components/ForkDialog.vue'
// ⚠ THE REAL STYLESHEET, or every measurement below reads an empty cascade and passes vacuously.
import '../../src/style.css'
import { useGameStore } from '../../src/stores/game'
import { measureDialog, setViewport, assertDismissReachable, NARROW_PHONE } from './fits'
import { createWorld, measureCollegeOffer, toSnapshot } from '../../src/engine/world'
import { COLLEGE_TIER_NAME, COLLEGE_TIER_ORDER } from '../../src/engine/collegeOffer'
import { DEFAULT_PROFILE } from '../../src/shared/protocol'
import type { WorldState } from '../../src/engine/world'

// ⚠⚠ THE COMPONENT PROJECT DECLARES NO `testTimeout`, SO IT RUNS AT VITEST'S 5s DEFAULT, and round 26
// #16 is that ceiling meeting CI's 2-core runner. Measured on an idle machine, 26.08: this file is
// 949ms and its slowest case is **477ms** (the 320x568 width A/B – three `measureDialog` passes over
// the whole card, each walking the real cascade). At the 4-5x CI factor that is **1.9-2.4s** against
// 5s: inside it today, and one more measured arm from not being. The neighbouring round-26 mounted
// files carry the same line for the same reason.
vi.setConfig({ testTimeout: 30_000 })

/** the caption this round replaced, kept as a literal for one job: being the A arm of the width
 *  measurement, and proving the new assertions can tell the two apart. */
const ROUND_21_CAPTION = 'A university out of state'

/** ⚠ HER OWN CAREER'S COUNTRY. `tennis-sim_alice-cfbv_w502.tsave` is read-only and never a fixture;
 *  the one fact taken from it is the country the complaint is about. */
const ALICE_COUNTRY = 'AU'

function atTheFork(seed: string, country: string): WorldState {
  const world = createWorld(seed, { ...DEFAULT_PROFILE, country })
  world.bestFinishByTier.j300 = 3
  world.fork = { askedWeek: world.week, answer: null, offer: measureCollegeOffer(world) }
  return world
}

function mountFor(world: WorldState, attach = false) {
  useGameStore().snapshot = toSnapshot(world)
  return mount(ForkDialog, attach ? { attachTo: document.body } : {})
}

describe('⭐⭐⭐⭐ round 26 #2 – the ladder is legible outside the United States', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    document.body.innerHTML = ''
  })

  it('⭐⭐⭐ the three captions, rendered, are home / away from home / private', () => {
    const w = mountFor(atTheFork('r26-home-captions', ALICE_COUNTRY))
    const names = w.findAll('.fork-place-head strong').map((n) => n.text())
    expect(names, 'in price order, cheapest first').toEqual(
      COLLEGE_TIER_ORDER.map((t) => COLLEGE_TIER_NAME[t]),
    )
    expect(names[0]).toBe('The university at home')
    expect(names[1]).toBe('A university away from home')
    expect(names[2]).toBe('A private university')
    // ⚠ THE PAIR IS A CONTRAST, WHICH IS WHAT MAKES THE PRICE GAP LEGIBLE WITHOUT A GLOSSARY: the
    // second caption is the first one negated, and the third is on a different axis entirely.
    expect(names[1].toLowerCase(), 'the away place names the same noun the home place does').toContain('home')
    expect(names[2].toLowerCase(), 'and the dear place is an ownership, not a distance').not.toContain('home')
    // ⚠ AND THE OLD CAPTION IS REALLY GONE FROM THE SCREEN, not merely absent from this list.
    expect(w.text(), 'the round-21 caption is not still being printed somewhere').not.toContain(ROUND_21_CAPTION)
    w.unmount()
  })

  // ⭐⭐⭐ THE WIDTH, AS AN A/B ON ONE MOUNTED CARD. Two characters longer than the caption it
  // replaces, on the row that has already cost this card a definite article once.
  it('⭐⭐⭐ the longer caption costs no line at 320x568 – measured, not reasoned about', () => {
    setViewport(NARROW_PHONE)
    const w = mountFor(atTheFork('r26-home-width', ALICE_COUNTRY), true)
    const card = document.querySelector('.fork-card')!
    const dismiss = document.querySelector('.fork-answers')!
    const shipped = measureDialog(card, dismiss, NARROW_PHONE).contentFloor

    // A: the round-21 caption, swapped into the live DOM and re-measured through the same cascade.
    const away = document.querySelectorAll('.fork-place-head strong')[1] as HTMLElement
    expect(away.textContent, 'the B arm really is the shipped caption').toBe(COLLEGE_TIER_NAME.national)
    away.textContent = ROUND_21_CAPTION
    const round21 = measureDialog(card, dismiss, NARROW_PHONE).contentFloor
    expect(shipped, 'the two extra characters do not wrap the row').toBe(round21)

    // ⚠⚠ MUTATION ARM – AND IT IS THE ONE THAT MAKES THE EQUALITY ABOVE MEAN ANYTHING. A floor model
    // blind to wrapping would report equality for any caption at all, so make one that MUST wrap and
    // watch the floor move.
    away.textContent = `${ROUND_21_CAPTION} and then some more words than any row could hold`
    expect(
      measureDialog(card, dismiss, NARROW_PHONE).contentFloor,
      'the instrument can see a wrapped caption – it just does not find one',
    ).toBeGreaterThan(shipped)

    away.textContent = COLLEGE_TIER_NAME.national
    w.unmount()
  })

  it('⚠ and the way out is still reachable on the narrowest screen the app supports', () => {
    setViewport(NARROW_PHONE)
    const w = mountFor(atTheFork('r26-home-fit', ALICE_COUNTRY), true)
    const card = document.querySelector('.fork-card')!
    const dismiss = document.querySelector('.fork-answers')!
    expect(document.querySelectorAll('.fork-place'), 'nothing here is vacuous').toHaveLength(3)
    expect(dismiss.lastElementChild?.textContent).toContain('Stop here')
    assertDismissReachable(card, dismiss, NARROW_PHONE, 'ForkDialog (home university, narrow)')
    w.unmount()
  })

  // ⭐⭐⭐ THE ABSENCE, ASKED OF THE CASCADE AND NOT ONLY OF THE DOM. A build that stopped emitting
  // `is-shut` but kept `.fork-place.is-shut .fork-place-head { opacity: .55 }` in the stylesheet is a
  // build that still knows how to grey a refused row – and the next template edit would bring it
  // back for free. So the class is put onto a live row and the real cascade is read back.
  it('⭐⭐⭐ the shut-row fade is gone from the stylesheet, not just from the markup', () => {
    const w = mountFor(atTheFork('r26-home-fade', ALICE_COUNTRY), true)
    const row = document.querySelector('.fork-place') as HTMLElement
    const head = row.querySelector('.fork-place-head') as HTMLElement
    // ⚠ happy-dom returns '' for an unset `opacity` rather than '1', so an unset value reads as the
    // initial one. A bare `Number('')` is 0, which would make this assertion say the opposite.
    const opacityOf = (el: Element): number => {
      const v = getComputedStyle(el).opacity
      return v === '' ? 1 : Number(v)
    }
    expect(opacityOf(head), 'a live row is at full strength to begin with').toBe(1)
    row.classList.add('is-shut')
    expect(opacityOf(head), 'and the class no longer means anything').toBe(1)
    row.classList.remove('is-shut')
    // ...and no card in any country emits it, which is the DOM half of the same claim.
    expect(document.querySelectorAll('.fork-place.is-shut')).toHaveLength(0)
    expect(document.querySelectorAll('.fork-place-refusal')).toHaveLength(0)
    w.unmount()
  })
})
