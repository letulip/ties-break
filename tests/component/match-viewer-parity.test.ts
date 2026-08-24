// FIXED-RECORD PARITY – the net that lets MatchViewer's clock and audio move out of the SFC.
//
// ⚠ WHAT THIS FILE IS. R2-11 splits the viewer into a playback/visibility clock, an audio-cue owner
// and a prop-driven control bar. That is an OWNERSHIP refactor: the same match must play back the
// same way and the same cues must fire at the same moments. `tests/component/match-viewer.test.ts`
// is the characterization net for what the screen SAYS; this file is the net for the SEQUENCE – it
// drives one recorded match frame by frame and writes down everything that left the component on
// every single paint, then compares the whole run against a record frozen BEFORE the split.
//
// ⚠ HOW A "RECORDED MATCH" WORKS HERE, and it is the repo's own mechanism rather than a new one.
// `MatchReplay.vue` re-watches a stored `WorldMatch` by re-running `simulateMatch(a, b, opts)` under
// the SAME stored seed – a pure function, so the match reproduces byte for byte and nothing about it
// is stored except the seed and the two skill snapshots. `RECORD` below is exactly that: a frozen
// `WorldMatch`-shaped literal, rebuilt through the MatchReplay recipe. A JSON dump of 200 annotated
// points would have been the same data, thirty times larger, and rottable against the engine.
//
// ⚠ WHAT IS CAPTURED PER PAINT: every sfx cue (with its rate), every music duck/restore, every emit,
// and the four readings the player can actually see move – the point score, the diegetic clock, the
// set cells and the serving end. `hash` is over ALL of it, every paint, unabridged. The three logs
// beside it exist so a red run is READABLE rather than a changed hex string: `cueLog` is every cue
// with the paint it fired on, `viewLog` is every paint where the visible readout stepped, and
// `clockSamples` is the diegetic clock every hundredth paint. A cue that moves by ONE paint moves
// `cueLog` and the hash.
//
// ⚠ WHAT IT CANNOT SEE, stated so nobody reads more into a green run than is there: the granularity
// is ONE PAINT. Two effects inside a single click handler are ordered relative to each other but not
// relative to any observation, so swapping them leaves the record byte-identical – measured, on the
// view pill's `emit`/`playSfx` pair, and correct: the setting's consequence is a pre-flush watcher
// and runs after the handler returns either way. Anything that changes WHICH cue fires, HOW MANY
// times, on WHICH paint, or what the readout says on any paint, does move it.
//
// ⚠ REGENERATING IS DELIBERATE AND LOUD: `TB_WRITE_MATCH_PARITY=1 npx vitest run --project component
// tests/component/match-viewer-parity.test.ts` rewrites the fixture. Do that only when the owner has
// agreed the behaviour itself moved; a refactor that needs it has changed behaviour, and THAT is the
// finding.
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'
import MatchViewer from '../../src/components/MatchViewer.vue'
import { simulateMatch } from '../../src/engine/match/engine'
import { annotateMatch } from '../../src/engine/match/rally'
import { JUNIOR_TOUR } from '../../src/engine/season/tournament'
import { playSfx } from '../../src/audio/sfx'
import { duck, restore } from '../../src/audio/music'
import { fnv1aHex } from '../helpers/hash'
import type { MatchOptions, MatchPlayer, Surface } from '../../src/engine/match/types'

// The whole audio layer is stubbed so the cues can be COUNTED and ORDERED. Both modules are replaced
// wholesale rather than spied through `importOriginal`: `audio/music.ts` installs a module-level
// visibilitychange listener at import time, and a second listener racing the component's own is
// exactly the kind of thing a parity record must not contain.
vi.mock('../../src/audio/sfx', () => ({
  initSfx: vi.fn(),
  primeSfx: vi.fn(),
  playSfx: vi.fn(),
  isMuted: () => false,
  setMuted: vi.fn(),
  installGlobalSfx: vi.fn(),
}))
vi.mock('../../src/audio/music', () => ({
  isMusicMuted: () => true,
  setMusicMuted: vi.fn(),
  start: vi.fn(),
  duck: vi.fn(),
  restore: vi.fn(),
}))

const played = vi.mocked(playSfx)
const ducked = vi.mocked(duck)
const restored = vi.mocked(restore)

/** MAX_FRAME_DT (MatchViewer) clamps a frame at 0.25s of real time; stepping exactly that makes each
 *  paint worth exactly `0.25 × speed` seconds of timeline, so the walk has no wall clock in it. */
