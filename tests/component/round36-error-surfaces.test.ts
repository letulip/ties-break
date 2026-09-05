// ⚠⚠ U-02 (review of 05.09, docs/review-principles-2026-09-05/03-ui.md) – THE STORE'S REFUSAL HAS A
// HOME ON EVERY SURFACE THAT CAN PROVOKE ONE.
//
// `stores/game.ts` writes four player-facing sentences into `error` – the cross-tab line, the
// generic refusal, "Simulation restarted from the last saved week." and the stale-screen line – and
// exactly five templates rendered them. Money, Calendar, Kid, This week and the takeovers showed
// NOTHING when a command was refused, and `run` clears `error` on the next command, so the
// explanation was gone by the time the player tapped again. W1-INTEGRITY-A and TB-05 exist so that
// "nothing happened" is always explained; on more than half the app it was not.
//
// ⚠ THE SENTENCE IS THE STORE'S OWN, TAKEN FROM THE STORE. `refusalSentence()` drives a REAL
// refusal through the real store with only the transport mocked, and every assertion below is
// against whatever came back. A literal typed here would keep passing on a build where the store had
// stopped writing one, and it would be a second copy of the owner's copy (CLAUDE.md invariant 4).
//
// ⚠ MUTATION-VERIFIED. Watched failing before it was believed: with `<StoreError />` removed from
// each surface in turn, that surface's case goes red naming it; with `.kid-hero:not(:first-child)`
// removed, the Kid margin case goes red at `-24px`. The log is in the wave's scratch as
// `u02-red.log`.
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import '../../src/style.css'
import { assertDismissReachable, setViewport, NARROW_PHONE, PHONE } from './fits'
import MoneyScreen from '../../src/components/screens/MoneyScreen.vue'
import CalendarScreen from '../../src/components/screens/CalendarScreen.vue'
import KidScreen from '../../src/components/screens/KidScreen.vue'
import ThisWeekScreen from '../../src/components/screens/ThisWeekScreen.vue'
import PlanWeekSheet from '../../src/components/PlanWeekSheet.vue'
import InboxSheet from '../../src/components/InboxSheet.vue'
import TournamentFlow from '../../src/components/TournamentFlow.vue'
import ForkDialog from '../../src/components/ForkDialog.vue'
import { useGameStore } from '../../src/stores/game'
import { request } from '../../src/worker/client'
import {
  createWorld,
  decideKnock,
  enterEvent,
  measureCollegeOffer,
  pendingKnock,
  tickWeek,
  toSnapshot,
} from '../../src/engine/world'
import { rngFromSeed } from '../../src/engine/rng'
import { careerSnapshot } from '../helpers/career'
import { DEFAULT_PROFILE, type Snapshot } from '../../src/shared/protocol'

// ⚠ THIS RUNNER HAS NO localStorage AND SOME OF THESE SCREENS READ IT AT SETUP. The same shim and
// the same argument as tests/component/round28-top-notices.test.ts, quoted there in full.
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

// Only the transport. The store, its recovery branch and its sentence are the shipped ones.
vi.mock('../../src/worker/client', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../src/worker/client')>()
  return { ...actual, request: vi.fn() }
})
const mockRequest = vi.mocked(request)

/**
 * ⭐ THE SENTENCE, PRODUCED RATHER THAN QUOTED. A cross-tab conflict is refused by the worker, the
 * store recognises the code and writes the line the player is meant to read (`game.ts`, the
 * SAVE_CONFLICT branch). Whatever it wrote is what every surface below is measured against.
 */
async function refusalSentence(): Promise<string> {
  const store = useGameStore()
  store.snapshot = careerSnapshot(1, 'u02-sentence')
  store.revision = 5
  mockRequest.mockResolvedValue({
    id: 0,
    ok: false,
    error: 'Save conflict: this career is at revision 8 on disk',
    code: 'SAVE_CONFLICT',
    revision: 8,
  })
  await store.advance(1)
  expect(store.error.length, 'the store still writes a sentence for a refused command').toBeGreaterThan(20)
  return store.error
}

/** A career standing on a tournament week, so the flow has something to draw. */
function tournamentSnapshot(seed = 'u02-tournament'): Snapshot {
  const world = createWorld(seed, { ...DEFAULT_PROFILE, coachTier: 'self' })
  const rng = rngFromSeed(world.seed)
  for (let i = 0; i < 60; i++) {
    if (pendingKnock(world)) decideKnock(world, 'rest')
    const snap = toSnapshot(world)
    if (snap.pending) return snap
    for (const e of snap.upcoming) {
      if (e.eligible && !e.entered && e.week > world.week) {
        try {
          enterEvent(world, e.id)
        } catch {
          /* affordability and caps are the engine's business; take whichever it allows */
        }
      }
    }
    tickWeek(world, rng)
  }
  throw new Error('no tournament reached in 60 weeks – the fixture, not the assertion, is broken')
}

/** A career standing at the fork, the same shape tests/component/round24-fork-places.test.ts uses. */
function forkSnapshot(seed = 'u02-fork'): Snapshot {
  const world = createWorld(seed, { ...DEFAULT_PROFILE, country: 'CZ' })
  world.bestFinishByTier.j300 = 3
  world.fork = { askedWeek: world.week, answer: null, offer: measureCollegeOffer(world) }
  return toSnapshot(world)
}

interface Surface {
  name: string
  snapshot: () => Snapshot
  mount: () => ReturnType<typeof mount>
}

