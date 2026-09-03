// ⭐⭐ ROUND 29 #5, MOUNTED – the shelf's remaining storeys on the real screen.
//
// THE OWNER: «В магазине всё ещё не хватает яхт, самолётов и стойки академии»
//
// ⚠ THE HOUSE RULE THIS FILE IS WRITTEN UNDER (`shop-tab.test.ts`'s header, and round20-ui's before
// it): mount the real SFC against a REAL snapshot built by the real engine, never a hand-written
// snapshot shape, and never a source pin for a rendering claim. He reports from a running build, so
// a grep for a string proves nothing about what the screen draws.
//
// WHAT THIS FILE HOLDS:
//   §1  every new rung RENDERS, with its real price and its real weekly upkeep;
//   §2  an ORDERED thing draws a date and no Sell;
//   §3  the academy's stages draw in order, priced, with the one under them named;
//   §4  the household strip carries the weekly bill (round 28 #8's own strip);
//   §5  the planner sheet carries the yacht week for everybody (part two #8) – priced as a charter,
//       and «free – their own boat» only once the yacht is delivered;
//   §6  the order confirm fits a phone (CLAUDE.md's dialog rule – it is a longer sentence now).
import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import MoneyScreen from '../../src/components/screens/MoneyScreen.vue'
import CoachMarketScreen from '../../src/components/screens/CoachMarketScreen.vue'
import PlanWeekSheet from '../../src/components/PlanWeekSheet.vue'
import '../../src/style.css'
import { useGameStore } from '../../src/stores/game'
import {
  buyAsset,
  closeTournament,
  createWorld,
  skipTournament,
  tickWeek,
  toSnapshot,
  type WorldState,
} from '../../src/engine/world'
import { vacationPriceCents } from '../../src/engine/economy'
import { formatCents } from '../../src/shared/money'
import { rngFromSeed } from '../../src/engine/rng'
import type { Snapshot } from '../../src/shared/protocol'
import { assertDismissReachable, setViewport, PHONE } from './fits'
import { shelfRow, shelfText } from './shelf'

/** A real career, walked by the real engine – `shop-tab.test.ts`'s own recipe. */
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

/** ⚠ THE DOOR IS OPENED THE WAY THE ENGINE OPENS IT – the never-pruned `bestFinishByTier` mark. */
function professional(world: WorldState): WorldState {
  world.bestFinishByTier.wta250 = 3
  return world
}

/** A career that can see the whole shelf: professional, and rich enough that no row is greyed for
 *  money alone. The wallet is set rather than earned – no bench career reaches $60M, and what is
 *  under test is the drawing. */
function rich(seed: string, weeks = 20): WorldState {
  const w = professional(walk(seed, weeks))
  w.fundsCents = 60_000_000_00
  return w
}

async function mountShop(snapshot: Snapshot, attach = false) {
  useGameStore().snapshot = snapshot
  const wrapper = mount(MoneyScreen, {
    global: { stubs: { teleport: true } },
    ...(attach ? { attachTo: document.body } : {}),
  })
  const tab = wrapper.findAll('button.tab-pill').find((n) => n.text().trim() === 'Shop')
  expect(tab, 'the Shop tab control').toBeTruthy()
  await tab!.trigger('click')
  return wrapper
}

// ⚠⚠ RE-AIMED, ROUND 30 #5 – THE SHELF HAS SIX SEGMENTS NOW. This used to be a synchronous
// `findAll('.shop-row').find(...)` over the whole catalogue; a boat and an aeroplane live on
// different tabs, so the row is reached by pressing the tab a player presses. Every assertion below
// is the one it always made – the price, the wait, the upkeep, the hidden bonus's absence – and the
// helper leaves the row's own segment open so a control on it can still be clicked.
// `tests/component/shelf.ts` carries the argument and the owner's words.
const rowFor = shelfRow

beforeEach(() => {
  setActivePinia(createPinia())
})

