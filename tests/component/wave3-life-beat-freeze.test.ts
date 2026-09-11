// =================================================================================================
// ⭐⭐⭐ WAVE 3, T2 – A LIFE BEAT RAISED INSIDE THE COLLEGE FREEZE HAS A DIALOG
// =================================================================================================
//
// `docs/plans/life-wave-3-builder-2026-09.md` §2 T2. The overlay queue has known `'life'` since v73
// and orders it correctly (after the birthday, before the fork) – but the round-24 exception, the
// one `'ending'` something may be laid over, white-listed the BIRTHDAY alone. So a beat raised
// inside the resumable college latch answered `'ending'`, the freeze's own card rendered, and the
// beat had no dialog at all: a week `advanceRefusal` has stopped, with nothing on screen to answer
// it.
//
// ⚠ WHY IT IS FIXED BEFORE THE BEAT THAT NEEDS IT EXISTS. Wave 2 raises exactly one beat and it
// fires on the fork's opening tick, OUTSIDE the freeze, so the hole was unreachable. T3's arrival
// hazard rolls every eligible week from sixteen on and runs through the college years BY DESIGN, so
// the first thing it can do on this tree is strand a career. T2 lands first for that reason.
//
// ⚠ MOUNTED, AND OVER A WALKED CAREER – round24-college-shell.test.ts's own two disciplines. The
// claim is «her card is ON THE SCREEN over the freeze», and a source pin goes green on a shell that
// reads the right field and renders nothing. The career below really plays sixty weeks, really
// answers the fork with «college» and really walks to the September departure that latches it.
//
// ⚠ THE BEAT IS A REAL ENGINE ROW, NOT A FABRICATED SNAPSHOT FIELD (life-beat-dialog.test.ts builds
// its prompt from the TYPE, deliberately, because it is testing the component in isolation). Here
// the row goes in through `raiseLifeBeat`, the prompt is `toSnapshot`'s own, and the answer runs
// `answerLifeBeat` – so the third claim below, that the freeze RESUMES, is the engine's verdict and
// not this file's arrangement.
//
// ⚠ THE KIND IS `fork-opinion` BECAUSE IT IS THE ONLY ONE THERE IS (`LifeBeatKind`, v73): the
// arrival's own `'met'` beat lands in T6. The row's kind decides nothing this file asserts – the
// queue reads `lifeBeatPrompt`, not what she is talking about – so the fixture takes the kind that
// exists rather than waiting three tasks for the one that motivates the fix.
//
// ⚠⚠ EVERY ARM IS RECORDED, the wave's standing duty (§0.7) – a net nobody watched fail proves
// nothing, so what was broken and what went red is written down here:
//
//   ARM 1  the white-list re-narrowed to the birthday alone            5 RED - every case in the
//          file. `laidOverLatch` cut back to `snapshot.birthdayPrompt`, which restores the shipped
//          v73 line verbatim and is therefore the exact defect T2 closes:
//            * «her card is what ASKS, and the college year is still dressed behind it»:
//              "the queue hands the screen to her: expected 'ending' to be 'life'"
//            * «the epilogue never takes the screen from either of them»:
//              "expected 'ending' to be 'life'"
//            * «the last answer is inside a 375x667 phone, and the card is bounded and scrolls»:
//              "the card is up – nothing below is vacuous: expected false to be true"
//            * «answering hands the shell back to the freeze, and the year is pressable again»:
//              "her card is up before it is answered: expected false to be true"
//            * «the fixture really is the round-24 latch, and the beat really is pending»:
//              "the QUEUE is the half that was broken: expected 'ending' to be 'life'"
//
//   ARM 2  the white-list widened to EVERY ending (`collegeShell &&` dropped)   1 RED, and it is
//          the OTHER direction – the arm that says the exception is still an EXCEPTION. Caught in
//          `tests/blocking-overlay.test.ts`, not here: «an ending outranks everything – there is no
//          shell to lay a dialog over» reads "expected 'knock' to be 'ending'", because a real
//          ending with a question standing would fall past the takeover it replaces the shell with.
//          ⚠ AND round24-college-shell.test.ts DOES NOT CATCH IT – its five real endings carry no
//          pending question, so the widened predicate returns 'ending' for them unchanged. Recorded
//          because the reverse was assumed here before it was run.
//
//   ARM 3  the fixture's `world.knock = null` removed                  5 RED - the walked career
//          really does come out of the freeze with a sore shoulder standing ("expected { part:
//          'lower back', …(5) } to be null") and the queue answers 'knock' ahead of her, exactly as
//          it does ahead of the birthday. ⚠ NOT A DEFECT AND NOT THIS WAVE'S TO CHANGE (architect,
//          11.09): it is the birthday's own inherited ordering, it is documented at the predicate
//          in `blockingOverlay.ts`, and both questions clear by a command of their own. The arm is
//          recorded because it proves the fixture is not quietly leaning on a knock that is absent.
import { describe, it, expect, beforeEach, vi } from 'vitest'

