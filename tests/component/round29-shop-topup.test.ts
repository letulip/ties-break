// ⭐⭐⭐ ROUND 29 #11 (top-ups) AND #9 (the colour of a worth), ON THE SCREEN HE WAS LOOKING AT.
//
// #11, THE OWNER: «Index fund хотелось бы иметь возможность докупать, предполагаю, что Savings
// deposit будет вести себя так же – тоже надо исправить.»
// #9, THE OWNER: «В строке с машиной и другими вещами Worth now / paid $60,000 / $59,361 – давай
// последнюю цифру сделаем либо белой, либо жёлтой, с красным перебор.»
//
// ⚠ THE HOUSE RULE (round20-ui.test.ts's header, shop-tab.test.ts's too): mount the real SFC against
// a REAL snapshot built by the real engine, never a hand-written snapshot shape, and never a source
// pin for a rendering claim. Every figure below is one the engine produced.
//
// ⚠⚠ AND THE TOP-UPS ARE REAL ENGINE CALLS, NOT A HAND-SET `assets` ROW. The whole risk in this item
// is the COMPOUNDING – money added in season six has not been growing since season one – so a
// fixture that wrote the holding by hand would assert the screen and skip the only hard part.
//
// ⚠ MUTATION-VERIFIED. Each applied alone and reverted, and each was watched:
//   * `buyAsset`'s top-up branch reverted to `throw new Error('already owns')` -> every #11 arm RED.
//   * the rebase reduced to `held.paidCents += paidCents` with no basis written (i.e. the new money
//     back-dated to the original purchase) -> the two «worth exactly» arms RED, alone. This is the
//     mutation the arithmetic arms exist for and the one a screen test could never see.
//   * `held.paidCents += paidCents` dropped -> the «what the family put in» arm and the wallet arm
//     RED.
//   * `tone="plain"` back to the old `:tone="… ? 'negative' : 'positive'"` -> the #9 arm RED, alone.
import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import MoneyScreen from '../../src/components/screens/MoneyScreen.vue'
import TierGuide from '../../src/components/TierGuide.vue'
import '../../src/style.css'
import { useGameStore } from '../../src/stores/game'
import {
  assetValueCents,
  buyAsset,
  createWorld,
  ownedAssets,
  shopItem,
  skipTournament,
  closeTournament,
  tickWeek,
  toSnapshot,
  type WorldState,
} from '../../src/engine/world'
import { rngFromSeed } from '../../src/engine/rng'
import type { Snapshot } from '../../src/shared/protocol'

/** shop-tab.test.ts's own two helpers, unchanged – a real career, then the professional mark that is
 *  the shelf's one-way door (`activeLadderOf`), set at its own source rather than walked to. */
function walk(seed: string, weeks: number): WorldState {
  const world = createWorld(seed)
  const rng = rngFromSeed(world.seed)
  for (let i = 0; i < weeks; i++) {
    tickWeek(world, rng)
    if (world.pendingTournament) {
      skipTournament(world)
      closeTournament(world)
    }
  }
  return world
}
function professional(world: WorldState): WorldState {
  world.bestFinishByTier.wta250 = 3
  return world
}

/** Tick the real engine on, so `revalueAssets` really compounds the holding between the top-ups. */
function run(world: WorldState, weeks: number): void {
  const rng = rngFromSeed(`${world.seed}:run`)
  for (let i = 0; i < weeks; i++) {
    tickWeek(world, rng)
    if (world.pendingTournament) {
      skipTournament(world)
      closeTournament(world)
    }
  }
}

async function mountShop(snapshot: Snapshot) {
  useGameStore().snapshot = snapshot
  const wrapper = mount(MoneyScreen, { global: { stubs: { teleport: true } } })
  const tab = wrapper.findAll('button.tab-pill').find((n) => n.text().trim() === 'Shop')
  expect(tab, 'the Shop tab control').toBeTruthy()
  await tab!.trigger('click')
  return wrapper
}

const OPEN = 20_000_00
const TOP_1 = 10_000_00
const TOP_2 = 7_000_00

/** ⭐ OPEN A HOLDING AND ADD TO IT TWICE, through the real command, with real weeks in between so
 *  each tranche compounds over its own span and not over the first one's. */
