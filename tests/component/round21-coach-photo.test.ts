// ROUND 21 #1 and #6 – TWO SMALL SURFACES, EACH WITH ONE MEASURABLE CLAIM.
//
//   #1  «У выбранного тренера в списке тренеров фото пропорционально шире сделай пожалуйста
//       относительно высоты. Текст при этом чуть уже станет.» The coach she HAS gets a wider
//       window onto his portrait, and the text column pays for it.
//   #6  «Давай фильтровать даты трофеев в обратном порядке от самого актуального сначала к самым
//       ранним в конце.» Newest season first in the trophy cabinet.
//
// The quotes live here and not in either component: no Cyrillic may appear in a .vue file at all,
// comments included (tests/round13-nav.test.ts enforces it).
//
// ⚠ WHY #1 IS A GEOMETRY TEST AND NOT A SCREENSHOT. `.cm-art` is a fixed-width porthole that CLIPS a
// height-driven portrait, so "the photo is wider" is exactly "the porthole is wider" – and round-18
// #2 established that a strip which is not fixed becomes a function of the text's line count, which
// is the defect this whole treatment exists to prevent. Three numbers move together (strip 78, text
// column 90, row floor 132) and each is load-bearing for a different reason; this file holds them in
// one place so that moving one alone reddens.
//
// ⚠ MUTATION-VERIFIED – each applied alone against this file plus round18-coach and coach-edge-card
// (`|p|` is this file, `|18|` round18-coach.test.ts, `|e|` coach-edge-card.test.ts):
//
//   * `.cm-row.current .cm-art { width: 78px }` deleted – the shipped state before this item ->
//     |p| the wider-window test AND the paired-corridor test, |18| the two-width test, |e| §4 at
//     both widths. It is the whole item, so everything that measures the hired row goes;
//   * `.cm-row.current .cm-body { margin-left: 90px }` deleted, strip left at 78 – the obvious
//     half-fix -> |p| the paired-corridor test alone, |18| the 12px-of-air test, |e| §4. This is
//     the mutation that says the text column MOVED rather than the picture simply growing over it;
//   * `.cm-row.current { min-height: 132px }` deleted -> |p| the floor test and |18|'s row-floor
//     test, and NOTHING else. That separation is the point: the floor is invisible on every row
//     that ships and is a guarantee about the shortest one the layout can produce;
//   * `.cm-art img { height: auto; width: 100% }` – widening the picture by STRETCHING it, the
//     wrong reading of the owner's word -> |p| the no-stretch test, |18| the no-vertical-crop test;
//   * `.cm-row.current .cm-art { width: 96px }` with the floor left at 132 – a widening that
//     overruns what the portrait can supply -> |p| 3 of #1's 5, |18| 2, |e| §4 at both widths. The
//     one that matters is the FLOOR test: it fails on the inequality (a 132px row can only supply
//     79.8px of picture) and not on a literal, which is what makes it a real bound rather than a
//     restatement of two numbers. The others go because 96 is not 78 and the corridor moved;
//   * `chipsOf` losing its `.sort(...)`, i.e. the shipped ascending order -> |p| both #6 tests and
//     nothing in #1. ⚠ The counts test only earns its place because the fixture wins a DIFFERENT
//     number of titles in each of its three seasons: an earlier 1/2/1 fixture was a palindrome and
//     stayed green under this mutation, which made it a test of nothing.
import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { nextTick } from 'vue'
// ⚠ THE APP'S OWN SHEET. Every `.cm-*` rule lives in src/style.css, not in the SFC, so without this
// import every computed value below is the initial one and #1 would pass on the build it guards.
import '../../src/style.css'
import CoachMarketScreen from '../../src/components/screens/CoachMarketScreen.vue'
import TrophiesScreen from '../../src/components/screens/TrophiesScreen.vue'
import { useGameStore } from '../../src/stores/game'
import { createWorld, tickWeek, toSnapshot } from '../../src/engine/world'
import { rngFromSeed } from '../../src/engine/rng'
import { DEFAULT_PROFILE, type CoachTier, type Snapshot } from '../../src/shared/protocol'
import { TIER_LADDER } from '../../src/engine/season/calendar'
import { WEEKS_IN_SEASON } from '../../src/shared/dates'
import { before } from '../helpers/source'
import { PHONE, setViewport } from './fits'