// ⚠ A RUNNER-SIZED CEILING, THE ARITHMETIC IS round24-college-shell.test.ts's: every case mounts the
// whole App over a career walked ~110 weeks to the college latch, the heaviest shape a component
// test takes here, and under the component project's parallelism a 1.4 s case has crossed vitest's
// 5 s default with zero assertion failures. 30 s can only fire on a genuine wedge.
vi.setConfig({ testTimeout: 30_000 })
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'

// The shell imports the service-worker registration and the component project resolves no virtual
// module for it – the same mock round19-wrapup / round24-college-shell install.
vi.mock('../../src/pwa', async () => {
  const { ref } = await import('vue')
  return { needRefresh: ref(false), applyUpdate: () => {}, UPDATE_CHECK_MS: 3600_000 }
})

// ⚠ THE APP'S OWN STYLESHEET. Without it `measureDialog` refuses outright and the phone measurement
// below would be vacuous rather than green.
import '../../src/style.css'
import App from '../../src/App.vue'
import SplashScreen from '../../src/components/SplashScreen.vue'
import EndingScreen from '../../src/components/EndingScreen.vue'
import HomeScreen from '../../src/components/screens/HomeScreen.vue'
import CollegeYearCard from '../../src/components/CollegeYearCard.vue'
import LifeBeatDialog from '../../src/components/LifeBeatDialog.vue'
import { useGameStore } from '../../src/stores/game'
import { blockingOverlay } from '../../src/composables/blockingOverlay'
import {
  answerFork,
  answerLifeBeat,
  closeTournament,
  createWorld,
  measureCollegeOffer,
  pendingBirthday,
  pendingLifeBeat,
  raiseLifeBeat,
  revealTournamentRound,
  tickWeek,
  toSnapshot,
  type WorldState,
} from '../../src/engine/world'
import { resumeMain } from '../../src/engine/rng'
import { assertDismissReachable, PHONE, setViewport } from './fits'
import { DEFAULT_PROFILE } from '../../src/shared/protocol'

// ⚠ THIS RUNNER HAS NO localStorage – the same shim round19-wrapup / round21-popup-order /
// round24-college-shell install. Supply the browser's object, do not weaken the app.
const backing = new Map<string, string>()
Object.defineProperty(globalThis, 'localStorage', {
  configurable: true,
  value: {
    getItem: (k: string) => (backing.has(k) ? backing.get(k)! : null),
    setItem: (k: string, v: string) => void backing.set(k, String(v)),
    removeItem: (k: string) => void backing.delete(k),
    clear: () => backing.clear(),
    key: (i: number) => [...backing.keys()][i] ?? null,
    get length() {
      return backing.size
    },
  },
})

function finishAnyReveal(world: WorldState): void {
  for (let i = 0; i < 40 && world.pendingTournament && !world.pendingTournament.finished; i++) {
    revealTournamentRound(world)
  }
  if (world.pendingTournament) closeTournament(world)
}

