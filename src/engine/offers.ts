// THE INBOX - somebody writes to the family, and the parent decides.
//
// docs/specs/offers-and-the-inbox.md. This file is the whole mechanism: an offer arrives, it holds a
// deadline, it is signed or refused or it expires, and a signed one is honoured until it runs out.
// The letter's WORDS live in the UI (components/OfferLetter.vue); the letter's TERMS live here, and
// the two may not disagree - every field of `KitOfferTerms` is printed on the paper.
//
// WHY THIS EXISTS AT ALL, in one paragraph. The kit deal already shipped: `localSponsorCents` returned
// a number at the season boundary, the number was added to the balance, a line appeared in the feed.
// The player was never asked. The owner (31.07) did not ask for a new economy - he asked for the
// money to arrive AS AN OFFER instead of as weather: «попапчик получить с письмом-предложением
// рукописным… И кнопка sign/refuse… можно завести inbox на home возле колокольчика и давать человеку
// какое-то время на подумать».
//
// ⚠ RNG DISCIPLINE, AND IT IS THE ONE RULE THIS FILE COULD BREAK EXPENSIVELY. Whether the shop
// writes this year is randomness, and it comes off `seed:offer:<week>` - a purpose-scoped sub-stream
// created fresh, read once and thrown away, exactly as `seed:weather:` and `seed:crowd:` are. It is
// NEVER a draw on the main weekly stream, which carries base costs and cohort drift and nothing
// else. The frozen MAIN capture (41550 draws / e6b0c709) therefore cannot move by one, and
// tests/offers.test.ts reproduces it against a career that is signing letters.
//
// ⚠ AND THE ARITY IS THE STRUCTURAL HALF OF THAT GUARANTEE. Every function here takes `world` (or a
// seed and a week) and no `Rng`. There is no parameter to misuse, which is the same protection
// `rollInjury` / `resolvePhysio` / `injuryTau` keep and the same one their arity test pins.
//
// --- WHAT THE SECOND SLICE ADDED (01.08, feat/brand-ladder) -------------------------------------
//
// THREE RUNGS INSTEAD OF ONE, and the rung says WHICH OF HER EQUIPMENT LINES IT COVERS - see
// `SponsorTier` for the design and `ECONOMY.sponsorship` for every number. Four rules hold the shape
// together and each of them is enforced in exactly one place in this file:
//
//   1. THE GATES ARE ON DIFFERENT TABLES. `local` keeps the domestic gate it always had; `national`
//      and `global` read the ITF one. `rungFor` is the only function that answers "who writes".
//   2. ONE BRAND AT A TIME. `raiseKitOffer` refuses to write while a deal is running or a letter is
//      unanswered. Without it a career collects all three rungs and the ladder means nothing.
//   3. THE LETTER ARRIVES IN THE OFF-SEASON. `isSponsorReviewWeek` - the first quiet week and no
//      other - so the contract is signed before the year she plays it opens.
//   4. A TERM CAN OUTLAST A SEASON. `dealUntilWeek` anchors it on the season she is about to play,
//      never on the week he signed, so waiting can never buy extra weeks of cover.

import { ECONOMY } from './economy'
import { rngFromSeed } from './rng'
import { isOffSeasonWeek, WEEKS_PER_YEAR } from './season/calendar'
import type { KitFreshCap } from './equipment'
import type { TierId } from './season/types'
import type { KitEndReason, KitLine, KitOfferTerms, Offer, SponsorTier } from '../shared/protocol'

/** Every sponsor tier's letterhead lives at `public/images/sponsors/<key>.webp`, and this is the
 *  lookup - a tier, never a filename spelled out at a call site. All three rungs are reachable since
 *  01.08 (feat/brand-ladder); the art shipped first and the coverage ladder is written on it. */
export const SPONSOR_TIERS: readonly SponsorTier[] = ['local', 'national', 'global'] as const

