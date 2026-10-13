// ⭐⭐⭐ ROUND 51 №10/№11 (13.10) – THE CHEMISTRY RING OPENS ITS OWN EXPLAINER. MOUNTED.
//
// The owner played 44 weeks and the ring on his coach's card never moved: «за 44 недели химия с тренером
// не сдвинулась ни на одно деление» (№10), and asked for «какой-то небольшой информ попап» behind a tap
// on it, because the question mark «без движения несколько смущает» (№11). The mechanism was healthy –
// the pair is recomputed every week a coach is hired – and the picture was not: the «?» meant both
// «never worked together» and «working, not readable yet», and a 6% arc is a few pixels. This file holds
// the three halves of the answer: the wire bit that tells the two «?» apart, the tap target that is not
// inside the row's button, and a card short enough for a phone.
//
// ⚠⚠ WHY THE TAP TARGET IS A SIBLING AND NOT THE PLAN'S «@click.stop INSIDE THE ROW». The row is one
// `<button>` and it is `disabled` for the coach she has and for a locked rung – the coach she has being
// the row whose ring is most likely to carry a reading. What a click on a CHILD of a disabled button
// does is the browser's call, and interactive content inside a button is invalid HTML besides. The
// sibling cannot press the hire flow because nothing it does reaches the row, which is what the pointer
// case, the keyboard case and the structure case below all assert from three sides.
//
// ⚠⚠ HAPPY-DOM HAS NO LAYOUT ENGINE (round44-chemistry-card.test.ts's own note): `getBoundingClientRect`
// is zeros here, so every number below is read through `getComputedStyle` on the real cascade, and the
// phone fit is `tests/component/fits.ts`'s deliberate FLOOR. `setViewport(PHONE)` runs BEFORE the mount –
// the media query is cached on the first computed-style read.
//
// ⚠⚠ MUTATION ARMS – each APPLIED to the real tree, RUN against this file, RED MEASURED, and the tree
// restored (reverse-replace, so a concurrent edit is not clobbered) with its hash checked identical
// before and after. 19 tests green on the unmutated tree; each arm's reds:
//   ARM 1   the tap target moved INSIDE the row's button, no `.stop`        -> RED 3 (pointer: the hire
//           confirm opens; keyboard: the same; structure) – the plan's «remove .stop -> the hire flow
//           opens -> red», measured
//   ARM 1b  the same nesting WITH `.stop` (the plan's literal shape)         -> RED 1 (structure only).
//           ⚠ `.stop` alone keeps the pointer and keyboard cases green, which is exactly why the
//           STRUCTURE case exists: it is the half that a stopped click does not prove
//   ARM 2   `chemInfoState` ignores `chemistryKnown`                         -> RED 1 (the three lines)
//   ARM 3   the engine writes `chemistryKnown: true` for every coach         -> RED 3 (both wire cases
//           and the three lines)
//   ARM 4   the target detached from the gauge (`right: 9px` -> `40px`)      -> RED 1 (the corner case)
//   ARM 5   a too-tall card (the pause line x14)                             -> RED 6 (every phone
//           variant: «the card is taller than the phone»). THE DEMONSTRATION THE BRIEF ASKED FOR – the
//           fit net fails on a too-tall version, and it is the content-dependent half
//   ARM 8   `.replay-close` pushed above the screen (`top: -400px`)          -> RED 6 (the dismiss
//           control's box is outside 375x667 / 320x568)
//   MEASURE the floor bound tightened to 1% to print what each variant needs: 375x667 – never 285,
//           unread 285, read 264 of 635px of room; 320x568 – 321, 341, 301 of 536px
// ⚠ THE DISABLED-ROW CASE DOES NOT DISCRIMINATE IN THIS HARNESS AND IS NOT CLAIMED TO: it stayed green
// under both nested arms, because happy-dom does not model what a browser does with a click on a CHILD
// of a disabled button. The reason for the sibling is the HTML content model and that browser variance;
// what holds it in place here is the structure case.
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { readFileSync } from 'node:fs'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { nextTick } from 'vue'
import '../../src/style.css'
import CoachMarketScreen from '../../src/components/screens/CoachMarketScreen.vue'
import ChemistryHelpDialog from '../../src/components/ChemistryHelpDialog.vue'
import ConfirmDialog from '../../src/components/ConfirmDialog.vue'
import { useGameStore } from '../../src/stores/game'
import { createWorld, toSnapshot } from '../../src/engine/world'
import { DEFAULT_PROFILE, type CoachMarketRow, type Snapshot } from '../../src/shared/protocol'
import { boxOf, measureDialog, NARROW_PHONE, PHONE, setViewport } from './fits'
import { installCatalog, resetI18nForTests, setLocale } from '../../src/i18n'

