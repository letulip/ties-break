// =================================================================================================
// ⭐⭐⭐ ROUND 42 #3 – THE COACH PORTRAITS STOP BEING CUT IN HALF
// =================================================================================================
//
// The owner, off the deployed wave-5 build, 14.09: «верстка экрана тренеров немного сломалась: все
// картинки обрезаны сильно… надо сделать шире», and on his second pass, «портреты были хорошо
// сделаны до этого… либо чуть расширить, а текст ужать, либо вернуть как было. И проверить на других
// экранах тоже.» Of the shipped state he said half the head was not visible. (Quoted here and in
// src/style.css rather than in a template: tests/round13-nav.test.ts bans Cyrillic inside a `.vue`
// file entirely, comments included.)
//
// ⚠⚠ THE STRIP WAS NEVER THE THING THAT CHANGED – THE CARD WAS, which is why no commit looks like
// the regression. `.cm-art` is a fixed-width porthole onto a HEIGHT-DRIVEN portrait, so the share of
// the picture it shows is strip / (cardHeight x 162/264). Round 18 sized the porthole at 62px against
// a card whose picture was 57-75px wide; the card's height is its text, and the text has been growing
// ever since. Measured in Chromium on the real market with the app's own sheet and its own
// self-hosted type, the ordinary card at 375px is 208.34-238.52px of padding box, so the picture is
// 120.54-146.36px wide and the 62px porthole was showing 42-48% of it – and the mask reaches
// transparent at the clip, so half of even THAT was fading out.
//
// ⚠ THE UNIT OF MEASUREMENT IS THE HEAD BOX, AND IT WAS MEASURED RATHER THAN GUESSED. Each of the
// sixteen masters was rendered at 162px wide under a tenths grid: the head – hair or cap through the
// far cheek – spans 8% to 62% of the picture's width on all of them. That is 54% of the picture, so
// at 375px the head is 65-79px across. Which settles the choice his ruling left open: KEEPING 62 AND
// ONLY STEERING THE WINDOW IS ARITHMETICALLY IMPOSSIBLE, because no `object-position` fits a 79px
// head through a 62px window. The road taken is his first one – «чуть расширить, а текст ужать» –
// and the number is 96, the smallest strip that holds the whole head at every card the market draws
// with slack on BOTH sides. The sweep and the fixed-point search are in src/style.css.
//
// ⚠ WHY THIS FILE AND NOT round18-coach.test.ts. That file holds the CORRIDOR (the text clears the
// picture) and the FLOOR (the picture fills the strip); both re-aimed to the new numbers and both
// still measuring what they always did. What neither of them can say is the thing the owner actually
// reported – that the window holds the FACE – because nothing in this repo had a number for a face
// before this round. That claim is this file.
//
// ⚠ HAPPY-DOM HAS NO LAYOUT ENGINE, so `getBoundingClientRect` is zeros here and the card's height
// cannot be read off the runner. It cannot be MODELLED either: `fits.ts`'s box model is a deliberate
// floor tuned on a dialog, and pointed at a `.cm-row` it reports 145-163px against the browser's
// 208-255 – it takes the tallest child of a flex row and cannot see the text column's real stacking.
// So the card heights below are CHROMIUM MEASUREMENTS pinned as named constants with their
// provenance, exactly as `fits.ts`'s own ADVANCE and src/style.css's ceiling tables are, and what the
// runner reads is the CASCADE: the strip, the corridor, the floor, the fit and the steer. Re-measure
// the pins with the same harness if the card gains a line.
//
// ⚠ MEASURED AT THE PARITY SET 375 / 768 / 900 / 1280 – his standing rule of 14.09, «визуальную
// проверку на всех экранах надо тоже заложить в билдера в спеку при внесении правок» – because the
// market carries a `min-width: 768px` block and a second one at 1024, and because this round found
// the same cut face on the tablet and the desktop that he reported on the phone.
//
// ⚠ THE ORDER IS ALWAYS `setViewport` -> mount -> read, and `attachTo: document.body` is mandatory:
// happy-dom evaluates a media query on an element's FIRST computed-style read and caches it, and
// applies no rule at all to a detached tree (the note beside `TABLET` in fits.ts).
//
// ⚠ MUTATION-VERIFIED – five mutations, each applied alone to the shipped sheet and really run, and
// this is what each one actually reddened. ⭐ No two of them redden the same set, which is the point
// of having five: each claim in this file has a mutation that only it can catch.
//
//   * `.cm-art { width: 62px }` WITH `.cm-body { margin-left: 74px }` – the state he reported, the
//     pair moved back together -> 4 red, §1 at all four widths and NOTHING else. That is the correct
//     separation and worth reading: the corridor is still 12px and the 168px floor still supplies a
//     62px strip, so every other claim in this file is TRUE on the build he complained about. The
//     face was the only thing wrong with it, and before this round nothing measured a face;
//   * `object-position` dropped, leaving a bare `object-fit: cover` – the plausible half-fix, since
//     `cover` centres the window on the frame and the head is painted left of centre on all sixteen
//     masters -> 5 red, §1 at all four widths plus §2's steer arm;
//   * `.cm-row { min-height: 104px }`, the pre-round-42 floor under the new strip -> §2's
//     no-vertical-crop arm ALONE. The head still fits; what breaks is that the picture stops filling
//     its box, so `cover` starts cropping him vertically. A bound, not a restatement of two numbers;
//   * `.cm-body { margin-left: 74px }` with the strip left at 96 – the OTHER half-fix, the picture
//     growing over the words -> §3's corridor arm ALONE;
//   * `.cm-row.current .cm-art { width: 92px }`, the hired window slipping under the shop's 96 ->
//     6 red: §1 at all four widths (his own coach's head stops fitting), §3 (his corridor becomes 28)
//     and §4 by name. This is the arm that says the two windows move together or not at all.
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
// The runner-sized ceiling round36-review.test.ts uses and for its reason: these cases mount a real
// screen over a career walked by the real engine, and GitHub's 2-core runner is measured at 4-5x this
// machine on this suite.
vi.setConfig({ testTimeout: 30_000 })
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { nextTick } from 'vue'
// ⚠ THE APP'S OWN SHEET. `.cm-row` / `.cm-art` / `.cm-body` live in src/style.css, not in the SFC;
// without this import every computed value below is the initial one and every assertion passes on a
// broken build.
import '../../src/style.css'
import CoachMarketScreen from '../../src/components/screens/CoachMarketScreen.vue'
import HomeScreen from '../../src/components/screens/HomeScreen.vue'
import TournamentFlow from '../../src/components/TournamentFlow.vue'
import { useGameStore } from '../../src/stores/game'
import {
  createWorld,
  decideKnock,
  enterEvent,
  pendingKnock,
  tickWeek,
  toSnapshot,
} from '../../src/engine/world'
import { rngFromSeed } from '../../src/engine/rng'
import { DEFAULT_PROFILE, type CoachTier, type Snapshot } from '../../src/shared/protocol'
import { DESKTOP, PHONE, TABLET, type Viewport, setViewport } from './fits'

