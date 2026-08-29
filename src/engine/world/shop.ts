// ⭐⭐ THE SHOP – the tab, static prices, buy / own / sell, and since round 29 #5 the storeys above.
// docs/specs/the-shop-2026-08.md §2, §3a-c, §5 and §11 row 1 (slice 1); §3f and §3g (round 29 #5:
// «В магазине всё ещё не хватает яхт, самолётов и стойки академии»). Still NOT here, and named so
// the next builder does not have to diff two files to find out: no drift (§4, slice 2), no shock, no
// freeze, no broker (§6), no charity (§8).
//
// ⚠⚠ WHOSE MONEY THIS IS, because the spec had to be corrected on it once already (§1, the owner:
// «Мы же делаем инвестиции для родителя, ты помнишь?»). The shelf belongs to the PARENT. Nothing on
// it is bought for her – the two items that were about her are gone from the shelf entirely (§3d
// became a birthday gift, §3e was struck). This module writes `world.assets`, `world.fundsCents` and
// its ledger rows, and reads nothing about the girl at all.
//
// ⚠⚠ AND ROUND 29 #5 AMENDED THE SECOND HALF OF THAT SENTENCE, ON THE OWNER'S OWN CORRECTION, so it
// is written out rather than quietly left standing. Slice 1's header said «nothing on it touches her
// radar, her condition, her kit or her calendar». The PLANE now touches two of those, and it is his
// ruling that it should: «Самолёт не её, а родителей =) Теоретически может вполне резать косты на
// перелеты до соревнований... По усталости по аналогии с кортом может 1 накинуть». It is still not
// hers – it is the FAMILY's aeroplane, and what it buys is cheaper logistics and a slightly kinder
// week on the road. ⚠ NEITHER EFFECT IS IN THIS FILE: the fare is `world/sponsors.ts` and the rest
// week is `world/medical.ts`, both reading the one predicate in `world/assets.ts`. Her radar and her
// kit are untouched and must stay so.
//
// ⚠⚠ ZERO DRAWS, ON MAIN OR ANYWHERE, AND SLICE 1 IS WHERE THAT IS EASIEST TO GUARANTEE: this file
// imports no RNG and takes no `Rng` argument, which is the guarantee rather than a claim about it.
// «Static» here means DETERMINISTIC, not frozen – every value is arithmetic on `boughtWeek`, so a
// car still loses its 9% a season and the ledger still has a loss to show. The frozen MAIN capture
// (41550 / e6b0c709) cannot see any of this.
// ⚠ AND THE DOOR SLICE 2 WALKS THROUGH IS ALREADY CUT. §4's drift draws on
// `rngFromSeed(`${seed}:asset:${assetId}:${week}`)` and never MAIN. `revalueAssets` below is the one
// writer of `valueCents` and takes the world alone; slice 2 adds the sub-stream inside it, at one
// call site, and every other line in this file and on the screen is unchanged. That is why the value
// is a STORED field written by a tick phase rather than a getter the screen calls: a getter would
// have to be given a stream, and a stream on a read path is how a purchase moves the world's dice.
import { guardNotEndedForGood } from './endings'
import { addEvent } from './ledger'
import { formatCents } from '../../shared/money'
import { weekLabel } from '../../shared/dates'
import type { OwnedAsset, ShopRowView, ShopView } from '../../shared/protocol'
import type { WorldState } from '../world'
// ⚠⚠ THE PURE READS LEFT THIS FILE AT ROUND 29 #5 AND COME STRAIGHT BACK OUT OF IT. `world/assets.ts`
// is a LEAF – catalogue and a type, nothing else – and it exists because two files that may NOT
// import this one now need the shelf's answers: the plane's fare (`world/sponsors.ts`) and the
// plane's travelling week (`world/medical.ts`). This file imports `./endings`, `endings` imports
// `./entries`, and `entries` imports `./medical`, so the cycle is real and was traced before the
// split. Every name below is re-exported under the historical convention, so `engine/world`, the
// tests that import `world/shop` directly and every screen are untouched.
import {
  assetDelivered,
  assetUpkeepCents,
  assetValueCents,
  deliveredAssets,
  grantedVacationIds,
  ownedAssets,
  ownsDeliveredOfFamily,
  shopCatalogue,
  shopItem,
  weeklyAssetUpkeepCents,
  type ShopItem,
} from './assets'
export {
  assetDelivered,
  assetUpkeepCents,
  assetValueCents,
  deliveredAssets,
  grantedVacationIds,
  ownedAssets,
  ownsDeliveredOfFamily,
  shopCatalogue,
  shopItem,
  weeklyAssetUpkeepCents,
}
export type { ShopItem }

