// ⭐⭐⭐ HER CUT ON THE WEEK RECAP – THE MOUNTED HALF: IT SAYS IT, AND IT DOES NOT ADD IT UP.
//
// THE OWNER, 27.08: «на плашке Finances на week recap после турниров можно писать что-то вроде
// Income $sum / Spent $sum / Her cut 10% $sum / Balance $sum. Мне кажется так будет нагляднее.»
//
// ⚠⚠ AND HIS ARITHMETIC AS WRITTEN DOUBLE-COUNTS. `finalizeTournament` credits the family
// `prize − herShare` (world.ts), so Income on that tile is ALREADY NET; a fourth row subtracting it
// again prints a balance the till never had. Shown the two honest layouts he chose the memo: «(B)
// мемо под балансом - вот это хорошо, да». THE DEFECT THIS FILE EXISTS TO CATCH IS THEREFORE NOT
// "the line is missing" – it is "the line silently joined the sum", which is why the second `it`
// below is the strongest one here and mounts the same week twice to prove a negative.
//
// ⚠ MOUNTED, NOT PINNED – CLAUDE.md's own rule, and the reason is specific to this card: the tile
// reads `snapshot.finance.weekly12` while its neighbours read `snapshot.events`, and the last time
// this card was wrong (05.08, the owner's «Income +$0 · Spent +$0» save) EVERY source pin on it was
// green. The engine half lives in tests/kid-share-memo.test.ts.
//
// ⚠ MUTATION-VERIFIED – each of these turns exactly the named arm red, and each was watched doing it:
//   * `v-if="kidShareMemo"` -> `v-if="false"`             -> 3 of 6: "it says it", "no Cyrillic",
//     and the balance arm ON ITS FIXTURE GUARD (it asserts the memo is really there before it
//     asserts the figures ignore it, which is what stops that arm passing vacuously). The
//     under-eighteen arm and BOTH plaque arms stay green – measured, not assumed.
//   * `balanceCents` -= `kidShareCents`                   -> the balance arm, ALONE – and it is the
//     only mutation in this wave that a reader could mistake for the feature working.
//   * `formatCents(cents)` -> `formatCentsSigned(-cents)` -> the "prints his own line" arm, alone
//     (a leading + or − is exactly the misreading layout (B) was chosen to avoid).
//   * the plaque moved back above `.money-tabs`           -> the "demoted" arm, ALONE – and
//     `round26-money-share.test.ts`'s three cases stay green through it, which is the proof that
//     the move did not touch the copy.
//   * the plaque deleted from MoneyScreen                 -> the "kept, not deleted" arm.
import { describe, it, expect, beforeEach, vi } from 'vitest'
// ⚠ A RUNNER-SIZED CEILING, the arithmetic `round26-money-share.test.ts` writes out in full: these
// cases mount real screens over a career walked ~600 weeks, and GitHub's 2-core runner is measured
// at 4-5x this machine on this suite. The walk itself is hoisted out of the cases (see `paid()`),
// so what is inside a case is a mount; 30s is far above that and can only fire on a genuine wedge.
vi.setConfig({ testTimeout: 30_000 })
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import '../../src/style.css'
import WeekRecapCard from '../../src/components/WeekRecapCard.vue'
import MoneyScreen from '../../src/components/screens/MoneyScreen.vue'
import { useGameStore } from '../../src/stores/game'
import {
  KID_ID,
  closeTournament,
  createWorld,
  enterEvent,
  skipTournament,
  tickWeek,
  toSnapshot,
  type WorldState,
} from '../../src/engine/world'
import { rngFromSeed } from '../../src/engine/rng'
import { formatCents } from '../../src/shared/money'
import { TIERS, WEEKS_PER_YEAR } from '../../src/engine/season/calendar'
import { DEFAULT_PROFILE, type Snapshot } from '../../src/shared/protocol'
import type { SeasonEvent, TierId } from '../../src/engine/season/types'
import type { SeasonResult } from '../../src/engine/season/ranking'

/** `round26-world-speaks.test.ts`'s helper, unchanged. */
function enterEligible(world: WorldState, event: SeasonEvent): void {
  const min = TIERS[event.tier as TierId].enterPointBand[0]
  const marker: SeasonResult = { playerId: KID_ID, week: world.week, points: min, tier: event.tier }
  if (min > 0) world.results.push(marker)
  enterEvent(world, event.id)
  if (min > 0) world.results = world.results.filter((r) => r !== marker)
}

/** A real career walked until the week it is STANDING IN split a cheque with her – which is the only
 *  week this card ever draws (`week = snapshot.week`). Stopping ON that week is what makes the
 *  fixture the owner's screenshot rather than a hand-set flag.
 *
 *  ⚠ WALKED ONCE FOR THE FILE, and that is safe here in a way it would not be in
 *  `round26-money-share.test.ts`: every claim below is about what a COMPONENT does with a snapshot,
 *  so the arms are separated by the snapshot each one mounts, not by the world each one walks. The
 *  walk is ~600 weeks and repeating it four times is the file's whole cost. */
