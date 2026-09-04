// ⭐⭐⭐ ROUND 36 ITEM 17 – THE MATCH SCREEN ON A TABLET AND ON A DESKTOP, MOUNTED.
//
// His two frames, `AU-live-match-tablet-768.png` and `AV-live-match-desktop-1024.png`, and the one
// thing he flagged about them himself:
//
//     «ВАЖНО: наши контролы скорости и моментов остаются с нами, дизайн их забыл.»
//
// The frames draw ONE «Speed up» pill. The app has a three-value SPEED plate, a two-value VIEW plate
// (full / key), a shout row and a skip link, and none of them may be lost to a layout. That is what
// section 1 below is: the same five controls asserted on a MOUNTED viewer at a phone, at a tablet and
// at a desktop, by the accessible names a screen reader would read out. `e2e/parity.spec.ts` makes
// the same claim in a real browser through its new live-match room; this file is the version that
// runs on every commit.
//
// ⚠ THE ORDER IS ALWAYS `setViewport` -> mount -> read. happy-dom evaluates a media query on an
// element's FIRST computed-style read and then caches it – phase 2 measured that and wrote it down
// beside `TABLET` in fits.ts. Setting the width after the mount reads the previous test's screen.
//
// ⚠ `attachTo: document.body` IS MANDATORY, not tidy: happy-dom applies no rule at all to a detached
// tree, so every computed value here would be an initial one and every arm would be vacuous.
//
// ⚠ MUTATION-VERIFIED – what each mutation reddened is written above each block, and the two arms
// that did NOT bite are named there too rather than left out.
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import { createPinia, setActivePinia } from 'pinia'
import '../../src/style.css'
import MatchViewer from '../../src/components/MatchViewer.vue'
import { simulateMatch } from '../../src/engine/match/engine'
import { annotateMatch } from '../../src/engine/match/rally'
import { JUNIOR_TOUR } from '../../src/engine/season/tournament'
import type { MatchOptions, MatchPlayer } from '../../src/engine/match/types'
import { DESKTOP, PHONE, TABLET, setViewport } from './fits'

function assertSheetPresent(): void {
  if (!document.head.querySelector('style')) {
    throw new Error('no stylesheet in the document – the component project needs `css: true`')
  }
}

function player(over: Partial<MatchPlayer>): MatchPlayer {
  return { id: 'p', name: 'P', serve: 50, ret: 50, composure: 50, stamina: 50, groundstrokes: 50, ...over }
}

function fixture() {
  const a = player({ id: 'a', name: 'Vera Novak', serve: 62 })
  const b = player({ id: 'b', name: 'Ines Duval', serve: 48 })
  const opts: MatchOptions = { surface: 'hard', tour: JUNIOR_TOUR, seed: 'r36-i17' }
  return { a, b, match: annotateMatch(simulateMatch(a, b, opts), a, b, opts) }
}

/** The LIVE viewer – the only mode that draws the shout row (ui-inventory §2: a replay «IS the live
 *  match minus the blinking Live and minus shouting»), so it is the mode his warning is about. */
async function mountLive(): Promise<() => void> {
  const { a, b, match } = fixture()
  const wrapper = mount(MatchViewer, {
    attachTo: document.body,
    props: { match, playerA: a, playerB: b, surface: 'hard' as const, mode: 'live' as const },
  })
  await nextTick()
  return () => {
    wrapper.unmount()
    document.body.innerHTML = ''
  }
}

function styleOf(selector: string): CSSStyleDeclaration {
  const el = document.querySelector(selector)
  if (!el) throw new Error(`${selector} is not on the screen – there is nothing to measure`)
  return getComputedStyle(el)
}

/**
 * The TOP-LEVEL tracks of a `grid-template-*` value, split on the spaces that are not inside a
 * function.
 *
 * ⚠⚠ IT EXISTS BECAUSE THE PLACEMENT ARMS ALONE WERE VACUOUS AGAINST THE OBVIOUS MUTATION, and that
 * was measured rather than foreseen: collapsing `grid-template-columns` to a single track passed all
 * ten arms of this file. `grid-column: 2` is a DECLARATION, and happy-dom reports the declaration
 * whether or not a second column exists to hold it – so «the log is in column 2» stayed true of a
 * grid with one column, where a browser would have put the log in an implicit second one under the
 * bar. The tracks have to be asserted as well as the placements, and this is what asserts them.
 */
