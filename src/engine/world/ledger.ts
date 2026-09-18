// THE LEDGER: the two write primitives every world mutation goes through, and the pure folds that
// read the finance ledger back out.
//
// ⚠ DEPENDENCY DIRECTION. This module knows about `WorldState` as a TYPE ONLY (the import below is
// erased at compile time), so `world.ts` can import these values without a runtime cycle. Nothing
// here calls back into world.ts, and nothing here draws on any RNG stream — `addEvent` and
// `accrueFinance` are pure state writes, which is why the frozen MAIN capture cannot notice them.
import { WEEKS_PER_YEAR } from '../season/calendar'
import type {
  CareerMoney,
  FinanceWeek,
  FinanceWeekPoint,
  FinanceWindow,
  WorldEvent,
  WorldEventCategory,
} from '../../shared/protocol'
import type { WorldState } from '../world'
// ⚠ A VALUE IMPORT, AND IT IS NOT A CYCLE – checked rather than assumed. `world/assets.ts` answers
// questions and never writes the world (its own header says so); nothing in its transitive closure
// – economy.ts, season/calendar.ts, world/brand.ts, world/market.ts, world/fame.ts – imports this
// file back. The career-long upkeep fold lives THERE because every other line of upkeep arithmetic
// does, which is that file's own «one arithmetic, one writer» rule.
import { careerAssetUpkeepCents } from './assets'

export function addEvent(world: WorldState, e: Omit<WorldEvent, 'id'>): void {
  world.events.push({ id: world.nextEventId++, ...e })
  // Every financial event (amountCents present) also folds into the persisted finance ledger –
  // the single choke point that captures income/coaching/sponsor/gear/stringing/travel/entry with
  // zero call-site changes, and (unlike `events`) survives pruning so the Money breakdown stays
  // window-accurate. `amount === 0` sponsored line-items move no cash, so they're skipped.
  if (e.amountCents !== undefined && e.amountCents !== 0) accrueFinance(world, e.week, e.category ?? 'other', e.amountCents)
}

// Fold one financial delta into financeWeeks: find-or-create the week entry (keeping the array
// week-ascending – the common case is appending the current, newest week) and add into its category.
export function accrueFinance(world: WorldState, week: number, category: WorldEventCategory, amountCents: number): void {
  // W2-ENDINGS (v39): the same delta also folds into the CAREER totals, which is the one thing the
  // window below cannot answer. `financeWeeks` prunes to sixty weeks (FINANCE_WEEKS), so by season
  // three the early bills are gone from the save – and the epilogue's reckoning, and the break-even
  // crossing the album's central page is about, are both questions about the whole career.
  //
  // ⚠ `prize` IS COUNTED APART FROM the rest of the income, and that separation IS slot 6. Parent
  // wages, sponsor money, the academy grant and savings interest are all income; none of them is the
  // tennis paying for itself. Zero draws, at the choke point every money movement already passes.
  // Defensive `??=` because hand-built probe worlds in tests predate the field.
  world.careerTotals ??= { earnedCents: 0, spentCents: 0, prizeCents: 0, weeksLostToInjury: 0 }
  if (amountCents > 0) world.careerTotals.earnedCents += amountCents
  else world.careerTotals.spentCents += -amountCents
  if (category === 'prize') world.careerTotals.prizeCents += amountCents

  const entry = financeWeekEntry(world, week)
  entry.byCategory[category] = (entry.byCategory[category] ?? 0) + amountCents
}

/** ⭐⭐⭐ ROUND 46 #9 – THE CATEGORY THAT IS NOT A COST. Money that goes out under `'shop'` did not
 *  leave the family: it turned into a house, an academy stage or a slice of a fund that is still on
 *  `world.assets`. Every other outgoing category is consumption – a coach was paid, a fare was
 *  bought, a court was hired – and that is the whole distinction `careerMoney` below is built on.
 *
 *  ⚠ ONE NAME FOR IT, IN THE ONE PLACE THAT ALREADY OWNS THE LEDGER'S SHAPE, because the question is
 *  asked twice (`careerMoney` and `captureBreakEven`'s week arm) and two copies of the answer is how
 *  the album and the milestone that gates it come to disagree. */