const FRAME_MS = 250
/** SEATS_PREROLL_MS / min(speed, 2) is 3600ms at ×1 and 1800ms at ×2; round up past the slower one. */
const SEATS_HOLD_MS = 4000
/** A guard against an infinite loop, not a budget: a finished match stops asking for frames. */
const FRAME_CAP = 20000

// ⚠ `resolve(process.cwd(), …)` RATHER THAN `new URL(…, import.meta.url)`: the component project runs
// under happy-dom, whose global `URL` is the DOM one, and `readFileSync` rejects what it produces
// ("The URL must be of scheme file"). The house idiom in `tests/component/` for the same reason.
const FIXTURE_DIR = resolve(process.cwd(), 'tests/fixtures/match-parity')
const FIXTURE = resolve(FIXTURE_DIR, 'viewer-run.json')
const WRITING = process.env.TB_WRITE_MATCH_PARITY === '1'

// -------------------------------------------------------------------------------------------------
// THE RECORD. A `WorldMatch`-shaped literal – seed, surface and the two skill snapshots – which is
// everything the engine needs to reproduce the match exactly (see the header).
// -------------------------------------------------------------------------------------------------
const RECORD = {
  seed: 'parity-record-r2-11',
  surface: 'hard' as Surface,
  a: { id: 'a', name: 'Vera Novak', serve: 62, ret: 50, composure: 50, stamina: 50, groundstrokes: 50 },
  b: { id: 'b', name: 'Ines Duval', serve: 48, ret: 50, composure: 50, stamina: 50, groundstrokes: 50 },
} satisfies { seed: string; surface: Surface; a: MatchPlayer; b: MatchPlayer }

function recordedMatch() {
  const opts: MatchOptions = { surface: RECORD.surface, tour: JUNIOR_TOUR, seed: RECORD.seed }
  return annotateMatch(simulateMatch(RECORD.a, RECORD.b, opts), RECORD.a, RECORD.b, opts)
}

// -------------------------------------------------------------------------------------------------
// THE DRIVER. `requestAnimationFrame` becomes a queue of one and the test hands out the timestamps,
// so one `frame()` is one paint – the same fixture `tests/component/match-viewer.test.ts` uses.
// -------------------------------------------------------------------------------------------------
function driver() {
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
    async start(): Promise<void> {
      vi.advanceTimersByTime(SEATS_HOLD_MS)
      await nextTick()
    },
    async frame(): Promise<boolean> {
      const cb = pending
      if (!cb) return false
      pending = null
      now += FRAME_MS
      cb(now)
      await nextTick()
      return true
    },
    restore(): void {
      vi.useRealTimers()
      globalThis.requestAnimationFrame = realRaf
      globalThis.cancelAnimationFrame = realCaf
    },
  }
}

let liveDriver: ReturnType<typeof driver> | null = null
beforeEach(() => {
  played.mockClear()
  ducked.mockClear()
  restored.mockClear()
})
afterEach(() => {
  liveDriver?.restore()
  liveDriver = null
  vi.useRealTimers()
})

type Wrapper = ReturnType<typeof mount>

/** Everything that left the component since the last paint, as one canonical token. */
function drained(): string {
  const cues = played.mock.calls.map((c) => (c[1]?.rate ? `${c[0]}@${c[1].rate}` : String(c[0])))
  for (let i = 0; i < ducked.mock.calls.length; i++) cues.push('music:duck')
  for (let i = 0; i < restored.mock.calls.length; i++) cues.push('music:restore')
  played.mockClear()
  ducked.mockClear()
  restored.mockClear()
  return cues.join(',')
}

/** The three readings that step with the match – score, set cells, serving end. */
function viewReading(w: Wrapper): string {
  const score = w.find('.mv-score')
  const cells = w.findAll('.mv-cell').map((c) => c.text()).join('/')
  const ends = w.findAll('.ends-labels span').map((s) => s.text().replace(/\s+/g, ' ')).join('|')
  return [score.exists() ? score.text().replace(/\s+/g, '') : '-', cells, ends].join(';')
}
/** The diegetic clock, which moves on ALMOST every paint – hence its own log (see `frozen`). */
function clockReading(w: Wrapper): string {
  const clock = w.find('.mv-clock')
  return clock.exists() ? clock.text() : '-'
}

interface Arm {
  /** every paint, in order: `frame|cues|view|clock|emits`. Hashed whole; never written out. */
  lines: string[]
  hash: string
  frames: number
  /** `<paint>:<cue>` for every cue that fired, in order – "the same cues at the same moments" */
  cueLog: string[]
  cueCounts: Record<string, number>
  /** `<paint>|<view>` for every paint whose visible reading differs from the one before it */
  viewLog: string[]
  /** `<paint>:<clock>` every hundredth paint plus the last – the clock in full is in the hash */
  clockSamples: string[]
  emits: { finish: number; endApplause: number }
}

