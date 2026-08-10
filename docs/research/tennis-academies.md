---
type: research
status: current
area: economy
canonical: false
last-reviewed: 2026-08-10
---

# What a tennis academy really costs, and what it sells

Compiled 2026-08-10. Answers the four questions in `docs/specs/academy-invitation.md` §5 before a
builder prices anything. The owner's framing:

> «Это не простые вопросы, мне кажется надо обратиться к реальным примерам для вдохновения и решения
> этих вопросов. Мы строим что-то унифицированное и немного упрощенное, как обычно, но приближенное
> к реальности тем не менее.»

Primary sources throughout where they exist: academies' own 2025-26 and 2026-27 rate cards and fee
PDFs, federations' own published selection policies. **This sector is famously opaque and three of
the four most famous names publish nothing** – that is itself a finding, recorded in §9 rather than
papered over with a guess.

**Scale note, carried through every figure.** Our money is deliberately small. A `middle` family's
entire parent income is **$425/wk × 52 = $22,100 a season** (`ECONOMY.parentIncomeCents`); `working`
is **$12,740**, `wealthy` **$39,000**. Every real figure below is quoted at its real value and then
placed against the `middle` season income. **Nothing here is converted or rescaled.** ⚠ Ratios for
EUR/GBP/AUD figures are taken at face value against a dollar income – a currency conversion would
move them, and this document deliberately does not apply one.

## 0. The headline

1. **The annual band is tight; the order of magnitude is in the DURATION, not the price rung.**
   Inside one seller, boarding-versus-day is only **1.4×–2.3×**, and full-time-versus-after-school
   only **1.6×–1.9×**. The 100× spread everyone quotes only appears when you compare a *year*
   ($99,900 at IMG) against a *week* ($850 at SotoTennis). **The market prices the year as a narrow
   band and the week as a wide funnel.** A four-rung price ladder is defensible; a four-rung ladder
   where the top is 10× the bottom is not, unless one of the rungs is "a few weeks a year".
2. **Our `elite` coach already IS an academy day programme, by price.** The game's dearest weekly
   arrangement at 12-16 costs **$600/wk = $31,200 a season = 1.41×** a middle income. SotoTennis's
   full-time day programme is **€30,855 incl. IVA = 1.40×**; Justine Henin's day programme
   **€32,945 = 1.49×**. **We are not missing a rung above `elite`. We are missing what sits above
   that, and what sits above that is board and school.**
3. **A full residential place is 3.1×–4.5× a middle family's whole season income**, and it stays
   that expensive across five countries: IMG Academy tennis boarding **$99,900** (2026-27, 4.52×),
   Saddlebrook **$76,915** (2025-26, 3.48×), Emilio Sánchez Naples **$74,100** (3.35×), Weil
   **$68,600 + $7,000 travel** (2026-27, 3.42×), Evert Developmental **$67,950** (2026-27, 3.07×),
   Justine Henin Tennis Pro **€52,745** (2026-27, 2.39×). ⚠ Round 5's «~$55k» sits at **2.49×** –
   near the *bottom* of the residential band, not above it.
4. **The fee buys the environment and the bed. It does not buy the aeroplane.** In every academy
   found, tournament travel, hotel and entry fees are **outside** the headline fee. Rafa Nadal
   Academy states it in one sentence: tournament expenses "are organized by RNA staff and are not
   included in the program price" (2026 brochure). What *is* usually inside is the **coach at the
   tournament** – RNA, Henin (10-12 events), Ferrero and ESA Naples all bundle coaching in
   competition while excluding the trip.
5. **Three sellers re-bundle travel as a second, separately-priced product**, and this is the exact
   shape the spec's `travelCoverShare` wants: Weil's **Tournament Travel Account, $7,000/yr**, which
   covers entry fees, hotel, transport and Weil coaches present at matches; IMG's **$4,500
   competition fee** plus a refundable **$1,500 / $3,000 tournament deposit** (ITF-ranked players pay
   the higher one); SotoTennis's tariff of **€700 + IVA** for a group international week and
   **€1,300 + IVA** for a 1-2-1 week, plus a **€40/day coach food allowance split among the players
   on the trip**.
6. **No academy anywhere publishes a scholarship count.** Not one. IMG publishes only "a limited
   amount of financial aid", need-based, on "an academic, athletic, character, and financial review".
   The countable funded places belong to **foundations and federations**: Champ'Seed carries **12
   players**, Henin's Team Jeunes Talents **6 of a target 8**, the ITF Grand Slam Player Development
   Programme **65 players from 42 countries in 2026**.
7. **A funded place is partial, not free, everywhere it is quantified.** The only academy scholarship
   with a published *size* is Rafa Nadal Academy's Movistar scheme: **20 places at 25% of the
   programme fee**, ages 12-18, Spanish passport or residence (2020-21; no current equivalent
   published). Federation money is a cash grant well below the cost of a residential place:
   LTA National Junior Grant **up to £5,000**, International Junior Grant **£10,000-£20,000**,
   USTA Development Grant **~$20,000/yr**, ITF GSPDP **$12,500 / $25,000 / $50,000**.
   **Against a middle income that is 0.23×-1.13×, not 4.5×.**
8. **Ranking is the gate to be considered. A person decides.** The LTA is the clearest: a player must
   clear a published ranking threshold to be longlisted, and then "must then be nominated by a
   minimum of two LTA Performance National Coaches" before a five-person panel votes. Tennis
   Australia publishes UTR gates and grants its panel "absolute discretion". France routes every
   place through the DTN. **The USTA's Development Grant is the one purely mechanical scheme
   found** – a published ranking table, re-tested every quarter.
9. **The asymmetry is the whole mechanic, and one document states it outright.** IMG's Perpetual
   Tuition Enrollment Agreement: a fee-paying student-athlete "is automatically re-enrolled for each
   subsequent academic year", with **no performance condition published anywhere**. The same document
   on aid: "financial aid will continue to be reviewed on an annual basis… you will need to re-apply
   each year", and "Financial aid is limited, and additional assistance is NOT guaranteed."
   **The bought place renews itself. The won place must be won again.**
10. **Nobody has counted what share of top juniors go through an academy.** Searched across the
    pathway literature, federation reports and journalism: the studies measure ranking trajectories
    and ages and **never code the training environment**. Do not use a percentage – there is not one
    to use. What *is* countable points the other way: Britain runs **one** national academy with
    **9 named players**, France's national junior pole holds **4-6 girls**, and the LTA's whole
    funded ladder is 1 + 6 + 10 named players. **The federation route is numerically minute.**

## 1. How many price rungs are there, really

Four, and a fifth that is not an academy at all. The rungs are distinguished by **how much of the
year and how much of the day** you buy, not by a premium/budget split within the same product.

### Rung 1 – full-time residential, school included

