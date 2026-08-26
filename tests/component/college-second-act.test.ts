// ⭐⭐ P5 – THE COLLEGE YEAR, ON SCREEN: the question at each boundary, mounted.
//
// The epilogue used to carry ONE control for college – a pill reading «Four years later –» – and
// pressing it spent 208 weeks. P5 replaced that with the year just lived, stated in the engine's own
// numbers, and two answers of one weight.
//
// ⭐⭐⭐ RE-AIMED IN ROUND 24 (#2b/#3), NOT WEAKENED AND NOT DELETED. Every claim below is the claim
// it was; what moved is the SURFACE it is asked of. The owner, 20.08: «После выбора колледжа
// показывают фотоальбом как будто карьера закончилась» and «Весь флоу колледжа перенести на домашний
// экран». College is implemented as an ENDING that can be resumed, so `EndingScreen` was correctly
// what rendered – and the player was being shown the end of the story in the middle of it. The year
// block is `CollegeYearCard.vue` now, drawn by `HomeScreen`, and its two answers are the screen's
// bottom control. So this file mounts HOME.
//
// ⚠⚠ AND THE PHONE MEASUREMENT MOVED WITH IT, TO THE SHAPE THE SURFACE ACTUALLY IS. It used to
// assert that `.ending` is a full-screen SCROLLER, because that is what made two answers at the
// bottom of a long album reachable. On Home the answers are not at the bottom of anything: they are
// a FIXED bar 58px above the tab bar, which is a stronger guarantee (they cannot go below the fold
// at all) and a different failure mode – two controls in one bar can outgrow the WIDTH of a phone.
// That is what is measured, and the mutation at the foot of the file puts `.next-week-btn`'s own
// `min-width: 206px` back on them and watches the same assertion go red. A test that cannot fail on
// the broken version is not this test.
import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import HomeScreen from '../../src/components/screens/HomeScreen.vue'
// ⚠ THE REAL STYLESHEET, or every measurement below reads an empty cascade and passes vacuously.
import '../../src/style.css'
import { useGameStore } from '../../src/stores/game'
import { ENDINGS } from '../../src/engine/ending'
import { boxOf, lengthPx, setViewport, NARROW_PHONE, PHONE, type Viewport } from './fits'
import { NATIONAL_TEAM } from '../../src/engine/nationalTeam'
import {
  skipTournament,
  pendingBirthday,
  collegeLeagueRevealOpen,
  chooseGift,
  answerFork,
  closeTournament,
  createWorld,
  measureCollegeOffer,
  resumeFromCollege,
  revealTournamentRound,
  tickWeek,
  toSnapshot,
  type WorldState,
} from '../../src/engine/world'
import { resumeMain } from '../../src/engine/rng'
import { DEFAULT_PROFILE, type CollegeProgressView, type CollegeYear, type Snapshot, type WorldMatch } from '../../src/shared/protocol'
import type { MatchPlayer } from '../../src/engine/match/types'

// ⚠ THIS RUNNER HAS NO localStorage AND `HomeScreen` READS IT. The same shim `home-strip-and-mail`,
// `round20-ui` and `round24-coach-card` carry, and for the reason quoted there in full: happy-dom is
// configured here without web storage, every reader in `src/` wraps it in try/catch and answers
// "claim nothing" when it throws, so the correct production fallback would make this screen
// untestable by accident. The runner gets an object; the code is not weakened to suit it.
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

function collegeYear(over: Partial<CollegeYear> = {}): CollegeYear {
  return {
    index: 1,
    fromWeek: 281,
    untilWeek: 333,
    startSkill: 58.6,
    endSkill: 58.9,
    startRank: null,
    endRank: null,
    fundsDeltaCents: 3_806_075,
    callUp: { week: 295, rubbersPlayed: 2, rubbersWon: 1, nationFinish: 11 },
    // ⭐⭐⭐ ROUND 24 – THE ONE TOURNAMENT THE YEAR IS GUARANTEED, and the default is a REAL run for
    // the third time this fixture has had to make that argument (see `collegeView` below): the
    // championship happens in every college year, so a default of `null` would be a fixture pinning
    // a year the engine cannot produce. Week 293 is two before the call-up at 295 – the same gap the
    // engine's own `COLLEGE_LEAGUE.seasonWeek` (12) and `NATIONAL_TEAM.seasonWeek` (14) have, and it
    // is the gap the causality runs across.
    league: { week: 293, roundsWon: 2, rounds: 3 },
    ...over,
  }
}

/** ⭐⭐ THE COLLEGE WAVE – A RUBBER, AS THE ENGINE FILES IT. `seed` is what makes it replayable:
 *  `MatchReplay` re-runs `simulateMatch(a, b, {surface, tour, seed})` and reproduces the match point
 *  for point, so a fixture without one would mount a viewer with nothing to show. */
function rubberPlayer(id: string, name: string): MatchPlayer {
  return { id, name, serve: 62, ret: 60, composure: 61, stamina: 63, groundstrokes: 62, age: 21 }
}

