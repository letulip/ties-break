// THE SEASON PLANNER: the two things a parent can put on an empty week – a family holiday and a
// practice match – and what the engine does with them when the week arrives.
//
// One module because they share a rulebook: `assertPlannable` is the single guard both booking
// commands go through (future week, no entry, no other booking, not laid up), and the refund story
// is the same on both sides of it.
//
// ⚠ NOTE FOR THE READER OF THE DIFF: `bookPractice`'s doc comment used to sit ~200 lines away from
// its function, stranded above the coach-market section header on main. Moving both halves of the
// planner into one file reunited them; nothing about either was changed.
//
// ⚠ DEPENDENCY DIRECTION. `WorldState` is a TYPE-ONLY import (erased at compile time), so world.ts
// imports these values with no runtime cycle.
//
// ⚠ RNG: the practice resolution draws on the PURPOSE-SCOPED `seed:practice:<week>` sub-stream and
// the vacation on its own – never MAIN. A plan change must never alter the weekly draw count.
import { ECONOMY, practiceFeeCents, vacationPackage, vacationPriceCents } from '../economy'
import { pickInt, rngFromSeed, type Rng } from '../rng'
import { isExamWeek, isOffSeasonWeek } from '../season/calendar'
import { schoolIsOver } from '../kidLife'
import { weekLabel } from '../../shared/dates'
import { simulateMatch } from '../match/engine'
import { clamp, matchDrain } from '../condition'
import type { AiPlayer } from '../season/types'
import type { MatchPlayer, Surface } from '../match/types'
import { rivalGroundstrokes } from '../season/rival'
import { JUNIOR_TOUR } from '../season/tournament'
import { formatShortName } from '../../shared/format'
import { addEvent, seasonStartWeek } from './ledger'
import { ageWindowStartWeek } from './age'
import { KID_ID } from './constants'
import { practiceForWeek, refundPractice, vacationForWeek } from './bookings'
import { layoffCovering, medicalBlock, medicalClearance, withheldFreeWeekRecovery } from './medical'
import { retirementInjury } from './injury'
import { kidMatchPlayerFor } from './player'
import { fullRanking } from './ladder'
import { practiceCoachRateFor } from './coachMarket'
// ⚠ ROUND 29 #5 – the leaf (`world/assets.ts`), never `world/shop.ts`: this file is imported by the
// shop's own dependency chain and a value import of the commands would close a cycle.
import { grantedVacationIds } from './assets'
import type { WorldState } from '../world'
import { guardNotEnded, guardNotEndedForGood } from './endings'

// --- Season planner: vacations + practice matches ------------------------------
// docs/specs/season-planner.md. TWO player-planned week types on otherwise empty weeks.
//
// RNG DISCIPLINE (the whole reason this slice is safe): a booking is PURE STATE. Prices are
// quoted from the purpose-scoped sub-streams `seed:vacation:week:packageId` /
// `seed:practice:week` (economy.ts), and the friendly itself runs on `seed:practicematch:week`
// – never the MAIN weekly stream. The B1/C1 freezes (count 45239 / hash 9f783705) therefore
// stay byte-identical no matter how much the parent plans; tests/planner.test.ts P1 re-proves
// it with a career that books something every single week.


/** Guard shared by both booking commands: a plannable week is in the FUTURE, free of the kid's
 *  own entries and of another booking, and she is not laid up through it. Throws the
 *  player-facing reason (short dash copy). `kind` shapes the school/off-season rules: the
 *  off-season is family time (no friendlies) but IS the natural family-vacation week, and an
 *  exam block takes neither.
 *
 *  THE DOCTOR'S VETO REACHES THE FRIENDLY (owner 26.07: "the doctor who will not let her travel
 *  probably should not clear her for a friendly at condition 0"). A match is a match: under
 *  ECONOMY.availability.medicalFloor she is not cleared for one, whoever is standing across the
 *  net. It applies to `practice` ONLY – a VACATION is rest, and refusing that below the floor is
 *  how a week becomes a dead end (R10-3), the exact bug class this gate must not reintroduce.
 *  The verdict comes from the shared `medicalBlock`, so the friendly and the tournament print the
 *  same sentence by construction. Ranked LAST, mirroring `availabilityStatus`: injury and the
 *  week-level reasons (exams, off-season, an existing booking, an entered tournament) name
 *  themselves first, because they are true for any body. */