/** The half of the viewer's props an arm chooses. `mode` is REQUIRED by the component and is spelled
 *  out here rather than spread from a bag: a `Record<string, unknown>` spread would hide a missing
 *  required prop from `vue-tsc`, which is the trap the prop's own comment is about. */
interface ArmProps {
  mode: 'live' | 'replay'
  finalMatch?: boolean
  proceedLabel?: string | null
  temperatureC?: number | null
}

/** One run of the recorded match, captured paint by paint. `script` may click controls at a frame. */
async function runArm(
  props: ArmProps,
  script: { atFrame: number; label: string }[] = [],
  preClicks: string[] = [],
): Promise<Arm> {
  const d = driver()
  liveDriver = d
  const wrapper = mount(MatchViewer, {
    props: { match: recordedMatch(), playerA: RECORD.a, playerB: RECORD.b, surface: RECORD.surface, ...props },
  })
  const click = async (label: string): Promise<void> => {
    const btn = wrapper.findAll('button').find((b) => b.text() === label)
    expect(btn, `no control labelled "${label}"`).toBeTruthy()
    await btn!.trigger('click')
    await nextTick()
  }
  for (const label of preClicks) await click(label)

  const lines: string[] = []
  const cueLog: string[] = []
  const viewLog: string[] = []
  const clockSamples: string[] = []
  let lastView = ''
  const paint = (label: string, n: number): void => {
    const cues = drained()
    for (const cue of cues ? cues.split(',') : []) cueLog.push(`${label}:${cue}`)
    const view = viewReading(wrapper)
    if (view !== lastView) {
      viewLog.push(`${label}|${view}`)
      lastView = view
    }
    const clock = clockReading(wrapper)
    if (n % 100 === 0) clockSamples.push(`${label}:${clock}`)
    const emitted = wrapper.emitted()
    lines.push(`${label}|${cues}|${view}|${clock}|${emitted.finish?.length ?? 0}/${emitted.endApplause?.length ?? 0}`)
  }

  // Mount work (the pre-roll cue, the prime) is part of the record: paint 0 is "before any frame".
  paint('0', 0)
  await d.start()
  paint('s', -1)

  let i = 0
  for (; i < FRAME_CAP; i++) {
    for (const step of script) if (step.atFrame === i) await click(step.label)
    if (!(await d.frame())) break
    paint(String(i + 1), i + 1)
  }
  clockSamples.push(`last:${clockReading(wrapper)}`)
  const emitted = wrapper.emitted()
  const arm: Arm = {
    lines,
    hash: '',
    frames: i,
    cueLog,
    cueCounts: cueLog.reduce<Record<string, number>>((acc, entry) => {
      const key = entry.slice(entry.indexOf(':') + 1)
      return { ...acc, [key]: (acc[key] ?? 0) + 1 }
    }, {}),
    viewLog,
    clockSamples,
    emits: { finish: emitted.finish?.length ?? 0, endApplause: emitted.endApplause?.length ?? 0 },
  }
  wrapper.unmount()
  // The unmount's own teardown (the music restore) closes the record.
  const teardown = drained()
  for (const cue of teardown ? teardown.split(',') : []) arm.cueLog.push(`unmount:${cue}`)
  for (const cue of teardown ? teardown.split(',') : []) arm.cueCounts[cue] = (arm.cueCounts[cue] ?? 0) + 1
  lines.push(`unmount|${teardown}`)
  arm.hash = fnv1aHex(lines.join('\n'))
  d.restore()
  liveDriver = null
  return arm
}

/** What goes in the fixture. The per-paint list itself is 500-3,200 lines of mostly the diegetic
 *  clock ticking, so it is HASHED rather than written out; the three logs beside the hash are what a
 *  human reads when the hash goes red. */
function frozen(arm: Arm) {
  return {
    frames: arm.frames,
    hash: arm.hash,
    cueTotal: arm.cueLog.length,
    cueCounts: arm.cueCounts,
    emits: arm.emits,
    clockSamples: arm.clockSamples,
    cueLog: arm.cueLog,
    viewLog: arm.viewLog,
  }
}

