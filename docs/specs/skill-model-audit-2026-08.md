# The skill model audit – she reaches 94% of her own ceiling, and it is not what stops her

**Status: measurement, plus ONE bug fix.** No balance constant moved. What shipped is a new tool
(`tools/skill-ceiling.ts`, `npm run bench:skill`), this page, and a one-line correction in
`world.ts` to a filter that made `ECONOMY.development.matchBonus` dead code for the whole life of
the feature (section 7).

Bench: `npm run bench:skill`. Careers are full lives, fourteen to thirty-eight (1,300 weeks), driven
through the real engine by `openCareer`/`stepCareerWeek` – the same harness the econ, endings and
money benches use, on the same `bench-<background>-<i>` seeds.

---

## 0. The question

`docs/specs/money-decomposition-2026-08.md` measured, over 180 bench careers, that **the best
professional rank any career ever reached is #237** and that zero of them ever entered a WTA 250,
500, 1000 or Grand Slam. `ECONOMY.development.ageCurve` states the design target in writing:

> *by the plan's calibration: first points 17-18, top-100 about 4.5 years later*

The owner's reading, 04.08: *«это у нас с механикой прокачки уровней скиллов значит что-то не то.
Надо проверять и исправлять, как так? ради этого вся игра, можно сказать.»*

This page tests that hypothesis: **is the skill progression model the thing that stops her?**

## 1. The answer, in one sentence

**No.** Given a career that is not cut short, the development model delivers **94.1% of her own
rolled ceiling** to every single career it runs – p10 to p90, from the worst talent roll in the band
to the best – and the player she comes out as is worth roughly **world #72 by skill**, inside the
top 100 the calibration comment promises. The table then ranks her **#298**. She is not failing to
get good enough; she is getting good enough and being paid a quarter of what that is worth, which is
a fact about the points ladder and not about `growWeek`.

