// ROUND 43 #2 – THE SUPPORT SEATS GET THEIR FACES, and this file is the geometry that makes the
// placement a rule rather than a look.
//
// The owner drew four portraits and shipped them himself; round 42 #53 converted them and left the
// PLACEMENT open, so for a whole round the four `.webp` were in every install and on no screen –
// «я не увидел в пришедшем обновлении картинок для support stuff». (His words are quoted in the
// script blocks of the files they decide; this is a .ts and may carry them, which is why the two
// rulings below are quoted here in full rather than paraphrased.)
//
// ⭐ THE PLACEMENT IS HIS OWN RULING, and it names the treatment rather than a pixel: «вот это
// используй пожалуйста, принцип похож, просто соотношение сторон будет немного другое» – the coach
// strip, at a different aspect ratio. So `.staff-card` takes `.cm-row`'s five properties: a
// fixed-width strip, `object-fit: cover`, an `object-position` that keeps the head whole, the body's
// own height driving the picture, and a floor derived so the picture can never be narrower than its
// window.
//
// ⚠⚠ AND THE RATIO IS THE WHOLE POINT OF THE FILE. The coach masters are 162x264 (w/h 0.614); these
// are 368x512 (0.719) – a WIDER figure at the same height, so it fills a strip of the same width at
// a LOWER card height. Reading `.cm-row`'s 168 or `.cm-row.current`'s 196 across would have
// over-floored this card by 32-60px and guaranteed nothing at all, because neither number is
// derived from this ratio. 136 is: 96 x 512/368 + 2 = 135.57, and (136-2) x 368/512 = 96.31 >= 96.
//
// ⚠ WHAT THIS FILE DELIBERATELY DOES NOT ASSERT: that the head is inside the window at the card's
// real height. happy-dom has no layout engine (see `fits.ts`), so a rendered containment cannot be
// measured here – it was measured in Chromium instead, through this component's own shipped rules,
// and the numbers are recorded in `.staff-art img`'s comment. What IS asserted here is every input
// that containment depends on: the strip, the floor, the ratio inequality, and that an explicit
// `object-position` exists at all. A defaulted `50% 50%` is the one value that would look right
// today (the window is the whole picture at the floor) and drift silently the first time the card
// grows a line, which is the failure this file exists to make impossible.
//
// ⚠ MUTATION-VERIFIED (each arm applied to src, the file run, then reverted) – see the ARMS table at
// the foot of this file for what each one reddened.
import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { nextTick } from 'vue'
// ⚠ THE APP'S OWN SHEET, round21-coach-photo's rule: the card borrows `.cm-load` and the block
// borrows `.tier-head` from src/style.css, and without this every computed value is the initial one.
import '../../src/style.css'
import CoachMarketScreen from '../../src/components/screens/CoachMarketScreen.vue'
import { useGameStore } from '../../src/stores/game'
import { createWorld, hireMasseur, hirePsychologist, toSnapshot } from '../../src/engine/world'
import { DEFAULT_PROFILE, type Snapshot } from '../../src/shared/protocol'
import { PHONE, setViewport } from './fits'

// happy-dom has no `localStorage` on the component project's window and the market's onboarding cue
// reads one at mount. The same shim round18-coach / round21-coach-photo install, quoted in full there.
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

/** THE MASTERS' OWN DIMENSIONS, and they are the only two numbers in this file that come from
 *  outside the cascade. Every `public/images/support-stuff/*.webp` is 368x512 (verified off the
 *  files' headers; 448x624 until 22.09's downscale – wave 10, his «давай оптимизируем», -36 KiB).
 *  The floor's whole job is to hold the inequality against THIS pair. */
const ART_W = 368
const ART_H = 512
/** …and the coach masters', quoted only so the "not the coach's arithmetic" test can say what it is
 *  refusing. `.cm-row`'s own floor is derived from 162/280 (round 42 #3: 280 is the taller master
 *  and therefore the narrowest picture for a given height, which makes it the honest worst case). */
const COACH_W = 162
const COACH_H = 280

