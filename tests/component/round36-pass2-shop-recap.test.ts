// ⭐⭐⭐ ROUND 36, SECOND PASS FROM THE STAND – P2-1 AND P2-5, MOUNTED.
//
// Two items he found on the built wave at 1280, and they share nothing but this file: one is a
// comment that leaked onto every shop page, the other is the week story's photograph. His words are
// in docs/rounds/round-36-review.md; the quotes live here and in the style block rather than in a
// template, because tests/template-copy-rules.test.ts bans Cyrillic inside a `<template>`.
//
// ⚠ THE ORDER IS ALWAYS `setViewport` -> mount -> read, and `attachTo: document.body` is mandatory
// for anything measured: happy-dom evaluates a media query on an element's FIRST computed-style read
// and caches it, and applies no rule at all to a detached tree. Both are phase 2's findings, written
// out beside `TABLET` in fits.ts, and round36-review.test.ts's header repeats them.
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
// A runner-sized ceiling, for round36-review.test.ts's own reason: these cases mount real screens
// over careers walked by the real engine, and GitHub's 2-core runner is measured at 4-5x this
// machine on this suite. The walks are hoisted out of the cases, so what is left inside one is a
// mount; 30s is far above that and can only fire on a genuine wedge.
vi.setConfig({ testTimeout: 30_000 })
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import '../../src/style.css'
import MoneyScreen from '../../src/components/screens/MoneyScreen.vue'
import WeekRecapCard from '../../src/components/WeekRecapCard.vue'
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
import { DESKTOP, PHONE, TABLET, type Viewport, aspectHeightPx, boxOf, lengthPx, setViewport } from './fits'
import { shelfText } from './shelf'

function assertSheetPresent(): void {
  if (!document.head.querySelector('style')) {
    throw new Error('no stylesheet in the document – the component project needs `css: true`')
  }
}

/** A real career, walked by the real engine – `shop-tab.test.ts`'s recipe, shared by every file
 *  that reaches the shelf or the week's story. */
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

/** Rich enough that no rung is greyed for money alone, so every family draws its full shelf. */
function rich(seed: string, weeks = 20): WorldState {
  const w = walk(seed, weeks)
  w.bestFinishByTier.wta250 = 3
  w.fundsCents = 60_000_000_00
  return w
}

/** The two hoisted careers. Walking the engine is the expensive half and neither case mutates it. */
const SHOP_SNAPSHOT: Snapshot = toSnapshot(rich('r36p2-shop'))
const STORY_SNAPSHOT: Snapshot = toSnapshot(walk('r36p2-story', 12))

// =================================================================================================
// 1. P2-1 – NO SHOP PAGE DRAWS THE TAIL OF A COMMENT UNDER ITS FAMILY HEADING
// =================================================================================================
// «артефакты в верстке всех страниц магазина» – he opened Money -> Shop -> Water on the stand and
// found a paragraph of English prose under «On the water», beside the first card, ending in a
// literal comment terminator. The cause was an HTML comment in MoneyScreen.vue that quoted a
// terminator inside itself: HTML comments do not nest, so the inner one closed it two and a half
// lines early and what followed became a TEXT NODE inside the `v-for` over families – on every
// family, on every page.
//
// ⚠ THIS ARM IS THE BEHAVIOURAL HALF AND `tests/template-comment-terminators.test.ts` IS THE
// STRUCTURAL ONE. That file parses every component and forbids the SHAPE, so no future comment can
// do this again; this one mounts the real screen and reads what the player reads, which is the
// claim he actually made. Neither replaces the other: a parser arm cannot say «the shop is clean»,
// and a mounted arm on one screen cannot say «no component does this».
describe('P2-1 – the shop draws no leaked comment on any of its pages', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    document.body.innerHTML = ''
  })

  it('⭐⭐ every shop family reads clean – no terminator, and not one word of the note', async () => {
    useGameStore().snapshot = SHOP_SNAPSHOT
    const wrapper = mount(MoneyScreen, { global: { stubs: { teleport: true } } })
    const tab = wrapper.findAll('button.tab-pill').find((n) => n.text().trim() === 'Shop')
    expect(tab, 'the Shop chapter').toBeTruthy()
    await tab!.trigger('click')

    // Walks all six families and concatenates what each page says – the helper seven mounted files
    // already reach the shelf through.
    const text = await shelfText(wrapper)

    // ⚠ A GUARD THAT READ NOTHING WOULD PASS EVERYTHING. The shelf has to actually be open and
    // drawing families before the two assertions below mean anything.
    expect(wrapper.findAll('.shop-family-head').length, 'families really are on screen').toBeGreaterThan(0)
    expect(text.length, 'and the six pages really did say something').toBeGreaterThan(2000)

    // The literal he photographed, and the words that were in the leaked paragraph. The second is
    // the sharper of the two: a reworded comment that still contains this sentence has been moved
    // rather than fixed.
    expect(text, 'the comment terminator he photographed').not.toContain('-->')
    expect(text, 'the leaked note about `coach-voice.test.ts`').not.toContain('before it scans')
    wrapper.unmount()
  })
})

