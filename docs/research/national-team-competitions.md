---
type: research
status: current
area: simulation-and-balance
canonical: false
last-reviewed: 2026-08-10
---

# National team competitions – what exists, and what a week of it is worth

Compiled 2026-08-10. Answers the owner's question: *«вроде бы бывают какие-то типа "теннисные
чемпионаты мира", где сборные разных стран играют… Есть ли какие-то национальные соревнования без
индивидуального зачета? Навроде Олимпиады, когда на 1-2 недели спортсмены едут куда-то.»*

**He did not imagine it, and the answer is larger than he expects.** The ITF runs national team
championships at 14-and-under, 16-and-under and senior level; Tennis Europe runs two more at 12U to
18U; the IOC runs the Olympic tennis event; and the WTA and ATP jointly run a mixed-team event in
January. **Two of them sit exactly in this game's age band.** Primary sources throughout – the 2026
ITF Junior Team Competition Regulations, the 2026 ITF World Tennis Tour Juniors Regulations, the 2026
Billie Jean King Cup Regulations, the 2026 WTA Official Rulebook, the Paris 2024 ITF Olympic Tennis
Event Regulations and the ITF's LA28 eligibility rule, all downloaded as PDFs and read as extracted
text. Every dated or secondary figure is flagged in §10. Nothing here changes game logic; §11 is a
recommendation for the owner and is labelled as such.

## 0. The headline

1. **Yes, and the ITF calls them world championships in as many words.** 2026 ITF Junior Team
   Competition Regulations, Reg 1: "The International Tennis Federation **Team Championships** for
   boys and girls aged 14 years and under, shall be called the '**ITF World Junior Tennis**'
   Competition"; the 16-and-under championships are "**Davis Cup Juniors**" and "**Billie Jean King
   Cup Juniors**". The ITF's own reporting on the 2026 edition has the sixteen finalist nations
   competing "for the title of world champions". The owner's half-memory is accurate down to the
   vocabulary.
2. **⚠ NO PRIZE MONEY ANYWHERE AT JUNIOR LEVEL – AND POINTS THAT DEPEND ON OTHER PEOPLE.** The 79-page
   2026 Junior Team Competition Regulations contain **no prize-money provision at all** and never
   mention ranking points; the points live in the *Juniors* regulations, and their shape is the
   finding. **WTT Juniors Reg 31 carries a dedicated "International Team Competitions" row** whose
   columns are the round in which she won her rubber:

   | | F | SF | QF |
   |---|---|---|---|
   | **#1 Player Win** | **95** | 75 | 50 |
   | #2 Player Win | 75 | 50 | 20 |
   | Doubles Win | 75 | 50 | 20 |

   Two footnotes carry the whole meaning: "**Points are to be given to a player for one result only
   (their best) in the competition**" and "**Only players from the best 8 teams will be considered for
   allocation of World Ranking points**". So the ceiling is **95 points, once** – less than a J100
   title (100) and under a third of a J300 title (300) – **and it is unreachable unless her nation
   finishes in the top 8.** Reg 11 additionally excludes these points from the ranking tie-break
   countback, in singles and doubles.
   → **This is the only thing in reach of our game where a player's own reward is decided by other
   people's results.** Everywhere else on our ladder she is paid on her own finish. (The pattern is
   not unique in the sport – Tennis Europe pays bench players and the United Cup pays team-win money
   to everyone on the squad – but both of those sit outside anything we model.)
3. **⚠ And a European girl is paid twice, in a currency we do not model.** Tennis Europe's regulations
   carry points tables for "TEAM EVENT (Winter/Summer Cups)" at every age band, and also award
   **Tennis Europe** points to European players reaching the top 8 of the ITF world finals. Those
   points are **additive** – team results count on top of the six best singles results, so playing for
   her country can never cost her ranking position – and they carry an **active/inactive split**, so a
   squad member who never takes the court still scores (16U Finals winner: 220 active, **120
   inactive**). This is the two-disjoint-ladders structure `ranking-points-by-tier.md` §3 already
   documented for USTA and LTA: **an ITF point and a regional point are different money, and there is
   no exchange rate.**
4. **The senior Billie Jean King Cup awards no WTA ranking points either.** The 2026 WTA Ranking Point
   Chart (§VIII.A.5) has rows for Grand Slams, WTA 1000/500/250/125 and ITF W100 down to W15. There is
   no BJK Cup row and no Olympic row. The rulebook's glossary gives the game away: a "Tennis Event"
   includes any ITF event "(including World Tennis Tour and Billie Jean King Cup), Olympic or Olympic
   Qualification event, or Exhibition/Non-WTA Event, **regardless of whether ranking points are
   awarded**". That trailing clause exists because these award none.
5. **Exactly one competition in this family pays WTA points, and it is the mixed one.** The same
   §VIII.A.5 note directs the reader to "Section VI and Appendix L for ranking points awarded at the
   WTA Finals and **United Cup** respectively". United Cup pays on a match-wins ladder – 5 wins = 500,
   1 round-robin win = 32, 0 wins = 1 – counting as one of her best six results (Appendix L §J).
   **The women's national team championship pays nothing; the mixed team event pays like a WTA 500.**
6. **The calendar cost is one week, and the regulation says so.** Junior Team Regs Reg 4: the final
   stages are played "at one venue **during one week**". A junior on a nation that must qualify plays
   one qualifying event in spring and, if she gets through, one Finals week in summer – **two weeks a
   year, maximum**. The senior BJK Cup has the same structural ceiling, because no nation occupies
   more than two stages of one edition. The Olympics is 9 competition days but the NOC may claim her
   for a preparation period of up to 14 days beforehand – realistically 2 to 3 weeks.
7. **She does not choose, and she is not asked.** Junior Team Regs Reg 21: the **National Association**
   nominates three players in an order of merit. Senior BJK Cup Reg 37.1 is the same, and Reg 41.1
   then hands the choice of who plays to the **captain alone**. BJK Cup Reg 13.6 is headed "**No right
   to participate**". There is no consent clause anywhere in either document.
8. **⚠ Nor may she decline, and the enforcement is unusually sharp.** BJK Cup Reg 13.1.1.3(d) makes it
   a **Good Standing criterion** – a condition of eligibility – that "she makes herself available for
   selection for Official Team Championships **and the Olympic Tennis Event**". Her own National
   Association decides whether she met it (13.1.2.1), and criterion (d) is **expressly outside** the
   grounds reviewable by the ITF Internal Adjudication Panel (13.1.2.2(i)). A federation's finding
   that she made herself unavailable is effectively unappealable.
9. **The Olympics is the payment.** ITF *Eligibility for the Olympic Tennis Event – LA28* (version as
   of January 2026), para v: she must have been "part of the final nominated … team, and **present at
   the Tie/Event**, on a minimum of **two (2) occasions** during the Olympic Cycle, provided that
   **one of those occasions is in either 2027 or 2028**". Nomination plus presence – she need not hit
   a ball. **This is the whole economic logic of the senior team competition: it pays no points and,
   below the Finals, no prize money, and it is the toll gate to the Games.**
10. **A team is three players.** Junior Team Regs Reg 20: "Each team shall consist of **three (3)
    players** and a non-playing Captain." A tie is two singles and one doubles (Reg 39). The same
    three-plus-captain shape governs the Tennis Europe cups. Senior BJK Cup nominates three to five.
11. **⚠ The one week of the year the family does not pay for – and at the Finals the ITF buys the
    plane ticket.** Junior Team Regs Reg 12: the Host Nation provides accommodation, all three meals
    and court facilities for all thirty-two teams, and "**The ITF will provide air tickets for three
    (3) players and a non-playing Captain of each team that qualifies for the final stages**". At
    regional qualifying the host still feeds and houses them (Reg 66) but "Each participating National
    Association is responsible for its own travelling expenses". In a game whose central tension is
    what a season costs a family, **this is the one point in the whole junior pathway where the sport
    pays for her instead of the reverse.**

## 1. The family, in one table

Only competitions where a player represents a **country**. Club leagues, invitational continental
teams and professional franchise leagues are excluded and named in §8, so the list is honestly
bounded.

