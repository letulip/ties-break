// THE ENDINGS, WIRED INTO THE WORLD: the latch, the two questions, the four-year freeze and the
// guard that stops a stale screen mutating a career that has stopped.
//
// The rules themselves are in `engine/ending.ts` – a leaf that knows nothing about a world. This
// file is the seam: it builds the narrow views that leaf reads, latches what it returns, and owns
// the two commands that are ANSWERS (the fork at nineteen, the natural end's offer).
//
// ⚠ DEPENDENCY DIRECTION. `WorldState` is a TYPE-ONLY import (erased at compile time), so world.ts
// imports these values with no runtime cycle. `resumeFromCollege` is the one piece that stayed in
// world.ts, because spending four years means calling `tickWeek` and that would be a real cycle.
//
// ⚠ RNG: SIX OF THE NINE ENDINGS DRAW NOTHING (it was six of eight until v85 added `'family'`, and
// the count is advanced rather than softened). Bankruptcy, the injury, the fork's two answers and
// the natural end are deterministic – a counter, a post-draw predicate over an injury the
// `seed:injury:<week>` stream has already rolled, an age comparison, or an answer.
//
// ⚠⚠ ROUND 45's TWO DOORS ARE THE EXCEPTION AND THEY TAKE THE HOUSE FORM: ONE draw each, on a
// PURPOSE-SCOPED SUB-STREAM re-derived at the call site (`seed:ending:peak:<season>` /
// `seed:ending:fall:<season>`), persisting nothing, MAIN untouched (CLAUDE.md invariant 2). The
// frozen MAIN capture (41550 / e6b0c709) cannot see them, and a player who plays the season
// differently cannot re-roll the winter she is offered. See `resolveLeaving`.
//
// ⚠⚠ AND v85's `'family'` IS THE THIRD, ON THE SAME FORM AND WITH ONE PROPERTY MORE: `seed:life:return
// :<decisionWeek>` is keyed on a week the RECORD names rather than on `world.week`, so the coin does
// not move because a player left a reveal unopened. ⭐ IT IS ALSO THE ONLY DRAW IN THIS FILE WHOSE
// OTHER OUTCOME IS NOT AN ENDING AT ALL – the same coin either stops the career or re-opens it, which
// is why `resolveReturnDecision` owes two terminal shapes and says so at length.
import { TIERS, TIER_LADDER, WEEKS_PER_YEAR, OFF_SEASON_WEEKS } from '../season/calendar'
import type { AutoEndingView, LeavingView, PlateauView } from '../ending'
import {
  ENDINGS,
  ENDING_TITLE,
  detectEnding,
  endingForFamily,
  endingForForkAnswer,
  endingForLeaving,
  endingForRetirement,
  forkDue,
  lastWordLine,
  leavingDoorDue,
  leavingLine,
  retirementDue,
  debtWeeks,
} from '../ending'
import type { AcademyEpilogue, AdOfferTerms, CareerEnding, CollegeTier, DebtView, DynastyHandover, EndingView, FamilyBackground, ForkAnswer, TierTrophies } from '../../shared/protocol'
// ⭐ ROUND 29 PART TWO #10 – the epilogue's academy line reads the LEAVES, never `world/shop.ts`
// (shop imports THIS file, so the leaf split in `world/assets.ts`' header is what makes this legal):
// the delivered stages off `./assets`, the income off `./business` (assets + fame, both leaves).
import { deliveredAssets, shopCatalogue } from './assets'
import { academyWeeklyIncomeCents } from './business'
import type { LadderTrack, TierId } from '../season/types'
import { addEvent, seasonIndexOf, seasonStartWeek } from './ledger'
import { careerMoney } from './reckoning'
import { activeLadderOf, bestRankEver, bestRankOn } from './ladder'
import { collegeProgressOf, collegeRecruitViewOf, inCollege, measureCollegeOffer } from './college'
// ⭐⭐ v73 – THE PRIVATE LIFE'S WAVE 2. The fork's opening tick raises her opinion of it, and
// `answerFork` will not run until it has been answered. `world/lifeBeat.ts` imports nothing from
// here (it takes `guardNotEndedForGood` from `./constants` for exactly this reason), so this edge
// runs one way only.
// ⚠ AND WAVE 8's T5 TAKES TWO MORE VALUES ACROSS THE SAME ONE-WAY EDGE (`decisionWeekOf`,
// `returnChanceFor`): the pregnancy's arithmetic lives in §14 of that file with the rest of the arc,
// and the LATCH can only live here, so the decision is split exactly the way `resolveLeaving` is –
// the rule in a leaf, the coin and the latch at the one call site.
// ⚠ T6 TAKES A THIRD (`comebackAtReturn`) ON THE SAME SPLIT AND FOR THE SAME REASON: the freeze's
// arithmetic – the ruled rank / 12 / 156 – is a pure function of the pregnancy and belongs with the
// arc, while the WRITE has to happen here, in the one-line window between the draw and the clear.
import { comebackAtReturn, decisionWeekOf, drawForkWant, forkStandingOf, forkWantOf, pendingLifeBeat, raiseLifeBeat, returnChanceFor, FORK_WANT_ANSWER } from './lifeBeat'
// ⚠ A VALUE IMPORT FROM A LEAF, NOT A CYCLE. `engine/collegeOffer.ts` imports only `shared/protocol`
// and `engine/rng`, and `world/college.ts` already imports it – the edge endings -> collegeOffer runs
// the same way. It is here for the cheapest-place fallback in `answerFork` (round 26 #2).
import { COLLEGE_OFFER, COLLEGE_TIER_ORDER, juniorRecordScore } from '../collegeOffer'
// ⚠ A VALUE IMPORT FROM A LEAF ON THE SAME ARGUMENT AS `collegeOffer` ONE LINE UP, AND THE EDGE
// ALREADY EXISTS: `engine/collegeLeague.ts` imports only `world/labels`, `season/names`, `rng` and
// `match/types` – none of which reaches back here – and `world/college.ts`, which this file already
// imports, takes it across the same edge. ⚠ `wonTheLeague` IS THE ONE SPELLING OF «she won it»
// (derived, never a persisted `champion` flag) and `dynastyHandoverOf`'s `collegeTitles` folds it.
import { wonTheLeague } from '../collegeLeague'
// ⚠ THE TWO BASELINES ONLY, and both behind a `??` – the defensive read `accrueSpirit` uses for a
// probe world hand-built before v72. `applyBondDelta` (engine/spirit.ts) stays the one WRITER.
import { ECONOMY } from '../economy'
// ⚠ `temperamentFor` IS THE `??` COURTESY AND NOT A SECOND DERIVATION – the one spelling of
// seed-to-girl, called here for the probe worlds hand-built before v72 exactly as
// `world/lifeBeat.ts`'s private `temperamentOf` calls it. Every real world, created or migrated,
// carries `world.temperament`, so the fallback branch is unreachable in play.
import { applyBondDelta, temperamentFor } from '../spirit'
import { rngFromSeed } from '../rng'
import { nextAcademicYearStart } from '../kidLife'
import { weekLabel, weekMonth, weekStartDay } from '../../shared/dates'
// ⚠ THE ONE SPELLING OF «SHE HOLDS THE DEGREE», IMPORTED AND NEVER RE-STATED – the same predicate
// `world/albumBook.ts` gates the `graduated` occasion on and `CollegeDoneDialog.vue` draws the
// graduation card on. `shared/avatarEmotion.ts` is a leaf (albumBook takes it across the same edge),
// so this costs no new dependency direction. See `dynastyBackgroundFloored`.
import { finishedTheCourse } from '../../shared/avatarEmotion'
import { kidAgeYears } from './age'
// ⚠ A VALUE IMPORT FROM A LEAF, NOT A CYCLE – `engine/development.ts` imports economy, rng, coach
// and plan, and none of them reaches back here. `plateauViewOf` spends it on the share of her peak.
import { physicalMean, resolveAgeCurve } from '../development'
import { buildAlbum, buildScroll } from './album'
import { CAREER_ENDED_REFUSAL, COLLEGE_FREEZE_REFUSAL, guardNotEnded, guardNotEndedForGood } from './constants'
// ⚠ THE ENTRY RULEBOOK, IMPORTED RATHER THAN RE-STATED (round 24, the freeze's hygiene). `answerFork`
// has to hand back the entries the college answer strands, and every rule about what a release
// refunds – the fee, the year's ITF slot, the pro slot, the season mirror, the desk's letter – lives
// in `world/entries.ts` and must go on living in exactly one place. This edge is only legal because
// `guardNotEnded` moved to the leaf above it; see the note beside its definition.
import { releaseEntry } from './entries'
import { reachableFundsCents } from './assets'
import type { WorldState } from '../world'

/** ⚠ THE GUARD, RE-AIMED RATHER THAN ADDED TO EVERY CALLER'S BODY. Every mutating engine command
 *  calls this first: the engine re-validates every command and the worker is not the gate, so a
 *  stale screen (a tab that still shows last week's Calendar behind an epilogue) cannot enter a
 *  tournament for a girl who has retired.
 *
 *  ⚠ AND IT IS A THROW RATHER THAN A SILENT NO-OP, which is the house rule for every other refused
 *  command in this engine (`enterEvent` throws on a passed deadline, `signOffer` on a closed
 *  window). A no-op would let the UI believe the command landed.
 *
 *  ⚠⚠ ITS BODY MOVED TO `world/constants.ts` (round 24) AND IS RE-EXPORTED HERE UNDER ITS HISTORICAL
 *  NAME, so `world.ts`'s barrel and the seven other command modules are untouched. The move is a
 *  dependency fix, not tidiness: `answerFork` below now RELEASES her outstanding entries, the refund
 *  ladder lives in `world/entries.ts`, and `entries.ts` importing this guard back out of here was the
 *  one edge that made that a cycle. See the note beside the definition.
 *
 *  ⚠⚠ AND SINCE ROUND 24 IT SAYS TWO THINGS. A career at COLLEGE is frozen, not finished, and D1's
 *  shell put every one of these controls back under the player's thumb – so the guard now names
 *  which latch it hit (`COLLEGE_FREEZE_REFUSAL` / `CAREER_ENDED_REFUSAL`). `guardNotEndedForGood` is
 *  the same rule minus the freeze, for the two planner cancels; both sentences and both guards are
 *  re-exported here so the command modules keep importing one place. */
export { CAREER_ENDED_REFUSAL, COLLEGE_FREEZE_REFUSAL, guardNotEnded, guardNotEndedForGood }

// --- the views the leaf reads -------------------------------------------------------------------

/** The cheapest entry fee she could still pay for on the visible calendar.
 *
 *  ⚠ ONLY EVENTS WHOSE DEADLINE HAS NOT PASSED COUNT, because "no path back" is about what is still
 *  open to her. An event she can no longer enter is not an option she is failing to afford. */
export function cheapestEntryFeeCents(world: WorldState): number {
  let cheapest = Infinity
  for (const e of world.season) {
    if (e.deadlineWeek < world.week) continue
    const fee = TIERS[e.tier as TierId].entryFeeCents
    if (fee < cheapest) cheapest = fee
  }
  return cheapest === Infinity ? 0 : cheapest
}

export function autoEndingViewOf(world: WorldState): AutoEndingView {
  return {
    week: world.week,
    ageYears: kidAgeYears(world.week, world.profile.birthMonth, world.profile.birthDay),
    // ⭐ D7 (14.09): the ending judges the money she can REACH – the same fact the spell above
    // latches on, so the view and the latch cannot disagree about what «broke» means.
    fundsCents: reachableFundsCents(world),
    debtSinceWeek: world.debtSinceWeek,
    cheapestEntryFeeCents: cheapestEntryFeeCents(world),
    freshInjurySeverity:
      world.injury !== null && world.injury.sinceWeek === world.week ? world.injury.severity : null,
    injuryHistory: world.injuryHistory,
    weeksLostToInjury: world.careerTotals?.weeksLostToInjury ?? 0,
  }
}

/** The season she last CLEARED A RUNG in – the earliest week at the highest tier she ever reached a
 *  final or a title at ON ONE TABLE. Null when she has never reached a final in that table.
 *
 *  ⚠ IT READS `trophiesByTier` AND NOT `bestFinishByTier`, and the difference is the whole point.
 *  The latter is a per-tier HIGH-WATER MARK with no year on it and it is overwritten the week a
 *  silver becomes a gold, so it cannot answer "when". The cabinet keeps every trophy as the WEEK it
 *  happened in, which is exactly what a drought has to be measured against.
 *
 *  ⭐ ROUND-19 #1 – IT TAKES A TABLE NOW, AND IT USED TO WALK ALL SIXTEEN RUNGS AT ONCE. This is the
 *  half of the plateau that asks «has she cleared a rung lately», and it was answering about a
 *  DIFFERENT table from the half that asks «has the rank moved». `TIER_LADDER` is one STRENGTH order
 *  over three tables (its own note says so: domestic, then junior, then the paid rungs), so the
 *  global maximum is a rung on whichever table she climbed highest on – ever. Two consequences, and
 *  the second one is a false plateau rather than a missed one:
 *
 *    * a girl whose table is the national one, with a J300 final at sixteen behind her, has a
 *      `bestRung` of j300 for the rest of her life – so the national final she reached THIS season
 *      is invisible to condition 1, and the plateau is free to fire in the year she cleared the top
 *      rung of the only table anybody is measuring her on;
 *    * and the same girl's junior peak sits years outside the window, which is precisely the
 *      "no rung cleared" that lets the rule continue.
 *
 *  Scoped to one table both halves of the rule speak about the same career. It is the same fix as
 *  the rank window's, applied to the other condition – see `plateauViewOf`.
 *
 *  ⚠ AND IT WALKS `TIER_LADDER` RATHER THAN `Object.keys(world.trophiesByTier)`. The old walk took
 *  the key order of a persisted object as a rung order, and that was true only by luck:
 *  `emptyTrophyLedger` happens to seed every shelf in ladder order, and `finalizeTournament`'s `??=`
 *  happens never to add one. A save whose cabinet predates a rung inserted into the MIDDLE of the
 *  ladder would have appended it at the end – i.e. called it the top rung in the game. The ladder is
 *  the ladder; the cabinet is a record of what is on the shelves.
 *
 *  The walk is ascending, so the last shelf that matches is the highest rung she has reached – no
 *  index arithmetic to get wrong. */
