// ⭐⭐ ROUND-20 #1 – THE COACH-TRAVEL ROW SAYS SOMETHING TRUE ON A PROFESSIONAL CAREER.
//
// Owner, 13.08: «Coach travels не активно на про карьере». He is years into one and the toggle was
// still drawn dead under a sub-line that read "It arrives with the professional years". Two things
// could have been wrong – the precondition, or the sentence – and the finding is that the first one
// does not exist at all:
//
//   * the `disabled` on the switch is a LITERAL in the template, not a binding;
//   * there is no handler, no computed, no age gate and no `v-if` around it beyond `billing`;
//   * `game.setCoachOnEventWeeks` has NO caller anywhere in src/ – the command runs the whole way
//     through (store -> protocol -> worker -> `setCoachOnEventWeeks`) and nothing invokes it.
//
// So no week, no age and no ranking turns this on. The mechanic was cancelled by the owner on 30.07
// after all three versions of it were built and measured and all three failed, and docs/decisions.md
// (08.08) had already spelled the consequence out: "travel never becomes possible (the row is
// hardcoded `disabled` and the mechanic is cancelled), so a notice saying it is now available would
// be false. Needs the unlock ruled on first." The sentence was the defect.
//
// ⚠ WHY MOUNTED AND NOT PINNED. `tests/coach-market.test.ts` reads this screen AS TEXT, and a source
// pin is exactly what let the promise stand: it asserted the row "says WHEN rather than just
// refusing" and was green the whole time the WHEN was never coming. The claim that matters is about
// a rendered screen for a REAL career at a REAL age – mount it at 14 and again at 18, and read what
// the player reads. CLAUDE.md's house rule, and the reason it is a house rule.
//
// ⚠ MUTATION-VERIFIED, each block naming what was broken to watch it fail:
//   * the old sub-line restored verbatim   -> "promises no arrival" goes red on both careers.
//   * `disabled` swapped for `:disabled="!isPro"` with any true `isPro`
//                                          -> "still off at 18" goes red, which is the assertion that
//                                             would have to move if the mechanic were ever built.
//   * the old aria-label restored          -> the a11y assertion goes red on its own.
import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { nextTick } from 'vue'
import '../../src/style.css'
import CoachMarketScreen from '../../src/components/screens/CoachMarketScreen.vue'
import { useGameStore } from '../../src/stores/game'
import { createWorld, tickWeek, toSnapshot, kidAgeYears } from '../../src/engine/world'
import { rngFromSeed } from '../../src/engine/rng'
import { DEFAULT_PROFILE, type Snapshot } from '../../src/shared/protocol'

/** A REAL career through the REAL protocol, ticked to `weeks`. The funds floor is the only hand on
 *  the wheel and it is there so the arm at 18 is about her AGE and not about a bankruptcy – the
 *  screen under test would be a different screen after an ending. */
function careerAt(weeks: number, seed = 'travel-row'): Snapshot {
  const world = createWorld(seed, { ...DEFAULT_PROFILE, coachTier: 'middle' })
  const rng = rngFromSeed(world.seed)
  for (let i = 0; i < weeks; i++) {
    world.fundsCents = Math.max(world.fundsCents, 200_000_00)
    tickWeek(world, rng)
  }
  return toSnapshot(world)
}

async function mountMarket(snapshot: Snapshot) {
  useGameStore().snapshot = snapshot
  const w = mount(CoachMarketScreen, { global: { stubs: { teleport: true } } })
  const pill = w.findAll('.tb-seg .tab-pill').find((b) => b.text() === 'Coaches')
  await pill!.trigger('click')
  await nextTick()
  return w
}

/** The row, and it is found by its switch rather than by its text – the words are what this file is
 *  about, so addressing it by them would make every assertion below circular. */
function travelRow(w: ReturnType<typeof mount>) {
  const section = w.find('.cm-travel')
  expect(section.exists(), 'the travel row is on the screen at all').toBe(true)
  return { section, sub: section.find('.cm-travel-sub'), toggle: section.find('.cm-switch') }
}

