// ROUND 28 ITEM 8 – THE TOP BLOCK ON THE COACHES PAGE TOTALS THE HOUSEHOLD, NOT THE COACH.
//
// THE OWNER, 28.08: «На странице коучей в верхнем блоке с недельными тратами и доходами можно
// совокупную всю цифру показывать с учётом массажиста (и психолога в будущем), и даже на магазин
// растянуть, т.к. там тоже есть и с доходностью инструменты и с расходом».
//
// ⚠⚠ HIS OWN WEEK IS THE CASE. Read off his save at week 675, the household's real weekly lines were
// interest +$530.90 and the parents' contribution +$1,017.44 against coaching −$588.35, facility
// −$305.83, stringing −$131.88, physio −$57.03 and STAFF −$525.00. That last line is the masseur he
// hired, it is the largest single thing after the coaching bill, and the block that calls itself the
// week's spending did not know it existed.
//
// ⚠ A SOURCE GREP WOULD PROVE THE STRING EXISTS, NOT THAT THE SCREEN CHANGED, so every assertion
// below reads RENDERED TEXT off a mounted `CoachMarketScreen`, with the app's own stylesheet
// attached (`src/style.css`), and every expectation is rebuilt from the SNAPSHOT's own fields rather
// than from `coachBilling.household` – reading the total back out of the object that produced it
// would assert nothing at all.
//
// WHAT THIS FILE HOLDS, one describe each:
//   §1  the displayed OUT figure is the sum of every household line, the masseur included, and the
//       IN figure is the week's income. Both read as text off the strip.
//   §2  ⭐ THE NUMBER MOVES. The same career with and without the hire, and the difference is
//       exactly his salary – the assertion his sentence is actually about.
//   §3  the shelf is in it (his «и даже на магазин растянуть»), signed: a depreciating car makes the
//       household's weekly outgoing LARGER, and the strip names the shelf when it holds anything.
//   §4  the coaching meter above it is UNTOUCHED – round-21 #12's claim is a different question and
//       still has its own answer on the same screen.
//
// ⚠ MUTATION-VERIFIED, four mutations, each applied alone and reverted. What each ACTUALLY
// reddened, measured rather than predicted:
//
//   A. `householdWeekly` dropping the masseur term (`staffCents` forced to 0) -> §1's total test and
//      §2's positive test. §2's negative test stays green, correctly: it asserts an absence, and the
//      absence is still true when the term is gone. §3 and §4 stay green.
//   B. `householdWeekly` dropping the shelf term (`shelfCents += 0`) -> BOTH of §3 and nothing else.
//      That separation is what says the masseur and the shop are two claims and not one.
//   C. the strip's `householdOutCents` bound to `committedCents` – THE SHIPPED DEFECT REPRODUCED
//      EXACTLY, the block showing the coaching line and calling it the household -> §1 (both), §2's
//      positive test and §3's figure test. §4 stays green, which is the point of §4.
//   D. `familyWeeklyIncomeCents` HALVED -> §1's total test alone. ⚠ AND THE FIRST DRAFT SURVIVED
//      THIS ONE GREEN, which is why §1 now rebuilds the income from `parentIncomeForWeekCents` and
//      the interest rather than reading `weeklyIncomeCents` back off the snapshot: an expectation
//      taken from the field under test moves with the defect and asserts nothing.
import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { nextTick } from 'vue'
// ⚠ THE APP'S OWN SHEET. `.budget-household` and its `strong` sizing live in src/style.css, not in
// the SFC, so a test that skipped this would be measuring an unstyled tree.
import '../../src/style.css'
import CoachMarketScreen from '../../src/components/screens/CoachMarketScreen.vue'
import { useGameStore } from '../../src/stores/game'
import { buyAsset, createWorld, hireMasseur, toSnapshot, type WorldState } from '../../src/engine/world'
import { assetValueCents, shopItem } from '../../src/engine/world/shop'
import { parentIncomeForWeekCents } from '../../src/engine/economy'
import { formatCents } from '../../src/shared/money'
import { DEFAULT_PROFILE, type Snapshot } from '../../src/shared/protocol'