// happy-dom has no `localStorage` on the window the component project builds, and the market's
// onboarding cue reads one at mount. Same shim as round18-coach.test.ts, and quoted there in full.
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

/** Refuses to run blind: a document with no stylesheet computes every property to its initial value,
 *  which would make "the strip is 78px" fail and "the strip is 62px" pass for the same wrong reason. */
function assertSheetPresent(): void {
  if (!document.head.querySelector('style')) {
    throw new Error('no stylesheet in the document – the component project needs `css: true`')
  }
}

/** px off a computed value; throws rather than returning NaN, because a property that computed to
 *  `''` means the rule never reached the element and NaN comparisons pass nothing and fail nothing. */
function px(value: string, what: string): number {
  const n = Number.parseFloat(value)
  if (!Number.isFinite(n)) throw new Error(`${what} computed to "${value}" – the rule did not reach the element`)
  return n
}

function careerSnapshot(coachTier: CoachTier, seed = `r21p-${coachTier}`): Snapshot {
  const world = createWorld(seed, { ...DEFAULT_PROFILE, coachTier })
  const rng = rngFromSeed(world.seed)
  for (let i = 0; i < 4; i++) tickWeek(world, rng)
  return toSnapshot(world)
}

/** ⚠ RE-AIMED BY P2-7 – THE WIDTH IS NAMED NOW, AND IT IS THE ONE #1 WAS MEASURED AT. This file took
 *  no viewport of its own and therefore read happy-dom's DEFAULT 1024, which round 36's second pass
 *  turned into a different band: the shop card's window is 70px past 768 and its floor 124 (the
 *  owner asked for the wider picture on tablet and desktop – tests/component/round18-coach.test.ts
 *  carries the ask, the ceiling and the arithmetic). Every number #1 asserts – 78/90/132 on the
 *  hired row, 62/74/104 on the others, and the 26% ratio between the two windows – is the phone's,
 *  is the owner's own from round 21, and is unchanged here. Only the width they are read at is now
 *  written down instead of inherited. The ≥768 band's counterpart of every one of these claims,
 *  including that the hired row still shows more of its man than the shop does, is the P2-7 block in
 *  round18-coach.test.ts. */
async function openCoaches(tier: CoachTier = 'middle') {
  setViewport(PHONE)
  const store = useGameStore()
  store.snapshot = careerSnapshot(tier)
  const wrapper = mount(CoachMarketScreen, {
    global: { stubs: { teleport: true } },
    attachTo: document.body,
  })
  const pill = wrapper.findAll('.tb-seg .tab-pill').find((b) => b.text() === 'Coaches')
  await pill!.trigger('click')
  await nextTick()
  const rows = wrapper.findAll('.cm-row')
  const current = rows.filter((r) => r.classes().includes('current'))
  const ordinary = rows.filter((r) => !r.classes().includes('current'))
  expect(current.length, 'the fixture has exactly one hired coach').toBe(1)
  expect(ordinary.length, 'and a list of coaches she could hire').toBeGreaterThan(0)
  return { wrapper, current: current[0], ordinary: ordinary[0] }
}

/** The portraits' own aspect ratio – 162x264 webp, and every one of the sixteen files is 162 wide
 *  (budget-2 alone is taller at 280, which makes it NARROWER for a given height, so this is the
 *  worst case). The same constant round-18 #2's floor was derived from. */
const PORTRAIT_W = 162
const PORTRAIT_H = 264