// ⭐⭐⭐ THE GATE STOOD HERE AND ROUND 29 PART TWO #6 DELETED IT – HIS RULING, 29.08.
//
// «магазин открыт всегда с начала игры.»
//
// ⚠⚠ WHAT WENT, IN FULL, SO THE DECISION IS FINDABLE. `shopUnlocked(world)` returned
// `activeLadderOf(world) === 'wta'` – §2's «visible from the first week of the professional era and
// never in the junior years» – and `SHOP_LOCKED_DETAIL` was the one sentence both the screen and
// `buyAsset` used to refuse ("The shelf opens with her professional career – her first counting
// W-series result unlocks it."). The `ShopView.unlocked` / `lockedDetail` pair went with them, along
// with the screen's locked arm and `buyAsset`'s first guard.
//
// ⚠ DELETED RATHER THAN LEFT RETURNING TRUE, and it is `ECONOMY.savings`' own precedent one round
// earlier, verbatim in its situation: «a live balance constant that nothing charges is a decision
// nobody can find … and the next reader would wire it back up believing it was a tuning knob». A
// predicate that cannot be false and a refusal string nothing prints are the same hazard. The gate
// is recoverable from git and from docs/rounds/round-29.md; it is not recoverable from a dead field.
//
// ⭐⭐ AND IT CLOSES ROUND 29's ASK 12b, WHICH IS WHY HE RULED ON IT. #12 removed the current
// account's automatic interest and measured the loss at its cleanest on the JUNIOR sink (14→16,
// −$1,954 a career, 18 of 18 presets down) – the exact horizon in which the shelf that was supposed
// to replace it was shut. «There is now no way to earn yield at all» was the caveat; this is the
// answer to it, and part two #3's rate is the other half.
//
// ⚠ NOTHING ELSE MOVED THROUGH THIS DOOR. `masseurUnlocked` (world/masseur.ts) keeps the SAME
// professional-era predicate this one used to share – his ruling is about the shop, and a seat on
// the staff is not a thing on a shelf. This file's `./ladder` import went with the gate, because
// the gate was its only reader; the shelf now knows nothing about which table she plays on.
//
// ⚠ SELLING WAS NEVER GATED and still is not: §4's freeze (`sellableAsset`) remains the one thing
// allowed to stop a sale, which is now the only door in this file.

/** THE ONE WRITER OF `valueCents`, run at the top of every tick (world/phaseObligations.ts).
 *
 *  ⚠ IT IS A TICK PHASE AND NOT A GETTER, and §5 is the reason: two sides asking different functions
 *  about one question is this repo's most-repeated defect. The screen reads the field, the ledger
 *  reads the field, the sale price IS the field – there is exactly one arithmetic and it happens
 *  here. An item whose rung has been retired from the catalogue keeps its last value rather than
 *  being re-priced by a rate that no longer exists.
 *
 *  ⚠ IDEMPOTENT AND ORDER-FREE: the value is a function of (paidCents, boughtWeek, week), not of the
 *  previous value, so running it twice in a week or skipping a week changes nothing. That stops
 *  being true in slice 2, when drift accumulates – which is exactly when a single named writer with
 *  a single call site starts earning its keep.
 *
 *  ZERO DRAWS. Defensive `??=` for the hand-built probe worlds in tests that predate the field, the
 *  courtesy `accrueFinance` extends to `careerTotals`. */
export function revalueAssets(world: WorldState): void {
  world.assets ??= []
  for (const owned of world.assets) {
    const item = shopItem(owned.id)
    if (!item) continue
    // ⭐ ROUND 29 #11 – off the REBASED basis and its own clock when the holding has been topped up,
    // and off the original purchase when it has not. The `??` pair is the whole compatibility story:
    // absent means «never topped up», which is what every save written before that field means, and
    // it evaluates to exactly the arithmetic this line has always done (see `OwnedAsset.basisCents`).
    owned.valueCents = assetValueCents(
      item,
      owned.basisCents ?? owned.paidCents,
      world.week - (owned.basisWeek ?? owned.boughtWeek),
    )
  }
}

