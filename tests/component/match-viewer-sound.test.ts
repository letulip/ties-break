// ROUND 16 ITEM 12 – the `out` call at ×2, at half the ×1 rate (owner, 11.08).
//
// ⚠ ITS OWN FILE BECAUSE OF THE MOCK. `vi.mock` is hoisted to the top of the module it appears in and
// applies to every test in that file, and `tests/component/match-viewer.test.ts` is a mutation-verified
// characterization net whose whole value is that it exercises the real component with real imports.
// Stubbing its audio layer to count calls would quietly change what that net is testing. So the sound
// matrix gets a file, and the net keeps its imports.
//
// ⚠ AND IT IS BEHAVIOURAL, not a source pin: the component is mounted, the speed pill is clicked, the
// clock is driven to the end of a real match, and the cues that actually fired are counted. A source
// pin here would have passed against a `gatedSfx` that never reached the new branch.
import { describe, it, expect, vi, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import MatchViewer from '../../src/components/MatchViewer.vue'
import { simulateMatch } from '../../src/engine/match/engine'
import { annotateMatch } from '../../src/engine/match/rally'
import { JUNIOR_TOUR } from '../../src/engine/season/tournament'
import { playSfx } from '../../src/audio/sfx'
import type { MatchOptions, MatchPlayer } from '../../src/engine/match/types'

vi.mock('../../src/audio/sfx', () => ({
  initSfx: vi.fn(),
  primeSfx: vi.fn(),
  playSfx: vi.fn(),
  isMuted: () => false,
  setMuted: vi.fn(),
  installGlobalSfx: vi.fn(),
}))

const played = vi.mocked(playSfx)

/** MAX_FRAME_DT clamps a frame at 0.25s, so stepping exactly that is the largest honest step. */
const FRAME_MS = 250
const SEATS_HOLD_MS = 2000

function player(over: Partial<MatchPlayer> = {}): MatchPlayer {
  return { id: 'p', name: 'P', serve: 50, ret: 50, composure: 50, stamina: 50, groundstrokes: 50, ...over }
}

/** ONE match, played at two different speeds - so the number of out/net POINTS is identical and the
 *  only thing that can differ is how often the call was allowed through. */
function fixture() {
  const a = player({ id: 'a', name: 'Vera Novak', serve: 62 })
  const b = player({ id: 'b', name: 'Ines Duval', serve: 48 })
  const opts: MatchOptions = { surface: 'hard', tour: JUNIOR_TOUR, seed: 'sound-fixture' }
  return { a, b, match: annotateMatch(simulateMatch(a, b, opts), a, b, opts) }
}

let restore: (() => void) | null = null
afterEach(() => {
  restore?.()
  restore = null
  played.mockClear()
})

/** Mount, pick a speed, and run the whole match. Returns how many `out` calls were let through. */
async function outCallsAt(label: '1×' | '2×'): Promise<number> {
  const realRaf = globalThis.requestAnimationFrame
  const realCaf = globalThis.cancelAnimationFrame
  vi.useFakeTimers()
  let pending: FrameRequestCallback | null = null
  let now = 0
  globalThis.requestAnimationFrame = (cb: FrameRequestCallback): number => {
    pending = cb
    return 1
  }
  globalThis.cancelAnimationFrame = (): void => {
    pending = null
  }
  restore = () => {
    vi.useRealTimers()
    globalThis.requestAnimationFrame = realRaf
    globalThis.cancelAnimationFrame = realCaf
  }

  const { a, b, match } = fixture()
  const wrapper = mount(MatchViewer, {
    props: { match, playerA: a, playerB: b, surface: 'hard' as const, mode: 'replay' as const },
  })
  const speed = wrapper.findAll('button').find((x) => x.text() === label)
  expect(speed, `no "${label}" speed pill`).toBeTruthy()
  await speed!.trigger('click')
  await nextTick()

  // Playback starts on mount behind the pre-match hold (`startClock`), so there is no play control
  // to press - stepping past the hold is what lets the clock loop begin.
  played.mockClear()
  vi.advanceTimersByTime(SEATS_HOLD_MS)
  await nextTick()

  // ⚠ THE PUMP IS ITS OWN FUNCTION, and that is a type-checking requirement rather than tidiness.
  // `pending` is only ever assigned from inside the rAF stub, so in the enclosing scope control-flow
  // analysis still holds its `= null` initialiser: reading it there narrows to `null`, an annotation
  // does not help (assignment narrowing re-applies it), `if (!cb) break` then makes the rest
  // unreachable, and `cb(now)` fails to compile as a call on `never`. Narrowing resets at a function
  // boundary, which is exactly why the driver in match-viewer.test.ts pumps from a method.
  const frame = async (): Promise<boolean> => {
    const cb = pending
    if (!cb) return false
    pending = null
    now += FRAME_MS
    cb(now)
    await nextTick()
    return true
  }
  // Run to the end of the match. The cap is generous and is a guard against an infinite loop, not a
  // budget: a finished match stops asking for frames and the loop leaves on its own.
  for (let i = 0; i < 20000; i++) if (!(await frame())) break
  const calls = played.mock.calls.filter((c) => c[0] === 'out').length
  wrapper.unmount()
  return calls
}

describe('MatchViewer – the `out` call reaches ×2, at half the ×1 rate (item 12)', () => {
  it('⚠ fires at ×2 at all – it used to be silent above ×1', async () => {
    const atTwo = await outCallsAt('2×')
    expect(atTwo, 'the out call is still silent at double speed').toBeGreaterThan(0)
  })

  it('⚠ ...and roughly half as often as at ×1, over the same match', async () => {
    const atOne = await outCallsAt('1×')
    restore?.()
    restore = null
    const atTwo = await outCallsAt('2×')
    // Both runs cover the SAME match, so the population of out/net points is identical and the only
    // variable is the gate. The band is wide because the threshold is a 3-5 draw walked at two
    // different step sizes, so the halving is a rate rather than an exact division.
    expect(atOne, 'the ×1 baseline vanished').toBeGreaterThan(4)
    const ratio = atTwo / atOne
    expect(ratio, `×2 fired ${atTwo} times against ×1's ${atOne}`).toBeGreaterThan(0.25)
    expect(ratio, `×2 fired ${atTwo} times against ×1's ${atOne}`).toBeLessThan(0.75)
  })
})
