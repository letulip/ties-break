// HIS TWO UI ITEMS OF 17.09, BOTH ON THE PSYCHOLOGIST'S YEAR'S-WORK BLOCK.
//
// §F  «у психолога в карточках варианта работы на сезон маловато внутренних отступов (тексту очень
//     тесно)» – `.staff-focus-option` was `padding: 6px 4px`, FOUR pixels at the sides under a 60-90
//     character sentence wrapping inside half a phone's width. It is `8px 10px` now.
//
// §G  «всё-таки надо подсвечивать весь блок выбора работы на год в межсезонье, когда мы приводим
//     пользователя по маркеру с home» – the shared `psychologistFocusNudge` had two readers (Home's
//     plate dot, the Coaches tab pill) and the block itself was never built. It lights now.
//
// ⚠⚠ WHY §F NEEDS TWO ASSERTIONS AND NOT ONE, which is the round-20 #1 lesson in its narrow form.
// Padding on a wrapping control trades WIDTH for the very legibility it buys: `.staff-focus-option`
// declares `flex: 1 1 calc(50% - 3px)` and NO `min-width: 0`, so its floor is its own min-content
// width – the longest unbreakable word plus the padding and the borders. Grow the sides far enough
// and that floor passes the basis, the two options stop fitting beside each other, and a 2x2 picker
// the owner reads at a glance becomes a 1x5 column. So the padding is measured from both sides: the
// sentence must have room INSIDE the box, and two boxes must still stand side by side in the row.
//
// ⚠ HAPPY-DOM DOES NO LAYOUT, so every number below is computed from the REAL cascade through
// `./fits` – the instrument `psychologist-card.test.ts` §8 and the round-20 dialog guards already
// use, and the same under-counting floor its header commits to.
//
// ⚠⚠ MUTATION-VERIFIED. Each arm was applied to `src/`, this file re-run, and the tree restored by a
// reverse edit (never `git checkout --`, the shared-checkout rule):
//
//   #  mutation                                                            RED cases  scope
//   1  `.staff-focus-option` padding back to `6px 4px`                          1     §F the ask
//   2  `.staff-focus-option` padding to `8px 90px` (absurd, both ways)          3     §F both halves
//   3  `.staff-focus.is-nudged`'s own rule deleted                              1     §G the glow
//   4  the `:class="{ 'is-nudged': m.focus.nudge }"` binding dropped            3     §G the wiring
//   5  `nudge: psychologistNudge.value` -> `nudge: true`                        2     §G the quiet arm
//   6  the `prefers-reduced-motion` block on `.staff-focus.is-nudged` deleted   1     §G the killswitch
//
// Six arms, six non-zero RED counts, exit 1 on every one. ⚠ TWO OF THE COUNTS WERE PREDICTED WRONG
// AND THE MEASURED NUMBERS ARE WHAT IS WRITTEN DOWN, which is the only way this table is worth
// keeping. ARM 3 was predicted at 2 and reddened 1: killing the breathing rule leaves the
// reduced-motion block standing, and that block declares `animation: none` and its own glow – so the
// killswitch case passes on a tree where the glow only ever exists for a player who asked for less
// motion. That is precisely the hole ARM 6 covers, and the pair is what makes the two cases
// independent rather than two readings of one rule. ARM 5 was predicted at 1 and reddened 2: lighting
// the block unconditionally also breaks the no-layout case, whose DARK arm is the mid-season mount.
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { nextTick } from 'vue'
import '../../src/style.css'
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
  toSnapshot,
} from '../../src/engine/world'
import type { WorldState } from '../../src/engine/world'
// ⚠ THE CALENDAR'S OWN CONSTANTS, from the module that owns them – `engine/world` imports these but
// does not re-export them, exactly as tests/component/round42-psych-marker.test.ts reaches them.
import { OFF_SEASON_WEEKS, WEEKS_PER_YEAR } from '../../src/engine/season/calendar'
import { rngFromSeed } from '../../src/engine/rng'
import { DEFAULT_PROFILE, psychologistFocusNudge, type Snapshot } from '../../src/shared/protocol'
import { availableWidth, boxOf, lengthPx, setViewport, DESKTOP, PHONE } from './fits'

const SEAT = '[data-staff="psychologist"]'

/** The first week of the FIRST off-season, read off the calendar rather than typed – round 42 #28's
 *  own fixture constant, and for its stated reason: a MOUNTED case needs a real `toSnapshot`, and a
 *  world whose week was jumped to without the ticks behind it never returns from one. */
const OFF_SEASON = WEEKS_PER_YEAR - OFF_SEASON_WEEKS

/** ⚠ THE AVERAGE CHARACTER ADVANCE `./fits` FITTED AGAINST A REAL HEADLESS CHROMIUM, re-declared
 *  here rather than exported from it: `fits.ts` keeps it private and its header carries the fit
 *  table. If that file re-fits the constant this one has to follow, which the header says there. */
