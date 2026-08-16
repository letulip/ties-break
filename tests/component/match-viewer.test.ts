// MATCHVIEWER – A CHARACTERIZATION NET, so the 2,239-line file can be split.
//
// ⚠ WHAT THIS FILE IS FOR, and it is not coverage for its own sake. MatchViewer.vue is the second
// largest file in the repo and the only "tests" it had reach into its SOURCE TEXT and assert on the
// structure (`expect(src).toContain('onBeforeUnmount(resetSweep)')`). A source pin is the opposite
// of a refactoring net: it breaks the instant the file moves and proves nothing about what the
// component does. world.ts could go from 6,019 lines to 2,135 because 2,230 real tests ran after
// every extraction; this file is the beginning of the same net for the viewer.
//
// ⚠ SO EVERY ASSERTION HERE IS ABOUT RENDERED OUTPUT AND EMITTED EVENTS, never about internals.
// A split that preserves behaviour must keep these green without edits; if a test here needs
// rewriting to accommodate a refactor, the refactor changed behaviour and that is the finding.
//
// ⚠ CANVAS UNDER HAPPY-DOM: `getContext` returns null, which the component already guards - the
// renderer early-returns and the mount hook checks before drawing. So the court simply does not
// paint here, and nothing else about the component cares.
//
// ⚠ THIS NET IS MUTATION-VERIFIED, because a green suite proves nothing on its own. Neutering the
// skip dispatch in `resetPlayback` (`if (viewMode.value === 'skip')` -> `if (false)`) turns two
// tests below red with the right message; restoring it turns them green. An earlier mutation of a
// DIFFERENT guard (the playback-step early return) did NOT trip anything - a hole in the net, found
// and then closed by aiming at the real dispatch. If you extend this file, mutate the thing you
// think you are covering and watch it fail before you believe it.
import { describe, it, expect, vi, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import MatchViewer from '../../src/components/MatchViewer.vue'
import { simulateMatch } from '../../src/engine/match/engine'
import { annotateMatch } from '../../src/engine/match/rally'
import { JUNIOR_TOUR } from '../../src/engine/season/tournament'
import { buildTimeline } from '../../src/viz/timeline'
import { buildCommentary } from '../../src/viz/commentary'
import { formatMatchClock, matchDurationSeconds } from '../../src/viz/matchClock'
import { KID_ID } from '../../src/engine/world'
import type { AnnotatedMatch } from '../../src/viz/types'
import type { MatchOptions, MatchPlayer, Side } from '../../src/engine/match/types'
import type { TierId } from '../../src/engine/season/types'

function player(overrides: Partial<MatchPlayer> = {}): MatchPlayer {
  return { id: 'p', name: 'P', serve: 50, ret: 50, composure: 50, stamina: 50, groundstrokes: 50, ...overrides }
}

/** The same recipe MatchReplay.vue uses: a seeded match is a pure function of (a, b, opts). */
function fixture(seed = 'component-fixture') {
  const a = player({ id: 'a', name: 'Vera Novak', serve: 62 })
  const b = player({ id: 'b', name: 'Ines Duval', serve: 48 })
  const opts: MatchOptions = { surface: 'hard', tour: JUNIOR_TOUR, seed }
  const match = annotateMatch(simulateMatch(a, b, opts), a, b, opts)
  return { a, b, opts, match }
}

function mountViewer(mode: 'live' | 'replay' = 'replay') {
  const { a, b, match } = fixture()
  return mount(MatchViewer, { props: { match, playerA: a, playerB: b, surface: 'hard' as const, mode } })
}

/** The control that used to be the view switch's third pill (06.08). Named once, because every test
 *  that reached for "Skip" reaches for this instead and a typo would silently find no button. */
const SKIP_LABEL = 'Skip to the result'

describe('MatchViewer – the fixture itself is deterministic', () => {
  it('the same seed reproduces the same match, which is what makes every test below stable', () => {
    const one = fixture('same-seed').match
    const two = fixture('same-seed').match
    expect(two.points.length).toBe(one.points.length)
    expect(two.result.winner).toBe(one.result.winner)
    expect(two.result.sets).toEqual(one.result.sets)
  })

  it('a different seed is a different match, so the pin above is not vacuous', () => {
    const a = fixture('seed-one').match
    const b = fixture('seed-two').match
    const setsOf = (m: typeof a) => JSON.stringify(m.result.sets)
    expect(a.points.length !== b.points.length || setsOf(a) !== setsOf(b)).toBe(true)
  })
})

describe('MatchViewer – it mounts and shows the match', () => {
  it('mounts without throwing, with a canvas that has no 2D context', () => {
    const wrapper = mountViewer()
    expect(wrapper.exists()).toBe(true)
    wrapper.unmount()
  })

  it('renders both players by name', () => {
    const wrapper = mountViewer()
    const text = wrapper.text()
    expect(text).toContain('Vera Novak')
    expect(text).toContain('Ines Duval')
    wrapper.unmount()
  })

  it('paints a court canvas element', () => {
    const wrapper = mountViewer()
    expect(wrapper.find('canvas').exists()).toBe(true)
    wrapper.unmount()
  })

  it('offers the two viewing RESOLUTIONS as a switch, and skipping as its own named control', () => {
    // skip / key points / full - docs/decisions.md, the first design round. Asserted on BUTTONS
    // rather than on the page text: a substring check would pass on any stray occurrence of "key",
    // which is exactly the kind of vacuous pin this file exists to replace.
    //
    // ⚠ RE-AIMED 06.08, and the re-aim IS the item (owner: «а skip оттуда из этого переключателя
    // вообще надо убрать - оно полностью матч пропускает, это вообще неявно в этом месте»). This
    // used to assert all three as one `arrayContaining(['Full','Key','Skip'])`, which is exactly
    // what a switch of three peers looks like - and skipping is not a peer of the other two: they
    // choose how much of the match to watch, it ends the watching. The capability is still here and
    // still one click away; what the test now says is that it is not a third pill, and that the
    // control it did move to says out loud what it does.
    const wrapper = mountViewer()
    const labels = wrapper.findAll('button').map((b) => b.text())
    expect(labels).toEqual(expect.arrayContaining(['Full', 'Key']))
    expect(labels, 'a bare "Skip" pill is back in the view switch').not.toContain('Skip')
    expect(labels).toContain(SKIP_LABEL)
    wrapper.unmount()
  })

  it('...and the speed controls beside them', () => {
    const wrapper = mountViewer()
    const labels = wrapper.findAll('button').map((b) => b.text())
    expect(labels).toEqual(expect.arrayContaining(['1×', '2×', '4×']))
    wrapper.unmount()
  })

  it('opens un-started: no score walked yet, and it says so', () => {
    const wrapper = mountViewer()
    expect(wrapper.text()).toContain('Not started')
    wrapper.unmount()
  })
})

describe('MatchViewer – THE MODE CONTRACT, which is what a split must not break', () => {
  async function clickMode(wrapper: ReturnType<typeof mountViewer>, label: string) {
    const button = wrapper.findAll('button').find((b) => b.text() === label)
    expect(button, `no "${label}" button`).toBeTruthy()
    await button!.trigger('click')
    await wrapper.vm.$nextTick()
  }

  it('Skip jumps straight to the finished match instead of walking the points', async () => {
    // The whole point of the mode: `jumpToEnd` never fires start hooks and never plays a rally, so
    // the viewer leaves "Not started" immediately and shows the decided result. This is the single
    // most refactor-fragile behaviour in the component and the reason this file exists.
    const wrapper = mountViewer()
    expect(wrapper.text()).toContain('Not started')
    await clickMode(wrapper, SKIP_LABEL)
    expect(wrapper.text()).not.toContain('Not started')
    wrapper.unmount()
  })

  it('the finished view shows the winner the ENGINE decided, never a re-decided one', async () => {
    // Pillar 1: rendering is downstream of the result. The viewer may only display what
    // simulateMatch already committed - so the winner on screen is the winner in the record.
    const { a, b, match } = fixture()
    const wrapper = mount(MatchViewer, {
      props: { match, playerA: a, playerB: b, surface: 'hard' as const, mode: 'replay' as const },
    })
    await clickMode(wrapper, SKIP_LABEL)
    // `winner` is a Side (0 = playerA, 1 = playerB), not a player id.
    const winnerName = match.result.winner === 0 ? a.name : b.name
    expect(wrapper.text()).toContain(winnerName)
    wrapper.unmount()
  })

  it('switching back to Full after Skip returns the viewer to an un-started walk', async () => {
    // `resetPlayback` rebuilds the timeline and puts the point cursor back to -1. A split that
    // forgets to reset would leave the finished score on screen under a Full-match label.
    const wrapper = mountViewer()
    await clickMode(wrapper, SKIP_LABEL)
    expect(wrapper.text()).not.toContain('Not started')
    await clickMode(wrapper, 'Full')
    expect(wrapper.text()).toContain('Not started')
    wrapper.unmount()
  })
})

describe('MatchViewer – the live/replay distinction', () => {
  it('a replay does not blink a Live badge', () => {
    // The `mode` prop used to default to 'live', which shipped a red "Live" over brackets the engine
    // had already resolved (the prop's own doc comment records the bug). Pinned so a split cannot
    // reintroduce a default.
    const wrapper = mountViewer('replay')
    expect(wrapper.text().toLowerCase()).not.toContain('live')
    wrapper.unmount()
  })

  it('a live match does', () => {
    const wrapper = mountViewer('live')
    expect(wrapper.text().toLowerCase()).toContain('live')
    wrapper.unmount()
  })
})

// =================================================================================================
// THE POINT SCORE UNDER THE COURT (owner, 04.08) — three asks, one readout.
//
// «сделать максимально наглядно 0-0, 0-15, 0-30, 15-30 и так далее. Чтобы точно было видно кто и
// почему забирает сет. И предлагаю еще выделять желтым цифру нашего игрока… И правильно ли я
// понимаю, что при смене сторон счет тоже должен меняться сторонами.»
//
// The answer to his question is yes, and it is the reason this readout is not the panel's score
// cells: it lives UNDER THE COURT, so its two numbers belong to ENDS, not to table rows. The serve
// speed already crosses the screen on a change of ends; a score that did not would print the left
// player's points under the right player's feet from the third game on.
// =================================================================================================
describe('the point score under the court', () => {
  it('shows 0-0 before a ball is struck – the counter never blinks out at the top of a game', () => {
    const w = mountViewer()
    const score = w.find('.mv-score')
    expect(score.exists()).toBe(true)
    expect(score.text().replace(/\s+/g, '')).toBe('0-0')
  })

  it('⚠ exactly one digit carries the accent, and it is hers', () => {
    const w = mountViewer()
    const hers = w.findAll('.mv-score-pt.hers')
    // The fixture's players are both anonymous (no KID_ID), so nothing is accented – the guard is
    // that the class is applied per-digit rather than to the pair, so it can never colour both.
    expect(hers.length).toBeLessThanOrEqual(1)
    expect(w.findAll('.mv-score-pt')).toHaveLength(2)
  })

  it('⚠ the digits are separable – the pair is markup, not a formatted string', () => {
    // This is what makes the accent and the end-swap possible at all. A single interpolated string
    // (`{{ scoreReadout }}`, which is what this was) can be neither coloured by half nor reordered.
    const w = mountViewer()
    expect(w.find('.mv-score-sep').exists()).toBe(true)
  })
})

// =================================================================================================
// THE PLAYBACK CLOCK, HAND-DRIVEN – which is what makes everything below testable at all.
//
// ⚠ WHY THIS EXISTS. Every test above observes the component at REST: mounted, or one click later.
// The two bugs of 04.08 both live in the walk – the score readout drifting from the match, and a
// mode change restarting it – and neither is reachable without turning the rAF clock by hand. So the
// clock becomes a fixture: `requestAnimationFrame` is replaced by a queue of one, timestamps are
// handed out by the test, and one `frame()` is one paint. Playback becomes a pure function of how
// many times the test asks for a frame, with no wall-clock flake in it.
//
// Two details of the component are load-bearing here and are stated rather than discovered twice:
//  * the viewer opens on the SETTINGS defaults, and with no localStorage written that is 'key' at ×2
//    (composables/matchDefaults: FALLBACK_VIEW / FALLBACK_SPEED) – so these tests exercise exactly
//    the mode the owner was watching in;
//  * ×1/×2 hold a `setTimeout` for the take-your-seats beat before the first frame, so the timers
//    are faked and `start()` steps past it. At ×4 there is no hold – see startClock.
// =================================================================================================
/** MAX_FRAME_DT (MatchViewer) clamps a frame at 0.25s of real time; stepping exactly that keeps each
 *  frame worth exactly `0.25 × speed` seconds of timeline and makes the walk fully deterministic. */
const FRAME_MS = 250
/** SEATS_PREROLL_MS / min(speed, 2) is 1800ms at the default ×2; round up past it. */
const SEATS_HOLD_MS = 2000

function driver() {
  // ⚠ CAPTURE THE REAL GLOBALS BEFORE THE FAKE TIMERS GO IN, and put them back after the fakes come
  // out. Saving them the other way round hands `useRealTimers()` the stubs to restore and leaves
  // `cancelAnimationFrame` undefined for the next unmount, which is a ReferenceError in a teardown
  // hook and reads like a component bug. It is not one.
  const realRaf = globalThis.requestAnimationFrame
  const realCaf = globalThis.cancelAnimationFrame
  vi.useFakeTimers()
  let pending: FrameRequestCallback | null = null
  let pendingId = 0
  let nextId = 1
  let now = 0
  globalThis.requestAnimationFrame = (cb: FrameRequestCallback): number => {
    pending = cb
    pendingId = nextId++
    return pendingId
  }
  globalThis.cancelAnimationFrame = (id: number): void => {
    if (id === pendingId) pending = null
  }
  return {
    /** Step past the pre-match hold so the clock loop actually starts. */
    async start(): Promise<void> {
      vi.advanceTimersByTime(SEATS_HOLD_MS)
      await nextTick()
    },
    /** One paint. Returns false once playback has stopped asking for frames. */
    async frame(): Promise<boolean> {
      const cb = pending
      if (!cb) return false
      pending = null
      now += FRAME_MS
      cb(now)
      await nextTick()
      return true
    },
    async frames(n: number): Promise<void> {
      for (let i = 0; i < n; i++) if (!(await this.frame())) return
    },
    restore(): void {
      vi.useRealTimers()
      globalThis.requestAnimationFrame = realRaf
      globalThis.cancelAnimationFrame = realCaf
    },
  }
}

/** A test that fails mid-run never reaches its own `d.restore()`, and a leaked rAF stub makes the
 *  NEXT test fail for a reason that has nothing to do with it. So the teardown is unconditional. */
let liveDriver: ReturnType<typeof driver> | null = null
afterEach(() => {
  liveDriver?.restore()
  liveDriver = null
  vi.useRealTimers()
})

function fixtureAndViewer(mode: 'live' | 'replay' = 'replay') {
  const { a, b, match } = fixture()
  const wrapper = mount(MatchViewer, { props: { match, playerA: a, playerB: b, surface: 'hard' as const, mode } })
  return { wrapper, match }
}

/** The counter under the court, whitespace stripped: "0-40", "40-A", "TB3-2", "138pointsplayed". */
function scoreText(w: ReturnType<typeof mountViewer>): string {
  return w.find('.mv-score').text().replace(/\s+/g, '')
}
/** The two players' per-set cells, joined – the games score, which a restart would zero. */
function cellsText(w: ReturnType<typeof mountViewer>): string {
  return w.findAll('.mv-cell').map((c) => c.text()).join('')
}

const POINT_NAMES = ['0', '15', '30', '40'] as const

/**
 * THE TRUE SCORE OF THE GAME IN PROGRESS after every point up to and including `upto`, written the
 * way a scoreboard writes it. Deliberately an INDEPENDENT statement of the rules of tennis rather
 * than a call into the component's own readout – a test that asks the implementation what the answer
 * is can only ever agree with it.
 */
function runningScore(match: AnnotatedMatch, upto: number): string {
  const pts: [number, number] = [0, 0]
  let tiebreak = false
  for (let i = 0; i <= upto; i++) {
    const p = match.points[i]
    if (!p) continue
    pts[p.entry.winner as Side]++
    tiebreak = p.entry.tiebreak
    if (p.gameEnd) {
      pts[0] = 0
      pts[1] = 0
      tiebreak = false
    }
  }
  if (match.points[upto + 1]?.entry.tiebreak) tiebreak = true
  if (tiebreak) return `TB${pts[0]}-${pts[1]}`
  if (pts[0] >= 3 && pts[1] >= 3) {
    if (pts[0] === pts[1]) return '40-40'
    return pts[0] > pts[1] ? 'A-40' : '40-A'
  }
  return `${POINT_NAMES[pts[0]]}-${POINT_NAMES[pts[1]]}`
}

/** The same reading with the ends swapped, which is how the court shows it from game 2 on. */
function flipScore(s: string): string {
  const tb = s.startsWith('TB')
  const [a, b] = (tb ? s.slice(2) : s).split('-')
  return `${tb ? 'TB' : ''}${b}-${a}`
}

// =================================================================================================
// BUG 1 (owner, 04.08): «полный счёт внутри сета показывается только на х1 ... 0-0 почти всё время
// висит на экране».
//
// ⚠ THE SPEED WAS NOT THE VARIABLE, THE VIEW MODE WAS – and the measurement is in the composable's
// own header. 'key' mode's timeline drops the points it does not show, and `isKeyPoint` keeps every
// game-ending point, so the last point SHOWN is nearly always the one that reset the game score. A
// readout anchored to it reads 0-0 for 77% of the run (4 distinct readings in a whole match) against
// 20% in 'full' (18 readings). The counter now counts every point the match has PLAYED up to the one
// on screen, so all three speeds and both walking modes read the true running score.
// =================================================================================================
describe('the point counter walks with the match, not with the timeline', () => {
  it('⚠ in Key mode it counts the points the mode SKIPPED – the score of the game being played', async () => {
    // The exact assertion: 'key' mode's first event belongs to point 3 of this fixture, so points
    // 0-2 were played and never shown. The instant point 3 is on court, the counter must read the
    // score those three points produced. Anchored to the last SHOWN point it reads 0-0 instead,
    // which is the bug, and this line is what fails when the cursor is put back.
    const d = (liveDriver = driver())
    const { wrapper, match } = fixtureAndViewer()
    const firstShown = buildTimeline(match, 'key').events[0].pointIndex
    expect(firstShown, 'fixture no longer skips any point before its first key point').toBeGreaterThan(0)
    // Ends have not swapped this early (they swap after game 1), so court order is still A-then-B.
    await d.start()
    await d.frame()
    expect(scoreText(wrapper)).toBe(runningScore(match, firstShown - 1))
    wrapper.unmount()
  })

  it('⚠ ...so a Key run stops sitting on 0-0, at every speed', async () => {
    // The owner's actual complaint, as a distribution, sampled every frame of a whole 'key' run.
    // Measured before the fix: FOUR distinct readings in a whole match, 0-0 holding 77% of them.
    //
    // ⚠ AND THE LAST ASSERTION IS THE ONE THAT CANNOT BE SATISFIED BY ACCIDENT. Anchored to the last
    // SHOWN point, the counter can only ever read one of `runningScore(K)` for the key points K –
    // that set is computable from the match, so "it showed something outside it" is exactly the
    // claim that skipped points are being counted, with no threshold to tune. Either digit order
    // counts, because the readout under the court swaps with the change of ends.
    const { match } = fixture()
    const reachableWithoutSkippedPoints = new Set(['0-0'])
    for (const ev of buildTimeline(match, 'key').events) {
      if (ev.kind !== 'point-end') continue
      const s = runningScore(match, ev.pointIndex)
      reachableWithoutSkippedPoints.add(s)
      reachableWithoutSkippedPoints.add(flipScore(s))
    }

    for (const speedLabel of ['1×', '2×', '4×']) {
      const d = (liveDriver = driver())
      const wrapper = mountViewer()
      const button = wrapper.findAll('button').find((b) => b.text() === speedLabel)
      await button!.trigger('click')
      await d.start()
      const seen: string[] = []
      for (let i = 0; i < 800; i++) {
        if (!(await d.frame())) break
        const t = scoreText(wrapper)
        if (t.includes('points')) break // match over: the counter becomes the point total
        seen.push(t)
      }
      const distinct = new Set(seen)
      const zeros = seen.filter((s) => s === '0-0').length
      expect(seen.length, `${speedLabel}: the clock never ran`).toBeGreaterThan(20)
      expect(distinct.size, `${speedLabel}: only ${[...distinct].join(',')}`).toBeGreaterThan(8)
      expect(zeros / seen.length, `${speedLabel}: 0-0 held the screen`).toBeLessThan(0.5)
      const beyond = [...distinct].filter((s) => !reachableWithoutSkippedPoints.has(s))
      expect(
        beyond.length,
        `${speedLabel}: every reading was one the SHOWN points alone can produce`,
      ).toBeGreaterThan(0)
      wrapper.unmount()
    }
  })

  it('...and Full mode, which was already right, stays right', async () => {
    // The mode that never showed the bug is the control: nothing about it may move.
    const d = (liveDriver = driver())
    const { wrapper, match } = fixtureAndViewer()
    const button = wrapper.findAll('button').find((b) => b.text() === 'Full')
    await button!.trigger('click')
    await d.start()
    // In 'full' mode every point is shown, so after N point-ends the counter is exactly the running
    // score at that point - the readout's own cursor and the match's are the same number here.
    const seen: string[] = []
    for (let i = 0; i < 200; i++) {
      if (!(await d.frame())) break
      seen.push(scoreText(wrapper))
    }
    const truths = new Set(match.points.map((_, i) => runningScore(match, i)))
    truths.add('0-0')
    for (const s of new Set(seen)) expect(truths.has(s), `"${s}" is not a score this match ever stood at`).toBe(true)
    expect(new Set(seen).size).toBeGreaterThan(8)
    wrapper.unmount()
  })
})

// =================================================================================================
// BUG 2 (owner, 04.08): «при переключении full/key в матче сам матч начинается заново на каждое
// нажатие, это жутко раздражает».
//
// The mode pill's only wiring was `resetPlayback`, a fresh-run routine. It now rebuilds the timeline
// and RESUMES from the point on court – see `retimeForMode`. 'skip' is excluded on purpose and the
// two tests at the bottom of this block are what say so.
// =================================================================================================
describe('changing the view mode mid-match does not start the match over', () => {
  async function clickMode(w: ReturnType<typeof mountViewer>, label: string) {
    const button = w.findAll('button').find((b) => b.text() === label)
    expect(button, `no "${label}" button`).toBeTruthy()
    await button!.trigger('click')
    await nextTick()
  }

  it('⚠ Key -> Full mid-match keeps the score, the games and the log', async () => {
    const d = (liveDriver = driver())
    const wrapper = mountViewer() // opens in 'key'
    await d.start()
    await d.frames(80)
    const before = { score: scoreText(wrapper), cells: cellsText(wrapper) }
    // Not vacuous: the match really is under way before the pill is touched.
    expect(wrapper.text()).not.toContain('Not started')
    expect(wrapper.find('.mv-log-empty').exists()).toBe(false)
    expect(before.cells).not.toBe('0––0––')

    await clickMode(wrapper, 'Full')

    expect(wrapper.text(), 'the walk was reset to un-started').not.toContain('Not started')
    expect(wrapper.find('.mv-log-empty').exists(), 'the commentary log was emptied').toBe(false)
    expect(cellsText(wrapper), 'the games score went back to the start').toBe(before.cells)
    expect(scoreText(wrapper)).toBe(before.score)
    wrapper.unmount()
  })

  it('⚠ ...and it keeps PLAYING – the switch is not a pause either', async () => {
    const d = (liveDriver = driver())
    const wrapper = mountViewer()
    await d.start()
    await d.frames(80)
    await clickMode(wrapper, 'Full')
    const atSwitch = cellsText(wrapper)
    // Frames are still being asked for, and the match still moves under them.
    await d.frames(400)
    expect(cellsText(wrapper), 'playback did not continue after the switch').not.toBe(atSwitch)
    expect(wrapper.text()).not.toContain('Not started')
    wrapper.unmount()
  })

  it('⚠ toggling back and forth is idempotent, which is what the owner was actually doing', async () => {
    const d = (liveDriver = driver())
    const wrapper = mountViewer()
    await d.start()
    await d.frames(80)
    const cells = cellsText(wrapper)
    for (const mode of ['Full', 'Key', 'Full', 'Key']) {
      await clickMode(wrapper, mode)
      expect(wrapper.text(), `${mode} restarted the match`).not.toContain('Not started')
      expect(cellsText(wrapper), `${mode} rewound the games score`).toBe(cells)
    }
    wrapper.unmount()
  })

  it('⚠ Skip is exempt IN: switching to Skip mid-match still jumps to the end', async () => {
    // Skip is not a position, it is an instruction to stop watching. Continuing "from here" would
    // mean not skipping. Decided 04.08 and pinned here so the resume path cannot swallow it.
    const d = (liveDriver = driver())
    const { wrapper, match } = fixtureAndViewer()
    await d.start()
    await d.frames(80)
    await clickMode(wrapper, SKIP_LABEL)
    // ⚠ «played» SINCE 14.08, and the word is load-bearing rather than decoration: "points" alone
    // reads as RANKING points, which this same flow writes one screen later as «+130 pts».
    expect(scoreText(wrapper)).toBe(`${match.points.length}pointsplayed`)
    wrapper.unmount()
  })

  it('⚠ Skip is exempt OUT: leaving Skip starts the walk from the top', async () => {
    // The other half of the same decision. Skip's position IS the end of the match, and resuming
    // from the end is not watching - so leaving Skip is the one mode change that still resets.
    // (The un-started assertion itself is pinned in THE MODE CONTRACT above; this one adds that it
    // holds after the clock has actually run.)
    const d = (liveDriver = driver())
    const wrapper = mountViewer()
    await d.start()
    await d.frames(80)
    await clickMode(wrapper, SKIP_LABEL)
    await clickMode(wrapper, 'Key')
    expect(wrapper.text()).toContain('Not started')
    expect(scoreText(wrapper)).toBe('0-0')
    wrapper.unmount()
  })
})

// =================================================================================================
// BUG (owner, 06.08): «сломался переключатель full, key в матче - ничего не происходит ... сам матч
// идёт быстрее и показывает что ключевые моменты, но в тексте трансляции вообще ничего не меняется,
// надо это синхронизировать».
//
// ⚠ AND "СЛОМАЛСЯ" WAS THE SYMPTOM, NOT THE FAULT: the switch was never wired to the text at all.
// `buildTimeline(match, mode)` is what it reached - the PLAYBACK - while the log was built once per
// match and revealed off `displayedPointIndex`, so both modes printed the same rows in the same
// order and the only observable difference was the pace they arrived at. The viewer now picks a
// list (`modeCommentary`), and the cut itself is decided in viz/commentary.ts off the engine's live
// win probability - never here.
//
// These read the RENDERED LOG at one fixed point of one match, which is the only place the owner
// could see the difference: same clock position, one click apart.
// =================================================================================================
describe('the view switch reaches the commentary, not only the playback', () => {
  async function clickMode(w: ReturnType<typeof mountViewer>, label: string) {
    const button = w.findAll('button').find((b) => b.text() === label)
    expect(button, `no "${label}" button`).toBeTruthy()
    await button!.trigger('click')
    await nextTick()
  }
  // ⚠ `:not(.intro)` BECAUSE THE LOG GAINED A SECOND KIND OF ROW (round 16, the pre-match preview).
  // The commentator's intro rides the same grid and the same class so it lines up on the same rail,
  // and it is not a beat - it is what was said before the first ball. Every assertion in this block
  // is about what the VIEW SWITCH does to the commentary, and the switch does not reach the intro.
  const logRows = (w: ReturnType<typeof mountViewer>): string[] =>
    w.findAll('.mv-beat:not(.intro)').map((r) => r.text().replace(/\s+/g, ' ').trim())

  it('⚠ Key -> Full at the same moment of the match ADDS rows, and Key is a subset of them', async () => {
    // The assertion the old behaviour could not pass: mid-match, one click, no clock movement in
    // between (`retimeForMode` deliberately keeps `displayedPointIndex`, which is what makes this a
    // fair comparison at all). Before the fix both readings were byte-identical - reproduced in the
    // browser on 06.08 as well as here.
    const d = (liveDriver = driver())
    const wrapper = mountViewer() // opens in 'key'
    await d.start()
    await d.frames(300)
    const key = logRows(wrapper)
    expect(key.length, 'the clock never reached a beat - the comparison would be vacuous').toBeGreaterThan(2)

    await clickMode(wrapper, 'Full')
    const full = logRows(wrapper)

    expect(full.length, 'Full showed no more of the story than Key did').toBeGreaterThan(key.length)
    // ...and it is the SAME story with more of it, not a different one: nothing Key showed is gone.
    for (const row of key) expect(full, `Full lost a row Key was showing: ${row}`).toContain(row)
    wrapper.unmount()
  })

  it('⚠ ...and back again: Full -> Key takes those rows away, so the switch reads both ways', async () => {
    const d = (liveDriver = driver())
    const wrapper = mountViewer()
    await d.start()
    await d.frames(300)
    await clickMode(wrapper, 'Full')
    const full = logRows(wrapper)
    await clickMode(wrapper, 'Key')
    const key = logRows(wrapper)
    expect(key.length).toBeLessThan(full.length)
    for (const row of key) expect(full).toContain(row)
    wrapper.unmount()
  })

  it('⚠ skipping hands over the WHOLE account, not the trailer', async () => {
    // Deliberate, and stated because it is the one place 'key' does not narrow anything: a player
    // who skipped the match wants what happened in it, and `modeCommentary` filters on 'key' alone.
    // Counted against the match's own beat list rather than against "more than Key showed" - the
    // weaker form passed even with skip wrongly filtered, because skip also reveals every point.
    const { wrapper, match } = fixtureAndViewer()
    const every = buildCommentary(match, 'Vera Novak', 'Ines Duval')
    expect(every.filter((b) => b.keyMoment).length, 'the fixture has no cut to speak of').toBeLessThan(
      every.length,
    )
    await clickMode(wrapper, SKIP_LABEL)
    expect(logRows(wrapper), 'the skipped account was cut down to the key moments').toHaveLength(every.length)
    wrapper.unmount()
  })
})

// =================================================================================================
// ROUND 16 – THE PRE-MATCH PREVIEW ON SCREEN (owner: «комментаторы дают какую-то короткую информацию
// об участниках, их шансе на победу или на продвижение в таблице»).
//
// `tests/viz/preview.test.ts` owns the LADDER – what each storey may say. What is owned here is the
// half that file cannot see: that the lines reach the log at all, that they sit at the BOTTOM (the
// log reads newest-first, and the intro is older than the first ball), and that they are not
// mistaken for beats by anything that counts beats.
// =================================================================================================
describe('MatchViewer – the pre-match preview', () => {
  const introRows = (w: ReturnType<typeof mountViewer>): string[] =>
    w.findAll('.mv-beat.intro').map((r) => r.text().replace(/\s+/g, ' ').trim())
  const allRows = (w: ReturnType<typeof mountViewer>): string[] =>
    w.findAll('.mv-beat').map((r) => r.text().replace(/\s+/g, ' ').trim())

  it('⚠ is on screen BEFORE a ball is struck, where the empty state used to be', () => {
    const wrapper = mountViewer()
    expect(wrapper.text(), 'the match has not started').toContain('Not started')
    const intro = introRows(wrapper)
    expect(intro.length, 'no intro rows at all').toBeGreaterThanOrEqual(3)
    // The girl across the net is the line the owner asked for by name.
    expect(intro.join(' ')).toContain('Ines')
    // ...and the old "nothing here yet" paragraph is not what a player sees any more.
    expect(wrapper.find('.mv-log-empty').exists()).toBe(false)
    wrapper.unmount()
  })

  it('⚠ sits at the BOTTOM of the log, under every beat, because it is the oldest thing in it', async () => {
    const wrapper = mountViewer()
    await clickModeOn(wrapper, SKIP_LABEL) // reveals the whole match, so there are beats above it
    const rows = allRows(wrapper)
    const intro = introRows(wrapper)
    expect(intro.length).toBeGreaterThanOrEqual(3)
    // Every intro row is in the last `intro.length` rows of the log, in order.
    expect(rows.slice(rows.length - intro.length)).toEqual(intro)
    wrapper.unmount()
  })

  it('⚠ says MORE at a high rung than at a low one – the ladder, seen through the component', async () => {
    const { a, b, match } = fixture()
    const at = (previewEvent: { tier: TierId; roundLabel: string } | null): string[] => {
      const w = mount(MatchViewer, {
        props: { match, playerA: a, playerB: b, surface: 'hard' as const, mode: 'replay' as const, previewEvent },
      })
      const rows = w.findAll('.mv-beat.intro').map((r) => r.text().replace(/\s+/g, ' ').trim())
      w.unmount()
      return rows
    }
    const local = at({ tier: 'local', roundLabel: 'Quarterfinal' })
    const junior = at({ tier: 'j30', roundLabel: 'Quarterfinal' })
    const pro = at({ tier: 'w50', roundLabel: 'Quarterfinal' })
    const top = at({ tier: 'wta1000', roundLabel: 'Quarterfinal' })
    expect(local.length).toBeLessThan(junior.length)
    expect(junior.length).toBeLessThan(pro.length)
    expect(pro.length).toBeLessThan(top.length)
    // ...and the caller that has no tournament behind it still gets the thinnest one, never nothing.
    expect(at(null).length).toBe(local.length)
    // The numbers arrive at the W rungs and not before – the one content rule the ladder turns on.
    expect(junior.join(' ')).not.toMatch(/\d+%/)
    expect(pro.join(' ')).toMatch(/\d+%/)
    wrapperlessCheck(local, junior, pro, top)
  })

  // ⚠ ROUND 21 ITEM 3, AND IT IS THE WIRING GUARD RATHER THAN A SECOND COPY TEST. The rung ladder
  // inside the commentary builder is pinned in tests/viz/commentary.test.ts; what THIS asserts is the
  // one thing a unit test cannot - that the component actually hands the occasion over. The owner's
  // complaint («на 1000 и шлемах ... кажется ничего не изменилось») was true for two years' worth of
  // waves precisely because nobody was passing it, so a green builder beside a silent viewer is the
  // exact failure mode to guard. Drop the fourth argument from the `buildCommentary` call in
  // MatchViewer.vue and this goes red; the builder's own suite stays green.
  it('⚠ the BEAT rows change with the rung too, not only the intro – the occasion reaches the log', async () => {
    const { a, b, match } = fixture()
    const beatsAt = async (previewEvent: { tier: TierId; roundLabel: string } | null): Promise<string[]> => {
      const w = mount(MatchViewer, {
        props: { match, playerA: a, playerB: b, surface: 'hard' as const, mode: 'replay' as const, previewEvent },
      })
      await clickModeOn(w, SKIP_LABEL) // reveals the whole match, so every beat is on screen
      const rows = w.findAll('.mv-beat:not(.intro)').map((r) => r.text().replace(/\s+/g, ' ').trim())
      w.unmount()
      return rows
    }
    const junior = await beatsAt({ tier: 'j30', roundLabel: 'Round of 32' })
    const slam = await beatsAt({ tier: 'slam', roundLabel: 'Final' })
    expect(junior.length, 'no beats rendered at all').toBeGreaterThan(4)
    // Same match, same rows, DIFFERENT WORDS - the escalation is vocabulary, never row count.
    expect(slam.length).toBe(junior.length)
    const differing = junior.filter((row, i) => row !== slam[i]).length
    expect(differing, 'a Grand Slam final and a J30 first round rendered identically').toBeGreaterThan(1)
    // The two most specific things the occasion adds, seen through the DOM: the title on the line,
    // and a room that only exists at the top of the tour.
    expect(slam.join(' ')).toContain('the title with it')
    expect(junior.join(' ')).not.toContain('the title')
    expect(junior.join(' ')).toContain('a place in the round of 16')
    expect(junior.join(' '), 'a junior side court grew a crowd').not.toMatch(/crowd|stadium|applause/i)
  })

  it('an intro row is not a beat: no set label, no score, and it never takes the "latest" glow', () => {
    const wrapper = mountViewer()
    for (const row of wrapper.findAll('.mv-beat.intro')) {
      expect(row.find('.mv-beat-set').text(), 'an intro row claimed a set').toBe('')
      expect(row.find('.mv-beat-score').exists(), 'an intro row claimed a score').toBe(false)
      expect(row.classes(), 'an intro row took the newest-row glow').not.toContain('latest')
    }
    wrapper.unmount()
  })
})

/** Every intro row is a finished sentence at every storey – cheap, and it is the one copy rule that
 *  would show up as a broken row on the phone rather than as a failing string comparison. */
function wrapperlessCheck(...groups: string[][]): void {
  for (const group of groups) {
    for (const line of group) {
      expect(line.endsWith('.'), line).toBe(true)
      expect(line, 'player copy uses the short dash only').not.toContain('—')
    }
  }
}

async function clickModeOn(w: ReturnType<typeof mountViewer>, label: string): Promise<void> {
  const button = w.findAll('button').find((b) => b.text() === label)
  expect(button, `no "${label}" button`).toBeTruthy()
  await button!.trigger('click')
  await nextTick()
}

// =================================================================================================
// ROUND 17 #24 – THE ELAPSED MATCH TIME, AND THE TWO THINGS THAT MAKE IT HONEST.
//
// The owner's ⚠ was the whole item: the reading has to correlate with a real tennis match (a
// two-setter is not twenty minutes), and ×1 / ×2 / ×4 have to advance it at different rates. Both
// are properties of the RUNNING component and neither is visible in the source, so both are checked
// by turning the rAF clock by hand - the same fixture the score-readout bug needed.
// =================================================================================================
describe('the match clock measures the match, not the watching', () => {
  const clockText = (w: ReturnType<typeof mountViewer>): string => w.find('.mv-clock').text().trim()
  const clockSeconds = (w: ReturnType<typeof mountViewer>): number => {
    const [h, m, s] = clockText(w).split(':').map(Number)
    return h * 3600 + m * 60 + s
  }

  it("opens at zero and lands on the match's own duration - the number the box score prints", async () => {
    const { wrapper, match } = fixtureAndViewer()
    expect(clockText(wrapper), 'a match opens with time already on the clock').toBe('0:00:00')
    // Skip is the cheapest way to the end and it goes through the same `finished` path.
    const skip = wrapper.findAll('button').find((b) => b.text() === SKIP_LABEL)
    await skip!.trigger('click')
    await nextTick()
    expect(clockText(wrapper)).toBe(formatMatchClock(matchDurationSeconds(match)))
    // ...and that duration is a REAL tennis duration rather than the playback's. The engine's own
    // shortest matches are a little over three quarters of an hour and its longest run to under
    // three; anything outside that band means the model has come loose from what it was measured
    // against (tools/match-clock-probe.ts, 400 matches).
    const minutes = matchDurationSeconds(match) / 60
    expect(minutes, `a ${match.result.sets.length}-set match in ${minutes.toFixed(0)} minutes`).toBeGreaterThan(40)
    expect(minutes).toBeLessThan(180)
    // The playback it was watched at is nothing like that long, which is what "diegetic" means here.
    expect(buildTimeline(match, 'full').duration / 60).toBeLessThan(minutes / 3)
    wrapper.unmount()
  })

  it('⚠ ×1, ×2 and ×4 advance it at different rates, from the same number of frames', async () => {
    // One frame is a fixed slice of REAL time (MAX_FRAME_DT), so the same frame count at a higher
    // speed is more of the match - and the reading has to follow, because the player watching at ×4
    // is watching the same match go by four times as fast.
    //
    // ⚠ MEASURED IN 'Full', AND THE MODE IS THE POINT OF THE NOTE RATHER THAN A CONVENIENCE. In
    // 'key' the timeline skips most of the match, so a fixed number of playback seconds buys a wildly
    // varying amount of tennis - the reading is still strictly faster at every speed (asserted at the
    // bottom, in the default mode the owner actually watches in) but the RATIO over a short window is
    // not the speed ratio and asserting that it is would be a flaky test making a false claim.
    const readAfter = async (speedLabel: string, frames: number, mode = 'Full'): Promise<number> => {
      const d = (liveDriver = driver())
      const wrapper = mountViewer()
      await clickModeOn(wrapper, mode)
      const button = wrapper.findAll('button').find((b) => b.text() === speedLabel)
      await button!.trigger('click')
      await d.start()
      await d.frames(frames)
      const seconds = clockSeconds(wrapper)
      wrapper.unmount()
      d.restore()
      liveDriver = null
      return seconds
    }
    const one = await readAfter('1×', 60)
    const two = await readAfter('2×', 60)
    const four = await readAfter('4×', 60)
    expect(one, 'the clock did not move at all at ×1').toBeGreaterThan(0)
    expect(two, `×2 (${two}s) did not outrun ×1 (${one}s)`).toBeGreaterThan(one)
    expect(four, `×4 (${four}s) did not outrun ×2 (${two}s)`).toBeGreaterThan(two)
    // ...and roughly IN PROPORTION, which is the difference between "it moves faster" and "it is the
    // same clock". The band is wide because match-time-per-playback-second is not uniform (a set
    // break is two minutes of tennis in one beat of playback), not because the claim is soft.
    expect(two / one, `×2/×1 = ${(two / one).toFixed(2)}`).toBeGreaterThan(1.6)
    expect(two / one, `×2/×1 = ${(two / one).toFixed(2)}`).toBeLessThan(2.5)
    expect(four / one, `×4/×1 = ${(four / one).toFixed(2)}`).toBeGreaterThan(3.2)
    expect(four / one, `×4/×1 = ${(four / one).toFixed(2)}`).toBeLessThan(4.8)

    // And in the shipped default view - 'key' at ×2 - the ordering still holds, which is the claim
    // the owner will actually check.
    const keyOne = await readAfter('1×', 60, 'Key')
    const keyTwo = await readAfter('2×', 60, 'Key')
    const keyFour = await readAfter('4×', 60, 'Key')
    expect(keyTwo, `key ×2 (${keyTwo}s) did not outrun ×1 (${keyOne}s)`).toBeGreaterThan(keyOne)
    expect(keyFour, `key ×4 (${keyFour}s) did not outrun ×2 (${keyTwo}s)`).toBeGreaterThan(keyTwo)
  })

  it('⚠ ...and it keeps counting the points the KEY cut does not show', async () => {
    // The lie a per-timeline clock would tell: 'key' drops most of the points, so a reading that
    // advanced with the PLAYBACK would report a key watch as a three-minute match and a full watch of
    // the same tennis as a ten-minute one.
    // ⚠ PLAYED OUT FRAME BY FRAME, NOT SKIPPED. Skip's timeline is one beat long in every mode, so a
    // version of this test that reached the end through "Skip to the result" passed against a clock
    // that was reading the raw playback position - found by mutation, which is why it says so here.
    const readAtEnd = async (mode: string): Promise<string> => {
      const d = (liveDriver = driver())
      const wrapper = mountViewer()
      await clickModeOn(wrapper, mode)
      await d.start()
      for (let i = 0; i < 4000; i++) if (!(await d.frame())) break
      await nextTick()
      const text = clockText(wrapper)
      wrapper.unmount()
      d.restore()
      liveDriver = null
      return text
    }
    const full = await readAtEnd('Full')
    const key = await readAtEnd('Key')
    expect(full, 'the match took no time at all').not.toBe('0:00:00')
    expect(key, 'the same match took a different amount of time in the other mode').toBe(full)
  })
})

// =================================================================================================
// ROUND 17 #10 – THE MATCH DOES NOT EJECT HER, AND AN IN-MATCH INJURY SAYS SO WHERE SHE IS.
//
// The owner's ruling, in two halves that were one mechanism when they were broken: `finish` fired
// the instant the last beat played, the caller changed phase in the same flush, and the match screen
// was gone before it could paint its own box score - which is where round 16 put "she retired hurt".
// =================================================================================================
describe('a finished match waits for the player', () => {
  /** Playback all the way to the end, however many frames that takes. */
  async function runToEnd(d: ReturnType<typeof driver>): Promise<void> {
    await d.start()
    for (let i = 0; i < 4000; i++) if (!(await d.frame())) break
    await nextTick()
  }

  function mountWithProceed(over: Record<string, unknown> = {}) {
    const { a, b, match } = fixture()
    return mount(MatchViewer, {
      props: {
        match,
        playerA: a,
        playerB: b,
        surface: 'hard' as const,
        mode: 'replay' as const,
        proceedLabel: 'To the result',
        ...over,
      },
    })
  }

  it('⚠ does NOT emit finish when playback ends - it offers Proceed instead', async () => {
    const d = (liveDriver = driver())
    const wrapper = mountWithProceed()
    await runToEnd(d)
    expect(wrapper.emitted('finish'), 'the match ejected the player again').toBeUndefined()
    expect(wrapper.findAll('button').map((btn) => btn.text())).toContain('To the result')
    // ⚠ RE-AIMED 12.08: this used to pin the box score the eject once outran; the owner then had the
    // panel deleted («не нужна всё»), so what the un-ejected screen must still hold is the story
    // itself - the log, with the match's final beat already at its top.
    expect(wrapper.find('.mv-log').exists()).toBe(true)
    expect(wrapper.find('.mv-beat').text()).toContain('Match.')
    wrapper.unmount()
  })

  it('...and the speed and shout panel is replaced by that one button', async () => {
    const d = (liveDriver = driver())
    const wrapper = mountWithProceed({ mode: 'live' as const })
    const before = wrapper.findAll('button').map((btn) => btn.text())
    expect(before, 'the speed pills were never there to be replaced').toEqual(expect.arrayContaining(['1×', '4×']))
    expect(wrapper.find('.mv-shout').exists()).toBe(true)
    await runToEnd(d)
    const after = wrapper.findAll('button').map((btn) => btn.text())
    expect(after, 'a speed pill survived the end of the match').not.toContain('4×')
    expect(after, 'a resolution pill survived the end of the match').not.toContain('Full')
    expect(wrapper.find('.mv-shout').exists(), 'the shout survived the end of the match').toBe(false)
    expect(after).toContain('To the result')
    wrapper.unmount()
  })

  it('pressing Proceed is what emits finish, exactly once', async () => {
    const d = (liveDriver = driver())
    const wrapper = mountWithProceed()
    await runToEnd(d)
    const button = wrapper.findAll('button').find((btn) => btn.text() === 'To the result')
    await button!.trigger('click')
    expect(wrapper.emitted('finish')).toHaveLength(1)
    wrapper.unmount()
  })

  it('⚠ a caller with nowhere to proceed to keeps the old behaviour exactly', async () => {
    // MatchReplay and the Season sandbox pass no label: there is no screen after their match, so a
    // Proceed would be a control that does nothing. They still get the emit at the end of playback,
    // and they still get their own "Watch again".
    const d = (liveDriver = driver())
    const { a, b, match } = fixture()
    const wrapper = mount(MatchViewer, {
      props: { match, playerA: a, playerB: b, surface: 'hard' as const, mode: 'replay' as const },
    })
    await runToEnd(d)
    expect(wrapper.emitted('finish')).toHaveLength(1)
    const labels = wrapper.findAll('button').map((btn) => btn.text())
    expect(labels).not.toContain('To the result')
    expect(labels).toContain('Watch again ↻')
    wrapper.unmount()
  })

  it('...and a caller WITH one is offered exactly ONE "Watch again", in the row beside Proceed', async () => {
    // ⚠ RE-AIMED 12.08, AND THE OWNER REVERSED THE HALF THIS USED TO ASSERT. It read
    // `not.toContain('Watch again ↻')`, on R17 #10's argument that a flow's own box score already
    // offers a re-watch one press away. He looked at the shipped screen and asked for both here:
    // «можно сделать 2 кнопки рядом просто в этом нижнем блоке с контролами и все: Watch again |
    // Proceed». So the row holds the two things you can do with a match you have just watched.
    // THE PROTECTED FACT IS THE ONE THAT MATTERED and it is asserted harder than before: there is
    // still never a SECOND "Watch again" - the count is pinned, not just its absence - and the
    // affirmative is still last, which is the app's own action-row order.
    const d = (liveDriver = driver())
    const wrapper = mountWithProceed()
    await runToEnd(d)
    const labels = wrapper.findAll('button').map((btn) => btn.text())
    expect(labels.filter((t) => t === 'Watch again ↻')).toHaveLength(1)
    expect(labels).toContain('To the result')
    expect(labels.indexOf('To the result')).toBeGreaterThan(labels.indexOf('Watch again ↻'))
    // ...and both of them are in the control row itself, which is the whole of the ask: the block
    // swaps its contents where it stands rather than growing a second one.
    const done = wrapper.find('.mv-controls-done')
    expect(done.exists()).toBe(true)
    expect(done.findAll('button')).toHaveLength(2)
    wrapper.unmount()
  })

  it('⚠ the panel under the bar is GONE, and the control row it hid behind is untouched (12.08)', async () => {
    // ⚠ RE-AIMED 12.08, AND THE RE-AIM IS THE OWNER'S SECOND RULING ON THE SAME PANEL: «просто вот
    // эта нижняя "борода" под кнопками на экране матча не нужна всё». This test used to pin the
    // card's PRESENCE, because it carried the only sentence explaining an OPPONENT's retirement
    // (`.mv-hurt` is raised for HER only) and deleting it would have re-opened round 16's report.
    // That objection is closed: the commentary's own final beat says it now - "Retired. X cannot go
    // on. Y advances." (viz/commentary.ts) - on this same screen, and its VISIBILITY at end-of-match
    // is the pinned claim that replaced this card (the retirement tests below, and
    // tests/component/injury-surfacing.test.ts on a real engine retirement). So the protected facts
    // are: no stats panel under the finished bar, and the bar itself exactly as ruled - two buttons,
    // same place, nothing else grown around them.
    const d = (liveDriver = driver())
    const wrapper = mountWithProceed()
    await runToEnd(d)
    expect(wrapper.find('.mv-boxscore').exists(), 'the deleted panel grew back under the bar').toBe(false)
    const done = wrapper.find('.mv-controls-done')
    expect(done.exists()).toBe(true)
    expect(done.findAll('button').map((btn) => btn.text())).toEqual(['Watch again ↻', 'To the result'])
    wrapper.unmount()
  })
})

describe('an in-match injury raises its popup without ejecting her', () => {
  /** The same fixture with HER in it and a retirement on the record. `result.retired` is the only
   *  fact the viewer reads about it, and the engine writes exactly this shape (match/types.ts). */
  function retiredFixture(side: Side) {
    const { a, b, match } = fixture()
    const her = { ...a, id: KID_ID, name: 'Olivia Grant' }
    const hurt: AnnotatedMatch = {
      ...match,
      result: { ...match.result, retired: { side, pointNumber: match.points.length } },
    }
    return { her, opp: b, match: hurt }
  }

  function mountHurt(match: AnnotatedMatch, her: MatchPlayer, opp: MatchPlayer) {
    return mount(MatchViewer, {
      props: {
        match,
        playerA: her,
        playerB: opp,
        surface: 'hard' as const,
        mode: 'replay' as const,
        proceedLabel: 'To the result',
      },
    })
  }

  /** Straight to the end of the match, through the same `finished` path playback reaches. */
  async function playOut(w: ReturnType<typeof mountViewer>): Promise<void> {
    const skip = w.findAll('button').find((btn) => btn.text() === SKIP_LABEL)
    await skip!.trigger('click')
    await nextTick()
  }

  it('⚠ SHE stopped: the popup is up, and the match screen is still under it', async () => {
    const { her, opp, match } = retiredFixture(0)
    const wrapper = mountHurt(match, her, opp)
    await playOut(wrapper)
    const dialog = wrapper.find('.mv-hurt')
    expect(dialog.exists(), 'no popup for an injury inside the match').toBe(true)
    expect(dialog.text()).toContain('Olivia Grant could not continue')
    // The reason is the one the model can support - see RETIREMENT_REASON and round16-commentary §2.
    expect(dialog.text()).toContain('tired legs')
    // NOT ejected: the court and the log are still mounted behind it, and the parent has not been
    // told to change screens. (⚠ RE-AIMED 12.08: the box score used to be the third witness here;
    // the owner had the panel deleted, and the log now carries the record it held.)
    expect(wrapper.find('canvas').exists()).toBe(true)
    expect(wrapper.find('.mv-log').exists()).toBe(true)
    expect(wrapper.emitted('finish')).toBeUndefined()
    wrapper.unmount()
  })

  it('...and dismissing it leaves her exactly where she was', async () => {
    const { her, opp, match } = retiredFixture(0)
    const wrapper = mountHurt(match, her, opp)
    await playOut(wrapper)
    const stay = wrapper.findAll('button').find((btn) => btn.text() === 'Stay with her')
    await stay!.trigger('click')
    await nextTick()
    expect(wrapper.find('.mv-hurt').exists()).toBe(false)
    // ⚠ RE-AIMED 12.08 with the panel's deletion: "where she was" is the match screen - the log and
    // its final beat - not the deleted stats card.
    expect(wrapper.find('.mv-log').exists(), 'dismissing the popup took the match away too').toBe(true)
    expect(wrapper.emitted('finish')).toBeUndefined()
    wrapper.unmount()
  })

  it('⚠ the OPPONENT stopping is not an injury to this family, and raises nothing', async () => {
    const { her, opp, match } = retiredFixture(1)
    const wrapper = mountHurt(match, her, opp)
    await playOut(wrapper)
    expect(wrapper.find('.mv-hurt').exists(), 'the opponent retiring raised OUR injury popup').toBe(false)
    // ⚠ RE-AIMED 12.08: the deleted box score's "X retired hurt." was the only sentence explaining
    // an opponent's retirement when this pin was written. The witness that replaced it is the
    // commentary's final beat, at the TOP of the log the moment the match ends - this assertion is
    // the claim that licensed deleting the card, so it may move again only with its replacement
    // named. (injury-surfacing.test.ts asserts the same on a real engine retirement.)
    const latest = wrapper.find('.mv-beat')
    expect(latest.text()).toContain('Retired.')
    expect(latest.text()).toContain('cannot go on')
    wrapper.unmount()
  })

  it('a match with nobody hurt raises nothing, so the pin above is not vacuous', async () => {
    const { her, opp } = retiredFixture(0)
    const { match } = fixture()
    const wrapper = mountHurt(match, her, opp)
    await playOut(wrapper)
    expect(wrapper.find('.mv-hurt').exists()).toBe(false)
    wrapper.unmount()
  })
})
