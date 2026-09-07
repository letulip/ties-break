---
type: spec
status: draft
area: engine
canonical: false
last-reviewed: 2026-09-07
---

# What actually ages – round 38 #5, the diagnosis before the design

**HIS QUESTION, 06.09:** «как 1-2 года назад она была в топ-50 и топ-100 и вполне могла играть, даже
на шлеме куда-то продвигалась немного, а потом внезапно вообще не смогла и проигрывает даже w35
турниры. Значит у нас с деградацией скиллов какие-то вопросы. Вот куда надо смотреть: что у нас
деградирует и по какому механизму.»

⚠ **THIS SPEC SHIPS NOTHING.** It is the measurement his sentence asks for, and it found **three
separate mechanisms**, only one of which is the skill curve. `tools/r38-decline-cliff.ts` on his own
week-1115 career; every figure below is reproducible with one command.

---

## 1. The recovery is not ageing – 44% of it is

**HIS OBSERVATION:** «у 35 летней всё равно приходит по 9 в неделю на пустых неделях, может мы
где-то что-то не считаем?» **He is right, and here is the nine:**

| term | value |
| --- | ---: |
| her body – `proPhaseRecoveryBase` 5.00 x age fade 0.80 | **4.02** |
| the rest slider (`plan.rest` 25) | 1.00 |
| the physio | 1.00 |
| the masseur, daily | 3.00 |
| **a free week returns** | **9.02** |

⚠⚠ **The age fade reaches 4.02 of 9.02 points. The other five are BOUGHT SERVICES THAT DO NOT AGE.**
And `condition.recoveryAgeFloor` is 0.5, so her body can never return less than 2.50: the worst free
week a woman of any age can ever have, with this staff, is **7.50** against a twenty-year-old's
**10.00**. A quarter of a point of ageing, for fifteen years.

That is one line of arithmetic in `accrueCondition`, and it is the cheapest of the three findings.

## 2. The skill-to-result curve amplifies by three to four times

Her body from 30 to 35.3, and what it is worth against four real opponents from her own world
(closed form, hard court, both fresh):

| age | physical mean | vs #3 | vs #50 | vs #150 | vs #400 |
| --- | ---: | ---: | ---: | ---: | ---: |
| 30.0 | 56.82 | 21.25% | 43.58% | 59.05% | 95.93% |
| 32.0 | 53.77 | 15.59% | 35.36% | 50.56% | 93.72% |
| 34.0 | 50.01 | 10.12% | 26.12% | 40.07% | 89.78% |
| **35.3** | **47.28** | **7.15%** | **20.31%** | **32.86%** | **85.97%** |

**Her body fell 16.8%. Her chance against a #50 fell 53%.** That is not a defect – it is what a
Markov match does to a per-point edge, and it is what tennis does too. ⚠ But it means the DECLINE
RATE is the wrong dial for his complaint: `declineAccel` would have to be cut to almost nothing to
change the shape, and the shape is the amplifier, not the input.

⚠ **And note the last column.** She still beats a #400 **86%** of the time. On the court she is not
finished at all.

## 3. THE ACCESS SQUEEZE – and ⚠⚠ THE FIRST DRAFT OF THIS SECTION WAS WRONG

This is the finding, and it is not about skills at all. Her rungs at week 1115, ranked **#141**:

| tier | outgrown | open to her | acceptance cut |
| --- | --- | --- | ---: |
| w15 | **shut behind her** | no | – |
| w35 | **shut behind her** | no | 700 |
| w50 | shut behind her | yes | 330 |
| w75 | shut behind her | yes | 300 |
| w100 | – | yes | 240 |
| wta125 | – | yes | 210 |
| wta250 | – | yes | 200 |
| wta500 | – | **no – she misses the cut** | 120 |
| wta1000 | – | **no** | 65 |
| slam | – | **no** | 112 |

She is squeezed from both ends. The events she would still win – the ones full of #400s, where the
model says she takes 86% of her matches – are **shut behind her forever**: `tierOutgrown`'s own note
says «professional rungs never re-open». The events that would pay her ranking points are shut in
front of her: at #141 she misses the cut at every rung above wta250.

What is left is w50 to wta250, where the field is drawn around ranks 200-330 and she is a #141 body
playing at a #250 level. Her last 26 results say exactly that: **nine of them are worth 1 point** – a
first-round loss – and her single w35 of the season is worth 8.

### ⚠⚠ THE CORRECTION, 07.09 – «the ladder has no way down» IS FALSE

