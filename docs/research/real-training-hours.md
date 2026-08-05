---
type: research
status: current
area: simulation-and-balance
canonical: false
last-reviewed: 2026-08-05
---

# Does training double when school ends?

**The factual question in front of `docs/specs/school-ends-2026-08.md`, answered before anything was
tuned.** The owner's belief, verbatim, and his own instruction about it:

> *«Школа должна когда-то закончиться, ей уже 21, а тренировки и прогресс должны удвоиться,
> соответственно, как мне кажется.»*
> …and, asked whether that was a design wish or a claim about the world:
> *«это про то, как реальные спортсменки тренируются, на сколько я знаю. Проверь.»*

He asked to have it **checked, not confirmed.** This page is the check.

**Every number below is tagged.** `[S]` = stated in the cited source. `[I]` = inferred or computed
here from sourced inputs, with the arithmetic shown. `[GAP]` = looked for and not found; a stated gap
is worth more than a plausible invention. Sources are listed in §5.

> **THE ANSWER, IN ONE PARAGRAPH.** **No – the honest multiplier is about 1.2–1.4x, not 2x.** The
> 2x figure appears only when a *casual school-and-club junior* is compared against a *professional
> in a pre-season block*, which is two different programmes rather than two ages. Every measurement
> that holds the institution or the pathway constant lands between **1.0x and 1.6x**. The reason is
> that the school-age baseline on a real performance pathway is already very high: the LTA's own
> published standard for an **18U girl, term time, still at school** is **18 hours on court plus 5
> in the gym = 23 h/week** `[S]`+`[I]`, and *measured* professional weeks come in at **17 ± 2.5**
> `[S]` to **~22.6** `[I]`. You cannot double 23. What genuinely does step up at eighteen is
> **competition**: the WTA Age Eligibility Rule caps a seventeen-year-old at 16 tournaments and lifts
> to unlimited at 18 `[S]` – and more tournaments means *less* training, not more.

---

## 1. Weekly hours by age band

