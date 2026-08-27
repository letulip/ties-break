---
type: spec
status: draft
area: engine/injury
canonical: false
last-reviewed: 2026-08-27
---

# The shape of the retirement hazard – what decides who stops, and what does not

> ⭐⭐ **§§0-12 ARE THE MEASUREMENT, TAKEN BEFORE ANYTHING WAS BUILT. §13 IS THE FIX, BUILT THE SAME
> DAY AGAINST IT** – the recommendation in §10.6, shipped: the calibration bench re-aimed first, then
> `retireHazard` given its own condition term, shaped as a redistribution whose population-weighted
> mean is 1.0. ⚠ §10.1's preferred seam (`MatchOptions`) did not survive contact with a test and the
> term ships on `MatchPlayer` instead – §13.5 has the failure and the argument. Every "today" and "shipped" in §§0-12 means **before** that
> fix; §13 carries the after-numbers beside the before-numbers and does not edit a single one of
> them, because the measurement is the evidence the fix was graded against and re-writing it would
> destroy the grading.

**This is a MEASUREMENT and a finding. Nothing is built here and no engine number moves.** The
instrument is `tools/retirement-shape-probe.ts` (new, `tools/` only). Every number below is
reproducible from it and from `tools/pro-season-probe.ts`; the command that produced each is named
beside it.

