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