| Competition | Body | Age | Team | Individual points | Prize money | Weeks/yr |
|---|---|---|---|---|---|---|
| **ITF World Junior Tennis** | ITF | **14 & under** | 3 + captain | **≤95, top-8 nations only** | **none** | 1–2 |
| **Billie Jean King Cup Juniors** | ITF | **16 & under** | 3 + captain | **≤95, top-8 nations only** | **none** | 1–2 |
| **TE Winter Cups** | Tennis Europe | 12U / 14U / 16U | 3 + captain | **Tennis Europe points** | none | 1 |
| **TE Summer Cups** | Tennis Europe | 12U / 14U / 16U / **18U** | 3 + captain | **Tennis Europe points** | none | 1–2 |
| **Billie Jean King Cup** | ITF | 14 and over | 3–5 + captain | **none** | Finals only | 1–2 |
| **Olympic Games** | IOC / ITF | **15** and over | ≤6 per NOC, no team event | **none** | **none, prohibited** | 2–3 |
| **United Cup** | WTA / ATP | WTA AER applies | 4–6, mixed | **yes – up to 500** | **yes – large** | 1–2 |
| Davis Cup / Davis Cup Juniors | ITF | men / 16&U boys | – | – | – | – |

The 14U and 16U rows are the ones that matter: they are the only entries live from the game's first
season.

## 2. ITF World Junior Tennis – the 14-and-under world championship

**This is the game's own age band.** Our kid starts at 14.

**2.1 Age and eligibility.** Junior Team Regs Reg 26(a) defers to the Age Eligibility Rules, and WTT
Juniors Appendix G states them exactly. For the **2026** edition competitors "must have been born
between … **2012-2015** and must have reached their **11th birthday** on or before the first day of
Competition" (2027: 2013–2016; 2028: 2014–2017). The band therefore runs roughly **11 to 14**. Reg 27
requires an active ITF Juniors IPIN at qualifying and Finals (recommended but not mandatory at
regional pre-qualifying). Reg 27.1: a player may represent **one nation only** across World Junior
Tennis, Davis Cup Juniors, Billie Jean King Cup Juniors **and the Youth Olympic Games** – the four are
one lifetime commitment.

**2.2 Team size and format.** Reg 20: **three players and a non-playing captain**; three must be on
site, and a two-player team may compete only with written ITF approval on grounds of health, injury,
bereavement or exceptional circumstance. **Reg 28 – the Captain**: at least **24 years old** by
year-end, **no playing captains**, may be of any nationality, must hold a nationally recognised
coaching qualification and complete the ITF Academy safeguarding course, and may represent only one
nation per calendar year; Reg 28.5 permits **off-court coaching between points** where a Chair Umpire
is present. Reg 39: each tie is **two singles and one doubles**, played
consecutively on the same court. Reg 40 fixes the order: **No. 2 v No. 2, then No. 1 v No. 1, then the
doubles.** Reg 51: main-draw singles are best of three tie-break sets; the doubles uses No-Ad scoring
with a 10-point match tie-break in place of a third set; the No-Let rule applies throughout.

⚠ **The doubles is not optional.** Reg 40: "Doubles matches **must** be played at the round-robin stage
… Any team who does not play their doubles match shall forfeit the match and the score shall be
recorded as 0-6 0-6." In knockout ties already decided 2-0 the teams are merely "encouraged" to play
and may use an abbreviated format. **A three-player team of whom one is a doubles specialist is a real
configuration**, and it is the reason the third player matters.

**2.3 Structure and calendar.** Reg 4: the final stages take **sixteen boys' and sixteen girls' teams**
played "on a round robin and/or knockout principle … at one venue **during one week**"; Reg 34 fixes
the 2026 Finals format as **round robin and knockout**. Reg 36(a): eight seeded nations per event, the
draw made in public at the venue no later than twelve hours before play. Reg 52 provides placement
ties down to a **15th/16th place relegation playoff**.

Beneath that sit **regional pre-qualifying, qualifying and final qualifying** across five regions,
held **February to August** (Reg 64). The Finals places are allocated by region and the allocation
itself moves: for 2026 the girls' split is **Europe 6, Asia/Oceania 4, South America 2, North/Central
America and Caribbean 2, Africa 2**, governed by a **performance elimination system** – the region
whose team finishes 16th surrenders a place to the region that was short the previous year, within
fixed bounds (Europe 5–6, Asia/Oceania 3–4, South America 2–3, N/C America 1–2, Africa 1–2). The host
nation gets a place **deducted from its own region's allocation**, and may decline it. In Europe the
qualifying route *is* the Tennis Europe Summer Cups (§4).

The **2026 Finals ran 3–8 August at Tenisovy Klub Prostějov, Czechia** – the venue every year since
1999 – and **Italy won the girls' title**, their first, decided in the doubles.

→ **The calendar cost for a selected girl is one qualifying event plus one Finals week.** ⚠ But the
qualifying event is not the same length everywhere: roughly **3 days** in Europe and at the North/Central
American final round, 5–6 days in Africa and South America, and **about 13 days in Asia/Oceania**, which
runs both genders across a very large field. A European girl who plays both the 14U and 16U events in
one season spends about **four weeks**; an Asia/Oceania girl doing the same could spend **five or six**.

**2.4 ⚠ Ranking points – small, capped, and contingent on the team.** The team regulations are silent:
full-text search returns **no occurrence of "ranking point"**, and all six "ranking" hits are inputs
(Reg 21 order of merit, Reg 35 seeding, Reg 68 qualifying nominations). The points live in **WTT
Juniors Reg 31**, whose points table carries a dedicated **"International Team Competitions"** row –
see §0.2 for the table. The three properties that decide its design value:

- **Ceiling 95 points**, for the **#1 player winning her rubber in the final**. A #2 player's win in
  the final is 75; a quarter-final win as #2 is 20. For scale, a J100 title is 100 and a J30 title 30.
- **"One result only (their best) in the competition."** She cannot accumulate across rubbers.
- **"Only players from the best 8 teams will be considered."** Finish 9th of 16 and every rubber she
  won is worth nothing. **Her pay depends on her two team-mates.**

Reg 11 excludes these points from the tie-break countback. Reg 7 confirms the principle from the other
direction: final rankings are compiled from "points earned for success in major individual **and team
events**".

⚠ **Which competitions count is inference, not a stated sentence** – §10 sets out the evidence and its
limits. ⚠ And the youngest competitors cannot bank any of it: **WTT Juniors Reg 4b** admits players
"born between 1st January 2008 and 31st December 2013 … in the year they turn 13", so an 11- or
12-year-old at a 14U Finals has no ITF junior ranking to receive points into. **Our 14-year-old does.**

**2.5 Prize money – none, established by silence.** ⚠ The obvious citation does not actually reach
these events: WTT Juniors **Reg 58** prohibits prize money "at any ITF World Tennis Tour **Juniors
tournament**", which is scoped to the Tour. For the team competitions the answer is the **total absence
of any prize-money provision** in the 79-page governing document; the only related clause is Reg 6(vii),
a Board power "To decide the entry fee and allocation of any prizes". ⚠ Also worth knowing for a career
sim: Reg 25(b)(i) takes perpetual worldwide image rights from every player, and "there will be no
compensation payable in relation to the grant of such rights."

**2.6 What a nation gets.** A world title, a seeding advantage next year (Reg 35 explicitly weighs
"past 14 & Under team competitions"), and its region's place in the sixteen – which the performance
elimination system can take away. Reg 52 organises **placement ties for every position from 1st to
16th and requires all teams to play them**, so nobody goes home early and the 15th/16th tie is a
relegation match. No money moves to the winning nation.

## 3. Billie Jean King Cup Juniors – the 16-and-under world championship

Governed by the **same document** as World Junior Tennis, so almost everything in §2 holds verbatim:
three players and a non-playing captain (Reg 20), two singles and a doubles per tie (Reg 39), sixteen
teams at the Finals at one venue in one week (Reg 4), National Association nomination in order of merit
eight weeks out (Reg 21), ITF-funded flights and host-provided board at the Finals (Regs 12, 66), the
same capped top-8-only ranking points, and **no prize money**.

**Four differences.**

**3.1 Age.** WTT Juniors Appendix G, 16-and-under team competitions, 2026 edition: born **2010–2013**
and "have reached their **13th birthday** on or before the first day of Competition". No competitor may
take part who is still eligible for 12-and-under events. The band is roughly **13 to 16**.

**3.2 The name changed.** The current official titles are "**Billie Jean King Cup Juniors**" and
"**Davis Cup Juniors**" (Junior Team Regs Reg 1); the possessive forms "Junior Billie Jean King Cup"
and "Junior Fed Cup" are superseded. The girls' event was renamed in **2020**, tracking the senior Fed
Cup → Billie Jean King Cup rebrand of the same year (⚠ secondary, read 2026-08-10). Current branding
adds the sponsor: "Billie Jean King Cup Juniors by Gainbridge".

