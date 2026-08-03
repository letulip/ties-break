// THE MONEY FROM OUTSIDE THE FAMILY: sponsors, the offers they make, and what a trip costs once
// somebody else is helping pay for it.
//
// One module because they are one question asked twice a year – who is willing to back her, and how
// much of the bill does that actually take off the table. `travelCostFor` lives here rather than with
// the calendar because the number a surface prints is the number AFTER an academy's cover, and the
// cover is a sponsorship by another name.
//
// ⚠ DEPENDENCY DIRECTION. `WorldState` is a TYPE-ONLY import (erased at compile time), so world.ts
// imports these values with no runtime cycle. Everything else comes from leaves.
//
// ⚠ RNG: the sponsor review draws on a PURPOSE-SCOPED sub-stream, never MAIN.
import { ECONOMY } from '../economy'
import { TIERS, WEEKS_PER_YEAR } from '../season/calendar'
import { netTravelCents, travelCoverShare } from '../academy'
import { activeKitDeal, dealUnderReview, endDealWithSeason, kitTravelShare, raiseKitEndLetter, raiseKitOffer, refuseOffer as refuseOfferIn, seasonLastWeek, signOffer as signOfferIn, standingClears } from '../offers'
import type { SeasonEvent } from '../season/types'
import { LADDER_LABEL, type KitEndReason, type KitOfferTerms, type Offer } from '../../shared/protocol'
import { addEvent } from './ledger'
import { kidPoints } from './ladder'
import type { WorldState } from '../world'

// --- the sponsors decide, in the off-season -----------------------------------
// Who is willing to put this girl in their kit next year, and on what terms. Three rungs since
// 01.08 (feat/brand-ladder) – the full argument for every number is on ECONOMY.sponsorship, the
// argument for the SHAPE is `SponsorTier`, and the mechanism is engine/offers.ts.
//
// ⚠ SINCE 31.07 IT ARRIVES AS A LETTER RATHER THAN AS WEATHER. This function used to do
// `world.fundsCents += amount` and drop a line in the feed; the player was never asked. It now RAISES
// AN OFFER (docs/specs/offers-and-the-inbox.md §4.1), which the parent signs or refuses inside a
// four-week window, and signing pays in KIT rather than in money. The old cheque is gone entirely:
// «кит вместо денег».
//
// ⚠ AND SINCE 01.08 IT IS A LADDER RATHER THAN A SINGLE SHOP. The owner finished a season #1
// national and #13 international and asked whether two contracts would arrive; they did not, because
// the terms function read the DOMESTIC table and nothing else. A girl who is thirteenth in the world
// is interesting to very different people than a shop in her town. So `local` keeps the domestic
// gate it always had and two rungs above it read the INTERNATIONAL one, and what steps up is WHICH
// OF HER LINES the brand covers – strings, then frames, then everything and a hand with the travel.
//
// ⚠ AND IT HAPPENS IN THE OFF-SEASON, NOT ON WEEK ONE (01.08; owner: «мне кажется было бы логичным
// их как раз к старту сезона привязывать… Что в реальности происходит в этом плане?»). In the real
// sport sponsorship is negotiated in November and December so that the deal is signed and effective
// when the season opens in January – you go out already kitted. The letter used to land on the first
// week of the new year and its four-week window ran through the first tournaments, which is the worst
// possible moment to be weighing a contract; the quiet weeks are where a decision like this belongs.
// The RANK IT READS DID NOT MOVE: her competitive year is over before the off-season starts (the
// calendar puts nothing in weeks 49-51), so reading the table three weeks earlier reads the same
// table. `isSponsorReviewWeek` is what keeps it firing exactly once a season now that the window it
// fires in is three weeks wide rather than one.
//
// ⚠ AND A BRAND ONLY STAYS IF SHE HELD UP HER END. Two conditions, judged in this same off-season:
//   * SHE PLAYED. A sponsor pays to be SEEN, and a season inside the deal that did not reach
//     `minEventsPerSeason` entries ends the relationship (spec §4.1). This is the design's best trap
//     and it gets worse as the deal gets better – the coach's whole job is load management, and a
//     bigger contract is a bigger standing bribe to do the thing the bench says loses.
//   * AND, FOR THE NATIONAL RUNG, SHE IS STILL SOMEBODY AT HOME. `keepDomesticRank` is the one term
//     that gives the domestic ladder a job on the way OUT: her domestic points are a rolling 52-week
//     best-6, so a season spent entirely abroad decays them to nothing and she slides out of the
//     band. Stop playing National, slide down the table, lose the letter.
// Nothing is clawed back in either case – a junior kit deal is not a loan – the contract simply ends
// with the season it failed and the brand does not write this winter.
//
// RNG DISCIPLINE. Reads two cached numbers, counts entries off a persisted ledger, and takes at most
// ONE draw – on `seed:offer:<week>`, its own purpose-scoped sub-stream, created and discarded inside
// `raiseKitOffer`. ZERO draws on the main weekly stream, so the frozen MAIN capture (41550 draws /
// e6b0c709) cannot move by one. It runs in the same zero-draw region at the top of the tick that the
// season-boundary block occupies, and on the same reading of her year: the rank she carries out of
// the season just played, before the next one can touch it.

