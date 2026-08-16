// THE COACH'S EDGE ON SCREEN T (docs/specs/coach-match-edge.md §4, §7, §8a) – the market card's
// per-match corridor, and the plaque that says what the coach she actually has turned out to be.
//
// WHAT THE SLICE HAS TO GET RIGHT. The first seven are a `describe` below, in this order; the
// eighth is a claim no single test could carry, so it is re-asserted inside every one that can:
//   1. an UNHIRED card shows its RUNG's corridor and never an individual number. This is the whole
//      anti-shopping rule of §4: a number on an unhired card turns the market into a shop window
//      with the prices written on the back – hire, read, fire, repeat until the 0.7 budget coach
//      turns up – and since the value is a property of the PERSON, that search would always succeed.
//   2. the coach she HAS, before a season is up, shows the corridor and a sentence that says so.
//   3. after a season, WHERE IN HIS OWN BRACKET he fell – and never a figure for him. §7: the value
//      is not observable in principle (at ~0.7 pp over a fifty-match season it is buried under the
//      variance of her own results), so a sentence quoting two decimals claims a precision nothing
//      inside the world could produce. The PLACE is what a family learns in a year.
//   4. neither addition walks back onto the portrait – the 12.00px clearance round-18 #2 paid for,
//      now measured on the REVEALED card too.
//   5. every figure AND every sentence on screen comes from the SNAPSHOT. A corridor typed into the
//      template would pass 1-3 and be a lie the first time the engine re-cut the bands.
//   6. §8a: the same coach reads with more hedging at one season than at three, and the PLACEMENT
//      does not move between them.
//   7. fire-then-rehire (§8 ruling 1): the placement is identical – it is a fact about the man – and
//      the hedging has restarted, because the working relationship has.
//   8. no state of the plaque, at any tenure, prints a per-match figure for him.
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
//   ⚠ AND RE-MEASURED FOR §7/§8a, all NINE sentences (three places x three bands of certainty) on
//   the same card in the same browser: `.cm-art` 62.00px, first ink 75.00px, clearance 12.00px on
//   every one at 320 and at 375 – the same three numbers the corridor slice reported. Every one of
//   the nine wraps to exactly TWO lines at both widths and leaves the row at 168.86px, so the card
//   does not jump when the reveal lands and does not jump again when the hedge lifts two seasons
//   later. That is not luck: the copy was written to a measured budget. At 320px the two-line
//   ceiling is 60 characters (61 wraps to three and costs 14.17px), and the longest of the nine is
//   58; at 375px the ONE-line floor is ~42, and the shortest of the nine is 45, which is why the
//   third-season line is not shorter than it is.
//
// ⚠ AND THAT IS ONLY SAFE BECAUSE OF ROUND-18 #2. Until the strip was given a width, a taller row
// meant a WIDER portrait (the image is height-driven), so every attempt to push text right was
// chased by the picture – measured then at 62 -> 12.6px of overlap and 80 -> 13.1px, worse. Adding
// two lines of text to this card before that fix would have EATEN the clearance. `.cm-art` is
// 62px with `overflow: hidden` now, so growth downwards costs nothing sideways, and the browser
// numbers above are the proof: the tallest card in the list has the same 12.00px as the shortest.
//
// ⚠ MUTATION-VERIFIED – twelve mutations, EVERY ONE RE-RUN against this file as it stands now (the
// §7 wave rewrote §2, §3 and §5, so the previous ledger's readings no longer described this file).
// Nothing below passed against a broken build. Two separations are load-bearing and both hold: the
// geometry tests and the copy tests never redden together except for one mutation that deliberately
// drives the geometry through the copy field, and the CUT, the WORDS and the CLOCK each have a test
// that fails alone. `|unit|` marks a hit in tests/coach-edge.test.ts rather than in this file.
//
//   THE COPY, AND THE ENGINE BEHIND IT:
//   * `coachEdgePlacement` returning 'upper' unconditionally -> §3's lower and middle rows, §6, §7,
//     |unit| the thirds test. The upper row still passes, which is why three cases are run;
//   * the thirds cut at halves (`(hi - lo) / 2`) -> §3's UPPER row, §5's real-career test, |unit|
//     the thirds test – and NOT §6 or §7, whose fixture sits in the middle band under either cut.
//     The placement tests are the ones that read the cut, which is what this says;
//   * `PLACEMENT_PHRASE.lower` set to the `upper` string -> §3's lower row, |unit| the verbatim
//     table. It does NOT redden the "one frame, three coordinates" test, correctly: that test asks
//     whether an adjective crept into the frame, not whether the coordinates are the right way up;
//   * the seasons counted off `world.week` instead of the tenure -> §7 and |unit| the engine's
//     rehire test, AND NOTHING ELSE. This is the mutation that proves the CONFIDENCE follows the
//     clock a re-hire restarts: in a career that never changed coach the two clocks are equal, so
//     only the fire-then-rehire pair can tell them apart;
//   * `coachPlaqueLine` ignoring `seasonsTogether` (band 1 always) -> §6, §7, |unit| the verbatim
//     table and the engine's rehire test;
//   * the placement re-derived off the tenure rather than off his id, so a re-hire re-rolls the man
//     -> §7, §6, all three rows of §3, §5's real-career test, |unit| the reveal test. §7 is the one
//     that carries §8's ruling 1: he comes back the same man;
//   * the reveal quoting a per-match figure again – §7's own regression, the sentence this wave
//     deleted -> every copy test in both files, including |unit| the "carries no figure" guard;
//   * `plaqueLine` returning '' before the reveal -> §2, §5's plaque test, |unit| the not-yet test.
//     Nothing in §3-§7, which is the pre/post separation;
//   * `formatEdge([0.2, 0.7])` – the corridor hard-coded into the script -> §1's corridor test, §2,
//     all three rows of §3, §5's corridor test. Every card in the list turns into a budget card;
//   * the plaque rendered on every row rather than on `r.current` -> §1's second test, §2, §3;
//   * the component composing the sentence itself out of `placement` and `seasonsTogether` instead
//     of printing the engine's -> §5's plaque test, plus §4 at both widths (the geometry test drives
//     the revealed state by writing `plaqueLine`, so it necessarily reads the same field).
//
//   THE GEOMETRY, and each of these reddens §4 at BOTH widths and nothing else at all:
//   * `.cm-body { margin-left: 62px }` – round-18's own shipped defect;
//   * `.cm-plaque { margin-left: -20px }`. This is the mutation that proves §4 measures the ADDED
//     elements and does not merely re-state round-18's rule about their parent;
//   * `.cm-art` losing `overflow: hidden`;
//   * `.cm-plaque { position: absolute; left: 4px }`.
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
import { createWorld, hireCoach, tickWeek, toSnapshot } from '../../src/engine/world'
import { rngFromSeed } from '../../src/engine/rng'
import { coachEdgePlacement, coachEdgePp, COACH_EDGE_CORRIDOR_PP, HIREABLE_TIERS } from '../../src/engine/coach'
import { DEFAULT_PROFILE, type CoachEdgePlacement, type CoachTier, type Snapshot } from '../../src/shared/protocol'

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
 *  `coachEdgeView` decides it from `coachSinceWeek`, and 52 ticks is what a season IS.
 *
 *  ⚠ AND THE TENURE TESTS TICK TOO, at 4.1ms a week (measured). §8a's whole risk is that the
 *  confidence follows the wrong clock, so a test that wrote `world.week = 160` would be asserting
 *  against the very field it is trying to prove is not the one being read. 160 weeks is 0.66s. */
