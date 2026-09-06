// ⭐⭐⭐ ROUND 37 ITEMS 9 AND 10 – THE MONEY SCREEN'S THIRD PASS, MOUNTED.
//
// His words are in docs/rounds/round-37.md and quoted in full in the rules they became – a template
// carries no Cyrillic, comments included (tests/template-copy-rules.test.ts), so the quotes live in
// `MoneyScreen.vue`'s script and style blocks and the paraphrases are here.
//
//   #9  «Her own account» is noisy in the shop; it is drawn on the Spending chapter alone now.
//   #10 the right-hand sector gets THREE TIMES the air round 36 review #15 gave it, and the note
//       itself is a third wider. Tablet and desktop only.
//
// ⚠ WHAT IS NOT IN THIS FILE, AND WHERE IT IS INSTEAD. Item 10's air is a MULTIPLIER on a rule that
// already had a mutation-verified guard, so those two numbers are re-aimed in place in
// `round36-review.test.ts` §3 rather than re-asserted here – a new file claiming 96 while the old one
// still claims 32 is two tests disagreeing, which that file's own header calls worse than either.
// What is here is everything neither file had ever asserted: which CHAPTER draws the plate, that the
// note grew, that the photograph and the pie chart did NOT, and that the phone is untouched.
//
// ⚠ THE ORDER IS ALWAYS `setViewport` -> mount -> read, and `attachTo: document.body` is mandatory:
// happy-dom evaluates a media query on the FIRST computed-style read and caches it, and applies no
// rule at all to a detached tree. Both are recorded beside `TABLET` in fits.ts.
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
// ⚠ A RUNNER-SIZED CEILING, and the same arithmetic `round36-review.test.ts` writes out: the plate
// only exists once her prize-share ramp is running, which is five seasons of real engine, and
// GitHub's 2-core runner is measured at 4-5x this machine on this suite. The walk is hoisted out of
// every case (`grown` below), so what is left inside one is a mount.
vi.setConfig({ testTimeout: 30_000 })
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import '../../src/style.css'
import MoneyScreen from '../../src/components/screens/MoneyScreen.vue'
import { useGameStore } from '../../src/stores/game'
import {
  closeTournament,
  createWorld,
  skipTournament,
  tickWeek,
  toSnapshot,
  type WorldState,
} from '../../src/engine/world'
import { rngFromSeed } from '../../src/engine/rng'
import type { Snapshot } from '../../src/shared/protocol'
import { DESKTOP, PHONE, TABLET, lengthPx, setViewport, type Viewport } from './fits'
import { openShelfTab } from './shelf'

function assertSheetPresent(): void {
  if (!document.head.querySelector('style')) {
    throw new Error('no stylesheet in the document – the component project needs `css: true`')
  }
}

/** ⭐ HIS LADDER, ALL FIVE RUNGS. `fits.ts` carries three of them; 900 is the top of his tablet band
 *  and 1024 is where the desktop rail arrives (docs/specs/responsive-2026-09.md, «768 как раз тоже
 *  можно до 900 тянуть вполне, потом фиксировать посередине, а дальше десктоп от 1024»), and item 10
 *  has to be measured at every width it claims to change. */
const TABLET_WIDE: Viewport = { width: 900, height: 1024 }
const LAPTOP: Viewport = { width: 1024, height: 800 }
const WIDE: Viewport[] = [TABLET, TABLET_WIDE, LAPTOP, DESKTOP]

/** A real career, walked by the real engine – `shop-tab.test.ts`'s recipe, shared by every mounted
 *  file that reaches this screen. */
function walk(seed: string, weeks: number): WorldState {
  const world = createWorld(seed)
  const rng = rngFromSeed(world.seed)
  for (let i = 0; i < weeks; i++) {
    tickWeek(world, rng)
    if (world.pendingTournament) {
      skipTournament(world)
      closeTournament(world)
    }
  }
  return world
}

/** Rich enough that no rung of the shelf is greyed for money alone – item 9 has to press into the
 *  shop, and a shop with nothing on it would answer a question nobody asked. */
function rich(seed: string, weeks: number): WorldState {
  const w = walk(seed, weeks)
  w.bestFinishByTier.wta250 = 3
  w.fundsCents = 60_000_000_00
  return w
}