const ADVANCE = 0.47

interface DeviceWindow {
  happyDOM: { settings: { device: { prefersReducedMotion: string } } }
}

/** ⚠ SET IT BEFORE ANYTHING IS MOUNTED OR READ. A media query is evaluated on an element's first
 *  computed-style read and then cached (round 36's own measurement), so a preference set afterwards
 *  answers for the previous element. */
function setReducedMotion(on: boolean): void {
  const w = window as unknown as DeviceWindow
  if (!w.happyDOM?.settings?.device) {
    throw new Error('happy-dom exposes no device settings – this measurement cannot be trusted')
  }
  w.happyDOM.settings.device.prefersReducedMotion = on ? 'reduce' : 'no-preference'
}

function tickTo(world: WorldState, week: number): WorldState {
  const rng = rngFromSeed(world.seed)
  while (world.week < week) {
    world.fundsCents = Math.max(world.fundsCents, 500_000_00)
    if (pendingKnock(world)) decideKnock(world, 'rest')
    const age = pendingBirthday(world)
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

/** A professional career with the seat filled, at whatever week the case needs. The pro door is her
 *  first counting W-series result on the never-pruned mark – psychologist-card.test.ts's own gate. */
function hiredAt(seed: string, week: number): Snapshot {
  const world = week === 0
    ? createWorld(seed, DEFAULT_PROFILE)
    : tickTo(createWorld(seed, { ...DEFAULT_PROFILE, birthMonth: 6 }), week)
  world.bestFinishByTier.w15 = 0
  hirePsychologist(world, true)
  return toSnapshot(world)
}

async function mountTab(snapshot: Snapshot, attach = false) {
  useGameStore().snapshot = snapshot
  const wrapper = mount(CoachMarketScreen, {
    global: { stubs: { teleport: true } },
    ...(attach ? { attachTo: document.body } : {}),
  })
  const pill = wrapper.findAll('.tb-seg .tab-pill').find((b) => b.text() === 'Support staff')
  expect(pill, 'the Support staff tab is on the screen at all').toBeTruthy()
  await pill!.trigger('click')
  await nextTick()
  return wrapper
}

/** The widest word the control can never break, in px, at the font size each span really computes.
 *  This is the floor `min-width: auto` puts under a flex item that holds wrapping prose. */
function longestWordPx(option: Element): number {
  let widest = 0
  for (const span of [...option.children]) {
    const cs = getComputedStyle(span)
    const size = parseFloat(cs.fontSize) || 0
    for (const word of (span.textContent ?? '').trim().split(/\s+/).filter(Boolean)) {
      widest = Math.max(widest, word.length * size * ADVANCE)
    }
  }
  return widest
}

function sideChrome(option: Element): number {
  const cs = getComputedStyle(option)
  const px = (v: string): number => {
    const n = lengthPx(v, 0)
    return Number.isFinite(n) ? n : 0
  }
  return px(cs.paddingLeft) + px(cs.paddingRight) + px(cs.borderLeftWidth) + px(cs.borderRightWidth)
}

describe('⭐⭐ 17.09 §F – the year`s-work cards have room for their own sentences', () => {
  beforeEach(() => setActivePinia(createPinia()))
  afterEach(() => setViewport(DESKTOP))

  it('⭐ the sides are no longer four pixels – his own complaint, as a number', async () => {
    setViewport(PHONE)
    const wrapper = await mountTab(hiredAt('r43-pad-ask', 0), true)
    const option = wrapper.find(`${SEAT} .staff-focus-option`)
    expect(option.exists(), 'the picker is on the card at all – nothing here is vacuous without it').toBe(true)
    const cs = getComputedStyle(option.element)
    // ⚠ THE VALUE AND NOT A FLOOR, because a floor cannot tell a fix from a revert: `6px 4px` is what
    // he read and complained about, and `>= 8px` would be green on a tree that put it back to 6/4
    // plus a hair. The two numbers are the ones the ask was answered with.
    expect(cs.paddingLeft, 'the sides are the half he felt').toBe('10px')
    expect(cs.paddingRight, 'and both of them').toBe('10px')
    expect(cs.paddingTop, 'the ends grew with them').toBe('8px')
    expect(cs.paddingBottom, 'and both of those').toBe('8px')
    wrapper.unmount()
  })

  it('⭐⭐ (a) the sentence fits INSIDE the card at 375x667 – no word is pushed out of the box', async () => {
    setViewport(PHONE)
    const wrapper = await mountTab(hiredAt('r43-pad-in', 0), true)
    const row = wrapper.find(`${SEAT} .staff-focus`).element
    const options = wrapper.findAll(`${SEAT} .staff-focus-option`)
    expect(options.length, 'the row drew the years at all').toBeGreaterThan(1)

    const room = availableWidth(row, PHONE)
    const rowStyle = getComputedStyle(row)
    const gap = parseFloat(rowStyle.columnGap || rowStyle.gap) || 0
    // The declared basis – `flex: 1 1 calc(50% - 3px)` – resolved against the room the card leaves.
    const basis = (room - gap) / 2
    expect(basis, 'an option has real width to begin with').toBeGreaterThan(80)

    for (const [i, option] of options.entries()) {
      const inner = basis - sideChrome(option.element)
      // (a1) THERE IS A CONTENT BOX AT ALL. Padding eats content width under `box-sizing: border-box`,
      // so a generous enough pair of sides leaves the sentence nothing and the glyphs paint outside.
      expect(inner, `option ${i}: the padding left the sentence no room at 375px`).toBeGreaterThan(40)
      // (a2) AND NO SINGLE WORD IS WIDER THAN IT. A word cannot be broken, so a word wider than the
      // content box is the one thing that genuinely overflows a wrapping control rather than
      // spending another line.
      const word = longestWordPx(option.element)
      expect(
        word,
        `option ${i}: its longest word wants ${word.toFixed(0)}px of a ${inner.toFixed(0)}px box, so it hangs outside the card`,
      ).toBeLessThanOrEqual(inner)
      // ...and the card really has a rendered box, or the two lines above measured nothing.
      expect(boxOf(option.element, basis).h, `option ${i}: no box at all`).toBeGreaterThan(0)
    }
    wrapper.unmount()
  })

  it('⭐⭐ (b) ...and the two cards STILL sit two-up on one row at 375x667', async () => {
    setViewport(PHONE)
    const wrapper = await mountTab(hiredAt('r43-pad-row', 0), true)
    const row = wrapper.find(`${SEAT} .staff-focus`).element
    const options = wrapper.findAll(`${SEAT} .staff-focus-option`)

    const room = availableWidth(row, PHONE)
    const rowStyle = getComputedStyle(row)
    expect(rowStyle.display, 'the block is not a flex row at all').toContain('flex')
    expect(rowStyle.flexWrap, 'the 2x2 shape is a WRAP, not a grid').toBe('wrap')
    const gap = parseFloat(rowStyle.columnGap || rowStyle.gap) || 0
    const basis = (room - gap) / 2

    // ⚠⚠ THE MIN-CONTENT TERM IS WHAT MAKES THIS TEST ABLE TO FAIL. `.staff-focus-option` declares no
    // `min-width: 0`, so a flex item's default `min-width: auto` holds it at its own min-content
    // width – the longest unbreakable word plus the padding and the borders. Two items whose floor
    // passes the basis cannot both fit on the line however the basis is written, and the picker
    // becomes one option per row. Reading only the basis would make this arithmetic a tautology.
    let widest = 0
    for (const option of options) {
      widest = Math.max(widest, longestWordPx(option.element) + sideChrome(option.element))
    }
    const demanded = 2 * Math.max(basis, widest) + gap
    expect(
      demanded,
      `two options demand ${demanded.toFixed(0)}px of a ${room.toFixed(0)}px row at 375px – the picker is one per line, not two-up`,
    ).toBeLessThanOrEqual(room + 0.5)
    wrapper.unmount()
  })
})

describe('⭐⭐ 17.09 §G – the block itself lights while the marker is up', () => {
  beforeEach(() => setActivePinia(createPinia()))
  afterEach(() => {
    setReducedMotion(false)
    setViewport(DESKTOP)
  })

  it('⭐⭐ an off-season week with the change unused lights the whole radiogroup', async () => {
    setReducedMotion(false)
    const snap = hiredAt('r43-glow-open', OFF_SEASON)
    // The arm has to BE that week, and both halves of the shared selector are asserted rather than
    // assumed – this is round 42 #28's own fixture check, asked one surface later.
    expect(snap.diary.facts.offSeasonWeek, 'this is an off-season week').toBe(true)
    expect(snap.psychologistFocusOpen.length, 'the engine would accept a change').toBeGreaterThan(0)
    expect(psychologistFocusNudge(snap), 'the marker is up, so the block should be lit').toBe(true)

    const wrapper = await mountTab(snap, true)
    const row = wrapper.find(`${SEAT} .staff-focus`)
    expect(row.exists(), 'the picker is on the card').toBe(true)
    expect(row.classes(), 'the block carries the lit state').toContain('is-nudged')
    const style = getComputedStyle(row.element)
    expect(style.animation, 'and the lit state actually breathes').toContain('staff-focus-beat')
    wrapper.unmount()
  })

  it('⭐ ...and a mid-season week leaves it dark, so the glow says something', async () => {
    setReducedMotion(false)
    const snap = hiredAt('r43-glow-mid', OFF_SEASON - 12)
    expect(snap.diary.facts.offSeasonWeek, 'a mid-season week').toBe(false)
    expect(psychologistFocusNudge(snap), 'the marker is down').toBe(false)

    const wrapper = await mountTab(snap, true)
    const row = wrapper.find(`${SEAT} .staff-focus`)
    expect(row.exists(), 'the picker is still there – only the light is gone').toBe(true)
    expect(row.classes(), 'an unlit week lit the block anyway').not.toContain('is-nudged')
    expect(getComputedStyle(row.element).animation, 'and nothing is breathing on it').not.toContain(
      'staff-focus-beat',
    )
    wrapper.unmount()
  })

  it('⚠⚠ ...and under `prefers-reduced-motion: reduce` it STOPS MOVING without going out', async () => {
    // The chip's own killswitch, one screen over and for its stated reason: motion is what the system
    // asked to reduce, the edge light is not motion, and removing it would take the attention he
    // asked for away from exactly the player who most needs the block easy to find.
    setReducedMotion(true)
    const snap = hiredAt('r43-glow-reduced', OFF_SEASON)
    expect(psychologistFocusNudge(snap), 'the fixture is a lit week').toBe(true)
    const wrapper = await mountTab(snap, true)
    const style = getComputedStyle(wrapper.find(`${SEAT} .staff-focus`).element)
    expect(style.animation, 'the breathing survived a preference that asked for none').not.toContain(
      'staff-focus-beat',
    )
    expect(style.animation, 'switched off rather than left to a shorthand nobody set').toContain('none')
    expect(style.boxShadow, 'the light went out with the motion').toContain('rgba(')
    wrapper.unmount()
  })

  it('⚠ THE CONTROL – the harness is not answering `none` to every animation it is asked about', () => {
    // Without this the case above passes on a happy-dom that cannot compute an animation at all, or
    // on a stylesheet that failed to load. `.splash-hint` carries the app's other infinite pulse and
    // is untouched by this item, so it is the honest control at the un-reduced setting.
    setReducedMotion(false)
    const loud = document.createElement('span')
    loud.className = 'splash-hint'
    document.body.appendChild(loud)
    expect(getComputedStyle(loud).animation, 'the cascade is not being read at all').toContain('splash-pulse')
    loud.remove()
  })

  it('⚠ IT COSTS NO LAYOUT – the lit block and the dark one have the same boxes', async () => {
    // A glow that moved the controls under the finger would be a worse answer than no glow, so the
    // state may touch nothing but paint. Same career, same week, read twice: the only difference
    // between the two mounts is `psychologistFocusNudge`, which is the only fact the class reads.
    setReducedMotion(false)
    // ⚠ THE READS ARE TAKEN WHILE THE ELEMENT IS STILL MOUNTED AND COPIED OUT AS PLAIN STRINGS.
    // `getComputedStyle` hands back a LIVE declaration, and a detached element answers `''` to every
    // property – so holding the object across an `unmount()` compares a real arm with an empty one
    // and reads as a difference the light never made. Caught by this very case on its first run.
    const geometry = (el: Element): Record<string, string> => {
      const cs = getComputedStyle(el)
      const out: Record<string, string> = {}
      for (const side of ['Top', 'Right', 'Bottom', 'Left'] as const) {
        out[`padding${side}`] = cs[`padding${side}` as 'paddingTop']
        out[`border${side}Width`] = cs[`border${side}Width` as 'borderTopWidth']
        out[`margin${side}`] = cs[`margin${side}` as 'marginTop']
      }
      return out
    }

    const lit = await mountTab(hiredAt('r43-glow-box', OFF_SEASON), true)
    const litRow = lit.find(`${SEAT} .staff-focus`).element
    expect(litRow.classList.contains('is-nudged'), 'the lit arm really is lit').toBe(true)
    const litGeometry = geometry(litRow)
    const litBox = boxOf(litRow, availableWidth(litRow, PHONE)).h
    expect(Object.values(litGeometry).some((v) => v !== ''), 'the lit arm was read at all').toBe(true)
    lit.unmount()

    setActivePinia(createPinia())
    const dark = await mountTab(hiredAt('r43-glow-box', OFF_SEASON - 12), true)
    const darkRow = dark.find(`${SEAT} .staff-focus`).element
    expect(darkRow.classList.contains('is-nudged'), 'the dark arm really is dark').toBe(false)
    const darkGeometry = geometry(darkRow)

    for (const [key, value] of Object.entries(litGeometry)) {
      expect(value, `the light moved \`${key}\``).toBe(darkGeometry[key])
    }
    expect(boxOf(darkRow, availableWidth(darkRow, PHONE)).h, 'the block changed height when it lit').toBe(litBox)
    dark.unmount()
  })
})
