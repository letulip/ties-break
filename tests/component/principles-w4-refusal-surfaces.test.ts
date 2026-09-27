// ⭐⭐ E-09 / T4.8 – THE FIVE HAND-ROLLED REFUSAL LINES, AND THE TAKEOVER THAT HAD NONE.
//
// THE CENSUS, AND WHAT EACH WAVE CLOSED (docs/review-principles-2026-09-26/05-ui.md, E-09, carried
// from U-02). `ui/StoreError.vue`'s own header calls itself «a home for» «the five shipped copies»,
// and until this wave it had collected none of them:
//
//   U-02 (05.09, `698c13e3`)  nine surfaces that rendered NOTHING got `<StoreError />`:
//                             Money, Calendar, Kid, This week, PlanWeekSheet, InboxSheet,
//                             TournamentFlow, ForkDialog.
//   W2   (26.09, `bc52f26d`)  the five BLOCKING cards, which rendered a refusal nowhere at all:
//                             Knock, ShootClash, Birthday, LifeBeat, Retirement. ⚠ ALREADY CLOSED
//                             BEFORE THIS FILE EXISTED – nothing here re-does it, and their own net is
//                             tests/component/principles-w2-blocking-card-refusal.test.ts.
//   W4   (27.09, this)        the five hand-rolled COPIES, which rendered the sentence with no live
//                             region, and `EndingScreen`, which rendered no element at all.
//
// ⚠⚠ ALL FIVE COPIES, SINCE 27.09 – and this note used to say FOUR. `SeasonScreen.vue` was another
// builder's file in this same wave, so E-09 was left with one open site and the wave's claim («the
// five hand-rolled refusal lines → `<StoreError />`») was false by one screen. That builder landed
// the fifth on the same day and it joined the table below, which is what the old note said would
// happen: «the day the fifth moves it joins a table rather than needing a test». So the count here is
// SIX surfaces for FIVE copies plus EndingScreen, and the table is the statement of it.
//
// ⚠ THE SENTENCE IS PRODUCED, NOT TYPED. `refusalSentence()` drives a REAL refusal through the real
// store with only the transport mocked, exactly as round36-error-surfaces.test.ts does, and every
// assertion is against whatever came back. A literal here would be a second copy of the owner's copy
// (CLAUDE.md invariant 4) and would keep passing on a build where the store had stopped writing one.
//
// ⚠ MUTATION ARMS, each applied alone and watched RED (outputs in the wave's report):
//   * `<StoreError />` removed from each of the five surfaces in turn → that surface's pair of cases;
//   * `role="status"` dropped from StoreError.vue → all five «announced by nothing» assertions;
//   * `except` ignored in StoreError.vue (`shown` reading `game.error` straight) → More's
//     double-sentence case alone, the others green.
import 'fake-indexeddb/auto'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import { nextTick } from 'vue'
import { createPinia, setActivePinia } from 'pinia'
import '../../src/style.css'
import HomeScreen from '../../src/components/screens/HomeScreen.vue'
import CoachMarketScreen from '../../src/components/screens/CoachMarketScreen.vue'
import SeasonScreen from '../../src/components/screens/SeasonScreen.vue'
import MoreScreen from '../../src/components/screens/MoreScreen.vue'
import OnboardingWizard from '../../src/components/OnboardingWizard.vue'
import EndingScreen from '../../src/components/EndingScreen.vue'
import { useGameStore } from '../../src/stores/game'
import { request } from '../../src/worker/client'
import { careerSnapshot } from '../helpers/career'
import { moneyOf } from '../helpers/careerMoney'
import { dynastyOf } from '../helpers/dynastyHandover'
import type { AlbumPage, EndingView, Snapshot } from '../../src/shared/protocol'
import { PHONE, setViewport } from './fits'

// ⚠ THIS RUNNER HAS NO localStorage AND FOUR OF THESE FIVE READ IT AT SETUP – the same shim and the
// same argument as round36-error-surfaces.test.ts, quoted there in full.
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

// Only the transport. The store, its refusal branch and its sentence are the shipped ones.
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
  store.snapshot = careerSnapshot(1, 'w4-e09-sentence')
  store.revision = 5
  mockRequest.mockResolvedValueOnce({
    id: 0,
    ok: false,
    error: 'Save conflict: this career is at revision 8 on disk',
    code: 'SAVE_CONFLICT',
    revision: 8,
  } as never)
  await store.advance(1)
  expect(store.error.length, 'the store still writes a sentence for a refused command').toBeGreaterThan(20)
  return store.error
}

/** ⚠ THE EPILOGUE'S FIXTURE IS `wave10-dynasty-door.test.ts`'S, WHICH IS THE HOUSE SHAPE FOR THIS
 *  SCREEN – and it is that file's rather than a fresh one because the keys matter: the album is
 *  `view.album` and the resume week is `view.handoff.resumesWeek`, so a hand-invented `pages` or
 *  `resumes` renders an epilogue with no album and no footer while every root-level assertion passes.
 *  ONE page, deliberately: the footer exists on the LAST page only, and with one page the first IS the
 *  last, so the refusal line's own section is on screen without a walk. */
