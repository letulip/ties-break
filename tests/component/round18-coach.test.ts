// ⭐ ROUND-18 #1, #2 AND #3 – THE COACH SURFACES, AND WHY THEY GET A MOUNTED NET RATHER THAN A PIN.
//
// All three items are RE-REPORTS. #2 was reported twice (round-17 #14, then again on 12.08) and was
// twice "fixed" on the wrong screen: it was read as Home's coach card and Home's `.coach-body` was
// pushed 54 -> 66 -> 80, while the picker he was actually looking at was never touched. #1 undoes
// that. #3 is the one line that sent his tap on Home's coach note to the training dials instead of
// to the coaches.
//
// ⚠ HAPPY-DOM HAS NO LAYOUT, so nothing here calls `getBoundingClientRect` – it is zeros. What it
// reads is the CASCADE, through `getComputedStyle` on elements attached to the document, which is
// the layer all three defects live in. The header of tests/component/round17-surfaces.test.ts
// records why `attachTo: document.body` is mandatory for that (happy-dom applies no rule to a
// detached element, so a first draft that omitted it was green against a broken build).
//
// ⚠ THE NUMBERS BELOW WERE MEASURED IN A REAL BROWSER FIRST, at 320px and 375px, against the real
// 162x264 portraits, and this file is the arithmetic that survives into a runner with no layout
// engine. What the browser said:
//
//   HOME `.coach-body`, card 166px wide at 375px – the margin FEEDS the picture it is running from,
//   because the portrait is height-driven and the card's height is set by how many lines the quote
//   wraps to. 54 -> card 193px / portrait 117px. 66 -> 231 / 141. 80 -> 265 / 162. The text moved
//   26px right, the picture grew 45px to meet it, and the overlap was WORSE at 80 than at 54.
//
//   PICKER `.cm-row` BEFORE #2 – the portrait was a function of the load note: a one-line note gave
//   a 57.2px man, a three-line note a 74.6px one, against a text column pinned at 62px. So the tall
//   cards had 12.6px of the name and the fit pill sitting on his face. Pushing the margin to 80 at
//   320px made it 13.1px – worse – for the same feedback reason as Home.
//
//   PICKER AFTER #2 – strip 62px, text at 74px, 12.0px of air on all eight cards measured (hired /
//   available / blocked / one-line, at 320px and 375px). The strip has a WIDTH now, so it cannot
//   grow into the gap whatever the row does.
//
// ⚠ MUTATION-VERIFIED – seven mutations run, and this is what each one actually reddened:
//   * `.coach-body { margin-left: 80px }` (the shipped defect) -> the Home test, ALONE;
//   * `.cm-art` loses `width: 62px` -> the measured-gap test AND the row-floor test (both are
//     claims about a strip that has a width, so both should go, and nothing else does);
//   * `.cm-art` loses `overflow: hidden` -> the measured-gap test, alone;
//   * `.cm-body { margin-left: 62px }` (the shipped defect) -> the measured-gap test, alone;
//   * `.cm-art img { height: auto; width: 62px }` -> the no-vertical-crop test, alone;
//   * `.cm-row { min-height: 82px }` (the old floor) -> the row-floor test, alone;
//   * `const chosen = ref('week')`, i.e. the landing back to a constant -> the coach-hired landing
//     AND the does-not-fight-the-player test, while the SELF-COACHED landing stays green. That
//     asymmetry is the whole of #3: the old behaviour was never wrong for a self-coached career.
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { nextTick } from 'vue'
// ⚠ THE APP'S OWN SHEET. `.cm-row` / `.cm-art` / `.cm-body` live in src/style.css, not in the SFC;
// without this import every computed value below is the initial one and every assertion passes on a
// broken build. Home's `.coach-body` comes in with the component, from its own `<style scoped>`.
import '../../src/style.css'
import HomeScreen from '../../src/components/screens/HomeScreen.vue'
import CoachMarketScreen from '../../src/components/screens/CoachMarketScreen.vue'
import { useGameStore } from '../../src/stores/game'
import { createWorld, tickWeek, toSnapshot } from '../../src/engine/world'
import { rngFromSeed } from '../../src/engine/rng'
import { DEFAULT_PROFILE, type CoachTier, type Snapshot } from '../../src/shared/protocol'
import { PHONE, TABLET, setViewport } from './fits'

