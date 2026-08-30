---
type: spec
status: draft
area: simulation-and-balance
canonical: false
last-reviewed: 2026-08-30
---

# The adult age limb – measured, fitted, and priced

Round 30 **#26**, and it rests on **#22**. His question:

> «богатая семья может купить телу освобождение от старения… вот это очень странно звучит как по мне.
> Что можем с этим сделать?»

and his authorisation:

> «давай, ставь замер по травмам, особенно учитывая мой последний сейв и несколько лет вообще без
> травм»

⚠⚠ **THIS DOCUMENT CHANGES NO ENGINE BEHAVIOUR.** `ECONOMY.availability.ageInjuryFactor` is
untouched on this branch, `src/` carries no diff at all, and the frozen MAIN capture
(41550 / `e6b0c709`, `tests/condition.test.ts`) is verified UNMOVED. The curve below is a
**proposal with its measurement attached**; the build is a later step and his.

---

## 0. The one-sentence answer

⭐⭐ **HIS 5.8-YEAR DROUGHT IS A TAIL, NOT A DEFECT – simulated at ≈ 1 in 45 through both doors, and
his protection stack barely moves that number (2.2 % → 2.0 %) because the in-match retirement door
supplies 73–79 % of every adult injury and money does not reach it.** The flat age term IS a real
defect and it is fixed below by a fitted curve that lands season prevalence at **51.4 %**, inside the
researched **30–54 %** band, from **58.5 %** outside it – but it is a much smaller lever than #22
implied, and «a wealthy family buys a body out of ageing» turns out to be worth about **9 % fewer
injuries**, not four times fewer.

---

## 1. The instruments

| | what it does | how it was run |
| --- | --- | --- |
| `tools/injury-audit.ts` | the whole-life injury census item #22 was measured on – prevalence, onsets and weeks lost per season and **per age band** | 9 presets × 12 seeds = 108 careers, arm `plays-on`, both entry policies |
| `tools/injury-audit.ts --ageCurve` | ⭐ **NEW.** swaps a WHOLE candidate age table in for one run. Same CLI-only counterfactual idiom as the `--flatAge` beside it – nothing is written back to any constant, and the arm is printed in the run's own header | the calibration arm and the fitted arm below |
| `tools/age-injury-fit.ts` | ⭐ **NEW.** his own save's stack and schedule, the 299-week drought **by simulation through both doors**, and the floor priced | 10 seeds × 9 presets, policy `player`, windows from age 25 |

⚠ **The save is read-only and personal** – the standing law of `tools/injury-saves-read.ts`. It is
handed in on the command line, read through the game's own import door, and never copied into the
repo, committed, or used as a fixture. What the repo keeps is the derived statistics below.

---

## 2. His drought, placed – and the ~70× in #22 settled

#22 gave two answers to "how unlikely is 299 clean weeks" that differ by about seventy – «≈1 in 190»
against a generic careful career, «≈1 in 3» against his own protection stack – and said honestly that
they are not like for like: the first is a population rate through **both** injury doors, the second
is arithmetic on the **weekly door alone**. Both halves are re-done here, and the second one is done
by simulation.

### 2a. What his file actually carries – and one correction to #22

Read straight out of `tennis-sim_alice-cfbv_w896.tsave`:

| | value | note |
| --- | --- | --- |
| lifetime onsets | **11** | `injuryHistory` holds 11 rows, under the 20-row prune – so this is **exact**, not a floor |
| last onset | week **597**, a minor, 2 weeks out | |
| the drought | **299 weeks**, of which **297 were at risk** | she was laid off for 2 of them |
| physio | **×0.616** | an **elite** medical team (`coachId elit-4`, physio quality 1.6) |
| kit | **×1.000** | ⭐ **exactly the new-kit floor** – a signed kit deal's freshness cap holds every line at 0 wear |
| recovery buff | ×0.900, live for **3 more weeks** | ⚠ a holiday booked the week before the save |
| condition | 83 at the save | her week-by-week condition is not stored anywhere |
| schedule | **45.3 %** of weeks competed (24 of 53 in the visible window) | `world.results` is a rolling ~52-week ranking window, so this is her last year extended |