let cached: Snapshot | null = null
function paid(): Snapshot {
  if (cached) return cached
  const world = createWorld('recap-kid-share', { ...DEFAULT_PROFILE, birthMonth: 1, birthDay: 5 })
  const rng = rngFromSeed(world.seed)
  while (world.week < WEEKS_PER_YEAR * 14) {
    world.fundsCents = Math.max(world.fundsCents, 5_000_000_00)
    const next = world.season.find(
      (e) => e.week > world.week && e.week <= world.week + 4 && world.week <= e.deadlineWeek && !world.entries.includes(e.id),
    )
    if (next) {
      try {
        enterEligible(world, next)
      } catch {
        /* the door was shut that week */
      }
    }
    tickWeek(world, rng)
    if (world.pendingTournament) {
      skipTournament(world)
      closeTournament(world)
    }
    if (world.financeWeeks.find((w) => w.week === world.week)?.kidShare) break
  }
  const snap = toSnapshot(world)
  const row = snap.finance.weekly12.find((p) => p.week === snap.week)
  expect(row?.kidShareCents, 'the fixture really stopped on a week that paid her').toBeGreaterThan(0)
  expect(snap.ageYears, 'and she is past the threshold birthday on it').toBeGreaterThanOrEqual(18)
  cached = snap
  return snap
}

/** The same week with the memo taken off the wire and NOTHING else touched – the counter-example the
 *  balance arm needs. */
function withoutMemo(snap: Snapshot): Snapshot {
  return {
    ...snap,
    finance: {
      ...snap.finance,
      weekly12: snap.finance.weekly12.map((p) => ({
        week: p.week,
        incomeCents: p.incomeCents,
        expenseCents: p.expenseCents,
        balanceCents: p.balanceCents,
      })),
    },
  }
}

function recap(snap: Snapshot) {
  useGameStore().snapshot = snap
  return mount(WeekRecapCard, { global: { stubs: { teleport: true } } })
}

const clean = (s: string) => s.replace(/\s+/g, ' ').trim()

