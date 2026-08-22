// ⭐⭐ THE OFFER ON THE FORK CARD (v51, docs/specs/what-the-college-place-costs-2026-08.md), AND
// SINCE 17.08 THE CHOICE ON IT (docs/specs/the-college-choice-2026-08.md).
//
// The third answer used to promise "four years of student tennis on a college scholarship … the money
// goes the other way" and the engine then charged nothing at all. v51 gave it a price. The owner then
// read that card and could not find where **$8,673 a year** came from under a sourced **$30,990**
// sticker – because $8,673 is the family's RESIDUAL after the award and no line said so. The card now
// shows three places she could take, each with its price, its award, its weekly payment and whether
// the family can pay it.
//
// ⚠ MOUNTED AND NOT PINNED (CLAUDE.md's gotcha). Every claim here is about what a player SEES on the
// most expensive click in the game, and a source pin would pass on a component that rendered none of
// it.
//
// SIX PROPERTIES, and four of them are owner rulings rather than copy:
//   1. THE THIRD ANSWER IS STILL UNCONDITIONAL (owner, 16.08). No value of the offer removes a
//      button, and no state of the choice DISABLES one either – a control the player has to unlock
//      is not "nothing removes the answer".
//   2. THE CARD MAY NOT RECOMMEND (ruling 4, 30.07). No place is preselected; no answer is styled.
//   3. A MIGRATED CAREER IS NOT SHOWN A PRICE IT WAS NEVER QUOTED. `offer: null` = never measured.
//   4. ⭐ THE ARITHMETIC IS ON SCREEN: price, award, weekly payment. The owner's question answered on
//      the surface he asked it about.
//   5. ⭐ THE CHOICE IS THE PLAYER'S, and the button says which place it will take.
//   6. AND IT STILL FITS A PHONE, proved by mutation – the card is much longer than it was.
import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import ForkDialog from '../../src/components/ForkDialog.vue'
// ⚠ THE REAL STYLESHEET, or the fit measurement below reads an empty cascade and passes vacuously.
import '../../src/style.css'
import { useGameStore } from '../../src/stores/game'
import { assertDismissReachable, measureDialog, setViewport, NARROW_PHONE, PHONE } from './fits'
// ⚠ THE ENGINE'S OWN REFUSAL, IMPORTED RATHER THAN RETYPED – see the residence case below.
import { COLLEGE_SHUT_DETAIL, quoteShutFor } from '../../src/engine/collegeOffer'
import type { CollegeOffer, CollegeQuote, CollegeTier, Snapshot } from '../../src/shared/protocol'

const PRICES: Record<CollegeTier, number> = { state: 30_990_00, national: 50_920_00, private: 65_470_00 }

function quote(tier: CollegeTier, athleticShare: number, needShare: number, open = true): CollegeQuote {
  const covered = Math.min(1, athleticShare + needShare)
  return {
    tier,
    costPerYearCents: PRICES[tier],
    athleticShare,
    needShare,
    familyPerYearCents: Math.round(PRICES[tier] * (1 - covered)),
    open,
  }
}

/** the median career: a full ride at the cheap place, real money at the two above it */
const FUNDED: CollegeOffer = {
  quotes: [quote('state', 0.62, 0.1), quote('national', 0.38, 0.1), quote('private', 0.3, 0.1)],
  chosen: null,
  canPayPerYearCents: 28_823_00,
}
/** nobody funded her – an empty junior record. Every place is still on the table at full price. */
const WALK_ON: CollegeOffer = {
  quotes: [quote('state', 0, 0), quote('national', 0, 0), quote('private', 0, 0)],
  chosen: null,
  canPayPerYearCents: 18_255_00,
}
const FREE_RIDE: CollegeOffer = {
  quotes: [quote('state', 0.88, 0.12), quote('national', 0.6, 0.12), quote('private', 0.45, 0.12)],
  chosen: null,
  canPayPerYearCents: 55_153_00,
}
/** a girl on a student visa: the in-state place is not hers, and two still are */
const NON_RESIDENT: CollegeOffer = {
  quotes: [quote('state', 0.62, 0, false), quote('national', 0.38, 0), quote('private', 0.3, 0)],
  chosen: null,
  canPayPerYearCents: 31_531_00,
}

