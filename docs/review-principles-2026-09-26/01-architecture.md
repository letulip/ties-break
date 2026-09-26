---
type: review
status: audit
area: project-review
canonical: false
last-reviewed: 2026-09-26
baseline: 03d92221
---

# Architecture and boundaries – 26 September 2026 review

## Verdict

The layering holds where it is enforced. The engine, worker, shared and db layers import nothing from
the UI and no framework package. The runtime import graph of `src` is acyclic, and
`tests/import-cycles.test.ts` enforces that mechanically. The worker queue, the persisted MAIN stream
and the `shared/matchViz` move closed four of the August review's structural findings. The debt is
where rules are only prose. A rule written as a comment, a review gate or a hand-kept list has drifted
every time the code around it grew. Three things matter most in this lane:

1. **The dev fast-forward's guard is a hand copy of the engine's own refusal.** This is **A-01**.
   The copy has been widened four times and once shipped an 11-day hole. It can lose a member today
   without its test noticing: the mutation below survived.
2. **The barrel costs bytes, not typecheck time.** This is **A-02** and **A-03**. A `KID_ID`
   imported through `engine/world` makes every UI importer's runtime closure the whole engine. The
   main chunk carries 28,275 B of album corpus that nothing on the main thread reads, while the
   install headroom is 17 KiB. The barrel itself is no longer the compatibility shim its
   documentation describes. 511 of its 627 names were born after the split, and a third of
   `world.ts`'s commits are barrel edits.
3. **P4 is recorded three ways at once**: ongoing, done and opportunistic. This is **A-04**. The
   probe shows nothing technical now blocks finishing it. No remaining block in `world.ts` calls back
   into another. What is left is an owner decision, not a dependency inversion.

Two more findings sit below them. **A-05**: the prologue and dynasty handovers reach `createWorld`
unchecked, and the clamp documented as their guard passes `NaN`. **A-06**: `world/lifeBeat.ts` has
grown from nothing to 8,003 lines in 17 days, which is `world.ts`'s history again with no rule
covering it.

## The app map

Sizes are from 00-baseline §A2 and §A3. `code / comment` counts lines, and "fan" is fan-in / fan-out
over distinct src modules. Verdicts are this lane's. For a part another lane owns, the top finding
points there.

