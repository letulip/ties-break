---
type: research
status: current
area: simulation-and-balance
canonical: false
last-reviewed: 2026-08-05
---

# How fast does a real woman climb the ladder?

**The calibration target for `docs/specs/ladder-pace-2026-08.md`, written BEFORE anything was tuned.**
The owner's question, verbatim: *«мне надо понимать с какой примерно скоростью в реальности девушки
проходят ступени лестницы турниров. Потому что 35 закончились ОЧЕНЬ быстро, а 50-75-100 периодически
кажутся очень сложными и ОЧЕНЬ частые вылеты на 1м или втором матче очень досадны.»*

**Every number below is tagged.** `[S]` = stated in the cited source. `[I]` = inferred or computed
here from sourced inputs, with the arithmetic shown. `[GAP]` = looked for and not found; a stated
gap is worth more than a plausible invention. Sources are linked at first use.

> **THE THREE ANSWERS, IN ONE PARAGRAPH.**
> **(1) The climb is slow and the spread is enormous.** First ranking at ~16, top 100 at 19.8–21.6,
> peak at 23–24, and the ladder's own bottleneck is #150 → #100: 17.6 months on average with a
> standard deviation of 23.9 – a gate, not a step. The fast path is three seasons from first point
> to top 100; the slow path is nine, and one player first entered the top 100 at **34**.
> **(2) The early exits are real and they are mostly arithmetic.** A 32-draw eliminates 75% of its
> field by the second match whoever is in it, and the average entrant wins 31/32 = **0.97 matches
> per event** at every draw size that has ever existed. A measured journeywoman lands on exactly
> 75.0%; a *future top-100 player slumming at ITF level* gets it down to **55%**; and a real world
> #47 playing the main tour is back at **76.5%**, because she is merely typical for *that* draw.
> **Only over-qualification beats 75%, and it never lasts, because the ladder promotes you out of
> it.** That is the honest shape of the thing the owner finds galling.
> **(3) Attrition is brutal and it is a funnel, not a filter.** Of the ITF junior top 100, 18–36%
> ever reach the WTA top 100; of the junior top 20, 61%. About **16–25 women enter the top 100 for
> the first time each year** out of ~1,550 holding a ranking at all.

---

## 1. THE PACE – how long at each rung

### 1a. Age at each ranking milestone

Two studies, and **they disagree by nearly two years for a reason worth carrying into the model**.

| milestone | Kovacs 2015 (top-100 players only) | Gallo-Salazar 2015 (n=393, across eras) |
| --- | --- | --- |
| top 1000 | **15.9 ± 0.95** `[S]` | – |
| top 500 | **16.8 ± 1.10** `[S]` | – |
| top 300 | **17.6 ± 1.23** `[S]` | – |
| top 200 | **18.6 ± 1.57** `[S]` | – |
| top 100 | **19.8 ± 1.90** `[S]` | **21.6 ± 3.4** `[S]` |
| peak ranking | – | **23.6 ± 3.5** `[S]` |

