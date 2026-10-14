// R51 №1b – THE CSS CONTRACTS BEHIND THE FOUR OFFENDERS `e2e/r51-overflow-sweep.spec.ts` CAUGHT (owner, 13.10: "somewhere else in the app
// this may be too – take agents and check every part and page on every screen: phone, desktop, tablet").
//
// WHAT THIS FILE CAN AND CANNOT PROVE. happy-dom parses the cascade and lays nothing out, so "the page does not scroll sideways" is
// unaskable here – the sweep measures it in Chromium, in both languages, at 8 phone widths and 5 wide ones, and its first red run on the
// pre-fix CSS is the evidence each fix cites (Russian: More's playback rows +37 px at 320, its 3-pill strip +2 px, the About table +49 px,
// ThisWeek's recap tiles +18 px). What a mounted test CAN ask, through the real cascade, is the CONTRACT each fix is made of, so a later
// "tidy-up" that deletes a declaration goes red here in 20 seconds and not in the next playtest.
//
// ⚠ TWO NAMES FOR TWO QUESTIONS (tests/pin-hygiene): the style blocks are read through `repoFile` – the `.vue` ALONE, the only honest
// source for the NEGATIVE claims below ("the labels do NOT take `anywhere`", "the shared `.tab-row` is NOT a scroller"). `:has()` rules are
// asked of the source, not of the cascade: whether happy-dom evaluates `:has` is its business, and a pin that goes red for the engine's
// reasons would teach people to ignore it. The strip and the About cells are plain selectors, so those two ARE asked of the cascade.
//
// MUTATION TABLE (each run alone against this file, the tree restored byte for byte after – the report of R51 B15 has the hashes):
//   M1 the `.more-tabs` scroll declarations deleted      -> both computed strip arms and the source arm red
//   M2 the strip's pills allowed to shrink (0 1 auto)    -> the computed pill arm and the source arm red
//   M3 `anywhere` given to the About LABELS as well      -> the "labels do not" arm red (it would shrink them at 375, where the table fits)
//   M4 the playback label's basis back to `auto`         -> the source arm red (a bare wrap would move the pills at every width)
//   M5 `useRevealActivePill` deleted from the screen     -> the wiring arm red
//   M6 the recap grid back to `1fr 1fr`                  -> the recap arm red
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { nextTick } from 'vue'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import '../../src/style.css'

import MoreScreen from '../../src/components/screens/MoreScreen.vue'
import { useGameStore } from '../../src/stores/game'
import { toSnapshot, type WorldState } from '../../src/engine/world'
import { migrateSave } from '../../src/engine/migrations'
import { resetI18nForTests } from '../../src/i18n'
import type { Snapshot } from '../../src/shared/protocol'
import { installMemoryStorage } from './setup'
import { NARROW_PHONE, PHONE, setViewport, type Viewport } from './fits'
import { after } from '../helpers/source'

/** ⚠ NOT `componentFile()`: that helper resolves against `import.meta.url`, which under happy-dom is an http scheme and throws. The claim it
 *  is used for is still the NEGATIVE one it exists for: the `.vue` ALONE, never widened by a composable. */
const repoFile = (rel: string): string => readFileSync(resolve(process.cwd(), rel), 'utf8')

/** The shared stylesheet as text, applied AFTER the screens' own scoped styles in one of the two orders – the production bundle's. */
const SHEET = repoFile('src/style.css')

interface Rule {
  selector: string
  body: string
}
/** An SFC's scoped style block with its comments cut out (so a note that QUOTES a declaration cannot satisfy or trip a pin), as rules. */
function rulesOf(sfc: string): Rule[] {
  // ⚠ `after()` KEEPS THE MARKER (measured: the first rule's selector came back as "<style scoped> .more-tabs", and More's first rule IS the
  // strip's), so the tag is cut explicitly – a scan that mis-reads its own first rule would fail a positive pin for the wrong reason.
  const css = after(sfc, '<style scoped>').replace('<style scoped>', '').replace(/\/\*[\s\S]*?\*\//g, '')
  return [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)].map((m) => ({ selector: m[1]!.trim(), body: m[2]!.trim() }))
}
const bodyOf = (rules: Rule[], selector: string): string => {
  const rule = rules.find((r) => r.selector === selector)
  expect(rule, `the rule \`${selector}\` is gone`).toBeDefined()
  return rule!.body
}

/** The v46 golden save, migrated and snapshotted – a REAL career, the same fixture the R-L4 net and the budget strip's net mount with. */
function goldenSnapshot(): Snapshot {
  const world = migrateSave(JSON.parse(readFileSync(resolve(process.cwd(), 'tests/fixtures/saves/v46.json'), 'utf8'))) as WorldState
  return toSnapshot(world)
}
let golden: Snapshot