const RU = JSON.parse(readFileSync('src/i18n/ru.json', 'utf8')) as Record<string, string>

// The EXACT DRAFT copy, asserted as the owner's reviewable draft: a wording change moves these on
// purpose and in the same diff (invariant 4 – the pins assert what the string IS).
const NEVER = 'She has not worked with this coach yet, so there is nothing to read.'
const UNREAD = 'They have worked together, but it is not readable yet – it needs more time together.'
const PAUSE = 'When a coach is let go, it stays where it was – it does not fade – and carries on if you hire that coach again.'
const WEEKLY = 'It shifts a little every week they work together – slowly, so a first reading can take months.'

function px(value: string, what: string): number {
  const n = Number.parseFloat(value)
  if (!Number.isFinite(n)) throw new Error(`${what} computed to "${value}" – the cascade was not consulted`)
  return n
}

interface Posed {
  snapshot: Snapshot
  /** the coach on the payroll – a DISABLED row – with a reading of 6 */
  current: CoachMarketRow
  /** a hireable stranger the pair has worked with, below its bar: `chemistry` null, `chemistryKnown` true */
  unread: CoachMarketRow
  /** a hireable stranger with a NEGATIVE reading of -33.4 */
  negative: CoachMarketRow
  /** a hireable stranger she has never worked with */
  never: CoachMarketRow
  /** a points-locked row, also disabled – null when this fixture's board has none */
  locked: CoachMarketRow | null
}

/** One career, four coaches posed in four different relationships. The pairs are WRITTEN onto the world
 *  and the snapshot is cut from it, so the wire field under test is the engine's own, not a fixture's. */
function posed(seed = 'r51-chem-info'): Posed {
  const world = createWorld(seed, { ...DEFAULT_PROFILE, coachTier: 'middle' })
  if (!world.coachId) throw new Error('this profile is supposed to start with a coach on the payroll')
  const strangers = toSnapshot(world).coachMarket.filter((r) => !r.current && r.lockedPoints === null)
  if (strangers.length < 3) throw new Error('the fixture needs three hireable strangers')
  world.coachPairs[world.coachId] = { chem: 6, phase: 0, standing: 0 }
  // 0.3 sits under the pair's own bar, which is drawn in [1, 2.5] – the lowest the bar can be is 1.
  world.coachPairs[strangers[0].id] = { chem: 0.3, phase: 0, standing: 0 }
  world.coachPairs[strangers[1].id] = { chem: -33.4, phase: 0, standing: 0 }
  const snapshot = toSnapshot(world)
  const byId = (id: string): CoachMarketRow => snapshot.coachMarket.find((r) => r.id === id)!
  return {
    snapshot,
    current: snapshot.coachMarket.find((r) => r.current)!,
    unread: byId(strangers[0].id),
    negative: byId(strangers[1].id),
    never: byId(strangers[2].id),
    locked: snapshot.coachMarket.find((r) => r.lockedPoints !== null) ?? null,
  }
}

async function mountCoaches(snapshot: Snapshot) {
  const store = useGameStore()
  store.snapshot = snapshot
  const wrapper = mount(CoachMarketScreen, { attachTo: document.body })
  const pill = wrapper.findAll('.tb-seg .tab-pill').find((b) => b.text() === 'Coaches')
  await pill!.trigger('click')
  await nextTick()
  return wrapper
}

