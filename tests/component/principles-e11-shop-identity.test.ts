// =================================================================================================
// E-11 RENDER IDENTITY – the net that lets the Money shop leave MoneyScreen.vue (T6.3, W6)
// =================================================================================================
//
// ⚠ WHAT THIS FILE IS. E-11 moves the shelf's script, template and style out of a 4,913-line screen
// into `ShopPanel.vue` plus `composables/shop.ts`. That is an OWNERSHIP refactor with no behaviour
// and no wording in it (`docs/review-principles-2026-09-26/05-ui.md`, E-11: «No wording or behaviour
// moves»), so the proof it needs is not "the shop still works" – it is "the shop renders the SAME
// BYTES". `tests/component/round34-money-shelf.test.ts` and its eight siblings already assert what
// the shelf SAYS about one thing at a time; this file writes down EVERYTHING the shop region renders,
// over four real careers, and compares the whole capture against a record frozen BEFORE the move.
//
// ⚠⚠ AND IT PINS THE VALUE, NOT ONLY THE SHAPE, which is the failure mode this repo has already paid
// for: a render net that cannot see a changed price is a net that agrees with a mistake. So every
// capture carries the rendered TEXT (prices, family titles, «Worth now» figures, the wait sentences),
// the CONTROL STATE (`disabled`, `aria-pressed`, `aria-expanded`, `aria-label`, `placeholder`, `min`,
// `maxlength`) and – because a scoped `<style>` block does NOT follow markup into a new SFC – a set
// of COMPUTED STYLE probes read through the real cascade. The class list alone cannot see a rule that
// stayed behind, and the rule staying behind is the likeliest way this move goes wrong.
//
// ⚠ WHY FOUR ARMS AND WHICH CAREERS. `e2e/fixtures/manifest.json`'s careers are the product's own
// bytes, so every number below is one the engine really produced. Two are used:
//   `pro`      week 412, $2,666,663 in hand, 7 seasons – 60 months of unit-price history behind the
//              fund's chart, and a wallet that can reach the middle of the shelf and not the top, so
//              `canBuy` is a MIX of true and false across the 21 rungs.
//   `parting`  week 1133, $8,511,984, 21 seasons – the other end of the career: her business share is
//              60 % rather than 40 %, so the Business tab's share line renders a different sentence,
//              and the deeper wallet flips rungs the `pro` arm cannot press.
// ⚠ AND EACH IS READ TWICE, BARE AND BOUGHT, because a fixture owns NOTHING on the shelf – measured:
// all thirteen careers in the manifest report `ownedCount` 0, because the generator's policy never
// buys. A bare arm alone would therefore render only the shop-window half and leave `is-owned`, the
// build ring, «On order», «Trading as», the units line, the shared stake field and `canSell` entirely
// uncovered – about half of the markup this task moves. The `bought` arm buys through the engine's own
// `buyAsset`, never by poking a row (`round41-fund-marks.test.ts`'s rule, for its reason: a
// hand-written holding tests the template against a shape no command produces).
//
// ⚠ THE MUTATION ARM, NAMED (plan §2). Measured on the unfixed tree at `7609effb`, before a byte of
// the extraction was written:
//
//   ARM M1  `rateLine`'s loss branch mis-scaled, at `MoneyScreen.vue:1296` on the unfixed tree:
//           `Loses ${-row.annualRatePct}% a season` -> `Loses ${-row.annualRatePct * 2}% a season`,
//           i.e. ONE rendered percentage on the Cars, Water and Air rungs.
//           -> RED, `1 failed | 1 passed (2)`, exit 1, naming the arm and the page:
//              «pro-bare: a sentence, a price or a title on the shelf MOVED», with
//              «The sensible estate Loses 6% a season» read back as «Loses 12% a season».
//           -> the same file on the same tree with the mutation reverted: `2 passed (2)`, exit 0.
//
// That is the arm this net exists for: one digit in one sentence on three families of rungs, and the
// record refuses it. Reproduction is one edit and one revert – no stash, in a shared checkout.
//
// ⚠ REGENERATING IS DELIBERATE AND LOUD (match-viewer-parity.test.ts's precedent, same reason):
// `TB_WRITE_SHOP_IDENTITY=1 npx vitest run --project component tests/component/principles-e11-shop-identity.test.ts`
// rewrites the record and asserts nothing. A refactor that needs it has changed behaviour, and THAT
// is the finding.
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'
import type { VueWrapper } from '@vue/test-utils'

