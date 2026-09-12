---
type: plan
status: draft
area: life
canonical: false
last-reviewed: 2026-09-09
---

# Wave 1 – the two numbers: the builder's runbook

Step-by-step build order for the layer's first wave. The design authority is
[who-she-is-2026-09](../specs/who-she-is-2026-09.md) (constants – its §4 wins on any drift) and
[the-private-life-build](the-private-life-build.md) §§1–2 (re-based 09.09). This file adds no
design – it sequences the work and names every gate. ⚠ Read those two documents and `CLAUDE.md`
BEFORE the first line; every rule below has a body behind it.

**Scope of the wave (one sentence):** `spirit` + `bond` + `temperament` land in the engine and
the save (v72), her face and the Mood word start carrying her life, the four voice bibles and
tier-0 quoted lines make her audible, the birthday ask leans mildly toward her register – and a
bench proves the whole thing moves without drifting, per temperament, inside the fairness
corridor.

## 0. Preconditions

1. Branch from FRESH main after the wave-0 merge lands: `git checkout main && git pull origin
   main && git checkout -b life/wave-1`. One branch per wave; side work goes to a worktree.
2. Confirm the schema number is still free: `SAVE_SCHEMA_VERSION` reads **71**
   (`src/engine/world/state.ts:336`-area). If something landed first, this wave takes the next
   number and every «v72» below moves with it – re-count, do not quote.
3. `npm run graph:check` (orientation only); `npm run check` green on the base commit before any
   work – a red base is somebody else's problem, find out whose before building on it.
4. ONE builder. The collision surface (build plan §2) spans too many hubs to split:
   `phaseHerWeek.ts`, `player.ts`, `economy.ts`, `migrations.ts`, `state.ts`, `birthday.ts`,
   `diary.ts` + `diary/*`, `avatarEmotion.ts`, `KidScreen.vue`, `WeekRecapCard.vue`,
   `protocol/narrative.ts`.

## 1. FIRST ARTIFACT – the voice bibles (docs only, OWNER GATE)

Before any string is wired:

1. Write **four voice bibles** in one doc (`docs/specs/voice-bibles-2026-09.md`, frontmatter
   required): per temperament – vocabulary register, sentence length, what she names and what
   she leaves out, punctuation habits; each with **age rails** (young / teen / adult maturity of
   the same voice). English. Include the shared FLAT pool's style (short, even, interchangeable
   – the walls voice).
2. Draft in the same doc: the **five Mood words** (`Glowing / Bright / Steady / Dimmed / Heavy`
   – «Steady» shared with condition, ruled), and **8–12 tier-0 quoted lines per voice** with the
   licence each line claims.
3. ⚠⚠ **STOP. Deliver the doc to the owner and get his wording pass BEFORE wiring one string**
   (CLAUDE.md invariant 4 – every player-facing word is his). His approval is a ruling – it goes
   to `docs/decisions.md` the same day. Engine work (step 2) may proceed in parallel while he
   reads; UI/string work (steps 4–5) may not.

## 2. Engine core (pure, zero draws on any stream)

Order inside the step is dependency order:

1. **`temperament`**: the draw in `createWorld` on `rngFromSeed(`${seed}:temperament`)` – two
   axis picks, uniform 25×4, ids `'sunny' | 'fiery' | 'quiet' | 'deep'`; the pure derivation
   lives in ONE exported function (the migration imports the same one). Field on `WorldState`.