// ⚠ THIS RUNNER HAS NO localStorage AND HomeScreen READS IT AT SETUP (`tb:kidAvatarHintSeen`), so a
// mount throws before anything can be measured. The same shim tests/component/home-strip-and-mail.ts
// installs, and quoted there in full: the browser's own object is supplied rather than the component
// weakened to suit the runner.
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

/** Refuses to run blind, for `assertLegible`'s reason: a document with no stylesheet computes every
 *  property to its initial value, which would make "the text column starts at 54" pass on the exact
 *  build the owner was looking at. */
function assertSheetPresent(): void {
  if (!document.head.querySelector('style')) {
    throw new Error('no stylesheet in the document – the component project needs `css: true`')
  }
}

/** A real career through the real protocol, at the coach rung the test is about. `self` is the one
 *  tier `openingCoachId` answers `null` for, which is what makes it the self-coached case. */
function careerSnapshot(coachTier: CoachTier, seed = `r18-${coachTier}`): Snapshot {
  const world = createWorld(seed, { ...DEFAULT_PROFILE, coachTier })
  const rng = rngFromSeed(world.seed)
  for (let i = 0; i < 4; i++) tickWeek(world, rng)
  return toSnapshot(world)
}

/** px off a computed value. Throws rather than returning NaN: a property that computed to `''`
 *  means the rule never reached the element, and silently comparing NaN would pass nothing and fail
 *  nothing. */
function px(value: string, what: string): number {
  const n = Number.parseFloat(value)
  if (!Number.isFinite(n)) throw new Error(`${what} computed to "${value}" – the rule did not reach the element`)
  return n
}

// =================================================================================================
// #1 – HOME PUTS ITS TEXT COLUMN BACK WHERE THE EXPORT HAD IT
// =================================================================================================
describe('round-18 #1 – Home\'s coach note is back on the export\'s geometry', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('the text column starts 54px in, and 80 is a red test', () => {
    assertSheetPresent()
    const store = useGameStore()
    store.snapshot = careerSnapshot('middle', 'r18-home')
    const wrapper = mount(HomeScreen, {
      props: { recapFresh: false },
      global: { stubs: { teleport: true } },
      attachTo: document.body,
    })

    const body = wrapper.find('.coach-card .coach-body')
    expect(body.exists(), 'the coach note is on Home').toBe(true)
    const left = px(getComputedStyle(body.element).marginLeft, '.coach-body margin-left')

    // THE MEASURED CLAIM. 54 is the export's own strip width and the number the A2 ruling above the
    // rule describes; the card's padding is 0 (the strip has to reach all four edges), so this
    // margin IS the text column's left offset inside the card.
    expect(left, 'the text column starts at the export\'s 54px').toBe(54)
    // Named separately so a revert reads as what it is rather than as "expected 80 to be 54". Both
    // rounds of the misread landed on one of these two numbers.
    expect([66, 80], 'neither round of the misread is back').not.toContain(left)

    wrapper.unmount()
  })
})

