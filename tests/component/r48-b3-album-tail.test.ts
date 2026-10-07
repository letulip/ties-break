// ROUND 48 B3 – THE MOUNTED HALF: items 8 (the album sheds its backing), 1a (the second snapshot), 1b (the W1000 tag) and 1c (the Slam pass, green).
//
//   8   «А и в самом альбоме тоже подложка не нужна, она лишняя и место ест, пусть он на весь экран будет, как и THE LAST PAGE по принципу».
//       The mechanism is the last page's: `section.bare` (style.css paints EVERY `section` as a panel; `bare` is the app's opt-out). The ending's BOOK layer is `bare` now – the
//       in-career host (`App.vue`) never had a section round the screen. The whole-record layer KEEPS its panel: he did not ask about it.
//   1a  a wide strip hangs TWO snapshots – two different paintings.   1b  the book's tail hangs a W1000 tag, a rung smaller where the page is full.
//   1c  the tail's Grand Slam pass wears the Slam's green: the app's own `--surface-grass` times the pass's two factors.
//
// ⚠ NO BOX IS MEASURED HERE (happy-dom lays nothing out). What a mount CAN say is what the page was TOLD – the classes, the computed paint, the inline transform – and which
// elements are in the tree. The geometry is `tests/r48-b3-album-tail.test.ts` over the sweeps, and real Chromium: the book was 341px wide at 375 with the panel and is 375px
// without it (the first sheet at x 33 -> x 16) – the numbers are in the round-48 ledger. `setViewport` runs BEFORE the mount (happy-dom caches a media query on its first
// computed-style read), and the width arms read the gutter off `:root` as round 48 B1 did (`.ending`'s own `var()` padding does not resolve under happy-dom).
//
// ⭐ MUTATION-VERIFIED (07.10), each run on the real file and restored byte-identical – the list is at the foot of this file.
import '../../src/style.css'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import AlbumScreen from '../../src/components/screens/AlbumScreen.vue'
import AlbumSheet from '../../src/components/album/AlbumSheet.vue'
import AlbumTicketPass from '../../src/components/album/AlbumTicketPass.vue'
import EndingScreen from '../../src/components/EndingScreen.vue'
import { useGameStore } from '../../src/stores/game'
import { assembleAlbum } from '../../src/engine/world'
import { ALBUM_ARC } from '../../src/engine/world/albumCorpus'
import { ALBUM_CHAPTER_TITLES } from '../../src/engine/world/albumBook'
import { TIERS } from '../../src/engine/season/calendar'
import { placeSheet } from '../../src/components/album/albumPlacement'
import { moneyOf } from '../helpers/careerMoney'
import { dynastyOf } from '../helpers/dynastyHandover'
import { posedCareer } from '../helpers/albumSweep'
import { contrastRatio, effectiveBackground, parseColor } from './contrast'
import { NARROW_PHONE, PHONE, setViewport } from './fits'
import { hand, sheetOf } from './albumFixture'
import { readFileSync } from 'node:fs'
import type { AlbumBook, AlbumSheetModel, AlbumTicket, EndingView, Snapshot } from '../../src/shared/protocol'

const px = (v: string): number => Number.parseFloat(v)

// =================================================================================================
// 8 – THE BOOK LAYER OF THE ENDING IS `bare`
// =================================================================================================

const TOTALS = { earnedCents: 4_000_000_00, spentCents: 3_000_000_00, prizeCents: 1_500_000_00, weeksLostToInjury: 0 }
function endingView(): EndingView {
  return {
    ending: { type: 'natural', week: 900, ageYears: 31, detail: 'she stopped', resumesWeek: null },
    closing: { slot: 7, why: 'w', caption: 'c', fact: 'f', week: 364, seasonIndex: 7, stage: 'adult', emotion: 'norm', empty: false },
    scroll: [{ seasonIndex: 0, year: 2031, ageYears: 14, rows: [{ week: 12, label: 'Title', detail: 'Local Open' }] }],
    handoff: { childBorn: false, freshCapitalFork: true, resumesWeek: null, resumesAgeYears: null },
    totals: TOTALS,
    money: moneyOf(TOTALS),
    seasonsPlayed: 17,
    bestRank: 11,
    bestRankTrack: 'wta',
    titles: 9,
    oneMoreYearCount: 2,
    academy: null,
    lifetimeDeal: null,
    college: null,
    dynasty: dynastyOf(),
  } as unknown as EndingView
}
const BOOK: AlbumBook = assembleAlbum(posedCareer(2))

