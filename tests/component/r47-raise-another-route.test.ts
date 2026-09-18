// ⭐⭐⭐ ROUND 47 #12 – «RAISE ANOTHER» GOES TO THE BEGINNING, MOUNTED THROUGH THE WHOLE SHELL.
//
// The owner, 18.09, off his finished career: «Raise another» started her at thirteen straight away,
// and it should simply send you to the start like everything else does.
//
// ⚠ THIS FILE MOUNTS `App.vue` ITSELF, which nothing else in `tests/component/` does, and it is the
// only honest way to make the claim. The defect was a ROUTE: it lived in the ORDER of two lines
// inside `EndingScreen`'s own handler and in which branch of App's `v-else-if` chain that order left
// standing. A test of either component alone sees neither half – the epilogue's existing test
// watched `game.newCareer` be called and called that correct, which is exactly what it did.
//
// ⚠ SHALLOW, WITH FOUR COMPONENTS LET THROUGH. `shallow: true` stubs every child, so the branch that
// won is readable as a component name (`ChildhoodPrologue` vs `OnboardingWizard` vs the tab shell's
// `HomeScreen`) without mounting the whole game. `EndingScreen` and its `PrimaryPill` are un-stubbed
// because the press under test is a real button inside a real footer.
//
// ⚠ WHAT WAS MEASURED ON THE OLD CODE, before anything was changed – the diagnosis this file pins:
// pressing the offer and picking a capital band called `game.newCareer`, which published a snapshot
// with no `ending`; `showEnding` went false, the takeover unmounted, and the app drew HomeScreen on
// a week-0, thirteen-year-old career. `EndingScreen`'s `newCareer` event NEVER REACHED App.vue –
// `emitted()` held only the bubbled DOM click – so App's handler was dead code on this path and its
// comment about «the wizard» described a route nothing took.
//
// ⚠ MUTATION-VERIFIED, counted over THIS file and `endings-ui.test.ts` together (26 tests). Each was
// applied, the two files run, the red watched, and the code restored:
//   * EndingScreen's `raiseAnother` restored to creating a career before the emit
//                                          -> 6 red. The defect itself, and every arm of the route
//                                             names a different face of it.
//   * App's `raiseAnother` losing `newGameRoute.value = 'prologue'`
//                                          -> 0 red, RECORDED RATHER THAN HIDDEN: the
//                                             `showOnboarding` watcher sets the same route a tick
//                                             later, so that line documents the destination beside
//                                             the prologue-vs-tour comment and is not the mechanism.
//                                             The pin that holds it is the named-function arm.
//   * `@new-career="raiseAnother"` reverted to the inline `game.$patch({ snapshot: null })`
//                                          -> 1 red (the named-function arm).
//   * `markTourSeen()` added to App's `raiseAnother`
//                                          -> 1 red (the tour arm). ⚠ THE FIRST VERSION OF THAT ARM
//                                             SCORED 0 ON THIS MUTATION and was rewritten – see its
//                                             own note for why storage cannot be watched here.
//   * the single pill in EndingScreen.vue given back a two-step `v-if="!asking"`
//                                          -> 5 red (the one-control arm and every arm that presses
//                                             through to a route).
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import App from '../../src/App.vue'
import EndingScreen from '../../src/components/EndingScreen.vue'
import { useGameStore } from '../../src/stores/game'
import { createWorld, toSnapshot } from '../../src/engine/world'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { DEFAULT_PROFILE, type Snapshot } from '../../src/shared/protocol'
import { moneyOf } from '../helpers/careerMoney'

/** ⚠ NOT `componentFile()`. That helper resolves against `import.meta.url`, which under happy-dom is
 *  an http scheme and throws – round-14's own note records the same discovery. Vitest's cwd is the
 *  repo root, so this is the component project's established way of reading a source file, and the
 *  claim below is still the NEGATIVE one `componentFile` exists for: the `.vue` ALONE, never widened
 *  by a composable (tests/pin-hygiene.test.ts's rule). */
const repoFile = (rel: string): string => readFileSync(resolve(process.cwd(), rel), 'utf8')

/** ⚠ THE LITERAL, BECAUSE App.vue DECLARES IT PRIVATELY. `TOUR_SEEN_KEY` is a `const` inside
 *  `<script setup>` and there is nothing to import; the arm below asserts the shipped spelling so a
 *  rename cannot leave this test measuring a key nothing writes. */
const TOUR_SEEN_KEY = 'tb:onboardingTourSeen'

