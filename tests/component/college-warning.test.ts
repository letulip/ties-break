// THE COLLEGE BRANCH ON SCREEN – AND SINCE 16.08 THIS FILE'S SUBJECT IS THAT THERE IS NO WARNING.
//
// ⚠ WHAT IT USED TO BE ABOUT. P4 shipped a warning on both entry paths – *"A result here can cost the
// college place at nineteen"* – because `ending.ts` had been calling the silence intentional on the
// strength of an NCAA eligibility rule that does not exist (the $10,000 pre-enrolment cap was struck
// out by the Brantmeier/Joint settlement of 15 April 2026 and "amateurism" appears zero times in the
// current Division I Manual, docs/research/college-and-the-junior-exit.md §1b).
//
// ⭐⭐ THE OWNER FINISHED THE JOB ON 16.08: «Колледж – это независимая ветка карьеры с отдельным
// функционалом и турнирами, альтернативная.» No result closes it, so the warning states a consequence
// that cannot happen – and a false warning on an entry card is worse than none. **Every positive case
// in this file is now a negative one**, asserted through the same mounted surfaces so a re-introduced
// sentence trips them.
//
// ⚠ THE FILE IS NOT RENAMED. It is the one place the whole college-on-screen question is measured, in
// both directions, and its git history is the record of the reversal.
//
// ⚠ MOUNTED AND NOT PINNED (CLAUDE.md's gotcha). Every claim here is about what a player SEES.
//
// ⚠⚠ AND THE PHONE MEASUREMENTS SURVIVE UNTOUCHED, WITH THEIR MUTATION PROOFS. Round-20 #3 shipped a
// blocking card whose Continue left the screen and stranded the owner's career; the fork card and the
// entry confirm both owe that measurement whether or not they carry a college sentence. Removing copy
// makes a card shorter, so these cannot go red for the reason they were written – which is exactly why
// the mutation proofs are the half that matters here.
import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import ForkDialog from '../../src/components/ForkDialog.vue'
import ConfirmDialog from '../../src/components/ConfirmDialog.vue'
import SeasonScreen from '../../src/components/screens/SeasonScreen.vue'
import CalendarScreen from '../../src/components/screens/CalendarScreen.vue'
// ⚠ THE REAL STYLESHEET, or the fit measurements read an empty cascade and pass vacuously -
// `measureDialog` refuses a document with no `<style>` in it for exactly that reason.
import '../../src/style.css'
import { useGameStore } from '../../src/stores/game'
import { createWorld, tickWeek, toSnapshot } from '../../src/engine/world'
import { rngFromSeed } from '../../src/engine/rng'
import { TIERS, TIER_SHORT } from '../../src/engine/season/calendar'
import { assertDismissReachable, measureDialog, setViewport, NARROW_PHONE, PHONE } from './fits'
import type { Snapshot } from '../../src/shared/protocol'

/** ⚠ IT TOOK A `collegeOpen` ARGUMENT UNTIL 16.08. The flag is off the wire – the fork carries two
 *  facts now – so there is one fork state and every case below builds it. */
function forkSnapshot(): Snapshot {
  return {
    ageYears: 19,
    week: 265,
    kidRank: 88,
    fundsCents: 1234_00,
    careerTotals: { earnedCents: 0, spentCents: 0, prizeCents: 0 },
    fork: { askedWeek: 265, ageYears: 19 },
  } as unknown as Snapshot
}

// =================================================================================================
// (b) THE RESULT ARM – A FIGURE ON THE CARD, NOT A GATE AND NOT A SENTENCE
// =================================================================================================
// The owner's original intent was a fork for the girls whose results are not very good, and #200 is
// the only line the research found that separates the populations (47 points, research §5c). With the
// money arm cancelled it gated nothing, and since 16.08 there is nothing left to gate: the third
// answer is drawn unconditionally and this is one more figure beside her rank for the player to
// compare. The figure survives BOTH removals because it was never a gate.
describe('P4 (b) – the fork card shows where the tour starts admitting her', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    document.body.innerHTML = ''
  })

  it('the tour cut is on the card, and it is the engine constant rather than a typed number', () => {
    useGameStore().snapshot = forkSnapshot()
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
    useGameStore().snapshot = forkSnapshot()
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

  it('⚠ the figure is about the TOUR, and it outlived both college rules', () => {
    // It bears on "turn professional", which is an answer she always has. Tying it to the college
    // door would have made it an argument about college, which is the opinion it may not carry.
    useGameStore().snapshot = forkSnapshot()
    const w = mount(ForkDialog)
    expect(w.find('.fork-facts').text()).toContain(`#${TIERS.wta250.acceptsRank}`)
    w.unmount()
  })
})

