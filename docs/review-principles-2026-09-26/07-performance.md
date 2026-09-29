---
type: review
status: audit
area: project-review
canonical: false
last-reviewed: 2026-09-26
baseline: 03d92221
---

# Performance & optimisation – 26 September 2026 review

## Verdict

The app is fast where the player feels it. The biggest wait is still the designed day-cross sweep. The
compute around it stays small at every career depth:

- **Advance:** 42–55 ms of worker time per advance, and the page thread's share is 1.6–6.7 ms (§C.2).
- **One-flag command:** 19–27 ms (§C.2).
- **Autosave:** about 1 ms (§C.1).
- **Save size:** flat after week ~200, at 77–80 KiB stored (§B.5).
- **Engine heap:** no growth over a 1,400-week career (§B.7).

Splitting a large screen to cut render cost would win nothing: in-place updates are 1.0–2.6 ms. The costs
that do bite are elsewhere, in the install gate and the test gates. Three things matter most:

1. **The install gate is 17 KiB from red, and code is growing faster than art.** From 05.09 to 25.09, JS
   grew 411 KiB and art grew 163 KiB. About 47.9 KB of never-called engine corpus rides in the UI chunk,
   held there by five top-level initialisers. That is 2.8× the remaining headroom, and it can go without
   touching offline-first (**G-01**).
2. **Test minutes go on walking careers, and only one family is both large and safe to de-duplicate.** The
   coach-travel-edge family walks the same three careers 111 times, where 18 walks would do. Each schema
   bump adds a ~2.5 s rung, and the family has reddened the runner five times (**G-02**). The college
   component re-walks, the other half of lead 11, cost at most ~3 s of wall time.
3. **Wave A's memo did not help the one command every week runs.** A post-advance `toSnapshot` still
   costs 12.6–13.7 ms (§B.3), because every key legitimately moves when the week moves. That path also
   builds 5–15 week-exclusion sets per advance, with 4–16 `selectEntrants` runs, for far preview cards
   that by the code's own analysis never read them (**G-03**).

The rest of the lane's findings are about gate time:

- one e2e test is half the local e2e wall (**G-04**);
- the heavy-file list is curated by incident rather than by measurement (**G-05**, re-rated P3 in
  verification and now in the P3 table).

The sim econ family's growth since 13.08 (Phase 0 §D.7 #4) is recorded under Seed leads, lead 11, as a
measured observation, not a finding: G-06 claimed it as one and verification refuted the claim.

## Scope and method

Everything here is at `03d92221`. Product code was read in `/Users/letulip/Projects/Claude/tb-review`, the
clean baseline worktree. `RAW` = `/private/tmp/claude-501/-Users-letulip-Projects-Claude/c8208cb1-8875-425d-987a-91238b4d6641/scratchpad/review-raw/`
and `OUT` = `docs/review-principles-2026-09-26/`.

**Read in full:** the brief; `00-baseline.md` (§A–§D, which is the source of every timing here);
`docs/review-principles-2026-09-05/04-performance.md`; `docs/review/06-performance-robustness.md`; and
`docs/specs/engine-ui-parity-2026-09.md`, whose relevance to this lane is nil.

**Searched rather than read:** `docs/decisions.md` (the install ceiling, headroom, the 22.09 portrait
recompression), `docs/now-next-later.md:243` (the install ceiling is queued: «the raise is his по
необходимости, and the first art round hits it») and `docs/backlog/the-quality-rig.md`. None of the
findings below is queued, except G-01's ceiling, whose queue entry is cited.

**Hot code read:**

- the worker, UI side and bundle: `src/worker/sim.worker.ts` (`mutate`, `snapshotMsg`, `ensureMainState`),
  `src/engine/world/derivedCache.ts`, `src/engine/world/snapshot.ts` (the previewer at `:360-560`,
  `seasonSupply` at `:169`, the offers copy at `:2230`), `src/engine/world/albumBook.ts:315`,
  `src/engine/diary/weekNotes.ts` (its top-level initialisers) and `vite.config.ts` (the workbox block);
- the engine's ranking and preview path: `src/engine/world/ladder.ts` (`rankingKey`, `rankingFor`,
  `kidPoints`), `src/engine/season/tournament.ts:761` (`weekFieldExclusion`) and
  `src/engine/season/preview.ts:646-777`;
- the test and gate side: `scripts/units.mjs`, `scripts/heavy-tests.mjs`, `scripts/sim.mjs`,
  `.github/workflows/ci.yml`, `playwright.config.ts`, `e2e/wedding.spec.ts`,
  `tests/coachTravelEdgeFixtures.ts:5408-5560`, `tests/coach-travel-edge-rungs-ratchet.test.ts` and the ten
  college component files.

**No timing was taken** – Phase 1 rule. All probes below count or size things; every timing quoted comes
from §B–§D. Probes and commands (all ran at `03d92221`, output redirected to a log with an `X_EXIT` line;
all read `X_EXIT=0`):

