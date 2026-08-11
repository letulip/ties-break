---
type: spec
status: draft
area: engine/development
canonical: false
last-reviewed: 2026-08-12
---

# The age curve – when she stops getting better, and whether that is a dial

**Status: MEASUREMENT. Nothing shipped.** No constant moved, no test bound moved, no engine
behaviour moved. What this branch adds is `tools/growth-age-sweep.ts` and this page. Every arm
patches `ECONOMY.development.ageCurve` in place and restores it in a `finally`, and the tool exits 1
if the curve is not back where it started.

The owner, 11.08: **«про возраст собрать статистику и получить замер было бы интересно».**

This is the question `docs/specs/potential-band-2026-08.md` closed on rather than answered: raising
the potential floor "changes the AMOUNT, not the TIMING ... if the real complaint is *there is
nothing left to play for AT SEVENTEEN*, the dial is the AGE CURVE, and this page does not measure
it." This page measures it.

**Measured on `wave/flags-grant` head `5291117`.** Reproduce:

```bash
npx vite-node tools/growth-age-sweep.ts -- --only 1,2,3,4 --seeds 12   # ~8 min
npx vite-node tools/growth-age-sweep.ts -- --only 5,6 --seeds 12       # ~20 min
npx vite-node tools/growth-age-sweep.ts -- --only 7 --save <a .tsave>  # local only
```

---

## 0. The one-page answer

| question | answer |
| --- | --- |
| At seventeen, what is slowing her – the AGE RATE or the ASYMPTOTE? | **The asymptote, roughly 2:1.** 59–66% of the fade against 28–38% (§1a). The better her coaching, the more lopsided it gets. |
| At twenty? | **Still the asymptote, 53–61% against 37–46%** (§1a). The two only cross at **21** self-coached, at **23** with a coach. |
| So is the age curve the dial? | **No. Say so plainly.** §1c: `peakRate x1.5` raises the rate at 17 by 50% and moves a week at 17 by **x0.99** – the asymptote eats the whole increase. A later `growthEnd` gives back x1.16 of a x1.31 rate lift, and makes age 23 **x0.66 WORSE** than today. |
| Does the model peak where its own comment says (23-28)? | **Yes, and this was the surprise.** Peak skill lands at **28.9** in all four cells; peak rank 26.7–31.1; peak prize 26.0–31.0. The hypothesis that it peaks her at nineteen is **false**. |
| Then what is actually wrong? | **The peak is real but the climb to it is invisible.** From 18 to 28 the median career gains **2.3 skill points over ten years** (§2), and her professional rank moves **#247 to #202** (§4). Nothing new opens: `wta250` is the best rung she reaches at 18 and at 30. |
| When does a week stop being perceptible? | **Age 19.** By the radar's own `TRAINING_FOG_FLOOR` a season at 19 needs 5.1 years to earn one notch; at 23, 19.5 years (§3). |
| Is there a dial that helps at seventeen? | **Not on the age curve.** Every rate dial makes her finish EARLIER (`realised@18` goes 69.3% -> 83.1% under `peakRate x1.5`), which is the opposite of the ask. See §8 for where the live dials actually are. |
| What is the BEST an age-curve change can do? | **Two years, on the slowest cell only.** `plateauRate` x3.4 moves the invisibility age 19 -> 21 self-coached and **not at all** on a coached career, and adds **+1.26 skill points spread over seven seasons** (§5). The visibility floor is 3 points. |

⚠ **Her career is not dead and this page does not say it is.** The owner's own save is 255th on the
professional table and earning. What the measurement says is narrower and more useful: after
eighteen the model gives her **money and rank drift, not development**.

---

## 1. ⚠ THE DECOMPOSITION – the crux, and it decides whether §5 means anything

`growWeek` is one line and the whole question is in it:

```
gain = ageFactor(age) x K x headroom x luck x aim        K = trainFactor x coach x matchBonus
         \_ THE AGE RATE _/          \_ THE ASYMPTOTE _/
```

Two independent mechanisms, and only one of them is a dial:

| mechanism | what it is | is it tunable? |
| --- | --- | --- |
| **THE AGE RATE** | `ageFactor(age)` falls from `peakRate` 0.0062 to `plateauRate` 0.0009 | **YES** – four numbers in `ECONOMY.development.ageCurve` |
| **THE ASYMPTOTE** | `headroom = potential - skills` shrinks as she climbs | **NO** – it is the shape of the model, not a constant |

Because the gain is their PRODUCT, the fade decomposes exactly, and in logs it is additive.

### 1a. The exact split, on the real engine's own trajectory

12 careers a cell, `player` policy, bankruptcy defused, every retirement offer refused. The three
ratio columns multiply to the fourth by construction; `other (K)` is printed so nothing hides in a
residual. Everything is indexed to age 14.

**8k · working · self-coached** (headroom at 14: 12.5 pts mean-of-five; a week gains 0.07)