| Academy | Year stated | Boarding | Day | vs $22.1k |
|---|---|---|---|---|
| **IMG Academy** tennis, HS 10-12 | 2026-27 | **$99,900** | $79,400 | **4.52×** / 3.59× |
| IMG Academy tennis, middle school 6-8 | 2026-27 | $95,900 | $75,400 | 4.34× / 3.41× |
| IMG Academy tennis, HS 10-12 | 2025-26 | $96,900 | $75,900 | 4.38× / 3.43× |
| **Saddlebrook Prep** tennis + academics | 2025-26 | **$76,915** | $53,640 | 3.48× / 2.43× |
| **Emilio Sánchez Academy Naples** tennis + school | ⚠ no year on page | **$74,100** | $56,100 | 3.35× / 2.54× |
| **Weil Tennis Academy** (tennis $46,000 + school $22,000 + team fee) | 2026-27 | **$68,600** | $55,400 | 3.10× / 2.51× |
| Weil, **including** its $7,000 Tournament Travel Account | 2026-27 | $75,600 | $62,400 | 3.42× / 2.82× |
| **Evert** Developmental ⚠ school billed separately | 2026-27 | $67,950 | $48,950 | 3.07× / 2.21× |
| **Evert** Academy ⚠ school billed separately | 2026-27 | $55,650 | $36,150 | 2.52× / 1.64× |
| **Ferrero / Equelite** €4,880 vs €3,470 per month ×12 | ⚠ inferred 2026 | €58,560 | €41,640 | 2.65× / 1.88× |
| **Justine Henin** Tennis Pro, 12 months | Sep 2026-Aug 2027 | €52,745 | €39,545 | 2.39× / 1.79× |
| **Justine Henin** Tennis Études, 10 months | Sep 2026-Jun 2027 | €43,945 | €32,945 | 1.99× / 1.49× |
| **Good to Great** (Stockholm) ⚠ no school at all | 2026 | €44,500 | – | 2.01× |

**Not published, and this is the sector's own answer**: Rafa Nadal Academy, Mouratoglou and
Sánchez-Casal Barcelona – the three most famous annual programmes in the world – publish **no annual
price at all**, in any language, including inside their own 2026 brochures read cover to cover.
Secondary reporting, flagged: RNA **€56,000** (tennis365, 28.09.2025) and **€56,000-€62,000**
(indietenis, 02.04.2026); Mouratoglou **€63,000** split €38,000 tuition + €14,000-25,000
accommodation (tennis365, 28.09.2025); Sánchez-Casal **€50,000** (same piece). ⚠ The much-copied
Mouratoglou breakdown "€19,750 + €13,250 + €6,650 = €39,650" traces to an undated Reuters factbox
and should not be cited as current.

### Rung 2 – full-time day, sleeping at home

The same column, right-hand side. Consistently **65-80% of the boarding price**, and the fall is
almost entirely the bed and the meals (§3). **This is the rung our game already sells**, at the top
of its coach ladder.

### Rung 3 – part-time / after-school, term-time only

| Programme | Year | Price | vs $22.1k |
|---|---|---|---|
| **SotoTennis** Option A, full-time day, full year | 2025-26 | €25,500 + IVA ≈ **€30,855** | 1.40× |
| **Van der Meer** AM/PM, training only | 2025-26 | $27,600 | 1.25× |
| **Van der Meer** PM only | 2025-26 | $22,450 | 1.02× |
| **SotoTennis** Option B, after-school Mon-Thu 17:00-20:00 | 2025-26 | €15,500 + IVA ≈ **€18,755** | 0.85× |
| **Evert** Afternoon Academy, 12&U, 15:45-17:45 | 2026-27 | $13,000 | 0.59× |
| **Rick Macci** afternoon-only, $1,000/month Sep-May | 2026 | ≈ $9,000 | 0.41× |

**Inside one seller the full-time:part-time ratio is 1.65×** (Soto A:B) and **1.23×** (Van der Meer
AM/PM:PM). Small. The rung is real but it is not a different class of purchase.

### Rung 4 – a few weeks a year

| Product | Price per week | vs $22.1k, one week |
|---|---|---|
| Alexander Waske Sommercamp (Germany) | €680 | 0.03× |
| SotoTennis Access Week | €700 + IVA ≈ €847 | 0.04× |
| Mouratoglou half-day camp, 6 days | €700-€1,690 | 0.03×-0.08× |
| Good to Great weekly | €1,200 | 0.05× |
| Sánchez-Casal Barcelona standard, non-boarding | €1,300 | 0.06× |
| IMG tennis camp, non-boarding | $1,459-$3,009 | 0.07×-0.14× |
| Emilio Sánchez Naples, full day boarding | $2,000 | 0.09× |
| Sánchez-Casal Barcelona PUSH, boarding double | €2,220 | 0.10× |
| Mouratoglou intensive camp, 6 days | €1,050-€2,300 | 0.05×-0.10× |
| Mouratoglou Competition Camp, 13 days | €3,300-€4,600 | – |

⚠ Mouratoglou's camp prices are **week-of-year dependent** – the same product swings 2.2× between
its cheapest and dearest calendar weeks, read live from the academy's own booking engine. IMG's camp
page states prices are dynamic and rise nearer the date.

### Rung 5 – the federation place, which is not an academy purchase

Covered in §6. Where a family contribution is published at all it is **A$6,000-A$20,000** (Tennis
Australia) or **~€9,500** (a French regional federal centre) – i.e. **0.27×-0.90×** a middle income,
below every commercial rung.

### The shape, stated plainly

- **Across sellers, annual residential**: $67,950 to $99,900. A spread of **1.47×**. Remarkably tight.
- **Within one seller, boarding vs day**: 1.26× (IMG) to 1.54× (Evert Academy). **Tight.**
- **Within one seller, full-time vs part-time**: 1.23× to 1.65×. **Tight.**
- **A year against a single week**: SotoTennis's own ladder runs €847 to €30,855, **36×**.
  Mouratoglou's published camp range alone spans **18×**.

**So: four or five rungs, and the top is roughly 5-6× the bottom if you count only annual products,
or two orders of magnitude if the bottom rung is "three weeks in the summer".** The owner's instinct
in §5.1 of the spec – "three is enough to be a ladder" – is well supported. A fourth rung that only
a wealthy career reaches is exactly what the residential tier is in life.

## 2. What the fee actually includes

The load-bearing question, and the answer is not uniform. What follows is assembled from itemised
"included / not included" lists on the academies' own pages.

### Always inside the fee

- **Coaching hours**, where published: RNA **17 h tennis + 6.15 h fitness/week** (PLUS version 23 h +
  11.15 h); Sánchez-Casal Barcelona **22 h tennis + 5 h physical**; Weil **"20 HRS TRAINING PER
  WEEK"**; Henin **max 15 h tennis + 7.5 h fitness**; Mouratoglou 2.5-3 h tennis + 1.5 h fitness a
  day. ⚠ **IMG does not publish coaching hours on its rate card at all.**
