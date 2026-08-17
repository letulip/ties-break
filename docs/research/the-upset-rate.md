---
type: research
status: current
area: research
canonical: false
last-reviewed: 2026-08-17
---

# How often does the lower-ranked woman win? – the upset rate as a function of the ranking gap

**Why this document exists.** The owner, round 21: «Я допускаю, что 300 вполне может обыграть 50,
это спорт, всякое случается, но вероятность такого довольно мала, как мне кажется. Можно поискать
статистику.» This is that statistic, and its limits.

**⚠ THE HEADLINE FINDING IS A NEGATIVE ONE, AND IT IS STATED FIRST BECAUSE IT GOVERNS EVERY NUMBER
BELOW.** There is **no published empirical table** of "the lower-ranked WTA player wins X% of matches
at a gap of N ranks". Not on Tennis Abstract, not in the literature we could reach, not anywhere we
looked. What exists is **two published MODELS** whose parameters were fitted on women's matches, and
a **live Elo table**. Every cell in §3 is therefore `[I]` – inferred by evaluating a sourced model –
and never `[S]`. The base rates in §2 are `[S]`; the model coefficients in §2 are `[S]`; the
*probabilities computed from them* are `[I]`. That distinction is the whole point of this file.

`docs/specs/acceptance-cuts-2026-08.md` §0 finding 2 records what an unsourced table cost this repo:
five entry ranges entered as fact, propagated through three documents each citing the one before,
and two of them were wrong. So: **nothing here is estimated into the text.** Where we could not
source, §5 says so and gives no number.

---

## 1. How to read the evidence

| tag | meaning |
|-----|---------|
| `[S]` | sourced – a number stated by the cited source, at the URL given |
| `[I]` | inferred – computed by us from `[S]` inputs; the arithmetic is named |
| `[WEAK]` | sourced but the source is weak, mis-scoped, or read off a chart |
| `[?]` | we could not source it and give no number |

**Sex is never substituted.** Men's tennis has a materially different upset structure (see `[S-2]`
against `[S-1]`), so an ATP figure is never used to stand in for a WTA one, and every row says which.

---

## 2. THE SOURCED INPUTS

### 2a. Base rates – how often does the better-ranked woman win, over everything?

