---
type: plan
status: current
area: private-life
last-reviewed: 2026-09-22
---

# Wave 10 for the builder – the dynasty, step by step

The canonical spec is [the-dynasty-2026-09.md](../specs/the-dynasty-2026-09.md); read it first,
this file is the order of work. Branch: `life/wave-10`, cut from main after PR #152. One branch,
pathspec commits (`git commit -m … -- <files>`), never amend, gates from files with fresh mtime –
CLAUDE.md binds all of it; nothing here repeats it.

His go, 22.09: «Пиши полную пошаговую спеку, а я билдера запущу и все замеры, всё отражай в
спеке». Three items inside the wave wait on his word and are marked ⚠ RULING; build everything
else first, and if the ruling has not arrived by the time you reach them, skip and say so in the
report – the architect carries questions to him, tasks never guess.

Every player-facing string in this wave is a DRAFT for his review (invariant 4). Write them once,
in code, and list every new string verbatim in your report.

## T1 – the handover, engine-side

1. `shared/protocol` (career/profile module, beside `PrologueHandover`): declare `DynastyHandover`
   exactly as the spec §3 spells it. Wire type, no schema.
2. `world/endings.ts`: `wasThereAChild` starts reading `world.children.length > 0` – the comment
   above it already promises this day; keep the comment, update its tense.
3. `world/endings.ts`: a `dynastyHandoverOf(world): DynastyHandover` builder –
   `generation = (world.dynasty?.generation ?? 0) + 1`,
   `ancestorRoot = world.dynasty?.ancestorSeed ?? world.seed`,
   `childSeed = \`${ancestorRoot}:dynasty:${generation}\``,
   background per spec §4 (thresholds READ `ECONOMY.startingFundsCents`, never copy the numbers),
   `raisedOnTour = wasThereAChild(world)`, career facts from `bestRankEver` and `trophiesByTier`
   the same way `buildEndingView` already counts titles.
4. `buildEndingView` carries the block on the ending view – every ending, his 20.09 door ruling.
5. Test `tests/wave10-handover.test.ts`: build careers through `openCareer`/`stepCareerWeek`
   (`tools/econ-bench.ts` – the only honest way a test lives a career, wave 9's lesson), reach an
   ending, assert the block's arithmetic – and one behavioural case per background band, driven by
   the career lived, not by a posed balance.

## T2 – the schema move, v86, all four parts in one range

1. `world/state.ts`: `dynasty: DynastyRecord | null` on `WorldState` – the persisted twin of the
   handover minus `childSeed`/`background` (both are consumed at creation), plus
   `ancestorSeed: string`. Doc-comment the null: every pre-dynasty save is generation zero.
2. `SAVE_SCHEMA_VERSION = 86`; append-only migration backfilling `null`.
3. Golden fixture `tests/fixtures/saves/v86.json` (goldenSaves enforces one per version).
4. Regenerate `e2e/fixtures` – wave 8's v85 move is the worked example; follow its commits.
5. `createWorld(seed, profile, careerId, prologue?, dynasty?)` – fifth optional argument, the
   `PrologueHandover` precedent verbatim: absent means byte-for-byte the career the game always
   created. Present: persist the record, apply §4's funds (the mapped background's
   `STARTING_FUNDS_CENTS`, no special balance), thread §7's temperament (T3).
6. Frozen capture: predicted UNMOVED (no new MAIN draw exists in this wave). If it moves, stop –
   something is wrong, do not re-pin.

## T3 – the heredity, one axis, pinned identical when absent

1. `engine/economy.ts`: `ECONOMY.dynasty = { opennessLean: 0.65 }` – drafted, the bench confirms.
2. `engine/spirit.ts`: `temperamentFor(seed, mother?: Temperament)` – the openness pole leans to
   the mother's with probability `opennessLean`, intensity untouched, still one draw sequence on
   `seed:temperament` (the lean re-maps outcomes, it never adds or skips a draw).