**3.3 The 2026 calendar.** Qualifying ran "across five regions – Asia/Oceania, Europe, Africa, South
America and North/Central America and the Caribbean". North/Central America and Caribbean
pre-qualifying was hosted in Guatemala with 13 nations; the Dominican Republic advanced to final
qualifying in **Montreal, 15–17 April**, joining USA, Mexico and Canada. The **2026 Finals are in
Cairo, Egypt (Smash Sporting Club), 2–8 November, on outdoor clay** – the first time the event has been
staged in Africa. Format: four round-robin groups of four over three days, **a rest day**, then
knockouts over three days. Egypt qualifies automatically as host; the USA are two-time defending
champions. The 2025 Finals were in Santiago, Chile. The girls' regional split for 2026 is Europe 6,
Asia/Oceania 4, **South America 3**, N/C America and Caribbean 2, **Africa 1** – the asymmetry against
§2.3's 14U split being the performance elimination system at work.

→ **A three-day regional qualifying event in April, and a one-week Finals in November.**

**3.4 ⚠ Something real was taken away for 2026.** The 2025 Juniors Regulations carried **Appendix H, a
"16 & Under Team Competition Feed Up System"**, giving players from the **top three teams** at the
Finals exempt main-draw positions in higher-grade Tour events – for the winning girls' team, the No. 1
player one J500 plus one J300, the No. 2 player two J300s, the No. 3 player two J200s. Its own clause 7
said the initiative "will be discontinued" after the 2025 Finals, and **it is absent from the 2026
regulations**, where Appendix H is now a WTN-based regional reserved scheme. **The 16U event's career
value dropped sharply going into 2026** – what used to be a door into the events that pay is now only
the capped points of §0.2. ⚠ Reported from the 2025 edition by one researcher; not re-read here.

⚠ **One primary detail with unusual design value.** WTT Juniors Code of Conduct Art. III.3.a.i lists
being "nominated after the Withdrawal Deadline to represent his/her country in an official ITF or
Regional Association team competition" as one of only a handful of grounds on which a junior may
withdraw from a tournament she is already committed to and play elsewhere that week; Art. III.3.b.ii
lets her play a team competition in the same week as a juniors tournament provided she has already
lost there. **The rules deliberately let a national call-up override her own schedule.**

## 4. Tennis Europe Winter and Summer Cups – the regional layer, paid in its own money

Not a footnote. For a European girl these are the national team competitions she will actually meet
first, and they are **the European qualifying route into §2 and §3**.

**4.1 What they are.** Tennis Europe – the ITF's European regional association – runs two national team
competitions, boys' and girls' events separately, both with **three players plus a non-playing captain
and a tie of two singles then one doubles, first to two rubbers**.

- **Winter Cups** (currently "by Dunlop"), indoor, **three age bands: 12U, 14U, 16U**. Calendar
  position **late January to mid-February**; in 2026 the 12U qualifying ran 30 January – 1 February
  and the 16U was staged at Pszczyna, Poland. The host nation is automatically qualified to the final
  round.
- **Summer Cups** (also "by Dunlop"), outdoor, **four age bands: 12U, 14U, 16U and 18U** – the only
  European national-team competition reaching 18U outside the ITF's own events, and by Tennis Europe's
  description its longest-running junior team event with roughly 70 national teams entering. Zonal
  qualifying in the **last week of June**, final rounds **30 June – 2 July**. Individual age/gender
  events carry named trophies – **girls 14U = Europa Cup, girls 18U = Reina/Soisbault Cup**.

**4.2 ⚠ They award ranking points, and the structure is unusual.** The *2026 Tennis Europe Junior Tour
Regulations* (version February 2026, 138 pp) carry explicit points tables headed "TEAM EVENT
(Winter/Summer Cups)" at every age band. Three properties matter:

- **Additive, not competitive.** Team results count "in addition to the six tournaments above" – a
  player's Tennis Europe ranking is six best singles plus two best doubles **plus the best two team
  events**. Playing for your country cannot cost her ranking position. This is the opposite of the ITF
  best-six window our `season/ranking.ts` implements, where every result competes for a slot.
- **⚠ An active/inactive split – a bench player still scores.** At 16U a Finals winner earns **220
  points as an active player and 120 as an inactive one**; a Qualifying winner 90/20. At 14U the
  Finals winner earns 110/60. **Being selected is itself worth something, whether or not she plays.**
- Up to two best 16U cup results also feed the "Race to Monte-Carlo", deciding qualification for the
  Tennis Europe Junior Masters.

The same regulations award Tennis Europe points for the **ITF World Junior Tennis Finals (14U)** and the
**Davis Cup / Billie Jean King Cup Juniors World Finals (16U)** – but **only to European players
reaching the top 8**. So the ITF world championship does pay a European girl, in European money, if she
goes deep.

**4.3 They are the European qualifying route – for the Summer Cups only.** The 14U Summer Cups serve as
European qualifying for ITF World Junior Tennis and the 16U Summer Cups as European qualifying for
Davis Cup Juniors / Billie Jean King Cup Juniors. Corroborated three ways: the LTA reports its 14U run
to the Summer Cup final "qualified them for the ITF Junior World Tennis Finals"; and the dates align
exactly – the ITF's 2026 European 14U qualifying is 24–26 June with final qualifying 29 June – 1 July,
which is the Summer Cups window. ⚠ **No onward ITF pathway was found for the Winter Cups** – treat them
as a standalone European indoor championship that pays points.

**4.4 Selection.** The national association, as everywhere else in this document. At the LTA the
captain is the National Age Group Coach.

## 5. The Billie Jean King Cup – the senior women's competition

**5.1 The structure, 2026, end to end.** Four levels; a nation occupies exactly one entry point per
edition.

| Level | Nations | Format | Movement |
|---|---|---|---|
| **Finals** | **8** | straight knockout: QF, SF, F | – |
| **Qualifiers** | **14** (7 ties) | home-or-away knockout, one round | 7 winners → Finals; 7 losers → Play-offs |
| **Play-offs** | **14** (7 ties) | home-or-away knockout, one round | 7 winners → next Qualifiers; 7 losers → Regional Group I |
| **Regional Groups I–IV** | variable | Europe/Africa, Americas, Asia/Oceania | 7 promote from Group I to the Play-offs |

The Finals eight are the seven Qualifier winners plus one direct entry (Regs 22.1.1, 22.3): the Finals
host nation if it has a BJK Cup Nations Ranking of 50 or better and/or a top-10 WTA singles player at
the end of the previous year, otherwise an ITF wild card from nations that reached the previous Finals
or won a Play-off Group. A host or wild-card nation plays the Finals **only** (Reg 22.3.4).

⚠ **Below Group I the numbers are not fixed by regulation.** Reg 23.3.3 has the Committee set each
group's size and Groups III and IV are expressly "a variable number of Nations"; promotion and
relegation in Groups II–IV is discretionary, "based on the number of Nations participating" (Reg
23.7.1). Only 8 / 14 / 14 and the seven promoting from Group I are hard.

**5.2 ⚠ The format changed for 2026, and the change is recent.** Established by diffing the 2025 and
2026 regulations. In **2025** the Qualifiers were **round-robin groups of three** (18 or 21 nations) and
the Play-offs **seven round-robin groups of three** (21 nations), ties of two singles and a doubles in
one day. For **2026** both reverted to **home-or-away knockout at 14 nations each**, and the tie
reverted to the classic **four singles and one doubles over two days**. The eight-nation knockout Finals
was already in force for 2025 – so **2025 shrank the Finals and 2026 rebuilt the two rungs below it.**

**5.3 Team size and tie format.** Reg 37.3: for the Finals, Qualifiers, Play-offs and Regional Group I,
a playing captain plus **three to four players**, or a non-playing captain plus **four to five**;
Regional Groups II–IV are one player smaller. Nominations are due eight weeks before the Finals and 28
days before everything else (Reg 37.1), in an order of merit driven by **WTA singles ranking, with
protected rankings expressly excluded** (Reg 37.2.1), falling back to ITF ranking, then World Tennis
Number, then national ranking, then the captain's own assessment.

- **Qualifiers and Play-offs**: five rubbers – four singles, one doubles – over two days (Regs 20.2.2,
  21.2.2). Day 1 the two crossed singles; Day 2 the doubles, then No. 1 v No. 1, then No. 2 v No. 2
  (Reg 56.1.1). Best of three tie-break sets, Ad scoring.
