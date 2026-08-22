---
type: spec
status: current
area: engine/staff
canonical: false
last-reviewed: 2026-08-22
---

# The masseur, whole – travelling team step 1

Owner round 23 item 9, ruling Б («массажист ездит, психолог работает дистанционно»), re-cut 22.08:
the psychologist leaves step 1 entirely (he ships with the private-life layer, where his only
legible channel exists), and step 1 is the masseur's **salary + body effect only**. The fare – he
travels, through `coachTravelFareFor`'s rule asked for a second seat – is step 2 and none of it is
built here. Plan: `docs/plans/the-travelling-team-2026-08.md`.

## 1. The physio question, answered before a line was written

The game already sells the body once: `physioActive`, ~$3k/yr on real careers
(`ECONOMY.physio.retainerPerWeekCents` [45, 70]/wk corridor-drawn), bundled with a hired coach,
its quality following the coach's rung (`physioQuality` 1.0 → 1.6). Two levers both buying
«condition» that the player cannot tell apart is the decorative-staff failure the owner banned
(«вы заплатили и не можете этого заметить»), so the first decision of this step was the line
between them:

**The masseur is a separate person ON TOP of the physio service, split by ROLE: the physio is
PREVENTION the player never sees the counterfactual of – it cuts the odds an injury happens
(`physioRiskFactor`, a tau multiply) and the size of the layoff DEALT at onset
(`physioRecoveryFactor`) – while the masseur is RECOVERY THE PLAYER WATCHES: he shortens the layoff
she is already in, which moves the «back in N weeks» on screen week by week, and every bought week
prints a receipt in the feed.** Prevention is silent insurance; recovery is receipts. Four more
legibility seams keep them apart at a glance:

| | physio | masseur |
| --- | --- | --- |
| what it is | a clinic service bundled with the coach | a person on the family payroll |
| price shape | corridor-drawn band, fluctuates weekly | **flat contract** – the card's number IS the ledger's row |
| ledger bucket | `physio` («Fitness & medical») | **`staff`** («Support staff») – its own row, its own hue |
| when it works | while the retainer runs, silently | receipts: «bought a week back» beats, the early-return line, his room note |

## 2. What shipped

* **The hire** – `hireMasseur(world, hire)` (`src/engine/world/masseur.ts`), the coach's shape:
  no signing fee, effective next bill, release always allowed, kept+tagged ledger rows
  (`masseur-since-<week>`, the `COACH_CHANGE_KEY` trick). Worker command `hireMasseur`,
  store facade, card on screen T beside the roster.
* **The gate** – `masseurUnlocked` = `activeLadderOf(world) === 'wta'`: the plan's own ruling
  («открываются в про карьере») on the game's own one-way door – her first counting W-series
  result, read off the never-pruned mark, so the gate cannot close behind a pruned window. The
  refusal is ONE sentence (`MASSEUR_LOCKED_DETAIL`) thrown by the engine and printed by the locked
  card – R10-16's doctrine.