/** A professional career – her first counting W finish on the never-pruned mark, which is the ONE
 *  door both the masseur and the shelf open behind (`masseurUnlocked` / `shopUnlocked`). Built
 *  through the real protocol, exactly as tests/component/masseur-card.test.ts builds one. */
function pro(seed: string): WorldState {
  const world = createWorld(seed, DEFAULT_PROFILE)
  world.bestFinishByTier.w15 = 0
  return world
}

async function mountCoaches(snapshot: Snapshot) {
  const store = useGameStore()
  store.snapshot = snapshot
  const wrapper = mount(CoachMarketScreen, { global: { stubs: { teleport: true } } })
  const pill = wrapper.findAll('.tb-seg .tab-pill').find((b) => b.text() === 'Coaches')
  expect(pill, 'the Coaches tab is on the screen').toBeTruthy()
  await pill!.trigger('click')
  await nextTick()
  return wrapper
}

/** The rendered household strip, as one string – what a parent actually reads. */
async function stripOf(snapshot: Snapshot): Promise<string> {
  const wrapper = await mountCoaches(snapshot)
  const strip = wrapper.find('.budget-household')
  expect(strip.exists(), 'the household strip is drawn at all').toBe(true)
  const text = strip.text()
  wrapper.unmount()
  return text
}

// =================================================================================================
// 1 – THE TOTAL IS EVERY HOUSEHOLD LINE
// =================================================================================================
describe('§1 what the strip totals', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('⭐⭐ the OUT figure is the training bill plus the masseur, and the IN figure is the week', async () => {
    const world = pro('r28-h-hired')
    hireMasseur(world, true)
    const snap = toSnapshot(world)
    expect(snap.masseurHired, 'the fixture really has him on the payroll').toBe(true)
    expect(snap.masseurSalaryCents, 'and he really costs something').toBeGreaterThan(0)

    // ⚠ THE EXPECTATION IS REBUILT FROM THE SNAPSHOT'S OTHER FIELDS, never read back off
    // `coachBilling.household`: the whole claim is that the displayed total EQUALS the sum of the
    // lines, and comparing the total with itself would be green on any arithmetic at all.
    const expectedOut = snap.coachBilling.weeklyCents + snap.masseurSalaryCents
    // ⚠ AND THE INCOME SIDE IS REBUILT FROM ITS OWN COMPONENTS, not read back off
    // `weeklyIncomeCents`. A first draft took the figure from the snapshot and therefore survived a
    // mutation that HALVED the family's income entirely – the expectation moved with the defect. The
    // two streams below are the ones this career has (no kit deal is signed on it), computed from
    // the same inputs the engine had, exactly as tests/component/round21-coach.test.ts §12 does.
    // ⚠ RE-AIMED BY ROUND 29 #12: the savings-interest term is gone from `familyWeeklyIncomeCents`
    // with the accrual itself, so on a career with no kit deal the parents are the only stream.
    const parents = parentIncomeForWeekCents(world.seed, world.profile.background, world.week)
    expect(world.offers.some((o) => o.kind === 'kit' && o.state === 'signed'), 'no deal to pro-rate').toBe(false)
    const expectedIn = parents
    expect(snap.coachBilling.weeklyIncomeCents, 'the cap is those two streams and nothing else').toBe(expectedIn)

    const strip = await stripOf(snap)
    expect(strip, 'the whole week is spoken for on one line').toContain(`${formatCents(expectedOut)} out`)
    expect(strip).toContain(`${formatCents(expectedIn)} in`)
    // ...and the leftover is the difference, in the direction the noun says.
    const net = expectedIn - expectedOut
    expect(strip).toContain(`${formatCents(Math.abs(net))} ${net < 0 ? 'short' : 'left over'}`)
  })

  it('a self-coached family is charged for the court, and the strip says so rather than $0.00', async () => {
    // ⚠ A SECOND THING THIS FIGURE QUIETLY FIXES. The meter's `committed` reads the CURRENT ROW's
    // price, and a self-coached family has no row – so it printed $0.00 committed while the family
    // paid the facility rate every week of the career. `coachBilling.weeklyCents` is court time for
    // that family, which is the honest number, and the household total is built on it.
    const world = createWorld('r28-h-self', { ...DEFAULT_PROFILE, coachTier: 'self' })
    const snap = toSnapshot(world)
    expect(snap.coachMarket.some((r) => r.current), 'nobody is hired').toBe(false)
    expect(snap.coachBilling.weeklyCents, 'the court is still billed').toBeGreaterThan(0)

    const strip = await stripOf(snap)
    expect(strip).toContain(`${formatCents(snap.coachBilling.weeklyCents)} out`)
    expect(strip, 'a family that pays rent every week does not read "$0.00 out"').not.toContain('$0.00 out')
  })
})

