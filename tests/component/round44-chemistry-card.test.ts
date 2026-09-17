// ROUND 44 – THE CHEMISTRY, MADE VISIBLE: THE WIRE, C7's GATE, §8a's GAUGE AND #52's CARD, MOUNTED.
//
// WHAT THIS FILE IS ABOUT. Wave C1 shipped the mechanic in round 43 – `coachPairs` is read in seven
// engine files and moves her development every week – and nothing carried it across the boundary, so
// no screen could render it however its markup was written. The owner played a whole round and
// reported «я не увидел её в игре нигде». So the four claims below are, in the order they had to be
// built:
//
//   1. THE WIRE. `CoachMarketRow.chemistry` is the engine's own `chemistryReading` of the persisted
//      pair – the same number `growWeek` grows her on – and it is `null` on a stranger's card.
//   2. C7's GATE. «Once a band is clear», and the bar is `ECONOMY.chemistry.readableAt`: under it the
//      card draws the question mark, at or past it the gauge. «A sentence in week 3 about a
//      relationship is noise» is the case this exists for, and week 3 is measured rather than argued.
//   3. THE GAUGE, against each of the THREE accessibility constraints §8a sets and calls
//      accessibility rather than taste: the hue family is a gradient, the FILL fraction carries the
//      sign by sweeping the other way, the FIGURE carries it outright, the neutral reads «nothing has
//      happened yet» rather than «bad», and `--accent` stays the icon's so the two never compete.
//   4. #52's CARD. Price and Hire in the top-right, the marker in the bottom-right, the price's own
//      treatment untouched (round 43 #3 ruled its size, weight and figures), and the whole thing
//      measured at 375x667 – the measurement round 42 #52 asked for by name.
//
// ⚠ HAPPY-DOM HAS NO LAYOUT ENGINE, so `getBoundingClientRect` is zeros here – the same wall
// `tests/component/wave5-coach-profile.test.ts` and `tests/component/coach-edge-card.test.ts` record
// at length. Geometry is therefore read through the real cascade with `getComputedStyle` and through
// `tests/component/fits.ts`, whose content model is a deliberate FLOOR.
//
// ⚠ THE PAIR IS WRITTEN ONTO THE WORLD RATHER THAN WALKED TO. `accrueCoachPair` is the one writer and
// it is measured in `tests/round43-chemistry.test.ts`; what this file is about is what happens to the
// number AFTER it exists, so setting `world.coachPairs[id]` and taking a fresh snapshot is the honest
// arm – it exercises the whole derivation (`chemistryReading` -> `coachMarket` -> the card) without
// spending two hundred ticks to reach a level the test then has to guess at.
//
// ⚠ MUTATION LEDGER – nine arms, each APPLIED and RUN against this file as it stands, each red
// recorded as measured rather than as predicted. The restored tree is green (16/16). A test that
// cannot fail on the broken version is not this test, so the arms are the evidence and not the
// comment above them.
//
//   arm                                                             red cases
//   `chemistry: pair?.chem ?? null` in `coachMarket` (C7's gate)     §2 BOTH, and §3's neutral
//   `:mirrored="false"` on the ring                                  §3's fill-sign, alone
//   `chemFigure` without its sign                                    §3's figure, §2's gate, §1's label
//   `chemGradient` returning CHEM_UP always                          §3's gradient, alone
//   `stroke-linecap="round"` unconditionally on the ring             §3's neutral, alone
//   `.cm-chem-mark { color: var(--chem-up-to) }`                     §3's accent, alone
//   `.cm-right { align-self: auto; justify-content: flex-start }`    §4's two corners, alone
//   the ring at `:size="56"` instead of 36                           §4's phone measurement, on WIDTH
//   `.cm-price { font-size: 12px }`                                  §4's round-43 #3 case, alone
//
// ⚠⚠ AND A TENTH ARM WAS NOT DESIGNED, IT WAS SHIPPED AND CAUGHT BY THE GATE, in
// `tests/component/round29-next-tournament.test.ts` rather than here. An explanatory HTML comment
// placed above `ProgressRing`'s root element made that component render a FRAGMENT, which turns off
// Vue's attribute fallthrough - so `class="nt-ring field-ring"` stopped reaching the ring and the
// field ring lost its styling in the real app. Recorded here because it is the honest measure of what
// this file does NOT cover: every assertion below finds the ring by SELECTOR inside the coach card,
// so none of them can see a fallthrough class going missing. See ProgressRing.vue's own header.
//
// ⭐ TWO ARMS REACHED FURTHER THAN THE CASE THEY WERE AIMED AT, and both are honest rather than
// noise: with C7's gate gone the resting card draws «0%» instead of «?», which IS what §3's neutral
// case is about; and a figure without its sign is the same defect on the card and in the row's name,
// which is why C12 is asserted in two places.
import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { nextTick } from 'vue'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
// ⚠ THE APP'S OWN SHEET. `.cm-right`, `.cm-money`, `.cm-chem` and the four gradient tokens live in
// src/style.css; without this import every computed value below is the initial one and §3 and §4 pass
// on a broken build.
import '../../src/style.css'
import CoachMarketScreen from '../../src/components/screens/CoachMarketScreen.vue'
import AppIcon from '../../src/components/ui/AppIcon.vue'
import { useGameStore } from '../../src/stores/game'
import { createWorld, toSnapshot, type WorldState } from '../../src/engine/world'
import { accrueChemistry, affinityFor, chemistryReading, freshCoachPair } from '../../src/engine/chemistry'
import { buildCoachRoster } from '../../src/engine/coach'
import { ECONOMY } from '../../src/engine/economy'
import { DEFAULT_PROFILE, type Snapshot } from '../../src/shared/protocol'
import { assertDismissReachable, availableWidth, boxOf, PHONE, setViewport } from './fits'

