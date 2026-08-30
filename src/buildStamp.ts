// THE INJECTION POINT, AND NOTHING ELSE (round 29 #19).
//
// These two constants are where the build stamp lands. `vite build` rewrites each
// `import.meta.env.VITE_BUILD_*` read into a string literal, so after a build this file CONTAINS the
// commit and the date as data. Nothing is fetched, read from a manifest or asked of the service
// worker – a version line that resolves itself at runtime can disagree with the bundle it is printed
// by, and a version line that lies is worse than no version line. vite.config.ts sets the pair from
// `scripts/build-stamp.mjs` and carries the argument for the mechanism.
//
// ⚠ IT IS A SEPARATE MODULE FROM THE FORMATTING ON PURPOSE. `composables/buildInfo.ts` holds the
// fallback and the wording; this file holds only the substitution. That split is what lets a test
// mount the real screen with the constants ABSENT – the case a clean checkout or a CI container with
// no git history will produce one day – and watch the line render `unknown` rather than a blank.
//
// The optional chain is not decoration: a bundle produced by anything that never ran our config has
// no `import.meta.env` at all, and `''` is the honest answer there.

export const RAW_BUILD_SHA: string = import.meta.env?.VITE_BUILD_SHA ?? ''
export const RAW_BUILD_DATE: string = import.meta.env?.VITE_BUILD_DATE ?? ''
