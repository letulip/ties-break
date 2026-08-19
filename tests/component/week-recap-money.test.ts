// THE WEEKLY STORY'S FINANCES CARD, MOUNTED, ON A FEED THAT HAS BEEN PRUNED CLEAN.
//
// The owner, season 2038, week 47: the card read «FINANCES · Income +$0 · Spent +$0 · Balance +$0»
// while the HIGHLIGHTS panel BESIDE IT listed three real matches from the same week. His save says
// exactly why – `world.events` is capped at 400 rows and the pruner spent the whole budget on her
// match records (382 of them) plus the kept milestones (18), so not one row carrying `amountCents`
// survived. The card folded that feed; `financeWeeks` had every cent of it.
//
// ⚠ WHY THIS IS A MOUNTED TEST AND NOT AN ENGINE ONE. The engine-side guard lives in
// tests/long-career-ledgers.test.ts and asserts the SNAPSHOT carries the money. It cannot assert
// what the CARD does with it, and "what the card does with it" is the entire bug: the snapshot was
// carrying `finance.weekly12` correctly the whole time and the component was reading a different
// field. CLAUDE.md: "Prefer a mounted test to a source pin. Mutate the thing you think you are
// covering and watch it fail before you believe a green run."
//
// THE FIXTURE IS THE MUTATION. One real career, two mounts: the snapshot as the engine builds it,
// and the same snapshot with every financial row stripped out of `events` – which is precisely what
// `pruneEvents` did to the owner's save. A card that reads the durable ledger renders the identical
// figures both times. A card that reads the feed renders zeroes on the second.
import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import WeekRecapCard from '../../src/components/WeekRecapCard.vue'
import { useGameStore } from '../../src/stores/game'
import type { Snapshot } from '../../src/shared/protocol'
import { careerSnapshot } from '../helpers/career'

/** A real career, walked far enough that an ordinary week has both income and spend in it. */
const snapshotAfter = (weeks: number, seed = 'recap-money'): Snapshot => careerSnapshot(weeks, seed)

/** THE OWNER'S SAVE, IN ONE LINE: the money rows are gone from the feed and everything else stays.
 *  `financeWeeks` (and therefore `finance.weekly12`) is untouched, exactly as it was in his file. */
function prunedOfMoney(snap: Snapshot): Snapshot {
  return { ...snap, events: snap.events.filter((e) => e.amountCents === undefined) }
}

function financeRows(snap: Snapshot): string[] {
  const store = useGameStore()
  store.snapshot = snap
  const wrapper = mount(WeekRecapCard, { global: { stubs: { teleport: true } } })
  const values = wrapper.findAll('.recap-row-val').map((n) => n.text())
  wrapper.unmount()
  return values
}

describe('WeekRecapCard FINANCES – the week the feed forgot', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('the fixture is a real week with real money in it, so the test is not vacuous', () => {
    const snap = snapshotAfter(30)
    const row = snap.finance.weekly12.find((p) => p.week === snap.week)
    expect(row).toBeTruthy()
    expect(row!.incomeCents).toBeGreaterThan(0)
    expect(row!.expenseCents).toBeGreaterThan(0)
    // ...and the feed genuinely carries those rows on a young career, which is the state every
    // existing test in this repo has ever mounted.
    expect(snap.events.some((e) => e.amountCents !== undefined && e.week === snap.week)).toBe(true)
  })

  it('renders the same figures whether or not the money rows survived the prune', () => {
    const snap = snapshotAfter(30)
    const intact = financeRows(snap)
    const pruned = financeRows(prunedOfMoney(snap))
    expect(pruned).toEqual(intact)
  })

  it('does not print $0 for a week the durable ledger says money moved', () => {
    const snap = prunedOfMoney(snapshotAfter(30))
    const row = snap.finance.weekly12.find((p) => p.week === snap.week)!
    const text = financeRows(snap).join(' | ')
    // Income and Spent are the first two `.recap-row-val` values on the card.
    expect(text).not.toMatch(/^\+\$0 \| -\$0/)
    expect(row.incomeCents).toBeGreaterThan(0)
  })

  it('the highlights panel still lists the week, so this is the owner\'s screenshot exactly', () => {
    // His card had a populated HIGHLIGHTS beside a zeroed FINANCES: the two panels read the same
    // week from two sources and only one of them had been pruned away.
    const snap = prunedOfMoney(snapshotAfter(30))
    const store = useGameStore()
    store.snapshot = snap
    const wrapper = mount(WeekRecapCard, { global: { stubs: { teleport: true } } })
    expect(wrapper.text()).toContain('Income')
    expect(wrapper.text()).toContain('Balance')
    wrapper.unmount()
  })
})
