// ⭐⭐⭐ THE MARKET – round 29 part three #16, and it is the answer to one sentence of his.
//
// THE OWNER, 29.08: «Механику фонда надо придумать, да, потому что безрисковые 3 против безрисковых
// 7 это весьма странно. Давай подумаем как это можно сделать красиво и просто.»
//
// He is right and the arithmetic said so: `assetValueCents` compounded `annualRateBps` and nothing
// else, so the index fund was a risk-free 7% standing beside a risk-free 3.17% deposit. That is not
// a decision, it is arithmetic – nobody would ever open the deposit, and nothing on the shelf could
// teach what a market is.
//
// ⭐⭐ THE LOAD-BEARING IDEA, AND EVERY OTHER PROPERTY IN THIS FILE FALLS OUT OF IT: **THE MARKET
// EXISTS WHETHER OR NOT SHE BUYS.** It is a fact about the world, like the weather – a path drawn
// from the career's seed alone, READ at the weeks a holding spans rather than DRAWN when one is
// opened. Nothing the player does moves it, nothing the player does costs a draw, and «a purchase
// may not move the world's dice» (CLAUDE.md invariant 2) is therefore not merely respected here, it
// is UNREACHABLE. There is no code path that could violate it, which is a stronger guarantee than a
// test – though `tests/round29p3-market.test.ts` proves it anyway, on a ticked world.
//
// ⚠⚠ AND IT NEVER TOUCHES THE MAIN WEEKLY STREAM. Every draw is a purpose-scoped sub-stream,
// `rngFromSeed(`${seed}:market:${period}:${anchor}`)`, re-derived at the call site and persisting
// nothing – the pattern `${seed}:calweek:${tier}`, `${seed}:growth:${week}` and
// `${seed}:conveyor:${season}` already use. The frozen MAIN capture (41550 / e6b0c709) cannot see
// any of this, and the spec called the shape a slice ahead (§4: «Every roll goes through a
// purpose-scoped sub-stream … A player's purchase may not move the world's dice»).
//
// ⚠ WHAT IS **NOT** HERE, ON MY DECISION AND HIS. §4 also names a FREEZE, and part three #16
// explicitly ruled out the third idea in that family: «No early-exit fee or spread … that is
// friction, not risk, and it does not answer "why is a risk-free 7% sitting beside a risk-free 3"».
// A path that moves IS the answer; a toll on the door is a different mechanic wearing its coat.
//
// ⭐⭐⭐ §4's SHOCK **IS** HERE SINCE HIS EXTENSION OF 29.08 – THE CRASH LAYER. His words, on being
// shown the one-in-five negative seasons: «Каждый пятый сезон отрицательный – круто, но может быть
// нам добавить вариативность тоже здесь, а не рельсы? например раз в 3-5 лет и стартовый сезон уже
// может быть как раз с -20%? это добавит невероятной динамики и реализма.» So: a crisis roughly
// once every 3-5 years, a sharp fall in the -15%…-30% band with a recovery arc after – a 2008/2020
// shape, not a deeper wiggle – and NO grace period: the first crash can land in the first season,
// which is exactly what he asked for. Same discipline as the wave: READ off
// `${seed}:market:crash:${epoch}`, never drawn, so a reload replays the same crisis and a purchase
// still cannot move anything. See THE CRASH LAYER below for the construction and the bound it costs.
// ⭐⭐⭐ ROUND 30 #14 – HIS RULING ON THIS FILE, HAVING PLAYED IT, AND IT MOVED ONE NUMBER AND
// DELETED ONE FUNCTION.
//
// «Волатильность индексного фонда какая-то очень большая по ощущениям +65/-15 это то, что я видел…
// Во-первых она скорее всего будет менее "галопирующая", во-вторых вряд-ли в таких крайностях. И
// надо логику фонда переделать на покупку ДОЛЕЙ в фонде…»
//
//   * `volBps` 1_800 -> 900 on the fund (`ECONOMY.shop.catalogue`, not here): 24.5% of seasons
//     negative against 30.8%, worst season -32.5% against -39.9%, and the ten-year loss tail down
//     from the 1.10% he accepted to 0.325%. ⚠ HIS CRASH BAND IS UNTOUCHED – -15…-30% at the trough,
//     one crisis per 2-6 years, no grace period are his own numbers from the day before, and what
//     they still cost is stated to him in §14i-4 rather than shaved here.
//   * `marketRatio` IS GONE. A holding is a count of UNITS at a price now (`unitPriceCents` in
//     `world/assets.ts`), so nothing asks «what did the market do between two weeks» any more – the
//     price ratio IS that question, asked of one function. Its two guards went with it, and the
//     consequence for the survivor is written at `marketIndex`.
//
// Everything else in this file – the octaves, the crash calendar, the bounds – is unchanged, and
// §14i's own measurement is that the unit model re-run at 1_800 reproduces §14h to a tenth of a
// percent. The model did not change; the way a holding is expressed on it did.
import { rngFromSeed } from '../rng'

