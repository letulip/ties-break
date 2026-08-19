---
type: context-pack
status: current
area: saves
canonical: true
last-reviewed: 2026-08-03
---

# Saves and worker context

## Current truth

- The worker owns the mutable `WorldState`; UI code talks through the typed protocol and
  consumes snapshots.
- `SAVE_SCHEMA_VERSION` is v53 (`src/engine/world.ts`); the persisted main RNG position arrived at
  v35, so loads resume `{s, n}` rather than replaying the career.
- ⚠ THAT NUMBER ROTS SILENTLY BECAUSE NOTHING CHECKS IT – wrong three times now (v36, v45, and v52
  when v53 shipped the field's season ledger on 19.08 without this line moving with it).
  `context:audit` covers structure, links, metadata and budgets; the only claim it reads the engine
  for is the age grid. So verify without trusting this file: the highest fixture in
  `tests/fixtures/saves/` IS the current version, since `goldenSaves.test.ts` enforces one per
  version from v0. Fix this line in the commit that bumps the constant.
- Exported saves use a versioned binary envelope, gzip payload and SHA-256 check; import validation
  and migrations are separate responsibilities.
- IndexedDB slots and autosave recovery are user data: changes need failure-path tests, not only
  happy round trips.

## Read order

1. `src/worker/client.ts` and `src/worker/sim.worker.ts` for command lifecycle.
2. `src/shared/protocol.ts` for the wire contract and snapshots.
3. `src/db/saves.ts` and `src/db/idb.ts` for slot persistence.
4. `src/engine/saveCodec.ts`, `saveGuard.ts`, and `migrations.ts` for import and compatibility.
5. `src/engine/world.ts` and `rng.ts` only for state/version/RNG questions.

## Invariants

- A failed command or persistence operation must not appear committed to the UI.
- Loading, restoring, or importing must not silently destroy a known-good slot.
- Worker restart/recovery must reject stale responses from an older worker generation.
- A schema bump is append-only: migration plus fixture plus tests in the same change.
- Main RNG state must pass its consistency check; purpose-scoped sub-streams remain derivable.
- Never log, upload, or transmit player saves as part of diagnostics.

## Focused verification

`npm test --` plus the smallest relevant group:

- `tests/goldenSaves.test.ts tests/migrations.test.ts`
- `tests/saveCodec.test.ts tests/save-import-guard.test.ts`
- `tests/saves.test.ts tests/storage-recovery.test.ts tests/store-recovery.test.ts`
- `tests/sim-worker-pipeline.test.ts tests/worker-client-recovery.test.ts`

Then `npm run check` before delivery.

## Broaden context when

- A command changes both worker state and IndexedDB state.
- A protocol field is persisted or exposed in a snapshot.
- A save change interacts with multiple tabs, PWA lifecycle events, import limits, or recovery UI.

