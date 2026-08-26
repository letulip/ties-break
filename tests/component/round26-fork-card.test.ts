// ⭐⭐⭐ ROUND 26 #2 AND #3 – THE FORK CARD, RENDERED, AGAINST THE CAREER THE COMPLAINTS CAME FROM.
//
// Two items, both of them about words on this card rather than about arithmetic behind it, and both
// of them proved HERE rather than against a source string: he reads the screen.
//
//   #2 REOPENED – «Ещё раз: почему university at home недоступен для Alice, я уже спрашивал».
//      Round 24 gave the dead rung a reason and he asked the same question a second time, which is
//      the tell that a reason is not yet an explanation. The shipped line was «The in-state price is
//      only for residents of the state, and she is not one»: a rule and its conclusion, with the
//      premise missing. THE FACT WAS TRUE OF HER – the save he sent carries `profile.country = 'AU'`
//      – and it was nowhere on the screen.
//      ⭐⭐⭐⭐ AND THEN HE OVERRULED THE RULE, NOT THE SENTENCE: «по-моему в каждой стране есть
//      домашний универ». So block 1 of this file no longer measures the refusal's WORDS – there is no
//      refusal. It measures the thing that replaced them, on her own career: three pressable rows and
//      the home place on the button. The block 1 that stood here (the plaque naming Australia, the
//      country varying by career, the American control drawing none) is described inside it, because
//      a re-aim is only honest if the reader can see what was traded.
//
//   #3a – «Что значит Top 100 for 74 in 100 в строке университета?» The row stated a measured count
//      of careers in a frame with no verb in it: a label, then two numbers. Same figure, said in
//      words.
//
//   #3b – «И почему у private этот показатель меньше, чем у state?» IT REALLY IS LOWER (74 against
//      85) and the mapping is not inverted, which is what the odds block below measures on the
//      rendered rows. The cause is money and it is in `the-college-answers-2026-08.md` §10i; nothing
//      here re-tunes a calibrated table.
//
// ⚠⚠ WHY THIS FILE WALKS A WORLD. `college-offer-card.test.ts` hand-builds quotes, which is right
// for the arithmetic cases and wrong for a claim about WHICH refusal a real career draws. Every case
// below drives `createWorld` -> `measureCollegeOffer` -> `toSnapshot`, so the country on the card is
// the country the engine priced the offer against.
import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import ForkDialog from '../../src/components/ForkDialog.vue'
// ⚠ THE REAL STYLESHEET, or the fit measurement below reads an empty cascade and passes vacuously.
import '../../src/style.css'
import { useGameStore } from '../../src/stores/game'
import { assertDismissReachable, measureDialog, setViewport, NARROW_PHONE, PHONE } from './fits'
import { createWorld, measureCollegeOffer, toSnapshot } from '../../src/engine/world'
import { COLLEGE_TIER_NAME, COLLEGE_TIER_ODDS, COLLEGE_TIER_ORDER } from '../../src/engine/collegeOffer'
import { COUNTRY_NAMES } from '../../src/composables/countries'
import { DEFAULT_PROFILE } from '../../src/shared/protocol'
import type { WorldState } from '../../src/engine/world'

/** ⚠ THE OWNER'S OWN CAREER SHAPE. `tennis-sim_alice-cfbv_w502.tsave` is read-only and is never a
 *  fixture – what is taken from it is the one FACT the complaint is about, her country, which the
 *  save carries as `AU`. Everything else here is a fresh world. */
const ALICE_COUNTRY = 'AU'

/** ⚠ THE TWO SENTENCES THIS CARD HAS ALREADY PRINTED HER, kept as literals for one purpose: a card
 *  that has quietly kept either of them must fail. Round 24's stated the rule's conclusion; round
 *  26's first pass named the fact under it. Both are refusals of a place the owner has since ruled is
 *  hers, so neither may appear anywhere on the screen. */
const ROUND_24_LINE = 'The in-state price is only for residents of the state, and she is not one.'
const ROUND_26_FIRST_PASS_FRAGMENT = 'only for residents of a US state'