/** ⭐⭐ THE OCTAVES – four tides of different length, added together, and this is the whole of
 *  «make it smooth».
 *
 *  ⚠⚠ A FRESH DRAW EVERY WEEK IS NOISE, NOT A MARKET, and that is the defect this structure exists
 *  to avoid rather than a preference about aesthetics. A per-week roll gives a career 780 independent
 *  numbers and no story: every season looks like every other season and no player can ever say «the
 *  fund has been down for two years». Anchors are SPARSE – the shortest is HALF A SEASON, sparser
 *  than the quarter part three #16 called «plenty» – and the curve between them is interpolated, so
 *  what a career sees is trends.
 *
 *  ⚠⚠ THE MIX IS MEASURED AND THE LONG OCTAVE IS SMALL FOR A REASON THAT IS NOT AESTHETIC. A tide
 *  much longer than a season barely MOVES within one, so amplitude spent there buys texture and
 *  costs the thing part three #16 asked to feel: «volatility such that roughly one year in four or
 *  five is negative». `tools/market-probe.ts` swept the trade – a four-year-dominant mix gives 7.3%
 *  of seasons negative, this one gives 19.9% – and 0.15 on the two-year tide is the most that could
 *  be kept while staying inside «one in five».
 *
 *  ⚠ AND THE AMPLITUDES SUM TO EXACTLY 1.00, WHICH IS NOT TIDINESS – IT IS THE SAFETY PROOF. Each
 *  octave lands in [-1, 1], so the sum lands in [-1, 1], so `marketIndex` lands in
 *  [e^-vol, e^+vol] and the RATIO between any two weeks lands in [e^-2vol, e^+2vol]. That bound is
 *  what makes the long horizon provably safe – see `worstMarketRatio` below and `ShopItem.volBps`.
 *  Change an amplitude and you change that proof; re-run `tools/market-probe.ts`, which measures it. */
const OCTAVES: { periodWeeks: number; amp: number }[] = [
  { periodWeeks: 104, amp: 0.15 }, // ~two years – the long tide, why a bad run can outlast a season
  { periodWeeks: 39, amp: 0.5 }, // three quarters – the body of the movement
  { periodWeeks: 26, amp: 0.35 }, // half a season – the fastest thing here, and it is still not weekly
]

/** One anchor of one octave, in [-1, 1). A sub-stream of its own, used for exactly one number and
 *  thrown away – `pickInt`'s neighbours in `rng.ts` are the same shape.
 *
 *  ⚠ THE KEY CARRIES THE PERIOD AND NOT AN OCTAVE INDEX, so re-tuning one octave's LENGTH re-seeds
 *  that octave alone and leaves the other two where they were. Nothing persists any of it, so this
 *  is a debugging convenience rather than a compatibility promise: every number in this file is
 *  provisional by the owner's own framing («я пощупаю и скажу свои ощущения потом»). */
function anchor(seed: string, periodWeeks: number, index: number): number {
  return rngFromSeed(`${seed}:market:${periodWeeks}:${index}`)() * 2 - 1
}

