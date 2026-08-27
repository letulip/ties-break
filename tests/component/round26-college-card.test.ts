// =================================================================================================
// ⭐⭐⭐ ROUND 26 #13 / #12 / #11 / #8 – THE COLLEGE CARD SAYS WHICH YEAR IT IS, AND THE TWO ANSWERS
// CAN BE SEEN
// =================================================================================================
//
// Four of the owner's lines, and three of them are one defect:
//   #13 «Мне кажется мы что-то напутали с годами колледжа, проверь пожалуйста»
//   #12 «на Year 4 of 4 меня всё ещё две кнопки Another year и Back on tour, хотя вроде бы колледж всё»
//   #11 «На 4й год увидел только одну запись Quarterfinal lost watch… это настолько неявно и не очевидно»
//   #8  «Another year и Back on tour поменять местами и сделать цветом, сейчас их вообще не видно»
//
// ⚠⚠ #13 IS NOT AN ENGINE DEFECT AND THIS FILE'S FIRST DESCRIBE IS THE PROOF. His save reads
// `college.fromWeek 294`, `untilWeek 502`, `doneWeek 502`, four years banked – 208 weeks, exactly
// 4.00 years. The walked career below reproduces that arithmetic from a different enrolment week
// (86 -> 294, the same 208), visits four rest states, and comes out the other side with the latch
// off. THE CLOCK IS RIGHT. What was wrong is what the card DID with it:
//
//   `Year ${Math.min(c.yearsDone + 1, c.totalYears)} of ${c.totalYears}`
//
// which named the year AHEAD over a report of the year BEHIND, and clamped – so «three banked» and
// «four banked» printed the same four words. The clamp was also DEAD: `collegeProgressOf` returns
// null the moment `doneWeek` is set, so the card is never on screen with four years banked. Both
// halves are measured here, and the second one is measured on a real career rather than argued from
// the source, because "this state cannot happen" is exactly the claim a source pin cannot make.
//
// ⚠ A RUNNER-SIZED CEILING, AND THE ARITHMETIC IS ROUND 24's, RE-MEASURED FOR THIS FILE. The heavy
// shape here is the walk: ~114 ticks to the college departure plus four years of 52 weeks, mounted
// on the whole Home page. Measured alone on a quiet machine the slowest case is 2.1 s; the component
// project runs its files in parallel and the documented slow-machine signature is the same case
// crossing vitest's 5 s default with zero assertion failures. 30 s is ~14x the solo cost, so it can
// only fire on a genuine wedge. ⚠ If a case here ever takes tens of seconds ALONE, that is a real
// regression and this ceiling must not be raised to hide it.
import { describe, it, expect, beforeEach, vi } from 'vitest'
vi.setConfig({ testTimeout: 30_000 })
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import HomeScreen from '../../src/components/screens/HomeScreen.vue'
// ⚠ THE REAL STYLESHEET, or every colour measured below reads an empty cascade and passes vacuously.
import '../../src/style.css'
import { useGameStore } from '../../src/stores/game'
import { ENDINGS } from '../../src/engine/ending'
import { WEEKS_PER_YEAR } from '../../src/engine/season/calendar'
import { COLLEGE_LEAGUE } from '../../src/engine/collegeLeague'
import { setViewport, PHONE } from './fits'
import { parseColor, contrastRatio, effectiveBackground, effectiveColor } from './contrast'
import {
  answerFork,
  chooseGift,
  closeTournament,
  createWorld,
  measureCollegeOffer,
  pendingBirthday,
  resumeFromCollege,
  callUpRevealOpen,
  collegeLeagueRevealOpen,
  skipTournament,
  revealTournamentRound,
  tickWeek,
  toSnapshot,
  type WorldState,
} from '../../src/engine/world'
import { resumeMain, type Rng } from '../../src/engine/rng'
import { DEFAULT_PROFILE, type CollegeProgressView, type CollegeYear, type Snapshot } from '../../src/shared/protocol'

