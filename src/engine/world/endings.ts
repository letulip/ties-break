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
// ⚠ RNG: NOTHING HERE DRAWS. Every ending is deterministic – a counter, a post-draw predicate over
// an injury the `seed:injury:<week>` stream has already rolled, an age comparison, or an answer.
import { TIERS, TIER_LADDER, WEEKS_PER_YEAR, OFF_SEASON_WEEKS } from '../season/calendar'
import type { AutoEndingView, PlateauView } from '../ending'
import {
  ENDINGS,
  ENDING_TITLE,
  detectEnding,
  endingForForkAnswer,
  endingForRetirement,
  forkDue,
  retirementDue,
  debtWeeks,
} from '../ending'
import type { CareerEnding, CollegeTier, DebtView, EndingView, ForkAnswer } from '../../shared/protocol'
import type { LadderTrack, TierId } from '../season/types'
import { addEvent, seasonIndexOf } from './ledger'
import { activeLadderOf } from './ladder'
import { collegeProgressOf, inCollege, measureCollegeOffer } from './college'
import { kidAgeThroughWeek, kidAgeYears } from './age'
import { buildAlbum, buildScroll } from './album'
import type { WorldState } from '../world'

/** ⚠ THE GUARD, RE-AIMED RATHER THAN ADDED TO EVERY CALLER'S BODY. Every mutating engine command
 *  calls this first: the engine re-validates every command and the worker is not the gate, so a
 *  stale screen (a tab that still shows last week's Calendar behind an epilogue) cannot enter a
 *  tournament for a girl who has retired.
 *
 *  ⚠ AND IT IS A THROW RATHER THAN A SILENT NO-OP, which is the house rule for every other refused
 *  command in this engine (`enterEvent` throws on a passed deadline, `signOffer` on a closed
 *  window). A no-op would let the UI believe the command landed. */
export function guardNotEnded(world: WorldState): void {
  if (world.ending) throw new Error('This career has ended')
}

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
    fundsCents: world.fundsCents,
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
  }
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
  if (world.fundsCents < 0) world.debtSinceWeek ??= world.week
  else world.debtSinceWeek = null

  if (world.ending) return

  // 7b. THE TWO THAT HAPPEN TO HER – bankruptcy and the career-ending injury.
  const auto = detectEnding(autoEndingViewOf(world))
  if (auto) {
    latchEnding(world, auto)
    return
  }

  // 7c. THE FORK AT NINETEEN. Raised once, on the birthday week, and it BLOCKS until answered.
  //
  // ⚠ `kidAgeThroughWeek` AND NOT `kidAgeAt` (18.08), so that first sentence stays true. The date
  // clock turns her age on the week's MONDAY; her birthday lands on whatever day it lands on. Asking
  // the Monday's age raised this a week AFTER the cake for every girl not born on a Monday - and the
  // whole design of the fork is that it is the birthday's own question. See that helper for why this
  // look-ahead is for celebrations and never for gates.
  if (world.fork === null && forkDue(kidAgeThroughWeek(world, world.week), false)) {
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
    addEvent(world, {
      week: world.week,
      type: 'milestone',
      keep: true,
      text: 'She is nineteen. The junior ladder is behind her, and the next one has to be paid for.',
    })
    return
  }

  // 7d. THE NATURAL END'S OFFER. Off-season only, once a year – `isSponsorReviewWeek`'s own week,
  //     which is the first off-season week and no other, so it cannot be raised twice in a season.
  //     ⚠ THE PLATEAU IS A READING OF THIS, NOT A SIXTH MECHANISM (§5.2): it puts the same question
  //     in front of her earlier, and `reason` is what lets the epilogue say which of the two it was.
  if (
    world.retirementOffer === null &&
    world.week % WEEKS_PER_YEAR === WEEKS_PER_YEAR - OFF_SEASON_WEEKS &&
    !inCollege(world)
  ) {
    const offer = retirementDue(plateauViewOf(world))
    if (offer) {
      world.retirementOffer = { ...offer, askedWeek: world.week }
      addEvent(world, {
        week: world.week,
        type: 'milestone',
        keep: true,
        text: offer.final
          ? `She is ${ENDINGS.stopAskingAgeYears}. Nobody is going to ask her again.`
          : offer.reason === 'plateau'
            ? 'She said it out loud in the car – if she cannot reach the top, she would rather go.'
            : 'Another off-season, and the same question: is there another year in this?',
      })
    }
  }
}

// --- the two answers ----------------------------------------------------------------------------

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