type Screen = Awaited<ReturnType<typeof mountCoaches>>
const cellOf = (w: Screen, row: CoachMarketRow) => w.findAll('.cm-cell').find((c) => c.get('.cm-name').text() === row.name)!

describe('round 51 №11 – the wire tells the two question marks apart', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    document.body.innerHTML = ''
  })

  it('⭐ `chemistryKnown` is the pair being on the books, and the reading is a different question', () => {
    const p = posed()
    // The coach she has: a row, and a reading.
    expect(p.current.chemistryKnown).toBe(true)
    expect(p.current.chemistry).toBe(6)
    // THE BIT THIS ITEM EXISTS FOR: the same `null` reading, two different pasts.
    expect(p.unread.chemistry, 'below the pair\'s bar the wire still says null').toBeNull()
    expect(p.unread.chemistryKnown, 'but they HAVE worked together').toBe(true)
    expect(p.never.chemistry).toBeNull()
    expect(p.never.chemistryKnown, 'a stranger has no row').toBe(false)
    expect(p.negative.chemistryKnown).toBe(true)
    expect(p.negative.chemistry).toBeCloseTo(-33.4, 5)
  })

  it('a career that has hired nobody else reads every stranger as «never» – the field is not constant', () => {
    const world = createWorld('r51-chem-fresh', { ...DEFAULT_PROFILE, coachTier: 'middle' })
    const rows = toSnapshot(world).coachMarket
    expect(rows.length).toBeGreaterThan(8)
    const known = rows.filter((r) => r.chemistryKnown === true).map((r) => r.id)
    // Whatever the fresh world holds (the coach she starts with, at most), it is exactly the set of
    // coaches that own a pair row – and the strangers are not in it.
    expect(known.sort()).toEqual(Object.keys(world.coachPairs).sort())
    expect(known.length, 'at least the strangers read false').toBeLessThan(rows.length)
  })
})