/** The nine surfaces the review found silent, plus the two that were not. */
const SURFACES: Surface[] = [
  {
    name: 'MoneyScreen',
    snapshot: () => careerSnapshot(6, 'u02-money'),
    mount: () => mount(MoneyScreen, { attachTo: document.body }),
  },
  {
    name: 'CalendarScreen',
    snapshot: () => careerSnapshot(6, 'u02-calendar'),
    mount: () => mount(CalendarScreen, { attachTo: document.body }),
  },
  {
    name: 'KidScreen',
    snapshot: () => careerSnapshot(6, 'u02-kid'),
    mount: () => mount(KidScreen, { attachTo: document.body }),
  },
  {
    name: 'ThisWeekScreen',
    snapshot: () => careerSnapshot(6, 'u02-week'),
    mount: () => mount(ThisWeekScreen, { attachTo: document.body }),
  },
  {
    name: 'PlanWeekSheet',
    snapshot: () => careerSnapshot(6, 'u02-plan'),
    mount: () =>
      mount(PlanWeekSheet, {
        props: { week: useGameStore().snapshot!.week },
        attachTo: document.body,
        global: { stubs: { teleport: true } },
      }),
  },
  {
    name: 'InboxSheet',
    snapshot: () => careerSnapshot(6, 'u02-inbox'),
    mount: () => mount(InboxSheet, { attachTo: document.body, global: { stubs: { teleport: true } } }),
  },
  {
    name: 'TournamentFlow',
    snapshot: () => tournamentSnapshot(),
    mount: () => mount(TournamentFlow, { attachTo: document.body }),
  },
  {
    name: 'ForkDialog',
    snapshot: () => forkSnapshot(),
    mount: () => mount(ForkDialog, { attachTo: document.body }),
  },
]

describe('⚠⚠ U-02 – every surface that can provoke a refusal can say what it was', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    document.body.innerHTML = ''
    backing.clear()
    mockRequest.mockReset()
    setViewport(PHONE)
  })

  for (const surface of SURFACES) {
    it(`${surface.name} renders the store's sentence`, async () => {
      const sentence = await refusalSentence()
      const store = useGameStore()
      store.snapshot = surface.snapshot()
      store.error = sentence

      const wrapper = surface.mount()
      const line = wrapper.find('.error')
      expect(line.exists(), `${surface.name} still has nowhere to say a refusal`).toBe(true)
      expect(line.text()).toBe(sentence)
      // A live region, so a sentence that appears without moving focus is announced by something.
      expect(line.attributes('role')).toBe('status')
      wrapper.unmount()
    })

    it(`...and ${surface.name} shows nothing when nothing was refused`, async () => {
      const store = useGameStore()
      store.snapshot = surface.snapshot()
      store.error = ''

      // The anti-vacuity half: a surface that printed an empty box on every ordinary week would pass
      // the case above and be a regression on ten screens.
      const wrapper = surface.mount()
      expect(wrapper.find('.error').exists(), `${surface.name} draws an empty notice`).toBe(false)
      wrapper.unmount()
    })
  }

  // ⚠⚠ ROUND 35 #11, ON THE SCREEN BUILT THE SAME WAY. The owner found Home's refusal hanging UNDER
  // the photograph: `.diary-hero` cancels the shell's top inset with a negative margin, which is
  // true of an empty inset and a lie about one holding a sentence. `.kid-hero` is the identical
  // construction and had no sentence above it until U-02 put one there. happy-dom has no layout
  // engine but `getComputedStyle` is real (the component project sets `css: true`), so the rule is
  // measured through the real cascade rather than pinned as text.
  it('⚠⚠ the Kid hero stops eating the line the moment there is a line to eat', async () => {
    const sentence = await refusalSentence()
    const store = useGameStore()
    store.snapshot = careerSnapshot(6, 'u02-kid-margin')

    store.error = ''
    const quiet = mount(KidScreen, { attachTo: document.body })
    const quietTop = getComputedStyle(document.querySelector('.kid-hero')!).marginTop
    expect(quietTop, 'with no sentence the hero is full-bleed exactly as it shipped').not.toBe('0px')
    quiet.unmount()

    store.error = sentence
    const loud = mount(KidScreen, { attachTo: document.body })
    const loudTop = getComputedStyle(document.querySelector('.kid-hero')!).marginTop
    expect(loudTop, 'the photograph is still climbing over the sentence').toBe('0px')
    loud.unmount()
  })

  // ⚠ CLAUDE.md's standing rule: any dialog you add to or lengthen gets a mounted assertion that its
  // dismiss control's box is inside a 375x667 viewport. The fork has no dismiss – its three answers
  // ARE the exit – and its own note records that one extra LINE of copy already turned this
  // assertion red once at 320x568. So the card is measured with the refusal up, which is the tallest
  // it can ever be.
  it('⚠ the fork still reaches its answers with the refusal on the card', async () => {
    const sentence = await refusalSentence()
    const store = useGameStore()
    store.snapshot = forkSnapshot('u02-fork-fit')
    store.error = sentence

    const wrapper = mount(ForkDialog, { attachTo: document.body })
    const card = document.querySelector('.fork-card')!
    const answers = document.querySelector('.fork-answers')!
    expect(card.querySelector('.error'), 'the line is on the card being measured').toBeTruthy()
    expect(answers.lastElementChild?.textContent, 'the answers are still last in the flow').toContain('Stop here')

    const fit = assertDismissReachable(card, answers, PHONE, 'ForkDialog (refusal up)')
    expect(fit.scrollable, 'and what is past the fold can still be reached').toBe(true)
    assertDismissReachable(card, answers, NARROW_PHONE, 'ForkDialog (refusal up, narrow)')
    wrapper.unmount()
  })
})
