// ROUND 45 #3 – THE RAISE REQUEST, THE SEATS' COMMON HALF; ROUND 45 #3b – AND ITS SIZE FLOATS WITH THE YEAR.
//
// THE OWNER: «Письма с прогрессом от специалистов приходят, а повышение они так и не просят, только
// массажист растёт сам по себе тихо ежегодно». B2 turned the masseur's silent yearly index into an OPEN
// staff letter (`raiseStaffAsk` in offers.ts). This file is the SAME mechanism asked of the two seats that
// bill by the WEEK – the psychologist and the hitting partner – so a seat's service clock, its anniversary,
// its request and the drift of its fee are ONE spelling here rather than three.
//
// ⭐⭐⭐ 02.10, THE OWNER'S SECOND WORD: «мы обсуждали, что там может быть плавающая вилка. тренер тоже
// вполне может просить повышения – с удачных лет по-больше, с неудачных по-меньше, как и все остальные».
// So the step a request asks for is no longer one fixed 4%: a GOOD year asks for more, a BAD one for less,
// a flat one for the base. `staffYearVerdict` is the ONE answer to «was her year good» for the three seats
// that sit here, and `staffRaiseStep` maps it to the figure. The coach's own step is HIS corridor
// (`coachAskFraction(coachProgressScore)` – already a floating fork, round 44) and lives beside his score,
// because his module reaches `sponsors.ts` and this leaf may not reach it back.
//
// ⚠ A LEAF ON PURPOSE. It reaches `economy`, `offers`, `season/calendar`, `world/ledger` and the season-facts
// leaf, and NO seat module: each seat module imports THIS, so a seat that bills through it can never close
// a cycle (`tests/import-cycles.test.ts`). The hire / release tag a seat's clock reads is therefore an
// ARGUMENT (`PSYCHOLOGIST_CHANGE_KEY`, `SPARRING_CHANGE_KEY`), handed over by the seat that owns it.
//
// ⭐⭐⭐ THE FEE IS THE CHAIN OF SIGNED PAPERS (02.10, replacing B2's exponent). With a step that differs
// every year there is no `(1+step)^n`: what a seat is paid is its BASELINE moved by every request the family
// SIGNED, in order, each paper printing the two figures it moved between. So a seat's fee is the baseline
// times the product of its signed papers' ratios (`staffFeeCents`) – and because each paper's `fromCents`
// is the fee at its own arrival, that product telescopes: on one rung the fee IS the latest signed paper's
// `toCents`, exactly what the letter said, and across a rung switch the same multiplier lifts the new rung's
// catalogue price (a rung is who takes the call; the drift belongs to the SEAT, B2b's ruling).
//   · the masseur's baseline is his opening price drifted by the years he served BEFORE his first paper
//     (`world/masseur.ts`) – the silent era's raises are already being paid and stay paid;
//   · the two weekly seats' baseline is the rung's catalogue price – they never rose, so a save with no
//     papers pays the opening price and goes on paying it.
// A refused or lapsed paper is not in the chain, so Decline leaves the fee where it is – ⚠ AND SINCE B17
// (02.10, fourth batch: «можно принцип сделать похожим, но размер немного изменить для supportов») THE NEXT
// REQUEST CARRIES THE REFUSED YEAR in its figure, at the seat's own smaller scale: see «THE BANK» below.
// (Before B17 a refused year was FORGONE – the next ask was one step above what the seat is paid now.)
//
// ⚠⚠ NOTHING IS PERSISTED AND NOTHING DRAWS. The fee is derived from the signed papers, the verdict reads
// banked season rows, and the writer reads state only – no stream, no `Math.random`, no wall clock. No
// save-schema move.

import { ECONOMY } from '../economy'
import { raiseStaffAsk, staffAskId, staffAsks } from '../offers'
import { WEEKS_PER_YEAR } from '../season/calendar'
import type { Offer, StaffLetterTerms, StaffSeat } from '../../shared/protocol'
import { seasonIndexOf } from './ledger'
import { SEASON_PLAYED_WEEKS, seasonRankOf, titlesInSeason } from './seasonFacts'
import type { WorldState } from './state'

