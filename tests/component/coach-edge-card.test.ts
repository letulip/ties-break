// THE COACH'S EDGE ON SCREEN T (docs/specs/coach-match-edge.md §4) – the market card's per-match
// corridor, and the plaque that carries one coach's own number once a season has been paid for it.
//
// WHAT THE SLICE HAS TO GET RIGHT, and each of the five is a test below:
//   1. an UNHIRED card shows its RUNG's corridor and never an individual number. This is the whole
//      anti-shopping rule of §4: a number on an unhired card turns the market into a shop window
//      with the prices written on the back – hire, read, fire, repeat until the 0.7 budget coach
//      turns up – and since the value is a property of the PERSON, that search would always succeed.
//   2. the coach she HAS, before a season is up, shows the corridor and a sentence that says so.
//   3. after a season, his own realised number – the payoff of the budget lottery.
//   4. neither addition walks back onto the portrait.
//   5. every figure on screen comes from the SNAPSHOT. A corridor typed into the template would
//      pass 1-3 and be a lie the first time the engine re-cut the bands.
//
// ⚠ HAPPY-DOM HAS NO LAYOUT – `getBoundingClientRect` is zeros here, exactly as the header of
// tests/component/round18-coach.test.ts records. So the geometry test reads the CASCADE through
// `getComputedStyle` on attached elements, and the numbers it checks were MEASURED IN A REAL
// BROWSER first (headless Chromium, the app's own style.css, the real Manrope/Sora webfonts, the
// real 162x264 portraits, viewports 320 and 375, DPR 2), by rendering the component's own output.
// What the browser said, per card, ink-to-picture measured with a Range over each text node rather
// than off a box:
//
//   EVERY CARD, BOTH WIDTHS, BEFORE AND AFTER THIS SLICE – `.cm-art` 62.00px wide, first ink at
//   75.00px from the row's left border, clearance 12.00px. Sixteen cards x two widths x three
//   builds (baseline / hired-unrevealed / hired-revealed): 12.00 on every one, no exceptions. The
//   portrait's own IMAGE is 62-111px wide depending on row height and is clipped by the strip,
//   which is why the added lines are free – see below.
//
//   ROW HEIGHT, 320px: ordinary card 109.34 -> 122.34 (+13.0, the corridor's line). Elite cards
//   with a three-line load note 123.52 -> 136.52, same +13.0. The HIRED card 123.52 -> 168.86
//   (+45.3: the corridor line plus a two-line plaque). At 375px the hired card is 168.86 before the
//   reveal and 168.86 after it – the sentence changes, the card does not jump.
//
// ⚠ AND THAT IS ONLY SAFE BECAUSE OF ROUND-18 #2. Until the strip was given a width, a taller row
// meant a WIDER portrait (the image is height-driven), so every attempt to push text right was
// chased by the picture – measured then at 62 -> 12.6px of overlap and 80 -> 13.1px, worse. Adding
// two lines of text to this card before that fix would have EATEN the clearance. `.cm-art` is
// 62px with `overflow: hidden` now, so growth downwards costs nothing sideways, and the browser
// numbers above are the proof: the tallest card in the list has the same 12.00px as the shortest.
//
// ⚠ MUTATION-VERIFIED – eleven mutations run, and this is what each one actually reddened. Nothing
// below passed against a broken build, and no mutation reddened the geometry tests and the copy
// tests together, which is what says the two are measuring different things:
//   * `formatEdge([0.2, 0.7])` – the corridor hard-coded into the script -> §1's corridor test, §2,
//     §3 and §5's corridor test. Every card in the list turns into a budget card;
//   * the corridor replaced by a per-coach two-decimal figure (the shop window §4 forbids) -> §1
//     BOTH tests, plus §2, §3 and §5's corridor test;
//   * `plaqueLine` returning '' before the reveal -> §2 and §5's plaque test, and nothing else;
//   * the plaque rendered on every row rather than on `r.current` -> §1's second test, §2 and §3;
//   * the not-yet line replaced by the revealed one -> §2 and §5's plaque test;
//   * the week counter hard-coded to "4 weeks of 52" -> §5's plaque test ALONE, which is exactly
//     the point of that test: the sentence is right and its numbers are not the engine's;
//   * `realisedPct.toFixed(1)` instead of `(2)` -> §3 and §5's plaque test;
//   * `.cm-body { margin-left: 62px }` (round-18's own shipped defect) -> §4 at BOTH widths;
//   * `.cm-plaque { margin-left: -20px }` -> §4 at both widths. This is the mutation that proves §4
//     is measuring the ADDED elements and not merely re-stating round-18's rule about their parent;
//   * `.cm-art` losing `overflow: hidden` -> §4 at both widths;
//   * `.cm-plaque { position: absolute; left: 4px }` -> §4 at both widths.
import { describe, it, expect, beforeEach } from 'vitest'
import { mount, type DOMWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { nextTick } from 'vue'
// ⚠ THE APP'S OWN SHEET. `.cm-art` / `.cm-body` / `.cm-uplift` / `.cm-plaque` live in src/style.css,
// not in the SFC; without this import every computed value below is the initial one and the geometry
// test passes on a broken build.
import '../../src/style.css'
import CoachMarketScreen from '../../src/components/screens/CoachMarketScreen.vue'
import { useGameStore } from '../../src/stores/game'
import { createWorld, tickWeek, toSnapshot } from '../../src/engine/world'
import { rngFromSeed } from '../../src/engine/rng'
import { coachEdgePp, COACH_EDGE_CORRIDOR_PP, HIREABLE_TIERS } from '../../src/engine/coach'
import { DEFAULT_PROFILE, type CoachTier, type Snapshot } from '../../src/shared/protocol'

/** Refuses to run blind: a document with no stylesheet computes every property to its initial
 *  value, which would make "the text column starts at 74" pass on the exact build it is guarding. */
function assertSheetPresent(): void {
  if (!document.head.querySelector('style')) {
    throw new Error('no stylesheet in the document – the component project needs `css: true`')
  }
}

/** px off a computed value, with `''` read as the property never having been set – which for the
 *  offsets below is the honest reading (happy-dom leaves an unstyled `margin-left` empty, and an
 *  unstyled margin IS zero). A junk value still throws rather than becoming a silent NaN. */
function px(value: string, what: string): number {
  if (value === '') return 0
  const n = Number.parseFloat(value)
  if (!Number.isFinite(n)) throw new Error(`${what} computed to "${value}"`)
  return n
}

const SEED = 'edge-card'

/** A real career through the real protocol at the coach rung the test is about, ticked far enough
 *  for the engine's own reveal gate to be on the side the test needs. Nothing here fakes the gate:
 *  `coachEdgeView` decides it from `coachSinceWeek`, and 52 ticks is what a season IS. */
function career(coachTier: CoachTier, weeks: number, seed = `${SEED}-${coachTier}`) {
  const world = createWorld(seed, { ...DEFAULT_PROFILE, coachTier })
  const rng = rngFromSeed(world.seed)
  for (let i = 0; i < weeks; i++) tickWeek(world, rng)
  return { world, snapshot: toSnapshot(world) }
}

async function mountCoaches(snapshot: Snapshot, attach = false) {
  const store = useGameStore()
  store.snapshot = snapshot
  const wrapper = mount(CoachMarketScreen, {
    global: { stubs: { teleport: true } },
    ...(attach ? { attachTo: document.body } : {}),
  })
  // A hired career lands on the Coaches tab by itself (round-18 #3); press it anyway so the test
  // does not silently depend on that rule.
  const pill = wrapper.findAll('.tb-seg .tab-pill').find((b) => b.text() === 'Coaches')
  await pill!.trigger('click')
  await nextTick()
  return wrapper
}

/** The card's own words for a corridor. Written out longhand rather than imported from the
 *  component, so the FORMAT is pinned too: a change to either half has to be a deliberate one. */
const corridorText = (tier: CoachTier): string => {
  const [lo, hi] = COACH_EDGE_CORRIDOR_PP[tier]
  return `+${lo.toFixed(1)}-${hi.toFixed(1)}% per match`
}

/** An individual value's shape: a per-match figure quoted to TWO decimals, which is what and only
 *  what the plaque prints. The corridors are tenths, prices are dollars and the season uplift is
 *  tenths, so nothing else on a card can produce this. */
const INDIVIDUAL = /\+\d+\.\d\d%/

// =================================================================================================
// 1 – THE MARKET SELLS A PRICE BRACKET, NOT A MAN
// =================================================================================================
describe('the corridor on an unhired card', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('every tier shows its own corridor, identical on every card in the rung', async () => {
    const { snapshot } = career('middle', 4)
    const wrapper = await mountCoaches(snapshot)

    for (const tier of HIREABLE_TIERS) {
      const section = wrapper.find(`#coach-tier-${tier}`)
      expect(section.exists(), `the ${tier} rung has a section`).toBe(true)
      const rows = section.findAll('.cm-row').filter((r) => !r.classes().includes('current'))
      expect(rows.length, `the ${tier} rung has unhired cards`).toBeGreaterThan(0)

      for (const row of rows) {
        const edge = row.find('.cm-edge')
        expect(edge.exists(), `a ${tier} card states what the rung buys per match`).toBe(true)
        // THE RUNG'S BAND, and the same string on every card in it – which is what makes it
        // impossible for the list to be leaking a per-coach value under a range's clothing.
        expect(edge.text(), `${tier} card quotes its rung`).toBe(corridorText(tier))
      }
    }
    wrapper.unmount()
  })

  it('and no card carries the number of the man standing on it', async () => {
    // THE ANTI-SHOPPING CLAIM, stated against the engine rather than against a regex alone: for
    // every unhired coach in the list, ask the engine what he is actually worth and confirm that
    // figure is nowhere on his card. This is the assertion that fails if somebody ever "improves"
    // the market by showing the real value.
    const { world, snapshot } = career('middle', 4)
    const wrapper = await mountCoaches(snapshot)
    const rows = wrapper.findAll('.cm-row')
    expect(rows.length, 'the list drew cards to check').toBeGreaterThan(8)

    const market = snapshot.coachMarket
    let checked = 0
    for (const row of rows) {
      if (row.classes().includes('current')) continue
      const id = market.find((m) => row.text().includes(m.name))!.id
      const pp = coachEdgePp(world.seed, id)
      expect(pp, 'the engine has a real number for this coach').toBeGreaterThan(0)
      expect(row.text(), `${id}'s own value is not printed`).not.toContain(pp.toFixed(2))
      expect(row.text(), `${id}'s card quotes no individual figure at all`).not.toMatch(INDIVIDUAL)
      expect(row.find('.cm-plaque').exists(), `${id} has no plaque – he is not hers`).toBe(false)
      checked++
    }
    expect(checked, 'every unhired card was checked').toBeGreaterThan(8)
    wrapper.unmount()
  })
})

