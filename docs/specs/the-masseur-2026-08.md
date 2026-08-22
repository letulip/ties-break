---
type: spec
status: current
area: engine/staff
canonical: false
last-reviewed: 2026-08-22
---

# The masseur, whole – travelling team steps 1 and 2

Owner round 23 item 9, ruling Б («массажист ездит, психолог работает дистанционно»), re-cut 22.08:
the psychologist leaves step 1 entirely (he ships with the private-life layer, where his only
legible channel exists), and step 1 is the masseur's **salary + body effect only**. §§1–4 are step
1's record, kept verbatim. **Step 2 landed the same day on the same unmerged branch** – the owner's
round-24 challenge («а не слишком ли дешево это для специалиста?») – and §§5–9 are its record: the
price recalibrated as a sessions dial, the fare through the coach's own rule, what the fare buys on
deep runs, and the grid that measured all of it. Plan: `docs/plans/the-travelling-team-2026-08.md`.

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
  (layoff running, weeks already bought), «On the table through the layoff – the rehab is in
  professional hands.» (layoff running, none yet – re-worded twice: R15-7 took the guessed pronoun
  out, and the dial took out «twice a day», which the twice-a-week rung would have made a lie),
  «Fresh legs – the weekly table work keeps her body ahead of the grind.» (quiet weeks). The
  window for «recent» is 13 weeks (`MASSEUR_NOTE_WINDOW_WEEKS`).
* **Schema v59** – `masseurHired: boolean` (false for every earlier save – the seat did not
  exist), append-only migration, golden `v59.json` = the real migration's output on `v58.json`,
  `npm run e2e:fixtures` re-run. `injuryHistory` rows may carry `weeksSaved`, written only when he
  saved something – nothing back-filled.

## 3. The band – predicted vs measured (invariant 4)

⚠ **STEP 1's RECORD, superseded the same day**: the owner challenged the $150/wk flat contract
(«ко мне приезжал массажист и брал 50 долларов в час на дружеском тарифе») and §5 re-cut it into
the sessions dial – $150/wk survives as the dial's ENTRY rung. The table below stands as the
honest record of what the flat contract measured.

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

## 5. ⭐ Step 2: the price recalibrated – THE DIAL (owner round 24)

His challenge, verbatim: «а не слишком ли дешево это для специалиста? ко мне приезжал массажист и
брал 50 долларов в час на дружеском тарифе. А здесь мы говорим про спорт профессионала (кстати
может быть добавлять настройки сколько раз в неделю он дает свои услуги имеет смысл)…»

**He is right, and his own anchor says why**: $150/wk at his real friendly rate buys THREE hours,
and a professional's body work is daily. But the game's economy is compressed (a real coach is
$1500+/wk; the game's middle rung is ~$300), so the honest recalibration is RELATIVE – inside the
game's own scale, so the masseur READS as «a professional on retainer», never as a friendly visit:

* **the session** is priced at **$75** – the TOP of the middle coach's 17–22 hourly band
  ($48–72/h, `ECONOMY.coach.hourlyRateCents`): a specialist's hour above a mid-rung coach's, and
  visibly not the owner's $50 «дружеский тариф»;
* **the dial** (his own idea, «настройки сколько раз в неделю») is `masseurSessionsPerWeek`,
  three rungs in `ECONOMY.masseur.rungs`, set from the card and re-validated by
  `setMasseurSessions` – the coach's hours machinery (`coachHoursForPlan`: rate × hours) asked of
  a second seat, never a second idiom. **The bill stays a flat contract per rung** – step 1's
  legibility argument moved one level up: the rung is chosen, the bill is flat per rung, the
  ledger row is the number on the card.

### The pricing table – ⭐ RULED AND AMENDED 22.08 (the shipped shape)

| rung | sessions/wk | per week at home | per year | what the price READS as, in-game | the effect it buys |
| --- | ---: | ---: | ---: | --- | --- |
| Twice a week | 2 | **$150** | ~$7.8k | step 1's own number – the entry rung; half the middle coach's week | rehab cadence N=3 (one week off a moderate layoff), **+1** condition on home weeks |
| Every other day | 4 | **$300** | ~$15.6k | **the middle coach's whole weekly bill – «a professional on retainer»**; the DEFAULT | cadence N=2 (step 1's measured arm: a third off moderate+ layoffs), **+2** condition |
| Daily | 7 | **$525** | ~$27.3k | between the high coach ($500/wk) and the elite ($800/wk) – the full-time body man; beside his own «+2 специалиста = +46к» sketch (~$23k each) | **cadence N=1 – long layoffs halved**, **+3** condition on home weeks |