function toppedUpTwice(seed: string, itemId: 'deposit' | 'index-fund') {
  const world = professional(walk(seed, 20))
  world.fundsCents = 500_000_00

  // ⚠ THE WALLET IS MEASURED ACROSS EACH COMMAND AND NOT ACROSS THE HORIZON, and the reason is a
  // real property of the ledger rather than caution: `financeWeeks` is pruned to a 60-week trailing
  // window, so a fold over it at the end has already dropped the opening purchase 78 weeks back –
  // the econ bench's own correctness crux, one file over. Across the CALL, `fundsCents` can only
  // have moved for this command, because nothing else runs between the two reads.
  const walletMoves: number[] = []
  const spend = (cents: number) => {
    const before = world.fundsCents
    buyAsset(world, itemId, cents)
    walletMoves.push(before - world.fundsCents)
  }

  spend(OPEN)
  const openedWeek = world.week
  run(world, 52)
  const worthBeforeFirstTopUp = ownedAssets(world).find((a) => a.id === itemId)!.valueCents

  spend(TOP_1)
  const firstTopUpWeek = world.week
  run(world, 26)
  const worthBeforeSecondTopUp = ownedAssets(world).find((a) => a.id === itemId)!.valueCents

  spend(TOP_2)
  return {
    world,
    walletMoves,
    openedWeek,
    firstTopUpWeek,
    worthBeforeFirstTopUp,
    worthBeforeSecondTopUp,
    held: () => ownedAssets(world).find((a) => a.id === itemId)!,
  }
}

beforeEach(() => setActivePinia(createPinia()))

describe.each(['deposit', 'index-fund'] as const)('round 29 #11 – %s takes top-ups', (itemId) => {
  it('the holding is what the family put in, and the wallet is down by exactly that', () => {
    const t = toppedUpTwice(`r29-topup-${itemId}`, itemId)
    const held = t.held()
    // ⭐ THE COST BASIS IS THE CASH, ALL THREE TRANCHES OF IT – which is what keeps the shelf's own
    // «the ledger shows the loss to the cent» true across a top-up (spec §2e-1).
    expect(held.paidCents).toBe(OPEN + TOP_1 + TOP_2)
    // ...and the wallet moved by exactly each tranche, on each of the three commands. A top-up that
    // charged nothing, or charged twice, fails here and nowhere else.
    expect(t.walletMoves).toEqual([OPEN, TOP_1, TOP_2])
    // The most recent two are still inside the ledger's 60-week window, so the shop category can
    // corroborate them – the ledger and the wallet telling one story.
    const recentShopSpend = t.world.financeWeeks.reduce((sum, w) => sum + (w.byCategory.shop ?? 0), 0)
    expect(recentShopSpend).toBe(-(TOP_1 + TOP_2))
  })

  it('⚠⚠ each tranche compounds over ITS OWN span, never back-dated to the first purchase', () => {
    const t = toppedUpTwice(`r29-compound-${itemId}`, itemId)
    const item = shopItem(itemId)!
    const held = t.held()

    // The value at the moment of the second top-up is the FIRST rebase grown over the 26 weeks since
    // it was struck – not the whole stake grown from `openedWeek`, which is what a naive
    // `paidCents += more` would have produced.
    expect(t.worthBeforeSecondTopUp).toBe(
      assetValueCents(item, t.worthBeforeFirstTopUp + TOP_1, t.world.week - t.firstTopUpWeek),
    )
    // And the holding now stands at that worth plus the money just added – the clock restarted here.
    expect(held.valueCents).toBe(t.worthBeforeSecondTopUp + TOP_2)
    expect(held.basisCents).toBe(t.worthBeforeSecondTopUp + TOP_2)
    expect(held.basisWeek).toBe(t.world.week)
    // ⚠ THE ORIGINAL PURCHASE WEEK IS NOT REWRITTEN – it still says when the family opened this.
    expect(held.boughtWeek).toBe(t.openedWeek)

    // ⭐ THE BACK-DATING MUTATION, STATED AS AN INEQUALITY SO IT CANNOT PASS VACUOUSLY: had the new
    // money been treated as though it had been there since week one, the holding would be worth
    // strictly more than this on an appreciating rung.
    const backDated = assetValueCents(item, OPEN + TOP_1 + TOP_2, t.world.week - t.openedWeek)
    expect(held.valueCents).toBeLessThan(backDated)
  })

  it('⭐ and the screen shows the topped-up holding and offers to add again', async () => {
    const t = toppedUpTwice(`r29-screen-${itemId}`, itemId)
    const snap = toSnapshot(t.world)
    const row = snap.shop.rows.find((r) => r.id === itemId)!
    expect(row.paidCents, 'the view carries the accumulated cost').toBe(OPEN + TOP_1 + TOP_2)

    const wrapper = await mountShop(snap)
    const node = wrapper.findAll('.shop-row').find((r) => r.text().includes(row.label))!
    expect(node.text(), 'what they have put in, on screen').toContain('paid $37,000')
    const actions = node.findAll('.shop-action').map((b) => b.text())
    expect(actions, 'the control he asked for').toContain('Put more in')
    // The sale is still offered beside it – a top-up adds a control, it does not replace one.
    expect(actions.some((a) => a.startsWith('Sell it for'))).toBe(true)
    wrapper.unmount()
  })
})

