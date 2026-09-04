// ⭐⭐⭐ ROUND 36, HIS REVIEW OF THE BUILT WAVE – ITEMS 10 TO 16, MOUNTED.
//
// He looked at the seven shipped phases and came back with corrections; these are the shop's rows
// and the two money rooms. His words, item by item, are in docs/rounds/round-36-review.md and quoted
// in the rules they became – a .vue file and a template carry no Cyrillic, comments included
// (tests/template-copy-rules.test.ts), so the quotes live in script blocks and in the ledger.
//
// WHAT IS NOT IN THIS FILE, and where it is instead: items 10, 11 and the `paid` half of 12 and 13
// all MOVED an existing claim rather than adding one, so they are re-aimed in place inside
// `round35-shop.test.ts`, beside the round-35 arm they supersede. A new file asserting the new
// behaviour while the old file still asserted the old one is two tests disagreeing, which is worse
// than either.
//
// ⚠ THE ORDER IS ALWAYS `setViewport` -> mount -> read, and `attachTo: document.body` is mandatory:
// happy-dom evaluates a media query on the FIRST computed-style read and caches it, and it applies
// no rule at all to a detached tree. Both are phase 2's findings and both are written out beside
// `TABLET` in fits.ts.
//
// ⚠ MUTATION-VERIFIED – what each mutation reddened is written above each block, and the ones that
// did NOT bite are recorded in docs/rounds/round-36-review.md rather than quietly dropped.
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
// ⚠ A RUNNER-SIZED CEILING, and it is the same arithmetic `week-recap-kid-share.test.ts` writes out
// in full: the cases below mount real screens over careers walked by the real engine, and GitHub's
// 2-core runner is measured at 4-5x this machine on this suite. The five-season walk is hoisted out
// of its case (see `grown` below), so what is left inside one is a mount; 30s is far above that and
// can only fire on a genuine wedge. Measured here first: the un-hoisted version passed in 9.6s alone
// and timed out at the 5s default in a full run.
vi.setConfig({ testTimeout: 30_000 })
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import '../../src/style.css'
import MoneyScreen from '../../src/components/screens/MoneyScreen.vue'
import WeekRecapCard from '../../src/components/WeekRecapCard.vue'
import { useGameStore } from '../../src/stores/game'
import {
  buyAsset,
  closeTournament,
  createWorld,
  skipTournament,
  tickWeek,
  toSnapshot,
  type WorldState,
} from '../../src/engine/world'
import { rngFromSeed } from '../../src/engine/rng'
import type { Snapshot } from '../../src/shared/protocol'
import { DESKTOP, PHONE, TABLET, lengthPx, setViewport } from './fits'
import { shelfRow } from './shelf'

function assertSheetPresent(): void {
  if (!document.head.querySelector('style')) {
    throw new Error('no stylesheet in the document – the component project needs `css: true`')
  }
}

/** A real career, walked by the real engine – `shop-tab.test.ts`'s recipe, shared by every file
 *  that reaches the shelf. */
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

/** Rich enough that no rung is greyed for money alone. */
function rich(seed: string, weeks = 20): WorldState {
  const w = walk(seed, weeks)
  w.bestFinishByTier.wta250 = 3
  w.fundsCents = 60_000_000_00
  return w
}

async function mountMoney(snapshot: Snapshot) {
  useGameStore().snapshot = snapshot
  return mount(MoneyScreen, { attachTo: document.body, global: { stubs: { teleport: true } } })
}

async function mountShop(snapshot: Snapshot) {
  const wrapper = await mountMoney(snapshot)
  const tab = wrapper.findAll('button.tab-pill').find((n) => n.text().trim() === 'Shop')
  expect(tab, 'the Shop chapter').toBeTruthy()
  await tab!.trigger('click')
  return wrapper
}

/**
 * The box a rule declares, in px. happy-dom has no layout engine (fits.ts's own header), so every
 * number here is read out of the cascade rather than off a rendered rectangle.
 *
 * ⚠ IT FOLDS `calc(<n> * <length>)` AND NOTHING ELSE, which is the one form this wave adds:
 * `calc(2 * var(--app-pad-x))` – «two of the app's own gutter», said once instead of as a 32 that
 * cannot follow the token. happy-dom substitutes the variable and leaves the ARITHMETIC alone
 * (`calc(2 * 16px)`, measured), so the fold happens here rather than in `fits.ts`, which every other
 * measurement in the suite reads through. Same precedent and the same reason as
 * `round35-shop.test.ts`'s own `calcPx`, which folds `calc(<pct> + <length>)`.
 */