/** The seats whose request is sized HERE – every seat but the coach (see the head note). */
export type StaffRaiseSeat = Exclude<StaffSeat, 'coach'>

/** HOW HER LAST FINISHED YEAR WENT, in the only three words the request needs. */
export type StaffYearVerdict = 'good' | 'flat' | 'bad'

/** ⚠⚠ DEFAULTED PARAMETERS, FLAGGED AS SUCH – the owner picks the numbers later (02.10: he named the shape,
 *  «плавающая вилка», and no figure). A GOOD year asks for 6%, a BAD one for 2%; the FLAT year's base is
 *  the masseur's own `ECONOMY.masseur.raisePerYear` (4%, ruled and benched in round 43), read at call time
 *  so a bench that moves that knob moves the base with it. Held PER SEAT so the day the owner gives one
 *  seat its own number it is one line, and deliberately NOT new `ECONOMY` keys: that table is hash-pinned
 *  (`tests/principles-t73-economy-identity.test.ts`) and a knob nobody has ruled on should not be dressed
 *  as one. ⚠ The masseur's «не так интенсивно как тренер» (round 43) now holds against the coach's
 *  CORRIDOR (5–15%) as a whole and no longer at its floor: a good year's 6% sits above the coach's 5%. */
export const STAFF_RAISE_STEPS: Record<StaffRaiseSeat, { good: number; bad: number }> = {
  masseur: { good: 0.06, bad: 0.02 },
  psychologist: { good: 0.06, bad: 0.02 },
  sparring: { good: 0.06, bad: 0.02 },
}

type SeasonRow = WorldState['seasonHistory'][number]

/** Did her ranking move between two banked seasons – +1 she finished the year better placed, -1 worse, 0
 *  neither or unknown. Read on the TABLE the year just finished was played on (`seasonRankOf`, the very
 *  rule the coach's year-end letter prints its rank by), against the same table a year earlier.
 *  ⚠ UNKNOWN IS NEVER A MOVE: a row banked before v46 carries no per-table ranks, and a first season has
 *  nothing before it; both read 0 and the verdict falls back to the titles alone. ⚠ `null` IS NOT A ZERO ON
 *  EITHER SIDE – the coach's own reading (`coachProgressScore`'s rank component): unranked → ranked is a
 *  move up, and a girl who held a place a year ago and holds none now has slipped. */
function rankMoved(prev: SeasonRow | undefined, last: SeasonRow): -1 | 0 | 1 {
  if (!prev?.byTrack || !last.byTrack) return 0
  const now = seasonRankOf(last)
  if (now.rankTrack === undefined || now.endRank === undefined) {
    return Object.values(prev.byTrack).some((t) => t.endRank !== undefined) ? -1 : 0
  }
  const before = prev.byTrack[now.rankTrack]?.endRank
  if (before === undefined) return 1
  return now.endRank < before ? 1 : now.endRank > before ? -1 : 0
}

/** ⭐⭐⭐ WAS HER LAST YEAR A GOOD ONE – the ONE answer, read by every seat that is sized here.
 *
 *  DERIVED FROM THE BANKED SEASON ROWS, and not from the coach's `coachProgressScore`: that score is
 *  measured against the marks stored ON HIS CONTRACT (the rank, the skills and the residual since his fee
 *  was agreed), so it belongs to HIS clock – it does not exist for a self-coached family and it covers a
 *  different stretch of weeks from the masseur's anniversary. The facts used here are the two the staff's
 *  own year-end letters already print about her year – where she finished and what she won
 *  (`world/seasonFacts.ts`, shared with `staffLetters.ts`) – so a letter that REPORTS the season and a
 *  request SIZED by it cannot tell two stories.
 *
 *  THE RULE, deliberately the smallest one (the owner will rule on what counts as good):
 *    GOOD  – she finished the year better placed than the year before, OR she won a title and did not slip;
 *    BAD   – she finished it worse placed and won nothing;
 *    FLAT  – anything else, including a first season, a season with no banked row, and a year she both
 *            slipped in and won a title in.
 *  ⚠ NO THRESHOLD IS INVENTED: rank movement is the sign of the change, so there is no «how much better».
 *
 *  Which year: the one ASKED FOR (`staffYearVerdictAt`) – its banked row against the row one season before it,
 *  its titles counted off `trophiesByTier` – and `staffYearVerdict` is the LATEST banked season, the special
 *  case this function used to be alone (the wrap-up writes a row on the first off-season week). ⭐ B17
 *  (02.10, fourth batch) is why the year is an ARGUMENT: a request that carries its refused years in its figure
 *  has to read each of THEIR years, not only the latest. ⚠ A season with no banked row (not finished yet, or
 *  older than the history's cap) reads FLAT: nothing can be said about a year nobody counted.
 *  Pure, zero draws. */
