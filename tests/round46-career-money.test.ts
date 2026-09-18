// ⭐⭐⭐ ROUND 46 #9 – WHAT A CAREER EARNED AND WHAT IT ACTUALLY COST.
//
// THE OWNER, 18.09, off his finished career: «наша математика затрат и заработков… сказала в
// альбоме, что заработано было 13млн (причем вообще не ясно откуда эта цифра), а потрачено 83млн…
// мы как-то некорректно читаем траты на теннис (о которых речь) и заработки. Эта математика
// критична и ее тоже надо починить.» He finished holding $10M+ liquid, a $20M+ fund, houses, an
// academy and a brand – a family that cannot possibly have earned $13M against $83M spent.
//
// ⚠ THE DIAGNOSIS IS MEASURED AND LIVES IN `tools/album-money-probe.ts`: on a walked career that
// buys the way he does, 59.7% of «spent» ($15,490,000 of $25,935,355) was the `'shop'` category –
// a house, the brand and the fund – money MOVED and not consumed, sitting in the same
// save under `assets` at $39,327,362. And «won» is `careerTotals.prizeCents`, the family's half of
// the prize cheques, which on that career was $17,164,973 against the $28,749,334 in HER account
// and $10,862,617 of wages, sponsors, grants and businesses that no epilogue figure ever named.
//
// WHAT THIS FILE PINS, and every arm is mutation-verified in its own comment:
//   1. the split itself – `outlayCents` is `spentCents` minus what the family still owns;
//   2. the identity, on a real walked career that really buys something;
//   3. a career that owns NOTHING is byte-identical, which is every frozen career and every bench;
//   4. a SOLD asset stays consumed – the realised loss is a real cost and must not be excused;
//   5. the break-even milestone moved WITH the figures, so the page and its gate cannot disagree;
//   6. the migrated-save clamp;
//   7. the album's slot 6 quotes the honest number.
//
// =================================================================================================
// ⭐⭐⭐ AMENDED 18.09 – RULINGS 5 AND 6, AND THE THREE ARMS THEY ADD AT THE BOTTOM OF THE FILE
// =================================================================================================
//
// RULING 5: «вообще не про теннис, мимо (машины, дома, яхты, самолеты). Мне кажется это уже не
// теннис, честно говоря. За уши можно притянуть, но лучше нет.» The version above took the PURCHASE
// out of «spent» and knowingly left the weekly UPKEEP in (docs/specs/the-reckoning-2026-09.md §2b
// called it «one imperfection, taken knowingly»); he read that note and ruled the upkeep out too.
//
// RULING 6: «А вот бренд и академия вполне могут быть и расходами и доходами, здесь не вижу
// противоречий.» So the brand and the academy get NO concession – they are deliberately absent from
// `PERSONAL_FAMILIES`, and arm 9 below is what stops a later hand quietly excusing them.
import { describe, it, expect } from 'vitest'
import {
  buyAsset,
  captureBreakEven,
  closeTournament,
  createWorld,
  sellAsset,
  skipTournament,
  tickWeek,
  toSnapshot,
  type WorldState,
} from '../src/engine/world'
import { addEvent } from '../src/engine/world/ledger'
import { careerMoney } from '../src/engine/world/reckoning'
import { careerAssetUpkeepCents, isEnterprise, isPersonalProperty, shopCatalogue } from '../src/engine/world/assets'
import { slotTheTurn } from '../src/engine/world/album'
import { rngFromSeed } from '../src/engine/rng'
import { formatCents } from '../src/shared/money'

function career(seed: string, weeks: number): { world: WorldState; openingFundsCents: number } {
  const world = createWorld(seed)
  const openingFundsCents = world.fundsCents
  const rng = rngFromSeed(world.seed)
  for (let i = 0; i < weeks; i++) {
    tickWeek(world, rng)
    if (world.pendingTournament) {
      skipTournament(world)
      closeTournament(world)
    }
  }
  return { world, openingFundsCents }
}