/** What the local shop's deal is worth this season, in cents – 0 if she is not on their radar.
 *  Pure, so the tests and the bench can ask directly. `nationalRank` is her place in the DOMESTIC
 *  table (`world.kidRankDomestic`), never the ITF one.
 *
 *  ⚠ IT IS AN ALLOWANCE NOW, NOT A CHEQUE. The number is unchanged and the gate is unchanged; what
 *  changed is that it is the ceiling on what the shop SPENDS on her kit rather than what it hands
 *  over. See ECONOMY.sponsorship, and `KitOfferTerms.kitAllowanceCents` for where a signed deal
 *  freezes it. */
export function localSponsorCents(nationalRank: number): number {
  const s = ECONOMY.sponsorship
  if (nationalRank <= s.topMaxRank) return s.topSeasonCents
  if (nationalRank <= s.maxRank) return s.seasonCents
  return 0
}

/** How many tournaments she entered in the season that is finishing at `reviewWeek` – the count a kit
 *  deal's obligation is judged on, and it is the count the season really played (spec §5: "nothing
 *  may be offered that cannot be honoured"). Read off `world.results` plus the entry ledger would
 *  double-count a withdrawal, so it reads the one record that is written per entry and never
 *  rewritten: the tournament events her season produced.
 *
 *  ⚠ THE 52-WEEK WINDOW STILL LANDS ON EXACTLY ONE SEASON now that the review moved into the
 *  off-season, and that is worth stating because it looks as though it should not. The window is
 *  `[reviewWeek - 52, reviewWeek)`, which from the first off-season week reaches back over this
 *  season's whole competitive block AND the previous season's three off-season weeks – and those are
 *  event-free by construction (`isOffSeasonWeek`; the calendar schedules nothing in them). So the
 *  count is this season's tournaments and no other's. */
export function eventsPlayedInSeason(world: WorldState, reviewWeek: number): number {
  const from = reviewWeek - WEEKS_PER_YEAR
  return world.events.filter((e) => e.type === 'tournament' && e.week >= from && e.week < reviewWeek).length
}

