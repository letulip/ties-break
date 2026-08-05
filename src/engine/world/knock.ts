// THE KNOCK: she comes off court sore, and the parent rests it or sends her back out.
//
// The one週-level decision with a real cost on both sides – resting gives up development, pushing
// multiplies the injury threshold – and the reason an ordinary training week stopped being a week
// that just skips. `isCompetitionWeek` moved here with it: the knock's arrival condition is the
// sharpest definition of "a week with nothing in it but training", and it had four callers.
//
// ⚠ RNG: the arrival draws on the PURPOSE-SCOPED `seed:knock:<week>` sub-stream, never MAIN. That is
// the claim tests/knock.test.ts proves pairwise (an answering career taps the unanswered baseline
// byte-for-byte), and it is what makes the whole slice safe to add to.
//
// ⚠ DEPENDENCY DIRECTION. `WorldState` is a TYPE-ONLY import (erased at compile time), so world.ts
// imports these values with no runtime cycle.
import { coachById, tierOf } from '../coach'
import { drawKnock, knockUntilWeek, offCooldown } from '../knock'
import { coachEscalates, coachKnockCall, coachManagesLoad, type CoachLoadView } from '../coachLoad'
import { isBlackoutWeek } from '../season/calendar'
// ⚠ FROM kidLife, NOT FROM ./summer's `pastSchool`: summer.ts imports `isCompetitionWeek` from THIS
// file, so that edge would close a runtime cycle. kidLife is a leaf and has none.
import { schoolIsOver } from '../kidLife'
import type { KnockChoice } from '../../shared/protocol'
import { axisConfidence, axisEvidence, shownSkill, type RadarWorldView } from '../radar'
import { addEvent } from './ledger'
import { KID_ID } from './constants'
import { ageAtWeek } from './age'
import { playedWeeksInTrailing4 } from './injury'
import { retireKnock } from './knockHistory'
import { practiceForWeek, vacationForWeek } from './bookings'
import { coachSinceWeek, matchesEverPlayed } from './coachMarket'
import { startingSkills } from './player'
import type { WorldState } from '../world'
import { guardNotEnded } from './endings'

// --- W4: THE KNOCK ------------------------------------------------------------
//
// The design, the anti-farming argument and the RNG discipline all live in engine/knock.ts, which
// holds the dice, the anatomy and the copy. This is the half that touches the world: when a knock
// arrives, when it retires, and what the parent's answer does to the weeks that follow.
//
// ⚠ THE DECISION GOVERNS THE WEEK AHEAD, NOT THE WEEK JUST PLAYED, and that is a structural choice
// worth stating. `rollKnock` runs at the END of the tick – she came off court on the Friday – so by
// the time the dialog is on screen the week is already resolved and cannot be edited. The alternative
// (pausing mid-tick, the way `pendingTournament` does) would let the choice re-write the week it
// arrived in, at the price of splitting the weekly resolution in half for one feature. Not worth it,
// and the fiction is better this way round: something happened on Friday, and what you decide is what
// happens NEXT week.

/** Is the career waiting for an answer? The ONE predicate `advanceWeeks` blocks on and the snapshot
 *  builds its prompt from, so the dialog and the engine can never disagree. */
export function pendingKnock(world: WorldState): boolean {
  return world.knock !== null && world.knock.choice === null
}

/** A week she spent training at home and nothing else – the only kind of week a knock arrives on.
 *
 *  ⚠ DELIBERATELY NARROW, and every clause earns its place. A tournament week already has a story
 *  (and its own injury multiplier); an off-season or exam week is a blackout and must keep feeling
 *  like one; a booked family week is the opposite of load; a friendly is a match; and a body already
 *  laid up cannot pick up a niggle. What is left is exactly the week the owner was complaining
 *  about – the one with nothing in it but training. */