// ⚠ THIS RUNNER HAS NO localStorage AND `HomeScreen` READS IT. The same shim `college-second-act`,
// `home-strip-and-mail` and `round24-coach-card` carry, for the reason quoted there in full: the
// correct production fallback ("claim nothing" on a throw) would make this screen untestable by
// accident. The runner gets an object; the code is not weakened to suit it.
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

// =================================================================================================
// THE FIXTURES – a real career underneath, one field swapped
// =================================================================================================
//
// ⚠ THE PROGRESS VIEW IS A FIXTURE AND THE CAREER IS NOT, which is `college-second-act.test.ts`'s
// own split and its reasoning: the OUTCOMES in `CollegeProgressView` are rolls, so a test that
// waited for the RNG to produce a quarterfinal exit would be a test that runs sometimes. Everything
// under it – the page, the cascade, the week – is a career that was really played to the fork.

function collegeYear(over: Partial<CollegeYear> = {}): CollegeYear {
  return {
    index: 1,
    fromWeek: 281,
    untilWeek: 333,
    startSkill: 58.6,
    endSkill: 58.9,
    startRank: null,
    endRank: null,
    fundsDeltaCents: -3_806_075,
    callUp: null,
    // The championship is on the calendar of EVERY college year, so a default of `null` would be a
    // fixture pinning a year the engine cannot produce (the argument `collegeView` has made four
    // times already, one door along). Two wins in three rounds is the final, lost.
    league: { week: 293, roundsWon: 2, rounds: 3 },
    ...over,
  }
}

function collegeView(over: Partial<CollegeProgressView> = {}): CollegeProgressView {
  return {
    yearsDone: 1,
    totalYears: ENDINGS.collegeYears,
    last: collegeYear(),
    final: false,
    billPerYearCents: 8_673_00,
    tier: 'state',
    rubbers: [],
    league: { week: 293, roundsWon: 2, rounds: 3 },
    leagueMatches: [],
    yearInProgress: false,
    // ⚠ ROUND 27 #2 – A NEW FIELD, AND `false` IS A CLAIM RATHER THAN A FILLER. `leagueIsNextStop`
    // is «the next press ends at the student championship», and the cases below are about the four
    // labels that count YEARS, so every one of them is a rest state whose press does not play a
    // fixture. The fifth label has its own case, over a WALKED career, in this file's round-27
    // describe – a fabricated `true` here would pin a string, not a state.
    leagueIsNextStop: false,
    ...over,
  }
}

/** A view at a rest state with `done` years banked, self-consistently – the banked row carries its
 *  OWN index, because the card reads it off the row and a fixture whose row said «1» under a heading
 *  saying «three spent» would be measuring a state the engine cannot bank. */
function atYear(done: number, over: Partial<CollegeProgressView> = {}): CollegeProgressView {
  return collegeView({
    yearsDone: done,
    last: done === 0 ? null : collegeYear({ index: done }),
    final: done + 1 >= ENDINGS.collegeYears,
    league: done === 0 ? null : { week: 293, roundsWon: 2, rounds: 3 },
    ...over,
  })
}

function finishAnyReveal(world: WorldState): void {
  for (let i = 0; i < 40 && world.pendingTournament && !world.pendingTournament.finished; i++) {
    revealTournamentRound(world)
  }
  if (world.pendingTournament) closeTournament(world)
}

/** ⭐⭐⭐ A CAREER THAT WAS REALLY PLAYED TO THE FORK AND REALLY ANSWERED «college» – the same walk
 *  `round24-college-shell.test.ts` and `college-freeze.test.ts` use, including its one thumb on the
 *  scale: four years is 208 weeks of base costs and a career that went bankrupt inside them would be
 *  measuring the family budget instead of the card. */
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
  for (let i = 0; i < 54 && world.ending === null; i++) {
    tickWeek(world, rng)
    finishAnyReveal(world)
  }
  expect(world.ending?.type, 'the departure really latched the college ending').toBe('college')
  return { world, rng }
}

let walked: Snapshot | null = null

/** ⚠ ADDED AT THE ROUND-26 COLLECT. This file was written on a branch where a college year paused
 *  only for her birthday. Another branch of the SAME round taught the year to pause for the
 *  championship too (#6 – the owner's «сообщили только постфактум»), and a walk that answers one
 *  pause but not the other stalls on the first league week: these cases read ZERO banked years
 *  where four are lived. The player answers it with «Skip all rounds» then «Continue», which is
 *  what these two commands are. */
