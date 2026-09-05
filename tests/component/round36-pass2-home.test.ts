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
import { readFileSync } from 'node:fs'
import '../../src/style.css'
import App from '../../src/App.vue'
import SplashScreen from '../../src/components/SplashScreen.vue'
import { useGameStore } from '../../src/stores/game'
import { careerSnapshot } from '../helpers/career'
import { LADDER_LABEL } from '../../src/shared/protocol'
import { rankLabel } from '../../src/shared/format'
import { weekDateLine, weekSpan, weekYearLabel } from '../../src/shared/dates'
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

function text(selector: string): string {
  const el = document.querySelector(selector)
  if (!el) throw new Error(`nothing matches ${selector} – the assertion below would be vacuous`)
  return (el.textContent ?? '').replace(/\s+/g, ' ').trim()
}

/** ⚠ THE PATH IS A PLAIN VARIABLE AND NEVER AN INLINE LITERAL – Vite rewrites
 *  `new URL('…', import.meta.url)` into its own asset resolver and the result is not a `file:` URL
 *  under this runner. Same helper, same reason, as the sibling round-36 files. */
function sfc(rel: string): string {
  return readFileSync(new URL(rel, import.meta.url), 'utf8')
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

/** The shell, at one width, on a screen that is NOT Home – which is the whole of P2-6. */
async function screenAt(
  vp: { width: number; height: number },
  tab: string,
  snapshot?: Snapshot,
): Promise<Snapshot> {
  const snap = await homeAt(vp, snapshot)
  const button = document.querySelector<HTMLElement>(`nav.tab-bar .tab-btn[data-tour="tab-${tab}"]`)
  if (!button) throw new Error(`no ${tab} tab in the rail – the walk below would measure Home`)
  button.click()
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

// =================================================================================================
// P2-4 – THE BELL, THE LETTER AND THE GEAR GO BACK ON THE PHOTOGRAPH
// =================================================================================================
//
// ⚠ MUTATION-VERIFIED: restoring D74's `.diary-head > .diary-tools { display: none }` inside the
// 1024 block reddens the desktop arm with `none`.

describe('round 36 second pass, P2-4 – the three tools are on the picture at every width', () => {
  it('⭐⭐ all three are inside the header row on the photograph, on a phone and on a desktop', async () => {
    for (const vp of [PHONE, TABLET, DESKTOP]) {
      await homeAt(vp)
      const all = [...document.querySelectorAll('button.diary-tool')]
      expect(all.length, `there are not three tools at ${vp.width}`).toBe(3)
      expect(
        all.every((b) => b.closest('.diary-head') !== null),
        `a tool is drawn off the photograph at ${vp.width}`,
      ).toBe(true)
      expect(css('.diary-head > .diary-tools').display, `the row is hidden at ${vp.width}`).toBe('flex')
      wrapper?.unmount()
      wrapper = null
      document.body.innerHTML = ''
    }
  })

  it('⭐ D74’s second copy is GONE, and so is the 34px band it hung in', async () => {
    await homeAt(DESKTOP)
    expect(has('.diary-tools-page'), 'the page copy is still being drawn').toBe(false)
    expect(css('.tb-screen-body').paddingTop, 'the band above the two columns is still open').not.toBe(
      '34px',
    )
  })
})

// =================================================================================================
// P2-6 – HER FACE, THE WEEK AND HER RANK ARE PERMANENT CHROME ON THE DESKTOP
// =================================================================================================
//
// ⚠ MUTATION-VERIFIED: putting the block back behind HomeScreen's `<Teleport>` reddens the
// «on a screen that is not Home» arm by finding no avatar in the rail on Stats.

describe('round 36 second pass, P2-6 – the identity block lives on every page', () => {
  it('⭐⭐⭐ it is drawn on a screen that is NOT Home, inside the one navigation the app has', async () => {
    await screenAt(DESKTOP, 'stats', rankedCareer('r36-pass2-stats'))
    expect(has('.diary-hero'), 'the walk never left Home, so this proves nothing about the rail').toBe(
      false,
    )
    const block = document.querySelector('#app > nav.tab-bar > .rail-id')
    expect(block, 'the identity block is not a child of the navigation').toBeTruthy()
    expect(
      block!.querySelector('button[aria-label="Open her profile"]'),
      'her face is not on a page that is not Home',
    ).toBeTruthy()
    expect(
      block!.querySelector('button[aria-label="How ranking points work"]'),
      'her rank is not on a page that is not Home',
    ).toBeTruthy()
    // «над всеми пунктами» – and it has to beat the Home tab's own `order: -1` (review #8).
    expect(getComputedStyle(block!).order, 'the block is not above the menu items').toBe('-2')
  })

  it('⚠ …and on a phone that same page draws none of it, so the bottom bar is unchanged', async () => {
    await screenAt(PHONE, 'stats', rankedCareer('r36-pass2-stats-phone'))
    expect(has('#app > nav.tab-bar > .rail-id'), 'the block is in the DOM at every width').toBe(true)
    expect(css('#app > nav.tab-bar > .rail-id').display, 'the bottom bar grew a face').toBe('none')
  })

  it('⭐⭐⭐ NOT ONE FIGURE IS DERIVED IN THE SHELL – the chip is the snapshot’s own two fields', async () => {
    const snap = rankedCareer('r36-pass2-derive')
    await screenAt(DESKTOP, 'stats', snap)
    // ⚠⚠ REBUILT FROM THE SNAPSHOT'S OWN FIELDS, never read back off Home – the sibling file's
    // hard-won rule: comparing two renders of one computed is a SHARING claim and stays green on any
    // arithmetic at all. This says what the chip must SAY.
    const ladder = snap.ladders[snap.activeLadder]
    expect(text('.rail-id-rank .rank-ladder'), 'the chip names the wrong table').toBe(
      LADDER_LABEL[snap.activeLadder],
    )
    expect(
      text('.rail-id-rank').startsWith(LADDER_LABEL[snap.activeLadder]),
      'the chip does not lead with the table it is reading',
    ).toBe(true)
    expect(
      text('.rail-id-rank'),
      'the rail is showing a rank the engine did not give it',
    ).toContain(rankLabel(ladder.rank ?? 0, ladder.rank !== null))
  })

  it('⭐⭐ …and there is ONE owner of that arithmetic, which is the whole reason this is a composable', () => {
    // ⚠ A SOURCE PIN, DELIBERATELY, AND IT IS THE ONE CLAIM A MOUNTED TEST CANNOT MAKE. Two
    // components rendering the same string prove SHARING only if there is one computation; two
    // copies of the sum would render the same string too, right up to the day one of them was
    // edited. So the negative is asserted where it lives: neither surface calls the ladder
    // arithmetic itself, and both read the one module that does.
    const home = sfc('../../src/components/screens/HomeScreen.vue')
    const rail = sfc('../../src/components/RailIdentity.vue')
    for (const [name, src] of [
      ['HomeScreen.vue', home],
      ['RailIdentity.vue', rail],
    ] as const) {
      expect(src, `${name} does not read the identity composable`).toContain(
        "composables/kidIdentity'",
      )
      expect(src, `${name} computes the rank chip's track itself`).not.toContain('rankChipTrack(')
      expect(src, `${name} reaches for the ladder table itself`).not.toContain('snapshot?.ladders')
    }
    // …and the module that DOES own it is the one both of them name.
    const owner = sfc('../../src/composables/kidIdentity.ts')
    expect(owner, 'the composable does not own the chip’s track').toContain('rankChipTrack(game.snapshot)')
    expect(owner, 'the composable does not own the movement since last week').toContain('prevRank')
  })
})
// =================================================================================================
// P2-3 – THE WHOLE DATE, TWO LINES, BESIDE THE ROUND AVATAR
// =================================================================================================
//
// ⚠ MUTATION-VERIFIED: dropping `.rail-id-date` from RailIdentity.vue reddens the first arm with
// «nothing matches»; removing the clip from `.diary-head > .diary-date` reddens the third.

describe('round 36 second pass, P2-3 – the week moves to the rail, on two lines', () => {
  it('⭐⭐⭐ the two lines are shared/dates.ts’s own two halves, and no separator is invented', async () => {
    const snap = await homeAt(DESKTOP)
    expect(text('.rail-id-week'), 'the first line is not the week label').toBe(weekYearLabel(snap.week))
    expect(text('.rail-id-range'), 'the second line is not the week’s days').toBe(weekSpan(snap.week))
    // ⭐ AND THE TWO ARE THE PHOTOGRAPH'S OWN HEADING, TAKEN APART. `weekDateLine` joins exactly
    // these two with « · », so the rail prints no string this app did not already print – which is
    // the one constraint this item had (invariant 4: no new player-facing copy).
    expect(
      weekDateLine(snap.week),
      'the rail’s two lines are not the heading’s two halves, so a string was invented',
    ).toBe(`${text('.rail-id-week')} · ${text('.rail-id-range')}`)
    // Two ELEMENTS, not a wrap: «в 2 строки» has to hold for a short week label as well as a long one.
    expect(
      document.querySelectorAll('.rail-id-date > span').length,
      'the date is not two lines',
    ).toBe(2)
  })

  it('⭐⭐ …and it stands to the RIGHT of the round avatar, in a row of its own', async () => {
    await homeAt(DESKTOP)
    expect(css('.rail-id-head').display, 'her face and the week are still stacked').toBe('flex')
    const head = document.querySelector('.rail-id-head')!
    const kids = [...head.children].map((el) => el.className.split(/\s+/)[0])
    expect(kids, 'the week is not beside her face, in that order').toEqual([
      'diary-avatar-btn',
      'rail-id-date',
    ])
  })

  it('⚠ the photograph keeps the page’s HEADING – it is clipped past 1024, never removed', async () => {
    await homeAt(DESKTOP)
    const date = document.querySelector('.diary-head > .diary-date')
    expect(date, 'Home lost its level-1 heading on the desktop').toBeTruthy()
    expect(date!.getAttribute('role'), 'the heading stopped being a heading').toBe('heading')
    expect(date!.getAttribute('aria-level'), 'the heading changed level').toBe('1')
    const cs = css('.diary-head > .diary-date')
    expect(cs.display, 'the heading was removed instead of clipped – D10’s node would go with it').not.toBe(
      'none',
    )
    expect(cs.clipPath, 'the date’s ink is still on the photograph').toBe('inset(50%)')
  })

  it('⚠ …and on a phone and a tablet the date has not moved at all', async () => {
    const snap = await homeAt(PHONE)
    expect(text('.diary-head > .diary-date'), 'the phone’s date line changed').toBe(weekDateLine(snap.week))
    expect(css('.diary-head > .diary-date').clipPath, 'the phone’s date is clipped').not.toBe('inset(50%)')
    expect(css('#app > nav.tab-bar > .rail-id').display, 'the bottom bar grew a date').toBe('none')
    await homeAt(TABLET)
    expect(css('.diary-head > .diary-date').clipPath, 'the tablet’s date is clipped').not.toBe('inset(50%)')
    expect(css('#app > nav.tab-bar > .rail-id').display, 'the tablet grew a rail').toBe('none')
  })
})