- **Finals**: three rubbers – two singles and a doubles – **all on one day** (Reg 22.2.2), ordered
  No. 2, No. 1, doubles (Reg 58.2.1).
- **Regional Groups**: two singles and a doubles in one day, the doubles No-Ad with a 10-point match
  tie-break as the third set (Reg 23.4.3).

**Dead rubbers differ by level.** In the Qualifiers and Play-offs a decided fifth rubber is skipped
unless both nations and the referee agree (Reg 56.3.1). At the Finals the doubles **must still be
played** in the quarter-finals and semi-finals even when the tie is decided (Reg 58.4.1) – it is a
contracted television rubber – and only in the Final itself is it cancelled outright (Reg 58.4.3).

**5.4 Calendar.** Reg 19.1 leaves all dates to the Committee; Reg 19.2 fixes only the ordering.
⚠ The 2026 dates are **secondary** (Wikipedia's 2026 BJK Cup article and the LTA schedule page, both
read 2026-08-10): **Qualifiers 10–11 April; Finals 22–27 September, Shenzhen; Play-offs 20–22
November**; Regional Group I across 7–11 April; lower groups April to October. Overall span 6 April to
21 November.

**The ceiling is two weeks, and it is the same two weeks for a weak nation as a strong one.** Strong
nation: Qualifiers in April plus the Finals in September. Nation that loses its Qualifier: April plus
the November Play-offs – the same two weeks, in worse slots. Host or wild card: one week. And the
weak-nation case is counter-intuitive – a Regional Group II–IV nation plays **one event a year, but
that event runs up to seven days** (Reg 23.4.1) at a single long-haul venue. ⚠ A two-day tie also
understates the real cost: Regs 45–50 mandate a captains' meeting, a pre-draw press conference, a
pre-tie function, the draw, a post-draw press conference and an official dinner. **The week is gone
either way.**

**5.5 ⚠ Ranking points – none.** See §0.4. The BJK Cup Regulations contain no player ranking-points
provision at all; the only "ranking points" in them are **nation-level**, feeding the Billie Jean King
Cup Nations Ranking (Reg 24.1). Reg 24.2's tie-break is quietly revealing: ties are split first by
**fewer ties played** ranking higher.

**5.6 Prize money – two streams, and only one reaches the player.** Schedule 2 Reg 10.1: every nation
receives a **Participation Payment** sized by performance, and – the load-bearing sentence – "It is up
to the **Nation** to determine any distribution of the Participation Payment to its Players and
Captains." Schedule 2 Reg 11.1: **Player Prize Money exists "For the Finals only"**, distributed per an
agreement between the nation and the players, failing which per an ITF-notified policy. **Below the
Finals a player's compensation is entirely at her federation's discretion.** ⚠ A widely-reported 2026
Finals purse of $7,000,000 could not be verified against any ITF document – see §10.

**5.7 Eligibility.** Reg 13.1.1: **minimum age 14**, reached by the first day of the tie or the Monday
of the Finals/Regional Group week (13.1.1.2). Nationality (13.1.1.5): a citizen holding a valid
passport of that nation **for at least 24 months within the past five years**; or, where the nation
issues no passport, a qualifying passport on the same basis; or five consecutive years of residence
plus a qualifying connection. Switching (13.1.1.4): she must not have represented another nation in
previous editions "(other than the Junior Billie Jean King Cup) **or in the Olympic Tennis Event**",
and representation is deemed to occur **on nomination, not on playing**. ⚠ **A single unused bench
nomination locks her to that nation for life**, and an Olympic appearance for one country bars BJK Cup
for another.

**The WTA side adds two things that matter more than they look.** 2026 WTA Rulebook §X.A.2.c: "A player
**14 years of age or older** is eligible to participate in any level of competition at Billie Jean King
Cup events", and participation between 14 and 17 "**will not count toward her AER Tournament
Allotment**" – i.e. it is *free* against the age-capped annual professional allowance (0 pro events
under 14, 8 at 14, 10 at 15, 12 at 16, 16 at 17). And §IV.A.3.b.iii(b) exempts late-withdrawal fines
caused by BJK Cup selection from **doubling** – but §IV.A.8.b is explicit that a player who withdraws
from a WTA **main draw** because of BJK Cup participation "is subject to the Late Withdrawal fines",
which on the §IV.A.3.b.ii chart run to **$20,000** for a top-10 player at a WTA 1000. **Playing for
your country can cost you a five-figure fine.**

## 6. The Olympic Games

**6.1 Is it a team competition?** No. The five events are singles, doubles and mixed doubles; there is
no team event; and the Paris 2024 Regulations contain **zero occurrences of "captain"** in their
operative rules. What is national about it: entry is by **National Olympic Committee**, capped per
nation, doubles pairs must be same-nation (Regs 12.1.3–12.1.5), and – decisively – eligibility is gated
on national team service. It belongs in the family for that last reason alone.

**6.2 Entry criteria – Paris 2024 (primary; LA28 not yet published).** Draw sizes (Regs 3.1, 12.1):
**women's singles 64, women's doubles 32 teams, mixed doubles 16 teams**. The 64 comprise **56 Direct
Acceptances + 1 Host Country Place + 6 ITF Places + 1 Universality Place**. **The ranking date was 10
June 2024**, "the first ranking after the conclusion of Roland Garros". Per-NOC caps: **6 women across
all events, of whom at most 4 in singles**; the Nation Quota overrides everything (Reg 9.2), and a
federation with more than four eligible players "must select its four (4) highest Ranked eligible
players".

There is **no stated cutoff position** – the rule is simply the top 56 on 10 June, so the effective
cutoff floats with the per-nation cap, eligibility failures and declines. ⚠ Secondary (Wikipedia, read
2026-08-10): the lowest women's direct acceptance was **WTA #56**. The alternative routes are
continental (Pan American winner and runner-up, Asian Games winner, African Games winner – each
conditional on being **inside the top 400**), a former Olympic champion or Grand Slam champion place on
the same top-400 condition, the host place and the IOC Tripartite universality place. Special Rankings
are accepted for qualification but **not for seeding** (Reg 10.2).

**6.3 ⚠ The Billie Jean King Cup precondition – the finding.** Paris 2024 Reg **7.1.5** required the
player to have been "part of the final nominated Davis Cup or Billie Jean King Cup team, and present at
the tie/event (**National Representation**) on a minimum of **two (2) occasions** during the Olympic
Cycle, provided that one of those occasions is in either 2023 or 2024." The LA28 rule (version as of
January 2026) carries it over in substance with the recency limb moved to **2027 or 2028**.

The mechanics that matter:

- **The test is nomination plus physical presence, not playing.** Sitting on the bench counts. There is
  no separate "availability" limb inside the Olympic rule – availability lives in the BJK Cup
  regulations (§0.8).
- **Aggregation trap** (Reg 7.1.5(a)(i)): representation at the Finals, or at "any Regional Group
  Event", counts as **one** occasion "irrespective of how many ties a player may play in such event".
  **She cannot bank two occasions from one week.**
- **Olympic Cycle**: Paris 2024 ran **10 August 2020 to 24 June 2024** – note it starts in 2020, the
  originally-scheduled Tokyo end date, so the cycle was ~3 years 10 months. LA28 runs **5 August 2024
  to 12 June 2028 (date tbc)**.
- **Two occasions across four years is a low bar; the recency limb is the teeth.** 2026 appearances
  alone can never satisfy LA28.
- **An escape hatch exists** (Reg 7.2.2): the ITF Olympic Committee – renamed "**the Panel**" in the
  LA28 version – may declare her eligible anyway on four grounds: **(a) injury/illness** evidenced by
  medical records identifying "the period of absence from all competitive tennis"; **(b) Newcomer**,
  where she only reached a selectable ranking late in the cycle; **(c) Strength of Nation**, where her
  federation's depth of highly-ranked players limited her opportunities; **(d) Commitment to and
  Achievement** at the Olympics or the team competitions. The declaration is only of eligibility – "the
  NOC retains its discretion to nominate". ⚠ The regulations defining the LA28 Panel and its procedure
  **have not been published**.

