// WAVE 5 · T13 – THE SCREEN'S HALF OF THE ONE-STORY PROOF.
//
// `coachHireable` is asked in three places (economy.ts's own note): the market row's state, the hire
// command's refusal and THE SCREEN'S LOCK. The first two are engine functions and are swept in
// tests/wave5-elite-gate.test.ts; the third is a mounted `<button>`, four of whose properties carry
// the lock, and this is the only project that can ask it.
//
// ⚠⚠ THE SCREEN IS NOT ONE READER BUT FOUR, and they are four chances to disagree. `CoachMarketScreen`
// reads `r.lockedPoints !== null` in `:disabled`, in the `blocked` class, in the `is-locked` action
// word and – through `rowLabel` – in the row's accessible name. A locked row that is still pressable,
// or a pressable row that reads "locked" to a screen reader, is the R10-16 defect this doctrine is
// named for, and neither would be caught by anything in the engine.
//
// ⚠ NO STRING BELOW IS T13's. «{n} pts short» and «locked, {n} ranking points short» were written
// when the gate was built and are read back here, never rewritten (invariant 4). What the flip
// changed is that a player can now see them.
//
// ⚠ MUTATION-VERIFIED – each arm applied ALONE, run, reverted, md5 back to pristine between each. The
// arm numbers are the ledger in tests/wave5-elite-gate.test.ts; `|w|` is this file's two mounted cases
// (the third, the flag-off control, is named separately where it moves).
//
//   ARM 1  `eliteGate.enabled` back to `false`                        -> |w| 2 – the sweep AND the press
//   ARM 2  `coachHireable` returns `true` for elite at ANY points     -> |w| 2 – the same two
//   ARM 3  `coachHireable`'s `>=` weakened to `>`                     -> |w| 1 – the sweep alone
//   ARM 4  `coachMarket`'s `lockedPoints` pinned to `null` (the ROW)  -> |w| 2 – the sweep AND the press
//   ARM 6  the gate widened from `elite` to EVERY tier                -> |w| 1 – the sweep alone
//   ARM 8  the template's `:disabled` back to `r.current` alone       -> |w| 1 – the sweep alone; the
//          copy is still right and the row is pressable, which is R10-16's defect in its purest form
//   ARM 9  `rowLabel`'s locked arm dropped                            -> |w| 1 – the sweep alone
//   ARM 10 the `is-locked` span deleted from the template             -> |w| 1 – the sweep alone
//
// ⚠ ARMS 8, 9 AND 10 EACH RED EXACTLY ONE ASSERTION AND NOTHING IN THE ENGINE (|g| 0, |c| 0). That is
// the separation worth having: three independent screen readers, three independent failures, and an
// engine suite that cannot see any of them – which is why this file exists rather than a fourth
// `expect` in the unit sweep.
import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { nextTick } from 'vue'
// The app's own sheet: `.cm-row.blocked` lives in src/style.css, so without it the `blocked` half of
// the lock would be asserted against an initial value.
import '../../src/style.css'
import CoachMarketScreen from '../../src/components/screens/CoachMarketScreen.vue'
import { useGameStore } from '../../src/stores/game'
import { KID_ID, createWorld, kidPoints, toSnapshot, type WorldState } from '../../src/engine/world'
import { ECONOMY } from '../../src/engine/economy'
import { coachHireable, buildCoachRoster } from '../../src/engine/coach'
import { DEFAULT_PROFILE, type Snapshot } from '../../src/shared/protocol'

const GATE = ECONOMY.coach.eliteGate as { enabled: boolean; minPoints: number }

/** ⚠ THE SHIPPED VALUE, CAPTURED AT LOAD. The second case toggles the flag, and restoring a literal
 *  `true` would leave the third case unable to fail on the flip being undone – see the same const's
 *  note in tests/wave5-elite-gate.test.ts, which is where ARM 1 found it. */
const SHIPPED = GATE.enabled

/** A self-coached career sitting at exactly `points` domestic points – the one-row idiom the unit
 *  file uses, and the state is ASSERTED rather than assumed before anything is read off it. */
function careerAt(points: number, seed: string): WorldState {
  const world = createWorld(seed, { ...DEFAULT_PROFILE, coachTier: 'self' })
  if (points > 0) world.results.push({ playerId: KID_ID, week: world.week, points, tier: 'national' })
  expect(kidPoints(world, 'domestic'), `the career really sits at ${points} domestic points`).toBe(points)
  return world
}

async function mountCoaches(snapshot: Snapshot) {
  const store = useGameStore()
  store.snapshot = snapshot
  const wrapper = mount(CoachMarketScreen, { global: { stubs: { teleport: true } } })
  const pill = wrapper.findAll('.tb-seg .tab-pill').find((b) => b.text() === 'Coaches')
  await pill!.trigger('click')
  await nextTick()
  return wrapper
}

