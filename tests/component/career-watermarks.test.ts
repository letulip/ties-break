// =================================================================================================
// R2-08 — THE CAREER WATERMARK, AS BEHAVIOUR RATHER THAN AS SIX COPIES OF A PARAGRAPH
// =================================================================================================
//
// App.vue hand-rolled this six times: the This-week dot, the trophy cabinet, the season-wrap recap,
// the injury report, the college card and the Season tab's dot each owned a key, a `getItem` at
// setup, a `setItem` on dismiss and a `watch` on `careerId` to re-read. All six are one
// `useWatermark` call now, and this file is the reason that is safe to have done: App.vue is mounted
// by no test in this repo (CLAUDE.md: a source pin "proves nothing about behaviour"), so before this
// move the ONLY evidence that any of them re-read on a career switch was the text of the shell.
//
// ⚠ THREE PROPERTIES ARE PINNED HERE, and they are the three the consolidation was asked to prove:
//
//   1. CAREER SWITCHING – marks must not leak between careers. This is the bug class the primitive
//      exists for (R9-21b) and it is not hypothetical: the Season tab's dot was STILL carrying it
//      when this wave opened. Its key was a bare `tb:lastSeenSeasonWeek` with no career on it and a
//      WEEK NUMBER under it, so a week-90 career's visit marked a week-12 career's calendar read.
//      The last test in this file is that defect, reproduced against the old shape and then against
//      the new one.
//
//   2. THE MISSING-KEY POLICY – both halves of it. The app holds two OPPOSITE answers to "what does
//      an absent key mean" and each is correct for its own surface: CLAIM NOTHING for the dots (a
//      cabinet that cannot know whether it was opened must not say it was) and a SENTINEL for the
//      reports (a popup that cannot know whether she was told she is hurt must assume she was not).
//      Flattening them is the failure this parameter exists to prevent, so both are pinned, together
//      with the seeding write that only the claim-nothing form performs.
//
//   3. STORAGE EXCEPTIONS – a private-mode browser throws on `localStorage`, and every one of those
//      six reads ran at `<script setup>` time, ABOVE every screen. One throw took the whole app out
//      rather than one dot. Nothing in the shell touches storage now, and the helper swallows both
//      directions.
//
// ⚠ MUTATION-VERIFIED. Each block names the edit that was made to the source to watch it fail; the
// arms are listed in the wave report. A test that cannot fail on the broken version is not this test.
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { computed, defineComponent, h, nextTick, ref, type ComputedRef } from 'vue'
import { careerKey, useDeviceFlag, useWatermark, type Watermark } from '../../src/composables/inboxCue'
import { useGameStore } from '../../src/stores/game'
import type { Snapshot } from '../../src/shared/protocol'

// --- the storage shim ----------------------------------------------------------------------------
//
// ⚠ THIS RUNNER HAS NO localStorage, the same finding tour-briefing.test.ts and a11y-sweep.test.ts
// record: happy-dom is configured here without web storage. Supplying the browser's own object is
// the fix rather than weakening the code to suit the runner. `mode` is what makes property 3
// testable at all – a real private-mode browser is a `localStorage` that THROWS, not one that is
// absent, and those are different failures.
let mode: 'ok' | 'throws' = 'ok'
const backing = new Map<string, string>()
Object.defineProperty(globalThis, 'localStorage', {
  configurable: true,
  value: {
    getItem: (k: string) => {
      if (mode === 'throws') throw new DOMException('The operation is insecure.', 'SecurityError')
      return backing.has(k) ? backing.get(k)! : null
    },
    setItem: (k: string, v: string) => {
      if (mode === 'throws') throw new DOMException('The quota has been exceeded.', 'QuotaExceededError')
      backing.set(k, String(v))
    },
    removeItem: (k: string) => void backing.delete(k),
    clear: () => backing.clear(),
    key: (i: number) => [...backing.keys()][i] ?? null,
    get length() {
      return backing.size
    },
  },
})

/** The only two fields any watermark reads off the store, so the fixture is these two and not a
 *  hand-built Snapshot that would drift from the type the day the real one gains a field. */
function snapshotFor(careerId: string): Snapshot {
  return { careerId } as unknown as Snapshot
}

/** Mount a component whose whole job is to hold one watermark, and hand back the watermark plus the
 *  career switch. Mounted rather than called bare because `useCareerSync` registers a `watch`, and a
 *  watcher with no owning instance is exactly the thing that would silently not fire. */
function mountWatermark<T extends number | string | null>(build: () => Watermark<T>): {
  mark: Watermark<T>
  toCareer: (id: string | null) => Promise<void>
  unmount: () => void
} {
  let mark!: Watermark<T>
  const wrapper = mount(
    defineComponent({
      setup() {
        mark = build()
        return () => h('div', String(mark.unseen.value))
      },
    }),
  )
  const game = useGameStore()
  return {
    mark,
    toCareer: async (id: string | null) => {
      game.snapshot = id === null ? null : snapshotFor(id)
      await nextTick()
    },
    unmount: () => wrapper.unmount(),
  }
}

