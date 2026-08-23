---
type: plan
status: draft
area: tooling
canonical: false
last-reviewed: 2026-08-22
---

## ⭐ RE-CUT 23.08 – THE SKILL SHIPPED, THE ACTION IS THE OPTIONAL UPGRADE

The owner: «может быть нам лучше тогда скилл на это собрать, и тогда мы сможем его по требованию
использовать когда нужно?» – ruled and DONE the same day: `.claude/skills/house-review/SKILL.md`
reviews any branch/PR/range against the repo's own law (two passes: the mechanical checks by
command, the judgment law by reading the diff), verdict-only, never auto-fixing, zero cloud cost.

What REMAINS in this backlog entry is only the optional upgrade this file argued for: the GitHub
Action wrapper whose one added property is «nobody forgot to run it» (the sim workflow's
reader-loop lesson). Blocked, as before, on the owner's two decisions: the `ANTHROPIC_API_KEY`
repo secret (billing) and advisory-vs-blocking. Size shrinks M → S (the skill IS the prompt; the
Action wraps it).


# The git reviewer – an assistant that reads every change (owner, 23.08.2026)

His ask, verbatim:

> «добавить в беклог задачу интеграции какого-то ассистента в гит, который будет ревьюить каждый
> коммит и давать заключение и рекомендации по организации кода, соблюдению наших принципов и
> прочего»

## 1. The shape that fits THIS repo: a PR-level reviewer, not a per-commit one

He said «каждый коммит», and the recommendation here is deliberately different: **review every PULL
REQUEST, not every commit** – kept as an open option for him, not silently overridden.

The reason is this repo's own workflow. A wave is ONE branch and routinely 20–40 commits
(`wave/round25` alone was ~25), many of which are intermediate: a bench before its retune, a
re-freeze, a spec landing beside its code. A reviewer that files a verdict on each of those
produces 25 verdicts per wave, most of them about states that no longer exist by merge time – noise
at exactly the volume that teaches a reader to ignore the tool, which is the failure
`.github/workflows/simulation.yml`'s header records («a red X that was the timeout, not the
tennis»). The PR is the unit the owner already reads and merges (`CLAUDE.md` – branch → PR → the
owner merges), so the PR is where a verdict has a reader.

*The per-commit variant stays possible* (the same Action triggers on push), and would only make
sense if he wants a running commentary during a wave rather than a verdict at its end. His call.

## 2. The candidate: `anthropics/claude-code-action` on the PR

The official GitHub Action runs Claude Code inside the workflow with the repo checked out. The job
this repo would give it: **review the PR against the repo's own law**, with a tailored prompt that
tells it to READ the law rather than restating it (a restated rule is a fork that rots – the same
principle as this backlog):

- `CLAUDE.md` – the four non-negotiable invariants (engine never imports the UI; RNG discipline and
  input-independence; the three-part save-schema move; tuning is measured, not guessed), the style
  rules (cents, the short dash, fictional names), and the gotchas;
- `scripts/engine-purity.mjs` territory – flag any import that the purity gate would catch, plus
  the softer violations no script sees (UI-shaped reasoning inside `src/engine`);
- the PR checklist in `.github/` (the seven earned boxes, round 25) – say which boxes the diff
  actually earns;
- `docs/decisions.md` and the specs the diff touches – flag a moved constant whose comment records
  an owner ruling.

Output: **one comment on the PR** – verdict, findings by file, and the recommendations he asked
for («по организации кода, соблюдению наших принципов»).

## 3. What he must decide before it can ship

| decision | the honest statement |
| --- | --- |
| **`ANTHROPIC_API_KEY` repo secret** | The Action bills API tokens per review on his key. This is a real running cost, named here on purpose, and only he can accept it. |
| **Advises or blocks** | Recommend: **advises** – a comment, never a required check, until trust is earned. A blocking gate that misfires gets switched off within a week (the repo has measured this pattern twice: the sim gate, the size budgets in `../../scripts/context-audit.mjs`). Promotion to required-check is a later, separate ruling. |
| **Scope** | Changed files only (cheap, focused) vs whole-repo context (better verdicts on cross-cutting rules, more tokens). Recommend: the diff plus the files the prompt names in §2. |

## 4. The zero-cloud-cost alternative, and what the Action actually adds

The `/code-review` and `/pull-request` skills already run in his sessions and already do this
review locally, for free. What they cannot provide is the property the Action buys: **nobody has to
remember to run it.** That is precisely the lesson the sim workflow just taught – rot sat unread
for 8 days in August because *"the weekly run's reader loop is nobody"*, and the fix was a
machine that files the Issue by itself (`.github/workflows/simulation.yml`, the standing regime's
part 2). A review that depends on somebody invoking it is a reader loop of nobody; the Action makes
the loop structural.

## 5. Size and blockers

**Size: M** (a workflow file, the prompt, one trial wave to calibrate noise).
**Blocked by:** his ruling on the secret (billing) and on advisory-vs-blocking. Nothing technical
blocks it.