function px(value: string, base: number): number {
  const direct = lengthPx(value, base)
  if (Number.isFinite(direct)) return direct
  const m = /^calc\(\s*(-?[\d.]+)\s*\*\s*(-?[\d.]+)px\s*\)$/.exec(value.trim())
  return m ? Number(m[1]) * Number(m[2]) : NaN
}

// =================================================================================================
// 1. ITEMS 12 AND 13 – THE CONTROL STANDS IN THE CARD'S BOTTOM-RIGHT CORNER
// =================================================================================================
// «С купленной машины … кнопка buy/sell встает слева ближе к нижнему правому углу карточки», and the
// same sentence again for «В разделе Her Academy». One change on two families; `shopRowCornerAction`
// in MoneyScreen.vue carries both quotes and the reason it is a margin rather than an absolute box.
//
// MUTATION-VERIFIED: `margin-left: auto` deleted -> both family arms; the selector widened to every
// `.shop-stake-row .shop-action` -> the investment arm, which is what stops one item leaking onto a
// family he did not name.
describe('round 36 review #12 and #13 – the buy/sell control moves to the corner', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    document.body.innerHTML = ''
  })
  afterEach(() => setViewport(PHONE))

  /**
   * The owned rung's control, and the row it lives in.
   *
   * ⚠⚠ THE **LAST** CONTROL IN THE ROW, AND A MUTATION IS WHY. This helper read `find(...)` – the
   * FIRST match – and on an open holding that is «Add more», not «Sell». The rule under test is
   * `:last-child`, so the investment arm was measuring a button the rule can never touch: widening
   * the selector to every family left the whole file GREEN. A guard aimed at the wrong element is
   * the «four empty sets are equal» failure in miniature.
   */
  async function ownedAction(wrapper: Awaited<ReturnType<typeof mountShop>>, label: string) {
    const row = await shelfRow(wrapper, label)
    expect(row.find('.shop-row-owned').exists(), `${label} is owned`).toBe(true)
    const all = row.findAll('.shop-row-owned .shop-stake-row .shop-action')
    expect(all.length, `${label} carries its own control`).toBeGreaterThan(0)
    return { row, action: all[all.length - 1], actions: all }
  }

  it('⭐⭐ an owned car sends its control to the bottom-right corner', async () => {
    assertSheetPresent()
    setViewport(PHONE)
    const world = rich('r36r-12-car')
    buyAsset(world, 'car-sensible')
    const wrapper = await mountShop(toSnapshot(world))
    const { row, action } = await ownedAction(wrapper, 'The sensible estate')
    expect(row.classes(), 'the card is marked for the corner').toContain('shop-row--corner-action')
    expect(
      getComputedStyle(action.element).marginLeft,
      'the control is pushed to the right-hand end of its own row',
    ).toBe('auto')
    // ⚠ AND IT IS STILL IN THE FLOW, which is the half that keeps the card as tall as its words.
    // A pill lifted out of the flow into the corner would shorten the card and print itself over
    // the last sentence – see `shopRowCornerAction`'s note.
    expect(getComputedStyle(action.element).position, 'not lifted out of the flow').not.toBe('absolute')
    wrapper.unmount()
  })

  it('⭐⭐ …and so does an owned academy stage, by the same rule', async () => {
    assertSheetPresent()
    setViewport(PHONE)
    const world = rich('r36r-13-academy')
    buyAsset(world, 'academy-land')
    const wrapper = await mountShop(toSnapshot(world))
    const { row, action } = await ownedAction(wrapper, 'The land')
    expect(row.classes()).toContain('shop-row--corner-action')
    expect(getComputedStyle(action.element).marginLeft).toBe('auto')
    // ⚠ AND ITS `paid $N` IS GONE TOO – item 13's first clause, on the family item 12 is not about.
    expect(row.text(), 'the purchase price is off the academy card').not.toContain('paid $')
    expect(row.text(), 'and the gain that replaces it is still there').toContain('since you bought it')
    wrapper.unmount()
  })

  it('⚠ an investment holding is untouched – he named two families, not the shelf', async () => {
    // ⚠⚠ THE ROW IS SHARED, WHICH IS WHY THIS ARM EXISTS. An open holding puts a FIELD and «Add
    // more» in the same `.shop-stake-row`; a rule written as `justify-content: flex-end` on the row
    // would have moved that group too, on a family neither item mentions.
    assertSheetPresent()
    setViewport(PHONE)
    const world = rich('r36r-12-invest')
    buyAsset(world, 'deposit', 10_000_00)
    const wrapper = await mountShop(toSnapshot(world))
    const { row, action, actions } = await ownedAction(wrapper, 'A savings deposit')
    expect(row.classes(), 'not one of his two families').not.toContain('shop-row--corner-action')
    // ⚠ THE ONE THE RULE WOULD MOVE IS THE LAST, WHICH ON A HOLDING IS «Sell» AND NOT «Add more» –
    // the pair below names both, so the arm cannot drift back onto the wrong button.
    expect(actions.length, 'a holding carries two controls in one row').toBeGreaterThan(1)
    expect(action.text().trim(), 'and the last of them is the one the corner rule would take').toBe('Sell')
    expect(getComputedStyle(action.element).marginLeft, 'the control stays where it was').not.toBe('auto')
    expect(row.text(), 'and it still names what was paid').toContain('paid $')
    wrapper.unmount()
  })
})