describe('⭐⭐⭐ round 46 #9 – the money that left, and the money that only moved', () => {
  it('⭐⭐⭐ takes what the family STILL OWNS back out of «spent», and keeps the gross beside it', () => {
    const { world } = career('r46-money-a', 40)
    const spentBefore = world.careerTotals.spentCents
    world.fundsCents += 500_000_00
    buyAsset(world, 'index-fund', 400_000_00)

    const money = careerMoney(world)
    expect(money.spentCents, 'the raw accumulator counted the deposit, as it always has').toBe(spentBefore + 400_000_00)
    expect(money.heldCents, 'and the deposit is what the family still owns, at cost').toBe(400_000_00)
    // ⚠⚠ THE ARM. Mutate `careerMoney` to return `totals.spentCents` for `outlayCents` and this line
    // goes red by exactly the deposit – measured 18.09: 6 of the 7 tests in this file turn red.
    expect(money.outlayCents, 'so nothing the family still holds is inside «spent»').toBe(spentBefore)
    expect(money.holdingsCents, 'what it is worth is a different fact and gets its own figure').toBeGreaterThan(0)
  })

  it('⭐⭐⭐ THE IDENTITY, on a career that really buys: what came in, minus what went for good, is what it ended up with', () => {
    const { world, openingFundsCents } = career('r46-money-b', 60)
    // ⚠ THE MONEY ARRIVES THROUGH THE LEDGER, NOT BY POKING THE WALLET, and that is the whole point
    // of this arm: the identity is a statement about cash that CROSSED the ledger, so a hand-injected
    // balance would be an inheritance the accumulators never saw and the equation would be false for
    // an honest reason. `addEvent` is the seam every real income uses.
    world.fundsCents += 250_000_00
    addEvent(world, { week: world.week, type: 'income', category: 'income', text: 'A windfall', amountCents: 250_000_00 })
    buyAsset(world, 'index-fund', 120_000_00)
    buyAsset(world, 'car-sensible')

    const m = careerMoney(world)
    // ⚠ THE OPENING RESERVE IS NOT AN EARNING – the family had it before week zero and it never
    // crossed the ledger, which is why it is subtracted rather than counted.
    // ⭐ RE-AIMED 18.09 BY RULING 5: the identity grew a THIRD term, because «spent» now excuses two
    // different things for two different reasons – money that is still the family's (`heldCents`)
    // and money the toys ate, which is gone but is not the tennis (`upkeepCents`). It is zero on
    // this arm (the car was bought and never held through a tick), which is exactly why the walked
    // arm at the bottom of this file exists: an identity term that is always zero proves nothing.
    expect(
      m.cameInCents - m.outlayCents,
      'cameIn − spent = wallet growth + what is held + her account + what the toys ate',
    ).toBe(world.fundsCents - openingFundsCents + m.heldCents + m.herAccountCents + m.upkeepCents)
    // ...and the two accumulators still reconcile with the wallet exactly as they always did, which
    // is what makes the line above a decomposition rather than a second, parallel arithmetic.
    expect(m.earnedCents - m.spentCents).toBe(world.fundsCents - openingFundsCents)
  })

  it('⭐⭐ a family that owns NOTHING reads byte-identically – every frozen career, every bench', () => {
    const { world } = career('r46-money-c', 60)
    expect(world.assets, 'the fixture really bought nothing').toHaveLength(0)
    const m = careerMoney(world)
    expect(m.heldCents).toBe(0)
    expect(m.outlayCents, 'so «spent» is the accumulator, unchanged').toBe(world.careerTotals.spentCents)
    expect(m.holdingsCents).toBe(0)
  })

  it('⭐⭐⭐ a SOLD asset is consumed again, and the realised loss is the cost – no bookkeeping needed', () => {
    const { world } = career('r46-money-d', 40)
    world.fundsCents += 300_000_00
    buyAsset(world, 'car-sensible')
    const boughtFor = world.assets[0].paidCents
    expect(careerMoney(world).outlayCents, 'held while it is held').toBe(world.careerTotals.spentCents - boughtFor)

    // ...five years on the car is worth less, and selling it realises that loss for good.
    for (let i = 0; i < 5; i++) {
      const rng = rngFromSeed(`${world.seed}:hold:${i}`)
      for (let w = 0; w < 52; w++) {
        tickWeek(world, rng)
        if (world.pendingTournament) {
          skipTournament(world)
          closeTournament(world)
        }
      }
    }
    const soldFor = world.assets[0].valueCents
    expect(soldFor, 'the car really did lose money – §3b of the shop spec').toBeLessThan(boughtFor)
    sellAsset(world, 'car-sensible')

    const m = careerMoney(world)
    expect(m.heldCents, 'nothing is held any more').toBe(0)
    // ⚠⚠ THE ARM THAT MATTERS: the purchase stays inside `spentCents` and the proceeds inside
    // `earnedCents`, so the PAIR nets to the loss. Excusing a sold asset would have made a family
    // that churned depreciating things look as though it had spent nothing at all.
    // ⭐ AND SINCE RULING 5 THIS LINE PINS THE UPKEEP RESIDUAL TOO, which is the honest thing to
    // measure rather than to promise. Five years of servicing that car really was charged, and once
    // the row is gone from `assets` there is nothing left to replay it from – so those cents stay
    // inside «spent», and `outlayCents === spentCents` says so exactly. The miss is in the
    // conservative direction by construction: this can only ever excuse too little.
    expect(m.upkeepCents, 'a sold thing leaves nothing to replay').toBe(0)
    expect(m.outlayCents, 'so the whole purchase – and its five years of upkeep – is spend again').toBe(m.spentCents)
    expect(m.cameInCents - m.outlayCents, 'and the loss is what the household is down by').toBeLessThan(
      m.cameInCents - (m.spentCents - boughtFor + soldFor),
    )
  })

  it('⭐⭐⭐ the break-even milestone moved WITH the figures – a deposit can no longer hold the turn away', () => {
    const { world } = career('r46-money-e', 30)
    world.careerTotals = { earnedCents: 900_00, spentCents: 500_00, prizeCents: 600_00, weeksLostToInjury: 0 }
    world.milestones = world.milestones.filter((m) => m.type !== 'break-even')
    captureBreakEven(world)
    expect(world.milestones.filter((m) => m.type === 'break-even' && m.kind === 'career'), 'it crosses').toHaveLength(1)

    // Now the same career, with the same prize money, having put $400 into a fund the week before.
    const again = career('r46-money-e', 30).world
    again.careerTotals = { earnedCents: 900_00, spentCents: 500_00, prizeCents: 600_00, weeksLostToInjury: 0 }
    again.milestones = again.milestones.filter((m) => m.type !== 'break-even')
    again.fundsCents += 5_000_00
    buyAsset(again, 'index-fund', 1_000_00)
    expect(again.careerTotals.spentCents, 'the raw total really did pass the prize money').toBeGreaterThan(
      again.careerTotals.prizeCents,
    )
    captureBreakEven(again)
    // ⚠⚠ THE ARM. Point `captureBreakEven`'s career arm back at `t.spentCents` and this goes red:
    // measured 1 failing assertion here, and the page's own figures would then be claiming a
    // crossing the milestone denied. That disagreement is the whole reason the two read one fold.
    expect(
      again.milestones.filter((m) => m.type === 'break-even' && m.kind === 'career'),
      'the deposit is not a cost, so the turn still happened',
    ).toHaveLength(1)
  })

  it('⚠ a migrated save whose totals under-count cannot print a negative spend', () => {
    const { world } = career('r46-money-f', 30)
    world.fundsCents += 300_000_00
    buyAsset(world, 'index-fund', 200_000_00)
    // The v38 -> v39 step reconstructed `careerTotals` off a ledger already pruned to sixty weeks and
    // calls itself «a documented undercount for an old one», so a real save can hold more than it
    // remembers paying for.
    world.careerTotals.spentCents = 1_000_00
    expect(careerMoney(world).outlayCents, 'floored, never negative').toBe(0)
    expect(careerMoney(world).heldCents, 'and the holding still says what it cost').toBe(200_000_00)
  })

  it('⭐⭐ the album\'s slot 6 quotes the honest number, and so does the snapshot the screens read', () => {
    const { world } = career('r46-money-g', 40)
    world.fundsCents += 500_000_00
    buyAsset(world, 'index-fund', 300_000_00)
    const m = careerMoney(world)

    const fact = slotTheTurn(world).fact ?? ''
    expect(fact, 'the page says what left for good').toContain(formatCents(m.outlayCents))
    expect(fact, 'and never the figure that counts the fund as spending').not.toContain(formatCents(m.spentCents))

    const snap = toSnapshot(world)
    expect(snap.careerMoney, 'the same fold reaches every screen through one field').toEqual(m)
    expect(snap.careerTotals, 'and the raw accumulators are untouched on the wire').toEqual(world.careerTotals)
  })
})

