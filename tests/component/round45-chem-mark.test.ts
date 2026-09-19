// ⭐⭐ ROUND 45 #2 – THE CHEMISTRY MARK AT THE BOTTOM BAR'S SIZE, AND OFF THE GAUGE. MOUNTED.
//
// The owner, on the deployed wave-7 build, asked for both halves in one sentence: the mark on the
// coach cards should be BIGGER – the size it has in the bottom navigation menu – and nudged further
// up, away from the ring under it. His sentence is quoted verbatim on `.cm-chem` in src/style.css,
// where the house keeps his words and where the rule that can be edited actually lives.
//
// ⚠⚠ WHY THIS FILE MEASURES THE TAB BAR RATHER THAN PINNING 20. «As in the bottom menu» is a claim
// about TWO places agreeing, and a test that asserts `width === 20px` on the coach card is green on
// the day somebody changes the tab bar and the two stop agreeing – which is the exact defect the ask
// is about. So the bottom bar's own markup is built in the same document, off the same sheet, and the
// card's mark is measured AGAINST IT. Same for the air: `.tab-btn`'s icon-to-label gap is the number
// `.cm-chem` now carries between the mark and the gauge.
//
// ⚠ HAPPY-DOM HAS NO LAYOUT ENGINE (round44-chemistry-card.test.ts's own note): `getBoundingClientRect`
// is zeros here, so every number below is read through `getComputedStyle` on the real cascade, and
// the fit is `tests/component/fits.ts`'s deliberate FLOOR.
//
// ⚠⚠ MUTATION ARMS – each APPLIED to the real tree and RUN against this file, each red MEASURED:
//   ARM 1  `:size="13"` put back on the card's AppIcon          -> RED [1] (the size case)
//   ARM 2  `.cm-chem { gap: 2px }` restored                     -> RED [1] (the air case)
//   ARM 3  `.tab-icon { width: 28px }` (the bar moved, the card did not)
//                                                               -> RED [1] (the size case – which is
//          the half a hard-coded 20 could never catch, and the reason this file reads the bar)
//   ARM 4  the mark at `:size="48"`, wider than the ring it marks
//                                                               -> RED [2] (the phone case, and the
//          size case with it – a mark that is not the bar's is not the bar's whatever the reason)
// ⚠ AND ONE ARM THAT CAME BACK GREEN AND IS RECORDED BECAUSE IT DID. The first ARM 4 was the RING at
// `:size="56"`, aimed at the width claim – and it passed, correctly: «the mark is narrower than the
// circle» gets EASIER as the circle grows, so a bigger ring is not this file's defect to catch (round
// 44 §4 owns «the ring is no wider than the price group»). The arm was re-aimed at the thing this
// item actually moved, which is the mark.
//
// MEASURED HEADROOM, so a future growth knows what it is spending: with the mark at the bar's size
// the right column stacks 96px into the 150px an ordinary card's padding box already has – 54px
// still free (it was 63px at the old 13px mark).
import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { nextTick } from 'vue'
import '../../src/style.css'
import CoachMarketScreen from '../../src/components/screens/CoachMarketScreen.vue'
import { useGameStore } from '../../src/stores/game'
import { createWorld, toSnapshot, type WorldState } from '../../src/engine/world'
import { DEFAULT_PROFILE, type Snapshot } from '../../src/shared/protocol'
import { availableWidth, boxOf, PHONE, setViewport } from './fits'

function px(value: string, what: string): number {
  const n = Number.parseFloat(value)
  if (!Number.isFinite(n)) throw new Error(`${what} computed to "${value}" – the cascade was not consulted`)
  return n
}

function assertSheetPresent(): void {
  if (!document.head.querySelector('style')) {
    throw new Error('no stylesheet in the document – the component project needs `css: true`')
  }
}

/** The bottom navigation, as `App.vue` writes it, built in this document so its numbers are read off
 *  the SHIPPED sheet rather than quoted from it. */
function bottomBar(): { icon: Element; btn: Element } {
  const nav = document.createElement('nav')
  nav.className = 'tab-bar'
  nav.innerHTML =
    '<button class="tab-btn"><span class="tab-icon"></span><span class="tab-label">Home</span></button>'
  document.body.appendChild(nav)
  return { icon: nav.querySelector('.tab-icon')!, btn: nav.querySelector('.tab-btn')! }
}

/** A career with a coach on the payroll and a real reading on the pair, so the corner draws the
 *  gauge rather than only the question mark. */
