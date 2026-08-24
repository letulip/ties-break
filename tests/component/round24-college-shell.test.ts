// =================================================================================================
// ⭐⭐⭐ ROUND 24 #2b / #3 / #4 – COLLEGE RUNS ON THE HOME SHELL, AND A REAL ENDING STILL DOES NOT
// =================================================================================================
//
// The owner, 20.08, three complaints that are one item:
//   #2b «После выбора колледжа показывают фотоальбом как будто карьера закончилась»
//   #3  «Весь флоу колледжа перенести на домашний экран… или отдельный параллельный полноэкранный»
//   #4  «После выпуска экран graduated, потом домашний экран»
//
// ⚠⚠ #2b WAS NEVER A BUG – IT IS THE ARCHITECTURE SHOWING THROUGH, and that is what makes this file
// necessary rather than obvious. College is implemented as an ENDING that can be resumed
// (`world.ending.type === 'college'`, and `resumeFromCollege` is the one command in the game that
// CLEARS an ending), so `blockingOverlay` answered 'ending' and the epilogue was CORRECTLY what
// rendered. The change is one predicate in App.vue (`showCollege`) and nothing in the engine.
//
// ⚠ SO THE REGRESSION THAT WOULD MATTER MOST IS THE ONE NOBODY ASKED FOR: a real ending losing its
// album. All five of the others – 'stopped', 'natural', 'plateau', 'bankruptcy' and 'injury' –
// genuinely ARE the end of the story. The third describe below is that guard, over the whole union
// minus 'college', and it is mutation-verified at the foot of the file: the arm that breaks it is
// exactly "route every ending to Home", which is the shortest way to write this feature wrong.
//
// ⚠ AND THE SHELL IS MOUNTED, NOT PINNED. `round19-wrapup` established that App.vue mounts here. The
// claim is "this takeover is NOT in the DOM while that state is", and only a mount can make it – a
// source pin goes green on a gate that reads the right field and renders anyway.
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'

// The shell imports the service-worker registration and the component project resolves no virtual
// module for it – the same mock round19-wrapup.test.ts installs, for the same reason.
vi.mock('../../src/pwa', async () => {
  const { ref } = await import('vue')
  return { needRefresh: ref(false), applyUpdate: () => {}, UPDATE_CHECK_MS: 3600_000 }
})

import '../../src/style.css'
import App from '../../src/App.vue'
import SplashScreen from '../../src/components/SplashScreen.vue'
import EndingScreen from '../../src/components/EndingScreen.vue'
import HomeScreen from '../../src/components/screens/HomeScreen.vue'
import CollegeYearCard from '../../src/components/CollegeYearCard.vue'
import CollegeDoneDialog from '../../src/components/CollegeDoneDialog.vue'
import { useGameStore } from '../../src/stores/game'
import {
  answerFork,
  chooseGift,
  closeTournament,
  createWorld,
  endCollegeEarly,
  measureCollegeOffer,
  pendingBirthday,
  resumeFromCollege,
  revealTournamentRound,
  tickWeek,
  toSnapshot,
  type WorldState,
} from '../../src/engine/world'
import { resumeMain, type Rng } from '../../src/engine/rng'
import { ENDINGS } from '../../src/engine/ending'
import { assertDismissReachable, PHONE, setViewport } from './fits'
import { DEFAULT_PROFILE, type CareerEnding } from '../../src/shared/protocol'

// ⚠ THIS RUNNER HAS NO localStorage, AND THE GRADUATION CARD'S WATERMARK IS localStorage. Same shim
// as round19-wrapup / round21-popup-order – supply the browser's object, do not weaken the app.
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

/** ⭐⭐⭐ A CAREER THAT WAS REALLY PLAYED TO THE FORK AND REALLY ANSWERED «college» – not a hand-built
 *  snapshot. `tickWeek` is total (only `advanceWeeks` halts), so the loop closes any reveal it
 *  produces and keeps going, exactly as `tests/college-freeze.test.ts` walks one. */