| age | AGE RATE | ASYMPTOTE | other (K) | a week is worth | fade owed to THE AGE RATE | fade owed to THE ASYMPTOTE |
| --- | --- | --- | --- | --- | --- | --- |
| 14 | x1.00 | x1.00 | x1.00 | 100.0% | – | – |
| 15 | x0.88 | x0.77 | x0.95 | 64.8% | 29% | **60%** |
| 16 | x0.77 | x0.61 | x0.98 | 46.0% | 34% | **63%** |
| **17** | x0.65 | x0.51 | x0.96 | **31.6%** | **38%** | **59%** |
| 18 | x0.55 | x0.43 | x0.94 | 22.1% | 40% | 56% |
| 19 | x0.46 | x0.37 | x0.96 | 16.7% | 43% | 55% |
| **20** | x0.38 | x0.33 | x0.99 | **12.6%** | **46%** | **53%** |
| 21 | x0.30 | x0.30 | x0.97 | 8.7% | 50% | 49% |
| 22 | x0.21 | x0.28 | x0.97 | 5.9% | 54% | 45% |
| **23** | x0.17 | x0.27 | x0.95 | **4.3%** | **56%** | **42%** |
| 28 | x0.17 | x0.21 | x0.83 | 3.0% | 51% | 44% |

**All four cells, at the three ages that matter:**

| cell | 17: age / asymptote | 20: age / asymptote | 23: age / asymptote | a week at 17 |
| --- | --- | --- | --- | --- |
| 8k · working · self-coached | 38% / **59%** | 46% / **53%** | **56%** / 42% | 31.6% |
| 8k · working · middle coach | 31% / **66%** | 40% / **61%** | 50% / 50% | 24.9% |
| 25k · middle · middle coach | 31% / **65%** | 40% / **60%** | 50% / 49% | 24.8% |
| 120k · wealthy · elite coach | 28% / **64%** | 37% / **58%** | 48% / 48% | 21.7% |

Three things to read off this and one warning:

1. **At seventeen the asymptote dominates in every cell, by roughly two to one.** The age curve is
   the minority cause of the thing the owner is looking at.
2. **The better the coaching, the more lopsided it gets.** A coach makes her climb faster, so she
   arrives at seventeen with less headroom – the asymptote's share rises from 59% (self-coached) to
   66% (middle coach). ⚠ **Paying for development is what empties the tank early.**
3. **The two only cross at 21 (self-coached) or 23 (coached).** By the time the age curve is the
   majority cause, a week is already worth 4–6% of a week at fourteen. It becomes the dominant
   brake exactly when there is nothing left for it to brake.
4. ⚠ `other (K)` stays within 0.83–1.02 everywhere, so the match bonus, coach churn and summer block
   are not quietly carrying the result. The split is between the two named mechanisms.

### 1b. Hold one fixed and vary the other

The growth arithmetic alone, no calendar, 200 seeds a cell. Each arm calls the SHIPPED `growWeek` and
freezes a factor **by what it passes** – `ageYears: 14` every week, or `potential` re-pinned to
`skills + H0` every week. No engine code is touched by either.

**8k · working · self-coached** – a week's gain, indexed to age 14:

| arm | 14 | 15 | 16 | **17** | 18 | 19 | **20** | 21 | 22 | **23** | 28 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| BOTH LIVE (the model) | 100% | 68% | 46% | **32%** | 23% | 17% | **12%** | 9% | 6% | **4%** | 3% |
| AGE RATE FROZEN at 14 | 100% | 74% | 55% | **41%** | 30% | 23% | **17%** | 13% | 9% | **7%** | 2% |
| ASYMPTOTE OFF (headroom pinned) | 100% | 88% | 76% | **65%** | 55% | 46% | **38%** | 30% | 21% | **17%** | 17% |
| BOTH FROZEN | 100% | 100% | 100% | 100% | 100% | 100% | 100% | 101% | 100% | 100% | 100% |

**120k · wealthy · elite coach** – the same four arms:

| arm | 14 | 15 | 16 | **17** | 18 | 19 | **20** | 23 | 28 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| BOTH LIVE (the model) | 100% | 60% | 37% | **23%** | 15% | 10% | **7%** | 2% | 2% |
| AGE RATE FROZEN at 14 | 100% | 65% | 42% | **27%** | 17% | 11% | **7%** | 2% | 0% |
| ASYMPTOTE OFF (headroom pinned) | 100% | 88% | 77% | **65%** | 55% | 46% | **38%** | 17% | 17% |
| BOTH FROZEN | 100% | 100% | 100% | 100% | 100% | 100% | 100% | 100% | 100% |

Read the two middle rows against each other at 17. **Turning the asymptote off leaves 65% of a
fourteen-year-old's week; freezing the age rate leaves 41% self-coached and 27% elite-coached.** The
asymptote is doing more of the work, and it is doing more of it the better the coach.

⚠ **These are not a partition and the tool says so.** The two mechanisms interact: a frozen-high age
rate eats the headroom faster, which is why the frozen-age arm fades harder here than the
asymptote's share in §1a. **§1a is the unbiased split; §1b is the mechanism.** They agree on the
direction and on the ordering, which is the claim being made.