export function assertPlannable(world: WorldState, week: number, kind: 'vacation' | 'practice'): void {
  if (!Number.isInteger(week) || week <= world.week) throw new Error('Only a future week can be planned')
  // ⭐ THE LAYOFF STOPS THE FRIENDLY AND NOT THE HOLIDAY (round-17 #11). The owner: «люди
  // путешествуют с травмами вообще».
  //
  // ⚠ THIS GATE WAS INCIDENTAL, NOT A RULING, AND THE COMMENT ABOVE IS THE EVIDENCE. Two lines up,
  // the doctor's veto is argued into applying to `practice` ONLY, in these words: "a VACATION is
  // rest, and refusing that below the floor is how a week becomes a dead end (R10-3), the exact bug
  // class this gate must not reintroduce". The layoff arm was written unconditionally beside it and
  // was never given a reason of its own - the whole of its recorded justification is a PARITY
  // argument living in a test (tests/round10.test.ts: "uses the SAME boundary the planner already
  // uses - one rule, two surfaces"), which is about a boundary being spelled once, not about whether
  // a hurt girl may be taken away for a week. Nothing in docs/specs/season-planner.md states the
  // rule; §4d states the opposite one, that "vacations are never gated".
  //
  // AND IT PRODUCED THE VERY DEAD END THAT ARGUMENT WAS GUARDING AGAINST, one gate along: a
  // twelve-week layoff is twelve weeks in which the parent may plan NOTHING AT ALL. The one thing a
  // real family does with a season that has just been taken away from them is go somewhere, and it
  // is also the one thing the game models that helps - a vacation's `conditionGain` is exactly what
  // an injured week wants.
  //
  // THE FRIENDLY KEEPS THE GATE, for the same reason the medical floor reaches it: a practice match
  // IS a match, and she cannot play one while she is laid up. So the two kinds part here, as they
  // already part below.
  if (kind === 'practice') {
    const layoff = layoffCovering(world, week) // the shared R10-17 window
    if (layoff !== null) throw new Error(`Injured – back in ${layoff.weeksRemaining} weeks.`)
  }
  if (isExamWeek(week, schoolIsOver(week, world.profile.birthMonth))) {
    throw new Error('School exams that week – no matches, no trips')
  }
  if (kind === 'practice' && isOffSeasonWeek(week)) throw new Error('Off-season – family time, no matches')
  if (vacationForWeek(world, week)) throw new Error('That week is already a family vacation')
  if (practiceForWeek(world, week)) throw new Error('A practice match is already booked that week')
  if (world.season.some((e) => e.week === week && world.entries.includes(e.id))) {
    throw new Error('She is entered in a tournament that week')
  }
  if (kind === 'practice') {
    const medical = medicalBlock(world.condition)
    if (medical) throw new Error(medical.detail)
  }
}

/** Book a family vacation on an empty future week: charges the sub-stream quote (spec §2) and
 *  records the booking. The week becomes a hard blackout; the package's condition gain (and, for
 *  the two top packages, its recovery buff) lands when the week ticks. */