function atCollege(seed: string): { world: WorldState; rng: Rng } {
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
  // ⚠ ROUND 24 #5: the answer reserves – the walk to the September departure is what latches the
  // college ending now (the gap semantics are pinned in tests/college-departure.test.ts).
  for (let i = 0; i < 54 && world.ending === null; i++) {
    tickWeek(world, rng)
    finishAnyReveal(world)
  }
  expect(world.ending?.type, 'the departure really latched the college ending').toBe('college')
  return { world, rng }
}

/** Mount the shell on a world, past the splash. */
async function openShell(world: WorldState) {
  const game = useGameStore()
  vi.spyOn(game, 'init').mockResolvedValue(undefined)
  game.$patch({ ready: true, phase: 'ready' })
  // Assigned, never `$patch`ed – `$patch` deep-merges and these cases care about absent keys.
  game.snapshot = toSnapshot(world)
  // ⚠ ATTACHED TO THE DOCUMENT, because the phone measurement below reads the REAL cascade through
  // `getComputedStyle` – detached, the overlay's `position` comes back empty and the assertion is
  // vacuous rather than green.
  const w = mount(App, { attachTo: document.body, global: { stubs: { teleport: true } } })
  w.findComponent(SplashScreen).vm.$emit('done')
  await flushPromises()
  return { w, game }
}

describe('⭐⭐⭐ #2b/#3 – a college week is a WEEK, on the Home shell', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    backing.clear()
    document.body.innerHTML = ''
  })

  it('⭐⭐⭐ the epilogue does NOT take the screen, and Home does', async () => {
    const { world } = atCollege('r24-shell-a')
    const { w, game } = await openShell(world)

    // Neither half of this is vacuous: the latch really is on, and it really is the college one.
    expect(game.snapshot?.ending, 'the ending really is latched').toBeTruthy()
    expect(game.snapshot?.ending?.ending.type).toBe('college')
    expect(w.findComponent(EndingScreen).exists(), 'no album in the middle of the story').toBe(false)
    expect(w.findComponent(HomeScreen).exists(), 'the tab shell is what she gets').toBe(true)
    expect(w.findComponent(CollegeYearCard).exists(), 'and the week is her college year').toBe(true)
    w.unmount()
  })

  it('⭐ the week, the calendar and the answers are all on it', async () => {
    const { world } = atCollege('r24-shell-b')
    const { w } = await openShell(world)
    // THE WEEK – Home's own date line, the one an ordinary season has.
    expect(w.find('.diary-hero').exists()).toBe(true)
    expect(w.find('.diary-date').exists() || w.find('.diary-head').exists()).toBe(true)
    // ITS CALENDAR – the engine's marked weeks of the year ahead.
    expect(w.findAll('.college-calendar li').length, 'a college year is not an empty year').toBeGreaterThan(0)
    // THE BOTTOM CONTROL – and the ordinary week button has stood down, because `advanceWeeks`
    // refuses to tick behind an ending and a control that cannot work is R10-16's own bug.
    expect(w.findAll('.college-answer').length).toBeGreaterThan(0)
    expect(w.find('.next-week-btn').exists(), 'the advance button cannot work here and is not drawn').toBe(false)
    w.unmount()
  })

  it('⚠⚠ over an OPEN REVEAL the answers stand down and the resume button is the way out', async () => {
    // Round 24 rule 2 (B1): `resumeFromCollege` REFUSES to spend a year while a tournament is still
    // waiting to be resolved – the refusal that closes a whole class of silent, total failure. It
    // must not be routed around, so the UI answers it from its own side: the college bar is not
    // drawn, and the shell's global resume button (the ONLY control that clears the state) is.
    //
    // ⚠ AND THIS STATE HAD NO EXIT AT ALL BEFORE THIS WAVE. The epilogue covered the shell, so
    // `TournamentFlow` could not mount and the sticky bar did not exist – world.ts says as much
    // beside the throw. Moving college onto the Home shell is what gives the refusal a way out.
    // ⚠ MOUNTED ON HOME AND NOT ON THE SHELL, on purpose: `.college-bar` is HomeScreen's, and the
    // OTHER half of the sentence – the resume button being unconditional on every tab – is a
    // property of App.vue's own bar, pinned as source in tests/round13-nav.test.ts ("the RESUME arm
    // is untouched and that is load-bearing"). Mounting the shell here would drag `TournamentFlow`
    // in over a hand-built reveal, which measures the viewer rather than this rule.
    const { world } = atCollege('r24-shell-reveal')
    const game = useGameStore()
    game.snapshot = toSnapshot(world)
    const w = mount(HomeScreen, { props: { recapFresh: false }, global: { stubs: { teleport: true } } })
    expect(w.findAll('.college-answer').length, 'the answers are there with no reveal open').toBe(1)
    // The reveal, put on the snapshot the way `finalizeTournament` leaves it – on screen, unresolved.
    game.snapshot = { ...game.snapshot, pending: { eventId: 'x', finished: true } as never }
    await flushPromises()
    expect(w.findAll('.college-answer'), 'no press that can only be refused').toHaveLength(0)
    w.unmount()
  })

  it('⭐⭐ pressing an answer spends a college YEAR, through the engine\'s own command', async () => {
    const { world } = atCollege('r24-shell-c')
    const { w, game } = await openShell(world)
    const spy = vi.spyOn(game, 'resumeFromCollege').mockResolvedValue(undefined)
    await w.find('.college-answer').trigger('click')
    expect(spy, 'the bottom control is `resumeFromCollege`, not `advance`').toHaveBeenCalledTimes(1)
    w.unmount()
  })
})

