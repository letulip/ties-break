// ⭐⭐⭐ ROUND 24 #2a – THE FORK'S THREE PLACES: READABLE BEFORE THE CHOICE, AND NO REFUSAL WITHOUT
// A REASON (docs/plans/college-the-flow.md §2a).
//
// THE COMPLAINT WAS TWO FAULTS IN ONE SENTENCE. The owner, after a played career, reported that the
// descriptions and the choice of colleges sat UNDER the button that chooses one, and that he could
// not tell why the cheapest place was unpickable. (His words are in the plan; a test file may carry
// them, and the `.vue` may not – that file is English-only by its own rule.)
//
//   1. THE CHOICES WERE BEHIND THE CONTROL THAT SPENDS THEM. `.fork-places` shipped inside
//      `.fork-answers`, below "Take the college place", so the most expensive click in the game
//      (three answers, two of which end the career) asked him to choose before he could read.
//   2. ⭐ AND A RUNG WAS REFUSED WITHOUT SAYING WHY. This project has a house rule about refusals
//      naming their reason – `EntryStatus.ineligibleReason` + `ineligibleDetail`, the coach market's
//      locked plaque – and this card was outside it: the row went dead and the TEMPLATE typed its
//      own sentence beside the boolean.
//
// ⚠⚠ WHY THIS FILE WALKS A WORLD INSTEAD OF HANDING THE CARD PROPS. `tests/component/
// college-offer-card.test.ts` builds its quotes by hand, which is right for the arithmetic cases and
// WRONG for this one: hand-setting `open: false` proves the card can draw a refusal, not that it
// draws the refusal THE ENGINE MADE. Every case below drives `createWorld` -> `measureCollegeOffer`
// -> `toSnapshot` and then asserts the card against `tierShutFor` / `COLLEGE_SHUT_DETAIL` – the same
// functions `quoteFor` used to decide `open` in the first place. A card that invented its own verdict
// or its own words fails here and cannot fail there.
//
// ⚠ AND THE LAST BLOCK IS THE OTHER HALF OF INVARIANT 1: `answerFork` re-validates the tier
// engine-side and falls back to THE CHEAPEST PLACE OPEN TO HER. The card's stated default is
// asserted to be the tier the engine actually records, so the promise and the ledger cannot part.
import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import ForkDialog from '../../src/components/ForkDialog.vue'
// ⚠ THE REAL STYLESHEET, or the fit measurement below reads an empty cascade and passes vacuously.
import '../../src/style.css'
import { useGameStore } from '../../src/stores/game'
import { assertDismissReachable, measureDialog, setViewport, NARROW_PHONE, PHONE } from './fits'
import { createWorld, answerFork, measureCollegeOffer, toSnapshot } from '../../src/engine/world'
import {
  COLLEGE_SHUT_DETAIL,
  COLLEGE_TIER_NAME,
  COLLEGE_TIER_ORDER,
  tierShutFor,
} from '../../src/engine/collegeOffer'
import { DEFAULT_PROFILE } from '../../src/shared/protocol'
// ⚠ ROUND 26 #2 – the card names her home country, and this is the app's one copy of those names.
import { COUNTRY_NAMES } from '../../src/composables/countries'
import type { WorldState } from '../../src/engine/world'

/** ⚠ A REAL CAREER STANDING AT THE FORK, and the offer is the engine's own. `resolveEndings` raises
 *  the fork with exactly this line (`world/endings.ts`: `offer: measureCollegeOffer(world)`), so this
 *  is the state a played career arrives in rather than a shape invented for a test.
 *
 *  ⚠ THE ONE THING SET BY HAND IS HER JUNIOR RECORD, so the awards on the rows are non-zero and the
 *  cases are not quietly all reading a walk-on. `bestFinishByTier` is the high-water mark
 *  `collegeRecruitViewOf` folds; 3 is a J300 semi-final. Residence is NOT set by hand – it comes off
 *  the profile, which is what the engine reads. */
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

