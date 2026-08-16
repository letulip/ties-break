// ⭐ ROUND-21 #9 – A BLOCKING POPUP WAITS FOR THE SCREEN, AND THE INJURY DOES NOT. Mounted, through
// the real shell, on the exact frame the owner was looking at.
//
// The owner, 14.08: «Попап с развилкой появился сразу после финального матча чемпионата перекрыв
// интерфейс таблицы и завершения. Нам надо как-то всё-таки разобраться с порядком появления попапов,
// чтобы они не конфликтовали с происходящим на экране в данный момент, кроме травмы, которая как раз
// должна появляться в моменте.»
//
// ⚠ THE FRAME IS REAL AND SO IS THE COLLISION. `finalizeTournament` calls `resolveEndings` while
// `pendingTournament` IS STILL SET – `p.finished = true` is the next line, and only `closeTournament`
// clears the reveal – so the fork is raised, correctly, with the finale and the draw still on screen.
// The fixture below builds that state out of the engine rather than describing it: a real entry, a
// real bracket, `skipTournament` to the finale, then the fork the engine would have raised there.
//
// ⚠ AND THE SHELL IS MOUNTED, NOT PINNED. `tests/component/round19-wrapup.test.ts` established that
// App.vue can be mounted here (the comments in App.vue and tour-briefing.test.ts saying it cannot
// predate it). The claim is "this dialog is not in the DOM while that sequence is", and only a mount
// can make it – a source pin would go green on a gate that reads the right field and renders anyway.
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'

// The shell imports the service-worker registration and the component project resolves no virtual
// module for it – the same mock round19-wrapup.test.ts installs, for the same reason.
vi.mock('../../src/pwa', async () => {
  const { ref } = await import('vue')
  return { needRefresh: ref(false), applyUpdate: () => {}, UPDATE_CHECK_MS: 3600_000 }
})

import App from '../../src/App.vue'
import SplashScreen from '../../src/components/SplashScreen.vue'
import TournamentFlow from '../../src/components/TournamentFlow.vue'
import ForkDialog from '../../src/components/ForkDialog.vue'
import KnockDialog from '../../src/components/KnockDialog.vue'
import InjuryStopDialog from '../../src/components/InjuryStopDialog.vue'
import { useGameStore } from '../../src/stores/game'
import {
  KID_ID,
  closeTournament,
  createWorld,
  enterEvent,
  skipTournament,
  tickWeek,
  toSnapshot,
  type WorldState,
} from '../../src/engine/world'
import { rngFromSeed } from '../../src/engine/rng'
import { TIERS, hasAcceptanceList } from '../../src/engine/season/calendar'

// ⚠ THIS RUNNER HAS NO localStorage, AND THE INJURY REPORT'S WATERMARK IS localStorage. Same shim
// as round19-wrapup.test.ts / round20-ui.test.ts – supply the browser's object, do not weaken the app.
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

/** A real career standing on a FINISHED reveal – the finale card, the draw and the points still up.
 *  Lifted from tests/tournamentReveal.test.ts's own fixture, including its note on why the rung has
 *  to be a points-banded domestic one. */
function atTheFinale(seed: string): WorldState {
  const world = createWorld(seed)
  const rng = rngFromSeed(seed)
  const event = world.season.find(
    (e) =>
      e.week >= 5 &&
      e.deadlineWeek >= world.week &&
      TIERS[e.tier].track === 'domestic' &&
      !hasAcceptanceList(e.tier),
  )!
  const min = TIERS[event.tier].enterPointBand[0]
  const marker = { playerId: KID_ID, week: world.week, points: min, tier: event.tier }
  if (min > 0) world.results.push(marker)
  enterEvent(world, event.id)
  if (min > 0) world.results = world.results.filter((r) => r !== marker)
  while (world.week < event.week) tickWeek(world, rng)
  skipTournament(world)
  expect(world.pendingTournament?.finished, 'the reveal is finished and still on screen').toBe(true)
  // A knock standing from an input-free run would outrank everything and leave these cases looking
  // at the wrong dialog – the same artefact round19-wrapup.test.ts records.
  world.knock = null
  return world
}

/** Mount the shell on a world, past the splash. */
async function openShell(world: WorldState) {
  const game = useGameStore()
  vi.spyOn(game, 'init').mockResolvedValue(undefined)
  game.$patch({ ready: true, phase: 'ready' })
  // Assigned, never `$patch`ed – `$patch` deep-merges and these cases care about absent keys.
  game.snapshot = toSnapshot(world)
  const w = mount(App, { global: { stubs: { teleport: true } } })
  w.findComponent(SplashScreen).vm.$emit('done')
  await flushPromises()
  return { w, game }
}

