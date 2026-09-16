---
type: spec
status: current
area: simulation-and-balance
canonical: false
last-reviewed: 2026-09-16
---

# Time to the ceiling – do different girls arrive at different times? (round 42 #38)

**The owner, 15.09:** «может быть разные девочки в разное время к потолку приходят всё-таки? колледж
или нет, тренер или нет, хорошо тренировали или нет».

Raised off item 22, whose finding was that at the end of a career all five wings read the saturated
register at once. This document is the measurement his question asks for and **nothing else**: no
engine number is written from it, no copy is proposed here, and the instrument
(`tools/r42-ceiling-clock.ts`) changes no shipped value.

**The question, made measurable.** How many weeks does a girl take to reach **90% of each wing's
ceiling**, and **how far apart are those times across the routes a player actually chooses** – coach
tier, college against tour, plan quality, the load she carries.

**The clock is item 22's own number.** `fill = skills[k] / potential[k] >= 0.90` is the `done` rung
the coach eye already speaks on (round 42 #22 – «his number»), so the time this document measures is
the time until the screen says «that serve is as good as it is going to get». A second column carries
the **realisation** reading `(skills[k] - born[k]) / (potential[k] - born[k]) >= 0.90`, which is round
34 #2b's quantity – what share of the room she was born with she has actually filled.

---

## 0. THE PREDICTION, WRITTEN BEFORE THE TOOL WAS RUN (CLAUDE.md invariant 5)

Derived by hand from the shipped constants, before a single career was walked. Every number below is
a *prediction*; §3 records what was measured beside it and §3.5 names every miss as a miss.

**The arithmetic it comes from.** `growWeek` gains `rate * headroom * luck * aim[k]` with

```
rate = ageFactor(age) * trainFactor(plan) * loadFactor * coachFactor * (1 + min(matches,3) * 0.18)
```

so headroom decays geometrically and the share of headroom taken by age A is
`1 - exp(-M * C(A))`, where `M` is everything the route decides and `C(A)` is the cumulative
`ageFactor` in week-units. From `ECONOMY.development.ageCurve` (peakRate 0.0062, growthEase 0.5,
growthEnd 18, plateauRate 0.0027, plateauStart 22 direct / 23 college, declineStart 27 / 29):

| span | cumulative C |
| --- | ---: |
| 14 -> 18 | 0.903 |
| 18 -> 22 (direct) | 0.603 |
| 22 -> 27 (direct) | 0.702 |
| 18 -> 23 (college) | 0.754 |
| 23 -> 29 (college) | 0.842 |

and a wing born at `s0` with ceiling `s0 + r`, `r ~ U[4, 26]`, needs a share
`f* = 0.9 - 0.1 * s0/r` of its headroom to read 0.90 full. At `s0 ≈ 50`: `r = 26 -> f* = 0.71`,
`r = 15 -> f* = 0.57`, `r = 10 -> f* = 0.40`, **`r <= 5.6 -> she is born done`**.

### P1 – the baseline route

Middle coach at a neutral fit (1.04), balanced plan (5 general sessions, `trainFactor` 1.056), few
matches. `M ≈ 1.10`.

* **Median wing crosses 0.90 fill at about age 17.2** (≈ 165 weeks from a week-0 start at 14).
* **The five wings land within ~0.5 years of each other at the median**, because under a general plan
  they share one rate and differ only through their own `r`.
* **Spread across seeds on this one route: about 5 years** – from «born done» at 14 (the ~12% of
  wings whose `r` came up under 5.6) to ~19.4 for the `r = 26` tail. **p10 ≈ 14.0, p90 ≈ 19.5.**
* Realisation 0.90 on this route: **most wings never get there** (`reachableHeadroomShare` is 0.9766
  for the best coaching on the planet and ~0.87 for the bare curve), so the realisation clock should
  be heavily censored at the baseline and below.

### P2 – the spread per lever (median wing, one lever moved, the rest at baseline)

| lever | worst end | best end | predicted median age at 0.90 fill | predicted spread |
| --- | --- | --- | --- | ---: |
| **coach tier** (good fit) | self 0.82 | elite 1.15 | 18.4 -> 16.8 | **~1.6 yr** |
| **coach tier + fit** | self / off 0.615 | elite / great 1.4375 | ~20.6 -> ~16.2 | **~4.4 yr** |
| **plan size** | light 0.72 | grind 1.28 | 19.4 -> 16.5 | **~2.8 yr** |
| **match load** | 0 matches 1.00 | 3+ matches 1.54 | 17.2 -> 15.9 | **~1.3 yr** |
| **college vs tour** | tour 22/27 | college 23/29 | ~17.2 -> ~17.2 | **~0 yr for the median wing** |
| **realistic corners** | self+light+idle M≈0.53 | elite/great+grind+3 M≈2.83 | ~22 -> ~15.1 | **~7 yr** |

### P3 – the college prediction, stated sharply because it is the one that can be wrong cheaply

**College should be nearly mute on this clock.** The fork is answered at **19** (`ENDINGS.forkAgeYears`),
and on the baseline route the median wing is already past 0.90 fill by 17.2 – the decision arrives
after the clock has stopped. Its three channels are all late or small:

* `coachFactorOverride` replaces the family's coach with the programme's rung (state 0.95 / national
  1.04 / private 1.11 at a neutral fit) for 4 years;
* `collegeMatchesThisWeek` fires on **2 weeks of 52** (`COLLEGE_TRIP_WEEKS = [8, 20]`), so its match
  bonus is worth ~4 match-weeks in 208 – negligible;
* the route's own curve (`ageRoutes`) buys one extra plateau year and two extra pre-decline years.

**Predicted: 0.0-0.3 years of difference for a median wing, rising to ~1.5-2 years only for the
slowest wings (`r` near 26) that are still climbing at nineteen.** A self-coached family that goes to
a private programme should move *more* than an elite-coached family that does – the override is a
replacement, not an addition.

### P4 – the verdict predicted

**WIDE, but the width is in the PLAN and the COACH-WITH-FIT, not in the college fork.** Route spread
(~7 years corner to corner, ~1.6-2.8 years per single realistic lever) should be *comparable to or
wider than* the seed spread (~5 years) – so the copy has something true to say about the route. The
prediction that would make this a development question instead is «every lever under 1 year», and
that is what §3 has to falsify or confirm.

### P5 – what should NOT move

The **wing-to-wing** order under a *general* plan. All five share the rate; only `aim` separates
them, and a general week's `aimWeights` is all ones by construction. So under a general plan the five
wings should be nearly indistinguishable, and **the only thing that separates one wing from another
is the plan's aim and, late, `ageWeight` in the decline** (stamina 1.6, ret 1.2, groundstrokes 1.0,
serve 0.6, composure never). Predicted: a plan pointed at one wing moves that wing's clock by
**years** and pushes the unaimed wings to **never**.