// =================================================================================================
// THE BRAND LADDER - three rungs, and the rung says WHICH OF HER LINES IT COVERS
// =================================================================================================
//
// The whole argument for the numbers is on `ECONOMY.sponsorship`; the argument for the SHAPE is
// `SponsorTier`. What lives here is the part that has to see the tier catalogue: the two upper gates
// are read off `TIERS.j300.drawSize`, and economy.ts cannot import the calendar (calendar.ts imports
// ECONOMY - the cycle is real and predates this slice). So the figures are written out in ECONOMY
// where every other knob is, and the equality with the tier table is pinned by a test rather than by
// an import.
//
// ⚠ COVERAGE IS THE LADDER. Each rung names the lines it supplies, and that ONE list drives both
// halves of what a sponsor does - the gear bills it picks up and the wear ceiling it holds down - so
// the letter's promise and the match's arithmetic cannot say different things.

/** What each rung covers, in the order the equipment model reads the lines. `local` is the string
 *  bed alone: ECONOMY.equipment calls it "the biggest and truest lever", and it is also the line she
 *  replaces most often, so it is the honest thing for a shop with one van to be paying for. */
export const TIER_COVERS: Record<SponsorTier, readonly KitLine[]> = {
  local: ['strings'],
  national: ['strings', 'frame'],
  global: ['strings', 'frame', 'shoes'],
}

/**
 * IS THIS LETTER STILL A DECISION? The one definition, read by the engine, the snapshot's dot and
 * the screen, so none of them can answer it differently.
 *
 * Both halves matter and neither implies the other: a signed offer is not live however early it is,
 * and an open offer past its deadline is not live however open the field says it is. The second half
 * is belt and braces - `expireOffers` runs at the top of every tick, so an `open` offer should
 * always be inside its window - but a save reloaded mid-week is exactly the seam where "should"
 * turns into a dot that will not go out.
 */
export function isOfferLive(offer: Offer, week: number): boolean {
  return offer.state === 'open' && week <= offer.deadlineWeek
}

/** THE INBOX DOT, as a fact rather than as a rendering. See `Snapshot.offerOpen`. */
export function hasLiveOffer(offers: Offer[], week: number): boolean {
  return offers.some((o) => isOfferLive(o, week))
}

/**
 * THE KIT DEAL IN FORCE THIS WEEK, or null.
 *
 * A signed deal is honoured from the week it was signed to `untilWeek` and not a week further -
 * nothing here re-reads `ECONOMY`, so a deal signed under one set of numbers is honoured under those
 * numbers for its whole life.
 *
 * ⚠ THERE IS AT MOST ONE, AND SINCE THE BRAND LADDER THAT IS ENFORCED RATHER THAN MERELY TRUE. It
 * used to hold by accident of the schedule (one review a season, one-season terms); the upper rungs
 * run for two and three seasons, so `raiseKitOffer` now refuses to write a competing letter while
 * this returns anything. The `find` is still written to be honest about the invariant rather than to
 * permit a second deal.
 */
export function activeKitDeal(offers: Offer[], week: number): Offer | null {
  return (
    offers.find(
      (o) => o.kind === 'kit' && o.state === 'signed' && week <= (o.untilWeek ?? -1) && week >= (o.decidedWeek ?? 0),
    ) ?? null
  )
}

/**
 * HOW FRESH THE SHOP KEEPS HER KIT this week - a ceiling on wear in `KitWear`'s units, or null when
 * nobody is supplying her.
 *
 * ⚠ WHY A CEILING RATHER THAN A SHORTER CADENCE, because that is the interesting half. Gear purchase
 * weeks are drawn from `seed:gear:<category>` and `weeksSinceGear` walks that stream in lockstep with
 * `gearHitsUpTo` - the price draw is spent even where it is unused precisely so the two can never
 * disagree about when she bought. Moving the cadence would mean moving both walks together, and a
 * career that signed in week 60 would have a different gear history before week 60 than the same
 * career that refused. A CEILING touches no schedule at all: the family buys exactly when it always
 * bought, and the shop's own top-ups - which are not on anybody's ledger and are not scheduled - are
 * expressed as the simple fact that no line is allowed to reach the dead end while the deal runs.
 *
 * ⚠ AND IT CANNOT MAKE MONEY BUY STROKES, which is `ECONOMY.equipment`'s standing rule. The cap only
 * ever REDUCES wear, so a sponsored girl sits between her unsponsored self and fresh kit and never
 * past it. It is also the one shape of sponsor benefit that is genuinely flat: a ceiling is the same
 * number for every background, and because the wealthy family already restrings inside the string's
 * life it is worth almost nothing to her and a great deal to the working family who was stretching
 * past it. That is the OPPOSITE direction to the per-item discount this deal used to be, which paid
 * the wealthy family seven times more (see ECONOMY.sponsorship).
 */