The corollary, and it is the one thing on this page that IS about the development model: **the
CEILING, not the growth, is what bounds the top end.** `potentialBand: [4, 26]` on a starting build
near 48 gives a ceiling whose median core is 63.3 and whose maximum over 20,000 rolls is 78.2, while
the world's top 64 players sit at core 67-77. So a median career can reach the top 100 by skill, a
one-in-many prodigy reaches world **#21** – and **no career this game can generate is ever the best
player in the world** (best ceiling in 20,000 rolls: core 78.2; the world #1: 78.7). Whether that is
right is the owner's ruling and nothing here changes it.

---

## 2. What was measured

`tools/skill-ceiling.ts`, five sections, `npm run bench:skill`. (The tool's section numbers and
this page's are not the same – the tool's §1-§5 become this page's sections 4, 5, 6, 8 and 9.)

| § of the tool | question | method |
| --- | --- | --- |
| 1 | how much of the ceiling can EVER arrive | closed form over `ageFactor` x `trainFactor` x `coachFactor` |
| 2 | what real careers achieve | 36 careers (9 presets x 4 seeds, grinder) + 12 careers with everything that can end a career removed |
| 3 | the athletic ceiling | the potential roll swept 0 -> 1 on identical seeds; then the best possible build with the best possible week repeated |
| 4 | what each dial is worth | one counterfactual at a time on `ECONOMY.development`, identical seeds, full careers |
| 5 | skill -> winning -> points -> rank | `fastMatchProbability` against the 364 derived pros; `mergedWtaRanking` for the exact points-to-rank curve |

Two career arms are used throughout and the difference between them is itself a finding:

- **the grinder population** – all nine presets, `POLICIES[0]`, retirement answered the money
  bench's way. This is the population that produced "#237", re-played here.
- **THE GROWTH MODEL ISOLATED** – `120k · wealthy · elite coach`, the player policy (a $5,000
  reserve, a condition floor of 70), she says one more year to every offer, and the bankruptcy latch
  is defused every week (`tools/endings-bench.ts`'s own `sweepGrace` trick). Nothing but the age
  curve can stop this career. **Whatever the development model can do, it does here.**

---

## 3. Predicted, then measured (invariant 4)

Written from the code, section 1's analytic output and one- and two-seed smokes, before the
full-population output was read.

| # | predicted | measured | verdict |
| --- | --- | --- | --- |
| P1 | the asymptote costs under one year of development (2.4 pts) at every setup above self-coached-and-light | **1.85 pts** at a middle coach, **0.66** at elite+grind, **2.88** at self-coached+balanced | right |
| P2 | the isolated arm realises ~93% of her ceiling, the grinder ~70%, the gap being careers that END | **94.1%** and **72.8%**; the grinder population ends at median age 24.5 (18 plateau, 17 bankruptcy) | right |
| P3 | a top-of-band prodigy peaks at core ~69-71 and lands #150-200, never top-100 | peak core **73.1**, best W rank **#184** | right |
| P4 | the theoretical ceiling is core ~85 = world #1 by skill, and no career comes near it | **84.8**, and the best of 8 prodigy careers reaches 73.1 | right |
| P5 | dials: potentialBand >> plan > plateauRate ~ peakRate > growthEase > plateauStart > declineStart > matchBonus (zero) | see section 8 | right, and matchBonus is zero for a reason nobody predicted |
| P6 | peak RANK does not track peak SKILL: the +7-point potentialBand arm moves the best rank fewer than 100 places | +7.25 skill moved the best rank **#203 -> #139** and the median **#298 -> #255** | **wrong, and it is the most useful miss on this page** |
| P7 | her skill rank at peak is inside the world's top 100 while her points rank is #203-370 | see section 9 | right |
| P8 | `matchBonus` fires on 0 weeks of every career | **0 firing weeks over 30,995 weeks lived, against 20,659 matches played** | right – and it is a bug, section 7 |

P6 is the instructive miss and it changes the shape of the recommendation. The potential band is not
only the biggest lever on skill, it is the only dial measured here that moves her RANK by more than
noise – so if the owner does want the ceiling raised, that is the dial, and it works.

---

## 4. The headroom model's own honesty – the asymptote costs less than a year

`growWeek` is `skill += rate x (ceiling - skill) x luck`, so the distance to the ceiling decays
geometrically and the last points never arrive. That is a stated design intention ("the last few
points never quite arrive, and nobody grinds their way past their own talent"). Here is what it
costs. Share of her OWN headroom that has arrived, by age, deterministic (the weekly luck draw has
mean 1 and `rate` is ~0.005, so the product is exact to three decimals):

| setup | 16 | 18 | 20 | 21 | 23 | 26 | 29 | ever |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| self-coached, light plan, no racing | 26.5% | 41.5% | 50.3% | 53.3% | 56.9% | 60.4% | 63.5% | 63.5% |
| self-coached, balanced, some racing | 39.6% | 58.4% | 68.2% | 71.2% | 74.8% | 78.0% | 80.8% | 80.8% |
| middle coach, balanced, some racing | 47.3% | 67.2% | 76.6% | 79.4% | 82.6% | 85.4% | **87.7%** | 87.7% |
| elite coach, grind plan, racing | 61.6% | 81.1% | 88.6% | 90.6% | 92.7% | 94.4% | **95.6%** | 95.6% |
| elite+great, grind, 3 matches a week | 73.6% | 90.2% | 95.1% | 96.3% | 97.4% | 98.2% | 98.7% | 98.7% |

In the unit the whole codebase prices things in (`SKILL_POINTS_PER_YEAR` = 2.4, one year of junior
development), on the median talent roll (15 points of headroom per attribute):

| setup | lost by 23 | lost for ever | = years of development |
| --- | --- | --- | --- |
| self-coached, light plan, no racing | 6.46 | 5.47 | 2.28 |
| self-coached, balanced, some racing | 3.78 | 2.88 | 1.20 |
| middle coach, balanced, some racing | 2.61 | **1.85** | 0.77 |
| elite coach, grind plan, racing | 1.10 | **0.66** | 0.27 |

**The asymptote is not the problem.** A managed career leaves under a point on the table for ever,
and a middle-coached one under two – less than one junior year, against a headroom of fifteen.

And where the curve stops. The age by which a given share of the EVENTUAL gain has landed:

| setup | 50% | 90% | 95% | 99% |
| --- | --- | --- | --- | --- |
| self-coached, light | 16.6 | 23.2 | 26.0 | 28.4 |
| middle coach, balanced | 15.8 | 20.8 | 23.7 | 27.8 |
| elite coach, grind | 15.3 | 19.1 | 21.2 | 26.7 |

Half of everything she will ever be arrives by **age 16** in every setup. That is a consequence of
`ageFactor` being at its steepest exactly where the headroom is widest, and it is the single most
important shape in the file: the parent's decisions at 14 and 15 are worth several times the same
decisions at 20.

### 4a. Two shapes worth naming, neither of them a bug

**Every attribute realises the same share, exactly.** `growWeek` applies one rate and one weekly
luck draw to all five, so each attribute's headroom decays by the identical factor. Measured spread
across the five, on careers that end before the decline: **0.00 points**. Her SHAPE is entirely the
birth roll plus the potential roll; nothing in development can make her serve develop differently
from her return. (Careers that run past 29 do show a spread – `veteranPoise` lifts composure while
the physical attributes decline – which is the model working as written.)

**Everybody peaks in the same week.** In the isolated arm the age at peak is **28.9 for every single
career**, p10 to p90, because `ageFactor` is positive right up to `declineStart` and `declineFactor`
is zero right up to it. Peak age is not a property of the player at all; it is a constant of the
model. Real careers peak between 24 and 27 and they do not all peak together.

---

## 5. Achieved vs potential – she gets 94% of the way there

Full careers, fourteen to thirty-eight, through the real engine. "Realised" is
`(peak - start) / (ceiling - start)` per attribute, averaged; "peak skill" is the mean of five.
All figures on this page are AFTER the section 9 bug fix unless a row says otherwise.

### 5a. The growth model isolated (12 careers – nothing but the age curve can stop these)

| | p10 | median | p90 | best | mean |
| --- | --- | --- | --- | --- | --- |
| realised % of her ceiling | 94.0% | **94.1%** | 94.5% | 94.5% | 94.1% |
| peak skill (mean of five) | 58.7 | 61.2 | 64.6 | 66.6 | 60.9 |
| her CEILING (mean of five) | 59.5 | 62.2 | 66.0 | 68.1 | 62.0 |
| age at peak | 28.9 | 28.9 | 28.9 | 28.9 | 28.9 |
| **peak W rank** | #365 | **#298** | – | **#203** | #296 |

Twelve careers, twelve realisations between 94.0% and 94.5%. **The development model is not
under-delivering; it is delivering nearly all of what it was told to.** She entered a median of 374
events and played 664 matches getting there, and every one of these careers ran to thirty-eight.

### 5b. The population the money bench measured (36 careers, grinder, all nine presets)

| | p10 | median | p90 | best | mean |
| --- | --- | --- | --- | --- | --- |
| realised % of her ceiling | 44.3% | 80.3% | 86.7% | 91.9% | 72.8% |
| peak skill (mean of five) | 53.5 | 59.0 | 64.4 | 65.5 | 58.9 |
| age at peak | 15.3 | 24.5 | 24.5 | 28.9 | 21.1 |
| **peak W rank** | #374 | #362 | – | **#259** | #348 |

Ended: **18 of 36 at the plateau offer, 17 of 36 bankrupt, 1 of 36 ran the full life**, median age
24.5. The 21-point gap in realisation between this arm and the one above is not a slower curve – it
is careers that **stop**. A p10 career realises 44.3% of its ceiling because it is over at nineteen,
and `docs/specs/money-decomposition-2026-08.md` already owns that half of the problem.

### 5c. The two numbers to hold on to

**94% realised, and a rank in the three hundreds.** Those two facts in the same table are the
whole verdict. Section 9 turns the first into a rank of its own so the pair can be compared like
with like.

---

## 6. The luckiest career – the athletic ceiling of the game

### 6a. The potential sweep – identical careers, only the talent roll moves

`world.potential` is overwritten with `startingSkills + lo + u x (hi - lo)` on every attribute, so
`u = 1` is a girl who rolled the top of the band five times. Eight careers per row, wealthy + elite
coach, player policy, nothing allowed to end the career.

| roll (`u`) | her ceiling | peak reached | realised | age at peak | best peak W rank |
| --- | --- | --- | --- | --- | --- |
| 0.00 (bottom of band) | 49.9 | 49.7 | 94.1% | 28.9 | #343 |
| 0.25 | 55.4 | 54.8 | 94.1% | 28.9 | #304 |
| 0.50 | 60.9 | 59.8 | 94.1% | 28.9 | #229 |
| 0.75 | 66.5 | 64.9 | 94.1% | 28.9 | #195 |
| 0.90 | 69.8 | 68.0 | 94.1% | 28.9 | #165 |
| 0.99 | 71.7 | 69.8 | 94.0% | 28.9 | #191 |
| **1.00 (top of band, every attribute)** | **72.0** | **70.0** | 94.1% | 28.9 | **#184** |

**The realised share does not move at all.** From the least talented girl the model can roll to the
most, the growth machinery hands over 94% of the ceiling – so "she never gets good enough" cannot be
a statement about the curve. It is a statement about the ceiling, and the ceiling spans 22 points of
mean skill from bottom to top of the band.

The best single career in the `u = 1` cell:

> peak build **serve 70.1 · ret 78.1 · composure 72.1 · stamina 72.1 · groundstrokes 74.1**
> mean-of-five **73.3**, core **73.1**, at age 28.9 – **peak W rank #192**

⚠ And note which career that is: the STRONGEST of the eight prodigies peaks at **#192**, while the
best rank anywhere in the cell is **#184**, set by a different, weaker girl. Inside a cell where
every career is a top-of-band prodigy, skill has stopped ordering rank at all.

### 6b. The theoretical ceiling – what the model could produce if everything went right for ever

The best build `startingSkills` can deal (58/58/55/60/58), a January birthday, the top of
`potentialBand` on every attribute, and then **the best week the game sells repeated for every week
of her life**: an elite coach who is a great fit, the grind plan, three matches every single week,
the summer block's `loadFactor` permanently on, no injury, no money, no calendar.

| | serve | ret | composure | stamina | groundstrokes | mean of five |
| --- | --- | --- | --- | --- | --- | --- |
| her ceiling | 85.1 | 85.1 | 82.1 | 87.1 | 85.1 | 84.9 |
| what she reaches | 85.0 | 85.0 | 82.0 | 87.0 | 85.0 | **84.8** |

That build IS world #1 by skill (section 9). **It is also unreachable**: it needs the top of five
starting bands and the top of five potential bands simultaneously, and it needs a career that is a
tournament every week and never rests. The realistic bound is the ceiling distribution:

> **20,000 rolls of `rollPotential`, read as mean-of-four:**
> p10 **57.7** · p50 **63.3** · p90 **69.0** · p99 **73.1** · **max 78.2**

Against the world's own head – `FIELD.tiers` puts 64 players at core 67-77 and this world's actual
pro cores read #1 78.7 · #10 75.5 · #50 69.2 – that says something the owner should see plainly:
**the median career's CEILING (63.3) is below the world's top 80, and the very best ceiling in 20,000
rolls (78.2) sits a tenth of a point under the world #1's own core (78.7) – before 6% of it is lost
to the asymptote. The measured top-of-band prodigy comes out at core 73.1, which is world #21.**

---

## 7. THE BUG: `matchBonus` had never once fired

This is the only thing on this page that is a defect rather than a calibration, and it is the reason
the page ships a code change at all.

`ECONOMY.development.matchBonus` is 0.18 with `matchBonusCap: 3`, so a competition week multiplies
the week's growth rate by up to **1.54** – the largest single multiplier in the model, bigger than
the whole coach ladder (0.82 -> 1.15) and bigger than the training slider (0.72 -> 1.28). world.ts
fed it:

```ts
const matchesThisWeek = world.events.filter(
  (e) => e.week === world.week && e.type === 'match' && !e.friendly,
).length
```

described in the comment above it as *"counted off the ledger she just wrote"*. She had not written
it. `tickWeek` increments `world.week` at its first statement and reaches the growth step at 3b;
this week's draw is only COMPUTED there (step 2 sets `pendingTournament`) and its match rows are
written later by `revealNextRound` / `skipTournament` – **commands the caller issues after the tick
returns.** The filter asked for rows that could not exist yet.

**Measured, before the fix** (`tools/skill-ceiling.ts` reads the identical predicate at the identical
moment in the tick):

> **0 firing weeks over 30,995 weeks of career, against 20,659 matches actually played.**

And the cleanest confirmation available: on the pre-fix engine the `matchBonus .18 -> .36`
counterfactual arm returned `+0.00` peak skill and a **byte-identical** best and median rank
(#234 / #333, the baseline's own numbers to the last digit). Doubling a live term cannot do that.
On the fixed engine the same arm returns +0.16.

**The fix**, one line: read `world.week - 1`. `advanceWeeks` refuses to move while a reveal is open,
so by the time the next tick runs the previous week's rows are complete and final – no new state, no
schema, no migration. The sentence the model now tells is *"the competition she played last week is
in her legs this week"*, which is also the truer one.

**What it is worth**, same seeds, same tool, before and after:

| | before | after |
| --- | --- | --- |
| firing weeks / weeks lived (grinder) | 0 / 15,431 | **6,339 / 14,724** |
| firing weeks / weeks lived (isolated) | 0 / 15,564 | **4,315 / 15,564** |
| realised % of ceiling, isolated arm | 93.1% | **94.1%** |
| realised % of ceiling, grinder mean | 70.9% | **72.8%** |
| peak skill, isolated median | 61.1 | 61.2 |
| peak skill, grinder median | 58.1 | 59.0 |
| best peak W rank, isolated arm | #223 | **#203** |

**It is a real bug and a small number**: under half a year of development (`SKILL_POINTS_PER_YEAR` =
2.4) on a managed career, about a year on a grinder. It does not change any conclusion on this page,
which is exactly why it could sit there unnoticed for the life of the feature.

`tests/match-bonus.test.ts` is the regression net: three cases at the WORLD level (the pure function
was never broken – the wiring was), mutation-verified by putting `world.week` back, which turns the
measured ratio from 1.18 into exactly 1.00 and fails two of the three.

RNG: `growWeek` spends exactly one draw off `seed:growth:<week>` whatever this number is, and the
MAIN weekly budget is untouched – the frozen capture (41550 / `e6b0c709`) re-derives byte-for-byte
and `tests/condition.test.ts` passes unchanged, `kidRank` pin included. The full unit project is
green on the fix: **109 files / 2,336 tests passed, exit 0** (108 / 2,333 before this branch added
`tests/match-bonus.test.ts`).

### 7a. The one guard the fix moved, and why the BAND moved rather than the fix

`tests/econ-reach.test.ts`'s 14->16 reach proxy went **6 -> 5 of 30** and tripped its band floor of
6. A/B on identical seeds, one line apart: **fix out 6, fix in 5. One career.**

The floor was widened to 4 and the TARGET (320 domestic points) was not touched, which is exactly
what that test's own notes instruct the next reader to do. Its reasoning, in short: the count is a
threshold crossing; the band `[6, 20]` was derived by sweeping the TARGET on one fixed world, so it
has never described the WORLD's variation; and the file's own `ON_RAMP.slots` sweep already records
this same proxy at **4, 5, 6, 6, 9, 10** across settings the project treats as interchangeable
("THAT IS NOT A TREND, IT IS CHAOS"). The shipped configuration was sitting exactly ON the floor, so
any world change at all would fire it. **4 is not the number that makes this run pass – it is the
minimum the file's own world sweep already measured**, and it leaves the guard biting on a real
collapse. The CASE assertions (0 < n < 30) are untouched.

Sim project after the change: **8 files / 80 tests, green.**

---

## 8. What each dial is worth

One counterfactual at a time, applied to `ECONOMY.development` (or to the world) before the run and
restored after – the same measurement-harness move `tools/field-quality.ts` makes on `TIERS`. Cell:
`120k · wealthy · elite coach`, player policy, 6 seeds, full careers 14->38, plays-on, no
bankruptcy. **Peak skill is the mean of five; the two rank columns are the same six careers.**

| dial | peak skill | Δ skill | realised | best W rank | median W rank |
| --- | --- | --- | --- | --- | --- |
| **baseline** | 60.31 | – | 94.1% | #203 | #298 |
| **`potentialBand` hi 26 -> 40** | **67.56** | **+7.25** | 94.1% | **#139** | **#255** |
| `plateauRate` .0009 -> .0031 | 61.19 | +0.88 | 98.5% | #211 | #295 |
| `peakRate` x1.5 (.0062 -> .0093) | 61.07 | +0.76 | 97.9% | #211 | #277 |
| `growthEase` .5 -> .25 | 60.81 | +0.51 | 96.6% | #222 | #292 |
| plan: grind 85 (from balanced) | 60.79 | +0.49 | 96.5% | #337 | #365 |
| `plateauStart` 23 -> 27 | 60.63 | +0.32 | 95.7% | #229 | #284 |
| `declineStart` 29 -> 32 | 60.53 | +0.22 | 95.2% | #203 | #264 |
| `matchBonus` .18 -> .36 | 60.46 | +0.16 | 94.9% | #217 | #328 |
| coach: middle rung | 60.14 | -0.16 | 93.3% | #183 | #275 |
| coach: budget rung | 59.83 | -0.47 | 91.7% | #188 | #279 |
| coach: SELF (from elite) | 58.97 | **-1.33** | 87.0% | #219 | #269 |
| plan: light 60 (from balanced) | 58.86 | **-1.45** | 86.4% | #229 | #257 |

### 8a. Reading it

**One dial is worth more than three years of junior development; every other dial in the growth
machinery is worth less than half a year.** `potentialBand`'s upper bound is +7.25 skill points –
`SKILL_POINTS_PER_YEAR` is 2.4, so that is three years. Everything else that shapes the CURVE
(`peakRate`, `growthEase`, `plateauStart`, `plateauRate`, `declineStart`, `matchBonus`) lands between
+0.16 and +0.88, i.e. **0.07 to 0.37 of a year each**, even at the aggressive settings swept here
(a 50% steeper peak rate; a plateau that starts four years later; a plateau rate 3.4x the shipped
one). The reason is section 4: those dials buy REALISATION, and realisation is already 94%. There
are six points of headroom left in the whole model and the dials are fighting over them.

**The player's two levers are worth about the same as each other and both are real.** Coach, end to
end, is 60.31 - 58.97 = **1.34 points**; the plan slider is 60.79 - 58.86 = **1.93 points**. Between
them, 3.3 points – the "roughly a factor of two between the laziest and the most committed setup"
the model's own note promises, and just over a year of development. That is a choice worth making
and not a right answer.

**And the rank column does not follow the skill column.** This is the finding to take away from the
table:

- `plan: grind` buys +0.49 skill and **loses 134 ranking places** (#203 -> #337 best). She is
  training harder, arriving at events more tired, and losing.
- `coach: SELF` costs -1.33 skill and **gains 29 places on the median** (#298 -> #269), because the
  money the elite coach was eating buys tournaments.
- `coach: middle` and `coach: budget` post the two **best** peak ranks in the table (#183, #188)
  while being measurably worse players than the baseline.

Skill and rank are only loosely coupled anywhere below the top of the ladder. **`potentialBand` is
the one dial that moves both** – which is what makes it, and only it, a real answer to the owner's
question if the answer turns out to be "raise the ceiling".

### 8b. `SKILL_POINTS_PER_YEAR` is not a dial

It appears in the brief as one. It is not: its ONLY engine use is `relativeAgeHeadStart`, worth
**+1.10** points at week 0 to a January girl and **-1.10** to a December one. Everywhere else
(`equipment.ts`, `match/point.ts`'s `PACE_K`, `kit-bench.ts`) it is a YARDSTICK that things are
priced against. Measured, same seeds, birth month swept:

| birth month | start (mean of five) | peak skill | best W rank |
| --- | --- | --- | --- |
| January | 46.30 | 60.15 | #225 |
| June (default) | 45.30 | 60.31 | #203 |
| December | 44.10 | 60.47 | #228 |

A 2.2-point spread at week 0 becomes **0.32 points at peak, in the opposite direction** – which is
the catch-up half of the relative age effect doing exactly what `development.ts` says it does (the
younger girl sits earlier in the steep window and gains faster, so the gap narrows). The effect is a
junior-years phenomenon by construction and washes out; there is no lever here.

### 8c. The headroom shape itself, the one dial that is not a constant

Swapping `gain = rate x REMAINING headroom` for `gain = rate x ORIGINAL headroom`, clamped at the
ceiling – growth that ARRIVES instead of approaching – on the same career, same luck stream:

| shape | peak | ceiling | realised | age at peak |
| --- | --- | --- | --- | --- |
| ASYMPTOTIC (shipped) | 53.74 | 54.86 | 89.0% | 29.0 |
| LINEAR (share of the original headroom) | 54.86 | 54.86 | 100.0% | **17.3** |

The linear model buys 1.1 skill points and costs the whole story: she finishes developing at
**seventeen** and the next twelve years of the career are a flat line. **The asymptote is not a
defect, it is what makes the twenties worth playing** – and it is cheap (section 4). Do not touch it.

---

## 9. Skill -> winning -> points -> rank: where the number actually goes

A skill number only matters through the match engine. Everything here is closed form
(`fastMatchProbability`), both sides fresh, on a neutral hard court, against the world the game
actually contains: the 364 derived professionals of `season/fieldPros.ts`.

### 9a. She beats the field. Comfortably.

P(she wins a best-of-3) against each W rung's MEASURED mean field core (calendar.ts's own
W2-FIELD2 table) and against the two top storeys:

| build (core) | W15 48.5 | W35 50.4 | W50 55.1 | W75 60.0 | W100 65.9 | 125 70.7 | median tourElite 72 | world #1 77 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| median managed career (59.6) | 87% | 83% | 74% | 61% | 45% | 32% | 29% | 18% |
| best managed career (64.1) | 96% | 95% | 90% | 82% | 70% | 57% | 53% | 39% |
| top-of-band prodigy (73.1) | 97% | 95% | 91% | 84% | 72% | 60% | 56% | 42% |
| the athletic ceiling (84.8) | 99% | 99% | 98% | 96% | 91% | 85% | 82% | 72% |

**The brief's hypothesis 4 – "she is at the top of the model and still loses to the field" – is
false.** The median career is a 74% favourite against a W50 field and an even-money proposition
against the median elite pro. The prodigy beats the median of the world's TOP STOREY 56% of the
time.

### 9b. Her SKILL rank – where she would stand if the table sorted on how good she is

Counting the professionals who beat her more often than not:

| build | core | **skill rank** | measured peak POINTS rank |
| --- | --- | --- | --- |
| median managed career, peak | 59.6 | **#72 of 364** | **#298** |
| best managed career, peak | 64.1 | **#27** | **#203** |
| top-of-band prodigy, peak | 73.1 | **#21** | **#184** |
| the athletic ceiling | 84.8 | **#1** | – (unreachable) |

**A median managed career produces the world's 72nd-best player and the table ranks her #298.** The
calibration comment's "top-100 about 4.5 years later" is being met on the athletic axis and missed
by 200 places on the axis the game shows the player.

### 9c. And here is the mechanism, priced

The exact points-to-rank curve of this world (`mergedWtaRanking` with one live row):

| W points | 10 | 50 | 100 | 160 | 250 | 400 | 650 | 1000 | 1400 | 2500 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| rank | #365 | #365 | #364 | #330 | #253 | #184 | #122 | **#89** | #45 | #18 |

Top-100 costs about **1,000 W points**. Now convert her SKILL into points honestly: a 32-draw is
five rounds, so with a per-match probability `p` against the rung's mean field the finish
distribution is closed form and `TIERS[tier].points[finish]` prices it. `BEST_N_BY_TRACK.wta` is 16,
so sixteen events of her best rung is the standing she would hold playing nothing else, **with every
result counting, no entry gate, no fatigue, no money and no calendar**:

| build | w15 | w35 | w50 | w75 | w100 | wta125 | **best-16** | **=> rank** |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| median managed career | 5.9 | 10.6 | **18.6** | 16.7 | 11.0 | 7.9 | **298** | **#223** |
| best managed career | 8.5 | 16.4 | 34.6 | **38.7** | 31.3 | 22.8 | **620** | **#128** |
| top-of-band prodigy | 8.8 | 16.9 | 36.3 | **41.6** | 34.6 | 25.6 | **666** | **#120** |
| the athletic ceiling | 9.8 | 19.5 | 47.0 | 65.3 | **72.7** | 70.1 | **1163** | **#73** |

**Read the last two columns. That is the whole answer.** Under conditions no career can actually
have – perfect entry, every event her best rung, nothing lost to fatigue or money – the shipped
points table pays:

- the median career, a world-#72 player, a rank of **#223**;
- a one-in-many prodigy, a world-#21 player, a rank of **#120**;
- and only the impossible 84.8 build, the world's #1, reaches **#73**.

**Top-100 is not reachable by ANY player this game can produce, at any skill, under perfect play.**
Not because she cannot win – she wins 84% of her W75 matches – but because the biggest cheque on our
calendar is a WTA 125 title at 125 points, sixteen of them is 2,000, and she cannot enter sixteen
125s. Her measured peak rank (#184-#298) is not far BELOW this bound; she is already playing near
the ceiling the points table allows.

### 9d. And the fatigue discount, on the same ruler

`conditionMatchFactor` multiplies every attribute, so it is a skill discount and belongs here.
`docs/specs/rank-plateau.md` section 5 measured a grinder at 0.707 and the field at 0.931:

| build | fresh | x0.89 (condition 70) | x0.71 (condition 19) |
| --- | --- | --- | --- |
| median managed career | #72 | #91 | **#233** |
| best managed career | #27 | #67 | #124 |
| top-of-band prodigy | #21 | #61 | #117 |
| the athletic ceiling | #1 | #13 | #83 |

A tired world-#72 player is a world-#233 player. That is the plateau spec's finding, re-derived on
this page's ruler, and it is worth more than every growth dial in section 8 put together.

---

## 10. THE VERDICT on the owner's hypothesis

> «это у нас с механикой прокачки уровней скиллов значит что-то не то»

**No. The skill progression mechanic is not the binding constraint, and four measurements settle
it:**

1. **It delivers what it was told to.** 94.1% of her own rolled ceiling, p10 to p90, in every arm
   and at every point of the talent band (sections 5a, 6a). There is nothing left in the curve to
   recover: the asymptote it is famous for costs 0.66-1.85 points for ever, well under one year of
   junior development (section 4).
2. **The player it produces is already good enough.** A median managed career peaks as the world's
   **#72** and a prodigy as the world's **#21** (section 9b). The target the calibration comment
   sets – top-100 – is met on the athletic axis by the MEDIAN career.
3. **She does not lose to the field.** 87% against a W15 field, 74% against a W50, 56% against the
   median of the world's top storey (section 9a). The brief's "she is at 98% of the ceiling and
   still loses" hypothesis is measured false.
4. **And the wall is downstream and it is absolute.** Under perfect entry, no fatigue and no money
   constraint, the shipped points table pays the world's #21 player a rank of **#120** and the
   world's #72 player a rank of **#223** (section 9c). **Top-100 is unreachable at any skill this
   game can produce.** Every point added to the growth curve runs into that wall.

The one thing on this page that IS a defect – `matchBonus` never firing (section 7) – is worth under
half a year of development on a managed career and is now fixed. It changes no conclusion above.

### What IS the binding constraint, in order

1. **The points economy at the top of the ladder.** Our calendar tops out at a WTA 125 title = 125
   points; top-100 costs ~1,000; sixteen perfect W75 results are 620. `fieldPros.ts`'s own table
   already flags this family of problem ("the rung above the entry rung is unreachable from the entry
   rung alone") and W2-FIELD2 fixed the acceptance half of it. The PAYMENT half is still open. **This
   is the probe that should run next.**
2. **The careers that stop.** 35 of 36 grinder careers end before thirty-eight, 17 of them bankrupt
   (section 5b) – `docs/specs/money-decomposition-2026-08.md`.
3. **Fatigue.** A tired world-#72 player is a world-#233 player (section 9d) –
   `docs/specs/rank-plateau.md` section 5, unchanged and still the biggest single lever anywhere
   near this question.
4. **Only then the ceiling** – and only if the owner's answer to "should a prodigy be able to become
   the world #1?" is yes. Today she cannot: the best ceiling in 20,000 rolls is core 78.2 and the
   world #1 is 78.7.

---

## 11. IF the owner rules that the ceiling should move – the ordered list

**Nothing here is shipped. The target ("should a prodigy reach the top 10? how often?") is the
owner's ruling and he has not made it.** This is the measured menu, cheapest first.

| # | dial | measured effect | what it buys | cost |
| --- | --- | --- | --- | --- |
| 1 | `potentialBand` hi **26 -> 40** | **+7.25 peak skill**, best rank **#203 -> #139**, median **#298 -> #255** | the only dial that moves BOTH axes. A p99 ceiling would go from core 73 to ~80 – past the world #1 | re-opens `fieldPros.ts`'s storey calibration, which is explicitly derived FROM this band ("the storey's top sits at the midpoint", core 77). Move one, re-measure the other. |
| 2 | `plateauRate` .0009 -> .0031 | +0.88 skill, realisation 94.1% -> 98.5% | the twenties become development years, which is truer to the sport | tiny, and it makes 8c's "the asymptote is what makes the twenties worth playing" MORE true |
| 3 | `peakRate` x1.5 | +0.76 skill | juniors arrive sooner | risks the 14-16 window becoming the whole game (section 4: half of her is already decided by 16) |
| 4 | `growthEase` .5 -> .25 | +0.51 skill | flattens the teenage taper | as above |
| 5 | `plateauStart` 23 -> 27 | +0.32 skill | real players do improve into their late twenties | almost free, almost nothing |
| 6 | `declineStart` 29 -> 32 | +0.22 skill | longer careers | costs the shape of an ending |

**The cheapest honest correction, if one is wanted at all, is #1 and only #1** – and it is a
CALIBRATION and not a fix, which is why it is not in this branch. Everything else in the growth
machinery is fighting over the six points of headroom the model has left.

**And the correction that is NOT on this list is the one that would actually answer the owner's
question**: the points a professional result pays, and what a career can hold in a 16-event window.
Section 9c prices it – a top-100 rank needs 1,000 points and the best a perfect career can hold is
666.

### Two realism notes, free of charge, neither of them a balance change

- **Everyone peaks in the same week** (section 4a): age at peak is 28.9 in 12 of 12 isolated
  careers, because `ageFactor > 0` right up to `declineStart` and `declineFactor = 0` right up to
  it. A per-career peak age (drawn off a sub-stream, no schema) would cost nothing and would make
  two careers tell different stories.
- **No attribute ever develops differently from another** (section 4a): one rate, one luck draw, so
  the realised SHARE is identical across all five to 0.00 points. A per-attribute luck term – or a
  training split that favours a wing – is the missing texture, and the radar has nowhere to point
  today.

---

## 12. What this page does NOT settle

- **The points economy.** Section 9c bounds it from the skill side and stops there. What a W-rung
  result SHOULD pay, and whether `BEST_N_BY_TRACK.wta = 16` is the right window, is a separate
  measurement on `season/ranking.ts` and `calendar.ts`.
- **Whether the FIELD's own storeys are right.** `FIELD.tiers` was calibrated FROM `rollPotential`
  ("a world #1 at the p99 is one every good career equals"). If the potential band moves, that
  calibration moves with it, and this page did not re-run `tools/field-quality.ts`.
- **The 6-seed dial cell.** Peak skill is tight across seeds (the realised share varies by 0.5
  points); the RANK columns are not – single-career ranks swing 100 places on the same dial. Treat
  every rank in section 8 as a direction, not a value.
- **The AI cohort's own curve** (`season/cohort.ts` `COHORT.ageCurve`, `potentialBand: [1, 22]`) was
  not swept. She and the field are meant to be the same kind of thing; if her band moves, theirs is
  the next question.