async function mountEndingWithBook(vp: { width: number; height: number }) {
  setViewport(vp)
  const game = useGameStore()
  game.$patch({
    snapshot: {
      ageYears: 31,
      week: 900,
      kidRank: 11,
      fundsCents: 1234_00,
      careerTotals: { earnedCents: 0, spentCents: 0, prizeCents: 0 },
      careerMoney: moneyOf(TOTALS),
      ending: endingView(),
    } as unknown as Snapshot,
  })
  game.loadAlbum = vi.fn(async () => BOOK) as never
  const w = mount(EndingScreen, { attachTo: document.body })
  await w.find('.ending-door-album').trigger('click')
  await flushPromises()
  return w
}

describe('⭐⭐⭐ round 48 #8 · the album has no panel behind it – the film takes the screen', () => {
  beforeEach(() => setActivePinia(createPinia()))
  afterEach(() => {
    document.body.innerHTML = ''
  })

  for (const vp of [PHONE, NARROW_PHONE]) {
    it(`⭐ at ${vp.width}px the BOOK layer opts out of the global panel – no padding, no border, no card colour – and the column is the screen less the app's two gutters`, async () => {
      const w = await mountEndingWithBook(vp)
      const section = w.find('.ending-book').element
      const cs = getComputedStyle(section)
      // ⚠⚠ THE ARM. Take `bare` off the section (style.css paints EVERY `section` as a panel: the panel colour, a 1px line, 16px of padding) and every line below goes red:
      // measured 07.10, RED. Real Chromium at 375: the panel's 17px a side left the film's window 341px of the 375px screen and the first sheet 33px in.
      expect(section.classList.contains('bare'), 'the existing opt-out, not a second panel reset').toBe(true)
      expect(cs.padding, 'no padding').toBe('0px')
      for (const side of ['left', 'right', 'top', 'bottom']) expect(cs.getPropertyValue(`padding-${side}`), `no padding on the ${side}`).toBe('0px')
      expect(cs.borderLeftStyle, 'no line round it').toBe('none')
      expect(cs.borderRadius, 'no card corners').toBe('0px')
      const panel = getComputedStyle(document.documentElement).getPropertyValue('--panel').trim()
      expect(panel, '`--panel` resolves on :root, so the comparison below is against a colour').toMatch(/^#[0-9a-f]{6}$/i)
      expect(cs.backgroundColor, 'not the card colour').not.toBe(panel)
      expect(['none', '', 'transparent'], `no card colour behind the book (${cs.backgroundColor})`).toContain(cs.backgroundColor)
      // the column: the screen less the takeover's two gutters, with nothing taken off the inside of it
      const gutter = px(getComputedStyle(document.documentElement).getPropertyValue('--app-pad-x'))
      expect(Number.isFinite(gutter), '`--app-pad-x` resolves on :root').toBe(true)
      const taken = px(cs.paddingLeft) + px(cs.paddingRight) + (cs.borderLeftStyle === 'none' ? 0 : px(cs.borderLeftWidth)) + (cs.borderRightStyle === 'none' ? 0 : px(cs.borderRightWidth))
      expect(vp.width - 2 * gutter - taken, `the book's column at ${vp.width}px`).toBe(vp.width - 2 * gutter)
      expect(w.find('.ending-book .album-stage').exists(), 'the film is inside it').toBe(true)
      w.unmount()
    })
  }

  it('⭐ the book gains exactly what the panel took: the RECORD layer (`ending-scroll`) keeps its panel – 17px a side of padding and line – and is not `bare`', async () => {
    setViewport(PHONE)
    const w = await mountEndingWithBook(PHONE)
    await w.find('.album-back').trigger('click') // back to the last page
    const record = w.findAll('.ending-foot button').find((b) => (b.text() ?? '').trim() === 'The whole record')
    expect(record, 'the record link is on the last page').toBeDefined()
    await record!.trigger('click')
    await flushPromises()
    const layer = w.find('.ending-scroll')
    expect(layer.exists(), 'the record layer opened').toBe(true)
    expect(layer.element.classList.contains('bare'), 'he did not ask about the record – it keeps its panel').toBe(false)
    const cs = getComputedStyle(layer.element)
    const panel = getComputedStyle(document.documentElement).getPropertyValue('--panel').trim()
    expect(cs.backgroundColor, 'still the card colour').toBe(panel)
    expect(cs.borderLeftStyle, 'still the 1px line').toBe('solid')
    expect(cs.paddingLeft, 'still its 16px of padding (the card pad + 2)').not.toBe('0px')
    w.unmount()
  })

  it('⭐ the film takes the gutter back: `.album-stage` cancels the app\'s side gutter, so with no panel round it the film is the whole screen (a source claim – happy-dom does not apply a component\'s scoped CSS; real Chromium measured 375 of 375px)', () => {
    const logic = readFileSync(`${process.cwd()}/src/components/screens/AlbumScreen.vue`, 'utf8')
    expect(logic).toMatch(/\.album-stage\s*\{[^}]*margin-inline:\s*calc\(-1 \* var\(--app-pad-x\)\)/)
    expect(logic, 'the film pays the gutter back as padding of its own, once').toMatch(/\.album-pan\s*\{[^}]*padding-inline:\s*var\(--app-pad-x\)/)
  })

  it('the in-career host never had a panel: `AlbumScreen` is a plain div and its root paints nothing and pads nothing – so there is nothing to opt out of', () => {
    setViewport(PHONE)
    const w = mount(AlbumScreen, { props: { book: BOOK }, attachTo: document.body })
    expect(w.element.tagName, 'App.vue puts the screen straight into `main.app-content`: a div, not a `section`').toBe('DIV')
    const cs = getComputedStyle(w.element)
    expect(['', '0px'], 'no padding').toContain(cs.paddingLeft)
    expect(['', 'none', 'transparent'], 'no card colour').toContain(cs.backgroundColor)
    expect(cs.borderLeftStyle === '' || cs.borderLeftStyle === 'none', 'no line').toBe(true)
    expect(w.findAll('section').length, 'no panel-painted element round the film').toBe(0)
    w.unmount()
  })
})

// =================================================================================================
// 1c – THE SLAM TICKET'S GREEN
// =================================================================================================

const BASE_TICKET = sheetOf({ layout: 'B' }).ticket as AlbumTicket
const slamTicket = (over: Partial<AlbumTicket> = {}): AlbumTicket => ({ ...BASE_TICKET, tier: TIERS.slam.label, step: 'elite', stage: 'Champion', paint: 'slam', tail: true, ...over })

function channels(css: string): [number, number, number] {
  const [r, g, b] = parseColor(css)
  return [r, g, b]
}
const token = (name: string): string => {
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim()
  if (!/^#[0-9a-f]{6}$/i.test(v)) throw new Error(`${name} is ${JSON.stringify(v)}, not a hex – is src/style.css loaded?`)
  return v
}
const scaled = (name: string, factor: number): [number, number, number] => channels(token(name)).map((v) => Math.round(v * factor)) as [number, number, number]

/** WCAG contrast for one element's text, with its own alpha and every ancestor's opacity folded in (`album-rank-ink.test.ts`' own arithmetic). */
function ratioOf(el: Element): number {
  let alpha = 1
  for (let n: Element | null = el; n; n = n.parentElement) {
    const raw = getComputedStyle(n).opacity
    const v = raw === '' ? 1 : Number(raw)
    if (Number.isFinite(v)) alpha *= v
  }
  const bg = effectiveBackground(el)
  const colour = parseColor(getComputedStyle(el).color)
  const a = colour[3] * alpha
  const fg = [0, 1, 2].map((i) => colour[i] * a + bg[i] * (1 - a)) as [number, number, number]
  return contrastRatio(fg, bg)
}

describe('round 48 #1c · the Slam pass is green – the app\'s own grass token, scaled the pass\'s own way', () => {
  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('⭐ the face is `--surface-grass` ×0.38 and the sheen\'s deep end ×0.27 – and it is NOT the elite step\'s purple the Slam\'s rung would otherwise paint', () => {
    const w = mount(AlbumTicketPass, { props: { ticket: slamTicket() }, attachTo: document.body })
    const pass = w.find('.album-pass').element
    expect(pass.classList.contains('album-pass-slam'), 'the paint class').toBe(true)
    expect(pass.classList.contains('album-pass-elite'), 'the step class is still there – the paint overrides the ink, not the step').toBe(true)
    expect(channels(getComputedStyle(pass).backgroundColor), 'the face').toEqual(scaled('--surface-grass', 0.38))
    expect(channels(getComputedStyle(pass).getPropertyValue('--album-pass-ink-deep').trim()), 'the deep end').toEqual(scaled('--surface-grass', 0.27))
    expect(channels(getComputedStyle(pass).backgroundColor), 'not the elite purple').not.toEqual(scaled('--tier-elite', 0.38))
    const [r, g, b] = channels(getComputedStyle(pass).backgroundColor)
    expect(g, 'it reads GREEN: the green channel leads').toBeGreaterThan(Math.max(r, b))
    w.unmount()
  })

  it('every OTHER Slam pass is untouched: with no `paint` the elite step\'s own ink – the green is the tail\'s alone', () => {
    const w = mount(AlbumTicketPass, { props: { ticket: slamTicket({ paint: undefined, tail: undefined }) }, attachTo: document.body })
    const pass = w.find('.album-pass').element
    expect(pass.classList.contains('album-pass-slam')).toBe(false)
    expect(channels(getComputedStyle(pass).backgroundColor)).toEqual(scaled('--tier-elite', 0.38))
    w.unmount()
  })

  it('⭐ it is LEGIBLE: the loud line, the faded date and gate (opacity .78) and the stage written on the stub are all at AA or better', () => {
    const w = mount(AlbumTicketPass, { props: { ticket: slamTicket() }, attachTo: document.body })
    for (const [what, sel] of [['rank', '.album-pass-title'], ['date and gate', '.album-pass-foot'], ['stage on the stub', '.album-pass-stage'], ['venue', '.album-pass-venue']] as const) {
      const r = ratioOf(w.find(sel).element)
      expect(r, `${what}: ${r.toFixed(2)}:1`).toBeGreaterThanOrEqual(4.5)
    }
    w.unmount()
  })

  it('on the sheet: the tail pass is drawn along layout B\'s bottom with the model\'s own words, wearing both classes', () => {
    const s: AlbumSheetModel = { ...sheetOf({ layout: 'B' }), ticket: slamTicket({ stage: 'Champion', dateLabel: 'Aug 30 – Sep 5' }) }
    const w = mount(AlbumSheet, { props: { sheet: s }, attachTo: document.body })
    const pass = w.find('.album-b-pass')
    expect(pass.exists(), 'the tail pass is drawn where the strip is clear').toBe(true)
    expect(pass.classes()).toEqual(expect.arrayContaining(['album-pass', 'album-pass-elite', 'album-pass-slam']))
    expect(pass.text()).toContain(TIERS.slam.label)
    expect(pass.text()).toContain('Aug 30 – Sep 5')
    w.unmount()
  })

  it('a tail pass the strip has no room for is NOT drawn (the resolver declines it) – a pass of the sheet\'s own, however crowded, always is', () => {
    const b0 = sheetOf({ layout: 'B' })
    const note = Array.from({ length: 7 }, () => hand('first-court').note).join(' ')
    const crowded: AlbumSheetModel = { ...b0, note: { text: note, dateLabel: 'May 12', ageLabel: 'Age 5', lines: [] }, ticket: slamTicket() }
    expect(placeSheet(crowded).ticketDrawn, 'precondition: the resolver declines this one').toBe(false)
    const declined = mount(AlbumSheet, { props: { sheet: crowded }, attachTo: document.body })
    expect(declined.find('.album-b-pass').exists(), 'declined: not in the tree').toBe(false)
    declined.unmount()
    const own = mount(AlbumSheet, { props: { sheet: { ...crowded, ticket: slamTicket({ tail: undefined, paint: undefined }) } }, attachTo: document.body })
    expect(own.find('.album-b-pass').exists(), 'a sheet\'s own pass is a fact and is always drawn').toBe(true)
    own.unmount()
  })
})

// =================================================================================================
// 1b – THE W1000 TAG, A RUNG SMALLER WHERE THE PAGE IS FULL
// =================================================================================================

describe('round 48 #1b · the tail tag hangs at its own size where the column is clear and a rung smaller where it is not', () => {
  afterEach(() => {
    document.body.innerHTML = ''
  })
  const tag = { stage: 'Champion', tier: TIERS.wta1000.label, step: 'elite' as const, place: 'Harbour Stadium', ageLabel: 'Age 32', tail: true as const }
  const base = (): AlbumSheetModel => ({
    ...sheetOf({ layout: 'C', occasion: 'season-recovery', voice: 'quiet', chapterTitle: ALBUM_CHAPTER_TITLES.lateCareer }),
    tag,
  })
  const arcLine = (): { note: string; line: string } => {
    const arcs = Object.values(ALBUM_ARC as Record<string, Record<string, { note: string; line: string }>>).flatMap((v) => Object.values(v))
    return arcs.reduce((a, v) => (v.line.length > a.line.length ? v : a))
  }

  it('a roomy sheet: the W1000 tag is drawn at its own size – no transform on it – with the model\'s own words', () => {
    const w = mount(AlbumSheet, { props: { sheet: base() }, attachTo: document.body })
    const el = w.find('.album-c-tag')
    expect(el.exists(), 'the tail tag is drawn').toBe(true)
    expect((el.element as HTMLElement).style.transform, 'full size').toBe('')
    expect(el.text()).toContain('World Tour 1000')
    expect(el.text()).toContain('Champion')
    expect(el.text()).toContain('Age 32')
    w.unmount()
  })

  it('⭐ HIS LAST PAGE: the arc\'s 68-character loose line crowds the column – the tag hangs at 0.8, from its string (`transform-origin: 50% 0`)', () => {
    const arc = arcLine()
    const s: AlbumSheetModel = { ...base(), note: { text: arc.note, dateLabel: 'Dec 12 – Dec 18', ageLabel: 'Age 33', lines: [] }, line: arc.line }
    expect(placeSheet(s).tagScale, 'precondition: the resolver hangs it a rung smaller').toBe(0.8)
    const w = mount(AlbumSheet, { props: { sheet: s }, attachTo: document.body })
    const style = (w.find('.album-c-tag').element as HTMLElement).style
    expect(style.transform).toBe('scale(0.8)')
    expect(style.transformOrigin).toMatch(/^50%( 0(px|%)?)?$/)
    w.unmount()
  })

  it('the same crowded sheet with a tag of its OWN (no `tail`) is always drawn, at its own size – the old behaviour', () => {
    const arc = arcLine()
    const s: AlbumSheetModel = { ...base(), tag: { ...tag, tail: undefined }, note: { text: arc.note, dateLabel: 'Dec 12 – Dec 18', ageLabel: 'Age 33', lines: [] }, line: arc.line }
    const w = mount(AlbumSheet, { props: { sheet: s }, attachTo: document.body })
    expect((w.find('.album-c-tag').element as HTMLElement).style.transform).toBe('')
    w.unmount()
  })

  it('a column with no room at any rung is left bare: no tag in the tree – and the sheet\'s snapshot takes the gap where the resolver finds one', () => {
    const long = Array.from({ length: 6 }, () => hand('first-court').line).join(' ')
    const s: AlbumSheetModel = { ...base(), line: long, filler: { art: 'images/weeks/off-1.webp' } }
    expect(placeSheet(s).tagDrawn, 'precondition: no rung clears this line').toBe(false)
    const w = mount(AlbumSheet, { props: { sheet: s }, attachTo: document.body })
    expect(w.find('.album-c-tag').exists()).toBe(false)
    w.unmount()
  })
})

// =================================================================================================
// 1a – TWO SMALL SNAPSHOTS, SIDE BY SIDE
// =================================================================================================

describe('round 48 #1a · a wide strip is drawn with two different snapshots', () => {
  afterEach(() => {
    document.body.innerHTML = ''
  })
  const pair = { art: 'images/weeks/vac-sea.webp', pair: 'images/weeks/vac-camping.webp' }
  const strip = (filler: { art: string; pair?: string } | null): AlbumSheetModel => ({ ...sheetOf({ layout: 'B' }), ticket: null, filler })

  it('⭐ two snapshots stand in the strip where the resolver put them, each its own painting, leaning opposite ways', () => {
    const s = strip(pair)
    const placed = placeSheet(s).filler
    expect(placed?.pair, 'precondition: the resolver found room for two').toBeDefined()
    const w = mount(AlbumSheet, { props: { sheet: s }, attachTo: document.body })
    const els = w.findAll('.album-filler')
    expect(els.length).toBe(2)
    const srcs = els.map((e) => e.find('img').attributes('src'))
    expect(srcs).toEqual([`${import.meta.env.BASE_URL}${pair.art}`, `${import.meta.env.BASE_URL}${pair.pair}`])
    expect(new Set(srcs).size, 'two different pictures').toBe(2)
    expect(els.map((e) => (e.element as HTMLElement).style.left)).toEqual([`${placed?.x}px`, `${placed?.pair?.x}px`])
    const lean = els.map((e) => (e.find('.tb-polaroid').element as HTMLElement).style.transform)
    expect(lean).toEqual([`rotate(${placed?.tilt}deg)`, `rotate(${placed?.pair?.tilt}deg)`])
    expect(placed?.pair?.tilt, 'the other way').toBe(-(placed?.tilt as number))
    for (const e of els) {
      expect(e.find('img').attributes('alt'), 'decoration: no alt, no copy').toBe('')
      expect(e.find('.tb-polaroid-caption').exists(), 'no caption').toBe(false)
    }
    w.unmount()
  })

  it('a sheet with ONE snapshot draws one; a pair beside a drawn pass draws none; layout C keeps its single snapshot', () => {
    const count = (s: AlbumSheetModel): number => {
      const w = mount(AlbumSheet, { props: { sheet: s }, attachTo: document.body })
      const n = w.findAll('.album-filler').length
      w.unmount()
      return n
    }
    expect(count(strip({ art: pair.art }))).toBe(1)
    expect(count(strip(pair))).toBe(2)
    expect(count({ ...sheetOf({ layout: 'B' }), filler: pair }), 'the pass is drawn: no gap').toBe(0)
    expect(count({ ...sheetOf({ layout: 'C' }), tag: null, filler: pair }), 'C\'s column holds one').toBe(1)
  })
})

// MUTATION LEDGER (07.10) – each arm applied to the SOURCE, run, red read, restored byte-identical (`cmp`); the unit twin (`tests/r48-b3-album-tail.test.ts`) holds the rest. Control: green before every arm.
//   8-1  the ending's book layer is NOT `bare`                               -> 2 RED (the two phone widths; the record-layer arm and the in-career arm stay green – they are about other elements)
//   1a-1 `B_FILLER.pair` false                                               -> 2 RED
//   1a-5 layout B draws no second snapshot                                   -> 2 RED
//   1c-2 the Slam green is the elite purple again                            -> 1 RED
//   1c-3 the paint class is never put on the pass                            -> 2 RED
//   1c-4 layout B ignores the drawn flag (always draws the pass)             -> 1 RED
//   1b-5 the resolver never finds the column crowded                         -> 3 RED
//   1b-6 the tag has no smaller rung                                         -> 1 RED
//   1b-7 layout C ignores the drawn flag (always draws the tag)              -> 1 RED
//   1b-8 layout C never applies the rung (no scale)                          -> 1 RED
