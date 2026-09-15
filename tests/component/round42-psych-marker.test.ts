// =================================================================================================
// ⭐⭐ ROUND 42 #28 – THE OFF-SEASON MARKER, ON BOTH ENTRIES OF ONE PATH
// =================================================================================================
//
// The owner, 14.09: «в межсезонье привлекать внимание к выбору новой ветки психолога … маркер жёлтый
// на плашку на home и на support stuff» (quoted here rather than in a template –
// tests/round13-nav.test.ts bans Cyrillic inside one).
//
// The machinery already existed – the 7px accent dot in both its flavours – and so did the STATE:
// `psychologistFocusOpen` (the engine's own answer to «would a change be accepted this week», which
// is empty when nobody is hired, when she declines, when the window is shut and when this season's
// change is spent) × `diary.facts.offSeasonWeek`. This round is one selector over those two facts
// and two renders of it, so the marker cannot be up on one surface and down on the other.
//
// ⚠ THE PATH IS WHY THERE ARE TWO. Home's Coach-note plate is the only door on Home into the Coach
// Market, and the Support-staff TAB is the entry to the screen the psychologist's row lives on. A
// dot on the plate alone drops the player on a screen that says nothing; a dot on the tab alone is
// invisible until they are already there.
//
// ⚠⚠ THE ARM LEDGER – every mutation applied, run and reverted BY HAND (never `git checkout`), with
// each touched file's md5 asserted back to pristine before the next arm. The counts are MEASURED.
//
//   CONTROL, run first and green: this file 9 · psychologist-card 15 · masseur-card 7 = 31/31.
//   Every arm below was run against that same set of three files.
//
//   ARM 1  `psychologistFocusNudge` drops its `offSeasonWeek` term (returns `open.length > 0`).
//          **2 RED, as predicted**: §2's mid-season case and §3's sweep. This is the arm that
//          matters most – the open list is NON-EMPTY mid-season while the first pick is still free,
//          so without that term a freshly hired seat wears the dot for fifty-two weeks running,
//          which is the opposite of «в межсезонье привлекать внимание».
//
//   ARM 2  `psychologistFocusNudge` drops its `psychologistFocusOpen.length` term.
//          **3 RED, where 2 were predicted**: §2's dies-on-use case, §2's unhired case and §3's
//          sweep – the sweep was the miss, and it is the case that answers for both surfaces at
//          once, so it goes red under every arm that moves the selector.
//
//   ARM 3  the `v-if="psychologistNudge"` deleted from Home's coach plate (the dot always drawn).
//          **5 RED, where 3 were predicted**: all four of §2's negative cases plus §3's sweep. The
//          prediction forgot the window-closing case, which is a fourth negative on Home.
//
//   ARM 4  the Coach Market's `tabsWithMarker` replaced by the bare `TABS` (the tab never dots).
//          **4 RED, as predicted**: §1's open case, §3's sweep, §4's colour case and §4's width
//          case – every one of them on the tab, and none of them on Home, which is what makes the
//          two surfaces independently pinned rather than pinned together.
//
//   ARM 5  `.note-dot.is-attention`'s `background: var(--attention)` deleted, so the marker paints
//          the shipped lime. **1 RED, as predicted**: §4's colour case.
import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { nextTick } from 'vue'
import '../../src/style.css'
import HomeScreen from '../../src/components/screens/HomeScreen.vue'
import CoachMarketScreen from '../../src/components/screens/CoachMarketScreen.vue'
import { useGameStore } from '../../src/stores/game'
import {
  createWorld,
  tickWeek,
  closeTournament,
  skipTournament,
  decideKnock,
  pendingKnock,
  pendingBirthday,
  birthdayOfferFor,
  chooseGift,
  hirePsychologist,
  setPsychologistFocus,
  toSnapshot,
} from '../../src/engine/world'
// ⚠ THE CALENDAR'S OWN CONSTANTS, from the module that owns them – `engine/world` imports these two
// but does not re-export them, and tests/wave5-psychologist-focus.test.ts reaches them the same way.
import { OFF_SEASON_WEEKS, WEEKS_PER_YEAR, isOffSeasonWeek } from '../../src/engine/season/calendar'
import { rngFromSeed } from '../../src/engine/rng'
import { DEFAULT_PROFILE, psychologistFocusNudge, type Snapshot } from '../../src/shared/protocol'
import type { WorldState } from '../../src/engine/world'
import { PHONE, TABLET, DESKTOP, setViewport, type Viewport } from './fits'
import { parseColor } from './contrast'