// =================================================================================================
// ⭐⭐⭐ RULING 5, 18.09 – THE UPKEEP IS NOT THE TENNIS EITHER
// =================================================================================================

/** Every `Upkeep: …` row the till actually wrote, as a positive magnitude – the INDEPENDENT control
 *  for `careerAssetUpkeepCents`, which replays the same arithmetic instead of reading it.
 *
 *  ⚠ ONLY VALID OVER A SHORT WALK, and that is measured rather than assumed. `world.events` prunes
 *  (`EVENTS_CAP`), so a long career silently loses its earliest upkeep rows – walked 120 weeks, a
 *  car whose 120 charges really happened has 62 rows left. Forty weeks keeps all forty. */
function upkeepRowsCents(world: WorldState): number {
  return world.events
    .filter((e) => (e.text ?? '').startsWith('Upkeep:') && e.amountCents !== undefined)
    .reduce((a, e) => a + -(e.amountCents ?? 0), 0)
}

function hold(world: WorldState, weeks: number, tag: string): void {
  const rng = rngFromSeed(`${world.seed}:${tag}`)
  for (let w = 0; w < weeks; w++) {
    tickWeek(world, rng)
    if (world.pendingTournament) {
      skipTournament(world)
      closeTournament(world)
    }
  }
}

describe('⭐⭐⭐ round 46 #9, ruling 5 – what the toys cost to keep is not what the tennis cost', () => {
  it('⭐⭐⭐ REPLAYS THE TILL EXACTLY, for a thing bought off the shelf and for a thing commissioned', () => {
    // ⚠ TWO KINDS OF RUNG AND THEY DO NOT START ON THE SAME WEEK – `careerAssetUpkeepCents`' own
    // note. A car arrives through a player command on a week already billed; a boat ARRIVES inside a
    // tick, before that week's bill. One arm would have passed on one convention and hidden the
    // other, which is why both are here.
    for (const [id, weeks] of [
      ['car-sensible', 40],
      ['boat-launch', 72],
    ] as const) {
      const world = createWorld(`r46-upkeep-${id}`)
      hold(world, 5, 'pre')
      world.fundsCents += 50_000_000_00
      buyAsset(world, id)
      hold(world, weeks, 'hold')
      const charged = upkeepRowsCents(world)
      expect(charged, `${id} really was billed something`).toBeGreaterThan(0)
      // ⚠⚠ THE ARM, AND IT IS THE ARM THAT CAUGHT THE DEFECT rather than one written after the
      // fact: the first fold started BOTH kinds at 0 and over-counted the walked probe career by
      // $693, which is three cars' first week to the cent. Measured 18.09, both mutations run:
      //   both kinds start at 0  -> RED [2 tests, 2 assertions] – this one by $57.69 on the car,
      //                             and the sold-asset arm upstairs, which buys a car and reads
      //                             «spent» before a single tick has billed it
      //   both kinds start at 1  -> RED [1 test, 1 assertion] – this one by $1,038.46 on the boat
      expect(careerAssetUpkeepCents(world), `${id}: the replay is the till, to the cent`).toBe(charged)
    }
  })

  it('⭐⭐⭐ takes that upkeep out of «spent», and the identity keeps its books with the third term', () => {
    const world = createWorld('r46-upkeep-identity')
    const openingFundsCents = world.fundsCents
    hold(world, 5, 'pre')
    world.fundsCents += 4_000_000_00
    addEvent(world, { week: world.week, type: 'income', category: 'income', text: 'A windfall', amountCents: 4_000_000_00 })
    buyAsset(world, 'car-unreasonable')
    hold(world, 60, 'hold')

    const m = careerMoney(world)
    expect(m.upkeepCents, 'sixty weeks of servicing the unreasonable one is a real bill').toBeGreaterThan(0)
    // ⚠⚠ THE ARM. Return `upkeepCents: 0` from `careerMoney` – i.e. the shipped pre-ruling
    // behaviour – and this test goes red on the line above: measured 18.09, RED [1 test,
    // 1 assertion]. ⚠ NOTE WHAT THAT MEASUREMENT ALSO SAYS: the IDENTITY below survives the
    // mutation, because a decomposition with one term set to zero is still a decomposition. An
    // identity is a proof that the parts add up, never a proof that the parts are the right ones –
    // which is why the `toBeGreaterThan(0)` above it is the assertion doing the work.
    expect(m.outlayCents, 'so «spent» is the gross less what is held AND less what the toys ate').toBe(
      m.spentCents - m.heldCents - m.upkeepCents,
    )
    expect(
      m.cameInCents - m.outlayCents,
      'the identity, with the term that is no longer zero: growth + held + hers + upkeep',
    ).toBe(world.fundsCents - openingFundsCents + m.heldCents + m.herAccountCents + m.upkeepCents)
  })

  it('⚠⚠ RULING 6 – the brand and the academy are NOT personal property, so nothing excuses them', () => {
    // «А вот бренд и академия вполне могут быть и расходами и доходами, здесь не вижу противоречий.»
    // ⚠⚠ THIS IS A FORWARD GUARD AND THE MEASUREMENT SAYS SO OUT LOUD. Every rung that charges
    // upkeep today happens to be personal property, so deleting the family filter inside
    // `careerAssetUpkeepCents` leaves this file **GREEN** – measured 18.09, RED [0]. That is not a
    // failure of the arm, it is the reason the arm is written about the CLASSIFICATION instead of
    // about a number: the filter earns its place the day somebody gives the academy a wage bill,
    // and on that day no figure-based pin could tell the difference either.
    for (const item of shopCatalogue()) {
      if (!isEnterprise(item)) continue
      expect(isPersonalProperty(item), `${item.id} is a business the family built, not a toy`).toBe(false)
    }
    // ...and every rung on the shelf is classified, so a new one cannot land nowhere. `investment`
    // is the third bucket and is `heldCents`' business, never `upkeepCents`'.
    for (const item of shopCatalogue()) {
      const buckets = [isPersonalProperty(item), isEnterprise(item), item.family === 'investment'].filter(Boolean)
      expect(buckets, `${item.id} lands in exactly one bucket`).toHaveLength(1)
    }
    // The measured consequence, on the walked shelf of his own sentence (`tools/album-money-probe.ts
    // --arm 1`): $12,250,000 of enterprise cost stays inside «spent», against $6,360,802 of upkeep
    // that leaves it.
    const world = createWorld('r46-enterprise')
    hold(world, 5, 'pre')
    world.fundsCents += 3_000_000_00
    buyAsset(world, 'merch-brand')
    const paid = world.assets[0].paidCents
    hold(world, 40, 'hold')
    const m = careerMoney(world)
    expect(m.upkeepCents, 'a brand has no crew, so there is nothing to excuse and nothing is').toBe(0)
    expect(m.heldCents, 'its cost is money the family still owns, which is a different concession').toBe(paid)
  })
})