describe('round 29 #11 – a car is still a car', () => {
  it('⚠ a FIXED rung offers no top-up, on screen or in the engine', async () => {
    const world = professional(walk('r29-topup-car', 20))
    world.fundsCents = 500_000_00
    buyAsset(world, 'car-sensible')
    // The engine's own refusal is unchanged, and it is the STAKE that decides – not a list of ids.
    expect(() => buyAsset(world, 'car-sensible')).toThrow('already owns')

    const wrapper = await mountShop(toSnapshot(world))
    const node = wrapper.findAll('.shop-row').find((r) => r.text().includes('The sensible estate'))!
    expect(node.findAll('.shop-action').map((b) => b.text())).not.toContain('Put more in')
    wrapper.unmount()
  })
})

describe('round 29 #9 – a depreciated value is not an error', () => {
  it('⭐⭐ the Worth now figure renders in the PLAIN token, never money-out red', async () => {
    const world = professional(walk('r29-colour', 20))
    world.fundsCents = 500_000_00
    buyAsset(world, 'car-sensible')
    // A full season of the car losing its 6%, so the row really is the one he was looking at.
    run(world, 52)
    const snap = toSnapshot(world)
    const row = snap.shop.rows.find((r) => r.id === 'car-sensible')!
    expect(row.changeCents!, 'the fixture really has depreciated').toBeLessThan(0)

    const wrapper = await mountShop(snap)
    const node = wrapper.findAll('.shop-row').find((r) => r.text().includes('The sensible estate'))!
    const worth = node.findAll('.tb-statrow').find((r) => r.text().includes('Worth now'))!
    // ⚠⚠ THE RENDERED TOKEN, NOT THE SOURCE LINE. `plain` is StatRow's `--ink` – white – and its own
    // documented sense is «a number with no direction (a count, a balance)», which is exactly what a
    // worth is. `negative` is `--money-out`, and it is what he called «перебор».
    expect(worth.classes()).toContain('tb-statrow--plain')
    expect(worth.classes()).not.toContain('tb-statrow--negative')
    expect(worth.classes()).not.toContain('tb-statrow--positive')
    // ⚠ AND THE DIRECTION IS NOT LOST – it moved one line down, to the row that is genuinely about a
    // direction. Red there is correct and stays.
    expect(node.find('.shop-row-change').classes()).toContain('is-down')
    wrapper.unmount()
  })
})

// =================================================================================================
// FOLDED IN FROM THE ROUND-29 AUDIT – two labels on surfaces this wave was already inside.
// =================================================================================================

describe('round 27 #8 (folded in) – the two «season» figures say which season they mean', () => {
  it('⭐⭐ the spending period says SO FAR and the history card says COMPLETED', async () => {
    // ⚠⚠ THE ARITHMETIC WAS NEVER WRONG, which is why this is a label test and not a sum test. The
    // owner: «в History расход за сезон написан 36 тысяч, а на вкладке расходов 25 тысяч ... явно
    // что-то не ладно с нашей математикой». Both figures were right about DIFFERENT seasons – the
    // period switcher folds the season still running, the history card lists seasons that wrapped –
    // and neither surface said which. He is owed the words, not a repair.
    const world = professional(walk('r29-season-labels', 20))
    // ⚠ NOT `mountShop` – the period switcher lives on the SPENDING chapter, which is where the
    // screen opens, and pressing Shop would `v-if` it straight back out of the document.
    useGameStore().snapshot = toSnapshot(world)
    const wrapper = mount(MoneyScreen, { global: { stubs: { teleport: true } } })

    const periods = wrapper.findAll('.money-window button.tab-pill').map((b) => b.text().trim())
    expect(periods.length, 'the period switcher is on screen').toBeGreaterThan(0)
    expect(periods.join(' '), 'the running season is named as unfinished').toMatch(/So far/)
    expect(periods.join(' '), 'and no longer as a bare «This season»').not.toContain('This season')

    const history = wrapper.findAll('button.tab-pill').find((n) => n.text().trim() === 'History')!
    await history.trigger('click')
    expect(wrapper.text(), 'the other side of the same confusion').toContain('Completed seasons')
    wrapper.unmount()
  })
})

describe('round 17 #28 (folded in) – the last surface still printing $0', () => {
  it('⭐ the ladder guide states the slam has NO entry fee, and never «$0»', () => {
    // Flagged 13.08, marked `[x]`, and `TierGuide.vue` was still rendering `formatCents(0)`.
    // `shared/money.ts`' rule: «A fact ("no entry fee") and a missing value ("$0") must not look the
    // same.» The slam is the only rung this can fire on, and there it is true.
    useGameStore().snapshot = toSnapshot(professional(walk('r29-tier-guide', 20)))
    const wrapper = mount(TierGuide, { global: { stubs: { teleport: true } } })
    const cells = wrapper.findAll('td').map((c) => c.text())
    expect(cells, 'the fact, in the column\'s own idiom').toContain('none')
    expect(cells, 'and not the hole he reported').not.toContain('$0')
    // The paying rungs are untouched – this is one cell, not a rewrite of the column.
    expect(cells).toContain('$40')
    expect(cells).toContain('$1,000')
    wrapper.unmount()
  })
})
