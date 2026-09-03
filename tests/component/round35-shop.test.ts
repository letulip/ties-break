// ⭐⭐ ROUND 35, THE SHOP – his design pass over the whole shelf, mounted.
//
// ⚠ THE HOUSE RULE THIS FILE IS WRITTEN UNDER (`shop-tab.test.ts`'s header, and round20-ui's before
// it): mount the real SFC against a REAL snapshot built by the real engine, never a hand-written
// snapshot shape, and never a source pin for a rendering claim. He reports from a running build, so
// a grep for a class name proves nothing about what the screen draws.
//
// WHAT THIS FILE HOLDS, by his own numbering (docs/rounds/round-35-shop.md):
//   #3  the shop has a HOME: the shelf plate, six category cards IN HIS ORDER, her account with a
//       photograph – and the cards are TALL, which is the one shape he specified twice;
//   #5  the cars carry a painting on the LEFT at 40% of the card, and the buy control sits under
//       the price rather than beside it;
//   #6  the academy's four stages are four cards on the cars' principle;
//   #7  property takes the painting on the RIGHT with the control ON it, and an owned house's
//       «Worth now» row carries the current price with the purchase price gone;
//   #8  the water ladder swapped its two bottom identities and not one of its four prices;
//   #9  a second LIVE aeroplane, at $7,000,000, under the one there was;
//   #10 the in-page switcher is untouched – six segments, his six words, his order.
//
// ⚠⚠ AND THE LADDERS ARE READ OUT OF `ECONOMY`, NOT OFF THE SCREEN, in the arms that pin prices.
// A screen test that reads its own expectation off the catalogue proves nothing about the numbers;
// these arms quote the figures as literals so a later retune has to come through this file.
import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import MoneyScreen from '../../src/components/screens/MoneyScreen.vue'
import '../../src/style.css'
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
import type { ShopItem } from '../../src/engine/world/assets'
import { ECONOMY } from '../../src/engine/economy'
import { SHELF_CATEGORY_KEYS, shelfArtUrl } from '../../src/art/shelf'
import { rngFromSeed } from '../../src/engine/rng'
import type { Snapshot } from '../../src/shared/protocol'
import { aspectHeightPx, demandedWidth, lengthPx, setViewport, PHONE } from './fits'
import { SHELF_TAB_LABELS, openShelfTab, shelfRow } from './shelf'

/** A real career, walked by the real engine – `shop-tab.test.ts`'s own recipe. */
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

/** A career that can see the whole shelf: professional, and rich enough that no row is greyed for
 *  money alone. The wallet is set rather than earned – no bench career reaches $60M, and what is
 *  under test is the drawing. */
function rich(seed: string, weeks = 20): WorldState {
  const w = walk(seed, weeks)
  w.bestFinishByTier.wta250 = 3
  w.fundsCents = 60_000_000_00
  return w
}

async function mountShop(snapshot: Snapshot, attach = false) {
  useGameStore().snapshot = snapshot
  // ⚠ `attachTo: document.body` FOR THE MEASURED CASES ONLY, and `fits.ts` says why: a detached tree
  // gets none of the real cascade, so a fit measured off it would be vacuous rather than wrong.
  const wrapper = mount(MoneyScreen, {
    global: { stubs: { teleport: true } },
    ...(attach ? { attachTo: document.body } : {}),
  })
  const tab = wrapper.findAll('button.tab-pill').find((n) => n.text().trim() === 'Shop')
  expect(tab, 'the Shop tab control').toBeTruthy()
  await tab!.trigger('click')
  return wrapper
}

/** ⚠ `lengthPx` FOLDS `calc(<a>px ± <b>px)` AND NOTHING ELSE, and the framed row's inset is
 *  `calc(40% + 12px)` – a percentage plus a length, which is the shape that says «past the painting,
 *  plus the card's own gutter» in ONE declaration rather than in two that could drift. So this file
 *  resolves that one form locally rather than widening `fits.ts`'s parser, which every other
 *  measurement in the suite reads through. ⚠ `fits.ts` itself scores this padding as 0, which is the
 *  under-counting direction its header commits to – a floor, never a ceiling. */
function calcPx(value: string, base: number): number {
  const direct = lengthPx(value, base)
  if (Number.isFinite(direct)) return direct
  const m = /^calc\(\s*(-?[\d.]+)%\s*([+-])\s*(-?[\d.]+)px\s*\)$/.exec(value.trim())
  if (!m) return NaN
  const pct = (Number(m[1]) / 100) * base
  return m[2] === '+' ? pct + Number(m[3]) : pct - Number(m[3])
}

/** The room a card on this screen really has at a viewport, read off its own box the way
 *  `round30-brand-naming-screen.test.ts` reads it. */
