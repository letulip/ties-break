// A CLASS ATTRIBUTE IS A SET OF TOKENS, AND A PIN ON IT SHOULD SAY SO.
//
// ⚠ WHY THIS EXISTS (T6.4 · F-09, 28.09). Three files pinned the shell's floating week bar as the
// exact attribute text `class="next-week-bar"`:
//   tests/round13-nav.test.ts, tests/round13.test.ts, tests/round9.test.ts.
// F-09 gives that box a shared object under a NEUTRAL name, so the shipped attribute becomes
// `class="next-week-bar floating-cta"` and all three pins go red on a change that moves nothing they
// were talking about. The claim each of them is actually making is «the shell's bar is THIS class»,
// and that claim survives a second token.
//
// ⚠⚠ AND THE REPLACEMENT IS STRICTER THAN THE OBVIOUS LOOSENING, WHICH IS THE ONLY GROUND ON WHICH A
// GUARD MAY BE RE-AIMED. The cheap repair is `toContain('next-week-bar')` – and that is satisfied by
// `class="next-week-barn"`, by `class="with-next-week-bar"` and by a COMMENT naming the class, none
// of which is the fact. This helper parses the attribute and compares WHOLE TOKENS: indifferent to
// order and to what else is on the element, and unsatisfiable by a longer name or by prose.
//
// ⚠ THE NEGATIVE DIRECTION IS DELIBERATELY NOT HERE. `round13-nav.test.ts`'s sweep – no tab screen
// carries `next-week-bar` – reads the file as raw TEXT on purpose, comments included, because the
// rule it protects is that the SENTENCE does not appear in a tab screen at all. A token-aware
// version of that assertion would be a weakening, so it stays a raw `not.toContain` and this file
// offers no tool for it.

/** Every `class="…"` attribute in `src`, each split into its whitespace-separated tokens. */
export function classTokenSets(src: string): string[][] {
  return [...src.matchAll(/class="([^"]*)"/g)].map((m) => m[1].split(/\s+/).filter(Boolean))
}

/**
 * Does some element in `src` carry EVERY one of `want` in one static `class` attribute?
 *
 * Whole-token comparison, any order, any number of other classes beside them. A comment that names
 * the class cannot satisfy it, and neither can a longer class that merely starts with the same text.
 */
export function carriesClasses(src: string, ...want: string[]): boolean {
  return classTokenSets(src).some((tokens) => want.every((w) => tokens.includes(w)))
}

/** How many elements in `src` carry every one of `want` – for a pin that also counts the sites. */
export function countCarrying(src: string, ...want: string[]): number {
  return classTokenSets(src).filter((tokens) => want.every((w) => tokens.includes(w))).length
}