function endingView(): EndingView {
  const totals = { earnedCents: 0, spentCents: 0, prizeCents: 0, weeksLostToInjury: 0 }
  return {
    ending: { type: 'natural', week: 900, ageYears: 31, detail: 'she stopped at thirty-one', resumesWeek: null },
    album: [
      {
        slot: 0,
        why: 'why 0',
        caption: 'caption 0',
        fact: 'fact 0',
        week: 0,
        seasonIndex: 0,
        stage: 'teen',
        emotion: 'norm',
        empty: false,
      } as AlbumPage,
    ],
    scroll: [],
    handoff: { childBorn: false, freshCapitalFork: true, resumesWeek: null, resumesAgeYears: null },
    totals,
    money: moneyOf(totals),
    seasonsPlayed: 17,
    bestRank: 11,
    bestRankTrack: 'wta',
    titles: 9,
    oneMoreYearCount: 2,
    academy: null,
    lifetimeDeal: null,
    college: null,
    dynasty: dynastyOf(),
  } as EndingView
}

/** More, on its Saves tab – where both the save-op row and the store's refusal live. */
async function openMoreSaves(): Promise<VueWrapper> {
  const wrapper = mount(MoreScreen, { attachTo: document.body, global: { stubs: { teleport: true } } })
  await nextTick()
  const tab = wrapper.findAll('.more-tabs .tab-pill').find((t) => t.text() === 'Saves')
  expect(tab, 'More has no Saves tab, so the line has no section').toBeTruthy()
  await tab!.trigger('click')
  await nextTick()
  return wrapper
}

interface Surface {
  name: string
  /** Put the store in the state this surface is drawn from, then mount and reach the line's step. */
  mount: () => Promise<VueWrapper>
}

const SURFACES: Surface[] = [
  {
    name: 'HomeScreen',
    mount: async () => {
      useGameStore().snapshot = careerSnapshot(30, 'w4-e09-home')
      return mount(HomeScreen, { props: { recapFresh: false }, attachTo: document.body, global: { stubs: { teleport: true } } })
    },
  },
  {
    name: 'CoachMarketScreen',
    mount: async () => {
      useGameStore().snapshot = careerSnapshot(30, 'w4-e09-coach')
      return mount(CoachMarketScreen, { attachTo: document.body, global: { stubs: { teleport: true } } })
    },
  },
  {
    // ⭐ THE FIFTH COPY, ADDED 27.09 WITH ITS FIX. The Season Planner is the screen where every entry
    // is committed, cancelled and paid for, so it commands more than any other surface in this table –
    // and its refusal was a bare paragraph with no live region. `tests/helpers/mountSeason.ts` is the
    // arrangement four suites already share (store-driven, teleports stubbed); `attachTo` is added here
    // because this file measures the cascade.
    name: 'SeasonScreen',
    mount: async () => {
      useGameStore().snapshot = careerSnapshot(30, 'w4-e09-season')
      return mount(SeasonScreen, { attachTo: document.body, global: { stubs: { teleport: true } } })
    },
  },
  {
    name: 'MoreScreen',
    // ⚠ THE LINE IS BEHIND THE SAVES TAB (`screenTab === 'saves'`) and the default tab is Play, so the
    // tab is pressed the way a player presses it rather than by writing the ref.
    mount: async () => {
      useGameStore().snapshot = careerSnapshot(30, 'w4-e09-more')
      return openMoreSaves()
    },
  },
  {
    name: 'OnboardingWizard',
    // ⚠ THE LINE IS ON THE LAST STEP AND THE WALK IS A PLAYER'S – the country step is a real gate
    // (`nextDisabled` holds it until a tile is pressed), so a `step.value = 6` shortcut would measure a
    // screen nobody can reach. r37-onboarding-label-and-refusal.test.ts's helper, in shape.
    mount: async () => {
      const wrapper = mount(OnboardingWizard, { attachTo: document.body, global: { stubs: { teleport: true } } })
      await nextTick()
      for (let i = 0; i < 6 && !document.querySelector('.ob-summary'); i += 1) {
        const tile = wrapper.find('.ob-tile')
        if (tile.exists()) {
          await tile.trigger('click')
          await nextTick()
        }
        await wrapper.find('.ob-cta').trigger('click')
        await nextTick()
      }
      expect(document.querySelector('.ob-summary'), 'the wizard reached its last step').not.toBeNull()
      return wrapper
    },
  },
  {
    name: 'EndingScreen',
    mount: async () => {
      useGameStore().$patch({
        snapshot: {
          ageYears: 31,
          week: 900,
          kidRank: 11,
          fundsCents: 1234_00,
          careerTotals: { earnedCents: 0, spentCents: 0, prizeCents: 0 },
          careerMoney: moneyOf({ earnedCents: 0, spentCents: 0, prizeCents: 0, weeksLostToInjury: 0 }),
          ending: endingView(),
        } as unknown as Snapshot,
      })
      const wrapper = mount(EndingScreen, { attachTo: document.body })
      await nextTick()
      expect(wrapper.find('.ending-foot').exists(), 'the epilogue drew no footer, so the line has no section').toBe(true)
      return wrapper
    },
  },
]

