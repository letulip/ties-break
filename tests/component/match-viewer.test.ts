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
import type { AnnotatedMatch } from '../../src/viz/types'
import type { MatchOptions, MatchPlayer, Side } from '../../src/engine/match/types'

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

/** The counter under the court, whitespace stripped: "0-40", "40-A", "TB3-2", "138 points". */
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
    expect(scoreText(wrapper)).toBe(`${match.points.length}points`)
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
  const logRows = (w: ReturnType<typeof mountViewer>): string[] =>
    w.findAll('.mv-beat').map((r) => r.text().replace(/\s+/g, ' ').trim())

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
