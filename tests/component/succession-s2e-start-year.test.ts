// SUCCESSION S2e (06.10) – THE SCREENS PRINT THE CAREER'S OWN YEAR. docs/specs/succession-2026-10.md §2 «The calendar» and the S2e line of §8.
//
// S1 put `startYear` on the snapshot and an optional last argument on every date call; S2e threaded 137 UI call sites (composables/startYear.ts for a screen,
// the snapshot or the input object for a pure helper). The ratchet – tests/succession-s1-start-year.test.ts, arm E – proves no call FORGETS it. THIS file
// proves the thread is LIVE, end to end:
//   a career born in 2048 -> `toSnapshot` -> the store -> a MOUNTED screen -> labels that read '48 (and 2048 where a range spells the year out),
//   and the SAME seed born in the default year -> the same screen -> '31.
// TWO ARMS PER SCREEN, because either alone is a coincidence waiting to happen: the 2048 arm alone passes on a screen that prints a year it computed some
// other way, and the default arm alone passes on a screen that never reads the year at all (it prints 2031 whatever it is told). Together they are the
// proof the screen follows the snapshot. And a NON-VACUITY FLOOR on each: the check "no year but 2048/2049" is worth nothing on a mount that rendered no year.
//
// ⚠ NO STRING IS ASSERTED, ONLY THE YEARS INSIDE THE EXISTING FORMATS (invariant 4): the regexes below read a `W12 '48` label, a `W12 2048` line and the tail
// of a `Mar 2–8, 2048` range, wherever the screen prints them – the copy around them is not under test and may not be touched by this wave.
// ⚠ MUTATION-VERIFIED – each screen's arm names its mutation in the S2e line of the spec's §8 ledger (revert one threaded call; its 2048 arm goes red and so does
// the ratchet).
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import HomeScreen from '../../src/components/screens/HomeScreen.vue'
import CalendarScreen from '../../src/components/screens/CalendarScreen.vue'
import SeasonScreen from '../../src/components/screens/SeasonScreen.vue'
import { useGameStore } from '../../src/stores/game'
import { createWorld, tickWeek, toSnapshot } from '../../src/engine/world'
import { rngFromSeed } from '../../src/engine/rng'
import { DEFAULT_START_YEAR } from '../../src/shared/dates'
import type { Snapshot } from '../../src/shared/protocol'

const SEED = 's2e-start-year'
const WEEKS = 24
const BORN = 2048

/** A real career on the engine, born in `startYear` and walked `WEEKS` weeks – the same seed for both arms, so the worlds differ in the calendar and nothing else. */
function snapshotBornIn(startYear: number): Snapshot {
  const world = createWorld(SEED, undefined, undefined, undefined, undefined, undefined, startYear)
  const rng = rngFromSeed(world.seed)
  for (let i = 0; i < WEEKS; i++) tickWeek(world, rng)
  return toSnapshot(world)
}

/** ⚠ NO LEADING \b ON THE WEEK LABELS: `text()` joins neighbouring elements without a space, so the Calendar’s header reads «CalendarW5 2048 · Feb 3 – Feb 9» and a word boundary
 *  before the W finds nothing (found by running the first draft – the Calendar arm named zero years).
 *  Every calendar year the rendered text names, as four digits: a week label's `'YY`, a `W12 2048` line, and the tail of a date range (`Mar 2–8, 2048`). */
function yearsNamed(text: string): string[] {
  const out: string[] = []
  for (const m of text.matchAll(/W\d{1,2} '(\d\d)\b/g)) out.push(`20${m[1]}`)
  for (const m of text.matchAll(/W\d{1,2} (20\d\d)\b/g)) out.push(m[1])
  for (const m of text.matchAll(/\b[A-Z][a-z]{2} \d{1,2}(?:[–-](?:[A-Z][a-z]{2} )?\d{1,2})?, (20\d\d)\b/g)) out.push(m[1])
  return out
}

const OPTS = { global: { stubs: { teleport: true } } }
const SCREENS = [
  {
    name: 'Home – the diary news',
    floor: 3,
    render: () => mount(HomeScreen, { props: { recapFresh: false }, ...OPTS }),
  },
  {
    name: 'Calendar – the week’s date line and cards',
    floor: 1,
    render: () => mount(CalendarScreen, OPTS),
  },
  {
    name: 'Season – the entries and the look-ahead',
    floor: 3,
    render: () => mount(SeasonScreen, OPTS),
  },
]

describe.each(SCREENS)('S2e · $name', ({ floor, render }) => {
  beforeEach(() => setActivePinia(createPinia()))
  afterEach(() => {
    document.body.innerHTML = ''
  })

  function yearsOn(startYear: number): string[] {
    setActivePinia(createPinia())
    useGameStore().snapshot = snapshotBornIn(startYear)
    const wrapper = render()
    const years = yearsNamed(wrapper.text())
    wrapper.unmount()
    return years
  }

  it(`a career born in ${BORN} prints ${BORN} and ${BORN + 1} and never the default year – the same seed born in ${DEFAULT_START_YEAR} prints ${DEFAULT_START_YEAR} and ${DEFAULT_START_YEAR + 1}`, () => {
    const born = yearsOn(BORN)
    const dflt = yearsOn(DEFAULT_START_YEAR)
    expect(born.length, `the ${BORN} mount names at least ${floor} years – the arm is not vacuous`).toBeGreaterThanOrEqual(floor)
    expect(dflt.length, `and so does the default one`).toBeGreaterThanOrEqual(floor)
    expect([...new Set(born)].filter((y) => y !== `${BORN}` && y !== `${BORN + 1}`), `${BORN} arm: a year other than the career's own`).toEqual([])
    expect([...new Set(dflt)].filter((y) => y !== `${DEFAULT_START_YEAR}` && y !== `${DEFAULT_START_YEAR + 1}`), 'default arm: a year other than the career’s own').toEqual([])
    expect(born, `the ${BORN} arm names ${BORN} itself`).toContain(`${BORN}`)
    expect(dflt, 'and the default arm names 2031 itself').toContain(`${DEFAULT_START_YEAR}`)
  })
})