export function ordinaryTrainingWeek(world: WorldState): boolean {
  return (
    world.injury === null &&
    world.pendingTournament === null &&
    !isCompetitionWeek(world) &&
    !isBlackoutWeek(world.week, schoolIsOver(world.week, world.profile.birthMonth)) &&
    vacationForWeek(world, world.week) === undefined &&
    practiceForWeek(world, world.week) === undefined
  )
}

/** Retire a knock whose weeks are up. Runs at the TOP of the tick, after `world.week` has moved, so
 *  a knock is live for weeks `sinceWeek + 1 .. untilWeek` inclusive and `rollInjury` sees the right
 *  answer on every one of them. Undecided knocks never expire – they block time instead. */
export function expireKnock(world: WorldState): void {
  if (world.knock === null || world.knock.choice === null) return
  if (world.week > world.knock.untilWeek) retireKnock(world)
}

/** Roll for a knock (tick step 3c, after the week's work). ZERO main-stream draws – `drawKnock`
 *  reads `seed:knock:<week>`, its own per-week sub-stream – so the frozen capture cannot move.
 *
 *  ONE AT A TIME AND RATE-LIMITED: nothing arrives while a knock is open (decided or not) or inside
 *  KNOCK_COOLDOWN_WEEKS of the last one retiring. See knock.ts's farming note (d). */
export function rollKnock(world: WorldState): void {
  if (world.knock !== null) return
  if (!ordinaryTrainingWeek(world)) return
  const view = {
    seed: world.seed,
    week: world.week,
    condition: world.condition,
    plan: world.plan,
    history: world.knockHistory,
  }
  if (!offCooldown(view)) return
  const knock = drawKnock(view)
  if (!knock) return
  world.knock = knock
  // Type 'info', not 'injury': nothing has happened to her body that costs anything yet, and the 💬
  // channel is where somebody SAYS something. Calling it an injury in the feed would also make the
  // Memory card's first-injury milestone a lie by association.
  addEvent(world, {
    week: world.week,
    type: 'info',
    // ⚠ IT REPORTS, IT DOES NOT DEMAND - and the repeat line used to end "It needs a decision."
    // (owner, 31.07: «а где сам decision? кто его должен принимать?»). It was written before the
    // routing below existed, and the routing is what made it a lie on the commonest path there is.
    //
    // Three things can happen to a knock. With no load-managing coach the dialog opens and the parent
    // decides; with one who escalates, the dialog opens too and he says he is asking. On the third
    // path - a coach who simply takes the call, which is what DEFAULT_PROFILE's middle rung does - the
    // choice is made two lines down and NOBODY ASKS THE PLAYER. The feed then told him a decision was
    // needed, and immediately afterwards told him what the coach had decided: the shape of having been
    // asked and ignored.
    //
    // So the arrival line states the fact and stops. THE DEMAND IS THE DIALOG, and where there is no
    // dialog there is no demand to make - the coach's own line says what he did instead. That is
    // correct on all three paths without branching on any of them, which is why it is a deletion
    // rather than a condition.
    text: knock.repeat
      ? `Her ${knock.part} is sore again – the same one.`
      : `She has picked up a sore ${knock.part}. Not an injury – yet.`,
  })
  // ⚠ AND IF THE FAMILY IS PAYING SOMEBODY, HE ANSWERS IT – docs/specs/coach-as-load-manager.md §8.
  // This single line is the routing the whole slice is about: `pendingKnock` is false immediately, so
  // `advanceWeeks` never halts and the dialog never opens. That is the product - «you are buying your
  // attention back» - and it is why the rule lives in coachLoad.ts rather than here.
  //
  // ⚠ THE EVENT SURVIVES THE DIALOG'S REMOVAL, and that is not decoration. W4 exists because the owner
  // complained that training weeks «просто скипались»; a slice that silently deleted the stop for four
  // of five rungs would hand him that complaint back dressed as a feature. So the knock still happens,
  // still costs (KNOCK_REST_GROWTH or the loaded roll), still takes the week's frame and its scrap - and
  // `coachDecidedKnock` below writes what was decided into the feed in the coach's own voice. He finds
  // out what happened to his daughter; he just is not the one deciding.
  if (coachManagesLoad(tierOf(coachById(world.seed, ageAtWeek(world.week), world.coachId)))) {
    coachDecidesKnock(world)
  }
}