| age band | on court / wk | physical / wk | TOTAL / wk | structure | tag | source |
| --- | --- | --- | --- | --- | --- | --- |
| **12–14** | 11+ (12U), 12+ (14U) | 5+ / 4+ *sessions*, duration not given | – | 1 rest day, 24h rest | `[S]` court, `[GAP]` gym hours | LTA 11U/12U/14U pathway standards, "term time when there is no official competition" |
| 12–14 | 14+ (12), 16+ (13), 18+ (14), incl. competition | `[GAP]` | – | – | `[S]` | Tennis Australia Player Development Matrix |
| 12–14 | 10 | 5 | **15** | 5 days x 120 min | `[I]` from stated session structure | RFET *Tenisxetapas* stage 5 "Precompetición" (2019) |
| 12–14 | 12 | 3 (+1 mental) | **16** | Mon–Fri, 36 wks/yr | `[S]` | CREPS Toulouse, CFE Tennis Occitanie, *collégiens* |
| 12–18 | – | – | **10–16** | – | `[S]` | USTA ADM Framework, stage 2 "Strive to Excel" |
| **14–16** | 16 (16U girls) | 4 x 1h S&C | **20** | – | `[S]` court, `[I]` total | LTA 16U/18U standards (sex-split) |
| 14–16 | 20+ (15–16, incl. competition) | `[GAP]` | – | – | `[S]` | Tennis Australia PDM |
| 14–16 | 13.5 | 4.5 | **18** | 2 double days + 3 single | `[I]` | RFET stage 6 "Competición" |
| 15.6 ± 1.1, **measured** | – | – | **22.7 ± 6.8** | – | `[S]` | Fett et al. 2017, junior Davis Cup – ⚠ **boys** |
| **17–18** | **18** (18U girls) | **5 x 1h** | **23** | 60–70 matches/yr | `[S]` + `[I]` (18+5) | LTA 16U/18U standards, explicitly marked **"(term time)"** |
| 17–18 | 16–20 | 6–8 off-court | **22–28** | 18–22 events, 90–125 matches/yr | `[S]` | Tennis Australia elite 15–18, quoted in Perri et al. 2023 |
| 17–18 | 15 | 5 (+1 mental) | **21** | Mon–Fri | `[S]` | CREPS Toulouse, *lycéens* |
| 16–18 | 13.5 | 6.5 | **20** | 1 rest day | `[I]` | RFET stage 7 "Rendimiento" |
| 16–18, **measured, female** | 82.4 ± 13.8 min/day | 44.5 ± 11.4 min/day | 162.8 ± 35.1 min/day → **16.3–19 h/wk** | 33-day blocks | `[S]` daily, `[I]` weekly (2.71h x 6–7) | Perri et al. 2023, 8 female future-top-250 |
| **19+ / professional** | – | – | **15–20** | 25–30 tournaments/yr | `[S]` | USTA ADM Framework, stage 3 (18+) |
| 19+, **measured** | 5–7.5 (5 x 60–90 min) | ~10–12 | **17 ± 2.5** | pre-season Nov–Dec | `[S]` | Fernandez-Fernandez et al. 2015 – ⚠ **male**, ranked 500–800 |
| 19+, **measured** | 130.3 ± 41.0 min/day | 95.5 ± 50.2 min/day | 225.8 min/day → **~22.6 h/wk** | 2–3 sessions/day, 91% pre-season | `[S]` daily, `[I]` weekly | Poignard et al. 2020 – includes **16 WTA women** |
| 19+, self-reported | **20** | 1–2 gyms/day | **26–32** | twice a day | `[S]` court, `[I]` total | Emma Raducanu, *The Independent*, 30 Jun 2025 |
| 19+, academy | 22 | 10 | **32** | – | `[S]` | Emilio Sánchez Academy, "Transition" (19–20) |
| 19+, academy | 3.5–4 /day | 1.5 /day | **~27–30** | Mon–Fri + Sat match | `[S]` daily, `[I]` weekly | Mouratoglou training centre |
| **tournament weeks, female** | 67.1 ± 9.4 min/day (**−18.6%**) | 37.3 ± 12.1 (−16.2%) | 162.2 min/day – statistically **identical** to a training block | ~30 wks/yr | `[S]` | Perri et al. 2023 |

---

## 2. The clean test – the same institution, school programme against full-time

This is the strongest evidence available, because one organisation is measuring one thing.

| institution | with school | without school | multiplier | tag |
| --- | --- | --- | --- | --- |
| **Weil Tennis Academy** (Ojai, CA) | afternoon only, 1:15–5:15 Mon–Fri: **"20 HRS TRAINING PER WEEK"** (attends Weil School 8:00–12:14) | all day 9:00–16:15; the timetable adds *"Morning Tennis Training 9:00AM to 11:30AM for Non Weil School Students"* → 6.5 h/day → **~30–32 h/wk** | **1.5–1.6x** | `[S]` / `[I]` |
| **USTA ADM Framework** | stage 2 (12–18): **10–16 h/wk** | stage 3 (18+): **15–20 h/wk** | midpoints 13 → 17.5 = **1.35x** | `[S]` / `[I]` |
| **Emilio Sánchez Academy** | "Advanced" 16–17: 22 + 10 = **32** | "Pre-transition" 18–19 / "Transition" 19–20: 22 + 10 = **32** | **1.00x** | `[S]` |
| **Smith Stearns** (Hilton Head) | Full-Time **PM ONLY** – attends Hilton Head Prep 8:00–13:05, one session | Full-Time **ALL DAY** – online school, *"two sessions per day"* | **2.0x on SESSION COUNT**; hours not published | `[S]` sessions, `[GAP]` hours |
| **Mouratoglou** (France) | Tennis & School: *"between 10 and 15 hours of training a week"* | training centre: 2 x 1h30 or 1 x 2h30 per day + 1h individual + 1h30 physical, Mon–Fri + Sat match → **~27–30 h/wk** | **~2.3x** | `[S]` / `[I]` |