/** the quotes as the SNAPSHOT carries them – the same objects `answerFork` re-validates against */
function quotesOf(world: WorldState) {
  const offer = toSnapshot(world).fork?.offer
  expect(offer, 'the fork is open and carries an offer').toBeTruthy()
  return offer!.quotes
}

// A girl on a student visa: the in-state price is not hers. `US` is the control.
const ABROAD = 'CZ'

// =================================================================================================
// 1. ⭐⭐⭐ EVERY REFUSED TIER STATES A REASON, AND IT IS THE ONE THE ENGINE WOULD GIVE
// =================================================================================================
describe('⭐⭐⭐ round 24 #2a – a refused place says why, in the engine\'s own words', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    document.body.innerHTML = ''
  })

  // ⚠⚠ THIS IS THE CASE THE OWNER'S SENTENCE IS ABOUT. Written as a sweep over both residence
  // classes rather than as a spot check, because the property is "EVERY refused tier", and a spot
  // check on the one tier that happens to be shut today would pass on a card that hard-codes it.
  it('⭐⭐⭐ every row the card refuses states the engine\'s reason – and no open row states one', () => {
    for (const country of [ABROAD, 'US']) {
      const world = atTheFork(`r24-2a-reason-${country}`, country)
      const w = mountFor(world)
      const places = w.findAll('.fork-place')
      expect(places, 'three places, whatever her passport').toHaveLength(3)

      let refusedSeen = 0
      for (const [i, tier] of COLLEGE_TIER_ORDER.entries()) {
        // THE ENGINE'S ANSWER, asked of the same function `quoteFor` asked when it set `open`.
        const shut = tierShutFor(tier, country)
        const plaque = places[i].find('.fork-place-refusal')
        if (shut === null) {
          expect(places[i].attributes('disabled'), `${country} ${tier}: open, so pressable`).toBeUndefined()
          expect(plaque.exists(), `${country} ${tier}: an open row explains nothing`).toBe(false)
          continue
        }
        refusedSeen += 1
        expect(places[i].attributes('disabled'), `${country} ${tier}: shut, so not pressable`).toBeDefined()
        expect(plaque.exists(), `${country} ${tier}: a refused row is never silent`).toBe(true)
        // ⭐ AND THE WORDS ARE THE ENGINE'S, not this card's. A sentence typed into the template
        // passes the line above and fails this one.
        // ⚠⚠ RE-AIMED BY ROUND 26 #2: the map holds functions and the sentence names her home. The
        // argument is resolved the way the CARD resolves it, off `COUNTRY_NAMES`, so a card that
        // named the wrong country – or the two-letter code – fails on the equality below.
        expect(plaque.text(), `${country} ${tier}: the engine's own sentence`).toBe(
          COLLEGE_SHUT_DETAIL[shut](COUNTRY_NAMES[country] ?? country),
        )
        expect(plaque.text().length, 'and it actually says something').toBeGreaterThan(20)
      }
      expect(refusedSeen, `${country}: the sweep is not vacuous`).toBe(country === 'US' ? 0 : 1)
      w.unmount()
    }
  })

  // ⚠⚠ THE ANTI-VACUITY HALF, AND IT IS THE ONE THAT MAKES THE CASE ABOVE A MEASUREMENT. Both
  // residence classes must really be different on this screen, or the sweep proves nothing.
  it('⚠ the two residence classes really do draw different cards', () => {
    const abroad = mountFor(atTheFork('r24-2a-split-abroad', ABROAD))
    const home = mountFor(atTheFork('r24-2a-split-home', 'US'))
    expect(abroad.findAll('.fork-place-refusal'), 'one refusal abroad').toHaveLength(1)
    expect(home.findAll('.fork-place-refusal'), 'none at home').toHaveLength(0)
    expect(abroad.findAll('.fork-place[disabled]')).toHaveLength(1)
    expect(home.findAll('.fork-place[disabled]')).toHaveLength(0)
    abroad.unmount()
    home.unmount()
  })

  // ⭐⭐ ONE QUESTION, ONE ANSWER. `answerFork` re-validates on the PERSISTED `quote.open`; this
  // asserts the card's dead rows are exactly that boolean's false cases, so a stale screen and the
  // engine cannot hold different opinions about which rung is shut (CLAUDE.md invariant 1).
  it('⭐⭐ the card refuses exactly the rows the engine\'s own `open` refuses', () => {
    for (const country of [ABROAD, 'US']) {
      const world = atTheFork(`r24-2a-agree-${country}`, country)
      const quotes = quotesOf(world)
      const w = mountFor(world)
      const places = w.findAll('.fork-place')
      for (const [i, q] of quotes.entries()) {
        const drawnShut = places[i].attributes('disabled') !== undefined
        expect(drawnShut, `${country} ${q.tier}: the screen and the engine agree`).toBe(!q.open)
        expect(places[i].find('.fork-place-refusal').exists(), `${country} ${q.tier}: reason iff refused`).toBe(!q.open)
      }
      w.unmount()
    }
  })

  // ⚠ AND THE REFUSAL IS NOT DIMMED WITH THE ROW. The greying is what made it unreadable: the row
  // faded to 0.55 and took its own explanation with it. `.fork-place-refusal` is outside that fade.
  it('⚠ the reason is the one thing on a refused row that is not faded out', () => {
    const world = atTheFork('r24-2a-legible', ABROAD)
    const w = mountFor(world, true)
    const row = document.querySelector('.fork-place.is-shut') as HTMLElement
    expect(row, 'a shut row is on the card').toBeTruthy()
    // ⚠ happy-dom returns '' for an unset `opacity` rather than '1', so an unset value is read as
    // the initial one. A bare `Number('')` is 0, which would have made this assertion say the
    // opposite of what it means.
    const opacityOf = (el: Element): number => {
      const v = getComputedStyle(el).opacity
      return v === '' ? 1 : Number(v)
    }
    const plaque = row.querySelector('.fork-place-refusal')!
    expect(opacityOf(plaque), 'the reason reads at full strength').toBe(1)
    // ...while the figures it explains are the part that is dimmed.
    expect(opacityOf(row.querySelector('.fork-place-head')!), 'and the row still reads as unavailable').toBeLessThan(1)
    w.unmount()
  })
})