// =================================================================================================
// 2 – THE COACH SHE HAS, BEFORE THE SEASON IS UP
// =================================================================================================
describe('the plaque before the reveal', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('says it is too early and says when – and still quotes only the rung', async () => {
    const { world, snapshot } = career('middle', 4)
    expect(snapshot.coachEdge.revealed, 'four weeks is not a season').toBe(false)
    expect(snapshot.coachEdge.realisedPct, 'and the engine offers no number').toBeNull()
    expect(snapshot.coachEdge.weeksTogether).toBe(4)

    const wrapper = await mountCoaches(snapshot)
    const current = wrapper.findAll('.cm-row').filter((r) => r.classes().includes('current'))
    expect(current.length, 'exactly one card is hers').toBe(1)
    const row = current[0]

    // The corridor is still the rung's, on the hired card as on every other.
    expect(row.find('.cm-edge').text()).toBe(corridorText('middle'))
    // ...and the plaque is a sentence, not a blank.
    expect(row.find('.cm-plaque').text()).toBe('Too early to tell where in that band – 4 weeks of 52.')
    // THE NUMBER IS NOWHERE, including the one the engine would hand over if asked.
    expect(row.text(), 'no individual figure anywhere on the card').not.toMatch(INDIVIDUAL)
    expect(row.text()).not.toContain(coachEdgePp(world.seed, world.coachId).toFixed(2))
    // And nobody else grew a plaque.
    expect(wrapper.findAll('.cm-plaque').length, 'one plaque, on one card').toBe(1)
    wrapper.unmount()
  })
})

