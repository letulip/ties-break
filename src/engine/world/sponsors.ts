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
import { TIERS, TIER_LADDER, WEEKS_PER_YEAR } from '../season/calendar'
import { netTravelCents, travelCoverShare } from '../academy'
// The rung ladder, for the cameo's coach cut. coach.ts is a leaf (it imports ECONOMY and rng and
// nothing else), so this runs one way exactly as every other import in this file does.
import { COACH_TIERS } from '../coach'
import { activeKitDeal, contractEndWeek, dealEndingWithSeason, dealUnderReview, endDealWithSeason, isSponsorWindowCloseWeek, isSponsorWindowWeek, kitTravelShare, letDownThisWindow, raiseKitEndLetter, raiseKitOffers, raiseKitRenewal, refuseOffer as refuseOfferIn, signOffer as signOfferIn, sponsorWindowOpensAt, standingClears, type SponsorStanding } from '../offers'
import type { SeasonEvent, TierId } from '../season/types'
import { LADDER_LABEL, type CoachTier, type KitEndReason, type KitOfferTerms, type Offer } from '../../shared/protocol'
import { addEvent } from './ledger'
import { kidPoints, tableSize } from './ladder'
import { KID_ID } from './constants'
import type { WorldState } from '../world'
import { guardNotEnded } from './endings'

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
// `raiseKitOffers`. ZERO draws on the main weekly stream, so the frozen MAIN capture (41550 draws /
// e6b0c709) cannot move by one. It runs in the same zero-draw region at the top of the tick that the
// season-boundary block occupies, and on the same reading of her year: the rank she carries out of
// the season just played, before the next one can touch it.

/**
 * THE KIT ALLOWANCE STARTS AGAIN AT THE SEASON BOUNDARY (owner, 08.08) - because the letter has
 * always said «up to {allowance} of kit OVER THE SEASON», and until this wave it was over the TERM.
 *
 * `signOffer` sets `coveredCents` to 0 once, at signature; `resolveGear` and now `setKitGrade` only
 * ever add to it. So a one-season rung was correct by accident and every multi-season rung - the
 * national deal runs two, the global three - quietly gave the brand one pot to cover the whole
 * contract. A parent reading the paper had no way to know his second season came with nothing.
 *
 * ⚠ THE CALLER IS `tickWeek`'s SEASON-BOUNDARY BLOCK, and that placement is what makes this
 * idempotent without a persisted `coveredSeasonIndex`: a week happens exactly once, so a reset hung
 * on `week % WEEKS_PER_YEAR === 0` fires exactly once per season by construction. No schema bump, no
 * migration, no golden fixture - which is the whole reason it is written as a week-triggered reset
 * rather than as a lazy "is this a new season" check inside the till.
 *
 * ⚠ IT RESETS THE ACTIVE DEAL ONLY. An expired contract keeps whatever it spent, because that number
 * is read after the fact by the season wrap ("$X of kit") and by the trophy-cabinet ledger; zeroing
 * a finished deal would erase the record of what signing it was worth. Pure state, zero draws.
 */
export function rolloverKitAllowance(world: WorldState): void {
  const deal = activeKitDeal(world.offers ?? [], world.week)
  if (!deal) return
  deal.coveredCents = 0
}

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

