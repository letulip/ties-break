# Ties Break: Ace Parent

PWA tennis career sim where you play the **parent** raising a future star (WTA-first). Vue 3 + Pinia + TS + Vite. Deterministic engine in a Web Worker, IndexedDB saves, offline-first. Source-available, commercial.

## Commands

```bash
npm run check      # doc gates + registry + typecheck + check:tools + tests + build — the pre-push gate
npm run check:tools # typechecks ALL of tools/, archival probes too – in `check` since 02.09
npm run test:quiet # unit project, dot reporter — PREFER THIS: 5.6k chars of output vs 29k
npm test           # unit project, full reporter – ~6 min (372s quiet, 02.09)
npm run test:sim   # sim project (~5 min, serialised) — exits 0 on green since the P6 wave
npm run test:component # mounted Vue components (~45s) — the only real UI regression gate
npm run build      # vue-tsc -b && vite build
```

Use `test:quiet` unless you need to read individual test names — same signal, ~6k fewer tokens per run.

Benches live in `tools/` (`bench:econ`, `bench:fatigue`, `bench:knock`, `bench:load`, `bench:radar`). Always `vue-tsc -b --force`: the incremental cache has hidden real type errors before.

## Graphify (code graph)

`npm run graph` rebuilds the code graph (~10 s, 0 tokens); `npm run graph:check` exits 1 if it is
stale. **A stale graph is worse than no graph**, and ⚠ **CODE ONLY – never point it at `docs/`**,
where indexing costs model tokens rather than machine time. Use it for orientation (`god-nodes`,
`path`, `explain`), not for impact analysis, and when it disagrees with a grep check the grep first.
Setup, the benchmarks behind each of those rules, and the measured failure modes:
[docs/context/graphify.md](docs/context/graphify.md).


## Token discipline

[docs/context/token-discipline.md](docs/context/token-discipline.md) binds dispatch (29.09): model+effort per step, §2 in briefs, sequential agents, gates outside, handoffs.

## Non-negotiable invariants

**1. The engine never imports the UI.** Zero imports of Vue/Pinia/components anywhere in `src/engine`, `src/worker`, `src/db`, `src/shared`. The worker owns the world; the UI only ever sees `Snapshot`. Every command is re-validated engine-side, so a stale screen cannot corrupt a career.

**2. RNG discipline.** The MAIN stream's position is **persisted per career** since v35 (`rngMain: {s, n}`); a load resumes, it does not replay. Two rules follow:
- **Input-independence is permanent law.** A no-action run and an action-laden run under the same code must tap identical MAIN sequences. Player choices may never re-roll the world's dice. This is a fairness property.
- New randomness goes through a **purpose-scoped sub-stream** (`rngFromSeed(\`${seed}:thing:${week}\`)`), never MAIN. Sub-streams are re-derived at the call site and persist nothing.
- The frozen capture (41550 draws / hash `e6b0c709`, pinned in `tests/condition.test.ts`) is a **documented measurement, not a change-gate** since v35. A wave that legitimately adds a MAIN draw updates the pin.
- Never use `Math.random()` or bare `new Date()` in engine code.

**3. Save schema changes are a three-part move.** Bump `SAVE_SCHEMA_VERSION`, add an **append-only** migration in `engine/migrations.ts`, add a golden fixture in `tests/fixtures/saves/`. `tests/goldenSaves.test.ts` enforces one fixture per version. Migrations are append-only: never edit a shipped one.

**4. ⚠⚠ USER-FACING WORDING IS NOT AN AGENT'S TO CHANGE** (owner, 30.08: «Я это не просил. Верни как было пожалуйста и **запрети на уровне документации и спек агентам самовольно изменять вординг**»). A label, tab, button or sentence on screen may only change when the task ASKED for it. Fixing something adjacent is not permission: round 29 renamed the Family-budget tab `This season` → `So far` while solving a different complaint about two screens meaning different seasons, and the owner found the rename in play and had not asked for it.

