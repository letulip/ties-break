/**
 * SPONSOR WINDOW BENCH – does a girl who plays well have a sponsor for her whole career?
 *
 * The owner's own save is the reason this file exists. Decoded, it holds three kit deals: a global
 * one at week 153, a local letter at 257 that EXPIRED unsigned at 262, and the next letter at 309 –
 * forty-seven weeks with no deal at all, because letters were raised on ONE week a year and the one
 * she missed was the only one there was. His goal, in his words: «если девочка хорошо играет, то
 * наверняка ее замечают и у нее есть спонсоры в том или ином виде на протяжении всей карьеры».
 *
 * So this bench measures CONTINUITY rather than size, and it measures it as a distribution over the
 * econ bench's own preset ladder so the answer is per-corridor rather than anecdotal:
 *
 *   1. COVERAGE  – the fraction of her eligible weeks (from the first week a letter could ever have
 *                  arrived) with a live deal in force.
 *   2. THE GAP   – the longest unbroken run of weeks with no deal, p50 / p90 / max. His was 47.
 *   3. THE MAIL  – letters raised per career by rung, and how many were signed / refused / expired.
 *   4. THE MONEY – what the sponsors were worth over the career, and its share of total income, so
 *                  that continuity cannot quietly become a large unearned subsidy.
 *   5. THE FLOOR – whether a career that is NOT competing still collects deals. Continuity is meant
 *                  to be earned by playing well; a career that stops playing should lose its kit.
 *
 * MEASUREMENT ONLY. Nothing here changes an engine or economy number; it imports the career loop
 * (`stepCareerWeek`) and the preset ladder from tools/econ-bench.ts so the world evolution is
 * defined in exactly one place, and adds only the two things the econ bench has no opinion about:
 * WHEN the parent signs, and what the sponsor was worth.
 *
 * ⚠ ZERO NEW RANDOMNESS. The signing policies are deterministic functions of the inbox, so the same
 * seed and preset reproduce byte-identically, and a career that signs taps the same MAIN sequence as
 * one that does not (the engine's input-independence law – see CLAUDE.md invariant 2).
 *
 * Run:  npx vite-node tools/sponsor-window-bench.ts
 *       npx vite-node tools/sponsor-window-bench.ts -- --seeds 8 --json out.json
 */
import { writeFileSync } from 'node:fs'
import { acceptOffer, type WorldState } from '../src/engine/world'
import { WEEKS_PER_YEAR, OFF_SEASON_WEEKS } from '../src/engine/season/calendar'
import {
  activeKitDeal, isOfferLive, isSponsorWindowCloseWeek, isSponsorWindowOpenWeek, letDownThisWindow,
  seasonSpokenFor, sponsorWindowOpensAt, windowLadder, SPONSOR_TIERS, SPONSOR_WINDOW_WEEKS,
} from '../src/engine/offers'
import { reviewSponsors, sponsorStandingOf } from '../src/engine/world/sponsors'
import { ECONOMY } from '../src/engine/economy'
import type { KitOfferTerms, Offer, SponsorTier } from '../src/shared/protocol'
import { PRESETS, POLICIES, openCareer, stepCareerWeek, mean, median, type Preset, type Policy } from './econ-bench'

/** Six seasons – the horizon the econ bench calls "the adult tour", and the first one in which the
 *  professional rungs of the ladder are reachable at all. */
const HORIZON_WEEKS = 312
/** The first week a sponsor letter could ever be raised, under either schedule. Coverage is measured
 *  from here rather than from week 0, because no career can be covered before the first review. */
const FIRST_LETTER_WEEK = WEEKS_PER_YEAR - OFF_SEASON_WEEKS - 2 // 47 – the new window's open week
const DEFAULT_SEEDS = 8

// --- how the parent answers the post -------------------------------------------------------------
//
// The bench has to have an opinion, because a letter nobody answers measures the schedule's expiry
// behaviour rather than its coverage. Two, deliberately: one that takes what it is offered and one
// that uses the thinking time the owner asked for.
export type SignPolicy = 'eager' | 'patient'

/** The rung's place on the ladder, strongest last – so "the best letter in the inbox" is a max. */
const LADDER_INDEX = new Map<SponsorTier, number>(SPONSOR_TIERS.map((t, i) => [t, i]))

function liveKitLetters(world: WorldState): Offer[] {
  return world.offers.filter((o) => o.kind === 'kit' && isOfferLive(o, world.week))
}

/** EAGER: sign the first live letter, the week it lands. The behaviour of a parent who does not know
 *  a second one may be coming – and, under the one-week schedule, the only behaviour there was. */
/** PATIENT: hold everything until the last quiet week of the year, then sign the best rung on the
 *  table. Under the one-week schedule this is a pure risk with no upside (there is never a second
 *  letter); under the window it is the choice the owner asked for. */
