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

## Graphify (code graph) — what it is and is not for

```bash
npm run graph        # rebuild — ~18 s, zero model tokens, 7,750 nodes / 20,244 edges
npm run graph:check  # is it stale? exits 1 if source moved since the build
```

**Setup (once per machine, not a project dependency):** `pip install graphifyy && graphify install
--platform claude`. The installer makes its own ~161 MB venv under `~/.claude/skills/graphify` and
symlinks the binary onto PATH — far too large to vendor, so nothing is added to `package.json`.
`npm run graph` prints these instructions if it cannot find the binary; `GRAPHIFY_BIN` overrides.
`graphify-out/` is gitignored — a local artifact, rebuilt in seconds, never committed.

**A stale graph is worse than no graph.** Run `npm run graph:check` before reasoning from it —
though the rebuild is now automatic: `.githooks/post-merge` and `post-checkout` fire it in the
background after every pull, merge and branch switch, and `npm install` points git at them through
the `prepare` script. Both hooks exit silently when the graphify binary is absent, so a machine
that never installed it sees nothing.

**⚠ CODE ONLY. Never point it at `docs/`.** `npm run graph` indexes `src`/`tests`/`tools`/`scripts`
through tree-sitter — pure AST, genuinely zero model tokens. **Documents and images take a different
path**: they go through semantic extraction, and with no external key configured the skill's own text
says *"the host agent itself is the LLM"* — meaning the agent session pays in tokens. This repo's
docs corpus is large (onsight-poc measured 174 docs ≈ 285k input tokens for a comparable set), so an
accidental `/graphify` over `docs/` is an expensive mistake, not a free one. If document indexing is
ever wanted, wire a local Ollama backend first and the cost returns to machine time.

**Use it for orientation:** `god-nodes` (ranks architectural hubs — it independently reproduced the
P4 analysis, putting `tickWeek` at 177 edges and `createWorld` at 166), `path "A" "B"`, `explain "X"`.
Neither is expressible as a grep.

**Do NOT use `affected` as a pre-split impact check.** Benchmarked against the 14 real breakages of
the `world.ts` split it scored **26% precision and missed one**, because it sees imports — and the
imports are exactly what survives a re-exported move. Use the grep below instead: **100% recall.**

**Do NOT trust `graphify query` in natural language.** Measured on this corpus it is lexically noisy:
"where is the injury risk calculated" returned eight nodes from a funding-roadmap doc (matched on
"risk") and none of `rollInjury` / `injuryTau`. Look symbols up by name instead — that is precise.

**⚠ When the graph and grep disagree, check the grep first.** In both recorded disputes — one here,
one in onsight-poc — the graph was right and the search was broken (a `grep` scoped to `src/` that
skipped `tests/`; a `sed` range that collapsed on its start line). Same failure family as the `indexOf`
slice returning −1. Verify scope, range arithmetic and anchoring before filing a graph bug.

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
- Some tests are **source-pin tests**: they read engine source text and assert on structure. When moving code, read it through `tests/worldSource.ts` (`worldSource()`, `diarySource()`, or `engineModuleSource(name)` for any decomposed module) rather than pinning a path. A slice between two markers whose end marker moved returns `-1` and silently swallows the rest of the file.
- **Component pins ask two different questions, and the helpers are named for them.** `componentLogic(path)` = the SFC **plus every composable it imports** — for POSITIVE claims ("this logic exists somewhere in the component"), and it survives extraction. `componentFile(path)` = the `.vue` **alone** — the only honest source for a NEGATIVE claim about that file ("imports no setter"). Widening a negative assertion makes it over-strict: it trips on a symbol *defined* in a composable it was never talking about. `tests/pin-hygiene.test.ts` enforces this mechanically and is mutation-verified; use one name per source kind per file (`viewer` / `viewerFile`), since the check is file-scoped.
- **Before moving anything out of a module, run the pin query first:**
  ```bash
  git grep -l "engine/<module>.ts'" -- tests/
  ```
  Every hit is a pin that will break, and each one needs repointing at the source helper. Measured against the `world.ts` and `diary.ts` splits, this predicted **17 of 17 real breakages (100% recall, 81% precision)** – the four false positives cost seconds to dismiss. Those 20 break events were originally found reactively, one failing test run at a time, purely because nobody ran this query first. See `docs/research/graph-tooling-benchmark.md`.
- **Never gate while agents are working, and never read an exit code through a pipe.** Two measured
  hazards, both of which have already produced a false verdict here. (a) CONTENTION: with three
  agents active this machine reached load 69 / 33 node processes, and a full `npm run check` came
  back with three RED files — all of them timeouts (20 s, 240 s, 20 s), zero assertion failures, in
  files the branch had not touched. The same contention turned a 3-minute sim run into 90 and a
  3-second performance assertion into 16. Verify branches AFTER the agents finish, one at a time.
  (b) THE PIPE: `npm run check 2>&1 | tail` reports **tail's** exit status, so a run with real
  `vue-tsc` errors "passes". Redirect to a file and echo `$?` from the command itself, never from a
  pipeline.