// =================================================================================================
// 3 – ...AND AFTER IT
// =================================================================================================
describe('the plaque after a season', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('carries this coach\'s own realised number', async () => {
    const { world, snapshot } = career('middle', 56)
    expect(snapshot.coachEdge.revealed, 'a season and then some has passed').toBe(true)
    const realised = snapshot.coachEdge.realisedPct!
    // IT IS HIS, not the rung's midpoint and not a re-read of the band: the same pure draw off his
    // id that the match engine composes her player from.
    expect(realised).toBeCloseTo(coachEdgePp(world.seed, world.coachId), 12)
    const [lo, hi] = COACH_EDGE_CORRIDOR_PP.middle
    expect(realised).toBeGreaterThanOrEqual(lo)
    expect(realised).toBeLessThanOrEqual(hi)

    const wrapper = await mountCoaches(snapshot)
    const row = wrapper.findAll('.cm-row').filter((r) => r.classes().includes('current'))[0]
    expect(row.find('.cm-plaque').text()).toBe(
      `A season together – the number is +${realised.toFixed(2)}% per match.`,
    )
    // The rung's band stays beside it – the corridor is what the realised figure is read against,
    // and it is the whole reason a budget lottery is worth playing.
    expect(row.find('.cm-edge').text()).toBe(corridorText('middle'))
    // ...and the reveal is HIS card's business alone. The other fifteen are still a market.
    expect(wrapper.findAll('.cm-plaque').length).toBe(1)
    for (const other of wrapper.findAll('.cm-row').filter((r) => !r.classes().includes('current'))) {
      expect(other.text()).not.toMatch(INDIVIDUAL)
    }
    wrapper.unmount()
  })
})