function atTheFork(seed: string, country: string): WorldState {
  const world = createWorld(seed, { ...DEFAULT_PROFILE, country })
  // her junior record, so the rows carry real awards and no case is quietly reading a walk-on
  world.bestFinishByTier.j300 = 3
  world.fork = { askedWeek: world.week, answer: null, offer: measureCollegeOffer(world) }
  return world
}

function mountFor(world: WorldState, attach = false) {
  useGameStore().snapshot = toSnapshot(world)
  return mount(ForkDialog, attach ? { attachTo: document.body } : {})
}

// =================================================================================================
// 1. ⭐⭐⭐⭐ #2, SECOND PASS – HER OWN CAREER REACHES THE PLACE AT HOME
// =================================================================================================
//
// WHAT THIS BLOCK USED TO ASSERT, and it was right about a rule that no longer exists: that the
// refused row on an `AU` career carried `COLLEGE_SHUT_DETAIL['not-a-resident']('Australia')` word for
// word, that the noun varied by career rather than being hard-coded, and that a US career drew no
// refusal at all. It shipped on 25.08 and the owner read the report and answered «по-моему в каждой
// стране есть домашний универ» – he is overruling the RULE. So the same career, the same mount, the
// opposite verdict.
describe('⭐⭐⭐⭐ round 26 #2 – Alice can take the university at home', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    document.body.innerHTML = ''
  })

  // ⭐⭐⭐⭐ THE CASE THE COMPLAINT IS ABOUT, at her own country rather than at a stand-in.
  it('⭐⭐⭐⭐ draws the home place live on an AU career, and the button takes it', () => {
    const world = atTheFork('r26-2-alice', ALICE_COUNTRY)
    expect(world.fork!.offer!.quotes[0].tier, 'the cheapest place is the one at home').toBe('state')
    const w = mountFor(world)
    const first = w.findAll('.fork-place')[0]
    expect(first.text(), 'and it is named as such').toContain(COLLEGE_TIER_NAME.state)
    expect(first.attributes('disabled'), 'pressable, at last').toBeUndefined()
    expect(first.classes(), 'and not faded').not.toContain('is-shut')
    expect(w.findAll('.fork-answer')[1].text(), 'the button takes it by default').toContain(
      COLLEGE_TIER_NAME.state,
    )

    // ⚠⚠ MUTATION ARM, INLINE, AND IT IS THE ONE THAT MATTERS ON A REOPENED ITEM: neither sentence he
    // has already been shown may survive anywhere on this card. A build that kept the plaque and
    // merely enabled the button would pass the four lines above and fail these three.
    const card = w.text()
    expect(card, 'round 24\'s conclusion-only line is gone').not.toContain(ROUND_24_LINE)
    expect(card, 'and so is round 26\'s first pass').not.toContain(ROUND_26_FIRST_PASS_FRAGMENT)
    expect(w.findAll('.fork-place-refusal'), 'no refusal of any wording').toHaveLength(0)
    w.unmount()
  })

  // ⚠⚠ AND IT IS NOT A SPECIAL CASE FOR AUSTRALIA. The old block's anti-vacuity half asked whether
  // the noun varied by career; this one asks whether the RULE does – it must not, in either
  // direction. Four passports from four continents plus the US control, all drawing the same card.
  it('⚠⚠ every passport draws the same three live rows, US included', () => {
    for (const country of ['AU', 'CZ', 'BR', 'JP', 'US']) {
      const w = mountFor(atTheFork(`r26-2-varies-${country}`, country))
      expect(w.findAll('.fork-place[disabled]'), `${country}: nothing dead`).toHaveLength(0)
      expect(w.findAll('.fork-place-refusal'), `${country}: nothing to explain`).toHaveLength(0)
      expect(w.findAll('.fork-place')[0].text(), `${country}: the home place is first`).toContain(
        COLLEGE_TIER_NAME.state,
      )
      // ⚠ AND NO CARD NAMES A COUNTRY AT ALL ANY MORE. The refusal was the only line that did, so a
      // build still resolving `COUNTRY_NAMES` into this card is one still explaining something.
      expect(w.text(), `${country}: the card no longer needs her passport`).not.toContain(COUNTRY_NAMES[country])
      w.unmount()
    }
  })

  // ⭐⭐ THE CAPTIONS THEMSELVES, WHICH HAD TO STOP BEING US-SHAPED. «A university out of state» was
  // the sourced reason the second price was higher, and the source was the rule he deleted.
  it('⭐⭐ the ladder reads home / away / private, with no US vocabulary left on it', () => {
    const w = mountFor(atTheFork('r26-2-captions', ALICE_COUNTRY))
    const names = w.findAll('.fork-place-head strong').map((n) => n.text())
    expect(names).toEqual([COLLEGE_TIER_NAME.state, COLLEGE_TIER_NAME.national, COLLEGE_TIER_NAME.private])
    expect(names[0], 'the place at home').toBe('The university at home')
    expect(names[1], 'and the one she has to move for').toBe('A university away from home')
    // ⚠ THE WHOLE BLOCK, not just the captions: "in-state" and "out of state" are administrative
    // vocabulary a family in Osaka cannot read, and neither may appear anywhere in it.
    const block = w.find('.fork-places-block').text().toLowerCase()
    for (const jargon of ['in-state', 'out of state', 'out-of-state', 'resident']) {
      expect(block, `no US vocabulary ("${jargon}")`).not.toContain(jargon)
    }
    w.unmount()
  })
})

