// ⭐⭐ ROUND 46 #11c – THE FULL-SCREEN WEDDING / BIRTH MOMENT, MOUNTED (bundle B1).
//
// The owner, round 46 #11 (05.10, verbatim): «Я дождался свадьбы, но самого экрана этого события не было! …
// Можно делать оверлей на весь экран, например.»
//
// ⚠ WHY MOUNTED AND NOT A SOURCE PIN. Every claim here is about what is ON THE SCREEN: that the day shows, that
// nothing shows otherwise, that the one control closes it – and the one that stops a career – that the control
// is INSIDE A PHONE. CLAUDE.md's popup law (round-20 #3): a blocking overlay that cannot be dismissed on 375x667
// ends the game for the person holding it, and «it reads well» is not that measurement.
//
// ⚠ THE SNAPSHOT IS REAL: `toSnapshot` on a live world the engine's own writers have posed (the announcement
// raised, answered, and `landWedding` run), so `lifeMoment` has the shape the worker really sends. Only the two
// long-line fixtures are fabricated, and they are labelled.
//
// ⚠ `setViewport(PHONE)` RUNS BEFORE THE MOUNT – happy-dom caches a media query on the first computed-style read,
// so a late call would measure the desktop column and the arm could not redden.
//
// ⚠ MUTATION ARMS, each really run and watched, then put back:
//   * the card's cap removed on the long line (`max-height: none; overflow-y: visible`) -> RED on the SAME
//     `assertDismissReachable` ("taller than the screen and nothing scrolls") – the round-20 shape reproduced.
//   * the cap removed on a line that FITS -> RED on the content-independent half ("declares no height bound").
//   * a second `<p>` appended inside the card -> RED on «owns no sentence».
//   * `v-if="moment"` dropped from the template -> RED on «nothing shows on a plain week».
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import '../../src/style.css'
import { assertDismissReachable, measureDialog, setViewport, DESKTOP, NARROW_PHONE, PHONE } from './fits'
import LifeMomentOverlay from '../../src/components/LifeMomentOverlay.vue'
import { useGameStore } from '../../src/stores/game'
import { lifeMomentMayShow, resetLifeMomentForTests } from '../../src/composables/lifeMoment'
import { createWorld, raiseLifeBeat, toSnapshot } from '../../src/engine/world'
import { kidAgeNow, lifeLogOf } from '../../src/engine/world/lifeBeat'
import { landWedding } from '../../src/engine/world/lifeBeat/wedding'
import { LIFE_MOMENT_CONFIRM } from '../../src/engine/world/lifeMomentCopy'
import { ECONOMY } from '../../src/engine/economy'
import { DEFAULT_PROFILE, type LifeBeatPrompt, type LifeMoment, type Snapshot } from '../../src/shared/protocol'
import type { WorldState } from '../../src/engine/world'

function weddingWorld(seed = 'life-moment-ui'): WorldState {
  const world = createWorld(seed, DEFAULT_PROFILE)
  // ⚠ POSED AT AGE 24, the age the game can reach (`ECONOMY.wedding.ageGate` is 23): the bride is painted for the
  // `adult` band ONLY, so a wedding posed at twenty-one would draw the teen's `norm` portrait and test a state
  // the game cannot produce.
  while (kidAgeNow(world) < 24) world.week += 13
  const base = world.week
  const id = `p:${base - 100}`
  world.loveEpisodes = [
    {
      id, sinceWeek: base - 100, endedWeek: null, knownWeek: base - 100, wants: 'open', partnerId: id,
      publicWeek: null, publicWrong: false, airedMetWeek: null, airedEndedWeek: null, latchedWeek: null, partnerName: 'Anton',
    },
  ]
  raiseLifeBeat(world, 'engaged', id)
  lifeLogOf(world).at(-1)!.answer = 'bless'
  world.week = base + ECONOMY.wedding.weeksAfterEngagement
  landWedding(world)
  return world
}