export function isHoldingCategory(category: WorldEventCategory): boolean {
  return category === 'shop'
}

/** ⭐⭐⭐ ROUND 46 #9 – WHAT A CAREER EARNED AND WHAT IT ACTUALLY COST, told apart.
 *
 *  THE OWNER, 18.09, off his finished career: «наша математика затрат и заработков… сказала в
 *  альбоме, что заработано было 13млн (причем вообще не ясно откуда эта цифра), а потрачено 83млн…
 *  мы как-то некорректно читаем траты на теннис (о которых речь) и заработки. Эта математика
 *  критична.» He finished holding $10M+ liquid, a $20M+ fund, houses, an academy and a brand.
 *
 *  ⚠⚠ BOTH HALVES OF HIS READING WERE WRONG AND BOTH WERE MEASURED BEFORE THIS WAS WRITTEN
 *  (`tools/album-money-probe.ts`, one walked career that buys the way he does – no bench in `tools/`
 *  had ever contained an asset purchase, which is why nothing caught this):
 *
 *    * «SPENT» was `careerTotals.spentCents`, every cent that ever left the wallet – and on the
 *      probe career **59.7% of it was the `'shop'` category**: $15,490,000 of a $25,935,355 total,
 *      being a house, the brand, the academy and the fund deposits. That money did not get SPENT, it
 *      got MOVED, and it was sitting in the same save under `assets` worth $39,327,362.
 *    * «WON» was `careerTotals.prizeCents`, which is documented as prize money THE FAMILY KEPT – so
 *      it excludes her own half of every cheque (`kidFundsCents`, $28,749,334 on the same career:
 *      MORE than the family's $17,164,973), and it excludes the parent's wages, the sponsors, the
 *      grants and the businesses the family built ($10,862,617 between them). Hence «не ясно откуда
 *      эта цифра»: it is one slice of one stream, printed where a reckoning was expected.
 *
 *  ⚠⚠ NOTHING NEW IS PERSISTED AND `SAVE_SCHEMA_VERSION` DOES NOT MOVE. Every term below is already
 *  on the save: `careerTotals` (v39), `assets[].paidCents` (v63) and `kidFundsCents` (v54). The
 *  accumulators in `accrueFinance` are UNTOUCHED – their meaning is what every migrated career's
 *  figures already are, and a reader is allowed to be smarter than a counter without rewriting the
 *  counter's history.
 *
 *  ⚠ `paidCents` RATHER THAN `valueCents` IS THE LOAD-BEARING CHOICE. What is being taken back out
 *  of «spent» is the CASH that went in, not what the thing turned out to be worth; the worth is a
 *  separate fact and gets its own field. That is also what keeps a SOLD asset honest with no extra
 *  bookkeeping: the purchase stays inside `spentCents` and the proceeds stay inside `earnedCents`,
 *  the row is gone from `assets`, and the pair therefore nets to the realised gain or loss – which
 *  is exactly right, because a car sold for less than it cost really was consumed. A PART sale is
 *  the same statement one step smaller: `sellAsset` already subtracts the sold part's cost from
 *  `paidCents`, so only the part still held is excused.
 *
 *  ⚠ THE IDENTITY, PINNED IN `tests/round46-career-money.test.ts` RATHER THAN CLAIMED:
 *      cameInCents − outlayCents === (fundsCents − starting funds) + heldCents + herAccountCents
 *  – everything that came in, minus everything that went for good, is what the household ended up
 *  with: the wallet's growth, the cash sunk in what it owns, and her account.
 *
 *  ⚠ CLAMPED AT ZERO, AND THE CLAMP IS FOR MIGRATED SAVES RATHER THAN FOR TIDINESS. `careerTotals`
 *  was reconstructed by the v38 -> v39 step off a ledger already pruned to sixty weeks and is
 *  documented there as «EXACT FOR A YOUNG CAREER AND A DOCUMENTED UNDERCOUNT FOR AN OLD ONE», so an
 *  old career can hold assets that cost more than its `spentCents` remembers. A negative outlay is
 *  not a number to print; zero is the honest floor and the holdings still say what was bought.
 *
 *  =================================================================================================
 *  ⭐⭐⭐ AMENDED 18.09 – RULING 5: THE UPKEEP GOES OUT WITH THE THING IT KEEPS
 *  =================================================================================================
 *
 *  THE OWNER, on the version above, which took the PURCHASE out of «spent» and left the weekly bill
 *  in – §2b of the spec called that «one imperfection, taken knowingly» and he read the note:
 *
 *  > «вообще не про теннис, мимо (машины, дома, яхты, самолеты). Мне кажется это уже не теннис,
 *  > честно говоря. За уши можно притянуть, но лучше нет.»
 *
 *  ⚠⚠ SO THIS IS A THIRD TERM AND NOT A WIDER `heldCents`, BECAUSE THE UPKEEP IS NOT HELD. A yacht's
 *  crew is paid and gone; what the ruling says about it is not «the family still has it» but «it is
 *  not the tennis». Two different exclusions with two different reasons, and folding them into one
 *  figure would make the identity below false – which is exactly how a reckoning stops being able to
 *  prove itself. `careerAssetUpkeepCents` (world/assets.ts) carries the replay and its residual.
 *
 *  ⚠ AND THE BRAND AND THE ACADEMY ARE DELIBERATELY NOT IN EITHER EXCLUSION – ruling 6 of the same
 *  day: «А вот бренд и академия вполне могут быть и расходами и доходами, здесь не вижу
 *  противоречий.» Their COST is `heldCents`' one concession and their INCOME is already inside
 *  `earnedCents` (and therefore `cameInCents`), which is the «both sides» he asked for on the
 *  reckoning. What is NOT yet applied is their cost in the break-even GATE – see `captureBreakEven`
 *  and docs/specs/the-reckoning-2026-09.md §6, where the measurement and the reason are recorded.
 *
 *  ⚠ THE IDENTITY GAINS ITS THIRD TERM AND IS STILL PROVED RATHER THAN CLAIMED:
 *      cameInCents − outlayCents === (fundsCents − starting funds) + heldCents + herAccountCents
 *                                   + upkeepCents
 *  – everything that came in, minus everything the reckoning calls spending, is the wallet's growth,
 *  the cash sunk in what it owns, her account, and the money the toys ate on the way.
 *
 *  A pure read: no draw, no clock, no world mutation – the whole file's guarantee. */