// ⚠ THIS RUNNER HAS NO localStorage AND HomeScreen READS IT AT SETUP (`tb:kidAvatarHintSeen`), so a
// mount throws before anything can be measured. The same shim round18-coach.test.ts installs: the
// browser's own object is supplied rather than the component weakened to suit the runner.
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

function assertSheetPresent(): void {
  if (!document.head.querySelector('style')) {
    throw new Error('no stylesheet in the document – the component project needs `css: true`')
  }
}

/** px off a computed value. Throws rather than returning NaN: a property that computed to `''` means
 *  the rule never reached the element, and a silent NaN would pass nothing and fail nothing. */
function px(value: string, what: string): number {
  const n = Number.parseFloat(value)
  if (!Number.isFinite(n)) throw new Error(`${what} computed to "${value}" – the rule did not reach the element`)
  return n
}

// -------------------------------------------------------------------------------------------------
// THE CHROMIUM PINS
// -------------------------------------------------------------------------------------------------
// Measured 15.09 on the real market: the component's own rendered rows, the app's own src/style.css,
// its own self-hosted Manrope/Sora, the real 162x264 portraits, in an iframe at each parity width so
// the media queries evaluate against it, read after `document.fonts.ready` (a reading taken before
// the webfonts land wraps differently and is worth 30px on a card).
//
// The tallest ORDINARY card across the four widths, padding box. 375 is where it lives: the phone's
// card is the narrowest, so its notes wrap the most. 768 and 1280 top out at 238.52 and 900 at
// 179.34, so this one number is the worst case at every width and is asked at all four.
const TALLEST_CARD = 254.52
/** The tallest HIRED card, same harness, same width. It carries a plaque and a travel line on top of
 *  everything an ordinary card carries, so it is always the taller of the two. */