**6.4 ⚠ Ranking points and prize money – none, and the prize-money answer is a prohibition.** No
Olympic row exists in the 2026 WTA Ranking Point Chart; all 17 occurrences of "Olympic" in the rulebook
are non-points clauses. The WTA's own explainer (24 July 2024, read 2026-08-10) answers it flatly: no
WTA ranking points are awarded for Olympic participation. **History** (⚠ secondary): ATP points from
2000 and WTA points from 2004 through **London 2012** – 750 ATP and 685 WTA for gold – with both tours
**removing them before Rio 2016**. ⚠ **A trap worth recording**: several aggregator sites still display
"Olympics: Gold 750 / Silver 450 / Bronze 375" as current. Those are un-updated 2012-era values and
search engines repeat them confidently.

Prize money is positively prohibited, not merely absent. Reg 7.4.2: from the opening of the Olympic
Village to the end of the Games a player "may not accept, either directly or indirectly, **any form of
financial reward whatsoever** in respect of their participation, except for any payment which may have
been established in respect of their Olympic delegation." That carve-out is where NOC medal bonuses
live, so they are lawful; ⚠ reported averages of roughly $95k/$55k/$39k across ~25 countries are
secondary and unverified per country.

**Other ranking interactions** (2026 WTA Rulebook, primary): since it awards no points it cannot occupy
one of her best-16 slots and is not a Commitment tournament. **§VIII.C.5.c.ii(e)**: she may use her
Special Ranking for Olympic acceptance, and it "will count as one (1) of her maximum Tournaments to use
her Special Ranking" – **a real cost, not a freebie**. Nothing forbids her playing elsewhere that week;
the only punitive interaction is that taking a prize-money withdrawal from a WTA event and then playing
an Olympic event the same week costs a fine of double the withdrawal money.

**6.5 Calendar.** **Paris 2024: 27 July – 4 August, nine competition days**, at Roland Garros, **on
clay**, every match in every event **best of three sets**. It sat between Wimbledon and the US Open –
grass season straight onto clay, a surface whiplash worth noting. Reg 7.3 lets the NOC claim her for a
preparation and travel period of up to **14 days** beforehand. ⚠ **Realistic cost 2–3 weeks.**
Displacement of the women's calendar was thinner than expected: Palermo and Prague both finished before
the Games and the WTA 500 in Washington ran **concurrently**; a list of WTA events cancelled because of
Paris 2024 was **not found**.

**6.6 Selection and declining.** Reg 8.1: the **NOC nominates**, "with the endorsement of the National
Association", and only NOC-nominated players can be offered a quota place (Reg 8.3) – but quota places
are "allocated to an athlete by name" (Reg 13.2) and the four-highest-ranked rule means **the ranking
does the real selecting**. Discretion lives at the margins: doubles pairings, host and universality
places, and whether to nominate at all.

Declining is expected by the machinery: Qualification System §F.1 reallocates a place "not confirmed by
the NOC … **or declined by the NOC**" to the next highest-ranked eligible athlete. After the entries
deadline a replacement needs illness, injury or exceptional circumstances with documentation
(Reg 14.3), and if the ITF judges the withdrawal invalid **the nation loses the slot to another
country** rather than replacing its own player (Reg 14.4). **There is no sanction on the player in the
Olympic regulations.** The pressure is indirect and lands through the BJK Cup good-standing condition
and through Reg 7.2.2(d), which makes a history of commitment an express factor next time she needs a
waiver.

**6.7 An honest gap on the current cycle.** 2026 WTA Rulebook §X.A.2.d, in full: "The Age Eligibility
restrictions with respect to the Women's Tennis Competition will be detailed in the **2028** WTA Age
Eligibility Rule and the ITF Olympic Tennis Event **2028** Regulations." **The LA28 tennis regulations
and qualification system are not published.** Draw sizes, cutoff date and quotas for LA28 are unknown;
everything in §6.2 is Paris 2024 and must not be assumed forward. What *is* settled for LA28: the
eligibility rule, and the **minimum age of 15 for women** (14 for men) on the opening day.

## 7. United Cup – the only one that pays in WTA points

**7.1 What it is.** 2026 WTA Rulebook, Appendix L, opening sentence: "The United Cup is a country vs
country **mixed team** competition for **eighteen (18) teams** with a minimum of four (4) players (two
WTA and two ATP) and a maximum of six (6) players (three WTA and three ATP) on each team." Australia,
January. It succeeded the ATP Cup and occupies the old Hopman Cup slot.

**7.2 ⚠ The format changed for 2026.** Appendix L §E.1.a: "A Tie consists of **one (1) WTA singles
match, one (1) ATP singles match, and one (1) mixed doubles match**. The team that wins the most matches
wins the Tie." Earlier editions ran two men's and two women's singles plus a mixed doubles – five
rubbers. All singles best of three; the doubles best of three with No-Ad; if one team wins both singles
the mixed doubles is not played. Every nominated player "must play singles and be available for mixed
doubles".

**7.3 How a nation gets in – through its player.** Appendix L §B.2.a: acceptance is determined "using
the WTA/ATP Singles Ranking … of a country's **highest-ranked singles player**". The five
highest-ranked WTA players and five highest-ranked ATP players to enter qualify the first ten teams; an
eleventh goes to a WTA top-10 player not yet accepted; the rest are decided on combined rankings, with
a host wild card. **The player's own ranking is the nation's entry ticket** – the causality runs the
opposite way to every other event in this document.

**7.4 ⚠ Ranking points – yes, and they are real.** Appendix L §J: awarded "for the singles competition
only", none if no matches of a tie are played, and they "may count on her ranking as one (1) of her
other best six (6) results".

| Match wins | Points |
|---|---|
| 5 | **500** |
| 4 | 325 |
| 3 | 150 |
| 2 (one from QF/SF/F) | 108 |
| 2 round-robin wins | 90 |
| 1 (QF/SF/F) | 60 |
| 1 round-robin win | 32 |
| 0 | 1 |

A perfect United Cup is worth a **WTA 500 title**. Note the shape: a **per-win ladder**, not a per-round
table – the only such structure in women's tennis, and structurally identical to the Tennis Europe team
tables in §4.

**7.5 Prize money – large, and split three ways.** Appendix L: a participation fee scaled by how much
she plays (a 40% "Promotional Percentage" floor, +30% per singles match, +15% for mixed doubles);
**per-individual-win** money for the Number 1 Player of **$251,000 for a final win, $132,000 semi,
$69,500 quarter, $38,325 group**; and **per-team-win** money paid to every player on the team
**regardless of whether she played** – $23,155 final, $13,650 semi, $8,025 quarter, $5,000 group.
That last line is the same "the bench is paid" idea as the Tennis Europe inactive points, in cash.

**7.6 Selection and declining.** Appendix L §C.1.a: "Players 1-2 on each team are determined using a
player's **WTA Singles Ranking**." Mechanical, not a captain's gift. Withdrawal is subject to the
ordinary WTA Section IV penalties plus a lockout – §D.1.b: "Any player withdrawing after acceptance is
**not permitted to participate in any other Tennis Event during the United Cup Competition**", with a
carve-out only for a third player who withdraws before the other event's entry deadline. Nationality
may be changed only once in a career, and only if she has competed under the new nationality at BJK Cup
or the Olympics or in professional tennis in the preceding Tour Year (§A.2).

## 8. What else exists – and what does not

Kept deliberately short; the sections above are the honest extent of the family for a girl's career.

- **⚠ There is no 18-and-under ITF national team competition.** The ITF's junior team competitions
  "currently cover two age groups: 14 & Under and 16 & Under" – above 16 the pathway is the individual
  World Tennis Tour Juniors circuit, and the only 18U national team event anywhere in this document is
  the **Tennis Europe Summer Cups** (§4). Note also that **Davis Cup Juniors is 16U, not 18U**, which
  is a common misremembering.
- **Davis Cup and Davis Cup Juniors** – the men's and 16-and-under boys' analogues. Davis Cup Juniors is
  governed by the *same* document as Billie Jean King Cup Juniors, so §3 applies to it verbatim. Davis
  Cup itself was restructured in **2019** (18-team season-ending event under Kosmos) and again for
  **2025–26** back to home-and-away ties plus a **Final 8 in Bologna, 24–29 November 2026**. Context
  only in a women-first game. ⚠ Its organisers market it as "**the World Cup of Tennis**", and that
  phrase is baked into daviscup.com's page titles – **this is the most likely source of the owner's
  half-memory.**
