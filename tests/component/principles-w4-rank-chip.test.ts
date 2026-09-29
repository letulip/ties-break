// ⭐⭐ E-03 / T4.6 – THE RANK CHIP DESCRIBES ITSELF, ON BOTH OF THE SURFACES THAT DRAW IT.
//
// THE DEFECT, STATED (docs/review-principles-2026-09-26/05-ui.md, E-03). Both chips print her
// ladder, her rank and her movement, and both carry a static `aria-label="How ranking points work"`.
// An `aria-label` WINS over name-from-content in the accessible-name algorithm, so the number the
// Home hero exists to show was not in the button's accessible name at all: a screen reader was told
// the control's purpose and never told her rank. `e2e/week-advance.spec.ts:145` shows both halves at
// once – it finds the button BY that name and then asserts its visible text contains `#`.
//
// THE FIX IS THE FINDING'S OWN AND ADDS NO WORD: the label stays (invariant 4 – the copy is the
// owner's, and moving the rank INTO the name would be his call), and the chip's own two visible spans
// are handed over as the button's DESCRIPTION. It is the shape D15 already used for the header's two
// unread dots one block up on the same screen: a fact that arrives is a description, never part of
// the name.
//
// ⚠ THE TEST RESOLVES THE DESCRIPTION RATHER THAN PINNING THE ATTRIBUTE. An `aria-describedby` that
// names ids nothing answers to is worse than none – it reads as a fix in the diff and is silence in
// the browser – so every id in the attribute is looked up in the rendered document and the text that
// comes back is compared with the chip's own rendered spans. A literal id list asserted as a string
// would pass on exactly that broken build.
//
// ⚠ MUTATION ARMS, each applied alone, both RED before this file was believed (the outputs are in
// the wave's report):
//   * DROP ONE LINK – `aria-describedby="diary-rank-ladder"` (the rank's own id removed from the
//     list) → Home's case reddens on the rank text missing from the resolved description;
//   * SHARE THE IDS – the rail's spans given Home's ids → the uniqueness case reddens, because at
//     1024 BOTH chips are in the document (Home's is `display: none`, not absent) and one id would
//     then answer for two elements.
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import '../../src/style.css'
import HomeScreen from '../../src/components/screens/HomeScreen.vue'
import RailIdentity from '../../src/components/RailIdentity.vue'
import { useGameStore } from '../../src/stores/game'
import { careerSnapshot } from '../helpers/career'
import type { Snapshot } from '../../src/shared/protocol'
import { DESKTOP, PHONE, setViewport } from './fits'

// ⚠ THIS RUNNER HAS NO localStorage AND HOME READS IT AT SETUP – the same shim and the same argument
// as tests/component/round36-error-surfaces.test.ts, quoted there in full.
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

/** A career whose rank chip is DRAWN. `rankChipTrack` returns null until a counting result lands
 *  somewhere, and a chip that is not on the page would make every assertion below vacuous – the
 *  «four empty sets are equal» failure this repo keeps writing down. The rank is set on the
 *  SNAPSHOT, which is a plain transport object; nothing about how a rank is COMPUTED is claimed. */
function rankedCareer(seed: string): Snapshot {
  const snap = careerSnapshot(60, seed)
  const ladder = snap.ladders[snap.activeLadder]
  if (ladder.rank === null) ladder.rank = 96
  return snap
}

/** The accessible NAME, by the first two steps of the real algorithm – `aria-label` first, then
 *  `aria-labelledby`, then name-from-content. The same helper a11y-sweep.test.ts carries. */
function accName(el: Element): string {
  const label = el.getAttribute('aria-label')
  if (label !== null) return label
  const ids = el.getAttribute('aria-labelledby')
  if (ids !== null) {
    return ids
      .split(/\s+/)
      .map((id) => document.getElementById(id)?.textContent?.trim() ?? '')
      .join(' ')
  }
  return el.textContent?.trim() ?? ''
}

/** The accessible DESCRIPTION, resolved out of the document the way a screen reader resolves it.
 *  ⚠ IT THROWS ON AN ID NOTHING ANSWERS TO rather than skipping it. A browser skips it silently,
 *  which is precisely the failure this file is guarding: a described-by that describes nothing. */
function accDescription(el: Element): string {
  const ids = el.getAttribute('aria-describedby')
  if (ids === null) throw new Error('the control carries no aria-describedby at all')
  return ids
    .split(/\s+/)
    .map((id) => {
      const target = document.getElementById(id)
      if (target === null) throw new Error(`aria-describedby names #${id}, and nothing in the document answers to it`)
      return target.textContent?.trim() ?? ''
    })
    .join(' ')
}