function rubber(index: number, over: Partial<WorldMatch> = {}): WorldMatch {
  const opp = rubberPlayer(`nations-w295-r${index}`, index === 0 ? 'Petra Kovac' : 'Nina Larsson')
  return {
    round: index,
    aId: 'kid',
    bId: opp.id,
    winnerId: index === 0 ? 'kid' : opp.id,
    seed: `fixture:rubber:295:${index}`,
    score: index === 0 ? '6-4 6-3' : '3-6 4-6',
    eventId: `nations-w295-r${index}`,
    surface: 'hard',
    oppName: opp.name,
    a: rubberPlayer('kid', 'Mila Adler'),
    b: opp,
    ...over,
  }
}

/** ⭐⭐⭐ ROUND 24 – ONE MATCH OF THE STUDENT CHAMPIONSHIP, AS THE ENGINE FILES IT. The id prefix is
 *  the engine's own (`collegeLeagueMatchId` = `college-w<week>-r<round>`), because the card reads the
 *  round off `WorldMatch.round` and the viewer reads the occasion off the id. She wins the first two
 *  and loses the final, which is `roundsWon: 2` above – the fixture and the run agree. */
function leagueMatch(round: number): WorldMatch {
  const opp = rubberPlayer(`college-w293-r${round}`, ['Ivana Rusu', 'Elin Berg', 'Sara Novak'][round])
  const kidWon = round < 2
  return {
    round,
    aId: 'kid',
    bId: opp.id,
    winnerId: kidWon ? 'kid' : opp.id,
    seed: `fixture:collegematch:293:${round}`,
    score: kidWon ? '6-3 6-4' : '4-6 5-7',
    eventId: `college-w293-r${round}`,
    surface: 'hard',
    oppName: opp.name,
    a: rubberPlayer('kid', 'Mila Adler'),
    b: opp,
  }
}

function collegeView(over: Partial<CollegeProgressView> = {}): CollegeProgressView {
  // ⚠ ROUND 21: `billPerYearCents` is a real bill by default, not 0. A fixture that defaulted to zero
  // would go on measuring the free-ride card and quietly stop covering the one the player sees – the
  // same slow failure `round21-dialogs.test.ts` records about the fork's own fixture. $8,673 is the
  // shipped example bill from `what-the-college-place-costs-2026-08.md` §1a.
  // ⚠ 17.08: `tier` is the place she picked, and the default is a real one for the same reason the
  // bill's default is – a fixture that defaulted to `null` would go on measuring the migrated card.
  // ⚠ AND `rubbers` DEFAULTS TO THE TWO SHE PLAYED, for the third time in this function's history and
  // for the same reason the bill and the tier do: the default fixture must be the card the player
  // sees. `collegeYear()` above says she played two rubbers, so a default of `[]` would have been a
  // fixture asserting a week the engine cannot produce.
  return {
    yearsDone: 1,
    totalYears: ENDINGS.collegeYears,
    last: collegeYear(),
    final: false,
    billPerYearCents: 8_673_00,
    tier: 'state',
    rubbers: [rubber(0), rubber(1)],
    // ⚠ AND ROUND 24 MAKES THE SAME ARGUMENT A FOURTH TIME. The championship is on the calendar of
    // EVERY college year, so a default of `null` / `[]` would be a fixture measuring a card the
    // engine cannot produce – which is exactly the slow failure the bill's own note records.
    league: { week: 293, roundsWon: 2, rounds: 3 },
    leagueMatches: [leagueMatch(0), leagueMatch(1), leagueMatch(2)],
    // ⚠ ROUND 24, the birthday: the default fixture is a year at REST at a boundary, which is the
    // card the player sees on every press – the paused-mid-year state has its own walk in
    // tests/college-birthday.test.ts and its own label case in HomeScreen.
    yearInProgress: false,
    ...over,
  }
}

// =================================================================================================
// ⭐⭐⭐ A WALKED CAREER UNDER THE FIXTURES, NOT A HAND-BUILT SNAPSHOT
// =================================================================================================
//
// `HomeScreen` is the whole page – her painting, her condition, the coach card, the budget chart, the
// news feed – so it cannot be mounted over a two-field object the way the epilogue could. That is a
// gain rather than a cost: the base below is a career that was really PLAYED to the fork, really
// answered «college» and really spent a year there through `resumeFromCollege`, so every assertion
// about the shell is asked of a snapshot the engine actually produces.
//
// ⚠ THE PROGRESS VIEW IS STILL A FIXTURE, AND DELIBERATELY. `CollegeProgressView` is where the
// OUTCOMES live – she retired in a rubber, she was named and never took the court, nobody wrote to
// her – and those are rolls. A test that waited for the RNG to produce a retirement would be a test
// that runs sometimes. So: a real snapshot underneath, one field swapped, which is the only field
// any of these assertions is about.
function finishAnyReveal(world: WorldState): void {
  for (let i = 0; i < 40 && world.pendingTournament && !world.pendingTournament.finished; i++) {
    revealTournamentRound(world)
  }
  if (world.pendingTournament) closeTournament(world)
}

let walked: Snapshot | null = null

/** A career at college with one year behind her, built once – the walk is the expensive half and it
 *  is deterministic, so it is done exactly once for the file. */
