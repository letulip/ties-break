// Types for scripts/build-stamp.mjs. The script stays plain ESM JS so `node scripts/build-stamp.mjs`
// works with no TS loader; vite.config.ts imports it and so does the test suite, so it needs a
// declaration – same arrangement as scripts/optimize-art.d.mts and scripts/heavy-tests.d.mts.

/** What a field falls back to when nothing can honestly fill it. */
export declare const UNKNOWN: 'unknown'

/** The commit this build was made from, as 7 hex characters, or `UNKNOWN`.
 *  `env` and `cwd` are injectable so the fallback path can be exercised by a test. */
export declare function buildSha(env?: NodeJS.ProcessEnv, cwd?: string): string

/** The day the bundle was built, `YYYY-MM-DD` in UTC, or `UNKNOWN` for an invalid date. */
export declare function buildDate(now?: Date): string

/** Both fields, as vite.config.ts bakes them into the bundle. */
export declare function buildStamp(
  env?: NodeJS.ProcessEnv,
  cwd?: string,
  now?: Date,
): { sha: string; date: string }