The last row is the harness proving itself: freeze both and a week at 28 is worth exactly what a
week at 14 is worth. Nothing else in the model fades.

### 1c. ⚠ THE DIAL EATS ITSELF – what a rate lift actually buys

Every number below is a RATIO TO BASELINE at the same age. A later `growthEnd` raises the rate at 17;
it also raises it at 14, 15 and 16, so she arrives at 17 with less headroom, and the gain is the
product of the two.

**8k · working · self-coached**

| variant | 17: rate | 17: headroom | **17: a week** | 20: rate | 20: headroom | **20: a week** | 23: rate | 23: headroom | **23: a week** |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| baseline | x1.00 | x1.00 | x1.00 | x1.00 | x1.00 | x1.00 | x1.00 | x1.00 | x1.00 |
| growthEnd 18->21 | x1.31 | x0.89 | **x1.16** | x1.65 | x0.73 | **x1.20** | x1.00 | x0.66 | **x0.66** |
| growthEase .5->.25 | x1.41 | x0.85 | **x1.20** | x1.39 | x0.70 | **x0.98** | x1.00 | x0.67 | **x0.67** |
| plateauStart 23->27 | x1.00 | x1.00 | x1.00 | x1.24 | x0.97 | x1.20 | x1.95 | x0.86 | **x1.68** |
| plateauRate .0009->.0031 | x1.00 | x1.00 | x1.00 | x1.55 | x0.93 | x1.44 | x3.44 | x0.71 | **x2.43** |
| **peakRate x1.5** | **x1.50** | x0.66 | **x0.99** | x1.39 | x0.54 | **x0.75** | x1.00 | x0.51 | **x0.51** |
| declineStart 29->32 | x1.00 | x1.00 | x1.00 | x1.00 | x1.00 | x1.00 | x1.00 | x1.00 | x1.00 |
| LATE SHAPE (3 dials) | x1.31 | x0.89 | **x1.16** | x1.65 | x0.73 | **x1.20** | x3.44 | x0.55 | **x1.91** |

**120k · wealthy · elite coach** – the same arms, and the effect is stronger because the tank empties sooner:

| variant | **17: a week** | **20: a week** | **23: a week** |
| --- | --- | --- | --- |
| growthEnd 18->21 | x1.10 | x1.04 | **x0.54** |
| growthEase .5->.25 | x1.11 | x0.83 | **x0.55** |
| plateauStart 23->27 | x1.00 | x1.18 | x1.56 |
| plateauRate .0009->.0031 | x1.00 | x1.39 | x2.06 |
| **peakRate x1.5** | **x0.81** | **x0.56** | **x0.37** |
| LATE SHAPE (3 dials) | x1.10 | x1.04 | x1.44 |

**This table is the finding, and it has four parts:**

1. **`peakRate x1.5` – a fifty percent rate increase – moves a week at seventeen by x0.99.** The
   asymptote eats *all* of it, and on an elite career it eats more than all of it (x0.81). This is
   the single cleanest statement that the age curve is not the dial for the complaint.
2. **Every rate dial makes ages 20 and 23 WORSE than they are today.** `growthEnd 18->21` lands
   x0.66 at 23; `peakRate x1.5` lands x0.51. Pulling growth earlier is exactly what "nothing left at
   seventeen" is complaining about, and these dials do more of it.
3. **The only dials that help late – `plateauStart` and `plateauRate` – do nothing at all at 17**
   (x1.00 by construction: they live past `growthEnd`). They pay out at 20 and 23, on a tank that is
   already 75–85% empty (§2), which is why §5 shows them buying so little in real points.
4. **`declineStart` is a no-op before 29** in every column, as it must be. It moves when the career
   ends, not how it develops.

---

## 2. The realisation curve – deciles, because the complaint is about the shape

**LIFETIME HEADROOM** = mean over her five skills of `ceiling - the build week 1 hands her`. That is
the climb the PLAYER is asked to make. ⚠ It is not the same as `potential - startingSkills(...)`, the
TRUE roll: `rollPotential` is fed her BIRTH build while `createWorld` hands her the head-started one,
so a January girl begins already ~1.1 points up every wing. §7 prints both for a real save, because a
save is the one place the two are ever confused.

| age | 8k working, self-coached | 8k working, middle coach | 25k middle, middle coach | 120k wealthy, elite coach |
| --- | --- | --- | --- | --- |
| 14 | 33.5% | 41.5% | 42.0% | 45.0% |
| 15 | 47.5% | 57.7% | 58.1% | 61.3% |
| 16 | 57.0% | 68.1% | 68.1% | 71.0% |
| **17** | **64.5%** | **74.9%** | **74.4%** | **77.1%** |
| **18** | **69.2%** | **79.3%** | **79.0%** | **81.0%** |
| 19 | 72.8% | 82.5% | 82.5% | 83.9% |
| 20 | 75.6% | 84.9% | 84.8% | 85.9% |
| 21 | 77.5% | 86.4% | 86.3% | 87.3% |
| 23 | 79.8% | 88.2% | 88.1% | 89.0% |
| 25 | 81.6% | 89.5% | 89.5% | 90.4% |
| **28 (peak)** | **83.9%** | **91.2%** | **91.1%** | **91.8%** |
| 29 | 77.8% | 85.4% | 84.4% | 85.8% |
| 30 | 70.5% | 78.4% | 76.0% | 77.8% |

