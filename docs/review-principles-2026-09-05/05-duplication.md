---
type: review
status: audit
area: project-review
canonical: false
last-reviewed: 2026-09-05
baseline: 98e3560b
---
# Duplication – 5 September 2026 review

## Verdict

Mechanically the product code is clean: `src/` carries **0.23 % duplicated lines** (29 clones over 215k lines, comments skipped), and the four clones that cross the `src`/`tests` boundary are all restatements the tests make on purpose and say so. The duplication that exists lives elsewhere: **tests 3.3 %** and **tools 3.1 %**, almost all of it scaffolding – 33 verbatim copies of a `localStorage` shim, 116 copies of the tick-and-skip-the-tournament loop, and about 210 local `pct` / `mean` / `money` / `median` / `quantile` / `argOf` helpers across the benches. Semantically the engine has a handful of small clusters worth a helper (the counting-window fold ×4, the friendly-match record ×3, the staff-fare charge ×2, `clamp` ×11, `TIER_LADDER.indexOf` ×28) and the UI has the match-surface triple, the country picker, a dozen snapshot selectors and five CSS objects pasted across screens. None of it is architectural. Three of the copies **differ**, and those are the findings: the diary paints her portrait off the band clock while every other surface reads her real age (D-01); two engine feed lines format money by hand and disagree with `shared/money.ts` on rounding and on the −0 edge (D-02); and the tools' `money`/`pct`/`median` copies disagree with each other in ways a bench author will not notice (D-05). Worth one small wave for the engine and UI helpers; the test and tool scaffolding is a hygiene backlog that can be paid down file by file.

## Method