function mountOverlay(snapshot: Snapshot | null) {
  useGameStore().snapshot = snapshot
  return mount(LifeMomentOverlay, { global: { stubs: { teleport: true } } })
}

function mountAttached(snapshot: Snapshot, vp = PHONE) {
  setViewport(vp)
  useGameStore().snapshot = snapshot
  const w = mount(LifeMomentOverlay, { attachTo: document.body })
  const card = document.querySelector('.life-moment')!
  expect(card, 'the overlay is up – nothing below is vacuous').toBeTruthy()
  const go = card.querySelector('.life-moment-go')!
  expect(go, 'and its one control exists').toBeTruthy()
  return { w, card, go }
}

const LONG = 'The whole family came, and nobody mentioned any of the things that had been said about it. '
/** ⚠ FABRICATED: a line far longer than anything the engine writes, so the cap is what is under test. */
function tooTall(): Snapshot {
  const snap = toSnapshot(weddingWorld())
  // ⭐ L3-5 (10.10): the override drops the ref beside it (`lineC: undefined`) – the overlay draws `eventText({ text, c })`, and the real moment's ref (the birth / wedding row now carries `c`) would show the line it was built from
  return { ...snap, lifeMoment: { ...snap.lifeMoment!, line: LONG.repeat(30).trim(), lineC: undefined } }
}

beforeEach(() => {
  setActivePinia(createPinia())
  resetLifeMomentForTests()
})
afterEach(() => {
  document.body.innerHTML = ''
  setViewport(DESKTOP)
})

describe('renders for a resolved wedding and not otherwise', () => {
  it('the wedding day: the bride painting, the feed\'s own line, one control – and no sentence of its own', () => {
    const snap = toSnapshot(weddingWorld())
    expect(snap.lifeMoment?.kind, 'the fixture really is a wedding day').toBe('wedding')
    const w = mountOverlay(snap)
    expect(w.find('.life-moment').exists()).toBe(true)
    expect(w.find('img.life-moment-art').attributes('src'), 'the bride painting').toMatch(/bride/)
    expect(w.find('.life-moment-line').text()).toBe(snap.lifeMoment!.line)
    expect(w.findAll('button'), 'exactly one control').toHaveLength(1)
    // ⚠ NO SPACE between the two: Vue condenses the gap between the `<p>` and the `<button>`, so the card's text is
    // the line immediately followed by the label – and anything ELSE in the card would show up as extra characters.
    expect(w.text(), 'the card prints the engine\'s line and label and NOTHING else').toBe(
      `${snap.lifeMoment!.line}${LIFE_MOMENT_CONFIRM}`,
    )
    expect(w.find('[role="dialog"]').attributes('aria-modal')).toBe('true')
  })

  it('nothing shows on a plain week, with no snapshot, or on the week AFTER the wedding', () => {
    expect(mountOverlay(toSnapshot(createWorld('life-moment-plain', DEFAULT_PROFILE))).find('.life-moment').exists()).toBe(false)
    expect(mountOverlay(null).find('.life-moment').exists()).toBe(false)
    const after = weddingWorld()
    after.week += 1
    const w = mountOverlay(toSnapshot(after))
    expect(toSnapshot(after).lifeMoment, 'the engine already stopped handing it over').toBeNull()
    expect(w.find('.life-moment').exists()).toBe(false)
  })

  it('Continue closes it for that week – and it stays closed when the App re-mounts it', async () => {
    const snap = toSnapshot(weddingWorld())
    const w = mountOverlay(snap)
    await w.find('.life-moment-go').trigger('click')
    expect(w.find('.life-moment').exists(), 'the control dismisses it').toBe(false)
    expect(mount(LifeMomentOverlay).find('.life-moment').exists(), 'a re-mount in the same week does not resurrect it').toBe(false)
    // …and a different day is a different moment: the birth, a week later in the story.
    const birth: LifeMoment = { kind: 'birth', week: snap.week + 40, face: 'birth', line: 'FIXTURE birth line', confirm: LIFE_MOMENT_CONFIRM }
    useGameStore().snapshot = { ...snap, week: birth.week, lifeMoment: birth }
    expect(mount(LifeMomentOverlay).find('.life-moment-line').text()).toBe('FIXTURE birth line')
  })
})

