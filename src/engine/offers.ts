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
//   2. ONE BRAND AT A TIME. `raiseKitOffers` refuses to write while the season ahead is already promised, or a letter is
//      unanswered. Without it a career collects all three rungs and the ladder means nothing.
//   3. THE LETTER ARRIVES IN THE OFF-SEASON. `isSponsorReviewWeek` - the first quiet week and no
//      other - so the contract is signed before the year she plays it opens.
//   4. A TERM CAN OUTLAST A SEASON. `dealUntilWeek` anchors it on the season she is about to play,
//      never on the week he signed, so waiting can never buy extra weeks of cover.

//
// --- WHAT THE THIRD SLICE ADDED (05.08, feat/sponsor-window) ------------------------------------
//
// THE WINDOW, AND IT IS THE OWNER'S OWN DESIGN, WRITTEN AFTER HE PLAYED HIS OWN SAVE. Decoded, it
// holds a local letter raised at week 257 that EXPIRED unsigned at 262 - the second week of a season
// - and the next letter at 309. Forty-seven weeks with no kit deal, because letters were raised on
// ONE week a year and the one he missed was the only one there was. His fix, verbatim: «мне кажется
// нужно делать окно на все 5 недель (межсезонье +2) а заканчивать контракты вместе с сезоном на 49
// неделе (если они однолетние), т.е. чтобы с 50 точно уже было пусто… и как раз в окно могут
// приходить письма и есть время на принятие решения и выбор (если он будет конечно)». And the goal
// that governs it: «если девочка хорошо играет, то наверняка ее замечают и у нее есть спонсоры в том
// или ином виде на протяжении всей карьеры».
//
// Four rules, each enforced in exactly one place in this file:
//
//   5. THE WINDOW IS FIVE WEEKS, NOT ONE. `isSponsorWindowWeek` - the off-season plus the two weeks
//      before it. A rung's turn comes on one of the first four (`isSponsorLetterWeek`), so a choice
//      can accumulate; the fifth is the parent's alone and no brand's turn falls on it.
//   6. THE RUNGS SHE CLEARS WRITE, STRONGEST OF THEM FIRST, FROM WHEREVER SHE IS. `windowLadder`
//      names them and `raiseKitOffers` walks that list from the top on every week of the window: the
//      biggest name that would have her writes first, exactly as `rungFor` always said, and the rungs
//      below it follow as ALTERNATIVES rather than as replacements. So by the middle of the window a
//      girl who clears three rungs holds three letters and may take any of them, and signing the
//      first one she is sent is never a mistake. NOTHING is manufactured - every letter is from a
//      rung her standing genuinely clears, and a career that clears one rung gets one letter.
//      ⚠ "FROM WHEREVER SHE IS" IS THE 06.08 FIX (fix/sponsor-catchup). The rung used to be chosen by
//      the week's own position in the window, so a career that reached the window a week late was
//      silently offered the second-best brand and never told the best one existed - which is the
//      exact trap the strongest-first order exists to prevent. See `raiseKitOffers`.
//   7. A CONTRACT ENDS WITH THE SEASON, ON WEEK 49. `contractEndWeek`, and `dealUntilWeek` is built
//      on it, so by week 50 the slot is empty and the letters already in the inbox are for a season
//      nobody has a claim on.
//   8. ...WHICH MEANS THE OUTGOING DEAL NO LONGER BLOCKS THE POST. "One brand at a time" is now
//      `seasonSpokenFor` - is the season AHEAD promised to somebody - rather than "is anything
//      running", so a deal in its last weeks cannot shut the window it is supposed to open. A signed
//      letter takes over the week the old contract stops (`dealStartsAt`), so the two never overlap
//      and there is no gap between them either.

import { ECONOMY } from './economy'
import { rngFromSeed } from './rng'
import { isOffSeasonWeek, OFF_SEASON_WEEKS, WEEKS_PER_YEAR } from './season/calendar'
// The ONE definition of "which season is this week in" – the same one the Money screen's "This
// season" window and the end-of-season wrap-up read, so the inbox cannot mean a different span by
// it. `world/ledger.ts` type-imports `WorldState` and runtime-imports only the calendar, so this
// is not a cycle.
import { seasonIndexOf } from './world/ledger'
import type { KitFreshCap } from './equipment'
import type { TierId } from './season/types'
import type {
  AcademyLetterTerms, AdCategory, AdOfferTerms, AdTier, CallUpLetterTerms, EntryLetterTerms, EntryReleaseReason, KitEndReason,
  KitLine, KitOfferTerms, Offer, PenaltyReason, SponsorTier, TourLetterTerms,
} from '../shared/protocol'

/** Every sponsor tier's letterhead lives at `public/images/sponsors/<key>.webp`, and this is the
 *  lookup - a tier, never a filename spelled out at a call site. All three rungs are reachable since
 *  01.08 (feat/brand-ladder); the art shipped first and the coverage ladder is written on it. */
export const SPONSOR_TIERS: readonly SponsorTier[] = [
  // ⚠ WEAKEST-FIRST, AND SINCE W3-ACT2 THAT ORDERING IS LOAD-BEARING RATHER THAN TIDY. `rungFor`
  // reverses this list and takes the FIRST rung she clears, so the order IS the ladder: a rung
  // listed above a stricter one would be handed to a player who had cleared both, and the stricter
  // brand would become unreachable. `tour` therefore sits between `national` and `global` - its
  // gate (WTA 200) is looser than global's (87) and tighter than national's (350) - which is the
  // monotone chain `SponsorTier` explains, and it is what answers section 7's own open question
  // about where the professional rungs slot in. Caught by tests/offers.test.ts, which asks the
  // ladder for a rung at six ranks rather than trusting the array to be in a sensible order.
  'local', 'national', 'tour', 'global', 'premium', 'icon',
  // Letterheads: ALL SIX RUNGS SHIP THEIR OWN MARK since 05.08 - the tier id IS the filename, and
  // `public/images/sponsors/<tier>.webp` is the whole of the lookup.
  //
  // ⚠ `sponsorArtKey` USED TO LIVE HERE AND IS GONE, WHICH IS THE POINT. From W3-ACT2 until now
  // three marks existed for six rungs, so a one-line function redirected `tour` / `premium` / `icon`
  // onto `global.webp` and three `absent` rows in docs/art-placeholders.md registered the debt. Its
  // own note recorded the exit condition - «three real marks are an art ask whenever the owner wants
  // them; they would replace this function with the identity rather than touching anything else» -
  // and the owner has now drawn them (Baseline Athletic, Meridian Sport, Aurelia). An identity
  // function is not a smaller redirect, it is a redirect nobody can tell is dead, so it was DELETED
  // rather than emptied: the registry's own instruction for an `absent` row is that "the code branch
  // that does the borrowing goes too".
  //
  // What replaced its guard is stronger than what it guarded. `tests/art-placeholders.test.ts` used
  // to check that the redirect's rung-set equalled the registry's; it now checks that EVERY rung in
  // this array has a letterhead on disk - which catches a seventh rung added with no art (the case
  // the old arm existed for) and also catches a mark being deleted, which the old arm could not see.
] as const

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
  // ...AND THE LADDER STOPS BEING ABOUT COVERAGE AT THE TOP, WHICH IS THE HONEST READING (W3-ACT2
  // section 7). There is no fourth line of kit to promise, so the three professional rungs all
  // cover everything and what steps up instead is MONEY - a quarterly retainer, appearance fees and
  // result bonuses. `SponsorTier`'s original argument (the rung is coverage, not prestige, because
  // coverage is legible off a screen the player already has) held for exactly as long as there were
  // lines left to add; above that a bigger deal has to pay her.
  tour: ['strings', 'frame', 'shoes'],
  premium: ['strings', 'frame', 'shoes'],
  icon: ['strings', 'frame', 'shoes'],
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
 * run for two and three seasons, so `raiseKitOffers` refuses to write a competing letter for a season
 * that is already promised (`seasonSpokenFor`). The `find` is still written to be honest about the
 * invariant rather than to permit a second deal.
 *
 * ⚠ AND THE START OF COVER IS `fromWeek` NOW, NOT THE SIGNATURE (v41, feat/sponsor-window). The two
 * were the same thing while a contract ran to the end of the calendar year and the next letter could
 * not arrive until the year had turned. They are not the same inside a five-week window: the
 * outgoing deal runs to week 49 and the letters start at 47, so a deal signed on the first day of the
 * window would otherwise be live in the same week as the one it replaces - two active deals, which
 * the paragraph above says cannot happen. `dealStartsAt` is where the number comes from; it is the
 * week the OLD contract stops, so the pair meet exactly and leave no gap.
 */
