// ⭐⭐⭐ ROUND 36, THE SECOND PASS FROM HIS STAND – P2-2, P2-3, P2-4 AND P2-6, MOUNTED.
//
// Four items he reported on 05.09.2026 after playing the built review wave. His own words for each
// are in `docs/rounds/round-36-review.md` and beside the rules themselves; nothing here restates a
// sentence of his in Cyrillic, because the words live once, in the document that is his.
//
// ⚠ WHAT THIS LAYER CAN AND CANNOT SAY, and the split matters more for these four than usual.
// happy-dom parses CSS and does no layout, so every number here is a DECLARED value read through the
// real cascade at a real viewport – the right instrument for «is this rule on at this width», and
// the wrong one for «is this box 380.5px wide». P2-2 is a claim about BOXES, so its pixels are
// measured in a real Chromium (`e2e/responsive.spec.ts`, «Home's rows below the photograph are one
// grid») and what is measured here is the rule that produces them.
//
// ⚠ THE ORDER IS ALWAYS `setViewport` -> mount -> read. happy-dom evaluates a media query on an
// element's FIRST computed-style read and caches it, so a width set after the mount reads the
// previous test's screen – written down beside `TABLET` in fits.ts, and paid for once already.
//
// ⚠ AND THE SHELL IS MOUNTED INTO A REAL `#app`, because every rail rule is keyed on
// `#app:has(> nav.tab-bar)`. Carried from round36-review-home.test.ts, where it is argued in full.
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mount, flushPromises, type VueWrapper } from '@vue/test-utils'
import { nextTick } from 'vue'
import { createPinia, setActivePinia } from 'pinia'
import '../../src/style.css'
import App from '../../src/App.vue'
import SplashScreen from '../../src/components/SplashScreen.vue'
import { useGameStore } from '../../src/stores/game'
import { careerSnapshot } from '../helpers/career'
import { resetKidHintForTests } from '../../src/composables/kidIdentity'
import type { Snapshot } from '../../src/shared/protocol'
import { DESKTOP, PHONE, TABLET, setViewport } from './fits'

const backing = new Map<string, string>()
Object.defineProperty(globalThis, 'localStorage', {
  configurable: true,
  value: {
    getItem: (k: string) => (backing.has(k) ? backing.get(k)! : null),
    setItem: (k: string, v: string) => void backing.set(k, String(v)),
    removeItem: (k: string) => void backing.delete(k),
    clear: () => backing.clear(),
    key: (i: number) => [...backing.keys()][i] ?? null,
    get length() {
      return backing.size
    },
  },
})

/** ⚠ SIXTY WEEKS AND NOT SIX. The rank chip is drawn only once something COUNTS somewhere
 *  (`rankChipTrack` returns null before that), so a short career measures a rail whose chip was
 *  never rendered – a null arm that looks like a null result. */
const CAREER_WEEKS = 60
const CAREER_SEED = 'r36-pass2-home'

function assertSheetPresent(): void {
  if (!document.head.querySelector('style')) {
    throw new Error('no stylesheet in the document – the component project needs `css: true`')
  }
}

async function mountShell(snapshot: Snapshot): Promise<VueWrapper> {
  const store = useGameStore()
  const wrapper = mount(App, { attachTo: document.body })
  await flushPromises()
  store.snapshot = snapshot
  store.ready = true
  store.phase = 'ready'
  await nextTick()
  wrapper.findComponent(SplashScreen).vm.$emit('done')
  await nextTick()
  const bar = wrapper.find('nav.tab-bar')
  if (!bar.exists()) throw new Error('the shell drew no navigation – there is no frame to name')
  const container = bar.element.parentElement
  if (!container) throw new Error('the bar has no parent – #app cannot be named')
  container.id = 'app'
  await nextTick()
  return wrapper
}

/** …and a career whose rank chip is DRAWN. `rankChipTrack` returns null until a counting result
 *  lands somewhere. The rank is set on the SNAPSHOT (a plain transport object), which claims nothing
 *  about how a rank is COMPUTED – it only makes the chip exist so a measurement of it is not
 *  vacuous. */
