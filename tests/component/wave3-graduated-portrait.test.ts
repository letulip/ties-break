// =================================================================================================
// WAVE 3, T14 – THE GRADUATED PORTRAIT, ON THE TWO SURFACES THAT SHOW IT
// =================================================================================================
//
// `docs/plans/life-wave-3-builder-2026-09.md` §2 T14. The owner, 11.09: «graduated – вот это
// хорошо, что ты нашёл, мы забыли эту картинку, надо встроить на окончание колледжа где-то, может
// быть в попапе и даже на главной показывать неделю по окончании (если случилось окончание)».
//
// The decision itself (who wears it, for how long) and the facts about the art are next door in
// tests/wave3-graduated-portrait.test.ts. THIS file is the half that only a mount can make: the
// picture is in the DOM on the graduate's popup and on her home screen, and it is NOWHERE on the
// screens of a girl who left early.
//
// ⚠⚠ AND THE CAREERS ARE WALKED, NOT HAND-BUILT. Both fixtures are `round24-college-shell`'s own:
// a career played to the fork, answered «college», and then either spent to the fourth year or
// ended at the first boundary by `endCollegeEarly`. The whole claim of this step is that the two
// are told apart, so a snapshot with `years: [...]` typed by hand would be the test agreeing with
// itself.
//
// ⚠ NO STRING MOVES. The dialog's copy is byte-identical (CLAUDE.md invariant 4) – the assertions
// below read the SHIPPED sentences on both arms, and the image carries `alt=""` because it is
// decorative and says nothing.
//
// =================================================================================================
// ⚠⚠ THE ARM LEDGER – every net below was watched fail, and what it said is written here
// =================================================================================================
//
//   ARM 1  the popup's guard deleted – `v-if="graduated"` -> `v-if="true"` on the painting
//          1 RED · §A «no gown for a girl who left after one year: expected true to be false»
//
//   ARM 2  the honesty guard deleted in the SHARED predicate – `finishedTheCourse` returns
//          `totalYears > 0` for everybody who ever enrolled
//          3 RED · §A «expected 'College · W35 …She has graduated.Y…' to contain 'She has left the
//          scholarship.'» – the mutation moves the heading too, because the popup's title and the
//          picture ask the same question – and §B's two portrait arms: «expected
//          '/images/fem-euro-brunnet/fem-euro-bru…' to match /fem-euro-brunnet-(jun|young|teen|
//          adult|lateCareer)-(angry|happy|injury|norm|rehab|sad|serious|tired)\.webp$/», once on
//          Home and once on the Kid screen. (2 RED next door, on the predicate's own table.)
//
//   ARM 3  the window ignored – `wearsGraduationPortrait` returns true from `doneWeek` onwards
//          2 RED · §B «⭐ one week, and then her own face again: the hero is still painted – the
//          negative below is not an empty frame: expected '/images/…' to match /…/» and «⚠ …and it
//          never comes back – `doneWeek` does not move again»
//
//   ARM 4  the hero's stem rebuilt from stage+emotion at the call site (HomeScreen's pre-T14 line,
//          `facePoint(`${portraitAssetStem(stage.value)}-${emotion.value}`)`)
//          1 RED · §B «⚠ and the frame follows the picture that is actually on screen: expected
//          'object-position: 57.03125% 33.203125%;' to contain 'object-position: 48.828125% 25%'»
//          – i.e. the hero framed on the face of a painting that is not on the screen
//
//   ARM 5  the round-20 height bound taken off the card (`max-height: none`, `overflow-y: visible`)
//          – the mutation §C runs inline; its message, read out of the throw:
//          «CollegeDoneDialog (graduate) at 375x667: card 343x524 (content wants at least 524, cap
//          NONE, NOT scrollable), 635px of room – the card declares no height bound that fits, so
//          its height is whatever its content happens to be: expected Infinity to be less than or
//          equal to 635»
//
//   ARM 6  the painting's declared height removed (`height: 132px` -> `auto`)
//          1 RED · §C «the strip is a measurable box, not an invisible one: expected 'auto' to be
//          '132px'» – i.e. the strip is back to being a box the phone measurement cannot see
//
//   ARM 7  the portrait override deleted – `portraitUrl` always builds the band painting
//          3 RED · §B's three positive arms (Home on the graduation week, the leaver case's own
//          control arm, and the Kid screen), each «expected '/images/…' to be '/images/…'»
import { describe, it, expect, beforeAll, beforeEach, vi } from 'vitest'
// ⚠ v74 (wave 3, T8): the shared bond-NEUTRAL drain – a walked opener must pass a tier-1 row.
import { drainLifeBeats } from '../helpers/career'