function tracksOf(value: string): string[] {
  const tracks: string[] = []
  let depth = 0
  let current = ''
  for (const ch of value.trim()) {
    if (ch === '(') depth++
    if (ch === ')') depth--
    if (ch === ' ' && depth === 0) {
      if (current) tracks.push(current)
      current = ''
    } else current += ch
  }
  if (current) tracks.push(current)
  return tracks
}

/** Every control the viewer draws, by the name the accessibility tree would carry: `aria-label` where
 *  there is one (the segmented pills and the shout picker all have one), else the trimmed text. */
function controlNames(): string[] {
  const out: string[] = []
  for (const el of Array.from(document.querySelectorAll('button, select'))) {
    const label = el.getAttribute('aria-label') ?? (el.textContent ?? '').trim()
    if (label) out.push(label.replace(/\s+/g, ' '))
  }
  return out.sort()
}

// =================================================================================================
// 1. ⭐⭐⭐ HIS WARNING: THE SPEED MATRIX AND THE VIEW MODE SURVIVE THE LAYOUT, AT EVERY WIDTH
// =================================================================================================
// MUTATION-VERIFIED, and this is the arm the whole item is measured by: replacing the two
// `SegmentedRow`s in MatchControls.vue with a single `Speed up` pill – the frames' own control –
// reddens all three widths at once, naming `Every point`, `Key points only`, `Normal speed`,
// `Double speed` and `Quadruple speed`. Deleting `.mv-below { display: contents }` does NOT redden
// it, correctly: the controls are still rendered, just in the wrong place, which is what section 2
// is for.
describe('round 36 item 17 – the controls the design forgot', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    document.body.innerHTML = ''
  })
  afterEach(() => setViewport(PHONE))

  /** His five, plus the two the shout row is made of. Names, not classes: a control that is renamed
   *  has changed for a player and should be re-argued, not silently followed. */
  const HIS_CONTROLS = [
    'Every point',
    'Key points only',
    'Normal speed',
    'Double speed',
    'Quadruple speed',
    'What to shout',
    'Shout 📣',
    'Skip to the result',
  ]

  for (const [name, vp] of [
    ['a phone', PHONE],
    ['a tablet', TABLET],
    ['a desktop', DESKTOP],
  ] as const) {
    it(`⭐⭐ every speed, both view modes and the shout are on ${name}`, async () => {
      assertSheetPresent()
      setViewport(vp)
      const done = await mountLive()
      const names = controlNames()
      for (const control of HIS_CONTROLS) {
        expect(names, `«${control}» is gone at ${vp.width}px – «дизайн их забыл», and we did not`).toContain(
          control,
        )
      }
      done()
    })
  }

  // ⭐ AND THE OTHER HALF OF «1 к 1»: nothing NEW appears on a wide screen either, which is the
  // criterion the round is measured by from the other side. The set is compared, not just contained.
  it('⭐⭐ …and the set is IDENTICAL at all three widths – nothing gained, nothing lost', async () => {
    assertSheetPresent()
    setViewport(PHONE)
    let done = await mountLive()
    const phone = controlNames()
    done()

    setViewport(TABLET)
    done = await mountLive()
    const tablet = controlNames()
    done()

    setViewport(DESKTOP)
    done = await mountLive()
    const desktop = controlNames()
    done()

    expect(phone.length, 'the phone drew almost nothing – four near-empty sets are equal').toBeGreaterThan(7)
    expect(tablet, 'a control appeared or vanished between the phone and the tablet').toEqual(phone)
    expect(desktop, 'a control appeared or vanished between the phone and the desktop').toEqual(phone)
  })

  // ⚠ THE VIEW MODE IS NOT ONLY A PAIR OF PILLS: 'key' shows fewer points and the match CLOCK still
  // reports the match's real duration – «a per-point clock would report a 'key' match as twenty
  // minutes long, which is the lie» (viz/matchClock.ts). Nothing in this item touches that
  // derivation, and the arm that says so is that the clock is still DRAWN and still readable at every
  // width: a layout can only break a diegetic clock by hiding it.
  it('⚠ the match clock is still on the screen at every width, and it is not hidden', async () => {
    assertSheetPresent()
    for (const vp of [PHONE, TABLET, DESKTOP]) {
      setViewport(vp)
      const done = await mountLive()
      const clock = document.querySelector('.mv-clock')
      expect(clock, `the clock is gone at ${vp.width}px`).toBeTruthy()
      expect(clock!.getAttribute('aria-label'), 'the clock stopped naming itself').toMatch(
        /^Elapsed match time /,
      )
      const cs = styleOf('.mv-clock')
      expect(cs.display, `the clock is hidden at ${vp.width}px`).not.toBe('none')
      expect(cs.visibility, `the clock is invisible at ${vp.width}px`).not.toBe('hidden')
      done()
    }
  })
})

