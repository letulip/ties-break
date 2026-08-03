# Ties Break: Ace Parent

PWA tennis career sim where you play the **parent** raising a future star (WTA-first). Vue 3 + Pinia + TS + Vite. Deterministic engine in a Web Worker, IndexedDB saves, offline-first. Source-available, commercial.

## Commands

```bash
npm run check      # vue-tsc -b --force + unit tests + build — the pre-push gate
npm run test:quiet # unit project, dot reporter — PREFER THIS: 5.6k chars of output vs 29k
npm test           # unit project, full reporter (~35s, 103 files / 2230 tests)
npm run test:sim   # sim project (~70s, serialised) — exits 0 on green since the P6 wave
npm run test:component # mounted Vue components (~1s) — the only real UI regression gate
npm run build      # vue-tsc -b && vite build
```

Use `test:quiet` unless you need to read individual test names — same signal, ~6k fewer tokens per run.

Benches live in `tools/` (`bench:econ`, `bench:fatigue`, `bench:knock`, `bench:load`, `bench:radar`). Always `vue-tsc -b --force`: the incremental cache has hidden real type errors before.

## Non-negotiable invariants

**1. The engine never imports the UI.** Zero imports of Vue/Pinia/components anywhere in `src/engine`, `src/worker`, `src/db`, `src/shared`. The worker owns the world; the UI only ever sees `Snapshot`. Every command is re-validated engine-side, so a stale screen cannot corrupt a career.

**2. RNG discipline.** The MAIN stream's position is **persisted per career** since v35 (`rngMain: {s, n}`); a load resumes, it does not replay. Two rules follow:
- **Input-independence is permanent law.** A no-action run and an action-laden run under the same code must tap identical MAIN sequences. Player choices may never re-roll the world's dice. This is a fairness property.
- New randomness goes through a **purpose-scoped sub-stream** (`rngFromSeed(\`${seed}:thing:${week}\`)`), never MAIN. Sub-streams are re-derived at the call site and persist nothing.
- The frozen capture (41550 draws / hash `e6b0c709`, pinned in `tests/condition.test.ts`) is a **documented measurement, not a change-gate** since v35. A wave that legitimately adds a MAIN draw updates the pin.
- Never use `Math.random()` or bare `new Date()` in engine code.

**3. Save schema changes are a three-part move.** Bump `SAVE_SCHEMA_VERSION`, add an **append-only** migration in `engine/migrations.ts`, add a golden fixture in `tests/fixtures/saves/`. `tests/goldenSaves.test.ts` enforces one fixture per version. Migrations are append-only: never edit a shipped one.

**4. Tuning is measured, not guessed.** Balance changes ship with a bench run and a spec in `docs/specs/` recording predicted vs measured. `docs/specs/rank-plateau.md` is the model: predict a fix, measure it doing nothing, find the real cause.

## Git workflow

- **Never push to `main`.** Branch → PR → the owner merges. This holds in every project.
- **One branch per wave.** GitLab CI minutes are metered; small fixes accumulate into the current wave rather than spawning branches.
- **Push to `origin` (GitHub) only**, not `gitlab` — the two `main`s have diverged.
- Side work while a wave branch is active goes in a **worktree** (`../tb-*`), never by switching the shared checkout.
- Check the current branch before every commit.

## Layout

```
src/engine/      world.ts (the integration core) + world/ (extracted concerns)
                 leaf modules: diary, radar, knock, kidLife, coachLoad, offers, body,
                 condition, development, economy, equipment, academy
  match/         Markov point engine — closedForm, liveProb, scoring, rally, serveSpeed
  season/        calendar, ranking, tournament, rival, cohort, conveyor, prehistory
src/worker/      sim.worker.ts owns the world; client.ts is the typed RPC
src/stores/      game.ts — a thin RPC facade, NOT a state store
src/components/  screens/ + a small ui/ kit
docs/specs/      one spec per shipped mechanic; docs/decisions.md is the dated owner log
docs/review/     2026-08 full review + P1–P9 proposals
```

`world.ts` is being decomposed into `src/engine/world/*.ts` (see `docs/review/proposals/P4-world-decomposition.md`). Rules for that work:
- Extracted modules import `WorldState` as **`import type`** from `../world` — type-only, erased at compile time, so no runtime cycle.
- `world.ts` imports the values back and **re-exports them under their historical names**: 111 files import from `engine/world` and that public API must not change.
- If a candidate block calls back into `world.ts` at runtime, it is **not** ready to move — that needs dependency inversion, not a span-move.

## Style

- **Boring TypeScript**: strict mode, no generic gymnastics, no enums, no decorators. Types document the save schema and engine parameters.
- Comments explain **why**, not what — this codebase deliberately records owner rulings and the reasoning behind non-obvious choices. Preserve them verbatim when moving code.
- In prose and UI copy use the short dash `–`, never the long em-dash.
- Money is in **cents** everywhere in the engine. Formatting helpers take cents; check the unit before calling.
- Tournament and organisation names are **fictional** (ITF/WTA/ATP are trademarks). Real player surnames must not be constructible.

## Gotchas

- **Prefer a mounted test to a source pin.** `tests/component/` mounts real components (vitest project `component`, happy-dom). Source pins break on contact with a refactor and prove nothing about behaviour; MatchViewer and SeasonScreen now have mutation-verified nets there, which is what makes them safe to split. Mutate the thing you think you are covering and watch it fail before you believe a green run.
- Some tests are **source-pin tests**: they read engine source text and assert on structure. When moving code, read it through `tests/worldSource.ts` (world.ts + every `world/*.ts`) rather than pinning a path. A slice between two markers whose end marker moved returns `-1` and silently swallows the rest of the file.
- The sim project MUST run serialised: every script that touches it carries `--no-file-parallelism` (birpc has a hard-coded 60s RPC timeout that a minutes-long synchronous Monte-Carlo file will blow past, exiting 1 with every test green). If you add a script that runs the sim project, carry the flag.
- The `▶▶ 52 (dev)` button in More ships in EVERY build – an owner ruling (the deployed build is the playtest device), not a regression. Its unsafe half is fixed: the worker's `tick` handler now enforces the same open-knock / unrevealed-tournament guards as `advanceWeeks`, refusing at entry and stopping mid-loop. `tests/dev-fast-forward.test.ts` pins both halves.
