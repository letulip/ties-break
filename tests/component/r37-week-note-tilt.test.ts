// =================================================================================================
// ⭐⭐ ROUND 37, THIRD PASS, ITEM 11 – THE SCRAP BESIDE THE PHOTOGRAPH TURNS FIVE DEGREES
// =================================================================================================
//
// The owner off the stand, 06.09: «записку справа от картинки на week results поверни немного против
// часовой стрелки, градусов на 5». (Quoted here and in the style block rather than in a template:
// tests/template-copy-rules.test.ts bans Cyrillic inside a `<template>`, strings AND comments.)
//
// ⚠ THERE ARE TWO SCRAPS ON THIS CARD AND ONLY ONE IS «СПРАВА ОТ КАРТИНКИ», so the first case below
// tells them apart BY MEASUREMENT rather than by name – a test that identified the note by its class
// would be asserting the same guess the change was made on. What separates them is not the paper:
//
//     .recap-note   grid-column 2, grid-row 1, no tape, no width of its own – it is whatever the
//                   second track leaves, which P2-5 measured at 46.4% of the card at 768. THIS ONE.
//     .recap-goal   grid-column 1 / -1, taped, `width: 55%`, a row of its own below the summary.
//                   D72's share, and item 16's third move; not «справа от картинки» at any width.
//
// BEFORE −0.5°, AFTER −5.5°. Anticlockwise is the negative direction in CSS `rotate`, so «на 5
// градусов против часовой» is the current value minus 5. The design's own paper angles are
// −4 · −3 · −0.8 · −0.5 · +0.4 · +2 · +3 · +6 (PaperNote's prop docs); −5.5 is his number, not one
// of those, and it is the one he asked for.
//
// ⚠ WHAT IS MEASURED HERE IS THE RENDERED ROTATION, NOT THE PASSED PROP. `PaperNote` interpolates
// its `tilt` into an inline `transform: rotate(...)` on the wrapper, and the card now passes a CSS
// angle (`var(--recap-note-tilt)`) rather than a number – so `getComputedStyle(...).transform` is
// the angle the browser would actually turn the paper by, resolved through the media query. Reading
// the prop back would be the weaker test AND would be blind to the breakpoint, which is the half
// this item most needed covering.
//
// ⚠ THE ORDER IS ALWAYS `setViewport` -> mount -> read, and `attachTo: document.body` is mandatory:
// happy-dom evaluates a media query on an element's FIRST computed-style read and caches it, and
// applies no rule at all to a detached tree. Both are phase 2's findings, written out beside
// `TABLET` in fits.ts.
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
// The runner-sized ceiling round36-review.test.ts uses and for its reason: these cases mount a real
// screen over a career walked by the real engine, and GitHub's 2-core runner is measured at 4-5x
// this machine on this suite. The walk is hoisted, so what is left inside a case is a mount.
vi.setConfig({ testTimeout: 30_000 })
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import '../../src/style.css'
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

function assertSheetPresent(): void {
  if (!document.head.querySelector('style')) {
    throw new Error('no stylesheet in the document – the component project needs `css: true`')
  }
}

/** The recipe every file that reaches the week's story shares. */
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
/** The same seed and the same twelve weeks round36-pass2-shop-recap.test.ts walks, so the two files
 *  are measuring one card rather than two careers that happen to share a component. */
const STORY_SNAPSHOT: Snapshot = toSnapshot(walk('r36p2-story', 12))