/**
 * ⚠ THE RAMP HAS TO BE RUNNING for the plate to be on the screen at all – her eighteenth – so the
 * fixture is WALKED to it rather than faked, which is `round35-shop.test.ts`'s own recipe for this
 * exact strip.
 *
 * ⚠⚠ AND IT IS WALKED ONCE, OUTSIDE THE CASES. Five seasons of real ticks is seconds of engine;
 * paid inside a case it passes alone and times out in a full suite run under contention, which is a
 * red that is neither a defect nor a flake. The snapshot is read-only data, so one career serves
 * every viewport and every chapter.
 */
let grownSnap: Snapshot | null = null
function grown(): Snapshot {
  if (!grownSnap) {
    grownSnap = toSnapshot(rich('r37-9-account', 52 * 5))
    expect(grownSnap.ageYears, 'the fixture is past the threshold birthday').toBeGreaterThanOrEqual(18)
  }
  return grownSnap
}

async function mountMoney(snapshot: Snapshot) {
  useGameStore().snapshot = snapshot
  return mount(MoneyScreen, { attachTo: document.body, global: { stubs: { teleport: true } } })
}

/** Press one of the four chapter buttons and leave it open. Addressed by the word on the control,
 *  which is what a player presses – never by a `v-if` reached from the inside. */
async function openChapter(wrapper: Awaited<ReturnType<typeof mountMoney>>, label: string) {
  const pill = wrapper.findAll('.money-tabs button.tab-pill').find((n) => n.text().trim() === label)
  expect(pill, `the ${label} chapter button`).toBeTruthy()
  await pill!.trigger('click')
}

/**
 * The box a rule declares, in px. happy-dom has no layout engine (fits.ts's header), so every number
 * here is read out of the cascade rather than off a rendered rectangle.
 *
 * ⚠ IT FOLDS TWO `calc` FORMS AND NOTHING ELSE, and both are shapes this screen already uses:
 * `calc(<n> * <length>)` – round 36 review #15's «two of the app's own gutters», which item 10
 * multiplies to six – and `calc(<length> * <a> / <b>)`, which is item 10's «a third wider» said as
 * the arithmetic instead of as a 194.67 that cannot be traced back to the 146 it came from.
 * happy-dom substitutes the variable and leaves the ARITHMETIC alone (`calc(6 * 16px)`, measured),
 * so the fold happens here. Same precedent and the same reason as `round36-review.test.ts`'s own
 * `px` and `round35-shop.test.ts`'s `calcPx`.
 */
function px(value: string, base: number): number {
  const v = value.trim()
  const direct = lengthPx(v, base)
  if (Number.isFinite(direct)) return direct
  const times = /^calc\(\s*(-?[\d.]+)\s*\*\s*(-?[\d.]+)px\s*\)$/.exec(v)
  if (times) return Number(times[1]) * Number(times[2])
  const scaled = /^calc\(\s*(-?[\d.]+)px\s*\*\s*(-?[\d.]+)\s*\/\s*(-?[\d.]+)\s*\)$/.exec(v)
  if (scaled) return (Number(scaled[1]) * Number(scaled[2])) / Number(scaled[3])
  return NaN
}

