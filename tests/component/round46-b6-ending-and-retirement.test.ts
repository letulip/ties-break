// ROUND 46 B6 – ITEMS 13, 18, 20 AND THE MOUNTED HALF OF 21.
//
//   13  «Is there another year in this?» – the picture slid and cut the head off.
//   18  «that's enough» landed on a reel of childhood photographs, not on the album – the REAL album is
//       now one tap from the last page, every sheet, and Back returns to the card.
//   20  a service export of the save, on the one screen that covers the way to it.
//   21  (mounted half; the 200-seed sweep is tests/dynasty-daughter-name.test.ts) the dynasty card never
//       opens on, or rolls, her mother's name.
//
// ⚠ MOUNTED, NOT SOURCE-PINNED. Each claim below names the mutation that reddens it; the mutation table
// is in the round ledger (docs/rounds/round-46.md, items 13/18/20/21, the B6 lines).
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import ChildhoodPrologue from '../../src/components/ChildhoodPrologue.vue'
import EndingScreen from '../../src/components/EndingScreen.vue'
import RetirementDialog from '../../src/components/RetirementDialog.vue'
import AlbumScreen from '../../src/components/screens/AlbumScreen.vue'
import { CROPS, bandFacePoint, facePoint } from '../../src/art/faceRects'
import { NAME_POOL } from '../../src/composables/identityDice'
import { assembleAlbum, createWorld, kidAgeAt } from '../../src/engine/world'
import { useGameStore } from '../../src/stores/game'
import { request } from '../../src/worker/client'
import { DEFAULT_PROFILE } from '../../src/shared/protocol'
import type { AlbumBook, AlbumPage, EndingView, RetirementOffer, Snapshot } from '../../src/shared/protocol'
import { moneyOf } from '../helpers/careerMoney'
import { dynastyOf } from '../helpers/dynastyHandover'
import { NARROW_PHONE, PHONE, assertDismissReachable, availableWidth, demandedWidth, measureDialog, setViewport } from './fits'
import '../../src/style.css'

// The store's only door to the worker. Every case that touches it says so; the album cases replace
// `game.loadAlbum` itself, so this mock is only ever read by the #20 cases.
vi.mock('../../src/worker/client', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../src/worker/client')>()
  return { ...actual, request: vi.fn() }
})

const NO_MONEY = { earnedCents: 0, spentCents: 0, prizeCents: 0, weeksLostToInjury: 0 }

// =================================================================================================
// FIXTURES
// =================================================================================================

function albumPage(slot: number): AlbumPage {
  return {
    slot,
    why: `why ${slot}`,
    caption: `caption ${slot}`,
    fact: `fact ${slot}`,
    week: 52 * slot,
    seasonIndex: slot,
    stage: 'adult',
    emotion: 'norm',
    empty: false,
  } as AlbumPage
}

function endingView(over: Partial<EndingView> = {}): EndingView {
  return {
    ending: { type: 'natural', week: 900, ageYears: 31, detail: 'she stopped at thirty-one', resumesWeek: null },
    album: [1, 2, 3, 4, 5, 6, 7].map(albumPage),
    scroll: [],
    handoff: { childBorn: false, freshCapitalFork: true, resumesWeek: null, resumesAgeYears: null },
    totals: { earnedCents: 0, spentCents: 0, prizeCents: 0, weeksLostToInjury: 0 },
    money: moneyOf(NO_MONEY),
    seasonsPlayed: 17,
    bestRank: 11,
    bestRankTrack: 'wta',
    titles: 9,
    oneMoreYearCount: 2,
    academy: null,
    lifetimeDeal: null,
    college: null,
    dynasty: dynastyOf(),
    ...over,
  } as EndingView
}

function mountEnding(over: Partial<EndingView> = {}) {
  useGameStore().$patch({
    snapshot: {
      ageYears: 31,
      week: 900,
      kidRank: 11,
      fundsCents: 1234_00,
      careerTotals: { earnedCents: 0, spentCents: 0, prizeCents: 0 },
      careerMoney: moneyOf(NO_MONEY),
      ending: endingView(over),
    } as unknown as Snapshot,
  })
  return mount(EndingScreen, { attachTo: document.body })
}