// =================================================================================================
// ⭐⭐ THE THIRD ANSWER IS UNCONDITIONAL, AND THE SHUT-DOOR NOTE IS GONE WITH THE RULE
// =================================================================================================
// WHAT WAS HERE: two cases on `.fork-shut`, P4's corrected note – it had stopped citing the repealed
// NCAA rule and rested on the owner's own argument instead ("a girl who is already a professional does
// not go to college"). He withdrew that argument on 16.08. Round-21 #8 asked for the card to explain
// the missing answer; there is no case in which it is missing, so #8 is retired by his own later
// ruling rather than dropped – docs/specs/college-is-its-own-branch-2026-08.md §4 says so.
describe('the fork draws three answers, always', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    document.body.innerHTML = ''
  })

  it('⭐⭐ three answers on the card, and college is one of them', () => {
    useGameStore().snapshot = forkSnapshot()
    const w = mount(ForkDialog)
    const answers = w.findAll('.fork-answer')
    expect(answers.length, 'turn professional, college, stop').toBe(3)
    expect(answers.map((a) => a.text()).join(' | ').toLowerCase()).toContain('college')
    // ...and none of them is disabled into a recommendation.
    for (const a of answers) expect(a.attributes('disabled'), 'no answer is styled as refused').toBeUndefined()
    w.unmount()
  })

  it('⚠ and there is no shut-door note left, on any fork state the wire can carry', () => {
    // The negative that stops the case above passing on a card that still explains a missing answer.
    // `.fork-shut` was the class; the sentence named a rung and said "two answers here and not three".
    useGameStore().snapshot = forkSnapshot()
    const w = mount(ForkDialog)
    expect(w.find('.fork-shut').exists(), 'the class is gone').toBe(false)
    const text = w.text().toLowerCase()
    expect(text, 'no count of the answers').not.toContain('two answers')
    expect(text, 'and no claim about spending a college place').not.toContain('closed the first time')
    w.unmount()
  })
})

// =================================================================================================
// (c) THE WARNING ITSELF, ON THE CONFIRM THAT CARRIES IT
// =================================================================================================
// The Season feed's Enter goes through `ConfirmDialog`; the calendar's marker card is its own
// confirmation and carries the same sentence in `.college-note`. This block measures the confirm,
// which is the blocking one.
/** The longest message `askEnter` can build: the coach speaking, the fatigue caution and the fee.
 *  If the card survives this it survives every shorter one.
 *
 *  ⚠ IT LOST ITS FOURTH SENTENCE ON 16.08 – *"A result here can cost the college place at nineteen – a
 *  win at this level makes her a professional."* – with the rule it warned about. So this string is
 *  SHORTER than the one the fit cases below were written against, which is the safe direction and is
 *  precisely why the mutation proofs in this block are load-bearing rather than decorative: three
 *  green fit assertions on a card that just got shorter prove nothing on their own. */
const LONGEST_ENTRY_CONFIRM =
  'She has had a hard block and this is a long trip for a small draw. ' +
  'Exhausted – racing risks injury. ' +
  'Enter W75 (week 24, clay) anyway? Entry fee $150.00.'

