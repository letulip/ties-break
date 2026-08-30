// =================================================================================================
// ⭐⭐⭐ ROUND 26 #6 – THE COLLEGE LEAGUE, ON A MOUNTED SHELL, OVER A WALKED COLLEGE CAREER
// =================================================================================================
//
// The owner, and he had asked once already: «За первый год в колледже турнир был, но опять сообщили
// только постфактум, в чем проблема использовать наш флоу турниров полностью и дать возможность
// игроку их смотреть и сопереживать? Я уже просил это сделать».
//
// ⚠⚠ THE CLAIM THIS FILE HAS TO MAKE IS «HE CAN REACH IT», AND ONLY A MOUNT CAN MAKE IT. Round 25
// answered the same item with a summary line and replay buttons on a card, and every source pin over
// that was green: the matches were real, the seeds were stored, `MatchReplay` was wired. What was
// never asserted is the thing he actually complained about – that on his screen, in the middle of a
// college year, the tournament TAKES OVER and he watches it. So every case below mounts the whole
// App over a career walked to the fork, answered «college» and pressed through to the championship
// week, and asks the DOM.
//
// ⚠ AND THE HARD HALF IS ROUND 24'S LAW. `resumeFromCollege` REFUSES to spend a year over an open
// reveal – the refusal that stopped a career ticking four years into an empty world – so a reveal
// raised INSIDE the freeze is only allowed to exist if it can be answered on the live Home shell.
// The first case is that proof: the takeover is in the DOM, the college bar has stood down, and the
// global week bar's resume press is on screen. If any one of those three were false the career would
// stand in front of a question with no way to answer it, which is worse than the item.
import { describe, it, expect, beforeEach, vi } from 'vitest'

// ⚠ A RUNNER-SIZED CEILING, the same arithmetic `round24-college-shell.test.ts` states: every case
// here mounts the whole App over a career walked ~115 weeks to the fork and through the college
// latch, then presses a year. 30 s is ~20x the solo cost, so it can only fire on a genuine wedge.
vi.setConfig({ testTimeout: 30_000 })
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
import TournamentFlow from '../../src/components/TournamentFlow.vue'
import { useGameStore } from '../../src/stores/game'
import {
  answerFork,
  chooseGift,
  closeTournament,
  callUpRevealOpen,
  collegeLeagueRevealOpen,
  createWorld,
  measureCollegeOffer,
  pendingBirthday,
  resumeFromCollege,
  revealTournamentRound,
  skipTournament,
  tickWeek,
  toSnapshot,
  type WorldState,
} from '../../src/engine/world'
import { COLLEGE_LEAGUE } from '../../src/engine/collegeLeague'
import { resumeMain, type Rng } from '../../src/engine/rng'
import { WEEKS_PER_YEAR } from '../../src/engine/season/calendar'
import { PHONE, setViewport } from './fits'
import { DEFAULT_PROFILE } from '../../src/shared/protocol'
import { formatShortName } from '../../src/shared/format'

// ⚠ THIS RUNNER HAS NO localStorage AND THE SHELL READS IT. Same shim as round19-wrapup /
// round24-college-shell – supply the browser's object, do not weaken the app.
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

/** A career that really played to the fork and really answered «college» – never a hand-built
 *  snapshot. `round24-college-shell.test.ts`'s own opener, including its one thumb on the scale. */
function atCollege(seed: string): { world: WorldState; rng: Rng } {
  const world = createWorld(seed, { ...DEFAULT_PROFILE })
  const rng = resumeMain(world.rngMain)
  for (let i = 0; i < 60; i++) {
    tickWeek(world, rng)
    finishAnyReveal(world)
  }
  world.fundsCents = 500_000_00
  world.fork = { askedWeek: world.week, answer: null, offer: measureCollegeOffer(world) }
  answerFork(world, 'college')
  for (let i = 0; i < WEEKS_PER_YEAR + 2 && world.ending === null; i++) {
    tickWeek(world, rng)
    finishAnyReveal(world)
  }
  expect(world.ending?.type, 'the departure really latched the college ending').toBe('college')
  return { world, rng }
}