/** ⭐⭐⭐ A CAREER REALLY PLAYED TO THE FORK, REALLY ANSWERED «college» AND REALLY WALKED TO THE
 *  DEPARTURE THAT LATCHES IT – round24-college-shell.test.ts's `atCollege`, and it is copied rather
 *  than imported because a test helper shared between files is a dependency neither file declares.
 *  Then ONE row of her own, through the engine's only writer of one.
 *
 *  ⚠ THE KNOCK IS CLEARED, AND IT IS THE ARTEFACT round24-college-shell AND round19-wrapup BOTH
 *  RECORD: an input-free walk leaves a sore shoulder standing, and the queue puts her BODY ahead of
 *  every other question – ahead of the birthday since round 17 and therefore ahead of her voice too.
 *  That ordering is correct, is inherited rather than introduced by this wave, and is noise here, so
 *  it is removed from the fixture rather than worked around in the assertions (ARM 3). */
function atCollegeWithBeat(seed: string): WorldState {
  const world = createWorld(seed, { ...DEFAULT_PROFILE })
  const rng = resumeMain(world.rngMain)
  for (let i = 0; i < 60; i++) {
    tickWeek(world, rng)
    finishAnyReveal(world)
  }
  // ⚠ THE ONE THUMB ON THE SCALE, and it is `college-freeze.test.ts`'s: four years is 208 weeks of
  // base costs, and a career that went bankrupt inside them would be measuring the family budget.
  world.fundsCents = 500_000_00
  world.fork = { askedWeek: world.week, answer: null, offer: measureCollegeOffer(world) }
  answerFork(world, 'college')
  // ROUND 24 #5: the answer reserves – the walk to the September departure is what latches it.
  for (let i = 0; i < 54 && world.ending === null; i++) {
    tickWeek(world, rng)
    finishAnyReveal(world)
  }
  expect(world.ending?.type, 'the departure really latched the college ending').toBe('college')
  world.knock = null
  expect(pendingBirthday(world), 'and no cake is standing either – she is the only question').toBeNull()

  // HER ROW, inside the freeze, through the engine's one writer of a `lifeLog` row. `detail` is a
  // `ForkWant` because `fork-opinion` is the only kind v73 has copy for – see the header.
  raiseLifeBeat(world, 'fork-opinion', 'college')
  expect(pendingLifeBeat(world), 'the beat really is waiting').not.toBeNull()
  return world
}

/** Mount the shell on a world, past the splash. Attached to the document, which is the only place
 *  the cascade is the player's – the phone measurement reads it through `getComputedStyle`. */
async function openShell(world: WorldState) {
  const game = useGameStore()
  vi.spyOn(game, 'init').mockResolvedValue(undefined)
  game.$patch({ ready: true, phase: 'ready' })
  // Assigned, never `$patch`ed – `$patch` deep-merges and these cases care about absent keys.
  game.snapshot = toSnapshot(world)
  const w = mount(App, { attachTo: document.body, global: { stubs: { teleport: true } } })
  w.findComponent(SplashScreen).vm.$emit('done')
  await flushPromises()
  return { w, game }
}