// =================================================================================================
// 2. THE GRID – AU ON A TABLET, AV ON A DESKTOP, AND A PHONE THAT DID NOT MOVE
// =================================================================================================
// MUTATION-VERIFIED:
//   * `display: contents` deleted from `.mv-below` -> the tablet and desktop placement arms redden
//     (the log and the bar are back inside a box that is not a grid item, so neither is placed);
//   * `grid-template-columns` swapped for a single track -> both placement arms redden;
//   * the `@media (min-width: 1024px)` block deleted -> the desktop arm alone reddens and the tablet
//     arm stays green, which is the pair this section exists to tell apart;
//   * the whole `@media (min-width: 768px)` block deleted -> every arm here but the phone's reddens,
//     and the phone's stays green – which is the identity claim as a mutation.
describe('round 36 item 17 – the two placements', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    document.body.innerHTML = ''
  })
  afterEach(() => setViewport(PHONE))

  it('⚠ a phone is untouched: one column, and the wrapper is still a real box', async () => {
    assertSheetPresent()
    setViewport(PHONE)
    const done = await mountLive()
    expect(styleOf('.mv').display, 'the phone stack became a grid').toBe('flex')
    // ⭐ THE WRAPPER IS THE PINNED BAR'S CONTAINING BLOCK ON A PHONE and must stay a box there – see
    // tests/screen-i-live-match.test.ts for the guarantee this is one half of.
    expect(styleOf('.mv-below').display, 'the wrapper stopped being a box on a phone').toBe('flex')
    done()
  })

  it('⭐⭐ AU – on a tablet the panel spans BOTH columns and the log stands beside the bar', async () => {
    assertSheetPresent()
    setViewport(TABLET)
    const done = await mountLive()
    expect(styleOf('.mv').display, 'the tablet is not a grid').toBe('grid')
    expect(styleOf('.mv-below').display, 'the wrapper is still a box, so its children cannot be placed').toBe(
      'contents',
    )
    // «court on top»: the panel takes the whole width of row 1.
    expect(styleOf('.mv-panel').gridColumn, 'the court is not on top').toBe('1 / -1')
    expect(styleOf('.mv-panel').gridRow).toBe('1')
    // «instruments in two columns»: the transport left, the commentary right, both on row 2.
    expect(styleOf('.mv-log').gridColumn, 'the commentary is not the right-hand column').toBe('2')
    expect(styleOf('.mv-log').gridRow, 'the commentary is not on the instruments row').toBe('2')
    expect(styleOf('.mv-controls').gridColumn, 'the transport is not the left-hand column').toBe('1')
    expect(styleOf('.mv-controls').gridRow).toBe('2')
    done()
  })

  it('⭐⭐ AV – on a desktop the panel takes one column and the commentary the full height', async () => {
    assertSheetPresent()
    setViewport(DESKTOP)
    const done = await mountLive()
    expect(styleOf('.mv').display).toBe('grid')
    expect(styleOf('.mv-below').display).toBe('contents')
    // The panel gives up the second track...
    expect(styleOf('.mv-panel').gridColumn, 'the panel still spans the screen').toBe('1')
    // ...and the commentary takes the height of both rows beside it, which is the whole of AV.
    expect(styleOf('.mv-log').gridColumn).toBe('2')
    expect(styleOf('.mv-log').gridRow, 'the commentary is not full height').toBe('1 / -1')
    // The transport stays at the foot of the court's own column.
    expect(styleOf('.mv-controls').gridColumn).toBe('1')
    expect(styleOf('.mv-controls').gridRow).toBe('2')
    done()
  })

  // ⭐ THE STICKY BAR'S GUARANTEE, RESTATED FOR A GRID. `.mv-below` is the bar's containing block on a
  // phone; a grid item's containing block is its GRID AREA, so at these widths the guarantee is that
  // the bar's area is row 2 – strictly below the panel's row 1 – and that it is still sticky.
  //
  // ⚠ AND THE `margin-top` RESET IS PART OF IT: the bar carries `-10px` to eat the flex column's gap
  // and sit flush under the log. There is no log above it here, so left in place it would hang 10px
  // into the row above.
  it('⚠ the pinned bar is still pinned, and its area is strictly below the court’s', async () => {
    assertSheetPresent()
    for (const vp of [TABLET, DESKTOP]) {
      setViewport(vp)
      const done = await mountLive()
      const bar = styleOf('.mv-controls')
      expect(bar.position, `the bar stopped being sticky at ${vp.width}px`).toBe('sticky')
      expect(bar.bottom, 'the bar stopped pinning to the floor').toBe('0px')
      expect(bar.gridRow, 'the bar is on the court’s own row – it could reach the playing surface').toBe('2')
      expect(styleOf('.mv-panel').gridRow, 'the panel left row 1').toBe('1')
      expect(bar.marginTop, 'the flex gap-eater is still pulling the bar into the row above').toBe('0px')
      expect(bar.alignSelf, 'the bar floats in the middle of its column').toBe('end')
      done()
    }
  })

  // ⭐⭐ THE TRACKS THEMSELVES, WHICH THE PLACEMENTS ABOVE DO NOT IMPLY – see `tracksOf` for the
  // mutation that proved they do not. Both numbers here are proportions rather than tidiness:
  // `344px` is AU's own right-hand column and `60%` is AV's own «Корт — 60% ширины шелла», which are
  // the two places in this item where the design's number was taken instead of one of ours.
  //
  // MUTATION-VERIFIED: `grid-template-columns: minmax(0, 1fr)` (one track) reddens both halves, which
  // is the arm the rest of this file was blind to.
  it('⭐⭐ there really are TWO columns, and they carry his two proportions', async () => {
    assertSheetPresent()
    setViewport(TABLET)
    let done = await mountLive()
    const tablet = tracksOf(styleOf('.mv').gridTemplateColumns)
    expect(tablet.length, 'the tablet grid is not two columns').toBe(2)
    expect(tablet[1], 'AU’s own 344px commentary column is gone').toContain('344px')
    expect(tracksOf(styleOf('.mv').gridTemplateRows).length, 'the panel and the bar share one row').toBe(2)
    done()

    setViewport(DESKTOP)
    done = await mountLive()
    const desktop = tracksOf(styleOf('.mv').gridTemplateColumns)
    expect(desktop.length, 'the desktop grid is not two columns').toBe(2)
    expect(desktop[0], 'AV’s own 60% court column is gone').toContain('60%')
    done()
  })

  // ⚠ THE COURT'S CAP IS PHASE 4's AND THIS ITEM DOES NOT TOUCH IT (D23). Asserted here because the
  // desktop places the court in a 60% column, and «the court got smaller» must be the COLUMN's doing
  // and never a second cap appearing.
  it('⚠ the 680 cap is still the drawing surface’s own, at every width', async () => {
    assertSheetPresent()
    for (const vp of [PHONE, TABLET, DESKTOP]) {
      setViewport(vp)
      const done = await mountLive()
      expect(styleOf('.mv-court').maxWidth, `the cap moved at ${vp.width}px`).toBe('680px')
      const ratio = styleOf('.mv-canvas').aspectRatio
      expect(`${/^\s*(\d+)/.exec(ratio)?.[1]}px`, 'the cap and the ratio parted company').toBe('680px')
      done()
    }
  })
})