// =================================================================================================
// 9. «HER OWN ACCOUNT» BELONGS TO SPENDING ALONE
// =================================================================================================
// The plate has been outside every `screenTab` guard since round 26 #5b wrote it – it was on all
// four chapters, on the shop home and on every shelf page, at every width (measured in Chromium
// before the change: present and visible on all five). The owner asked for it on Spending only.
//
// ⚠ THIS HIDES NO FIGURE. The balance sentence is the engine's own (`kidLife.ownAccountNote`) and
// `KidScreen.vue` prints the identical string on her own page; the week's short telling of the same
// split is on WeekRecapCard's Finances tile. What the plate alone says – the DIRECTION of the split –
// stays on Spending, so nothing became unreachable. That census is the reason this item was built
// rather than queried, and it is asserted below rather than only claimed.
//
// MUTATION-VERIFIED: the `&& screenTab === 'spend'` guard removed -> the three «no other chapter»
// arms; the guard widened to `!== 'shop'` -> the Bills and History arms alone.
describe('round 37 #9 – the account plate is the Spending chapter’s alone', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    document.body.innerHTML = ''
  })
  afterEach(() => setViewport(PHONE))

  it('⭐ on Spending it is exactly what it always was – the frame, the photograph, both sentences', async () => {
    setViewport(PHONE)
    const wrapper = await mountMoney(grown())
    const plate = wrapper.find('.money-share')
    expect(plate.exists(), 'the chapter the screen opens on still draws it').toBe(true)
    expect(plate.attributes('role'), 'round 26 #5b’s own role').toBe('note')
    expect(plate.find('.money-share-photo').exists(), 'round 35 #3’s photograph').toBe(true)
    // ⚠ NOT ONE WORD OF THE COPY IS THIS ITEM'S TO MOVE (CLAUDE.md invariant 4). The two sentences
    // are asserted here so a «hide it on three chapters» change that also edited a clause cannot
    // pass as this item.
    expect(plate.text()).toContain('Every prize cheque is split before it reaches this account')
    expect(plate.text()).toContain('her part goes to her, the family banks the rest')
    wrapper.unmount()
  })

  it('⭐⭐ and on no other chapter – Bills, History, the shop’s home and a shelf inside it', async () => {
    setViewport(PHONE)
    const wrapper = await mountMoney(grown())
    expect(wrapper.find('.money-share').exists(), 'Spending, or this measures nothing').toBe(true)

    for (const chapter of ['Bills', 'History', 'Shop']) {
      await openChapter(wrapper, chapter)
      expect(wrapper.find('.money-share').exists(), `the plate is still drawn on ${chapter}`).toBe(false)
    }
    // ⚠ ONE LEVEL DEEPER, because round 35 #3's «а также на каждой странице магазина» was satisfied
    // by the strip sitting outside every guard, and it is that half the owner has now taken back.
    // A category page is where he was standing when he called it noise.
    await openShelfTab(wrapper, 'Cars')
    expect(wrapper.find('.money-share').exists(), 'the plate is still drawn on a shelf page').toBe(false)

    // ⚠ AND IT IS A GUARD, NOT A DELETION – pressing back into Spending brings it whole.
    await openChapter(wrapper, 'Spending')
    const back = wrapper.find('.money-share')
    expect(back.exists(), 'the plate comes back with the chapter').toBe(true)
    expect(back.find('.money-share-photo').exists(), 'photograph and all').toBe(true)
    wrapper.unmount()
  })

  it('⚠ the guard is the CHAPTER and never the width – 375 and 1280 answer identically', async () => {
    // ⚠⚠ THIS IS `e2e/parity.spec.ts`'s QUESTION ASKED IN A MOUNTED TEST, and it is the reason item
    // 9 is safe to build: that harness fails BY NAME when a surface loses something at some widths
    // and not at others. A chapter guard subtracts the same node at every width, so the four
    // fingerprints stay equal – but the claim is worth holding here too, cheaply, because a media
    // query is the obvious wrong way to build this item and it would pass every arm above.
    for (const vp of [PHONE, DESKTOP]) {
      setViewport(vp)
      document.body.innerHTML = ''
      const wrapper = await mountMoney(grown())
      expect(wrapper.find('.money-share').exists(), `Spending at ${vp.width}`).toBe(true)
      await openChapter(wrapper, 'Shop')
      expect(wrapper.find('.money-share').exists(), `the shop at ${vp.width}`).toBe(false)
      wrapper.unmount()
    }
  })
})

