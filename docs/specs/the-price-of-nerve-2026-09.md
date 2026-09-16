---
type: spec
status: reference
area: simulation-and-balance
canonical: false
last-reviewed: 2026-09-15
---

# The price of nerve – what a point of composure actually buys (round 42 #34)

The owner asked for this bench by name («давай бенч по composure заведём в раунд отдельным пунктом»)
and then asked to see it before ruling («давай посмотрим на бенч сначала, потом решим»). It exists
because round 42 #32's audit of two real careers found that the RATING prices composure at +1 per +5
of the wing – against +42 for groundstrokes – and could not resolve any residual beyond it. Two
careers cannot see an effect that small. This is the controlled measurement instead.

Instrument: `tools/composure-bench.ts`. Run: `npx vite-node tools/composure-bench.ts -- --sims 20000`.

## The design, and why its numbers are readable

**Paired arms.** Every arm plays the same 20,000 seeds against the same opponent, and two rows of a
block differ by ONE wing and nothing else – no re-drawn seed, no re-drawn opponent, no world. The
difference between two rows is therefore the wing's effect, and the pairing removes almost all of the
sampling noise that a 20,000-match comparison would otherwise carry.

**Both engines.** `fastMatchProbability` is the closed form the rating and the event card quote;
`simulateMatch` is the point loop her own matches run through, where nerve is spent per break point.
If composure is worth anything it has to appear in the second column and not the first – that is what
`nerveAndLegs`' own note in `match/point.ts` says the term is for.

**The arm was proven before it was trusted**, the house law in both directions: composure 0 against
composure 100, same build, same opponent, moved the loop by **+2.6pp** and the break-point save rate
from 53.6% to 56.8%. The wing is wired. It is not inert – it is small.

## Predicted, then measured (invariant 5)

The prediction was written into `docs/rounds/round-42.md` #34 BEFORE the run, so the measurement
could embarrass it. It did.

| claim | predicted | measured | verdict |
| --- | --- | --- | --- |
| ±20 composure → per-match win rate | 1–3pp | **0.4–0.6pp** | predicted 2–5× too generous |
| ±20 composure → deciding-set win rate | 3–6pp | **0.2–0.6pp** | predicted an order of magnitude too generous |
| ±20 stamina → per-match win rate | «smaller still» | **1.0–1.5pp**, i.e. 2–3× composure | wrong direction – stamina is the bigger of the two |
| the wing is detectable at all | yes | yes, but only in break points saved (+0.6pp per +20) | held |

## The price list – +20 of ONE wing, in the loop, 20,000 matches a cell