let wrappers: VueWrapper[] = []

beforeEach(() => {
  setActivePinia(createPinia())
  backing.clear()
  document.body.innerHTML = ''
  mockRequest.mockReset()
  // ⚠ A WELL-FORMED DEFAULT REPLY, because More's mount REFRESHES on its own. `refreshSlots` and
  // `refreshCareers` read `res.ok` off whatever the transport hands back and deliberately swallow a
  // failure (their note in stores/game.ts says why); an un-stubbed mock hands back `undefined` and they
  // throw an unhandled rejection, which vitest counts as an error even while every case passes. The
  // refusal below is a `mockResolvedValueOnce` on top of this.
  mockRequest.mockImplementation((async (msg: { type: string }) => {
    if (msg.type === 'listSlots') return { id: 0, ok: true, type: 'slots', revision: 5, slots: [] }
    if (msg.type === 'listCareers') return { id: 0, ok: true, type: 'careers', revision: 5, careers: [] }
    return { id: 0, ok: true, revision: 5 }
  }) as never)
  setViewport(PHONE)
})

afterEach(() => {
  for (const w of wrappers) w.unmount()
  wrappers = []
  document.body.innerHTML = ''
})

// ⚠ THE TITLE NAMES NO NUMBER SINCE 27.09, and that is deliberate: it said «the five surfaces» while
// the table held five, the fifth copy landed the same day and made it six, and a count a test states
// about itself is the thing wave 9 measured rotting through a full gate. The table is the count.
describe('E-09 – the surfaces that said a refusal badly, or not at all', () => {
  for (const surface of SURFACES) {
    it(`⭐⭐ ${surface.name} renders the store's own sentence, in a live region`, async () => {
      const sentence = await refusalSentence()
      const store = useGameStore()
      // ⚠ THE SNAPSHOT IS SET BY THE MOUNT CLOSURE, AFTER the sentence is produced: `refusalSentence`
      // poses its own career, and a surface measured against that one would be measuring the fixture.
      const wrapper = await surface.mount()
      wrappers.push(wrapper)
      store.error = sentence
      await nextTick()

      const line = wrapper.find('.error')
      expect(line.exists(), `${surface.name} still has nowhere to say a refusal`).toBe(true)
      expect(line.text(), `${surface.name} says something other than what the store wrote`).toBe(sentence)
      // THE HALF THE HAND-ROLLED COPIES ALL MISSED: a sentence that appears without moving focus is
      // announced by nothing otherwise.
      expect(line.attributes('role'), `${surface.name}'s refusal is announced by nothing`).toBe('status')
    })

    it(`...and ${surface.name} draws nothing when nothing was refused`, async () => {
      const wrapper = await surface.mount()
      wrappers.push(wrapper)
      useGameStore().error = ''
      await nextTick()
      // The anti-vacuity half: a surface that printed an empty box every ordinary week would pass the
      // case above and be a regression on five screens.
      expect(wrapper.find('.error').exists(), `${surface.name} draws an empty notice`).toBe(false)
    })
  }

  it('⚠⚠ MoreScreen does not say one refusal twice – the guard its copy was hand-rolled for', async () => {
    // THE CONDITION THAT MADE IT A COPY. More's Saves strip renders `saveOp.message` in its own row,
    // so the ONE sentence this element must not repeat is that one: «Import failed – …» printed once
    // as the operation's result and once as the store's error was the reason the screen wrote its own
    // paragraph instead of taking the component. `except` carries exactly that sentence.
    const sentence = await refusalSentence()
    const store = useGameStore()
    store.snapshot = careerSnapshot(30, 'w4-e09-more-except')
    const wrapper = await openMoreSaves()
    wrappers.push(wrapper)

    store.error = sentence
    store.saveOp = { op: 'import', status: 'error', message: sentence }
    await nextTick()
    const shown = wrapper.findAll('.error').filter((p) => p.text().includes(sentence))
    expect(shown.length, 'the same refusal is on the screen twice').toBe(1)
    expect(shown[0].classes(), 'the one that survived is not the Saves strip\'s own row').toContain('save-op-row')

    // ...and a DIFFERENT sentence in `saveOp` suppresses nothing, which is what keeps `except` a guard
    // rather than a mute button.
    store.saveOp = { op: 'import', status: 'error', message: 'Import failed – the file is not one of ours.' }
    await nextTick()
    expect(
      wrapper.findAll('.error').filter((p) => p.text() === sentence).length,
      'the store\'s refusal was suppressed by an unrelated save result',
    ).toBe(1)
  })
})
