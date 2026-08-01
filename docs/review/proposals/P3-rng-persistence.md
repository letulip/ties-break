<!-- Build-ready proposal derived from the 2026-08-01 full review (docs/review/). Reviewed at b7a9358. -->

# P3 – Persist RNG stream state (schema v35)

One-line: Persist the MAIN-stream mulberry32 position in the save so loading a career costs O(1) instead of replaying every week ever played, and the repo-wide "frozen capture cannot move" tax is retired.

**Priority:** Tier 2 – engine debt · **Effort:** L · **Risk:** med

## Why (problem)

- **Every load replays the whole career.** `restoreRng` (src/worker/sim.worker.ts:64-69) builds a probe world with `createWorld` and runs full `tickWeek` – AI brackets, ranking recompute, the lot – once per elapsed week, just to advance one 32-bit RNG register to the right position. It is invoked from all three load paths: `load` (sim.worker.ts:237), `loadCareer` (sim.worker.ts:245), `importSave` (sim.worker.ts:276). The header comment admits the debt: "Cheap now; Phase 1+ will persist stream state properly" (sim.worker.ts:41).
- **The cost is real and grows forever.** A weekly tick is measured at ~1.5 ms on desktop V8 (docs/research/04-tech-feasibility.md:9, "fast-forwarding 20 years point-by-point < 2 s"). A 20-season career pays ~2 s on every load, worse on phones, and the bill rises linearly with career length – in a game whose pitch is a decade-plus career.
- **The replay's validity rests on a fragile invariant that taxes every feature.** The replay only lands on the right draw if the per-week MAIN draw count is player-input-independent AND stable across code versions (world.ts:174-175 says exactly this). That invariant is pinned by the frozen capture `{count: 41550, hash: 'e6b0c709'}`, re-derived in at least five suites (tests/knock.test.ts:126, tests/round9.test.ts:62, tests/injuries.test.ts:152, tests/planner.test.ts:78-96, tests/travel-home.test.ts:396, plus condition.test.ts per travel-home.test.ts:358). world.ts carries 25+ "the frozen MAIN capture cannot move" justification comments (e.g. world.ts:1757, 2978, 4215, 5480) – every feature must argue its innocence against this replay.
- **The invariant has already broken once, silently.** The capture was re-pinned 51642 -> 41550 by the AI sub-stream refactor (tests/injuries.test.ts:55-56, tests/round9.test.ts:56-62, with an earlier 45239 -> 51642 move before it). Each re-pin silently moved every loaded old career onto a different stream position than the one it actually consumed. Review finding: docs/review/01-architecture.md, [HIGH] "RNG restore replays the whole career".
- **Split-brain state in the worker.** `world` and `rng` live as two separate module variables (sim.worker.ts:46-47) that must be kept in sync by hand across every handler – a standing desync hazard the persisted design removes by construction.

## What (proposed change)

**What state, exactly.** Only the MAIN stream has state. Every sub-stream is derived statelessly at the call site from a purpose-scoped seed string – `rngFromSeed(\`${seed}:injury:${week}\`)`, `seed:offer:<week>` (offers.ts:169), `seed:kidtour:<id>` (world.ts:3551), `seed:aitour:<id>` (world.ts:3855), `seed:friends:<week>` (kidLife.ts:340), etc. – so there is nothing to persist for them. The MAIN stream is one mulberry32 closure over a single 32-bit register `a` (src/engine/rng.ts:21-29).

**The key algebraic fact (verified by direct experiment on this machine):** mulberry32 advances its register by a constant, output-independently – `a = (a + 0x6d2b79f5) | 0` (rng.ts:24). Therefore state after n draws = `(seed32 + n * 0x6d2b79f5) | 0`, and a generator resumed from that register continues byte-identically to a straight run. This gives us a free integrity check: persist the redundant pair.