const BAR = ECONOMY.chemistry.readableAt
// ⚠ `__dirname` AND NOT `import.meta.url`: the component project runs under happy-dom, where
// `import.meta.url` is not a `file:` URL and `fileURLToPath` throws at collection time.
// `a11y-sweep.test.ts` reads a source file the same way.
const ROOT = resolve(__dirname, '../..')

function assertSheetPresent(): void {
  if (!document.head.querySelector('style')) {
    throw new Error('no stylesheet in the document – the component project needs `css: true`')
  }
}

function px(value: string, what: string): number {
  if (value === '') return 0
  const n = Number.parseFloat(value)
  if (!Number.isFinite(n)) throw new Error(`${what} computed to "${value}"`)
  return n
}

/** How wide a run of text is, on `fits.ts`'s own fitted advance – the one constant that file's whole
 *  content model rests on, restated here rather than exported because the two uses are different
 *  measurements: `fits.ts` wraps paragraphs, this measures one unwrapped line.
 *
 *  ⚠ IT UNDER-COUNTS, WHICH MAKES THE ASSERTION STRICTER RATHER THAN LOOSER. The claim below is «the
 *  marker is no wider than the price group»; modelling the price group SMALL than it really is can
 *  only make that harder to satisfy, so a green here is worth having. */
const ADVANCE = 0.47
function inkWidth(el: Element): number {
  const cs = getComputedStyle(el)
  return (el.textContent ?? '').trim().length * (Number.parseFloat(cs.fontSize) || 15) * ADVANCE
}

/** A career with a coach on the payroll, and nothing written onto the pair yet. */
function hired(seed = 'r44-chem'): WorldState {
  const world = createWorld(seed, { ...DEFAULT_PROFILE, coachTier: 'middle' })
  if (!world.coachId) throw new Error('this profile is supposed to start with a coach on the payroll')
  return world
}

/** Put the pair at a level. The phase is left at rest so nothing about the arm depends on weather. */
function withChemistry(world: WorldState, chem: number, coachId = world.coachId!): Snapshot {
  world.coachPairs[coachId] = { chem, phase: 0, standing: 0 }
  return toSnapshot(world)
}

async function mountCoaches(snapshot: Snapshot, attach = false) {
  const store = useGameStore()
  store.snapshot = snapshot
  const wrapper = mount(CoachMarketScreen, {
    global: { stubs: { teleport: true } },
    ...(attach ? { attachTo: document.body } : {}),
  })
  const pill = wrapper.findAll('.tb-seg .tab-pill').find((b) => b.text() === 'Coaches')
  await pill!.trigger('click')
  await nextTick()
  return wrapper
}