describe('round 51 №11 – the tap target is beside the row\'s button, never inside it', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    document.body.innerHTML = ''
    setViewport(PHONE)
  })

  it('⭐⭐ STRUCTURE: every row has a control of its own, the ring is still in the row, and no button holds a button (ARM 1)', async () => {
    const p = posed()
    const wrapper = await mountCoaches(p.snapshot)
    const cells = wrapper.findAll('.cm-cell')
    expect(cells.length, 'the whole board, not one card').toBe(p.snapshot.coachMarket.length)
    for (const cell of cells) {
      const row = cell.get('button.cm-row').element
      const open = cell.get('.cm-chem-open').element
      expect(open.tagName, 'a real button, so Tab reaches it and Enter and Space press it natively').toBe('BUTTON')
      expect(open.getAttribute('type')).toBe('button')
      expect(open.closest('button.cm-row'), 'the control is INSIDE the row\'s button – a click on it is the hire flow\'s').toBeNull()
      expect(row.contains(open)).toBe(false)
      expect(open.parentElement, 'beside the row, in the same cell').toBe(row.parentElement)
      // ...and the gauge itself did not move: round 44/45's corner is exactly where it was.
      expect(cell.find('.cm-row .cm-right .cm-chem .tb-ring').exists(), 'the ring left the row').toBe(true)
      expect(cell.find('.cm-row .cm-chem .tb-ring-value').text().length).toBeGreaterThan(0)
    }
    wrapper.unmount()
  })

  it('the control carries the ring\'s own spoken label, byte for byte, and says it opens a dialog', async () => {
    const p = posed()
    const wrapper = await mountCoaches(p.snapshot)
    for (const row of [p.current, p.unread, p.negative, p.never]) {
      const cell = cellOf(wrapper, row)
      const open = cell.get('.cm-chem-open')
      expect(open.attributes('aria-label'), `${row.name}: the target must be named like the ring it covers`).toBe(
        cell.get('.cm-row .tb-ring').attributes('aria-label'),
      )
      expect(open.attributes('aria-haspopup')).toBe('dialog')
    }
    // ...and the existing strings are the existing strings (invariant 4): nothing was renamed on the way.
    expect(cellOf(wrapper, p.never).get('.cm-chem-open').attributes('aria-label')).toBe('Chemistry with her: not known yet')
    expect(cellOf(wrapper, p.current).get('.cm-chem-open').attributes('aria-label')).toBe('Chemistry with her: 6%')
    expect(cellOf(wrapper, p.negative).get('.cm-chem-open').attributes('aria-label')).toBe('Chemistry with her: -33%')
    wrapper.unmount()
  })

  it('⭐⭐ POINTER: a tap opens the explainer and the hire flow stays shut; the row\'s own press still hires (ARM 1)', async () => {
    const p = posed()
    const wrapper = await mountCoaches(p.snapshot)
    const cell = cellOf(wrapper, p.never)
    expect(cell.get('button.cm-row').attributes('disabled'), 'a hireable row – the only kind the hire flow can open for').toBeUndefined()

    await cell.get('.cm-chem-open').trigger('click')
    expect(wrapper.find('.guide-card[role="dialog"]').exists(), 'the tap opened nothing').toBe(true)
    expect(wrapper.findComponent(ConfirmDialog).exists(), 'THE TAP PRESSED THE ROW: the hire confirm is up').toBe(false)

    await wrapper.get('.guide-card .replay-close').trigger('click')
    expect(wrapper.find('.guide-card').exists(), 'the close control did not close it').toBe(false)

    // The positive control, so "the confirm did not open" cannot be a screen where it never does.
    await cell.get('button.cm-row').trigger('click')
    expect(wrapper.findComponent(ConfirmDialog).exists(), 'the row\'s own press must still hire').toBe(true)
    expect(wrapper.find('.guide-card').exists(), 'and pressing the row must not open the explainer').toBe(false)
    wrapper.unmount()
  })

  it('⭐⭐ KEYBOARD: focus reaches it, the click a key press makes opens the explainer, and focus comes home on close (ARM 1)', async () => {
    const p = posed()
    const wrapper = await mountCoaches(p.snapshot)
    const open = cellOf(wrapper, p.never).get('.cm-chem-open').element as HTMLButtonElement
    expect(open.disabled).toBe(false)
    expect(open.tabIndex, 'a negative tabindex would take it out of the Tab order').toBeGreaterThanOrEqual(0)
    open.focus()
    expect(document.activeElement, 'the control cannot take the keyboard').toBe(open)

    // What the browser does for Enter and for Space on a focused button is raise a click with `detail` 0.
    // Raised here by hand because happy-dom does not synthesise it – the assertion is where it GOES.
    open.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, detail: 0 }))
    await nextTick()
    expect(wrapper.find('.guide-card[role="dialog"]').exists(), 'Enter/Space on the ring opened nothing').toBe(true)
    expect(wrapper.findComponent(ConfirmDialog).exists(), 'Enter/Space on the ring reached the row and opened the hire flow').toBe(false)
    expect(wrapper.get('.guide-card').element.contains(document.activeElement), 'focus must land inside the card').toBe(true)

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
    await nextTick()
    expect(wrapper.find('.guide-card').exists(), 'Escape is the keyboard\'s way out').toBe(false)
    expect(document.activeElement, 'the keyboard was left where the dialog used to be').toBe(open)
    wrapper.unmount()
  })

  it('⭐ THE COACH SHE HAS AND A LOCKED RUNG – both DISABLED rows – open it too: the target is not part of either', async () => {
    const p = posed()
    const wrapper = await mountCoaches(p.snapshot)
    const disabled = [p.current, ...(p.locked ? [p.locked] : [])]
    expect(p.locked, 'this fixture should have a points-locked rung on the board, so both kinds are exercised').not.toBeNull()
    for (const row of disabled) {
      const cell = cellOf(wrapper, row)
      expect(cell.get('button.cm-row').attributes('disabled'), `${row.name}: the precondition – this row's button is disabled`).toBeDefined()
      await cell.get('.cm-chem-open').trigger('click')
      expect(wrapper.find('.guide-card[role="dialog"]').exists(), `${row.name}: a disabled row swallowed the tap`).toBe(true)
      expect(wrapper.findComponent(ConfirmDialog).exists()).toBe(false)
      await wrapper.get('.guide-card .replay-close').trigger('click')
    }
    wrapper.unmount()
  })

  it('the scrim closes it as well, and it changes nothing about the market behind it', async () => {
    const p = posed()
    const wrapper = await mountCoaches(p.snapshot)
    const before = wrapper.findAll('.cm-row').length
    await cellOf(wrapper, p.current).get('.cm-chem-open').trigger('click')
    expect(wrapper.find('.guide-card').exists()).toBe(true)
    await wrapper.get('.dialog-overlay').trigger('click')
    expect(wrapper.find('.guide-card').exists(), 'a tap on the scrim should dismiss it').toBe(false)
    expect(wrapper.findAll('.cm-row').length).toBe(before)
    expect(wrapper.findComponent(ConfirmDialog).exists()).toBe(false)
    wrapper.unmount()
  })

  it('⚠ THE TARGET SITS ON THE GAUGE\'S CORNER, derived from the same cascade rather than typed (ARM 4)', async () => {
    // The target is an invisible box laid over the ring and the mark above it, so its offsets are only
    // right while the row's padding, the ring's width and the corner's gap are what they are. Read
    // every one of them off the sheet, so a change to any of them that strands the target goes red here.
    const p = posed()
    const wrapper = await mountCoaches(p.snapshot)
    const cell = cellOf(wrapper, p.never)
    const row = getComputedStyle(cell.get('button.cm-row').element)
    const open = getComputedStyle(cell.get('.cm-chem-open').element)
    const ring = px(getComputedStyle(cell.get('.cm-row .tb-ring').element).width, 'ring width')
    const mark = px(getComputedStyle(cell.get('.cm-row .cm-chem-mark').element).height, 'mark height')
    const corner = getComputedStyle(cell.get('.cm-row .cm-chem').element)
    const gap = px(corner.rowGap || corner.gap, 'corner gap')

    expect(open.position, 'a positioned overlay, not a flow child that would move the row').toBe('absolute')
    expect(getComputedStyle(cell.element).position, 'the cell is what the offsets are measured from').toBe('relative')

    // The corner, measured in from the row's right and bottom EDGES (border box).
    const cornerRight = px(row.paddingRight, 'row padding-right') + px(row.borderRightWidth, 'row border-right')
    const cornerBottom = px(row.paddingBottom, 'row padding-bottom') + px(row.borderBottomWidth, 'row border-bottom')
    const cornerW = ring
    const cornerH = mark + gap + ring
    const left = px(open.right, 'target right')
    const bottom = px(open.bottom, 'target bottom')
    const w = px(open.width, 'target width')
    const h = px(open.height, 'target height')

    expect(left, 'the target\'s right edge is past the ring\'s').toBeLessThanOrEqual(cornerRight)
    expect(left + w, 'the target ends before it reaches the ring\'s left edge').toBeGreaterThanOrEqual(cornerRight + cornerW)
    expect(bottom, 'the target starts under the ring').toBeLessThanOrEqual(cornerBottom)
    expect(bottom + h, 'the target reaches over the mark above the ring').toBeGreaterThanOrEqual(cornerBottom + cornerH)
    // ...and it is a thumb, not a sliver.
    expect(w).toBeGreaterThanOrEqual(44)
    expect(h).toBeGreaterThanOrEqual(44)
    // The reset of the global `button` rule: nothing paints on a control that must be invisible.
    expect(px(open.borderTopWidth, 'target border')).toBe(0)
    expect(px(open.paddingTop, 'target padding')).toBe(0)
    wrapper.unmount()
  })
})