/** THE HEAD BOX, read off a percentage grid rendered over each master: the hair's outline at HEAD
 *  height (the top of the hair through the chin), never the hair that falls onto the shoulders.
 *  masseur [0.16, 0.58], psychologist [0.20, 0.74] – so the union both must fit inside is this.
 *  ⚠ A GRID READING, good to about +/-0.02, which is why nothing below is asserted to more than the
 *  slack can carry. ⚠ AND NOT ROUND 42 #3's «8-62%»: that was measured on sixteen coach masters,
 *  men framed head-on with short hair, and does not transfer to two women with hair past the jaw. */
const HEAD: [number, number] = [0.16, 0.74]

/** Refuses to run blind – round21-coach-photo's guard, and the reason is sharper here: with no
 *  stylesheet `min-height` computes to `auto`, `parseFloat` gives NaN, and an inequality over NaN
 *  is false in both directions, so a bare `expect(...).toBeGreaterThanOrEqual` would fail for the
 *  RIGHT reason by accident and a `.not.` form would pass for the wrong one. */
function assertSheetPresent(): void {
  if (!document.head.querySelector('style')) {
    throw new Error('no stylesheet in the document – the component project needs `css: true`')
  }
}

/** px off a computed value, throwing rather than returning NaN. ⚠⚠ THIS ROUND HAS ALREADY SHIPPED A
 *  TEST THAT PASSED ON THE BROKEN VERSION because it wrote `parseFloat(style.minWidth) || 0`, which
 *  is 0 when the property is ABSENT – so the assertion measured the fallback. Every read below goes
 *  through here and an absent rule is an error, never a zero. */
function px(value: string, what: string): number {
  const n = Number.parseFloat(value)
  if (!Number.isFinite(n)) throw new Error(`${what} computed to "${value}" – the rule did not reach the element`)
  return n
}

/** A professional career with both seats filled, through the real protocol: the pro door is her
 *  first counting W finish, which is exactly what `masseurUnlocked` / `psychologistUnlocked` read. */
function hiredSnapshot(): Snapshot {
  const world = createWorld('r43-staff-portrait', DEFAULT_PROFILE)
  world.bestFinishByTier.w15 = 0
  hireMasseur(world, true)
  hirePsychologist(world, true)
  return toSnapshot(world)
}

function lockedSnapshot(): Snapshot {
  return toSnapshot(createWorld('r43-staff-portrait-junior', DEFAULT_PROFILE))
}

/** ⚠ MOUNTS THE SCREEN AND PRESSES THE TAB, never the tab component directly – masseur-card.test.ts's
 *  own rule: «can he get to it» IS the defect this chapter exists for, and the defect THIS item fixes
 *  is one step further on («I did not see the pictures in the update»), so the address matters. */
async function openStaff(snapshot: Snapshot) {
  setViewport(PHONE)
  const store = useGameStore()
  store.snapshot = snapshot
  const wrapper = mount(CoachMarketScreen, {
    global: { stubs: { teleport: true } },
    attachTo: document.body,
  })
  const pill = wrapper.findAll('.tb-seg .tab-pill').find((b) => b.text() === 'Support staff')
  expect(pill, 'the Support staff tab is on the screen at all').toBeTruthy()
  await pill!.trigger('click')
  await nextTick()
  return wrapper
}

