---
type: plan
status: current
area: quality-rig
last-reviewed: 2026-09-24
---

# The quality rig for the builder – the parity convention, and the screen that stays awake

Two items off the standing Next list (`docs/now-next-later.md`), both already diagnosed in
writing and neither waiting on a ruling: the-quality-rig row 13 (the engine/UI parity class) and
round-16 #20 (the screen sleeps during a match). Branch: `rig/parity-wake`, cut from `main` after
PR #157. One branch, pathspec commits, never amend, gates from files with fresh mtime, sims and
e2e locally before the PR – CLAUDE.md binds all of it.

⚠ ZERO new RNG, ZERO engine behaviour changes, and – rare for a wave – ZERO player-facing strings
expected: every task below is a guard, a convention or a shell behaviour. If a task seems to need
a string or an engine edit, stop and write the question down (the round-29 #3 masseur repair
already ran in the engine's direction; nothing here re-opens it).

## T1 – the parity convention, NAMED

The three round-29 defects shared one shape – **the screen held a predicate the engine does not**
– and the instrument that guards the shape already exists: round-28 #8's paired mount test
(read its ledger entry in `docs/rounds/round-28.md` and the test it names) asserts two surfaces
printing the SAME value from ONE source, with the mutation table proving the sharing: break the
source → both red; break the sharing → the parity test alone goes red.

1. Write the convention as a short canonical spec, `docs/specs/engine-ui-parity-2026-09.md`
   (with `## Current truth`): when a screen RESTATES an engine verdict – a refusal, a price, an
   openness, a count – the restatement is either the engine's own exported primitive (round-14's
   «literally the same function» idiom, the strongest form) or it carries a paired mount test in
   `tests/component/` asserting both surfaces from one posed snapshot, mutation table included.
   Name both forms; say when each applies; quote the three round-29 instances as the class's own
   evidence. ⚠ Playwright is the wrong tool for the class and the spec says why (the row's own
   sentence: it catches a symptom you already knew to assert).
2. The quality-rig row 13 gets its dated «named, applied» note pointing at the spec.
3. ⚠ The CLAUDE.md gotcha line is the ARCHITECT's to add after merge (the 22k budget is his to
   spend) – note it in the report, do not edit CLAUDE.md.

## T2 – the three known sites get their nets

Each site's DEFECT is fixed; what none has is the guard that stops the shape returning. One
paired test per site, `tests/component/parity-*.test.ts`, each with BOTH mutation arms run RED
before green is believed (name the arms in the report):

1. **The feed filter vs the ladder** (round-29 #3's calendar half): `composables/tierState.ts`'s
   openness against the engine's own ladder answer, on a posed snapshot where they could disagree
   – a junior/domestic row the ladder calls open must not be filtered, and the arm that re-adds
   the screen-side filter goes red.
2. **The plaque's national line** (round-29 #12): the plaque prints the ENGINE's number, never a
   re-derivation – posed at a rank where the old re-derivation and the engine disagreed («65 more
   national pts» for a world #110 was the shipped lie).
3. **The masseur's week** (round-29 #3's masseur half): `composables/weekDays.ts` draws his days
   exactly where `masseurWorksThisWeek` says he works – posed on a SHOOT week, where the deleted
   `&& !shooting` used to bill him and draw nothing; the arm that re-adds the fourth term goes
   red on the drawing while `resolveMasseur`'s bill stays green, which is the pair the class is
   about.

⚠ Pose through the component helpers' own idioms (`componentLogic` for positive claims,
`componentFile` for negative ones – `tests/pin-hygiene.test.ts` enforces the split mechanically).

## T3 – round-16 #20: the screen stays awake during a match

«Keep the screen awake during a match» – GENUINELY OPEN, verified again 24.09: no `wakeLock`
reference exists under `src/`.

1. A small shell composable (`src/composables/screenWake.ts`): request
   `navigator.wakeLock.request('screen')` while a match is LIVE on screen (the MatchViewer /
   replay surface – find the one live-match predicate the shell already holds and ride it, never
   a second spelling), release on end, on unmount and on `visibilitychange` re-acquire per the
   API's own contract. Feature-detected: no capability, no call, no error surfaced – silence is
   the fallback (round-16 #20 asks for behaviour, not UI).
2. ⚠ ZERO engine involvement and zero strings: no toggle, no setting, no feed row. If a case
   seems to want one, it is a question for the owner, not a draft.
3. Tests: a component test with a mocked `navigator.wakeLock` – acquired on the live match,
   released on close, re-acquired on visibility return, and NOT requested where the API is
   absent; the mutation arm (drop the release) goes red.
4. e2e: one cheap case if the mock can ride the existing match journey without a new fixture;
   if it cannot, say so in the report rather than building a rig for it.

## The gates

After all tasks: `npm run check`, `npm run test:sim`, `npm run test:e2e` – locally, one at a
time, exit codes appended inside the command and read from the FILE with fresh mtime, machine
quiet first. The frozen capture (41550 / `e6b0c709`) must not move – nothing here touches a
draw. ⚠ The shared checkout may carry ANOTHER live session's untracked files in `tools/`
(`_devlog_*`, `playwright.devlog.config.ts`); two check steps read the directory and fail on
them – gate in a clean worktree, commit none of them, delete none of them. The PR is assembled
by the pull-request skill, boxes earned in order; the report lists every mutation arm with both
outputs and the questions last.