describe('§1 – every new rung is on the screen, at its real price', () => {
  it('⭐⭐ §3f – the commissioned rungs ON SALE render with the spec\'s own prices', async () => {
    const wrapper = await mountShop(toSnapshot(rich('r29-5-ui-prices')))
    // §3f's table, as a person reads it. Literals, so a retune has to come through this file.
    // ⚠ RE-AIMED at part three P1 (the motor boat is the sailing yacht – same price) and part four
    // P10 (the long-range plane is RETIRED: no row for a family that does not own one, asserted
    // as an absence right after the loop).
    for (const [label, price] of [
      ['The launch', '$900,000'],
      ['The sailing yacht', '$2,400,000'],
      ['The yacht', '$12,000,000'],
      ['The big yacht', '$28,000,000'],
      ['The plane', '$18,000,000'],
    ] as const) {
      expect((await rowFor(wrapper, label)).text(), `${label} price`).toContain(price)
    }
    // ⚠ RE-AIMED, ROUND 30 #5 – read across the six segments. The absence below is the arm that
    // needed it most: "not on the shelf" asserted against ONE open tab would have gone green on a
    // rung that was merely one tab away, which is a dead guard rather than a check.
    const shelf = await shelfText(wrapper)
    expect(shelf, 'P10: the retired rung is simply not on the shelf').not.toContain('The long-range plane')
    // ...under their own family headings, which is §3's rule that a shop is families and not a list.
    // ⚠ AND THE HEADINGS ARE UNCHANGED WORD FOR WORD (invariant 4): the sub-tabs are named
    // `Water` / `Air` / `Business` because those are the owner's spellings for the TABS, and the
    // family headings under them still read exactly as they shipped.
    expect(shelf).toContain('On the water')
    expect(shelf).toContain('In the air')
    expect(shelf).toContain('Her academy')
    wrapper.unmount()
  })

  it('⭐⭐ ...and each one carries the THIRD number: what it costs a week to keep', async () => {
    const wrapper = await mountShop(toSnapshot(rich('r29-5-ui-upkeep')))
    // §3f's own weekly figures, rounded to the dollar by `formatCents`.
    expect((await rowFor(wrapper, 'The launch')).text()).toContain('$1,038 a week to keep')
    expect((await rowFor(wrapper, 'The yacht')).text()).toContain('$23,077 a week to keep')
    expect((await rowFor(wrapper, 'The plane')).text()).toContain('$27,692 a week to keep')
    // ⚠ AND NOTHING THAT COSTS NOTHING SAYS IT DOES – a «$0.00 a week to keep» on every rung would be
    // noise on a phone, and the shelf had eight rungs before this slice.
    //
    // ⚠⚠ RE-AIMED AT ROUND 30 #15, AND THE CAR MOVED SIDES RATHER THAN BEING DROPPED. The owner has
    // asked the cars to cost something to keep («Для машин вполне можно ввести годовую стоимость
    // обслуживания»), so «the good saloon says nothing» stopped being a fact about the shelf. What
    // this arm was FOR – a line that appears on rungs it means nothing on – is intact on the academy
    // stage, and the car is now asserted from the OTHER side, which fails in both directions: if a
    // free rung starts charging, or if the car stops.
    expect((await rowFor(wrapper, 'The land')).text()).not.toContain('a week to keep')
    expect((await rowFor(wrapper, 'The good saloon')).text(), 'round 30 #15 – and a car now does').toContain(
      '$116 a week to keep',
    )
    wrapper.unmount()
  })

  it('⭐ §3f – the WAIT is on the row before anything is ordered, and the control says «Order»', async () => {
    const wrapper = await mountShop(toSnapshot(rich('r29-5-ui-wait')))
    const yacht = (await rowFor(wrapper, 'The yacht'))
    expect(yacht.text()).toContain('Built to order')
    // ⚠ §3f's OWN UNITS – its table says «~3 years» for this rung and «~12 months» / «~18 months»
    // for the two below it, and the screen says the same. ⚠ WHOLE NUMBERS: an eighteen-month build
    // must never render as «1.5 years» (the owner's display ruling of 26.08).
    expect(yacht.text()).toContain('about 3 years')
    expect((await rowFor(wrapper, 'The launch')).text()).toContain('about 12 months')
    expect((await rowFor(wrapper, 'The sailing yacht')).text()).toContain('about 18 months')
    expect(wrapper.text(), 'no fractional wait anywhere on the shelf').not.toMatch(/\d+\.\d+ years/)
    expect(yacht.find('.shop-action').text()).toBe('Order it')
    // ...and a car is still bought.
    expect((await rowFor(wrapper, 'The good saloon')).find('.shop-action').text()).toBe('Buy it')
    wrapper.unmount()
  })

  it('⚠⚠ THE HIDDEN BONUS IS NOT ON THE CARD – his own ruling, asserted as an absence', async () => {
    // «верно, но только если знают об этом, я предложил сделать бонус скрытым» – §3d rule 4:
    // «Hidden means never a number on a card.» The plane's FARE cut is money and money is always on
    // screen here; the point it adds to a travelling week is not, and this is the case that a
    // careless implementation gets backwards.
    const wrapper = await mountShop(toSnapshot(rich('r29-5-ui-hidden')))
    const plane = (await rowFor(wrapper, 'The plane')).text()
    expect(plane).toContain('$18,000,000')
    expect(plane.toLowerCase()).not.toMatch(/condition|fatigue|tired|fresher|recover|\+1/)
    // ⚠ THE FAMILY NOTE MAY SAY WHAT THE MONEY DOES, and does – that half is not hidden.
    expect(wrapper.text()).toContain('takes half the fare off every trip')
    // ⚠ ANTI-VACUITY: the pattern above is the language this screen really uses for that kind of
    // effect, so a row that DID state the bonus would be caught. The physio line two chapters over
    // is the proof the vocabulary is live on this very screen.
    const bills = wrapper.findAll('button.tab-pill').find((n) => n.text().trim() === 'Bills')!
    await bills.trigger('click')
    expect(wrapper.text().toLowerCase()).toMatch(/condition/)
    wrapper.unmount()
  })
})

