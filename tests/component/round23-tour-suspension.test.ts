// ROUND 23 ITEM 2 – THE SUSPENSION LETTER'S CLOSING LINE.
//
// The owner, 19.08: «Письмо Entries Suspended вызывает во мне странные чувства, особенно последняя
// строчка этого письма. Как будто её откуда-то сняли. Может быть можем как-то переформулировать?»
//
// ⚠ MOUNTED, BECAUSE THE COMPLAINT IS ABOUT A RENDERED LINE. The copy lives in a `<template>` in
// OfferLetter.vue with `weekLabel(tourTerms.untilWeek)` interpolated into it, so the sentence he
// actually read exists nowhere in the source. Reading it required rendering it with a real
// suspension on a real career week – which is what this file does, and what makes the assertion
// below about the LETTER rather than about a string constant.
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import OfferLetter from '../../src/components/OfferLetter.vue'
import { createWorld, chargeMandatoryPenalty, type WorldState } from '../../src/engine/world'
import { ECONOMY } from '../../src/engine/economy'
import { DEFAULT_PROFILE, type Offer, type TourLetterTerms } from '../../src/shared/protocol'

/** A career carrying a REAL suspension: the engine's own charge path, called until the tenth point
 *  lands, so `suspendedUntilWeek` and the letter are the ones a career produces and not a literal. */
function suspendedCareer(): { world: WorldState; letter: Offer; week: number } {
  const world = createWorld('round23-suspension', { ...DEFAULT_PROFILE })
  // A professional week deep enough that the top-50 commitment regime is the regime she is in –
  // five seasons in, which is where the owner's own career sits.
  let week = 260
  // 4 points a time (the no-show, the dearest of the three sources) until the tour hands one down.
  while (world.suspendedUntilWeek === null && week < 268) {
    chargeMandatoryPenalty(world, week, ECONOMY.mandatory.noShowPoints, 'no-show')
    week += 1
  }
  const chargedAt = week - 1
  const letter = world.offers.find((o) => o.id === `tour-suspension-${chargedAt}`)
  expect(letter, 'the engine wrote a suspension letter').toBeTruthy()
  return { world, letter: letter!, week: chargedAt }
}

const clean = (s: string) => s.replace(/\s+/g, ' ').trim()

/** The letter as the reader has it: the lead paragraph, then the bullets, then the sign-off – read
 *  off the DOM rather than out of `wrapper.text()`, which joins the whole sheet into one string and
 *  would let a claim about the LAST line pass on a match anywhere. */
function renderLetter(): { body: string; bullets: string[]; signOff: string; terms: TourLetterTerms } {
  const { letter, week } = suspendedCareer()
  const wrapper = mount(OfferLetter, { props: { offer: letter, week } })
  const body = clean(wrapper.get('.offer-body').text())
  const bullets = wrapper.findAll('.offer-terms li').map((n) => clean(n.text()))
  const signOff = clean(wrapper.get('.offer-sign-off').text())
  wrapper.unmount()
  return { body, bullets, signOff, terms: letter.terms as TourLetterTerms }
}

describe('Round 23 #2 – the Entries Suspended letter, as rendered', () => {
  it('still states WHY the entries are suspended and WHAT ends it', () => {
    const { body, bullets, terms } = renderLetter()
    // The mechanic is untouched: the owner asked about the wording, not about the rule.
    expect(body).toContain('Entries are suspended through')
    expect(body).toContain(`${terms.runningPoints} penalty points inside 52 weeks`)
    expect(body, 'the date the sentence ends is on the paper').toMatch(/W\d+ '\d\d/)
    expect(bullets[0]).toContain('she may not enter a tournament until that week has passed')
  })

  it('⚠ the CLOSING line no longer reads as a thing being taken away from her', () => {
    const { bullets, signOff } = renderLetter()
    expect(signOff, 'the desk signs the paper, so the bullets really are the last of it').toBe(
      '– Tour office',
    )
    const closing = bullets[bullets.length - 1]

    // ⚠ THE OLD LINE, VERBATIM, so a revert cannot pass this file: «Nothing is owed and nothing is
    // taken back.» Two denials of things nobody had proposed – and "taken back" is the one that did
    // the damage, because a sentence promising that nothing is revoked can only be parsed by first
    // supposing that something could be. That is the «как будто её откуда-то сняли» he felt.
    expect(closing).not.toContain('taken back')
    expect(closing).not.toMatch(/nothing is owed and nothing/i)

    // ...and what stands there instead says both of the old line's true facts as a PRESENCE: her
    // standing survives the sentence, and the sentence carries no bill.
    expect(closing).toContain('Her ranking, her points and her place on every entry list are')
    expect(closing).toContain('exactly where she left them')
    expect(closing, 'the price is named, not softened').toContain('the weeks are the whole price')
    expect(closing, "the old line's other fact – no money is owed").toContain('no fine on top')
  })

  // ⚠ NO SOURCE PIN BESIDE THESE, deliberately. The other three tour notices (due / penalty /
  // season) never carried the retired line, and the two assertions above are made against the
  // RENDERED letter – which is the claim the owner made. A grep over OfferLetter.vue would add a
  // second, weaker statement of the same thing and would break on contact with any re-layout.
})
