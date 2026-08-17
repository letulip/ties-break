// THE RATING – one number per player, from which the odds of any match can be read.
//
// ⚠ THIS EXISTS BECAUSE THE OWNER ASKED FOR D&D, NOT BECAUSE A NUMBER LOOKED NICE. Round 21:
// «есть DnD система, она учитывает результаты не только брошенных кубиков, но и скиллы персонажей и
// мультипликаторы. Я бы хотел, чтобы у нас тоже появились четкие формулы, по которым более менее
// точно можно предсказывать и нам самим и игрокам не биться головой в бетон.» And, ruling:
// «у игрока с силой 16 и броском 20 есть шансы против игрока с силой 25 и таким же дайсом д20 в
// руках… шансы выиграть должны быть у всех, но не у всех одинаковые.»
//
// His analogy maps onto this engine exactly, and the mapping is the whole design:
//
//     D&D            here
//     ------------   ---------------------------------------------------------------
//     strength 16    her RATING
//     strength 25    her opponent's RATING
//     the d20        the match – best-of-three, point by point
//     the target     P(win) = 1 / (1 + 10^(-(mine - hers) / 400))
//
// ⚠ THE RATING IS DERIVED FROM THE MATCH MODEL, NEVER ASSERTED ALONGSIDE IT. It would have been
// easy – and wrong – to publish `20.2 x core` as a rating: `basePServe` reads serve, return AND
// groundstrokes, not "core", so a rating built on an average would disagree with the match it claims
// to predict, and a number that lies about the thing it labels is worse than no number. Instead the
// rating is the engine's OWN serve-point driver, read straight out of `basePServe` and scaled – see
// `ratingOf` for why that particular form and not the more obvious one. The difference of two
// ratings reproduces the odds those two players actually face to within **1.03 percentage points**,
// which is the property `tests/rating.test.ts` MEASURES over every build pair rather than assumes.
//
// ⚠ ZERO RNG, ZERO STATE, NO WORLD. Pure in (player, surface, tour). That is what lets the UI quote
// it and the engine invariant hold – see CLAUDE.md invariant 1.
//
// =================================================================================================
// ⚠⚠ AND IT IS DELIBERATELY NOT ON ANY SCREEN. THIS IS A RULING, NOT AN OVERSIGHT.
// =================================================================================================
//
// It had a surface for exactly two commits – a «Rating 1642 vs 1801» line under the odds ring on the
// calendar card and the season card. The owner took it off, round 21: «под кольцом на карточке
// турнира и на карточке сезона пишется "Рейтинг 1642 против 1801" - я не просил этого делать, лишняя
// информация, убери пожалуйста.»
//
// ⚠ THE REQUEST HE DID MAKE AND THE SURFACE I BUILT ARE NOT THE SAME THING, which is the lesson worth
// keeping. He asked for PREDICTABLE FORMULAS – «чтобы более менее точно можно предсказывать» – so
// that a player is not made to bang her head against concrete. That is a property of the MODEL: the
// odds have to be derivable, monotone and never zero. It is not a request for a second number beside
// the first. The ring already answers "what are her chances"; the rating answers "why", and he did
// not ask the card to answer why.
//
// ⚠ SO THE MODULE IS KEPT, AND KEPT MEASURED. Deleting it would throw away the only artefact that
// proves the odds ARE a formula – the property he asked for – and it costs nothing to keep: pure,
// stateless, no RNG, no world, ~90 lines, and mutation-verified. `season/preview.ts` still computes
// `kidRating` / `opponentRating` onto every `EventPreview` for the same reason: they are the audit
// trail of the ring beside them, and the day a surface is wanted the pipe is already there.
//
// ⚠ PUTTING A SURFACE BACK IS THE OWNER'S DECISION AND NOT A REFACTOR. `tests/rating.test.ts`'s last
// block is a negative guard on both `.vue` files and will go red the moment a rating is rendered
// again. If he asks for one, move the guard – do not delete it.

import type { MatchPlayer, Surface, Tour } from './types'
import { basePServe } from './point'