/** The name on the card of the coach she actually has, read off the BOARD rather than rebuilt from
 *  the roster - the market prices the roster at her own age and a test that re-derived it would be
 *  guessing at an argument the engine owns. */
function currentName(world: WorldState): string {
  const row = toSnapshot(world).coachMarket.find((r) => r.current)
  expect(row, 'this career is supposed to have a coach on the board').toBeTruthy()
  return row!.name
}

/** The row of the coach she actually has. */
function currentRow(wrapper: Awaited<ReturnType<typeof mountCoaches>>, name: string) {
  const row = wrapper.findAll('.cm-row').find((r) => r.text().includes(name))
  expect(row, `${name} is on the board`).toBeTruthy()
  return row!
}

// =================================================================================================
// 1 – THE WIRE: the number crosses, and it is the engine's own
// =================================================================================================
describe('round 44 §1 - coachPairs reaches the snapshot', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('the hired coach\'s row carries the pair\'s own level, and a stranger\'s carries null', () => {
    const world = hired()
    const snapshot = withChemistry(world, 41.7)
    const mine = snapshot.coachMarket.find((r) => r.current)
    expect(mine, 'her own coach is on the board').toBeTruthy()
    // ⚠ THE ENGINE'S FUNCTION AND NOT A NUMBER TYPED HERE: a test that re-implemented the derivation
    // would be the second arithmetic this whole item exists to avoid.
    expect(mine!.chemistry).toBe(chemistryReading(world.coachPairs[world.coachId!]))
    expect(mine!.chemistry).toBe(41.7)

    const strangers = snapshot.coachMarket.filter((r) => !r.current)
    expect(strangers.length, 'the board has other coaches on it').toBeGreaterThan(8)
    expect(strangers.every((r) => r.chemistry === null), 'nobody she has not worked with has a reading').toBe(true)
  })

  it('a coach she worked with and let go keeps his reading – leaving pauses, it does not reset', () => {
    // §7, and his own «вернуться к её первому тренеру». The row survives on `coachPairs`, so the card
    // of a former coach still says what the two of them had. A single «her coach's chemistry» field
    // would have thrown this away, which is half the reason the wire is per ROW.
    const world = hired()
    const former = toSnapshot(world).coachMarket.find((r) => !r.current)!
    const snapshot = withChemistry(world, -28, former.id)
    const row = snapshot.coachMarket.find((r) => r.id === former.id)
    expect(row!.chemistry).toBe(-28)
    expect(row!.current, 'and he is not the coach she has').toBe(false)
  })

  it('the level is the integral of weeks WORKED, which is why three weeks cannot clear the bar', () => {
    // C7's own case, measured rather than asserted. `accrueCoachPair` runs only on a week he is paid
    // for, so `chem` counts weeks together - three of them cannot be large however the dice fell, and
    // this walks the real accrual at the most extreme affinity the roster can produce.
    const world = hired()
    const roster = buildCoachRoster(world.seed, 8)
    let worst = 0
    for (const coach of roster) {
      const a = affinityFor(world.seed, coach.id, world.temperament, coach.manner)
      for (const sign of [a, -a]) {
        let pair = freshCoachPair()
        for (let w = 1; w <= 3; w++) {
          pair = accrueChemistry(pair, sign, world.seed, coach.id, w, { wins: 3, losses: 0, titles: 1, band: 'glowing' })
        }
        worst = Math.max(worst, Math.abs(pair.chem))
      }
    }
    expect(worst, 'three weeks of the best week the game has cannot reach the bar').toBeLessThan(BAR)
  })

  it('and the row\'s accessible name carries the figure when there is one, and says nothing when there is not', async () => {
    const world = hired()
    const name = currentName(world)
    const wrapper = await mountCoaches(withChemistry(world, -33.2))
    // ⚠ THE ROW IS A `<button>` WITH AN EXPLICIT `aria-label`, so the gauge's own label inside it is
    // never announced - C12's «for those who read colours or a scale's position badly» is only true
    // for a listener if the figure is in the NAME.
    expect(currentRow(wrapper, name).attributes('aria-label')).toContain('chemistry -33%')
    const stranger = wrapper.findAll('.cm-row').find((r) => !r.classes('current'))!
    expect(stranger.attributes('aria-label')).not.toContain('chemistry')
    wrapper.unmount()
  })
})

