---
type: review
status: audit
area: project-review
canonical: false
last-reviewed: 2026-09-26
baseline: 03d92221
---

# Duplication / DRY – 26 September 2026 review

## Verdict

The product code is still mechanically clean: `src` carries **0.19 % duplicated lines** at the 05.09 flags
(05.09: 0.23 %). Most of the 34 clones are small, and 4 are recorded as deliberate. Nothing in this lane is P0 or P1. The
duplication that costs anything is where 05.09 put it, and it has **grown faster than the code around it**:
- **Tests: 3.89 %** of lines (05.09: 3.34 %), and the duplicated lines themselves went from 5,061 to 9,941.
- **Test and tool scaffolding.** Every consolidation 05.09 priced for scaffolding (C.1–C.5) is still undone, and each one grew.
  Three weeks of life-beat waves wrote 27 copies of a `weekAtAge` helper and 56 hand-built `LoveEpisode` literals.
  The localStorage shim went from 33 files to 57.

The three things that matter most:
1. **Hand-posed fixtures drift, and have already cost a gate** (F-01, lead 1). The 23.09 cancel-share fix re-aimed
   two `clashWorld` copies and missed the third (`bc29ac13`, "the third sibling the sweep missed"). The same signed
   ad paper is hand-built in 17 test files. The v83 schema step touched about 18 test files only to add a field to
   hand-written episode literals.
2. **Helper sprawl has a home and does not use it** (F-02, F-03, F-04):
   - `tests/helpers/career.ts` exports one walk; 34 local career walks and 29 `careerAt` builders stand beside it.
   - `tests/component/setup.ts` exists since P-17, yet 53 files carry a byte-identical storage shim.
   - `tools/` has an underscore-module convention (`_lifeBeats` has 53 importers) but no `_stats`; `econ-bench.ts`'s exported `mean`/`median`
     already serve 43 importers. Beside them 43 `money`, 20 `median` and 26 `quantile`/`pctl`
     copies still disagree on deficits, empty arms and rank rules – inside the live benches too.
3. **Two spellings of one fact in `src`, each small but each able to drift silently.** These are the classes this
   project values:
   - a third staff-fare copy that 05.09 predicted (F-05);
   - engine and protocol types declared twice (F-06, 27 of 28 diary fields copied one-to-one);
   - "this week's practice friendly" spelled three ways, one of them narrowed to close a trap the other two still hold (F-07);
   - the stored-match replay recipe copied into four components (F-08).

## Scope and method

**SHA and trees.** All product code was read, and every command run, in the clean detached worktree
`/Users/letulip/Projects/Claude/tb-review` at `03d92221`. No tracked file was edited, and no gate, timing, build or jscpd
run was made here. Every mechanical rate is Phase 0's (`00-baseline.md` §A4: `jscpd@5.1.2`, the 05.09 flags
`--min-tokens 60 --min-lines 6 --skip-comments`, and a LOW pass at 30/4 on `src`). The raw reports are in
`RAW/jscpd/<run>/jscpd-report.json`, where `RAW` = `/private/tmp/claude-501/-Users-letulip-Projects-Claude/c8208cb1-8875-425d-987a-91238b4d6641/scratchpad/review-raw/`.
This lane's own outputs are in `RAW/F/`.

**Read.** The brief, all of it; `00-baseline.md` (§A4 all of it, and the §B.8, C.4 and D.7 observations);
`docs/review-principles-2026-09-05/05-duplication.md` and `docs/review/02-code-quality.md` in full;
`docs/specs/engine-ui-parity-2026-09.md`. `docs/decisions.md`, `docs/now-next-later.md` and
`docs/backlog/the-quality-rig.md` were searched and not read end to end. Every one of the 34 `src` clone pairs
(60/6) was read at its lines.

**Probes** (authored in `OUT/probes/`, copied to the same path in the worktree, run from the worktree root with
`node <probe> > RAW/F/<name>.txt; echo "X_EXIT=$?" >> …`; every verdict was read from a file ending `X_EXIT=0`):

| probe | what it measures | output |
| --- | --- | --- |
| `helper-census.mjs` | every local `walk` / `careerAt` / `walkTo` / `expecting` / `clashWorld` / `worldAt` / `tickTo` / `base` / `freshWorld` / `runTo` definition in `tests`, `tools` and `e2e`; body extracted, comments and whitespace stripped, hashed; classified by the engine verbs it calls | `RAW/F/helper-census.txt`, `RAW/F/helpers.json` |
| `tool-helpers.mjs` | `money` / `median` / `quantile` / `pctl` / `pct` / `mean` / `argOf` in `tools/`, classified by behaviour (sign handling, empty input, even length, rank rule) | `RAW/F/tool-helpers.txt` |
| `parallel-types.mjs` | member-by-member comparison, done with the repo's own `typescript` 5.9.3, of engine types and the protocol types they restate | `RAW/F/parallel-types.txt` |
| `econ-bench-importers.mjs` (gap-fill) | which tools import `mean` / `median` from `./econ-bench`, parsed over whole multi-line import statements, split live / archival | `RAW/F/econ-bench-importers.txt` |
| `economy-restated.mjs` | non-trivial numeric literals on code lines of `economy.ts` that also appear on code lines elsewhere in `src` | `RAW/F/economy-restated.txt` |

