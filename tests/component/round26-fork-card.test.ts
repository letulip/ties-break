// ⭐⭐⭐ ROUND 26 #2 AND #3 – THE FORK CARD, RENDERED, AGAINST THE CAREER THE COMPLAINTS CAME FROM.
//
// Two items, both of them about words on this card rather than about arithmetic behind it, and both
// of them proved HERE rather than against a source string: he reads the screen.
//
//   #2 REOPENED – «Ещё раз: почему university at home недоступен для Alice, я уже спрашивал».
//      Round 24 gave the dead rung a reason and he asked the same question a second time, which is
//      the tell that a reason is not yet an explanation. The shipped line was «The in-state price is
//      only for residents of the state, and she is not one»: a rule and its conclusion, with the
//      premise missing. THE FACT IS TRUE OF HER – the save he sent carries `profile.country = 'AU'`
//      and `tierShutFor('state', 'AU')` is `not-a-resident` – and it was nowhere on the screen.
//      Nothing anywhere in the game prints what it thinks her residence is, so the sentence could
//      not be agreed with, disagreed with, or acted on.
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
import {
  COLLEGE_SHUT_DETAIL,
  COLLEGE_TIER_NAME,
  COLLEGE_TIER_ODDS,
  COLLEGE_TIER_ORDER,
  tierShutFor,
} from '../../src/engine/collegeOffer'
import { COUNTRY_NAMES } from '../../src/composables/countries'
import { DEFAULT_PROFILE } from '../../src/shared/protocol'
import type { WorldState } from '../../src/engine/world'

/** ⚠ THE OWNER'S OWN CAREER SHAPE. `tennis-sim_alice-cfbv_w502.tsave` is read-only and is never a
 *  fixture – what is taken from it is the one FACT the complaint is about, her country, which the
 *  save carries as `AU`. Everything else here is a fresh world. */
const ALICE_COUNTRY = 'AU'

/** the round-24 sentence, kept as a literal for one purpose: proving the new assertions can tell the
 *  two apart. A guard that passes on the line it replaced is not a guard. */
const ROUND_24_LINE = 'The in-state price is only for residents of the state, and she is not one.'

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
// 1. ⭐⭐⭐ #2 – THE REFUSAL NAMES THE FACT, ON HER OWN CAREER
// =================================================================================================
describe('⭐⭐⭐ round 26 #2 – the shut rung says what the game thinks her residence IS', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    document.body.innerHTML = ''
  })

  // ⭐⭐⭐ THE CASE THE COMPLAINT IS ABOUT, at her own country rather than at a stand-in.
  it('⭐⭐⭐ names Australia on the row it refuses, in the engine\'s own sentence', () => {
    const world = atTheFork('r26-2-alice', ALICE_COUNTRY)
    expect(world.fork!.offer!.quotes[0], 'the cheapest place really is shut for her').toMatchObject({
      tier: 'state',
      open: false,
    })
    const w = mountFor(world)
    const plaque = w.findAll('.fork-place')[0].find('.fork-place-refusal')
    expect(plaque.exists(), 'a refused row is never silent').toBe(true)

    // the words are the ENGINE'S, resolved with the name the CARD resolves
    expect(plaque.text()).toBe(COLLEGE_SHUT_DETAIL['not-a-resident'](COUNTRY_NAMES[ALICE_COUNTRY]))
    // ...and the fact is legible without a glossary
    expect(plaque.text(), 'the fact, in words').toContain('Australia')
    expect(plaque.text(), 'and the rule she fails').toContain('US state')

    // ⚠⚠ MUTATION ARM, INLINE. The three assertions above have to be able to tell the new sentence
    // from the one the owner already read twice – otherwise this file green-lights round 24 again.
    expect(ROUND_24_LINE, 'the old line names no fact').not.toContain('Australia')
    expect(plaque.text(), 'and the card is not still printing it').not.toBe(ROUND_24_LINE)
    expect(plaque.text(), 'nor its conclusion-only clause').not.toContain('she is not one')
    w.unmount()
  })

  // ⚠⚠ THE NOUN IS HER CAREER'S, NOT A CONSTANT. A card that hard-coded one country would pass the
  // case above and fail this one – which is the whole difference between a fact and a decoration.
  it('⚠⚠ a different career draws a different country, and an American draws no refusal at all', () => {
    for (const country of ['AU', 'CZ', 'BR']) {
      const w = mountFor(atTheFork(`r26-2-varies-${country}`, country))
      const plaque = w.findAll('.fork-place')[0].find('.fork-place-refusal')
      expect(plaque.text(), `${country}: its own home`).toContain(COUNTRY_NAMES[country])
      for (const other of ['AU', 'CZ', 'BR'].filter((c) => c !== country)) {
        expect(plaque.text(), `${country}: and nobody else's`).not.toContain(COUNTRY_NAMES[other])
      }
      w.unmount()
    }
    // ⚠ THE ANTI-VACUITY HALF: the rung is REACHABLE, so this is a fact about her career and not a
    // dead row wearing a reason. An American career draws three live places and explains nothing.
    const home = mountFor(atTheFork('r26-2-home', 'US'))
    expect(tierShutFor('state', 'US'), 'the in-state place is open to a US career').toBeNull()
    expect(home.findAll('.fork-place-refusal'), 'so there is nothing to explain').toHaveLength(0)
    expect(home.findAll('.fork-place[disabled]')).toHaveLength(0)
    home.unmount()
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
    // ⚠ NOTHING HERE IS VACUOUS: the long refusal and the long odds line are both on the card.
    expect(document.querySelector('.fork-place-refusal')!.textContent).toContain(COUNTRY_NAMES[country])
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
