// THE KNOCK ANSWER A HARNESS GIVES WHEN IT IS NOT MEASURING HER KNOCKS – ONE IMPLEMENTATION, FOR
// `tools/` AND `tests/` BOTH. The sibling of `tools/_lifeBeats.ts`, written for the same reason and
// under the same two conventions: underscore-prefixed on `tools/_seeds.ts`' rule ("shared module, not
// a bench"), and living in `tools/` because 25 files under `tests/` import from `tools/` and no file
// under `tools/` imports from `tests/`.
//
// ⚠⚠ WHY IT EXISTS, AND IT IS A MEASUREMENT RATHER THAN A TIDY-UP. An UNANSWERED knock is not inert:
// «Undecided knocks never expire – they block time instead» (world/knock.ts), `advanceWeeks` REFUSES
// to tick while `pendingKnock` holds, and `rollKnock` refuses to raise a new one while any knock is
// open. So a harness that walks past the question does not merely ignore it – it latches the slot for
// the rest of the walk, and every later knock that career would have had never arrives. Measured on
// `tools/econ-bench.ts` under T16 (which routed a repeat and a `'warn'` week to the parent at every
// rung): the 25k/middle frozen career went from 6 knocks arrived / 1 escalated / **2** weeks holding
// an open one, to 4 / 3 / **47** – a third of the walk spent on a question nobody was ever going to
// answer. ⚠ IT IS A PROPERTY OF THE HARNESS AND NOT OF PLAY: in the game the dialog is a blocking
// overlay and the player cannot walk past it, which is the whole point of the escalation.
//
// ⚠ T16b SHRINKS THE PROBLEM AND DOES NOT REMOVE IT. Escalation is the confidence-scaled doubt zone
// again (`coachLoad.ts` `coachEscalates`, plus the two wideners), so a hired career escalates a small
// fraction of its knocks rather than most of them – but a SELF-COACHED career still escalates every
// single one, and it always did: the 8k/working frozen career has carried 3 arrivals / 3 escalations
// / 106 jammed weeks since long before any of this. The drain is what makes «this harness does not
// care who answers» true instead of merely intended.
//
// ⚠⚠ AND THE T6b LAW IS ABSOLUTE: A DRAIN MUST NEVER OVERWRITE A MEASURING ARM. A harness whose
// subject IS the knock answers it itself, and must not import this file:
//   · `tools/spirit-bench.ts`   – the T12 pair. The arm label IS the `KnockChoice`; both arms price it.
//   · `tools/knock-rate.ts`     – `bench:knock`. The answer is the sweep's own variable.
//   · `tools/load-bench.ts`     – the tap ladder. It counts who answered, which is the measurement.
//   · `tools/e2e-fixtures.ts`   – several recipes REQUIRE a pending knock, or reject a seed that grows
//                                 one; an answered knock is a fixture that no longer boots the journey.
//   · `tools/life-arrival.ts`   – `decides` is an ARM of that bench, so it answers under its own flag.
// The test is not «does it call `decideKnock`» but «does anything it prints depend on the answer».
//
// ⚠⚠ AND THE LAW HAS TO BE CHECKED THROUGH HELPERS, NOT ONLY AT CALL SITES – which is how this step
// broke it once and was caught by a gate. `tools/econ-bench.ts`'s `stepCareerWeek` is the walk BOTH of
// the last two harnesses above are built on, so putting the drain inside it handed them the drain
// without either of them asking. Measured: `npm run e2e:fixtures` exited 1 with «junior: no seed in
// 200 reached the state», 200 of 200 rejected for «boots without an open knock», because there was no
// longer such a week in the game to find. `stepCareerWeek` therefore takes `{ drainKnocks: false }`
// and those two pass it. A shared helper reaches further than the file it is written in.
import { decideKnock, pendingKnock, type WorldState } from '../src/engine/world'

/** ⭐ ANSWER AN OPEN KNOCK THE WAY A CAREFUL PARENT WOULD – rest it – SO THE WALK CAN GO ON. Returns
 *  whether there was one to answer, which is what a harness counts if it wants the number at all.
 *
 *  ⚠ `'rest'` AND NOT `'push'`, and the choice is the conservative one on purpose. Both answers move
 *  `bond` (rest +1, push −3, push-on-a-repeat −5), so unlike `drainLifeBeats` there is NO bond-neutral
 *  option to take and this helper cannot pretend to be free. What it can be is the SAME answer every
 *  time, in every arm, so no arm of any bench can differ through it – which is exactly the property
 *  the six hand-written `decideKnock(world, 'rest')` lines this replaces were relying on, spelled once.
 *  A harness that needs the other answer is a harness that is measuring the answer, and the banner
 *  above says what it must do instead.
 *
 *  ⚠ THE TERMINAL LATCH IS TESTED, NEVER CAUGHT – `tools/spirit-bench.ts`'s anti-stall contract. A
 *  knock raised by the tick that ALSO ended the career is a legitimate refusal (`decideKnock` calls
 *  `guardNotEnded`), so it is asked about rather than wrapped in a `try/catch`; any OTHER refusal
 *  still propagates and kills the run, which is how a walk that measures nothing fails loudly instead
 *  of exiting 0. */
export function drainKnock(world: WorldState): boolean {
  if (!pendingKnock(world) || world.ending !== null) return false
  decideKnock(world, 'rest')
  return true
}