export function staffYearVerdictAt(world: WorldState, seasonIndex: number): StaffYearVerdict {
  const rows = world.seasonHistory ?? []
  const row = rows.find((h) => h.seasonIndex === seasonIndex)
  if (row === undefined) return 'flat'
  const prev = rows.find((h) => h.seasonIndex === seasonIndex - 1)
  const yearStart = seasonIndex * WEEKS_PER_YEAR
  const titles = titlesInSeason(world, yearStart, yearStart + SEASON_PLAYED_WEEKS)
  const moved = rankMoved(prev, row)
  if (moved > 0 || (titles > 0 && moved >= 0)) return 'good'
  if (moved < 0 && titles === 0) return 'bad'
  return 'flat'
}

/** THE LATEST SEASON THE WRAP-UP HAS BANKED – -1 for a career with no banked row at all (every verdict then
 *  reads FLAT). On an anniversary this is the season the request is about. Pure. */
export function latestBankedSeason(world: WorldState): number {
  let latest = -1
  for (const h of world.seasonHistory ?? []) if (h.seasonIndex > latest) latest = h.seasonIndex
  return latest
}

/** ⭐⭐⭐ WAS HER LAST YEAR A GOOD ONE – the latest-year special case of `staffYearVerdictAt`, ONE
 *  implementation and no second spelling. */
export function staffYearVerdict(world: WorldState): StaffYearVerdict {
  return staffYearVerdictAt(world, latestBankedSeason(world))
}

/** THE STEP ONE VERDICT ASKS FOR – the verdict mapped to a fraction. One place, so the masseur, the
 *  psychologist and the hitting partner can never read a year three ways, and so a banked request reads
 *  every year it carries through the same table as a single one. Pure, zero draws. */
function stepOfVerdict(seat: StaffRaiseSeat, verdict: StaffYearVerdict): number {
  if (verdict === 'good') return STAFF_RAISE_STEPS[seat].good
  if (verdict === 'bad') return STAFF_RAISE_STEPS[seat].bad
  return ECONOMY.masseur.raisePerYear
}

/** ⭐⭐⭐ THE STEP A REQUEST ASKS FOR THIS YEAR – the latest year's verdict mapped to a fraction. ⚠ Since B17 it
 *  is ONE factor of a request's growth (`staffRaiseGrowth`), the whole of it only when no year was refused.
 *  Pure, zero draws. */
export function staffRaiseStep(seat: StaffRaiseSeat, world: WorldState): number {
  return stepOfVerdict(seat, staffYearVerdict(world))
}

/** A SEAT'S SIGNED PAPERS, OLDEST FIRST – the chain. An open, refused or lapsed request is not in it, so
 *  Decline and a lapse leave the fee where it was. `offers` may be absent on a hand-built probe world: no
 *  papers, no raise. */
export function staffSignedAsks(offers: Offer[] | undefined, seat: StaffSeat): Offer[] {
  return staffAsks(offers ?? [], seat)
    .filter((o) => o.state === 'signed')
    .sort((a, b) => a.week - b.week || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0))
}