export function lastRungSeasonIndexOf(
  world: WorldState,
  track: LadderTrack = activeLadderOf(world),
): number | null {
  let week: number | null = null
  for (const tier of TIER_LADDER) {
    if (TIERS[tier].track !== track) continue
    // `?.` on the ledger and not only on the shelf – the `copyTrophyLedger` idiom, and for its
    // reason: a save whose cabinet predates a rung has no key for it, and the ladder has grown twice.
    const shelf = world.trophiesByTier?.[tier]
    if (!shelf) continue
    const weeks = [...shelf.titles, ...shelf.finals]
    if (weeks.length === 0) continue
    week = Math.min(...weeks)
  }
  return week === null ? null : seasonIndexOf(week)
}

/** ⭐ ROUND-19 #1 – THE PLATEAU ASKS ITS QUESTION OF THE TABLE SHE IS ON, AND OF NO OTHER.
 *
 *  The owner, twice in consecutive off-seasons: «Дешувка мне уже 2й сезон говорит "в машине", что она
 *  уже сколько-то не двигается никуда, хотя движение по таблице есть и мощное, сейчас на 106 месте,
 *  поднялась за сезон.» Measured on his save (docs/rounds/round-19.md §1, tools/plateau-probe.ts):
 *
 *    | season | `endRank` – what the rule read | `byTrack.wta` – the table she is on |
 *    |     8  | #82  | #136 |
 *    |     9  | #80  | #169 |
 *    |    10  | #77  | #123 |
 *    |    11  | #84  | #106 |
 *
 *  TWO DEFECTS, AND THE FIRST ONE ALONE IS NOT THE FIX.
 *
 *  1. `SeasonHistoryEntry.endRank` is the ITF alias and its own doc comment says so – «⚠ THE ITF ONE,
 *     always». The window was three flat junior numbers (#80/#77/#84, spread 7, inside the band of
 *     20) belonging to a table she stopped competing on years ago, and on which she holds no counting
 *     result at all: #84 is the dense floor of the 0-point tie group, which is the very number
 *     `LadderView.rank` exists to refuse to print. The professional column, over the same seasons,
 *     climbs 169 -> 123 -> 106.
 *
 *  2. `bestBefore` was drawn from her WHOLE career, so it included her junior peak – #6, at sixteen,
 *     on the junior ladder. No professional will ever beat that, so condition 2a was permanently
 *     satisfied for every girl who turns pro and the plateau quietly became a rule about age. Reading
 *     the right column is necessary; staying inside ONE ladder is what makes it sufficient.
 *
 *  ⚠ WHICH LADDER: `activeLadderOf`, THE ENGINE'S ONE ANSWER. It is the same rule the screens read
 *  through `activeLadderOfSnapshot` (which is a reader of `snapshot.activeLadder`, and `toSnapshot`
 *  fills that from this function) – so this is not a second definition of "her table", it is the
 *  engine-side member of the one that already exists. Round-17 #6 used it to stop the fork quoting a
 *  junior rank at a professional; this is the same lesson at the other end of the career.
 *
 *  ⚠ AND A SEASON WITH NO FIGURE IN THAT TABLE IS NOT COMPARABLE, SO IT IS NOT COMPARED. Two kinds of
 *  row are dropped, and they mean the same thing here: rows banked before v46 carry no `byTrack` at
 *  all (and none can be invented – `pruneResults` deleted the evidence years ago), and a row whose
 *  table she held no counting result in has no `endRank` there by design. What is left is what the
 *  window may be built from.
 *
 *  ⚠ SO THE RULE CAN NOW DECLINE TO FIRE, AND THAT IS THE POINT. `plateauReading` needs a COMPLETE
 *  window (all `plateauSeasons` of it – there are only that many season indices in the range, so
 *  `window.length < seasons` IS "a season in it is not comparable") plus at least one comparable
 *  season before it: four comparable seasons on one table, minimum, or no plateau. A career that
 *  cannot answer the question is not told it has answered it. Refusing costs one off-season question
 *  nobody sees; asking wrongly is what he has now been shown twice. */
/** ⭐⭐⭐ HOW MUCH OF HER OWN BODY IS LEFT, AS ONE NUMBER – `physicalMean(skills) / peakPhysical`
 *  (the long goodbye §3a, v62's stored peak). 1 at her peak and falling every week from HER
 *  `declineStart`, which since round 31 #10 is a per-career pair rather than the shipped 29.
 *
 *  ⚠ EXTRACTED FOR ROUND 31 #9 AND FOR ONE REASON ONLY: THERE MAY NOT BE TWO HOMES FOR IT. The
 *  expression lived inline in `plateauViewOf` below, where the ending reads it; the snapshot now
 *  carries it to three screens as well, and a second copy of a ratio is a ratio that can be edited
 *  in one place and not the other. Same arithmetic, one site, both callers.
 *
 *  ⚠ THE NUMERATOR AND THE DENOMINATOR CANNOT COME APART. `physicalMean(world.skills)` and
 *  `world.peakPhysical` are written on ADJACENT LINES of the growth phase (world/phaseGrowth.ts,
 *  step 3b/3b-bis), by the only code in the engine that moves `world.skills` at all, so there is no
 *  week in which one has moved and the other has not.
 *
 *  ⚠ THE DIVISION IS TOTAL. Every attribute is clamped at `ECONOMY.development.floor` (20) and she
 *  is born far above it, so the peak is never 0 – on a fresh world, on a walked one, and on a
 *  migrated one (the v62 migration reconstructs it and `tests/goldenSaves.test.ts` asserts a finite
 *  number at or above today's mean for every fixture).
 *
 *  ⚠ AND IT IS EXACTLY 1 UNTIL SHE IS PAST HER OWN PEAK, which is what makes it a gate as well as a
 *  reading. `growWeek`'s loss term is `declineFactor(...) > 0`, `ageFactor` and `declineFactor` both
 *  read the career's own `ageCurveOf` pair, and the peak is a running maximum taken on the line
 *  after the gain – so the numerator IS the denominator, to the bit, on every week before her
 *  decline starts. Nothing has to know what her `declineStart` is to ask whether she has passed it.
 *
 *  ZERO DRAWS: a division over state the tick has already computed. */
export function physicalShareOf(world: WorldState): number {
  return physicalMean(world.skills) / world.peakPhysical
}

export function plateauViewOf(world: WorldState): PlateauView {
  const track = activeLadderOf(world)
  const seasonEndRanks: { seasonIndex: number; endRank: number }[] = []
  for (const season of world.seasonHistory) {
    const endRank = season.byTrack?.[track]?.endRank
    if (endRank !== undefined) seasonEndRanks.push({ seasonIndex: season.seasonIndex, endRank })
  }
  return {
    ageYears: kidAgeYears(world.week, world.profile.birthMonth, world.profile.birthDay),
    seasonIndex: seasonIndexOf(world.week),
    seasonEndRanks,
    // ...and the OTHER half of the rule is asked of the same table, by construction rather than by
    // coincidence: the track is resolved once, here, and handed down.
    lastRungSeasonIndex: lastRungSeasonIndexOf(world, track),
    // ⭐⭐⭐ v62's STORED PEAK, FINALLY SPENT (the long goodbye step 2, §3a). This is what makes the
    // last offer final instead of her 38th birthday. The arithmetic and every caveat on it are on
    // `physicalShareOf` above, which the snapshot reads too – one home, two callers.
    physicalShare: physicalShareOf(world),
  }
}

/** ⭐⭐⭐ ROUND 45 – WHAT THE TWO DOORS READ, BUILT OFF ONE READING OF ONE TABLE.
 *
 *  ⚠ THE TABLE IS RESOLVED ONCE AND HANDED DOWN, `plateauViewOf`'s own discipline and for its own
 *  reason: the two halves of a collapse (the points and the place) must speak about the same career,
 *  or the rule compares a junior season with a professional one – which is exactly round-19 #1's
 *  defect, arriving through a new door.
 *
 *  ⚠ `professional` IS THE ONE BIT THE LEAF GETS ABOUT THAT TABLE, and it must have it: #10 on a
 *  domestic ladder at fifteen is not a peak, and a junior points collapse is not §3's story. The leaf
 *  still never learns WHICH table it is.
 *
 *  ⚠⚠ THE TEMPERAMENT IS **BIRTH** AND MAY NOT BE `expressedTemperamentOf` – the full argument is on
 *  `LeavingView.temperament` in `engine/ending.ts`. In one line: expression drifts with
 *  `wallsFlipped`, which the psychologist and the shape of the career move, so reading it would make
 *  her own sentence a fact about the PARENT'S MANAGEMENT.
 *
 *  ⚠⚠ AND IT NOW REACHES NO GATE AT ALL. The shipped build read it through `DOOR_BY_TEMPERAMENT`,
 *  which gave each voice one door for life; he deleted that on 17.09 as a career script. What is left
 *  on the view is the VOICE, for `leavingLine`, and both gates are blind to it.
 *
 *  ⚠ `ageYears` IS HER CLOCK AND NOT THE BAND – `kidAgeYears`, the same function `resolveLeaving`
 *  stamps the ending with, so the floor the peak door reads and the age the record prints cannot be a
 *  birthday apart (world/age.ts, ruling 1 of 09.08: «there is ONE clock and it is hers»).
 *
 *  ⚠ THE PREVIOUS SEASON IS THE ONE IMMEDIATELY BEFORE, BY INDEX, AND NEVER "THE LAST ROW IN THE
 *  LIST". A season she spent at college, or one banked before v46 with no `byTrack` at all, is not a
 *  season she fell FROM – it is a gap, and the row simply is not there. `find` on the index is what
 *  makes the absence honest: the guards in `fallLeavingDue` then decline to fire, which is the same
 *  refusal `plateauReading` makes on a short window.
 *
 *  ⚠ CALLED ON THE WRAP WEEK, WHICH IS AFTER `maybeFireSeasonWrapUp` HAS BANKED THE SEASON – both run
 *  on `WEEKS_PER_YEAR - OFF_SEASON_WEEKS` and the wrap runs first (world/phaseAiWeek.ts). So the
 *  "season that just closed" really is in `seasonHistory` by the time this reads for it. ZERO DRAWS. */
export function leavingViewOf(world: WorldState): LeavingView {
  const track = activeLadderOf(world)
  const seasonIndex = seasonIndexOf(world.week)
  const rowOf = (index: number) => world.seasonHistory.find((s) => s.seasonIndex === index)?.byTrack?.[track]
  const now = rowOf(seasonIndex)
  const before = rowOf(seasonIndex - 1)
  return {
    temperament: world.temperament ?? temperamentFor(world.seed),
    seasonIndex,
    ageYears: kidAgeYears(world.week, world.profile.birthMonth, world.profile.birthDay),
    professional: track === 'wta',
    endRank: now?.endRank ?? null,
    prevEndRank: before?.endRank ?? null,
    points: now?.points ?? 0,
    prevPoints: before?.points ?? 0,
    topTitleThisSeason: wonTopTitleInSeason(world),
  }
}

/** Did she win a title at the TOP RUNG OF THE SPORT inside the season that is closing?
 *
 *  ⚠ THE RUNG IS READ OFF THE LADDER'S LAST ENTRY RATHER THAN SPELLED `'slam'`, which is
 *  `lastRungSeasonIndexOf`'s own argument one paragraph up: the ladder is the ladder, and it has
 *  grown twice already. A wave that adds a rung above today's top moves this with it.
 *
 *  ⚠ THE WINDOW IS THE SEASON'S OWN 52-WEEK BLOCK UP TO AND INCLUDING THE WRAP WEEK –
 *  `seasonStartWeek`, the engine's ONE definition of "this season" for money and for the wrap-up, so
 *  a title cannot belong to two seasons or to neither.
 *
 *  ⚠ `?.` ON THE LEDGER AND ON THE SHELF, the `copyTrophyLedger` idiom: a save whose cabinet predates
 *  a rung has no key for it. Pure read, zero draws. */
export function wonTopTitleInSeason(world: WorldState): boolean {
  const top = TIER_LADDER[TIER_LADDER.length - 1]
  const shelf = world.trophiesByTier?.[top]
  if (!shelf) return false
  const from = seasonStartWeek(world.week)
  return shelf.titles.some((w) => w >= from && w <= world.week)
}

// --- the latch ----------------------------------------------------------------------------------

export function latchEnding(world: WorldState, ending: CareerEnding): void {
  world.ending = ending
  // An open question dies with the career it was about – there is nobody left to answer it. The
  // FORK is left standing on purpose: its recorded answer is a fact about the career, not a pending
  // question, and the album's last page reads it.
  world.retirementOffer = null
  addEvent(world, {
    week: world.week,
    type: 'milestone',
    keep: true,
    text: `${ENDING_TITLE[ending.type]} – ${ending.detail}.`,
  })
}