(medians. The 29 and 30 rows FALL because `declineFactor` takes physical points back – a curve that
only ever rose would be hiding the end of the career.)

### 2a. ⚠ THE DISTRIBUTION HAS ALMOST NO SPREAD, and that is the most surprising number here

The owner's complaints have twice turned out to be about the shape of a distribution rather than its
centre. **This one is not.** The deciles of the realised share, 8k · working · self-coached:

| age | p10 | p25 | **p50** | p75 | p90 | p90 − p10 |
| --- | --- | --- | --- | --- | --- | --- |
| 17 | 63.6% | 63.8% | **64.5%** | 65.1% | 65.6% | **2.0 pts** |
| 18 | 68.7% | 68.7% | **69.2%** | 69.7% | 70.1% | **1.4 pts** |
| 21 | 77.1% | 77.2% | **77.5%** | 77.9% | 78.3% | **1.2 pts** |
| 25 | 81.1% | 81.3% | **81.6%** | 81.8% | 82.1% | **1.0 pts** |

**Every career is on the same curve.** The luckiest tenth and the unluckiest tenth of twelve careers
differ by under two points of realised share at seventeen. This is `skill-model-audit-2026-08.md`
§10's finding seen from a different angle ("the realised SHARE is identical across all five to 0.00
points"): the roll decides HOW MUCH there is, never WHEN it arrives. **There is no tail to fix here,
and no variant can produce one** – the timing is deterministic up to the weekly luck draw, which has
mean 1 and averages out over 52 weeks.

### 2b. ⚠ THE 58% ANCHOR IS STALE, and this page is where that gets said

`skill-model-audit-2026-08.md` §4 and `potential-band-2026-08.md`'s closing caveat both quote
**"~58% of headroom realised by eighteen"** for a self-coached balanced career. Measured live on this
head through the real engine it is **69.2%**, and 79–81% in every coached cell.

The old figure is not wrong – it is a different arm. §4 of the audit is a **deterministic closed-form
projection** with a fixed rate and no calendar; this page runs the real tick, which adds the match
bonus, the summer training block and the `player` entry policy. Both are honest; the closed form
understates a career that actually races. **Whichever number is quoted next, it should be quoted with
its arm attached.**

---

## 3. When does a week stop being perceptible?

⚠ **The game already owns a number for this, so nothing here is invented.** `engine/radar.ts`:

| constant | value | its own words |
| --- | --- | --- |
| `CEILING_FLOOR_HALF` | 4 | the outer haze never narrows past it – the tightest the ceiling is ever known to is an 8-point window |
| `TRAINING_FOG_FLOOR` | 3 | "at three points the tightest a notch ever gets is three points of real improvement, which is a thing a person can actually see happen to a tennis player" |
| `TRAINING_STEP` | 1 | one notch = one fog width of CUMULATIVE movement |

So the honest question is not "does she gain anything" – she always gains something – but **how long
until the next notch.**

**8k · working · self-coached**

| age | pts/season | pts/week | yrs to +3 (a notch) | yrs to +4 | verdict | one wing, aimed x5 |
| --- | --- | --- | --- | --- | --- | --- |
| 14 | +3.55 | 0.068 | 0.8 | 1.1 | plainly visible | +17.8 |
| 15 | +2.30 | 0.044 | 1.3 | 1.7 | visible in a season | +11.5 |
| 16 | +1.63 | 0.031 | 1.8 | 2.5 | visible in a season | +8.2 |
| **17** | **+1.12** | 0.022 | **2.7** | 3.6 | barely, over years | +5.6 |
| 18 | +0.79 | 0.015 | 3.8 | 5.1 | barely, over years | +3.9 |
| **19** | **+0.59** | 0.011 | **5.1** | 6.8 | **INVISIBLE** | +3.0 |
| 20 | +0.45 | 0.009 | 6.7 | 9.0 | INVISIBLE | +2.2 |
| 21 | +0.31 | 0.006 | 9.7 | 12.9 | INVISIBLE | +1.6 |
| 23 | +0.15 | 0.003 | 19.5 | 25.9 | INVISIBLE | +0.8 |
| 25 | +0.14 | 0.003 | 21.2 | 28.2 | INVISIBLE | +0.7 |
| 28 | +0.11 | 0.002 | 28.2 | 37.6 | INVISIBLE | +0.5 |
| 29 | −0.94 | −0.018 | never | never | DECLINING | −4.7 |

**Age 19 is the answer, in every cell.** The coached cells cross the same line at the same age
(working · middle coach: 4.2 years to a notch at 18, **5.7 at 19**).

Two consequences worth stating separately:

1. **A career is 24 seasons long and 19 of them are below the game's own visibility floor.** From 19
   onward no single season can earn a notch on the training card, and from 23 onward no *five*
   seasons can.