// A runner-sized ceiling, and the arithmetic is round24-college-shell's: the two fixtures below
// walk real careers (~60 weeks to the fork, ~54 to the departure, then four years one press at a
// time). Measured alone they cost a couple of seconds; under the component project's parallel load
// the same walk has crossed vitest's 5 s default with zero assertion failures.
vi.setConfig({ testTimeout: 30_000 })
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'

import '../../src/style.css'
import CollegeDoneDialog from '../../src/components/CollegeDoneDialog.vue'
import HomeScreen from '../../src/components/screens/HomeScreen.vue'
import KidScreen from '../../src/components/screens/KidScreen.vue'
import { useGameStore } from '../../src/stores/game'
import {
  answerFork,
  chooseGift,
  closeTournament,
  createWorld,
  endCollegeEarly,
  measureCollegeOffer,
  pendingBirthday,
  resumeFromCollege,
  revealTournamentRound,
  skipTournament,
  tickWeek,
  toSnapshot,
  type WorldState,
} from '../../src/engine/world'
import { resumeMain, type Rng } from '../../src/engine/rng'
import { ENDINGS } from '../../src/engine/ending'
import { GRADUATED_ART_STEM, graduatedUrl } from '../../src/art/preload'
import { facePoint } from '../../src/art/faceRects'
import { DEFAULT_PROFILE, type Snapshot } from '../../src/shared/protocol'
import { assertDismissReachable, PHONE, setViewport } from './fits'

/** The eight band paintings a portrait surface can show on an ordinary week – the set the hero must
 *  be wearing whenever the graduation painting is not on it. Spelled as a pattern rather than a
 *  single face because the walked career's emotion on the week is the engine's business, not this
 *  file's; what matters is that it is one of HER faces and not the gown. */
const BAND_PAINTING = /fem-euro-brunnet-(jun|young|teen|adult|lateCareer)-(angry|happy|injury|norm|rehab|sad|serious|tired)\.webp$/

function finishAnyReveal(world: WorldState): void {
  for (let i = 0; i < 40 && world.pendingTournament && !world.pendingTournament.finished; i++) {
    revealTournamentRound(world)
  }
  if (world.pendingTournament) closeTournament(world)
}

/** A career really played to the fork and really answered «college» – round24-college-shell's
 *  `atCollege`, verbatim in shape including its one thumb on the scale (four years of base costs
 *  would otherwise bankrupt the family mid-freeze, which measures the budget rather than this). */
function atCollege(seed: string): { world: WorldState; rng: Rng } {
  const world = createWorld(seed, { ...DEFAULT_PROFILE })
  const rng = resumeMain(world.rngMain)
  for (let i = 0; i < 60; i++) {
    tickWeek(world, rng)
    finishAnyReveal(world)
    drainLifeBeats(world)
  }
  world.fundsCents = 500_000_00
  world.fork = { askedWeek: world.week, answer: null, offer: measureCollegeOffer(world) }
  // ⚠⚠ ADDED FOR v74 (wave 3, T8 – 11.09), AND THE FIXTURE MOVED, NOT THE ASSERTION. Tier-1 small
  // talk raises an answerable `lifeLog` row from week 0, and `answerFork` refuses while ANY row is
  // unanswered, so this opener threw before it reached a case. Bond-neutral drain.
  drainLifeBeats(world)
  answerFork(world, 'college')
  for (let i = 0; i < 54 && world.ending === null; i++) {
    tickWeek(world, rng)
    finishAnyReveal(world)
    drainLifeBeats(world)
  }
  expect(world.ending?.type, 'the departure really latched the college ending').toBe('college')
  return { world, rng }
}

/** THE GRADUATE: four years, spent one at a time exactly as the bottom control spends them. The
 *  press loop is round24's – a year pauses on her birthday, on the championship and on the tie – and
 *  so is the cleared knock, which is a walked-career artefact rather than anything about college. */
function graduate(seed: string): WorldState {
  const { world, rng } = atCollege(seed)
  for (let press = 0; press < 5 * ENDINGS.collegeYears && world.ending?.type === 'college'; press++) {
    resumeFromCollege(world, rng)
    skipTournament(world)
    closeTournament(world)
    if (pendingBirthday(world) !== null) chooseGift(world, 'day')
  }
  expect(world.ending, 'she came out the other side – the latch is off for good').toBeNull()
  expect(world.college?.years).toHaveLength(ENDINGS.collegeYears)
  expect(world.college?.doneWeek, 'and she came out THIS week').toBe(world.week)
  world.knock = null
  return world
}

/** THE LEAVER: «Back on tour now» at the first boundary. One banked year, `doneWeek` set by the same
 *  two lines the graduate's exit runs – which is precisely why a picture hung on «she left college»
 *  rather than on the COUNT would appear here too. */