/** ⭐⭐⭐ ROUND 27 #6 RE-AIM – IT ANSWERS THE NATIONS CUP TIE TOO, AND IT IS NOT A WEAKENING.
 *  ⚠ IT USED TO CLAIM: «a college year has exactly one pause the flow owns – the championship»
 *  (`answerLeagueReveal`, round 26 #6). That is why it read `collegeLeagueRevealOpen` alone.
 *  ⚠ WHY IT MOVED: the call-up used to resolve inside the tick and report itself in a toast – the
 *  owner's «матчи только постфактум». It now pauses the year and is walked in `TournamentFlow` like
 *  the championship, so a walk that answered only one of the two would hang on the other. The
 *  predicate is widened and the name says what it covers; the ASSERTIONS below are untouched, and
 *  `skipTournament` / `closeTournament` are still the player's own two presses. */
function answerCollegeReveal(world: WorldState): void {
  if (!collegeLeagueRevealOpen(world) && !callUpRevealOpen(world)) return
  skipTournament(world)
  closeTournament(world)
}

/** The base snapshot every fixture case is mounted over: a real career, one year into college. */
function walkedCollegeSnapshot(): Snapshot {
  if (walked) return walked
  const { world, rng } = atCollege('r26-card-base')
  resumeFromCollege(world, rng)
  answerCollegeReveal(world)
  if (pendingBirthday(world) !== null) chooseGift(world, 'day')
  const snap = toSnapshot(world)
  if (snap.ending === null || snap.ending.ending.type !== 'college' || snap.ending.college === null) {
    throw new Error('the walked career is not at college – the fixture under every case below is wrong')
  }
  walked = snap
  return snap
}

async function openCollegeHome(college: CollegeProgressView | null) {
  setViewport(PHONE)
  const base = walkedCollegeSnapshot()
  const game = useGameStore()
  game.$patch({ snapshot: { ...base, ending: { ...base.ending!, college } } as Snapshot })
  return mount(HomeScreen, {
    props: { recapFresh: false },
    attachTo: document.body,
    global: { stubs: { teleport: true } },
  })
}

/** Home over a REAL snapshot, with nothing swapped – for the states the engine itself produces. */
async function openWorld(world: WorldState) {
  setViewport(PHONE)
  const game = useGameStore()
  game.$patch({ snapshot: toSnapshot(world) as Snapshot })
  return mount(HomeScreen, {
    props: { recapFresh: false },
    attachTo: document.body,
    global: { stubs: { teleport: true } },
  })
}

// =================================================================================================
// ⭐⭐⭐ #13 – THE CLOCK IS RIGHT, AND THE CARD IS WHAT WAS WRONG
// =================================================================================================

