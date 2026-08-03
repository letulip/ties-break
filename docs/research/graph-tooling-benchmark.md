---
type: research
status: reference
area: tooling
canonical: false
last-reviewed: 2026-08-03
baseline: 412211f
---

# Code-graph tooling: a benchmark that was run, and its answer

Whether to adopt a code knowledge graph (Graphify or equivalent) in ties-break. Prompted by a real
result in the sibling project **onsight-poc**: 43 files graphed in one second for zero model tokens,
and three typical "where does X live" questions answered in 34 words against ~23,000 for reading the
same modules whole.

**The benchmark below has been run.** Ground truth is extracted from git – every row is a test that
really broke during the `world.ts` and `diary.ts` decompositions (PR #67, PR #71) and was repaired in
the same commit. The result changed the recommendation twice, so the reasoning is kept in full.

## Result in one line

For this repo's expensive question – *"what breaks if I move this?"* – a **one-line `git grep`
predicted 17 of 17 real breakages across both decompositions (100% recall, 81% precision)**. The case
for adopting a graph to answer that question does not survive measurement.

## Scale: the earlier scepticism was wrong on this point

| | onsight-poc | ties-break |
|---|---|---|
| files | 43 | **301** (150 src, 115 tests, 36 tools/scripts) |
| lines | – | **108,185** |
| internal import statements | – | **~1,616** |

Seven times the file count. An earlier objection in this conversation ("too small to need a graph")
was based on a **src-only** line count of 53,632 and was simply wrong.

## The two questions

**Tier A – "where does X live?"** `ripgrep` answers in ~20 ms at zero token cost
(`grep -rl "from '.*engine/world'"` → 112 files, 0.02 s). A graph reads more pleasantly; the
bottleneck was never locating a symbol.

**Tier B – "what breaks if I move X?"** The expensive question. During two decompositions it was
answered reactively, one failing test run at a time: **20 break events across 17 distinct test
files.** This is what the benchmark scores.

## Ground truth: the 20 breaks

### world.ts → world/ (PR #67)

| Extraction | Tests that broke |
|---|---|
| `world/entryCaps.ts` + `world/labels.ts` | `age-caps`, `ladder`, `prize-money`, `round11` |
| `world/sponsors.ts` | `offers` |
| `world/milestones.ts` | `round12` |
| `world/knockHistory.ts` | `knock` |
| `world/entries.ts` + `world/injury.ts` | `round10`, `round11-followups`, `round12` |
| `world/knock.ts` + `world/planner.ts` | `knock` |
| `world/matchNews.ts` + `world/snapshot.ts` | `preview`, `round11`, `round12-view`, `week-notes`, `week-scene`, `world-trio` |

### diary.ts → diary/ (PR #71)

| Extraction | Tests that broke |
|---|---|
| `diary/facts.ts` | `round11-view` |
| `diary/pool.ts` | `injuries`, `round13` |

## ⚠ Why an import graph would score badly here – on PRECISION, not recall

The coupling that breaks is not the import. It is a filesystem read plus a string match:

```ts
const src = readFileSync(new URL('../src/engine/world.ts', import.meta.url), 'utf8')
const fn = src.slice(src.indexOf('function maybeFireSeasonWrapUp'), src.indexOf('// --- finish / stage labels'))
expect(fn).toContain('world.seasonStartRank')
```

**16 of the 17 broken tests DO import the module** – so an import graph finds them. But the imports
are exactly what did *not* break: the public API was preserved by re-export, so `enterEvent` still
resolves from `engine/world` after moving to `world/entries.ts`.

Measured: **61 test files import `engine/world` or `engine/diary`; only 17 broke.** An import-graph
answer of "these 61 files depend on world.ts" is **27.9% precise** – and worse than useless, because
it implies the other 44 need checking when they were never at risk.

## The measured answer: grep already wins Tier B

Run against the tree **as it stood before each split**:

```bash
git grep -l "engine/world.ts'" -- tests/    # before PR #67
git grep -l "engine/diary.ts'" -- tests/    # before PR #71
```

| Split | grep predicted | actually broke | recall | precision |
|---|---|---|---|---|
| world.ts (#67) | 16 files | 14 | **14/14 = 100%** | 87.5% (false positives: `calendar-screen`, `round13-nav`) |
| diary.ts (#71) | 5 files | 3 | **3/3 = 100%** | 60% (false positives: `diary`, `week-notes`) |
| **combined** | 21 | **17** | **100%** | **81%** |

Every break was predictable, before the cut, by one grep costing milliseconds.

**So the real failure was procedural, not tooling.** The breaks were discovered reactively because
nobody thought to run that query first – not because the query was hard, slow or expensive. Buying a
tool to fix a missing habit is the wrong purchase.

## Recommendation

**Do not adopt a code graph to solve Tier B in ties-break.** Its headline use case here is already
solved, perfectly, for free.

Residual value is real but modest, and should be judged on its own merits rather than on the
23k-token comparison:

- transitive questions ("what breaks two hops out") that grep genuinely cannot answer;
- a browsable structure for onboarding a second contributor;
- the ~1,616 real import edges, for refactors that change signatures rather than locations.

Since the build is one second and zero tokens, trying it costs almost nothing – but adopt it for
those reasons, with those expectations, not as a fix for the split workflow.

**The free fix, which measurement supports, is a pre-split checklist** (now in `CLAUDE.md`): before
moving anything out of a module, grep the test tree for reads of that module's path, and treat every
hit as a pin to repoint. 100% recall, no dependency, no index.

## Caveat that no graph addresses

The knowledge that actually prevented mistakes during both decompositions was **causal, not
structural**: the frozen RNG capture is a measurement rather than a change-gate since v35; `vue-tsc`
passes where rollup dies on a type re-exported through a value import (fired three times); a slice
whose end marker moved returns −1 and silently swallows the rest of the file; the `▶▶ 52 (dev)`
button is an owner ruling rather than a regression. None of it is derivable from an AST. It lives in
`CLAUDE.md`, `AGENTS.md` and the prose comments this codebase deliberately keeps.

## Method note

Positions taken in this analysis, in order: (1) not worth it – based on a wrong, src-only size count;
(2) worth trying – after the onsight-poc evidence corrected the scale and killed the cost objection;
(3) not worth it *for this purpose* – after actually running the benchmark. Only (3) is measured.
Reproduce with the `git grep` commands above against `b7a9358` and `73dfb2d`.