**Design:**
1. Add to `WorldState` (world.ts:200): `rngMain: { s: number; n: number }` – the register and the cumulative MAIN draw count. Two JSON numbers; negligible save-size impact under the existing gzip+SHA-256 codec (saveCodec.ts:4, 23-27).
2. The worker's Rng becomes a closure that mutates `world.rngMain` in place on every draw. The module-level `rng` variable dies; autosave (db/saves.ts:276) then always captures the live position by construction – no mirror to forget.
3. Schema v34 -> v35. The migration performs ONE final probe replay (exactly what `restoreRng` does today on every load) to compute `{s, n}`, stamps it into the save, and the replay never runs again for that career.
4. `restoreRng` is deleted from the load paths and survives only as `recoverMainState`, a corruption-recovery fallback reachable solely when the persisted pair fails its sanity check.
5. The frozen-capture REGIME changes: the cross-suite constant `{41550, e6b0c709}` is retired as a change-gate; the underlying property (player input cannot move MAIN draws) is kept as pairwise A/B tests. Details under Test plan.

**Why this shape:** keeping `tickWeek(world, rng)`'s signature (world.ts:4171) untouched means 91 test files and all 19 tools/ benches that pass their own tapped or raw streams keep compiling and keep their tap pattern (e.g. `recordRun` in tests/injuries.test.ts:168-186). The worker is the only production caller, and it is 4 call sites. The runner-up (tickWeek reading `world.rngMain` directly) is stronger against desync but is rejected for the churn; see Alternatives.

## How (implementation sketch)

Ordered; each step compiles and is testable on its own.

1. **src/engine/rng.ts** – add (do NOT touch `mulberry32`/`rngFromSeed`/`xmur3` themselves):
   - `export interface MainRngState { s: number; n: number }`
   - `export function initMainState(seed: string): MainRngState` – `{ s: xmur3(seed)(), n: 0 }`.
   - `export function resumeMain(st: MainRngState): Rng` – same arithmetic as mulberry32 but reading/writing `st.s` and incrementing `st.n` each draw. Must emit the byte-identical sequence (test-proved, step 1 of the test plan).
   - `export function mainStateConsistent(seed: string, st: MainRngState): boolean` – checks `st.s === ((xmur3(seed)() + Math.imul(st.n, 0x6d2b79f5)) | 0)`.
2. **src/engine/world.ts:**
   - Bump `SAVE_SCHEMA_VERSION` 34 -> 35 (world.ts:177).
   - Add `rngMain: MainRngState` to `WorldState` right after `week` (world.ts:205-206), with a comment naming it the persisted MAIN position (v35).
   - `createWorld` (world.ts:3987) initializes `rngMain: initMainState(seed)`.
   - Export `replayMainState(seed, profile, weeks): MainRngState` – the old probe loop, but drawing through `resumeMain(initMainState(seed))` so the returned state carries both register and count. This is the single implementation the migration and the recovery fallback share.
   - Update the stale header claim at world.ts:174-175 ("so the load-time RNG replay stays valid") to describe the persisted position.
3. **src/engine/migrations.ts** – append after the v33 block (migrations.ts is append-only per its own rule at lines 34-35):
   ```ts
   if (v === 34) {
     const st = save.rngMain as MainRngState | undefined
     if (!st || typeof st.s !== 'number' || typeof st.n !== 'number') {
       save.rngMain = replayMainState(save.seed, save.profile, save.week)
     }
     v = 35
   }
   ```
   Idempotent and defensive like the v32/v33 blocks. Yes, this calls a live helper – the review's own LOW finding (docs/review/01-architecture.md, migrations.ts:20). Accepted deliberately: it is byte-identical to what every load already does today, it runs for the LAST time per career, and step 3 of the test plan pins its output on a fixture so future drift is caught, not silent.