function answerThePost(world: WorldState, policy: SignPolicy): void {
  const live = liveKitLetters(world)
  if (live.length === 0) return
  if (policy === 'patient') {
    // ⚠⚠ RE-AIMED (28.08, round 28 #17-b) AND IT IS A NO-OP FOR EVERY ARM BEFORE THE OWNER'S RULING.
    //    `patient` means «hold to the last moment you can», and until the ruling that was expressible
    //    as a CALENDAR week: every letter of a winter died when the window closed, so "the last quiet
    //    week" (season offset 51) and "the last week this letter is live" were the same week and the
    //    policy was written against the first one. They are no longer the same week - a letter now
    //    carries five weeks from its own arrival - and a policy pinned to the calendar would answer
    //    every letter before its deadline, which is not patience, it is a parent who happens to act
    //    on week 51. Measured against the old engine this branch is byte-identical (all deadlines
    //    ARE offset 51 there, so `dying` is exactly `live` on that week and empty before it), which
    //    is what makes the A/B below a fair one rather than two different players.
    //
    //    ⚠ IT IS ALSO THE ONLY INSTRUMENT THAT CAN SEE THE RULING AT ALL. With `patient` pinned to
    //    week 51, neither policy ever holds a letter into the new season, so the extra weeks are
    //    dead weight and the bench reports a byte-identical null - which is a property of the probe,
    //    not of the change.
    const dying = live.filter((o) => o.deadlineWeek === world.week)
    if (dying.length === 0) return
    signBest(world, dying)
    return
  }
  signBest(world, live)
}

function signBest(world: WorldState, letters: Offer[]): void {
  const best = [...letters].sort(
    (a, b) =>
      (LADDER_INDEX.get((b.terms as KitOfferTerms).tier) ?? -1) -
      (LADDER_INDEX.get((a.terms as KitOfferTerms).tier) ?? -1),
  )[0]
  try {
    acceptOffer(world, best.id)
  } catch {
    // A career that has ended refuses every command – that is the engine re-validating, not a bug.
  }
}

// --- what a career reports ------------------------------------------------------------------------