- **Court time.** Never a separate line anywhere. The academy *is* the court – which is exactly the
  spec's §1a claim, confirmed.
- **Strength and conditioning.** Universal.
- **Mental / psychology.** Inside at RNA, Sánchez-Casal, Henin, Ferrero, Weil, ESA Naples.
- **Room, board and meals** – when the boarding option is the one bought.

### The three lines that decide everything, because sellers disagree

**(a) Schooling.** Inside the fee at IMG, Saddlebrook, Rafa Nadal Academy ("1 academic course at the
Rafa Nadal School") and ESA Naples. A **separate bill** at Evert (Grandview Preparatory bills the
family directly – the page says so in as many words), Justine Henin (**€3,500/yr**), Ferrero
(**+€3,280/yr**), SotoTennis (Sotogrande International School, "separate payment terms apply"), Van
der Meer, Macci and Saviano. On the same sheet but as its own line at Weil (**$22,000**). **Absent
entirely at Good to Great**, whose FAQ answers the question "Do you have school/study programs
connected to the academy?" with "No."

⚠ **Sánchez-Casal Barcelona is the instructive case**, because its school publishes what the academy
will not. ES American School's *Costs and Fees, Academic Year 2026-2027* (updated 23.02.2026) puts
compulsory annual school fees at **€18,650 elementary / €16,870 middle / €18,040 high** for a new
student who is also an ES Academy tennis player, and **€20,190-€21,360** for one who is not – the
Physical Education levy of €3,320 is waived for academy players. Returning tennis players pay
**€12,620-€14,400**. So at that campus the school alone is **0.57×-0.84×** a middle family's whole
season income, before a single tennis hour.

**(b) Physio and medical.** Inside at RNA ("medical care, physiotherapy and nutrition service"),
Henin ("regular physiotherapy"), Ferrero (its own clinic), ESA Naples. **Outside at IMG**, which
charges a **health services fee of $600 boarding / $475 day**, a **$400 medical deposit**, and
requires US health insurance priced only as "INQUIRE". **Explicitly outside at SotoTennis**, whose
parent-pays list names "Physio fees" alongside entry fees and restringing.

**(c) Travel to tournaments.** ⚠ **Outside the headline fee in every single case found.**

- **Rafa Nadal Academy**, 2026 brochure, verbatim: tournament "registration, travel, and
  accommodation, are organized by RNA staff and are not included in the program price."
- **Ferrero / Equelite** names "gastos de torneo" among five excluded items, and runs a cost-plus
  system: parents are wired a per-player estimate and must pay within 48 hours or, per the academy's
  own parent rules, the player does not travel.
- **Justine Henin** includes coaching at 10 tournaments (10-month programme) or 12 (12-month), but
  "hôtel, transport, repas non inclus"; on the High Performance Tour the **coach's** costs are the
  player's too.
- **SotoTennis** is the most itemised in the sector. Parents pay all flights, hotel, food, entry
  fees, physio, restringing, insurance **and "a share of coach's expenses"** – quantified in its
  payment terms as a **€40 per day food allowance** split across the players on the trip (it was €30
  in 2024-25). Its published tariff: local weekend **€30 + IVA**; group international week **€700 +
  IVA**; 1-2-1 international week **€1,300 + IVA**. The 2024-25 sheet published the underlying rate
  outright: **€200.00 per day + IVA** for a 1-2-1 international tournament.
- **Good to Great**: coaches travel to tournaments "for an additional cost", unpriced.
- **IMG** partially re-bundles: a fixed **$4,500 competition fee** inside the fee schedule, plus a
  **refundable tournament deposit of $1,500 standard / $3,000 for ITF-ranked players**, described as
  covering "travel and expenses for tournaments" with the real cost left to "Inquire with Advisor".
- **Weil** is the one clean number in the sector: a **$7,000 Tournament Travel Account**, itemised as
  covering entry fees, travel coordination, hotel and transport, supervision at the hotel, pre-match
  warm-ups, and the presence of Weil coaches at tournament matches.

**So the honest summary of the bundle**: the fee buys **the coach, the court, the fitness, the
mental work, usually the bed, sometimes the school, and – increasingly often – the coach's presence
at tournaments**. It does not buy the trip. Where the trip is sold, it is a **second product with
its own price**, running **$4,500-$7,000 a year** (0.20×-0.32× a middle income) or **€700-€1,300 a
week** for international travel.

### Never included, anywhere

**Racquets and stringing.** Ferrero names "encordados" as excluded; Weil offers a purchasing discount
only; Mouratoglou's 100-item extras catalogue, read in full, contains no stringing item at all.

**Private one-to-one lessons beyond a small bundled allowance.** Mouratoglou's annual programme
includes "a package of 18 hours of individual coaching lessons per year" and sells more at **€150/h**;
SotoTennis bundles **90 minutes a week**; Weil sells private hours at **$150-$300**; ESA Naples at
**$100-$150**; Ferrero at **€68**. **The group programme is the fee; the individual hour is the
upsell** – which is the inverse of our game, where the hired coach is bought by the hour.

**Laundry, mostly.** Included in RNA's residence and Sánchez-Casal's summer boarding; **$1,750 per
school year at IMG**; excluded at Ferrero.

**Airport transfers.** Mouratoglou €50-€75 each way; Henin €85-€95; SotoTennis €130-€175 from Málaga
with a €20 night surcharge.

## 3. Board versus day, which is a large part of the cost and a real thing to model

The premium for living there, from the same rate cards:

| Academy | Boarding premium | vs $22.1k |
|---|---|---|
| Saddlebrook Prep, 2025-26 | **$23,275** | **1.05×** |
| IMG Academy, 2026-27 | $20,500 | 0.93× |
| Evert Academy, 2026-27 | $19,500 | 0.88× |
| Evert Developmental, 2026-27 | $19,000 | 0.86× |
| Emilio Sánchez Naples | $18,000 | 0.81× |
| Ferrero / Equelite (€1,410/mo × 12) | €16,920 | 0.77× |
| Weil, 2026-27 | $13,200 | 0.60× |
| Justine Henin, 12-month | €13,200 | 0.60× |
| Justine Henin, 10-month | €11,000 | 0.50× |

**The bed alone costs between half and all of what our middle parents earn in a season.** It is
**20-30% of the residential total** and it is the single cleanest reason the top rung is a different
class of purchase from the one below it.

Two structural notes worth carrying. **SotoTennis stopped selling board**: in 2024-25 it priced its
own residence at €7,500 + IVA a year; in 2025-26 it publishes no boarding price at all and refers
families to a list of host families and apartments. So a headline that looks cheap may simply have
had the bed removed from it. And **IMG's boarding tuition covers a shared double room**; a single
room is an upgrade of **$21,000-$24,000 a year** on top – i.e. the privacy costs roughly what the
boarding did.

