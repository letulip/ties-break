// =================================================================================================
// ⭐⭐⭐ ROUND 27 #5 – THE SEASON TAB, INSIDE THE COLLEGE FREEZE
// =================================================================================================
//
// The owner, 27.08: «на время колледжа на вкладке Season кнопки подачи заявок и планирования недели
// задизаблим пожалуйста. Можно рядом или ниже написать пояснение, что это только на время колледжа
// (как сейчас наверху появляется)».
//
// ⚠⚠ THE ENGINE WAS ALREADY RIGHT, WHICH IS WHY THIS NEEDS A MOUNTED TEST RATHER THAN AN ENGINE ONE.
// `enterEvent`, `withdrawEvent`, `cancelEntry`, `bookVacation` and `bookPractice` all open with
// `guardNotEnded`, and inside the freeze that throws `COLLEGE_FREEZE_REFUSAL` – the college sentence,
// not the ended one. Nothing illegal could happen and the message coming back was the right message;
// `tests/round24-college-refusals.test.ts` pins all of that and none of it moved. The defect was
// entirely about WHEN the player learned it, so the only surface that can hold the claim is the
// rendered screen.
//
// ⚠⚠ AND THE HALF THAT IS EASY TO GET WRONG IS THE SECOND ONE. Round 24's E2 audit left two cancels
// deliberately OPEN inside the freeze (`cancelVacation` / `cancelPractice`, both on
// `guardNotEndedForGood`) because undoing a booking is about the family's own week rather than about
// the tour – and a booking made before the fork really is resolved inside the freeze, since
// `resolveVacation` / `resolvePractice` carry no `inCollege` gate. Disabling one of those would be
// the same class of lie as leaving Enter live, pointed the other way, so both directions are pinned
// here and the fixture books a real trip and a real friendly to make the second one non-vacuous.
import { describe, it, expect, beforeEach, vi } from 'vitest'

