# Ties Break repository guidance

## Product

Ties Break is a mobile-first Vue and TypeScript tennis-career simulation. The player is the
parent of a developing player; honest match math, family economics, deterministic careers, and
safe long-lived saves matter more than decorative complexity.

## Context and evidence

- Start with [the context index](docs/context-index.md), then read only the context pack for the
  area being changed.
- Search with `rg` before opening files. Prefer a relevant symbol and a narrow line range over a
  whole large file.
- Do not read all of `docs/`, `src/`, a long Git diff, or a complete test log unless the task is
  explicitly a corpus-wide review.
- Runtime behavior is established by code and tests. Context packs route to that evidence;
  feature specs describe intent; plans describe future work; research and reviews are evidence,
  not current implementation.
- If prose conflicts with code, state the conflict and verify the tests before changing behavior.
- Keep reports compact: cite file paths and findings instead of reproducing long source excerpts.

## Architecture invariants

- The Web Worker owns authoritative simulation state; the UI consumes typed snapshots and sends
  commands through `src/shared/protocol.ts`.
- Engine behavior must remain deterministic. Never use `Math.random()` in `src/engine`; preserve
  the persisted main RNG state and purpose-scoped sub-stream discipline.
- Store money as integer cents. Use the shared money helpers instead of formatting or converting
  monetary values ad hoc.
- Save-schema changes require a migration, a golden fixture for the new version, and regression
  coverage for older fixtures.
- Match outcomes and presentation remain separated: visualization consumes the generated match
  record and must not influence the result.
- Prefer focused modules and shared helpers, but do not perform broad rewrites without behavior
  characterization and an explicit task requirement.

## Working agreement

- Work on a branch; never commit directly to `main`. Branch, then PR, then the owner merges.
- **Push to `origin` (GitHub) only, never to the `gitlab` remote.** The two `main` branches have
  diverged, and GitLab CI minutes are metered.
- **One branch per wave.** Small fixes accumulate into the wave in flight rather than spawning a
  branch each; the metered CI budget is the reason.
- Side work while a wave branch is active belongs in a **worktree** (`../tb-*`). Never switch the
  branch of the shared checkout out from under work in progress.
- Preserve unrelated user changes and avoid destructive Git commands.
- Keep TypeScript straightforward: explicit domain names, narrow types, and no abstraction without
  a demonstrated second use or a protected architectural boundary.
- Balance changes require measured before/after evidence from the relevant bench or simulation.
- Update a canonical context pack when a change invalidates one of its current-truth bullets,
  invariants, routes, or verification commands.

## Verification

- During implementation, run the smallest relevant Vitest file or project.
- Prefer `npm run test:quiet` over `npm test` for the unit suite: identical signal, roughly 6k fewer
  tokens of output per run. Same for `npm run test:sim` (already dot-reported).
- Run `npm run context:audit` after changing governed documentation.
- Run `npm run check` once before final delivery; it performs the documentation audit, TypeScript
  check, unit suite, and production build.
- **`vue-tsc` alone is not sufficient.** It elides type-only bindings from a value import, so a type
  re-exported through `import`/`export { ... }` typechecks green and then fails the production
  build. Types must leave a module via `export type { ... } from`. Only `npm run check` catches this.
- Summarize failures by test name and relevant error. Do not paste complete successful output into
  handoffs or documentation.

## Traps that have cost real time

- **Mounted component tests live in `tests/component/`** (vitest project `component`, run by
  `npm run test:component`). Add UI coverage there rather than as a new source pin, and mutate what
  you think you are covering before trusting a green run.
- **Source-pin tests.** Several tests read engine source text and assert on its structure. Read
  engine source through `tests/worldSource.ts` (world.ts plus every `world/*.ts`) rather than pinning
  a path. A slice taken between two markers whose end marker has moved returns `-1` and silently
  swallows the rest of the file, so a negative assertion can pass while proving nothing.
- **The sim project must run serialised.** Every script that runs it carries `--no-file-parallelism`
  and `--reporter=dot`; vitest tracks each file as one task and birpc gives that task's ack a
  hard-coded 60s window, so a file near 60s exits 1 with every test green. Keep sim files well under
  it. `tests/sim-serialisation.test.ts` enforces the flags.
- **`CLAUDE.md` carries the full invariant list** (RNG discipline including the frozen-capture pin,
  the three-part save-schema move, the world.ts decomposition rules). This file is the retrieval
  contract; that file is the reference. Where they overlap, `CLAUDE.md` wins and should be corrected
  first.