describe('⭐⭐⭐ #13 – four years is four years, and the fourth is the last', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    document.body.innerHTML = ''
  })

  it('⭐⭐⭐ a walked career banks exactly four years over exactly four years of weeks', async () => {
    const { world, rng } = atCollege('r26-clock')
    const fromWeek = world.college!.fromWeek
    const untilWeek = world.college!.untilWeek
    // The owner's save: 294 -> 502. This career: a different enrolment week, the identical span.
    expect(untilWeek - fromWeek, 'the course is four years of weeks and nothing else').toBe(
      ENDINGS.collegeYears * WEEKS_PER_YEAR,
    )

    // Every rest state the player can be in, recorded as the engine leaves it. Each year takes two
    // presses because her birthday pauses it (round 24) – the loop answers the cake and presses on.
    // ⚠ ROUND 27 #6: and up to four, because the year now holds three questions – the championship,
    // the Nations Cup tie and the cake. The BUDGET moved from three presses a year to five; the
    // assertions below are untouched and still measure four banked years over 208 weeks.
    const rest: { yearsDone: number; latched: boolean }[] = []
    for (let press = 0; press < 5 * ENDINGS.collegeYears && world.ending?.type === 'college'; press++) {
      resumeFromCollege(world, rng)
      answerCollegeReveal(world)
      if (pendingBirthday(world) !== null) chooseGift(world, 'day')
      const view = toSnapshot(world).ending?.college ?? null
      rest.push({ yearsDone: view?.yearsDone ?? world.college!.years.length, latched: view !== null })
    }

    expect(world.college!.years, 'four years lived').toHaveLength(ENDINGS.collegeYears)
    expect(world.week - fromWeek, 'and 208 weeks spent living them').toBe(ENDINGS.collegeYears * WEEKS_PER_YEAR)
    expect(world.college!.doneWeek, 'the course closes on the week it said it would').toBe(untilWeek)

    // ⚠⚠ THE CLAIM #13's FIX RESTS ON: the card is NEVER on screen with four years banked. Every
    // latched rest state has strictly fewer, and the one state with four has no progress view at all.
    for (const state of rest) {
      if (state.latched) {
        expect(state.yearsDone, 'a latched rest state always has a year still to spend').toBeLessThan(
          ENDINGS.collegeYears,
        )
      }
    }
    const last = rest[rest.length - 1]
    expect(last.yearsDone, 'the last press is the fourth year').toBe(ENDINGS.collegeYears)
    expect(last.latched, 'and it hands to the graduation dialog, not back to the card').toBe(false)
    expect(world.ending, 'the latch is off for good').toBeNull()

    // ...and the screen agrees: no card, no bar, on the real snapshot with nothing swapped.
    world.knock = null // the input-free walk's own artefact – see round24-college-shell's note
    const w = await openWorld(world)
    expect(w.find('.college-year').exists(), 'the card is not drawn on a graduated career').toBe(false)
    expect(w.find('.college-bar').exists(), 'and neither are the two answers').toBe(false)
    // ⚠ THE OTHER HALF – the floating week button coming back – is App.vue's bar and not this
    // screen's, so it is asserted where it lives: round24-college-shell.test.ts mounts the shell for
    // exactly that. Asserting it here would be asserting a control HomeScreen does not draw.
    w.unmount()
  })

  it('⚠ the engine refuses a fifth year, so the button that offered one was offering a throw', () => {
    const { world, rng } = atCollege('r26-fifth')
    for (let press = 0; press < 3 * ENDINGS.collegeYears && world.ending?.type === 'college'; press++) {
      resumeFromCollege(world, rng)
      answerCollegeReveal(world)
      if (pendingBirthday(world) !== null) chooseGift(world, 'day')
    }
    expect(world.college!.years).toHaveLength(ENDINGS.collegeYears)
    // The refusal is the engine's, at its own entry, and it is a THROW rather than a no-op – which
    // is why a UI that could reach it would be a control whose only outcome is an exception.
    expect(() => resumeFromCollege(world, rng)).toThrow('She is not at college')
  })
})

// =================================================================================================
// ⭐⭐⭐ #13 – THE TWO STATES NO LONGER PRINT THE SAME WORDS
// =================================================================================================

