---
type: review
status: audit
area: project-review
canonical: false
last-reviewed: 2026-09-26
baseline: 03d92221
---

# Worker, protocol & persistence – 26 September 2026 review

## Verdict

Most of the worker is well built. The candidate-commit pipeline (TB-03), the serialised queue
(TB-02), the replaceable worker (TB-05), the reply table (R2-05) and the CAS on the careers row all
do what their notes say, and every 05.09 item this lane inherits has been closed except P-08. The
defects are at the edges – between the store's bookkeeping and the disk, and between two builds of
the game – and they are in the one layer that holds the player's data.

The three things that matter most:

1. **«Restore previous» can restore the present and destroy the past (D-01, P0).** 15 of the 41
   mutation actions in the store never refresh the slot list. After any of them, including the
   irreversible dialog answers (life beat, knock, gift, shoot clash) and every plan toggle, More's
   "previous autosave" points at the generation that now holds the **current** state. Restoring it
   changes nothing on screen, and it overwrites the real previous generation. This was proven
   through the real store over the real worker.
2. **A save written by a newer build is treated as corruption (D-02, P1).** The August review found
   this on 31.07 and it is still true. The boot door throws an untyped `Error`, falls back to the
   older generation, tells the player it was "repaired", and overwrites the newer build's save two
   commands later. 05.09 fixed the error code (E-05) only for the file door.
3. **Two hand-kept spellings of one engine verdict (D-03, P1).** The dev tick's guard lists the
   eight blocking predicates by hand instead of calling `advanceRefusal`. Its source pin names only
   seven of them: with the shoot-clash clause deleted, `tests/dev-fast-forward.test.ts` stays green
   (mutation run, below). This list has lagged the engine once already (the life beat, fixed at
   `827efe6f`).

Lead 8 is refuted for saves: the stored payload is flat after week ~200 (×1.04). It holds for the
snapshot, where the inbox only grows and ships whole (D-07). Lead 4 comes out partly: the explicit
copy earns its keep, but the class is still guarded per payload and caught only by e2e (D-08).

## Scope and method

**Read in full**, at `03d92221` in `/Users/letulip/Projects/Claude/tb-review`:
- `src/worker/sim.worker.ts` (943 lines) and `src/worker/client.ts` (226)
- `src/stores/game.ts` (908)
- `src/db/saves.ts` (555) and `src/db/idb.ts` (25)
- `src/engine/saveCodec.ts` (144)

**Read in part:**
- `src/shared/protocol/messages.ts`, `profile.ts` and `snapshot.ts`
- `src/engine/saveGuard.ts` (the SPINE, `:146-280`)
- `src/shared/format.ts` and `src/shared/money.ts`
- `src/engine/world/multiWeek.ts:325-379` and `src/engine/world.ts:2408-2420, 2610-2700`
- `src/engine/world/state.ts:1380-1400` and `src/engine/world/snapshot.ts:2220-2236`
- the callers of `newCareer` and `setPlan`
- `MoreScreen.vue:60-80` and `:205-250`
- the inbox readers of `snapshot.offers`
- `docs/context/saves-and-worker.md`
- for lane E's hand-off (E-04 → D-P9): `src/shared/protocol/competition.ts:692-701`,
  `src/engine/world/medical.ts:931-945` (`EntryStatus`) and `:1010-1333` (`tierVerdict`,
  `entryVerdict`), `src/engine/world/snapshot.ts:2143-2162`, and the reader
  `src/composables/tierState.ts:715-1036`

**Prior reviews:**
- `docs/review-principles-2026-09-05/02-engine.md` (E-02, E-05, E-06, E-07, E-12)
- `03-ui.md` (U-01, U-02) and `04-performance.md` §C (P-08, P-09)
- `docs/review/06-performance-robustness.md` (whole)

**Searched, not read:** `docs/decisions.md`, `docs/now-next-later.md` and
`docs/backlog/the-quality-rig.md`. None of them queues anything this lane reports; the one relevant
ruling is `decisions.md:135`, where the two generations are "iOS corruption insurance, 'Restore
previous'".

**Phase 0 numbers consumed** (no timing was taken in this lane): §B.3–B.6, §C.1–C.4 and §D of
`00-baseline.md`.

**Probes** – all authored in `OUT/probes/`, run from the tb-review root at `03d92221`. Output went to
`RAW/D/` = `/private/tmp/claude-501/-Users-letulip-Projects-Claude/c8208cb1-8875-425d-987a-91238b4d6641/scratchpad/review-raw/D/`,
and every log ends `X_EXIT=0`. The vitest probes were copied to `tests/zz-review-*.test.ts`, run
once, and deleted again (`git status --short` afterwards shows only the untracked probes folder).

| probe | command | log | what it shows |
| --- | --- | --- | --- |
| `d-stale-slots.test.ts` | `npx vitest run --project unit tests/zz-review-d-stale-slots.test.ts` | `stale-slots.log` | the real Pinia store over the real `sim.worker.ts` (`tests/helpers/workerHarness`, fake-indexeddb, a `structuredClone` on each leg). D-01 and its control |
| `d-db-probes.test.ts` | `npx vitest run --project unit tests/zz-review-d-db-probes.test.ts` | `db-probes.log` | the newer-schema straddle (D-02); what `listSlots` materialises (D-05); the lead-4 boundary (D-08) |
| `d-import-holes.test.ts` | `npx vitest run --project unit tests/zz-review-d-import-holes.test.ts` | `import-holes.log` | two gate-passing holes driven through the real worker (D-04) |
| `d-spine-sweep.ts` | `npx vite-node docs/review-principles-2026-09-26/probes/d-spine-sweep.ts` | `spine-sweep.log` | the E-02 method re-run on the v89 golden, every top-level field (D-04) |
| `d-unknown-tour.ts` | `perl -e 'alarm 60; exec @ARGV' node --max-old-space-size=512 node_modules/vite-node/vite-node.mjs docs/review-principles-2026-09-26/probes/d-unknown-tour.ts` | `unknown-tour.log` | the August "non-terminating match loop" item |