function walkedCollegeSnapshot(): Snapshot {
  if (walked) return walked
  const world = createWorld('r24-college-shell', { ...DEFAULT_PROFILE })
  const rng = resumeMain(world.rngMain)
  for (let i = 0; i < 60; i++) {
    tickWeek(world, rng)
    finishAnyReveal(world)
  }
  // ⚠ THE FIXTURE'S ONE THUMB ON THE SCALE, and it is `college-freeze.test.ts`'s: four college years
  // is 208 weeks of base costs, and a career that went bankrupt inside them would be measuring the
  // family budget instead of the shell. Zero RNG implications – `resolveBaseCosts` draws its three
  // whatever the balance is.
  world.fundsCents = 500_000_00
  world.fork = { askedWeek: world.week, answer: null, offer: measureCollegeOffer(world) }
  answerFork(world, 'college')
  // ⚠ ROUND 24 #5: the answer reserves – walk the gap to the September departure first.
  for (let i = 0; i < 54 && world.ending === null; i++) {
    tickWeek(world, rng)
    finishAnyReveal(world)
  }
  // ⚠⚠ ROUND 26 #6 RE-AIM, AND THE FIXTURE WOULD HAVE GONE QUIETLY WRONG WITHOUT IT. One press no
  // longer spends a whole year: the championship week PAUSES it and `TournamentFlow` walks the
  // matches, so a fixture that pressed once and stopped would hand every case below a snapshot with
  // `pending` set – on which HomeScreen correctly draws no college bar at all, because a press that
  // can only be refused is R10-16's own bug. Every case here is about the RESTING state, so the walk
  // answers the reveal the way the player does («Skip all rounds», then the finale's «Continue») and
  // keeps pressing until a year is actually banked. The same shape `finishAnyReveal` above already
  // has for a tour reveal, one competition along.
  for (let press = 0; press < 4 && world.college!.years.length === 0; press++) {
    resumeFromCollege(world, rng)
    if (collegeLeagueRevealOpen(world)) {
      skipTournament(world)
      closeTournament(world)
    }
    if (pendingBirthday(world) !== null) chooseGift(world, 'day')
  }
  const snap = toSnapshot(world)
  if (snap.ending === null || snap.ending.ending.type !== 'college' || snap.ending.college === null) {
    throw new Error('the walked career is not at college – the fixture under every test below is wrong')
  }
  walked = snap
  return snap
}

/** Home, on a college week, with `college` swapped for the shape under test. Attached to the
 *  document, or the cascade the measurements read is not the one the player gets. */
async function openCollegeHome(college: CollegeProgressView | null, vp: Viewport = PHONE) {
  setViewport(vp)
  const base = walkedCollegeSnapshot()
  const game = useGameStore()
  game.$patch({ snapshot: { ...base, ending: { ...base.ending!, college } } as Snapshot })
  return mount(HomeScreen, {
    props: { recapFresh: false },
    attachTo: document.body,
    global: { stubs: { teleport: true } },
  })
}