- **Youth Olympic Games** – the one junior event in this family that unambiguously pays ITF points. WTT
  Juniors Reg 31's points table puts "Grand Slam*, **Youth Olympics**" on the same row: **singles
  1000/700/490/300/180/90**, doubles 750/525/367/225/135. It is an individual event entered by national
  nomination; Junior Team Regs Reg 27.1 ties it to the same one-nation-only commitment as the three ITF
  team championships. Its distinctive quirk is that mixed doubles pairs are formed **across
  nationalities** – at Buenos Aires 2018 every athlete entered it and pairs crossed flags. ⚠⚠ **Whether
  tennis is on the Dakar 2026 programme at all is contested and unresolved**: one researcher reports it
  demoted to a non-medal "engagement sport", another could not verify its inclusion from a primary IOC
  or ITF document. **Do not treat tennis at Dakar 2026 as confirmed.** The last certain medal edition is
  Buenos Aires 2018.
- **Multi-sport games – eleven checked, three carry a national team event.** **FISU World University
  Games** is the one that matters: Rhine-Ruhr 2025 contested men's and women's **team** events across 52
  nations on clay, entry via the national university sports federation, students 18–25; next
  Chungcheong, South Korea, 1–12 August 2027. The **African Games** and **SEA Games** also have team
  events. Everything else is a negative worth knowing: **Asian Games team events were last contested in
  2014**; **Commonwealth Games has had tennis in exactly one edition, Delhi 2010**, and it is not on the
  Glasgow 2026 programme; **European Games has no tennis** and will not at Istanbul 2027; Pan American
  and Mediterranean Games have tennis but no team event; the European Youth Olympic Festival has U15
  singles and doubles only, nominated by the **NOC** rather than the tennis federation. **No ranking
  points at any of them** – the relationship runs the other way, with tour rankings used to allocate
  entry quotas.
- **Regional Championships** – continental *individual* championships, not team events, but entered the
  same way: WTT Juniors Appendix B Reg 70, "only players **nominated by their National Association** may
  compete", capped at one regional plus two inter-regional championships a year within one zone.
  ⚠ Flagged because our `regional` tier borrows the name for something the kid enters 13 times a season.
- **Continental team championships beyond ITF qualifying**: only **Africa** clearly runs its own layer
  (the CAT African Junior Team Championship at 14U and 16U, plus sub-regional championships). South
  America's "Sudamericano por equipos" is badged COSAT *and* ITF and simultaneously **is** the ITF
  qualifier, not an extra event. A separate Asian (ATF) or Oceanian (OTF) team championship was **not
  found**.
- **Out of scope but part of the same ladder**: the **ITF Masters World Team Championships**, national
  teams in five-year bands from **30+** to 90+ (renamed from "ITF Seniors" in 2022) – where a retired
  player rejoins it; and the **BNP Paribas World Team Cup**, the ITF's **wheelchair** national-team
  event, ⚠ whose junior edition split into separate boys' and girls' events for the first time in 2026.
- **Explicitly NOT national team competitions**: the **Laver Cup** (Europe v World – continental,
  invitational, men only, no points, and ⚠ **no women's equivalent exists**, an absence that is itself a
  finding for a women-first game); **World TeamTennis** (US city franchises, dormant since 2021, ⚠
  relaunch announced for December 2026); and the club and county leagues – German Bundesliga (women's
  season **May–June**, top pros genuinely play), French interclubs (Nov–Dec), Italian Serie A1
  (Oct–Dec), Czech extraliga (Dec), the LTA County Cup (a **county** unit) and USTA Junior Team Tennis
  (a **club** unit). None national, none paying tour points. ⚠ The **May–June** window is contested by
  the German, Czech, Austrian and Dutch leagues *and* Tennis Europe Summer Cups qualifying at once.