* **The salary** – `ECONOMY.masseur.salaryPerWeekCents = 150_00`, flat, zero draws:
  §3 below for the band argument. Billed by `resolveMasseur` at tick step 1c beside
  `resolvePhysio`; **suspends** – does not cancel – at college and on booked family weeks
  (`masseurWorksThisWeek`: the coach's own stand-down pair, asked of a second seat). Hiring inside
  the freeze refuses with the college sentence via `guardNotEnded` – no second guard exists.
* **The effect, two channels that exist today**:
  * condition: `+1`/worked week inside `accrueCondition` – deliberately the physio's own tuned
    magnitude, because that dial is a hair-trigger (the physio note records that +2 «erased every
    policy difference» on the fatigue bench; W2-FATIGUE's season equation must keep its shape);
  * **the injury tail**: every 2nd week of an ACTIVE layoff (`rehabExtraEveryNWeeks`, cadence off
    `week - sinceWeek`, deterministic) his hands take one extra week off it. A 1-2 week niggle
    gains nothing – honest, nobody massages a soreness away – and moderate-and-up layoffs lose
    roughly a third. `weeksOut`/`weeksLostToInjury` record the weeks she was ACTUALLY out. ⚠ The
    cadence shipped at 3 for one bench run and was re-cut to 2 on the measurement – §3's table
    carries both arms.
* ⭐ **THE SENTENCE** (the plan's §4 law – named before it shipped): his room note, on the card,
  plain words, quoting no figure. The flagship state, verbatim:

  > **Weeks bought back – the last layoff ended sooner than it should have.**

  The other three states: «Working the rehab – her return is closer than the clinic promised.»
  (layoff running, weeks already bought), «On the table twice a day – the rehab is his work now.»
  (layoff running, none yet), «Fresh legs – the weekly table work keeps her body ahead of the
  grind.» (quiet weeks). The window for «recent» is 13 weeks (`MASSEUR_NOTE_WINDOW_WEEKS`).
* **Schema v59** – `masseurHired: boolean` (false for every earlier save – the seat did not
  exist), append-only migration, golden `v59.json` = the real migration's output on `v58.json`,
  `npm run e2e:fixtures` re-run. `injuryHistory` rows may carry `weeksSaved`, written only when he
  saved something – nothing back-filled.

## 3. The band – predicted vs measured (invariant 4)

The plan proposed «about half the coach's rung». Read against the MIDDLE rung at 17-22 – the first
«somebody runs a programme» coach a fresh professional typically has, ~$60/h × 5h ≈ $300/wk – half
is **$150/wk ≈ $7.8k/yr**, and that is what shipped. Flat and corridor-free on purpose: a salary is
a negotiated number the player can read, and the plan's Alice test (design for the $64k/yr career,
not the $2.5M one) is exactly who a corridor would surcharge.

Bench: `tools/masseur-bench.ts` – 24 paired seeds × 2 presets (25k·middle·middle and
8k·working·middle – the Alice end), `player` policy, 416 weeks (8 seasons; the gate opens at
median week 125 / 164, so ~5-6 professional seasons under measurement), arm B hires at the gate
and keeps him. The hire is the arms' ONLY divergence and spends no draw. 23/24 careers reached the
gate on both presets.

**The cadence was re-cut on the first measurement.** At the shipped-for-one-run `N = 3` the paired
weeks-lost delta was **-1.70 ± sd 8.05** (25k) / **-1.65 ± 4.27** (8k) with **1.78 / 1.17**
receipts per career – a real lever, at the edge of season noise, which is the plan's own named
failure. Re-cut to `N = 2` and re-run on the same 48 paired seeds:

| metric (per career, careers that reached the gate) | predicted (pre-bench, at N=3) | measured 25k·middle, N=2 | measured 8k·working, N=2 |
| --- | --- | --- | --- |
| weeks lost to injury, paired B-A | -4..-8 | **-2.48** (19.6 → 17.1, sd 8.82) | **-2.26** (19.3 → 17.0, sd 4.63) |
| injury onsets, paired B-A | -0.5..-1 (condition→tau) | -0.61 (8.22 → 7.61) | +0.09 (7.17 → 7.26) |
| weeks bought back (receipts) | ~2-5 | 2.52 (0..7) | 1.83 (0..9) |
| salary paid | ~$35k over ~235 wks (~$7.8k/yr) | $34,030 over 227 wks | $29,237 over 195 wks |
| pro-phase mean condition | +1..+3 | +1.10 (82.6 → 83.7) | +0.69 (83.2 → 83.9) |
| end W rank (paired delta) | small, direction < 0 | +12.5 – noise, see below | -61.0 – one saved career, see below |
| prize money (paired delta) | not predicted | +$123,935 | +$383,067 |
| endings | – | 23 alive / 23 alive | **A: 22 alive + 1 career-ending injury; B: 23 alive** |

**Verdict, in the owner's units.** (a) Weeks not lost: -2.3 to -2.5 per career against the
prediction's -4..-8 – the physio's onset cut already shrinks the moderates the cadence feeds on,
which the prediction under-weighted; real, and the 8k arm clears 2 SEM. (b) The money line: the
salary lands at the proposed half-coach band (~$7.8k per professional year), against gate-reaching
careers earning $3.4-4.9M of prize money – **the band prices nobody out who can hire at all**
(the one N=3 bankruptcy did not survive the N=2 re-run on the same seed: reshuffle noise, not the
salary). Alice's shape ($64k/yr outgoings, $113k prize): $7.8k is 12% of outgoings – a real
decision, an affordable one. (c) Visible where the player reads: 1.8-2.5 receipt beats per career
plus the early-return recovery line and the note; per-pair rank/prize deltas are noise-dominated
(a moved injury week reshuffles whole seasons) EXCEPT the one that matters most – **the only
career-ending injury in all 92 walked careers sits in a no-masseur arm**: `weeksLostToInjury`
feeds the ending hazard, the masseur keeps the fact (not the forecast) in that ledger, and on
these seeds that difference is one career. A rehab specialist pays off exactly when disaster
hits – rarely, and unmistakably.

## 4. RNG, freezes, guards

* **Zero draws anywhere**: the hire is a boolean, the salary a flat subtraction, the cadence
  arithmetic off `(week - sinceWeek)`. The frozen MAIN capture **41550 / e6b0c709** re-run green
  (tests/condition.test.ts, all 44).
* **Frozen careers** (tests/coach-travel-edge.test.ts): per-key protocol run FIRST on all three
  arms (5/0, 8/0, 0/1), control = detached worktree at the branch base `2a398f0` (the wave's one
  commit reverted), null-arm hazard checked both ways (`grep -c masseur` = 0 in A, field+readers
  in B). Verdict: **`schemaVersion` moved (6208ef0f7750 → 3e1e967e9b79) and `masseurHired`
  appeared (fcbcf165908d = `false`), nothing else** – `rngMain`, `results`, `season`, `events`,
  `fundsCents`, `condition`, `injuryHistory`, `careerTotals` byte-identical on all three. Hashes
  re-frozen; `PRE_V59` rollback identity added (drop the key + schema 58 reproduces the previous
  three hashes byte for byte); `walkFrozenCareer` now asserts the seat is empty.
* **Guards re-aimed, not weakened**: `hireMasseur` joined `refusedCommands` in
  tests/round24-college-refusals.test.ts – at college it refuses with the FREEZE sentence, never
  the ended one.
* **Mutation arms** (each run red, then reverted): gate-always-open → the gate test; bill-skipped
  → both bill tests; condition-bonus-removed → 4a; cadence-never-fires → the cadence tests (re-run
  after the N=2 re-cut: three red); college-suspension-removed → the suspension pair;
  flagship-sentence-swapped → the verbatim note test; card-ignores-snapshot-note → component §3;
  accounting-counts-forecast → the honest-accounting test. Eight arms, eight distinct catches,
  zero survivors.

## 5. Deliberately left for step 2 (the fare)

No travel of any kind: no fare, no stance switch, no seat on `coachTravelFareFor`, no effect at
tournament weeks (his condition bonus is the AT-HOME table; a tournament week's
`matchWeekRecoveryBase` stays 0 for everybody). Step 2 asks the existing fare rule for a second
seat and extends his hands to the trips – and step 3 measures Meridian's 50% against three seats,
exactly as the plan sequences it.