4. **src/worker/sim.worker.ts:**
   - Delete `restoreRng` (64-69) and the `let rng` module variable (47); update the 39-44 header comment.
   - `new` (73-79): drop `rng = rngFromSeed(...)`; createWorld now owns it.
   - `tick` (80-85) and `advance` (86-93): `const rng = resumeMain(world.rngMain)` immediately before the loop. Draws mutate `world.rngMain`, so the `autosave(world)` that follows persists the advanced position with zero extra code.
   - `load` (236-241), `loadCareer` (242-248), `importSave` (274-279): replace `rng = restoreRng(...)` with a `verifyMainState(world)` call. On failure: `world.rngMain = recoverMainState(world)` (wraps `replayMainState`) and return the snapshot with `recovered: true` – `snapshotMsg` already supports the flag (sim.worker.ts:59-62) and the UI already surfaces it for autosave recovery (db/saves.ts:295-308), so no new UI wiring.
5. **verifyMainState** (worker-local, ~10 lines): (a) shape check, (b) `mainStateConsistent(world.seed, world.rngMain)`, (c) plausibility bound `0 <= n <= week * (8 + 4 * cohort.length)` – driftCohort spends 4/player and resolveBaseCosts 3-4/week (world.ts:4160-4164), so the bound is generous but finite. Corruption of either field breaks (b) with probability ~1-2^-32; the redundant pair IS the checksum.
6. **Golden fixture:** add `tests/fixtures/saves/v35.json` per the corpus rule (tests/fixtures/saves/README.md; goldenSaves.test.ts:30-32 fails until it exists). Capture a mid-career save (the v34 fixture is week 60 – same ballpark) with a non-trivial `rngMain`, and add a row to the README table.
7. **tools/demo-save.ts:** it serializes worlds to .tsave; switch its tick loop to `resumeMain(world.rngMain)` so exported demos carry a true position. Other benches (e.g. tools/load-bench.ts:60 building its own `rngFromSeed`) never serialize and need no change.

**RNG draw-count implications: zero.** No draw is added, moved, or reordered; `resumeMain` emits the identical sequence. The capture 41550/e6b0c709 must reproduce byte-for-byte on the branch both before and after the worker change – derive it once at branch start and once at the end, per the discipline already documented at tests/injuries.test.ts:141-142.

## Test plan

TDD order – each item written red before its implementation step lands:

1. **tests/rng.test.ts first** (extends the existing suite): (a) resume equivalence – for several seeds and split points k, draw k from `resumeMain(initMainState(seed))`, JSON-round-trip the state, resume, draw the rest; must equal a straight `rngFromSeed(seed)` run of the same length; (b) `mainStateConsistent` holds after any number of draws and fails on a perturbed s or n; (c) `initMainState(seed).s` equals `rngFromSeed`'s effective starting register (locks the xmur3 coupling).
2. **tests/world.test.ts** – upgrade the save/reload suite (165-217): replace the test-local `restoreRng` copy (176-183) with `resumeMain(world.rngMain)`, and strengthen the mid-season test (205-217) from champions-only to FULL deep-equal: straight 30-week run vs 20 weeks + `migrateSave(JSON.parse(JSON.stringify(w)))` + resume 10 weeks – worlds identical including `rngMain`. This is the theorem the whole feature rests on. Keep the deliberately-wrong-stream bracket test (219-229) untouched – event-scoped replay stays load-bearing.
3. **tests/migrations.test.ts:** a v34-shaped payload gains a correct `rngMain`; pin the computed `{s, n}` for one fixture as a frozen expectation (this is the tripwire that catches future tickWeek changes silently drifting the migration replay); migrating twice is a no-op; a hand-corrupted v35 payload (s+1) fails `mainStateConsistent`.
4. **tests/goldenSaves.test.ts:** add to the per-fixture invariant block: `rngMain` present, both fields numbers, `mainStateConsistent` true, plausibility bound holds. Add v35.json (step 6 above).
5. **Worker fallback test:** load a save with corrupted `rngMain` through the worker handler path, assert the snapshot arrives with `recovered: true` and the repaired state passes `mainStateConsistent`.
6. **Convert the frozen-capture suites** (the invariant regime change): in tests/knock.test.ts:126ff, tests/round9.test.ts:62ff, tests/planner.test.ts, tests/injuries.test.ts:152ff, tests/travel-home.test.ts:358-396, replace comparison-against-the-constant with pairwise A/B under the same code: a no-action baseline run vs the suite's action-laden run, tapped MAIN sequences must be identical. The fairness property (player choices cannot re-roll the world's dice) survives; the re-pin ritual and the cross-version stability requirement die. injuries.test.ts may keep count/hash as an informational pin with a comment downgrading it from load-bearing to documentation.
7. **Bench:** add `tools/restore-bench.ts` (pattern: tools/load-bench.ts) timing load+migrate for 5/10/20-season careers before and after; expect O(weeks) -> O(1); paste numbers into the PR description. Baseline-before-mechanism, per the repo's own bench discipline.
8. `npm run check` and `npm run test:sim` green.