**One mutation run** (D-03) happened in a scratch worktree, which was then removed:
- `git -C …/tb-review worktree add --detach …/tb-review-laned 03d92221`
- `src/worker/sim.worker.ts:392` `shootClashOpen(w)` → `false`
- `npx vitest run --project unit tests/dev-fast-forward.test.ts` → `mutant-tick-shootclash.log`: 5 passed, `X_EXIT=0`

**The D-P9 hand-off** was settled by reading and one-off greps at `03d92221`:
`awk 'NR>=1038 && NR<=1370 && /reason:/' src/engine/world/medical.ts` (the `reason` literals in
`entryVerdict` – 1 × `'unavailable'`, 7 × `'locked'`, function ends at `:1333`);
`grep -n "'capped'\|'injured'\|'medical'" src/engine/world/medical.ts` (every such literal sits in
`availabilityStatus`, `:633`ff., or earlier helpers); `git grep -l "tierRefusal" -- tests | wc -l` → 3.

**Counts** come from `git grep -l "<symbol>" -- tests/ | wc -l` at `03d92221`. The action tally of
the store was a one-off `node -e` over `src/stores/game.ts`: 41 actions carry `baseRevision`, 26 of
them call `refreshSlots()`, and 2 call `refreshCareers()`.

## Findings

### D-01 · «Restore previous» restores the current state and overwrites the real previous generation after 15 of the 41 mutations
- Severity: P0
- Category: correctness-risk
- Evidence:
  - **The mechanism.** 41 store actions carry `baseRevision`. Every one of them commits an autosave
    into the OLDER generation (`db/saves.ts:298-305`). Only 26 then call `refreshSlots()`.
  - **The 15 that do not:** `hireMasseur`, `setMasseurSessions`, `setMasseurTravels`, `hireSparring`,
    `setSparringRung`, `setSparringTravels`, `hirePsychologist`, `setPsychologistRung`,
    `setPsychologistFocus`, `setPlan`, `decideKnock`, `answerShootClash`, `chooseGift`,
    `answerLifeBeat`, `setPhysio` (`stores/game.ts:581-772`).
  - **What More reads.** `game.slots` has exactly one reader, More. More refreshes `careers` on mount
    (`MoreScreen.vue:74`) but never refreshes `slots`. Its "previous" is `autoSlots[1]`, sorted by the
    stale `savedAt` (`MoreScreen.vue:218-222`), and «Restore previous» sends that slot KEY
    (`:231-240`).
  - **What the worker does with it.** The key is re-validated only for existence (`readSlot`). It is
    then committed as `committedRevision + 1` into the older generation (`sim.worker.ts:685-708`),
    which is the true previous one.
  - **Measured** by `d-stale-slots.test.ts` (`RAW/D/stale-slots.log`), with the real store and the
    real worker.
  - Advance, then `setPhysio`. The store holds `["…:b@rev2","…:a@rev1"]` while the disk holds
    `["…:a@rev3","…:b@rev2"]`.
  - «Restore previous» targets `…:a`, which holds the **current** `physioActive`. After the restore,
    both generations hold `physioActive=false` at week 11, and the pre-toggle state exists nowhere.
  - The control arm (`setWeightEnabled`, which does refresh) undoes the toggle correctly.
- Why it matters:
  - `docs/context/saves-and-worker.md:51` states the invariant "Loading, restoring, or importing must
    not silently destroy a known-good slot". The owner's ruling (`decisions.md:135`) makes the second
    generation the corruption insurance behind «Restore previous».
  - The actions that miss the refresh include the four irreversible dialog answers – exactly the
    moments a player reaches for an undo – and `setPlan`, which every tap on Her week sends.
  - The restore reports ok, the screen does not move, and the one-command-old state is gone. More's
    current-autosave row also prints stale week and time labels.
- Proposal:
  1. (S) More refreshes `slots` on mount and whenever `game.revision` moves while it is open. This is
     the one reader, and it becomes the one refresh. No wording moves.
  2. (S–M, defence in depth – invariant 1 applied to restore) `restoreSlot` carries the `revision`
     the UI believed the slot held (`SlotMeta.revision`, already on the record envelope). The worker
     refuses with `STALE_REVISION` when the record disagrees, which reuses the existing stale copy
     (`game.ts:335`) and needs no new sentence. The field is optional on the wire, so the schema is
     not touched.
  3. D-05's consolidation removes the per-action refresh list that caused this.
  - Test: the probe as a mounted MoreScreen test, mutation-verified by deleting the mount refresh.
- Blast radius:
  - House laws: no RNG, save schema, wording or balance moves.
  - Tests: `git grep -l "restoreSlot" -- tests/` → 3; `"MoreScreen"` → 17.
- Effort: S
- Confidence: high. It was reproduced end to end with the real store and worker. A browser e2e (More
  after a knock answer) would remove the harness caveat.
- Versus 05.09: new
- Verification: CONFIRMED – the cited code reads as described, a re-run tally gives the same 15 non-refreshing actions, and the re-run probe through the real store and worker reproduces the loss of the only pre-toggle generation after a toggle followed by «Restore previous».