/** THE MOST EXPENSIVE CLICK IN THE GAME (adult spec's own risk note). Three answers, two of which
 *  end the career, and «стоп» must be able to be the right one. */
export function answerFork(world: WorldState, answer: ForkAnswer, tier?: CollegeTier): void {
  guardNotEnded(world)
  if (world.fork === null || world.fork.answer !== null) throw new Error('The fork is not open')
  // ⚠ #6's ENGINE-SIDE RE-VALIDATION IS GONE WITH THE RULE IT ENFORCED (owner, 16.08). It read:
  // `if (answer === 'college' && !collegeStillOpen(world)) throw` – the courtesy being that the
  // dialog stops drawing the button and this made it a rule rather than a decoration (CLAUDE.md
  // invariant 1). There is no longer a state in which the college answer is refused, so there is
  // nothing for the engine to re-validate: the guard above ("the fork is not open") is still the
  // whole of what this command can refuse, and it is still engine-side.
  world.fork = { ...world.fork, answer }
  if (answer === 'college') {
    // ⭐⭐ THE PLACE SHE PICKED IS RECORDED HERE AND NOWHERE ELSE (17.08, the-college-choice spec).
    //
    // ⚠⚠ IT IS RE-VALIDATED ENGINE-SIDE, WHICH IS CLAUDE.md INVARIANT 1 READ LITERALLY. The card
    // stops drawing a place residence shuts; this is what makes that a RULE rather than a decoration,
    // and a stale screen cannot enrol her somewhere she cannot be.
    //
    // ⚠ AND THE FALLBACK IS THE CHEAPEST PLACE OPEN TO HER, not the dearest and not a preference. A
    // command with no tier is a caller that never asked the player – every bench and every test in
    // this repo – and the cheapest open place is the only default that cannot be read as advice.
    // ⚠ IT NEVER REFUSES THE ANSWER ITSELF: an unknown or shut tier falls back, it does not throw.
    // Nothing removes the college answer (owner, 16.08), including a bad argument.
    const offer = world.fork.offer
    if (offer) {
      const wanted = tier ? (offer.quotes.find((q) => q.tier === tier && q.open)?.tier ?? null) : null
      const fallback = offer.quotes.find((q) => q.open)?.tier ?? null
      world.fork = { ...world.fork, offer: { ...offer, chosen: wanted ?? fallback } }
    }
    // ⚠ `untilWeek` IS THE WHOLE COURSE EVEN THOUGH SHE MAY LEAVE AFTER ONE YEAR (P5). It is the
    // contract she signed, and `leaveCollege` (world/college.ts) is what breaks it – by moving this
    // week BACK to the week she leaves, which is what makes `inCollege` false with no second flag.
    world.college = {
      fromWeek: world.week,
      untilWeek: world.week + ENDINGS.collegeYears * WEEKS_PER_YEAR,
      doneWeek: null,
      years: [],
      pendingCallUp: null,
    }
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

/** ⚠ AT 38 THE ONLY ANSWER IS YES, AND THAT IS NOT A RETIREMENT RULE. `final` means the question has
 *  run out, so refusing it is not a thing the game offers – §5.3, and the copy on the card has to
 *  carry the difference between "we are retiring you" and "nobody is going to ask again". */
export function answerRetirement(world: WorldState, retire: boolean): void {
  guardNotEnded(world)
  const offer = world.retirementOffer
  if (offer === null) throw new Error('Nobody has asked her')
  if (!retire && offer.final) throw new Error('This was the last time anybody asked')
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
  let bestRank: number | null = null
  for (const s of world.seasonHistory) if (bestRank === null || s.endRank < bestRank) bestRank = s.endRank
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
    seasonsPlayed: world.seasonHistory.length,
    bestRank,
    titles,
    oneMoreYearCount: world.oneMoreYearCount,
    // ⭐ P5: null on every ending but the college one, and null on that one the moment she leaves.
    // It is the state of an OPEN question – see `collegeProgressOf`.
    college: collegeProgressOf(world),
  }
}

/** ⚠ THE HOOK, AND IT IS SUPPOSED TO RETURN FALSE. Pregnancy is post-v1 (§5.4) so nothing on a v1
 *  world can answer yes – but §5.6's second sentence made a lineage part of the contract, and a
 *  hand-off that cannot even ASK the question is a hand-off that has to be rewritten rather than
 *  extended. One function, one call site, and the day the system ships it reads real state. */
export function wasThereAChild(_world: WorldState): boolean {
  return false
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