// ⚠ A RUNNER-SIZED CEILING, ON round24-college-shell.test.ts's OWN ARITHMETIC AND FOR ITS REASON.
// The fixture walks a real career ~86 weeks to the September she leaves in; measured alone it is
// ~1s, and the component project runs its files in parallel, where the documented slow-machine
// signature (CLAUDE.md) has already pushed comparable cases past vitest's 5s default with ZERO
// assertion failures. 30s is ~30x the solo cost: it can only fire on a genuine wedge. ⚠ If a case
// here ever takes tens of seconds ALONE that is a real regression, and this must not be raised.
vi.setConfig({ testTimeout: 30_000 })
import { flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'

import PlanWeekSheet from '../../src/components/PlanWeekSheet.vue'
import {
  COLLEGE_FREEZE_REFUSAL,
  answerFork,
  bookPractice,
  bookVacation,
  closeTournament,
  createWorld,
  measureCollegeOffer,
  revealTournamentRound,
  tickWeek,
  toSnapshot,
  type WorldState,
} from '../../src/engine/world'
import { resumeMain } from '../../src/engine/rng'
import { DEFAULT_PROFILE, type Snapshot } from '../../src/shared/protocol'
import { careerSnapshot } from '../helpers/career'
import { mountSeason } from '../helpers/mountSeason'

function finishAnyReveal(world: WorldState): void {
  for (let i = 0; i < 40 && world.pendingTournament && !world.pendingTournament.finished; i++) {
    revealTournamentRound(world)
  }
  if (world.pendingTournament) closeTournament(world)
}

/** ⭐⭐⭐ A CAREER THAT WAS REALLY PLAYED TO THE FORK, REALLY ANSWERED «college», AND REALLY WALKED TO
 *  THE SEPTEMBER SHE LEAVES IN – round24-college-shell.test.ts's `atCollege`, plus the two bookings
 *  this file is about.
 *
 *  ⚠ THE BOOKINGS ARE MADE ON TOUR, BEFORE THE LATCH, ON WEEKS THAT LAND INSIDE THE FREEZE – which
 *  is not a trick to reach a state the game cannot: it is exactly the shape round 24's E2 opened the
 *  two cancels FOR. `resolveCollegeDeparture` releases her ENTRIES and leaves `world.practices` and
 *  `world.vacations` untouched, so a friendly and a family week booked in August are still on the
 *  calendar in September with the latch on, and the tick will really resolve them.
 *
 *  ⚠ THE ONE THUMB ON THE SCALE IS `college-freeze.test.ts`'s: four years is 208 weeks of base costs
 *  and a career that went bankrupt inside them would be measuring the family budget instead. */
function atCollegeWithBookings(seed: string): Snapshot {
  const world = createWorld(seed, { ...DEFAULT_PROFILE })
  const rng = resumeMain(world.rngMain)
  for (let i = 0; i < 60; i++) {
    tickWeek(world, rng)
    finishAnyReveal(world)
  }
  world.fundsCents = 500_000_00
  world.fork = { askedWeek: world.week, answer: null, offer: measureCollegeOffer(world) }
  answerFork(world, 'college')
  const departsWeek = world.fork.departsWeek
  expect(departsWeek, 'the answer reserved a place and named the September').not.toBeNull()
  // The friendly on the week RIGHT after she leaves, so the row also draws «Play it and watch» – the
  // control that spends a week, and the one that was failing in complete silence.
  bookPractice(world, departsWeek! + 1, false)
  bookVacation(world, departsWeek! + 3, 'seaside')
  for (let i = 0; i < 60 && world.ending === null; i++) {
    tickWeek(world, rng)
    finishAnyReveal(world)
  }
  expect(world.ending?.type, 'the departure really latched the college ending').toBe('college')
  expect(world.week, 'and it latched on the week she was due to leave').toBe(departsWeek)
  return toSnapshot(world)
}

// Built once: the walk is the expensive part and a `Snapshot` is plain data, so every case below
// mounts the SAME career (each behind its own fresh Pinia).
let frozen: Snapshot | null = null
const frozenCareer = (): Snapshot => (frozen ??= atCollegeWithBookings('r27-5-college'))

/** The control arm – the same screen on tour, where every one of these controls works. */
const onTour = (): Snapshot => careerSnapshot(60, 'r27-5-tour')

/** Every «+ Plan week» button on screen. The label is the owner's own «планирования недели». */
const planButtons = (w: ReturnType<typeof mountSeason>) =>
  w.findAll('button').filter((b) => b.text().includes('Plan week'))

/** Every Enter pill: `PrimaryPill` renders `button.primary`, and inside an event card's controls
 *  there is exactly one affirmative button. */
const enterPills = (w: ReturnType<typeof mountSeason>) => w.findAll('.event-card .controls button.primary')

describe('⭐⭐⭐ round 27 #5 – the entry and planning controls stand down for the four college years', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('the fixture really is inside the freeze, and it really still has the two bookings', () => {
    const snap = frozenCareer()
    // Neither half is vacuous: the latch is on, and it is the COLLEGE latch – the one
    // `guardNotEnded` answers with the college sentence rather than the ended one.
    expect(snap.ending?.ending.type).toBe('college')
    expect(snap.ending?.college, 'and she is still enrolled, so the tab shell is what she gets').not.toBeNull()
    expect(snap.practices.some((p) => p.week === snap.week + 1), 'a friendly survived the departure').toBe(true)
    expect(snap.vacations.length, 'and so did the family week').toBe(1)
    // ⭐ The departure released her entries, which is why no Withdraw / Cancel-entry button is
    // asserted below: at college there is nothing entered to withdraw FROM. Both commands are gated
    // in the template all the same – see the report and `frozenForCollege` in SeasonScreen.vue.
    expect(snap.upcoming.some((e) => e.entered), 'the departure released every outstanding entry').toBe(false)
  })

  it('⭐ Enter is disabled on every card, and there are cards to be disabled', () => {
    const wrapper = mountSeason(frozenCareer())
    const pills = enterPills(wrapper)
    expect(pills.length, 'a season with no enterable card would make this vacuous').toBeGreaterThan(0)
    for (const pill of pills) expect(pill.attributes('disabled')).toBeDefined()
    wrapper.unmount()
  })

  it('⭐ «+ Plan week» is disabled on every week it is drawn on', () => {
    const wrapper = mountSeason(frozenCareer())
    const buttons = planButtons(wrapper)
    expect(buttons.length, 'a calendar with no plannable week would make this vacuous').toBeGreaterThan(0)
    for (const b of buttons) expect(b.attributes('disabled')).toBeDefined()
    wrapper.unmount()
  })

  it('⭐⭐ ...and so is «Play it and watch», which is an ADVANCE and was failing in silence', () => {
    // `advanceRefusal` returns 'ending' behind any latch, college included, so the week never moved –
    // and 'ending' is the one stop reason with no copy in App.vue's `STOP_REASON_TEXT`, so R10-16's
    // «no copy, no toast» meant the press produced nothing at all. App.vue's own week bar already
    // stands down on a college week for exactly this argument; this is the same command on another
    // screen, and it had not been told.
    const wrapper = mountSeason(frozenCareer())
    const play = wrapper.findAll('.planned-actions button.primary')
    expect(play.length, 'the friendly is booked for next week, so the pill is drawn').toBe(1)
    expect(play[0].text()).toContain('Play it and watch')
    expect(play[0].attributes('disabled')).toBeDefined()
    wrapper.unmount()
  })

  it('⭐ the reason is on screen, and it is the ENGINE\'s sentence rather than a copy of it', () => {
    // ⚠ COMPARED AGAINST THE IMPORTED CONSTANT, WHICH IS THE WHOLE POINT OF THE CONSTANT.
    // `COLLEGE_FREEZE_REFUSAL`'s own comment: «a string literal copied into a test is a rename that
    // breaks a report in silence» – and a component is the same reader as a test. Reword the
    // engine's sentence and this equality fails until the screen is reading it again.
    const wrapper = mountSeason(frozenCareer())
    const note = wrapper.find('.college-freeze-note')
    expect(note.exists(), 'the owner asked for a line beside the controls').toBe(true)
    expect(note.text()).toBe(COLLEGE_FREEZE_REFUSAL)
    wrapper.unmount()
  })

  it('⚠ ...and it is read BEFORE the first control it explains', () => {
    // A disabled control still needs its reason READABLE, which is half a placement claim and half a
    // reachability one.
    //
    // ⚠ THE REACHABILITY HALF IS NOT A BOX MEASUREMENT AND MUST NOT PRETEND TO BE. `fits.ts` exists
    // because happy-dom has no layout engine, and everything it models is a DIALOG – a fixed,
    // centred card that can push its own dismiss control off a 375x667 screen with nothing to
    // scroll. This note is a `<p>` in the ordinary page flow of a scrolling tab: there is no box to
    // overflow and no control to strand, so the honest claim left is ORDER. A player reading down
    // the calendar meets the reason before the first greyed Enter, rather than after eight cards of
    // wondering.
    const wrapper = mountSeason(frozenCareer())
    const note = wrapper.find('.college-freeze-note').element
    const firstEnter = enterPills(wrapper)[0].element
    // The DOM's own ordering predicate, which returns a bitmask.
    const follows = note.compareDocumentPosition(firstEnter) & Node.DOCUMENT_POSITION_FOLLOWING
    expect(follows, 'the reason precedes the control it is about').toBeTruthy()
    wrapper.unmount()
  })
})