describe('the week recap says what her cut was', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('prints his own line – Her cut N% $sum – on a week the tennis paid her', () => {
    const snap = paid()
    const row = snap.finance.weekly12.find((p) => p.week === snap.week)!
    const wrapper = recap(snap)
    const memo = wrapper.find('.recap-memo')
    expect(memo.exists(), 'the memo is on the Finances tile').toBe(true)
    // HIS SHAPE, AND THE ENGINE'S OWN FIGURES: the percentage arrives whole from the snapshot and
    // the cents are formatted by the same helper the tile's other rows use.
    //
    // ⚠⚠ RE-AIMED BY ROUND 29 #10, NOT WEAKENED – AND THE OLD SHAPE IS THE DEFECT IT REPORTS. This
    // arm used to read `Her cut N% $sum` and it passed all through the bug the owner filed: «Her
    // cut 50% $27,600 – это не 50% по сравнению с income». It could not see it, because the only
    // base on that card is `Income`, which is the family's REMAINDER of the cheque being split, and
    // this assertion never asked what the percentage was a percentage OF. The line now names the
    // gross the engine really applied the ramp to (`kidShareBaseCents`), so the rate, its base and
    // the money are one readable sentence – and the arm below turns that into an arithmetic pin.
    expect(clean(memo.text())).toContain(
      `Her cut ${row.kidSharePct}% of ${formatCents(row.kidShareBaseCents!)} – ${formatCents(row.kidShareCents!)}`,
    )
    // ⚠⚠ THE COMPANION PIN THE ITEM ASKED FOR: the percentage ON SCREEN must be a percentage OF the
    // figure ON SCREEN beside it. Rendered text, not the snapshot – this is the surface he read.
    // Tolerance is one cent per cheque (each rounds once on its own way in; a title week banks up to
    // three), the same allowance tests/round29-kid-cut-base.test.ts writes out in full.
    const impliedCut = Math.round((row.kidShareBaseCents! * row.kidSharePct!) / 100)
    expect(Math.abs(impliedCut - row.kidShareCents!)).toBeLessThanOrEqual(3)
    // ⚠ AND IT SAYS «THIS ALSO HAPPENED», NOT «THIS WAS DEDUCTED» – the whole reason layout (B) was
    // chosen over the gross-first one. No sign on the figure, and the second line states out loud
    // what Income above already is.
    expect(clean(memo.text()), 'no sign – a leading + or − would read as a subtraction').not.toMatch(
      /[+-]\$\d/,
    )
    expect(clean(memo.text())).toContain('the income above is what the family kept')
  })

  it('leaves Income, Spent and Balance untouched by its presence – the defect this design avoids', () => {
    // ⚠⚠ THE STRONGEST ARM IN THIS FILE. Same snapshot, same week, twice: once as the engine builds
    // it and once with the memo stripped off the wire. Every figure on the tile must be identical,
    // because `Income` is ALREADY `prize − herShare` and a memo that moved the balance would be the
    // double-count the owner was talking out of.
    const snap = paid()
    const withIt = recap(snap)
    const rowsWith = withIt.findAll('.recap-row-val').map((n) => n.text())
    const balanceWith = withIt.find('.recap-balance').text()
    expect(withIt.find('.recap-memo').exists()).toBe(true)
    withIt.unmount()

    const withoutIt = recap(withoutMemo(snap))
    expect(withoutIt.find('.recap-memo').exists(), 'the counter-example really has no memo').toBe(false)
    expect(withoutIt.findAll('.recap-row-val').map((n) => n.text())).toEqual(rowsWith)
    expect(withoutIt.find('.recap-balance').text()).toBe(balanceWith)

    // ...and the balance is genuinely the two rows above it, not a coincidence of two zeroes.
    const row = snap.finance.weekly12.find((p) => p.week === snap.week)!
    expect(row.incomeCents, 'the fixture is a week with real money in it').toBeGreaterThan(0)
    expect(balanceWith, 'the printed balance is income minus spend and nothing else').toBe(
      `${row.incomeCents - row.expenseCents < 0 ? '-' : '+'}$${Math.abs(
        Math.round((row.incomeCents - row.expenseCents) / 100),
      ).toLocaleString('en-US')}`,
    )
  })

  it('says nothing on a week that split no cheque, and nothing at all before her eighteenth', () => {
    // The under-eighteen half is proved on the engine side (tests/kid-share-memo.test.ts walks four
    // junior seasons that really banked prize money and never wrote a row). What this arm adds is
    // the CARD: handed a week with no cut on it, it renders no memo rather than «Her cut 0% $0».
    expect(recap(withoutMemo(paid())).find('.recap-memo').exists()).toBe(false)
  })

  it('writes no Cyrillic and no long dash into the interface', () => {
    // tests/template-copy-rules.test.ts guards the template block statically; this guards the string
    // the player actually reads, which is assembled in the script and cannot be seen from there.
    const memo = clean(recap(paid()).find('.recap-memo').text())
    expect(memo).not.toMatch(/[А-Яа-яЁё]/)
    expect(memo).not.toContain('—')
    expect(memo, 'the short dash is the one the house uses').toContain('–')
  })
})

describe('the Budget plaque is demoted, not deleted', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('still exists and still says what it said', () => {
    // ROUND 26 #5b's copy, unchanged. `round26-money-share.test.ts` holds the balance sentence and
    // the direction clause on their own careers; this is the same claim standing next to the move,
    // so a demotion that quietly dropped a sentence cannot pass as a demotion.
    useGameStore().snapshot = paid()
    const text = clean(mount(MoneyScreen, { global: { stubs: { teleport: true } } }).text())
    expect(text).toContain('split before it reaches this account')
    expect(text).toContain('her part goes to her, the family banks the rest')
  })

  it('sits BELOW the section switcher now, which is what the owner asked for', () => {
    // «эту плашку можно оставить может быть, но переместить вниз, она не главная» (27.08). It used
    // to be section 1a-bis, between the header and the tabs; it is section 9 now, at the foot of the
    // screen. DOM ORDER is the honest way to assert that – a source pin on the template would pass
    // on a strip moved to a place nothing renders.
    useGameStore().snapshot = paid()
    const wrapper = mount(MoneyScreen, { global: { stubs: { teleport: true } } })
    const plaque = wrapper.find('.money-share').element
    const tabs = wrapper.find('.money-tabs').element
    expect(plaque, 'the plaque is on the screen').toBeTruthy()
    expect(tabs, 'and so is the switcher it used to sit above').toBeTruthy()
    // DOCUMENT_POSITION_PRECEDING === 2: `tabs` comes BEFORE `plaque` in the document, which is the
    // new layout. In the old one this bit was clear and DOCUMENT_POSITION_FOLLOWING (4) was set.
    expect(
      plaque.compareDocumentPosition(tabs) & 2,
      'the switcher precedes the plaque – the strip has moved down the page',
    ).toBeTruthy()
    // ⚠ AND IT IS STILL OUTSIDE EVERY TAB GUARD, which was the half of its old placement that was
    // never about height: the ledger tab is where the prize rows it is about live.
    expect(wrapper.find('.money-share').exists()).toBe(true)
  })
})