/** A REAL book off a REAL `createWorld` world whose milestone ledger is posed – a dense stretch of titles, a
 *  prize, an international, school, an injury and a season rank around age fourteen – and assembled by the
 *  engine's own `assembleAlbum`, the function the worker's `album` query runs. It is the recipe
 *  `tests/albumBook.test.ts` pins at the ruled three sheets; nothing about the book is typed by hand here. */
function posedBook(): AlbumBook {
  const world = createWorld('r46-18-album')
  const weekAtAge = (age: number): number => {
    for (let w = 0; w < 2000; w += 1) if (kidAgeAt(world, w) === age) return w
    throw new Error(`no week reaches age ${age}`)
  }
  const base = weekAtAge(14)
  world.week = weekAtAge(16) + 40
  ;(['local', 'regional', 'national', 'j30', 'j60', 'j300'] as const).forEach((tier, i) =>
    world.milestones.push({ type: 'title', week: base + i * 4, tier }),
  )
  world.milestones.push({ type: 'prize', week: base + 30, tier: 'j30' })
  world.milestones.push({ type: 'international', week: base + 34, tier: 'j30' })
  world.milestones.push({ type: 'school', week: base + 38 })
  world.milestones.push({ type: 'injury', week: base + 42, kind: 'ankle soreness' })
  world.milestones.push({ type: 'season-rank', week: base + 46, seasonIndex: 1, rank: 40 })
  world.milestones.push({ type: 'final', week: base + 2, tier: 'j30' })
  return assembleAlbum(world)
}

const AGE_OFFER: RetirementOffer = { askedWeek: 1453, seasonIndex: 27, reason: 'age', final: false }

function mountRetirement(ageYears: number) {
  useGameStore().$patch({
    snapshot: {
      ageYears,
      week: 1453,
      kidRank: 88,
      fundsCents: 1234_00,
      oneMoreYearCount: 0,
      careerTotals: { earnedCents: 0, spentCents: 0, prizeCents: 0 },
      careerMoney: moneyOf(NO_MONEY),
      retirementOffer: AGE_OFFER,
    } as unknown as Snapshot,
  })
  return mount(RetirementDialog, { attachTo: document.body })
}

beforeEach(() => {
  setActivePinia(createPinia())
  document.body.innerHTML = ''
})
afterEach(() => {
  setViewport(PHONE)
  vi.restoreAllMocks()
})

// =================================================================================================
// 13 – THE PICTURE KEEPS THE WHOLE HEAD
// =================================================================================================
//
// THE GEOMETRY, stated so the case is checkable by hand: the paintings are SQUARE, `object-fit: cover`
// scales one to the box's WIDTH, and a band `ratio` (height over width) shows `ratio` of its height.
// `object-position: Y%` puts the window's top at `Y% × (width − bandHeight)`. The head is the table's
// own rectangle: centre (cx, cy), side `side`, in the painting's 512px.

/** The room above and below the head inside the window, in px, for a painting scaled to `width`.
 *  Both ≥ 0 means the whole head is in view. */
function headRoom(stem: string, ratio: number, yPct: number, width: number): { above: number; below: number } {
  const [, cy, side] = CROPS[stem]
  const k = width / 512
  const bandH = ratio * width
  const windowTop = (yPct / 100) * (width - bandH)
  return {
    above: (cy - side / 2) * k - windowTop,
    below: windowTop + bandH - (cy + side / 2) * k,
  }
}

/** One declaration of an element's inline style – through the CSSOM where happy-dom knows the property,
 *  through the attribute where it does not. */
function inlineStyle(el: Element, prop: string): string {
  const direct = (el as HTMLElement).style.getPropertyValue(prop)
  if (direct) return direct
  const m = new RegExp(`${prop}:\\s*([^;]+)`).exec(el.getAttribute('style') ?? '')
  return m ? m[1].trim() : ''
}

/** `'2 / 1'` → 0.5: the band's height over its width. */
function bandRatioOf(aspect: string): number {
  const [w, h] = aspect.split('/').map((n) => parseFloat(n))
  return h / w
}