// --- step 7 of a resolved week ------------------------------------------------------------------

/** W2-ENDINGS – THE LAST STEP OF A RESOLVED WEEK. Pure state, zero draws.
 *
 *  ⚠ IT IS NOT CALLED FROM INSIDE `tickWeek`'s BODY BUT FROM THE SAME DEFERRED BLOCK THE RANK
 *  RECOMPUTE AND THE WRAP-UP LIVE IN, for the same reason they do: on a reveal week the tournament
 *  has not paid her yet, so a bankruptcy check there would be reading a bank balance that is about
 *  to change. `finalizeTournament` runs the block when the reveal closes.
 *
 *  ⚠ AND `tickWeek` STILL HAS NO ENDED-WORLD EARLY RETURN. `replayMainState` reconstructs the MAIN
 *  position by re-ticking a default no-input probe world; a probe that latched an ending mid-replay
 *  and stopped would leave every recovered career on a wrong stream. So the latch is read at
 *  `advanceWeeks` and at command level, never inside the tick. */
export function resolveEndings(world: WorldState): void {
  // 7a. THE DEBT SPELL – the warning phase, and it is maintained even on an ended world so the
  //     Money screen keeps telling the truth about a career that went under.
  //     ⚠ ONE SOLVENT WEEK CLEARS IT. That is what makes bankruptcy a spell rather than a floor,
  //     and it is the reason a single catastrophic medical bill can never end a career on its own.
  //     ⭐⭐⭐ D7 (14.09, the owner's «давай попробуем» on the questions doc's §14): THE SPELL READS
  //     THE MONEY SHE CAN **REACH**, never the wallet alone. Measured before the fix: a family that
  //     parked everything at week 0 and took a $10,000 shock was declared bankrupt in 8 of 8
  //     careers, both backgrounds, while the deposit still held $8,106 / $25,332 – a career ENDED,
  //     irreversibly, over money the family had. «Мы ни за что не наказываем» is nowhere stronger
  //     than at the one ending nobody can undo. The raw wallet stays the ledger's and the display's
  //     number; the SPELL – and through it the Money strip's countdown and the ending – judges
  //     `reachableFundsCents` (T12's own helper: wallet + the catalogue-marked cash-parking rows).
  //     ⚠ The strip's copy survives unchanged and TRUE: it never named the wallet – «below zero»
  //     now means below zero of what she can reach, which is the honest zero.
  if (reachableFundsCents(world) < 0) world.debtSinceWeek ??= world.week
  else world.debtSinceWeek = null

  if (world.ending) return

  // 7b. THE TWO THAT HAPPEN TO HER – bankruptcy and the career-ending injury.
  const auto = detectEnding(autoEndingViewOf(world))
  if (auto) {
    latchEnding(world, auto)
    return
  }

  // 7b′. ⭐⭐⭐ v85 T5 – AND THE ONE SHE DECIDES AFTER A CHILD. Inert on every week but the one the
  //      record names; see `resolveReturnDecision` for the draw, the two outcomes and the totality
  //      obligation T3 handed it.
  //
  //      ⚠⚠ THE SLOT IS ARGUED AGAINST THE RANKING THIS FUNCTION ALREADY STATES, both ends.
  //
  //        · **BELOW 7b**, and that half is not free. 7b is «the two that happen to her» – facts that
  //          had already happened by the time `ending.ts` read them – and both of them outrank a
  //          decision that is still being taken: a family whose money ran out has no comeback to
  //          decide about, and the career-ending injury names a body that cannot come back at all.
  //          The file's own ordering said so before this task and this task had no reason to falsify
  //          it. ⚠ The consequence is real and is stated rather than hidden: a career that goes under
  //          inside the pause ends as `'bankruptcy'`, with `world.pregnancy` still non-null. That is
  //          not the leak T3 warned about – `guardNotEnded` refuses every command on an ended world,
  //          so there is no entry gate left to be shut.
  //        · **ABOVE 7c″ (`resolveLeaving`), AND THIS HALF IS LOAD-BEARING.** Those two doors fire on
  //          the off-season wrap week and `decisionWeek` can BE that week – the only real collision
  //          this step has. When both are due, the family decision is the one the player has been
  //          waiting twenty weeks for, and the fall door's own sentence («She stopped after the
  //          fall») would be told about a season she spent off tour, which is his 20.09 blocker's
  //          defect class exactly. Running first settles it through machinery that already exists:
  //          `resolveLeaving` returns on `world.ending !== null`, so round 45 is not touched.
  //        · ABOVE 7c / 7c′ / 7d IS FREE AND SAYING SO IS THE ARGUMENT: the fork and the departure
  //          are asked at 18–19 and refuse once `world.fork` is set, the marriage door needs 23+, and
  //          7d raises an OFFER rather than a latch. None of them can collide with this.
  //
  //      ⚠ A CAREER AT COLLEGE NEVER REACHES THIS LINE AND NEEDS NO CLAUSE FOR IT – the freeze IS a
  //      latch, so 7a's `if (world.ending) return` above has already returned. Checked rather than
  //      assumed, because it is the one state in the game where a career is alive AND `world.ending`
  //      is non-null.
  resolveReturnDecision(world)
  if (world.ending) return

  // 7c. THE FORK, ASKED WHEN SCHOOL ENDS. Raised once, and it BLOCKS until answered.
  //
  // ⭐⭐⭐ ROUND 24 #5 – IT MOVED OFF HER BIRTHDAY («пункт 5 запускай как обсудили»,
  // docs/specs/college-departure-2026-08.md). `forkDue` reads `schoolIsOver` now: the question is
  // asked on `schoolEndWeek` – the 1 September her school years end on, age 18.0–18.9 – the college
  // answer only RESERVES a place (see `answerFork`), and enrolment happens at the DEPARTURE in 7c′
  // below, on the next academic year's own September. The year in between is her last junior season,
  // played. The birthday machinery this line used to ride (`kidAgeThroughWeek`) stays in `world/age.ts`
  // for the next birthday-prompted question; this is no longer one.
  if (world.fork === null && forkDue(world.week, world.profile.birthMonth, false)) {
    // ⭐⭐ THE OFFER IS MEASURED HERE, ONCE, AND PERSISTED (v51,
    // docs/specs/what-the-college-place-costs-2026-08.md). Before this line the third answer was
    // offered unconditionally AND FREE in 100% of careers; now it is offered with a price on it.
    //
    // ⚠⚠ IT IS NOT A GATE AND CANNOT BECOME ONE. `answerFork` still refuses nothing, the card still
    // draws three answers, and the worst offer this can produce is `programme: null` – no programme
    // saw her, she enrols as a walk-on and pays. The rule the owner deleted on 16.08 (a RESULT taking
    // the college answer away) is not re-created from the other side either: `collegeRecruitViewOf`
    // carries no professional rank, finish or prize money at all, so there is no field a tour result
    // could move. The measure is her JUNIOR record, and a better one only ever buys her more.
    world.fork = { askedWeek: world.week, answer: null, offer: measureCollegeOffer(world) }
    // ⭐⭐⭐ v73 – AND THE SAME TICK RAISES HER OPINION OF IT (the private life, wave 2, §3). She is
    // asked FIRST and answered FIRST: `'life'` sits above `'fork'` in `STOP_PRECEDENCE`, and
    // `answerFork` below refuses while her row is unanswered, so the ordering is the engine's and
    // never a dialog convention anybody could reorder (invariant 1).
    raiseForkOpinion(world)
    addEvent(world, {
      week: world.week,
      type: 'milestone',
      keep: true,
      // ⚠ ROUND 24 #5 – she is EIGHTEEN here and the junior rungs are still open for one more
      // season; the old «She is nineteen. The junior ladder is behind her» would assert both wrong.
      text: 'School is over. The junior ladder closes at nineteen, and the next one has to be paid for.',
    })
    return
  }

  // 7c′. THE DEPARTURE – round 24 #5's third moment. Inert on every week but the one it names.
  resolveCollegeDeparture(world)
  if (world.ending) return

  // 7c″. ROUND 45 – THE TWO SHE DECIDES HERSELF, and they are the only endings in this function
  //      that are not a question. It runs ABOVE 7d deliberately: a girl who has already decided is
  //      not asked whether there is another year in this, and an offer raised in the same winter she
  //      leaves would be the game asking a question she has just answered.
  resolveLeaving(world)
  if (world.ending) return

  // 7d. THE NATURAL END'S OFFER. Off-season only, once a year – `isSponsorReviewWeek`'s own week,
  //     which is the first off-season week and no other, so it cannot be raised twice in a season.
  //     ⚠ THE PLATEAU IS A READING OF THIS, NOT A SIXTH MECHANISM (§5.2): it puts the same question
  //     in front of her earlier, and `reason` is what lets the epilogue say which of the two it was.
  if (
    world.retirementOffer === null &&
    world.week % WEEKS_PER_YEAR === WEEKS_PER_YEAR - OFF_SEASON_WEEKS &&
    !inCollege(world)
  ) {
    // ⚠ THE VIEW IS HELD, NOT REBUILT. The line below needs her age and the offer needs her body;
    // both come off ONE reading of the world so the sentence and the verdict cannot be a week apart.
    const view = plateauViewOf(world)
    const offer = retirementDue(view)
    if (offer) {
      world.retirementOffer = { ...offer, askedWeek: world.week }
      addEvent(world, {
        week: world.week,
        type: 'milestone',
        keep: true,
        text: offer.final
          // ⚠ HER AGE, NOT A CONSTANT (the long goodbye step 2) – `ENDINGS.stopAskingAgeYears` is
          // deleted and this line printed it. `view.ageYears` is already whole years.
          // ⭐⭐⭐ AND STEP 4 IS THE REWRITE STEP 2 DEFERRED. It said «Nobody is going to ask her
          // again», which is the GAME announcing that it has stopped asking – she is not in that
          // sentence at all. `lastWordLine` is, and the age stays in front of it because the feed
          // has no kicker to carry it (the card's does, which is why the card renders the line
          // alone). The words themselves live in `engine/ending.ts` and are written once: the same
          // string reaches the feed, the card and the epilogue, so they cannot drift apart.
          ? `She is ${view.ageYears}. ${lastWordLine(world.oneMoreYearCount)}`
          : offer.reason === 'plateau'
            ? 'She said it out loud in the car – if she cannot reach the top, she would rather go.'
            : 'Another off-season, and the same question: is there another year in this?',
      })
    }
  }
}

/** ⚠⚠ **DRAFT – T8's TABLE, NOT SHIPPED COPY** (invariant 4). The one kept row of the arm that does
 *  NOT end the career – the week she says she is going back.
 *
 *  ⚠⚠ IT SAYS SHE IS TRYING AND NEVER THAT SHE IS BACK, and that is the honest split made into a
 *  sentence rather than only into an arithmetic. Whether the comeback WORKS is emergent from T6's
 *  pricing and measured by T9; a row that said «she is back» would be the model announcing an outcome
 *  it has not computed, on the one screen the player reads as a record of what happened.
 *
 *  ⚠ THE SECOND HALF IS THE MECHANICAL FACT AND IS THE REASON THE ROW EXISTS AT ALL. On this week
 *  `world.pregnancy` goes null and 51 weeks of refusals stop – every card on the Season screen quietly
 *  changes its answer – and `landPregnancyPause`'s own argument applies in the mirror: «what is left
 *  is the part a player would otherwise never be told». T6's `'return-plan'` beat asks how; nothing
 *  before this line says THAT.
 *  ⚠ HUSBAND-AGNOSTIC (§0's decoupling ruling) and it names no date beyond this week: which events she
 *  actually plays is the return plan's, and the plan is T6's.
 *  ⚠ NO NEW `LifeBeatKind` AND THEREFORE NO `lifeKind` STAMP – this is a `'milestone'` row through
 *  `addEvent`, which is this file's own idiom for a fact about the career (the fork's «School is
 *  over», the offer's lines, `latchEnding`'s title row) and is outside `wave4-life-row-stamp`'s law by
 *  the same route `landBirth`'s row is. See `resolveReturnDecision` for why the beat is not built. */
const RETURN_EVENT = 'She has decided to go back. From this week she can enter tournaments again.'