describe('round 51 №11 – the card says which question mark this is', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    document.body.innerHTML = ''
    setViewport(PHONE)
  })

  async function openFor(row: CoachMarketRow, snapshot: Snapshot) {
    const wrapper = await mountCoaches(snapshot)
    await cellOf(wrapper, row).get('.cm-chem-open').trigger('click')
    return wrapper
  }

  it('⭐⭐ THE THREE STATES EACH GET THEIR OWN LINE, from the row that was tapped (ARM 2, ARM 3)', async () => {
    const p = posed()
    const seen: Record<string, string> = {}
    for (const [key, row] of [['never', p.never], ['unread', p.unread], ['read', p.current]] as const) {
      const wrapper = await openFor(row, p.snapshot)
      const line = wrapper.get('.chem-help-state')
      expect(line.attributes('data-state'), `${row.name}: the card was handed the wrong state`).toBe(key)
      seen[key] = line.text()
      wrapper.unmount()
      document.body.innerHTML = ''
    }
    expect(seen.never).toBe(NEVER)
    expect(seen.unread).toBe(UNREAD)
    expect(seen.read).toBe('Right now it reads 6%.')
    // The point of the item: the two «?» are no longer the same words.
    expect(new Set(Object.values(seen)).size, 'two states read alike').toBe(3)
  })

  it('the reading is the RING\'S figure – same rounding, same short minus – and never a second arithmetic', async () => {
    const p = posed()
    const wrapper = await openFor(p.negative, p.snapshot)
    const ring = cellOf(wrapper, p.negative).get('.cm-row .cm-chem .tb-ring-value').text()
    expect(ring, 'the fixture\'s ring').toBe('-33%')
    expect(wrapper.get('.chem-help-state').text()).toBe(`Right now it reads ${ring}.`)
    wrapper.unmount()
  })

  it('every state also says it moves every week, and what letting a coach go does to it', async () => {
    const p = posed()
    for (const row of [p.never, p.unread, p.current]) {
      const wrapper = await openFor(row, p.snapshot)
      const text = wrapper.get('.guide-card').text()
      expect(text, `${row.name}: the weekly line is missing`).toContain(WEEKLY)
      expect(text, `${row.name}: the pause line is missing`).toContain(PAUSE)
      expect(wrapper.get('.guide-title').text()).toBe('Chemistry')
      wrapper.unmount()
      document.body.innerHTML = ''
    }
  })

  it('it follows the live row: if the coach leaves the market while it is open, the card goes with him', async () => {
    const p = posed()
    const wrapper = await openFor(p.never, p.snapshot)
    expect(wrapper.find('.guide-card').exists()).toBe(true)
    const store = useGameStore()
    store.snapshot = { ...p.snapshot, coachMarket: p.snapshot.coachMarket.filter((r) => r.id !== p.never.id) }
    await nextTick()
    expect(wrapper.find('.guide-card').exists(), 'a card about a row that is gone').toBe(false)
    wrapper.unmount()
  })
})