/** The widths the picture really meets: the 320px phone's image, the 375px phone's, the card's own cap
 *  (`.retire-card` 420px less its padding), and a margin beyond it. */
const WIDTHS = [240, 303, 372, 420]
const EPS = -1e-9

describe('round 46 #13 – the retirement picture keeps the whole head', () => {
  for (const [age, stage] of [
    [30, 'adult'],
    [41, 'lateCareer'],
  ] as const) {
    it(`⭐ ${stage}: the band declares a ratio and an anchor that keep the head inside the window at every width`, () => {
      const w = mountRetirement(age)
      const img = w.find('img.retire-art').element
      const ratio = bandRatioOf(inlineStyle(img, 'aspect-ratio'))
      const y = parseFloat(inlineStyle(img, 'object-position').split(/\s+/)[1])
      expect(Number.isFinite(ratio) && ratio > 0, 'the band declares an aspect-ratio, not a pixel height').toBe(true)
      expect(Number.isFinite(y), 'and an object-position the face table steered').toBe(true)
      for (const width of WIDTHS) {
        const room = headRoom(`${stage}-serious`, ratio, y, width)
        expect(room.above, `${stage} at ${width}px: the top of the head is above the window by ${(-room.above).toFixed(1)}px`).toBeGreaterThanOrEqual(EPS)
        expect(room.below, `${stage} at ${width}px: the chin is below the window by ${(-room.below).toFixed(1)}px`).toBeGreaterThanOrEqual(EPS)
      }
      w.unmount()
    })
  }

  it('control: the OLD anchor (the face CENTRE on the old 140px band) DID cut the head at the card\'s widest – the model sees the defect', () => {
    const adult = headRoom('adult-serious', 140 / 372, facePoint('adult-serious').y, 372)
    const late = headRoom('lateCareer-serious', 140 / 372, facePoint('lateCareer-serious').y, 372)
    expect(adult.above, 'the 25-30 portrait lost the top of the head').toBeLessThan(-8)
    expect(late.above, 'the 31+ portrait lost a quarter of it').toBeLessThan(-25)
  })

  it('`bandFacePoint` keeps EVERY painting\'s head in a 2:1 window at every width, not only the two the card shows', () => {
    const stems = Object.keys(CROPS)
    expect(stems.length, 'a non-empty denominator').toBeGreaterThan(20)
    for (const stem of stems) {
      const y = bandFacePoint(stem, 0.5).y
      for (const width of WIDTHS) {
        const room = headRoom(stem, 0.5, y, width)
        expect(room.above, `${stem} at ${width}px`).toBeGreaterThanOrEqual(EPS)
        expect(room.below, `${stem} at ${width}px`).toBeGreaterThanOrEqual(EPS)
      }
    }
  })
})

// =================================================================================================
// 18 – THE REAL ALBUM, FROM THE LAST PAGE
// =================================================================================================