describe('P5 – the college year block', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    document.body.innerHTML = ''
  })

  // ⭐⭐⭐ ROUND 24 #2b – THE ITEM ITSELF, ASSERTED BEFORE ANY OF ITS CONTENT.
  it('⭐⭐⭐ a college week is a WEEK on Home – no album, and the shell is not replaced', async () => {
    const wrapper = await openCollegeHome(collegeView())
    // The page under it is Home's own page, whole: her photograph, her news, her budget.
    expect(wrapper.find('.diary-hero').exists(), 'the home shell is still the shell').toBe(true)
    expect(wrapper.find('.college-year').exists(), 'and the week is the college year').toBe(true)
    // ⚠ AND NOT ONE PIECE OF THE EPILOGUE'S FURNITURE. These three classes are the album, its paging
    // and the hand-off – the "as if the career had ended" the owner was reading.
    expect(wrapper.find('.album-page').exists(), 'no album on a college week').toBe(false)
    expect(wrapper.find('.album-dots').exists()).toBe(false)
    expect(wrapper.text()).not.toContain('Raise another')
    wrapper.unmount()
  })

  it('⭐ draws the year just lived, in the engine\'s own numbers', async () => {
    const wrapper = await openCollegeHome(collegeView())
    const text = wrapper.find('.college-year').text()
    expect(text).toContain('Year 2 of 4')
    // The money the year banked, formatted by the same helper the totals use.
    expect(text).toContain('$38,061')
    // ⚠ THE RANK SPAN IS A DASH AT BOTH ENDS WHEN SHE IS ON NO LIST – null IS NOT #1, which is the
    // contract `LadderView.rank` keeps and the reason this is not a number.
    expect(text).toContain('– to –')
    wrapper.unmount()
  })

  it('⭐⭐ says what the call-up paid, which is nothing, in both currencies', async () => {
    const wrapper = await openCollegeHome(collegeView())
    const text = wrapper.find('.college-year').text()
    expect(text).toContain('Her country called')
    expect(text).toContain('1 of 2 rubbers won')
    expect(text).toContain('finished 11th')
    // ⚠ RE-AIMED BY R2-18 AND STRICTLY STRONGER. This asserted that the call-up note carried the
    // tail «No prize money and no ranking points» – true, and true of three other lines on the same
    // card, which is the defect PROD-11 counted. The claim ("the card says what it paid, which is
    // nothing, in both currencies") is unchanged and is now checked ONCE and by both currencies, in
    // the dedicated test below. What stays here is the call-up's own facts.
    expect(text).toMatch(/ranking points/)
    wrapper.unmount()
  })

  // ===============================================================================================
  // ⭐⭐ THE COLLEGE WAVE – THE COMPETITION IS WATCHED, NOT SUMMARISED (owner's item 3, 19.08)
  // ===============================================================================================
  //
  // «в каждом году минимум одни соревнования, которые можно смотреть так же, как и наши текущие,
  // т.е. тот же самый механизм в точности, кроме названий турниров.»
  //
  // The engine plays the rubbers now; these three say the player can reach them. The load-bearing
  // one is the second: it mounts the REAL `MatchReplay`, the same component the tour re-watches a
  // match in, so "the same mechanism exactly" is asserted rather than claimed in a comment.

  it('⭐⭐ every rubber she played is a row, with who and what it finished', async () => {
    // ⚠ RE-AIMED BY ROUND 24, NOT WEAKENED. The card now draws match rows for TWO competitions on
    // one surface, so «the rows» had to say which one it means: `.college-league-match` is the
    // student championship's, and this case is about the Nations Cup's.
    const wrapper = await openCollegeHome(collegeView())
    const rows = wrapper.findAll('.college-rubber:not(.college-league-match)')
    expect(rows, 'two rubbers played, two rows').toHaveLength(2)
    expect(rows[0].text()).toContain('Rubber 1')
    expect(rows[0].text()).toContain('Kovac')
    expect(rows[0].text()).toContain('Won 6-4 6-3')
    expect(rows[1].text()).toContain('Lost 3-6 4-6')
    wrapper.unmount()
  })

  it('⭐⭐ pressing one opens the SAME replay the tour opens, headed with the competition', async () => {
    const wrapper = await openCollegeHome(collegeView())
    // ⚠ RE-AIMED (round 24): the call-up's rows, told apart from the championship's.
    const rubberRows = wrapper.findAll('.college-rubber:not(.college-league-match)')
    expect(rubberRows).toHaveLength(2)
    await rubberRows[0].trigger('click')
    const replay = wrapper.findAllComponents({ name: 'MatchReplay' })
    expect(replay.length, 'the rubber opens the app\'s own match viewer').toBeGreaterThan(0)
    const opened = replay[replay.length - 1]
    // ⚠ THE TITLE IS THE OWNER'S «кроме названий турниров», and it is the ONE thing that differs from
    // a tour replay. A rubber has no rung behind it, so `occasionOf` correctly says nothing – without
    // this header the screen would never name the competition at all.
    expect(opened.text()).toContain(NATIONAL_TEAM.label)
    // ⚠⚠ AND IT PAINTS OVER THE PAGE RATHER THAN INSIDE IT, MEASURED THROUGH THE REAL CASCADE. This
    // is the one way the control could fail silently: the player taps Watch, the component mounts,
    // and nothing appears. On Home there is no `z-index: 60` takeover to escape any more – what has
    // to hold is that the viewer is a FIXED full-screen surface with a stacking order of its own, and
    // the same two halves are asserted for the same two failure modes.
    const shell = opened.find('.tournament-flow').element
    expect(getComputedStyle(shell).position, 'the viewer is a full-screen takeover').toBe('fixed')
    expect(Number(getComputedStyle(shell).zIndex), 'and it is ordered above the page').toBeGreaterThan(0)
    // ...and it closes back onto the same undecided question.
    await opened.vm.$emit('close')
    expect(wrapper.find('.college-year').exists()).toBe(true)
    expect(wrapper.findAll('.college-answer')).toHaveLength(2)
    wrapper.unmount()
  })

  it('⚠ a rubber she walked out of says so, in the result sheet\'s own notation', async () => {
    // A bare "Lost 6-4 2-1" hides that she stopped, which is the lie the news line's verb exists to
    // prevent one layer down. `ret.` sits beside the verb, so which of the two women retired is never
    // in doubt: the one who retires is always the one who lost.
    const hers = rubber(0, { retiredId: 'kid', winnerId: 'nations-w295-r0', score: '6-4 2-1' })
    const theirs = rubber(1, { retiredId: 'nations-w295-r1', winnerId: 'kid', score: '6-4 3-0' })
    const wrapper = await openCollegeHome(collegeView({ rubbers: [hers, theirs] }))
    const rows = wrapper.findAll('.college-rubber:not(.college-league-match)')
    expect(rows[0].text()).toContain('Lost 6-4 2-1 ret.')
    expect(rows[1].text()).toContain('Won 6-4 3-0 ret.')
    wrapper.unmount()
  })

  it('⚠ named in the squad and never on court draws NO rows – the outcome, not a gap', async () => {
    // Research §5.7: representation is deemed to occur on nomination, not on playing. A squad of four
    // for three ties means one of them sits, and the week is still a week. What there is not is a
    // match, so there is nothing to open and the card must not offer one.
    const wrapper = await openCollegeHome(
      collegeView({ last: collegeYear({ callUp: { week: 295, rubbersPlayed: 0, rubbersWon: 0, nationFinish: 11 } }), rubbers: [] }),
    )
    expect(wrapper.find('.college-year').text()).toContain('never on court')
    expect(wrapper.findAll('.college-rubber:not(.college-league-match)')).toHaveLength(0)
    wrapper.unmount()
  })

  it('⚠ and says it plainly when nobody wrote to her', async () => {
    const wrapper = await openCollegeHome(collegeView({ last: collegeYear({ callUp: null }), rubbers: [] }))
    const text = wrapper.find('.college-year').text()
    expect(text).toContain('Nobody wrote to her this year')
    expect(text).not.toContain('Her country called')
    // ⚠ AND NO RUBBER ROW EITHER – a year with no letter has nothing to open, and a "Watch" control
    // with no match behind it is the empty-popup failure of R10-16 wearing a different button.
    // ⚠ RE-AIMED (round 24): the CHAMPIONSHIP's rows are still there, because a year with no letter
    // still had a tournament in it – which is the whole of what this round changed about such a year.
    expect(wrapper.findAll('.college-rubber:not(.college-league-match)')).toHaveLength(0)
    expect(wrapper.findAll('.college-league-match').length, 'the year still held a tournament').toBeGreaterThan(0)
    wrapper.unmount()
  })

  // ⚠ RE-AIMED BY ROUND 26 #8, NOT WEAKENED: «Another year и Back on tour поменять местами». The
  // claim is the one it was – there are TWO answers and the early return is one of them – and the
  // ORDER is his. Both still wear one class and one weight (ruling 4), which the case below checks.
  it('⭐ TWO ANSWERS, and the early return is one of them', async () => {
    const wrapper = await openCollegeHome(collegeView())
    const labels = wrapper.findAll('.college-answer').map((n) => n.text())
    expect(labels).toEqual(['Back on tour now', 'Another year'])
    wrapper.unmount()
  })

  it('⚠ THE LEAVE ANSWER IS ABSENT BEFORE THE FIRST YEAR IS SPENT, and the engine agrees', async () => {
    // `endCollegeEarly` throws on a career with no banked year, so a button here would be a control
    // that cannot work. The screen agrees with the rule; it is not the rule (CLAUDE.md invariant 1).
    const wrapper = await openCollegeHome(collegeView({ yearsDone: 0, last: null, rubbers: [] }))
    const labels = wrapper.findAll('.college-answer').map((n) => n.text())
    expect(labels).toEqual(['Play the first year'])
    const text = wrapper.find('.college-year').text()
    expect(text).toContain('Year 1 of 4')
    expect(text).toContain('She can leave at the end of any year')
    wrapper.unmount()
  })

  it('⚠ IT MAY NOT RECOMMEND – neither answer is styled as the CTA, and no verdict word appears', async () => {
    // Ruling 4 (30.07), the same discipline the fork at nineteen keeps. Two options of ONE weight:
    // a CTA pill beside a text link is an opinion in a different font.
    //
    // ⚠ RE-AIMED, NOT WEAKENED. The two answers are the bottom control now, so "one weight" is a
    // claim about the BAR: both buttons carry the same single class, and neither of them is the app's
    // one lime CTA (`.next-week-btn` / `.tb-pill--cta`). The verdict sweep still reads the card.
    const wrapper = await openCollegeHome(collegeView())
    const answers = wrapper.findAll('.college-answer')
    expect(answers).toHaveLength(2)
    for (const a of answers) {
      expect([...a.element.classList].sort(), 'both answers wear exactly one class, and the same one').toEqual(['college-answer'])
    }
    expect(wrapper.find('.college-bar .next-week-btn').exists(), 'no CTA among the answers').toBe(false)
    expect(wrapper.find('.college-bar .tb-pill--cta').exists()).toBe(false)
    const text = wrapper.find('.college-year').text().toLowerCase()
    for (const verdict of ['should', 'better', 'recommend', 'worth it', 'mistake', 'wasted']) {
      expect(text, `"${verdict}" is a verdict and this card may not carry one`).not.toContain(verdict)
    }
    wrapper.unmount()
  })

  it('⚠ the last question says so, because after it she is out either way', async () => {
    const wrapper = await openCollegeHome(collegeView({ yearsDone: 3, final: true }))
    expect(wrapper.find('.college-year').text()).toContain('One year of the scholarship left')
    wrapper.unmount()
  })

  // ⭐⭐ 17.08 – IT NAMES THE PLACE SHE PICKED. Four years are lived here and the tier is a price and a
  // place she chose at the fork; a screen that never said which one would be hiding the decision the
  // player actually made. ⚠ AND IT SAYS NOTHING WHERE IT WAS NEVER TOLD – a career that entered
  // college before the choice existed carries `tier: null` and gets no invented place.
  //
  // ⚠ RE-AIMED, NOT DELETED (round 21 #4): the name is «A private university» and no longer «A private
  // programme» – the owner's «надо переформулировать точно» – and the negative below moved with it to
  // the word the caption actually uses now. Asserting the OLD noun's absence would have passed
  // vacuously on every future rename, which is the failure `pin-hygiene` describes one file along.
  it('⭐⭐ names the place she picked on the first year, and invents none where there is none', async () => {
    const picked = await openCollegeHome(collegeView({ yearsDone: 0, tier: 'private' }))
    expect(picked.find('.college-lead').text()).toContain('A private university')
    picked.unmount()
    const migrated = await openCollegeHome(collegeView({ yearsDone: 0, tier: null }))
    const lead = migrated.find('.college-lead').text()
    expect(lead).not.toMatch(/university|programme/)
    expect(lead, 'and the rest of the sentence survives').toContain('the family pays whatever the award does not')
    migrated.unmount()
  })

  // ⭐⭐ ROUND 21 – THE PRICE IS STILL SAID BEFORE SHE AGREES TO IT. It used to be the second line of
  // the «Another year» button; the button is a one-line control in a bar now, so the sentence moved
  // onto the card. This is the guard that the move did not quietly drop it, which is exactly how the
  // claim it replaced («the family stops paying») survived a whole wave after the bill landed.
  it('⚠⚠ the year AHEAD is priced on the card, before the answer is given', async () => {
    const billed = await openCollegeHome(collegeView())
    expect(billed.find('.college-next').text()).toContain('$8,673')
    expect(billed.find('.college-next').text()).toContain('charged weekly')
    billed.unmount()
    // ⚠ AND A FREE RIDE SAYS SO RATHER THAN DRAWING A $0 BILL.
    const free = await openCollegeHome(collegeView({ billPerYearCents: 0 }))
    expect(free.find('.college-next').text()).toContain('the award covers the whole year')
    expect(free.find('.college-next').text()).not.toContain('$0')
    free.unmount()
  })

  // ⭐⭐⭐ ROUND 24 #3 – «3 клика "+1 год" и ни одного соревнования живого». Home has a calendar in an
  // ordinary season and the college years had none, so the four years were three clicks with nothing
  // between them. The rows are the ENGINE's own marked weeks, read off `COLLEGE_TRIP_WEEKS` and
  // `NATIONAL_TEAM.seasonWeek`; the card invents no event of its own.
  it('⭐⭐⭐ the year has a CALENDAR, and it is the engine\'s own marked weeks', async () => {
    const wrapper = await openCollegeHome(collegeView())
    const rows = wrapper.findAll('.college-calendar li')
    expect(rows.length, 'a college year is not an empty year').toBeGreaterThan(0)
    const text = wrapper.find('.college-calendar').text()
    expect(text).toContain(NATIONAL_TEAM.label)
    expect(text).toContain('Squad trip')
    wrapper.unmount()
  })

  // ===============================================================================================
  // ⭐⭐⭐ ROUND 24 – THE ONE TOURNAMENT THE YEAR IS GUARANTEED, ON THE SHELL
  // ===============================================================================================
  //
  // «я бы хотел, чтобы как минимум 1 турнир в год колледжа был… Тогда вызов в сборную можно будет
  // опереть на результаты студенческого». Measured before it: 0.71 watchable matches per college
  // year over 48 of them, because the two squad trips write no rows and the letter was a 40% roll.
  // These four say the fixture REACHES the player: it is on the card, it is on the calendar, its
  // matches open in the app's own viewer, and the card says what the result is FOR.

  it('⭐⭐⭐ the championship is on the card, with its result and a row per match', async () => {
    const wrapper = await openCollegeHome(collegeView())
    const text = wrapper.find('.college-league').text()
    expect(text).toContain('College League')
    // Two wins in a draw of three rounds is the final, lost – stated with no adjective near it.
    expect(text).toContain('Final')
    expect(text).toContain('3 matches, 2 wins')
    // ⚠ RE-AIMED BY R2-18 – see the note on the call-up test above. The championship note reports
    // the RESULT; the rule it used to restate is asserted once, below.
    const rows = wrapper.findAll('.college-league-match')
    expect(rows, 'one row per match she played').toHaveLength(3)
    expect(rows[0].text()).toContain('Quarterfinal')
    expect(rows[0].text()).toContain('Rusu')
    expect(rows[0].text()).toContain('Won 6-3 6-4')
    expect(rows[2].text()).toContain('Final')
    expect(rows[2].text()).toContain('Lost 4-6 5-7')
    wrapper.unmount()
  })

  it('⭐⭐⭐ pressing one opens the SAME viewer, headed with THIS competition and not the other one', async () => {
    // ⚠ THE HEADING IS THE LOAD-BEARING HALF. The card offers two competitions now and the viewer's
    // title used to be a hard-coded `NATIONAL_TEAM.label` – so a championship match would have
    // opened under her country's name, which is the quiet lie «кроме названий турниров» is about.
    const wrapper = await openCollegeHome(collegeView())
    await wrapper.findAll('.college-league-match')[0].trigger('click')
    const replay = wrapper.findAllComponents({ name: 'MatchReplay' })
    expect(replay.length, 'the championship opens the app\'s own match viewer').toBeGreaterThan(0)
    const opened = replay[replay.length - 1]
    expect(opened.text()).toContain('College League')
    expect(opened.text(), 'and never the other competition\'s name').not.toContain(NATIONAL_TEAM.label)
    const shell = opened.find('.tournament-flow').element
    expect(getComputedStyle(shell).position, 'a full-screen takeover, like every other replay').toBe('fixed')
    await opened.vm.$emit('close')
    expect(wrapper.find('.college-year').exists()).toBe(true)
    wrapper.unmount()
  })

  it('⭐⭐ the card says what the result is FOR – the stake, stated as a fact and not as advice', async () => {
    // Ruling 4 forbids a RECOMMENDATION, not an explanation, and a stake the player cannot see is
    // not a stake. The line names the mechanism and stops.
    const wrapper = await openCollegeHome(collegeView())
    const text = wrapper.find('.college-league').text()
    expect(text).toContain(`${NATIONAL_TEAM.label} selectors read this result`)
    // ⚠ AND NO VERDICT WORD ANYWHERE NEAR HER RESULT (the album's own rule, §6).
    expect(text.toLowerCase()).not.toMatch(/unlucky|deserved|brave|sadly|at least|should have|well done/)
    wrapper.unmount()
  })

  it('⭐ it is on the YEAR AHEAD calendar too, as a promise rather than a maybe', async () => {
    const wrapper = await openCollegeHome(collegeView())
    const text = wrapper.find('.college-calendar').text()
    expect(text).toContain('College League')
    expect(text).toContain('every year')
    wrapper.unmount()
  })

  it('⚠ a career with no championship on record draws no block at all, and invents nothing', async () => {
    // The migrated case (v55 mid-freeze) and the very first weeks of a career: there is genuinely
    // no result, so the card says nothing rather than drawing an empty tournament.
    const wrapper = await openCollegeHome(collegeView({ league: null, leagueMatches: [] }))
    expect(wrapper.find('.college-league').exists()).toBe(false)
    expect(wrapper.findAll('.college-league-match')).toHaveLength(0)
    expect(wrapper.find('.college-year').exists(), 'and the rest of the card is untouched').toBe(true)
    wrapper.unmount()
  })

  it('⚠ NO CYRILLIC AND NO LONG DASH reaches the screen', async () => {
    // CLAUDE.md Style, asserted rather than reviewed.
    const wrapper = await openCollegeHome(collegeView())
    const text = `${wrapper.find('.college-year').text()} ${wrapper.find('.college-bar').text()}`
    expect(text).not.toMatch(/[Ѐ-ӿ]/)
    expect(text).not.toContain('—')
    wrapper.unmount()
  })
})