describe('the entry confirm still fits a phone, and carries no college sentence', () => {
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

  it('⚠ the confirm says the numbers and stops – no college sentence anywhere in it', () => {
    // The inverse of the case this replaces, which asserted the college line came last, after the
    // fee. The rule is gone; a confirm that still mentioned it would be pricing a cost into a
    // decision that does not carry one.
    const { w } = mountConfirm()
    const text = w.find('.dialog-message').text().toLowerCase()
    expect(text, 'the confirm still does its own job').toContain('entry fee')
    expect(text, 'and says nothing about a college place').not.toContain('college')
    w.unmount()
  })

  it('⭐ on a 375x667 phone the way out of it is on the screen', () => {
    const { w, card, dismiss } = mountConfirm()
    assertDismissReachable(card, dismiss, PHONE, 'ConfirmDialog (entry confirm)')
    w.unmount()
  })

  it('...and on the narrowest screen too', () => {
    const { w, card, dismiss } = mountConfirm(NARROW_PHONE)
    assertDismissReachable(card, dismiss, NARROW_PHONE, 'ConfirmDialog (entry confirm)')
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
// ⭐⭐ AND THE TWO REAL ENTRY PATHS SAY NOTHING ABOUT COLLEGE, EVEN WHEN HANDED THE OLD FLAG
// =================================================================================================
// WHAT WAS HERE: six cases – three on `SeasonScreen`'s confirm and three on `CalendarScreen`'s marker
// card – asserting the sentence appeared, disappeared when the engine said there was nothing to spend,
// and never became a refusal. Both surfaces are now silent, and the two blocks collapse into one pair
// of negatives on the same real screens.
//
// ⚠⚠ THE FIXTURE FORCES THE RETIRED FLAG ON, WHICH IS WHAT MAKES THIS NON-VACUOUS. `costsCollege` was
// removed from `UpcomingEvent`, so a card can no longer carry it honestly – but a screen that still
// READ it would print the sentence the moment a stale snapshot supplied one. Setting it by hand on
// every enterable card is the strongest available proof that no `v-if` and no string concatenation is
// still listening. A screen that reintroduced the copy goes red here.
describe('the two entry paths carry no college sentence, even when handed the old flag', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    document.body.innerHTML = ''
  })

  it('⭐⭐ SeasonScreen: the confirm the SCREEN wrote says nothing about college', async () => {
    const world = createWorld('component-college-warning')
    const rng = rngFromSeed(world.seed)
    for (let i = 0; i < 30; i++) tickWeek(world, rng)
    const snapshot = toSnapshot(world)
    const enterable = snapshot.upcoming.filter((e) => e.eligible && !e.entered)
    expect(enterable.length, 'the fixture career has enterable cards, or this test is vacuous').toBeGreaterThan(0)
    // The retired flag, forced on every card the feed might draw.
    for (const e of enterable) (e as { costsCollege?: boolean }).costsCollege = true
    useGameStore().snapshot = snapshot
    const w = mount(SeasonScreen, { global: { stubs: { teleport: true } } })
    // ⚠ THE FEED DRAWS ONE PREFERRED EVENT PER WEEK, so the Enter is found by its own name
    // (`enterActionName`, defect D4) rather than picked by index.
    const pill = w.findAll('button').find((b) => b.attributes('aria-label')?.startsWith('Enter the '))
    expect(pill, 'the feed drew at least one Enter').toBeTruthy()
    await pill!.trigger('click')
    const confirm = w.findComponent(ConfirmDialog)
    expect(confirm.exists(), 'the confirm is up – nothing here is vacuous').toBe(true)
    const message = confirm.props('message') as string
    expect(message, 'the confirm still does its own job').toContain('Enter')
    expect(message.toLowerCase(), 'and says nothing about a college place').not.toContain('college')
    // ...and it never became a refusal in either direction: the parent may always push.
    expect(pill!.attributes('disabled')).toBeUndefined()
    w.unmount()
  })

  it('⭐⭐ CalendarScreen: the marker card is its own confirmation, and it is silent too', async () => {
    // This card has no ConfirmDialog behind its Enter, so a sentence removed only from Season would
    // still be live on half the entry paths – which is why P4 put it on both and why both are checked.
    const world = createWorld('component-college-calendar')
    const rng = rngFromSeed(world.seed)
    for (let i = 0; i < 12; i++) tickWeek(world, rng)
    const snapshot = toSnapshot(world)
    for (const e of snapshot.upcoming) (e as { costsCollege?: boolean }).costsCollege = true
    useGameStore().snapshot = snapshot
    const w = mount(CalendarScreen, { global: { stubs: { teleport: true } } })
    const markers = w.findAll('.cal-marker')
    expect(markers.length, 'the calendar drew a marker to open, or this test is vacuous').toBeGreaterThan(0)
    await markers[0].trigger('click')
    const enter = w.findAll('button').find((b) => b.text() === 'Enter')
    expect(enter, 'the marker card is open and has an Enter').toBeTruthy()
    expect(w.find('.college-note').exists(), 'the class is gone with the sentence').toBe(false)
    expect(w.text().toLowerCase(), 'and no copy replaced it').not.toContain('college place')
    expect(enter!.attributes('disabled'), 'the parent may always push').toBeUndefined()
    w.unmount()
  })
})

// =================================================================================================
// AND THE FORK CARD, WHICH GREW A ROW IN THIS PHASE
// =================================================================================================
describe('the fork card fits a phone – with a figure added and a paragraph removed', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    document.body.innerHTML = ''
  })

  function mountFork(vp = PHONE) {
    setViewport(vp)
    useGameStore().snapshot = forkSnapshot()
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