Two builds the game really dealt (round 42 #32's own two careers, rounded), against the professional
standing at rank 20 and at rank 80.

| build | wing | rating | Δrating | loop win% | **Δ win%** | BP saved | deciding sets |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: |
| big-shot, vs #20 | (as dealt) | 2116 | – | 64.9% | – | 57.1% | 59.5% |
| | groundstrokes +20 | 2287 | +171 | 82.9% | **+18.0pp** | 59.5% | 73.4% |
| | serve +20 | 2240 | +124 | 78.9% | **+14.0pp** | 60.4% | 70.6% |
| | return +20 | 2240 | +124 | 78.8% | **+13.9pp** | 57.4% | 69.7% |
| | stamina +20 | 2127 | +11 | 66.4% | **+1.5pp** | 57.2% | 62.2% |
| | **composure +20** | 2120 | +4 | 65.4% | **+0.4pp** | 57.8% | 59.9% |
| nerve build, vs #20 | (as dealt) | 1940 | – | 41.7% | – | 56.4% | 43.9% |
| | groundstrokes +20 | 2110 | +170 | 63.9% | **+22.2pp** | 58.8% | 58.4% |
| | return +20 | 2064 | +124 | 57.9% | **+16.2pp** | 56.5% | 54.6% |
| | serve +20 | 2064 | +124 | 57.6% | **+15.9pp** | 59.6% | 53.7% |
| | stamina +20 | 1951 | +11 | 43.2% | **+1.5pp** | 56.5% | 46.8% |
| | **composure +20** | 1944 | +4 | 42.3% | **+0.6pp** | 57.0% | 44.5% |

The same shape holds against #80 (composure +0.3pp / +0.5pp, groundstrokes +10.0pp / +17.6pp).

**Isolated sweep, core 62 against core 62**, the wing alone moved across the 40 points a career can
plausibly cover:

| wing | 42 → 82 | in deciding sets |
| --- | ---: | ---: |
| groundstrokes | 28.1% → 72.3% = **+44.1pp** | 35.1% → 65.1% |
| composure | 49.0% → 50.1% = **+1.1pp** | 48.7% → 49.3% |

**Forty times.** That is the whole finding.

## Where composure does and does not reach

* It reaches **break points saved**, and it is the only wing that reaches them through nerve: +20
  composure moves the save rate +0.6 to +0.7pp. ⚠ And +20 of SERVE moves the same statistic by
  **+3.3pp** – so even the pressure statistic composure exists for is dominated by serve.
* It does **not** reach deciding sets (+0.2 to +0.6pp) or tiebreak sets (≈0, and the sign wobbles).
  That is the surprise: the close-set retention that round 42 #32 read off two real careers
  (the nerve career keeping ~7pp more of its edge) does not survive a controlled arm. On real careers
  the split was confounded by opponent quality, and the confound was the whole signal.
* The RATING is not lying. It prices +20 composure at +4 points, and +4 rating is worth about 0.6pp
  at even odds – exactly what the loop delivers. **The rating is an honest report of a model that
  gives nerve almost nothing.** Any fix therefore belongs in the point loop, not in `ratingOf`.

## What a fix would have to be, if the owner wants one

To make +20 of composure worth what +20 of stamina is worth today (+1.5pp) the break-point term would
have to be roughly **2.5× its current size**; to make it worth a third of a serve point (+5pp), about
**8×**. That is a change to the physics of every match in the game – her matches, the AI brackets'
matches through the closed form's `nerveAndLegs`, the upset rate, the whole ladder's flow – so it is
a full re-measurement (`bench:radar`, `skill-gap-odds`, the upset-rate corridor), not a constant bump.

The fork, which is the owner's:

* **A – raise the price of nerve.** The game's fiction is that the head matters; today the engine
  disagrees by a factor of forty. Cost: a match-physics change and its full bench pass.
* **B – leave the model and stop advertising the wing.** The prologue draws a sector and the handover
  speaks about it; if nerve is worth 0.5pp, neither should promise otherwise. Cost: copy and the
  prologue's talent display, no physics.
* **C – both, in that order.**

## What this bench does not say

It measures ONE match at a time at full condition on hard. It says nothing about composure's effect
across a season through fatigue, injury or spirit – the wing may well pay somewhere the match loop
cannot see, and a career-level arm (N careers, the wing overridden after `rollPotential`) is the
honest way to ask that. It was deliberately not run here: the match-level answer is so one-sided
(forty times) that a career arm would be measuring a rounding error's descendants.

---

# The build, after his ruling (15.09)

He ruled **A** – raise the price of nerve – and gave the reason the build has to serve: «у нас будет
честно понятно, что каждый показатель влияет на что-то в игре», with the psychologist wave beside it
and Federer as the case («в ранние годы был вспыльчив, а потом осознал это и изменился»).

## The three levers, and why these three

**1. The pressure set widens.** Today nerve acts on ONE kind of point: `modifiedPServe` docks the
server `(1 − composure/100) × BIG_POINT_MAX_PENALTY` on a break point, and break points are a
measured **11.23%** of served points. Everything else in a match is nerve-blind. The honest way to
make nerve matter more is to let it act where a tennis player actually feels it – break points, set
points, match points, every point of a tiebreak, and the deciding set's closing games – rather than
to make one point monstrous. Rough arithmetic: that takes the pressure set to ~25% of points, a
**2.2×** on its own, with per-point physics that stay believable.

**2. The term becomes contested.** Today only the SERVER's nerve is read; a calm returner converts no
better than a nervy one. Making it `(receiver.composure − server.composure)` shaped – the exact form
`nerveAndLegs` already uses for the same reason – doubles the span for a given gap and, more
importantly, makes the term **exactly zero when the two are level**. That is what keeps every
symmetric calibration fixture, the tour's hold rate and the upset corridor untouched by construction
rather than by luck.

**3. The penalty is scaled to a MEASURED target.** 2.2× from the set and ~2× from the contest is
≈4.4×; the remaining factor to reach the target comes from `BIG_POINT_MAX_PENALTY` itself
(0.03 → ≈0.055), which puts a composure-50 server facing a composure-90 returner about 2.2pp of serve
probability down on a big point. That is inside the existing clamps and reads like tennis.

⚠ **`COMPOSURE_K` IS RE-FITTED, NEVER RE-GUESSED.** It is not a design knob – it is the closed form's
fitted mirror of what the loop does (its own note records the fit: predicted 1.68e-5 from the flat
arithmetic, fitted 2.22e-5, the gap being the leverage a break point carries). Move the loop and the
mirror must be re-fitted with the repo's own instrument: `npx vite-node
tools/r38-closed-form-residual.ts -- --fit`. Predicted after the change: ≈8× today's value. If the
residual does not come back to its current rms (0.36pp against a 0.35pp sampling floor), the closed
form and the loop have been left describing different games – which is the one failure this change
must not ship.

## The target, and it is the one number still his

Architect proposes **+20 composure ≈ +4pp of match win rate** – against serve's +14pp and
groundstrokes' +18pp, that makes nerve a real secondary wing without re-cutting the ladder's flow.
Two reasons not to go bigger: the player cannot train the wing directly (the psychologist is the only
lever, and item 35 caps it), and a wing worth a serve point would decide careers off the seed draw,
which is the complaint that started this.

## The re-measurement, which is the deliverable beside the change

Nothing ships until all of these are back, on a quiet machine:

* `tools/r38-closed-form-residual.ts` – the re-fit, and the residual back inside its sampling floor.
* `tools/composure-bench.ts` – this bench again, as the acceptance test: the price list is the thing
  being changed, so it is the thing that states whether the change landed.
* `tools/skill-gap-odds.ts` and the upset corridor – a nerve term that acts on a quarter of the
  points can move the upset rate, and the upset rate is a published number we match on purpose.
* `bench:radar`, `bench:econ` – the ladder's flow and the money that follows it.
* The frozen capture: this touches no draw, so `tests/condition.test.ts` must NOT move. If it does,
  something took a die it had no business taking.

---

# The build, PREDICTED FIRST (round 42 bundle 15, 16.09)

⚠ **EVERY NUMBER IN THIS SECTION WAS WRITTEN BEFORE A LINE OF `src/` MOVED**, so the measurement
below it can embarrass it. Invariant 5, and the round's own law: a miss is reported as a miss.

## What the build actually is, and one place it departs from the plan above

Levers 1 and 3 are built as §the build describes them. **Lever 2 is built as an ADDED contested
term rather than as a re-shaped one, and the reason is the plan's own stated goal.**

§the build asks for `(receiver.composure − server.composure)` shaped, «so it is **exactly zero when
the two are level**. That is what keeps every symmetric calibration fixture, the tour's hold rate and
the upset corridor untouched by construction rather than by luck.» Re-shaping the EXISTING term
cannot deliver that sentence: today's break-point dock is `(1 − server.composure/100) ×
BIG_POINT_MAX_PENALTY`, which is **not** zero for a level pair – at composure 62 it is 1.14 pp off
the server on every break point. Replacing it with a difference DELETES that dock, raises the server's
break-point win rate for every pair in the game and moves the tour's hold rate. The construction
argument would have been false in exactly the place it was invoked.

So the Klaassen–Magnus dock is left **byte-identical** on the break point where it has always lived –
it is an empirical fact about servers, not a composure knob – and the nerve price is raised by a
**second, contested term** over the widened pressure set, in the shape `nerveAndLegs` already uses.
A pair level in composure gets `x + 0 === x` on every point of the match, which is the identity the
hold rate, the fairness fixture and the upset corridor stand on.

The price is therefore carried by a NEW constant (`PRESSURE_NERVE_MAX`) rather than by
`BIG_POINT_MAX_PENALTY` moving 0.03 → 0.055. The plan's arithmetic for the size is unchanged and is
P2 below.

## The predictions

| # | claim | predicted |
| --- | --- | --- |
| **P1** | the widened pressure set, as a share of served points (break + set + match + every tiebreak point + the deciding set's closing games), against today's 11.23% | **22–28%** |
| **P2** | `PRESSURE_NERVE_MAX`, the p swing at a 100-point composure gap, needed to reach the target | **0.050–0.060** |
| **P3** | acceptance: +20 composure vs the standing at #20, both audited builds (today +0.4pp / +0.6pp) | **+3.5 to +4.5pp** |
| **P4** | the other four wings' prices, which this touches nowhere | **move under 0.3pp** |
| **P5** | a pair LEVEL in composure – hold rate, the fairness fixture, every symmetric band | **byte-identical, not merely close** |
| **P6** | `COMPOSURE_K` re-fitted (today 2.2e-5) | **1.5–2.2e-4, i.e. 7–10×** |
| **P7** | `STAMINA_K` re-fitted (today 7.0e-5) – the loop's stamina channel is untouched | **within 5% of 7.0e-5** |
| **P8** | the residual's rms after the re-fit, against its 0.35 pp sampling floor at n=20,000 | **≤ 0.40 pp**, worst cell ≤ 1.2 pp |
| **P9** | the upset corridor (`skill-gap-odds` §C) – the term is zero between level players and the field's composure spread is narrow | **moves under 0.5 pp** |
| **P10** | the frozen MAIN capture, `tests/condition.test.ts` – this takes no new draw | **unchanged: 41550 draws, hash `e6b0c709`** |
| **P11** | `bench:radar` – the ladder's flow | **headline shares move under 2 pp** |
| **P12** | `bench:econ` – the money that follows the ladder | **corridor medians move under 5%** |
| **P13** | the calibration pin «composure 100 vs 0 wins in (0.50, 0.60)» – a 100-point gap is five times the target's 20 | **BREAKS, landing 0.68–0.75.** A deliberate re-aim under #34, not a regression |

⚠ **P2's arithmetic, so it is scaled and not chosen.** A +20 composure player meets a level opponent:
on a pressure point she serves, her p rises by `20/100 × K`; when she receives, the server's p falls
by the same. So her point-win probability rises by `0.2K` on every pressure point, and her average
over the match rises by `pressureRate × 0.2 × K`. Groundstrokes buys +18.0 pp of match win for a
symmetric per-point edge of `20 × RALLY_K = 0.022`, i.e. ≈0.82 pp per 0.001 of flat edge. Pressure
points carry more leverage than flat ones (the same reason `COMPOSURE_K` fits 1.32× its own flat
arithmetic), so allow ≈1.7× for it: the 3.5 pp still owed needs `0.25 × 0.2 × K ≈ 0.0025`, i.e.
**K ≈ 0.05**. §the build's own independent estimate – «a composure-50 server facing a composure-90
returner about 2.2 pp of serve probability down on a big point» – is `0.4K = 0.022`, i.e. **K =
0.055**. Two roads, one band.

## Measured (round 42 bundle 15, 16.09)

Instruments, all on a quiet machine, 20,000 matches a cell unless stated:
`tools/pressure-set-census.ts` (new), `tools/composure-bench.ts`, `tools/r38-closed-form-residual.ts
-- --fit`, `tools/skill-gap-odds.ts`, `tools/radar-bench.ts`, `tools/econ-bench.ts`.

⚠ **Arm provenance.** The A arm is this tree with the two #34 constants reverted in place
(`PRESSURE_NERVE_MAX → 0`, `COMPOSURE_K → 2.2e-5`), not a worktree at an older commit – both arms
therefore contain the reader and only the constants differ. The baseline `composure-bench` run
reproduced the price list in §the price list above to the decimal, and the baseline residual re-fit
returned `K_STAM 6.972e-5 / K_COMP 2.2215e-5, rms 0.36 pp` – i.e. the shipped constants – which is
what says the instrument was reading the pre-change code.

| # | claim | predicted | measured | verdict |
| --- | --- | --- | --- | --- |
| P1 | the widened pressure set, share of points | 22–28% | **18.5%** (mirror pair; 18.0% / 18.1% against the standing at #20 / #80) | **MISS – narrower than the plan's «~25%»** |
| P2 | `PRESSURE_NERVE_MAX` | 0.050–0.060 | **0.07** | **MISS, and P1 is the reason** |
| P3 | +20 composure vs #20 | +3.5 to +4.5 pp | **+4.1 pp** (big-shot) · **+4.8 pp** (nerve build) | HIT on the headline row; the nerve build runs 0.3 pp over the band |
| P4 | the other four wings move under 0.3 pp | | groundstrokes **+0.6**, return **+0.4**, serve **+0.3**, stamina **−0.1** | **NARROW MISS on groundstrokes** |
| P5 | a level pair is byte-identical | | ATP hard hold **0.78681362**, WTA **0.66370895**, fairness **0.49955000** – identical to 8 dp with the term at 0.07 and at 0 | **HIT, exactly** |
| P6 | `COMPOSURE_K` re-fit | 1.5–2.2e-4 (7–10×) | **2.20575e-4 free fit → ships 2.2e-4, exactly 10×** | HIT, at the top of the band |
| P7 | `STAMINA_K` within 5% of 7.0e-5 | | **6.933e-5, −1.0%** – and it is left at 7.0e-5 | HIT |
| P8 | residual rms ≤ 0.40 pp, worst ≤ 1.2 pp | | **rms 0.40 pp, worst −1.11 pp** (315 cells); held-out **0.65 pp / −1.72 pp** | HIT, on the boundary |
| P10 | the frozen MAIN capture | unchanged | **unchanged** – `tests/condition.test.ts` and `tests/rivals.test.ts` green, 108/108 | HIT |
| P13 | the «composure 100 vs 0» calibration pin | breaks, landing 0.68–0.75 | **0.7345** | HIT – re-aimed to (0.65, 0.80) |

### P1, the miss that moved P2

`tools/pressure-set-census.ts`, 4,000 matches a block, per played point:

| member | share |
| --- | ---: |
| break point | 11.22% (the 11.23% the old price was scaled against, reproduced) |
| every point of a tiebreak | 2.60% |
| set point | 3.01% |
| match point | 1.17% |
| deciding set, closing games (`DECIDER_CLOSE_FROM` 5) | 4.57% |
| **the union, `isPressurePoint`** | **18.54%** |
| (the five summed, which double-counts) | 22.57% |

The overlap is 4.0 pp: a match point is nearly always also a set point and often a break point. The
plan's «~25%» added the members up; the engine takes the union, because a point is either tight or it
is not. **1.65× the old set, not 2.2×** – so the constant had to be 1.35× the plan's estimate, and
0.05 × 1.35 = 0.0675, which is where 0.07 came from. P2's miss is P1's miss carried forward, and
neither is a modelling error: the estimate was arithmetic and the measurement is a census.

### The price list, new beside old – +20 of ONE wing, vs the standing at #20

| build | wing | BEFORE | **AFTER** |
| --- | --- | ---: | ---: |
| big-shot | groundstrokes +20 | +18.0pp | **+18.6pp** |
| | serve +20 | +14.0pp | **+14.3pp** |
| | return +20 | +13.9pp | **+14.3pp** |
| | stamina +20 | +1.5pp | **+1.4pp** |
| | **composure +20** | **+0.4pp** | **+4.1pp** |
| nerve | groundstrokes +20 | +22.2pp | **+21.8pp** |
| | return +20 | +16.2pp | **+15.6pp** |
| | serve +20 | +15.9pp | **+15.7pp** |
| | stamina +20 | +1.5pp | **+1.2pp** |
| | **composure +20** | **+0.6pp** | **+4.8pp** |

**The target is hit on the row it was set against.** Nerve is now a real second-echelon wing: three
times stamina, a little under a third of a serve point, a little under a quarter of a groundstroke.

⚠ **P4's narrow miss is the reference row moving, and it is worth understanding rather than
dismissing.** The big-shot build carries composure 52 against a professional field that sits higher,
so its «as dealt» baseline falls 64.9% → 62.0% – she now pays for her nerve, which is the whole
point. Every other wing's +20 is then measured from a lower baseline, where the odds curve is
steeper, so the same skill buys a slightly larger percentage. Nothing in serve, return, groundstrokes
or stamina was touched.

**The isolated sweep, core 62 against core 62, the wing alone moved across the 40 points a career can
cover:**

| wing | BEFORE | **AFTER** |
| --- | ---: | ---: |
| groundstrokes 42 → 82 | +44.1pp | **+44.1pp** – untouched, to the decimal |
| composure 42 → 82 | +1.1pp | **+9.2pp** |

**Forty times → 4.8 times.** That is the whole change, in one line.

⚠ **The extreme arm moved with it**, as it must: composure 0 against composure 100 on the same build
moved the loop **+2.6 pp before and +23.6 pp after**, and the break-point save rate 53.6%→56.8%
before, 49.1%→59.3% after.

### The upset corridor, before and after – `tools/skill-gap-odds.ts`

⚠ **P9 MISSED, and the direction is the good one.** The corridor moves by **1.0–1.6 pp** on the wide
gaps, not the predicted «under 0.5 pp» – and the fit to the published curve gets slightly BETTER, not
worse.

| pair | LIVE +spread | BEFORE | **AFTER** |
| --- | ---: | ---: | ---: |
| #1 vs #10 | 24.7% | 30.4% | **29.2%** |
| #50 vs #100 | 38.0% | 41.7% | **40.7%** |
| #50 vs #200 | 19.9% | 23.3% | **21.6%** |
| #50 vs #300 | 12.5% | 11.0% | **9.4%** |
| #200 vs #300 | 37.2% | 31.4% | **30.4%** |
| **mean absolute miss, his five rows** | | **4.02 pts** | **3.74 pts** |
| **mean absolute miss, all 17 pairs** | | **2.41 pts** | **2.40 pts** |

**Why it moves at all, given the term is zero between level players: composure correlates with rank.**
`rivalMatchPlayer` composes a professional's nerve from her quality, so the favourite in a wide-gap
pair is also the calmer player, and a contested nerve term adds to an edge that already existed.
Upsets therefore get slightly rarer as the gap widens – which is what the live Elo curve says happens
too, and is why three of the five acceptance rows moved toward it. ⚠ The prediction was wrong because
it assumed the field's composure was flat; it is not, and that is a fact about the cohort rather than
about this change.

⚠ **HER OWN EDGE IS BYTE-IDENTICAL BETWEEN THE ARMS** – `+0.06 core → 50.2%`, `+1 core → 52.8%`,
`+6.7 core → 68.3%`, all five rows to the decimal. Those sweeps move the core skills with composure
level, so P5's construction shows up a second time in an instrument that was not built to test it.

### `bench:radar` – the ladder's flow (P11, HIT)

The fog table moves by **0.02 to 0.26 skill points** and the headline verdicts do not move: week 1
`self 11.77 vs elite 10.83 (1.09x)` in both arms, week 18 `1.67x → 1.64x`. The ceiling floor, the
empty state and every blurb are unchanged. Nothing about what a coach can see moved.

### ⚠ One note on the acceptance run's provenance

The 20,000-match acceptance run above was taken at `PRESSURE_NERVE_MAX = 0.07` **before**
`COMPOSURE_K` was moved to 2.2e-4, and it is still the right artefact: `simulateMatch` reads
`basePServe` and `modifiedPServe` and never `calibratedPServe`, so `COMPOSURE_K` is unreachable from
the point loop. The bench's `loop` column – the whole price list – provably cannot see it; only the
`closed` column can, and that is the column the residual instrument measures instead.

### `bench:econ` – ⚠ P12 MISSED, and the miss belongs to the instrument

Both arms walked 9 presets × 2 policies × 30 seeds to 14→20. The prediction was «corridor medians
move under 5%». Measured, on the `player` rows:

| preset | end funds A | end funds B | reach A | reach B |
| --- | ---: | ---: | ---: | ---: |
| working · self | $1,081,375 | $742,222 | 30/30 | 30/30 |
| working · budget | $1,190,903 | $906,345 | 30/30 | 30/30 |
| working · middle | $1,247,067 | $1,116,670 | 29/30 | 30/30 |
| middle · self | $431,925 | $460,719 | 29/30 | 29/30 |
| middle · budget | $680,412 | $703,990 | 29/30 | 29/30 |
| middle · middle | $1,010,162 | $528,169 | 29/30 | 29/30 |
| middle · high | $929,282 | $746,257 | 29/30 | 29/30 |
| wealthy · high | $1,557,331 | $1,575,655 | 30/30 | 30/30 |
| wealthy · elite | $1,204,153 | $1,356,409 | 29/30 | 30/30 |

**The medians move by up to ±50% and the sign is inconsistent** – four up, five down – which is what
noise looks like, not what a physics change looks like. It is the failure mode
`docs/specs/coach-every-cheque-2026-09.md` recorded a week ago in its own words: prize money is
heavy-tailed enough for two careers to own a thirty-career median once a changed wallet changes an
entry decision.

**The two figures in this bench that are NOT heavy-tailed did not move**, and they are the ones it
was built to answer:

* **reach** – «can the tennis start paying for itself?» – is 29 or 30 of 30 on every `player` preset
  in BOTH arms, and the grinder arm's reach moves within its own noise (±5 of 30, both directions);
* the **coaching bill** is within a few per cent everywhere ($75,483 identical on middle·high).

So the honest verdict is: **the ladder's flow does not move (`bench:radar`, reach), and the wallet
corridor cannot be resolved at n=30.** A run that could resolve it needs a paired-seed diff of the
kind `composure-bench` uses, which `econ-bench` is not built for.

### The frozen careers – the per-key control, and what it proves

⚠ **Match physics moves every career that played a match, so the eighteen frozen hashes WILL move.**
The protocol `tests/coachTravelEdgeFixtures.ts` demands before a re-freeze is the per-key diff, and
it was run: `tools/frozen-key-diff.ts`, all nine presets on the `player` policy, 156 weeks, on THIS
tree against a worktree at `fe4686d7` – which is «my change reverted», because nothing of this bundle
is committed and no other work has landed since.

**42 of 91 keys never moved on any of the nine careers**, and the list is the receipt:

* ⭐⭐ **`rngMain` – byte-identical on all nine** (`d84bcbf0c481`). The world's dice did not move.
  ⚠ Read as confirmation rather than as proof: that key is *designed* to be stable (the per-week MAIN
  count is fixed and input-independent), so the proof is `tests/condition.test.ts`, whose 41550-draw
  capture and `e6b0c709` hash are green untouched.
* **`schemaVersion`, `potential`, `temperament`, `profile`, `seed`, `week`, `plan`** – unmoved. No
  schema move; every girl was dealt the same girl and walked the same weeks.
* **`composureBonus`, `psychologist*`, `sparring*`** – unmoved. Item 35's key is not in this bundle.

**33 to 44 keys moved per career**, and every one of them is downstream of a played match: `results`,
`skills`, `events`, `kidRank` / `kidRankWta` / `kidRankDomestic`, `careerTotals`, `trophiesByTier`,
`seasonHistory`, `bestFinishByTier`, `fundsCents`. `skills` moving is not a development change –
`matchBonus` reads match results, so different matches grow her differently.

⚠ `vacations` (6 of 9) and `financeWeeks` / `offers` also carry round 42 #49(b) and #47, which are in
the same tree; the control does not separate the three items and was not asked to.

**⚠ THE STAMP IS NOT TAKEN HERE.** The eighteen constants are left at their old values and the three
`coach-travel-edge*` files are expected RED on this branch. Re-freezing is the architect's call, and
the per-key diff above is the evidence it is owed.