- If a fix seems to *require* a wording change, say so and ask – the copy is his, and the ask costs a sentence.
- This binds agents and me equally, and it holds while «fixing» a string that looks wrong: **looks wrong to us is not the same as wrong to him.**
- ⭐ The corollary that makes it cheap to obey: a string you did not touch cannot regress, and a wording change is the one kind of diff no test catches — the pins assert what the string IS, so they move with it and stay green.

**5. Tuning is measured, not guessed.** Balance changes ship with a bench run and a spec in `docs/specs/` recording predicted vs measured. `docs/specs/rank-plateau.md` is the model: predict a fix, measure it doing nothing, find the real cause.

## The simulation suite's standing regime (owner's final ruling, 22.08 – do not revisit)

`test:sim` NEVER runs in front of a pull request: tried for a day and measured out (20+ min on
2 cores against ~5.5 min locally, red by timeout). What stands – weekly cron + on-demand in
`.github/workflows/simulation.yml`, whose four jobs file a `sim-health` Issue on any red; and the
working rule, UPGRADED 22.08 at the owner's ask: **every PR assembly runs `npm run test:sim`
locally, unconditionally**, since the August drift came from commits that did not LOOK like model
changes. The `pull-request` skill runs it as a fixed step and the PR body carries the verdict.

`npm run test:sim -- <file>` runs one file. **⚠ The birpc stall is NOT fixed** – 45 s here, 90 s on
the runner, 60 s ceiling – so sim.mjs's retry classifier carries it, and the Issue step 403'd
unnoticed 17.08–07.09.

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

`world.ts` **is decomposed** – P4 finished 28.09 (`docs/review/proposals/P4-world-decomposition.md`). It holds **0 function bodies** (`tests/principles-a04-barrel-no-bodies.test.ts`) and a **frozen** name surface (`tests/principles-a03-barrel-surface.test.ts`, which carries the numbers and names the census). Rules:
- ⚠ It is a **frozen public surface**, not «compatibility under historical names» – A-03 measured that sentence stale. A symbol born in `world/*` is imported **from its owning module**; the barrel carries only frozen names, so a new re-export line is a decision the pin makes you take.
- `WorldState` comes as **`import type` from `./state`**, the module that declares it – not from `../world`. ⚠ A **ratchet, not a sweep**: `tests/principles-a03-type-import-ratchet.test.ts` grandfathers the files that predate the rule, fails a **new** one, and refuses a **value** import of the barrel from inside the package with no grandfather.
- `world.ts` re-exports the values – **hundreds of files** import from `engine/world`. ⚠ **Count it, do not quote it**: three "essentially right" numbers circulated in one day, which is how a stale one survives. And ⚠ **a count written in PROSE survives a full gate** (wave 9: docs said 32, the corpus held 28) – a self-stated number needs a pin against the thing (`tests/wave9-strings-roundtrip.test.ts`).
  ```bash
  git grep -lE "from '[^']*/world'" -- src tests tools scripts e2e | wc -l   # the importers
  node scripts/world-map.mjs <symbol>                                        # which module owns it
  ```
- If a candidate block calls back into `world.ts` at runtime, it is **not** ready to move — that needs dependency inversion, not a span-move.

**A new beat kind is a new module** (A-06, 28.09) – `world/lifeBeat.ts` reached 8,003 lines in 17 days before anything stopped it. The **direction** is the rule; `tests/principles-a06-life-beat-direction.test.ts` judges it and carries the measurements:
- A kind's **copy** is a leaf the hub imports (`lifeBeat/<kind>Copy.ts`); its **hazard** imports the hub (`lifeBeat/<kind>.ts`). ⚠ **Never one file with both halves** – that module would be imported by the hub and import it back, and `tests/import-cycles.test.ts` refuses the cycle. A hazard's names are re-exported by **`world.ts` directly from the kind module**, never through the hub, for the same reason.
- The hub keeps the queue, the fork want, the presence law, raising and answering, prompt assembly, and any section another section references. **Zero inbound references inside the file** is what makes a section movable. The package is **flat**; chronicles leave under W7's rules, never in a split's own commit.

