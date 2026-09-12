---
name: fix-round
description: Intake and process a round of owner/playtest fixes – a numbered (or bulleted) list of complaints, bugs, questions and wishes from someone who has been using the product. Builds a committed ledger file, triages each item into build/answer/measure/ask, groups the buildable ones into non-colliding agent bundles, dispatches agents, gates once, and reports back item by item in the owner's own numbering – including an explicit reason for anything not done. Use this whenever someone hands over a list of observations about a running product ("вот раунд правок", "вот ещё список", "here's what I found playing", a pasted list of 5-30 mixed complaints), even when they don't call it a round. Also use when they ask why an earlier item never landed, or ask for an audit of previous rounds.
---

# Fix rounds: nothing gets lost, and nothing is reported done that is not done

⚠ **Registered into the project 12.09.2026 (round 41)** – this skill lived only in
`~/.claude/skills/fix-round/` and sessions kept concluding «нет такого скилла». This copy is the
project's own; if the two ever diverge, this one wins for ties-break. House-specific rules are at
the foot, under **House notes** – the body above them is the skill as written.

A round is a list from someone who has actually been using the thing – so the items are mixed
(a crash next to a wording nit next to a design question), unevenly specified, and written fast.
Two failure modes destroy trust, and this skill exists for exactly them:

* **Silent drops.** Questions and half-thoughts inside a round never become tasks, so they vanish.
  The owner then has to remember them himself, which is the job he delegated.
* **False "done".** A fix is reported shipped, and on the owner's screen nothing changed – aimed at
  the wrong surface, the wrong element, or verified only by "the agent said so". One of these costs
  more trust than five honest "not done, here is why".

Both are prevented the same way: a written ledger the owner can read, and evidence per item that
lives on **his** surface, not in an agent's summary.

## Step 1 – Capture before anything else

Write the ledger file first, before triage, before any code is read. It goes in the repo (e.g.
`docs/rounds/round-<N>.md`) so a later round can audit it.

**Keep his numbering and his words.** Renumbering is how items get lost, and a paraphrase is how the
intent gets lost. Quote the original line – in the original language – then add your reading of it
underneath. When his item is one sentence containing three separate asks, split it as `7a/7b/7c`,
never into new numbers.

```markdown
# Round <N> – <what he was doing>, <M> items (<date>)

Status: `[x]` shipped on the branch · `[~]` answered, nothing to build · `[>]` in flight, agent named
· `[ ]` open · `[?]` waiting on the owner's answer · `[!]` REOPENED (was reported done, was not)

- [ ] **1. <his line, quoted>** – <your reading: what is actually wrong, or what is being asked>
```

Then **commit it**. Agents get briefed off files; a ledger that exists only in your working tree is
a ledger the agent reports as missing.

## Step 2 – Classify each item, because a round is never all builds

Give every item exactly one of these, and write it into the ledger:

| Class | What it is | What "done" means |
| --- | --- | --- |
| **build** | something to change in the product | code + evidence on the owner's surface |
| **answer** | a question about how it works, or a "is this normal?" | a reply with numbers, and a note in the ledger |
| **measure** | needs data before anyone can decide | a bench/probe run and its result |
| **ask** | you cannot proceed without his decision | the question, sharpened to a choice |
| **already-works** | reproduce first, it turns out fine | the reproduction, so he can trust the "no" |

The classes that get dropped in practice are **answer** and **ask** – they look like conversation,
not work. They are work. An unasked question is worse than a wrong build, because the wrong build
at least surfaces.

**Sharpen every `ask` into a choice.** "How should this work?" costs him a design session; "A: the
popup blocks the week / B: it is a feed line he can ignore – A is closer to what you described"
costs him one word. Ask at most 2-3 per round, batched, so he answers in one pass.

## Step 3 – Group by collision surface, not by theme

Agents are cheap; merge conflicts and double-edits are not. Bundle items so that **no two bundles
touch the same file**, then name each bundle for the surface it owns.

