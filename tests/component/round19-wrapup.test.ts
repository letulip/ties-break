// ⭐ ROUND-19 #2 – THE SEASON WRAP-UP, THROUGH THE REAL SHELL, AFTER THE REAL ANSWER.
//
// The owner: «И по-моему за этим попапом скрылся или не показался попап с итогами сезона.» The recap
// was gated on the `'season-end'` STOP REASON; the retirement offer is raised on the wrap week by
// construction and outranks it, so answering the offer – a real command, which builds a fresh
// snapshot with no stop reasons on it – erased the reason and the summary could never be satisfied
// again. docs/rounds/round-19.md §2.
//
// ⚠ WHY THIS FILE MOUNTS `App.vue` AND NOT THE DIALOG. The bug was never in `SeasonSummaryDialog`,
// which renders whatever summary it is handed. It was in the GATE, and the gate lives in the shell –
// so a test that mounts the card proves nothing at all about it. This is the only place the two
// popups, their order and the answer that used to destroy one of them exist together.
//
// ⚠ HOW FAR THE REAL PATH REACHES, STATED PLAINLY. Everything below the store is real: a real world
// ticked to a real wrap-up week, the engine's own `answerRetirement` / `answerFork`, and `toSnapshot`
// building the reply. What is NOT real is the worker hop – `stores/game.ts` posts to a Web Worker and
// happy-dom has none, so the store action is replaced by one that does exactly what
// `sim.worker.ts` does with a command's result: run it, then send back `toSnapshot(world)` with NO
// stop reasons, because only an `advance` ever passes them. That substitution is the bug's whole
// mechanism, so it is asserted (`stopReasons` is undefined afterwards) rather than assumed.
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'

// The shell imports the service-worker registration, and the component project declares only the
// vue() plugin – nothing resolves `virtual:pwa-register`. Mocking the module App.vue actually imports
// keeps the virtual one out of the graph entirely.
vi.mock('../../src/pwa', async () => {
  const { ref } = await import('vue')
  return { needRefresh: ref(false), applyUpdate: () => {}, UPDATE_CHECK_MS: 3600_000 }
})

import App from '../../src/App.vue'
import SplashScreen from '../../src/components/SplashScreen.vue'
import SeasonSummaryDialog from '../../src/components/SeasonSummaryDialog.vue'
import RetirementDialog from '../../src/components/RetirementDialog.vue'
import ForkDialog from '../../src/components/ForkDialog.vue'
import { useGameStore } from '../../src/stores/game'
import { answerFork, answerRetirement, createWorld, tickWeek, toSnapshot } from '../../src/engine/world'
import type { WorldState } from '../../src/engine/world'
import { rngFromSeed } from '../../src/engine/rng'
import { WEEKS_PER_YEAR } from '../../src/engine/season/calendar'

// ⚠ THIS RUNNER HAS NO localStorage, AND THE DISMISS WATERMARK IS localStorage – the same shim
// tests/component/home-strip-and-mail.test.ts and round20-ui.test.ts install, and for the reason
// quoted there: happy-dom is configured here without web storage, so the browser's own object is
// supplied rather than the shell being weakened to suit the runner.
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

/** A real career ticked to its first wrap-up week, where the engine banks the season summary inside
 *  the tick's own deferred block. Week 49 of season 0. */
function atTheWrap(seed: string): WorldState {
  const world = createWorld(seed)
  const rng = rngFromSeed(world.seed)
  while (world.week < WEEKS_PER_YEAR - 3) tickWeek(world, rng)
  // ⚠ AN UNANSWERED KNOCK IS AN ARTEFACT OF TICKING A WORLD WITH NOBODY IN IT. A knock BLOCKS the
  // advance until it is answered, so in a real career it never survives the week it arrived in - but
  // this loop plays fifty weeks with no input at all, and on some seeds one is still standing at the
  // wrap. It outranks every dialog in `blockingOverlay`, which would leave these tests looking at a
  // knock instead of the two popups they are about.
  world.knock = null
  return world
}

/** Mount the shell on a given world, past the splash, with the advance's own stop reasons on the
 *  snapshot – i.e. the exact frame the player is looking at when the week stops. */