// =================================================================================================
// #2 – THE PICKER'S TEXT BLOCK CLEARS THE PORTRAIT, AND CANNOT BE OVERTAKEN BY IT
// =================================================================================================
describe('round-18 #2 – the coach picker moves its text clear of the portrait', () => {
  beforeEach(() => setActivePinia(createPinia()))

  /** The picker, on the Coaches tab, with a coach hired – so the list carries a `current` card and
   *  ordinary hireable ones in the same mount. */
  function mountPicker(tier: CoachTier = 'middle') {
    const store = useGameStore()
    store.snapshot = careerSnapshot(tier)
    return mount(CoachMarketScreen, {
      global: { stubs: { teleport: true } },
      attachTo: document.body,
    })
  }

  async function openCoaches(wrapper: ReturnType<typeof mountPicker>) {
    const pill = wrapper.findAll('.tb-seg .tab-pill').find((b) => b.text() === 'Coaches')
    await pill!.trigger('click')
    await nextTick()
    return wrapper.findAll('.cm-row')
  }

  it('the text block clears the portrait by 12px on every card state that draws one', async () => {
    assertSheetPresent()
    const wrapper = mountPicker()
    const rows = await openCoaches(wrapper)
    expect(rows.length, 'the list drew cards to measure').toBeGreaterThan(3)

    // Every state the list can render a portrait in. The owner reported it on the cards he was
    // looking at; fixing only those is how #2 became a three-round item in the first place.
    const hired = rows.filter((r) => r.classes().includes('current'))
    const available = rows.filter((r) => !r.classes().includes('current') && !r.classes().includes('blocked'))
    const blocked = rows.filter((r) => r.classes().includes('blocked'))
    expect(hired.length, 'the fixture has somebody hired').toBe(1)
    expect(available.length, 'the fixture has hireable cards').toBeGreaterThan(0)
    expect(blocked.length, 'the fixture has a gated/over-budget card').toBeGreaterThan(0)

    for (const row of [...hired, ...available, ...blocked]) {
      const art = row.find('.cm-art')
      const body = row.find('.cm-body')
      expect(art.exists() && body.exists(), 'the card draws a portrait and a text block').toBe(true)

      // THE PORTRAIT'S RENDERED WIDTH IS BOUNDED. This is the load-bearing half: before #2 there was
      // no width here at all, the strip shrink-wrapped a height-driven image, and the picture's
      // width was therefore whatever the load note's line count made the row. A margin cannot clear
      // a portrait that grows when you push it.
      //
      // ⚠ RE-AIMED, ROUND-21 #1 – TWO WIDTHS NOW, AND THE CLAIM IS UNCHANGED. The owner asked for a
      // wider window on the coach she HAS («фото пропорционально шире … относительно высоты»), so
      // `.cm-row.current .cm-art` is 78px and every other row is still 62. What #2 was defending is
      // not the number 62: it is that the strip HAS a width of its own, a fixed one that the text's
      // line count cannot move. Both numbers are fixed, so both keep it. The expectation is written
      // as a per-kind lookup rather than widened to `toBeGreaterThan(0)` – a bound that loose would
      // pass on the shrink-wrapped defect this test exists to catch. The 78 and the current row's
      // 132px floor that pays for it are held together in round21-coach-photo.test.ts.
      const expectedStrip = row.classes().includes('current') ? 78 : 62
      const strip = px(getComputedStyle(art.element).width, '.cm-art width')
      expect(strip, 'the strip has a width of its own').toBe(expectedStrip)
      // ...and what does not fit inside it is CLIPPED, which is what makes that width the picture's
      // real right edge instead of an aspiration. The mask's stops are percentages of this same box,
      // so the fade reaches transparent exactly at the clip line and nothing visible is cut.
      expect(getComputedStyle(art.element).overflow, 'and it clips what does not fit').toContain('hidden')

      // THE MEASURED GAP, which is the owner's own ask: «10-15 пикселей, чтобы весь текстовый блок
      // на картинку не попадал». Measured against the STRIP – the picture's edge – not against the
      // mask's opaque stop, which is the mistake round-17 made on Home.
      const textLeft = px(getComputedStyle(body.element).marginLeft, '.cm-body margin-left')
      const air = textLeft - strip
      expect(air, `the text block clears the portrait (${textLeft} - ${strip})`).toBeGreaterThanOrEqual(10)
      expect(air, 'and does not walk off into the middle of the card').toBeLessThanOrEqual(15)
    }

    wrapper.unmount()
  })

  it('the portrait is still sized by HEIGHT – the strip is a horizontal clip, never a vertical crop', async () => {
    // The A2c/d ruling this treatment inherits: «the whole frame is on screen – no vertical crop,
    // which was the ask – and the card shows as much of its width as it has room for». Bounding the
    // strip spends the second half of that sentence, which the owner already granted; spending the
    // FIRST half (by switching the image to `object-fit: cover` at a fixed width, the obvious way to
    // pin a width) would break a ruling to fix a layout bug.
    assertSheetPresent()
    const wrapper = mountPicker()
    const rows = await openCoaches(wrapper)
    const img = rows[0].find('.cm-art img')
    expect(img.exists(), 'the card draws the portrait as an image').toBe(true)
    const style = getComputedStyle(img.element)
    expect(style.height, 'the image is sized by height').toBe('100%')
    expect(style.width, 'and takes whatever width that gives it').toBe('auto')
    wrapper.unmount()
  })

  it('the row floor keeps the clip invisible – the portrait is never narrower than its strip', async () => {
    // Why `min-height` is part of this fix and not tidy-up. The clip is invisible only while the
    // picture is at least as wide as the strip, because the mask goes transparent at the strip's
    // right edge. Height-driven at 162/264, the picture is >= 62px wide only while the row's padding
    // box is >= 101px. The floor states that, in the one place the geometry can be checked.
    //
    // ⚠ RE-AIMED, ROUND-21 #1 – THE ARITHMETIC IS NOW RUN PER ROW KIND rather than on `rows[0]`.
    // Two strips means two floors, and a single sample could not see the second one: the wider
    // 78px window on the current row buys its guarantee with a 132px floor of its own, and reading
    // one row would have checked whichever pair happened to be first. Same inequality, both pairs.
    assertSheetPresent()
    const wrapper = mountPicker()
    const rows = await openCoaches(wrapper)
    const current = rows.filter((r) => r.classes().includes('current'))
    const ordinary = rows.filter((r) => !r.classes().includes('current'))
    expect(current.length, 'the fixture has the hired row').toBe(1)
    expect(ordinary.length, 'and rows at the ordinary width').toBeGreaterThan(0)

    for (const row of [current[0], ordinary[0]]) {
      const floor = px(getComputedStyle(row.element).minHeight, '.cm-row min-height')
      const strip = px(getComputedStyle(row.find('.cm-art').element).width, '.cm-art width')
      const vpad = px(getComputedStyle(row.element).paddingTop, '.cm-row padding-top') +
        px(getComputedStyle(row.element).paddingBottom, '.cm-row padding-bottom')
      // `.cm-art` is `top: 0; bottom: 0` of the row's PADDING box, so the shortest picture the layout
      // can produce is (floor - borders) tall. 162/264 is the portraits' own aspect ratio, and every
      // one of the sixteen files is 162 wide (budget-2 is the only one taller, at 280, which makes it
      // NARROWER for a given height – so the aspect used here is the worst case).
      const shortestPortraitWidth = ((floor - 2) * 162) / 264
      expect(shortestPortraitWidth, `a ${floor}px row still fills the ${strip}px strip`).toBeGreaterThanOrEqual(strip)
      expect(vpad, 'the row still pads its text columns').toBeGreaterThan(0)
    }
    wrapper.unmount()
  })
})