/** ⭐⭐ ROUND 29 #5, §3f – THE WEEK THE THING ARRIVES, and the ONE remover of `readyWeek`.
 *
 *  THE OWNER: «купил и ждешь пока будет готово, яхты строят несколько лет.»
 *
 *  ⚠ `>=` AND NOT `===`, because the multi-week skip spends several weeks in one press (round 29 #6
 *  widened it to a real span) and a delivery that only fired on an exact match would be missed by a
 *  career that pressed it. The key is then GONE, which is what makes this idempotent and what makes
 *  «absent = delivered» true for every row in the file rather than for old rows only.
 *
 *  ⚠ IT SPEAKS, and one line is the whole of it. A three-year wait that ended in silence would be
 *  this repo's «you paid and you could not tell» again, on the largest purchase in the game; an
 *  `entry` row is what the ledger already uses for a fact with no money attached (`bookVacation`'s
 *  own second row). No cash moves here – the money left on the order.
 *
 *  ⚠ IT RUNS BEFORE `revalueAssets`, and before the week's bills, so the week a boat arrives is the
 *  first week it depreciates and the first week it is charged for. ZERO DRAWS. */
export function deliverAssets(world: WorldState): void {
  world.assets ??= []
  for (const owned of world.assets) {
    if (owned.readyWeek === undefined || world.week < owned.readyWeek) continue
    delete owned.readyWeek
    addEvent(world, {
      week: world.week,
      type: 'entry',
      text: `Delivered: ${shopItem(owned.id)?.label ?? owned.id}`,
    })
  }
}

/** ⭐ CAN THIS BE SOLD THIS WEEK? It exists because it is the seam §4's FREEZE widens («the asset
 *  cannot be sold for an indefinite stretch») and the seam slice 3's contract widened at round 29
 *  #5 – §3f: «the money leaves on order, the thing arrives N weeks later ... and the contract
 *  cannot be sold», which is «the freeze mechanic arriving early and by consent rather than as a
 *  surprise».
 *
 *  ⚠⚠ AND IT CANNOT STRAND ANYBODY, which is the check §4's own acceptance demands of a freeze («it
 *  may never be the reason a family goes bankrupt»). The un-sellable weeks are exactly the weeks the
 *  thing costs nothing: `weeklyAssetUpkeepCents` charges DELIVERED rungs only. A family that has
 *  ordered a yacht it can no longer afford is out the deposit and nothing more per week, and the
 *  week the boat lands it may sell it. */
export function sellableAsset(_world: WorldState, owned: OwnedAsset): boolean {
  return assetDelivered(owned)
}

/** ⭐ BUY. `stakeCents` is ignored on a 'fixed' rung and required on an 'open' one (§3a's minimums).
 *
 *  ⚠⚠ `guardNotEndedForGood`, NOT `guardNotEnded`, AND THE SPEC RULES IT EXPLICITLY (§5): «a shop
 *  command is about the FAMILY'S OWN money, so it belongs to `guardNotEndedForGood` … and NOT to the
 *  tour-command guard that refuses inside the college freeze.» That is what makes the college years
 *  shoppable, which the backlog's §0a argues is the shop's best moment – four years where the wallet
 *  rests and the parent has no weekly job to do. A terminal latch still refuses with the unchanged
 *  sentence. ⚠ This is the FOURTH member of a list `world/constants.ts` describes as short on
 *  purpose; the note there has been re-aimed rather than widened, and the reason it may grow at all
 *  is that a purchase out of the family's own pocket is not a decision that reaches the girl.
 *
 *  ⚠ EVERY REFUSAL IS RE-VALIDATED HERE because the worker is not the gate (CLAUDE.md invariant 1):
 *  a tab left open on a junior career, or on a rung already owned, must not be able to spend.
 *
 *  ZERO DRAWS: state, arithmetic and one ledger row. */