/** THE SEAT'S DRIFT SO FAR – the product of the ratios its signed papers moved by. 1 for a seat with no
 *  signed paper. */
export function staffDriftFactor(offers: Offer[] | undefined, seat: StaffSeat): number {
  let factor = 1
  for (const o of staffSignedAsks(offers, seat)) {
    const ask = (o.terms as StaffLetterTerms).ask
    if (ask && ask.fromCents > 0) factor *= ask.toCents / ask.fromCents
  }
  return factor
}

/** ⭐⭐⭐ WHAT A SEAT IS PAID NOW AT A RUNG WHOSE BASELINE PRICE IS `baseCents` – the baseline moved by the
 *  chain of signed papers, whole dollars (the house prices these seats in whole dollars, and the paper IS
 *  the fee, so each paper's own rounding stands – on one rung this is the latest signed `toCents` exactly).
 *  ⚠ A seat with no signed paper pays the baseline UNTOUCHED – the identity, which is what keeps every
 *  save from before the papers paying exactly what it paid. Pure, zero draws. */
export function staffFeeCents(offers: Offer[] | undefined, seat: StaffSeat, baseCents: number): number {
  const factor = staffDriftFactor(offers, seat)
  if (factor === 1) return baseCents
  return Math.round((baseCents * factor) / 100) * 100
}

// --- ⭐⭐⭐ THE BANK (B17, 02.10 fourth batch) --------------------------------------------------------------
//
// THE OWNER: «можно принцип сделать похожим, но размер немного изменить для supportов». The coach's principle is
// that a refused year is not forgotten in the price (his corridor reads the score SINCE his fee was agreed, so a
// refusal banks by construction). These three seats had been asked «one step above what you are paid now»
// whatever the family had refused; they now bank THE SAME WAY and keep their OWN scale:
//
//   next ask = fee × Π (1 + step(verdict of y))   over every year y since the fee last moved,
//
// each year's verdict recomputed from the banked season facts FOR THAT YEAR (`staffYearVerdictAt`: rank movement
// y against y-1 on her main table, titles in y – the same facts, the same three words) and each step the seat's
// own 2 / 4 / 6% (`STAFF_RAISE_STEPS`), NOT the coach's 5–15% corridor.
//
// ⚠ «SINCE THE FEE LAST MOVED» IS COUNTED IN REQUESTS, NOT IN CALENDAR YEARS. Every anniversary writes one paper,
// and a paper the family let go by (refused, lapsed or still open) is one withheld year, so the next ask spans
// 1 + the unsigned papers written after the ANCHOR – the LATER of
//   · the last SIGNED paper (the fee moved there: a signature banks everything in ONE jump, and the bank is
//     spent), and
//   · the latest HIRE of the seat (a re-hire is a new arrangement, so the refusals of an earlier one are not
//     carried into it – the bank resets, the fee chain does not).
// ⭐ That makes every legacy career neutral WITHOUT a special case: the masseur's silent-era raises are priced into
// his baseline exponent (`masseurBaselineYears`) and are not papers, and a weekly seat that was already on the
// payroll before the papers existed has no refused paper to bank – nobody was ever asked, so nobody refused.
// Its first request is one step, exactly as before.
//
// ⭐ THE YEARS, newest first, are the latest banked season and the seasons just before it, one per request in the
// span: consecutive requests of one arrangement are 52 weeks apart, so each reads the season after the one
// before it (`staffRaiseYears`).
//
// ⭐⭐ BACKWARD-NEUTRAL BY CONSTRUCTION. A family that signs every year has a span of exactly one, so the growth is
// `1 * (1 + step)` – multiplying by 1 is exact in floating point – the very number the single step was, and the
// same whole-dollar rounding follows. Only a refusal moves a figure.
//
// ⭐ ONE ROUNDING, AT THE END. The product is rounded to whole dollars once, after the last year (the paper IS the
// fee, and the house prices these seats in whole dollars) – never year by year, which would let a three-year
// bank drift by cents against the same three steps compounded.
//
// ⚠ NOTHING IS PERSISTED AND NOTHING DRAWS. The span reads the papers (never pruned), the hire marks (kept
// ledger rows) and the banked season rows with `trophiesByTier` (never pruned); no stream, no clock, no schema
// move. «Nobody leaves, nobody punishes» stands: the refusal lives ONLY in the figure of the next ask.