describe('⭐⭐⭐ #13 – the heading is a different sentence in every state', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    document.body.innerHTML = ''
  })

  async function headingAt(view: CollegeProgressView): Promise<string> {
    const w = await openCollegeHome(view)
    const text = w.find('.college-heading').text()
    w.unmount()
    return text
  }

  it('⭐⭐⭐ THE MUTATION PROOF: the shipped formula collides at 3 and 4, and this one does not', async () => {
    // The exact expression that shipped, written out so the collision is visible rather than
    // described: `Math.min(yearsDone + 1, totalYears)`. It is the only arm that matters for #13,
    // because the defect was never a wrong number – it was two states with one sentence.
    const shipped = (done: number) => `Year ${Math.min(done + 1, ENDINGS.collegeYears)} of ${ENDINGS.collegeYears}`
    expect(shipped(3), 'the defect, reproduced').toBe(shipped(4))

    const three = await headingAt(atYear(3))
    const four = await headingAt(atYear(ENDINGS.collegeYears))
    expect(three, 'in year four, three banked').not.toBe(four)
    expect(three).toContain('3 spent')
    expect(four).toBe(`All ${ENDINGS.collegeYears} years spent`)
    // ⚠ AND THE OWNER'S OWN STRING IS STILL THERE IN THE STATE HE WAS ACTUALLY IN, because the
    // heading must remain the one he can recognise from his screenshot – what changed is that it no
    // longer stops there.
    expect(three).toContain(`Year 4 of ${ENDINGS.collegeYears}`)
    expect(four, 'and the finished state does not borrow it').not.toContain('Year 4 of 4 is next')
  })

  it('⭐ every rest state says what it is – next, under way, or finished', async () => {
    expect(await headingAt(atYear(0))).toBe('Year 1 of 4 is next – none spent')
    expect(await headingAt(atYear(1))).toBe('Year 2 of 4 is next – 1 spent')
    expect(await headingAt(atYear(3))).toBe('Year 4 of 4 is next – 3 spent')
    // ⭐ ROUND 24's BIRTHDAY PAUSE. The year is half-run, the bottom control says «Finish the year»,
    // and a heading calling it NEXT would part from that button by one press.
    expect(await headingAt(atYear(3, { yearInProgress: true }))).toBe('Year 4 of 4 under way – 3 spent')
    // ⚠ FOUR STATES, FOUR SENTENCES – counted, because "each one says something" was true of the
    // version this item exists to fix.
    const all = [
      await headingAt(atYear(0)),
      await headingAt(atYear(1)),
      await headingAt(atYear(2)),
      await headingAt(atYear(3)),
      await headingAt(atYear(3, { yearInProgress: true })),
      await headingAt(atYear(ENDINGS.collegeYears)),
    ]
    expect(new Set(all).size, 'no two states share a sentence').toBe(all.length)
  })
})

// =================================================================================================
// ⭐⭐⭐ #12 – THE LAST YEAR IS OFFERED AS THE LAST YEAR
// =================================================================================================

describe('⭐⭐⭐ #12 – no press offers a fifth year', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    document.body.innerHTML = ''
  })

  async function answersAt(view: CollegeProgressView): Promise<string[]> {
    const w = await openCollegeHome(view)
    const labels = w.findAll('.college-answer').map((n) => n.text())
    w.unmount()
    return labels
  }

  it('⭐⭐⭐ the fourth year is «Play the final year», and «Another year» is gone from the screen', async () => {
    const w = await openCollegeHome(atYear(3))
    const labels = w.findAll('.college-answer').map((n) => n.text())
    expect(labels, '#8: the leave answer first, and the year named as the last one').toEqual([
      'Back on tour now',
      'Play the final year',
    ])
    // ⚠ THE WHOLE SCREEN, not just the bar – the card used to price «Student tennis again» beside a
    // button that promised more of the same.
    expect(w.text(), 'nothing on this screen offers one more of a series').not.toContain('Another year')
    w.unmount()
  })

  it('⭐⭐ THE MUTATION PROOF: the label discriminates, so no constant can satisfy both ends', async () => {
    // A test that cannot fail on the broken version is not this test. The version that shipped was a
    // CONSTANT for every year past the first – «Another year» – and the two assertions below cannot
    // both hold for any constant: the year before last must say it, the last must not.
    expect(await answersAt(atYear(2)), 'with two years left it really is another one').toEqual([
      'Back on tour now',
      'Another year',
    ])
    expect(await answersAt(atYear(3))).toEqual(['Back on tour now', 'Play the final year'])
  })

  it('⚠ the first year and the paused year keep their own words', async () => {
    // The leave answer is absent before the first year is spent, because `endCollegeEarly` throws on
    // a career with no banked year – the screen agreeing with the engine's rule, not being it.
    expect(await answersAt(atYear(0))).toEqual(['Play the first year'])
    expect(await answersAt(atYear(3, { yearInProgress: true }))).toEqual(['Finish the year'])
  })

  it('⚠⚠ THE TRIPWIRE: with four years banked the bar stands down entirely', async () => {
    // ⚠ THIS STATE CANNOT BE REACHED TODAY and the first describe in this file is what proves it –
    // `collegeProgressOf` returns null the moment `doneWeek` is set, so a graduated career has no
    // progress view to mount. It is asserted here through a hand-built view precisely because it is
    // unreachable: this is a tripwire for the next wave, not a gate on a live path. Both commands
    // behind this bar refuse there with «She is not at college», and the screen that belongs to the
    // state is `CollegeDoneDialog`.
    const w = await openCollegeHome(atYear(ENDINGS.collegeYears))
    expect(w.find('.college-year').exists(), 'the card is still mounted – this arm is not vacuous').toBe(true)
    expect(w.findAll('.college-answer'), 'and there is no press that can only be refused').toHaveLength(0)
    expect(w.find('.college-bar').exists()).toBe(false)
    w.unmount()
  })
})