beforeEach(() => {
  setActivePinia(createPinia())
  mode = 'ok'
  backing.clear()
})
afterEach(() => {
  mode = 'ok'
})

// =================================================================================================
describe('1. CAREER SWITCHING – a mark belongs to one career and cannot leak into another', () => {
  /** The trophy cabinet's shape: a count, claim-nothing, "more than I last saw" is new. */
  const cabinet = (pieces: ComputedRef<number>) =>
    mountWatermark(() => useWatermark('tb:test:trophies', pieces, (now, seen) => now > seen))

  it('the stored key carries the career, so two careers own two records', async () => {
    const pieces = ref(0)
    const h1 = cabinet(computed(() => pieces.value))
    await h1.toCareer('alpha')
    pieces.value = 3
    await nextTick()
    expect(h1.mark.unseen.value, 'three trophies arrived and none has been looked at').toBe(true)
    h1.mark.markSeen()
    expect(backing.get('tb:test:trophies:alpha')).toBe('3')
    // ⚠ AND NOTHING WAS WRITTEN UNDER A GLOBAL NAME. This is the assertion the Season dot would have
    // failed: its key was the bare prefix, so this is where the leak begins.
    expect(backing.has('tb:test:trophies'), 'a global key is the R9-21b collision').toBe(false)
  })

  it('⚠ THE BUG CLASS: switching careers re-reads THAT career, it does not carry the mark across', async () => {
    // MUTATION: delete the `watch` from `useCareerSync` (leaving the bare `sync()` call) and this
    // test goes red on the line below – beta inherits alpha's 5 and reports nothing new.
    const pieces = ref(5)
    const h1 = cabinet(computed(() => pieces.value))
    await h1.toCareer('alpha')
    h1.mark.markSeen() // alpha's cabinet has been opened at five pieces
    expect(backing.get('tb:test:trophies:alpha')).toBe('5')

    // beta is a DIFFERENT career that happens to hold the same number of trophies. Under a global
    // key it would read as "already seen"; under a per-career one the app has never been told.
    await h1.toCareer('beta')
    expect(backing.get('tb:test:trophies:beta'), 'beta gets its own seed, not alpha\'s').toBe('5')
    pieces.value = 6
    await nextTick()
    expect(h1.mark.unseen.value, 'beta won something – beta\'s own dot must light').toBe(true)
    h1.mark.markSeen()
    expect(backing.get('tb:test:trophies:beta')).toBe('6')
    // ...and alpha's record was not touched by any of it.
    expect(backing.get('tb:test:trophies:alpha')).toBe('5')

    // switching BACK restores alpha's own answer rather than the number beta left in the ref
    pieces.value = 5
    await h1.toCareer('alpha')
    expect(h1.mark.unseen.value, 'alpha is where alpha left it').toBe(false)
  })

  it('a career that leaves (no snapshot) does not write its mark under the empty career', async () => {
    // `careerKey` is total over a null career on purpose – the shell builds these before the first
    // snapshot lands. What must NOT happen is a seed under that empty key, which would be a record
    // belonging to no career that the next career could never see.
    const pieces = ref(2)
    const h1 = cabinet(computed(() => pieces.value))
    await h1.toCareer(null)
    expect(backing.has(careerKey('tb:test:trophies', null)), 'no career, no seed').toBe(false)
    await h1.toCareer('alpha')
    expect(backing.get('tb:test:trophies:alpha')).toBe('2')
  })
})

