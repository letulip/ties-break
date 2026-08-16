// P4 – THE WARNING BEFORE THE ENTRY THAT COSTS IT, AND THE FORK'S TWO CORRECTIONS, MOUNTED.
//
// ⚠ WHAT THIS FILE IS ABOUT. `ending.ts` used to state the silence as intent: the college rung "is a
// PRECONDITION and not a WARNING", because "a player who has taken professional prize money has spent
// her college eligibility". THAT RULE DOES NOT EXIST. The NCAA let a prospective college player keep
// $10,000 a year plus expenses before enrolment, and since the Brantmeier/Joint settlement of 15
// April 2026 there is no pre-enrolment cap at all - "amateurism" appears zero times in the current
// Division I Manual (docs/research/college-and-the-junior-exit.md §1b). A rule the sport does not
// have may not be sprung on the player after the fact, so the entry that spends the college ending
// now says so BEFORE she spends it.
//
// ⚠ MOUNTED AND NOT PINNED (CLAUDE.md's gotcha). Every claim here is about what a player SEES: that
// the sentence is on the card, that it is absent when there is nothing left to spend, that it does
// not recommend, and that the cards carrying it still fit a phone.
//
// ⚠⚠ AND BOTH DIALOGS ARE MEASURED AGAINST A PHONE, WITH A MUTATION PROOF. Round-20 #3 shipped a
// blocking card whose Continue left the screen and stranded the owner's career; the fork card grew a
// row in this phase and the entry confirm grew a sentence, so both owe that measurement. The last
// case in each block puts the shipped defect back and watches the same assertion go red - a test
// that cannot fail on the too-tall version is not this test.
import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import ForkDialog from '../../src/components/ForkDialog.vue'
import ConfirmDialog from '../../src/components/ConfirmDialog.vue'
import SeasonScreen from '../../src/components/screens/SeasonScreen.vue'
// ⚠ THE REAL STYLESHEET, or the fit measurements read an empty cascade and pass vacuously -
// `measureDialog` refuses a document with no `<style>` in it for exactly that reason.
import '../../src/style.css'
import { useGameStore } from '../../src/stores/game'
import { createWorld, tickWeek, toSnapshot } from '../../src/engine/world'
import { rngFromSeed } from '../../src/engine/rng'
import { ENDINGS } from '../../src/engine/ending'
import { TIERS, TIER_SHORT } from '../../src/engine/season/calendar'
import { assertDismissReachable, measureDialog, setViewport, NARROW_PHONE, PHONE } from './fits'
import type { Snapshot } from '../../src/shared/protocol'

function forkSnapshot(collegeOpen: boolean): Snapshot {
  return {
    ageYears: 19,
    week: 265,
    kidRank: 88,
    fundsCents: 1234_00,
    careerTotals: { earnedCents: 0, spentCents: 0, prizeCents: 0 },
    fork: { askedWeek: 265, ageYears: 19, collegeOpen },
  } as unknown as Snapshot
}

// =================================================================================================
// (b) THE RESULT ARM – A FIGURE ON THE CARD, NOT A GATE AND NOT A SENTENCE
// =================================================================================================
// The owner's original intent was a fork for the girls whose results are not very good, and #200 is
// the only line the research found that separates the populations (47 points, research §5c). With the
// money arm cancelled it reopens nothing: the third answer is drawn by `fork.collegeOpen` alone, and
// this number is one more figure beside her rank for the player to compare.
describe('P4 (b) – the fork card shows where the tour starts admitting her', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    document.body.innerHTML = ''
  })

  it('the tour cut is on the card, and it is the engine constant rather than a typed number', () => {
    useGameStore().snapshot = forkSnapshot(true)
    const w = mount(ForkDialog)
    const facts = w.find('.fork-facts')
    expect(facts.exists()).toBe(true)
    // The rung it comes off is already 200 in the ladder – a fitted number would have been a number
    // this card invented about her chances.
    expect(TIERS.wta250.acceptsRank, 'the constant the card reads').toBe(200)
    expect(facts.text()).toContain(`#${TIERS.wta250.acceptsRank}`)
    expect(facts.text()).toContain(TIER_SHORT.wta250)
    w.unmount()
  })

  it('⚠ IT DOES NOT RECOMMEND, and it does not gate – the card says the number and stops', () => {
    // Ruling 4 (30.07): the card «may not recommend». A line comparing her rank to the cut would be
    // one step from advice about which answer to take, and this card is not allowed that opinion.
    useGameStore().snapshot = forkSnapshot(true)
    const w = mount(ForkDialog)
    const text = w.text()
    for (const steer of ['should', 'better', 'unlikely', 'would not take', 'consider', 'recommend']) {
      expect(text.toLowerCase(), `the card offers no verdict ("${steer}")`).not.toContain(steer)
    }
    // ...and the answers are untouched: three of them, still one weight, still no primary.
    expect(w.findAll('.fork-answer'), 'the rank line gates nothing').toHaveLength(3)
    expect(w.findAll('.primary')).toHaveLength(0)
    w.unmount()
  })

  it('⚠ the figure is there whether the college door is open or shut – it is about the TOUR', () => {
    // It bears on "turn professional", which is an answer she always has. Tying it to the college
    // door would have made it an argument about college, which is the opinion it may not carry.
    useGameStore().snapshot = forkSnapshot(false)
    const w = mount(ForkDialog)
    expect(w.find('.fork-facts').text()).toContain(`#${TIERS.wta250.acceptsRank}`)
    w.unmount()
  })
})