export function kitFreshCap(offers: Offer[], week: number): KitFreshCap | null {
  const deal = activeKitDeal(offers, week)
  if (!deal) return null
  const terms = deal.terms as KitOfferTerms
  // ⚠ ONLY THE COVERED LINES GET A KEY. An absent key is "this line is hers", which is what makes a
  // local deal different from a global one at all - see `kitWearAt`, which must never fall back to a
  // default ceiling for a line the brand never promised.
  const cap: KitFreshCap = {}
  for (const line of terms.covers) cap[line] = terms.freshCap
  return cap
}

/** WHAT SHARE OF A TRIP THE BRAND IS PAYING this week, 0 when nobody is. The top rung's "hand with
 *  the travel", and it is read HERE rather than at the till so that `travelCostFor` - the one
 *  definition the charge, the refund and the planner's quote all share - stays the only place a
 *  fare is ever reduced. */
export function kitTravelShare(offers: Offer[], week: number): number {
  const deal = activeKitDeal(offers, week)
  if (!deal) return 0
  return (deal.terms as KitOfferTerms).travelShare ?? 0
}

/**
 * WHETHER THE SHOP WRITES THIS YEAR - the one random thing about an offer, and the whole reason the
 * deadline is a gamble in both directions (spec §2: "a better offer may arrive while this one is
 * open – and it may not").
 *
 * Off `seed:offer:<week>`: its own stream, created here, read once, discarded. Keyed on the WEEK, so
 * the same career always gets the same answer at the same boundary however many times it is
 * replayed, and no other sub-stream shifts by a draw.
 */
export function shopWritesAt(seed: string, week: number, chance: number): boolean {
  const rng = rngFromSeed(`${seed}:offer:${week}`)
  return rng() < chance
}

/** Where she stands on both tables, as the brand ladder reads it. One argument object rather than
 *  three loose numbers, because the two upper rungs need the international pair TOGETHER and a
 *  positional call site would be one transposition away from gating a global deal on a domestic
 *  rank - which is precisely the class of bug two-ladders.md exists to record. */
export interface SponsorStanding {
  /** Her place in the DOMESTIC table (`world.kidRankDomestic`). */
  nationalRank: number
  /** Her place in the ITF table (`world.kidRank`). */
  itfRank: number
  /** ⚠ AND WHETHER THAT PLACE MEANS ANYTHING. Competition ranking gives every member of a tie the
   *  same rank, and everyone without a counting international result ties at the floor - so a
   *  fourteen-year-old who has never left the country can read as a number that looks like a
   *  standing. You cannot be inside the world's top 32 if you have no world ranking, so the two
   *  upper gates demand a counting result IN THAT TABLE before they read a position at all. Same
   *  `hasResults` guard the acceptance lists keep (world.ts, `availabilityStatus`) and the econ
   *  bench puts on its rank arm, for the same reason. */
  itfRanked: boolean
  /** Her place in the PROFESSIONAL table (`world.kidRankWta`) - the merged W standings. */
  wtaRank: number
  /** ...and whether it means anything, exactly as `itfRanked` does for the junior one: a counting
   *  result in THAT table, never a floor tie read as a standing. */
  wtaRanked: boolean
}

