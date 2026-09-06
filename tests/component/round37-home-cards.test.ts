// ⭐⭐⭐ ROUND 37 #1 AND #2 – HOME'S BOTTOM PAIR, MOUNTED.
//
// Two items he sent from the stand on 05.09.2026. His own words for each are in
// `docs/rounds/round-37.md` and beside the rules themselves in HomeScreen.vue's style block, where
// Cyrillic is allowed; nothing here restates a sentence of his, because the words live once, in the
// document that is his.
//
//   #1  the coach note's lettering comes off the portrait and moves right of it, with the corridor
//       the coach market's own cards use – desktop and tablet only.
//   #2  the Recent memory photograph becomes square at the width it already has – desktop and
//       tablet only.
//
// ⚠ WHAT THIS LAYER CAN AND CANNOT SAY. happy-dom parses CSS and does no layout, so every number
// here is a DECLARED value read through the real cascade at a real viewport – the right instrument
// for «is this rule on at this width» and for the arithmetic between two declared numbers, and the
// wrong one for «does a glyph land on his face». The GLYPH half is measured in a real Chromium and
// the table is in HomeScreen.vue beside the rule; what this file measures is the geometry that
// produces it, plus the two structural guarantees a browser run of one career cannot give:
//
//   * the strip has a WIDTH, so the picture is no longer a function of how many lines the quote
//     wraps to – which is what makes "the letters are off him" hold for every quote and not only
//     for the one the browser happened to render (round-18 #2's own argument, one screen over);
//   * the tilted polaroid's footprint FITS the card's floor, arithmetic the runner can do and a
//     screenshot cannot.
//
// ⚠ THE ORDER IS ALWAYS `setViewport` -> mount -> read. happy-dom evaluates a media query on an
// element's FIRST computed-style read and caches it, so a width set after the mount reads the
// previous test's screen – written down beside `TABLET` in fits.ts, and paid for by this project
// more than once.
//
// ⚠ MUTATION-VERIFIED, and this is what each mutation actually reddened on the unfixed tree:
//   * `.coach-art` loses `width: 84px` past 768 -> #1's corridor arm and #1's cannot-grow arm;
//   * `.coach-body { margin-left: 54px }` past 768 (i.e. the item reverted) -> #1's corridor arm;
//   * `.memory-polaroid :deep(img)` loses `min-height: 96px` -> #2's square arm;
//   * `.note-card > .memory-polaroid { top: 30px }` (the round-36 offset kept) -> #2's fits-the-card
//     arm, alone – which is the arm that says the lip is not cut off square by `overflow: hidden`.
// The phone arms stay green under every one of them, which is the point of having them.
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
// ⚠ THE APP'S OWN SHEET AS WELL AS THE COMPONENT'S. `--tilt-4` and the notecard surface live in
// src/style.css; without this import every computed value below is the initial one and every
// assertion passes on a broken build.
import '../../src/style.css'
import HomeScreen from '../../src/components/screens/HomeScreen.vue'
import { useGameStore } from '../../src/stores/game'
import { createWorld, tickWeek, toSnapshot } from '../../src/engine/world'
import { rngFromSeed } from '../../src/engine/rng'
import { DEFAULT_PROFILE, type Snapshot } from '../../src/shared/protocol'
import { DESKTOP, PHONE, TABLET, setViewport } from './fits'

// ⚠ THIS RUNNER HAS NO localStorage AND HomeScreen READS IT AT SETUP (`tb:kidAvatarHintSeen`), so a
// mount throws before anything can be measured. The same shim round18-coach.test.ts installs, and
// quoted there in full: the browser's own object is supplied rather than the component weakened.
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

/** One pixel below the breakpoint. The band starts at 768, so this is the width that says the
 *  desktop rule did not leak downwards – `e2e/parity.spec.ts` and the round's identity contract both
 *  rest on the phone being untouched, and 767 is where a `min-width` mistake shows up. */
const WIDE_PHONE = { width: 767, height: 1024 }