// =================================================================================================
// THE SHUT-DOOR NOTE NO LONGER CITES A RULE THAT DOES NOT EXIST
// =================================================================================================
describe('P4 – the fork stops asserting an NCAA rule the NCAA repealed', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    document.body.innerHTML = ''
  })

  it('⚠⚠ the eligibility claim is GONE from the copy', () => {
    useGameStore().snapshot = forkSnapshot(false)
    const w = mount(ForkDialog)
    const shut = w.find('.fork-shut')
    expect(shut.exists()).toBe(true)
    // The old sentence: "Prize money at that level spends her college eligibility, and nothing gives
    // it back." Both halves are false about the sport (research §1b), and the second one is the
    // reason the card was giving.
    expect(shut.text().toLowerCase(), 'no eligibility claim').not.toContain('eligibility')
    expect(shut.text().toLowerCase(), 'and no claim about what prize money spends').not.toContain('prize money')
    w.unmount()
  })

  it('...and the rung and the reason that DO survive are still both said', () => {
    // The constant is not wrong – its old justification was. The owner's own argument needs no
    // rulebook: a girl who is already a professional does not go to college.
    useGameStore().snapshot = forkSnapshot(false)
    const w = mount(ForkDialog)
    const shut = w.find('.fork-shut')
    expect(shut.text()).toContain(TIER_SHORT[ENDINGS.collegeClosedFromTier])
    expect(shut.text().toLowerCase()).toContain('professional')
    expect(shut.text()).toContain('two answers here and not three')
    w.unmount()
  })
})

// =================================================================================================
// (c) THE WARNING ITSELF, ON THE CONFIRM THAT CARRIES IT
// =================================================================================================
// The Season feed's Enter goes through `ConfirmDialog`; the calendar's marker card is its own
// confirmation and carries the same sentence in `.college-note`. This block measures the confirm,
// which is the blocking one.
/** The longest message `askEnter` can build: the coach speaking, the fatigue caution, the fee AND
 *  the college sentence. If the card survives this it survives every shorter one. */
const LONGEST_ENTRY_CONFIRM =
  'She has had a hard block and this is a long trip for a small draw. ' +
  'Exhausted – racing risks injury. ' +
  'Enter W75 (week 24, clay) anyway? Entry fee $150.00. ' +
  'A result here can cost the college place at nineteen – a win at this level makes her a professional.'