⭐ **The condition column is the owner's 22.08 amendment: +1/+2/+3, was +1/+1/+2.** The old ladder
had a flaw his ruling also fixes: rungs 1–2 were indistinguishable on any week without an injury
(same bonus; only the rehab cadence separated them), i.e. the $150 step bought nothing a healthy
player could read – the §4 law's own failure. The ladder now steps by one point per rung and the
strict monotonicity is pinned in tests/masseur.test.ts.

⭐ **THE TOUR WEEK IS PRICED PER MATCH, NOT PER WEEK** – his ruling verbatim: «на неделе выезда
по-матчевая цена заменяет недельную». When he TRAVELS (the fare charged, `masseurThere` recorded),
that week's bill is **$75 × matches played**, replacing the weekly rung bill; the fare rides on top
exactly as before. When he stays home – tournament week or not – the weekly contract runs as
always (the coach's 08.08 retainer rule). The draw table prices itself off the calendar
(rounds = log2(drawSize)):

| draw | max matches | max tour-week bill | reads as |
| --- | ---: | ---: | --- |
| Slam (128) | 7 | **$525** | exactly his daily home rate – a title week is daily work |
| WTA 1000 (64) | 6 | **$450** | between the every-other-day and daily home weeks |
| 32-draws (W15…WTA 500, 250, 125) | 5 | **$375** | a deep week costs more than the default rung, less than daily |
| any first-round exit | 1 | **$75** | one session – the table barely worked |

Edge, stated rather than smuggled: a travel week she SKIPS at the venue (post-deadline `skipEvent`)
bills $0 per match – zero matches at the per-match price; the unrefunded fare stays the wasted
insurance, exactly like the coach's. Pinned in tests/masseur.test.ts §10.

⭐ **THE RETURN-WEEK SESSION** – «довесить послетурнирное восстановление 1 сеанс массажа по
возвращении»: when he was NOT flown to a tournament, the first non-played week after it pays one
extra session's worth of recovery (+1, `returnSessionBonus`) with its own receipt («Back from the
tour – an extra session on the table works the trip out of her legs.»). A played week postpones
it; the moment passes on the first home week whether or not he still works it (released, family
week away); a run he WAS flown to never owes it – the between-rounds relief was that week's work.
Pinned in tests/masseur.test.ts §11.

Anchors read out of the game, not out of the real world: middle coach at 17–22 ≈ $300/wk, high ≈
$500/wk, elite ≈ $800/wk (`hourlyRateCents` mid × 5h); the physio clinic line ≈ $57/wk. The niggle
rule holds at every rung – `totalWeeks > 2` is a structural guard now, so daily hands still cannot
massage a 1–2-week soreness away.

## 6. ⭐ Step 2: the fare, and what it buys on deep runs

* **The fare is the coach's own rule asked for one more seat** – the round-22 ruling («просто
  стоимость поездки на 2 умножать») and NOT a second implementation: `staffSeatFareCents`
  (sponsors.ts) is now the ONE seat-price both `coachTravelFareFor` and `masseurTravelFareFor`
  read – the calendar's printed price, gross (no scholarship ever reaches a staff seat, 15.08),
  with the brand's travel share coming off at paying rungs (17.08: «a sponsor's share comes off
  both seats»). A parity test pins the identity: one world, one event, both seats quote the same
  fare.
* **The stance is the coach's own switch** – `masseurTravels`, default OFF («the switch is what
  buys the seat»), set from the card beside the coach's own toggle. He goes to the rungs that pay
  prize money and no others; no junior override exists because no junior career can hold the
  pro-gated hire.
* **What the fare buys** – the owner's question answered literally («влияет ли он на
  восстановление на глубоких играх»): when the fare is actually charged, the play arm records
  `pendingTournament.masseurThere`, and at finalize `masseurTourRelief` takes
  `tourRecoveryPerRound × (matches − 1)` off the run's strain, capped at the strain itself.
  **Per night BETWEEN ROUNDS**, so it scales with depth by construction: an R1 exit buys nothing
  (the fare was insurance she did not need), a title week buys the most. `matchWeekRecoveryBase`
  itself is untouched, still 0 for everybody.