2. ⚠ **The last column is not about age at all.** `aimWeights` renormalises to sum `SKILL_KEYS.length`,
   so a season pointed entirely at one wing moves that wing five times as fast as an ordinary week
   moves the average: **+5.6 points at seventeen, +3.0 at nineteen, +2.2 at twenty.** The training
   dials (v47) are a perceptibility lever the age curve is not, and they are already shipped.

---

## 4. The peak, twice – and `development.ts`'s own comment is vindicated

The file header says the curve is calibrated to "points ~17-18, top-100 ~4.5 yrs later, **peak 23-28**,
decline ~29+". The sharp question on the table was whether the model actually peaks her at about
nineteen, which would make the comment false.

**It does not. The comment is right about WHERE the peak is.**

| cell | peak SKILL age | peak skill | peak RANK age | peak rank | peak PRIZE age | ever paid |
| --- | --- | --- | --- | --- | --- | --- |
| 8k · working · self-coached | **28.9** | 60.9 | 26.7 | #176 | 26.0 | 10/12 |
| 8k · working · middle coach | **28.9** | 62.0 | 28.9 | #144 | 26.0 | 4/12 |
| 25k · middle · middle coach | **28.9** | 61.5 | 27.1 | #155 | 26.0 | 8/12 |
| 120k · wealthy · elite coach | **28.9** | 61.1 | 31.1 | #178 | 31.0 | 11/12 |

Skills peak at **28.9** – the last week before `declineStart` – in all four cells, because growth
never stops, it only becomes arbitrarily small. Rank peaks at 26.7–31.1 and prize money at 26.0–31.0.
Every one of those is inside or past the stated 23-28 window. `skill-model-audit-2026-08.md` §8c
already measured the same thing from the other side: swapping the asymptote for a linear model moves
the age at peak from **29.0 to 17.3**, and the audit's verdict on that was "the asymptote is not a
defect, it is what makes the twenties worth playing".

### 4a. ⚠ AND YET – the peak is real and the climb to it is invisible

| age | median best rank | mean prize that year | best rung reached | mean skill |
| --- | --- | --- | --- | --- |
| 17 | #311 | $16,768 | wta125 | 58.1 |
| **18** | **#247** | **$25,085** | **wta250** | **58.9** |
| 20 | #216 | $30,698 | wta250 | 60.0 |
| 22 | #204 | $32,510 | wta250 | 60.5 |
| 24 | #216 | $34,447 | wta250 | 60.8 |
| **26** | **#197** | **$34,599** | **wta250** | **61.1** |
| 28 | #202 | $34,171 | wta250 | 61.0 |
| 30 | #200 | $29,476 | wta250 | 58.9 |

(8k · working · self-coached, 12 seeds. The other three cells have the same shape.)

**From 18 to 26 – eight years, a third of the career – she gains 2.2 skill points, 50 ranking places
and $9,500 a year, and does not reach a single new rung.** `wta250` is the ceiling of her ladder at
eighteen and it is still the ceiling at thirty.

**That is the honest form of the owner's complaint, and it is not the one the sharp question
predicted.** The model does not peak her at nineteen. It peaks her at twenty-nine, having given her
almost everything by nineteen and then spent ten years delivering the remainder in instalments too
small for the game's own radar to draw.

---

## 5. The variants – measured anyway, so the "no" in §1 is a priced no

§1 says the age curve is not the dial. These arms are run regardless, because a recommendation to
change nothing is only worth reading if the alternatives were actually costed. 12 careers a cell,
identical seeds across arms, full careers 14 to 38.

**8k · working · self-coached**

| variant | realised@18 | @21 | @25 | **pts gained 18->25** | peak skill (Δ) | peak age | median rank | **invisible from** |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **baseline** | 69.3% | 77.6% | 81.6% | **+2.64** | 61.30 (+0.00) | 28.9 | #176 | **age 19** |
| growthEnd 18->21 | 75.1% | 84.9% | 87.8% | +2.89 | 62.14 (+0.84) | 28.9 | #161 | age 20 |
| growthEase .5->.25 | 76.6% | 84.9% | 87.7% | +2.63 | 62.12 (+0.82) | 28.9 | #161 | age 20 |
| plateauStart 23->27 | 69.4% | 79.3% | 85.2% | +3.22 | 61.86 (+0.55) | 28.9 | #166 | age 20 |
| **plateauRate .0009->.0031** | 69.6% | 81.3% | 90.1% | **+3.90** | 62.94 (+1.64) | 28.9 | #163 | **age 21** |
| **peakRate x1.5** | **83.1%** | 89.0% | 91.1% | **+1.90** | 62.64 (+1.34) | 28.9 | #169 | **age 19** |
| declineStart 29->32 | 69.3% | 77.6% | 81.6% | +2.64 | 61.61 (+0.30) | **31.9** | #176 | age 19 |
| LATE SHAPE (3 dials) | 75.1% | 85.3% | 92.2% | **+3.48** | 63.08 (+1.78) | 28.9 | #157 | age 20 |