describe('round 46 #18 – the last page offers the real album', () => {
  it('⭐ «View the album» is FIRST in the footer, the reel\'s pager is gone, and the last page is what stayed', () => {
    const w = mountEnding()
    const foot = w.find('.ending-foot').element
    expect(foot.firstElementChild?.classList.contains('ending-door-album'), 'the lead control of the last page').toBe(true)
    expect(w.find('.ending-door-album').text()).toBe('View the album')
    expect(w.find('h2').text(), 'the eyebrow it always wore').toBe('The last page')
    expect(w.findAll('.album-arrow'), 'no Back / Next').toHaveLength(0)
    expect(w.findAll('.album-dots'), 'no dots').toHaveLength(0)
    expect(w.text(), 'the ending\'s own page – caption, rule, fact – is still drawn').toContain('why 7')
    expect(w.text()).toContain('Raise another')
    w.unmount()
  })

  it('⭐⭐ pressing it lays the REAL book over the ending – the engine\'s own sheets, every one reachable – and Back returns', async () => {
    const book = posedBook()
    expect(book.sheets.length, 'the posed career has a book to look through').toBeGreaterThan(1)
    const game = useGameStore()
    const load = vi.fn(async () => book)
    game.loadAlbum = load
    const w = mountEnding()
    expect(w.findComponent(AlbumScreen).exists(), 'no book before the door is used').toBe(false)

    await w.find('.ending-door-album').trigger('click')
    await flushPromises()
    expect(load, 'the same worker query the Home door uses').toHaveBeenCalledTimes(1)
    const shown = w.findComponent(AlbumScreen)
    expect(shown.exists(), 'the album screen itself, not a copy of it').toBe(true)
    expect(shown.props('book')).toEqual(book)
    expect(w.findAll('.album-dot'), 'a dot per sheet – every sheet of the book').toHaveLength(book.sheets.length)
    expect(w.find('.album-count').text()).toBe(`Sheet 1 of ${book.sheets.length}`)
    expect(w.find('.album-head-title').text(), 'and the first sheet is the book\'s own').toBe(book.sheets[0].chapterTitle)
    expect(w.find('.ending-album').exists(), 'the card is covered, not stacked under it').toBe(false)

    await w.find('.album-back').trigger('click')
    expect(w.findComponent(AlbumScreen).exists(), 'Back closes the book').toBe(false)
    expect(w.find('.ending-album').exists()).toBe(true)
    expect(w.find('h2').text()).toBe('The last page')
    w.unmount()
  })

  it('opens at the top of the book and returns to where the card was left', async () => {
    useGameStore().loadAlbum = vi.fn(async () => posedBook())
    const w = mountEnding()
    const takeover = w.find('.ending').element as HTMLElement
    takeover.scrollTop = 140
    await w.find('.ending-door-album').trigger('click')
    await flushPromises()
    expect(takeover.scrollTop, 'a screen opens at its top').toBe(0)
    await w.find('.album-back').trigger('click')
    await flushPromises()
    expect(takeover.scrollTop, 'and the card comes back where it was left').toBe(140)
    w.unmount()
  })

  it('a refused fetch cannot trap the player: the book draws its empty chrome and Back still works', async () => {
    useGameStore().loadAlbum = vi.fn(async () => null)
    const w = mountEnding()
    await w.find('.ending-door-album').trigger('click')
    await flushPromises()
    expect(w.findComponent(AlbumScreen).props('book')).toBeNull()
    await w.find('.album-back').trigger('click')
    expect(w.find('.ending-album').exists(), 'the doors are back').toBe(true)
    expect(w.text()).toContain('Raise another')
    w.unmount()
  })

  it('a LATE answer from a closed layer never paints the next one (the ticket)', async () => {
    const first = posedBook()
    const second = { ...first, sheets: first.sheets.slice(0, 1) } as AlbumBook
    let release: (b: AlbumBook) => void = () => undefined
    const slow = new Promise<AlbumBook>((resolve) => {
      release = resolve
    })
    const game = useGameStore()
    game.loadAlbum = vi
      .fn<() => Promise<AlbumBook | null>>()
      .mockImplementationOnce(() => slow)
      .mockImplementationOnce(async () => second)
    const w = mountEnding()
    await w.find('.ending-door-album').trigger('click') // request 1, still in flight
    await w.find('.album-back').trigger('click') // the layer closes under it
    await w.find('.ending-door-album').trigger('click') // request 2
    await flushPromises()
    release(first) // …and the stale answer lands last
    await flushPromises()
    expect(w.findComponent(AlbumScreen).props('book'), 'the newest request wins').toEqual(second)
    w.unmount()
  })
})