/** THE LATEST HIRE OF THE SEAT – the week its current arrangement began; -Infinity for a probe world with the
 *  flag set and no tagged row. The ledger rows alternate hire / release by construction, so the hires are the
 *  even-indexed marks. */
function staffLatestHireWeek(world: WorldState, changeKey: string): number {
  const marks = staffChangeMarks(world, changeKey, world.week)
  let latest = -Infinity
  for (let i = 0; i < marks.length; i += 2) latest = marks[i]
  return latest
}

/** HOW MANY REQUESTS HAVE GONE UNSIGNED SINCE THE FEE LAST MOVED – each one a year the family let go by, and
 *  the bank's whole size. 0 for a career that signs every year, for a career with no paper at all, and right
 *  after a re-hire. ⚠ Every paper written after the anchor is UNSIGNED by construction – the last signature IS
 *  the anchor – so there is no state test here, and none is wanted: it would only hide a wrong anchor. */
export function staffBankedYears(world: WorldState, seat: StaffRaiseSeat, changeKey: string): number {
  const signed = staffSignedAsks(world.offers, seat)
  const lastSigned = signed.length > 0 ? signed[signed.length - 1].week : -Infinity
  const anchor = Math.max(staffLatestHireWeek(world, changeKey), lastSigned)
  return staffAsks(world.offers ?? [], seat).filter((o) => o.week > anchor).length
}

/** THE SEASONS THE NEXT REQUEST IS ABOUT, newest first – the latest banked season, then one season further back
 *  for every year the family let go by. */
export function staffRaiseYears(world: WorldState, seat: StaffRaiseSeat, changeKey: string): number[] {
  const latest = latestBankedSeason(world)
  const span = 1 + staffBankedYears(world, seat, changeKey)
  return Array.from({ length: span }, (_, i) => latest - i)
}

/** THE GROWTH THE NEXT REQUEST ASKS FOR – the product of (1 + step) over its years, each year's step from ITS OWN
 *  verdict. Unrounded: the one rounding belongs to the figure it multiplies (`staffRaiseQuote`). Pure. */
export function staffRaiseGrowth(world: WorldState, seat: StaffRaiseSeat, changeKey: string): number {
  let growth = 1
  for (const y of staffRaiseYears(world, seat, changeKey)) growth *= 1 + stepOfVerdict(seat, staffYearVerdictAt(world, y))
  return growth
}

/** THE TWO FIGURES A REQUEST PRINTS: what the seat is paid now, and that figure grown by the BANK
 *  (`staffRaiseGrowth`: one FLOATING step when nothing was refused), whole dollars, rounded ONCE. `null` for an
 *  ask that would not move the rate – unreachable on the shipped prices and the shipped steps, guarded so a
 *  retune cannot write a letter about nothing. */
export function staffRaiseQuote(
  world: WorldState,
  seat: StaffRaiseSeat,
  changeKey: string,
  baseCents: number,
): { fromCents: number; toCents: number } | null {
  const fromCents = staffFeeCents(world.offers, seat, baseCents)
  const toCents = Math.round((fromCents * staffRaiseGrowth(world, seat, changeKey)) / 100) * 100
  return toCents > fromCents ? { fromCents, toCents } : null
}

/** THE LEDGER'S HIRE / RELEASE MARKS FOR ONE SEAT up to and including `week`, oldest first – the one read the
 *  service clock and the bank's anchor (`staffLatestHireWeek`) both stand on. */
function staffChangeMarks(world: WorldState, changeKey: string, week: number): number[] {
  const marks: number[] = []
  for (const e of world.events) {
    if (e.milestoneKey?.startsWith(changeKey) && e.week <= week) marks.push(e.week)
  }
  return marks.sort((a, b) => a - b)
}