function snapshotWith(offer: CollegeOffer | null): Snapshot {
  return {
    ageYears: 19,
    week: 265,
    kidRank: 210,
    fundsCents: 41_200_00,
    careerTotals: { earnedCents: 0, spentCents: 0, prizeCents: 0 },
    fork: { askedWeek: 265, ageYears: 19, offer },
  } as unknown as Snapshot
}

function mountFork(offer: CollegeOffer | null, attach = false) {
  useGameStore().snapshot = snapshotWith(offer)
  return mount(ForkDialog, attach ? { attachTo: document.body } : {})
}

describe('⭐⭐ the card says what each college place costs', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    document.body.innerHTML = ''
  })

  const rowsOf = (w: ReturnType<typeof mountFork>) => w.findAll('.fork-place').map((b) => b.text())

  // ⭐⭐ PROPERTY 4 – THE ARITHMETIC THE OWNER COULD NOT FIND. Price, award, weekly payment, on one
  // row, in that order. $8,673 under a $30,990 sticker is no longer a number from nowhere.
  it('⭐⭐ puts the price, the award and the weekly payment on every place', () => {
    const w = mountFork(FUNDED)
    const rows = rowsOf(w)
    expect(rows).toHaveLength(3)
    // the sourced sticker...
    expect(rows[0]).toContain('$30,990 a year')
    expect(rows[1]).toContain('$50,920 a year')
    expect(rows[2]).toContain('$65,470 a year')
    // ...the award over it, named and quantified...
    expect(rows[0], '62% + 10% = 72% covered -> the half band').toContain('About half the bill')
    expect(rows[0]).toContain('(72%)')
    // ...and the residual, in the unit the engine actually charges in.
    expect(rows[0], '$30,990 x 28%').toContain('$8,677')
    expect(rows[0], 'and one fifty-second of it a week').toContain('$167 a week')
    w.unmount()
  })

  // ⚠⚠ THE FOUR-YEAR FIGURE IS THE ONE THE DECISION IS ABOUT AND IT IS ON THE CONTROL THAT COMMITS
  // HER TO IT. v51 put it on the card; 17.08 moved it from three rows to the button, because at
  // 320x568 the third figure on every row wrapped and broke the mounted fit assertion. It did not
  // get dropped – a shipped, tested fact does not leave the card because the card got busy.
  it('⭐⭐ states the whole course on the button, and follows the choice', async () => {
    const w = mountFork(FUNDED)
    const college = () => w.findAll('.fork-answer')[1].text()
    expect(college(), '$8,677 x 4').toContain('$34,709')
    expect(college()).toContain('4 years')
    await w.findAll('.fork-place')[2].trigger('click')
    expect(college(), 'the private place: $39,282 x 4').toContain('$157,128')
    w.unmount()
  })

  it('⚠ says "nothing to pay" rather than $0 over four years of a full ride', () => {
    const w = mountFork(FREE_RIDE)
    expect(w.findAll('.fork-answer')[1].text()).toContain('Nothing to pay')
    expect(w.findAll('.fork-answer')[1].text()).not.toContain('$0')
    w.unmount()
  })

  // ⚠⚠ RE-AIMED, NOT DELETED (round 21 #2). It used to assert `Squad 55 / 65 / 75` – ours, on a scale
  // the card never printed her own number on, so a player had nothing to compare it against. The
  // owner asked for the place's quality as a measurable odds and he was right. The property the case
  // was standing in for survives exactly – **every row states what the place is worth, in its own
  // stated unit, beside the sourced price** – and it is stronger, because the number is now measured
  // out of this build (`tools/college-return-probe.ts`, n = 53 per place) rather than invented.
  it('⭐⭐ states each place\'s measured odds, and the window it was measured over', () => {
    const w = mountFork(FUNDED)
    const rows = rowsOf(w)
    expect(rows[0]).toContain('Top 100 for 85 in 100')
    expect(rows[1]).toContain('Top 100 for 93 in 100')
    expect(rows[2]).toContain('Top 100 for 74 in 100')
    // ⚠ AND A SHARE WITH NO SPAN UNDER IT IS NOT A MEASUREMENT. The window is named once, under the
    // list – a card that printed a bare percentage would be quoting a run it never identified.
    expect(w.find('.fork-places-note').text()).toContain('Four years after she leaves')
    expect(w.find('.fork-places-note').text()).toContain('53 careers')
    // ⚠ AND THE INVENTED NUMBER IS OFF THE SURFACE, which is the half of this the owner asked for.
    expect(w.find('.fork-places').text()).not.toMatch(/Squad \d/)
    w.unmount()
  })

  // ⚠⚠ PROPERTY 1, AND IT IS THE OWNER'S RULING RATHER THAN A UI NICETY. The worst offer the engine
  // can produce is "nobody funded her", and it must still be three answers and still be pressable.
  it('⭐⭐ still draws three live answers when no programme funded her', () => {
    const w = mountFork(WALK_ON)
    expect(w.findAll('.fork-answer')).toHaveLength(3)
    // ⚠ ROUND 24 #5: the button says «Reserve» now – the click books the place, she leaves at the
    // September departure and plays until then.
    expect(w.text()).toContain('Reserve the college place')
    for (const a of w.findAll('.fork-answer')) expect(a.attributes('disabled')).toBeUndefined()
    const rows = rowsOf(w)
    for (const r of rows) expect(r).toContain('Walk-on, no award')
    // every place is still on the table, at its own full price
    expect(rows[0]).toContain('$30,990 a year')
    expect(rows[2]).toContain('$65,470 a year')
    // ⚠ AND IT MAY NOT SAY THE ANSWER IS GONE, which is the sentence the 16.08 ruling deleted.
    // ⚠ SCOPED TO THE THIRD ANSWER AND ITS OWN ROWS, because the card's lede legitimately contains
    // the word "closed" – about the JUNIOR ladder, which really is shut on age. A whole-card regex
    // here was over-broad in exactly the way `pin-hygiene` warns a widened negative always is.
    const third = w.findAll('.fork-answer')[1].text() + w.find('.fork-places').text()
    expect(third).not.toMatch(/no longer|not available|door is closed|cannot go|unavailable/i)
    w.unmount()
  })

  it('says the family pays nothing rather than $0 when the award covers the year', () => {
    const w = mountFork(FREE_RIDE)
    expect(rowsOf(w)[0]).toContain('A full ride')
    expect(rowsOf(w)[0]).toContain('Family pays nothing')
    w.unmount()
  })

  // ⭐⭐ PROPERTY 5 – THE CHOICE. Nothing is pressed on arrival; the button names the place it will
  // take; pressing a row changes both.
  it('⭐⭐ arrives with nothing chosen and names the cheapest open place on the button', async () => {
    const w = mountFork(FUNDED)
    for (const b of w.findAll('.fork-place')) expect(b.attributes('aria-pressed')).toBe('false')
    expect(w.findAll('.fork-answer')[1].text()).toContain('The university at home')
    await w.findAll('.fork-place')[2].trigger('click')
    expect(w.findAll('.fork-place')[2].attributes('aria-pressed')).toBe('true')
    expect(w.findAll('.fork-answer')[1].text()).toContain('A private university')
    w.unmount()
  })

  // ⚠⚠ THE RESIDENCE SPLIT REMOVES ONE SCHOOL AND NEVER THE ANSWER. Two places stay pressable, the
  // third states its reason, and the button falls to the cheapest one that IS hers.
  //
  // ⚠⚠ RE-AIMED BY ROUND 24 #2a, NOT WEAKENED. It asserted the literal string
  // «In-state, and she is not a resident», which was TYPED INTO THE TEMPLATE beside the boolean –
  // and pinning a template literal is what let the card hold an opinion the engine never issued.
  // The claim it stood for is unchanged and is stricter for being sourced: the refused row states
  // the ENGINE'S sentence for the reason the ENGINE gave, off `COLLEGE_SHUT_DETAIL`. A card that
  // types its own words now fails here.
  //
  // ⚠ AND IT IS THE HAND-BUILT ARM ON PURPOSE. `tests/component/round24-fork-places.test.ts` walks a
  // real world into this state and asserts the same property against `tierShutFor`; this case keeps
  // the surface honest for a quote shape the world happens not to produce today.
  it('⚠ shuts the in-state place to a non-resident and keeps the answer live', () => {
    const w = mountFork(NON_RESIDENT)
    const places = w.findAll('.fork-place')
    expect(places[0].attributes('disabled')).toBeDefined()
    const shut = quoteShutFor(NON_RESIDENT.quotes[0])
    expect(shut, 'the engine names the rule behind its own `open: false`').not.toBeNull()
    expect(places[0].find('.fork-place-refusal').text(), 'the engine\'s sentence, not the card\'s').toBe(
      COLLEGE_SHUT_DETAIL[shut!],
    )
    expect(places[1].attributes('disabled')).toBeUndefined()
    expect(places[2].attributes('disabled')).toBeUndefined()
    expect(places[1].find('.fork-place-refusal').exists(), 'and an open row explains nothing').toBe(false)
    expect(w.findAll('.fork-answer')[1].text(), 'the button falls to the cheapest place that is hers').toContain(
      'A university out of state',
    )
    for (const a of w.findAll('.fork-answer')) expect(a.attributes('disabled')).toBeUndefined()
    w.unmount()
  })

  // ⭐ WHETHER SHE CAN AFFORD IT – a fact, never a refusal. The row still prices the place and the
  // player may still take it; the family goes into debt, not away.
  it('⭐ marks a place beyond the family and still lets her take it', () => {
    const w = mountFork(WALK_ON)
    const rows = rowsOf(w)
    expect(rows[2], '$65,470 against $18,255 a year').toContain('Beyond what the family has')
    expect(w.findAll('.fork-place')[2].attributes('disabled')).toBeUndefined()
    w.unmount()
  })

  it('⚠ says nothing about affordability where it was never measured', () => {
    const w = mountFork({ ...WALK_ON, canPayPerYearCents: null })
    expect(w.find('.fork-places').text()).not.toContain('Beyond what the family has')
    w.unmount()
  })

  // ⚠⚠ PROPERTY 3 – the v51 migration's promise, kept on the surface. A career that reached the fork
  // before this phase existed carries `offer: null`, was never quoted a price, and is charged none.
  it('⭐ shows a migrated career the pre-v51 line and no bill at all', () => {
    const w = mountFork(null)
    expect(w.find('.fork-places').exists(), 'no places block').toBe(false)
    expect(w.findAll('.fork-answer')).toHaveLength(3)
    // ⚠ ROUND 24 #5 re-aim: the migrated fallback names the departure fact instead of the money
    // claim the engine never honoured.
    expect(w.text()).toContain('from the next academic year')
    // ⚠ AND NO INVENTED PRICE ON THE THIRD ANSWER. Scoped to that button: the card's FACTS list
    // legitimately prints her funds and her prize money in dollars, and always has.
    expect(w.findAll('.fork-answer')[1].text(), 'no price quoted').not.toMatch(/\$\d/)
    w.unmount()
  })

  // ⚠ PROPERTY 2 – ruling 4. The places are detail, not emphasis: they sit OUTSIDE the answer
  // buttons, so the three answers keep the equal weight the ruling requires.
  //
  // ⚠⚠ RE-AIMED, NOT DELETED. It used to assert `.fork-offer button` was EMPTY – true when the offer
  // was three read-only rows, and wrong now that the offer is a CHOICE. What it was standing in for
  // survives exactly: the rows are not ANSWERS. So the assertion moved from "no controls" to "no
  // control in there is a `.fork-answer`, and none of them is preselected".
  it('⚠ does not turn the third answer into a recommendation', () => {
    const w = mountFork(FUNDED)
    expect(w.find('.fork-answer .fork-places').exists(), 'the places are not inside a button').toBe(false)
    expect(w.findAll('.fork-places .fork-answer'), 'no place is an answer').toHaveLength(0)
    expect(
      w.findAll('.fork-place').filter((b) => b.attributes('aria-pressed') === 'true'),
      'no place is preselected',
    ).toHaveLength(0)
    // Every answer is still an equal, undecorated control.
    for (const a of w.findAll('.fork-answer')) {
      expect(a.attributes('disabled')).toBeUndefined()
      expect(a.classes()).toEqual(['fork-answer'])
    }
    w.unmount()
  })

  // ⚠⚠ AND NOTHING ON THIS CARD COMPARES COLLEGE TO THE TOUR. The owner, 17.08: «мы больше ничего ни
  // с чем не сравниваем». Scoped to the college block, because the card's FACTS list legitimately
  // carries a tour figure of its own (P4's result arm) which is not a comparison with anything.
  it('⚠⚠ says nothing about the tour anywhere in the college block', () => {
    const w = mountFork(FUNDED)
    const block = w.findAll('.fork-answer')[1].text() + w.find('.fork-places').text()
    expect(block).not.toMatch(/than the tour|versus|compared|better off|worse off|instead of turning/i)
    w.unmount()
  })
})

