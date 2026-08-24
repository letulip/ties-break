---
name: review-intake
description: Receive an external review (a codex/* branch or a pasted document), verify its claims against the code, deliver verdicts (take / modify / refuse / superseded) with reasons, fold adopted content into the house docs, build the launch plan with executors, and hold at the owner's approval gate before any work starts. Use when the owner says "разбери ревью", "посмотри ветку codex/...", "что берем, что нет".
---

# /review-intake – an outside review, received the house way

Built from the two intakes of 23.08 (the backlog perspective, the full-project round two). The
deliverable is VERDICTS AND A PLAN – nothing launches before the owner's approve.

1. **Locate and baseline.** Find the branch (`git branch -a` – codex works locally; the ref may not
   be on origin). Read its BASELINE commit from the doc's own frontmatter and place it against
   current main: everything the review "proposes" may already be built, measured or refuted by
   later waves – the inventory ages, the lens usually does not. Say which is which.
2. **Extract, never merge.** A stale-based branch carries old copies of shared files; merging it
   wholesale regresses them. `git show <branch>:<path> > <path>` for the review's OWN new documents
   only, onto a fresh wave branch off main.
3. ⚠ **Verify named defects in code BEFORE verdicts.** Every "live defect" claim gets a grep/read
   in the current tree; the response records CONFIRMED / stale / could-not-verify per claim. A
   verdict on an unverified claim says so explicitly.
4. **Verdicts, item by item**: TAKE (with what lands where) / MODIFY (what changes and why) /
   REFUSE (the house rule or measurement it violates, cited) / SUPERSEDED (what later work covers
   it). Check refusals against the owner's standing rulings, not taste – freedom over protective
   locks, honest numbers over hidden ones, «мы ни за что не наказываем».
5. **The response document** – `docs/review-codex/NN-…-response.md`, next number in the series:
   verification results, the verdict table, the plan-by-waves with EXECUTORS and sizes, the stop/go
   gates adopted or amended.
6. **Propagate the adopted lens** the same day: principles into the backlog README or CLAUDE.md,
   Rejected-state rows for what the review killed, new backlog rows (states per the five-state
   rule; nothing gets Now – the owner assigns it), a dated `decisions.md` entry.
7. ⚠ **THE APPROVAL GATE.** Present the plan; the sentence «запускаю» may only follow the owner's
   approve. Launch then follows the house's normal wave discipline (collision surfaces, gates,
   `pull-request` at the end).
8. **Branch afterlife**: once the extracted docs merge, the review branch becomes
   content-contained – verify with `git cherry origin/main <branch>` (patch-level, survives
   rebases) and only then clean it; `-d`'s refusal is measured against HEAD, so an ancestor check
   against origin/main is the real gate.