### D-02 · A save written by a newer build is treated as corruption on the boot door: a silent rollback, then the newer generation is overwritten
- Severity: P1
- Category: correctness-risk
- Evidence:
  - **The throw.** `decompressWorld` (`engine/saveCodec.ts:84-89`) runs `migrateSave`, which throws a
    plain `Error` for a newer schema (`engine/migrations.ts:3303-3305`).
  - **The fallback.** `readLatestAutosave` catches ANY throw from the newer generation and loads the
    older one with `recovered: true` (`db/saves.ts:545-554`).
  - **Measured** by `d-db-probes.test.ts` (`RAW/D/db-probes.log`).
  - Gen a is written at v89 and gen b at v90. The DB door answers
    `Error | Save schema 90 is newer than supported 89`, which is not a `SaveFileError`, so no
    `future-schema` code crosses.
  - `readLatestAutosave` then returns `{"week":1,"recovered":true,"revision":2}`. After two commits
    the generations are `["…:b@rev4","…:a@rev3"]`, schemas `[89,89]`, and the v90 save is gone.
  - **The trigger.** `registerType: 'prompt'` (`vite.config.ts:148`) means "a player can sit on the
    OLD worker for days" (`src/pwa.ts:62`). An old tab or installed shell that opens the career
    through More after a newer context wrote one command reproduces it, and so does a rollback
    deploy.
- Why it matters:
  - The player is told the career was "repaired" and is then walked back and overwritten, which
    breaks the invariant at `saves-and-worker.md:51`.
  - The boot refusal U-01 fixed (`game.ts:221-245`) is reached only when BOTH generations are too
    new. The straddle case never gets there.
  - E-05's promise – `future-schema` exists so the answer is "update the app" rather than "this file
    is broken" (`sim.worker.ts:823-835`) – holds on the file door only.
- Proposal:
  1. In `decompressWorld`, after `JSON.parse` and before `migrateSave`, throw
     `new SaveFileError('future-schema', \`Save schema ${v} is newer than supported ${SAVE_SCHEMA_VERSION}\`)`
     when `v > SAVE_SCHEMA_VERSION`. The message is byte-identical to today's, so the boot copy does
     not move, and no shipped migration is edited.
  2. `readLatestAutosave` falls back only on `code === 'corrupted'` (checksum, gunzip, parse). A
     `future-schema` is rethrown with both generations untouched, and `errorMsg` already carries the
     code (`sim.worker.ts:833-835`).
  - Showing saveGuard's own "update the app" sentence on the boot path instead would be a wording
    change, so it is a question for the owner.
  - Test: the probe as a `tests/saves.test.ts` case, plus one on the worker pipeline.
- Blast radius:
  - House laws: save schema not touched; wording kept byte-identical.
  - Tests: `"readLatestAutosave"` → 1; `"decompressWorld"` → 2; `"newer than supported"` → 8 (all
    unchanged if the text stays).
- Effort: S
- Confidence: high on the mechanism (reproduced). Medium on frequency, which depends on how often two
  builds share one origin's IndexedDB.
- Versus 05.09: carried (E-05, closed only on the file door); also the August review's "Version-skew
  rollback destroys newer saves" (`docs/review/06-performance-robustness.md:24`), still open.
- Verification: CONFIRMED – `decompressWorld` calls `migrateSave` unwrapped, `readLatestAutosave` falls back on any throw with `recovered: true`, and the re-run probe reproduces the rollback and the overwrite of the v90 generation after two commits; how often build skew occurs in the field is argued, not reproduced.

### D-03 · The dev tick's guard re-spells `advanceRefusal` by hand, and the pin that guards it cannot see its eighth clause
- Severity: P1
- Category: duplication
- Evidence:
  - **The copy.** `decisionOpen` (`sim.worker.ts:357-392`) is an OR over the same eight predicates as
    `advanceRefusal` (`engine/world/multiWeek.ts:325-378`): ending, tournament, knock, birthday, life,
    fork, retirement, shoot-clash.
  - **The comments say it is a copy.** The worker keeps "the ORDER matches `advanceRefusal`'s own"
    (`:370-373`). `advanceWeeks` states the rule the copy breaks: "One predicate, two readers … a
    button that answers that question for itself is the arrival gate's three disagreeing answers all
    over again" (`world.ts:2409-2415`).
  - **It has drifted before.** The life beat was missing from this list v73–v85 (`CLAUDE.md`,
    `827efe6f`).
  - **The pin.** `tests/dev-fast-forward.test.ts:79-88` asserts seven `toContain` spellings; there is
    no `shootClashOpen` line. The layer-2 cases drive a reveal, a knock and a life beat, but not a
    shoot clash. Its own prose still says "one OR over seven predicates" (`:164`).
  - **The mutation.** Replacing `shootClashOpen(w)` with `false` at `:392` leaves
    `tests/dev-fast-forward.test.ts` at 5 passed (`RAW/D/mutant-tick-shootclash.log`, scratch
    worktree at `03d92221`). It is the only test file that sends `type: 'tick'` and names the shoot
    clash (`git grep -ln "type: 'tick'" -- tests | xargs grep -ln shootClash`).
- Why it matters: this is the calibration class twice over – a guard that passes while the thing it
  guards is gone, and two spellings of one fact. `▶▶ 52` ships in every build (ruling), so the next
  blocking kind added to `advanceRefusal` reaches the tick only if someone remembers the copy.