describe('T13 – the screen locks exactly the rows the engine locks', () => {
  beforeEach(() => setActivePinia(createPinia()))

  /** THE POINT VECTOR, and it is the states rather than a sample: zero, either side of the bar, the
   *  bar itself, and a career past it. */
  const POINT_LEVELS = [0, GATE.minPoints - 1, GATE.minPoints, GATE.minPoints + 1]

  /** MEASURED RED under ARMS 1, 2, 3, 4, 6, 8, 9 and 10 – every arm in the ledger that reaches a
   *  screen at all. It is the sweep, so it is the case that sees everything.
   *
   *  ⚠ EVERY ROW OF EVERY SCREEN, not the elite rows: a gate that quietly locked a `budget` row would
   *  be the same defect pointing the other way, and only a sweep over the whole market can see it. */
  it('sweeps every row at every level – the button, the class, the action word and the name agree', async () => {
    let rowsSwept = 0
    let lockedSeen = 0
    let freeSeen = 0
    for (const points of POINT_LEVELS) {
      const world = careerAt(points, `t13-screen-${points}`)
      const snapshot = toSnapshot(world)
      const roster = buildCoachRoster(world.seed, 14)
      const wrapper = await mountCoaches(snapshot)
      const buttons = wrapper.findAll('.cm-row')
      expect(buttons.length, 'the screen really drew the market').toBe(roster.length)

      for (const [i, button] of buttons.entries()) {
        const row = snapshot.coachMarket[i]
        const coach = roster.find((c) => c.id === row.id)!
        // ⚠⚠ THE RULE, RESTATED – NEVER `coachHireable`. This sweep's first draft used the predicate
        // itself as its expectation, and ARM 6 (the gate widened to every tier) came back 0 RED here
        // because it moved both sides at once. Ruling L's amendment, and the reason the predicate is
        // asserted BESIDE the rule below rather than standing in for it.
        const expectedLocked = row.tier === 'elite' && points < GATE.minPoints
        expect(coachHireable(coach, points), `the predicate itself – ${row.tier} @ ${points}pts`).toBe(!expectedLocked)
        const where = `${row.tier} ${row.id} @ ${points}pts`

        // SURFACE 1 – the engine's row state, which the other three are reading.
        expect(row.lockedPoints !== null, `row state – ${where}`).toBe(expectedLocked)

        // SURFACE 2 – the button cannot be pressed.
        const el = button.element as HTMLButtonElement
        if (expectedLocked) expect(el.disabled, `disabled – ${where}`).toBe(true)

        // SURFACE 3 – the action word in the right-hand column.
        const locked = button.find('.cm-action.is-locked')
        expect(locked.exists(), `the locked action word – ${where}`).toBe(expectedLocked)

        // SURFACE 4 – the accessible name, which is the only one a screen reader ever meets.
        const label = el.getAttribute('aria-label') ?? ''
        expect(label.includes('locked'), `accessible name – ${where}`).toBe(expectedLocked)

        if (expectedLocked) {
          // ⚠ THE COPY IS READ BACK, NEVER REWRITTEN. Both sentences predate this wave.
          expect(locked.text()).toBe(`${row.lockedPoints} pts short`)
          expect(label).toContain(`locked, ${row.lockedPoints} ranking points short`)
          // ...and the blocked treatment, which is what makes it LOOK refused.
          expect(button.classes(), `the blocked class – ${where}`).toContain('blocked')
          lockedSeen++
        } else {
          expect(label).not.toContain('locked')
          freeSeen++
        }
        rowsSwept++
      }
      wrapper.unmount()
    }
    // ⚠ A SWEEP WITH NOTHING IN ONE ARM AGREES PERFECTLY AND PROVES NOTHING. Both halves asserted.
    expect(rowsSwept).toBe(16 * POINT_LEVELS.length)
    expect(lockedSeen, 'the sweep really met locked rows').toBeGreaterThan(0)
    expect(freeSeen, '...and free ones').toBeGreaterThan(0)
  })

  /** ⚠ MEASURED GREEN UNDER EVERY ARM, and declared rather than dropped (T7's own precedent for an
   *  honest zero). It sets the flag itself, so no arm on the flag can move it, and it asserts an
   *  ABSENCE – which the template arms below also produce. What it is worth is the direction: it says
   *  the screen's locked state is the FLAG's and not a second rule of the screen's own. */
  it('and with the flag off the same screen locks nothing at all', async () => {
    GATE.enabled = false
    try {
      const world = careerAt(0, 't13-screen-off')
      const wrapper = await mountCoaches(toSnapshot(world))
      const buttons = wrapper.findAll('.cm-row')
      expect(buttons.length).toBe(16)
      for (const button of buttons) {
        expect(button.find('.cm-action.is-locked').exists()).toBe(false)
        expect(button.element.getAttribute('aria-label') ?? '').not.toContain('locked')
      }
      wrapper.unmount()
    } finally {
      GATE.enabled = SHIPPED
    }
  })

  /** ⚠ THE PRESS, which is the one thing the three engine surfaces cannot see. `askHire` returns
   *  early on a locked row, so a locked card must open NO confirm dialog even if something ever
   *  re-enabled the button. MEASURED RED under ARMS 1, 2 and 4; ⚠ GREEN under ARM 8 – the guard is in
   *  `askHire`, not in the template, so disabling the disable does not open the dialog. Two locks, and
   *  this is the case that says the second one is really there. */
  it('a locked row opens no hire dialog when it is pressed', async () => {
    const world = careerAt(0, 't13-screen-press')
    const snapshot = toSnapshot(world)
    const wrapper = await mountCoaches(snapshot)
    const i = snapshot.coachMarket.findIndex((r) => r.lockedPoints !== null)
    expect(i, 'the screen really has a locked row to press').toBeGreaterThanOrEqual(0)
    await wrapper.findAll('.cm-row')[i].trigger('click')
    await nextTick()
    expect(wrapper.text()).not.toContain('a week?')
    wrapper.unmount()
  })
})
