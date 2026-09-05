// ⚠⚠ U-01 (review of 05.09, docs/review-principles-2026-09-05/03-ui.md) – A REFUSED BOOT LOAD MUST
// NOT OPEN THE PROLOGUE OVER AN INTACT CAREER.
//
// `init()` probes `listCareers` directly so that a storage failure lands in `phase: 'recovery'`, and
// its own comment says why: the old code "booted a player with years of careers straight into the
// onboarding wizard". The next line reopened the same hole through the other exit. `loadCareer` runs
// through `runOp` -> `run`, and `run` CATCHES a refusal: it writes `error` and returns `undefined`.
// `init` then set `ready = true; phase = 'ready'` with `snapshot === null` – which is exactly
// `App.vue:298`'s `showOnboarding = game.ready && !game.snapshot`, so the childhood prologue drew
// itself over a career that was still on disk and still in `store.careers`, and the one sentence
// explaining it sat in `error`/`saveOp`, which only More renders and More is not reachable from a
// full-screen takeover.
//
// ⚠ THE REFUSAL IS THE ENGINE'S OWN, NOT A STRING TYPED HERE. `schemaNewerRefusal()` below calls the
// shipped `migrateSave` with a save one version past this build and keeps what it threw – the
// realistic trigger for this bug is a player whose device still holds a save written by a newer
// deployment. A hand-written message would pass this test on a build where the engine had stopped
// refusing at all.
//
// ⚠ MUTATION-VERIFIED. Watched failing before it was believed: with the `if (!this.snapshot)` guard
// removed from `init` (the tree as it shipped), `phase` comes back 'ready' and `ChildhoodPrologue`
// mounts – both arms of the first test go red, and the third goes red on the prologue's kicker.
// The log is in the wave's scratch as `u01-red.log`.
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, flushPromises, type VueWrapper } from '@vue/test-utils'
import { nextTick } from 'vue'
import { createPinia, setActivePinia } from 'pinia'
import App from '../../src/App.vue'
import SplashScreen from '../../src/components/SplashScreen.vue'
import ChildhoodPrologue from '../../src/components/ChildhoodPrologue.vue'
import { useGameStore } from '../../src/stores/game'
import { request } from '../../src/worker/client'
import { migrateSave } from '../../src/engine/migrations'
import { SAVE_SCHEMA_VERSION } from '../../src/engine/world/state'
import { careerSnapshot } from '../helpers/career'
import type { CareerMeta, ToUI } from '../../src/shared/protocol'

// ⚠ THIS RUNNER HAS NO localStorage, AND `HomeScreen` READS IT AT SETUP. The same shim and the same
// argument as tests/component/round28-top-notices.test.ts, quoted there in full: happy-dom is
// configured here without web storage. The test supplies the browser's object; it does not weaken
// the code.
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

// The transport is mocked at the module boundary, exactly as tests/store-recovery.test.ts does it:
// what `init` does is entirely a function of what the worker answers, and both answers are scripted
// here. No worker is spawned.
vi.mock('../../src/worker/client', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../src/worker/client')>()
  return { ...actual, request: vi.fn() }
})
const mockRequest = vi.mocked(request)

/** The message the SHIPPED migration chain produces for a save newer than this build. */
function schemaNewerRefusal(): string {
  try {
    migrateSave({ schemaVersion: SAVE_SCHEMA_VERSION + 1 })
  } catch (err) {
    return (err as Error).message
  }
  throw new Error('migrateSave accepted a schema-newer save – this fixture is no longer honest')
}

const CAREER: CareerMeta = {
  careerId: 'c-u01',
  kidName: 'Vera',
  country: 'FR',
  seed: 'u01-boot',
  createdAt: 1,
  lastPlayedAt: 2,
  week: 40,
}

const careersReply: ToUI = { id: 0, ok: true, type: 'careers', careers: [CAREER], revision: 3 }
const slotsReply: ToUI = { id: 0, ok: true, type: 'slots', slots: [], revision: 3 }

/** Boot the shell with a worker that answers `loadCareer` however the arm says. */
async function bootWith(loadCareerReply: () => ToUI) {
  mockRequest.mockImplementation(async (msg) => {
    if (msg.type === 'listCareers') return careersReply
    if (msg.type === 'loadCareer') return loadCareerReply()
    if (msg.type === 'listSlots') return slotsReply
    throw new Error(`unexpected request ${msg.type}`)
  })
  const wrapper = mount(App, { global: { stubs: { teleport: true } } })
  await flushPromises()
  return { wrapper, store: useGameStore() }
}

/**
 * ⚠⚠ THE TAP THAT MAKES THE PROLOGUE CLAIM FALSIFIABLE, and it was found by mutating.
 *
 * `App.vue` branches recovery, then `!ready`, then the SPLASH, and only then the prologue – so on
 * the unfixed tree the boot settles behind a wordmark and `ChildhoodPrologue` is not mounted YET.
 * A test that asserted its absence without getting past the splash passed on the broken tree, which
 * is the shape of a net that proves nothing. The splash is a real component with a real timer;
 * asking it for its own `done` is the seam the player's tap uses and needs no clock.
 *
 * On the FIXED tree there is nothing to dismiss – the recovery screen replaces the splash outright –
 * so the tap is conditional and its absence is asserted where it is the point.
 */