**"invisible from"** = the first age whose WHOLE SEASON moves her less than 0.6 points, i.e. §3's own
INVISIBLE band – over five years of training to earn one `TRAINING_FOG_FLOOR` of movement.
**The best age-curve dial in the game buys two years of it: 19 to 21.** The biggest rate lift on the
page, `peakRate x1.5`, buys none at all.

**25k · middle · middle coach**

| variant | realised@18 | @21 | @25 | **pts gained 18->25** | peak skill (Δ) | peak age | median rank | **invisible from** |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **baseline** | 79.2% | 86.4% | 89.6% | **+1.94** | 60.96 (+0.00) | 28.9 | #155 | **age 19** |
| growthEnd 18->21 | 84.3% | 92.0% | 94.0% | +1.96 | 61.47 (+0.51) | 28.9 | #143 | age 19 |
| growthEase .5->.25 | 85.4% | 91.9% | 93.8% | +1.77 | 61.45 (+0.49) | 28.9 | #152 | age 19 |
| plateauStart 23->27 | 79.4% | 87.8% | 92.2% | +2.30 | 61.28 (+0.32) | 28.9 | #141 | age 19 |
| **plateauRate .0009->.0031** | 79.5% | 89.4% | 95.5% | **+2.69** | 61.82 (+0.87) | 28.9 | #148 | age 19 |
| **peakRate x1.5** | **90.5%** | 94.7% | 96.0% | **+1.15** | 61.69 (+0.73) | 28.9 | #147 | **age 18** |
| declineStart 29->32 | 79.2% | 86.4% | 89.6% | +1.94 | 61.14 (+0.18) | **31.9** | #155 | age 19 |
| LATE SHAPE (3 dials) | 84.3% | 92.3% | 96.7% | +2.28 | 61.91 (+0.95) | 28.9 | #140 | age 19 |

⚠ **On a COACHED career not one variant moves the invisibility age at all** – every arm stays at 19,
and `peakRate x1.5` drags it back to **18**. The two-year gain in the self-coached table is the most
the age curve can ever buy, and it is bought on the cell that develops slowest.

**The `pts gained 18->25` column is the whole question**, because it is the answer to "is there
anything left to play for after eighteen" in skill points rather than in percentages.

| reading | number |
| --- | --- |
| Baseline, seven seasons from 18 to 25 | **+2.64 pts** (self-coached), **+1.94** (coached) |
| The best single age-curve dial (`plateauRate` x3.4) buys | **+1.26 pts** over those seven seasons |
| All three "later" dials together (LATE SHAPE) buy | **+0.84 pts** over those seven seasons |
| Per season, at best | **+0.18 pts** |
| `TRAINING_FOG_FLOOR`, the game's own visibility floor | **3 pts** |

**The best age-curve change on this page buys less than a fifth of a point a season against a floor
of three.** It is not a small effect that needs a bigger number – §1c shows the asymptote absorbing
whatever number is put in, so a larger dial buys proportionally less, not more.

### 5a. ⚠ Three findings in this table that are not about size

1. **`peakRate x1.5` makes the complaint WORSE, and it is the arm the owner would most plausibly
   have asked for.** It moves `realised@18` from 69.3% to **83.1%** self-coached and from 79.2% to
   **90.5%** coached: she is nine-tenths finished on her eighteenth birthday. And it *reduces* the
   points gained from 18 to 25, from +2.64 to +1.90. **A steeper curve does not extend development,
   it front-loads it.**
2. **The same is true, more gently, of every rate dial.** `growthEnd 18->21` and `growthEase
   .5->.25` both push `realised@18` up 6-7 points. Only `plateauStart` and `plateauRate` leave the
   eighteen-year-old where she is, because they live past `growthEnd` by construction.
3. **`declineStart 29->32` is the one variant that unambiguously adds career** – peak age 28.9 to
   31.9, +0.30 / +0.18 peak skill, both guard windows untouched, and nothing before 29 moves by a
   hundredth. It does not touch the seventeen-year-old at all. **It is a different feature (a longer
   career) wearing the same file, and it is cheap.**

---

## 6. What breaks

### 6a. Guard tests – re-run under each variant, and NOTHING re-pinned

`tools/growth-age-sweep.ts` §6 runs the same presets, horizons, indices and predicates the tests use,
and prints the result against the window the test pins. It imports no vitest and writes to no test
file: the point is to price a re-pin before it is bought.

**`tests/econ-reach.test.ts` · 14->18 pro proxy** (middle·self, top-50 once ranked, of 30). Pinned
window `[7, 21]`, anchored at 13.

| variant | measured | vs anchor | verdict |
| --- | --- | --- | --- |
| baseline | 15 | +2 | inside |
| growthEnd 18->21 | 18 | +5 | inside |
| growthEase .5->.25 | 20 | +7 | inside, **one from the top** |
| plateauStart 23->27 | 15 | +2 | inside |
| plateauRate .0009->.0031 | 15 | +2 | inside |
| **peakRate x1.5** | **23** | **+10** | **⚠ RED – window tops at 21** |
| declineStart 29->32 | 15 | +2 | inside |
| LATE SHAPE (3 dials) | 18 | +5 | inside |