export function buyAsset(world: WorldState, itemId: string, stakeCents?: number): void {
  guardNotEndedForGood(world)
  // ⚠ THE PROFESSIONAL-ERA REFUSAL STOOD HERE AND PART TWO #6 DELETED IT (his ruling, the block at
  // the top of this file). A terminal latch still refuses; a fourteen-year-old's family does not.
  const item = shopItem(itemId)
  if (!item) throw new Error('There is nothing like that on the shelf')
  world.assets ??= []
  const held = world.assets.find((a) => a.id === itemId)
  // ⭐⭐ ROUND 29 #11 – AN OWNED 'open' RUNG IS A TOP-UP, AND ONLY A 'fixed' ONE STILL REFUSES.
  //
  // THE OWNER: «Index fund хотелось бы иметь возможность докупать, предполагаю, что Savings deposit
  // будет вести себя так же – тоже надо исправить.» Both, and the catalogue already draws the line
  // he is drawing: `stake: 'open'` is «a product you choose an amount for» and `'fixed'` is «a thing
  // with one price» (ECONOMY.shop's own words). You can put more money into a deposit; you cannot
  // put more money into a car. So the predicate is the STAKE and never a list of two ids – a third
  // investment added to the catalogue tomorrow tops up because of what it is, not because somebody
  // remembered to name it here.
  //
  // ⚠ NO NEW COMMAND, DELIBERATELY. `world/constants.ts` describes the guard list this belongs to as
  // «short on purpose», and a top-up is the same decision as the opening stake, out of the same
  // wallet, through the same validation – so it is the same command. A `topUpAsset` beside `buyAsset`
  // would be two functions that must agree about a minimum, a wallet check and a ledger row.
  if (held && item.stake !== 'open') throw new Error('The family already owns that')
  // ⭐⭐ ROUND 29 #5, §3g – A STAGE CANNOT BE BUILT BEFORE THE ONE UNDER IT. «Cost: $8–15M, in STAGES
  // rather than one press – land, courts, the building, the staff. Each stage is a decision and a
  // bill, and a half-built academy is a real state the player can sit in.»
  //
  // ⚠ THE CHAIN IS DATA AND NOT A LIST HERE (`ShopItem.requiresId`), for round 29 #11's own reason
  // one paragraph down: a fifth stage added to the catalogue tomorrow is ordered because of what it
  // says about itself, not because somebody remembered to name it in this function. Every rung with
  // no `requiresId` – which is the whole of the rest of the shelf – walks straight past.
  if (item.requiresId && !world.assets.some((a) => a.id === item.requiresId)) {
    throw new Error(`${shopItem(item.requiresId)?.label ?? 'The stage before it'} has to come first`)
  }

  // ⚠ THE AMOUNT IS DECIDED BEFORE THE WALLET IS ASKED, and a 'fixed' rung ignores whatever the
  // caller sent rather than refusing it: the price of a car is the catalogue's, and a screen that
  // passed a number would otherwise be able to name its own.
  const paidCents = item.stake === 'open' ? Math.floor(stakeCents ?? 0) : item.entryCents
  // ⚠ ONE MINIMUM, NOT TWO. A top-up is held to the same floor as the opening stake because that
  // floor is already the sentence on screen («How much, from $5,000») and a second, smaller
  // threshold would be a balance number no player could find and no screen states.
  if (item.stake === 'open' && paidCents < item.entryCents) {
    throw new Error(`That one starts at ${formatCents(item.entryCents)}`)
  }
  if (world.fundsCents < paidCents) throw new Error('Not enough funds for that')

  world.fundsCents -= paidCents
  if (held) {
    // ⚠⚠ THE REBASE, AND IT IS THE WHOLE OF THE TOP-UP. New money has not been compounding since the
    // original purchase and must not be treated as though it had, so the basis becomes what the
    // holding is worth TODAY plus what was just added, and the clock restarts here. `paidCents`
    // meanwhile keeps accumulating the CASH the family put in, so `changeCents` stays the honest
    // lifetime gain or loss – the reasoning is written out over `OwnedAsset.basisCents`.
    held.basisCents = held.valueCents + paidCents
    held.basisWeek = world.week
    held.valueCents = held.basisCents
    held.paidCents += paidCents
  } else if (item.buildWeeks) {
    // ⭐⭐ ROUND 29 #5, §3f – COMMISSIONED. «The money leaves on order. The thing arrives N weeks
    // later. Between those two weeks the player owns a CONTRACT, not a boat.»
    //
    // ⚠⚠ THE VALUE CLOCK STARTS AT DELIVERY, and it is `basisWeek` that says so – the field round 29
    // #11 added for the top-up, used for its own sentence («the compounding clock's start») rather
    // than widened. `assetValueCents`'s `Math.max(0, weeksHeld)` then holds the contract at exactly
    // what was paid for the whole wait, with no second value model and no branch in `revalueAssets`.
    //
    // ⚠ AND A CONTRACT THAT DEPRECIATED WOULD BE A PUNISHMENT FOR WAITING. Three years of losing 5%
    // a year on a thing that does not exist yet, on top of the wait itself, is not what §3f asks
    // for – it asks for a wait, and «мы ни за что не наказываем» is the house rule that decides how
    // to read the silence.
    const readyWeek = world.week + item.buildWeeks
    world.assets.push({
      id: item.id,
      boughtWeek: world.week,
      paidCents,
      valueCents: paidCents,
      basisCents: paidCents,
      basisWeek: readyWeek,
      readyWeek,
    })
  } else {
    world.assets.push({ id: item.id, boughtWeek: world.week, paidCents, valueCents: paidCents })
  }
  addEvent(world, {
    week: world.week,
    type: 'expense',
    category: 'shop',
    // Three verbs, because they are three different events in a career and the ledger is read as a
    // story: the week the family opened a holding is not the week it added to one, and neither of
    // them is the week it ORDERED a thing that will not exist for three years (§3f).
    text: held ? `Added to: ${item.label}` : item.buildWeeks ? `Ordered: ${item.label}` : `Bought: ${item.label}`,
    amountCents: -paidCents,
  })
  // ⚠ AND THE ORDER SAYS WHEN, ON ITS OWN LINE. A purchase whose thing does not arrive for three
  // years is the one row on this shelf whose date is the point of it; the expense row above is
  // about the money and this is about the wait.
  if (!held && item.buildWeeks) {
    addEvent(world, {
      week: world.week,
      type: 'entry',
      text: `${item.label} is on order – due ${weekLabel(world.week + item.buildWeeks)}`,
    })
  }
}