async function pastSplash(wrapper: VueWrapper): Promise<VueWrapper> {
  const splash = wrapper.findComponent(SplashScreen)
  if (splash.exists()) {
    splash.vm.$emit('done')
    await nextTick()
  }
  return wrapper
}

describe('⚠⚠ U-01 – a boot whose career refuses to load reaches recovery, not the prologue', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    backing.clear()
    mockRequest.mockReset()
  })

  it('a schema-newer save lands in `recovery` with the engine`s own refusal, and `ready` stays false', async () => {
    const refusal = schemaNewerRefusal()
    expect(refusal, 'the engine still refuses a newer save in words').toContain('newer than supported')

    const { wrapper, store } = await bootWith(() => ({ id: 0, ok: false, error: refusal }))

    expect(store.phase, 'the third exit `init` is not allowed to have').toBe('recovery')
    expect(store.ready, '`ready` with no snapshot IS `showOnboarding`').toBe(false)
    expect(store.initError, 'what refused, said where the player can read it').toBe(refusal)
    expect(store.snapshot).toBe(null)
    wrapper.unmount()
  })

  it('⚠ the career is still there, and the screen offers the choice instead of making it', async () => {
    const { wrapper, store } = await bootWith(() => ({ id: 0, ok: false, error: schemaNewerRefusal() }))

    // Nothing was deleted: the list the probe read is intact, which is what makes silently starting
    // a new childhood over it the wrong default.
    expect(store.careers.map((c) => c.careerId)).toEqual(['c-u01'])
    // The recovery screen is up, with its three existing ways forward. Its copy is the owner's and
    // is asserted here only as PRESENT – not a word of it moved (CLAUDE.md invariant 4).
    const recovery = wrapper.find('.recovery-screen')
    expect(recovery.exists(), 'the failure path out of the splash').toBe(true)
    expect(recovery.find('.error').text()).toBe(store.initError)
    expect(recovery.findAll('.recovery-actions button').length, 'retry / import / start new').toBe(3)
    wrapper.unmount()
  })

  it('⚠⚠ ...and the childhood prologue does NOT mount over it', async () => {
    const { wrapper } = await bootWith(() => ({ id: 0, ok: false, error: schemaNewerRefusal() }))

    // Past the point where the player's tap dismisses the wordmark – which on the unfixed tree is
    // the exact moment the nine cards come up over a career that is still on disk.
    await pastSplash(wrapper)
    expect(wrapper.findComponent(ChildhoodPrologue).exists(), 'a new child, over a career on disk').toBe(false)
    expect(wrapper.find('.prologue-card').exists()).toBe(false)
    expect(wrapper.find('.onboarding').exists(), 'nor the wizard behind it').toBe(false)
    // And the splash never came up at all on this exit – recovery is branched above it precisely so
    // a player whose storage is broken meets the choices rather than a wordmark waiting on data.
    expect(wrapper.findComponent(SplashScreen).exists(), 'the splash stood over the failure').toBe(false)
    wrapper.unmount()
  })

  it('⚠ the arm that must NOT change: a load that succeeds still boots the game', async () => {
    // The honesty check for the three above. A guard written as "recovery whenever a career exists"
    // would pass every arm above and break every real boot; this is the one that says it did not.
    const snapshot = careerSnapshot(3, 'u01-good')
    const { wrapper, store } = await bootWith(() => ({
      id: 0,
      ok: true,
      type: 'snapshot',
      snapshot,
      revision: 4,
    }))

    expect(store.phase).toBe('ready')
    expect(store.ready).toBe(true)
    expect(store.initError).toBe('')
    expect(store.snapshot?.week).toBe(snapshot.week)
    expect(wrapper.find('.recovery-screen').exists(), 'a healthy boot does not meet recovery').toBe(false)
    await pastSplash(wrapper)
    expect(wrapper.findComponent(ChildhoodPrologue).exists()).toBe(false)
    expect(wrapper.find('nav.tab-bar').exists(), 'the career the player left is on screen').toBe(true)
    wrapper.unmount()
  })

  it('⚠ a corrupted autosave is the same exit – the refusal need not be the schema one', async () => {
    // The second refusal `migrateSave` can produce, taken from the engine the same way.
    let corrupt = ''
    try {
      migrateSave({ schemaVersion: SAVE_SCHEMA_VERSION })
    } catch (err) {
      corrupt = (err as Error).message
    }
    expect(corrupt, 'the engine still guards the payload').toContain('Corrupted save')

    const { wrapper, store } = await bootWith(() => ({ id: 0, ok: false, error: corrupt }))
    expect(store.phase).toBe('recovery')
    expect(store.initError).toBe(corrupt)
    await pastSplash(wrapper)
    expect(wrapper.findComponent(ChildhoodPrologue).exists()).toBe(false)
    wrapper.unmount()
  })
})