export interface CareerResult {
  preset: string
  policy: string
  sign: SignPolicy
  seed: string
  /** weeks from FIRST_LETTER_WEEK to the horizon (or to the week the career ended). */
  eligibleWeeks: number
  /** of those, the ones with a signed deal in force. */
  coveredWeeks: number
  coverage: number
  /** the longest unbroken run of eligible weeks with no deal at all – it includes the years before
   *  anybody had ever written to her, so it is the "was she ever noticed" number. */
  longestGapWeeks: number
  /** ⚠ THE OWNER'S OWN NUMBER: the longest run with no deal AFTER her first one started. His was 47
   *  weeks, between a letter that expired at 262 and the next one at 309, and it is a different
   *  question from the one above – a girl who has been signed once and then goes uncovered has been
   *  DROPPED, which is what he felt. */
  longestGapAfterFirstWeeks: number
  /** the week her first deal came into force, or null if none ever did. */
  firstDealWeek: number | null
  /** letters raised, by rung, and what became of them. */
  raisedByTier: Record<string, number>
  signed: number
  refused: number
  expiredUnsigned: number
  /** what the brands were worth, in cents, split by instrument. */
  kitCoveredCents: number
  retainerCents: number
  appearanceCents: number
  bonusCents: number
  travelCoveredCents: number
  sponsorCents: number
  /** every positive line in the finance ledger over the career. */
  incomeCents: number
  /** tournaments entered over the career – the axis "was she competing at all" is read on. */
  eventsPlayed: number
  endedWeek: number | null
  // --- THE CATCH-UP NUMBERS (06.08, fix/sponsor-catchup) -------------------------------------------
  //
  // "How often does a career enter a window and receive nothing?" is the question the catch-up
  // argument turns on, and it splits into two that must be kept apart:
  //
  //   * THE SCHEDULE. A rung on her ladder whose turn came and went without a roll. This is the
  //     defect, and it must be ZERO: `rungsClear - rungsRolled`, since every rung her standing
  //     clears now gets exactly one roll whichever week of the window the career reaches first.
  //   * THE DICE. A winter she was eligible for in which every rung said no. This is the DESIGN -
  //     «nothing is manufactured» - and it is the number that says what a catch-up on the far side
  //     of the window would be re-rolling if one were ever built.
  //
  // Counted only over winters that were genuinely OPEN to her: she cleared at least one rung, the
  // season ahead was not already promised to a multi-season deal, and no brand had just been let
  // down. A winter turned away by any of those is not silence, it is the rule working.
  // --- THE FLOOR (09.08, fix/sponsor-floor) --------------------------------------------------------
  //
  // ⚠ THE OWNER'S OWN SENTENCE AS A COUNTER: «у нее кончился контракт, а нового не дали». Coverage and
  // the gap are both WEEK counts, and a week count cannot answer the question he actually asked -
  // which is about a SEASON opening with nothing. A career can carry 60% coverage and still open two
  // of its four seasons in no kit at all, and those two are the ones he felt. Read at the season's
  // first week, which is the week the new contract would have come into force (`dealStartsAt`).
  /** seasons whose opening week could have been covered - i.e. every season after the first, since
   *  the first letter of a career cannot be written before week 47 of season 0. */
  seasonsOpened: number
  /** ...of those, the ones that opened with no kit deal in force. */
  seasonsOpenedBare: number
  /** ⚠⚠ THE SAME COUNT, READ AFTER THE POST IS ANSWERED - and the two disagree only because of the
   *  owner's 28.08 ruling (round 28 #17-b), which is exactly why it was added. A kit letter now
   *  carries five weeks from its own arrival instead of dying with the window, so a letter raised on
   *  window week 51 is STILL LIVE in weeks 0-3 of the new season. `seasonsOpenedBare` above is read
   *  before the parent acts, so it now counts a season as bare that he covers the same morning by
   *  signing the letter in his hand. That is the honest historical series and it is kept; this one
   *  is the question a player would recognise - «did she actually play a week in nobody's kit». */
  seasonsOpenedBareAfterPost: number
  /** ⚠ ...AND FOR HOW LONG. The consequence the ruling could plausibly have bought: a letter that
   *  can be answered in week 2 is a season that opens uncovered even when it ends up signed. Counts
   *  the CONSECUTIVE weeks from a season's first week in which no deal is in force, read after the
   *  post is answered, so a season covered on its opening week contributes zero. Summed per career;
   *  `bareOpeningRuns` is how many seasons contributed, so the mean run is one over the other. */
  bareOpeningWeeks: number
  bareOpeningRuns: number
  /** ⚠ THE FLOOR'S OWN POPULATION, AND IT IS GATE-INDEPENDENT ON PURPOSE (09.08). Winters in which
   *  the local shop's DOMESTIC gate alone would refuse her - she has slid past `maxRank` at home and
   *  holds no professional ranking - and, of those, the junior world ranks she was actually holding.
   *  This is the group the local rung's junior arm is sized against, so it is collected rather than
   *  argued: a cut has to be read off what the careers refused by the domestic table look like. */
  domesticRefusedWinters: number
  domesticRefusedItfRanks: number[]
  /** ⚠ EVERY WINTER, BY WHY IT DID OR DID NOT PRODUCE A DEAL (09.08). `wintersOpen`/`wintersSilent`
   *  below count only the winters the post was open in, which is the right denominator for the DICE
   *  and the wrong one for the FLOOR: a season can open bare because nobody wrote, because she
   *  cleared no rung at all, or because she had just let a brand down - three different verdicts on
   *  the fix, and a single "she got nothing" runs them together. `spokenFor` is the fourth and is the
   *  one that does NOT make a season bare: the deal she is under still covers it. */
  wintersReached: number
  wintersNoRung: number
  wintersSpokenFor: number
  wintersLetDown: number
  /** winters in which the post was open to her at all. */
  wintersOpen: number
  /** ...of those, the ones in which no brand wrote. */
  wintersSilent: number
  /** winters probed by replaying them from every entry week (see `probeTheWinter`). */
  wintersProbed: number
  /** ...of those, the ones where an arm that arrived late got a DIFFERENT winter. Must be 0. */
  wintersEntryDependent: number
  /** ...and the letters an arriving-late arm lost against the arm that was there from the open.
   *  The schedule's own number, and the one that was 2 for the owner. Must be 0. */
  lettersLostToLateEntry: number
}

const RETAINER_RE = / retainer – quarterly$/
const APPEARANCE_RE = /^Appearance fee – /
const BONUS_RE = /^Sponsor bonus – /
/** The brand's share of a fare is the LAST percentage on a travel line: `Travel to X – academy 75% +
 *  Brand 25%` or `Travel to X – Brand covers 25%`. The line's own amount is what the family paid
 *  AFTER both covers, so the brand's contribution back-solves as net * s / (1 - s). */
const TRAVEL_SHARE_RE = /(\d+)%\s*$/

/** A world the sponsor review can be run against without touching the career it came from.
 *
 *  `reviewSponsors` writes to exactly three places - `offers` (it pushes letters and stamps the
 *  outgoing deal), `events` and `nextEventId` - and reads everything else. So a shallow spread with
 *  those three replaced is a complete and CHEAP isolation: a full structural clone of a world would
 *  copy a 1,600-strong cohort and a rolling calendar per arm, and this bench takes five arms per
 *  winter per career. */
function reviewArm(world: WorldState): WorldState {
  return { ...world, offers: JSON.parse(JSON.stringify(world.offers)), events: [...world.events] }
}