// =================================================================================================
// 2 – C7's GATE: the marker is a question mark until a band is clear
// =================================================================================================
describe('round 44 §2 - C7, once a band is clear', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('under the bar the card draws the question mark, at the bar it draws the gauge', async () => {
    // ⚠ A FRESH CAREER PER ARM AND ONE MOUNT AT A TIME – see `arcOf` below for the store-sharing
    // trap that makes two live boards in one test measure the same career twice.
    const name = currentName(hired())

    for (const [level, reads] of [
      [0, '?'],
      [BAR - 0.01, '?'],
      [-(BAR - 0.01), '?'],
      [BAR, `+${BAR}%`],
      [-BAR, `-${BAR}%`],
    ] as const) {
      const wrapper = await mountCoaches(withChemistry(hired(), level))
      const mark = currentRow(wrapper, name).find('.cm-chem .tb-ring-value')
      expect(mark.exists(), `a marker at ${level}`).toBe(true)
      expect(mark.text(), `the marker at ${level}`).toBe(reads)
      wrapper.unmount()
    }
  })

  it('and the gate is the ENGINE\'s - the wire is already null under the bar', () => {
    const snapshot = withChemistry(hired(), BAR - 0.01)
    expect(snapshot.coachMarket.find((r) => r.current)!.chemistry).toBeNull()
    // The screen has no threshold of its own to drift from this one.
    const at = withChemistry(hired(), BAR)
    expect(at.coachMarket.find((r) => r.current)!.chemistry).toBe(BAR)
  })
})