/** Refuses to run blind: a document with no stylesheet computes every property to its initial value,
 *  which would make "the strip is 84px" pass on the exact build he was looking at. */
function assertSheetPresent(): void {
  if (!document.head.querySelector('style')) {
    throw new Error('no stylesheet in the document – the component project needs `css: true`')
  }
}

/** A real career through the real protocol. Four weeks is enough for the diary to hold a memory,
 *  which is what puts the polaroid on the page at all – #2 measured on a card with no photograph on
 *  it would be a null arm that looks like a null result. */
function careerSnapshot(seed = 'r37-home'): Snapshot {
  const world = createWorld(seed, { ...DEFAULT_PROFILE, coachTier: 'middle' })
  const rng = rngFromSeed(world.seed)
  for (let i = 0; i < 4; i++) tickWeek(world, rng)
  return toSnapshot(world)
}

/** px off a computed value. Throws rather than returning NaN: a property that computed to `''` means
 *  the rule never reached the element, and silently comparing NaN would pass nothing and fail
 *  nothing. */
function px(value: string, what: string): number {
  const n = Number.parseFloat(value)
  if (!Number.isFinite(n)) throw new Error(`${what} computed to "${value}" – the rule did not reach the element`)
  return n
}

let wrapper: VueWrapper | null = null

function homeAt(vp: { width: number; height: number }): VueWrapper {
  assertSheetPresent()
  setViewport(vp)
  useGameStore().snapshot = careerSnapshot()
  wrapper = mount(HomeScreen, {
    props: { recapFresh: false },
    global: { stubs: { teleport: true } },
    attachTo: document.body,
  })
  return wrapper
}

function styleOf(selector: string): CSSStyleDeclaration {
  const el = document.querySelector(selector)
  if (!el) throw new Error(`nothing matches ${selector} – the measurement below would be vacuous`)
  return getComputedStyle(el)
}

beforeEach(() => {
  setActivePinia(createPinia())
  backing.clear()
})

afterEach(() => {
  wrapper?.unmount()
  wrapper = null
  document.body.innerHTML = ''
  setViewport(PHONE)
})

// =================================================================================================
// #1 – THE LETTERS COME OFF THE PORTRAIT
// =================================================================================================
//
// The model he named is the coach market's own card, and its numbers are the ones round-18 #2
// measured: a 62px strip, a text column at 74, twelve pixels of air, and a strip that cannot grow
// into them because it has a width. Home takes the same shape at its own scale – 84 and 96.

/** The master every coach portrait is cut from. The picture is `height: 100%; width: auto`, so this
 *  ratio and the card's height are the only two numbers that decide how wide the man comes out. */
const PORTRAIT_W = 162
const PORTRAIT_H = 264

/** The corridor the owner asked for next door, in his own words «10-15 пикселей», and the exact 12
 *  `.cm-body` takes. Named once so the two assertions below cannot drift apart. */
const CORRIDOR = 12

