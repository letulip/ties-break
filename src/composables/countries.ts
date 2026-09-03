// HER COUNTRY, IN WORDS AND AS A FLAG – once, for the five surfaces that print one.
//
// ⚠ WHY THIS IS A COMPOSABLE AND NOT `shared/` OR `engine/`. Nothing here is a rule: the engine
// stores a two-letter code on `PlayerProfile` and never needs to render it, and invariant 1 says the
// engine may not learn about the UI. This is PRESENTATION – the English name a screen prints and the
// regional-indicator pair a screen draws – so it lives with the other view helpers and the engine
// stays unaware it exists.
//
// WHAT WAS ACTUALLY WRONG. `flagEmoji` was byte-identical in five components (OnboardingWizard,
// TournamentFlow, HomeScreen, MoreScreen, KidScreen) and the twenty-four-entry name map was written
// out twice (OnboardingWizard, KidScreen). Neither copy was a variation on the other, which is the
// tell: five identical definitions are not five decisions, they are one decision pasted five times,
// and a twenty-fifth country would have had to be added in two files with nothing to say so.

/** The playable countries in words. The keys are exactly the codes onboarding offers – a name here
 *  with no code to pick it is unreachable, and a code with no name falls back to the bare two
 *  letters at every call site rather than rendering an empty label. */
export const COUNTRY_NAMES: Record<string, string> = {
  US: 'United States', GB: 'United Kingdom', FR: 'France', ES: 'Spain', IT: 'Italy', DE: 'Germany',
  RU: 'Russia', RS: 'Serbia', CH: 'Switzerland', CZ: 'Czechia', PL: 'Poland', UA: 'Ukraine',
  KZ: 'Kazakhstan', BY: 'Belarus', AU: 'Australia', JP: 'Japan', CN: 'China', KR: 'South Korea',
  IN: 'India', BR: 'Brazil', AR: 'Argentina', CA: 'Canada', NL: 'Netherlands', SE: 'Sweden',
}

/** The playable codes, in the order onboarding offers them.
 *
 *  ⚠ MOVED OUT OF `OnboardingWizard.vue` (02.09.2026), where it was `const COUNTRIES` – for exactly
 *  the reason at the top of this file. The prologue's age-5 card now asks for her country too
 *  (owner: «страну тоже добавь, да»), so the twenty-four codes were about to be a second copy in a
 *  second component, which is the shape this module exists to prevent.
 *
 *  ⚠ `tests/season/wildCard.test.ts` PINNED THAT DECLARATION BY NAME and said in its own words «if
 *  this throws, the COUNTRIES array moved – re-aim this pin, do not delete it». It was re-aimed, and
 *  it got stronger on the way: the pin read the wizard's SOURCE because the array was locked inside
 *  a `<script setup>` where no runtime import could reach it, and this module can simply be
 *  imported. A source pin became the real value. */
export const COUNTRIES: readonly string[] = [
  'US', 'GB', 'FR', 'ES', 'IT', 'DE', 'RU', 'RS', 'CH', 'CZ', 'PL', 'UA',
  'KZ', 'BY', 'AU', 'JP', 'CN', 'KR', 'IN', 'BR', 'AR', 'CA', 'NL', 'SE',
]

/** The nine POPULAR tiles, in the design's own order
 *  (docs/design/screenshots/P-onboarding-country). A shortcut into the same 24, never a different
 *  list: whatever is chosen through it is one of `COUNTRIES`. */
export const POPULAR_COUNTRIES: readonly string[] = ['US', 'GB', 'AU', 'CA', 'DE', 'FR', 'ES', 'IT', 'JP']

/**
 * The flag for a two-letter country code, built from the regional-indicator block (U+1F1E6 is 'A',
 * so each letter maps to its own indicator and the pair renders as one flag).
 *
 * ⚠ An empty code returns an empty string rather than a pair of stray indicators – onboarding has a
 * step where no country has been chosen yet, and `''` is what lets a template print nothing at all
 * instead of a placeholder glyph.
 */
export function flagEmoji(code: string): string {
  if (!code) return ''
  return String.fromCodePoint(...[...code].map((c) => 0x1f1e6 + c.charCodeAt(0) - 65))
}