* Kovacs, Mangan, Ellenbecker & Baker (2015), *Journal of Medical Science and Tennis* – the whole
  WTA top 100 as of 28 July 2014
  ([PDF](https://kovacsacademy.com/wp-content/uploads/2019/07/Kovacs-et-al-How-Top-100-WTA-Players-Succeed-JMST-2015.pdf)).
  Their top-10 sub-group reaches the top 100 at **18.2 ± 1.6** and their #51–100 group at **20.3**.
* Gallo-Salazar et al. (2015)
  ([abstract](https://repositorio.ucjc.edu/handle/20.500.12020/313?locale-attribute=en)).

⚠ **Kovacs is survivor-sampled and its spread is therefore too narrow to model from.** It asks
"of the women who ARE in the top 100, when did they get there?" – every woman who spent eight years
at #250 and stopped is invisible to it. **Use 21.6 ± 3.4 as the population figure and 19.8 as the
figure for a career that succeeds.** The gap between them is not noise, it is the attrition in §3.

**Peak age is 23–24 and it has not moved.** Sackmann's Elo study of ~500 women born 1960–89 finds
*"the most common peak age is 24, with 23 a very close second"*
([Tennis Abstract](http://www.tennisabstract.com/blog/2019/03/30/wta-aging-patterns-and-bianca-andreescus-future/)) `[S]`.
Age 18 sits ~70 Elo below peak and age 30 only ~43 Elo below `[S]` – the decline is gentler than the
rise. ⚠ **And the modelling lesson is precise**: the WTA top-100 mean age rose from 23.5 (1998) to
24.8 (2013) while the peak stayed at 23–24 `[S]`. **The plateau widened; the mode did not shift.**
Our `FIELD.career.peakFrom/peakTo` of 22–28 is a plateau, which is the right shape.

**Career length from 18: 7.86 ± 4.68 years for women** (Schoettl et al. 2025) `[S]`. Our
`FIELD.career` produces 7–18 seasons with a median ~12 from debut at 16–19 – longer than the real
mean, though the real figure counts everyone who ever turned pro, including the ones who quit in
year two, while ours describes people who hold a ranked chair.

### 1b. Time between rungs – the transit table

Chen et al. (2023), *PLOS ONE*, months spent moving between ranking bands, WTA **top-10** players
([paper](https://journals.plos.org/plosone/article?id=10.1371/journal.pone.0289848)) `[S]`:

| step | months (mean ± sd) | note |
| --- | --- | --- |
| first ranking | age **16.2 ± 0.9** | |
| #600 → #400 | **4.8 ± 6.6** | |
| #400 → #200 | **11.9 ± 7.9** | the W15/W35 years |
| #200 → #150 | **4.9 ± 4.9** | fast – the W50/W75 rungs pay well for a top-200 player |
| **#150 → #100** | **17.6 ± 23.9** | ⚠ **THE BOTTLENECK. The sd exceeds the mean.** |
| #100 → #50 | **12.1 ± 9.1** | |
| #50 → #30 | **11.4 ± 6.3** | |
| #30 → #10 | **17.0 ± 11.2** | |
| top 10 | age **23 ± 3.4** | |

⚠ n ≈ 10 and the sample is top-10 players, i.e. **the fastest climbers alive**. Read the numbers as
a floor on the time, not a median. ⚠⚠ **The #150 → #100 row is the single most important number on
this page for pacing**: an sd larger than the mean means it is a *heavy-tailed gate*, not a normal
step. Some players clear it in a season and some spend four years bouncing off it. That is the real
shape of «50-75-100 периодически кажутся очень сложными», and it is not a bug in reality either.

ITF's own cohort figures agree from the other end: women's age at first ranking **15.9**, age at top
100 **20.0**, **transition 4.1 years** (2013 cohort, *ITF Pro Circuit Review*) `[S]`.

**So: roughly four to five years from the first ranking point to the top 100, and about seven from
the first point to a peak.** In our own units that is a career opening at 14 and cracking the top 100
around 20–22, having spent two to three seasons in the W15/W35/W50 band.

### 1c. The spread – the prodigy and the late developer

**The fast tail** `[S]` for dates, `[I]` for the age arithmetic: Andreeva career-high **#5 at 18y76d**;
Sharapova **#1 at 18y125d**; Raducanu **#10 at 19y240d**; Gauff **#2 at 20y89d**; Świątek **#1 at
20y308d**; Mboko **#333 → #10**, and **357 days from top-200 to top-10**.

⚠ **The very fastest paths are legally closed now.** Seven of the nine youngest top-10 entries ever
(Capriati 14y214d, Jaeger 15y68d, Austin 15y91d, Sabatini 15y109d, Seles 15y283d) **predate the 1995
Age Eligibility Rule** `[S]`. The AER truncated the young tail deliberately, and we already model it
(`proPerYearByAge`) – see §4.

**The slow tail**, measured directly off year-end ranking tables because no published list of late
top-100 debutantes exists `[GAP]`. Trajectories `[S]`, ages `[I]`:

| player | trajectory (year-end rank at age) | first top-100 | career high |
| --- | --- | --- | --- |
| Nao Hibino | 578 (18) → 291 (19) → 207 (20) → **78 (21)** | **age 21** | #56 at 21 |
| Tamara Korpatsch | 162 (21) → 145 → 121 → 113 → 126 → 176 → **89 (27)** → 73 (28) → 185 (29) → 151 (30) | **age 27** | **#46 at 31** |

**Records** `[S]`: the oldest first-time top-100 entry is **Arina Rodionova at 34y52d**
([WTA](https://www.wtatennis.com/news/3883146/rankings-watch-rodionova-becomes-oldest-player-to-make-debut-in-top-100));
the oldest first-time top-10 is Vinci at 33.

⚠⚠ **THE TWO THINGS A MEDIAN CANNOT SHOW, AND BOTH BELONG IN A CAREER SIM.** (a) The fast path is
~3 seasons from turning pro to the top 100 and the slow path is ~9. (b) **Neither trajectory is
monotonic.** Korpatsch went 73 → 185 → 151 → 46 across four years in her late twenties. A real
ranking yo-yos across the top-100 boundary for a decade; it does not ratchet.

---

## 2. THE EARLY EXITS – the owner's own complaint, measured

### 2a. The floor is 75% and it is arithmetic, not difficulty

In **any** single-elimination draw of N players: exactly N/2 lose in round one and N/4 in round two,
so **75.0% of the field is out by the second match**, and the total number of match-wins is N−1, so
**the average entrant wins (N−1)/N ≈ 0.97 matches per tournament.** `[I]`, and arithmetically
certain. It is **scale-invariant**: identical for a 32-draw W15 and a 128-draw Grand Slam. W15/W35
main draws are 32 (qualifying 24/32/48/64)
([ITF Organisational Requirements](https://www.itftennis.com/media/9106/wtt-organisational-requirements.pdf)) `[S]`.

**This is the number to compare ours against.** Not "how often does she lose early" but "how much
earlier than 75% / how much better than 0.97 wins an event".

### 2b. What real season logs show

Every singles main-draw entry counted off [Tennis Explorer](https://www.tennisexplorer.com/) match
logs; logs `[S]`, aggregation `[I]`. Qualifying-only entries and team tennis excluded.

| player-season | ITF main draws | out by R2 | titles | matches won | **per event** |
| --- | --- | --- | --- | --- | --- |
| Hibino 2014 (19) | 16 | **37.5%** | 0 | 29 | 1.81 |
| Korpatsch 2016 (21) | 18 | **55.6%** | 3 | 32 | 1.78 |
| Korpatsch 2018 (23) | 14 | **57.1%** | 1 | 21 | 1.50 |
| Zakharova 2021 (19) | 14 | **50.0%** | 0 | 22 | 1.57 |
| Gibson 2023 (19) | 29 | **65.5%** | 2 | 39 | 1.34 |
| **all five, later top-100** | **91** | **54.9%** | 6 | 143 | **1.57** |
| **Shapatava 2023** – career high #186, ranked ~#450 at the time | 16 | **75.0%** | 0 | 12 | **0.75** |

> **THE HEADLINE. The journeywoman lands on EXACTLY the mechanical 75% and BELOW the 0.97-wins
> baseline. The five future top-100 players average 55% and 1.57 wins an event – about 1.6× the
> field rate.** So "out by round two" is not a difficulty dial: it is a direct readout of how far a
> player is above the draw she is in.

⚠ **And the over-qualification does not survive promotion.** Korpatsch in 2026 ranked **#47**, playing
the main tour: 17 main draws, 8 first-round losses and 5 second-round losses = **76.5% out by R2**,
in the same season she won a title, made two finals and reached a Slam third round `[S]`/`[I]`.
Counting her four qualifying exits, **81% of 21 entries ended by the second match.** A top-50 player
on the main tour exits as early as a journeywoman at ITF level, because in both cases **she is merely
typical for her draw**. The ladder's whole job is to promote a player out of every band she becomes
over-qualified for, so 55% is a phase and 75% is the destination.

### 2c. Titles, and how many events one costs

* **15.2 ITF events per title** for the future-top-100 group (6 titles / 91 events) `[I]`.
* Career ITF singles titles on the way to a career high in the #45–75 band `[S]`: Hibino **10**,
  Gibson **12**, Korpatsch **13**, Zakharova **16**. **A consistent 10–16 ITF titles builds a
  top-50 career** – over roughly a decade, not a season.
* Even at WTA 125 level the best 2025 season anywhere was **3 titles** across 53 events `[S]`.
* In a January 2024 sample of 17 ITF titles there were **16 distinct champions** `[S]` (partial-page
  sample, directional only). Nobody farms the entry rungs.

### 2d. How many events a season

ITF's own 2014 review, women, by ranking band `[S]`:

| band | 1–50 | 51–100 | 101–250 | 251–500 | 501–1000 | >1000 |
| --- | --- | --- | --- | --- | --- | --- |
| events/yr | 20 | 23 | 22 | 18 | **12** | **8** |

⚠ **The players ranked past #500 play 8–12 events, and the constraint is money, not motivation** –
see §3c. Our own bench measures 14–21 entries in her window, which sits in the 101–250 band's
figure: right for a player who is being funded.

---

## 3. THE ATTRITION – how many ever get through

### 3a. Junior to professional

*ITF Pro Circuit Review* (Dec 2014), tracking the **ITF junior girls' top 100** forward `[S]`:

| junior cohort | any pro ranking | pro top 250 | **pro top 100** |
| --- | --- | --- | --- |
| 1990 | 84 | 48 | **30** |
| 2000 | 88 | 54 | **36** |
| 2008 | 94 | 46 | **18** |

Reid, Crespo & Santilli (2009), junior **top 20** girls, n=124, 1995–2002
([PDF](http://miguelcrespo.net/wp-content/uploads/2020/01/2009-Reid-Crespo-Santilli-ITF-Junior-Girls-Circuit-JSS.pdf)) `[S]`:

| junior rank | reached WTA top 100 | reached top 50 |
| --- | --- | --- |
| 1–5 | **81.1%** | 64.9% |
| 6–10 | 62.9% | 37.1% |
| 11–15 | 57.7% | 34.6% |
| 16–20 | 33.3% | 25.9% |
| **all top 20** | **61.3%** | **43.3%** |

⚠ **Junior ranking explains only ~13% of professional ranking variance (r² = 0.133)** – the authors
call it *"an indicator rather than a precursor"* `[S]`. That is a licence for our own conveyor to be
noisy: a J-tour result should shift the odds, never settle them.

Across **all** ITF-ranked junior girls (not the top 100), the share reaching *any* professional
ranking fell from **28.2% (2001) to 18.1% (2010)** `[S]`.

### 3b. The professional funnel, and the real denominator

| quantity | value | year | tag |
| --- | --- | --- | --- |
| women holding a WTA singles ranking | **~1,550–1,600** (list ends #1531 on 3 points) | Aug 2026 | `[I]` from paged `[S]` pages |
| women holding a WTA ranking | ~1,600 | 2013 | `[S]` |
| women who played the ITF circuit at all | **4,862**, of whom **2,212 earned nothing** | 2013 | `[S]` |
| ITF circuit players, both sexes | 13,736 → 10,979 | 2013 → 2024 | `[S]` |
| ITF women's tournaments | ~500–602 | 2024–25 | `[S]` |
| **first-time top-100 entries** | **16 (2023)**, ~18–25 in 2024–25 | | `[S]` / partly unverified |

> **~16–25 women out of ~1,550 ranked enter the top 100 for the first time in a year: a 1–1.6%
> annual rate.** `[I]` That is the number our "careers of 180 reaching the top 100" line has to be
> read against – with the caveat that our 180 are all funded, coached, managed careers, i.e. the
> favourable tail of that population rather than a sample of it.

⚠ **The ranked-women denominator has been flat at ~1,500–1,600 for over a decade** (the ITF review
recorded growth of *"−1 female players per year"*, against +51/year for men) `[S]`.

`[GAP]` **No study publishes the probability that a woman ranked #400–800 ever reaches the top 200.**
The junior-cohort tables above are the closest substitute and they start one stage earlier.
`[GAP]` No post-2013 gender split of the ITF circuit population exists publicly.

### 3c. The money, because it is what sets the attrition

*ITF Pro Circuit Review – Stage One: Data Analysis*, Dec 2014
([PDF](https://www.sportsintegrityinitiative.com/wp-content/uploads/2016/01/194256.pdf)), verbatim
`[S]`: *"The 2013 breakeven point for women, where cost = prize money earnings, was **253**."*
Men: 336. Average cost of a 2013 season: **$40,180** for a woman.

⚠ **Read the fine print before quoting 253**: it counts **singles and doubles** prize money and
assumes **no coach and no physio** – flights, accommodation, food, restringing, laundry, clothing and
transport only. It is the most generous possible reading, and the report publishes **no**
with-support-team figure `[GAP]`. Schoettl et al. (2025) put break-even at about **#150** once the
junior development years are counted `[S]`, which is far harsher.

2024 ITF singles prize money `[S]`:

| round | W15 | W35 | W50 | W75 | W100 |
| --- | --- | --- | --- | --- | --- |
| winner | $2,352 | $3,188 | $4,903 | $7,344 | $12,285 |
| **first-round loss** | **$147** | $244 | $371 | $557 | $926 |

> `[I]` **A woman would need ~17 W15 titles in one season to cover the ITF's own $40,183 average
> cost.** A **W100 champion's cheque ($12,285) does not cover a year** at the 101–250 band ($46,716).
> Brenda Fruhvirtova won **eight ITF titles in 2022** and grossed **$43,071** `[S]` – the most
> successful woman on the circuit by titles roughly broke even.

That is the same cliff `docs/research/02-tennis-economics.md` is about and the same one
`money-decomposition-2026-08.md` measured at a 16.6% career prize/spend ratio. **Our economy is not
pessimistic. It is approximately right.**

---

## 4. THE RULES THAT SHAPE THE PACE – and what we already model

All `[S]`, 2026 WTA Rulebook / 2026 WTT Regulations.

| real rule | source | ours |
| --- | --- | --- |
| Age Eligibility: <14 = 0 events, 14 = **8** (max 3 at W75+), 15 = **10**, 16 = **12**, 17 = **16**, 18+ unlimited | WTA Rulebook §X.A.2 | `proPerYearByAge` – **matches** |
| **A player ranked WTA #1–150 may not enter W15 or W35 at all** | 2026 WTT Regs | this is the real `tierOutgrown`, and it is a **hard rank cut at #150**, not a sliding window |
| Junior Reserved places: up to 3 main-draw places at **W15 only**, ITF combined junior ranking 1–100, age 14+ | 2026 WTT Regs §VII.A Method E | our W15 on-ramp reads her ITF junior points – same door |
| Junior Accelerator: girls' year-end junior top 20 get direct main-draw entry | 2026 WTT Regs App. D | not modelled |
| Pro Path Merited Increases: year-end junior top 5, aged 14–17, earn up to 4 extra events | WTA Rulebook §X.A.4.b | not modelled |
| ~600 women's tournaments a year, **~48% of them W15**, ~4% W100 | ITF | our calendar's cadence (W15 every 2 weeks … W100 every 13) is the same pyramid |

⚠⚠ **THREE CORRECTIONS TO THINGS THIS REPO CURRENTLY BELIEVES.** Each is sourced, each is
downstream of this wave, and none is acted on here.

1. **THE WTA RANKING COUNTS THE BEST 18, NOT 16.** 2026 WTA Rulebook §VIII.A.4.a.i: a player never
   accepted into a Slam or a WTA 1000 has all eleven mandatory slots convert to open slots, so **her
   ranking is simply her best 18 results over 52 weeks.** Ours is `BEST_N_BY_TRACK.wta = 16`.
   `tools/ceiling-walk.ts` measured widening past 16 as worth *exactly nothing* to a perfect player,
   so this is a small correction – but it is a correction, and it is free.
2. **OUR TWO ENTRY RUNGS ARE UNDER-PRICED AGAINST THE REAL CHART, AND ONLY THOSE TWO.** The naming
   rule is that a rung is named after the winner's points (the 2024 ITF restructure renamed
   W25/W40/W60 to W35/W50/W75 explicitly *"to align the tournament naming with the points awarded to
   the Winner"*). Real: **W15 = 15**, **W35 = 35**. Ours: `w15.points[0] = 10`, `w35.points[0] = 20`
   – 67% and 57% of the real figure, while **every rung from W50 up is exact** (50 / 75 / 100 / 125 /
   250 / 500 / 1000 / 2000). So the discontinuity the owner feels at the bottom of the ladder has a
   second, independent cause besides the acceptance cuts: **the two cheapest rungs are cheaper still
   than the sport makes them.** This is step 4 (re-pricing) and is deliberately not touched here.
3. **A MINIMUM RANKABLE TOTAL OF 3 POINTS EXISTS** (three tournaments with points, or 10+ in one), so
   a real ranking list holds no rows on 1 or 2. Ours ranks a player on a single point. Cosmetic, but
   it is why "one W ranking point" is a state the real tour does not have.

### 4a. The hard ceiling a W15 schedule creates

`[I]`, exact arithmetic on the real chart at best-18:

| a perfect season of nothing but | max points | lands about |
| --- | --- | --- |
| W15 | **270** | ~#270 |
| W35 | 630 | ~#125 |
| W50 | 900 | ~#82 |
| W75 | 1,350 | ~#36 |
| W100 | 1,800 | ~#26 |

> **A PURE W15 SCHEDULE MATHEMATICALLY CANNOT CRACK THE TOP 200** – it caps near #270 even if she
> wins every event she enters. Progression *requires* stepping up. Our own ladder has the same
> property and states it (`fieldPros.ts`: a best-16 window of nothing but W15 titles caps at 160),
> so the shape is right; only the magnitudes differ, for the reason in correction 2.

---

## 5. THE REAL POINTS-TO-RANK CURVE, AND WHERE OURS SITS

Live WTA singles list paged on **3 August 2026**, cross-checked against a second pull `[S]`:

| rank | #1 | #10 | #20 | #50 | #100 | #150 | #200 | #300 | #500 | #700 | #1000 | tail |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **live Aug 2026** | 8,550 | 4,353 | 2,106 | 1,105 | **786** | 529 | **394** | **238** | **117** | 59 | 22 | **3** at #1531 |
| year-end 2024 | 9,416 | 3,214 | 2,127 | 1,070 | 767 | – | 346 | 212 | 101 | 48 | 13 | – |
| **the anchors this game uses** | 10,500 | 4,000 | – | 1,400 | 850 | 520 | 350 | 190 | 75 | – | – | – |

Everything from #20 to #150 is stable across the twenty-month gap. ⚠ **Our anchors are a little
generous at the head (#1, #50) and a little mean in the tail (#300 = 190 against a live 238, #500 =
75 against a live 117).** They are a defensible reading of a year-end table and they are
**calibrated on purpose** – `act2-pro-tour.md` §11 calls the fit a deliberate achievement, and this
wave does not spend it. Recorded so the next re-pricing knows the live curve sits slightly above ours
in the tail.

⚠⚠ **THE POPULATION GAP IS THE ONE THAT MATTERS.** The real list holds **~1,550 women**; ours holds
**719 rows of which 364 carry points** before this wave. Every `entrantPctBand` in
`season/calendar.ts` is a share of that table, so a W15's window – which in reality draws from about
**#400 and below** – lands on our #124–#405. **That single fact is why the field a W15 draws is far
too strong, and it is the reason population depth had to come before strength compression.**

---

## 6. THE TARGET, AS NUMBERS THIS REPO CAN BE MEASURED AGAINST

| what | real | tag |
| --- | --- | --- |
| age at first professional ranking point | **15.9–16.2** | `[S]` |
| age reaching the top 200 | **18.6** (survivors) | `[S]` |
| age reaching the top 100 | **19.8** (survivors) / **21.6 ± 3.4** (population) | `[S]` |
| age at peak ranking | **23.6 ± 3.5**, mode **23–24** | `[S]` |
| first point → top 100 | **4.1 years** (ITF cohort) | `[S]` |
| #150 → #100 | **17.6 ± 23.9 months** – a heavy-tailed gate | `[S]` |
| **out by round two, player typical for her draw** | **75.0%** | `[I]`, exact |
| **out by round two, future top-100 at ITF level** | **55%** | `[I]` from `[S]` logs |
| **out by round two, world #47 on the main tour** | **76.5%** | `[I]` from `[S]` logs |
| **matches won per event, field average** | **0.97** | `[I]`, exact |
| matches won per event, future top-100 at ITF level | **1.57** | `[I]` |
| events per ITF title, future top-100 | **15.2** | `[I]` |
| ITF titles behind a top-50 career | **10–16**, over a decade | `[S]` |
| events per season, ranked 101–250 | **22** | `[S]` |
| junior top 20 → WTA top 100 | **61.3%** | `[S]` |
| junior top 100 → WTA top 100 | **18–36%** | `[S]` |
| first-time top-100 entries per year | **16–25 of ~1,550 ranked = 1–1.6%** | `[S]`/`[I]` |
| break-even rank | **#253** (2013, no coach) / **~#150** (lifetime investment) | `[S]` |

---

## 7. WHAT THIS SAYS ABOUT THE OWNER'S THREE COMPLAINTS

**«ОЧЕНЬ частые вылеты на 1м или втором матче очень досадны» – reality is also brutal, and the fix is
partly presentation.** 75% of any knockout field is out by the second match, always. A real
journeywoman hits exactly that; a real future top-100 player at ITF level gets it to 55%; a real
world #47 on the main tour is back at 76.5%. So the honest target is **not fewer early losses** but
**an early loss that reads as normal instead of as failure** – and a visible, honest signal of the
one thing that does move it, which is being over-qualified for the draw she is in. `[S]`/`[I]`

**«35 закончились ОЧЕНЬ быстро» – that one is ours, and it is a defect.** In reality the rung a
player is pushed out of is a **hard cut at #150** and nothing below it closes at all; our
`tierOutgrown` shuts W15 the moment a single W point clears an acceptance cut that sits past the end
of our own table (`world-strength-audit-2026-08.md` §6c). She skips the bottom of the ladder because
three rungs open at once. **That is step 1's target.**

**«50-75-100 периодически кажутся очень сложными» – half real, half ours.** Real: #150 → #100 takes
17.6 months with an sd of 23.9, so a wall there is the sport. Ours: she arrives at W75 far too early
for the same reason W15 shuts too early, and the bench measures her exiting by round two **90.0% of
the time at W75 against a 75% floor** – fifteen points worse than a coin-flip field, and worse than
any real figure on this page. **That is step 2's target.**