// =================================================================================================
// 2. ⭐⭐ THE QUOTES ARE READABLE BEFORE THE CHOICE IS MADE
// =================================================================================================
describe('⭐⭐ round 24 #2a – the three places are read before anything is chosen', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    document.body.innerHTML = ''
  })

  // ⭐⭐ THE FIRST FAULT, AS A FACT ABOUT DOCUMENT ORDER. Not "the block exists" – it existed
  // before, underneath the button. What was wrong was WHERE, so that is what is asserted.
  it('⭐⭐ puts the places BEFORE the answers, not under the button that spends them', () => {
    const w = mountFor(atTheFork('r24-2a-order', 'US'), true)
    const block = document.querySelector('.fork-places-block')!
    const answers = document.querySelector('.fork-answers')!
    expect(block, 'the places block is on the card').toBeTruthy()
    expect(
      block.compareDocumentPosition(answers) & Node.DOCUMENT_POSITION_FOLLOWING,
      'the answers come after the places',
    ).toBeTruthy()
    // ...and it is no longer inside an answer at all, which is what put it below the button.
    expect(document.querySelector('.fork-answers .fork-places'), 'not nested in the answers').toBeNull()
    expect(document.querySelector('.fork-answer .fork-places'), 'and not inside a button').toBeNull()
    w.unmount()
  })

  // ⚠ READABLE means the prices, the awards and the bills are ON the card with NOTHING chosen –
  // a card that revealed them on press would satisfy the ordering case above and still be the bug.
  it('⭐⭐ every price, award and bill is on screen while nothing is pressed', () => {
    const world = atTheFork('r24-2a-readable', 'US')
    const quotes = quotesOf(world)
    const w = mountFor(world)
    const places = w.findAll('.fork-place')
    for (const b of places) expect(b.attributes('aria-pressed'), 'nothing is preselected').toBe('false')
    for (const [i, q] of quotes.entries()) {
      const text = places[i].text()
      expect(text, `${q.tier}: named`).toContain(COLLEGE_TIER_NAME[q.tier])
      expect(text, `${q.tier}: priced`).toMatch(/\$[\d,]+ a year/)
      expect(text, `${q.tier}: the award`).toMatch(/Walk-on|full ride|the bill/)
      expect(text, `${q.tier}: what the family pays`).toMatch(/Family pays/)
    }
    // and the window the odds were measured over is still named exactly once, under the list
    expect(w.findAll('.fork-places-note')).toHaveLength(1)
    w.unmount()
  })

  // ⚠ RULING 4 SURVIVES THE MOVE (30.07 – the card «may not recommend»). Moving the block out of
  // `.fork-answers` could have made it a fourth control; it did not.
  it('⚠ three answers, one weight, and the places are still not answers', () => {
    const w = mountFor(atTheFork('r24-2a-ruling4', ABROAD))
    const answers = w.findAll('.fork-answer')
    expect(answers).toHaveLength(3)
    for (const a of answers) {
      expect(a.attributes('disabled'), 'no answer is refused').toBeUndefined()
      expect(a.classes(), 'and none is decorated').toEqual(['fork-answer'])
    }
    expect(w.findAll('.fork-places .fork-answer'), 'no place is an answer').toHaveLength(0)
    expect(w.findAll('.tb-pill'), 'still no primary').toHaveLength(0)
    // ⚠ AND THE REFUSAL MAY NOT BE ADVICE. Ruling 4 again: naming the other rows would be telling
    // him which to take.
    const plaque = w.find('.fork-place-refusal').text().toLowerCase()
    for (const steer of ['should', 'better', 'instead', 'recommend', 'consider', 'try ']) {
      expect(plaque, `the refusal offers no verdict ("${steer}")`).not.toContain(steer)
    }
    w.unmount()
  })
})