3. Pin, mutation-verified both ways: (a) absent argument → byte-identical distribution to today
   over a fixed seed sweep (mutate the lean constant, the no-argument arm must NOT move);
   (b) present → the lean shows over the sweep (set the constant to an absurd 1.0 and watch every
   child take the mother's pole – the null-result law, proven before believed).
4. `createWorld` passes `dynasty?.motherTemperament` – nothing else may ever pass a lean.

## T4 – the route: the door, the prologue, the wire

The protocol wire lands first (the house pattern), then the two UI halves.

1. `shared/protocol` messages + `worker/sim.worker.ts` + `stores/game.ts`:
   `newCareer(seed, profile, prologue?, dynasty?)` – optional through the whole wire.
2. `EndingScreen.vue`: the second affordance beside «Raise another» – two DRAFT texts, lived
   (`raisedOnTour`, may state the girl's age from the block's arithmetic, never a name) and
   epilogue («роды случились после» – no age claim). Emits the dynasty intent with the block.
   ⚠ Mounted test in `tests/component/`: both affordances' boxes inside 375×667, the popup law's
   own assertion, mutation-verified by making the card too tall and watching it fail.
3. `App.vue`: hold the pending block through the prologue route; `raiseAnother`'s «nothing is
   deleted» stays true – quitting mid-prologue loses nothing but the walk.
4. `ChildhoodPrologue.vue` + `src/prologue/identity.ts`: on a dynasty run the surname pre-fills
   from `motherName.last` and LOCKS (one DRAFT sentence explains the line), country pre-fills
   editable, first name typed – «имя выбирает родитель», nothing in this wave may invent one, in
   a string or in a fixture (wave 9's contract, verbatim). The origins card is not asked; the
   background arrives answered. The ninth card's call passes `childSeed` – never a fresh random.
5. e2e: one case – finish a fixture career, take the door, name the girl, assert the new career's
   week-0 world carries `dynasty` and the surname.

## T5 – fame from birth

- **T5a, build now**: booth lineage mentions – a small pool (3–5 DRAFT lines) on the shipped
  big-stage licence (`atOrAboveStageBar` + the booth's own seams in `world/spotlight.ts` /
  `lifeBeat.ts` §10), licensed ONLY off real facts: `motherCareer.titles > 0` or her `bestRank`
  cleared `ECONOMY.spotlight.newsRankKnown`. A college mother licenses nothing – assert it.
- **T5b ⚠ RULING (question 2)**: the `noticed` news floor from week 0 when the mother was herself
  `known`. One clause in `newsStandingOf` reading `world.dynasty`, one recorded D1 amendment in
  `docs/decisions.md` with his words – without his words this task does not exist.

## T6 – the mother in the new career

- **T6a, build now**: the heirloom – ONE album page early in the new career's book
  (`world/albumBook.ts`), content licensed off the block: her name, the cabinet's honest numbers,
  the line's generation. Zero mechanics. DRAFT strings.
- **T6b ⚠ RULING (question 1)**: the four strokes – one habit, one thing she notices with a
  professional eye, one friction from her own career's scars, one way her presence changes
  speech – landing as feed/diary texture licensed off `motherTemperament` + career facts. Diary
  scraps obey the 80-character budget and the voice licences (`voiceOf`, wave 9's machinery).
  Await his «да» after the architect's explanation; skip silently on no word.

## T7 – the bench, `tools/dynasty-bench.ts`

Sections, each printing predicted beside measured (spec §8 rows 1–5):

1. The lean over N=400 dynasty creations (same mother swept across seeds).
2. The fairness corridor re-read on dynasty worlds – wave 1's arms, dynasty-created.
3. The background mapping over the 168-career corpus's endings.
4. Determinism: one ancestor walked to the door twice → hash-identical child worlds.
5. A census line: how many corpus careers end with the lived variant vs the epilogue variant –
   the door is always open, this only prices the two texts.

`npm run check:tools` covers its types; run serialised, exit codes from files.

## T8 – the poise room at match grain (wave 9's debt, his «не возражаю»)

Extend `tools/composure-bench.ts` (or a sibling arm beside it): the measured motherhood margin
(+0.495 composure, wave 9's twins) priced on pressure points against `point.ts`'s own law
(+20 ≈ +4 pp). Predicted: ≈ +0.1 pp on pressure points, below career-grain noise at N=168 –
record the measurement in [the-child-2026-09.md](../specs/the-child-2026-09.md) §8's ledger
either way. This closes the wave-9 report's «unmeasured arm» line honestly.

## T9 ⚠ RULING (question 3) – the four webp portraits

If his eye approves the recompressed pair set (368×512, −36 KiB): swap the four files under
`public/images/support-stuff/` from the architect's stash, update `.staff-art`'s derivation
comment in `SupportStaffTab.vue` (the master is 368×512 then: (136−2) × 368/512 = 96.31 ≥ 96 –
the guarantee holds, re-derive it in the comment's own arithmetic), and re-run
`tests/component/round43-staff-portrait.test.ts`. The install-size line in the PR carries the
saving. Without his word the stash stays where it is.

## The gate, per task and at the end

- After every task: `npm run test:quiet` + the task's own tests; typecheck via `npm run check`
  before any commit that touches `shared/protocol` (the wire breaks quietly otherwise).
- Wave end (the architect runs the final gate, but leave it green): `npm run check`,
  `npm run test:sim` (predicted: every corridor unmoved – the dynasty exists only past endings),
  `npm run test:e2e`, `npm run test:component`, frozen capture unmoved, install size (headroom
  3 KiB today; T9, if ruled in, turns it into ≈39 KiB).
- Report: every DRAFT string verbatim, every predicted-vs-measured row filled, every ⚠ RULING
  task's status stated plainly, questions accumulated at the end – never resolved by guessing.
