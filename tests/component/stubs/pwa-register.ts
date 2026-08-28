// THE `virtual:pwa-register` STUB, AND WHY A TEST HARNESS OWNS ONE.
//
// `vite-plugin-pwa` INJECTS this module at build time; under Vitest it does not exist, so importing
// `src/pwa.ts` - and therefore `src/App.vue`, which imports it for the update banner - died at
// resolve time. `tests/a11y-banner-names.test.ts` recorded that as the reason the app shell's two
// top banners were pinned as source text instead of mounted, and named this file as the fix:
// "making it mountable means an alias in the shared vite.config.ts". Round 28 #10 needed the claim
// a source pin cannot make - what a button SAYS when it is rendered - so the alias is in, scoped to
// the `component` project alone (see the note beside it in vite.config.ts).
//
// ⚠ IT REGISTERS NOTHING AND MUST NOT. The real module hands back an `updateSW` that activates a
// waiting service worker and reloads the page; a test that reloaded happy-dom's document mid-mount
// would be a harness that eats its own suite. `initPwa` calls `registerSW` once and stores the
// return value, so the honest stub is a function of the same SHAPE that does nothing: no worker, no
// callbacks fired, `needRefresh` stays false and the update banner never renders. A suite that
// wants that banner sets `needRefresh` itself - it is a plain `ref` exported from src/pwa.ts.
export function registerSW(_options?: unknown): (reloadPage?: boolean) => Promise<void> {
  return () => Promise.resolve()
}