/** The hired coach's answer, taken the moment the knock arrives. Separate from `decideKnock` so the
 *  parent's path keeps its guard (`decideKnock` throws on an already-answered knock, which is a real
 *  protection against a double-tap) while this one is an internal step of the same tick.
 *
 *  ZERO DRAWS: `coachKnockCall` is arithmetic, and the one draw behind `shownStamina` is the radar's
 *  per-career `seed:read:stamina` - taken on its own sub-stream, outside the MAIN sequence, exactly as
 *  `drawKnock` takes `seed:knock:<week>`. The frozen capture (41550 / e6b0c709) cannot move. */
export function coachDecidesKnock(world: WorldState): void {
  const k = world.knock
  if (!k || k.choice !== null) return
  const view = coachLoadViewOf(world)
  // ⚠ ...UNLESS HE WANTS THE PARENT'S SAY. The call stays unanswered, `pendingKnock` stays true, and the
  // dialog opens exactly as it does for a self-coached career - which is what keeps W4's content alive on
  // a career that has a coach (DEFAULT_PROFILE is 'middle', so that is most of them). See coachLoad.ts
  // `coachEscalates`: the zone scales with his haze, so a cheap coach asks often and an Elite one almost
  // never - and "you are buying your attention back" becomes a number instead of a slogan.
  if (coachEscalates(view, k.repeat)) {
    addEvent(world, {
      week: world.week,
      type: 'info',
      text: k.repeat
        ? `The coach wants to talk about her ${k.part} before anyone decides.`
        : `The coach is in two minds about the ${k.part}. He is asking us.`,
    })
    return
  }
  const choice = coachKnockCall(view, k.repeat)
  k.choice = choice
  k.untilWeek = knockUntilWeek(k, choice)
  addEvent(world, {
    week: world.week,
    type: 'info',
    // HIS voice, not the parent's – the feed's `decideKnock` lines are what the family decided, and
    // these are what they were told. The difference is the thing they are paying for.
    text:
      choice === 'rest'
        ? `The coach is keeping her off the court this week – the ${k.part}.`
        : `The coach is happy for her to train through the ${k.part}.`,
  })
}

// =================================================================================================
// THE COACH AS LOAD MANAGER (docs/specs/coach-as-load-manager.md) – the world side
// =================================================================================================
//
// The design, the rejected oracle and the both-directions argument all live in engine/coachLoad.ts,
// which is pure and world-free. This is the half that touches the world: assembling what the coach can
// SEE, and letting him answer the knock when the family is paying somebody to.

/**
 * HER SKILLS RADAR VIEW – hoisted out of `toSnapshot` by the load slice, because the COACH now reads it
 * too and at a different moment (inside the tick, when a knock arrives) than the screens do.
 *
 * ⚠ ONE SPELLING, WHICH IS THE WHOLE REASON IT IS A FUNCTION. `toSnapshot`'s own note already argues
 * this for the two readers it had ("a second literal here would be a second place for 'which matches
 * count' to drift"); a third reader inside the tick makes it load-bearing rather than tidy. If the
 * coach acted on a differently-assembled view, he would be managing a girl the radar is not drawing -
 * and §8's entire claim is that his belief and the radar's contour are the SAME belief.
 */
export function radarViewOf(world: WorldState): RadarWorldView {
  return {
    seed: world.seed,
    week: world.week,
    kidId: KID_ID,
    skills: world.skills,
    // Where she began, recomputed from the seed rather than stored - see RadarWorldView.startSkills.
    // `growWeek` is the only thing in the engine that moves `world.skills`, so the difference between
    // these two IS her development, and neither of them ever leaves this object.
    startSkills: startingSkills(world.seed, world.profile),
    potential: world.potential,
    coachTier: tierOf(coachById(world.seed, ageAtWeek(world.week), world.coachId)),
    coachSinceWeek: coachSinceWeek(world),
    matchesPlayed: matchesEverPlayed(world),
    // Her OWN records out of the retained feed, competitive only - a practice friendly teaches
    // the radar nothing, for the same reason it never shows on her face (R11-2).
    matches: world.events
      .filter((e) => e.match !== undefined && !e.friendly)
      .map((e) => e.match!)
      .filter((m) => m.aId === KID_ID || m.bId === KID_ID),
  }
}