**Golden-save impact:** one new fixture (v35.json), zero changes to v0-v34 fixtures; they now exit `migrateSave` with a computed `rngMain`, which step 4's invariants verify.

## Acceptance criteria

- [ ] `grep restoreRng src/worker` returns nothing; the only replay left is `recoverMainState`, reachable solely from a failed `verifyMainState`.
- [ ] Loading a 20-season career performs zero `tickWeek` calls outside a one-time v34->v35 migration; restore step measured < 5 ms (bench evidence vs ~1.5 ms/week before, docs/research/04-tech-feasibility.md:9).
- [ ] Deep-equal determinism test green: straight run === save/migrate/reload/resume, including `rngMain`.
- [ ] Golden corpus v0-v35 green; every migrated fixture satisfies `mainStateConsistent` and the plausibility bound.
- [ ] Capture `{41550, e6b0c709}` re-derived byte-for-byte before and after the change (this change moves no stream).
- [ ] Corrupted `rngMain` load succeeds via fallback with `recovered: true`, proved by test.
- [ ] Five capture suites converted to pairwise A/B invariance; no test compares against a frozen cross-version constant as a load-correctness guard.
- [ ] Invariants intact: no Vue/Pinia import in engine/worker; schema bump shipped as version + migration + fixture (engine invariant #2).

## Risks & alternatives

- **Persisted-position bugs are sticky (the headline risk).** Today a wrong position is recomputed (identically wrong or not) on every load; after v35 a wrong `s` written once propagates forever, and once future features add MAIN draws a replay can no longer reconstruct the historical position. Mitigations, layered: the s/n redundancy check, the plausibility bound, the recovery fallback with a user-visible `recovered` flag, the deep-equal round-trip test in CI, and the outer gzip+SHA-256 payload checksum (saveCodec.ts:29-35) already guarding storage-level corruption.
- **Recovery fallback is best-effort by design.** `recoverMainState` replays under CURRENT code, so for an old career it lands where current code says, not where history did – exactly the status quo for every load today (and already violated once by the 51642 -> 41550 re-pin). v35 freezes that best-effort answer once instead of re-rolling it forever.
- **Migration replay uses live helpers** (the pattern flagged LOW at docs/review/01-architecture.md, migrations.ts:20). Accepted: single execution per career, identical to today's per-load behavior, output pinned on a fixture (test plan step 3).
- **One-time migration pause** on the first post-update load of a very long career (~2 s at 20 seasons). Acceptable; the existing `busy` state covers it. If it ever matters, chunking the replay is a local change inside one migration block.
- **Runner-up alternatives:** (a) `tickWeek` draws from `world.rngMain` internally – strongest anti-desync, rejected for signature churn across 91 test files and all benches; revisit as a follow-up when world.ts is split. (b) Persist only `n` and derive `s` – rejected: loses the redundancy that makes the pair self-checking. (c) Lazy worker-side backfill without a schema bump – rejected: violates engine invariant #2 and leaves two load paths alive forever.

## Dependencies

None. Sequence it BEFORE the world.ts split (review recommendation #2) and before any feature that wants MAIN-stream randomness – this proposal deletes the constraint such features would otherwise have to argue against, and shrinking the invariant surface first makes the split's safety net (the converted determinism suites) cleaner.