## 4. Scholarships – how many, and decided how

### The count, and it does not exist at academy level

| Body | Published count | Value | Criteria published? |
|---|---|---|---|
| **IMG Academy** | ⚠ none – "a limited amount of financial aid" | ⚠ none | Yes, in words: "an academic, athletic, character, and financial review" |
| Evert, Saddlebrook, Weil, SotoTennis, Ferrero, Good to Great, ESA | ⚠ none | ⚠ none | ⚠ none |
| **Van der Meer** | ⚠ none | ⚠ none | "Scholarships available based on ranking" – the only academy naming ranking |
| John Newcombe | ⚠ none | "generous" | ⚠ none |
| **Rafa Nadal Academy / Movistar** | **20 places** (2020-21) | **25% of the annual or semester fee** | Yes: ages 12-18, Spanish passport or residence, "méritos tanto tenísticos como académicos" |
| **Champ'Seed** (Mouratoglou's foundation) | **12 players now**, ~50 over 11 years | ⚠ not published | Yes, four criteria (below) |
| **Team Jeunes Talents BNP Paribas Fortis** (Henin) | **6 named, target 8** | ⚠ not published | Selected by Henin and Jeunehomme |
| **ITF Grand Slam Player Development Programme** | **65 players, 42 countries** (2026) | 3 × $50,000, 51 × $25,000, 11 × $12,500 | Age, gender and ranking; juniors girls 14-17, boys 15-18 |

⚠ The ITF's own release and its programme page word the GSPDP criteria differently – "age, gender,
and ranking" in the release, "age, ranking and regional representation" weighed by the GSPDP
Committee on the page. **Regional representation is a selection criterion in one primary source and
absent from the other**, which is worth knowing before treating the scheme as purely meritocratic.
The programme has delivered "over US$68 million since inception" (1986).

⚠ The RNA/Movistar scheme is documented only for **academic year 2020-21** and the academy's own
2026 brochure mentions no scholarship at all. Treat it as evidence about *shape* (a fifth of the fee,
twenty places, nationality-gated) rather than as a live programme.

**So the honest answer to "how many": academies do not say, and the ones that do say are
foundations attached to academies rather than the academies themselves.** The scarcity is real –
Champ'Seed takes roughly **3-5 new players a year worldwide** – but it is not published as a per-rung
quota.

### How it is decided – four mechanisms, layered, not one

**Champ'Seed** publishes the clearest criteria found anywhere: potential ("critical, aside from the
other criteria"), age 10-22, ranking – "Be among the 5 to 10 best players in their country for their
age category" – and financial need. The mechanism is **scout, then committee**: one named person
identifies candidates and forwards files to a six-person selection committee. And then the clause
that matters most for our design: **"The panel of experts is able to override certain criteria if a
player's potential is observed, even if the candidate does not fulfill all the listed criteria."**