/** ⚠ THE CATCH-UP MEASUREMENT (06.08). Replay this winter from every week it could be entered on, and
 *  report whether the post that comes out of it depends on WHEN the career met the window.
 *
 *  This is the owner's bug as a number. He merged the window wave, loaded a career sitting at season
 *  week 48 - one week past the window's opening week - and was written to by the LOCAL shop where the
 *  same standing at week 47 was written to by the NATIONAL brand, with no verdict on the outgoing
 *  deal and no goodbye. Entered at 47: three letters. Entered at 48: one, from a worse rung.
 *
 *  Run against the real bench population rather than a fixture, because "the winter does not depend
 *  on the entry week" is a property of every standing and not of a convenient one. Returns the arms'
 *  posts as strings, strongest-rung-first, in arrival order. */
function probeTheWinter(world: WorldState): string[] {
  const opened = sponsorWindowOpensAt(world.week)
  const closed = opened + SPONSOR_WINDOW_WEEKS - 1
  const base = reviewArm(world)
  const known = new Set(base.offers.map((o) => o.id))
  const arms: string[] = []
  for (let entry = opened; entry <= closed; entry++) {
    const arm = reviewArm(base)
    for (let w = entry; w <= closed; w++) {
      arm.week = w
      reviewSponsors(arm)
    }
    arms.push(
      arm.offers
        .filter((o) => o.kind === 'kit' && !known.has(o.id) && o.state !== 'info')
        .map((o) => (o.terms as KitOfferTerms).tier)
        .join(','),
    )
  }
  return arms
}

