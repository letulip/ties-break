---
type: plan
status: current
area: private-life
last-reviewed: 2026-09-23
---

# Wave 12 for the builder – the parting, step by step

The canonical spec is [the-parting-2026-09.md](../specs/the-parting-2026-09.md); read it first,
then the wedding's own spec ([the-wedding-2026-09.md](../specs/the-wedding-2026-09.md)) for the
latch machinery this wave completes. Branch: `life/wave-12`, cut from main after PR #154. One
branch, pathspec commits, never amend, gates from files with fresh mtime, sims and e2e run
locally before the PR – CLAUDE.md binds all of it. His rulings of 23.09 are in the spec §0 and
`docs/decisions.md`; nothing below is conditional except §T4.2, which the spec flags as the
architect's own proposal (build it unless the dispatch message strikes it).

Every player-facing string is a DRAFT for his pass (invariant 4): write each once, list all of
them verbatim in the report beside what they replaced, and land them in the wave's strings table
(T8). Questions that appear DURING the build go to the end of your report, never guessed at.

The one law over everything: **zero new RNG streams, zero moved draws**. Every task below is a
branch on `latchedWeek` (a pure read), new words, or a derived view. If a task seems to need a
draw, stop and write the question down.

## T1 – schema v88, all four parts in one range

1. `world/state.ts`: widen `SpiritShockKind` with `'divorce'`, the album milestone type union
   with `'divorce'` (where v83 put `'wedding'`), and `LifeBeatKind` with `'divorced'` – each with
   the ruling quoted at the widening site. Sweep `src/shared/protocol` for the mirrored unions
   (`narrative.ts` carries the life-beat kind; the snapshot carries the pending beat) – the
   protocol widens in the same commit.
2. `SAVE_SCHEMA_VERSION = 88`; append-only migration step – union widenings only, nothing to
   walk, and the step's comment says so with v85's widening quoted as the precedent.
3. Golden fixture `tests/fixtures/saves/v88.json` + its row in `tests/fixtures/saves/README.md`;
   the goldenSaves suite enforces one fixture per version. The per-key diff must move on
   `schemaVersion` alone – if anything else moved, stop.