const TALLEST_HIRED = 272.69
/** The head box, as a fraction of the picture's own width. Measured by rendering each of the sixteen
 *  masters at 162px under a grid at every 10%: hair or cap at 8%, far cheek at 62%, on all sixteen. */
const HEAD_LEFT = 0.08
const HEAD_RIGHT = 0.62
/** Every master is 162 wide; fifteen are 264 tall and budget-2 is 280.
 *  ⚠ THE TWO CLAIMS BELOW HAVE OPPOSITE WORST CASES, which is why both ratios are named. For HEAD
 *  CONTAINMENT the enemy is a WIDE picture, because it makes the window a smaller share of it – that
 *  is the 264 master. For the NO-VERTICAL-CROP floor the enemy is a NARROW picture, because the box
 *  stops being narrower than the image's own ratio – that is the 280 one. Using either ratio for
 *  both questions would flatter one of them. */
const WIDEST_RATIO = 162 / 264
const NARROWEST_RATIO = 162 / 280

/** A real career on the Coaches tab, at the width the case is about. */
function careerSnapshot(coachTier: CoachTier, seed = `r42p-${coachTier}`): Snapshot {
  const world = createWorld(seed, { ...DEFAULT_PROFILE, coachTier })
  const rng = rngFromSeed(world.seed)
  for (let i = 0; i < 40; i++) tickWeek(world, rng)
  return toSnapshot(world)
}

const MARKET_SNAPSHOT = careerSnapshot('middle')

/** ⚠ 900 IS HIS OWN – the top of the tablet band the wave gate reads at (docs/specs/responsive-2026-09.md,
 *  «768 как раз тоже можно до 900 тянуть вполне»), and the one width of the four where the market's
 *  cards are short enough that the old 66px strip was nearly enough. */
const WIDE_900: Viewport = { width: 900, height: 1024 }
const PARITY: Viewport[] = [PHONE, TABLET, WIDE_900, DESKTOP]

async function coachesAt(vp: Viewport) {
  setViewport(vp)
  useGameStore().snapshot = MARKET_SNAPSHOT
  const wrapper = mount(CoachMarketScreen, {
    global: { stubs: { teleport: true } },
    attachTo: document.body,
  })
  const pill = wrapper.findAll('.tb-seg .tab-pill').find((b) => b.text() === 'Coaches')
  await pill!.trigger('click')
  await nextTick()
  const rows = wrapper.findAll('.cm-row')
  expect(rows.length, `the market drew cards at ${vp.width}px`).toBeGreaterThan(3)
  return { wrapper, rows }
}

/**
 * How far INSIDE the window each edge of the head lands, in px of the picture, on a card `cardH`
 * tall. Negative on either side means the head is cut on that side.
 *
 * `object-position: p%` places the window's left edge at p x (picture - strip), so in picture
 * fractions the window is [L, L + w] with w = strip / picture and L = p (1 - w). The head is
 * [HEAD_LEFT, HEAD_RIGHT]. Both ends are reported because they fail for opposite reasons: a steer
 * that is too small cuts the far cheek, one that is too large cuts the hair.
 */
function headClearance(strip: number, steer: number, cardH: number): { left: number; right: number; picture: number } {
  const picture = cardH * WIDEST_RATIO
  const w = strip / picture
  const l = steer * (1 - w)
  return {
    left: (HEAD_LEFT - l) * picture,
    right: (l + w - HEAD_RIGHT) * picture,
    picture,
  }
}