// A promise of arrival, in every shape this copy has worn or could wear. The old line matched
// `arrives` AND `professional years`; the replacement must match none of them.
const PROMISES = [
  /\barrives?\b/i,
  /\bunlocks?\b/i,
  /\bcomes? (?:with|when|later)\b/i,
  /\bavailable (?:in|from|with|at)\b/i,
  /\bonce she\b/i,
  /\bsoon\b/i,
  /\bcoming\b/i,
  /\byet\b/i,
]

describe('⭐⭐ round-20 #1 – the travel row on a JUNIOR career', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('is drawn, is a switch, and is off', async () => {
    const w = await mountMarket(careerAt(4))
    const { toggle } = travelRow(w)
    expect(toggle.attributes('role')).toBe('switch')
    expect(toggle.attributes('aria-checked')).toBe('false')
    expect(toggle.attributes('disabled')).toBeDefined()
    w.unmount()
  })

  it('⚠ promises no arrival – because nothing in this app can deliver one', async () => {
    const w = await mountMarket(careerAt(4))
    const { sub } = travelRow(w)
    const text = sub.text()
    expect(text.length, 'it still explains itself rather than just refusing').toBeGreaterThan(40)
    for (const promise of PROMISES) {
      expect(text, `the sub-line must not promise an arrival: ${promise}`).not.toMatch(promise)
    }
    // ...and it still names the junior reason, which is true and is the owner's own.
    expect(text).toMatch(/no prize money/i)
    w.unmount()
  })
})

describe('⭐⭐ round-20 #1 – and on the PROFESSIONAL career that reported it', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('⚠ at 18 the switch is STILL off – which is the fact the old sentence contradicted', async () => {
    // 260 weeks of a real career: she is 18, the career has not ended, and the market is the market.
    const snap = careerAt(260)
    expect(kidAgeYears(snap.week, DEFAULT_PROFILE.birthMonth), 'a professional career').toBeGreaterThanOrEqual(18)
    expect(snap.ending ?? null, 'and it is still running, so this is the live screen').toBeNull()

    const w = await mountMarket(snap)
    const { toggle } = travelRow(w)
    expect(toggle.attributes('disabled'), 'the professional years arrived and it did not').toBeDefined()
    expect(toggle.attributes('aria-checked')).toBe('false')
    w.unmount()
  })

  it('⚠⚠ ...and the sentence agrees with the switch, at 14 and at 18 alike', async () => {
    // THE ITEM. The old copy was false exactly here: the same screen, the same dead control, and a
    // line saying the wait was over. Whatever this row says, it has to be true of BOTH arms.
    const junior = await mountMarket(careerAt(4))
    const juniorText = travelRow(junior).sub.text()
    junior.unmount()

    setActivePinia(createPinia())
    const pro = await mountMarket(careerAt(260))
    const proText = travelRow(pro).sub.text()
    pro.unmount()

    expect(proText, 'one sentence, because one thing is true at every age').toBe(juniorText)
    for (const promise of PROMISES) {
      expect(proText, `a professional career is told no lie either: ${promise}`).not.toMatch(promise)
    }
    // The true condition, stated: it is off at every age and nothing on this screen turns it on.
    expect(proText).toMatch(/every age/i)
    expect(proText).toMatch(/no week turns this on/i)
  })

  it('the accessible name says the same thing the sub-line does', async () => {
    // A screen reader gets the label and never the paragraph, so the promise lived in two places and
    // both had to move. This is the one a sighted reader never sees.
    const w = await mountMarket(careerAt(260))
    const label = travelRow(w).toggle.attributes('aria-label') ?? ''
    expect(label.length, 'the control is named at all').toBeGreaterThan(10)
    for (const promise of PROMISES) {
      expect(label, `the accessible name must not promise an arrival either: ${promise}`).not.toMatch(promise)
    }
    w.unmount()
  })
})