function leaveEarly(seed: string): WorldState {
  const { world, rng } = atCollege(seed)
  for (let press = 0; press < 5 && world.college!.years.length === 0; press++) {
    resumeFromCollege(world, rng)
    skipTournament(world)
    closeTournament(world)
    if (pendingBirthday(world) !== null) chooseGift(world, 'day')
  }
  endCollegeEarly(world)
  expect(world.college?.years.length, 'she really did leave short of the degree').toBeLessThan(ENDINGS.collegeYears)
  expect(world.college?.doneWeek, 'and the door closed THIS week – the same field the graduate sets').toBe(world.week)
  world.knock = null
  return world
}

// The two walked careers, built once: each is a few seconds of real simulation and nothing any test
// does mutates them (the snapshot is rebuilt per case, and the one week-shifted case copies it).
let graduated: WorldState
let left: WorldState
beforeAll(() => {
  graduated = graduate('t14-grad')
  left = leaveEarly('t14-left')
})

beforeEach(() => {
  setActivePinia(createPinia())
  document.body.innerHTML = ''
})

/** Put a snapshot in the store the way every mounted case here needs it – assigned, never `$patch`ed
 *  (which deep-merges and would carry the previous case's college across). */
function withSnapshot(snapshot: Snapshot) {
  const game = useGameStore()
  game.$patch({ ready: true, phase: 'ready' })
  game.snapshot = snapshot
  return game
}

const openDialog = (world: WorldState) => {
  withSnapshot(toSnapshot(world))
  // ⚠ ATTACHED TO THE DOCUMENT: §C reads the REAL cascade through `getComputedStyle`, and detached
  // the overlay's `position` comes back empty – a vacuous measurement rather than a green one.
  return mount(CollegeDoneDialog, { attachTo: document.body, global: { stubs: { teleport: true } } })
}

const openHome = (snapshot: Snapshot) => {
  withSnapshot(snapshot)
  return mount(HomeScreen, { props: { recapFresh: false }, global: { stubs: { teleport: true } } })
}

/** The snapshot of a walked career, N weeks later – for the ONE question this file asks about time.
 *  Only the clock moves: the college rows, `doneWeek` and everything else are the career's own. */
const weeksLater = (world: WorldState, n: number): Snapshot => ({ ...toSnapshot(world), week: world.week + n })

// =================================================================================================
// A. THE POPUP (round 24 #4) – «может быть в попапе»
// =================================================================================================
describe('T14 §A – the graduation popup carries the painting, and only the graduate\'s does', () => {
  it('⭐⭐ the graduate\'s card opens on the painting the owner found', () => {
    const w = openDialog(graduated)
    const art = w.find('.college-done-art')
    expect(art.exists(), 'four years and no picture of them').toBe(true)
    expect(art.attributes('src')).toBe(graduatedUrl())
    expect(art.attributes('src')).toContain('fem-euro-brunnet-adult-graduated.webp')
    // Decorative: the card says everything it has to say in the copy it already shipped with.
    expect(art.attributes('alt'), 'a picture that also spoke would be a new string').toBe('')
    // ...and it is framed off the ONE face table, like every other painting shown landscape-cropped.
    const p = facePoint(GRADUATED_ART_STEM)
    expect(art.attributes('style')).toContain(`object-position: ${p.x}% ${p.y}%`)
    w.unmount()
  })

  it('⚠⚠ the leaver gets NO PICTURE, and the graduate above proves this surface can show one', () => {
    // ⚠ THE POSITIVE HALF IS INSIDE THIS CASE ON PURPOSE (the brief's own rule): «the leaver has no
    // graduation portrait» is worth nothing unless the same run shows the card rendering one.
    const grad = openDialog(graduated)
    expect(grad.find('.college-done-art').exists(), 'the control arm – this selector CAN match').toBe(true)
    grad.unmount()

    const w = openDialog(left)
    expect(w.find('.dialog-card').exists(), 'her card really is on screen – the arm is not vacuous').toBe(true)
    expect(w.findAll('.college-done-years li').length, 'and it really is the short course').toBeLessThan(ENDINGS.collegeYears)
    expect(w.text()).toContain('She has left the scholarship.')
    expect(w.find('.college-done-art').exists(), 'no gown for a girl who left after one year').toBe(false)
    expect(w.html(), 'and not by any other route either').not.toContain('adult-graduated')
    w.unmount()
  })

  it('⚠ not one word of the card moved – invariant 4, and this step is a picture', () => {
    // The four sentences that shipped in round 24, read off the rendered card. A picture is not a
    // licence to re-cut copy, and a test that only looked at the image would not notice if it were.
    const w = openDialog(graduated)
    const text = w.text()
    expect(text).toContain('She has graduated.')
    expect(text).toContain('Qualifying is the way forward again. Her week is on the home screen.')
    expect(text).toContain('Years')
    expect(text).toContain('Banked')
    expect(text).toContain('Continue')
    w.unmount()
  })
})