- Proposal:
  - `const decisionOpen = (w: WorldState): boolean => advanceRefusal(w) !== null`. `advanceRefusal` is
    already on the barrel (`world.ts:109-110`).
  - The pinned `if (decisionOpen(world)) {` shape and the pinned sentence "resolve the tournament or
    knock" both stay byte-identical.
  - Replace the seven `toContain` spellings with a pin that the tick case calls `advanceRefusal`.
  - Add a layer-2 shoot-clash case, so that deleting any clause of `advanceRefusal` fails a test,
    `tests/r2-13-advance-span.test.ts` included.
  - The predicates read state and draw nothing, so no RNG key or draw can move.
- Blast radius:
  - House laws: no RNG, wording, schema or balance moves.
  - Tests: `"decisionOpen"` → 1 (its 7 spelling assertions move); `"advanceRefusal"` → 13
    (untouched).
- Effort: S
- Confidence: high – the mutation was run.
- Versus 05.09: new
- Verification: CONFIRMED – the verifier's own mutation (the shoot-clash clause replaced by `false` in a scratch worktree) left `tests/dev-fast-forward.test.ts` 5/5 green, and no other test drives a clash tick refusal (`tests/worker-reply-correlation.test.ts` names the clash message but never sends a tick).

### D-04 · At v89, 16 top-level fields pass the import gate: 13 are refused with a bare TypeError and no code, 3 persist a career that cannot advance
- Severity: P2
- Category: correctness-risk
- Evidence:
  - **The sweep.** `d-spine-sweep.ts` (`RAW/D/spine-sweep.log`) deletes each field of
    `tests/fixtures/saves/v89.json` in turn. The tally is 27 refused at the gate and 60 fine.
  - **13 throw in `toSnapshot`:** `skills`, `potential`, `pendingTournament`, `bestFinishByTier`,
    `injury`, `knock`, `ending`, `fork`, `college`, `coachPairs`, `pregnancy`, `comeback`,
    `bereavementWeeks`.
  - **3 pass the snapshot and throw on the first tick:** `knockHistory`, `children`, `dynasty`.
    `knockHistory` was "tick ok" in E-02's v70 probe, so a reader lost its guard since.
  - **Through the real worker** (`d-import-holes.test.ts`, `RAW/D/import-holes.log`):
    - Without `skills`, the import is refused as
      `{"ok":false,"code":null,"error":"Cannot read properties of undefined (reading 'serve')"}`.
    - Without `children`, the import answers ok and is persisted as revision 1. Every advance then
      answers `Cannot read properties of undefined (reading 'some')`.
  - **The spine stops at v48** (`saveGuard.ts:252`, `birthdays`), and the nullable singletons
    (`knock`, `ending`, `fork`, `college`, `pregnancy`, `comeback`, `dynasty`) have no row – an
    absent field is `undefined`, which passes every `!== null`.