/** ⭐⭐⭐ v85 T5 – HER DECISION, AND THE END OF THE ONLY WINDOW IN THE GAME WITH NO UPPER BOUND OF ITS
 *  OWN (`docs/plans/life-wave-8-builder-2026-09.md` §2 T5). T2 wrote `world.pregnancy`, T3 shut the
 *  calendar on it, T4 brought the child; this is the week the record resolves and the ONE place in the
 *  engine `world.pregnancy` goes back to null.
 *
 *  ⚠⚠⚠ **THE TOTALITY OBLIGATION, AND IT IS WHY THIS FUNCTION HAS EXACTLY TWO EXITS.** T3 closed her
 *  entries by reading the record LIVE – `pauseCovering` returns it for every event week at or after
 *  `pausesWeek` – and wrote down that the refusal has no upper bound of its own: «THE RECORD'S OWN
 *  LIFETIME IS THE WINDOW». So a live career left holding a non-null pregnancy, with no ending and no
 *  return, has its entries shut FOR EVER, and nothing in the suite would say so. The paths out are
 *  enumerated rather than trusted, and every one of them lands in one of TWO terminal shapes:
 *
 *      she tries            the record is cleared, `world.ending` stays null – the gate re-opens and
 *                           the career ticks on. T6 hangs its machinery off the seam below.
 *      she does not         the record is cleared AND `latchEnding(… 'family' …)` – `guardNotEnded`
 *                           refuses every mutating command from that week on.
 *      the window «passes»  ⚠⚠ IS NOT A THIRD CASE AND CANNOT BECOME ONE. The guard is `>=` and this
 *                           function is called from `resolveEndings`, which runs on EVERY week (from
 *                           `closeTheWeek`, or deferred to `finalizeTournament` on a reveal week), so
 *                           the first week at or after the date resolves it. There is no branch here
 *                           that reads the date and declines.
 *
 *  ⭐⭐ SO THE WHOLE OBLIGATION IS ONE SENTENCE AND ONE ASSERTION: **THE RECORD NEVER SURVIVES THIS
 *  FUNCTION.** Both arms clear it, which also makes the function idempotent standalone – a second
 *  call, in the same week or twenty years later, returns on the first clause – rather than idempotent
 *  only because `resolveEndings` happens to check `world.ending` three lines above the call. That
 *  distinction is not academic: T4's `landBirth` needed an explicit receipt precisely because its
 *  write did not close its own gate, and a step whose safety lives in its CALLER is a step the next
 *  wave moves and breaks in silence.
 *  ⚠ CLEARING IT ON THE **ENDING** ARM TOO IS THE ONE PLACE THIS PARTS FROM T4's REASONING, and the
 *  difference is worth naming. `landBirth` left the record whole because every field on it was still
 *  true and T5/T6 were its readers; after this function there is no reader left – `world.children`
 *  holds the birth, the milestone holds the album entry, and nothing in `buildEndingView`,
 *  `buildAlbum` or the scroll reads `world.pregnancy` at all (grepped, not assumed). What is left is
 *  state that only a gate could trip over, so it goes.
 *
 *  ⚠⚠ **ONE DRAW, ON THE WINDOW'S OWN WEEK, NOT ONE PER WEEK OF IT.** The brief is explicit («ONE
 *  draw on `seed:life:return:<week>`») and the difference is not cosmetic: a per-week hazard at the
 *  same constant would compound to 1 − 0.35^20, which is certainty, and T9 would bench a model nobody
 *  wrote. `decisionWeekOf` (`world/lifeBeat.ts` §14) is the ONE spelling of which week that is and
 *  carries the three reasons it is the END of the window; the KEY is that week and not `world.week`,
 *  so the coin cannot move because a player took a reveal late – input-independence is permanent law
 *  (invariant 2), and `resolveLeaving`'s own key carries the SEASON for exactly this reason.
 *
 *  ⭐⭐ **THE HONEST SPLIT, AND NOTHING HERE MAY BECOME A SUCCESS RATE.** This draw answers «does she
 *  TRY» – base ~65%, `support`-weighted. Whether the comeback WORKS is EMERGENT from T6's pricing and
 *  is MEASURED, never drawn; 0.65 × ~0.6 ≈ 0.4 is the digest's own «~40% of mothers return
 *  successfully» read as the PRODUCT it is, and T9 checks the product rather than forcing either
 *  factor. `returnChanceFor` is where the weights and their arithmetic live.
 *
 *  ⚠⚠ **IT IS HERS AND NOBODY IS ASKED** (§4a, at the layer's second-biggest moment). No menu opens,
 *  no answer is taken, and the parent's part is already spent: the `support` grade he bought at the
 *  `'expecting'` beat eleven months ago is the biggest single term in the chance.
 *  ⚠ AND NO NEW `LifeBeatKind` IS ADDED FOR IT, which is a decision and not an omission. The brief's
 *  «the parent hears it as a beat» is read as «he is told, not asked» – round 45's two doors are the
 *  precedent, and they tell him through `latchEnding`'s own row. Building a card here would also
 *  collide head-on with T6, whose §2 gives the RETURN WEEK a blocking `'return-plan'` beat: two cards
 *  on one week, one of which asks nothing. The ending arm is carried by the latch's row, the return
 *  arm by `RETURN_EVENT` above, and T8's table gets both.
 *
 *  ⭐⭐⭐ **THE DECOUPLING LAW, SECOND HALF** (RULED 20.09, «развелись и развелись, жизнь
 *  продолжается»). T4 proved the birth needs no `if` about the episode; this proves the decision does
 *  not either. There is not one clause below that mentions `latchedEpisode`, `endedWeek`,
 *  `loveEpisodes` or `episodeId` – a career whose marriage ended mid-term reaches this week, draws the
 *  same coin and reaches the same ending, and §E of the suite walks it and pins the absence
 *  structurally on this function's own text, because a behavioural arm cannot see a clause that
 *  happens not to matter yet.
 *
 *  ⚠ THE SEAM FOR T6 IS MARKED AT THE LINE IT BELONGS ON and is deliberately not built here: the
 *  protected rank and `returnedWeek` are written from the record, BEFORE the clear, into
 *  `world.comeback` (T2½ piece 1's seat, which has no writer on this tree). §2 T6 owns the rank, the
 *  staged factor and the ramp; T5 owns getting the world to a shape T6 can start from. */
export function resolveReturnDecision(world: WorldState): void {
  const pregnancy = world.pregnancy
  if (pregnancy === null) return
  const decisionWeek = decisionWeekOf(pregnancy)
  if (world.week < decisionWeek) return
  // ⚠ ONE READING OF HER AGE, USED BY BOTH THE CHANCE AND THE RECORD – `resolveLeaving`'s own rule
  // («the age the view already read, not a second call»), so the number that weighted the decision and
  // the number the epilogue prints cannot be a birthday apart. ⚠ `??` on the two meters is the
  // defensive read every hand-built probe world in this repo gets (`raiseForkOpinion`, two functions
  // down); every real world, created or migrated, carries both.
  const ageYears = kidAgeYears(world.week, world.profile.birthMonth, world.profile.birthDay)
  const chance = returnChanceFor(
    pregnancy.support,
    world.spirit ?? ECONOMY.spirit.baseline,
    world.bond ?? ECONOMY.bond.start,
    ageYears,
  )
  if (rngFromSeed(`${world.seed}:life:return:${decisionWeek}`)() < chance) {
    // ⭐⭐⭐ SHE TRIES. **THIS IS T6's SEAM AND IT IS THE LINE ABOVE THE CLEAR**: the freeze
    // (`pausesWeek` → her rank that week, 12 entries, 156 weeks) and `returnedWeek` are read off
    // `pregnancy` and written to `world.comeback` HERE, while the record is still standing. T6 adds
    // that one call and the `'return-plan'` beat; nothing else about this function moves.
    // ⚠ AND THE CLEAR IS NOT OPTIONAL AND NOT DEFERRABLE TO T6, which is the one thing a later reader
    // might undo believing it tidier. `pregnancyEligible`'s clause 2 refuses while a record stands and
    // `pauseCovering` refuses every ENTRY while it stands, so a return that left the record in place
    // would be a comeback that can never enter a tournament – T3's finding, and the whole reason this
    // function owes two terminal shapes rather than one.
    // ⚠⚠ THE CONSEQUENCE T5 FLAGGED IS RULED AND BUILT: `PregnancyState.returnPlan` died with the
    // record, so the blocking `'return-plan'` beat had nowhere to put its answer. The architect's
    // RULING A (20.09) MOVED the field onto `ComebackState` – the seat that outlives the pregnancy,
    // which already carries the return's other two facts – and took it OFF `PregnancyState`, because
    // «a dead field left behind is worse than a moved one, the next reader cannot tell it is dead». No
    // migration and no key: v85 stays three keys, and no save in the world holds either record.
    //
    // ⭐⭐⭐ v85 T6 – **AND THIS IS THE SEAM, FILLED.** `world.comeback` had no writer on the whole
    // tree until this line; it has exactly one now and always will (T2½ piece 1's own sentence). Both
    // of its facts are read off `pregnancy` while the record is still standing, one line above the
    // clear, because `rankAtPause` dies with it – `comebackAtReturn` (`world/lifeBeat.ts` §14) is the
    // ONE spelling of the arithmetic and carries the ruled 12 / 156 and the anchor argument.
    // ⚠ ON THIS ARM ONLY. The other exit latches `'family'`: there is no comeback, so there is no
    // record of one, and `guardNotEnded` refuses every entry from that week anyway.
    world.comeback = comebackAtReturn(pregnancy, world.week)
    world.pregnancy = null
    // ⚠ NO `captureMilestone` – the album's milestone channel is what the family KEEPS, and T4's birth
    // is this arc's entry there. A decision to try is news about a season (T3's own distinction).
    addEvent(world, { week: world.week, type: 'milestone', keep: true, text: RETURN_EVENT })
    // ⭐⭐⭐ v85 T6 – **AND THE ONE QUESTION THIS ARC PUTS TO THE PARENT**: the blocking `'return-plan'`
    // beat, raised on the week the calendar re-opens and answered before a single entry can be
    // booked. §4a is UNTOUCHED and this is the reading rather than an exception to it: «SHE decides,
    // the parent REACTS» is a law about HER LIFE, and she has already decided – the coin four lines up
    // is where. What is left is the SCHEDULING, which is what the parent has always decided (the
    // college fork's mechanical questions are the precedent, and §2 T6 says so in as many words).
    //
    // ⚠ AFTER THE ROW AND NOT BEFORE IT, `resolveLeaving`'s own ordering rule («her sentence first,
    // then the record»): the fact that she is back is the news, and the question about how is what
    // the player answers once he has read it.
    //
    // ⚠ THE DETAIL IS THE LITERAL KIND, `'own-key'`'s own shape: there is nothing PER-ROW to record.
    // The comeback it is about is `world.comeback` – one record for one career – and it is deliberately
    // NOT the episode id, because a marriage may have ended months before the return (§0's decoupling
    // ruling) and a detail naming a dead row would invite a reader to gate on it.
    //
    // ⚠ ONCE BY CONSTRUCTION AND WITH NO RECEIPT OF ITS OWN: this function returns on
    // `world.pregnancy === null`, and the line above cleared it, so the raise cannot run twice.
    raiseLifeBeat(world, 'return-plan', 'return-plan')
    return
  }
  // ⭐⭐ SHE DOES NOT, AND THE CAREER STOPS – through `latchEnding`, the ONE seam every other ending
  // uses, so the epilogue, the album and the scroll assemble with no new branch anywhere. That is
  // wave 7½'s totality claim being spent rather than tested for the first time: the four records keyed
  // on `CareerEndingType` carry `'family'` and nothing in `buildEndingView` asks which ending it is.
  // ⚠ THE ABSENCE IS COUNTED FROM `pausesWeek` AND NOT FROM THE ANNOUNCEMENT – the weeks the entries
  // were actually shut, which is what the detail line claims and the only span this ending can name
  // without overstating (she played on for UP TO `playsOnWeeks` after she told him – the trimester
  // cap can close the entries earlier on a long window, the review's T2 fix). Read off the local
  // binding, so the clear one line below cannot take the number out from under it.
  const ending = endingForFamily(world.week, ageYears, world.week - pregnancy.pausesWeek)
  world.pregnancy = null
  latchEnding(world, ending)
}

/** ⭐⭐⭐ ROUND 45 – SHE DECIDES, AND NOBODY IS ASKED (`docs/specs/the-two-more-doors-2026-09.md`).
 *
 *  ⚠⚠ THIS IS THE FIRST ENDING IN THE GAME THAT IS NEITHER AN ANSWER NOR AN ACCIDENT. Four of the
 *  six that came before are answers to a question the game put to the PARENT; the other two
 *  (bankruptcy, the career-ending injury) are facts that had already happened by the time
 *  `ending.ts` read them. These two are hers: she is at the top, or the year fell out from under
 *  her, and she goes. The player is told, not asked.
 *
 *  ⚠⚠ WHICH IS PRECISELY WHY THE RATE IS THE FEATURE'S HARDEST CONSTRAINT, in his own words:
 *  «у обоих не больше 1–2%… это всё-таки событие, которое принудительно заканчивает игру». A door
 *  that ends a career without the player choosing it has to be rare enough to read as a story rather
 *  than as the game being taken away. `ENDINGS.peakLeavingChance` / `fallLeavingChance` are the
 *  per-eligible-off-season knobs, and the CAREER rate they produce is measured by
 *  `tools/two-doors-bench.ts` and recorded predicted-against-measured in the spec's §6 (invariant 5).
 *
 *  ⚠ ONE DRAW, ON A PURPOSE-SCOPED SUB-STREAM, AND NOT ONE DRAW ON A SEASON THE GATE REFUSES.
 *  `seed:ending:<door>:<seasonIndex>` is re-derived at this call site, persists nothing and never
 *  touches MAIN (CLAUDE.md invariant 2) – the frozen capture (41550 / e6b0c709) is untouched by
 *  construction. The KEY carries the door, and since 17.09 that matters for a second reason: with
 *  `DOOR_BY_TEMPERAMENT` deleted the SAME girl can be asked at both doors across a career, so a
 *  shared key would have handed her winter the same coin twice. It carries the SEASON rather than
 *  the week, so the same winter always offers the same coin however the player reached it.
 *
 *  ⚠ THE OFF-SEASON'S OWN WEEK AND NO OTHER – `isSponsorReviewWeek`'s week, the same one 7d uses, so
 *  it cannot fire twice in a season. And BELOW `maybeFireSeasonWrapUp` in the tick, which is what
 *  makes «the season that just closed» a row in `seasonHistory` rather than a season in progress.
 *
 *  ⚠ NOT WHILE SHE IS AT COLLEGE. The freeze is not a career she can leave from, and `inCollege` is
 *  the same guard 7d keeps one block below for the same reason.
 *
 *  ⚠ TWO LEDGER ROWS AND THE ORDER IS THE POINT: HER SENTENCE FIRST, then the record. That is the
 *  natural end's own shape (`lastWordLine` in the feed at the offer, the title row at the latch) and
 *  it is what stops the player reading the game's summary of a leaving before they have read hers.
 *
 *  ⚠ THE LINE IS WRITTEN ONCE, IN `engine/ending.ts`, exactly like `LAST_WORD_OPENING` – so a test
 *  pins the four voices through the symbol instead of through a spelling, and nothing can grow a
 *  second copy of her words in a template. */