export function bookVacation(world: WorldState, week: number, packageId: string): void {
  // ⚠ W2-ENDINGS: the career must still have a next week. The engine re-validates every command
  // because the worker is not the gate - a tab left open behind the epilogue must not be able to
  // spend money for a girl who has retired.
  guardNotEnded(world)
  const pkg = vacationPackage(packageId)
  if (!pkg) throw new Error('Unknown vacation package')
  // ⭐⭐ ROUND 29 #5, the-shop §3f – A WEEK ON THE YACHT NEEDS A YACHT, AND ONE THAT HAS ARRIVED.
  //
  // THE OWNER: «а неделя на яхте (при наличии яхты) вполне может стать новой строкой отпуска.»
  //
  // ⚠ RE-VALIDATED HERE BECAUSE THE WORKER IS NOT THE GATE (CLAUDE.md invariant 1). The planner
  // sheet already leaves the row out (`Snapshot.shop.vacationIds`), and a tab left open on a career
  // that has since sold the boat – or that never had one – must not be able to book a week on it.
  // §3f is explicit that a contract is not a boat: `grantedVacationIds` reads DELIVERED rungs only.
  if (pkg.grantedOnly && !grantedVacationIds(world).includes(pkg.id)) {
    throw new Error('The family does not own that')
  }
  assertPlannable(world, week, 'vacation')
  const priceCents = vacationPriceCents(world.seed, week, packageId, world.profile.background)
  // R13-7a: a ZERO-PRICE package is always affordable. The bare `funds < price` refused the free
  // home-rest week the moment funds went negative (-$1 < $0), i.e. exactly when it is the one
  // thing a broke family can still book. Nothing is charged, so nothing has to be afforded.
  if (priceCents > 0 && world.fundsCents < priceCents) throw new Error('Not enough funds for that vacation')
  world.fundsCents -= priceCents
  world.vacations.push({ week, packageId, paidCents: priceCents })
  world.vacations.sort((a, b) => a.week - b.week)
  if (priceCents > 0) {
    addEvent(world, {
      week: world.week,
      type: 'expense',
      category: 'vacation',
      text: `Booked: ${pkg.label} – ${weekLabel(week)}`,
      amountCents: -priceCents,
    })
  }
  addEvent(world, { week: world.week, type: 'entry', text: `Family vacation booked – ${weekLabel(week)} (${pkg.label})` })
}

/** Cancel a booked vacation before its week starts: FULL refund (mirror of entry withdrawal). */
export function cancelVacation(world: WorldState, week: number): void {
  // ⭐⭐ ROUND 24, E2 – `ForGood`, AND THE COLLEGE FREEZE IS THE ONLY THING THAT CHANGES. A terminal
  // latch still refuses with the same sentence it always did; a career AT COLLEGE may cancel.
  //
  // ⚠⚠ THE REASON IS A TRAP THAT IS ALREADY IN THE TICK, NOT A WIDENING OF THE RULES. `resolveVacation`
  // and `resolvePractice` sit at world.ts step 3 with NO `inCollege` gate around them – unlike the
  // academy, the sponsors, the gear, the knock and the birthday, all of which the freeze shuts off.
  // So a booking made the week before the fork is really RESOLVED inside the freeze, inside a call
  // that spends fifty-two weeks in one click, and until this change the parent had no way to take it
  // back: the money was gone and the guard said her career had ended. That is a refused control with
  // no honest reason on screen (R10-16) sitting on top of a booking the game still intends to honour.
  //
  // ⚠ AND ONLY THE CANCELS OPEN, NOT `bookVacation` / `bookPractice`. A cancel can only REMOVE state,
  // so there is nothing it can collide with. A booking creates state on a calendar `assertPlannable`
  // cannot see: it knows about entries, exams and the off-season, and knows NOTHING about
  // `COLLEGE_TRIP_WEEKS` or `NATIONAL_TEAM.seasonWeek`, so a holiday booked on the call-up week would
  // put her at the seaside and in her country's shirt in the same week. Whether the family may plan
  // a college week at all is a rule the owner has not ruled on, and it is in E2's report rather than
  // in this file.
  //
  // ⚠ ZERO DRAWS, on MAIN or anywhere: this is state removal plus two ledger rows. The frozen capture
  // cannot see it.
  guardNotEndedForGood(world)
  const booking = vacationForWeek(world, week)
  if (!booking) throw new Error('No vacation booked that week')
  if (week <= world.week) throw new Error('That vacation week has already started')
  world.vacations = world.vacations.filter((v) => v !== booking)
  const label = vacationPackage(booking.packageId)?.label ?? booking.packageId
  if (booking.paidCents > 0) {
    world.fundsCents += booking.paidCents
    addEvent(world, {
      week: world.week,
      type: 'income',
      category: 'vacation',
      text: `Vacation refunded: ${label}`,
      amountCents: booking.paidCents,
    })
  }
  addEvent(world, { week: world.week, type: 'entry', text: `Cancelled the family vacation – ${weekLabel(week)}` })
}

/** Book a practice match (a watchable friendly) on an empty future week: charges the court
 *  rental off the `:practice:` sub-stream, plus half a coaching session when the coach comes
 *  along. NEVER blocked by the fatigue GUARDRAIL – the caution is advice, not a veto (owner:
 *  "the parent may push, the game warns"); see practiceCaution.
 *
 *  The ONE exception, and it is the doctor's, not the guardrail's: below
 *  ECONOMY.availability.medicalFloor `assertPlannable` refuses outright (there is no warning band
 *  for a friendly – above the floor the guardrail's soft caution owns the whole range). That is the
 *  same hard body-gate `availabilityStatus` applies to a tournament, reading the same
 *  `medicalBlock`. */
