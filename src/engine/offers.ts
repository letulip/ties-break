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

import { ECONOMY } from './economy'
import { rngFromSeed } from './rng'
import { WEEKS_PER_YEAR } from './season/calendar'
import type { KitOfferTerms, Offer, SponsorTier } from '../shared/protocol'

/** Every sponsor tier's letterhead lives at `public/images/sponsors/<key>.webp`, and this is the
 *  lookup - a tier, never a filename spelled out at a call site. Only `local` is reachable today
 *  (see `SponsorTier`); the other two are on disk because the brand ladder is a later slice and its
 *  art shipped first. */
export const SPONSOR_TIERS: readonly SponsorTier[] = ['local', 'national', 'global'] as const

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
 * numbers for its whole life. (There is at most one, because the shop reviews once a season and a
 * career cannot hold two open kit letters; the `find` is written to be honest about that rather than
 * to permit it.)
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
export function kitFreshCap(offers: Offer[], week: number): number | null {
  const deal = activeKitDeal(offers, week)
  if (!deal) return null
  const terms = deal.terms as KitOfferTerms
  return terms.freshCap
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

/** What the shop's letter says, given where she finished the year. Pure, so the tests and the bench
 *  can ask directly - the same courtesy `localSponsorCents` extends. `nationalRank` is her place in
 *  the DOMESTIC table (`world.kidRankDomestic`), never the ITF one: a shop in her town reads the
 *  ladder she is on at home. Returns null when she is not on their radar at all. */
export function kitTermsFor(nationalRank: number): KitOfferTerms | null {
  const s = ECONOMY.sponsorship
  if (nationalRank > s.maxRank) return null
  const top = nationalRank <= s.topMaxRank
  return {
    tier: 'local',
    brand: s.localBrand,
    kitAllowanceCents: top ? s.topSeasonCents : s.seasonCents,
    freshCap: top ? s.topFreshCap : s.freshCap,
    minEventsPerSeason: top ? s.topMinEvents : s.minEvents,
  }
}

/** How likely the shop is to write at all, given where she finished. Better players get written to
 *  more often; nobody is guaranteed a letter, which is what makes letting one expire cost something
 *  the game cannot promise to replace. */
export function offerChanceFor(nationalRank: number): number {
  const s = ECONOMY.sponsorship
  if (nationalRank > s.maxRank) return 0
  return nationalRank <= s.topMaxRank ? s.topOfferChance : s.offerChance
}

/** The identity of a letter. The week is enough on its own - the shop writes at most once a season -
 *  and it keeps the id stable across a replay, which a counter would not. */
export function kitOfferId(week: number): string {
  return `kit-${week}`
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
  nationalRank: number
}): Offer | null {
  const { offers, seed, week, nationalRank } = args
  const id = kitOfferId(week)
  if (offers.some((o) => o.id === id)) return null
  const terms = kitTermsFor(nationalRank)
  if (!terms) return null
  if (!shopWritesAt(seed, week, offerChanceFor(nationalRank))) return null
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
 * The deal runs FROM THE WEEK IT IS SIGNED to the end of the season it was offered for. Waiting
 * therefore costs weeks of fresh kit and buys nothing - terms are fixed at arrival and never
 * improve, so the only thing a held letter can do is get shorter.
 */
export function signOffer(offers: Offer[], offerId: string, week: number): Offer | null {
  const err = offerAnswerError(offers, offerId, week)
  if (err) return null
  const offer = offers.find((o) => o.id === offerId)!
  offer.state = 'signed'
  offer.decidedWeek = week
  // The season it was written for, to its last week. `offer.week` is a season boundary, so this is
  // that whole season however late in the window the parent got round to answering.
  offer.untilWeek = offer.week + WEEKS_PER_YEAR - 1
  offer.coveredCents = 0
  return offer
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

/** The deal that covered the season just ended, if any - what the boundary review has to judge
 *  before it decides whether the shop writes again. */
export function dealForSeasonEnding(offers: Offer[], boundaryWeek: number): Offer | null {
  const lastWeek = boundaryWeek - 1
  return offers.find((o) => o.kind === 'kit' && o.state === 'signed' && (o.untilWeek ?? -1) === lastWeek) ?? null
}