// =================================================================================================
// THE PHONE MEASUREMENT – and it measures the shape this surface actually is
// =================================================================================================

/**
 * The whole of round-20 #3, asked of a FIXED BOTTOM BAR instead of a centred card or a scroller.
 *
 * ⚠ THE SHAPE CHANGED IN ROUND 24 AND SO DID THE FAILURE MODE, which is why this is not
 * `assertDismissReachable` and no longer `assertTakeoverReachable`. The two answers are 58px above
 * the tab bar in a `position: fixed` strip, so they cannot fall below the fold however long the card
 * above them grows – that half is now structural. What CAN go wrong is the other axis: two controls
 * in one bar, on a 320px phone, with `.next-week-btn`'s own `min-width: 206px` inherited by habit.
 *
 * THREE things have to hold and they fail differently, so all three are named:
 *  1. the bar is fixed, and its own box lands inside the viewport with the tab bar cleared;
 *  2. every answer has a box – happy-dom does no layout, so this is asked of the cascade through
 *     `boxOf`, the same instrument `measureDialog` uses;
 *  3. the answers' declared MINIMUM widths, plus the gaps between them, fit the room the bar has.
 *     This is the content-independent half and it is what the mutation at the bottom takes away.
 */
function assertBarFits(bar: Element, answers: Element[], vp: Viewport, label: string): void {
  if (!document.head.querySelector('style')) {
    throw new Error('no stylesheet in the document – without it this measurement is vacuous')
  }
  const cs = getComputedStyle(bar)
  if (cs.position !== 'fixed') {
    throw new Error(`${label}: the bar is \`${cs.position}\`, not \`fixed\` – the answers are not pinned to the screen`)
  }
  const num = (v: string): number => (Number.isFinite(parseFloat(v)) ? parseFloat(v) : 0)
  const maxWidth = lengthPx(cs.maxWidth, vp.width)
  const barWidth = Math.min(vp.width, Number.isFinite(maxWidth) ? maxWidth : Infinity)
  const room = barWidth - num(cs.paddingLeft) - num(cs.paddingRight)
  const gap = num(cs.gap || cs.columnGap)

  let needed = gap * Math.max(0, answers.length - 1)
  for (const a of answers) {
    const acs = getComputedStyle(a)
    const box = boxOf(a, room)
    expect(
      box.h,
      `${label} at ${vp.width}x${vp.height} – an answer has no box at ${room.toFixed(0)}px of room, so there is nothing to press`,
    ).toBeGreaterThan(0)
    // The bar's own top edge has to be on screen with the tab bar cleared.
    const top = vp.height - num(cs.bottom) - box.h
    expect(
      top,
      `${label} at ${vp.width}x${vp.height} – the bar starts above the top of the screen`,
    ).toBeGreaterThan(0)
    const min = lengthPx(acs.minWidth, room)
    needed += (Number.isFinite(min) ? min : 0) + num(acs.borderLeftWidth) + num(acs.borderRightWidth)
  }
  expect(
    needed,
    `${label} at ${vp.width}x${vp.height} – the answers demand ${needed.toFixed(0)}px of a ${room.toFixed(0)}px bar, so one of them is off the side of the phone`,
  ).toBeLessThanOrEqual(room)
}