export function resolveLeaving(world: WorldState): void {
  if (world.ending !== null) return
  if (world.week % WEEKS_PER_YEAR !== WEEKS_PER_YEAR - OFF_SEASON_WEEKS) return
  if (inCollege(world)) return
  // ⭐⭐⭐ v85 T6 – **AND NOT WHILE A PREGNANCY STANDS** (the architect's RULING B, 20.09, carried to
  // the owner as a ruling to confirm and shipped in a commit of its own so it can be reverted alone).
  //
  // ⚠⚠ THIS IS THE EXISTING RULE MEETING A NEW CASE RATHER THAN NEW DESIGN, and the clause one line
  // ABOVE is the whole argument: the college absence is ALREADY excluded, explicitly, because a
  // freeze is not a career she can leave from. The maternity pause is the game's SECOND kind of
  // absence and the same refusal extends to it. `leavingViewOf`'s own note says it in the sentence
  // this clause is written from: «a season she spent at college … is not a season she fell FROM – it
  // is a gap».
  //
  // ⚠⚠ WITHOUT IT THE FALL DOOR CAN LATCH «She stopped after the fall» ABOUT A SEASON SHE SPENT OFF
  // TOUR HAVING A CHILD, and the three terms of `fallLeavingDue` are exactly what a year of not
  // playing produces: points at most halved, rank at least doubled, thirty places gone. `WINDOW_BY_TRACK`
  // and `windowedBestSum` age her book out BY CONSTRUCTION through the 51 weeks the pause runs, so
  // the instrument reads «her results collapsed» while the truth is «she did not play» – which is his
  // 20.09 blocker's defect class exactly, and it is the one the whole §Ready-to-read design refuses.
  //
  // ⚠ AND IT DELIBERATELY DOES **NOT** COVER THE COMEBACK RAMP, which is the boundary worth writing
  // down. A fall latched in the year AFTER she comes back stays possible and is legitimate: she came
  // back and could not regain it is exactly the research's «~40% return successfully» read from the
  // other side, and suppressing it would hide the wave's own honest outcome. `world.pregnancy` is
  // null from the return week on (`resolveReturnDecision` clears it on both arms), so this clause
  // stops of its own accord on the day the ramp begins – no second date, no window to keep in step.
  //
  // ⚠ THE PLACEMENT IS THE COLLEGE CLAUSE'S: below the wrap-week test, so a career carrying a
  // pregnancy through an ordinary week pays nothing for this line at all.
  // ⭐⭐⭐ v87 T2 – NARROWED TO THE **ANNOUNCEMENT**, NOT WEAKENED, AND THE NARROWING IS WHAT KEEPS
  // THIS CLAUSE DOING WHAT IT ALWAYS DID. Before the hidden window, «a pregnancy exists» and «she
  // has said so» were the same week, and this line has always meant the second: its own note above
  // is about a season she spent OFF TOUR having a child, and the entry gate does not shut until
  // `pausesWeek`, eight weeks after she tells him. The window puts up to twelve weeks between the
  // two – weeks she is playing exactly as before, and weeks the design's §3 says no mechanic may
  // price. Read off the record's existence, this clause would have silently suppressed the fall
  // door for a season she really did fall in, on careers whose only difference is a private girl's
  // draw. So it reads the week she said it, which is the week it always read.
  if (world.pregnancy !== null && world.week >= world.pregnancy.announcedWeek) return
  const view = leavingViewOf(world)
  const door = leavingDoorDue(view)
  if (door === null) return
  const chance = door === 'peak' ? ENDINGS.peakLeavingChance : ENDINGS.fallLeavingChance
  if (rngFromSeed(`${world.seed}:ending:${door}:${view.seasonIndex}`)() >= chance) return
  addEvent(world, {
    week: world.week,
    type: 'milestone',
    keep: true,
    // ⚠ THE DOOR **AND** THE VOICE. Four lines across two doors would have put the collapse's
    // sentence in a champion's mouth the moment `DOOR_BY_TEMPERAMENT` was deleted (17.09).
    text: leavingLine(door, view.temperament),
  })
  // ⚠ THE AGE IS THE ONE THE VIEW ALREADY READ, not a second call to `kidAgeYears` – the peak door's
  // floor and the record's stamp are the same number by construction.
  latchEnding(world, endingForLeaving(door, view, world.week, view.ageYears))
}

/** ⭐⭐⭐ v73 – THE PROVING BEAT: WHAT SHE WANTS, ON THE WEEK THE QUESTION OPENS (wave-2 runbook §3).
 *
 *  ⚠⚠ THE THREE INPUTS, AND THE ONE THAT IS DELIBERATELY ABSENT. Her ladder standing, her `spirit`
 *  and her `bond` weight the draw – ruled 09.09, «a worn-down girl leans `stop`, a close one dares
 *  more». HER TEMPERAMENT DOES NOT AND MAY NOT: who-she-is §3's fence gives the birth trait the
 *  WORDING of how she says it and nothing else, «otherwise temperament becomes a career script».
 *  `drawForkWant` has no temperament parameter, so the fence is a signature rather than a promise.
 *
 *  ⚠ THE STANDING IS THE FORK'S OWN MEASURE, READ ONCE. `juniorRecordScore` over
 *  `collegeRecruitViewOf` is exactly what `measureCollegeOffer` on the line above was written from –
 *  what a programme SAW – so her want and the offer she is looking at come off one reading of one
 *  career rather than two that could disagree by a week.
 *
 *  ⚠ ONE DRAW, ON `seed:life:fork:<seasonIndex>` – a purpose-scoped sub-stream re-derived at the
 *  call site, persisting nothing, MAIN untouched (invariant 2). The frozen capture (41550 /
 *  e6b0c709) cannot see it, and a player who plays the week differently cannot re-roll her want.
 *
 *  ⚠ AND IT WRITES NO `spirit`. It READS her mood and never moves it – life moves spirit, his words
 *  move `bond` (§4a.2's law, kept by this whole wave). */
export function raiseForkOpinion(world: WorldState): void {
  const standing = forkStandingOf(juniorRecordScore(collegeRecruitViewOf(world)), COLLEGE_OFFER.maxJuniorScore)
  const want = drawForkWant(
    world.seed,
    seasonIndexOf(world.week),
    standing,
    world.spirit ?? ECONOMY.spirit.baseline,
    world.bond ?? ECONOMY.bond.start,
  )
  raiseLifeBeat(world, 'fork-opinion', want)
}

// --- the two answers ----------------------------------------------------------------------------

/** ⭐⭐ WHY `answerFork` WILL NOT RUN YET – she has said what she wants and nobody has answered her.
 *
 *  ⚠ EXPORTED SO A TEST CAN PIN THE REFUSAL WITHOUT PINNING A SPELLING, on `COLLEGE_REVEAL_REFUSAL`'s
 *  own precedent: the wording is player-facing (it reaches the toast through the worker's error
 *  channel) and a string literal copied into a test is a rename that breaks a report in silence.
 *
 *  ⚠ IT NAMES THE STATE AND THE WAY OUT (R10-16's doctrine – a refused control with no reason on
 *  screen is the bug), and it shames nobody: the beat's own dialog is already on screen in front of
 *  the fork card, because `'life'` outranks `'fork'` in `STOP_PRECEDENCE`. */
export const FORK_UNHEARD_REFUSAL =
  'She has said what she wants and nobody has answered her – hear her out before answering the fork'

/* ⭐⭐ `collegeStillOpen`, `collegeResultViewOf` AND `entryCostsCollege` WERE HERE, AND ALL THREE GO
 *  ON THE OWNER'S RULING OF 16.08 – see the retired `ENDINGS.collegeClosedFromTier` in `ending.ts`
 *  for the quote and the record. College is an independent branch of the career; nothing closes it
 *  on a result.
 *
 *  ⚠ THE ONE THING WORTH CARRYING FORWARD is what `collegeStillOpen` was NOT: it was never persisted.
 *  It was a pure read of `bestFinishByTier`, derived at snapshot time, so removing it adds no
 *  migration and no fixture – the same property that let it ship without one. `entryCostsCollege`
 *  and `UpcomingEvent.costsCollege` were derived the same way and go the same way.
 *
 *  ⚠ AND THE WARNING GOES BECAUSE IT IS NOW FALSE, WHICH IS A STRONGER REASON THAN "unused". P4 put
 *  *"A result here can cost the college place at nineteen"* on both entry paths – the Season confirm
 *  and the calendar's marker card – and it was true of the rule as it then stood. With the rule gone
 *  the sentence states a consequence that cannot happen, on the one surface where the player is about
 *  to spend money. A false warning on an entry card is worse than no warning. */

/** ⭐⭐⭐ ROUND 24, RULE 1 – AN ENTRY THAT WAS STILL OUTSTANDING WHEN THE FREEZE STARTED IS RELEASED.
 *
 *  ⚠⚠ THIS IS THE ROOT OF THE OWNER'S DEAD CAREER, MEASURED (tools/college-freeze-probe.ts, A1,
 *  21.08). He entered a World Tour 500 for week 270 and answered the fork on week 266. Four weeks
 *  later `resumeFromCollege` ticked THROUGH the event's play week, `tickWeek` step 2 found the entry
 *  and stashed a reveal, and the epilogue screen – which REPLACES the app shell – had no surface that
 *  could answer it. From that week `tickWeek` skipped the whole of step 5-6 (`if
 *  (!world.pendingTournament)`), so `housekeep` / `ensureSeason` / `recomputeRankAndMilestones` never
 *  ran again: 204 weeks with no calendar, no results and no rank. His save at graduation: **0 season
 *  events, 1 result row, and `kidRank` 1** – every row of a 200-strong junior table tied at #1 on
 *  zero points. The same career with the entry released comes out with 164 events, 2,289 rows and her
 *  at 70.
 *
 *  ⚠ THE PROBE'S OWN CONTROL IS THIS RULE. Its `clean` arm empties `world.entries` at the fork by
 *  hand and is healthy on every seed; its `stale` arm books one entry and is dead on every seed. Two
 *  of four plain seed careers reproduced it with no help at all – the two that reached the fork
 *  holding live entries (4 and 3).
 *
 *  ⚠ RELEASING NEVER PUNISHES HER, and that is the owner's law rather than a courtesy («Мы ни за что
 *  не наказываем»). It is the full-refund rung of the withdrawal ladder – fee back, ITF/pro slot back,
 *  the season mirror's row dropped, the desk's letter written in the desk's own voice – and it is the
 *  ONE release that refunds past the entry deadline as well. See `REFUSED_PAST_DEADLINE` in
 *  `world/entries.ts` for why: the forfeiting rungs all price a PULL-OUT, and she is not pulling out
 *  of a tournament – the game is taking her off the tour. No forfeited fee, no `mandatoryBinds`
 *  late-withdrawal points (those live in `cancelEntry`, which this path never touches), no no-show.
 *
 *  ⚠⚠ AND IT IS THE COLLEGE ANSWER ONLY – «стоп», `answerRetirement`, bankruptcy and the
 *  career-ending injury deliberately keep their entries. Two reasons, and the second is decisive.
 *  (a) Nothing ticks behind a terminal ending – `advanceWeeks` returns `['ending']` and college is the
 *  only latch that ever comes off – so a surviving entry there can never become a reveal, which is
 *  the whole hazard. (b) A refund moves `world.fundsCents`, and `resolveEndings` reads that number to
 *  decide the DEBT SPELL and the bankruptcy ending; handing money back on the week a career goes
 *  under would rewrite the verdict that ended it. The album's last page is a record of a life as it
 *  was lived, not a tidy-up.
 *
 *  ⚠ ORPHANS ARE LEFT TO `ensureSeason`. The loop walks `world.season` rather than `world.entries`,
 *  so an id whose event is no longer on the calendar is skipped instead of throwing 'Unknown event'
 *  out of the most expensive click in the game. `ensureSeason` drops those ids on the next housekeep –
 *  it always has – and with the `inCollege` guard in `tickWeek` step 2 an orphan can no longer do
 *  anything on its way out.
 *
 *  ⚠ RNG: ZERO DRAWS, on any stream. `releaseEntry` is pure state plus ledger writes (its own header
 *  says so) and the frozen MAIN capture cannot see it – measured, see the wave's report. */
function releaseEntriesForTheFreeze(world: WorldState): void {
  for (const event of world.season) {
    if (world.entries.includes(event.id)) releaseEntry(world, event.id, 'college')
  }
}