describe('round 37 item 11 – the week story’s scrap turns anticlockwise', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    document.body.innerHTML = ''
  })
  afterEach(() => setViewport(PHONE))

  /** 900 is the top of his tablet band and 1024 the width he named in item 12; TABLET and DESKTOP
   *  are fits.ts's own. Four widths, because a rotated box's footprint grows with the box and the
   *  box is a share of the card. */
  const WIDE_900: Viewport = { width: 900, height: 1024 }
  const WIDE_1024: Viewport = { width: 1024, height: 800 }
  const WIDE: Viewport[] = [TABLET, WIDE_900, WIDE_1024, DESKTOP]
  /** 520 is the width phase 2's D11 was left open at – the other sub-768 case P2-5 measures. */
  const NARROW_520: Viewport = { width: 520, height: 800 }

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

  /** The angle actually on the element, in degrees. `NaN` when the element carries no rotation at
   *  all – which callers read as «this paper does not turn», never as zero degrees, because an
   *  unresolvable `var()` makes the whole `transform` guaranteed-invalid and the note would render
   *  bolt upright with nothing to say so. */
  function renderedDeg(el: Element): number {
    const m = /rotate\(\s*(-?[\d.]+)deg\s*\)/.exec(getComputedStyle(el).transform ?? '')
    return m ? Number(m[1]) : NaN
  }

  /** The first grid track as a length, off the card's own `grid-template-columns`. */
  function firstTrackPx(cardW: number): number {
    const cs = getComputedStyle(document.querySelector('.recap-card')!)
    const first = cs.gridTemplateColumns.trim().split(/\s+/)[0] ?? ''
    return lengthPx(first, cardW)
  }

  /** What the scrap in column 2 is left with – P2-5's own arithmetic: the card less the gap and the
   *  first track, less the note's own side margins. */
  function noteWidthPx(cardW: number): number {
    const card = getComputedStyle(document.querySelector('.recap-card')!)
    const note = getComputedStyle(document.querySelector('.recap-note')!)
    const gap = lengthPx(card.columnGap, cardW) || 0
    const track2 = cardW - gap - firstTrackPx(cardW)
    return track2 - (lengthPx(note.marginLeft, cardW) || 0) - (lengthPx(note.marginRight, cardW) || 0)
  }

  /** The band's height on screen: its ratio, CAPPED by `max-height`, which is what caps row 1. */
  function bandHeightPx(cardW: number): number {
    const cs = getComputedStyle(document.querySelector('.recap-art')!)
    const ratioH = aspectHeightPx(cs.aspectRatio ?? '', cardW)
    const cap = lengthPx(cs.maxHeight, cardW)
    return Math.min(Number.isFinite(ratioH) ? ratioH : Infinity, Number.isFinite(cap) ? cap : Infinity)
  }

  // ===============================================================================================
  // 1. WHICH SCRAP IS «СПРАВА ОТ КАРТИНКИ» – ESTABLISHED BY ITS BOX, NOT BY ITS NAME
  // ===============================================================================================
  it.each(WIDE)('⭐ the two scraps are told apart by their boxes at $width', async (vp) => {
    assertSheetPresent()
    const wrapper = await mountRecap(vp)
    const beside = document.querySelector('.recap-note')
    const taped = document.querySelector('.recap-goal')
    expect(beside, 'the week’s handwritten scrap is on this card').toBeTruthy()
    expect(taped, 'the goal scrap is on this card').toBeTruthy()

    const besideCs = getComputedStyle(beside!)
    const tapedCs = getComputedStyle(taped!)

    // THE ONE BESIDE THE PICTURE: the second column of the picture's own row, and no tape.
    expect(besideCs.gridColumn, 'the scrap beside the picture is in the second column').toBe('2')
    expect(besideCs.gridRow, 'and in the picture’s own row').toBe('1')
    expect(beside!.querySelector('.tb-paper-tape'), 'it is not taped down').toBeNull()
    const share = noteWidthPx(vp.width) / vp.width
    expect(share, `it takes ${(share * 100).toFixed(1)} per cent of the card`).toBeGreaterThan(0.4)
    expect(share, 'which is P2-5’s share and not D72’s 55').toBeLessThan(0.55)

    // THE TAPED ONE AT THE FOOT: the full width of the card to place itself in, its own 55%, taped.
    expect(tapedCs.gridColumn, 'the taped note spans the card rather than sitting beside it').toBe('1 / -1')
    expect(tapedCs.width, 'and keeps D72’s share').toBe('55%')
    expect(taped!.querySelector('.tb-paper-tape'), 'the taped note really is taped').toBeTruthy()
    wrapper.unmount()
  })

  // ===============================================================================================
  // 2. THE TURN – BEFORE −0.5°, AFTER −5.5°, READ OFF THE ELEMENT
  // ===============================================================================================
  it.each(WIDE)('⭐⭐ the scrap beside the picture is turned 5 degrees anticlockwise at $width', async (vp) => {
    assertSheetPresent()
    const wrapper = await mountRecap(vp)
    const deg = renderedDeg(document.querySelector('.recap-note')!)
    // ⚠ NOT `toBeCloseTo(-5.5)` ALONE. `NaN` is the failure mode a `var()` angle brings with it, and
    // a bare closeness assertion on NaN reports «expected -5.5, got NaN» without saying that the
    // paper is now rendering flat – so the finite check comes first and names it.
    expect(Number.isFinite(deg), `the scrap renders no rotation at all at ${vp.width}`).toBe(true)
    expect(deg, `the scrap is turned ${deg} degrees at ${vp.width}`).toBeCloseTo(-5.5, 5)
    // ⭐ AND THE TAPED NOTE DID NOT MOVE. He named one scrap; the other is a different object on a
    // row of its own and nothing about it follows from this.
    expect(renderedDeg(document.querySelector('.recap-goal')!), 'D’s +0.4 on the taped note').toBeCloseTo(0.4, 5)
    wrapper.unmount()
  })

  // ===============================================================================================
  // 3. THE ROTATED FOOTPRINT – A TURNED BOX IS BIGGER THAN AN UPRIGHT ONE, AND THIS CARD HAS PAID
  //    FOR THAT BEFORE
  // ===============================================================================================
  // D93 on Home is the precedent, written out at HomeScreen.vue's polaroid: a 96px window makes the
  // paper 112 tall, and «tilted −7° it spans 123.84px», which at round 36's `top: 30px` would have
  // hung the lip through the card's bottom edge where `overflow: hidden` cuts it square. So the
  // footprint is measured here rather than assumed, at every width the card has a second column at.
  //
  // A box w x h turned by θ occupies `w·|cos θ| + h·|sin θ|` across and `w·|sin θ| + h·|cos θ|` down.
  // Three things have to hold, and the third is the one the card's history says to check:
  //   – it stays inside the CARD (nothing hangs off the right edge into the frame's gutter),
  //   – it never reaches the PHOTOGRAPH (the lap to the left lands in the 16px column gap, which is
  //     the dark ground item 16 put there for the paper to be laid on),
  //   – it stays under the BAND, so row 1 is still capped by the picture and the card cannot grow.
  //
  // ⚠ AND THE ANGLE IS READ, NOT TYPED. A footprint computed from a hard-coded −5.5 would be green
  // on a tree where the note never turned – a null arm wearing a measurement, which is exactly the
  // provenance failure CLAUDE.md's «prove the arm contains both the change and its reader» names.
  it.each(WIDE)('⚠ the turned scrap still fits its cell and the card at $width', async (vp) => {
    assertSheetPresent()
    const wrapper = await mountRecap(vp)
    const cardW = vp.width
    const note = document.querySelector('.recap-note')!
    const deg = renderedDeg(note)
    expect(Math.abs(deg), `the footprint is being measured on a scrap turned ${deg} degrees`).toBeGreaterThanOrEqual(5)

    const rad = (Math.abs(deg) * Math.PI) / 180
    const w = noteWidthPx(cardW)
    const b = boxOf(note, w)
    const h = b.h
    const spanX = w * Math.cos(rad) + h * Math.sin(rad)
    const spanY = w * Math.sin(rad) + h * Math.cos(rad)

    // Where the upright box sits: the second track starts after the first and the gap, and the note
    // gives back its own right margin. The rotation is about the box's centre (no `transform-origin`
    // anywhere in this file or in PaperNote), so the footprint grows evenly either side.
    const gap = lengthPx(getComputedStyle(document.querySelector('.recap-card')!).columnGap, cardW) || 0
    const left = firstTrackPx(cardW) + gap
    const centreX = left + w / 2
    const bboxLeft = centreX - spanX / 2
    const bboxRight = centreX + spanX / 2
    const photoRight = lengthPx(getComputedStyle(document.querySelector('.recap-art img')!).width, cardW)
    const band = bandHeightPx(cardW)

    expect(
      bboxRight,
      `the turned scrap spans ${spanX.toFixed(2)}px and ends at ${bboxRight.toFixed(2)} of ${cardW}`,
    ).toBeLessThanOrEqual(cardW)
    expect(
      bboxLeft,
      `its left corner reaches ${bboxLeft.toFixed(2)}, the photograph ends at ${photoRight}`,
    ).toBeGreaterThanOrEqual(photoRight)
    expect(
      spanY,
      `it stands ${spanY.toFixed(2)}px tall turned, against a band of ${band}`,
    ).toBeLessThanOrEqual(band)

    // ⚠ AND THE LAYOUT BOX IS UNTOUCHED, which is why no room had to be made: a `transform` paints
    // and does not lay out, so row 1 is measured off the upright box and the card's modelled height
    // is the one round36-pass2-shop-recap.test.ts pins. Stated as its own assertion rather than left
    // implied, because «the card may not grow» is the claim the footprint above is in service of.
    expect(b.marginTop, 'still no lift over the painting past 768').toBe(0)
    expect(h, `the upright box is ${h.toFixed(2)}px, unmoved by the turn`).toBeLessThanOrEqual(band)
    wrapper.unmount()
  })

  // ===============================================================================================
  // 4. BELOW 768 NOTHING MOVED, TO THE PIXEL AND TO THE DEGREE
  // ===============================================================================================
  // «справа от картинки» is a place that only exists past 768. On a phone the scrap is full width
  // and RIDES the painting on a −34px lift, so a five-degree turn there would swing its corners out
  // over both edges of a 375px screen – about 5.7px each side, on an object his instruction never
  // names. That is why the angle is a breakpoint token rather than a number on the tag: the phone
  // keeps −0.5° exactly, and this case is what holds it there.
  it.each([PHONE, NARROW_520])('⚠ …and $width keeps the angle and the boxes it had', async (vp) => {
    assertSheetPresent()
    const wrapper = await mountRecap(vp)
    const note = document.querySelector('.recap-note')
    expect(note, 'the scrap is on the card here too').toBeTruthy()
    // The angle, unchanged – the one assertion this item could have broken by reaching too far.
    expect(renderedDeg(note!), 'the phone’s scrap keeps the angle it shipped with').toBeCloseTo(-0.5, 5)
    // ...and the arrangement P2-5 pinned, so «nothing below 768 moved» is a measurement here rather
    // than a claim about a diff.
    const card = getComputedStyle(document.querySelector('.recap-card')!)
    expect(card.display, 'no grid below 768').not.toBe('grid')
    expect(card.gridTemplateColumns, 'and no columns to put a picture in').toBe('')
    const cs = getComputedStyle(note!)
    expect(lengthPx(cs.marginTop, vp.height), 'the scrap still rides up over the painting').toBe(-34)
    expect(cs.gridColumn, 'and is placed by the flow rather than by a track').toBe('')
    const img = getComputedStyle(document.querySelector('.recap-art img')!)
    expect(img.width, 'the picture still fills the band edge to edge').toBe('100%')
    expect(renderedDeg(document.querySelector('.recap-goal')!), 'the taped note is untouched here too').toBeCloseTo(0.4, 5)
    wrapper.unmount()
  })
})