beforeEach(() => {
  installMemoryStorage()
  resetI18nForTests(null)
  setActivePinia(createPinia())
  document.body.innerHTML = ''
  golden ??= goldenSnapshot()
})
afterEach(() => {
  document.body.innerHTML = ''
  vi.restoreAllMocks()
})

/** More mounted inside the REAL shell. ⚠ `setViewport` runs BEFORE the mount – happy-dom caches a media query on the first computed-style read. */
function mountMore(vp: Viewport): VueWrapper {
  setViewport(vp)
  const app = document.createElement('div')
  app.id = 'app'
  const main = document.createElement('main')
  main.className = 'app-content with-next-week-bar'
  app.appendChild(main)
  document.body.appendChild(app)
  const store = useGameStore()
  store.snapshot = golden
  // The same two replacements every mounted MoreScreen test makes: it asks the worker for these on mount and this runner has none.
  store.refreshCareers = async () => {}
  store.refreshSlots = async () => {}
  return mount(MoreScreen, { global: { stubs: { teleport: true } }, attachTo: main })
}

/** The two orders the cascade can have – a tie between the screen's scoped rule and the sheet is settled by source order (see R-L4's note). */
const ORDERS: { name: string; sheetLast: boolean }[] = [
  { name: "the screen's styles after the sheet", sheetLast: false },
  { name: "the sheet applied AFTER the screen's styles (the production order)", sheetLast: true },
]