// ⚠ THE WHOLE INBOX GETS THE SAME FEED BUDGET THE CHEQUE HAD: AT MOST ONE ROW PER SEASON BOUNDARY.
// This looks like a writing preference and is a MEASURED constraint, so it is worth stating before
// anyone adds a second `addEvent` to this file.
//
// `pruneEvents` trims to EVENTS_CAP = 400 by COUNT, oldest-first. So every non-match row a feature
// adds permanently displaces a MATCH from the retained window - and `axisEvidence` measures the
// radar's rate over exactly the matches that window still holds. Measured on the radar bench's own
// careers (radar-mono-elite, 150 weeks): adding ONE extra row a season - an "offer expired" line -
// pushed the worst weekly re-widening of the fog from 0.36 to 0.64 points, straight through the 0.5
// bound tests/radar.test.ts guards, without anything about the radar itself changing. The evidence
// base got thinner, which is exactly what that test is for.
//
// So this function says everything the sponsor has to say in ONE line: what last season's deal was
// worth, and whether they are writing again. Signing, refusing and expiring write NOTHING here - the
// player took those actions himself (behind a confirm, in the case of the one that matters), and the
// inbox holds all three states for the life of the career, which the feed could never do anyway.
export function reviewSponsors(world: WorldState): void {
  // Both cached ranks, with the same fallback rankIn uses: a career that has never held a point in a
  // table sits below the whole field rather than at the top of an empty one. `itfRanked` is the
  // guard that stops an empty table reading as a standing at all - see `SponsorStanding`.
  const nationalRank = world.kidRankDomestic ?? world.cohort.length + 1
  const standing = {
    nationalRank,
    itfRank: world.kidRank,
    itfRanked: kidPoints(world, 'itf') > 0,
    // The third table, on the same terms as the other two (02.08). `wtaRanked` uses the LIVE
    // window rather than the never-pruned mark on purpose: a sponsor asks what she is worth NOW,
    // and a professional who has not scored in a year is not holding a professional standing.
    wtaRank: world.kidRankWta ?? world.cohort.length + 1,
    wtaRanked: kidPoints(world, 'wta') > 0,
  }

  // 1. THE SEASON NOW FINISHING, IF IT WAS UNDER A DEAL. What the brand actually spent is the one
  //    number that says what signing was worth - the same job `AcademySupport.coveredCents` does -
  //    and the two conditions below are what decide whether it stays.
  const deal = dealUnderReview(world.offers, world.week)
  const dealTerms = deal ? (deal.terms as KitOfferTerms) : null
  const played = deal ? eventsPlayedInSeason(world, world.week) : 0
  // ⚠ FAILING EITHER CONDITION COSTS THE DEAL, NOT THE FAMILY'S SAVINGS (spec §4.1). Nothing is
  //   clawed back - a junior kit deal is not a loan, and NOT ONE LINE BELOW TOUCHES
  //   `world.fundsCents`. The contract ends with the season it failed and the brand is free to write
  //   again the year after, because the penalty is a missed season and not a blacklist. This is the
  //   promise the LETTER makes in the brand's own words, and the two have to agree.
  const playedEnough = !dealTerms || played >= dealTerms.minEventsPerSeason
  // ...and the second one is the national rung's own, and the reason the domestic ladder still
  // matters to a girl who has left it behind. `keepDomesticRank` is absent on every other rung, so
  // this reads true for them without a tier check.
  //
  // ⚠ OR THE RUNG'S OWN STANDING, IN WHICHEVER TABLE SHE IS IN (02.08, the owner: «спонсор вполне
  // может жить и дальше»). The domestic clause was written when going abroad meant going abroad as
  // a JUNIOR; a professional is not less visible than the girl they signed. `standingClears` is the
  // one place that question is answered - the same predicate that decides who WRITES to her - so a
  // deal can never be killed by a rule that would have offered it back the same winter.
  const keptAtHome =
    !dealTerms?.keepDomesticRank ||
    nationalRank <= dealTerms.keepDomesticRank ||
    standingClears(standing, dealTerms.tier)
  const heldUp = playedEnough && keptAtHome
  // ...and the verdict is recorded ON the letter, so the inbox can still answer "what happened to
  // that deal?" a decade later. The count is the one the season really played (spec §5).
  if (deal) deal.eventsPlayed = played
  // A deal that failed does not limp to its contractual end: it stops with the season it failed.
  // A deal that held up simply runs on - a two-season contract has another year to go.
  if (deal && !heldUp) endDealWithSeason(deal, world.week)

  // ⚠ ...AND THE BRAND SAYS SO IN WRITING (owner, 04.08: «I believe we need to send an email with
  // the termination message»). The status line on the signed letter was already right and already
  // unread; the first thing the player actually noticed was gear bills he thought the brand was
  // paying. So a NEW letter lands in the inbox - which is the surface that knocks - for BOTH ways a
  // deal can end: the terms it failed, and a term served in full. `untilWeek` is now final either
  // way, so "does it cover next season" is the one question asked here.
  if (deal && dealTerms && (deal.untilWeek ?? -1) <= seasonLastWeek(world.week)) {
    const reason: KitEndReason = !playedEnough ? 'events' : !keptAtHome ? 'standing' : 'term'
    raiseKitEndLetter(world.offers, world.week, deal, reason, played)
  }

  // 2. AND WHETHER ANYBODY WRITES. ⚠ ONE BRAND AT A TIME is enforced inside `raiseKitOffer`, which
  //    refuses while a deal is running or a letter is unanswered - so a multi-season contract that
  //    is only halfway through turns the next rung away by itself and there is no second rule here
  //    to keep in step with it. What this line adds is the ONE case the offers module cannot see: a
  //    brand that was let down this season does not turn round and write a fresh letter in the same
  //    winter, even though its own contract has just been ended.
  const offer = heldUp
    ? raiseKitOffer({ offers: world.offers, seed: world.seed, week: world.week, standing })
    : null

  // 3. ONE LINE, CARRYING WHICHEVER OF THOSE ACTUALLY HAPPENED. It names the TABLE the letter was
  //    gated on, because the whole point of the 30.07 fix was that the player could not tell which
  //    ladder any gate was reading - and the brand ladder makes that question sharper rather than
  //    softer, since the rungs read different tables on purpose. And it names the INBOX, because a
  //    letter nobody opens is worse than the cheque it replaced.
  const parts: string[] = []
  if (deal && dealTerms) {
    // ⚠ WHAT THE SEASON OF KIT WAS WORTH IS REPORTED EITHER WAY, and the failure case is the one
    //   that needs it most: a deal that ends is precisely the moment the player should be able to
    //   see what he just lost. Reporting the value only on a renewal would make the number a reward
    //   for having done well, which is the opposite of what it is for.
    const worth = `$${Math.round((deal.coveredCents ?? 0) / 100).toLocaleString('en-US')}`
    const running = (deal.untilWeek ?? 0) > seasonLastWeek(world.week)
    parts.push(
      !playedEnough
        ? `${dealTerms.brand} kitted her out all season – ${worth} of kit – but they asked for ${dealTerms.minEventsPerSeason} events and she played ${played}, so they are done.`
        : !keptAtHome
          ? `${dealTerms.brand} kitted her out all season – ${worth} of kit – but they back a girl inside the ${LADDER_LABEL.domestic} top ${dealTerms.keepDomesticRank} and she is #${nationalRank}, so they are done.`
          : running
            ? `${dealTerms.brand} kitted her out all season – ${worth} of kit, ${played} events played. They have another year to run.`
            : `${dealTerms.brand} kitted her out all season – ${worth} of kit, ${played} events played.`,
    )
  }
  if (offer) {
    const terms = offer.terms as KitOfferTerms
    // WHICH TABLE EARNED IT, named, because the three rungs deliberately read two different ones and
    // "why is this brand writing to me" is exactly the question a player should be able to answer.
    const gate =
      terms.tier === 'local'
        ? `${LADDER_LABEL.domestic} #${nationalRank}`
        : `${LADDER_LABEL.itf} #${world.kidRank}`
    parts.push(`A letter from ${terms.brand} – they want to put her in their kit (${gate}). It is in the inbox.`)
  }
  if (parts.length === 0) return
  addEvent(world, { week: world.week, type: 'info', text: parts.join(' ') })
}