export function careerMoney(world: WorldState): CareerMoney {
  const totals = world.careerTotals ?? { earnedCents: 0, spentCents: 0, prizeCents: 0, weeksLostToInjury: 0 }
  let heldCents = 0
  let holdingsCents = 0
  for (const owned of world.assets ?? []) {
    heldCents += owned.paidCents
    holdingsCents += owned.valueCents
  }
  const upkeepCents = careerAssetUpkeepCents(world)
  const herAccountCents = world.kidFundsCents ?? 0
  return {
    earnedCents: totals.earnedCents,
    prizeCents: totals.prizeCents,
    herAccountCents,
    cameInCents: totals.earnedCents + herAccountCents,
    spentCents: totals.spentCents,
    heldCents,
    upkeepCents,
    outlayCents: Math.max(0, totals.spentCents - heldCents - upkeepCents),
    holdingsCents,
  }
}

/** Find-or-create this week's ledger row, keeping the array week-ascending (the common case is
 *  appending the current, newest week). Shared by the two writers below it so "which row is this
 *  week's" is spelled once – the same reason `seasonStartWeek` exists further down. */
function financeWeekEntry(world: WorldState, week: number): FinanceWeek {
  const found = world.financeWeeks.find((w) => w.week === week)
  if (found) return found
  const entry: FinanceWeek = { week, byCategory: {} }
  const last = world.financeWeeks[world.financeWeeks.length - 1]
  if (!last || week >= last.week) world.financeWeeks.push(entry)
  else world.financeWeeks.splice(world.financeWeeks.findIndex((w) => w.week > week), 0, entry)
  return entry
}