// =================================================================================================
// 4 – THE ADDED TEXT STAYS OFF THE PORTRAIT
// =================================================================================================
describe('the added lines clear the portrait', () => {
  beforeEach(() => setActivePinia(createPinia()))

  /** WHERE THE FIRST INK OF ONE ELEMENT SITS, in px from the row's padding-box left edge – which is
   *  where `.cm-art` starts, so it is directly comparable with the strip's width.
   *
   *  `.cm-body` is the text column and carries the offset; anything inside it can still walk left
   *  with a negative margin, a padding on an ancestor or an escape into `position: absolute`, so
   *  each of those is read rather than assumed. That is what makes this a measurement of the added
   *  elements and not a re-statement of round-18's rule about their parent. */
  function inkLeft(row: DOMWrapper<Element>, sel: string): number {
    const el = row.find(sel).element as HTMLElement
    const body = row.find('.cm-body').element as HTMLElement
    const bodyStyle = getComputedStyle(body)
    let left = px(bodyStyle.marginLeft, '.cm-body margin-left') + px(bodyStyle.paddingLeft, '.cm-body padding-left')
    const own = getComputedStyle(el)
    // An absolutely positioned child would be measured off the row, not off this column – it is not
    // how any of these are drawn, and the test says so out loud rather than trusting it.
    expect(own.position === '' || own.position === 'static', `${sel} is in the text flow`).toBe(true)
    left += px(own.marginLeft, `${sel} margin-left`) + px(own.paddingLeft, `${sel} padding-left`)
    left += px(own.textIndent, `${sel} text-indent`)
    return left
  }

  for (const width of [320, 375]) {
    it(`at ${width}px the corridor and the plaque start clear of the picture`, async () => {
      assertSheetPresent()
      // Both widths are exercised because both are real phones the owner reads this on. The cascade
      // that produces the numbers below carries no breakpoint, which is itself the claim: there is
      // no width at which this geometry changes, and a media query added under it would have to
      // pass here twice.
      // happy-dom's own viewport handle, which is not on the DOM lib's `Window` – hence the cast
      // rather than a `declare global`, which would leak this runner's shape into every file.
      const runner = window as unknown as { happyDOM?: { setViewport(v: { width: number; height: number }): void } }
      runner.happyDOM?.setViewport({ width, height: 800 })
      Object.defineProperty(window, 'innerWidth', { value: width, configurable: true })

      // THE TIGHTEST STATE IS THE HIRED CARD BEFORE THE REVEAL: it is the only one carrying both
      // added lines, and its load note is the longest of the four rungs.
      const { snapshot } = career('elite', 4)
      const wrapper = await mountCoaches(snapshot, true)
      const rows = wrapper.findAll('.cm-row')
      const current = rows.filter((r) => r.classes().includes('current'))
      expect(current.length, 'the fixture has a coach hired').toBe(1)

      // THE PICTURE'S REAL RIGHT EDGE. The image is height-driven and overflows – measured in the
      // browser at 62-111px wide depending on the row – so the STRIP is the edge that matters, and
      // it is an edge only because it clips. Both halves are read.
      const art = current[0].find('.cm-art').element as HTMLElement
      const strip = px(getComputedStyle(art).width, '.cm-art width')
      expect(strip, 'the strip has a width of its own').toBe(62)
      expect(getComputedStyle(art).overflow, 'and clips the picture at it').toContain('hidden')
      expect(px(getComputedStyle(art).left, '.cm-art left'), 'starting at the column edge').toBe(0)

      for (const sel of ['.cm-uplift-season', '.cm-edge', '.cm-plaque', '.cm-load', '.cm-name']) {
        const air = inkLeft(current[0], sel) - strip
        expect(air, `${sel} clears the portrait by ${air}px at ${width}px`).toBeGreaterThanOrEqual(10)
        expect(air, `${sel} has not walked off into the middle of the card`).toBeLessThanOrEqual(15)
      }

      // ...and the two ADDED lines sit exactly where the text that was already there sits: the
      // browser measured first ink at 75.00px on every one of them, at both widths.
      const base = inkLeft(current[0], '.cm-name')
      for (const sel of ['.cm-edge', '.cm-plaque']) {
        expect(inkLeft(current[0], sel), `${sel} shares the text column`).toBe(base)
      }

      // The ordinary cards carry the corridor too, and their clearance is the same number.
      const ordinary = rows.filter((r) => !r.classes().includes('current'))[0]
      expect(inkLeft(ordinary, '.cm-edge') - strip).toBe(12)

      wrapper.unmount()
    })
  }
})