describe('§2 – an ordered thing draws a date, and no Sell', () => {
  function orderedSnapshot(seed: string): Snapshot {
    const w = rich(seed)
    buyAsset(w, 'yacht')
    return toSnapshot(w)
  }

  it('⭐⭐ the row says when it is due and offers nothing to sell', async () => {
    const snap = orderedSnapshot('r29-5-ui-order')
    const wrapper = await mountShop(snap)
    const yacht = (await rowFor(wrapper, 'The yacht'))
    expect(yacht.text()).toContain('On order')
    expect(yacht.text()).toContain('paid $12,000,000')
    expect(yacht.text()).toContain('cannot be sold before it is delivered')
    // ⚠ AND NO SELL CONTROL AT ALL, which is R10-16: `sellableAsset` refuses it, so the screen may
    // not offer it. A greyed-out Sell would be the same lie with an extra click in it.
    expect(yacht.findAll('.shop-action').map((b) => b.text()).some((t) => t.startsWith('Sell'))).toBe(false)
    // ...and the week it is due is the engine's own, printed as a week label.
    const readyWeek = snap.shop.rows.find((r) => r.id === 'yacht')!.readyWeek
    expect(readyWeek, 'the snapshot really carries a date').not.toBeNull()
    wrapper.unmount()
  })
})

describe('§3 – §3g, the academy: four stages, priced, in order', () => {
  it('⭐⭐ every stage renders at its price, and the ones not yet reachable say what comes first', async () => {
    const wrapper = await mountShop(toSnapshot(rich('r29-5-ui-academy')))
    for (const [label, price] of [
      ['The land', '$2,000,000'],
      ['The courts', '$3,000,000'],
      ['The clubhouse', '$4,000,000'],
      ['The staff', '$3,000,000'],
    ] as const) {
      expect((await rowFor(wrapper, label)).text(), `${label} price`).toContain(price)
    }
    // ⚠ §2's rule one storey up: never a locked row and never a progress bar. The price stays on
    // screen and the control is simply not pressable, with the stage under it named.
    const courts = (await rowFor(wrapper, 'The courts'))
    expect(courts.text()).toContain('The land has to come first')
    expect(courts.find('.shop-action').attributes('disabled')).toBeDefined()
    expect((await rowFor(wrapper, 'The land')).find('.shop-action').attributes('disabled')).toBeUndefined()
    wrapper.unmount()
  })

  it('⭐ ...and a half-built academy shows the stages it has and the stages it does not', async () => {
    const w = rich('r29-5-ui-half')
    buyAsset(w, 'academy-land')
    const wrapper = await mountShop(toSnapshot(w))
    expect((await rowFor(wrapper, 'The land')).text()).toContain('Worth now')
    const courts = (await rowFor(wrapper, 'The courts'))
    expect(courts.text(), 'the stage under it is built now').not.toContain('has to come first')
    expect(courts.find('.shop-action').attributes('disabled')).toBeUndefined()
    expect((await rowFor(wrapper, 'The clubhouse')).text()).toContain('The courts has to come first')
    wrapper.unmount()
  })
})