function roomInside(el: Element, vp = PHONE): number {
  const cs = getComputedStyle(el)
  return (
    vp.width -
    (lengthPx(cs.paddingLeft, vp.width) || 0) -
    (lengthPx(cs.paddingRight, vp.width) || 0) -
    (lengthPx(cs.borderLeftWidth, vp.width) || 0) -
    (lengthPx(cs.borderRightWidth, vp.width) || 0)
  )
}

beforeEach(() => {
  setActivePinia(createPinia())
})

// =================================================================================================
describe('#3 – the shop has a front door', () => {
// =================================================================================================
  it('⭐⭐ six category cards, in HIS order and not the mockup\'s', async () => {
    // ⚠⚠ THE ORDER IS THE ASSERTION. Frame V of his handoff draws Invest / Cars / Property on the
    // first row; his message asks for «первый ряд invest, business, property, остальное 2й ряд» –
    // the three that earn, then the three that spend – and where his words and his mockup differ,
    // his words win (his own instruction: «есть нюансы, делаем не точно так»). A card grid rebuilt
    // from the frame would pass every other arm in this file and fail this one.
    const wrapper = await mountShop(toSnapshot(rich('r35-3-order')))
    const tiles = wrapper.findAll('.shelf-cat')
    expect(tiles.map((t) => t.text().trim())).toEqual([
      'Invest',
      'Business',
      'Property',
      'Cars',
      'Water',
      'Air',
    ])
    // ...and the six words are the SWITCHER's own, which is what makes them safe from drifting:
    // `MoneyScreen.vue` reads a tile's name out of `SHELF_TAB_OPTIONS`. Same six labels, and only
    // the ORDER differs – so this pair of assertions fails in both useful directions.
    expect([...tiles.map((t) => t.text().trim())].sort()).toEqual([...SHELF_TAB_LABELS].sort())
    expect(SHELF_CATEGORY_KEYS, 'and the art module holds the same order').toEqual([
      'invest',
      'business',
      'property',
      'cars',
      'water',
      'air',
    ])
    wrapper.unmount()
  })

  it('⭐⭐ the cards are TALL, at the ratio of the paintings on them', async () => {
    // ⭐ «давай на главной магазина вот эти 6 основых карточек сделаем не квадратными, как в макете,
    // а высокими (смотри соотношение сторон картинок)». His six category tiles are 332x512 – 0.6484
    // – against every item tile's 512x512. So the assertion is not «taller than wide», it is THIS
    // ratio: a card built square, or at some other portrait ratio, is the thing that must go red.
    setViewport(PHONE)
    const wrapper = await mountShop(toSnapshot(rich('r35-3-tall')), true)
    const tile = wrapper.find('.shelf-cat').element
    const cs = getComputedStyle(tile)
    const ratio = aspectHeightPx(cs.aspectRatio ?? '', 100)
    expect(Number.isFinite(ratio), 'the tile is sized by a ratio at all').toBe(true)
    // `aspectHeightPx` returns the HEIGHT for a width of 100, so 512/332 x 100 = 154.2.
    expect(ratio).toBeCloseTo((512 / 332) * 100, 1)
    expect(ratio, 'portrait, never square').toBeGreaterThan(100)

    // ⭐ AND THE NAME IS AT THE FOOT, IN THE HEADING FACE – «название категории встает на карточку
    // внизу шрифтом Sora». `--font-heading` IS Sora (src/style.css: «Sora on every heading»), so
    // this reads the resolved stack rather than a class name.
    const name = wrapper.find('.shelf-cat-name').element
    const ncs = getComputedStyle(name)
    expect(ncs.fontFamily.toLowerCase(), 'the category name is set in Sora').toContain('sora')
    expect(ncs.position, 'and it stands on the card').toBe('absolute')
    expect(lengthPx(ncs.bottom, 0), 'at its foot').toBeGreaterThanOrEqual(0)
    // ⚠ happy-dom reports an unset offset as the empty string rather than as `auto`, so the claim is
    // «no top offset was declared» rather than a spelling of it.
    expect(['', 'auto'], 'and never at its head').toContain(ncs.top)
    wrapper.unmount()
  })

  it('⭐ every one of the six carries its own painting', async () => {
    const wrapper = await mountShop(toSnapshot(rich('r35-3-art')))
    const srcs = wrapper.findAll('.shelf-cat-art').map((n) => n.attributes('src'))
    expect(srcs).toHaveLength(6)
    expect(new Set(srcs).size, 'six different paintings, not one repeated').toBe(6)
    for (const key of SHELF_CATEGORY_KEYS) {
      const url = shelfArtUrl(key)
      expect(url, `${key} has a painting`).toBeTruthy()
      expect(srcs, `${key}'s painting is the one on the card`).toContain(url!)
    }
    wrapper.unmount()
  })

  it('⭐⭐ the six fit across a 375px phone with room to spare', async () => {
    // ⚠ THE ONE MEASUREMENT ROUND-20 #3 ASKS FOR ON THIS SCREEN, at the viewport it names. happy-dom
    // does no layout, so the grid is measured the way `fits.ts` measures everything: off the real
    // cascade. Three columns and two gaps out of the room the grid's own parent leaves.
    setViewport(PHONE)
    const wrapper = await mountShop(toSnapshot(rich('r35-3-fits')), true)
    const grid = wrapper.find('.shelf-cats').element
    const gcs = getComputedStyle(grid)
    expect(gcs.display, 'it really is a grid').toBe('grid')
    expect(gcs.gridTemplateColumns, 'three across').toBe('repeat(3, 1fr)')

    const room = roomInside(grid.parentElement!)
    expect(room, 'the column has room to measure against').toBeGreaterThan(0)
    const gap = lengthPx(gcs.columnGap || gcs.gap, room) || 0
    expect(gap, 'the tiles are not flush against each other').toBeGreaterThan(0)
    const cardWidth = (room - gap * 2) / 3
    const cardHeight = aspectHeightPx(getComputedStyle(wrapper.find('.shelf-cat').element).aspectRatio ?? '', cardWidth)
    // Two rows of them, plus the gap between the rows, has to be a real box on a real phone – and
    // has to leave the screen scrollable rather than demanding more than a phone is tall. 667 is the
    // viewport; the grid is one block among several on a scrolling page, so the honest bound is that
    // the GRID alone is comfortably under it.
    expect(cardWidth, 'a tile is wide enough to press').toBeGreaterThan(44)
    expect(cardHeight * 2 + gap, `two rows of ${cardHeight.toFixed(1)}px at 375x667`).toBeLessThan(PHONE.height * 0.6)
    wrapper.unmount()
  })

  it('⭐ her account, with her photograph, on the home AND on a category page', async () => {
    // «ниже her account с фоточкой как в макете (а также на каждой странице магазина)». The strip
    // itself is round 26 #5b's and is not re-worded here; what round 35 added is the picture, and
    // the «every shop page» half is satisfied by the block sitting outside every tab guard.
    // ⚠ THE RAMP HAS TO BE RUNNING for the strip to exist at all, which is her eighteenth – so the
    // fixture is walked to it rather than faked.
    const world = rich('r35-3-account', 52 * 5)
    const snap = toSnapshot(world)
    expect(snap.ageYears, 'the fixture is past the threshold birthday').toBeGreaterThanOrEqual(18)
    const wrapper = await mountShop(snap)

    const onHome = wrapper.find('.money-share')
    expect(onHome.exists(), 'her account is on the shop home').toBe(true)
    expect(onHome.find('.money-share-photo').exists(), 'and it carries her photograph').toBe(true)
    const photo = onHome.find('.money-share-photo img').attributes('src')
    expect(photo, 'a real crop, not a placeholder').toMatch(/avatars\/.*\.webp$/)
    // ⚠ AND THE TWO SENTENCES ROUND 26 #5b SHIPPED ARE UNTOUCHED – the element changed from `p` to
    // `div` so a polaroid could live in it, and nothing else did.
    expect(onHome.text()).toContain('split before it reaches this account')
    expect(onHome.attributes('role')).toBe('note')

    await openShelfTab(wrapper, 'Water')
    const onPage = wrapper.find('.money-share')
    expect(onPage.exists(), 'and on a category page too').toBe(true)
    expect(onPage.find('.money-share-photo').exists(), 'with the photograph there as well').toBe(true)
    wrapper.unmount()
  })

  it('⭐⭐ the way back out of a category is real, and a category page is not a trap', async () => {
    // ⚠⚠ THE FAILURE THIS ARM EXISTS FOR IS ROUND-20 #3's FAMILY: a level you can enter and not
    // leave. A two-level shop is the first place in this app where that is even possible, and
    // «press the chapter tab again» is not a way out a player can find. So the control is pressed
    // here the way a player presses it, and the home has to come back whole - the plate AND the six
    // cards, not one of the two.
    const wrapper = await mountShop(toSnapshot(rich('r35-3-back')))
    await openShelfTab(wrapper, 'Water')
    expect(wrapper.find('.shelf-feed').exists(), 'a category really is open').toBe(true)
    const back = wrapper.find('.shelf-back')
    expect(back.exists(), 'there is a way back on a category page').toBe(true)
    expect(back.attributes('aria-label'), 'and it says where it goes').toBeTruthy()
    await back.trigger('click')
    expect(wrapper.find('.shelf-cats').exists(), 'the six cards are back').toBe(true)
    expect(wrapper.find('.money-shop').exists(), 'and so is the plate').toBe(true)
    expect(wrapper.find('.shelf-feed').exists(), 'and the rungs are gone again').toBe(false)
    // ⚠ AND THE HOME ITSELF CARRIES NO BACK CONTROL - it is not a level, it is the shop.
    expect(wrapper.find('.shelf-back').exists(), 'nothing to go back from on the home').toBe(false)
    wrapper.unmount()
  })

  it('⚠ the mockup\'s big hero image is NOT built', async () => {
    // «большой картинки делать не будем пока что» – an explicit NOT, and the only way to hold a
    // «we did not build that» is to assert its absence. Frame V's hub art is a full-width plate
    // above the manifest card; nothing on the home may be a bleed-behind-the-words hero.
    const wrapper = await mountShop(toSnapshot(rich('r35-3-no-hero')))
    expect(wrapper.find('.shop-hero').exists()).toBe(false)
    expect(wrapper.find('.money-shop .card-art').exists(), 'no painting on the shelf plate').toBe(false)
    wrapper.unmount()
  })
})