describe('⭐⭐ #4 – graduation is the last college screen, and it hands back to Home', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    backing.clear()
    document.body.innerHTML = ''
  })

  /** The four years, spent one at a time exactly as the bottom control spends them.
   *
   *  ⚠ THE KNOCK IS CLEARED, AND IT IS THE SAME ARTEFACT `round19-wrapup` AND `round21-popup-order`
   *  BOTH RECORD: an input-free walk leaves a sore shoulder standing, `blockingOverlay` puts a
   *  QUESTION the sim is blocked on ahead of every report, and these cases would then be looking at
   *  `KnockDialog`. That ordering is correct and is asserted in its own right below – here it is
   *  noise, so it is removed from the fixture rather than worked around in the assertions. */
  function graduate(seed: string): WorldState {
    const { world, rng } = atCollege(seed)
    // Round 24: each year pauses on her birthday week – press, answer, press again. Answering as we
    // go is also what keeps a pending birthday from standing ahead of the graduation card below,
    // exactly as the knock line under this loop already explains for the shoulder.
    for (let press = 0; press < 3 * ENDINGS.collegeYears && world.ending?.type === 'college'; press++) {
      resumeFromCollege(world, rng)
      if (pendingBirthday(world) !== null) chooseGift(world, 'day')
    }
    expect(world.ending, 'she came out the other side – the latch is off for good').toBeNull()
    expect(world.college?.years).toHaveLength(ENDINGS.collegeYears)
    world.knock = null
    return world
  }

  it('⭐⭐⭐ the fourth year ends on a graduated card, not on nothing and not on an album', async () => {
    const world = graduate('r24-grad-a')
    const { w } = await openShell(world)
    const card = w.findComponent(CollegeDoneDialog)
    expect(card.exists(), 'four years closed with no beat at all before this').toBe(true)
    expect(card.text()).toContain('She has graduated')
    // The years, as the engine banked them – four rows, because four were lived.
    expect(card.findAll('.college-done-years li')).toHaveLength(ENDINGS.collegeYears)
    // ⚠ AND IT IS NOT THE EPILOGUE. The latch is off; the career is live again.
    expect(w.findComponent(EndingScreen).exists()).toBe(false)
    w.unmount()
  })

  it('⭐ Continue hands to Home, and the card does not come back', async () => {
    const world = graduate('r24-grad-b')
    const { w } = await openShell(world)
    await w.findComponent(CollegeDoneDialog).find('button').trigger('click')
    await flushPromises()
    expect(w.findComponent(CollegeDoneDialog).exists(), 'dismissed').toBe(false)
    expect(w.findComponent(HomeScreen).exists(), '«потом домашний экран»').toBe(true)
    // The week button is back too – she is a professional again and the week is hers to spend.
    expect(w.find('.next-week-btn').exists()).toBe(true)
    w.unmount()
  })

  it('⚠ THE EARLY RETURN GETS THE SAME CARD, because the engine has one door and it is this one', async () => {
    // `endCollegeEarly` and `finishCollege` run the SAME two lines (`leaveCollegeState` + one kept
    // milestone), so a card for only one of them would have left the other as the silent exit it was.
    const { world, rng } = atCollege('r24-grad-early')
    // Round 24: press-answer-press – the year pauses on her birthday week.
    for (let press = 0; press < 3 && world.college!.years.length === 0; press++) {
      resumeFromCollege(world, rng)
      if (pendingBirthday(world) !== null) chooseGift(world, 'day')
    }
    endCollegeEarly(world)
    world.knock = null // the walked-career artefact, see `graduate` above
    const { w } = await openShell(world)
    const card = w.findComponent(CollegeDoneDialog)
    expect(card.exists()).toBe(true)
    expect(card.text()).toContain('She has left the scholarship')
    expect(card.text(), 'and it does not claim a degree she did not take').not.toContain('graduated')
    expect(card.findAll('.college-done-years li')).toHaveLength(1)
    w.unmount()
  })

  it('⚠ it WAITS behind a question the sim is blocked on, and survives it – because it reads STATE', async () => {
    // The walked career really does come out of the freeze with a sore shoulder standing, which is
    // how this was found. `blockingOverlay` puts a QUESTION ahead of every report, so the card is
    // held – and it is not LOST, because `doneWeek === week` is state on the snapshot rather than a
    // stop reason that dies with the command that produced it. That is the round-19 #2 lesson, and
    // the graduation card is built on the right side of it.
    const world = graduate('r24-grad-waits')
    const { world: withKnock, rng } = atCollege('r24-grad-a')
    void rng
    expect(withKnock.knock, 'the fixture below needs a real knock to borrow').toBeTruthy()
    world.knock = withKnock.knock
    const { w, game } = await openShell(world)
    expect(game.snapshot?.knockPrompt, 'a question really is up – this arm is not vacuous').toBeTruthy()
    expect(w.findComponent(CollegeDoneDialog).exists(), 'the report waits for the question').toBe(false)

    // Answer it the way the engine does – the knock clears, no week is spent, and the card is the
    // next thing on screen with nothing about it re-derived.
    world.knock = null
    game.snapshot = toSnapshot(world)
    await flushPromises()
    expect(w.findComponent(CollegeDoneDialog).exists(), 'and it is still there afterwards').toBe(true)
    w.unmount()
  })

  it('⚠⚠ and its Continue is reachable on a 375x667 phone, with the measurement able to fail', async () => {
    // The round-20 #3 rule, applied to the dialog this wave adds: a blocking card with no height
    // bound puts its own exit off the bottom of a phone and stops the career there.
    setViewport(PHONE)
    const world = graduate('r24-grad-fits')
    const { w } = await openShell(world)
    const card = w.findComponent(CollegeDoneDialog).find('.dialog-card').element
    const dismiss = w.findComponent(CollegeDoneDialog).find('.college-done-actions').element
    assertDismissReachable(card, dismiss, PHONE, 'CollegeDoneDialog')
    // ⚠ THE MUTATION: take the shared height bound away – the exact shape TourBriefingDialog shipped
    // in – and the same assertion has to go red.
    ;(card as HTMLElement).style.maxHeight = 'none'
    ;(card as HTMLElement).style.overflowY = 'visible'
    expect(() => assertDismissReachable(card, dismiss, PHONE, 'CollegeDoneDialog')).toThrow()
    w.unmount()
  })
})