| probe / command | what it counts | output |
| --- | --- | --- |
| `OUT/probes/memo-breakdown.ts` – `npx vite-node … -- 5 0 RAW/G/memo-middle0.json` (tb-review) | per-memo hit/miss for the tick, the first `toSnapshot` after it, and a same-week `toSnapshot`, at 8 checkpoints of `bench-middle-0` | `RAW/G/memo-middle0.json`, `.log` |
| `OUT/probes/g-chunk-lines.mjs` – `node … RAW/dist-sourcemap/assets/index-Cp7uBwDI.js.map src/engine/world/albumBook.ts … src/engine/diary/weekNotes.ts` (tb-review) | which original lines of a module the UI chunk kept | `RAW/G/chunk-lines-main.log` |
| ad hoc `node -e` over `RAW/graph/edges.json` (Phase 0a's import graph) | the runtime import chain from a UI file into `albumCorpus.ts` / `weekNotes.ts` | shown in G-01 |
| ad hoc `node -e` over `RAW/build/sme-*.json` (Phase 0a's source-map-explorer output) | modules in both chunks | reproduces §A5's 64 modules / 121,534 B |
| `OUT/probes/wx-count.ts`, **in my own scratch worktree** `tb-review-G` at `03d92221` with two one-line `globalThis` counters (the patch is in the probe header and at `RAW/G/wx-instrument.patch`) | on the first post-advance `toSnapshot`: far-preview misses, `weekFieldExclusion` calls and the `selectEntrants` runs inside them, split by far path and other path; the same for a same-week `toSnapshot` | `RAW/G/wx-count.log` |
| `node RAW/G/walkcalls.mjs tests/component/<the ten college files>` (a text classifier: functions whose body calls `tickWeek(`/`advanceWeeks(`, and their call sites) | static walker call sites in the college component family | `RAW/G/walkcalls.log` |
| two more instrumented counts in the same scratch worktree (`RAW/G/rk-callers.ts`, `RAW/G/ss-count.ts`): callers of `rankingFor` / `kidPoints` per tick and per snapshot, and entry-gate asks in `seasonSupply` | used to **drop** two hypotheses (see below) | `RAW/G/rk-callers.log`, `kp-callers.log`, `ss-count.log` |

The scratch worktree was removed afterwards (`RAW/G/wt-remove.log`, `X_EXIT=0`). At the end,
`pgrep -lf "vite-node|vitest|vite preview|playwright"` was empty.

**Gap-fill pass** (after verification, read-only, no timing, all at `03d92221`):

| command | what it establishes | output |
| --- | --- | --- |
| `git -C tb-review log --since=2026-08-13 -- tests/econ-reach-pro.test.ts tests/econ-bench.test.ts tests/econ-reach.test.ts tests/econ-reach-agree.test.ts` | the econ sim files' edits since their 13.08 recording: one, `a77fff14` (22.08, `econ-reach` re-pinned) | `RAW/G/gap-econ-log.txt`, `X_EXIT=0` |
| `sed -n 45,95p scripts/gen-icons.mjs`; `ls art-src/logo-lucia-app.png` in both checkouts; `git check-ignore -v art-src/x.png`; `git show --stat 1a0ae74f` | the status of 05.09 README "What needs you" #3 (`npm run icons`) | shown in the Delta table |
| `grep -n "npm run icons" docs/decisions.md` | the owner's 06.09 ruling on the icons recipe (`docs/decisions.md:2945-2946`) | shown in the Delta table |

**Two hypotheses tested and dropped**, recorded so nobody re-derives them:

1. **The key fold is not a cost.** `memo-breakdown` counts 258–926 "ranking"-memo lookups per snapshot.
   I suspected that `rankingKey`'s full roster fold (`ladder.ts:127`, about 3,500–4,050 characters per
   call) was being paid on every hit. Stack-tallied callers show otherwise: `rankingFor` is called about
   15 times per snapshot, and the hundreds of lookups are `kidPoints` (`ladder.ts:386`). Their key is
   `kid|track|week|ledgerToken`, and the ledger token is cached per array (`appendOnlyToken`).
2. **`seasonSupply` does not grow with career depth.** It asks the entry gate 0–180 times per snapshot
   (`RAW/G/ss-count.log`). That count tracks the week-of-season: the 50-week sampling aliased against the
   52-week year and looked monotone. The number of asks per snapshot swings with the season's calendar.
   It was not priced, because pricing it needs a timing (see Not reviewed).

## Findings

Pointers to other lanes, not written up here:

- Where the lead-8 persistence proposal lives: **`offers` only grows and ships whole in every snapshot –
  lane D, D-07.** It is 274 rows and 68 KiB at career end, 98 % no longer live (§B.6), against the "a
  handful of rows" contract (`src/engine/world/state.ts:1398-1399`). This lane's price is in Seed leads
  below.
- **Three round trips per advance and `listSlots` reading every record (05.09 P-08, August "IDB
  churn")** is lane D, D-05.

G-05 was re-rated P3 in verification and now sits in the P3 table; G-06 was refuted and keeps only its
heading below, so that no ID is renumbered.

### G-02 · The coach-travel-edge family walks the same three careers 111 times where 18 would do; every schema bump adds a ~2.5 s rung, and the family has reddened the runner five times
- Severity: P1
- Category: tests
- Evidence:
  - **The walks.** `careerHashAtSchema` (`tests/coachTravelEdgeFixtures.ts:5546-5547`) calls
    `walkFrozenCareer` (`:5410-5418`) on every call: `FREEZE_WEEKS = 156` (`:5408`) ticks of
    `stepCareerWeek`, un-memoised. Counted with `git grep -hoE "careerHashAtSchema\([0-9]+, [0-9]+"` per
    file, there are 111 calls across six files:
    | file | calls |
    | --- | ---: |
    | `-mid-schemas` | 24 |
    | `-recent-schemas` | 21 |
    | `-prior-schemas` | 18 |
    | `-late-schemas` | 18 |
    | `-older-schemas` | 15 |
    | `-deepest-schemas` | 15 |

    The calls cover three distinct careers – `(0,1)`, `(5,0)` and `(8,0)`, 37 each (§D.2 fact 2).
  - **The cost per walk.** File time ÷ calls is 0.79–0.84 s every time (mid 19.53/24, recent 17.32/21,
    prior 14.91/18, older 12.54/15, deepest 12.53/15, late 14.25 solo/18; §D.2), so the files are
    essentially walks. That matches the ratchet's own price: «A rung costs ~2.5 s locally»
    (`tests/coach-travel-edge-rungs-ratchet.test.ts:9`), and a rung is three walks.
  - **The damage.** «Five times now a `-schemas` file in this family has grown past birpc's hard 60 s RPC
    window on the two-core runner and failed a PR with EVERY TEST GREEN» (same file, `:3-7`).
  - **The shape.** The schema peel is non-mutating object rest (`:5548-5600`), so a walked world can be
    shared.
- Why it matters: 93 of the 111 walks are repeats – about 76 s of the family's 113.0 s summed test time
  (93 × 0.82 s). Five of the files are heavy shards, one process each: their walls sum to 83.71 s of the
  356.84 s heavy tail (§D.2), and the heavy tail is half the local unit gate. On CI's single heavy lane
  (`ci.yml:194-207`) they run strictly in series. The family grows by one rung per `SAVE_SCHEMA_VERSION`
  bump, and has been cut five times.
- Proposal:
  - **The change.** A module-level memo of `walkFrozenCareer(preset, policy)` per test process: three
    walks per file, deep-frozen so that a peel which ever mutated would throw.
  - **Owners.** Lane H owns the choice of fixture strategy; this is the pricing.
  - **Why not a shared serialised fixture.** It is the wrong shape here: the rung asserts that the LIVE
    walk under current code reproduces a frozen hash, and a stored world would stop measuring the engine.
  - **Expected gain.**
    - Each schema file drops from 12.5–20.9 s to about 4 s: three walks, about 1.4 s of process start and
      milliseconds per rung.
    - About −64 s of serial heavy time, which is about −32 s of the local unit gate on two lanes
      (374 → ~342 s, −9 %).
    - About −2 min on the CI heavy job, at the repo's ×1.9.
    - A rung falls from ~2.5 s to milliseconds, so the `MAX_RUNGS = 10` cut protocol stops binding.
  - **Proof.**
    - The family's own frozen hashes: every rung is a hash comparison, so a memo that changed meaning
      goes red.
    - An A/B pass-set diff in two worktrees.
    - The deep-freeze mutation check.
- Blast radius: tests only, with no product law touched. `git grep -l "coachTravelEdgeFixtures" -- tests/ |
  wc -l` = 24 files import the fixture module, and none needs editing if the memo lives inside
  `walkFrozenCareer`. `scripts/heavy-tests.mjs` could later demote the five files (7 tests reference it).
- Effort: S
- Confidence: high – the walk count and per-walk cost are both measured, and the peel was read.
  Confirming the single-rung cost after the change would raise it.
- Versus 05.09: new. 05.09 listed `coach-travel-edge` among its slowest files without the cause.
- Verification: CONFIRMED – every `careerHashAtSchema` call runs a fresh 156-tick walk, the 111 calls split 37/37/37 over the three careers, every consumer of the walked world is non-mutating so a per-process memo keeps each rung's meaning, and the §D.2 numbers reproduce.

### G-01 · 47.9 KB of never-called engine corpus rides in the UI chunk – 2.8× the 17 KiB install headroom – held there by five top-level initialisers
- Severity: P2 (re-rated from P1 in verification)
- Category: performance
- Evidence:
  - **The ceiling.** `scripts/install-size.mjs:49` sets `CEILING_KIB = 16 * 1024`. The measured install
    is `16367 KiB in 362 precache entries, 17 KiB under the 16384 KiB ceiling` (§A5; `node
    scripts/install-size.mjs`, re-confirmed by §D.1 step 13). The step fails `npm run check` and CI
    (`.github/workflows/ci.yml:153`).
  - **The growth is code.** 05.09 at `20318e65` → 25.09 at `03d92221`, by type
    (`docs/review-principles-2026-09-05/04-performance.md:215-229` against `00-baseline.md:579-589`):
    | type | 05.09 KiB | 25.09 KiB | change KiB |
    | --- | ---: | ---: | ---: |
    | JS | 981 | 1,391.7 | **+411** |
    | CSS | 181 | 212.4 | +31 |
    | images (webp + png + svg) | 11,518 | 11,681.1 | +163 |
    | audio and fonts | – | – | flat |
    | **total** | 15,755 | 16,367 | **+612** |

    The worker chunk went 366,802 → 661,763 B (+80 %) and the main chunk 632,244 → 757,571 B (+20 %).
  - **The dead code.** The main (UI) chunk carries `engine/world/albumCorpus.ts` at 28,275 B and
    `engine/diary/weekNotes.ts` at 19,641 B, for 47,916 B in all (§A5 source-map-explorer; the main chunk
    lists 70 engine/shared modules, 128,034 B). The UI never calls either module:
    - The only runtime path to them is `components/BracketTabs.vue → engine/world.ts →
      world/albumBook.ts → world/albumCorpus.ts` and `… → world/milestones.ts → diary.ts →
      diary/weekNotes.ts` (Phase 0a's `RAW/graph/edges.json`). Every UI import on that path is a small
      symbol such as `KID_ID`.
    - `g-chunk-lines.mjs` over the main-chunk sourcemap shows `albumBook.ts`: **1 mapped line – 315**,
      which is `const OCCASION = new Map(ALBUM_CORPUS.map((o) => [o.id, o]))`. It also shows
      `milestones.ts`: 0, `diary.ts`: 0, `albumCorpus.ts`: 842 lines (89–1123, i.e. `ALBUM_CORPUS` whole),
      and `weekNotes.ts`: 432 lines, anchored by its top-level call initialisers at `:923`
      (`MOTHERHOOD_VOICES = (…).flatMap`), `:967` (`BEREAVED_VOICES = ….map`), `:1014`
      (`DIVORCED_VOICES`), `:1070` (`FORK_AFTERMATH_VOICES`) and `:1088` (`WEEK_NOTES = [...,
      ...voicedNotes(), …]`, with the call at `:1698`).
    - Rollup cannot prove a top-level `.map(...)` or `new Map(...)` free of side effects, so it keeps
      each initialiser and everything it reads. `package.json` declares no `sideEffects`.
- Why it matters: the next content wave turns `check` and CI red on the install gate. The queue entry
  says «the first art round hits it», but the measured growth says any corpus wave will, and the worker
  chunk has nearly doubled in 20 days. These 47.9 KB are the only bytes found that can leave without an
  owner ruling:
  - no art, audio or offline behaviour changes;
  - the worker chunk keeps both modules, and it is the only caller.
- Proposal:
  - **The change.** Make the five initialisers tree-shakeable without changing a value:
    - `albumBook.ts:315` becomes a lazy accessor (`let OCCASION: Map<…> | null = null`, built on first
      `occasionOf`);
    - the four `…_VOICES` constants and `WEEK_NOTES` in `weekNotes.ts` get `/*#__PURE__*/` IIFE
      wrappers, or the same lazy shape.
  - **Owners.** Lane B's `albumBook.ts` and lane C's `weekNotes.ts` own the code.
  - **The general fix is a boundary change.** Stop importing UI constants through the barrel, or add a
    `sideEffects` allowlist that keeps `*.css`. Lane A owns that.
  - **Expected gain.** −47,916 B raw on the main chunk, which takes the headroom from 17 to about 64 KiB.
  - **Proof, in a builder's worktree:**
    - run `vite build` and `node scripts/install-size.mjs` (headroom);
    - run `g-chunk-lines.mjs` on the new main-chunk map, which must report 0 mapped lines for
      `albumCorpus.ts` and `weekNotes.ts`;
    - check that the worker chunk's behaviour is unchanged: `tests/week-notes.test.ts` and the album
      suites green, and the e2e `album.spec.ts`.
  - **Owner questions** (options, not findings):
    - (a) `pwa-maskable-512.png`, 105.1 KiB, is manifest-only: `git grep` finds no `src` reader, while
      `pwa-192/512` are read by `src/audio/music.ts:132-133`.
    - (b) `music/theme.mp3` is 2,524 KiB, about 153 kbps, 15.4 % of the install – a bitrate is his call.
    - (c) The ceiling counts raw bytes, and JS is 1,391.7 KiB raw against about 447 KiB gzip (§A5). Is
      it meant to bound the download or the storage?
- Blast radius: no RNG key, save schema, wording or balance. Tests that would move:
  `git grep -l "albumBook" -- tests/ | wc -l` = 9 and `git grep -l "WEEK_NOTES" -- tests/ | wc -l` = 8, all
  readers of values that stay byte-identical. Source pins on the five initialisers: none (`git grep -n
  "new Map(ALBUM_CORPUS\|MOTHERHOOD_VOICES\|BEREAVED_VOICES" -- tests/` is empty).
- Effort: S
- Confidence: high on the mechanism and the bytes kept, from the sourcemap line evidence. Medium on the
  exact recovered figure, since the IIFE-versus-lazy choice may leave a few hundred bytes. A scratch build
  would raise it, and that is a Phase 2 or builder step because Phase 1 forbids `vite build`.
- Versus 05.09: new. It builds on P-04 and the August "engine shipped twice", and cites the queue entry
  `docs/now-next-later.md:243` with new evidence.
- Verification: CONFIRMED – a scratch build with the six initialisers wrapped in `/*#__PURE__*/` IIFEs cut the main chunk from 757,571 to 708,529 B (−49,042 B) and moved install headroom from 17 to 65 KiB with the worker chunk's hash unchanged; re-rated P2 because nothing is red today and the ceiling is already queued with the owner (`now-next-later.md:243`).

### G-03 · Every week advance builds 5–15 W exclusion sets (4–16 `selectEntrants` runs) for far preview cards that never read them – the part of carried P-05 that Wave A could not reach
- Severity: P2
- Category: performance
- Evidence:
  - **The advance path gained nothing from the memo.** A post-advance `toSnapshot` costs 12.6–13.7 ms
    with 36–37 memo misses (§B.3), against 05.09's 13 ms. `memo-breakdown.ts` splits the misses on
    `bench-middle-0`:
    - far previews: 14–31;
    - ranking memo: 5–8 (week-keyed, legitimate);
    - rated fields: 3–6 (`universeToken` folds cohort attributes, which `driftCohort` moves weekly,
      `snapshot.ts:388-411`, legitimate).

    A same-week `toSnapshot` misses 0–2. All of this is inherent to a new week, except what follows.
  - **What a far miss computes.** A far-preview miss (`snapshot.ts:521-533`) runs `argsFor(e)`
    (`:460-485`). For a W card that means `excluded: wtaExclusionFor(e)` (`:475`) →
    `weekFieldExclusion` (`season/tournament.ts:761-786`), which runs `selectEntrants` once for every
    higher W rung that week.
  - **What a far card reads.** Past `DRAW_LEAD_WEEKS` (= 1, `preview.ts:136`), `firstRoundDraw` returns
    null before reading `excluded` (`preview.ts:655`). The far branch's own comment says the card reads
    «`ranking`, `standing`, `excluded` and `pinnedOpponentId` NOWHERE» (`snapshot.ts:500-506`).
  - **The count.** `wx-count.ts` ran in an instrumented scratch worktree over three careers, at weeks
    100–1,200. On the first post-advance snapshot, far misses made **5–15 exclusion calls and 4–16
    `selectEntrants` runs**, while near cards needed 0–4 calls and 0–6 runs. The same-week snapshot made
    0 far calls (`RAW/G/wx-count.log`).
  - **Dead work on every card.** Separately, `previewEvent` builds `posOf`, a map of every ranking row
    (up to 564 on the W table), on every call, and never reads it (`preview.ts:760-761`;
    `grep -n posOf` finds only those two lines).
- Why it matters: this is the only removable work found on the command every week runs. The rest of the
  post-advance snapshot is re-derivation the new week legitimately forces. §C.2 puts after-tx (snapshot +
  post) at 15.4–23.3 ms of a 42–55 ms browser advance, on an M4; a phone is slower by an unmeasured
  factor. The 05.09 profile attributed `selectEntrants` plus its callbacks about 7 % of the pro arm, and
  the three ranking/tournament/preview files about 45 % of `toSnapshot`
  (`04-performance.md:296-321`). The share of 4–16 runs today is unmeasured.
- Proposal:
  - **The change.** In the far branch, call `previewEvent` with the far-only arguments (`kid`,
    `kidAtRest`, `rated`) and `excluded: undefined`, without `standing` or `pinned`. Compute
    `wtaExclusionFor` / `wtaDrawFor` only in the near branch, and delete `posOf`.
  - **Owners.** Lane B owns `snapshot.ts` and lane C owns `preview.ts`.
  - **Expected gain.** 4–16 `selectEntrants` runs and one `rivalConditions` fold fewer per advance. Price
    it with `npm run bench:snapshot` (`tools/snapshot-bench.ts`, the `tick` arm, cold memo) before and
    after, and with Phase 0's `runtime-career.ts` full-arm post-advance median.
  - **Behaviour cannot move, by construction.** Prove it by serialising `toSnapshot` for the 90 golden
    fixtures and the 13 e2e fixtures at the A and B commits in two worktrees and diffing byte for byte,
    with `tests/snapshot-cache-verify.test.ts` and the e2e parity spec green.
  - **The RNG.** The skipped `rngFromSeed(\`${seed}:kidtour:${e.id}\`)` streams are sub-streams,
    re-derived per call, that persist nothing. No MAIN draw moves: the 41550 / `e6b0c709` capture is
    untouched and no key is edited.
- Blast radius: RNG sub-stream calls are removed, not re-keyed. There is no save schema, wording or
  balance change. `git grep -l "world/snapshot" -- tests/ | wc -l` = 25 and `git grep -l "season/preview"
  -- tests/ | wc -l` = 8, and no pin names `argsFor`, `wtaExclusionFor` or `posOf` (`git grep -n` finds
  only unrelated locals).
- Effort: S
- Confidence: high that the work is dead (code plus counts). Low on the gain in milliseconds; the
  `bench:snapshot` tick arm raises it.
- Versus 05.09: carried (P-05, its advance half; the same-week half is fixed by Wave A).
- Verification: CONFIRMED – the far branch eagerly builds `excluded` via `wtaExclusionFor` although `firstRoundDraw` returns null past `DRAW_LEAD_WEEKS` before reading it and `posOf` is never read; the builder should prefer making `excluded` lazy over a second far-only argument assembly, to honour the site's «ASSEMBLED ONCE PER EVENT AND SPENT TWICE» ruling (`snapshot.ts:456-459`).

### G-04 · The e2e wall is one test: `wedding.spec.ts` is 36.6 s of a 72 s local run, started last – and up to ~30 s of it is the designed day-cross sweep, ten times over
- Severity: P2
- Category: tests
- Evidence:
  - **The long pole.** §D.5: 134 tests, 72.04 s wall, 5 workers and 180.7 s of summed test time. The
    wedding test is 36.55 s; it started at +34.7 s and was the suite's last result, with the other four
    workers idle for its final ~30 s. `playwright.config.ts:50` has `fullyParallel: true`, and a file
    sorting last alphabetically starts last.
  - **Where the time goes.** The test presses the week ten times: `e2e/wedding.spec.ts:271`, the eight
    presses of the loop at `:380-381`, and `:454`. Every press goes through `advanceOneWeek`
    (`:217-224`) or the Home week button. A Home press routes through the calendar sweep whenever it
    runs (`src/App.vue:907-911`). The sweep is `brisk` at `sweepMs: 3000` plus a 620 ms hold per beat day
    (`src/composables/dayCross.ts:75`). An advance's own compute is 45–62 ms (§C.2).
  - **The timeout.** 36.55 s is 61 % of the 60 s per-test timeout (`playwright.config.ts:44`).
- Why it matters: locally it adds ~27 s (≈37 %) to every e2e run. On CI's single worker
  (`playwright.config.ts:63`) it is ≥20 % of the serial run, and about 30 s of it is the animation rather
  than the app.
- Proposal: two options, both test-only, for lane H and, for (b), the owner:
  - **(a) Start it first.** Give it its own project, or a file name that sorts first. The expected local
    wall is max(36.6, 180.7/5) + 8.4 s of startup ≈ 45 s, down from 72.
  - **(b) Walk the eight ordinary weeks with the sweep off.** Use `reducedMotion: 'reduce'` for that
    stretch only. The composable already refuses to schedule the sweep under reduced motion
    (`dayCross.ts:168-173`). This saves ≥24 s of test time on CI too. It changes the route the spec
    walks, which the spec's header defends («walked the way the product makes a player walk one»), so
    it is a question, not a default.

  Behaviour cannot move; no bench arm is needed.
- Blast radius: tests only. `git grep -l "wedding.spec" -- tests/ | wc -l` = 1 (the e2e coverage
  registry).
- Effort: S
- Confidence: high on the wall and the ordering. Medium on the sweep's exact share, since per-step times
  are not in the JSON (`RAW/gates/e2e.json` has no steps); a `test.step` trace would raise it.
- Versus 05.09: new (05.09 did not measure e2e per test).
- Verification: CONFIRMED – the wedding test ran 36.55 s (+34.69 to +71.24 s) while every other test had finished by +39.12 s, and its ten presses each go through the 3000 ms brisk sweep with no reduced-motion switch in e2e; minor slips that do not change the cost: the calendar detour is at `App.vue:916`, the file does not sort last, and it was the last to finish rather than the last to start.

### G-06 · The sim econ family grew 21–29 % at constant cases since 13.08; `econ-reach-pro` reads 54.2 s solo, 6 s under birpc's wall on the owner's own Mac, where every PR assembly runs it – refuted in verification, see 09-refuted.md

Not a live finding. The claim and the reason it failed verification go to `09-refuted.md`, which the
synthesis writes; this lane file does not hold it. The underlying measurement (Phase 0 §D.7 #4) is kept
as an observation under Seed leads, lead 11.

## P3 – polish

| id | title | file:line | one-line proposal |
| --- | --- | --- | --- |
| G-P3-01 | 428 of the component gate's 1,178 log lines (36 %) are Node 26's `localStorage is not available because --localstorage-file was not provided` warning, ×214 (`RAW/gates/c11-test-component.log`) – the P-17 noise class again | `vite.config.ts:473-510` (the component project) | pass `--no-experimental-webstorage` to the component pool's `execArgv`, or silence that warning code in `tests/component/setup.ts` (lane H) |
| G-P3-02 | No code splitting: 0 dynamic `import()` in `src` (§A3); the main chunk is 757,571 B (+20 % since 05.09), and vite warns about >500 kB chunks | `vite.config.ts` (build) | still not worth a wave on boot time (05.09 P-04); revisit if the install ceiling is re-ruled to count only the boot path |
| G-P3-03 | The vite.config precache note still says `313 entries 12256 KiB` and «~35 s» at 3 Mbit/s; the build is 362 entries, 16,367 KiB, ≈45 s | `vite.config.ts:183-193` | restate the measured numbers, or point at `scripts/install-size.mjs` (lane H, docs) |
| G-P3-04 | CLAUDE.md's gate figures are stale: `test:component` "~45s" (measured 67.8 s, one invocation) and `test:sim` "~5 min" (7.66 min is 13 per-file invocations SUMMED, §D.6; the one-invocation wall was not run – see Not reviewed) | `CLAUDE.md:12-13` | re-state from §D, or drop the figures for a pointer (lane H); a restated sim figure needs one `npm run test:sim` wall first |
| G-P3-05 | `seasonSupply` asks the entry gate 0–180 times per snapshot depending on the week of the season (`RAW/G/ss-count.log`); its own note priced ~4 ms per ~40 asks before Wave A | `src/engine/world/snapshot.ts:169-195` | price it per season-week with `bench:snapshot` before touching it; a per-event memo keyed on the gate's inputs is the candidate |
| G-P3-06 | The component project lifts a 10-core machine from load 5 to ~82 in 68 s (§D.1) – any timing read right after it is contaminated | `vite.config.ts:473-510` | note it where gates are timed, or cap that project's `maxWorkers` when a measurement follows (lane H) |
| G-P3-07 | `MatchViewer`'s canvas is still a fixed 680×420 backing store; DPR is read once (August LOW) | `src/components/MatchViewer.vue:219-220`, `:780` | only if a real phone shows softness or overdraw cost; unmeasured here |
| G-P3-08 | `pwa-maskable-512.png` (105.1 KiB) is precached but has no `src` reader (manifest-only) | `vite.config.ts:160-164, 212` | an owner option under the install ceiling (G-01 question (a)), not a default |
| G-05 | `HEAVY_UNIT_FILES` has drifted from measurement: nine heavy shards take 7.60–10.93 s (89.7 s summed) while bulk `week-notes` / `coach-load` / `wave10-walker-retirement` take 27.35 / 24.64 / 21.55 s solo (§D.2), and `coach-travel-edge-late-schemas` (15.7 s solo, created by `154b17d0`) never joined | `scripts/heavy-tests.mjs:442-447`; `scripts/units.mjs:172-178`, `:310` | re-curate by solo seconds from `RAW/gates/unit-perfile.json` and record them in the docblock (lane H owns the list); prove the CI effect with one runner run per arm before adopting, since the gain is unmeasured |

G-05 was written up at P2 and re-rated in verification; its full write-up is replaced by the row above.
The verification line it carried, verbatim:

- Verification: PLAUSIBLE – the numbers and the `-late-schemas` omission reproduce, but the «~32 s in-pool» bar at `heavy-tests.mjs:255-256` was withdrawn on 26.08 (`52ded7ae`, solo cost named the honest measure), and the ~90 s local / ~170 s CI gain is unmeasured and may be negative on CI, where unit-bulk is the long pole; re-rated P3.

## Delta versus 05.09

Every finding of `docs/review-principles-2026-09-05/04-performance.md` (P-01 … P-20), plus item #3 of
that review's README "What needs you", which no lane had statused:

| ID | title | status | evidence |
| --- | --- | --- | --- |
| P-01 | PWA icons stored uncompressed | fixed | `44343fc7`; `pwa-512.png` 146.8 KiB, `pwa-maskable-512.png` 105.1 KiB in the precache (§A5) |
| P-02 | The install ceiling guarded `public/`, not the built manifest | fixed (guard); the note half is open → G-P3-03 | `scripts/install-size.mjs:49` parses `dist/sw.js` in `check` (§D.1 step 13) and CI (`ci.yml:153`); `tests/round29p2-offline-install.test.ts:60-62` reads its `CEILING_KIB` |
| P-03 | README/licence files ship and precache | superseded – they are not precached | `globPatterns` excludes md/txt (`vite.config.ts:212`); §A5's type table has none; the 7 files (`git ls-files public \| grep -E "\.(md\|txt)$"`) are still copied into `dist` at no install cost |
| P-04 | No code splitting | still open (P3) → G-P3-02 | 0 `import()` (§A3); main chunk 632,244 → 757,571 B |
| P-05 | `toSnapshot` 13–24 ms per command | still open for the advance; fixed for same-week commands | Wave A memo (`derivedCache.ts`, `fdd9ed6c`…): same-week 5.4–6.9 ms on a clone, memo-on 2.4–4.7 ms on fixtures; post-advance 12.6–13.7 ms, 36–37 misses (§B.3) → **G-03** |
| P-06 | `windowedBestSum` quadratic in `computeRanking` | superseded | `computeRanking` already bucketed per player at `98e3560b` (`git show 98e3560b:src/engine/season/ranking.ts`, `perPlayer` at `:465`); the per-player `windowedBestSum` calls were `kidPoints`', now memoised (`ladder.ts:386`) |
| P-07 | `refreshDerivedRankCaches` 8–10 ms per load | fixed | 4.7–7.4 ms on a fresh load with an empty memo, 0.34–0.40 ms warm (§B.5) |
| P-08 | Two list refreshes after every advance | still open → lane D (D-05) | `stores/game.ts:419-427`; `db/saves.ts:395` `getAll()`; measured < 400 chars and < 0.5 ms page-side per extra reply (§C.3) |
| P-09 | The boundary is healthy (verified, no action) | superseded – re-measured, holds | the whole transfer ≤ 1.2 ms at 150 k chars (§C.3) |
| P-10 | Match playback 71 % busy at 4× throttle | still open – not re-measured | see Not reviewed |
| P-11 | No leak (verified) | superseded – holds for the engine | no heap growth over a 1,350–1,450-week career (§B.7); the page heap was not re-measured |
| P-12 | Boot long task on mobile | still open – not re-measured | see Not reviewed |
| P-13 | Heavy unit tail serial on a 10-core machine | fixed | `scripts/units.mjs:310` `HEAVY_LANES = max(1, floor(cores/4))` → 2 lanes; the tail absorbed 12 more heavy files: 25 shards, 356.8 s serial → 178 s wall (§D.2) |
| P-14 | `goldenSaves` walks the corpus three times | superseded | split into `goldenSaves` / `-quote` / `-peak` with `it.each`; the migrate-once remedy was refused with a reason (`tests/goldenSaves-quote.test.ts:29-33`); shards 10.08 / 10.30 / 10.02 s (§D.2) |
| P-15 | `round34-reachable-ceiling`'s 22 s `beforeAll`, unguarded | superseded | the hook now carries a 50 s budget and a named failure (`tests/round34-reachable-ceiling.test.ts:455-464`); 28.03 s in the pool, under the ~32 s in-pool bar that was itself withdrawn on 26.08 (`52ded7ae`); the class lives on in **G-05** (P3) |
| P-16 | The component project had no `testTimeout` (5 s) | fixed | `testTimeout: 20_000` in the component project (`vite.config.ts:509`) |
| P-17 | `sfx.ts` opens real sockets to `:3000` in component tests | fixed | `tests/component/setup.ts:1-30` stubs `fetch`; 0 `ECONN`/`AggregateError` in `RAW/gates/c11-test-component.log` (a new noise class → G-P3-01) |
| P-18 | `--verbose` in CI | fixed | `ci.yml:166-192` (dropped; the red-run cost re-measured at ~86 KiB) |
| P-19 | `check:tools` typechecks `src` again (recorded, not recommended) | still open – recorded | 2.90 s of 458 s (§D.1 step 9) |
| README "What needs you" #3 | `npm run icons` cannot run: it throws at `findLogoSource()`, the master `art-src/logo-lucia-app.png` is missing | superseded by ruling – still cannot run, by design | the owner kept the script as a recipe on 06.09 («оставить, но починить сообщение», `1a0ae74f`; `docs/decisions.md:2945-2946`); it still throws at `scripts/gen-icons.mjs:78-95`, now with a message that says why and points at the ratchet `tests/pwa-icon-weight.test.ts`; the master is absent from both checkouts (`ls art-src/logo-lucia-app.png` fails), and `art-src` is gitignored by design (`.gitignore:28`). No performance cost: the shipped PNGs were re-encoded without it (P-01). Restoring the master stays the owner's |
| P-20 | The gate's headline number is honest | superseded – re-measured | `check` summed 457.99 s at `03d92221` against 421.8 s at `20318e65` (+8.6 %). Unit 367.5 → 374.2 s (+2 %) while unit tests grew 4,574 → 7,226 (+58 %); component 39.5 → 67.8 s (+72 %) as its tests grew 1,459 → 2,390 (+64 %) (§D.1–D.3) |

## August review – the performance items of `docs/review/06-performance-robustness.md`

Lane D statuses its persistence and robustness items: version-skew rollback, the multi-tab guard, the
autosave-failure desync and the malformed-tour match loop.

| August item | status | evidence |
| --- | --- | --- |
| [MEDIUM] Career load replays the whole career (`sim.worker.ts:64` then) | fixed | v35 persisted `rngMain`; a load verifies it and resumes in O(1), and the replay survives only behind a failed check (`src/worker/sim.worker.ts:73-85`, `ensureMainState`); `decompressWorld` 2.0–2.1 ms at every checkpoint (§B.5) |
| [MEDIUM] Precache: ~1.24 MB of icon PNGs | fixed | `44343fc7` (P-01) |
| [LOW] Per-action IDB churn (`listSlots` `getAll`, autosave reads both generations) | still open → lane D (D-05); measured cheap | the autosave transaction, both reads included, is 0.6–1.1 ms median, max 4.1 ms (§C.1) |
| [LOW] Fixed-resolution canvas | still open (P3) → G-P3-07 | `MatchViewer.vue:219-220`, `:780` |
| [LOW] Single eager bundle, engine shipped twice | still open – measured | 64 modules / 121,534 B of the main chunk are also in the worker (§A5), of which 47,916 B are never called by the UI → **G-01** |
| [LOW] Audio has no cache story | superseded by ruling | audio is in the precache by the owner's 29.08 ruling (`vite.config.ts:219-224`) |
| Strength: "the tick is cheap, ~1.5 ms/week" | changed – context, not a defect | 5.07 ms (early) → 6.96 ms (late) per week on the bench driver with entries (§B.2) – a different driver from August's, and the engine has grown |
| Strength: "save size cannot run away" | holds for the stored save; not for `offers` | stored payload 77 → 80 KiB from week 200 to the end (§B.5); `offers` only grows → lane D, D-07 |

## Seed leads

- **Lead 8 – growth over a long career, the measurement side: partially confirmed.** The persistence
  proposal is lane D's D-07.
  - **What does not grow.** The tick rises +37 % from the first to the last hundred weeks, with nothing
    super-linear (§B.2). The stored save is flat after week 200. The engine heap is flat. IndexedDB is
    about 1 ms and flat from week 86 to 1,133 (§C.1).
  - **What does grow.** The snapshot goes 72 → 162 KiB, and `offers` is 67 of the 90 KiB it gains
    (§B.4). The in-place command grows 19.2 → 27.4 ms of worker time from week 120 to 1,133 (§C.2).
  - **This lane's price for `offers`,** derived from §B, not timed. `offers` is ~39 % of the world JSON's
    growth from week 100 to the end (68 of 175 KiB). Encode grows 5.30 → 7.29 ms and clone 1.65 → 2.34
    ms over that span, so ~1 ms of those two, plus about 0.3 ms of snapshot clone. That is ≲ 1.5 ms per
    command at career end – a small cost next to the false contract.
  - **The windows.** Week ~1,600 is unreachable: careers retire at weeks 1,349–1,453 (§B.1).
  - **The snapshot's hidden variance.** `seasonSupply`'s 0–180 gate asks per snapshot follow the season
    week, not career depth (G-P3-05).
- **Lead 9 – the install ceiling: confirmed → G-01.** Where the bytes are (§A5):
  | type | share | KiB |
  | --- | ---: | ---: |
  | images | 71.4 % | – |
  | – `images/fields/` | – | 4,989 |
  | – `fem-euro-brunnet/` | – | 2,990 |
  | audio | 18.2 % | – |
  | – `theme.mp3` alone | 15.4 % | 2,524 |
  | JS | 8.5 % | – |
  | CSS | 1.3 % | – |
  | fonts | 0.6 % | – |

  JS is where the growth is: +411 KiB of the +612 KiB since 05.09. What can leave without breaking
  offline-first, given the owner's 29.08 ruling that everything the game shows is precached:
  - the 47.9 KB of dead engine corpus in the UI chunk (G-01), which needs no ruling;
  - `pwa-maskable-512.png` (105.1 KiB, manifest-only), an owner option;
  - a lower `theme.mp3` bitrate, an owner option.

  Nothing else that renders can leave under the ruling. Whether the ceiling should count raw or gzip
  bytes for JS is a question (G-01 (c)).
- **Lead 11 – test time: confirmed for coach-travel-edge (→ G-02); partially refuted for the college
  component files.**
  - **Coach-travel-edge.** 111 walks where 18 would do, ~76 s summed, ~32 s of local unit-gate wall and
    ~2 min of CI heavy job. The family's cut-five-times history is a rung price of three walks. An
    in-process memo is the right shape, and a serialised fixture is not, because the walk is the
    measurement.
  - **The college component family.** 10 files, 60.71 s summed, 15.3 % of the component project's test
    time (§D.3), with 32 static walker call sites (`node RAW/G/walkcalls.mjs <the ten files>` → `RAW/G/walkcalls.log`). A departure walk is ~114
    ticks, ≈0.5–0.6 s at §B.2's 5.07 ms per week. Even if every call site were a repeat, a shared
    fixture could save at most ~19 s summed, about 3 s of the 66 s wall at the pool's ~6× overlap. Most
    of the family's time is mounting and the longer graduate / ended walks.
  - **Where the minutes really are.** Walking files are 84 % of unit and 86 % of component test time
    (§D.2–D.3). The general fixture strategy is lane H's.
  - **The birpc side.** The window forced five cuts because a rung is three un-memoised walks (G-02).
  - **The sim econ family – an observation, not a finding** (Phase 0 §D.7 #4; G-06 claimed it as a
    finding and verification refuted that, reason in `09-refuted.md`). Measured per file with
    `npm run test:sim -- tests/<file>.test.ts` at `03d92221` (§D.4), against the solo seconds recorded on
    13.08 in `scripts/heavy-tests.mjs`' docblock: `econ-reach-pro` 54.15 s (41.9 recorded, +29 %),
    `econ-bench` 48.73 (39.0, +25 %), `econ-reach` 45.74 (37.9, +21 %), `econ-reach-agree` 44.94 (35.8,
    +26 %), `econ-bench-survival` 36.47 (29.1, +25 %). The two readings are not like for like: §D.4's
    wall includes `npm`, `sim.mjs` and one vitest start (~1–2 s). Only `econ-reach` was edited since
    (`a77fff14`, 22.08; `RAW/G/gap-econ-log.txt`). All 13 files ran green at the first attempt with no
    stall or retry. The sim project never runs on a PR by ruling (CLAUDE.md; brief §3), and its
    retry classifier carries the birpc stall by design, so this lane draws no proposal from it.

## Not reviewed

Four measurements the brief asks for are missing from Phase 0's §A–§D. Phase 1 forbade new timing, so
each is recorded here rather than taken, with what it leaves unpriced:

1. **The one-invocation `npm run test:sim` wall.** §D.6's 7.66 min (459.62 s) is the SUM of 13 separate
   `npm run test:sim -- <file>` invocations (§D.4), each paying its own `npm` + `sim.mjs` + vitest start
   (~1–2 s), and it says so: «the one-invocation `npm run test:sim` was not run». So the 25.09
   comparison (≈ 8 min → 7.66 min, −4 %), lane H's H-09 and this lane's G-P3-04 compare a sum with a
   wall. The sum over-states the wall by roughly the 12 extra starts (~12–24 s) and cannot show a
   serialised run's own stalls or retries. Measure with one `npm run test:sim` at a quiet load, log and
   `X_EXIT` in a file, before any sim figure is restated.
2. **A throttled or phone-class browser run.** Every absolute here is an M4 floor (§C.2 caveat 7);
   Phase 0 took no CPU-throttled or mobile-emulated run. Not re-measured as a result: 05.09 P-10 (match
   playback 71 % busy at 4× throttle), P-12 (the boot long task on mobile), the browser half of P-11
   (the page heap over weeks), the screen-switch costs, and the service-worker install and update
   timings (05.09 measured 4.2 s from localhost). The Delta rows for P-10 and P-12 are therefore "still
   open – not re-measured", not "fixed", and P-11 "holds" for the engine heap only.
3. **CI-side gate minutes.** Every CI figure in this file (G-02's ~2 min on the heavy job, the ×1.9 /
   ×2.3 columns of §D.2 and §D.4) is DERIVED from the repo's own multipliers; no GitHub Actions runner log
   was read and no job duration was measured. The multipliers are the repo's (`scripts/heavy-tests.mjs`,
   `scripts/units.mjs`), not this review's. One read of the last green `ci.yml` run's per-job durations
   would replace them.
4. **A CPU profile of the post-advance `toSnapshot`.** §B.3 gives its total (12.6–13.7 ms, 36–37 memo
   misses) and this lane counted the far-preview work inside it (`RAW/G/wx-count.log`: 5–15 exclusion
   calls, 4–16 `selectEntrants` runs), but nothing splits the 12.6–13.7 ms by function. **G-03's gain is
   therefore unpriced in milliseconds**; its Confidence says so. The 05.09 profile's shares
   (`04-performance.md:296-321`) date from `20318e65`, before Wave A. Price it with `npm run
   bench:snapshot`'s `tick` arm before and after, plus one `--cpu-prof` of `runtime-career.ts`' full arm.

Also not covered:

- **Other timings Phase 1 forbade:** `seasonSupply`'s per-season-week cost (G-P3-05),
  `weekFieldExclusion`'s unit cost, and collect time per test file against barrel imports (lead 6,
  lane A).
- **A build proving G-01's bytes** was forbidden in Phase 1; verification has since run it (G-01's
  Verification line).
- **The real click path of an advance** (`playWeek` with the sweep): §C issued commands through the
  store, so the sweep's share of G-04 is inferred from `dayCross.ts`, not timed.