// =================================================================================================
// ⭐⭐⭐ ROUND 27 #2 – THE FIFTH LABEL, ON THE PRESS THAT PLAYS A TOURNAMENT
// =================================================================================================
//
// The owner, 27.08: «в интерфейсе колледжа появляется кнопка "Продолжить год", а при нажатии мы
// попадаем в "the College League" – как будто можно тоже наш флоу использовать с неймингом кнопки –
// Play College Open или вроде того, а уже потом "Закончить год"?»
//
// ⚠ TWO ADJACENT REAL STATES AND NOT A FABRICATED VIEW, which is the difference between this case
// and every other label case in this file. The four labels above count YEARS, so a hand-built
// `CollegeProgressView` is the honest fixture for them. The fifth names what a PRESS DOES, and the
// only thing that can prove it lands on the right press is a career that presses.
describe('⭐⭐⭐ ROUND 27 #2 – the button names the championship, and only while it is ahead', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    document.body.innerHTML = ''
  })

  it('⭐⭐⭐ THE PAIR: «Play the College League» before the fixture, «Finish the year» after it', async () => {
    const { world, rng } = atCollege('r27-label-pair')

    // BEFORE. The first rest state of the first year: the press ahead ends at the championship, and
    // the button says so instead of offering a year.
    expect(
      toSnapshot(world).ending?.college?.leagueIsNextStop,
      'this career really is standing in front of its championship – otherwise the case is vacuous',
    ).toBe(true)
    const before = await openWorld(world)
    expect(
      before.findAll('.college-answer').map((n) => n.text()),
      'the fixture names itself, and there is no leave answer with no year banked',
    ).toEqual([`Play ${COLLEGE_LEAGUE.label}`])
    before.unmount()

    // ...the press really does play it, through the engine, exactly as the button's click does.
    resumeFromCollege(world, rng)
    expect(collegeLeagueRevealOpen(world), 'the press ended at the championship').toBe(true)
    skipTournament(world)
    closeTournament(world)

    // AFTER. Same year, same rest state shape, and the championship is behind her – so the button
    // goes back to naming the year. ⚠ THIS IS THE MUTATION PROOF: no constant satisfies both ends,
    // and a predicate that merely asked «does this year hold a championship» would say the fixture's
    // name here too, over a fixture that has already been played.
    const after = await openWorld(world)
    expect(after.findAll('.college-answer').map((n) => n.text()), 'his own «а уже потом Закончить год»').toEqual([
      'Finish the year',
    ])
    expect(after.text(), 'and nothing on the screen still offers the tournament').not.toContain(
      `Play ${COLLEGE_LEAGUE.label}`,
    )
    after.unmount()
  })
})

// =================================================================================================
// ⭐⭐ #11 – THE YEAR'S RESULT IS LEGIBLE, AND IT SAYS WHICH YEAR IT WAS
// =================================================================================================

