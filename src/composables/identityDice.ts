// THE DICE BOTH PATHS INTO A CAREER ROLL – ONE POOL, TWO READERS.
//
// The owner, 14.09.2026: «вернуть "кубики" на имя и фамилию при создании, оставив дефолт текущий, у
// нас они были, но куда-то пропали». NOTHING HAD BEEN DELETED. The two dice have stood beside the
// wizard's name fields since onboarding shipped; what moved is where a career STARTS. Creation went
// to the childhood prologue, and the age-5 identity card was built with plain inputs – so the dice
// were still on screen, on the screen the player no longer meets. This file is what makes putting
// them back a restore rather than a second implementation.
//
// ⚠⚠ WHY THE POOL LIVES HERE AND NOT IN EITHER SURFACE, and it is the same argument
// `composables/identityCopy.ts` makes one file over about the LABELS: two surfaces asking one
// question must ask it out of one declaration, or the two answers drift and every pin on each side
// stays green while they do. The first-name list was a private `const NAMES` inside
// `OnboardingWizard.vue`; copying those 24 names onto the prologue card would have made the
// player's «Random first name» mean two different sets depending on which door she came through.
// So the wizard now reads the pool from here too, under the very function names it had
// (`randomName` / `randomSurname`), and there is no second copy of any list anywhere.
//
// ⭐ THE SURNAMES ARE NOT COPIED EITHER – `SURNAME_POOL` IS `SURNAMES`, the same array object, not
// an array with the same contents. `tests/component/prologue-dice.test.ts` asserts that identity
// with `toBe`, so "one pool" is a property a reference check can see rather than a claim in a
// commit message.
//
// ⚠ `Math.random` IS LEGAL EXACTLY HERE, and CLAUDE.md's invariant 2 is not bent to say so. That
// law governs the ENGINE's dice – the MAIN stream whose position is persisted per career and whose
// input-independence is a fairness property. This runs before any world exists: there is no seed to
// derive from, nothing here is persisted, and the value lands in a text field the player can still
// type over. It is the wizard's own precedent, moved with the code that had it (`randomName` has
// read `Math.random` since onboarding shipped), and `OPENING_PROMISE` in the wizard does the same
// thing one screen earlier.
//
// ⚠ FROM `engine/season/names.ts`, NOT `engine/season/cohort.ts`. Same reason `engine/coach.ts`
// states in its own import note (TB-07): `names.ts` is the leaf that imports only the RNG, while
// cohort pulls development in behind it. The wizard read SURNAMES through cohort's re-export and
// could afford to – a component is nobody's dependency – but this module is imported BY two
// components, so it takes the short edge. `src/prologue/pool.ts` already reads the leaf.
//
// This is PRESENTATION and invariant 1 is intact: the UI reads the engine's vocabulary, the engine
// never reads this file.
import { SURNAMES } from '../engine/season/names'

/** The first names the die can land on – the wizard's own list, moved verbatim from its private
 *  `const NAMES` and unchanged by the move.
 *
 *  ⚠ NOT `engine/season/names.ts`'s `FIRST_NAMES`, and they are deliberately different lists. That
 *  one names the 199 juniors of her cohort and the ~300 professionals of the field, and its LENGTH
 *  is load-bearing arithmetic in a seeded draw (see its own note: growing it re-maps every index).
 *  This one is a menu for one human choice, spent once, before a world exists – so it can be
 *  appended to, reordered or shortened on a whim without a single career changing. */
export const NAME_POOL: readonly string[] = [
  'Vera', 'Alexandra', 'Maria', 'Elena', 'Sofia', 'Anna', 'Iga', 'Coco', 'Aryna', 'Mirra',
  'Emma', 'Olivia', 'Zoe', 'Lea', 'Carla', 'Bianca', 'Naomi', 'Yuki', 'Ines', 'Petra',
  'Milena', 'Dana', 'Lucia', 'Amelie',
]

/** The surnames the second die can land on, and it IS the world's own pool – she shares a surname
 *  vocabulary with the juniors she will grow up against, which is what the export on `SURNAMES` was
 *  opened for in the first place («the kid draws a last name from the same pool»). A re-export
 *  rather than a copy, on purpose: see the ⭐ in the header. */
export const SURNAME_POOL: readonly string[] = SURNAMES

/** One first name off the pool. Named as the wizard named it, so the move cost that file two
 *  deletions and an import. */
export function randomName(): string {
  return NAME_POOL[Math.floor(Math.random() * NAME_POOL.length)]
}

/** One surname off the pool – the wizard's second die, and its `start()` fallback for a career
 *  whose surname field was cleared. */
export function randomSurname(): string {
  return SURNAME_POOL[Math.floor(Math.random() * SURNAME_POOL.length)]
}
