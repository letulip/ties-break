---
type: spec
status: draft
area: engine
canonical: false
last-reviewed: 2026-09-07
---

# Which skills age, and how fast – round 38 #6c

**HIS RULING, 07.09:** «нам здесь надо подумать как лучше и гармоничнее сделать. Может быть и навыки
могут деградировать, это вполне ок, надо только подумать какие и с какой скоростью. Усталость у нас
и так уже существует, просто деньги (в случае Алисы из последнего сейва) покупают восстановление и
это ок.»

⚠ **Two things that ruling settles, and they close two of my own open items.** The wholesale transplant
of ageing from skills into fatigue is OFF – skills may decay. And the recovery decomposition (§1 of
`ageing-mechanism-2026-09.md`: the age fade reaches 4.02 of a 9.02-point free week, the other five
being the physio, the masseur and the rest slider) is **not a defect**: «деньги покупают
восстановление и это ок». Both are recorded closed rather than left hanging.

**What is left is his actual question: WHICH skills, and HOW FAST.**

## 1. What the model does today

`growWeek`'s decline branch is `loss = decline x skills[k]` for every key `isPhysicalSkill` returns
true for – **all four at the same proportional rate**, every week, for ever. Composure is out and
gains `veteranPoise` instead.

⚠ Nothing about that is wrong arithmetic. What it is, is **shapeless**: a thirty-five-year-old loses
her serve at exactly the rate she loses her legs, which is the one thing every tennis broadcast in
the world says is not true.

## 2. The proposal – one multiplier per attribute, and the mean is held

```
loss(k) = decline x ageWeight[k] x skills[k]        mean(ageWeight) = 1 by construction
```

| attribute | weight | why |
| --- | ---: | --- |
| stamina | **1.45** | endurance is the first thing a veteran loses, and it is the one everybody can see |
| ret | **1.09** | the return is movement and reaction before it is technique |
| groundstrokes | **0.91** | rally quality is half movement, half shot-making |
| serve | **0.55** | struck from a standing start; it is the last thing to go, and a serve is a career extender in the real sport |
| composure | – | untouched, and it still RISES (`veteranPoise`) |

⚠⚠ **THE WEIGHTS ARE NORMALISED SO THEIR MEAN IS EXACTLY 1, AND THAT IS THE WHOLE SAFETY OF THE
CHANGE.** Everything downstream of ageing reads `physicalMean(skills) / peakPhysical` – the last
off-season offer (`ENDINGS.lastOfferPeakShare`), the recovery corridor (`recoveryAgeFade`), the
coach's ceiling read – and a normalised split leaves that ratio where it was.

## 3. What it does to his own career, arithmetically

Her week-1115 build against her birth build, today and under the split. Same total decline; only the
shape moves:

| skill | at birth | at her peak | today | under the split | vs birth |
| --- | ---: | ---: | ---: | ---: | ---: |
| serve | 45.90 | 56.14 | 45.13 | **49.84** | **+3.94** |
| ret | 46.90 | 62.02 | 49.86 | 48.88 | +1.98 |
| stamina | 42.90 | 60.59 | 48.71 | **44.11** | +1.21 |
| groundstrokes | 47.90 | 56.31 | 45.27 | 46.18 | −1.72 |
| **physical mean** | 45.90 | 58.77 | **47.24** | **47.25** | – |

**Three of the four end ABOVE the build she was born with, and the fourth is −1.7 instead of −2.6.**
That is his «не падать по навыкам до уровня 12 лет и ниже», delivered without touching the rate at
which she declines overall – the mean moves by **0.01**.

⚠ **This table is arithmetic, not a measurement.** It assumes the per-week factor composes as
`share^weight`, which is exact in the limit and very close over 340 weeks. The bench in §5 is what has
to reproduce it.

## 4. ⚠⚠ THE ONE HONEST COST, and it is in a comment the repo already wrote

`physicalMean`'s own header says the scalar mean is **exact** rather than a simplification, and gives
the reason: «each physical attribute is multiplied by the SAME `(1 - decline)` every week, so each one
keeps the same SHARE of its own peak… `physicalMean(now) / peak` is not an approximation of "how much
of her body is left": it IS each attribute's own share, to the last decimal.»

**A per-attribute weight ends that property.** The mean stays a good summary and the normalisation
keeps its PATH almost unchanged, but it stops being each attribute's own share exactly. Three readers
depend on it and each must be re-measured rather than reasoned about:

* `ENDINGS.lastOfferPeakShare` – does the body still end a career, and at what age?
* `recoveryAgeFade` – does the corridor still close at the same rate?
* `coachRoomNote` / `realisedShare` – does the ceiling read move?

⚠ And `physicalMean`'s header must be corrected in the same commit. A comment that says «exact» about
something that has stopped being exact is worse than no comment.

## 5. Plan of work

| step | what | proof |
| --- | --- | --- |
| 1 | `ECONOMY.development.ageWeight`, four numbers, with a test asserting `mean === 1` to the last decimal | the test fails when any weight is edited alone |
| 2 | `growWeek`'s decline branch reads it | ⚠ absent/undefined ⇒ 1 for every key, so every existing call site is byte-identical |
| 3 | Reproduce §3's table on a walked career | `tools/r38-decline-shape.ts` extended; the four columns printed, not argued |
| 4 | The three readers of §4, re-measured | the ending age, the recovery table and the ceiling read, before and after |
| 5 | ⚠ The frozen careers | they stop at week 156 (age 16.6), so decline never runs and the three hashes must NOT move. If they do, something else changed. |
| 6 | `physicalMean`'s header corrected | – |

**Effort: 1-2 days.** **Risk: bounded by the normalisation**, and the whole of it is §4.

⚠ **NOT STARTED. It needs his word on the four weights** – they are a claim about tennis, and he is
the one who watches it.