* **The at-home bonus stopped pretending** – step 1 paid the table bonus on tournament weeks too,
  which the deep-run question exposed: she is away and nobody is on the home table. Since step 2
  the rung's condition bonus lands on non-played worked weeks only; a played week that turns out
  match-free (medical withdrawal, skipped event) hands it back through the same 18.08 makeup
  expression both paths share. Tournament-week recovery is now exactly what the travel stance
  sells.
* **The receipt** (§4's law): a run of 3+ matches with him there prints one bounded line –
  «Deep week, fresh legs – the table work on tour kept the run from eating her.» – and the fare
  row itself names the payer when a brand covers a share.

### The Meridian interaction (the plan's step 3)

Unit-pinned: with a signed premium deal (`Meridian Sport`, travelShare 0.5) the masseur's seat
costs **exactly half the printed price** – the same `kitTravelShare` her seat and the coach's
read, one number, three seats. The arithmetic of the plan's §3, stated honestly: with all three
seats on a full-price trip the travel line is 3× her single seat; under Meridian it is 1.5× – half
of the staffed line, one seat's worth above where a staff-less family stands. (The plan predicted
TWO extra specialists; the psychologist went remote by the owner's own ruling, so the doubling it
sketched is now a 1.5×.) The grid below reports how many real fares rode under a discount.

## 7. ⭐ Step 2 measured – the grid (invariant 4)

`tools/masseur-bench.ts`: 32 paired seeds × 2 presets (25k·middle·middle and 8k·working·middle),
`player` policy, 416 weeks, **7 cells per seed** – `none`, then {2, 4, 7 sessions} × {home, tour} –
paired per seed against `none`, SEM (sd/√n) reported per cell.

⚠ **The B arms manage the hire like a parent, and the first probe is why**: hire-at-the-gate-and-
hold-for-ever bankrupted knife-edge careers (the gate opens at the family's junior-years low), so
the walk (re)hires above $25k funds and releases below $10k – the measured releases are in the
money row. A walk stops at its career's ending; walking past one would bill a dead world (the tick
is total by design).

**Predicted** (written before the grid ran): rehab receipts monotone in the dial (N=3 < N=2 < N=1);
weeks lost scaling -1 → -2.5 → -4..-6; tour arms +1..+2 condition over home arms and a positive
match-win delta on deep-run weeks; onsets untouched directly (any movement via condition→tau,
expected small negative); fares ≈ $2-4k/trip at W rungs; the middle preset knife-edged enough that
the parent-guard fires releases.

**Measured, 25k · middle · middle coach** (n=31 of 32 reached the gate; paired vs `none`, ± = SEM):

| cell | weeks lost | onsets | pro condition | pro match wins | rehab / tour receipts | salary over hired wks | fares (trips) | prize Δ |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| 2/wk home | -0.39 ± 0.32 | -0.03 ± 0.12 | +0.26 ± 0.15 | -2.6 ± 1.9 | 0.77 / 0 | $20,192 / 165 | – | -$100k ± 91k |
| 2/wk tour | -0.10 ± 0.65 | +0.35 ± 0.24 | **+1.08 ± 0.12** | **+5.0 ± 2.0** | 0.58 / 28.3 | $18,489 / 148 | $227,774 (60.9) | -$27k ± 191k |
| 4/wk home | -0.81 ± 0.40 | +0.06 ± 0.10 | +0.16 ± 0.17 | -1.8 ± 2.0 | 1.10 / 0 | $38,729 / 159 | – | -$50k ± 147k |
| 4/wk tour | -0.26 ± 0.63 | +0.35 ± 0.26 | **+1.29 ± 0.20** | +2.6 ± 3.2 | 0.87 / 26.1 | $32,816 / 132 | $201,527 (54.0) | -$120k ± 306k |
| 7/wk home | -0.74 ± 0.67 | +0.06 ± 0.12 | +0.27 ± 0.20 | -1.8 ± 2.8 | 1.65 / 0 | $65,066 / 153 | – | -$102k ± 178k |
| 7/wk tour | -0.55 ± 0.80 | +0.16 ± 0.27 | **+1.32 ± 0.17** | +3.7 ± 2.8 | 1.55 / 27.3 | $59,833 / 137 | $210,415 (56.5) | -$188k ± 270k |

