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

- Work on a branch; never commit directly to `main`.
- Preserve unrelated user changes and avoid destructive Git commands.
- Keep TypeScript straightforward: explicit domain names, narrow types, and no abstraction without
  a demonstrated second use or a protected architectural boundary.
- Balance changes require measured before/after evidence from the relevant bench or simulation.
- Update a canonical context pack when a change invalidates one of its current-truth bullets,
  invariants, routes, or verification commands.

## Verification

- During implementation, run the smallest relevant Vitest file or project.
- Run `npm run context:audit` after changing governed documentation.
- Run `npm run check` once before final delivery; it performs the documentation audit, TypeScript
  check, unit suite, and production build.
- Summarize failures by test name and relevant error. Do not paste complete successful output into
  handoffs or documentation.