**`tests/econ-reach.test.ts` · 14->16 domestic door** (working·self, 250 points, of 30). Pinned
window `[4, 20]`, anchored at 11. **Every variant is inside** (9 to 13 of 30); the rate dials push it
*down* to 9, because a steeper 14-16 window moves the whole junior field's relative position, not
just hers.

**`tests/relative-age.test.ts` · the catch-up gap**, as arithmetic over `ageFactor` alone. Pinned:
`rateGap(14) < 0`, `|rateGap(14)| < 0.01`, and `rateGap(25)` equal to zero to ten decimal places –
"gone at the plateau, where age stops mattering".

| variant | rateGap(14) | rateGap(25) | verdict |
| --- | --- | --- | --- |
| baseline | −5.68e−4 | 0 | inside |
| growthEnd 18->21 | −3.55e−4 | 0 | inside |
| growthEase .5->.25 | −2.84e−4 | 0 | inside |
| **plateauStart 23->27** | −5.68e−4 | **−2.24e−4** | **⚠ RED – still sloping at 25** |
| plateauRate .0009->.0031 | −5.68e−4 | 0 | inside |
| peakRate x1.5 | −8.53e−4 | 0 | inside |
| declineStart 29->32 | −5.68e−4 | 0 | inside |
| LATE SHAPE (3 dials) | −3.55e−4 | 0 | inside |

⚠ **LATE SHAPE passes that guard BY ARITHMETIC ACCIDENT, and it must not be read as safe.** It sets
`plateauStart 27` – which alone is red – but also `plateauRate 0.0031`, which happens to equal
`peakRate x (1 - growthEase)` = 0.0062 x 0.5 exactly. The taper branch therefore interpolates between
two identical values and comes out flat, so `rateGap(25)` is zero. Move either number and the guard
goes red. **A combination that passes a test because two unrelated constants coincide is not a
combination that has been verified.**

### 6b. Anchors that are not tests – nothing goes red, but each becomes a lie until re-run

| where | the anchor | moved by |
| --- | --- | --- |
| `src/engine/development.ts` | the file header's calibration claim, "points ~17-18, top-100 ~4.5 yrs later, peak 23-28, decline ~29+", and `ageFactor`'s docstring repeating it | every variant |
| `src/engine/development.ts` | `SKILL_POINTS_PER_YEAR = 2.4`, stated as MEASURED off the 14->18 run. It feeds `relativeAgeHeadStart`, so every rate dial silently re-prices the birth month | every rate variant |
| `src/engine/economy.ts` | each `ageCurve` key's own comment – "18-22: still climbing", "23-28: the peak. Maintenance, not growth." | §1, §5 |
| `src/engine/coach.ts` | `coachSeasonUplift` quotes a season's gain to the player FROM `ageFactor`; a steeper curve re-prices every coach card in the game | §5 |
| `tools/skill-ceiling.ts` §4 | already carries `growthEase` / `plateauStart` / `plateauRate` / `declineStart` arms; shipping one makes its BASELINE row the new one and its §1 analytic table stale | §5 |
| `docs/specs/skill-model-audit-2026-08.md` | §4's realisation-by-age table and §8's dial ranking | §2 |
| `docs/specs/potential-band-2026-08.md` | its closing caveat quotes the same "~58% by eighteen" | §2b |

---

## 7. Her own career, placed – read locally, never committed

Read through the engine's own import door (`decodeExportFile`), exactly as `tools/round15-read.ts`
does. **Nothing is committed from a save** – no fixture, no path, no career; only the placement below.

⚠ **Two denominators, and they are not the same number.** `rollPotential` is fed her BIRTH build while
`createWorld` hands her the head-started one, so the TRUE roll (`potential - startingSkills`) exceeds
THE CLIMB (`potential - the week-1 build`) by `relativeAgeHeadStart(birthMonth)` on every wing. §2
uses THE CLIMB, because that is the one a career can actually finish.

**The career at week 195, age 17.6, self-coached, head start +0.70:**

| skill | week 1 | now | ceiling | TRUE roll | THE CLIMB | **done** | **left** |
| --- | --- | --- | --- | --- | --- | --- | --- |
| serve | 51.7 | 53.8 | 55.1 | 4.1 | 3.4 | **62.3%** | **1.3** |
| ret | 50.7 | 62.8 | 70.1 | 20.1 | 19.4 | **62.3%** | 7.3 |
| composure | 37.7 | 39.5 | 41.5 | 4.5 | 3.8 | **46.6%** | 2.0 |
| stamina | 42.7 | 45.0 | 46.5 | 4.5 | 3.8 | **62.3%** | 1.4 |
| groundstrokes | 58.7 | 63.2 | 65.9 | 7.9 | 7.2 | **62.3%** | 2.7 |
| **mean-of-five** | 48.3 | 52.9 | 55.8 | | 7.5 | **60.7%** | **2.9** |