describe('⭐⭐⭐ T2 – the college freeze no longer swallows a life beat', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    backing.clear()
    document.body.innerHTML = ''
  })

  it('⭐⭐⭐ her card is what ASKS, and the college year is still dressed behind it', async () => {
    const world = atCollegeWithBeat('t2-freeze-beat')
    const { w, game } = await openShell(world)

    // NOT VACUOUS, IN BOTH DIRECTIONS: the latch really is on and it really is the RESUMABLE college
    // one (`ending.college !== null` is App.vue's own `showCollege` half), and her prompt really is
    // on the wire. Either half absent and everything below would be measuring an ordinary week.
    expect(game.snapshot?.ending?.ending.type, 'the college latch is on').toBe('college')
    expect(game.snapshot?.ending?.college, 'and it is the resumable one – the Home shell case').not.toBeNull()
    expect(game.snapshot?.lifeBeatPrompt, 'and she is waiting to be answered').not.toBeNull()

    // THE QUEUE'S OWN ANSWER – the half that was broken. Before T2 this read 'ending'.
    expect(blockingOverlay(game.snapshot ?? null), 'the queue hands the screen to her').toBe('life')

    // ...AND THE SCREEN AGREES, which is the half only a mount can make.
    expect(w.findComponent(LifeBeatDialog).exists(), 'her dialog is on the screen').toBe(true)
    expect(w.find('.life-beat-dialog').exists(), 'the card itself, not merely the component').toBe(true)
    expect(w.findAll('.life-beat-choice').length, 'with answers to press').toBeGreaterThan(0)
    expect(w.find('#life-beat-said').text(), 'and her line on it').toBe(game.snapshot!.lifeBeatPrompt!.said)

    // ⚠ «NOT THE FREEZE CARD» IS A CLAIM ABOUT WHICH CARD IS ASKING, NOT ABOUT WHAT IS PAINTED
    // BEHIND IT. The shell KEEPS its college dress under her dialog – App.vue gates `showCollege` on
    // the latch rather than on the overlay precisely so the backdrop cannot flip out of college
    // clothes for the frames a question is up, which is the birthday's own arrangement.
    expect(w.findComponent(HomeScreen).exists(), 'the tab shell is alive under her').toBe(true)
    expect(w.findComponent(CollegeYearCard).exists(), 'still in its college dress').toBe(true)
    w.unmount()
  })

  it('⚠ the epilogue never takes the screen from either of them', async () => {
    // The other direction of the same predicate: the exception must not turn the latch into a real
    // ending, and it must not let the album in. `EndingScreen` is a TAKEOVER – if it rendered, her
    // dialog would be over a screen with no next week behind it.
    const world = atCollegeWithBeat('t2-freeze-no-album')
    const { w, game } = await openShell(world)
    expect(blockingOverlay(game.snapshot ?? null)).toBe('life')
    expect(w.findComponent(EndingScreen).exists(), 'no album in the middle of the story').toBe(false)
    expect(w.findAll('.album-dots i'), 'nor any of its pages').toHaveLength(0)
    w.unmount()
  })

  // ===============================================================================================
  // ⚠⚠ THE ROUND-20 POPUP LAW – THE LAST ACTIONABLE CONTROL IS INSIDE A 375x667 PHONE
  // ===============================================================================================
  //
  // CLAUDE.md's gotcha: «any dialog you add or lengthen gets a mounted assertion that its dismiss
  // control's box is inside a 375x667 viewport». The card's own fit is pinned in
  // life-beat-dialog.test.ts against the dialog mounted alone; this is the same measurement taken
  // where T2 actually puts it – inside the whole shell, over the college latch, with the freeze's
  // own furniture in the document. A blocking card whose last answer is off the bottom of a phone
  // stops the career, and inside the freeze there is no way past it at all.
  it('⚠⚠ the last answer is inside a 375x667 phone, and the card is bounded and scrolls', async () => {
    // ⚠ THE VIEWPORT FIRST: happy-dom resolves lengths at `getComputedStyle` time and caches a media
    // query on an element's first read, so a size set after the mount measures the previous screen.
    setViewport(PHONE)
    const world = atCollegeWithBeat('t2-freeze-fits')
    const { w } = await openShell(world)
    const card = w.find('.life-beat-dialog')
    expect(card.exists(), 'the card is up – nothing below is vacuous').toBe(true)

    // ⚠ THE STRUCTURAL PRECONDITION, ASSERTED BEFORE ANY MEASUREMENT (life-beat-dialog.test.ts's own):
    // `measureDialog` reads the control's box off the CARD's bottom edge, so the answers have to be
    // the last thing in its flow. Anything appended after them makes every number below quietly
    // wrong while every assertion stays green.
    const choices = card.element.querySelector('.life-beat-choices')
    expect(choices, 'the answers are on the card').toBeTruthy()
    expect(card.element.lastElementChild, 'and they are the card\'s last element').toBe(choices)
    const last = choices!.lastElementChild!
    expect(last.classList.contains('life-beat-choice'), 'the last of them is an answer').toBe(true)

    const fit = assertDismissReachable(card.element, last, PHONE, 'LifeBeatDialog (in the college freeze)')
    expect(fit.cap, 'bounded by the room the scrim leaves').toBeLessThanOrEqual(fit.available.height)
    expect(fit.scrollable, 'and what is past the fold can be reached').toBe(true)

    // ⚠ AND THE MEASUREMENT CAN FAIL, proven here rather than asserted: take the shared height bound
    // away – the exact shape `TourBriefingDialog` shipped in – and the same call has to go red.
    ;(card.element as HTMLElement).style.maxHeight = 'none'
    ;(card.element as HTMLElement).style.overflowY = 'visible'
    expect(() =>
      assertDismissReachable(card.element, last, PHONE, 'LifeBeatDialog (cap removed)'),
    ).toThrow(/declares no height bound that fits|cannot be reached at all/)
    w.unmount()
  })

  it('⭐⭐ answering hands the shell back to the freeze, and the year is pressable again', async () => {
    // The third claim: the latch never left, so the beat is a PAUSE and not an exit. The press goes
    // through the component, and the store's command is wired to the ENGINE's own – so this is
    // `answerLifeBeat` re-validating the option id and `blockingOverlay` reading the world it left.
    const world = atCollegeWithBeat('t2-freeze-resumes')
    const { w, game } = await openShell(world)
    game.answerLifeBeat = async (optionId: string) => {
      answerLifeBeat(world, optionId)
      game.snapshot = toSnapshot(world)
    }
    expect(w.findComponent(LifeBeatDialog).exists(), 'her card is up before it is answered').toBe(true)

    // ⚠ THE FIRST ANSWER AND NOT THE LAST: the third option is «listen», which opens the listening
    // detour (a second tap answers it). The first is a one-press answer, which is what this case is
    // about – the fit case above measures the last CONTROL, which is a different question.
    await w.findAll('.life-beat-choice')[0].trigger('click')
    await flushPromises()

    expect(pendingLifeBeat(world), 'the engine recorded it – nothing is still waiting').toBeNull()
    expect(game.snapshot?.lifeBeatPrompt, 'and the prompt left the wire').toBeNull()
    expect(w.findComponent(LifeBeatDialog).exists(), 'so her card is gone').toBe(false)

    // THE LATCH IS BACK AS THE QUESTION, which is what «the freeze resumes» means – the college
    // ending was never cleared, it was merely laid over.
    expect(game.snapshot?.ending?.ending.type, 'the latch never left').toBe('college')
    expect(blockingOverlay(game.snapshot ?? null), 'and it is the question again').toBe('ending')
    expect(w.findComponent(CollegeYearCard).exists(), 'the year is what he is looking at').toBe(true)
    expect(w.findAll('.college-answer').length, 'and its own control is pressable again').toBeGreaterThan(0)
    w.unmount()
  })

  it('⚠ the fixture really is the round-24 latch, and the beat really is pending', async () => {
    // ⚠ THE ANTI-VACUITY CASE, stated as its own claim rather than left implicit. Every assertion in
    // this file rests on a state with BOTH halves standing at once, and the two ways this file could
    // go quietly green are a latch that never formed and a beat that was never raised. Both are
    // read off the engine here, before any component is involved.
    const world = atCollegeWithBeat('t2-freeze-premise')
    expect(world.ending?.type, 'the college ending is latched').toBe('college')
    expect(world.college, 'and the progress view exists – this is the RESUMABLE shape').not.toBeNull()
    expect(world.college?.doneWeek, 'she has not left it').toBeNull()
    expect(pendingLifeBeat(world)?.answer, 'her row is unanswered, which IS the pending state').toBeNull()
    const snap = toSnapshot(world)
    expect(snap.knockPrompt, 'no knock stands in front of her').toBeNull()
    expect(snap.birthdayPrompt, 'and no birthday either').toBeNull()
    expect(blockingOverlay(snap), 'the QUEUE is the half that was broken').toBe('life')
  })
})