import '../../src/style.css'
import MoneyScreen from '../../src/components/screens/MoneyScreen.vue'
import { useGameStore } from '../../src/stores/game'
import { decodeExportFile } from '../../src/engine/saveCodec'
import { buyAsset, toSnapshot, type WorldState } from '../../src/engine/world'
import type { Snapshot } from '../../src/shared/protocol'
import { fnv1aHex } from '../helpers/hash'
import { DESKTOP, setViewport } from './fits'
import { SHELF_TAB_LABELS, openShelfTab } from './shelf'

// ⚠ `resolve(process.cwd(), …)` RATHER THAN `new URL(…, import.meta.url)`: the component project runs
// under happy-dom, whose global `URL` is the DOM one, and `readFileSync` rejects what it produces
// ("The URL must be of scheme file"). The house idiom in `tests/component/`, and the reason
// `tests/helpers/career.ts` bans `import.meta.url` outright.
const FIXTURE_DIR = resolve(process.cwd(), 'tests/fixtures/shop-identity')
const RECORD_FILE = resolve(FIXTURE_DIR, 'render.json')
const CAREERS = resolve(process.cwd(), 'e2e/fixtures')
const WRITING = process.env.TB_WRITE_SHOP_IDENTITY === '1'

// -------------------------------------------------------------------------------------------------
// THE CAREERS. Real export files, decoded through the product's own `decodeExportFile`.
// -------------------------------------------------------------------------------------------------
async function career(name: string): Promise<WorldState> {
  return decodeExportFile(new Uint8Array(readFileSync(resolve(CAREERS, `${name}.tsave`))))
}

/** The purchases the `bought` arms make, in order, through the engine's own command.
 *
 *  ⚠ CHOSEN TO LIGHT UP EVERY ARM OF THE MARKUP AND TO FIT THE SMALLER WALLET. Total outlay
 *  $1,255,000 against `pro`'s $2,666,663, so both careers execute the identical script and the two
 *  records differ only for the reasons the careers differ. What each line is FOR:
 *    two fund buys  an 'open' rung that is owned -> the shared stake field, «Add more» and «Sell»,
 *                   the units line, and TWO purchase marks on the chart at two different weeks
 *    the deposit    a second 'open' rung, so the field is not proved on one row only
 *    car-sensible   a 'fixed' owned rung -> `is-owned`, the corner action, and no `paid $N` meta
 *    merch-brand    the one nameable rung -> «Trading as …» off the engine's own suggestion
 *    boat-launch    a rung that BUILDS -> `is-building`, «On order», and the 36px ProgressRing */
function buyTheShelf(world: WorldState): void {
  const readWeek = world.week
  // ⚠ TWO DIFFERENT WEEKS, because one mark on a chart proves nothing about the second – see
  // `round41-fund-marks.test.ts`'s «a TOP-UP is its own mark». Both inside the picker's default
  // 12-month window, so the marks are drawn on the arm the record opens on.
  world.week = readWeek - 30
  buyAsset(world, 'index-fund', 20_000_00)
  world.week = readWeek - 8
  buyAsset(world, 'index-fund', 20_000_00)
  world.week = readWeek
  buyAsset(world, 'deposit', 5_000_00)
  buyAsset(world, 'car-sensible')
  buyAsset(world, 'merch-brand')
  buyAsset(world, 'boat-launch')
}

// -------------------------------------------------------------------------------------------------
// THE CAPTURE. Everything the shop region renders, as text a human can diff.
// -------------------------------------------------------------------------------------------------
/** The shop's own top-level regions, in document order. Every one of them is a sibling that used to
 *  sit directly in MoneyScreen's column, so this list is also the definition of «what moved». */
const REGIONS = ['.money-shop', '.shelf-cats', '.shelf-tabs', '.shelf-share-line', '.shelf-feed'] as const

/** Attributes worth writing down: the ones that carry a CONTROL's state or an accessible name.
 *  ⚠ `data-v-*` IS DELIBERATELY NOT AMONG THEM – a scope id is a compiler artefact and the whole
 *  point of this move is that the markup acquires a new one. Pinning it would guarantee a red run
 *  for the one reason that is not a defect. */