function career(coachTier: CoachTier, weeks: number, seed = `${SEED}-${coachTier}`) {
  const world = createWorld(seed, { ...DEFAULT_PROFILE, coachTier })
  const rng = rngFromSeed(world.seed)
  for (let i = 0; i < weeks; i++) tickWeek(world, rng)
  return { world, snapshot: toSnapshot(world), rng }
}

/** THREE CAREERS ON ONE RUNG WHOSE COACH FELL IN THREE DIFFERENT THIRDS – the same man (`middle-1`,
 *  the coach a `middle` onboarding opens with) drawn against three seeds, so the only thing that
 *  differs between the three cards below is where his uniform landed inside 0.5-0.9.
 *
 *  ⚠ THE FIXTURE ASSERTS ITS OWN PROPERTY rather than trusting this table (see §3): a seed whose
 *  draw moved would otherwise quietly turn a placement test into a copy test. */
const SEED_IN_THIRD: Record<CoachEdgePlacement, string> = {
  lower: `${SEED}-middle-16`,
  middle: `${SEED}-middle`,
  upper: `${SEED}-middle-1`,
}

/** ⭐ ROUND-21 #7a/#7b/#7c – THE TWO PRE-REVEAL SENTENCES, written out longhand for the same reason
 *  the nine below are: the WORDS are pinned, so a change to either has to be a deliberate one.
 *  `near` is the coach whose verdict lands at the off-season of the season she is in; `far` is the
 *  one hired in the second half of a season, whose bar has moved a year down. Neither counts weeks.
 *  The whole state is covered by tests/component/round21-coach.test.ts; these two names are here so
 *  the two long-standing assertions in this file read as the same claim they always made. */