describe('round 51 №11 – in Russian (DRAFT rows RU23-CHM-01..07 in docs/localization/ru-profile-coaching-2026-10.md)', () => {
  afterEach(() => {
    document.body.innerHTML = ''
    resetI18nForTests(null)
    document.documentElement.lang = 'en'
  })

  it('every line of the card renders from the Russian catalog – the figure is substituted, nothing stays in English', async () => {
    document.body.innerHTML = ''
    resetI18nForTests(null)
    installCatalog('ru', RU)
    await setLocale('ru')
    const lines: string[] = []
    for (const [state, figure] of [['never', undefined], ['unread', undefined], ['read', '6'], ['read', '-33']] as const) {
      const wrapper = mount(ChemistryHelpDialog, { props: { state, figure }, attachTo: document.body })
      const text = wrapper.get('.guide-card').text()
      expect(text, `${state}: a Latin letter on the card means an untranslated key`).not.toMatch(/[A-Za-z]/)
      lines.push(wrapper.get('.chem-help-state').text())
      wrapper.unmount()
    }
    expect(lines).toEqual([
      'Она ещё не работала с этим тренером, поэтому показывать пока нечего.',
      'Они уже работали вместе, но значение ещё не прочитано – нужно больше времени вместе.',
      'Сейчас значение: 6%.',
      'Сейчас значение: -33%.',
    ])
  })
})