A theme-shaped grouping ("all the UI ones") routinely puts three agents in the same component. A
surface-shaped grouping ("the coach picker + its plate on home", "the season feed", "the engine's
school clock") does not. When two items genuinely share one file, they belong to one bundle even if
they have nothing else in common.

Also fold in items the round did not raise but that live in the same file – the marginal cost is
near zero once an agent is already there, and it keeps the ledger's older `[ ]` lines shrinking.

## Step 4 – Brief with the item numbers and the evidence you expect

Every agent brief carries: the ledger path (committed), **the item numbers it owns**, the verbatim
owner quote for each, the project's invariants (read `CLAUDE.md`/`AGENTS.md`), and – the part that
is usually missing – **what evidence it must produce per item**.

Say what evidence looks like, per item, up front. "Fixed the alignment" is not evidence. "The text
block starts at Xpx, measured in a mounted test that fails when the rule is reverted" is. If you
cannot name the evidence before the work starts, the item is under-specified – go back to Step 2 and
consider whether it is really an `ask`.

Tell agents to append their result to their own ledger lines rather than rewriting the file, and to
report per item number. Never let one agent rewrite ledger lines it does not own.

## Step 5 – Verify on the owner's surface

The owner reports from a running build, so the fix must be true in a running build.

* **UI**: a mounted-component test, or a measured number (px, contrast, count) that moves when the
  change is reverted. Mutate the thing you claim to cover and watch the check go red before you
  believe it. A source-text grep proves the line exists, not that the screen changed.
* **Engine/data**: a value read out of the actual state (a save, a career run), not the constant.
* **Copy**: read the string as rendered, with the real data interpolated.

**When he re-reports an item, it is REOPENED, not new.** Mark it `[!]`, and record what the first
fix aimed at and why that missed – "aimed at the mask's opaque stop (34%), but the fade runs to 96%".
That line is what stops the third attempt from missing the same way, and it makes a repeated failure
visible instead of looking like a fresh request.

## Step 6 – Gate once, on a quiet machine

Wait until **every** agent has finished before gating. A gate run under agent load produces timeouts
that read exactly like failures, and chasing them costs more than the wait.

Read the exit code **from the gate command itself**, redirected to a file – never through a pipe
(`cmd | tail` reports tail's status, so a run with real errors "passes"). Then merge the agents'
work, gate the combined branch once more, and push to the branch the project's rules name. If the
project says the owner merges, the owner merges – open nothing, push nothing to the default branch.

## Step 7 – Report item by item, in his numbering

Report in the language he wrote in. One line per item, his number first, in his order – he reads it
as a checklist against his own list, and any item you silently reorder or omit reads as dropped.

For each: what changed and the evidence, or the answer with its numbers, or **why not** – "blocked
on your answer about X", "reproduced and it is correct, here is the reproduction", "needs a schema
bump, that is its own wave". A round where 6 of 11 shipped, 3 are answered and 2 are questions back
is a good round. A round reported as 11/11 where two did not land on his screen is a bad one.

Then update the ledger to match the report exactly, and commit it. The ledger and the report must
never disagree – the ledger is what the next round audits.

## Auditing earlier rounds

When asked what previous rounds missed, read the ledger files and treat every `[ ]`, `[>]` and `[?]`
older than the current round as a finding. For rounds that predate any ledger, reconstruct from the
transcript or the round's triage doc, and write the ledger retroactively – then verify a sample of
the `[x]` lines against the current build, because the marks were never independently checked. Report
by round, oldest first, with an explicit "still open / silently dropped / shipped then regressed"
for each, and let the owner say which ones come back.

## House notes (ties-break)

* **Ledger**: `docs/rounds/round-<N>.md`, next N counted from the FILES in `docs/rounds/`, not from
  the README table – the table has lagged its own folder five recorded times. At round close, update
  the README's row per its own six steps.
* **Branch**: `round/<N>`, one PR per round (precedent: `round/40` → PR #130); side work in a
  worktree `../tb-*`; the owner merges, always.
* **The gate** is the house chain, exit codes FROM FILES with mtimes newer than the run
  (CLAUDE.md's pipe/wrapper/stale-log laws): `npm run check`, `npm run test:sim`
  (unconditionally), `npm run test:e2e` (the push condition), the frozen-capture verdict – then
  `/house-review` on the diff, then `/pull-request` for the body and compare URL.
* **Invariant 4 inside rounds**: an item that asks for wording licenses exactly that wording;
  every new player-facing line lands in the ledger verbatim as DRAFT, and the owner's playtest is
  the final read (his 10.09 delegation).
* **Schema coordination**: before promising any item that persists new state, check which
  `SAVE_SCHEMA_VERSION` the active wave branch has claimed – two branches must never both take the
  same number. An item that needs a migration while a wave holds the next version waits for the
  wave to land and takes the number after it.