/**
 * WHAT THE COACH CAN SEE OF HER BODY, this week.
 *
 * `shownStamina` is the radar's own estimate of the stamina axis - her true value displaced by his
 * rung's haze, one draw per career with a FIXED SIGN (see radar.ts `shownSkill`). Stamina is the axis
 * because it is the physical one: a load manager is judging how much tennis she can absorb, and that is
 * what this attribute means.
 *
 * ⚠ CONDITION IS PASSED EXACT, NOT FOGGED, and that asymmetry is deliberate. The condition bar is a
 * number the game prints for the player outright, so a coach who could not read it would be blinder
 * than the parent who hired him - which is not a model of a cheap coach, it is a bug. What a cheap coach
 * gets wrong is how much of it she can AFFORD to spend, and that is `shownStamina`.
 *
 * Called at most a handful of times per career (a knock arrives ~15 times over 14->18), so the evidence
 * fold it costs is not on the weekly path.
 */
export function coachLoadViewOf(world: WorldState): CoachLoadView {
  const view = radarViewOf(world)
  const weeksTogether = Math.max(0, world.week - coachSinceWeek(world))
  const confidence = axisConfidence(view.coachTier, weeksTogether, axisEvidence(view, 'stamina').level)
  return {
    tier: view.coachTier,
    shownStamina: shownSkill(view, 'stamina', confidence),
    condition: world.condition,
    playedWeeks: playedWeeksInTrailing4(world),
    confidence,
  }
}

/** THE PARENT ANSWERS. The only way an undecided knock clears, and the only way time moves again.
 *
 *  Pure state: `untilWeek` is arithmetic and the consequences are read off it later (a rest week by
 *  `knockRestWeek`, a loaded roll by `knockTauFactor`). ZERO draws, on any stream – which is what
 *  makes a decision the player can take at any moment safe to put inside a deterministic sim. */
export function decideKnock(world: WorldState, choice: KnockChoice): void {
  // ⚠ W2-ENDINGS: the career must still have a next week. The engine re-validates every command
  // because the worker is not the gate - a tab left open behind the epilogue must not be able to
  // spend money for a girl who has retired.
  guardNotEnded(world)
  const k = world.knock
  if (!k) throw new Error('Nothing to decide')
  if (k.choice !== null) throw new Error('That knock has already been answered')
  k.choice = choice
  k.untilWeek = knockUntilWeek(k, choice)
  addEvent(world, {
    week: world.week,
    type: 'info',
    text:
      choice === 'rest'
        ? `Resting the ${k.part} – a week off the training court.`
        : `Training through the ${k.part}. The coach knows.`,
  })
}

/** IS SHE COMPETING THIS WEEK - entered in an event scheduled for it, and healthy enough to play.
 *
 *  ONE definition, two call sites, and they are deliberately evaluated at DIFFERENT points in the
 *  tick: the coaching bill asks at step 1 (before rollInjury) and `accrueCondition` asks at step 1c
 *  (after it). So a fresh injury this week counts as a competition week for the BILL and as a
 *  walkover for CONDITION, which is the honest reading of both - the week opened with her entered
 *  and travelling, and it ended with her not playing.
 *
 *  ENTERED, not merely offered: a calendar full of events she did not enter is a training week.
 *  Pure, zero draws. */
export function isCompetitionWeek(world: WorldState): boolean {
  return (
    world.injury === null &&
    world.season.some((e) => e.week === world.week && world.entries.includes(e.id))
  )
}
