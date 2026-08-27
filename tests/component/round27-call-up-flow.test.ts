// =================================================================================================
// ⭐⭐⭐ ROUND 27 #6 – THE NATIONS CUP TIE, ON A MOUNTED SHELL, OVER A WALKED COLLEGE CAREER
// =================================================================================================
//
// The owner, having watched round 26 do this for the College League one file away: «И опять на те же
// грабли: "Her country called this year…" во всплывашке сверху и матчи только постфактум … проводить
// этот турнир по обычному флоу турнира. А этот попап не нужен для этого флоу вообще.»
//
// ⚠⚠ THE CLAIM THIS FILE HAS TO MAKE IS ABOUT WHAT IS ON HIS SCREEN, and only a mount can make it.
// The engine suite next door proves the week pauses, the letter is posted and the view is built; what
// it cannot prove is that the takeover is in the DOM, that the sentence under the VS panel is the
// SQUAD's and not the student field's, and that a week which is three ties is not described as an
// eight-player draw. Those are the two lies this item could have shipped instead of the one it fixed.
//
// ⚠ THE SECOND HALF IS ROUND 24'S LAW, HELD FROM THE UI SIDE. `resumeFromCollege` REFUSES to spend a
// year over an open reveal, so a reveal raised inside the freeze may only exist if it can be answered
// on the live Home shell: the takeover in the DOM, the college bar stood down, and the global week
// bar's resume press on screen. If any of the three were false the career would stand in front of a
// question with no way out.
import { describe, it, expect, beforeEach, vi } from 'vitest'

// ⚠ A RUNNER-SIZED CEILING, the same arithmetic `round26-college-flow.test.ts` states: every case
// here mounts the whole App over a career walked ~115 weeks to the fork and then pressed through
// college years to a tie. 40 s is well over the solo cost, so it can only fire on a genuine wedge.
vi.setConfig({ testTimeout: 40_000 })
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
import { NATIONAL_TEAM, NATIONS_CUP_AWARDS_NOTHING } from '../../src/engine/nationalTeam'
import { COLLEGE_LEAGUE } from '../../src/engine/collegeLeague'
import { ENDINGS } from '../../src/engine/ending'
import { resumeMain, type Rng } from '../../src/engine/rng'
import { WEEKS_PER_YEAR } from '../../src/engine/season/calendar'
import { DEFAULT_PROFILE, LADDER_LABEL } from '../../src/shared/protocol'

// ⚠ THIS RUNNER HAS NO localStorage AND THE SHELL READS IT. Same shim as round26-college-flow –
// supply the browser's object, do not weaken the app.
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
 *  snapshot. `round26-college-flow.test.ts`'s own opener, including its one thumb on the scale. */
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

/** Press the Home shell's college button until a Nations Cup tie is standing open, answering the
 *  championship and her birthday on the way. ⚠ THROWS rather than returning quietly, so no case
 *  below can go green against a career whose country never wrote. */
let lastStops: string[] = []
function walkToTheTie(seed: string): WorldState {
  const { world, rng } = atCollege(seed)
  for (let press = 0; press < 5 * ENDINGS.collegeYears; press++) {
    lastStops = resumeFromCollege(world, rng)
    if (callUpRevealOpen(world)) return world
    skipTournament(world)
    closeTournament(world)
    if (pendingBirthday(world) !== null) chooseGift(world, 'day')
    if (world.ending?.type !== 'college') break
  }
  throw new Error('the walked career never reached a Nations Cup tie')
}

/** Mount the shell on a world, past the splash. */
async function openShell(world: WorldState) {
  const game = useGameStore()
  vi.spyOn(game, 'init').mockResolvedValue(undefined)
  game.$patch({ ready: true, phase: 'ready' })
  // Assigned, never `$patch`ed – `$patch` deep-merges and these cases care about absent keys.
  // ⚠ THE PRESS'S OWN STOP REASONS RIDE ALONG, because the toast case is about what the shell does
  // WITH them: a snapshot built without them would show no toast for the trivial reason that it was
  // handed none, which is exactly the vacuous pass that case exists to avoid.
  game.snapshot = toSnapshot(world, lastStops as Parameters<typeof toSnapshot>[1])
  const w = mount(App, { attachTo: document.body, global: { stubs: { teleport: true } } })
  w.findComponent(SplashScreen).vm.$emit('done')
  await flushPromises()
  return { w, game }
}

