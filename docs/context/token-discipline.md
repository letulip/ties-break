---
type: reference
status: current
area: process
last-reviewed: 2026-09-29
---

# Token discipline – the owner's 29.09 law, binding on every dispatch

The principles wave overran its token budget massively and the owner ruled: «давай на уровне
проекта где-то сделаем жесткие ограничения». This file IS those limits. It binds the architect,
the builder session, and every subagent either of them spawns. A wave plan that dispatches agents
without §1's table, or a brief that omits §2's block, is out of law – fix the plan, not the habit.

His measured numbers are kept in place: they are what made the rule, and they keep it legible.

## §1 · Dispatch – the architect's duties, per wave plan

1. **The model and the effort are chosen consciously, per step, in the plan.** Every wave plan
   carries a dispatch table: step · session/agent model (sonnet by default; opus ONLY where a wrong
   judgment is expensive – ambiguous design seams, RNG-law adjacency; haiku for mechanical sweeps)
   · effort · a move budget. No step runs on an unchosen default. ⚠ **The budget is a STOP
   condition in the brief, not a wish** (measured 29.09: a ~40-move task ran to 112 uses and 372k
   tokens before the architect killed it): on reaching it the agent commits what is green, reports
   what is left, and stops – the remainder is a fresh thin agent's task.
2. **Code and development agents run SEQUENTIALLY – step by step, never in parallel** (the
   owner, 29.09, «на всякий случай еще один пункт»). Parallelism in one checkout has already
   produced false gate verdicts, swallowed commits and contention timeouts (CLAUDE.md's own
   gotchas); it is also how budgets multiply unseen. One step lands, its report is read, the next
   step starts. Parallel is allowed only for READ-ONLY fan-out (search/report agents that change
   nothing).
3. **One agent – one task with a defined output.** Three independent edits are THREE agents of
   ~60 moves (~$3 each), never one agent of 200 (~$30). If the brief lists deliverables joined by
   «and also», split it.
4. **The brief is a self-contained excerpt, never a link.** Quote the ≤20 lines of spec the step
   needs; name files WITH line ranges (`sed -n '87,102p' CLAUDE.md`, not `Read CLAUDE.md`). A 7k
   brief that saves the agent a 9k document read pays for itself on the first turn.
5. **Heavy gates never run inside a fat agent.** The agent edits, runs its own targeted tests,
   commits, reports, dies. `npm run check` / `test:sim` / `test:e2e` run in the parent session
   (whose cache is warm for an hour) or in a fresh THIN gate-agent – a re-read at 80k costs $0.50
   where the fat agent's rewrite costs $3.30. If a gate must run inside an agent anyway: background
   it and poll with short moves – five polls at $0.25 beat one $3.28 rewrite, and the cache stays
   warm.
6. **Keep agents thin.** A rewrite at 100k is $0.63; at 700k it is $4.38. Thickness bills twice –
   every move and every rewrite.
7. **Never SendMessage into a fat agent.** An inserted message invalidates the cache from the
   insertion point: one measured follow-up into a 598k agent cost a $3.74 rewrite – fifteen normal
   moves. A follow-up is a NEW thin agent with a fresh excerpt.
8. **Kill the agent the moment its report lands.** Nothing stays alive «на случай вопросов».

## §2 · Inside the agent – the block every brief carries verbatim

> - **Batch probes**: `cmd1 && cmd2 && cmd3` in one call, never three calls. (Gate verdicts still
>   come from a FILE with `echo X_EXIT=$?` – batching is for cheap reads, not for gates.)
> - **Read once**: collect everything about a file in one pass – one `sed -n` over the ranges you
>   need, one `grep -n` carrying all patterns. Returning to the same file five times is five
>   rewrites of your own context.
> - **No exploration «на всякий случай»**: your brief names the files you touch. Going wider needs
>   a reason, and the reason goes in your report.
> - **Trim output at the source**: `2>&1 | tail -40`, `--reporter=dot`, `--silent`,
>   `npm run test:quiet`. 510 tokens of test noise × 173 calls was 88k of context – a third of a
>   fat agent – spent on dots and headers.

## §3 · Session hygiene – architect and owner alike

1. **Work in blocks**: one visit per topic, closed at the end – not the same fat session poked
   every three hours.
2. **Before a pause**: finish the block, or `/clear` after writing a handoff note to a file. The
   note costs one Read on return (a couple of thousand tokens); a re-warm of a long history costs
   the whole history.
3. **Small questions go to a fresh session.** «Как там ветка?» asked in a 900k session costs $9.45
   (re-warm + the move); in a new session it costs cents.

## §4 · The wave boundary is physical

Closing a wave, the closing session writes `docs/handoff/<wave>.md`: what shipped, what stayed
open, which files were touched, the gate verdicts with their log paths. The NEXT wave starts in a
FRESH session whose first read is that file – never a continuation of the old session's history.
The template and the rule live in [docs/handoff/README.md](../handoff/README.md).

## §5 · Mechanical guards in place

- `.claude/settings.json` (tracked, so worktrees inherit it) denies reads of `node_modules`,
  `dist`, `dev-dist`, `coverage`, `package-lock.json`.
- The same deny is MIRRORED in `~/Projects/Claude/.claude/settings.json` (29.09), because sessions
  started from the parent directory never saw the project's rules – the owner caught this himself.
- `npm run test:quiet` exists precisely for §2's fourth rule: same signal, ~6k fewer tokens a run.
- CLAUDE.md carries a two-line pointer here; the text lives in this file only, inside the 22k
  budget's spirit – one home per fact.