/** Press the Home shell's college button until the championship's reveal is standing open, answering
 *  her birthday on the way. ⚠ THROWS rather than returning quietly, so no case below can go green
 *  against a career that never reached a championship. */
function walkToTheChampionship(seed: string): { world: WorldState; rng: Rng } {
  const { world, rng } = atCollege(seed)
  for (let press = 0; press < 4; press++) {
    resumeFromCollege(world, rng)
    if (collegeLeagueRevealOpen(world)) return { world, rng }
    // ⚠ ROUND 27 #6: the tie pauses the year too, so the walk has to be able to step past one on the
    // way to a championship. `skipTournament`/`closeTournament` dispatch at whichever is open.
    if (callUpRevealOpen(world)) {
      skipTournament(world)
      closeTournament(world)
    }
    if (pendingBirthday(world) !== null) chooseGift(world, 'day')
    if (world.ending?.type !== 'college') break
  }
  throw new Error('the walked career never reached a championship')
}

/** Mount the shell on a world, past the splash. */
async function openShell(world: WorldState) {
  const game = useGameStore()
  vi.spyOn(game, 'init').mockResolvedValue(undefined)
  game.$patch({ ready: true, phase: 'ready' })
  // Assigned, never `$patch`ed – `$patch` deep-merges and these cases care about absent keys.
  game.snapshot = toSnapshot(world)
  // ⚠ ATTACHED TO THE DOCUMENT, because the phone measurement reads the REAL cascade through
  // `getComputedStyle` – detached, the overlay's `position` comes back empty and it is vacuous.
  const w = mount(App, { attachTo: document.body, global: { stubs: { teleport: true } } })
  w.findComponent(SplashScreen).vm.$emit('done')
  await flushPromises()
  return { w, game }
}