2. **`src/engine/spirit.ts`** (new leaf beside `condition.ts`):
   * constants in `ECONOMY.spirit` (`economy.ts`): baseline 70, knee 60, floor 0.90,
     `returnPerWeek` 5 steady / 3 intense, perturbation scale ×0.8 / ×1.25, attachment lift 5
     (unused until wave 3 – declared, not read);
   * `spiritMatchFactor(spirit)`: 1 at ≥ 60, linear to 0.90 at 0;
   * `accrueSpirit(world)`: ⚠⚠ **RETURN FIRST (off last week's value), THEN this week's
     perturbations** (the 09.09 order ruling – the reversed order cancels its own events), then
     clamp 0..100 and **round to the nearest tenth**. Perturbation table verbatim from the build
     plan §1b (injury onset −8 · laid-up week −1 · governed knock week −2 · vacation resolved +5
     · birthday week +2 · exam week with train ≥ 85 −2 · season wrap with zero vacations −3 ·
     blackout week +1), each × the intensity scale;
   * the weekly `bond` regression (0.5/week toward 70) rides the same pass – one weekly
     function, two numbers.
3. **Call site**: `resolveBodyAndPlanner` in `world/phaseHerWeek.ts`, immediately AFTER the
   `accrueCondition` call. ⚠ Its OWN call – `accrueCondition`'s arity-2 is test-pinned and must
   not gain a parameter.
4. **`bond` deltas at the decision sites** (table verbatim from build plan §1d): `decideKnock`
   rest +1 / push −3 / repeated-part −5; the played-hurt arm (`'warn'` clearance in hand) −4;
   `chooseGift` – time-together ids +2/+3/+4, the ASKED-FOR material gift granted +2.5, the
   refusal −1.5, unprompted material 0 (⚠ this commit must amend BOTH homes: ruling 2's comment
   in `birthday.ts` AND the birthday spec's «records and does not consume» §2b – the table is
   the consumer they were waiting for); `resolveVacation` +1; the season-boundary
   zero-vacations block −3.
5. **The seam**: `spirit?: number` joins `kidMatchPlayerFor`'s narrow arg type as the EIGHTH
   optional field (`world/player.ts` – the file's own documented pattern); the five wings
   multiply by `spiritMatchFactor` beside condition's factor; absent ⇒ 1.0 so every pure caller
   and stored replay is byte-identical.
6. ⚠ **Zero draws anywhere in this step** – both weekly rules are arithmetic; the temperament
   draw is (seed)-keyed at creation. The frozen capture (41550 / `e6b0c709`) must come back
   byte-identical.

## 3. The schema move (v72, the three-part law)

1. Bump `SAVE_SCHEMA_VERSION` 71 → 72.
2. Append-only migration: back-fill `{ spirit: 70, bond: 70 }` (uniform – ruling V4) and DERIVE
   `temperament` by calling the SAME exported formula on the career's own seed – zero draws,
   bit-stable, an old career turns out to have always been her.
3. Golden fixture `tests/fixtures/saves/v72.json` = the real migration's output on `v71.json`;
   `npm run e2e:fixtures` re-run; `goldenSaves` green.

## 4. Exposure – the face and the word (engine decides, UI renders)

1. **The emotion**: `spirit` joins `avatarEmotion`'s inputs inside the engine's one decision
   (`assembleDiaryFacts`, `engine/diary.ts`). Collision rule (ruled): injury first, then the
   LARGER deviation of body (condition) vs mood (spirit), then the existing result logic. ⚠ The
   header avatar stays age-only (F45-1) – touch nothing there.
2. **The Mood word**: decided ENGINE-side beside the emotion (a `moodWord` on `DiaryFacts`),
   from the five approved words, sharing «Steady» with condition, same priority rule; the
   KidScreen and WeekRecapCard tiles render the word they are handed. ⚠ The fog law: no number,
   no bar, no arrow reaches any surface – `spirit`/`bond` may ride the Snapshot for the worker
   boundary, but no component prints them.
3. **The diary**: `bondBand` on `DiaryFacts` (`close ≥ 80 / steady 55..79 / strained 35..54 /
   cold < 35`), `closeBond`/`strainedBond` licences, 4–6 lines, honesty-pinned like every
   licence. Tier-0 quoted lines enter the week-note pools in all four voices + the flat pool –
   ONLY after step 1's owner pass, strings verbatim from the approved doc.
4. **The birthday weighting**: the ask draw re-weighted ~1.5× toward her register – same
   stream, same record shape, deterministic; every id stays reachable for every girl.

## 5. Tests (each net mutation-verified – break it, watch it fail, fix it back)

* delta-table units for `bond`; clamp/equilibrium per intensity; **every perturbation row
  asserted FROM BASELINE per intensity arm** (the order-fix pin – the next week shows the full
  scaled delta);
* `spiritMatchFactor` exactly 1 on [60, 100]; the seam test – `kidMatchPlayerFor` with spirit
  absent or ≥ 60 deep-equals the pre-wave player;
* the frozen capture pin re-run untouched; migration idempotency + fixture + a pin that the
  migration's temperament equals the formula's output on the same seed;
* diary licence sweep (new lines unselectable outside their bands); **the voice completeness
  pin** – walks kind × temperament × register and FAILS on a missing variant (the flat pool is
  the only legal shared fallback, and only at strained/cold);
* mounted component tests: the Mood tile renders one of the five words and the face/word can
  never disagree (they read one decision); 375×667 fits anything this wave lengthens;
* ⚠ before touching any module tests pin, run the pin query first:
  `git grep -l "engine/<module>.ts'" -- tests/` – every hit needs re-aiming through the source
  helpers, never raw `indexOf`.

## 6. The bench (`tools/spirit-bench.ts`, `bench:spirit` – invariant 5)

32 seeds × 4 seasons × {care, grind} × 4 temperaments (care: rest knocks + vacations + light
exams; grind: push + zero vacations + heavy exams; balanced entries in both). Write the
PREDICTED table first, run, record measured beside it (append a «§4a measured» section to
who-she-is). Pass bars, all per arm:

* ⚠⚠ **RE-AIMED 09.09 AFTER THE BENCH RAN, on his word** («не трогать ни одну константу, а
  перевесить обе планки на волны, где приходят события – согласен»). Two bars below were written as
  wave-1 bars and are not wave-1 questions, because **wave 1 has no life events by its own
  definition** – §1b's table is «existing world facts only». They are struck here and re-aimed, NOT
  weakened, and the measurement that moved them is in who-she-is §4a and `docs/decisions.md`:
  * ~~spirit moves: per-career sd ≥ 2 points~~ → **wave 4**, where the break-up shock (−22/−34) is
    the event the five Mood words exist for. Measured here: 1.21 steady / 2.79 intense, and no
    steady girl reaches 2 in any of 128 careers, because the weekly return outruns every
    perturbation but an injury onset. ⚠ Do not read the pooled arm mean (2.00) – it is the average
    of the two arms and a property of neither.
  * ~~bond separates: grind vs care gap ≥ 12 points at season 3~~ → **wave 2**, where the reaction
    beats add decisions worth −4..+3. Measured here: 4.84 at 3.6× its paired SEM – the separation is
    real and in the right direction, and it is a third of the bar because the decisions are rare
    (0.065/week care, 0.028/week grind against a 0.5/week regression), not because the deltas are
    wrong.
* spirit stays inside its range: no extreme drift, weeks < 20 or > 95 under 2%; long-run mean 70 ± 4,
  **held per temperament arm**;
* **bond separates in the right DIRECTION, with significance** – the care arm above the grind arm at
  > 2×SEM – and neither median clamps;
* **the fairness corridor: paired lifetime match-win deltas across temperaments inside
  ±1.5 pp** – a breach is a finding for the owner, never a silent rebalance;
* ~~**Mood-word occupancy: each of the five words in ≥ 2% of weeks** under the care arm~~ →
  **wave 4**, struck in place with bars 1 and 3 above and for the same reason, on his ruling of
  09.09. The bar was written against FREE cut points; the ladder is now RULED, and he took **wide
  honest bands** over the bench's measured optimum – «the word changes only when something really
  happened». Against who-she-is §4a's own measured distribution the ruled cuts
  (`ECONOMY.spirit.mood`: 60 / 67.5 / 72.5 / 80) give **Steady 90.98% · Bright 6.07% · Dimmed
  2.07% · Glowing 0.88% · Heavy 0.00%** – so the bar does not pass in wave 1, and that is the ruled
  outcome rather than a defect: wave 1 has no life events by its own definition, and the ladder is
  built for the finished layer. Glowing and Heavy get their range from the **wave-4 break-up shock
  (−22 steady / −34 intense)**, where a lifted girl at 75 taking −34 lands at 41 and wears Heavy for
  weeks. ⭐⭐ **MEASURED 12.09.2026 (wave 4, T3), AND THE PREDICTION WAS ONE WEEK'S RETURN OUT: she
  lands at 38, not 41.** The arithmetic left out that the ending frees the attachment slot BEFORE
  `accrueSpirit` runs, so the return toward the flat 70 happens first (75 → 72 for an intense girl)
  and the shock lands on THAT. ⚠ The 41 is kept rather than overwritten because this line is wave 1's
  record of its own prediction, and a runbook edited to match the answer stops being evidence of what
  was foreseen. The measured ladder, per intensity, is in `tests/wave4-spirit-shock.test.ts` and the
  T3 commit; **Heavy is reached either way**, so the bar this paragraph is about is unaffected. ⚠ The cut points are not tuning dials: a test that would be easier with other numbers is a
  test to rewrite (pinned in `tests/spirit.test.ts`).
* printed for his read (no bars yet): the birthday ask-mix per temperament, weeks under the
  knee, bond outcomes per temperament.

Register the tool (`npm run tools:registry:check` must pass – the registry is generated).

## 7. Gates, then the PR

1. `npm run check` → file, `CHECK_EXIT` read from the FILE, mtime fresher than the run.
2. `npm run test:sim` → file, unconditionally.
3. `npm run test:e2e` + **one NEW e2e case this wave owes** (the mechanic's honest smoke: the
   Kid screen's Mood word exists, belongs to the five, and matches the face's register).
4. The responsive parity run (375/768/900/1280) – the harness walks the touched screens.
5. `npm run pins:check`, `npm run context:audit`, `npm run doc:facts` (the bibles doc and the
   who-she-is measured section carry frontmatter/facts).
6. Docs owed in the same PR: who-she-is §4a (predicted vs measured), the decisions entry for
   the bibles pass, the backlog row untouched (the layer stays `Next` until steps 1–4 land).
7. Assemble via the `pull-request` skill – the unfinished-items block names anything cut.

## What this wave must NOT do (the fence, enforced by review)

* No MAIN draws, no `Math.random`, no `new Date` – anywhere.
* No wording beyond the owner-approved doc – not one adjacent «fix» (invariant 4).
* No meter, tile-number, bar or arrow for `spirit`/`bond` – words and the face only.
* Rivals read nothing of this; `SKILL_KEYS` untouched; the engine imports no UI.
* No walls/leanings, no episodes, no life beats, no psychologist – waves 2–5 own them.
* `src/shared/protocol/snapshot.ts`'s stale «four axes» comment stays out of scope (source-pin
  risk for zero player value – it belongs to a wave already editing that file).
* Stop-after-any-step is law: this wave alone must leave the game strictly better and fully
  shippable.