/** DOES THIS STANDING CLEAR THIS RUNG - by ANY table she competes in. One predicate, because the
 *  question is asked twice about the same girl: once to decide who writes to her (`rungFor`) and
 *  once to decide whether the deal she is already under holds (`reviewSponsors`).
 *
 *  ⚠ THE PROFESSIONAL ARM IS THE OWNER'S 02.08 RULING («спонсор вполне может жить и дальше»), and
 *  it closes a hole the two-type feed exposed rather than caused. Both upper rungs read the JUNIOR
 *  table and National's keep-condition reads the DOMESTIC one - and BOTH of those decay to nothing
 *  the moment she turns professional, because every table here is a rolling 52-week window and she
 *  stops entering the events that feed them. So the brand ladder was built to switch itself off at
 *  exactly the moment a real sponsor's interest begins: a national distributor's logo on a WTA
 *  player is worth MORE than on a junior, not less. The rule that was written («a season spent
 *  entirely on the international calendar decays her domestic points and she slides out of the
 *  band») was true of a junior going abroad - a lateral move inside the same visibility economy -
 *  and is simply false of a professional.
 *
 *  THE PROFESSIONAL NUMBERS ARE BUILT THE SAME WAY THE JUNIOR PAIR IS, off one figure in the tier
 *  table rather than picked: National signs the girl who would be IN the prestige draw (junior:
 *  the J300 main draw, 32; professional: accepted into a W100, `enterPct` 0.25 of the ~500-row
 *  merged table = 125), and Global signs the one who would still be in it on the last day (the
 *  same quarter: 8 of 32, 31 of 125). See `ECONOMY.sponsorship.*.maxWtaRank`.
 *
 *  A professional also always clears the LOCAL shop: the whole rung is "a shop that has heard of
 *  her", and a girl on the world tour has cleared that bar by definition. */
export function standingClears(standing: SponsorStanding, tier: SponsorTier): boolean {
  const s = ECONOMY.sponsorship
  if (tier === 'global') {
    return (
      (standing.itfRanked && standing.itfRank <= s.global.maxItfRank) ||
      (standing.wtaRanked && standing.wtaRank <= s.global.maxWtaRank)
    )
  }
  if (tier === 'national') {
    return (
      (standing.itfRanked && standing.itfRank <= s.national.maxItfRank) ||
      (standing.wtaRanked && standing.wtaRank <= s.national.maxWtaRank)
    )
  }
  return standing.nationalRank <= s.maxRank || standing.wtaRanked
}

/** WHICH RUNG WRITES TO HER, or null when nobody does - the whole gate, in one function, so no
 *  caller can answer it differently.
 *
 *  ⚠ THE BEST RUNG SHE CLEARS, AND ONLY THAT ONE. A girl inside the world's top 8 is also inside its
 *  top 32 and probably top of her national table, and three letters in one winter would make the
 *  ladder a collection rather than a climb. The brands are read strongest-first for the same reason
 *  the entry policy walks the calendar strongest-tier-first: an ambitious parent is being written to
 *  by the biggest name that would have him. */
export function rungFor(standing: SponsorStanding): SponsorTier | null {
  return SPONSOR_TIERS_STRONGEST_FIRST.find((t) => standingClears(standing, t)) ?? null
}

/** The ladder read the way `rungFor` reads it. `SPONSOR_TIERS` is weakest-first (it is the art
 *  lookup's order); reversing it HERE, once, keeps the two from disagreeing about the ladder. */
const SPONSOR_TIERS_STRONGEST_FIRST: readonly SponsorTier[] = [...SPONSOR_TIERS].reverse()

/** What the letter says, given where she finished the year. Pure, so the tests and the bench can ask
 *  directly - the same courtesy `localSponsorCents` extends. Returns null when nobody is writing.
 *
 *  ⚠ TERMS ARE A SNAPSHOT, NOT A FORMULA (spec §2). Every field of the returned object is frozen
 *  onto the offer at arrival and never re-read from ECONOMY afterwards, which is what makes "terms
 *  never improve while you hold the letter" structural rather than a promise. */