// =================================================================================================
// #1 – THE COACH SHE HAS GETS A WIDER WINDOW
// =================================================================================================
describe('round-21 #1 – the hired coach\'s photo is proportionally wider', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('the hired row\'s window is wider than an unhired one\'s, at the same height', async () => {
    assertSheetPresent()
    const { wrapper, current, ordinary } = await openCoaches()

    const hiredStrip = px(getComputedStyle(current.find('.cm-art').element).width, 'current .cm-art width')
    const otherStrip = px(getComputedStyle(ordinary.find('.cm-art').element).width, '.cm-art width')

    // THE OWNER'S CLAIM, stated as the comparison he made rather than as two literals. Both rows are
    // laid out to the same rule and the strip is `top: 0; bottom: 0` of the row, so at any given row
    // height the ratio of these two numbers IS the ratio of the two photos' aspect ratios.
    expect(hiredStrip, 'the hired row shows a wider slice of the portrait').toBeGreaterThan(otherStrip)
    expect(hiredStrip, 'and it is the 78 the floor below is derived from').toBe(78)
    expect(otherStrip, 'while every other row keeps round-18\'s 62').toBe(62)
    // 26% wider relative to the same height. Named so a future narrowing reads as what it is.
    expect(hiredStrip / otherStrip, 'the widening is a quarter, not a rounding').toBeGreaterThan(1.2)

    wrapper.unmount()
  })

  it('the text column narrows by exactly what the picture took, and the 12px corridor survives', async () => {
    assertSheetPresent()
    const { wrapper, current, ordinary } = await openCoaches()

    const read = (row: typeof current) => {
      const strip = px(getComputedStyle(row.find('.cm-art').element).width, '.cm-art width')
      const text = px(getComputedStyle(row.find('.cm-body').element).marginLeft, '.cm-body margin-left')
      return { strip, text, air: text - strip }
    }
    const hired = read(current)
    const other = read(ordinary)

    // «Текст при этом чуть уже станет» – and it narrows by the SAME 16px the picture gained, which is
    // what makes this a re-allocation rather than the picture growing over the words. Round-18 #2's
    // corridor is untouched on both rows, from two different pairs of numbers.
    expect(hired.text - other.text, 'the text column moved right by what the strip took').toBe(hired.strip - other.strip)
    expect(hired.air, 'the hired row still clears the portrait by 12px').toBe(12)
    expect(other.air, 'and so does every other row').toBe(12)
    // The band round-18 negotiated («10-15 пикселей»), restated so a drift in either rule trips here.
    for (const air of [hired.air, other.air]) {
      expect(air).toBeGreaterThanOrEqual(10)
      expect(air).toBeLessThanOrEqual(15)
    }

    wrapper.unmount()
  })

  it('the row floor pays for the wider window – the portrait is never narrower than its strip', async () => {
    assertSheetPresent()
    const { wrapper, current, ordinary } = await openCoaches()

    // THE INEQUALITY ROUND-18 #2 WROTE DOWN, now asked of both pairs. The mask reaches transparent at
    // the strip's right edge, so the clip is invisible only while the picture fills the strip; the
    // picture is height-driven, and `.cm-art` is `top: 0; bottom: 0` of the row's PADDING box, so the
    // narrowest picture the layout can produce is (floor - 2 borders) x 162/264 wide.
    for (const [label, row] of [['hired', current], ['unhired', ordinary]] as const) {
      const floor = px(getComputedStyle(row.element).minHeight, '.cm-row min-height')
      const strip = px(getComputedStyle(row.find('.cm-art').element).width, '.cm-art width')
      const narrowest = ((floor - 2) * PORTRAIT_W) / PORTRAIT_H
      expect(
        narrowest,
        `the ${label} row's ${floor}px floor still fills its ${strip}px strip (${narrowest.toFixed(2)} >= ${strip})`,
      ).toBeGreaterThanOrEqual(strip)
    }

    // ...and the hired row's floor really did move, which is the half a pure inequality cannot say:
    // leaving it at 104 would have made the 78px strip show background on the shortest row.
    const hiredFloor = px(getComputedStyle(current.element).minHeight, 'current .cm-row min-height')
    expect(hiredFloor, 'the hired row carries its own floor').toBe(132)
    expect(px(getComputedStyle(ordinary.element).minHeight, '.cm-row min-height'), 'the others keep 104').toBe(104)

    wrapper.unmount()
  })

  it('the picture is still sized by HEIGHT – wider window, never a stretched person', async () => {
    assertSheetPresent()
    const { wrapper, current } = await openCoaches()
    // The A2c/d ruling this treatment inherits, and the reading of the owner's word that this item
    // is NOT: «пропорционально шире» is a wider view of the same photograph, so the image keeps
    // `height: 100%; width: auto` and the strip does the widening by clipping less. Setting a width
    // on the image – the obvious way to make a picture wider – would distort a photo of a person,
    // and `object-fit: cover` would crop him vertically, which A2c/d forbids outright.
    const style = getComputedStyle(current.find('.cm-art img').element)
    expect(style.height, 'the image is sized by height').toBe('100%')
    expect(style.width, 'and takes whatever width that gives it').toBe('auto')
    expect(style.objectFit === '' || style.objectFit === 'fill', 'nothing crops it').toBe(true)
    wrapper.unmount()
  })

  it('at 375px the wider row still cannot overflow, and the text column still has room', async () => {
    assertSheetPresent()
    // ⚠ THE CHECK ROUND-20 #3 BOUGHT WITH A BLOCKED CAREER: a surface that grows one honest step at a
    // time is measured against a phone before it ships. This is the smaller sibling of that rule – a
    // row cannot trap the owner the way a dialog can, but 16px off a 375px text column is 16px off
    // the narrowest column in the app.
    const runner = window as unknown as { happyDOM?: { setViewport(v: { width: number; height: number }): void } }
    runner.happyDOM?.setViewport({ width: 375, height: 667 })
    Object.defineProperty(window, 'innerWidth', { value: 375, configurable: true })

    const { wrapper, current } = await openCoaches('elite')
    const row = current.element as HTMLElement
    const rowStyle = getComputedStyle(row)
    const bodyStyle = getComputedStyle(current.find('.cm-body').element)

    // THE STRUCTURAL HALF – why an overflow is impossible rather than merely absent today. The row
    // clips, and the text column may shrink below its content's intrinsic width. Both are needed:
    // `min-width: 0` alone would let a long name push the price column off, and `overflow: hidden`
    // alone would clip it silently.
    expect(rowStyle.overflow, 'the row clips rather than spilling').toContain('hidden')
    // `px()` rather than a string compare: the declared `min-width: 0` is unitless and this runner
    // hands it back as `"0"`, so `toBe('0px')` would be a test about happy-dom's serialiser.
    expect(px(bodyStyle.minWidth, '.cm-body min-width'), 'and the text column may shrink under its content').toBe(0)

    // THE ARITHMETIC HALF. The tier block is `.bare`, so the row's container at 375px is
    // 375 - 2 x --app-pad-x. What is left for the text after the borders, the row's right padding and
    // the picture's new column is the number the owner will actually read on his phone.
    const pad = px(getComputedStyle(document.documentElement).getPropertyValue('--app-pad-x') || '16px', '--app-pad-x')
    const container = 375 - 2 * pad
    const textColumn = container - 2 - px(rowStyle.paddingRight, '.cm-row padding-right') -
      px(bodyStyle.marginLeft, '.cm-body margin-left')
    // The price column ('$658 /wk' over 'Current') measures ~70px in the browser; 150 leaves the name
    // and the fit pill their line with that taken out, and the load note wraps freely below.
    expect(textColumn, `${textColumn}px of text column at 375px`).toBeGreaterThanOrEqual(150)

    wrapper.unmount()
  })
})