describe('round 43 #2 – the support seats wear their portraits', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('every seat on the payroll has a face, and it is its own file', async () => {
    assertSheetPresent()
    const wrapper = await openStaff(hiredSnapshot())

    const blocks = wrapper.findAll('.staff-block')
    // ⚠ THREE SINCE v80 (wave F2). This case shipped with TWO and its own ⚠⚠ below explained the
    // absent third at length – «`sparring` has nothing to sit on». It has a seat now, so the number
    // moves and the note under it is re-aimed rather than deleted: the BROKER is still parked, and
    // «a portrait rendered for a seat the engine cannot fill» is still the thing this case refuses.
    expect(blocks.length, 'three seats – the masseur, the psychologist and the hitting partner').toBe(3)

    const seen: string[] = []
    for (const block of blocks) {
      const seat = block.attributes('data-staff')!
      const img = block.find('.staff-art img')
      expect(img.exists(), `the ${seat} card carries a portrait`).toBe(true)
      const src = img.attributes('src')!
      // ⚠ THE SEAT'S OWN FILE, asserted by name rather than by "a src is present": one member handed
      // the other's stem is the defect a v-for over a shared descriptor makes easy, and it would
      // render two plausible faces in the wrong order.
      expect(src, `the ${seat} card's src`).toContain('images/support-stuff/')
      expect(src, `the ${seat} card shows the ${seat}`).toContain(`${seat}.webp`)
      // ⚠ EMPTY `alt`, the coach row's rule: the picture is decoration beside a name the card
      // already prints, and «Masseur, a masseur» is the seat said twice to a screen reader.
      expect(img.attributes('alt'), `the ${seat} portrait is decorative`).toBe('')
      seen.push(seat)
    }
    expect(seen.sort()).toEqual(['masseur', 'psychologist', 'sparring'])

    // ⚠⚠ AND THE ONE FILE WITH NO SEAT IS NOT ON THE SCREEN, which is a claim about the ITEM and not
    // a tidy-up: a portrait rendered for a seat the engine cannot fill is a seat advertised by its
    // picture. `broker` is the owner's own parking («брокера пока не знаю») and stays on the shelf.
    //
    // ⭐ IT USED TO BE TWO, AND THE SECOND WAS `sparring`: the three keys were reserved with no reader
    // anywhere on the tree, so there was no card to put a face on. Wave F2 reads them, and the
    // portrait that shipped in every install since round 42 #53 is on the screen above.
    const html = wrapper.html()
    expect(html, 'the broker has no surface and stays on the shelf').not.toContain('broker.webp')
    expect(html, 'and the seat that WAS parked is now rendered').toContain('sparring.webp')

    wrapper.unmount()
  })

  it('the strip is a porthole, not a stretched person – cover, full-bleed, and a real object-position', async () => {
    assertSheetPresent()
    const wrapper = await openStaff(hiredSnapshot())
    const img = wrapper.find('.staff-art img').element
    const style = getComputedStyle(img)

    // The A2c/d ruling `.cm-art img` inherits: `cover` on a box narrower than the picture's own
    // ratio scales by HEIGHT and spends every overflowing pixel sideways – the identical clip
    // `overflow: hidden` already made, with a say in which slice survives.
    expect(style.objectFit, 'the picture is clipped, never stretched').toBe('cover')
    expect(style.width, 'the image fills its window, which is what makes the clip steerable').toBe('100%')
    expect(style.height, 'and it is sized by HEIGHT – the body drives the picture').toBe('100%')

    // ⚠⚠ THE ONE ASSERTION THAT CANNOT BE WRITTEN AS "IT IS NOT EMPTY". At the floor the window is
    // the whole picture, so `50% 50%` renders identically to the chosen value and a presence check
    // would be satisfied by the default. The horizontal value is read as a NUMBER and put through
    // the containment inequality at a window narrower than any this card draws today.
    const [posX] = style.objectPosition.split(/\s+/)
    expect(posX, 'the horizontal position is a percentage the rule states').toMatch(/%$/)
    const p = px(posX, '.staff-art img object-position x') / 100

    // Write the window as [L, L+w] in picture fractions: w = strip / picture, L = p(1 - w). The head
    // box must be inside it. Asked at w = 0.62 – a 155px picture, a 216px padding box, 1.6x this
    // card's floor – so the value is proved against a card that has grown well past anything on
    // screen, not only against today's.
    // ⚠⚠ 0.62 IS CHOSEN SO THE CSS **DEFAULT** FAILS IT, which is the whole reason this test is
    // worth writing. At the floor the window is the whole picture, so a deleted declaration renders
    // identically to the chosen one and any looser window would grade `50% 50%` as correct: there
    // L = 0.5 x 0.38 = 0.190, which is right of the head's 0.16 and reddens. The shipped 38% gives
    // L = 0.144 with 0.024 of the picture to spare on the other side.
    const w = 0.62
    const L = p * (1 - w)
    expect(L, `the window's left edge (${L.toFixed(3)}) is left of the head (${HEAD[0]})`).toBeLessThanOrEqual(HEAD[0])
    expect(L + w, `its right edge (${(L + w).toFixed(3)}) is right of the head (${HEAD[1]})`).toBeGreaterThanOrEqual(HEAD[1])

    wrapper.unmount()
  })

  it('the floor is derived from 368/512 – the picture can never be narrower than its strip', async () => {
    assertSheetPresent()
    const wrapper = await openStaff(hiredSnapshot())

    for (const block of wrapper.findAll('.staff-block')) {
      const seat = block.attributes('data-staff')!
      const card = block.find('.staff-card').element
      const art = block.find('.staff-art').element
      const floor = px(getComputedStyle(card).minHeight, `${seat} .staff-card min-height`)
      const strip = px(getComputedStyle(art).width, `${seat} .staff-art width`)

      // ⚠ WITHOUT THESE TWO THE STRIP IS NOT IN THE CARD AT ALL. `.staff-art` is absolutely
      // positioned, so `top: 0; bottom: 0` resolve against the nearest positioned ancestor – with no
      // `position: relative` here that is the viewport, and the picture would be the height of the
      // SCREEN behind the whole tab. `overflow: hidden` is what keeps it inside the rounded corner.
      expect(getComputedStyle(card).position, `${seat} card is the strip's containing block`).toBe('relative')
      expect(getComputedStyle(card).overflow, `${seat} card clips its own strip`).toBe('hidden')

      // THE INEQUALITY, round-18 #2's sentence read against this ratio. The mask reaches transparent
      // exactly at the strip's right edge, so the clip is invisible only while the picture is at
      // least as wide as the strip; the picture is height-driven and `.staff-art` is `top: 0;
      // bottom: 0` of the PADDING box, so the narrowest picture this layout can produce is
      // (floor - 2 borders) x 368/512.
      const narrowest = ((floor - 2) * ART_W) / ART_H
      expect(
        narrowest,
        `the ${seat} card's ${floor}px floor fills its ${strip}px strip (${narrowest.toFixed(2)} >= ${strip})`,
      ).toBeGreaterThanOrEqual(strip)

      // ⚠⚠ AND IT IS **THIS** RATIO'S FLOOR AND NOT THE COACH ROW'S, which is the half the inequality
      // alone cannot say: 168 and 196 also satisfy it, and either would be a number copied from a
      // different master. A floor derived from 162/280 for this strip would be 96 x 280/162 + 2 =
      // 167.9 -> 168; ours is 135.6 -> 136, and the gap is the whole of «соотношение сторон будет
      // немного другое». Asserting the floor is UNDER the coach's is what fails if somebody
      // "harmonises" the two cards by giving this one the market row's number.
      const coachFloorForThisStrip = (strip * COACH_H) / COACH_W + 2
      expect(
        floor,
        `the ${seat} floor is derived from 368/512 (${floor}), not from the coach masters' 162/280 (${coachFloorForThisStrip.toFixed(1)})`,
      ).toBeLessThan(coachFloorForThisStrip)
      // ...and it is the SMALLEST integer that holds the inequality, so it is a derivation and not a
      // round number that happens to work: one pixel less and the picture stops filling the strip.
      const oneLess = ((floor - 1 - 2) * ART_W) / ART_H
      expect(oneLess, `${seat}: ${floor - 1} would leave ${oneLess.toFixed(2)} inside a ${strip}px strip`).toBeLessThan(strip)
    }

    wrapper.unmount()
  })

  it('the text clears the picture by the band the owner negotiated – 10 to 15px', async () => {
    assertSheetPresent()
    const wrapper = await openStaff(hiredSnapshot())

    for (const block of wrapper.findAll('.staff-block')) {
      const seat = block.attributes('data-staff')!
      const strip = px(getComputedStyle(block.find('.staff-art').element).width, `${seat} strip`)
      const text = px(getComputedStyle(block.find('.staff-body').element).marginLeft, `${seat} .staff-body margin-left`)
      const air = text - strip
      // Round-18 #2's own corridor, asked of the seat card: «10-15 пикселей, чтобы весь текстовый
      // блок на картинку не попадал». `.cm-body` keeps 12 and so does this. Move one, move the other.
      expect(air, `${seat}: ${text} - ${strip} = ${air}px of air`).toBeGreaterThanOrEqual(10)
      expect(air, `${seat}: ${text} - ${strip} = ${air}px of air`).toBeLessThanOrEqual(15)
    }

    wrapper.unmount()
  })

  it('a locked seat still shows its face – dimmed with the card, never hidden', async () => {
    assertSheetPresent()
    const wrapper = await openStaff(lockedSnapshot())

    const blocks = wrapper.findAll('.staff-block')
    expect(blocks.length, 'three since v80').toBe(3)
    for (const block of blocks) {
      const seat = block.attributes('data-staff')!
      expect(block.find('.staff-card').classes(), `${seat} is locked before the professional career`).toContain('locked')
      // ⚠ WHICH SEATS EXIST IS A FACT ABOUT THE GAME, and the locked card already says so in words
      // (the engine's own refusal sentence). Hiding the portrait until the seat opens would make the
      // shelf look emptier than it is – the same argument `.staff-focus-option:disabled` makes for
      // dimming a closed year rather than removing it.
      expect(block.find('.staff-art img').exists(), `${seat} keeps its face while locked`).toBe(true)
    }

    wrapper.unmount()
  })
})