describe('the gate: it waits behind a question the engine is asking, and behind a sequence on screen', () => {
  const BEAT: LifeBeatPrompt = {
    week: 408, kind: 'fork-opinion', heading: 'FIXTURE heading', said: 'FIXTURE line',
    options: [{ id: 'a', label: 'FIXTURE a' }], followUps: [], confirm: 'FIXTURE proceed',
  }
  it('is allowed on a quiet wedding week, and held by a blocking card, a live match, or no moment', () => {
    const snap = toSnapshot(weddingWorld())
    expect(lifeMomentMayShow(snap)).toBe(true)
    expect(lifeMomentMayShow({ ...snap, lifeBeatPrompt: BEAT }), 'a life beat is answered first').toBe(false)
    expect(lifeMomentMayShow(snap, true), 'not over a live match').toBe(false)
    expect(lifeMomentMayShow({ ...snap, lifeMoment: null })).toBe(false)
    expect(lifeMomentMayShow(null)).toBe(false)
  })
})

describe('⚠ THE PHONE: the one control is inside 375x667, and the assertion can fail', () => {
  it('Continue is reachable on the phone, the card bounded by the room the scrim leaves', () => {
    const { w, card, go } = mountAttached(toSnapshot(weddingWorld()))
    const fit = assertDismissReachable(card, go, PHONE, 'LifeMomentOverlay (the wedding day)')
    expect(fit.available.height, 'the scrim leaves 667 minus its own 16 either side').toBe(635)
    expect(fit.scrollable, 'and what is past the fold can be reached').toBe(true)
    w.unmount()
  })

  it('...and on the narrowest screen the app supports', () => {
    const { w, card, go } = mountAttached(toSnapshot(weddingWorld()), NARROW_PHONE)
    assertDismissReachable(card, go, NARROW_PHONE, 'LifeMomentOverlay (320x568)')
    w.unmount()
  })

  it('a line that runs long still lands the control (and the fixture really is taller than the phone)', () => {
    const { w, card, go } = mountAttached(tooTall())
    const fit = assertDismissReachable(card, go, PHONE, 'LifeMomentOverlay (a long line)')
    expect(fit.contentFloor, 'the long line really is taller than the phone, or this measures nothing').toBeGreaterThan(fit.available.height)
    w.unmount()
  })

  it('⚠⚠ MUTATION PROOF – put round-20 #3 back on the long line and the SAME assertion goes red', () => {
    const { w, card, go } = mountAttached(tooTall())
    const before = measureDialog(card, go, PHONE)
    expect(before.contentFloor, 'the mutation is not vacuous').toBeGreaterThan(before.available.height)
    ;(card as HTMLElement).style.maxHeight = 'none'
    ;(card as HTMLElement).style.overflowY = 'visible'
    expect(() => assertDismissReachable(card, go, PHONE, 'LifeMomentOverlay (cap removed)')).toThrow(
      /taller than the screen|outside the viewport/,
    )
    ;(card as HTMLElement).style.maxHeight = ''
    ;(card as HTMLElement).style.overflowY = ''
    assertDismissReachable(card, go, PHONE, 'LifeMomentOverlay (cap restored)')
    w.unmount()
  })

  it('⚠⚠ MUTATION PROOF, THE OTHER HALF – the cap is asserted even on a line that fits today', () => {
    const { w, card, go } = mountAttached(toSnapshot(weddingWorld()))
    expect(measureDialog(card, go, PHONE).contentFloor, 'this line fits unaided, which is why this arm is separate').toBeLessThan(635)
    ;(card as HTMLElement).style.maxHeight = 'none'
    expect(() => assertDismissReachable(card, go, PHONE, 'LifeMomentOverlay (unbounded)')).toThrow(/declares no height bound|taller than the screen/)
    ;(card as HTMLElement).style.maxHeight = ''
    w.unmount()
  })
})