let wrappers: VueWrapper[] = []

function track<T extends VueWrapper>(w: T): T {
  wrappers.push(w)
  return w
}

beforeEach(() => {
  setActivePinia(createPinia())
  backing.clear()
  document.body.innerHTML = ''
  if (!document.head.querySelector('style')) {
    throw new Error('no stylesheet in the document – the component project needs `css: true`')
  }
})

afterEach(() => {
  for (const w of wrappers) w.unmount()
  wrappers = []
  document.body.innerHTML = ''
})

describe('E-03 – the rank chip keeps its name and gains her rank as its description', () => {
  it('⭐⭐ Home: the name is still the owner\'s sentence, and the DESCRIPTION is the rank on the chip', () => {
    setViewport(PHONE)
    useGameStore().snapshot = rankedCareer('e03-home')
    const wrapper = track(mount(HomeScreen, { props: { recapFresh: false }, attachTo: document.body, global: { stubs: { teleport: true } } }))

    const chip = wrapper.find('.diary-id > .diary-rank')
    expect(chip.exists(), 'this fixture must actually draw the chip, or every arm below is vacuous').toBe(true)

    // THE NAME IS UNTOUCHED – invariant 4, and the two e2e anchors find the button by it.
    expect(accName(chip.element), 'the owner\'s label moved').toBe('How ranking points work')

    // ...AND THE DEFECT, AS THE ASSERTION: the rank is now reachable, as the description.
    const rank = wrapper.find('#diary-rank-value').text()
    const ladder = wrapper.find('#diary-rank-ladder').text()
    expect(rank.length, 'the chip renders no rank text at all').toBeGreaterThan(0)
    const described = accDescription(chip.element)
    expect(described, 'the rank the chip exists to show is not in its description').toContain(rank)
    expect(described, 'the table the rank belongs to is not in its description').toContain(ladder)

    // ...and the description is the chip's OWN spans rather than a second copy of them, which is what
    // keeps this free of new wording: every word of the description is already on the screen.
    expect(chip.text()).toContain(rank)
    expect(chip.text()).toContain(ladder)
  })

  it('⭐⭐ the rail: the same fix, on the copy that is drawn on all ten screens', () => {
    setViewport(DESKTOP)
    useGameStore().snapshot = rankedCareer('e03-rail')
    const wrapper = track(mount(RailIdentity, { attachTo: document.body }))

    const chip = wrapper.find('.diary-rank.rail-id-rank')
    expect(chip.exists(), 'the rail draws no chip on this fixture').toBe(true)
    expect(accName(chip.element), 'the rail\'s label moved').toBe('How ranking points work')

    const rank = wrapper.find('#rail-rank-value').text()
    expect(rank.length).toBeGreaterThan(0)
    expect(accDescription(chip.element), 'the rail chip describes something other than itself').toContain(rank)
  })

  it('⚠⚠ and the two chips do not fight over one id, because both are in the document at 1024', () => {
    // P2-6 draws her rank TWICE from 1024: the rail's copy is the live one and Home's is still in the
    // DOM, hidden by `.diary-id > .diary-rank` in HomeScreen's own scoped block. A shared id would
    // therefore be duplicated on every desktop Home, and `getElementById` would hand the screen
    // reader whichever one came first.
    setViewport(DESKTOP)
    useGameStore().snapshot = rankedCareer('e03-both')
    track(mount(HomeScreen, { props: { recapFresh: false }, attachTo: document.body, global: { stubs: { teleport: true } } }))
    track(mount(RailIdentity, { attachTo: document.body }))

    expect(document.querySelectorAll('.diary-rank').length, 'both renders of the chip are in the document').toBe(2)
    for (const id of ['diary-rank-ladder', 'diary-rank-value', 'rail-rank-ladder', 'rail-rank-value']) {
      expect(document.querySelectorAll(`#${id}`).length, `#${id} answers for more than one element`).toBe(1)
    }
    // ...and each chip's description resolves to ITS OWN spans, which is the property the ids exist
    // for: they are looked up in the whole document, not inside the button.
    for (const chip of document.querySelectorAll('.diary-rank')) {
      const described = accDescription(chip)
      expect(described.length, 'a chip describes nothing').toBeGreaterThan(0)
      expect(chip.textContent, 'a chip is described by the OTHER chip\'s spans').toContain(described.split(' ').pop()!)
    }
  })
})