// =================================================================================================
// ⭐⭐ PROPERTY 6 – AND THE MUCH LONGER CARD STILL FITS A PHONE (CLAUDE.md's round-20 #3 rule)
// =================================================================================================
//
// v51 added three rows to a BLOCKING overlay. 17.08 replaced them with THREE PLACES OF THREE LINES
// EACH – nine rows and a heading where there were three – which is exactly the slow growth the rule
// names ("a dialog grows by one honest sentence at a time"). The last two cases are what make the
// first two mean anything: one puts the round-20 defect back on this card – the shape
// `TourBriefingDialog` shipped in – and asserts the same helper reports it; the other proves the
// places are what made it long, so the fit cases are about them.
describe('⭐⭐ the fork card, with the choice on it, fits 375x667', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    document.body.innerHTML = ''
  })

  function attached(offer: CollegeOffer | null, vp = PHONE) {
    // ⚠ THE VIEWPORT FIRST – happy-dom resolves lengths at `getComputedStyle` time.
    setViewport(vp)
    const w = mountFork(offer, true)
    const card = document.querySelector('.fork-card')!
    const dismiss = document.querySelector('.fork-answers')!
    expect(card, 'the card is up – nothing below is vacuous').toBeTruthy()
    expect(document.querySelector('.fork-places'), 'and the three places are on it').toBeTruthy()
    // ⚠ THE WAY OUT IS THE LAST ANSWER, and `measureDialog` reads the dismiss box off the card's own
    // bottom edge, so the control it measures has to be the last thing in the flow.
    expect(dismiss.lastElementChild?.textContent).toContain('Stop here')
    return { w, card, dismiss }
  }

  it('keeps the three answers inside the screen', () => {
    const { w, card, dismiss } = attached(FUNDED)
    const fit = assertDismissReachable(card, dismiss, PHONE, 'ForkDialog (the choice)')
    expect(fit.available.height).toBe(635)
    expect(fit.cap, 'bounded by the room the scrim leaves').toBe(635)
    expect(fit.scrollable, 'and what is past the fold can be reached').toBe(true)
    w.unmount()
  })

  it('...and on the narrowest screen too', () => {
    const { w, card, dismiss } = attached(WALK_ON, NARROW_PHONE)
    assertDismissReachable(card, dismiss, NARROW_PHONE, 'ForkDialog (walk-on)')
    w.unmount()
  })

  it('⚠⚠ MUTATION PROOF – put round-20 #3 back on this card and the SAME assertion goes red', () => {
    const { w, card, dismiss } = attached(FUNDED)
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

  // ⚠ AND THE SECOND HALF OF THE MUTATION: the three places really are what made it longer. Without
  // this the fit cases could be passing on a card the choice never reached.
  it('⚠ the three places measurably lengthen the card, so the cases above are about them', () => {
    setViewport(PHONE)
    const withOffer = mountFork(FUNDED, true)
    const a = measureDialog(document.querySelector('.fork-card')!, document.querySelector('.fork-answers')!, PHONE)
    withOffer.unmount()
    document.body.innerHTML = ''
    const without = mountFork(null, true)
    const b = measureDialog(document.querySelector('.fork-card')!, document.querySelector('.fork-answers')!, PHONE)
    without.unmount()
    expect(a.contentFloor).toBeGreaterThan(b.contentFloor)
  })
})
