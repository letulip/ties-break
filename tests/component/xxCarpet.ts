// THE `xx` CARPET – wave L4-2 (spec §6, §8). Every mounted screen and dialog under the pseudo-locale in ONE tier, with one
// instrument and one report. The eleven L2 arms and the L3 nets each swept the surfaces of their own wave with their own copy of
// this logic (`widest` exists in eight files); the carpet is the whole-app pass they were always going to be.
//
// FOR EACH SURFACE (a registry entry in an `i18n-l4-2-xx-carpet-*.test.ts` file):
//   1. mount it in English at 375x667 and measure it (the baseline);
//   2. mount it under `xx` (the catalog for everything wrapped; `expandRendered` pads the ENGINE's words, which are unwrapped
//      until the engine itself speaks the catalog) and measure again;
//   3. (a) LEAKS   text nodes and copy attributes without the bracket, minus the shared allowlist, minus the engine's own words;
//      (b) OVERFLOW  a text box whose longest unbreakable run, or a nowrap line, is wider than the room its ancestors leave it –
//                    the document grows sideways. Boxes inside an `overflow-x: auto|scroll` scroller do not widen it (counted);
//      (c) DISMISS  a BLOCKING surface's decision block inside 375x667 AND 320x568, English and `xx`, through fits.ts's
//                   `assertDismissReachable` – the one instrument, so the carpet cannot hold a looser law than the dialogs' own nets;
//      (d) NUMBERS  chars EN -> xx, text boxes, widest line %, longest word % – accumulated into ONE REPORT TABLE.
//
// ⚠ A FINDING IS A LEDGER ROW, NOT A RED RUN. What the carpet finds on a surface no wave swept is the owner's to fix (layout and
// copy are his), so it is recorded in `xxFindings.ts` and the suite asserts observed == ledger, BOTH ways: a new leak or overflow is
// red, and a ledger row nobody observes any more is red too, so the list only ever shrinks – the shape `fontLedger.ts` taught.
//
// ⚠ HAPPY-DOM HAS NO LAYOUT ENGINE, so every width here is the fits.ts MODEL (per-glyph advances of the shipped face, a floor that
// under-counts by 12-45%). A red from it is a real overflow; a green is «no overflow the model can see», and the report says so.
//
// ⚠ THE REPORT IS WRITTEN ON EVERY RUN: `$XX_CARPET_REPORT_DIR` (default: the OS temp dir, `tb-xx-carpet/`) gets `parts/<area>.json`
// from each file and the merged `xx-carpet-report.md` + `.json`. Each writer writes its part, then rewrites the merge from every
// part present, so whichever file finishes last leaves the complete table (the files run in parallel workers).
// `XX_CARPET_DISCOVER=1` skips the ledger equality so a first run can print what it finds instead of failing on it.
import { mkdirSync, readFileSync, readdirSync, renameSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterAll, afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { mount, type VueWrapper } from '@vue/test-utils'
import { isVNode, type Component, type ComponentInternalInstance, type VNode } from 'vue'
import { resetI18nForTests } from '../../src/i18n'
import { useGameStore } from '../../src/stores/game'
import type { Snapshot } from '../../src/shared/protocol'
import { installMemoryStorage } from './setup'
import { NARROW_PHONE, PHONE, assertDismissReachable, availableWidth, demandedWidth, setViewport, type Viewport } from './fits'
import { expandRendered, hardcodeLeaks, installPseudoLocale } from './pseudoloc'
import { SHAPES, allowlistSize, engineWords, isEngineBorn } from './xxAllowlist'
import { FINDINGS } from './xxFindings'
import { CONTAINED } from './xxInventory'

export type Kind = 'screen' | 'card' | 'blocking' | 'takeover'

export interface Mounted {
  unmount: () => void
  /** The names of the components the mounted tree renders (`renderedComponents(wrapper)`) – the inventory's evidence. */
  rendered?: () => string[]
  /** Props/fixtures the ENGINE wrote that this surface prints raw. The store's snapshot is read on its own; a props-driven surface lists its data here. */
  engine?: readonly unknown[]
  /** Exact engine words that are in no snapshot (a constant the screen imports). */
  words?: readonly string[]
  /** Blocking only: the bounded box (default `.dialog-card`, else `[role="dialog"]`). */
  card?: () => Element
  /** Blocking only: the decision block (default: the card's last control). */
  dismiss?: (card: Element) => Element
}

export interface Surface {
  id: string
  kind: Kind
  /** The wave whose own arm already swept this surface under xx – `''` when nobody did (the carpet's first look). */
  swept: string
  /** Pose and mount. The harness has set the viewport (BEFORE this call: happy-dom caches a media query on the first read). */
  mount: (vp: Viewport) => Promise<Mounted> | Mounted
}

export interface Boxes {
  boxes: number
  chars: number
  line: { r: number; at: string }
  word: { r: number; at: string }
  overflow: string[]
  /** boxes wider than their room inside a sideways scroller – by design not an overflow of the document, but a near-miss worth the owner's eye */
  scrolled: number
  scrolledAt: string[]
  clipped: number
}

/** Every component the mounted tree renders, by name – the walk of Vue's own vnode tree (instances, their sub-trees, array children, a Suspense's active
 *  branch). It is the inventory's EVIDENCE: «ShopPanel is inside MoneyScreen: Shop» is asserted from this, not believed. */
export function renderedComponents(w: VueWrapper): string[] {
  const names = new Set<string>()
  const seen = new Set<unknown>()
  const nameOf = (inst: ComponentInternalInstance): string | undefined => {
    const t = inst.type as { __name?: string; name?: string; __file?: string }
    return t.__name ?? t.name ?? t.__file?.replace(/^.*\/|\.vue$/g, '')
  }
  const walk = (vnode: VNode | null | undefined): void => {
    if (!vnode || seen.has(vnode)) return
    seen.add(vnode)
    const inst = vnode.component
    if (inst) {
      const name = nameOf(inst)
      if (name) names.add(name)
      walk(inst.subTree)
    }
    if (Array.isArray(vnode.children)) for (const k of vnode.children) if (isVNode(k)) walk(k)
    if (vnode.suspense) walk(vnode.suspense.activeBranch)
  }
  const root = w.vm.$ as ComponentInternalInstance
  const own = nameOf(root)
  if (own) names.add(own)
  walk(root.subTree)
  return Array.from(names).sort()
}

/** Mounted ATTACHED (happy-dom resolves the stylesheet only for connected nodes), teleports rendered in place. */
export const SHELL = { attachTo: document.body, global: { stubs: { teleport: true } } }

export interface Extra {
  /** data the surface prints raw that is NOT in the store's snapshot (a prop handed in, a fixture the component reads) */
  engine?: () => unknown[]
  /** exact engine words the surface reads from an engine function */
  words?: (snap: Snapshot) => string[]
  /** blocking only: a card/decision-block finder when the defaults (`.dialog-card`, the last control) are not the right boxes */
  card?: () => Element
  dismiss?: (card: Element) => Element
}

/** A component on a snapshot: set the store, mount it (props lazily, so a registry costs nothing until a case runs), run `after`, hand back the unmount. */
export function posed(
  id: string,
  kind: Kind,
  swept: string,
  comp: Component,
  snap: () => Snapshot,
  props: Record<string, unknown> | (() => Record<string, unknown>) = {},
  after?: (w: VueWrapper) => Promise<void>,
  extra: Extra = {},
): Surface {
  return {
    id,
    kind,
    swept,
    mount: async (): Promise<Mounted> => {
      const s = snap()
      useGameStore().snapshot = s
      const w = mount(comp, { ...SHELL, ...(typeof props === 'function' ? props() : props) }) as VueWrapper
      if (after) await after(w)
      return { unmount: () => w.unmount(), rendered: () => renderedComponents(w), engine: extra.engine?.() ?? [], words: extra.words?.(s) ?? [], card: extra.card, dismiss: extra.dismiss }
    },
  }
}

const CONTROLS = 'button, a[href], input, select, textarea, [role="button"]'
const SKIP = /^(?:SCRIPT|STYLE)$/

/** Is `el` inside a box that scrolls sideways (its own overflow takes the excess, the document does not grow)? */
function inScroller(el: Element): boolean {
  for (let node: Element | null = el; node; node = node.parentElement) {
    const cs = getComputedStyle(node)
    if (/auto|scroll/.test(`${cs.overflowX} ${cs.overflow}`)) return true
  }
  return false
}

/** Every text box under `root`: its widest line and longest unbreakable word as a share of the room it has – the L2-7 instrument, once. */
export function measure(root: Element, vp: Viewport): Boxes {
  const out: Boxes = { boxes: 0, chars: 0, line: { r: 0, at: '' }, word: { r: 0, at: '' }, overflow: [], scrolled: 0, scrolledAt: [], clipped: 0 }
  for (const el of Array.from(root.querySelectorAll('*'))) {
    if (SKIP.test(el.tagName)) continue
    const own = Array.from(el.childNodes)
      .filter((n) => n.nodeType === 3)
      .map((n) => n.nodeValue ?? '')
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim()
    if (!/\p{L}/u.test(own)) continue
    out.boxes++
    out.chars += own.length
    // spoken, not seen: the shared `.sr-only` utility clips its box to nothing, so its width says nothing about the page
    if (el.closest('.sr-only')) continue
    const room = Math.max(1, availableWidth(el, vp))
    const lineRatio = demandedWidth(el, room) / room
    if (lineRatio > out.line.r) out.line = { r: lineRatio, at: own.slice(0, 28) }
    const longest = own.split(' ').reduce((a, b) => (b.length > a.length ? b : a), '')
    const probe = document.createElement('span')
    probe.textContent = longest + longest.slice(0, Math.ceil(longest.length * 0.4))
    probe.style.whiteSpace = 'nowrap'
    probe.style.fontSize = getComputedStyle(el).fontSize
    el.appendChild(probe)
    const wordRatio = demandedWidth(probe, room) / room
    probe.remove()
    if (wordRatio > out.word.r) out.word = { r: wordRatio, at: longest }
    if (lineRatio > 1 || wordRatio > 1) {
      if (inScroller(el)) {
        out.scrolled++
        out.scrolledAt.push(own.slice(0, 40))
      }
      else if (getComputedStyle(el).textOverflow === 'ellipsis') out.clipped++
      else out.overflow.push(own.slice(0, 40))
    }
  }
  out.overflow = Array.from(new Set(out.overflow))
  return out
}

const CAP_FAILS = /declares no height bound|taller than the screen|outside the viewport/
export interface Verdict {
  ok: boolean
  /** `ok`, or the failure class – the part of the message a ledger can hold stable */
  why: string
}

function resolveFit(m: Mounted): { card: Element; dismiss: Element } {
  const card = m.card ? m.card() : (document.querySelector('.dialog-card') ?? document.querySelector('[role="dialog"]'))
  if (!card) throw new Error('the blocking surface has no card in the document – nothing below would be measured')
  const dismiss = m.dismiss ? m.dismiss(card) : Array.from(card.querySelectorAll(CONTROLS)).at(-1)
  if (!dismiss) throw new Error('the blocking surface has no control – the career would stop there')
  return { card, dismiss }
}

export function verdictOf(m: Mounted, vp: Viewport, label: string): Verdict {
  const { card, dismiss } = resolveFit(m)
  try {
    assertDismissReachable(card, dismiss, vp, label)
    return { ok: true, why: 'ok' }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return { ok: false, why: CAP_FAILS.exec(msg)?.[0] ?? msg.slice(0, 80) }
  }
}

export interface Row {
  area: string
  id: string
  kind: Kind
  swept: string
  en: Boxes
  xx: Boxes
  padReached: number
  leakNodes: number
  leaks: string[]
  engineAbsolved: number
  engineWordCount: number
  /** the components the xx mount rendered – read by the inventory */
  rendered: string[]
  dismiss: { en375: string; xx375: string; en320: string; xx320: string } | null
}

async function open(s: Surface, xx: boolean, vp: Viewport): Promise<Mounted> {
  document.body.innerHTML = ''
  setActivePinia(createPinia())
  resetI18nForTests(null)
  if (xx) await installPseudoLocale()
  setViewport(vp)
  return s.mount(vp)
}

async function sweep(area: string, s: Surface): Promise<Row> {
  const blocking = s.kind === 'blocking'
  const dismiss = { en375: '-', xx375: '-', en320: '-', xx320: '-' }

  // 1. the English baseline
  let m = await open(s, false, PHONE)
  const en = measure(document.body, PHONE)
  if (blocking) dismiss.en375 = verdictOf(m, PHONE, `${s.id} EN`).why
  m.unmount()
  if (blocking) {
    m = await open(s, false, NARROW_PHONE)
    dismiss.en320 = verdictOf(m, NARROW_PHONE, `${s.id} EN`).why
    m.unmount()
  }

  // 2. the same surface under xx
  m = await open(s, true, PHONE)
  const words = engineWords([useGameStore().snapshot, ...(m.engine ?? [])], m.words ?? [])
  // a piece that CLOSES a bracket it did not open is the tail of a wrapped string the template cut with markup (a `<br>` inside the tagline): wrapped
  const found = hardcodeLeaks(document.body, SHAPES).filter((l) => !l.includes('⟧'))
  const leaks = found.filter((l) => !isEngineBorn(words, l))
  const padReached = expandRendered(document.body, SHAPES)
  const xx = measure(document.body, PHONE)
  const rendered = m.rendered?.() ?? []
  if (blocking) dismiss.xx375 = verdictOf(m, PHONE, `${s.id} xx`).why
  m.unmount()
  if (blocking) {
    m = await open(s, true, NARROW_PHONE)
    expandRendered(document.body, SHAPES)
    dismiss.xx320 = verdictOf(m, NARROW_PHONE, `${s.id} xx`).why
    m.unmount()
  }

  return {
    area,
    id: s.id,
    kind: s.kind,
    swept: s.swept,
    en,
    xx,
    padReached,
    leakNodes: leaks.length,
    leaks: Array.from(new Set(leaks.map((l) => l.slice(0, 80)))),
    engineAbsolved: found.length - leaks.length,
    engineWordCount: words.size,
    rendered,
    dismiss: blocking ? dismiss : null,
  }
}

/** Digits are tuning, not copy: «65 more national pts» is 70 the day the threshold moves, and a ledger keyed on it would redden on a balance pass.
 *  A key keeps the words and drops the numbers. */
export const stable = (s: string): string => s.replace(/\d+/g, 'N')

/** The ledger-comparable findings of one row: `kind: detail`, stable across a layout nudge (no ratios) and a tuning pass (no digits). */
export function findingsOf(row: Row): string[] {
  const out: string[] = []
  const uniq = (list: readonly string[]): string[] => Array.from(new Set(list.map(stable)))
  const en = new Set(uniq(row.en.overflow))
  for (const l of uniq(row.leaks)) out.push(`leak: ${l}`)
  for (const o of uniq(row.xx.overflow)) if (!en.has(o)) out.push(`overflow: ${o}`)
  for (const o of en) out.push(`overflow-en: ${o}`)
  if (row.dismiss) {
    const { en375, xx375, en320, xx320 } = row.dismiss
    if (en375 !== 'ok') out.push(`dismiss-en: 375x667: ${en375}`)
    if (en320 !== 'ok') out.push(`dismiss-en: 320x568: ${en320}`)
    if (xx375 !== 'ok' && en375 === 'ok') out.push(`dismiss: 375x667: ${xx375}`)
    if (xx320 !== 'ok' && en320 === 'ok') out.push(`dismiss: 320x568: ${xx320}`)
  }
  return out.sort()
}

const pct = (r: number): string => `${(r * 100).toFixed(0)}%`
const short = (s: string, n = 14): string => (s.length > n ? `${s.slice(0, n - 1)}…` : s)

export const reportDir = (): string => process.env.XX_CARPET_REPORT_DIR ?? join(tmpdir(), 'tb-xx-carpet')

function atomicWrite(path: string, text: string): void {
  const tmp = `${path}.${process.pid}.tmp`
  writeFileSync(tmp, text)
  renameSync(tmp, path)
}

/** The merged markdown table over every part present. Exported for the instrument test. */
export function renderReport(rows: readonly Row[]): string {
  const size = allowlistSize()
  const tight = [...rows].sort((a, b) => b.xx.word.r - a.xx.word.r).slice(0, 5)
  const head = [
    '# The xx carpet – per-surface numbers (375x667, the fits.ts width model; chars/boxes after xx pads the engine words)',
    '',
    `tightest longest-word margins under xx: ${tight.map((r) => `${r.id} ${pct(r.xx.word.r)} («${short(r.xx.word.at, 18)}»)`).join('; ')}`,
    `allowlist: ${size.shapes} shapes, ${size.words} words, ${size.tableLeaves} engine-table leaves; surfaces: ${rows.length}; ` +
      `text boxes (xx): ${rows.reduce((n, r) => n + r.xx.boxes, 0)}; leaks: ${rows.reduce((n, r) => n + r.leaks.length, 0)}; ` +
      `overflows: ${rows.reduce((n, r) => n + r.xx.overflow.length, 0)}; boxes over their room inside a sideways scroller (by design, listed not judged): ${rows.reduce((n, r) => n + r.xx.scrolled, 0)}`,
    '',
    '| area | surface | kind | swept by | boxes | chars en>xx | widest line en>xx | longest word en>xx | leaks | engine-absolved | overflow | scrolled | dismiss 375 en/xx | dismiss 320 en/xx |',
    '| --- | --- | --- | --- | ---: | --- | --- | --- | ---: | ---: | ---: | ---: | --- | --- |',
  ]
  const body = [...rows]
    .sort((a, b) => a.area.localeCompare(b.area) || a.id.localeCompare(b.id))
    .map((r) => {
      const d = r.dismiss
      return (
        `| ${r.area} | ${r.id} | ${r.kind} | ${r.swept || '-'} | ${r.xx.boxes} | ${r.en.chars}>${r.xx.chars} | ` +
        `${pct(r.en.line.r)}>${pct(r.xx.line.r)} | ${pct(r.en.word.r)}>${pct(r.xx.word.r)} (${short(r.xx.word.at)}) | ${r.leaks.length} | ${r.engineAbsolved} | ${r.xx.overflow.length} | ${r.xx.scrolled} | ` +
        `${d ? `${short(d.en375, 10)}/${short(d.xx375, 10)}` : '-'} | ${d ? `${short(d.en320, 10)}/${short(d.xx320, 10)}` : '-'} |`
      )
    })
  return [...head, ...body, ''].join('\n')
}

function writeReport(area: string, rows: readonly Row[]): void {
  const dir = reportDir()
  mkdirSync(join(dir, 'parts'), { recursive: true })
  atomicWrite(join(dir, 'parts', `${area}.json`), `${JSON.stringify(rows)}\n`)
  const merged = readdirSync(join(dir, 'parts'))
    .filter((f) => f.endsWith('.json'))
    .flatMap((f) => {
      try {
        return JSON.parse(readFileSync(join(dir, 'parts', f), 'utf8')) as Row[]
      } catch {
        return [] // a part another worker is replacing this instant – its own merge will include it
      }
    })
  atomicWrite(join(dir, 'xx-carpet-report.json'), `${JSON.stringify(merged)}\n`)
  atomicWrite(join(dir, 'xx-carpet-report.md'), renderReport(merged))
  console.log(`[L4-2 carpet] ${area}: ${rows.length} surfaces; the merged table is ${join(dir, 'xx-carpet-report.md')}`)
}

const DISCOVER = process.env.XX_CARPET_DISCOVER === '1'

/** Define one `describe` over a registry: a case per surface, the ledger assertion, and the part-file write. */
export function carpet(area: string, surfaces: readonly Surface[]): void {
  const rows: Row[] = []
  describe(`L4-2 xx carpet – ${area}`, () => {
    beforeEach(() => {
      installMemoryStorage()
      resetI18nForTests(null)
      setActivePinia(createPinia())
      document.body.innerHTML = ''
    })
    afterEach(() => {
      document.body.innerHTML = ''
      document.documentElement.lang = 'en'
    })
    afterAll(() => writeReport(area, rows))

    it('the ledger names only surfaces this file mounts (a row for a surface of another file – or a deleted one – would never be compared)', () => {
      const mine = new Set(surfaces.map((s) => s.id))
      const stray = FINDINGS.filter((f) => f.area === area && !mine.has(f.surface)).map((f) => `${f.surface}: ${f.detail}`)
      expect(stray, `${area}: ledger rows with no surface`).toEqual([])
      expect(new Set(surfaces.map((s) => s.id)).size, `${area}: two surfaces share an id – the ledger could not tell them apart`).toBe(surfaces.length)
    })

    for (const s of surfaces) {
      it(`${s.id} (${s.kind})`, async () => {
        const row = await sweep(area, s)
        rows.push(row)
        expect(row.xx.boxes, `${s.id}: the surface mounted and has text – nothing below is vacuous`).toBeGreaterThan(0)
        expect(row.xx.chars, `${s.id}: xx made the text no longer – the sweep did not see the words`).toBeGreaterThan(row.en.chars)
        // the inventory's claims about this surface: every component CONTAINED here is really in the tree
        const claimed = Object.entries(CONTAINED).filter(([, surface]) => surface === s.id).map(([comp]) => comp)
        if (!DISCOVER) expect(row.rendered, `${s.id}: components the inventory says it renders (xxInventory.ts CONTAINED)`).toEqual(expect.arrayContaining(claimed))
        if (DISCOVER) return
        const known = FINDINGS.filter((f) => f.area === area && f.surface === s.id).map((f) => `${f.kind}: ${f.detail}`).sort()
        expect(findingsOf(row), `${s.id}: observed findings vs the ledger (xxFindings.ts) – a new one is red, a fixed one must be deleted`).toEqual(known)
      })
    }
  })
}