describe('⭐ round-21 #9 – a blocking popup waits for the screen to be idle', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    backing.clear()
  })

  it('⭐⭐ THE FORK DOES NOT LAND ON THE FINALE – the collision the owner reported', async () => {
    const world = atTheFinale('r21-order-fork')
    // Exactly what `resolveEndings` does at the end of `finalizeTournament`, with the reveal still up.
    world.fork = { askedWeek: world.week, answer: null, offer: null }
    const { w, game } = await openShell(world)

    expect(game.snapshot?.pending, 'the reveal really is on the snapshot').toBeTruthy()
    expect(game.snapshot?.fork, 'and the fork really is open – neither half is vacuous').toBeTruthy()
    expect(w.findComponent(TournamentFlow).exists(), 'the tournament is what is on screen').toBe(true)
    // ⚠ MUTATION-VERIFIED: drop `'fork'`'s wait by adding it to `INTERRUPTS` in
    // composables/blockingOverlay.ts and this flips to `true` – which is the bug as reported.
    expect(w.findComponent(ForkDialog).exists(), 'and the fork is NOT painted over it').toBe(false)
    w.unmount()
  })

  it('⭐ ...and it is the next thing on screen the moment the tournament is closed', async () => {
    // The other half, and the reason a wait is not a deadlock: the reveal has an exit that costs
    // nothing, `closeTournament` is deliberately unguarded, and the held question is right behind it.
    const world = atTheFinale('r21-order-fork-then')
    world.fork = { askedWeek: world.week, answer: null, offer: null }
    const { w, game } = await openShell(world)
    expect(w.findComponent(ForkDialog).exists()).toBe(false)

    closeTournament(world)
    game.snapshot = toSnapshot(world)
    await flushPromises()

    expect(w.findComponent(TournamentFlow).exists(), 'the reveal is done').toBe(false)
    expect(w.findComponent(ForkDialog).exists(), 'the question was held, not lost').toBe(true)
    w.unmount()
  })

  it('⭐ the knock waits too – the rule is general, not a patch on the fork', async () => {
    // The item's own words: «разобраться с ПОРЯДКОМ появления попапов», not "fix this one". A knock
    // is one rank ABOVE the fork in the precedence list and it waits by the same rule.
    const world = atTheFinale('r21-order-knock')
    world.knock = { part: 'wrist', sinceWeek: world.week, repeat: false, choice: null, untilWeek: world.week }
    const { w, game } = await openShell(world)
    expect(game.snapshot?.knockPrompt, 'the knock really is pending').toBeTruthy()
    expect(w.findComponent(KnockDialog).exists(), 'and it waits for the reveal like everything else').toBe(false)
    w.unmount()
  })

  it('⭐⭐ THE INJURY DOES NOT WAIT – the owner\'s stated exception, over the same reveal', async () => {
    // «кроме травмы, которая как раз должна появляться в моменте». Same frame, same tournament, and
    // this one is on screen. Without both halves the rule is half-built: a wait everything obeys is
    // just a mute button.
    const world = atTheFinale('r21-order-injury')
    world.injury = {
      kind: 'ankle strain',
      severity: 'moderate',
      weeksRemaining: 4,
      totalWeeks: 4,
      sinceWeek: world.week,
    }
    const { w, game } = await openShell(world)

    expect(game.snapshot?.pending, 'the reveal is still up').toBeTruthy()
    expect(w.findComponent(TournamentFlow).exists()).toBe(true)
    // ⚠ MUTATION-VERIFIED: remove `'injury'` from `INTERRUPTS` and this flips to `false`.
    expect(w.findComponent(InjuryStopDialog).exists(), 'the report lands in the moment').toBe(true)
    w.unmount()
  })

  it('⚠ and on an idle screen the fork behaves exactly as it always did', async () => {
    // The rule must not have turned into "never show anything". Nothing pending on screen, fork open.
    const world = atTheFinale('r21-order-idle')
    closeTournament(world)
    world.fork = { askedWeek: world.week, answer: null, offer: null }
    const { w } = await openShell(world)
    expect(w.findComponent(TournamentFlow).exists()).toBe(false)
    expect(w.findComponent(ForkDialog).exists()).toBe(true)
    w.unmount()
  })
})