⚠ **ONE CORRECTION TO #22, AND IT MOVES HIS ODDS THE UNFAVOURABLE WAY.** #22's most protected row
was «elite physio, condition 85, fresh kit **…and an elite recovery package live**» at 0.327 %/wk.
The recovery buff is **not a standing part of his stack** – the file shows it with three weeks left
on it, off a resort booked the week before he exported. Over 299 weeks the honest multiplier is
`physio 0.616 × kit 1.000`, and nothing else.

### 2b. The weekly door, on HIS numbers rather than a generic career

`ageInjuryFactor(31) = 0.85`, the table's flat default. Load averaged over **his own** trailing-4
competed-week mix (0 → 5.7 %, 1 → 24.5 %, 2 → 60.4 %, 3 → 9.4 %), and the competing weeks weighted at
his own 45.3 %:

| her condition | tau, quiet week | tau, competing week | E[onsets] over 297 w | **P(zero)** |
| ---: | ---: | ---: | ---: | ---: |
| 70 | 0.459 % | 0.642 % | 1.61 | 19.9 % |
| 75 | 0.413 % | 0.578 % | 1.45 | 23.4 % |
| 80 | 0.367 % | 0.514 % | 1.29 | 27.5 % |
| **83** (the save) | **0.339 %** | **0.475 %** | **1.19** | **30.3 %** |
| 88 | 0.294 % | 0.411 % | 1.03 | 35.6 % |
| 92 | 0.257 % | 0.360 % | 0.90 | 40.6 % |

**So #22's «≈1 in 3» survives contact with his real file – for the weekly door.** It is the other
door that changes the answer.

### 2c. Both doors, by simulation