| id | figure | population | sex | source |
|----|--------|-----------|-----|--------|
| `[S-1]` | **75%** | Wimbledon main draw 1992–1995, N=504 | women | [Klaassen & Magnus, *Forecasting the winner of a tennis match*, EJOR 148 (2003) 257–267](https://www.janmagnus.nl/papers/JRM065.pdf), p. 261 |
| `[S-2]` | **68%** | same paper, N=495 | men | same |
| `[S-3]` | **67.9%** | all WTA matches 1990–2017 | women | [Tennis Abstract, *The Steadily Less Predictable WTA*, 28 May 2017](https://www.tennisabstract.com/blog/2017/05/28/the-steadily-less-predictable-wta/) |
| `[S-4]` | **62.4%** | WTA 2017 to Rome, >1,100 completed matches | women | same |
| `[S-5]` | Elo picked the winner **68.6%** (1990–2017), **63.1%** (2017) | WTA | women | same |
| `[S-6]` | surface-Elo picked the winner **76.2%** (1990–2017), **71.0%** (2017) | WTA | women | same |

> "the ranking system has picked the winner of 67.9% of matches" – Tennis Abstract, 2017.

**⚠ THE ERA MATTERS AND IT IS THE LARGEST SINGLE UNCERTAINTY IN THIS FILE.** `[S-1]`'s 75% is
Wimbledon in the Graf/Seles years – the most top-heavy period the women's game has had. `[S-3]`/`[S-4]`
put the modern figure 7 to 13 points lower, and the Tennis Abstract post's own title is that the WTA
has become *less* predictable. Any model fitted on the 1992–95 window therefore **overstates**
favourite dominance for the game as it is now.

### 2b. The one published model with a women's coefficient

`[S-7]` **Klaassen & Magnus (2003), §3.** Ranks enter as `R = 8 − log₂(RANK)`, and

```
P(favourite wins) = exp(λ·D) / (1 + exp(λ·D)),   D = R_fav − R_dog = log₂(rank_dog / rank_fav)
```

with **λ̂ = 0.7150 (SE 0.0683) for women** and λ̂ = 0.3986 (SE 0.0461) for men.
Source: [janmagnus.nl/papers/JRM065.pdf](https://www.janmagnus.nl/papers/JRM065.pdf).

Two properties make this the right instrument for our question. It is a **pure function of the log
rank ratio** – exactly the shape the owner asked about – and the women's coefficient is **nearly
double the men's**, which is the sourced form of "the women's game is more top-heavy at a given rank
gap", and is why substituting ATP data here would have been a real error rather than a pedantic one.

`[I]` **Restated in Elo units**, because the rest of this repo and the whole of tennis modelling
speak Elo: a logistic in log₂(rank) with λ = 0.715 is exactly `400·λ/ln(10)` = **124.2 Elo points per
doubling of rank**. That single constant reproduces the entire model and is the number §3 is built on.

### 2c. ⚠⚠ THE LIVE ELO LIST – RE-DONE PROPERLY, AND THE FIRST CUT OF THIS SECTION WAS WRONG

**The owner, ruling on which instrument we aim at:**

> «"расчёт по живому рейтингу Elo на август этого года" – вот это же супер-ценная и актуальная
> информация, **нам не нужно доминирования, как в 90х**.»

**So this is the target and K&M is the contrast.** Which made the quality of this section load-bearing,
and the first cut of it was not good enough – it is corrected here rather than quietly patched.

`[S-8]` [Tennis Abstract WTA Elo report](https://tennisabstract.com/reports/wta_elo_ratings.html),
list of **2026-08-03**. Now **parsed in full**: **547 players who hold both an Elo rating and an
official WTA rank**, stored as (rank, Elo) pairs at
[`docs/research/raw/2026-08-17-wta-elo-by-rank.json`](raw/2026-08-17-wta-elo-by-rank.json).
⚠ **Player names are deliberately not stored** – CLAUDE.md forbids making real surnames
constructible.

`[S-9]` The report's own published mapping, which the standard formula reproduces exactly:

> "A 100-point difference in Elo ratings implies that the favorite has a 64% chance"

Elo gap **100 → 64% · 200 → 76% · 300 → 85% · 400 → 91% · 500 → 95%** (best-of-three).

#### ⚠ THE CORRECTION – what the first cut got wrong and by how much

The first cut of this file read Elo by rank as *the median within ±12 ranks*, by hand. That window
**averages the world #1 together with #2–#13**, and the world #1 is one person, not a band: it printed
**#1 = 2058** where the actual figure is **2194.6**. Everything derived from that row was wrong in the
same direction, and the error was large:

| | first cut (±12 by hand) | **corrected** |
|---|---|---|
| #1's Elo | 2058 | **2194.6** |
| #1 vs #10 upset | 41.6% | **23.9%** |
| #1 vs #50 upset | 17.3% | **9.0%** |

**The corrected figure is not a small revision – it halves the headline row**, and that row was being
used to decide how flat the top of our table is allowed to be. The lesson is the one this repo keeps
recording: a smoothing window is a modelling choice, and a hand-applied one with no stated
justification is an unsourced number wearing a source's clothes.

#### The curve as it actually is `[I]`

Median Elo of log2-rank bins of the 547 pairs, forced monotone, with the **residual spread inside each
bin** – the quantity a curve alone cannot express:

| rank | 1 | 5 | 8 | 13 | 22 | 36 | 58 | 94 | 152 | 247 | 402 | 653 | 1060 |
|------|---|---|---|----|----|----|----|----|-----|-----|-----|-----|------|
| median Elo | 2195 | 2088 | 2034 | 1932 | 1913 | 1816 | 1784 | 1719 | 1603 | 1477 | 1353 | 1296 | 1196 |
| residual sd | – | 27 | 56 | 75 | 53 | 51 | 52 | 69 | 82 | 101 | 104 | 120 | 117 |

**⚠ THE SHAPE IS NOT A STRAIGHT LINE, AND THAT IS THE WHOLE FINDING OF THIS SECTION.** A single fitted
slope over the binned medians gives 116 Elo per doubling with a maximum bin deviation of 71 Elo – a
decent *average* and a bad *description*. The local slope, in Elo per doubling:

| segment | #1→#13 | #13→#58 | #58→#152 | #152→#402 | #402→#1060 |
|---------|--------|---------|----------|-----------|------------|
| Elo/doubling | ~79 | ~62 | ~123 | ~180 | ~117 |

**Shallow over the top fifty, steepest through #150–#400, shallow again in the tail.** That is why the
two instruments agree on an average and diverge at the head, and it is why a constant slope cannot be
the answer.

**⚠ THE RESIDUAL SPREAD IS EVIDENCE IN ITS OWN RIGHT, and it is the owner's «шансы выиграть должны
быть у всех».** Two players at the same rank differ by 50–120 Elo of Elo rating. Integrating that
spread raises every upset cell by 1–3 points and is the honest form of the question "a player ranked
#50 against a player ranked #300", as opposed to "the median of #50 against the median of #300". Both
columns are given in §3. ⚠ Part of this spread is genuine skill variation and part is Elo and the WTA
ranking simply disagreeing (the report publishes a "Log diff" column for exactly that) – **we cannot
separate the two**, so it is reported as a band and never used as a single number.

**⚠ Two limits still apply, unchanged.** The report's population is **selected** – at least 10 matches
at tour level, qualifying or ITF $50K+ inside 52 weeks – so it is not the circuit at large; and it
**thins out past about #650** (7 players in the last bin), so everything below that is the curve
*continued* rather than observed.

## 3. THE TABLE – upset rate by ranking gap `[I]` throughout

Share of matches the **lower-ranked** player wins. **The LIVE columns are the target** – the owner's
ruling, §2c. Route A (K&M 1992–95) is kept beside them as the second instrument and the era contrast,
and is explicitly NOT what we aim at. **All three are model output; none is a frequency count.**

*"live curve" = the binned-median curve of §2c. "live + spread" additionally integrates the residual
sd, i.e. asks "a player ranked r1 against a player ranked r2" rather than "the median of r1 against
the median of r2". The second is the honest one and is the one our engine is measured against.*

| favourite | underdog | **live curve** | **live + spread** | K&M 1992–95 |
|-----------|----------|----------------|-------------------|-------------|
| #1 | #10 | 23.9% | **24.7%** | 8.5% |
| #1 | #50 | 9.0% | **9.4%** | 1.7% |
| #1 | #100 | 5.6% | **6.0%** | 0.9% |
| #10 | #50 | 23.9% | **25.0%** | 16.0% |
| #10 | #100 | 15.8% | **17.2%** | 8.5% |
| **#50** | **#100** | 37.3% | **38.0%** | 32.8% |
| #50 | #150 | 25.5% | **26.9%** | 24.4% |
| **#50** | **#200** | 18.2% | **19.9%** | 19.3% |
| **#50** | **#300** | 10.9% | **12.5%** | 13.6% |
| #50 | #500 | 6.4% | **7.7%** | 8.5% |
| #100 | #200 | 27.2% | **28.9%** | 32.8% |
| #100 | #300 | 17.0% | **19.2%** | 24.4% |
| **#200** | **#300** | 35.4% | **37.2%** | 39.7% |
| #200 | #500 | 23.5% | **26.3%** | 28.0% |
| #300 | #600 | 33.2% | **35.7%** | 32.8% |
| #500 | #1000 | 33.5% | **35.9%** | 32.8% |

**The owner's own question, answered: a #300 beating a #50 happens about one time in eight** – 10.9%
on the curve, 12.5% once the spread inside a rank is allowed for. His instinct («вероятность такого
довольно мала») is right, and his tolerance («это спорт, всякое случается») is also right: it is not a
freak event, it is roughly one match per round of a 16-draw.

**⚠ WHERE THE TWO INSTRUMENTS AGREE AND WHERE THEY DO NOT, because it is diagnosable rather than
mysterious.** Through the middle and the tail they are close – #50 v #200 (19.9 against 19.3), #50 v
#300 (12.5 / 13.6), #200 v #300 (37.2 / 39.7). **They diverge at the HEAD**: #1 v #10 is 24.7% live
against 8.5% in 1992–95. That is precisely the "1990s dominance" the owner refused, and it is the one
place where using K&M would have been an error rather than a conservatism.

**⚠ THE DEEP TAIL IS UNSOURCED AND THE MODEL IS EXTRAPOLATING.** Rows below #300 come from Route A
alone, i.e. from a logistic fitted on Wimbledon main draws – a population containing no #500 and no
#1000. `[?]` **The ITF women's circuit, which is where our game's ladder actually lives, has no
published upset statistics at all.** The rows below #300 should be read as "the model, continued",
not as evidence.

`[WEAK]` One further data point, listed only so the next reader does not spend the budget again:
[rahosbach (2018)](https://rahosbach.github.io/2018-07-14-TennisUpsets/), on Sackmann data 1968–2018,
Masters and Slams only, gives ~20% upsets at a ≥5-rank gap and ~15% at ≥25. The figures were read off
charts, they pool ATP and WTA, and the thresholds are cumulative rather than gap-conditional. **Not
usable for calibration.**

---

## 4. A STRUCTURAL FINDING WORTH MORE THAN A NUMBER

`[S-10]` Kovalchik, *Searching for the GOAT of tennis win prediction*
([free PDF](https://vuir.vu.edu.au/34652/1/jqas-2015-0059.pdf)) benchmarks eleven models on the
**2014 ATP season, 2,395 matches – men only**, so none of its numbers transfer. Its *structural*
result does: every one of the eleven models was **10–20 percentage points less accurate for
lower-ranked players** than for top players.

`[I]` That says the sport's own predictability is **not constant down the table** – deep ranks are
genuinely noisier – and it is independently corroborated by Route B flattening out below #200
(§2c limit (c)). A simulation that applies one clean law from #1 to #1600 will be **too predictable
in the tail**, and that is a known, sourced direction of error rather than a surprise.

---

## 5. WHAT WE COULD NOT SOURCE – no numbers given

1. `[?]` **Any published empirical WTA table of win% bucketed by rank gap.** Searched hard; it does
   not appear to exist in public form.
2. `[?]` **ITF women's circuit upset rates at any gap.** Nothing at all. This is the population our
   W rungs model.
3. `[?]` **"WTA top five won 79%, 6–10 won 69%, 11–20 won 64% since 1984."** Search engines
   repeatedly attribute this to Tennis Abstract. The cited post was downloaded in full and grepped:
   **the numbers are not in it.** This is a search-engine confabulation. **Do not use it**, and if it
   turns up in a future draft of any document here, this line is why it was removed.
4. `[?]` **Del Corral & Prieto-Rodríguez (2010)**, *Are differences in ranks good predictors for
   Grand Slam tennis matches?* –
   [paywalled](https://www.sciencedirect.com/science/article/abs/pii/S0169207009002076). The widely
   quoted "15% jump for #1 vs #11 against 2% for #51 vs #61" appears in secondary summaries **with no
   clear sex attribution**, so it is withheld rather than risk printing an ATP figure as a WTA one.
5. `[?]` Boulier & Stekler (1999); Scheibehenne & Bröder – not reached.

### 5a. The one follow-up that would upgrade this file

`[S]` Verified today: `github.com/JeffSackmann/tennis_wta` and `/tennis_atp` return **404**;
[`huggingface.co/datasets/Aneeshers/tennis-sackmann-archive`](https://huggingface.co/datasets/Aneeshers/tennis-sackmann-archive)
returns **200**. That mirror carries `winner_rank` and `loser_rank` per match, so the empirical table
§5.1 says does not exist **could be computed** from it – turning the two best cells of §3 from `[I]`
into `[S]`, and giving the deep tail its first real evidence. Not done here: it is a download and a
data job, and it wants the owner's word first, both on the effort and on the licence question that
`03-match-engine-math.md` already flags for the Match Charting Project.

---

## 6. What this file is for

`docs/specs/the-skill-gap-2026-08.md` measures our own engine against §3 and proposes what would
close the gap. **This document supplies the target and nothing else** – it takes no position on our
constants, and it must not be cited as evidence for one of our own numbers.