describe('⚠⚠ round 51 №11 – THE PHONE BOX LAW: the card fits 375x667 and its dismiss control is on the screen (ARM 5)', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    document.body.innerHTML = ''
  })

  // CLAUDE.md's rule, on the card that had every reason to ignore it: TourBriefingDialog grew one honest
  // sentence at a time and one day its dismiss control was off the screen and the career stopped there.
  // RankHelpDialog's net (round36-rank-help-dialog.test.ts) holds the CONTENT-INDEPENDENT half – a bound
  // and a scroller. This holds that AND the content-dependent half, which is the one that catches the
  // next sentence: the whole card, every line, fits the room a phone leaves WITHOUT scrolling at all.
  for (const [label, vp] of [['375x667', PHONE], ['320x568', NARROW_PHONE]] as const) {
    for (const [state, figure] of [['never', undefined], ['unread', undefined], ['read', '-33']] as const) {
      it(`${label} / ${state}: no scrolling needed, the close control inside the screen, a bound that fits`, () => {
        setViewport(vp) // BEFORE the mount – happy-dom caches a media query on the first computed-style read
        const wrapper = mount(ChemistryHelpDialog, { props: { state, figure }, attachTo: document.body })
        const card = wrapper.get('.guide-card').element
        const close = card.querySelector('.replay-close')!
        expect(close, 'the card has no close control').toBeTruthy()
        expect(document.head.querySelector('style'), 'no stylesheet – this measurement is vacuous').toBeTruthy()

        // ⚠ `measureDialog` READS A DISMISS CONTROL OFF THE BOTTOM OF THE FLOW and throws for a pinned one
        // ("out of its parent's flow") – RankHelpDialog's own net says so for the same close. What this
        // call is used for is everything BEFORE that read: the content floor, the room, the card's width
        // and where the overlay centres it. So it is handed the last thing in the flow as its second
        // argument, and its `dismissTop`/`dismissBottom` are not read; the close's box is taken below
        // from the pinned declaration, which is what actually places it.
        const flow = [...card.children].filter((k) => getComputedStyle(k).position !== 'absolute')
        const fit = measureDialog(card, flow[flow.length - 1], vp)
        const where = `${label}/${state}: card ${fit.cardWidth.toFixed(0)}x${fit.cardHeight.toFixed(0)}, content wants at least ${fit.contentFloor.toFixed(0)} of ${fit.available.height.toFixed(0)}px of room`

        // The content-dependent half: the card is not taller than the room, so nothing is past a fold.
        expect(fit.contentFloor, `${where} – the card is taller than the phone`).toBeLessThanOrEqual(fit.available.height)

        // The dismiss control's box, once the card sits where the overlay centres it. It is PINNED to
        // the card's top (`.replay-close`), so the offset is its own declared `top`.
        const ccs = getComputedStyle(close)
        const top = fit.cardTop + px(ccs.top, '.replay-close top')
        const bottom = top + boxOf(close, fit.cardWidth).h
        expect(top, `${where} – the close control is above the screen`).toBeGreaterThanOrEqual(0)
        expect(bottom, `${where} – the close control is below the screen`).toBeLessThanOrEqual(vp.height)
        expect(ccs.position).toBe('absolute')

        // The content-independent half, RankHelpDialog's: a declared bound that fits, and a scroller.
        const cs = getComputedStyle(card)
        const cap = px(cs.maxHeight, '.guide-card max-height')
        expect(cap, `${where} – the bound is ${cs.maxHeight}`).toBeLessThanOrEqual(vp.height)
        expect(cs.overflowY, 'bounded with no scroller hides the rest for good').toBe('auto')
        wrapper.unmount()
      })
    }
  }
})