// =================================================================================================
// #6 – THE CABINET READS NEWEST FIRST
// =================================================================================================
describe('round-21 #6 – the trophy cabinet puts the most recent season first', () => {
  beforeEach(() => setActivePinia(createPinia()))

  /** A cabinet with titles spread over four seasons on one shelf. Built by writing the ledger the
   *  snapshot carries rather than by simulating years of tennis: the claim under test is the ORDER
   *  the screen prints a set of weeks in, and a Monte-Carlo career that happened to win in four
   *  distinct seasons would be a fixture nobody could reproduce. The weeks are pushed ASCENDING,
   *  which is how `finalizeTournament` builds it, so the fixture reproduces the real input exactly. */
  function cabinet(): Snapshot {
    const snap = careerSnapshot('middle', 'r21p-trophies')
    snap.trophiesByTier = {
      ...snap.trophiesByTier,
      // One title in the earliest season, two in the middle one, three in the latest – so the chip
      // COUNTS are 1/2/3 ascending and 3/2/1 descending. A fixture with the same tally in the first
      // and last season (1/2/1) reads identically either way round and would leave the counts test
      // green on the very mutation it exists for.
      [TIER_LADDER[0]]: {
        titles: [
          2 * WEEKS_IN_SEASON + 5,
          3 * WEEKS_IN_SEASON + 9,
          3 * WEEKS_IN_SEASON + 20,
          5 * WEEKS_IN_SEASON + 1,
          5 * WEEKS_IN_SEASON + 14,
          5 * WEEKS_IN_SEASON + 33,
        ],
        finals: [],
      },
    }
    return snap
  }

  function chipsOnScreen(): string[] {
    const store = useGameStore()
    store.snapshot = cabinet()
    const wrapper = mount(TrophiesScreen, { global: { stubs: { teleport: true } } })
    // Read the chips off the RENDERED screen rather than by calling `chipsOf`, which is a private
    // helper inside the SFC: the fold shows only the first `YEARS_SHOWN` of them, so "which years
    // does the parent SEE" is a question only the mounted cabinet can answer. Three fits under the
    // fold, which is deliberate – the item is about order, not about the `+N` chip.
    const chips = wrapper.findAll('*')
      .map((n) => n.text())
      .filter((t) => /^\d+x'\d\d$/.test(t))
    wrapper.unmount()
    return chips
  }

  it('the year chips descend – the live season first, the earliest last', () => {
    assertSheetPresent()
    const chips = chipsOnScreen()
    // Four titles over three distinct seasons, so three chips – and the ORDER is the whole item.
    expect(chips.length, 'three seasons produced three chips').toBe(3)
    const years = chips.map((c) => Number(c.slice(c.indexOf("'") + 1)))
    const descending = [...years].sort((a, b) => b - a)
    expect(years, `chips came out as ${chips.join(' ')}`).toEqual(descending)
    // Named separately so the shipped defect reads as itself rather than as "expected [a] to equal
    // [b]": ascending is exactly what the owner asked to be rid of, and a two-season cabinet would
    // satisfy "sorted" in either direction, which is why the fixture has three.
    expect(years, 'the old oldest-first order is gone').not.toEqual([...years].sort((a, b) => a - b))
  })

  it('the counts travel with their own year – reversing the order did not shuffle the tallies', () => {
    assertSheetPresent()
    const chips = chipsOnScreen()
    // The fixture wins 1 / 2 / 3 titles across its three seasons, oldest to newest, so newest-first
    // must read 3, 2, 1. This catches two different ways to get the item wrong: leaving the order
    // ascending, and reversing the wrong array so a count detaches from the year it belongs to.
    const counts = chips.map((c) => Number(before(c, 'x')))
    expect(counts, `chips came out as ${chips.join(' ')}`).toEqual([3, 2, 1])
  })
})