// =================================================================================================
// 3. ⭐⭐ AND THE LONGER CARD STILL FITS A PHONE (CLAUDE.md's round-20 #3 rule)
// =================================================================================================
//
// This wave added a heading and a refusal line to a BLOCKING overlay – "a dialog grows by one honest
// sentence at a time and nothing objects until it is taller than a phone". The mutation case is what
// makes the two above mean anything.
describe('⭐⭐ the fork card, with the places above the answers, fits a phone', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    document.body.innerHTML = ''
  })

  function attached(country: string, vp = PHONE) {
    // ⚠ THE VIEWPORT FIRST – happy-dom resolves lengths at `getComputedStyle` time.
    setViewport(vp)
    const w = mountFor(atTheFork(`r24-2a-fit-${country}-${vp.width}`, country), true)
    const card = document.querySelector('.fork-card')!
    const dismiss = document.querySelector('.fork-answers')!
    expect(document.querySelector('.fork-places-block'), 'the places are on it – nothing here is vacuous').toBeTruthy()
    // ⚠ `measureDialog` reads the dismiss box off the card's own bottom edge, so the control it
    // measures has to be the last thing in the flow. Moving the places out of `.fork-answers` is
    // exactly what could have broken that, so it is checked rather than assumed.
    expect(dismiss.lastElementChild?.textContent).toContain('Stop here')
    return { w, card, dismiss }
  }

  it('keeps the way out inside a 375x667 screen, with a refusal on the card', () => {
    const { w, card, dismiss } = attached(ABROAD)
    expect(document.querySelector('.fork-place-refusal'), 'and the refusal is one of the sentences measured').toBeTruthy()
    const fit = assertDismissReachable(card, dismiss, PHONE, 'ForkDialog (places above)')
    expect(fit.available.height).toBe(635)
    expect(fit.cap, 'bounded by the room the scrim leaves').toBe(635)
    expect(fit.scrollable, 'and what is past the fold can be reached').toBe(true)
    w.unmount()
  })

  it('...and on the narrowest screen too', () => {
    const { w, card, dismiss } = attached(ABROAD, NARROW_PHONE)
    assertDismissReachable(card, dismiss, NARROW_PHONE, 'ForkDialog (places above, narrow)')
    w.unmount()
  })

  it('⚠⚠ MUTATION PROOF – put round-20 #3 back on this card and the SAME assertion goes red', () => {
    const { w, card, dismiss } = attached(ABROAD)
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

// =================================================================================================
// 4. ⭐⭐⭐ THE ENGINE STILL RE-VALIDATES, AND STILL FALLS BACK TO THE CHEAPEST PLACE OPEN TO HER
// =================================================================================================
//
// ⚠ BOTH PROPERTIES ARE PRE-EXISTING AND THIS WAVE MAY NOT MOVE EITHER (`world/endings.ts`'s own
// note): the card stops drawing a place residence shuts, and THIS is what makes that a rule rather
// than a decoration – while the ANSWER itself is never refused, because a caller with no tier is one
// that never asked the player.
describe('⭐⭐⭐ `answerFork` re-validates the tier, and never refuses the answer', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('⭐⭐ a shut tier falls back to the cheapest place open to her – it does not throw', () => {
    const world = atTheFork('r24-2a-revalidate', ABROAD)
    expect(world.fork!.offer!.quotes[0], 'the cheapest place really is shut for her').toMatchObject({
      tier: 'state',
      open: false,
    })
    expect(() => answerFork(world, 'college', 'state')).not.toThrow()
    expect(world.fork!.answer, 'the answer is never refused').toBe('college')
    expect(world.fork!.offer!.chosen, 'and it lands on the cheapest place that IS hers').toBe('national')
    // ⚠ ROUND 24 #5: the answer RESERVES – no ending latches here; the September departure is booked
    // instead, and the enrolment honours the quote chosen above (tests/college-departure.test.ts).
    expect(world.ending, 'the reservation does not end anything').toBeNull()
    expect(world.fork!.departsWeek ?? null, 'the departure is booked').not.toBeNull()
  })

  it('⭐ a caller with no tier gets the cheapest OPEN place, in both residence classes', () => {
    const abroad = atTheFork('r24-2a-fallback-abroad', ABROAD)
    answerFork(abroad, 'college')
    expect(abroad.fork!.offer!.chosen).toBe('national')

    const home = atTheFork('r24-2a-fallback-home', 'US')
    answerFork(home, 'college')
    expect(home.fork!.offer!.chosen, 'at home the cheapest place is hers').toBe('state')
  })

  it('⚠ an unknown tier falls back too – nothing removes the college answer', () => {
    const world = atTheFork('r24-2a-garbage', 'US')
    expect(() => answerFork(world, 'college', 'nowhere-university' as never)).not.toThrow()
    expect(world.fork!.answer).toBe('college')
    expect(world.fork!.offer!.chosen).toBe('state')
  })

  // ⭐⭐⭐ AND THE CARD PROMISES WHAT THE ENGINE RECORDS. The button names the place it will take;
  // this drives the same world through `answerFork` and asserts the ledger agrees. A card whose
  // default drifted from the engine's fallback would pass every case above and still lie on the most
  // expensive click in the game.
  it('⭐⭐⭐ the place the button names is the place the engine actually takes', () => {
    for (const country of [ABROAD, 'US']) {
      const world = atTheFork(`r24-2a-promise-${country}`, country)
      const w = mountFor(world)
      const said = w.findAll('.fork-answer')[1].text()
      w.unmount()
      answerFork(world, 'college')
      const taken = world.fork!.offer!.chosen!
      expect(said, `${country}: the button named the place the engine took`).toContain(COLLEGE_TIER_NAME[taken])
    }
  })

  // ⚠ AND HER PICK IS CARRIED, so the fallback above is a fallback and not the only path.
  it('⚠ a place she presses is the place the button commits her to', async () => {
    const world = atTheFork('r24-2a-picked', 'US')
    const w = mountFor(world)
    await w.findAll('.fork-place')[2].trigger('click')
    expect(w.findAll('.fork-answer')[1].text()).toContain(COLLEGE_TIER_NAME.private)
    w.unmount()
    answerFork(world, 'college', 'private')
    expect(world.fork!.offer!.chosen).toBe('private')
  })
})