---

## 1. The instrument

`tools/r42-ceiling-clock.ts` – measurement only.

```bash
cd /Users/letulip/Projects/Claude/tb-r42
npx vite-node tools/r42-ceiling-clock.ts --seeds 200 --careers 6
```

**Two walks, on purpose, because one of them alone would not be honest.**

* **§A – the `growWeek` walk.** `growWeek` is the only thing in this engine that moves
  `world.skills`, and it is pure and total, so a walk that feeds it exactly what
  `world/phaseGrowth.ts` feeds it *is* the engine's growth. Every route lever is then isolated and
  provable, and N can be large. The build and the ceiling come from the real `startingSkills` +
  `withHeadStart` + `rollPotential`, off the real sub-streams.
* **§D – the real-career cross-check.** `openCareer` + `stepCareerWeek` from `tools/econ-bench.ts`,
  the harness the house already uses to walk careers: real entries, real matches, real money, real
  knocks. Small N, and its only job is to say whether §A's arms land where real careers land. A
  clean walk nobody checked against a career is a model, not a measurement.

**RNG discipline.** The tool draws from `rngFromSeed` only, never MAIN, never `Math.random`. Its own
draws (the per-week match count of the «realistic load» arms) run off the purpose-scoped key
`r42-ceiling-clock:load:<seed>:<week>`, private to this file. `growWeek`'s own draw stays on the
engine's `<seed>:growth:<week>`, re-derived at the call site exactly as the tick derives it.

---

## 2. What the walk feeds `growWeek`

Copied from `world/phaseGrowth.ts`'s call, term for term:

| term | where the route enters |
| --- | --- |
| `ageYears` | `kidAgeExact` off the career's own birthday |
| `plan` | the plan arm – 4/5/6 sessions, `general` or pointed |
| `coach` / `coachFactorOverride` | the coach arm; the college arm replaces it with the programme rung |
| `matchesThisWeek` | the load arm |
| `loadFactor` | the training-load arm (`KNOCK_REST_GROWTH` 0.35, summer > 1) |
| `bounds` | `ageRoutes.direct` 22/27 vs `ageRoutes.college` 23/29, written at the fork at 19 |
| `seed`, `week` | the career's own, so the luck draw is the engine's |

---

## 3. MEASURED

**Provenance.** `n = 500` careers per arm, 1092 weeks each (14 -> 35), 31 arms, plus 6 mutation
arms. Worktree `tb-r42`, branch `round/42`, HEAD `fe4686d7`. ⚠ The checkout was DIRTY – other agents
were editing `src/engine/economy.ts` and `src/engine/match/*` while this ran – so the
`development` and `coach` blocks of `ECONOMY` were hashed against `HEAD:src/engine/economy.ts` and
found **byte-identical**, which is what makes §A-§C a reading of `fe4686d7` and not of somebody
else's half-finished wave. §D is the exception and says so below.

### 3.1 What she is born with – why the clock has to be read twice

| wing | born fill p10 | median | p90 | born already «done» |
| --- | ---: | ---: | ---: | ---: |
| serve | 0.67 | 0.76 | 0.89 | 8% |
| ret | 0.67 | 0.77 | 0.89 | 8% |
| composure | 0.66 | 0.76 | 0.89 | 5% |
| stamina | 0.67 | 0.77 | 0.89 | 7% |
| groundstrokes | 0.67 | 0.76 | 0.89 | 7% |

**7% of all wings are at or past 0.90 of their ceiling on week one.** `rollPotential` deals
`U[4, 26]` points of room over a build near 50, so a wing is born 0.66-0.89 full and the whole
dynamic range of the `fill` clock is the top quarter – which is also why the realisation clock is
printed beside it.

### 3.2 The clock – predicted against measured

| claim | predicted | measured | verdict |
| --- | --- | --- | --- |
| baseline median age at 0.90 fill | 17.2 | **16.53** | **MISS by 0.7 yr** – the hand model used `exp(-ΣM·a)` where `growWeek` runs `Π(1 - M·a·luck)`, which decays faster. Every hand figure below is late by about the same amount and in the same direction. |
| the five wings within ~0.5 yr of each other | yes | **yes – 16.41 to 16.61, a span of 0.20 yr** | **HIT** |
| baseline seed spread p10-p90 | 14.0 -> 19.5 (5.0 yr) | **13.85 -> 18.39 (4.54 yr)** | **HIT** |
| realisation 0.90 heavily censored at/below baseline | yes | **baseline 0% never, self-coached 80% never, self+off fit 91% never, light plan 83% never** | **HIT, and sharper than predicted** – the baseline itself does reach it (25.23), the rung below does not. |

### 3.3 The spread per lever (censored median over all five wings)

| lever | predicted | **measured** | reach-by-20, worst -> best |
| --- | ---: | ---: | --- |
| coach tier, neutral fit (self -> elite) | 1.6 yr | **1.40 yr** (17.60 -> 16.21) | 86% -> 100% |
| coach tier + the fit read (self/off -> elite/great) | 4.4 yr | **4.05 yr** (19.64 -> 15.59) | 53% -> 100% |
| plan size (light -> grind) | 2.8 yr | **2.64 yr** (18.56 -> 15.92) | 67% -> 100% |
| match load (0 -> 3 a week) | 1.3 yr | **1.17 yr** (16.53 -> 15.36) | 100% -> 100% |
| training load (knock-rest 0.35 -> summer double) | not predicted | **10.38 yr** (25.93 -> 15.55) | 27% -> 100% |
| **college vs tour, middle-coached** | 0.0-0.3 yr | **0.00 yr, to two decimals, every wing** | 100% -> 100% |
| **college vs tour, self-coached** | 0.0-0.3 yr | **0.00 yr median** (p90 20.31 -> 19.94) | 86% -> 91% |
| ⭐ the two realistic corners | ~7 yr | **9.30 yr** (23.89 -> 14.59) | 32% -> 100% |

Per wing, corner to corner: serve 9.53 · ret 8.84 · composure 9.51 · stamina 9.05 · groundstrokes
9.45.