async function openShell(world: WorldState) {
  const game = useGameStore()
  vi.spyOn(game, 'init').mockResolvedValue(undefined)
  game.$patch({ ready: true, phase: 'ready' })
  // ⚠ ASSIGNED, NEVER `$patch`ed – `$patch` DEEP-MERGES a plain object, and the whole point of the
  // reply below is a snapshot with NO `stopReasons` key on it. Merged into the previous snapshot the
  // old reasons survive, which is the opposite of the state under test. The real store assigns too
  // (`this.snapshot = res.snapshot`), so this is the faithful shape as well as the working one.
  game.snapshot = toSnapshot(world, ['season-end'])
  const w = mount(App, { global: { stubs: { teleport: true } } })
  w.findComponent(SplashScreen).vm.$emit('done')
  await flushPromises()
  return { w, game }
}

describe('⭐ round-19 #2 – answering the question no longer destroys the wrap-up', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
  })

  it('⭐ "One more year" on the wrap week, and the season summary is still shown', async () => {
    const world = atTheWrap('round19-ui-retirement')
    world.retirementOffer = { askedWeek: world.week, seasonIndex: 0, reason: 'age', final: false }
    const { w, game } = await openShell(world)

    // The order is the feature and it is unchanged: the question first, the report behind it.
    expect(w.findComponent(RetirementDialog).exists(), 'the offer is up').toBe(true)
    expect(w.findComponent(SeasonSummaryDialog).exists(), 'the recap waits its turn').toBe(false)

    // The store's real command, minus the worker hop it cannot make here – see the file header.
    vi.spyOn(game, 'answerRetirement').mockImplementation(async (retire: boolean) => {
      answerRetirement(world, retire)
      game.snapshot = toSnapshot(world)
    })
    await w.findAll('.retire-answer')[1].trigger('click')
    await flushPromises()

    // The reason really is gone – this is the bug, and it is still true. What changed is that the
    // recap no longer depends on it.
    expect(game.snapshot?.stopReasons, 'the fresh snapshot carries no stop reasons').toBeUndefined()
    expect(w.findComponent(RetirementDialog).exists(), 'the question is answered').toBe(false)
    expect(w.findComponent(SeasonSummaryDialog).exists(), 'and the season is reported').toBe(true)
    expect(w.text()).toContain('Season 2031')
    w.unmount()
  })

  it('⭐ ...and the fork, one rank above it in the same ordered list, cannot destroy it either', async () => {
    const world = atTheWrap('round19-ui-fork')
    world.fork = { askedWeek: world.week, answer: null, offer: null }
    const { w, game } = await openShell(world)
    expect(w.findComponent(ForkDialog).exists()).toBe(true)
    expect(w.findComponent(SeasonSummaryDialog).exists()).toBe(false)

    vi.spyOn(game, 'answerFork').mockImplementation(async (answer) => {
      answerFork(world, answer)
      game.snapshot = toSnapshot(world)
    })
    // "Turn professional" – the one answer that leaves a career to report a season to.
    await w.findAll('.fork-answer')[0].trigger('click')
    await flushPromises()

    expect(game.snapshot?.stopReasons).toBeUndefined()
    expect(w.findComponent(ForkDialog).exists()).toBe(false)
    expect(w.findComponent(SeasonSummaryDialog).exists()).toBe(true)
    w.unmount()
  })

  it('⚠ Continue closes it for that season and no later action re-opens it', async () => {
    // The other half of moving the gate onto state: a dismiss flag reset by every fresh snapshot can
    // only gate a per-advance reason. The recap is now raised by state that lives all week, so the
    // flag has to name the SEASON – otherwise setting a plan or entering an event on the wrap week
    // would raise a card the player has already continued past. Round-16 #19's lesson, second popup.
    const world = atTheWrap('round19-ui-dismiss')
    const { w, game } = await openShell(world)
    expect(w.findComponent(SeasonSummaryDialog).exists()).toBe(true)

    await w.findComponent(SeasonSummaryDialog).find('.tb-pill').trigger('click')
    await flushPromises()
    expect(w.findComponent(SeasonSummaryDialog).exists(), 'continued past').toBe(false)

    // Any command at all, on the same week: a fresh snapshot arrives and the card stays shut.
    game.snapshot = toSnapshot(world)
    await flushPromises()
    expect(w.findComponent(SeasonSummaryDialog).exists(), 'and it stays shut').toBe(false)
    w.unmount()
  })
})
