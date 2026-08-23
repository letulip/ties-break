---
name: house-review
description: On-demand review of a branch, PR or commit range against THIS repo's own law - CLAUDE.md invariants, engine purity, RNG discipline, schema moves, guard-test rules, copy rules - producing a verdict and recommendations, never auto-fixing. Use when the owner asks to review a wave, a branch, a PR or recent commits ("поревьюй ветку", "прогони ревью по нашим правилам", "заключение по коммитам").
---

# /house-review – the repo's own law, applied to a diff

The owner's ask (23.08): an assistant that reviews changes and gives «заключение и рекомендации по
организации кода, соблюдению наших принципов и прочего» – as a SKILL, on demand. The deliverable is
a verdict, never an edit: findings are reported, fixes are a separate decision.

## Input

A branch (default: the current branch against `main`), a PR number's branch, or an explicit range.
Resolve to one diff: `git diff main...<branch>` plus the commit list.

## Pass 1 – the mechanical law, each a command, each verdict quoted

Run in the target's worktree, exit codes from files, never through a pipe:
1. `node scripts/engine-purity.mjs` – invariant 1.
2. `npm run context:audit` – the docs law.
3. `node scripts/world-map.mjs --check` – the symbol map.
4. RNG red flags in the diff: `git diff main...<branch> -- src/engine | grep -nE "Math\.random|new Date\(\)"`
   (must be empty), and every NEW `rng()` draw traced to a purpose-scoped sub-stream – a draw on the
   MAIN weekly stream from a player-choice path is the gravest finding this skill can make.
5. Schema: if `src/engine/migrations.ts` or `SAVE_SCHEMA_VERSION` moved, verify all FOUR parts in
   the same range (bump, append-only migration, golden fixture `tests/fixtures/saves/`, regenerated
   `e2e/fixtures`) – a partial move is a finding.
6. Copy rules on changed files: Cyrillic inside `<template>` (`[Ѐ-ӿ]`), the long dash `—`
   anywhere player-facing, money not in cents, gendered strings for professionals (R15-7's law).

## Pass 2 – the judgment law, read from the diff itself

Read every hunk against the principles the machine cannot check:
- **Guard tests**: deleted or weakened is a top finding; re-aimed requires the ⚠ note naming what
  changed and why (the house rule). A test whose assertion got looser without a note is weakened.
- **Two sides, one question**: does the change re-derive something another function already answers
  (the repo's most-caught defect class)? Name both sites.
- **Text-pinned facts**: a test asserting copy where it means to assert a fact.
- **Comments**: do new comments record WHY (owner rulings, constraints) rather than what; were
  moved comments preserved verbatim (the CLAUDE.md rule)?
- **Measurement debt**: a balance change without a bench arm and a predicted-vs-measured spec is a
  finding (invariant 4), however green the tests.
- **Commit hygiene**: pathspec commits, one concern per commit, messages that tell the truth about
  their own diff (`git show --stat` per commit for surprises).

## The verdict

One report: a table – law · verdict (✅/⚠/❌) · evidence (file:line or command output line) – then
findings ordered by severity, each with a one-line recommendation, then the explicit sentence
«ничего из перечисленного не исправлено – решения за владельцем». If everything holds, say so
plainly; a clean bill is a real result, not a failure to find.

## Never

Auto-fix · re-freeze anything · run `npm run check` on a machine where agents are working · tick a
PR checkbox (that is `/pull-request`'s job) · treat a wrapper's "exit code 0" as a verdict.