⚠ **READ THE OUTLIER CAREFULLY, BECAUSE IT IS THE WHOLE ARGUMENT.** Mouratoglou is the only entry
near 2x, and it gets there by having an unusually *low* school-side number. 10–15 h/wk is far below
what every federation prescribes for the same ages (LTA 20–23, Tennis Australia 20+, RFET 20, CREPS
21). "Tennis & School" is a commercial school product, not an elite-junior benchmark. Set the same
professional week against a real pathway baseline and it is 27–30 ÷ 23 = **1.2–1.3x**.

⚠ **AND THE SÁNCHEZ ROW IS EVIDENCE OF A DIFFERENT KIND.** 22 h of tennis a week appears on *every*
stage page from "Initiation" (10–12) to "Transition" (19–20). It is a programme constant rather than
an age prescription – which is exactly why it is worth citing: **the academy sells the identical week
to a sixteen-year-old and a twenty-year-old.** There is no post-school tier to buy.

---

## 3. The direct answer

**Range 1.0x–2.0x; the evidence supports the low end, about 1.2–1.4x.** Five independent reasons.

1. **The school-age baseline is already high.** LTA's standard for an 18U girl **in term time** is 18
   court + 5 gym = **23 h/wk** `[S]`+`[I]`; Tennis Australia recommends **22–28** for elite 15–18s
   `[S]`. Doubling 23 means 46 h/wk, which nothing measures anywhere.
2. **Measured professional weeks are LOWER than those junior recommendations.** ATP 500–800:
   **17 ± 2.5 h/wk** `[S]`. A cohort including 16 WTA women, 91% pre-season: **~22.6** `[I]`.
   Raducanu's own description of a heavy week is the top of the range at 26–32 `[S]`+`[I]`. Against
   LTA's 23 that is a multiplier of **0.74x to 1.39x**.
3. **The same-institution tests cluster at 1.0–1.6x** (§2), and the only 2x reading has a weak
   baseline under it.
4. **Physiology forbids a step change.** An acute-to-chronic workload ratio above 1.5 raises the
   new-injury hazard to **2.8x** in professionals `[S]`; the evidence-based safe ramp is **≤15%
   weekly volume growth**, which cut professional injuries by 21% `[S]`. At 15%/wk, doubling takes
   `ln(2)/ln(1.15) ≈ 5 weeks` **as a ramp** `[I]` – not a switch thrown on graduation day.
5. **What actually changes at eighteen is TOURNAMENTS, and more tournaments means less training.**
   The WTA Age Eligibility Rule caps a seventeen-year-old at **16 events** and lifts to **unlimited**
   at 18 `[S]`. High-level players compete **~30 weeks a year, leaving ~20 sporadically dedicated to
   training** `[S]`, and in-season blocks get squeezed to **≤3 weeks** `[S]`. On a tournament week a
   female player's on-court duration falls **18.6%** and her technical work falls **37%** `[S]`.

**WHERE THE OWNER IS RIGHT, AND IT MATTERS.** 2x is entirely real for a *change of programme*: a girl
in ordinary school doing club tennis at 8–12 h/wk who moves into a full-time environment at 25–30. On
the LTA / Tennis Australia pathway that transition happens around **twelve to fourteen**, not at
school-leaving. Two players describing the change in their own words both name competition rather
than training – Mirra Andreeva on turning eighteen: *"the good thing about it is that I can play as
many tournaments as I want"*; Radu Albot: *"When I finished high school, it became a different story.
I could travel more and play."*

**So the shape the sim should take is three things, not one:** about **1.2–1.4x on training hours**, a
**larger step on competition** (16 events → unlimited), and a **composition shift** – less technical
work, more match play, more travel weeks displacing training.