/** ⭐ THE WORLD'S MARKET, in [-1, 1] – a smooth, stationary, seed-only signal. Week in, number out;
 *  no world, no holding, no MAIN stream, no clock.
 *
 *  ⚠ SMOOTHSTEP RATHER THAN A STRAIGHT LINE between anchors (`t²(3-2t)`), because a linear
 *  interpolation has a CORNER at every anchor: the week-over-week move would jump the moment a
 *  quarter turned over, and `householdWeekly`'s shelf line reads exactly that move. Smoothstep is
 *  flat at both ends, so the curve arrives at an anchor and leaves it at the same slope and the
 *  weekly figure never steps.
 *
 *  ⚠ STATIONARY AND NOT A RANDOM WALK, AND THIS IS THE DESIGN DECISION THE WHOLE ITEM TURNS ON. A
 *  walk's variance grows without bound, so a long enough hold is a coin-flip however kind the drift
 *  is – and part three #16's hard constraint is the opposite: «On a long horizon the fund MUST beat
 *  Savings. Otherwise it is a trap for a player who did not read carefully, and "мы ни за что не
 *  наказываем" is house law.» A bounded, mean-reverting wobble around a real drift says the honest
 *  thing instead: WHEN you sell matters, WHETHER you were right to hold does not. */
export function marketWave(seed: string, week: number): number {
  let sum = 0
  for (const { periodWeeks, amp } of OCTAVES) {
    const x = week / periodWeeks
    const k = Math.floor(x)
    const t = x - k
    const a = anchor(seed, periodWeeks, k)
    const b = anchor(seed, periodWeeks, k + 1)
    sum += amp * (a + (b - a) * t * t * (3 - 2 * t))
  }
  return sum
}

// -------------------------------------------------------------------------------------------------
// THE CRASH LAYER (his extension, 29.08). One crisis per EPOCH, jittered inside it, read not drawn.
//
// ⭐⭐ THE CONSTRUCTION, AND WHY IT IS EXACTLY THIS. Time is cut into 208-week epochs (four years)
// and every epoch holds exactly one crash, starting at `epoch·208 + jitter` with jitter drawn in
// [0, 104). Two theorems fall out of those three numbers, and both are load-bearing:
//
//   * THE GAP between consecutive crash starts is `208 + (j' - j)` ∈ (104, 312) – two to six years,
//     triangular, CENTERED ON EXACTLY FOUR – with 75% of gaps inside his «раз в 3-5 лет» band.
//     Variability without rails: the rhythm is real but never a timetable a player can sell against.
//   * A CRASH NEVER OVERLAPS THE NEXT ONE, because its whole arc is at most 16 + 80 = 96 weeks and
//     the gap is always more than 104. So at any week AT MOST ONE crash is in force, its arc is
//     contained in its own epoch (103 + 96 = 199 < 208), and the worst-case excursion is one
//     crash's depth and not a pile-up – which is what keeps the safety bound below a closed form.
//
// ⚠ NO GRACE PERIOD, BY CONSTRUCTION AND BY HIS ASK («стартовый сезон уже может быть как раз с
// -20%»): epoch 0's crash starts in weeks [0, 104), so roughly half of all careers fall into one
// inside their first season and every career has met one by week ~120.
//
// ⚠⚠ FOUR DRAWS FROM ONE SUB-STREAM, IN THIS ORDER: jitter, depth, fall, recovery. The order is
// part of the seed contract – reordering them re-times every crisis in every existing career the
// way editing `mulberry32` would, so it is named here the way `conveyor.ts` names its own draw
// order. Nothing is persisted; the crash is a fact about the seed, like the weather.

/** Four years. The epoch grid the crash calendar lives on. */
const CRASH_EPOCH_WEEKS = 208
/** How far into its epoch a crash may start, exclusive. HALF the epoch, so gaps stay in (104, 312). */
const CRASH_JITTER_WEEKS = 104
/** The fall, in weeks – sharp on purpose (2020 was five; 2008 was ~26). */
const CRASH_FALL_WEEKS: [number, number] = [8, 16]
/** The recovery arc, in weeks – slower than the fall by construction, which is the 2008/2020 shape. */
const CRASH_RECOVERY_WEEKS: [number, number] = [40, 80]
/** ⚠⚠ WHAT IS LEFT AT THE TROUGH, as a multiplier – his «-15…-30%» band verbatim, anchor -20%
 *  inside it. `[0]` is ALSO the floor `worstMarketRatio` builds the safety bound from: deepen it
 *  and the bound moves, so the two are one constant and not two. */
