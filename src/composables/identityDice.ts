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
import { rngFromSeed } from '../engine/rng'

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

/** ⭐⭐ ROUND 46 #21 – ONE NAME, AS TWO PEOPLE READ IT. The owner, 05.10 (translated; a `.ts` file in
 *  this layer keeps to English): if «A daughter came later» is chosen, the daughter's name must surely
 *  not be her mother's. The card opened on it.
 *
 *  Two names are the same name here when they differ only in case, spacing or an accent – `Amelie` and
 *  ` AMÉLIE ` are one girl – because the question is whether a parent would read two of them on one
 *  family tree and stop, not whether two strings are equal. An empty name is nobody's, so it is never
 *  «the same» as another empty one. */
export function sameFirstName(a: string, b: string): boolean {
  const fold = (s: string): string => s.normalize('NFD').replace(/\p{M}/gu, '').trim().toLowerCase()
  return fold(a) !== '' && fold(a) === fold(b)
}

/** The menu the die may land on, LESS one name – FILTERED BEFORE THE DRAW, never re-rolled after it.
 *  A re-roll is a loop with no fixed number of draws and a bias towards whatever the first miss would
 *  have been; a filter is one draw over a shorter list, which is also what makes the claim «never
 *  her mother's» a statement about the list and not about luck.
 *
 *  ⚠ A pool the exclusion would EMPTY is not a pool, so it falls back to the whole menu. With 24 names
 *  that is unreachable; the branch exists so a future one-name menu cannot index past its end. */
export function namePoolWithout(exclude?: string): readonly string[] {
  if (!exclude) return NAME_POOL
  const rest = NAME_POOL.filter((n) => !sameFirstName(n, exclude))
  return rest.length > 0 ? rest : NAME_POOL
}

/** One first name off the pool – and, on a dynasty run, off the pool LESS HER MOTHER'S NAME (round 46
 *  #21: pass `motherName.first`). Named as the wizard named it, so the move cost that file two
 *  deletions and an import. Still exactly ONE `Math.random` draw, over the filtered list. */
export function randomName(exclude?: string): string {
  const pool = namePoolWithout(exclude)
  return pool[Math.floor(Math.random() * pool.length)]
}

/** ⭐⭐ ROUND 46 #21 – THE FIRST NAME A DYNASTY CARD OPENS ON. `standing` is the default every prologue
 *  career opens on (`OPENING_IDENTITY.kidName`, «Alice»), and a mother who never touched that field
 *  is exactly the common case: the daughter's card then opened on her mother's name, which is what
 *  the owner met. So the default stands UNLESS it is the mother's, and only then is a name picked.
 *
 *  ⚠ THE PICK IS ONE DRAW ON A PURPOSE-SCOPED SUB-STREAM, `${childSeed}:daughter-name`, derived here and
 *  persisted nowhere – the CLAUDE.md RNG law's own shape (never MAIN; there is no world yet to have a
 *  MAIN, and the daughter's world will be born on this very seed). Reproducible by construction: the
 *  same line, taken through the same rulings, opens on the same name, which is his variation law;
 *  and the parent still types over it («the parent chooses the name» stands – this only stops the
 *  card from proposing the mother's own). The pool is filtered first, so the draw count is one. */
export function dynastyOpeningName(childSeed: string, motherFirst: string, standing: string): string {
  if (!sameFirstName(standing, motherFirst)) return standing
  const pool = namePoolWithout(motherFirst)
  return pool[Math.floor(rngFromSeed(`${childSeed}:daughter-name`)() * pool.length)]
}

/** One surname off the pool – the wizard's second die, and its `start()` fallback for a career
 *  whose surname field was cleared. */
export function randomSurname(): string {
  return SURNAME_POOL[Math.floor(Math.random() * SURNAME_POOL.length)]
}
