---
type: review
status: audit
area: project-review
canonical: false
last-reviewed: 2026-09-26
baseline: 03d92221
---

# Refuted in verification – 26 September 2026 review

Every P0–P2 finding in the eight lane reports (`01-architecture.md` … `08-tests-tooling-docs.md`) was
re-checked at `03d92221` by an agent that had not written it and was told to refute it: read the cited
lines, re-run the cited command or probe, and look for the documented ruling that explains the code.
Of 68 findings, **CONFIRMED 56 · PLAUSIBLE 11 · REFUTED 1**. The one refuted finding is below: its
original section verbatim, as the lane filed it, followed by the reason. Its lane file keeps only the
heading, so that no ID is renumbered, and the measurement under it survives as an observation
(`07-performance.md`, Seed leads, lead 11).

### G-06 · The sim econ family grew 21–29 % at constant cases since 13.08; `econ-reach-pro` reads 54.2 s solo, 6 s under birpc's wall on the owner's own Mac, where every PR assembly runs it
- Severity: P2
- Category: tests
- Evidence:
  - **The growth.** §D.4, `npm run test:sim -- tests/<f>.test.ts` one at a time:
    | file | 13.08, s | 26.09, s |
    | --- | ---: | ---: |
    | `econ-reach-pro` | 41.9 | **54.15** |
    | `econ-bench` | 39.0 | 48.73 |
    | `econ-reach` | 37.9 | 45.74 |
    | `econ-reach-agree` | 35.8 | 44.94 |
    | `fatigue-bench-planner` | 22.3 | 38.35 |

    The 13.08 figures are recorded at `scripts/units.mjs:77` and `scripts/heavy-tests.mjs:160`.
  - **At constant cases.** `tests/econ-reach-pro.test.ts` last changed on 10.08 (`486284c6`), so the
    growth is walk price: the engine got dearer on the bench driver (§B.2, 5.1 → 7.0 ms per week across
    a career).
  - **The wall is real on this Mac.** `fatigue-bench-policy` stalled solo on a quiet Mac at 65.2 and
    69.73 s with both tests green, and had to be cut (`scripts/heavy-tests.mjs:47-53`).
  - **What a stall costs.** A stalled sim file is retried once and a second stall is accepted as green
    (`scripts/sim.mjs:119-140`, the owner's ruling A of 15.09). Every PR assembly runs `npm run
    test:sim` locally by ruling (CLAUDE.md, "The simulation suite's standing regime").
- Why it matters: when `econ-reach-pro` crosses 60 s, every PR assembly pays a stall plus a retry, about
  +55 s and an "accepted" line nobody reads. The weekly cron already pays that for the 8 of 13 files over
  60 s at the runner's ×1.9 (§D.4). The whole sim run is 7.66 min now (459.6 s), against CLAUDE.md's
  "~5 min".
- Proposal: cut `econ-reach-pro` along its describe seams now, before the red – the protocol
  `fatigue-bench-policy` followed on 27.08, «nothing trimmed», with the same seeds and cases. Refresh the
  recorded solo table in `heavy-tests.mjs`. Lanes C and H own the bench structure.
  - Behaviour cannot move: the same seeds and assertions are split across files.
  - The bench arm that proves it is the file's own assertions and the econ bench numbers, unchanged
    (`npm run bench:econ`).
- Blast radius: tests only; balance untouched because cases are moved, not changed.
  `git grep -l "econ-reach-pro" -- tests/ | wc -l` = 2.
- Effort: S
- Confidence: medium. That 60 s bites solo is established by the `fatigue-bench-policy` precedent; the
  date it crosses depends on future engine growth.
- Versus 05.09: new.
- Verification: pending

- Refuted because: The timings reproduce: sim-econ-reach-pro.log WALL_S=54.15, econ-bench 48.73, econ-reach 45.74, econ-reach-agree 44.94, all X_EXIT=0. The file really is unchanged since 486284c6, though the 26.09 walls include npm plus sim.mjs overhead that the 13.08 per-process figures did not. The cost claim, however, is contradicted by the repo's own record and covered by a documented ruling. The owner's ruling A (55ffd4e5, 15.09; sim.mjs:130-140) was made knowing these same four benches were 'green locally in 63-89s'. So a file over 60 s locally does not mean every PR assembly pays a stall plus retry, and a double stall is accepted by design, with 'a sim bench's minutes are its statistical power'. CLAUDE.md's standing sim regime likewise records 'The birpc stall is NOT fixed … sim.mjs's retry classifier carries it'. What survives is a stale recorded solo table (heavy-tests.mjs:160, units.mjs:77), which is P3 polish, not a P2 finding.

## Sub-claims corrected in verification – the findings themselves survive

No other finding was refuted. Several surviving findings lost a sub-claim in verification; each lane
file records the correction in the finding's Verification line, and `README.md` uses the corrected
form. Listed here so the record of what failed is in one place:

| finding | sub-claim that failed | what holds instead |
| --- | --- | --- |
| G-01 | the only runtime path from the UI to the album corpus is `BracketTabs → world.ts` | a second path exists, `MoreScreen → db/saves → saveCodec → migrations.ts / saveGuard.ts → barrel` (A-02's verification); the `/*#__PURE__*/` / lazy fix does not depend on the path and was built: −49,042 B |
| A-02 | repointing the 17 UI imports frees the corpus bytes | it does not, because of the path above; only the initialiser fix frees them (G-01) |
| A-06 | only `world.ts` imports `world/lifeBeat.ts` in `src` | five `world/*` modules import it directly (`endings.ts:67`, `multiWeek.ts:41`, `phaseHerWeek.ts:54`, `smallTalkCorpus.ts:36`, `snapshot.ts:99`) |
| F-04 | no tool imports `mean` / `median` from `tools/econ-bench.ts` | 37–43 tools do (a `git grep -E` artefact); the lane corrected its proposal to a byte-identical lift |
| H-02 | generated files are "6 of 23 conflicted files" | 6 of 23 conflict events over 11 distinct files, of which 2 are generated; the lane reconciled its text |
| H-09 | 344 bytes of headroom under the CLAUDE.md budget; both Commands timings "stale by half" | the audit counts UTF-16 characters: 635 (2.9 %) on the branch, 958 at `03d92221`; only `test:component` is shown stale, because the 7.66 min sim figure is a sum of 13 runs |
| G-04 | the wedding spec sorts last and starts last | it finished last (+71.24 s) and started at +34.69 s; the 36.55 s long pole stands |
| D-05 | More is not mounted during the list refreshes | false for `setWeightEnabled`, called from `MoreScreen.vue:415`; the proposal still covers it |
| B-05 | 133 test files call `closeTournament` | 132; skip-then-close gave 1/1/0 result rows |
| E-01 | on `v46` the header reads 6 against 0 entries this season | 6 against 1 from w156 to w179 (the 6th entry is a w156 booking) |