const CRASH_DEPTH_RANGE: [number, number] = [0.7, 0.85]

/** One epoch's crisis: where it starts, where it bottoms, where it is over, and how deep. */
export interface MarketCrash {
  startWeek: number
  troughWeek: number
  endWeek: number
  /** ln of the trough multiplier – negative, in [ln 0.70, ln 0.85]. */
  depthLog: number
}

/** ⭐ THE CRISIS OF EPOCH `epoch`, read off `${seed}:market:crash:${epoch}` – a purpose-scoped
 *  sub-stream of its own, four draws, thrown away. Pure and total: every epoch has one. */
export function marketCrash(seed: string, epoch: number): MarketCrash {
  const rng = rngFromSeed(`${seed}:market:crash:${epoch}`)
  const startWeek = epoch * CRASH_EPOCH_WEEKS + Math.floor(rng() * CRASH_JITTER_WEEKS)
  const [dLo, dHi] = CRASH_DEPTH_RANGE
  const depthLog = Math.log(dLo + (dHi - dLo) * rng())
  const fall = CRASH_FALL_WEEKS[0] + Math.floor(rng() * (CRASH_FALL_WEEKS[1] - CRASH_FALL_WEEKS[0] + 1))
  const recovery = CRASH_RECOVERY_WEEKS[0] + Math.floor(rng() * (CRASH_RECOVERY_WEEKS[1] - CRASH_RECOVERY_WEEKS[0] + 1))
  return { startWeek, troughWeek: startWeek + fall, endWeek: startWeek + fall + recovery, depthLog }
}

/** smoothstep, the same `t²(3-2t)` the wave interpolates with – flat at both ends, so the fall
 *  arrives at the trough and the recovery arrives home without a step in the weekly figure. */
function smoothstep(t: number): number {
  return t * t * (3 - 2 * t)
}

/** ⭐⭐ THE CRASH'S CONTRIBUTION TO THE LOG-INDEX AT `week` – 0 outside a crisis, `depthLog` at the
 *  trough, smoothstepped down and back. Because an arc never crosses its epoch boundary, exactly
 *  one epoch can answer, which makes this O(1) and the no-pile-up theorem visible in the code. */
export function marketCrashLog(seed: string, week: number): number {
  const c = marketCrash(seed, Math.floor(week / CRASH_EPOCH_WEEKS))
  if (week <= c.startWeek || week >= c.endWeek) return 0
  if (week <= c.troughWeek) return c.depthLog * smoothstep((week - c.startWeek) / (c.troughWeek - c.startWeek))
  return c.depthLog * (1 - smoothstep((week - c.troughWeek) / (c.endWeek - c.troughWeek)))
}

/** ⭐ DID A CRASH'S FALL PHASE TOUCH [fromWeek, toWeek]? The season line's predicate: a season is a
 *  «crash year» when it SAW the falling, not merely some part of an arc – a window that caught only
 *  the recovery is an up year and says so plainly. A window can straddle an epoch boundary, so both
 *  epochs are asked. */
export function marketCrashFellIn(seed: string, fromWeek: number, toWeek: number): boolean {
  const first = Math.floor(Math.max(0, fromWeek) / CRASH_EPOCH_WEEKS)
  const last = Math.floor(Math.max(0, toWeek) / CRASH_EPOCH_WEEKS)
  for (let epoch = first; epoch <= last; epoch++) {
    const c = marketCrash(seed, epoch)
    if (c.startWeek < toWeek && c.troughWeek > fromWeek) return true
  }
  return false
}