// ===========================================================================
// THE ARMS. Each was applied to src/components/SupportStaffTab.vue, this file run, then reverted.
//
//   1. `<span class="staff-art">` deleted from the markup
//      -> «every seat on the payroll has a face» (the portrait is missing) AND the object-position
//         test (no element to compute) AND the floor test (no strip to measure). The shipped state
//         before this item, and it reddens three of the five.
//   2. both members handed `portrait: 'masseur'`
//      -> «every seat…» on the psychologist's `psychologist.webp` – the v-for defect this file's
//         by-name assertion exists for; a presence check would have stayed green.
//   3. `object-position` deleted from `.staff-art img` (so it computes to the `50% 50%` initial)
//      -> the porthole test: p = 0.5, L = 0.190 at w = 0.62, which is right of the head's 0.16.
//         ⚠⚠ THIS ARM IS WHY THE TEST IS ASKED AT 0.62 AND NOT AT 0.70. The first draft asked at
//         w = 0.70, where the containment band is [13.3%, 53.3%] – the CSS default sits INSIDE it, so
//         the arm was GREEN and the assertion was grading a property it could not see. Recorded
//         rather than quietly fixed: «the test passed on the broken version» is this round's own
//         recurring failure and the fix was to move the question, not to add another one.
//   3b. `object-position: 38% 50%` -> `90% 50%` (a window re-aimed by eye)
//      -> the porthole test: L = 0.342 at w = 0.62, far right of the head. The band is [0%, 42.1%]
//         at that width, so anything past 42% reddens.
//   4. `min-height: 136px` -> `min-height: 130px`
//      -> the floor test: (130-2) x 368/512 = 92.00 < 96, the inequality fails by name.
//   5. `min-height: 136px` -> `min-height: 168px` (the coach row's number copied across)
//      -> the floor test's "derived from 368/512, not from 162/280" arm: 168 is not < 167.9.
//         ⚠ THIS IS THE ARM THAT MATTERS MOST and the plain inequality cannot see it at all – 168
//         satisfies the inequality comfortably, which is exactly how a number from another master
//         survives a review.
//   6. `position: relative` deleted from `.staff-card`
//      -> the floor test: the strip's containing block is no longer the card.
//   7. `.staff-body { margin-left: 108px }` -> `96px`
//      -> the air test: 0px of air, outside the 10-15 band.
//   8. `v-if="m.unlocked"` added to the portrait span
//      -> the locked test: the face disappears before the seat opens.
// ===========================================================================