/** ⭐⭐ WHAT THE TILL PAID HER THIS WEEK, PARKED BESIDE THE ARITHMETIC AND NOT IN IT.
 *
 *  ⚠⚠ THIS IS NOT `accrueFinance` AND MUST NEVER BECOME IT. Her share is not a family expense – the
 *  family was credited `prize − herShare` in the first place, and `finalizeTournament`'s own note
 *  says why booking it a second time is forbidden: it «would count the same cents twice - once
 *  against `careerTotals.spentCents`, which is the denominator of the album's break-even page». So
 *  this writes `FinanceWeek.kidShare` and touches neither `byCategory` nor `careerTotals`, which is
 *  what lets a screen print the figure under a balance the figure cannot move.
 *
 *  Cents ACCUMULATE (a week that ever pays two cheques owes her both).
 *
 *  ⚠⚠ AND THE RATE IS THE WEEK'S EFFECTIVE ONE SINCE ROUND 29 P3, WHICH IS A REAL CHANGE OF MEANING.
 *  Until the manager's commission there was exactly one rate in the game – her age ramp – so «two
 *  cheques in one week are one age and therefore one rate by construction» was true and this stored
 *  the last rate handed in. P3 puts a SECOND rate on the same weeks: a title pays a prize at her ramp
 *  and a result bonus at `10_000 − managerCommissionBps()`, and on the shipped numbers that is 50%
 *  beside 85%. Storing either one would print a percentage that is not a percentage of the base
 *  printed beside it, which is precisely the defect round 29 #10 exists to have ended.
 *
 *  So `bps` is now `cents / baseCents` – what she actually kept of everything she was actually paid.
 *  ⚠ THAT IS THE SAFE DIRECTION OF THE DIVISION AND THE FORBIDDEN ONE IS STILL FORBIDDEN. The rule
 *  below («never re-derive the base by dividing cents by the rate») is about reconstructing MONEY
 *  from a rounded figure, and it stands. This derives a LABEL from two figures the till really paid,
 *  neither of which is invented, and it makes `cents === round(baseCents × bps / 10_000)` true by
 *  construction instead of by coincidence. On a week with a single rate it reproduces that rate
 *  exactly for any cheque above a few cents, so nothing about the pre-P3 weeks reads differently.
 *

 *  ⭐⭐ ROUND 29 #10 – AND SO DOES THE BASE, WHICH IS THE WHOLE OF THAT ITEM. `baseCents` is the
 *  GROSS of the same cheque, handed in by the site that banked it, and it accumulates in lockstep
 *  with `cents` for exactly the reason `cents` does: a title week pays a prize, a result bonus and
 *  sometimes a quarterly retainer, and her «50%» is 50% of all three added up. Summing the two
 *  together is what keeps `cents === round(baseCents * bps / 10_000)` true across a multi-cheque
 *  week – ⚠ to within the per-cheque rounding, since each cheque rounds once on its own way in and
 *  a sum of rounded halves is not the rounded half of a sum. `tests/round29-kid-cut-base.test.ts`
 *  pins that tolerance at one cent per cheque rather than pretending it is zero.
 *
 *  ⚠ NEVER RE-DERIVED BY DIVIDING `cents` BY THE RATE. That division is the arithmetic that
 *  produced two wrong readings of this item before it was measured, and it re-introduces the penny
 *  `kidPrizeShareCents`' own comment forbids.
 *
 *  =================================================================================================
 *  ⭐⭐⭐ ROUND 30 #21 – AND THE EFFECTIVE RATE IS NOT A RULE, SO IT MAY NOT BE LABELLED AS ONE
 *  =================================================================================================
 *
 *  THE OWNER, 30.08, off his w896 save: «Почему-то мне пишут "Her cut 61% – $69,750 into her own
 *  account", и до этого было про 56%… При том, что на экране бюджета написано "She keeps 50% of
 *  every prize cheque now"».
 *
 *  ⚠⚠ HE IS RIGHT AND NEITHER FIGURE IS WRONG – MEASURED ON HIS SAVE. Week 894 banked $80,000 of
 *  GROSS prize (the ledger's row is the family's net $40,000) at her ramp of 50%, and $35,000 of
 *  brand money at 85%. $40,000 + $29,750 = $69,750 out of a $115,000 base is 60.65%, which rounds to
 *  the 61% he read. Week 891 was a sponsor cheque alone and printed 85%, correctly. The arithmetic
 *  has never been wrong; ONE SENTENCE WAS BLENDING TWO RULES AND CALLING THE AVERAGE A RULE.
 *
 *  ⚠⚠ AND THE BLEND WAS A CORRECT ANSWER TO A SCREEN THAT NO LONGER EXISTS. P3 chose it so that
 *  `cents === round(baseCents × bps / 10_000)` would hold against the BASE ROUND 29 #10 HAD PUT IN
 *  THE SENTENCE. Part two #2 took the base out of the sentence at the owner's ask («это усложнило и
 *  фразу и интерфейс») and round 30 #1 took it off the card entirely – so the constraint the blend
 *  was serving went away, and what was left was a percentage with nothing to be a percentage of and
 *  no rule behind it. That is round 29 #10's own class, one turn later.
 *
 *  So the SOURCE's own rate is stored beside the blend, and a label quotes the part. The blend is
 *  kept, unchanged, because it is the only rate a save written before this can offer and because
 *  `kidSharePct` still rides on it – see `FinanceWeekKidShare.bps`.
 *
 *  ⚠ THE PARTS ARE CARRIED, NOT SOLVED. Two rules and one blended pair is a solvable 2x2, and
 *  solving it is exactly the forbidden direction: it reconstructs MONEY from rounded figures and it
 *  assumes both rules were the ones live at read time. Weeks banked before this field fall back.
 *
 *  A pure state write on integers already decided: no draw, no clock, so the frozen MAIN capture
 *  cannot notice it – `addEvent`'s own guarantee at the top of this file. */