### 3.4 Two things the arrival clock could not see, and one of them is the college answer

**(a) THE DEPARTURE.** 80% of physical wings fall back below 0.90 fill before 35, and the age they
do it at is the one place the five wings genuinely separate – in exactly the inverse of
`ECONOMY.development.ageWeight` (serve 0.6, groundstrokes 1.0, ret 1.2, stamina 1.6):

| baseline | serve | ground | ret | stamina | composure |
| --- | ---: | ---: | ---: | ---: | ---: |
| median age she leaves the ceiling | 32.36 | 30.67 | 30.21 | 29.56 | never |

**(b) AND COLLEGE IS NOT MUTE – IT IS MUTE ON THE WRONG CLOCK.** The fork is worth 0.00 years on
arrival and is worth this everywhere else:

| | tour | college (private) |
| --- | ---: | ---: |
| median age she LEAVES the ceiling (baseline family) | 30.21-32.36 | **32.36-34.43 (+2.07 yr on every wing)** |
| share of wings that fall back at all | 80% | **68%** |
| realisation 0.90, **self-coached** family | **never** (80% never reach it) | **27.55 (0% never)** |
| realisation 0.90, middle-coached family | 25.23 | 24.79 |

**This was not predicted and it is the sharpest result in the run.** A self-coached family whose girl
goes to a private programme is the one route in this measurement that turns «she never realises
herself» into «she does, at 27.5» – because `collegeCoachFactor` is an OVERRIDE, so four years of
`high`-rung coaching replaces the parent's 0.82 outright, and the college curve then hands her two
more years before `declineStart`.

### 3.5 The misses, named as misses

1. **The baseline median: predicted 17.2, measured 16.53.** The hand model used the exponential
   approximation of a product of `(1 - x)` terms; the real decay is faster. Every predicted figure
   in §0 is late by 0.3-0.9 years for this one reason, and the *spreads* (which are differences)
   survive it – which is why P2's spread column is inside 0.5 yr everywhere except the corners.
2. **The corners: predicted ~7 yr, measured 9.30 yr.** Predicted too NARROW. The worst corner in §0
   was priced at `M ≈ 0.53`; the shipped `fitFactor.off` is 0.75, not the 0.94 an older note in
   `tools/r34-reachable-ceiling.ts`'s header still quotes, so the bad end is worse than it was
   costed at.
3. **The college tail: predicted 1.5-2 yr for the slowest wings, measured 0.37 yr** (p90 20.31 ->
   19.94). Predicted too WIDE on the arrival clock. The prediction did not distinguish the arrival
   clock from the realisation clock, which is where the effect actually lives (§3.4b).
4. **P5's «a pointed plan pushes the unaimed wings to never» – HIT, and the size was not predicted.**
   Six fitness sessions a week: stamina arrives at 13.98 and the other four wings read **never** for
   72-74% of careers. A plan is the only lever in this engine that is per-WING, and it is total.
5. **Not predicted at all: the training-load channel is the widest lever in the game** (10.38 yr).
   It is not a dial the player sets directly – it is `KNOCK_REST_GROWTH` and the summer block – so
   the arm is an upper bound on «what a season of interrupted weeks costs», not a route she picks.

### 3.6 The real-career cross-check (§D) – do the clean arms land where a career lands?

9 careers per preset, 624 weeks, `openCareer` + `stepCareerWeek` under the `player` policy. Median
age at 0.90 fill, all five wings folded:

| preset | §D real careers | §B's matching arm | gap |
| --- | ---: | ---: | ---: |
| 25k middle, self-coached | **16.78** | 17.60 | 0.82 yr sooner |
| 25k middle, middle coach | **15.88** | 16.53 | 0.65 yr sooner |
| 120k wealthy, elite coach | **15.77** | 16.21 | 0.44 yr sooner |

The coach ORDER reproduces (self -> middle -> elite, 16.78 -> 15.88 -> 15.77) and every real career
arrives a little SOONER than its §B arm, in the direction §B itself predicts: §B's baseline plays
**zero** matches and carries no summer block, and §B's own load arms price 1 match a week at 0.54
years and the summer double at 0.98. So the offset is the two terms §B deliberately holds at their
floor, not a disagreement.

⚠ **Read the `all wings` column only.** Per wing, n is 9, and the per-wing columns scatter over 2.3
years with no order in them – that is noise, and §B's 500-career reading is the one that says the
wings arrive together.

