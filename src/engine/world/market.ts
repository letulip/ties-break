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
// ⚠ WHAT IS **NOT** HERE, ON MY DECISION AND HIS. §4 also names a SHOCK and a FREEZE, and part
// three #16 explicitly ruled out the third idea in that family: «No early-exit fee or spread … that
// is friction, not risk, and it does not answer "why is a risk-free 7% sitting beside a risk-free
// 3"». A path that moves IS the answer; a toll on the door is a different mechanic wearing its coat.
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
 *  that octave alone and leaves the other three where they were. Nothing persists any of it, so this
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

/** ⭐⭐ WHERE THE MARKET STANDS IN WEEK `week`, as a multiplier around 1. `volBps` is how hard a
 *  given holding rides it – see `ShopItem.volBps`; zero is a rung that does not ride it at all and
 *  returns exactly 1, which is every car, house, deposit and yacht on the shelf.
 *
 *  ⚠ EXPONENTIAL, so the index is symmetric in log space and can never reach zero: a −20% year and
 *  a +25% year are the same distance, and no sequence of weeks can wipe a holding out. A linear
 *  `1 + vol·wave` would be neither.
 *
 *  Pure: no world, no MAIN draw, no clock. */
export function marketIndex(seed: string, week: number, volBps: number): number {
  if (!volBps) return 1
  return Math.exp((volBps / 10_000) * marketWave(seed, week))
}

/** ⭐⭐ WHAT THE MARKET DID BETWEEN TWO WEEKS – the only shape any caller actually wants, because a
 *  holding's worth is `paid × index(now) / index(basisWeek)` and the level itself is meaningless.
 *
 *  ⚠ `toWeek <= fromWeek` IS EXACTLY 1, and it is `assetValueCents`'s own `Math.max(0, weeksHeld)`
 *  said once more for the same reason: a COMMISSIONED rung's clock starts on DELIVERY
 *  (`basisWeek = readyWeek`), so every week of the wait asks for a negative span. A contract does
 *  not move with the market any more than it depreciates – there is nothing yet to move. Nothing on
 *  the shelf is both commissioned and market-driven today; the clamp is here so that a rung which is
 *  both cannot be a defect tomorrow. */
export function marketRatio(seed: string, fromWeek: number, toWeek: number, volBps: number): number {
  if (!volBps || toWeek <= fromWeek) return 1
  return marketIndex(seed, toWeek, volBps) / marketIndex(seed, fromWeek, volBps)
}

/** ⭐ THE WORST THE MARKET CAN EVER DO TO A HOLDING, as a multiplier – `e^(-2·vol)`, and it is a
 *  CLOSED FORM rather than a measurement because `marketWave` is bounded in [-1, 1] by construction.
 *
 *  It exists so the long-horizon safety claim can be a proof and not a sample: over `years` the fund
 *  compounds `(1 + rate)^years` and the market can take at most this off it, so
 *  `(1 + rate)^years · worstMarketRatio() > (1 + depositRate)^years` is a statement about EVERY seed
 *  and every pair of weeks, not about the ten thousand this repo happened to try.
 *  `tests/round29p3-market.test.ts` asserts both halves – the bound holds empirically, and the
 *  inequality holds at ten years. */
export function worstMarketRatio(volBps: number): number {
  return Math.exp((-2 * volBps) / 10_000)
}