// =================================================================================================
// 2 – ⭐ AND THE NUMBER MOVES WHEN HE IS HIRED. His sentence, as an assertion.
// =================================================================================================
describe('§2 the masseur moves the figure', () => {
  beforeEach(() => setActivePinia(createPinia()))

  /** The same seed twice, differing only in the hire – the A/B rule: name what varies, and vary
   *  exactly that. Both worlds are built the same way and neither is ticked, so the training bill,
   *  the parents' contribution and the interest are identical by construction. */
  function pair() {
    const off = pro('r28-h-pair')
    const on = pro('r28-h-pair')
    hireMasseur(on, true)
    return { off: toSnapshot(off), on: toSnapshot(on) }
  }

  it('⭐⭐ the displayed total is larger by exactly his salary once he is hired', async () => {
    const { off, on } = pair()
    expect(off.masseurHired).toBe(false)
    expect(on.masseurHired).toBe(true)
    // ⚠ PROVE THE ARMS ARE COMPARABLE BEFORE READING THE DIFFERENCE (CLAUDE.md's own A/B rule): the
    // only thing that may differ between them is the hire.
    expect(on.coachBilling.weeklyCents).toBe(off.coachBilling.weeklyCents)
    expect(on.coachBilling.weeklyIncomeCents).toBe(off.coachBilling.weeklyIncomeCents)

    const salary = on.masseurSalaryCents
    expect(salary, 'the arm contains the thing it is measuring').toBeGreaterThan(0)

    const before = await stripOf(off)
    const after = await stripOf(on)
    expect(before).toContain(`${formatCents(off.coachBilling.weeklyCents)} out`)
    expect(after).toContain(`${formatCents(off.coachBilling.weeklyCents + salary)} out`)
    // ⚠ AND THE TWO SCREENS REALLY SAY DIFFERENT THINGS. The point of his report is that the number
    // did not move; a test that only checked the hired arm would pass on a block that ignores him.
    expect(after, 'the screen changed, not just the source').not.toBe(before)
  })

  it('...and the unhired arm does NOT carry his salary in the total', async () => {
    // The negative half, so the test above cannot pass by adding a constant to both arms.
    const { off, on } = pair()
    const before = await stripOf(off)
    expect(before).not.toContain(`${formatCents(off.coachBilling.weeklyCents + on.masseurSalaryCents)} out`)
  })
})