export function accrueKidShare(
  world: WorldState,
  week: number,
  cents: number,
  bps: number,
  baseCents: number,
  source: 'prize' | 'sponsor' | 'brand',
): void {
  if (cents <= 0) return
  const entry = financeWeekEntry(world, week)
  const summedCents = (entry.kidShare?.cents ?? 0) + cents
  const summedBase = (entry.kidShare?.baseCents ?? 0) + baseCents
  // ⭐⭐⭐ ROUND 30 #21 – AND THE SOURCE'S OWN RULE IS KEPT BESIDE THE BLEND, WHICH IS THE ITEM.
  // `bps` above answers "what fraction of everything she was paid did she keep"; this answers "under
  // which rule". A part is one source, so its rate is the one handed in and it never averages: the
  // caller passes her ramp for a prize and the manager's complement for a brand cheque, and both are
  // the very numbers the till divided by. Cents and base accumulate within the source for the same
  // reason the parent row does – a title week reaches the sponsor path twice.
  const prev = entry.kidShare?.[source]
  const part = {
    cents: (prev?.cents ?? 0) + cents,
    bps,
    baseCents: (prev?.baseCents ?? 0) + baseCents,
  }
  entry.kidShare = {
    ...entry.kidShare,
    cents: summedCents,
    // ⚠ THE FALLBACK IS THE RATE HANDED IN, not zero and not a guess: a caller that has no base to
    // offer (none does today, and the parameter is optional-by-convention rather than by type) still
    // gets an honest rate for its single cheque. See the header for why the division is the safe one.
    bps: summedBase > 0 ? Math.round((summedCents * 10_000) / summedBase) : bps,
    baseCents: summedBase,
    [source]: part,
  }
}

