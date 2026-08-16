# Ranking points by tier — what the real junior ladder pays (and what ours should)

Compiled 2026-07-27. Answers the owner's question: **is `j30 = 400` vs `national = 200` defensible?**
Short answer — no, and in two independent ways at once. Primary sources throughout; every secondary
or dated figure is flagged in §7. Nothing here changes game logic; the recommendation in §6 is a
proposal for the architect.

## 0. The headline

1. **In the real ITF ladder the grade name IS the winner's points.** A J30 title pays **30**, a J300
   title pays **300**. The real J300:J30 ratio is **10×**. Ours is **2.5×** (1000 vs 400).
2. **In both national ladders that publish a table, a national title BEATS a J30 title** — USTA by
   3.3×, LTA by 2.2×. We pay the J30 **double** the national. That ordering is inverted.
3. **A first-round loss pays zero at every ITF grade.** We pay 12 points for losing the first round
   of a J30, 26 times a season. That is the actual engine of the "just play J30s" degeneracy.

## 1. ITF World Tennis Tour Juniors — the real table

**Singles and doubles, elimination draw format.** Verbatim from Regulation 31 of the
[2026 ITF World Tennis Tour Juniors Regulations](https://www.itftennis.com/media/15480/2026-itf-world-tennis-tour-juniors-regulations.pdf)
(published 5 December 2025), pp. 12–13.

| Singles | W | F | SF | QF | R16 | R32 |
|---|---|---|---|---|---|---|
| Grand Slam\*, Youth Olympics | 1000 | 700 | 490 | 300 | 180 | 90 |
| ITF Junior Finals | 1000 | 700 | 550/490 | 420/360/320/260 | – | – |
| J500 | 500 | 350 | 250 | 150 | 90 | 45 |
| J300 | 300 | 210 | 140 | 100 | 60 | 30 |
| J200 | 200 | 140 | 100 | 60 | 36 | 18 |
| J100 | 100 | 60 | 36 | 20 | 10 | 5 |
| J60 | 60 | 36 | 18 | 10 | 5 | – |
| J30 | 30 | 18 | 9 | 5 | 2 | – |

| Doubles | W | F | SF | QF | R16 |
|---|---|---|---|---|---|
| Grand Slam, Youth Olympics | 750 | 525 | 367 | 225 | 135 |
| J500 | 375 | 262 | 187 | 112 | 67 |
| J300 | 225 | 157 | 105 | 75 | 45 |
| J200 | 150 | 105 | 75 | 45 | 27 |
| J100 | 75 | 45 | 27 | 15 | 7 |
| J60 | 45 | 27 | 14 | 7 | – |
| J30 | 25 | 13 | 6 | 3 | – |

\* At Grand Slams only, qualifiers losing R1 of the main draw get 30 and final-round qualifying losers
get 20. Everywhere else there is no consolation.

**Four rules that matter more than the numbers** (same document):

- **Zero until you win a main-draw match.** Reg 31(a): *"No ranking points will be awarded to a
  player until he/she has played and won a round in the Main Draw."* A bye does not count; a walkover
  or a mid-match retirement does. So the R32 column means *reached R32 having won*, and the lowest
  paying rung at J30/J60 is R16 — one win in a 32-draw, worth **2** and **5** points.
- **Best six results, 52-week rolling window** (Reg 10 verbatim): the ranking counts *"the six best
  singles results obtained in Grand Slam, J500, ITF World Tennis Tour Junior Finals, International
  Team Competition and J300, J200, J100, J60 or J30 junior tournaments"*. Doubles counts at **one
  quarter** weight. **Our engine already implements exactly this** (`src/engine/season/ranking.ts`:
  `WINDOW_WEEKS = 52`, `BEST_N = 6`) — we got the counting rule right and the point values wrong.
- **Anti-farming clause** (Reg 10): only the best result from up to **two** editions of the same
  J100-or-higher event counts — but *"results from the same J60 and J30 tournament may be counted
  more than once"*. The ITF deliberately does **not** block J30 farming, because the points are too
  small to be worth blocking.
- **You cannot be ranked by staying home** (Reg 14): a year-end ranking needs ≥6 singles events
  *"including at least four Grand Slam, and/or ITF World Tennis Tour Junior Finals and/or J500
  tournaments and including at least three ranking tournaments outside his/her own country."*

**The 2023 renaming did not change the points.** The ITF's
[announcement](https://www.itftennis.com/en/news-and-media/articles/itf-world-tennis-tour-juniors-adopts-new-grading-structure-for-2023/)
says the new names simply reflect points already awarded, effective 1 Jan 2023: Grade A→J500,
1→J300, 2→J200, 3→J100, 4→J60, 5→J30 (Junior Grand Slams keep their name). **Verified against the
primary source rather than taken on trust**: the table in the
[2022 Regulations](https://www.itftennis.com/media/7280/2022-itf-wtt-juniors-regulations.pdf), p. 13,
is numerically identical row-for-row (Grade A 500/350/250/150/90/45, Grade 5 30/18/9/5/2). The only
row that moved is ITF Junior Finals (750→1000 for the winner). The claim holds.

Two rules did tighten: 2022 required ≥3 Grand Slam/Grade A events for a year-end ranking, 2026
requires ≥4. And from
[1 Jan 2026](https://worldtennisnumber.com/eng/news/key-changes-to-itf-world-tennis-tour-juniors-from-1-january-2026)
some J30/J60 events run a round-robin-to-elimination format (8 groups of 4) explicitly so early
losers get more matches — reality's answer to "one bad day ends your week", and it still pays 0 for
a player who wins nothing.

## 2. How many events, and how reachable

Counted directly from the **ITF's own 2026 calendar API** (`TournamentApi/GetCalendar?circuitCode=JT`,
pulled 2026-07-27, 982 unique tournaments; the API reports `totalItems: 983`, matching the ITF site's
advertised ["980 tournaments in 130 nations"](https://www.itftennis.com/en/tours/world-tennis-tour-juniors/)).

| Grade | Events 2026 | Share | Nations hosting | Max in one nation | Median per hosting nation |
|---|---|---|---|---|---|
| J30 | **445** | 45.3% | 118 | 11 (MEX) | 4 |
| J60 | **295** | 30.0% | 101 | 10 (MEX) | 2 |
| J100 | 137 | 14.0% | 59 | 8 (TUR) | 2 |
| J200 | 60 | 6.1% | 36 | 5 (USA) | 1 |
| J300 | 34 | 3.5% | 29 | 4 (USA) | 1 |
| J500 | **5** | 0.5% | 5 | 1 | 1 |
| Junior Grand Slam | 4 | 0.4% | 4 | 1 | 1 |

J30+J60 = **75.4%** of the whole tour; through J100 it is 89.3%. (Our `calendar.ts` comment already
asserts the 75% figure — it is correct.) The five 2026 J500s are Gaspar (BRA), Cairo (EGY), Offenbach
(GER), Milan (ITA), Osaka (JPN).

**Supply is inversely proportional to value, steeply**: 445 J30s vs 34 J300s (13:1) vs 9 J500-or-slam
events (49:1). And **reach** collapses even faster than count — a J30 is hostable in 118 nations, a
J500 in five. What a well-served kid sees at home in 2026: GBR 8 J30 / 5 J60 / 3 J100 / 1 J200 /
1 J300 / 1 slam; FRA 9/6/3/2/1/1; USA 5/8/4/5/4/1. The median J300-hosting nation gets **one** a year.

**Accessibility is an acceptance-list problem, not a points problem** (Regs 43, 47). Entry is ordered
by ITF junior ranking first, then ATP/WTA ranking, then unranked players by World Tennis Number, and
for J30/J60 only, a slice of direct acceptances goes to WTN alone (6 of 32 in a standard draw from
1 Jan 2026). Where places remain, **50% go to home-country players**. So a J30 is genuinely enterable
by an unranked 13-year-old near home, and a J300 is not — the gate is the queue, not the fee. Entry
fees are capped and nearly flat across grades (Reg 60: max $70 for a no-hospitality J30/J60, $150 for
a Tier-1 J500) — **the cost difference between rungs is travel, not entry.** That is the same
conclusion `junior-economics.md` reached from the family-budget side.

**Hard per-year caps by age** (Appendix F), which we do not model at all:

| Age | ITF junior events permitted per year |
|---|---|
| 18, 17 | unrestricted |
| 16 | **25** |
| 15 | **18** (+4 if top-20 ITF junior) |
| 14 | **14** (+4 if top-20) |
| 13 | **10** (+4 if top-50) |
| ≤12 | 0 — not eligible |

Counted birthday-to-birthday, and singles/doubles/qualifying all count as participation. This is
separate from and additional to the professional-tour age rule.

## 3. National federation ladders — a different currency, and the traffic is one-way

**No national result of any kind produces an ITF junior ranking point.** Reg 10's list of "Ranking
Tournaments" is closed and contains only ITF grades. The reverse happens constantly, but as
*ingestion at the federation's own valuation*, never as conversion.

**USTA (current, 2025).** A genuine 7-level national ladder; qualifying ITF events are re-badged into
it and paid at **USTA** values.

| Round | L1 | L2 | L3 | L4 | L5 |
|---|---|---|---|---|---|
| Champion | **3000** | 1650 | 900 | 540 | 300 |
| Finalist | 2400 | 1238 | 675 | 405 | 225 |
| Semifinal | 1800 | 825 | 450 | 270 | 150 |
| Quarterfinal | 1110 | 578 | 315 | 189 | 105 |
| R16 | 750 | 297 | 162 | 97 | 54 |
| R32 | 450 | 165 | 90 | 54 | 30 |

Source: [jr-points-table-2025.pdf](https://www.usta.com/content/dam/usta/2025-pdfs/jr-points-table-2025.pdf)
(footer "Updated January 2025"). Levels 6–7 pay per win (L6 20/win +15 champion; L7 12/win +8), max
4 matches counting.

Which ITF events map where — [ntl-jr-regulations-2025.pdf](https://www.usta.com/content/dam/usta/2025-pdfs/ntl-jr-regulations-2025.pdf),
Table 13, p. 23: **Level 1** = J300 *held in the USA*, US Open Juniors, Orange Bowl J500;
**Level 2** = J200 *held in the USA*; **Level 3** = J100, J60 **and J30 held in the USA**. The phrase
*"held in the United States of America"* is load-bearing: an American who flies to a J30 in Mexico
earns **zero** USTA points (she still earns her 30 ITF points).

→ **USTA National Championship title 3000 vs J30 title 900 — the national title is worth 3.3× the
J30.** And a J300 on home soil is graded *identically* to the National Championship (both Level 1).

**LTA (Britain).** A 5-grade national ladder that imports ITF results by a flat multiplier.

| LTA grade | 18U title | 16U | 14U | 12U |
|---|---|---|---|---|
| Grade 1 (National) | **2600** | 1600 | 1000 | 600 |
| Grade 2 (National) | 1950 | 1200 | 750 | 450 |
| Grade 3 (Regional) | 650 | 400 | 250 | 150 |
| Grade 4 (County) | 325 | 200 | 125 | 75 |
| Grade 5 (Local) | 195 | 120 | 75 | 45 |

Source: LTA per-age ranking-point PDFs, each footed **April 2020** — see §7, these are old.
The conversion, from the LTA support centre (undated page): Tennis Europe 14U ×15, Tennis Europe 16U
×7, **ITF Juniors 18U ×40**, with the worked example that 10 ITF points become 400 LTA points.

→ ×40 on the ITF table gives a **J30 title = 1,200 LTA points vs a Grade 1 national title = 2,600 —
the national title is worth 2.2× the J30.** Parity arrives at J60 (2,400); a J100 title (4,000)
clearly outranks a national title; a J300 title converts to 12,000, i.e. **4.6× the national title**.
(The multiplication is ours; LTA publishes the multiplier and the ITF table separately.)

**Tennis Australia — the premise fails.** There is no national junior points ladder any more: UTR
replaced it for entry and seeding from 1 January 2022, and the
[2026 Australian Competitive Play Junior Regulations](https://www.tennis.com.au/content/dam/tennisaustralia/tennis-topic/compete/documents/2026-Australian-Competitive-Play-Junior-Regulations.pdf.coredownload.pdf)
(22 Dec 2025) contain no points table at all. Worth knowing as a **naming trap**: TA's domestic
"J500"/"J1000" tiers are unrelated to ITF's J500 — TA's J1000 is a national title, ITF's J500 is the
top non-slam international grade. **FFT** is architecturally incompatible (points per individual
victory scaled by the beaten opponent's rank, not per-event tables) and we could not reach a primary
source; not modelled here.

**Which is "worth more" for the pathway** — nobody says it in words, but three mechanisms say it
structurally: ITF Reg 14 makes a year-end ranking impossible without four top-grade events and three
foreign ones; USTA's 18s National Championships direct-acceptance list admits the domestic top 16
*and, separately,* anyone with an **ITF junior ranking of 100 or better** (implicitly pricing ITF
top-100 ≈ domestic top-16); and Tennis Australia's own regulations require domestic draws to yield to
clashing ITF qualifying.

## 4. The step into the pros

**The naming rule repeats.** The brief's "$15k/$25k/$40k/$60k/$100k" labels are retired. Per the
[2024 WTT Summary of Rule Changes](https://www.itftennis.com/media/11482/2024-wtt-summary-of-rule-changes.pdf),
p. 1, the 2024 restructure removed W80 and renamed W25/W40/W60 to **W35/W50/W75**, *"align[ing] the
tournament naming with the points awarded to the Winner"* — the same move the juniors made in 2023.
So **every rung of the real ladder, junior and professional, is named after what the winner gets**:
J30…J500, W15…W100, WTA 125/250/500/1000. Only the Grand Slams (2000) break it. The current women's
tiers (2026 WTT Regulations, Section I) are **W15 / W35 / W50 / W75 / W100**; the numbers are points,
not prize money (W35 pays $30,000).

**WTA points by round** — 2026 WTA Official Rulebook, Section VIII.A.5, p. 145 (32 main draw rows;
the chart's internal header still reads "2025", verified identical to the 2025 chart):

| Category | W | F | SF | QF | R16 | R32 | Title ÷ one win |
|---|---|---|---|---|---|---|---|
| Grand Slam (128) | 2000 | 1300 | 780 | 430 | 240 | 130 | — |
| WTA 1000 (56) | 1000 | 650 | 390 | 215 | 120 | 65 | — |
| WTA 500 (30/28) | 500 | 325 | 195 | 108 | 60 | 1 | — |
| WTA 250 (32) | 250 | 163 | 98 | 54 | 30 | 1 | 8.3× |
| WTA 125 (32) | 125 | 81 | 49 | 27 | 15 | 1 | 8.3× |
| W100 (32) | 100 | 65 | 39 | 21 | 12 | 1 | 8.3× |
| W75 (32) | 75 | 49 | 29 | 16 | 9 | 1 | 8.3× |
| W50 (32) | 50 | 33 | 20 | 11 | 6 | 1 | 8.3× |
| W35 (32) | 35 | 23 | 14 | 8 | 4 | **0** | 8.8× |
| W15 (32) | 15 | 10 | 6 | 3 | 1 | **0** | **15.0×** |

Same shape as the juniors: **zero for a first-round loss at the two bottom rungs**, a nominal 1 point
higher up, and the bottom rung by far the steepest (15× at W15, settling to a flat 8.3× from W50
upward). W15 winner : Grand Slam winner = **1 : 133**. Doubles pays the same winner points as singles.

### 4a. ⚠ THE FULL CELL-BY-CELL AUDIT OF OUR OWN TABLE (added 05.08, points-by-the-book)

`real-ladder-pace.md` §4's correction 2 named the two rungs whose WINNER's points were wrong. The
owner then asked for the whole array rather than index 0 – *"the finish-by-finish curve below the
winner also has a real shape"* – so every rung in `season/calendar.ts` was diffed against the source
table above, cell for cell. **Fourteen rungs, six cells each.** Generated from the shipped file, not
transcribed.

| rung | ours (after the 05.08 correction) | source | verdict |
| --- | --- | --- | --- |
| local / regional / national | 30/18/10/0 · 80/48/28/14/0 · 200/120/70/35/15/0 | – | **invented rungs**, no ITF analogue at all (§6). Every number is ours. |
| j30 / j60 / j300 | 30/18/9/5/2/0 · 60/36/18/10/5/0 · 300/210/140/100/60/0 | Juniors Reg 31 | **exact.** The trailing 0 is Reg 31(a) – no points until you win a main-draw round – read at our 32-draw. |
| w15 | **15/10/6/3/1/0** | WTA VIII.A.5 | **exact – corrected 05.08 from 10/6/3/2/1/0.** |
| w35 | **35/23/14/8/4/0** | WTA VIII.A.5 | **exact – corrected 05.08 from 20/13/8/4/2/0.** |
| w50 / w75 | 50/33/20/11/6/1 · 75/49/29/16/9/1 | WTA VIII.A.5 | exact (verified at W2-LADDER). |
| **w100** | **100/65/40/25/12/0** | **100/65/39/21/12/1** | ⚠⚠ **DIFFERS IN THREE CELLS – semi-final 40 v 39, quarter-final 25 v 21, opening loss 0 v 1.** |
| wta125 / 250 / 500 / 1000 / slam | 125/81/49/27/15/1 · 250/163/98/54/30/1 · 500/325/195/108/60/1 · 1000/650/390/215/120/65 · 2000/1300/780/430/240/130 | WTA VIII.A.5 | exact. |

> ⚠⚠ **W100 IS THE THIRD ERROR OF THE SAME FAMILY AND IT WAS NOT IN THE APPROVED THREE.** It is the
> last surviving member of the trio `act2-pro-tour.md` §2 ruled "canon as-is" before the research
> existed – W15, W35 and W100 – and the other two have now been corrected against the chart. The
> repo already anticipated this: `tests/wave-b-points.test.ts`' `NOMINAL_ONE_TIERS` comment says in
> as many words that *"a future owner ruling that re-verifies w100's row should move it and this pin
> together"*. **Reported, not fixed**: the owner approved three specific corrections and a fourth
> re-pricing nobody asked for is exactly the scope creep the builder rulings forbid. The magnitude is
> small – a semi-final and a quarter-final one and four points light, and an opening loss paying
> nothing where the chart pays a nominal 1 – and the direction is the same one W15 and W35 had:
> **under-priced against the rung's own published row.** Fixing it is one array plus the `w100` entry
> in `NOMINAL_ONE_TIERS`, and it needs a measured arm of its own.

### 4b. ⚠ THE TWO ROWS THE RULEBOOK'S CHART DOES NOT PRINT (added 14.08, the 128-draw wave)

§4's table is the rulebook's own layout and it stops at R32, because **the chart is drawn in 32
main-draw rows** – every category shares the six columns W/F/SF/QF/R16/R32. For the rungs whose real
draw IS 32 that is the whole ladder. For the Grand Slams (128) and the WTA 1000s (96 or 56) it is a
truncation: the rounds BELOW R32 exist and are paid, the chart simply does not have columns for them.

`act2-pro-tour.md` §9 made that truncation the reason a 128-draw Slam could not ship – *"A 128-draw
Slam would have needed two rows the research does not print"* – and `calendar.ts` repeated it. It was
a real blocker and it was a **sourcing** blocker, not a modelling one. Sourced 14.08:

| category (draw) | W | F | SF | QF | R16 | R32 | **R64** | **R128** |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Grand Slam (128) | 2000 | 1300 | 780 | 430 | 240 | 130 | **70** | **10** |
| WTA 1000, combined (96) | 1000 | 650 | 390 | 215 | 120 | 65 | **35** | **10** |
| WTA 1000, non-combined (56) | 1000 | 650 | 390 | 215 | 120 | 65 | **10** | – |

Sources, two independent publications agreeing cell for cell on the Slam row:
[WTA, "Rankings Explained"](https://www.wtatennis.com/rankings-explained) ·
[SUPER.TENNIS, "WTA Ranking Points Explained – 2026 Point Distribution"](https://super.tennis/rankings/wta-ranking-points-explained/).

⚠ **AND THE 56-DRAW ROW IS WHY OUR 1000 SHIPS AT 64 RATHER THAN 96.** `runTournament` is a pure
single-elimination fold with no bye machinery, so a real 56-draw IS a 64-bracket in this engine
(`tools/big-draw-cost.ts` states the same equivalence). The 56 column therefore maps onto our seven
rounds **exactly**, with nothing adapted or interpolated – where a 96 would have had to be squeezed
into 128 and the R128 borrowed. Fully sourced beat closer-to-the-biggest-events.

**Prize money for the same two rounds is DERIVED, and the derivation is stated.** Our shipped
`prizeCents` ladders are not any single real event's – they are flatter than every one of them – so
copying two absolute figures would have bent our own curve at the bottom. Each new round instead
takes a real ladder's SHAPE at that step and applies it to OUR neighbouring round:

| rung | real reference | ratio | ours |
| --- | --- | --- | --- |
| slam R64 | Wimbledon 2025: £99,000 of £152,000 at R32 | 0.651 | 190,000 × 0.651 = 123,747 → **$124,000** |
| slam R128 | Wimbledon 2025: £66,000 of £152,000 | 0.434 | 190,000 × 0.434 = 82,500 → **$82,000** |
| wta1000 R64 | Dubai 2025 (56 draw): $16,900 of $23,500 at R32 | 0.719 | 31,000 × 0.719 = 22,289 → **$22,000** |

Sources: [Wimbledon 2025 prize money by round](https://www.si.com/tennis/wimbledon-prize-money-breakdown-2025-how-much-players-earn-in-each-round) ·
[Dubai Duty Free 2025 prize money](https://tennisuptodate.com/wta/here-is-how-much-you-can-earn-in-prize-money-at-wta-dubai-duty-free-tennis-championships-2025).

**Volume repeats too.** ITF states *"approximately 600 tournaments across 65 countries"* for the
women's tour; counting the calendar API gives 618 (2024) and 641 (2025), of which **~48% are W15** and
~4% W100 — the same supply pyramid as the juniors, one tier shallower.

**No junior points ever become WTA points.** There is no conversion in either rulebook. What exists
is **access**, in three formal mechanisms:

- **Junior Reserved places** (2026 WTT Regs, Section VII.A, Method E): at **W15 events only**, up to
  three main-draw places for players with an ITF combined junior ranking of **1–100** who could not
  get in any other way, and who have **turned 14**. This is the literal junior→pro door.
- **Junior Accelerator** (2026 WTT Regs App. D / juniors App. M): the girls' **top-20 year-end junior
  ranking** gets direct main-draw entry into designated women's events — #1 gets 3 up to W100 plus 2
  up to W75; #11–20 get 1 up to W50 plus 4 up to W35. One place per tournament.
- **Pro Path Merited Increases** (2026 WTA Rulebook, Section X.A.4.b): a year-end **top-5** junior
  aged 14–17 earns up to 4 *extra* tournaments per year beyond her age cap.

**Professional age caps** (2026 WTA Rulebook, Section X.A.2), separate from and additional to the
junior caps in §2: **under 14 = 0 pro events**, 14 = **8** (max 3 at W75+), 15 = **10**, 16 = **12**,
17 = **16**, 18+ unlimited. Also: a player ranked WTA 1–150 may not enter W15/W35 at all, which keeps
the bottom rung a genuine bottom rung.

→ **Two disjoint currencies, one bridge, and the bridge is a door rather than an exchange rate.** A
15–16-year-old's first professional event is a **W15**, entered on qualifying, on her World Tennis
Number, or on a junior-reserved place — which is why a top-100 junior *ranking* is the asset, not any
point total she could carry across.

### 4c. ⚠⚠ THE ACCEPTANCE LISTS — AND THE REAL RULE IS THE OPPOSITE SHAPE FROM OURS (added 15.08)

**Why this section exists.** `season/calendar.ts` carries a per-rung acceptance table —
*"the real acceptance range (women's ITF/WTA)"*, `W35 ~#250–700 · W50 ~#200–550 · W75 ~#150–450 ·
W100 ~#120–350 · WTA 125 ~#80–250"* — with `TierDef.acceptsRank` set to each range's floor. **That
table has never been in this document, and it has never carried a source.** It entered the repo on
2 Aug 2026 (commit `62ad7ab`, *"the acceptance cuts stop being shares"*) already printed as fact, and
propagated from there into `living-field.md` §8.2d, `population-1600-2026-08.md` §2 and
`ladder-pace-2026-08.md` §3d, each citing the one before it. The owner's 15.08 question — *«реальный
W75 отбирает заметно у́же»* — is the first time anybody asked the source for it. Taken to the
governing regulations, below.

**A. THE ITF W RUNGS (W15/W35/W50/W75/W100) HAVE NO RANK CUT AT ALL. THE LIST IS AN ORDERING.**

[2026 ITF World Tennis Tour Regulations](https://www.itftennis.com/media/15546/2026-wtt-regulations.pdf)
(men's and women's in one file, cover version **12/12/2025**), *Women's WTT* Section VII, "Singles
System of Merit at W35, W50, W75 and W100 Tournaments" — **one section governing all four rungs**,
verbatim in structure:

| Method | who it selects | ordered by |
| --- | --- | --- |
| A | players with an approved WTA singles ranking | WTA ranking |
| B | players with an approved ITF World Tennis singles ranking | ITF points list |
| C | players with **neither ranking** but a verified World Tennis Number | WTN |
| D | players with **no ranking and no WTN** but a top-500 *national* ranking | electronic draw, one chip per nation |
| D.c | *"All remaining entered players who are **unranked and have no National Ranking** shall be randomly drawn electronically at the ITF Office for a position on the Acceptance List."* | random |

→ **There is no threshold anywhere in it.** An unranked player is not refused a W75; she is placed at
the bottom of the list. The "cut" at a real W75 is an emergent weekly artefact of *who entered*, not a
published number — and W35, W50, W75 and W100 are governed by the **identical** rule, so the
regulations draw no acceptance distinction between them whatsoever. W15's own section (Method A–D) is
the same list plus **Method E, Junior Reserved**: *"Entered players with an approved ITF Combined
Junior Ranking of 1-100 shall be selected for a maximum of three (3) Main Draw places."*

⚠ **AND IN PRACTICE METHODS B, C AND D ARE DEAD LETTERS.** Read off real acceptance lists (see A2):
at W15 Brasov **all 15 direct acceptances and all 56 qualifying entries held WTA rankings**;
ITF-ranked, WTN-only and unranked players appear only among the 257 alternates. Same at W75 Tianjin
(20 of 20 and 27 of 27). Method A exhausts every place, so a W15 is a **WTA-ranking door in practice**
even though the rule opens it to the unranked. The rule and the reality differ, and both matter: the
rule is why there is no *threshold*, the practice is why there is still a *cut*.

### 4c-A2. ⭐ THE OBSERVED CUTS — read off the ITF's own published acceptance lists

Because no cut is published as a rule, the only honest figure is an **observed** one. Source: the
ITF's per-tournament Acceptance List pages, e.g.
[W75 Hechingen](https://www.itftennis.com/en/tournament/w75-hechingen/ger/2026/w-itf-ger-2026-010/acceptance-list/),
served by `itftennis.com/tennis/api/TournamentApi/GetAcceptanceList`. **All read 15 August 2026.**
A cut is quoted **only from lists with zero vacated slots** — a vacated slot means a post-deadline
withdrawal, which makes the reading a lower bound rather than a cut. WTA rank of the **last direct
acceptance**, 32 main draws:

| rung | events read | **observed cut (WTA rank)** | ours (`acceptsRank`) |
| --- | --- | --- | --- |
| **W15** | Fiano Romano · Hurghada · Brasov | **512 · 585 · 590** | *no cut* (on-ramp) |
| **W35** | 8 events (Kursumlijska · Trieste · Krakow · Verbier ×2 · Bistrita · Erwitte · Barueri) | **298\* · 551 · 662 · 716 · 724 · 730 · 835 · 871** | **700** ✅ mid-range |
| **W50** | Leiria · St-Palais · Oldenzaal · Kursumlijska · Prague | **204 · 234 · 390 · 424 · 441** | **550** ⚠ too deep |
| **W75** | Tianjin · Bytom · Kursumlijska ×2 | **262 · 305 · 334 · 359** | **450** ⚠⚠ **too deep** |
| **W100** | *no clean list exists* | **not sourced** — best available is Gran Canaria 27 Jul, deeper than 285 with 2 slots vacated, a lower bound only | 350 |

\* the 298 is an outlier in an otherwise 551–871 spread.

> **THE HEADLINE. A REAL W75'S CLEAN CUT IS WTA ≈ 262–359. OURS IS #450.** The owner's *«реальный
> W75 отбирает заметно у́же»* is correct and the gap is roughly 100–190 places. **W35's 700 is
> right** — squarely inside the observed 551–871. **W50's 550 is too deep** against an observed
> 204–441. So the error is not uniform across the family: two rungs are wrong and one is right.

⚠ **REGIONAL EFFECT, WORTH CARRYING.** Depleted (lower-bound) W75 lists: Hechingen ≥307, Leipzig
≥312, Ourense ≥343, Koksijde ≥351, and **Lexington KY ≥494** — US-based W75s draw a markedly weaker
field than European ones. A single global cut is a simplification of a real geographic spread.

⚠ **AND THE CUT IS A MOVING TARGET BY CONSTRUCTION.** It is set at the entry deadline (the ranking
list *"dated twenty-one (21) days prior to the Monday of the Tournament Week"*) and drifts deeper as
players withdraw. `[I]` The ITF list's rank field is almost certainly that deadline snapshot — every
one of ~20 lists read was perfectly monotonic, which a live field would not be — but this could not be
proved outright. Treat as high-confidence inference. **⚠ One unresolved anomaly:** Danka Kovinic
appears at WTA 95 atop a W35 list (`w-itf-srb-2026-018`), which appears to contradict the Play Down
Rule in C below. Flagged, unexplained; it affects no cut figure (she is position 1, never the cut).

**B. WHAT REALLY DIFFERS BETWEEN THE RUNGS IS THE DRAW'S COMPOSITION, AND IT IS PUBLISHED.**
Same document, "Main Draw" composition for a 32 draw:

| | W15 | W35–W100 |
| --- | --- | --- |
| **Direct acceptances** | **13–17** | **16–20** |
| Qualifiers | 8 | 8 |
| Junior Reserved | 3 | **–** |
| Wild cards | 4 | 4 |
| Special Exempt · Junior Accelerator | 0/1/2 each | 0/1/2 each |

→ **A real W75 admits only 16–20 of its 32 players off the acceptance list.** The other twelve to
sixteen chairs are won (qualifying), given (wild cards) or reserved. Our `selectEntrants` fills all
32 from one eligible pool, so we model the half of a real draw that reality decides by ranking and
none of the half it decides by other routes.

**C. THE REAL HARD RULE IS A CEILING, NOT A FLOOR — "WTA Play Down Rules", verbatim:**

> *"Players with a WTA ranking of 1-50 in Singles … cannot Enter, accept a Wild Card and/or compete
> in Singles or Doubles in any Women's WTT Tournament."*
> *"Players with a WTA ranking of 1-150 in Singles … cannot Enter, accept a Wild Card and/or compete
> in Singles in any Women's WTT W15 or W35 Tournament."*

→ So the sport's only published per-rung rank rule on this family runs **the other way from ours**:
the world top 50 is barred from every W event and the top 150 from W15/W35 singles (doubles still
allowed). The WTA does the same one family up — its
[2026 Official Rulebook](https://photoresources.wtatennis.com/wta/document/2025/12/24/b300b2a4-8d71-4346-969f-1f6b9399661f/2026-WTA-Rulebook-12-22-2025-.pdf)
prints a "WTA 125 Tournament Acceptance Summary" in which **players ranked 1–20 may not play a 125**
in most weeks and *"up to 4 players ranked 21-50 may only play via Wild Card"* (Section III.C.2.b).
**Reality gates the strong OUT; we gate the weak IN.** (The rulebook is re-issued through the year;
the URL above is the 12/12/2025 edition, verified byte-for-byte. The index that survives revisions is
[wtatennis.com/wta-rules](https://www.wtatennis.com/wta-rules).)

**C2. AGE — AND W75 HAS NO AGE FLOOR OF ITS OWN.** The only age thresholds anywhere in the 2026 ITF
WTT Regulations are **14** — Women's Section III.A.1, *"Minors under the age of fourteen (14) shall
not be eligible for Entry"* — and **18**, the AER cut-off. A 15-, 16- or 17-year-old is limited only
by her per-year **count** (§4's table, counted birth-year to birth-year), and the one rung-specific
rule in the sport is the WTA's sub-cap of **three W75-and-above events** inside a 14-year-old's eight.
Under-15s may not enter WTA tournaments by direct acceptance (wild card only, WTA Rulebook II.D); the
Grand Slam floor is also 14.

**D. THE GRAND SLAM — OURS IS RIGHT, AND BOTH THE RULE AND THE OBSERVATION AGREE.**
[2026 Official Grand Slam Rule Book](https://www.itftennis.com/media/5986/grand-slam-rulebook-2026-f2.pdf),
singles main-draw composition:

| Total accepted | Direct acceptances | Qualifiers | Wild cards |
| --- | --- | --- | --- |
| **128** | **104, 108, 112** | 16, 12, 8 | 8 |

⚠ **It is prefaced *"Unless otherwise agreed"*, so 104/16/8 is one of three permitted configurations
rather than a mandate** — only WC = 8 is fixed. That all four majors in fact run 104/16/8 is
*observed*, not *rule*. The observed cut-offs agree closely: **Australian Open 2026 = No. 103**
(Leolia Jeanjean, [ausopen.com](https://ausopen.com/articles/news/australian-open-2026-entry-lists-released),
9 Dec 2025) and **US Open 2026 = No. 102** (Anastasia Zakharova,
[official entry list](https://www.usopen.org/pdf/womens-2026-us-open-main-draw-entry-list.pdf.pdf),
generated 3 Aug 2026); US Open 2025 was **No. 99 at the deadline and No. 102 three weeks later**
([list](https://www.usopen.org/pdf/womens-2025-us-open-main-draw-entry-list.pdf)) — the clearest
demonstration on this page that a cut drifts. → **`slam.acceptsRank: 104` is exact.** It is a count of
*entrants accepted* rather than a world-rank cut-off, which errs conservatively (admits fewer).

**E. THE JUNIOR RUNGS — sourced at last, and one of ours is out by a factor of twenty.**
[2026 ITF WTT Juniors Regulations](https://www.itftennis.com/media/15745/2026-itf-world-tennis-tour-juniors-regulations.pdf)
(published 5 Dec 2025, updated 24 Mar 2026). ⚠ The ordering is **Regulation 43**, not 47 — §2 above
says "Regs 43, 47" and 47 is Composition of Draws; the regulations themselves misreference it.
Order: ITF junior ranking → ATP/WTA ranking → WTN → 16&U regional WTN → unranked residual. **WTN
direct acceptances exist only at J30/J60** (4 in a 32 main draw); a J300 has no WTN path. The
"50% home country" rule is **Reg 43 e) i)** and applies **only to the unranked residual pool**, not as
a main-draw quota — at a J300 that residual is normally zero.

Observed cuts, girls, ITF Combined Junior Ranking, read 15 Aug 2026 from the same acceptance-list
pages, against a girls' list of **4,890 players** (ITF rankings API `totalItems`, ranking date
10 Aug 2026, backing [itftennis.com rankings](https://www.itftennis.com/en/rankings/world-tennis-tour-rankings/)):

| rung | observed cuts | **as a share of 4,890** | ours (`enterPct`) | gap |
| --- | --- | --- | --- | --- |
| **J300** | Repentigny 48MD **81** · College Park 48MD **101** · Pancevo 32MD **182** | **top ~2%** | **0.40** | ⚠⚠ **20× too loose** |
| **J60** | Domzale **2,140** · Cholpon-Ata **2,553** · Chennai **2,967** · Kreuzlingen **3,147** | **top ~44–64%** | **0.50** | ✅ **inside the range** |

J60 qualifying runs ~95% deep and still does not fill. **So `j60`'s 0.50 is right and `j300`'s 0.40
is the largest single error in the whole acceptance ladder** — a real J300 is a top-2% event and ours
admits the top 40%.

**F. POPULATION DENOMINATORS.** ITF World Tennis Ranking, women's singles: **2,335 players**, rank
date 10 Aug 2026 (ITF rankings API). ITF junior girls: **4,890**. **⚠ The total size of the WTA
singles ranking list is `not sourced`** — wtatennis.com renders only the top 100, its paging
parameters are ignored and `api.wtatennis.com/tennis/players/ranked` returns HTTP 400; the deepest
WTA rank actually seen in ITF data was 1,521, which is a floor and not a total.
`docs/research/real-ladder-pace.md` §5 carries **~1,550–1,600 (list ends #1531 on 3 points, Aug 2026)**
from its own paged pull, and that remains the best figure this repo has.

**G. WHAT IS STILL `not sourced`.**

* **Observed cuts for WTA 125, WTA 250, WTA 500 and WTA 1000.** The WTA publishes qualifier counts by
  draw size (Section V) and wild-card counts by level (Section III.C.2.a) but no acceptance depth, and
  no entry list was located. Arithmetic on the two published tables gives **≈76 DA** for a 96-draw
  1000, **≈44** for a 56-draw, **≈23–24** for a 32-draw 500 or 250 — *derivation, not a published
  figure*, and a DA **count** is not a rank cut. So `wta125 250 · wta250 200 · wta500 120 ·
  wta1000 65` all remain unsourced.
* **A clean W100 cut** — only a lower bound (deeper than #285). Nine W100s exist in the whole 2026
  calendar and seven publish no list.
* **The W35–W100 lists as they stood at the entry deadline.** The ITF publishes only the live list and
  purges it weeks after the event, so every observed cut above is a snapshot with the drift caveat.

## 5. The ratio that matters

**Title ÷ points for winning exactly one main-draw match** (32-draw reading, so directly comparable
to our tiers), and the step from the rung below:

| Rung | Title | One match won | Title ÷ one-win | Step vs rung below |
|---|---|---|---|---|
| J30 | 30 | 2 | **15.0×** | — |
| J60 | 60 | 5 | **12.0×** | 2.00× |
| J100 | 100 | 10 | **10.0×** | 1.67× |
| J200 | 200 | 36 | **5.6×** | 2.00× |
| J300 | 300 | 60 | **5.0×** | 1.50× |
| J500 | 500 | 90 | **5.6×** | 1.67× |
| Junior Grand Slam | 1000 | 180 | **5.6×** | 2.00× |

Two shapes fall out, and both are the opposite of ours.

**(a) The real ladder compresses as you climb.** At J30 the title is worth 15 single wins; at J300 it
is worth 5. Low grades are winner-take-most — showing up buys nothing. High grades pay you for merely
being in the draw, because being in the draw already means you beat the acceptance list. **Our table
uses a flat 13.3× at every rung from national upward** (`[200,120,70,35,15,6]`, `[400,…,30,12]`,
`[600,…,45,18]`, `[1000,…,75,30]` are the same shape rescaled), so a J300 feels exactly like a J30
with bigger numbers. Nothing about the *shape* tells the player she has changed worlds.

**(b) A first-round loss is worth 0 everywhere in reality; ours pays at every rung.** We pay 12 for
losing R1 at a J30, 26 times a season = a 72-point floor before winning anything. Combined with
best-6 that is a participation income the real tour does not have.

**Both shapes are confirmed independently by the pro ladder** (§4), which was designed separately and
lands in the same place: 15.0× at the entry rung W15, flattening to 8.3× from W50 up, and 0 points
for a first-round loss at W15/W35. Reality tests this shape twice and gets the same answer.

**Per-rung steps are the one thing we roughly get right**: real junior steps run 1.5–2.0× (geometric
mean ~1.79×), pro steps 1.25–2.33×; ours run 2.67/2.5/2.0/1.5/1.67 (~2.03×). The steps are fine. What
is wrong is which rung each step is attached to, and how often that rung comes round.

## 6. What this means for the game

### Is `j30 = 400` vs `national = 200` defensible?

**No — and it fails against both possible readings of what our points are.**

- *If our points are an ITF-style world ranking*, then a National title should pay **0**, because
  national events are not Ranking Tournaments (Reg 10). J30 above National would be right in
  direction but our magnitude is 13× too generous: the real entry rung pays **30**, not 400.
- *If our points are a national-federation ladder that ingests international results* — which is what
  they actually behave like, since our kid plays domestic and international events into one number —
  then **both published federations put the national title above the J30 title** (USTA 3.3×, LTA
  2.2×). We have it inverted, at 0.5×.

There is no reading in which a J30 title is worth twice a national title. And the more damaging error
is the one the owner did not ask about: **J300 pays only 2.5× a J30 when reality says 10×.** That,
not the National comparison, is why the top of our ladder feels optional.

### Recommended table

One convention is worth honouring before the numbers: **real tennis names every rung after what the
winner gets**, at both junior and pro level (§4). We ship a tier called "Junior Tour 30" that pays
**400**. Whatever scale is chosen, the three J-rungs should pay a clean multiple of their own name.

Anchor the three international rungs on the **real ITF table ×10** (so the J-number-is-the-points
property survives as `J30→300`, `J60→600`, `J300→3000`), and place the three invented domestic rungs
using the only published ITF↔national conversion that exists (LTA's ×40), with the National rung
nudged to the ×10 value of a **J100** title — the ITF grade whose field strength a strong national
championship most resembles, and a defensible centre of the USTA (National ≈ J300) / LTA
(National ≈ J60) spread.

| Rung | Title | F | SF | QF | R16 | R1 loss | Derivation |
|---|---|---|---|---|---|---|---|
| Local Open (8-draw) | **50** | 30 | 15 | – | – | 4 | LTA Grade 5 ratio to J30 (0.16) |
| Regional Championship (16) | **160** | 96 | 48 | 26 | – | 6 | LTA Grade 3 ratio to J30 (0.54) |
| Junior Tour 30 (32) | **300** | 180 | 90 | 50 | 20 | **0** | real ITF J30 ×10 |
| Junior Tour 60 (32) | **600** | 360 | 180 | 100 | 50 | **0** | real ITF J60 ×10 |
| National Series (32) | **1000** | 600 | 360 | 200 | 100 | **0** | real ITF J100 ×10 |
| Junior Tour 300 (32) | **3000** | 2100 | 1400 | 1000 | 600 | **0** | real ITF J300 ×10 |

This reproduces reality's compression almost exactly — title ÷ one-win comes out 15.0 / 12.0 / 10.0 /
5.0 for J30 / J60 / National / J300 against the real 15.0 / 12.0 / 10.0 / 5.0. The 3× National→J300
gap is not a flaw: it is the rung we do not ship — a J200 would sit at 2000, exactly in the hole
(and a J500, if ever added, at 5000).

**Token R1 points at Local and Regional are a deliberate deviation from reality** (which pays 0
everywhere). They are onboarding scaffolding for the two rungs the kid is meant to outgrow; from
National upward the real 0 applies, which is where the anti-grind work is needed.

### What it does to "just play J30s"

Best-6 season ceiling by single-tier strategy, at our current event counts (26/13/6/26/17/4 — from
`tests/season/calendar.test.ts`):

| Strategy (best 6 counting) | Current | Recommended |
|---|---|---|
| 6 Local titles | 180 | 300 |
| 6 Regional titles | 480 | 960 |
| 6 J30 titles | **2400** | 1800 |
| 6 J60 titles | 3600 | 3600 |
| 6 National titles (must win all six) | 1200 | 6000 |
| 4 J300 titles + 2 J60 titles | 5200 | 13200 |
| **One J300 title vs a perfect J30 season** | **0.42×** | **1.67×** |

That last row is the whole fix. Today a flawless year of J30s outscores a J300 title 2.4-to-1, so
there is no reason to ever get on the expensive plane. Under the recommendation **one J300 title beats
an entire perfect J30 season**, the J30 grind caps at 1800, and the National rung — six events, cheap
travel, brutal field — becomes the genuine domestic alternative to the J60 circuit rather than a rung
nobody visits.

### Structural consequences the architect has to rule on

1. **The ladder order changes** to `local < regional < j30 < j60 < national < j300`. `TIER_LADDER`
   is the declared source of truth for "is tier A above tier B", so this touches scheduling
   precedence, the tier guide, the season strip and every monotonicity test. It is the change that
   makes the doc's numbers true to the sources; it is also the most invasive one.
2. **Gate ≠ value.** The National rung should keep an *early* `enterPointBand` (reachable from a
   regional book, as now) while paying 1000 — a kid can walk into her national championship and be
   crushed by `entrantPctBand [0.2, 0.7]`. That is the correct fiction and it is already expressible
   with the existing two knobs.
3. **All six `enterPointBand`s need rescaling** on the bench; the current bands (85/230/150/180/400/
   900) are denominated in the old scale. Indicative only: gating each rung at ≈2–2.5 titles of the
   rung below reproduces today's pacing without the 3-tournament climb the current bands allow (one
   J30 title at 400 currently unlocks J60 outright).
4. **Two levers reality uses that we do not have at all**, both stronger anti-grind tools than any
   points table — worth a backlog entry rather than this retune:
   - **Age caps on events per year** (§2): 10 at 13, 14 at 14, 18 at 15, 25 at 16 — and a separate,
     additional professional allotment of 0/8/10/12/16 at ages ≤13/14/15/16/17 (§4). We let a
     14-year-old play 26 J30s; the ITF lets her play 14 junior events in total. This alone would end
     the grind, and it is the same lever `junior-economics.md` already argued for from the cost side
     ("realistic play ≈ 15–20 events/yr, not the ~50 our entry-policy-v1 enters").
   - **Eligibility-by-composition** (Reg 14): no year-end ranking without ≥4 top-grade events and ≥3
     abroad. A "she needs J300 results to be ranked at all" rule is a direct, sourced import.

### Where reality has no clean analogue to our invented rungs

- **"Regional Championship" is a name collision.** In ITF vocabulary a Regional Championship is a
  *continental* event (Appendix B): staged by a Regional Association, entered only on nomination by
  your national association, and a player may play **one regional plus at most two inter-regional
  championships per calendar year**. We run 13 a season as the second-cheapest rung. The tier is fine
  as a game object; the label points at something a player can enter once a year, not thirteen times.
- **Local Open and National Series have no ITF value at all** — zero, by Reg 10. Every number we
  assign them is invention. The LTA-derived ratios above are the most defensible invention available
  because LTA is the only federation that publishes an explicit ITF exchange rate, but they are an
  exchange rate between *LTA's* ladder and ITF's, not a fact about club tennis.
- **We collapse ladders reality keeps disjoint.** National, continental, ITF junior and pro are four
  separate currencies with no conversion; the only bridges are acceptance lists and the Junior
  Accelerator. Our single currency is a legitimate simplification, but it means the exchange rate is
  ours to invent — and the invented rate is exactly what broke. The long-term-correct version is two
  tracks (domestic ranking + ITF ranking) with the J-rungs gated on the ITF track only. That is a
  system, not a table, and it belongs in the backlog rather than in this retune.

## 7. Data-quality flags

- **Solid and primary**: the ITF singles/doubles tables, Regs 10/14/31/47/60 and Appendices B/F/M
  (2026 Regulations PDF, 5 Dec 2025); the 2022 comparison table (2022 Regulations PDF); the 2026
  event counts (pulled from the ITF's own calendar API on 2026-07-27, 982 rows, cross-checking the
  ITF's advertised ~980). The "points did not change in the 2023 rename" claim was verified
  row-by-row against the 2022 table rather than taken from the announcement.
- **LTA tables are dated April 2020** — still the live published version, but five-plus years old.
  The ×40 ITF multiplier page carries **no date at all**. The LTA column of §3 is the weakest link in
  the recommendation, and the recommended domestic ratios rest on it. Re-verify before shipping.
- **The ×40 conversion figures are our arithmetic**, not an LTA-published table. Likewise the USTA
  Level 6/7 title values quoted in the source research.
- **USTA has an internal contradiction**: the Regulations (governing) restrict Level 3 to ITF events
  *held in the USA*; USTA's overview PDF says "all ITF Grade 3/4/5" with pre-2023 naming and no
  geographic clause. We followed the Regulations.
- **Tennis Australia and FFT contributed nothing usable** — TA abolished its junior points ladder for
  UTR in 2022; FFT's per-victory architecture is not comparable and we reached only French Wikipedia,
  a secondary source. Neither is relied on above.
- **The pro section (§4) is primary throughout** — 2026 WTA Official Rulebook, 2026 WTT Regulations,
  2024 WTT Summary of Rule Changes. Three caveats on it: (a) the WTA points chart carries a stale
  "2025" header, verified identical to the 2025 chart, so it is a typo and not a missing update;
  (b) **ITF Appendix K and the WTA Rulebook disagree on the W35 48-draw row** (ITF gives
  35/30/18/9/5/3, WTA gives 35/23/14/8/4/2) — we use the WTA figures, which are the governing ones for
  WTA points and match the geometric shape of every neighbouring tier; (c) the ITF's Aug-2024 press
  release announcing W15→$20,000 and W75→$70,000 for 2025 **never took effect** — the regulations and
  live calendar still show $15,000 and $60,000, so those press-release figures must not be used.
- **2026 event counts are a live snapshot** taken 2026-07-27 and will grow as late-season events are
  sanctioned; the junior figure (982) is essentially complete, the women's pro figure (567) is not.
- **The brief's event counts for two tiers were wrong**, which matters: it lists J60 at ~4/season and
  J300 at ~2. The shipped config is `everyNWeeks: 3` and `13`, and the pinned test expects
  `{ local: 26, regional: 13, national: 6, j30: 26, j60: 17, j300: 4 }`. **J60 runs 17 times a season
  at 600 points**, so under the current table the strongest grind is not J30 at all — it is J60, at a
  3600 ceiling, unlocked by a single J30 title. Any retune should be validated against the config,
  not the brief.