// =================================================================================================
describe('#5-#9 – the framed rows', () => {
// =================================================================================================
  /** The proportion he gave when the width was asked about: «Текст и темный фон займут 60%
   *  (примерно), остальное картинка». His own frame AA gives the yacht cards 37%; 40 is «почти как
   *  в макете» with the text on the round number he named. */
  const ART_SHARE = 40

  async function framed(wrapper: Awaited<ReturnType<typeof mountShop>>, label: string) {
    const row = await shelfRow(wrapper, label)
    const art = row.find('.shop-row-art')
    expect(art.exists(), `${label} has a painting`).toBe(true)
    return { row, art }
  }

  it('⭐⭐ #5 – a car takes the painting on the LEFT, at 40% of the card, full height', async () => {
    // ⚠⚠ THE SIDE IS HIS AND IT IS THE COACH CARDS' SIDE. «картинки будут квадратными на всю высоту
    // карточки с небольшим градиентом справа (как на тренерах)» – `.cm-art` is at `left: 0` under a
    // 90deg mask that fades out at its RIGHT edge, so «gradient on the right» is a painting on the
    // LEFT, and frame X of his handoff puts the car photo on the left too. The reasoning and the
    // disagreement it settles are on `SHELF_ART_SIDE` in MoneyScreen.vue.
    setViewport(PHONE)
    const wrapper = await mountShop(toSnapshot(rich('r35-5-cars')), true)
    const { row, art } = await framed(wrapper, 'The sensible estate')
    expect(row.classes(), 'the car is a left-framed row').toContain('shop-row--art-left')

    const cs = getComputedStyle(art.element)
    expect(cs.position, 'the band is out of flow, so the WORDS set the height').toBe('absolute')
    expect(cs.left, 'and it stands on the left edge').toBe('0px')
    expect(cs.top).toBe('0px')
    expect(cs.bottom, 'full height of the card').toBe('0px')

    // ⭐ 40% OF THE WIDTH, AND 60% FOR THE WORDS – the two halves of his sentence, both read off the
    // cascade so they cannot drift apart.
    const cardRoom = roomInside(row.element)
    const artWidth = lengthPx(cs.width, cardRoom)
    expect(artWidth / cardRoom, 'the painting takes 40% of the card').toBeCloseTo(ART_SHARE / 100, 2)
    const bodyCs = getComputedStyle(row.find('.shop-row-body').element)
    const inset = calcPx(bodyCs.paddingLeft, cardRoom)
    expect(inset, 'the words start past the painting').toBeGreaterThanOrEqual(artWidth)
    const textShare = (cardRoom - inset) / cardRoom
    expect(textShare, 'and the text keeps about the other 60%').toBeGreaterThan(0.5)
    expect(textShare).toBeLessThanOrEqual((100 - ART_SHARE) / 100)

    // ⭐⭐ AND THE NAME HAS THE LINE TO ITSELF, WHICH IS A HEIGHT GUARD AND HIS HANDOFF'S OWN WORDS.
    // README §X: «Название - на своей строке, с переносом (не в одном флекс-ряду с доходностью,
    // иначе обрезается)». `.shop-row-head` is `space-between` with an unbreakable rate beside the
    // name; a framed row hands the words 40% less room, and rendered at 375px in a real browser
    // «The luxury four-by-four» broke into THREE lines against a column with space for one and a
    // half. On a card whose height IS its words that is the one thing that can make it tall again -
    // the same property the buy row below is protecting, in a different place.
    const head = getComputedStyle(row.find('.shop-row-head').element)
    expect(head.display, 'the name is not sharing a flex line with the rate').toBe('block')

    // ⚠ AND THE SOURCE IS SQUARE, so the crop is horizontal and never vertical – the A2c/d ruling
    // the coach strip is written under.
    const imgCs = getComputedStyle(art.find('img').element)
    expect(imgCs.objectFit).toBe('cover')
    expect(imgCs.height, 'height-driven, so nothing is cut off the top or the bottom').toBe('100%')
    wrapper.unmount()
  })

  it('⭐⭐ #5 – the price and the buy control share ONE LINE, price first', async () => {
    // ⚠⚠ HE SETTLED THIS IN THREE MESSAGES ON ONE DAY AND THE REASON SURVIVED ALL THREE. Item 5
    // asked for «кнопку покупки можно поставить под цену»; he built it and named the cost – «иначе
    // карточка очень высокая получается»; then «и я ошибся: на машинах на карточках кнопку buy
    // поставь СПРАВА от цены пожалуйста», which is also what his frame X draws. MoneyScreen.vue's
    // own rule carries the three quotes, where Cyrillic is allowed.
    //
    // ⭐⭐ SO THE PROPERTY UNDER TEST IS THE CARD'S HEIGHT AND NOT THE CONTROL'S POSITION – the
    // position moved twice and the height argument never did. Measured in a real browser at 375px:
    // stacked, the four cars were 200.3-216.5px; sharing the line they are 164.7-180.9px.
    setViewport(PHONE)
    const wrapper = await mountShop(toSnapshot(rich('r35-5-buy')), true)
    const { row } = await framed(wrapper, 'The unreasonable one')
    const price = row.find('.shop-row-price')
    expect(price.exists(), 'the price is on the card whether it can be reached or not').toBe(true)
    const action = row.find('.shop-action')
    // PRICE FIRST, CONTROL AFTER IT, in the document and on the screen – and no `order` override
    // reversing one against the other, which is the arrangement a screen reader also gets right.
    expect(
      price.element.compareDocumentPosition(action.element) & Node.DOCUMENT_POSITION_FOLLOWING,
      'the control follows the price',
    ).toBeTruthy()
    for (const el of [price.element, action.element]) {
      expect(['', '0', 'normal'], 'neither is reordered against the other').toContain(getComputedStyle(el).order)
    }
    expect(
      getComputedStyle(price.element).flexBasis,
      'and the price does not claim the whole line, which is what pushed the control down',
    ).not.toBe('100%')
    // ⚠ AND THE CONTROL STAYS IN THE FLOW ON A CAR – it is the property/water rows that put it on
    // the painting, by his own separate sentence. A car whose button floated would be that sentence
    // leaking one family sideways.
    expect(getComputedStyle(action.element).position).not.toBe('absolute')

    // ⭐⭐ AND THE HEIGHT ITSELF, MEASURED THE ONLY WAY IT HONESTLY CAN BE HERE.
    //
    // ⚠⚠ A CEILING ON `boxOf(card)` WAS TRIED FIRST AND IT IS VACUOUS – recorded rather than
    // quietly dropped, because it looks exactly like a real assertion. `fits.ts`'s `stackChildren`
    // models a non-column flex container as its TALLEST CHILD, which is right for a row and blind
    // to a WRAP: the buy row measures one control tall whether the two items sit side by side or
    // one under the other, so a card ceiling reads 149px in both worlds. It reddened on the
    // structural assertions above and never on its own number, which is a pin that cannot fail.
    //
    // ⭐ SO THE HEIGHT CLAIM IS MADE AS A WIDTH ONE, which is what it really is: the price and the
    // control FIT ON ONE LINE of the text column, so they cannot wrap, so the card cannot grow the
    // row he complained about. `demandedWidth` is `assertRowFits`'s own instrument and it credits no
    // ellipsis; the price is measured at `ADVANCE`, the constant `fits.ts` fitted against real
    // renders. Content-independent in the direction that matters: a longer label or a dearer rung
    // makes this tighter, never looser.
    const cardRoom = roomInside(row.element)
    const bodyCs = getComputedStyle(row.find('.shop-row-body').element)
    const column = cardRoom - calcPx(bodyCs.paddingLeft, cardRoom) - calcPx(bodyCs.paddingRight, cardRoom)
    const buyCs = getComputedStyle(row.find('.shop-row-buy').element)
    const gap = lengthPx(buyCs.columnGap || buyCs.gap, column) || 0
    const priceCs = getComputedStyle(price.element)
    const priceWidth = price.text().length * lengthPx(priceCs.fontSize, 0) * 0.47
    const needed = demandedWidth(action.element, column) + gap + priceWidth
    expect(
      needed,
      `the control and ${price.text()} demand ${needed.toFixed(0)}px of a ${column.toFixed(0)}px column, ` +
        'so they wrap and the card grows the row he asked to be rid of',
    ).toBeLessThanOrEqual(column)
    wrapper.unmount()
  })

  it('⭐⭐ #7 – property takes the painting on the RIGHT with the control ON it', async () => {
    // «но картинка с другой стороны, тоже во всю высоту … и градиент слева», and «Кнопка
    // покупка/продажа может стоять на картинке (как на яхтах, тогда картинка будет более
    // квадратная)». Frames Z and AA of his handoff draw exactly this.
    setViewport(PHONE)
    const wrapper = await mountShop(toSnapshot(rich('r35-7-property')), true)
    const { row, art } = await framed(wrapper, 'A place of their own')
    expect(row.classes()).toContain('shop-row--art-right')
    const cs = getComputedStyle(art.element)
    expect(cs.right, 'the band stands on the right edge').toBe('0px')
    expect(cs.left, 'and not on the left').not.toBe('0px')
    const cardRoom = roomInside(row.element)
    expect(lengthPx(cs.width, cardRoom) / cardRoom).toBeCloseTo(ART_SHARE / 100, 2)
    expect(
      calcPx(getComputedStyle(row.find('.shop-row-body').element).paddingRight, cardRoom),
      'the words stop before the painting',
    ).toBeGreaterThanOrEqual(lengthPx(cs.width, cardRoom))

    // ⭐ THE CONTROL IS ON THE PAINTING, AND IT IS BOUNDED BY IT. A pill that grew past the band
    // would put its own left edge back over the sentences, which is the failure this pair catches.
    const action = getComputedStyle(row.find('.shop-action').element)
    expect(action.position).toBe('absolute')
    expect(calcPx(action.maxWidth, cardRoom)).toBeLessThanOrEqual(lengthPx(cs.width, cardRoom))
    wrapper.unmount()
  })

  it('⭐⭐ #7 – an owned house says «Worth now» with the CURRENT price and no purchase price', async () => {
    // ⚙ HIS RULING, 03.09: «в строке "worth now" показывать текущую цену, а цену покупки убрать
    // совсем, раз прибавка и так видна. - верно.» The gain keeps its own line under it, which is
    // the «прибавка» the ruling leans on – so this arm asserts BOTH: the paid figure gone, the
    // gain still there. ⚠ PROPERTY ONLY: the same row on a car still names what was paid, which is
    // what keeps CLAUDE.md invariant 4 from spreading one item across six families.
    const world = rich('r35-7-owned')
    buyAsset(world, 'house-first')
    buyAsset(world, 'car-sensible')
    const wrapper = await mountShop(toSnapshot(world))

    const house = await shelfRow(wrapper, 'A place of their own')
    expect(house.text(), 'the current worth is the figure on the row').toContain('Worth now')
    expect(house.text(), 'and what was paid for it is gone').not.toContain('paid $240,000')
    expect(house.text(), 'the gain is still its own line').toContain('since you bought it')

    const car = await shelfRow(wrapper, 'The sensible estate')
    expect(car.text(), 'and a car still names what was paid').toContain('paid $60,000')
    wrapper.unmount()
  })

  it('⭐ #6 – the academy is four cards on the cars\' principle', async () => {
    // «для академии делаем для каждой части свою карточку (как на экране машин, такой же принцип,
    // можно переиспользовать), все арты на месте». Four cards, four paintings, the car's side.
    const wrapper = await mountShop(toSnapshot(rich('r35-6-academy')))
    await openShelfTab(wrapper, 'Business')
    const stages = ['The land', 'The courts', 'The clubhouse', 'The staff']
    for (const label of stages) {
      const row = await shelfRow(wrapper, label)
      expect(row.classes(), `${label} reuses the cars' framing`).toContain('shop-row--art-left')
      expect(row.find('.shop-row-art').exists(), `${label} has its painting`).toBe(true)
    }
    // ⚠ AND THE MERCH BRAND IS UNCHANGED – «мерч без изменений». It has no painting of its own, so
    // it is not framed, and an unframed row is the state this shelf has always drawn.
    const merch = await shelfRow(wrapper, 'The merch brand')
    expect(merch.classes()).not.toContain('shop-row--art-left')
    expect(merch.classes()).not.toContain('shop-row--art-right')
    wrapper.unmount()
  })
})