Careers walked week by week through `stepCareerWeek` – the real engine, so the **in-match retirement
hazard is in the run** – with every onset attributed to the door it came through by the news line it
writes (`tools/injury-cause-probe.ts`'s own idiom). 190 careers, 151,123 adult weeks lived from age
25, policy `player`.

⚠ **The `his stack` arm forces exactly two things and nothing else**: the preset already hires the
elite medical team, and her kit is held at the new-kit floor every week – which is not a cheat, it is
what his signed kit deal does through `kitFreshCap`, and it is why his `kitInjuryFactor` reads
exactly 1.000. The recovery buff is not forced, for the reason §2a gives.

| arm | careers | adult weeks | mean tau | mean cond | onsets / 100 w | **via the retirement door** | weeks competed |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| generic careful career (all nine rungs) | 90 | 72,459 | 0.559 % | 85 | 1.68 | **72.6 %** | 45.2 % |
| his rungs: elite medical team | 50 | 39,884 | 0.453 % | 86 | 1.61 | **78.6 %** | 45.4 % |
| **his stack: elite team + new-kit floor** | 50 | 38,780 | **0.429 %** | 85 | **1.53** | **78.1 %** | 45.2 % |

⭐ **The exposure column is the control that makes this comparison honest: the bench's careful career
competes in 45.2 % of its adult weeks and his own file reads 45.3 %.** The arm is playing his
schedule, not a busier or a quieter one.

### …and the 299-week question itself

| arm | windows | **clean windows** | careers that EVER have such a run | median longest clean run |
| --- | ---: | ---: | ---: | ---: |
| generic careful career | 46,170 | 1,028 = **2.2 %** | 11/86 = 12.8 % | 184 w |
| his rungs: elite medical team | 25,596 | 553 = **2.2 %** | 10/47 = 21.3 % | 204 w |
| **his stack** | 24,441 | 484 = **2.0 %** | 6/47 = 12.8 % | 204 w |

⚠ **Two denominators because they answer two questions, and only the first is his.** Sliding windows
inside one career are not independent, so the window share is «pick a random 299-week stretch of an
adult career – is it clean?», which is the right frame for «is what I am looking at unusual», because
he is looking at one stretch. The per-career share is «does a career EVER contain such a stretch»,
which is strictly larger and is the right frame for «will this happen to somebody».

⭐⭐ **SO THE ANSWER IS ≈ 1 IN 45, AND THE STACK BARELY MOVES IT – 2.2 % against 2.0 %.** Neither of
#22's two figures survives, and the reason is the same one both times: **the in-match retirement door
supplies 73–79 % of every adult onset, and nothing in the protection stack touches it.**
`retireHazard = RETIRE_K x spentness(pointNumber, stamina) x retireDurability(condition)` – there is
no physio term, no kit term, and **no age term** in it at all.

⚠⚠ **AND THAT IS ALSO A CORRECTION TO #22'S CENTRAL CLAIM, WHICH IS WORTH SAYING PLAINLY BECAUSE IT
IS THE OPPOSITE OF WHAT WAS REPORTED.** #22 said «the stack is worth roughly 4x on the threshold»
and concluded «the game currently lets a wealthy family buy a body out of ageing». The first half is
true and the second does not follow: on the THRESHOLD the stack is worth 0.559 % -> 0.429 %, a 23 %
cut; on **injuries she actually suffers** it is worth 1.68 -> 1.53 per 100 weeks, a **9 % cut**.
**A wealthy family buys about a tenth fewer injuries, not a body out of ageing** – because three
quarters of them come through a door money does not reach.

⭐ **His own lifetime rate is 0.64 onsets/season against the careful bench's 0.88** – below it, and
the 299-week gap is a 1-in-45 stretch inside a career that was already running a little lucky.
**He is a tail. The model is not broken here.** What IS broken is separate and is still true: a body
of 19, 25, 31 and 34 are one body to `ageInjuryFactor`, and §4 fixes that.

---

## 3. The real-world age curve – §5 of `docs/research/injury-stats-by-age.md`

The sweep is written up in full there with every source named and every claim tagged `[S]` / `[I]` /
`[GAP]`. The three findings that decide this spec:

1. ⚠⚠ **`[GAP]` There is no published age-stratified injury incidence for professional women's
   tennis.** The field's own consensus paper (Pluim et al., *BJSM* 2021) recommends a single
   **adult 19–49** band, and the 2024 French Open surveillance paper says in as many words that it
   could not evaluate age as a risk factor because the non-injured players' demographics were not
   available. **An adult limb cannot be sourced. It has to come from a named proxy.**
2. ⚠⚠ **`[S]` The two studies that DID test age in women's tennis found nothing.** Palau et al.
   (*PLOS ONE* 2024, 267,380 WTA matches) and Oliver et al. (*EJSS* 2024, 46,268 WTA matches) both
   tested age against mid-match retirement risk and both returned **no significant effect in the WTA
   arm**. The ATP arm of the first shows 1.31× per +5 years and its own authors flag it as confounded
   with study year.
3. ⭐⭐ **`[S]` What tennis DOES show with age is BURDEN, not incidence.** The 2025 systematic review
   (Amor-Salamanca et al., *Sports*) puts the **severe share (>28 days lost) at 43 % in adolescents
   against 54–66 % in collegiate/professional players** – **1.26–1.53×** on severity where the
   incidence numbers show no gradient at all. Corroborated in elite rugby (Williams et al., *JSAMS*
   2023): a heavy season raises the next season's **burden and not its incidence**, "driven by an
   increased risk for older (>26 y) Forwards".

The only quantified rising-incidence proxies are from football – **2.3×** (Premier League) to
**4.9×** (LaLiga) between the 30+ and under-21 squad bands – and they are the least transferable
evidence in the table: a collision-and-sprint-duel sport whose signature injury is a maximal-velocity
hamstring tear.

⭐ **What that licenses:** a **modest** rise, roughly **1.5–2× from the prime years to the
mid-thirties** – the bottom of the only quantified band, kept well clear of its top out of respect
for tennis's own two nulls. Anything steeper would be a football number wearing a tennis shirt.

⚠ **And what it says about the instrument.** The best-sourced tennis age effect is on **severity**,
and `ageInjuryFactor` cannot express it – it multiplies the occurrence threshold, while the layoff
length is drawn from `severityBands`. **That is a second, better-evidenced change and it is not
proposed here**, because #26 asked about the occurrence curve. It is named at §7 so it is not lost.

---

## 4. The fitted curve

### 4a. First, the two numbers that bound what any age curve can do

Two counterfactual arms, both through `--ageCurve`, both 108 careers on the `player` policy:

| arm | overall season prevalence | what it is |
| --- | ---: | --- |
| shipped | **58.5 %** | the flat `default: 0.85` |
| `default: 0` on 19+ only | **48.7 %** | the adult weekly door switched off entirely |
| **`default: 0` at EVERY age** | **45.8 %** | ⭐⭐ **the hard floor** – the weekly injury roll cannot fire at all, so what remains is the in-match retirement door and nothing else |

⭐⭐ **SO THE ENTIRE REACHABLE WINDOW FOR `ageInjuryFactor` IS 45.8 % – 58.5 %, AND THE BAND'S TOP IS
54 %.** A curve can land the total inside 30–54 %, but only in its **top quarter**, and only by
spending less than half of what the shipped curve spends. Per band the floor is even tighter:

| band | shipped | **floor (weekly door OFF)** | weekly door's share of onsets |
| --- | ---: | ---: | ---: |
| 13–15 | 52.5 % | 42.3 % | 28.6 % |
| 16–18 | 64.5 % | **50.0 %** | 34.3 % |
| 19–22 | 58.6 % | 43.3 % | 31.8 % |
| 23–28 | 56.6 % | 46.3 % | 27.4 % |
| 29+ | 59.5 % | 46.3 % | 24.2 % |

⚠⚠ **THE 30–54 % BAND'S MIDPOINT IS UNREACHABLE BY ANY AGE CURVE, AND THAT IS A FINDING ABOUT THE
MODEL RATHER THAN ABOUT THE CURVE.** Three of the five bands have a floor at 43–50 %, so a target of
42 % (the band's centre) cannot be hit even with the weekly roll switched off completely. **The
retirement door is most of the level problem** – it supplies 66–76 % of every onset – and it carries
**no age term, no physio term and no kit term at all**. `docs/backlog/injuries-gear-and-open-bugs.md`
#7 is the open item for the level and it is reserved to him; this spec does not touch it.

### 4b. The fitted curve

⭐ **Fitted to land the total in band, keep the junior peak's shape, and rise from 27 to the
mid-thirties at the 2× the literature licenses** (§3):

```ts
ageInjuryFactor: {
  13: 0.6, 14: 0.63, 15: 0.74, 16: 0.84, 17: 0.74, 18: 0.67,   // the shipped junior shape x0.7
  19: 0.25, 20: 0.25, 21: 0.25, 22: 0.25, 23: 0.25, 24: 0.25,  // the prime, flat
  25: 0.25, 26: 0.25, 27: 0.25,
  28: 0.29, 29: 0.32, 30: 0.36, 31: 0.39, 32: 0.43, 33: 0.46,  // the rise, linear
  default: 0.5,                                                 // 34 to retirement
}
```

It is the same kind of table the constant already is, so it is **one edit to apply** – and the same
string is what `--ageCurve` takes, so the run below and the edit cannot drift apart.

⚠ **THE JUNIOR ROWS MOVE, AND HERE IS WHY THAT IS NOT SCOPE CREEP.** The 16–18 band measures
**64.5 % against its own researched anchor of 46–54 %** – it is the single most over-band row in the
table – and the ×0.7 keeps the SHAPE §3.1 sourced (the peak still at 16, the same relative ladder)
while taking the level down. 13–15's 52.5 % is inside its band, and ×0.7 takes it to 49.7 %, which is
still inside it. **Nothing about the girl growth-spurt curve is re-argued; only its height moves.**

### 4c. Predicted vs measured – `injury-audit --ageCurve`, 108 careers, policy `player`

The prediction is a first-order model built from the two arms of §4a
(`λ = λ_retirementDoor + λ_weeklyDoorPerUnit × meanAgeFactor`, then a per-band Poisson map). It is
first-order because it cannot see the feedback – fewer injuries means more weeks played means more
fatigue and more matches to retire out of – so a gap between the columns is expected and is the
honest size of that feedback.

| band | shipped | **predicted** | **MEASURED** | prediction error | Δ vs shipped |
| --- | ---: | ---: | ---: | ---: | ---: |
| 13–15 | 52.5 % | 49.4 % | **49.7 %** | +0.3 pp | −2.8 pp |
| 16–18 | 64.5 % | 60.5 % | **59.0 %** | −1.5 pp | −5.5 pp |
| 19–22 | 58.6 % | 49.5 % | **45.8 %** | −3.7 pp | −12.8 pp |
| 23–28 | 56.6 % | 49.1 % | **50.5 %** | +1.4 pp | −6.1 pp |
| **29+** | 59.5 % | 55.1 % | **52.3 %** | −2.8 pp | −7.2 pp |
| **OVERALL** | **58.5 %** | **52.9 %** | ⭐ **51.4 %** | −1.5 pp | **−7.1 pp** |

⭐⭐ **51.4 % – INSIDE THE 30–54 % BAND, from 58.5 % outside it.** And the shape is what #26 asked
for: onsets per season now read **0.68 (19–22) → 0.68 (23–28) → 0.78 (29+)**, where the shipped table
reads 0.88 → 0.84 → **0.91 with 29+ the second-quietest adult band**. The oldest band is the worst
adult band for the first time.

⚠ **AND THE SIZE OF THE EFFECT IS SMALLER THAN THE CURVE, WHICH IS THE SAME FINDING AS §2c WEARING A
DIFFERENT HAT.** The age factor doubles from the prime to 34; the realised 29+ onset rate rises only
**15 %** over the prime (0.68 → 0.78). The rest is eaten by the retirement door, which the age curve
does not reach. **If he wants ageing a player can FEEL, the curve alone will not deliver it** – §7.

### 4d. The alternative, also measured: a level-NEUTRAL re-shape

If he would rather not move the level in the same edit as the shape (and there is a good argument for
that – see §7), the same shape at the shipped adult mean:

```ts
{ 13: 0.85, 14: 0.9, 15: 1.05, 16: 1.2, 17: 1.05, 18: 0.95,     // juniors UNCHANGED
  19-27: 0.6, 28: 0.69, 29: 0.77, 30: 0.86, 31: 0.94, 32: 1.03, 33: 1.11, default: 1.2 }
```

| band | shipped | predicted | **MEASURED** | Δ |
| --- | ---: | ---: | ---: | ---: |
| 13–15 | 52.5 % | 52.5 % | **52.5 %** | 0.0 pp ⭐ the invariance check: unchanged rows, unchanged number |
| 16–18 | 64.5 % | 64.5 % | **63.3 %** | −1.2 pp |
| 19–22 | 58.6 % | 55.0 % | **52.8 %** | −5.8 pp |
| 23–28 | 56.6 % | 53.8 % | **54.1 %** | −2.5 pp |
| **29+** | 59.5 % | 61.9 % | **63.1 %** | **+3.6 pp** |
| **OVERALL** | **58.5 %** | 58.3 % | **58.4 %** | −0.1 pp |

**A clean re-shape at a constant total** – the prime falls, the veteran band rises, the aggregate does
not move. It does NOT land in band, because it was never trying to: the level is a separate lever.

### 4e. The grinder arm, and the honest bad news on it

| | shipped | fitted |
| --- | ---: | ---: |
| overall | 76.0 % | **71.5 %** |
| 29+ | 73.8 % | 70.1 % |
| 23–28 | 81.0 % | 76.1 % |

⚠ **The grinder cannot be brought into band by any age curve** – its own floor with the weekly roll
switched off is **67.8 %**. It runs at mean condition 55 against the careful arm's 85, so its injuries
are a fatigue story and the age table is not the instrument. ⚠ **And on the grinder the fitted curve
does NOT make 29+ the worst band** (70.1 % against 23–28's 76.1 %), because a grinder is at condition
44 at 23–28 and 60 at 29+ – she is more broken in her twenties than in her thirties, which is what
grinding means. That is a true statement about that arm, not a defect in the curve.

---

## 5. The floor, priced

### 5a. The rule, and the two shapes of it that do nothing

#26's proposal is `kitInjuryFactor`'s own note applied to age:

> «the FLOOR is new kit, at exactly 1 – the top rung cannot go below it, so **no amount of money buys
> a safety BONUS, it only buys back the penalty** of playing on worn kit.»

⚠⚠ **THE TWO OBVIOUS WAYS TO WRITE THAT ARE BOTH NULL, AND THE REASON IS ARITHMETIC RATHER THAN
TASTE.** A floor written as `tau ≥ injuryBaseChance × ageInjuryFactor(age)` – "an ideally-rested body
of her age" – reads exactly right and is **age-independent in effect**: the age factor is already a
multiplier on `tau`, so it stands on both sides of the comparison and divides out. The ratio between
the protected and the unprotected threshold is then the same at 20 as at 34, which is the opposite of
what the item asks for. The same cancellation kills a floor written against the exposed hazard.

⭐ **For the stack's purchasing power to shrink with age, the floor has to sit on the PROTECTION
PRODUCT itself:**

```
protection      = physioRiskFactor(tier) × recoveryBuffFactor          // ≤ 1
                  (kit is excluded – kitInjuryFactor is never below 1, so it is a penalty, not a purchase)
protectionFloor = pBest + (1 − pBest) × climb(age)
tau            *= max(protection, protectionFloor(age))
```

⭐⭐ **and `climb(age)` has no free numbers in it – it is read off the age curve the same run fits:**

```
climb(age) = (ageInjuryFactor(age) − ageF(prime)) / (ageF(top) − ageF(prime))     clamped to [0,1]
pBest      = physioRiskFactor('elite') × the elite recovery package = 0.616 × 0.85 = 0.524
```

**The share of her protection age has taken is exactly the share of the age curve she has already
climbed.** At the prime the floor is `pBest` and the stack is worth every cent of it; at the top of
the curve the floor is 1 and money buys nothing on the injury threshold at all. Because the floor is
derived from the curve, the two cannot drift apart in a later re-tune.

### 5b. What it costs the stack

Priced by `tools/age-injury-fit.ts --curve`, on the fitted curve of §4 and at condition 85 on a quiet
week. `pBest = 0.616 x 0.85 = 0.524` – an elite medical team and the elite recovery package, the best
the shop sells.

| age | ageFactor | climb | floor | protection kept | **% off tau still buyable** | tau with the stack | tau unfloored |
| ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| 20 | 0.25 | 0.00 | 0.524 | 0.524 | **47.6 %** | 0.069 % | 0.069 % |
| 24 | 0.25 | 0.00 | 0.524 | 0.524 | **47.6 %** | 0.069 % | 0.069 % |
| 28 | 0.29 | 0.16 | 0.600 | 0.600 | **40.0 %** | 0.091 % | 0.080 % |
| 30 | 0.36 | 0.44 | 0.733 | 0.733 | 26.7 % | 0.139 % | 0.099 % |
| 32 | 0.43 | 0.72 | 0.867 | 0.867 | 13.3 % | 0.196 % | 0.118 % |
| **34** | 0.50 | 1.00 | **1.000** | **1.000** | **0.0 %** | **0.262 %** | 0.137 % |
| 36 | 0.50 | 1.00 | 1.000 | 1.000 | 0.0 % | 0.262 % | 0.137 % |

⭐ **THE DESIGN'S OWN TEST, AND IT PASSES.** Money still visibly helps a young player – 47.6 % off her
weekly threshold at 20, unchanged from today – and visibly cannot rescue an old one: **0 % at 34.**
A fully-equipped 34-year-old ends up at **3.8× the threshold of a fully-equipped 20-year-old**
(0.262 % against 0.069 %), where the curve alone would give 2.0×. **The floor is what makes the age
curve legible to a wealthy family at all** – without it, a rich career simply shifts the whole curve
down by 47.6 % and reads the same shape.

⚠ **THE FLOOR COSTS NOBODY WHO DID NOT BUY PROTECTION, AND IT CAN NEVER RAISE A THRESHOLD ABOVE THE
UNPROTECTED ONE.** `protectionFloor` maxes at exactly 1 by construction (`pBest + (1-pBest)x1`), so a
self-coached family with no physio has `protection = 1` already and the `max` is a no-op at every
age. It is a tax on the stack and on nothing else, which is precisely what «money undoes its own
harm, it never buys an advantage» means.

⚠ **THE POPULATION COST, BRACKETED RATHER THAN BENCHED.** A floor is structural – there is no knob
for it, and adding one is the engine change this measurement is not allowed to make. The bracket:

| arm (fitted curve, 108 careers, policy `player`) | overall | 29+ |
| --- | ---: | ---: |
| fitted curve, shipped physio | **51.4 %** | 52.3 % |
| fitted curve, `physio.riskReduction = 1` – **the medical team worth nothing at every rung and every age** | **53.2 %** | 54.5 % |

⭐ **So the absolute upper bound on what the floor can cost the population is +1.8 pp, and both ends
of the bracket are inside the band.** The real floor is a fraction of that: it closes only from 28
upward, only reaches 1.0 at 34, and bites only on families who bought protection in the first place.
**The floor is safe to add on top of the fitted curve without re-fitting it.**

---

## 6. What was NOT done, and why

- **No engine file is touched.** `src/` carries no diff on this branch. The frozen MAIN capture is
  verified unmoved (`tests/condition.test.ts`, 51/51 green).
- **The floor's population cost is bracketed, not benched, and it cannot be benched from here.** A
  floor is structural – there is no knob for it, and adding one is the engine change this measurement
  is not allowed to make. The bracket is in §5b.
- **`tools:registry:check` was already red at `424f3925`** on its `tsconfig.app.json` half
  (`shop-probe.ts` is live but unlisted). That is not this branch's and is left alone; the README half
  is regenerated because this branch adds a tool.

## 7. The follow-on this measurement names

Named here so they are not lost, and none of them is proposed:

1. ⭐⭐ **The retirement door has no age term, and it is three quarters of the problem.**
   `retireHazard = RETIRE_K × spentness(pointNumber, stamina) × retireDurability(condition)`. A
   thirty-four-year-old and a nineteen-year-old at the same in-match spentness stop at the same rate.
   **Everything this spec measures is damped by that** – a 2× age curve buys a 15 % rise in realised
   onsets. If ageing should be something a player can FEEL, this is the lever, and it is a much bigger
   change than a table edit.
2. ⭐⭐ **The best-sourced tennis age effect is on SEVERITY, and this spec cannot express it.**
   §5c of the research: the severe share (>28 days) runs 43 % in adolescents against 54–66 % in
   professionals, **1.26–1.53×**, where the incidence numbers show no gradient at all.
   `ageInjuryFactor` multiplies the occurrence threshold; the layoff is drawn from `severityBands`.
   An age-scaled severity draw is the change the literature actually supports, and it is the one that
   would make a thirty-four-year-old's season read differently from a twenty-year-old's – **weeks
   lost per season barely move under the fitted curve (2.1 → 1.7 overall, flat across the adult
   bands), because only the count moved and not the consequence.**
3. **The level.** `docs/backlog/injuries-gear-and-open-bugs.md` #7 is the open item and §7 of that
   page reserves the professional week's price to him. §4a shows why it matters here: three of the
   five bands cannot reach the band's midpoint even with the weekly injury roll switched off.
4. **If the floor ships, `physioRiskFactor`'s own note wants the cross-reference** – it is the rule
   this design copied, and a reader of one should find the other.