- **⚠⚠ BEFORE YOU HUNT A SLOWDOWN, REPRODUCE IT ON A COMMIT THAT CANNOT HAVE IT.** Same command,
  older code, in a worktree. It is one run and it ends the argument; skipping it cost most of 16.08.
  Twice that day a red `npm run check` — sixteen files timing out, **zero assertion failures** — was
  diagnosed as a regression in the wave, and twice it was the machine (`mobileassetd` at 143 % for
  three hours, load 113; later `signpost_reporter` at 96 %, 7.8 M pageouts). The tell that should
  have stopped it sooner: **the failing set CHANGED between runs** — 18 files, then 9, then 12
  different ones — and a real defect fails the same test twice. When the control finally ran, the
  pre-wave commit wedged identically at 1871 s against its own green 76 s an hour earlier, and its
  `collect` alone burned 3636 s of CPU **before any test logic**. Two cheap confirmations to run
  first, in this order: `--no-file-parallelism` (if the whole shard then passes in ~250 s the WORK is
  fine and the pool is the problem), and the same shard on the last known-green commit.
- **`git checkout <sha> -- <path>` is the concurrent-agent hazard pointing the other way.** The note
  above about `git commit` taking the whole index has a mirror: an agent bisecting a hash divergence
  reverted `src` under another agent's live edits on 16.08. Nothing was lost — the pathspec habit
  saved it — but in a shared checkout a checkout-with-pathspec is as destructive as a commit-without.
- **A POPUP MUST BE MEASURED AGAINST A PHONE BEFORE IT SHIPS, and "it reads well" is not that
  measurement.** Round-20 #3: `TourBriefingDialog` shipped with a lead, a requirements list, five
  cost bullets and a closing line on the shared `dialog-card`, which declares no `max-height` and no
  `overflow`. On a 375x667 viewport the dismiss control left the screen – and it is a BLOCKING
  overlay, so the owner's career stopped there and could not be resumed. It HAD a mounted test, and
  the test measured contrast through the real cascade, once-ness, and that the numbers came from
  `ECONOMY` rather than the template: **every check was about what the card SAYS, none about what
  the screen can HOLD.** The failure mode is slow – a dialog grows by one honest sentence at a time
  and nothing objects until it is taller than a phone. **So any dialog you add or lengthen gets a
  mounted assertion that its dismiss control's box is inside a 375x667 viewport**, and prove it by
  mutating: a test that cannot fail on the too-tall version is not this test.
- **With concurrent agents in ONE checkout, `git commit` takes the whole INDEX, not your files.**
  `git add a.ts b.ts && git commit -m …` looks like it commits two files; it commits everything
  anybody has staged. Measured here on 13.08: a two-file ledger commit swallowed another agent's
  finished UI slice – four files, 531 lines – under a message about something else. Nothing was
  lost, but the commit lied about itself, which is worse than a conflict because it survives review.
  **Use the pathspec form: `git commit -m … -- a.ts b.ts`.** It commits exactly those paths and
  leaves everyone else's staging alone. Telling agents "stage only your own hunks" does not help –
  the hazard runs the other way, from whoever commits next.
- **Background runs leave chips, and the chips accumulate.** Every `run_in_background` command
  registers a task that stays listed in the owner's panel after it exits – he has raised the count
  twice ("почему их уже 20?", "их снова 18 штук"). Backgrounding is still mandatory for anything
  minutes-long (a silent foreground wait has killed six agents here), but it is NOT for short
  commands: background a run only when it is expected to take **over ~2 minutes**, and never leave a
  superseded run alive next to its replacement. After a wave, `git worktree remove` the agents'
  worktrees and check `pgrep -lf "vite-node|vitest"` is empty – a finished chip costs nothing, but an
  orphaned bench holds a core.
- **A backgrounded command starts in the SESSION's cwd, not yours.** The shell's directory persists
  between foreground calls, so `npm run check` works – and the same line sent with
  `run_in_background` lands in the parent directory and dies with `ENOENT … Claude/package.json`,
  exit 254. Hit three times on 13.08 alone, each costing a gate run. **Put `cd <repo> &&` inside
  every backgrounded command**, however recently a foreground call cd'd there.
- The sim project MUST run serialised: every script that touches it carries `--no-file-parallelism` (birpc has a hard-coded 60s RPC timeout that a minutes-long synchronous Monte-Carlo file will blow past, exiting 1 with every test green). If you add a script that runs the sim project, carry the flag.
- The `▶▶ 52 (dev)` button in More ships in EVERY build – an owner ruling (the deployed build is the playtest device), not a regression. Its unsafe half is fixed: the worker's `tick` handler now enforces the same open-knock / unrevealed-tournament guards as `advanceWeeks`, refusing at entry and stopping mid-loop. `tests/dev-fast-forward.test.ts` pins both halves.