/** The first week of the FIRST off-season – read off the calendar's own constants rather than typed
 *  out, so a re-tuned `OFF_SEASON_WEEKS` moves the fixture with it.
 *
 *  ⚠ THE FIRST ONE, AND THAT IS A MEASUREMENT RATHER THAN A PREFERENCE. `tests/wave5-psychologist-
 *  focus.test.ts` poses `world.week = 250` directly, which is legitimate for a pure engine read;
 *  a MOUNTED case needs a real `toSnapshot`, and a world whose week was jumped to 250 without the
 *  250 ticks behind it does not return from one (measured: no answer inside four minutes). So this
 *  file WALKS, and it walks to the nearest honest off-season instead. */
const OFF_SEASON = WEEKS_PER_YEAR - OFF_SEASON_WEEKS

/** Tick a live world on to `week` with every tournament skipped and the family held solvent – the
 *  walk tests/component/wave1-mood-word.test.ts opens with, as a function of a world rather than of
 *  a seed, because §2's window-closing case has to carry ONE career across a season boundary. */
function tickTo(world: WorldState, week: number): WorldState {
  const rng = rngFromSeed(world.seed)
  while (world.week < week) {
    world.fundsCents = Math.max(world.fundsCents, 500_000_00)
    if (pendingKnock(world)) decideKnock(world, 'rest')
    const age = pendingBirthday(world)
    // ⚠ ROUND 42 #26 – THE ENGINE'S OWN SEAM, NOT A REBUILT OFFER. `birthdayOffer(world.seed, age)` is a
    // SECOND derivation of the four rows and it diverges the moment a given durable leaves the card, so
    // `chooseGift` refuses the answer – the R2-18 failure `tests/round23-kid-life.test.ts` wrote down.
    if (age !== null) chooseGift(world, birthdayOfferFor(world, age).options[0].id)
    tickWeek(world, rng)
    if (world.pendingTournament) {
      skipTournament(world)
      closeTournament(world)
    }
  }
  world.fundsCents = Math.max(world.fundsCents, 500_000_00)
  return world
}

function careerAt(week: number, seed: string): WorldState {
  return tickTo(createWorld(seed, { ...DEFAULT_PROFILE, birthMonth: 6 }), week)
}

/** ...and the same career with the professional door open and the seat filled. The pro door is her
 *  first counting W-series result on the never-pruned mark – the same fixture
 *  tests/component/psychologist-card.test.ts and tests/wave5-psychologist-focus.test.ts open with. */
function hired(seed: string, week: number): WorldState {
  const world = careerAt(week, seed)
  world.bestFinishByTier.w15 = 0
  hirePsychologist(world, true)
  return world
}

function homeOf(snap: Snapshot, attach = false) {
  useGameStore().snapshot = snap
  return mount(HomeScreen, {
    props: { recapFresh: false },
    global: { stubs: { teleport: true } },
    ...(attach ? { attachTo: document.body } : {}),
  })
}

async function marketOf(snap: Snapshot, attach = false) {
  useGameStore().snapshot = snap
  const wrapper = mount(CoachMarketScreen, {
    global: { stubs: { teleport: true } },
    ...(attach ? { attachTo: document.body } : {}),
  })
  await nextTick()
  return wrapper
}

/** The marker on Home's support plate – found by its own hook, never by counting dots, because the
 *  card grid already carries the recap's lime one on the tournament plate. */
const homeMarker = (w: ReturnType<typeof homeOf>) =>
  w.find('.coach-card [data-nudge="psychologist-focus"]')

/** ...and the one on the Support-staff segment. */
const tabMarker = (w: { findAll: (s: string) => { attributes: (a: string) => string | undefined; text: () => string; find: (s: string) => { exists: () => boolean } }[] }) => {
  const pill = w.findAll('.tb-seg .tab-pill').find((b) => b.text().trim() === 'Support staff')
  expect(pill, 'the Support staff segment is not on the screen at all').toBeTruthy()
  return pill!
}