- **Defunct, with dates** – because "it no longer exists" is a useful answer: the **World Team Cup**
  (Düsseldorf, men's national teams, 1978–**2012**, discontinued when the title sponsorship failed);
  **World Championship Tennis** (a men's *circuit*, 1968–1989, dissolved **28 August 1990**) – a pure
  name-collision trap; and the **ATP Cup** (men's national teams, 2020–2022), folded into the United
  Cup from 2023.
- **⚠ There is no world championship at all below 14.** WTT Juniors Appendix G, 12-and-under: "There
  shall be **no World Championship, team or individual, for players aged 12 and under**. The title
  'World Champion' (or any similar title) shall not be awarded"; there are no international or regional
  rankings at 12U either; and any 12-and-under competition organised by a Regional Association "**must
  be a team competition**". The floor of this whole family is age 11, in the 14U event.

## 9. The two questions about the shape of it

**9.1 How is a team selected?** In every ITF and Tennis Europe competition here: **the National
Association nominates, and where there is a captain the captain picks the team out of the nomination.**
Ranking is an *input to the order*, never the selector.

| Competition | Who nominates | Who picks who plays | Player's say |
|---|---|---|---|
| ITF World Junior Tennis | National Association (Reg 21) | Captain | none |
| BJK Cup Juniors | National Association (Reg 21) | Captain | none |
| TE Winter / Summer Cups | National Association | Captain | none |
| Billie Jean King Cup | National Association (Reg 37.1) | **Captain alone** (Reg 41.1) | none |
| Olympic Games | **NOC**, endorsed by the federation (Reg 8.1) | – (ranking-forced at the top) | none |
| **United Cup** | **WTA singles ranking** (App. L §C.1.a) | mechanical | **enters herself** |

Only the United Cup is automatic, and only the United Cup is entered rather than conferred. The
Olympics is the interesting middle: nominated by a body that is not even the tennis federation, but
with the top four names forced by ranking.

**9.2 Can a player decline?** **There is no right to decline written anywhere, and at senior level
declining is a breach of an eligibility condition.**

- **BJK Cup**: Reg 13.6 is headed "No right to participate"; Reg 13.1.1.3(d) makes availability a Good
  Standing criterion; her own federation judges it and the judgement is outside ITF review. The
  consequence is not a fine – it is **Olympic ineligibility up to four years later**, via the LA28
  two-occasions requirement.
- **Juniors and the Tennis Europe cups**: Junior Team Regs Reg 56 contemplates only a **team**
  withdrawing, with fines of $500 to $2,500 payable by the **National Association**. **A player
  declining is not addressed at all.** The silence is the answer: the regulations do not imagine her
  being asked.
- **Olympics**: the NOC may decline a place and the machinery reallocates it (Qualification System
  §F.1). No sanction on the player exists in the Olympic regulations; the pressure runs through BJK Cup
  good standing and through Reg 7.2.2(d)'s "commitment and achievement" factor in any future waiver.
- **United Cup**: she may withdraw under the ordinary WTA penalties, and is then locked out of every
  other tennis event that fortnight (App. L §D.1.b).

## 10. Data-quality flags

- **Solid and primary, downloaded as PDFs and read as extracted text**: the **2026 ITF Junior Team
  Competition Regulations** (published 5 December 2025, 79 pp,
  `itftennis.com/media/15525/2026-junior-team-competitions-regulations.pdf`); the **2026 ITF World
  Tennis Tour Juniors Regulations** (5 December 2025, 114 pp, `/media/15524/…` and `/media/15480/…`);
  the **2026 Billie Jean King Cup Regulations** (ctfassets host); the **2026 WTA Official Rulebook**;
  the **Paris 2024 ITF Olympic Tennis Event Regulations** (final, 31 August 2023) and **Qualification
  System** (13 February 2024); and the ITF's **Eligibility for the Olympic Tennis Event – LA28**,
  version as of January 2026 (`/media/14173/…`). Every regulation number above was read in situ, and
  the junior points question was independently re-derived by two researchers from different starting
  points who agreed.
- ⚠ **Method note for the next researcher.** `itftennis.com` PDF URLs sit behind **Incapsula/Imperva**:
  a plain `curl -L` returns a **212-byte HTML stub**, and `pdftotext` then fails with "Couldn't find
  trailer dictionary" – which looks exactly like a corrupt download. A full browser header set (Chrome
  UA plus `Accept`, `Accept-Language`, `Sec-Fetch-Dest/Mode/Site`, `Upgrade-Insecure-Requests`, with a
  cookie jar) defeats it; a two-pass variant that fetches an HTML page first and then sends the cookie
  jar plus a `Referer` also works. Always `file x.pdf` and check it says "PDF document". The ITF's
  **HTML** pages are harder-gated than its PDFs and did not yield to the same headers – a
  text-extraction proxy was used for the two ITF news articles cited. `photoresources.wtatennis.com`
  and `assets.ctfassets.net` are unprotected.
- ⚠ **tenniseurope.org could not be read directly.** It is a JavaScript shell behind a cookie-consent
  gate that returns an identical stub to every request. The §4 figures come from the **2026 Tennis
  Europe Junior Tour Regulations PDF (version February 2026, 138 pp)** obtained through a national
  federation's mirror, plus LTA and ÖTV pages. The regulations themselves are primary; **no separate
  Winter/Summer Cups regulations document exists** as far as could be established, and the trophy names
  for girls 12U and 16U were not found.
- ⚠ **Two WTA rulebook printings are in circulation and both were read** – the **26 June 2026** printing
  linked live from `wtatennis.com/wta-rules` and the **22 December 2025** printing. They agree on every
  clause cited here. The points chart in both is still captioned "2025 WTA RANKING POINT CHART" – a
  stale caption, verified against the surrounding text. Appendix L carries a stale date too: its
  late-withdrawal deadline reads "October 17, **2024**" while the entry deadline in the same appendix
  reads "November 17, **2025**".
- ⚠⚠ **WHICH team competitions earn the Reg 31 points is an inference, and the reader should know its
  shape.** The points table exists and is unambiguous (§0.2). What no ITF document states in a sentence
  is *which competitions* the row "International Team Competitions" covers. Three strands support the
  reading that it covers **both** the 14U and the 16U events: (a) Reg 31's own preamble – "refer to
  Appendices A, B and C for special regulations for J500 tournaments, Regional Championships and **ITF
  Junior Team Competitions**" – leaks the legacy grade taxonomy A→J500, B→Regional Championships,
  **C→ITF Junior Team Competitions**, even though Appendix C in the 2026 document is now the Code of
  Conduct and the junior-team appendix has been deleted; (b) the **2022** Juniors Regulations carried
  that grade explicitly, as "Grade C (International Team Competitions)" with its own Appendix C
  (Regs 70–73) and a place in Section IV's scope list at clause (e); (c) **the ITF's own player database
  still codes both events as Grade C** – the 2025 Billie Jean King Cup Juniors Finals appears in a
  player's juniors ranking activity as "Grade C" with tournament code `j-gc-chi-02a-2025`, and the 2026
  World Tennis 14&U Junior Team Finals as "Grade C", code `j-gc-cze-02a-2026`. Same coding, both in the
  ranking activity feed. **The evidence is strong and consistent, but it is inference from ITF data
  plus a stale cross-reference, not a rulebook sentence.** A reader needing certainty should ask the
  ITF directly.
- ⚠⚠ **A correction recorded against this document's own first draft, because the failure is the
  repo's known one.** This document initially claimed the junior team competitions awarded **zero**
  ranking points, on the strength of a full-text search of the team regulations plus a read of the
  Reg 31 points table. The team-regulations negative is correct. The Reg 31 read was **wrong**: the
  "International Team Competitions" rows sit four lines below the last row that was printed, and the
  label is split across three physical lines ("International" / "Team" / "Competitions"), so a grep for
  the phrase misses it too. Both the range and the grep failed silently and agreed with each other.
  This is precisely the family `CLAUDE.md` warns about – "a slice between two markers whose end marker
  moved returns -1 and silently swallows the rest of the file" – and it was caught only because a second
  researcher read the same page independently and disagreed. **Two agreeing methods that share a
  starting assumption are one method.**
- ⚠ **2026 BJK Cup dates are secondary** – Wikipedia's 2026 Billie Jean King Cup article and the LTA
  schedule page, both read 2026-08-10. Reg 19.1 leaves dates entirely to the Committee, so no primary
  fixture list exists to check them against. The LTA page also **mixes editions**: it gives the 2026
  Qualifiers correctly as four singles and a doubles but still describes the Play-offs as "seven groups
  of three teams", which is the superseded 2025 format. Do not use it for the Play-offs.
- ⚠ **The 2026 BJK Cup Finals prize money ($7,000,000 total; $2m champion, $1.3m runner-up, $850k
  semi-finalists, $500k quarter-finalists) is unverified.** It appears only in secondary reporting; it
  is internally consistent, but `billiejeankingcup.com` is JavaScript-rendered and its rules pages
  returned 404. It is also unclear whether the figure is player prize money or a total including
  federation Participation Payments. **Do not use it for balance.**
- ⚠ **Olympic ranking-points history is secondary** (ATP from 2000, WTA from 2004, 750/685 for gold at
  London 2012, removed before Rio 2016). The *current* position – none – is primary, from the 2026 WTA
  Rulebook and the WTA's own 24 July 2024 explainer. ⚠ **Aggregator sites showing "Olympics: Gold 750"
  as a live figure are wrong**, and search engines repeat them.
- ⚠ **An ITF rebrand landed mid-season and the names in this document may already be stale.** Two
  researchers independently report that the ITF now trades as "**World Tennis**" – members voted at the
  AGM, the trading name changed 1 January 2026, the brand went live 25 June 2026 – and that the 14U
  event is now billed as the "**World Tennis 14&U Junior Team Finals**" on the ITF's live site and in
  its August 2026 press. **The regulations cited throughout this document (published 5 December 2025)
  and the ITF's own March 2026 article both still say "ITF World Junior Tennis"**, so the rebrand
  post-dates every regulation quoted here. Regulation numbers are unaffected; **competition names
  should be re-checked before external publication.**
- ⚠ **A duplicate-URL trap on the ITF media host.** The 2026 Juniors Regulations resolve from **two**
  paths, `/media/15480/` and `/media/15524/`, and the same document exists at both; the Junior Team
  Competition Regulations likewise at `/media/15479/` and `/media/15525/`. Content was compared and is
  identical, but one path may return an Incapsula stub while the other succeeds in the same session.
  If one 404s or returns HTML, try the other before concluding the document has moved.
- ⚠ **Not found**: (a) any date on which a player-level Fed Cup / BJK Cup **WTA ranking-points** system
  was abolished – the current position was confirmed unchanged across the 2023, 2024, 2025 and 2026
  rulebooks, but whether such a system ever existed was not established; the Wayback Machine
  rate-limited the archive search. (b) **South America's 14U final qualifying round for 2026** – the
  ITF hub lists only a pre-qualifying event in Argentina, 11–16 May, with no subsequent round, yet
  South American teams reached the Finals; either that event was the region's sole qualifier despite
  its label, or a round is missing from the page. (c) The **LA28 Olympic tennis regulations and
  qualification system**, which the WTA
  Rulebook §X.A.2.d itself says are still to come – so all Olympic entry criteria here are **Paris 2024**
  and must not be assumed forward. (d) The regulations defining the LA28 eligibility **Panel**. (e) Any
  onward ITF pathway from the Tennis Europe **Winter** Cups. (f) A list of WTA events cancelled or moved
  because of Paris 2024. (g) Whether tennis is on the **Dakar 2026** Youth Olympic programme – two
  researchers reached different readings and neither confirmed it against an IOC primary document.
- ⚠ **BJK Cup Regs 13.2–13.4** (special exemptions, dual eligibility, divided nations) were read at
  heading level only. Treat the exemption mechanics as unexamined.
- ⚠ **The 2026 Junior Team Competition Regulations carry a standing amendment warning** at Reg 2: they
  "are subject to change during the 2026 edition … with the introduction of the ITF World Tennis Number
  as a global rating", which may then be relied on for seeding. Seeding facts here may move within the
  year.

## 11. ⚠ MY RECOMMENDATION – this section is a proposal, not a finding

Everything above is what the regulations say. Everything below is what I think we should do, and it is
the owner's call, not the research's.

### 11.1 The answer to the question actually asked

**Is there a version of this worth building in a game about one girl's individual career?**

**Yes – exactly one, and it is not the impressive one.** Build **ITF World Junior Tennis (14U)**, or its
16U twin, as a **single once-a-year week she does not enter and cannot decline**. Do not build the
Billie Jean King Cup. Do not build the Olympics. Do not build the United Cup.

**Why that one.** Four reasons, in the order I weight them.

1. **It is the only one that lands inside the game we actually ship.** Our kid is 14 at the start and
   the ladder tops out at WTA level in the current design. The 14U band is 11–14 and the 16U band is
   13–16 – **both are live from the first season**. The BJK Cup minimum age is 14 too, but a
   14-year-old on a senior national team is a once-a-decade event in reality. The Olympics has a
   minimum age of **15** and a top-56 ranking cutoff she will not see for a decade of game time. **The
   junior events are the only ones a new player would ever meet.**
2. **⚠ How it pays is the feature, and it is a shape our engine has never had.** Every rung of this
   game is the same transaction – `enterEvent`, `finalizeTournament`, `tier.points[kidFinish]`: she
   plays, she is paid on **her own finish**, the ranking moves. This event pays **no money at all**,
   caps at **95 points** – less than a J100 title – gives her **one result only**, and pays nothing
   whatsoever unless **her nation finishes in the top 8**. She can win both her rubbers and go home
   with nothing because the other two girls lost theirs. **Nothing else we model pays her on somebody
   else's result, and that is the whole reason to build it.** ⚠ This corrects the first draft of this
   document, which claimed the points were zero – see §10. The true version is the better feature:
   "small, capped and contingent on your team-mates" is a more interesting object than "none".
3. **It inverts the game's economic sign.** Junior Team Regs Reg 12 has the **ITF buy the plane
   ticket** for three players and a captain to the Finals, and the host nation feed and house them.
   Our `travelCostCents` is drawn per event and scaled by family wealth; at the Finals this is the
   **one week where that number is zero**, and the reason is that somebody else is paying. In a game
   where a working family's season is a budget crisis, a free week that arrives as an honour is a
   genuinely new beat – and the regional qualifying round, where the flight is still on the family, is
   the honest half-measure that keeps it from being a giveaway.
4. **The selection is a dramatic object we do not have.** Everything in this game is chosen by the
   parent. A letter saying *she has been nominated* – three players and a captain, an order of merit
   set by a federation that weighed her against two other girls – is the first thing that happens **to**
   her rather than because of a decision. And the honest version has teeth: at senior level, refusing
   is a breach of a Good Standing criterion her own federation judges unappealably.

### 11.2 What it would cost, measured against the code

Not hypothetical. `src/engine/season/types.ts:230` already carries `nation: string // ISO-2` on every
`AiPlayer`, `world.profile.country` carries the kid's, and `flagEmoji` already renders both in five
components. The bill is elsewhere.

**a) A team of compatriots the game does not currently model – and the numbers are worse than they
look.** Rivals draw a nation from `NATION_WEIGHTS` in `season/cohort.ts` (36 nations, total weight 118),
so compatriots are a *sampling outcome*, not a guarantee. Expected counts in the 199-strong cohort:

| Kid's nation | Weight | Expected compatriots | Of whom aged ≤14 |
|---|---|---|---|
| US | 10 | **16.9** | ~4.8 |
| GB | 5 | 8.4 | ~2.4 |
| CZ | 4 | 6.7 | ~1.9 |
| PL | 3 | 5.1 | ~1.4 |
| NL | 2 | 3.4 | ~1.0 |
| PT | 1 | **1.7** | **~0.5** |

A team needs **three**. For a mid-weight nation the eligible-age pool is one or two girls, and it
**changes every year** because the conveyor replaces leavers one-for-one. ⚠ **And there is a hard
failure case already sitting in the code**: `OnboardingWizard.vue`'s `COUNTRIES` list offers **24**
countries, `NATION_WEIGHTS` has **36**, and the sets are not nested – **`BY` (Belarus) is pickable and
appears in no cohort, ever.** A Belarusian kid would have zero compatriots for her entire career. The
other thirteen mismatches run the harmless way. So "a team of compatriots" is not a matter of reading a
field: it needs the two nation lists reconciled, and it probably needs compatriots *guaranteed* rather
than drawn – which is a change to `makeJunior`'s draw order, and **that is the one thing the codebase
most forbids**, because `driftCohort` spends exactly four MAIN draws per player and
`52 × (4 × 199 + 3) + 2 = 41550` is literally what the frozen capture is made of.

**b) A selection she does not control.** The engine has no federation. Every entry today goes through
`enterEvent` with a `baseRevision`, one per week, chosen by the parent. A nomination is the opposite: it
must arrive as an event, occupy the week whether or not she wants it, and – if faithful – block the
entry she would otherwise have made. **That is a new arrival path into the week, not a new tier.**

