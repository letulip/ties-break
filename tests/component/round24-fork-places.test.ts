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
// engine-side and falls back to THE CHEAPEST PLACE. The card's stated default is asserted to be the
// tier the engine actually records, so the promise and the ledger cannot part.
//
// ⭐⭐⭐⭐ RE-AIMED BY ROUND 26 #2's SECOND PASS, AND FAULT 2 IS RETIRED RATHER THAN WEAKENED. The
// owner overruled the RULE this file's first block was built around – «по-моему в каждой стране есть
// домашний универ» – so `CollegeQuote.open`, `tierShutFor`, `quoteShutFor` and `COLLEGE_SHUT_DETAIL`
// are all gone (v61) and there is no refused row left to explain. Fault 2's house rule is kept by
// being satisfied absolutely: **no row is dead, in any of the 24 playable countries.** Block 1 asserts
// that instead of asserting the plaque; fault 1 (document order), ruling 4 and the phone fit are
// untouched claims and go on being measured exactly as they were.
import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import ForkDialog from '../../src/components/ForkDialog.vue'
// ⚠ THE REAL STYLESHEET, or the fit measurement below reads an empty cascade and passes vacuously.
import '../../src/style.css'
import { useGameStore } from '../../src/stores/game'
import { assertDismissReachable, measureDialog, setViewport, NARROW_PHONE, PHONE } from './fits'
import { createWorld, answerFork, measureCollegeOffer, toSnapshot } from '../../src/engine/world'
import { COLLEGE_TIER_NAME, COLLEGE_TIER_ORDER } from '../../src/engine/collegeOffer'
import { DEFAULT_PROFILE } from '../../src/shared/protocol'
// ⚠ THE PLAYABLE COUNTRY LIST – block 1 sweeps every career a player can start rather than two
// sample passports, because "no place is refused" is a claim about all of them.
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
// 1. ⭐⭐⭐⭐ NO TIER IS REFUSED – IN ANY OF THE TWENTY-FOUR COUNTRIES (round 26 #2, second pass)
// =================================================================================================
//
// WHAT STOOD HERE, so the trade is legible rather than quietly deleted. Four cases, all built on the
// residence rule: «every row the card refuses states the engine's reason – and no open row states
// one» (a sweep over both residence classes against `tierShutFor` / `COLLEGE_SHUT_DETAIL`), its
// anti-vacuity twin («the two residence classes really do draw different cards»), «the card refuses
// exactly the rows the engine's own `open` refuses», and the legibility case that pinned the refusal
// OUTSIDE `.is-shut`'s fade. They were good tests of a rule the owner has now deleted.
//
// ⚠⚠ THE REPLACEMENT IS STRICTLY STRONGER, WHICH IS WHY THIS IS A RE-AIM AND NOT A LOSS. Those cases
// asserted that a refusal explains itself and that at least two places survive; these assert that
// **no refusal exists at all**, over the whole playable country list rather than over two sample
// passports – and that the card cannot even express one any more (`is-shut` and
// `.fork-place-refusal` are gone from the DOM and from the stylesheet).
describe('⭐⭐⭐⭐ round 26 #2 – every place is pressable, whatever her passport', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    document.body.innerHTML = ''
  })

  // ⚠⚠ THIS IS THE CASE THE OWNER'S SENTENCE IS ABOUT, and it is a sweep over every career a player
  // can start – `COUNTRY_NAMES` is exactly the list onboarding offers. A spot check on `US` and one
  // other passport would pass on a card that still shut a third country nobody thought to try.
  it('⭐⭐⭐⭐ draws three live rows in all 24 playable countries, and refuses none of them', () => {
    const codes = Object.keys(COUNTRY_NAMES)
    expect(codes.length, 'the sweep really is the whole onboarding list').toBe(24)
    for (const country of codes) {
      const world = atTheFork(`r26-2-open-${country}`, country)
      const w = mountFor(world)
      const places = w.findAll('.fork-place')
      expect(places, `${country}: three places`).toHaveLength(3)
      for (const [i, tier] of COLLEGE_TIER_ORDER.entries()) {
        expect(places[i].attributes('disabled'), `${country} ${tier}: pressable`).toBeUndefined()
        expect(places[i].classes(), `${country} ${tier}: not faded`).not.toContain('is-shut')
      }
      expect(w.findAll('.fork-place-refusal'), `${country}: nothing to explain`).toHaveLength(0)
      w.unmount()
    }
  })

  // ⭐⭐ AND THE HOME PLACE IS WHAT THE BUTTON TAKES, EVERYWHERE. This is the owner's own complaint
  // answered on the control that spends it: he could not choose the cheapest place, and now the
  // cheapest place is what the card takes when he chooses nothing.
  it('⭐⭐ the button names the place at home for a career that could never reach it before', () => {
    for (const country of [ABROAD, 'AU', 'JP', 'US']) {
      const w = mountFor(atTheFork(`r26-2-default-${country}`, country))
      expect(w.findAll('.fork-answer')[1].text(), `${country}: the cheapest place, and it is hers`).toContain(
        COLLEGE_TIER_NAME.state,
      )
      w.unmount()
    }
  })

  // ⚠⚠ THE ENGINE AGREES WITH THE SCREEN – invariant 1, kept at the point where it can now go wrong
  // in the OTHER direction. The old hazard was a card drawing a row the engine would refuse; the new
  // one is a card drawing a row the engine silently substitutes, which is exactly what a surviving
  // `q.open` filter in `answerFork` would have done to a migrated save. So the press is walked
  // through the real command and the recorded tier is read back.
  it('⭐⭐⭐ pressing the home row really enrols her at the home place, not at the next one up', async () => {
    for (const country of [ABROAD, 'US']) {
      const world = atTheFork(`r26-2-answer-${country}`, country)
      const w = mountFor(world)
      await w.findAll('.fork-place')[0].trigger('click')
      expect(w.findAll('.fork-place')[0].attributes('aria-pressed'), `${country}: the press landed`).toBe('true')
      answerFork(world, 'college', 'state')
      expect(world.fork!.offer!.chosen, `${country}: and the engine recorded the home place`).toBe('state')
      w.unmount()
    }
  })

  // ⚠ THE MUTATION ARM FOR THE THREE ABOVE, AND IT IS THE HONEST ONE: put a `disabled` back on the
  // first row and every case in this block goes red. Written as a live check that the selector the
  // sweep uses would find such a row if one existed – a sweep asserting the ABSENCE of something has
  // to prove its own instrument works.
  it('⚠ the instrument can see a dead row – it just never finds one', async () => {
    const world = atTheFork('r26-2-instrument', ABROAD)
    const w = mountFor(world)
    const first = w.findAll('.fork-place')[0]
    expect(first.attributes('disabled')).toBeUndefined()
    first.element.setAttribute('disabled', '')
    expect(w.findAll('.fork-place')[0].attributes('disabled'), 'the selector really reads the attribute').toBeDefined()
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
    // ⚠⚠ RULING 4, RE-AIMED AT WHAT IS LEFT TO READ (round 26 #2, second pass). It used to take the
    // refusal plaque's own words and refuse a verdict in them; there is no plaque, so it takes the
    // WHOLE places block – three rows and the caption under them – which is a wider net than the one
    // sentence it replaces and covers the copy that is actually still on screen.
    const block = w.find('.fork-places-block').text().toLowerCase()
    for (const steer of ['should', 'better', 'instead', 'recommend', 'consider', 'try ']) {
      expect(block, `the places offer no verdict ("${steer}")`).not.toContain(steer)
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
    // ⚠ ROUND 26 #2: the sentence this line used to name was the refusal plaque, which is gone. The
    // anti-vacuity claim is the same and now points at the three rows themselves – the card really
    // does carry its full content while being measured.
    expect(document.querySelectorAll('.fork-place'), 'and all three rows are on the card measured').toHaveLength(3)
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
// 4. ⭐⭐⭐ THE ENGINE TAKES THE TIER IT IS GIVEN, AND FALLS BACK TO THE CHEAPEST PLACE
// =================================================================================================
//
// ⚠⚠ RE-AIMED BY ROUND 26 #2, AND THE RE-AIM IS THE BEHAVIOUR CHANGE ITSELF. The two properties this
// block held were «a shut tier falls back to the cheapest place OPEN to her» and «the answer is never
// refused». The first is gone with the rule: nothing is shut, `answerFork` no longer filters on
// `q.open` (the field does not exist), and a career abroad that asks for the home place GETS the home
// place. The second is untouched and still measured below – an unknown tier still falls back rather
// than throwing, because nothing removes the college answer (owner, 16.08).
//
// ⚠ AND THE ONE THAT REPLACES IT IS THE HAZARD THE DELETION CREATED. With the filter still in place,
// a career carrying a persisted `state: {open: false}` would have had its press silently redirected
// to the next place up. The first case below is that exact walk, abroad, asserting the home place is
// what gets recorded.
describe('⭐⭐⭐ `answerFork` takes the place she pressed, and never refuses the answer', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('⭐⭐⭐⭐ a career abroad asks for the home place and is enrolled at the home place', () => {
    const world = atTheFork('r26-2-revalidate', ABROAD)
    expect(world.fork!.offer!.quotes[0].tier, 'the cheapest place is the home one').toBe('state')
    expect(() => answerFork(world, 'college', 'state')).not.toThrow()
    expect(world.fork!.answer, 'the answer is never refused').toBe('college')
    expect(world.fork!.offer!.chosen, 'and it lands on the place she asked for').toBe('state')
    // ⚠ ROUND 24 #5: the answer RESERVES – no ending latches here; the September departure is booked
    // instead, and the enrolment honours the quote chosen above (tests/college-departure.test.ts).
    expect(world.ending, 'the reservation does not end anything').toBeNull()
    expect(world.fork!.departsWeek ?? null, 'the departure is booked').not.toBeNull()
  })

  it('⭐ a caller with no tier gets the cheapest place – the same one in both residence classes now', () => {
    const abroad = atTheFork('r26-2-fallback-abroad', ABROAD)
    answerFork(abroad, 'college')
    expect(abroad.fork!.offer!.chosen, 'abroad it used to be `national`').toBe('state')

    const home = atTheFork('r26-2-fallback-home', 'US')
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