⚠ **AND THAT IS WHY THE SHIPPED NUMBER IS 1.4 AND NOT 2.0.** `ECONOMY.summerBlock.loadFactor` has
been **1.4** since W3-SUMMER, argued from first principles ("two sessions a day is not twice the
learning – the coach's hours are what they are, and volume has sharply diminishing returns"). It
lands inside this page's measured band without having been aimed at it, and `ECONOMY.school.loadFactor`
is deliberately the same number: one school-free week may not be worth 1.4 in July and 2.0 in October.

---

## 4. Caveats, and where the evidence is thin

- `[GAP]` **No measured in-season weekly-hours dataset for professional WOMEN exists publicly.**
  Poignard 2020 includes 16 WTA women but pools their durations with 16 ATP men and is 91%
  pre-season. This is the single biggest hole on the page.
- `[GAP]` **No player anywhere states a before/after hours figure tied to leaving school.** A dozen
  phrasings were tried. Raducanu says something close to the opposite: *"When you train, you only
  train a certain amount of hours a day. You've still got a lot of time to fill."*
- The 22.7 ± 6.8 h/wk figure for 15.6-year-olds is **junior Davis Cup, boys**. No female equivalent
  was found. Fernandez-Fernandez's 17 h/wk is also male, and a modest professional (ranked 500–800)
  in pre-season.
- `[GAP]` **LTA, Tennis Australia and RFET all stop publishing hours at 17–18.** No federation
  publishes a post-school weekly figure except USTA, so the 18→19 comparison rests on USTA plus
  academies plus the two measured studies.
- **Academy hours are sold products, not measured training.** Sánchez's flat 22 h across ages 10–20
  proves that on its own.
- ⚠ **THE WIDELY REPEATED "PROS TRAIN 30–40 HOURS A WEEK" HAS NO TRACEABLE SOURCE.** It originates in
  uncited academy marketing and is internally inconsistent – its own breakdown sums to 21–32, not
  30–40 – and it propagates across several content farms. **Do not cite it.** It is almost certainly
  where the "professionals train double" belief comes from.
- **The "16 hours a week" cap is not a formal recommendation.** The AAP calls it a *"possible rule"*
  that *"needs to be validated by other long-term studies"*. By contrast the **"hours ≤ age in
  years"** rule *is* formal: Jayanthi et al. 2015 (OR 2.07, 95% CI 1.40–3.05), adopted verbatim by
  NATA in 2019.
- **Federations openly break their own sports-medicine guidance.** Tennis Australia prescribes 14+
  h/wk at twelve and 18+ at fourteen, against a rule saying hours should not exceed age in years.
  That conflict is in the primary documents, not a reading artefact.
- `[GAP]` IMG Academy and the Rafa Nadal Academy publish no school-vs-full-time hours; the ITF
  publishes no hours-by-age table.
- Blog aggregations circulating "U12: 8–12 h/wk, U14: 10–14 h/wk" as federation guidance match **no**
  primary document. Do not cite.

---

## 5. Sources

**Peer-reviewed**

- Perri T, Duffield R, Murphy A, Mabon T, Reid M (2023). *Periodisation in professional tennis: a
  macro to micro analysis of load management strategies within a cluttered calendar.* IJSSC
  18(3):772–780. [DOI](https://doi.org/10.1177/17479541221091087) ·
  [open manuscript](https://opus.lib.uts.edu.au/bitstream/10453/159653/2/Periodisation%20in%20professional%20tennis%20a%20macro%20to%20micro%20analysis%20of%20load%20management%20strategies%20within%20a%20cluttered%20calendar.pdf)
- Poignard M et al. (2020). *The impact of recovery practices adopted by professional tennis players
  on fatigue markers according to training type clusters.* Front Sports Act Living.
  [PMC7739815](https://pmc.ncbi.nlm.nih.gov/articles/PMC7739815/)
- Fernandez-Fernandez J, Sanz-Rivas D, Sarabia JM, Moya M (2015). *Preseason training: the effects of
  a 17-day high-intensity shock microcycle in elite tennis players.* JSSM 14:783–791.
  [PDF](https://www.jssm.org/volume14/iss4/cap/jssm-14-783.pdf)
- Fraser J, Borgerding T, Green H (2019). *Methods of monitoring training loads in junior tennis
  players.* J Med Sci Tennis 24(2):12–19.
  [PDF](https://shura.shu.ac.uk/32992/3/Fraser-MethodsOfMonitoring(AM).pdf)
- Thurber L, Kantrowitz DE, Wang KC, Jayanthi N, Colvin A (2025). *Early sport specialization and
  intense training in junior tennis players: a sport-specific review.* Sports Health.
  [PMC12640273](https://pmc.ncbi.nlm.nih.gov/articles/PMC12640273/)
- Jayanthi NA, LaBella CR, Fischer D, Pasulka J, Dugas LR (2015). *Sports-specialized intensive
  training and the risk of injury in young athletes.* AJSM 43(4):794–801.
  [PubMed](https://pubmed.ncbi.nlm.nih.gov/25646361/)
- Amor-Salamanca A et al. (2025). *Risk factors and prevention of musculoskeletal injuries in
  adolescent and adult high-performance tennis players.* Sports 13(10):336.
  [PMC12568103](https://pmc.ncbi.nlm.nih.gov/articles/PMC12568103/)

**Federations and governing bodies**

- [LTA 16U/18U pathway standards](https://www.lta.org.uk/siteassets/compete/performance/aspirational-standards/16u-18u-lta-performance-player-pathway-programme-standards.pdf)
  · [LTA 11U/12U/14U](https://www.lta.org.uk/siteassets/compete/performance/aspirational-standards/11u-12u-14u-lta-performance-player-pathway-programme-standards.pdf)
- Tennis Australia Player Development Matrix – [on court](https://matrix.tennis.com.au/requirements/on-court/)
  · [competition](https://matrix.tennis.com.au/requirements/competition/)
- [USTA American Development Model Framework](https://www.usta.com/content/dam/usta/coach-organize/content-fragments/resource-library/assets/pdfs/adm-framework.pdf)
  · [USTA training-block recommendations, 2024](https://s3.amazonaws.com/ustaassets/assets/689/15/21297_c_ny_24_usta_pd_training_block_reco_booklet_phase_01_(9)1.pdf)
- [RFET *Tenisxetapas*, Apr 2019](https://tenisxetapas.rfet.es/downloads/manual.pdf)
- [CREPS Toulouse, CFE Tennis Occitanie](https://www.creps-toulouse.sports.gouv.fr/structures/cfe-tennis-occitanie/)
- [NATA statement on sport specialization, Oct 2019](https://www.nata.org/sites/default/files/2025-08/youth_sports_specialization_recommendations.pdf)
- [WTA Age Eligibility Rule](https://s3.amazonaws.com/ustaassets/assets/1/15/2013_age_eligibility_rule.pdf)
  · [WTA 2025 rulebook](https://photoresources.wtatennis.com/wta/document/2025/01/06/50d1eafa-e678-4081-bfa8-5576f670f801/2025-WTA-Rulebook-1-5-2025-.pdf)

**Academy published timetables**

- [Weil Tennis Academy full-time](https://www.weiltennis.com/full-time-academy/) ·
  [tuition and hours](https://www.weiltennis.com/tuition-and-fees/)
- [Mouratoglou Tennis & School](https://www.mouratoglou.com/en/tennis-and-school/sports-program/) ·
  [training centre](https://www.mouratoglou.com/en/tennis-training-centre-2/)
- Emilio Sánchez Academy stage pages under
  [emiliosanchezacademy.com/barcelona/weekly/programs](https://emiliosanchezacademy.com/barcelona/weekly/programs/)
- [Smith Stearns full-time](https://www.smithstearns.com/our-programs/full-time-academy/)

**Player and coach statements**

- [Raducanu on a 20-hour on-court week, 30 Jun 2025](https://www.inkl.com/news/20-hours-training-on-the-court-is-a-good-shift-according-to-emma-raducanu-but-this-year-recovery-is-vital)
- [Andreeva on the age rule lifting, WTA Insider, 2 Jan 2025](https://www.wtatennis.com/news/4193015/with-improved-professionalism-mirra-andreeva-eyes-another-milestone-year)
- [Albot on finishing high school, Court73, 21 Mar 2021](https://court73.substack.com/p/if-you-dont-have-anyone-to-invest)

**Flagged unreliable – listed so they are not re-found and trusted**

- `siliconvalleytennis.com` – the origin of the uncited "30–40 h/wk" professional figure
- `tennisacademy.app` – "15–18 vs 25–30 h/wk", the author's own estimates, no citations
