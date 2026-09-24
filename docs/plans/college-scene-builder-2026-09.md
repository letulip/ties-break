---
type: plan
status: current
area: college-scene
last-reviewed: 2026-09-23
---

# The college scene for the builder – step by step

The canonical spec is [the-college-scene-2026-09.md](../specs/the-college-scene-2026-09.md); read
it first, then the college branch's own laws where they stand
(`src/engine/collegeLeague.ts`'s file notes, `docs/plans/college-and-the-junior-ladder.md`).
Branch: `college/scene`, cut from `life/wave-12`'s head (dab016fd) – it STACKS on the open wave-12
PR, so after that merges this branch shows only its own delta. One branch, pathspec commits, never
amend, gates from files with fresh mtime, sims and e2e run locally before the PR – CLAUDE.md binds
all of it. His two rulings of 23.09 are in the spec's opening and `docs/decisions.md`; ⚠ T4 is the
wave's only schema move and is cleanly strikeable at dispatch – if the message strikes it, T5's
row 4 and the booth line go with it and nothing else moves.

Every player-facing string is a DRAFT for his pass (invariant 4): write each once, list all of
them verbatim in the report, land them in the wave's strings table (T6). Questions that appear
DURING the build go to the end of your report, never guessed at.

The one law over everything: **zero new RNG streams, zero new simulation**. Every task is a pure
read of records the game already keeps, one clause on a door, or new words. If a task seems to
need a draw or a new match, stop and write the question down.

## T1 – the floor (his «ок», the parting §12 closed)

1. `world/endings.ts`, `dynastyHandoverOf`: the background line becomes the floored read – where
   the STANDING ending is the college one, the band reads no lower than `middle`; the ruling
   quoted at the clause. ⚠ The ending, never the biography: `world.ending` is what says so, and a
   college chapter inside a pro career must change nothing.
2. `tests/college-scene.test.ts` §A: a posed college ending with a thin account reads `middle`; a
   posed pro ending with the same account still reads `working` (the control); a wealthy college
   ending stays `wealthy` (a floor, not a ceiling). Mutation: strip the clause and watch the first
   case fail before believing green.
3. The dynasty spec (`the-dynasty-2026-09.md`) §8 row 3 gains its dated addendum: the middle band
   is reachable through the college door now, predicted and measured (spec §6 row 1).

## T2 – the bracket block on the year card

1. `CollegeYearCard.vue`: beside the existing `leagueFact` line, the championship's own block –
   one row per PLAYED round (Quarterfinal / Semifinal / Final via `stageLabel`, opponent's name,
   score), read from the kept rows `collegeLeagueMatchesOf` already answers for the run's week.
   The data path is the builder's first question to settle by READING: the card is fed from the
   snapshot, so find where the kept event rows already cross and reuse that road – NO new
   worker RPC and NO new persisted state; if nothing crosses today, a derived view field on the
   snapshot (the `divorcedWeeksAgo` idiom) is the honest shape.
2. A `null` run and a lost early round keep honest shapes: rounds she played, nothing invented.
3. `tests/component/college-scene-ui.test.ts`: the block renders a title run and an early exit
   (posed views); the phone law – the card with the block open fits 375x667 with the dismiss
   control inside the viewport, and the mutation arm (grow the block) reddens it before green is
   believed.

## T3 – the album book's college lines

`world/albumBook.ts`, the college chapter: per banked year with a `league` run, one line – the
title year's own wording and the exit year's (DRAFT x2 shapes, his pass; no date, no score
inflation, the fictional label `COLLEGE_LEAGUE.label` and never a real body's name). The fixed
seven-slot ending album is NOT touched. Tests: a posed career with one title year and one exit
year renders both lines; a leagueless year renders none.

## T4 – the handover learns the student cabinet (schema v89 – STRIKEABLE WHOLE)

1. `shared/protocol/profile.ts` + `world/endings.ts`: `motherCareer.collegeTitles` – the count of
   banked years where `wonTheLeague(run)`; `dynastyHandoverOf` folds it, `DynastyRecord` carries
   it, `plainDynasty` in `stores/game.ts` copies it (the field-by-field law).
2. `SAVE_SCHEMA_VERSION = 89`; append-only migration back-fills 0 (a save that predates the field
   never counted, and 0 is the honest count of what it recorded); golden
   `tests/fixtures/saves/v89.json` + README row; `npm run e2e:fixtures` regenerated.
3. The booth: a college-champion lineage line, licensed off `collegeTitles > 0`, in the
   KNOWN-claim register and never the pro-cabinet one (`proTitles`' own lesson – a student title
   is not a WTA title). One or two lines, DRAFT, in `viz/commentary.ts` beside the lineage pools.
4. Tests: the fold equals the banked count on a posed multi-year career; the migration back-fill;
   the booth line licenses on 1 and refuses on 0 (both arms posed).

## T5 – the measurements (spec §6)

A walked arm whose policy answers the fork `college` (the fork-answering machinery exists –
`answerFork` with the cheapest-place fallback is bench-reachable; wire the smallest honest walker,
`tools/college-scene-bench.ts` or an arm in an existing college tool). Rows 1–4 of §6 measured,
numbers written INTO the spec, deviations flagged. Row 5 is the capture suite, standalone. Exit
codes from files, machine quiet, AFTER the code tasks.

## T6 – strings and docs

`docs/plans/college-scene-strings-2026-09.md` in the standing table format, pinned both ways by
`tests/college-scene-strings-roundtrip.test.ts` (the wave-12 parser is the model – match the
status cell exactly, count in the test, no totals in prose). The report quotes every DRAFT beside
the shape it fills.

## The gates

After all tasks: `npm run check`, `npm run test:sim`, `npm run test:e2e` – locally, one at a time,
exit codes appended inside the command and read from the FILE with fresh mtime, machine quiet
(`pgrep -lf "vite-node|vitest"` empty first). The frozen capture must NOT move. The PR is
assembled by the pull-request skill, boxes earned in order. ⚠ If the wave-12 PR merges while
you build, `git merge origin/main` into this branch once and say so in the report – never rebase
the shared history.
