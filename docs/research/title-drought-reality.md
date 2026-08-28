---
type: research
status: current
area: simulation-and-balance
canonical: false
last-reviewed: 2026-08-28
---

# How often does a real woman go a season without a title?

**The calibration target for the drought measurement in `measure/drought-2026-08`.** The owner's
question, verbatim: *«сезонов без единого титула 23.9% и всё вот это остальное – это ок для мира
тенниса вообще или нет? я пытаюсь откалибровать нашу систему просто еще одним способом.»*

**Every number below is tagged.** `[S]` = stated in the cited source. `[I]` = inferred or computed
here from sourced inputs, with the arithmetic shown. `[GAP]` = looked for and not found; a stated
gap is worth more than a plausible invention. Sources are linked at first use.

⚠ **Our ladder runs `local · regional · national · j30 · j60 · j300 · w15 · w35 · w50 · w75 · w100 ·
wta125 · wta250 · wta500 · wta1000 · slam`, so "a title" spans the ITF World Tennis Tour up to the
Slams.** Every real figure on this page is matched to that span: a singles title at **any** level
from W15 to a Grand Slam counts, and doubles never does. A comparison against WTA main-tour titles
alone would answer a different question.

> **THE THREE ANSWERS, IN ONE PARAGRAPH.**
> **(1) A title-less season is the NORMAL season, everywhere on the real ladder.** Of the forty women
> who finished 2024 ranked **#81–120**, twenty-one – **52.5%** – won no singles title at any level
> that year. Of the fifty who finished 2024 in the **top 50**, twenty-five – **exactly 50.0%** – won
> no singles title either. Across all ~1,550 ranked women the figure is nearer **80%**.
> **(2) Reality is a PLATEAU and ours is a TROUGH.** The real title-less rate is flat at ~50% from
> #1 to #120; ours reads 15.3% in the top 50 and 66.1% at #81–120. The band is not where our defect
> lives – it is the one row that is nearly right. **The top-50 row is off by 35 points.**
> **(3) The mechanism is a rule we do not model.** ITF's own play-down rule: *"Players with a WTA
> ranking of 1-50 in Singles … cannot Enter, accept a Wild Card and/or compete in Singles or Doubles
> in any Women's ITF World Tennis Tour Tournaments."* A real top-50 woman is locked out of **the
> entire ITF ladder, W15 through W100.** She has ~56 titles a year to chase and half of her peers go
> home empty. If our top-50 player can still enter w75/w100, that alone is the 35 points.

---

## 1. THE COMPARISON TABLE

Ours from the 90-career × 4-arm run in `measure/drought-2026-08`. Real from the censuses in §2–§5.

| row | ours | real | tag | verdict |
| --- | --- | --- | --- | --- |
| complete seasons carrying no title at any rung | **23.9%** [22.2–25.7] | **≥50%** in every band that can be counted; **~80%** across all ranked women | `[I]` from `[S]` | **too low, by about half** |
| seasons with no title, **year-end top 50** | **15.3%** | **50.0%** – 25 of 50, year-end 2024 | `[S]`/`[I]`, exact | **WRONG, ~35pp too generous** |
| seasons with no title, **ranks #81–120** | **66.1%** | **52.5%** – 21 of 40, year-end 2024 | `[S]`/`[I]`, exact | **~14pp too harsh, inside the census's own noise** |
| events entered at #81–120 | **~23** | **23**/yr for the #51–100 band | `[S]` ITF | **right** |
| careers ever running 1 / 2 / 3 title-less seasons | **95.6 / 85.6 / 53.3%** | **100 / 92 / 62%** (13 real careers) | `[I]` from `[S]` | **right** |
| longest title-less run per career | median **3**, p90 4, max **6** | median **3**, max **7** (13 real careers) | `[I]` from `[S]` | **right** |
| consecutive seasons with no title at **w75+** | median **6**, p90 9 | runs of **5–11** are routine; some careers never win one | `[I]` from `[S]` | **right, if anything slightly short** |
| share of an adult's titles at the **bottom two rungs she plays** | **81.8%** | career median **~65%** (range 43–86%); cross-section **90.9%** at WTA 125 or below | `[I]` from `[S]` | **directionally right, ~15pp too concentrated** |
| title-less rate at **14–17** | **9.2%** | – | `[GAP]` | **unverifiable, see §6** |
| title-less rate at **18–29** | **15–18%** | **~50%** for a top-120 woman | `[S]`/`[I]` | **too low, by about three times** |
| title-less rate at **30+** | **42%** | – | `[GAP]`; nearest measured band is 50% | **plausible – the only age row that lands** |