## Style

- **Boring TypeScript**: strict mode, no generic gymnastics, no enums, no decorators. Types document the save schema and engine parameters.
- Comments explain **why**, not what — this codebase deliberately records owner rulings and the reasoning behind non-obvious choices. Preserve them verbatim when moving code.
- In prose and UI copy use the short dash `–`, never the long em-dash.
- Money is in **cents** everywhere in the engine. Formatting helpers take cents; check the unit before calling.
- Tournament and organisation names are **fictional** (ITF/WTA/ATP are trademarks). Real player surnames must not be constructible.

## Gotchas

- **Prefer a mounted test to a source pin.** `tests/component/` mounts real components (vitest project `component`, happy-dom). Source pins break on contact with a refactor and prove nothing about behaviour; MatchViewer and SeasonScreen now have mutation-verified nets there, which is what makes them safe to split. Mutate the thing you think you are covering and watch it fail before you believe a green run.
- **A screen that restates an engine verdict is the parity class** – the screen holds a predicate the engine does not (three defects in round 29 alone). Call the engine's own primitive, or pair a mounted test over one snapshot with its mutation table: [engine-ui-parity-2026-09.md](docs/specs/engine-ui-parity-2026-09.md).
- Some tests are **source-pin tests**: they read engine source text and assert on structure. When moving code, read it through `tests/worldSource.ts` (`worldSource()`, `diarySource()`, or `engineModuleSource(name)` for any decomposed module) rather than pinning a path.
- **⚠ CUT EVERY SOURCE REGION WITH THE MARKER HELPERS, NEVER WITH A RAW `indexOf`.** `tests/helpers/source.ts` exports `region` / `regionToLast` / `regions` / `after` / `before` / `at` / `lastAt` / `lineAt`, and every one THROWS on an absent marker. The raw form does not: `indexOf` returns `-1`, `slice(start, -1)` runs to the end, and the region silently WIDENS to almost the whole file while the pin stays green. Of the 176 raw slices migrated on 24.08, **two had been lying** – one "six parts of the hero" pin was reading 59,944 of HomeScreen.vue's 126,815 characters. `npm run pins:check` is the one-way ratchet against a new one.
- **Component pins ask two questions and the helpers are named for them.** `componentLogic(path)` = the SFC **plus every composable it imports** — for POSITIVE claims, and it survives extraction (⚠ it does **not** follow a child `.vue`, so a claim about which file carries a CSS declaration is a claim about the **path**). `componentFile(path)` = the `.vue` **alone** — the only honest source for a NEGATIVE claim. Widening a negative makes it over-strict: it trips on a symbol *defined* in a composable it was never talking about. `tests/pin-hygiene.test.ts` enforces this, file-scoped, so use one name per source kind per file (`viewer` / `viewerFile`).
- **Before moving anything out of a module, run the pin query first:**
  ```bash
  git grep -l "engine/<module>.ts'" -- tests/
  ```
  Every hit is a pin that will break, and each one needs repointing at the source helper. Measured against the `world.ts` and `diary.ts` splits, this predicted **17 of 17 real breakages (100% recall, 81% precision)** – the four false positives cost seconds to dismiss. Those 20 break events were originally found reactively, one failing test run at a time, purely because nobody ran this query first. See `docs/research/graph-tooling-benchmark.md`.

  ⚠ **Run a second spelling too** (28.09, after its first false negative – it matches a path *string*, so a pin that ASSEMBLES its path is invisible):
  ```bash
  git grep -ln "'<module>.ts'" -- tests/ tools/ e2e/
  ```
  For a `.vue` extraction a **class-name grep** is a third command: without it recall was 3 of 6. ⚠ Neither spelling finds a pin that **quotes** an import line as data (0 of 3, measured), and **no grep can enumerate a reader's SCOPE** – a split breaks pins by widening what a source reader sweeps. Row 30 of `docs/backlog/the-quality-rig.md` has all five blind spots and why they cannot merge.