The first draft of this section said the small rungs are «shut behind her forever», quoting
`tierOutgrown`'s note that «professional rungs never re-open». **That note is about the pro-entry-cap
clause and I quoted it out of context.** The W rungs are shut by a different limb – `playDownBars` –
and it is a RANK READ that persists nothing and re-reads `kidRankWta` every time it is asked:

```
PLAY_DOWN.fromAllW  = 50    a rank inside 50 is barred from EVERY W-series event
PLAY_DOWN.fromLowW  = 150   ...and inside 150, from w15 and w35 only
```

⭐ **And the owner named the property himself on 15.08:** «когда она вывалится из топ-50 и топ-150 оно
само откроется обратно.» `tests/play-down.test.ts` asserts both directions in one case.

**She is #141. w15 and w35 are shut by NINE RANK PLACES, and they open by themselves the week she
falls past 150** – which her own points arithmetic will do inside this season. Everything from w50
upward has been open to her all along.

### So what is actually wrong, stated correctly

Not access – **LAG**. Her rank is a 52-week trailing sum of results she can no longer repeat, so for
roughly a season it stands about a hundred places above her level:

* her rank says **#141**; her chance against a w50 field says she belongs around **#250**;
* at #141 the two rungs where she would be a favourite are shut by nine places;
* and at #141 she is entered into fields she loses to, which is what pushes the rank down – slowly,
  through a trailing window, over a whole season.

⚠ **This is exactly what the owner said before the measurement was run:** «она играет на уровне #250
с рангом #141 – вот именно об этом я и говорю… думаю, что до конца сезона она просто по очкам
проигрыша как раз упадет к этим 250, потому что в предыдущий год накопилось.» He was right and the
first draft of this section was not.

## 4. Condition is not the cause, and cannot be with today's curve

`conditionMatchFactor` is **flat at 1.00 from 70 to 100** and only bites below it:

| condition | 100 | 90 | 80 | 70 | 60 | 50 | 40 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| factor | 1.00 | 1.00 | 1.00 | 1.00 | 0.94 | 0.87 | 0.81 |

Her condition is **94.10**. Fatigue is doing nothing to her, because with the staff she has she never
drops into the band where it does anything.

---

## 5. His own proposal, costed

**«Может она должна больше уставать и больше терять за матч своей кондиции, но не падать по навыкам
до уровня 12 лет и ниже.»**

⚠ It is a real design and the code is closer to it than it looks: `conditionMatchFactor` scales **all
five attributes at the composition point**, which is exactly the shape a skill loss has. So condition
and decline are already the same lever wearing two names – **what differs is that condition comes
back and skills do not.** Moving the ageing penalty from one to the other means:

* an old player has the SAME skills on a fresh day and empties faster and refills slower;
* the radar stops printing a fourteen-year-old's serve for a woman who reached #20;
* and the veteran's decline becomes something the player can MANAGE – rest weeks, a lighter
  calendar, the masseur – which is the thing today's model gives him no answer to.

⚠⚠ **It is a bigger change than it sounds and it touches three curves**: `recoveryAgeFade` (§1),
`conditionMatchFactor`'s flat band (§4), and `matchDrain` / `runFatigueExtra` (how much a match costs
an old body). It also moves every AI result, because rivals read `conditionMatchFactor` too.

## 6. The three things this measurement says to do, in order

| # | what | why it is first, second, third |
| --- | --- | --- |
| **A** | ~~The ladder's way down~~ – ⚠ **WITHDRAWN 07.09: it already exists** (`playDownBars`, and it self-reverses at #150). What is left of §3 is the LAG, and a rank that trails her level by a hundred places for a season is a question about the ranking WINDOW, not about access. |
| **A** | **The age fade reaches the whole recovery**, not just the base – or the staff's own bonuses fade with her | §1, one line, and it is what makes «she tires more» true at all. |
| **B** | **The ageing penalty moves from skills toward condition** – his own proposal, §5 | The largest, and it should be measured against A and B rather than instead of them: with a way down and a real fatigue curve, the skill decline may not need to be as steep. |

⚠ **And one thing he asked for that is NOT a mechanism at all:** «нужно и чётко понимать, что карьера
уже не та и явно это подсвечивать, как раз срез года закончить/продолжать это как раз про это, там
нужно больше её голоса (или голоса тренера, если он есть, или совместного)». That is the end-of-season
retirement moment carrying her own reading of her own body – a content item on a screen that already
exists, and it is independent of A, B and C. It should ship with whichever of them ships first, so the
player is told what is happening to her while it happens.