describe('round 37 #1 – the coach note\'s words clear the portrait past 768', () => {
  for (const vp of [TABLET, DESKTOP]) {
    it(`⭐ at ${vp.width}px the strip is 84px, the column starts at 96, and the air between them is 12`, () => {
      homeAt(vp)
      const art = styleOf('.coach-card .coach-art')
      const strip = px(art.width, '.coach-art width')
      expect(strip, `the strip has no width of its own at ${vp.width}px`).toBe(84)
      // The width is only an EDGE because the strip clips – round-18 #2's whole fix, borrowed.
      expect(art.overflow, 'and it clips what does not fit').toContain('hidden')

      const column = px(styleOf('.coach-card .coach-body').marginLeft, '.coach-body margin-left')
      expect(column, `the text column at ${vp.width}px`).toBe(96)

      // ⚠ THE PAIR THAT MUST MOVE TOGETHER. Moving the strip without the margin – or the margin
      // without the strip – is the failure this catches, and it is the failure the picker shipped
      // twice before round-18 #2 tied its own two numbers with exactly this assertion.
      const air = column - strip
      expect(air, `the words clear the picture at ${vp.width}px (${column} - ${strip})`).toBe(CORRIDOR)
      expect(air, 'the corridor left the band he asked for next door').toBeGreaterThanOrEqual(10)
      expect(air).toBeLessThanOrEqual(15)
    })
  }

  it('⭐⭐ …and the strip cannot grow into that corridor, which is what makes it a guarantee', () => {
    // ROUND-18 #2's ARGUMENT, AND THE REASON A BIGGER MARGIN ALONE WAS NEVER THE FIX HERE. Home's
    // portrait is height-driven and the card's height is set by how many lines the quote wraps to,
    // so a margin that pushes the text right narrows the column, wraps another line, grows the card
    // and WIDENS the picture: measured in a browser at 375px, 54 -> 66 -> 80 made the overlap worse
    // each time (the ledger is at `.coach-body` in HomeScreen.vue). A declared width breaks that
    // loop – whatever the quote does, the picture stops at 84.
    for (const vp of [TABLET, DESKTOP]) {
      homeAt(vp)
      const art = styleOf('.coach-card .coach-art')
      expect(['auto', ''], `the strip is unbounded again at ${vp.width}px`).not.toContain(art.width.trim())
      expect(px(art.width, '.coach-art width'), 'the strip is a length, not a shrink-wrap').toBeGreaterThan(0)
      // It costs the layout nothing, which is why the corridor is the margin's alone to spend.
      expect(art.position, 'the strip left the card corner it is pinned to').toBe('absolute')
      wrapper?.unmount()
      wrapper = null
    }
  })

  it('⚠ …and nothing visible is cut: the fade finishes before the clip at this band\'s card floor', () => {
    // THE INEQUALITY ROUND-18 #2 WROTE DOWN, ASKED OF HOME'S OWN GEOMETRY. The mask's stops are
    // percentages of the STRIP's box, so a strip wider than the picture the card can supply would
    // end the man where the fade is still opaque – a hard edge down his side, which is precisely the
    // A2c/d ruling's «the whole frame is on screen» being spent. The card's floor supplies the
    // picture; the mask consumes it.
    homeAt(TABLET)
    const floor = px(styleOf('.coach-card').minHeight, '.note-card.card-short min-height')
    const strip = px(styleOf('.coach-card .coach-art').width, '.coach-art width')
    // The strip stands the card's full padding box: the floor less the card's two hairlines.
    const supplied = ((floor - 2) * PORTRAIT_W) / PORTRAIT_H
    expect(
      supplied,
      `a ${floor}px card supplies ${supplied.toFixed(2)}px of picture for an ${strip}px strip`,
    ).toBeGreaterThanOrEqual(strip * 0.96)

    // ⚠ AND THE PICTURE IS STILL SIZED BY HEIGHT (A2c/d, 28.07: no vertical crop). The obvious way
    // to bound a strip is to give the IMAGE a width, and it would squeeze a photograph of a person.
    // What is bounded is the CLIP.
    const img = styleOf('.coach-card .coach-art img')
    expect(img.height, 'the portrait stopped being sized by height').toBe('100%')
    expect(img.width, 'the portrait was given a width, which distorts a person').toBe('auto')
  })

  for (const vp of [PHONE, WIDE_PHONE]) {
    it(`⚠ at ${vp.width}px NOTHING moves: 54px over an unbounded strip, exactly as it shipped`, () => {
      homeAt(vp)
      const art = styleOf('.coach-card .coach-art')
      const column = px(styleOf('.coach-card .coach-body').marginLeft, '.coach-body margin-left')
      // Round-18 #1's restored export geometry, and the two numbers of the misread it undid.
      expect(column, `the phone's text column moved at ${vp.width}px`).toBe(54)
      expect([66, 80, 96], `a wider band's margin leaked into ${vp.width}px`).not.toContain(column)
      // The strip below 768 is still the picture itself – no width, no clip.
      expect(['auto', ''], `the strip was bounded at ${vp.width}px, where he asked for nothing`).toContain(
        art.width.trim(),
      )
    })
  }
})