describe('⭐⭐⭐ #6 – the championship takes the screen, on the live college shell', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    backing.clear()
    document.body.innerHTML = ''
  })

  it('⭐⭐⭐ the walked career stops ON the fixture and the TOURNAMENT FLOW is what he is looking at', async () => {
    const { world } = walkToTheChampionship('r26c-flow-a')
    // Not vacuous: the world really is mid-freeze, on the championship week, with a reveal open.
    expect(world.ending?.type, 'the college latch is on').toBe('college')
    expect(world.week % WEEKS_PER_YEAR, 'and this is the fixture week').toBe(COLLEGE_LEAGUE.seasonWeek)
    expect(world.college!.leagueReveal, 'with a reveal standing open').not.toBeNull()

    const { w, game } = await openShell(world)
    expect(game.snapshot?.pending, 'the reveal reached the snapshot').toBeTruthy()
    expect(w.findComponent(EndingScreen).exists(), 'no album – college runs on the shell').toBe(false)
    expect(w.findComponent(HomeScreen).exists(), 'the tab shell is underneath').toBe(true)
    // ⭐⭐⭐ THE ITEM: the tour's own overlay, mounted over a college week.
    const flow = w.findComponent(TournamentFlow)
    expect(flow.exists(), 'the tournament flow is on screen, not a summary line').toBe(true)
    // ...and it is the CHAMPIONSHIP, named by the engine and not by the template.
    expect(w.text(), 'the fixture names itself').toContain(COLLEGE_LEAGUE.label)
    // The brief, not a mid-run resume: nothing has been revealed yet, so he starts at the splash.
    expect(w.find('.tf-facts').exists(), 'the pre-tournament brief, exactly as a tour event gets').toBe(true)
    w.unmount()
  })

  it('⭐⭐⭐ ...and the year cannot be spent past it: the college bar stands down, the resume press stands up', async () => {
    // ⚠⚠ THIS IS ROUND 24's LAW HELD FROM THE UI SIDE. `resumeFromCollege` refuses over an open
    // reveal, so the screen must not offer a press that can only be refused – and it must offer the
    // one control that CLEARS the state. Both halves, in one DOM.
    const { world } = walkToTheChampionship('r26c-flow-b')
    const { w } = await openShell(world)
    expect(w.findAll('.college-answer'), 'no press that can only be refused').toHaveLength(0)
    expect(w.find('.next-week-btn').exists(), 'and the global bar IS drawn – the way out of the reveal').toBe(true)
    w.unmount()
  })

  it('⭐⭐ answered, the shell comes straight back: the college bar returns and the flow is gone', async () => {
    const { world } = walkToTheChampionship('r26c-flow-c')
    const { w, game } = await openShell(world)
    expect(w.findComponent(TournamentFlow).exists()).toBe(true)

    // «Skip all rounds» then the finale's «Continue» – through the engine, as the buttons do.
    skipTournament(world)
    closeTournament(world)
    game.snapshot = toSnapshot(world)
    await flushPromises()

    expect(w.findComponent(TournamentFlow).exists(), 'the takeover comes down').toBe(false)
    expect(w.findComponent(HomeScreen).exists(), 'the college week is a week again').toBe(true)
    expect(w.findAll('.college-answer').length, 'and the year can be finished').toBeGreaterThan(0)
    w.unmount()
  })

  it('⭐⭐ the flow`s own controls drive it – Begin, then a round, then the finale', async () => {
    const { world } = walkToTheChampionship('r26c-flow-d')
    const { w, game } = await openShell(world)

    // ⚠ THE COMMANDS ARE THE TOUR'S, WHICH IS THE ITEM'S OWN WORDING («полностью»). The store action
    // the flow calls is `tournamentReveal`, the same one a tour reveal uses; it is stubbed here to
    // run the ENGINE command and re-publish, which is exactly what the worker does.
    const drive = (fn: (wld: WorldState) => void) => async () => {
      fn(world)
      game.snapshot = toSnapshot(world)
      await flushPromises()
    }
    vi.spyOn(game, 'tournamentReveal').mockImplementation(drive(revealTournamentRound))
    vi.spyOn(game, 'tournamentSkip').mockImplementation(drive(skipTournament))
    vi.spyOn(game, 'tournamentClose').mockImplementation(drive(closeTournament))

    // E – the brief. «Begin» opens the pre-match card.
    const begin = w.findAll('button').find((b) => b.text().trim() === 'Begin')
    expect(begin, 'the brief`s own CTA').toBeTruthy()
    await begin!.trigger('click')
    await flushPromises()
    expect(w.find('.tf-actions').exists(), 'the pre-match card, with its two controls').toBe(true)

    // «Skip all rounds» from the exit slot – the flow's own way to the finale.
    const skipAll = w.findAll('button').find((b) => b.text().includes('Skip all rounds'))
    expect(skipAll, 'the takeover offers the walk AND the shortcut, exactly as a tour event does').toBeTruthy()
    await skipAll!.trigger('click')
    await flushPromises()
    expect(game.snapshot?.pending?.finished, 'the finale').toBe(true)
    expect(w.find('.tf-poster').exists(), 'and it is a poster, not a sentence').toBe(true)

    // The finale's Continue closes the reveal and hands the week back.
    const cont = w.findAll('button').find((b) => b.text().trim() === 'Continue')
    expect(cont).toBeTruthy()
    await cont!.trigger('click')
    await flushPromises()
    expect(world.college!.leagueReveal, 'answered, through the engine').toBeNull()
    expect(w.findComponent(TournamentFlow).exists()).toBe(false)
    w.unmount()
  })

  it('⚠⚠ the amateur line survives being playable: no points, no cheque, no cup, no withdrawal', async () => {
    // Round 25's ruling, and it is what keeps the fork a real choice. The poster prints two figures
    // on the tour and neither may appear here; the withdrawal link has no command behind it.
    const { world } = walkToTheChampionship('r26c-flow-e')
    const { w, game } = await openShell(world)

    expect(game.snapshot!.pending!.tier, 'no rung: the discriminator itself').toBeNull()
    expect(game.snapshot!.pending!.points, 'no points on the view').toBe(0)
    // The brief's four facts become three, and the two money cells read as dashes.
    expect(w.text(), 'no ranking points anywhere on the brief').not.toMatch(/\+\d+ pts/)
    expect(w.find('.tf-skip-entry').exists(), 'nothing to withdraw from – she entered nothing').toBe(false)
    expect(w.findAll('.tf-fact').length, 'the crowd cell is absent, not dashed – we model no student gate').toBe(3)

    w.unmount()

    // ⚠ THE FINALE IS A SECOND MOUNT AND NOT A PATCH, because `TournamentFlow` picks its opening
    // phase ONCE at setup (`if (pending.finished) phase = 'finale'`) – which is the same code path a
    // reload mid-celebration takes. Patching the snapshot under a live splash would leave the flow on
    // the brief and the case would assert about a card that is not on screen.
    skipTournament(world)
    const second = await openShell(world)
    expect(second.w.find('.tf-poster').exists(), 'the finale is up').toBe(true)
    expect(second.w.find('.tf-poster-points').exists(), 'and it prints no points at all').toBe(false)
    expect(second.w.find('.tf-poster-mark').exists(), 'and hangs no cup – nothing entered her cabinet').toBe(false)
    second.w.unmount()
  })

  it('⚠ AND ITS EXIT IS ON A PHONE – a BLOCKING takeover whose Continue is unreachable strands a career', async () => {
    // Round 20 #3's rule, aimed at the shape this surface actually is. `TournamentFlow` is not a
    // `dialog-card`: it is the app's TAKEOVER (`position: fixed; inset: 0`) whose body is a real
    // scrollport, which is what makes a control at the foot of a tall poster reachable at all. This
    // reveal BLOCKS a college year, so both halves are asserted at 375x667 – the takeover is the
    // bounded scroller it claims to be, and the one control that clears the reveal is in the DOM
    // inside it. ⚠ Verified by mutation, arm 6 at the foot of this file.
    setViewport(PHONE)
    const { world } = walkToTheChampionship('r26c-flow-f')
    skipTournament(world)
    const { w } = await openShell(world)
    expect(w.find('.tf-poster').exists(), 'the tallest state of this overlay').toBe(true)
    const shell = w.find('.tournament-flow')
    expect(shell.exists(), 'the takeover vocabulary, not a dialog card').toBe(true)
    expect(getComputedStyle(shell.element).position, 'pinned to the viewport').toBe('fixed')
    const body = shell.element.querySelector('.tf-body')
    expect(body, 'the takeover has its scrolling body (.tf-body)').not.toBeNull()
    expect(getComputedStyle(body as Element).overflowY, 'and it really scrolls, so nothing is lost past the fold').toBe(
      'auto',
    )
    const cont = w.findAll('button').find((b) => b.text().trim() === 'Continue')
    expect(cont, 'the one control that clears the reveal is inside it').toBeTruthy()
    expect(shell.element.contains(cont!.element)).toBe(true)
    w.unmount()
  })
})