// =================================================================================================
describe('2. THE MISSING-KEY POLICY – two opposite rules, both deliberate, both pinned', () => {
  it('CLAIM NOTHING (absent omitted): an absent key reads as the current value, and is then seeded', async () => {
    // The cabinet's rule. A career with trophies and no stored mark is one the app cannot answer
    // for, and a dot must not claim a fact it cannot hold.
    // MUTATION: replace `fallback()` with `0 as T` in `read()` and the first assertion goes red –
    // an eight-trophy career imported from another device lights the dot for silverware nobody won
    // this week.
    const pieces = ref(8)
    const h1 = mountWatermark(() =>
      useWatermark('tb:test:claimnothing', computed(() => pieces.value), (now, seen) => now > seen),
    )
    await h1.toCareer('alpha')
    expect(h1.mark.seen.value, 'a missing key IS the current count').toBe(8)
    expect(h1.mark.unseen.value).toBe(false)

    // ⚠ AND THE SEEDING WRITE IS NOT OPTIONAL. Every screen in the shell is a plain `v-if` and mounts
    // fresh on each visit, so a claim-nothing mark that is never persisted is re-seeded to "now" on
    // every visit and its dot can never light.
    // MUTATION: delete the `if (getItem(key()) === null) write(seen.value)` branch from `sync()` and
    // the remounted arm below goes red.
    expect(backing.get('tb:test:claimnothing:alpha'), 'the seed is what lets the NEXT one count').toBe('8')
    h1.unmount()

    pieces.value = 9
    const h2 = mountWatermark(() =>
      useWatermark('tb:test:claimnothing', computed(() => pieces.value), (now, seen) => now > seen),
    )
    await h2.toCareer('alpha')
    expect(h2.mark.unseen.value, 'the ninth arrived after the seed – this one it may speak about').toBe(true)
  })

  it('SENTINEL ({ value }): an absent key reads as the sentinel whatever the current value is', async () => {
    // The injury report's rule, and the opposite one. A popup that cannot know whether she was told
    // she is hurt must assume she was not: the failure modes are not symmetric, a second showing
    // costs a tap and never showing it is the defect the popup exists to fix.
    // MUTATION: change `fallback()` to ignore `absent` and this goes red – the report is silently
    // marked as already-read for every career that predates the key.
    const identity = ref<string | null>('12:ankle sprain')
    const h1 = mountWatermark(() =>
      useWatermark<string | null>(
        'tb:test:injury',
        computed(() => identity.value),
        (now, seen) => now !== null && now !== seen,
        { value: null },
      ),
    )
    await h1.toCareer('alpha')
    expect(h1.mark.seen.value, 'nothing is known, so nothing has been reported').toBe(null)
    expect(h1.mark.unseen.value, 'the report is owed').toBe(true)

    // ⚠ AND A SENTINEL SCOPE SEEDS NOTHING. Writing one would make "nothing is stored for this
    // career" false for a career nobody has been shown anything.
    // MUTATION: remove the `if (absent) return` early exit from `sync()` and this goes red.
    expect(backing.has('tb:test:injury:alpha'), 'a sentinel needs no seed and must not write one').toBe(false)

    h1.mark.markSeen()
    expect(backing.get('tb:test:injury:alpha')).toBe('12:ankle sprain')
    expect(h1.mark.unseen.value, 'read once, and it stays read').toBe(false)

    // a SECOND injury is a second event – the identity is what makes that true
    identity.value = '30:wrist strain'
    await nextTick()
    expect(h1.mark.unseen.value).toBe(true)
  })

  it('the two rules disagree on the same career, which is what makes them two rules', async () => {
    const value = ref(4)
    const claimNothing = mountWatermark(() =>
      useWatermark('tb:test:a', computed(() => value.value), (now, seen) => now > seen),
    )
    const sentinel = mountWatermark(() =>
      useWatermark('tb:test:b', computed(() => value.value), (now, seen) => now > seen, { value: -1 }),
    )
    await claimNothing.toCareer('alpha')
    await sentinel.toCareer('alpha')
    expect(claimNothing.mark.unseen.value, 'the dot claims nothing').toBe(false)
    expect(sentinel.mark.unseen.value, 'the report shows').toBe(true)
  })

  it('an empty string round-trips to null and never to the five-character id "null"', async () => {
    const newest = ref<string | null>(null)
    const h1 = mountWatermark(() =>
      useWatermark<string | null>(
        'tb:test:letters',
        computed(() => newest.value),
        (now, seen) => now !== null && now !== seen,
        { value: null },
      ),
    )
    await h1.toCareer('alpha')
    newest.value = 'letter-1'
    await nextTick()
    h1.mark.markSeen()
    newest.value = null
    await nextTick()
    h1.mark.markSeen() // null is never newer, so this writes nothing
    expect(backing.get('tb:test:letters:alpha')).toBe('letter-1')
    expect([...backing.values()], 'String(null) is a trap, not a value').not.toContain('null')
  })
})

