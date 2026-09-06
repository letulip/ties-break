// WHICH COUNTRIES A CAREER MAY BE OPENED IN – the RULE, and nothing at all about how one is drawn.
//
// ⚠⚠ WHY THE CODES ARE HERE WHILE THE NAMES AND THE FLAGS STAY IN `composables/countries.ts`.
// That file's header is right, and this module does not contradict it: the English name a screen
// prints and the regional-indicator pair a screen draws ARE presentation, and the engine must stay
// unaware of both. It does not follow that the SET is presentation. *Which* countries are playable
// decides whether the engine opens a career at all – `profileShapeError` refuses a profile naming
// one that is not – and a rule the engine enforces cannot live behind a boundary the engine may not
// cross (invariant 1: nothing in `src/shared` may import `src/composables`; the dependency runs the
// other way). So: the codes are a rule and live here, the words and the glyphs are a picture and
// live there, and that file DERIVES its keys from this list so the two cannot drift.
//
// ⚠ WHAT WAS ACTUALLY WRONG (owner, 06.09: «country проверяется на форму, а не по списку – мне
// кажется это надо исправить»). `profileShapeError` asked only whether the value LOOKED like an ISO
// 3166-1 alpha-2 code, so `'ZZ'` opened a career and then cost a fallback label on every surface
// that prints her passport: a bare `ZZ` where a country name belongs and a pair of stray letters
// where a flag belongs. A shape is not a list, and the review that added the gate said so itself.
//
// ⚠ IT IMPORTS NOTHING, exactly like `shared/dates.ts`, which is what makes the edge from
// `shared/protocol/profile.ts` free: the wire's validator reaches this list and this list reaches
// nothing back. It is deliberately NOT in the `shared/protocol` barrel – that barrel is the message
// format between the worker and the UI, and `engine/world.ts` re-exports from it, which is the
// duplicate-identifier hazard CLAUDE.md names and the reason profile.ts keeps its other
// enumerations module-private.

/** ⭐ THE PLAYABLE COUNTRIES, in the order onboarding offers them.
 *
 *  ⭐⭐ ADDING ONE IS THIS LINE PLUS ITS NAME (owner, 06.09: «у меня в планах было расширить список
 *  стран вообще»). Add the code here, add the English name to `COUNTRY_NAMES` in
 *  `composables/countries.ts`, and that is the whole edit: the flag is derived from the code, the
 *  picker, the search, the summary and the prologue's age-5 card all read this list through that
 *  file, and `profileShapeError` starts accepting it the moment it is here.
 *
 *  ⚠ FORGET THE NAME AND THE COMPILER SAYS SO FIRST – `COUNTRY_NAMES`'s literal is typed
 *  `Record<PlayableCountry, string>`, so a missing key is a type error naming the code and an extra
 *  key is a type error naming the name. `tests/r37-playable-countries.test.ts` then says it again at
 *  runtime, in both directions, because a type check is not a thing the owner runs while adding a
 *  country and a red test is.
 *
 *  ⚠ ONE CONSEQUENCE IS NOT AUTOMATIC, and a test names it for you. A code outside the 36 in
 *  `engine/season/names.ts`'s `NATION_WEIGHTS` cannot HOST a tournament, and
 *  `tests/season/wildCard.test.ts` reddens with «<code> is playable but can never host – a mechanic
 *  that never fires». `BY` is the one such code today, which is exactly why `HOST_NATIONS` reads
 *  `[...NATION_POOL, 'BY']`. */
export const PLAYABLE_COUNTRIES = [
  'US', 'GB', 'FR', 'ES', 'IT', 'DE', 'RU', 'RS', 'CH', 'CZ', 'PL', 'UA',
  'KZ', 'BY', 'AU', 'JP', 'CN', 'KR', 'IN', 'BR', 'AR', 'CA', 'NL', 'SE',
] as const

/** One of the codes above. Narrow on purpose: it is what lets `COUNTRY_NAMES`'s literal be checked
 *  for completeness by the compiler rather than by a comment asking nicely. */
export type PlayableCountry = (typeof PLAYABLE_COUNTRIES)[number]

const PLAYABLE = new Set<string>(PLAYABLE_COUNTRIES)

/** IS THIS A COUNTRY THE GAME OFFERS? Total over `unknown` for the same reason `profileShapeError`
 *  is: the caller is validating a WIRE payload and the sender may be anything. */
export function isPlayableCountry(code: unknown): code is PlayableCountry {
  return typeof code === 'string' && PLAYABLE.has(code)
}