const ATTRS = [
  'aria-controls',
  'aria-describedby',
  'aria-expanded',
  'aria-hidden',
  'aria-label',
  'aria-pressed',
  'aria-selected',
  'alt',
  'disabled',
  'inputmode',
  'max',
  'maxlength',
  'min',
  'placeholder',
  'role',
  'step',
  'title',
  'type',
  'value',
  'viewBox',
] as const

/** One element as a line: depth, tag, classes, the attributes above, and its OWN text (never its
 *  children's, so a parent does not restate the whole subtree). */
function lineOf(el: Element, depth: number): string {
  const classes = [...el.classList].sort().join('.')
  const attrs = ATTRS.filter((a) => el.hasAttribute(a))
    .map((a) => `${a}=${JSON.stringify(el.getAttribute(a) ?? '')}`)
    .join(' ')
  const own = [...el.childNodes]
    .filter((n) => n.nodeType === 3)
    .map((n) => (n.textContent ?? '').replace(/\s+/g, ' ').trim())
    .filter(Boolean)
    .join(' ')
  return `${'  '.repeat(depth)}${el.tagName.toLowerCase()}${classes ? `.${classes}` : ''}${attrs ? ` [${attrs}]` : ''}${own ? ` «${own}»` : ''}`
}

function walk(el: Element, depth: number, out: string[]): void {
  out.push(lineOf(el, depth))
  for (const child of [...el.children]) walk(child, depth + 1, out)
}

/** The whole shop region of whatever is currently on screen, as lines. */
function shopTree(wrapper: VueWrapper, label: string): string[] {
  const out: string[] = [`== ${label} ==`]
  for (const sel of REGIONS) {
    for (const node of wrapper.findAll(sel)) walk(node.element, 1, out)
  }
  // The shop's confirmation question is part of the region: it is `pendingShop`'s only surface.
  for (const node of wrapper.findAll('.dialog-card')) walk(node.element, 1, out)
  return out
}

/** The sentences the player reads, whitespace-normalised – the readable half of the record, and the
 *  half that fails FIRST when a price or a title moves. ⚠ THE DIALOG IS PART OF IT: `pendingShop`'s
 *  question is the shop's longest computed sentence (`shopConfirmMessage` has five branches) and it
 *  renders OUTSIDE the five regions, so a capture that read only them would move the confirmation
 *  copy silently. */
function shopText(wrapper: VueWrapper): string {
  return [...REGIONS, '.dialog-card']
    .map((sel) => wrapper.findAll(sel).map((n) => n.text()).join(' ⟂ '))
    .join(' ⟂ ')
    .replace(/\s+/g, ' ')
    .trim()
}

/** Every pressable or typable thing in the shop region, with the state that decides whether the
 *  player can use it. `canBuy` / `canSell` are ADVISORY predicates whose only visible effect is this
 *  flag, so this list IS the pin on both of them. */
function shopControls(wrapper: VueWrapper): string[] {
  const out: string[] = []
  for (const sel of REGIONS) {
    for (const region of wrapper.findAll(sel)) {
      for (const el of [...region.element.querySelectorAll('button, input, a, [role="group"]')]) {
        out.push(lineOf(el, 0))
      }
    }
  }
  return out
}

/** The computed-style probes. ⚠ THIS IS THE HALF A CLASS LIST CANNOT SEE: MoneyScreen's `<style
 *  scoped>` block does not follow its markup into another SFC, so a rule left behind produces an
 *  IDENTICAL tree with a different picture. Each entry is «the declaration some owner ruling is
 *  about», so a red line here names the ruling that broke.
 *
 *  ⚠ PROPERTIES ARE SPELLED IN CSS, read through `getPropertyValue` rather than through the camelCase
 *  accessor: happy-dom answers `undefined` for the accessors it does not implement (`maskImage` was
 *  one, measured), and `undefined` is a probe that pins nothing while looking like it does. */