⚠⚠ **§D is the one part of this document measured against a DIRTY tree.** Other agents were editing
`ECONOMY.vacation` pricing and `src/engine/match/*` while it ran, and the `player` policy books
vacations and plays real matches, so both can reach it. §A-§C cannot: they read only
`ECONOMY.development` and `ECONOMY.coach`, and both blocks were hashed byte-identical to
`HEAD:fe4686d7`.

---

## 4. The arm proof

⚠⚠ **The first run's arm proof read on the survivor median and every arm moved the WRONG WAY** –
crippling the elite coach made the median «arrive» 1.5 years SOONER, because the slow wings stopped
arriving at all and left the sample. That is survivorship, and it is the same family of mistake
CLAUDE.md's «prove the arm» note exists for. The instrument now censors (never = +Infinity) and the
proof is read on **reach-by-20**, which no dropout can invert.

| mutation | arm | reach-by-20 | censored median | never |
| --- | --- | --- | --- | --- |
| `coach.developmentFactor.elite` 1.15 -> 0.05 | elite coach | 100% -> **9%** | 16.21 -> **never** | 0% -> 87% |
| `coach.developmentFactor.self` 0.82 -> 3.00 | self-coached | 86% -> **100%** | 17.60 -> **14.48** | 0% -> 0% |
| `development.trainAt85` 1.28 -> 0.05 | grind plan | 100% -> **9%** | 15.92 -> **never** | 0% -> 87% |
| `development.matchBonus` 0.18 -> 1.00 | 3 matches a week | 100% -> 100% | 15.36 -> **14.21** | 0% -> 0% |
| ⭐ `ENDINGS.forkAgeYears` 19 -> 14 | college private | 100% -> 100% | 16.53 -> **16.30** | 0% -> 0% |
| ⭐ `ENDINGS.forkAgeYears` 19 -> 14 | **tour (the control)** | 100% -> 100% | 16.53 -> **16.53** | 0% -> 0% |

Every constant was restored and the baseline re-walked to **16.53**, identical to its first reading.

**The last two rows are what make §3.3's college zero a null and not a dead wire.** Moving the fork
from nineteen to fourteen separates the college arm (16.53 -> 16.30) while leaving the tour control
byte-still (16.53 -> 16.53). The college machinery is live and read; it simply arrives after the
clock has stopped.

---

## 5. The answer

Yes – different girls do arrive at different times, and the difference is mostly the route, not the
dice.

A girl on the middle of every road reaches 90% of a wing's ceiling at about 16 and a half. Two girls
born differently but raised the same are roughly four and a half years apart. Two girls born the same
but raised at opposite ends of what a player can choose are **nine and a half years** apart. So the
route is about twice the story her birth roll is, and it is fair for the game to talk about it.

Which choices carry that weight, in order:

1. **How she is trained.** A week of six sessions against a week of four is 2.6 years. And where the
   sessions point is not a matter of degree at all: six fitness sessions a week bring her stamina in
   at 14, and leave the other four wings unfinished for the rest of her life. This is the only lever
   in the game that separates one wing from another.
2. **Her coach, taken together with whether he suits her game.** Four years between the worst pairing
   and the best. The rung on its own is 1.4 years; the rest is the fit.
3. **How much she plays.** Just over a year between a girl who plays nothing and one who plays three
   matches every week.
4. **College or the tour.** Nothing at all on when she arrives – the decision comes at nineteen and
   the median girl has already arrived at 16.5. But it is the largest thing in the measurement on the
   two questions that come after: college keeps her at her ceiling about two years longer, and for a
   self-coached family it is the difference between a girl who never realises what she was born with
   and one who does, at 27.5.

Two things worth knowing before any of this reaches the screen.

**The five wings arrive together.** Under an ordinary training week they are within two and a half
months of each other. That is not a bug in the reading – it is what the model does, because all five
grow at one rate and only the plan's aim points it anywhere. Item 22 saw this and was right. Where
they genuinely come apart is on the way *down*: the serve holds to about 32, the groundstrokes to
31, the return to 30, the legs to 29 and a half, and the head never slips at all.

**She arrives early.** A career runs about fifteen years, and the ceiling is reached in the first two
and a half of them. Almost everything the player does after twenty is about holding on to it rather
than adding to it.