/** ⭐ SELL, at exactly what the stored value says – and the difference from `paidCents` is the whole
 *  feature (§3b: «THIS FAMILY EXISTS TO LOSE MONEY AND THAT IS THE POINT»).
 *
 *  ⚠ THE SENTENCE NAMES THE DIFFERENCE, TO THE CENT, and that is acceptance §2e-1 read literally: a
 *  player who has to subtract two rows himself has not been shown the loss, he has been shown two
 *  prices. The ledger keeps both rows anyway, so nothing is hidden by saying it out loud.
 *
 *  ⭐⭐⭐ ROUND 29 PART TWO #4 – AND `amountCents` MAKES IT A PART SALE. HIS ASK, 29.08: «при продаже
 *  бумаг надо дать возможность только часть продавать, иными словами при продаже надо дать цифровой
 *  инпут для ввода суммы продажи», and his reasoning with it – a holding you can take money OUT of in
 *  parts is a cash-management decision instead of a one-way door.
 *
 *  ⚠⚠ «БУМАГ» IS LOAD-BEARING AND IT IS THE `stake` AGAIN. A part sale is offered on `'open'` rungs
 *  and refused on `'fixed'` ones, which is `buyAsset`'s top-up predicate read from the other end: an
 *  'open' rung is «a product you choose an amount for» and takes money in and out in parts, a car is
 *  «a thing with one price» and does neither. One property decides both directions, so a third
 *  investment added to the catalogue tomorrow is divisible because of what it IS.
 *
 *  ⚠ AND A FIXED RUNG REFUSES THE AMOUNT RATHER THAN IGNORING IT, which is the one place this does
 *  NOT mirror `buyAsset`. There, ignoring a stake means the family pays the catalogue's stated price;
 *  here, ignoring an amount would mean the family asked to sell half a car and got rid of all of it.
 *  A surprise disposal is not the same class of mistake as a known price, so it is a refusal.
 *
 *  ⚠⚠ AND IT MUST NOT BREAK THE TOP-UP'S P&L, WHICH IS THE TRAP IN THIS ITEM. Round 29 #11 split the
 *  two numbers on purpose: `paidCents` accumulates the CASH the family put in, `basisCents` carries
 *  the COMPOUNDING, and `changeCents = valueCents - paidCents` is the honest lifetime gain. So a part
 *  sale scales BOTH sides by what left:
 *    * `basisCents` becomes what is LEFT, struck today, and the clock restarts – identical arithmetic
 *      to the top-up's own rebase and provably neutral, since `V(1-f)·(1+r)^(s/52)` is exactly the
 *      curve the untouched holding would have drawn scaled by `(1-f)`. Not doing this is the whole
 *      trap: `revalueAssets` recomputes `valueCents` from the basis every tick, so a sale that
 *      lowered the value alone would be silently undone on the next tick.
 *    * `paidCents` gives up the cost of what was sold, ONE ROUNDING AND THE REMAINDER IS A
 *      SUBTRACTION – `kidPrizeShareCents`' own discipline – so the cost that left and the cost that
 *      stayed re-add to the original to the cent, and the realised and unrealised halves of the gain
 *      re-add to the gain the family actually has.
 *
 *  ⚠ ITS `boughtWeek` IS NOT TOUCHED: they have owned this holding since they opened it, and selling
 *  part of it does not change when that was.
 *
 *  Same guard, same class, zero draws. Every figure is integer cents; nothing here rounds for
 *  display. */