describe('§4 – the weekly bill is on the household strip (round 28 #8)', () => {
  it('⭐⭐ the strip names the upkeep, and it is silent for a family with none', async () => {
    // A DELIVERED launch, arrived through the real tick – 52 weeks of build.
    const w = rich('r29-5-ui-strip')
    buyAsset(w, 'boat-launch')
    for (let i = 0; i < 53; i++) {
      tickWeek(w, rngFromSeed(`${w.seed}:strip`))
      if (w.pendingTournament) {
        skipTournament(w)
        closeTournament(w)
      }
    }
    useGameStore().snapshot = toSnapshot(w)
    const wrapper = mount(CoachMarketScreen, { global: { stubs: { teleport: true } } })
    // ⚠ RE-AIMED 01.09, NOT WEAKENED: the sentence read «Keeping what THEY own» until the owner
    // asked who "they" was («Кто "they"? You здесь вроде»). The strip addresses the player, so the
    // pronoun moved and this pin moved with it. What it asserts is unchanged - the strip names the
    // upkeep, in cents, from the engine.
    expect(wrapper.text()).toContain('Keeping what you own is $1,038 a week of that')
    wrapper.unmount()

    setActivePinia(createPinia())
    useGameStore().snapshot = toSnapshot(rich('r29-5-ui-strip-bare'))
    const bare = mount(CoachMarketScreen, { global: { stubs: { teleport: true } } })
    expect(bare.text()).not.toContain('Keeping what you own')
    bare.unmount()
  })
})