describe('⭐⭐⭐ #7 – and the replay is still there afterwards, in the feed he looked in', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    backing.clear()
    document.body.innerHTML = ''
  })

  it('⭐⭐⭐ a championship match is a WATCHABLE row in Home`s news feed, long after the week', async () => {
    // ⚠⚠ THE ROUTE WAS ALWAYS THERE AND THE ROWS HAD FALLEN OUT OF IT. `HomeScreen`'s feed opens any
    // row with a `match` on it in `MatchReplay`; what failed on his save is that `snapshot.events` is
    // a trailing sixty-row window and the tour writes ten times more rows a week than a college year
    // does, so by week 502 the window began at week 493. The kept match rows are pinned into the
    // window now – this is that, asked of the DOM rather than of the engine.
    const { world, rng } = walkToTheChampionship('r26c-feed-a')
    skipTournament(world)
    closeTournament(world)
    // Finish the degree and then play on, exactly as he did.
    for (let press = 0; press < 24 && world.ending?.type === 'college'; press++) {
      resumeFromCollege(world, rng)
      if (collegeLeagueRevealOpen(world)) {
        skipTournament(world)
        closeTournament(world)
      }
      if (pendingBirthday(world) !== null) chooseGift(world, 'day')
    }
    for (let i = 0; i < 60; i++) {
      tickWeek(world, rng)
      finishAnyReveal(world)
    }

    const game = useGameStore()
    game.snapshot = toSnapshot(world)

    // The defect, reproduced first: the plain trailing window really has lost them by now.
    const collegeRows = world.events.filter((e) => e.match?.eventId.startsWith('college-w'))
    expect(collegeRows.length, 'four years of championships really happened').toBeGreaterThanOrEqual(4)
    // ⚠⚠ RE-AIMED BY ROUND 29 #12, AND ONLY THE PRECONDITION MOVED – the claim under test did not.
    // This read `.toBe(0)`, i.e. «a bare sixty-row tail holds NONE of them». Removing the automatic
    // interest made this fixture's family poorer, so it enters fewer tour events, so fewer rows are
    // written a week, so the same sixty-row tail now reaches further back and still holds two of
    // them. That is the career moving under the fixture, not the feed changing: the DEFECT this arm
    // exists to reproduce is that a plain trailing window LOSES championship rows, and the honest
    // form of that is «the window holds strictly fewer than all of them». ⚠ Stated as an inequality
    // against the real total rather than as a literal, so it cannot go stale the next time the
    // economy moves, and it still cannot pass vacuously: if the window ever held every one of them
    // the pinning below would be proving nothing and this line would be red.
    const inBareTail = world.events.slice(-60).filter((e) => e.match?.eventId.startsWith('college-w')).length
    expect(
      inBareTail,
      'a bare sixty-row tail really does lose some of them – the w502 defect',
    ).toBeLessThan(collegeRows.length)

    const w = mount(HomeScreen, { props: { recapFresh: false }, global: { stubs: { teleport: true } } })
    const rows = w.findAll('.news-match-btn')
    expect(rows.length, 'the feed has watchable matches at all').toBeGreaterThan(0)
    // ⚠ THE ROW NAMES THE PLAYERS, NOT THE COMPETITION (`nm-players` is «her vs the opponent»), so
    // the row is identified by the woman she played – off the FROZEN record, which is the only thing
    // that ties a DOM row back to a particular championship match.
    const oppNames = new Set(collegeRows.map((e) => formatShortName(e.match!.oppName)))
    const college = rows.filter((r) => [...oppNames].some((n) => r.text().includes(n)))
    expect(college.length, 'and the championship`s are among them, four years later').toBeGreaterThan(0)

    // ⚠ AND THE ROW REALLY OPENS THE VIEWER, which is the half a source pin cannot make.
    await college[0].trigger('click')
    await flushPromises()
    expect(w.findAll('.tournament-flow').length, 'the replay takeover is on screen').toBeGreaterThan(0)
    w.unmount()
  })
})