export function activeKitDeal(offers: Offer[], week: number): Offer | null {
  return (
    offers.find(
      (o) =>
        o.kind === 'kit' &&
        o.state === 'signed' &&
        week <= (o.untilWeek ?? -1) &&
        week >= (o.fromWeek ?? o.decidedWeek ?? 0),
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
 *  THE PROFESSIONAL NUMBERS WERE BUILT THE SAME WAY THE JUNIOR PAIR IS, off one figure in the tier
 *  table rather than picked: National signs the girl who would be IN the prestige draw (junior:
 *  the J300 main draw, 32; professional: accepted into a W100, `enterPct` 0.25 of the ~500-row
 *  merged table = 125), and Global signs the one who would still be in it on the last day (the
 *  same quarter: 8 of 32, 31 of 125). See `ECONOMY.sponsorship.*.maxWtaRank`.
 *
 *  ⚠⚠ AND THE PROFESSIONAL HALF OF THAT DERIVATION IS RETIRED (16.08). It was a live READ of
 *  `TIERS.w100.acceptsRank`, so P3's acceptance-cut work moved both sponsor gates as a side effect
 *  nobody decided - the same "one constant, two unrelated jobs" defect P4 fixed for the college door.
 *  The two rungs carry their own constants now (national 350, global 87) and `tests/offers.test.ts`
 *  guards that a moving acceptance cut does not drag them. ⚠ THE JUNIOR PAIR KEEPS ITS DERIVATION and
 *  that is deliberate: `TIERS.j300.drawSize` is a DRAW SIZE - a structural fact about the event - not
 *  a tuning cut somebody retunes on a Tuesday, so reading it is a definition rather than a coupling.
 *
 *  A professional also always clears the LOCAL shop: the whole rung is "a shop that has heard of
 *  her", and a girl on the world tour has cleared that bar by definition.
 *
 *  ⚠ AND SINCE 09.08 A RANKED JUNIOR DOES TOO, WHICH IS THE FLOOR THIS PREDICATE WAS MISSING. The
 *  local arm read the domestic table and the professional escape hatch and NOTHING ELSE, so a girl
 *  who had gone abroad - decaying the only points the shop would look at - was refused by the one
 *  rung that exists to catch a career the bigger brands passed on. The owner's own save is the case:
 *  ITF #4, national #67, cleared `global` and `national`, and `local` said no. See
 *  `ECONOMY.sponsorship.localMaxItfRank` for the whole argument and for where 128 comes from; the
 *  short version is that this is the 30.07 error with the two tables swapped, and the rule that
 *  fixes it is the one the two rungs above already keep: read whichever table she is actually on. */
export function standingClears(standing: SponsorStanding, tier: SponsorTier): boolean {
  const s = ECONOMY.sponsorship
  // W3-ACT2 section 7: the three professional rungs read the W table AND NOTHING ELSE, which is the
  // difference between them and the pair below. `national` and `global` were built for a junior and
  // LEARNED to read a professional (the 02.08 ruling), so they clear on either table; these three
  // were never about a junior at all, and a brand that signs on a WTA ranking is not interested in a
  // girl who has not got one. The `wtaRanked` guard is the same one the pair below keeps, for the
  // same reason: everybody without a counting W result ties at the floor of that table, so a
  // position there is not a standing until she has earned one.
  if (tier === 'icon' || tier === 'premium' || tier === 'tour') {
    const rung = tier === 'icon' ? s.icon : tier === 'premium' ? s.premium : s.tour
    return standing.wtaRanked && standing.wtaRank <= rung.maxWtaRank
  }
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
  // THE FLOOR, AND IT READS ALL THREE TABLES: her place at home, her place in the junior world, or
  // any professional standing at all. The order is the order a shop would ask them in.
  return (
    standing.nationalRank <= s.maxRank ||
    (standing.itfRanked && standing.itfRank <= s.localMaxItfRank) ||
    standing.wtaRanked
  )
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
 *  never improve while you hold the letter" structural rather than a promise.
 *
 *  ⚠ `tier` IS AN ARGUMENT SINCE THE WINDOW (05.08) AND DEFAULTS TO THE BEST RUNG SHE CLEARS, so
 *  every existing caller reads exactly as it did. It has to be an argument because the window raises
 *  a letter per rung rather than one letter from the best - see `windowLadder` - and the terms of a
 *  local deal offered to a girl who also clears National are the LOCAL terms. Passing a rung she does
 *  not clear is not defended against here; `raiseKitOffers` only ever passes one off her own ladder. */
export function kitTermsFor(standing: SponsorStanding, tier = rungFor(standing)): KitOfferTerms | null {
  const s = ECONOMY.sponsorship
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
  // W3-ACT2: the professional rungs carry three fields the junior pair does not, and they are
  // written onto the offer at arrival like every other term - a deal signed under one set of numbers
  // is honoured under those numbers for its whole life (`kitTermsFor`'s own standing rule).
  if (tier === 'tour' || tier === 'premium' || tier === 'icon') {
    const pro = tier === 'icon' ? s.icon : tier === 'premium' ? s.premium : s.tour
    return {
      tier,
      brand: pro.brand,
      kitAllowanceCents: pro.seasonCents,
      freshCap: pro.freshCap,
      minEventsPerSeason: pro.minEvents,
      covers: TIER_COVERS[tier],
      travelShare: pro.travelShare,
      seasons: pro.seasons,
      retainerCents: pro.retainerCents,
      bonusShare: pro.bonusShare,
      bonusFromTier: pro.bonusFromTier,
      ...('appearanceFeeCents' in pro
        ? { appearanceFeeCents: pro.appearanceFeeCents, appearanceFromTier: pro.appearanceFromTier }
        : {}),
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
    // ⭐⭐ ROUND 29 PART TWO #5 – GLOBAL CARRIES CASH NOW (the owner: «мировые топы должны иметь все
    // возможности достучаться до топовой спортсменки»). It is sorted ABOVE `tour` and paid less than
    // it – no retainer, no result bonus – which is the one thing `windowLadder`'s strongest-first
    // order promises cannot happen. The three fields are the ones `KitOfferTerms` already carries
    // for the professional rungs, optional there since W3-ACT2, so nothing about the shape moves.
    //
    // ⚠ FROZEN AT ARRIVAL LIKE EVERY OTHER TERM, WHICH MAKES THIS FORWARD-ONLY AND HAS TO BE SAID:
    // a Play Beyond letter already sitting in an inbox was written from the old catalogue and keeps
    // the old terms for its whole life. That is `kitTermsFor`'s own standing rule («terms never
    // improve while you hold the letter») working in the direction nobody enjoys, and repairing it
    // in place would mean a signed contract whose numbers change under the parent – which is the
    // property the rule exists to prevent. The NEXT letter from this rung carries the retainer.
    ...(tier === 'global'
      ? {
          retainerCents: s.global.retainerCents,
          bonusShare: s.global.bonusShare,
          bonusFromTier: s.global.bonusFromTier,
        }
      : {}),
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
export function offerChanceFor(standing: SponsorStanding, tier = rungFor(standing)): number {
  const s = ECONOMY.sponsorship
  if (!tier) return 0
  if (tier !== 'local') return s.offerChance
  return standing.nationalRank <= s.topMaxRank ? s.topOfferChance : s.offerChance
}

/** WHICH RUNGS WRITE THIS WINTER, in the order they land - the window's whole content, as a list.
 *
 *  ⚠ STRONGEST FIRST, WHICH IS `rungFor`'s OWN RULE EXTENDED RATHER THAN REPLACED. `rungFor` says
 *  "the best rung she clears, and only that one, because an ambitious parent is being written to by
 *  the biggest name that would have him". The window keeps the first half exactly - the best brand
 *  writes on the opening week - and relaxes the second, because the owner asked for «выбор (если он
 *  будет конечно)» and one letter is not a choice. So the rungs below it write on the following
 *  weeks, as ALTERNATIVES to a letter he already has rather than as a replacement for it.
 *
 *  ⚠ AND THE ORDER IS THE WHOLE SAFETY PROPERTY, WHICH IS WHY IT IS NOT THE OTHER WAY ROUND. Sorted
 *  weakest-first the local shop would write in week 47 and the global brand in week 49, so a parent
 *  who signed the first letter he was ever sent would have thrown away the better one without ever
 *  seeing it - a trap dressed as a gamble, and the exact opposite of «есть время на принятие решения
 *  и выбор». Strongest-first makes signing on sight always safe and waiting always optional, and the
 *  choice is real anyway: by the third week of the window a girl who clears three rungs is holding
 *  three letters at once and may take any of them.
 *
 *  ⚠ CUT FROM THE TOP, so the best brand can never be crowded off the calendar - a top-10
 *  professional hears from the four biggest names that would have her and not from a shop in her
 *  town, which has four rungs' worth of nothing to offer her.
 *
 *  ⚠ AND THE FLOOR IS STILL THE FLOOR. When the top rung's dice come up empty the next one down
 *  writes the following week off its own roll - so the ladder's lower rungs are what catch a career
 *  the big brands passed on, which is the mechanism behind the owner's stated goal («у нее есть
 *  спонсоры в том или ином виде на протяжении всей карьеры») rather than a guarantee bolted on top
 *  of it.
 *
 *  ⚠ AND NOTHING IS MANUFACTURED. Every entry is a rung `standingClears` says would have her, so a
 *  career that clears one rung gets one letter and a career that clears none gets none. The dice are
 *  still rolled per letter (`shopWritesAt`, on that letter's own week), so a full list is an
 *  opportunity and never a delivery. */
export function windowLadder(standing: SponsorStanding): SponsorTier[] {
  return SPONSOR_TIERS_STRONGEST_FIRST.filter((t) => standingClears(standing, t)).slice(
    0,
    SPONSOR_LETTER_WEEKS,
  )
}

/** IS THE SEASON AHEAD ALREADY PROMISED TO SOMEBODY - "one brand at a time", as the window forced it
 *  to be restated.
 *
 *  ⚠ IT REPLACES "IS ANYTHING RUNNING", WHICH IS THE WHOLE UNLOCK. The old rule turned a letter away
 *  while any deal was live and while any letter was unanswered; under a five-week window that is
 *  exactly backwards on both counts. The outgoing contract is live for the window's first three
 *  weeks by construction (it ends at `contractEndWeek`), so it would have shut the post against its
 *  own replacement; and an unanswered letter blocking the next one would make the accumulating choice
 *  the owner asked for impossible. The invariant that actually matters is narrower and survives both:
 *  the season she is about to play may be promised to ONE brand. A multi-season deal still turns the
 *  next rung away for as long as it has a year left to run, which is what gives it its bite. */
export function seasonSpokenFor(offers: Offer[], week: number): Offer | null {
  const seasonAhead = coveredSeasonStart(week)
  return (
    offers.find((o) => o.kind === 'kit' && o.state === 'signed' && (o.untilWeek ?? -1) >= seasonAhead) ?? null
  )
}

/** THE RUNG'S PLACE ON THE LADDER as a number, so "is this one stronger" is a comparison rather than
 *  a table. `SPONSOR_TIERS` is weakest-first, so a bigger index is a bigger brand – the same reading
 *  `windowLadder`, `rungFor` and `tools/sponsor-ladder-reach.ts` all take of the same array. */
export function rungStrength(tier: SponsorTier): number {
  return SPONSOR_TIERS.indexOf(tier)
}

/** ⭐⭐ ROUND 29 PART TWO #12 – IS THE POST SHUT AGAINST **THIS RUNG**? The narrowing of
 *  `seasonSpokenFor`, and the whole of the item.
 *
 *  THE OWNER: «открытое сейчас в вашем ящике продление Baseline закроет и следующую зимнюю почту…
 *  вот с этим надо что-то делать, там без спонсора грустновато немного живется.» He is describing a
 *  two-season renewal, and he is right about what it does: `seasonSpokenFor` turned away EVERY rung
 *  for as long as any deal covered the season ahead, so signing the letter he was holding bought a
 *  winter of silence.
 *
 *  ⚠ IT IS NOT ROUND 28 #17 BEING UNDONE. That fix stops ONE BRAND writing twice in a winter
 *  (`alreadyWritten` seeded from `dealEndingWithSeason`) and is untouched here – this is the OTHER
 *  rule, the one that turns away every OTHER brand, and only its top edge moves.
 *
 *  ⭐ WHAT IT COSTS, MEASURED BEFORE IT WAS CHANGED (108 careers x 780 weeks, `bench:sponsorreach`):
 *  1,274 winters, **416 of them produced no kit letter at all**, and **360 of those 416 were shut by
 *  this rule alone** – no letter was raised in a single one of them. In **191** the ladder had a
 *  STRICTLY STRONGER rung standing behind the closed door, the commonest being **`global` in front
 *  of `premium` (84)**, which is the owner's own save to the brand.
 *
 *  THE RULE NOW: a running deal turns away every rung AT OR BELOW ITS OWN, and a strictly stronger
 *  one may write. Three things that does NOT change, each of them load-bearing:
 *   - ONE BRAND AT A TIME survives literally: two deals are never live at once, because signing the
 *     stronger letter ENDS the running one with the season it is in (`signOffer`, reason `stepped`).
 *   - THE TERM STILL BITES. A `premium` deal cannot be interrupted by `tour`, `global` or `national`
 *     – only 2 of the 6 rungs can ever write over `premium`, and none at all over `icon` – so a long
 *     contract is still a decision with a cost, which is what `KitOfferTerms.seasons` is for.
 *   - NOTHING IS MANUFACTURED. The stronger rung still has to be one `standingClears` says would
 *     have her, and still has to roll its own dice on its own slot.
 *
 *  ⚠ AND IT IS WHY THE LADDER HAD TO BE MADE MONOTONE FIRST (item #5, `global`'s cash). "A stronger
 *  rung may interrupt a weaker one" is only safe when a stronger rung is actually worth more –
 *  otherwise this rule would let a WORSE deal replace a better one, which is the same defect wearing
 *  the opposite sign. `tests/round29p2-ladder-monotone.test.ts` is the guard under both. */
export function rungTurnedAway(offers: Offer[], week: number, tier: SponsorTier): Offer | null {
  const running = seasonSpokenFor(offers, week)
  if (!running) return null
  const runningTier = (running.terms as KitOfferTerms).tier
  // A signed deal whose terms carry no tier cannot be compared, so it keeps the old, total bite -
  // the safe direction, and unreachable in practice (every `kitTermsFor` result carries one).
  if (!runningTier) return running
  return rungStrength(tier) > rungStrength(runningTier) ? null : running
}

/** THE WEEK A LETTER SIGNED NOW WOULD START COVERING HER: today, unless a contract she is already
 *  under runs past today, in which case the week after that one stops. See `activeKitDeal`. */
export function dealStartsAt(offers: Offer[], week: number): number {
  let start = week
  for (const o of offers) {
    if (o.kind !== 'kit' || o.state !== 'signed') continue
    const until = o.untilWeek ?? -1
    if (until >= start) start = until + 1
  }
  return start
}

/** The contract that is finishing WITH this season, if there is one - the deal the window's feed row
 *  reports on. It is identified by its end week rather than by being live, because by the time the
 *  row is written (the window's last week) it has already stopped. A newly signed letter cannot be
 *  mistaken for it: its term reaches into the season ahead by construction. */
export function dealEndingWithSeason(offers: Offer[], week: number): Offer | null {
  const end = contractEndWeek(week)
  return offers.find((o) => o.kind === 'kit' && o.state === 'signed' && o.untilWeek === end) ?? null
}

/** WAS A BRAND LET DOWN THIS WINDOW - a deal ended for a reason other than its term running out.
 *
 *  Read off the goodbye letter the review already posts (`raiseKitEndLetter` writes the reason onto
 *  the paper), so the verdict reached on the window's opening week is still legible on its third
 *  without a second field to persist or keep in step. */
export function letDownThisWindow(offers: Offer[], week: number): boolean {
  const opened = sponsorWindowOpensAt(week)
  return offers.some((o) => {
    if (o.kind !== 'kit' || o.state !== 'info' || o.week < opened) return false
    const ended = (o.terms as KitOfferTerms).ended
    return ended === 'events' || ended === 'standing'
  })
}

/** The identity of a letter, and it is the identity of its PLACE IN THE QUEUE rather than of the
 *  week it happened to land on (06.08, fix/sponsor-catchup). `kitOfferId(sponsorWindowOpensAt(w) + slot)`
 *  is what `raiseKitOffers` passes: one id per rung per window, stable across a replay and stable
 *  across the week a career actually reaches the window on, which a counter would not be and which
 *  the arrival week no longer is. For a career that is present from the window's opening week the
 *  two are the same number, so nothing about a normally-played career's ids moved. */
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

// =================================================================================================
// THE WINDOW (05.08, feat/sponsor-window) - five weeks, and the letters arrive across them
// =================================================================================================
//
// ⚠ THE PREDICATE ABOVE IS STILL THE ANCHOR AND IS STILL THE OFF-SEASON'S FIRST WEEK; what changed
// is that the brands no longer live on it alone. It survives untouched because a SECOND caller
// depends on its exact week - `settleMandatoryQuota` settles the tour's annual obligation there
// (world.ts) - and moving the sponsors was never a reason to move the tour. The window below is
// anchored on the same season arithmetic and OPENS two weeks earlier, which is the owner's own
// «межсезонье +2».

/** HOW LONG THE BRANDS' WINDOW IS OPEN: the off-season, plus the two weeks before it. Written as the
 *  owner's own sentence rather than as the number 5, so that a change to `OFF_SEASON_WEEKS` moves
 *  the window with it instead of silently leaving it behind. */
export const SPONSOR_WINDOW_WEEKS = OFF_SEASON_WEEKS + 2

/** ...OF WHICH THE LAST ONE IS NOT A RUNG'S. Four weeks in which a brand from the ladder may write,
 *  and a fifth that belongs to the incumbent's renewal.
 *
 *  ⚠⚠ ITS REASON CHANGED ON 28.08 (round 28 #17-b) AND THE NUMBER DID NOT, which is exactly the
 *  shape of thing that rots if nobody writes it down. From 05.08 this constant was the guarantee
 *  that replaced "four weeks each": since every letter died with the window, reserving the closing
 *  week was the only thing standing between a late letter and a two-week decision. **The owner's
 *  ruling retired that job** - every letter now carries its own `ECONOMY.sponsorship.decideWeeks`
 *  from arrival (`kitOfferDeadline`), so no letter can be short-changed by landing late and the
 *  closing week needs no protecting.
 *
 *  What keeps it at `SPONSOR_WINDOW_WEEKS - 1` is the OTHER job, which was always the load-bearing
 *  one: `raiseKitRenewal` lands on the closing week and must land after every rung has had its turn,
 *  because the incumbent is the letter a parent is likeliest to sign on sight and a signature turns
 *  every other rung away (`seasonSpokenFor`). So the queue is bounded at four so that no FIFTH rung
 *  is ever given the week the relationship writes in. Delete this and the ladder loses its order,
 *  not its thinking time. */
export const SPONSOR_LETTER_WEEKS = SPONSOR_WINDOW_WEEKS - 1

/**
 * ⭐⭐ THE LAST WEEK A KIT LETTER RAISED ON `week` CAN STILL BE ANSWERED – the owner's ruling of
 * 28.08 (round 28 #17-b) in one expression, and the ONE place the rule lives so the ladder's letters
 * and the incumbent's renewal cannot drift apart.
 *
 *     «в чем проблема сделать 5? у нас конечная неделя сезона 49 по сути, дальше окно в новый сезон,
 *      даже если приглашение придет на 1й или 2й неделе я не вижу проблем сделать слот в 5 недель»
 *
 * INCLUSIVE, like every other decide-window in this file: five weeks means the arrival week and the
 * four after it, which is the arithmetic `OfferLetter` and `InboxSheet` already print
 * (`deadlineWeek - week + 1`). The same shape `raiseAdOffer`'s caller uses, deliberately - two kinds
 * of post, one rule.
 *
 * ⚠ IT REPLACES `sponsorWindowClosesAt`, WHICH IS THE PROPERTY THE OWNER TRADED AWAY. Between 05.08
 * and 28.08 the deadline belonged to the WINDOW, so the first letter of a winter carried five weeks
 * and the last carried two, and no decision was ever open in a week she was playing. A letter raised
 * on the closing week now runs four weeks past it - into the new season - and he was shown that in
 * those words and overruled it. See `ECONOMY.sponsorship.decideWeeks` for why he is right (the
 * advertising letter had already broken the property that trade was buying).
 *
 * ⚠ TWO WINDOWS CAN NEVER OVERLAP, AND IT IS ARITHMETIC RATHER THAN LUCK. The latest a letter can be
 * raised is the window's closing week, at season offset `WEEKS_PER_YEAR - 1`; it then dies at offset
 * `WEEKS_PER_YEAR - 1 + decideWeeks - 1`, i.e. offset 3 of the next season. The next window does not
 * open until offset 47 of that season - forty-four weeks later. So no letter can ever still be live
 * when the next winter's post begins, and none can outlive the deal it was competing for. Pinned in
 * tests/offers.test.ts rather than left as a comment, because it is the property that makes
 * `seasonSpokenFor` and the window's own idempotence safe.
 */
export function kitOfferDeadline(week: number): number {
  return week + ECONOMY.sponsorship.decideWeeks - 1
}

/** The absolute week the window opens in the season year that contains `week`. */
export function sponsorWindowOpensAt(week: number): number {
  return Math.floor(week / WEEKS_PER_YEAR) * WEEKS_PER_YEAR + (WEEKS_PER_YEAR - SPONSOR_WINDOW_WEEKS)
}

/** ...and the week it closes, which is always the last week of the season year - the window is a
 *  TAIL, so "inside it" is simply "at or past the open". */
export function sponsorWindowClosesAt(week: number): number {
  return sponsorWindowOpensAt(week) + SPONSOR_WINDOW_WEEKS - 1
}

/** Is the post open at all this week? */
export function isSponsorWindowWeek(week: number): boolean {
  return week >= sponsorWindowOpensAt(week)
}

/** THE ONE WEEK THE OUTGOING DEAL IS JUDGED, and the window's first. Its own season is complete
 *  enough to judge - see `eventsPlayedInSeason`, which counts a rolling year rather than a calendar
 *  season for exactly this reason. */
export function isSponsorWindowOpenWeek(week: number): boolean {
  return week === sponsorWindowOpensAt(week)
}

/** ...and the last, on which the one feed row of the year is written. */
export function isSponsorWindowCloseWeek(week: number): boolean {
  return week === sponsorWindowClosesAt(week)
}

/** Does a rung's TURN fall on this week? The first `SPONSOR_LETTER_WEEKS` of the window.
 *
 *  ⚠ IT IS "WHOSE TURN IT IS", NOT "MAY A LETTER LAND TODAY" (06.08). Those were the same question
 *  while the rung was chosen by the week; they are not once the queue is walked from wherever the
 *  career actually is. A rung whose turn fell on week 47 lands on week 50 for a career that only
 *  reached the window on week 50, and lands on the CLOSING week for one that only reached it there -
 *  see `raiseKitOffers`, which is why it no longer gates on this predicate. What the predicate still
 *  says, and says exactly, is that no FIFTH rung ever gets a turn: the last week of the window
 *  belongs to the parent, and `SPONSOR_LETTER_WEEKS` is what bounds the queue. */
export function isSponsorLetterWeek(week: number): boolean {
  return isSponsorWindowWeek(week) && week - sponsorWindowOpensAt(week) < SPONSOR_LETTER_WEEKS
}

/** Which slot of the window this week is - 0 for the opening week. The slot IS the rung's place in
 *  the queue, which is what makes "the strongest rung first, one a week" a lookup rather than a loop
 *  with state to persist - and, since 06.08, what lets a career that arrives on slot 3 be handed
 *  slots 0 through 3 in one post without a record of what it missed. */
export function sponsorWindowSlot(week: number): number {
  return week - sponsorWindowOpensAt(week)
}

/** ⚠ THE WEEK A CONTRACT ENDS, AND IT ENDS WITH THE SEASON (owner: «заканчивать контракты вместе с
 *  сезоном на 49 неделе… чтобы с 50 точно уже было пусто»). The last competitive week of a season
 *  year is 48 and the off-season opens at 49; a deal is honoured through that first quiet week and
 *  not past it, so the two weeks the window still has to run belong to nobody.
 *
 *  It is deliberately NOT `seasonLastWeek` (offset 51, the calendar year's own end), which is what
 *  the term used to run to. That extra fortnight was invisible - it carries no tournament and no
 *  ranking - and it was the whole reason a running contract could shut the window against the letter
 *  meant to replace it. */
export function contractEndWeek(week: number): number {
  return Math.floor(week / WEEKS_PER_YEAR) * WEEKS_PER_YEAR + (WEEKS_PER_YEAR - OFF_SEASON_WEEKS)
}

/**
 * RAISE THE WINTER'S POST. Called on every week of the window from the tick; returns the letters it
 * added - none or one on an ordinary week, and the whole queue that has come due on the week a
 * career first reaches the window.
 *
 * ⚠ THE QUEUE IS WALKED FROM WHERE SHE ACTUALLY IS, NOT FROM THE CALENDAR (06.08,
 * fix/sponsor-catchup). It used to be `windowLadder(standing)[sponsorWindowSlot(week)]` - the rung
 * was chosen by WHICH WEEK OF THE WINDOW IT WAS - and the owner hit what that costs on the first
 * career he loaded after the wave merged. His save sits at season week 48, one week past the
 * window's opening week, so slot 0 had already gone by when the code changed under him: the national
 * brand's letter was never raised at all and the local shop's arrived in its place. Same standing,
 * one week apart, silently offered the worse brand and never told the stronger one existed.
 *
 * That is the exact inversion `windowLadder` exists to prevent - «signing on sight is never a
 * mistake; waiting is optional» is only true if THE STRONGEST RUNG SHE CLEARS IS THE ONE THAT WRITES
 * FIRST FROM WHEREVER SHE IS. So the walk starts at the top of the ladder every week, and each rung
 * writes on the first week of the window she is present for at or after its own turn. A career that
 * reaches the window late finds the letters it had already earned waiting for it, in ladder order,
 * in one post.
 *
 * ⚠ AND THE DICE ARE KEYED ON THE RUNG'S PLACE IN THE QUEUE, NOT ON THE DAY IT LANDS. `shopWritesAt`
 * is read at `sponsorWindowOpensAt(week) + slot`, so a rung's one roll is the same roll however late
 * the career picks the window up - which is what makes "the same letters, from the same rungs, in
 * the same order" a property rather than a hope, and what makes a career that was present from the
 * opening week roll exactly the dice it always rolled. Nothing about a normally-played career moves:
 * for it, slot and week are the same number.
 *
 * ⚠ WHAT DOES *NOT* CHANGE: nothing is manufactured. Every letter is still from a rung
 * `standingClears` says would have her, still rolls its own dice at its own chance, and a rung that
 * misses stays missed for the whole window - the roll is deterministic in (seed, window, slot), so
 * re-reading it on a later week returns the same answer rather than a second chance. A career that
 * clears no rung still gets no post. The one input that is read fresh each week is her STANDING, and
 * it always was: a brand writes on what the table says today.
 *
 * ⚠ AND THE CLOSING WEEK RAISES A LETTER NOW WHEN - AND ONLY WHEN - THE CAREER HAS JUST ARRIVED.
 * `isSponsorLetterWeek` is no longer the gate, because a career whose first week inside the window IS
 * the closing week would otherwise get the whole winter's post cancelled by a calendar rule written
 * to protect it. For a career that has been here since the opening week the closing week is still
 * silent by construction: every rung has already written or already missed.
 *
 * ZERO main-stream draws - the only randomness is `shopWritesAt`'s read of its own sub-stream.
 * Idempotent on the ids, so a week replayed twice cannot post the same letter twice.
 */
export function raiseKitOffers(args: {
  offers: Offer[]
  seed: string
  week: number
  standing: SponsorStanding
}): Offer[] {
  const { offers, seed, week, standing } = args
  const raised: Offer[] = []
  if (!isSponsorWindowWeek(week)) return raised
  // ⚠ ONE BRAND AT A TIME, and it is enforced HERE so that no caller can forget it (spec §4.1 as the
  // ladder extends it). The season she is about to play may be promised to ONE brand, so a
  // multi-season contract that is only halfway through turns the window away - sign the two-season
  // national deal and the global letter next winter finds her busy.
  //
  // ⚠⚠ ...EXCEPT FOR A STRICTLY STRONGER RUNG, WHICH IS ROUND 29 PART TWO #12. The test moved from
  // the top of this function into the loop below (`rungTurnedAway`), because it is no longer one
  // answer for the whole window: `global` running turns `tour` away and does not turn `premium`
  // away. The owner's sentence and the 191-winter measurement behind it are on `rungTurnedAway`.
  const opened = sponsorWindowOpensAt(week)
  const ladder = windowLadder(standing)
  // ⭐ WHICH RUNGS HAVE ALREADY WRITTEN IN THIS WINDOW - round-17 #27, and the identity is the TIER.
  //
  // THE REPORT: two identical Baseline Athletics letters, W48 and W49. Reproduced on the owner's own
  // save - `w359 kit open tour Baseline Athletic` and `w360 kit open tour Baseline Athletic`, same
  // brand, same allowance, same covers, same everything but the id and the date.
  //
  // THE CAUSE IS THE SEAM BETWEEN A LETTER'S IDENTITY AND ITS CONTENT. The identity is the SLOT
  // (`kit-<opened+slot>`) and the content is the TIER (`ladder[slot]`), and the two are allowed to
  // disagree because `windowLadder` is recomputed from a LIVE standing on every week of the window -
  // which the header above states as a feature ("the one input that is read fresh each week is her
  // STANDING"). When a stronger rung starts clearing mid-window the whole ladder shifts down by one,
  // so a tier that wrote from slot 1 on Monday is at slot 2 on the following Monday, that slot's id
  // has never been seen, its roll is a fresh independent draw, and the same brand writes twice. On
  // the owner's save the ladder gained a rung at the top between w359 and w360 and `tour` slid from
  // slot 0 to slot 1. The same shift silently SKIPS a rung when her standing falls.
  //
  // ⚠ FIXED ON THE TIER RATHER THAN BY RE-KEYING THE ID, deliberately: offer ids are PERSISTED in
  // `world.offers`, so changing the id scheme would make every career currently inside a window fail
  // to recognise its own letters and post them all a second time. This reads the window's own slot
  // ids - the canonical ones - and asks which tiers they carry, which needs no migration and no new
  // field. Everything the header promises is untouched: nothing is manufactured, every letter still
  // rolls its own dice at its own chance on the same sub-stream, and a rung that missed stays missed.
  const alreadyWritten = new Set<SponsorTier>()
  for (let s = 0; s < SPONSOR_LETTER_WEEKS; s++) {
    const seen = offers.find((o) => o.id === kitOfferId(opened + s))
    const seenTier = (seen?.terms as { tier?: SponsorTier } | undefined)?.tier
    if (seenTier) alreadyWritten.add(seenTier)
  }
  // ⭐⭐ ...AND THE BRAND SHE IS ALREADY WEARING IS ONE OF THEM - ROUND 28 #17, which is the round-17
  // rule above applied across the one seam it could not see.
  //
  // THE REPORT: «Baseline athletic 2 раза письмо о спонсорстве прислали на 48 и 52 неделе
  // одинаковое». Read off his own save: `kit-671` (W48, the window's opening week, tier `tour`,
  // refused) and `kit-renew-kit-567` (W52, the closing week, `renewal: true`, signed) - the same
  // brand, the same letterhead, and terms identical field for field, because the deal that was
  // ending was from that very rung.
  //
  // THE CAUSE IS A SECOND SEAM BETWEEN IDENTITY AND CONTENT. `alreadyWritten` above dedupes rung
  // against rung, and `raiseKitRenewal` dedupes the incumbent against itself, but NOBODY asked
  // whether the rung and the incumbent are the same brand. When the contract finishing under her is
  // from a rung she still clears, the ladder writes to her as a stranger on the window's own slot
  // AND the relationship writes to her on the closing week. It is not two offers; it is one brand in
  // two voices, and the feed row says so out loud - `reviewSponsors` already excludes the renewal
  // from the "letters from X and Y" clause precisely so the row cannot "name the same brand twice in
  // two different voices one sentence apart", and then names it twice anyway in two clauses.
  //
  // ⚠ THE RENEWAL IS THE ONE THE DESIGN KEEPS, and the rung's letter is the duplicate - not the
  // other way round. Three reasons, all of them already written down:
  //   * `raiseKitRenewal`'s own header: the incumbent lands LAST because `seasonSpokenFor` turns
  //     every other rung away the moment a letter is signed, and «the incumbent is the letter a
  //     parent is likeliest to sign on sight». A fresh letter from that same brand on slot 0 IS the
  //     incumbent writing on the window's opening week - the exact placement that header forbids.
  //   * the copy. `InboxSheet`/`OfferLetter` render `renewal: true` as «Another year in our kit»;
  //     without it the paper says «A kit deal for your daughter» and INTRODUCES a brand she has worn
  //     all season. Of the two letters only one is true.
  //   * suppressing the renewal instead would make the relationship depend on a competing letter's
  //     dice, and «⚠ NO DICE» is a pinned property of it: a girl who clears no rung at all still
  //     hears from the brand she has been with.
  // Read off `dealEndingWithSeason`, the same call the closing week makes to find who may renew, so
  // the two halves cannot disagree about who the incumbent is. A deal that is NOT ending stops the
  // window on its own (`seasonSpokenFor`, above), and a brand that was let down never reaches here
  // at all - `reviewSponsors` skips the whole call. No new state and no migration: the fact is
  // already in `offers`.
  const incumbent = dealEndingWithSeason(offers, week)
  const incumbentTier = (incumbent?.terms as { tier?: SponsorTier } | undefined)?.tier
  if (incumbentTier) alreadyWritten.add(incumbentTier)
  // Every rung whose turn has come by this week - which for a career that has been here all along is
  // "the one whose turn is today", because the earlier ones have already written or already missed.
  const dueThrough = Math.min(sponsorWindowSlot(week), SPONSOR_LETTER_WEEKS - 1)
  for (let slot = 0; slot <= dueThrough; slot++) {
    const tier = ladder[slot]
    if (!tier) break
    const id = kitOfferId(opened + slot)
    if (offers.some((o) => o.id === id)) continue
    // ⭐ ONE LETTER PER BRAND PER WINDOW, and the rung IS the brand (each tier has exactly one name
    // in `ECONOMY.sponsorship`). A brand does not write twice because the ladder moved under it
    // (round 17 #27), and it does not write as a stranger on top of the renewal it is going to send
    // on the closing week (round 28 #17).
    if (alreadyWritten.has(tier)) continue
    // ⭐⭐ ROUND 29 PART TWO #12 – THE RUNNING DEAL'S OWN BITE, ASKED PER RUNG. A contract that
    // covers the season ahead turns away every rung at or below its own and lets a strictly
    // stronger one through; signing that one ends the contract (`signOffer`). See `rungTurnedAway`
    // for the owner's sentence, the measurement, and the three properties this does not move.
    if (rungTurnedAway(offers, week, tier)) continue
    const terms = kitTermsFor(standing, tier)
    if (!terms) continue
    if (!shopWritesAt(seed, opened + slot, offerChanceFor(standing, tier))) continue
    const offer: Offer = {
      id,
      kind: 'kit',
      // The week it LANDED, which is what the paper is dated and what the feed reports. The slot it
      // came from lives in the id; the two differ only for a career that reached the window late.
      week,
      // ⚠⚠ EVERY LETTER CARRIES ITS OWN FIVE WEEKS FROM THE DAY IT LANDS (28.08, the owner's ruling
      // - see `kitOfferDeadline`). This used to be `sponsorWindowClosesAt(week)`: the deadline was a
      // property of the WINDOW, so a letter arriving late was worth less than one arriving early -
      // «the cost of the strongest-first order, paid by the brand rather than by the parent» - and
      // the last letter of a winter carried two weeks. It is now paid by nobody. What that bought
      // and he has given up is that a decision can be open in a week she is playing; what it cost,
      // and what he was actually reporting, is that a renewal-only career got ONE week to decide.
      deadlineWeek: kitOfferDeadline(week),
      terms,
      state: 'open',
    }
    offers.push(offer)
    raised.push(offer)
    // ...and it counts against this window immediately, so two slots resolved inside ONE call (a
    // career that reaches the window late catches up through several at once) cannot double up
    // either. The re-read at the top of the function only sees letters from earlier weeks.
    alreadyWritten.add(tier)
  }
  return raised
}

/**
 * THE BRAND SHE HAS BEEN WITH ASKS FOR ANOTHER YEAR (owner, 10.08).
 *
 * ⚠ IT IS A LETTER, NOT AN AUTOMATIC RE-SIGNING, and that is the owner's own word on the shape. A
 * contract that renewed itself would be the one place in this file where the parent is not asked, and
 * the whole reason the inbox exists is that he is («попапчик получить с письмом-предложением… И
 * кнопка sign/refuse»). So a renewal is an ordinary `open` kit offer: refusable, expirable, and
 * closed by `signOffer` if he takes somebody else instead.
 *
 * ⚠ AND IT LANDS ON THE WINDOW'S CLOSING WEEK - THE LAST WEEK, WHICH IS THE WHOLE DESIGN AND NOT A
 * SCHEDULING DETAIL. `seasonSpokenFor` is the trap: the season ahead may be promised to ONE brand, so
 * the moment a letter is SIGNED every other rung is turned away for as long as its term runs, and
 * `raiseKitOffers` stops writing. A renewal offered on the window's opening week would therefore let
 * the shop in her home town crowd out the global brand that would have written on week three - the
 * exact inversion `windowLadder` exists to prevent, and it would be worse here than the weakest-first
 * ordering that argument was written against, because the incumbent is the letter a parent is most
 * likely to sign on sight.
 *
 * So the queue is: the rungs she clears write first, strongest of them first (slots 0-3), and the
 * brand she already knows writes LAST. It is the last letter she can still take, and taking it is
 * always a choice made with every other letter of the winter already on the table.
 *
 * ⚠⚠ AND SINCE 28.08 IT NO LONGER EXPIRES THE WEEK IT ARRIVES. Its deadline was
 * `sponsorWindowClosesAt`, which on the closing week is TODAY, so the incumbent's letter was a
 * one-week decision - and for a career whose ladder is only the incumbent's own rung that was the
 * whole of the winter's post. That is what the owner reported and what his ruling closes: it carries
 * `kitOfferDeadline` like every other letter. Its PLACEMENT is untouched, which is what the rest of
 * this header is about; only its shelf life moved.
 *
 * ⚠ THE CLOSING WEEK IS "THE PARENT'S OWN" AND THIS DOES NOT TAKE IT BACK. `SPONSOR_LETTER_WEEKS`
 * reserves it so that no RUNG's turn falls there and every competitive letter has had at least two
 * weeks in his hand. A renewal is not a rung's turn - it is the relationship he is already in, on
 * terms he has been reading all season - so the week it needs is the week it is answered on. Its
 * deadline is the window's own close, like every other letter here, which on this week is today.
 *
 * ⚠ NO DICE. `shopWritesAt` is not consulted and no sub-stream is touched: a brand that has kitted
 * her out for a season and been paid back in tournaments does not roll to decide whether it has
 * noticed her. It is a relationship, not a competitive selection. That also means this function adds
 * ZERO draws to any stream, main or scoped.
 *
 * ⚠ AND IT IS NOT A FLOOR UNDER THE DICE, which is the one thing it must not become (owner, 10.08:
 * a season opening with no kit deal stays as it is - `docs/research/junior-economics.md` says a
 * sponsorless junior season is the norm). Nothing here manufactures a first deal: a renewal exists
 * only where a deal already existed, was signed by the parent, and was honoured on both sides.
 * `offerChance` is untouched, and a career that has never been written to is written to exactly as
 * often as before.
 *
 * ⚠ ON THE SAME PAPER, DELIBERATELY. The terms are copied from the contract that is ending rather
 * than re-derived through `kitTermsFor`, because that is what a renewal IS - the brand extending what
 * it already gave her - and because re-deriving would silently re-price a relationship against
 * today's standing and today's ECONOMY. It is `kitTermsFor`'s own snapshot rule («terms are a
 * snapshot, not a formula») applied to the second year of the same deal. A signed deal's terms never
 * carry `ended` / `endedEventsPlayed`: those are written onto the goodbye NOTICE and never onto a
 * contract, so there is nothing to strip.
 *
 * Returns the letter, or null when nobody is renewing. Idempotent on its id, like every other letter
 * this file raises.
 */
export function raiseKitRenewal(offers: Offer[], week: number, ended: Offer): Offer | null {
  if (!isSponsorWindowCloseWeek(week)) return null
  // ONE BRAND AT A TIME, the same rule `raiseKitOffers` keeps and read from the same predicate: if he
  // has already signed somebody for next season, the incumbent has been answered by that signature.
  if (seasonSpokenFor(offers, week)) return null
  // ...AND A BRAND THAT WAS LET DOWN DOES NOT ASK FOR MORE OF THE SAME. Read off the goodbye letter
  // the review already posted, exactly as the feed row reads it - one fact, one place it is written
  // down. A deal ended for `events` or `standing` is a relationship that failed; only a term served
  // in full earns the offer of another one.
  if (letDownThisWindow(offers, week)) return null
  const id = `kit-renew-${ended.id}`
  const already = offers.find((o) => o.id === id)
  if (already) return already
  const offer: Offer = {
    id,
    kind: 'kit',
    week,
    // ⭐⭐ FIVE WEEKS, LIKE EVERY OTHER LETTER, AND THIS IS THE DEFECT THE 28.08 RULING EXISTS TO
    //    CLOSE. It used to be `sponsorWindowClosesAt(week)`, which on the closing week is TODAY - so
    //    the commonest career in the game, the local shop renewing every winter, got a one-week
    //    decision every year and often no other letter at all. The renewal still LANDS last (see the
    //    header); what it no longer does is expire the moment it arrives.
    deadlineWeek: kitOfferDeadline(week),
    terms: { ...(ended.terms as KitOfferTerms), renewal: true },
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
  // ⚠ AND SINCE THE WINDOW, THE ONE-BRAND RULE HAS TO BE ENFORCED ON THE WAY IN AS WELL (05.08). The
  // window deliberately leaves several letters open at once so a choice can accumulate; without this
  // line a parent could sign two of them and the game's oldest invariant - at most one deal - would
  // be broken by the feature meant to make signing a decision. `signOffer` also closes the losers, so
  // this is belt and braces for a stale screen answering a letter that has already been beaten.
  //
  // ⚠⚠ AND IT ASKS `rungTurnedAway` RATHER THAN `seasonSpokenFor` SINCE ROUND 29 PART TWO #12. A
  // strictly stronger rung may write over a running deal, so it must also be SIGNABLE - a letter the
  // engine posts and then refuses is worse than no letter at all. The invariant is unchanged and is
  // still enforced here: at most one deal, because signing the stronger one ends the weaker one in
  // the same breath (see `signOffer`). A rung at or below the running deal's is refused exactly as
  // it always was, with exactly the same sentence.
  if (offer.kind === 'kit' && rungTurnedAway(offers, week, (offer.terms as KitOfferTerms).tier)) {
    return 'She is already signed for next season.'
  }
  return null
}

/**
 * SIGN IT. Irreversible by design - this is the one place in the game where the parent commits a
 * future he cannot see, and there is deliberately no unsign. The UI puts a `ConfirmDialog` in front
 * of it, the same gate every destructive action in More goes through.
 *
 * The deal runs FROM `dealStartsAt` - today, or the week the contract she is still under stops - to
 * the end of the last season it was offered for. Waiting therefore costs weeks of fresh kit and buys
 * nothing - terms are fixed at arrival and never improve, so the only thing a held letter can do is
 * get shorter.
 *
 * ⚠ AND SIGNING ONE CLOSES THE OTHERS (05.08). The window leaves up to four letters open at once so
 * that "choose" means something; the moment he chooses, the brands he did not choose are refused.
 * They are marked `refused` rather than `expired` because that is what actually happened - he
 * answered them by signing somebody else - and because the inbox dot is `hasLiveOffer`, so a letter
 * left open would keep knocking about a decision already taken.
 */
export function signOffer(offers: Offer[], offerId: string, week: number): Offer | null {
  const err = offerAnswerError(offers, offerId, week)
  if (err) return null
  const offer = offers.find((o) => o.id === offerId)!
  // ⭐ THE ADVERTISING DEAL SIGNS ON ITS OWN ARM (the-face-and-the-court.md §6 step 1), because every
  // number below this branch is KIT arithmetic: `dealStartsAt` queues a new contract behind the
  // signed KIT deal (an ad deal coexists with the kit ladder – different category, different gate),
  // `dealUntilWeek` anchors a term on the SEASON so a held letter cannot buy extra weeks of kit, and
  // the closing loop refuses the window's losing brands. None of that is true of a campaign: her
  // face is theirs from the day the paper is signed, for exactly `termWeeks`, and there is no window
  // of rival letters to close (`reviewAdOffer` raises at most one at a time by construction). The
  // fee itself is paid by `acceptOffer` – the world owns the wallet, this file owns the paper.
  if (offer.kind === 'ad') {
    const termWeeks = Math.max(1, (offer.terms as AdOfferTerms).termWeeks)
    offer.state = 'signed'
    offer.decidedWeek = week
    offer.fromWeek = week
    offer.untilWeek = week + termWeeks - 1
    return offer
  }
  // ⭐⭐ ROUND 29 PART TWO #12 – SHE STEPS UP, AND THE BRAND SHE LEAVES IS TOLD SO. `rungTurnedAway`
  // lets a strictly stronger rung write over a running deal and `offerAnswerError` lets it be
  // signed; this is the other half, and without it the game would briefly hold two live contracts.
  // The outgoing deal ends WITH THE SEASON IT IS IN (`endDealWithSeason` - the same snap a failed
  // deal takes, so `untilWeek` lands on `contractEndWeek` and the successor's `dealStartsAt` reads
  // the week after), and its goodbye is posted on the spot with its own reason.
  //
  // ⚠ REASON `stepped`, NOT `term`: this contract was not served out, and `term` means it was. The
  // goodbye is the only place a player learns a deal stopped, so it must not lie about why.
  //
  // ⚠ AND IT IS RAISED HERE RATHER THAN LEFT TO `reviewSponsors`, which would reach the same deal on
  // a later week of the same window and call it `term`. `raiseKitEndLetter` is idempotent on
  // `kit-end-<id>`, so posting it first is what makes the true reason the one that survives.
  // ⚠⚠ THE TEST IS `>= coveredSeasonStart(week)` AND NOTHING ELSE, AND THE FIRST DRAFT CARRIED A
  // SECOND CLAUSE (`&& untilWeek > contractEndWeek(week)`) THAT WAS ARITHMETICALLY DEAD. It was
  // caught by mutating it and watching the guard STAY GREEN – `coveredSeasonStart(week)` is
  // `52k + 52` and `contractEndWeek(week)` is `52k + 49`, so the first test implies the second and
  // the second could never refuse anything the first admitted. A redundant condition reads as a
  // decision to the next person; this is the decision, written once.
  //
  // ⭐ AND IT IS THE RIGHT TEST RATHER THAN «is it live today». A contract that runs out with the
  // season she is PLAYING is not superseded by a letter she signs in that season – she is wearing
  // their kit, the term is being served, and `dealStartsAt` queues the new deal behind it instead.
  // Only a deal that reaches into the season the new letter is FOR is one this signature displaces.
  const superseded = offers.filter(
    (o) => o !== offer && o.kind === 'kit' && o.state === 'signed' && (o.untilWeek ?? -1) >= coveredSeasonStart(week),
  )
  for (const old of superseded) {
    endDealWithSeason(old, week)
    raiseKitEndLetter(offers, week, old, 'stepped', old.eventsPlayed)
  }
  // Read the start BEFORE the state moves: `dealStartsAt` walks the signed deals, and this one is
  // about to become one of them (with no `untilWeek` yet, so it could not move the answer - but the
  // order is written to be true rather than merely harmless). ⚠ AND IT IS READ AFTER THE STEP-UP
  // ABOVE, deliberately: the superseded deal's `untilWeek` has just been pulled back to this
  // season's contract end, and a start computed before that would queue the new deal behind a term
  // that no longer exists.
  const from = dealStartsAt(offers, week)
  offer.state = 'signed'
  offer.decidedWeek = week
  offer.fromWeek = from
  offer.untilWeek = dealUntilWeek(offer)
  offer.coveredCents = 0
  for (const other of offers) {
    if (other === offer || other.kind !== 'kit' || other.state !== 'open') continue
    other.state = 'refused'
    other.decidedWeek = week
  }
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
 *  nothing at all.
 *
 *  ⚠ AND IT LANDS ON `contractEndWeek`, NOT ON THE LAST WEEK OF THE CALENDAR YEAR (05.08). A
 *  one-season deal signed this winter expires on week 49 of the season it covers - «заканчивать
 *  контракты вместе с сезоном» - so the two quiet weeks after it belong to nobody and the next
 *  window opens against an empty slot. The fortnight it gives up carries no tournament and no
 *  ranking; what it buys is that a contract can never shut the post against its own successor. */
export function dealUntilWeek(offer: Offer): number {
  const seasons = Math.max(1, (offer.terms as KitOfferTerms).seasons ?? 1)
  return coveredSeasonStart(offer.week) + (seasons - 1) * WEEKS_PER_YEAR + (WEEKS_PER_YEAR - OFF_SEASON_WEEKS)
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

/** The confirmation the desk sends when an entry ENDS before the deadline, raised by `releaseEntry`.
 *
 *  ⚠ IT CARRIES WHO ENDED IT, AND THAT IS THE WHOLE POINT OF THE PARAMETER (fix/outgrown-entry,
 *  05.08). Two paths reach `releaseEntry` and only one of them is a decision the PARENT took: his
 *  own in-time withdrawal, and the injury auto-withdraw inside `tickWeek`. For three releases both
 *  produced the identical sheet - «Your withdrawal ... is confirmed – in time, free of charge, and
 *  nothing is recorded against her» - so the engine's own action came back to the player as a
 *  receipt for a choice he had not made, complete with reassurances about consequences he had not
 *  risked. A letter that cannot say who acted is worse than no letter: it is a wrong one.
 *
 *  `'parent'` writes exactly the terms this function has always written (no `releasedBy` key at
 *  all), so every existing letter, save and test of the voluntary exit is byte-identical. */
export function raiseEntryCancelLetter(
  offers: Offer[],
  week: number,
  event: { id: string; tier: TierId; week: number; deadlineWeek: number },
  label: string,
  releasedBy: EntryReleaseReason = 'parent',
): Offer {
  const n = offers.filter((o) => o.kind === 'entry' && o.id.startsWith(`entry-${event.id}-`)).length
  const terms: EntryLetterTerms = {
    tier: event.tier,
    label,
    eventWeek: event.week,
    freeUntilWeek: event.deadlineWeek,
    cancelled: true,
  }
  if (releasedBy !== 'parent') terms.releasedBy = releasedBy
  const offer: Offer = {
    id: `entry-${event.id}-${n}`,
    kind: 'entry',
    week,
    deadlineWeek: event.deadlineWeek,
    terms,
    state: 'info',
  }
  offers.push(offer)
  return offer
}

// =================================================================================================
// THE TOUR'S OWN VOICE (W3-ACT2 §6, the mandatory regime's half of the mail surface)
// =================================================================================================
//
// A third writer, and the reason it is a third one rather than a second `entry` shape is what it is
// FOR. An `entry` letter is a receipt for something she did; a `tour` letter is the REGIME talking -
// the warning that an obligation is about to fall due, the notice of what a missed one cost, and the
// suspension. Same surface, same `state: 'info'` (nothing to sign, nothing to expire), zero
// randomness, ids derived from state so a replayed week writes the same inbox.
//
// ⚠⚠ THE ORDER OF THESE THREE IS THE OWNER'S RULING AS MECHANISM. «Мы ни за что не наказываем»: the
// DUE letter is raised at the entry DEADLINE, one week before the event, so the first thing that
// ever happens is a warning she can still act on; the PENALTY letter names the rule and the price
// and quotes her running total against the threshold, so a charge reads like a bill; the SUSPENSION
// letter states its last week. No copy anywhere in this family shames her - see the note on
// `raiseMandatoryDueLetter` for the one sentence that decides it.

/** THE WARNING. Raised at a mandatory event's entry deadline while she is still able to enter it.
 *
 *  ⚠ THE WORDING IS THE RULING. It says what the tour requires and what declining costs, and it
 *  stops there: a letter that added "she really should go" would be the GAME leaning on the player,
 *  and the whole point of §6 is that the tour has rules and the game has none. A penalty is a price
 *  she chose to pay, like money - so the letter is priced like an invoice and worded like one. */
export function raiseMandatoryDueLetter(
  offers: Offer[],
  week: number,
  event: { id: string; tier: TierId; week: number; deadlineWeek: number },
  label: string,
  points: number,
): Offer {
  const offer: Offer = {
    id: `tour-due-${event.id}`,
    kind: 'tour',
    week,
    deadlineWeek: event.deadlineWeek,
    terms: {
      notice: 'due',
      tier: event.tier,
      label,
      eventWeek: event.week,
      freeUntilWeek: event.deadlineWeek,
      points,
    },
    state: 'info',
  }
  if (offers.some((o) => o.id === offer.id)) return offers.find((o) => o.id === offer.id)!
  offers.push(offer)
  return offer
}

/** ⭐ THE SEASON NOTICE (round-18 #8) – the quiet half of the briefing, and the FOURTH voice in this
 *  family. The owner asked for something «перед началом сезона больших призов и чемпионатов» saying
 *  that she really is required to be there and that there is a regulation behind it; the regulation
 *  is his own §6 and has been enforced since v38, but nothing ever announced the REGIME - only the
 *  individual obligations, one invoice at a time, at their deadlines.
 *
 *  So the first time it binds her the player gets a blocking briefing (`buildTourBriefing`), and
 *  every season after that he gets this: one letter, at the season's opening, stating the same rule
 *  without stopping the game. A popup a year would be nagging; a rule nobody restates is the trap
 *  again.
 *
 *  ⚠ THE WORDING IS STILL THE RULING. It lists what the tour requires and what declining costs, and
 *  it stops there - see the note on `raiseMandatoryDueLetter` for the sentence that decides this
 *  whole family's voice. Nothing here says she should go.
 *
 *  ⚠ ONE PER SEASON, BY ID. `seasonIndex` is the idempotency key, so a replayed week, a reload or a
 *  rank that flickers across the threshold twice in one year all write the same letter once. */
export function raiseTourSeasonLetter(
  offers: Offer[],
  week: number,
  seasonIndex: number,
  terms: Omit<TourLetterTerms, 'notice'>,
): Offer {
  const id = `tour-season-${seasonIndex}`
  const existing = offers.find((o) => o.id === id)
  if (existing) return existing
  const offer: Offer = {
    id,
    kind: 'tour',
    week,
    deadlineWeek: week,
    terms: { notice: 'season', ...terms },
    state: 'info',
  }
  offers.push(offer)
  return offer
}

/** THE CHARGE, with the rule named and the running total quoted against the threshold - so the
 *  player can always see how close the ledger is to the line without going to look for it. */
export function raiseMandatoryPenaltyLetter(
  offers: Offer[],
  week: number,
  args: {
    reason: PenaltyReason
    points: number
    runningPoints: number
    suspensionAt: number
    tier?: TierId
    label?: string
    eventId?: string
  },
): Offer {
  const offer: Offer = {
    id: `tour-penalty-${week}-${args.reason}-${args.eventId ?? 'season'}`,
    kind: 'tour',
    week,
    deadlineWeek: week,
    terms: {
      notice: 'penalty',
      reason: args.reason,
      points: args.points,
      runningPoints: args.runningPoints,
      suspensionAt: args.suspensionAt,
      ...(args.tier ? { tier: args.tier } : {}),
      ...(args.label ? { label: args.label } : {}),
    },
    state: 'info',
  }
  if (offers.some((o) => o.id === offer.id)) return offers.find((o) => o.id === offer.id)!
  offers.push(offer)
  return offer
}

/** THE SENTENCE. One letter, its last week on the paper, and nothing else - a suspension is a fact
 *  with a date on it and needs no commentary. */
export function raiseSuspensionLetter(
  offers: Offer[],
  week: number,
  untilWeek: number,
  runningPoints: number,
  suspensionAt: number,
): Offer {
  const offer: Offer = {
    id: `tour-suspension-${week}`,
    kind: 'tour',
    week,
    deadlineWeek: untilWeek,
    terms: { notice: 'suspension', untilWeek, runningPoints, suspensionAt },
    state: 'info',
  }
  if (offers.some((o) => o.id === offer.id)) return offers.find((o) => o.id === offer.id)!
  offers.push(offer)
  return offer
}

/** Is there anything about this tournament letter that has not happened yet? The two dates a desk
 *  or tour letter can carry that reach FORWARD: the event it confirms, and the week a suspension
 *  lifts. Either one in the future means the letter is still doing a job.
 *
 *  ⚠ THIS IS THE HALF THAT MAKES A SEASON PRUNE SAFE. Both of these routinely cross the boundary:
 *  entries for the first weeks of a season are written in the off-season before it, and a
 *  suspension imposed in November runs into the new year. Dropping "last season's letters" without
 *  it would delete the confirmation for an event she is about to play and the only paper that says
 *  why her entries are refused. */
function letterReachesForward(o: Offer, week: number): boolean {
  const t = o.terms as { eventWeek?: number; untilWeek?: number }
  return (t.eventWeek ?? -1) >= week || (t.untilWeek ?? -1) >= week
}

/** THE INBOX STAYS BOUNDED (the `Snapshot.offers` note promises "never pruned" about CONTRACTS,
 *  and it can only keep that promise if the receipts do not pile up for ever): a professional
 *  career writes ~15-30 desk letters a season, so unlike the sponsor's handful they must age out.
 *  Sponsor letters are NEVER touched here: a signed deal outlives every prune, which is the whole
 *  reason the inbox exists.
 *
 *  ⭐ THE WINDOW IS THE SEASON NOW, NOT A ROLLING YEAR – round-17 #1, the owner: auto-delete last
 *  season's tournament letters, and keep anything that is not one.
 *
 *  ⚠ AND "A YEAR" IS WHY HE HAD TO ASK, WHICH IS THE WHOLE FINDING. The rule already dropped exactly
 *  the right KINDS - `entry` and `tour`, never `kit` - so this was never a missing feature. It was
 *  the wrong clock: a rolling 52 weeks means a letter written in week 3 survives until week 3 of the
 *  NEXT season, so a player who opens the inbox in a new season is looking at almost a full year of
 *  the last one, and the newer the letter the longer it outstays. "Last season's" is a statement
 *  about a BOUNDARY, and a rolling window never crosses one. `seasonIndexOf` is the same definition
 *  of a season the money screens and the wrap-up use (world/ledger.ts), so the inbox now empties on
 *  the week the season table does.
 *
 *  ⚠ ONE AUTHORITY OVER ONE LIFETIME. `composables/inboxMail.ts` records the ruling that the bin
 *  icon is DISMISS-FROM-THE-LIST and not destroy, precisely so there are not two owners of when a
 *  letter dies. This is still the only destructor, running where it always ran (`housekeep`, every
 *  tick, idempotent) - it changed its mind about the date, not about who decides. */
export function pruneEntryLetters(offers: Offer[], week: number): Offer[] {
  // ⚠ THE TOUR'S OWN LETTERS AGE OUT WITH THE DESK'S (W3-ACT2), and for the same reason: a
  // professional season writes a handful of due-notices and (rarely) a charge, and a record nobody
  // can find is not a record. The PENALTY LEDGER itself is never pruned - the letter is the
  // announcement, `world.penalties` is the account - so a charge stays readable on the Stats screen
  // long after its paper has left the inbox, and the season boundary is what forgives it.
  const season = seasonIndexOf(week)
  return offers.filter(
    (o) =>
      (o.kind !== 'entry' && o.kind !== 'tour') ||
      seasonIndexOf(o.week) >= season ||
      letterReachesForward(o, week),
  )
}

/** The deal that covered the season now finishing, if any - what the off-season review has to judge
 *  before it decides whether anybody writes again.
 *
 *  ⚠ IT IS THE DEAL THAT WAS ALREADY RUNNING WHEN THE WINDOW OPENED, and that is a stricter question
 *  than "the deal in force today" (06.08, fix/sponsor-catchup). It used to be exactly
 *  `activeKitDeal(offers, reviewWeek)`, which was safe for as long as the verdict was pinned to the
 *  window's opening week: nothing can have been signed yet on the first tick of a window. The verdict
 *  is now taken on whichever week of the window the career first reaches, and by week 49 a letter
 *  signed on week 47 IS the deal in force - so the old reading would have handed the review a
 *  contract that has not begun, judged it on a season it did not cover, and ended it before it
 *  started. Anchoring on the window's opening week also makes the answer the same on every week of
 *  the window, which is half of what makes the verdict idempotent.
 *
 *  The two clauses are one sentence: it was running when the brands' window opened, and it had not
 *  already stopped. A letter signed inside the window starts at `dealStartsAt` - today or later - so
 *  it can never satisfy the first. */
export function dealUnderReview(offers: Offer[], reviewWeek: number): Offer | null {
  const opened = sponsorWindowOpensAt(reviewWeek)
  return (
    offers.find(
      (o) =>
        o.kind === 'kit' &&
        o.state === 'signed' &&
        (o.fromWeek ?? o.decidedWeek ?? 0) < opened &&
        (o.untilWeek ?? -1) >= opened,
    ) ?? null
  )
}

/** The last week of the SEASON YEAR containing `week` - offset 51, the last of the three quiet
 *  weeks.
 *
 *  ⚠ IT IS NO LONGER ANYTHING TO DO WITH A CONTRACT (05.08). It used to be both "the last week of
 *  the year" and "the week a deal ends on", because those were the same week; a term now ends on
 *  `contractEndWeek` (offset 49) so that the slot is empty while the brands' window is still open,
 *  and the two questions have come apart. Its one remaining caller is the snapshot's `seasonSupply`,
 *  which wants the calendar horizon and always did - a deal's dates must go through
 *  `contractEndWeek`. */
export function seasonLastWeek(week: number): number {
  return Math.floor(week / WEEKS_PER_YEAR) * WEEKS_PER_YEAR + WEEKS_PER_YEAR - 1
}

/** END IT HERE. A multi-season deal that failed its terms does not limp to its contractual finish -
 *  it stops with the season it failed, and the brand does not come back this winter.
 *
 *  ⚠ "WITH THE SEASON" IS `contractEndWeek` NOW (05.08), the same week every term ends on, so a deal
 *  that was ended early and one that ran its course stop on exactly the same week and the window
 *  that follows cannot tell them apart. It used to be `seasonLastWeek`, the calendar year's own end.
 *
 *  Nothing is clawed back and nothing touches the balance: the kit she was given stays given, and
 *  `untilWeek` simply stops being in the future. Idempotent, because a deal already ending on that
 *  week is left exactly as it is. */
export function endDealWithSeason(offer: Offer, reviewWeek: number): void {
  offer.untilWeek = Math.min(offer.untilWeek ?? contractEndWeek(reviewWeek), contractEndWeek(reviewWeek))
}

/** THE BRAND SAYS GOODBYE IN WRITING (owner, 04.08). A deal ending is news, so it arrives as a new
 *  letter rather than as a changed status line on the one she signed a year ago — that line was
 *  already correct and already unread, which is exactly the failure this closes.
 *
 *  ⚠ IT IS A NOTICE, NOT AN OFFER: `state: 'info'`, so nothing about it can be signed, refused or
 *  expire, and `raiseKitOffers`'s one-brand-at-a-time rule cannot see it as a live letter. The terms
 *  are copied from the ended deal so the notice quotes its own numbers instead of re-deriving them
 *  from a world that has already moved on.
 *
 *  ⚠ AND IT IS RAISED FOR EVERY ENDING, including a term served in full — a contract that simply
 *  ran out is the moment a player most needs to know the bills are his again. `reason` is what the
 *  copy differs on; see KitEndReason.
 *
 *  ⚠ AND IT IS IDEMPOTENT ON ITS ID, like every other letter this file raises (06.08). It used to be
 *  the one `raise*` here that pushed unconditionally, which was safe only because its single caller
 *  was gated to one week a year. The verdict is now taken on whichever week of the window the career
 *  reaches first and re-read on the rest of them, so "post the goodbye once" has to be a property of
 *  this function rather than of its call site — the same guard the tour's three letters keep. */
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
  const already = offers.find((o) => o.id === notice.id)
  if (already) return already
  offers.push(notice)
  return notice
}

// --- the academy's post (round 24 #1) -----------------------------------------------------------

/** ONE REVIEW, ONE SEASON, ONE LETTER – the idempotency key for the academy's paper.
 *
 *  ⚠ THE SEASON IS THE WHOLE KEY, and the notice deliberately is NOT part of it. `reviewAcademy` can
 *  say exactly one of its three things per season boundary (arrive, move the share, end), so a key
 *  that also carried the notice would let a replayed week that re-decided the verdict write two
 *  letters about one review. The same reasoning `raiseTourSeasonLetter` states for `tour-season-N`. */
export function academyLetterId(seasonIndex: number): string {
  return `academy-${seasonIndex}`
}

/** Every academy letter, oldest review first. `world.offers` is push-ordered and academy letters are
 *  never pruned, but a career healed by `settleAcademyLetters` can have its back-filled arrival
 *  pushed AFTER letters from later seasons – so this sorts on the season rather than trusting the
 *  array, which is the same reason `InboxSheet` sorts on `week` rather than reversing the list. */
export function academyLetters(offers: Offer[]): Offer[] {
  return offers
    .filter((o) => o.kind === 'academy')
    .sort((a, b) => (a.terms as AcademyLetterTerms).seasonIndex - (b.terms as AcademyLetterTerms).seasonIndex)
}

/** The last thing the academy said, or null if it has never written. */
export function newestAcademyLetter(offers: Offer[]): Offer | null {
  const all = academyLetters(offers)
  return all.length ? all[all.length - 1] : null
}

/** THE ACADEMY WRITES (round 24 #1). A NOTICE, not a proposal: `state: 'info'`, so there is nothing
 *  to sign, nothing to refuse, and `expireOffers` has nothing to lapse – the same shape the tour's
 *  four notices and the brand's goodbye already have.
 *
 *  ⚠ IT IS RAISED FOR ALL THREE, INCLUDING THE ENDING, and that is the half the feed was worst at:
 *  a scholarship that stops is the moment the player most needs a record, and it is exactly the row
 *  `pruneEvents` throws away first. The letter is `kind: 'academy'`, which `pruneEntryLetters` never
 *  touches, so it is still there a season later when he goes looking.
 *
 *  ⚠ IDEMPOTENT ON ITS ID, like every other `raise*` in this file. Nothing here draws. */
export function raiseAcademyLetter(offers: Offer[], week: number, terms: AcademyLetterTerms): Offer {
  const id = academyLetterId(terms.seasonIndex)
  const existing = offers.find((o) => o.id === id)
  if (existing) return existing
  const notice: Offer = {
    id,
    kind: 'academy',
    week,
    // Informational letters never expire on their own; see `raiseKitEndLetter`.
    deadlineWeek: week,
    terms: { ...terms },
    state: 'info',
  }
  offers.push(notice)
  return notice
}

// --- the national squad's invitation (round 27 #6) ----------------------------------------------

/** ONE TIE, ONE LETTER – the idempotency key for the squad's paper, and it is keyed on the week the
 *  tie is PLAYED rather than on the week the letter arrives.
 *
 *  ⚠ THAT IS THE WHOLE OF WHY A REPLAYED WEEK CANNOT WRITE TWICE. The letter is raised on the week
 *  BEFORE the fixture, so a key on the arrival week would look identical – until a career ends and
 *  resumes, or a migration re-runs a week, and the same tie is announced under two ids. The tie's
 *  week is the fact the letter is about; `academyLetterId` keys on the review for the same reason. */
export function callUpLetterId(tieWeek: number): string {
  return `call-up-w${tieWeek}`
}

/** HER FEDERATION WRITES (round 27 #6). A NOTICE, not a proposal: `state: 'info'`, so there is
 *  nothing to sign and nothing to refuse – which here is the FICTION as well as the plumbing.
 *  Research §0.7 (the National Association nominates) and §0.8 (availability is a Good Standing
 *  criterion her own federation judges unappealably): «she does not enter it, she is not asked, and
 *  she may not decline», which is `resolveCallUp`'s own sentence one file along.
 *
 *  ⚠ IT ARRIVES BEFORE THE WEEK IT IS ABOUT, and that is the item. The shipped call-up reported
 *  itself in a toast after three rubbers had already been simulated; `TourLetterTerms`'s own note is
 *  the precedent for the other order – «the warning arrives at the entry deadline, A WEEK BEFORE THE
 *  EVENT, which is the whole of "every obligation is announced in a letter before it can bite"».
 *
 *  ⚠ IDEMPOTENT ON ITS ID, like every other `raise*` in this file. Nothing here draws. */
export function raiseCallUpLetter(offers: Offer[], week: number, terms: CallUpLetterTerms): Offer {
  const id = callUpLetterId(terms.tieWeek)
  const existing = offers.find((o) => o.id === id)
  if (existing) return existing
  const notice: Offer = {
    id,
    kind: 'call-up',
    week,
    // Informational letters never expire on their own; see `raiseKitEndLetter`.
    deadlineWeek: week,
    terms: { ...terms },
    state: 'info',
  }
  offers.push(notice)
  return notice
}

// =================================================================================================
// THE ADVERTISING DEAL (round 24 item 2, docs/plans/the-face-and-the-court.md §6 STEP 1)
// =================================================================================================
//
// The other kind of sponsor entirely: a NON-ENDEMIC house paying cash for her face, not kit for her
// tennis. This section is the paper only – who wrote, whether one is already on the table, and the
// one roll that decides whether this is the week somebody writes. The GATE (her age, her standing,
// the college freeze) is the world's business and lives in `world/sponsors.ts` (`reviewAdOffer`),
// exactly as the kit letters split the same two jobs between `raiseKitOffers` and `reviewSponsors`.
//
// RNG DISCIPLINE: `adWritesAt` draws on `seed:ad:<week>` – its own purpose-scoped sub-stream,
// created here, read once, discarded, keyed on the WEEK so a replayed career gets the same answer at
// the same boundary. ZERO draws on MAIN, so the frozen capture (41550 / e6b0c709) cannot move by one.

/** The identity of an advertising letter: its category and the week it landed. At most one letter
 *  per category can be raised per week (`adSpokenFor` turns a category's writer away while its slot
 *  holds a live letter or a running deal), so the pair is unique, and it is stable across a replay
 *  the way every other derived id in this file is.
 *
 *  ⚠ THE CATEGORY-LESS SPELLING IS THE HISTORICAL ID (`ad-<week>`) and old saves hold letters under
 *  it; nothing renames them, and the optional parameter keeps this function the one authority on
 *  both spellings. */
export function adOfferId(week: number, category?: AdCategory): string {
  return category ? `ad-${category}-${week}` : `ad-${week}`
}

/** ⭐⭐ THE WINTER SHOOT WINDOW (round 29 part four P9, overturning §5.2's in-season-only rule).
 *  The owner: «межсезонье – "слишком много съёмок и никакого отпуска" – вот это то, чего у нас
 *  вообще нет, у нас 6 пустых недель там.»
 *
 *  HIS SIX WEEKS, DERIVED AND NOT INVENTED: the top of the professional calendar goes quiet after
 *  the 1000-tier's last anchor at season offset 45 (`wta1000.anchorWeeks`), so a top player's year
 *  ends with offsets 46–51 empty – three playable wind-down weeks nothing big is scheduled in, then
 *  the three off-season weeks (`OFF_SEASON_WEEKS`). Those six are what he counted in his own save,
 *  and they are now the shoot season: `chooseShootWeeks` fills them FIRST, and only the overflow
 *  spills into the season proper, where the round-29 #3 four-way clash machinery prices it exactly
 *  as before.
 *
 *  ⚠ THE COST OF A WINTER SHOOT IS THE REST IT DISPLACES, not a new number: `accrueCondition`
 *  already pays a shoot week the travel figure instead of the free week's base + slider, so a shoot
 *  parked on an empty winter week forfeits precisely the recovery that week would have banked – the
 *  vacation it replaces, priced by the ladder that was already there. §5.2's «an off-season cost is
 *  free money wearing a cost's clothes» was written when a shoot week charged nothing off-season;
 *  P9 retires the rule by pointing at the rest. Lower tiers still hold events on offsets 46–48, so
 *  a winter shoot CAN collide with an entered event there and the clash question is asked exactly
 *  as in season – nothing about the window exempts it. */
export const WINTER_SHOOT_WEEKS = OFF_SEASON_WEEKS + 3

/** True for the last `WINTER_SHOOT_WEEKS` weeks of a season year – the shoot season. */
export function isWinterShootWeek(week: number): boolean {
  const offset = ((week % WEEKS_PER_YEAR) + WEEKS_PER_YEAR) % WEEKS_PER_YEAR
  return offset >= WEEKS_PER_YEAR - WINTER_SHOOT_WEEKS
}

/** ⚠ THE HISTORICAL THREE-RUNG LADDER (round 29 part two #19/#20), kept because letters written
 *  under it are persisted in real saves and every reader of an old paper still needs its names.
 *  Round 29 part four P6/§8 replaced the ladder with the CATEGORY portfolio below – the axis moved
 *  from «which single house writes» to «which categories of a shelf are open». Nothing composes new
 *  terms from these three values any more; `adCategoryOf` maps each onto the category its house
 *  always was. */
export const AD_TIERS: readonly AdTier[] = ['watch', 'campaign', 'house']

/** ⭐⭐⭐ THE PORTFOLIO'S CATEGORIES, IN SHELF ORDER (round 29 part four P6/P7/§8) – the order the
 *  portfolio surface lists them and the order `reviewAdOffer` walks them, weakest gate first so the
 *  shelf reads as a climb. The capstone is deliberately LAST: it is not a trade, it is the one
 *  kit-shaped deal on top of the whole shelf. */
export const AD_CATEGORIES: readonly AdCategory[] = ['watches', 'cars', 'drinks', 'clothing', 'airline', 'fragrance', 'capstone']

/** WHICH CATEGORY A LETTER'S PAPER FILLS – the one mapping that makes the portfolio rule reach
 *  every letter ever written, new or old. A new letter names its category; an old one is mapped
 *  through its tier, EXACTLY rather than by guess: the watch rung's house was a watchmaker, the
 *  campaign rung's an airline, the house rung's a perfumer, and a letter with neither field is a
 *  Quiet Hour letter by construction (the catalogue had one house when it was written). */
export function adCategoryOf(terms: AdOfferTerms): AdCategory {
  if (terms.category) return terms.category
  const tier = terms.tier ?? 'watch'
  return tier === 'watch' ? 'watches' : tier === 'campaign' ? 'airline' : 'fragrance'
}

/** THE STRONGEST BAND HER STANDING CLEARS, as an index into `ECONOMY.advertising.bands`
 *  (weakest-first), or null when none does – `rungFor`'s rule, applied to the gradient. The band
 *  sets the CHEQUE for every category at once, which is §8's whole design: the shelf's shape is
 *  constant and the cheque is the only axis that scales.
 *
 *  ⚠ `wtaRanked` IS THE GUARD AND IT IS NOT OPTIONAL. Everybody without a counting W result ties at
 *  the FLOOR of that table (`tableSize`, 564 rows), so a position there is not a standing – the
 *  same trap `standingClears` documents for the kit rungs. */
export function adBandFor(standing: SponsorStanding): number | null {
  if (!standing.wtaRanked) return null
  const bands = ECONOMY.advertising.bands
  for (let i = bands.length - 1; i >= 0; i--) {
    if (standing.wtaRank <= bands[i].maxWtaRank) return i
  }
  return null
}

/** ⭐⭐⭐ ROUND 32 #5 – WHICH BAND A LETTER WAS WRITTEN AT, recovered from the paper itself.
 *
 *  THE OWNER'S RULING that needs it: «по полосе сделки (глобальный дом это не локальный ретейнер) –
 *  да». A delivered shoot adds to the fame floor and the size of the addition is the size of the
 *  deal, so the fame ledger has to be able to ask a SIGNED letter which rung of the gradient wrote
 *  it – on every letter in every save, including the ones written before the gradient existed.
 *
 *  ⚠⚠ READ OFF `cashCents` RATHER THAN STORED, AND THAT IS THE POINT. The band is not a fact about
 *  the letter, it is a fact about her STANDING THE WEEK IT ARRIVED (`adBandFor` above) – and that
 *  standing is long gone by the time the shoot is folded into fame. What the letter does carry, and
 *  has carried since the portfolio shipped, is the cheque; the cheque IS the band, cell by cell, in
 *  `categories[c].feeCentsByBand`. So nothing is added to `AdOfferTerms`, no save is back-filled,
 *  and a paper signed in round 29 answers the question it was always carrying.
 *
 *  ⚠ THE STRONGEST BAND THE CHEQUE AT LEAST MATCHES, walked from the top exactly as `adBandFor`
 *  walks the ranks – so a letter written under today's table lands on its own cell EXACTLY (the
 *  ladders are strictly increasing wherever they are not null), and a legacy letter whose fee
 *  belongs to no cell lands on the strongest rung it can actually pay for rather than throwing. An
 *  unrecognised or under-scale cheque is band 0: the weakest rung, never a refusal, and never more
 *  than the paper proves.
 *
 *  ⚠⚠ ROUND 34 (03.09) BROKE THE PARENTHESIS ABOVE AND THE REPAIR IS THE `find` BELOW. The owner's
 *  approved foot of the ladder is not monotone per category – clothing pays $120,000 at ≤400 and
 *  $50,000 at ≤200, drinks pays $80,000 at both, watches pays $200,000 at both ≤200 and ≤100 –
 *  because what he approved is the BAND TOTAL and the shelf's shape, not one category's own climb.
 *  A pure walk from the top then reads a $120,000 clothing letter, written at ≤400, as a ≤100
 *  letter: it is the first cell from the top the cheque clears. So the cheque is matched EXACTLY
 *  first, and the historical walk survives only as the fallback for a legacy fee that belongs to no
 *  cell at all.
 *
 *  ⚠ AMONG EXACT MATCHES THE STRONGEST WINS, which is the shipped rule unchanged and is what keeps
 *  every letter already in a save reading as it always did: a $200,000 watches letter is the ≤100
 *  band's cell, exactly as it was before the prepend.
 *
 *  ⚠⚠ AND ONE AMBIGUITY IS LEFT STANDING RATHER THAN PAPERED OVER: a NEW ≤400 drinks letter states
 *  $80,000, which is also the ≤200 cell, so it reads back one rung high. Nothing on the paper can
 *  tell the two apart – the cheque IS the only record of the band (round 32 #5's design: «no letter
 *  needs a new field») – and the cost is bounded to one rung of `fame.shootFloorByBand`, i.e. 0.01
 *  of a fame point per delivered shoot. Closing it means storing the band on `AdOfferTerms`, which
 *  is a save-schema move and is the owner's to call.
 *
 *  ⚠ THE CAPSTONE IS THE TOP BAND AND IS NOT A CATEGORY ROW. Its money is its own constant
 *  ($10M/yr, the icon-of-icons letter) and `adFeeFor` deliberately cannot price it, so it is named
 *  here rather than falling through to 0 – which is what «глобальный дом» means if it means
 *  anything.
 *
 *  Pure: reads the terms and the catalogue, writes nothing, draws nothing. */
export function adBandOfTerms(terms: AdOfferTerms): number {
  const bands = ECONOMY.advertising.bands
  const category = adCategoryOf(terms)
  if (category === 'capstone') return bands.length - 1
  const ladder = ECONOMY.advertising.categories[category].feeCentsByBand
  // the cell this cheque IS, strongest first – the letter landing on its own rung
  for (let i = bands.length - 1; i >= 0; i--) {
    if (ladder[i] === terms.cashCents) return i
  }
  // ...and the historical fallback for a cheque that is nobody's cell: the strongest rung the paper
  // can actually pay for, never more than it proves.
  for (let i = bands.length - 1; i >= 0; i--) {
    const cell = ladder[i]
    if (cell != null && terms.cashCents >= cell) return i
  }
  return 0
}

/** THE CHEQUE ONE CATEGORY WRITES AT ONE BAND, in cents per contract year – or null where the
 *  category has not opened (`feeCentsByBand`'s own nulls, so the gate and the price are one fact).
 *  The capstone is not a category row and never reaches this: its money is its own constant. */
export function adFeeFor(category: Exclude<AdCategory, 'capstone'>, band: number): number | null {
  return ECONOMY.advertising.categories[category].feeCentsByBand[band] ?? null
}

/** ⭐ P6'S CHURN – WHICH HOUSE OF THE CATEGORY WRITES THIS LETTER. One draw off the letter's own
 *  rng, over the category's 2–4 names, with the ruling's one exclusion: AT THE TOP BAND a house
 *  does not write twice running – the previous signed deal's author steps back and a different
 *  name takes the slot («no house writes twice running at the top band», his terms-churn rule).
 *  Below the top band a repeat is allowed: a #150 re-signing the same local dealer is life.
 *
 *  Deterministic per (seed, category, week) through the caller's rng, so a replayed career gets
 *  the same author on the same Monday. */
export function pickAdHouse(
  houses: readonly string[],
  lastSignedBrand: string | null,
  topBand: boolean,
  roll: number,
): string {
  const pool = topBand && lastSignedBrand !== null && houses.length > 1
    ? houses.filter((h) => h !== lastSignedBrand)
    : houses
  return pool[Math.min(pool.length - 1, Math.floor(roll * pool.length))]
}

/** WHAT ONE CATEGORY'S LETTER SAYS AT ONE BAND – the portfolio's `kitTermsFor`, and the same
 *  snapshot rule: every field is frozen onto the offer at arrival and never re-read from `ECONOMY`
 *  again, so a deal signed under one catalogue keeps its own numbers if the catalogue is retuned.
 *
 *  ⚠ THE BRAND AND THE YEARS ARE ARGUMENTS, NOT DRAWS – this function is pure so a test or the
 *  bench can ask what a named cell offers; the dice live with the caller (`reviewAdOffer`), on the
 *  letter's own purpose-scoped stream. `brand` is required for clothing (the live kit deal's own
 *  name – the «двойной программой» ruling) and defaults to the category's first house otherwise. */
export function adTermsForCategory(
  category: Exclude<AdCategory, 'capstone'>,
  band: number,
  termYears: number,
  brand?: string,
): AdOfferTerms | null {
  const def = ECONOMY.advertising.categories[category]
  const fee = adFeeFor(category, band)
  if (fee === null) return null
  const author = brand ?? def.houses[0]
  if (!author) return null
  const years = Math.max(1, Math.min(ECONOMY.advertising.termYearsMax, Math.round(termYears)))
  return {
    category,
    brand: author,
    trade: def.trade,
    cashCents: fee,
    termYears: years,
    termWeeks: years * WEEKS_PER_YEAR,
    shootCount: ECONOMY.advertising.bands[band].shootWeeksPerYear,
  }
}

/** ⭐⭐⭐ THE CAPSTONE'S LETTER (P6, his sentence: «Федерер получал контракт с Nike на 10+
 *  миллионов») – the one kit-shaped deal on top of the shelf. Eight years, $10M a contract year,
 *  written by the kit house that already dresses her (the double programme at icon scale); the
 *  caller hands the brand in because the paper's author is the world's fact, not the catalogue's. */
export function adCapstoneTerms(brand: string): AdOfferTerms {
  const c = ECONOMY.advertising.capstone
  return {
    category: 'capstone',
    brand,
    trade: 'We make her kit',
    cashCents: c.cashCents,
    termYears: c.termYears,
    termWeeks: c.termYears * WEEKS_PER_YEAR,
    shootCount: c.shootWeeksPerYear,
  }
}

/** WHETHER A CAMPAIGN WRITES THIS WEEK - the one random thing about the deal, the same shape as the
 *  kit ladder's `shopWritesAt` and deliberately NOT the same stream: `seed:ad:<week>` is its own
 *  purpose scope, so the kit roll and this one can never read each other's dice.
 *
 *  ⚠ SINCE THE PORTFOLIO THE SCOPE IS PER CATEGORY (`seed:ad:<category>:<week>`): each open
 *  category rolls its own arrival dice, so seven categories can notice her independently and none
 *  can read another's draw. The old category-less spelling is exactly the historical stream the
 *  pre-portfolio letters rolled on; nothing rolls it any more, and keeping the parameter optional
 *  keeps every recorded derivation readable. */
export function adWritesAt(seed: string, week: number, chance: number, category?: AdCategory): boolean {
  const rng = rngFromSeed(category ? `${seed}:ad:${category}:${week}` : `${seed}:ad:${week}`)
  return rng() < chance
}

/** THE LETTER'S OWN DICE, past the arrival roll: which house writes and for how many years, one
 *  stream per (category, week) so a replayed career gets the same author and the same term on the
 *  same Monday. Split from `adWritesAt`'s roll by a scope suffix rather than by draw order, so
 *  adding a draw to one side can never shift the other. */
export function adLetterRng(seed: string, week: number, category: AdCategory): () => number {
  return rngFromSeed(`${seed}:ad:${category}:${week}:letter`)
}

/** ⭐⭐ THE SHOOT WEEKS, CHOSEN BY THE SIGNATURE (the-face-and-the-court.md §4a, step 2 – the
 *  owner's own design: «наверное в зависимости от всяких съемок и прочего может меняться
 *  восстанавливающий эффект недели»). NO second calendar, no blocking, no conflicts: these are
 *  ordinary weeks of her season that will simply recover like travel weeks rather than rest weeks
 *  (`accrueCondition` reads them through `adShootWeek`), so the whole choice is WHICH weeks the
 *  letter names.
 *
 *  THE CONSTRUCTION, and each clause is a promise the letter makes:
 *   - `count` of them (Quiet Hour's paper says 2 – `AdOfferTerms.shootCount`, frozen at arrival);
 *   - IN-SEASON by construction – the off-season weeks are filtered out of every pool, because a
 *     cost paid in the off-season is free money wearing a cost's clothes (plan §5.2, owner-ruled);
 *   - SPACED APART – one draw per equal slice of the term, so two shoots cannot bunch into one
 *     fortnight, and a hard non-adjacency filter besides (a campaign is not a tour);
 *   - no earlier than `leadWeeks` after the signature, so the player reads the named weeks with
 *     time to plan around them rather than inside one of them.
 *
 *  RNG: `count` draws on `${seed}:ad:shoots:<signWeek>` – the ad post's own purpose scope (the
 *  allowlist in tests/offers.test.ts names `seed:ad:` deliberately), keyed on the SIGNING week so a
 *  replayed signature names the same weeks. ZERO draws on MAIN: a player action may draw on a
 *  purpose-scoped stream at the moment of the action (the arrival roll's own discipline), and the
 *  frozen capture (41550 / e6b0c709) cannot see it.
 *
 *  A degenerate term (shorter than its slices can hold) yields FEWER weeks rather than a bunched
 *  one – the promises above outrank the count.
 *
 *  ⚠⚠ ROUND 29 PART FOUR P9 REWROTE THE POOLS AND THE HISTORY HAS TO BE SAID OUT LOUD: the clause
 *  «IN-SEASON by construction – the off-season weeks are filtered out of every pool» was §5.2's
 *  rule («an off-season cost is free money wearing a cost's clothes») and the owner overturned it –
 *  the winter is now the shoot season (`isWinterShootWeek`, his six empty weeks), so the choice
 *  PREFERS it: each contract year fills its winter weeks first, adjacency allowed there because a
 *  real shoot season is back-to-back working weeks («слишком много съёмок и никакого отпуска» is
 *  the model, not a colour note), and only the overflow spills in-season, where the old promises –
 *  sliced apart, never adjacent – hold exactly as they did. The cost moved with the rule: an
 *  in-season shoot still recovers like a trip and still clashes with tournaments (round-29 #3); a
 *  winter shoot forfeits the empty week's own rest (`accrueCondition` pays the travel figure where
 *  the free week would have paid base + slider), which is the displaced vacation P9 prices it as.
 *
 *  ⚠ `count` IS PER CONTRACT YEAR since the multi-year terms (P6's 1–3yr churn): a 2-year deal at
 *  2 a year names 4 weeks, each year preferring its own winter, so a long deal cannot dump every
 *  shoot into its first December. On the 52-week letters every save already holds, per-year and
 *  per-term were the same number and nothing about them changes. */
export function chooseShootWeeks(
  seed: string,
  signWeek: number,
  termWeeks: number,
  count: number,
  leadWeeks: number,
): number[] {
  const rng = rngFromSeed(`${seed}:ad:shoots:${signWeek}`)
  const until = signWeek + Math.max(1, termWeeks) - 1
  const from = Math.min(signWeek + Math.max(0, leadWeeks), until)
  const years = Math.max(1, Math.ceil(Math.max(1, termWeeks) / WEEKS_PER_YEAR))
  const weeks: number[] = []
  for (let y = 0; y < years; y++) {
    const yLo = Math.max(from, signWeek + y * WEEKS_PER_YEAR)
    const yHi = Math.min(until, signWeek + (y + 1) * WEEKS_PER_YEAR - 1)
    if (yLo > yHi) continue
    let need = Math.max(0, count)
    // THE WINTER FIRST (P9): every eligible winter week of this contract year, drawn without an
    // adjacency filter – the shoot season stacks, that is what makes it a season.
    const winter: number[] = []
    for (let w = yLo; w <= yHi; w++) if (isWinterShootWeek(w) && !weeks.includes(w)) winter.push(w)
    while (need > 0 && winter.length > 0) {
      const at = Math.floor(rng() * winter.length)
      weeks.push(winter.splice(at, 1)[0])
      need--
    }
    if (need <= 0) continue
    // THE SPILL, under the pre-P9 promises: one draw per equal slice of the year, spaced apart.
    const slice = Math.max(1, Math.floor((yHi - yLo + 1) / need))
    for (let i = 0; i < need; i++) {
      const lo = yLo + i * slice
      const hi = i === need - 1 ? yHi : Math.min(yHi, lo + slice - 1)
      const pool: number[] = []
      for (let w = lo; w <= hi; w++) {
        if (isWinterShootWeek(w)) continue // the winter already had its chance at these
        if (weeks.some((s) => Math.abs(s - w) <= 1)) continue
        pool.push(w)
      }
      if (pool.length === 0) continue
      weeks.push(pool[Math.floor(rng() * pool.length)])
    }
  }
  return weeks.sort((a, b) => a - b)
}

/** IS THIS WEEK A SHOOT WEEK OF THE DEAL IN FORCE? The one question the condition accumulator asks
 *  (`accrueCondition` gives a yes the travel week's recovery instead of the rest week's), answered
 *  off the signed paper's own named weeks and nothing else – no re-derivation, so the recovery the
 *  engine charges and the weeks the letter names can never disagree. Pure read, zero draws.
 *
 *  ⚠ THE COLLEGE FREEZE IS NOT CHECKED HERE, deliberately – this file owns the paper, the world
 *  owns the freeze. The caller that charges recovery guards the freeze itself (see
 *  `accrueCondition`): a shoot week the freeze swallows lapses silently, no penalty, no makeup. */
export function adShootWeek(offers: Offer[], week: number): boolean {
  return adDealShootingAt(offers, week) !== null
}

/** THE DEAL THAT NAMED THIS WEEK A SHOOT WEEK, or null – the paper the clash machinery writes to.
 *  With a portfolio several deals run at once and two MAY even name the same week (brands do not
 *  coordinate calendars); the first by inbox order answers for the week, and resolving its shoot
 *  simply lets the predicate find the next one, so every campaign's collision gets its own
 *  question. Pure read, zero draws. */
export function adDealShootingAt(offers: Offer[], week: number): Offer | null {
  return (
    activeAdDeals(offers, week).find((o) => ((o.terms as AdOfferTerms).shootWeeks ?? []).includes(week)) ?? null
  )
}

/** EVERY ADVERTISING DEAL IN FORCE THIS WEEK – the portfolio itself. Same contract per deal as
 *  `activeKitDeal`: honoured from `fromWeek` to `untilWeek` and not a week further, off each
 *  offer's own frozen terms. */
export function activeAdDeals(offers: Offer[], week: number): Offer[] {
  return offers.filter(
    (o) =>
      o.kind === 'ad' &&
      o.state === 'signed' &&
      week <= (o.untilWeek ?? -1) &&
      week >= (o.fromWeek ?? o.decidedWeek ?? 0),
  )
}

/** THE DEAL HOLDING ONE CATEGORY, or null – `activeAdDeals` asked the portfolio's own question. */
export function activeAdDealIn(offers: Offer[], category: AdCategory, week: number): Offer | null {
  return activeAdDeals(offers, week).find((o) => adCategoryOf(o.terms as AdOfferTerms) === category) ?? null
}

/** ONE DEAL PER CATEGORY – is THIS category's slot shut against a new letter this week? Two ways it
 *  can be: a letter for the category still on the table (live: open AND inside its window), or a
 *  signed term in the category still running. An expired or refused letter shuts nothing – the next
 *  house may notice her whenever its own week's dice say so – and neither does the KIT ladder: an
 *  endorsement and a kit deal are different papers and deliberately never read each other.
 *
 *  ⚠⚠ RE-AIMED, NOT DELETED (round 29 part four P6): this predicate WAS the plan's §4.1 «one
 *  advertising deal at a time», whole-post – ask it with no category and every category answered.
 *  His ruling «Таких контрактов может быть несколько» replaced one-at-a-time with a PORTFOLIO of
 *  categories, so the guard now takes the category and shuts exactly one slot: the exclusivity a
 *  letter states is «in no other <trade> campaign while that runs», which is how the real shelf
 *  works (§7 – no portfolio read for the research holds two brands of one trade at once). */
export function adSpokenFor(offers: Offer[], week: number, category: AdCategory): boolean {
  return offers.some(
    (o) =>
      o.kind === 'ad' &&
      adCategoryOf(o.terms as AdOfferTerms) === category &&
      (isOfferLive(o, week) || (o.state === 'signed' && week <= (o.untilWeek ?? -1))),
  )
}

/** THE MOST RECENT SIGNED AUTHOR OF A CATEGORY, or null – the fact `pickAdHouse`'s top-band churn
 *  excludes. Read off the paper trail (offers are never pruned), latest signature first. */
export function lastSignedAdBrand(offers: Offer[], category: AdCategory): string | null {
  let best: Offer | null = null
  for (const o of offers) {
    if (o.kind !== 'ad' || o.state !== 'signed') continue
    if (adCategoryOf(o.terms as AdOfferTerms) !== category) continue
    if (best === null || (o.decidedWeek ?? o.week) > (best.decidedWeek ?? best.week)) best = o
  }
  return best ? (best.terms as AdOfferTerms).brand : null
}

/** THE HOUSE WRITES. An `open` letter with a real deadline – refusable and expirable like the kit
 *  proposals, unlike the desks' notices – raised by `reviewAdOffer` once its gate and its dice have
 *  both said yes. Idempotent on its id, like every other `raise*` in this file, and NOTHING is
 *  drawn here: the one roll this deal ever takes happened in `adWritesAt` before the caller called. */
export function raiseAdOffer(offers: Offer[], week: number, terms: AdOfferTerms, deadlineWeek: number): Offer {
  // The id carries the category since the portfolio (P6): several categories may write in one week
  // and each letter needs its own identity. A letter without a category on its terms is the
  // historical single-post letter and keeps the historical id.
  const id = adOfferId(week, terms.category)
  const existing = offers.find((o) => o.id === id)
  if (existing) return existing
  const offer: Offer = {
    id,
    kind: 'ad',
    week,
    deadlineWeek,
    // The snapshot rule: frozen at arrival, never re-read from ECONOMY afterwards.
    terms: { ...terms },
    state: 'open',
  }
  offers.push(offer)
  return offer
}