describe("R51 №1b – More's chapter strip is a sideways scroller of its own, at every width", () => {
  for (const order of ORDERS) {
    for (const [width, vp] of [['375', PHONE], ['320', NARROW_PHONE]] as const) {
      it(`${width} px, ${order.name}: scrolls sideways itself, keeps one line, does not chain, pills do not shrink`, () => {
        const late = document.createElement('style')
        if (order.sheetLast) {
          late.setAttribute('data-r51', 'the shared sheet, applied after the screens')
          late.textContent = SHEET
          document.head.appendChild(late)
        }
        try {
          const w = mountMore(vp)
          const strip = getComputedStyle(w.get('.more-tabs').element)
          expect(strip.overflowX, 'Play / Saves / About ask 322 px of the 288 a 320 px phone leaves in Russian – the strip must scroll, not the page').toBe('auto')
          expect(strip.flexWrap, 'one mechanism at every width: this row never wraps').toBe('nowrap')
          expect(strip.getPropertyValue('overscroll-behavior-x'), "the strip's end must not drag the page behind it").toBe('contain')
          const pills = w.findAll('.more-tabs button.tab-pill').map((b) => b.element as HTMLElement)
          expect(pills.length, 'Play / Saves / About').toBe(3)
          for (const pill of pills) {
            const cs = getComputedStyle(pill)
            expect(cs.flexShrink, `“${pill.textContent?.trim()}” would be squeezed before the strip scrolls`).toBe('0')
            expect(cs.flexGrow).toBe('0')
          }
          w.unmount()
        } finally {
          late.remove()
        }
      })
    }
  }

  it('control: the shared `.tab-row` plate is NOT a scroller – the ruling is scoped to the offending strip, never to the sheet', () => {
    // A global `overflow` there would turn every segmented row in the app into a scroll container (eight rows use the control, and the
    // others fit). `.tab-row` is read as ITS OWN rule, not as every rule that mentions the class.
    const plain = [...SHEET.replace(/\/\*[\s\S]*?\*\//g, '').matchAll(/(?:^|[}\n])\s*\.tab-row\s*\{([^{}]*)\}/g)].map((m) => m[1]!)
    expect(plain.length, 'the instrument finds the shared `.tab-row` rule').toBeGreaterThanOrEqual(1)
    for (const body of plain) expect(body, 'the shared plate must not become a scroll container').not.toMatch(/overflow(?:-x)?:\s*(?:auto|scroll)/)
  })
})

describe('R51 №1b – the About table: values may break a word as a last resort, labels may not', () => {
  it('computed, 320 px: every value cell takes `anywhere`, no label cell does', async () => {
    const w = mountMore(NARROW_PHONE)
    await w.findAll('.more-tabs button.tab-pill')[2]!.trigger('click')
    await nextTick()
    const table = w.get('table.about-table').element
    const values = Array.from(table.querySelectorAll('td'))
    const labels = Array.from(table.querySelectorAll('th'))
    expect(values.length, 'the instrument finds the table\'s cells').toBeGreaterThanOrEqual(4)
    expect(labels.length).toBeGreaterThanOrEqual(4)
    for (const td of values) expect(getComputedStyle(td).getPropertyValue('overflow-wrap'), 'a value cell must be able to give way').toBe('anywhere')
    // `anywhere` lowers a column's minimum and a table shares its spare room by (max – min): on the labels it would have shrunk them at 375, where the table fits today.
    for (const th of labels) expect(getComputedStyle(th).getPropertyValue('overflow-wrap'), 'the labels keep their longest word').not.toBe('anywhere')
    w.unmount()
  })
})

describe('R51 №1b – the source of each fix, asked of the `.vue` alone', () => {
  const more = repoFile('src/components/screens/MoreScreen.vue')
  const moreRules = rulesOf(more)

  it("the instrument finds More's rules (a scan that matches nothing would pass every negative below)", () => {
    expect(moreRules.length).toBeGreaterThanOrEqual(8)
  })

  it('.more-tabs carries overflow-x: auto, overscroll-behavior-x: contain, a nowrap line and a hidden bar; its pills keep their width', () => {
    const own = bodyOf(moreRules, '.more-tabs')
    expect(own).toMatch(/overflow-x:\s*auto/)
    expect(own).toMatch(/overscroll-behavior-x:\s*contain/)
    expect(own).toMatch(/flex-wrap:\s*nowrap/)
    expect(own).toMatch(/scrollbar-width:\s*none/)
    expect(bodyOf(moreRules, '.more-tabs.as-chapter :deep(.tab-pill)')).toMatch(/flex:\s*0 0 auto/)
    // A scroll container clips outlines: the ring is drawn inside the pill, and the pressed pill's ring takes the dark label colour.
    expect(bodyOf(moreRules, '.more-tabs.as-chapter :deep(.tab-pill:focus-visible)')).toMatch(/outline-offset:\s*-3px/)
    for (const r of moreRules.filter((x) => x.selector.includes('.more-tabs'))) expect(r.body, `${r.selector} wraps`).not.toMatch(/flex-wrap:\s*wrap/)
  })

  it('the wiring: the strip is a ref and the pressed pill is revealed when the chapter changes', () => {
    expect(more).toContain('ref="moreStrip"')
    expect(more).toContain("useTemplateRef<InstanceType<typeof SegmentedRow>>('moreStrip')")
    expect(more).toContain('useRevealActivePill(() => moreStrip.value?.$el as HTMLElement | undefined, screenTab)')
  })

  it('a setting row that holds pills wraps them under the label only when the label cannot shrink beside them – and ONLY those rows', () => {
    expect(bodyOf(moreRules, '.career-row:has(> .option-row)')).toMatch(/flex-wrap:\s*wrap/)
    // The whole trick: a `min-content` basis makes the line break exactly when "longest word + gap + pills" no longer fits.
    expect(bodyOf(moreRules, '.career-row:has(> .option-row) > :first-child')).toMatch(/flex:\s*1 1 min-content/)
    // ⚠ NEGATIVE: a bare `.career-row { flex-wrap: wrap }` wraps by max-content, and a label with a hint sentence is wider than any phone –
    // the pills would drop under the label at 375 and 414 as well, where the row fits today.
    for (const r of moreRules.filter((x) => x.selector === '.career-row')) expect(r.body, 'a bare .career-row must not wrap').not.toMatch(/flex-wrap/)
  })

  it('the About table is marked, its VALUE cells take `anywhere`, and no rule gives it to the label cells', () => {
    expect(more).toContain('<table class="about-table"')
    expect(bodyOf(moreRules, '.about-table td')).toMatch(/overflow-wrap:\s*anywhere/)
    for (const r of moreRules.filter((x) => /\babout-table\b[^{}]*\bth\b|(?:^|,)\s*th\b/.test(x.selector))) {
      expect(r.body, `${r.selector} would shrink the labels`).not.toMatch(/overflow-wrap:\s*anywhere/)
    }
    for (const r of moreRules.filter((x) => x.selector.includes('.about-table'))) {
      if (/\bth\b/.test(r.selector)) expect(r.body).not.toMatch(/overflow-wrap:\s*anywhere/)
    }
  })

  it('the week recap grid has columns that can shrink below their tiles\' longest word', () => {
    const recap = rulesOf(repoFile('src/components/WeekRecapCard.vue'))
    const grid = recap.filter((r) => r.selector.includes('.recap-grid'))
    expect(grid.length, 'the instrument finds the recap grid').toBeGreaterThanOrEqual(1)
    const columns = grid.filter((r) => r.body.includes('grid-template-columns'))
    expect(columns.length).toBeGreaterThanOrEqual(1)
    for (const r of columns) {
      expect(r.body, 'plain `1fr` is `minmax(auto, 1fr)` and a Russian 16-letter word in the Highlights tile widened the page at 320 px').toMatch(/minmax\(0,\s*1fr\)/)
      expect(r.body).not.toMatch(/1fr\s+1fr/)
    }
  })
})