// =================================================================================================
// ⭐⭐⭐ ROUND 27 #4 – «PROFESSIONAL RANKING» OVER A MATCH THAT AWARDS NOTHING
// =================================================================================================
//
// The owner, 27.08: «на экране итогов матча the College League написано Professional ranking – как
// будто нет».
//
// ⚠ IT LIVES IN THIS FILE RATHER THAN A ROUND-27 ONE BECAUSE THE HARNESS IS THE CLAIM. Reaching the
// box score takes a career walked to the fork, answered «college», pressed to a championship week
// and driven through the takeover's own controls – `walkToTheChampionship` + `openShell` above – and
// a second copy of that setup is a second thing to keep in step with the engine. The item is round
// 27's; the surface is round 26's.
//
// ⚠⚠ AND THE BOX SCORE IS WHY THIS IS A MOUNT AND NOT A VIEW ASSERTION. `pending.ladder === null` is
// pinned on the engine in tests/college-league.test.ts; what THAT cannot say is that the screen
// reads it. The shipped defect was precisely a screen that had an amateur branch on ONE of its two
// ranking lines – so the engine was asserted, the splash was asserted, and the line he was actually
// looking at was covered by neither.
describe('⭐⭐⭐ ROUND 27 #4 – the box score names no table when the fixture is played in none', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    backing.clear()
    document.body.innerHTML = ''
  })

  /** The subtitle under the Win/Loss badge – «her vs the opponent», plus the table on a tour event. */
  function boxScoreLine(w: ReturnType<typeof mount>) {
    return w.findAll('.tf-card p.hint').find((p) => p.text().includes(' vs '))
  }

  it('⭐⭐⭐ ...and the mutation proof: put a table back on the view and the line comes back', async () => {
    const { world } = walkToTheChampionship('r27-flow-ladder')
    const { w, game } = await openShell(world)

    // Begin -> the pre-match card -> «Skip», which reveals the round and flips to the box score.
    // The reveal command is the tour's own, driven through the ENGINE exactly as case #6/4 does.
    const drive = (fn: (wld: WorldState) => void) => async () => {
      fn(world)
      game.snapshot = toSnapshot(world)
      await flushPromises()
    }
    vi.spyOn(game, 'tournamentReveal').mockImplementation(drive(revealTournamentRound))
    const begin = w.findAll('button').find((b) => b.text().trim() === 'Begin')
    expect(begin, 'the brief`s own CTA').toBeTruthy()
    await begin!.trigger('click')
    await flushPromises()
    const skip = w.findAll('button').find((b) => b.text().trim() === 'Skip')
    expect(skip, 'the pre-match card`s own skip').toBeTruthy()
    await skip!.trigger('click')
    await flushPromises()

    // Not vacuous: the post-match box score really is the screen being read.
    expect(w.find('.tf-result-head').exists(), 'the box score is on screen').toBe(true)
    const line = boxScoreLine(w)
    expect(line, 'and it carries its own subtitle').toBeTruthy()

    // ⭐⭐⭐ THE ITEM. No table is named, because the fixture is played in none.
    expect(line!.text(), 'the two names, and nothing about a table').not.toMatch(/ranking/i)
    expect(w.text(), 'and the word he read is nowhere on the screen').not.toContain('Professional')

    // ⚠⚠ THE PROOF THAT THE ASSERTION ABOVE CAN FAIL, and it is the shipped defect itself: the view
    // used to carry `ladder: 'wta'`. Put that back and the line states «Professional ranking» again.
    // A test that cannot go red on the broken version is not this test.
    const snap = game.snapshot!
    game.snapshot = { ...snap, pending: { ...snap.pending!, ladder: 'wta' } }
    await flushPromises()
    expect(boxScoreLine(w)!.text(), 'the defect, reproduced through the one field that caused it').toContain(
      'Professional ranking',
    )
    w.unmount()
  })
})