// =================================================================================================
// 2. ⭐⭐⭐ #3a – THE ODDS, SAID IN WORDS  ·  #3b – AND THE TABLE IS NOT MISLABELLED
// =================================================================================================
describe('⭐⭐⭐ round 26 #3 – the measured odds are readable, and mapped to the right places', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    document.body.innerHTML = ''
  })

  // ⭐⭐ #3a. ⚠ THE ASSERTION IS ON THE WHOLE PHRASE. Pinning the bare digits would pass on the frame
  // the owner could not read, which is the defect rather than the fix.
  it('⭐⭐ #3a – every row says how many careers in a hundred, and what they reached', () => {
    const w = mountFor(atTheFork('r26-3a-words', 'US'))
    const rows = w.findAll('.fork-place').map((b) => b.text())
    for (const [i, tier] of COLLEGE_TIER_ORDER.entries()) {
      expect(rows[i], `${tier}: the count, the hundred and the band`).toContain(
        `${COLLEGE_TIER_ODDS[tier].top100In100} in 100 reach the world top 100`,
      )
    }
    // ⚠⚠ MUTATION ARM: the assertion really does reject the round-24 frame it replaced.
    const oldFrame = `Top 100 for ${COLLEGE_TIER_ODDS.private.top100In100} in 100`
    expect(oldFrame, 'the old frame carried the same digits...').toContain('74')
    expect(oldFrame, '...and none of the words').not.toContain('reach the world top 100')
    expect(w.find('.fork-places').text(), 'and it is off the surface').not.toMatch(/Top 100 for \d/)

    // ⚠ A SHARE WITH NO SPAN UNDER IT IS NOT A MEASUREMENT – the window stays named once, under the
    // list, and this case would notice if the rewrite had eaten it.
    expect(w.findAll('.fork-places-note')).toHaveLength(1)
    expect(w.find('.fork-places-note').text()).toContain('53 careers')
    w.unmount()
  })

  // ⭐⭐⭐ #3b. HIS READING IS CORRECT AND THE LABELS ARE NOT SWAPPED, which are two different claims
  // and both are measured here. If the tiers were mis-mapped, the dear place's row would be carrying
  // another place's figure – so the check is NAME against ODDS on the rendered row, not tier id
  // against tier id, which would agree with itself.
  it('⭐⭐⭐ #3b – the dear place really does carry the lowest figure, on the row that names it', () => {
    const w = mountFor(atTheFork('r26-3b-mapping', 'US'))
    const rows = w.findAll('.fork-place')
    const byName = new Map(rows.map((r) => [r.find('.fork-place-head strong').text(), r.text()]))

    expect(byName.get(COLLEGE_TIER_NAME.state), 'the university at home').toContain('85 in 100')
    expect(byName.get(COLLEGE_TIER_NAME.national), 'a university out of state').toContain('93 in 100')
    expect(byName.get(COLLEGE_TIER_NAME.private), 'a private university').toContain('74 in 100')

    // ⚠⚠ SO THE INVERSION IS REAL AND IT IS THE MEASUREMENT, NOT A LABEL. The dearest place is also
    // the one with the lowest odds AND the highest price on the same row – which is the trade
    // `the-college-answers-2026-08.md` §10i measured (eleven of 53 careers there never finish; among
    // the ones the bill did not end the row is 85 / 94 / 82). ⚠ NOTHING HERE RE-TUNES IT.
    expect(COLLEGE_TIER_ODDS.private.top100In100).toBeLessThan(COLLEGE_TIER_ODDS.state.top100In100)
    expect(byName.get(COLLEGE_TIER_NAME.private), 'and the dearest price is on the same row').toContain(
      '$65,470 a year',
    )
    w.unmount()
  })
})