/** The `object-position` X as a fraction, read off the cascade rather than assumed. */
function steerOf(img: Element): number {
  const pos = getComputedStyle(img).objectPosition
  const m = /^(-?[\d.]+)%/.exec(pos.trim())
  if (!m) throw new Error(`object-position computed to "${pos}" – no percentage steer to read`)
  return Number(m[1]) / 100
}

// =================================================================================================
// §1 – THE WINDOW HOLDS THE WHOLE HEAD, AT EVERY WIDTH OF THE PARITY SET
// =================================================================================================
describe('round 42 #3 – the coach market\'s porthole holds the whole face', () => {
  beforeEach(() => setActivePinia(createPinia()))
  afterEach(() => setViewport(PHONE))

  for (const vp of PARITY) {
    it(`⭐⭐ at ${vp.width}px every card's head is inside the window, on the tallest card the market draws`, async () => {
      assertSheetPresent()
      const { wrapper, rows } = await coachesAt(vp)
      const hired = rows.filter((r) => r.classes().includes('current'))
      const ordinary = rows.filter((r) => !r.classes().includes('current'))
      expect(hired.length, 'the fixture has the coach she employs').toBe(1)
      expect(ordinary.length, 'and shop cards beside him').toBeGreaterThan(2)

      for (const [row, cardH, what] of [
        [ordinary[0], TALLEST_CARD, 'a shop card'],
        [hired[0], TALLEST_HIRED, 'the hired card'],
      ] as const) {
        const art = row.find('.cm-art')
        const img = row.find('.cm-art img')
        expect(art.exists() && img.exists(), `${what} draws a portrait`).toBe(true)

        const strip = px(getComputedStyle(art.element).width, '.cm-art width')
        const steer = steerOf(img.element)
        const { left, right, picture } = headClearance(strip, steer, cardH)

        // THE OWNER'S OWN REPORT, AS TWO NUMBERS. «половина головы не видна»: on the shipped 62px
        // strip this right-hand figure was -28.75px at 375 and -18.66 at 768.
        expect(
          left,
          `${what} at ${vp.width}px: the hair is cut – a ${strip}px window at ${steer * 100}% over a ` +
            `${picture.toFixed(2)}px picture leaves the head's left edge ${left.toFixed(2)}px outside`,
        ).toBeGreaterThan(0)
        expect(
          right,
          `${what} at ${vp.width}px: the far cheek is cut – a ${strip}px window at ${steer * 100}% over a ` +
            `${picture.toFixed(2)}px picture leaves the head's right edge ${right.toFixed(2)}px outside`,
        ).toBeGreaterThan(0)
      }
      wrapper.unmount()
    })
  }

  // ===============================================================================================
  // §2 – AND IT IS A HORIZONTAL CLIP, NEVER A VERTICAL CROP
  // ===============================================================================================
  it('⚠ the picture is still sized by HEIGHT – `cover` on a narrow box spends its overflow sideways', async () => {
    // A2c/d, the owner's 28.07 ruling this treatment inherits: «the whole frame is on screen – no
    // vertical crop». `cover` scales by max(boxW/imgW, boxH/imgH); while the box is NARROWER than the
    // picture's own ratio the height term wins, the picture is scaled to exactly the box's height,
    // and every overflowing pixel is spent sideways – byte for byte the crop `overflow: hidden` was
    // already making. The floor below is what keeps the box on the narrow side of that line, and it
    // is asked at the NARROWEST master, because that is the one that runs out first.
    assertSheetPresent()
    for (const vp of PARITY) {
      const { wrapper, rows } = await coachesAt(vp)
      for (const row of [rows.filter((r) => !r.classes().includes('current'))[0], rows.find((r) => r.classes().includes('current'))!]) {
        const art = row.find('.cm-art').element
        const img = row.find('.cm-art img').element
        const style = getComputedStyle(img)
        expect(style.height, `the image is sized by height at ${vp.width}px`).toBe('100%')
        expect(style.objectFit, `the overflow is clipped, never squeezed, at ${vp.width}px`).toBe('cover')

        const floor = px(getComputedStyle(row.element).minHeight, '.cm-row min-height')
        const strip = px(getComputedStyle(art).width, '.cm-art width')
        const supplied = (floor - 2) * NARROWEST_RATIO
        expect(
          supplied,
          `at ${vp.width}px a ${floor}px row supplies ${supplied.toFixed(2)}px of the narrowest master for a ` +
            `${strip}px window – below this the box is wider than the picture and \`cover\` crops him vertically`,
        ).toBeGreaterThanOrEqual(strip)
      }
      wrapper.unmount()
    }
  })

  it('⚠ the window is AIMED, and a bare `cover` would centre it on the frame instead of on the face', async () => {
    // The half-fix this arm exists for. `object-fit: cover` with no `object-position` defaults to
    // 50% 50%, which centres the window on the PICTURE – and the head is painted left of centre on
    // all sixteen masters, so a centred window loses the far cheek exactly as the old left-edge clip
    // did. The steer is therefore part of the fix and not decoration.
    assertSheetPresent()
    for (const vp of PARITY) {
      const { wrapper, rows } = await coachesAt(vp)
      const img = rows[0].find('.cm-art img').element
      expect(getComputedStyle(img).objectPosition, `the steer at ${vp.width}px`).toBe('12% 50%')
      expect(steerOf(img), 'and it is not the default centre').not.toBe(0.5)
      wrapper.unmount()
    }
  })

  // ===============================================================================================
  // §3 – THE TWO RULES THE WIDENING WAS NOT ALLOWED TO BREAK
  // ===============================================================================================
  it('⚠ round-18 #2\'s corridor survives the widening, on every card at every width', async () => {
    // «10-15 пикселей, чтобы весь текстовый блок на картинку не попадал» – his own round-18 ask, and
    // the reason `.cm-body` had to move with the strip rather than the picture simply growing over
    // the words. Measured against the STRIP, which is the picture's real right edge.
    assertSheetPresent()
    for (const vp of PARITY) {
      const { wrapper, rows } = await coachesAt(vp)
      for (const row of rows) {
        const strip = px(getComputedStyle(row.find('.cm-art').element).width, '.cm-art width')
        const text = px(getComputedStyle(row.find('.cm-body').element).marginLeft, '.cm-body margin-left')
        const air = text - strip
        expect(air, `the text clears the portrait at ${vp.width}px (${text} - ${strip})`).toBeGreaterThanOrEqual(10)
        expect(air, `and has not walked into the middle of the card at ${vp.width}px`).toBeLessThanOrEqual(15)
      }
      wrapper.unmount()
    }
  })

  it('⚠ and coach-match-edge.md §4 – a card nobody hired never shows more of its man than hers does', async () => {
    // The anti-shopping rule, and the whole reason the hired window moved at all: the owner did not
    // ask for it again this round, so it is here because §4 forces it up when the shop window rises.
    assertSheetPresent()
    for (const vp of PARITY) {
      const { wrapper, rows } = await coachesAt(vp)
      const hired = px(
        getComputedStyle(rows.find((r) => r.classes().includes('current'))!.find('.cm-art').element).width,
        'current .cm-art width',
      )
      for (const row of rows.filter((r) => !r.classes().includes('current'))) {
        const shop = px(getComputedStyle(row.find('.cm-art').element).width, '.cm-art width')
        expect(hired, `the reserved window is still the wider one at ${vp.width}px`).toBeGreaterThan(shop)
      }
      wrapper.unmount()
    }
  })
})