**Reads:** `docs/specs/match-retirement.md` (the mechanism and its calibration),
`docs/specs/round16-injuries.md` (the consequence table, and §2's already-measured half of this
finding), `docs/research/retirement-and-withdrawal.md` §7 (the anchor),
`docs/specs/fatigue-reprice-2026-08.md` (the week's price), `docs/rounds/round-26.md` #14b.

---

## 0. Why this exists – the owner, 27.08

He has played the same half-season twice and caught two on-court retirements both times, both
immediately after his first good results – a deep run at a W500 after a string of first-round exits,
then two rounds won at a Slam:

> «Что-то у нас не то с рычагом травм – это очень неприятная история, тем более что она еще и
> воспроизводится второй раз подряд на этом же отрезке»

And, told that the replay reproduces because the streams are seed-deterministic:

> «этот аргумент мне совершенно не нравится. Надо сделать здоровый механизм по травмам. Подумать
> над ним еще раз значит, посмотреть почему это воспроизводится вообще и вернуться к показателям
> травм из ресерчей наших, при этом наказывать тех, кто УЖЕ в низкой кондиции приезжает и делает
> это ПОСТОЯННО (гриндер), а если я приезжаю с 80-90 на турнир, то как будто вполне есть высокий
> шанс доиграть.»

**His design target, stated plainly: arriving fresh should buy safety, and arriving worn out
repeatedly should cost.** This document says, in numbers, how far the shipped model is from that –
and it is further than "a knob is mis-set".

### 0.1 The five answers, on one screen

1. **Arriving fresh buys NOTHING.** Arriving at 80+ she retires from 0.70% ± 0.13% of her matches;
   arriving at 70–79, 1.04% ± 0.34%. A 0.9-standard-error difference, and the model predicts
   **exactly** zero difference because `conditionMatchFactor` returns exactly 1 above condition 70.
   Arriving at 90, at 95 or at 100 carries the same retirement risk as arriving at 70, to the last
   decimal: **×1.00** across the entire range he named. (§6)
2. **The dominant term is MATCH LENGTH, worth ×21.** Arrival condition is worth ×1.82 at the
   absolute legal extreme and ×1.00 anywhere he is likely to be. (§4)
3. **Going deep is not "harder" – it is MORE DRAWS FROM THE SAME URN.** Per-match risk is flat by
   round (R32 1.07%, SF 1.42%, F 0.98%). A five-match title week is 5.7× the retirement risk of a
   first-round exit purely because it is five matches. **The only thing in this model that raises
   his risk is winning.** (§5)
4. **The grinder is punished ×1.61 per match** for arriving 47 condition points worse every week –
   and the model's own ceiling across that entire span is ×1.60, so **the engine is already
   delivering all the condition effect it has.** At equal VOLUME it inverts: `round16-injuries.md`
   §2 measured the careful player retiring MORE often than the grinder (0.730 vs 0.698 a season). (§8)
5. **The LEVEL is right; the SHAPE is wrong.** The pro arm reads 2.71% of her matches against the
   research's 2.73%. Nothing here says `RETIRE_K` is mis-set – §11 says explicitly that a fix which
   lowers the rate trades one wrong number for another. (§7, §11)

**Recommendation (§10.6):** re-aim the calibration bench first – it is blind below the knee and
cannot grade any of this – then give `retireHazard` its own condition term, shaped as a
**redistribution** whose population-weighted mean is 1.0, so the anchor holds by construction and
only WHO stops changes.

---

## 1. Why this is its own file and not a section of `fatigue-reprice-2026-08.md`

It was offered a home there and it does not fit, for three reasons:

1. **Different mechanism, different owner.** `fatigue-reprice-2026-08.md` prices the WEEK – condition
   drain, the recovery ladder, the vacation table – and its §5 is about the WEEKLY injury roll. What
   is wrong here is a PER-POINT in-match hazard that lives in `src/engine/match/point.ts` and is
   specified in `docs/specs/match-retirement.md`. Filing a match-engine finding under a
   season-economy spec is how a number gets tuned by whoever is reading the wrong document.
2. **It amends three other specs, and none of them is that one.** It extends
   `match-retirement.md` §4.1, confirms and sharpens `round16-injuries.md` §2, and corrects
   `docs/rounds/round-26.md` #14b. A section inside the re-price spec would be invisible from all
   three.
3. **The re-price is a GRADED spec.** Its §6 is a five-number acceptance checklist that a bench
   reports against. Adding a sixth finding with its own targets to that list would make the
   checklist ambiguous about what "passed" means.

A one-line cross-reference has been added to `fatigue-reprice-2026-08.md` §5, because a reader
standing in front of the injury curve needs to know the other door exists and is the larger one.

---

## 2. The instrument, and how its own read was checked

`tools/retirement-shape-probe.ts`. Two parts: PART A is arithmetic over the shipped functions with
no career walked; PART B walks careers through the public engine commands only.

**⚠ The ordering hazard.** Round 26 #14b found `tools/pro-season-probe.ts` reading the body BEFORE
the tournament resolved, so every onset opened by `retirementInjury` – called from
`finalizeTournament`, `src/engine/world.ts:874` – landed after the check and vanished. This probe
reads in this order and the source says so at each step:

```
tickWeek                 the run is SIMULATED; world.condition still holds the value every match
                         of it was played at
READ arrival + matches   here, and only here
skipTournament           -> finalizeTournament: strain charged, retirementInjury opened
READ the body            after
```

**And the read is CHECKED, not asserted.** Three arms, printed above every result:

| arm | what it proves | reading (16 careers × 6 seasons × 3 policies) |
| --- | --- | --- |
| (a) every kid retirement must be followed by an open injury – `finalizeTournament` calls `retirementInjury` unconditionally on `retiredMatch` (world.ts:874) and step 1c has already found her healthy, so this is an identity of the engine | that the body is read AFTER the run resolves | 34/34, 65/65, 57/57 – **identity holds in all three arms** |
| (b) every kid match is RE-SIMULATED at its stored `MatchRecord.seed` off the frozen `pendingTournament.players` and must reproduce winner AND scoreline | that the snapshot this probe reads is the one the engine played | **0 mismatches in 13,529 matches** |
| (c) within one run, every kid match must carry the SAME frozen `players[KID_ID].stamina` | the no-within-week-fatigue claim, as a testable identity | **0 drifting runs of 3,504 multi-match runs** |

### 2.1 ⚠ Arm (a) found a SECOND, still-live leak of the round-26 #14b bug

On this file's first run, arm (a) FAILED: the grinder arm read 65 retirements off
`MatchRecord.retiredId` against 60 door onsets, and the pro arm 57 against 55. The probe was using
`tools/pro-season-probe.ts`'s door-counting idiom, which counts an onset only on the
`world.injury !== null && !wasInjured` EDGE. `rollInjury` clears an expired layoff at tick step 1c,
so **a week that starts injured, is cleared at 1c, and then produces a retirement injury at finalize
begins AND ends with `world.injury` set: the edge never fires and the onset is invisible.** Same
family as #14b, different guise, and it is still shipped in `tools/pro-season-probe.ts`.

The fix here is to count onsets off the onset's own sentence instead of off the edge.
`onsetInjury` (`src/engine/world/injury.ts:412`) emits exactly ONE `'injury'` event per onset and
its whole vocabulary is six prefixes; the only other `'injury'`-typed events in the engine are the
walkover and the medical withdrawal (`src/engine/world/phaseHerWeek.ts:298`, `:317`), neither of
which is an onset. After the change all three arms read the identity exactly.

**This is a probe defect, not an engine defect**, and it is recorded because the affected numbers
are somebody's acceptance numbers – see §9.

---

## 3. The model, verified line by line – and three corrections

Everything in this section was re-derived from source before anything was built on it.

| claim | verdict | citation |
| --- | --- | --- |
| `retireHazard(pointNumber, stamina) = RETIRE_K × spentness(...)`, `RETIRE_K = 0.07` | **confirmed** | `src/engine/match/point.ts:141-142`, `:151` |
| `spentness` is exactly 0 at or below `FATIGUE_START = 120` points | **confirmed** | `src/engine/match/point.ts:59`, `:119-120` |
| her match `stamina` is condition-scaled | **confirmed** | `src/engine/world/player.ts:211`, `:220` |
| `conditionMatchFactor` has `matchStrengthKnee: 70` and returns exactly 1 above it | **confirmed** | `src/engine/condition.ts:118-122`, `src/engine/economy.ts:1903-1904` |
| condition does NOT fall between rounds inside a tournament | **confirmed, and measured** – §2 arm (c), 0 drifting runs of 3,504 | `src/engine/world.ts:770-777` |
| `masseurTourRelief` reduces the after-the-fact charge only | **confirmed** – it is an argument to the same one-shot clamp | `src/engine/world.ts:771` |

### 3.1 Correction – it is a running SUM against ONE uniform, not a per-point coin flip

`simulateMatch` draws one uniform per side for the whole match and compares it against a
**non-decreasing running sum** of the hazard (`src/engine/match/engine.ts:92-93`, `:196-201`):

```ts
const retU: [number, number] = [retRng(), retRng()]        // once, at the top
retH[0] += retireHazard(pointNumber, players[0].stamina)   // every point
const side = retH[0] > retU[0] ? 0 : retH[1] > retU[1] ? 1 : null
```

So P(she stops within N points) is **exactly min(1, Σ h)** – not `1 − Π(1 − h)`. The difference is
(Σh)²/2. Recomputed on the engine's own form, base stamina 70:

| match length | product form (as previously circulated) | **the engine's own form** |
| --- | --- | --- |
| 150 points | 0.29% | **0.29%** |
| 200 points | 2.02% | **2.04%** |
| 260 points | 6.03% | **6.22%** |
| 260 points at condition 30 | 9.47% | **9.95%** |

Small at these levels, and it changes no conclusion. It is recorded because it changes what the
mechanism IS: a retirement is not a repeated coin flip, it is **a deterministic threshold on
accumulated exhaustion against one number drawn before the first ball.**

### 3.2 Correction – the condition lever's ceiling is ×1.82, not ×1.57

×1.57 is the ratio of condition 30 to condition ≥70 in the product form. The lowest condition she
can legally take a court on is `medicalFloor: 15` (`src/engine/economy.ts:1998`; below it she is
withdrawn on medical grounds, `src/engine/world/phaseHerWeek.ts:317`), and the clamp's own range is
0..100 (`src/engine/economy.ts:1655-1656`). On the engine's form:

* arriving at 90 → arriving at 70: **×1.00** (identical to the last decimal – this is the owner's own range)
* arriving at 90 → arriving at 15, the floor: **×1.82**
* arriving at 100 → arriving at 0, the whole clamp: **×2.05**

### 3.3 ⭐ Correction – condition has a SECOND channel into the hazard, and it is the larger one

`conditionMatchFactor` does not only scale `stamina`. It scales `serve`, `ret`, `composure` and
`groundstrokes` in the same expression (`src/engine/world/player.ts:216-221`). So condition also
moves **how long the match is**, which is the quantity the hazard integrates – and that channel is
worth up to ×21, against the stamina channel's ×1.82.

`match-retirement.md` §4.1 assumed the sign of that second channel: *"The GRINDER lives at condition
~27, is scaled down by the same factor, and loses her opener in ninety points – collecting no
retirement hazard at all."* **Measured, that is not what happens at these policies.** Mean match
length by arrival bucket, pooled over 13,529 of her matches:

| arrival | matches | mean points |
| --- | --- | --- |
| ≥ 90 | 3,251 | 147 |
| 80–89 | 883 | 143 |
| 70–79 | 866 | 141 |
| 60–69 | 636 | 145 |
| < 60 | 7,893 | **153** |

Her matches get **longer** as she arrives worse, not shorter. The mechanism is the one §4.1 did not
consider: `conditionMatchFactor` drags a strong girl DOWN TOWARDS THE FIELD, and a match against a
level opponent runs longer than a match she wins 6-1 6-1. So the second channel does not reliably
protect the worn-out player either; at the point in a career where she is stronger than her draw, it
works against her.

---

## 4. ⭐ THE DOMINANT TERM, IN ONE LINE

> **The model's dominant term is MATCH LENGTH. Everything else is a rounding error beside it:
> length swings the retirement risk ×21 across the range this game actually plays, arrival
> condition swings it ×1.82 at the absolute extreme and ×1.00 anywhere between 70 and 100 – so the
> engine cannot tell a girl who arrives at 95 from a girl who arrives at 70, and the girl who plays
> the longest matches is the one who is winning.**

The full table, from `tools/retirement-shape-probe.ts` PART A – P(she retires in one match), raw
stamina 70:

```
  cond  factor  stam     120pt   150pt   180pt   200pt   230pt   260pt   300pt
   100   1.000  70.0     0.00%   0.29%   1.15%   2.04%   3.85%   6.22%  10.26%
    95   1.000  70.0     0.00%   0.29%   1.15%   2.04%   3.85%   6.22%  10.26%
    90   1.000  70.0     0.00%   0.29%   1.15%   2.04%   3.85%   6.22%  10.26%
    85   1.000  70.0     0.00%   0.29%   1.15%   2.04%   3.85%   6.22%  10.26%
    80   1.000  70.0     0.00%   0.29%   1.15%   2.04%   3.85%   6.22%  10.26%
    75   1.000  70.0     0.00%   0.29%   1.15%   2.04%   3.85%   6.22%  10.26%
    70   1.000  70.0     0.00%   0.29%   1.15%   2.04%   3.85%   6.22%  10.26%
    60   0.936  65.5     0.00%   0.34%   1.33%   2.35%   4.42%   7.15%  11.80%
    50   0.871  61.0     0.00%   0.38%   1.50%   2.65%   5.00%   8.08%  13.34%
    40   0.807  56.5     0.00%   0.42%   1.67%   2.96%   5.58%   9.02%  14.88%
    30   0.743  52.0     0.00%   0.47%   1.84%   3.27%   6.15%   9.95%  16.42%
    20   0.679  47.5     0.00%   0.51%   2.02%   3.57%   6.73%  10.88%  17.96%
    15   0.646  45.3     0.00%   0.53%   2.10%   3.73%   7.02%  11.35%  18.73%
     0   0.550  38.5     0.00%   0.60%   2.36%   4.18%   7.88%  12.75%  20.83%
```

**Seven identical rows at the top is the defect.** It is not a tuning miss – it is the shape of
`conditionMatchFactor`, which was written for a different job (how STRONG she is, R9-19's owner
curve) and borrowed here for a job it was never asked to do (how BREAKABLE she is).

---

## 5. Measurement 1 – retirements by ROUND, normalised

`npx vite-node tools/retirement-shape-probe.ts --careers 16 --seasons 6`. ⚠ Normalised by the
matches she actually played at each round: the raw count is dominated by how often she gets there at
all, and the raw count is the one that would mislead.

Pooled over all three policies – 13,529 of her matches, 156 of her retirements:

| named round | matches | her retirements | **rate** | ±1 s.e. |
| --- | --- | --- | --- | --- |
| R128 | 297 | 0 | **0.00%** | – |
| R64 | 545 | 3 | **0.55%** | 0.32% |
| R32 | 2,896 | 31 | **1.07%** | 0.19% |
| R16 | 2,303 | 31 | **1.35%** | 0.24% |
| QF | 3,354 | 40 | **1.19%** | 0.19% |
| SF | 2,396 | 34 | **1.42%** | 0.24% |
| F | 1,738 | 17 | **0.98%** | 0.24% |

And by how deep into the run the match was, which is the axis the hazard could plausibly read:

| match within the run | matches | her retirements | **rate** |
| --- | --- | --- | --- |
| #1 | 5,477 | 57 | **1.04%** |
| #2 | 3,504 | 48 | **1.37%** |
| #3 | 2,439 | 31 | **1.27%** |
| #4 | 1,203 | 15 | **1.25%** |
| #5 | 878 | 5 | **0.57%** |
| #6–#7 | 28 | 0 | 0.00% |

**Reading: there is no round effect, and there was never going to be one.** Nothing in
`retireHazard` reads the round, the run index or the tier, and condition is charged once at finalize
(§3) – so every match of a title week is played at the same condition as the first. The spread above
is flat inside two standard errors from R32 to the Final.

⭐ **AND THE RAW COUNT IS THE THING THAT WOULD HAVE MISLED HIM.** The two biggest raw cells are the
QF (40 retirements) and the SF (34) – between them 47% of every retirement she suffers. Normalised
they are 1.19% and 1.42%, against R32's 1.07% and the Final's 0.98%. She stops in quarter-finals
because she plays a lot of quarter-finals.

⭐⭐ **SO WHY DID IT HAPPEN RIGHT AFTER HIS FIRST GOOD RESULTS? BECAUSE GOING DEEP IS MORE DRAWS FROM
THE SAME URN.** At ~1.2% a match, a first-round exit is one draw and a five-match title week is
five: P(at least one) rises from **1.0% to 5.9%, a factor of 5.7** – with no term anywhere in the
model that says a deep week is harder. He is not being punished for playing tired; he is being
sampled more often, and the only thing that decides how often is how many matches he wins.

**Against the research.** `docs/research/retirement-and-withdrawal.md` §7 measures the same split on
the real tour and finds it nearly flat too: **preliminary rounds 2.65%, final rounds 3.00%** – a
×1.13 spread. (Its 4.35% "qualifying" cell is 2 retirements in 46 matches and the research itself
says it must not be used.) **So on this axis alone the model is right and the research agrees with
it.** The defect is not here.

---

## 6. ⭐ Measurement 2 – retirements by ARRIVAL CONDITION

**This is the one that answers his design question directly.**

Pooled over all three policies, 13,529 of her matches:

| arrival | matches | her retirements | **rate** | ±1 s.e. | mean points | mean condition factor |
| --- | --- | --- | --- | --- | --- | --- |
| ≥ 90 | 3,251 | 27 | **0.83%** | 0.16% | 147 | 1.000 |
| 80–89 | 883 | 2 | **0.23%** | 0.16% | 143 | 1.000 |
| 70–79 | 866 | 9 | **1.04%** | 0.34% | 141 | 1.000 |
| 60–69 | 636 | 5 | **0.79%** | 0.35% | 145 | 0.963 |
| < 60 | 7,893 | 113 | **1.43%** | 0.13% | 153 | 0.744 |

### ⭐ THE ANSWER, IN ONE COMPARISON

> **Arriving at 80 or better: 0.70% ± 0.13% (29 of 4,134 matches).
> Arriving at 70–79: 1.04% ± 0.34% (9 of 866).
> A difference of 0.9 standard errors – no difference at all.**

And that is not a small sample hiding a real effect. **The model predicts EXACTLY zero difference
there**, because `conditionMatchFactor` returns exactly 1 for every condition at or above 70
(`src/engine/condition.ts:120`). The measurement is not failing to find the effect; there is no
effect to find. **Arriving at 95 and arriving at 70 are the same girl to this hazard.**

### The same cut with the policy held constant

The pooled table cannot separate "she arrived worn" from "she is in the arm that also plays longer
matches", so the probe repeats the cut inside each arm:

| arrival | rested arm | grinder arm | pro arm |
| --- | --- | --- | --- |
| ≥ 90 | **0.86%** (2,802) | **0.70%** (287) | **0.62%** (162) |
| 80–89 | 0.00% (589) | 0.00% (163) | 1.53% (131) |
| 70–79 | 0.95% (631) | 1.38% (145) | 1.11% (90) |
| 60–69 | 0.34% (290) | 0.55% (183) | 1.84% (163) |
| < 60 | **1.50%** (200) | **1.44%** (4,175) | **1.42%** (3,518) |

Every arm tells the same story, and in the pro arm the ≥90 row is the *lowest-risk* row on the board
(on 162 matches, so it is noise – but it is noise around "no effect", not around a penalty).

### And with match LENGTH held constant – the condition channel, alone

Only matches of 150–250 points, so the length term cannot do the work:

| arrival | matches | her retirements | rate | mean points |
| --- | --- | --- | --- | --- |
| ≥ 90 | 1,329 | 23 | **1.73%** | 186 |
| 80–89 | 319 | 1 | 0.31% | 186 |
| 70–79 | 318 | 7 | 2.20% | 184 |
| 60–69 | 251 | 3 | 1.20% | 187 |
| < 60 | 3,775 | 91 | **2.41%** | 187 |

**≥90 → <60 at a fixed length is ×1.39 ± 0.33.** The model's own arithmetic over that same span (the
<60 bucket's mean factor 0.744 is condition ≈ 30) predicts **×1.60**. The two agree inside 0.6 of a
standard error – the instrument and the model are measuring the same thing – and **both are trivial
beside the ×21 that match length is worth.**

---

## 7. Measurement 3 – against the research

`docs/research/retirement-and-withdrawal.md` §7, women's ITF World Tennis Tour, PLOS ONE June 2024:
**2.73% of matches end in a retirement by either player** (7,291 of ~266,900) and **1.36 retirements
per 1000 games played**.

| | rested | grinder | pro | **research** |
| --- | --- | --- | --- | --- |
| her matches measured | 4,512 | 4,953 | 4,064 | ~266,900 |
| **per her match, either player stopped** | **2.04%** ±0.21 | **2.97%** ±0.24 | **2.71%** ±0.26 | **2.73%** |
| – of which hers | 0.75% | 1.31% | 1.40% | – |
| – of which her opponent's | 1.29% | 1.66% | 1.30% | – |
| per 1000 games played (either) | 0.93 | 1.30 | 1.14 | **1.36** |
| **per match IN THE DRAWS SHE PLAYED** | **0.24%** | **0.32%** | **0.14%** | **2.73%** |
| her retirements per season | 0.35 | 0.68 | 0.59 | ~0.27 at 20 matches |
| her matches per season | 47.0 | 51.6 | 42.3 | 20–30 on a real tour |

**1. The LEVEL is right, and the shipped calibration reproduces.** The pro arm reads 2.71% against
the anchor's 2.73% – 0.1 standard errors – and `bench:retire`'s shipped 2.81% sits between the
grinder and pro arms, exactly where its policy puts it. Nothing in this document is a claim that
`RETIRE_K` is mis-set.

**2. ⚠ But 2.73% is a SCHEDULE-WEIGHTED number, and the careful player already sits below it.** The
rested arm reads **2.04%, 3.3 standard errors below the anchor.** So "the game hits 2.73%" is true of
a heavy schedule and not of a careful one – which matters for §10.0, because the bench that
calibrated `RETIRE_K` walks the heavy schedule only.

**3. ⚠⚠ AND THE IN-WORLD RATE IS 10–20× BELOW THE RESEARCH.** Per match in the draws she actually
entered the rate is **0.14–0.32%**, because an AI-vs-AI match resolves through the closed form and
plays no points, so it can never retire (`src/engine/season/types.ts:307-310`,
`src/engine/season/tournament.ts:1036-1055`). **Every retirement this world contains happens to her
or to somebody standing across the net from her.** The research already names this as the missing
half (§10.3, the same gap as the walkover), but the number has not been written down before, and it
is the reason "2.73% of matches" and "2.73% of the game's matches" are different claims.

**4. Per 1000 games** – 0.93 / 1.30 / 1.14 against the research's 1.36, i.e. the same picture in the
research's second unit.

**5. Per season she retires more than a real player, and it is the SCHEDULE, not the rate.** 0.35 to
0.68 a season against a real ~0.27, on 42–52 matches a season against a real tour's 20–30.

### 7.1 ⭐ And the door's share of her injuries goes UP the fresher she is

| arm | mean arrival | retirement-door onsets | weekly-door onsets | **retirement share** | season prevalence |
| --- | --- | --- | --- | --- | --- |
| rested | 89.2 | 34 | 27 | **56%** | 48% |
| grinder | 37.9 | 65 | 65 | 50% | 75% |
| pro | 36.4 | 57 | 75 | 43% | 79% |

This independently reproduces `round16-injuries.md` §2 – measured there at 61.1% for the careful
policy against 46.6% for the grinder – **on a different instrument, a different era and a different
policy set.** The weekly roll, which is the only injury model anybody has ever tuned, delivers less
than half of a fresh player's injuries.

---

## 8. Measurement 4 – the grinder

Two arms over the same engine: `rested` enters only at condition ≥ 85 and never two weeks running
(«приезжаю с 80-90»); `grinder` enters every week the calendar offers, whatever she arrives at, and
only the engine's own medical block stops her («УЖЕ в низкой кондиции… ПОСТОЯННО»).

⚠ **The training plan is a confound and it is controlled for.** An arm called "grinder" wants the
grind preset, but that preset trains her harder as well as resting her less, so she develops faster,
meets the field closer, and plays LONGER matches – which moves the one quantity the hazard actually
integrates. `--plan balanced` pins both arms to one slider.

| | rested | grinder | ratio |
| --- | --- | --- | --- |
| **matched plan** (`--plan balanced`) | | | |
| mean arrival condition | 87.2 | 39.9 | −47 points |
| her matches | 4,285 | 5,235 | |
| mean match length | 140 pts | 151 pts | |
| **her retirements per MATCH** | **0.77%** | **1.24%** | **×1.61** |
| her retirements per SEASON | 0.34 | 0.68 | ×2.00 |
| her matches per season | 44.6 | 54.5 | ×1.22 |
| events entered | 1,238 | 2,102 | ×1.70 |
| *unmatched plans, for comparison* | *0.75%* | *1.31%* | *×1.74* |

### ⭐ «Barely», quantified

> **Arriving 47 condition points worse, every week, for six seasons, multiplies her per-match
> retirement risk by 1.61. The model's own ceiling across that entire span is ×1.60 – so the engine
> is already delivering essentially ALL the condition effect it has. There is nothing left in the
> model to find: ×1.6 IS the design.**

And the ×2.00 per season is not fragility – it is **volume**. She enters 70% more events. Strip the
volume out and 1.61 is the whole punishment for living at 40 instead of 87.

⚠⚠ **AND AT EQUAL VOLUME IT INVERTS.** `round16-injuries.md` §2 measured the same question on 400
season-years per policy with the entry cadence held constant, and got:

| policy | mean condition | retirements per season |
| --- | --- | --- |
| careful | 77.7 | **0.730** |
| balanced | 70.6 | 0.677 |
| grinder | 41.5 | **0.698** |

**The careful player retires MORE OFTEN than the grinder** – ×0.96 the other way. That is the
owner's complaint, already in this repo, measured on 11.08, and never acted on because the ruling
that day («RETIRE_K оставляем как есть») sent the fix to the severity table instead of the shape.
This document is the second, independent arrival at the same finding, and this time it is the shape
that is in question.

---

## 9. Measurement 5 – round 26's prevalence overshoot, re-taken

Round 26 #14b recorded 71% season injury prevalence against the 30–54% professional band, split as
"the retirement door accounts for about eleven points (weekly door alone reads 60%), and the weekly
door itself drifted from the 51% recorded on 02.08 to 60% – nine points nobody authored."

Re-taken today on three cells of `npx vite-node tools/pro-season-probe.ts --seeds 16 --seasons 3`:

| cell | total | weekly door alone | retirement door worth | doors (weekly / retirement) | her matches |
| --- | --- | --- | --- | --- | --- |
| **defaults** (policy `pair`, plan `light`, physio `off`) | **71%** | **60%** | **11 pts** | 39 / 23 | 1,945 |
| `--policy greedy --plan balanced --physio on` | 63% | 40% | 23 pts | 23 / 30 | 2,115 |
| `--policy greedy --plan balanced --physio off` | 79% | 56% | 23 pts | 35 / 27 | 1,863 |

**THE SPLIT HOLDS, AND THE 71/60 PAIR REPRODUCES EXACTLY – on the DEFAULT cell.** The 17-point
overshoot against the 54% ceiling stands, and the retirement door is worth 11 of it.

⚠ **But round 26's paragraph names the wrong cell for those numbers.** It says "16 seeds x 3 seasons,
greedy/balanced/physio-on", and on that cell today's reading is **63% / 40%** – which reproduces
`tools/pro-season-probe.ts`'s own header comment ("the fix moves … the §6.4 prevalence 40% -> 63%")
to the decimal, including its cross-checks of 2,115 kid matches and 30 retirements. **Two different
cells were quoted in one paragraph:** 71/60 is the default cell, 40→63 is the greedy/balanced/
physio-on one. The tool comment and the ledger are each right about their own cell.

⭐ **AND THE «NINE POINTS NOBODY AUTHORED» SHOULD NOT BE CHASED AS A DRIFT UNTIL THE 02.08 READING'S
CELL IS RECOVERED.** Measured here, the weekly door's prevalence swings **16 points on the physio
retainer alone** (56% → 40% at greedy/balanced) and 4 points between the pair/light and
greedy/balanced policies. A 9-point gap between a reading taken on 02.08 and one taken today is
inside this instrument's own cell-sensitivity. That does not prove there is no drift – it proves the
comparison as stated cannot see one.

⭐⭐ **THE FINDING THE RE-TAKE ADDS: on every cell measured, the retirement door is the pro era's
injury overshoot.** Weekly door alone reads 40%, 56% and 60% against a 30–54% band – inside it,
2 points over it, 6 points over it. Add the retirement door and the totals are 63%, 79% and 71%.
**Take the door out and the professional season is compliant or nearly so on all three.**

---

## 10. Candidate fixes, their costs, and a recommendation

**⚠ NOTHING BELOW IS BUILT. Each entry names what it would cost, what it would break, and what
would have to be re-measured.**

### 10.0 ⚠⚠ FIRST, AND BEFORE ANY OF THEM: the calibration bench cannot grade this

`tools/retirement-rate.ts:45` gates every entry on

```ts
if (world.condition >= ECONOMY.condition.matchStrengthKnee) {
```

**So the bench that calibrated `RETIRE_K = 0.07` against 2.73% walks a career that never once
arrives below the knee.** Every match in that 5,311-match corpus sits in the FLAT part of
`conditionMatchFactor`. Three consequences, all of which bite before any fix is written:

* a fix that raises sub-knee risk **would not move that bench at all** – it would read as a null
  result, which is exactly CLAUDE.md's null-arm hazard ("a constant without its reader is a null arm
  that looks like a null result");
* a fix that lowers above-knee risk would drop the bench BELOW the anchor and look like a
  regression when it is the intended half of a redistribution;
* and the shipped 2.81% is therefore **an above-the-knee number**, not a population number.

**The bench must be re-aimed before it can grade anything below.** The cheapest honest form is to
report the rate at each arrival bucket the way §6 does, and to grade the WEIGHTED rate against
2.73% rather than the gate-filtered one.

### 10.1 Candidate A – give `retireHazard` its own condition term

Stop borrowing `conditionMatchFactor`'s knee. Add a `durability(condition)` multiplier that is
monotone over the WHOLE 0–100 range, so freshness above 70 buys something for the first time.

* **What it buys.** The 90→70 lever moves off ×1.00. It is the direct answer to «если я приезжаю с
  80-90 на турнир, то как будто вполне есть высокий шанс доиграть».
* **⚠ The real cost, and it is not the curve.** `retireHazard` today reads `stamina` and nothing
  else, and **`stamina` conflates TALENT with FRESHNESS** – a 45 could be a worn-out star or a fresh
  weak girl, and the function cannot tell. Any fix that prices freshness must hand the hazard a
  second input that talent does not move. Two seams, both real:
  * `MatchOptions` (`src/engine/match/types.ts`) is constructed at each call site and **is not
    persisted** – `{ surface, tour, seed }`. A `condition?: [number, number]` there costs no schema
    question at all, and omitted means today's behaviour exactly.
  * `MatchPlayer` IS persisted (inside `PendingTournament.players`), but it already carries the
    precedent for widening: `age?` is optional with a documented legacy default
    (`LEGACY_SNAPSHOT_AGE = 14`, `src/engine/match/serveSpeed.ts:68`). ⚠ Whether an additive
    optional field trips CLAUDE.md invariant 3 is a question for the schema rule, not for this file.
* **What it breaks.** `point.ts`'s own load-bearing comment – *"One fatigue curve in this file, two
  consumers"* (`:132-135`) – stops being true, and that sentence is the design of the feature. The
  `RETIRE_K` calibration (§11). Any pin on `retireHazard`'s arity.
* **Re-measure:** `npm run bench:retire` **after §10.0**, the two sim tripwires in
  `match-retirement.md` §4.1, `tools/pro-season-probe.ts` §6.4, and §5-§8 of this file.
* **⚠ AND IT DOES NOT FIX THE DOMINANT TERM.** Even a ×3 freshness curve is small beside length's
  ×21. This fixes "arriving fresh buys nothing". It does not fix "winning is what hurts you".

### 10.2 Candidate B – make repeated low-condition arrivals accumulate

A per-career wear counter that rises when she takes a court below the knee and decays with rest;
the hazard multiplies by it.

* **What it buys.** It is the ONLY candidate that implements the owner's second clause –
  «делает это ПОСТОЯННО». Everything else prices one week at a time, and the word he used was
  "constantly".
* **Cost.** New persisted state, so the full three-part move: `SAVE_SCHEMA_VERSION` bump,
  append-only migration in `engine/migrations.ts`, golden fixture in `tests/fixtures/saves/`
  (CLAUDE.md invariant 3). And a new tuning surface with **no research anchor** – §7 of the research
  found that even AGE barely predicts a retirement (median 21.00 against 20.67 for completed
  matches), and it offers nothing at all on cumulative load.
* **⚠ What it breaks, and it is a principle rather than a test.** The 199 rivals cannot carry it: a
  cohort player has no persisted condition, which is why `rivalFatigueWindowWeeks: 16` exists at
  all. So it would be a rule for the kid alone – and `retireHazard`'s own comment
  (`src/engine/match/point.ts:124-131`) argues at length that this hazard is *"a statement about a
  body"* and not about who is playing.
* **Re-measure:** everything in 10.1, plus `tools/rival-fatigue-audit.ts` and the fatigue bench's
  policy ratio.

### 10.3 Candidate C – break the coupling between winning and being hurt

Attack the dominant term itself: normalise `spentness` against the match's own expected length
rather than a fixed 120-point floor, or index it on something other than the raw point counter.

* **What it buys.** It is the only candidate that addresses §4. A three-set win would stop costing
  ×21 a straight-sets win.
* **Cost.** It is a redesign of the FICTION, not a retune. `match-retirement.md` §3 is explicit that
  the fiction is exhaustion and that 120 points is the honest floor, and the owner ruled the door's
  visibility on 11.08. This one needs him.
* **⚠ And it would flatten a gradient the game currently gets for free.** Nothing in the hazard
  reads the tier, yet the measured rate falls across the top rungs (`match-retirement.md` §4:
  W75 2.70 → W100 2.07 → WTA125 0.88) in the same direction as the real data (research §7: ~2.7%
  ITF, ~1.7% WTA main tour, ~1.0% at a Slam). That gradient is a side effect of the length coupling.
  Remove the coupling and it has to be re-earned with a rule.

### 10.4 Candidate D – leave the hazard alone and move the consequence again

Precedent: this is exactly what round 16 did (`round16-injuries.md` §9), on the owner's own ruling.

* **Cost: it does not answer the 27.08 complaint.** He is not saying the layoff is too long – round
  16 already fixed that. He is saying it happens to him when he is fresh and playing well.

### 10.5 ⚠ Candidate E – raise `matchStrengthKnee`. THE CHEAP-LOOKING ONE. DO NOT.

One number, 70 → 100, and `conditionMatchFactor` becomes linear over the whole range; arriving at 90
would then buy ×1.19 against arriving at 70.

**It is the most expensive option in the list.** `conditionMatchFactor` is the R9-19 STRENGTH curve
and it is read by the kid AND by all 199 rivals (`src/engine/season/rival.ts:379`). Moving the knee
makes every player in the game weaker at 90 than at 100 – win rates, the merged table, ladder pace,
the acceptance cuts, the whole balance – to buy ×1.19 on one hazard. It is named here only so that
nobody reaches for it because it is one line.

### 10.6 ⭐ RECOMMENDATION

**Do 10.0 first, then 10.1 shaped as a REDISTRIBUTION, and hold 10.2 for a second wave.**

1. **Re-aim `tools/retirement-rate.ts` (§10.0).** It is `tools/`-only, costs nothing, breaks
   nothing, and until it is done every subsequent measurement is being graded by an instrument that
   cannot see half the population. This is the one thing I would do regardless of what the owner
   decides about the model.
2. **Then Candidate A, through `MatchOptions`** – the seam with no schema question – and with the
   curve **chosen so that the population-weighted mean of `durability(condition)` over the corpus
   the re-aimed bench walks is exactly 1.0.** Then `RETIRE_K` does not move, the 2.73% anchor is
   preserved BY CONSTRUCTION, and what changes is only WHO the same number of retirements lands on:
   the fresh get less, the worn get more. That is the whole of the owner's ask and none of the level
   change §11 forbids.
3. **Hold Candidate B.** It is the honest reading of «ПОСТОЯННО», but it costs a schema bump and a
   tuning surface with no anchor, and it should not be spent before (2) is measured – (2) may buy
   enough of the effect that the memory is not worth its price.
4. **Do not touch Candidate C or E without the owner.** C is his fiction and E is the whole game's
   balance.

**What (2) would predict, so it can be falsified:** the §6 arrival table's ≥90 row falls and its
<60 row rises, their matches-weighted mean holds at today's value, `bench:retire` (re-aimed) still
reads 2.7-2.9%, and the §8 grinder ratio rises from today's figure. If the grinder ratio does not
move, the curve is too flat and the measurement says so before anybody argues about feel.

---

## 11. ⚠ What a fix must NOT do

1. **It must not simply lower the overall rate.** `RETIRE_K = 0.07` is calibrated against real data
   (`src/engine/match/point.ts:145-151`; `match-retirement.md` §4) and the owner ruled it fixed on
   11.08 – *«RETIRE_K оставляем как есть, дверь схода надо показывать»* (`src/engine/economy.ts:2105`).
   **The SHAPE is what is wrong here; the LEVEL is not obviously wrong at all.** Trading 2.81% for
   2.0% swaps one wrong number for another and loses the anchor.
2. **Nor may it raise sub-knee risk without lowering above-knee risk.** That is the same violation
   with a nicer motive: it fixes the ordering by moving the level.
3. **It must not be graded on `tools/retirement-rate.ts` as it stands** – see §10.0. That bench is
   blind below the knee.
4. **It must not move `conditionMatchFactor`** – §10.5. That curve belongs to 200 players and to
   every balance number in the game.
5. **It must not flatten the length term to nothing** – §10.3. The length coupling is currently the
   only reason the top of the ladder is safer than the bottom, which is the direction the research
   says is right.
6. **It must not hide the door.** Owner, 11.08: *«дверь схода надо показывать»*.
7. **It must not be measured with the edge-based door counter** – §2.1. That reader is short by
   every onset that lands in a week which began injured.
8. **⚠⚠ And it must not be judged by whether his replay stops reproducing.** The streams are
   seed-deterministic by design (CLAUDE.md invariant 2) and ANY change to the model will change
   which matches retire. He is right that "it is deterministic" is no answer to his complaint – and
   the mirror of that is that "it no longer reproduces" is no proof of a fix either. The proof is
   §6's table separating, and §8's ratio moving.

---

## 12. Reproduction

Every number in this file comes from one of these five commands. None of them writes an engine
number; all of them read exit codes out of a file, never a pipe (CLAUDE.md).

```bash
# §4 (the model), §5 (rounds), §6 (arrival condition), §7 (the research), §8 (the grinder)
npx vite-node tools/retirement-shape-probe.ts --careers 16 --seasons 6

# §8's matched-plan control – the training slider held constant across both policies
npx vite-node tools/retirement-shape-probe.ts --careers 16 --seasons 6 --plan balanced --arms rested,grinder

# §9, the three cells
npx vite-node tools/pro-season-probe.ts --seeds 16 --seasons 3
npx vite-node tools/pro-season-probe.ts --seeds 16 --seasons 3 --policy greedy --plan balanced --physio on
npx vite-node tools/pro-season-probe.ts --seeds 16 --seasons 3 --policy greedy --plan balanced --physio off
```

⚠ **`tools/retirement-shape-probe.ts` typechecks clean under `npm run check:tools`.** That sweep
exits 2 on this tree for two PRE-EXISTING unused-import errors in `tools/birthday-pool.ts:34` and
`tools/his-careers-brackets.ts:529`, both last touched by round 26's own commit (`ce282ca`) and
neither in this file's path. Named here so the next reader does not attribute them to this work.

---

## 13. ⭐⭐ THE FIX, BUILT AND MEASURED – 27.08

**§10.6's recommendation, shipped in the order it names.** Nothing above this section was edited: it
is the before-picture, and a fix graded against a moved target is not graded at all.

Commands (all exit codes read out of a file, never a pipe):

```bash
npm run bench:retire                                          # the re-aimed bench, §13.1
npx vite-node tools/retirement-shape-probe.ts --careers 16 --seasons 6
npx vite-node tools/retirement-shape-probe.ts --careers 16 --seasons 6 --plan balanced --arms rested,grinder
```

### 13.0 ⚠ FIRST: the bench was re-aimed, and here is the proof it was not weakened

`tools/retirement-rate.ts` gated every entry on `world.condition >= matchStrengthKnee`, so the
corpus that calibrated `RETIRE_K` never once arrived below the knee (§10.0). It now walks **three
arms** and grades the POOLED corpus:

* `knee` – **the shipped policy, byte for byte.** The continuity arm.
* `all` – the same appetite with the gate removed; only the medical floor stops her.
* `rested` – enters at 85 or better, never two weeks running.

⚠ **THE CONTINUITY ARM REPRODUCES THE OLD HEADLINE EXACTLY.** Run with the freshness span set to 0 –
which makes the multiplier exactly 1 for every condition, i.e. the pre-fix hazard bit for bit – the
`knee` arm reads **2.26% on 3,624 matches (hers 1.05%, opponent's 1.21%, 1.00 per 1000 games)**,
which is what `bench:retire` printed on this tree before a line was touched. Nothing was removed;
two arms and three tables were added beside it.

⚠ **AND THE SHIPPED FIGURE HAS DRIFTED SINCE §7 WAS WRITTEN.** §7 quotes `bench:retire`'s 2.81% over
a 5,311-match corpus; measured today, unmodified, it is **2.26% over 3,624**. The calendar and the
ladder have moved underneath that bench since the number was recorded. It changes no conclusion here
– both readings are above-the-knee numbers, which is §10.0's whole point – but the 2.81% should not
be quoted again without a re-run.

| the re-aimed bench, 12 careers x 312 weeks x 3 arms | matches | ret | rate | hers | opp | mean arrival |
| --- | --- | --- | --- | --- | --- | --- |
| **BEFORE** `knee` (= the shipped bench) | 3,624 | 82 | **2.26%** | 1.05% | 1.21% | 75.3 |
| **BEFORE** `all` | 3,691 | 118 | 3.20% | 1.79% | 1.41% | 44.9 |
| **BEFORE** `rested` | 2,167 | 49 | 2.26% | 1.15% | 1.11% | 99.6 |
| **BEFORE POOLED – graded against 2.73%** | **9,482** | **249** | **2.63%** | | | |
| **AFTER** `knee` | 3,575 | 73 | 2.04% | 1.23% | 0.81% | 75.4 |
| **AFTER** `all` | 3,548 | 149 | 4.20% | 3.21% | 0.99% | 47.9 |
| **AFTER** `rested` | 2,241 | 26 | 1.16% | 0.58% | 0.58% | 99.6 |
| **AFTER POOLED – graded against 2.73%** | **9,364** | **248** | **2.65%** | | | |

**The population level did not move: 2.63% -> 2.65%, against an anchor of 2.73% and a standard error
of 0.17%.** The `knee` arm falling to 2.04% is not a regression – §10.0 predicted it in advance, in
these words: *"a fix that lowers above-knee risk would drop the bench BELOW the anchor and look like
a regression when it is the intended half of a redistribution."*

The bench also now carries two instrument arms, and both are clean in every run below:

| arm | what it proves | reading |
| --- | --- | --- |
| (a) every kid match re-simulated at its stored seed, **with no condition argument at all**, must reproduce winner and scoreline | that the snapshot is the match that was played – and, since the freshness rides on the snapshot, that a Watch button replays it | **0 mismatches** |
| (b) `players[KID_ID].condition` must equal the `world.condition` this file read at the same point | that the body is read BEFORE finalize – round 26 #14b's ordering hazard, as an identity of the composition | **exact in every match** |

⚠ Arm (b) is a check on THIS FILE'S READ ORDER rather than on the engine: `world/player.ts` writes
one number from the other, so the two can only part company if the read has drifted to the wrong side
of `finalizeTournament`. It also reports sides that stepped on court with no composed freshness at
all, which on this path is **0**.

### 13.1 ⭐ The curve, the weighting, and the mean it achieved

```ts
export function retireDurability(condition: number): number {
  const c = clamp(condition, 0, 100)
  return 1 + (RETIRE_DURABILITY_SPAN * (RETIRE_DURABILITY_PIVOT - c)) / 100
}
export const RETIRE_DURABILITY_PIVOT = 79.8   // MEASURED – see below
export const RETIRE_DURABILITY_SPAN = 2.6     // the one free parameter
```

`retireHazard(pointNumber, stamina, durability = 1)` multiplies by it; `simulateMatch` resolves one
value per side, once, before the first ball, from `MatchOptions.condition?` if a caller offered one
and otherwise from `MatchPlayer.condition?` on the snapshot – neither present ⇒ exactly 1. See §13.5
for why the snapshot is the record and the option is only an override.

**⭐ THE WEIGHTING, STATED: hazard-weighted, over every SIDE of every one of her matches – hers and
her opponent's alike.** Not match-weighted, and the difference is the whole trap. The expected number
of retirements is `Σ over sides of min(1, h·d)`, so the weight a side deserves is the hazard `h` it
actually carries, not one vote per player. Worn players play LONGER matches (§3.3: 153 points against
147), so they carry more hazard per match than their head-count earns; centre on the plain mean and
the heavy end of the curve is over-weighted in the only sum that matters, and the rate quietly rises.
A match under `FATIGUE_START` carries no hazard and votes not at all, which is correct – it can
never produce a retirement.

| the census, hazard-weighted | sides | Σ hazard | mean condition | **hazard-wtd condition** | **hazard-wtd multiplier** |
| --- | --- | --- | --- | --- | --- |
| BEFORE – hers | 9,482 | 1,761.9 | 69.02 | 63.91 | 1.0000 |
| BEFORE – her opponents | 9,482 | 1,862.9 | 92.93 | 92.62 | 1.0000 |
| **BEFORE – BOTH SIDES** | 18,964 | 3,624.9 | 80.97 | **78.67** | 1.0000 |
| AFTER – hers | 9,364 | 1,688.7 | 70.76 | 66.85 | 1.3366 |
| AFTER – her opponents | 9,364 | 1,791.0 | 92.47 | 92.10 | 0.6803 |
| **AFTER – BOTH SIDES** | 18,728 | 3,479.8 | 81.61 | **79.85** | **0.9988** |

**The pivot is a fixed point, found by iteration and not by taste.** Measured on the pre-fix
population it is 78.67; setting it there and re-running moved the population's own centre to 79.76
(the fix changes careers, which changes conditions); setting it to **79.8** lands the population at
**79.85** and the achieved mean multiplier at **0.9988** – 0.05 condition points and 12 parts in
10,000 from the fixed point. `RETIRE_K` did not move, and the anchor holds by construction.

⚠ **"EXACTLY 1.0" IS EXACT ARITHMETIC ON A CORPUS, NOT A UNIVERSAL LAW, AND THE DIFFERENCE MATTERS.**
For a straight line, ANY population whose hazard-weighted mean condition equals the pivot has a mean
multiplier of exactly 1 – that is pinned as a property in `tests/match-retirement.test.ts` §8, on
three synthetic populations, to nine decimal places. What is measured rather than proved is that
THIS game's population sits at the pivot. A sub-population that does not – see §13.3 – does not hold
its level, and must not, or nothing has been fixed.

**Why linear.** The knee IS the defect, so the fix cannot introduce a second one; and a straight line
is the only shape whose weighted mean is solvable in closed form, which is what makes "exactly 1.0"
arithmetic instead of a search. **Why the span is 2.6.** It is the one free parameter and the brief
is the owner's sentence. Its ceiling is arithmetic – `100 / (100 - PIVOT)` = 4.95 here, above which a
fresh player's hazard would go negative and the running sum would stop being non-decreasing. At 2.6
the freshest girl in the game sits at 0.47 of the population's risk (rare, not impossible) and the
worn-out one at 3.07.

### 13.2 ⭐ The arrival table, after – beside the before

`npx vite-node tools/retirement-shape-probe.ts --careers 16 --seasons 6`, the same 3 arms, ~13,500
of her matches. This is §6's table, re-taken.

| arrival | BEFORE rate | **AFTER rate** | before mean pts | after mean pts | multiplier |
| --- | --- | --- | --- | --- | --- |
| >= 90 | 0.83% (3,251) | **0.37%** (3,252) | 147 | 148 | 0.52 |
| 80-89 | 0.23% (883) | 0.23% (866) | 143 | 142 | 0.88 |
| 70-79 | 1.04% (866) | 0.94% (853) | 141 | 142 | 1.13 |
| 60-69 | 0.79% (636) | 0.92% (655) | 145 | 146 | 1.40 |
| < 60 | 1.43% (7,893) | **3.44%** (7,850) | 153 | 153 | 2.28 |

**<60 against >=90: x1.72 before, x9.3 after.** Both ends moved and both are significant on their
own: the >=90 row falls from 27 retirements to 12 on the same ~3,250 matches (**2.4 s.e.**) and the
<60 row rises from 113 to 270 on the same ~7,880 (**8.2 s.e.**). Before the fix these two rows – the
whole span of a career – were x1.72 apart with the model predicting x1.00 across most of it.

⚠ **AND THE 80-89 ROW IS FLAT AT 0.23% IN BOTH COLUMNS – 2 retirements in 870-ish matches, either
way.** It is the smallest cell on the board and it cannot separate anything; the row that carries the
owner's own band with enough matches to speak is the bench's, where 80-89 reads 0.92% before and
1.35% after on ~970 matches (1 s.e. apart, i.e. still noise). **The claim this fix can make about
80-90 is the model's, not the corpus's**: at a fixed length the multiplier there is 0.87 against
2.28 at 40, and the pooled >=90 row is where the corpus confirms the direction.

### 13.3 ⚠⚠ THE SECOND CHANNEL, AND THE TRADE THAT COMES WITH IT

**The length channel is untouched, and that was measured rather than assumed.** `retireDurability`
multiplies the hazard alone – it does not enter `basePServe`, `modifiedPServe` or any composition
point – so match length by arrival bucket is unchanged to the point: 147/143/141/145/153 before,
148/142/142/146/153 after. The x21 length lever is exactly where §4 left it.

So the two channels now COMPOUND instead of cancelling, and the cleanest read is §6's fixed-length
cut (150-250 points only), where length cannot do any of the work:

| arrival | BEFORE | **AFTER** |
| --- | --- | --- |
| >= 90 | 1.73% (1,329) | **0.80%** (1,368) |
| 80-89 | 0.31% (319) | 0.32% (310) |
| 70-79 | 2.20% (318) | 2.13% (329) |
| 60-69 | 1.20% (251) | 1.87% (268) |
| < 60 | 2.41% (3,775) | **5.79%** (3,783) |

**x1.39 before, x7.2 after, with length held constant.** And the model's own arithmetic over both
channels together, at a 260-point match: arriving at 90 against arriving at 50 is **x3.14** (it was
x1.30), at 85 against 50 **x2.67**, and across the whole legal range **x13.3** (it was x2.05).

**The grinder, on the matched-plan control** (`--plan balanced --arms rested,grinder`, the arm where
the training slider is pinned so only the entry policy differs):

| | BEFORE | AFTER |
| --- | --- | --- |
| rested, mean arrival 87 | 0.77% per match | **0.49%** |
| grinder, mean arrival 40 | 1.24% per match | **2.50%** |
| **ratio** | **x1.61** | **x5.11** |

§10.6 said this number rising is how the fix is falsified. It went from x1.61 to **x5.11**, and the
unmatched-plan arms from x1.74 to **x5.62**.

⭐ **AND IT READS ON ONE CAREER, WHICH WAS THE BRIEF – here is that stated as a probability rather
than as a feeling.** Per season, over 96 season-years an arm, the careful player goes from **0.35 to
0.24** retirements a season and the grinder from **0.68 to 1.49**. Over ONE six-season career that is
1.4 against 8.9, where it used to be 2.1 against 4.1. Treating each career as a Poisson draw at its
own rate:

| the question a player can actually ask | BEFORE | **AFTER** |
| --- | --- | --- |
| P(a careful career suffers fewer retirements than a grinding one), 6 seasons | 72.4% (and 12.2% a dead tie) | **99.1%** (0.6% a tie) |
| the same over ONE season | 38.6% (44.7% a tie) | **69.7%** (24.7% a tie) |
| P(a careful 6-season career takes NONE at all) | 12.2% | **23.7%** |
| P(a grinding 6-season career takes five or more) | 38.7% | **94.3%** |

**Before the fix, two careers played the two opposite ways came out a dead heat one time in eight and
the wrong way round one time in six. After it, the careful career wins 99 times in 100.** That is the
difference between a corpus effect and something a player can see happening to him.

⚠ Read the one-season row honestly too: at these rates a single SEASON is still mostly a coin-flip
with a fat tie (24.7%), because 0.24 retirements a season means most careful seasons have none. The
signal is legible over a career, not over a fortnight – and a fortnight is the window the owner
complained about.

⚠⚠ **THE TRADE, AND IT IS THE ONE THING ON THIS PAGE THAT NEEDS THE OWNER.** A redistribution moves
sub-populations by construction, and the professional arm is a sub-population that arrives ~43
condition points below the pivot EVERY WEEK:

| probe arm | mean arrival | per-match, either player: BEFORE -> AFTER | her retirements a season | season injury prevalence |
| --- | --- | --- | --- | --- |
| rested | 89.1 | 2.04% -> **1.45%** | 0.35 -> **0.24** | 48% -> **39%** |
| grinder | 38.4 | 2.97% -> **3.75%** | 0.68 -> **1.49** | 75% -> **83%** |
| pro | 37.2 | 2.71% -> **3.92%** | 0.59 -> **1.38** | 79% -> **92%** |

* **The careful arm moves INTO the researched professional band** (30-54%, `fatigue-reprice` §6.4 as
  re-aimed): 48% -> 39%. That is the first time any arm of this game has sat inside it.
* **The grinding arms move further out of it**, 79% -> 92% on the pro arm, and the pro arm's
  per-match rate – the 2.71% that §7 matched to the 2.73% anchor – rises to 3.92%.

⚠ **THIS CANNOT BE TUNED AWAY WITHOUT UNDOING THE FIX, and the arithmetic says so.** Holding the pro
arm at 2.73% requires a span of **0.07**, at which arriving at 90 buys x1.02 and the model is back
where §6 found it. The pro arm arrives 43 points below the population's centre every single week;
charging for that IS the fix, and the pro arm not holding its level is the fix working.

⚠⚠ **BUT THE REASON IT ARRIVES THERE IS THE ECONOMY, NOT THE HAZARD** – and that half is not shipped.
`fatigue-reprice-2026-08.md` §2 prices a W35 title at 41 condition points and §6.2 measures the
season door at 73; the professional era parks her in the 30-50 band whatever the player does, which
is why the probe's `pro` arm arrives at 37. **So the fix hands the player a lever the professional
economy does not yet let him pull.** The `rested` arm proves the lever exists and is worth x5 – she
still plays 46.7 matches a season on it – but it enters at 85+, and that is the cadence the re-price
is for. Two things follow, and both are the owner's call:

1. **`RETIRE_DURABILITY_SPAN` is the one dial**, and it is linear in effect: 2.0 would put the pro
   arm at ~3.5% and the grinder ratio at ~3.6.
2. **Or the re-price ships beside it**, which is the version this document would argue for: it is the
   same wave, the same complaint, and §5 of that spec already says the foot is shot.

### 13.4 What did NOT move, checked rather than claimed

* **The MAIN capture did not move.** `tests/condition.test.ts` passes with count **41550** and hash
  **e6b0c709** unchanged. It could not: the two retirement uniforms are drawn unconditionally off
  `seed:ret` (`match/engine.ts`), the new term is arithmetic on state, and it draws nothing.
* **`rngMain` is byte-identical in all three frozen careers.** `tools/frozen-key-diff.ts` on
  preset/policy **5/0, 8/0 and 0/1**, headers checked against the invocations (the first attempt
  came back `# preset 0 policy 0` on all three – the zsh word-split `coach-travel-edge.test.ts`
  warns about, caught and re-run). The control was **this change reverted**, in a detached worktree
  at the same commit, never the previous commit.
* **What DID move**: 29 of 72 keys on 5/0, 28 of 72 on 8/0, and **1 of 71 on 0/1** – `results`,
  `events`, `entries`, `condition`, `skills` and the career's downstream ledgers. That is what
  "changing who retires changes careers" looks like, and `rngMain` sitting still inside it is the
  proof that the stream did not.
* **`matchStrengthKnee` was not touched** (§10.5), nor `conditionMatchFactor`, nor `RETIRE_K`.
* **The door is still visible** and the severity table is untouched (§11.6).
* **The round axis is unchanged in shape** – nothing in the hazard reads the round, and per-match
  risk stays flat across R32-to-Final, which the research agrees with (§5).

### 13.5 ⚠⚠ THE SEAM MOVED, AND A TEST IS THE REASON – `MatchPlayer`, not `MatchOptions`

**§10.1 offered two seams and preferred `MatchOptions` because it "costs no schema question at all".
That is true, and it is not the whole price. It was built that way first, and it broke a guarded,
user-visible invariant inside one run.**

`MatchOptions` is rebuilt at each call site. The three replay sites – `MatchReplay.vue`,
`TournamentFlow.vue`, `PracticeFlow.vue` – rebuild it from a stored `WorldMatch`, which carries
`{surface, tour, seed}` and **no body**. So a re-watch passed no freshness, got a multiplier of 1,
and replayed the match as if both players had arrived at the population's centre. The points, the
winner of every point and every statistic still reproduced – the multiplier touches `retH` and
nothing else – but **the TRUNCATION could differ**, on exactly the matches this fix moves.
`MatchViewer` reads `result.retired` off the re-simulation, so such a match re-watches to a full
result while the bracket row says "ret."

`tests/college-league.test.ts` caught it on the first full run:

```
FAIL  every stored match REPLAYS – the same simulateMatch under the same seed, point for point
      college-w64-r0: expected '6-2 6-7 4-4' to be '6-2 6-7 7-5'
```

and its own comment names the stake: *"This is literally what `MatchReplay` does, so a record that
failed here is a Watch button that opens on nothing."* `tests/round10-view.test.ts` fired the same
way for the practice friendly. **Neither was re-aimed.** A corridor widened to admit the change that
broke it is the failure mode every note in those files was written to prevent.

**So the freshness lives on `MatchPlayer.condition?: number`, beside `age` – and `age`'s own comment
is the argument, word for word:** *"IT BELONGS ON THE SNAPSHOT... `WorldMatch.a/.b` freeze a
MatchPlayer into the save, so a box score re-opened three seasons later must still report the serve
of the girl who played it."* The condition she arrived at is a fact about the girl who played that
match, not about the call that is asking.

What that costs, and what it does not:

* **No migration and no `SAVE_SCHEMA_VERSION` bump.** An additive OPTIONAL field, absent ⇒ a
  multiplier of exactly 1, i.e. the pre-fix hazard. That is exactly what every pre-branch snapshot
  means, and it is the same reading `MatchPlayer.age?` (`LEGACY_SNAPSHOT_AGE`), `MatchRecord.retiredId?`
  and `WorldEvent.entryId?` each shipped under, all three with the argument written down. ⚠ It is
  still a widening of a persisted type and the schema rule is the owner's, so it is named here rather
  than buried: **if the ruling is that any additive field bumps the version, this is the field.**
* **`MatchOptions.condition?: [number, number]` STAYS, as an OVERRIDE.** Resolution order is option,
  then snapshot, then 1. Every live call site in `src/` passes nothing and is answered by the
  snapshot; the option is for a caller that builds players BY HAND – a calibration fixture, a probe
  asking "what if she had arrived at 85?" – and `tests/match-retirement.test.ts` §8 exercises it.
* **Two composition points write it, and only those two** – `kidMatchPlayerFor` (world/player.ts)
  from `world.condition`, `rivalMatchPlayer` (season/rival.ts) from the week's derived value – on the
  same line as `conditionMatchFactor`, so the STRENGTH half and the BREAKABILITY half of one number
  cannot disagree about who took the court. `applySurfaceStyle` and `applyKit` spread it through
  untouched, which is correct: a hard court changes how she plays, not how worn out she turned up.
* **A raw opponent nobody composed a condition for is left ABSENT, not set to 100** – the sparring
  partner in a friendly, the call-up rubber, the college-league round. "No opinion" and "fresh at
  100" are different claims, and only the first one is true of a player built without a body.
  ⭐ That also keeps the college fixture outside the condition economy, which is what
  `playCollegeLeague`'s own comment demands: *"A condition drain, a layoff on a retirement... are
  each a balance change... Adding the fixture was the ask; re-pricing the year was not."*
* **And the instruments got SIMPLER and stronger for it.** Both the bench and the probe now
  re-simulate with **no condition argument at all** – the same call `MatchReplay` makes – so
  "0 re-sim mismatches" is now also a Watch-button check. The bench's opponent-condition
  reconstruction (and its 15 season-boundary caveats) is gone: the freshness is read straight off the
  frozen snapshot, and instrument (b) is now the identity `players[KID_ID].condition === world.condition`,
  which tests THIS FILE'S READ ORDER against round 26 #14b rather than the engine.

### 13.6 What is still NOT built, and why

* **Candidate B, the cumulative wear counter (§10.2)** – the honest reading of «делает это
  ПОСТОЯННО». Still held: it needs persisted state (a `SAVE_SCHEMA_VERSION` bump, an append-only
  migration and a golden fixture) and a tuning surface with **no research anchor**. What §13.3 shows
  is that (2) alone already buys x5.11 on the grinder, which was the argument for spending (2)
  first – and it is a good deal of the effect the memory was wanted for. It should be re-argued
  against these numbers rather than against §8's.
* **Candidate C, breaking the winning-hurts coupling (§10.3)** – untouched. Length is still worth
  x21 and is still the dominant term. That is the owner's fiction and needs him.
* **Candidate E, the knee (§10.5)** – untouched, and this fix is the reason nobody has to reach
  for it.

### 13.7 ⭐⭐ THE SIM CORRIDOR THAT MOVED – and it moved back into place

`npm run test:sim`, 12 files. **One corridor moved, and it is the one `match-retirement.md` §4.1 left
FAILING on purpose ten days ago.**

`tests/fatigue-bench-policy-104w.test.ts` measures the property this whole bench family exists for –
*per match played, the grinder gets hurt substantially more often than the careful parent* – and §4.1
recorded the retirement door DILUTING it, in these words: *"a hazard indexed on match LENGTH is
collected mostly by the player who makes matches long, and the load-management axis this file exists
to measure is not what it responds to."* Its own numbers:

| arm | grinder | careful | **per-match ratio** |
| --- | --- | --- | --- |
| main, before the retirement door existed | 0.0245 | 0.0096 | **2.550** |
| the door shipped, condition curve flat | 0.0435 | 0.0281 | **1.546** |
| **the door with its own condition curve (27.08)** | | | **2.405** |

The floor had been slackened from `> 1.5` to `> 1.3` to survive the dilution, and an INVERTED
tripwire – `ratio < 2.2` – was left in place as the honest record that the corridor was lost. **It
fired on the run that restored it**: `expected 2.405 to be less than 2.2`.

Its own instruction, verbatim: *"THIS ASSERTION FAILS, and whoever is here should restore the floor to
1.5 (or higher) and delete it."* So: **the floor is back at `> 1.5` and the inverted pin is retired**,
which is this file's own protocol for a recovered corridor – the same one W3-FIELD3 followed at
2.032 → 2.538 – and not a corridor widened to admit a change.

⚠ **AND THE ROUTE WAS NOT THE ONE THAT NOTE ANTICIPATED, which is the interesting part.** It expected
the repair to be *"count only `cause: 'week'` injuries here"* – filter the contamination out of the
MEASURE – and flagged it as a schema question for the owner. Instead the contaminating source stopped
contaminating: the retirement door now points the SAME WAY as the weekly one. The careful parent's
long three-set matches are still where the hazard accumulates (length is untouched and still worth
x21) – she now carries a multiplier of ~0.5 through them while the grinder carries ~2.1.
⚠ **The schema question is still open and still worth the owner's time**: `injuryHistory` rows carry
no cause, so that bench still cannot separate the two doors. It simply no longer has to in order to
read the axis it exists for.

**Everything else in the sim project is unchanged**, including the second tripwire §4.1 names
(`fatigue-bench-planner`, the grinder's medical blocks), the econ benches and the fatigue reference
tables – 11 of 12 files green before the re-aim and 12 of 12 after.