const STYLE_PROBES: [selector: string, props: string[]][] = [
  // Round 30 #5 – the cards lie with no shared backing, laid out as the Season feed lays events.
  ['.shelf-feed', ['display', 'flex-direction', 'gap']],
  // Round 36 phase 4 – the rungs go two to a row, `auto-fill, minmax(--card-min, 1fr)` above 1024,
  // and the doubled selector is what makes the desktop rung outweigh the tablet one.
  ['.shop-family', ['display', 'grid-template-columns', 'align-items', 'gap']],
  // Round 35 #3 – the six category tiles: his 3x2, his ratio, the D18 reading cap, the name in Sora.
  ['.shelf-cats', ['display', 'grid-template-columns', 'gap', 'max-width', 'margin-inline']],
  ['.shelf-cat', ['aspect-ratio', 'position', 'overflow', 'border-radius']],
  ['.shelf-cat-name', ['font-family', 'font-size', 'text-align']],
  // Round 30 #5 – the family heading and its note sit OUTSIDE the cards.
  ['.shop-family-head', ['font-family', 'font-size', 'color']],
  ['.shop-family-note', ['font-size', 'color', 'line-height']],
  // Round 34 #18 – what the family owns is in the COACH's frame (`.cm-row.current`'s declarations).
  ['.shop-row.is-owned', ['border-color', 'border-width', 'box-shadow']],
  // Round 35 #5-#9 / round 36 review #11 – which side the painting stands on, and how wide it is.
  ['.shop-row--art-left > .shop-row-art', ['position', 'left', 'width', 'mask-image']],
  ['.shop-row--art-left > .shop-row-body', ['padding-left']],
  // Round 34 #20 / round 35 #12 – one field, two controls, one line, and it wraps rather than overflows.
  ['.shop-stake-row', ['display', 'flex-wrap', 'align-items', 'gap']],
  ['.shop-stake-input', ['border-radius', 'font-size', 'background']],
  ['.shop-action', ['border-radius', 'font-size', 'padding']],
  // Round 41 #22 – the bubble cannot leave the card, by construction rather than by a clamp.
  ['.fund-chart-plot-wrap', ['position']],
  // Round 34 #19 – the chart's own plate.
  ['.fund-chart-range', ['border-radius', 'font-size']],
  ['.fund-chart-line', ['fill', 'stroke', 'stroke-width']],
  // Round 43 #5 – whose money the figures are.
  ['.shelf-share-line', ['font-size', 'color']],
  // Round 30 #5's second clause – six segments on a phone WRAP rather than push the document sideways.
  ['.shelf-tabs', ['flex-wrap', 'row-gap', 'border-radius', 'margin-top']],
  // The shelf plate itself, which is `.money-panel`'s object wearing `.money-shop`.
  ['.money-shop', ['margin-top']],
  ['.money-shop .money-panel-note', ['font-size', 'line-height', 'color']],
  // Round 41 #28 – the build ring rides the painting's top-right corner.
  ['.card-art', ['position', 'overflow']],
  ['.card-art img', ['object-fit', 'width', 'height']],
  ['.card-art .build-ring', ['position', 'top', 'right']],
]

/** ⚠ THE OBJECTS A CAREER THAT OWNS NOTHING CANNOT SHOW, named rather than tolerated in bulk. A
 *  fixture buys nothing (measured: every career in the manifest reports `ownedCount` 0), so the
 *  `bare` arms have no owned frame, no shared stake row and no delivery ring to measure – and that is
 *  exactly what the `bought` arms exist for. Anything else reading ABSENT is a probe that stopped
 *  measuring, which is the silent-green failure this file is written against. */
const OWNED_ONLY_PROBES = ['.shop-row.is-owned', '.shop-stake-row', '.card-art .build-ring']

function shopStyles(wrapper: VueWrapper): Record<string, string> {
  const out: Record<string, string> = {}
  for (const [selector, props] of STYLE_PROBES) {
    const el = wrapper.element.querySelector(selector)
    if (!el) {
      out[selector] = 'ABSENT'
      continue
    }
    const cs = getComputedStyle(el)
    out[selector] = props.map((p) => `${p}=${cs.getPropertyValue(p)}`).join('; ')
  }
  return out
}

/** Merge a page's probes into the arm's, FIRST reading wins. The objects live on different pages of
 *  the shop – the plate and the tiles on the home, the chart on Invest, the painting on Cars, the
 *  share line on Business, the delivery ring on Water – so one page can never carry them all. */
function mergeStyles(into: Record<string, string>, page: Record<string, string>): void {
  for (const [k, v] of Object.entries(page)) {
    if (v !== 'ABSENT' && (into[k] === undefined || into[k] === 'ABSENT')) into[k] = v
    else if (into[k] === undefined) into[k] = v
  }
}