function rankedCareer(seed: string): Snapshot {
  const snap = careerSnapshot(CAREER_WEEKS, seed)
  const ladder = snap.ladders[snap.activeLadder]
  if (ladder.rank === null) ladder.rank = 96
  return snap
}

function css(selector: string): CSSStyleDeclaration {
  const el = document.querySelector(selector)
  if (!el) throw new Error(`nothing matches ${selector} – the measurement below would be vacuous`)
  return getComputedStyle(el)
}

function has(selector: string): boolean {
  return document.querySelector(selector) !== null
}

let wrapper: VueWrapper | null = null

beforeEach(() => {
  setActivePinia(createPinia())
  backing.clear()
  resetKidHintForTests()
  assertSheetPresent()
})

afterEach(() => {
  wrapper?.unmount()
  wrapper = null
  document.body.innerHTML = ''
})

async function homeAt(vp: { width: number; height: number }, snapshot?: Snapshot): Promise<Snapshot> {
  const snap = snapshot ?? rankedCareer(CAREER_SEED)
  setViewport(vp)
  wrapper = await mountShell(snap)
  await nextTick()
  return snap
}

// =================================================================================================
// P2-2 – EVERY ROW BELOW THE PHOTOGRAPH IS ONE GRID
// =================================================================================================
//
// «сетка на главной на десктоп не исправлена (см. мои правки предыдущие, мне нужно продублировать
// или нашел?)» – found. Review #5 was read as ONE row (the coach note and the recent memory) and he
// meant every row under the hero, so the season ladder and the news feed take the same wrapper.
//
// ⚠ MUTATION-VERIFIED: taking `.strip-pair` out of the 1024 rule reddens the desktop arm with
// `display: block`; taking it out of the `display: contents` rule reddens the phone arm the same
// way, which is the identity contract's side of it.

describe('round 36 second pass, P2-2 – Home’s two lower rows share one grid', () => {
  it('⭐ below 1024 the wrapper has NO BOX, so not one phone or tablet pixel moves', async () => {
    await homeAt(PHONE)
    expect(css('.strip-pair').display, 'the wrapper generates a box on a phone').toBe('contents')
    await homeAt(TABLET)
    expect(css('.strip-pair').display, 'the wrapper generates a box on a tablet').toBe('contents')
  })

  it('⭐⭐⭐ …and from 1024 it is THE SAME grid the row above it is, declaration for declaration', async () => {
    await homeAt(DESKTOP)
    const pair = css('.card-pair')
    const strips = css('.strip-pair')
    expect(strips.display, 'the season ladder and the news feed are not a grid of their own').toBe('grid')
    // ⭐ THE CLAIM HE IS ACTUALLY MAKING: one grid, so one gutter. Two rules that merely LOOK alike
    // are two rules that can drift apart by a pixel, and a gutter 11px off the one above it is
    // exactly the defect he is reporting – so the three declarations are compared to the row above
    // rather than to literals of their own.
    expect(strips.gridColumn, 'the lower row does not span the page').toBe(pair.gridColumn)
    expect(strips.gridTemplateColumns, 'the two rows have different tracks').toBe(pair.gridTemplateColumns)
    expect(strips.gap, 'the two rows have different gutters').toBe(pair.gap)
    // …and the tracks really are equal, which is his own word for this block.
    expect(pair.gridTemplateColumns).toBe('minmax(0, 1fr) minmax(0, 1fr)')
    expect(pair.gridColumn).toBe('1 / -1')
  })

  it('⚠ the hero’s row keeps its OWN asymmetric tracks – #4 is his number and is not touched', async () => {
    await homeAt(DESKTOP)
    // ⚠ READ AS RESOLVED VALUES – happy-dom substitutes `var(--hero-max)` before this is read, so
    // the assertion is about the SHAPE (a cap on the photograph's track, his own 310 floor on the
    // cards') and about it being DIFFERENT from the equal pair the two rows below use.
    const page = css('.tb-screen-body').gridTemplateColumns
    expect(page, 'his 310px floor left the cards’ column').toContain('minmax(310px, 1fr)')
    expect(
      page,
      'the hero’s row took the lower rows’ equal tracks – review #4 is his own measurement of it',
    ).not.toBe(css('.card-pair').gridTemplateColumns)
  })
})