/** THE PARENT SIGNS. Returns the signed offer, or throws with the engine's own reason – past the
 *  deadline, already answered, or no such letter. Irreversible: there is no unsign, on purpose.
 *
 *  Writes NOTHING in the feed, on the budget stated above `reviewLocalSponsor`: he did this himself,
 *  behind a confirm that restated the deal, and the letter carries "Signed" in the inbox for the rest
 *  of the career - which is longer than any feed row survives. */
export function acceptOffer(world: WorldState, offerId: string): Offer {
  const signed = signOfferIn(world.offers, offerId, world.week)
  if (!signed) throw new Error(offerAnswerErrorFor(world, offerId))
  return signed
}

/** THE PARENT REFUSES. Terminal in the same way signing is: a "no" he could take back would make the
 *  deadline a formality on the other side of the decision. Same feed budget, same reason. */
export function declineOffer(world: WorldState, offerId: string): Offer {
  const refused = refuseOfferIn(world.offers, offerId, world.week)
  if (!refused) throw new Error(offerAnswerErrorFor(world, offerId))
  return refused
}

export function offerAnswerErrorFor(world: WorldState, offerId: string): string {
  const offer = world.offers.find((o) => o.id === offerId)
  if (!offer) return 'That letter is not in the inbox.'
  if (offer.state === 'signed') return 'That deal is already signed.'
  return 'That offer has already gone.'
}

