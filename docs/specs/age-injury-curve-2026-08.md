---
type: spec
status: proposal
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

**PLACEHOLDER_VERDICT**

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

PLACEHOLDER_SIM

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

PLACEHOLDER_FIT

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

PLACEHOLDER_FLOOR

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

PLACEHOLDER_FOLLOWON