describe('⭐⭐ round 42 #28 – the off-season psychologist marker', () => {
  beforeEach(() => setActivePinia(createPinia()))

  // ===============================================================================================
  // §1 – THE WINDOW IS OPEN: THE DOT IS UP ON BOTH ENTRIES
  // ===============================================================================================
  it('⭐ an off-season week with the change unused lights the dot on Home AND on the tab', async () => {
    const snap = toSnapshot(hired('r42-dot-open', OFF_SEASON))
    // The arm has to BE that week, and both halves are asserted rather than assumed.
    expect(snap.diary.facts.offSeasonWeek, 'this is an off-season week').toBe(true)
    expect(snap.psychologistFocusOpen.length, 'the engine would accept a change').toBeGreaterThan(0)
    expect(psychologistFocusNudge(snap), 'the selector agrees with its own two facts').toBe(true)

    const onHome = homeOf(snap)
    expect(homeMarker(onHome).exists(), 'Home\'s support plate carries no marker').toBe(true)
    onHome.unmount()

    const onMarket = await marketOf(snap)
    expect(
      tabMarker(onMarket).find('.tab-pill-dot').exists(),
      'the Support-staff entry carries no marker',
    ).toBe(true)
    onMarket.unmount()
  })

  // ===============================================================================================
  // §2 – AND IT DIES ON EVERY FACT THAT SHOULD KILL IT
  // ===============================================================================================
  it('⚠ MID-SEASON it is down, even though the first pick is still free', async () => {
    // ⚠⚠ THE TERM THIS CASE EXISTS FOR. `psychologistFocusRefusal` returns null while
    // `psychologistFocus === null` – «the first pick is free» – so the open list is non-empty in
    // ordinary weeks too, and a nudge keyed on that alone would be up all year. His ask is «в
    // межсезонье», and this is the case that holds it.
    const snap = toSnapshot(hired('r42-dot-mid', OFF_SEASON - 12))
    expect(snap.diary.facts.offSeasonWeek, 'a mid-season week').toBe(false)
    expect(snap.psychologistFocusOpen.length, 'the engine WOULD accept the free first pick').toBeGreaterThan(0)
    expect(psychologistFocusNudge(snap)).toBe(false)

    const onHome = homeOf(snap)
    expect(homeMarker(onHome).exists()).toBe(false)
    onHome.unmount()
    const onMarket = await marketOf(snap)
    expect(tabMarker(onMarket).find('.tab-pill-dot').exists()).toBe(false)
    onMarket.unmount()
  })

  it('⚠ IT DIES ON USE – the same off-season week, after the year is chosen', async () => {
    const world = hired('r42-dot-used', OFF_SEASON)
    expect(psychologistFocusNudge(toSnapshot(world)), 'the control: it was up before the pick').toBe(true)
    setPsychologistFocus(world, 'listen')
    const snap = toSnapshot(world)
    expect(snap.psychologistFocusOpen, 'the engine closed the row for this season').toEqual([])
    expect(psychologistFocusNudge(snap)).toBe(false)

    const onHome = homeOf(snap)
    expect(homeMarker(onHome).exists()).toBe(false)
    onHome.unmount()
    const onMarket = await marketOf(snap)
    expect(tabMarker(onMarket).find('.tab-pill-dot').exists()).toBe(false)
    onMarket.unmount()
  })

  it('⚠ ...AND ON THE WINDOW CLOSING – a year running, the next off-season not yet reached', async () => {
    const world = hired('r42-dot-closes', OFF_SEASON)
    setPsychologistFocus(world, 'listen')
    // ONE career carried across the boundary – the season the pick bought is now running. Walked
    // rather than jumped to: `toSnapshot` needs the weeks behind the week (see `OFF_SEASON`).
    tickTo(world, WEEKS_PER_YEAR + 4)
    const snap = toSnapshot(world)
    expect(isOffSeasonWeek(world.week), 'the fixture stands outside the window').toBe(false)
    expect(snap.diary.facts.offSeasonWeek).toBe(false)
    expect(psychologistFocusNudge(snap)).toBe(false)
    const onHome = homeOf(snap)
    expect(homeMarker(onHome).exists()).toBe(false)
    onHome.unmount()
  })

  it('⚠ NOBODY ON THE PAYROLL, NO MARKER – an off-season week with the seat empty', async () => {
    const world = careerAt(OFF_SEASON, 'r42-dot-unhired')
    world.bestFinishByTier.w15 = 0
    const snap = toSnapshot(world)
    expect(snap.diary.facts.offSeasonWeek, 'still an off-season week').toBe(true)
    expect(snap.psychologistHired, 'but the seat is empty').toBe(false)
    expect(snap.psychologistFocusOpen, 'so the engine accepts nothing').toEqual([])
    expect(psychologistFocusNudge(snap)).toBe(false)
    const onHome = homeOf(snap)
    expect(homeMarker(onHome).exists()).toBe(false)
    onHome.unmount()
  })

  // ===============================================================================================
  // §3 – ONE SELECTOR, TWO SURFACES
  // ===============================================================================================
  it('⚠⚠ the two entries answer to the SAME reading on every one of these states', async () => {
    const cases: [string, Snapshot][] = []
    cases.push(['off-season, unused', toSnapshot(hired('r42-sweep-a', OFF_SEASON))])
    cases.push(['mid-season', toSnapshot(hired('r42-sweep-b', OFF_SEASON - 12))])
    const used = hired('r42-sweep-c', OFF_SEASON)
    setPsychologistFocus(used, 'listen')
    cases.push(['off-season, spent', toSnapshot(used)])
    const empty = careerAt(OFF_SEASON, 'r42-sweep-d')
    empty.bestFinishByTier.w15 = 0
    cases.push(['off-season, unhired', toSnapshot(empty)])

    let up = 0
    for (const [label, snap] of cases) {
      const expected = psychologistFocusNudge(snap)
      if (expected) up++
      const onHome = homeOf(snap)
      expect(homeMarker(onHome).exists(), `Home disagrees at «${label}»`).toBe(expected)
      onHome.unmount()
      const onMarket = await marketOf(snap)
      expect(
        tabMarker(onMarket).find('.tab-pill-dot').exists(),
        `the Support-staff entry disagrees at «${label}»`,
      ).toBe(expected)
      onMarket.unmount()
    }
    expect(up, 'the marker was never up in the sweep – this pin proves nothing').toBe(1)
  })

  // ===============================================================================================
  // §4 – «МАРКЕР ЖЁЛТЫЙ»: IT IS YELLOW, IT IS THE SAME YELLOW ON BOTH, AND IT COSTS NO LINE
  // ===============================================================================================
  it('⭐ it is YELLOW on both surfaces – and not the lime the recap dot uses', async () => {
    const snap = toSnapshot(hired('r42-dot-colour', OFF_SEASON))
    const accent = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim()
    const attention = getComputedStyle(document.documentElement).getPropertyValue('--attention').trim()
    expect(attention, 'the marker token did not resolve').toBeTruthy()
    expect(parseColor(attention), 'the yellow is the lime by another name').not.toEqual(parseColor(accent))

    const onHome = homeOf(snap, true)
    const onPlate = getComputedStyle(homeMarker(onHome).element).backgroundColor
    expect(onPlate, 'the marker on Home is not the yellow').toBe(attention)
    onHome.unmount()

    const onMarket = await marketOf(snap, true)
    const dot = tabMarker(onMarket).find('.tab-pill-dot') as unknown as { element: Element }
    expect(getComputedStyle(dot.element).backgroundColor, 'the two markers are different colours').toBe(onPlate)
    onMarket.unmount()
  })

  it('⚠ NOT ONE WORD WAS ADDED – the three segment labels and the plate\'s name are untouched', async () => {
    const snap = toSnapshot(hired('r42-dot-words', OFF_SEASON))
    const onMarket = await marketOf(snap)
    expect(
      onMarket.findAll('.tb-seg .tab-pill').map((b) => b.text().trim()),
      'a segment was renamed by a dot arriving',
    ).toEqual(['Her week', 'Coaches', 'Support staff'])
    // D7's rule: the name is pinned by the button's own `aria-label`, so it cannot move under a dot.
    expect(tabMarker(onMarket).attributes('aria-label')).toBe('Support staff')
    onMarket.unmount()

    const onHome = homeOf(snap)
    expect(
      onHome.find('.coach-card').attributes('aria-label'),
      'the Home plate was renamed by a dot arriving',
    ).toBe('Coach note - open the Coach Market')
    expect(homeMarker(onHome).text().trim(), 'the marker says nothing').toBe('')
    onHome.unmount()
  })

  it('⚠ 375 / 768 / 900 / 1280 – the dot is up at every width and the segment row still fits', async () => {
    const snap = toSnapshot(hired('r42-dot-widths', OFF_SEASON))
    const widths: [string, Viewport][] = [
      ['375', PHONE],
      ['768', TABLET],
      ['900', { width: 900, height: 1024 }],
      ['1280', DESKTOP],
    ]
    for (const [label, vp] of widths) {
      setViewport(vp)
      const onHome = homeOf(snap, true)
      expect(homeMarker(onHome).exists(), `Home's marker is missing at ${label}`).toBe(true)
      onHome.unmount()
      const onMarket = await marketOf(snap, true)
      const pill = tabMarker(onMarket)
      expect(pill.find('.tab-pill-dot').exists(), `the tab's marker is missing at ${label}`).toBe(true)
      // The segment dot is INLINE (see `.tab-pill-dot` in src/style.css) – it widens the pill rather
      // than hanging off an ancestor, so the width it costs is the thing to measure.
      const dotEl = (pill.find('.tab-pill-dot') as unknown as { element: Element }).element
      const style = getComputedStyle(dotEl)
      expect(style.width, `the dot's box changed at ${label}`).toBe('7px')
      expect(style.marginLeft, `the dot's gap changed at ${label}`).toBe('6px')
      onMarket.unmount()
    }
    setViewport(DESKTOP)
  })
})