**c) A week that pays no points.** Cheaper than it sounds, and `retirement-and-withdrawal.md` already
mapped the ground: `finalizeTournament` derives points from `tier.points[kidFinish]`, so an all-zero
points array is expressible today. But several comments in `world.ts` and `protocol.ts` lean on "a
result cannot award one without the other" – the `prizeCentsFor` invariant – and a zero-points,
zero-money, non-optional week **must not quietly break them**. Restate, do not slide past.

**d) A tier is not free.** `TierId` is consumed in 35 source files; `TIER_LADDER` is the declared source
of truth for tier ordering and feeds scheduling precedence, the season strip and every monotonicity
test. A team event is **orthogonal** to that ladder rather than a rung on it – which is arguably a
reason it should not be a `TierId` at all, and that is a design question before it is an implementation
one. `SAVE_SCHEMA_VERSION` is at 47: a new event kind is a bump plus an append-only migration plus a
golden fixture.

**e) Doubles.** A tie is two singles and one doubles, and the doubles is compulsory at the round-robin
stage on pain of a 0-6 0-6 forfeit. **This engine has no doubles at all** – the only occurrences of the
word in `src/` are `doublesHalfWidth` in the court geometry. A faithful tie is therefore not
implementable, and a tie modelled as two singles is a deviation to write down rather than discover.

**f) A second currency, if we ever wanted the Tennis Europe layer.** §4's points are additive and
regional. Our single points ladder is a deliberate simplification – `ranking-points-by-tier.md` §6
already says the long-term-correct version is two tracks – so importing Tennis Europe faithfully means
importing that unbuilt system first. **Do not.**

### 11.3 The version I would actually build, and the ones I would not

**Would build – "the letter", roughly one screen.** Once a year, in the right week, a nomination
arrives. It names two compatriots by name and flag from the existing cohort – whoever is nearest in age
and rank, so no new field and no guaranteed pool – and **if the nation cannot field three, the letter
simply does not come**, which is *itself* true to a small tennis nation. She travels; the week costs
the family nothing because the ITF and the host pay; the result is a nation placing between 1 and 16,
stored as a career fact. **She is paid only if the nation finishes top 8, and then at most 95 points,
once** – so two thirds of the time the honest outcome is a good week and an empty ledger line. She
cannot decline. Three lines of copy carry the whole meaning: nominated, paid only if they all play
well, not optional.

**Would not build:**

- **The senior Billie Jean King Cup.** Four levels, promotion and relegation, a Nations Ranking, three
  different tie formats, a captain's selection out of a five-player nomination – a national-team
  simulation sitting beside a career simulation. And its actual payload for the player is *an Olympic
  eligibility credit toward a Games we also would not build*. **It is the most impressive item in this
  document and the worst value in it.**
- **The Olympics.** Its own entry system, a four-year cycle, per-NOC caps, a minimum age of 15, and –
  ⚠ decisively – **the LA28 tennis regulations are not published**, so a faithful version cannot be
  written today. Building the eligibility gate without the Games is worse than not building either: it
  is a cost with no reward.
- **The United Cup.** It pays real points and real money, so it is the tempting one. But it is *mixed* –
  it needs a men's tour we do not have and never will – and a nation qualifies through the ranking of
  its best player, so it is unreachable until the kid is a genuine top-10 player, which is an endgame a
  minority of careers ever sees. **Highest cost, latest payoff, needs a whole second tour.**

### 11.4 The case for "not worth it", stated fairly

The owner's own framing was «если такого в реальности нет, то и делать не будем». It does exist, so that
test is passed – but here is the honest case against building it anyway, because he should see it
before he says yes:

**It is one week a year that the player cannot influence.** She does not choose it, does not train for
it, cannot decline it, usually earns nothing measurable from it, and its result changes nothing
downstream. In a game whose loop is *decide, spend, measure*, that is a week with no decision in it.
And the honest reading of §0.2 cuts both ways: 95 points at the absolute ceiling is **less than a J100
title**, so even the good outcome barely moves the ranking our whole economy is denominated in. The
feature's whole value is **tone** – a moment of belonging in a career that is otherwise a solitary
ledger – and tone is real but it is not measurable on any bench we run. ⚠ There is also a live risk
that the real thing is shrinking: the 16U event's genuine career reward, the Feed Up System that put
its medallists straight into J500 and J300 main draws, **was discontinued after the 2025 Finals**
(§3.4). We would be modelling a competition the ITF has just made less valuable. If the wave's budget
is tight this is a legitimate cut, and the cut costs nothing structural because nothing else depends
on it.

**My honest read**: build the letter, and only the letter. If it does not make the owner smile the first
time it arrives, delete it – it has no other job. What I would not do under any circumstance is build
the ladder-shaped version, because the moment this competition has promotion, relegation and a points
table, it has become another rung of the thing it was supposed to be a relief from.