export function bookPractice(world: WorldState, week: number, withCoach: boolean): void {
  // ⚠ W2-ENDINGS: the career must still have a next week. The engine re-validates every command
  // because the worker is not the gate - a tab left open behind the epilogue must not be able to
  // spend money for a girl who has retired.
  guardNotEnded(world)
  assertPlannable(world, week, 'practice')
  const paidCents = practiceFeeCents(world.seed, week, world.profile.background, withCoach, practiceCoachRateFor(world, week))
  if (world.fundsCents < paidCents) throw new Error('Not enough funds for the court rental')
  world.fundsCents -= paidCents
  world.practices.push({ week, paidCents, withCoach })
  world.practices.sort((a, b) => a.week - b.week)
  addEvent(world, {
    week: world.week,
    type: 'expense',
    category: 'practice',
    text: withCoach ? `Court rental + coach – practice match ${weekLabel(week)}` : `Court rental – practice match ${weekLabel(week)}`,
    amountCents: -paidCents,
  })
  addEvent(world, { week: world.week, type: 'entry', text: `Practice match booked – ${weekLabel(week)}` })
}

/** Cancel a booked practice before its week starts: full refund of the rental. */
export function cancelPractice(world: WorldState, week: number): void {
  // ⭐ ROUND 24, E2 – `ForGood`, for exactly the reasons written out at `cancelVacation` above: a
  // practice booked before the fork is really played inside the freeze (`resolvePractice` has no
  // `inCollege` gate), so the parent must be able to call it off. The BOOKING half keeps
  // `guardNotEnded` – a friendly IS a match, which is the same line this module already draws at
  // `assertPlannable` for the layoff and the doctor's floor.
  guardNotEndedForGood(world)
  const booking = practiceForWeek(world, week)
  if (!booking) throw new Error('No practice match booked that week')
  if (week <= world.week) throw new Error('That practice week has already started')
  refundPractice(world, booking, 'Cancelled')
}

/** How many practice weeks run UNBROKEN immediately before `week` (pure, order-free). */
export function consecutivePracticeWeeks(practiceWeeks: readonly number[], week: number): number {
  const booked = new Set(practiceWeeks)
  let n = 0
  while (booked.has(week - 1 - n)) n++
  return n
}

/** The practice GUARDRAIL as a small pure predicate (fatigue-bench finding 25.07: practising
 *  every single week is self-destructive – mean condition 47, 41-44% of weeks under 40). It is a
 *  CAUTION, never a block: the confirm sheet spells the risk out and the Home chip reads the
 *  strain, but the parent may still push. Reasons: 'tired' (below ECONOMY.practice.cautionCondition)
 *  and 'streak' (a run of consecutive match weeks).
 *
 *  WAVE-2 RETUNE (bench 26.07): the streak arm is GATED on real strain – `cautionStreak` (3) in a
 *  row warns only below `cautionStreakCondition`, while `cautionStreakAlways` (4) in a row warns at
 *  any condition. It used to fire on a perfectly fresh kid (careful pushed through 8-11
 *  cautions/season at condition 92), which is how a warning becomes noise. */
export interface PracticeCaution {
  level: 'ok' | 'caution'
  reasons: Array<'tired' | 'streak'>
  /** how many match weeks in a row this booking would make (1 = the first) – so the chip and the
   *  sheet can NAME the run without re-deriving it. */
  streakWeeks: number
  /** player-facing warning copy (short dash), absent when clear */
  detail?: string
}
export function practiceCaution(input: {
  condition: number
  practiceWeeks: readonly number[]
  week: number
}): PracticeCaution {
  const p = ECONOMY.practice
  const reasons: Array<'tired' | 'streak'> = []
  // The booking under consideration closes the run, so it is the (unbroken run before it + 1)-th.
  const streakWeeks = consecutivePracticeWeeks(input.practiceWeeks, input.week) + 1
  if (input.condition < p.cautionCondition) reasons.push('tired')
  const strainedStreak = streakWeeks >= p.cautionStreak && input.condition < p.cautionStreakCondition
  if (strainedStreak || streakWeeks >= p.cautionStreakAlways) reasons.push('streak')
  if (reasons.length === 0) return { level: 'ok', reasons, streakWeeks }
  const parts: string[] = []
  // Owner's line: «Она уже вымотана – ещё матч?»
  if (reasons.includes('tired')) parts.push('She is already worn out – another match?')
  if (reasons.includes('streak')) parts.push(`${streakWeeks} match weeks in a row – that is how bodies break.`)
  return { level: 'caution', reasons, streakWeeks, detail: parts.join(' ') }
}

