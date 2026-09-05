// ⚠⚠ U-05 (review of 05.09, docs/review-principles-2026-09-05/03-ui.md) – THE OS SWITCH, ASKED ONCE.
//
// «Has this player asked their system for less motion» was written out five times in five different
// spellings: `composables/dayCross.ts` (guarded with a `typeof` and a try/catch), `trophyArrival.ts`
// (guarded with a `typeof window`), and inline in `weekPager.ts`, `ui/ConfettiBurst.vue` and
// `MoneyScreen.vue` (`window.matchMedia?.(…)?.matches ?? false`). Every copy answered the same
// question and no two of them were the same code, which is how a predicate comes to have four
// behaviours in the environments where it is hard: a worker, a test runner, an old browser.
//
// ⚠ THE MOST DEFENSIVE SPELLING IS THE ONE THAT SURVIVED, and it is `dayCross.ts`'s. `matchMedia`
// is a browser API: it does not exist in a Web Worker or under a bare test runner, and a `?.` on
// `window.matchMedia` does not help when `window` itself is undefined. The `typeof` check answers
// both, and the try/catch answers the browsers that throw on an unparseable query rather than
// returning a non-matching list.
//
// ⚠ ASKED AT THE MOMENT IT MATTERS, NEVER AT MODULE LOAD. A player can change the preference without
// reloading the PWA, and every caller here is on a path that runs when something is about to move –
// a take-off, a scroll, a sweep. A module-level constant would answer with whatever was true when
// the bundle was parsed.
//
// ⚠ IT IS DELIBERATELY NOT REACTIVE. `matchMedia` returns a live list and one could be watched, but
// nothing in the app re-renders on the answer: every caller reads it once, at the moment it decides
// whether to move. A reactive version would need a listener per caller and a teardown for each, for
// a preference that changes about once in a device's life. The CSS half of the policy IS live, as
// CSS always is (`@media (prefers-reduced-motion: reduce)` in src/style.css and in the components
// that animate), so the screen follows the switch even when script has already decided.

/** Has the player asked their system for less motion? False wherever the question cannot be asked. */
export function prefersReducedMotion(): boolean {
  try {
    return typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches
  } catch {
    return false
  }
}