export function runSponsorCareer(
  preset: Preset,
  policy: Policy,
  sign: SignPolicy,
  index: number,
): CareerResult {
  const { world, rng, seed } = openCareer(preset, index, policy)

  let eligibleWeeks = 0
  let coveredWeeks = 0
  let longestGap = 0
  let longestGapAfterFirst = 0
  let gap = 0
  let firstDealWeek: number | null = null
  let kitCoveredCents = 0
  let retainerCents = 0
  let appearanceCents = 0
  let bonusCents = 0
  let travelCoveredCents = 0
  let incomeCents = 0
  let eventsPlayed = 0
  const seenFinanceWeeks = new Set<number>()
  let seasonsOpened = 0
  let seasonsOpenedBare = 0
  let seasonsOpenedBareAfterPost = 0
  let bareOpeningWeeks = 0
  let bareOpeningRuns = 0
  /** Are we inside a season's opening run of uncovered weeks? Set at the season's first week and
   *  cleared by the first week a deal is in force - see `bareOpeningWeeks`. */
  let inBareOpening = false
  let domesticRefusedWinters = 0
  const domesticRefusedItfRanks: number[] = []
  let wintersReached = 0
  let wintersNoRung = 0
  let wintersSpokenFor = 0
  let wintersLetDown = 0
  let wintersOpen = 0
  let wintersSilent = 0
  let wintersProbed = 0
  let wintersEntryDependent = 0
  let lettersLostToLateEntry = 0
  let windowRungs = 0
  let windowBlocked = false

  for (let i = 0; i < HORIZON_WEEKS; i++) {
    const week = world.week
    // 0. THE WINTER, WATCHED FROM BOTH ENDS – read at the TOP of the week, before the tick runs this
    //    week's review, so the standing and the block are exactly the ones the review will read.
    if (!world.ending && isSponsorWindowOpenWeek(week)) {
      const standing = sponsorStandingOf(world)
      windowRungs = windowLadder(standing).length
      // ⚠ WHO THE DOMESTIC GATE ALONE TURNS AWAY (09.08). Deliberately written out rather than
      // asked of `standingClears`, because the point of the count is to describe the POPULATION on
      // both sides of the gate change - a call to the predicate would answer with whichever gate
      // happens to be compiled in and could not be compared across the two runs.
      if (standing.nationalRank > ECONOMY.sponsorship.maxRank && !standing.wtaRanked) {
        domesticRefusedWinters++
        if (standing.itfRanked) domesticRefusedItfRanks.push(standing.itfRank)
      }
      // ...and the winter's own verdict. Two of the four kinds are legible HERE; the let-down is
      // not, because this reads the top of the opening week and the goodbye letter it is written on
      // has not been posted yet - `reviewSponsors` runs later in this same tick. It is counted at
      // the close instead, where the block below already asks the question.
      wintersReached++
      if (windowRungs === 0) wintersNoRung++
      else if (windowBlocked) wintersSpokenFor++
      // A season already promised to a multi-season deal is not silence, it is the rule biting.
      windowBlocked = seasonSpokenFor(world.offers, week) !== null
      if (windowRungs > 0 && !windowBlocked) {
        const arms = probeTheWinter(world)
        wintersProbed++
        if (new Set(arms).size > 1) wintersEntryDependent++
        const fromOpen = arms[0] === '' ? 0 : arms[0].split(',').length
        for (const arm of arms.slice(1)) {
          lettersLostToLateEntry += Math.max(0, fromOpen - (arm === '' ? 0 : arm.split(',').length))
        }
      }
    }
    if (!world.ending && isSponsorWindowCloseWeek(week) && windowRungs > 0 && !windowBlocked) {
      const opened = sponsorWindowOpensAt(week)
      // ...and a brand that was let down this winter is not silence either: it is the obligation.
      if (!letDownThisWindow(world.offers, week)) {
        wintersOpen++
        const post = world.offers.filter((o) => o.kind === 'kit' && o.week >= opened && o.state !== 'info')
        if (post.length === 0) wintersSilent++
      } else wintersLetDown++
    }
    // 0b. THE SEASON OPENING IN SOMEBODY'S KIT, OR IN NOBODY'S (09.08, fix/sponsor-floor). Read
    //     BEFORE the post is answered, because a letter cannot be signed into force in a week that
    //     has already begun - `dealStartsAt` starts cover the week the parent signs, and the window
    //     that could have covered this season closed at week 51 of the one before. So this is
    //     exactly "she went into the new year with nothing", which is the owner's own report.
    //     Season 0 is skipped: nobody can be written to before week 47 of it.
    const seasonOpens = !world.ending && week > 0 && week % WEEKS_PER_YEAR === 0
    if (seasonOpens) {
      seasonsOpened++
      if (!activeKitDeal(world.offers, week)) seasonsOpenedBare++
    }
    // 1. THE POST, answered before the week is played – the same order a player acts in.
    if (!world.ending) answerThePost(world, sign)

    // 0c. ⚠⚠ ...AND THE SAME QUESTION ASKED AFTER HE HAS ACTED (28.08, round 28 #17-b). Since the
    //     owner's ruling a kit letter carries five weeks from its own arrival, so one raised on
    //     window week 51 is still answerable in weeks 0-3 of the season she is now playing. Step 0b
    //     above reads BEFORE the post and therefore now calls a season bare that he covers the same
    //     morning; this reads after, which is the version a player would recognise, and the run of
    //     uncovered weeks below is the cost the ruling could plausibly have bought.
    if (seasonOpens) {
      if (!activeKitDeal(world.offers, week)) {
        seasonsOpenedBareAfterPost++
        inBareOpening = true
        bareOpeningRuns++
      } else {
        inBareOpening = false
      }
    }
    if (inBareOpening) {
      if (activeKitDeal(world.offers, week)) inBareOpening = false
      else bareOpeningWeeks++
    }

    // 2. COVERAGE, read as the week is played.
    if (week >= FIRST_LETTER_WEEK) {
      eligibleWeeks++
      if (activeKitDeal(world.offers, week)) {
        coveredWeeks++
        gap = 0
        if (firstDealWeek === null) firstDealWeek = week
      } else {
        gap++
        if (gap > longestGap) longestGap = gap
        if (firstDealWeek !== null && gap > longestGapAfterFirst) longestGapAfterFirst = gap
      }
    }

    stepCareerWeek(world, rng, policy)

    // 3. THE CASH LINES, scanned off the news feed at the week they are written. `world.events` is
    //    pruned at 400 ROWS, so a horizon-end scan would silently miss the early seasons – the same
    //    trap the econ bench's prize watch dodges by reading week by week.
    for (const e of world.events) {
      if (e.week !== week) continue
      const amount = e.amountCents ?? 0
      if (e.type === 'income' && amount > 0) {
        if (RETAINER_RE.test(e.text)) retainerCents += amount
        else if (APPEARANCE_RE.test(e.text)) appearanceCents += amount
        else if (BONUS_RE.test(e.text)) bonusCents += amount
      }
      // ⚠ THE ACADEMY'S OWN COVER LOOKS EXACTLY THE SAME AND MUST NOT BE COUNTED HERE. `Travel to X
      //   – academy covers 75%` is a scholarship, not a brand, and folding it in valued a working
      //   family's local string deal at $57k on the first run of this file. The brand is present in
      //   exactly two shapes: `academy A% + Brand B%` and `Brand covers B%`.
      if (e.category === 'travel' && amount < 0) {
        const brandLine = /\+ .*\d+%\s*$/.test(e.text) || (/ covers \d+%\s*$/.test(e.text) && !/academy covers/.test(e.text))
        const m = brandLine ? TRAVEL_SHARE_RE.exec(e.text) : null
        const share = m ? Number(m[1]) / 100 : 0
        if (share > 0 && share < 1) travelCoveredCents += Math.round((-amount * share) / (1 - share))
      }
    }

    // 4. TOTAL INCOME, off the per-week finance ledger (pruned to 60 weeks, so it is read as it
    //    passes). Only fully-past weeks are folded, so a week still collecting rows is never
    //    counted half-written.
    for (const fw of world.financeWeeks) {
      if (fw.week >= world.week || seenFinanceWeeks.has(fw.week)) continue
      seenFinanceWeeks.add(fw.week)
      for (const v of Object.values(fw.byCategory)) if (v > 0) incomeCents += v
    }
  }

  // 5. THE MAIL, read off the inbox at the end – kit letters are NEVER pruned, which is the whole
  //    reason the inbox exists, so this is a complete record of the career's correspondence.
  const raisedByTier: Record<string, number> = {}
  let signed = 0
  let refused = 0
  let expiredUnsigned = 0
  for (const o of world.offers) {
    if (o.kind !== 'kit') continue
    const terms = o.terms as KitOfferTerms
    if (terms.ended) continue // the brand's goodbye is a notice, not a letter she was offered
    if (o.state === 'info') continue
    raisedByTier[terms.tier] = (raisedByTier[terms.tier] ?? 0) + 1
    if (o.state === 'signed') {
      signed++
      kitCoveredCents += o.coveredCents ?? 0
    } else if (o.state === 'refused') refused++
    else if (o.state === 'expired') expiredUnsigned++
  }
  eventsPlayed = world.results.filter((r) => r.playerId === 'kid').length

  const sponsorCents =
    kitCoveredCents + retainerCents + appearanceCents + bonusCents + travelCoveredCents
  return {
    preset: preset.label,
    policy: policy.label,
    sign,
    seed,
    eligibleWeeks,
    coveredWeeks,
    coverage: eligibleWeeks > 0 ? coveredWeeks / eligibleWeeks : 0,
    longestGapWeeks: longestGap,
    longestGapAfterFirstWeeks: longestGapAfterFirst,
    firstDealWeek,
    raisedByTier,
    signed,
    refused,
    expiredUnsigned,
    kitCoveredCents,
    retainerCents,
    appearanceCents,
    bonusCents,
    travelCoveredCents,
    sponsorCents,
    incomeCents,
    eventsPlayed,
    endedWeek: world.ending ? world.week : null,
    seasonsOpened,
    seasonsOpenedBare,
    seasonsOpenedBareAfterPost,
    bareOpeningWeeks,
    bareOpeningRuns,
    domesticRefusedWinters,
    domesticRefusedItfRanks,
    wintersReached,
    wintersNoRung,
    wintersSpokenFor,
    wintersLetDown,
    wintersOpen,
    wintersSilent,
    wintersProbed,
    wintersEntryDependent,
    lettersLostToLateEntry,
  }
}