const NOT_YET = {
  near: 'Where in that band – we will know in the off-season.',
  far: 'Where in that band – too soon, ask next off-season.',
} as const

/** What the plaque says, per place and per confidence band (docs/specs/coach-match-edge.md §7/§8a).
 *  Written out longhand rather than imported from the engine, so the WORDS are pinned too: a change
 *  to any of the nine has to be a deliberate one, and the owner's three constraints - no praise, no
 *  blame, no figure - are re-readable straight off this table. */
const PLAQUE: Record<'s1' | 's2' | 's3', Record<CoachEdgePlacement, string>> = {
  s1: {
    upper: 'A season in – it looks like the upper end of that band.',
    middle: 'A season in – it looks like the middle of that band.',
    lower: 'A season in – it looks like the lower end of that band.',
  },
  s2: {
    upper: 'Two seasons in, and it holds – the upper end of that band.',
    middle: 'Two seasons in, and it holds – the middle of that band.',
    lower: 'Two seasons in, and it holds – the lower end of that band.',
  },
  s3: {
    upper: 'Season after season – the upper end of that band.',
    middle: 'Season after season – the middle of that band.',
    lower: 'Season after season – the lower end of that band.',
  },
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
    expect(snapshot.coachEdge.placement, 'and the engine names no place').toBeNull()
    expect(snapshot.coachEdge.weeksTogether).toBe(4)
    expect(snapshot.coachEdge.seasonsTogether).toBe(0)

    const wrapper = await mountCoaches(snapshot)
    const current = wrapper.findAll('.cm-row').filter((r) => r.classes().includes('current'))
    expect(current.length, 'exactly one card is hers').toBe(1)
    const row = current[0]

    // The corridor is still the rung's, on the hired card as on every other.
    expect(row.find('.cm-edge').text()).toBe(corridorText('middle'))
    // ...and the plaque is a sentence, not a blank. ⭐ ROUND-21 #7a/#7b: it names the OFF-SEASON and
    // counts nothing. It used to read 'Too early to tell where in that band – 4 weeks of 52.'
    expect(row.find('.cm-plaque').text()).toBe(NOT_YET.near)
    // THE NUMBER IS NOWHERE, including the one the engine would hand over if asked.
    expect(row.text(), 'no individual figure anywhere on the card').not.toMatch(INDIVIDUAL)
    expect(row.text()).not.toContain(coachEdgePp(world.seed, world.coachId).toFixed(2))
    // And nobody else grew a plaque.
    expect(wrapper.findAll('.cm-plaque').length, 'one plaque, on one card').toBe(1)
    wrapper.unmount()
  })
})