// =================================================================================================
// ⭐⭐⭐ RULING A, 18.09 – THE RECKONING IS TENNIS ONLY, AND THAT IS WHERE RULING 6 WENT
// =================================================================================================
//
// ⚠⚠ RE-AIMED 18.09 BY RULING A, WHICH SUPERSEDES RULING 6 OF THE SAME DAY. The block that stood
// here was about «А вот бренд и академия вполне могут быть и расходами и доходами, здесь не вижу
// противоречий» and pinned BOTH sides of the businesses inside the week arm. He then read the shape
// it produced and ruled the other way:
//
// > «давай оставим только расходы на теннис и призовые с тенниса тоже здесь. А отдельной строчкой
// > напишем целиковый срез портфеля семьи по деньгам в кошельке и всем магазине на круг – это будет
// > проще?»
//
// ⚠ THE FIRST TWO ARMS BELOW ARE THE OLD TWO WITH THEIR SIGNS TURNED OVER, and they are kept rather
// than deleted because the week arm has now been ruled TWICE in one day and a test that only knows
// the second ruling cannot tell a future reader that the first one existed. The third arm did not
// move at all: the career arm was never charging an enterprise, which is the measurement that made
// ruling A cheap – see `careerMoney`'s own note and docs/specs/the-reckoning-2026-09.md §7.
describe('⭐⭐⭐ round 46 #9, ruling A – the week arm asks about the tennis and nothing else', () => {
  /** A career five weeks in, with no break-even row and no ledger row for THIS week, so an arm can
   *  state the whole of the week it is testing. */
  function freshWeek(seed: string): WorldState {
    const world = createWorld(seed)
    hold(world, 5, 'pre')
    world.milestones = world.milestones.filter((m) => m.type !== 'break-even')
    world.financeWeeks = world.financeWeeks.filter((w) => w.week !== world.week)
    return world
  }

  const weekRows = (world: WorldState): number =>
    world.milestones.filter((m) => m.type === 'break-even' && m.kind === 'week').length

  it('⭐⭐⭐ RE-AIMED BY RULING A – a merch cheque is NOT the tennis paying, so it cannot turn the week', () => {
    const world = freshWeek('r46-rA-week')
    addEvent(world, { week: world.week, type: 'income', category: 'prize', text: 'A cheque', amountCents: 1_000_00 })
    addEvent(world, { week: world.week, type: 'expense', category: 'coaching', text: 'The coach', amountCents: -3_000_00 })
    captureBreakEven(world)
    expect(weekRows(world), 'the prize alone did not cover the week').toBe(0)

    // ...and the same week with the brand's own cheque on it, five times the shortfall.
    addEvent(world, { week: world.week, type: 'income', category: 'business', text: 'Merch', amountCents: 5_000_00 })
    captureBreakEven(world)
    // ⚠⚠ THE ARM, AND IT IS THE OLD ARM WITH ITS SIGN TURNED OVER. Put `business` back into the week
    // arm's numerator – i.e. ruling 6's behaviour, which is what this line asserted until 18.09 – and
    // this goes red: measured 18.09, RED [1 test, 1 assertion].
    expect(weekRows(world), 'merch money is not prize money, so the week still did not turn').toBe(0)

    // ...and the same week with the same money arriving as PRIZE does turn it, which is what says
    // the arm is reading the category rather than refusing every large number.
    addEvent(world, { week: world.week, type: 'income', category: 'prize', text: 'A bigger cheque', amountCents: 5_000_00 })
    captureBreakEven(world)
    expect(weekRows(world), 'the tennis paying for the tennis is the whole question').toBe(1)
  })

  it('⭐⭐ RE-AIMED BY RULING A – ...and founding the brand is not a cost of the week\'s tennis either', () => {
    const world = freshWeek('r46-rA-cost')
    world.fundsCents += 3_000_000_00
    addEvent(world, { week: world.week, type: 'income', category: 'prize', text: 'A cheque', amountCents: 100_000_00 })
    addEvent(world, { week: world.week, type: 'expense', category: 'coaching', text: 'The coach', amountCents: -1_000_00 })
    buyAsset(world, 'merch-brand')
    expect(world.assets[0].paidCents, 'the founding really did cost more than the week won').toBeGreaterThan(100_000_00)
    captureBreakEven(world)
    // ⚠⚠ THE ARM, THE OTHER SIGN TURNED OVER. Restore `costs += enterprisePaidInWeekCents(...)` – the
    // line ruling 6 put in and ruling A took out – and this goes red: measured, RED [1 test,
    // 1 assertion]. Both sides of ruling 6 left together, which is what keeps the arm coherent:
    // charging a purchase while refusing its income is the one-sided reading nobody asked for.
    expect(weekRows(world), 'the week\'s tennis was covered; what the family BOUGHT is a different question').toBe(1)
  })

  it('⚠⚠ the CAREER arm is UNCHANGED – it never charged an enterprise, which is why ruling A was cheap', () => {
    // A family that founded the brand and is still short of covering everything else. If the career
    // arm ever starts charging the enterprise, this career stops crossing – which is the regression
    // the measurement above forbids until the income can be set beside the cost.
    const world = freshWeek('r46-r6-career')
    world.fundsCents += 3_000_000_00
    buyAsset(world, 'merch-brand')
    const paid = world.assets[0].paidCents
    world.careerTotals = { earnedCents: 900_00, spentCents: paid + 500_00, prizeCents: 600_00, weeksLostToInjury: 0 }
    captureBreakEven(world)
    expect(
      world.milestones.filter((m) => m.type === 'break-even' && m.kind === 'career'),
      'the brand is still a holding to this arm, so the turn still happened',
    ).toHaveLength(1)
    expect(careerMoney(world).outlayCents, 'and «spent» still excuses what it cost').toBe(500_00)
  })
})