- Why it matters:
  - E-02's ordering fix works: nothing that cannot render is adopted. But the file door's own header
    promises that "the player never sees a bare stack-trace message" (`saveCodec.ts:107-109`), and
    13 refusals are exactly that.
  - The three tick-side holes are the E-02 defect ("a persisted career that cannot render") moved
    one step later: a career that cannot advance. An import over an existing career makes that
    broken world its newest autosave.
  - It needs a hand-edited or foreign file, hence P2 (E-02's own grade).
- Proposal:
  1. (S) Spine rows for the 16 fields, with their `since` versions.
     - The array fields (`knockHistory`, `children`, `bereavementWeeks`) reuse `anArray` and its
       existing detail, "must be a list" (`saveGuard.ts:174`), inside the existing sentence
       (`saveGuard.ts:315`). No new wording.
     - The nullable singletons and the object fields need a new detail fragment for a new checker, so
       their wording is a question for the owner. Proposal 2 covers them without one.
  2. (S, generic) In `case 'importSave'`, dry-run one `tickWeek` on a `structuredClone` of the
     candidate after the snapshot, and wrap either throw as `SaveFileError('corrupted', …)` with
     `decodeExportFile`'s existing "damaged" sentence (`saveCodec.ts:131`), byte-identical.
     - This catches the next hole without enumerating it, and costs one tick (~7 ms, §B.2) on a rare
       path.
     - It draws only on the discarded clone's `rngMain`, so the committed stream does not move.
  - Test: the sweep as a table-driven `tests/save-import-guard.test.ts` case – every field that
    passes the gate must also snapshot and tick.
- Blast radius:
  - House laws: no schema move (the gate refuses only files the engine never writes); no wording.
  - Tests: `"saveGuard"` → 4; `"decodeExportFile"` → 6.
- Effort: S
- Confidence: high – reproduced through the worker.
- Versus 05.09: carried (E-02 – the ordering is fixed, the spine and the tick side are still open)
- Verification: CONFIRMED – the sweep re-run on v89.json gives the identical tally (27/13/3/60) and 16 fields, and the real-worker probe reproduces the untyped refusal and the unadvanceable persisted import; the saveCodec 'never a bare stack-trace' promise is scoped to `decodeExportFile`, so this is a broken expectation rather than a violated contract.

### D-05 · The store facade is 41 hand-copied mutation bodies with a 26/15 refresh split; an advance is three round trips, and `listSlots` reads every save of every career
- Severity: P2
- Category: architecture
- Evidence:
  - **The copies.** Each of 41 actions repeats
    `run(async () => { const res = this.takeOk(await request({ type, …, baseRevision: this.revision })); this.applySnapshot(res); [await this.refreshSlots()] })`
    (`stores/game.ts:398-781`, ~380 lines).
  - **The tails differ with no rule behind them.** `buyAsset` says "refreshSlots because money
    moved" (`:543-545`), but `SlotMeta` carries no money (`shared/protocol/messages.ts:21-32`). Every
    mutation changes the slot list, because every mutation writes an autosave.
  - **Only `tick` and `advance` refresh careers** (`:403`, `:425`). More's note that "tick/setPlan
    don't refresh careers" (`MoreScreen.vue:70`) is half stale.
  - **The round trips.** An advance is 3 round trips and a settings command 2 (§C.3,
    `game.ts:419-427`, `:677-686`). The lists feed one screen, More, which is not mounted during
    those commands.
  - **What `listSlots` reads.** It calls `getAll()` on the whole saves store, payloads included, then
    filters (`db/saves.ts:393-400`).
  - `d-db-probes.test.ts` (`RAW/D/db-probes.log`) uses 5 careers × 2 autosaves: 10 records and
    391,905 payload bytes are materialised to return 2 metas of 239 bytes of JSON.
  - At real record sizes, five careers means ~0.6–0.8 MB per mutation. **Derived, not measured**:
    it is arithmetic, 10 autosave records × 58,071–83,760 B (the payload range §C.1 measured on the
    `junior` … `parting` fixtures) = 0.58–0.84 MB, before any named save. No command produced it,
    and no multi-career database was built at real sizes; the probe's 10 records were small.
- Why it matters:
  - Two spellings of one fact (when must the slot list be refreshed?), and the drift between them is
    D-01.
  - The per-command cost is small on an M4 with one career (< 0.5 ms per extra reply, §C.3), but it
    grows linearly with the careers and named saves on the device, and it sits serialised behind
    every command in the worker's queue.
- Proposal:
  1. One private action, `commit(msg)`: `run` → `takeOk(request({ …msg, baseRevision }))` →
     `applySnapshot`. Every named action becomes one line, and every name components call is kept.
  2. Delete the per-action `refreshSlots`/`refreshCareers`. The lists are refreshed where they are
     read (D-01's More refresh on mount and on `revision`), so an advance is 1 round trip.
  3. `listSlots` reads only its career's two key ranges (`IDBKeyRange.bound('auto:<id>:', 'auto:<id>:￿')`
     plus the `manual:` twin). No DB upgrade is needed.
  - A payload-free meta store would need an append-only DB v3 upgrade block. That is priced but not
    recommended.
- Blast radius:
  - House laws: none of RNG, schema, wording or balance moves.
  - Tests: `"useGameStore"` → 196 (most stub actions by name, which are kept); `"stores/game.ts"` → 9
    source readers; `"listSlots"` → 9; `"refreshSlots"` → 0.
- Effort: M
- Confidence: high on the shape and the bytes; medium on the latency, which was not timed at scale.
- Versus 05.09: carried (P-08); also August's "Per-action IDB churn" (`06-performance-robustness.md:30`)
- Verification: CONFIRMED – the 41/26/15 split, the `getAll()` read in `listSlots` and the three round trips per advance all reproduce; the sub-claim that More is not mounted during those commands is wrong for `setWeightEnabled` (called from `MoreScreen.vue:415`), which the proposal still covers, and the per-mutation byte figure at five careers is extrapolated, not measured.

### D-07 · The inbox only grows and ships whole in every snapshot, against its own "a handful of rows" contract (lead 8)
- Severity: P2
- Category: performance
- Evidence:
  - **The contract.** `WorldState.offers` says "Bounded by construction … a handful of rows per career
    and is never pruned" (`engine/world/state.ts:1398-1399`).
  - **The measurement.** §B.6 measures 4 → 274 rows (median) over a career, and 272–364 at the end,
    of which only 2–5 are live. The rest are `ad/expired` (154–241), `kit/expired` (57–60) and info
    notices.
  - **The copy.** `toSnapshot` copies every row on every command (`engine/world/snapshot.ts:2230`).
  - **The size.** `offers` is 68.1 of the late snapshot's 155.5 KiB JSON, and 67 of its 90 KiB of
    career growth (§B.4).
  - **Saves are flat by contrast.** The stored payload goes 77 → 80 KiB from week 200 to the end
    (×1.04, §B.5): gzip absorbs the repetitive letters.
- Why it matters:
  - A documented bound that is false by ~50× (the calibration's "count in prose" class).
  - The snapshot doubles over a career, almost all of it this one field. The measured price is small:
    the whole transfer is ≤ 1.2 ms (§C.3), and ~40 % of `structuredClone(snapshot)`'s 0.73 ms at the
    end (§B.4) is an estimate scaled by size, not timed.
  - Hence P2: the cost is modest, but the contract that three screens trust is wrong.
- Proposal: keep the world append-only, with no schema move and nothing pruned on disk.
  - **Option A (M, render-identical):** the album's precedent (`sim.worker.ts:771-780`). An on-demand
    `inbox` query returns the full list when `InboxSheet` opens. The snapshot carries only live rows,
    running signed deals (for `activeKitDeal`/`apparelBondCost`) and the newest letter id (for
    `inboxCue.newestLetterId`).
    - `inboxMail.persist` prunes read/binned marks against `snapshot.offers` (`inboxMail.ts:134`), so
      it must read the query's list instead.
    - No string moves.
  - **Option B (S):** cap what the snapshot ships at the last N resolved rows. That changes the
    rendered history, so it is an owner question.
  - Either way, correct the `state.ts:1398` sentence (lane B owns that file).
  - A proposal that could move behaviour must be proven: the `pro`/`parting` fixtures' inbox renders
    identically under A (a mounted `InboxSheet` test over both paths).
- Blast radius:
  - House laws: no RNG or schema moves. Option B touches rendered history, so it is the owner's call.
  - Tests: `"InboxSheet"` → 14; `"inboxCue"` → 8; `"newestLetterId"` → 3; `"inboxMail"` → 1.
- Effort: M
- Confidence: high on the sizes (Phase 0); medium on the value.
- Versus 05.09: new (05.09 measured `offers` at 16.5 kB / 71 rows on `pro` and did not flag it)
- Verification: CONFIRMED – the Phase 0 raw log shows 272/364/274 rows at career end with 2–5 live, `toSnapshot` copies every row, and the false documented bound is unqueued; the measured cost is modest, as the finding says.

### D-08 · The reactive-proxy boundary (lead 4) is still guarded one payload at a time, and the only net is one e2e spec
- Severity: P2
- Category: tests
- Evidence:
  - **Every object that crosses `postMessage` from the store**, with what keeps it plain:
    - `new.dynasty` – nested; `plainDynasty` (`stores/game.ts:105-130`).
    - `new.profile` – flat; the spreads at `OnboardingWizard.vue:325-338`/`:344-348` and
      `settleIdentity` (`prologue/identity.ts:64-77`).
    - `new.prologue` – `traceOf` (`prologue/run.ts:104-110`) and `yearOf` via `chosenYears`
      (`:267-273`).
    - `setPlan.plan` – `planFromWeek` copies the days (`engine/plan.ts:155-158`), or a module
      constant (`WEEK_PLAN_PRESETS`).
  - **Nothing guards the class.** No test names `plainDynasty` (`git grep -l plainDynasty -- tests/`
    → 0). The worker-side unit tests call the engine directly or stub the store, which is how wave 10
    missed it. `e2e/dynasty.spec.ts` is the only crossing test.
  - **Measured** (`d-db-probes.test.ts`):
    - A `reactive` block throws in `structuredClone`. `plainDynasty` makes it cross (9 keys, 7 under
      `motherCareer`).
    - `structuredClone(toRaw(x))` works on a whole reactive, but throws once one nested proxy is
      composed into a plain object (`{ ...toRaw(live), motherName: live.motherName }`).
    - `setPlan` with a reactive plan does not cross ("NO – postMessage would throw"). It is plain
      today only because every caller builds a fresh object.
  - **The type is the real guard of `plainDynasty`.** Every `DynastyHandover` field is required, so a
    new field missing from the copy is a compile error. The v89 note at `game.ts:119-122` ("would
    reach the worker as `undefined`") holds only for an optional field.
- Why it matters: this is the calibration's "a boundary only the real runtime reaches". The copy is
  right, but the class is re-proven by hand at every new object payload, and a regression surfaces
  only in e2e or in play.
- Proposal: keep `plainDynasty`. `toRaw` + `structuredClone` would not retire it, because `toRaw` is
  shallow.
  - Add one unit test (no worker, no mount): `vi.mock` `worker/client`'s `request` to
    `structuredClone` its argument, then drive every store action whose message carries an object
    (`newCareer` with reactive `profile`/`prologue`/`dynasty`, `setPlan` with a reactive plan). That
    is the probe's shape.
  - The test fails the day a caller hands a proxy through. Mutation-verify it by replacing
    `plainDynasty(dynasty)` with `dynasty`.
  - `worker/client.ts` must not import Vue (invariant 1), so the check lives in the test, not at
    `request()`.
- Blast radius:
  - House laws: none.
  - Tests: new file only; `"plainDynasty"` → 0.
- Effort: S
- Confidence: high
- Versus 05.09: new
- Verification: CONFIRMED – `plainDynasty` is the only deep copy and no test names it, and the re-run probe shows a reactive plan does not cross; one overstatement: the e2e onboarding and prologue specs also carry `profile` and `prologue` across the real worker, so the net is e2e-only rather than a single spec.

## P3 – polish

D-06 was written as a P2 and re-rated to P3 in Phase 2 verification (PLAUSIBLE: the misclassification is real, the harm is unproven – no college-year command was timed, and at the client's own 10×-slower-phone assumption the ~4 s estimate still clears 10 s). It keeps its ID and now sits in this table.

| id | title | file:line | one-line proposal |
| --- | --- | --- | --- |
| D-06 | `resumeFromCollege` ticks up to 52 weeks in one command (`engine/world.ts:2680-2687`) but is not in `HEAVY_COMMANDS`, so it runs on the 10 s budget, not the 60 s one; desktop estimate ≈ 0.3–0.4 s (52 × 5–7 ms, §B.2), so a timeout needs a device ~25× slower than an M4 (untimed) | `worker/client.ts:111-121` | add `'resumeFromCollege'` to `HEAVY_COMMANDS`, or derive the set from a `class` column beside `REPLY_BY_COMMAND`; test in `tests/worker-client-recovery.test.ts` (10 s + 1). Tests: `"HEAVY_COMMANDS"` → 0, `"worker/client"` → 10 |
| D-P1 | Refusals outside the typed set cross as prose: the tick's entry refusal, `setPlan`'s two, "No active career", "No save in slot", a quota abort. The store cannot tell a refusal from a bug (a `TypeError` looks the same, D-04) | `sim.worker.ts:398`, `:548`, `:553`, `:238`; `db/saves.ts:404`, `:277` | throw `CommandRefusedError` (message byte-identical) where the engine refuses a payload; leave true bugs untyped so they stay distinguishable |
| D-P2 | The worker's protocol classification table omits 11 of the switch's 55 cases (`setWeightEnabled`, `answerFork`, `answerRetirement`, `resumeFromCollege`, `endCollegeEarly`, `answerShootClash`, `chooseGift`, `answerLifeBeat`, `buyAsset`, `sellAsset`, `album`) | `sim.worker.ts:852-896` | derive the class from a machine-checked table beside `REPLY_BY_COMMAND` (see D-06), or pin the prose table against the switch |
| D-P3 | More's note that "tick/setPlan don't refresh `careers`" is half stale (`tick` does) | `MoreScreen.vue:70-73` | rewrite with D-05, when the per-action refreshes go |
| D-P4 | The careers row and the `SaveRecord` are built by hand twice (autosave and named), and the 09.08 `birthMonth`/`birthDay` had to be added to both | `db/saves.ts:306-331`, `:447-479` | `recordFor(world, slot, revision, payload, checksum)` + `careerRowFor(world, existing, savedAt, revision)`; `migrateV1toV2`'s historical row stays literal |
| D-P5 | `touchCareer` and `deleteSlot` resolve on the request's `success`, not the transaction's `complete` – against the file's own "resolved only on complete" rule | `db/saves.ts:366-372`, `:408-411` | await `complete`, as `deleteCareer` (`:384-388`) does |
| D-P6 | The autosave transaction reads both full generation records (payloads included) to compare two numbers – ~1 ms, 3–5× the bare put (§C.1) | `db/saves.ts:294-305` | read `getKey`-level meta, or keep the generation revision on the careers row |
| D-P7 | The worker's `deleteSlot` accepts any key, including the active career's autosave generations; only the UI restricts it to named saves | `sim.worker.ts:745-755` | refuse `auto:` keys engine-side (invariant 1) |
| D-P8 | The snapshot carries 110 top-level keys (05.09: 88) and is replaced wholesale on every reply; the measured main-thread cost is 1.0–2.6 ms (§C.2), so no change is proposed | `shared/protocol/snapshot.ts:123` | none – record the number; lane E owns render cost |
| D-P9 | (hand-off from lane E's E-04) `TierRefusal.reason` admits `'locked' \| 'injured' \| 'unavailable' \| 'medical' \| 'capped'` and carries `entryCap?`, but its only producer can emit only `'locked'` and `'unavailable'`: `tierVerdict` calls `entryVerdict(…, false)`, whose body returns only those two literals (`world/medical.ts:1067`, `:1098`–`:1319`) and skips `availabilityStatus`, where `injured`/`medical`/`capped` live (`:633`ff., `:804-843`). The projection narrows `EntryStatus` with an `as` cast (`world/snapshot.ts:2162`), so the compiler checks neither the three dead members nor a future `'fatigued'`. The only reader (`composables/tierState.ts:800-876`) tests `'locked'` alone and takes its cap from `snapshot.entryCap`, so nothing misreads today; the cost is a type that invites E-04's dead-arm fix. Judged P3, not P2 | `shared/protocol/competition.ts:695-701` | narrow to `reason: 'locked' \| 'unavailable'`, drop `entryCap?`, and build the rows without the `as` cast so the compiler checks the narrowing; widen it again in the same commit that makes `tierVerdict` carry caps (E-04's proposal). Type-only: no rendered string, RNG or schema moves. Tests: `"tierRefusal"` → 3, `"TierRefusal"` → 0 |

## Delta versus 05.09

05.09 had no worker/persistence lane. These are the 05.09 findings whose code is in worker, shared,
db, stores or the codec:

| ID | title | status | evidence |
| --- | --- | --- | --- |
| E-02 | Import spine ends at v38; the worker commits before it can build the reply | partially fixed | ordering fixed (`47a36cc0`: `sim.worker.ts:319-327`, `:688-690`, `:716-722`); 8 spine rows added (`saveGuard.ts:235-252`); at v89, 16 fields still pass the gate → **D-04** |
| E-05 | Save-file error codes stop at the worker | fixed on the file door, open on the DB door | `77bf2dc7`: `errorMsg` maps `SaveFileError` (`sim.worker.ts:833-835`), `WorkerErrorCode` widened (`messages.ts:106`); the boot door's too-new refusal is still an untyped `Error` → **D-02** |
| E-06 | Three wire payloads the engine trusts | fixed | `f58abe75`: `profileShapeError` at `sim.worker.ts:298`; `guardWeeks` `:265-270`; empty sanitised name refused `db/saves.ts:430-432`; tests: `profileShapeError` 3 files, `guardWeeks` 1 |
| E-07 | Two snapshot fields with no reader | fixed | `3363a974`: members removed (`snapshot.ts:24`, `:499`, `:720`); `tests/snapshot-contract.test.ts` holds the rule (a word-match net – lane H may judge its strength) |
| E-12 (b) | Generation comparator not a total order | fixed | `cc2e455c`: `db/saves.ts:540` |
| E-12 (a) | Hand-built dollar strings in the engine | not this lane's code | engine sites – lanes B/F |
| U-01 | A refused boot load opens the prologue over intact careers | fixed | `58e7ac47`: `stores/game.ts:221-245`; `tests/component/round36-boot-refusal.test.ts:130-141`; its stub replies once, so it never sees D-02's straddle |
| U-02 | The store's recovery sentences have no home on nine surfaces | lane E | UI surfaces; the store side (`game.ts:280-300`) is unchanged |
| P-08 | Drop the two list refreshes from the advance path, or make `listSlots` read keys only | still open | `game.ts:419-427` still 3 round trips (§C.3); `saves.ts:393-400` still `getAll()` → **D-05** |
| P-09 | The worker boundary is healthy in numbers | still holds | transfer ≤ 1.2 ms at 150 k chars (§C.3); durable write ~1 ms (§C.1) |

## The August review – persistence and robustness (`docs/review/06-performance-robustness.md`)

Lane G takes the precache, bundle, audio and canvas items.

| item | status | evidence |
| --- | --- | --- |
| [MEDIUM] Career load replays the whole career (`:22`) | fixed | v35 persisted `rngMain`; verify-and-resume in O(1) (`sim.worker.ts:175-204`); replay only behind a failed check |
| [MEDIUM] Version-skew rollback destroys newer saves (`:24`; recommendation 2) | **still open** | reproduced → **D-02** |
| [MEDIUM] No multi-tab guard (`:26`; recommendation 3) | partially fixed, by ruling | CAS half landed (`db/saves.ts:282-291` → `SAVE_CONFLICT`, `game.ts:292-298`); the Web Locks lease is deferred by `docs/plans/launch-plan-2026-08.md` (`saves.ts:25-28`) |
| [LOW] Per-action IDB churn (`:30`) | still open | `listSlots` `getAll()` over every record; the commit reads both full generations → **D-05**, D-P6 |
| [LOW] Autosave failure desyncs worker and UI (`:32`) | fixed | the TB-03 candidate commit – the world is replaced only after `commitAutosave` resolves (`sim.worker.ts:233-249`) |
| [LOW] Non-terminating match loop on malformed data (`:34`) | no longer reproduces | `d-unknown-tour.ts` (`RAW/D/unknown-tour.log`): `simulateMatch` with `tour: 'itf'` and `'nope'` terminates (`winner=1`) under a 512 MB heap and a 60 s alarm. The import gate still validates no tour enum (no `tour` in `saveGuard.ts`) – lane C for the match side |
| Strength: "Save size cannot run away" (`:13`) | holds for saves, not for the snapshot | payload ×1.04 from week 200 to the end (§B.5); `offers` only grows → **D-07** |
| Strength: "the worker boundary is real … 35–37 KiB" (`:12`) | still real, 2–4× larger | the snapshot is 72–162 KiB over a career (§B.4); transfer ≤ 1.2 ms (§C.3) |

## Seed leads

- **Lead 4 – field-by-field copies at the store boundary: partially confirmed → D-08.**
  - Every object that crosses from the store was enumerated (D-08's list). Only `DynastyHandover` is
    nested, and `plainDynasty` is its only deep copy. The others are plain because their types are
    flat and their builders spread them.
  - `toRaw` + `structuredClone` would NOT retire the discipline. It works on a whole reactive, but
    throws once a nested proxy is composed into a plain object (probe), whereas the field copy is
    immune to that.
  - The copy earns its keep, and the compiler guards it for required fields. What is missing is a
    unit-level net for the class.
- **Lead 8 – growth over a long career: refuted for saves, confirmed for the snapshot → D-07.**
  - Week ~1,600 is unreachable under the player policy (careers retire at weeks 1,349–1,453, §B.1,
    and the deepest committed fixture, `parting`, is at week 1,133), so the comparison was made at
    career end against week 200, not at ~1,600 against ~200 (see "Not reviewed").
  - The stored payload is 77 KiB at week 200 and 80 KiB at the end (§B.5).
  - `lifeLog` ends at 90 rows / 7.8 KiB, and the feed's kept rows at 96–107 / 16 KiB (§B.6). Neither
    needs a bound.
  - The snapshot doubles (72 → 162 KiB), 67 of the 90 KiB gained being `offers`, which bounds its
    size on the snapshot side only.
  - Proposed bounds keep the world append-only (no prune on disk, no schema move): D-07 option A or B.
  - The feed ending 4 rows over `EVENTS_CAP` and the kept-row note at `constants.ts:196` are lane B's
    (§B.8 item 4).

## Not reviewed

- **Timings of any kind** – lanes run in parallel. Every latency here is Phase 0's; D-05's
  multi-career cost is in bytes, not milliseconds, and its 0.58–0.84 MB is derived arithmetic, not a
  measurement.
- **Lead 8's comparison at week ~1,600 against ~200 was not made, because no measured career reaches
  week ~1,600.** Under the player policy every natural career retires at weeks 1,349–1,453 (§B.1, six
  of seven seeds; the seventh goes bankrupt at 147), and the deepest committed fixture is the e2e
  `parting` save at week 1,133 (85,785 B stored, §B.5). The lead was answered at **career end
  (w1,349–1,453) against w200** instead: stored payload 77.2 → 79.9 KiB median. A week-1,600 world
  would need a policy that postpones retirement, which Phase 0 did not run. **For the README:** the
  synthesis should say that lead 8's "week ~1,600" figure was substituted by career end, and why.
- **`src/shared/avatarEmotion.ts`, `dates.ts`, `countries.ts`, `matchViz.ts`** – formatter and
  derivation modules, which lanes E and F cover. `format.ts` and `money.ts` were read, with no
  finding here (money-string DRY is lane F's B1).
- **`src/engine/migrations.ts` blocks** – lane B. Only `migrateSave`'s final too-new check was read.
- **`src/pwa.ts` and the service-worker update flow**, beyond the `registerType: 'prompt'` fact D-02
  needs – lanes A and G.
- **A browser run** of D-01 and D-06. D-01 was proven with the real store and the real worker module
  in node, over fake-indexeddb. A Playwright case would close the harness caveat, and a throttled run
  would settle D-06's device factor.
- **Real-device quota and eviction behaviour** (iOS storage eviction, `navigator.storage.persist()`'s
  answer). Only the code path was read: a quota abort rejects the commit and leaves the world
  untouched (TB-03), with no code and no test (D-P1).