// =================================================================================================
// THE WEEKLY CAMEO'S GATE – NEED, NOT BACKGROUND (10.08)
// =================================================================================================
//
// ⚠ THE INTENT WAS ALWAYS NEED AND THE IMPLEMENTATION WAS A PROXY FOR IT. `docs/rounds/round-7.md`,
// 24.07, records the original design in one line: «спонсор нужде-ориентирован (платит только
// working)». Background was taken as a stand-in for need because at the time the two coincided. They
// have come apart, and `docs/specs/round15-triage.md` measured how far: the cameo was worth a median
// $12,866 over four seasons – 22.6% of a working family's parent income, fired for 50/50 careers –
// against $0 and 0/50 for `middle`, with no cause, no relationship and no player agency. It paid the
// owner's own career in week 2, before a ball was struck.
//
// The owner, 10.08: «порог по деньгам на счету, а не по строчке в анкете – всё именно так, и с самого
// начала так и затевалось». So the gate reads the BALANCE.
//
// ⚠ AND IT IS A RUNWAY, NOT A DOLLAR FIGURE, for the reason `ECONOMY.sponsorship` already argues at
// length about the valve it replaced: a flat threshold is not the same test in two families. The
// weekly bill runs through the coach rung, the court that follows it and the wealth corridor, so
// $3,000 is most of a season to one family and a fortnight to another. "Fewer than N weeks of the
// bill" is the same test everywhere, and it is background-blind by construction.
//
// ⚠ THE DENOMINATOR IS THE COURT AND NOT THE WHOLE BILL, and that is the anti-exploit half. The
// owner named the hazard himself: «порог по нужде награждает трату – найми элиту, приблизишься к
// благотворительности». Measured against the TOTAL bill it is real and large – tools/runway-probe.ts,
// 50 seeds x 4 seasons, the same 2x2 tools/two-cells.ts runs – because hiring up shrinks the runway
// twice over: it drains the balance AND inflates the unit the balance is measured in. Against the
// COURT (`weeklyBillSplit().facilityCents`, the half she cannot get out of – you cannot train without
// booking one, and it is charged at every rung including `self`) only the first of those two survives,
// and the first one is not an exploit: hiring an expensive coach genuinely makes a family poorer, and
// a gate that did not notice would not be a need gate at all. The split that separates the man from
// the court was built in the split-the-bill wave for a different reason; this is the second thing it
// turns out to be for.
//
// ⚠ AND ABOVE `maxCoachTier` NOBODY WRITES AT ALL, which is the owner's own rule and is a STORY rule
// before it is an anti-exploit one: «у нас есть маркер трат в неделю, если тренер стоит дороже, то
// нечего и помогать». A shop backs the girl whose family is doing this on a shoestring, not the one
// that has hired the best coach in the city. Both of his own careers – 8k self-coached, 25k middle –
// stay inside it.
//
// ⚠ IT CUTS ON THE RUNG AND NOT ON THE WEEKLY DOLLARS, and the difference matters here more than
// anywhere else in the file. The wealth corridor prices the SAME rung differently by background
// (`coachCorridorFactor`: ~0.7-0.8x working against 1.2-1.3x wealthy), so a dollar cut would refuse a
// wealthy family's `middle` coach while allowing a working family's – background sneaking back in
// through the side door, in the exact mechanic this wave exists to take it out of. THE RUNG IS THE
// CHOICE; THE PRICE IS THE MARKET. Cut on the choice.
//
// ⚠ THE TWO RULES DO NOT DOUBLE-COUNT, checked rather than assumed. The court denominator flattens the
// GRADIENT below the cut (`courtTierFactor` is 1.0 / 1.0 / 1.2 across self / budget / middle, against
// the total bill's measured 1.0 / 1.5 / 2.5) and the cut removes the TOP of the ladder outright.
// Neither does the other's job: without the cut a `high` or `elite` family is the likeliest recipient
// in the game (99-100% of its weeks inside the gate against 53-60% at `middle`), and without the court
// denominator the same gate is an order of magnitude more lopsided across the eligible rungs – the
// self-to-middle ratio measures 39x on the court and 409x on the total bill.
//
// ⚠ AND WHAT IS *NOT* REMOVED, STATED PLAINLY, because it cannot be and a comment that implied
// otherwise would be lying. Below the cut, hiring up still raises the chance of the cameo – not
// because the unit moved but because THE FAMILY IS POORER, and a need gate that could not see that
// would not be a need gate. What is removable is the PRICE of the gradient, and it is measured: a
// working family that goes from self-coached to `budget` pays $8,320 more over four seasons and gets
// $1,196 more cameo (14 cents on the dollar); to `middle`, $23,504 more for $6,830 (29 cents). The
// step after that is the cut, where the extra $46,176 buys MINUS the whole cameo. Nobody farms an
// instrument that pays 29 cents on the dollar and then confiscates itself, and that is before
// docs/specs/round15-triage.md's finding that the coach is a net negative on every measured axis
// anyway. Reported per rung in docs/specs/need-not-background-2026-08.md §4.

/** IS THIS FAMILY IN NEED? – the whole gate under the weekly local-sponsor cameo, in one function so
 *  the engine, the bench and the tests cannot answer it differently. Pure, zero draws, no `world`.
 *
 *  `fundsCents` is the balance AT THE MOMENT THE CAMEO IS DECIDED – after the week's training bill
 *  has been taken, which is where `resolveBaseCosts` sits. A negative balance is deep need and
 *  returns true, as it must.
 *
 *  ⚠ MULTIPLIES RATHER THAN DIVIDES, so a zero court can never produce a NaN or an Infinity that
 *  reads as "in need". The guard above it is belt and braces – `weeklyBillSplit` cannot return a zero
 *  facility line for any rung the market offers – but a silent NaN here would pay every family in the
 *  game and nothing downstream would notice. */
export function sponsorNeedMet(input: { fundsCents: number; courtCents: number; tier: CoachTier }): boolean {
  const s = ECONOMY.sponsor
  if (COACH_TIERS.indexOf(input.tier) > COACH_TIERS.indexOf(s.maxCoachTier)) return false
  if (input.courtCents <= 0) return false
  return input.fundsCents < s.runwayWeeks * input.courtCents
}

/** How many tournaments she entered in the season that is finishing at `reviewWeek` – the count a kit
 *  deal's obligation is judged on, and it is the count the season really played (spec §5: "nothing
 *  may be offered that cannot be honoured"). Read off `world.results` plus the entry ledger would
 *  double-count a withdrawal, so it reads the one record that is written per entry and never
 *  rewritten: the tournament events her season produced.
 *
 *  ⚠ IT IS A ROLLING YEAR, AND SINCE THE WINDOW OPENED TWO WEEKS EARLY THAT IS THE HONEST NAME FOR
 *  IT (05.08). While the review fired on the first off-season week the 52-week window
 *  `[reviewWeek - 52, reviewWeek)` landed on exactly one season - it reached back over this season's
 *  whole competitive block and the previous season's three event-free off-season weeks. The review
 *  now runs on week 47, so the same window reaches back over weeks 0-46 of this season and weeks
 *  47-48 of the last one. It is still 49 competitive weeks - a full year of tennis, which is the
 *  unit the obligation is written in ("at least N tournaments a season") - it is simply offset by a
 *  fortnight, and the alternative was to judge a season block with two of its weeks unplayed and
 *  fail a girl for events she had not had the chance to enter yet.
 *
 *  ⚠ AND `reviewWeek` IS THE WINDOW'S OPENING WEEK, WHOEVER IS ASKING (06.08). Every caller passes
 *  `sponsorWindowOpensAt(world.week)` rather than today, because the verdict may now be taken on any
 *  week of the window and the window it counts over must not depend on which one. Asked on week 51
 *  instead, the rolling year would have slid forward off weeks 47-48 of the season just played - two
 *  competitive weeks, real tournaments - and a deal could fail its obligation for events she had
 *  actually entered.
 *
 *  ⚠ AND ANCHORING THE WINDOW IS NECESSARY BUT NOT SUFFICIENT, WHICH IS WORTH KNOWING BEFORE ANYONE
 *  TRUSTS THIS NUMBER ON A LATE WEEK. `world.results` is ITSELF pruned on a rolling 52 weeks
 *  (`RESULTS_WINDOW`, world.ts `pruneResults`), relative to `world.week` and not to `reviewWeek`. So
 *  the anchored window is read against a ledger that has already lost its own oldest weeks: asked on
 *  week 48 the count is missing week 47 of the season before, on week 49 weeks 47-48, and there it
 *  stops, because weeks 49-51 carry no events. THE NUMBER RETURNED ON A LATER WEEK IS THEREFORE A
 *  LOWER BOUND, short by at most two competitive weeks' tournaments. `reviewSponsors` is written
 *  around that: a lower bound may confirm that she played enough and may never declare that she did
 *  not. Measured, not deduced - a `tour` deal counted 14 against a minimum of 14 on the window's
 *  opening week and 13 the next, and was ended for it. */
