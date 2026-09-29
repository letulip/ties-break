---
type: review
status: audit
area: project-review
canonical: false
last-reviewed: 2026-09-26
baseline: 03d92221
---

# Baseline – 26 September 2026 review (Phase 0)

Every number in this file was measured at `03d92221` in a clean detached worktree
(`/Users/letulip/Projects/Claude/tb-review`, `node_modules` installed, no tracked file modified). Every
number names the command that produced it; `RAW` below is
`/private/tmp/claude-501/-Users-letulip-Projects-Claude/c8208cb1-8875-425d-987a-91238b4d6641/scratchpad/review-raw/`,
where the full outputs live, and `OUT` is `docs/review-principles-2026-09-26/`. Phase 0 ran as four
sequential agents – static (§A), engine runtime (§B), browser (§C), gates (§D) – with no other review agent
running, so every timing in it was taken serially.

## §A – Static baseline (Phase 0a)

All commands in §A ran from `/Users/letulip/Projects/Claude/tb-review` at `03d92221`, output redirected to a
file under `RAW` with an `X_EXIT=$?` sentinel appended inside the command; every verdict below was read from
a file carrying `X_EXIT=0`.

### §A0 Provenance

| item | value | command |
| --- | --- | --- |
| HEAD | `03d92221b5d1954e0855eba51368327435d5dd17` (2026-09-25 21:20 +0800, "Merge pull request #158 from letulip/rig/parity-wake") | `git -C …/tb-review rev-parse HEAD`; `git log -1` |
| worktree state | clean (the only untracked path is `docs/review-principles-2026-09-26/probes/`, the probe copies this review runs from) | `git status --short` |
| shared checkout | branch `review/principles-2026-09-26`; `git diff --stat 03d92221 HEAD -- src tests tools scripts e2e` is empty | `git -C …/ties-break rev-parse --abbrev-ref HEAD`; `git diff --stat` |
| node / npm | v26.5.0 / 11.17.0 | `node -v`; `npm -v` |
| toolchain in `node_modules` | vite 7.3.6 · vue 3.5.40 · typescript 5.9.3 · vue-tsc 3.3.7 · vitest 3.2.7 · vite-plugin-pwa 1.3.0 · Playwright 1.62.1 | `node -p "require('./node_modules/<p>/package.json').version"`; `npx playwright --version` |
| machine | Apple M4, 10 CPUs (4 performance + 6 efficiency), 17,179,869,184 bytes (16 GiB) memory, macOS 26.5.1 | `sysctl -n hw.ncpu hw.memsize machdep.cpu.brand_string hw.perflevel0.physicalcpu hw.perflevel1.physicalcpu`; `sw_vers` |
| load at start of 0a | `9:21 up 12 days, 20:33, 2 users, load averages: 2.86 3.83 3.63` | `uptime` |
| load before the jscpd runs | `9:25 … load averages: 2.33 3.12 3.37` | `uptime` |
| load before `vite build` | `9:27 … load averages: 3.02 3.10 3.34` (sourcemap build, 9:28: `2.83 3.04 3.30`) | `uptime` at the head of `RAW/build/vite-build.log` / `vite-build-sourcemap.log` |
| load at end of 0a measurements | `9:29 … load averages: 3.57 3.19 3.34` | `uptime` |

The 1-minute load average stayed below 6 throughout §A. The one timing in §A (the `vite build`, §A5) is
incidental; gate timings are §D's.

External tools used in §A, each as `npx --yes <tool>@<exact version>` (installed under `~/.npm/_npx`,
nothing in the repository): `jscpd@5.1.2` (`npx --yes jscpd@5.1.2 --version` → `jscpd 5.1.2`),
`source-map-explorer@2.5.3` (the current release, `npm view source-map-explorer version` → `2.5.3`).

Probes written for §A, all in `OUT/probes/` (copied to the same relative path in the worktree to run):

| probe | what it does |
| --- | --- |
| `line-classifier.mjs` | blank / comment / code per line (rules in §A2); `--areas <json>` prints the per-area table |
| `import-graph.mjs` | the src import graph, layer matrix, SCCs, fan-in/out, `world.ts` exports (rules in §A3) |
| `jscpd-rank.mjs` | ranks a jscpd JSON report: per-format stats, largest pairs, multi-site clusters (§A4) |
| `precache-composition.mjs` | the built precache manifest by type, folder and size; JS/CSS chunks raw and gzip (§A5) |
| `bundle-composition.mjs` | source-map-explorer JSON grouped by src area and node_modules package (§A5) |

### §A1 The brief's §4 table, verified row by row