- **Never gate while agents are working, and never read an exit code through a pipe.** Five ways this
  has produced a false verdict here, each measured; the incidents are in
  [the-quality-rig.md](docs/backlog/the-quality-rig.md).
  (a) CONTENTION: three live agents put this machine at load 69 and `npm run check` came back with
  three RED files — all timeouts, **zero assertion failures**, in files the branch had not touched.
  Gate AFTER the agents finish, one run at a time.
  (b) THE PIPE: `npm run check 2>&1 | tail` reports **tail's** status, so a run with real errors "passes".
  (c) THE BACKGROUND WRAPPER'S "exit code 0" is the same lie wearing a harness — it is the wrapper's
  status, not the command's; a notice said *exit code 0* twice over a log saying `CHECK_EXIT=2` then
  `CHECK_EXIT=1`, sixteen real failures between them. So: **append `echo "CHECK_EXIT=$?"` inside the
  command and read the verdict out of the FILE.** The notice says the run finished, never that it passed.
  (d) A MISSING SENTINEL IS NOT A VERDICT either: if the wrapper dies before the `echo` runs, the file
  never gets its line and the technique cannot fire. **No sentinel means no measurement** – not a
  failure and not a pass. Re-run, or wait on the PID.
  (e) ⚠⚠ AND THE SCRATCHPAD IS SHARED BETWEEN LIVE SESSIONS (28.09): a log written to a plain name
  there came back holding **another builder's** gate output – a sentinel read out of a file somebody
  else also writes is somebody else's verdict. **Name gate logs for the task**, and check the log's
  mtime is fresher than your command.
- **⚠⚠ BEFORE YOU HUNT A SLOWDOWN, REPRODUCE IT ON A COMMIT THAT CANNOT HAVE IT.** Same command,
  older code, in a worktree – one run, and it ends the argument. Skipping it cost most of 16.08: twice
  that day a red `npm run check` with **zero assertion failures** was diagnosed as a regression in the
  wave and twice it was the machine (`mobileassetd` at 143 %, load 113). ⚠ **The tell is that the
  failing set CHANGES between runs** — 18 files, then 9, then 12 different ones — and a real defect
  fails the same test twice. Two cheap confirmations first, in order: `--no-file-parallelism` (if the
  shard then passes the WORK is fine and the pool is the problem), then the same shard on the last
  known-green commit.
- **⚠⚠ BEFORE YOU BELIEVE A NULL RESULT, PROVE THE ARM CONTAINS BOTH THE CHANGE AND ITS READER.**
  On 17.08 two people measured the same fix and both got a convincing "it does nothing", by opposite
  mistakes within an hour: one built the A arm at the commit BEFORE the engine change, so the new
  constant sat where no code read it; the other ran both arms against the SAME tree and got a
  byte-identical diff, which is what comparing a thing with itself produces. **A null result is a
  claim and needs a positive result's provenance**: name the commit each arm was built at, confirm the
  reader is present (`git grep <theConstant> -- src/`), and **print a non-empty denominator on both
  arms** – on 28.09 an A/B whose two arms each ran zero test files reported IDENTICAL, because `zsh`
  does not word-split an unquoted `$FILES`. Cheapest sanity check: set the constant absurd and watch
  the output move; if it does not, the arm is wrong before the hypothesis is.