// =================================================================================================
// ⚠⚠ MUTATION ARMS – run by hand before believing any of the above (CLAUDE.md: "mutate the thing you
// think you are covering and watch it fail").
//
//   1. `src/engine/world.ts`, `resumeFromCollege`: delete `if (pauseHere) break`.
//      -> every case in the first describe goes red at `walkToTheChampionship`'s own throw ("the
//         walked career never reached a championship"), because the year runs to its end again.
//         THIS IS THE ITEM'S OWN DEFECT, and the helper refusing to return quietly is what makes it
//         a red test rather than four vacuous greens.
//   2. `src/engine/world/snapshot.ts`, `pendingView`: drop the `if (!p) return collegeLeaguePendingView(world)`
//      line. -> case 1 goes red on «the reveal reached the snapshot»: the engine still stops the
//         year, and the player is standing in front of a pause with no takeover over it.
//   3. `src/components/screens/HomeScreen.vue`: drop `&& !game.snapshot?.pending` from `.college-bar`.
//      -> case 2 goes red on «no press that can only be refused».
//   4. `src/components/TournamentFlow.vue`: make `amateur` always false.
//      -> the amateur case goes red on the withdrawal link, the fact count and the poster's cup.
//   5. `src/engine/world/snapshot.ts`, `snapshotEvents`: restore `world.events.slice(-SNAPSHOT_EVENTS)`.
//      -> the #7 case goes red on «the championship`s are among them, four years later», with zero
//         college rows in the feed – which is exactly the state his w502 save was in.
//   6. `src/style.css`: change `.tf-body`'s `overflow-y` to `visible`.
//      -> the phone case goes red on «and it really scrolls», which is the half that keeps the
//         finale's Continue reachable when the poster grows by one line.
//   7. ROUND 27 #4: `src/engine/world/snapshot.ts`, `collegeLeaguePendingView`: set `ladder: 'wta'`
//      again (the shipped value). -> the round-27 case goes red on «the two names, and nothing about
//      a table», with «Professional ranking» in the box score's subtitle. ⚠ Its SECOND arm is the
//      same mutation applied to the view in-test, so this one runs on every green run rather than
//      by hand – but the source mutation is what proves the engine half.
// =================================================================================================