**Against the bench at 17 (§2's realised column):**

| cell | p10 | p50 | p90 | **hers** |
| --- | --- | --- | --- | --- |
| 8k · working · self-coached | 63.6% | 64.5% | 65.6% | **60.7%** |
| 25k · middle · middle coach | 73.9% | 74.4% | 75.6% | **60.7%** |
| 120k · wealthy · elite coach | 76.1% | 77.1% | 78.3% | **60.7%** |

Four things this table says that prose cannot:

1. **Four of her five wings are at 62.3% – to the tenth, identical.** That is not a coincidence, it
   is the asymptote's signature: `growWeek` takes the same share of every wing's REMAINING distance,
   so under an all-ones aim vector all five realise at exactly the same rate whatever their size.
   §2a's "every career is on the same curve" is also true wing by wing inside one career.
2. **The fifth wing is at 46.6% because her TRAINING has been pointing elsewhere**, not because
   composure is modelled differently. The v47 aim vector is the only thing in the engine that can
   separate one wing's realisation from another's, and on her own save it visibly has.
   **The dial that is already shipped is the one that is already working.**
3. **She is 4 points of realisation BEHIND the p10 of her own cell**, which is a real but small gap –
   consistent with a self-coached career whose weeks have been aimed rather than general.
4. **Her whole remaining career is worth 2.9 points mean-of-five – 1.0 notches on the game's own
   `TRAINING_FOG_FLOOR`. Her serve has 1.3 points left, which is 0.4 notches, forever.** The owner's
   description of what he is looking at is exactly right; §8 is about which lever answers it.

---

## 8. Recommendation

### The age curve is not the dial. Do not ship a change to it for this complaint.

**The measurement does not say "leave the model alone".** It says the thing the owner is pointing at
is real, and that this particular knob cannot reach it:

| the ask | the age curve's answer |
| --- | --- |
| "more left to play for at seventeen" | The asymptote causes 59-66% of the slowdown at 17 (§1a). No age-curve dial can touch it. `peakRate x1.5` – a 50% rate lift – moves a week at 17 by **x0.99** (§1c). |
| "more left after eighteen" | Every rate dial does the **opposite**: `realised@18` goes 69.3% -> 83.1% under `peakRate x1.5` (§5). It front-loads, it does not extend. |
| "more happening in the twenties" | `plateauRate` x3.4 is the best arm here and buys **+1.26 points over seven seasons** (§5) – 0.18 a season against a visibility floor of 3 (§3). |

**And two of the eight arms cost real re-pinning:** `peakRate x1.5` turns the 14->18 reach guard red
at 23 of 30 against a window topping at 21, and `plateauStart 23->27` turns the relative-age
catch-up guard red because the curve is still sloping at 25 (§6a).

### What the numbers point at instead, in the order they are worth measuring

1. **⚠ THE TRAINING AIM, which already ships and is already working.** §3's last column: a season
   pointed entirely at one wing moves it **x5** – +5.6 points at seventeen, +3.0 at nineteen, +2.2
   at twenty, all of them above or near the fog floor that an unaimed season is far below. §7 shows
   the owner's own career doing this by accident (four wings at 62.3%, one at 46.6%). **The question
   worth asking next is not "should growth last longer" but "does the player know that pointing the
   week is the difference between visible and invisible progress".** That is a UI and a coach-card
   question, and it needs no constant moved.
2. **THE POTENTIAL FLOOR, which is already measured and already recommended.**
   `potential-band-2026-08.md` §7 recommends `[10, 26]` and prices it at zero. §1a here is the
   reason that recommendation is the right shape: since the fade at 17 is 59-66% asymptote, the
   lever that works is **more headroom**, not **more rate**. A 10-point wing at 62.3% realised has
   3.8 points left instead of 1.3. The two pages agree, and this one explains why.
3. **`declineStart 29->32`, if and only if the wanted thing is a longer career** (§5a item 3). It is
   the one arm that adds without front-loading, moves no guard, and touches nothing before 29. It
   answers a different question from the one asked, and it should be bought as one.

### The one thing worth changing on the strength of this page alone

**The comments.** `development.ts`'s header and `ageFactor`'s docstring both promise "peak 23-28",
and §4 shows the model delivering that – peak skill 28.9, peak rank 26.7-31.1, peak prize 26.0-31.0.
**The comment is true and should stay.** What is missing beside it is the sentence this page
measured: *the peak is where the comment says, and 83-92% of the climb to it is over by eighteen.*
A reader of that file today cannot tell that the twenties are a plateau rather than an ascent, and
two specs currently quote a "~58% by eighteen" that the live engine measures at **69-81%** (§2b).

---

## 9. What this branch did NOT do

- did not move `ECONOMY.development.ageCurve`, `potentialBand`, or any other shipped constant –
  `git diff` against the base is empty under `src/engine/economy.ts` and `src/engine/development.ts`;
- did not re-pin a single test bound;
- did not touch `COHORT.ageCurve`, which is the FIELD's own curve and is not this question;
- did not commit, derive a fixture from, or quote anything from a personal save beyond the aggregate
  placement in §7.