describe('⭐⭐ #11 – the year that closed is named, and its competition is a fact', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    document.body.innerHTML = ''
  })

  it('⭐⭐ the report is headed with the year it reports, which is NOT the year in the heading', async () => {
    const w = await openCollegeHome(atYear(3))
    expect(w.find('.college-report-head').text(), 'the banked row is year three').toBe('Year 3, as it happened')
    expect(w.find('.college-heading').text(), 'and the heading is about the fourth').toContain('Year 4 of 4')
    // ⚠ THE MUTATION ARM IS THE PAIR ITSELF: a head that echoed the heading's year, or a heading that
    // echoed the report's, would make these two equal – which is the state the owner read as «Year 4
    // of 4 held one match».
    expect(w.find('.college-report-head').text()).not.toContain('Year 4')
    w.unmount()
  })

  it('⭐⭐ the championship result is a FACT beside the money and the rank, not a line of prose', async () => {
    const w = await openCollegeHome(atYear(3))
    const fact = w.find('.college-fact-wide')
    expect(fact.exists(), 'the year had a tournament and the card says so where facts are said').toBe(true)
    expect(fact.find('dt').text()).toBe(COLLEGE_LEAGUE.label)
    expect(fact.find('dd').text(), 'two wins of three rounds is the final, lost').toBe('Final')
    // ⚠ AND IT IS A FACT AND NOT A VERDICT (ruling 4, §6: the game does not grade her).
    expect(fact.text().toLowerCase()).not.toMatch(/unlucky|deserved|brave|sadly|at least|should|only/)
    w.unmount()
  })

  it('⭐ THE MUTATION PROOF: the value moves with the run, so a constant fails one end', async () => {
    const out = await openCollegeHome(atYear(3, { league: { week: 293, roundsWon: 0, rounds: 3 } }))
    expect(out.find('.college-fact-wide dd').text(), 'out in the first round of a draw of eight').toBe('Quarterfinal')
    out.unmount()
    const won = await openCollegeHome(atYear(3, { league: { week: 293, roundsWon: 3, rounds: 3 } }))
    expect(won.find('.college-fact-wide dd').text(), 'and a title is stated the same way').toBe('Won it')
    won.unmount()
  })

  it('⚠ a year with no championship on record draws no fact and no head it cannot fill', async () => {
    const w = await openCollegeHome(atYear(3, { league: null }))
    expect(w.find('.college-fact-wide').exists(), 'nothing is invented where there is no run').toBe(false)
    expect(w.find('.college-facts').exists(), 'and the rest of the facts are untouched').toBe(true)
    w.unmount()
    // Before the first year there is no report at all, so there is no head either.
    const first = await openCollegeHome(atYear(0))
    expect(first.find('.college-report-head').exists()).toBe(false)
    expect(first.find('.college-facts').exists()).toBe(false)
    first.unmount()
  })

  it('⚠ NO CYRILLIC AND NO LONG DASH reaches the screen (CLAUDE.md Style, asserted)', async () => {
    const w = await openCollegeHome(atYear(3))
    const text = `${w.find('.college-year').text()} ${w.find('.college-bar').text()}`
    expect(text).not.toMatch(/[Ѐ-ӿ]/)
    expect(text).not.toContain('—')
    w.unmount()
  })
})

// =================================================================================================
// ⭐⭐⭐ #8 – «их вообще не видно», AS A NUMBER
// =================================================================================================
//
// ⚠ THE EVIDENCE IS A RATIO COMPUTED FROM THE REAL CASCADE, not a hex read out of the stylesheet and
// not a screenshot. Three of them, because the control has three surfaces that can fail separately –
// and the one that was fine is the reason nothing caught this: the LABEL always measured 16.6:1.
// What the player cannot see is the CONTROL, which WCAG 2.1 measures under 1.4.11 (non-text
// contrast, 3:1 for the visual boundary of a user-interface component).

/** The colour an element's border actually paints, composited over its own fill, over the page. */
function edgeOnPage(el: Element, page: [number, number, number]): number {
  const cs = getComputedStyle(el)
  const surface = over(parseColor(cs.backgroundColor), page)
  return contrastRatio(over(parseColor(cs.borderTopColor), surface), page)
}

function over(fg: [number, number, number, number], bg: [number, number, number]): [number, number, number] {
  const a = fg[3]
  return [fg[0] * a + bg[0] * (1 - a), fg[1] * a + bg[1] * (1 - a), fg[2] * a + bg[2] * (1 - a)]
}