export function kitTermsFor(standing: SponsorStanding): KitOfferTerms | null {
  const s = ECONOMY.sponsorship
  const tier = rungFor(standing)
  if (!tier) return null
  if (tier === 'local') {
    // The shop in her town, unchanged in every respect: the DOMESTIC gate, the already-balanced
    // figure, the two-step deal. What moved is only what it COVERS - her strings, and not the frame
    // and shoes it used to quietly supply as well.
    const top = standing.nationalRank <= s.topMaxRank
    return {
      tier,
      brand: s.localBrand,
      kitAllowanceCents: top ? s.topSeasonCents : s.seasonCents,
      freshCap: top ? s.topFreshCap : s.freshCap,
      minEventsPerSeason: top ? s.topMinEvents : s.minEvents,
      covers: TIER_COVERS.local,
      travelShare: 0,
      seasons: 1,
    }
  }
  const rung = tier === 'global' ? s.global : s.national
  return {
    tier,
    brand: rung.brand,
    kitAllowanceCents: rung.seasonCents,
    freshCap: rung.freshCap,
    minEventsPerSeason: rung.minEvents,
    covers: TIER_COVERS[tier],
    travelShare: tier === 'global' ? s.global.travelShare : 0,
    seasons: rung.seasons,
    // ⚠ NATIONAL ALONE CARRIES A DOMESTIC KEEP-CONDITION, and it is this rung's reason to exist
    // beyond the extra line of kit. See `KitOfferTerms.keepDomesticRank`.
    ...(tier === 'national' ? { keepDomesticRank: s.national.keepDomesticRank } : {}),
  }
}

/** How likely the brand is to write at all, given where she finished. Nobody is guaranteed a letter,
 *  which is what makes letting one expire cost something the game cannot promise to replace.
 *
 *  ⚠ THE UPPER RUNGS ROLL AT THE ORDINARY RATE, deliberately. Their scarcity is already carried by
 *  their GATE - the world's top 32 and its top 8 - and a second dice roll on top of a gate that hard
 *  would be making the same point twice, in a currency the player cannot see. Only the local shop
 *  steps its chance, because its gate is wide (the national top 30) and the step is what tells a
 *  top-10 girl apart from a #29 one. */
export function offerChanceFor(standing: SponsorStanding): number {
  const s = ECONOMY.sponsorship
  const tier = rungFor(standing)
  if (!tier) return 0
  if (tier !== 'local') return s.offerChance
  return standing.nationalRank <= s.topMaxRank ? s.topOfferChance : s.offerChance
}

/** The identity of a letter. The week is enough on its own - a brand writes at most once a season,
 *  and `isSponsorReviewWeek` guarantees there is exactly one candidate week per season - and it
 *  keeps the id stable across a replay, which a counter would not. */
export function kitOfferId(week: number): string {
  return `kit-${week}`
}

/**
 * ⚠ IS THIS THE WEEK THE BRANDS DECIDE? The FIRST off-season week of a season year, and no other.
 *
 * WHY THE OFF-SEASON AT ALL (owner, 01.08: «мне кажется было бы логичным их как раз к старту сезона
 * привязывать… Что в реальности происходит в этом плане?»). Because that is what happens: equipment
 * deals are negotiated in November and December and align to the calendar year, so the contract is
 * signed and effective when the season opens. The letter used to land on week 1 of the new season
 * and its four-week window ran straight through the first tournaments - a parent weighing a contract
 * in the worst week of the year to be weighing anything. The quiet weeks are when next year gets
 * arranged, on court and on paper; the off-season already bills a coach and draws its own training
 * block, and this is its third job.
 *
 * ⚠ AND THE ONCE-A-SEASON GUARANTEE HAS TO BE EXPLICIT NOW, WHICH IT DID NOT USED TO BE. The season
 * BOUNDARY is a single week, so `week % 52 === 0` guaranteed one review a year for free. The
 * off-season is three weeks (`OFF_SEASON_WEEKS`), so the same code run naively would raise a fresh
 * letter every week of it - three letters, three ids, three windows, a bug wearing the same clothes
 * as the feature. This predicate is the guarantee: `isOffSeasonWeek` is the calendar's own answer to
 * "is this a quiet week", and the second half makes it the FIRST of them. It is the same arithmetic
 * `maybeFireSeasonWrapUp` already fires on, which is the precedent for a once-a-year off-season step.
 */
export function isSponsorReviewWeek(week: number): boolean {
  return isOffSeasonWeek(week) && !isOffSeasonWeek(week - 1)
}