// =================================================================================================
// ⚠⚠ THE GUARD THAT PROTECTS WHAT THIS WAVE DID NOT INTEND TO CHANGE
// =================================================================================================
describe('⚠⚠ a REAL ending still gets the epilogue, album and all', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    backing.clear()
    document.body.innerHTML = ''
  })

  /** A played career with an ending latched onto it – the same shape `resolveEndings` produces. */
  function endedWith(seed: string, ending: CareerEnding): WorldState {
    const world = createWorld(seed, { ...DEFAULT_PROFILE })
    const rng = resumeMain(world.rngMain)
    for (let i = 0; i < 60; i++) {
      tickWeek(world, rng)
      finishAnyReveal(world)
    }
    world.ending = ending
    return world
  }

  // ⚠⚠ THE FIVE THE ENGINE CAN ACTUALLY PRODUCE, TYPED – `CareerEndingType` minus 'college'. The
  // first draft of this list carried 'retired' and 'bankrupt', which are not members of the union at
  // all: every test still went GREEN, because a takeover that renders on `ending !== null` does not
  // care what the string says. `vue-tsc` is what caught it, and it is worth recording – a guard over
  // a list of names is only as good as the names being real ones, and "it passed" was not evidence.
  const REAL_ENDINGS: CareerEnding[] = [
    // «stop» at the fork: she is not going on, and there is no next week to go back to.
    { type: 'stopped', week: 265, ageYears: 19, detail: 'She stopped at nineteen.', resumesWeek: null },
    { type: 'natural', week: 700, ageYears: 30, detail: 'She retired.', resumesWeek: null },
    { type: 'plateau', week: 600, ageYears: 27, detail: 'Three seasons flat.', resumesWeek: null },
    { type: 'bankruptcy', week: 300, ageYears: 21, detail: 'The money ran out.', resumesWeek: null },
    { type: 'injury', week: 300, ageYears: 21, detail: 'The knee did not come back.', resumesWeek: null },
  ]

  for (const ending of REAL_ENDINGS) {
    it(`⭐⭐ '${ending.type}' keeps the album and the takeover`, async () => {
      const world = endedWith(`r24-real-${ending.type}`, ending)
      const { w, game } = await openShell(world)
      expect(game.snapshot?.ending?.ending.type, 'the fixture really carries this ending').toBe(ending.type)
      expect(w.findComponent(EndingScreen).exists(), 'the epilogue is the screen').toBe(true)
      // THE ALBUM ITSELF, not merely the component: seven polaroid slots and their paging dots.
      expect(w.findAll('.album-dots i'), 'seven pages, turned one at a time').toHaveLength(7)
      expect(w.find('.album-photo').exists(), 'and a photograph on the page').toBe(true)
      // ⚠ AND THE TAB SHELL IS GONE. An epilogue that merely painted OVER Home would be the same
      // defect from the other side – the story has no next week and there is nothing behind it.
      expect(w.findComponent(HomeScreen).exists()).toBe(false)
      expect(w.findComponent(CollegeYearCard).exists()).toBe(false)
      w.unmount()
    })
  }

  it('⚠⚠ THE MUTATION PROOF: route every ending to Home and this describe goes red', async () => {
    // The shortest way to write this wave wrong is `showEnding = false` – "college is not an ending,
    // so stop rendering the epilogue". The four cases above are what stands between that and a
    // shipped build, and this arm proves they would catch it: with the epilogue absent, the album is
    // absent, and the assertion those tests make is exactly about the album.
    const world = endedWith('r24-real-mutant', REAL_ENDINGS[0])
    const { w } = await openShell(world)
    expect(w.findAll('.album-dots i')).toHaveLength(7)
    // Simulate the broken build by removing what the mutation would remove.
    w.findComponent(EndingScreen).element.remove()
    expect(document.querySelectorAll('.album-dots i')).toHaveLength(0)
    w.unmount()
  })

  it('⚠ a career-ending injury INSIDE the freeze goes to the album, not to the college card', async () => {
    // `resumeFromCollege`'s loop breaks on a fresh ending – she is playing a lot of tennis – and when
    // it does she never comes back. `collegeProgressOf` returns null the same tick (`doneWeek` is
    // set), so `showCollege` is false and the epilogue is correctly what renders. This is the case
    // that makes the split TOTAL rather than merely two-way.
    const { world } = atCollege('r24-freeze-injury')
    world.college!.doneWeek = world.week
    world.ending = { type: 'injury', week: world.week, ageYears: 20, detail: 'The knee did not come back.', resumesWeek: null }
    const { w, game } = await openShell(world)
    expect(game.snapshot?.ending?.college, 'the progress view is gone with the open question').toBeNull()
    expect(w.findComponent(EndingScreen).exists()).toBe(true)
    expect(w.findComponent(CollegeYearCard).exists()).toBe(false)
    w.unmount()
  })
})