export function sellAsset(world: WorldState, itemId: string, amountCents?: number): void {
  guardNotEndedForGood(world)
  world.assets ??= []
  const owned = world.assets.find((a) => a.id === itemId)
  if (!owned) throw new Error('The family does not own that')
  if (!sellableAsset(world, owned)) throw new Error('That one cannot be sold right now')

  const item = shopItem(itemId)
  const label = item?.label ?? owned.id
  // ⚠ THE THREE GUARDS, IN THE ORDER A PLAYER MEETS THEM. A missing amount is «sell the lot», which
  // is what every caller written before this item meant and still means.
  const asked = amountCents === undefined ? undefined : Math.floor(amountCents)
  if (asked !== undefined && item && item.stake !== 'open') {
    throw new Error(`${label} can only be sold whole`)
  }
  // ⚠ NO ZERO-OP THAT STILL CHARGES: zero and negative are the same refusal, because both would
  // write a ledger row and move nothing.
  // ⚠⚠ AND `NaN` IS THE SAME REFUSAL, WHICH IS NOT PEDANTRY IN A COMMAND THAT MOVES MONEY. `NaN <= 0`
  // and `NaN > value` are BOTH false, so a malformed amount off the wire would walk past every
  // comparison below and write `NaN` into `valueCents` and `basisCents` – a career corrupted by a
  // guard that read like it covered this. `!(asked > 0)` is the form that catches it.
  if (asked !== undefined && !(asked > 0)) throw new Error('That is not an amount to sell')
  // ⚠ AND NEVER MORE THAN IS HELD. `>=` the whole value is a whole sale rather than a refusal – a
  // player asking for everything gets everything, and «мы ни за что не наказываем».
  if (asked !== undefined && asked > owned.valueCents) {
    throw new Error(`They only hold ${formatCents(owned.valueCents)} of that`)
  }

  const whole = asked === undefined || asked >= owned.valueCents
  const proceedsCents = whole ? owned.valueCents : asked
  // ONE ROUNDING (see the header): the cost of the part that left. The part that stays is the
  // subtraction, so the two can never disagree with `paidCents` by a penny.
  const costSoldCents = whole ? owned.paidCents : Math.round((owned.paidCents * proceedsCents) / owned.valueCents)
  const deltaCents = proceedsCents - costSoldCents

  if (whole) {
    world.assets = world.assets.filter((a) => a !== owned)
  } else {
    owned.paidCents -= costSoldCents
    owned.basisCents = owned.valueCents - proceedsCents
    owned.basisWeek = world.week
    owned.valueCents = owned.basisCents
  }
  world.fundsCents += proceedsCents

  const tail =
    deltaCents < 0
      ? `${formatCents(-deltaCents)} less than it cost`
      : deltaCents > 0
        ? `${formatCents(deltaCents)} more than it cost`
        : 'exactly what it cost'
  addEvent(world, {
    week: world.week,
    type: 'income',
    category: 'shop',
    // ⚠ TWO VERBS, FOR `buyAsset`'s OWN REASON three functions up: the week a family closed a holding
    // is not the week it took some money out of one, and the ledger is read as a story. The
    // difference the sentence names is the REALISED half on a part sale – what the sold part cost
    // against what it fetched – and the unrealised rest stays on the row upstairs.
    text: whole ? `Sold: ${label} – ${tail}` : `Sold ${formatCents(proceedsCents)} of: ${label} – ${tail}`,
    amountCents: proceedsCents,
  })
}

