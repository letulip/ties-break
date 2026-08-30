// ⭐⭐⭐ ROUND 26 #5b – DOES THE MONEY SCREEN SAY THAT SHE IS BEING PAID?
//
// The owner, 24.08: «Проверь пожалуйста что со всех выигрышей после своего счета в банке в 18 лет
// она получает свои отчисления и неплохо бы об этом где-то игроку сообщать, кстати». The first half
// is a measurement and it is `tools/kid-share-audit.ts` (4,737 cheques from eighteen, every one paid
// the exact ramp amount to the cent). THIS file is the second half: he was never told.
//
// ⚠ MOUNTED, NOT PINNED. A source pin on MoneyScreen.vue would pass on a strip that renders behind
// a `v-if` nobody satisfies. Both arms below are REAL careers ticked through the real engine and
// really passed through `toSnapshot`, so the strip's own gate (`kidPrizeShareBps(snapshot.ageYears)`)
// is exercised by her real birthday and not by a hand-set flag.
//
// ⚠ MUTATION-VERIFIED – each of these turns exactly one arm red and was watched doing it:
//   * delete the `v-if="kidShareNote"` paragraph            -> "it says so" goes red; the under-18
//     arm stays green, which is what makes that arm worth having.
//   * `kidShareNote` returns the note unconditionally       -> the under-18 arm goes red, alone.
//   * drop the «split before it reaches this account» clause -> the DIRECTION arm goes red and the
//     balance arm stays green – the two halves are separate `it`s exactly so this is provable.
//
// ⚠ THE LEDGER ROW ITSELF IS PROVEN NEXT DOOR, on a career that really plays: `tests/
// round26-world-speaks.test.ts` re-derives every split from outside the till. A component test
// cannot walk a career that enters tournaments inside happy-dom for the price it is worth.
// ⚠ TWO AGENTS REACHED THIS INDEPENDENTLY (round 26 #16, 24.08) - the architect measuring the CI
// red and a wave agent tripping over the same file mid-run. Both arrived at the same arithmetic and
// the same ceiling, which is the strongest evidence the diagnosis is right rather than a guess.
import { describe, it, expect, beforeEach, vi } from 'vitest'
// ⚠ A RUNNER-SIZED CEILING (round 26 #16 – «test-build падает на гите»). These cases mount a real
// screen over a career walked hundreds of weeks, and locally the slowest sits at 4.7s against
// vitest's 5s per-test default. GitHub's ubuntu runner is a 2-core box measured at 4-5x local wall
// clock on this suite, so 5s is crossed there DETERMINISTICALLY while every assertion passes – the
// documented slow-machine signature, and the reason CI was red while the local gate was green.
// 30s is ~6x the solo cost: it can only fire on a genuine wedge. ⚠ A case that takes tens of
// seconds ALONE is a regression and this ceiling must not be raised to hide it.
vi.setConfig({ testTimeout: 30_000 })
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import '../../src/style.css'
import MoneyScreen from '../../src/components/screens/MoneyScreen.vue'
import { useGameStore } from '../../src/stores/game'

// ⚠⚠ ADDED BY R26-G, 26.08, AND IT IS ROUND 26 #16 CAUGHT IN THE ACT. This file mounts the Money
// screen over WALKED careers and carries no timeout of its own, so it runs at vitest's 5s default –
// the component project declares none. Measured on an idle machine: the file is 9.3s and its two
// heavy cases are **3.9s and 3.9s**. CI's runner is a 2-core box measured at 4-5x this machine, so
// those become **16-20s against 5s** and fail every time. It went red here in a local full-project
// run the moment anything else was competing for a core, with the exact signature CLAUDE.md
// describes: «Test timed out in 5000ms», zero assertion failures.
//
// ⚠ NOT THIS AGENT'S FILE AND NOT THIS AGENT'S ITEM – it is round 26 #5b's, shipped last pass. The
// line is added rather than reported because the rule is explicit («any mounted case over ~1s
// locally needs a budget with the arithmetic») and because a red CI is the owner's own #16. Whoever
// owns #16 should sweep the rest of `tests/component/**` the same way: run the project with the
// default reporter and compare each file's slowest case against its `vi.setConfig`, if it has one.