function withChemistry(chem: number, seed = 'r45-mark'): Snapshot {
  const world: WorldState = createWorld(seed, { ...DEFAULT_PROFILE, coachTier: 'middle' })
  if (!world.coachId) throw new Error('this profile is supposed to start with a coach on the payroll')
  world.coachPairs[world.coachId] = { chem, phase: 0, standing: 0 }
  return toSnapshot(world)
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

describe('round 45 #2 – the mark is the bottom bar\'s, and it stands off the gauge', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    document.body.innerHTML = ''
  })

  it('⭐⭐ THE SIZE IS THE TAB BAR\'S OWN, read off the bar rather than pinned (ARM 1, ARM 3)', async () => {
    assertSheetPresent()
    setViewport(PHONE)
    const { icon } = bottomBar()
    const bar = px(getComputedStyle(icon).width, '.tab-icon width')
    expect(bar, 'the bottom bar really does size its icons – otherwise this comparison is vacuous').toBeGreaterThan(0)

    const wrapper = await mountCoaches(withChemistry(64))
    const marks = wrapper.findAll('.cm-row .cm-chem-mark')
    expect(marks.length, 'the whole board carries a mark, not one card').toBeGreaterThan(8)
    for (const mark of marks) {
      const cs = getComputedStyle(mark.element)
      expect(px(cs.width, '.cm-chem-mark width'), 'the mark is the size it is in the bottom menu').toBe(bar)
      expect(px(cs.height, '.cm-chem-mark height'), 'and square, as the bar\'s is').toBe(bar)
    }
    wrapper.unmount()
  })

  it('⭐ THE AIR IS THE BAR\'S TOO – the mark stands off the gauge by the tab button\'s own gap (ARM 2)', async () => {
    assertSheetPresent()
    setViewport(PHONE)
    const { btn } = bottomBar()
    const barGap = px(getComputedStyle(btn).rowGap || getComputedStyle(btn).gap, '.tab-btn gap')
    expect(barGap, 'the tab button really does space its icon from its label').toBeGreaterThan(0)

    const wrapper = await mountCoaches(withChemistry(64))
    const corner = wrapper.find('.cm-row .cm-chem').element
    const cs = getComputedStyle(corner)
    expect(cs.flexDirection, 'the mark sits ABOVE the gauge, so the gap is the vertical one').toBe('column')
    expect(px(cs.rowGap || cs.gap, '.cm-chem gap'), 'one number for «a mark and the thing it marks»').toBe(barGap)
    wrapper.unmount()
  })

  it('⭐ the mark is still the app\'s one icon door, in the accent, above the gauge', async () => {
    // The two facts round 44 settled and this item may not disturb: `--accent` belongs to the mark
    // (so the mark and the ring's gradient never compete), and the mark comes BEFORE the ring.
    assertSheetPresent()
    setViewport(PHONE)
    const wrapper = await mountCoaches(withChemistry(-64))
    const corner = wrapper.find('.cm-row .cm-chem').element
    expect([...corner.children].map((c) => c.className.split(/\s+/)[0]), 'the mark, then the gauge').toEqual([
      'tb-icon',
      'tb-ring',
    ])
    const accent = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim()
    expect(accent, 'the accent is a real declared colour').toMatch(/^#|^rgb/)
    expect(getComputedStyle(corner.children[0]).color, 'the mark is the wave\'s accent').toBe(accent)
    wrapper.unmount()
  })

  it('⚠⚠ AND NOTHING GREW ON A 375x667 PHONE – the bigger mark costs the text column nothing (ARM 4)', async () => {
    // Round 42 #52's measurement, re-taken because this item changes the two numbers it rests on.
    // ACROSS: the corner is as wide as its widest child and the ring is still the widest of them, so
    // `.cm-right` does not widen and no line in the card re-wraps. DOWN: the two groups still stack
    // inside the row's own floor, and the failure message carries the headroom so a future growth
    // knows how much it has left.
    assertSheetPresent()
    setViewport(PHONE)
    const wrapper = await mountCoaches(withChemistry(-64))
    const rows = wrapper.findAll('.cm-row')
    expect(rows.length, 'the whole board, not one card').toBe(16)

    for (const row of rows) {
      const right = row.find('.cm-right').element
      const room = availableWidth(right, PHONE)
      const ring = px(getComputedStyle(row.find('.cm-chem .tb-ring').element).width, 'the gauge width')
      const mark = px(getComputedStyle(row.find('.cm-chem-mark').element).width, 'the mark width')
      expect(mark, 'the mark is narrower than the circle it marks, so the corner keeps its width').toBeLessThan(ring)

      const rowCs = getComputedStyle(row.element)
      const floor = px(rowCs.minHeight, '.cm-row min-height')
      const pad = px(rowCs.paddingTop, 'padding-top') + px(rowCs.paddingBottom, 'padding-bottom')
      const stacked = boxOf(row.find('.cm-money').element, room).h + boxOf(row.find('.cm-chem').element, room).h
      expect(floor, 'round 42 #3\'s floor is still what it was').toBe(row.classes('current') ? 196 : 168)
      expect(
        stacked,
        `${row.find('.cm-name').text()}: the right column stacks ${stacked.toFixed(0)}px into the ` +
          `${(floor - pad).toFixed(0)}px the card already has – ${(floor - pad - stacked).toFixed(0)}px of headroom left`,
      ).toBeLessThanOrEqual(floor - pad)
    }
    wrapper.unmount()
  })
})