/** EVERY WEEK A SEAT WAS ON THE PAYROLL, up to and including `week` – the sum of the hired spans the
 *  hire ledger records, never «weeks since the hire» (a clock that reset on a re-hire would let a
 *  family fire a seat for a week to buy the entry price back). `world/masseur.ts`
 *  `masseurWeeksServedAt` is the same read for one key; its note on why the rows alternate hire /
 *  release by construction applies word for word, and so does its courtesy to a hand-built probe world
 *  with the flag set and no tagged row: ZERO weeks, the identity element, rather than a crash.
 *  Pure read, zero draws. */
export function staffWeeksServedAt(world: WorldState, changeKey: string, week: number): number {
  const marks = staffChangeMarks(world, changeKey, week)
  let served = 0
  for (let i = 0; i < marks.length; i += 2) {
    // An odd tail is the span still running – it closes at the week being asked about.
    const until = i + 1 < marks.length ? marks[i + 1] : week
    served += Math.max(0, until - marks[i])
  }
  return served
}

/** HOW MANY ANNIVERSARIES A SEAT HAS REACHED – one per completed year on the payroll. */
export function staffYearsServed(world: WorldState, changeKey: string): number {
  return Math.floor(staffWeeksServedAt(world, changeKey, world.week) / WEEKS_PER_YEAR)
}

/** IS THIS THE WEEK THE SEAT ASKS – the week its service count crosses a whole year. ⚠ It asks LAST
 *  WEEK TOO, for `masseurRaiseDue`'s reason: the count does not move on the week a span opens, so
 *  «divisible by 52» alone would also be true on a RE-HIRE week that already sits on a multiple, and
 *  the honest question is whether the counter INCREMENTED into a year this week. Pure, zero draws. */
export function staffRaiseDue(world: WorldState, hired: boolean, changeKey: string): boolean {
  if (!hired) return false
  const served = staffWeeksServedAt(world, changeKey, world.week)
  if (served <= 0 || served % WEEKS_PER_YEAR !== 0) return false
  return staffWeeksServedAt(world, changeKey, world.week - 1) === served - 1
}

/** ⭐⭐⭐ THE ANNIVERSARY WRITES THE REQUEST. On the week a seat's service count crosses a whole year this
 *  writes ONE open staff letter (`raiseStaffAsk`: the sponsor letters' four-week window, answered through
 *  `acceptOffer` / `declineOffer`) quoting what the seat is paid now and the BANKED growth above it
 *  (`staffRaiseQuote`: one FLOATING step when no year was refused), both at the rung the family is on. `baseCents` is that rung's BASELINE price – the
 *  catalogue price for the weekly seats, the silent-era rate for the masseur; the two figures are frozen on
 *  the paper (a rung switched inside the window moves the bill, not the paper).
 *
 *  ⚠ ONE REQUEST PER YEAR OF SERVICE, idempotent on `staffAskId`, so a re-hire week already sitting on a
 *  year cannot write a second. ⚠ An ask that would not move the rate is no ask. ⚠ NO CASH MOVES here:
 *  the letter is paper, and the bill that follows is the seat's own `resolve*`, at whatever the derived
 *  fee then is. */
export function writeStaffRaise(
  world: WorldState,
  seat: StaffRaiseSeat,
  changeKey: string,
  hired: boolean,
  baseCents: number,
): void {
  if (!staffRaiseDue(world, hired, changeKey)) return
  const year = staffYearsServed(world, changeKey)
  if (world.offers.some((o) => o.id === staffAskId(seat, year))) return
  const quote = staffRaiseQuote(world, seat, changeKey, baseCents)
  if (!quote) return
  raiseStaffAsk(world.offers, world.week, year, {
    seat,
    seasonIndex: seasonIndexOf(world.week),
    // The total weeks on the payroll at the anniversary – a whole number of years by construction.
    weeksServed: staffWeeksServedAt(world, changeKey, world.week),
    ask: quote,
  })
}