/** Retire an expired recovery buff (pure state). Runs after the week's injury roll, so the last
 *  covered week still gets its protection. */
export function expireRecoveryBuff(world: WorldState): void {
  if (world.recoveryBuff && world.week > world.recoveryBuff.untilWeek) world.recoveryBuff = null
}

/** Tick step 1c: resolve a booked vacation week – the package's condition gain on top of the
 *  free-week recovery accrueCondition already granted, plus the resort/elite carry-over buff.
 *  Runs even while she is injured: a family week away is still rest. */
export function resolveVacation(world: WorldState): void {
  const booking = vacationForWeek(world, world.week)
  if (!booking) return
  const pkg = vacationPackage(booking.packageId)
  if (!pkg) return
  world.condition = clamp(world.condition + pkg.conditionGain, ECONOMY.condition.min, ECONOMY.condition.max)
  if (pkg.buffFactor < 1) {
    world.recoveryBuff = { untilWeek: world.week + ECONOMY.vacation.buffWeeks, factor: pkg.buffFactor }
  }
  addEvent(world, {
    week: world.week,
    type: 'info',
    text:
      pkg.buffFactor < 1
        ? `Family vacation – ${pkg.label}: +${pkg.conditionGain} condition, and the recovery holds for ${ECONOMY.vacation.buffWeeks} weeks.`
        : `Family vacation – ${pkg.label}: +${pkg.conditionGain} condition.`,
  })
}

/** Pick the week's sparring partner: a cohort player from the kid's own neighbourhood of the
 *  standings (one draw on the private practice stream). Flavor + a fair hit-out, never a result. */
export function pickSparringPartner(world: WorldState, rng: Rng): AiPlayer {
  const ranking = fullRanking(world).filter((r) => r.playerId !== KID_ID)
  const byId = new Map(world.cohort.map((p) => [p.id, p]))
  const kidIdx = Math.max(0, Math.min(ranking.length - 1, world.kidRank - 1))
  const lo = Math.max(0, kidIdx - 10)
  const hi = Math.min(ranking.length - 1, kidIdx + 10)
  const pick = pickInt(rng, lo, hi) // exactly one pull
  return byId.get(ranking[pick]?.playerId ?? '') ?? world.cohort[0]
}

/** Tick step 1c: play a booked practice match. A watchable friendly through the SAME record
 *  shape a tournament match uses (MatchReplay re-simulates from the stored seed), ZERO ranking
 *  points, and the spec's drain: `max(1, local-scoreline drain − 1)` – a friendly is one lighter
 *  than the same match at a local, never free. Injury cancels the week (the rental was already
 *  refunded at onset), and so does the doctor's floor, re-read here on arrival (see below); the
 *  friendly runs on the private `seed:practicematch:week` stream, so it adds no MAIN-stream draws. */