const ARMS: Record<string, () => Promise<Arm>> = {
  // The opening every player gets: the settings defaults, which with no localStorage written are
  // 'key' at ×2 (composables/matchDefaults). A replay with nowhere to proceed to.
  'default-key-x2-replay': () => runArm({ mode: 'replay' as const }),
  // ×1 and every point, live, and a FINAL – so the record contains the whole ×1 cue matrix (out, ooh,
  // gameEnd, setEnd/setEndTiebreak) and the `applauseFinal` + `endApplause` pair that R10-6 moved to
  // the deciding point. A `proceedLabel` means `finish` waits for the press, so the record also pins
  // that the emit does NOT fire on its own.
  'full-x1-live-final': () => runArm(
    { mode: 'live' as const, finalMatch: true, proceedLabel: 'Continue', temperatureC: 24 },
    [],
    ['Full', '1×'],
  ),
  // The mode change mid-watch (retimeForMode): 'key' at ×2 for forty paints, then 'Full', then on to
  // the end. It is the one path that rebuilds the timeline WITHOUT restarting the run, so it is the
  // one most likely to move under a clock extraction.
  'key-then-full-midrun': () => runArm({ mode: 'replay' as const }, [{ atFrame: 40, label: 'Full' }]),
}

describe('MatchViewer – the recorded match plays back identically (R2-11 parity)', () => {
  it('the record reproduces itself, or every arm below is measuring noise', () => {
    const one = recordedMatch()
    const two = recordedMatch()
    expect(two.points.length).toBe(one.points.length)
    expect(two.result.sets).toEqual(one.result.sets)
    expect(two.result.winner).toBe(one.result.winner)
    // ...and it is a real match rather than a two-point stub, so the sequence has something in it.
    expect(one.points.length).toBeGreaterThan(80)
  })

  it('every arm emits the frozen cue/frame sequence, paint for paint', async () => {
    const captured: Record<string, ReturnType<typeof frozen>> = {}
    for (const [name, run] of Object.entries(ARMS)) captured[name] = frozen(await run())

    if (WRITING) {
      mkdirSync(FIXTURE_DIR, { recursive: true })
      writeFileSync(FIXTURE, JSON.stringify(captured, null, 2) + '\n')
      // Loud on purpose: a run that WROTE the record has not checked anything.
      console.warn(`[parity] rewrote ${FIXTURE} – this run asserted nothing`)
      return
    }

    expect(existsSync(FIXTURE), `no frozen record at ${FIXTURE}`).toBe(true)
    const golden = JSON.parse(readFileSync(FIXTURE, 'utf8')) as Record<string, ReturnType<typeof frozen>>
    expect(Object.keys(captured).sort()).toEqual(Object.keys(golden).sort())
    for (const name of Object.keys(golden)) {
      // The readable halves first, so a red run says WHAT moved before it says that something did.
      expect(captured[name].cueCounts, `${name}: the cue MIX moved`).toEqual(golden[name].cueCounts)
      expect(captured[name].emits, `${name}: the emits moved`).toEqual(golden[name].emits)
      expect(captured[name].frames, `${name}: the run is a different length`).toBe(golden[name].frames)
      expect(captured[name].cueLog, `${name}: a cue fired on a different PAINT`).toEqual(golden[name].cueLog)
      expect(captured[name].viewLog, `${name}: the readout stepped differently`).toEqual(golden[name].viewLog)
      expect(captured[name].clockSamples, `${name}: the diegetic clock drifted`).toEqual(golden[name].clockSamples)
      // ...and the hash is over EVERY paint, including the ones the three logs above skip.
      expect(captured[name].hash, `${name}: the full per-paint sequence moved`).toBe(golden[name].hash)
    }
  }, 120_000)

  it('...and the record is not vacuous: it contains a real cue mix and a real walk', () => {
    const golden = JSON.parse(readFileSync(FIXTURE, 'utf8')) as Record<string, ReturnType<typeof frozen>>
    const one = golden['default-key-x2-replay']
    expect(one.frames, 'a run of a handful of paints would pin nothing').toBeGreaterThan(100)
    expect(one.cueTotal, 'a silent run would pin no audio at all').toBeGreaterThan(50)
    expect(one.viewLog.length, 'a record whose readout never moved is a still image').toBeGreaterThan(50)
    const full = golden['full-x1-live-final']
    // ×1 is the only speed that plays the whole matrix, and the final's own cue is the R10-6 fact.
    expect(Object.keys(full.cueCounts)).toEqual(expect.arrayContaining(['hit', 'applauseFinal']))
    expect(full.emits.endApplause, 'the final never clapped').toBeGreaterThan(0)
    expect(full.emits.finish, 'a proceedLabel caller must NOT be ejected').toBe(0)
    // ...and the ducking is refcount-balanced across the whole run, which is the leak R6 was about.
    expect(one.cueCounts['music:duck'] ?? 0).toBe(one.cueCounts['music:restore'] ?? 0)
  })
})
