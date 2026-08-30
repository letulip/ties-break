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

2a. **⚠⚠ AND THE LOG MUST BE NEWER THAN THE COMMAND** (29.08, caught in this repo's own final gate).
   Reading the exit code from a file instead of a pipe or a notification is rule one and two; rule
   three is that the file you read is **today's**. macOS is case-insensitive, so `/tmp/W29-cap.log`
   and `/tmp/w29-cap.log` are ONE file – a previous wave's green `CAP_EXIT=0` sat there looking
   perfect and nineteen hours old. Two of four verdicts were stale and would have been reported as a
   gate that never ran.

       START=$(date +%s)
       # ... run the gate ...
       [ "$(stat -f %m /tmp/gate.log)" -gt "$START" ] || echo "STALE – this log predates the run"

   ⭐ Check the mtime, or use a prefix unique to the run. A stale green is worse than a red: red stops
   you, stale ships.

2b. **⚠ `npm run test:e2e`, ALWAYS, the same way** (owner, 29.08: «добавить в skill pull-request и
   гонять на локале как условие отправки кода на сервер»). Measured that day: **30 tests, 22 seconds,
   the whole suite** – cheaper than a single unit shard. At that price "smoke only" stopped being an
   economy and became a blind spot we were paying for in hand-caught defects.

       npm run test:e2e > /tmp/pr-e2e.log 2>&1; echo "E2E_EXIT=$?" >> /tmp/pr-e2e.log

   ⭐ **This is a CONDITION OF PUSHING, not a nicety** – his words are «условие отправки кода на
   сервер». A branch whose e2e is red does not go up, and the sentence «ветка готова» may not follow
   a run that was skipped. ⚠ The PR gate on CI stays smoke-only by the repo's own recorded cost
   lesson – this runs LOCALLY, which is where the 22 seconds are.

   ⚠ Read the exit code from the FILE. This suite finishes fast enough that a wrapper's "exit code 0"
   arrives before the run does – that notification lied four times in one session.

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

4c. **⚠⚠ WHAT THE ROUND DID NOT DO – the unfinished-items block** (owner, round 29 #18: «добавить в
   скилл pull-request проверку несделанных пунктов из раунда»). He asked for this because items go
   quiet: the round-29 audit found round 8 #1 open for 34 days, kit wear on holiday asked FOUR times
   with no code, and a `[x]` sample where 1 of 10 was false. **My memory is not the instrument. The
   PR is.**

   Read the wave's ledger (`docs/rounds/round-<N>.md`) and put EVERY item that is not `[x]` or `[~]`
   into the body under **What the round did not do**, one line each, with its status mark and a
   half-sentence reason. `[?]` items are listed as questions HE still owes an answer to, and `[ ]`
   items say what blocks them.

   ⚠ **This block is never omitted for being long, and never softened.** A wave that closed 8 of 20
   says so in the PR; the owner decides whether that is enough, and he cannot decide it from a body
   that only lists wins. ⭐ **If the ledger and the PR disagree, the PR is wrong** – the ledger was
   written from the work and the body is written from the ledger, never the other way round.

   ⚠ Also carry forward anything the wave REVIVED from an older round, naming the round it came from,
   so the older debt is visibly shrinking rather than silently re-filed.

4d. **The build line** (owner, round 29 #19: «может быть стоит какую-то версию добавить в настройках
   внизу строчкой? И в pull-request скилле обновлять при деплое?»). He cannot tell which build he is
   playing, and it has already cost a wrong diagnosis – I asserted his save predated a merged wave and
   was wrong by a whole schema version.

   Before the body is written, confirm the version line the app renders is the one this PR ships:
   the short commit SHA and the date, not a semver. ⭐ **A semver says what we intended; a SHA says
   what he is holding**, and the second is the question every defect report needs answered.

   ⚠ **CONFIRM IT, DO NOT ASSERT IT – and it is two commands, no browser needed** (round 29 #19
   shipped the reader so this step could not be decorative). `scripts/build-stamp.mjs` is the single
   source the build bakes from; `vite build` substitutes it into the bundle as a string literal, so
   the built file can be grepped for the value the script names:

   ```bash
   node scripts/build-stamp.mjs                    # -> "<sha> <date>", what a build made NOW bakes
   grep -l "$(node scripts/build-stamp.mjs | cut -d' ' -f1)" dist/assets/*.js
   ```

   The second command must name a file. If it names none, `dist/` predates the branch head – rebuild
   (`npx vite build`) and run it again rather than reporting the first command's answer, which is a
   statement about git and not about the bundle.

   ⚠ **AND THE SHA IT PRINTS IS THE BRANCH HEAD, NOT THE COMMIT THE OWNER WILL DEPLOY.** A merge
   makes a new commit, so the line his phone shows after the merge names *that* one. What this step
   proves is the mechanism – the app renders the commit its bundle was built from – not a value to
   copy into the body. Do not paste a SHA into the PR as "the version he will see".

   ⚠ If the line reads `unknown`, the build could not reach git (a shallow container, no history).
   That is the designed fallback, not a defect, and it is `tests/component/round29-build-line.test.ts`
   and `…-fallback.test.ts` that hold both paths.

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