**The LTA is the fullest published process in world tennis** and it is worth reading as a template.
A player clears an objective threshold – a UTR benchmark ("11U – Top 24 in GB… 12U – Top 20… 13U –
Top 16") or an ITF junior ranking band – and that only gets her **longlisted**. She then "must then
be nominated by a minimum of two LTA Performance National Coaches" to be shortlisted, after which a
five-person panel votes and ranks. The panel judges six named factors: strengths and weapons, head,
heart, athlete, performance, readiness. The policy says the thresholds "are deliberately inclusive".

**Tennis Australia** publishes ranking gates (NDP Full = "Top 10 international UTR in BY or World
Ranking ITF, WTA, ATP") and then hands the panel "absolute discretion to make an offer to a candidate
who has not met the minimum performance requirements". Its National Tennis Academy withholds the
benchmark table entirely – "can be provided upon request" – and interviews the player *and the
parents* before deciding.

**France** routes everything through named officials: a place at a Centre Fédéral d'Entraînement is
awarded "sur proposition du CTR et décision du Responsable U14".

**The USTA is the one mechanical exception.** Development Grants attach to a published ranking table
by age – a 16-year-old boy inside ITF Juniors 150 or ATP 1220 qualifies for the maximum – and the
player simply applies the following quarter. No nomination, no panel.

**Read for design: ranking buys the right to be looked at; a person decides.** That is four of the
brief's four mechanisms operating at once, in a fixed order.

### Full or partial, and for how long

**Partial, and short.** Not one full ride at a named academy was found. RNA/Movistar covered 25%.
LTA agreements run "minimum of 1 year or maximum of 2 years". Tennis Australia awards "a scholarship
for a minimum of 12 months" and then reassesses. The USTA re-tests every quarter. France's underlying
statutory athlete list is valid "deux ans" for Elite and "un an" for Relève and Senior.

**And what a funded place is worth, against our scale**: LTA National Junior Grant up to £5,000
(**0.23×**), LTA International Junior Grant £10,000-£20,000 (**0.45×-0.90×**), USTA Development Grant
~$20,000/yr (**0.90×**), USTA maximum across all three grant types "up to $40K" (**1.81×**), ITF
GSPDP $12,500 / $25,000 / $50,000 (**0.57× / 1.13× / 2.26×**), RNA/Movistar 25% of ~€56,000 ≈ €14,000
(**0.63×**).

## 5. Can a place be lost?

**A funded place: yes, everywhere it is published, and on named criteria.**

- **LTA National Academy** §5.5, re-selection or non-renewal: each player is formally reviewed by the
  Selection Panel and "will then either have their agreement renewed… or not". The criteria include
  "A player's ranking trajectory against their age and stage", progress against the individual
  development plan, **academic exam results** – specifically "to allow for successful admission into
  the following year group" – and continued adherence to the code of conduct. Appeals lie only on
  "a procedural defect" or "an error of fact"; a player never shortlisted cannot appeal at all.
  Its Regional centres say the same in one line: "RPDC player agreements are reviewed annually by
  each RPDC, and reselection is based on a player's progress against their agreed goals."
- **Tennis Australia**: "At the conclusion of this period, each player will be reassessed against the
  relevant age criteria. Players must also maintain their commitment throughout the scholarship
  period to retain their status in the program."
- **USTA**: quarterly re-qualification against a published ranking table, which is the harshest
  cadence found – a bad quarter costs the next quarter's grant.
- **France**: the underlying ministerial high-level-athlete list expires by statute (one year for
  Relève and Senior, two for Elite), and the FFT records a non-renewal trigger unrelated to results –
  players "qui n'étaient pas à jour de leur suivi médical règlementaire".
- **IMG financial aid**: "financial aid will continue to be reviewed on an annual basis. If there
  have been any changes to your financial situation, you will need to re-apply each year", and
  "Financial aid is limited, and additional assistance is NOT guaranteed."
- **Canada** puts it most bluntly of anyone, in the Sport Canada athlete-carding criteria: "Athletes
  who are awarded carding for a given year and who meet all criteria are not automatically
  guaranteed carding the following year." ⚠ The PDF located is the **Paralympic/wheelchair**
  programme's criteria, not the able-bodied one; the sentence is quoted for its shape, not as a rule
  governing junior tennis.
- **The ITF GSPDP publishes no renewal or loss rule**, but its own recipient lists show the review
  happening: one player's grant moved from **US$50,000 in 2025 to US$25,000 in 2026**. ⚠ That is
  evidence of annual re-assessment, not a published rule.

**A full-fee place: no. And the contrast is stated inside a single IMG document.** Its Perpetual
Tuition Enrollment Agreement says a student-athlete "is automatically re-enrolled for each subsequent
academic year" and will be "enrolled until graduation or until the parents or school decides the
student-athlete will not return", describing the place as secure. **No performance condition is
attached to it anywhere.** The school reserves an unexplained right to decide a student will not
return, and publishes no criteria for exercising it.

⚠ **Not found, after searching seven academies**: any published performance requirement for the
*continued* enrolment of a fee-paying player. The only performance-conditional continuation language
in this entire body of research belongs to federation grants and foundation places – never to a
place that was bought.

**Two exit costs worth knowing**, because they make leaving expensive rather than free. The LTA bars
a player who declines or leaves its national academy from "a place at, or able to use funding for an
equivalent, domestic or international academy before the age of eighteen" without panel agreement.
The USTA claws back **all** grant money if a recipient later chooses to represent another country.

**Admission is not quite "оплатил и пошел", either.** There is a floor and, at two of the flagships,
a paid trial. Rafa Nadal Academy requires "intermediate-advanced level", assessed by video or an
in-person test with UTR considered. Mouratoglou runs a **mandatory selection week** covering tennis,
fitness, academics and a medical, and states "only 200 spots available" in its Tennis-Studies
programme. Evert requires a one-week on-campus evaluation before a boarding place. IMG, by contrast,
advertises its tennis programme to "individuals of all ages and skill levels". **So: a skill floor
and sometimes a trial, and above that line money is sufficient.** The owner's model survives with a
footnote.

## 6. The federation route – the third thing, and it is not what we assumed

This is neither "pay an academy" nor "hire a coach", and it comes in **three distinct shapes**:

**(a) A cash grant against a private coach the family keeps.** The dominant product. USTA at every
level ("Subsidizing travel to Lake Nona for training weeks" and "expenses associated with competing
in tournaments"), LTA above age 14, Tennis Australia's NDP Connect tier. **The federation buys the
tournaments and leaves the coaching purchase exactly where it was.**

**(b) A subsidised place in a centre the family co-pays.** LTA Regional Player Development Centres
("RPDCs should use the LTA grant to reduce the overall cost of programmes" – the per-centre figure is
not published); FFT's Centres Fédéraux d'Entraînement; Tennis Australia's NDP Full.

**(c) A residential place.** Loughborough (LUNTA), the FFT's Pôle France Poitiers and CNE at
Roland-Garros, Tennis Australia's NTA Central in Brisbane. **Only this shape removes the parent from
the coaching decision** – which is exactly what the spec says an academy place does.

### The family still pays, and two federations publish how much

- **Tennis Australia, National Development Program brochure, 2025**: "All levels of support require a
  contribution from the athlete's family." NDP Full **A$3,750 per quarter (≈A$15,000/yr, 0.68×)**;
  NDP Wildcard **A$5,000 per quarter (≈A$20,000/yr, 0.90×)**; NDP Connect and NDP Support **A$1,500
  per quarter (≈A$6,000/yr, 0.27×)**. **Travel is the part TA covers**: "all costs of flight &
  accommodation will be covered by Tennis Australia for an approved schedule", reviewed quarterly.
- **FFT**, Centre Fédéral d'Entraînement, Ligue Auvergne-Rhône-Alpes tariff, 2022/23: five-day
  formula **€5,000**, schooling **€4,500**, so **~€9,500/yr (0.43×)** before lodging, which is
  "prise en charge par la famille en supplément". Tournaments cost the family **€60 per night in
  France and €100 per night abroad** across a minimum of eight events. A player on the ministerial
  high-level list gets aid worth **one third of the cost** – merit reducing a price, not erasing it.
  ⚠ The FFT's own performance plan states the financing model in two words per tier: CFE = "Parents +
  Ligue/Comité", Pôle France = "Parents + DTN".

**Britain and the United States publish nothing about family cost** – and in the LTA's case that
silence covers the most expensive items in the whole document, board and private-school fees at
Loughborough. **The USTA has no free residential place at all**: its Junior phase is "training weeks"
at Lake Nona and players keep their private coaches, while the National Campus's own high-performance
academies are commercial and unpriced.

**A "free place" is close to a myth.** Not one federation examined publishes a fully-free residential
junior place.

### One federation product our game does not have and probably should

The **USTA's junior Grand Slam grant pays $1,250 to the player per main draw at three junior Slams –
and $1,250 to the personal coach who travels with her**, conditional on the coach being full-time,
Safe Play approved and submitting a flight itinerary. It is the clearest published statement anywhere
that a federation will pay for **the coach the family already chose** to be at the tournament. That
is a mechanic, not a flavour note.

### Selection headcounts, which are the real story

France's Pôle France Poitiers is specified at **"4 à 6 filles"** aged 12-15 and 9-12 boys. The CNE's
2024 intake was **twelve players** across both sexes. Britain runs **one** national academy, whose
overview page lists **9 named players**, with **23 enrolled cumulatively since 2019**; its funded
ladder above that is 1 International Junior Grant recipient, 6 on the Pro Transition Programme and 10
on the Pro Scholarship Programme (2026). The LTA states there is "no minimum or maximum number of
places… but there is a budget limit for scholarships across all LTA Programmes".

**Scarcity, as a real number: a large tennis nation funds single digits per birth year.**

### Two dead ends worth recording so nobody searches them again

**Tennis Canada publishes the least of any federation examined** – cost to family, annual review and
selection criterion are all unpublished, which is the thinnest process in the set. Its National
Tennis Centre is an explicit copy of the French model, built by Louis Borfiga after he ran the
equivalent programme for the FFT.

**Olympic Solidarity is not a junior pathway and should not be modelled as one.** There is no tennis
allocation; the scheme caps each National Olympic Committee at six individual scholarships across
*all* sports at **USD 1,500 a month**, and prioritises NOCs that had 50 or fewer athletes in
individual sports at Paris 2024. Its published withdrawal rules include withdrawal for "failure to
qualify for LA28" – which makes it an Olympic-qualification instrument aimed at small nations, not a
route a fourteen-year-old takes.

## 7. Do top juniors actually go through an academy?

**Nobody has counted it, and that is the finding.**

Searched across the talent-development literature, federation reports and journalism. The studies
that exist measure **ranking trajectories and ages** and never code the training environment:
Kovacs et al. (2015) on how the ATP top 100 arrived – ages at top-1000, top-500, top-300, top-200,
top-100 – has no environment variable in its table at all; a 2024 PLOS One study of 240 World Junior
Tennis Finals players (2012-16) reports that 62.1% reached an ATP ranking and 42.95% the top 500, and
states that other factors "were not examined within the scope of this study". A 2023 ITF *Coaching &
Sport Science Review* paper relates courts, clubs and certified coaches to ranked players **at country
level**, not individual pathways.

⚠ **Do not put a percentage in the spec.** There is not one to use, and inventing one would be the
exact failure this document exists to prevent.

**What is counted, and points away from academy dominance:**

- **The federation route is minute** – §6's headcounts. Nine players at Britain's national academy;
  four to six girls at France's national pole.
- **One alternative pathway HAS been counted, and it is small but real**: 15 of the ATP top 100 and
  5 of the WTA top 100 had US college ties as of 18.03.2024 (Intercollegiate Tennis Association).
  ⚠ Secondary, and the source page could not be fetched directly – two independent retrievals agreed.
- **The junior tour is a strong filter, but says nothing about where they trained**: 83% of ATP and
  86% of WTA top-150 players had previously been ITF Junior top-100. ⚠ Secondary, full text not read.
- **Academy capacity is bounded**: Mouratoglou's Tennis-Studies programme states "only 200 spots
  available", across all ages and both sexes.

**The anecdotal picture, flagged as anecdotal**, clusters toward family plus a private coach or a
small coach-owned academy rather than a large residential one: Nadal with his uncle, the Williams
sisters after being withdrawn from an academy, Tsitsipas, Zverev and Ruud with fathers, Sinner with a
private coach, Alcaraz at Ferrero's Equelite – an academy owned by his own coach. Against that,
Djokovic went the academy route. **The set is self-selecting toward famous stories and must not be
counted.**

## 8. Everything against our scale, in one table

Our `middle` family earns **$22,100 a season**; `working` **$12,740**; `wealthy` **$39,000**. Our
coach ladder at ages 12-16, middle corridor, `BALANCED` plan, coach + court, over 52 weeks
(`docs/research/real-coaching-costs.md`):

| our rung | weekly | per season | vs middle income |
|---|---|---|---|
| `self` | $100 | $5,200 | 0.24× |
| `budget` | $150 | $7,800 | 0.35× |
| `middle` | $250 | $13,000 | 0.59× |
| `high` | $400 | $20,800 | 0.94× |
| `elite` | $600 | $31,200 | **1.41×** |

Laid against the real ladder:

| real rung | real figure | vs middle income | where it lands on our ladder |
|---|---|---|---|
| a single camp week | $850-$2,500 | 0.04×-0.11× | below `self` for one week; ~`middle` for six |
| federation contribution, TA Connect | A$6,000 | 0.27× | between `self` and `budget` |
| Rick Macci afternoon-only | ~$9,000 | 0.41× | `budget` |
| FFT regional centre + schooling | ~€9,500 | 0.43× | `budget` |
| Evert Afternoon Academy 12&U | $13,000 | 0.59× | **exactly `middle`** |
| Tennis Australia NDP Full | A$15,000 | 0.68× | between `middle` and `high` |
| SotoTennis after-school, full year | ~€18,755 | 0.85× | just under `high` |
| Van der Meer PM only | $22,450 | 1.02× | just over `high` |
| SotoTennis full-time day | ~€30,855 | 1.40× | **exactly `elite`** |
| Justine Henin day, 10 months | €32,945 | 1.49× | just over `elite` |
| Evert Academy day ⚠ no school | $36,150 | 1.64× | **above everything we sell** |
| Justine Henin boarding, 12 months | €52,745 | 2.39× | – |
| round 5's «~$55k» | $55,000 | 2.49× | – |
| Saddlebrook boarding | $76,915 | 3.48× | – |
| **IMG Academy boarding** | **$99,900** | **4.52×** | – |

**Three things fall out of this table and they are the most useful output of the whole document.**

1. **Our coach ladder already covers the real market from a summer camp to a full-time day
   programme.** The correspondence at the two ends is uncanny: our `middle` coach costs what Evert
   charges 12-and-unders for afternoons, and our `elite` coach costs what SotoTennis charges for a
   full-time day place. **We did not underprice the coach.**
2. **The academy is not a rung above `elite`. It is `elite` plus a bed plus a school.** Everything
   between 1.4× and 4.5× is board, tuition and the residential overhead – not more tennis.
3. **Round 5's «~$55k» is not too big for an academy. It is too big for THIS family.** At 2.49× a
   middle income it sits mid-band among real residential fees, and it is 1.41× the entire income of
   our *wealthy* family. A `wealthy` career could not buy it out of income either – only out of
   starting reserves, and not for four seasons running.

## 9. Data-quality flags

- **Primary and verified**: IMG Academy's 2026-27 and 2025-26 tennis rate cards (downloaded as PDF
  and read as extracted text; the 2026-27 figures were independently re-fetched and confirmed while
  writing this document), Evert Academy's 2026-27 tuition page, Saddlebrook Prep's 2025-26 tuition
  page, Weil Tennis Academy's 2026-27 tuition and fees page, SotoTennis's 2025-26 Full-Time Player
  Information pack and payment terms, Justine Henin Academy's programme pages, Ferrero/Equelite's
  annual competition page and parent travel rules, Emilio Sánchez Academy's Barcelona and Naples
  price grids, ES American School's 2026-27 costs and fees PDF, Good to Great's programme pages,
  Rafa Nadal Academy's 2026 annual programme brochure, Mouratoglou's own booking engine, and the
  LTA, USTA, Tennis Australia and FFT selection and pathway documents cited in §4-§6.
- ⚠ **The three most famous annual programmes publish no price**: Rafa Nadal Academy, Mouratoglou
  and Sánchez-Casal Barcelona. This was verified by reading their own 2026 brochures cover to cover
  and checking the local-language versions of their sites, not merely by failing to find a page.
  Every number attributed to them here is secondary and dated.
- ⚠ **Several current price pages carry no season label.** Emilio Sánchez Naples's annual grid and
  Sánchez-Casal Barcelona's weekly grid were read on 10.08.2026 and are presented as current, not as
  dated to a stated year. Ferrero's monthly figures are inferred to be 2026 from PDF upload dates.
- ⚠ **Headline fees are not like-for-like, and schooling is the reason.** IMG, Saddlebrook, RNA and
  ESA Naples bundle school; Evert, Henin, Ferrero, SotoTennis, Van der Meer and Macci do not; Good to
  Great has none. A table that ignores this overstates the bundlers and understates the rest by
  roughly a school year – **€3,500 to €22,000**, which is itself a spread of 6×.
- ⚠ **No currency conversion is applied anywhere in this document.** EUR, GBP, AUD and SEK figures
  are quoted as published and their ratios to our dollar income are taken at face value. A real
  conversion would move every non-USD ratio; the *ordering* is robust, the decimals are not.
- ⚠ **IMG camp prices and Mouratoglou camp prices are dynamic.** IMG's page states prices are valid
  for a few hours and rise nearer the date; Mouratoglou's booking engine returns different prices for
  different calendar weeks, a 2.2× swing on the same product. Weekly figures are ranges for a reason.
- ⚠ **The RNA/Movistar scholarship is 2020-21.** Twenty places at 25% of the fee, Spanish passport or
  residence, tennis and academic merit. No current published equivalent exists and the 2026 brochure
  does not mention scholarships. Cite it for shape, not for currency.
- ⚠ **Two Champ'Seed facts are self-reported and promotional**: its claims to have supported Coco
  Gauff and Stefanos Tsitsipas come from its own site. The 12-player current roster and the four
  published criteria are also its own, but they are checkable statements of policy rather than
  marketing about outcomes.
- ⚠ **Not found, after explicit searching**: any academy's published scholarship count; any academy's
  published performance requirement for continued fee-paying enrolment; any published renewal or
  revocation rule for Champ'Seed or the ITF GSPDP; any published family-cost figure for the LTA
  National Academy, the FFT's Pôle France or CNE, Tennis Australia's National Tennis Academy, or the
  USTA National Campus's high-performance programmes; **and any counted breakdown of top juniors or
  top-100 professionals by training environment**.
- ⚠ **Bruguera Tennis Academy appears to be closed** – its domains no longer resolve, and a January
  2026 directory lists it as closed. It was on the original target list; it is not in the tables.
  ⚠ **`nickbollettieri.co.uk` is a squatted domain** now serving gambling content and must never be
  cited; Bollettieri's academy was absorbed into IMG in 1987 and no separate successor programme with
  published fees exists.
- **The ITF GSPDP 2026 figures are primary and verified**: the ITF's own recipients release of
  21.01.2026, read as a PDF, publishes the 65 players, the 42 countries, the three grant tiers
  explicitly rather than by derivation, the junior and professional age bands, and the "over US$68
  million since inception". ⚠ Two caveats: the release and the ITF programme page state the criteria
  differently (see §4), and **no renewal or loss rule is published** – the annual re-assessment is
  inferred from one player's grant halving between 2025 and 2026, not from a stated rule.
- ⚠ **Germany and Spain were on the target list and are not in this document.** The DTB and RFET
  research stream did not report and no fresh work was started on it. German federations publish
  numeric *Kadernormen* selection thresholds, so DTB is the better of the two if a further country is
  ever wanted. Nothing here should be read as a claim about either country.
- **§7's college figure** (15 ATP, 5 WTA top-100, 18.03.2024) could not be fetched directly and rests
  on two independent retrievals of the same ITA article that agreed. Directionally solid, decimals
  provisional.

## 10. ⚠ MY RECOMMENDATION – this section is a proposal, not a finding

Everything above is what the sources say. Everything below is what I think we should do. As in
`retirement-and-withdrawal.md`, it is split into **what reality settles** – where we would need a
reason to deviate – and **what remains the owner's design choice**, where reality offers a menu or is
silent. Conflating those two is the failure this document exists to prevent.

### 10.1 The four questions, answered in our units

**Q1 – How many rungs? REALITY SETTLES THE SHAPE; THE COUNT IS OURS.**

Reality settles that the ladder is **flat within a year and steep across durations**: 1.4×-2.3×
between an academy's own products, and 5-6× from the cheapest annual programme to the dearest. It
does **not** hand us a rung count, because the real rungs are duration-shaped and our season is not.

My proposal, three rungs plus a fourth that is honestly wealthy-only:

| rung | our price/season | vs middle income | its real-world twin |
|---|---|---|---|
| **local squad** | **$9,000** | 0.41× | a federation centre contribution, an afternoon academy |
| **day place** | **$22,000** | 1.00× | Van der Meer PM, SotoTennis after-school |
| **full-time day** | **$33,000** | 1.49× | SotoTennis Option A, Henin day |
| **residential** | **$70,000** | 3.17× | Weil, Evert Developmental, Saddlebrook |

**Top:bottom = 7.8×, and every rung is a real programme that exists.** The gaps are 2.4×, 1.5×, 2.1×
– which is the real market's shape, not a geometric invention.

⚠ **The one thing I would argue hardest for**: the *residential* rung must be visibly a different
kind of thing, not just a dearer one. In life it costs 3× more because she moves out of the house.
Charging 3× for "more tennis" would be the tax §1b of the spec warns about.

**Q2 – What does the fee include? REALITY SETTLES THIS, AND IT CONTRADICTS THE SPEC IN ONE PLACE.**

Reality is unambiguous on all three of the spec's bundled bills, and it agrees on two:

* **The coach – YES, in the fee.** Confirmed universally. And confirmed with the sharpest edge the
  spec asks for: the fee buys a **group programme** with 15-23 hours a week, and the individual hour
  is an upsell everywhere. "You do not pick" is exactly right, and it is stronger than the spec
  claims: at a real academy you do not pick, and you also do not get one-to-one unless you pay again.
* **The court – YES, in the fee.** It is never a line item anywhere. `facilityRateCents` should
  simply stop being charged.
* ⚠ **Part of the travel – NO. This is the one place the owner's model and reality part company.**
  Tournament travel, hotel and entry fees are **outside** the headline fee in every academy found.
  What is often inside is the **coach's presence at the tournament**, which is a different thing.

**But the model is rescuable without changing it much, and reality shows exactly how.** Three
sellers re-bundle travel as a **second, separately-priced product** – Weil at $7,000/yr, IMG at
$4,500 plus a deposit, SotoTennis at €700-€1,300 an international week. So my recommendation is:

> **Sell the academy place and the travel package as one purchase, and say so.** Keep
> `travelCoverShare` – it is exactly right in mechanism – but present it as *"the fee includes the
> tournament programme"* rather than *"the fee includes part of the travel"*. It costs nothing to
> implement, it is what three real academies do, and it stops the spec asserting something no rate
> card supports.

⚠ **And the schooling line should stay out of the game.** Real fees split 50/50 on whether school is
bundled, the spread is 6× (€3,500-€22,000), and we do not model schooling as money. Bundling it
silently is the single easiest way to make our number incomparable to any real one.

**Q3 – Scholarships: how many, decided how? REALITY SETTLES THE MECHANISM. THE COUNT IS OURS AND IT
HAS NO REAL ANCHOR.**

*Settled by reality*, and pleasingly it is what §1c of the spec already proposes:

* **Scarcity, not a threshold.** No academy publishes a quota; the countable programmes carry 6, 12,
  20 or 65 players **worldwide**. A rank against the field is the right instrument and a static bar
  is the wrong one – which is also what `ECONOMY.sponsorship`'s failure taught us on 30.07.
* **Ranking gates the shortlist; a person picks from it.** Four mechanisms in a fixed order –
  threshold, nomination, panel, override. `reviewLevel`'s existing inputs already encode the first
  and third of these, and `scoutWeight: 0.5` is a fair rendering of "the panel may override the
  criteria if potential is observed".
* **Merit decides the place, need decides the money.** Champ'Seed lists potential, age, ranking
  **and** financial need as four separate criteria. `needFactor` is not an unrealistic invention; it
  is one of the four things a real selection committee weighs, held separately from the others.

*Not settled, and it is the owner's call*: **k, the number of funded places per rung.** No academy
publishes one and the foundations' numbers are worldwide rather than per-institution. §4/2 of the
spec's ship rule is the right instrument and there is no external number to import.

My instinct, offered as instinct: **the lowest rung has several, the top rung has one or none** –
which is what the spec already guesses and what the real distribution looks like (federations fund
single digits per birth year at the top; camp weeks are near-universally available).

⚠ **What reality DOES settle is the VALUE, and this is the actionable number.** A real funded place
is worth **0.23×-1.13×** a middle family's season income, i.e. **$5,000-$25,000 a season in our
money**. Our academy currently books **$948 of `academy` income across four seasons** while 50 of 50
careers hold a scholarship. Even granting that most of the value arrives invisibly as a travel
discount, **the legible part is about 1% of what a real funded place is worth.** If the bundled fee
ships, that gap becomes glaring: the money will leave as a visible line and arrive as nothing.

⚠ **And full rides do not exist.** The only academy scholarship with a published size covers **25%**.
Every federation product is a cash grant far below the cost of a place. If our funded place is 100%
of the fee it is more generous than anything in the sport – which may be the right game decision, but
it should be a decision.

**Q4 – Can a place be lost? REALITY SETTLES THIS COMPLETELY, AND THE ANSWER IS AN ASYMMETRY.**

* **The funded place: reviewed every year, and losable.** On named criteria: ranking trajectory,
  progress against a plan, conduct, and – at the LTA – exam results. Cadences range from quarterly
  (USTA) to two years (French Elite list), with **annual as the clear centre of gravity**.
* **The bought place: not losable.** Automatically re-enrolled, no performance condition published
  anywhere in the sector.

**So the spec's §5.4 answers itself: yes, and only for the funded place.** That is not a second
review system – it is `reviewAcademy` doing what it already does at the season boundary, plus the
rule that a full-fee place simply renews.

⚠ **I would go one step further than the spec, because reality is emphatic about it.** The story is
not "she lost her place". It is **"she kept her place and lost her funding"** – and for a `working`
family, where `needFactor` is 1, those are the same sentence. **Losing the funding IS losing the
place, but only for the family that needed it.** That is the same constant doing the same work as in
§0 of the spec, at the other end of the relationship, and it costs nothing to implement.

The one thing I would **not** port is the LTA's lock-in clause – barred from funded alternatives
until 18. It is real, it is interesting, and it is a punishment for a choice, which this project does
not do («мы ни за что не наказываем»).

### 10.2 The question only this research can settle: does the weekly coach market become a minority path?

**My answer: no, and it is the truth rather than a problem. Three reasons, in order of how much
weight I put on them.**

**1. The premise is unproven, and I looked hard.** "Almost every top junior goes through an academy"
is an assumption nobody has tested. The pathway literature measures ranking trajectories and never
codes the training environment; no federation report, paper or survey counts it. **We would be
rebuilding our economy around a statistic that does not exist.**

**2. The arithmetic forbids it, in our game and in life, for the same reason.** Every published
annual academy fee is **1.4×-4.5×** a middle family's entire season income. A market whose cheapest
serious annual product costs 85% of what the parents earn cannot be the modal path for families like
ours – and it is not, in life, which is why the after-school rung and the summer week exist at all.
**Our game's family is not an IMG family and should not pretend to be.**

**3. The strongest evidence for academy dominance – the federations – actually argues the opposite,
twice.** First, the federation route is **numerically minute**: nine players at Britain's one national
academy, four to six girls at France's national pole. Second, and more decisively, **the dominant
federation product is a cash grant handed to a family that keeps its own coach** – USTA at every
level, LTA above 14, Tennis Australia's Connect tier. The USTA will even pay **$1,250 to the personal
coach** to travel to a junior Slam. **The richest tennis federations in the world, given a talented
junior and a budget, mostly choose to fund her existing coaching arrangement rather than move her
into a residential academy.** That is a direct real-world endorsement of the system we have just
built.

**So the honest reading is the reverse of the worry.** The weekly coach market is not the minority
path that an academy would eat. **Our `elite` coach at $31,200 a season already IS a full-time day
academy at real prices** (§8) – we have been selling academy places all along and calling them
coaches. What the academy adds on top is board, school and a residential overhead: 1.4× → 4.5×, and
almost none of that increment is tennis.

⚠ **The thing we are actually missing is not the academy. It is shape (a) from §6: money given to a
family that keeps its coach.** A merit-won grant that pays for tournaments while leaving the coach
choice alone is the commonest real support mechanism in the sport, it is what our academy scholarship
*already effectively is* (a travel discount), and it fits the game we have rather than competing with
it. **If only one thing ships from this research, I would ship that** – and I would ship it visibly,
because §4/2 of the spec cannot measure what the bench cannot see.

### 10.3 What reality does not settle, and where I would stop looking

- **k, the funded-place count.** No external anchor exists. Sweep it; do not search for it again.
- **Whether board is modelled at all.** Reality says board is 20-30% of the fee and 0.50×-1.05× of a
  season's income, and it is a real thing that happens to a fourteen-year-old. Whether that becomes a
  price line, a story beat, or both is entirely a design choice. **My view, as opinion: take the
  beat, and fold the money into the top rung's price rather than itemising it.** A separate "board"
  line is a second bill on a screen that already has three.
- **Whether the top rung exists for anybody.** §8 says a `wealthy` career earns $39,000 a season and
  a residential place costs ~$70,000. So the answer is arithmetic: **at these prices the top rung is
  reachable only from starting reserves, and not for four seasons running.** That is defensible –
  the real one is reachable by very few families too – but the spec is right that it should be
  chosen rather than fallen into.
- **The trial week.** Two flagships require a paid assessment before admission. It is a real, cheap,
  flavourful gate and it would sit naturally beside the funded-place competition. **I am not
  recommending it** – it adds a step to a purchase and the game does not need another screen – but it
  is the honest answer to anyone who objects that "оплатил и пошел" is too simple.