/** The scale's origin, chosen so the world #1 of the shipped population (core 76.4 – `SKILL_LAW` in
 *  season/fieldPros.ts) reads about **2195**, which is the live 2026 WTA Elo list's own number one.
 *  Our ratings are therefore readable against the real sport's without ever claiming to BE them. */
export const RATING_BASE = 1643

/** Elo points per unit of serve-point advantage. ⚠ FITTED, NOT CHOSEN: swept 3000-4600 against the
 *  engine's own `fastMatchProbability` over every core pair from 18 to 80 on all three surfaces, and
 *  3870 is the value that minimises the worst case. **Measured worst case at 3870: 1.03 percentage
 *  points.** Re-fit it (tools/, one sweep) if `SKILL_K`, `RALLY_K` or the scoring format ever move. */
export const ELO_PER_SERVE_EDGE = 3870

/** The reference build the scale is measured against – average in every attribute. Its age is left
 *  undefined on purpose: the pace term is a DIFFERENCE and is exactly zero for a player built
 *  without an age, so the reference can never hand anybody a bonus for being tall. */
const REFERENCE: MatchPlayer = {
  id: 'rating-reference',
  name: 'reference',
  serve: 50,
  ret: 50,
  composure: 50,
  stamina: 50,
  groundstrokes: 50,
}

/** Her rating. Higher is better; `RATING_BASE` is a completely average build.
 *
 *  ⚠⚠ WHY IT IS LINEAR IN THE SERVE EDGE AND NOT A CONVERTED WIN PROBABILITY – the first cut was the
 *  latter and it was wrong by up to EIGHT percentage points, which is worth recording because it
 *  looks more principled than what replaced it. Converting `fastMatchProbability` against the
 *  reference to Elo does not COMPOSE: the engine's Elo per skill point rises with the gap (19.8 at
 *  five core points, 23.5 at thirty), so two ratings each measured against a distant reference
 *  produce a difference that over-counts. Measured max error 7.98 points, 6.13 inside the range a
 *  card actually shows. A number that wrong is not a formula, it is a decoration.
 *
 *  This form composes EXACTLY, by construction. `basePServe` is linear in the attributes, so
 *
 *      driver(A) - driver(B)  ==  p(A serving vs B) - p(B serving vs A)
 *
 *  identically, for any two builds – the reference cancels. So the difference of two ratings IS the
 *  pair's own serve-point gap, scaled; the only residual is the logistic's fit to the best-of-three
 *  curve, and that is the 1.03 points `tests/rating.test.ts` pins.
 *
 *  ⚠ WHAT IT DOES NOT SEE, AND THE CARD ALREADY DID NOT: `basePServe` reads serve, return and
 *  groundstrokes. **Composure and stamina do not enter it at all** – they act through
 *  `modifiedPServe` on big points and past point 120. So the rating is exactly as complete as the
 *  percentage the card has always shown, which is the honest bar: it never claims to know something
 *  the ring beside it does not. ⚠ And two builds that trade serve for return one-for-one rate the
 *  SAME, because the model says they are the same – that is a property, not a rounding.
 *
 *  ⚠ SURFACE IS NEARLY INERT HERE, ON PURPOSE. The engine's own surface term is symmetric (both
 *  players get it), so it cancels in the gap; what makes a court favour a PLAYER is
 *  `applySurfaceStyle`, which the CALLER applies before building the MatchPlayer. Pass the same
 *  styled player the match will use and the rating is the styled one. */
export function ratingOf(player: MatchPlayer, surface: Surface, tour: Tour): number {
  const opts = { surface, tour, seed: '' }
  const driver = basePServe(player, REFERENCE, opts) - basePServe(REFERENCE, player, opts)
  return Math.round(RATING_BASE + ELO_PER_SERVE_EDGE * driver)
}

/** THE FORMULA ITSELF, and it is the one on the screen. Standard Elo, base 10, 400 per decade – the
 *  same expression `docs/research/the-upset-rate.md` quotes from Tennis Abstract ("A 100-point
 *  difference in Elo ratings implies that the favorite has a 64% chance"). */
export function chanceFromRatings(mine: number, theirs: number): number {
  return 1 / (1 + Math.pow(10, (theirs - mine) / 400))
}