/** ⭐⭐ ROUND 29 PART TWO #13 – WHAT THE COACH TOOK OFF THE WEEK'S CHEQUE, parked beside the
 *  arithmetic in the same way `accrueKidShare` parks hers, and for the MIRROR-IMAGE reason.
 *
 *  THE OWNER, 29.08: «вот и можно как раз добавить cut тренера на weekly экране для прозрачности.»
 *
 *  ⚠⚠ THIS IS NOT `accrueFinance` EITHER, AND HERE THE DANGER RUNS THE OTHER WAY. Her share was
 *  never a family expense and must not become one; the coach's share ALREADY IS one –
 *  `finalizeTournament` writes it through `addEvent` as a `coaching` expense the same tick – so
 *  booking it again here would double it inside `byCategory`, `expenseCents` and
 *  `careerTotals.spentCents`. This writes `FinanceWeek.coachCut` and touches neither, which is what
 *  lets a screen print the figure under a balance the figure has already moved once.
 *
 *  ⚠ AND IT IS CARRIED RATHER THAN RE-DERIVED, for a harder reason than hers: `byCategory.coaching`
 *  is the week's WHOLE coaching bill – the retainer, the travel fare, the facility – so the share
 *  genuinely cannot be recovered from the ledger once it is folded in. The cents handed in are the
 *  very `coachShare` variable the wallet was debited by, at the same commit point.
 *
 *  Cents ACCUMULATE on `accrueKidShare`'s reasoning; the rate is the finish's own and a week reaches
 *  `finalizeTournament` for at most one tournament, so there is no second rate to reconcile.
 *
 *  A pure state write on integers already decided: no draw, no clock. */
export function accrueCoachCut(world: WorldState, week: number, cents: number, bps: number): void {
  if (cents <= 0) return
  const entry = financeWeekEntry(world, week)
  entry.coachCut = { cents: (entry.coachCut?.cents ?? 0) + cents, bps }
}

/** THE SEASON'S IDENTITY: the 0-based index of the 52-week block a week belongs to.
 *
 *  Pure integer arithmetic on the absolute week – no calendar, no date, nothing that can drift.
 *  It is the ONLY thing allowed to identify a season: the wrap-up milestone key, the "already
 *  banked?" guard on `seasonHistory` and the row it writes all key on this. The season year the
 *  player READS is derived from it (`seasonYear` in shared/dates.ts), never the other way round –
 *  see SeasonHistoryEntry.seasonIndex for the season that went missing when it was. */
export function seasonIndexOf(week: number): number {
  return Math.floor(week / WEEKS_PER_YEAR)
}

/** The first week of the 52-week season block a week belongs to. THE ONE definition of "this
 *  season" for money: the Money screen's "This season" window and the end-of-season summary both
 *  read it, so a season can never mean two different spans on two surfaces (R11-12a). */
export function seasonStartWeek(week: number): number {
  return seasonIndexOf(week) * WEEKS_PER_YEAR
}

/** Pure category-accurate fold of `financeWeeks` from `fromWeek` onward (inclusive). No world
 *  dependency, so the bench and tests call it directly. income/expense/net are derived from the
 *  aggregated per-category totals, so `netCents === incomeCents - expenseCents === Σ byCategory`. */
