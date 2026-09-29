// ⭐⭐ T4.4 · E-05 – THE MUTATION ARM'S OWN FILE: A FIXTURE WHERE THE WORDS AND THE NUMBERS DISAGREE.
//
// `tests/principles-e05-finish-numbers.test.ts` owns the projection: `finishLabel` IS
// `finishLabel(kidFinish)` on every view the engine can build, and `isFinal` IS «the round is called
// Final». That parity is exactly what makes the fix invisible to an ordinary test – comparing the word
// and comparing the number give the same answer on every state a career can reach, which is why E-05
// is a latent defect and not a visible one.
//
// ⚠⚠ SO THE ARM HAS TO BE BUILT, AND THIS FILE SAYS SO. The plan's arm is «compare the words again →
// red on a fixture where the words collide and the numbers do not», and no live fixture can produce
// one: the engine DERIVES the word from the number. What can produce one is the thing E-05 is about –
// a wording change, which invariant 4 reserves to the owner and which he may make at any time. So the
// fixture is a REAL finished run (walked, not posed: a beaten finalist at a real rung) with ONE field
// edited afterwards, the edit being precisely the rename the finding names:
//
//    the rename       `finishLabel: 'Finalist'` over an untouched `kidFinish: 1`
//                     → the silver poster must still hang. The word-comparing code hangs NOTHING.
//    the collision    `finishLabel: 'Runner-up'` over `kidFinish: 2` (a semi-finalist)
//                     → the silver poster must NOT hang. The word-comparing code hangs it, on a
//                       result that is not hers – and would fly a trophy into a cabinet that has none.
//
// Both directions are asserted, because an arm that only proves one of them cannot tell the fix from a
// screen that simply never renders. ⚠ THE SECOND CASE IS THE ONE THAT MATTERS MOST: it is the shape a
// rename cannot create but a display-vocabulary COLLISION can – two fixtures naming one word – and it
// is the reason the plan asks for numbers rather than for a different string.
//
// ⚠ AND THE SAME PAIR FOR `isFinal`, on the cue that warms the celebration clip: the flow's
// `watch(isFinalRound, …, { immediate: true })` primes `applauseFinal` the moment a final is in play, so
// a mount is enough to read the predicate's answer without walking to a viewer.
//
// ⚠⚠ MUTATION ARM, RUN AND QUOTED IN THE REPORT: restore both comparisons to the display words in
// `TournamentFlow.vue` – `finishLabel === 'Runner-up'` and `roundLabel === 'Final'` – and the four
// cases below redden while the flow's own suites stay green, which is the asymmetry
// docs/specs/engine-ui-parity-2026-09.md §2 asks for.
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import { createPinia, setActivePinia } from 'pinia'
import TournamentFlow from '../../src/components/TournamentFlow.vue'
import { useGameStore } from '../../src/stores/game'
import {
  KID_ID,
  createWorld,
  enterEvent,
  revealTournamentRound,
  tickWeek,
  toSnapshot,
  type WorldState,
} from '../../src/engine/world'
import { rngFromSeed } from '../../src/engine/rng'
import { TIERS, hasAcceptanceList } from '../../src/engine/season/calendar'
import type { PendingView, Snapshot } from '../../src/shared/protocol'

const primed: string[] = []
vi.mock('../../src/audio/sfx', () => ({
  playSfx: () => {},
  primeSfx: (key: string) => primed.push(key),
  initSfx: () => {},
  installGlobalSfx: () => {},
  isMuted: () => false,
  setMuted: () => {},
}))

/** `tests/tournamentReveal.test.ts`' `buildToPending`, and its note about why the rung must be a
 *  points-banded domestic one applies verbatim. The tick that ARRIVES at the event's week is the one
 *  that opens the reveal – ticking once more plays the week THROUGH and prunes the event out of
 *  `world.season`, after which `pendingView`'s `eventById` finds nothing and the snapshot carries no
 *  `pending` at all (measured while building this file: 30 careers, 0 finished views). */
function buildToPending(seed: string): WorldState {
  const world = createWorld(seed)
  const rng = rngFromSeed(seed)
  const event = world.season.find(
    (e) => e.week >= 5 && e.deadlineWeek >= world.week && TIERS[e.tier].track === 'domestic' && !hasAcceptanceList(e.tier),
  )!
  const min = TIERS[event.tier].enterPointBand[0]
  const marker = { playerId: KID_ID, week: world.week, points: min, tier: event.tier }
  if (min > 0) world.results.push(marker)
  enterEvent(world, event.id)
  if (min > 0) world.results = world.results.filter((r) => r !== marker)
  while (world.week < event.week) tickWeek(world, rng)
  expect(world.week, 'the tick that arrives at the event week opens the reveal').toBe(event.week)
  return world
}

/** A REAL finished run in which she LOST THE FINAL. Seeds are walked rather than hard-coded so the
 *  fixture survives a tuning change; measured over `e05-0…e05-29`, four of the thirty end this way
 *  (`e05-3` at a Regional Championship's draw of 16 is the first). */