describe('⭐⭐⭐ #8 – the two answers can be seen, and the measurement can fail', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    document.body.innerHTML = ''
  })

  it('⭐⭐⭐ the boundary clears WCAG 1.4.11, and the label was never the problem', async () => {
    const w = await openCollegeHome(atYear(1))
    // ⚠ IT REFUSES TO RUN BLIND, exactly as `assertLegible` does: with no stylesheet in the document
    // every element computes to its initial values and this whole describe passes on anything.
    expect(document.head.querySelector('style'), 'no stylesheet – the measurement would be vacuous').toBeTruthy()
    const page = effectiveBackground(w.find('.college-bar').element)
    const answers = w.findAll('.college-answer')
    expect(answers, 'two answers to measure').toHaveLength(2)
    for (const a of answers) {
      const el = a.element
      const surface = over(parseColor(getComputedStyle(el).backgroundColor), page)
      const label = contrastRatio(over(effectiveColor(el), surface), surface)
      const edge = edgeOnPage(el, page)
      expect(label, `«${a.text()}» label on its own fill: ${label.toFixed(2)}:1`).toBeGreaterThanOrEqual(4.5)
      expect(
        edge,
        `«${a.text()}» edge on the page: ${edge.toFixed(2)}:1 – WCAG 1.4.11 asks 3:1 of a control's boundary`,
      ).toBeGreaterThanOrEqual(3)
    }
    w.unmount()
  })

  it('⭐⭐ THE MUTATION PROOF: put the old hairline back and the same assertion goes red', async () => {
    // A test that cannot fail on the broken version is not this test. `var(--line)` –
    // rgba(255,255,255,0.07) – is what shipped, and it measured 1.29:1 against the page: the whole
    // of «тёмно синие на тёмно синем». This is the exact edit a future wave makes by "tidying the
    // border back to the app's hairline".
    const w = await openCollegeHome(atYear(1))
    const page = effectiveBackground(w.find('.college-bar').element)
    const el = w.findAll('.college-answer')[0].element as HTMLElement
    expect(edgeOnPage(el, page), 'green before the mutation').toBeGreaterThanOrEqual(3)
    el.style.borderColor = 'rgba(255, 255, 255, 0.07)'
    const after = edgeOnPage(el, page)
    expect(after, `the shipped hairline measures ${after.toFixed(2)}:1`).toBeLessThan(1.5)
    w.unmount()
  })

  it('⚠ AND THE FILL IS NOT WHAT WAS FIXED, which is the honest half of the report', async () => {
    // Against `--bg` (#0a0e13) no dark neutral this app owns can reach 3:1 – a surface would need
    // luminance 0.112, about #6a737c. `--panel` measures 1.07:1 and stays; the boundary is what
    // carries the control. Asserting the number keeps the claim honest rather than quietly implying
    // the whole button now stands out.
    const w = await openCollegeHome(atYear(1))
    const page = effectiveBackground(w.find('.college-bar').element)
    const el = w.findAll('.college-answer')[0].element
    const surface = over(parseColor(getComputedStyle(el).backgroundColor), page)
    const ratio = contrastRatio(surface, page)
    expect(ratio, `the fill measures ${ratio.toFixed(2)}:1 and that is not where the fix is`).toBeLessThan(1.5)
    w.unmount()
  })

  it('⭐ both answers wear ONE class and the same one – equal weight is not the same claim as invisible', async () => {
    // Ruling 4 (30.07) still stands: neither answer may be the page's CTA. What #8 changes is the
    // pair's visibility, identically, so the ruling is checked again rather than assumed.
    const w = await openCollegeHome(atYear(1))
    const answers = w.findAll('.college-answer')
    for (const a of answers) {
      expect([...a.element.classList].sort(), 'one class, and the same one').toEqual(['college-answer'])
    }
    const first = getComputedStyle(answers[0].element)
    const second = getComputedStyle(answers[1].element)
    expect(first.borderTopColor, 'the same edge on both').toBe(second.borderTopColor)
    expect(first.backgroundColor, 'and the same fill').toBe(second.backgroundColor)
    expect(w.find('.college-bar .next-week-btn').exists(), 'no CTA among the answers').toBe(false)
    expect(w.find('.college-bar .tb-pill--cta').exists()).toBe(false)
    w.unmount()
  })
})
