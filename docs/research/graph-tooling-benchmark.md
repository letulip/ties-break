---
type: research
status: reference
area: tooling
canonical: false
last-reviewed: 2026-08-03
baseline: 412211f
---

# Graphify vs grep: a head-to-head that was actually run

Whether to adopt a code knowledge graph in ties-break. Prompted by a real result in **onsight-poc**
(43 files → 1,180 nodes in one second, zero tokens). Both tools were run against **known answers**:
the 17 real test breakages caused by the `world.ts` (PR #67) and `diary.ts` (PR #71) decompositions,
extracted from git rather than from memory.

**Verdict: split. Graphify loses the impact question decisively and wins two questions grep cannot
answer at all. Installed for the latter, explicitly not for the former.**

## Build cost (measured, ties-break)

| | onsight-poc | ties-break (pre-split `b7a9358`) | ties-break (current) |
|---|---|---|---|
| files | 43 | 301 | 301 |
| nodes / edges | 1,180 / 2,243 | 4,221 / 10,436 | **5,366 / 13,748** |
| wall time | ~1 s | 3.5 s | **4.5 s** |
| model tokens | 0 | 0 | **0** |

Code indexing is pure tree-sitter/AST — genuinely free. (Document indexing is a separate matter and
was not run; it needs a semantic backend.) An earlier objection in this conversation that ties-break
was "too small to need this" was based on a **src-only** count of 53,632 lines and was wrong: the
real navigable codebase is 301 files / 108,185 lines, seven times onsight-poc.

## Round 1 — "what breaks if I move this?" → **grep wins, decisively**

Both tools were run against the **pre-split** tree and scored on the 14 test files that really broke
during the `world.ts` decomposition.

| | recall | precision | missed |
|---|---|---|---|
| `git grep -l "engine/world.ts'" -- tests/` | **14/14 = 100%** | **14/16 = 87.5%** | – |
| `graphify affected <symbol> --depth 2` (18 moved symbols, unioned) | 13/14 = 92.9% | **13/50 = 26%** | `week-notes` |

Grep wins on both axes, and the loss is structural rather than incidental:

**Precision.** The graph names every file that *imports* the module. But the public API was preserved
by re-export, so importing `enterEvent` from `engine/world` still resolves after it moves to
`world/entries.ts` — **the imports are exactly what did not break.** 61 test files import
`engine/world` or `engine/diary`; only 17 broke. 26% precision means 37 false positives to dismiss by
hand, and it points confidence in the wrong direction.

**Recall.** The one file the graph missed, `week-notes`, is the purest example of the coupling that
actually breaks: it pins a template literal by reading source text.

```ts
expect(read('../src/engine/world.ts')).toContain('trainPct: world.plan.train')
```

No import, no call edge — a filesystem read and a string match. **41 test files read source text
directly; 36 use `indexOf` slicing.** An AST graph cannot see any of it, and the slice form is the
dangerous one: when an end marker moves, `indexOf` returns −1 and the slice silently swallows the
rest of the file, so a negative assertion passes while proving nothing (this happened for real, in
`tests/round11.test.ts`).

## Round 2 — questions grep cannot answer → **Graphify wins outright**

**`god-nodes`** ranks nodes by connectivity, and independently reproduced the architectural analysis
that took several hand-written probe scripts during the P4 wave:

```
rngFromSeed() 215 · tickWeek() 177 · createWorld() 166 · TierId 110
WorldState 97 · enterEvent() 97 · toSnapshot() 93 · skipTournament() 80
```

That is the integration core, identified in one second. `tickWeek` at 177 edges is precisely why it
was left in `world.ts` when everything around it moved out.

**`path "A" "B"`** gives the shortest connection between two concepts:

```
rollInjury() --calls--> knockLive() <--calls-- toSnapshot()
```

Neither is expressible as a grep. Both are genuinely useful for orientation — deciding *what* to
split, and understanding an unfamiliar seam.

## What was installed, and the rule that goes with it

`graphify install --platform claude` → `~/.claude/skills/graphify/` (user-level; it did not modify
this repo). `graphify-out/` is gitignored — the graph is a local artifact, rebuilt in 4.5 s, never
committed.

**Use it for:** orientation before deciding what to decompose (`god-nodes`), understanding an
unfamiliar connection (`path`, `explain`), and browsing real import structure.

**Do not use `affected` as a pre-split impact check.** It is 26% precise here and misses the
source-pin coupling that is the actual failure mode. The measured answer for that question is one
grep, documented in `CLAUDE.md`:

```bash
git grep -l "engine/<module>.ts'" -- tests/
```

## The residual point no graph addresses

The knowledge that actually prevented mistakes across both decompositions was **causal, not
structural**: the frozen RNG capture is a measurement rather than a change-gate since v35; `vue-tsc`
passes where rollup dies on a type re-exported through a value import (fired three times); a slice
with a departed end marker returns −1; the `▶▶ 52 (dev)` button is an owner ruling rather than a
regression. None of it is derivable from an AST. It lives in `CLAUDE.md`, `AGENTS.md` and the prose
comments this codebase deliberately keeps. The graph complements that record; adopting it is not a
reason to thin it.

## Method note

Positions taken, in order: (1) not worth it — based on a wrong, src-only size count; (2) worth trying
— after the onsight-poc evidence corrected the scale and killed the cost objection; (3) split verdict
— after running both tools against known answers. Only (3) is measured.

Reproduce: `graphify update . --no-cluster` in a worktree at `b7a9358`, then
`graphify affected <symbol> --depth 2` for the symbols listed under "ground truth" below, against
`git grep -l "engine/world.ts'" b7a9358 -- tests/`.

### Ground truth: the 20 break events

| Extraction | Tests that broke |
|---|---|
| `world/entryCaps.ts` + `world/labels.ts` | `age-caps`, `ladder`, `prize-money`, `round11` |
| `world/sponsors.ts` | `offers` |
| `world/milestones.ts` | `round12` |
| `world/knockHistory.ts` | `knock` |
| `world/entries.ts` + `world/injury.ts` | `round10`, `round11-followups`, `round12` |
| `world/knock.ts` + `world/planner.ts` | `knock` |
| `world/matchNews.ts` + `world/snapshot.ts` | `preview`, `round11`, `round12-view`, `week-notes`, `week-scene`, `world-trio` |
| `diary/facts.ts` | `round11-view` |
| `diary/pool.ts` | `injuries`, `round13` |