// ---- the new layer and the new controls fit a phone (CLAUDE.md: ROUND-20 #3) --------------------------
//
// ⚠ `setViewport` RUNS BEFORE THE MOUNT – happy-dom caches a media query on its first computed-style
// read, so a late call would measure the desktop column and the case could not redden. The mutation is
// `.ending`'s `overflow-y: auto` -> `visible` (the takeover stops being the scroller): `measureDialog`
// then reports `overlayScrolls: false` and every case below goes red.
//
// ⚠ WHY THE ALBUM LAYER AND THE LEAD DOOR DO NOT GO THROUGH `assertDismissReachable`: that helper places
// the control as the TAIL of the card, scrolled to its end – the right model for «Raise another» and
// the line under it, and the wrong one for a control that is FIRST (the album's Back arrow) or leads the
// footer (the album door): it reports them above the screen when the takeover is scrolled to the bottom,
// which is where nobody needs them. So those two are asked the questions that ARE theirs – does the
// takeover scroll, and where does the control sit at the scroll origin – and the export control, which
// really is the tail, goes through the helper like the doors beside it.
describe('round 46 #18/#20 – the album layer and the new controls are reachable on a phone', () => {
  for (const vp of [PHONE, NARROW_PHONE]) {
    it(`⭐ at ${vp.width}x${vp.height}: the album layer scrolls inside the takeover and its Back arrow is the first control on it`, async () => {
      setViewport(vp)
      useGameStore().loadAlbum = vi.fn(async () => posedBook())
      const w = mountEnding()
      await w.find('.ending-door-album').trigger('click')
      await flushPromises()
      const layer = w.find('.ending-book').element
      const fit = measureDialog(layer, w.find('.album-back').element, vp)
      expect(fit.shape, 'the epilogue is a scrolling takeover, not a scrim with a bounded card').toBe('overlay-scrolls')
      expect(fit.overlayScrolls, 'the takeover is the scroller: everything of the book past the fold is reachable').toBe(true)
      expect(
        layer.querySelector('button')?.classList.contains('album-back'),
        'the way back is the first control, so at the scroll origin it sits at the top of the screen',
      ).toBe(true)
      w.unmount()
    })

    it(`⭐ at ${vp.width}x${vp.height}: «View the album» is on the first screen, the export control is reachable, and both fit the width`, () => {
      setViewport(vp)
      const w = mountEnding({ dynasty: dynastyOf({ raisedOnTour: true }) })
      const takeover = w.find('.ending').element
      const card = w.find('.ending-album').element
      const room = availableWidth(takeover, vp)

      const door = w.find('.ending-door-album').element
      const doorFit = measureDialog(card, door, vp)
      expect(doorFit.overlayScrolls, 'the takeover scrolls, so the doors under the lead are reachable').toBe(true)
      const topAtOrigin = doorFit.dismissTop + (doorFit.cardHeight - doorFit.available.height)
      expect(topAtOrigin, `the album door sits at y=${topAtOrigin.toFixed(0)} at the scroll origin of a ${vp.height}px screen`).toBeLessThan(vp.height - 40)
      expect(demandedWidth(door, room), '.ending-door-album width').toBeLessThanOrEqual(room)

      const dev = w.find('.ending-dev')
      expect(dev.exists(), 'the export control is on the last page').toBe(true)
      assertDismissReachable(card, dev.element, vp, 'epilogue .ending-dev')
      expect(demandedWidth(dev.element, room), '.ending-dev width').toBeLessThanOrEqual(room)
      w.unmount()
    })
  }
})

// =================================================================================================
// 20 – THE SERVICE EXPORT
// =================================================================================================

const EXPORT_REPLY = {
  id: 1,
  ok: true,
  type: 'exported',
  bytes: new Uint8Array([7, 7, 7]).buffer,
  filename: 'tennis-sim_r46-seed_w900.tsave',
  revision: 1,
}

interface Recorded {
  request: unknown[]
  download: string | undefined
  blobSize: number | undefined
  blobType: string | undefined
}

/** Run `act` against a stubbed worker and a stubbed browser download, and record what left the store:
 *  the worker request(s), the file name the anchor was given and the Blob it pointed at. */
async function recordExport(act: () => Promise<void>): Promise<Recorded> {
  vi.mocked(request).mockReset()
  vi.mocked(request).mockResolvedValue(EXPORT_REPLY as never)
  const made: Blob[] = []
  const downloads: string[] = []
  const realCreate = URL.createObjectURL
  const realRevoke = URL.revokeObjectURL
  URL.createObjectURL = vi.fn((b: Blob) => {
    made.push(b)
    return 'blob:r46'
  }) as never
  URL.revokeObjectURL = vi.fn() as never
  const click = vi.spyOn(HTMLElement.prototype, 'click').mockImplementation(function (this: HTMLElement) {
    downloads.push((this as HTMLAnchorElement).download)
  })
  try {
    await act()
    await flushPromises()
  } finally {
    click.mockRestore()
    URL.createObjectURL = realCreate
    URL.revokeObjectURL = realRevoke
  }
  return {
    request: vi.mocked(request).mock.calls.map((c) => c[0]),
    download: downloads[0],
    blobSize: made[0]?.size,
    blobType: made[0]?.type,
  }
}