| part | size | shape | verdict | top finding |
| --- | --- | --- | --- | --- |
| `engine/world.ts` (integration core + barrel) | 2,878 lines (953 / 1,854), 214,685 B; 627 exported names | fan-in 68 (20 runtime), fan-out 77; first function at line 702 | **debt** | A-03 (the barrel), A-04 (P4's status) |
| `engine/world/*` | 60 files, 50,258 lines (39 files / 18,129 on 26.08) | no runtime edge back into `world.ts`; `snapshot.ts` fan-out 63; `lifeBeat.ts` 8,003 | **debt** | **A-06** (`lifeBeat.ts`, 0 → 8,003 lines in 17 days); lane B for snapshot assembly (B-09) |
| engine leaf modules (`economy`, `offers`, `spirit`, …) | 26 files, 7,436 / 19,814 | `economy.ts` fan-in 61; 16 runtime edges from 10 "leaf" modules up into `world/*` | **debt** | lane C (economy, lead 7); P3 A-P3-3 (stale "world-free" claims) |
| `engine/match/` | 10 files | imports no `viz` since R2-06 (`2bfcfc3f`) | **healthy** | – |
| `engine/season/` | 11 files | `calendar.ts` fan-in 76 | **healthy** | lane C |
| `engine/diary/` | 6 files | `weekNotes.ts` 19,641 B also rides in the main chunk (via `App.vue → world/multiWeek`) | **healthy** | lane G (main-chunk bytes) |
| `engine/migrations.ts` | 3,311 lines | imports 12 live values from the barrel (`:24-38`) and 13 more from owning modules (`:54-77`) | **debt** | A-P3-7 (August AUG-A9, evaluated here) |
| `worker/` | `sim.worker.ts` 943 + `client.ts` 226 | FIFO queue (`:917`); owns the world | **risk** | **A-01** |
| `shared/` (incl. `protocol/`) | 18 files, 2,349 / 7,380 | runtime edges one way (engine → shared); type-only back (20 edges) | **healthy** | lane D |
| `db/` | 2 files, 580 lines | autosave ≈ 1 ms (§C.1) | **healthy** | – |
| `stores/game.ts` | 908 lines | runtime closure 12 modules; `busy` guard (`:420`) | **healthy** | lane D (lead 4) |
| `composables/` | 44 files, 3,470 / 6,019 | 13 of 44 read the global store; no module-level state | **debt** | lane E; the `blockingOverlay` half of A-01 |
| `components/` (+ `screens/`, `ui/`, `album/`) | 86 files, 23,408 / 20,945 | MoneyScreen 4,913, HomeScreen 3,405, SeasonScreen 3,147 | **debt** | lane E (August AUG-A6 regressed) |
| `App.vue` | 1,980 lines | fan-out 47; overlay router | **debt** | lane E |
| `prologue/` | 5 files | runs its own RNG sub-streams on the main thread and hands `years` / `spentCents` to `new` | **healthy** | **A-05** (the handover is not shape-checked worker-side, E-06's residue) |
| `art/`, `audio/` | 9 + 3 files | `audio` imports nothing; storage guarded | **healthy** | – |
| `viz/` | 8 files | `commentary.ts` 2,108 lines | **healthy** | lane E |
| `pwa.ts` | 1 file | – | **healthy** | – |
| the main chunk's engine share | 70 engine/shared/db/worker modules, 128,034 B; 121,534 B of it also in the worker | 131 runtime UI → engine edges | **risk** | **A-02** |

## Scope and method

**What I read.**
- The brief, whole.
- `00-baseline.md`, whole: §A in full, and §B–§D for the numbers used here.
- `CLAUDE.md`, whole.
- August material: `docs/review/01-architecture.md`, `08-cross-cutting-gaps.md` and `09-proposals.md`
  in full, `P4-world-decomposition.md` in full, and the heads and deliverables of P1–P3 and P5–P9.
- `docs/review-principles-2026-09-05/02-engine.md` E-06 / E-08 / E-09, and
  `docs/review-principles-2026-09-02/README.md` ARCH-36 / ARCH-37.
- `docs/specs/engine-ui-parity-2026-09.md` §§1–3.
- Searched, not read: `docs/decisions.md`, `docs/now-next-later.md`, `docs/backlog/the-quality-rig.md`
  and `docs/backlog/the-private-life-layer.md`.

**Code.** All code was read at `03d92221` in `/Users/letulip/Projects/Claude/tb-review`:
- `src/engine/world.ts`
- `src/engine/world/multiWeek.ts`
- `src/engine/world/albumBook.ts`
- `src/worker/sim.worker.ts`
- `src/composables/blockingOverlay.ts`
- `src/composables/weekAction.ts`
- `scripts/engine-purity.mjs`, `scripts/world-map.mjs`
- `tests/import-cycles.test.ts`, `tests/dev-fast-forward.test.ts`
- Added in gap-fill:
  - `src/worker/sim.worker.ts:287-326` (the `new` case)
  - `src/engine/economy.ts:8755-8775` (`prologueFundsCents`)
  - `src/shared/protocol/profile.ts:175-200` and `:320-390` (`profileShapeError`, `PrologueHandover`,
    `DynastyHandover`)
  - `src/engine/world.ts:1495-1600` (the head of `createWorld`)
  - `src/engine/childhood.ts:55-80` and `:332-341`
  - `src/engine/migrations.ts:1-103`, `:140-180`, `:530-560`, `:660-690` and `:1040-1060`
  - `tests/goldenSaves.test.ts:1-60`
  - `src/engine/world/lifeBeat.ts`, by its section banners and exports only

**Measurements.** No timing measurements were taken in this lane; the timings quoted are Phase 0's.

`RAW` = `/private/tmp/claude-501/-Users-letulip-Projects-Claude/c8208cb1-8875-425d-987a-91238b4d6641/scratchpad/review-raw/`.

`P` = `docs/review-principles-2026-09-26/probes/`. Each probe was authored in the output folder and
copied to the same path in the worktree to run.

Every command ran at `03d92221` with its output redirected to a file under `RAW/A/` ending in
`X_EXIT=0`.

| id | command | output |
| --- | --- | --- |
| C1 | `node P/arch-closure.mjs RAW/graph/edges.json closure <file>` (runtime transitive closure over Phase 0's AST edge list) | `RAW/A/closures.txt` |
| C2 | `node P/arch-closure.mjs RAW/graph/edges.json ui-engine`; plus an inline BFS over the same edges that excludes `world.ts`, to find the modules the UI reaches **only** through the barrel | `RAW/A/closures.txt`, `RAW/A/barrel-only-reach.txt` |
| C3 | `node P/arch-closure.mjs RAW/graph/edges.json leaf-up` and `… typecycle` | `RAW/A/leaf-up.txt` |
| C4 | `node P/barrel-usage.mjs RAW/graph/world-exports.json RAW/A/barrel-usage.json` (every import / export-from of `engine/world` in src, tests, tools, scripts and e2e, parsed with the repo's `typescript` 5.9.3) | `RAW/A/barrel-usage.log`, `.json` |
| C5 | `node P/world-exports-at.mjs b7a9358b 03d92221` and `… 6610f738 03d92221` | `RAW/A/world-exports-at.txt` |
| C6 | `node P/world-callbacks.mjs` (P4's call-back method, re-run on what is left in `world.ts`) | `RAW/A/world-callbacks.txt` |
| C7 | `for d in <dates>; do c=$(git rev-list -1 --first-parent --before="$d 23:59" 03d92221); git cat-file -p "${c}:src/engine/world.ts" \| wc -l; done` | `RAW/A/worldts-history.txt` |
| C8 | `git log --since=2026-08-26 --no-merges --format= --name-only 03d92221 -- src \| sort \| uniq -c \| sort -rn`; total `git log --since=2026-08-26 --no-merges --format=%h 03d92221 -- src \| wc -l` = 549 | `RAW/A/churn.txt` |
| C9 | per non-merge commit touching `world.ts` since 26.08: `git show -U0 <c> -- src/engine/world.ts`, with changed lines classed as comment / import-export / code | `RAW/A/worldts-commits.txt` |
| C10 | TypeScript-AST line split of `world.ts` at `6610f738` (26.08) and `03d92221`: import, export-from and function-declaration spans | `RAW/A/world-growth.txt`, `RAW/A/world-imex-lines.txt` |
| C11 | mutation experiment in a scratch worktree at `03d92221` (`tb-review-lanea`, since removed): control and mutant runs of `npx vitest run --project unit tests/dev-fast-forward.test.ts` | `RAW/A/dff-control.log`, `RAW/A/dff-mutant.log` |
| C12 | discarded top-level statements in Phase 0's sourcemap build (`RAW/dist-sourcemap/assets/index-Cp7uBwDI.js`), mapped back to source with the repo's `source-map-js` | `RAW/A/discarded-stmts.txt`, `RAW/A/discarded-origins.txt` |
| C13 | `git log --since=2026-09-05 --first-parent -L '/^\(export \)\?function <fn>(/,/^}/:src/engine/world.ts' 03d92221` per remaining function | `RAW/A/fn-churn.txt` |
| C14 | `NODE_PATH=~/.npm/_npx/162dec193635a3d4/node_modules node P/h-comment-tokens.cjs RAW/H/00-baseline-calib.md src/engine/world.ts src/engine/world/lifeBeat.ts src/engine/migrations.ts`. This is lane H's probe, with `@anthropic-ai/tokenizer@0.0.4`, the legacy tokenizer. It is calibrated ×1.395 to the harness's own count of `00-baseline.md`. | `RAW/A/world-tokens.log` |
| C15 | `npx vite-node P/a-prologue-wire.ts`: `createWorld` fed out-of-domain `prologue` / `dynasty` handovers, then 4 ticks, the autosave codec round-trip (`compressWorld` → `decompressWorld`) and the export → import round-trip (`encodeExportFile` → `decodeExportFile`) | `RAW/A/prologue-wire.log` |
| C16 | `node P/a-lifebeat-sections.mjs src/engine/world/lifeBeat.ts`: top-level declarations per numbered section banner, and the cross-section reference matrix (TypeScript AST, repo `typescript` 5.9.3) | `RAW/A/lifebeat-sections.txt` |
| C17 | `for d in 2026-09-09 … 2026-09-26; do c=$(git rev-list -1 --first-parent --before="$d 23:59" 03d92221); git cat-file -p "${c}:src/engine/world/lifeBeat.ts" \| wc -l; done`; and `git log --since=2026-08-26 --no-merges --format=%h 03d92221 -- src/engine/world/lifeBeat.ts \| wc -l` = 71 | `RAW/A/lifebeat-history.txt`, `RAW/A/lifebeat-churn.txt` |
| C18 | census of the live helpers `migrations.ts` imports: `grep -c "\b<name>\b" src/engine/migrations.ts` per name, `git log -L` over `startingSkills` / `rollPotential`, `git log -G "potentialBand: *\["`, and a grep for hash pins over `migrateSave` output in tests | `RAW/A/migrations-live.txt` |

⚠ `git grep -E` does not support `\b`. The verifier commands below avoid it.

## Findings

### A-01 · The dev fast-forward's guard re-spells `advanceRefusal`, and its test cannot see a member go missing
- Severity: P1
- Category: correctness-risk
- Evidence:
  - **The engine's rule.** `src/engine/world/multiWeek.ts:325-378` has `advanceRefusal`, with eight
    ordered terms: ending, `pendingTournament`, `pendingKnock`, `pendingBirthday`, `pendingLifeBeat`,
    the open fork, `retirementOffer` and `shootClashOpen`. `ADVANCE_REFUSALS` at `:317` lists them.
  - **The worker's copy.** The worker's `tick` case, at `src/worker/sim.worker.ts:357-392`, does not
    call that rule. It re-states the same eight terms as `decisionOpen`, used at `:397` (refusal) and
    `:402` (stop). The two are identical by construction today; `world/state.ts:1184/1541/1551/1553`
    types every field non-optional.
  - **The copy's history is four separate widenings:**
    - `7be01fab` (04.08) – fork, ending and retirement
    - `a435d088` (11.08) – birthday
    - `315fffb2` (28.08) – shoot-clash
    - `827efe6f` (20.09) – life beat

    The last was a real hole. `advanceRefusal` has refused on `'life'` since `b7ed734b` (09.09), and
    the primitive itself existed from `b7fabde5` (24.08). Even so, the button could tick past her
    card for eleven days. The worker's own note records this at `sim.worker.ts:370-380`, and
    CLAUDE.md records it under the `▶▶ 52` gotcha.
  - **The guard's test cannot see a member go missing.** `tests/dev-fast-forward.test.ts:64-88` claims
    "every predicate advanceWeeks blocks on". It asserts 7 of the 8 terms textually and never
    `shootClashOpen(w)`. Its layer-2 cases drive the worker on tournament, knock and life beat only
    (`:216`, `:232`, `:261`).
  - **The mutation (C11).** I replaced `shootClashOpen(w)` at `sim.worker.ts:392` with `false`. The
    file stayed **5/5 green**; the control was also 5/5 (`RAW/A/dff-mutant.log`,
    `RAW/A/dff-control.log`). No other test drives the worker's `tick` case with a clash open.
    `git grep -lE "shootClash|shoot-clash" -- tests e2e | xargs grep -lE "type: 'tick'|game\.tick\("`
    finds only this file. `tests/component/round29-shoot-clash-ui.test.ts` and
    `tests/r2-13-advance-span.test.ts` mention the worker only in comments.
  - **The same set is spelled by hand on the UI side.** The `BlockingOverlay` union at
    `src/composables/blockingOverlay.ts:24` lists it again. `src/composables/weekAction.ts:191-195`
    still says the refusal has "six states" and the overlay "five". Today they are 8 and 7.
- Why it matters: the `▶▶ 52 (dev)` button ships in every build (owner ruling), and the owner's
  deployed build is his playtest device. The next blocking kind added to `advanceRefusal` reopens the
  11-day hole unless someone remembers a second file, and the test would stay green. This is the
  §11 calibration class "a guard that passes while the thing it guards is gone", measured.
- Proposal:
  - Make `decisionOpen` call the engine's primitive:
    `const decisionOpen = (w: WorldState): boolean => advanceRefusal(w) !== null`. This is parity
    form A (engine-ui-parity §1). The engine (`world/multiWeek.ts`) owns the rule, and the worker only
    asks it.
  - Keep both call positions and the thrown string byte-identical. The string reaches the store's
    error surface, and the pin matches its shape.
  - Replace the seven `toContain` pins with one pin: `decisionOpen` calls `advanceRefusal`.
  - Add table-driven layer-2 cases for the members not yet driven: birthday, fork, retirement,
    ending and shoot-clash. Mutation-verify them the way C11 did.
  - On the UI side, extend `r2-13-advance-span`'s existing drift guard: every `ADVANCE_REFUSALS`
    member except `'tournament'`, which `TournamentFlow` owns, must be a `BlockingOverlay` member.
  - Correct the two stale counts in `weekAction.ts`'s comment. This is comment-only, not player
    wording.
- Blast radius:
  - RNG: none. The predicates draw nothing, and the same eight terms give the same boolean.
  - Proof: the frozen capture 41550 / `e6b0c709` is untouched, and `dev-fast-forward.test.ts`
    layer 2 still passes.
  - Schema: none.
  - Wording: the thrown sentence is unchanged.
  - Tests that move: `git grep -l "decisionOpen" -- tests | wc -l` = 1.
    `git grep -l "blockingOverlay\|BlockingOverlay" -- tests | wc -l` = 15 are unaffected; only
    `r2-13` gains an assertion.
- Effort: S
- Confidence: high – the mutation ran. What would raise it: the full unit gate run on the mutant, to
  confirm no file outside the grep's reach catches it. Not run here, because the brief forbids gates
  in Phase 1.
- Versus 05.09: new. August AUG-A3 asked for this guard to exist; this finding is about how it is
  spelled.
- Verification: CONFIRMED – `sim.worker.ts:357-392` hand-spells the eight terms and never calls `advanceRefusal`, the test pins 7 of 8 and drives only three states, and the verifier's own mutation (`shootClashOpen(w)` -> `false`) survived with 5 passed, X_EXIT=0.

### A-02 · UI imports through the barrel ship a 28 KB album corpus nothing on the main thread reads – against 17 KiB of install headroom
- Severity: P2 (re-rated from P1 in verification)
- Category: architecture
- Evidence:
  - **The dead statement.** Phase 0's production main chunk (`index-Cp7uBwDI.js`, §A5) contains the
    statement `;new Map(P_.map(e=>[e.id,e]));`. Its result is discarded, and it maps to
    `src/engine/world/albumBook.ts:315`, `const OCCASION = new Map(ALBUM_CORPUS.map(…))` (C12). Rollup
    dropped the binding but kept the expression for its possible side effects. That keeps the whole
    `ALBUM_CORPUS` literal: **28,275 B** of the main chunk (§A5 composition). Corpus text is present,
    for example "She wanted the whole record." (`grep -c -F` = 1 in the main chunk).
  - **Only the barrel reaches it.** `albumBook.ts`'s only importer is `engine/world.ts` (Phase 0
    edges). No UI file imports `albumBook` or `albumCorpus`; the album components take
    `AlbumSheetModel` from the snapshot. C2 lists the 21 engine modules the UI reaches only through
    `world.ts`, and `albumBook.ts` and `albumCorpus.ts` are among them.
  - **17 UI modules import the barrel at runtime:** 13 components, `buildInfo`, `matchReadout`,
    `tierState` and `weekDays` (Phase 0 edges).
    - Most take one to three constants or pure helpers. `BracketTabs.vue` and
      `ChildhoodPrologue.vue` import only `KID_ID`.
    - `BracketTabs.vue`'s runtime closure is **122 modules** through the barrel, against **1**
      (209 lines) for `world/constants.ts`, where `KID_ID` lives (C1).
    - The barrel's own closure is 120 modules and 98,064 lines (C1).
  - **The headroom.** It is 16,367 of 16,384 KiB (§A5). The queue already says
    "the first art round hits it" (`docs/now-next-later.md:243-244`, which plans a raise).
  - **Other discarded statements.** Four more such statements in the main chunk map to
    `shared/countries.ts:54`, `engine/season/names.ts:119`, `engine/development.ts:87` and
    `prologue/cards.ts:1161` (C12). Those modules are imported directly by UI code; they are lane G's.
  - **The same mechanism through a deep import.** `App.vue → world/multiWeek.ts → world/lifeBeat.ts →
    world/milestones.ts → diary.ts → diary/weekNotes.ts` carries 19,641 B of `weekNotes` into the main
    chunk (C2 path). That is lane G's.
- Why it matters:
  - 27.6 KiB of dead bytes is more than the whole 17 KiB headroom. Freeing it defers the ceiling
    raise the queue plans.
  - In vitest and the dev server, a component whose only engine need is `KID_ID` loads and evaluates
    the whole engine graph. That cost is unmeasured here, because the brief forbids timings in
    Phase 1.
- Proposal:
  1. Repoint the 17 UI runtime imports at the owning modules. `node scripts/world-map.mjs <symbol>`
     names each owner, for example `KID_ID → world/constants`, `flipScore → world/matchNews` and
     `prizeCentsFor → world/labels`.
  2. Make it a gate. Either `scripts/engine-purity.mjs` gains the reverse rule – no file under
     `components`, `composables`, `viz`, `prologue`, `art`, `audio` or `App.vue` imports
     `engine/world` at runtime (type-only stays allowed) – or a pin does it in
     `import-cycles.test.ts`'s style.
  3. Belt and braces: `/*#__PURE__*/` on `albumBook.ts:315`'s `new Map(…)`, or build `OCCASION`
     lazily on first read.

  The owner of each constant stays its `world/*` module.
- Blast radius:
  - RNG, schema and wording: none. These are import lines only, and the worker chunk does not
    change.
  - Proof arm: `npx vite build` then `node scripts/install-size.mjs`, before and after.
    `grep -c -F "She wanted the whole record." dist/assets/index-*.js` must go 1 → 0. The worker
    chunk must stay byte-identical: its hash is `sim.worker-BemILG4P.js` at the baseline. A
    byte-identical worker chunk is the proof behaviour cannot move.
  - Three source pins textually match a UI file's barrel import line and would move:
    `tests/money-format.test.ts:124`, `tests/prize-money.test.ts:443` and
    `tests/calendar-screen.test.ts:850`. Found with
    `git grep -nE "engine\\\\/world|engine/world'" -- tests`, excluding import lines. Each encodes
    "the screen reads the engine's constant" and repoints to the owning module.
  - `git grep -l "world/albumBook'" -- tests | wc -l` = 4 readers of `albumBook.ts` are affected
    only if a regex spans line 315.
- Effort: S
- Confidence: high that the corpus is in the main chunk and why (sourcemap-traced, graph-proved). The
  exact KiB freed is medium until the build arm runs: other barrel-only modules may shed or keep a few
  more bytes.
- Versus 05.09: new. August AUG-A4 named the double-shipping; this is its dead part, measured.
- Verification: PLAUSIBLE – the 28,275 B of dead corpus in the main chunk is confirmed, but the cause and the fix's yield are unproven: the barrel also reaches the main thread via MoreScreen -> db/saves -> saveCodec -> migrations.ts/saveGuard.ts, so repointing the 17 UI imports alone would not free the bytes (only `/*#__PURE__*/` or a lazy OCCASION would), and nothing breaks today with the ceiling raise queued «по необходимости», so it is measured debt.

### A-03 · The barrel stopped being compatibility: 511 of its 627 names were born after the split, and a third of `world.ts`'s commits are barrel edits
- Severity: P2
- Category: architecture
- Evidence:
  - **What the documents say it is.** `scripts/world-map.mjs:3-5`: "`src/engine/world.ts` is
    COMPATIBILITY, NOT DISCOVERY. It re-exports the decomposed `engine/world/*` modules under their
    historical names". CLAUDE.md's P4 rules say the same.
  - **The names (C5).** `world.ts` exported **116** names at `b7a9358b` (31.07, before the split),
    **296** at `6610f738` (26.08) and **627** at `03d92221`. So **511 of 627 are not historical**, and
    331 were added in the last month.
  - **Dead re-exports (C4).** **93** of the 627 are never imported through the barrel by any file in
    src, tests, tools, scripts or e2e; 83 of those 93 were born after 31.07. They are imported from
    their owning module instead, for example `seasonWrapDue` in 9 files.
  - **The commits (C9).** Of the 108 non-merge commits that touched `world.ts` since 26.08, **39
    changed only import/export lines** and 71 changed no code line. `world.ts` is the second
    most-churned src file in that window: 108 of 549 src commits, after `economy.ts` at 126 (C8).
  - **The file (C10).** The file spends 174 lines on imports and 179 on export-from, and its first
    function is at **line 702**.
  - **Two conventions (`git grep -lE "from '[^']*engine/world/[A-Za-z]+'"`).** 160 test files import
    both the barrel and a deep `world/*` path. Deep importers number 171 in tests, 142 in tools and
    10 in src UI.
  - **The pin P4 planned was never written.** P4's PR0 surface pin (`tests/worldBarrel.test.ts`,
    P4 §How) does not exist (`ls tests | grep -i barrel` is empty).
- Why it matters:
  - Every new engine symbol edits `world.ts`, for no reader gain. That makes the file a merge
    hot-spot by convention rather than by content.
  - A reader opens 700 lines of re-exports before the first function.
  - "Which module owns this?" now needs a generated map and a gate (`map:world:check`) to answer.
  - The document that justifies all this describes a shim the code no longer is.
- Proposal:
  - **Freeze the barrel.** Write P4's PR0 pin now: `Object.keys(await import('…/world'))` against a
    literal list, namely today's list minus the 93 dead names. Drop those 93 re-export lines.
  - **One rule in CLAUDE.md's P4 section.** A symbol born in `world/*` is imported from its owning
    module; the barrel carries only names already in the frozen list. The rule's owner is CLAUDE.md,
    and the pin makes it mechanical.
  - `world-map.mjs` stays: it is still the answer for the frozen 534.
- Blast radius:
  - RNG, schema and wording: none.
  - Tests that move: 0. By construction, no file imports the 93 dropped names through the barrel.
    One new pin is added, and `tools/generated/world-symbol-map.md` is regenerated.
  - `tools/compound-cost.ts:49` imports the barrel as a namespace but reads only `coachLadderNote`
    (`:85`), which stays.
- Effort: S
- Confidence: high (AST counts). What would raise it: `npm run check:tools` and `vue-tsc -b` on the
  pruned barrel, after Phase 1.
- Versus 05.09: new. 05.09 E-08 counted unconsumed exports engine-wide, and E-09 counted barrel
  importers: 486 then, 747 by the brief's command now (741 on statements).
- Verification: PLAUSIBLE – every number reproduces, but the framing as drift is unproven: P4's own stop-rule (`P4-world-decomposition.md:75`) prescribes new behavior as a module plus one barrel line, so the growth follows the plan and freezing the barrel is an owner decision; only `world-map.mjs:3-5` and CLAUDE.md's 'historical names' wording are stale.

### A-04 · P4 is "ongoing", "done" and "opportunistic" at once – and nothing but that choice now blocks it
- Severity: P2
- Category: architecture
- Evidence:
  - **Three statuses:**
    - **Ongoing.** `docs/backlog/the-quality-rig.md:32-36` says P4 is ONGOING, "continues in gaps".
    - **Done.** P4's own wave-3 note (`docs/review/proposals/P4-world-decomposition.md:256-292`) says
      "the package is done" and the remainder is "a coherent integration core". The same document's
      acceptance (`:88`) wants `world.ts` ≤ 200 lines with no function bodies, and its stop-rule
      (`:75`) says "a PR adding a function body to world.ts fails review".
    - **Opportunistic.** ARCH-37 (`docs/review-principles-2026-09-02/README.md:266-272`) says to move
      remaining seams "only when a feature needs the same boundary", and 05.09 E-09 kept that.
  - **Nothing has moved out since 26.08.** The function set at `6610f738` (26.08) is still there at
    `03d92221`, plus four prologue helpers.
  - **The size history (C7):**

    | date | lines |
    | --- | --- |
    | 31.07 | 5,521 |
    | 03.08 | 2,206 |
    | 22.08 | 4,066 |
    | 26.08 | 1,892 (R2-10) |
    | 26.09 | **2,878** |

    Of the +986 since 26.08, code is +206, of which +126 is import/export lines, and comments are
    +771 (C10).
  - **Nothing technical blocks the rest (C6).** The 26 declarations left in `world.ts` form three
    clusters with **zero call-backs outside themselves**:
    - **Tournament close** (≈ 630 lines): `finalizeTournament` (534) with `rankingDeltaSuffix`,
      `emitKidMatch`, `revealTournamentRound`, `skipTournament` and `closeTournament`.
    - **Creation** (≈ 600): `createWorld` (539), the `prologue*` helpers, `taughtShareOf`,
      `PROLOGUE_COACH_LADDER`, `STARTING_FUNDS_CENTS`, `PARENT_INCOME_CENTS` and `seedWorldForV6`.
    - **Advance and college exit**: `tickWeek`, `advanceWeeks`, `skipEvent`, `resumeFromCollege`,
      `endCollegeEarly`, `finishCollege`, `COLLEGE_REVEAL_REFUSAL`, and the MAIN-draw bookkeeping
      (`replayMainState`, `maxMainDraws`, `MAIN_DRAWS_*`).

    The only cross-cluster edge is `replayMainState → createWorld, tickWeek`. No `world/*` module
    imports `world.ts` at runtime (Phase 0 edges: the 20 runtime importers are UI, worker,
    `migrations.ts` and `saveGuard.ts`).
  - **`createWorld` is the file's live hot-spot.** It was touched by 14 first-parent merges since
    05.09, against 4 for `finalizeTournament` and ≤ 1 for the rest (C13). The reason: every
    persisted field adds a line and its essay to the 93-property literal at `world.ts:1595-2049`.
- Why it matters:
  - Three documents give a builder three instructions.
  - The stop-rule was a review gate, not a mechanical one, and the file has grown half again in a
    month.
  - The file is 214,685 bytes: P4's own "token dividend" rationale (`P4:166-169`) still applies.
    It costs 58,613 tokens on the legacy tokenizer, about 81.8k at the harness's ×1.395
    calibration, and 74.5 % of those tokens are comment (C14). (The first write-up said "roughly
    55k", an estimate from the byte count; C14 replaces it.)
  - A reader of the tick pipeline also loads creation and tournament close.
- Proposal: an owner decision, priced both ways.
  - **(a) Finish P4.** Three span-moves of the zero-call-back clusters: `world/tournamentClose.ts`,
    `world/create.ts`, and a tick/college-exit module. `world.ts` is left as the barrel plus its
    layering comment, with a pin allow-listing its function bodies (none). Effort M.
  - **(b) Declare the ordered facade final.** Amend P4's acceptance and stop-rule, retire the
    ONGOING row, and pin today's function list so any new body in `world.ts` is a decision rather
    than drift. Effort S.

  Either way, one status in one place.
- Blast radius:
  - RNG: none for either option. These are moves only, with no statement reordered.
  - Proof: the frozen capture 41550 / `e6b0c709` and the life-beat key-count nets unchanged, plus
    `npm run check` including `vite build` per move. P4's field notes record type re-exports through
    a value import killing the build twice.
  - Schema: none.
  - Tests that move: the pin query `git grep -l "engine/world.ts'" -- tests | wc -l` = 12. The 59
    users of `tests/worldSource.ts` are location-independent.
- Effort: M (a) / S (b)
- Confidence: high on the facts. The choice is the owner's.
- Versus 05.09: carried (E-09, owned by lane B; cross-referenced here as P4's owner)
- Verification: CONFIRMED – the three statuses are all on record (the-quality-rig.md:32-36, P4's wave-3 heading vs its standing acceptance and stop-rule, ARCH-37 in the 02.09 README:266-272), and the call-back probe, size and createWorld-merge numbers reproduce exactly; it overlaps E-09 and should be de-duplicated in synthesis.

### A-05 · The prologue and dynasty handovers reach `createWorld` unchecked, and the clamp documented as their guard passes `NaN`
- Severity: P2
- Category: correctness-risk
- Evidence:
  - **What the worker checks.** The `new` case refuses a malformed profile at
    `src/worker/sim.worker.ts:298` (`profileShapeError`, the 05.09 E-06 fix). It then passes
    `msg.prologue` and `msg.dynasty` into `createWorld` untouched (`:311-318`). Its own notes say
    so: "THE FIFTH ARGUMENT RIDES THROUGH UNTOUCHED" (`:304`).
  - **The dynasty note's claim does not hold.** The `:304-307` note says the dynasty block is
    covered because `createWorld` reads its background "through `profile` (which
    `profileShapeError` has just accepted)". But `createWorld` replaces the accepted background
    with `dynasty.background` at `src/engine/world.ts:1570-1571`, after the check has run.
  - **The guard that claims the prologue.** The `prologueFundsCents` doc says "THE CLAMP IS A GUARD
    AND NOT A DIAL. `spentCents` arrives over the wire, and invariant 1 says every command is
    re-validated engine-side" (`src/engine/economy.ts:8764-8767`). The clamp is
    `Math.max(-1, Math.min(1, …))` at `:8773`, and that returns `NaN` for `NaN`.
  - **What gets through (C15, at `03d92221`):**

    | handover | what `createWorld` does | what follows |
    | --- | --- | --- |
    | control, `spentCents: 0` | funds 3,000,000 | export → import OK |
    | `spentCents: NaN` | born with `fundsCents = NaN` | still `NaN` after 4 ticks. The autosave codec turns it into `null`, and export → import is **refused** ("`fundsCents` is out of range") |
    | `spentCents` absent | born with `fundsCents = NaN` | as above |
    | `years[0].practice: NaN` | born with **5 of 5 skills `NaN`** | export → import **OK**: the import spine checks `fundsCents` (`saveGuard.ts:180`) but not `skills` |
    | `years: null` | born; coach tier `budget`, not the profile's `middle` | a silently different career |
    | `dynasty.background: 'bogus'` | bare `TypeError` ("undefined is not iterable") | refused, but as the E-06 class's unnamed crash |

  - **Not reachable through the shipped screens.** The main thread builds the handover from the card
    table (`src/prologue/run.ts:267` `chosenYears`, `:292` `spentCents`).
    `tests/prologue-handover.test.ts` walks all 32 reachable runs (`everyRun()`, `:282`), and all
    of them are finite. That is why this is P2 and not P0.
- Why it matters:
  - Invariant 1 and the clamp's own doc both claim a defence that does not exist, for the one input
    the arithmetic cannot clamp. This is the §11 class, a guard that passes while the thing it
    guards is gone, but with no live trigger.
  - The failure is silent and it persists. The worker's own E-06 note gives the reason (`:291-297`):
    past this line `createWorld` has run and `adoptAutosave` has written the career (`:324`).
  - A `NaN`-funded career plays and autosaves, and its export file is then refused by the import
    gate. A `NaN`-skilled one exports and re-imports.
  - E-06 was fixed for `new.profile`. The three arguments added after it (v84 `trace`, v86
    `dynasty`, v87 `weightEnabled`) followed the "rides through untouched" precedent instead.
- Proposal:
  - Add `prologueShapeError(p: unknown)` and `dynastyShapeError(d: unknown)` in
    `src/shared/protocol/profile.ts`, beside `profileShapeError`. That file owns the wire's
    validators.
  - Call both in the `new` case before `createWorld`, throwing `CommandRefusedError` exactly as the
    profile check does.
  - The prologue rules:
    - `years` is an array of at most `CHILDHOOD_AGES.length` rows.
    - Each row's `age` is one of the childhood ages.
    - `practice` and `teaching` are finite and in [0, 1].
    - `focus` is in `SESSION_KINDS` (`profile.ts:233`).
    - `spentCents` is a finite integer ≥ 0.
    - `trace` is absent or an object.
  - The dynasty rule: `background` is in `BACKGROUNDS_ALLOWED` (`profile.ts:129`), plus the
    structural fields `createWorld` copies.
  - Then either make `prologueFundsCents` refuse a non-finite `spentCents`, or correct its doc to
    say the clamp bounds finite values only. The doc-only choice is comment text, not player
    wording.
- Blast radius:
  - RNG: none. Validation draws nothing, and `createWorld` is unchanged for accepted input.
  - Proof: the frozen capture 41550 / `e6b0c709` is untouched. The 32-run walk in
    `prologue-handover.test.ts` must stay green, which proves every shipped handover passes the
    new check.
  - Schema: none.
  - Wording: the refusal sentences are new strings, reachable only by a malformed payload. They can
    follow the existing `New career: …` shape. Whether they may reach the error surface at all is a
    **question for the owner** (invariant 4).
  - Tests that move: 0. `git grep -l "profileShapeError" -- tests | wc -l` = 3 and
    `git grep -l "prologueFundsCents" -- tests | wc -l` = 2 are unaffected. One new test file is
    added, mutation-verified by deleting the call (the C15 cases must then pass through again).
- Effort: S
- Confidence: high. The probe ran at the baseline. What would raise it: driving the same payloads
  through the real worker's `new` message rather than `createWorld` directly.
- Versus 05.09: carried (E-06). Lane D statuses E-06 as fixed for `new.profile`; this is its
  residue in the sibling arguments.
- Verification: CONFIRMED – the worker's `new` case runs only `profileShapeError` (`sim.worker.ts:298`) and passes `msg.prologue`/`msg.dynasty` straight into `createWorld` (`:311-318`) with no wire validation in `self.onmessage` (`:919-944`), `world.ts:1570-1571` overwrites the accepted background with `dynasty.background`, the clamp at `economy.ts:8773` passes `NaN` despite its wire-guard doc, and the verifier's re-run of the probe at 03d92221 was byte-identical; unreachable through shipped cards and not queued anywhere, so P2 stands.

### A-06 · `world/lifeBeat.ts` is the next `world.ts`: 0 → 8,003 lines in 17 days, 112 exports, and no decomposition rule covers it
- Severity: P2
- Category: architecture
- Evidence:
  - **The growth (C17, first-parent):**

    | date | lines |
    | --- | --- |
    | 09.09 | 0 (born in `b7ed734b` / `72a105c6`) |
    | 12.09 | 2,086 |
    | 15.09 | 4,174 |
    | 19.09 | 5,897 |
    | 22.09 | 7,053 |
    | 26.09 | **8,003** |

    That is 71 non-merge commits in 17 days. `world.ts` reached the 5,521 lines that started P4 in
    nine days: it was born 22.07 (`045ab5d9`, `git log --reverse -- src/engine/world.ts`), and C7
    gives the 31.07 size. `lifeBeat.ts` passed that size between 15.09 and 19.09. The pace is the
    same order. The difference is that `world.ts` then got a plan, and `lifeBeat.ts` has none.
  - **The size today.** 112 `export` statements and 204 top-level declarations (C16). It costs
    165,558 legacy tokens, about 231k at ×1.395, and 83.2 % of them are comment (C14). Only
    `world.ts` imports it in `src`, so its whole consumer surface is the barrel (A-03's mechanism).
    H-08 counts 110 barrel symbols it owns.
  - **The structure (C16).** The file is layered by beat kind, and its leaves are loose:
    - §1, the queue, has 21 inbound references.
    - 14 per-kind copy sections (§3b–§3m). 10 of them reference no other section, and §3c-2
      references only the queue.
    - A dispatcher hub inside §3k's span: `lifeBeatSaid` `:3838`, `lifeBeatHeading` `:4038`, the
      follow-ups and `buildLifeBeatPrompt` `:4510`. It makes 65 outbound references, into every
      copy section and into §5 and §12.
    - §4, raise and answer.
    - 12 per-kind hazard sections (§5–§16). Nine of them (§7–§11 and §13–§16) have **zero inbound
      references** inside the file: they are called only from outside. Their outbound references
      go to the queue, §3 (the presence law), §4, §5, §6, §12, the hub, or copy sections. §9 (the leak) and §10 (the
      booth) reference nothing at all.

    So the copy sections are leaves, and the nine hazard sections are consumers of the hub, never
    its callees. By P4's own test (no call-back into what stays), both groups are span-moves. §5,
    §6 and §12 are not: the hub or another hazard references them, so they stay with the hub.
  - **The index has drifted.** Two sections are numbered 3f (`:907` and `:2389`), and 3k sits after
    3m (`:3017`). The file's own numbering no longer locates a section.
  - **No queue entry covers it.** No backlog, now-next-later or decisions entry proposes splitting
    it (searched). The private-life layer that feeds it is "Next" (`the-private-life-layer.md:18`),
    so more kinds are coming.
- Why it matters:
  - This is the shape P4 was written to undo, re-forming in a `world/*` module. CLAUDE.md's
    decomposition rules name only `world.ts`, and nothing says when an extracted module is itself
    too big.
  - Every new beat kind adds a copy section and a hazard section to the same file. A builder working
    on one kind (100–800 lines) loads about 231k harness tokens, at least 9 Read pages of 25k.
  - The CLAUDE.md pin query misses most of its tests: 1 test file names its path (H-08).
- Proposal: an owner decision, with P4's method applied.
  - Keep `lifeBeat.ts` as the hub: the dispatcher, raise and answer, the fork want (§2), the
    presence law (§3), and §5, §6 and §12.
  - Move the queue (§1: zero outbound references, 21 inbound) first, into its own module. Then
    §3c-2's two references to it do not turn the copy leaves into a cycle.
  - Move each kind's copy section into a leaf module the hub imports, for example
    `world/beats/smallTalkCopy.ts` for §3c, §3c-2 and the frame pool.
  - Move each of the nine zero-inbound hazard sections into a module that imports the hub, never
    the reverse, for example `world/beats/smallTalk.ts` for §7. The direction is what keeps
    `tests/import-cycles.test.ts` green: the hub imports only copy leaves, and hazards import the
    hub.
  - Each move is a span-move with its comments verbatim. Importers use the owning module rather
    than a new barrel line (A-03's rule).
  - Add one CLAUDE.md line: a new beat kind is a new module.
  - Do it before the next kind lands, one kind per PR.
- Blast radius:
  - RNG: none. A span-move changes no `rngFromSeed` key string; the file has 20 such code lines.
  - Proof: the frozen capture 41550 / `e6b0c709` plus the life-beat key-count nets. Lane B's B-07
    (the key-inventory pin `lifeBeat` lacks) should land first, so a moved key cannot rename
    silently.
  - Schema: none.
  - Wording: none. Strings move byte-identical, and their pins read content, not location.
  - Tests that move: `git grep -l "world/lifeBeat.ts'" -- tests/ | wc -l` = 8 (CLAUDE.md's pin
    query), and `git grep -l "world/lifeBeat" -- tests/ | wc -l` = 24 is the upper bound, comments
    included. `tools/generated/world-symbol-map.md` is regenerated.
- Effort: M
- Confidence: medium-high. The sizes, history and reference matrix are measured. The hub's internal
  cohesion was counted, not read. What would raise it: one pilot move (§9, the leak, which has zero
  references) run through `npm run check` after Phase 1.
- Versus 05.09: new. The file was born 09.09.
- Verification: PLAUSIBLE – growth, size, commit count, exports, declarations, tokens, section-reference counts, the index drift and 'no queue entry' all reproduce, but the claim that only `world.ts` imports it in `src` is false: five `world/*` modules import `lifeBeat` directly (`endings.ts:67`, `multiWeek.ts:41`, `phaseHerWeek.ts:54` for all the `roll*` hazard entry points, `smallTalkCorpus.ts:36`, `snapshot.ts:99`), so the 'called only from outside' hazard sections are called from `phaseHerWeek`, and the section probe merges the two '3f' sections' reference rows; the 10-of-14 and 9-zero-inbound counts and the P2 maintainability cost hold.

## P3 – polish

| id | title | file:line | one-line proposal |
| --- | --- | --- | --- |
| A-P3-1 | `engine-purity` deny-lists four of the UI directories (`components\|composables\|stores\|viz`) and misses `prologue`, `art`, `audio` and `App.vue`; it is line-based and checks direct imports only | `scripts/engine-purity.mjs` (the `UI_DIRS` regex) | Invert it to an allow-list over Phase 0's AST graph: zone files may import only zone files and no package. A-02's reverse rule can live in the same script. |
| A-P3-2 | CLAUDE.md tells extracted modules to `import type { WorldState } from '../world'`, but `WorldState` lives at `world/state.ts:1059`. 44 `world/*` files follow the rule and 11 import `./state`. The rule keeps the type-only SCC at 107 files (§A3). | `CLAUDE.md` P4 rules; e.g. `src/engine/world/*.ts` headers | Amend the rule to `./state`. This costs nothing at runtime and lets the SCC report mean something about layering. |
| A-P3-3 | "World-free leaf" claims are stale. `world.ts:87` says `offers.ts` "is world-free … world -> offers runs one way", but `offers.ts:86` imports `world/ledger` at runtime. There are 16 runtime edges from 10 engine-root/diary modules up into `world/*` (C3). | `src/engine/world.ts:74-92`; `src/engine/offers.ts:86`; `src/engine/spirit.ts:107-123` | State the real rule – acyclic, enforced by `import-cycles.test.ts` – in CLAUDE.md's Layout, and drop "world-free" where it is false. |
| A-P3-4 | `weekAction.ts`'s comment gives the refusal six states and the overlay five; they are 8 and 7 | `src/composables/weekAction.ts:191-195` | Fold into A-01's fix (comment only). |
| A-P3-5 | Per-career `localStorage` keys are orphaned on career delete. `removeItem` appears nowhere in `src` (`git grep -n "removeItem" -- src` is empty). This is August AUG-A10's residue. | `src/composables/inboxCue.ts:104`, `src/composables/localStore.ts` | Give `localStore.ts` a prefix registry and a `forgetCareer(careerId)` called from delete (lane D/E). |
| A-P3-6 | 93 of the barrel's re-exports are never imported through it | `src/engine/world.ts:1-701` | Covered by A-03 (drop them with the freeze). |
| A-P3-7 | AUG-A9, evaluated (C18). `migrations.ts` takes 12 live values through the barrel and 13 from owning modules. Two uses follow the live engine on purpose, so that a migrated career equals a fresh one: v18→v19 and v24→v25 call `startingSkills` / `rollPotential` (`:545-548`, `:670-672`). One use follows it by nature: v34→v35 `replayMainState` (`:1053`) replays through today's `tickWeek`. The rest are shapes and constants. The golden corpus asserts shape, not bytes (`goldenSaves.test.ts:44-60`), and no test hashes a migrated fixture. No drift found: `rollPotential` and `potentialBand` are unchanged since `7cadd9dd`, and `STARTING_SKILL_BAND` was extracted with the same values (`e6d9042b`). No players yet, so no live cost. | `src/engine/migrations.ts:24-38`, `:54-77` | Repoint `:24-38` at the owning modules (`world-map.mjs` names them). This also cuts one of the barrel's main-thread routes, `saveCodec → migrations` (A-02's verification). A per-step output hash is optional, and it is the owner's call whether append-only means output bytes. |

## Delta versus 05.09

The 05.09 review had no architecture lane, so this lane owns **no** 05.09 finding. Every
architectural 05.09 finding has another owner, so **none** are unowned. They are listed here for
cross-reference only, and the owning lane gives the status. One residue that no lane had written up,
E-06's sibling arguments, is now A-05.

| ID | title | status | evidence |
| --- | --- | --- | --- |
| E-09 (lane B) | `world.ts` decomposition status | still open. The file is 2,265 → 2,878 lines, and barrel importers are 486 → 747 | C7; §A3 barrel table; A-04 here |
| E-08 (lane B) | 70 exports with no external consumer | (lane B's to status); the barrel's share is A-03's 93 | C4 |
| E-06 (lane D) | wire payloads the engine trusts | fixed for `new.profile` (lane D; `sim.worker.ts:298-299`). The residue is still open: `new.prologue` and `new.dynasty` ride into `createWorld` unchecked (`:311-318`). A `NaN` `spentCents` passes `economy.ts:8773`'s clamp and births a `NaN`-funded career. | **A-05** (C15) |

## August review and proposals

### `docs/review/01-architecture.md` (01.08, at `b7a9358`) – the code-structure findings

| ID | finding | status | evidence |
| --- | --- | --- | --- |
| AUG-A1 | `world.ts` is a god module (5,521 lines) | **partly fixed, and superseded by P4** | 2,878 lines at `03d92221`; 60 `world/*` modules; see A-04 |
| AUG-A2 | RNG restore replays the whole career | **fixed** | `442d830a` (01.08) schema v35 `rngMain`; replay survives only as corruption recovery (`sim.worker.ts:182-189`) |
| AUG-A3 | Dev command bypasses the engine invariants | **fixed as a guard, overruled as a gate** | Owner ruling: the button ships (CLAUDE.md; `c81f7e94`). Guards landed in `7be01fab` … `827efe6f`. The guard is a copy, which is A-01 |
| AUG-A4 | The Snapshot is not the real UI contract (~60 engine import sites) | **superseded** | The parity convention makes "call the engine's primitive" the rule (`engine-ui-parity-2026-09.md` §1). There are now 131 runtime UI → engine edges (§A3) and a double-shipped 121,534 B (§A5). The dead part is A-02 |
| AUG-A5 | Snapshot monolith rebuilt per command | **partly fixed** | Wave A memo (`world/derivedCache.ts:131`): 5.4–6.9 ms same-week. The advance still costs 12.6–13.7 ms (§B.3). Lanes D and G |
| AUG-A6 | Screen monoliths | **regressed** | MatchViewer 2,235 → 2,416; SeasonScreen 1,869 → 3,147; HomeScreen 1,705 → 3,405; TournamentFlow 1,684 → 2,136; App.vue 908 → 1,980; MoneyScreen now 4,913 (§A2). Lane E. They now have mounted nets (221 component files) |
| AUG-A7 | No worker request queue, no store re-entrancy guard | **fixed** | `3912d757` (01.08) FIFO queue, `sim.worker.ts:917`; `2a2f5bd0` (15.09) `stores/game.ts:420` |
| AUG-A8 | `engine/match` depends on `src/viz` | **fixed** | `2bfcfc3f` (24.08) R2-06; `rally.ts:23` imports `shared/matchViz`; `tests/engine-viz-direction.test.ts` |
| AUG-A9 | Migrations call live engine helpers | **still open, partly mitigated** | Frozen helpers at `migrations.ts:148-178` (`ef776eb9`). Live imports from the barrel remain at `:24-38`, including `replayMainState` and `seedWorldForV6`, plus `:54-77`. Evaluated here (C18): intentional for fresh-career identity or inherent, unguarded by output bytes, no drift found. That is A-P3-7 |
| AUG-A10 | `localStorage` as a second persistence channel | **partly fixed** | Guarded reads via `composables/localStore.ts` (`a27c7496`, U-07). No key registry and no cleanup on delete: A-P3-5 |

### `docs/review/08-cross-cutting-gaps.md` (01.08)

| ID | finding | status | evidence |
| --- | --- | --- | --- |
| AUG-X1 | No LICENSE file | **fixed** | `LICENSE`, `package.json:5`; `9ae7abed` (01.08) |
| AUG-X2 | OFL fonts shipped without their licences | **fixed** | `public/fonts/OFL-{Caveat,Manrope,Sora}.txt`; `9ae7abed` |
| AUG-X3 | No provenance for shipped art | **fixed** | `public/images/README.md` (`9ae7abed`; last row `28db3d70`, 16.09) |
| AUG-X4 | Zero release discipline | **partly fixed** | Build id at the foot of More (`src/buildStamp.ts`, `25fc7418`, 29.08). `git tag \| wc -l` = 0, and there is no CHANGELOG. Queued: `the-quality-rig.md:22` row 7 |
| AUG-X5 | i18n door welding shut (the formatter scatter) | **partly fixed** | One cents formatter, `src/shared/money.ts` (`aea5c2b1`). `toLocaleString('en-US')` is down from 19 sites to 8 (`git grep -n "toLocaleString('en-US'" -- src \| wc -l`). EN-only is a ruling |
| AUG-X6 | Dormant ad hooks promised, never designed | **still open (product call)** | `git grep -niE "adHook\|ad hook\|interstitial" -- src` = 0. Not a code-structure defect, so not re-judged |
| AUG-X7 | No privacy statement | **fixed** | `PRIVACY.md` (`9ae7abed`); linked from `MoreScreen.vue:943` |
| AUG-X8 | PR policy without GitHub plumbing | **fixed** | `CONTRIBUTING.md`, `.github/pull_request_template.md`, `.github/ISSUE_TEMPLATE/` (`9ae7abed`) |

### `docs/review/09-proposals.md` – P1 to P9

| proposal | status | evidence |
| --- | --- | --- |
| P1 – career endings | **done** | `src/engine/ending.ts` and `src/engine/world/endings.ts` added in `f5be3281` (04.08), "the engine learns how a career ends"; decisions log 2026-08 entries on the ending rules (e.g. `docs/decisions.md:223`) |
| P2 – pillar-3 psyche (morale and bond) | **superseded** | Never built as written; its substance lives in `src/engine/spirit.ts` (`23bc4b02`, 09.09, v72). `docs/backlog/the-private-life-layer.md:20` rules it "Rejected – absorbed" |
| P3 – persist the RNG stream | **done** | `442d830a` (01.08) schema v35 `rngMain`; CLAUDE.md invariant 2 |
| P4 – `world.ts` decomposition | **in progress, stalled since 26.08, status contested** | See "P4 in depth" below and A-04 |
| P5 – dual-universe bench | **done (Phase A); Phase B abandoned by its own threshold** | Pre-registration in `aa022686` (01.08); `tools/dual-universe-bench.ts`; `docs/specs/dual-universe.md` §5 and §6: "NOT MATERIAL … Phase B is closed unbuilt" |
| P6 – quick-wins wave | **done** (one item overruled) | Money formatter and engine-sourced starting funds (`aea5c2b1`); theme sync (`3a3fde52`); `test:sim` exits 0 on green (CLAUDE.md). The DEV gate was overruled by the owner – the button ships (`c81f7e94`) – and replaced by the worker guards (A-01) |
| P7 – legal and provenance wave | **done** | `9ae7abed` (01.08): LICENSE, OFL texts, art manifest, PRIVACY.md, `.github` set |
| P8 – mobile platform wave | **in progress (one third)** | Dialog semantics and focus done (`src/composables/dialogFocus.ts`, `7817feb9`, 10.08). `env(safe-area-inset-*)` appears per surface (e.g. `EndingScreen.vue:371`, `MuteButton.vue:93`). The system back gesture is unbuilt: no `popstate` or `pushState` in `src`. Queued in `the-quality-rig.md:21` row 6, "Later" |
| P9 – quality infrastructure | **in progress (half)** | Mounted component tests first landed in `58265b44` (03.08); 221 component files now. Build id done (`25fc7418`). The audio cache and asset diet were answered by rulings (full offline). No ESLint, no coverage, no tags or CHANGELOG: queued in `the-quality-rig.md:22` row 7, "Later" |

### P4 in depth

**What is left in `world.ts`** (§A3, C6, C10). The file is 2,878 lines.
- Lines 1–701 are imports, re-exports and their comments: 174 import lines and 179 export-from
  lines, 627 names.
- Then 19 functions and 7 consts in three clusters with zero call-backs between them. Only
  `replayMainState` reaches across, into creation and tick.

| cluster | members (lines) | local call-backs outside the cluster |
| --- | --- | --- |
| tournament close | `finalizeTournament` 713–1246 (534), `revealTournamentRound` (35), `skipTournament` (24), `closeTournament` (18), `emitKidMatch` (11), `rankingDeltaSuffix` (7) | 0 |
| creation | `createWorld` 1527–2065 (539), `seedWorldForV6` (37), `prologueCoachTier`, `prologuePlayStyle`, `taughtShareOf`, `PROLOGUE_COACH_LADDER`, `STARTING_FUNDS_CENTS`, `PARENT_INCOME_CENTS` | 0 |
| advance, college exit, MAIN bookkeeping | `resumeFromCollege` (218), `advanceWeeks` (128), `skipEvent` (80), `tickWeek` (79), `endCollegeEarly` (24), `finishCollege`, `COLLEGE_REVEAL_REFUSAL`, `replayMainState`, `maxMainDraws`, `MAIN_DRAWS_*` | `replayMainState → createWorld` only |

**What P4's own plan says remains.** The acceptance (`P4:88`) is `world.ts` ≤ 200 lines with zero
function bodies; the stop-rule (`P4:75`) fails any PR that adds a body. The wave-3 field note
(`P4:286-292`) instead calls the remainder "a coherent integration core … the thing that owns the
week". Both are in the same document.

**What blocks it.** Not dependency inversion. The runtime call-backs that stopped wave 0 are gone:
every remaining block measures 0 by P4's own method (C6). What remains:
- the unresolved choice between P4's acceptance and ARCH-37's "opportunistic"
- the 12 pin files `git grep -l "engine/world.ts'" -- tests` names
- the per-move proof burden: frozen capture, key-count nets, `npm run check` with the build

That is why A-04 is a decision, not a build plan.

**History** (C7, first-parent history):

| date | `world.ts` lines |
| --- | --- |
| 31.07 | 5,521 |
| 03.08 | 2,206 (waves 0–3) |
| 10.08 | 3,238 |
| 22.08 | 4,066 |
| 26.08 | 1,892 (R2-10, the phases) |
| 11.09 | 2,356 |
| 26.09 | 2,878 |

The file has been decomposed twice and has regrown twice. The first regrowth was feature code; the
second is 79 % comments and barrel lines (C10).

## Seed leads

**Lead 6 – the barrel. Partially confirmed.** The costs split unevenly:
- **Bundle: confirmed, and it is the real cost** (A-02). Rollup tree-shakes the barrel's
  re-exports: `engine/world.ts` contributes 46 B to the main chunk (sourcemap). What survives is
  module-scope side effects in modules the UI reaches only through the barrel: 28,275 B of
  `ALBUM_CORPUS`.
- **Typecheck: refuted as a material cost.** `vue-tsc -b --force` takes 8.61 s for the whole
  program and `check:tools` 2.90 s for all 266 tools scripts (§D.1). Nothing in a 458 s gate is
  attributable to the barrel.
- **Transform and test collection: plausible, unmeasured.**
  - The bulk unit pass spends 149.6 s in collect and the component project 118.9 s, both contended
    (§D.2, §D.3). I could not attribute a share to the barrel without timing, which this phase
    forbids.
  - Structurally, 448 test files import it, and most of them build worlds, so they need the engine
    graph anyway. The avoidable part is component tests that mount one of the 17 UI files: each such
    mount loads 120+ engine modules for a constant (C1).
  - To settle it: time a component file mounting `BracketTabs` (none exists today, so a throwaway
    one) before and after the import is repointed. The exact arm is in "Not reviewed".
  - **Left open, for README's "Not reviewed".** Lane G's report leaves it open too, and Phase 0 §D
    has no per-file collect / transform split to borrow. Lead 6's transform and collect halves are
    therefore unanswered by this review, not refuted. The arm is the one above.
- **Churn and ownership: confirmed** (A-03): 511 of 627 names are new, 93 are dead, and 39 of 108
  `world.ts` commits are barrel-only.
- **What P4 leaves in `world.ts`:** see "P4 in depth" and A-04.

## Not reviewed

- **Timings of any kind.** Phase 1 forbids them.
- **Lead 6's transform and collect cost of the barrel. ⭐ This item belongs in README's "Not
  reviewed".** No lane measured it: this lane, lane G and Phase 0 §D (no per-file split). No
  component test mounts `BracketTabs` today (`git grep -l "BracketTabs" -- tests/component | wc -l`
  = 0). So the arm is a throwaway `tests/zz-review-bracket-mount.test.ts` that mounts it. Run
  `npx vitest run --project component tests/zz-review-bracket-mount.test.ts --reporter=json` five
  times and read `collect` and `transform` from the JSON, first at `03d92221` and then
  in a scratch worktree with `BracketTabs.vue`'s `KID_ID` import repointed to
  `engine/world/constants`. Run it on a quiet machine, after the review.
- **The one-file test run on the A-02 fix.** Not run: it needs `vite build`, which Phase 1 forbids.
  The arm is written into the finding.
- **The full unit gate on A-01's mutant.** Gates are forbidden in Phase 1; one targeted file was
  run.
- **Internal cohesion of `engine/world/*` and `snapshot.ts`** – lane B (B-09). The exception is
  `lifeBeat.ts`, which gap-fill took into this lane as A-06, since lane B has no size or cohesion
  finding on it. `economy.ts` and the leaves – lane C. The protocol and the store – lane D. The
  `new.prologue` / `new.dynasty` validation, which no lane had written up, is now A-05.
- **`migrations.ts`'s individual steps.** Only the live-helper imports were evaluated (A-P3-7).
  I did not audit whether each frozen copy matches the clock it froze; the ladder is lane B's and
  is append-only by law.
  Screens, composables and the UI half of the parity sweep – lane E. Clones – lane F. Main-chunk
  bytes beyond A-02 (`weekNotes`, `names`, `countries`), and the precache – lane G.
- **`tests/`, `tools/`, `scripts/` and `e2e/` as architecture** – lane H, except where they consume
  the barrel.
- **August `docs/review/02`–`07` findings** – their dimensions belong to the other lanes. Only 01
  and 08 are statused here.