describe('§5 – ⭐⭐ the yacht week is a line of the vacation ladder – priced for everybody, free with a yacht', () => {
  /** The planner sheet on a plannable week, vacation tab open. */
  function mountVacationTab(snap: Snapshot, week: number) {
    useGameStore().snapshot = snap
    return mount(PlanWeekSheet, { props: { week, initialTab: 'vacation' as const } })
  }

  // ⚠⚠ RE-AIMED AT ROUND 29 PART TWO #8 (29.08), NEVER DELETED. These two arms held «the row is
  // not drawn without a delivered yacht»; his #8 put the row on every family's sheet «сначала с
  // реальной стоимостью» (the quote lives in the economy catalogue – no Cyrillic reaches this
  // file's mounted templates), so the SAME fixtures now assert the row is THERE and it is PRICED –
  // never the owner's free line.
  it('⭐⭐ it IS among the options for a family with no yacht – at a real price', async () => {
    const w = rich('r29-5-ui-noyacht')
    const wrapper = mountVacationTab(toSnapshot(w), w.week + 3)
    const text = wrapper.text()
    expect(text, 'the six that are always there').toContain('Elite recovery programme')
    expect(text, '#8: the seventh is on the general shelf now').toContain('A week on the yacht')
    expect(text, 'and it is a charter for this family, not their own boat').not.toContain('their own boat')
    // The row's own figure is the engine's quote, rendered by the sheet's one price pipe.
    const quote = vacationPriceCents(w.seed, w.week + 3, 'yacht-week', w.profile.background)
    expect(quote).toBeGreaterThan(0)
    expect(text).toContain(formatCents(quote))
    wrapper.unmount()
  })

  it('⚠ ...and while the yacht is still building it stays a PAID line – a contract is not a boat', async () => {
    const w = rich('r29-5-ui-buildingyacht')
    buyAsset(w, 'yacht')
    const wrapper = mountVacationTab(toSnapshot(w), w.week + 3)
    const text = wrapper.text()
    expect(text).toContain('A week on the yacht')
    expect(text, 'a contract buys no free week').not.toContain('their own boat')
    wrapper.unmount()
  })

  it('⭐⭐ ...and it IS there, free, once the yacht has been delivered', async () => {
    const w = rich('r29-5-ui-yacht')
    // ⚠ THE DELIVERED SHAPE, WRITTEN DIRECTLY: an owned row with no `readyWeek` is what «delivered»
    // means (shared/protocol/profile.ts), and walking 156 real weeks in a component suite whose
    // whole point is that it is fast would buy nothing this assertion needs. The three-year wait
    // itself is ticked for real in `tests/round29-shop-elite.test.ts`.
    w.assets = [{ id: 'yacht', boughtWeek: 0, paidCents: 12_000_000_00, valueCents: 12_000_000_00 }]
    const snap = toSnapshot(w)
    expect(snap.shop.vacationIds, 'the engine granted it').toEqual(['yacht-week'])
    const wrapper = mountVacationTab(snap, w.week + 3)
    const text = wrapper.text()
    expect(text).toContain('A week on the yacht')
    // #8's own words on the price slot: the owner is told WHY it is free, not shown a bare zero.
    expect(text).toContain('free – their own boat')
    expect(text).toContain('Nowhere to be, and the sea to be nowhere on.')
    // ...and the other six are still there beside it (§3f's veto: it must not kill the ladder).
    for (const label of [
      'Staycation with friends',
      "Grandma's village",
      'Camping road-trip',
      'Seaside family hotel',
      'Sports recovery resort',
      'Elite recovery programme',
    ]) {
      expect(text, `${label} survived the yacht`).toContain(label)
    }
    wrapper.unmount()
  })
})

describe('§6 – the order asks first, and the question fits a phone', () => {
  it('⭐ the confirm names the money, the wait and the weekly bill', async () => {
    const w = rich('r29-5-ui-confirm')
    const wrapper = await mountShop(toSnapshot(w))
    await (await rowFor(wrapper, 'The yacht')).find('.shop-action').trigger('click')
    const card = wrapper.find('.dialog-card')
    expect(card.exists(), 'the confirm is up').toBe(true)
    expect(card.text()).toContain('Order The yacht for $12,000,000?')
    expect(card.text()).toContain('arrives in 156 weeks')
    expect(card.text()).toContain('$23,077 a week to keep')
    // ⚠ AND IT SAYS NOTHING ABOUT HER. The confirm is the last surface a hidden bonus could leak
    // through, and it is the one a builder is most tempted to be helpful on.
    expect(card.text().toLowerCase()).not.toMatch(/condition|fatigue|fresher/)
    wrapper.unmount()
  })

  it('⭐⭐ ...and its dismiss control is inside a 375x667 phone (CLAUDE.md\'s dialog rule)', async () => {
    // ⚠ THE ORDER'S SENTENCE IS THE LONGEST THIS DIALOG HAS EVER CARRIED – three clauses where a
    // purchase had one – which is exactly the «a dialog grows by one honest sentence at a time»
    // failure round-20 #3 shipped. So the longest one is the one measured. ⚠ P10 re-aim: the
    // long-range plane left the shelf, so the worst case ON SALE is the big yacht – the dearest
    // figure ($28,000,000) and the longest wait (208 weeks) the confirm can now be asked to hold.
    setViewport(PHONE)
    const w = rich('r29-5-ui-fit')
    const wrapper = await mountShop(toSnapshot(w), true)
    await (await rowFor(wrapper, 'The big yacht')).find('.shop-action').trigger('click')
    const card = document.querySelector('.dialog-overlay .dialog-card')!
    const dismiss = document.querySelector('.dialog-overlay .dialog-actions')!
    expect(card, 'the confirm is up').toBeTruthy()
    assertDismissReachable(card, dismiss, PHONE, 'ConfirmDialog (shop order)')
    wrapper.unmount()
  })
})