describe('P4 (c) – the entry confirm carries the warning and still fits a phone', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    document.body.innerHTML = ''
  })

  function mountConfirm(vp = PHONE) {
    // ⚠ THE VIEWPORT FIRST – happy-dom resolves lengths at `getComputedStyle` time.
    setViewport(vp)
    const w = mount(ConfirmDialog, {
      props: { message: LONGEST_ENTRY_CONFIRM, confirmLabel: 'Push through' },
      attachTo: document.body,
    })
    const card = document.querySelector('.dialog-overlay .dialog-card')!
    const dismiss = document.querySelector('.dialog-overlay .dialog-actions')!
    expect(card, 'the confirm is up – nothing below is vacuous').toBeTruthy()
    expect(dismiss.querySelectorAll('button').length, 'the actions ARE the way out').toBeGreaterThan(0)
    return { w, card, dismiss }
  }

  it('the warning is the LAST thing said, after the fee', () => {
    const { w } = mountConfirm()
    const text = w.find('.dialog-message').text()
    expect(text).toContain('can cost the college place')
    // The confirm's job is to say the numbers out loud one final time; the college sentence closes
    // that rather than pushing the fee down the card.
    expect(text.indexOf('college'), 'after the entry fee').toBeGreaterThan(text.indexOf('Entry fee'))
    // ⚠ "CAN", NEVER "WILL": a first-round loss keeps the door (owner, 13.08), so the entry itself
    // promises nothing – only a result spends it.
    expect(text).not.toContain('will cost')
    w.unmount()
  })

  it('⭐ on a 375x667 phone the way out of it is on the screen', () => {
    const { w, card, dismiss } = mountConfirm()
    assertDismissReachable(card, dismiss, PHONE, 'ConfirmDialog (entry + college warning)')
    w.unmount()
  })

  it('...and on the narrowest screen too', () => {
    const { w, card, dismiss } = mountConfirm(NARROW_PHONE)
    assertDismissReachable(card, dismiss, NARROW_PHONE, 'ConfirmDialog (entry + college warning)')
    w.unmount()
  })

  it('⚠⚠ MUTATION PROOF – put round-20 #3 back on this card and the SAME assertion goes red', () => {
    // Without this the three above are unfalsifiable: the height cap lives on the shared
    // `.dialog-card` rule, so a green run would prove only that the cascade exists. Stripping the cap
    // is the exact shape `TourBriefingDialog` shipped in.
    //
    // ⚠ THIS CARD'S CONTENT DOES **NOT** OVERFLOW A PHONE on today's copy, so the mutation is proved
    // through the CONTENT-INDEPENDENT half of the assertion – the cap itself – which is the half that
    // still holds after the next sentence is added and is the actual round-20 fix. A message long
    // enough to overflow is asserted below it, so both arms of `assertDismissReachable` are exercised.
    const { w, card, dismiss } = mountConfirm()
    ;(card as HTMLElement).style.maxHeight = 'none'
    ;(card as HTMLElement).style.overflowY = 'visible'
    expect(() => assertDismissReachable(card, dismiss, PHONE, 'ConfirmDialog (cap removed)')).toThrow(
      /declares no height bound|taller than the screen|outside the viewport/,
    )
    w.unmount()
  })

  it('⚠⚠ ...and with the cap gone, a confirm that really is too tall is caught by the OTHER arm', () => {
    setViewport(PHONE)
    const w = mount(ConfirmDialog, {
      props: { message: `${LONGEST_ENTRY_CONFIRM} `.repeat(12), confirmLabel: 'Push through' },
      attachTo: document.body,
    })
    const card = document.querySelector('.dialog-overlay .dialog-card')!
    const dismiss = document.querySelector('.dialog-overlay .dialog-actions')!
    // Bounded and scrollable, it is still reachable however long the copy gets – that is the fix.
    const fit = measureDialog(card, dismiss, PHONE)
    expect(fit.contentFloor, 'this message really does overflow a phone').toBeGreaterThan(fit.available.height)
    expect(fit.scrollable, 'and the shipped card scrolls').toBe(true)
    assertDismissReachable(card, dismiss, PHONE, 'ConfirmDialog (very long)')
    // ...and with the cap removed the same helper reports the content arm.
    ;(card as HTMLElement).style.maxHeight = 'none'
    ;(card as HTMLElement).style.overflowY = 'visible'
    expect(() => assertDismissReachable(card, dismiss, PHONE, 'ConfirmDialog (very long, cap removed)')).toThrow(
      /taller than the screen|outside the viewport/,
    )
    w.unmount()
  })
})