/** A finished career, the shape `showEnding` routes on: a snapshot whose `ending` view is set. */
function endedSnapshot(): Snapshot {
  return {
    ageYears: 19,
    week: 265,
    kidRank: 88,
    fundsCents: 1234_00,
    careerId: 'career-1',
    profile: DEFAULT_PROFILE,
    careerTotals: { earnedCents: 0, spentCents: 0, prizeCents: 0 },
    careerMoney: moneyOf({ earnedCents: 0, spentCents: 0, prizeCents: 0, weeksLostToInjury: 0 }),
    ending: {
      ending: { type: 'stopped', week: 265, ageYears: 19, detail: 'she stopped', resumesWeek: null },
      album: [
        {
          slot: 1, why: 'why 1', caption: 'caption 1', fact: 'fact 1', week: 0, seasonIndex: 0,
          stage: 'teen', emotion: 'norm', empty: false,
        },
      ],
      scroll: [],
      handoff: { childBorn: false, freshCapitalFork: true, resumesWeek: null, resumesAgeYears: null },
      totals: { earnedCents: 0, spentCents: 0, prizeCents: 0, weeksLostToInjury: 0 },
      money: moneyOf({ earnedCents: 0, spentCents: 0, prizeCents: 0, weeksLostToInjury: 0 }),
      seasonsPlayed: 5, bestRank: 88, bestRankTrack: 'wta', titles: 0, oneMoreYearCount: 0,
      academy: null, lifetimeDeal: null, college: null,
    },
  } as unknown as Snapshot
}

/** A brand-new career, week 0 – what `game.newCareer` publishes, at the age the owner complained
 *  about. ⚠ BUILT BY THE REAL ENGINE and not by hand: this one is handed to the TAB SHELL, which
 *  reads `vacations`, `practices` and a dozen other fields through `useWeekAction`, and a
 *  hand-written stub dies in a composable rather than in an assertion. The ending field is null,
 *  which is the whole mechanism – `showEnding` reads it. */
function freshSnapshot(): Snapshot {
  return toSnapshot(createWorld('r47-fresh', DEFAULT_PROFILE, 'career-2'))
}

/** The shell, past the splash, on a finished career – with the epilogue and its pill real.
 *
 *  ⚠⚠ THE `newCareer` STUB PUBLISHES A SNAPSHOT, AND THAT IS NOT DECORATION. The real action ends in
 *  `applySnapshot`, and publishing is exactly what made the old code skip the route: the fresh
 *  snapshot has no `ending`, so the shell swapped this takeover out before the emit could run. A
 *  stub that only records the call CANNOT reproduce the defect – measured: with a recording-only
 *  stub, restoring the old handler reddened 2 of these tests instead of 4, and the two that stayed
 *  green were the two about where the player LANDS. */
function mountShell(): { wrapper: ReturnType<typeof mount>; newCareer: ReturnType<typeof vi.fn> } {
  const game = useGameStore()
  game.init = vi.fn(async () => {})
  const newCareer = vi.fn(async () => {
    game.snapshot = freshSnapshot()
  })
  game.newCareer = newCareer
  game.$patch({ ready: true, phase: 'ready', snapshot: endedSnapshot() })
  const wrapper = mount(App, {
    shallow: true,
    global: { stubs: { EndingScreen: false, PrimaryPill: false, Polaroid: false, Eyebrow: false } },
    attachTo: document.body,
  })
  // SplashScreen is a stub here; the shell shows it on every launch and its `done` is the way past.
  wrapper.findComponent({ name: 'SplashScreen' }).vm.$emit('done')
  return { wrapper, newCareer }
}

/** Press the offer on the album's last page, and let the route settle. */
async function pressRaiseAnother(wrapper: ReturnType<typeof mount>): Promise<void> {
  const pill = wrapper.findAll('button').find((b) => b.text().includes('Raise another'))
  expect(pill, 'the offer is not on the epilogue').toBeTruthy()
  await pill!.trigger('click')
  await wrapper.vm.$nextTick()
  await new Promise((r) => setTimeout(r, 0))
  await wrapper.vm.$nextTick()
}