All 31 careers alive in every cell (the parent-guard fires 0.2-0.9 releases/career; the
hold-forever probe's bankruptcies are gone). Zero discounted fares: no 25k career signed a
travel-share deal while touring.

**Measured, 8k · working · middle coach – the Alice end** (n=31 of 32 reached the gate):

| cell | weeks lost | onsets | pro condition | pro match wins | rehab / tour receipts | salary over hired wks | fares (trips) | prize Δ |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| 2/wk home | -0.68 ± 0.59 | **-0.19 ± 0.09** | +0.07 ± 0.07 | +2.2 ± 1.8 | 0.97 / 0 | $24,261 / 202 | – | +$209k ± 198k |
| 2/wk tour | -0.74 ± 0.66 | -0.13 ± 0.20 | **+1.93 ± 0.22** | **+9.6 ± 3.5** | 0.84 / 39.7 | $24,000 / 195 | $225,254 (80.1) | +$566k ± 329k |
| 4/wk home | -1.29 ± 0.67 | -0.16 ± 0.13 | +0.06 ± 0.07 | +1.8 ± 2.0 | 1.68 / 0 | $47,565 / 198 | – | +$121k ± 180k |
| 4/wk tour | **-1.61 ± 0.63** | -0.19 ± 0.20 | **+1.84 ± 0.27** | **+9.6 ± 3.5** | 1.58 / 39.0 | $46,471 / 189 | $220,830 (78.4) | +$549k ± 331k |
| 7/wk home | **-2.00 ± 0.63** | -0.10 ± 0.18 | +0.19 ± 0.11 | +2.6 ± 2.8 | 2.26 / 0 | $81,951 / 196 | – | -$112k ± 244k |
| 7/wk tour | **-2.39 ± 0.75** | -0.10 ± 0.21 | **+1.62 ± 0.31** | **+10.5 ± 4.5** | 2.00 / 38.5 | $78,157 / 182 | $213,672 (75.8) | +$516k ± 354k |

⭐ **The one career-ending injury in the A arm is averted in five of the six B cells** (A: 30
alive + 1 career-ending injury; every B cell but 7/wk-tour: 31 alive) – step 1's «a rehab
specialist pays off exactly when disaster hits», reproduced at 32 seeds.

**Reading the 25k grid honestly:**

* ⭐ **The FARE is the measurable channel, exactly as the owner suspected.** The tour arms clear
  **6-9 SEM on pro-phase condition** (+1.1..+1.3) and the 2/wk tour arm clears 2.5 SEM on match
  wins (+5.0 ± 2.0) – the deep-run relief is real, visible, and it is what the fare buys. The
  receipts arrive steadily – 26-28 tour lines per career over ~5-6 pro seasons, roughly one
  every deep run.
* **The dial's rehab channel scales monotonically** – receipts 0.77 → 1.10 → 1.65 per career, the
  6-week-layoff walk is pinned at 5/4/3 weeks served – but the whole-career weeks-lost delta sits
  at 1-2 SEM here, weaker than step 1's -2.48: the parent-guard employs him ~160 weeks against
  step 1's 227, and the weeks he is released cluster exactly where money is tight. The dial is NOT
  decoration – the receipts and the pinned cadence separate the rungs – but at this preset its
  headline is the price, not the weeks.
* **Tour onsets +0.35 ± 0.25 is EXPOSURE, not a broken lever**: fresher legs pass the fatigue
  caution more often, so she enters and plays more (+2.6..+5.0 wins), and played weeks carry
  `injuryPlayingMultiplier`. More tennis, slightly more injuries – the honest shape of buying
  freshness.
* **The travelling masseur does not pay for himself in prize money here** – fares ~$200-230k
  against prize deltas that are negative-to-noise. Like the coach's own measured fare, it is a
  LUXURY: the family buys condition, wins and receipts, not ROI. At the 25k preset that is a real
  decision (~$40-50k/season of pro career), which is what the owner asked the price to be.

**Reading the 8k grid** (and it reads differently from the 25k one, which is the plan's own Alice
test doing its job):

* ⭐ **At the working preset the dial IS the weeks**: -0.68 → -1.29/-1.61 → -2.00/-2.39 lost weeks
  per career, monotone in the rung, with the 7/wk cells clearing **3 SEM** – and rehab receipts
  0.97 → 1.68 → 2.26. Every rung measurably beats the one below it: the dial is not decoration.
* ⭐ **The travelling masseur roughly pays for himself here**: ~$250-290k of staff cost against
  prize deltas of **+$516..566k (± ~330k, direction consistent across all three tour cells)** and
  **+9.6..+10.5 match wins at ~2.8 SEM**. The working family's masseur is an investment; the
  25k family's is a luxury – the same asymmetry the plan's §1 found in the owner's own two saves.
* **The tour condition effect is preset-stable**: +1.6..+1.9 (6-9 SEM), beside the 25k's
  +1.1..+1.3 – the deep-run relief is the mechanism, not a preset artefact.

### The injury-risk verdict (the owner's «влияет ли он на риск травм»)

**No direct lever shipped, and the grid says none is needed.** The split stands: prevention (the
tau multiply, the layoff dealt at onset) is the physio's; the masseur is recovery you watch – plus,
since step 2, the tournament week the fare buys. What the grid measured about risk:

* the sessions dial DOES move onsets, but only through channels the player already reads: at 8k,
  -0.10..-0.19 onsets/career (2/wk home clears 2 SEM at -0.19 ± 0.09) – the condition→tau chain;
  at 25k the TOUR cells move the other way, +0.35 ± 0.25 – fresher legs pass the fatigue caution,
  she enters and plays more (+2.6..+5.0 wins), and played weeks carry `injuryPlayingMultiplier`.
  **More recovery is sometimes more exposure – an emergent trade, not a broken lever.**
* a direct `tau` multiply on masseur sessions would be a second hand on `physioRiskFactor`'s own
  number, with no surface of its own to be read on – «you paid and you cannot tell», the exact
  decorative trap this plan exists to avoid, now with the measurement showing the indirect
  channels already produce every effect a player could feel. **Risk stays the physio's.**

### The Meridian interaction, honestly bounded

The grid's «discounted trips» column read **0 in all 12 cells – by construction**: the econ
bench's policy never signs a sponsor (`signOffer` is a player command no walk issues), so
`kitTravelShare` is 0 for every walked fare. The interaction is therefore pinned where it can be
seen exactly: the unit test builds the real premium terms (`Meridian Sport`, travelShare 0.5) and
asserts the masseur's seat at **precisely half the printed price**, and the coach-parity identity
makes the same true of the second seat by the same read. The travel-line arithmetic for a staffed
family under Meridian: three full seats = 3× her single fare; under the 50% share = 1.5× – half of
the staffed line, one seat above where a staff-less family stands (the plan's §3 sketch assumed a
second travelling specialist; the psychologist went remote by the owner's own ruling, so its
«doubled» is this build's 1.5×).

## 8. RNG, freezes, guards – step 2's additions

* **Still zero draws anywhere**: the dial and the stance are plain state, the fare is a
  subtraction in the play arm, the tour relief is post-strain arithmetic, `masseurThere` is a
  recorded boolean. The frozen MAIN capture **41550 / e6b0c709** re-run green.
* **Frozen careers** (tests/coach-travel-edge.test.ts): per-key protocol run FIRST, control = a
  detached worktree at `c976786` (step 2 reverted), null-arm checked both ways. Verdict: **two new
  keys appeared – `masseurSessionsPerWeek` (4b227777d4dd = `4`) and `masseurTravels` (fcbcf165908d
  = `false`) – and NOTHING else moved** on all three arms; `schemaVersion` stays 59 both sides.
  The first per-key run was thrown away because all three arms came back `preset 0 policy 1` (a
  zsh word-split ate the flags) – the protocol's «check headers against invocations» clause
  earning its keep. Hashes re-frozen; the `PRE_V59` rollback identity now drops all THREE masseur
  keys and still reproduces the v58-era hashes byte for byte.
* **Schema v59, extended in place** – the version shipped to no player, so append-only does not
  bind it yet (deliberate, recorded in the migration): v59 now writes `masseurHired = false`,
  `masseurSessionsPerWeek = 4`, `masseurTravels = false` for every pre-v59 save;
  `pendingTournament` MAY carry `masseurThere`; golden `v59.json` regenerated through the real
  migration (diff = exactly the two new keys), `npm run e2e:fixtures` re-run.
* **Guards re-aimed**: `setMasseurSessions` and `setMasseurTravels` joined `refusedCommands` in
  tests/round24-college-refusals.test.ts – inside the freeze both refuse with the COLLEGE
  sentence through `guardNotEnded`, the same order `hireMasseur` documents.
* **Mutation arms, step 2** (each run red on the named test, then reverted, tree re-run green):
  bill-ignores-dial → §3's rung-bill test; cadence-ignores-rung → the dial-scales-cadence test;
  niggle-guard-removed → the daily-niggle test; played-week-bonus-restored → the she-plays test;
  fare-never-charged → the charge test; share-ignored → the Meridian test;
  relief-when-home → §9's zero-when-home test; relief-not-by-depth → the per-night test;
  migration-wrong-default → the §6 fixture test; dial-aria-hardcoded → the component §5 test.
  Ten arms, ten distinct catches, zero survivors – on top of step 1's eight.

## 9. Left open – re-cut 22.08 after the rulings

* ~~The owner rules on the pricing table~~ – RULED: the table stands, amended (+1/+2/+3, the
  per-match tour price, the return-week session – §5 carries all three verbatim).
* ~~The owner rules on §10~~ – RULED: «окей, делаем» on variant C; §11 is the shipped record.
* The psychologist ships with the private-life layer (the 22.08 re-cut), where §6's fare question
  will be asked again for a THIRD seat – `staffSeatFareCents` is already the one place to ask it,
  and `staffResultShareBps` (the round-24 prize share) the one place to ask HIS percentage.
* The owner may retune any of: the three rungs, `tourRecoveryPerRound`, `returnSessionBonus`,
  `ECONOMY.staffShare` – all one-line constants; the §11 grid re-runs as-is.

## 10. ⭐ The owner's recovery question (22.08) – A/B/C measured; C RULED IN the same day (§11)

His proposal, verbatim: «может быть нам тогда стоит дефолтное восстановление с 10 в неделю на 7
опустить? тогда массажист как раз будет еще немного накидывать, может вполне гармонично получиться,
как мне кажется». His 10 = `recoveryBase` 8 + the 60/40 slider's +2 (§4's own unit), so his 7 =
**base 5**. Three arms, same 32 paired seeds per preset, same walk (`tools/masseur-bench.ts`,
cells none / 4-a-week home / 4-a-week tour – the DEFAULT rung), phase-split junior/pro on the
masseur's own gate:

* **A** – as-is (base 8), tree clean at `5e61373`.
* **B** – his drop read literally: `recoveryBase: 5`, the CONSTANT – so the junior era, both
  makeup paths and ALL 199 RIVALS move with it (they read the same knob, rival.ts).
* **C** – the pro-only variant: base 5 only while `activeLadderOf === 'wta'` (the masseur's own
  unlock boundary), patched at the kid's three readers – `accrueCondition` plus the two 18.08
  makeup expressions – juniors and rivals keep 8.

Both patches were LOCAL and are reverted byte-clean (`git status src/` empty between arms); each
arm's reader was proven by the null-result law first – the constant set to an absurd 0 moved junior
condition 91→77-79 in B, and in C cratered the pro phase while leaving the junior phase
byte-identical. C's junior identity then held over the full grid: **junior deltas C−A = 0.00±0.00
on every metric, every cell, every seed** – the gate is the phase split.

`tests/condition.test.ts` per arm, predicted → measured: A green (gate log) → green 44/44.
B «capture green, literal pins red» → exactly that: count 41550 / hash e6b0c709 byte-identical
(zero draws anywhere near this knob), 3 red = the two B2 free-week-ladder literals (95/90 assume
base 8; base 5 arithmetic lands 65/60) and the POST-draw dense-rank pin (90 → 95 – slower rivals
re-deal who holds counting points). C «all green – no unit fixture holds a counting W result» →
green 44/44. The capture cannot see any of these arms, as §4 predicted it could not.

### The base game per arm (cell `none`; paired Δ vs A, ± = SEM; pro pairs need the gate in both)

| 25k · middle | A | B (Δ vs A) | C (Δ vs A) |
| --- | --- | --- | --- |
| junior condition | 89.7 | **−1.56 ± 0.35** | 0.00 ± 0.00 |
| pro condition | 83.0 | **−1.63 ± 0.59** | **−1.89 ± 0.32** |
| pro weeks under medical floor | 1.03% | −0.08 ± 0.18 pp | +0.17 ± 0.13 pp |
| pro onsets / arrival vetoes | 5.19 / 1.10 | −0.11 ± 0.48 / −0.36 ± 0.32 | −0.52 ± 0.38 / +0.19 ± 0.19 |
| weeks lost to injury (career) | 20.3 | **−2.78 ± 1.56** | −0.69 ± 1.13 |
| pro match wins | 247.9 | −4.6 ± 9.8 | −10.1 ± 6.3 |
| end W rank (positive = worse) | 38 | +9.5 ± 9.1 | +16.7 ± 12.1 |
| prize Δ | $3.10M | −$70k ± 354k | −$223k ± 258k |
| reached the pro gate / endings | 31/32 · 32 alive | **29/32** · 31 + **1 bankruptcy** | 31/32 · 31 + 1 injury |

| 8k · working | A | B (Δ vs A) | C (Δ vs A) |
| --- | --- | --- | --- |
| junior condition | 89.8 | **−2.24 ± 0.45** | 0.00 ± 0.00 |
| pro condition | 83.0 | **−1.59 ± 0.63** | **−1.15 ± 0.30** |
| pro weeks under medical floor | 0.86% | +0.22 ± 0.13 pp | +0.07 ± 0.09 pp |
| pro onsets / arrival vetoes | 4.55 / 0.74 | +0.36 ± 0.54 / +0.14 ± 0.19 | −0.29 ± 0.28 / +0.03 ± 0.16 |
| weeks lost to injury (career) | 17.1 | −0.16 ± 1.66 | +0.34 ± 0.84 |
| pro match wins | 243.9 | +5.9 ± 10.2 | −0.3 ± 2.7 |
| end W rank (positive = worse) | 33 | +10.1 ± 9.7 | **+5.7 ± 3.2** |
| prize Δ | $4.92M | **−$796k ± 574k** | −$298k ± 344k |
| reached the pro gate / endings | 31/32 · 31 + 1 injury | **29/32** · 29 + **2 bankruptcies** + 1 injury | 31/32 · **32 alive** |

Severity mix moves nowhere (minor/moderate ratios within noise in every arm). B's careers also
unlock EARLIER (−7.4 / −9.1 weeks to the gate): rivals bear the full base-5 with no slider, no
physio, no vacations, while the kid's policy compensates – the global drop makes her junior era
RELATIVELY easier, a side-effect nobody asked for.

### The masseur's uplift per arm (hired − none, same seed, default rung)

| cell · preset | A | B | C |
| --- | --- | --- | --- |
| 4/wk home · 25k – weeks lost | **−0.78 ± 0.39** | +0.16 ± 0.50 | **−0.75 ± 0.57** |
| 4/wk home · 25k – rehab receipts | 1.06 | 0.63 | **1.19** |
| 4/wk tour · 25k – pro condition | +1.29 ± 0.20 | +1.15 ± 0.20 | +0.97 ± 0.16 |
| 4/wk home · 8k – weeks lost | −1.25 ± 0.65 | −1.00 ± 0.49 | **−1.44 ± 0.49** |
| 4/wk tour · 8k – weeks lost | **−1.56 ± 0.62** | 0.00 ± 0.61 | **−2.03 ± 0.65** |
| 4/wk tour · 8k – pro condition / wins | +1.84 ± 0.27 / +9.6 ± 3.5 | +1.46 ± 0.24 / +7.0 ± 2.8 | +1.53 ± 0.33 / +9.4 ± 3.0 |

### Verdict, in his words

**B is not «гармонично» – it bleeds everywhere and the masseur SHRINKS.** The global cut lands
2/3 of its damage outside the place he aimed at: the junior era drops 1.6-2.2 condition (3.5-5
SEM), two careers per preset never turn professional inside 8 seasons, three new bankruptcies
appear across 64 base careers (the working preset loses ~$800k of prize money), and the one thing
the proposal was FOR – «массажист будет еще немного накидывать» – measures BACKWARDS: his rehab
receipts drop ~40% (1.06→0.63, 1.63→1.19) and his weeks-lost uplift goes to statistical zero in
two of four cells, because the world he works in is poorer, plays less and deals him thinner
layoffs.

**C is the shape of his sentence.** Junior era byte-untouched, rivals untouched; the pro phase
gets honestly harder exactly where he pointed – condition −1.2..−1.9 (4-6 SEM), wins −6..−10 at
25k, rank +6..+17, prize down inside noise, zero new bankruptcies – and the masseur's weeks-bought
channel reads AS LARGE OR LARGER than today (8k tour −2.03 vs −1.56; receipts held), though that
enlargement is directional (~1 SEM), not proven. The «накидывать» arithmetic also only works in C:
base 5 + slider 2 + his rung's +1 = 8 for a staffed pro against today's unstaffed 10.

**Recommendation**: if the 10→7 drop is wanted, ship it as C – pro-phase-only, on the masseur's
own boundary (three engine lines; capture and every test stay green) – and never as the global
constant. B should not ship in this form.

⭐ **RULED THE SAME DAY: «окей, делаем» – C SHIPPED**, as `ECONOMY.condition.proPhaseRecoveryBase
= 5` read through ONE helper (`recoveryBaseFor`, world/medical.ts) at all three kid readers –
`accrueCondition` and both 18.08 makeup expressions – exactly S3's measured arm-C shape promoted
from patch to constant. Juniors and all 199 rivals keep `recoveryBase = 8`. Pins in
tests/condition.test.ts (B2-pro): junior base 8, pro base 5, the boundary IS the ladder handover,
both makeup paths, the knob.

## 11. ⭐⭐ THE COMBINED GRID – everything the 22.08 rulings shipped, measured together

One branch now carries five game changes at once – recovery C (pro base 5), the dial's +1/+2/+3,
per-match tour pricing, the return-week session, and the team's results shares (coach 10%/5%,
masseur 3%/1.5% – docs/plans/the-team-share.md) – so the honest measurement is ONE grid with
everything on, not five deltas against five different bases. `tools/masseur-bench.ts` (S3's
phase-split extension + the new tallies: per-match bills, return receipts, both shares, coach
flat), 32 paired seeds × 2 presets × 7 cells, 416 weeks, plus the task-3 relief arms
(`--relief 1` vs the shipped 2 – the owner's «+2 за каждый круг не многовато?») on the tour cells.

### Predicted (written before the grid ran)

* **The base game is §10's C column** plus the coach's share coming off title/final cheques: base
  prize (family-kept) drops a few percent against §10-C; no new bankruptcies (the share only
  exists where a cheque does); junior era byte-identical to §10-C by construction.
* **The coach-%-of-prize table gets its "after" column**: flat-only was 5.7% (Alice) / 0.94%
  (Ines, the top). The share adds roughly 4–7% of gross prize (titles and finals dominate a good
  career's prize), so predicted after ≈ 8–12% at the Alice-shaped presets' early years and ≈ 5–8%
  lifetime – i.e. INSIDE the real convention's 5–10%, which is the plan's own «self-scales» claim.
* **The masseur's share** lands at roughly a third of the coach's on the same cheques
  ($60–130k/career at the 8k preset's ~$5M gross).
* **Home cells' condition uplift roughly doubles** at rungs 4/7 (+1→+2, +2→+3 on ~150 worked
  weeks): 4/wk home from +0.06..0.26 to ≈ +0.3..0.6, 7/wk home to ≈ +0.5..0.9, with the return
  session adding ≈ +0.1..0.2 more (one +1 week per untravelled tournament, ~25-35/career).
* **Tour cells get CHEAPER for the big rungs**: a typical travel week plays 1–2 matches, so
  per-match ($75–150) undercuts the 4/wk ($300) and 7/wk ($525) weekly bills – masseur pay in
  tour cells drops ~30–50% while the entry rung is roughly a wash; the uplift channels (condition
  +1..+2, wins at 8k) hold at relief 2.
* **Relief 1 vs 2**: the tour condition channel at relief 1 ≈ 55–70% of relief 2's (+0.9..1.3 at
  8k against +1.6..1.9), still ≥ 3 SEM; the wins channel ≈ +5..7 at 8k, hovering at the 2-SEM
  line. The rule agreed with the architect: **ship 1 if the tour channel keeps ≥2 SEM on its
  headline metrics** (pro condition, and wins where §7 had them ≥2 SEM); otherwise keep 2.
* **Solvency**: the parent-guard absorbs the stack (releases rise slightly at 25k); zero NEW
  bankruptcies vs the §10-C base in every cell.

### Measured

_(the grid runs after the freeze re-pin; filled below)_