/** ⭐⭐⭐ DOES THE DEPARTURE RESOLVE AT THIS WEEK'S CLOSE? ONE spelling of that question, read by
 *  `resolveCollegeDeparture` below – the step that answers it – and by the knock roll in
 *  `world/phaseGrowth.ts` step 3c, which must not raise a question the latch is about to eat.
 *
 *  ⚠⚠ IT EXISTS BECAUSE THE SECOND READER ARRIVED, AND A SECOND COPY WOULD HAVE BEEN THE PARITY CLASS
 *  (C-06, the 26.09 principles review, P0). The tick rolled the knock in step 3c on every week she was
 *  not yet at college and latched the college ending in step 7c′ of the SAME week, so a knock could
 *  arrive and be latched over: `decideKnock` throws COLLEGE_FREEZE_REFUSAL behind that ending and
 *  `KnockDialog` offers no exit that is not an answer, so the year could not be pressed again.
 *  Measured on 3 of 60 fixture careers and on 2 of 30 that chose college at the real fork. The owner's
 *  ruling is PREVENTION – no knock ARRIVES on the departure week, nothing is retired and nothing
 *  expires – and prevention means the roll has to ask the departure's own question. Asked twice, in
 *  two spellings, it would drift the next time the departure clock moves, and that clock has moved
 *  twice already (round 24 #5 took it off her birthday; the `>=` below took in the migrated saves).
 *
 *  ⚠ IT IS ASKED AT STEP 3c AND ANSWERED AT STEP 7c′ OF THE SAME WEEK, and the one way the two can
 *  differ is harmless BY CONSTRUCTION: a terminal ending latched in between (bankruptcy, the
 *  career-ending injury) voids the reservation, and the roll will already have been skipped – a knock
 *  raised into a career that ends the same week is the same unanswerable question. It cannot differ
 *  the other way: `departsWeek` is booked by `answerFork`, which is a command and not part of a tick,
 *  and `world.college` is written only by the departure itself and by `leaveCollege`.
 *
 *  ⚠ `>=` RATHER THAN `===`, so a save that somehow rests past its departure week (a migrated
 *  career answered under the birthday-era clock, a test walk that ticked through) departs on its
 *  next resolved week instead of never. Enrolment is at `world.week` – the week it actually
 *  happened – and `untilWeek` runs the whole course from there.
 *
 *  ⚠ RNG: ZERO DRAWS on any stream – four state reads. */
export function collegeDepartsThisWeek(world: WorldState): boolean {
  if (world.ending !== null) return false
  const fork = world.fork
  if (!fork || fork.answer !== 'college' || world.college !== null) return false
  const departsWeek = fork.departsWeek ?? null
  return departsWeek !== null && world.week >= departsWeek
}

/** ⭐⭐⭐ ROUND 24 #5 – THE DEPARTURE: the reserved place is taken up on the academic year's own
 *  September. One moment became three (ask / hold / depart), and this is the third.
 *
 *  ⚠ IT RUNS AS STEP 7c′ OF A RESOLVED WEEK, BELOW THE `if (world.ending) return` EARLY-OUT AND
 *  BELOW 7b's AUTO ENDINGS – and it guards on the latch itself as well, because it is exported. A
 *  terminal ending in the gap (bankruptcy, the career-ending injury) therefore VOIDS the
 *  reservation by construction: the career ends, she never departs, `world.college` stays null for
 *  ever, and the epilogue shows no college she never attended (`collegeProgressOf` and
 *  `buildEndingView.college` both read `world.college`). A latched ending is never resurrected –
 *  this function refuses to run behind one, full stop.
 *
 *  ⚠ THE RELEASE FIRES HERE, NOT AT THE ANSWER – the half of the ruling the owner spelled out
 *  («B1's entry release moves with her»). An entry made while she is still on tour before September
 *  IS a commitment she made: an event whose play week lands inside the gap is simply played (its
 *  result stands), and one landing ON the departure week still plays first, because this step runs
 *  in the same deferred block `finalizeTournament` closes the reveal from. Whatever is STILL
 *  outstanding when she leaves is released exactly as B1 releases it: `releaseEntriesForTheFreeze`,
 *  the full-refund rung with the past-deadline exemption and the desk's letter – no penalty of any
 *  kind («мы ни за что не наказываем»).
 *
 *  ⚠ ITS GUARD IS `collegeDepartsThisWeek` AND NOT A COPY OF ONE – the same predicate the knock roll
 *  reads in `world/phaseGrowth.ts` step 3c (C-06, 26.09). The early-outs, the `>=` and the reason it
 *  is `>=` all live in that predicate's own note, one screen up.
 *
 *  ⚠ RNG: ZERO DRAWS on any stream. State writes, ledger rows and `releaseEntry`'s pure refund
 *  arithmetic; the frozen MAIN capture (41550 / e6b0c709) cannot see it. */
export function resolveCollegeDeparture(world: WorldState): void {
  if (!collegeDepartsThisWeek(world)) return
  // ⚠ `untilWeek` IS THE WHOLE COURSE EVEN THOUGH SHE MAY LEAVE AFTER ONE YEAR (P5). It is the
  // contract she signed, and `leaveCollege` (world/college.ts) is what breaks it – by moving this
  // week BACK to the week she leaves, which is what makes `inCollege` false with no second flag.
  world.college = {
    fromWeek: world.week,
    untilWeek: world.week + ENDINGS.collegeYears * WEEKS_PER_YEAR,
    doneWeek: null,
    years: [],
    pendingCallUp: null,
    // ⭐ v56 – the student championship of the year in progress. Null at enrolment: her first one
    // is on the first `COLLEGE_LEAGUE.seasonWeek` the freeze ticks through, and until then there
    // is genuinely nothing on her record for the selectors to read. With departure on a season
    // offset-34 week that first championship is now week 30 of every academic year, two weeks
    // before the call-up that reads it – the §2a enrolment edge survives only in migrated saves.
    pendingLeague: null,
  }
  releaseEntriesForTheFreeze(world)
  const ending = endingForForkAnswer(
    'college',
    world.week,
    kidAgeYears(world.week, world.profile.birthMonth, world.profile.birthDay),
    ENDINGS.collegeYears,
    WEEKS_PER_YEAR,
  )
  if (ending) latchEnding(world, ending)
}

/** THE MOST EXPENSIVE CLICK IN THE GAME (adult spec's own risk note). Three answers, two of which
 *  end the career, and «стоп» must be able to be the right one. */
export function answerFork(world: WorldState, answer: ForkAnswer, tier?: CollegeTier): void {
  guardNotEnded(world)
  if (world.fork === null || world.fork.answer !== null) throw new Error('The fork is not open')
  // ⭐⭐⭐ v73 – HE HEARS HER OUT FIRST, AND THE ENGINE IS WHAT SAYS SO (wave-2 runbook §3.3).
  //
  // ⚠⚠ THIS LINE AND `STOP_PRECEDENCE`'S `'life'` SLOT ARE TWO HALVES OF ONE RULE. The precedence
  // puts her dialog in front of the fork card; this makes the ordering true of the WORLD rather than
  // of the screen, so a stale card, a replayed command or a second surface cannot answer the fork
  // behind her back. That is CLAUDE.md invariant 1 exactly – «every command is re-validated
  // engine-side, so a stale screen cannot corrupt a career» – and it is why the gate is here and not
  // in App.vue.
  //
  // ⚠ BELOW THE «not open» GUARD ON PURPOSE: a fork nobody has raised cannot have an opinion
  // standing in front of it, and the older sentence is the one that describes that case.
  if (pendingLifeBeat(world) !== null) throw new Error(FORK_UNHEARD_REFUSAL)
  // ⚠ #6's ENGINE-SIDE RE-VALIDATION IS GONE WITH THE RULE IT ENFORCED (owner, 16.08). It read:
  // `if (answer === 'college' && !collegeStillOpen(world)) throw` – the courtesy being that the
  // dialog stops drawing the button and this made it a rule rather than a decoration (CLAUDE.md
  // invariant 1). There is no longer a state in which the college answer is refused, so there is
  // nothing for the engine to re-validate: the guard above ("the fork is not open") is still the
  // whole of what this command can refuse, and it is still engine-side.
  world.fork = { ...world.fork, answer }
  // ⭐⭐⭐ v73 – THE SECOND DELTA, AND IT LANDS WHERE THE DEED DOES (wave-2 runbook §3.5).
  //
  // ⚠⚠ TWO DELTAS, SEPARATE ON PURPOSE. The beat's own answer priced what he SAID (+2 / −2 / 0,
  // `answerLifeBeat`); this prices what he DID. «A parent can disagree out loud and then do as she
  // asked» – and a parent can also say all the right things and then take the decision away from
  // her, which is the case a single combined number could not tell apart from either.
  //
  // ⚠ NULL IS NOT A ZERO ROW, IT IS AN ABSENCE. A career whose fork was raised before v73 has no
  // opinion on record and there is nothing to be congruent WITH – so it is charged nothing, which is
  // the same discipline every migration in this repo keeps about facts it cannot reconstruct.
  //
  // ⚠ `bond` ONLY. No spirit, no skill, no money, no string moves here.
  const want = forkWantOf(world)
  if (want !== null) {
    const delta = FORK_WANT_ANSWER[want] === answer ? ECONOMY.bond.delta.forkWithHerWant : ECONOMY.bond.delta.forkAgainstHerWant
    applyBondDelta(world, delta)
  }
  // ⭐⭐⭐ ROUND 31 #10 – THE ROUTE IS DECIDED HERE, SO THE CURVE IS RESOLVED HERE. The owner believed
  // the fork already shaped the age curve («я думал уже так и есть»); it only ever priced it, in lost
  // ranking time. Direct to the tour peaks 22-26 and declines from 27; college keeps today's 23-28.
  //
  // ⚠ THIS WEEK AND NOT `createWorld`, for two reasons that point the same way. The ROUTE does not
  // exist before this line – a curve written at week 0 would have to guess it – and the two ages it
  // carries cannot be read by anything before 18 and 22 respectively, so nothing has gone unmodelled
  // in the fourteen-to-nineteen years this write comes after. See `WorldState.ageCurve`.
  //
  // ⚠ ALL THREE ANSWERS, INCLUDING «stop». The write is above the college branch's early return so a
  // career cannot end up with a route that depends on which of two paragraphs ran; a latched ending
  // simply never reads it. `world.ageCurve` is written ONCE – `answerFork` refuses a second answer at
  // its guard – so this is not a value the rest of the career can drift.
  //
  // ⚠ RNG: `resolveAgeCurve` spends ONE draw on `seed:decline`, a purpose-scoped sub-stream derived
  // at the call site and thrown away (CLAUDE.md invariant 2). It is keyed on the seed ALONE, with no
  // week and no answer in it, so a player's choice cannot re-roll it and the MAIN stream never sees
  // this line: the frozen capture (41550 / e6b0c709) is untouched by construction.
  //
  // ⚠ `injuryFrom: 0` – a career that resolves its own curve pays for every week it has ever lost,
  // junior layoffs included. The non-zero case is the v68 migration's alone.
  const resolved = resolveAgeCurve(world.seed, answer === 'college' ? 'college' : 'direct')
  world.ageCurve = { ...resolved, injuryFrom: 0 }
  if (answer === 'college') {
    // ⭐⭐ THE PLACE SHE PICKED IS RECORDED HERE AND NOWHERE ELSE (17.08, the-college-choice spec).
    //
    // ⭐⭐⭐⭐ ROUND 26 #2, SECOND PASS – THE `q.open` FILTER IS GONE BECAUSE THE FIELD IS (v61). The
    // owner: «по-моему в каждой стране есть домашний универ». There is no place residence shuts any
    // more, so there is nothing here to re-validate AGAINST – the re-validation this block used to do
    // was the engine's half of a rule that no longer exists, and keeping it against an always-true
    // boolean would have been a gate that cannot fire pretending to be one that can.
    //
    // ⚠⚠ AND THE LEGACY SAVE IS EXACTLY WHY THE FIELD HAD TO GO RATHER THAN BE PINNED TRUE. A career
    // sitting on an unanswered fork with `state: {open: false}` persisted would, under a card that now
    // draws that row pressable, have had `find(q => q.tier === 'state' && q.open)` miss and fall
    // through to the next place – the player presses «The university at home» and is quietly enrolled
    // twenty thousand dollars a year away. The v61 migration deletes the key; this line stops reading
    // it; the two together are the whole fix.
    //
    // ⚠ THE FALLBACK IS STILL THE CHEAPEST PLACE, not the dearest and not a preference. A command with
    // no tier is a caller that never asked the player – every bench and every test in this repo – and
    // the cheapest place is the only default that cannot be read as advice. It is `quotes[0]` by
    // construction (`collegeOfferFor` maps `COLLEGE_TIER_ORDER`, cheapest first) but it is looked up
    // through that order rather than by index, so a poked or re-ordered save still gets the cheapest.
    // ⚠ IT NEVER REFUSES THE ANSWER ITSELF: an unknown tier falls back, it does not throw. Nothing
    // removes the college answer (owner, 16.08), including a bad argument.
    const offer = world.fork.offer
    if (offer) {
      const wanted = tier ? (offer.quotes.find((q) => q.tier === tier)?.tier ?? null) : null
      const fallback = COLLEGE_TIER_ORDER.find((t) => offer.quotes.some((q) => q.tier === t)) ?? null
      world.fork = { ...world.fork, offer: { ...offer, chosen: wanted ?? fallback } }
    }
    // ⭐⭐⭐ ROUND 24 #5 – THE ANSWER RESERVES; THE DEPARTURE ENROLS. Nothing freezes here: no
    // `world.college`, no entry release, no latch. She plays the year out – her last junior season,
    // the one the birthday design used to skip – and `resolveCollegeDeparture` (called from
    // `resolveEndings`) executes the move on the next academic year's own September.
    //
    // ⚠ WHAT "RESERVED" MEANS, DECIDED HERE AND HONOURED AT THE DEPARTURE: the quote she picked –
    // the price and the place – exactly as the two lines above froze it. Tier openness was
    // re-validated engine-side AT THIS ANSWER; the departure re-validates nothing and re-measures
    // nothing, which is `ForkState.offer`'s own doctrine («a later re-tune cannot silently re-price
    // a career halfway through a bill it had already accepted») extended across the gap. Her junior
    // record may still improve in the gap year – the programmes signed her on what they saw when
    // they looked, which is what a real recruiting class is.
    //
    // ⚠ STRICTLY AFTER THE ANSWER WEEK (`nextAcademicYearStart`): the ask lands ON a September, so
    // ">= the next one" would enrol her the week she answered and delete the gap. Persisted rather
    // than re-derived at the departure check, because the fork BLOCKS (answer week === ask week
    // today) but an old save's fork may have been asked on its birthday-era week – the honest
    // departure is derived from the week she actually answered, and only this line knows it.
    const departsWeek = nextAcademicYearStart(world.week)
    world.fork = { ...world.fork, departsWeek }
    addEvent(world, {
      week: world.week,
      type: 'milestone',
      keep: true,
      text: `A college place is reserved. She leaves when the academic year starts – ${weekLabel(departsWeek)} – and plays until then.`,
    })
    return
  }
  const ending = endingForForkAnswer(
    answer,
    world.week,
    kidAgeYears(world.week, world.profile.birthMonth, world.profile.birthDay),
    ENDINGS.collegeYears,
    WEEKS_PER_YEAR,
  )
  if (ending) latchEnding(world, ending)
  else
    addEvent(world, {
      week: world.week,
      type: 'milestone',
      keep: true,
      text: 'She is turning professional. Every entry from here has a cheque behind it, and a bill in front of it.',
    })
}