// =================================================================================================
describe('3. STORAGE EXCEPTIONS – a browser that throws does not take the app out', () => {
  it('a read that throws falls back to the scope\'s own absent policy instead of propagating', async () => {
    // The private-mode case. Storage being unavailable is the same case as a key that is not there:
    // the app does not KNOW, and each caller has already said what it wants done about that.
    // MUTATION: remove the `try/catch` from `read()` and BOTH arms below throw out of `setup`, which
    // is what the shell used to do – above every screen, so the app rendered nothing at all.
    mode = 'throws'
    const pieces = ref(7)
    let claimNothing!: ReturnType<typeof mountWatermark<number>>
    expect(() => {
      claimNothing = mountWatermark(() =>
        useWatermark('tb:test:throws-a', computed(() => pieces.value), (now, seen) => now > seen),
      )
    }, 'mounting must survive a storage that throws').not.toThrow()
    expect(claimNothing.mark.seen.value, 'unknowable reads as the current value').toBe(7)
    expect(claimNothing.mark.unseen.value).toBe(false)

    const report = mountWatermark(() =>
      useWatermark<string | null>(
        'tb:test:throws-b',
        computed(() => '12:ankle sprain' as string | null),
        (now, seen) => now !== null && now !== seen,
        { value: null },
      ),
    )
    expect(report.mark.unseen.value, 'and the report still gets shown').toBe(true)
  })

  it('a WRITE that throws still clears the dot for this session – it just does not persist', async () => {
    // MUTATION: remove the `try/catch` from `write()` and pressing Continue throws out of the click
    // handler, so the popup can never be dismissed – a blocking overlay with no way past it, which
    // is the worst shape this defect can take.
    const pieces = ref(1)
    const h1 = mountWatermark(() =>
      useWatermark('tb:test:throws-c', computed(() => pieces.value), (now, seen) => now > seen),
    )
    await h1.toCareer('alpha')
    pieces.value = 4
    await nextTick()
    expect(h1.mark.unseen.value).toBe(true)
    mode = 'throws'
    expect(() => h1.mark.markSeen(), 'dismissing must not throw at the player').not.toThrow()
    expect(h1.mark.unseen.value, 'the dot clears for this session').toBe(false)
  })

  it('a career SWITCH under a throwing storage does not throw either', async () => {
    // MUTATION: remove the `try/catch` around the seeding `getItem` in `sync()` – this is the third
    // and least obvious storage touch, and it runs on every career change rather than at setup.
    const pieces = ref(2)
    const h1 = mountWatermark(() =>
      useWatermark('tb:test:throws-d', computed(() => pieces.value), (now, seen) => now > seen),
    )
    await h1.toCareer('alpha')
    mode = 'throws'
    await expect(h1.toCareer('beta')).resolves.toBeUndefined()
    expect(h1.mark.seen.value).toBe(2)
  })

  it('the DEVICE flag survives it too – the coach-mark tour is the one mark that is not per career', () => {
    // ⚠ AND IT MUST STAY NOT-PER-CAREER: «shown once, ever, per device» is an owner ruling, so
    // career-keying it during a consolidation would be a regression with a tidy diff.
    // MUTATION: drop either `try/catch` from `useDeviceFlag` and this goes red.
    mode = 'throws'
    let flag!: ReturnType<typeof useDeviceFlag>
    expect(() => {
      flag = useDeviceFlag('tb:test:tour')
    }).not.toThrow()
    expect(flag.on.value, 'unprovable means unanswered').toBe(false)
    expect(() => flag.set()).not.toThrow()
    expect(flag.on.value, 'it holds for the session').toBe(true)

    mode = 'ok'
    const persisted = useDeviceFlag('tb:test:tour2')
    persisted.set()
    expect(backing.get('tb:test:tour2'), 'no career on the key').toBe('1')
  })
})

// =================================================================================================
describe('⚠ THE SEASON DOT: the defect this consolidation actually found', () => {
  // The Season tab's mark was the one that had never been fixed. Its key was a bare
  // `tb:lastSeenSeasonWeek` and the value under it is a WEEK NUMBER, so two careers – which are
  // almost never on the same week – shared one record. This reproduces it against the shape the
  // shell used to have, then shows the same sequence under the helper.
  const OLD_KEY = 'tb:lastSeenSeasonWeek'

  it('the OLD global shape leaks: a late career silences a young one for seventy-eight weeks', () => {
    // the shell's own two lines, verbatim in shape: a global getItem and a global setItem
    const oldRead = () => Number(localStorage.getItem(OLD_KEY) ?? '-1')
    const oldWrite = (week: number) => localStorage.setItem(OLD_KEY, String(week))
    const hasNew = (latestMarker: number, seen: number) => latestMarker >= 0 && latestMarker > seen

    oldWrite(90) // the week-90 career visits Season
    // the week-12 career now asks about a marker it has never been shown
    expect(hasNew(12, oldRead()), 'THE BUG: seventy-eight weeks of markers read as already seen').toBe(false)
  })

  it('...and under the helper the young career keeps its own answer', async () => {
    const latestMarker = ref(90)
    const h1 = mountWatermark(() =>
      useWatermark(OLD_KEY, computed(() => latestMarker.value), (now, seen) => now >= 0 && now > seen, {
        value: -1,
      }),
    )
    await h1.toCareer('veteran')
    h1.mark.markSeen()
    expect(backing.get(`${OLD_KEY}:veteran`)).toBe('90')

    latestMarker.value = 12
    await h1.toCareer('rookie')
    expect(h1.mark.unseen.value, 'the rookie has its own calendar to read').toBe(true)
    // and the global name is not used by anybody
    expect(backing.has(OLD_KEY)).toBe(false)
  })
})