/** ⭐⭐ THE SHELF AS THE MONEY SCREEN READS IT (§2). `kitLineViews`' own shape and its own rule: the
 *  screen never prices a rung, never applies a rate and never subtracts two figures to find a loss.
 *
 *  ⚠⚠ WHOLE NUMBERS CROSS HERE AND NOWHERE ELSE – the owner's rule of 26.08 («у нас в логике могут
 *  быть дробные числа – это окей, а у пользователя целые в интерфейсе»), the one `shownCondition`
 *  follows twenty lines into `toSnapshot`. Two figures on this view are genuinely fractional behind
 *  it and both are rounded ONCE, right here: `annualRatePct` (basis points are a hundredth of a
 *  percent) and `changePct` (a ratio of two cent figures). Every other number is cents, and
 *  `tests/condition-boundary.test.ts`'s own note is the licence for leaving those alone: «Cents are
 *  already integers and stay integers.» ⚠ No component may round either of these a second time.
 *
 *  ⚠ AND THE EMPTY SHELF NAMES A THING, NOT A GOAL (§2): «never a locked row, a progress bar or a
 *  teaser». `cheapestId` is the cheapest rung on the shelf – a real object at a real price the
 *  screen can print a sentence about – and it goes null the moment the family owns anything, because
 *  a shelf with something on it does not need to be introduced.
 *
 *  Pure: reads the world, writes nothing, draws nothing. */
export function shopView(world: WorldState): ShopView {
  const owned = ownedAssets(world)
  const rows: ShopRowView[] = shopCatalogue().map((item) => {
    const mine = owned.find((a) => a.id === item.id)
    const changeCents = mine ? mine.valueCents - mine.paidCents : null
    return {
      id: item.id,
      family: item.family,
      stake: item.stake,
      label: item.label,
      blurb: item.blurb,
      entryCents: item.entryCents,
      annualRatePct: Math.round(item.annualRateBps / 100),
      paidCents: mine ? mine.paidCents : null,
      valueCents: mine ? mine.valueCents : null,
      changeCents,
      changePct:
        mine && mine.paidCents > 0 && changeCents !== null ? Math.round((changeCents / mine.paidCents) * 100) : null,
      boughtWeek: mine ? mine.boughtWeek : null,
      // ⚠ THE PRICE IS ON SCREEN EITHER WAY. This says whether the control is pressable, never
      // whether the row is drawn: §2 rules out the locked row and the progress bar, and a shop
      // window is a thing you look into before you can afford it.
      affordable: world.fundsCents >= item.entryCents,
      // ⭐⭐ ROUND 29 #5 – THE THREE NUMBERS §3f GAVE THE ELITE, AND THE ENGINE WORKED OUT ALL THREE.
      // What it costs is `entryCents` above; what it loses is `annualRatePct`; what it takes every
      // week to keep is this, quoted off what the family PAID when it owns one and off the price
      // when it does not, so the card and the bill can never differ.
      upkeepCents: assetUpkeepCents(item, mine ? mine.paidCents : item.entryCents),
      buildWeeks: item.buildWeeks ?? 0,
      // ⚠ NON-NULL ONLY WHILE THEY ARE WAITING. The screen draws no Sell against a contract and says
      // the date instead – `sellableAsset` refuses the same week, so a stale tab cannot sell a boat
      // that does not exist.
      readyWeek: mine?.readyWeek ?? null,
      requiresId: item.requiresId ?? null,
      // §3g – the stage under it, answered here rather than on screen: a shelf that worked out its
      // own chain would be a second copy of `buyAsset`'s refusal.
      requirementMet: !item.requiresId || owned.some((a) => a.id === item.requiresId),
    }
  })
  const cheapest = rows.reduce<ShopRowView | null>((best, r) => (!best || r.entryCents < best.entryCents ? r : best), null)
  return {
    rows,
    cheapestId: owned.length === 0 && cheapest ? cheapest.id : null,
    ownedCount: owned.length,
    ownedValueCents: owned.reduce((sum, a) => sum + a.valueCents, 0),
    // ⭐ ROUND 29 #5 – the shelf's own weekly bill and the vacation week it has earned, both asked of
    // the one function that answers them for the till as well (§3f).
    upkeepCents: weeklyAssetUpkeepCents(world),
    vacationIds: grantedVacationIds(world),
  }
}