4. Regenerate `e2e/fixtures` (`npm run e2e:fixtures`; wave 10's v86 move is the worked example).

## T2 – the engine split at `rollEnds`

1. `economy.ts`: the shock table row `divorce: { steady: -27, intense: -42 }` – DRAFT, flagged,
   his word replaces it – and update the table's reserved-seat comment. An `ECONOMY.divorce`
   block with four answer deltas whose drafted values mirror the ended deltas
   (`ECONOMY.bond.delta.ended*`), own names, each flagged as the builder's carry of the drafted
   shape.
2. `world/lifeBeat.ts`, `rollEnds`: the latched branch. Where the row has `latchedWeek != null` –
   `spiritShock = { week, kind: 'divorce' }`, the raised beat is `'divorced'`, the kept row is
   stamped `lifeKind: 'divorced'` with its own sentence owned by one function (cut
   `endedKeptRow`'s sibling or make the kind a parameter – ONE owner of the sentence either way,
   the re-cut precedent). The `'met'`-receipt gate stays SHARED and untouched.
3. The kind sweep – every table that names `'ended'` learns `'divorced'` beside it:
   `LIFE_BEAT_BLOCKING`, `LIFE_BEAT_OPTIONS` (the four DRAFT answers), `DRAIN_ANSWER` (the
   zero-bond answer, so walkers and benches pass the card unpriced), the heading/prompt copy,
   the wants overlay iff `'ended'` carries one, `avatarEmotion`, `LifeBeatDialog.vue`'s
   rendering, and the stores/worker passthrough if any lists kinds by name. Find every site with
   `git grep -n "'ended'" -- src` and judge each hit; wave 11's `'bereavement'` addition is the
   worked example of the same sweep.
4. `tests/wave12-parting.test.ts`:
   - a latched end writes `kind: 'divorce'` and raises `'divorced'` – posed world, ONE world per
     seed (the wave-11 loss fixture's own repair: never a world per searched week);
   - an unlatched end still writes `'breakup'` and raises `'ended'` – the split's other half;
   - the key-count net: the ends section derives the same keys on a walked pair before and after
     the wave (wave-4's net, re-aimed with a note);
   - the receipt pin: a latched row always holds the `'met'` receipt (walk one to the latch and
     assert), and an ended latched row never reaches the told-late path;
   - mutation: flip the branch condition and watch the first two cases fail before believing
     green.

## T3 – the album and the milestone

1. At the latched branch: `fireMilestone('divorce:<episodeId>', DRAFT line)` +
   `captureMilestone({ type: 'divorce', week, kind: episodeId })` – `landWedding`'s two-surface
   idiom, idempotent per episode id.
2. `world/album.ts`: the `'divorce'` case – one neutral line, DRAFT. The album does not settle
   who was right; keep the sentence to the fact.
3. `tests/component/`: the album renders the line on a posed ending; pin what the string IS. A
   second marriage's divorce captures its own line (two episodes posed).

## T4 – the diary

1. The divorce scrap in the four voices – sit beside wave 11's grief scraps in the diary source,
   same licence machinery, the 80-character budget, DRAFT x4. The scrap records; it does not
   judge.
2. The fork-aftermath scrap (spec §7, the architect's flagged proposal): eight DRAFT lines, four
   voices x { with her want, against it }, derived on the week `world.fork.answer` lands, from
   the answer against the recorded want (`forkWantOf`). Pure read, zero draws; a career with no
   want on record (pre-v73) gets no scrap – the absence discipline, stated in code.
3. Tests: both arms reachable on posed worlds; the budget; the no-reproach licence sweep
   (wave 11's pattern).

## T5 – the booth

1. `world/spotlight.ts`: `BoothPrivateLife` widens with `'divorced'`; `boothMentionDue` and
   `boothPrivateLifeAt` answer it where the due ended row carries a latch. `exposureEventsOf` is
   NOT touched.
2. The booth sentence for `'divorced'` where the `'met'`/`'ended'` sentences live today – DRAFT,
   with the wrong-story variant iff `'ended'` has one.
3. Tests: the due-fact kind splits on the latch (posed rows); the once-ness and the standing gate
   untouched (the existing spotlight suites stay green and are named in the report); the exposure
   list is deep-equal on the same worlds before and after the wave.

## T6 – the bench and the spec's numbers

`tools/wedding-bench.ts` gains the parting census – the spec §10's five rows, walked corpus, CAP
as the bench already sets it – and the shock control arm (the `divorce` row neutralised to
breakup's numbers by reverse edit; the bench PRINTS which arm ran, the wave-7 idiom). Run AFTER
every code task, machine quiet, exit codes from files with fresh mtime. Write every measured
number into the spec §10 table; flag any deviation, never smooth it.

## T7 – e2e and the phone

1. Fixture `e2e/fixtures/parting.tsave`: pose a career at a latched episode (the fixtures
   script + `drainLifeBeats`), then find the firing week WITHOUT walking – the stream is
   `seed:life:ends:<week>`-keyed, so evaluate the key directly against the latched hazard and
   save one week before the hit. `expecting.tsave` is the worked example of a posed hazard
   fixture.
2. `e2e/parting.spec.ts`: load, tick, the card shows, answer it, the kept row and the album line
   exist. Add the manifest row and the `docs/specs/e2e-coverage.md` line.
3. The phone law: a mounted assertion that the `'divorced'` card's dismiss control sits inside a
   375x667 viewport – the TourBriefingDialog lesson; lengthen the card in a mutation arm and
   watch it fail before believing it.

## T8 – strings and docs

1. `docs/plans/life-wave-12-strings-2026-09.md` in the wave-9 format: id · where it shows · the
   draft · status, one row per string, and `tests/wave12-strings-roundtrip.test.ts` pinning the
   table to the shipped constants character for character (wave 9's parser test is the model).
   The table owns the count; state no total in prose anywhere.
2. `docs/plans/the-private-life.md`: the 22.08 fork-opinion pause note gets its dated closure
   sentence (built by wave 2; the aftermath scrap by this wave). One added sentence, the original
   text untouched.
3. The report: what shipped per task, every DRAFT verbatim beside what it replaced, every
   measured number, the questions last.

## The gates

After all tasks: `npm run check`, `npm run test:sim`, `npm run test:e2e` – locally, one at a
time, exit codes appended to the log inside the command and read from the FILE with fresh mtime,
machine quiet (`pgrep -lf "vite-node|vitest"` empty first). The frozen capture (41550 /
e6b0c709) must NOT move – this wave adds no draw, so a moved pin means a defect, not a re-pin.
The PR is assembled by the pull-request skill, boxes earned in order.