---

## 2. THE POPULATION ARITHMETIC – the ceiling nobody can beat

A tournament has exactly one singles champion, so the number of titles in a year is the number of
tournaments, and it is small against the number of women chasing them.

| quantity | 2024 | tag |
| --- | --- | --- |
| ITF Women's World Tennis Tour tournaments | **~500**, across 65 countries, five prize-money levels | `[S]` ([Wikipedia, 2024 season](https://en.wikipedia.org/wiki/2024_ITF_Women%27s_World_Tennis_Tour); same sentence on the [2025 page](https://en.wikipedia.org/wiki/2025_ITF_Women%27s_World_Tennis_Tour)) |
| WTA Tour singles titles | **59**, from 58 tournaments | `[S]` ([2024 WTA Tour](https://en.wikipedia.org/wiki/2024_WTA_Tour), "Titles won by player") |
| WTA 125 tournaments | **36** | `[S]` ([2024 WTA 125 tournaments](https://en.wikipedia.org/wiki/2024_WTA_125_tournaments)) |
| **total singles titles available** | **~595** | `[I]` |
| women holding a WTA singles ranking | **~1,550** | `[I]`, carried from `real-ladder-pace.md` §3b |

> `[I]` **THE CEILING. 595 titles ÷ ~1,550 ranked women = 38.4%, and that assumes every single title
> goes to a different woman. So AT LEAST 61.6% of ranked women win nothing in a year, before a single
> repeat champion is counted.**

And repeat champions are the rule, not the exception. Two measured multiplicities `[I]` from `[S]`:

* **WTA level, 2024: 59 titles among ~32 distinct champions = 1.84 titles each** – Świątek 5,
  Sabalenka 4, Shnaider 4, Zheng 3, Rybakina 3, six women on 2, the rest on 1 `[S]`.
* **The #81–120 cohort of §3: 44 titles among 19 champions = 2.32 each** `[I]`.

> `[I]` At a circuit-wide multiplicity of ~2.0 the ~595 titles are shared by **~300 women**, which is
> **19% of the ranked population**. **So roughly four ranked women in five go a season without
> winning anything.** That is the outer figure. Our careers are funded, coached and managed – the
> favourable tail – so the fair comparators are the two band censuses below, not this one.

⚠ `[GAP]` **Nobody publishes the number of distinct ITF singles champions in a year.** The Wikipedia
season pages carry a per-player title table but it merges singles and doubles across five levels and
does not total the distinct singles column; the ITF publishes no equivalent. The multiplicity above
is measured on two sub-populations and extrapolated, and it is stated as an extrapolation.

---

## 3. THE #81–120 BAND – a complete census, not a sample

**The decision-relevant row, so it is counted exhaustively rather than sampled.** Cohort: every
player at positions **81–120 of the year-end 2024 WTA singles ranking**
([ESPN year-end 2024 table](https://www.espn.com/tennis/rankings/_/type/wta/season/2024)) `[S]`.
For each, every singles title won in 2024 at any level, from the ITF Circuit / WTA 125 / WTA Tour
singles finals tables on her Wikipedia page, Result = Winner rows only, doubles excluded `[S]`;
the aggregation is `[I]`.

**Won at least one singles title in 2024 – 19 of 40:**

| # | player | titles |
| --- | --- | --- |
| 82 | Alycia Parks | WTA 125 ×3 |
| 84 | Sonay Kartal | W35 ×5, W100, WTA 250 |
| 86 | Tatjana Maria | WTA 125 |
| 87 | Suzan Lamens | W75, WTA 125, WTA 250 |
| 88 | Zeynep Sönmez | WTA 250 |
| 90 | Viktorija Golubic | WTA 250, WTA 125 |
| 91 | Nuria Párrizas Díaz | W100 ×2, WTA 125 |
| 93 | Anna Bondár | W75 ×2, WTA 125 |
| 94 | María Lourdes Carlé | WTA 125 |
| 96 | Ann Li | WTA 125 |
| 100 | Nadia Podoroska | WTA 125 ×3 |
| 102 | Rebecca Marino | W100 ×2, W75, WTA 125 |
| 109 | Ajla Tomljanović | WTA 125 |
| 110 | Anna Karolína Schmiedlová | WTA 125 |
| 111 | Océane Dodin | W60 ×2 |
| 112 | Anastasia Zakharova | W100 ×2, W50 |
| 116 | Maya Joint | W75, W35 |
| 118 | Anca Todoni | WTA 125 ×2 |
| 119 | Darja Semeņistaja | WTA 125 |

**Won nothing in 2024 – 21 of 40:** Kenin (81), Erika Andreeva (83), Cristian (85), Niemeier (89),
Baptiste (92), Minnen (95), Gadecki (97), Wang Xiyu (98), Burel (99), Starodubtseva (101), Bucșa
(103), Dart (104), Errani (105), Sorribes Tormo (106), Kudermetova (107), Saville (108), Birrell
(113), Bogdan (114), Tsurenko (115), Montgomery (117), Zhu Lin (120).

> **21 / 40 = 52.5% title-less.** `[I]` 95% CI **[37.0%, 68.0%]**. **Ours reads 66.1%: about 14
> points too harsh, and it sits at the top edge of the census's own interval rather than outside it.**

**A second, independent year on the same forty women** – their 2025 titles, same method `[S]`/`[I]`:
fifteen won something (Erika Andreeva W75 ×2, Cristian, Maria, Golubic, Párrizas Díaz, Bondár,
Minnen, Ann Li, Wang Xiyu, Dart, Zakharova, Birrell, Joint, Todoni, Semeņistaja), **twenty-five did
not = 62.5%**. That season spreads the cohort from the top 40 to past #200, so it is not a band
figure – it is the honest answer to "a cohort of near-top-100 women, one year later". Both years
together: **46 title-less seasons out of 80 = 57.5%.**

⚠ **THE BAND IS A TURNSTILE, NOT AN ADDRESS, AND THAT IS THE REAL LESSON HERE.** The nineteen
champions split into two kinds. **Climbers** who won at rungs far below the band on the way up –
Kartal took five W35s while still outside #150, Joint a W35 and a W75, Zakharova a W50 – and
**fallers** who won nothing on the way down: Sorribes Tormo, Errani, Zhu Lin, Kenin and Saville all
entered 2024 ranked well inside the band's ceiling and left it empty-handed. A real #81–120 season is
mostly *transit*. If our sim treats the band as a place a career sits, the trough is an artefact of
residence rather than of difficulty.

### 3a. And the same census for the top 50, which is where the real defect is

Same year, same method. Cohort: positions **1–50 of the year-end 2024 WTA ranking** `[S]`.
Champion list: the 2024 WTA Tour "Titles won by player" table `[S]`, plus Yuan Yue, named in the same
page's first-title list `[S]`.

Twenty-five of the fifty won a WTA singles title in 2024: Sabalenka, Świątek, Gauff, Zheng, Rybakina,
Pegula, Navarro, Kasatkina, Krejčíková, Collins, Shnaider, Ostapenko, Mirra Andreeva, Haddad Maia,
Keys, Boulter, Fręch, Nosková, Samsonova, Putintseva, Linette, Plíšková, Šramková, Stearns, Yuan Yue.

Twenty-five did not, including **Paolini (4), Badosa (12), Kalinskaya (14), Kostyuk (18), Vekic (19),
Azarenka (20), Muchova (22), Svitolina (23), Alexandrova (28), Pavlyuchenkova (30), Fernandez (31),
Sakkari (32), Yastremska (33), Mertens (34), Anisimova (36), Vondroušová (39), Jabeur (42), Bouzková
(44), Siniaková (45), Garcia (48), Tauson (50)** and four more.

> **25 / 50 = exactly 50.0% of the year-end 2024 top 50 won no singles title that season.** `[I]`
> A top-50 woman is barred from every ITF event (§5), so the only correction is the rare WTA 125 a
> top-50 player enters: **the true figure is 46–50%.** **Ours reads 15.3%.**

⚠ **The world No. 4 went title-less.** Jasmine Paolini reached two Grand Slam finals in 2024 and won
no singles title. That is not an anomaly the model should smooth away – it is the ordinary shape of a
season in which fifty-nine titles are divided among a thousand-odd professionals.

`[GAP]` **The #51–80 band is not counted here.** It needs its own thirty-player census and the two
bands either side of it – 50.0% and 52.5% – bracket it tightly enough that the estimate would add
nothing the verdict does not already have.

---

## 4. THE CAREER DROUGHTS – and this is the row we get right

A longitudinal panel of **13 real careers**, chosen for length and for having complete ITF and WTA
singles finals tables: Korpatsch, Hibino, Tomova, Kučová, Baindl, Dart, Masarova, Volynets, Udvardy,
Fręch, Blinkova, Gracheva, Zakharova. Season spans and title years from the finals tables `[S]`;
runs computed here `[I]`.

| career | seasons | title years | longest title-less run |
| --- | --- | --- | --- |
| Kateryna Baindl | 2012–2024 | 2012, 2014, 2017 | **7** (2018–2024) |
| Lesia Tsurenko | 2009–2026 | last title 2018 | **7+** (2019–) |
| Varvara Gracheva | 2017–2025 | 2017, 2018, 2019 | **6** (2020–2025) |
| Harriet Dart | 2014–2025 | 2014, 2018, 2023, 2025 | **4** (2019–2022) |
| Kristína Kučová | 2007–2021 | 2007, 2010, 2012–2015, 2019, 2020 | **3** (2016–2018) |
| Rebeka Masarova | 2016–2025 | 2018, 2019, 2021, 2022 | **3** (2023–2025) |
| Nao Hibino | 2012–2025 | 2012, 2013, 2015, 2018, 2019, 2023 | **3** (2020–2022) |
| Anna Blinkova | 2016–2025 | 2016, 2018, 2022, 2024, 2025 | **3** (2019–2021) |
| Panna Udvardy | 2016–2025 | 2016, 2017, 2021, 2022, 2025 | **3** (2018–2020) |
| Magdalena Fręch | 2014–2025 | 2016, 2017, 2020, 2021, 2023, 2024 | **2** |
| Tamara Korpatsch | 2013–2026 | 2015–2019, 2022, 2023, 2025, 2026 | **2** |
| Katie Volynets | 2019–2025 | 2021, 2022, 2024 | **2** |
| Anastasia Zakharova | 2019–2025 | 2019, 2020, 2022–2025 | **1** |

> **Real: median longest run 3, maximum 7. Ours: median 3, p90 4, maximum 6.** `[I]`
> **Ever ran 1 / 2 / 3 consecutive title-less seasons: 100% / 92% / 62% real against ours at
> 95.6% / 85.6% / 53.3%.** Every one of those pairs is within the noise of a 13-career panel.
> **This block of the distribution is true to the sport.** If anything our tail is one season short:
> a seven-year drought that ends in a career-high ranking – Baindl's, Tsurenko's – has no counterpart
> in a model whose worst case is six.

**The w75-and-above drought is longer in reality than ours, not shorter.** Ours: median 6 consecutive
seasons with no title at w75+, p90 9. Real, from the same panel `[I]`: Dart's first W75-or-better
title arrived in **2025, her twelfth season**; Kučová's only one in fifteen seasons was a WTA 125;
Masarova and Gracheva have never won above W60 in ten and nine seasons; Korpatsch went five seasons
before her first W80 and three more after it. **A decade without a title at that height is an
ordinary career, so a p90 of 9 is if anything generous.**

---

## 5. WHERE A REAL PROFESSIONAL'S TITLES COME FROM

### 5a. The rule that decides it, quoted from the source

**2024 Women's and Men's ITF World Tennis Tour Regulations, Summary of Key Rule Changes** (version
05 March 2024), Section III, item **7. WTA Play-Down Rules**
([ITF PDF](https://www.itftennis.com/media/11482/2024-wtt-summary-of-rule-changes.pdf)) `[S]`,
verbatim, both clauses:

> *"Players with a WTA ranking of 1-50 in Singles twenty-one (21) days prior to the Monday of the
> Tournament Week cannot Enter, accept a Wild Card and/or compete in Singles or Doubles in any
> Women's ITF World Tennis Tour Tournaments."*
>
> *"Players with a WTA ranking of 1-150 in Singles twenty-one (21) days prior to the Monday of the
> Tournament Week cannot Enter, accept a Wild Card and/or compete in Singles or Doubles in any
> Women's ITF World Tennis Tour W15 or W35 Tournaments."*

⚠⚠ **THIS CORRECTS `real-ladder-pace.md` §4, WHICH CARRIES ONLY THE SECOND CLAUSE.** That page states
the real `tierOutgrown` as *"a hard rank cut at #150"* for W15/W35. There are **two** cuts, and the
first is far stronger: **at #50 the whole ITF ladder closes, W15 through W100.** A real top-50 woman
cannot win a W100. Her entire title supply is WTA 125 and above.

`[I]` **What that leaves her: 56 titles a year** (4 Slams + 10 WTA 1000 + 17 WTA 500 + 23 WTA 250 +
Finals + Olympics, from the 2024 WTA Tour calendar `[S]`; the season's titles-by-player table totals
59, the difference being the team events it also counts), contested by everyone from #1 to roughly
#200, since a #150 player still enters WTA 250 qualifying. **Fifty-six titles, and the top fifty
alone cannot fill them: exactly half of that fifty went home with none.** The same PDF's Appendix K confirms the winner's points that name
each rung – W15 = 15, W35 = 35, W50 = 50, W75 = 75, W100 = 100 `[S]`, the chart behind
`real-ladder-pace.md` §4 correction 2.

### 5b. The cross-section – where the #81–120 cohort's 44 titles were actually won

`[I]` from the §3 census. W60 is folded into w75: the 2024 restructure renamed W25/W40/W60 to
W35/W50/W75 and Wikipedia still prints some 2024 events under the old label.

| rung | titles | share |
| --- | --- | --- |
| w35 | 6 | 13.6% |
| w50 | 1 | 2.3% |
| w75 (incl. W60) | 7 | 15.9% |
| w100 | 7 | 15.9% |
| **wta125** | **19** | **43.2%** |
| wta250 | 4 | 9.1% |
| wta500 and above | **0** | **0%** |

> **90.9% of a #81–120 woman's titles are won at WTA 125 or below – below the level she competes at
> on the main tour – and not one came from a WTA 500 or higher.** `[I]` **So the SHAPE our 81.8% is
> describing is real and if anything understated.** The single busiest rung is wta125, which is the
> rung directly beneath her main-tour entry point.

### 5c. The career view – the reading our 81.8% is closest to

If "the bottom two rungs she plays" means the two lowest tiers a career ever entered as an adult,
the panel of §4 gives `[I]` from `[S]` finals tables:

| career | titles at her two lowest adult rungs | of total |
| --- | --- | --- |
| Harriet Dart | 6 | 7 = **86%** |
| Kristína Kučová | 10 | 13 = **77%** |
| Anastasia Zakharova | 12 | 16 = **75%** |
| Varvara Gracheva | 5 | 7 = **71%** |
| Viktoriya Tomova | 12 | 18 = **67%** |
| Kateryna Baindl | 4 | 6 = **67%** |
| Rebeka Masarova | 4 | 6 = **67%** |
| Katie Volynets | 2 | 3 = **67%** |
| Panna Udvardy | 8 | 14 = **57%** |
| Magdalena Fręch | 4 | 8 = **50%** |
| Tamara Korpatsch | 7 | 16 = **44%** |
| Anna Blinkova | 2 | 6 = **33%** |

> **Median 67%, range 33–86%, against ours at 81.8%.** `[I]` **Ours is about fifteen points too
> concentrated at the bottom – right at the top of the real range rather than outside it.** The
> careers at the low end of the real range are the ones that broke through: Blinkova and Korpatsch
> won WTA-level titles, which move mass upward. **A model that puts 81.8% at the bottom two rungs is
> modelling a career that never breaks through.**

⚠ This row is **definition-sensitive and should be re-read before it is acted on.** "The bottom two
rungs she plays" changes value by twenty points depending on whether $10,000 and $15,000 events count
as one rung or two, and on whether junior rungs are inside the set. §5b's framing – *below her own
competitive level versus at it* – is the one that survives the ambiguity, and by that framing reality
is at **90.9%** and ours is conservative.

---

## 6. THE GAPS – stated, not filled

`[GAP]` **No published figure exists for the share of professional women who win no title in a
season.** Searched: ITF Pro Circuit / Player Pathway reviews, WTA statistics, Tennis Abstract. The
ITF's own review reaches only the adjacent question, the one `real-ladder-pace.md` §3b already
carries – of 4,862 women who played the circuit in 2013, 2,212 earned nothing – and never the title
question. **Every band figure on this page is a census run here, from ranking tables and finals
tables, not a quoted statistic.**

`[GAP]` **No source gives title-less rates by age.** Our 9.2% at 14–17 has no real counterpart at all:
a real 14–17-year-old's titles come from national junior events and the ITF Junior Circuit, and
neither publishes a per-player, per-season title census. Our 42% at 30+ likewise has none; the closest
anchor is that the two bands measured here – top 50 and #81–120 – are both at ~50% irrespective of
age. **Neither age row can be validated or refuted from public data. Do not tune against them.**

`[GAP]` **No distinct-singles-champion count for the ITF circuit** – see §2.

`[GAP]` **No cohort study of ranking-band persistence.** "Is #81–120 a place a career sits or a place
it passes through?" is answered here anecdotally, from the composition of one cohort (§3), not from a
transition-matrix study. `real-ladder-pace.md` §1b's #150 → #100 transit time (17.6 ± 23.9 months) is
the nearest published thing and it measures the step, not the residence.

⚠ **Two data-quality notes on the census itself, so the next reader does not re-derive them.**
(a) Year-end rankings differ by a few places between ESPN's table and the players' own Wikipedia
performance timelines – Dart is #104 in one and #88 in the other. The cohort is defined by the ESPN
table throughout and the disagreement moves nobody across a band edge that changes the count.
(b) Wikipedia's per-year prose summaries under-report ITF titles badly – a first pass that asked for
a year-by-year synthesis missed four of Hibino's ten ITF titles and all eleven of Kučová's. **Every
figure here was re-read off the finals TABLES with the sub-table heading (`Singles: 25 (11 titles,
14 runner-ups)`) quoted back as a checksum.** A summary-shaped question to that source biases the
answer toward "no title", which is exactly the direction that would have falsely vindicated ours.

---

## 7. THE VERDICT, ROW BY ROW

**23.9% overall is WRONG and it is too low – by about half.** `[I]` Not one measurable real band sits
below 50%. The top 50 is at 50.0%, #81–120 at 52.5%, the whole ranked population near 80%. Our own
by-age rows put the adult (18–29) rate at 15–18%, which is **a third** of the real rate for a woman
in the top 120. The headline number is not defensible as it stands.

**66.1% at #81–120 is NEARLY RIGHT – about 14 points too harsh.** `[I]` Real 52.5% (21 of 40, exact
census), 95% CI [37.0%, 68.0%], so ours is at the edge of the interval rather than outside it. **This
is the least wrong row on the page.** Whatever is broken, the band is not it – and the row's companion
number, ~23 events entered, matches ITF's own 23/yr for the #51–100 band exactly.

**15.3% in the top 50 is BADLY WRONG – about 35 points too generous, and it is the real defect.**
`[I]` Real 50.0% (25 of 50, exact census). The mechanism is sourced and it is a rule, not a tuning
constant: **the ITF play-down rule locks a top-50 woman out of every ITF event, W15 to W100.** She
cannot farm the rungs beneath her. If our top-50 player can enter w75/w100 – and a 15.3% title-less
rate is what that would look like – the fix is an entry rule, not a difficulty dial. **Reported, not
acted on; this page changes no code.**

**So: no, it is not "only the #81–120 band". The whole distribution has the wrong shape.** Reality is
a **plateau** – ~50% title-less from #1 to #120, because the supply of titles at each height is
matched to the number of women at that height. Ours is a **trough** – 15% at the top, 66% in the
band, 24% overall. We are moving title mass up the ranking that the real ladder does not move.
**Two errors of opposite sign, and the band row is the smaller of them.**

**The career-shape rows are RIGHT and should not be touched.** Longest title-less run median 3 (real
3), max 6 (real 7); ever-runs of 1/2/3 seasons at 95.6/85.6/53.3% (real 100/92/62); the w75+ drought
median of 6 seasons against real careers that routinely go 5–11 and sometimes a whole career. **The
DURATION model of a drought is true to the sport. Only its FREQUENCY by rank is not.**

**81.8% of titles from the bottom two rungs is DIRECTIONALLY RIGHT, ~15 points too concentrated.**
`[I]` Real career median 67%, range 33–86%; ours sits at the top of the real range. Read the other
way – titles won *below* her own competitive level – reality is at **90.9%** and ours is
conservative. The row is sound; it is the definition that needs pinning before anyone tunes it.

**The two age rows cannot be judged.** `[GAP]` No public data exists for junior or 30+ title-less
rates. 42% at 30+ at least lands beside the two bands that were measured; 9.2% at 14–17 is unanchored
in either direction. **Tuning against either would be tuning against nothing.**
