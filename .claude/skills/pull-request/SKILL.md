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
   - **`npm run test:sim`, ALWAYS, the same way** (owner, 22.08: critical functionality runs
     locally and regularly). ⚠ Not only when the diff "looks like" a model change – the August
     drift was caused by commits that did not look like one (a season table, a rival skill), which
     is exactly the heuristic that failed. ~5.5 min locally; the sims never run on the PR itself
     (CLAUDE.md's standing regime), so the PR body carries the local verdict, with the numbers
     whenever a corridor moved.

3. **The diff, read before described.** `git log --oneline main..HEAD` and
   `git diff --stat main...HEAD`. The What-section is written from what actually changed, not from
   memory: two sentences, the owner's numbering where the wave answered his items.

4. **The checklist, EARNED box by box – the check runs, then the box is ticked, in that order.**
   The owner's own words: «идут проверки и мы галочки проставляем». Every box in the template maps
   to a command or a fact from THIS session; run it, then write `[x]`:
   - *Prior discussion* – the Issue number, or the owner's ruling/session named in What (their real
     workflow: rulings happen in working sessions, not Issues). Never invent either.
   - *Tests added or updated, npm test green* – green from step 2's log; "added or updated" checked
     against the diff (a `src/**` change with zero `tests/**` changes gets a stated reason in What,
     not a silent tick).
   - *Engine purity* – step 2's `engine purity: ok` line, quoted mentally, ticked.
   - *npm run check green* – step 2's `CHECK_EXIT=0` from the FILE.
   - *Frozen capture* – run `npx vitest run tests/condition.test.ts`; unmoved → tick; moved → the
     re-pin story goes in What and the box is ticked only with it written.
   - *Save schema* – `git diff main...HEAD -- src/engine/migrations.ts src/engine/world.ts` tells
     the truth: untouched → tick; moved → the 4 parts named in What, then tick.
   - *Sim* – step 2 ran it unconditionally; `TESTSIM_EXIT=0` from the file → tick, numbers into
     What when a corridor moved.
   A box whose command did not run in this session stays `[ ]`, with one line in What saying why –
   the checklist CI job will hold the merge, which is exactly its job.

4b. **⚠ THE WAVE-CLOSE DOC STEP** (R2-04, 23.08 – the ownership the second review asked for). Before
   the body is written, close the wave's own record: if the wave shipped player-visible work it owes
   a line in its round ledger (`docs/rounds/`) or a dated entry in `docs/decisions.md` when the owner
   ruled something; if it moved a volatile fact, `node scripts/doc-facts.mjs` already failed the gate
   and told you which. The rule the review earned: **repair without ownership rots in days** – so a
   wave that changes what is true also changes what the docs say it is, in the same PR.

5. **The body.** Fill `.github/pull_request_template.md` verbatim – What, then the checklist with
   every earned box ticked `[x]`. ⚠ For an EXISTING PR (a red `checklist` job on an open PR is the
   usual reason this skill is invoked) the deliverable is the same body as a REPLACEMENT – the
   owner pastes it over the description and the job re-runs on the edit. Append, when they exist: the sim numbers (step 2), the schema
   move (version, migration, fixture), the frozen-capture verdict (41550 / e6b0c709 moved or not),
   and re-aimed guard tests with their ⚠ reasons. Short dash `–` only; no Cyrillic in anything a
   public PR renders except the owner's own quoted rulings.

6. **Hand-off.** Print the finished body in one fenced block, then BOTH links:
   - for a NEW PR, the pre-filled compare URL – GitHub accepts the body in the query string, so the
     boxes arrive ticked from the first render and the `checklist` job starts green:
     `https://github.com/letulip/ties-break/compare/main...<branch>?expand=1&body=<url-encoded body>`
     (URL-encode with `python3 -c "import urllib.parse,sys;print(urllib.parse.quote(sys.stdin.read()))"`;
     if the encoded body pushes the URL past ~8k characters, fall back to the bare compare link and
     the fenced block to paste);
   - for an EXISTING PR, the fenced block is the replacement description – the owner pastes it over
     the body and the `checklist` job re-runs on the edit.
   The owner opens, pastes if needed, merges.

## ⚠ THE STANDING RULE THIS SKILL EXISTS TO ENFORCE (23.08, learned the hard way)

**A pushed branch is NOT «ready to merge» until this skill has run and the body has been handed
over.** The day after the checklist job shipped, a branch went up with «мержится» and no assembled
body – the job sat red on every push, the boxes sat empty, and the owner rightly read it as «наши
проверки не сработали как было задумано». The failure was not the job and not the template: nothing
forced this skill to run. So the rule is on the ARCHITECT: the sentence «ветка готова, мержите»
may only follow a completed run of this skill, and the hand-off block is part of that sentence.

## What this skill never does

Tick an unproven box · open or merge the PR · push to main · run the sims on CI · trust a
notification's "exit code 0" over the log file.