export function resolvePractice(world: WorldState): void {
  const booking = practiceForWeek(world, world.week)
  if (!booking) return
  if (world.injury !== null) {
    refundPractice(world, booking, 'Injured')
    return
  }
  // THE DOCTOR CHECKS HER ON ARRIVAL HERE TOO. The booking gate reads her condition on the day she
  // BOOKS, and a booking is made a week ahead – so a friendly signed up for at condition 30 can
  // still come round with her at 5 (one bad tournament run in between is enough). The floor is
  // therefore re-read on the play week against the condition she would actually take the court at
  // (step 1c has already accrued), exactly like the tournament arrival check in tickWeek, and
  // ranked the same way: injury first, then medicine.
  //
  // THE MONEY GOES THE OTHER WAY THAN THE TOURNAMENT'S, deliberately. A medical withdrawal from a
  // tournament FORFEITS the entry fee, because the list closed with her on it and refunding it
  // would make the veto a free late exit from any entry the parent regrets. Neither half of that is
  // true of a friendly: there is no closed list (cancelPractice already refunds in full at any point
  // before the week), the friendly awards nothing that could be gamed, and the practice
  // sub-system's own precedent for "her body called it off" – the injury branch right above – is a
  // FULL refund. So the club simply does not get booked. Consistency inside the practice rules beats
  // symmetry with a rule whose reason does not apply.
  //
  // It does NOT set `medicalWithdrawalWeek` either: that marker exists to HALT an advance so the
  // player cannot miss a forfeited entry fee (the owner's silent-withdrawal trap). Nothing is lost
  // here – the money is back and the news feed carries the line – so stopping the fast-forward
  // would be a nag, not a warning.
  if (medicalClearance(world.condition) === 'withdraw') {
    refundPractice(world, booking, 'Medical')
    // The week is match-free after all, so she earns the FULL free-week recovery that
    // accrueCondition withheld when it still believed she would play a friendly (it paid
    // recoveryBase alone, the practice-week rung of the ladder). The difference is the ONE oracle
    // `withheldFreeWeekRecovery` now computes for all three refund sites – 'practice' names the
    // rung that was banked, so on an ordinary week this is the rest-slider bonus exactly as it
    // always was, and ⭐ on a SHOOT week (ad step 2, §4a) it is nothing: the travel figure was
    // banked and the travel figure is what a shoot week's match-free rest is worth.
    // Integer, clamped, zero draws.
    world.condition = clamp(
      world.condition + withheldFreeWeekRecovery(world, 'practice'),
      ECONOMY.condition.min,
      ECONOMY.condition.max,
    )
    return
  }
  const rng = rngFromSeed(`${world.seed}:practicematch:${world.week}`)
  const opponent = pickSparringPartner(world, rng)
  const surface: Surface = 'hard' // the home club's courts
  // She hits at her CURRENT condition, exactly like a tournament run (R9-19 coupling), and on the
  // court her style earns her (surface-style): one composition point, applied once.
  const kid = kidMatchPlayerFor(world, surface)
  const opp: MatchPlayer = {
    id: opponent.id,
    name: opponent.name,
    serve: opponent.serve,
    ret: opponent.ret,
    composure: opponent.composure,
    stamina: opponent.stamina,
    // Her sparring partner's groundstroke comes off the SAME derivation a tournament opponent's
    // does, so a friendly is not a different game (v25 - the cohort stores no fifth attribute).
    groundstrokes: rivalGroundstrokes(opponent),
    // ...and for the same reason her AGE comes off the cohort row, so the friendly's box score reads
    // her serve at her real pace instead of falling back to the career-start age.
    age: opponent.ageYears,
  }
  const seed = `${world.seed}:practicematch:${world.week}:m`
  const result = simulateMatch(kid, opp, { surface, tour: JUNIOR_TOUR, seed })
  const score = result.sets.map((s) => `${s.a}-${s.b}`).join(' ')
  const kidWon = result.winner === 0
  // The spec's drain rule, graded off the real scoreline via the SAME matchDrain the tour uses.
  //
  // ⚠ ...MINUS THE TIER SURCHARGE, EXPLICITLY, SINCE W2-WINDOW. The `- 1` was written when Local's
  // surcharge was 0, so `matchDrain('local', …)` was the bare SCORELINE and the subtraction meant
  // "a friendly is one lighter than a real match". The owner's re-price took Local to 1 and the two
  // readings came apart: carried through unchanged, the cheapest thing in the game would have gone
  // from 1/2/3 to 2/3/4 as a side effect of pricing a tournament WEEK. They are different things -
  // the surcharge prices the trip, the travel and the days away, and a practice set against a
  // clubmate has none of them - so the friendly now subtracts the surcharge by name and keeps the
  // `- 1` for what it always meant. Shipped values are unchanged (1 / 2 / 3), and they no longer
  // move when Local is re-priced again.
  const drain = Math.max(1, matchDrain('local', score) - ECONOMY.condition.tierMatchFatigue.local - 1)
  world.condition = clamp(world.condition - drain, ECONOMY.condition.min, ECONOMY.condition.max)
  const kidShort = formatShortName(`${world.profile.kidName} ${world.profile.kidLastName}`)
  // ⚠ A FRIENDLY IS A MATCH, AND SHE CAN STOP IN ONE (10.08, the retirement slice). The owner's
  // ruling is about the BODY – «травма и травма, нет разницы» – and `simulateMatch` does not know
  // this is a hit-out at the home club: the same fatigue curve, the same hazard. Two things follow
  // and both are handled here rather than left to leak:
  //
  //   THE SENTENCE. "lost to M. Ruiz 4-6 6-4 2-1" with no explanation is the lie a short scoreline
  //   tells by itself, so the verb says what happened, exactly as the tournament's news line does.
  //   `retiredId` rides on the record too, so the Weekly Story and the box score read the same fact.
  //   THE BODY. She really is hurt, so the ordinary layoff opens – `retirementInjury`, the same one
  //   the tournament path uses, on the same `seed:retire:<week>` sub-stream. A friendly that ended
  //   with her walking off and cost her nothing would be the "no consequence" version of the feature.
  //
  // ⚠ NO REFUND, and the asymmetry with the medical branch forty lines up is deliberate: that one
  // gives the court fee back because she never took the court. She took this one.
  const retiredId = result.retired ? (result.retired.side === 0 ? KID_ID : opp.id) : undefined
  addEvent(world, {
    week: world.week,
    type: 'match',
    friendly: true,
    text:
      `Practice match: ${kidShort} ` +
      `${retiredId === KID_ID ? 'had to stop against' : retiredId ? 'was playing a retiring' : kidWon ? 'beat' : 'lost to'} ` +
      `${formatShortName(opp.name)} ${score} – no ranking points`,
    match: {
      round: 0,
      aId: KID_ID,
      bId: opp.id,
      winnerId: kidWon ? KID_ID : opp.id,
      seed,
      score,
      ...(retiredId ? { retiredId } : {}),
      eventId: `practice-w${world.week}`,
      surface,
      oppName: opp.name,
      a: { ...kid },
      b: { ...opp },
    },
  })
  // ...and LAST, after the event that describes the match, so the feed reads in the order it
  // happened: the practice set, then the clinic. `retirementInjury` emits its own lines.
  if (retiredId === KID_ID) retirementInjury(world)
}