describe('⚠⚠ round 27 #5 – and NOT everything on the screen is frozen (round 24, E2)', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('⚠⚠ the practice cancel stays LIVE inside the freeze – `cancelPractice` is `guardNotEndedForGood`', () => {
    // The trap this file exists for. A friendly booked before the fork is really played inside the
    // freeze (`resolvePractice` has no `inCollege` gate), so the parent must be able to call it off –
    // and until round 24 he could not, which is a refused control with no honest reason on screen
    // sitting on top of a booking the game still intends to honour. Freezing this control would put
    // that bug back with the opposite sign.
    const wrapper = mountSeason(frozenCareer())
    const cancels = wrapper
      .findAll('.planned-actions button')
      .filter((b) => b.text() === 'Cancel')
    expect(cancels.length, 'the booked friendly draws its Cancel').toBe(1)
    expect(cancels[0].attributes('disabled'), 'the engine allows this one all four years').toBeUndefined()
    wrapper.unmount()
  })

  it('⚠⚠ the booked family week still opens its planner, and the cancel inside it is live', async () => {
    // The painted vacation card carries no button by the owner's 29.07 ruling – the tap IS the
    // control. `PlanWeekSheet` answers a booked week with its `booked` pane, a third pane that
    // REPLACES both booking tabs, so this door reaches `cancelVacation` and nothing else. Had the
    // freeze been applied to the card instead of to the commands, this is what it would have cost.
    const wrapper = mountSeason(frozenCareer())
    const card = wrapper.find('.week-card.vacation')
    expect(card.exists(), 'the booked family week is on the calendar').toBe(true)
    await card.trigger('click')
    await flushPromises()
    const sheet = wrapper.findComponent(PlanWeekSheet)
    expect(sheet.exists(), 'the tap still opens the planner inside the freeze').toBe(true)
    const cancelTrip = sheet.findAll('button').filter((b) => b.text() === 'Cancel the trip')
    expect(cancelTrip.length, 'the sheet opened on the booked pane, not on a booking tab').toBe(1)
    expect(cancelTrip[0].attributes('disabled')).toBeUndefined()
    wrapper.unmount()
  })
})

describe('⚠ round 27 #5 – the control arm: on tour every one of them works', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('no freeze note, and the entry and planning controls are live', () => {
    // ⚠ WITHOUT THIS ARM THE THREE ASSERTIONS ABOVE ARE SATISFIED BY «disable it always», which is
    // the shortest way to write this feature wrong: it would cost the player the whole Season tab
    // and every one of the suites above would still be green.
    const snap = onTour()
    expect(snap.ending, 'the control arm is a career with no latch at all').toBeNull()
    const wrapper = mountSeason(snap)
    expect(wrapper.find('.college-freeze-note').exists(), 'nothing to explain on tour').toBe(false)
    const pills = enterPills(wrapper)
    expect(pills.length).toBeGreaterThan(0)
    expect(
      pills.some((p) => p.attributes('disabled') === undefined),
      'a career on tour can enter something',
    ).toBe(true)
    const buttons = planButtons(wrapper)
    expect(buttons.length).toBeGreaterThan(0)
    expect(buttons.every((b) => b.attributes('disabled') === undefined), 'and can plan every free week').toBe(true)
    wrapper.unmount()
  })
})