// =================================================================================================
// #3 – THE SCREEN LANDS WHERE THE TAP WAS AIMED
// =================================================================================================
describe('round-18 #3 – the coach market opens on the tab the career asks for', () => {
  beforeEach(() => setActivePinia(createPinia()))

  function mountMarket(tier: CoachTier) {
    const store = useGameStore()
    store.snapshot = careerSnapshot(tier)
    return mount(CoachMarketScreen, { global: { stubs: { teleport: true } } })
  }

  /** The tab that is actually ON, read the way a screen reader reads it – `aria-pressed`, which the
   *  segmented row sets from the model. Reading the class would pass on a plate that looks right and
   *  announces nothing. */
  function activeTab(wrapper: ReturnType<typeof mountMarket>): string | undefined {
    return wrapper
      .findAll('.tb-seg .tab-pill')
      .find((p) => p.attributes('aria-pressed') === 'true')
      ?.text()
  }

  it('with a coach hired it opens on the coaches – the tap on his face lands on him', () => {
    const wrapper = mountMarket('middle')
    const store = useGameStore()
    expect(store.snapshot!.coachId, 'the fixture has a coach hired').not.toBeNull()

    expect(activeTab(wrapper), 'the coaches tab is the one that is on').toBe('Coaches')
    // And the tab is not just LIT: the list is what rendered.
    expect(wrapper.findAll('.cm-row').length, 'the coaches list is drawn').toBeGreaterThan(3)
    expect(wrapper.findAll('.hw-row').length, 'and the dials are not drawn behind it').toBe(0)
    wrapper.unmount()
  })

  it('self-coached it still opens on Her Week – there is nobody to look at', () => {
    const wrapper = mountMarket('self')
    const store = useGameStore()
    expect(store.snapshot!.coachId, 'the fixture has nobody hired').toBeNull()

    expect(activeTab(wrapper), 'Her Week is the right landing with no coach').toBe('Her week')
    expect(wrapper.findAll('.hw-row').length, 'the dials are drawn').toBe(5)
    expect(wrapper.findAll('.cm-row').length, 'and the market is not drawn behind them').toBe(0)
    wrapper.unmount()
  })

  it('and it never fights the player once they are on the screen', async () => {
    // The reason the landing is a fallback under a null-able choice rather than a `watch` writing
    // into a plain ref: a watcher would re-land the screen on every snapshot the worker pushes, so
    // ticking a week – or hiring somebody – would yank the tab out from under a player who is
    // reading it. Once either pill is pressed, the choice is theirs.
    const wrapper = mountMarket('middle')
    expect(activeTab(wrapper)).toBe('Coaches')

    const week = wrapper.findAll('.tb-seg .tab-pill').find((p) => p.text() === 'Her week')
    await week!.trigger('click')
    await nextTick()
    expect(activeTab(wrapper), 'the player moved to Her Week').toBe('Her week')

    // A fresh snapshot arrives (the worker's every tick does this) with the coach still hired.
    const store = useGameStore()
    store.snapshot = careerSnapshot('middle', 'r18-middle-later')
    await nextTick()
    expect(store.snapshot!.coachId).not.toBeNull()
    expect(activeTab(wrapper), 'and the screen left them there').toBe('Her week')
    wrapper.unmount()
  })
})