**Ad hoc commands** (all `git grep` at the worktree's HEAD `03d92221`; for comparisons, the same command with the
revision `98e3560b`, which is 05.09's baseline):
- the storage-shim hash census – each shim block extracted with `awk` and hashed with `shasum`, in `RAW/F/shim-hashes.txt`;
- the `weekAtAge` hash census, in `RAW/F/weekAtAge.txt`;
- the co-change count for the diary types – `git log --format=%h 98e3560b..03d92221 -- <file>` for each file, intersected with `comm -12`;
- `git show --stat` of `5fce54c1`, `bc29ac13` and `910677f6`;
- the live/archival split of tool helpers – the `## Live` list of `tools/README.md`, intersected with the definition files, in `RAW/F/live-tools.txt`;
- blast-radius counts – `git grep -l -F "<symbol>" -- tests/ | wc -l` for each symbol.
- (gap-fill) the live tools carrying a local stats/format/args helper – for each `.ts` in `RAW/F/live-tools.txt`, `grep -cE "^(export )?(function (money|median|mean|quantile|pctl|pct|argOf)\b|const (money|median|mean|quantile|pctl|pct|argOf) *=)" tools/<f>`, in `RAW/F/live-helper-carriers.txt` (36 files, 35 without `econ-bench` itself).

### Rates against 05.09

These are Phase 0's figures (`00-baseline.md` §A4). The last column is this lane's reading.

| run | 26.09 (`03d92221`) | 05.09 (`98e3560b`) | reading |
| --- | --- | --- | --- |
| `src` 60/6 | 34 clones, 563 lines, **0.19 %** | 29, 488, 0.23 % | Flat. The typescript share **doubled** (91 → 270 lines, 0.09 → 0.18 %). One 98-line parallel type accounts for a third of it (F-06); the rest is the dialog key handler (F-10), the staff fare (F-05) and the carried clusters. html fell 0.65 → 0.18 %: HomeScreen's deliberate second copy is gone (`HomeScreen.vue:2124`), and so is a comment artefact. |
| `tests` 60/6 | 610 clones, 9,941 lines, **3.89 %** | 332, 5,061, 3.34 % | Up. Test lines grew 151k → 256k, and duplicated lines grew faster (×1.96). |
| `tools` 60/6 | 267 clones, 2,831 lines, **2.81 %** | 192, 1,958, 3.05 % | Rate down, volume up (×1.45). By grep, the helper copies grew faster than the files did (F-04). |
| `scripts` + `e2e` 60/6 | 23, 368, 2.19 % | 14, 166, 1.76 % | Small. The `walk(dir)` in `scripts/` went from 3 to 4 copies (P3-15). |
| `src` LOW 30/4 | 424, 9,760, 3.34 % | 344, 5,930, 2.73 % | typescript is flat (1.21 % vs 1.26 %); the rise is the html artefact (13.84 % vs 9.39 %, of which 34 clones are whole-`<script>` `1-N` ranges) and css. |

### Every `src` clone at 60/6, classified (34)

**Merge** – the same fact or object, no ruling against sharing it:

| # | tok | sites | what | → |
| ---: | ---: | --- | --- | --- |
| 1 | 239 | `TournamentFlow.vue:1345-1362` ↔ `:1402-1419` | Draw-path grid and `Continue`, on both posters ("the same poster with somebody else's name on it", `:1369`) | P3-12 |
| 2, 4 | 150, 133 | `BirthdayDialog.vue:86-120` ↔ `LifeBeatDialog.vue:199-228`; `BirthdayDialog.vue:90-109` ↔ `KnockDialog.vue:66-85` | `onGroupKey`, the radio-group handler | F-10 |
| 3, 5 | 145, 123 | `OnboardingWizard.vue:409-420 / 429-439` ↔ `PrologueCard.vue:535-546 / 568-577` | The two dice SVGs | P3-11 |
| 7 | 115 | `MatchReplay.vue:35-59` ↔ `PracticeFlow.vue:64-90` | Replay recipe | F-08 |
| 8, 15 | 106, 92 | `BirthdayDialog.vue:309-324` ↔ `style.css:6105-6119` (`.knock-proceed`) ↔ `LifeBeatDialog.vue:479-492` | The "advance idiom" Proceed button ×3 ("the same declarations `.knock-proceed` and `.life-beat-proceed` carry", `BirthdayDialog.vue:306-308`) | F-09 |
| 9, 14 | 106, 93 | `world/sponsors.ts:1207-1217` ↔ `:1259-1269` ↔ `:1289-1301` | Staff-fare charge ×3 | F-05 |
| 11 | 100 | `PrologueCard.vue:756-770` ↔ `:797-811` | Two radio groups in one card, same markup | P3-21 |
| 12 | 98 | `PrologueCard.vue:1126-1138` ↔ `:1153-1169` | `.prologue-input` / `.prologue-select`, same declarations | P3-21 |
| 13 | 95 | `PracticeFlow.vue:246-258` ↔ `TournamentFlow.vue:1264-1276` | The box-score table | F-08 |
| 16, 21, 27 | 90, 77, 64 | `CalendarScreen.vue:1243-1271` ↔ `style.css:2366-2391` ↔ `ThisWeekScreen.vue:457-474`; `CalendarScreen.vue:1276-1284` ↔ `style.css:2397-2405` | The floating CTA ×3, and its note pill ×2 | F-09 |
| 17 | 89 | `viz/commentary.ts:2038-2057` ↔ `:2085-2093` | The booth's changeover-anchor search ("The same changeover anchor and the same declining-rather-than-losing rule", `:2075`) | P3-13 |
| 18 | 88 | `world/college.ts:551-573` ↔ `:913-935` | Friendly-match record (05.09 C.9) | P3-04 |
| 19 | 87 | `ForkDialog.vue:588-602` ↔ `RetirementDialog.vue:458-472` | Option button (05.09 C.6) | F-09 |
| 20 | 85 | `SupportStaffTab.vue:946-988` ↔ `style.css:5441-5476` | `.staff-art` = `.cm-art`, "THE MASK IS THE COACH STRIP'S, STOP FOR STOP" (`SupportStaffTab.vue:944`). The note records the identity, not a reason to copy it. | F-09 |
| 22 | 75 | `CalendarScreen.vue:1330-1350` ↔ `SeasonScreen.vue:2693-2706` | Four-stop scrim (05.09 C.6) | F-09 |
| 24 | 69 | `OnboardingWizard.vue:285-291` ↔ `PrologueCard.vue:288-293` | Country-picker filter (05.09 C.12) | P3-05 |
| 26 | 66 | `PrologueCard.vue:983-990` ↔ `PrologueLocalOpen.vue:589-596` | Hero fade (05.09 C.6) | F-09 |
| 32 | 60 | `PrologueCard.vue:1420-1428` ↔ `PrologueHandover.vue:288-296` | Accent option button (05.09 C.6) | F-09 |
| 33 | 60 | `WeekRecapCard.vue:1489-1502` ↔ `style.css:4405-4420` | `.recap-dot`, 10 px vs 12 px (05.09 D-04) – merge by deleting the dead global | P3-01 |
| 34 | 60 | `diary/facts.ts:305-402` ↔ `shared/protocol/narrative.ts:913-1034` | `DiaryWorldView` / `DiaryFacts` | F-06 |

**Deliberate** – a note says so:
- #6, `diary/pool.ts:631-637`: "Four deliberate silences" (`:632`).
- #10, `RailIdentity.vue:108-114` ↔ `HomeScreen.vue:1488-1494`: "`useKidIdentity()` is the one owner; this file and `HomeScreen.vue` are two renders of it" (`RailIdentity.vue:19-22`). The arithmetic is shared; only the markup is doubled.
- #28 and #29, `diary/pool.ts:219-241`: diary line-table rows, data.

**Coincidental** – parameters differ and there is no shared fact:
- #23 and #31, `OfferLetter.vue:1085-1099 / 1205-1223`: two letter variants' rows;
- #25, `OnboardingWizard.vue:491-505`: two option tiles;
- #30, `snapshot.ts:1317-1330` ↔ `:1426-1439`: two `TournamentView` opponent blocks whose `nation` rule differs on purpose (notes at `:1315` and `:1423`).

Tally: **26 merge · 4 deliberate · 4 coincidental.** The 26 merges collapse into 4 written findings (F-05, F-06, F-08, F-09) and 8 P3 rows (F-10, P3-01, P3-04, P3-05, P3-11, P3-12, P3-13, P3-21).

**The LOW pass on `src` (424 clones), by class** (`RAW/jscpd/src-low`, grouped by `RAW/f-lowts.txt`):
- **typescript, 199 clones:**
  - 99 are same-file data tables (`diary/weekNotes.ts` 44, `diary/pool.ts` 31, `radar.ts` 14, `diary/travelNotes.ts` 10) – deliberate, data;
  - 55 are same-file code, mostly offer-term builders in `offers.ts` (12, small) and the items above;
  - 45 are cross-file. The ones that are facts rather than coincidences: `coachMarket.ts:1509-1538` ↔ `shared/protocol/snapshot.ts:687-714` and `:642-658` ↔ `:526-538` (F-06), `world/assets.ts:35-46` ↔ `shared/protocol/offers.ts:484-496` (F-06), `diary/words.ts:151-161` ↔ `world/age.ts:347-371` (P3-09).
- **css, 128 clones:** 57 within a file, 52 across components, 19 against `style.css`. The families match F-09.
- **html, 97 clones:** 34 are the whole-script-block artefact 05.09 already discounted.

**The largest `tests` and `tools` clusters** (Phase 0's cluster list, each opened):

| cluster | class | → |
| --- | --- | --- |
| tests, 168 sites in 74 files | The storage shim plus the mount fixture | F-03 |
| tests, 54 sites in 23 files | `walk(seed, weeks)` + `toSnapshot` component fixture | F-02 |
| tests, 50 sites in 27 files | The rng key recorder `vi.mock('../src/engine/rng', …)`. It is "wave 3's §B apparatus, verbatim" (`wave12-parting.test.ts:139`). **Deliberate, tool-bound**: `vi.mock` is hoisted per test file, so it cannot be a plain import. | leave |
| tests, 49 sites in 20 files | `married` / `episode` / `weekAtAge` life-fixture builders | F-01, F-02 |
| tests, 28 sites in 11 files | Enter everything, then tick and skip (`academy-notice.test.ts:53-76`) | F-02 |
| tests, 26 sites in 11 files | `codeOnly` / `srcFiles` source readers | F-02 |
| tests, 24 sites in 12 files | The `SeasonEvent` fixture (`travelCostCents: 100_00`; 05.09 C.4) | F-01 |
| tools, 94 sites in 52 files | `argOf` and the args block | F-04 |
| tools, 24 sites in 6 files | The "house style" `pad` / `money` / `pctl` block | F-04 |
| tools, 24 sites in 14 files | Probe headers, and `walk` via `openCareer` / `stepCareerWeek` | F-02 |


**Every `tests` and `tools` clone, by family** (gap-fill; `clone-families.mjs` → `RAW/F/clone-families.txt`, over Phase 0's `RAW/jscpd/tests` and `RAW/jscpd/tools` reports). Each clone goes to the FIRST family whose rule matches its fragment; the verdict is per family, not per clone, and no clone below the ten clusters above was hand-read. "Lines" sums jscpd's per-clone `lines`, so it double-counts overlaps (10,551 against Phase 0's 9,941 duplicated lines for tests; 3,098 against 2,831 for tools).

| run | family | clones | lines | verdict |
| --- | --- | ---: | ---: | --- |
| tests | world walk (tick + skip / close / enter) | 158 | 2,750 | merge → F-02 |
| tests | component mount + interaction | 89 | 1,126 | coincidental – parallel scenarios over one mount API |
| tests | localStorage shim / mount fixture | 59 | 1,498 | merge → F-03 |
| tests | career poke / `createWorld` fixture | 51 | 709 | merge → F-02 |
| tests | parallel assertion blocks | 34 | 365 | coincidental |
| tests | rng key recorder (`vi.mock` of `engine/rng`) | 30 | 569 | deliberate – hoisted per file (`wave12-parting.test.ts:139`) |
| tests | life fixtures (`LoveEpisode`, `married`, `episode`, `weekAtAge`) | 26 | 595 | merge → F-01 / F-02 |
| tests | source readers / comment strippers / pins | 17 | 274 | merge → F-02 for the strippers; the pins themselves coincidental |
| tests | `SeasonEvent` fixture | 12 | 300 | merge → F-01 |
| tests | signed ad paper / `WATCH` | 9 | 156 | merge → F-01 |
| tests | **residue** (no rule) | **125** | 2,209 | unclassified: 19 same-file; 106 cross-file, of which 26 touch a `WorldState` / `Rng` (answer-policy loops such as `spendOneYear`, `college-freeze.test.ts:196` ↔ `college-second-act.test.ts:103` – F-02's family by shape) and 80 do not (fixture factories such as `summaryFixture`, `facts(over)`) |
| tools | `argOf` / CLI args block | 109 | 1,165 | merge → F-04 |
| tools | stats / format helpers | 27 | 289 | merge → F-04 |
| tools | report printing (console tables) | 21 | 225 | coincidental |
| tools | career walk via econ-bench / local tick loop | 19 | 250 | merge → F-02 |
| tools | **residue** (no rule) | **91** | 1,169 | unclassified: 15 same-file; 76 cross-file, of which 37 touch a `WorldState` / `Rng` (answer / sample loops such as `answerWhateverIsOpen`, `album-money-probe.ts:69` ↔ `album-spread-probe.ts:63`) and 39 do not |

So 485 of 610 tests clones (80 %) and 176 of 267 tools clones (66 %) carry a family verdict; the 216 residue clones do not, and are listed under Not reviewed.

**Semantic pass.** Beyond jscpd:
- **Numbers restating `ECONOMY`** (`economy-restated.mjs`). 125 of `economy.ts`'s 254 non-trivial code literals recur somewhere in `src`. Every money-sized one (≥ 5,000) lives in `season/calendar.ts`'s own tier table or the diary thresholds, never in the UI. The August `MoneyScreen` copy is fixed (`MoneyScreen.vue:62,172`). One coincidence is worth a line (P3-20).
- **Re-derived predicates.** F-07, F-11, and P3-10.
- **Duplicated string tables.** P3-09.
- **Parallel types.** F-06.
- **Helper sprawl.** F-02, F-03, F-04, and P3-07/08/15.
- **A deliberate non-extraction argued against** (brief §3). The `titles` fold in `dynastyHandoverOf` (`world/endings.ts:1405-1408`, "the right call the moment a THIRD reader appears") **still has two readers**, `endings.ts:1212` and `:1424`. `college.ts:85` sums the junior rungs only, and `boothLineageAt` reads the mother's record. The condition has not been met, so no finding.

## Findings

### F-01 · Hand-posed world fixtures are spelled out per file and drift: `clashWorld` ×3, the signed ad paper in 17 files, 56 `LoveEpisode` literals in 45 files
- Severity: P2
- Category: tests
- Evidence:
  - **The three `clashWorld` copies:**

    | | `tests/round29-shoot-clash.test.ts:74` | `tests/component/round29-shoot-clash-ui.test.ts:86` | `tests/component/round30-do-both-shoot.test.ts:125` |
    | --- | --- | --- | --- |
    | options | `shootWeeks`, `deadlineWeek` | `shootWeeks`, `termWeeks` | none |
    | body pose (`plan`, `physioActive`, `condition = 50`) | set | **not set** | set |
    | `untilWeek` | `AT - 10 + WATCH.termWeeks - 1` | `… + termWeeks - 1` | **literal `+ 51`** |
    | brand | `ECONOMY…watches.houses[0]` via `WATCH` | same, via its own `WATCH` | **`BRAND = 'Nine Bells'` (`:65`)**, a house that is not in `ECONOMY` (`economy.ts:2570` lists `'Quiet Hour', 'Halfpast', 'Silver Alder'`) |
    | 23.09 re-aim | `5fce54c1` | **`bc29ac13`, a separate commit: "the third sibling the sweep missed"** | `5fce54c1` |

  - **The same signed-ad paper, hand-built:**
    - `kind: 'ad',` in **17** test files (13 at `98e3560b`).
    - `const WATCH = {` defined in **6** test files.
  - **Hand-built `LoveEpisode` literals** (`publicWrong: false`): **56 literals in 45 files**, none at `98e3560b`. The builders around them: `function married(` in 17 files, `function episode(` in 15.
  - **What a field-add costs.** The v83 step (`910677f6`, "the latch and the name seat on every LoveEpisode row") changed 24 test and tool files. 18 of those were 1–2-line edits to hand-built episodes (`git show --numstat 910677f6 -- tests tools`).
  - **The `SeasonEvent` fixture** (05.09 C.4): `travelCostCents: 100_00` in 34 files (05.09: 29). `giveKidPoints` is defined 9 times.
- Why it matters: this is the calibration class «drifting copies of one fixture» (brief §11):
  - A fix that changes the shape of a posed paper has to find every copy by hand. On 23.09 the grep found two, and the third went red on a later gate (`bc29ac13`).
  - Copy 3 still poses a brand the engine cannot write and a term hard-coded as `51`. It is green today because that file "asserts flow and never money" (`round30-do-both-shoot.test.ts:158`). That is a reason nobody will look at it when the paper changes again.
  - Each schema field on a posed record costs one edit per hand-built literal – 18 files the last time.
- Proposal: `tests/helpers/fixtures.ts`, owned by lane H's helper architecture, exporting three builders, each spreading a `Partial` over one canonical literal:
  - `signedAdPaper(world, { at, shootWeeks?, termWeeks? })` – from `round29-shoot-clash.test.ts:74-116`, with `WATCH` read from `ECONOMY` in one place;
  - `loveEpisode(partial)` and `married(sinceWeek, latchedWeek, over?)` – from `wave8-pregnancy-portrait.test.ts`' shape;
  - `pushEvent(world, partial)` – 05.09 C.4.

  `clashWorld` becomes one export whose options are the union of the three copies' options: `shootWeeks`, `deadlineWeek`, `termWeeks`, and `bodyPose` defaulting to on. Copy 3 keeps its `'Nine Bells'` only if the owner's intent was a brand outside the ladder – the note does not say so (Question 1). The seed stays at every call site (`tests/helpers/career.ts:4-8`).
- Blast radius: tests only; no RNG key, no save schema, no wording, no balance. Files that move: 3 (`clashWorld`) + 17 (ad paper) + 43 (`publicWrong: false`) + 34 (`travelCostCents: 100_00`), with overlap; migrate family by family. The poke builders create no MAIN draws. Proven by the file staying green, and by the key-count nets in the life-beat suites that call the builders (e.g. `wave12-parting.test.ts:139-152`).
- Effort: M (S per family)
- Confidence: high on the counts and the 23.09 cost. Medium that the next schema step reproduces the 18-file cost – replaying `910677f6` against a builder would raise it.
- Versus 05.09: new (the life fixtures postdate 05.09); carried for the `SeasonEvent` half (C.4)
- Verification: CONFIRMED – all three `clashWorld` copies read as the table says, `bc29ac13` is the separate one-file "third sibling the sweep missed" commit and every count reproduces; the write-up should also cite and argue with the in-code counter-stance at `round30-do-both-shoot.test.ts:67-68` and `round29-trip-week.test.ts:118-119` ("copied rather than imported because a fixture shared across files drifts into being a second production module"), which `bc29ac13` refutes but the finding never mentions.

### F-02 · Career-walk helpers: 34 local world walks, 29 `careerAt`, 27 `weekAtAge` and 13 comment-strippers, beside a helpers folder that exports one walk
- Severity: P2
- Category: tests
- Evidence (`helper-census.mjs` → `RAW/F/helper-census.txt`):
  - **The brief's counts, reproduced:** `function walk(` 69 (tests 44 · tools 25), `function careerAt(` 29, `walkTo` 6, `expecting` 6.
  - **What the 90 `walk` definitions do** (counting `const walk =` too):

    | class | count |
    | --- | ---: |
    | filesystem walks | 19 |
    | prologue-card walks | 3 |
    | object-graph walks | 2 |
    | wrappers over econ-bench's `openCareer` / `stepCareerWeek` | 15 |
    | other (non-world) | 17 |
    | **world walks with a local tick loop** | **34** |

  - **The 34 world walks by policy:**
    - create + tick + skip/close: 15 (3 distinct bodies; one of them **byte-identical in 13 component files**: `r37-week-note-tilt.test.ts:63`, `round29-shop-elite.test.ts:43` …; 9 files at `98e3560b`, 14 now);
    - tick + skip/close on a given world: 8;
    - + enter everything: 7;
    - + birthday + knock: 4 (4 bodies);
    - one-offs: 6.
  - **`careerAt`, 29:** 19 are pokes (`createWorld` + `season = []` + `week = N`, 15 distinct bodies; e.g. `wave3-delivery.test.ts:122` and 4 byte-identical siblings); 3 are byte-identical create + tick (`parity-feed-ladder.test.ts:63`, `parity-plaque-national.test.ts:58`, `dead-rungs.test.ts:69`); 7 walk.
  - **The tick-and-skip idiom** `if (world.pendingTournament)`: 198 lines in 118 test files (157 in 82 at `98e3560b`). `careerSnapshot` has 41 adopters.
  - **`function weekAtAge`: 27 files, none at `98e3560b`.** 20 normalised bodies are identical (`RAW/F/weekAtAge.txt`); the 6 variants differ in bound (`2000` / `40*52` / `700` / unbounded), comparator (`>=` on `kidAgeExact` vs `===` on `kidAgeAt`), and failure (throw vs `-1`).
  - **Comment-strippers.** 13 local `codeOnly` / `stripComments` (9 identical) sit beside `tests/helpers/source.ts:39,50` (`codeOf`, `scriptCodeOf`). The local `codeOnly` removes every `//…`, including a trailing one and a `//` inside a string literal, while `scriptCodeOf` removes whole-line comments only. So "the same helper" gives two answers.
- Why it matters:
  - Each new suite copies the nearest file's walk: 5 more of the 13-copy walk and all 27 `weekAtAge` in three weeks.
  - A walk's POLICY – skip tournaments or not, answer beats or not – decides which MAIN draws a fixture taps. Copies that differ by one verb are different careers wearing one name.
  - D.7 of the baseline measures walked careers as 84 % of unit and 86 % of component test time. The re-walk lever that lead 11 prices (lane G/H) needs a named walk to share first.
- Proposal: `tests/helpers/career.ts` grows the three walks the census finds, with the seed staying at the call site as its header rules:
  - `walkWeeks(world, rng, weeks, { skipTournaments = true, enterAll = false, answer?: 'beats' | 'beats+birthday+knock' })` – 05.09 C.2's signature, extended by the policies in use now;
  - `pokedAt(seed, week, profile?)` for the 19 pokes;
  - `weekAtAge(world, years)` with the `kidAgeExact >= years` / throw form (the 20-copy majority).

  The 13 local strippers call `codeOf` or `scriptCodeOf` (a pin that needs the trailing-comment strip keeps a named local). Lane H owns the architecture (brief, lead 1); this is the census and the merge list.
- Blast radius: tests only. 44 (`function walk(`) + 28 (`function careerAt(`) + 26 (`function weekAtAge`) + 117 (tick-and-skip) files, overlapping. No RNG key moves: the helper IS the loop, and each migrated file keeps its policy flags. Proven by the migrated file's own assertions, plus the key-count nets where a life-beat suite walks. No wording, no schema.
- Effort: M
- Confidence: high on the counts (probe plus hashes). The byte-identical claim is over normalised bodies, so whitespace and comments are ignored.
- Versus 05.09: carried (C.2) and regressed (82 → 118 files on the idiom)
- Verification: CONFIRMED – `helper-census.mjs` re-ran to exactly walk 90, careerAt 29, walkTo 6, expecting 6, and the greps reproduce; two small number slips: 8 of the 13 identical walk copies existed at `98e3560b`, not 9 (the "14 now" should read 13), and a name grep finds 14 non-CSS local `codeOnly`/`stripComments`, not 13 (16 with the two CSS strippers).

### F-03 · The localStorage shim is now 53 byte-identical copies, and the setup file that would hold it exists
- Severity: P2
- Category: tests
- Evidence:
  - `Object.defineProperty(globalThis, 'localStorage'` appears in 57 test files, all in `tests/component/`. 33 carried it at `98e3560b`; 24 are new.
  - Hashing each block (`RAW/F/shim-hashes.txt`): **53 byte-identical** (`1bed478ce9`, e.g. `a11y-sweep.test.ts:62-75`) and 4 variants. The variants include 05.09's `career-watermarks` `throws` arm and `round20-ui`'s `memoryStorage`.
  - `vite.config.ts:483` gives the `component` project `setupFiles: ['./tests/component/setup.ts']` since P-17 (`5ddab0c8`, 05.09). That file stubs `fetch` only.
- Why it matters:
  - 14 lines × 53 = 742 lines of the tests' duplicated volume.
  - The storage contract a mounted test runs against is whatever the nearest file had. A future change to it – `key()`, `length`, a quota throw – is 57 edits.
  - The cheapest home was built 21 days ago for a sibling problem and is not used for this one.
- Proposal: `tests/component/setup.ts` installs the 53-copy shim once, per file (setup files run in each test file's context, so every file keeps a fresh map). It exports `memoryStorage` for the files that clear or inspect the backing map (`round20-ui`, and any file that calls `backing.clear()` in `beforeEach`). The 4 variant files keep their local override, which is installed after the default. 05.09 C.3's `installMemoryStorage({ throws })` shape covers `career-watermarks`.
- Blast radius: tests only – 57 files (`git grep -l -F "Object.defineProperty(globalThis, 'localStorage'" -- tests/`). No product law touched.
- Effort: S
- Confidence: high. Raise it by running the component project once with the shim deleted from the 53 files – a Phase-3 wave step, not measured here.
- Versus 05.09: carried (D-08), regressed (33 → 57 files)
- Verification: CONFIRMED – 57 files carry the shim (33 at `98e3560b`), 53 byte-identical plus 4 variants, and `setup.ts` stubs only fetch; but the blast radius is understated: `setupFiles` runs for all 221 component files, so the other 164 that run today with `localStorage` undefined would get the shim too, and at least `r47-raise-another-route.test.ts:193-198` reasons from that absence, so a migration must scope the install or audit those files.

### F-04 · The tools' helper copies grew by half and still disagree – the live benches included
- Severity: P2
- Category: tooling
- Evidence (`tool-helpers.mjs` → `RAW/F/tool-helpers.txt`; `.ts` files 185 → 266 since `98e3560b`):

  | helper | defs 05.09 → now (in live tools) | disagreement |
  | --- | --- | --- |
  | `money` | 27 → **43** (8) | 22 print a deficit as `$-1,234` and 19 as `-$1,234`. 6 of the 8 live copies are the unsigned form: `coach-raise-bench.ts:74`, `form-bench.ts:66`, `masseur-raise-bench.ts:68`, `prologue-balance-bench.ts:78`, `prologue-handover-bench.ts:46`, `wedding-bench.ts:99`. The one SHARED module, `tools/_corridor.ts:72` (4 importers), exports the unsigned one. `sponsor-cadence.ts:185`'s `money(x)` takes **dollars**, under the name 42 siblings use for cents. |
  | `median` | 17 → **20** (6) | 5 behaviours: empty → `0` (11), `NaN` (3) or unguarded (6); even length → averaged (17) or upper middle (3; `clone-bench.ts:42`, `restore-bench.ts:51`, `age-composition.ts:39`) |
  | `quantile` + `pctl` | 11 → 17, plus 9 `pctl` (7 live) | floor(q·n) in 12, round(q·(n−1)) in 5, 9 others. The live benches split between the two named rules: `form-bench` and `chemistry-bench` use floor, `childhood-bench` and `sponsor-window-bench` use round. |
  | `pct` | 45 → **75** (19) | 44 are numerator/denominator, 28 a fraction, 3 a percentile of an array (`next-goal-bench.ts:97`, `preview-drift.ts:83`, `r35-brand-share.ts:98`) |
  | `argOf` | 66 → **84** (13) | 11 distinct bodies |

  The home exists as a convention: 7 underscore modules (`tools/_lifeBeats.ts`, 53 importers; `_birthday.ts`, 22). And for `mean` / `median` a de facto home already exists: `tools/econ-bench.ts:1070,1082` exports them (empty → `0`, even length → averaged; `stddev` at `:1076` too), and **43 tools import one or both** – `median` 38, `mean` 32, 14 of the 43 live – including the SHARED `tools/_corridor.ts:21` (`econ-bench-importers.mjs` → `RAW/F/econ-bench-importers.txt`, which parses whole multi-line import statements). No file both imports `median` and defines its own. (Corrected in gap-fill: the first write-up said "0 importers", a `git grep -E` artefact, as the verification below records. The verification counted 37; the probe counts 43 because it parses whole multi-line `import { … }` statements rather than lines.) So the local copies do not lack a home – they sit beside one that 43 files already use: 10 of the 20 local `median`s and 23 of the 47 local `mean`s have econ-bench's own behaviour, and the rest disagree with it.
- Why it matters:
  - Benches are how balance is measured (invariant 5). A spec that quotes p90 from two benches is quoting two rank rules. A `median` that prints `0` for an empty arm looks like a measurement. A deficit printed `$-1,234` by the live prologue benches reads differently from every other money figure in the repo.
  - The growth rate says the copies follow the files: `money` +59 % and `pct` +67 % against +44 % files.
- Proposal: `tools/_stats.ts` and `tools/_fmt.ts`, on the `_seeds.ts` convention (no top-level side effects), plus `tools/_args.ts` for `argOf`.
  - **`mean` / `median` / `stddev`: lift, do not redesign.** Move `econ-bench.ts:1068-1087` into `tools/_stats.ts` byte-identical, and have `econ-bench.ts` re-export them under the same names, so its 43 tool importers and the 23 tests that import `econ-bench` do not move. The reference behaviour is therefore econ-bench's (empty → `0`, averaged middle), the one 38 importers already print; the 10 local `median`s and 23 local `mean`s with that body switch to the import with zero output change. (This replaces the first write-up's "NaN on empty": that rule would change every empty arm in 43 tools at once. Whether an empty arm should print `NaN` rather than `0` is a separate, later tooling decision with its own per-bench diff.)
  - The 10 `median` and 24 `mean` copies that disagree (NaN, unguarded, upper middle) either keep a named local (`medianUpper`, …) or migrate with the per-bench diff below.
  - `money` = `formatCents` re-exported from `src/shared/money`;
  - `quantile`: nearest rank, floor(q·n), the 7-copy `pctl` (05.09 §C.1);
  - `pctOf` for fractions and `shareOf` for numerator/denominator. The 3 percentile `pct`s are renamed at their sites.

  Migrate the **35 live tools that carry a local copy** first (of the 55 live, excluding `econ-bench` itself: a top-level `function|const` of `money` / `median` / `mean` / `quantile` / `pctl` / `pct` / `argOf`, `RAW/F/live-helper-carriers.txt`; the first write-up said all 55). The 211 archival probes are evidence and may keep their copies, unless one is re-run.
- Blast radius: no product law. Tests are unaffected: no test imports these helpers (the 48 tests that import `tools/` import `econ-bench`, `_lifeBeats`, `fatigue-bench` and the fixture generators, and `econ-bench`'s `mean`/`median` keep their names). The gate is `npm run check:tools`.
  - **Bench behaviour:** a migrated bench's printed numbers change ONLY in the columns whose helper changes rule. Prove it per bench by diffing its output at `03d92221` and after, on the same seed and arms, and state every moved cell. `bench:econ` (`tools/econ-bench.ts`) is the arm to run first, since 23 tests import it.
- Effort: M
- Confidence: high on the counts and the live split. The classifier is textual (`tool-helpers.mjs` header). Two `median` and eight `quantile` bodies fell to "other/unguarded" and were not hand-read. The econ-bench importer count was wrong in the first write-up (0) and is corrected here (43, `econ-bench-importers.mjs`); the proposal changed with it, from a new `median` rule to a byte-identical lift.
- Versus 05.09: carried (D-05, C.1), regressed
- Verification: PLAUSIBLE – the definition counts and disagreements reproduce, but the sub-claim that `tools/econ-bench.ts` exports `mean`/`median` and no tool imports them is false: 37 tools import them from `./econ-bench` (including `_corridor.ts:21`), the lane's 0 being an artefact of `git grep -E` lacking `\b`, so econ-bench is already the de facto stats home and the proposal and migration count are unproven as written.

### F-05 · The staff-fare charge is now three copies – the third seat arrived as 05.09 predicted
- Severity: P2
- Category: duplication
- Evidence: `src/engine/world/sponsors.ts` has three charges whose bodies are the same 13 lines apart from the label:
  - `chargeMasseurTravel` `:1206-1221`, `chargeSparringTravel` `:1258-1273`, `chargeCoachTravel` `:1286-1304`;
  - the shared lines: `fundsCents -= fare`, the `kitTravelShare` / `activeKitDeal` / `payer` triple, and `addEvent({ category: 'travel', text: '<Label> travel to … – one additional fare${payer}' })`;
  - the only difference beyond the label is the return type – `number` for two, `void` for the coach's.
  - The fare gates are copied too: `masseurTravelFareFor` `:1194-1200` = `sparringTravelFareFor` `:1241-1247`, the same five lines over a different pair of flags.

  The sparring doc says the FARE is "`masseurTravelFareFor`'s own rule asked for a THIRD seat (`staffSeatFareCents`), never a second implementation" (`:1223-1225`). That holds for `staffSeatFareCents` and not for the charge beside it ("`chargeMasseurTravel`'s shape for the seat after it", `:1249`). 05.09 scored this cluster at 2 copies (C.15). The third came with v80 wave F2 (`768d67b6`, 16.09). jscpd pairs #9 and #14.
- Why it matters:
  - The payer clause is an honesty rule, ROUND-21 #2 (`:1289-1292`: "a cost that quietly shrinks is the dishonesty that text exists to prevent"). It now has three bodies to keep honest.
  - The 17.09 copy review changed the sparring row's wording («Hitting partner travel to …», `:1253-1257`). It had to be applied per copy, and the next wording pass on the row shape is three edits.
- Proposal: `chargeStaffFare(world, event, fare, label): number` in `sponsors.ts` (05.09 C.15's signature). The three charges become two-liners that keep their names and return types. `chargeTravel` (her own seat, `:1306`) stays separate, as 05.09 said. The label strings pass through verbatim, so every feed row stays byte-identical.
- Blast radius: persisted feed text is byte-identical by construction. Zero draws (each charge says "Zero draws"), so there is no RNG key and no MAIN draw; the frozen capture (41550 / `e6b0c709`) is unaffected. Tests naming the symbols: `chargeMasseurTravel` 1, `chargeCoachTravel` 2, `chargeSparringTravel` 0. The text pins ("one additional fare") are in 12 files and do not move. Balance: none – there are no arithmetic changes.
- Effort: XS
- Confidence: high
- Versus 05.09: carried (C.15), regressed (2 → 3 copies)
- Verification: CONFIRMED – at 03d92221 `chargeMasseurTravel`, `chargeSparringTravel` and `chargeCoachTravel` (`sponsors.ts:1206-1304`) share one body differing only in label, return type and a comment, the two fare gates differ only in the flag pair, and no ruling or queue entry covers it.

### F-06 · Engine and protocol declare the same shapes twice: `DiaryWorldView` / `DiaryFacts` share 28 members and 13 of 15 commits touched both
- Severity: P2
- Category: duplication
- Evidence (`parallel-types.mjs` → `RAW/F/parallel-types.txt`):
  - **`DiaryWorldView`** (`src/engine/diary/facts.ts:210`) **and `DiaryFacts`** (`src/shared/protocol/narrative.ts:799`) declare **28 members on both sides**, each with its own docstring. That pair is the largest typescript clone in `src` at 60/6, 98 lines (jscpd #34).
    - `assembleDiaryFacts` (`src/engine/diary.ts:100`) copies **27 of them one-to-one** (`k: view.k`).
    - 1 shared name disagrees: `lossStreak` is `LossStreak | null` on the view (`facts.ts:263`) and a count on the facts (`narrative.ts:844`), bridged at `diary.ts:169`.
    - Of the 15 commits since `98e3560b` touching `facts.ts`, **13 also touched `narrative.ts`** (`git log --format=%h 98e3560b..03d92221 -- <file>`, intersected).
  - **Engine view functions restate `Snapshot` members inline:**
    - `coachBilling()`'s return type (`coachMarket.ts:641`) is **17/17 members identical** to `Snapshot.coachBilling` (`protocol/snapshot.ts:518`).
    - `coachEdgeView()` (`coachMarket.ts:1509`) is **9/9 identical** to `Snapshot.coachEdge` (`:687`).
    - Both carry their own docstrings of the same facts.
  - **`ShopItem`** (`world/assets.ts:35`) **and `ShopRowView`** (`protocol/offers.ts:484`) share 9 members, including the `family` union `'investment' | 'car' | 'house' | 'business' | 'boat' | 'plane' | 'academy'`, spelled twice (`assets.ts:40`, `offers.ts:490`). Round 29 #5 and P7 each edited both.
- Why it matters:
  - A carried diary fact is declared on each side of the boundary, built in the snapshot, and copied in `assembleDiaryFacts` – three edits and two docstrings per fact. The co-change rate says that is paid on nearly every diary wave.
  - Duplicated docstrings are where a ruling gets restated slightly differently: the two `freshBreakup` notes already stress different halves (`facts.ts:306-318` vs `narrative.ts:913-931`).
  - The compiler catches a TYPE drift in one direction only; it never catches doc drift.
- Proposal: pure type changes.
  - `DiaryWorldView` becomes `Pick<DiaryFacts, <the 27 carried keys>> & { <its own 14> }`. A `CARRIED_DIARY_KEYS` tuple drives both the `Pick` and a loop in `assembleDiaryFacts`. `lossStreak` keeps its local shape under its own name.
  - `coachBilling` and `coachEdgeView` return `Snapshot['coachBilling']` / `Snapshot['coachEdge']`, or named protocol types (`CoachBillingView`, `CoachEdgeView`), which is how most views already work.
  - `ShopFamily` becomes one exported union in `shared/protocol/offers.ts`, imported by `assets.ts`.

  Where the docstrings differ, both texts are kept verbatim at the surviving declaration (house style).
- Blast radius: types only, erased at build. No RNG, schema, wording or balance. Tests naming the symbols: `DiaryWorldView` 3, `DiaryFacts` 17, `coachBilling` 21, `coachEdgeView` 5, `ShopItem` 3, `ShopRowView` 1. None assert structure, but a `vue-tsc -b --force` run is the gate. Source pins through `diarySource(` (5 files) must be re-read if `diary.ts`'s copy block changes shape.
- Effort: S
- Confidence: high on the member counts (AST). Medium on the cost per wave – read off the co-change count, not timed.
- Versus 05.09: new
- Verification: CONFIRMED – re-running `parallel-types.mjs` gives byte-identical output (28 shared members, 27 one-to-one diary lines, coachBilling 17/17, coachEdgeView 9/9), the co-change count reproduces as 13 of 15, and the engine already imports protocol types, so no boundary ruling forbids the proposal.

### F-07 · "This week's practice friendly" is three predicates in the UI – one narrowed to close a trap, two still carrying it
- Severity: P2
- Category: correctness-risk
- Evidence:
  - `src/components/WeekRecapCard.vue:753-758` finds the week's friendly with `e.friendly && e.match?.eventId.startsWith('practice-w')`. Its note (`:743-752`) says why: since the college wave a national-team rubber wears `friendly: true` too (`world/college.ts:567`, `:929`), and «`friendly` never meant "practice"». It calls this "a trap closed rather than a bug fixed … "cannot fire today" is precisely how the unreachable copy this wave was sent to fix came about".
  - The other two copies keep the broad predicate:
    - `src/App.vue:953` (`e.type === 'match' && e.friendly && e.week === s.week && e.match`);
    - `src/components/screens/SeasonScreen.vue:1245-1247` (`thisWeekFriendly`, `e.friendly && e.week === week.value`), rendered as the PRACTICE card (`:1237-1238`).
  - The id format itself is spelled on both sides of the boundary: `` `practice-w${world.week}` `` at `world/planner.ts:466`, and the string prefix `'practice-w'` at `WeekRecapCard.vue:756`. The engine exports `callUpRubberId(week, i)` for the rubber id (`college.ts:540`) but nothing for practice.
  - The August review listed this triple (02-code-quality "Deliberate mirrored predicates", with `App.vue:607`, `WeekRecapCard.vue:347`, `SeasonScreen.vue:709` then). It has since diverged.
- Why it matters: this is the parity class the spec names – «the screen holds a predicate the engine does not» (`engine-ui-parity-2026-09.md:11-12`). The narrowing reached one screen of three. It is unreachable today only because the college epilogue covers the shell. The recap's own note is the argument that "unreachable today" is how these survive.
- Proposal: form A (`engine-ui-parity-2026-09.md` §1).
  - `world/planner.ts` exports `practiceMatchId(week)`, used at `:466`, and `isPracticeMatchEvent(e: WorldEvent): boolean` (`type === 'match' && friendly && match?.eventId === practiceMatchId(e.week)`). Both are re-exported through the barrel.
  - The three UI sites call it. `App.vue`'s and `SeasonScreen`'s results narrow to exactly the recap's.
  - No string moves: the id is the same bytes.
- Blast radius: event ids are persisted in saves, and this keeps them byte-identical. No RNG, no wording. Tests naming the files: `WeekRecapCard` 32, `SeasonScreen` 45, `App.vue` 68 (mostly mounts); `practice-w` 4; `e.friendly` 7. A mounted pair with both mutation arms, over a snapshot carrying a rubber and a practice in one week, is the witness the spec asks for. The rubber case needs a posed snapshot (the spec's §5.2 technique).
- Effort: S
- Confidence: high on the divergence. Low on any reachable symptom today (none found). Lane E's lead-5 parity sweep may list the same sites. This is written here as the August duplication item.
- Versus 05.09: new (August carried: "friendly-match lookup written three slightly different ways")
- Verification: CONFIRMED – `WeekRecapCard.vue:753-758` narrows to `practice-w` while `App.vue:953` and `SeasonScreen.vue:1245-1247` keep the broad `e.friendly` predicate and college rubbers set `friendly:true`; as the lane admits no reachable symptom exists today, so this is P2 debt rather than a live defect.

### F-08 · The stored-match replay recipe is copied into four components and matches the engine's recording options by convention only
- Severity: P2
- Category: duplication
- Evidence:
  - **The UI recipe.** `{ surface, tour: JUNIOR_TOUR, seed: m.seed ?? '' }`, then `annotateMatch(simulateMatch(a, b, opts), a, b, opts)`, at:
    - `MatchReplay.vue:37-46`;
    - `PracticeFlow.vue:66-74`;
    - `TournamentFlow.vue:690-695`;
    - `PrologueLocalOpen.vue:194-202`, for the prologue weekend.
  - **The engine side.** It records with its own literals: `planner.ts:418`, `college.ts:542`, `:904` and `season/tournament.ts:1036`.
  - **Guards.** `match-viewer-parity.test.ts` freezes ONE record rebuilt "through the MatchReplay recipe" (its header, lines 10-15). No test pins the other three copies to the engine's recording options.
  - **History.** Flagged in August ("Replay recipe copy-pasted 3x … Divergence means a replay that differs from the recorded result") and on 05.09 (C.7, `useAnnotatedMatch`). Unchanged since: `git grep -n "annotateMatch(simulateMatch" -- src` lists the same one-line sites, and the two multi-line ones are jscpd pair #7.
  - PracticeFlow's own note (`:87`) makes the case for one owner: "Every match surface now derives the same fact through the same function".
- Why it matters:
  - A replay is a re-simulation, so its only link to the recorded score is option equality.
  - The day the engine records a match under different options – a pro tour model, a surface modifier, a seed-key change – every UI copy must follow. A missed one shows a match that ends with a different score from the feed line under it. That is the calibration class «a copy that silently defeats» the thing it restates.
- Proposal: form A.
  - The engine exports `replayOptionsOf(m: WorldMatch): MatchOptions` beside `WorldMatch` (the `match/` package, or `world/matchNews.ts`), and `replayMatch(m): AnnotatedMatch`. The four recording sites build their options through the same function's input shape.
  - `src/composables/annotatedMatch.ts` (05.09 C.7) wraps it for the four components.
  - The box-score `<table>` duplicate (`PracticeFlow.vue:246-258` ↔ `TournamentFlow.vue:1264-1276`) goes to a `ui/BoxScoreTable.vue` in the same wave.
- Blast radius: RNG – the replay runs on the stored seed and the new function returns the same options, so every replay is byte-identical. Prove it with `match-viewer-parity.test.ts`' frozen hash and one assertion that `replayMatch(m).result.sets` equals the stored `m.score` for a practice, a rubber and a tournament match. The MAIN stream is untouched (a replay taps no MAIN), so the capture 41550 / `e6b0c709` does not move. Tests naming the files: `MatchReplay` 17, `PracticeFlow` 13, `TournamentFlow` 49, `PrologueLocalOpen` 6. `componentLogic` pins survive the extraction; the `componentFile` negatives must be re-read (CLAUDE.md).
- Effort: S
- Confidence: high on the copies. Medium on the risk – no current divergence exists.
- Versus 05.09: carried (C.7; August "Replay recipe")
- Verification: PLAUSIBLE – the four component copies and engine literals exist as cited, but the "silently defeats" cost is overstated: engine tests (`events.test.ts:281-284`, `round10-view.test.ts:243-247`, `college-league.test.ts:442-443`, `college-second-act.test.ts:484`) already replay stored records under the same recipe, so only an edit that updates the engine and those tests but misses a component would slip through.

### F-09 · CSS objects: 05.09's five pasted families are all still pasted, three more have joined, and one re-aim already had to chase its siblings
- Severity: P2
- Category: ui
- Evidence:
  - **The 05.09 C.6 families, all still present:**
    - floating CTA ×3: `.cal-go` `CalendarScreen.vue:1243`, `.next-week-bar` `style.css:2366`, `.week-proceed` `ThisWeekScreen.vue:457`;
    - scrim ×2: `CalendarScreen.vue:1330`, `SeasonScreen.vue:2693`;
    - dialog kicker ×4: `ForkDialog.vue:530`, `PrologueCard.vue:990`, `PrologueHandover.vue:188`, `RetirementDialog.vue:388`;
    - option button, transparent ×2 and accent ×2: `ForkDialog.vue:588`, `RetirementDialog.vue:458`, `PrologueCard.vue:1414`, `PrologueHandover.vue:282`;
    - hero fade ×3: `HomeScreen.vue:2050`, `PrologueCard.vue:983`, `PrologueLocalOpen.vue:589`.
  - **New since 05.09:**
    - the Proceed "advance idiom" ×3: `.birthday-proceed` `BirthdayDialog.vue:309`, `.knock-proceed` `style.css:6105`, `.life-beat-proceed` `LifeBeatDialog.vue:479`. The notes say "the same declarations" (`BirthdayDialog.vue:306-308`) and "cannot drift apart" (`LifeBeatDialog.vue:474-476`) – the latter is true only of the two selectors in one rule;
    - the note pill ×2: `.cal-go-note` `CalendarScreen.vue:1276` and `.next-week-note` `style.css:2397` ("The visual vocabulary is `.cal-go-note`'s", `:2385-2386`);
    - the portrait strip ×2: `.staff-art` `SupportStaffTab.vue:946` = `.cm-art` `style.css:5441`, "STOP FOR STOP".
  - **A re-aim that had to chase its siblings.** Round 36 phase 1 put the floating CTA on `--app-bar-max` in `style.css` alone. Phase 2 then had to carry it to the other two by hand: "THE THIRD OF THE THREE FLOATING CTA BOXES, ONTO THE TOKEN … phase 1 put it on `--app-bar-max`" (`CalendarScreen.vue:1254-1262`); "three copies of one floating-CTA box, and phase 1 moved only the one that lives in the sheet" (`ThisWeekScreen.vue:466-469`).
- Why it matters: every responsive or token pass pays per copy, and the record shows a pass that paid for one copy and had to come back. The named obstacle still stands: `tests/round13-nav.test.ts:549` refuses `next-week-bar` in a tab screen. So the shared rule needs a neutral name, which is why nobody merged it.
- Proposal: 05.09 C.6, extended. `src/style.css`, beside `dialog-card`, gains:
  - `.floating-cta` and `.floating-cta-note` (neutral names, so the round-13 pin holds);
  - `.art-scrim`, `.dialog-kicker` / `.dialog-title` (NOT `ui/Eyebrow.vue`, whose header rules the 11 px label a different object), `.dialog-option` and `.dialog-option--accent`, `.hero-fade`, `.dialog-proceed`, and `.portrait-strip` (the `img` rule and its `object-position` stay per strip, because the 12 % and 38 % are separate measurements).

  Components add the shared class and keep their own for the deltas. Every value stays byte-identical, including `.ending-fork-option`'s 2px/11px deltas, kept as a modifier.
- Blast radius: UI-only; no engine law. Pins naming the classes: `cal-go` 5, `week-proceed` 5, `next-week-bar` 8, `knock-proceed` 2, `birthday-proceed` 1, `life-beat-proceed` 3, `cm-art` 11, `staff-art` 1. `prologue-kicker` / `retire-kicker` per 05.09. Contrast and phone-fit mounts (CLAUDE.md's 375×667 rule) must stay green.
- Effort: M
- Confidence: high on the sites. The cost evidence is one documented chase.
- Versus 05.09: carried (C.6), regressed (+3 families)
- Verification: CONFIRMED – every cited family is where the finding says, the three new ones arrived after `98e3560b` (`2a2f5bd0`, `f65ca9bd`, `932fb70b`) and `round13-nav.test.ts` still refuses `next-week-bar` in tab screens; caveat: the chase itself (`6a2bb372`, 04.09) predates 05.09 and was already quoted in C.6, so the cost evidence is carried and only the family count regressed.

### F-11 · The condition ladder (40 / 60) is spelled three times; the diary's copy calls itself a mirror and nothing pins it
- Severity: P2
- Category: duplication
- Evidence:
  - `shared/avatarEmotion.ts:582-583` (`idleEmotion`: `< 40` tired, `< 60` serious).
  - `:509-510` (`conditionDeviation`). Its note says it "READS `idleEmotion`'s OWN THRESHOLDS and must keep reading them … the day they disagree the face and the word start describing different weeks. Pinned in tests/spirit.test.ts" (`:500-502`; the pin is at `tests/spirit.test.ts:731`).
  - `engine/diary/facts.ts:436-440` (`conditionBandOf`: `>= 60` ok, `>= 40` worn, else drained). Its note says "The 80/60/40 rungs mirror the idle-emotion ladder (tired < 40, serious < 60)" (`:433-435`), but no test ties it to `idleEmotion`: the 4 tests naming `conditionBandOf` call it to build facts.
- Why it matters: the diary's `drained` / `worn` lines and the face over them are one ladder counted twice. The hazard `avatarEmotion.ts:500-502` describes for `conditionDeviation` – «the face and the word start describing different weeks» – applies word for word. The second copy is pinned; the third is not. A retune of the face ladder (a balance/UX change the owner makes) lands on two of three.
- Proposal: `shared/avatarEmotion.ts` exports `CONDITION_TIRED_BELOW = 40` and `CONDITION_SERIOUS_BELOW = 60`. All three functions read them, and `diary/facts.ts` imports them (engine → shared is allowed). The `80` fresh line stays the diary's own, with its stated reason. Alternatively, keep the copy and add the pair pin `spirit.test.ts:731` already has for the deviation (form B) – but form A is available (spec §1).
- Blast radius: no RNG draw reads these (pure mappings), so no key moves. No schema, no wording (the band words are unchanged). No balance (same numbers). Tests: `conditionBandOf` 4, `idleEmotion` 4, `shared/avatarEmotion` 27 files (most are type imports).
- Effort: XS
- Confidence: high
- Versus 05.09: new
- Verification: CONFIRMED – the 40/60 thresholds are spelled at `avatarEmotion.ts:509-510`, `:582-583` (`idleRead`, which `idleEmotion` wraps – a slight mislabel) and `facts.ts:437-440`, no test ties `conditionBandOf` to the idle ladder, and `tests/r39-home-age-gates.test.ts:142` already hand-poses condition 35 as `worn`/`tired`, a pair `conditionBandOf` can never produce.

## P3 – polish

| id | title | file:line | one-line proposal |
| --- | --- | --- | --- |
| F-10 | The radio-group key handler `onGroupKey` is four 11-line copies that cite each other; the origin selects every `button`, the three dialogs `button:not([disabled])` (jscpd #2, #4; inert today – PrologueCard disables its group together) | `BirthdayDialog.vue:99`, `KnockDialog.vue:75`, `LifeBeatDialog.vue:209`, `PrologueCard.vue:412,417` | `src/composables/radioGroupKeys.ts` exporting `onRadioGroupKey(event)` in the `:not([disabled])` form; no template string moves; the mounted `ArrowDown` suites (`round42-select-confirm`, `life-beat-dialog`, `birthday-dialog`, `round40-prologue-choices`) are the net |
| P3-01 | D-04 residue: the global `.recap-card` border and `.recap-dot` (12 px) are fully shadowed by the scoped rules, and the sheet's note calls them "load-bearing" | `style.css:4393-4412` vs `WeekRecapCard.vue:985,1487-1500`; `.ledger-week` `style.css:2857` / `MoneyScreen.vue:3736`; `.season-summary-from` `style.css:4752` / `SeasonSummaryDialog.vue:363` | Delete the global `.recap-dot` block and `.recap-card`'s border; move `ledger-week` / `season-summary-from` to one side |
| P3-02 | D-06: the season index is re-derived outside `seasonIndexOf` | `TrophiesScreen.vue:98`, `season/calendar.ts:2053` (literal `52`), `economy.ts:8734`, `shared/dates.ts:88,324`; owner `world/ledger.ts:228` | Move `seasonIndexOf` to `shared/dates.ts`; `ledger.ts` re-exports it |
| P3-03 | D-07: the counting-window fold ×4, and snapshot still sorts twice | `season/ranking.ts:367,524`, `world/ladder.ts:1443`, `world/snapshot.ts:796-798` | `countingWindow(…)` in `ranking.ts` (05.09 C.11); prove it with `test:sim` |
| P3-04 | C.9: the friendly-match record ×3 (verb triple, score idiom, `addEvent`) | `world/college.ts:549,911`, `world/planner.ts:456` | `recordFriendlyMatch` after the result; the `simulateMatch` keys stay at the call sites, so the draws are byte-identical (capture 41550/`e6b0c709` + key nets) |
| P3-05 | C.12: the country-picker filter ×2 | `OnboardingWizard.vue:288`, `PrologueCard.vue:291` | `useCountryPicker()` in `composables/countries.ts` |
| P3-06 | C.8: the dialog portrait triple ×3 | `ForkDialog.vue:289`, `RetirementDialog.vue:246`, `InjuryStopDialog.vue:124` | `useDialogPortrait(emotion)` |
| P3-07 | C.13: `clamp`-family definitions grew 11 → 15 | `chemistry.ts:406`, `form.ts:195`, `development.ts:547`, `coachMarket.ts:378` (new) + the 05.09 sites | `shared/math.ts`, re-exported from `condition.ts:19` |
| P3-08 | C.14: `TIER_LADDER.indexOf` as "the rung", 28/12 → 33/14 files | e.g. `season/tournament.ts:771`, `world/spotlight.ts:222`, `composables/weekDays.ts:501`; `viz/preview.ts:83` exports `rungOf` | `tierRung(tier)` beside `TIER_LADDER` |
| P3-09 | Duplicated string tables and text helpers | `AGE_WORD` `diary/words.ts:151` = `AGE_WORDS` `world/age.ts:347` (+ `NUMBER_WORD` `viz/commentary.ts:509`); full `MONTHS` `composables/identityCopy.ts:34` = `MONTH_NAMES` `shared/dates.ts:170`; numeric `ordinal` `kidLife.ts:226` = `nationalTeam.ts:405`; `capitalize` `diary.ts:512` / `capitalise` `diary/words.ts:162` | One table and one helper each (`ageWord` delegates to `ageInWords`); every rendered string stays byte-identical |
| P3-10 | The timeline's "mirror" of MatchViewer's `ooh` rule has drifted: it still describes a break-point `ooh` that R9-23 removed, and its `brokeServe` branch is unreachable behind the caller's `!p.gameEnd` gate | `viz/timeline.ts:46-59,169` vs `MatchViewer.vue:499-506` | Drop the dead branch and point the docstring at `MatchViewer`, or export one `oohPoint(p)` both read (August item) |
| P3-11 | The two dice SVGs, copied into both identity forms | `OnboardingWizard.vue:409-439` ↔ `PrologueCard.vue:535-577` | `ui/DiceIcon.vue` with a `face` prop |
| P3-12 | The draw-path grid and `Continue`, on both finale posters | `TournamentFlow.vue:1345-1362` ↔ `:1402-1419` | One template block or a small `PosterPath` child |
| P3-13 | The booth's changeover-anchor search ×2 | `viz/commentary.ts:2038-2057` ↔ `:2085-2093` | `firstFreeChangeover(s, cands, lastIndex)`; the two recorded differences stay at the callers |
| P3-14 | Two identical staff fare gates | `world/sponsors.ts:1194-1200` = `:1241-1247` | `staffSeatFareFor(hired, travels, event, world)` beside `staffSeatFareCents` (with F-05) |
| P3-15 | `walk(dir)` ×4 in `scripts/` (05.09: 3) | `engine-purity.mjs:33`, `graph.mjs:55`, `pin-ratchet.mjs:50`, `tools-registry.mjs:64` | `scripts/lib/walk.mjs` (`scripts/lib/` exists) |
| P3-16 | e2e setup pasted between specs | `psychologist.spec.ts:110-279` ↔ `spotlight.spec.ts:144-310` (4 sites); `careerAt.ts:372-382` ↔ `:449-459` | A shared seed-and-open step in `e2e/careerAt.ts` |
| P3-17 | `lossStreak` names an object on one side of the boundary and a count on the other | `diary/facts.ts:263` vs `protocol/narrative.ts:844`, bridged `diary.ts:169` | Rename one side (`lossStreakRun` / `lossStreakCount`) when F-06 lands |
| P3-18 | 05.09 C.5: "Lifted from" helper sets are still local | 7 files carry "Lifted from" (e.g. `injury-report.test.ts:52`) | Domain helpers under `tests/helpers/` (with F-01) |
| P3-19 | `tools/_corridor.ts`, a SHARED module, exports the unsigned `money` | `tools/_corridor.ts:72` | Re-export `formatCents` (with F-04) |
| P3-20 | `fundsPressureOf`'s `watchful` line (`8_000_00`) equals `ECONOMY.startingFundsCents.working` (`economy.ts:271`), while its note calls it "a working-class season of base costs" | `diary/facts.ts:443-449` | Read the constant if it is the reserve, or say it is a coincidence (Question 2) |
| P3-21 | PrologueCard's two radio groups and its input/select rules duplicate each other in-file | `PrologueCard.vue:756-770` ↔ `:797-811`; `:1126-1138` ↔ `:1153-1169` | `v-for` over the groups; a selector list for the two box rules |

F-10 was written as a P2 finding and re-rated to P3 by Phase 2; it keeps its ID and now sits in the table above. Its verification line, verbatim:
- Verification: CONFIRMED – the four 11-line copies, their chained docstrings and `PrologueCard.vue:417`'s bare `button` selector are as cited, but the drift has no effect today (every PrologueCard radio binds the same `:disabled="busy"`) and the cost is a future hypothetical with no measured incident, which the brief's §8 rates polish, not P2 debt.

## Delta versus 05.09

Every finding of `docs/review-principles-2026-09-05/05-duplication.md`, and the consolidation-plan clusters that were not written up as findings:

| ID | title | status | evidence |
| --- | --- | --- | --- |
| D-01 | The diary paints her off the band clock | fixed | `85dd98e7` (05.09); `diary.ts:703` `portraitStage(view.ageYears)`, `:657` `kidAgeAt(pick.week)` |
| D-02 | Two engine feed lines format money by hand | fixed | `cc2e455c` (05.09, E-12). No `/ 100).toLocaleString` in `src/engine` beyond the deliberate `college.ts:1234-1239` `moneyClause`. `tests/money-format.test.ts:50-54` still scopes the engine out – the half of D-02 that asked for the gate to widen is not done (owner's call, as 05.09 said) |
| D-03 | `layoffNote` ×3, one with a full stop | fixed | `f64de9e7` (06.09); `layoffNoteFor` `composables/weekDays.ts:428`, read by `PlanWeekSheet.vue:152` and `CalendarScreen.vue:164` |
| D-04 | `.recap-*` defined globally and scoped | still open (partly fixed) | `.recap-days` / `.recap-day` / `.recap-day-letter` left `style.css`. `.recap-card` and `.recap-dot` remain, dead by cascade, with a note calling them load-bearing (`style.css:4393-4412`). `.ledger-week` and `.season-summary-from` are unchanged → P3-01 |
| D-05 | The tools' helper copies disagree | regressed | money 27 → 43, median 17 → 20, quantile 11 → 17 (+9 `pctl`), pct 45 → 75 → F-04 |
| D-06 | A screen re-derives the season index | still open | `TrophiesScreen.vue:98`, `calendar.ts:2053`, `economy.ts:8734`, and now `shared/dates.ts:88,324` → P3-02 |
| D-07 | The counting-window fold ×4 | still open | `ranking.ts:367,524`, `ladder.ts:1443`, `snapshot.ts:796-798` → P3-03 |
| D-08 | 33 copies of the localStorage shim | regressed | 57 files, 53 byte-identical → F-03 |
| D-09 | `firstWeekOfMonth` has zero users | fixed | Deleted (E-08, 05.09); tombstone `shared/dates.ts:244`, pinned `tests/week-numbering.test.ts:328` |
| C.1 | `tools/lib` stats / args / fmt | still open, regressed | No `_stats` / `_args` / `_fmt`; `argOf` 66 → 84 → F-04 |
| C.2 | Test tick-and-skip `walkWeeks` | still open, regressed | 157 lines in 82 files → 198 in 118 → F-02 |
| C.3 | The localStorage shim | regressed | = D-08 → F-03 |
| C.4 | `SeasonEvent` fixture + `giveKidPoints` | still open | 29 → 34 files; `giveKidPoints` ×9 → F-01 |
| C.5 | "Lifted from" helper sets | still open | 7 files → P3-18 |
| C.6 | CSS objects (floating CTA, scrim, kicker, option, hero fade) | still open, regressed | All present, +3 families → F-09 |
| C.7 | The match-surface triple + box-score table | still open | Unchanged sites → F-08 |
| C.8 | Snapshot selectors | partly fixed | `fundsShort` → `useEventCard` (U-12, `CalendarScreen.vue:286`, `SeasonScreen.vue:110`); `layoffNote` → D-03; the portrait triple is open → P3-06 |
| C.9 | Friendly-match record ×3 | still open | `college.ts:549,911`, `planner.ts:456` → P3-04 |
| C.10 | Global/scoped double CSS | still open (partly) | = D-04 |
| C.11 | Counting-window fold | still open | = D-07 |
| C.12 | Country picker | still open | → P3-05 |
| C.13 | `clamp` ×11 | still open, regressed | 15 definitions → P3-07 |
| C.14 | Tier rung ×28 | still open, regressed | 33 in 14 files → P3-08 |
| C.15 | Staff-fare charge ×2 | regressed | ×3 (`768d67b6`) → F-05 |
| C.16 | Engine inline money | fixed | = D-02 |
| C.17 | Season index | still open | = D-06 |
| 05.09 "scripts `walk(dir)`" | Directory walk in `scripts/` | still open, regressed | 3 → 4 → P3-15 |

## August review – `docs/review/02-code-quality.md`, the duplication items

| item | status | evidence |
| --- | --- | --- |
| [HIGH] Money formatting re-implemented 15 times, with the `formatDollars(dollars)` unit trap | fixed | `src/shared/money.ts` (`formatCents` / `formatCentsSigned`). `git grep -nE "function (formatDollars\|formatSigned\|formatFunds)\b" -- src` is empty. The UI is gated by `tests/money-format.test.ts` |
| [MEDIUM] `MoneyScreen` hand-copies `STARTING_FUNDS_CENTS` | fixed | `MoneyScreen.vue:69` imports it, `:172` reads it, and the note at `:170` records the old copy |
| [MEDIUM] App.vue: one badge pattern, four copies | fixed | `76201cb9` (07.09): `composables/tabSeen.ts`; `App.vue:49` "Nothing in this file touches `localStorage` any more" |
| [MEDIUM] Global/scoped CSS split-brain (13 dual-defined classes) | partly fixed | A first-selector scan now finds 8 (`.bt-row`, `.season-summary-from`, `.back-link`, `.recap-card`, `.recap-dot`, `.error`, `.event-art`, `.tb-pill--cta`), plus `.ledger-week` as a second selector → P3-01; `.tb-pill--cta` is deliberate (05.09) |
| [LOW] Replay recipe copy-pasted 3x | still open | → F-08 (now 4 UI copies, counting the prologue weekend) |
| [LOW] Worker boilerplate (23 `if (!world) throw`) | mostly fixed | 6 remain (`sim.worker.ts:238,641,647,768,778,794`); the worker is lane D's |
| [LOW] Deliberate mirrored predicates – the timeline `ooh` | still open, drifted | → P3-10 |
| [LOW] Deliberate mirrored predicates – the friendly lookup ×3 | still open, diverged | → F-07 |

## Seed leads

- **Lead 1 – helper sprawl in tests and tools: confirmed.**
  - **The census:**
    - `function walk(` 69 (tests 44 · tools 25), `careerAt` 29, `walkTo` 6 and `expecting` 6, all reproduced exactly.
    - Clustered by what the bodies do (`helper-census.mjs`), the 90 `walk` definitions hold 34 real world walks, and one of them is byte-identical in 13 component files.
    - `careerAt` is 19 pokes, 3 byte-identical create-and-tick fixtures (the parity files) and 7 walks.
    - Next to them: 27 `weekAtAge` (20 identical), 56 `LoveEpisode` literals and 13 local comment-strippers.
  - **The three `clashWorld` copies, diffed:** they differ in options, body pose, term arithmetic and brand (the table in F-01), and the 23.09 re-aim needed a second commit for the third copy (`bc29ac13`).
  - **Merge candidates:**
    - F-01: `signedAdPaper`, `clashWorld`, `loveEpisode` / `married`, `pushEvent`;
    - F-02: `walkWeeks`, `pokedAt`, `weekAtAge`, `codeOf`;
    - F-03: the shim in `setup.ts`;
    - F-04: the `tools/_stats` / `_fmt` / `_args` modules.

  Lane H owns the helper architecture.
- Leads 2–11 are not assigned to this lane. Two touch DRY and are pointed at their owners:
  - lead 7's hand-mirrored tables (the divorce answer deltas copied from the break-up's) are lane C's;
  - lead 5's parity sweep is lane E's (F-07 is the August duplication item, which overlaps it).

## Not reviewed

- **Clone classification is complete only for `src` at 60/6** (all 34 clones, one by one). The brief's §6 F asks for every clone, and this lane did not do that for the rest. **This must carry to README's "Not reviewed":**
  - **`tests` (610 clones) and `tools` (267):** the ten largest clusters were opened by hand; every other clone got only a family verdict from a keyword rule (`clone-families.mjs`, table above). **216 clones match no rule and have no verdict:** 125 in tests and 91 in tools.
  - **The html LOW clones** (97 of the `src` 30/4 pass, of which 34 are the whole-script artefact) were classified by class and family only, because the tokenizer's html output is unreliable (05.09 Method; baseline §A4).
  - **The rest of the LOW pass** (the typescript and css classes) was classified by class, with the cross-file facts named. It was not done clone by clone.
- **The 211 archival tools' helper copies,** beyond counting them. F-04 targets the live 55.
- **Every "other" body in the `quantile` / `median` classifier** (8 + 6) was not hand-read.
- **`e2e/`** beyond Phase 0's pairs (P3-16).
- **`docs/`, the `tools/*.mjs` and `.html` probes, and `migrations.ts`.** 05.09's B12 note stands; shipped steps are never edited.
- **No mutation or gate run.** No proposal was prototyped – the lane is read-only, and Phase 1 forbids gates and timings. F-03's and F-06's "no behaviour moves" claims are argued from the code, not run.
- **`src/style.css` as a whole.** Lane E owns CSS tokens and the responsive rules; F-09 covers only the pasted objects.

## Questions (for the synthesis to carry)

1. `tests/component/round30-do-both-shoot.test.ts:65` poses the brand `'Nine Bells'`, which is not a house in `ECONOMY.advertising` (`economy.ts:2570` onwards), while its two siblings read `houses[0]`. Is a brand outside the ladder intended there, or should a shared `clashWorld` read the ladder's first house?
2. `diary/facts.ts:448`'s $8,000 "watchful" line equals the working family's starting reserve (`economy.ts:271`). Is it meant to track that reserve if it is retuned, or is it an independent money-worry threshold?