// ⚠⚠ PROD-11's OTHER HALF – THE LABEL, NOT THE NUMBER (owner, 24.08: «две подписи по знаку»).
//
// `fundsDeltaCents` is what the BALANCE did over a college year, never what she earned. At college
// she is an amateur: no prize money, the bills unchanged – so the figure is negative in most years
// and the card printed «Banked -$3,200». The arithmetic was always right; the noun said the
// opposite of the number.
//
// ⚠ SCOPE, DELIBERATELY: the claim is presentational – «a negative figure is not called banked, and
// the sign is not printed twice» – so the subject is a mounted card over a snapshot whose banked
// row carries each sign. Driving a real college year to a bank would test the ENGINE's arithmetic,
// which `tests/college-second-act.test.ts` already owns and which was never in doubt here. The
// career underneath is still a walked one, so the card renders in its real surroundings.
//
// The tests assert the PAIRING, not the spelling: a copy edit may rename either word; what may
// never return is a negative amount under a word that promises accumulation, or a doubled sign.
describe('PROD-11 – the college year names what the balance did', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    backing.clear()
    document.body.innerHTML = ''
  })

  /** The banked row a college year leaves behind, at the sign under test. */
  const bankedYear = (fundsDeltaCents: number) => ({
    index: 1,
    fundsDeltaCents,
    startRank: 300,
    endRank: 280,
    callUp: null,
    league: null,
  })

  /** The balance row, found by its own two candidate labels rather than by position. */
  function moneyRow(w: ReturnType<typeof mount>) {
    const row = w
      .findAll('.college-facts div')
      .find((d) => /^(Spent|Banked)$/.test(d.find('dt').text().trim()))
    expect(row, 'the college facts carry a balance row').toBeTruthy()
    return { label: row!.find('dt').text().trim(), amount: row!.find('dd').text() }
  }

  async function cardWith(seed: string, fundsDeltaCents: number) {
    const { world } = atCollege(seed)
    const game = useGameStore()
    vi.spyOn(game, 'init').mockResolvedValue(undefined)
    game.$patch({ ready: true, phase: 'ready' })
    const snap = toSnapshot(world)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(snap.ending!.college as any).last = bankedYear(fundsDeltaCents)
    game.snapshot = snap
    const w = mount(App, { attachTo: document.body, global: { stubs: { teleport: true } } })
    w.findComponent(SplashScreen).vm.$emit('done')
    await flushPromises()
    return w
  }

  it('a year that COST the family is not called banked, and the sign is not doubled', async () => {
    const w = await cardWith('prod-11-negative', -3_200_00)
    const { label, amount } = moneyRow(w)
    expect(label, 'a negative year is not «banked»').toBe('Spent')
    expect(amount, 'the label carries the sign, so the amount does not repeat it').not.toContain('-')
    expect(amount).toContain('3,200')
    w.unmount()
  })

  it('a year that ADDED to the balance keeps the accumulating word', async () => {
    const w = await cardWith('prod-11-positive', 1_500_00)
    const { label, amount } = moneyRow(w)
    expect(label).toBe('Banked')
    expect(amount).toContain('1,500')
    w.unmount()
  })
})