function beatenFinalist(): Snapshot {
  for (let i = 0; i < 40; i++) {
    const world = buildToPending(`e05-${i}`)
    let guard = 0
    while (world.pendingTournament && !world.pendingTournament.finished && guard++ < 30) revealTournamentRound(world)
    const snap = toSnapshot(world)
    const p = snap.pending
    if (p?.finished && p.kidFinish === 1 && !p.kidChampion) return snap
  }
  throw new Error('no career in e05-0…e05-39 lost a final – the draw or the field has moved')
}

/** The same snapshot with ONE field of the pending view replaced. Everything else – the bracket, the
 *  opponent, the points, the poster's own status line – is the engine's. */
function withPending(snap: Snapshot, patch: Partial<PendingView>): Snapshot {
  return { ...snap, pending: { ...snap.pending!, ...patch } }
}

async function flowOn(snap: Snapshot) {
  useGameStore().snapshot = snap
  const w = mount(TournamentFlow)
  await nextTick()
  return w
}

describe('E-05: the podium follows the INDEX, and a renamed word cannot move it', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    primed.length = 0
  })

  it('⚠ the control – a real beaten finalist hangs the silver poster', async () => {
    const snap = beatenFinalist()
    expect(snap.pending!.finishLabel, 'the engine names her result as it always did').toBe('Runner-up')
    const w = await flowOn(snap)
    expect(w.find('.tf-poster.silver').exists(), 'the podium is up, and it is silver rather than gold').toBe(true)
    expect(w.find('.tf-poster.out').exists(), 'and not the card that names somebody else').toBe(false)
    w.unmount()
  })

  it('⭐⭐ THE RENAME: «Finalist» over the same index, and the silver still hangs', async () => {
    // The owner's sanctioned wording change, applied to the one field it would touch. Under the word
    // comparison this poster disappears entirely – `kidChampion` is false and the word no longer
    // matches – so the card falls through to the non-podium branch and the silver trophy never flies.
    const snap = withPending(beatenFinalist(), { finishLabel: 'Finalist' })
    expect(snap.pending!.kidFinish, 'the FACT is untouched – only the word moved').toBe(1)
    const w = await flowOn(snap)
    expect(w.find('.tf-poster.silver').exists(), 'the result is the result, whatever it is called').toBe(true)
    expect(w.find('.tf-poster.out').exists(), 'and she is not handed somebody else\'s card').toBe(false)
    w.unmount()
  })

  it('⭐⭐ THE COLLISION: the word says «Runner-up» over a SEMI-FINALIST\'s index, and nothing hangs', async () => {
    // The direction a rename cannot produce and a display-vocabulary collision can: two outcomes
    // sharing one word. Under the word comparison this hangs a silver poster on a semi-final exit and
    // `continueFinale` then flies a trophy into a cabinet that holds none – `kidChampion || isRunnerUp`
    // is documented as «exactly the pair of finishes that put a piece of silverware in her cabinet».
    const snap = withPending(beatenFinalist(), { kidFinish: 2, finishLabel: 'Runner-up' })
    const w = await flowOn(snap)
    // ⚠ THE DISCRIMINATOR IS THE VARIANT AND NOT `.tf-poster`, which the finale wears either way: the
    // `v-else` card – «the same poster with somebody else's name on it» – is `.tf-poster.out`. Asserted
    // on the pair, so the case cannot pass by the screen simply failing to render.
    expect(w.find('.tf-poster.silver').exists(), 'no silver plate for a semi-final exit').toBe(false)
    expect(w.find('.tf-poster.out').exists(), 'the card that names somebody else\'s champion stands instead').toBe(true)
    w.unmount()
  })
})

describe('E-05: the celebration cue follows `isFinal`, not the round\'s name', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    primed.length = 0
  })

  it('⭐⭐ THE RENAME: a final under a different name still warms the celebration', async () => {
    // `roundLabel` is `stageLabel`'s word and the flow used to compare it. The engine's flag says this
    // round IS the final, so the clip is primed – which is what stops the applause arriving late on
    // the one screen the game is built for (R10-6's own argument).
    const snap = withPending(beatenFinalist(), { roundLabel: 'Championship match', isFinal: true })
    const w = await flowOn(snap)
    expect(primed, 'the final is in play, so the clip is warm').toContain('applauseFinal')
    w.unmount()
  })

  it('⭐ THE COLLISION: a round merely CALLED «Final» warms nothing', async () => {
    // The mirror, and it is the case that says the flag is being read rather than the name: a fixture
    // whose word is «Final» while the engine says the bracket has no final in it – the Nations Cup's
    // shape (`drawSize: null`, `isFinal: false`) wearing a knockout's vocabulary.
    const snap = withPending(beatenFinalist(), { roundLabel: 'Final', isFinal: false })
    const w = await flowOn(snap)
    expect(primed, 'no bracket, no celebration to warm').not.toContain('applauseFinal')
    w.unmount()
  })
})