| fact | brief value | measured value | command | match |
| --- | --- | --- | --- | --- |
| `src` files (`.ts`/`.vue`) | 297 | 297 (211 `.ts` + 86 `.vue`; plus `src/style.css`, which the brief's count excludes) | `git ls-files src` by extension | ✅ |
| code vs comment lines | 67,550 vs 101,818 – 60.1 % comments | 67,550 vs 101,818 – 60.1 % (blank 7,722), over the 297 `.ts`/`.vue` files | `node OUT/probes/line-classifier.mjs --json RAW/lines/src.json src`, `style.css` excluded | ✅ exact. With `style.css`: 70,631 vs 104,241, 59.6 % |
| engine leaf modules 72 % | 72 % | 72.1 % for the 27 engine-root files **including** `world.ts`; 72.7 % for the 26 without it | `line-classifier.mjs --areas` | ✅ (the brief's figure includes `world.ts`) |
| `shared` 76 % | 76 % | 75.9 % (`shared/` root 63.1 %, `shared/protocol/` 78.6 %) | same | ✅ |
| `economy.ts` | 8,911 (1,480 / 7,306) | 8,911 (1,480 / 7,306) | same | ✅ |
| `world/lifeBeat.ts` | 8,003 (1,969 / 5,789) | 8,003 (1,969 / 5,789) | same | ✅ |
| `MoneyScreen.vue` | 4,913 | 4,913 (2,259 / 2,336) | same | ✅ |
| `world/smallTalkCorpus.ts` | 3,970 | 3,970 (3,883 / 85) | same | ✅ |
| `HomeScreen.vue` | 3,405 | 3,405 (1,482 / 1,691) | same | ✅ |
| `migrations.ts` | 3,311 | 3,311 (882 / 2,328) | same | ✅ |
| `SeasonScreen.vue` | 3,147 | 3,147 (1,474 / 1,474) | same | ✅ |
| `world/coachMarket.ts` | 3,045 | 3,045 (780 / 2,164) | same | ✅ |
| `world.ts` | 2,878 | 2,878 (953 / 1,854) | same | ✅ |
| `offers.ts` | 2,671 | 2,671 (958 / 1,600) | same | ✅ |
| largest-files list, completeness | the ten above | the same ten are the ten largest `.ts`/`.vue`; `src/style.css` (6,156) would rank third if CSS counted | same | ⚠ the list excludes `style.css` by the brief's file scope |
| files importing the `engine/world` barrel | 747 | 747 (src 71 · tests 451 · tools 225 · scripts 0 · e2e 0) | `git grep -lE "from '[^']*/world'" -- src tests tools scripts e2e \| wc -l`, and per root | ✅ – but ⚠ the regex also matches prose: 3 of the 71 src hits are comment-only (`engine/condition.ts:10`, `engine/ending.ts:34`, `engine/world.ts:228/636/647`). Anchored on statements (`^\s*(import\|export\|\}).*from '[^']*/world'`): **741** (src 68 · tests 448 · tools 225). The AST graph (§A3) agrees on src: 68 modules import `world.ts` |
| `rngFromSeed(` call sites in `src/engine` | 130 | 130 lines contain `rngFromSeed(` (131 matches, 45 files); of those lines, 117 are not comment lines, 1 of which is the definition (`src/engine/rng.ts:31`) – **116 code call lines** | `git grep -c "rngFromSeed(" -- src/engine` summed; `git grep -o … \| wc -l`; `git grep -hE … \| grep -vE "^\s*(//\|\*\|/\*)" \| wc -l` | ✅ on the brief's command; ⚠ 14 of the 130 are comments |
| `roll*` exports in `lifeBeat.ts` | 9 | 9 (`rollArrival` 5098, `rollSmallTalk` 5672, `rollEnds` 5919, `rollLeak` 6286, `rollWedding` 6593, `rollSpouseView` 6840, `rollPregnancy` 7181, `rollPregnancyLoss` 7830, `rollBereavement` 7995) | `git grep -nE "^export (function\|const) roll" -- src/engine/world/lifeBeat.ts` | ✅ |
| `Record<Temperament …>` voice pools in `src` | 30 | 30 lines (`lifeBeat.ts` 17 · `diary/weekNotes.ts` 10 · `world/albumCorpus.ts` 2 · `kidLife.ts` 1); 27 of them are not comment lines | `git grep -c "Record<Temperament" -- src` | ✅ on the command; ⚠ 3 are comments |
| test files | 607 | 607 `tests/**/*.test.ts` (component 221 · sim project 13 per `HEAVY_SIM_FILES` · unit projects 373, of which 25 `HEAVY_UNIT_FILES`); plus 28 non-test `.ts` helpers in `tests/` | `git ls-files 'tests/*.test.ts' \| wc -l`; `scripts/heavy-tests.mjs` exports | ✅ |
| `it(` blocks | 8,827 | 8,827 lines matching `(^\|[^A-Za-z0-9_.])it\(` in `tests/**/*.test.ts`; 8,860 counting `it.each(`/`it.skip(`/…; the bare substring `it(` gives 9,290 (it also hits `submit(`, `wait(` …) | `git grep -cE … -- 'tests/*.test.ts'` summed | ✅ |
| e2e | 30 specs / 134 tests | 30 spec files; **134 tests in 30 files** (132 in project `chromium`, 2 in `chromium-sw`) | `npx playwright test --list` (lists, runs nothing) | ✅ |
| golden saves | 90 files / 34 MB | 90 `v0.json`…`v89.json` + 1 `README.md` in `tests/fixtures/saves/`; `du -sh` 34M, `du -sk` 35,044 KiB | `git ls-files tests/fixtures/saves`; `du` | ✅ |
| `tools/` | 55 live + 211 archival, all typechecked by `check:tools` | 266 `tools/**/*.ts`: 55 live, 211 archival (`tools registry: ok – 55 live, 211 archival`); `tsconfig.tools.json` includes `tools/**/*.ts`, i.e. all 266; plus 4 `.mjs`, 2 `.html`, 1 `.sh`, 2 `.md`, 2 `.json` outside the TS count | `node scripts/tools-registry.mjs --check` (read-only); `cat tsconfig.tools.json` | ✅ |
| gates (unit ≈ 7.5 min, sim ≈ 8 min, e2e ≈ 1.3 min) | 25.09 belt logs | measured in §D | – | – |
| install size | 16,367 of 16,384 KiB – 17 KiB headroom | `install size: ok – 16367 KiB in 362 precache entries, 17 KiB under the 16384 KiB ceiling (+46 KiB of worker scripts outside the manifest; dist built 2026-09-26 09:27:30)` | `npx vite build`, then `node scripts/install-size.mjs` (§A5) | ✅ |
| docs | 465 markdown files | 465 (all tracked) | `find docs -name '*.md' \| wc -l`; `git ls-files 'docs/*.md' \| wc -l` | ✅ |

### §A2 Size and comments

**The classifier** (`OUT/probes/line-classifier.mjs`; files = `git ls-files <root>` with extension
`.ts .mts .mjs .js .vue .css`). Per physical line, after trimming:

1. **blank** – the line is empty.
2. **comment** – the line is inside a block comment (`/* … */` or `<!-- … -->`) opened on an earlier line;
   the closing line counts as comment.
3. **comment** – the line starts with `//`, `/*`, `*` or `<!--`; an unclosed `/*` or `<!--` opens a block
   (rule 2).
4. **code** – everything else, including code with a trailing comment; a code line that opens an unclosed
   `/*` (outside a `'…'`, `"…"` or `` `…` `` literal on that line) or `<!--` opens a block.

Comment share = comment ÷ (code + comment), i.e. of non-blank lines. The probe also prints a
"prefix-only" count (rule 3 without block state): over src it gives 79,991 code / 94,881 comment (54.3 %)
with `style.css`, because it counts the bodies of `<!-- -->` and CSS `/* */` blocks as code; the block-state
count is the one that reproduces the brief's 67,550 / 101,818 exactly. Reproduce with
`node OUT/probes/line-classifier.mjs --json <out.json> src` then `node OUT/probes/line-classifier.mjs --areas <out.json>`.

**Per area of `src`** (298 files incl. `style.css`):

| area | files | code | comment | blank | comment share |
| --- | ---: | ---: | ---: | ---: | ---: |
| engine root leaf modules (excl. `world.ts`) | 26 | 7,436 | 19,814 | 1,013 | 72.7 % |
| `engine/world.ts` (the integration core) | 1 | 953 | 1,854 | 71 | 66.0 % |
| `engine/world/` | 60 | 18,455 | 30,414 | 1,389 | 62.2 % |
| `engine/match/` | 10 | 1,017 | 1,089 | 175 | 51.7 % |
| `engine/season/` | 11 | 1,954 | 5,265 | 233 | 72.9 % |
| `engine/diary/` | 6 | 2,623 | 2,081 | 111 | 44.2 % |
| `worker/` | 2 | 598 | 537 | 34 | 47.3 % |
| `shared/` (root) | 7 | 644 | 1,100 | 105 | 63.1 % |
| `shared/protocol/` | 11 | 1,705 | 6,280 | 234 | 78.6 % |
| `db/` | 2 | 391 | 136 | 53 | 25.8 % |
| `stores/` | 1 | 619 | 283 | 6 | 31.4 % |
| `composables/` | 44 | 3,470 | 6,019 | 482 | 63.4 % |
| `components/` (root) | 44 | 12,562 | 10,950 | 1,700 | 46.6 % |
| `components/screens/` | 12 | 8,947 | 8,754 | 1,269 | 49.5 % |
| `components/ui/` | 16 | 834 | 861 | 107 | 50.8 % |
| `components/album/` | 14 | 1,065 | 380 | 141 | 26.3 % |
| `prologue/` | 5 | 1,007 | 1,491 | 123 | 59.7 % |
| `art/` | 9 | 627 | 1,143 | 113 | 64.6 % |
| `audio/` | 3 | 329 | 189 | 50 | 36.5 % |
| `viz/` (incl. `viz/match/`) | 8 | 1,660 | 1,740 | 216 | 51.2 % |
| `pwa.ts` | 1 | 45 | 91 | 9 | 66.9 % |
| `App.vue` | 1 | 586 | 1,314 | 80 | 69.2 % |
| `style.css` | 1 | 3,081 | 2,423 | 652 | 44.0 % |
| `main.ts`, `buildStamp.ts`, `vite-env.d.ts` | 3 | 23 | 33 | 8 | 58.9 % |
| **engine, all** | 114 | 32,438 | 60,517 | 2,992 | 65.1 % |
| **engine root incl. `world.ts`** | 27 | 8,389 | 21,668 | 1,084 | 72.1 % |
| **shared, all** | 18 | 2,349 | 7,380 | 339 | 75.9 % |
| **components, all** | 86 | 23,408 | 20,945 | 3,217 | 47.2 % |
| **UI side** (stores + composables + components + prologue + art + audio + viz + pwa + App/main/buildStamp/vite-env + style.css) | 162 | 34,855 | 35,671 | 4,956 | 50.6 % |
| **src total** (298 files) | 298 | 70,631 | 104,241 | 8,374 | 59.6 % |
| **src `.ts`/`.vue` only** (297, the brief's scope) | 297 | 67,550 | 101,818 | 7,722 | 60.1 % |

Command: `node OUT/probes/line-classifier.mjs --areas RAW/lines/src.json` (output `RAW/lines/areas.md`).

**Top 30 `src` files by total lines** (same command, `RAW/lines/src.json` sorted):

| # | file (under `src/`) | total | code | comment | comment share |
| ---: | --- | ---: | ---: | ---: | ---: |
| 1 | `engine/economy.ts` | 8,911 | 1,480 | 7,306 | 83.2 % |
| 2 | `engine/world/lifeBeat.ts` | 8,003 | 1,969 | 5,789 | 74.6 % |
| 3 | `style.css` | 6,156 | 3,081 | 2,423 | 44.0 % |
| 4 | `components/screens/MoneyScreen.vue` | 4,913 | 2,259 | 2,336 | 50.8 % |
| 5 | `engine/world/smallTalkCorpus.ts` | 3,970 | 3,883 | 85 | 2.1 % |
| 6 | `components/screens/HomeScreen.vue` | 3,405 | 1,482 | 1,691 | 53.3 % |
| 7 | `engine/migrations.ts` | 3,311 | 882 | 2,328 | 72.5 % |
| 8 | `components/screens/SeasonScreen.vue` | 3,147 | 1,474 | 1,474 | 50.0 % |
| 9 | `engine/world/coachMarket.ts` | 3,045 | 780 | 2,164 | 73.5 % |
| 10 | `engine/world.ts` | 2,878 | 953 | 1,854 | 66.0 % |
| 11 | `engine/offers.ts` | 2,671 | 958 | 1,600 | 62.5 % |
| 12 | `engine/world/state.ts` | 2,461 | 191 | 2,255 | 92.2 % |
| 13 | `components/MatchViewer.vue` | 2,416 | 1,078 | 1,169 | 52.0 % |
| 14 | `engine/world/snapshot.ts` | 2,399 | 1,027 | 1,342 | 56.6 % |
| 15 | `engine/season/calendar.ts` | 2,182 | 476 | 1,666 | 77.8 % |
| 16 | `engine/diary/weekNotes.ts` | 2,159 | 1,188 | 923 | 43.7 % |
| 17 | `components/TournamentFlow.vue` | 2,136 | 1,042 | 963 | 48.0 % |
| 18 | `viz/commentary.ts` | 2,108 | 864 | 1,144 | 57.0 % |
| 19 | `App.vue` | 1,980 | 586 | 1,314 | 69.2 % |
| 20 | `components/OnboardingWizard.vue` | 1,849 | 1,284 | 392 | 23.4 % |
| 21 | `components/PrologueCard.vue` | 1,794 | 838 | 800 | 48.8 % |
| 22 | `engine/world/birthday.ts` | 1,786 | 765 | 980 | 56.2 % |
| 23 | `components/WeekRecapCard.vue` | 1,669 | 581 | 976 | 62.7 % |
| 24 | `engine/spirit.ts` | 1,662 | 306 | 1,298 | 80.9 % |
| 25 | `engine/world/sponsors.ts` | 1,589 | 432 | 1,116 | 72.1 % |
| 26 | `engine/world/ladder.ts` | 1,583 | 412 | 1,111 | 72.9 % |
| 27 | `shared/protocol/offers.ts` | 1,532 | 306 | 1,180 | 79.4 % |
| 28 | `engine/world/endings.ts` | 1,521 | 453 | 1,023 | 69.3 % |
| 29 | `engine/world/albumBook.ts` | 1,468 | 753 | 640 | 45.9 % |
| 30 | `components/screens/CoachMarketScreen.vue` | 1,445 | 499 | 862 | 63.3 % |

**The other roots** (same classifier, `node OUT/probes/line-classifier.mjs --json RAW/lines/<root>.json <root>`;
`tools/` split by the registry's own live/archival lists in `tools/README.md`, which `node scripts/tools-registry.mjs --check`
confirmed current; the generated files under `tools/generated/` are `.json`/`.md` and outside the classifier's
extensions):

| root / part | files | total | code | comment | blank | comment share |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| `tests/` all | 635 | 256,221 | 149,015 | 90,857 | 16,349 | 37.9 % |
| – `tests/component/*.test.ts` | 221 | 75,068 | 45,875 | 23,846 | 5,347 | 34.2 % |
| – other `*.test.ts` (unit + sim projects) | 386 | 171,606 | 101,373 | 59,471 | 10,762 | 37.0 % |
| – non-test helpers (`tests/helpers/`, `tests/worldSource.ts` …) | 28 | 9,547 | 1,767 | 7,540 | 240 | 81.0 % |
| `tools/` all | 270 | 100,700 | 70,769 | 24,639 | 5,292 | 25.8 % |
| – live `.ts` (registry) | 55 | 35,352 | 23,641 | 10,012 | 1,699 | 29.8 % |
| – archival `.ts` (registry) | 211 | 64,751 | 46,729 | 14,469 | 3,553 | 23.6 % |
| – `.mjs` probes (`header-probe`, `precache-delta`, `runoff-probe`, `strip-wrap-probe`) | 4 | 597 | 399 | 158 | 40 | 28.4 % |
| `scripts/` (21 `.mjs` + 5 `.d.mts`) | 26 | 5,141 | 2,767 | 2,026 | 348 | 42.3 % |
| `e2e/` all | 34 | 11,738 | 5,027 | 5,837 | 874 | 53.7 % |
| – `*.spec.ts` | 30 | 10,459 | 4,528 | 5,153 | 778 | 53.2 % |
| – helpers (`careerAt.ts` …) | 4 | 1,279 | 499 | 684 | 96 | 57.8 % |

Output: `RAW/lines/summary.txt`, `RAW/lines/roots.txt`.

**Tests, fixtures, docs**:

| item | value | command |
| --- | --- | --- |
| test files | 607 `*.test.ts` (component 221, sim 13, unit 373 incl. 25 heavy-unit) | `git ls-files 'tests/*.test.ts'`; `HEAVY_SIM_FILES` / `HEAVY_UNIT_FILES` lengths from `scripts/heavy-tests.mjs` |
| `it(` blocks | 8,827 (8,860 incl. `it.<modifier>(`) | `git grep -cE "(^\|[^A-Za-z0-9_.])it\(" -- 'tests/*.test.ts'` summed |
| e2e | 30 specs, 134 tests (chromium 132, chromium-sw 2) | `npx playwright test --list` → `Total: 134 tests in 30 files` |
| golden save fixtures | 90 (`v0`…`v89`) + README; 35,044 KiB (`du -sh` 34M) | `git ls-files tests/fixtures/saves`; `du -sk tests/fixtures/saves` |
| all `tests/fixtures/` | 93 files, 35,132 KiB | `git ls-files tests/fixtures`; `du -sk` |
| e2e `.tsave` fixtures | 13 files, 900,222 bytes (879 KiB; `du -ck` 900) | `git ls-files 'e2e/*.tsave'` → `stat -f %z` summed |
| docs markdown | 465 | `find docs -name '*.md' \| wc -l` |

### §A3 Import graph and cycles

**The probe** (`OUT/probes/import-graph.mjs`, run as `node docs/review-principles-2026-09-26/probes/import-graph.mjs RAW/graph`
in the worktree; it parses with the repo's own `typescript` 5.9.3, so imports inside comments are never
counted). Rules: every tracked `src/**/*.ts` and every `<script>` block of `src/**/*.vue`; edges from
`import … from`, side-effect `import '…'`, `export … from`, `import x = require()`, `import('…')` and
`import('…')` type nodes. **Type-only** = `import type`, `export type … from`, or a named import/export
whose every specifier is inline-`type` with no default or namespace binding; everything else is runtime
(syntax only). Relative specifiers resolve to the exact file, then `.ts`, `.vue`, `.d.ts`, `.js→.ts`,
`/index.ts`; a non-module target (css, svg …) is an asset edge. One edge per (importer, target) pair,
runtime if any of its statements is. Layers: `engine worker shared db stores composables components
prologue art audio viz pwa other` (`pwa` = `src/pwa.ts`; `other` = `App.vue`, `main.ts`, `buildStamp.ts`,
`vite-env.d.ts`). Full edge list: `RAW/graph/edges.json`; SCCs: `RAW/graph/sccs.json`.

Totals: 297 files, 2,113 import / export-from statements → **1,928 module pair edges (1,561 runtime,
367 type-only)**, 1 asset edge (`main.ts → ./style.css`), 0 unresolved relative specifiers, **0 dynamic
`import()`** anywhere in src.

**Layer matrix** – rows import columns; each cell `runtime / type-only` unique file-pair edges; `·` = none.

| from \ to | engine | worker | shared | db | stores | composables | components | prologue | art | audio | viz | pwa | other |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| **engine** | 740 / 152 | · | 58 / 49 | · | · | · | · | · | · | · | · | · | · |
| **worker** | 5 / 0 | · | 2 / 0 | 1 / 0 | · | · | · | · | · | · | · | · | · |
| **shared** | 0 / 20 | · | 9 / 31 | · | · | · | · | · | · | · | · | · | · |
| **db** | 1 / 1 | · | 1 / 0 | 1 / 0 | · | · | · | · | · | · | · | · | · |
| **stores** | 0 / 1 | 1 / 0 | 1 / 0 | · | · | · | · | · | · | · | · | · | · |
| **composables** | 23 / 13 | · | 10 / 10 | · | 13 / 0 | 16 / 3 | · | · | 2 / 0 | 2 / 0 | 0 / 4 | · | 1 / 0 |
| **components** | 86 / 20 | · | 94 / 34 | 1 / 0 | 37 / 0 | 100 / 1 | 187 / 0 | 9 / 2 | 32 / 0 | 16 / 0 | 10 / 4 | · | · |
| **prologue** | 8 / 2 | · | 5 / 3 | · | · | · | · | 3 / 1 | · | · | · | · | · |
| **art** | 6 / 3 | · | 3 / 4 | · | 1 / 0 | 1 / 0 | · | 0 / 1 | 8 / 0 | · | · | · | · |
| **audio** | · | · | · | · | · | · | · | · | · | 1 / 0 | · | · | · |
| **viz** | 7 / 5 | · | 1 / 1 | · | · | · | · | · | · | · | 7 / 2 | · | · |
| **pwa** | · | · | · | · | · | · | · | · | · | · | · | · | · |
| **other** | 1 / 0 | · | 1 / 0 | · | 1 / 0 | 10 / 0 | 32 / 0 | · | 1 / 0 | 2 / 0 | · | 2 / 0 | 1 / 0 |

UI-side runtime edges into `engine/` (the UI importing engine values directly, not only `Snapshot`
types): composables 23, components 86, prologue 8, art 6, viz 7, `other` 1 – 131 runtime edges in all.
`shared/` imports the engine type-only (0 runtime / 20 type-only).

**External packages per layer** (statements, runtime / type-only): stores `pinia` 1/0 · composables `vue`
21/1 · components `vue` 60/0 · art `vue` 1/0 · pwa `vue` 1/0, `virtual:pwa-register` 1/0 · other `vue` 2/1,
`pinia` 1/0. engine, worker, shared, db import **no** external package.

**Edges against the intended direction** (engine / worker / shared / db → any UI layer, a `.vue` file,
`vue` or `pinia`; engine → worker / db / stores): **0 module edges, 0 package imports.** Cross-check:
`node scripts/engine-purity.mjs` → `engine purity: ok - src/engine, src/worker, src/db, src/shared import no vue/pinia and reach into no UI directory` (`X_EXIT=0`, `RAW/engine-purity.log`).

**Strongly connected components**

- Over **runtime** edges: **0** components of size > 1, and no self-loop. The runtime graph of src is acyclic.
- Over **all** edges (runtime + type-only): **1** component of size > 1, **107 files**, layers `engine` and
  `shared`. It has 839 internal edges (677 runtime, 162 type-only); 47 of them point into `engine/world.ts`,
  of which 1 is runtime. Members (full list in `RAW/graph/sccs.json`): `engine/academy.ts`, `engine/body.ts`,
  `engine/chemistry.ts`, `engine/childhood.ts`, `engine/coach.ts`, `engine/coachLoad.ts`,
  `engine/collegeLeague.ts`, `engine/collegeOffer.ts`, `engine/condition.ts`, `engine/development.ts`,
  `engine/diary.ts`, `engine/diary/{facts,pool,travelHome,travelNotes,weekNotes,words}.ts`,
  `engine/economy.ts`, `engine/ending.ts`, `engine/equipment.ts`, `engine/form.ts`, `engine/kidLife.ts`,
  `engine/knock.ts`, `engine/match/style.ts`, `engine/offers.ts`, `engine/plan.ts`, `engine/radar.ts`,
  `engine/saveGuard.ts`, `engine/season/{calendar,cohort,conveyor,fieldPros,prehistory,preview,ranking,rival,tournament}.ts`,
  `engine/spirit.ts`, `engine/world.ts`, `engine/world/age.ts` and 67 more (`engine/world/*` and `shared/*`).
  The cycle closes through type-only edges: with them removed no cycle remains.

**Fan-in and fan-out, top 15** – distinct src modules, `total (runtime / type-only)`:

| # | fan-in module | in | fan-out module | out |
| ---: | --- | ---: | --- | ---: |
| 1 | `shared/protocol.ts` | 132 (43 / 89) | `engine/world.ts` | 77 (75 / 2) |
| 2 | `engine/season/calendar.ts` | 76 (76 / 0) | `engine/world/snapshot.ts` | 63 (59 / 4) |
| 3 | `engine/world.ts` | 68 (20 / 48) | `App.vue` | 47 (47 / 0) |
| 4 | `engine/season/types.ts` | 67 (0 / 67) | `components/screens/SeasonScreen.vue` | 43 (39 / 4) |
| 5 | `engine/economy.ts` | 61 (61 / 0) | `components/TournamentFlow.vue` | 37 (35 / 2) |
| 6 | `engine/rng.ts` | 56 (52 / 4) | `components/screens/HomeScreen.vue` | 33 (32 / 1) |
| 7 | `shared/dates.ts` | 56 (56 / 0) | `engine/world/phaseHerWeek.ts` | 33 (30 / 3) |
| 8 | `stores/game.ts` | 52 (52 / 0) | `components/screens/MoneyScreen.vue` | 27 (27 / 0) |
| 9 | `engine/match/types.ts` | 47 (0 / 47) | `components/screens/CalendarScreen.vue` | 25 (24 / 1) |
| 10 | `engine/world/ledger.ts` | 37 (37 / 0) | `engine/world/endings.ts` | 25 (22 / 3) |
| 11 | `engine/world/constants.ts` | 36 (36 / 0) | `engine/world/planner.ts` | 25 (22 / 3) |
| 12 | `shared/money.ts` | 35 (35 / 0) | `engine/world/lifeBeat.ts` | 24 (20 / 4) |
| 13 | `shared/avatarEmotion.ts` | 33 (22 / 11) | `components/MatchViewer.vue` | 22 (19 / 3) |
| 14 | `engine/world/age.ts` | 28 (28 / 0) | `engine/world/coachMarket.ts` | 22 (20 / 2) |
| 15 | `engine/spirit.ts` | 25 (14 / 11) | `engine/world/college.ts` | 22 (19 / 3) |

**The barrel**

| root | files matching `from '[^']*/world'` (the brief's command) | statement-anchored (`^\s*(import\|export\|\}).*from '[^']*/world'`) |
| --- | ---: | ---: |
| `src` | 71 | 68 |
| `tests` (of which `tests/component/`: 170) | 451 | 448 |
| `tools` (live 47 · archival 178, by the registry) | 225 | 225 |
| `scripts` | 0 | 0 |
| `e2e` | 0 | 0 |
| **total** | **747** | **741** |

Commands: `git grep -lE "from '[^']*/world'" -- <root> | wc -l` and `git grep -lE "^\s*(import|export|\}).*from '[^']*/world'" -- <root> | wc -l`
(`RAW/barrel.txt`). The 3 src files the first form over-counts are comment-only hits: `engine/condition.ts:10`,
`engine/ending.ts:34`, `engine/world.ts:228/636/647`. Inside src the AST graph agrees: 68 modules import
`engine/world.ts` (20 runtime, 48 type-only).

**What `engine/world.ts` exports** (TypeScript AST of the file, `RAW/graph/world-exports.json`): **627 exported
names**, 627 distinct, no `export *`.

| exported from | values | types | total |
| --- | ---: | ---: | ---: |
| re-exported from `world/*` modules (49 of the 60 files in `engine/world/`) | 536 | 34 | 570 |
| re-exported from other engine modules (`./chemistry` 19, `./spirit` 7, `./condition` 4, `./season/calendar` 4, `./kidLife` 3) | 33 | 4 | 37 |
| declared in `world.ts` itself | 20 | 0 | 20 |

`world.ts`: 2,878 lines (953 code / 1,854 comment / 71 blank, §A2); 169 lines begin with `import` or
`export`; fan-out 77 modules (75 runtime). **What remains in it** besides imports and re-exports – top-level
declarations and the lines they span (a JSDoc above a declaration is outside its span):

| kind | count | lines spanned | members |
| --- | ---: | ---: | --- |
| exported functions | 15 | 1,209 | `createWorld` 1527–2065 (539) · `resumeFromCollege` 2610–2827 (218) · `advanceWeeks` 2408–2535 (128) · `skipEvent` 2314–2393 (80) · `tickWeek` 2223–2301 (79) · `seedWorldForV6` 2135–2171 (37) · `revealTournamentRound` 1274–1308 (35) · `skipTournament` 1311–1334 (24) · `endCollegeEarly` 2839–2862 (24) · `closeTournament` 1337–1354 (18) · `rankingDeltaSuffix` 702–708 · `prologueCoachTier` 1495–1501 · `replayMainState` 2081–2087 · `prologuePlayStyle` 1513–1515 · `maxMainDraws` 2130–2132 |
| internal functions | 4 | 564 | `finalizeTournament` 713–1246 (534) · `emitKidMatch` 1260–1270 · `taughtShareOf` 1466–1475 · `finishCollege` 2865–2873 |
| exported consts | 5 | 10 | `STARTING_FUNDS_CENTS` 616 · `PARENT_INCOME_CENTS` 621 · `PROLOGUE_COACH_LADDER` 1455–1459 · `MAIN_DRAWS_PER_WEEK_MAX` 2117 · `COLLEGE_REVEAL_REFUSAL` 2544–2545 |
| internal consts | 2 | 2 | `MAIN_DRAWS_PER_RIVAL` 2091 · `MAIN_DRAWS_FLAT_PER_WEEK` 2111 |

The kinds of code left: world creation (`createWorld`, `seedWorldForV6`, the prologue coach helpers), the
tournament finish (`finalizeTournament` and its reveal / skip / close commands), the week-advance commands
(`tickWeek`, `advanceWeeks`, `skipEvent`), the college exit (`resumeFromCollege`, `endCollegeEarly`,
`finishCollege`) and the MAIN-stream draw bookkeeping (`replayMainState`, `maxMainDraws` and its constants).

### §A4 Duplication – raw jscpd runs

**The 05.09 method, reproduced.** `docs/review-principles-2026-09-05/05-duplication.md:17-21` records
`jscpd 5.1.2` (run there as `jscpd@latest`, which resolved to 5.1.2) with these flags; here the version is
pinned:

```
npx --yes jscpd@5.1.2 --workers 2 --no-tips --no-colors --skip-comments --reporters json,console \
  --output RAW/jscpd/<run> --min-tokens 60 --min-lines 6 --format typescript,vue,css,javascript <root>
```

and the lower-threshold pass on `src` with `--min-tokens 30 --min-lines 4` (the same values 05.09 used for its
LOW pass). One run per root; 05.09 ran `scripts` + `e2e` as one run, so that combination is repeated for the
comparison. Reports: `RAW/jscpd/<run>/jscpd-report.json` and `RAW/jscpd/<run>.console.txt` (each ends
`X_EXIT=0`); ranking: `node OUT/probes/jscpd-rank.mjs RAW/jscpd/<run>/jscpd-report.json <prefix> 20` →
`RAW/jscpd/rank.md`. As at 05.09, jscpd splits an SFC into `typescript` (script), `html` (template) and `css`
(style) sub-blocks and also scans it whole as `vue`; the `html` format tokenises coarsely and its figures
carry the caveats 05.09 recorded (it does not strip `<!-- -->`, and in the LOW run it reports whole script
blocks as `1-N` ranges).

| run | files | lines | clones | duplicated lines | duplicated tokens | 05.09 at `98e3560b` (files / lines / clones / dup lines) |
| --- | ---: | ---: | ---: | ---: | ---: | --- |
| `src` 60/6 | 490 (266 ts · 81 html · 59 css · 84 vue) | 289,557 | 34 | 563 (**0.19 %**) | 3,175 (0.39 %) | 408 / 215,512 / 29 / 488 (**0.23 %**) |
| – typescript | 266 | 148,444 | 13 | 270 (0.18 %) | 1,211 (0.32 %) | 229 / 99,760 / 8 / 91 (0.09 %) |
| – css | 59 | 42,965 | 12 | 203 (0.47 %) | 960 (1.34 %) | 46 / 34,995 / 9 / 134 (0.38 %) |
| – html | 81 | 49,047 | 9 | 90 (0.18 %) | 1,004 (0.71 %) | 65 / 40,336 / 12 / 263 (0.65 %) |
| – vue (whole file) | 84 | 49,101 | 0 | 0 | 0 | 68 / – / 0 / 0 |
| `tests` 60/6 | 634 | 255,544 | 610 | 9,941 (**3.89 %**) | 62,079 (4.29 %) | 376 / 151,504 / 332 / 5,061 (**3.34 %**) |
| `tools` 60/6 | 269 (265 ts · 4 mjs) | 100,636 | 267 | 2,831 (**2.81 %**) | 24,931 (3.20 %) | 189 / 64,207 / 192 / 1,958 (**3.05 %**) |
| `scripts` 60/6 | 23 | 5,082 | 2 | 29 (0.57 %) | 215 (0.96 %) | (with e2e) |
| `e2e` 60/6 | 34 | 11,738 | 21 | 339 (2.89 %) | 1,770 (4.04 %) | (with scripts) |
| `scripts` + `e2e` 60/6, one run | 57 | 16,820 | 23 | 368 (**2.19 %**) | 1,985 (3.00 %) | 37 / 9,411 / 14 / 166 (**1.76 %**) |
| `src` LOW 30/4 | 520 (286 ts · 86 html · 62 css · 86 vue) | 291,835 | 424 | 9,760 (**3.34 %**) | 18,390 (2.25 %) | 425 / 217,192 / 344 / 5,930 (**2.73 %**) |
| – typescript | 286 | 149,114 | 199 | 1,801 (1.21 %) | 8,664 (2.29 %) | 241 / 100,232 / 163 / 1,261 (1.26 %) |
| – css | 62 | 44,209 | 128 | 1,131 (2.56 %) | 5,360 (7.45 %) | 48 / 36,017 / 100 / 863 (2.40 %) |
| – html | 86 | 49,322 | 97 | 6,828 (13.84 %) | 4,366 (3.09 %) | 68 / 40,522 / 81 / 3,806 (9.39 %) |

jscpd's `lines` count every physical line of the scanned files (comments included), so its totals differ
from §A2's.

**The 20 largest clone pairs per root, by tokens** (each row is one pair – both spans; line numbers are
file-absolute, SFC sub-blocks included). Multi-site clusters follow each table: connected components of
clone fragments, joined when two fragments are the sides of one pair or overlap in the same file.

`src` (60/6):

| # | tok | lines | format | first | second |
| ---: | ---: | ---: | --- | --- | --- |
| 1 | 239 | 18 | html | `src/components/TournamentFlow.vue:1345-1362` | `src/components/TournamentFlow.vue:1402-1419` |
| 2 | 150 | 35 | typescript | `src/components/BirthdayDialog.vue:86-120` | `src/components/LifeBeatDialog.vue:199-228` |
| 3 | 145 | 12 | html | `src/components/OnboardingWizard.vue:409-420` | `src/components/PrologueCard.vue:535-546` |
| 4 | 133 | 20 | typescript | `src/components/BirthdayDialog.vue:90-109` | `src/components/KnockDialog.vue:66-85` |
| 5 | 123 | 11 | html | `src/components/OnboardingWizard.vue:429-439` | `src/components/PrologueCard.vue:568-577` |
| 6 | 122 | 7 | typescript | `src/engine/diary/pool.ts:631-637` | `src/engine/diary/pool.ts:634-641` |
| 7 | 115 | 25 | typescript | `src/components/MatchReplay.vue:35-59` | `src/components/PracticeFlow.vue:64-90` |
| 8 | 106 | 16 | css | `src/components/BirthdayDialog.vue:309-324` | `src/style.css:6105-6119` |
| 9 | 106 | 11 | typescript | `src/engine/world/sponsors.ts:1207-1217` | `src/engine/world/sponsors.ts:1259-1269` |
| 10 | 104 | 7 | html | `src/components/RailIdentity.vue:108-114` | `src/components/screens/HomeScreen.vue:1488-1494` |
| 11 | 100 | 15 | html | `src/components/PrologueCard.vue:756-770` | `src/components/PrologueCard.vue:797-811` |
| 12 | 98 | 13 | css | `src/components/PrologueCard.vue:1126-1138` | `src/components/PrologueCard.vue:1153-1169` |
| 13 | 95 | 13 | html | `src/components/PracticeFlow.vue:246-258` | `src/components/TournamentFlow.vue:1264-1276` |
| 14 | 93 | 9 | typescript | `src/engine/world/sponsors.ts:1209-1217` | `src/engine/world/sponsors.ts:1289-1301` |
| 15 | 92 | 14 | css | `src/components/BirthdayDialog.vue:311-324` | `src/components/LifeBeatDialog.vue:479-492` |
| 16 | 90 | 29 | css | `src/components/screens/CalendarScreen.vue:1243-1271` | `src/style.css:2366-2391` |
| 17 | 89 | 20 | typescript | `src/viz/commentary.ts:2038-2057` | `src/viz/commentary.ts:2085-2093` |
| 18 | 88 | 23 | typescript | `src/engine/world/college.ts:551-573` | `src/engine/world/college.ts:913-935` |
| 19 | 87 | 15 | css | `src/components/ForkDialog.vue:588-602` | `src/components/RetirementDialog.vue:458-472` |
| 20 | 85 | 43 | css | `src/components/SupportStaffTab.vue:946-988` | `src/style.css:5441-5476` |

Clusters: 28, of which 6 with ≥3 sites – `BirthdayDialog.vue:86-120` / `LifeBeatDialog.vue:199-228` /
`KnockDialog.vue:66-85` (4 sites, 3 files); `BirthdayDialog.vue:309-324` / `style.css:6105-6119` /
`LifeBeatDialog.vue:479-492` (4 sites, 3 files); `world/sponsors.ts:1207-1217` / `:1259-1269` / `:1289-1301`
(4 sites, 1 file); `CalendarScreen.vue:1243-1271` / `ThisWeekScreen.vue:457-474` / `style.css:2366-2391`
(4 sites, 3 files); `OfferLetter.vue:1085-1099` / `:1205-1223` (4 sites, 1 file); `diary/pool.ts:219-241`
(3 sites, 1 file).

`src` LOW (30/4) – its 20 largest pairs repeat 17 of the table above plus `PrologueCard.vue:534-540`↔`:567-577`
(132 tok, html) and `MatchControls.vue:124-128`↔`TournamentFlow.vue:1301-1302` (92 tok, html); full table in
`RAW/jscpd/rank.md`. Clusters: 204, of which 63 with ≥3 sites; the ten largest by sites:

| sites | files | max tok | sample spans |
| ---: | ---: | ---: | --- |
| 38 | 13 | 150 | `BirthdayDialog.vue:43-50`, `KnockDialog.vue:34-41`, `BirthdayDialog.vue:86-120`, `LifeBeatDialog.vue:199-228`, `KnockDialog.vue:66-85` … |
| 31 | 23 | 115 | `BracketTabs.vue:1-225`, `PrologueLocalOpen.vue:1-284`, `RankHelpDialog.vue:1-117`, `SkillsRadar.vue:51-232`, `TierGuide.vue:1-70` … (the html whole-script-block artefact) |
| 23 | 1 | 60 | `engine/diary/weekNotes.ts:1264-1269`, `:1269-1284`, `:1284-1289`, `:1299-1304`, `:1719-1724` … |
| 21 | 1 | 122 | `engine/diary/pool.ts:474-478`, `:481-492`, `:492-498`, `:516-522`, `:540-546` … |
| 19 | 5 | 66 | `ForkDialog.vue:524-530`, `RetirementDialog.vue:382-388`, `PrologueCard.vue:990-998`, `PrologueHandover.vue:188-196` … |
| 19 | 1 | 44 | `engine/diary/weekNotes.ts:1094-1099`, `:1099-1104`, `:1109-1114`, `:1119-1124` … |
| 17 | 2 | 48 | `screens/MoneyScreen.vue:3751-3758`, `:3801-3808`, `:3758-3768`, `:4189-4197` … |
| 16 | 1 | 35 | `engine/radar.ts:768-774`, `:774-780`, `:780-785`, `:818-822` … |
| 13 | 5 | 106 | `BirthdayDialog.vue:232-240`, `LifeBeatDialog.vue:398-406`, `style.css:6050-6057`, `style.css:6105-6119` … |
| 13 | 1 | 71 | `OfferLetter.vue:716-723`, `:789-796`, `:840-847`, `:946-953`, `:982-989`, `:1027-1034` … |

`tests` (60/6):

| # | tok | lines | first | second |
| ---: | ---: | ---: | --- | --- |
| 1 | 365 | 64 | `tests/component/round24-coach-card.test.ts:58-121` | `tests/component/round27-call-up-flow.test.ts:65-115` |
| 2 | 311 | 52 | `tests/component/a11y-sweep.test.ts:62-113` | `tests/component/round26-college-flow.test.ts:73-112` |
| 3 | 294 | 33 | `tests/wave3-stop-want.test.ts:393-425` | `tests/wave5-psy-counsel.test.ts:174-202` |
| 4 | 290 | 43 | `tests/round32-brand-inertia.test.ts:85-127` | `tests/round32-brand-multiple.test.ts:60-103` |
| 5 | 244 | 40 | `tests/component/injury-cancelled-row.test.ts:96-135` | `tests/injury-report.test.ts:52-92` |
| 6 | 240 | 46 | `tests/component/round31-week-entry.test.ts:71-116` | `tests/component/round33-tournament-arrival.test.ts:38-78` |
| 7 | 230 | 44 | `tests/wave8-birth.test.ts:98-141` | `tests/wave8-pause.test.ts:101-142` |
| 8 | 230 | 25 | `tests/round42-v78-schema.test.ts:136-160` | `tests/wave6-spotlight-habituation.test.ts:185-211` |
| 9 | 228 | 25 | `tests/round42-v78-schema.test.ts:136-160` | `tests/wave6-spotlight-pressure.test.ts:168-196` |
| 10 | 224 | 28 | `tests/component/injury-cancelled-row.test.ts:135-162` | `tests/injury-report.test.ts:92-120` |
| 11 | 223 | 35 | `tests/component/album-home-door.test.ts:22-56` | `tests/component/round42-coach-portrait.test.ts:100-132` |
| 12 | 216 | 37 | `tests/component/round24-college-shell.test.ts:94-130` | `tests/component/round26-college-card.test.ts:155-188` |
| 13 | 216 | 37 | `tests/component/round24-college-shell.test.ts:94-130` | `tests/component/wave3-graduated-portrait.test.ts:111-143` |
| 14 | 216 | 26 | `tests/component/r37-week-note-tilt.test.ts:113-138` | `tests/component/round36-pass2-shop-recap.test.ts:159-187` |
| 15 | 215 | 37 | `tests/wave8-birth.test.ts:98-134` | `tests/wave8-return-decision.test.ts:128-170` |
| 16 | 215 | 36 | `tests/component/round24-college-shell.test.ts:94-129` | `tests/round27-call-up-flow.test.ts:67-102` |
| 17 | 211 | 48 | `tests/wave12-parting.test.ts:190-237` | `tests/wave8-protected-rank.test.ts:123-158` |
| 18 | 203 | 44 | `tests/component/round24-coach-card.test.ts:58-101` | `tests/component/round36-error-surfaces.test.ts:46-70` |
| 19 | 200 | 44 | `tests/component/round24-coach-card.test.ts:58-101` | `tests/component/wave3-life-beat-freeze.test.ts:112-148` |
| 20 | 198 | 44 | `tests/component/round24-coach-card.test.ts:58-101` | `tests/component/round26-college-card.test.ts:65-104` |

Clusters: 221, of which 71 with ≥3 sites; the largest: 168 sites in 74 files (max 365 tok; e.g.
`component/a11y-sweep.test.ts:55-79`, `component/round24-academy-letter.test.ts:21-41`,
`component/round29-inbox-subjects.test.ts:42-71`, `component/round24-college-shell.test.ts:75-94`); 54 sites in
23 files (`component/r37-week-note-tilt.test.ts:56-82`, `component/round36-pass2-shop-recap.test.ts:37-64`,
`component/r39-owned-shelf-paid.test.ts:54-65`, `component/round29-shop-topup.test.ts:81-99`); 50 sites in 27
files (`wave12-parting.test.ts:137-155`, `wave3-arrival.test.ts:75-93`, `wave3-small-talk.test.ts:144-165`,
`wave4-ends.test.ts:115-136`); 49 sites in 20 files (`component/wave8-family-ending.test.ts:68-87`,
`wave11-loss.test.ts:80-89`, `wave11-window.test.ts:107-127`, `component/wave8-pregnancy-portrait.test.ts:73-89`);
28 sites in 11 files (`academy-notice.test.ts:53-76`, `academy.test.ts:45-69`, `conveyor.test.ts:14-33`,
`component/round21-coach-travel.test.ts:90-100`); 26 sites in 11 files (`round42-v78-schema.test.ts:126-148`,
`wave6-spotlight-schema.test.ts:125-147`, `wave4-spirit-shock.test.ts:125-148`, `spirit.test.ts:58-70`); 24 sites
in 12 files (`coachTiers.test.ts:96-104`, `condition.test.ts:526-534`, `economy.test.ts:805-815`,
`split-the-bill.test.ts:386-394`, `injuries.test.ts:341-352`).

`tools` (60/6):

| # | tok | lines | first | second |
| ---: | ---: | ---: | --- | --- |
| 1 | 299 | 25 | `tools/coach-eye-bench.ts:111-135` | `tools/what-money-buys.ts:101-126` |
| 2 | 294 | 25 | `tools/psy-grid.ts:229-253` | `tools/spotlight-bench.ts:180-203` |
| 3 | 259 | 19 | `tools/spirit-bench.ts:1193-1211` | `tools/spirit-bench.ts:3870-3889` |
| 4 | 255 | 21 | `tools/injury-landscape.ts:123-143` | `tools/rehab-lever.ts:84-102` |
| 5 | 245 | 27 | `tools/domestic-ladder-probe.ts:54-80` | `tools/domestic-season-to-date.ts:99-126` |
| 6 | 229 | 31 | `tools/form-bench.ts:72-102` | `tools/form-g-sweep.ts:140-163` |
| 7 | 220 | 11 | `tools/domestic-ladder-probe.ts:258-268` | `tools/domestic-season-to-date.ts:237-247` |
| 8 | 219 | 8 | `tools/season-equation.ts:1389-1396` | `tools/season-equation.ts:1477-1484` |
| 9 | 208 | 23 | `tools/r40-childhood-career-blast.ts:45-67` | `tools/r40-childhood-compounding.ts:62-89` |
| 10 | 205 | 17 | `tools/coach-eye-bench.ts:118-134` | `tools/wall-l1-bench.ts:132-148` |
| 11 | 195 | 51 | `tools/college-choice-probe.ts:44-94` | `tools/college-price-probe.ts:66-118` |
| 12 | 194 | 21 | `tools/r40-childhood-career-blast.ts:49-69` | `tools/r40-handover-realisation-cuts.ts:56-79` |
| 13 | 190 | 23 | `tools/life-arrival.ts:1538-1560` | `tools/spotlight-bench.ts:791-813` |
| 14 | 189 | 25 | `tools/header-probe.mjs:5-29` | `tools/runoff-probe.mjs:19-44` |
| 15 | 179 | 19 | `tools/ladder-vs-targets.ts:141-159` | `tools/what-money-buys.ts:131-145` |
| 16 | 159 | 24 | `tools/psy-grid.ts:552-575` | `tools/spotlight-bench.ts:312-332` |
| 17 | 155 | 18 | `tools/acceptance-cuts.ts:298-315` | `tools/college-fork.ts:300-316` |
| 18 | 153 | 25 | `tools/college-fork.ts:40-64` | `tools/junior-access.ts:37-61` |
| 19 | 150 | 16 | `tools/prologue-balance-bench.ts:82-97` | `tools/prologue-handover-bench.ts:31-46` |
| 20 | 147 | 22 | `tools/psy-grid.ts:207-228` | `tools/spotlight-bench.ts:160-180` |

Clusters: 129, of which 31 with ≥3 sites; the largest: 94 sites in 52 files (max 153 tok;
`acceptance-cuts.ts:52-63`, `calendar-shape.ts:23-31`, `college-fork.ts:49-59`, `aer-cohort.ts:22-30`,
`ceiling-walk.ts:63-73`); 24 sites in 6 files (`coach-eye-bench.ts:106-135`, `ladder-vs-targets.ts:101-124`,
`what-money-buys.ts:101-126`); 24 sites in 14 files (`birthday-pool.ts:35-43`, `college-news-probe.ts:36-43`,
`college-year-content.ts:40-46`, `college-choice-probe.ts:44-94`, `college-price-probe.ts:66-118`); 11 sites in 7
files (`big-rung-odds.ts:56-65`, `college-freeze-probe.ts:94-103`, `two-seasons-read.ts:42-51`,
`ceiling-walk.ts:83-96`, `points-economy.ts:97-111`); 11 sites in 7 files (`dead-week-probe.ts:83-99`,
`ladder-floor.ts:222-237`, `outgrown-entry-probe.ts:115-135`, `r34-calendar-tiers.ts:61-72`).

`scripts` (60/6) – only 2 pairs, one 4-site cluster in 3 files:

| # | tok | lines | first | second |
| ---: | ---: | ---: | --- | --- |
| 1 | 128 | 18 | `scripts/pin-ratchet.mjs:46-63` | `scripts/tools-registry.mjs:60-77` |
| 2 | 87 | 13 | `scripts/context-audit.mjs:170-182` | `scripts/pin-ratchet.mjs:50-62` |

`e2e` (60/6):

| # | tok | lines | first | second |
| ---: | ---: | ---: | --- | --- |
| 1 | 137 | 30 | `e2e/psychologist.spec.ts:250-279` | `e2e/spotlight.spec.ts:283-310` |
| 2 | 127 | 11 | `e2e/careerAt.ts:372-382` | `e2e/careerAt.ts:449-459` |
| 3 | 125 | 54 | `e2e/psychologist.spec.ts:110-163` | `e2e/spotlight.spec.ts:144-187` |
| 4 | 120 | 16 | `e2e/elite-gate.spec.ts:144-159` | `e2e/elite-gate.spec.ts:231-245` |
| 5 | 95 | 23 | `e2e/psychologist.spec.ts:185-207` | `e2e/spotlight.spec.ts:190-211` |
| 6 | 95 | 18 | `e2e/psychologist.spec.ts:213-230` | `e2e/spotlight.spec.ts:254-285` |
| 7 | 87 | 11 | `e2e/parity.spec.ts:1252-1262` | `e2e/parity.spec.ts:1393-1409` |
| 8 | 85 | 14 | `e2e/breakup.spec.ts:226-239` | `e2e/wedding.spec.ts:306-319` |
| 9 | 85 | 8 | `e2e/onboarding-tour.spec.ts:162-169` | `e2e/onboarding-tour.spec.ts:179-187` |
| 10 | 82 | 22 | `e2e/breakup.spec.ts:301-322` | `e2e/breakup.spec.ts:392-400` |
| 11 | 76 | 14 | `e2e/responsive.spec.ts:326-339` | `e2e/responsive.spec.ts:426-439` |
| 12 | 75 | 18 | `e2e/offline.spec.ts:50-67` | `e2e/offline.spec.ts:151-159` |
| 13 | 71 | 13 | `e2e/tournament.spec.ts:77-89` | `e2e/week-advance.spec.ts:145-168` |
| 14 | 68 | 18 | `e2e/offline.spec.ts:67-84` | `e2e/offline.spec.ts:189-199` |
| 15 | 66 | 23 | `e2e/breakup.spec.ts:241-263` | `e2e/wedding.spec.ts:321-341` |
| 16 | 66 | 10 | `e2e/offline.spec.ts:286-295` | `e2e/week-advance.spec.ts:71-83` |
| 17 | 64 | 11 | `e2e/persistence.spec.ts:31-41` | `e2e/persistence.spec.ts:58-71` |
| 18 | 64 | 9 | `e2e/onboarding-tour.spec.ts:74-82` | `e2e/onboarding-tour.spec.ts:92-98` |
| 19 | 61 | 16 | `e2e/sponsor-inbox.spec.ts:33-48` | `e2e/tournament-entry.spec.ts:69-83` |
| 20 | 61 | 12 | `e2e/prologue.spec.ts:259-270` | `e2e/smoke.spec.ts:39-67` |

Clusters: 18, of which 3 with ≥3 sites (`psychologist.spec.ts`↔`spotlight.spec.ts` 4 sites; `offline.spec.ts` 4
sites in 1 file; `onboarding-tour.spec.ts:74-98`↔`prologue.spec.ts:400-406` 3 sites).

### §A5 Bundle, precache and install size

**Commands.** `npx vite build` in the worktree (`RAW/build/vite-build.log`, `uptime` at its head, ends
`X_EXIT=0`; `real 4.36 s` by `/usr/bin/time -p`), then `node scripts/install-size.mjs`
(`RAW/build/install-size.log`, `X_EXIT=0`). Then `node OUT/probes/precache-composition.mjs dist`
(`RAW/build/precache.md`). For module composition, a second build
`npx vite build --sourcemap --outDir RAW/dist-sourcemap --emptyOutDir` (`RAW/build/vite-build-sourcemap.log`,
`X_EXIT=0`) – it emits **the same chunk hashes** as the production build (`index-Cp7uBwDI.js`,
`sim.worker-BemILG4P.js`, `index-CA8ig6Pq.css`), each JS file larger only by its `sourceMappingURL` line
(43–48 bytes) – then
`npx --yes source-map-explorer@2.5.3 <chunk>.js <chunk>.js.map --json --no-border-checks` per chunk and
`node OUT/probes/bundle-composition.mjs RAW/build/sme-<chunk>.json` (`RAW/build/composition.md`).

**What `scripts/install-size.mjs` counts**: it reads `dist/sw.js`, extracts every
`{url:"…",revision:…}` literal with one regex, keeps **one entry per distinct url+revision pair** (workbox
writes one cache key per pair; six files are named by both `includeAssets` and `globPatterns`), stats each
under `dist/` (peeling a leading base-path segment if needed; an unresolvable entry throws), and compares the
sum with `CEILING_KIB = 16 * 1024`. It refuses a manifest with fewer than 290 parsed entries. The worker
scripts (`sw.js`, `registerSW.js`, `workbox-*.js`) are outside the manifest and reported beside the number,
not in it.

**Verdict**: `install size: ok – 16367 KiB in 362 precache entries, 17 KiB under the 16384 KiB ceiling (+46 KiB of worker scripts outside the manifest; dist built 2026-09-26 09:27:30)`.
The build itself prints `precache 368 entries (16366.42 KiB)` (368 literals, 362 distinct pairs). Brief:
16,367 / 16,384 KiB, 17 KiB headroom – **matches**. Headroom is 0.10 % of the ceiling.

**Every emitted JS/CSS file** (`precache-composition.mjs`; gzip = node `zlib` level 9):

| file | raw bytes | gzip bytes | precached | vite's own report |
| --- | ---: | ---: | --- | --- |
| `assets/index-Cp7uBwDI.js` (main chunk) | 757,571 | 251,261 | yes | 757.57 kB, gzip 251.70 kB |
| `assets/sim.worker-BemILG4P.js` (worker chunk) | 661,763 | 202,307 | yes | 661.76 kB (no gzip printed) |
| `assets/index-CA8ig6Pq.css` | 217,493 | 37,778 | yes | 217.49 kB, gzip 38.17 kB |
| `assets/workbox-window.prod.es5-BBnX5xw4.js` | 5,748 | 2,359 | yes | 5.75 kB, gzip 2.36 kB |
| `sw.js` | 32,155 | 10,162 | no (worker script) | – |
| `workbox-2fbc6a65.js` | 15,026 | 5,185 | no (worker script) | – |

`vite build` warns `(!) Some chunks are larger than 500 kB after minification`.

**The precache by type** (362 distinct entries, 16,366.9 KiB):

| type | entries | KiB | share |
| --- | ---: | ---: | ---: |
| images (webp / png / svg) | 328 | 11,681.1 | 71.4 % |
| audio (mp3) | 25 | 2,981.6 | 18.2 % |
| js | 3 | 1,391.7 | 8.5 % |
| css | 1 | 212.4 | 1.3 % |
| fonts (woff2) | 3 | 98.7 | 0.6 % |
| other (`index.html`, `manifest.webmanifest`) | 2 | 1.3 | 0.0 % |
| **total** | **362** | **16,366.9** | 100 % |

By folder: `images/fields/` 73 · 4,988.8 KiB; `images/fem-euro-brunnet/` 66 · 2,990.4; `music/` 2 · 2,550.9;
`assets/` 4 · 1,604.1; `images/shop/` 24 · 1,067.1; `images/weeks/` 14 · 765.1; `images/trophies/` 32 · 748.8;
`sounds/` 23 · 430.7; `avatars/` 37 · 370.6; root 19 · 346.6 (pwa icons, logos, `favicon.png`, `ball.svg`,
`index.html`, manifest); `images/coaches/` 16 · 164.6; `images/support-stuff/` 4 · 143.9; `fonts/` 3 · 98.7;
`icons/` 35 · 47.9; `images/sponsors/` 6 · 37.5; `icons/styles/` 4 · 11.1.

**The 25 largest precached files**:

| # | file | KiB | type |
| ---: | --- | ---: | --- |
| 1 | `music/theme.mp3` | 2,524.0 | audio |
| 2 | `assets/index-Cp7uBwDI.js` | 739.8 | js |
| 3 | `assets/sim.worker-BemILG4P.js` | 646.3 | js |
| 4 | `assets/index-CA8ig6Pq.css` | 212.4 | css |
| 5 | `pwa-512.png` | 146.8 | images |
| 6 | `pwa-maskable-512.png` | 105.1 | images |
| 7 | `images/fields/wta250-venue-2.webp` | 100.4 | images |
| 8 | `images/fields/w15-venue-2.webp` | 98.1 | images |
| 9 | `images/fields/wta250-venue-1.webp` | 95.8 | images |
| 10 | `images/fields/wta500-venue-2.webp` | 90.6 | images |
| 11 | `images/fields/wta125-venue-1.webp` | 90.2 | images |
| 12 | `images/fields/w15-venue-1.webp` | 90.1 | images |
| 13 | `images/fields/w100-venue-1.webp` | 88.8 | images |
| 14 | `images/fields/w35-venue-1.webp` | 85.9 | images |
| 15 | `images/fields/w15-venue-3.webp` | 85.9 | images |
| 16 | `images/fields/w75-venue-2.webp` | 85.1 | images |
| 17 | `images/fields/wta250-grass-1.webp` | 83.7 | images |
| 18 | `images/weeks/study-teen.webp` | 80.0 | images |
| 19 | `images/fields/wta500-venue-1.webp` | 79.6 | images |
| 20 | `images/fields/local-hard-1.webp` | 79.1 | images |
| 21 | `images/fields/w50-venue-1.webp` | 78.7 | images |
| 22 | `images/fields/w15-hard-1.webp` | 78.5 | images |
| 23 | `images/fields/wta1000-clay-2.webp` | 78.2 | images |
| 24 | `images/fields/wta250-clay-1.webp` | 78.2 | images |
| 25 | `images/fields/w15-grass-1.webp` | 77.7 | images |

**Module composition of the two large JS chunks** (source-map-explorer 2.5.3; bytes are minified output
bytes attributed through the sourcemap; src areas as in §A2):

Main chunk `index-Cp7uBwDI.js` – 757,614 bytes (with the map comment), 756,858 mapped, 238 sources; **src
681,793 (90.0 %), node_modules 74,208 (9.8 %)**:

| owner | bytes | share |
| --- | ---: | ---: |
| src `components/` (root) | 208,383 | 27.5 % |
| src `components/screens/` | 142,720 | 18.8 % |
| src `composables/` | 82,759 | 10.9 % |
| `@vue/runtime-core` | 39,401 | 5.2 % |
| src engine root leaf modules | 38,021 | 5.0 % |
| src `engine/world/` | 37,892 | 5.0 % |
| src `viz/` | 27,148 | 3.6 % |
| src `prologue/` | 23,961 | 3.2 % |
| src `engine/diary/` | 20,061 | 2.6 % |
| `@vue/reactivity` | 17,299 | 2.3 % |
| src `art/` | 14,281 | 1.9 % |
| src `components/ui/` | 13,349 | 1.8 % |
| src `stores/` | 13,173 | 1.7 % |
| src `engine/match/` | 12,281 | 1.6 % |
| src `engine/season/` | 12,215 | 1.6 % |
| src `App.vue` | 12,006 | 1.6 % |
| src `components/album/` | 10,805 | 1.4 % |
| `@vue/runtime-dom` | 9,590 | 1.3 % |
| `pinia` | 4,605 | 0.6 % |
| src `audio/` | 4,387 | 0.6 % |
| src `shared/` (root) | 3,597 | 0.5 % |
| `@vue/shared` | 3,313 | 0.4 % |
| src `shared/protocol/` | 2,157 | 0.3 % |
| src `worker/` | 1,688 | 0.2 % |
| `virtual:pwa-register` | 857 | 0.1 % |
| src `pwa.ts` | 705 | 0.1 % |
| src `db/`, `main.ts`, `engine/world.ts`, `buildStamp.ts` | 204 | 0.0 % |
| unmapped / map comment / EOLs | 756 | 0.1 % |

Largest src files in the main chunk: `components/screens/MoneyScreen.vue` 36,143 · `engine/world/albumCorpus.ts`
28,275 · `engine/economy.ts` 26,412 · `components/OfferLetter.vue` 24,878 · `components/screens/SeasonScreen.vue`
24,658 · `components/OnboardingWizard.vue` 20,182 · `engine/diary/weekNotes.ts` 19,641 ·
`components/screens/HomeScreen.vue` 18,791 · `components/TournamentFlow.vue` 16,508 · `prologue/cards.ts` 15,426 ·
`viz/commentary.ts` 14,867 · `components/screens/MoreScreen.vue` 14,679 · `components/screens/CoachMarketScreen.vue`
13,596 · `stores/game.ts` 13,173 · `components/MatchViewer.vue` 12,498.

Worker chunk `sim.worker-BemILG4P.js` – 661,811 bytes, 661,735 mapped, 126 sources; **src 100 %, no
node_modules**:

| owner | bytes | share |
| --- | ---: | ---: |
| src `engine/world/` | 387,443 | 58.5 % |
| src engine root leaf modules | 129,459 | 19.6 % |
| src `engine/diary/` | 75,278 | 11.4 % |
| src `engine/season/` | 31,101 | 4.7 % |
| src `engine/world.ts` | 12,236 | 1.8 % |
| src `worker/` | 7,508 | 1.1 % |
| src `engine/match/` | 7,100 | 1.1 % |
| src `db/` | 6,451 | 1.0 % |
| src `shared/` (root) | 3,302 | 0.5 % |
| src `shared/protocol/` | 1,857 | 0.3 % |
| unmapped / map comment / EOLs | 76 | 0.0 % |

Largest src files in the worker chunk: `engine/world/smallTalkCorpus.ts` 96,535 · `engine/world/lifeBeat.ts`
57,411 · `engine/diary/weekNotes.ts` 41,964 · `engine/world/albumCorpus.ts` 29,692 · `engine/economy.ts` 26,825 ·
`engine/world/birthday.ts` 19,706 · `engine/world/snapshot.ts` 19,413 · `engine/diary/pool.ts` 17,535 ·
`engine/migrations.ts` 16,633 · `engine/offers.ts` 13,957 · `engine/world/coachMarket.ts` 13,718 ·
`engine/world/albumBook.ts` 13,397 · `engine/radar.ts` 12,730 · `engine/world.ts` 12,236 ·
`engine/diary/travelNotes.ts` 11,260.

**Modules shipped in both chunks** (the two source-map-explorer JSONs intersected on the src path): 64 src
modules appear in both; they account for **121,534 bytes of the main chunk** and 374,061 bytes of the worker
chunk. Engine / shared / db / worker modules in the main chunk: 70 modules, 128,034 bytes. The largest shared
ones (main / worker bytes): `engine/world/albumCorpus.ts` 28,275 / 29,692 · `engine/economy.ts` 26,412 /
26,825 · `engine/diary/weekNotes.ts` 19,641 / 41,964 · `engine/season/calendar.ts` 7,978 / 8,252 ·
`engine/season/names.ts` 2,730 / 2,802 · `engine/world/birthday.ts` 2,657 / 19,706 · `engine/match/scoring.ts`
2,319 / 2,319 · `engine/offers.ts` 2,231 / 13,957 · `shared/dates.ts` 2,038 / 1,111 · `engine/coach.ts` 2,006 /
4,582. (A module in both chunks may carry different subsets of its code after tree-shaking.)

§B–§D follow from Phase 0b–0d.

## §B Engine runtime

Phase 0b, 26.09 09:37–10:00, `03d92221`, no other review agent running. Apple M4 (10 cores, 16 GB),
macOS 26.5.1, Node v26.5.0, vite-node 3.2.4. `uptime` was recorded before every run (in each log); the
1-minute load stayed between 1.46 and 4.25 for all of them, so no number here carries a contention flag.

### B.0 Method – the worker's own entry points, one whole career at a time

`mutate` in `src/worker/sim.worker.ts:233-249` is the path every command takes: `structuredClone(world)`
→ the command → `commitAutosave` (`src/db/saves.ts` `runAutosaveTx` → `compressWorld`,
`src/engine/saveCodec.ts`: `JSON.stringify` + gzip + sha256) → `snapshotMsg` → `toSnapshot`. The probes
call exactly those functions in that order, per week, on a real career. The week itself is the benches'
driver – `stepCareerWeek` (`tools/econ-bench.ts:654`, policy `POLICIES[1]` `player`, the e2e fixtures'
policy), which enters events by policy and calls `tickWeek` – and open questions are answered the way
`tools/e2e-fixtures.ts:239` `answerOpenQuestions` does (drain life beats via `tools/_lifeBeats.ts`, fork
`continue`, retirement only when `final`) plus `tools/_birthday.ts` `answerBirthdayNeutral`. This is the
driver 05.09 used, so the tick numbers are comparable. Not reachable from node and not measured here: the
IndexedDB put and the real `postMessage` (`structuredClone` is the transfer proxy, `v8.serialize` its
size). `advanceWeeks(…, 1)` in the worker adds `advanceRefusal` (`src/engine/world/multiWeek.ts:325`) in
front of `tickWeek`; shoot-clash questions are left to `tickWeek` as every bench does.

Probes (in `OUT/probes/`, copied to the same path in the worktree and run from its root):

| probe | what it does | command |
| --- | --- | --- |
| `runtime-career.ts` | one career to its natural end (cap 2,600 weeks, never hit). A throwaway warm-up career (`PRESETS[0]`, index 99, 104 weeks) runs first in the same process, so JIT warm-up is not charged to week 1. `full` arm: per week `stepCareerWeek` + answers, then `structuredClone(world)`, `compressWorld`, `toSnapshot` (with the Wave A memo's hit/miss counters), then `toSnapshot` again on a fresh clone (= the next command in the same week); snapshot JSON and `v8.serialize` bytes. At weeks 100/200/400/800/1,200/1,600 and the end, a battery: `toSnapshot` ×100 warmed (memo on) and ×100 with `TB_SNAPSHOT_CACHE=off`, `structuredClone` of snapshot and world, `compressWorld` / `decompressWorld` / `refreshDerivedRankCaches` ×10, top-level field bytes, and a census of every array to depth 3. `bare` arm: `stepCareerWeek` + answers only. Heap after `gc()` at the end, again after `clearDerivedCache()`, again after dropping the world | `RAW/0b/run-one.sh <preset> <index> <seed>-r2` = `node --expose-gc node_modules/vite-node/vite-node.mjs OUT/probes/runtime-career.ts -- <preset> <index> full\|bare RAW/0b/career-<seed>-r2-<arm>.json 2600`, logs `RAW/0b/run-<seed>-r2.log` (sentinels `FULL_EXIT=0`, `BARE_EXIT=0`, `X_EXIT=0` in all 7) |
| `runtime-analyze.mjs` | folds the career JSONs into the tables below (no repo imports) | `node OUT/probes/runtime-analyze.mjs RAW/0b r2 > RAW/0b/analyze-r2.txt` (and `… ''` → `analyze-r1.txt` for the first run) |
| `runtime-fixtures.ts` | the 05.09 method on the committed e2e careers: `decodeExportFile` (the `importSave` read) + `refreshDerivedRankCaches` (as `ensureMainState`), first `toSnapshot` with the memo emptied, ×200 warmed memo on, ×200 memo off, sizes, clone, encode, decode | `npx vite-node OUT/probes/runtime-fixtures.ts -- RAW/0b/fixtures-r{1,2}.json`, logs `RAW/0b/fixtures-r{1,2}.log` |
| `runtime-offers.ts` | what `world.offers` and the feed's `keep` rows hold at weeks 200/400/800/1,200/end | `npx vite-node OUT/probes/runtime-offers.ts -- <preset> <index>`, log `RAW/0b/offers2.log` |

Seeds: `openCareer(PRESETS[i], index, POLICIES[1])` → `bench-middle-0…3` (preset 5, middle · middle
coach), `bench-working-0/1` (preset 2, working · middle coach), `bench-wealthy-0` (preset 7, wealthy · high
coach). Every career was run twice (r1 without `bench-middle-3`, r2 with it); r2 is quoted, r1 is the
repeat. **Determinism check**: for every seed the `full` and `bare` arms and both runs end on the same
world hash (e.g. `bench-middle-0` `3272aa98f61626b3` four times), so clone, encode and `toSnapshot`
perturb nothing on the per-command path.

### B.1 Career length – the windows

| seed | ending | final week | age | walk, full / bare (r2) |
| --- | --- | ---: | ---: | --- |
| bench-middle-0 | natural | 1,401 | 40 | 67.5 s / 9.2 s |
| bench-middle-1 | natural | 1,401 | 40 | 63.8 s / 7.3 s |
| bench-middle-2 | bankruptcy | 147 | 16 | 8.4 s / 0.8 s |
| bench-middle-3 | natural | 1,349 | 39 | 65.4 s / 8.6 s |
| bench-wealthy-0 | natural | 1,349 | 39 | 65.7 s / 8.8 s |
| bench-working-0 | natural | 1,453 | 41 | 68.9 s / 9.5 s |
| bench-working-1 | natural | 1,453 | 41 | 65.7 s / 7.3 s |

Six of seven careers reach a natural retirement at weeks 1,349–1,453 (median 1,401); one goes bankrupt at
week 147. **No career reaches week ~1,600**: the retirement ask is age-driven (`ENDINGS.askFromAgeYears`
29, `src/engine/ending.ts:135`, and the offer turns `final` once `physicalShare ≤ 0.55`,
`retirementDue` at `:596`), so under the player policy a career ends at 39–41. The deepest committed
career is the e2e `parting` fixture at week 1,133. Windows used below: early = weeks 1–100; ~200 =
151–250; mid = the 100 weeks centred on the career's midpoint (626–777); ~800 = 751–850; late = the last
100 weeks (1,250–1,453). Early has 7 seeds, the rest 6 (the bankrupt career stops at 147).

### B.2 Tick throughput

`bare` arm, `stepCareerWeek` alone per week (answers excluded from the per-week median, included in the
weeks/s). Median across seeds, (min–max across seeds); r1 = the same statistic from the first run.

| window | seeds | `stepCareerWeek` med ms | p95 ms | weeks/s engine only | r1 weeks/s | weeks/s worker path (tick + clone + encode + snapshot) |
| --- | ---: | --- | --- | --- | ---: | --- |
| early 1–100 | 7 | 5.07 (4.92–5.12) | 7.16 (6.75–7.63) | 186 (181–189) | 187 | 42 (41–42) |
| ~200 | 6 | 5.62 (4.74–5.85) | 9.09 (7.41–9.86) | 162 (158–189) | 162 | 36 (34–38) |
| mid | 6 | 6.37 (4.73–6.58) | 9.05 (6.74–9.41) | 153 (145–197) | 149 | 34 (33–36) |
| ~800 | 6 | 6.42 (4.51–6.46) | 8.94 (6.51–9.26) | 151 (148–202) | 150 | 34 (34–36) |
| late (last 100) | 6 | 6.96 (4.77–7.46) | 9.77 (6.54–10.10) | 143 (130–195) | 135 | 32 (31–36) |

The tick costs +37 % between the first and the last hundred weeks (05.09: 5.3 → 6.4 ms/week between week
52 and 516, the same driver); no window shows super-linear growth. **On the worker path the tick is
~23 % of a week's cost**: late in a career a one-week advance is 6.96 (tick) + 2.50 (clone) + 7.67
(encode) + 13.7 (snapshot) ≈ 31 ms, so the per-command work is ~3.4× the tick itself. The ▶▶ 52 dev
tick pays the per-command half once for 52 weeks.

### B.3 `toSnapshot` per command

**How 05.09 got 13–24 ms** (`docs/review-principles-2026-09-05/04-performance.md` §B–§C): 13.04 ms =
`toSnapshot` alone, warmed, ×200 on the e2e `pro` fixture (week 412), p95 24.1; 22.2–25.0 ms (median
23.8) = ×50 right after a 52-week walk; ×100 per fixture 13.4 (pro) / 18.8 (junior). No memo existed
then. **Since then Wave A landed** – a content-keyed module-level memo (`src/engine/world/derivedCache.ts`,
`memoise` at `:131`, ceilings 64 / 256 / 32 at `:72-74`, switch `TB_SNAPSHOT_CACHE=off` at `:89`), used
by `rankingFor` (`world/ladder.ts:168`) and the preview / rated tables (`world/snapshot.ts:382`, `:530`).
So the 05.09 "warmed, repeated" method now measures the memo-HIT path; the comparable arm is memo off.

Same method, same fixture (`runtime-fixtures.ts`, two runs):

| fixture (week) | 05.09 (98e3560b) | first call after load, memo empty | warmed ×200, memo on med / p95 | warmed ×200, memo off med / p95 |
| --- | --- | --- | --- | --- |
| pro (412) | 13.04 / 24.1 (×200); 13.4 (×100) | 21.5 / 24.6 | 2.39 / 2.64 · 2.35 / 2.61 | **10.72 / 11.08 · 10.79 / 11.13** |
| junior (120) | 18.8 (×100) | 16.4 / 16.4 | 3.03 / 3.27 · 3.01 / 3.34 | 15.16 / 15.96 · 15.62 / 15.99 |
| engaged (681) | – | 16.7 / 14.4 | 4.68 / 5.07 · 4.67 / 4.96 | 14.65 / 15.03 · 14.69 / 14.94 |
| expecting (892) | – | 13.7 / 13.7 | 3.36 / 3.53 · 3.38 / 3.57 | 16.30 / 16.60 · 16.35 / 21.41 |
| parting (1,133) | – | 15.3 / 20.9 | 4.44 / 4.75 · 4.44 / 4.84 | 13.78 / 14.14 · 13.89 / 14.28 |

Along the careers (`runtime-career.ts` full arm, per-seed window medians, then median (min–max) across
seeds):

| window | after a one-week advance med / p95 ms | memo misses per call | next command in the same week (fresh clone) med / p95 ms |
| --- | --- | ---: | --- |
| early | 12.6 (12.4–12.9) / 15.8 (15.2–16.5) | 37 | 5.4 (5.1–5.5) / 8.2 (8.0–9.8) |
| ~200 | 13.3 (12.8–13.8) / 15.8 (15.4–16.8) | 37 | 6.2 (5.8–6.5) / 10.2 (9.1–10.3) |
| mid | 13.3 (12.6–13.4) / 16.3 (15.3–17.0) | 36 | 6.3 (6.2–6.5) / 9.7 (9.0–10.2) |
| ~800 | 12.9 (12.3–13.8) / 16.1 (14.9–18.1) | 36 | 6.3 (6.1–6.6) / 10.1 (9.6–10.7) |
| late | 13.7 (13.1–13.9) / 16.9 (16.2–17.4) | 36 | 6.9 (6.0–7.6) / 11.1 (9.7–11.4) |

Checkpoint batteries (same object, ×100 warmed), median across seeds: memo on 1.78 (w100), 5.58 (w200),
5.39 (w400), 4.96 (w800), 5.65 (w1,200), 2.93 ms (end); memo off 11.52, 12.60, 16.30, 17.85, 19.17,
12.74 ms. r1 reproduces the window medians within 0.4 ms and the checkpoint medians within 1.0 ms.

**Reading**: the memo cut the repeated/same-week path to 2–7 ms, but **the advance – the one command
every week – still pays 12.6–13.7 ms**, the 05.09 number: the ranking key carries the week (`w${world.week}`,
`world/ladder.ts:159`) and the far-preview key carries her current ratings (`world/snapshot.ts:527-529`),
so a tick invalidates them – 36–37 misses on each post-advance call. The full derivation grows with career depth (memo off 11.5 → 19.2 ms
from w100 to w1,200).

### B.4 Worker message size

The reply per command is one `SnapshotReply` (`snapshotMsg`, `sim.worker.ts:147-167`). Per window
(median of per-seed window medians, KiB):

| window | snapshot JSON | snapshot structured clone (`v8.serialize`) | window max JSON | autosave payload (gzip) |
| --- | --- | --- | --- | --- |
| early | 76.3 (76.2–77.5) | 71.3 (70.8–72.3) | 83.9 | 50.6 |
| ~200 | 84.3 (79.9–85.7) | 76.4 (73.9–77.5) | 92.2 | 77.0 |
| mid | 120.6 (85.9–129.3) | 108.6 (75.4–116.7) | 126.9 | 78.9 |
| ~800 | 127.9 (86.6–137.4) | 115.2 (76.2–124.1) | 135.4 | 78.7 |
| late | 155.5 (96.8–177.6) | 138.6 (85.4–158.3) | 164.1 (max 187.9) | 81.2 |

`structuredClone(snapshot)` 0.28 ms (w100) → 0.73 ms (end). The snapshot now has **110 top-level keys**
(05.09: 88, protocol then 90). Pro fixture: 98,744 B JSON / 88,802 B v8 (05.09: 97,403 B).

Largest top-level fields, median over the six long careers, KiB (rows):

| field | w100 | end |
| --- | --- | --- |
| `offers` | 1.5 (8) | **68.1 (274)** |
| `upcoming` | 13.3 (21) | 14.6 (23) |
| `shop` | 12.4 | 13.5 |
| `events` | 11.8 (60) | 11.0 (60) |
| `seasonHistory` | – | 8.8 (27) |
| `ending` | – | 7.2 |
| `financialEvents` | 5.9 (50) | 6.4 (50) |
| `ladders` | 5.5 | 6.0 |
| `coachMarket` | 5.6 (16) | 5.6 (16) |
| `milestones` | – | 3.0 (59) |

The snapshot more than doubles over a career (72 → 162 KiB at the checkpoints) and **`offers` is 67 of
the 90 KiB it gains**: `toSnapshot` copies every inbox row on every command (`world/snapshot.ts:2230`,
`offers: world.offers.map((o) => ({ ...o, terms: { ...o.terms } }))`). See B.6 for what those rows are.

### B.5 Save size against career length

The real codec path: `compressWorld` = what `runAutosaveTx` stores (payload + a 32-byte sha256 in the
`SaveRecord`); an export file is payload + 44 header bytes (`saveCodec.ts` `HEADER_BYTES`);
`decompressWorld` = the load (sha256 verify + bounded gunzip + `JSON.parse` + `migrateSave`); the worker
then runs `refreshDerivedRankCaches` (`ensureMainState`, `sim.worker.ts:199-204`). Median across seeds
(min–max); n = careers reaching the checkpoint.

| checkpoint | n | world JSON KiB | world v8 KiB | stored payload KiB | `compressWorld` ms | `decompressWorld` ms | `structuredClone(world)` ms |
| --- | ---: | --- | --- | --- | --- | --- | --- |
| w100 | 7 | 319.0 (302.3–324.1) | 275.6 | 58.2 (55.4–59.3) | 5.30 | 1.53 | 1.65 |
| w200 | 6 | 428.6 (347.3–434.9) | 357.4 | 77.2 (63.7–78.5) | 6.97 | 1.91 | 2.06 |
| w400 | 6 | 461.6 (430.5–463.9) | 387.4 | 81.9 (79.1–83.3) | 7.38 | 2.02 | 2.23 |
| w800 | 6 | 473.3 (427.0–476.6) | 400.9 | 77.8 (77.1–79.9) | 7.33 | 2.07 | 2.25 |
| w1,200 | 6 | 491.5 (428.5–497.9) | 416.3 | 81.4 (76.6–81.9) | 7.52 | 2.14 | 2.33 |
| ~1,600 | 0 | not reached (B.1) | | | | | |
| end (w1,349–1,453) | 6 | 493.7 (422.2–508.9) | 418.1 | 79.9 (76.4–81.0) | 7.29 | 2.05 | 2.34 |
| end, bankrupt w147 | 1 | 345.6 | | 62.9 | | | |

**Save size is flat after week ~200**: from week 200 to career end the world JSON grows ×1.15 and the
stored payload ×1.04 (77 → 80 KiB), because the big collections are windows (B.6). Fixtures agree: pro
(412) 467,513 B JSON → 82,523 B stored (05.09: 466,313 → 82,486); parting (1,133) 528,581 → 85,785 B.
Encode 7.4 ms at pro (05.09: 6.16); decode 2.0 ms (05.09 load path 2.51); `refreshDerivedRankCaches`
4.7–7.4 ms on a fresh load with the memo empty (05.09: 10.0), 0.34–0.40 ms with it warm; the whole
`decodeExportFile` import 2.5–6.0 ms. The guard ceilings (`src/engine/saveGuard.ts:71`, `:73` – 16 MiB
compressed, 64 MiB expanded) sit ~200× and ~130× above the largest save measured here (81 KiB / 509 KiB).

### B.6 The collections that live for the whole save

Array census at the checkpoints (`runtime-career.ts` battery), median over the six long careers, rows /
KiB. "Only grows" = the length never falls between checkpoints in any career and ends above w100.

| path | only grows | w100 | w200 | w400 | w800 | w1,200 | end |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `offers` | **yes** | 4 / 0.9 | 18 / 3.6 | 71 / 16.7 | 161 / 41.1 | 235 / 60.3 | **274 / 68.1** |
| `seasonHistory` | yes | 1 / 0.3 | 3 / 1.0 | 7 / 2.3 | 15 / 4.9 | 23 / 7.5 | 27 / 8.8 |
| `lifeLog` | yes | 6 / 0.6 | 9 / 0.8 | 19 / 1.7 | 48 / 4.2 | 70 / 6.1 | 90 / 7.8 |
| `loveEpisodes` | yes | 0 | 0 | 3 / 0.6 | 9 / 1.9 | 13 / 2.8 | 14 / 3.0 |
| `milestones` | yes | 10 / 0.4 | 24 / 1.0 | 37 / 1.7 | 46 / 2.2 | 54 / 2.7 | 59 / 3.0 |
| `birthdays` | yes | 2 / 0.1 | 4 / 0.2 | 8 / 0.4 | 15 / 0.8 | 23 / 1.2 | 27 / 1.4 |
| `injuryHistory` | yes | 1 / 0.1 | 2 / 0.1 | 3 / 0.2 | 8 / 0.5 | 14 / 1.0 | 16 / 1.1 |
| `knockHistory` | yes | 3 / 0.2 | 6 / 0.4 | 13 / 0.9 | 16 / 1.0 | 16 / 1.1 | 16 / 1.1 |
| `events` (feed, `EVENTS_CAP` 400) | capped | 400 / 97.6 | 400 / 189.2 | 400 / 196.6 | 400 / 184.0 | 400 / 165.4 | **404** / 159.2 |
| `results` (pruned window) | no | 2,129 / 118.3 | 2,217 / 125.1 | 2,227 / 129.4 | 2,272 / 134.0 | 2,296 / 138.8 | 2,221 / 134.3 |
| `cohort` | no | 199 / 63.1 | | | | | 199 / 63.6 |
| `season` | no | 188 / 19.7 | 205 / 21.5 | 236 / 24.8 | 111 / 11.8 | 173 / 18.8 | 187 / 20.4 |
| `financeWeeks` | no | 60 / 6.4 | | | | | 60 / 12.1 |

The feed's `keep` rows (`runtime-offers.ts`, `bench-middle-0` / `working-0` / `wealthy-0`): 12 / 10 / 10
at w200, 28 / 26 / 25 at w400, 49 / 52 / 51 at w800, 87 / 88 / 87 at w1,200, **105 / 107 / 96 at the end**
(1.9 → 16.3 KiB) – about one every 13 weeks, never pruned (`pruneEvents`, `world/bookkeeping.ts:146`).

What `offers` holds at the end (same three careers): 272 / 364 / 274 rows, 69.5 / 92.7 / 69.7 KiB, of
which **live (deadline or contract not yet past) 5 / 2 / 4**; the rest are `ad/expired` 154 / 241 / 159,
`kit/expired` 60 / 57 / 58, `entry/info` 30 / 36 / 30, `staff/info` 23 / 25 / 26, `academy/info` 3 / 5 / 0.

Only-growing total at the end: ≈ 110 KiB of JSON (`offers` 68 + kept feed rows 16 + `seasonHistory` 9 +
`lifeLog` 8 + the rest ~9), against ~385 KiB of windowed or fixed collections.

### B.7 Heap after a long career

`process.memoryUsage().heapUsed` after `gc()` (`--expose-gc`); the ~100 MB floor is vite-node and the
loaded module graph, not the engine. `bare` arm: 103.3–103.4 MB after the warm-up career → 103.9–107.5 MB
at the end of the measured career → 103.4–104.6 MB after `clearDerivedCache()`. `full` arm: 104.4–106.3 →
110.9–112.9 MB, of which the Wave A memo is 0.7–2.6 MB (released by `clearDerivedCache`); the remaining
~4 MB is the probe's own per-week rows and checkpoint censuses. **No heap growth attributable to the
engine over a 1,350–1,450-week career.** Dropping the world itself released only 0.03–0.2 MB, because
most of its strings are shared with the loaded corpora – so its structured-clone size (418 KiB at the end)
is the better measure of what the worker holds per career.

### B.8 Observations handed to the lanes (measured here, not yet findings)

1. **`offers` only grows and ships whole in every snapshot.** 4 → 274 rows (median) over a career, 98 %+
   no longer live (expired letters and old notices), 67 of the snapshot's 90 KiB of career growth, cloned on every command
   (`world/snapshot.ts:2230`). The field's own contract says otherwise: "Bounded by construction … a
   handful of rows per career and is never pruned" (`src/engine/world/state.ts:1398-1399`). Lanes B, D, G.
2. **The advance path gained nothing from Wave A**: 12.6–13.7 ms per post-advance `toSnapshot` with
   36–37 memo misses, the same as 05.09's 13 ms; the memo serves same-week commands (5.4–6.9 ms on a
   clone). Lanes D, G.
3. **Per-command work is ~3.4× the tick** (clone 2.5 + encode 7.7 + snapshot 13.7 ms against a 7.0 ms
   tick, late window) – 32 weeks/s on the worker path against 143 engine-only. Lane G.
4. **The feed ends four rows over `EVENTS_CAP`** (404 in all three probed long careers at the ending
   week; 400 at every earlier checkpoint) – not traced. And the `keep` rows reach 96–107 by the end,
   so the note at `src/engine/world/constants.ts:196` ("~EVENTS_CAP − kept − 120 ≈ 265" match rows)
   holds early in a career but leaves ≈ 175 at its end. Lane B.
5. **The snapshot carries 110 top-level keys** (05.09: 88). Lane D.
6. **Week ~1,600 is not a reachable window** under the player policy – careers retire at 39–41
   (weeks 1,349–1,453); a lane that needs deeper state has no committed fixture past week 1,133.

## §C Browser

Phase 0c, 26.09 10:06–10:23, `03d92221`, no other review agent running. Real Chromium – Playwright 1.62.1's
`chromium-headless-shell` build 1234, headless, viewport 576×1280 (the e2e config's), no CPU throttling – on
the §A0 machine (Apple M4). `uptime` headed every run log; the 1-minute load stayed between 0.88 and 3.18
for every run quoted here, so no number carries a contention flag.

### C.0 Method

**The app under test** is the §A5 production build (`dist/`, built 09:27:30 by `npx vite build`), served by
`npx vite preview --port 4390 --strictPort` started from the worktree in the background (PIDs 7961 / 7977,
stopped 10:23; `pgrep -lf "vite-node|vitest|vite preview|playwright"` empty afterwards). That build registers
the service worker; every context here is created with `serviceWorkers: 'block'`, the runtime equivalent of
the e2e harness's `VITE_TB_SW=off`.

**Seeding** is `e2e/careerAt.ts`'s path, re-implemented in the probe rather than imported (the probe is
plain `.mjs`): the committed `e2e/fixtures/<name>.tsave` is cut at the 44-byte envelope header
(`tools/e2e-fixtures-read.ts` `ENVELOPE_HEADER_BYTES`), and an init script writes the record and the careers
row inside the `tennis-sim` v2 versionchange transaction before any app script runs; localStorage gets
`tb:onboardingTourSeen=1` and `tb-week-story-off=1`. Boot = `goto('/')` → "Tap to start" → the store
reports `ready`; the boot doorways the journeys step through (tour briefing, opening knock) are answered
the way `e2e/journey.ts` answers them. Boot to ready: median 195–201 ms in the advance runs (incidental).

**Instrumentation, observe-only – nothing in `src/` or `dist/` is changed:**

| what | how |
| --- | --- |
| page side of `postMessage` | the init script replaces `window.Worker` with a subclass whose constructor adds a `message` listener before the app's `w.onmessage` (`src/worker/client.ts:149-150`): stamps `t` (dispatch starts), `td` (after `e.data` is read), `tFlush` (a `MessageChannel` task queued at `t` – runs after the app's handler and the microtask drain holding Vue's flush) and `tFrame` (a double rAF queued at `t`); outgoing `postMessage` is stamped too. Reply objects are kept and sized (`JSON.stringify(...).length`) only after the timed window |
| worker side | `page.on('worker')` + `worker.evaluate` in the live sim worker, after boot: wraps `self.onmessage` and `self.postMessage` (`post` looks the global up per call, `src/worker/sim.worker.ts:122`), `IDBDatabase.prototype.transaction` (readwrite: creation → `complete`) and `IDBObjectStore.prototype.put` (synchronous cost, payload bytes) |
| issuing a command | the Pinia store through `document.querySelector('#app').__vue_app__` (Vue sets it in production builds): `store.advance(1)` or `store.setWeightEnabled(on)` |
| DOM settled | a `MutationObserver` on `body` (subtree, attributes, text): last-mutation time and record count, quiet window 150 ms (command) / 300 ms (advance), cap 4 / 8 s – never hit |
| CPU | CDP `Performance.getMetrics` before/after each timed command (renderer main thread); separately, `browser.startTracing` (`devtools.timeline`, `v8`, gc categories) over reps that are NOT timed, parsed per thread: busy = top-level `RunTask`, JS = top-level `FunctionCall`/`EvaluateScript`/`RunMicrotasks`/`EventDispatch`/…, GC events |

Derived per command (worker and page clocks joined through `performance.timeOrigin + now()`):
**command → rendered** = snapshot reply's `tFlush` − call; **main-thread handling** = `tFlush` − `t` of the
snapshot reply (deserialise + store + Vue flush); **worker** = command received → reply posted, split at the
autosave transaction: *before tx* (`structuredClone` + the command + `compressWorld` + `db()`, wall time),
*IDB tx*, *after tx* (`toSnapshot` + `snapshotMsg` + `post`).

Probes (`OUT/probes/`, copied to the same path in the worktree, run from its root, output to `RAW/0c/`):

| probe / step | command | output |
| --- | --- | --- |
| `browser-perf.mjs explore` – which fixtures advance cleanly | `node OUT/probes/browser-perf.mjs explore RAW/0c/explore.json junior soft sinking pro engaged expecting parting` | `explore.json`, log `X_EXIT=0` |
| `… toggle` – a non-advancing command per screen: More, Home, Money, Season, More again; 3 warm-up + **25 timed** + 5 traced per screen | `node OUT/probes/browser-perf.mjs toggle RAW/0c/toggle-<fx>.json <fx> 25` for `junior` `sinking` `pro` `expecting` `parting` | `toggle-<fx>.json` / `.log` |
| `… advance` – one week, **20 fresh contexts** per screen (+3 traced, excluded from timings), each warmed by two untimed toggles | `node OUT/probes/browser-perf.mjs advance RAW/0c/advance-<fx>-<sc>.json <fx> <sc> 20 3` for `sinking` `expecting` × `home` `money` `season` | `advance-*.json` / `.log` |
| `… series` – **25 consecutive** advances in one session (3 warm-up), the screen re-opened untimed before each | `node OUT/probes/browser-perf.mjs series RAW/0c/series-<fx>-<sc>.json <fx> <sc> 25 3`, same 2 × 3 | `series-*.json` / `.log` |
| `… idbproxy` – controlled `put` of incompressible 58 / 78 / 81 KiB payloads, 3 warm-up + **30 timed** each | `node OUT/probes/browser-perf.mjs idbproxy RAW/0c/idbproxy.json 30` | `idbproxy.json` / `.log` |
| `browser-analyze.mjs` – the tables below | `node OUT/probes/browser-analyze.mjs toggle\|advance\|series\|idbproxy RAW/0c/<files>` | `RAW/0c/analyze-{toggle,advance,series,idbproxy}.txt` |
| per-fixture pooling of the worker / IDB columns | ad hoc `node -e` over the same JSONs | `RAW/0c/pooled.txt` |

Every log above ends `X_EXIT=0` and is newer than its command's start. Figures are medians; ranges in
parentheses are p90 or min–max as labelled.

**Fixtures**: early = `sinking` (week 86) and `junior` (120); mid = `pro` (412); late = `expecting` (892) and
`parting` (1,133). The advance runs use `sinking` and `expecting` because `explore` showed their next week
resolves cleanly (no tournament reveal, no blocking card); `junior`'s lands on a pending tournament,
`parting`'s on the divorce card, `pro`'s on the season wrap-up.

### C.1 IndexedDB write cost – measured on the app's own autosave

The app's own write: the worker's `runAutosaveTx` transaction (`src/db/saves.ts:251`ff. – one
`careers.get`, two `saves.get` of the two autosave generations, then two `put`s), timed from
`db.transaction(...)` to `complete` inside the live worker.

| arm | fixture (week) | n | record payload B | IDB tx, creation → `complete` ms | `put(record)` synchronous ms |
| --- | --- | ---: | ---: | --- | --- |
| weight toggle | junior (120) | 125 | 58,071 | 1.00 (p90 1.20, max 3.50) | 0.10 (max 0.30) |
| weight toggle | sinking (86) | 125 | 58,359 | 1.00 (p90 1.20, max 3.70) | 0.10 (max 0.30) |
| weight toggle | pro (412) | 125 | 80,404 | 1.00 (p90 1.20, max 3.60) | 0.20 (max 0.40) |
| weight toggle | expecting (892) | 125 | 80,466 | 1.00 (p90 1.20, max 4.10) | 0.20 (max 1.30) |
| weight toggle | parting (1,133) | 125 | 83,760 | 1.10 (p90 1.36, max 3.90) | 0.30 (max 0.60) |
| advance, fresh | sinking | 60 | 58,212 | 0.60 (p90 0.70, max 0.80) | 0.10 |
| advance, fresh | expecting | 60 | 80,378 | 0.70 (p90 0.80, max 0.90) | 0.20 |
| advance, consecutive | sinking (89–114) | 75 | 54,847–57,934 | 0.80 (p90 1.10, max 3.00) | 0.10 |
| advance, consecutive | expecting (895–920) | 75 | 79,624–82,414 | 0.80 (p90 1.76, max 3.30) | 0.20 |

Controlled proxy (`idbproxy`, one `put` per readwrite transaction into a throwaway `tb-probe-idb`
database on the app's origin, deleted afterwards): 58 KiB 0.20 ms (p90 0.31), 78 KiB 0.20 (p90 0.20),
81 KiB 0.15 (p90 0.21); `put()` itself 0.10 ms. The app's transaction costs 3–5× the bare put because it
reads both generations (~56–84 KB each) before writing – still ~1 ms.

**Reading**: the durable write is **1–5 % of a command's worker time** (C.2) and flat across career
length. Caveats: a fresh profile holding one career (1–2 records); an M4's SSD; `src/db/saves.ts:183-185`
passes no `durability` hint, so `complete` is whatever the browser's default durability waits for – this
does not measure an fsync-bound or phone-flash write. The payload sizes agree with §B.5 (58 → 80–84 KB).

### C.2 Update cost of the three largest screens

§A2 sizes: `MoneyScreen.vue` 4,913 lines (2,259 code), `HomeScreen.vue` 3,405 (1,482), `SeasonScreen.vue`
3,147 (1,474). **How the app routes an advance decides what can be measured**: a resolved week always
navigates – to the week story, or (story switched off, as here) to Home (`src/App.vue:628-655`). So Home
is the only one of the three that stays mounted through an advance; with Money or Season open, an advance
unmounts that screen and mounts Home, and that swap is what a player pays. The **in-place** update of each
screen is therefore measured with a command that does not navigate: `setWeightEnabled` toggled
(`src/stores/game.ts:677`, a `mutate` in the worker – clone, command, autosave, full `toSnapshot`; the
whole `snapshot` object is replaced in the store, so every reader of it re-evaluates; zero draws,
`src/engine/world/lifeBeat.ts:7747`).

**(a) In-place update, one non-advancing command** (`toggle`, 25 timed per screen per fixture):

| fixture (week) | snapshot reply, JSON chars | command → rendered ms (all screens pooled, n=125) | main-thread handling ms – More · Home · Money · Season | DOM mutation records – More · Home · Money · Season | document nodes – More · Home · Money · Season |
| --- | ---: | --- | --- | --- | --- |
| sinking (86) | 80,132 | 23.3 (p90 25.3) | 1.1 · 1.6 · 1.4 · 2.1 | 5 · 2 · 0 · 4 | 142 · 299 · 165 · 457 |
| junior (120) | 78,103 | 21.5 (p90 23.2) | 1.2 · 1.7 · 1.4 · 2.6 | 5 · 2 · 0 · 16 | 143 · 293 · 154 · 555 |
| pro (412) | 98,568 | 24.7 (p90 27.0) | 1.1 · 1.5 · 1.3 · 1.8 | 5 · 2 · 0 · 16 | 142 · 268 · 175 · 264 |
| expecting (892) | 149,688 | 27.3 (p90 29.0) | 1.2 · 1.7 · 1.6 · 1.9 | 5 · 2 · 0 · 16 | 142 · 262 · 175 · 269 |
| parting (1,133) | 152,915 | 29.6 (p90 32.2) | 1.2 · 1.7 · 1.6 · 2.3 | 5 · 2 · 0 · 20 | 146 · 260 · 179 · 431 |

Main-thread handling p90 never exceeds 3.0 ms; of it, reading `e.data` is 0.2–0.5 ms. Snapshot → second
rAF 3.8–13.4 ms median, max 18.2 in every run – vsync-quantised: the update always lands in the next frame
or the one after. CDP per command:
`ScriptDuration` 0.36–0.67 ms, layout ≤ 0.9 ms, style ≤ 1.7 ms, `TaskDuration` 3.8–17.8 ms. Trace (5
untimed commands per screen, per command): main busy 3.9 (Money) – 18.4 ms (Home at `pro`), main JS
2.0–4.0 ms; worker busy 18.2–27.5 ms.

Worker, same runs, pooled per fixture (n=125): total 19.2 (junior) · 21.3 (sinking) · 22.8 (pro) · 25.2
(expecting) · 27.4 ms (parting); of which before-tx 12.6–17.6, IDB 1.0–1.1, after-tx 5.4–8.7 ms.

**(b) One week advance with the screen open** (`store.advance(1)`; fresh = first advance after load, 20
contexts; consecutive = 25 in one session):

| fixture | screen open → lands on | arm | command → rendered ms | command → DOM quiet ms | main-thread handling ms | mutations | worker ms |
| --- | --- | --- | --- | --- | --- | ---: | --- |
| sinking (86→87) | Home → Home | fresh | 51.4 (p90 52.3) | 54.9 | 2.4 | 44 | 48.5 |
| | Money → Home | fresh | 55.6 (p90 56.5) | 56.6 | **6.7** | 19 | 48.4 |
| | Season → Home | fresh | 51.7 (p90 53.1) | 56.5 | 3.1 | 32 | 48.1 |
| sinking (89→114) | Home → Home | consecutive | 45.4 (p90 49.6) | 47.0 | 1.6 | 37 | 43.4 |
| | Money → Home | consecutive | 46.4 (p90 51.2) | 47.1 | 4.3 | 19 | 42.1 |
| | Season → Home | consecutive | 44.9 (p90 49.9) | 47.6 | 2.2 | 40 | 42.1 |
| expecting (892→893) | Home → Home | fresh | 58.0 (p90 59.0) | 58.8 | 2.0 | 32 | 55.4 |
| | Money → Home | fresh | 61.6 (p90 62.2) | 62.2 | **5.6** | 19 | 55.4 |
| | Season → Home | fresh | 58.7 (p90 60.4) | 62.2 | 2.8 | 38 | 55.4 |
| expecting (895→920) | Home → Home | consecutive | 55.0 (p90 58.0) | 55.6 | 1.7 | 32 | 52.8 |
| | Money → Home | consecutive | 56.8 (p90 62.7) | 57.2 | 4.3 | 20 | 52.0 |
| | Season → Home | consecutive | 55.8 (p90 60.0) | 58.7 | 2.3 | 39 | 53.1 |

Worker split per advance, pooled over the three screens: fresh `sinking` before-tx 32.1 / IDB 0.6 /
after-tx 15.6 ms, `expecting` 31.3 / 0.7 / 23.3; consecutive `sinking` 25.6 / 0.8 / 15.4, `expecting`
30.3 / 0.8 / 20.1. Trace (3 untimed fresh advances per cell, per advance): main busy 16.2–29.0 ms
(Season→Home at `expecting` 37.6, with 7.0 ms GC), worker busy 46.1–55.7 ms.

**Reading**:
- **The worker is ~90 % of what a player waits for.** Command → rendered is 21.5–29.6 ms for a trivial
  command and 45–62 ms for an advance; the main thread's share is 1.0–2.6 ms in place and 1.6–6.7 ms for an
  advance. Money's cost is the swap (unmount Money + mount Home: 4.3–6.7 ms), not its update – a weight
  toggle with Money open produces zero DOM mutations.
- **Early → late**: the in-place command grows 21.5 → 29.6 ms (+38 %) from week 120 to 1,133, and all of
  the growth is the worker (19.2 → 27.4 ms) while the snapshot reply doubles (78 k → 153 k chars); the main
  thread's handling does not grow. The advance grows 45–46 → 55–57 ms (consecutive; fresh 51–56 → 58–62), and the post-advance
  `toSnapshot` + post (after-tx) is the part that grows most: 15.4 → 20.1 ms.
- **Cold vs warm**: the first advance after a load costs 3–6 ms more in the worker (48.4 vs 42.2 ms at
  `sinking`, 55.4 vs 52.8 at `expecting`).
- **Browser vs node**: this worker runs the same path slower than §B's node figures – after-tx 15.4–23.3
  ms against §B.3's 12.6–13.7 ms post-advance `toSnapshot`; before-tx on a trivial command 12.6–17.6 ms
  (wall time, including `await db()` and the async `CompressionStream` gzip) against §B's clone + encode of
  ~7–10 ms. §B is the right base for relative comparisons; §C is the user-facing latency on this machine.

Caveats, all of them: (1) commands are issued through the store, not a click – the advance skips
`playWeek` (`src/App.vue:904-948`): its calendar-sweep detour (a deliberate animation of seconds) and the
soft-leave guard are not in these numbers; the post-advance navigation is. (2) "Rendered" is the end of
the microtask drain after the reply's handler; work a component defers to a timer or rAF falls outside
it (it is inside snapshot → frame and inside CDP `TaskDuration`). (3) `performance.now()` is coarsened to
0.1 ms (the page is not cross-origin isolated – every stamp is on a 0.1 grid), and joining two threads'
clocks carries ±0.2 ms (the in-transit values run from −0.2 to 0.5 ms). (4) CDP `ScriptDuration` reports
less than the stamped handling (0.4–0.7 against 1–2.6 ms) – treat it as a lower bound; `TaskDuration` and
trace "main busy" include the probe's own 20 ms polling and observer callbacks – upper bounds. (5) The
trace's JS event set does not capture the worker's JS (0.4 ms JS inside 20 ms busy), so only busy is
quoted for the worker. (6) The consecutive series answered each card a week raised (birthday, season
wrap-up) untimed through the dialog's last enabled button, so its weeks 89–114 / 895–920 are this probe's
playthrough, not a committed career. (7) An M4 is a desktop-class CPU; a phone is slower by an unmeasured
factor, so every absolute here is a floor.

### C.3 The snapshot message as the browser sees it

| command | messages per command (to worker / back) | snapshot reply, JSON chars | other replies, chars | worker post → page dispatch ms | reading `e.data` on the page ms |
| --- | --- | --- | --- | --- | --- |
| `setWeightEnabled` | 2 / 2 (the command, then `listSlots`, `src/stores/game.ts:677-686`) | 78,103 (w120) · 80,132 (w86) · 98,568 (w412) · 149,688 (w892) · 152,915 (w1,133) | slots 323–359 | 0.1–0.3 | 0.2–0.5 |
| `advance(1)` | 3 / 3 (`advance`, `listSlots`, `listCareers`, `src/stores/game.ts:419-427`) | 81,477 (w86→87) · 149,354 (w892→893); consecutive 63,863–80,315 (w89–114), 145,617–150,660 (w895–920) | slots 342–362, careers 252–260 | 0.1–0.3 (max 0.5) | 0.2–0.4 |

Size is `JSON.stringify(e.data).length` of the reply object as the page received it (UTF-16 code units, a
proxy – the wire format is structured clone; §B.4's `v8.serialize` is the byte figure). It agrees with §B:
`pro` 98,504 chars of snapshot here against §B.4's 98,744 B JSON for the same fixture (one answered knock
and a toggled flag apart). The whole transfer – serialise in the worker, hop, deserialise on the page –
costs **≤ 1.2 ms even at 150 k chars (medians 0.3–0.8)**: the snapshot's size is paid where it is built (C.2 after-tx), not in
the pipe. Whether Chromium deserialises before dispatch or on first read of `data` is not established here;
either way the cost sits inside the two right-hand columns.

### C.4 Observations handed to the lanes (measured here, not yet findings)

1. **Main-thread render cost of the three largest screens is small**: 1.0–2.6 ms per snapshot in place,
   ≤ 6.7 ms for the Money → Home swap on an advance, and the update is always on screen within two frames. A proposal to split a screen for
   *render cost* has little latency to win on this machine; the size of those files is a maintainability
   question (lane E), not a runtime one. Lanes E, G.
2. **The worker's per-command path is the user-facing latency**: 19–27 ms for a command that changes one
   flag, 42–55 ms for a week; clone + encode + snapshot around the command dominate the command itself
   (compare §B.8 item 3). Lanes D, G.
3. **IndexedDB is not a lever**: ≈ 1 ms per autosave (1–5 % of the worker's time), flat from week 86 to
   1,133. Lanes D, G.
4. **Every advance is three round trips and every settings-style command two** (`listSlots` /
   `listCareers` after the snapshot); each extra reply is < 400 chars and < 0.5 ms here, but they are
   serialised behind the command in the worker's queue. Lane D (the store as a thin facade).
5. **Season re-renders 16–20 DOM mutation records on a command that changes only `weightEnabled`** (Home
   2, More 5, Money 0) – not traced; it may be `busy`-gated `disabled` attributes flipping and back. Lane E,
   if it matters.

## §D Gates

Phase 0d, 26.09 10:27–11:03, `03d92221`, from `/Users/letulip/Projects/Claude/tb-review`, no other review
agent running. Every run went through one wrapper (`RAW/gates/step.sh`) that writes `uptime`, `HEAD`,
start and end epochs, `WALL_S` and an `X_EXIT=$?` sentinel **inside** the command into
`RAW/gates/<label>.log`; every verdict below was read from a log carrying its sentinel, and every log
names `HEAD: 03d92221`. Runs were strictly serial; before each timed run the 1-minute load was waited
below 3 (below 6 for the first), and the one reading taken above that is flagged where it appears. Raw
JSON reporters, per-file tables and logs: `RAW/gates/` (`unit.json` merged from `unit-bulk.json` +
25 × `unit-heavy-*.json`, `unit-perfile.json`, `component.json`, `component-perfile.json`, `e2e.json`,
`walks.json`; analysis scripts `units-json.mjs`, `analyse.mjs`, `classify-walks.mjs`).

Side effects in the worktree: `dist/` rebuilt twice (10:36, 10:39) and by the e2e harness (plus
`dist-sw/`, `test-results/`, `playwright-report/`) – all gitignored; `git status` afterwards shows only
the untracked `docs/review-principles-2026-09-26/`. `pgrep -lf "vite-node|vitest|vite preview|playwright"`
was empty at the end.

### D.1 `npm run check`, step by step

Each `&&` link of `package.json:11`'s `check` run on its own, in the script's order.

| # | step | command as timed | wall s | exit | load (1 min) before |
| --- | --- | --- | --- | --- | --- |
| 1 | context:audit | `npm run context:audit` | 0.50 | 0 | 1.12 |
| 2 | doc-facts | `node scripts/doc-facts.mjs` | 0.03 | 0 | 1.12 |
| 3 | engine-purity | `node scripts/engine-purity.mjs` | 0.05 | 0 | 1.12 |
| 4 | pins:check | `npm run pins:check` | 0.20 | 0 | 1.12 |
| 5 | decisions:check | `npm run decisions:check` | 0.10 | 0 | 1.12 |
| 6 | map:world:check | `npm run map:world:check` | 0.34 | 0 | 1.12 |
| 7 | tools:registry:check | `npm run tools:registry:check` | 0.18 | 0 | 1.12 |
| 8 | typecheck | `npx vue-tsc -b --force` | 8.61 | 0 | 1.12 |
| 9 | check:tools | `npm run check:tools` | 2.90 | 0 | 1.23 |
| 10 | unit gate | `node scripts/units.mjs` | **374.21** | 0 | 1.73 |
| 11 | test:component | `npm run test:component` | **67.83** | 0 | 5.07 |
| 12 | vite build | `npx vite build` | 3.00 | 0 | 5.97 |
| 13 | install-size | `node scripts/install-size.mjs` | 0.04 | 0 | 5.81 |
| | **sum** | | **457.99 (7.6 min)** | | |

- The unit gate is **81.7 %** of `check`'s wall and the component project **14.8 %**; the eleven other
  steps together are 16.0 s (3.5 %). Steps 1–7 are 1.4 s combined.
- Step 12 was first timed at 3.34 s with the 1-minute load at 82.2 – self-inflicted: step 11's component
  pool drove it from 5.07 to 82 inside its own 68 s. Re-timed at 3.00 s once the load fell below 6; the
  table carries the re-run. That the component project alone lifts a ten-core machine to load ~80 is itself
  worth knowing when reading any timing taken just after it.
- Step 9, what it pays for: `npx vue-tsc -p tsconfig.tools.json --noEmit --listFilesOnly` lists **266**
  files under `tools/`, 152 under `src/` and 1 under `tests/` (613 in all with libs, `--extendedDiagnostics`:
  check time 1.94 s, total 2.64 s, 580 MB). Lead 10's 266 scripts cost **~2.9 s of a 458 s gate** here.
- Step 13 printed `16367 KiB in 362 precache entries, 17 KiB under the 16384 KiB ceiling (+46 KiB of worker
  scripts outside the manifest)` – §A5's figure, reproduced on a fresh build.
- Step 1 counted 468 Markdown files in the worktree (`corpus: 468 Markdown files, 167,850 lines`).

### D.2 The unit gate per file

**Method.** `RAW/gates/units-json.mjs` reproduces `scripts/units.mjs` exactly – the bulk pass first and
alone (`TB_UNIT_SKIP_HEAVY=1 npx vitest run --project unit`), then the 25 `HEAVY_UNIT_FILES`
(`scripts/heavy-tests.mjs:173-546`) one vitest process each, `floor(availableParallelism()/4)` = **2 lanes**
on this 10-core machine, in list order – adding `--reporter=json --outputFile.json=…` beside the dot
reporter. Run 10:40–10:46, load 2.63 at start, exit 0 on all 26 shards.

| run | total wall s | bulk s | heavy tail s | files | tests |
| --- | --- | --- | --- | --- | --- |
| `node scripts/units.mjs` (D.1 step 10) | 374.21 | 195 | ~179 | 348 + 25 | 6,610 + 616 |
| the JSON reproduction | 363.48 | 184.99 | 178.45 | 373 | 7,226 |

Bulk-pass vitest summary: `Duration 184.54s (transform 5.43s, setup 0ms, collect 149.61s, tests 1423.15s,
prepare 12.49s)` – 1,423 s of test time packed into 185 s of wall, ≈ 7.7 files in flight on average.
Summed per-file time (`endTime − startTime` from the JSON, which excludes collect): **1,721.5 s** – bulk
1,399.9 s over 348 files, heavy 321.6 s over 25.

⚠ **Bulk-pool file times are contended** (ten workers on ten cores); a heavy file's time is nearly solo
(two lanes). The two columns are not comparable row to row – which is why four bulk files were re-timed
solo below.

**The 30 slowest files** (file s = test time from the JSON; "walk" = the file's source contains a
`tickWeek(` loop or a walker call – `RAW/gates/walks.json`):

| # | file | pool | file s | tests | slowest test s | walk |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | tests/coach-load.test.ts | bulk | 43.79 | 19 | 17.25 | yes |
| 2 | tests/week-notes.test.ts | bulk | 42.86 | 53 | 10.34 | yes |
| 3 | tests/wave10-walker-retirement.test.ts | bulk | 39.17 | 3 | 17.52 | yes |
| 4 | tests/blocking-overlay.test.ts | bulk | 32.79 | 17 | 15.09 | yes |
| 5 | tests/college-second-act.test.ts | bulk | 28.60 | 44 | 1.74 | yes |
| 6 | tests/round34-reachable-ceiling.test.ts | bulk | 28.03 | 15 | 0.26 | yes (in `beforeAll`) |
| 7 | tests/play-down.test.ts | bulk | 27.83 | 10 | 3.34 | yes |
| 8 | tests/viz/commentary.test.ts | bulk | 26.89 | 42 | 9.93 | no |
| 9 | tests/coach-travel-edge-late-schemas.test.ts | bulk | 26.01 | 6 | 4.96 | yes |
| 10 | tests/knock-escalation.test.ts | bulk | 25.81 | 18 | 8.77 | yes |
| 11 | tests/junior-access.test.ts | bulk | 25.65 | 17 | 7.94 | yes |
| 12 | tests/round23-kid-share.test.ts | bulk | 25.47 | 14 | 8.18 | yes |
| 13 | tests/world-trio.test.ts | bulk | 25.41 | 44 | 2.67 | yes |
| 14 | tests/ladder-floor.test.ts | heavy | 24.56 | 28 | 3.99 | yes |
| 15 | tests/ending.test.ts | bulk | 23.20 | 61 | 10.38 | yes |
| 16 | tests/season-mirror.test.ts | bulk | 22.72 | 16 | 9.27 | yes |
| 17 | tests/birthday-ask.test.ts | bulk | 22.27 | 40 | 11.27 | yes |
| 18 | tests/round26-college-flow.test.ts | bulk | 21.59 | 20 | 2.71 | yes |
| 19 | tests/wave9-poise.test.ts | bulk | 21.19 | 5 | 21.19 | no |
| 20 | tests/round30-car-upkeep.test.ts | bulk | 20.64 | 8 | 4.96 | yes |
| 21 | tests/coach-travel-edge-mid-schemas.test.ts | heavy | 19.53 | 8 | 2.65 | yes |
| 22 | tests/tier-window.test.ts | bulk | 19.22 | 29 | 8.54 | yes |
| 23 | tests/college-birthday.test.ts | heavy | 18.40 | 14 | 3.63 | yes |
| 24 | tests/round29p3-market.test.ts | bulk | 18.39 | 19 | 4.02 | yes |
| 25 | tests/world.test.ts | bulk | 18.35 | 9 | 8.31 | yes |
| 26 | tests/save-import-guard.test.ts | bulk | 17.79 | 120 | 0.94 | yes |
| 27 | tests/offers.test.ts | bulk | 17.39 | 118 | 2.55 | yes |
| 28 | tests/condition.test.ts | bulk | 17.36 | 51 | 7.25 | yes |
| 29 | tests/round26-world-speaks.test.ts | heavy | 17.33 | 12 | 6.79 | yes |
| 30 | tests/coach-travel-edge-recent-schemas.test.ts | heavy | 17.32 | 7 | 2.66 | yes |

The 30 are 735.5 s of the 1,721.5 s (42.7 %); 28 of them walk a career. Single tests over 10 s, all in the
bulk pool except one: wave9-poise 21.19, wave10-walker-retirement 17.52, coach-load 17.25, plan 15.57,
spirit 15.19, blocking-overlay 15.09, birthday-ask 11.27, ending 10.38, week-notes 10.34,
economy-calibration-ordering 10.22 (heavy) – against the unit project's `testTimeout: 60_000`
(`vite.config.ts:375`).

**Solo re-timings of bulk files** (`npx vitest run --project unit --reporter=dot --reporter=json … tests/<f>`,
10:47–10:48, load 3.09–4.95):

| file | wall s | vitest tests s | vs the heaviest heavy shards |
| --- | --- | --- | --- |
| week-notes | 27.35 | 26.07 | heavier than every heavy shard (max ladder-floor 25.93) |
| coach-load | 24.64 | 23.39 | heavier than 24 of the 25 |
| wave10-walker-retirement | 21.55 | 20.30 | heavier than 24 of the 25 |
| coach-travel-edge-late-schemas | 15.68 | 14.25 | heavier than 16 of the 25 |

**Heavy tail, shard walls** (the JSON reproduction; units.mjs's own bar is "a shard printing much over
~30 s here"): ladder-floor 25.93 · coach-travel-edge-mid-schemas 20.88 · college-birthday 19.75 ·
round26-world-speaks 18.81 · coach-travel-edge-recent-schemas 18.67 · wave5-elite-gate 18.44 · travel-home
18.03 · coach-travel-edge-prior-schemas 16.36 · endings-bench 16.11 · economy-calibration 15.26 ·
prologue-handover 14.23 · coach-travel-edge-deepest 13.91 · coach-travel-edge-older 13.89 ·
college-birthday-wish 13.56 · coach-travel-edge 11.71 · economy-calibration-ordering 11.64 · kidLife 10.93 ·
birthday-career 10.45 · radar-read 10.32 · economy 10.31 · goldenSaves-quote 10.30 · goldenSaves 10.08 ·
goldenSaves-peak 10.02 · radar-training 9.65 · radar 7.60. Nine shards are under 11 s; each carries ~1.4 s
of process start (shard wall − file time).

**The coach-travel-edge family against birpc's 60 s window.** The multipliers are the repo's own: ×1.9
(`scripts/units.mjs` header, radar 34.2 → 64.51 s) and ×2.3 (`scripts/heavy-tests.mjs`, 18.09's runner).
Rungs = `grep -c "^  it(" <file>` (the ratchet's own parser, `MAX_RUNGS = 10`).

| file | pool | rungs | file s | shard wall s | ×1.9 | ×2.3 |
| --- | --- | --- | --- | --- | --- | --- |
| coach-travel-edge-late-schemas | **bulk** | 6 | 26.01 (contended) · 14.25 solo | – (solo 15.68) | 49.4 contended · 27.1 solo | 59.8 contended · 32.8 solo |
| coach-travel-edge-mid-schemas | heavy | 8 | 19.53 | 20.88 | 37.1 | 44.9 |
| coach-travel-edge-recent-schemas | heavy | 7 | 17.32 | 18.67 | 32.9 | 39.8 |
| coach-travel-edge-prior-schemas | heavy | 6 | 14.91 | 16.36 | 28.3 | 34.3 |
| coach-travel-edge-older-schemas | heavy | 5 | 12.54 | 13.89 | 23.8 | 28.8 |
| coach-travel-edge-deepest-schemas | heavy | 5 | 12.53 | 13.91 | 23.8 | 28.8 |
| coach-travel-edge | heavy | 5 | 10.16 | 11.71 | 19.3 | 23.4 |
| coach-travel-edge-helping | bulk | – | 0.78 | – | – | – |
| coach-travel-edge-rungs-ratchet | bulk | – | 0.00 | – | – | – |

Two facts for the lanes, measured here and not yet findings:
1. **`coach-travel-edge-late-schemas` is not in `HEAVY_UNIT_FILES`.** The fifth cut (`154b17d0`, 23.09)
   created it and touched three files – the new file, `-recent-schemas`, and the new ratchet – but not
   `scripts/heavy-tests.mjs`, whose last commit is `5e44e506` (18.09, the fourth cut). Every earlier member
   of the family sits in the heavy list; this one runs in the contended bulk pool, where it read 26.0 s,
   and the ratchet guards rung count, not pool membership. Lanes G, H.
2. **The family re-walks three careers 111 times.** `git grep -hoE "careerHashAtSchema\([0-9]+, [0-9]+"`
   over the family: 37 calls each for `(0, 1)`, `(5, 0)` and `(8, 0)`; every call runs
   `walkFrozenCareer` (`tests/coachTravelEdgeFixtures.ts:5410-5418`), `FREEZE_WEEKS = 156` ticks, un-memoised,
   and only the key peel differs per rung. Seven processes need at least 21 walks; they do 111. The family's
   summed file time is 113.0 s. Lane G (whether a per-file memo keeps every rung's meaning is lane H's call).

**Files whose setup walks a career** – `RAW/gates/classify-walks.mjs`, a text classifier (not a parser;
treat counts as ±a few): a `beforeAll`/`beforeEach` body containing a walk token or a call to a
same-file function whose body calls `tickWeek(`/`advanceWeeks(`/`careerSnapshot(`; a column-0 statement
calling one (module scope); a walking fixture module import. Share is of the 1,721.5 s summed file time.

| class | files | summed file s | share |
| --- | --- | --- | --- |
| walk inside `beforeAll`/`beforeEach` | 3 – round34-reachable-ceiling 28.03, college-league 16.15, round27-call-up-flow 14.95 | 59.14 | 3.4 % |
| walk through a shared fixture module (`coachTravelEdgeFixtures` ×7 files 113.00 s, `collegeBirthdayFixtures` ×2 30.61 s, `economyCalibration` ×2 24.01 s, `radarFixtures` ×3 23.60 s) | 14 | 191.22 | 11.1 % |
| walk at module scope (runs at collect, which the JSON's file time excludes – so this row UNDER-states) | 9 | 3.16 | 0.2 % |
| **any walk anywhere in the file** (setup, fixture or inside `it`) | **212** | **1,446.44** | **84.0 %** |
| no walk token | 161 | 275.09 | 16.0 % |

Reading: the "setup" walk the lead imagined is rare as a hook (3 files); the dominant shape is the walk
inside each `it` or a fixture function called per test, and files that walk are 84 % of the unit gate's
test time. The bulk pool: 198 walking files, 1,262.6 s of its 1,399.9 s.

### D.3 The component project per file

`npx vitest run --project component --reporter=dot --reporter=json --outputFile.json=RAW/gates/component.json`,
10:48, load 2.42, exit 0: **221 files, 2,390 tests, 66.09 s wall** (D.1's `npm run test:component`: 67.83 s).
Vitest summary: `Duration 65.64s (transform 6.19s, setup 379ms, collect 118.88s, tests 400.75s, environment
30.91s, prepare 7.94s)` – collect is 21 % of the summed phases. Summed per-file test time 396.6 s.

| # | file | file s | tests | slowest test s |
| --- | --- | --- | --- | --- |
| 1 | round42-kid-tile-and-account | 26.03 | 14 | 3.83 |
| 2 | round24-college-shell | 19.96 | 18 | 3.05 |
| 3 | round26-money-share | 10.78 | 3 | 4.54 |
| 4 | round23-kid-page | 10.53 | 5 | 2.60 |
| 5 | round21-coach | 9.56 | 12 | 2.16 |
| 6 | round27-call-up-flow | 9.40 | 7 | 2.17 |
| 7 | round26-college-flow | 8.96 | 8 | 2.04 |
| 8 | round36-pass2-home | 8.48 | 13 | 1.51 |
| 9 | round36-review-home | 8.15 | 23 | 0.64 |
| 10 | round26-college-card | 7.51 | 18 | 2.78 |
| 11 | coach-edge-card | 7.23 | 14 | 2.03 |
| 12 | round21-school-cutoff | 7.22 | 5 | 2.53 |
| 13 | round29-shop-topup | 7.21 | 11 | 0.94 |
| 14 | round42-team-budget | 6.72 | 17 | 0.81 |
| 15 | round42-psych-marker | 5.75 | 9 | 1.73 |
| 16 | round35-shop | 5.41 | 21 | 2.35 |
| 17 | round42-hero-and-ring | 5.41 | 19 | 0.54 |
| 18 | wave1-mood-word | 5.19 | 7 | 3.58 |
| 19 | wave11-weight-ui | 5.03 | 5 | 2.53 |
| 20 | round42-elite-retainer | 4.89 | 9 | 1.09 |

(all under `tests/component/`, `.test.ts`). No single test is over 4.6 s against the project's 20 s
`testTimeout` (`vite.config.ts:509`).

**The college re-walk family (lead 11).** Defined as the component files that walk a career with
`tickWeek` and then call `answerFork(…, 'college')` (`git grep -lE "answerFork\([^)]*'college'" --
tests/component` gives 11; `round24-fork-places` is dropped – it answers on a fresh `createWorld`, no walk):

| file | file s | tests | rank of 221 |
| --- | --- | --- | --- |
| round24-college-shell | 19.96 | 18 | 2 |
| round27-call-up-flow | 9.40 | 7 | 6 |
| round26-college-flow | 8.96 | 8 | 7 |
| round26-college-card | 7.51 | 18 | 10 |
| wave3-life-beat-freeze | 4.53 | 5 | 25 |
| round26-world-alive | 4.09 | 2 | 28 |
| college-second-act | 2.39 | 29 | 43 |
| round27-college-season | 1.78 | 9 | 63 |
| college-scene-ui | 1.50 | 17 | 73 |
| wave3-graduated-portrait | 0.59 | 10 | 126 |
| **10 files** | **60.71** | 123 | **15.3 % of the project's summed test time** |

Caveat: a walk memoised at module scope is paid at collect and is not in these file times, so the family's
true cost is somewhat higher; the files' own headers put the walk at "~114 ticks to the college departure"
(`college-scene-ui.test.ts:178`, `round26-college-card.test.ts:27`, `round26-world-alive.test.ts:25`).
Component walk classes, same classifier: any walk 129 files, 341.6 s (86.1 %); module-scope walk 17 files,
23.1 s; hook walk 1 file, 1.2 s.

### D.4 The sim project per file

`npm run test:sim -- tests/<file>.test.ts`, one file per invocation, serially, 10:50–11:00, every run exit 0
and `ok` at the first attempt (no stall, no retry). Load before each run 1.84–2.92 (1-minute). Wall includes
`npm` + `sim.mjs` + one vitest start (~1–2 s).

| file | wall s | exit | ×1.9 | note |
| --- | --- | --- | --- | --- |
| econ-reach-pro | **54.15** | 0 | 102.9 | 6 s under birpc's 60 s **locally**; 41.9 s when `heavy-tests.mjs` recorded it |
| econ-bench | 48.73 | 0 | 92.6 | 39.0 s recorded |
| econ-reach | 45.74 | 0 | 86.9 | 37.9 s recorded |
| econ-reach-agree | 44.94 | 0 | 85.4 | 35.8 s recorded |
| snapshot-cache-verify | 42.03 | 0 | 79.9 | |
| fatigue-bench-planner | 38.35 | 0 | 72.9 | 22.3 s recorded |
| econ-bench-survival | 36.47 | 0 | 69.3 | 29.1 s recorded |
| fatigue-bench | 34.15 | 0 | 64.9 | 29.4 s recorded |
| fatigue-bench-policy | 30.69 | 0 | 58.3 | 65.2 s before its 27.08 cut |
| fatigue-bench-policy-condition-middle | 23.47 | 0 | 44.6 | |
| fatigue-bench-policy-condition-working | 23.40 | 0 | 44.5 | |
| fatigue-bench-policy-104w | 21.97 | 0 | 41.7 | 19.7 s recorded |
| match/calibration | 15.53 | 0 | 29.5 | 14.9 s recorded |
| **13 files** | **459.62 (7.7 min)** | all 0 | | |

"Recorded" = the solo table in `scripts/heavy-tests.mjs`' `HEAVY_UNIT_FILES` docblock and `scripts/units.mjs`
(13.08). Eight of the thirteen are now over birpc's 60 s at the ×1.9 CI multiplier – but the sim project
does not run on a PR by ruling (CLAUDE.md), and the weekly cron runs on the runner, where `sim.mjs`'s
classifier accepts a double stall. The econ family has grown 21–29 % since its recording (fatigue-bench 16 %, fatigue-bench-planner 72 %) and
`econ-reach-pro` is the file closest to the local wall. Lanes G, H.

### D.5 e2e

`PLAYWRIGHT_JSON_OUTPUT_NAME=RAW/gates/e2e.json npm run test:e2e -- --reporter=list,json`, 11:01, load 2.88,
Playwright 1.62.1, 5 workers (the config's default locally), exit 0: **134 passed (1.2m), 72.04 s wall**
(`e2e: green in 72s`). Passing a reporter argument makes `scripts/e2e.mjs` skip its a11y-baseline prune
(it runs only when no argument is passed) – timing is unaffected.

- The two `webServer` builds (`dist/` and `dist-sw/`, concurrent) plus both previews: the first test
  started **8.4 s** after the run began.
- Summed test time 180.7 s over 5 workers; per-worker busy 62.2 / 30.0 / 30.1 / 27.3 / 28.9 (+ 2.2 on a
  sixth index).
- **The long pole is one test**: `wedding.spec.ts` › "she announces it, he answers, it lands eight weeks
  later – and it survives both save doors", **36.55 s**, started at +34.7 s and ended at +71.2 s – the
  suite's last result. The other four workers were idle for its final ~30 s. Lane G (ordering or
  splitting it is the lever; its 60 s per-test timeout is `playwright.config.ts`'s).

| spec | summed s | tests | slowest s |
| --- | --- | --- | --- |
| parity | 39.44 | 35 | 2.20 |
| wedding | 36.55 | 1 | 36.55 |
| a11y | 27.91 | 22 | 2.51 |
| responsive | 10.92 | 19 | 1.32 |
| breakup | 9.67 | 2 | 5.65 |
| week-advance | 8.06 | 3 | 3.76 |
| psychologist | 4.38 | 1 | 4.38 |
| r37-frame | 4.26 | 7 | 0.84 |
| soft-beat | 4.26 | 1 | 4.26 |
| parting | 3.96 | 1 | 3.96 |
| life-beat | 3.94 | 2 | 3.58 |
| expecting | 3.83 | 1 | 3.83 |
| seeded-careers | 3.59 | 7 | 0.56 |
| onboarding-tour | 2.44 | 6 | 0.45 |
| offline (chromium-sw) | 2.19 | 2 | 1.23 |
| the other 15 specs | 15.28 | 24 | ≤ 1.77 |

(30 specs, 134 tests – the brief's §4 count.)

### D.6 Against the brief's 25.09 figures

| gate | 25.09 (brief §4) | 26.09 here | delta | command |
| --- | --- | --- | --- | --- |
| unit | ≈ 7.5 min | **6.24 min** (374.21 s) | −17 % | `node scripts/units.mjs` (D.1 step 10); the JSON reproduction 363.48 s |
| sim | ≈ 8 min | **7.66 min** (459.62 s, 13 invocations summed) | −4 % | `npm run test:sim -- <file>` ×13 (D.4); the one-invocation `npm run test:sim` was not run |
| e2e | ≈ 1.3 min | **1.20 min** (72.04 s) | −8 % | `npm run test:e2e -- --reporter=list,json` (D.5) |
| component | – (CLAUDE.md: ~45 s) | 67.83 s | +51 % vs CLAUDE.md's figure | `npm run test:component` |
| `npm run check` | – | 457.99 s summed by step (7.6 min) | | D.1 |

The brief's 25.09 figures come from "the rig wave's belt logs" at an unrecorded load; these were taken at a
recorded 1-minute load under 3 with nothing else running, so the downward deltas are within what machine
state alone moves and should not be read as a speed-up. CLAUDE.md's `test:component` "~45s" and `npm test`
"~6 min (372s quiet, 02.09)" are prose figures; the component one is stale by half.

### D.7 Observations handed to the lanes (measured here, not yet findings)

1. **The gate's minutes are the unit gate (82 %) and the component project (15 %)**; every doc/registry gate
   together is 1.4 s and `check:tools`' 266 scripts are 2.9 s. Lead 10 is not a time cost. Lanes G, H.
2. **`HEAVY_UNIT_FILES` has drifted from its own measurement.** `coach-travel-edge-late-schemas` (15.7 s solo)
   was never added (D.2 fact 1); three bulk files are heavier solo than 24 of the 25 heavy shards
   (week-notes 27.4, coach-load 24.6, wave10-walker-retirement 21.6 s) while nine heavy shards take under 11 s.
   The list is curated by incident, not by measurement. Lanes G, H.
3. **Walked careers dominate test time**: 84 % of unit and 86 % of component test time is in files that walk;
   the coach-travel-edge family re-walks 3 careers 111 times (113 s); the college component family is 60.7 s
   (15.3 % of that project). Shared serialised fixtures are the lead-11 lever. Lanes G, H.
4. **The sim econ family grew 21–29 % since 13.08** and `econ-reach-pro` reads 54 s locally against a 60 s
   wall that CI runners stretch ×1.9–2.3. Lanes C, G.
5. **e2e's wall is one test**: `wedding.spec.ts` 36.6 s of a 72 s run, started last. Lane G.
6. **The component project drives this machine to load ~80 on its own** (5 → 82 within its 68 s), which is
   the contention CLAUDE.md warns about, produced by one gate step – any timing read just after it is
   contaminated. Lanes G, H.
