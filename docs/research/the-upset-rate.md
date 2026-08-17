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

### 2c. The live Elo table – an independent second route

`[S-8]` [Tennis Abstract WTA Elo report](https://tennisabstract.com/reports/wta_elo_ratings.html),
list of **2026-08-03**, 556 players. Published mapping on the same page:

> "A 100-point difference in Elo ratings implies that the favorite has a 64% chance"

`[S-9]` and the report's own scale: Elo gap **100 → 64% · 200 → 76% · 300 → 85% · 400 → 91% ·
500 → 95%** (best-of-three).

`[I]` **Elo by rank**, median within ±12 of each rank, computed by us from the report's raw HTML:

| rank | 1 | 10 | 25 | 50 | 100 | 150 | 200 | 250 | 300 |
|------|---|----|----|----|-----|-----|-----|-----|-----|
| Elo  | 2058 | 1999 | 1879 | 1786 | 1709 | 1617 | 1550 | 1432 | 1429 |

⚠ **Three limits, all load-bearing.** (a) The smoothing is ours, so the table is `[I]`, not `[S]`;
the actual #1 (Sabalenka) is **2209.4**, and the ±12 window pulls the top row down by 150 points –
which is why the #1 row of §3 is the least trustworthy in the file. (b) The report's population is
**selected**: at least 10 matches at tour level, qualifying or ITF $50K+ inside 52 weeks. It is not
the circuit at large. (c) It **cannot resolve anything past about #300** – our parse gives #250 = 1432
and #300 = 1429, indistinguishable. Rows past #300 are therefore **absent from §3, not zero**.

`[I]` **The two routes agree on the constant.** Fitting a straight line to the Elo table over
#10–#300 gives **116 Elo per doubling**; over #25–#300, **125**; over #50–#300, **138**. Klaassen &
Magnus give **124.2**. Two entirely independent instruments – a 1990s Wimbledon logit and a 2026 Elo
list – land within about 10% of each other, and that convergence is the strongest thing in this file.

---

## 3. THE TABLE – upset rate by ranking gap `[I]` throughout

Share of matches the **lower-ranked** player wins. Route A = `[S-7]` evaluated. Route B = `[I]` Elo
table through `[S-9]`'s mapping. **Both are model output, neither is a frequency count.**

| favourite | underdog | Route A (K&M) | Route B (Elo) | verdict |
|-----------|----------|---------------|---------------|---------|
| #1 | #10 | 8.5% | 41.6% | `[?]` **routes disagree – do not use** |
| #1 | #50 | 1.7% | 17.3% | `[?]` **routes disagree – do not use** |
| #1 | #100 | 0.9% | 11.8% | `[WEAK]` somewhere around 5–12% |
| #10 | #50 | 16.0% | 22.7% | `[I]` ~16–23% |
| #10 | #100 | 8.5% | 15.9% | `[I]` ~9–16% |
| **#50** | **#100** | **32.8%** | **39.1%** | `[I]` **~33–39%** |
| #50 | #150 | 24.4% | 27.4% | `[I]` ~24–27% |
| **#50** | **#200** | **19.3%** | **20.4%** | `[I]` **~19–20%, routes agree** |
| **#50** | **#300** | **13.6%** | **11.4%** | `[I]` **~11–14%, routes agree** |
| #50 | #500 | 8.5% | – | `[I]` ~9%, single route |
| #100 | #200 | 32.8% | 28.6% | `[I]` ~29–33% |
| #100 | #300 | 24.4% | 16.6% | `[I]` ~17–24% |
| #200 | #300 | 39.7% | 33.3% | `[I]` ~33–40% |
| #200 | #500 | 28.0% | – | `[I]` ~28%, single route |
| #500 | #1000 | 32.8% | – | `[I]` ~33%, single route |

**The owner's own question, answered: a #300 beating a #50 happens about one time in eight** – call
it 11–14%, and it is the row where the two independent routes agree most closely. His instinct
("вероятность такого довольно мала") is right, and his tolerance ("это спорт, всякое случается") is
also right: it is not a freak event, it is roughly one match per round of a 16-draw.

**⚠ WHERE THE ROUTES DISAGREE, WE GIVE NO NUMBER.** The #1 rows are the worst case and the reason is
diagnosable rather than mysterious: Route A's λ was fitted on the most top-heavy era in the women's
game, and Route B's #1 row is depressed ~150 Elo by our own smoothing window. Using Sabalenka's
actual 2209 instead of the smoothed 2058 moves #1 vs #100 from 11.8% to about 5%. **We do not pick
between them.** Anyone who needs the head of the table should compute it from the unsmoothed Elo list.

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