/** The sentence behind a `retire: false` aimed at an offer that was never a question. Exported so a
 *  test can pin the refusal without pinning a spelling, on the precedent of `CAREER_ENDED_REFUSAL`
 *  and `RELEASE_LINE_PREFIX`.
 *
 *  ⚠ IT NAMES THE STATE RATHER THAN SCOLDING THE CALLER, which is `COLLEGE_FREEZE_REFUSAL`'s own
 *  doctrine (R10-16): where the career is, and why this control has nothing to do. It reaches the
 *  player only through the store's error path, and no card in the game can produce it. */
export const LAST_OFFER_NOT_A_QUESTION = 'She has already said this one – there is nothing here left to answer'

/** ⭐⭐⭐ THE FINAL OFFER IS NOT A QUESTION, SO THIS COMMAND IS NOT AN ANSWER TO IT (the long
 *  goodbye step 4, §4). Every NON-final offer is untouched and stays exactly what it was: the
 *  parent's question, the parent's answer, «One more year, she said. Same as last time.»
 *
 *  ⚠⚠ WHAT THIS HEADER USED TO SAY, AND WHY IT IS GONE. It read «AT 38 THE ONLY ANSWER IS YES, AND
 *  THAT IS NOT A RETIREMENT RULE … the copy on the card has to carry the difference between "we are
 *  retiring you" and "nobody is going to ask again"» – an apology for handing the parent a question
 *  with one legal answer, and an instruction to paper over it with wording. The difference is
 *  carried by WHOSE VOICE IT IS now (`LAST_WORD_OPENING` in engine/ending.ts): the last offer is
 *  her statement, the card acknowledges rather than asks, and there is no refusal control on it at
 *  all. Nothing was papered over, so nothing needs the copy to carry it.
 *
 *  ⚠⚠ AND THE REFUSAL BELOW STAYS, WHICH IS THE ONLY PART OF THE OLD RULE THAT WAS EVER LOAD-BEARING.
 *  It is no longer «she may not refuse» – it is «there is nothing here to answer». The guard is not
 *  about her: the worker is not the gate (CLAUDE.md invariant 1), so a hand-built message or a poked
 *  save can still put `retire: false` against a final offer, and a command that accepted it would
 *  increment `oneMoreYearCount` and write «One more year, she said» over a career whose card never
 *  offered those words. That is an illegal state, and the house rule for an illegal command in this
 *  engine is a LOUD refusal, never a silent no-op (`guardNotEnded`'s own note above, and round 24's
 *  `COLLEGE_REVEAL_REFUSAL`: «a silent no-op was the failure and a loud refusal was the fix»).
 *  `mutate` runs commands against a structuredClone, so a throw here leaves the world untouched.
 *
 *  ⚠ WHAT ELSE DEPENDED ON THE OLD THROW, checked before it was re-aimed rather than after: the walk
 *  helper in `tests/ending.test.ts` steps PAST a final offer by nulling it by hand and says in a
 *  comment that it must (still true, and the comment is re-aimed); `tools/potential-band-sweep.ts`
 *  and `tools/his-careers-dose.ts` answer every open offer with `false` unconditionally, so removing
 *  the refusal would have silently ended or silently extended careers inside a measurement. Keeping
 *  the throw keeps all three exactly as they are; only the sentence moved. */
export function answerRetirement(world: WorldState, retire: boolean): void {
  guardNotEnded(world)
  const offer = world.retirementOffer
  if (offer === null) throw new Error('Nobody has asked her')
  if (!retire && offer.final) throw new Error(LAST_OFFER_NOT_A_QUESTION)
  world.retirementOffer = null
  if (!retire) {
    world.oneMoreYearCount += 1
    addEvent(world, {
      week: world.week,
      type: 'milestone',
      keep: true,
      text: 'One more year, she said. Same as last time.',
    })
    return
  }
  latchEnding(
    world,
    endingForRetirement(
      offer,
      world.week,
      kidAgeYears(world.week, world.profile.birthMonth, world.profile.birthDay),
      world.oneMoreYearCount,
    ),
  )
}

// --- the snapshot's epilogue --------------------------------------------------------------------

export function buildEndingView(world: WorldState): EndingView | null {
  const ending = world.ending
  if (!ending) return null
  // ⭐⭐⭐ ROUND 46 #10 – ONE READER, AND WHAT STOOD HERE WAS THE BUG. The fold was
  // `min(seasonHistory[].endRank)` – season CLOSES only, and the ITF one on every row – so a career
  // that spent twenty seasons on the professional table was handed its best JUNIOR year-end. The
  // owner: «некорректный BEST RANK на финале (лучший 27)» over a career that touched #17. Measured
  // over ten walked careers (`tools/album-money-probe.ts --census`), the old fold missed the rank
  // she really held by a mean of 11.6 places and by as much as 20; this one misses by 2.6.
  // `bestRankEver` carries the argument, the table rule and what is still out of reach.
  const best = bestRankEver(world)
  let titles = 0
  for (const tier of Object.keys(world.trophiesByTier) as TierId[]) {
    titles += world.trophiesByTier[tier].titles.length
  }
  return {
    ending,
    album: buildAlbum(world),
    scroll: buildScroll(world),
    handoff: {
      // ⚠ THE SEAM THAT ALWAYS ANSWERS NO IN v1 (§5.6). Pregnancy is post-v1 (§5.4), so there is no
      // state on any world this build can produce that could say yes – and that is precisely why the
      // question is asked HERE, at the hand-off, rather than being retrofitted the day it lands.
      // «Если ребенка родила за игру – то вполне может попробовать продолжить.»
      childBorn: wasThereAChild(world),
      freshCapitalFork: true,
      resumesWeek: ending.resumesWeek,
      resumesAgeYears:
        ending.resumesWeek === null ? null : kidAgeYears(ending.resumesWeek, world.profile.birthMonth, world.profile.birthDay),
    },
    totals: world.careerTotals,
    // ⭐ ROUND 46 #9 – the honest reading of the same three counters, folded once (world/ledger.ts).
    money: careerMoney(world),
    seasonsPlayed: world.seasonHistory.length,
    bestRank: best?.rank ?? null,
    bestRankTrack: best?.track ?? null,
    titles,
    oneMoreYearCount: world.oneMoreYearCount,
    // ⭐ ROUND 29 PART TWO #10 – the academy line, settling the-shop §10.4 by his ruling («Эпилог…
    // надо добавить, мне кажется. Это всё-таки финал игры»). Facts only, composed at snapshot time
    // off the leaves (see the import note above): what stands, out of how many stages, and what it
    // brings in NOW through the same arithmetic the till banks – so the epilogue and the ledger
    // cannot quote two figures. Null when nothing was ever built: the epilogue says nothing rather
    // than naming an absence, which is also why 0-of-N is not a state this field can carry.
    academy: academyEpilogueOf(world),
    // ⭐ ROUND 39 #3 – the lifetime deal SURVIVES the retirement, and this line is the whole of the
    // survival: an ended world no longer ticks, so nothing banks after the ending for ANY source –
    // the academy included, whose line above states income the same way. What outlives the career
    // is the fact on the signed paper, read off its own frozen terms. Null when none was signed.
    lifetimeDeal: lifetimeDealOf(world),
    // ⭐ P5: null on every ending but the college one, and null on that one the moment she leaves.
    // It is the state of an OPEN question – see `collegeProgressOf`.
    college: collegeProgressOf(world),
    // ⭐⭐⭐ v86 (the dynasty, wave 10 T1) – THE BLOCK THAT CROSSES, ON EVERY ENDING. His 20.09
    // ruling is that the door never closes, so this is NOT nullable and there is no ending it is
    // absent on: what forks is the door's TEXT (`raisedOnTour`), never its availability.
    // ⚠ Computed here rather than when the door is taken, for `handoff`'s own reason four fields
    // up: the world is the worker's, the screen only ever sees a `Snapshot`, and a block assembled
    // at the click would have to reach back into a career the UI does not own.
    dynasty: dynastyHandoverOf(world),
  }
}

/** ⭐ ROUND 39 #3 – the signed lifetime deal's epilogue facts, or null. One read of the paper
 *  trail (offers are never pruned), off the frozen terms – the same honesty contract as
 *  `academyEpilogueOf` beside it: the screen quotes what the paper says, never what a template
 *  remembers. Pure read, zero draws. */
export function lifetimeDealOf(world: WorldState): { brand: string; cashCents: number } | null {
  const deal = world.offers.find(
    (o) => o.kind === 'ad' && o.state === 'signed' && (o.terms as AdOfferTerms).lifetime === true,
  )
  if (!deal) return null
  const t = deal.terms as AdOfferTerms
  return { brand: t.brand, cashCents: t.cashCents }
}

/** ⭐⭐⭐ THE HOOK, AND THE DAY IT READS REAL STATE HAS COME (wave 10 T1). It was SUPPOSED to return
 *  `false`: pregnancy was post-v1 (§5.4) so nothing on a v1 world could answer yes – but §5.6's second
 *  sentence made a lineage part of the contract, and a hand-off that cannot even ASK the question is
 *  a hand-off that has to be rewritten rather than extended. One function, one question, and the
 *  promise this comment made is the line below it. ⭐ THE COMMENT IS KEPT RATHER THAN REPLACED,
 *  because what it records is that the seat was built before it was needed and that the prediction
 *  held; only its tense has moved.
 *
 *  ⚠⚠ IT IS THE **ONE** PREDICATE THE DOOR'S TWO TEXTS FORK ON (the dynasty spec §2, his 20.09 ruling
 *  «я бы не стал закрывать эту дверь на совсем»). The door itself is open on EVERY ending
 *  whatever this returns; what it decides is which of the two texts is true – the lived one, which
 *  may state the girl's age, or the epilogue one, which may not, because there is no birth week to
 *  read an age out of. A second spelling of «was there a child» anywhere would be a second answer to
 *  a question with one true answer. */
export function wasThereAChild(world: WorldState): boolean {
  return world.children.length > 0
}

// --- the dynasty (v86, wave 10 T1 – docs/specs/the-dynasty-2026-09.md) -------------------------

/** ⚠⚠ THE ONE SPELLING OF THE ANCESTRY JOIN, and its exact inverse beside it. The child's seed is
 *  `${ancestorSeed}${DYNASTY_SEED_TAG}${generation}` (§3's «deterministic ancestry», the sketch's own
 *  phrase), and `createWorld` has to get the ROOT back out of it, because the handover deliberately
 *  does not carry the root twice.
 *
 *  Written as a pair, here, so the join and the split can never drift into two spellings of one
 *  format – which is this repo's most-caught defect class and the reason `atOrAboveStageBar` exists
 *  one module over. */
export const DYNASTY_SEED_TAG = ':dynasty:'

/** The child's seed for a line rooted at `ancestorSeed`, in her generation. Deterministic and
 *  draw-free: the same ancestor taken through the same rulings always produces the same string. */
export function childSeedFor(ancestorSeed: string, generation: number): string {
  return `${ancestorSeed}${DYNASTY_SEED_TAG}${generation}`
}

/** `childSeedFor`'s exact inverse – the root of the line a child seed belongs to.
 *
 *  ⚠ THE ELSE BRANCH IS REACHABLE ONLY BY A HAND-BUILT HANDOVER (a bench, a probe, a test) whose
 *  `childSeed` was not produced by the function above. For such a seed the honest root IS the seed,
 *  which is the same rule generation one already follows: a line whose ancestry cannot be read
 *  begins here. No engine path can reach it – `dynastyHandoverOf` is the only producer of the
 *  argument and it always joins through `childSeedFor`. */
export function ancestorSeedOf(childSeed: string, generation: number): string {
  const suffix = `${DYNASTY_SEED_TAG}${generation}`
  return childSeed.endsWith(suffix) ? childSeed.slice(0, -suffix.length) : childSeed
}