// =================================================================================================
// 5 – EVERY FIGURE COMES OFF THE SNAPSHOT
// =================================================================================================
describe('the figures follow the snapshot, not the template', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('a corridor the engine changed is the corridor the card prints', async () => {
    const { snapshot } = career('middle', 4)
    const wrapper = await mountCoaches(snapshot)
    const store = useGameStore()
    const row = () => wrapper.findAll('.cm-row').filter((r) => r.classes().includes('current'))[0]
    const id = store.snapshot!.coachMarket.find((m) => m.current)!.id

    expect(row().find('.cm-edge').text()).toBe('+0.5-0.9% per match')
    // A band nothing in the shipped table could produce, so a hard-coded corridor cannot follow it.
    store.snapshot!.coachMarket.find((m) => m.id === id)!.edgePct = [3.3, 4.4]
    await nextTick()
    expect(row().find('.cm-edge').text()).toBe('+3.3-4.4% per match')
    wrapper.unmount()
  })

  it('the plaque prints the snapshot\'s realised value, its clock and its deadline', async () => {
    const { snapshot } = career('middle', 4)
    const wrapper = await mountCoaches(snapshot)
    const store = useGameStore()
    const plaque = () => wrapper.find('.cm-row.current .cm-plaque').text()

    expect(plaque()).toBe('Too early to tell where in that band – 4 weeks of 52.')

    // The clock and the deadline are the engine's, both of them.
    store.snapshot!.coachEdge.weeksTogether = 7
    store.snapshot!.coachEdge.revealAfterWeeks = 40
    await nextTick()
    expect(plaque()).toBe('Too early to tell where in that band – 7 weeks of 40.')

    // One week is one week – a counter that says "1 weeks" is the tell that nobody read it.
    store.snapshot!.coachEdge.weeksTogether = 1
    await nextTick()
    expect(plaque()).toBe('Too early to tell where in that band – 1 week of 40.')

    // And the reveal is the ENGINE's flag, carrying the ENGINE's number.
    store.snapshot!.coachEdge.revealed = true
    store.snapshot!.coachEdge.realisedPct = 9.87
    await nextTick()
    expect(plaque()).toBe('A season together – the number is +9.87% per match.')

    store.snapshot!.coachEdge.realisedPct = 0.21
    await nextTick()
    expect(plaque()).toBe('A season together – the number is +0.21% per match.')
    wrapper.unmount()
  })
})