/**
 * RAISE THE LETTER. Called once per season boundary from the tick; returns the offer it added, or
 * null when nothing was written.
 *
 * ZERO main-stream draws - the only randomness is `shopWritesAt`'s single read of its own
 * sub-stream. Idempotent on the id, so a boundary replayed twice cannot post the same letter twice.
 */
export function raiseKitOffer(args: {
  offers: Offer[]
  seed: string
  week: number
  standing: SponsorStanding
}): Offer | null {
  const { offers, seed, week, standing } = args
  const id = kitOfferId(week)
  if (offers.some((o) => o.id === id)) return null
  // ⚠ ONE BRAND AT A TIME, and it is enforced HERE so that no caller can forget it (spec §4.1 as the
  // ladder extends it). A signed deal that is still running turns a competing letter away for as
  // long as it lasts, and an open letter she has not answered turns one away too - otherwise a
  // parent accumulates all three rungs and "which of my lines are covered" stops being a question.
  // That is the counterweight to the coverage and it is the price of caution: sign the two-season
  // national deal and the global letter next winter finds her busy.
  if (activeKitDeal(offers, week) || hasLiveOffer(offers, week)) return null
  const terms = kitTermsFor(standing)
  if (!terms) return null
  if (!shopWritesAt(seed, week, offerChanceFor(standing))) return null
  const offer: Offer = {
    id,
    kind: 'kit',
    week,
    deadlineWeek: week + ECONOMY.sponsorship.decideWeeks,
    terms,
    state: 'open',
  }
  offers.push(offer)
  return offer
}

/**
 * ⚠ THE WINDOW IS THE FEATURE, NOT A COURTESY (spec §2). An offer left past its deadline is GONE,
 * and it is gone whether or not the player ever opened it - which is the whole of what makes waiting
 * a real gamble rather than a free option.
 *
 * Returns the offers that just lapsed, so the caller can put a line in the feed. Pure state, ZERO
 * draws on any stream, and idempotent: a lapsed offer is no longer `open`, so a second pass finds
 * nothing.
 */
export function expireOffers(offers: Offer[], week: number): Offer[] {
  const gone: Offer[] = []
  for (const o of offers) {
    if (o.state !== 'open' || week <= o.deadlineWeek) continue
    o.state = 'expired'
    o.decidedWeek = week
    gone.push(o)
  }
  return gone
}

/** Why an answer was refused, or null when it is allowed. One reason string, because the UI shows it
 *  and the worker returns it as an error - two spellings of "too late" would be two bugs. */
export function offerAnswerError(offers: Offer[], offerId: string, week: number): string | null {
  const offer = offers.find((o) => o.id === offerId)
  if (!offer) return 'That letter is not in the inbox.'
  if (offer.state === 'signed') return 'That deal is already signed.'
  if (offer.state !== 'open') return 'That offer has already gone.'
  if (week > offer.deadlineWeek) return 'That offer has already gone.'
  return null
}

/**
 * SIGN IT. Irreversible by design - this is the one place in the game where the parent commits a
 * future he cannot see, and there is deliberately no unsign. The UI puts a `ConfirmDialog` in front
 * of it, the same gate every destructive action in More goes through.
 *
 * The deal runs FROM THE WEEK IT IS SIGNED to the end of the last season it was offered for. Waiting
 * therefore costs weeks of fresh kit and buys nothing - terms are fixed at arrival and never
 * improve, so the only thing a held letter can do is get shorter.
 */
export function signOffer(offers: Offer[], offerId: string, week: number): Offer | null {
  const err = offerAnswerError(offers, offerId, week)
  if (err) return null
  const offer = offers.find((o) => o.id === offerId)!
  offer.state = 'signed'
  offer.decidedWeek = week
  offer.untilWeek = dealUntilWeek(offer)
  offer.coveredCents = 0
  return offer
}

/** The first week of the season a letter raised at `week` is FOR - the one she is about to play.
 *  The letter arrives in the off-season, so that is always the next season block. */
export function coveredSeasonStart(week: number): number {
  return (Math.floor(week / WEEKS_PER_YEAR) + 1) * WEEKS_PER_YEAR
}