describe('⚠⚠ P5 – the college question fits a phone, and the measurement can fail', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    document.body.innerHTML = ''
  })

  for (const vp of [PHONE, NARROW_PHONE]) {
    it(`both answers are reachable at ${vp.width}x${vp.height}`, async () => {
      const wrapper = await openCollegeHome(collegeView(), vp)
      const bar = wrapper.find('.college-bar').element
      const answers = wrapper.findAll('.college-answer').map((n) => n.element)
      expect(answers, 'two answers').toHaveLength(2)
      assertBarFits(bar, answers, vp, 'HomeScreen (college answers)')
      // ⚠ AND THE RUBBERS ARE MEASURED TOO. They are the newest controls on the longest card on this
      // page, and the failure mode the describe exists for is a surface that grows one honest row at
      // a time until something falls off it. On Home they are in the page's own flow, so what has to
      // hold of them is that they have a box at all.
      const room = vp.width - 32
      for (const r of wrapper.findAll('.college-rubber')) {
        expect(boxOf(r.element, room).h, 'a rubber row with no box is not a control').toBeGreaterThan(0)
      }
      wrapper.unmount()
    })
  }

  it('⭐⭐ THE MUTATION PROOF: give the answers the single pill\'s min-width and the same assertion goes red', async () => {
    // A test that cannot fail on the broken version is not this test. `.next-week-btn` carries
    // `min-width: 206px`, which is right for ONE floating pill and impossible for two: 206 + 206 + a
    // 10px gap is 422px against 343px of bar on a 375px phone. This is the exact mistake a future
    // wave makes by styling the pair "like the week button".
    const wrapper = await openCollegeHome(collegeView(), PHONE)
    const bar = wrapper.find('.college-bar').element
    const answers = wrapper.findAll('.college-answer').map((n) => n.element as HTMLElement)
    // Sanity: green before the mutation.
    assertBarFits(bar, answers, PHONE, 'HomeScreen (college answers)')
    for (const a of answers) a.style.minWidth = '206px'
    expect(() => assertBarFits(bar, answers, PHONE, 'HomeScreen (college answers)')).toThrow(/off the side of the phone/)
    wrapper.unmount()
  })

  it('⭐ AND THE FIRST HALF FAILS TOO – a bar that stops being pinned is caught', async () => {
    // The other way this surface can strand a player: the strip scrolls away with the page, so the
    // two answers end up below whatever the card above them grew into.
    const wrapper = await openCollegeHome(collegeView(), PHONE)
    const bar = wrapper.find('.college-bar').element as HTMLElement
    const answers = wrapper.findAll('.college-answer').map((n) => n.element)
    bar.style.position = 'static'
    expect(() => assertBarFits(bar, answers, PHONE, 'HomeScreen (college answers)')).toThrow(/not `fixed`/)
    wrapper.unmount()
  })
})