// =================================================================================================
// B. THE HOME PORTRAIT – «и даже на главной показывать неделю по окончании»
// =================================================================================================
describe('T14 §B – the home hero wears it for one week, and never for a leaver', () => {
  it('⭐⭐ the week she came out, the hero IS the graduation painting', () => {
    const w = openHome(toSnapshot(graduated))
    const hero = w.find('.diary-hero-img')
    expect(hero.exists(), 'the hero really is on the screen').toBe(true)
    expect(hero.attributes('src')).toBe(graduatedUrl())
    w.unmount()
  })

  it('⚠ and the frame follows the picture that is actually on screen', () => {
    // The hero is `object-fit: cover` steered by the face table. Rebuilding the stem from
    // stage+emotion at the call site – which is what this line used to do – would steer the
    // graduation week's crop by the face position of a painting that is not being shown.
    const w = openHome(toSnapshot(graduated))
    const p = facePoint(GRADUATED_ART_STEM)
    expect(w.find('.diary-hero-img').attributes('style')).toContain(`object-position: ${p.x}% ${p.y}%`)
    w.unmount()
  })

  it('⭐ one week, and then her own face again', () => {
    const w = openHome(weeksLater(graduated, 1))
    const src = w.find('.diary-hero-img').attributes('src') ?? ''
    expect(src, 'the hero is still painted – the negative below is not an empty frame').toMatch(BAND_PAINTING)
    expect(src).not.toContain('adult-graduated')
    w.unmount()
  })

  it('⚠ …and it never comes back – `doneWeek` does not move again', () => {
    const w = openHome(weeksLater(graduated, 30))
    expect(w.find('.diary-hero-img').attributes('src') ?? '').toMatch(BAND_PAINTING)
    w.unmount()
  })

  it('⚠⚠ the leaver\'s home screen wears her own face and not a gown', () => {
    // The control arm first, in the same case, for the same reason §A states it: a negative that
    // cannot be seen to be reachable is not an assertion.
    const control = openHome(toSnapshot(graduated))
    expect(control.find('.diary-hero-img').attributes('src')).toBe(graduatedUrl())
    control.unmount()

    const w = openHome(toSnapshot(left))
    const src = w.find('.diary-hero-img').attributes('src') ?? ''
    expect(src).toMatch(BAND_PAINTING)
    expect(src).not.toContain('adult-graduated')
    w.unmount()
  })

  it('⭐ the Kid screen\'s big portrait is the same decision, on the same week', () => {
    // Both surfaces read `useKidEmotion().portraitUrl`, which is the whole reason the override lives
    // in the composable; this is the mount that proves the second one moved with it.
    withSnapshot(toSnapshot(graduated))
    const w = mount(KidScreen, { global: { stubs: { teleport: true } } })
    expect(w.find('.kid-hero-img').attributes('src')).toBe(graduatedUrl())
    w.unmount()

    setActivePinia(createPinia())
    withSnapshot(toSnapshot(left))
    const leaver = mount(KidScreen, { global: { stubs: { teleport: true } } })
    expect(leaver.find('.kid-hero-img').attributes('src') ?? '').toMatch(BAND_PAINTING)
    leaver.unmount()
  })
})

// =================================================================================================
// C. THE ROUND-20 LAW – the card grew by a picture, so it is measured against a phone again
// =================================================================================================
describe('T14 §C – the taller card still hands the player its way out', () => {
  it('⚠⚠ Continue is reachable on a 375x667 phone, with the measurement able to fail', () => {
    setViewport(PHONE)
    const w = openDialog(graduated)
    const card = w.find('.dialog-card').element
    const dismiss = w.find('.college-done-actions').element
    const fit = assertDismissReachable(card, dismiss, PHONE, 'CollegeDoneDialog (graduate)')
    // ⚠ THE PICTURE IS IN THE MEASUREMENT, and this is the line that says so: an `<img>` with no
    // declared height and no ratio measures as ZERO in this model, i.e. a 132px strip the phone
    // check cannot see. The card's own comment carries the same number for the same reason.
    const art = w.find('.college-done-art').element
    expect(getComputedStyle(art).height, 'the strip is a measurable box, not an invisible one').toBe('132px')
    expect(fit.contentFloor, 'the floor really did grow by the painting').toBeGreaterThan(400)
    // ⚠ THE MUTATION: take the shared height bound away – the exact shape TourBriefingDialog shipped
    // in – and the same assertion has to go red.
    ;(card as HTMLElement).style.maxHeight = 'none'
    ;(card as HTMLElement).style.overflowY = 'visible'
    expect(() => assertDismissReachable(card, dismiss, PHONE, 'CollegeDoneDialog (graduate)')).toThrow()
    w.unmount()
  })
})