/** The last week of the LAST season a signed letter covers.
 *
 *  ⚠ IT IS ANCHORED ON THE SEASON, NOT ON THE SIGNATURE, and that is what keeps the deadline honest.
 *  If the term ran `seasons` years from the week he signed, a parent who sat on the letter until its
 *  last day would get MORE weeks of kit than one who signed at once - the deadline would pay him for
 *  waiting, which is the exact inversion spec §2 forbids ("terms never improve while you hold the
 *  letter"). Anchored on the season, holding it costs him the off-season weeks of fresh kit and buys
 *  nothing at all. */
export function dealUntilWeek(offer: Offer): number {
  const seasons = Math.max(1, (offer.terms as KitOfferTerms).seasons ?? 1)
  return coveredSeasonStart(offer.week) + seasons * WEEKS_PER_YEAR - 1
}

/** REFUSE IT. Terminal, like signing, and for the same reason: a "no" the player could take back
 *  would make the deadline a formality on the other side. */
export function refuseOffer(offers: Offer[], offerId: string, week: number): Offer | null {
  const err = offerAnswerError(offers, offerId, week)
  if (err) return null
  const offer = offers.find((o) => o.id === offerId)!
  offer.state = 'refused'
  offer.decidedWeek = week
  return offer
}

// =================================================================================================
// THE TOURNAMENT DESK (W2-LADDER §6, the informational half of the entry lifecycle)
// =================================================================================================
//
// Owner ruling 1, verbatim: «у нас уже система писем есть для этого, надо использовать. И после
// регистрации на турниры, где нельзя пропускать тоже можно письма присылать "вы зарегистрированы,
// надо явиться, отменить можно до... иначе по правилам турнира..." чтобы у игрока было четкое и
// прозрачное понимание системы.» So: register for a PROFESSIONAL event -> a letter through the
// EXISTING mail surface; cancel in time -> a short confirmation. NO fines, NO penalty points in
// this wave - the letter says the tour's rules exist, and the teeth arrive in act 3 (§6's regime),
// AFTER the habit and the transparency do. That order is the whole point.
//
// ⚠ ZERO RANDOMNESS, unlike the sponsor's `shopWritesAt`: the desk always writes, because the
// letter is a RECEIPT for an action she just took, not weather. No sub-stream is touched, so the
// arity discipline this file keeps (no Rng parameter anywhere) holds trivially here.
//
// ⚠ THE ID IS DERIVED FROM STATE, never a counter: `entry-<eventId>-<n>` where n counts the
// letters this event has already produced. Deterministic across replays (the same career writes
// the same inbox), and a cancel-and-re-enter produces distinct rows - the inbox is a record, and
// a record that overwrote itself would say the second registration never happened.

/** The registration letter, raised by `enterEvent` for W-rung entries. */
export function raiseEntryLetter(
  offers: Offer[],
  week: number,
  event: { id: string; tier: TierId; week: number; deadlineWeek: number },
  label: string,
): Offer {
  const n = offers.filter((o) => o.kind === 'entry' && o.id.startsWith(`entry-${event.id}-`)).length
  const offer: Offer = {
    id: `entry-${event.id}-${n}`,
    kind: 'entry',
    week,
    // Informational: the deadline field carries the event's own cancellation deadline so the
    // letter surface can quote one number the engine actually enforces (withdrawEvent's rule).
    deadlineWeek: event.deadlineWeek,
    terms: { tier: event.tier, label, eventWeek: event.week, freeUntilWeek: event.deadlineWeek },
    state: 'info',
  }
  offers.push(offer)
  return offer
}

/** The short confirmation for a free, in-time cancellation, raised by `withdrawEvent`. */
export function raiseEntryCancelLetter(
  offers: Offer[],
  week: number,
  event: { id: string; tier: TierId; week: number; deadlineWeek: number },
  label: string,
): Offer {
  const n = offers.filter((o) => o.kind === 'entry' && o.id.startsWith(`entry-${event.id}-`)).length
  const offer: Offer = {
    id: `entry-${event.id}-${n}`,
    kind: 'entry',
    week,
    deadlineWeek: event.deadlineWeek,
    terms: { tier: event.tier, label, eventWeek: event.week, freeUntilWeek: event.deadlineWeek, cancelled: true },
    state: 'info',
  }
  offers.push(offer)
  return offer
}