// =================================================================================================
// ⭐⭐ R2-18 / PROD-11 — THE CARD STATES ITS RULE ONCE
// =================================================================================================
describe('R2-18 — the ranking rule is said once, not four times', () => {
  it('⭐ both currencies are named, and the rule appears exactly ONCE on the whole card', async () => {
    const wrapper = await openCollegeHome(collegeView())
    const text = wrapper.find('.college-year').text()
    // The FACTS, which is what the four repetitions were carrying between them – and the hoisted
    // line carries both for both competitions, which no single one of the four did.
    expect(text).toMatch(/ranking points/)
    expect(text).toMatch(/prize money/)
    // ...and it is said once. ⚠ COUNTED, NOT `toContain`: "does the card mention the rule" was true
    // of the version this item exists to fix. The count is the assertion.
    expect(text.match(/ranking points/g) ?? [], 'the rule, restated').toHaveLength(1)
    expect(text.match(/prize money/g) ?? [], 'the rule, restated').toHaveLength(1)
    // and it lives in its own element rather than inside a result sentence, so a future result line
    // cannot absorb it back
    expect(wrapper.findAll('.college-rule'), 'one rule line').toHaveLength(1)
    expect(wrapper.find('.college-rule').text()).toMatch(/ranking points/)
    wrapper.unmount()
  })

  it('⭐ ...and it is on the card in the FIRST year, before there is any result to attach it to', async () => {
    // The year the terms most need saying is the one where nothing has been played yet, and the old
    // full statement was in `collegeLead`'s `yearsDone === 0` branch only – so it was said four
    // times on the years she did not need it and once on the year she did.
    const wrapper = await openCollegeHome(collegeView({ yearsDone: 0, last: null, league: null }))
    const text = wrapper.find('.college-year').text()
    expect(text).toMatch(/ranking points/)
    expect(text.match(/ranking points/g) ?? []).toHaveLength(1)
    wrapper.unmount()
  })
})