/** Housekeeping: bookings are kept for a short TRAILING window after their week resolves, not
 *  dropped on the spot – the guardrail's consecutive-practice streak (and the Home strain chip)
 *  has to be able to see "she already played the last two weeks". Bounded, so the save stays
 *  small no matter how long the career runs. */
export const PLANNER_TRAIL_WEEKS = 4
export function prunePlannerBookings(world: WorldState): void {
  const from = world.week - PLANNER_TRAIL_WEEKS
  world.vacations = world.vacations.filter((v) => v.week >= from)
  world.practices = world.practices.filter((p) => p.week >= from)
}

/** Drop international entries nothing can ever read again. The list stays bounded by the caps
 *  themselves – tens of numbers over a whole career, not one per event played.
 *
 *  ⚠⚠ THE BOUNDARY IS THE EARLIER OF TWO WINDOWS SINCE P2, AND IT HAS TO BE, because two different
 *  rules now read these ledgers over two different years:
 *    * the entry allowances count her BIRTHDAY YEAR (`entryCapUsage` / `proEntryCapUsage`, P2), and
 *      for a girl born after the first week of January that year REACHES BACK INTO THE PREVIOUS
 *      SEASON BLOCK for every week between New Year and her birthday;
 *    * `quotaPlayedIn` (world/mandatory.ts) counts the SEASON BLOCK, because the tour's six-500
 *      commitment is a season's obligation and not an age rule.
 *  Pruning on either boundary alone would silently eat rows the other rule still needs – the age
 *  window's tail in January, or the season's tail after her birthday – so the prune takes the min and
 *  the two rules stay independent. Same discipline as before: the prune can never eat a slot a gate
 *  still reads. */
export function pruneInternationalEntries(world: WorldState): void {
  const from = Math.min(seasonStartWeek(world.week), ageWindowStartWeek(world, world.week))
  world.internationalEntryWeeks = world.internationalEntryWeeks.filter((w) => w >= from)
  // The pro ledger prunes on the same boundary for the same reason - bounded by its own cap.
  world.proEntryWeeks = world.proEntryWeeks.filter((w) => w >= from)
}