// =================================================================================================
// 3. ⭐⭐ AND THE LONGER CARD STILL FITS A PHONE (CLAUDE.md's round-20 #3 rule)
// =================================================================================================
//
// Both items above ADDED characters to a BLOCKING overlay – the refusal grew a clause and the odds
// line grew five words on every row. That is precisely the "one honest sentence at a time" growth
// the round-20 gotcha is about, so it is measured rather than reasoned about.
describe('⭐⭐ the card carries the longer copy and the way out is still reachable', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    document.body.innerHTML = ''
  })

  function attached(country: string, vp = PHONE) {
    setViewport(vp)
    const w = mountFor(atTheFork(`r26-fit-${country}-${vp.width}`, country), true)
    const card = document.querySelector('.fork-card')!
    const dismiss = document.querySelector('.fork-answers')!
    // ⚠ NOTHING HERE IS VACUOUS: all three rows and the long odds line are on the card. The refusal
    // used to be the third thing named here and it is gone (round 26 #2, second pass) – so the card
    // being measured is now SHORTER by one wrapped sentence, which makes the fit claim easier and the
    // mutation arm below the thing that keeps it honest.
    expect(document.querySelectorAll('.fork-place')).toHaveLength(3)
    expect(document.querySelector('.fork-places')!.textContent).toContain('in 100 reach the world top 100')
    expect(dismiss.lastElementChild?.textContent).toContain('Stop here')
    return { w, card, dismiss }
  }

  it('keeps the way out inside a 375x667 screen', () => {
    const { w, card, dismiss } = attached(ALICE_COUNTRY)
    const fit = assertDismissReachable(card, dismiss, PHONE, 'ForkDialog (round 26 copy)')
    expect(fit.available.height).toBe(635)
    expect(fit.cap, 'bounded by the room the scrim leaves').toBe(635)
    expect(fit.scrollable, 'and what is past the fold can be reached').toBe(true)
    w.unmount()
  })

  it('...and on the narrowest screen too', () => {
    const { w, card, dismiss } = attached(ALICE_COUNTRY, NARROW_PHONE)
    assertDismissReachable(card, dismiss, NARROW_PHONE, 'ForkDialog (round 26 copy, narrow)')
    w.unmount()
  })

  it('⚠⚠ MUTATION PROOF – take the cap off and the SAME assertion goes red', () => {
    const { w, card, dismiss } = attached(ALICE_COUNTRY)
    const before = measureDialog(card, dismiss, PHONE)
    expect(
      before.contentFloor,
      'the card really is taller than the phone, or the mutation is vacuous',
    ).toBeGreaterThan(before.available.height)
    ;(card as HTMLElement).style.maxHeight = 'none'
    ;(card as HTMLElement).style.overflowY = 'visible'
    expect(() => assertDismissReachable(card, dismiss, PHONE, 'ForkDialog (cap removed)')).toThrow(
      /taller than the screen|outside the viewport/,
    )
    w.unmount()
  })
})