// =================================================================================================
// #2 – THE MEMORY'S PHOTOGRAPH IS SQUARE, AT THE WIDTH IT ALREADY HAS
// =================================================================================================
//
// ⚠ THE WIDTH IS READ, NOT ASSUMED, AND THAT IS THE WHOLE SHAPE OF THIS TEST. His sentence has two
// halves – square, and at the current width – and they are one assertion here: the window's height
// must equal the PAPER's own computed width less the frame `Polaroid` spends on each side. So a
// future change that widens the paper and leaves the window at 96 fails as loudly as one that
// forgets the height, and D81's 104 is asserted beside it as the number that may not move.

/** `Polaroid`'s own frame, `padding: 4px 4px 12px` – the paper each side of the window. Read from
 *  the component's cascade below rather than trusted from here; this is only the name. */
const POLAROID_SIDE_LIP = 4

/** The card's two hairlines. `overflow: hidden` clips at the padding box, so a footprint has the
 *  floor less one border at each end to live in. */
const CARD_HAIRLINE = 1

describe('round 37 #2 – the Recent memory photograph is square past 768', () => {
  for (const vp of [TABLET, DESKTOP]) {
    it(`⭐ at ${vp.width}px the window is as tall as it is wide, and the paper is still D81's 104`, () => {
      homeAt(vp)
      const paper = styleOf('.memory-polaroid')
      const window = styleOf('.memory-polaroid img')

      // HIS HALF, UNMOVED. Round 36 review item 6 set this and this round does not spend it.
      expect(px(paper.width, '.memory-polaroid width'), `the paper's width moved at ${vp.width}px`).toBe(104)

      // ⚠ `min-height` AND NOT `height`: Polaroid writes the window's height as an INLINE style off
      // its `photoHeight` prop, which beats every rule in the sheet. Reading `height` here would
      // read the prop – 52 – and a test that reads the thing the fix deliberately does not touch
      // cannot fail on the unfixed tree.
      const lipLeft = px(paper.paddingLeft, 'Polaroid padding-left')
      const lipRight = px(paper.paddingRight, 'Polaroid padding-right')
      expect(lipLeft, 'the frame stopped being the 4px lip this arithmetic reads').toBe(POLAROID_SIDE_LIP)
      expect(lipRight).toBe(POLAROID_SIDE_LIP)

      const across = px(paper.width, 'paper width') - lipLeft - lipRight
      const down = px(window.minHeight, '.memory-polaroid img min-height')
      expect(down, `the window is ${across} across and ${down} down at ${vp.width}px – still a rectangle`).toBe(across)
      expect(down, 'and 96 is 104 less the two 4px lips, not a typed number').toBe(96)
      // The prop is untouched, which is what keeps the phone where it is.
      expect(px(window.height, 'the inline photoHeight'), 'the prop was moved instead of the cascade').toBe(52)
    })
  }

  it('⭐⭐ …and the taller paper still fits the card, tilt and all, so the lip is not cut off square', () => {
    // THE ARITHMETIC A SCREENSHOT CANNOT DO. `.note-card` is `overflow: hidden`, so a footprint that
    // runs past the card's padding box is CUT – and the cut would land on the corner of the cream
    // lip, which reads as a rendering fault rather than as a photograph. A 104 x 112 rectangle
    // tilted by --tilt-4 spans w·|sin| + h·|cos| down the card; at his round-36 `top: 30px` that is
    // 11.92px through the bottom edge, which is why the offset moved and the card did not.
    for (const vp of [TABLET, DESKTOP]) {
      homeAt(vp)
      const paper = styleOf('.memory-polaroid')
      // ⚠ THE CARD IS FOUND FROM THE PHOTOGRAPH, not by a class of its own: the memory card carries
      // `.note-card.card-short` and nothing else, and reading the floor off the coach card next to
      // it would be a claim about a different box that happens to agree today.
      const cardEl = document.querySelector('.memory-polaroid')?.closest('.note-card')
      if (!cardEl) throw new Error('the polaroid is not inside a card – the measurement would be vacuous')
      const card = getComputedStyle(cardEl)
      const tilt = getComputedStyle(document.documentElement).getPropertyValue('--tilt-4').trim()
      const deg = px(tilt, '--tilt-4')
      expect(deg, 'the tilt token is gone, so this measurement would be vacuous').not.toBe(0)

      const w = px(paper.width, 'paper width')
      const h =
        px(paper.paddingTop, 'Polaroid padding-top') +
        px(styleOf('.memory-polaroid img').minHeight, 'window min-height') +
        px(paper.paddingBottom, 'Polaroid padding-bottom')
      const rad = (Math.abs(deg) * Math.PI) / 180
      const footprint = w * Math.sin(rad) + h * Math.cos(rad)

      const top = px(paper.top, '.memory-polaroid top')
      const floor = px(card.minHeight, '.note-card.card-short min-height')
      // The card's padding box: one hairline in at each end.
      const room = floor - 2 * CARD_HAIRLINE
      // The frame is placed by its UPRIGHT top edge and then rotated about its own centre, so the
      // tilted footprint's bottom is the centre plus half of it.
      const bottom = top + h / 2 + footprint / 2

      expect(
        bottom,
        `at ${vp.width}px the ${w}x${h} paper tilted ${deg}deg reaches ${bottom.toFixed(2)}px into a ` +
          `${room}px card, so \`overflow: hidden\` cuts the lip`,
      ).toBeLessThanOrEqual(room)
      expect(top + h / 2 - footprint / 2, 'and it does not run out of the top of the card either').toBeGreaterThanOrEqual(0)
      wrapper?.unmount()
      wrapper = null
    }
  })

  it('⚠ the tack moved with the photograph, because the two are one object', () => {
    // `.memory-tack`'s own note: «The tack that holds it down - moved with the polaroid it pins.»
    // Round 36 left them 4px apart at 30/26; the same 4px, 18px higher.
    homeAt(TABLET)
    const top = px(styleOf('.memory-polaroid').top, '.memory-polaroid top')
    const tack = px(styleOf('.memory-tack').top, '.memory-tack top')
    expect(top, 'the photograph is not where the fix puts it').toBe(12)
    expect(tack, 'the tack stayed behind at round 36\'s offset').toBe(8)
    expect(top - tack, 'the pin drifted off the corner it pins').toBe(4)
  })

  for (const vp of [PHONE, WIDE_PHONE]) {
    it(`⚠ at ${vp.width}px NOTHING moves: 68px of paper, a 52px window and the tack at 30`, () => {
      homeAt(vp)
      const paper = styleOf('.memory-polaroid')
      const window = styleOf('.memory-polaroid img')
      expect(px(paper.width, 'paper width'), `the phone's paper moved at ${vp.width}px`).toBe(68)
      expect(px(paper.top, 'paper top'), `the phone's photograph moved at ${vp.width}px`).toBe(34)
      expect(px(styleOf('.memory-tack').top, 'tack top'), `the phone's tack moved at ${vp.width}px`).toBe(30)
      expect(px(window.height, 'the inline photoHeight'), 'the phone window stopped being 52').toBe(52)
      // ⚠ THE ONE THAT SAYS THE BAND DID NOT LEAK. A `min-width` written as `max-width`, or the rule
      // moved to the base block, lands here first – and 60 x 52 is the phone's window, still a
      // rectangle, because he did not ask about it.
      // (happy-dom returns `''` for a property no rule sets, where a browser reports `0px`; both are
      // the same claim – nothing lifted this window – and neither is a number, so the string is read
      // rather than parsed.)
      const lifted = window.minHeight.trim()
      expect(['', '0px', '0', 'auto'], `the desktop's square window reached ${vp.width}px as "${lifted}"`).toContain(
        lifted,
      )
    })
  }
})