// =================================================================================================
// ⭐⭐⭐ RULING A, 18.09 – THE PORTFOLIO IS ITS OWN LINE
// =================================================================================================
//
// > «А отдельной строчкой напишем целиковый срез портфеля семьи по деньгам в кошельке и всем
// > магазине на круг – это будет проще?»
//
// ⚠ IT IS A POINT-IN-TIME READ, which is the whole reason it needed no schema: the wallet and every
// shelf row at value are both on the save today. These arms pin the composition, the two things that
// are deliberately NOT in it, and the fact that «spent» did not move a cent under this ruling.
describe('⭐⭐⭐ round 46 #9, ruling A – the family\'s portfolio, and the reckoning left tennis-only', () => {
  it('⭐⭐⭐ is the wallet plus every shelf row AT VALUE – the fund included, without being named', () => {
    const { world } = career('r46-portfolio-a', 40)
    world.fundsCents += 500_000_00
    buyAsset(world, 'index-fund', 400_000_00)
    hold(world, 20, 'grow')

    const m = careerMoney(world)
    expect(m.holdingsCents, 'the fund is an ordinary holding and carries its own worth').toBeGreaterThan(0)
    // ⚠⚠ THE ARM, BOTH HALVES, MEASURED 18.09. Return `world.fundsCents` alone (drop
    // `+ holdingsCents`) and this line goes red by the whole fund – RED [1 test, 1 assertion].
    // Return `holdingsCents` alone and the wallet goes missing from all three arms of this block –
    // RED [3 tests, 3 assertions]. Both halves are load-bearing, which is what «кошелёк И магазин»
    // says.
    expect(m.portfolioCents, 'the wallet and the shelf, at this week\'s worth').toBe(
      world.fundsCents + m.holdingsCents,
    )
    // ...and it is the WORTH and not the cost, which is the one thing that makes it a portfolio at
    // all: a fund that has grown says so here while `heldCents` keeps saying what went in.
    expect(m.portfolioCents, 'at value, never at cost').not.toBe(world.fundsCents + m.heldCents)
  })

  it('⚠⚠ HER account is NOT in it, and the two figures on the page are therefore distinct', () => {
    const { world } = career('r46-portfolio-b', 40)
    world.fundsCents += 200_000_00
    world.kidFundsCents = 3_000_000_00
    const m = careerMoney(world)
    // He asked for the FAMILY's portfolio and named the wallet and the shop. Her account is the
    // figure this whole round exists because he could not place it, and the epilogue gives it a row
    // of its own – folding it in here would print the same cents twice on one list.
    expect(m.herAccountCents).toBe(3_000_000_00)
    expect(m.portfolioCents, 'the daughter\'s money is hers, not the family\'s portfolio').toBe(world.fundsCents)
  })

  it('⚠ a family under water reads NEGATIVE – the clamp above it is for a migrated save, not for tidiness', () => {
    const { world } = career('r46-portfolio-c', 30)
    world.fundsCents = -40_000_00
    expect(world.assets, 'nothing on the shelf to soften it').toHaveLength(0)
    // ⚠⚠ THE ARM. Wrap the term in `Math.max(0, …)` – the shape `outlayCents` uses – and this goes
    // red: measured, RED [1 test, 1 assertion]. `outlayCents`' floor exists because the v38 -> v39
    // step documents itself as an undercount; a debt is not an undercount, it is the answer.
    expect(careerMoney(world).portfolioCents, 'a debt is a true reading of a portfolio').toBe(-40_000_00)
  })

  it('⭐⭐⭐ «spent» DID NOT MOVE under ruling A – the enterprise was never in it', () => {
    // ⚠⚠ THIS IS THE ARM THAT MAKES RULING A A MEASUREMENT RATHER THAN A STORY. His sentence asks for
    // the brand and the academy to leave «spent»; they had already left it, because `heldCents` folds
    // EVERY `assets` row with no family filter and has done since the fix shipped (ruling 6's own
    // note calls it «`heldCents`' one concession»). Walked on `tools/album-money-probe.ts`, both arms
    // read the same `outlayCents` before and after – $10,445,355 and $9,997,902.
    const world = createWorld('r46-rA-spent')
    hold(world, 5, 'pre')
    world.fundsCents += 3_000_000_00
    addEvent(world, { week: world.week, type: 'income', category: 'income', text: 'A windfall', amountCents: 3_000_000_00 })
    const spentBefore = world.careerTotals.spentCents
    buyAsset(world, 'merch-brand')
    const paid = world.assets[0].paidCents
    expect(paid, 'the brand really did cost something').toBeGreaterThan(0)
    expect(world.careerTotals.spentCents, 'and the raw accumulator counted it, as it always has').toBe(
      spentBefore + paid,
    )
    const m = careerMoney(world)
    expect(m.heldCents, 'the enterprise is a holding like any other – no family filter here').toBe(paid)
    expect(m.outlayCents, 'so founding it never was inside «spent», before this ruling or after').toBe(spentBefore)
  })
})