// =================================================================================================
// 2. P2-5 – THE WEEK STORY'S PHOTOGRAPH TAKES HALF THE CARD, AND THE NOTE TAKES WHAT IS LEFT
// =================================================================================================
// «на week results картинку крупнее на 50% ширины контейнера с ней и кропаем немного, записка
// следовательно, станет чуть уже» (owner, 05.09).
//
// Item 16 made the first column `--recap-art-h`, so the photograph was a SQUARE 286x286 at 768 and
// at 1280 and the scrap beside it took the rest. He now wants the column at half the card: the
// picture is bigger at every width, it is no longer square, and `object-fit: cover` crops it – which
// is «кропаем немного», said explicitly so nobody treats the crop as the defect. The note narrows
// because the column it lives in narrowed; that is «следовательно», a consequence rather than a
// second instruction, so no rule of the note's own moves.
//
// ⚠ WHAT MAY NOT MOVE: the card's own height (the band still caps row 1), and everything below 768.
//
// ⚠⚠ HOW A SHARE IS AN EXACT NUMBER HERE DESPITE happy-dom HAVING NO LAYOUT ENGINE. The card is
// mounted standalone, so its only ancestor is `<body>` and its content box is the viewport – the
// base round36-review.test.ts §4 already measures against. And the photograph's share needs no base
// at all: `width` on the image resolves against `.recap-art`'s content box, `.recap-art` is
// `width: 100%` of the card, so a declared `50%` IS half the card whatever the card is worth.
describe('P2-5 – the week story past 768', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    document.body.innerHTML = ''
  })
  afterEach(() => setViewport(PHONE))

  /** ⭐ 900 IS THE TOP OF HIS TABLET BAND («768 как раз тоже можно до 900 тянуть вполне», phase 2's
   *  spec) and 520 is the width phase 2's D11 was left open at. Neither is in fits.ts, because
   *  neither is a device the whole suite measures against. */
  const WIDE_900: Viewport = { width: 900, height: 1024 }
  const NARROW_520: Viewport = { width: 520, height: 800 }
  const WIDE: Viewport[] = [TABLET, WIDE_900, DESKTOP]

  async function mountRecap(vp: Viewport) {
    setViewport(vp)
    useGameStore().snapshot = STORY_SNAPSHOT
    const wrapper = mount(WeekRecapCard, {
      attachTo: document.body,
      global: { stubs: { teleport: true } },
    })
    expect(document.querySelector('.recap-art'), 'the week’s painting is on the card').toBeTruthy()
    return wrapper
  }

  /** The first grid track as a length, off the card's own `grid-template-columns`. */
  function firstTrackPx(cardW: number): number {
    const cs = getComputedStyle(document.querySelector('.recap-card')!)
    const first = cs.gridTemplateColumns.trim().split(/\s+/)[0] ?? ''
    return lengthPx(first, cardW)
  }

  /** What the scrap in column 2 is left with, derived from the cascade: the second track is the card
   *  less the gap and the first track, and the note gives back its own right margin. */
  function noteWidthPx(cardW: number): number {
    const card = getComputedStyle(document.querySelector('.recap-card')!)
    const note = getComputedStyle(document.querySelector('.recap-note')!)
    const gap = lengthPx(card.columnGap, cardW) || 0
    const track2 = cardW - gap - firstTrackPx(cardW)
    return track2 - (lengthPx(note.marginLeft, cardW) || 0) - (lengthPx(note.marginRight, cardW) || 0)
  }

  /** The band's height on screen: its ratio, CAPPED by `max-height` – which `boxOf` does not apply.
   *  `.recap-art` is 390/286 of the full card at these widths, i.e. far past D's 286, so the cap is
   *  what is really drawn. Read from the cascade rather than typed, so a change to `--recap-art-h`
   *  moves this and the card's modelled height together instead of only one of them. */
  function bandHeightPx(cardW: number): number {
    const cs = getComputedStyle(document.querySelector('.recap-art')!)
    const ratioH = aspectHeightPx(cs.aspectRatio ?? '', cardW)
    const cap = lengthPx(cs.maxHeight, cardW)
    return Math.min(Number.isFinite(ratioH) ? ratioH : Infinity, Number.isFinite(cap) ? cap : Infinity)
  }

  /** The scrap's own border box at the width column 2 leaves it, margins included. */
  function noteBoxHeightPx(cardW: number): number {
    const note = document.querySelector('.recap-note')
    if (!note) return 0
    const b = boxOf(note, noteWidthPx(cardW))
    return b.marginTop + b.h + b.marginBottom
  }

  /**
   * The card's border-box height, GRID-AWARE – which `boxOf` alone is not, and that is the whole
   * point of writing it out here. `fits.ts` stacks a non-flex parent's children, so it would add
   * the photograph and the scrap that stand SIDE BY SIDE in row 1 and report a card half again as
   * tall as the real one. Row 1 is `max(the band, the scrap)`; everything under it spans `1 / -1`
   * and stacks exactly as the block layout it came from.
   */
  function cardHeightPx(cardW: number): number {
    const card = document.querySelector('.recap-card')!
    const art = document.querySelector('.recap-art')!
    const note = document.querySelector('.recap-note')
    const artH = bandHeightPx(cardW)
    const noteH = noteBoxHeightPx(cardW)
    let rest = 0
    let prevBottom = 0
    let first = true
    for (const kid of [...card.children]) {
      if (kid === art || kid === note) continue
      const b = boxOf(kid, cardW)
      rest += (first ? b.marginTop : Math.max(prevBottom, b.marginTop)) + b.h
      prevBottom = b.marginBottom
      first = false
    }
    return Math.max(artH, noteH) + rest + prevBottom
  }

  /** ⚠ THE CARD'S HEIGHT BEFORE THIS ITEM, MEASURED ON THE UNFIXED TREE with the model above, and
   *  the only reason to write numbers down: «the card must not grow» is a claim about a DIFFERENCE,
   *  and a difference needs the other arm recorded. They are this model's pixels, not Chromium's –
   *  what they pin is that the picture growing from 286 to half the card moves the height by nothing.
   *
   *  ⚠⚠ AND THIS ARM IS THE CONTROL, NOT THE CLAIM – it is green before the fix and green after,
   *  which is what a «did not move» guard is for. The claim is the two arms above it, and both are
   *  red on the unfixed tree. What proves THIS one bites is `--recap-art-h: 100px`, which is the
   *  real failure mode («the card grew»): the card models 798.85 against these numbers and the scrap
   *  at 94.7 is suddenly taller than a 100px band, so both halves of the arm redden at once.
   *
   *  ⚠ THE OTHER DIRECTION SATURATES AND IS RECORDED RATHER THAN CLAIMED. Squeezing column 2 does
   *  NOT redden it: at a first track of 92% the scrap is 33px wide and `fits.ts`'s wrap model tops
   *  out at 216.2px – still under the band's 286, so the card is unmoved. The headroom is real
   *  (94.7px of scrap against a 286px band) and that is the honest reading; what the second
   *  assertion below guards is the day it stops being. */
  const CARD_H_BEFORE: Record<number, number> = { 768: 984.85, 900: 984.85, 1280: 984.85 }

  it.each(WIDE)('⭐⭐ the photograph takes half the card at $width, and is cropped to fill it', async (vp) => {
    assertSheetPresent()
    const wrapper = await mountRecap(vp)
    const card = getComputedStyle(document.querySelector('.recap-card')!)
    expect(card.display, 'the card lays the two out itself').toBe('grid')
    // ⭐ THE COLUMN AND THE PICTURE READ ONE TOKEN, exactly as item 16 had them read `--recap-art-h`:
    // «half the card» said twice is a pair one edit away from a photograph that no longer fills it.
    expect(
      card.gridTemplateColumns.replace(/\s+/g, ' '),
      'the first column is half the card',
    ).toBe('50% minmax(0, 1fr)')

    const img = getComputedStyle(document.querySelector('.recap-art img')!)
    const share = lengthPx(img.width, vp.width) / vp.width
    expect(share, `the photograph takes ${(share * 100).toFixed(1)}% of the card`).toBeGreaterThanOrEqual(0.49)
    expect(share).toBeLessThanOrEqual(0.51)
    // ⚠ AND IT IS NO LONGER SQUARE, which is what earns the crop: half of 768 against the band's 286
    // is 384x286, and half of 1280 is 640x286. `cover` is what «кропаем немного» is.
    expect(img.height, 'full height of the band, so the box is a rectangle now').toBe('100%')
    expect(img.objectFit, 'so it is cropped rather than letterboxed').toBe('cover')
    // ⭐ THE BAND ITSELF IS UNTOUCHED – still the full width with dark ground to the right of the
    // picture, which is item 16's «справа темный фон» and is not what this item re-opened.
    const artCs = getComputedStyle(document.querySelector('.recap-art')!)
    expect(artCs.width, 'the block still spans the card').toBe('100%')
    expect(lengthPx(artCs.maxHeight, vp.height), 'and still stops at D’s 286').toBe(286)
    expect(artCs.background.toLowerCase(), 'dark ground beside the picture').toContain('#121a22')
    wrapper.unmount()
  })

  // ⚠ NO `%` SIGN IN AN `it.each` TITLE – vitest reads it as a printf placeholder and appends the
  // whole case object to the name, which is how «55%» turned into «55% { width: 768, … }».
  it.each(WIDE)('⭐ the scrap takes what is left at $width – narrower than item 16’s 55 per cent', async (vp) => {
    assertSheetPresent()
    const wrapper = await mountRecap(vp)
    const note = document.querySelector('.recap-note')
    expect(note, 'the week’s handwritten scrap is on this card').toBeTruthy()
    const share = noteWidthPx(vp.width) / vp.width
    // The number is REPORTED rather than pinned to a decimal: what he asked for is the picture's
    // width, and the scrap's is arithmetic off it – the card less the gap, the half and the margin.
    expect(share, `the scrap takes ${(share * 100).toFixed(1)}% of the card`).toBeLessThan(0.55)
    expect(share, 'and it is still a note rather than a sliver').toBeGreaterThan(0.4)
    // It stays in the second column of row 1, centred, with no lift over the painting – item 16's
    // placement, which this item did not re-open.
    const cs = getComputedStyle(note!)
    expect(cs.gridColumn, 'still the second column').toBe('2')
    expect(cs.gridRow, 'still the picture’s own row').toBe('1')
    expect(lengthPx(cs.marginTop, vp.height), 'still no lift over the painting').toBe(0)
    wrapper.unmount()
  })

  it.each(WIDE)('⚠ and the card is not one pixel taller at $width', async (vp) => {
    assertSheetPresent()
    const wrapper = await mountRecap(vp)
    const h = cardHeightPx(vp.width)
    expect(h, `the card models ${h.toFixed(2)}px at ${vp.width}`).toBeCloseTo(CARD_H_BEFORE[vp.width]!, 0)
    // ⚠ AND THE REASON IT DOES NOT GROW, stated as its own assertion so a future change that makes
    // the scrap the tallest thing in row 1 fails HERE, naming the cause, rather than as a number.
    // Both sides are read off the cascade, so neither can drift past the other in silence.
    const band = bandHeightPx(vp.width)
    const scrap = noteBoxHeightPx(vp.width)
    expect(scrap, `the band caps row 1 at ${band}, not the scrap at ${scrap.toFixed(1)}`).toBeLessThanOrEqual(band)
    wrapper.unmount()
  })

  it.each([PHONE, NARROW_520])('⚠ …and $width is identical to the pixel', async (vp) => {
    assertSheetPresent()
    const wrapper = await mountRecap(vp)
    const card = getComputedStyle(document.querySelector('.recap-card')!)
    expect(card.display, 'no grid below 768').not.toBe('grid')
    expect(card.gridTemplateColumns, 'and no columns to put a picture in').toBe('')
    const img = getComputedStyle(document.querySelector('.recap-art img')!)
    expect(img.width, 'the picture still fills the band edge to edge').toBe('100%')
    expect(img.height).toBe('100%')
    const note = document.querySelector('.recap-note')
    if (note) {
      expect(
        lengthPx(getComputedStyle(note).marginTop, vp.height),
        'the scrap still rides up over the painting',
      ).toBe(-34)
    }
    const goal = document.querySelector('.recap-goal')!
    expect(getComputedStyle(goal).width, 'and the taped note is still the column’s width').not.toBe('55%')
    wrapper.unmount()
  })

  it('⭐ the taped note at the foot is untouched – item 16’s 55% still stands', async () => {
    assertSheetPresent()
    const wrapper = await mountRecap(TABLET)
    const goal = document.querySelector('.recap-goal')!
    // «записка следовательно, станет чуть уже» is about the scrap that SHARES the row with the
    // picture. The taped note at the foot has a row of its own, so nothing about it follows from a
    // wider photograph – and D72's number is not this item's to move.
    expect(getComputedStyle(goal).width, 'D72’s share, unchanged').toBe('55%')
    wrapper.unmount()
  })
})
