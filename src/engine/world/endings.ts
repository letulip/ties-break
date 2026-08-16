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
import { formatCents } from '../../shared/money'
import type { AutoEndingView, CollegeResultView, PlateauView } from '../ending'
import {
  ENDINGS,
  ENDING_TITLE,
  collegeDoorOpen,
  detectEnding,
  endingForForkAnswer,
  endingForRetirement,
  forkDue,
  retirementDue,
  debtWeeks,
} from '../ending'
import type { CareerEnding, DebtView, EndingView, ForkAnswer } from '../../shared/protocol'
import type { LadderTrack, TierId } from '../season/types'
import { addEvent, seasonIndexOf } from './ledger'
import { activeLadderOf } from './ladder'
import { kidAgeYears } from './age'
import { buildAlbum, buildScroll } from './album'
import type { WorldState } from '../world'

/** IS SHE AT COLLEGE THIS WEEK? Derived from the span, never a second flag – so it can never drift
 *  out of step with `world.week` and a save taken mid-freeze answers the same question on reload. */
export function inCollege(world: WorldState): boolean {
  return world.college !== null && world.week < world.college.untilWeek
}

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
    ageYears: kidAgeYears(world.week, world.profile.birthMonth),
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
    ageYears: kidAgeYears(world.week, world.profile.birthMonth),
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
  if (world.fork === null && forkDue(kidAgeYears(world.week, world.profile.birthMonth), false)) {
    world.fork = { askedWeek: world.week, answer: null }
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

/** ⭐ IS THE SCHOLARSHIP STILL A DOOR SHE CAN WALK THROUGH? Round-17 #6.
 *
 *  The owner: the fork «offers the academy to a girl already earning on W75+». It had no
 *  precondition at all, so a nineteen-year-old with a professional ranking and prize money in the
 *  bank was offered four years of student tennis as an equal third of the card.
 *
 *  ⚠ DERIVED, NEVER PERSISTED, which is what keeps this out of CLAUDE.md invariant 3. It is a pure
 *  read of `bestFinishByTier` - state that already exists - so no save field is added and no
 *  migration is needed; a career loaded from any version answers the question the same way.
 *
 *  ⚠ AND IT IS A COUNTING RESULT, not an entry. Playing a W75 and losing in the first round is a
 *  junior trying the tour; a result that scored is a professional on it. `wtaEverCounted` uses the
 *  identical test one table down, so the two cannot mean different things by "it counted". */
export function collegeStillOpen(world: WorldState): boolean {
  return collegeDoorOpen(collegeResultViewOf(world), TIER_LADDER.indexOf(ENDINGS.collegeClosedFromTier))
}

/** THE VIEW THE COLLEGE RULE READS – built here, because this is the seam that is allowed to know
 *  what a rung is. `ending.ts` gets three numbers per result and no calendar constant at all.
 *
 *  ⚠ `rounds` IS THE DRAW'S DEPTH AND NOT ITS PRIZE COLUMN. `points.length` is how many finishing
 *  positions the rung has, which is a structural fact; the VALUES in that array are the ladder's
 *  tuning and are deliberately not passed on. That is the whole of the decoupling – see
 *  `collegeDoorOpen`, and `docs/specs/college-gate-decoupled-2026-08.md` for why it was needed. */
function collegeResultViewOf(world: WorldState): CollegeResultView[] {
  const views: CollegeResultView[] = []
  for (const tier of Object.keys(world.bestFinishByTier) as TierId[]) {
    const finish = world.bestFinishByTier[tier]
    if (finish === undefined) continue
    views.push({ rungIndex: TIER_LADDER.indexOf(tier), finish, rounds: TIERS[tier].points.length })
  }
  return views
}

/** ⭐⭐ WOULD ENTERING THIS RUNG COST HER THE COLLEGE ENDING? P4's warning, as an engine predicate.
 *
 *  ⚠ IT IS A WARNING AND NO LONGER A SILENCE, WHICH IS THE POINT. `ENDINGS.collegeClosedFromTier`
 *  used to state the silence as intent – *"it is a PRECONDITION and not a WARNING"* – on the strength
 *  of an NCAA eligibility rule that **does not exist** (research §1b: no pre-enrolment cap at all
 *  since 15 April 2026). A rule the sport does not have may not be sprung on the player after the
 *  fact, so the tournament card says this entry can cost the scholarship BEFORE she loses it.
 *
 *  ⚠ IT MAY NOT RECOMMEND (ruling 4, 30.07). It states a consequence and stops: no verdict on
 *  whether entering is a good idea, no styling that makes it a refusal, and `eligible` is untouched.
 *  The parent may always push – the doctor's veto is this game's one exception and this is not it.
 *
 *  ⚠ AND IT IS "CAN COST", NOT "WILL": a first-round loss there keeps the door (that is the 13.08
 *  ruling), so the honest sentence is about what a RESULT would spend, not the entry fee.
 *
 *  Three conditions, and all three are about whether the sentence would be TRUE, never about whether
 *  it would be useful:
 *    1. the door is still open – there is something left to spend;
 *    2. this rung is at or above the college rung – a W15 costs nothing;
 *    3. the fork has not been answered yet – after it there is no college ending left to lose, and a
 *       card that warns about a spent decision is noise. */
export function entryCostsCollege(world: WorldState, tier: TierId): boolean {
  if (world.fork !== null && world.fork.answer !== null) return false
  if (TIER_LADDER.indexOf(tier) < TIER_LADDER.indexOf(ENDINGS.collegeClosedFromTier)) return false
  return collegeStillOpen(world)
}

/** THE MOST EXPENSIVE CLICK IN THE GAME (adult spec's own risk note). Three answers, two of which
 *  end the career, and «стоп» must be able to be the right one. */
export function answerFork(world: WorldState, answer: ForkAnswer): void {
  guardNotEnded(world)
  if (world.fork === null || world.fork.answer !== null) throw new Error('The fork is not open')
  // ⭐ #6: re-validated ENGINE-SIDE, because the worker is not the gate (CLAUDE.md invariant 1). The
  // dialog stops drawing the button, and this is what makes that a rule rather than a decoration.
  if (answer === 'college' && !collegeStillOpen(world)) {
    throw new Error('She has taken professional prize money – the scholarship is not open to her')
  }
  world.fork = { ...world.fork, answer }
  if (answer === 'college') {
    world.college = {
      fromWeek: world.week,
      untilWeek: world.week + ENDINGS.collegeYears * WEEKS_PER_YEAR,
      doneWeek: null,
    }
  }
  const ending = endingForForkAnswer(
    answer,
    world.week,
    kidAgeYears(world.week, world.profile.birthMonth),
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
      kidAgeYears(world.week, world.profile.birthMonth),
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
        ending.resumesWeek === null ? null : kidAgeYears(ending.resumesWeek, world.profile.birthMonth),
    },
    totals: world.careerTotals,
    seasonsPlayed: world.seasonHistory.length,
    bestRank,
    titles,
    oneMoreYearCount: world.oneMoreYearCount,
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

/** One line for the news feed when the family goes under water, with the countdown in it. */
export function debtWarningText(world: WorldState): string {
  const view = buildDebtView(world)
  if (!view) return ''
  const left = Math.max(0, view.graceWeeks - view.weeks)
  return `${formatCents(world.fundsCents)} – ${view.weeks} weeks below zero, ${left} before there is no way back.`
}