// =================================================================================================
// 2. ITEM 14 – «ФОТОЧКУ НА HER OWN ACCOUNT МОЖНО СДЕЛАТЬ КРУПНЕЕ»
// =================================================================================================
// The photograph grows and the card does not: phase 3's D18 capped «Her own account» at 640 for a
// reading reason that still holds. The rule and its reasoning are on `.money-share-photo` in
// MoneyScreen.vue.
//
// MUTATION-VERIFIED: the media block deleted -> both wide arms, phone green; `--share-photo-h`
// dropped from the block (paper wider, window still 52) -> the height arm alone, which is the exact
// defect the custom property exists to make impossible.
describe('round 36 review #14 – her account’s photograph grows', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    document.body.innerHTML = ''
  })
  afterEach(() => setViewport(PHONE))

  /**
   * ⚠ THE RAMP HAS TO BE RUNNING for the strip to be on the screen at all – her eighteenth. The
   * fixture is walked to it rather than faked, which is round35-shop.test.ts's own recipe.
   *
   * ⚠⚠ AND IT IS WALKED **ONCE**, OUTSIDE THE CASES, WHICH IS `week-recap-kid-share.test.ts`'s own
   * lesson met again. Five seasons of real ticks is seconds of engine, and the first draft paid for
   * two of them INSIDE one case: it passed alone and TIMED OUT AT 5s in a full suite run under
   * contention – a red that is neither a defect nor a flake but a fixture in the wrong place. The
   * snapshot is read-only data, so one career serves every viewport.
   */
  let grownSnap: Snapshot | null = null
  function grown(): Snapshot {
    if (!grownSnap) {
      grownSnap = toSnapshot(rich('r36r-14-account', 52 * 5))
      expect(grownSnap.ageYears, 'the fixture is past the threshold birthday').toBeGreaterThanOrEqual(18)
    }
    return grownSnap
  }

  async function photoBox(vp: { width: number; height: number }) {
    setViewport(vp)
    const wrapper = await mountMoney(grown())
    const paper = document.querySelector('.money-share-photo')
    expect(paper, 'her account is on the screen').toBeTruthy()
    const img = paper!.querySelector('img')
    expect(img, 'with her photograph in it').toBeTruthy()
    // ⚠ THE WINDOW IS READ AS `min-height` AND NOT AS `height`, because `min-height` is what the
    // screen sets and `height` is what `Polaroid` writes inline. The used height is the larger of
    // the two – which is 52 on a phone, where no rule raises it, and 82 past 768.
    const imgCs = getComputedStyle(img!)
    const box = {
      paper: px(getComputedStyle(paper!).width, vp.width),
      window: Math.max(px(imgCs.height, vp.height) || 0, px(imgCs.minHeight, vp.height) || 0),
    }
    wrapper.unmount()
    return box
  }

  it('⭐⭐ the paper and the window both grow past 768, at the card’s own ratio', async () => {
    assertSheetPresent()
    const phone = await photoBox(PHONE)
    const tablet = await photoBox(TABLET)
    expect(phone, 'the phone keeps round 35’s figures').toEqual({ paper: 66, window: 52 })
    expect(tablet.paper, 'the paper is bigger on a tablet').toBeGreaterThan(phone.paper)
    // ⚠⚠ THE WINDOW IS THE ARM THAT MATTERS. `Polaroid` writes the photo's height as an INLINE
    // style, which beats any rule in the screen's sheet – so a media query that widened the paper
    // alone would leave a 52px photograph floating in a bigger frame and look like the item working.
    expect(tablet.window, 'and so is the photograph inside it').toBeGreaterThan(phone.window)
    expect(
      tablet.paper / tablet.window,
      'the mockup’s own 66:52 – a bigger polaroid, not a differently shaped one',
    ).toBeCloseTo(phone.paper / phone.window, 2)
  })

  it('⭐ …and the card itself does not grow with it – D18’s cap is untouched', async () => {
    assertSheetPresent()
    setViewport(DESKTOP)
    const wrapper = await mountMoney(grown())
    expect(
      getComputedStyle(document.querySelector('.money-share')!).maxWidth,
      'phase 3’s reading width, unmoved',
    ).toBe('640px')
    wrapper.unmount()
  })
})