/** ⭐⭐ §4 – THE WEALTH BAND, MAPPED ONTO THE THREE CORRIDORS THAT ALREADY EXIST, and it invents no
 *  fourth one and no special balance. `ECONOMY.startingFundsCents`'s own comment is the law behind
 *  this: «the whole economy was tuned against them».
 *
 *  ⚠⚠ THE THRESHOLDS **READ** THE SAME CONSTANTS THE BANDS ARE MADE OF, never copies of them. A
 *  hand-typed 120_000_00 here would be a second spelling of the corridor, and the first time the
 *  economy re-tuned, a dynasty would open on a balance no background in the game has.
 *
 *  ⚠ IT READS HER OWN ACCOUNT (`kidFundsCents`, hers since round 23 #18) and NOT the family's:
 *  the mother is the one starting the next family, and the family purse she grew up in belongs to
 *  HER parent. A star with a cabinet retires wealthy; a college-fork mother honestly starts the line
 *  middle or working, which is §4's own sentence.
 *
 *  ⚠⚠ AND SINCE 24.09 THIS IS NO LONGER THE WHOLE OF WHAT THE HANDOVER CARRIES – the paragraph above
 *  is still exactly true OF THIS FUNCTION, which is why it is preserved verbatim, but a reader who
 *  stops here is one layer short of the shipped behaviour. `dynastyHandoverOf` calls
 *  `dynastyBackgroundFloored`, which FLOORS this answer at `middle` for a career that holds the
 *  degree (the college scene's ruling A, his «ок» of 23.09). The cross-reference is the whole of the
 *  edit: nothing about the band arithmetic below moved. */
export function dynastyBackgroundOf(kidFundsCents: number): FamilyBackground {
  const bands = ECONOMY.startingFundsCents
  if (kidFundsCents >= bands.wealthy) return 'wealthy'
  if (kidFundsCents >= bands.middle) return 'middle'
  return 'working'
}

/** ⭐⭐⭐ THE GRADUATE'S FLOOR – HIS «ок» OF 23.09, AND IT READS **THE DEGREE**.
 *
 *  His ruling, verbatim, the sentence that closes the parting's §12: «Предложение в одну строку:
 *  концовка-колледж даёт полку не ниже "середины" - ок» (23.09).
 *
 *  ⚠⚠ A FLOOR AND NEVER A CEILING, which is why it is a wrapper and not an edit one function up.
 *  `dynastyBackgroundOf` stays a pure function of cents with its own boundary pins
 *  (tests/wave10-handover.test.ts §B, every band edge to the cent); this READS its answer and only
 *  refuses to let it sit below middle. A graduate who retires wealthy hands over `'wealthy'`.
 *
 *  ⚠⚠ AND THE READER IS THE DEGREE – NOT THE ENDING TYPE, NOT THE FORK ANSWER. Both alternatives
 *  were MEASURED on this tree before this clause was written, and both are refused by name
 *  (`docs/plans/college-scene-rulings-2026-09.md`, ruling A):
 *
 *   · **THE ENDING TYPE** (`world.ending?.type === 'college'`) HAS NO STATE TO FLOOR. All three
 *     sites that construct a `'college'` latch – `ending.ts`'s `endingForForkAnswer` and twice in
 *     `world.ts` – carry a NON-NULL `resumesWeek`, and `EndingScreen.vue` draws the dynasty control
 *     under `resumes === null && dynasty`, so a college latch cannot open this door at all.
 *     Graduation leaves no latch either: `finishCollege` takes it off for good («NO 'ending' HERE,
 *     AND THE ASYMMETRY IS THE FACT»). A clause on the type would be dead code with a measured share
 *     of zero – and the spec's own sentence «the clause reads the ENDING, not the biography» falls
 *     with it, stated here rather than quietly worked around.
 *   · **THE FORK ANSWER** (`world.fork?.answer === 'college'`) prices a girl who enrolled, played one
 *     year and walked exactly like a graduate. What he ruled on is «a degree and a profession», and
 *     one year is neither.
 *
 *  ⚠ THE CONSEQUENCE, STATED RATHER THAN HIDDEN: a graduate who then had a full tour career and
 *  retired thin reads `middle` too. The degree does not stop being a degree when the tour is over –
 *  it is the honest reading of the ruling, and it is question 1 of the wave's report.
 *
 *  ⚠ EXPORTED, AND DELIBERATELY **NOT** ADDED TO THE `engine/world` BARREL. It has a second reader –
 *  `tools/dynasty-bench.ts`'s §4 guard, which re-derives the band to prove the block and the mapping
 *  cannot be two spellings of one rule, and which would cry wolf on every graduate if it kept reading
 *  the unfloored function. One spelling, two readers. The barrel's re-export list is the public API
 *  that `tools/generated/world-symbol-map.md` indexes, and a probe-grade helper does not belong on
 *  it: tools import `world/endings` directly (`tools/album-money-probe.ts` is the precedent). */
export function dynastyBackgroundFloored(world: WorldState): FamilyBackground {
  const band = dynastyBackgroundOf(world.kidFundsCents)
  if (band !== 'working') return band
  const college = world.college
  const graduated = college?.doneWeek != null && finishedTheCourse(college.years.length, ENDINGS.collegeYears)
  return graduated ? 'middle' : band
}

/** ⭐⭐⭐ THE INHERITANCE BLOCK – THE ONLY THING THAT CROSSES FROM ONE CAREER TO THE NEXT (§3).
 *
 *  Built at the ENDING, carried on the ending view, and consumed by `createWorld` as its fifth
 *  optional argument – `PrologueHandover`'s precedent, verbatim. Pure read, ZERO DRAWS: every field
 *  is a question asked of records the world already keeps, so this is safe to call from the snapshot
 *  assembly, from a bench and from a test in any order, and the frozen MAIN capture cannot see it.
 *
 *  ⚠⚠ IT IS BUILT ON EVERY ENDING AND THE DOOR NEVER CLOSES – his 20.09 ruling in one line: «Может
 *  игрок хотел династию, но за время его игры ребенка просто не случилось». What the mother's own
 *  story prices is the TEXTURE, never the availability: a college-fork career hands over humbler
 *  facts and licenses none of the «дочь той самой» lines (§5).
 *
 *  ⚠ `titles` IS THE SAME FOLD `buildEndingView` DOES FOR ITS OWN COUNT, deliberately not extracted
 *  into a helper the two would share: it is four lines over a ledger both of them already hold, and
 *  the pair is asserted equal in tests/wave10-handover.test.ts §A rather than trusted. ⭐ Extracting
 *  it would be the right call the moment a THIRD reader appears.
 *
 *  ⚠ `motherTemperament` TAKES THE `??` COURTESY this file already uses at `answerFork` – it is the
 *  one spelling of «her birth temperament» for a world that predates v72, not a second derivation. */
export function dynastyHandoverOf(world: WorldState): DynastyHandover {
  const generation = (world.dynasty?.generation ?? 0) + 1
  const ancestorRoot = world.dynasty?.ancestorSeed ?? world.seed
  // ⚠⚠ THE PRO TABLE, NEVER `bestRankEver` (the architect's review, 22.09). `bestRankEver` answers
  // for the highest ladder REACHED, so a junior-only career hands over a junior rank as a bare
  // number – and a junior #3 walked straight through `motherWasKnown`, whose bar is a WTA-table
  // number (D1: standing, never fame). «Unranked is not rank one» has a sibling: a junior rank is
  // not a WTA rank. The probe row that caught it read «bestRank 3» on an 89-week-old career.
  const best = bestRankOn(world, 'wta')
  let titles = 0
  let proTitles = 0
  for (const tier of Object.keys(world.trophiesByTier) as TierId[]) {
    const n = world.trophiesByTier[tier].titles.length
    titles += n
    // The catalogue's own track field, never a hand list of rungs – the same one-table rule that
    // keeps `atOrAboveStageBar` honest. Junior and domestic shelves stay in `titles` (the album's
    // whole-cabinet count); only the shelves that were PLAYED ON THE TOUR reach `proTitles`.
    if (TIERS[tier]?.track === 'wta') proTitles += n
  }
  // ⚠ WIDENED ON PURPOSE – see the note over `slams` below. The declared type is a total record and
  // a migrated save is not one; writing the widening down is what stops the next reader "tidying"
  // the optional chain away.
  const slamShelf: TierTrophies | undefined = world.trophiesByTier.slam
  // ⭐⭐⭐ v89 (the college scene, T4) – THE STUDENT CABINET, FOLDED OFF THE BANKED YEARS. Two
  // conditions and neither is decorative: `year.league !== null` because a banked year legitimately
  // holds no championship (a v55 save migrated mid-freeze, a year an ending cut short before
  // `COLLEGE_LEAGUE.seasonWeek` – `CollegeYear.league`'s own note lists both), and `wonTheLeague`
  // because a year she PLAYED is not a year she WON. ⚠ The predicate is IMPORTED and never re-spelled
  // as `roundsWon === rounds`: a second spelling of «she won it» is how a derived fact and a stored
  // one come to disagree, which is the argument `wonTheLeague` itself is written under.
  // ⚠ ZERO DRAWS, like every other line of this block – `world.college.years` is persisted state.
  let collegeTitles = 0
  for (const year of world.college?.years ?? []) {
    if (year.league !== null && wonTheLeague(year.league)) collegeTitles += 1
  }
  return {
    generation,
    childSeed: childSeedFor(ancestorRoot, generation),
    // ⭐ THE FLOORED READ (the college scene, T1 – his «ок» of 23.09). `dynastyBackgroundFloored`
    // holds the whole clause and the two refusals behind it; the band itself is still
    // `dynastyBackgroundOf`'s, unwidened.
    background: dynastyBackgroundFloored(world),
    raisedOnTour: wasThereAChild(world),
    motherName: { first: world.profile.kidName, last: world.profile.kidLastName },
    // §6.2 – the identity card pre-fills the country from hers and leaves it EDITABLE. See the field's
    // own note for why it is on the block at all: nothing else that crosses could carry it.
    motherCountry: world.profile.country,
    // T10 (his 22.09 ruling) – the real birth dates, derived from the recorded weeks through the ONE
    // calendar (`weekMonth`/`weekStartDay`): the date of the Monday her birth week started on. The
    // epilogue variant maps an empty array, which is the field's own «no recorded birth» state.
    childBirthdays: world.children.map((c) => ({ month: weekMonth(c.bornWeek), day: weekStartDay(c.bornWeek) })),
    motherTemperament: world.temperament ?? temperamentFor(world.seed),
    motherCareer: {
      titles,
      proTitles,
      // ⭐ v89 – beside `proTitles` because the two cabinets are read as a pair and the copy forks on
      // the pair; the fold and the reason it is two conditions are above.
      collegeTitles,
      bestRank: best,
      // ⚠⚠ THE OPTIONAL READ IS NOT DEFENSIVENESS – IT IS THE MEASURED TRUTH ABOUT A MIGRATED SAVE,
      // AND WITHOUT IT THIS LINE **THREW**. The type says `Record<TierId, TierTrophies>` and a fresh
      // career really does carry all sixteen rungs (`emptyTrophyLedger`), but **42 of the 87 golden
      // fixtures carry nine**: every save from v31 up to the day W3-ACT2 added `wta125`, `wta250`,
      // `wta500`, `wta1000` and `slam`, and no migration back-fills the new shelves. So
      // `trophiesByTier.slam` is genuinely `undefined` on a career that predates the ladder, and
      // reading `.titles.length` off it crashed the ending screen of exactly those careers. Caught by
      // tests/ending.test.ts's «a career saved before this wave existed … reaches a real ending»,
      // which is the case that exists for this.
      // ⭐ THE `titles` FOLD ABOVE NEVER HAD THE PROBLEM because it walks `Object.keys` – it counts the
      // shelves that are there. This line NAMES one, so it has to ask whether it is there.
      slams: slamShelf?.titles.length ?? 0,
      // ⚠ THE WEEK THE STORY STOPPED, off the latched ending rather than off `world.week`: a career
      // sits on its ending screen for as long as the player leaves it there, and the week she stopped
      // is not the week he closed the app.
      endedWeek: world.ending?.week ?? world.week,
      endingKind: world.ending?.type ?? '',
    },
  }
}

/** ⭐ ROUND 29 PART TWO #10 – the epilogue's academy facts, or null when no stage was ever built.
 *
 *  DELIVERED stages – and since round 41 #24 (12.09) the distinction is LIVE, not hypothetical:
 *  the courts, the clubhouse and the staff carry `buildWeeks` now (the land alone does not), so an
 *  owned stage under construction is not yet a delivered one. «A contract is not a business»
 *  keeps holding here for free, exactly as this comment predicted, the same way it already does
 *  in the income arithmetic this shares (`assetWeeklyIncomeCents` gates on the same predicate).
 *
 *  ⚠ `totalStages` COUNTS THE CATALOGUE rather than quoting 4, for `CollegeProgressView
 *  .totalYears`' own reason: the copy must never say «four» from a template, and a fifth stage
 *  added to the catalogue tomorrow moves the sentence by itself. Zero draws, pure read. */
export function academyEpilogueOf(world: WorldState): AcademyEpilogue | null {
  const stagesBuilt = deliveredAssets(world).filter((row) => row.item.family === 'academy').length
  if (stagesBuilt === 0) return null
  return {
    stagesBuilt,
    totalStages: shopCatalogue().filter((i) => i.family === 'academy').length,
    weeklyIncomeCents: academyWeeklyIncomeCents(world),
  }
}

/** The debt strip's numbers, or null while she is solvent. */
export function buildDebtView(world: WorldState): DebtView | null {
  if (world.debtSinceWeek === null) return null
  return {
    sinceWeek: world.debtSinceWeek,
    weeks: debtWeeks({ week: world.week, debtSinceWeek: world.debtSinceWeek }),
    graceWeeks: ENDINGS.bankruptcyGraceWeeks,
  }
}