// =================================================================================================
// 10. THE NOTE IS A THIRD WIDER – AND THE PHOTOGRAPH AND THE PIE CHART ARE NOT
// =================================================================================================
// «Саму записку тоже можно на 1/3 шире сделать на планшетах и десктопах». The receipt is `width: 100%`
// of the artefact column, so a third wider is the COLUMN a third wider: 146px -> 194.67px. The other
// two objects in that column are then held to their own measures – the polaroid at its 132px, the
// donut pinned back to the 146 it has today – because he asked for AIR around them and width on the
// note alone, and a pie chart a third bigger is round 36 review #15's «not a bigger paper» warning
// repeated on a new object.
//
// ⚠ THE AIR ITSELF (32 -> 96 on each side) IS RE-AIMED IN `round36-review.test.ts` §3, beside the
// rule it multiplies. It is asserted here only as the RATIO, which is the half of his sentence that
// file cannot state: three times, not a new number.
//
// MUTATION-VERIFIED: the `width` line dropped from the media block -> the wide arm; the `.money-donut`
// media block deleted -> the pie arm alone; the whole media block moved above `.money-donut`'s base
// rule (the cascade trap the rule's own comment names) -> the pie arm alone.
describe('round 37 #10 – three times the air, and the note a third wider', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    document.body.innerHTML = ''
  })
  afterEach(() => setViewport(PHONE))

  /** Every measure the item touches, at one viewport, read off the cascade. */
  async function sector(vp: Viewport) {
    setViewport(vp)
    document.body.innerHTML = ''
    const wrapper = await mountMoney(grown())
    const body = document.querySelector('.money-body')
    const column = document.querySelector('.money-artefacts')
    const note = document.querySelector('.money-receipt')
    const photo = document.querySelector('.money-polaroid')
    const pie = document.querySelector('.money-donut')
    expect(body, 'the Spending chapter is the one the screen opens on').toBeTruthy()
    expect(column, 'and the artefact column is beside the figures').toBeTruthy()
    expect(note, 'with the receipt in it').toBeTruthy()
    expect(pie, 'and the pie chart under the photograph').toBeTruthy()
    const cs = getComputedStyle(body!)
    const out = {
      // ⚠ `gap` AND NOT `columnGap`: happy-dom does not expand the shorthand into its longhands.
      gapLeft: px(cs.gap || cs.columnGap, vp.width),
      gapRight: px(getComputedStyle(column!).marginRight || '0px', vp.width),
      column: px(getComputedStyle(column!).width, vp.width),
      // The note is `width: 100%` of the column at every width – the column is what grows, which is
      // why the declaration is read as well as the number it resolves to.
      noteDeclared: getComputedStyle(note!).width.trim(),
      photo: px(getComputedStyle(photo!).width, vp.width),
      pieDeclared: getComputedStyle(pie!).width.trim(),
    }
    wrapper.unmount()
    return out
  }

  it('⭐⭐ the sector is a third wider at 768, 900, 1024 and 1280 – and the note fills it', async () => {
    assertSheetPresent()
    for (const vp of WIDE) {
      const wide = await sector(vp)
      // 146 is round 36 review #15's own number for this column and its comment names all three
      // objects that share it. A third wider is 4/3 of it.
      expect(wide.column, `the column is a third wider at ${vp.width}`).toBeCloseTo((146 * 4) / 3, 2)
      expect(wide.column / 146, `and «на 1/3 шире» is the ratio at ${vp.width}`).toBeCloseTo(4 / 3, 4)
      expect(wide.noteDeclared, `the note takes the whole of it at ${vp.width}`).toBe('100%')
    }
  })

  it('⭐⭐ the air on each side is THREE TIMES what round 36 review #15 shipped', async () => {
    assertSheetPresent()
    // 32px was the accepted figure – `calc(2 * var(--app-pad-x))`, two of the app's own gutters on
    // each side. «В 3 раза» is a multiplier on it, so the assertion is written as the multiplication
    // rather than as a 96 that has forgotten where it came from.
    const ACCEPTED = 2 * 16
    for (const vp of WIDE) {
      const wide = await sector(vp)
      expect(wide.gapLeft, `three times the air on the left at ${vp.width}`).toBe(3 * ACCEPTED)
      expect(wide.gapRight, `and on the right at ${vp.width}`).toBe(3 * ACCEPTED)
      expect(wide.gapLeft, 'symmetric, as item 15 left it').toBe(wide.gapRight)
    }
  })

  it('⚠ the photograph and the pie chart do NOT grow with it', async () => {
    assertSheetPresent()
    const phone = await sector(PHONE)
    for (const vp of WIDE) {
      const wide = await sector(vp)
      expect(wide.photo, `the trip polaroid keeps its 132px at ${vp.width}`).toBe(phone.photo)
      expect(wide.photo, 'which is the number its own rule states').toBe(132)
      // ⚠⚠ THE ARM THAT MATTERS. The ring is `width: 100%` of the column on a phone, so without a
      // rule of its own it would have followed the column to 194.67 and the pie would be a third
      // bigger – the item overshooting into an object he asked for AIR around, not width on.
      expect(wide.pieDeclared, `the pie keeps its own 146px at ${vp.width}`).toBe('146px')
    }
  })

  it('⚠ nothing below 768 moves, to the pixel', async () => {
    assertSheetPresent()
    const phone = await sector(PHONE)
    expect(phone.gapLeft, 'the 8px gap the phone shipped with').toBe(8)
    expect(phone.gapRight, 'and no margin at all').toBe(0)
    expect(phone.column, 'the 146px column, untouched').toBe(146)
    expect(phone.noteDeclared, 'the note across it').toBe('100%')
    expect(phone.photo, 'the polaroid').toBe(132)
    expect(phone.pieDeclared, 'and the ring across the whole column, as it always was').toBe('100%')
  })
})