// =================================================================================================
describe('the ladders, pinned so a later edit cannot move a price quietly', () => {
// =================================================================================================
  // ⚠ WIDENED TO `ShopItem` ONCE, HERE. `ECONOMY` is a deep `as const`, so `catalogue` is a union of
  // twenty-nine object literals and an optional field like `retired` exists on only some members of
  // it – reading it off the literal type is a compile error rather than a false negative, which is
  // the right failure but not one worth repeating at every call site. This is the SAME array the
  // engine serves through `shopCatalogue()`; nothing is re-declared and nothing is copied.
  const CATALOGUE: readonly ShopItem[] = ECONOMY.shop.catalogue
  const priceOf = (id: string) => CATALOGUE.find((i) => i.id === id)?.entryCents
  const labelOf = (id: string) => CATALOGUE.find((i) => i.id === id)?.label
  const ladder = (family: string) =>
    CATALOGUE.filter((i) => i.family === family).map((i) => [i.id, i.entryCents] as const)

  it('⭐⭐ #7/#13 – property is a four-rung ladder now: 240k / 590k / 1.4M / 3M', () => {
    // «Добавится 2 тира домов еще: за 1.4м и за 3м» – his two prices to the digit.
    //
    // ⚠⚠ RE-AIMED AT ROUND 35 #13, NEVER LOOSENED, AND THE OLD NOTE PREDICTED THIS EXACT LINE. It
    // read «$520,000 IS NOT $590,000 … If he wants the rung repriced it is one number here and this
    // line goes red first, which is the point» – and on 03.09 he repriced it: «Дом пусть будет за
    // 590к - ок». So the number moved, the assertion moved with it, and the claim is the SAME
    // claim: four rungs, in this order, at exactly these four prices, read out of `ECONOMY` rather
    // than retyped. The pin's job was to make the change deliberate, and it did that job.
    expect(ladder('house')).toEqual([
      ['house-first', 240_000_00],
      ['house-garden', 590_000_00],
      ['house-villa', 1_400_000_00],
      ['house-headland', 3_000_000_00],
    ])
    // ⚠ AND THE STEM AGREES WITH THE PRICE AGAIN, which is the whole reason he moved it: the
    // painting he drew for this rung is `property-590`. A future edit that moves the price without
    // moving the art (or the reverse) is the thing this pair refuses.
    expect(shelfArtUrl('house-garden'), 'his painting for the 590k rung').toContain('property-590')
  })

  it('⭐⭐ #9 – two LIVE aeroplanes, 7M and 18M, and the 38M stays retired', () => {
    // «у нас сейчас один активный за 18м, раньше был еще за 28м, а я прошу добавить второй за 7м с
    // картинкой». The retired rung is still valued, billed and sellable for anyone who owns one –
    // `retired` is only what keeps it off the shelf – so it is IN the ladder and OUT of the live set.
    expect(ladder('plane')).toEqual([
      ['plane-small', 7_000_000_00],
      ['plane', 18_000_000_00],
      ['plane-long', 38_000_000_00],
    ])
    const live = CATALOGUE.filter((i) => i.family === 'plane' && !i.retired)
    expect(live.map((i) => i.id)).toEqual(['plane-small', 'plane'])
    expect(CATALOGUE.find((i) => i.id === 'plane-long')!.retired).toBe(true)
  })

  it('⭐⭐ #13 – the two live aeroplanes count their cabins, seven below and ten above', () => {
    // ⚙ HIS RULING, 03.09, AND BOTH NUMBERS ARE HIS: «самолет 18м стоит (верно) мест пусть будет 10.
    // У маленького 7. всё.» Round 35 #9 shipped the small plane deliberately SILENT on the count
    // (its catalogue note says why: the $18M row said «Eight seats» and two cards claiming one cabin
    // would have been worse than saying nothing), and this is the word that closed it.
    const blurbOf = (id: string) => CATALOGUE.find((i) => i.id === id)!.blurb
    expect(blurbOf('plane-small'), 'the 7M carries seven').toContain('Seven seats')
    expect(blurbOf('plane'), 'the 18M carries ten').toContain('Ten seats')
    // ⚠ THE NEGATIVE IS THE HALF THAT CATCHES A REVERT. «Eight seats» is the string that shipped on
    // the $18M row from round 29 #5 until this ruling, so a merge that restores it goes red here
    // rather than quietly putting the old cabin back on his screen.
    expect(blurbOf('plane'), 'and not the round-29 count').not.toContain('Eight seats')
    // ⚠ AND NEITHER COUNT MOVED A PRICE – he confirmed $18M in the same sentence («стоит (верно)»)
    // and the $7M rung was never in question. The ladder pin above is the price claim; this is the
    // cross-check that the two edits did not travel together.
    expect(CATALOGUE.find((i) => i.id === 'plane-small')!.entryCents).toBe(7_000_000_00)
    expect(CATALOGUE.find((i) => i.id === 'plane')!.entryCents).toBe(18_000_000_00)
  })

  it('⭐⭐ #8 – the water ladder swapped two identities and not one of its four prices', () => {
    // «меням местами только: за 900к это парусник, за 2.4м уже небольшая яхта, дальше как было».
    // ⚠ THE IDS DID NOT MOVE, so `boat-launch` carries the sailing boat and `boat-sail` the small
    // yacht. That is deliberate – a swap through two renames costs a schema bump and a migration to
    // express something no player can see – and it is exactly the kind of thing that rots silently,
    // which is why it is pinned here in both halves.
    expect(ladder('boat')).toEqual([
      ['boat-launch', 900_000_00],
      ['boat-sail', 2_400_000_00],
      ['yacht', 12_000_000_00],
      ['yacht-big', 28_000_000_00],
    ])
    expect(labelOf('boat-launch'), '900k is the sailing one now').toBe('The sailing boat')
    expect(labelOf('boat-sail'), 'and 2.4M is the small yacht').toBe('The small yacht')
    expect(labelOf('yacht'), 'above that, unchanged').toBe('The yacht')
    expect(labelOf('yacht-big')).toBe('The big yacht')
  })

  it('⭐ #5 – the four cars keep their prices and describe the cars he drew', () => {
    // «универсал 60к, люкс внедорожник 110к, спорткар 190к, 4местный люкс кабриолет 300к». The
    // prices are the round-29 ones and none of them moved; what moved is what the words describe.
    expect(ladder('car')).toEqual([
      ['car-sensible', 60_000_00],
      ['car-good', 110_000_00],
      ['car-nineteen', 190_000_00],
      ['car-unreasonable', 300_000_00],
    ])
    expect(labelOf('car-good'), 'a four-by-four, not a saloon').toBe('The luxury four-by-four')
    const nineteen = CATALOGUE.find((i) => i.id === 'car-nineteen')!
    expect(nineteen.blurb, 'the sports car is not twenty-five years old').not.toContain('twenty-five years late')
    const unreasonable = CATALOGUE.find((i) => i.id === 'car-unreasonable')!
    expect(unreasonable.blurb, 'the convertible has four seats').not.toContain('no back seats')
    expect(unreasonable.blurb).toContain('Four seats')
  })

  it('⭐ #1 – every rung on the shelf that he painted has its painting wired', () => {
    // ⚠ THE NEGATIVE IS THE HALF THAT MATTERS: the three families he did NOT paint draw artless, and
    // `shelfArtUrl` returning null is the designed state rather than a hole (its own header).
    for (const id of [
      'car-sensible',
      'car-good',
      'car-nineteen',
      'car-unreasonable',
      'house-first',
      'house-garden',
      'house-villa',
      'house-headland',
      'boat-launch',
      'boat-sail',
      'yacht',
      'yacht-big',
      'plane-small',
      'plane',
      'academy-land',
      'academy-courts',
      'academy-building',
      'academy-staff',
    ]) {
      expect(shelfArtUrl(id), `${id} has a painting`).toBeTruthy()
    }
    for (const id of ['deposit', 'index-fund', 'merch-brand', 'plane-long']) {
      expect(shelfArtUrl(id), `${id} has none, and that is the design`).toBeNull()
    }
    expect(priceOf('house-villa'), 'sanity: the catalogue really is the one under test').toBe(1_400_000_00)
  })
})