// =================================================================================================
// 3 – THE GAUGE, against §8a's three accessibility constraints
// =================================================================================================
describe('round 44 §3 - the sign, on three channels', () => {
  beforeEach(() => setActivePinia(createPinia()))

  /** ⚠ ATTACHED, ALWAYS. `getComputedStyle` on a detached element returns nothing in happy-dom, which
   *  is a green that means «the cascade was never consulted» - the wall `fits.ts` and
   *  `coach-edge-card.test.ts` both name. Attaching costs nothing and is the only honest arm. */
  async function ringOf(level: number) {
    const world = hired()
    const name = currentName(world)
    const wrapper = await mountCoaches(withChemistry(world, level), true)
    const row = currentRow(wrapper, name)
    return { wrapper, row, ring: row.find('.cm-chem .tb-ring'), arc: row.find('.cm-chem .tb-ring-arc') }
  }

  /** ⚠⚠ ONE MOUNT AT A TIME, AND THAT IS NOT TIDINESS. The screen reads its snapshot off the Pinia
   *  store, and a test that mounts two boards inside one `beforeEach` gives them the SAME store - so
   *  the second `store.snapshot = …` re-renders the first wrapper too and both arms show the second
   *  career. This file's first draft compared a positive ring with a negative one that way and got
   *  two negative rings, which is exactly the «comparing a thing with itself» shape CLAUDE.md's
   *  null-result gotcha is about. So an arm reads what it needs and unmounts before the next. */
  async function arcOf(level: number): Promise<Record<string, string | undefined>> {
    const { wrapper, arc } = await ringOf(level)
    const read = {
      transform: arc.attributes('transform'),
      dashoffset: arc.attributes('stroke-dashoffset'),
      dasharray: arc.attributes('stroke-dasharray'),
      stroke: arc.attributes('stroke'),
    }
    wrapper.unmount()
    return read
  }

  it('CHANNEL ONE, the hue: the sign is a GRADIENT and the strength is the position inside it', async () => {
    for (const [level, stops] of [
      [64, ['var(--chem-up-from)', 'var(--chem-up-to)']],
      [-64, ['var(--chem-down-from)', 'var(--chem-down-to)']],
    ] as const) {
      const { wrapper, row, arc } = await ringOf(level)
      // ⚠ A GRADIENT AND NOT A FLAT COLOUR, which is his ruling and not the recommendation it
      // replaced: the arc is painted with a paint SERVER, so the colour varies along the ring and a
      // long arc reaches the bright end a short one never gets to.
      expect(arc.attributes('stroke'), `the arc at ${level} is painted by a gradient`).toMatch(/^url\(#tb-ring-grad-/)
      const grad = row.find('.cm-chem linearGradient')
      expect(grad.exists(), 'and the gradient is in the ring\'s own defs').toBe(true)
      expect(
        grad.findAll('stop').map((s) => s.attributes('stop-color')),
        `the family at ${level}`,
      ).toEqual([...stops])
      wrapper.unmount()
    }
  })

  it('CHANNEL TWO, the fill: a negative pairing fills from the OTHER END, so the shape differs', async () => {
    // §8a, verbatim: «red/green is the commonest colour-vision confusion, so the FILL FRACTION says
    // it too». Same magnitude, same arc LENGTH, opposite sweep - which is what makes the two rings
    // tellable apart on a monochrome screen.
    const up = await arcOf(64)
    const down = await arcOf(-64)
    expect(up.dashoffset, 'the same strength paints the same LENGTH of arc').toBe(down.dashoffset)
    expect(up.transform, 'the positive ring sweeps clockwise from twelve').not.toContain('scale(-1 1)')
    expect(down.transform, 'the negative one sweeps the other way').toContain('scale(-1 1)')
  })

  it('CHANNEL THREE, the figure: it stays, and it carries its own sign (C12)', async () => {
    for (const [level, reads] of [
      [64.4, '+64%'],
      [-12.5, '-13%'],
      [100, '+100%'],
    ] as const) {
      const { wrapper, row } = await ringOf(level)
      expect(row.find('.cm-chem .tb-ring-value').text(), `the figure at ${level}`).toBe(reads)
      wrapper.unmount()
    }
  })

  it('THE NEUTRAL reads «nothing has happened yet» and never the first step of the bad colour', async () => {
    // His third constraint. At rest the corner is the unfilled TRACK plus the question mark: no arc
    // is painted at all, and the arc that would be painted has no cap to leave a dot behind.
    const { wrapper, row, arc } = await ringOf(0)
    expect(row.find('.cm-chem .tb-ring-value').text(), 'and it says so in words of one glyph').toBe('?')
    expect(arc.attributes('stroke-dashoffset'), 'the arc is the full circumference away from being drawn').toBe(
      arc.attributes('stroke-dasharray'),
    )
    expect(arc.attributes('stroke-linecap'), 'so a round cap cannot leave a dot at twelve o\'clock').toBe('butt')
    expect(arc.attributes('stroke'), 'and there is no gradient to read a hue out of').not.toMatch(/^url\(/)
    wrapper.unmount()
  })

  it('AND `--accent` STAYS THE ICON\'S, so the mark and the gradient never compete', async () => {
    assertSheetPresent()
    const { wrapper, row, arc } = await ringOf(-64)
    const mark = row.find('.cm-chem-mark')
    expect(mark.exists(), 'the chemistry mark is above the gauge').toBe(true)
    // Through the REAL cascade: `--accent` is declared on the root and `.cm-chem-mark` spends it, so
    // the two resolve to one colour. A rule that painted the mark out of the gauge's own family would
    // resolve to something else and this is where it would be caught.
    const accent = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim()
    expect(accent, 'the accent is a real declared colour').toMatch(/^#|^rgb/)
    expect(getComputedStyle(mark.element).color, 'the mark is the wave\'s accent').toBe(accent)
    // ...and the ring is painted by anything BUT the accent: a gradient id, whose stops are the
    // chemistry family and resolve to neither the accent nor each other.
    expect(arc.attributes('stroke')).toMatch(/^url\(/)
    const stops = row.findAll('.cm-chem stop').map((s) => s.attributes('stop-color'))
    expect(stops, 'no stop borrows the icon\'s colour').not.toContain('var(--accent)')
    expect(stops, 'and the gauge is a real two-stop ramp').toHaveLength(2)
    expect(stops[0]).not.toBe(stops[1])
    wrapper.unmount()
  })

  it('and it is the icon HE handed over, served out of public/ rather than drawn again', async () => {
    // ⚠ TWO HALVES, BECAUSE NEITHER IS THE CLAIM ON ITS OWN. The card asks the app's one file-icon
    // door for `chemistry` (happy-dom drops the mask declarations from the style attribute, so the
    // PROP is the honest mounted read), and the file that door will fetch is the one he handed over -
    // same path data, to the character, as `docs/assets/chemistry-icon-source.svg`. An icon somebody
    // redrew would pass the first half and fail the second.
    const { wrapper, row } = await ringOf(64)
    const icon = row.findComponent(AppIcon)
    expect(icon.exists(), 'the mark is the app\'s one icon door and not new markup').toBe(true)
    expect(icon.props('name')).toBe('chemistry')
    wrapper.unmount()

    const served = readFileSync(resolve(ROOT, 'public/icons/chemistry.svg'), 'utf8')
    const source = readFileSync(resolve(ROOT, 'docs/assets/chemistry-icon-source.svg'), 'utf8')
    const pathOf = (svg: string) => /<path d="([^"]+)"/.exec(svg)?.[1] ?? ''
    expect(pathOf(served), 'the served file has a single path').not.toBe('')
    expect(pathOf(served), 'and it is his flask, not a redrawing of one').toBe(pathOf(source))
  })
})

// =================================================================================================
// 4 – #52's CARD: two corners, and both of them on a 375x667 phone
// =================================================================================================
describe('round 44 §4 - the card re-laid, measured on a phone', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('price and Hire ride the TOP corner and the marker the bottom, on every row', async () => {
    assertSheetPresent()
    const wrapper = await mountCoaches(withChemistry(hired(), 64), true)
    const rows = wrapper.findAll('.cm-row')
    expect(rows.length, 'the list drew a full board').toBeGreaterThan(8)
    for (const row of rows) {
      const right = row.find('.cm-right').element
      const cs = getComputedStyle(right)
      // ⚠ THE TWO DECLARATIONS THAT ARE THE ITEM. Without `stretch` the column is centred on the
      // row's middle and there are no corners to put anything in; without `space-between` the two
      // groups sit on top of each other at the top.
      expect(cs.alignSelf, 'the right column reaches both ends of the card').toBe('stretch')
      expect(cs.justifyContent, 'so the two groups can take one end each').toBe('space-between')
      const kids = [...right.children].map((c) => c.className)
      expect(kids, 'the money group first, the marker second').toEqual(['cm-money', 'cm-chem'])
      expect(row.find('.cm-money .cm-price').exists(), 'the price is in the top group').toBe(true)
      expect(row.find('.cm-money .cm-action').exists(), 'and so is the way in').toBe(true)
      expect(row.find('.cm-chem .tb-ring').exists(), 'and the gauge is in the bottom one').toBe(true)
    }
    wrapper.unmount()
  })

  it('ROUND 43 #3 IS UNTOUCHED: moving the price did not change how it is set', async () => {
    // #52 ruled the price's POSITION and nothing else. Its treatment - size, weight, tabular figures
    // - is a settled typography decision this item may not touch, so the three values are measured
    // through the real cascade rather than trusted to have survived a move.
    assertSheetPresent()
    const wrapper = await mountCoaches(withChemistry(hired(), 64), true)
    const price = wrapper.find('.cm-row .cm-price').element
    const cs = getComputedStyle(price)
    expect(px(cs.fontSize, '.cm-price font-size')).toBe(14.5)
    expect(cs.fontWeight).toBe('800')
    expect(cs.fontVariantNumeric).toBe('tabular-nums')
    wrapper.unmount()
  })

  it('AND IT FITS A 375x667 PHONE - the marker costs the text column nothing, across or down', async () => {
    // ⚠⚠ ROUND 42 #52 ASKED FOR THIS MEASUREMENT BY NAME: «it still needs the 375 measurement, now of
    // the rebuilt card in its new arrangement … moving two elements out of the text flow changes
    // where its lines wrap». The claim that makes the answer easy is that NOTHING GREW: the marker is
    // narrower than the price line that was already in this column, and shorter than the row's own
    // floor. So `.cm-body` is the width it was and no line wraps where it did not wrap before.
    // ⚠ `setViewport` BEFORE mounting - a media query is evaluated on an element's first computed
    // style read and then cached (fits.ts's own ⚠⚠ note).
    assertSheetPresent()
    setViewport(PHONE)
    const wrapper = await mountCoaches(withChemistry(hired(), -64), true)
    const rows = wrapper.findAll('.cm-row')
    expect(rows.length, 'the whole board, not one card').toBe(16)

    for (const row of rows) {
      const right = row.find('.cm-right').element
      const room = availableWidth(right, PHONE)
      const ring = px(getComputedStyle(row.find('.cm-chem .tb-ring').element).width, 'the gauge width')
      expect(ring, 'the gauge is the 36px variant he named in round 41 #28').toBe(36)

      // ACROSS. `.cm-right` is `flex: none`, so its width is its widest child: the money group, or
      // the marker. The marker is the ring, and the money group is the wider of the price and the
      // action word - measured on the SHIPPED board at every rung, cheapest coach included, so this
      // is «the marker never widens the column» as a fact about the real list rather than a hope.
      const money = Math.max(inkWidth(row.find('.cm-price').element), inkWidth(row.find('.cm-action').element))
      expect(
        ring,
        `${row.find('.cm-name').text()}: the marker is ${ring}px against the price group's ${money.toFixed(1)}px, ` +
          'so the text column keeps every pixel it had and nothing re-wraps',
      ).toBeLessThanOrEqual(money)

      // DOWN. The two groups stack inside the row's own padding box, so the marker cannot make a card
      // taller than the floor round 42 #3 already put under every one of them.
      const rowCs = getComputedStyle(row.element)
      const floor = px(rowCs.minHeight, '.cm-row min-height')
      const pad = px(rowCs.paddingTop, 'padding-top') + px(rowCs.paddingBottom, 'padding-bottom')
      const stacked = boxOf(row.find('.cm-money').element, room).h + boxOf(row.find('.cm-chem').element, room).h
      // ⚠ TWO FLOORS AND NOT ONE, BOTH ROUND 42 #3's: an ordinary card is 168 and the card of the
      // coach she HAS is 196, because its portrait window is wider and the floor is derived from that
      // window's own ratio. Reading whichever applies is the point - hard-coding 168 made this
      // assertion red on the one row it most needed to measure, which is how the pair was found.
      expect(floor, 'round 42 #3\'s floor is still what it was').toBe(row.classes('current') ? 196 : 168)
      expect(
        stacked,
        `the right column stacks ${stacked.toFixed(0)}px into the ${(floor - pad).toFixed(0)}px the card already has`,
      ).toBeLessThanOrEqual(floor - pad)
    }
    wrapper.unmount()
  })

  it('and the hire confirm still closes on a 375x667 phone with the marker on the board', async () => {
    // ⚠ A STANDING GUARD RATHER THAN A LAW OBEYED, in wave5-coach-profile.test.ts's own words: this
    // item adds no dialog and lengthens none - the marker goes on a SCROLLING list. It is measured
    // because the hire confirm is the one BLOCKING surface on this screen and round-20 #3 is what
    // happens when a blocking surface is not.
    assertSheetPresent()
    setViewport(PHONE)
    const wrapper = await mountCoaches(withChemistry(hired(), 64), true)
    const hire = wrapper.findAll('.cm-row').find((r) => r.find('.cm-action.is-hire').exists())
    expect(hire, 'the board has a coach this family could hire').toBeTruthy()
    await hire!.trigger('click')
    await nextTick()
    const card = document.querySelector('.dialog-card')
    expect(card, 'the confirm opened').toBeTruthy()
    const dismiss = [...card!.querySelectorAll('.dialog-actions button')].pop()
    expect(dismiss, 'and it has an actionable control').toBeTruthy()
    assertDismissReachable(card!, dismiss!, PHONE, 'the hire confirm')
    wrapper.unmount()
  })
})
