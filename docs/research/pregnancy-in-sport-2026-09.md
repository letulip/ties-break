---
type: research
status: current
area: life
canonical: false
last-reviewed: 2026-09-22
---

# Pregnancy in sport – how long they train, how long they compete, and how often a pregnancy is lost

Compiled 22.09.2026 on his ask: «сделай ресерч пожалуйста, как раз долга не будет». It answers the
two debts named in
[the-months-before-she-says-2026-09.md](../design/the-months-before-she-says-2026-09.md) §6 so that
document has no unsourced numbers in it. Primary sources throughout; every secondary or press figure
is flagged. **Nothing here changes game logic** – §5 is a comparison against our shipped constants
and §6 is a proposal.

## 0. The headline

1. **Competing stops after the first trimester; training does not stop at all.** Elite runners were
   still doing 300–350 minutes a week in the third trimester. Our own «she plays on» window is in
   the right place.
2. **The hidden window is real and can be long.** The clearest tennis case announced at **20 weeks**,
   having won a Grand Slam at eight or nine.
3. **Miscarriage risk is a J-curve in age, and our pregnancy window sits across its floor and its
   climb**: 9.8% at 25–29, 10.8% at 30–34, **16.7% at 35–39**. A flat rate would be wrong at both
   ends of the game's own 24–38.
4. ⚠ And the fourth is the one that matters most for design: **nothing in the sources supports
   training as a cause of loss.** The risk is dominated by age.

## 1. Miscarriage by maternal age – the primary table

**Magnus MC et al., «Role of maternal age and pregnancy history in risk of miscarriage: prospective
register based study», BMJ 2019** – [PMC6425455](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC6425455/).
**421,201 pregnancies, Norway, 2009–2013**, register-based and prospective. Miscarriage defined as
fetal death before 20 gestational weeks with a birthweight under 500 g, identified between 6 and 20
weeks where possible.

| maternal age | risk of miscarriage |
| --- | ---: |
| under 20 | 15.8% |
| 20–24 | 11.3% |
| **25–29** | **9.8%** (the floor; lowest single year is 27, at 9.5%) |
| 30–34 | 10.8% |
| **35–39** | **16.7%** |
| 40–44 | 32.2% |
| 45+ | 53.6% |

⚠ **Read the denominator before using this number.** It counts RECOGNISED pregnancies from about six
weeks. Losses before a pregnancy is known are not in it, which is why population figures for «all
conceptions» run higher; for a game whose pregnancy begins when the girl knows about it, the
recognised-pregnancy rate is the right one.