- **⚠ IN A SHARED CHECKOUT THE CONTROL IS YOUR COMMIT WITH YOUR CHANGE REVERTED, NEVER THE PREVIOUS
  COMMIT.** Somebody else's work lands between yours, so "branch head before mine vs mine" measures
  both – on 17.08 that gave one agent a false NEGATIVE and another a false POSITIVE in the same hour.
  Build the A arm as `git revert --no-commit <your commit>` in a dedicated worktree. ⚠ Restore B with
  `git reset --hard`, never `git checkout -- src`: checkout restores from the INDEX, which a staged
  revert has already overwritten, so "back to B" runs A twice and yields a byte-identical diff that
  looks like a null result.
- **`git checkout <sha> -- <path>` is that hazard pointing the other way** – on 16.08 an agent
  bisecting a hash divergence reverted `src` under another agent's live edits. Nothing was lost, but in
  a shared checkout a checkout-with-pathspec is as destructive as a commit-without.
- **A POPUP MUST BE MEASURED AGAINST A PHONE BEFORE IT SHIPS, and "it reads well" is not that
  measurement.** Round-20 #3: `TourBriefingDialog` grew a lead, a list, five bullets and a closing
  line on the shared `dialog-card`, which declares no `max-height` and no `overflow`. At 375x667 the
  dismiss control left the screen – a BLOCKING overlay, so the career stopped there unresumable. It
  HAD a mounted test, measuring contrast, once-ness and that the numbers came from `ECONOMY`:
  **every check was about what the card SAYS, none about what the screen can HOLD.** The failure mode
  is slow – one honest sentence at a time, and nothing objects until it is taller than a phone.
  **So any dialog you add or lengthen gets a mounted assertion that its dismiss control's box is
  inside 375x667**, proven by mutating: a test that cannot fail on the too-tall version is not it.
  ⚠ `setViewport(PHONE)` must run BEFORE the mount – happy-dom caches a media query on the first
  computed-style read, so a late call measures the desktop column and the arm cannot redden.
- **With concurrent agents in ONE checkout, `git commit` takes the whole INDEX, not your files.**
  `git add a.ts b.ts && git commit -m …` looks like it commits two files; it commits everything
  anybody has staged. Measured here on 13.08: a two-file ledger commit swallowed another agent's
  finished UI slice – four files, 531 lines – under a message about something else. Nothing was
  lost, but the commit lied about itself, which is worse than a conflict because it survives review.
  **Use the pathspec form: `git commit -m … -- a.ts b.ts`.** It commits exactly those paths and
  leaves everyone else's staging alone. Telling agents "stage only your own hunks" does not help –
  the hazard runs the other way, from whoever commits next.
- **⚠⚠ AND `git commit --amend` DEFEATS THAT PATHSPEC FROM THE OTHER SIDE (19.09).** A builder
  amended their own commit, with a pathspec, while a colleague's commit had landed on top – and the
  amend **swallowed the colleague's commit under the builder's message**. Repaired with
  `git reset --soft <their sha>` and nothing was lost, but only because the builder noticed and said
  so. **In a shared checkout never amend: add a second commit.** A wrong number in a message is
  cheaper than a commit that ate somebody else's work.
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
  `run_in_background` dies in the parent directory with `ENOENT … Claude/package.json`, exit 254.
  Three times on 13.08, each costing a gate run. **Put `cd <repo> &&` inside every backgrounded
  command**, however recently a foreground call cd'd there.
- The sim project MUST run serialised: every script that touches it carries `--no-file-parallelism` (birpc has a hard-coded 60s RPC timeout that a minutes-long synchronous Monte-Carlo file will blow past, exiting 1 with every test green). If you add a script that runs the sim project, carry the flag.
- The `▶▶ 52 (dev)` button in More ships in EVERY build – an owner ruling (the deployed build is the playtest device), not a regression. Its unsafe half is fixed: the worker's `tick` handler enforces the same open-knock / unrevealed-tournament / **unanswered-life-beat** guards as `advanceWeeks`, refusing at entry and stopping mid-loop; `tests/dev-fast-forward.test.ts` pins both halves.