// =================================================================================================
// ...AND THE REAL SCREEN BUILDS THAT MESSAGE, WHICH IS THE CLAIM THE BLOCK ABOVE CANNOT MAKE
// =================================================================================================
// Everything above hands `ConfirmDialog` a message written in this file, so it measures the CARD and
// proves nothing about `SeasonScreen`. This block presses the real Enter on the real feed and reads
// the confirm the screen produced.
//
// ⚠ THE SNAPSHOT IS REAL AND ONE FLAG IS FORCED. `toSnapshot` builds it, so the protocol cannot drift
// out from under the fixture; `costsCollege` is then set on one card, because walking a career to the
// week she first meets a W75 takes ~280 ticks and this test is about the SCREEN, not about when the
// engine raises the flag. That second question is `tests/ending.test.ts`'s, against the engine.
describe('P4 (c) – SeasonScreen puts the warning in the confirm it builds', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    document.body.innerHTML = ''
  })

  /** A real career, with the flag forced on EVERY enterable card so that whichever one the feed
   *  chose to draw is carrying it.
   *
   *  ⚠ THE FEED DRAWS ONE PREFERRED EVENT PER WEEK (`preferredWeekEvent`), not one per `upcoming`
   *  entry, so picking a card by hand and expecting an Enter for it is how the first draft of this
   *  test failed. Flagging them all removes the guess.
   *
   *  ⚠ AND THE FLAGGED CARD IS WHATEVER THE FIXTURE OFFERS - at week 30 that is a Local Open, a rung
   *  the ENGINE would never flag. That is deliberate and it is not a claim about the rule: this block
   *  asks whether the SCREEN carries the flag it is handed. Which cards the engine flags is
   *  `tests/ending.test.ts`'s question, asked against `entryCostsCollege` itself. */
  function feedWith(costsCollege: boolean) {
    const world = createWorld('component-college-warning')
    const rng = rngFromSeed(world.seed)
    for (let i = 0; i < 30; i++) tickWeek(world, rng)
    const snapshot = toSnapshot(world)
    const enterable = snapshot.upcoming.filter((e) => e.eligible && !e.entered)
    expect(enterable.length, 'the fixture career has enterable cards, or this test is vacuous').toBeGreaterThan(0)
    if (costsCollege) for (const e of enterable) (e as { costsCollege?: boolean }).costsCollege = true
    const store = useGameStore()
    store.snapshot = snapshot
    const w = mount(SeasonScreen, { global: { stubs: { teleport: true } } })
    return { w }
  }

  /** The first Enter the feed actually drew. Every one is named after its own tournament
   *  (`enterActionName`, defect D4), which is what lets a selector say which Enter it means. */
  function firstEnter(w: ReturnType<typeof feedWith>['w']) {
    const pill = w.findAll('button').find((b) => b.attributes('aria-label')?.startsWith('Enter the '))
    expect(pill, 'the feed drew at least one Enter').toBeTruthy()
    return pill!
  }

  async function pressEnter(w: ReturnType<typeof feedWith>['w']) {
    await firstEnter(w).trigger('click')
    const confirm = w.findComponent(ConfirmDialog)
    expect(confirm.exists(), 'the confirm is up').toBe(true)
    return confirm.props('message') as string
  }

  it('⭐⭐ the sentence is in the confirm the SCREEN wrote, not one this test wrote', async () => {
    const { w } = feedWith(true)
    const message = await pressEnter(w)
    expect(message).toContain('can cost the college place at nineteen')
    expect(message).toContain('makes her a professional')
    w.unmount()
  })

  it('⭐⭐ ...and it is ABSENT when the engine says there is nothing left to spend', async () => {
    // The mutation that makes the case above non-vacuous: same career, same card, flag off.
    const { w } = feedWith(false)
    const message = await pressEnter(w)
    expect(message.toLowerCase(), 'no college sentence on a card that costs none').not.toContain('college')
    // ...and the confirm still says the things it always said, so the arm is additive.
    expect(message).toContain('Enter')
    w.unmount()
  })

  it('⚠ it does not become a refusal – the Enter is still live and still says Enter', async () => {
    const { w } = feedWith(true)
    const pill = firstEnter(w)
    expect(pill.attributes('disabled'), 'the parent may always push').toBeUndefined()
    expect(pill.text()).toBe('Enter')
    w.unmount()
  })
})

// =================================================================================================
// AND THE FORK CARD, WHICH GREW A ROW IN THIS PHASE
// =================================================================================================
describe('P4 – the fork card grew a figure and still fits a phone', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    document.body.innerHTML = ''
  })

  function mountFork(vp = PHONE) {
    setViewport(vp)
    useGameStore().snapshot = forkSnapshot(false)
    const w = mount(ForkDialog, { attachTo: document.body })
    const card = document.querySelector('.fork-card')!
    const dismiss = document.querySelector('.fork-answers')!
    expect(card, 'the card is up').toBeTruthy()
    return { w, card, dismiss }
  }

  it('⭐ the answers are still inside the screen with the new row on the card', () => {
    const { w, card, dismiss } = mountFork()
    const fit = assertDismissReachable(card, dismiss, PHONE, 'ForkDialog (P4 row)')
    expect(fit.cap, 'bounded by the room the scrim leaves').toBe(635)
    expect(fit.scrollable).toBe(true)
    w.unmount()
  })

  it('⚠⚠ MUTATION PROOF – the same assertion still goes red on the uncapped card', () => {
    const { w, card, dismiss } = mountFork()
    const before = measureDialog(card, dismiss, PHONE)
    expect(before.contentFloor, 'the card really is taller than the phone, or the mutation is vacuous').toBeGreaterThan(
      before.available.height,
    )
    ;(card as HTMLElement).style.maxHeight = 'none'
    ;(card as HTMLElement).style.overflowY = 'visible'
    expect(() => assertDismissReachable(card, dismiss, PHONE, 'ForkDialog (cap removed)')).toThrow(
      /taller than the screen|outside the viewport/,
    )
    w.unmount()
  })
})