- **Tool**: `jscpd 5.1.2`, run as `npx --yes jscpd@latest` (it installs under `~/.npm/_npx`, nothing under the repo; `node_modules` was never written). Verified with `npx --yes jscpd@latest --version`.
- **Working directory**: the worktree root `…/scratchpad/wt-rv36` at `98e3560b`. All tool output in `…/scratchpad/rv36-D/` (`jscpd-w-<run>/jscpd-report.json` + `console.txt`, `rank.mjs`, `numlit.mjs`, `rank-*.txt`, `*-grep.txt`, `pins.txt`).
- **Commands** (one per run, `<paths>` = `src` | `tests` | `tools` | `scripts e2e` | `src tests`):
  `npx --yes jscpd@latest --workers 2 --no-tips --no-colors --skip-comments --reporters json,console --output <scratch>/jscpd-w-<run> --min-tokens 60 --min-lines 6 --format typescript,vue,css,javascript <paths>`
  and the low-threshold pass on `src` with `--min-tokens 30 --min-lines 4`. A first pass without `--skip-comments` (jscpd's default `mild` mode) was run and discarded: it added one css "clone" that was two runs of `-----` inside comments (`components/BracketTabs.vue:479-485` vs `components/MatchViewer.vue:2182-2183`, the second side is prose inside a `/* … */`). Every other number moved by <0.2 %.
- **What the tokenizer did with `.vue`**: jscpd 5 splits an SFC into `:typescript` (script), `:html` (template) and `:css` (style) sub-blocks and reports them under those formats; the bare `vue` row (68 files, 0 clones) is the whole-file pass and carries nothing. Sub-block line numbers were checked against the source (e.g. `BracketTabs.vue:479-485` is exactly `.bt-final {…}`) and are file-absolute. **The `html` format is unreliable and its numbers are discounted**: it tokenises coarsely (`HomeScreen.vue:1305-1466` is reported as 162 lines / 70 tokens), it does not strip HTML comments even with `--skip-comments` (`TournamentFlow.vue:789-817` vs `CalendarScreen.vue:324-352` is two `<!-- -->` blocks), and in the low-threshold run it reports the whole `<script>` block as one text node (eight "clones" with the range `1-N`) and one inverted range (`KidScreen.vue:597-328`). Every html pair cited below was read and confirmed by hand; the css and typescript sub-blocks behaved.
- **Ranking**: `rank.mjs` sorts a report's pairs by tokens and by lines, unions overlapping sites into clusters, and (for the `src tests` run) keeps only pairs with one side in `src/`.
- **Semantic pass**: `grep`/`git grep` censuses (money idioms, `% 52` / `/ 52`, `.sort((`, `@media`, `computed` names across components, helper definitions in tools and tests), `numlit.mjs` (numeric literals ≥ 2 digits per file, engine ∩ UI), and reading every cited site. Pin counts come from `git grep -l "<file>" -- tests/` and `git grep -l "<symbol>" -- tests/` (the CLAUDE.md query; ~81 % precision, so a count is "tests that name it", mounted tests included).
- **Not read**: `docs/` (out of this lane's scope), `e2e/` beyond the jscpd pairs, `tools/*.mjs` beyond the two probe heads, `migrations.ts` beyond the idiom census, any personal save.

## A. Mechanical results

### Per run (comments skipped)

| Run | Files | Lines | Clones | Duplicated lines | Duplicated tokens |
| --- | ---: | ---: | ---: | ---: | ---: |
| `src` (60 tok / 6 lines) | 408 (229 ts+script, 65 template, 46 style, 68 whole-sfc) | 215,512 | 29 | 488 (0.23 %) | 2,385 (0.36 %) |
| – of which typescript | 229 | 99,760 | 8 | 91 (0.09 %) | 673 (0.24 %) |
| – of which css | 46 | 34,995 | 9 | 134 (0.38 %) | 659 (1.09 %) |
| – of which html | 65 | 40,336 | 12 | 263 (0.65 %) | 1,053 (0.88 %) |
| `tests` | 376 | 151,504 | 332 | 5,061 (3.34 %) | 32,496 (3.55 %) |
| `tools` | 189 (185 ts + 4 mjs) | 64,207 | 192 | 1,958 (3.05 %) | 17,448 (3.41 %) |
| `scripts` + `e2e` | 37 | 9,411 | 14 | 166 (1.76 %) | 1,093 (2.61 %) |
| `src` + `tests` together | 784 | 367,016 | 365 | 5,617 (1.53 %) | 35,250 (2.24 %) |
| – **cross-area** (one side in `src/`) | | | **4** | 72 | 369 |
| `src` LOW (30 tok / 4 lines) | 425 | 217,192 | 344 | 5,930 (2.73 %) | 14,897 (2.26 %) |
| – of which typescript | 241 | 100,232 | 163 | 1,261 (1.26 %) | 6,895 |
| – of which css | 48 | 36,017 | 100 | 863 (2.40 %) | 4,070 |
| – of which html (artefact-inflated, see Method) | 68 | 40,522 | 81 | 3,806 (9.39 %) | 3,932 |

### `src` – all 25 largest pairs by tokens (60/6), each read

| Tok | Lines | Sites | What it is |
| ---: | ---: | --- | --- |
| 239 | 18 | `src/components/TournamentFlow.vue:1290-1307` ↔ `:1347-1364` | The draw-path grid + `Continue` pill, verbatim on both finale posters (hers, and the one for a student title somebody else won). Real. |
| 122 | 7 | `src/engine/diary/pool.ts:589-595` ↔ `:592-599` | Four identical `text: null` rows – "Four deliberate silences" (comment at 590). Deliberate. |
| 115 | 25 | `src/components/MatchReplay.vue:37-59` ↔ `src/components/PracticeFlow.vue:66-90` | `opts` / `annotated` / `previewEvent` computed triple. Real – cluster B8. |
| 97 | 13 | `src/components/PrologueCard.vue:720-732` ↔ `:747-759` | Two card variants' style blocks. Small. |
| 95 | 13 | `src/components/PracticeFlow.vue:240-252` ↔ `src/components/TournamentFlow.vue:1209-1221` | The box-score `<table>` (tables start at 231 / 1199). Real – B8. |
| 93 | 9 | `src/engine/world/sponsors.ts:1006-1014` ↔ `:1034-1046` | `chargeMasseurTravel` vs `chargeCoachTravel` bodies. Real – B6. |
| 90 | 29 | `src/components/screens/CalendarScreen.vue:1145-1173` ↔ `src/style.css:1929-1946` | `.cal-go` vs `.next-week-bar` – the floating-CTA box. Recorded triple – B9. |
| 90 | 8 | `src/components/screens/HomeScreen.vue:1273-1280` ↔ `:1422-1430` | Header tools drawn twice (phone header / desktop rail). Deliberate, ruling quoted below. |
| 88 | 23 | `src/engine/world/college.ts:506-528` ↔ `:868-890` | Friendly-match record (call-up rubber vs college-league round). Real – B5. |
| 87 | 15 | `src/components/ForkDialog.vue:571-584` ↔ `src/components/RetirementDialog.vue:292-305` | `.fork-answer` / `.retire-answer` option button. Real – B9. |
| 85 | 29 | `src/components/TournamentFlow.vue:789-817` ↔ `src/components/screens/CalendarScreen.vue:324-352` | Two HTML comments. Tokenizer artefact. |
| 80 | 7 | `src/components/screens/HomeScreen.vue:1257-1263` ↔ `:1408-1414` | Same deliberate second copy as above. |
| 75 | 21 | `src/components/screens/CalendarScreen.vue:1232-1242` ↔ `src/components/screens/SeasonScreen.vue:2673-2683` | The four-stop scrim gradient. Real – B9. |
| 71 | 7 | `src/components/OfferLetter.vue:718-724` ↔ `:805-812` | Two letter variants' rows. Small. |
| 70 | 162 | `src/components/screens/HomeScreen.vue:1305-1466` ↔ `:1308-1498` | Overlapping ranges, 70 tokens – html artefact of the deliberate copy. |
| 69 | 7 | `src/components/OnboardingWizard.vue:263-269` ↔ `src/components/PrologueCard.vue:189-196` | Country-picker search. Real – B8. |
| 68 | 7 | `src/components/PrologueLocalOpen.vue:254-260` ↔ `:269-275` | Two rows of one card. Small. |
| 68 | 7 | `src/components/screens/HomeScreen.vue:1232-1238` ↔ `:1389-1395` | Deliberate second copy. |
| 67 | 7 | `src/components/OnboardingWizard.vue:432-438` ↔ `:440-446` | Two option tiles. Small. |
| 66 | 8 | `src/components/PrologueCard.vue:621-626` ↔ `src/components/PrologueLocalOpen.vue:433-438` | Hero fade gradient (a third lives at `HomeScreen.vue:1895`). Real – B9. |
| 64 | 24 | `src/components/screens/CalendarScreen.vue:1145-1168` ↔ `src/components/screens/ThisWeekScreen.vue:450-468` | `.cal-go` vs `.week-proceed`. Recorded triple – B9. |
| 62 | 14 | `src/engine/world/snapshot.ts:1091-1104` ↔ `:1195-1208` | The frozen-opponent block of two `TournamentView` builders. Small – B5 note. |
| 62 | 7 | `src/engine/diary/pool.ts:208-214` ↔ `:214-220` ↔ `:220-227` | Diary line table rows. Data, deliberate. |
| 60 | 14 | `src/components/WeekRecapCard.vue:1321-1334` ↔ `src/style.css:3668-3682` | `.recap-dot` defined twice **with different values**. Finding D-04. |
| 60 | 10 | `src/components/EndingScreen.vue:512-521` ↔ `src/components/ForkDialog.vue:576-585` | `.ending-fork-option` – third copy of the option button. B9. |

Three smaller typescript pairs from the LOW run that matter: `src/engine/match/closedForm.ts:29-33` ↔ `src/engine/match/liveProb.ts:60-64` (the tiebreak recursion head – the second is a from-any-state generalisation of the first and `tests/match/liveProb.test.ts` checks one against the other, comment at its line 208: cross-pinned, leave); `src/engine/diary/weekNotes.ts` (25 sites of 5-6 lines – the diary line tables, data); `src/engine/offers.ts:1245-1249 / 1278-1282 / 1329-1333` (three offer-term builders, small).

### `tests` – 25 largest pairs by tokens, plus the clusters

| Tok | Lines | Sites | What it is |
| ---: | ---: | --- | --- |
| 353 | 58 | `tests/component/round24-coach-card.test.ts:48-105` ↔ `tests/component/round27-call-up-flow.test.ts:63-107` | localStorage shim + snapshot helper |
| 303 | 50 | `tests/component/a11y-sweep.test.ts:62-111` ↔ `tests/component/round26-college-flow.test.ts:71-105` | shim + fixture |
| 290 | 43 | `tests/round32-brand-inertia.test.ts:85-127` ↔ `tests/round32-brand-multiple.test.ts:60-103` | `shopper`/`parkAt`/`proSeasons`/`winTitles` ("…'s own shopper") |
| 244 | 40 | `tests/component/injury-cancelled-row.test.ts:96-135` ↔ `tests/injury-report.test.ts:52-92` | `base`/`seedForLayoff`/`enterable` ("Lifted from") |
| 240 | 46 | `tests/component/round31-week-entry.test.ts:71-116` ↔ `tests/component/round33-tournament-arrival.test.ts:38-78` | shim + fixture |
| 224 | 28 | `tests/component/injury-cancelled-row.test.ts:135-162` ↔ `tests/injury-report.test.ts:92-120` | `consecutivePair` |
| 208 | 36 | `tests/component/round24-college-shell.test.ts:90-125` ↔ `tests/component/round26-college-flow.test.ts:60-95` | shim + fixture |
| 207 | 34 | `tests/component/round24-college-shell.test.ts:92-125` ↔ `tests/component/round27-call-up-flow.test.ts:65-96` | shim + fixture |
| 204 | 31 | `tests/component/round24-college-shell.test.ts:92-122` ↔ `tests/component/round26-college-card.test.ts:153-180` | shim + fixture |
| 198 | 43 | `tests/component/round24-coach-card.test.ts:48-90` ↔ `tests/component/round26-college-card.test.ts:63-102` | shim + fixture |
| 191 | 34 | `tests/component/round18-coach.test.ts:57-90` ↔ `tests/component/round36-desktop-shell.test.ts:41-72` | shim + fixture |
| 188 | 42 | `tests/component/round24-coach-card.test.ts:48-89` ↔ `tests/component/round26-world-alive.test.ts:59-81` | shim + fixture |
| 177 | 16 | `tests/viz/commentary.test.ts:7-22` ↔ `tests/viz/matchClock.test.ts:21-34` | match fixture |
| 176 | 29 | `tests/component/round14-group-c.test.ts:28-56` ↔ `tests/component/round21-coach-photo.test.ts:57-86` | shim + fixture |
| 172 | 27 | `tests/seasonWrapUp.test.ts:162-188` ↔ `tests/tournamentReveal.test.ts:19-45` | walk-to-a-tournament loop |
| 166 | 22 | `tests/component/round36-desktop-shell.test.ts:41-62` ↔ `tests/component/round36-rail-dashboard.test.ts:50-81` | shim |
| 165 | 30 | `tests/season/wOnRamp.test.ts:38-67` ↔ `tests/season/wildCard.test.ts:59-85` | ladder fixture |
| 165 | 25 | `tests/component/a11y-sweep.test.ts:55-79` ↔ `tests/component/round21-dialogs.test.ts:25-47` | shim |
| 165 | 17 | `tests/round34-ladder-plaques.test.ts:248-264` ↔ `tests/season-mirror.test.ts:122-142` | season-history fixture |
| 163 | 17 | `tests/round34-ladder-plaques.test.ts:248-264` ↔ `tests/season-mirror.test.ts:158-176` | same |
| 161 | 26 | `tests/component/round18-coach.test.ts:57-82` ↔ `tests/component/round36-review-home.test.ts:39-57` | shim |
| 161 | 20 | `tests/fatigue-bench-planner.test.ts:35-54` ↔ `tests/fatigue-bench.test.ts:40-61` | bench harness |
| 161 | 17 | `tests/round34-ladder-plaques.test.ts:248-264` ↔ `tests/season/domestic-season-to-date.test.ts:60-78` | season-history fixture |
| 160 | 23 | `tests/component/round26-world-alive.test.ts:58-80` ↔ `tests/component/round34-home-type.test.ts:58-84` | shim |
| 158 | 35 | `tests/component/round26-span-gate-ui.test.ts:50-84` ↔ `tests/component/round29-span-repair.test.ts:95-117` | shim + fixture |

Clusters with three or more sites: 26. The two largest are (i) the **localStorage shim**, 33 files – `tests/component/{a11y-sweep:62-75, ad-offer-letter:48-61, career-watermarks:51-70, college-second-act:58-71, home-strip-and-mail:40-53, r2-13-span-report:55-68, round14-group-c:37-50, round18-coach:64-77, round19-wrapup:48-61, round20-ui:64-80, round21-coach-photo:61-74, round21-dialogs:31-44, round21-popup-order:52-65, round24-academy-letter:26-39, round24-coach-card:55-68, round24-college-shell:77-90, round26-college-card:69-82, round26-college-flow:71-84, round26-span-gate-ui:55-68, round26-world-alive:65-78, round27-call-up-flow:67-80, round28-top-notices:42-55, round29-inbox-subjects:47-60, round29-shoot-clash-ui:50-63, round29-span-repair:100-113, round31-week-entry:88-101, round33-tournament-arrival:54-67, round34-home-type:65-78, round35-ui:73-86, round36-desktop-shell:47-60, round36-rail-dashboard:56-69, round36-review-home:42-55, tour-briefing:45-58}.test.ts` – 31 byte-identical 14-line copies plus two variants (`career-watermarks` adds a `mode === 'throws'` arm to `getItem`/`setItem`; `round20-ui` names the object `memoryStorage`); and (ii) the **enter-everything-then-tick-and-skip loop**: `tests/diary.test.ts:747-762`, `tests/travel-home.test.ts:301-320, 894-905, 921-933, 995-1006`, `tests/week-scene.test.ts:406-422`.

### `tools` – 25 largest pairs by tokens, plus the clusters

| Tok | Lines | Sites | What it is |
| ---: | ---: | --- | --- |
| 299 | 25 | `tools/coach-eye-bench.ts:110-134` ↔ `tools/what-money-buys.ts:100-125` | `pad`/`padEnd`/`rule`/`money`/`pctl`/`mean`/`shareOf` – "the house style of econ-bench/what-money-buys, kept locally tiny" |
| 255 | 21 | `tools/injury-landscape.ts:123-143` ↔ `tools/rehab-lever.ts:84-102` | bench table |
| 245 | 27 | `tools/domestic-ladder-probe.ts:54-80` ↔ `tools/domestic-season-to-date.ts:88-115` | `walk()` – "Copied … rather than imported: that file runs its four sections at module load" |
| 220 | 11 | `tools/domestic-ladder-probe.ts:258-268` ↔ `tools/domestic-season-to-date.ts:226-236` | same pair |
| 205 | 17 | `tools/coach-eye-bench.ts:117-133` ↔ `tools/wall-l1-bench.ts:131-147` | helper block |
| 189 | 50 | `tools/college-choice-probe.ts:43-92` ↔ `tools/college-price-probe.ts:65-116` | probe header + arms |
| 189 | 25 | `tools/header-probe.mjs:5-29` ↔ `tools/runoff-probe.mjs:19-44` | static server + chromium boot |
| 179 | 19 | `tools/ladder-vs-targets.ts:140-158` ↔ `tools/what-money-buys.ts:130-144` | helper block |
| 155 | 18 | `tools/acceptance-cuts.ts:298-315` ↔ `tools/college-fork.ts:300-316` | table |
| 153 | 25 | `tools/college-fork.ts:40-64` ↔ `tools/junior-access.ts:37-61` | args + presets |
| 150 | 16 | `tools/prologue-balance-bench.ts:82-97` ↔ `tools/prologue-handover-bench.ts:31-46` | helper block |
| 146 | 16 | `tools/points-economy.ts:364-379` ↔ `:1114-1130` | same file |
| 137 | 13 | `tools/coach-eye-bench.ts:116-128` ↔ `tools/ladder-vs-targets.ts:111-123` | helper block |
| 136 | 10 | `tools/wall-l1-bench.ts:154-163` ↔ `tools/winrate-read.ts:167-176` | table |
| 131 | 15 | `tools/domestic-ladder-probe.ts:328-342` ↔ `tools/domestic-season-to-date.ts:287-300` | same pair |
| 130 | 12 | `tools/age-injury-fit.ts:53-64` ↔ `tools/injury-audit.ts:44-56` | args |
| 129 | 25 | `tools/growth-age-sweep.ts:766-790` ↔ `tools/potential-band-sweep.ts:592-630` | table |
| 129 | 18 | `tools/acceptance-cuts.ts:52-69` ↔ `tools/outgrown-entry-probe.ts:41-53` | args |
| 128 | 18 | `tools/drought-probe.ts:76-93` ↔ `tools/top50-season-probe.ts:44-57` | walk |
| 127 | 14 | `tools/ceiling-walk.ts:83-96` ↔ `tools/points-economy.ts:97-103` | helper |
| 126 | 21 | `tools/college-news-probe.ts:188-208` ↔ `tools/college-year-content.ts:119-132` | table |
| 126 | 18 | `tools/pro-season-probe.ts:53-70` ↔ `tools/retirement-shape-probe.ts:68-81` | walk |
| 125 | 10 | `tools/coach-eye-bench.ts:122-131` ↔ `tools/potential-band-sweep.ts:127-140` | helper |
| 123 | 7 | `tools/retirement-shape-probe.ts:445-451` ↔ `:459-465` | same file |
| 122 | 22 | `tools/boredom-guard.ts:158-179` ↔ `tools/wallet-audit.ts:183-202` | table |

Clusters with three or more sites: 17; the largest is the `argOf` arrow (8 jscpd sites, e.g. `tools/acceptance-cuts.ts:57-61`, `tools/band-probe.ts:33-36`, `tools/calendar-shape.ts:27-30`; by grep the identical five-line definition is in **55** tool files).

### `scripts` + `e2e`

14 clones, 166 lines. `scripts/pin-ratchet.mjs:46-63` ↔ `scripts/tools-registry.mjs:56-73` (a directory walk; also `scripts/context-audit.mjs:131-143`) and e2e spec setup (`e2e/offline.spec.ts:50-84` twice within the file, `e2e/onboarding-tour.spec.ts:74-82 / 92-98` ↔ `e2e/prologue.spec.ts:305-311`). Small; no proposal beyond a `walk(dir)` in `scripts/lib/`.

### Cross-area (`src` ↔ `tests`) – all four, all deliberate

| Engine | Test | The test's own words |
| --- | --- | --- |
| `src/engine/knock.ts:246-253` (`drawPart`) | `tests/plan.test.ts:405-414` (`partFor`) | "re-spelled in the test so the reproduction below is independent of the implementation it is checking" |
| `src/engine/season/names.ts:53-60` (`SURNAMES`, the first 44) | `tests/season/surnames.test.ts:13-22` (`ORIGINAL_44`) | "An INDEPENDENT copy of the original 44, in their original order. This literal is the guard" |
| `src/engine/season/preview.ts:518-565` (`CROWD_BANDS`) | `tests/preview.test.ts:45-79` (`EXPECTED_BANDS`) | "these numbers restate preview.ts's table independently, so retuning a band is a deliberate edit that shows in a diff" |
| `src/engine/world/birthday.ts:856-863` (`shuffled`) | `tests/birthday-ask.test.ts:432-439` (`shuffle`) | "The engine's own enumeration, replayed – combinations in index order" |

## B. Semantic clusters

### B1. Money formatting and cents → dollars

Canonical: `src/shared/money.ts` – `formatCents` (24), `entryFeeLabel` (46), `formatCentsSigned` (51); 25 component files, 6 engine files (`world.ts:54`, `kidLife.ts:39`, `world/shop.ts:49`, `world/album.ts:22`, `world/brand.ts:291`, `world/phaseFinance.ts:30`, `world/assets.ts:465`, `world/sponsors.ts:17`) and 3 tools import it; `tests/money-format.test.ts` gates components/composables/stores against a local formatter coming back. The engine is **deliberately out of that gate's scope** (its lines 50-54: "src/engine (world.ts feed text builds money strings inline; those sentences are persisted inside saves and pinned by their own suites, so renaming their formatting would be a schema-adjacent change this wave must not make)"). Since then `world.ts` itself imports `formatCents` (line 54) and `sponsors.ts:1206` writes a feed line with it, so the boundary the gate drew has already been crossed on purpose. The hand-rolled engine copies that remain:

| Site | Excerpt | Differs from `formatCents`? |
| --- | --- | --- |
| `src/engine/world.ts:808` | `` `💰 First prize money – $${Math.round(prize / 100).toLocaleString('en-US')} …` `` | no (prize ≥ 0) |
| `src/engine/world.ts:1487` | `` `… Family budget: $${(fundsCents / 100).toLocaleString('en-US')}.` `` | **yes – no `Math.round`**: a non-whole-dollar balance prints decimals |
| `src/engine/world/milestones.ts:406-407` | `const fundsSign = fundsDeltaCents >= 0 ? '+' : '-'` / `` `${fundsSign}$${Math.abs(Math.round(fundsDeltaCents / 100)).toLocaleString('en-US')}` `` | **yes – sign read off the cents**: −49 ¢ prints `-$0`; `formatCentsSigned(-49)` is `+$0` and money.ts calls that edge "LOAD-BEARING" |
| `src/engine/world/sponsors.ts:487` | `` `$${Math.round((ended.coveredCents ?? 0) / 100).toLocaleString('en-US')}` `` | no (≥ 0) |
| `src/engine/world/college.ts:1189-1194` (`moneyClause`) | `const dollars = Math.round(cents / 100)` … two different sentences by sign | deliberately a different sentence, not a formatter – leave |

UI: `MoneyScreen.vue:121, 2566, 2568, 2595, 2597` divide by 100 for input `min`/`placeholder` values (numbers, not display strings – fine). Tools: 27 local `money` (see B11). → Finding **D-02**.

### B2. Week / season / age arithmetic

- Season index. Canonical `seasonIndexOf(week)` at `src/engine/world/ledger.ts:203` ("the ONLY thing allowed to identify a season"); `fieldSeasonOf` at `src/engine/season/fieldPros.ts:517` is a **recorded** copy ("deliberately the same arithmetic … re-stated here because season/* cannot import world.ts … Pinned against the world's own function in tests/season/fieldPros.test.ts"). Unrecorded inline copies: `src/engine/season/calendar.ts:2053` `const year = Math.floor(week / 52)` (event ids), `src/engine/economy.ts:5010` `Math.floor(week / WEEKS_IN_SEASON)`, and in the UI `src/components/screens/TrophiesScreen.vue:98` `seasonYear(Math.floor(week / WEEKS_IN_SEASON))` – the UI re-derives it because the owner lives in `engine/world/ledger.ts`, which a screen should not reach into (→ D-06: move the arithmetic to `src/shared/dates.ts` next to `WEEKS_IN_SEASON`, re-export from `ledger.ts`; `seasonIndexOf` is named by 10 tests as an import, none as a pin).
- Age. Canonical `kidAgeAt(world, week)` at `src/engine/world/age.ts:121` ("IT EXISTS SO THE RULING HAS ONE SPELLING"); `ageAtWeek` (67) is the coach-market clock and says in its own doc "IF YOU ARE ASKING HOW OLD SHE IS, THIS IS THE WRONG FUNCTION". `src/engine/world/album.ts:74` `ageAt` is a one-line wrapper over `kidAgeAt` (fine). The diary re-spells the band clock: `src/engine/diary.ts:554` `portraitStage(startAgeYears + Math.floor(pick.week / 52))` and `:594` `portraitStage(view.startAgeYears + Math.floor(view.week / 52))` (with the comment "The age band is the same arithmetic `selectMemory` uses below (start age plus completed years)") – while the same view is built with `ageYears: kidAgeAt(world, world.week)` at `src/engine/world/snapshot.ts:1287`. → Finding **D-01**.
- `weekDateLine`, `weekLabel` etc. are used, not copied; `dateLine` is computed in three screens (`CalendarScreen.vue:133` on `week + 1`, `ThisWeekScreen.vue:77`, `HomeScreen.vue:202`) – one-liners over the shared helper, not duplication.

### B3. The counting-window fold (ranking) – 4 copies, 5 comparators

The same three-step fold – filter `isCountingResult ∧ playerId ∧ week ∈ [from, current]`, sort `(a, b) => b.points - a.points || b.week - a.week`, then `windowSlots(list, bestN)` – at:

- `src/engine/season/ranking.ts:344-354` (`rankablePointsFor`, with `countsFor`), and `:508-512` (the standings fold);
- `src/engine/world/ladder.ts:1063-1073` (`bookClosedTo`);
- `src/engine/world/snapshot.ts:651-662` (`computeCountingResults`, which sorts twice: once before and once after `windowSlots`).

The codebase already records a drift in exactly this cluster: `ladder.ts:1056-1061` and `snapshot.ts:641-650` both explain that the filter used to read `world.week - r.week <= RESULTS_WINDOW`, "`windowFromWeek(week, 'rolling52')` written out by hand – true for the two professional-side tracks and wrong for the domestic one the day its table became season-to-date". Today all four agree; a helper is what stops the fifth copy drifting.

### B4. Tier rung and its comparators

`TIER_LADDER.indexOf(tier)` as "the rung" appears 28 times in 12 files (`world/entryCaps.ts` ×10, `season/tournament.ts` ×3, `world/sponsors.ts` ×2, `season/calendar.ts` ×2 incl. the local `const rung = (t) => TIER_LADDER.indexOf(t)` at 2179, `composables/weekDays.ts` ×2, `composables/tierState.ts` ×2, `composables/nextGoal.ts` ×2, `world/matchNews.ts`, `world/ladder.ts`, `world/coachMarket.ts`, `world/album.ts`, `season/rival.ts`); `src/viz/preview.ts:83` exports its own `rungOf`. The "by week, then strongest rung first" comparator is spelled two ways: `src/engine/season/calendar.ts:2180` `a.week - b.week || rung(b.tier) - rung(a.tier)` and `src/engine/world/coachMarket.ts:1723` `a.week - b.week || TIER_LADDER.indexOf(b.tier) - TIER_LADDER.indexOf(a.tier)`; the same again in `tools/domestic-ladder-probe.ts:64` / `tools/domestic-season-to-date.ts:100`. The allocation ordering the 2 September review flagged is now a single owner: `byAllocationPriority` at `src/engine/season/tournament.ts:713`, called from `:780`, `:973` and `src/engine/world/phaseAiWeek.ts:195`.

### B5. The friendly-match record – 3 copies

`simulateMatch → score string → kidWon → retiredId → verb → addEvent({type:'match', friendly:true, …})` at `src/engine/world/planner.ts:410-452` (`resolvePractice`), `src/engine/world/college.ts:495-528` (`playCallUpRubbers`) and `src/engine/world/college.ts:857-890` (`playCollegeLeague`). The verb triple `retiredId === KID_ID ? 'had to stop against' : retiredId ? 'was playing a retiring' : kidWon ? 'beat' : 'lost to'` is at `planner.ts:448`, `college.ts:504`, `college.ts:866`; the `retiredId` ternary at `planner.ts:441`, `college.ts:503`, `college.ts:865`. Differences: planner charges condition and opens the retirement layoff (`:425-426`, `:441`), college does neither – **recorded** at `college.ts:841-845` (and at `:461` for the call-up copy): "ZERO BODY COST AND ZERO DEVELOPMENT, DELIBERATELY, AND IT IS A CUT RATHER THAN AN OVERSIGHT – the identical cut `playCallUpRubbers` states." The sentences differ by label (`Practice match:` / `NATIONAL_TEAM.label` / `COLLEGE_LEAGUE.label`) and by the `(${nation})` suffix – parameters, not wording to touch. Related: the score-string idiom `.sets.map((s) => \`${s.a}-${s.b}\`).join(' ')` at `planner.ts:411`, `college.ts:498`, `college.ts:860`, `season/tournament.ts:1038` (engine, single space) and `components/MatchViewer.vue:1001`, `viz/commentary.ts:1435` (UI, double space); `formatScore` at `src/engine/match/scoring.ts:77` formats a live `MatchScore`, not a result. The two `TournamentView` opponent blocks at `snapshot.ts:1087-1096` and `:1191-1200` are the same shape with `nation: ''` vs `nations[current.round] ?? ''`.

### B6. The staff-fare charge – 2 copies (+1 sibling)

`src/engine/world/sponsors.ts:1003-1018` (`chargeMasseurTravel`) and `:1031-1048` (`chargeCoachTravel`) are the same nine lines after the fare lookup: `world.fundsCents -= fare`, `share = fare < event.travelCostCents ? kitTravelShare(…) : 0`, `deal`, `payer`, `addEvent({type:'expense', category:'travel', text, amountCents: -fare})`; the doc at 1011 says so ("`chargeCoachTravel`'s shape for the next seat over"). `chargeTravel` (`:1051-1077`, her own seat) has a richer payer sentence (academy + brand) and stays separate. Differences between the two staff copies: the text (`Your masseur travels … – one more fare` / `Your coach travels … – a second fare`) and the return value (`number` / `void`).

### B7. `clamp`, shuffles and the small maths

`clamp(x, lo, hi)` is exported from `src/engine/condition.ts:19` and imported by 7 engine files; ten more definitions exist: `src/engine/collegeOffer.ts:824`, `src/engine/radar.ts:799` (`clamp01`) and `:803`, `src/engine/childhood.ts:164` (`clamp01`), `src/engine/equipment.ts:122` (`clamp01`), `src/engine/season/fieldPros.ts:521` (`clamp01to100`), `src/engine/season/cohort.ts:60` (`clamp01to100`), `src/engine/match/point.ts:68` (tuple form), `src/composables/coachTour.ts:49`, `src/components/SkillsRadar.vue:112` (`Math.max(0, Math.min(100, v))`). Fisher-Yates twice, both correct: `src/engine/world/birthday.ts:856-863` and `src/engine/season/tournament.ts:1146-1149`. No `lerp` duplicates.

### B8. UI – composable vs inline, and the same selector in several screens

- **The match-surface triple.** `opts` (surface / `JUNIOR_TOUR` / `seed ?? ''`), `annotated = annotateMatch(simulateMatch(a, b, opts), a, b, opts)` and `previewEvent = occasionOf(eventId, round)` at `src/components/MatchReplay.vue:37-45, 59` and `src/components/PracticeFlow.vue:66-74, 90` verbatim; the one-line form of the same fold at `src/components/TournamentFlow.vue:679`, `src/components/PrologueLocalOpen.vue:159` and `src/components/screens/SeasonScreen.vue:1345-1346`. The PracticeFlow comment (75-89) is the argument for one owner: "Every match surface now derives the same fact through the same function". No composable exists (`composables/matchDefaults.ts` is speed/view defaults, `matchReadout.ts`/`matchStatTable.ts` read an annotated match).
- **The box-score table.** `<table>` … `<tr v-for="row in statRows">` … `Avg rally … · ~…` at `src/components/PracticeFlow.vue:231-252` and `src/components/TournamentFlow.vue:1199-1221` (rows come from `composables/matchStatTable.ts` in both). Differences: TournamentFlow shows `#rank` in the head and guards `matchMeta` with `v-if`.
- **The country picker.** `searching` / `matches` (`COUNTRIES.filter((c) => (COUNTRY_NAMES[c] ?? c).toLowerCase().includes(q) || c.toLowerCase() === q)`) / `tiles` at `src/components/OnboardingWizard.vue:263-269` and `src/components/PrologueCard.vue:189-201`; the data (`COUNTRIES`, `COUNTRY_NAMES`, `POPULAR_COUNTRIES`, `flagEmoji`) already lives in `src/composables/countries.ts`, only the logic is inline. Difference: PrologueCard's closed view shows the chosen country (its comment at 199).
- **Snapshot selectors** (from the census of `const X = computed(` names shared by ≥ 3 components):
  - `layoffNote` ×3 – `src/components/PlanWeekSheet.vue:138-141` returns `` `Injured – back ${weekLabel(…)}.` `` (**trailing full stop**), `src/components/screens/CalendarScreen.vue:153-156` and `src/components/screens/SeasonScreen.vue:663-666` return it without. → D-03.
  - `fundsShort(e)` ×2 – `CalendarScreen.vue:264-266` and `SeasonScreen.vue:856-858`, identical (`fundsCents.value < e.entryFeeCents`); the 2 September finding, unchanged.
  - `condition` ×5 (`game.snapshot?.condition ?? 0`: `TournamentFlow.vue:413`, `PlanWeekSheet.vue:65`, `SeasonScreen.vue:481`, `HomeScreen.vue:339`, `KidScreen.vue:203`), `funds` ×3 (`formatCents(fundsCents.value)`: `RailDashboard.vue:66`, `HomeScreen.vue:411`, `MoneyScreen.vue:138`), `ladderLabel` ×3, `ranked` ×3 in three spellings (`kidRank.value !== null` / `rankInTrack.value !== null` / `ladder.value?.rank !== null && … !== undefined`), `kidShort` ×3 from two sources (profile vs match player).
  - The dialog portrait triple `stage` / `artUrl` / `artStyle` at `src/components/ForkDialog.vue:285-289`, `src/components/RetirementDialog.vue:122-126`, `src/components/InjuryStopDialog.vue:101-106` (`portraitStage(age) → portraitUrl(stage, emotion) → facePoint(\`${stage}-${emotion}\`)`); the only differences are the emotion and the fallback age when there is no snapshot (`?? 19` in ForkDialog, `?? 14` in InjuryStopDialog – unreachable in play, harmless).
- **Numeric literals shared by engine and UI**: `numlit.mjs` intersected 103 values, all CSS-side coincidences (0.55, 1.5, 34 …). The three probes the brief named: the ceiling bands 0.40/0.75/0.90 do not appear as a UI literal (only `economy.ts:1224 travelShare: 0.75`); the 500 px CTA cap lives once, `src/style.css:709` (`.tb-pill--cta`); breakpoints are consistent (below).

### B9. CSS

- **Breakpoints.** 43 `@media` sites: `(min-width: 768px)` ×18, `(min-width: 1024px)` ×11, `(prefers-reduced-motion: reduce)` ×8, `(max-width: 359px)` ×2 (`NextTournamentPanel.vue:513`, `MoneyScreen.vue:3142`), singletons `901px` (`style.css:630`), `560px` (`style.css:1385`), `768-1023` (`HomeScreen.vue:2905`). No drifting values – the responsive wave kept to two numbers.
- **The floating-CTA box** ×3: `.cal-go` `src/components/screens/CalendarScreen.vue:1145-1173`, `.next-week-bar` `src/style.css:1929-1946`, `.week-proceed` `src/components/screens/ThisWeekScreen.vue:450-468` – the same eight declarations on the same three tokens (`--app-bar-left/-bottom/-max`); the code says "three copies of one floating-CTA box" (ThisWeekScreen 461). The named obstacle: `tests/round13-nav.test.ts:549` refuses the string `next-week-bar` in any tab screen, comments included – so the shared rule needs a **new, neutral** class name.
- **The four-stop scrim** ×2: `.cal-card-scrim` `CalendarScreen.vue:1232-1242` and `.event-art-scrim` `SeasonScreen.vue:2673-2683`, byte-identical gradient ("Same four-stop shape the Season card's uses").
- **The dialog kicker + title** ×4: `.fork-kicker/.fork-title` `ForkDialog.vue:513-527`, `.prologue-kicker/.prologue-title` `PrologueCard.vue:628-642`, `.handover-kicker/.handover-title` `PrologueHandover.vue:188-197`, `.retire-kicker/.retire-title` `RetirementDialog.vue:252-266` (11 px / 0.09em / uppercase / `--ink-dim`, then heading 20 px / 1.25). **Not** `ui/Eyebrow.vue`: its own header (lines 2-20) rules that the muted 11 px labels are "a DIFFERENT object" from the lime 10/800 eyebrow – so the home is a `dialog-kicker` rule beside `dialog-card` in `style.css`, not the kit component.
- **The option button** – transparent family ×3: `.fork-answer` `ForkDialog.vue:571-584`, `.retire-answer` `RetirementDialog.vue:292-305`, `.ending-fork-option` `EndingScreen.vue:509-521` (the last with `gap: 2px 10px; padding: 11px 14px` instead of `3px` / `12px 14px`); accent family ×2: `.prologue-answer` `PrologueCard.vue:937-949`, `.handover-answer` `PrologueHandover.vue:282-294`.
- **The hero fade** ×3: `.diary-hero-fade` `HomeScreen.vue:1895`, `.prologue-hero-fade` `PrologueCard.vue:621-626`, `.plo-hero-fade` `PrologueLocalOpen.vue:433-438` (the last two byte-identical; the comment says "Home's `.diary-hero-fade`").
- **Global and scoped definitions of the same class** (found by intersecting `style.css` selectors with SFC `<style>` selectors): `.recap-card` (`style.css:3658` / `WeekRecapCard.vue:970`), `.recap-days` (`3875` / `1307`), `.recap-day` (`3880` / `1314`), `.recap-dot` (`3668` / `1321` – **12 px vs 10 px**), `.recap-day-letter` (`3887` / `1336`), `.ledger-week` (`2397` / `MoneyScreen.vue:3178`), `.season-summary-from` (`4030` / `SeasonSummaryDialog.vue:339`), `.error` (`1237` / `HomeScreen.vue:2378`), `.tb-pill--cta` (`708` / `ui/PrimaryPill.vue:48` – the 500 px cap deliberately outside the component). `recap-dot` has one template user (`WeekRecapCard.vue:896`), so the global recap block is reached only through the scoped override. → D-04.

### B10. Tests – repeated scaffolding, and the helper that exists

| Pattern | Sites | Helper that exists | Adoption |
| --- | ---: | --- | --- |
| localStorage shim (14 lines) | 33 files (list above) | none; `vite.config.ts:442-455` declares no `setupFiles` for the `component` project | – |
| `setActivePinia(createPinia())` | 281 occurrences / 111 component files | – (one line; fine) | – |
| plain walk `for (…) tickWeek(world, rng)` | 99 one-line loops in 59 unit files; 50 component files with a local loop | `tests/helpers/career.ts:26` `careerSnapshot(weeks, seed, profile?)` – returns a `Snapshot`, so unit tests that need the `WorldState` cannot use it | 23 files |
| tick-and-skip: `tickWeek; if (world.pendingTournament) { skipTournament(world); closeTournament(world) }` | 116 occurrences / 91 files; the enter-everything variant in 19 | `tests/radarFixtures.ts:91` `runCareer(seed, tier, weeks, onWeek?)` does exactly this | 4 files |
| SeasonEvent fixture (`travelCostCents: 100_00, deadlineWeek: …`) + `giveKidPoints` | 29 files / 8 files (`age-caps, outgrownWithdraw, round12, rankingGate, injuries, planner, condition, round10`) | none | – |
| "Lifted from" local helper sets | `injury-cancelled-row` ↔ `injury-report` (68 lines), `round32-brand-inertia` ↔ `round32-brand-multiple` (43), `round24-college-shell` ↔ `round26-college-flow` ↔ `round27-call-up-flow`, `round34-ladder-plaques` ↔ `season-mirror` ↔ `season/domestic-season-to-date` | none | – |
| mount SeasonScreen | – | `tests/helpers/mountSeason.ts:20` | 11 files |

### B11. Tools – the bench scaffolding

185 `.ts` benches, no `tools/lib/`. Local definitions by name (from `grep "^function X\|^const X = "`): `pct` **45**, `mean` **37**, `money` **27**, `median` 14, `walk` 12, `quantile` 11, `arg` 11, `flag` 8, plus the five-line `argOf` in **55** files, `pad`/`padEnd`/`rule` in the "house style" block (`coach-eye-bench.ts:110-134` = `what-money-buys.ts:100-125`, partial copies in `wall-l1-bench.ts:131-147`, `ladder-vs-targets.ts:111-123`, `potential-band-sweep.ts:127-140`). Only `tools/r34-brand-foot.ts`, `tools/r34-savings-income.ts`, `tools/r35-brand-share.ts` import `shared/money`. The stated reason for copying between benches (`domestic-season-to-date.ts:91-93`): "that file runs its four sections at module load, so importing it would run them" – i.e. there is nowhere side-effect-free to import from. The copies **differ** (→ D-05):

- `money`: 14 signed copies identical to `formatCents`; 5 unsigned `` `$${Math.round(cents / 100).toLocaleString('en-US')}` `` (`tools/his-careers-brackets.ts:64`, `tools/prologue-balance-bench.ts:78`, `tools/round23-read.ts:29`, `tools/prologue-handover-bench.ts:46`, `tools/one-clock.ts:51`) that print a deficit as `$-1,234`.
- `pct`: eight shapes under one name – a fraction → `12.3%`, a numerator/denominator → `12.3%` (with `–` or `-` or `   –` for zero), and **a percentile of an array** (`pct(xs, p)`, two more shapes).
- `median`: empty input → `0` (five copies) vs `NaN` (one); even length → averaged middle (five) vs upper middle `s[floor(n/2)]` (three).
- `quantile`: nearest-rank by `floor(q·n)`, by `round(q·(n−1))`, and linear interpolation – three answers to one question, all named `quantile`.

### B12. Migrations (note for the next step's author, not a refactor)

`src/engine/migrations.ts` (2,373 lines, one `if (v === N) { … }` ladder) repeats `if (!Array.isArray(X)) X = []` ×10, `if (typeof X !== 'number') X = 0` ×3, and `=== undefined` guards ×28 (e.g. `:1563`, `:1594`). Shipped steps are never edited; the next step can declare two local one-liners (`arr(x)`, `num(x, d)`) inside its own block and nothing else changes.

## C. Consolidation plan

Score = (sites × lines) / risk weight; weights: 1 = test or tool scaffolding, 2 = UI-only, 3 = engine (determinism, persisted text), 4 = user-facing wording involved. Pins = tests that name the file or symbol (`pins.txt`).

| # | Cluster | Sites | Dup lines | Proposed canonical home | Pins that break (count, names) | Effort | Risk | Score |
| --- | --- | ---: | ---: | --- | --- | --- | --- | ---: |
| 1 | Tools stats/args/format helpers (B11) | ~210 | ~830 | `tools/lib/stats.ts`, `tools/lib/args.ts`, `tools/lib/fmt.ts` (re-export `formatCents`) | 0 (tools are typechecked by `check:tools`, registered by `scripts/tools-registry.mjs`; no test reads them) | M (150 files, each `pct` checked for meaning) | 1 | 830 |
| 2 | Test tick-and-skip walk (B10) | 116 | ~460 | `tests/helpers/career.ts` – `walkWeeks(world, rng, weeks, opts?)` | 0 | M (91 files, incremental) | 1 | 464 |
| 3 | localStorage shim (B10) | 33 | 462 | `tests/component/setup/localStorage.ts` as `setupFiles` of the `component` project (`vite.config.ts:442`), or `tests/helpers/memoryStorage.ts` with a `{ throws }` option for `career-watermarks` | 0 source pins; `career-watermarks:51-70` keeps its variant | S | 1 | 462 |
| 4 | SeasonEvent fixture + `giveKidPoints` (B10) | 37 | ~440 | `tests/helpers/fixtures.ts` – `pushEvent(world, partial)`, `giveKidPoints(world, points, tier?)` | 0 | S | 1 | 440 |
| 5 | "Lifted from" test helper sets (B10) | ~10 pairs | ~400 | `tests/helpers/injuryFixtures.ts`, `brandFixtures.ts`, `collegeFixtures.ts` | 0 | S each | 1 | 400 |
| 6 | CSS objects: floating CTA ×3, scrim ×2, dialog kicker/title ×4, option button ×5, hero fade ×3 (B9) | 17 | ~175 | `src/style.css` beside `dialog-card`: `.floating-cta`, `.art-scrim`, `.dialog-kicker`/`.dialog-title`, `.dialog-option`, `.hero-fade` | `round13-nav.test.ts:549` (name must not be `next-week-bar`), `prologue-kicker` (2: `prologue-two-paths`, `round35-prologue`), `retire-kicker` (1: `last-word`), `cal-go` (4), `week-proceed` (5), `style.css` named by 90 tests (token reads, unaffected) | M | 2 | 87 |
| 7 | Match-surface triple + box-score table (B8) | 5 + 2 | ~125 | `src/composables/annotatedMatch.ts` – `useAnnotatedMatch(match)`; `src/components/ui/BoxScoreTable.vue` | `MatchReplay.vue` (6 incl. `component/fits.ts`, `match-annotation-parity`), `PracticeFlow.vue` (4: `round13-nav`, `screen-i-live-match`, `ui-control-system`, `week-numbering`), `TournamentFlow.vue` (21) – `componentLogic` pins survive, `componentFile` negatives must be re-read | S | 2 | 62 |
| 8 | Snapshot selectors incl. `fundsShort`, `layoffNote`, dialog portrait triple (B8) | ~25 | ~75 | `src/composables/snapshotFacts.ts` (`useFundsShort`, `useLayoffNote`, `useDialogPortrait(emotion)`) | `fundsShort` (2: `calendar-screen`, `component/round35-ui`), `layoffNote` (1: `round12-view`), `'Injured – back` (2: `condition`, `round12`) | S | 2 (4 for `layoffNote`) | 37 |
| 9 | Friendly-match record (B5) | 3 | 105 | new leaf `src/engine/world/friendly.ts` – `recordFriendlyMatch(world, …)` | `resolvePractice` (7, callers), `playCallUpRubbers` (3), no `engineModuleSource('college'|'planner')` pins | M | 3 | 35 |
| 10 | Global/scoped double CSS definitions (B9) | 9 | 45 | delete the dead global copies in `src/style.css` (`3658-3682`, `3875-3892`, `2397`, `4030`) | `recap-dot` (1: `component/dials-screen`), `style.css` readers (90, token reads) | XS | 2 | 22 |
| 11 | Counting-window fold (B3) | 4 | 48 | `src/engine/season/ranking.ts` – `countingWindow(results, …)` | 0 (`windowSlots` unpinned; no `season/ranking.ts'` pin) | S | 3 | 16 |
| 12 | Country picker (B8) | 2 | 24 | `src/composables/countries.ts` – `useCountryPicker()` | `OnboardingWizard.vue` (10), `PrologueCard.vue` (9) | S | 2 | 12 |
| 13 | `clamp` ×11 (B7) | 11 | 33 | `src/shared/math.ts` (so composables and `SkillsRadar.vue` can use it), re-exported from `engine/condition.ts` | 0 (`function clamp` unpinned) | XS | 3 | 11 |
| 14 | Tier rung ×28 + two comparators (B4) | 30 | 30 | `src/engine/season/calendar.ts` – `tierRung(tier)`, `byWeekThenRung` | 0 | XS | 3 | 10 |
| 15 | Staff-fare charge (B6) | 2 | 18 | `src/engine/world/sponsors.ts` – `chargeStaffFare(world, event, fare, line)` | `chargeCoachTravel` (2), `chargeMasseurTravel` (1) – callers | XS | 3 | 6 |
| 16 | Engine inline money (B1) | 4 | 4 | `src/shared/money.ts` (already imported by `world.ts`) | `money-format.test.ts` scope comment to update | XS | 3 | 1 – but D-02 |
| 17 | Season index in UI + engine inline ×3 (B2) | 3 | 3 | `src/shared/dates.ts` – `seasonIndexOf`, re-exported by `ledger.ts` | 0 | XS | 3 | 1 – D-06 |

### Top 5 in detail

**1. `tools/lib/`** – three files with no top-level side effects (the one property the benches' copies were made to avoid):
```ts
// tools/lib/stats.ts
export const mean = (xs: readonly number[]): number => xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : NaN
export function median(xs: readonly number[]): number            // sorted copy; NaN on empty; averaged middle on even n
export function quantile(xs: readonly number[], q: number): number // nearest-rank, floor(q * n) clamped – the coach-eye-bench/what-money-buys `pctl`
export const shareOf = (hits: number, of: number): string => of === 0 ? '   –' : `${((100 * hits) / of).toFixed(1)}%`
export const pctOf = (x: number): string => `${(100 * x).toFixed(1)}%`   // a FRACTION; never call it `pct`
// tools/lib/args.ts
export function argNum(name: string, fallback: number, argv = process.argv.slice(2)): number
export function argStr(name: string, fallback: string, argv = process.argv.slice(2)): string
export function hasFlag(name: string, argv = process.argv.slice(2)): boolean
// tools/lib/fmt.ts
export { formatCents as money } from '../../src/shared/money'
export const pad = (s: string | number, w: number) => String(s).padStart(w)
export const padEnd = (s: string | number, w: number) => String(s).padEnd(w)
export const rule = (n = 112) => '='.repeat(n)
```
Reference behaviours: `money` = `formatCents` (the 14 signed copies; the 5 unsigned ones change from `$-1,234` to `-$1,234`, which is the fix); `median` = the `condition.test`-style averaged middle with `NaN` on empty (the benches that return `0` on empty currently print a real-looking zero for an empty arm – D-05); `quantile` = `pctl` of `coach-eye-bench.ts:123-127` (nearest rank), because most callers print p50/p90 of a small sample and interpolation invents values the sample does not contain; the two percentile-of-array `pct` copies are renamed at their call sites, never aliased. Migrate bench by bench; `npm run check:tools` is the gate.

**2. `walkWeeks`** in `tests/helpers/career.ts` (the seed stays at the call site, as the file's own header rules):
```ts
export interface WalkOpts { skipTournaments?: boolean; enterAll?: boolean; onWeek?: (w: WorldState) => void }
export function walkWeeks(world: WorldState, rng: () => number, weeks: number, opts: WalkOpts = {}): WorldState
```
Reference behaviour: the `if (world.pendingTournament) { skipTournament(world); closeTournament(world) }` body used by 116 sites (not `radarFixtures.runCareer`'s `while (…) { if (!finished) skip; close }`, which loops – keep `runCareer` for its four users). `enterAll` = the `diary.test.ts:748-756` loop (try/catch around `enterEvent`, deadline-open events only). MAIN-stream draws are unchanged by construction: the helper is the loop, not a new policy.

**3. The localStorage shim** – one module, used by 33 files or installed once by `setupFiles`:
```ts
export function installMemoryStorage(opts: { throws?: () => boolean } = {}): { backing: Map<string, string> }
```
Reference: the 31 identical copies (`a11y-sweep.test.ts:62-75`); `career-watermarks.test.ts:51-70` passes `throws: () => mode === 'throws'`; `round20-ui.test.ts:78` keeps its `beforeEach(() => backing.clear())` through the returned map.

**4. SeasonEvent fixture** in `tests/helpers/fixtures.ts`:
```ts
export function pushEvent(world: WorldState, partial: Partial<SeasonEvent> & { week: number }): SeasonEvent
export function giveKidPoints(world: WorldState, points: number, tier: TierId = 'national', week = world.week): void
```
Reference: `condition.test.ts:60-80` (`deadlineWeek: partial.deadlineWeek ?? partial.week - 2`, `travelCostCents: 100_00`, then `world.season.sort((a, b) => a.week - b.week)`); `round12.test.ts:48-56` is the same with the deadline not overridable – the optional form covers both.

**5. The "lifted" helper sets** – per domain, e.g. `tests/helpers/injuryFixtures.ts` exporting `base(seed)`, `seedForLayoff(world, min)`, `enterable(world, from, to)`, `consecutivePair(prefix)`. Reference: `tests/component/injury-cancelled-row.test.ts:96-162` (the original; `injury-report.test.ts:52-120` says "Lifted from" it); the only difference is the seed prefix (`closed-lists-` vs `report-stranded-`), which becomes the argument.

**The engine clusters, in detail** (lower score, but they carry the findings):

- B3 `countingWindow(results: readonly SeasonResult[], q: { playerId: string; track?: LadderTrack; window: RankingWindow; week: number; bestN: number; countsFor?: (r) => boolean }): SeasonResult[]` in `ranking.ts`, returning the sorted, windowed list. Reference: `ranking.ts:344-354`; `snapshot.ts:660-662` drops its second sort (`windowSlots` preserves order when nothing is reserved and the fold reads order-independent facts – its own comment at 235-236).
- B5 `recordFriendlyMatch(world, { kid, opp, result, eventId, round, seed, label, suffix }): WorldMatch` in a new leaf module; `resolvePractice` keeps the drain and the retirement layoff around the call (`planner.ts:425-426`, `:441`), college keeps its recorded zero-cost cut. Reference for the sentence: `planner.ts:445-449` (the three labels and the `(nation)` suffix are parameters; no string changes).
- B6 `chargeStaffFare(world, event, fare, line: string): number` – reference `chargeCoachTravel` (`sponsors.ts:1031-1048`); `chargeMasseurTravel` becomes a two-liner and keeps returning the fare.
- B1 `world.ts:1487` → `formatCents(fundsCents)`; `milestones.ts:406-407` → `formatCentsSigned(fundsDeltaCents)`. Reference: `shared/money.ts` (its −0 rule is the tested contract). Persisted feed text is byte-identical for every whole-dollar amount; sub-dollar deltas change from `-$0` to `+$0`, which is the behaviour every UI surface already has.

## Findings

**D-01 – The diary paints her off the band clock; every other surface reads her real age.** P2 · Effort S
- What: `src/engine/diary.ts:594` `stage: portraitStage(view.startAgeYears + Math.floor(view.week / 52))` (the week scene) and `:554` (memory cards) compute her portrait stage from `START_AGE + completed seasons`, while the very view they read is built with `ageYears: kidAgeAt(world, world.week)` (`src/engine/world/snapshot.ts:1287`), and the header avatar (`composables/kidEmotion.ts:43`), Money (`MoneyScreen.vue:1603`), Season (`SeasonScreen.vue:211`), the album (`album.ts:96`) and the dialogs all read `Snapshot.ageYears`. `age.ts:65-66` says of that arithmetic: "IF YOU ARE ASKING HOW OLD SHE IS, THIS IS THE WRONG FUNCTION"; `album.ts:68-73` records the incident this class of drift caused ("header said «2031 – she was 13» while Home, about the same week, read 14").
- Why it matters: for a girl born late in the year the band clock runs up to a year ahead of her age, so across the `portraitStage` boundaries (16→17, 22→23, 30→31, `avatarEmotion.ts:167-173`) the diary's painting shows the next stage for up to ~48 weeks while the header beside it shows the current one – two faces of the same girl on one screen, the 09.08 "one clock" ruling broken on the diary alone.
- Proposed response: `weekSceneFor` takes `portraitStage(view.ageYears)`; for memory cards the age at the milestone's week is not in the view – either carry `birthMonth`/`birthDay` in `DiaryView` (no schema change; computed at snapshot time) or keep the band clock there and say so. Pins to repoint: `weekSceneFor` (`diary.test.ts`, `round13-nav.test.ts`, `week-scene.test.ts`), `startAgeYears` (`diary.test.ts`, `travel-home.test.ts`, `week-scene.test.ts`).
- Risk: none to MAIN (diary selection draws only `seed:diary:*` sub-streams); a mounted test can reproduce it with `birthMonth: 12` at the week her band age reaches 17.

**D-02 – Two engine feed lines format money by hand and disagree with `shared/money.ts`.** P2 · Effort XS
- What: `src/engine/world.ts:1487` `` $${(fundsCents / 100).toLocaleString('en-US')} `` has no rounding – any balance that is not a whole number of dollars prints decimals (`$1,234.5`), the one thing money.ts's header says "nothing in the UI ever shows"; `src/engine/world/milestones.ts:406-407` derives the sign from the cents, so a season that ended 49 ¢ down prints `-$0` where `formatCentsSigned` prints `+$0` (money.ts:19-21: "THE -0 EDGE IS LOAD-BEARING"). `world.ts:808` and `sponsors.ts:487` are equivalent today (non-negative inputs) but are the same copy.
- Why it matters: the career-opening line is persisted into every save; starting funds are whole hundreds today, so the decimal never shows – until a background's opening balance is retuned to a non-whole figure, when the first line of every new career gets a decimal point. The milestone case is the documented contract being violated in the engine's own text.
- Proposed response: replace the four sites with `formatCents` / `formatCentsSigned` (already imported in `world.ts:54`), and amend the scope note in `tests/money-format.test.ts:50-54` so the gate can cover `src/engine`. Persisted text is unchanged for whole-dollar amounts; old saves keep their old strings (feed text is data).
- Risk: wording – none, the strings are identical for every value the game currently produces; save schema – none.

**D-03 – `layoffNote` exists three times and one copy ends in a full stop.** P3 · Effort XS, but owner's call
- What: `PlanWeekSheet.vue:140` `` `Injured – back ${weekLabel(…)}.` `` vs `CalendarScreen.vue:155` and `SeasonScreen.vue:665` without the stop.
- Why it matters: it is user-facing copy, so a helper has to pick one and that is a wording change (invariant 4) – it cannot be made by an agent.
- Proposed response: ask him which; then one `useLayoffNote()` in `composables/snapshotFacts.ts`. Pins: `round12-view.test.ts` (`layoffNote`), `condition.test.ts` / `round12.test.ts` (`'Injured – back`).

**D-04 – `.recap-*` is defined globally and scoped with different values; the global block is dead by cascade.** P3 · Effort XS
- What: `src/style.css:3658-3682` and `:3875-3892` define `.recap-card`, `.recap-dot` (12 px), `.recap-days` (`margin: 12px 0 6px`), `.recap-day`, `.recap-day-letter`; `src/components/WeekRecapCard.vue:970`, `:1307`, `:1321` (10 px), `:1336` redefine them scoped, and the template's only `recap-dot` is `WeekRecapCard.vue:896`. The component's own note (`1303-1306`) explains the override: "the round-7 rule of the same name is still in `src/style.css` (it belongs to this component and this wave may not edit that sheet – see the report)". Same shape at `.ledger-week` (`style.css:2397` / `MoneyScreen.vue:3178`) and `.season-summary-from` (`4030` / `SeasonSummaryDialog.vue:339`).
- Why it matters: a scoped rule wins on specificity, so the global values are unreachable – but delete the scoped copy in a future wave and the dot silently returns to 12 px with a 6 px stray margin. A wave-scoped "may not edit that sheet" rule is not a standing ruling.
- Proposed response: delete the global `.recap-*` block, `.ledger-week`'s margin and `.season-summary-from`; keep `.tb-pill--cta`'s 500 px cap where it is (its comment explains why it is outside the component). Pins: `component/dials-screen.test.ts` names `recap-dot`.

**D-05 – The tools' helper copies disagree with each other.** P3 · Effort M (with #1 above)
- What: five `money` copies print `$-1,234` for a deficit (files in B11) while 14 print `-$1,234`; eight `pct` shapes include two that are percentiles, not percentages; `median` returns `0` or `NaN` on an empty arm depending on the file; `quantile` uses three different rank rules.
- Why it matters: benches are how tuning is measured (CLAUDE.md invariant 5); a copied `pct` from the wrong neighbour or a `median` that prints `0` for an empty arm is a wrong number in a spec with no test to catch it.
- Proposed response: `tools/lib/` as in C.1; rename the two percentile `pct`s at their sites.

**D-06 – A screen re-derives the season index because its owner lives in the engine (boundary).** P3 · Effort XS
- What: `src/components/screens/TrophiesScreen.vue:98` `seasonYear(Math.floor(week / WEEKS_IN_SEASON))` re-spells `seasonIndexOf` (`src/engine/world/ledger.ts:203`) because a screen imports `shared/dates`, not `engine/world/ledger`; `calendar.ts:2053` and `economy.ts:5010` re-spell it inside the engine.
- Proposed response: `seasonIndexOf` moves to `src/shared/dates.ts` beside `WEEKS_IN_SEASON` and `seasonYear`, `ledger.ts` re-exports it (the barrel pattern CLAUDE.md prescribes); the three copies import it. Invariant 1 holds (engine → shared is allowed). Pins: none on the file; 10 importers unaffected by a re-export.

**D-07 – The counting-window fold is four copies with a recorded history of drifting.** P3 · Effort S
- What: B3. `ladder.ts:1056-1061` and `snapshot.ts:641-650` both document the last time one copy was spelled by hand and went wrong when the domestic window changed.
- Proposed response: C.11. Risk: ranking determinism – a pure extraction, verified by `test:sim` in the PR assembly as the standing regime already requires.

**D-08 – 33 copies of the localStorage shim in `tests/component/`.** P3 · Effort S – C.3.

**D-09 – `firstWeekOfMonth` (`src/shared/dates.ts:254`) still has zero users** across `src`, `tests`, `tools`, `scripts`, `e2e` – the 2 September finding, unchanged. P3 · Effort XS: delete, or keep with a stated reader.

## Deliberate – leave alone

- **`world.ts` re-exports** the extracted `world/*` modules under their historical names – CLAUDE.md: "hundreds of files import from `engine/world` and that public API must not change." Not duplication.
- **The four `src` ↔ `tests` clones** (table in A): each test states it is an independent restatement – `tests/plan.test.ts:405-406` "re-spelled in the test so the reproduction below is independent of the implementation it is checking"; `tests/season/surnames.test.ts:13-14` "An INDEPENDENT copy of the original 44 … This literal is the guard"; `tests/preview.test.ts:45-46` "written out here, retuning a band is a deliberate two-file edit that shows up in a diff – which is what the owner tunes this feature by"; `tests/birthday-ask.test.ts:440` "The engine's own enumeration, replayed".
- **`fieldSeasonOf`** `src/engine/season/fieldPros.ts:513-516`: "deliberately the same arithmetic as world.ts's `seasonIndexOf`. It is re-stated here because season/* cannot import world.ts (module layering: world.ts imports season/*), and the two MUST agree … Pinned against the world's own function in tests/season/fieldPros.test.ts." (If D-06 moves the arithmetic to `shared/dates.ts`, this copy can import it too – but the pin already guards it.)
- **HomeScreen's second copy of the header tools and of the identity pair** (`HomeScreen.vue:1232-1306` vs `1389-1469`): `1362-1369` "IT IS A SECOND COPY AND NOT A MOVE, AND THE REASON IS THE ROUND'S IDENTITY CONTRACT. The copy above is inside `.diary-head`, which is `position: absolute` on the hero … not one box below 768 may move … with exactly one of the two on screen at any width"; `1442-1444` "AGAIN A SECOND COPY, for the identity contract … Nothing about her is derived twice, and the shell learns nothing." The arithmetic is shared; only the elements are doubled.
- **`pool.ts:590-595`** "Four deliberate silences against the twelve lines above: roughly one quiet week in four says nothing at all" – rows, not code; likewise the diary line tables in `pool.ts` and `weekNotes.ts`.
- **The college friendlies' zero body cost** (`college.ts:841-845`, quoted in B5) – the difference between the planner and college copies of the friendly record is a recorded cut, and a shared helper must keep it.
- **`tests/helpers/career.ts:4-8`** "THE SEED STAYS AT THE CALL SITE, and that is not laziness … a seed is not boilerplate: it IS the fixture" – every scaffolding proposal above keeps the seed in the test file.
- **`liveProb.ts`'s tiebreak walk** (`60-64` vs `closedForm.ts:29-33`): the rotation is imported, not mirrored (`liveProb.ts:8-18`, review TB-01), the recursion is a from-any-state generalisation, and `tests/match/liveProb.test.ts:208` checks it against `closedForm`. Cross-pinned; leave.
- **`money-format.test.ts:50-54`** excludes `src/engine` on purpose (quoted in B1). The exclusion is deliberate; D-02 argues the reason has lapsed, which is a decision for him, not a stealth widening.
- **`ui/Eyebrow.vue:6-20`** rules that the muted 11 px labels are "a DIFFERENT object" from the eyebrow – so the dialog kicker copies (B9) must not be folded into `Eyebrow`.
- **`.tb-pill--cta`'s 500 px cap in `style.css:704-712`** rather than in `PrimaryPill.vue`: "Scoped to `#app` because that is where a CTA is a full-width block – inside a takeover a CTA sits in a row its own screen laid out".

## Since the 2 September review

The previous review's DRY findings (`docs/review-principles-2026-09-02/README.md`, "DRY findings"):

| Finding (02.09) | Status 05.09 | Evidence |
| --- | --- | --- |
| `fundsShort` formatting repeats in `SeasonScreen.vue` and `CalendarScreen.vue` | **Open, unchanged** | `CalendarScreen.vue:264-266` and `SeasonScreen.vue:856-858`, identical bodies; now item C.8 with its two pins named |
| coach/allocation ordering has a shared comparison concept but appears in more than one place | **Resolved** | one owner, `byAllocationPriority` (`season/tournament.ts:713`), called from `:780`, `:973`, `world/phaseAiWeek.ts:195` ("both call the one `byAllocationPriority`", its comment at 176); `weekField.ts:91` records "WHY IT IS EXPORTED RATHER THAN COPIED" for the sibling fold |
| `firstWeekOfMonth` in `src/shared/dates.ts` appears unused | **Open, unchanged** | `dates.ts:254`; zero importers in `src`, `tests`, `tools`, `scripts`, `e2e` (D-09) |
| architecture/tool/test counts repeated across routing documents | **Not re-checked** | `docs/` is outside this lane's scope |

The review's headline – "Remaining code duplication is small and concrete" – still holds for `src/` (0.23 %). What it did not measure was `tests/` and `tools/`, which is where the volume is (3.3 % / 3.1 %), and the three "copies differ" cases above are new.