// ⭐⭐⭐ ROUND 36 PHASE 2 – THE MARKET IS TWO CARDS TO A ROW ON A TABLET, AND THE PORTRAIT IS NOT
// WIDER. The owner, on frame AJ: «4 карточки; картинка может быть шире, чем на мобиле, если
// влезает, тот же стиль, во всю высоту.»
//
// ⚠ BOTH HALVES ARE IN ONE PLACE ON PURPOSE. The layout claim (two to a row) and the refusal (the
// picture stays at 62px, because «если влезает» is a condition and it is not met at 362px) are one
// decision, recorded as D3 and D4 in docs/specs/responsive-decisions-2026-09.md. Splitting them
// across two files is how the refusal gets quietly reversed later by somebody reading only the
// layout half.
//
// ⚠ THE WIDTH IS SET BEFORE THE MOUNT – happy-dom evaluates a media query on an element's first
// computed-style read and caches it (see the note beside `TABLET` in fits.ts).
//
// MUTATION-VERIFIED, each applied alone:
//   * `.tier-block`'s `grid-template-columns` set to `1fr` -> the two-up arm, ALONE;
//   * `.tier-block .cm-row`'s `margin-bottom: 0` removed -> the gutter arm, ALONE;
//   * `.cm-art` widened to 78px inside the tablet block -> the portrait arm AND round-18 #2's own
//     two strip tests. ⭐ That third verdict is worth reading: those two tests take no viewport of
//     their own, so they measure at happy-dom's DEFAULT 1024 – which is inside this band. The
//     round-18 measurements have therefore been guarding the tablet since the day this ladder
//     landed, and a widening here could never have been quiet.
describe('round 36 phase 2 – the market is two to a row on a tablet, and the portrait is not wider', () => {
  beforeEach(() => setActivePinia(createPinia()))
  afterEach(() => setViewport(PHONE))

  function marketAt(vp: typeof PHONE) {
    setViewport(vp)
    useGameStore().snapshot = careerSnapshot('middle')
    return mount(CoachMarketScreen, { global: { stubs: { teleport: true } }, attachTo: document.body })
  }

  async function coachesAt(vp: typeof PHONE) {
    const wrapper = marketAt(vp)
    const pill = wrapper.findAll('.tb-seg .tab-pill').find((b) => b.text() === 'Coaches')
    await pill!.trigger('click')
    await nextTick()
    return wrapper
  }

  it('⭐ a tier lays its coaches in two columns, and the heading spans them both', async () => {
    assertSheetPresent()
    const wrapper = await coachesAt(TABLET)
    const tier = wrapper.find('.tier-block')
    expect(tier.exists(), 'the market drew a tier, or this measures nothing').toBe(true)
    const block = getComputedStyle(tier.element)
    expect(block.display, 'a tier is a grid on a tablet').toBe('grid')
    expect(block.gridTemplateColumns.replace(/\s+/g, ' '), 'two equal columns').toBe(
      'repeat(2, minmax(0, 1fr))',
    )
    // The tier's own heading is the row above the pair, never a cell beside a coach.
    expect(
      getComputedStyle(tier.find('.tier-head').element).gridColumn.replace(/\s+/g, ''),
      'the tier heading spans the row',
    ).toBe('1/-1')
    // ⚠ AND THE ROWS GIVE UP THEIR OWN MARGIN, or the grid's 8px gap and an 8px margin come to 16
    // between the lines and 8 between the columns – a grid that is visibly not a grid.
    const row = tier.find('.cm-row')
    expect(row.exists(), 'the tier drew a coach').toBe(true)
    expect(px(getComputedStyle(row.element).marginBottom, 'the row keeps a margin under the grid')).toBe(0)
    wrapper.unmount()
  })

  it('⚠ …and the portrait strip is the phone\'s 62px, because «если влезает» is not met', async () => {
    assertSheetPresent()
    const wrapper = await coachesAt(TABLET)
    // The ordinary card. `.cm-row.current` is the ONE row allowed a wider strip (78px) and that is
    // `coach-match-edge.md` §4's anti-shopping rule, not a width decision – so it is excluded here
    // and the rule that reserves it is left exactly as it was.
    const ordinary = wrapper.findAll('.cm-row').filter((r) => !r.classes().includes('current'))
    expect(ordinary.length, 'the fixture has hireable cards').toBeGreaterThan(0)
    for (const row of ordinary) {
      const art = row.find('.cm-art')
      expect(art.exists(), 'every card draws a portrait').toBe(true)
      expect(px(getComputedStyle(art.element).width, 'the strip at 768'), 'the tablet strip is the phone strip').toBe(62)
      // ...and the 12px of air past it, which is the pair round-18 #2 tied together: move one, move
      // the other. This is that pair, asked again at a width it had never been asked at.
      const gap = px(getComputedStyle(row.find('.cm-body').element).marginLeft, 'the text inset at 768') - 62
      expect(gap, 'the text still clears the portrait by 10-15px').toBeGreaterThanOrEqual(10)
      expect(gap, 'and not by more').toBeLessThanOrEqual(15)
    }
    wrapper.unmount()
  })

  it('⚠ and the phone is untouched – one card per row, same strip', async () => {
    assertSheetPresent()
    const wrapper = await coachesAt(PHONE)
    const tier = wrapper.find('.tier-block')
    const block = getComputedStyle(tier.element)
    expect(block.display === '' || block.display === 'block', 'a phone tier is not a grid').toBe(true)
    const row = tier.find('.cm-row')
    expect(px(getComputedStyle(row.element).marginBottom, 'the phone row stacks on its margin')).toBe(8)
    wrapper.unmount()
  })
})