export function financeWindow(financeWeeks: FinanceWeek[], fromWeek: number): FinanceWindow {
  const byCategory: Partial<Record<WorldEventCategory, number>> = {}
  // ⭐⭐ ROUND 42 #11 – AND THE COACH'S RESULT SHARE IS SUMMED ALONGSIDE, NEVER OUT OF, `byCategory`.
  // The owner could not find the share anywhere («не вижу отчислений тренеру за победы на w серии
  // нигде»), and the reason is that it is a plain `coaching` expense row: real money, correctly
  // booked, with nothing on the Money screen naming it. `FinanceWeek.coachCut` is the memo the site
  // that PAID him writes, and this is the same memo folded to the window the screen draws.
  //
  // ⚠⚠ IT IS NOT A TERM IN THE ARITHMETIC BELOW AND MUST NEVER BECOME ONE. The cents are already
  // inside `byCategory.coaching`, therefore already inside `expenseCents` and `netCents`; a fold
  // that added them again would charge the family twice for one cheque. This loop reads `coachCut`
  // and the income/expense loop reads `byCategory`, which is what keeps the two provably separate –
  // `FinanceWeek.kidShare`'s own «a sibling, never a key inside it» design, in its mirror image.
  let coachCutCents = 0
  for (const w of financeWeeks) {
    if (w.week < fromWeek) continue
    coachCutCents += w.coachCut?.cents ?? 0
    for (const [cat, amt] of Object.entries(w.byCategory) as [WorldEventCategory, number][]) {
      byCategory[cat] = (byCategory[cat] ?? 0) + amt
    }
  }
  let incomeCents = 0
  let expenseCents = 0
  for (const amt of Object.values(byCategory)) {
    if ((amt ?? 0) > 0) incomeCents += amt!
    else expenseCents += -(amt ?? 0)
  }
  return { startWeek: fromWeek, byCategory, incomeCents, expenseCents, netCents: incomeCents - expenseCents, coachCutCents }
}

/** DENSE per-week income/expense over `[fromWeek, toWeek]` – the Home budget card's chart series.
 *
 *  Dense is the whole point, and the reason this is not a `.map` over `financeWeeks`: that ledger
 *  only holds weeks that HAD a financial event, so a fortnight with nothing in it simply is not
 *  there, and a chart plotted straight off it would silently close the gap and draw a quiet
 *  stretch as if it never happened. Every week in the span gets a bar, zero-valued when the ledger
 *  is silent about it.
 *
 *  Pure (no world dependency), and the same sign convention `financeWindow` folds by: positive
 *  category totals are income, negative ones are spend, reported as a magnitude. */