// =================================================================================================
// §4 – THE SWEEP: THE OTHER SCREENS THAT DRAW A COACH, AND THE CHANGE STOPPING AT THE MARKET
// =================================================================================================
//
// «И проверить на других экранах тоже» – his second-pass sentence, and the standing rule it became.
// `coachPortraitUrl` has exactly three callers in src/ (`git grep -l coachPortraitUrl -- src`): the
// market's `.cm-art`, Home's coach card `.coach-art` and the pre-match tile's `.tf-brief-art`. The
// Kid page names her coach in words and draws no portrait, and the Support-staff tab draws none
// either – checked, and said out loud here so the next sweep does not have to re-derive the list.
//
// ⚠ WHAT THIS SECTION ASSERTS IS THAT THE FIX DID NOT LEAK, and that is the honest claim for these
// two. Neither declares a width on the phone, so the porthole IS the picture and there is nothing to
// cut; Home's own 84px strip past 768 is round 37 #1's and was measured against its 138px card then.
// Round 42 #3 changes `.cm-art` only, and a rule written one class too loose – on `img` inside any
// masked strip, say – would reach both of these and crop a card nobody complained about.
describe('round 42 #3 – the sweep across every screen that draws a coach', () => {
  beforeEach(() => setActivePinia(createPinia()))
  afterEach(() => setViewport(PHONE))

  /** A real career ticked to a real pending tournament – round41-coach-portrait-tile.test.ts's own
   *  recipe, which is the only way the pre-match tile renders at all. */
  function atTournament(seed: string, coachTier: CoachTier): Snapshot {
    const world = createWorld(seed, { ...DEFAULT_PROFILE, coachTier })
    const rng = rngFromSeed(world.seed)
    for (let i = 0; i < 80; i++) {
      world.fundsCents = Math.max(world.fundsCents, 500_000_00)
      if (pendingKnock(world)) decideKnock(world, 'rest')
      for (const e of world.season) {
        if (e.week > world.week && !world.entries.includes(e.id)) {
          try {
            enterEvent(world, e.id)
          } catch {
            /* eligibility and caps are the engine's business */
          }
        }
      }
      tickWeek(world, rng)
      if (world.pendingTournament) return toSnapshot(world)
    }
    throw new Error('no tournament reached – the fixture is broken, not the assertion')
  }

  const TOURNAMENT_SNAPSHOT = atTournament('r42-sweep-tile', 'middle')

  for (const vp of PARITY) {
    it(`⚠ at ${vp.width}px Home's coach card keeps its own treatment – height-driven, unclipped, no \`cover\``, async () => {
      assertSheetPresent()
      setViewport(vp)
      useGameStore().snapshot = MARKET_SNAPSHOT
      const wrapper = mount(HomeScreen, {
        props: { recapFresh: false },
        global: { stubs: { teleport: true } },
        attachTo: document.body,
      })
      const art = wrapper.find('.coach-card .coach-art')
      expect(art.exists(), `Home draws the coach's portrait at ${vp.width}px`).toBe(true)
      const img = getComputedStyle(art.find('img').element)
      expect(img.height, `Home's portrait is sized by height at ${vp.width}px`).toBe('100%')
      expect(img.width, `and takes whatever width that gives it at ${vp.width}px`).toBe('auto')
      expect(
        img.objectFit === '' || img.objectFit === 'fill',
        `the market's clip has not reached Home at ${vp.width}px (read back as "${img.objectFit}")`,
      ).toBe(true)
      // ...and the market's own class is nowhere on this screen, which is what scopes the change.
      expect(wrapper.find('.cm-art').exists(), 'Home draws no market row').toBe(false)
      wrapper.unmount()
    })
  }

  for (const vp of PARITY) {
    it(`⚠ at ${vp.width}px the pre-match tile keeps its own treatment too`, () => {
      assertSheetPresent()
      setViewport(vp)
      useGameStore().snapshot = TOURNAMENT_SNAPSHOT
      const wrapper = mount(TournamentFlow, { attachTo: document.body })
      const art = wrapper.find('.tf-brief-art')
      expect(art.exists(), `the splash draws the coach at ${vp.width}px`).toBe(true)
      const img = getComputedStyle(art.find('img').element)
      expect(img.height, `the tile's portrait is sized by height at ${vp.width}px`).toBe('100%')
      expect(img.width, `and takes whatever width that gives it at ${vp.width}px`).toBe('auto')
      expect(
        img.objectFit === '' || img.objectFit === 'fill',
        `the market's clip has not reached the splash at ${vp.width}px (read back as "${img.objectFit}")`,
      ).toBe(true)
      expect(wrapper.find('.cm-art').exists(), 'the splash draws no market row').toBe(false)
      wrapper.unmount()
    })
  }
})