// =================================================================================================
describe('#10 – the in-page switcher is untouched', () => {
// =================================================================================================
  it('⛔ six segments, his six words, his order – nothing about it moved', async () => {
    // «переключалка между категориями магазина на самих страницах магазина остается текущей и не
    // меняется.» An explicit DO-NOT-TOUCH, so this arm is the record that it was not touched: the
    // segments, their labels and their order are the SHIPPED ones, and the home added in #3 is a
    // state BEFORE them rather than a seventh segment inside them.
    //
    // ⚠ RE-AIMED AT THE ROUND-34 MERGE (03.09). This was written as round 30 #5's order –
    // Invest / Cars / Property / Business / Water / Air – and that was the truth in the tree it was
    // written in: `round/35` was branched from main BEFORE `round/34` merged as PR #121. Round 34
    // #16 is the owner's own «Business пододвинуть к Invest в магазине», so Business is second now.
    // ⭐ THE CLAIM DID NOT WEAKEN. This arm says «round 35 did not touch the switcher», and it still
    // says exactly that – against what the switcher actually is rather than against a stale copy.
    const wrapper = await mountShop(toSnapshot(rich('r35-10-switcher')))
    await openShelfTab(wrapper, 'Invest')
    const pills = wrapper.findAll('.shelf-tabs button.tab-pill')
    expect(pills.map((p) => p.text().trim())).toEqual([
      'Invest',
      'Business',
      'Cars',
      'Property',
      'Water',
      'Air',
    ])
    expect(pills, 'six, never seven').toHaveLength(6)
    wrapper.unmount()
  })
})