⭐ A second prospective cohort agrees on the shape – the Generation R study in Rotterdam, 3,604 women
followed from preconception, found 12.7% of recognised pregnancies ending in miscarriage and odds
**2.03×** at 35–39.9 and **4.24×** at 40+ against the 30–34.9 band
([Springer, BMC Medicine 2025](https://link.springer.com/article/10.1186/s12916-025-04462-8)).

## 2. Training through a pregnancy – the elite evidence

**Darroch F, Stellingwerff T et al., «Effect of Pregnancy in 42 Elite to World-Class Runners on
Training and Performance Outcomes», Medicine & Science in Sports & Exercise, 2023** –
[PubMed 35975937](https://pubmed.ncbi.nlm.nih.gov/35975937/), summarised by the American College of
Sports Medicine [here](https://acsm.org/running-for-two-pregnancy-training-and-return-to-performance-for-elite-to-world-class-runners/).
Over half the cohort had competed at an Olympics or World Championships.

* Running volume fell from **63 ± 34 km/week in the first trimester to 30 ± 30 km/week in the third**.
* Even in the third trimester they trained **300–350 minutes a week**, mostly cross-training –
  **two to four times** the general-population guideline.
* **Return**: exercise resumed at about **six weeks postpartum**, and **80% of pre-pregnancy training
  volume by three months**.
* **Performance**: of those who intended to return to their old level (60% of the cohort), there was
  **no significant difference** between pre- and post-pregnancy performance, and **46% were faster
  afterwards**.

**The IOC expert group, Lausanne, 2016/2017** (five-part evidence summary, e.g.
[Part 1](https://stillmed.olympics.com/media/Documents/Athletes/Medical-Scientific/Consensus-Statements/2016_Exercise-pregnancy-recreational-elite-athletes-part-1.pdf)):
training through the first trimester is supported even in sports with a fall risk; full-contact sport
is the exception; side effects become more likely after **28 weeks**. The group states plainly that
how long and how hard an ELITE athlete may train is an open question rather than a settled one.

**Rowers, 224 recreational and elite** ([PMC5624563](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC5624563/)):
85.2% exercised during a pregnancy, and the share meeting or exceeding national guidelines fell
**51.3% → 42.4% → 15.7%** across the three trimesters. ⚠ Recreational and elite are pooled in that
figure.

⭐ **Competition is the thing that stops, not training.** The runners' study reports most athletes
ceasing COMPETITION after the first trimester, for physical change and risk aversion – which is a
different decision from stopping work, and it is the one our calendar models.

## 3. The tennis anchor, and the hidden window

Serena Williams won the **2017 Australian Open at eight or nine weeks pregnant** and announced the
pregnancy publicly at **20 weeks**, about twelve weeks later
([Newsweek](https://www.newsweek.com/serena-williams-pregnancy-2017-australian-open-586582),
[Washington Post](https://www.washingtonpost.com/news/early-lead/wp/2017/04/26/serena-williams-says-she-was-nervous-to-play-in-australian-open-while-pregnant/)).
⚠ Press reporting, not a study, and the eight-versus-nine weeks differs between tellings – carried
because it is the sport's own clearest documented case and the two halves of it are exactly the two
things the design document asks about.

**What it establishes**: a Grand Slam can be WON inside the first trimester, and the gap between
knowing and telling can be **months** rather than weeks.

## 4. ⚠⚠ Training as a cause of loss – what the sources actually say

Nothing found in this pass supports it, and the evidence points the other way:

* the IOC summary's concern is contact and falls, and specifically licenses first-trimester training
  in sports carrying a fall risk;
* the elite cohorts above trained at two to four times guideline volumes and the papers report
  performance outcomes, not loss rates attributable to training;
* the age table in §1 dominates the variance, and early loss is overwhelmingly chromosomal.

⭐ **So the design document's refusal is a finding of this research rather than a scruple of its
author**, and that is why this file exists before any of that is built.

## 5. Our own numbers, against the above

| ours | value | how it reads against the sources |
| --- | --- | --- |
| `playsOnWeeks` | 8 | she keeps entering for 8 weeks after the announcement. With the pause at pregnancy week ~8 (the constant's own note), her last event is inside the **first trimester** – ✅ exactly where the runners' study puts the end of competition |
| `termWeeks` | 31 | 8 + 31 = **39 weeks announcement → birth**, i.e. the announcement is read as week 0 of the pregnancy |
| `perWeekByAge` | 2–4%/yr over 24–35 | the age window is the digest's; §1 says nothing about it – it is a FERTILITY-and-choice curve, not a risk curve |
| no loss mechanic | – | §1 says a career in our window would lose roughly **one pregnancy in ten**, rising past 35 |

⚠⚠ **AND THE ONE REAL FINDING FOR THE ENGINE, which this research paid for.** `termWeeks: 31` puts
conception AT the announcement. That is already flagged in the constant's own note as «one word
loose», and §3 shows how loose: in life, and in the sport's clearest case, the announcement comes
**weeks or months after** the girl knows. So **if the hidden window is ever built, `termWeeks` must
shrink by exactly what the window adds**, or her pregnancy becomes 43–47 weeks long. The two
constants are one number and must move together.

## 6. What this suggests, if he ever rules the loss in

* **Rate by age from §1**, not a flat number: 10% across the twenties, ~11% at 30–34, ~17% at 35–39.
  Our window closes at 38, so the 40+ rungs never fire.
* **Weighted by nothing else.** No training term, no travel term, no support term. The parent's
  reaction prices the aftermath, which is the layer's own law.
* **Inside the hidden window it is invisible**: a loss before she has said anything reaches the
  parent only if she chooses to tell him – which is the truest thing in this whole file, and the
  hardest to write well.