// =================================================================================================
// 3 – ...AND AFTER IT: A PLACE IN HIS OWN BRACKET, NEVER A NUMBER (§7)
// =================================================================================================
describe('the plaque after a season names where in the band he fell', () => {
  beforeEach(() => setActivePinia(createPinia()))

  // Three coaches on ONE rung, one per third. Everything about the card is held constant except the
  // seed, so the sentence is the only thing that may differ – which is what makes this a test of the
  // CUT and not of the copy.
  for (const place of ['lower', 'middle', 'upper'] as CoachEdgePlacement[]) {
    it(`a coach in the ${place} third gets the ${place} sentence, and no figure of his own`, async () => {
      const { world, snapshot } = career('middle', 56, SEED_IN_THIRD[place])
      expect(snapshot.coachEdge.revealed, 'a season and then some has passed').toBe(true)

      // THE FIXTURE PROVES ITSELF. His value is a uniform off his id; this asserts the seed really
      // did land in the third the case is named for, against the corridor's own arithmetic rather
      // than against the engine's classifier - so a broken `coachEdgePlacement` cannot agree with a
      // broken fixture.
      const [lo, hi] = COACH_EDGE_CORRIDOR_PP.middle
      const pp = coachEdgePp(world.seed, world.coachId)
      const nth = Math.min(2, Math.floor((3 * (pp - lo)) / (hi - lo)))
      expect(['lower', 'middle', 'upper'][nth], `${world.coachId} at ${pp.toFixed(3)} is in this third`).toBe(place)
      expect(snapshot.coachEdge.placement, 'and the engine says the same').toBe(place)

      const wrapper = await mountCoaches(snapshot)
      const row = wrapper.findAll('.cm-row').filter((r) => r.classes().includes('current'))[0]
      expect(row.find('.cm-plaque').text()).toBe(PLAQUE.s1[place])

      // ⚠ NO NUMBER FOR HIM, ANYWHERE ON THE CARD – the whole of §7. Both halves are checked: the
      // shape of an individual figure (two decimals is a format nothing else on a card produces),
      // and the actual value the engine would hand over if it still could.
      expect(row.text(), 'no individual figure on the card').not.toMatch(INDIVIDUAL)
      expect(row.text()).not.toContain(pp.toFixed(2))
      expect(row.text()).not.toContain(pp.toFixed(1))
      // The rung's band stays beside it – the corridor is what the placement is read against, and it
      // is the whole reason a budget lottery is worth playing.
      expect(row.find('.cm-edge').text()).toBe(corridorText('middle'))
      // ...and the reveal is HIS card's business alone. The other fifteen are still a market.
      expect(wrapper.findAll('.cm-plaque').length).toBe(1)
      for (const other of wrapper.findAll('.cm-row').filter((r) => !r.classes().includes('current'))) {
        expect(other.text()).not.toMatch(INDIVIDUAL)
      }
      wrapper.unmount()
    })
  }

  it('says all three in the same words and the same colour – no praise, no blame', async () => {
    // ⚠ THE OWNER'S CONSTRAINT, MECHANICALLY: a low draw is reported in the same register as a high
    // one. Two halves. (a) the three sentences differ ONLY in the placement phrase - strip it and
    // what is left is byte-identical, so there is nowhere for an adjective to hide; (b) the line
    // carries no state-dependent class, so the CSS cannot colour a low draw as bad news.
    const frames = (['lower', 'middle', 'upper'] as CoachEdgePlacement[]).map((p) =>
      PLAQUE.s1[p].replace(/the (upper end|middle|lower end) of that band/, 'X'),
    )
    expect(new Set(frames).size, 'one frame, three coordinates').toBe(1)
    for (const band of [PLAQUE.s1, PLAQUE.s2, PLAQUE.s3]) {
      for (const p of ['lower', 'middle', 'upper'] as CoachEdgePlacement[]) {
        expect(band[p], `${p} praises or blames`).not.toMatch(
          /\b(better|worse|best|worst|good|bad|great|poor|bargain|steal|disappoint|value|overpaid|underpaid|lucky|unlucky)\b/i,
        )
        // NOR MAY IT PROMISE THE RADAR (§3): the corridor is under half a skill point against a
        // visibility floor of 3, so her game is a thing this sentence cannot mention.
        expect(band[p], `${p} promises her skills`).not.toMatch(/\b(her game|skills?|radar|see it in her)\b/i)
      }
    }

    const classesOf = async (place: CoachEdgePlacement): Promise<string[]> => {
      const { snapshot } = career('middle', 56, SEED_IN_THIRD[place])
      const wrapper = await mountCoaches(snapshot)
      const cls = wrapper.find('.cm-row.current .cm-plaque').classes()
      wrapper.unmount()
      return cls
    }
    expect(await classesOf('lower')).toEqual(await classesOf('upper'))
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
      //
      // ⚠ RE-AIMED, ROUND-21 #1 – THE HIRED CARD'S WINDOW IS 78px NOW, and this test's claim never
      // was the number. §4 asks whether the ADDED lines walked back onto the picture, so what it
      // needs is the picture's real right edge on the row it is measuring; the owner widened that
      // edge on the hired card («фото пропорционально шире … относительно высоты») and `.cm-body`
      // moved with it, so the 12px corridor below is unchanged and is still the thing under test.
      // The literal is kept – not softened to "whatever the strip says" – because a strip that
      // silently went back to shrink-wrapping the image would then drag the corridor along with it
      // and this test would notice nothing.
      const art = current[0].find('.cm-art').element as HTMLElement
      const strip = px(getComputedStyle(art).width, '.cm-art width')
      expect(strip, 'the hired row\'s strip has a width of its own').toBe(78)
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
      // ⚠ AGAINST THEIR OWN STRIP, ROUND-21 #1. This line used to reuse `strip` – the HIRED row's
      // width – to judge an ORDINARY row's ink, which was harmless only while every row was 62px.
      // The corridor is a per-row property and is now read as one; that the two rows arrive at the
      // same 12 from different pairs (62/74 and 78/90) is the point of the assertion.
      const ordinary = rows.filter((r) => !r.classes().includes('current'))[0]
      const ordinaryStrip = px(getComputedStyle(ordinary.find('.cm-art').element).width, '.cm-art width')
      expect(ordinaryStrip, 'an unhired row keeps the narrow window').toBe(62)
      expect(inkLeft(ordinary, '.cm-edge') - ordinaryStrip).toBe(12)

      // ⚠ AND THE REVEALED CARD IS MEASURED TOO, which is what §7 added to this test. The plaque is
      // the only element on the card whose text this wave changed, and the LONGEST of the nine
      // sentences is put on it here - browser-measured at 320px and 375px, it wraps to two lines
      // like every other state, so the row stays 168.86px tall and the clearance stays where it is.
      // The card does not jump when the reveal lands, nor when the hedge lifts three seasons later.
      const store = useGameStore()
      store.snapshot!.coachEdge.placement = 'upper'
      store.snapshot!.coachEdge.plaqueLine = PLAQUE.s2.upper
      await nextTick()
      const revealed = wrapper.findAll('.cm-row').filter((r) => r.classes().includes('current'))[0]
      expect(revealed.find('.cm-plaque').text()).toBe(PLAQUE.s2.upper)
      for (const sel of ['.cm-uplift-season', '.cm-edge', '.cm-plaque', '.cm-load', '.cm-name']) {
        expect(inkLeft(revealed, sel) - strip, `${sel} still clears the portrait at ${width}px`).toBe(12)
      }

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

  it('the plaque prints the SENTENCE the engine wrote, not one of its own', async () => {
    // ⚠ THE COPY MOVED ENGINE-SIDE WITH §7, and this is the test that says so. The sentence has two
    // halves answering to different clocks – the PLACE follows the man, the CONFIDENCE follows the
    // tenure (§8 ruling 1) – so a component composing it from `placement` would be a second copy of
    // that rule, and its failure mode is silent: a re-hired coach reading as a different person.
    // A string no template could produce is the only honest way to ask this question.
    const { snapshot } = career('middle', 4)
    const wrapper = await mountCoaches(snapshot)
    const store = useGameStore()
    const plaque = () => wrapper.find('.cm-row.current .cm-plaque').text()

    expect(plaque()).toBe(NOT_YET.near)

    store.snapshot!.coachEdge.plaqueLine = 'Nine seasons in, and the goat approves.'
    await nextTick()
    expect(plaque()).toBe('Nine seasons in, and the goat approves.')

    // ...and the numbers that used to be composed here are not composed here any more: moving the
    // engine's own clock changes nothing until the engine re-writes the line, which is exactly what
    // "the sentence comes from the snapshot" means.
    store.snapshot!.coachEdge.weeksTogether = 7
    store.snapshot!.coachEdge.revealWeek = 40
    store.snapshot!.coachEdge.seasonsTogether = 3
    store.snapshot!.coachEdge.placement = 'lower'
    await nextTick()
    expect(plaque()).toBe('Nine seasons in, and the goat approves.')
    wrapper.unmount()
  })

  it('and the engine\'s sentence is the one a real career produces', async () => {
    // The other direction of the same claim: no mutation anywhere, just the real snapshot of a real
    // career, so the string above cannot be passing against a component that ignores the field.
    const { snapshot } = career('middle', 56, SEED_IN_THIRD.upper)
    const wrapper = await mountCoaches(snapshot)
    expect(wrapper.find('.cm-row.current .cm-plaque').text()).toBe(snapshot.coachEdge.plaqueLine)
    expect(snapshot.coachEdge.plaqueLine).toBe(PLAQUE.s1.upper)
    wrapper.unmount()
  })
})

// =================================================================================================
// 6 – §8a: THE CONFIDENCE GROWS WITH THE SEASONS, AND THE PLACEMENT DOES NOT MOVE
// =================================================================================================
describe('the hedge lifts as the years go by', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('hedges at one season, states it at three – same coach, same place', async () => {
    // ONE SEED, TWO TENURES. The coach is the same man with the same drawn value in both; the only
    // thing that has changed is how long the family has watched him work. §8a's whole product is
    // that this costs nothing – no number moves, only how certain the words are.
    const one = career('middle', 56, SEED_IN_THIRD.middle)
    const three = career('middle', 160, SEED_IN_THIRD.middle)
    expect(one.snapshot.coachEdge.seasonsTogether).toBe(1)
    expect(three.snapshot.coachEdge.seasonsTogether).toBe(3)

    // THE PLACEMENT IS THE SAME FACT AT BOTH TENURES – it is a property of the person, and §8's
    // ruling 2 says tenure may not move it.
    expect(one.snapshot.coachEdge.placement).toBe('middle')
    expect(three.snapshot.coachEdge.placement).toBe(one.snapshot.coachEdge.placement)
    expect(coachEdgePp(three.world.seed, three.world.coachId)).toBe(
      coachEdgePp(one.world.seed, one.world.coachId),
    )

    const lineAt = async (snapshot: Snapshot): Promise<string> => {
      const wrapper = await mountCoaches(snapshot)
      const text = wrapper.find('.cm-row.current .cm-plaque').text()
      wrapper.unmount()
      return text
    }
    const early = await lineAt(one.snapshot)
    const late = await lineAt(three.snapshot)
    expect(early).toBe(PLAQUE.s1.middle)
    expect(late).toBe(PLAQUE.s3.middle)
    expect(early, 'the two seasons do not read the same').not.toBe(late)

    // THE HEDGE IS WHAT MOVED, and nothing else: the early line qualifies the reading, the late one
    // simply states it, and both name the same place in the same words.
    expect(early).toMatch(/it looks like/)
    expect(late).not.toMatch(/it looks like/)
    expect(early).toContain('the middle of that band')
    expect(late).toContain('the middle of that band')
    // ...and neither of them, at any tenure, has grown a figure for him (§7).
    for (const text of [early, late]) expect(text).not.toMatch(INDIVIDUAL)
  })
})

// =================================================================================================
// 7 – FIRE, THEN RE-HIRE: THE MAN IS THE SAME, THE PARTNERSHIP IS NEW (§8, ruling 1)
// =================================================================================================
describe('letting him go and taking him back', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('keeps the placement and restarts the hedging', async () => {
    // Two seasons in, so the "before" is a band the restart can be told apart from.
    const { world, snapshot, rng } = career('middle', 104, SEED_IN_THIRD.middle)
    const him = world.coachId!
    expect(snapshot.coachEdge.seasonsTogether).toBe(2)
    const before = await (async () => {
      const w = await mountCoaches(snapshot)
      const t = w.find('.cm-row.current .cm-plaque').text()
      w.unmount()
      return t
    })()
    expect(before).toBe(PLAQUE.s2.middle)

    // The real commands, in the real order, through the real engine.
    hireCoach(world, null)
    hireCoach(world, him)
    expect(world.coachId, 'the same man is back').toBe(him)
    for (let i = 0; i < 52; i++) tickWeek(world, rng)
    const after = toSnapshot(world)

    expect(after.coachEdge.weeksTogether, 'the clock restarted at the re-hire').toBe(52)
    expect(after.coachEdge.seasonsTogether).toBe(1)
    // ⚠ THE PLACE IS THE MAN'S AND SURVIVES – «этот оказался находкой» has to be a fact about a
    // person, so a re-hire may not re-roll him.
    expect(after.coachEdge.placement).toBe(snapshot.coachEdge.placement)
    expect(coachEdgePlacement(world.seed, him)).toBe(snapshot.coachEdge.placement)

    const wrapper = await mountCoaches(after)
    const text = wrapper.find('.cm-row.current .cm-plaque').text()
    // Same place, hedged again – the working relationship is new even though the man is not.
    expect(text).toBe(PLAQUE.s1.middle)
    expect(text).toContain('the middle of that band')
    expect(text, 'the hedging restarted with the partnership').not.toBe(before)
    expect(text).not.toMatch(INDIVIDUAL)
    wrapper.unmount()
  })
})
