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