describe('round 46 #20 – the service export on the last screen', () => {
  it('⭐ the last page carries «Export save (dev)», and pressing it runs the store\'s export path once', async () => {
    const game = useGameStore()
    const exportSave = vi.fn(async () => undefined)
    game.exportSave = exportSave
    const w = mountEnding()
    const control = w.find('.ending-dev')
    expect(control.exists(), 'the control is on the screen that covers the way to More').toBe(true)
    expect(control.text()).toBe('Export save (dev)')
    await control.trigger('click')
    expect(exportSave).toHaveBeenCalledTimes(1)
    w.unmount()
  })

  it('⭐⭐ it is the SAME bytes as More\'s button – one function, one worker query, one file – and nothing is serialised here', async () => {
    // What More's «Export to file» runs is exactly `game.exportSave()`. Record that, then record the control.
    const direct = await recordExport(() => useGameStore().exportSave())
    expect(direct.request, 'More\'s path asks the worker\'s `exportSave` query and nothing else').toEqual([{ type: 'exportSave' }])
    expect(direct.download).toBe(EXPORT_REPLY.filename)
    expect(direct.blobSize, 'the worker\'s bytes, untouched').toBe(3)

    const w = mountEnding()
    const viaControl = await recordExport(async () => {
      await w.find('.ending-dev').trigger('click')
    })
    expect(viaControl, 'the same request, the same file name, the same Blob').toEqual(direct)
    w.unmount()
  })
})

// =================================================================================================
// 21 – THE DYNASTY CARD, MOUNTED (the 200-seed sweep is tests/dynasty-daughter-name.test.ts)
// =================================================================================================

describe('round 46 #21 – the dynasty card never proposes or rolls her mother\'s name', () => {
  it('⭐ a mother who kept the default does not hand it to her daughter: the card opens on another name from the die', () => {
    const block = dynastyOf({ motherName: { first: DEFAULT_PROFILE.kidName, last: 'Martin' }, childSeed: 'r46-21:dynasty:1' })
    const w = mount(ChildhoodPrologue, { props: { dynasty: block }, attachTo: document.body })
    const first = (w.find('#prologue-first').element as HTMLInputElement).value
    expect(first, 'not her mother\'s name').not.toBe(DEFAULT_PROFILE.kidName)
    expect(NAME_POOL, 'a name off the die').toContain(first)
    w.unmount()
  })

  it('control: a mother with another name leaves the opening default exactly where it was', () => {
    const block = dynastyOf({ motherName: { first: 'Vera', last: 'Martin' }, childSeed: 'r46-21:dynasty:1' })
    const w = mount(ChildhoodPrologue, { props: { dynasty: block }, attachTo: document.body })
    expect((w.find('#prologue-first').element as HTMLInputElement).value).toBe(DEFAULT_PROFILE.kidName)
    w.unmount()
  })

  it('⭐ the first-name die never rolls her mother\'s name – every index of the unfiltered menu, pressed – and still rolls the rest', async () => {
    const block = dynastyOf({ motherName: { first: 'Vera', last: 'Martin' }, childSeed: 'r46-21:dynasty:1' })
    const w = mount(ChildhoodPrologue, { props: { dynasty: block }, attachTo: document.body })
    const seen = new Set<string>()
    for (let k = 0; k < NAME_POOL.length; k += 1) {
      vi.spyOn(Math, 'random').mockReturnValue((k + 0.5) / NAME_POOL.length)
      await w.find('.prologue-dice').trigger('click')
      seen.add((w.find('#prologue-first').element as HTMLInputElement).value)
      vi.restoreAllMocks()
    }
    expect(seen.has('Vera'), 'her own name came up on the die').toBe(false)
    expect(seen.size, 'control: the other 23 are all still reachable').toBe(NAME_POOL.length - 1)
    w.unmount()
  })
})
