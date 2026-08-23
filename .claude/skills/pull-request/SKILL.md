---
name: pull-request
description: Assemble a pull request for the current wave branch to the full house spec - verify every checkbox with a real command before ticking it, build the PR body from the template, and hand back a paste-ready description plus the compare URL. Use when a wave is finished and the owner needs a PR ("собери реквест", "готовь PR", "открой пул-реквест").
---

# /pull-request – the PR assembled to spec, every box earned

The owner merges; this skill only PREPARES. It never pushes to main, never opens the PR itself
(no `gh` on this machine – the output is a paste-ready body and the compare URL), and never ticks
a box it has not proven with a command in this session.

## Steps, in order

1. **The branch.** `git branch --show-current` – refuse to proceed on `main`. Confirm the branch
   is pushed and current: `git status -sb` shows no ahead/behind surprises; push if behind.
   One branch per wave – if the work is scattered, STOP and collect it first (the owner's rule).

2. **The gates, from files, never through a pipe.**
   - `npm run check > /tmp/pr-gate.log 2>&1; echo "CHECK_EXIT=$?" >> /tmp/pr-gate.log` – then READ
     the file. A wrapper's or a pipe's exit code is a documented lie in this repo.
   - Engine purity is inside `check` (`scripts/engine-purity.mjs`) – its line in the log is the
     proof behind the framework-free checkbox.
   - **If the diff touches the match model, a bench tool, or anything under `src/engine/match/` or
     `season/`**: also `npm run test:sim` the same way, and carry its numbers into the PR body –
     the standing regime in CLAUDE.md says the sims never run on the PR itself, so the PR carries
     the local numbers instead.

3. **The diff, read before described.** `git log --oneline main..HEAD` and
   `git diff --stat main...HEAD`. The What-section is written from what actually changed, not from
   memory: two sentences, the owner's numbering where the wave answered his items.

4. **The checklist, verified box by box:**
   - *Linked Issue* – ask the owner for the Issue number if the change is beyond a small fix and
     none is known. Never invent one; an unticked box with a reason beats a false tick.
   - *Tests added or updated, npm test green* – green comes from step 2's log; "added or updated"
     is checked against the diff (a `src/**` change with zero `tests/**` changes gets a stated
     reason in the body, not a silent tick).
   - *No Vue/Pinia imports into engine* – step 2's purity line.
   - *npm run check green* – step 2's `CHECK_EXIT=0`, quoted.

5. **The body.** Fill `.github/pull_request_template.md` verbatim – What, then the checklist with
   every earned box ticked `[x]`. Append, when they exist: the sim numbers (step 2), the schema
   move (version, migration, fixture), the frozen-capture verdict (41550 / e6b0c709 moved or not),
   and re-aimed guard tests with their ⚠ reasons. Short dash `–` only; no Cyrillic in anything a
   public PR renders except the owner's own quoted rulings.

6. **Hand-off.** Print the finished body in one fenced block, then the compare URL:
   `https://github.com/letulip/ties-break/pull/new/<branch>`. The owner opens, pastes, merges.

## What this skill never does

Tick an unproven box · open or merge the PR · push to main · run the sims on CI · trust a
notification's "exit code 0" over the log file.