/** ⭐⭐ WHERE THE MARKET STANDS IN WEEK `week`, as a multiplier around 1. `volBps` is how hard a
 *  given holding rides it – see `ShopItem.volBps`; zero is a rung that does not ride it at all and
 *  returns exactly 1, which is every car, house, deposit and yacht on the shelf.
 *
 *  ⚠ EXPONENTIAL, so the index is symmetric in log space and can never reach zero: a −20% year and
 *  a +25% year are the same distance, and no sequence of weeks can wipe a holding out. A linear
 *  `1 + vol·wave` would be neither.
 *
 *  ⚠⚠ `if (!volBps) return 1` IS THE WHOLE GUARD SINCE ROUND 30 #14, AND IT IS SINGLE NOW. It used
 *  to be true outright that removing it moved nothing (`Math.exp(0 · wave)` is already 1); the crash
 *  layer made it load-bearing, because the crash term does NOT scale with `volBps` – see below – so
 *  a zero-vol rung reaching the `exp` would price as `exp(0 + crashLog)` and every deposit, car and
 *  house would ride the crises.
 *
 *  ⚠⚠ AND ROUND 30 #14 DELETED ITS SHADOW. The guard used to be WRITTEN TWICE – here and in
 *  `marketRatio`'s own first clause – and each shadowed the other, so deleting either alone was
 *  watched leaving every arm green and only the PAIR was load-bearing. `marketRatio` went with the
 *  rebase (units are priced off `unitPriceCents`, which asks this function directly), so this clause
 *  is now the only copy and it fails ALONE: deleting it was watched turning «the deposit and the car
 *  did NOT move by a cent» red on its own. A shadowed guard became a live one by subtraction, which
 *  is the cheapest way this file has ever gained coverage.
 *
 *  ⚠ AND THE CRASH AT FULL DEPTH ON PURPOSE, NOT AT `volBps` STRENGTH. `volBps` is how hard a rung
 *  rides the everyday wobble; a crisis is not a bigger wobble, it is the market event of the year,
 *  and a rung either participates in the market (volBps > 0) or it does not. Scaling depth by vol
 *  would also quietly move his «-15…-30%» band every time the wave was re-tuned – two knobs welded
 *  together is how a measured number stops being movable.
 *
 *  Pure: no world, no MAIN draw, no clock. */
export function marketIndex(seed: string, week: number, volBps: number): number {
  if (!volBps) return 1
  return Math.exp((volBps / 10_000) * marketWave(seed, week) + marketCrashLog(seed, week))
}

/** ⭐ THE WORST THE MARKET CAN EVER DO TO A HOLDING, as a multiplier, and still a CLOSED FORM:
 *  `e^(-2·vol)` from the wave (bounded in [-1, 1] by construction) times the deepest trough the
 *  crash layer can draw (`CRASH_DEPTH_RANGE[0]`, and at most ONE crash is in force at any week –
 *  the no-overlap theorem above).
 *
 *  ⚠⚠ THE CRASH LAYER CHANGED WHAT THIS BOUND CAN PROMISE, AND THE HONEST STATEMENT IS TWO-TIER –
 *  re-derived, not hoped (his extension's own instruction):
 *
 *    * SELL IN CALM WATERS AND NOTHING CHANGED: a hold whose basis week and sell week both lie
 *      outside crash arcs sees a crash contribution of exactly 0 at both ends – the arc always
 *      returns home – so `worstCrashFreeRatio` governs and the OLD guarantee stands verbatim: at
 *      ten years the fund beats the 3.17% deposit for EVERY seed while vol < 1,824 bps.
 *    * SELL INTO A TROUGH AND UNIVERSALITY NEEDS ~15 YEARS: with this floor at 0.70,
 *      `1.07^T · worstMarketRatio > 1.0317^T` solves to T > ~14.7 years at round 30 #14's halved
 *      volatility (it was ~19.7 at 1,800 bps) – still longer than a ten-year hold. At ten years the
 *      loss tail is therefore REAL and is MEASURED, not asserted: 0.325% of 48,000 holdings, every
 *      one of them a trough-sell, against the 1.10% he accepted in round 29. See
 *      `tools/market-probe.ts` and §14i-3. Every ten-year loser sells inside a crash arc; that is a
 *      theorem (tier one), and the tests assert it on the sample.
 *
 *  «мы ни за что не наказываем» survives as: holding through a crisis costs nothing – the arc comes
 *  home by construction – and only SELLING INTO one can lose, at a measured, owner-accepted rate. */
export function worstMarketRatio(volBps: number): number {
  return Math.exp((-2 * volBps) / 10_000) * CRASH_DEPTH_RANGE[0]
}

/** The calm-waters tier of the bound above: the worst ratio between two weeks that both lie outside
 *  crash arcs. This is the number the ten-year universality claim is still made from. */
export function worstCrashFreeRatio(volBps: number): number {
  return Math.exp((-2 * volBps) / 10_000)
}