/** WHAT THE TRIP COSTS THE FAMILY – the scholarship applied to the calendar's full fare.
 *
 *  THE ONE definition, and it has to be: the charge (chargeTravel), the refund (skipEvent) and the
 *  price the planner quotes (the snapshot's UpcomingEvent) all read this. If any of them computed
 *  its own number the discount would be arbitrageable – enter at the covered price, withdraw at the
 *  full refund, bank the difference, repeat for every J30 on the calendar.
 *
 *  ⚠ AND SINCE THE BRAND LADDER IT CARRIES A SECOND HAND (01.08). The top rung of the sponsorship
 *  ladder pays a share of the fare - `junior-economics.md`: "travel sponsorship only after
 *  national/international wins" - and it arrives HERE, in the one definition, for exactly the reason
 *  the paragraph above gives. A sponsor discount computed at the till and not at the refund would be
 *  free money in four keystrokes.
 *
 *  The two covers COMPOSE rather than add: the brand takes its share of what the family still owes
 *  after the academy has taken its own, so a girl carrying both is never handed more than the fare.
 *  A scholarship at 80% plus a brand at 25% is 85% of a trip covered, not 105%. */
export function travelCostFor(world: WorldState, event: SeasonEvent): number {
  const afterAcademy = netTravelCents(event.travelCostCents, world.academy)
  const share = kitTravelShare(world.offers, world.week)
  if (share <= 0) return afterAcademy
  return afterAcademy - Math.round(afterAcademy * share)
}

/** What the ACADEMY alone took off this fare - its own tally must never be credited with the brand's
 *  share, or a season of sponsored travel would inflate the scholarship's reported value. */
export function academyCoverOf(world: WorldState, event: SeasonEvent): number {
  return event.travelCostCents - netTravelCents(event.travelCostCents, world.academy)
}

export function chargeTravel(world: WorldState, event: SeasonEvent): void {
  const net = travelCostFor(world, event)
  const covered = event.travelCostCents - net
  const byAcademy = academyCoverOf(world, event)
  world.fundsCents -= net
  if (world.academy && byAcademy > 0) world.academy.coveredCents += byAcademy
  // WHO PAID FOR IT, on the line itself. Two payers can reduce the same fare and the family should
  // be able to tell which one did - a cost that quietly shrinks is the dishonesty this text exists
  // to prevent, and "quietly shrank by a different amount than last month" is the same fault twice.
  const brandShare = kitTravelShare(world.offers, world.week)
  const deal = brandShare > 0 ? activeKitDeal(world.offers, world.week) : null
  const payer = deal
    ? world.academy
      ? `academy ${Math.round(travelCoverShare(world.academy) * 100)}% + ${(deal.terms as KitOfferTerms).brand} ${Math.round(brandShare * 100)}%`
      : `${(deal.terms as KitOfferTerms).brand} covers ${Math.round(brandShare * 100)}%`
    : `academy covers ${Math.round(travelCoverShare(world.academy) * 100)}%`
  addEvent(world, {
    week: world.week,
    type: 'expense',
    category: 'travel',
    // The sponsor valve's wording, for the same reason: the line is still emitted at its reduced
    // amount so the Money breakdown shows the relationship instead of the cost quietly shrinking.
    text: covered > 0 ? `Travel to ${TIERS[event.tier].label} – ${payer}` : `Travel to ${TIERS[event.tier].label}`,
    amountCents: -net,
  })
}