export function eventsPlayedInSeason(world: WorldState, reviewWeek: number): number {
  const from = reviewWeek - WEEKS_PER_YEAR
  // ⚠ THE RESULTS LEDGER, NOT THE FEED (owner, 04.08: «а какие конкретно старты они считают? я много
  // где играл, ни одной травмы за сезон и очень крутые показатели»). He was right to disbelieve the
  // number. This read `world.events` — the NEWS FEED — which `pruneEvents` caps at EVENTS_CAP = 400
  // ROWS and trims oldest-first. Measured on his own W230 career: the sponsor counted 7 tournaments
  // where the results ledger holds 10, because the feed was at its cap and its earliest surviving
  // tournament row was week 199 of a window that opens at 178. Everything she played before that had
  // been displaced by later matches and news.
  //
  // So the obligation was judged on a record whose retention depends on HOW MUCH ELSE HAPPENED —
  // and it fails in the exact direction that punishes the career the term is meant to reward: the
  // busier her season, the more rows compete for the cap, the fewer of her own tournaments survive
  // to be counted. A deal could end for "not playing enough" BECAUSE she played a lot.
  //
  // `world.results` is the right source and always was: one row per appearance, written at
  // finalizeTournament, never rewritten, and pruned on a rolling 52-WEEK window (RESULTS_WINDOW) —
  // by TIME, which is the same unit the question is asked in. A withdrawal writes no row, so the
  // double-count the original comment feared cannot happen; a scoreless first-round exit writes one
  // (wave B), which is correct here — a sponsor pays to be SEEN, and she was there.
  return world.results.filter((r) => r.playerId === KID_ID && r.week >= from && r.week < reviewWeek).length
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
// bound tests/radar-read.test.ts guards, without anything about the radar itself changing. The evidence
// base got thinner, which is exactly what that test is for.
//
// So this function says everything the sponsor has to say in ONE line: what last season's deal was
// worth, and whether they are writing again. Signing, refusing and expiring write NOTHING here - the
// player took those actions himself (behind a confirm, in the case of the one that matters), and the
// inbox holds all three states for the life of the career, which the feed could never do anyway.
//
// ⚠ AND SINCE 05.08 IT RUNS ON EVERY WEEK OF A FIVE-WEEK WINDOW rather than on one week a year, with
// its three jobs split across it (feat/sponsor-window, docs/specs/sponsor-window-2026-08.md):
//
//   * THE OUTGOING DEAL IS JUDGED ONCE A SEASON and the brand's goodbye posted with the verdict.
//     ⚠ SINCE 06.08 THAT IS "ONCE, ON WHICHEVER WEEK OF THE WINDOW THE CAREER FIRST REACHES", not
//     "on week 47" (fix/sponsor-catchup). Pinning it to the opening week made that one week do work
//     no other week could do, so a career that arrived at week 48 - which is where the owner's own
//     save sat when the wave merged - skipped the year's verdict entirely. See the note above
//     `reviewSponsors` for the three things that make re-reading it return the same answer.
//   * EVERY WEEK OF THE WINDOW RAISES WHATEVER OF `windowLadder` HAS COME DUE and has not yet
//     written - which is at most one letter a week for a career that has been here since the window
//     opened, and the whole queue in one post for one that has only just arrived.
//   * THE WINDOW'S LAST WEEK (51) WRITES THE ONE FEED ROW. Not the first, because by the last week
//     the row can report the whole winter - what the season of kit was worth, who wrote, and whether
//     anything was signed - in a single line. That is not a preference: the feed budget below is a
//     MEASURED constraint of one row per season, and four letter weeks could otherwise become four
//     rows and cost the radar its evidence base.
/** WHERE SHE STANDS, AS THE BRAND LADDER READS IT – the one place the three tables are assembled
 *  into the object `standingClears` / `windowLadder` / `kitTermsFor` all take.
 *
 *  ⚠ EXTRACTED FROM `reviewSponsors` (06.08) SO THAT THE BENCH CAN ASK THE ENGINE'S OWN QUESTION.
 *  `tools/sponsor-window-bench.ts` now reports how often a winter passes with a clear ladder and no
 *  letter, which is the number the catch-up argument turns on - and it can only be an HONEST number
 *  if the bench reads the same standing the review does. A second copy of these five lines in a tool
 *  would have been a measurement of the copy. Nothing about the values moved in the extraction. */
export function sponsorStandingOf(world: WorldState): SponsorStanding {
  // Both cached ranks, with the same fallback rankIn uses: a career that has never held a point in a
  // table sits below the whole field rather than at the top of an empty one. `itfRanked` is the
  // guard that stops an empty table reading as a standing at all - see `SponsorStanding`.
  return {
    nationalRank: world.kidRankDomestic ?? tableSize(world, 'domestic'),
    itfRank: world.kidRank,
    itfRanked: kidPoints(world, 'itf') > 0,
    // The third table, on the same terms as the other two (02.08). `wtaRanked` uses the LIVE
    // window rather than the never-pruned mark on purpose: a sponsor asks what she is worth NOW,
    // and a professional who has not scored in a year is not holding a professional standing.
    // ⚠ AND THE W TABLE'S "below the whole field" IS 564, NOT 200 (`tableSize`): it carries 364
    // derived professionals as well as the cohort, so the old sentinel valued an UNRANKED girl as
    // world #200 – a top-200 professional's brand, on no ranking at all.
    wtaRank: world.kidRankWta ?? tableSize(world, 'wta'),
    wtaRanked: kidPoints(world, 'wta') > 0,
  }
}

export function reviewSponsors(world: WorldState): void {
  // Belt and braces: the tick already gates on the window, and a second caller (a test, a bench, a
  // future dev tool) must not be able to raise a letter in April.
  if (!isSponsorWindowWeek(world.week)) return
  const standing = sponsorStandingOf(world)
  const nationalRank = standing.nationalRank

  // 1. THE SEASON NOW FINISHING, IF IT WAS UNDER A DEAL. What the brand actually spent is the one
  //    number that says what signing was worth - the same job `AcademySupport.coveredCents` does -
  //    and the two conditions below are what decide whether it stays.
  //
  // ⚠ ONCE A SEASON, ON WHICHEVER WEEK OF THE WINDOW THE CAREER FIRST REACHES - NOT ON WEEK 47
  //   (06.08, fix/sponsor-catchup). It used to be gated on `isSponsorWindowOpenWeek`, which made the
  //   window's opening week do work no other week could do: a career that was at week 48 when the
  //   code changed under it never had a week 47, so its season's verdict was never taken, the brand
  //   never said goodbye, and `letDownThisWindow` could not see a failure that had never been
  //   judged. The owner hit exactly that on the first career he loaded after the wave merged. The
  //   shipped spec called it a known consequence for migrated saves (§4); it is not only a migration
  //   problem - any career inside the window when the app updates has the same hole - so the fix is
  //   to make the verdict IDEMPOTENT PER SEASON rather than to pin it to a different week.
  //
  //   Three things make re-reading it on every week of the window return the same verdict, which is
  //   what "idempotent" has to mean here:
  //     * ITS SUBJECT is `dealUnderReview`, anchored on the window's opening week - the deal that was
  //       already running when the brands' window opened. Constant across the window, and it cannot
  //       accidentally pick up a letter signed on week 47 and end it before it starts.
  //     * ITS COUNT is `eventsPlayedInSeason` read at the window's OPENING week rather than today, so
  //       the rolling year it judges is the same rolling year on week 51 as on week 47. Judging a
  //       later week's window would drop the two competitive weeks 47-48 of the season just gone and
  //       could fail a girl for events she did play.
  //     * ITS OUTPUTS are idempotent one by one: `endDealWithSeason` snaps to the same
  //       `contractEndWeek` from any week of the window, and `raiseKitEndLetter` now returns the
  //       notice already in the inbox instead of posting a second copy.
  //   The one input that is still read fresh each week is her STANDING, which is the same reading the
  //   letters themselves are gated on - a brand judges what the table says today, and a girl who has
  //   slid out of the band is neither kept nor written to.
  const opened = sponsorWindowOpensAt(world.week)
  const deal = dealUnderReview(world.offers, world.week)
  const dealTerms = deal ? (deal.terms as KitOfferTerms) : null
  const played = deal ? eventsPlayedInSeason(world, opened) : 0
  // ⚠ AND A VERDICT MAY ONLY FAIL HER FROM THE WINDOW'S OPENING WEEK, WHICH IS THE ONLY WEEK THE
  //   SEASON IT JUDGES IS STILL VISIBLE (06.08). Anchoring the review week was necessary and is not
  //   sufficient: `world.results` is itself PRUNED on a rolling 52 weeks (`RESULTS_WINDOW`, world.ts
  //   `pruneResults`), so the evidence underneath the anchored window erodes a week at a time. Caught
  //   in the bench rather than reasoned about - a `tour` deal on `bench-working-2` counted 14 events
  //   against a minimum of 14 on week 255 and 13 on week 256, because week 203's tournament had aged
  //   out of the ledger overnight. It was ended for not playing enough, on a season it had played
  //   enough of, and the career lost four seasons of retainer and bonus ($49,252 -> $21,960).
  //
  //   So `played` read on a later week is a LOWER BOUND on the true count - short by at most the two
  //   competitive weeks 47-48 of the season before, since weeks 49-51 carry no events. A lower bound
  //   is sound for confirming that she DID play enough and unsound for declaring that she did not,
  //   and the same is true of the standing (see `keptAtHome`). So a later week's verdict does
  //   everything except fail her: it identifies the deal, ends one whose TERM is up - which is
  //   arithmetic on `untilWeek`, not a judgement - and posts the brand's goodbye. That is the whole
  //   of what the owner's save was missing, and none of it needs evidence that has aged out.
  const openWeekVerdict = world.week === opened
  // ⚠ FAILING EITHER CONDITION COSTS THE DEAL, NOT THE FAMILY'S SAVINGS (spec §4.1). Nothing is
  //   clawed back - a junior kit deal is not a loan, and NOT ONE LINE BELOW TOUCHES
  //   `world.fundsCents`. The contract ends with the season it failed and the brand is free to write
  //   again the year after, because the penalty is a missed season and not a blacklist. This is the
  //   promise the LETTER makes in the brand's own words, and the two have to agree.
  const playedEnough = !dealTerms || !openWeekVerdict || played >= dealTerms.minEventsPerSeason
  // ...and the second one is the national rung's own, and the reason the domestic ladder still
  // matters to a girl who has left it behind. `keepDomesticRank` is absent on every other rung, so
  // this reads true for them without a tier check.
  //
  // ⚠ OR THE RUNG'S OWN STANDING, IN WHICHEVER TABLE SHE IS IN (02.08, the owner: «спонсор вполне
  // может жить и дальше»). The domestic clause was written when going abroad meant going abroad as
  // a JUNIOR; a professional is not less visible than the girl they signed. `standingClears` is the
  // one place that question is answered - the same predicate that decides who WRITES to her - so a
  // deal can never be killed by a rule that would have offered it back the same winter.
  //
  // ⚠ AND IT IS THE OPENING WEEK'S READING OR NOBODY'S, exactly as the events count above is, and for
  // a sibling reason: her domestic points are a rolling 52-week best-6, so during weeks 48-51 the
  // previous year's weeks 47-48 age out of the table and her rank slides for a reason that has
  // nothing to do with the season the brand is judging. Both halves of the verdict therefore read
  // "she held up" on any week but the first - a later week can confirm a pass and must not declare a
  // failure.
  //
  // ⚠ THE ONE ASYMMETRY IT LEAVES, stated: a career that reaches the window after its opening week
  // has no opening-week reading, so its deal is not failed that winter. That is the SAFE direction -
  // a deal kept, never one killed - it is confined to a career the app updated under, and the
  // alternative is to fail her on evidence that has already begun to age out. Pinned in
  // tests/offers.test.ts.
  const keptAtHome =
    !dealTerms?.keepDomesticRank ||
    !openWeekVerdict ||
    nationalRank <= dealTerms.keepDomesticRank ||
    standingClears(standing, dealTerms.tier)
  const heldUp = playedEnough && keptAtHome
  // ...and the verdict is recorded ON the letter, so the inbox can still answer "what happened to
  // that deal?" a decade later. The count is the one the season really played (spec §5).
  // ...and it is stamped from the opening week's reading alone, for the reason above: a later week's
  // count is a lower bound, and overwriting a true number with a lower bound would make the record
  // worse the longer the window ran. A career that only met the window later leaves this season
  // unstamped on the contract; the brand's goodbye letter still carries the count it was written
  // with, and the feed reads it from there.
  if (deal && openWeekVerdict) deal.eventsPlayed = played
  // A deal that failed does not limp to its contractual end: it stops with the season it failed.
  // A deal that held up simply runs on - a two-season contract has another year to go.
  if (deal && !heldUp) endDealWithSeason(deal, world.week)

  // ⚠ ...AND THE BRAND SAYS SO IN WRITING (owner, 04.08: «I believe we need to send an email with
  // the termination message»). The status line on the signed letter was already right and already
  // unread; the first thing the player actually noticed was gear bills he thought the brand was
  // paying. So a NEW letter lands in the inbox - which is the surface that knocks - for BOTH ways a
  // deal can end: the terms it failed, and a term served in full. `untilWeek` is now final either
  // way, so "does it cover next season" is the one question asked here.
  if (deal && dealTerms && (deal.untilWeek ?? -1) <= contractEndWeek(world.week)) {
    const reason: KitEndReason = !playedEnough ? 'events' : !keptAtHome ? 'standing' : 'term'
    raiseKitEndLetter(world.offers, world.week, deal, reason, played)
  }

  // 2. AND WHETHER ANYBODY WRITES, THIS WEEK. ⚠ ONE BRAND AT A TIME is enforced inside
  //    `raiseKitOffers` - `seasonSpokenFor`, so a multi-season contract with a year left to run turns
  //    the whole window away by itself and there is no second rule here to keep in step with it.
  //    What this line adds is the ONE case the offers module cannot see: a brand that was let down
  //    this season does not turn round and write a fresh letter in the same winter, even though its
  //    own contract has just been ended.
  //
  //    ⚠ AND IT HAS TO SURVIVE THE WHOLE WINDOW, not just the week it was decided on. The verdict is
  //    reached on week 47 and letters go out until week 50, so `letDownThisWindow` re-reads it off
  //    the goodbye letter already in the inbox rather than carrying a flag across four ticks. One
  //    fact, one place it is written down.
  const letDown = !heldUp || letDownThisWindow(world.offers, world.week)
  if (!letDown) raiseKitOffers({ offers: world.offers, seed: world.seed, week: world.week, standing })

  // 3. ONE LINE A SEASON, ON THE WINDOW'S LAST WEEK, CARRYING WHICHEVER OF THOSE HAPPENED. It names
  //    the TABLE the letters were gated on, because the whole point of the 30.07 fix was that the
  //    player could not tell which ladder any gate was reading - and the brand ladder makes that
  //    question sharper rather than softer, since the rungs read different tables on purpose. And it
  //    names the INBOX, because a letter nobody opens is worse than the cheque it replaced.
  //
  //    ⚠ WRITTEN LAST RATHER THAN FIRST, WHICH IS THE FEED BUDGET SPEAKING. Four letter weeks could
  //    have become four rows; the measurement above this function says one extra row a season is
  //    already worth 0.36 -> 0.64 points of radar re-widening, so four is not available. Waiting
  //    until the window closes is what turns four possible rows back into one, and it can then say
  //    MORE than the old line could - what the year of kit was worth, who wrote, and what he did
  //    about it.
  // ⚠ ...AND IT IS ALSO THE WEEK THE INCUMBENT WRITES, WHICH IS THE 10.08 ADDITION (owner: renewal is
  //    a letter, not an automatic re-signing; new letters still arrive; the five-week window stays).
  //    Everything above this line has already happened by the time the closing week runs - every rung
  //    she clears has had its turn (`raiseKitOffers` walks slots 0-3) - so the brand she already knows
  //    is the LAST letter on the table and can never crowd a better one out. That ordering is the
  //    whole design and the reason it is here rather than beside the goodbye: see `raiseKitRenewal`,
  //    and see `seasonSpokenFor` for the trap it is written around.
  if (!isSponsorWindowCloseWeek(world.week)) return
  const parts: string[] = []
  const ended = dealEndingWithSeason(world.offers, world.week)
  const endedTerms = ended ? (ended.terms as KitOfferTerms) : null
  // Raised BEFORE the row is composed, so the one line a season can report it - and so `post` below
  // sees it. `raiseKitRenewal` holds every condition itself (the closing week, one brand at a time,
  // and a term served rather than a relationship failed), which is why there is no second test here
  // to keep in step with it.
  const renewal = ended ? raiseKitRenewal(world.offers, world.week, ended) : null
  if (ended && endedTerms) {
    // ⚠ WHAT THE SEASON OF KIT WAS WORTH IS REPORTED EITHER WAY, and the failure case is the one
    //   that needs it most: a deal that ends is precisely the moment the player should be able to
    //   see what he just lost. Reporting the value only on a renewal would make the number a reward
    //   for having done well, which is the opposite of what it is for. The REASON is read off the
    //   goodbye letter the brand already posted, so the feed and the paper cannot disagree.
    const worth = `$${Math.round((ended.coveredCents ?? 0) / 100).toLocaleString('en-US')}`
    const goodbye = world.offers.find((o) => o.id === `kit-end-${ended.id}`)
    const why = goodbye ? (goodbye.terms as KitOfferTerms).ended : 'term'
    // ⚠ THE COUNT COMES OFF THE GOODBYE LETTER, like the reason one line up (06.08). The letter was
    //   written by the verdict that ended the deal and carries that verdict's own number; the
    //   contract's `eventsPlayed` is only stamped from the window's opening week, so a career that
    //   met the window later has a goodbye with a count and a contract without one. Reading the
    //   paper is what keeps the feed and the letter from saying different things.
    const playedThen = (goodbye?.terms as KitOfferTerms | undefined)?.endedEventsPlayed ?? ended.eventsPlayed ?? 0
    parts.push(
      why === 'events'
        ? `${endedTerms.brand} kitted her out all season – ${worth} of kit – but they asked for ${endedTerms.minEventsPerSeason} events and she played ${playedThen}, so they are done.`
        : why === 'standing'
          ? `${endedTerms.brand} kitted her out all season – ${worth} of kit – but they back a girl inside the ${LADDER_LABEL.domestic} top ${endedTerms.keepDomesticRank} and she is #${nationalRank}, so they are done.`
          : `${endedTerms.brand} kitted her out all season – ${worth} of kit, ${playedThen} events played.`,
    )
  }
  // THE WINTER'S POST, as one clause however many brands wrote. `signed` is checked first because it
  // is the news: a letter already answered should not be described as waiting in the inbox.
  //
  // ⚠ THE RENEWAL IS EXCLUDED HERE AND REPORTED ON ITS OWN CLAUSE BELOW. It is a kit offer raised
  // this window, so it would otherwise be swept into "letters from X and Y – they all want to put her
  // in their kit", which is the one thing a renewal is not: they already have her, and the row would
  // name the same brand twice in two different voices one sentence apart.
  const post = world.offers.filter(
    (o) => o.kind === 'kit' && o.week >= opened && o.state !== 'info' && o !== renewal,
  )
  const signedNow = post.find((o) => o.state === 'signed')
  if (signedNow) {
    const terms = signedNow.terms as KitOfferTerms
    parts.push(`She is in ${terms.brand}'s kit for next season.`)
  } else if (post.length > 0) {
    const gate = post.every((o) => (o.terms as KitOfferTerms).tier === 'local')
      ? `${LADDER_LABEL.domestic} #${nationalRank}`
      : `${LADDER_LABEL.itf} #${world.kidRank}`
    const names = post.map((o) => (o.terms as KitOfferTerms).brand)
    const brands = names.length > 1 ? `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}` : names[0]
    parts.push(
      post.length === 1
        ? `A letter from ${brands} – they want to put her in their kit (${gate}). It is in the inbox.`
        : `Letters from ${brands} – they all want to put her in their kit (${gate}). They are in the inbox.`,
    )
  }
  // ⚠ AND THE INCUMBENT GETS ITS OWN SENTENCE, in its own voice. It is the last clause because it is
  //   the last letter: by the time the parent reads this line every rung that would have her has
  //   already written, and this is the one he can still take instead. It says the deadline out loud
  //   because the renewal's deadline is TODAY - the window closes with this week - and a letter whose
  //   window is one week long is the one case where "it is in the inbox" is not enough on its own.
  if (renewal) {
    const t = renewal.terms as KitOfferTerms
    parts.push(`${t.brand} would like another season on the same terms – their letter is in the inbox, and it goes when the season opens.`)
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
  // ⚠ W2-ENDINGS: the career must still have a next week. The engine re-validates every command
  // because the worker is not the gate - a tab left open behind the epilogue must not be able to
  // spend money for a girl who has retired.
  guardNotEnded(world)
  const signed = signOfferIn(world.offers, offerId, world.week)
  if (!signed) throw new Error(offerAnswerErrorFor(world, offerId))
  return signed
}

/** THE PARENT REFUSES. Terminal in the same way signing is: a "no" he could take back would make the
 *  deadline a formality on the other side of the decision. Same feed budget, same reason. */
export function declineOffer(world: WorldState, offerId: string): Offer {
  // ⚠ W2-ENDINGS: the career must still have a next week. The engine re-validates every command
  // because the worker is not the gate - a tab left open behind the epilogue must not be able to
  // spend money for a girl who has retired.
  guardNotEnded(world)
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

/** ⭐ ROUND-21 #2 - WHAT THE SECOND SEAT COSTS, and it is her own fare over again.
 *
 *  ⚠ THE MULTIPLIER IS THE OWNER'S AND IT IS THE ONLY PRICED FARE THAT SURVIVES ANYWHERE. The 30.07
 *  build DID price a per-trip fare and every line of it was reverted while still uncommitted (commit
 *  `77e08aa`: "ALL THE ENGINE WORK IS REVERTED... the `coachTravelsFrom` threshold, the per-trip
 *  fare... are gone"), so that number is not recoverable from git or from any doc - I looked. What IS
 *  on the record is his own pricing of the same thing on 12.08, in `docs/specs/the-wall-2026-08.md`
 *  §L1: «a per-tournament top-up when the coach travels with her, AT DOUBLE THE TRAVEL COST».
 *
 *  So: one more flight, one more room, and a trip he comes on costs exactly twice what it costs
 *  without him. That reading is the one the screen can say in four words - "twice the fare" - and it
 *  is the conservative one; the other reading of the same sentence (a top-up that is ITSELF double,
 *  i.e. a trip at 3x) is not what "double the travel cost" describes.
 *
 *  ⚠⚠ AND HIS SEAT IS **GROSS** – THE SUPPORT DOES NOT PAY FOR HIM. This shipped through
 *  `travelCostFor`, which subtracts the academy scholarship and the brand's travel share, so for one
 *  wave the mechanism built to keep a struggling family in the game was **buying the coach a plane
 *  ticket**. The owner caught it as a principle rather than as a bug (15.08): «Мы делали механизм
 *  точечной поддержки нуждающихся, этот механизм не должен поддерживать их чрезмерные траты, только
 *  помочь дожить до призов. Вот что надо проконтролировать.»
 *
 *  So HER fare keeps every cover it has ever had and HIS is `event.travelCostCents`, the full price.
 *  That is also how a scholarship works in the world: it covers the player, not her entourage.
 *
 *  ⚠ IT CHANGES WHAT "DOUBLE" MEANS FOR A COVERED FAMILY, AND DELIBERATELY. Uncovered, the trip
 *  still costs exactly twice - the sentence on screen is unchanged for everybody paying full price.
 *  Covered, it costs her discounted seat plus his whole one, so the discount stops scaling with the
 *  luxury: the better her scholarship, the LARGER the share of the trip he represents, which is the
 *  right direction. The screen must say his seat is not covered rather than quoting a bare multiple.
 *
 *  ⚠ AND IT IS NOT REFUNDABLE, BECAUSE IT IS NEVER COMMITTED IN ADVANCE. `chargeTravel`'s note warns
 *  that a discount computed at the till and not at the refund is free money in four keystrokes. That
 *  hazard cannot reach here: this is charged on the PLAY week, inside the arm where she actually
 *  boarded (world.ts, `else if (enteredThisWeek)`), so the two arms that do not travel - the injury
 *  walkover and the medical withdrawal - never pay it and have nothing to hand back.
 *
 *  Zero draws on any stream: two reads and a multiply. */
export function coachTravelFareFor(world: WorldState, event: SeasonEvent): number {
  // ⚠ SELF-COACHED FAMILIES SEND NOBODY. `coachId === null` is the parent on the court, and the
  // parent is already in the car - charging a second seat for somebody who was going anyway is the
  // "tax, not a decision" the 30.07 boolean was killed for.
  if (world.coachId === null) return 0
  if (!world.coachOnEventWeeks) return 0
  // ⚠⚠ HE COMES TO THE EVENTS THAT PAY, AND THIS SHIPPED UNGATED FOR EXACTLY ONE COMMIT (round-21
  // #2). The bench caught it before the branch was gated - `docs/specs/coach-travel-2026-08.md`: at
  // this very price an ungated fare bankrupted **8 of 30** wealthy·elite careers and **15 of 30**
  // middle·middle ones, and EVERY bankruptcy was in the junior years (ages 15-19). "Ever ranked"
  // fell 96.7% -> 46.7% and the median middle career's whole prize money went to $0. The 30.07
  // record priced this mechanic at +$21,000; on a career that actually plays it is +$995,979,
  // because nothing stopped it buying a second seat on a `local` at fourteen.
  //
  // ⚠ THE GATE IS THE OWNER'S OWN ARGUMENT RATHER THAN A NEW RULE. Cancelling the mechanic on 30.07
  // he said why - «Никто никуда не ездит… в про карьере - там другое дело» - and the commit spelled
  // it out: *"JUNIOR TENNIS HAS NO PRIZE MONEY. A fare can only be a decision if something might
  // come back, and on the junior tour nothing ever does."*
  //
  // ⚠ AND THE TEST IS THE RUNG'S OWN `prizeCents`, not an age and not a second ladder: present from
  // W15 up, absent on every domestic and junior rung. A rung that starts paying starts being worth
  // the fare, by construction, with nothing to keep in step. It lives HERE and nowhere else -
  // `chargeCoachTravel` already returns on a zero fare, so "does he come" and "what does it cost"
  // are one question with one answer, and `coachMarket.ts` cannot import this file back anyway
  // (it is imported BY it - the cycle is why this is not a predicate over there).
  if (TIERS[event.tier].prizeCents === undefined) return 0
  // ⭐ GROSS, NOT `travelCostFor` – see the note above. The academy scholarship and the brand's share
  // stay on HER seat and never reach his.
  return event.travelCostCents
}

/** THE CHARGE, on the week she travelled and he came with her. One row, its own line in the feed:
 *  the coach's fare is not the coach's retainer and must never be folded into it (owner, 08.08 -
 *  «нам нужно отдельной строчкой списывать тренера, а отдельной рент залов», the same instinct one
 *  bill over).
 *
 *  ⚠ CATEGORY `travel`, NOT `coaching`. It is a fare, it moves with the calendar rather than with
 *  the week, and the Money breakdown should show it beside the trip it paid for. It also means no
 *  `WorldEventCategory` is added, so nothing here touches the save schema.
 *
 *  ⚠ NO PRONOUN NAMES THE COACH (R15-7, owner 09.08): `buildCoachRoster` puts a woman on every
 *  roster by construction, so "his fare" would print under Sabine Kobayashi. */
export function chargeCoachTravel(world: WorldState, event: SeasonEvent): void {
  const fare = coachTravelFareFor(world, event)
  if (fare <= 0) return
  world.fundsCents -= fare
  addEvent(world, {
    week: world.week,
    type: 'expense',
    category: 'travel',
    text: `Your coach travels to the ${TIERS[event.tier].label} – a second fare`,
    amountCents: -fare,
  })
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

// =================================================================================================
// THE PROFESSIONAL RUNGS' MONEY (W3-ACT2, act2-pro-tour.md §7)
// =================================================================================================
//
// Three income lines that did not exist below `tour`, and every one of them is a cheque somebody
// writes to the PLAYER rather than a price the family pays - so, exactly like prize money, NONE of
// them scales with the wealth corridor. See `prizeCentsFor`'s note; it is the same rule and it is
// stated there for the same reason.
//
// ⚠ RNG: zero draws, all three. They are lookups on a signed deal plus post-draw arithmetic, so the
// frozen MAIN capture cannot see any of this.

/** THE RETAINER'S PAY WEEKS. Quarterly, and quarterly means "every thirteenth week of the season
 *  block", which is `WEEKS_PER_YEAR / 4` exactly - so the four arrivals land on season offsets 0,
 *  13, 26 and 39 in every year, and a player can plan against them. Deliberately NOT the season
 *  boundary alone: one number a year at the boundary would read as the old cheque this whole system
 *  replaced, and the spec asks for a quarterly retainer because a wage is what it is. */
export function isRetainerWeek(week: number): boolean {
  return week % (WEEKS_PER_YEAR / 4) === 0
}

/** Pay the quarter's retainer, if a deal that carries one is running. Idempotent per week by
 *  construction (the tick calls it once) and silent when nobody is paying. */
export function payRetainer(world: WorldState): void {
  if (!isRetainerWeek(world.week)) return
  const deal = activeKitDeal(world.offers, world.week)
  if (!deal) return
  const terms = deal.terms as KitOfferTerms
  const cents = terms.retainerCents ?? 0
  if (cents <= 0) return
  world.fundsCents += cents
  addEvent(world, {
    week: world.week,
    type: 'income',
    category: 'income',
    text: `${terms.brand} retainer – quarterly`,
    amountCents: cents,
  })
}

/** WHAT AN EVENT PAYS HER TO TURN UP, in cents, 0 when nothing does. Read at the moment a run
 *  COMMITS, so a skipped event or a walkover pays nothing - the same commit point the prize money
 *  uses, and for the same reason: a fee for appearing has to be conditional on appearing. */
export function appearanceFeeFor(world: WorldState, tier: TierId): number {
  const deal = activeKitDeal(world.offers, world.week)
  if (!deal) return 0
  const terms = deal.terms as KitOfferTerms
  const fee = terms.appearanceFeeCents ?? 0
  const from = terms.appearanceFromTier
  if (fee <= 0 || !from) return 0
  return TIER_LADDER.indexOf(tier) >= TIER_LADDER.indexOf(from) ? fee : 0
}

/** THE RESULT BONUS, as a share of the tournament's own cheque for that finish.
 *
 *  ⚠ A SHARE AND NOT A SECOND TABLE, which is the whole design. The prize curve is already anchored
 *  per rung and per finish by the research doc, so a bonus expressed against it inherits that shape
 *  for free: it can never invert (a semi-final bonus larger than a title one is unrepresentable),
 *  it scales with the rung she is winning at, and there is exactly one table to retune if the money
 *  ever moves. It also means a rung that pays no prize money - the whole junior ladder - pays no
 *  bonus by construction rather than by a second rule saying so. */
export function resultBonusFor(world: WorldState, tier: TierId, finish: number): number {
  const deal = activeKitDeal(world.offers, world.week)
  if (!deal) return 0
  const terms = deal.terms as KitOfferTerms
  const share = terms.bonusShare ?? 0
  const from = terms.bonusFromTier
  if (share <= 0 || !from) return 0
  if (TIER_LADDER.indexOf(tier) < TIER_LADDER.indexOf(from)) return 0
  return Math.round(share * (TIERS[tier].prizeCents?.[finish] ?? 0))
}