// =================================================================================================
// 3 – AND IT STRETCHES TO THE SHOP («и даже на магазин растянуть»)
// =================================================================================================
describe('§3 the shelf is in the household week', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('⭐⭐ a depreciating car makes the weekly outgoing larger, by its own week of value', async () => {
    const world = pro('r28-h-shop')
    world.fundsCents = 500_000_00 // enough to buy the thing; the shelf opens with the pro career
    const bare = toSnapshot(world)
    buyAsset(world, 'car-sensible')
    const snap = toSnapshot(world)
    expect(snap.shop.ownedCount, 'the family really owns something').toBe(1)

    // What one more week of holding costs, asked of `assetValueCents` itself – the same single
    // arithmetic `revalueAssets` is the only writer of. A rate re-derived here would be a second
    // definition and would drift the day slice 2 adds drift.
    const owned = world.assets![0]
    const item = shopItem('car-sensible')!
    expect(item.annualRateBps, 'the sensible estate really depreciates').toBeLessThan(0)
    const held = world.week - owned.boughtWeek
    const weekly = assetValueCents(item, owned.paidCents, held + 1) - assetValueCents(item, owned.paidCents, held)
    expect(weekly, 'and it loses real money in a week').toBeLessThan(0)

    const strip = await stripOf(snap)
    expect(strip).toContain(`${formatCents(snap.coachBilling.weeklyCents + -weekly)} out`)
    // ⚠ AND THE BARE ARM DID NOT: the shelf is what moved the figure, not the purchase's dent in the
    // balance. (Buying moves `fundsCents` and therefore the interest, so the IN figure differs
    // between the arms – which is why this claim is read off the OUT side alone.)
    const bareStrip = await stripOf(bare)
    expect(bareStrip).toContain(`${formatCents(bare.coachBilling.weeklyCents)} out`)
  })

  it('the strip NAMES the shelf when it holds something, and stays quiet when it does not', async () => {
    // A "$0.00 shelf" line on every junior career for years is noise on a phone; the sentence earns
    // its place only once there is a shelf to talk about.
    const world = pro('r28-h-shop-note')
    const bare = toSnapshot(world)
    let wrapper = await mountCoaches(bare)
    expect(wrapper.find('.budget-shelf').exists(), 'nothing owned, nothing said').toBe(false)
    wrapper.unmount()

    world.fundsCents = 500_000_00
    buyAsset(world, 'car-sensible')
    wrapper = await mountCoaches(toSnapshot(world))
    const note = wrapper.find('.budget-shelf')
    expect(note.exists(), 'a shelf that moves money says so').toBe(true)
    expect(note.text()).toContain('The shelf is in that')
    expect(note.text(), 'a depreciating car COSTS').toContain('costs')
    wrapper.unmount()
  })
})

// =================================================================================================
// 4 – THE COACHING METER IS A DIFFERENT QUESTION AND STILL HAS ITS ANSWER
// =================================================================================================
describe('§4 the coaching budget above it is untouched', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('the meter still draws the coaching decision, and the household line sits under it', async () => {
    // ⚠ ROUND-21 #12 SHIPPED THE CAP ON THIS METER and its claim is "can this family afford THIS
    // COACH". Overwriting it with the household total would have silently deleted a shipped answer
    // to a different question, so this is the guard that says two figures are two questions.
    const world = pro('r28-h-meter')
    hireMasseur(world, true)
    const snap = toSnapshot(world)
    const wrapper = await mountCoaches(snap)

    const legend = wrapper.find('.budget-legend').text()
    expect(legend, 'the cap is still the week\'s income').toContain(
      `${formatCents(snap.coachBilling.weeklyIncomeCents)} weekly cap`,
    )
    // The committed figure is still the COACH's line and does not silently absorb the masseur.
    const current = snap.coachMarket.find((r) => r.current)
    expect(legend).toContain(`${formatCents(current?.weeklyCents ?? 0)} committed`)
    expect(legend).not.toContain(formatCents((current?.weeklyCents ?? 0) + snap.masseurSalaryCents))

    // ...and the household strip is a SEPARATE element under it, not a rewrite of the legend.
    expect(wrapper.find('.budget-household').exists()).toBe(true)
    wrapper.unmount()
  })
})