import {
  birthdayOffer,
  chooseGift,
  closeTournament,
  createWorld,
  decideKnock,
  pendingBirthday,
  pendingKnock,
  skipTournament,
  tickWeek,
  toSnapshot,
} from '../../src/engine/world'
import { kidPrizeShareBps, managerCommissionBps } from '../../src/engine/economy'
import { rngFromSeed } from '../../src/engine/rng'
import { formatCents } from '../../src/shared/money'
import { DEFAULT_PROFILE, type Snapshot } from '../../src/shared/protocol'
import type { WorldState } from '../../src/engine/world'

/** A REAL career ticked to `week`, held solvent so the arm is decided by her birthday rather than by
 *  a bankruptcy. The harness `tests/component/round23-kid-page.test.ts` uses, unchanged. */
function careerAt(week: number, seed = 'round26-share'): WorldState {
  const world = createWorld(seed, { ...DEFAULT_PROFILE, birthMonth: 6 })
  const rng = rngFromSeed(world.seed)
  while (world.week < week) {
    world.fundsCents = Math.max(world.fundsCents, 500_000_00)
    if (pendingKnock(world)) decideKnock(world, 'rest')
    const age = pendingBirthday(world)
    if (age !== null) chooseGift(world, birthdayOffer(world.seed, age).options[0].id)
    tickWeek(world, rng)
    if (world.pendingTournament) {
      skipTournament(world)
      closeTournament(world)
    }
  }
  return world
}

function mountMoney(snapshot: Snapshot) {
  useGameStore().snapshot = snapshot
  return mount(MoneyScreen, { global: { stubs: { teleport: true } } })
}

const clean = (s: string) => s.replace(/\s+/g, ' ').trim()

describe('round 26 #5b – her share is said out loud on the Money screen', () => {
  beforeEach(() => setActivePinia(createPinia()))

  /** Old enough that `kidPrizeShareBps` is non-zero off her REAL birthday, holding a balance she
   *  could only have from her own share. Built once per arm so a mutation can kill one and not both:
   *  the balance and the direction are two different claims about two different sentences. */
  function paidCareer(): { snap: Snapshot; funds: number } {
    const world = careerAt(52 * 11)
    world.kidFundsCents = 59_220_00
    const snap = toSnapshot(world)
    expect(snap.ageYears, 'the arm needs her past the threshold birthday').toBeGreaterThanOrEqual(18)
    expect(kidPrizeShareBps(snap.ageYears), 'the ramp is running at this age').toBeGreaterThan(0)
    return { snap, funds: world.kidFundsCents }
  }

  it('says the balance and the rate once the ramp has started', () => {
    const { snap, funds } = paidCareer()
    const text = clean(mountMoney(snap).text())
    // THE ENGINE'S OWN SENTENCE, not a re-worded copy – `kidLife.ownAccountNote`.
    expect(text, 'her balance is on the money screen').toContain(formatCents(funds))
    // ⚠ RE-AIMED BY ROUND 29 P3, same word, same reason as the kid page's arm: the ramp is the
    // PRIZE money's rule now. Still asked of `kidPrizeShareBps` rather than of a literal.
    expect(text, 'and the rate the till actually divides by').toContain(
      `${kidPrizeShareBps(snap.ageYears) / 100}% of every prize cheque`,
    )
    // ⭐ P3's own clause, off `managerCommissionBps` – the function `bankSponsorCheque` pays by.
    expect(text, 'and the sponsor half names the manager\'s fee').toContain(
      `less the manager's ${managerCommissionBps() / 100}%`,
    )
  })

  it('says the money leaves the family wallet before it ever arrives', () => {
    // THE DIRECTION – «родитель смотрит, как его доля уменьшается», stated as a fact and not as a
    // complaint. This is the half nothing in the game had ever said, and it is its own arm.
    const { snap } = paidCareer()
    expect(clean(mountMoney(snap).text()), 'the cheque is split BEFORE this account sees it').toContain(
      'split before it reaches this account',
    )
  })

  it('says nothing at all before her eighteenth, when there is no transfer to explain', () => {
    const world = careerAt(52 * 4)
    const snap = toSnapshot(world)
    expect(snap.ageYears, 'the arm needs her under the threshold').toBeLessThan(18)
    expect(kidPrizeShareBps(snap.ageYears), 'nothing is being transferred yet').toBe(0)

    const text = clean(mountMoney(snap).text())
    expect(text, 'no share strip before the ramp starts').not.toContain('split before it reaches this account')
    expect(text, 'and no account line either').not.toContain('Her own account')
  })

})
