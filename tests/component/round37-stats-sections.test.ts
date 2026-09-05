// ROUND 37 #4 – THE STATS SCREEN'S OWN SECTION STRIP, MOUNTED.
//
// The owner, 05.09.2026: «На экране stats для всех интерфейсов добавить под первой плашкой STATS
// полосу с переключателем по разделам seasons/ranking/results для каждой категории турниров для
// удобной навигации на странице».
//
// ⚠ WHY MOUNTED AND NOT PINNED. Every claim here is about what a reader can REACH: that an entry
// lands on an element that exists, that it is called what the heading it lands on is called, that
// the strip says where the reader is. A source pin reading "the file contains stats-ranking" would
// have passed on the day round 36's bell scrolled to an id only one screen had - which is the exact
// defect CLAUDE.md's gotcha and this round's brief both name. So every test below presses the real
// control on a real career and follows it to the element it moved to.
//
// ⚠⚠ THE ANTI-VACUITY ARM IS THE POINT OF THE COUNTS. A strip that rendered zero entries would
// satisfy "no dead entry offered" perfectly, so no test here is allowed to pass on an empty strip:
// `entryNames` is asserted to be the exact list, the heading comparison walks every entry, and the
// two degenerate careers assert what is STILL there as loudly as what is gone.
//
// ⚠ MUTATION-VERIFIED. Every `it` below was watched failing before it was believed - the runs are
// quoted in the wave report:
//   * the whole strip absent (the component as it stood at 62f6bf22, before this item) -> ALL
//     FOURTEEN go red: `the strip must be on the screen: expected false to be true`,
//     `a strip with no entries proves nothing: expected +0 to be 3`, and
//     `#stats-seasons must be on the page before its box can be faked: expected null to be truthy`.
//   * `sections` hard-coded to all three entries whatever the career -> exactly the two dead-entry
//     tests go red, and nothing else: `expected [ 'Season by season', ...(2) ] to deeply equal
//     [ 'Season by season', ...(1) ]` on the emptied window, `expected true to be false` on the
//     archive's strip that should not be drawn at all.
//   * the `:aria-current` binding dropped -> the three currency tests go red together
//     (`expected [] to deeply equal [ 'Season by season=location' ]`,
//     `[ 'Counting results=location' ]`, `[ 'Professional ranking=location' ]`) while the other
//     eleven stay green - which is why the announcement is three tests and not one.
//   * `goToSection`'s `scrollIntoView` call removed -> only the landing test goes red:
//     `entry "Season by season" scrolled to nothing: expected null to be truthy`.
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { nextTick } from 'vue'
import { mount, type VueWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import StatsScreen from '../../src/components/screens/StatsScreen.vue'
import { useGameStore } from '../../src/stores/game'
import { toSnapshot, type WorldState } from '../../src/engine/world'
import { migrateSave } from '../../src/engine/migrations'
import { TIERS } from '../../src/engine/season/calendar'
import { LADDER_LABEL, LADDER_TRACKS, type Snapshot } from '../../src/shared/protocol'
import { setViewport, type Viewport } from './fits'

/** The v46 golden save, migrated and snapshotted - a REAL career (the migration's own output),
 *  the same fixture season-by-table.test.ts stands on. Measured on it: she is 16, her active table
 *  is the professional one, and all three tables hold counting results - so the screen's three
 *  sections are all drawn and the strip's full form is what a fresh mount shows. */
function goldenSnapshot(): Snapshot {
  const world = migrateSave(
    JSON.parse(readFileSync(resolve(process.cwd(), 'tests/fixtures/saves/v46.json'), 'utf8')),
  ) as WorldState
  return toSnapshot(world)
}

/** ⚠ ATTACHED TO THE DOCUMENT, DELIBERATELY. The strip finds its landing points with
 *  `document.getElementById`, which is exactly the call that cannot lie about whether an element is
 *  really on the page - and it can only be exercised honestly if the mount is in the document. */
const live: { wrapper: VueWrapper; host: HTMLElement }[] = []
function mountStats(snapshot: Snapshot): VueWrapper {
  const store = useGameStore()
  store.snapshot = snapshot
  const host = document.createElement('div')
  document.body.appendChild(host)
  const wrapper = mount(StatsScreen, { attachTo: host, global: { stubs: { teleport: true } } })
  live.push({ wrapper, host })
  return wrapper
}

/** WHERE A PRESS ACTUALLY SENT THE READER. Recorded off the prototype rather than off one element,
 *  so the test never has to name the id it expects - the control names it, and the test follows. */
let scrolledTo: Element | null = null
let scrolledWith: ScrollIntoViewOptions | undefined
const realScrollIntoView = Element.prototype.scrollIntoView

beforeEach(() => {
  setActivePinia(createPinia())
  scrolledTo = null
  scrolledWith = undefined
  Element.prototype.scrollIntoView = function (this: Element, opts?: boolean | ScrollIntoViewOptions) {
    scrolledTo = this
    scrolledWith = typeof opts === 'object' ? opts : undefined
  }
})

afterEach(() => {
  Element.prototype.scrollIntoView = realScrollIntoView
  // Unmounted between tests because the strip's whole contract is stated in ids, and two screens in
  // one document would make `getElementById` answer about the wrong one.
  for (const m of live.splice(0)) {
    m.wrapper.unmount()
    m.host.remove()
  }
})

/** The strip, by the contract a screen reader gets: a NAMED group of real buttons. Nothing here
 *  reaches for a class - the name is what a reader has, so it is what the test has. */
function stripOf(wrapper: VueWrapper) {
  return wrapper.find('[role="group"][aria-label="Stats"]')
}
function entriesOf(wrapper: VueWrapper) {
  const strip = stripOf(wrapper)
  return strip.exists() ? strip.findAll('button') : []
}
function entryNames(wrapper: VueWrapper): string[] {
  return entriesOf(wrapper).map((b) => b.text().trim())
}
/** The heading of whatever section a press landed on. */
function headingOfLanding(): string | undefined {
  return scrolledTo?.querySelector('h2')?.textContent?.trim()
}
/** Press one of the three ladder pills - the screen's own tournament-category picker. */
async function showTrack(wrapper: VueWrapper, label: string): Promise<void> {
  const pill = wrapper
    .find('[role="group"][aria-label="Which ranking table"]')
    .findAll('button')
    .find((b) => b.text().trim() === label)
  expect(pill, `the ${label} pill must exist`).toBeTruthy()
  await pill!.trigger('click')
}

const J_MAX_AGE = TIERS.j30.maxAgeYears!

describe('R37-4 - the strip is under the STATS plate and reaches every section on the page', () => {
  it('it carries one entry per section, in the order the page draws them', () => {
    const wrapper = mountStats(goldenSnapshot())
    expect(stripOf(wrapper).exists(), 'the strip must be on the screen').toBe(true)
    // ⚠ THE EXACT LIST, not "at least one": an empty strip would satisfy every other claim here.
    expect(entryNames(wrapper)).toEqual(['Season by season', 'Professional ranking', 'Counting results'])
  })

  it('⚠ it sits UNDER the first plate and ABOVE the sections it points at', () => {
    const wrapper = mountStats(goldenSnapshot())
    const strip = stripOf(wrapper).element
    const statsHeading = wrapper.findAll('h2').find((h) => h.text().trim() === 'Stats')!
    const seasons = document.getElementById('stats-seasons')!
    expect(statsHeading, 'the first plate must still be the Stats plate').toBeTruthy()
    expect(seasons, 'the first section it points at must exist').toBeTruthy()
    // DOCUMENT_POSITION_FOLLOWING = the argument comes after the node the call is made on.
    expect(statsHeading.element.compareDocumentPosition(strip) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(strip.compareDocumentPosition(seasons) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })

  it('⚠⚠ each entry takes the reader to its own section, and says what that section\'s heading says', async () => {
    const wrapper = mountStats(goldenSnapshot())
    const names = entryNames(wrapper)
    expect(names.length, 'a strip with no entries proves nothing').toBe(3)
    for (const [i, name] of names.entries()) {
      scrolledTo = null
      await entriesOf(wrapper)[i].trigger('click')
      // The landing point is a REAL element of this document - the round-36 bell's defect, refused.
      expect(scrolledTo, `entry "${name}" scrolled to nothing`).toBeTruthy()
      expect(document.contains(scrolledTo), `entry "${name}" scrolled outside the document`).toBe(true)
      // ...and the entry is called what the heading it lands on is called, word for word. This is
      // the pin that stops a fourth spelling of `seasons`, `ranking` or `results` appearing later.
      expect(headingOfLanding(), `entry "${name}" and its section disagree`).toBe(name)
    }
    expect(scrolledWith, 'it lands at the TOP of the section, not somewhere inside it').toMatchObject({
      block: 'start',
    })
  })
})

describe('R37-4 - «для всех интерфейсов»: the strip is on all four widths', () => {
  // ⚠ HIS «для всех интерфейсов» AS A MEASUREMENT, at the four widths e2e/parity.spec.ts walks.
  // happy-dom has no layout engine, so what this can prove is that NOTHING in the screen makes the
  // strip conditional on the viewport - the mount is fresh at each width (fits.ts: a media query is
  // evaluated on an element's first computed-style read and then cached, so the order is always
  // setViewport, then mount). The browser half - that it has a box and is in the accessibility tree
  // at each of them - is e2e/parity.spec.ts's, and it fails by name if a control appears at one
  // width and not another.
  const WIDTHS: Viewport[] = [
    { width: 375, height: 900 },
    { width: 768, height: 900 },
    { width: 900, height: 900 },
    { width: 1280, height: 900 },
  ]

  for (const vp of WIDTHS) {
    it(`the whole strip is there at ${vp.width}`, () => {
      setViewport(vp)
      const wrapper = mountStats(goldenSnapshot())
      expect(entryNames(wrapper)).toEqual(['Season by season', 'Professional ranking', 'Counting results'])
    })
  }
})

describe('R37-4 - it says which section the reader is in', () => {
  const currentOf = (wrapper: VueWrapper): string[] =>
    entriesOf(wrapper)
      .filter((b) => b.attributes('aria-current') !== undefined)
      .map((b) => `${b.text().trim()}=${b.attributes('aria-current')}`)

  it('the first section is current on arrival - a screen opens at its top', () => {
    const wrapper = mountStats(goldenSnapshot())
    expect(currentOf(wrapper)).toEqual(['Season by season=location'])
  })

  it('⚠ pressing an entry makes it the current one, and EXACTLY one entry is ever current', async () => {
    const wrapper = mountStats(goldenSnapshot())
    await entriesOf(wrapper)[2].trigger('click')
    expect(currentOf(wrapper)).toEqual(['Counting results=location'])
    await entriesOf(wrapper)[1].trigger('click')
    expect(currentOf(wrapper)).toEqual(['Professional ranking=location'])
  })

  it('⚠⚠ ...and it follows the reader down the page, not only the presses', async () => {
    // The honest half: a mark that only moved on a press would be STALE the moment somebody
    // scrolled, which is worse than no mark at all. happy-dom measures every box as zero, so the
    // geometry is supplied - the ranking section's top has crossed the line, the results section's
    // has not - and the real listener is woken by a real scroll event.
    const wrapper = mountStats(goldenSnapshot())
    stubTop('stats-seasons', -800)
    stubTop('stats-ranking', 100)
    stubTop('stats-results', 900)
    expect(window.innerHeight * 0.4, 'the fixture must straddle the line').toBeGreaterThan(100)
    window.dispatchEvent(new Event('scroll'))
    await nextTick()
    expect(currentOf(wrapper)).toEqual(['Professional ranking=location'])
    // ...and scrolling on past the last heading moves it again.
    stubTop('stats-results', 40)
    window.dispatchEvent(new Event('scroll'))
    await nextTick()
    expect(currentOf(wrapper)).toEqual(['Counting results=location'])
  })

  it('the strip is a named group of real buttons, all of them in the tab order', () => {
    const wrapper = mountStats(goldenSnapshot())
    // The group has a name: a row of controls with none is a row of mystery (ui/SegmentedRow.vue).
    expect(stripOf(wrapper).attributes('aria-label')).toBe('Stats')
    const entries = entriesOf(wrapper)
    expect(entries.length).toBe(3)
    for (const e of entries) {
      // A real <button>, so Tab reaches it and Enter/Space press it with no key handling of ours.
      expect(e.element.tagName).toBe('BUTTON')
      expect(e.attributes('tabindex'), 'nothing is taken out of the tab order').toBeUndefined()
      expect(e.attributes('disabled')).toBeUndefined()
      expect(e.text().trim().length, 'an entry with no name is not reachable by name').toBeGreaterThan(0)
    }
  })
})

describe('R37-4 - «для каждой категории турниров»: the entries follow the tournament category', () => {
  it('the ranking entry is renamed by the picker, and always matches its own heading', async () => {
    const wrapper = mountStats(goldenSnapshot())
    const seen: string[] = []
    for (const track of LADDER_TRACKS) {
      await showTrack(wrapper, LADDER_LABEL[track])
      const names = entryNames(wrapper)
      expect(names[1], `the ${LADDER_LABEL[track]} entry`).toBe(`${LADDER_LABEL[track]} ranking`)
      expect(document.getElementById('stats-ranking')?.querySelector('h2')?.textContent?.trim()).toBe(names[1])
      seen.push(names[1])
    }
    // All three categories printed something different - the same anti-vacuity shape season-by-table
    // uses on the table underneath.
    expect(new Set(seen).size, `the three categories printed: ${seen.join(' /// ')}`).toBe(3)
  })
})

describe('R37-4 - ⚠⚠ a section that is not on the page is never offered', () => {
  it('a table she has scored nothing in gets no results entry - and the other two stay', () => {
    const snap = goldenSnapshot()
    // Her active table with its counting window emptied: the screen draws no Counting results
    // section for it (`v-if="countingResults.length"`), so there is nothing to jump to.
    snap.ladders[snap.activeLadder] = { ...snap.ladders[snap.activeLadder], countingResults: [] }
    const wrapper = mountStats(snap)
    expect(entryNames(wrapper)).toEqual(['Season by season', 'Professional ranking'])
    expect(document.getElementById('stats-results'), 'the section really is absent').toBeNull()
    // The anti-vacuity half: the two that remain are still live landing points.
    expect(document.getElementById('stats-seasons')).toBeTruthy()
    expect(document.getElementById('stats-ranking')).toBeTruthy()
  })

  it('a CLOSED junior career is offered no strip at all - its one section is the archive', async () => {
    const snap = goldenSnapshot()
    // Past the junior tour's own age rule, the International tab freezes to the archive plate and
    // draws NEITHER a ranking nor a counting list (W2-LADDER §4).
    snap.ageYears = J_MAX_AGE + 1
    const wrapper = mountStats(snap)
    await showTrack(wrapper, LADDER_LABEL.itf)
    expect(wrapper.text(), 'this must really be the archive arm').toContain('Junior career')
    expect(document.getElementById('stats-ranking')).toBeNull()
    expect(document.getElementById('stats-results')).toBeNull()
    // One section left, so there is nothing to navigate BETWEEN: no strip, and above all no entry
    // pointing at a heading that is not drawn.
    expect(stripOf(wrapper).exists()).toBe(false)
    expect(document.getElementById('stats-seasons'), 'the season history is still there').toBeTruthy()
    // ...and the moment she steps back onto a live table the strip is back, whole.
    await showTrack(wrapper, LADDER_LABEL.domestic)
    expect(entryNames(wrapper)).toEqual(['Season by season', 'National ranking', 'Counting results'])
  })
})

/** Give one section a top edge, so the scroll spy has real geometry to read in a runner that has
 *  none. Own-property shadowing on the element, undone when the mount is thrown away. */
function stubTop(id: string, top: number): void {
  const el = document.getElementById(id)
  expect(el, `#${id} must be on the page before its box can be faked`).toBeTruthy()
  Object.defineProperty(el!, 'getBoundingClientRect', {
    configurable: true,
    value: (): DOMRect =>
      ({
        top,
        bottom: top + 200,
        height: 200,
        left: 0,
        right: 0,
        width: 0,
        x: 0,
        y: top,
        toJSON: () => ({}),
      }) as DOMRect,
  })
}
