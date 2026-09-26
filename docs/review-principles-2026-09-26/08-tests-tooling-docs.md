---
type: review
status: audit
area: project-review
canonical: false
last-reviewed: 2026-09-26
baseline: 03d92221
---

# Tests, tooling, docs and process – 26 September 2026 review

## Verdict

Every 05.09 finding in this lane with a concrete fix has one. T-01, T-02, T-03, T-04, T-06, T-07, T-09 and T-11 are closed with commits that name them. T-05 is half closed. T-08, T-12 and T-13 are open by design or by ruling. The mounted layer has overtaken source pins: 215 files mount a component, 86 read source text (05.09: 80 pin files and fewer mounted it-blocks than pin-file it-blocks). No P0 was found – no gate in this lane returns green on a defect I could reproduce. One named net can no longer fail on its own claim (H-19, `tier-window`'s too-young case, vacuous since the 16.08 age grid) – the §11 class, found through lane C's hand-off.

What costs this lane now is not a false green. It is **structure that has to be re-paid on every change**: walks repeated because nothing memoises them, registries committed as text that goes stale between commits, gates that read the working directory instead of the commit, and a comment corpus growing two lines for every line of code. The three that matter most:

1. **The coach-travel-edge family (H-01, P1).** It makes about 128 walk calls to reach three careers. It has been cut five times, and it has turned four CI or deploy runs red with every test green. A per-process, deep-frozen memo keeps every rung green – run on one file, it did 3 walks where the file makes 24, with 8 of 8 rungs green. That retires the cutting protocol, the rung ratchet and six heavy-pool slots.
2. **Committed generated registries (H-02, H-03).** Keeping them current took 16 catch-up commits in 22 days. Replayed over all 1,036 commits since 05.09, 132 (12.7 %) carry at least one stale registry, so `npm run check` would stop at a registry step on them; none of them is on main. A stale decisions index stopped `npm run check` at a wave's base twice. Of the 95 merges, 16 conflicted, in 23 file-level conflict events over 11 distinct files; generated files are 6 of the 23 events (2 of the 11 files). Separately, the tools registry and `check:tools` read untracked files: `tools:registry:check` is red in the owner's own checkout right now, on product code identical to the baseline.
3. **The comment convention, priced (H-04, owner decision).** Comments are 75.6 % of the tokens in `src` (engine 78.3 %). Since 05.09, `src` has gained 1.99 comment lines for every code line. What the brief feared did not show up in the measurements: none of the 11 files that conflicted in the 16 conflicting merges (of 95) is in `src`, and only 36 pin anchors in 19 test files depend on comment text. The cost is context, and a reading tool plus a growth ratchet buys most of it back without touching a ruling.

## Scope and method

All reads and runs are at `03d92221` in `/Users/letulip/Projects/Claude/tb-review`, the clean worktree, unless a line says otherwise. RAW means `/private/tmp/claude-501/-Users-letulip-Projects-Claude/c8208cb1-8875-425d-987a-91238b4d6641/scratchpad/review-raw/`. Every run redirected its output to a file with an `X_EXIT=$?` sentinel appended inside the command, and every verdict below was read from a file ending `X_EXIT=0` (or `X_EXIT=1` where a red is the finding).

**Read in full:**
- the brief;
- `00-baseline.md`;
- `docs/review-principles-2026-09-05/06-tests-tooling.md`;
- `docs/review/07-testing-tooling.md`;
- `docs/specs/engine-ui-parity-2026-09.md`;
- `CLAUDE.md` (branch copy);
- `docs/backlog/the-quality-rig.md`;
- `tests/helpers/career.ts`;
- `tests/coach-travel-edge-rungs-ratchet.test.ts`.

**Read in part:**
- `scripts/{pin-ratchet,tools-registry,context-audit,decision-index,heavy-tests}.mjs`;
- `.github/workflows/{ci,deploy,simulation}.yml` and `.gitlab-ci.yml`;
- `vite.config.ts:255-390`;
- `tests/coachTravelEdgeFixtures.ts` (the walk and the peel);
- `tests/goldenSaves*.test.ts`, `tests/e2e-fixtures.test.ts` (the structure) and `tools/e2e-fixtures.ts:1-80`;
- `tests/fixtures/saves/README.md:1-45`;
- `src/engine/world/state.ts:86-96`, `:940-959` and `:1380-1400`.

**Searched, not read:** `docs/decisions.md`, `docs/now-next-later.md`.

**Probes.** Each was written in `OUT/probes/`, copied to the same path in tb-review and run from there. None imports product code except `h-bulk-budgets.mjs`, which imports `scripts/heavy-tests.mjs`.

| probe | command | output |
| --- | --- | --- |
| `h-pin-census.mjs` – each test file classified as a source pin, a mount or a behavioural test | `node docs/review-principles-2026-09-26/probes/h-pin-census.mjs RAW/H/pin-census.json` | `RAW/H/pin-census.log` |
| `h-comment-anatomy.mjs` – comment blocks by size, dated, chronicle-shaped or ruling-bearing | `node …/h-comment-anatomy.mjs RAW/H/anatomy-src.json src` (and `… tests`) | `RAW/H/anatomy-{src,tests}.log` |
| `h-comment-tokens.cjs` – code against comment tokens, legacy tokenizer, calibrated | `NODE_PATH=~/.npm/_npx/162dec193635a3d4/node_modules node …/h-comment-tokens.cjs RAW/H/00-baseline-calib.md <files>` with `@anthropic-ai/tokenizer@0.0.4`, fetched by `npx --yes -p @anthropic-ai/tokenizer@0.0.4` | `RAW/H/comment-tokens.log`, `comment-tokens-src.log` |
| `h-comment-pins.mjs` – which pin markers and positive literals exist only in comment text | `node …/h-comment-pins.mjs RAW/H/comment-pins.json` | `RAW/H/comment-pins.log` |
| `h-merge-conflicts.mjs` – replays every two-parent merge since 05.09 with `git merge-file -p` in a scratch directory and classifies each conflict hunk | `node …/h-merge-conflicts.mjs 98e3560b..03d92221 RAW/H/mt RAW/H/merge-conflicts.json` | `RAW/H/merge-conflicts.log` |
| `h-bulk-budgets.mjs` – bulk-pool unit files that declare a budget of 60 s or more | `node …/h-bulk-budgets.mjs` | `RAW/H/bulk-budgets.log` |
| `h-registry-replay.sh` (gap-fill) – for every commit in a list, `git archive`s `src/engine scripts tools tests e2e package.json tsconfig.{app,tools}.json` minus `tests/fixtures` and `e2e/fixtures` (neither holds a `.ts` at either end of the range) into a scratch dir and runs THAT commit's own `world-map.mjs --check`, `tools-registry.mjs --check` and `pin-ratchet.mjs` | `git rev-list --reverse 98e3560b..03d92221 > RAW/H/replay/all.txt` (1,036 commits), split into three lists of ≤350, each run as `bash docs/review-principles-2026-09-26/probes/h-registry-replay.sh @RAW/H/replay/part-a{a,b,c} RAW/H/replay/s{a,b,c} RAW/H/replay/a{a,b,c}.txt` | `RAW/H/replay/{aa,ab,ac}.txt` (each ends `REPLAY_DONE`, logs `X_EXIT=0`), merged `replay-all.txt`; onsets `onsets.txt`, `summary.txt`; sample red messages `reasons.txt` |
| decisions-index replay over all commits (gap-fill) – the same loop over `docs/decisions.md` + that commit's `scripts/decision-index.mjs --check` | inline loop over `RAW/H/replay/all.txt` | `RAW/H/replay/dix-all.txt` (`X_EXIT=0`) |

**Git-history counts:**
- registry commits: `git log --no-merges … -- <file>` filtered to single-file commits (`RAW/H/registry-commits.txt`);
- the edit tax on archival tools: `RAW/H/tools-log.txt`, `archival-ages.txt`;
- fixture blob bytes: `git rev-list --objects … | git cat-file --batch-check` (`RAW/H/all-objects.txt`);
- the decisions-index replay over main's 33 first-parent commits since 05.09: the current `scripts/decision-index.mjs --check` run in a scratch directory against each commit's `docs/decisions.md` (`RAW/H/dix-main.txt`, 0 red).

**The comment share at 05.09:** `git archive 98e3560b src tests` into `RAW/H/old`, then the same four-rule classifier.

**Shared-checkout reads** (read-only, in `/Users/letulip/Projects/Claude/ties-break`):
- `node scripts/tools-registry.mjs --check` → `RAW/H/registry-shared.log`, `X_EXIT=1`;
- `npx vue-tsc -p tsconfig.tools.json --noEmit --listFilesOnly` → `RAW/H/tools-files-shared.txt`, `X_EXIT=0`.

**One mutation experiment, in my own worktree.** `git worktree add --detach …/tb-review-h 03d92221`, with `node_modules` symlinked. I patched `tests/coachTravelEdgeFixtures.ts` to memoise `walkFrozenCareer` per process and deep-freeze the result, and made it log each real walk. Then I ran the one file `npx vitest run --project unit --reporter=dot tests/coach-travel-edge-mid-schemas.test.ts` (`RAW/H/memo-mid.log`, `X_EXIT=0`; walk log `RAW/H/walks-mid.txt`). The worktree was removed afterwards (`RM_EXIT=0`), and `pgrep -lf "vite-node|vitest|vite preview|playwright"` was empty.

**Gap-fill additions (same SHA, same hygiene):**
- **A second mutation experiment, in a second own worktree** (`tb-review-hgap`, `WT_EXIT=0` in `RAW/H/gap-wt-add.log`, `node_modules` symlinked). The mutation is `src/composables/tierState.ts:224` `tierAgeBlock(t, input.ageYears) !== 'old'` → `=== null`, which also hides the rungs she is too YOUNG for (diff in `RAW/H/gap-mut-diff.txt`). Three runs of the one file `npx vitest run --project unit --reporter=dot tests/tier-window.test.ts`:
  - mutated, test as shipped: 29/29 green, `X_EXIT=0` (`RAW/H/gap-tierwindow-mut.log`);
  - mutated, the case's fixture age moved 14 → 13: 1 failed, `X_EXIT=1` (`gap-tierwindow-mut13.log`);
  - unmutated, fixture at 13: 29/29, `X_EXIT=0` (`gap-tierwindow-fix13.log`).

  The worktree was removed afterwards (`RM_EXIT=0`, `gap-wt-rm.log`). Only that one file was run. The other 10 test files that name `feedContext` or `feedShows` were not run under the mutation (H-19).
- **The `pins:check` ratchet's record:** `git log -- tools/generated/source-pin-baseline.json` (2 commits, both 24.08); the replay's `pr=` column. The unratcheted ordering family, at both SHAs: `git grep -hE 'indexOf\([^)]*\)\)\.toBe(Less|Greater)Than(OrEqual)?\([^)]*indexOf' <sha> -- tests | wc -l`.
- **August 07's migration-hop item:** `git grep -cw "v<n>" 03d92221 -- tests/migrations.test.ts` and `git grep -lw "v<n>" 03d92221 -- 'tests/*.ts'` minus `goldenSaves*` and `coachTravelEdge*`, for n = 0…34 (`RAW/H/hops-v0-34.txt`, `X_EXIT=0`). It is a word-match proxy.
- **Merge-conflict figures, reconciled.** `h-merge-conflicts.mjs` prints `merges 95`, `mergesWithConflict 16`, 23 file-level conflict events over 11 distinct files (`conflictedFiles`), and 27 hunks in `.ts` files – 24 of them in `tests/coachTravelEdgeFixtures.ts`, the rest in two `tools/` files (`RAW/H/merge-conflicts.log`). Earlier drafts called the 23 events "23 files". Every figure in this report now uses the terms events, distinct files and hunks.

**Not run, by the lane rules:** timings, full gates, `vite build`, jscpd. Every minute quoted here is Phase 0's (`00-baseline.md` §D).

## Findings

### H-01 · The coach-travel-edge family makes about 128 walk calls to reach three careers; the cure is a memo, not a sixth cut
- Severity: P1
- Category: tests
- Evidence:
  - **The walk is never memoised.** `tests/coachTravelEdgeFixtures.ts:5410-5522`: `walkFrozenCareer` walks `FREEZE_WEEKS = 156` ticks (`:5408`) on every call. Every exported hash helper calls it afresh: `careerHash` `:5524`, `careerHashAtSchema` `:5546-5547`, `careerHashUnderTheWindowRule` `:6143-6144`, `windowRuleWitness` `:6216-6217`, `careerHashUnderTheOldName` `:6276-6278`.
  - **About 128 call sites, for three careers.** Call sites across the seven family files (`grep -oE "\b<fn>\(" tests/coach-travel-edge*.test.ts`): `careerHashAtSchema` 114 (the baseline's stricter regex counts 111), `careerHash` 5, `windowRuleWitness` 4, `careerHashUnderTheOldName` 3, `careerHashUnderTheWindowRule` 2 – about 128 walks. The distinct careers are three: presets (0,1), (5,0) and (8,0), plus a few variants.
  - **The family's time.** Summed file time is 113.0 s (`00-baseline.md` D.2). `-late-schemas` (6 rungs, 15.7 s solo) runs in the bulk pool because the fifth cut (`154b17d0`, 23.09) never touched `scripts/heavy-tests.mjs` – see H-05.
  - **It grows with every schema bump.** A bump adds one peel rung and three more walks (`5e44e506`: «-recent … gains a rung per schema move (~2.5 s each)»); there were 19 bumps in 22 days (`git log -G"SAVE_SCHEMA_VERSION = [0-9]" 98e3560b..03d92221 -- src/engine/world/state.ts`).
  - **Its record.** Five cuts: `518a53c1`, `3dda7566`, `8527757a`, `5e44e506`, `154b17d0`. A rung ratchet, `tests/coach-travel-edge-rungs-ratchet.test.ts` (`MAX_RUNGS = 10`). Red with every test green on CI three times by 16.09 (`8527757a`: «the third time this family has produced it») and on the deploy on 18.09 (`5e44e506`).
  - **Experiment** (own worktree, one file). With `walkFrozenCareer` memoised per process and its result deep-frozen, `tests/coach-travel-edge-mid-schemas.test.ts` is **8/8 green, `X_EXIT=0`, with 3 real walks** – one per career key (`RAW/H/walks-mid.txt`). The same file makes 25 `careerHashAtSchema` calls at the baseline. The freeze means a rung that mutated the shared world would throw instead of passing on a dirtied fixture; none did, because the peel only destructures (`:5548-5600`).
- Why it matters: This is the one structure in the unit gate that turns into a red CI or deploy run every few schema moves. The protocol that answers it (cut verbatim, keep the describe name, re-measure, ratchet) costs a commit and a heavy-list decision each time, and the fifth cut already missed that decision. The walks are also most of the family's 113 s; G owns the minutes. The helper file itself is 6,280 lines, with 441 lines of code, 5,781 of comment and 94.0 % of its tokens in comments (`h-comment-tokens.cjs`). It is the only `.ts` file under `tests/` that conflicted in a merge since 05.09: 24 hunks in one merge, which is 24 of the 27 hunks the replay found in any `.ts` file (the other 3 are in two `tools/` files; `h-merge-conflicts.mjs`).
- Proposal: Put a per-process memo keyed by `(presetIndex, policyIndex, force, profileOverride)` inside `walkFrozenCareer`, and hand out the walked world **deep-frozen**, so any rung that mutates the shared fixture fails fast. The helper module keeps owning the walk. Once the memo lands:
  - stop cutting;
  - retire the rung ratchet, or re-aim it at "each file calls the memoised walker";
  - leave the seven files as they are – no merge-back churn;
  - `-late-schemas` no longer needs a heavy-pool slot.

  Walks per process fall from about 24–37 to at most one per career key.
- Blast radius: RNG keys and draws are untouched – the walk code path is the same and runs once instead of N times. Every rung already asserts a pinned sha256 per career, so the 8/8 green rungs are the byte-identity proof. The frozen capture (41550 / e6b0c709) is not read by this family and cannot move. No save schema, wording or balance is involved. `git grep -l "coachTravelEdgeFixtures" -- tests/ | wc -l` = 24 (7 import it; the rest are comment references). No bench arm is needed: behaviour cannot move.
- Effort: S
- Confidence: high – proven on the largest heavy member. Running the other six files with the same patch would make it certain.
- Versus 05.09: new (the 05.09 lane's T-05 named lazy caches in other files, not this family)
- Verification: CONFIRMED – walkFrozenCareer (coachTravelEdgeFixtures.ts:5408-5522) re-walks 156 weeks per call with no memo and no ruling against one, the call counts and red-with-green record (8527757a, 5e44e506) reproduce, 154b17d0 left late-schemas in the bulk pool, and the memo experiment ran 8/8 green in 3.48 s against a ~20 s solo baseline (nuance: non-comment call sites are about 123, and the memo was proven on one of seven files).

### H-02 · Generated registries are committed text that goes stale between commits: 132 of 1,036 commits stale, 16 catch-up commits, two red-at-base gates and 6 of 23 conflict events in 22 days
- Severity: P2
- Category: tooling
- Evidence:
  - **The registries.** `tools/generated/world-symbol-map.md` (`scripts/world-map.mjs`), `tools/README.md` (`scripts/tools-registry.mjs`), and the generated block inside `docs/decisions.md:20-51` (`scripts/decision-index.mjs:42-43`).
  - **Catch-up commits since 05.09, single-file** (`RAW/H/registry-commits.txt`, then `git show --name-only`):
    - world map 7 (`7dd96a30` … `7081fb16`);
    - tools README 6 (`ee0fe0f1` … `2da17779`);
    - decisions index 3 regeneration-only (`89850de2`, `0d5bacc7`, `b18a5819`) plus 2 entry-and-regeneration (`7700745b`, `89e4b21c`).

    Beyond those, 65 and 66 of the 941 non-merge commits since 05.09 touched the map and the README (`git log --no-merges --format=%h 98e3560b..03d92221 -- <file> | wc -l`).
  - **Red at a wave's base, twice.**
    - `89850de2` (13.09): «ccc83cbc … added a dated entry to docs/decisions.md … without regenerating the index … the gate stopped there and nothing after it ran – the typecheck, the unit suite, the component project and the build included».
    - `b18a5819` (23.09): «`npm run decisions:check` has been red on this branch since it was cut».
  - **Main stayed clean.** Replaying the check over main's 33 first-parent commits since 05.09 found none stale (`RAW/H/dix-main.txt`). The staleness lives on branches – where agents gate.
  - **The per-commit red rate** (gap-fill; `h-registry-replay.sh` plus the decisions loop over all 1,036 commits in `98e3560b..03d92221`, each commit's own script). An "onset" is a red commit none of whose parents is red (`RAW/H/replay/onsets.txt`, `summary.txt`):

    | check | red commits | onsets | red on main's first parent |
    | --- | --- | --- | --- |
    | `map:world:check` | 72 (6.9 %) | 18 | 0 |
    | `tools:registry:check` | 57 (5.5 %) | 13 | 0 |
    | `decisions:check` | 13 (1.3 %) | 3 (`ccc83cbc`, `5effa45b`, `dcca657d`) | 0 |
    | any of the three | **132 (12.7 %)** | – | 0 |

    - An episode lasts about four commits (72 / 18, 57 / 13) before a catch-up commit clears it. No onset is born at a merge whose parents were both green: every episode starts at an ordinary commit on a branch.
    - The sampled red messages are «tools/README.md is stale» and «world-symbol-map.md is stale» (`RAW/H/replay/reasons.txt`). None of them is the tsconfig list or a missing file.
    - Caveat: a commit that is red here is red for whoever gates, bisects or branches at it. It is not a CI run, because agents gate at a wave's end.
  - **Merge conflicts.** 16 of the 95 merges since 05.09 conflicted, in 23 file-level conflict events over 11 distinct files. `tools/README.md` accounts for 5 events and `world-symbol-map.md` for 1: 6 of the 23 events, 2 of the 11 files (`h-merge-conflicts.mjs`, `RAW/H/merge-conflicts.log`). The probe reproduces the three conflicts that `404d3d74`'s message records. `docs/decisions.md` conflicted in 3 events too, but that is its hand-written body – the replay does not separate out the generated block.
  - **CI never runs two of the fast gates.** `.github/workflows/ci.yml` has no `pins:check` and no `decisions:check` step (`grep -nE "pins:check|decisions:check" .github/workflows/*.yml`: none); they live only in `package.json:11`'s `check`.
- Why it matters: Each stale registry is a one-command fix, but it lands on the NEXT person's gate. Because `check` is an `&&` chain with `decisions:check`, `map:world:check` and `tools:registry:check` as steps 5–7, a stale registry hides the typecheck, the unit gate and the build verdicts behind a docs error. One commit in eight since 05.09 would stop `check` that way, over 34 onsets (counted per check) in 22 days. That is the most frequent single cause of a red local gate this lane can count from git.
- Proposal: Three changes, in order of cost:
  - **(a) Fail at the stale commit, not at the next gate.** A `pre-commit` hook in `.githooks/` (already wired by `prepare`, `package.json`) runs the three `--check`s when their inputs are staged: about 0.6 s together (D.1: 0.10 + 0.34 + 0.18 s). It names `npm run decisions` / `map:world` / `tools:registry` on red. Scripts own it.
  - **(b)** Add `pins:check` and `decisions:check` to `ci.yml` beside `world-map` (0.3 s).
  - **(c) Owner call.** Stop committing the world map, whose question `node scripts/world-map.mjs <symbol>` already answers. Generate it in the graph hook or on demand, and have docs point at the command. That removes 65 commits' churn and its merge conflicts. The cost: an agent reads a command's output instead of a file.
- Blast radius: No house law. `git grep -l "world-map\|tools-registry\|decision-index" -- tests/ | wc -l` = 1. The hook changes no product byte.
- Effort: S for (a) and (b); S–M for (c)
- Confidence: high – every count is from git, and the per-commit red rate is a full replay (gap-fill). Two things would make it stronger: how many of the 132 commits an agent actually gated on, which git does not record; and a replay of the other `check` steps for comparison.
- Versus 05.09: new (05.09 listed these gates as healthy; the staleness cost is new evidence)
- Verification: CONFIRMED – the single-file catch-up commits (map 7, README 6, decisions 3+2), the two red-at-base `npm run check` messages and ci.yml's omission of pins:check and decisions:check all reproduce (correction: an independent merge-tree replay finds 16 conflicting merges and 23 conflict events over 11 distinct files, so the generated files are 2 of 11 distinct files, not "6 of 23 conflicted files").

### H-03 · Two gates judge the working directory, not the commit: `tools:registry:check` is red in the owner's checkout on product-identical code
- Severity: P2
- Category: tooling
- Evidence:
  - **Both gates read the directory.** `scripts/tools-registry.mjs:64-99` enumerates `tools/` with `fs.readdir`, untracked files included, and `tsconfig.tools.json:29` includes `tools/**/*.ts` (what `check:tools` compiles).
  - **Red in the owner's checkout now.** In the shared checkout (branch `review/principles-2026-09-26`, product code equal to `03d92221`), another session's seven untracked files (`tools/_devlog_*.ts`, `tools/devlog-*.ts`, `tools/devlog/capture.spec.ts`) make `node scripts/tools-registry.mjs --check` print «tools/README.md is stale» with `X_EXIT=1` (`RAW/H/registry-shared.log`). There `check:tools` compiles 273 tools files where the tree holds 266 (`--listFilesOnly`, `RAW/H/tools-files-shared.txt`).
  - **It has already shipped a wrong registry once.** `836afb3c` (23.09): «the committed README listed five files the repository does not hold and every clean worktree's check refused it».
- Why it matters: A gate's verdict should be a function of the commit. Here it is a function of whatever else sits in the checkout. The owner's `npm run check` fails at step 7 until someone else's probes are adopted or moved. `836afb3c` calls that «his pending call on the probes, not a defect of the gate», but the gate reading untracked files is the part a fix can remove. A regeneration in a dirty tree commits a registry that is wrong for everyone else – it has happened once.
- Proposal: `tools-registry.mjs` enumerates `git ls-files tools tests e2e` (tracked plus staged) instead of `readdir`. `check:tools` compiles an explicit file list generated by the registry (the precedent: the registry already keeps `tsconfig.app.json`'s tools list equal to the live set), or runs through `--listFilesOnly` minus untracked files. Scripts own it.
- Blast radius: No house law. `git grep -l "tools-registry\|tsconfig.tools" -- tests/ | wc -l` = 1. No product byte moves.
- Effort: S
- Confidence: high – reproduced now, and recorded in `836afb3c`.
- Versus 05.09: new
- Verification: CONFIRMED – tools-registry.mjs:64-99 walks tools/ with fs.readdir and tsconfig.tools.json:29 globs tools/**/*.ts, and `--check` exits 1 in the shared checkout (7 untracked devlog .ts files) while passing in the clean worktree on product-identical code.

### H-04 · The comment convention, priced: 75.6 % of `src` tokens are comments and growth runs at 2 comment lines per code line – options for the owner
- Severity: P2
- Category: docs
- Evidence:
  - **The share.** 101,805 comment against 67,540 code lines, 60.1 % of non-blank lines (`h-comment-anatomy.mjs`, reproducing `00-baseline.md` §A2). By characters the share is **77.2 %** (8.37 M against 2.47 M). By tokens it is **75.6 %** of `src` and **78.3 %** of `src/engine` (`h-comment-tokens.cjs`, `@anthropic-ai/tokenizer@0.0.4`, 3,060,711 tokens over all `src` `.ts`/`.vue`).
  - **Calibration.** The harness's Read tool reported 57,501 tokens for `00-baseline.md`, where the legacy tokenizer counts 41,207: a factor of ×1.395. The shares do not depend on it.
  - **What a builder pays** to load a file whole (legacy tokens, ×1.395 in brackets for the harness; the Read tool pages at 25k):
    - `world/lifeBeat.ts`: 165,558 (≈231k, about 10 pages), of which code is 27,805 (≈39k, 2 pages);
    - `economy.ts`: 188,914 (≈264k), code 15,334;
    - `world/state.ts`: 55,073 (≈77k), code 1,501 (97.3 % comment).
  - **Growth.** At `98e3560b` (05.09) `src` held 50,559 code against 67,990 comment lines (57.4 %). Since then it gained +16,981 code and +33,815 comment lines – **1.99 comment lines per code line added** (classifier over `git archive 98e3560b src`). The 05.09 engine lane's E-11 measured 3.6 per code line over three days and proposed "compress on touch", as did the 02.09 P-02 template. The share has kept rising.
  - **The audit already asks the question.** `context:audit` prints «is the history compressible to an invariant plus a decision link?» for 80 of 297 source files, two of which carry a written reason. It reports 37 files newly over a trigger and 69 growing fast since 24.08, as warnings that never fail (`scripts/context-audit.mjs:120-140`, `RAW/gates/c01-context-audit.log`).
  - **What kind of comment.** Of `src`'s 101,805 comment lines, 67.8 % sit in blocks that are dated (dd.07–dd.09) or name a round, wave or review item. 41.3 % are in dated blocks and 56.9 % in blocks carrying a «» quote or Cyrillic text (the owner's rulings). These are block-level upper bounds. There are 591 blocks of 30 lines or more, holding 28,247 lines. The largest is `world/state.ts:89-958`: 870 lines of per-version schema changelog above `SAVE_SCHEMA_VERSION` (`:959`), a history `migrations.ts` and `tests/fixtures/saves/README.md` also keep (P3 table).
  - **Stale comments as false claims**, measured by Phase 0b:
    - `world/state.ts:1398-1399` says the inbox is «a handful of rows per career and is never pruned»; it ends careers at 274 rows (`00-baseline.md` B.6);
    - `world/constants.ts:196`'s «≈265» match rows reads about 175 at a career's end (B.8 item 4);
    - `ci.yml:88-90,109-110` carry counts that no longer hold (P3).
  - **What it does NOT cost.** Merge conflicts in `src`: 16 of the 95 merges since 05.09 conflicted, over 11 distinct files, and **none of the 11 is in `src`**. The replay found 27 conflict hunks in `.ts` files – 24 in `tests/coachTravelEdgeFixtures.ts`, 3 in two `tools/` files. Of the 27, 1 was comment-only and 3 mixed (`h-merge-conflicts.mjs`). Pins anchored on comment text: 19 of 369 single-line marker literals and 17 of 889 positive `toContain` literals in source-reading files – 36 anchors in 19 files (`h-comment-pins.mjs`). All of them fail loudly, because the marker helpers throw.
- Why it matters: The rulings are the reason the convention exists, and this report does not argue with them. What it prices is the reading cost: an agent that needs `lifeBeat.ts`'s logic loads about 6× the tokens of that logic. The growth shows "compress on touch" does not hold under the current pace. More prose also means more unverified claims – three stale ones are measured above.
- Proposal: **Owner decision.** Options, each priced (they compose):
  - **O0 – status quo.** Cost as measured, growing about 2:1. Zero work.
  - **O1 – a reading tool, zero source change.** `node scripts/code-view.mjs <file>` prints the code lines with their line numbers, collapses each comment block to its first line plus `[N lines: L-M]`, and always keeps lines carrying ⚠⚠, «» or Cyrillic in full. An agent reads about 17–25 % of the tokens and opens a block by line range when it needs one.
    - Effort: S, owned by `scripts/`. No pin, ruling or wording moves.
    - Risk: a reader skips a single-⚠ block. Mitigated by keeping the headline line.
  - **O2 – a short "why" at the site, with dated re-aim chronicles moved behind a pointer.** They move verbatim to `docs/decisions.md` or a per-module `docs/notes/<module>.md#<anchor>`.
    - Effort: L if swept, S per touched file. Pilot on `state.ts:89-958`, the most mechanical case.
    - It needs the owner to amend "preserve verbatim when moving code" to "verbatim, at a pointer".
    - It moves the 36 anchors in 19 files (loudly) and grows `docs/`, already +49 % in 22 days.
  - **O3 – a growth ratchet, no migration.** Turn the audit's per-file comment-characters warning into a one-way ratchet on growth beyond the baseline, the pin-ratchet's shape. A new chronicle then goes to the decision log with a one-line pointer; nothing existing moves. Effort S. It stops the 2:1 growth only.
  - **O4 – git as the chronicle.** The commit bodies here are already detailed (e.g. `89850de2`), so comments keep the current "why" and ruling, and history is `git log -L`. It costs as much as O2 with no notes file, and loses in-file history.

  The cheapest pair is O1 + O3. Neither touches a ruling.
- Blast radius: no RNG, schema, balance or player-facing wording. The convention itself is the owner's. O2 moves 36 pin anchors in 19 files (`h-comment-pins.mjs` list); O1 and O3 move none. `git grep -l "context-audit" -- tests/ | wc -l` = 0.
- Effort: S (O1, O3) · L (O2 swept)
- Confidence: high on the measurements. Medium on the token scale – the tokenizer is the legacy one; the shares are robust.
- Versus 05.09: carried (the engine lane's E-11 "comment volume: measured, not judged", and 02.09 P-02); re-priced here
- Verification: CONFIRMED – an independent block-aware classifier reproduces 67,550 code vs 101,818 comment lines and +16,981 code / +33,815 comment lines since 98e3560b (1.99:1), with token shares 75.6 % src and 78.3 % engine, and the comment volume is in scope per brief §3 (caveats: the character share is method-dependent, 78.8 % on trimmed lines, and option O3 cuts against context-audit.mjs:120-133's documented never-fail TOK-8 design, which the owner should see before choosing it).

### H-05 · Heavy-pool membership is curated by incident, not by a rule: one family member is missing and the list's own measurements have drifted
- Severity: P2
- Category: tests
- Evidence:
  - **The list.** `scripts/heavy-tests.mjs:173` `HEAVY_UNIT_FILES` has 25 entries in a 557-line module, 391 of its lines comment. The last change was `5e44e506` (18.09).
  - **The fifth cut missed it.** `154b17d0` (23.09) created `tests/coach-travel-edge-late-schemas.test.ts` and touched three files, none of them `heavy-tests.mjs`. The family's other six members are all listed (`:442-447`), and `late-schemas` read 26.0 s contended in the bulk pool (D.2).
  - **The list no longer matches its own measurements** (`00-baseline.md` D.2 solo re-timings and D.7-2): `week-notes` 27.4 s, `coach-load` 24.6 s and `wave10-walker-retirement` 21.6 s run in the bulk pool, heavier than 24 of the 25 heavy shards, while nine heavy shards take under 11 s.
  - **The ratchet guards the wrong property.** It checks rung count per file (`coach-travel-edge-rungs-ratchet.test.ts`), not pool membership.
- Why it matters: The pool exists to keep a long synchronous file off the contended ten-core pool, where birpc's 60 s window becomes a red CI job. Membership is added after an incident and never re-measured, so the list certifies the past.
- Proposal: A deterministic guard, scripts-owned:
  - a unit test (the `tests/sim-serialisation.test.ts` shape, "a gate on the gates") failing when any file matching a declared family glob (`coach-travel-edge-*-schemas`, `goldenSaves*`) is outside `HEAVY_UNIT_FILES`;
  - a dated `npm run test:heavy-audit` that re-derives the list from a Phase-0-style per-file JSON (`RAW/gates/units-json.mjs` already exists) and prints proposed moves, run at each wave close.

  H-01 removes the family's need altogether. G owns the minutes.
- Blast radius: No house law. `git grep -l "heavy-tests" -- tests/ | wc -l` = 7. Pool moves change wall-clock only.
- Effort: S
- Confidence: high on the drift. Medium on the audit's value until one wave uses it.
- Versus 05.09: carried (T-05 (a), "any bulk file near 40 s solo goes into HEAVY_UNIT_FILES by the existing rule") – the rule is still manual
- Verification: CONFIRMED – 154b17d0 created late-schemas without touching scripts/heavy-tests.mjs, HEAVY_UNIT_FILES lists the other six family members but not it, and coach-load, week-notes and wave10-walker-retirement run in the bulk pool at 43.8/42.9/39.2 s against the file's own ~32 s in-pool bar (nuance: late-schemas itself reads 26.0 s in-pool, so it breaks the family convention rather than the bar).

### H-06 · 31 bulk-pool files override the unit project's 60 s budget upward – the ceiling `vite.config.ts` says turns a readable timeout into an opaque stall
- Severity: P2
- Category: tests
- Evidence:
  - **The config's own boundary.** `vite.config.ts:375` `testTimeout: 60_000`, with the reason at `:363-367`: «birpc's own RPC window is a hard, unraisable 60s. A per-test budget ABOVE it would convert a slow test from a readable "Test timed out" into an opaque `Timeout calling "onTaskUpdate"` stall».
  - **42 files override it.** `h-bulk-budgets.mjs` (`RAW/H/bulk-budgets.log`): of 348 bulk-pool unit files, 42 declare a per-test budget of 60 s or more. **31 declare more than 60 s**, from 90 s up to 900 s: `wave8-return-ramp.test.ts:511` `timeout: 900_000`; seven files at 300 s (`ad-offer`, `round24-academy-letters`, `round28-sponsor-cut`, `round29-kid-cut-base`, `round29p2-ad-ladder`, `round29p4-ad-portfolio`, `round29p5-business`); eight at 240 s; and more.
  - **It has grown.** 05.09 counted 30 files at 60 s or more (T-05).
- Why it matters: Every one of these overrides re-opens the failure mode the project budget was set to close. A regression that makes such a test slow shows up as a vitest-worker stall with every test green – the signature `scripts/lib/stall.mjs` retries and CLAUDE.md spends a paragraph on – instead of a named test timeout. Most of these tests are nowhere near their budget (`wave8-return-ramp`: slowest test 7.2 s, `RAW/gates/unit-perfile.json`), so the override buys nothing.
- Proposal: Clamp, then guard. Lower each override to at most 60 s: a test that genuinely needs more belongs in the heavy pool (H-05) or needs a cut, and a hook budget stays legal – `beforeAll` is not bound by the window (`round34-reachable-ceiling.test.ts:498-503`). Add a unit test that parses `vi.setConfig({ testTimeout })`, `{ timeout }` and `}, N)` in unit-project files and fails above 60 s for tests. The test sits with the other gate-on-gates tests in `tests/sim-serialisation.test.ts`.
- Blast radius: No house law. 31 files would each change one number (`node …/h-bulk-budgets.mjs`). No test logic moves.
- Effort: S
- Confidence: medium-high. The mechanism is the config's own statement; no incident is tied to one of these 31 files yet.
- Versus 05.09: carried (T-05, the budget half; 30 → 42)
- Verification: CONFIRMED – the probe reproduces 348 bulk-pool files, 42 with budgets of 60 s or more and 31 above 60 s, and no such file's slowest test exceeds 20 s (corrections: one of the 31, round34-reachable-ceiling:505, is a beforeAll budget, so test-level overrides above 60 s are 30, and the "30 → 42" growth compares counts taken under a 20 s and a 60 s default).

### H-07 · Scenario fixtures have no home: `atCollege` is copied eight times identically and `clashWorld` three times with drift – the target shape for lead 1
- Severity: P2
- Category: tests
- Evidence: Normalised-body hashing of each definition (comments stripped, whitespace folded; command in this report's method, output inline):
  - `function atCollege(`: 8 definitions, **1 distinct body**;
  - `function clashWorld(`: 3 definitions, **3 distinct bodies** (`tests/round29-shoot-clash.test.ts:74`, `tests/component/round29-shoot-clash-ui.test.ts:86`, `tests/component/round30-do-both-shoot.test.ts:125`) – the drift the brief's lead 1 records;
  - `function careerAt(`: 29 definitions, 21 distinct;
  - `function walk(`: 69 definitions, **53 distinct** – mostly per-file scenario scripts rather than copies.

  A home exists and works: `tests/helpers/career.ts` has 66 importers, owns `careerSnapshot` and re-exports `tools/_lifeBeats.ts` / `tools/_birthday.ts`. Tests import `tools/` in 49 files; the bench walker `tools/econ-bench.ts` (`openCareer`, `stepCareerWeek`) is shared by 23 test and tool files; `tools/e2e-fixtures.ts:239` `answerOpenQuestions` is a third answering loop. F owns the census.
- Why it matters: An identical copy costs eight edits per change. A drifted copy costs a full gate to find: the 23.09 cancel-share fix re-aimed all three `clashWorld` copies separately, and the third was found only by a full gate. That is the brief's §11 "drifting copies of one fixture".
- Proposal: The target shape. `tests/helpers/` owns the fixtures, and `tools/_*.ts` keeps what the benches and the e2e generator also need:
  - `tests/helpers/career.ts` – the walk façade: `careerSnapshot` plus `walkCareer({ seed, weeks | until, answer })` over the bench's `stepCareerWeek` and one answering policy, and `memoWalk` (H-01's deep-frozen memo) for files that share a walk;
  - `tests/helpers/scenarios/<name>.ts` – one owner per named scenario (`atCollege`, `clashWorld(seed, opts)`). The seed and options stay at the call site, on `career.ts`'s own precedent («THE SEED STAYS AT THE CALL SITE … this module owns the WALK»);
  - per-file `walk` bodies that encode a file-unique scenario stay where they are.

  Migration path, each step proven by a world-hash identity before and after at every call site (`tests/helpers/hash.ts`):
  1. `atCollege` ×8, identical by construction;
  2. `clashWorld`, with an options object covering the three variants;
  3. a written rule beside the parity spec's: a scenario builder written a second time goes to `scenarios/`.
- Blast radius: RNG keys and draws are unchanged as long as each call site's world hash is equal before and after (the identity above). No schema, wording or balance. `git grep -l "function atCollege(" -- tests/ | wc -l` = 8; `… "function clashWorld(" …` = 3.
- Effort: S (steps 1–2), M (the rule and the walk façade)
- Confidence: high on the copies. Medium on how many of the 53 `walk` bodies would fold.
- Versus 05.09: new
- Verification: CONFIRMED – normalised-body hashing reproduces atCollege 8 definitions / 1 body, clashWorld 3 / 3, careerAt 29/21 and walk 69/53 over tests+tools (tests alone: 28/20 and 44/29), and bc29ac13 ('the third sibling the sweep missed') shows the drift cost.

### H-08 · Tests are not discoverable by module: one of about 81 files exercising `lifeBeat` names its path, and 55 % of test files are named after the round that wrote them
- Severity: P2
- Category: tests
- Evidence:
  - **The pin query finds one file.** `world/lifeBeat.ts` owns 110 barrel symbols (`tools/generated/world-symbol-map.md`, section `src/engine/world/lifeBeat.ts`). CLAUDE.md's pin query (`git grep -l "engine/<module>.ts'"`), widened to `world/lifeBeat['"]` and `engineModuleSource('world/lifeBeat'`, finds **1** test file. 81 files import the `engine/world` barrel and name at least one of those 110 symbols (word match, an upper bound).
  - **Naming by round.** Test files named by round, wave or review item: **336 of 607** (55 %; 05.09: 137 of 365, 38 %), from `git ls-files 'tests/*.test.ts' | grep -cE "/(round|wave|r[0-9]|r2-|t[0-9]|p[0-9])"`, the same at `98e3560b`. `round29-*` alone has 28 files.
- Why it matters: To run "the tests for this module", a builder guesses from names that record the incident, not the subject, or pays the 374 s unit gate (D.1) for a one-module change. The barrel (448 test importers) hides the owner from `grep`. The symbol map answers "who owns X"; nothing answers "who tests X". The August review's LOW "round naming hides coverage" has grown, not shrunk.
- Proposal: No renames – they would cost churn and conflicts for no behaviour. Instead, `node scripts/world-map.mjs --tests <module>`: resolve each test file's barrel imports through the map it already builds (AST), print the test files that touch any symbol the module owns, and add direct-path importers and `engineModuleSource` pins. `npm run test:quiet -- $(…)` then runs them. Scripts own it.
- Blast radius: None. No test moves (`git grep -l "world-map" -- tests/ | wc -l` = 1).
- Effort: S–M
- Confidence: high on the gap; the 81 is an upper bound.
- Versus 05.09: carried (the August review's LOW, "review-round file naming hides coverage"), regressed in share
- Verification: PLAUSIBLE – every number reproduces (110 symbols, 81 importers, 1 path hit, 336 of 607 round-named files) and the gap is real and unqueued, but no incident or measurement shows the cost claimed, and the '1 of 81' comparison uses CLAUDE.md's pin query outside its purpose (predicting source-pin breakage, not coverage).

### H-09 · `CLAUDE.md` sits 344 bytes under its hard budget, 59 % of it is incident gotchas, and its Commands block quotes two timings stale by half
- Severity: P2
- Category: docs
- Evidence:
  - **The budget is a hard error.** `scripts/context-audit.mjs:110` `['CLAUDE.md', 22_000]` fails the audit (`:681`). The branch copy is **21,656 bytes** (`wc -c`) – 344 bytes, 1.6 %, of headroom (`03d92221`: 21,331). The budget's own note at `:108-109` reads «leaves ~9% for the invariants to grow into».
  - **Where the bytes are.** By section (awk over `## ` headings): Gotchas 12,808 bytes (59 %, 18 bullets, most carrying a dated incident); invariants 2,852.
  - **Two stale timings in the Commands block.**
    - `CLAUDE.md:12` «`test:sim` (~5 min, serialised)» – measured 7.66 min summed over the 13 files (D.4, D.6).
    - `CLAUDE.md:13` «`test:component` … (~45s)» – measured 67.83 s (D.1; D.6 calls it «stale by half»).
    - `npm test` «~6 min (372s quiet, 02.09)» still holds (374.21 s).
  - Every session loads the file whole: about 5.5k legacy / ≈7.7k harness tokens (`h-comment-tokens.cjs`).
- Why it matters: The next gotcha, at about 500–1,500 bytes, reddens `context:audit` – the first step of `check` and of CI – on a docs change. The document that warns hardest that «a count written in PROSE survives a full gate» carries two of them, in the block an agent reads first.
- Proposal: **Owner decision** on the budget's shape:
  - (a) raise the ceiling – the audit's own design, "turn the next addition into a decision";
  - (b) keep each gotcha as its one-line rule plus a link, with the incident narratives moved verbatim to a `docs/context/` page in the audit's required-file set – about 8–10 KB freed;
  - (c) both.

  Independently, the two timings become either undated-free rules («minutes; run in the background») or dated measurements. A wording change to the rules themselves is his; the numbers are facts. Docs own it.
- Blast radius: No test reads `CLAUDE.md` (`git grep -lE "readFileSync\([^)]*CLAUDE" -- tests/` is empty). No house law.
- Effort: S
- Confidence: high
- Versus 05.09: new
- Verification: PLAUSIBLE – the budget hard-fails and the component timing is stale (67.83 s vs ~45 s), but the audit counts UTF-16 characters, not bytes, so the headroom is 635 characters (2.9 %) on the branch and 958 (4.4 %) at 03d92221, not 344 bytes, and the sim figure is a sum of 13 separate runs, so 'stale by half' is shown only for test:component (Gotchas' 59 % share holds).

### H-19 · `tier-window`'s "too YOUNG still shows" case cannot fail: its fixture restates the pre-16.08 age grid, so the arm it names has been untested for 41 days
- Severity: P2
- Category: tests
- Evidence:
  - **The case.** `tests/tier-window.test.ts:164-172`, «⚠ ...but a rung she is too YOUNG for still shows - a locked rung is aspiration». It builds `feedContext({ ageYears: 14, tierOpen: openMap(['local', 'j30', 'w15']) })` and asserts `feedShows(row('w15', 9), ctx)` with the message «W15 opens at 16 and she is 14» (`:170`).
  - **The premise moved.** `w15.minAgeYears` is 14 (`src/engine/season/calendar.ts:466`), since `3372ec10` (16.08, «W15 opens at fourteen, as the sport's grid says»). The line was written on 12.08 (`6a3b36a5`). At 14, `tierAgeBlock('w15', 14)` is `null`, not `'young'` (`calendar.ts:1668-1673`, `tierAgeBlock`), so the case builds no too-young rung at all. The grid's one prose copy is §0a of [college-is-its-own-branch-2026-08.md](../specs/college-is-its-own-branch-2026-08.md) – the «16» quoted above is the test's stale message, not the grid.
  - **The arm is real and reachable.** `feedContext` keeps a rung unless it is `'old'` (`src/composables/tierState.ts:224`). The engine's `tierOpenFor` also closes only `'old'` (`src/engine/world/ladder.ts:724-727`), so `Snapshot.tierOpen` does carry open rungs she is too young for. That is the aspiration behaviour the 06.08 ladder-floor ruling protects, per the case's own comment (`:165-168`).
  - **Mutation, own worktree, one file.** With `:224` mutated to `=== null`, which hides too-young rungs too, the file stays **29/29 green, `X_EXIT=0`** (`RAW/H/gap-tierwindow-mut.log`). With the fixture age moved to 13, the same mutation goes red on this case (1 failed, `X_EXIT=1`, `gap-tierwindow-mut13.log`), and without the mutation that fixture is green (29/29, `gap-tierwindow-fix13.log`).
  - **Known, not queued.** The 16.08 decision entry lists it as «STILL OUTSTANDING, IN CODE, AND REPORTED RATHER THAN TOUCHED» (`docs/decisions.md:1088-1092`). Lane C's C-02 hands it here. `grep -n "tier-window" docs/now-next-later.md docs/backlog/the-quality-rig.md` finds nothing.
- Why it matters: This is the §11 calibration class exactly – a `tier-window` case that stays green on what it was meant to judge, in the same file as the parity wave's example. A fixture number that restates a table (`14` against `minAgeYears`) rots silently when the table moves, and the test's message then carries the stale rule into every failure report. A regression that dropped too-young rungs from the feed – the empty-weeks regression the 06.08 ruling names – would pass this case. Whether one of the 10 other test files that call `feedContext` or `feedShows` catches that mutation was not run. A grep of them for a too-young assertion aimed at the feed filter (`too young|'young'|aspiration`) finds only the home strip's aspiration chip.
- Proposal: Derive the fixture from the table rather than restating it: `const age = TIERS.w15.minAgeYears - 1` (and `row('w15', …)`), so the case always builds a too-young rung. Add an `expect(tierAgeBlock('w15', age)).toBe('young')` precondition, which makes the case fail loudly if a future grid removes every too-young rung. Re-word the assertion message to state the derived fact. The message is test text, not player wording, so no owner question arises. Tests own it. The general rule, for the parity spec's test half: a fixture that stands in for a table value reads the table.
- Blast radius: No house law – no RNG, schema, wording or balance. One file moves: `git grep -l "tier-window" -- tests/ | wc -l` = 6 (the other five are references in comments); `git grep -l "feedContext" -- tests/ | wc -l` = 9, none of which changes. The mutation table above is the proof arm: red under `=== null` after the fix, green without it.
- Effort: S
- Confidence: high that this case is vacuous (mutation-proven). Medium on whether the arm is unnetted overall – running the same mutation over the 10 other `feedContext`/`feedShows` files would settle that. If all 10 stay green, this is the brief's P1 class ("a guard that passes while the thing it guards is gone").
- Versus 05.09: new (handed over by lane C, C-02)
- Verification: CONFIRMED – calendar.ts:466 sets w15.minAgeYears to 14 (3372ec10, 16.08), so the ageYears-14 fixture at tier-window.test.ts:169-170 never builds a too-young rung, and in the verifier's own worktree the case stayed green under the tierState.ts:224 mutation (29 passed, X_EXIT=0) and went red once the fixture age was 13 (P2 kept: the other 10 feedContext/feedShows files were not run under the mutation, so the P1 upgrade is unproven).

## P3 – polish

| id | title | file:line | one-line proposal |
| --- | --- | --- | --- |
| H-10 | e2e `.tsave` fixtures are binary gzip: 486 blobs, 28.4 MB of pack all-time, 257 blobs / 15.8 MB since 05.09 (44 regeneration commits, 263 file-changes, 19 schema bumps). The JSON golden corpus costs 1.8 MB for 22 blobs (git deltas it) | `e2e/fixtures/*.tsave`; `tools/e2e-fixtures.ts:22-26` | Commit the world JSON plus the manifest and let `e2e/careerAt.ts` encode through the product's own `encodeExportFile` at seed time. The rot alarm is already queued (`the-quality-rig.md` row 4) |
| H-11 | The golden corpus grew 23.7 → 35.7 MB (72 → 91 files) in 22 days, +0.63 MB per bump, in every worktree. Three heavy shards each parse and migrate all 90 fixtures, about 8.7 s each (D.2) | `tests/goldenSavesCorpus.ts`; `tests/goldenSaves{,-quote,-peak}.test.ts` | Measured only – one fixture per version is a ruling. If it ever matters, gzip the working copies behind `load()` |
| H-12 | The save-schema history is hand-written three times: `state.ts:89-958` (870 lines, 97.3 % of the file's tokens are comment), each step in `migrations.ts`, and `tests/fixtures/saves/README.md`'s table – plus `PRE_Vnn` blocks in `coachTravelEdgeFixtures.ts` | `src/engine/world/state.ts:89-958`, `:955-957` («Full move» lists 6 places per bump) | One owner per fact: the README row is the changelog, and `state.ts` keeps the current-version paragraph plus a pointer. H-04 O2's pilot |
| H-13 | `ci.yml` comments carry counts that no longer hold: «233 names», «277 importers», «a 3,600-line file», «all 185 of tools/», «33 named» (now 627 exports, 747 importers, 2,878 lines, 266, 55) | `.github/workflows/ci.yml:88-90`, `:109-110` | Date them or drop the numbers (the T-10 class) |
| H-14 | The three most complex gate scripts have no test: `context-audit.mjs` (899 lines, with the T-03 hash ratchet), `decision-index.mjs`, `tools-registry.mjs` | `scripts/context-audit.mjs`; `git grep -l "scripts/<name>" -- tests e2e` = 0 each | One fixture-directory test each, mutation-verified (the `pin-ratchet` precedent: 5 test references) |
| H-15 | Carried T-08: the six rename-fragile pins 05.09 named are all still present, and `prizeCentsFor` is now pinned twice | `tests/prize-money.test.ts:165`, `tests/ladder.test.ts:182`, `tests/screen-i-live-match.test.ts:277`, `tests/round13-nav.test.ts:516`, `tests/sim-serialisation.test.ts:138`, `tests/round11-view.test.ts:92`, `tests/world-trio.test.ts:361` | Re-aim on touch, as 05.09 proposed |
| H-16 | Carried T-12: strictness still stops at `strict` plus the unused checks | `tsconfig.app.json:10-14` | `noImplicitOverride` is free; trial `noUncheckedIndexedAccess` on `tsconfig.tools.json` first |
| H-17 | Archival tools (lead 10) – `check:tools` is 2.9 s of 458 s (D.1). Rot repairs on dormant tools since 05.09: 2 commits, 3 tools (`c0cd147d`, `d5901538`). Of the 211, 87 were never edited after creation and 114 were last touched before 05.09. 199 are cited by path from 689 files | `tsconfig.tools.json:29`; `tools/README.md` §Archival | Owner option: freeze dormant archival tools at their SHA – exclude them from `check:tools` by a registry-generated list, no move, no link breaks – so a repair never silently changes what a quoted probe measured |
| H-18 | `npm run check`'s `&&` chain lets a docs-registry red (steps 5–7) hide the typecheck, unit and build verdicts | `package.json:11` | Run steps 1–7 as one "report all, fail at end" node step, then the chain (see H-02) |
| H-20 | The `pins:check` ratchet, assessed: effective and cheap, but local-only, and its declared blind spot has doubled. Over 1,036 commits it went red once – a 6-commit episode on 05.09 that the T-02 test introduced when it illustrated the raw form, cleared by `8d817d70` the same day (`h-registry-replay.sh`, `pr=` column). Its baseline has never been widened since it was created (`git log -- tools/generated/source-pin-baseline.json`: 2 commits, both 24.08). The unratcheted ordering family (`expect(a.indexOf(X)).toBeLessThan(a.indexOf(Y))`) grew from 9 to 20 lines. 14 of the 20 are array lookups (`STOP_PRECEDENCE`, `ADVANCE_REFUSALS`, `stops`), 2 are comments, and 1 is the helpers test's deliberate illustration (`tests/helpers.test.ts:90`). The last 3 read rendered DOM labels. `match-viewer.test.ts:978` has both operands asserted present (`:976-977`), and `round46-the-reckoning.test.ts:158` fails on an absent right operand. `:157` passes vacuously if «Still owned» is absent, but its fixture carries holdings, so it passes today for the right reason. `ci.yml` does not run it (H-02 b) | `scripts/pin-ratchet.mjs:20-26`; `tests/component/round46-the-reckoning.test.ts:157` | Keep it; add it to `ci.yml` (H-02 b). When an ordering assertion reads a rendered list, pair it with a presence assertion on both operands in the same test. That rule is one line in the helpers' header – no new gate |

## Delta versus 05.09

Every finding of `docs/review-principles-2026-09-05/06-tests-tooling.md`:

| ID | title | status | evidence |
| --- | --- | --- | --- |
| T-01 | `worldFunction` returns `''` on an absent function | fixed | `c5cc4083`; `tests/worldSource.ts:181-192` throws `absentFunction` three ways; `tests/round23-retirement-news.test.ts:202-209` re-aimed; `tests/relative-age.test.ts` folded onto the helper |
| T-02 | Marker helpers' throw-on-absent untested | fixed | `0ab787b0`, `8d817d70`; `tests/helpers.test.ts:59-146` (every helper `toThrow`, plus the positive arm) |
| T-03 | Edited-document ratchet inspects membership only | fixed | `3444a484`; `scripts/context-audit.mjs:57-66`, `:302-304`, `:590-591`; audit prints «0 grandfathered docs edited without classifying (136 of 136 hashed)» (`RAW/gates/c01-context-audit.log`) |
| T-04 | `BirthdayDialog` / `KnockDialog` lack the 375x667 dismiss assertion | fixed | `f768d816`; `tests/component/birthday-dialog.test.ts` and `round43-knock-why.test.ts` mount the dialog and call `assertDismissReachable` / `measureDialog` |
| T-05 | Budget by structure: bulk budgets, lazy caches, one wall-clock assertion | partially fixed → carried as H-05 / H-06 | caches moved under hooks (`tests/college-league.test.ts:150-160`), goldenSaves split per fixture (`02b82a5d`); bulk budgets of 60 s or more grew 30 → 42, of which 31 are over 60 s (`h-bulk-budgets.mjs`) |
| T-06 | CI typechecks twice; verbose shards | fixed | `c89bd69b`; `ci.yml:133-144` `npx vite build`; `deploy.yml:113-116`; `--verbose` dropped (`ci.yml:166`, `deploy.yml:69`) |
| T-07 | `pin-hygiene` blind to derived bindings | fixed | `bb19326f` («pin hygiene follows one level of local helper»); `tests/pin-hygiene.test.ts` (16 `widen` references) |
| T-08 | Source pins remain a second test language | still open, shrinking | pin-carrying 86 of 607 files (2,253 it-blocks) against mounted 215 files (2,198) (`h-pin-census.mjs`); 05.09: 80 of 365 and 1,876 against 1,335. The four negative-only pins fixed (`60351ba1`); the six rename-fragile pins remain (H-15) |
| T-09 | Real-browser a11y presence-only | fixed | `70788b49`; `e2e/a11y.spec.ts` (22 tests, D.5) plus `e2e/axe.ts` |
| T-10 | Stale prose inside gates | fixed for its three sites; new instances → H-13 | `scripts/tools-registry.mjs:238-243`; `.gitlab-ci.yml:1-2` («a PARTIAL mirror»); `ci.yml:230` dated |
| T-11 | Script and dependency hygiene | fixed | `package.json` `engines: {node: ">=22"}`, `.nvmrc` = 22, `test:sim:quiet` gone, `tools/precache-delta.mjs:61-66` imports `@playwright/test` |
| T-12 | Strictness stops at `strict` | still open | `tsconfig.app.json:10-14` unchanged (H-16) |
| T-13 | No ESLint / Prettier, no tool recommended | still open by decision | no config in the tree; correctness-only ESLint queued "Later" (`docs/backlog/the-quality-rig.md` row 7) |

The 05.09 lane cited the 02.09 items too: QA-35 is closed by T-03, and QA-40 by T-06.

## The August review – `docs/review/07-testing-tooling.md`

| finding (August) | status | evidence |
| --- | --- | --- |
| [HIGH] `test:sim` exits 1 with every test green | fixed as a defect; the birpc stall is carried by a retry classifier | `scripts/sim.mjs` runs one file at a time, `--no-file-parallelism` (`tests/sim-serialisation.test.ts:93-140`); CLAUDE.md «exits 0 on green since the P6 wave»; all 13 sim files exited 0 at the first attempt (D.4) |
| [HIGH] No Vue component is ever mounted | fixed | 221 component files, 2,390 tests (D.3); 215 files mount (`h-pin-census.mjs`) |
| [MEDIUM] Source-pin brittleness | partially fixed | see T-08 / H-15 |
| [MEDIUM] No linter or formatter | open by decision | queued (quality rig row 7) |
| [MEDIUM] No coverage measurement | open, queued | quality rig row 7 («no coverage report») |
| [MEDIUM] Pre-merge calibration is convention-only | superseded by ruling | CLAUDE.md «The simulation suite's standing regime (owner's final ruling, 22.08)» – local `test:sim` on every PR assembly, weekly cron |
| [MEDIUM] Unit gate drifting toward the contention cliff; add a wall-time meta-test | partially – `HEAVY_UNIT_FILES` exists, the meta-test was never built | H-05 |
| [LOW] Migration hop tests uneven v13–v32 | still open, shape unchanged (re-measured by proxy, gap-fill) | `tests/migrations.test.ts` names every version v0–v12 (3–15 word mentions each) and v33–v34 (3 and 10). Of v13–v32 it names only v22 (3), v25 (2) and v27 (1) (`git grep -cw "v<n>" 03d92221 -- tests/migrations.test.ts`, `RAW/H/hops-v0-34.txt`). Every hop still runs through the corpus, one fixture per version (`tests/fixtures/saves/v0…v89.json`, 90 fixtures), and later per-version sweeps assert per-hop facts (`goldenSaves-quote.test.ts` v61, `-peak.test.ts` v62). The August fix – one semantic assertion per subtle backfill (v25, v28), audited once against the README table – was not done. That remains a word-match proxy, not a read of each hop's assertions; low cost, carried as August's LOW and not re-ranked |
| [LOW] Review-round file naming hides coverage | regressed in share | 38 % → 55 % of test files (H-08) |
| [LOW] Small-sample bench numbers quoted without bounds | still open (gap-fill: the tool's code is in scope per §10, its numbers are not) | `tools/knock-rate.ts:8` still records «8 careers x 3 seasons» and `:17-18` the 0.33 / 0.63 figures with no dispersion. `SEASONS = 3`, `CAREERS = 8` (`:25-26`); `grep -ciE "wilson\|confidence\|stderr\|interval\|±"` finds 0. It was last touched in `3422f77c`. Whether any spec still quotes those digits as fact is balance territory, which the benches own (§10), and lane C did not take it (see Not reviewed) |

## Seed leads

- **Lead 1 – helper sprawl, the architecture side: confirmed → H-07.** The copies that matter are the exact ones (`atCollege` 8 identical) and the drifted scenario ones (`clashWorld` 3 bodies). The 69 `walk` definitions have 53 distinct bodies – mostly file-unique scenario scripts, not a single missing helper. The target shape and the hash-identity migration path are in H-07; F owns the census.
- **Lead 10 – `check:tools` over 211 archival scripts: refuted as a time cost, partially confirmed as an evidence-integrity question → H-17 (P3).**
  - Time: 2.9 s of a 458 s `check` (D.1).
  - Rot: the true "keep dormant evidence compiling" repairs since 05.09 are 2 commits over 3 tools (`c0cd147d`, `d5901538`, after the parity wave removed a parameter). The other compile repairs (`52c9ab78`, `0499b4df`, `f4e17abd`, `800277c4`, `76a3ec8d`, `9018cc96`) were on tools written the same day – the gate doing its job. Three of them are one fix made three times in parallel on 07.09, and the same two tools produced 3 of the 23 file-level conflict events.
  - Moving the archive would break 689 path references from docs, so any policy must exclude by list, not by directory.

  Options, priced: (a) status quo, 2.9 s plus about one dormant repair a fortnight; (b) freeze dormant tools at their SHA and exclude them by a registry-generated list, S – a repair can then never silently change what a quoted probe measured; (c) typecheck archival tools weekly in `simulation.yml`, S – rot found on Mondays with no owner; (d) delete them, trivial – they lose `grep`-ability, and 689 links rot. Owner's call.
- **Lead 11 – shared serialised fixtures against per-file re-walks, the design side: confirmed → H-01, with this design verdict.** Four shapes, with their risks:
  - (a) **A per-process in-memory memo, deep-frozen** – nothing can go stale (built from HEAD in the same process); determinism is trivial (same code, same call); a mutation throws. Proven on `-mid-schemas` (H-01). **Recommended first.**
  - (b) **A per-run cross-file cache** – vitest `globalSetup` with `provide`/`inject`, built once per run from HEAD. Nothing can go stale. ⚠ The risk is the serialisation boundary: a JSON round-trip drops `undefined`-valued keys, and tests assert key PRESENCE (`tests/coachTravelEdgeFixtures.ts:5457` `'masseurReturnDue' in world`). Any such cache must deserialise through the product load path (`decompressWorld` → `migrateSave` → `refreshDerivedRankCaches`, as the worker's `ensureMainState`), or tests run on a world the worker never holds. That is the §11 class "a boundary only the real runtime reaches", pointing the other way. The worked candidate is the college component family (10 files, 60.7 s, about 114 ticks each, D.3).
  - (c) **Committed serialised fixtures** – **rejected for unit tests** on measurement. The e2e corpus needed 44 regenerations and 263 file-changes in 22 days (15.8 MB of pack, H-10). A committed world made by an older engine is a state the current engine may not produce, which is the "test propping up what it checks" class.
  - (d) **An on-disk cache keyed by a hash of `src/engine`** – nothing can go stale if the key covers every engine file. It pays off only on repeated runs of one tree, since most commits touch the engine. M effort; not worth it before (a) and (b).

## Not reviewed

- Timings of any kind: lane G, per the Phase 1 rule. Every minute here is Phase 0's.
- The jscpd census of `tests/` and `tools/`: lane F. H-07 uses a normalised-body hash only for the named helpers.
- The CONTENT of e2e specs and of the sim benches' statistics (lanes C and E); the correctness of bench code (C).
- Doc accuracy beyond the generated registries, `CLAUDE.md` and the gate comments: the 465-document corpus was measured, not read (354 → 465 files and 8.06 → 11.97 MB since 05.09, from `git ls-tree -r -l`).
- GitLab CI (not pushed to, by ruling), and the graphify graph (`graph:check` is outside `check`).
- ~~A per-commit red-rate replay for the world map and the tools registry~~ – done in the gap-fill (H-02's table). `git archive` of the inputs per commit was enough; no worktree was needed.
- **Whether the `tier-window` too-young mutation is caught by another file** – only the one file was run, under the one-targeted-file rule (H-19 names the 10 files that would settle it).

**For the synthesis's "Not reviewed": August items that no lane statused** (the completeness critic's list). Each is given the §10 reason where one applies, and a one-command status where one was cheap to get:
- **August `03-game-design-mechanics.md` and `04-concept-plot-narrative.md`: not reviewed by any lane.** Lane A treats 02–07 as the other lanes', and no lane map entry names 03 or 04. The reason is §10: 03 is game design and balance (the benches own the numbers), and 04 is concept, plot and narrative, which is player-facing wording – the owner's (CLAUDE.md invariant 4). Neither is a principles question; a builder should not act on either without his ruling.
- **August `02-code-quality.md`'s non-duplication items, not in this lane's scope** (the css item is lane E's, the exports lane A's or B's). They were statused here by grep only, so the synthesis need not leave them silent:
  - *[LOW] css-dry-audit doc drift* – **still open.** `docs/specs/css-dry-audit.md:218-219` still says the ring track resolved to 0.18, while `src/style.css:486` is `--ring-track: rgba(255, 255, 255, 0.12)`. The spec's opening premise (`:3`, «not one» `<style>` block elsewhere) still stands against the scoped-CSS estate.
  - *[LOW] dead / needlessly-public exports* – `kidDomesticPoints` **is no longer dead**: `src/engine/world/ladder.ts:247` calls it for `peakDomesticPoints`. It is still re-exported through the barrel (`src/engine/world.ts:386-387`) with no importer outside `ladder.ts` (`git grep -nw kidDomesticPoints -- src tests tools`; the `tools/domestic-ladder-probe.ts` hits are a field name). The radar constants are **still open and grown**: 16 of `src/engine/radar.ts`'s 26 exported upper-case constants have no reference outside the file (`EVIDENCE_PER_UNIT`, `TENURE_HALF_WEEKS` among them). August counted 13. The command: for each `export const [A-Z_]+` in `radar.ts`, `git grep -lw <name> -- src tests tools e2e` minus `radar.ts`.
