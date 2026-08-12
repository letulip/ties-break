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
import type { CareerEnding, DebtView, EndingView, ForkAnswer } from '../../shared/protocol'
import type { TierId } from '../season/types'
import { addEvent, seasonIndexOf } from './ledger'
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
 *  final or a title at. Null when she has never reached a final anywhere.
 *
 *  ⚠ IT READS `trophiesByTier` AND NOT `bestFinishByTier`, and the difference is the whole point.
 *  The latter is a per-tier HIGH-WATER MARK with no year on it and it is overwritten the week a
 *  silver becomes a gold, so it cannot answer "when". The cabinet keeps every trophy as the WEEK it
 *  happened in, which is exactly what a drought has to be measured against. */
export function lastRungSeasonIndexOf(world: WorldState): number | null {
  const ladder = Object.keys(world.trophiesByTier) as TierId[]
  let bestRung = -1
  let week: number | null = null
  for (const tier of ladder) {
    const t = world.trophiesByTier[tier]
    const weeks = [...t.titles, ...t.finals]
    if (weeks.length === 0) continue
    const rung = ladder.indexOf(tier)
    if (rung > bestRung) {
      bestRung = rung
      week = Math.min(...weeks)
    }
  }
  return week === null ? null : seasonIndexOf(week)
}

export function plateauViewOf(world: WorldState): PlateauView {
  return {
    ageYears: kidAgeYears(world.week, world.profile.birthMonth),
    seasonIndex: seasonIndexOf(world.week),
    seasonEndRanks: world.seasonHistory.map((s) => ({ seasonIndex: s.seasonIndex, endRank: s.endRank })),
    lastRungSeasonIndex: lastRungSeasonIndexOf(world),
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
  const from = TIER_LADDER.indexOf(ENDINGS.collegeClosedFromTier)
  return !(Object.keys(world.bestFinishByTier) as TierId[]).some((tier) => {
    const finish = world.bestFinishByTier[tier]
    if (finish === undefined) return false
    if (TIER_LADDER.indexOf(tier) < from) return false
    return TIERS[tier].points[finish] > 0
  })
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
