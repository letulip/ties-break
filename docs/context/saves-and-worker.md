---
type: context-pack
status: current
area: saves
canonical: true
last-reviewed: 2026-08-03
---

# Saves and worker context

## Current truth

- The simulation worker owns the mutable `WorldState`; UI code communicates through the typed
  protocol and consumes snapshots.
- `SAVE_SCHEMA_VERSION` is v36. The persisted main RNG position was introduced at v35, so current
  loads resume `{s, n}` rather than replaying the whole career to recover the stream.
- Every schema version from v0 through the current version has a golden fixture, and the golden-save
  test requires a new fixture whenever the version increases.
- Exported saves use a versioned binary envelope, gzip payload, and SHA-256 integrity check. Import
  validation and migrations are separate responsibilities.
- IndexedDB slots and autosave recovery are user data. Changes here require failure-path tests, not
  only successful round trips.

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

- `npm test -- tests/goldenSaves.test.ts tests/migrations.test.ts`
- `npm test -- tests/saveCodec.test.ts tests/save-import-guard.test.ts`
- `npm test -- tests/saves.test.ts tests/storage-recovery.test.ts tests/store-recovery.test.ts`
- `npm test -- tests/sim-worker-pipeline.test.ts tests/worker-client-recovery.test.ts`

Run the smallest relevant group during development and `npm run check` before delivery.

## Broaden context when

- A command changes both worker state and IndexedDB state.
- A protocol field is persisted or exposed in a snapshot.
- A save change interacts with multiple tabs, PWA lifecycle events, import limits, or recovery UI.