describe('⭐⭐⭐ #12 – the epilogue hands the player back to the childhood', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    document.body.innerHTML = ''
  })

  it('⭐⭐ one press lands on the PROLOGUE, not the wizard and not the game', async () => {
    const { wrapper } = mountShell()
    await wrapper.vm.$nextTick()
    expect(wrapper.findComponent({ name: 'EndingScreen' }).exists(), 'the epilogue is up').toBe(true)

    await pressRaiseAnother(wrapper)

    expect(
      wrapper.findComponent({ name: 'ChildhoodPrologue' }).exists(),
      'the childhood is not what the press reached',
    ).toBe(true)
    expect(wrapper.findComponent({ name: 'OnboardingWizard' }).exists(), 'the wizard').toBe(false)
    expect(wrapper.findComponent({ name: 'EndingScreen' }).exists(), 'the epilogue stayed').toBe(false)
    wrapper.unmount()
  })

  it('⭐⭐ ...and NO career is made on the way – the thirteen-year-old is gone', async () => {
    const { wrapper, newCareer } = mountShell()
    await wrapper.vm.$nextTick()
    await pressRaiseAnother(wrapper)

    const game = useGameStore()
    // The whole of the defect in one assertion: the epilogue used to build a profile and create a
    // career here, at thirteen, week 0. The childhood creates the career on its ninth card now.
    expect(newCareer, 'a career was created by the epilogue').not.toHaveBeenCalled()
    expect(game.snapshot, 'the finished career is out of memory').toBe(null)
    wrapper.unmount()
  })

  it('⚠ the game shell is never drawn on a week-0 career on the way through', async () => {
    const { wrapper } = mountShell()
    await wrapper.vm.$nextTick()
    await pressRaiseAnother(wrapper)
    // The measured old behaviour, stated as the thing that must not come back: HomeScreen, the
    // bottom bar and the week button, on a career the player never agreed to.
    expect(wrapper.findComponent({ name: 'HomeScreen' }).exists(), 'the game shell').toBe(false)
    expect(wrapper.find('.tab-bar').exists(), 'the tab bar').toBe(false)
    expect(wrapper.find('.next-week-bar').exists(), 'the week button').toBe(false)
    wrapper.unmount()
  })

  it('⚠⚠ the TOUR is a different thing and the route does not SPEND it – «once, ever, per device»', async () => {
    // His ruling. The PROLOGUE belongs to a CAREER and is walked again for every career that wants
    // one – that is what he asked for. The TOUR is the coach marks, it is per DEVICE, and the two
    // share this route and nothing else. So the claim is that the route does not consume the flag.
    //
    // ⚠ IT IS PROVED THROUGH THE SHELL'S OWN GATE AND NOT THROUGH STORAGE, BECAUSE THIS RUNNER HAS
    // NONE. `localStorage` is undefined here (prologue-two-paths.test.ts records the same), so
    // `useDeviceFlag` reads false and its write throws and is swallowed – there is nothing to spy
    // on and a spy-based arm measured NOTHING: it stayed green with `markTourSeen()` added to the
    // route. What IS observable is the flag's in-memory half, through `tourWanted`: this device has
    // never been onboarded, so if it takes the childhood's own way out to the wizard, its tour must
    // still be waiting on the far side. A route that marked the device would have eaten it.
    const { wrapper } = mountShell()
    const game = useGameStore()
    await wrapper.vm.$nextTick()
    await pressRaiseAnother(wrapper)
    // ...the marks do not open over the childhood either – there is no career for them to point at.
    expect(wrapper.findComponent({ name: 'OnboardingTour' }).exists(), 'the tour is over the childhood').toBe(false)

    // The way out of the nine cards, and then the career the wizard would make.
    wrapper.findComponent({ name: 'ChildhoodPrologue' }).vm.$emit('skip')
    await wrapper.vm.$nextTick()
    expect(wrapper.findComponent({ name: 'OnboardingWizard' }).exists(), 'the skip branch').toBe(true)
    game.snapshot = freshSnapshot()
    await wrapper.vm.$nextTick()
    expect(
      wrapper.findComponent({ name: 'OnboardingTour' }).exists(),
      'the route spent this device`s tour',
    ).toBe(true)
    wrapper.unmount()
  })

  it('⚠ the route is a NAMED function on the shell, so the distinction has code to sit beside', () => {
    // A NEGATIVE claim about ONE file, so it reads that `.vue` ALONE and nothing it imports. The
    // inline `game.$patch(...)` handler that used to be on this binding cannot come back without the
    // comment explaining prologue-vs-tour losing the line it explains.
    const appFile = repoFile('src/App.vue')
    expect(appFile).toContain('@new-career="raiseAnother"')
    expect(appFile, 'the handler went back inline').not.toContain('@new-career="game.$patch')
    // ...and the key the arm above names is the key the shell actually reads.
    expect(appFile).toContain(`TOUR_SEEN_KEY = '${TOUR_SEEN_KEY}'`)
  })
})

describe('⚠ #12 – what the epilogue stopped doing', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    document.body.innerHTML = ''
  })

  it('the offer is ONE control now – no capital fork behind it', async () => {
    const game = useGameStore()
    game.$patch({ snapshot: endedSnapshot() })
    const w = mount(EndingScreen)
    expect(w.text()).toContain('Raise another')
    await w.findAll('button').find((b) => b.text().includes('Raise another'))!.trigger('click')
    expect(w.findAll('.ending-fork-option'), 'the three bands are still asked here').toHaveLength(0)
    expect(w.emitted('newCareer')?.length, 'one press, one event').toBe(1)
    w.unmount()
  })
})
