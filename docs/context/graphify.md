---
type: reference
status: current
area: tooling
canonical: true
last-reviewed: 2026-09-19
---

# Graphify (code graph) – what it is and is not for

## Current truth

The graph is an ORIENTATION instrument and nothing else: `god-nodes`, `path` and `explain` answer
questions no grep can express, and everything below is the measured boundary of that. It indexes
`src`/`tests`/`tools`/`scripts` through tree-sitter at zero model cost; ⚠ it must never be pointed
at `docs/`, where the same command runs through semantic extraction and the agent session pays. A
stale graph is worse than none, `affected` is not an impact check (26% precision, measured), and
natural-language `query` is lexically noisy on this corpus. When the graph and a grep disagree,
check the grep first – in both recorded disputes the search was broken, not the graph.

Moved out of `CLAUDE.md` on 19.09 by the owner's ruling («давай вынеси graphify в отдельный
документ»), verbatim and unedited. It left because it is the one long block in the house file that
documents a TOOL rather than a law, and the file had reached its own context budget with two
measured hazards waiting to be written down. Nothing here changed in the move.

```bash
npm run graph        # rebuild – ~10 s, 0 tokens; it PRINTS its size (11,013/28,620, 18.08)
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