interface Arm {
  /** `home` plus one entry per shelf segment: the sentences the player reads on that page. */
  text: Record<string, string>
  /** `home` plus one per segment: every control and its state. */
  controls: Record<string, string[]>
  /** The computed-style probes, merged across every page the arm visits (first reading wins). */
  styles: Record<string, string>
  /** How many of each thing, per page – the cheap readable check before the hash. */
  counts: Record<string, number>
  /** fnv1a over the FULL element tree of every page, unabridged. */
  hash: string
}

async function mountShop(snapshot: Snapshot): Promise<VueWrapper> {
  useGameStore().snapshot = snapshot
  const wrapper = mount(MoneyScreen, { global: { stubs: { teleport: true } }, attachTo: document.body })
  const tab = wrapper.findAll('button.tab-pill').find((n) => n.text().trim() === 'Shop')
  expect(tab, 'the Shop tab control').toBeTruthy()
  await tab!.trigger('click')
  return wrapper
}

async function runArm(name: string, bought: boolean): Promise<Arm> {
  const world = await career(name)
  if (bought) buyTheShelf(world)
  const wrapper = await mountShop(toSnapshot(world))

  const text: Record<string, string> = {}
  const controls: Record<string, string[]> = {}
  const counts: Record<string, number> = {}
  const lines: string[] = []

  // THE HOME – the shelf plate, the six category cards, and no switcher in the document at all.
  text.home = shopText(wrapper)
  controls.home = shopControls(wrapper)
  counts['home.cats'] = wrapper.findAll('.shelf-cat').length
  counts['home.tabs'] = wrapper.findAll('.shelf-tabs').length
  lines.push(...shopTree(wrapper, 'home'))

  const styles: Record<string, string> = {}
  mergeStyles(styles, shopStyles(wrapper))
  for (const label of SHELF_TAB_LABELS) {
    await openShelfTab(wrapper, label)
    text[label] = shopText(wrapper)
    controls[label] = shopControls(wrapper)
    counts[`${label}.rows`] = wrapper.findAll('.shop-row').length
    counts[`${label}.owned`] = wrapper.findAll('.shop-row.is-owned').length
    counts[`${label}.marks`] = wrapper.findAll('.fund-chart-mark').length
    lines.push(...shopTree(wrapper, label))
    mergeStyles(styles, shopStyles(wrapper))
  }

  // THE INTERACTIONS – the four states a capture of a resting page cannot reach.
  await openShelfTab(wrapper, 'Invest')
  // (a) a purchase mark's bubble open: `chartMarks` -> `openMarkOf` -> `markAlign`'s lean.
  const hit = wrapper.find('.fund-chart-hit')
  if (hit.exists()) {
    await hit.trigger('click')
    text['mark-open'] = shopText(wrapper)
    controls['mark-open'] = shopControls(wrapper)
    counts['mark-open.pops'] = wrapper.findAll('.fund-chart-pop').length
    lines.push(...shopTree(wrapper, 'mark-open'))
    await hit.trigger('click')
  }
  // (b) a figure typed into an UNOWNED 'open' rung's own field: `stakeCentsFor` -> `canBuy`, whose
  //     only visible effect is the control's `disabled` flag. Reached on every arm, owned or not.
  const open = wrapper.find('.shop-stake .shop-stake-input')
  if (open.exists()) {
    await open.setValue('1')
    text['under-minimum'] = shopText(wrapper)
    controls['under-minimum'] = shopControls(wrapper)
    lines.push(...shopTree(wrapper, 'under-minimum'))
    await open.setValue('')
  }
  // (c) the same figure typed into the SHARED field a holding draws: `stakeCentsFor` /
  //     `sellCentsFor` / `canBuy` / `canSell` all read the one value.
  const field = wrapper.find('.shop-stake-row .shop-stake-input')
  if (field.exists()) {
    await field.setValue('999999999')
    text['over-wallet'] = shopText(wrapper)
    controls['over-wallet'] = shopControls(wrapper)
    lines.push(...shopTree(wrapper, 'over-wallet'))
    await field.setValue('1000')
    text['part-sale'] = shopText(wrapper)
    controls['part-sale'] = shopControls(wrapper)
    lines.push(...shopTree(wrapper, 'part-sale'))
    // (d) the confirmation question itself – `shopConfirmMessage`'s part-sale sentence.
    const sell = wrapper.findAll('.shop-stake-row .shop-action').find((b) => b.text().trim() === 'Sell')
    if (sell && !sell.attributes('disabled')) {
      await sell.trigger('click')
      text['ask-sell'] = shopText(wrapper)
      counts['ask-sell.dialogs'] = wrapper.findAll('.dialog-card').length
      lines.push(...shopTree(wrapper, 'ask-sell'))
    }
  }

  wrapper.unmount()
  return { text, controls, styles, counts, hash: fnv1aHex(lines.join('\n')) }
}

