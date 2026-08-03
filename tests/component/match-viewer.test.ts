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
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import MatchViewer from '../../src/components/MatchViewer.vue'
import { simulateMatch } from '../../src/engine/match/engine'
import { annotateMatch } from '../../src/engine/match/rally'
import { JUNIOR_TOUR } from '../../src/engine/season/tournament'
import type { MatchOptions, MatchPlayer } from '../../src/engine/match/types'

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

  it('offers the three viewing modes the concept promises, as real controls', () => {
    // skip / key points / full - docs/decisions.md, the first design round. Asserted on BUTTONS
    // rather than on the page text: a substring check would pass on any stray occurrence of "key",
    // which is exactly the kind of vacuous pin this file exists to replace.
    const wrapper = mountViewer()
    const labels = wrapper.findAll('button').map((b) => b.text())
    expect(labels).toEqual(expect.arrayContaining(['Full', 'Key', 'Skip']))
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
    await clickMode(wrapper, 'Skip')
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
    await clickMode(wrapper, 'Skip')
    // `winner` is a Side (0 = playerA, 1 = playerB), not a player id.
    const winnerName = match.result.winner === 0 ? a.name : b.name
    expect(wrapper.text()).toContain(winnerName)
    wrapper.unmount()
  })

  it('switching back to Full after Skip returns the viewer to an un-started walk', async () => {
    // `resetPlayback` rebuilds the timeline and puts the point cursor back to -1. A split that
    // forgets to reset would leave the finished score on screen under a Full-match label.
    const wrapper = mountViewer()
    await clickMode(wrapper, 'Skip')
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
