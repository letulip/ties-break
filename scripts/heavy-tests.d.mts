// Types for scripts/heavy-tests.mjs. The module stays plain ESM JS so the two shard scripts
// (`scripts/units.mjs`, `scripts/sim.mjs`) can import it on any Node without a TS loader;
// vite.config.ts imports it too, so it needs a declaration – same arrangement as
// scripts/optimize-art.d.mts.

/** The Monte-Carlo sim files, as bare repo-relative paths. Given to vitest one per process by
 *  `scripts/sim.mjs`, and declared as the `sim` project's `include` in vite.config.ts. */
export declare const HEAVY_SIM_FILES: readonly string[]

/** The heavy unit tail, as bare repo-relative paths. Given a process each by `scripts/units.mjs`,
 *  and excluded from the unit project's bulk pass when `TB_UNIT_SKIP_HEAVY` is set. */
export declare const HEAVY_UNIT_FILES: readonly string[]

/** Bare paths -> the `**\/`-prefixed patterns a vitest project's `include`/`exclude` matches with.
 *  The prefix is required: project patterns are matched against the resolved path. */
export declare function asProjectGlobs(files: readonly string[]): string[]