export function financeSeries(
  financeWeeks: FinanceWeek[],
  fromWeek: number,
  toWeek: number,
  /** what the family has RIGHT NOW, i.e. at the end of `toWeek`. The running balance is walked
   *  backwards from it, so the series can never drift away from the funds the card prints above the
   *  chart – they are the same number by construction. Defaults to 0 for callers that only want the
   *  in/out shape. */
  endBalanceCents = 0,
): FinanceWeekPoint[] {
  const byWeek = new Map<number, FinanceWeek>()
  for (const w of financeWeeks) byWeek.set(w.week, w)
  const out: FinanceWeekPoint[] = []
  for (let week = fromWeek; week <= toWeek; week++) {
    let incomeCents = 0
    let expenseCents = 0
    // ⭐⭐ ROUND 31 #2 – AND THE TOURNAMENT'S OWN HALF OF THE INCOME, SPLIT OUT OF THE SAME PASS.
    //
    // The owner asked for the week's money to read as an ADDITION: «Income – то, что пришло с
    // турнира / Other income – другие семейные доходы / Spent / Balance». `incomeCents` above is the
    // family's WHOLE week, so a row labelled "what came from the tournament" could not be drawn from
    // it, and the recap's "Family income" line was being derived from her cut's base instead – which
    // is why it appeared only on weeks that split a cheque and why the column never visibly added up.
    //
    // ⚠⚠ NOTHING NEW IS PERSISTED AND NO SAVE MOVES. `'prize'` has been its own ledger category since
    // task #17 – «the only income the tennis itself produces», its own header two files over – so the
    // fact was already on every save, in `byCategory`, and only the READOUT was missing. That is the
    // whole reason this is a display change: `FinanceWeekPoint` persists nothing, `FinanceWeek` is
    // untouched, `SAVE_SCHEMA_VERSION` does not move and no migration is owed. It also means the
    // split is right on a career loaded from an old save rather than only from the next cheque on.
    //
    // ⚠ THE SAME `> 0` GATE AS `incomeCents` ITSELF, and that is what makes the card's arithmetic
    // true by construction rather than by luck: a category whose week nets negative is spend, so
    // taking prize under any other condition could make `prize > income` and leave the card printing
    // a negative "Family income" for a week that had none.
    let prizeIncomeCents = 0
    for (const [category, amt] of Object.entries(byWeek.get(week)?.byCategory ?? {})) {
      if ((amt ?? 0) > 0) {
        incomeCents += amt!
        if (category === 'prize') prizeIncomeCents += amt!
      } else expenseCents += -(amt ?? 0)
    }
    // ⚠ HER CUT RIDES ALONG AND IS NOT SUMMED – it is not in `byCategory`, so the loop above cannot
    // have seen it, and the two figures the card prints (`incomeCents`, `expenseCents`) are byte for
    // byte what they were before this field existed. That is the point of it: `finalizeTournament`
    // credits the family `prize − herShare`, so income here is ALREADY net of her cut and a memo is
    // the only honest place for it. Absent on a week that split no cheque.
    // ⚠ ROUNDED ONCE, HERE (basis points are a hundredth of a percent) – the snapshot boundary, per
    // the owner's whole-numbers rule of 26.08 and `shopView`'s `annualRatePct`. No component divides
    // the rate a second time; `FinanceWeekPoint` persists nothing, so this is a display figure born
    // whole. Cents are already integers and stay integers (tests/condition-boundary.test.ts).
    // ⭐⭐ ROUND 29 PART TWO #13 – AND THE COACH'S CUT RIDES ALONG THE SAME WAY, WITH THE OPPOSITE
    // RELATIONSHIP TO THE SUM. Hers is outside `byCategory` and therefore outside `expenseCents`;
    // his is a real `coaching` expense row, so the loop above has ALREADY counted it and this is a
    // name for a figure the week's spend contains. Neither is added here. Rounded once, here.
    const coachCut = byWeek.get(week)?.coachCut
    const kidShare = byWeek.get(week)?.kidShare
    out.push({
      week,
      incomeCents,
      expenseCents,
      balanceCents: 0,
      // ⭐⭐ ROUND 31 #2 – omitted on a week the tennis paid nothing, which is the same shape every
      // other memo on this point uses, and reads as the zero it is. ⚠ IT IS A SLICE OF
      // `incomeCents`, NEVER A TERM BESIDE IT: a consumer that adds it to income has counted the
      // prize twice. The rest of the week's income is `incomeCents − this`.
      ...(prizeIncomeCents > 0 ? { prizeIncomeCents } : {}),
      ...(coachCut ? { coachCutCents: coachCut.cents, coachCutPct: Math.round(coachCut.bps / 100) } : {}),
      ...(kidShare
        ? {
            kidShareCents: kidShare.cents,
            kidSharePct: Math.round(kidShare.bps / 100),
            // ⭐ ROUND 29 #10 – the gross the percentage is a share OF, straight through and only
            // when the ledger row actually carries it. A week banked before that field existed has
            // no base and gets none invented here (see `FinanceWeekKidShare.baseCents`): the recap
            // reads its absence and prints the older, base-less line.
            ...(kidShare.baseCents ? { kidShareBaseCents: kidShare.baseCents } : {}),
            // ⭐⭐⭐ ROUND 30 #21 – AND THE PARTS, so a label can quote a RULE rather than the blend
            // above. Each part's rate is rounded once here, `kidSharePct`'s own rule; the order is
            // fixed (prize, then sponsor) so the card cannot print two orderings on two weeks.
            // Omitted entirely on a week that recorded no part – the fallback the recap reads.
            ...(kidShare.prize || kidShare.sponsor || kidShare.brand
              ? {
                  kidShareParts: (['prize', 'sponsor', 'brand'] as const).flatMap((source) => {
                    const part = kidShare[source]
                    return part ? [{ source, pct: Math.round(part.bps / 100), cents: part.cents }] : []
                  }),
                }
              : {}),
          }
        : {}),
    })
  }
  // Backwards: the last week ends on today's funds, and every earlier week ends on the next week's
  // opening balance. Undoing week i means removing ITS OWN net from the balance it closed on.
  let running = endBalanceCents
  for (let i = out.length - 1; i >= 0; i--) {
    out[i].balanceCents = running
    running -= out[i].incomeCents - out[i].expenseCents
  }
  return out
}