// =================================================================================================
// 3. ITEM 15 – THE SPENDING CHAPTER'S RIGHT SECTOR GETS AIR ON BOTH SIDES
// =================================================================================================
// «В разделе Spending всему правому сектору с запиской, фото и пайчартом дать больше воздуха слева и
// справа - там есть достаточно места». The air is the app's own gutter twice, on each side; the
// reasoning is on `.money-artefacts` in MoneyScreen.vue.
//
// MUTATION-VERIFIED: the media block deleted -> both wide arms, phone green; the `margin-right`
// dropped and the gap left -> the right-hand arm alone, which is the half his sentence would lose.
describe('round 36 review #15 – the artefact column gets air', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    document.body.innerHTML = ''
  })
  afterEach(() => setViewport(PHONE))

  async function air(vp: { width: number; height: number }, seed: string) {
    setViewport(vp)
    const wrapper = await mountMoney(toSnapshot(rich(seed)))
    const body = document.querySelector('.money-body')
    const sector = document.querySelector('.money-artefacts')
    expect(body, 'the Spending chapter is the one the screen opens on').toBeTruthy()
    expect(sector, 'and the artefact column is beside the figures').toBeTruthy()
    const cs = getComputedStyle(body!)
    const out = {
      // ⚠ `gap` AND NOT `columnGap`: happy-dom does not expand the shorthand into its longhands
      // (measured), so a reader that asked for `columnGap` first would get the empty string.
      left: px(cs.gap || cs.columnGap, vp.width),
      right: px(getComputedStyle(sector!).marginRight || '0px', vp.width),
      width: px(getComputedStyle(sector!).width, vp.width),
    }
    wrapper.unmount()
    return out
  }

  it('⭐⭐ the same air on the left and on the right, from 768 up', async () => {
    assertSheetPresent()
    const tablet = await air(TABLET, 'r36r-15-tablet')
    expect(tablet.left, 'air between the figures and the paper').toBe(32)
    expect(tablet.right, 'and the same again before the column’s edge').toBe(32)
    expect(tablet.left, 'symmetric, because he named both sides in one breath').toBe(tablet.right)
    const desktop = await air(DESKTOP, 'r36r-15-desktop')
    expect(desktop.left, 'and it carries to the desktop').toBe(32)
    expect(desktop.right).toBe(32)
    // ⚠ THE SECTOR ITSELF DOES NOT GROW. He asked for air around the paper, not for a bigger paper,
    // and 146 is the shared measure of the receipt, the polaroid and the donut.
    expect(desktop.width, 'the artefacts keep their own width').toBe(146)
  })

  it('⚠ …and the phone is untouched, where his premise does not hold', async () => {
    assertSheetPresent()
    const phone = await air(PHONE, 'r36r-15-phone')
    expect(phone.left, 'the 8px the phone shipped with').toBe(8)
    expect(phone.right, 'and no margin at all').toBe(0)
  })
})