describe('⭐⭐⭐ #6 – the tie takes the screen, on the live college shell', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    backing.clear()
    document.body.innerHTML = ''
  })

  it('⭐⭐⭐ the walked career stops ON the tie week and the TOURNAMENT FLOW is what he is looking at', async () => {
    const world = walkToTheTie('r27c-flow-a')
    // Not vacuous: the world really is mid-freeze, on the tie week, with a reveal open.
    expect(world.ending?.type, 'the college latch is on').toBe('college')
    expect(world.week % WEEKS_PER_YEAR, 'and this is the tie week').toBe(NATIONAL_TEAM.seasonWeek)
    expect(world.college!.callUpReveal, 'with a reveal standing open').not.toBeNull()

    const { w, game } = await openShell(world)
    expect(game.snapshot?.pending, 'the reveal reached the snapshot').toBeTruthy()
    expect(w.findComponent(EndingScreen).exists(), 'no album – college runs on the shell').toBe(false)
    expect(w.findComponent(HomeScreen).exists(), 'the tab shell is underneath').toBe(true)
    // ⭐⭐⭐ THE ITEM: the tour's own overlay, mounted over a week that used to arrive as a toast.
    expect(w.findComponent(TournamentFlow).exists(), 'the tournament flow is on screen, not a popup').toBe(true)
    expect(w.text(), 'and the fixture names itself').toContain(NATIONAL_TEAM.label)
    expect(w.find('.tf-facts').exists(), 'the pre-tournament brief, exactly as a tour event gets').toBe(true)
    w.unmount()
  })

  it('⭐⭐⭐ the sentence under the VS panel is the SQUAD`s, and the student field`s is nowhere on it', async () => {
    // ⚠⚠ THIS IS §4's LANDMINE, MEASURED IN THE DOM. The splash's `v-else` used to read «a student
    // field awards neither» for every fixture with no ladder – true of the College League, false of a
    // national squad. Moving the tie onto this screen without its own words would have replaced one
    // lie with another, which is why the sentence now comes off the engine.
    const world = walkToTheTie('r27c-flow-b')
    const { w } = await openShell(world)
    const line = w.find('.tf-first-ladder')
    expect(line.exists(), 'the line is drawn').toBe(true)
    expect(line.text(), 'the squad`s own clause').toBe(NATIONS_CUP_AWARDS_NOTHING)
    // ⚠ ASKED OF THE FLOW'S OWN DOM AND NOT OF `w.text()`. The shell is still mounted UNDERNEATH the
    // takeover, and its feed legitimately carries the College League's row – «a student field awards
    // neither», about a fixture that really is one. A page-wide ban would fail on a true sentence
    // about a different competition, which is the opposite of what this case is protecting.
    const flow = w.findComponent(TournamentFlow).text()
    expect(flow, 'and not the student field`s').not.toContain('student field')
    // ⭐⭐⭐ AND §4's OWN ITEM, HELD ON THE SECOND FIXTURE: no table is named over a week played in none.
    for (const label of Object.values(LADDER_LABEL)) {
      expect(flow, `«${label} ranking» must not stand over a fixture that awards nothing`).not.toContain(
        `${label} ranking`,
      )
    }
    w.unmount()
  })

  it('⭐⭐⭐ three ties are not an eight-player draw, and there is no title to price', async () => {
    // ⚠⚠ THE SCREEN-SIDE LANDMINE, MEASURED. `amateur ? COLLEGE_LEAGUE.drawSize : tier.drawSize` was
    // the College League's constant standing in for a whole class, and it type-checks for ever: this
    // week would have been introduced as an «8-player draw», its rubbers labelled «Quarterfinal», and
    // the coach would have promised «Three wins for the title» in a competition she cannot win.
    const world = walkToTheTie('r27c-flow-c')
    const { w } = await openShell(world)
    // ⚠ SCOPED TO THE FLOW for the reason the case above states: the shell underneath legitimately
    // prints «Quarterfinal» about the College League, whose draw really has one.
    const flow = w.findComponent(TournamentFlow).text()
    expect(w.find('.tf-draw').exists(), 'no draw line, because there is no draw').toBe(false)
    expect(flow).not.toContain(`${COLLEGE_LEAGUE.drawSize}-player draw`)
    expect(w.find('.tf-round').text(), 'the round is named by the record').toMatch(/^Rubber \d+ of \d+$/)
    for (const stage of ['Quarterfinal', 'Semifinal', 'Final']) {
      expect(flow, `«${stage}» is a knockout word and this week has no bracket`).not.toContain(stage)
    }
    expect(w.find('.tf-brief-line').text(), 'and the coach prices no title').not.toContain('for the title')
    w.unmount()
  })

  it('⭐⭐ answered, the shell comes straight back: the college bar returns and the flow is gone', async () => {
    const world = walkToTheTie('r27c-flow-d')
    const { w, game } = await openShell(world)
    expect(w.findComponent(TournamentFlow).exists()).toBe(true)
    // ⚠ ROUND 24's LAW FROM THE UI SIDE: no press that can only be refused, and one that clears it.
    expect(w.findAll('.college-answer'), 'no press that can only be refused').toHaveLength(0)
    expect(w.find('.next-week-btn').exists(), 'and the global bar IS drawn – the way out of the reveal').toBe(true)

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

  it('⭐⭐⭐ the college button NAMES the tie before it plays it – round 27 #2`s law, third stop', async () => {
    // ⚠⚠ ROUND 27 #2's PREDICATE CARRIED A ⚠⚠ THAT THIS WAVE TRIGGERED: «IF A THIRD MID-YEAR STOP IS
    // EVER ADDED TO THAT LOOP, IT HAS TO BE ADDED HERE TOO, or this button starts promising a
    // tournament that a new pause arrives in front of.» Without the fix this button would have read
    // «Finish the year» and the press would have played the Nations Cup – his own item, one fixture
    // along. Walked to the rest state BEFORE a tie and read off the DOM.
    const { world, rng } = atCollege('r27c-label')
    let reached = false
    for (let press = 0; press < 5 * ENDINGS.collegeYears && world.ending?.type === 'college'; press++) {
      if (toSnapshot(world).ending?.college?.callUpIsNextStop) {
        reached = true
        break
      }
      lastStops = resumeFromCollege(world, rng)
      skipTournament(world)
      closeTournament(world)
      if (pendingBirthday(world) !== null) chooseGift(world, 'day')
    }
    expect(reached, 'the walk really reached a rest state with a tie ahead of it').toBe(true)

    const { w } = await openShell(world)
    const answers = w.findAll('.college-answer')
    expect(answers.length, 'the college bar is drawn – no reveal is open yet').toBeGreaterThan(0)
    expect(answers[0].text(), 'and it names the fixture the press plays').toBe(`Play ${NATIONAL_TEAM.label}`)
    expect(answers[0].text(), 'never a year it is not going to finish').not.toContain('Finish the year')
    w.unmount()
  })

  it('⭐⭐⭐ no toast: the week that used to be a popup is a screen now', async () => {
    // ⚠ THE STOP REASON IS STILL REPORTED – `resumeFromCollege` adds 'call-up' – so this is the
    // R10-16 rule doing its work rather than a reason being suppressed: no copy, no toast.
    const world = walkToTheTie('r27c-flow-e')
    const { w, game } = await openShell(world)
    expect(game.snapshot?.stopReasons, 'the week really did report itself').toContain('call-up')
    expect(w.text(), 'and nothing on screen retells it after the fact').not.toContain('Her country called this year')
    expect(w.find('.stop-toast').exists(), 'no stop toast at all on this week').toBe(false)
    w.unmount()
  })
})