const ARMS: [name: string, career: string, bought: boolean][] = [
  ['pro-bare', 'pro', false],
  ['pro-bought', 'pro', true],
  ['parting-bare', 'parting', false],
  ['parting-bought', 'parting', true],
]

beforeEach(() => {
  setActivePinia(createPinia())
  setViewport(DESKTOP)
  document.body.innerHTML = ''
})

describe('E-11 – the shop region renders identically before and after the extraction', () => {
  it('the frozen record reproduces, page for page, control for control, declaration for declaration', async () => {
    const captured: Record<string, Arm> = {}
    for (const [name, fixture, bought] of ARMS) {
      setActivePinia(createPinia())
      document.body.innerHTML = ''
      captured[name] = await runArm(fixture, bought)
    }

    if (WRITING) {
      mkdirSync(FIXTURE_DIR, { recursive: true })
      writeFileSync(RECORD_FILE, JSON.stringify(captured, null, 2) + '\n')
      // Loud on purpose: a run that WROTE the record has not checked anything.
      console.warn(`[e11] rewrote ${RECORD_FILE} – this run asserted nothing`)
      return
    }

    expect(existsSync(RECORD_FILE), `no frozen record at ${RECORD_FILE}`).toBe(true)
    const golden = JSON.parse(readFileSync(RECORD_FILE, 'utf8')) as Record<string, Arm>
    expect(Object.keys(captured).sort()).toEqual(Object.keys(golden).sort())
    for (const name of Object.keys(golden)) {
      // The readable halves first, so a red run says WHAT moved before it says that something did.
      expect(captured[name].counts, `${name}: the shop grew or lost elements`).toEqual(golden[name].counts)
      expect(captured[name].text, `${name}: a sentence, a price or a title on the shelf MOVED`).toEqual(
        golden[name].text,
      )
      expect(captured[name].controls, `${name}: a control's state or accessible name moved`).toEqual(
        golden[name].controls,
      )
      expect(captured[name].styles, `${name}: a shop declaration did not survive the move`).toEqual(
        golden[name].styles,
      )
      // ...and the hash is over the FULL element tree of every page, including what the three
      // readable halves above abbreviate.
      expect(captured[name].hash, `${name}: the shop's element tree moved`).toBe(golden[name].hash)
    }
  }, 120_000)

  it('...and the record is not vacuous: it holds a real shelf, real money and real controls', () => {
    const golden = JSON.parse(readFileSync(RECORD_FILE, 'utf8')) as Record<string, Arm>
    expect(Object.keys(golden)).toHaveLength(4)
    for (const [name, arm] of Object.entries(golden)) {
      // Every one of the 21 rungs is reachable across the six segments – §2's «the shelf is a
      // window» read as a count, so a record of an empty shop cannot pass for a record of a shop.
      const rows = SHELF_TAB_LABELS.reduce((n, label) => n + (arm.counts[`${label}.rows`] ?? 0), 0)
      expect(rows, `${name}: the shelf has no rungs on it`).toBe(21)
      expect(arm.counts['home.cats'], `${name}: the six category cards`).toBe(6)
      expect(arm.counts['home.tabs'], `${name}: the switcher is NOT on the home`).toBe(0)
      // A record with no money in it would pin no arithmetic at all.
      expect(arm.text.Invest, `${name}: the Invest page prints no figure`).toMatch(/\$[\d,]+/)
      expect(arm.text.Cars, `${name}: the Cars page prints no rate`).toMatch(/a season/)
      // ...and the style probes all resolved: an `ABSENT` probe is a claim nobody is making. The
      // three owned-only objects are named above rather than waved through.
      const absent = Object.entries(arm.styles).filter(([, v]) => v === 'ABSENT').map(([k]) => k)
      expect(absent, `${name}: these declarations were never measured`).toEqual(
        name.endsWith('-bought') ? [] : OWNED_ONLY_PROBES,
      )
      // ...and every probe that DID resolve read a real value rather than the empty string happy-dom
      // returns for a property nothing declares, or the `undefined` it returns for one it cannot read.
      const empty = Object.entries(arm.styles)
        .filter(([, v]) => v !== 'ABSENT' && /=(;|$|undefined)/.test(v))
        .map(([k]) => k)
      expect(empty, `${name}: these probes read nothing`).toEqual([])
    }
    // The two careers really are different careers, or the four arms are two arms twice.
    expect(golden['pro-bare'].hash).not.toBe(golden['parting-bare'].hash)
    // ...and BUYING really changed the page, which is what makes the owned half of the markup covered.
    expect(golden['pro-bought'].hash).not.toBe(golden['pro-bare'].hash)
    expect(golden['pro-bought'].counts['Invest.owned'], 'the bought arm owns nothing').toBeGreaterThan(0)
    expect(golden['pro-bought'].counts['Invest.marks'], 'the chart drew no purchase mark').toBe(2)
    expect(golden['pro-bought'].text['ask-sell'], 'the part-sale question was never asked').toMatch(/out of/)
  })

  // ===============================================================================================
  // ⚠⚠ THE ONE THING THE FROZEN RECORD CANNOT SEE, AND THE EXTRACTION PUTS A BOUNDARY THROUGH IT.
  // ===============================================================================================
  //
  // `pendingShop` is WRITTEN FROM A TEMPLATE – `@cancel="pendingShop = null"` on the question – and
  // after E-11 that ref is reached through a destructure of what `useShop()` returns rather than
  // through a `ref()` the compiler can see declared in the same block. Vue handles it (a maybe-ref
  // setup binding is written through an `isRef` guard), and a capture of what the page SAYS could
  // not tell the difference between «the write works» and «the dialog never closes»: the record
  // photographs the dialog OPEN and says nothing about either exit.
  //
  // So both exits are pressed here. It is a new case rather than a new key in the record, on purpose:
  // the record has to stay byte-identical across the move for it to prove anything.
  it('⚠ the question closes on Cancel and dispatches on confirm – the seam the move runs through', async () => {
    const world = await career('pro')
    buyTheShelf(world)
    const store = useGameStore()
    const wrapper = await mountShop(toSnapshot(world))
    await openShelfTab(wrapper, 'Invest')
    const sold = vi.spyOn(store, 'sellAsset').mockResolvedValue(undefined)

    const ask = async (): Promise<void> => {
      const field = wrapper.find('.shop-stake-row .shop-stake-input')
      await field.setValue('1000')
      const sell = wrapper.findAll('.shop-stake-row .shop-action').find((b) => b.text().trim() === 'Sell')
      expect(sell, 'the Sell control on the deposit').toBeTruthy()
      await sell!.trigger('click')
    }

    await ask()
    expect(wrapper.findAll('.dialog-card'), 'the question did not open').toHaveLength(1)
    const cancel = wrapper.findAll('.dialog-card button').find((b) => b.text().trim() === 'Cancel')
    await cancel!.trigger('click')
    expect(wrapper.findAll('.dialog-card'), 'Cancel left the question on screen').toHaveLength(0)
    expect(sold, 'Cancel sent the command anyway').not.toHaveBeenCalled()

    await ask()
    const confirm = wrapper.findAll('.dialog-card button').find((b) => b.text().trim() === 'Sell it')
    await confirm!.trigger('click')
    expect(wrapper.findAll('.dialog-card'), 'confirming left the question on screen').toHaveLength(0)
    // ⚠ THE AMOUNT IS THE ASSERTION, not the fact of a call: `askSell` sends `partCents` and nothing
    // else for a part sale, which is the engine's «sell the lot» told apart from «sell this much».
    expect(sold).toHaveBeenCalledTimes(1)
    expect(sold.mock.calls[0]).toEqual(['deposit', 1000_00])
    sold.mockRestore()
    wrapper.unmount()
  }, 60_000)
})