// =================================================================================================
// 4. ITEM 16 – THE WEEK'S STORY BECOMES A BAND WITH A NOTE BESIDE IT
// =================================================================================================
// Three moves in one sentence – the taped note narrows to 50-60%, the picture becomes square with
// dark ground beside it, and the top note moves into the space that frees. The quote and the whole
// argument are in `WeekRecapCard.vue`'s style block.
//
// MUTATION-VERIFIED: the whole 768 block deleted -> the three wide arms, phone green;
// `grid-column: 2` -> `1` on the note -> the «beside, not under» arm alone; `width: var(--recap-art-h)`
// dropped from the image -> the square arm alone; `width: 55%` -> `100%` on the goal -> the taped
// note's arm alone.
describe('round 36 review #16 – the week’s story past 768', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    document.body.innerHTML = ''
  })
  afterEach(() => setViewport(PHONE))

  /** A week with a story on it – the recap draws its painting on every week, and the handwritten
   *  scrap on every week the diary has a line for, which is what the note arms need. */
  function story(seed: string): Snapshot {
    return toSnapshot(walk(seed, 12))
  }

  async function mountRecap(vp: { width: number; height: number }, seed: string) {
    setViewport(vp)
    useGameStore().snapshot = story(seed)
    const wrapper = mount(WeekRecapCard, {
      attachTo: document.body,
      global: { stubs: { teleport: true } },
    })
    expect(document.querySelector('.recap-art'), 'the week’s painting is on the card').toBeTruthy()
    return wrapper
  }

  it('⭐⭐ the picture is square and the rest of the band is dark ground', async () => {
    assertSheetPresent()
    const wrapper = await mountRecap(TABLET, 'r36r-16-square')
    const art = document.querySelector('.recap-art')!
    const cs = getComputedStyle(art)
    // ⭐ THE BAND KEEPS D's HEIGHT AND PHASE 2's WIDTH – the card is not one pixel taller for this.
    expect(cs.width, 'the block still spans the column').toBe('100%')
    expect(px(cs.maxHeight, TABLET.height), 'and still stops at D’s 286').toBe(286)
    // ⚠ THE TOKEN'S OWN VALUE, not a colour typed here: `--card-bottom` is the ground every photo
    // card in the app already stands on, so «справа темный фон» borrows a dark rather than adding one.
    expect(cs.background.toLowerCase(), 'dark ground behind the picture').toContain('#121a22')
    // ⚠ THE PICTURE IS AS WIDE AS THE BAND IS TALL, which is «square» said in one declaration and
    // read off the SAME custom property the cap above reads.
    const img = getComputedStyle(art.querySelector('img')!)
    expect(px(img.width, TABLET.width), 'the window is 286 wide against a 286 band').toBe(286)
    expect(img.height, 'and full height of it, so it is square by arithmetic').toBe('100%')
    expect(img.objectFit, 'cropped sideways on the narrower window, never top or bottom').toBe('cover')
    wrapper.unmount()
  })

  it('⭐⭐ the top note stands BESIDE the picture, in the space that frees', async () => {
    assertSheetPresent()
    const wrapper = await mountRecap(TABLET, 'r36r-16-note')
    const note = document.querySelector('.recap-note')
    expect(note, 'the week’s handwritten scrap is on this card').toBeTruthy()
    const card = getComputedStyle(document.querySelector('.recap-card')!)
    expect(card.display, 'the card lays the two out itself').toBe('grid')
    expect(
      card.gridTemplateColumns.replace(/\s+/g, ' '),
      'the first column is the band’s own height, so the picture is square in it',
    ).toBe('286px minmax(0, 1fr)')
    const cs = getComputedStyle(note!)
    expect(cs.gridColumn, 'the note takes the second column').toBe('2')
    expect(cs.gridRow, 'in the picture’s own row').toBe('1')
    // ⚠ AND IT STOPS RIDING THE PICTURE – the -34px lift is the one declaration it gives up, and
    // beside the painting it would have hung the scrap out of the top of the card.
    expect(px(cs.marginTop, TABLET.height), 'no lift over the painting any more').toBe(0)
    // ⭐ THE PAPER ITSELF IS UNTOUCHED, which is «квадратиком неправильной формы»: the torn cut, the
    // ruling and the tilt are `PaperNote`'s and no rule here reaches into them.
    expect(note!.querySelector('.tb-paper'), 'still a sheet of PaperNote’s own paper').toBeTruthy()
    wrapper.unmount()
  })

  it('⭐⭐ the taped note at the foot narrows into the 50-60% band he gave', async () => {
    assertSheetPresent()
    const wrapper = await mountRecap(TABLET, 'r36r-16-goal')
    const goal = document.querySelector('.recap-goal')
    expect(goal, 'the Next goal scrap is on the card').toBeTruthy()
    const share = px(getComputedStyle(goal!).width, TABLET.width) / TABLET.width
    expect(share, `the scrap takes ${(share * 100).toFixed(0)}% of the width`).toBeGreaterThanOrEqual(0.5)
    expect(share).toBeLessThanOrEqual(0.6)
    wrapper.unmount()
  })

  it('⚠ …and a phone keeps every one of the three exactly as it shipped', async () => {
    assertSheetPresent()
    const wrapper = await mountRecap(PHONE, 'r36r-16-phone')
    expect(getComputedStyle(document.querySelector('.recap-card')!).display, 'no grid below 768').not.toBe(
      'grid',
    )
    const note = document.querySelector('.recap-note')
    if (note) {
      expect(
        px(getComputedStyle(note).marginTop, PHONE.height),
        'the scrap still rides up over the painting',
      ).toBe(-34)
    }
    const goal = document.querySelector('.recap-goal')!
    expect(getComputedStyle(goal).width, 'and the taped note is still the column’s width').not.toBe('55%')
    wrapper.unmount()
  })
})