// --- reporting -------------------------------------------------------------------------------------

function pct(x: number): string {
  return `${(x * 100).toFixed(1)}%`
}
function usd(cents: number): string {
  return `$${Math.round(cents / 100).toLocaleString('en-US')}`
}
function quantile(xs: number[], q: number): number {
  if (xs.length === 0) return 0
  const s = [...xs].sort((a, b) => a - b)
  const i = Math.min(s.length - 1, Math.max(0, Math.round(q * (s.length - 1))))
  return s[i]
}

export function main(argv: string[] = process.argv.slice(2)): void {
  const seedsArg = argv.indexOf('--seeds')
  const seeds = seedsArg >= 0 ? Number(argv[seedsArg + 1]) : DEFAULT_SEEDS
  const jsonArg = argv.indexOf('--json')
  const signArg = argv.indexOf('--sign')
  const signPolicies: SignPolicy[] =
    signArg >= 0 ? [argv[signArg + 1] as SignPolicy] : ['eager', 'patient']

  const rows: CareerResult[] = []
  for (const preset of PRESETS) {
    for (const policy of POLICIES) {
      for (const sign of signPolicies) {
        for (let i = 0; i < seeds; i++) rows.push(runSponsorCareer(preset, policy, sign, i))
      }
    }
  }

  console.log(`\nSPONSOR WINDOW BENCH – ${rows.length} careers x ${HORIZON_WEEKS} weeks`)
  console.log(`coverage measured from week ${FIRST_LETTER_WEEK} to ${HORIZON_WEEKS}\n`)

  for (const sign of signPolicies) {
    const arm = rows.filter((r) => r.sign === sign)
    console.log(`--- signing policy: ${sign} ---`)
    console.log(
      ['preset', 'pol', 'cover', 'gap p50/p90/max', 'gap-after-1st p50/p90/max', 'letters', 'sign', 'ref', 'exp', 'sponsor $', '% income'].join('\t'),
    )
    for (const preset of PRESETS) {
      for (const policy of POLICIES) {
        const cell = arm.filter((r) => r.preset === preset.label && r.policy === policy.label)
        if (cell.length === 0) continue
        const gaps = cell.map((r) => r.longestGapWeeks)
        const after = cell.map((r) => r.longestGapAfterFirstWeeks)
        const letters = cell.map((r) => Object.values(r.raisedByTier).reduce((a, b) => a + b, 0))
        const share = cell.map((r) => (r.incomeCents > 0 ? r.sponsorCents / r.incomeCents : 0))
        console.log(
          [
            preset.label,
            policy.label.slice(0, 7),
            pct(mean(cell.map((r) => r.coverage))),
            `${median(gaps).toFixed(0)}/${quantile(gaps, 0.9).toFixed(0)}/${Math.max(...gaps).toFixed(0)}`,
            `${median(after).toFixed(0)}/${quantile(after, 0.9).toFixed(0)}/${Math.max(...after).toFixed(0)}`,
            mean(letters).toFixed(1),
            mean(cell.map((r) => r.signed)).toFixed(1),
            mean(cell.map((r) => r.refused)).toFixed(1),
            mean(cell.map((r) => r.expiredUnsigned)).toFixed(1),
            usd(mean(cell.map((r) => r.sponsorCents))),
            pct(mean(share)),
          ].join('\t'),
        )
      }
    }
    const gaps = arm.map((r) => r.longestGapWeeks)
    const after = arm.map((r) => r.longestGapAfterFirstWeeks)
    const everSigned = arm.filter((r) => r.firstDealWeek !== null)
    console.log(
      `ALL\tcover ${pct(mean(arm.map((r) => r.coverage)))}\tgap p50 ${median(gaps).toFixed(0)} p90 ${quantile(gaps, 0.9).toFixed(0)} max ${Math.max(...gaps).toFixed(0)}` +
        `\tgap-after-1st p50 ${median(after).toFixed(0)} p90 ${quantile(after, 0.9).toFixed(0)} max ${Math.max(...after).toFixed(0)}` +
        `\tsponsor ${usd(mean(arm.map((r) => r.sponsorCents)))}\tshare ${pct(mean(arm.map((r) => (r.incomeCents > 0 ? r.sponsorCents / r.incomeCents : 0))))}`,
    )
    console.log(
      `  ever covered: ${everSigned.length}/${arm.length} careers; first deal at week p50 ${median(everSigned.map((r) => r.firstDealWeek!)).toFixed(0)}` +
        `\tkit ${usd(mean(arm.map((r) => r.kitCoveredCents)))}  retainer ${usd(mean(arm.map((r) => r.retainerCents)))}` +
        `  appearance ${usd(mean(arm.map((r) => r.appearanceCents)))}  bonus ${usd(mean(arm.map((r) => r.bonusCents)))}  travel ${usd(mean(arm.map((r) => r.travelCoveredCents)))}`,
    )

    // THE FLOOR: split the arm by whether she was actually competing. A career that stops playing
    // should lose its sponsors, so the two halves must NOT read the same.
    const busy = arm.filter((r) => r.eventsPlayed >= median(arm.map((x) => x.eventsPlayed)))
    const quiet = arm.filter((r) => r.eventsPlayed < median(arm.map((x) => x.eventsPlayed)))
    console.log(
      `  competing half (>= median ${median(arm.map((x) => x.eventsPlayed)).toFixed(0)} events): cover ${pct(mean(busy.map((r) => r.coverage)))}, letters ${mean(busy.map((r) => Object.values(r.raisedByTier).reduce((a, b) => a + b, 0))).toFixed(1)}`,
    )
    console.log(
      `  quieter half:                       cover ${pct(mean(quiet.map((r) => r.coverage)))}, letters ${mean(quiet.map((r) => Object.values(r.raisedByTier).reduce((a, b) => a + b, 0))).toFixed(1)}`,
    )

    // ⚠ THE FLOOR, AS THE OWNER COUNTS IT (09.08). Not weeks - SEASONS that began with nothing.
    const opened = arm.reduce((a, r) => a + r.seasonsOpened, 0)
    const bare = arm.reduce((a, r) => a + r.seasonsOpenedBare, 0)
    const bareShare = arm.map((r) => (r.seasonsOpened > 0 ? r.seasonsOpenedBare / r.seasonsOpened : 0))
    console.log(
      `  THE FLOOR:    ${opened} seasons opened (season 1+) – ${bare} of them with NO kit deal (${pct(opened > 0 ? bare / opened : 0)}); per career p50 ${pct(median(bareShare))}, careers never bare ${arm.filter((r) => r.seasonsOpenedBare === 0).length}/${arm.length}`,
    )
    // ⚠⚠ ...AND THE SAME FLOOR AFTER HE HAS ANSWERED THE POST (28.08, round 28 #17-b). The line
    //    above reads before the parent acts, which since the owner's ruling can call a season bare
    //    that he covers the same morning with a letter that is still live in week 0. This is the
    //    version a player would recognise, plus the run of weeks she actually spends uncovered at
    //    the start of a season - the consequence the ruling could plausibly have bought.
    const bareAfter = arm.reduce((a, r) => a + r.seasonsOpenedBareAfterPost, 0)
    const bareWeeks = arm.reduce((a, r) => a + r.bareOpeningWeeks, 0)
    const bareRuns = arm.reduce((a, r) => a + r.bareOpeningRuns, 0)
    console.log(
      `  ...AFTER POST: ${bareAfter} of ${opened} opened bare (${pct(opened > 0 ? bareAfter / opened : 0)}); careers never bare ${arm.filter((r) => r.seasonsOpenedBareAfterPost === 0).length}/${arm.length}` +
        `; uncovered opening weeks ${bareWeeks} over ${bareRuns} runs (mean ${bareRuns > 0 ? (bareWeeks / bareRuns).toFixed(1) : '0.0'} wk), ${(bareWeeks / arm.length).toFixed(1)} wk per career`,
    )
    // ...and WHY the bare ones were bare. Four verdicts, and only three of them can leave a season
    // uncovered - a winter turned away by a running multi-season deal is the deal still working.
    const reached = arm.reduce((a, r) => a + r.wintersReached, 0)
    const noRung = arm.reduce((a, r) => a + r.wintersNoRung, 0)
    const spoken = arm.reduce((a, r) => a + r.wintersSpokenFor, 0)
    const letDown = arm.reduce((a, r) => a + r.wintersLetDown, 0)
    console.log(
      `  ...${reached} winters reached: ${noRung} cleared no rung, ${spoken} already promised, ${letDown} let a brand down, ${arm.reduce((a, r) => a + r.wintersOpen, 0)} open to her`,
    )
    // ...and WHO the domestic gate turns away, which is the number the junior arm's cut is read off.
    const refused = arm.reduce((a, r) => a + r.domesticRefusedWinters, 0)
    const refusedRanks = arm.flatMap((r) => r.domesticRefusedItfRanks)
    console.log(
      `  ...the shop's domestic gate refused her in ${refused} winters; ${refusedRanks.length} of those held a junior world rank` +
        (refusedRanks.length > 0
          ? ` – ITF p10 ${quantile(refusedRanks, 0.1).toFixed(0)} p50 ${median(refusedRanks).toFixed(0)} p90 ${quantile(refusedRanks, 0.9).toFixed(0)}; inside 8: ${refusedRanks.filter((r) => r <= 8).length}, 32: ${refusedRanks.filter((r) => r <= 32).length}, 128: ${refusedRanks.filter((r) => r <= 128).length}`
          : ''),
    )

    // ⚠ THE CATCH-UP NUMBERS (06.08). Two questions that a single "she got nothing" would have run
    // together, and the whole argument turns on keeping them apart.
    const probed = arm.reduce((a, r) => a + r.wintersProbed, 0)
    const dependent = arm.reduce((a, r) => a + r.wintersEntryDependent, 0)
    const lost = arm.reduce((a, r) => a + r.lettersLostToLateEntry, 0)
    const open = arm.reduce((a, r) => a + r.wintersOpen, 0)
    const silent = arm.reduce((a, r) => a + r.wintersSilent, 0)
    console.log(
      `  THE SCHEDULE: ${probed} winters replayed from every entry week – ${dependent} came out different (${pct(probed > 0 ? dependent / probed : 0)}), ${lost} letters lost to arriving late`,
    )
    console.log(
      `  THE DICE:     ${open} winters open to her – ${silent} in which no brand wrote (${pct(open > 0 ? silent / open : 0)}); that is offerChance, and it is the design`,
    )

    // BY RUNG – which brands actually wrote, so a change in the schedule cannot hide behind a total.
    const byTier: Record<string, number> = {}
    for (const r of arm) for (const [t, n] of Object.entries(r.raisedByTier)) byTier[t] = (byTier[t] ?? 0) + n
    console.log(
      `  letters by rung: ${SPONSOR_TIERS.map((t) => `${t} ${((byTier[t] ?? 0) / arm.length).toFixed(2)}`).join('  ')}\n`,
    )
  }

  if (jsonArg >= 0) {
    writeFileSync(argv[jsonArg + 1], JSON.stringify(rows, null, 1))
    console.log(`rows -> ${argv[jsonArg + 1]}`)
  }
}

// The same NAME check econ-bench.ts keeps, and for the reason its own note gives: some runner
// versions hide the file from `process.argv` and leave it only in `npm_lifecycle_script`, so both
// are searched. A name check rather than an unconditional autorun, so importing this file from a
// test (or from another bench) does not launch a six-season sweep.
const NAMED_ON_THE_COMMAND_LINE =
  process.argv.some((a) => a.includes('sponsor-window-bench')) ||
  (process.env.npm_lifecycle_script ?? '').includes('sponsor-window-bench') ||
  process.env.TB_SPONSOR_BENCH_RUN === '1'
if (!process.env.VITEST && NAMED_ON_THE_COMMAND_LINE) main()