/** THE INBOX STAYS BOUNDED (the `Snapshot.offers` note promises "never pruned" about CONTRACTS,
 *  and it can only keep that promise if the receipts do not pile up for ever): a professional
 *  career writes ~15-30 desk letters a season, so unlike the sponsor's handful they must age out.
 *  A year is the window - long enough that "what did I do about that?" still has its answer, and
 *  the same 52 weeks every other rolling record in the game keeps. Sponsor letters are NEVER
 *  touched here: a signed deal outlives every prune, which is the whole reason the inbox exists. */
export function pruneEntryLetters(offers: Offer[], week: number): Offer[] {
  return offers.filter((o) => o.kind !== 'entry' || week - o.week <= WEEKS_PER_YEAR)
}

/** The deal that covered the season now finishing, if any - what the off-season review has to judge
 *  before it decides whether anybody writes again.
 *
 *  ⚠ IT IS SIMPLY THE ACTIVE DEAL NOW, and the reason is the move into the off-season. The review
 *  used to run on week 1 of the new year, by which time a one-season deal had already ended, so it
 *  had to go looking for a contract that had expired yesterday. It now runs in the quiet weeks
 *  BEFORE the year turns, while the deal is still live - which is both simpler and the honest
 *  reading: a brand sits down with the family before the contract runs out, not after. */
export function dealUnderReview(offers: Offer[], reviewWeek: number): Offer | null {
  return activeKitDeal(offers, reviewWeek)
}

/** The last week of the season that is finishing at `reviewWeek` - the week a deal's term has to
 *  reach to be "up", and the week a deal that fails its obligation is ended on. */
export function seasonLastWeek(week: number): number {
  return Math.floor(week / WEEKS_PER_YEAR) * WEEKS_PER_YEAR + WEEKS_PER_YEAR - 1
}

/** END IT HERE. A multi-season deal that failed its terms does not limp to its contractual finish -
 *  it stops with the season it failed, and the brand does not come back this winter.
 *
 *  Nothing is clawed back and nothing touches the balance: the kit she was given stays given, and
 *  `untilWeek` simply stops being in the future. Idempotent, because a deal already ending on that
 *  week is left exactly as it is. */
export function endDealWithSeason(offer: Offer, reviewWeek: number): void {
  offer.untilWeek = Math.min(offer.untilWeek ?? seasonLastWeek(reviewWeek), seasonLastWeek(reviewWeek))
}

/** THE BRAND SAYS GOODBYE IN WRITING (owner, 04.08). A deal ending is news, so it arrives as a new
 *  letter rather than as a changed status line on the one she signed a year ago — that line was
 *  already correct and already unread, which is exactly the failure this closes.
 *
 *  ⚠ IT IS A NOTICE, NOT AN OFFER: `state: 'info'`, so nothing about it can be signed, refused or
 *  expire, and `raiseKitOffer`'s one-brand-at-a-time rule cannot see it as a live letter. The terms
 *  are copied from the ended deal so the notice quotes its own numbers instead of re-deriving them
 *  from a world that has already moved on.
 *
 *  ⚠ AND IT IS RAISED FOR EVERY ENDING, including a term served in full — a contract that simply
 *  ran out is the moment a player most needs to know the bills are his again. `reason` is what the
 *  copy differs on; see KitEndReason. */
export function raiseKitEndLetter(
  offers: Offer[],
  week: number,
  ended: Offer,
  reason: KitEndReason,
  eventsPlayed: number | undefined,
): Offer {
  const terms = ended.terms as KitOfferTerms
  const notice: Offer = {
    id: `kit-end-${ended.id}`,
    kind: 'kit',
    week,
    // Informational letters never expire on their own; the inbox's own prune is what bounds them.
    deadlineWeek: week,
    terms: { ...terms, ended: reason, endedEventsPlayed: eventsPlayed },
    state: 'info',
  }
  offers.push(notice)
  return notice
}
