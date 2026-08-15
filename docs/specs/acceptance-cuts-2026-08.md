---
type: spec
status: current
area: simulation-and-balance
canonical: false
last-reviewed: 2026-08-15
---

# The acceptance cuts, audited against reality – and the constant that also decides the college ending

**The owner, 15.08, verbatim:**

> «У нас W75 пускает всех из топ-450 профессиональной таблицы, с 17 лет, без порога по очкам.
> Реальный W75 отбирает заметно у́же. А заодно и с другими ступенями тоже актуализировать.»

**He is right, and the sourced gap is bigger than he stated.** A real W75's clean acceptance cut is
**WTA 262–359**; ours is **#450**. But the audit found three other things that matter more than that
number, and one rung where our invented figure is out by a factor of twenty.

**No engine constant moves in this wave.** Every rung gets a verdict – *leave*, *change* or *needs the
owner* – and the ladder is not retuned unilaterally. The edits are: a new tool, this spec,
`docs/research/ranking-points-by-tier.md` §4c, and **comment corrections in `season/calendar.ts` that
remove an unsourced claim and record the sourced figures beside the numbers they judge**.

---

## 0. THE FOUR FINDINGS, IN ORDER OF HOW MUCH THEY MATTER

> ### 1. ⚠⚠ EIGHT OF OUR NINE CUTS MODEL AN INSTRUMENT THE SPORT DOES NOT HAVE.
> The 2026 ITF World Tennis Tour Regulations govern **W35, W50, W75 and W100 under one shared
> "System of Merit"**, and it contains **no rank threshold of any kind** – it is an *ordering*
> (WTA rank → ITF rank → World Tennis Number → national ranking → *"randomly drawn electronically"*).
> An unranked player is not refused a W75; she goes to the bottom of the list. The one published
> per-rung rank rule runs the **other way**: WTA #1–50 may not enter any W event, #1–150 may not enter
> W15/W35 singles, and a WTA 125 bars #1–20 outright. **Reality gates the strong OUT. We gate the weak
> IN.** Research §4c-A/C.
>
> ### 2. ⚠ THE FIGURES WERE NEVER SOURCED – THEY WERE REPEATED FROM A COMMENT.
> `W35 ~#250–700 · W50 ~#200–550 · W75 ~#150–450 · W100 ~#120–350 · WTA 125 ~#80–250` entered the repo
> on 2 Aug 2026 (commit `62ad7ab`, *"THE FIX IS THE REAL TOUR'S OWN ENTRY RANGES"*) already printed as
> fact, with no citation, and propagated into `living-field.md` §8.2d → `population-1600-2026-08.md`
> §2 → `ladder-pace-2026-08.md` §3d, each citing the one before it. It has never been in
> `ranking-points-by-tier.md`, this repo's sourced document for exactly this ladder. **Now measured
> against real acceptance lists: two of the ranges are wrong, one is right.**
>
> ### 3. ⚠⚠ `j300.enterPct` IS TWENTY TIMES TOO LOOSE, AND THAT IS THE BIGGEST ERROR ON THE LADDER.
> Real J300 acceptance lists cut at ITF Combined Junior **81 / 101 / 182** against a girls' list of
> **4,890** – **the top ~2%**. Ours admits **the top 40%**. Both sides are shares of a junior ranking
> list, so the unit is not in doubt. Nobody asked about this rung; it is worse than the one he did ask
> about. Research §4c-E.
>
> ### 4. ⚠⚠ `TIERS.w75.acceptsRank` SECRETLY SETS THE AGE AT WHICH THE COLLEGE ENDING STOPS EXISTING.
> `ENDINGS.collegeClosedFromTier` is **`w75`**; `collegeStillOpen` deletes the third answer at the fork
> the moment a career takes a counting finish at W75 **or above**. So how deep W75's entry list reaches
> decides, in a file that never mentions it, when an ending disappears. **Measured: the door shuts in
> 50 of 54 careers at mean age 17.2, W75 itself causing 76% of the closures.** §5.

---

## 1. How to read the evidence

* **"Ours"** is read out of the running engine by `tools/acceptance-cuts.ts` §1 – never restated from
  a code comment. Finding 2 is why that is the tool's first design rule.
* **"Real"** carries a URL in research §4c, or the words **not sourced**.
* **Measured** figures carry their `n`. Career arms are `tools/acceptance-cuts.ts` §2 on
  **`POLICIES[1]`** (the rebuilt bench's *model of a reasonable parent*), 9 presets × 6 seeds =
  **n = 54 careers per arm**, 312 weeks (14→20), **identical seeds across arms**. Input-independence
  (CLAUDE.md invariant 2) is what makes that comparison honest: both arms tap the same MAIN sequence,
  so every difference is the door's and not the weather's.
* ⚠ **ONLY WITHIN-RUN COMPARISONS ARE VALID.** Two other agents were editing `world.ts`,
  `sponsors.ts` and `kidLife.ts` in this shared checkout while the arms ran, so the *shipped* arm's
  absolute numbers differ between runs (end rank 225 in the first sweep, 280 in the second). Every
  table below quotes arms from **one** run against **that run's own** shipped baseline.

**The two units.** `acceptanceRank` (`world/ladder.ts`) resolves a rung's door to a row: the W rungs
carry `acceptsRank` (an absolute rank on the merged W table); the ITF rungs carry `enterPct` (a share
of the junior table). `w15`, `j30` and the domestic three carry **neither** – they are on-ramps gated
by `enterPointBand` in the table *below* them.

---

## 2. THE AUDIT TABLE

Engine column measured 15.08 on a fresh world: **the merged W table is 1,800 rows, 1,600 holding
points; the ITF junior table is 200 rows.** "Book there" is what a career must actually build to clear
the door – a cut is a rank, but the *price* of a rank is the points standing on it.

### 2a. The professional rungs (`acceptsRank`)

| rung | minAge | ours | book there | **real – observed cut** | source | gap |
| --- | --- | --- | --- | --- | --- | --- |
| **w15** | 16 | *no list* – `[120, MAX]` on **ITF junior** points | 120 jr pts | **512 · 585 · 590** (3 events). Rule: no floor at all – Methods A–D end in *"unranked … randomly drawn"*, 3 of 32 places reserved for ITF junior top-100. **Ceiling:** WTA #1–150 barred. | research §4c-A/A2/C | ours is a floor where the rule has none; reality's *practice* cut is ~#550 |
| **w35** | 16 | **700** | 35 | **551 · 662 · 716 · 724 · 730 · 835 · 871** (+ one 298 outlier) | §4c-A2 | ✅ **squarely mid-range – ours is right** |
| **w50** | 16 | **550** | 58 | **204 · 234 · 390 · 424 · 441** | §4c-A2 | ⚠ **too loose by ~110–350 places** |
| **w75** | **17** | **450** | 88 | **262 · 305 · 334 · 359** | §4c-A2 | ⚠⚠ **too loose by ~90–190 places – the owner's rung** |
| **w100** | 17 | **350** | 144 | **not sourced** – 7 of the 9 W100s in the 2026 calendar publish no list; the one available is a lower bound (deeper than #285) | §4c-A2 | unknown |
| **wta125** | 17 | **250** | 252 | **not sourced.** A *ceiling* exists: #1–20 may not play; up to 4 ranked 21–50 by wild card only | 2026 WTA Rulebook III.C.2.b | direction inverted |
| **wta250** | 17 | **200** | 339 | **not sourced** (≈23–24 DA derived from published qualifier + wild-card tables – a count, not a cut) | §4c-G | unknown |
| **wta500** | 17 | **120** | 685 | **not sourced** (≈23–24 DA, derived) | §4c-G | unknown |
| **wta1000** | 17 | **65** | 1,198 | **not sourced** (≈44 DA at 56-draw, ≈76 at 96 – derived) | §4c-G | unknown |
| **slam** | 17 | **104** | 856 | **rule 128 = 104/108/112 DA + 16/12/8 Q + 8 WC**; observed **AO 2026 #103**, **US Open 2026 #102** | §4c-D | ✅ **exact** |

⚠ **THE ERROR IS NOT UNIFORM, AND THAT KILLS THE OBVIOUS FIX.** W35 is right, W50 and W75 are loose,
W100 is unknown. The real ladder is far **flatter** at the top than ours – a real W50 and a real W75
cut within ~50 places of each other – which is exactly what one shared System of Merit produces. So
the family cannot be corrected by rescaling it by a single factor.

⚠ **AND A REAL CUT IS NOT A CONSTANT.** It is set at the entry deadline and drifts deeper as players
withdraw (US Open 2025: #99 at the deadline, #102 three weeks later); it varies by geography (US-based
W75s ≥494 against European 262–359); and only 16–20 of a real W75's 32 chairs are direct acceptances
at all – the rest are qualifiers, wild cards and reserved places, which `selectEntrants` does not
model. Any single number we ship is a flattening of all three.

### 2b. The junior rungs (`enterPct`)

| rung | minAge | ours | = row of 200 | **real – observed cut** (of a 4,890-strong girls' list) | gap |
| --- | --- | --- | --- | --- | --- |
| **j30** | 13 | *no list* – `[250, MAX]` on **domestic** points | – | no threshold; enterable by an unranked 13-year-old near home | ours is a floor reality has none of – **but 250 is an owner ruling (§6)** |
| **j60** | 13 | **0.50** | #100 | **2,140 · 2,553 · 2,967 · 3,147** = **top 44–64%** | ✅ **inside the range – ours is right** |
| **j300** | 13 | **0.40** | #80 | **81 · 101 · 182** = **top ~2%** | ⚠⚠ **20× too loose** |

**The domestic three carry no acceptance list at all** and are *not applicable*: research §6 records
that they *"have no ITF value at all — zero, by Reg 10"* and *"every number we assign them is
invention"*. There is nothing real to compare.

### 2c. The cut's other encoding, checked

`population-1600-2026-08.md` §2 states the rule that `acceptsRank` **is** the acceptance range's floor
and `entrantPctBand` the same range as a share, so the two must agree. Measured on the live 1,800-row
table: every W rung's band reaches past its own cut (w75's band is #189–#756 against a cut of #450), so
the two are consistent by construction of the deliberately wide ceiling, which that spec justifies
(*"a wider tail only buys candidate depth"*). **No defect.** The two ITF rungs are deliberately the
other way – j60's band stops at #80 against a cut of #100 – and `calendar.ts` states that inversion as
intentional. **Also no defect.**

---

## 3. W75 SPECIFICALLY

His three clauses, checked one at a time:

| his words | verdict | what the engine actually does |
| --- | --- | --- |
| «пускает всех из топ-450» | **true** | `acceptsRank: 450` on a 1,800-row table = the top 25%. Real: **262–359**. |
| «с 17 лет» | **true, and it is ours, not the sport's** | Real W75 has **no age floor of its own**. The only ITF thresholds are **14** (*"Minors under the age of fourteen (14) shall not be eligible for Entry"*) and 18 (AER). The one rung-specific real rule is the WTA's sub-cap of **three W75+ events** inside a 14-year-old's eight – a quota, not a door. We already model the AER counts exactly and then bar her outright anyway. |
| «без порога по очкам» | **true of the constant, false of the behaviour** | `enterPointBand` is `[0, MAX]` and `tierFloorOpen` never reads it for a W rung – the field is decorative. But the gate is `kidPoints > 0 && kidRankWta <= 450`, and **the book standing on #450 is 88 WTA points.** The threshold exists; it is implied by the rank rather than written. |

### 3a. ⭐ AND THE CUT IS NOT WHAT DELAYS HER. THE AGE GATE IS.

`tools/acceptance-cuts.ts` §2b2 asks the one question a cut must answer: **her age the week the cut
alone stops refusing her** (`tierFloorOpen`, age not consulted) against the rung's own doorway.
n = 54, shipped constants:

| rung | minAge | cut cleared at | careers the **cut** delays |
| --- | --- | --- | --- |
| w35 | 16 | 16.5 | **51 / 51** |
| w50 | 16 | 16.6 | **51 / 51** |
| **w75** | **17** | **16.7** | **9 / 50** |
| w100 | 17 | 16.9 | 12 / 50 |
| wta125 | 17 | 17.4 | 27 / 50 |
| wta250 | 17 | 18.0 | 43 / 49 |

> **In 41 of 50 careers W75's acceptance cut is already cleared before she is old enough to walk
> through the door.** She first enters a W75 at mean age **17.1** – the doorway is 17. The cut is inert
> for four careers in five; `minAgeYears` is the whole gate. That is a stronger statement of the
> owner's complaint than the one he made.

### 3b. HER RANK PACE IS NEARLY RIGHT – IT IS THE CUT'S DEPTH THAT IS WRONG

Against `real-ladder-pace.md` §1a (Kovacs 2015, the WTA top 100 as of 28 July 2014 – **survivor
sampled**, and that doc flags it), log-interpolating rank against age:

| rank | real age `[S]`/`[I]` | our kid clears it at (measured) |
| --- | --- | --- |
| top 500 | **16.8** | – |
| **#450** – our W75 cut | ≈ **17.0** | **16.7** |
| **#300** – reality's W75 cut | **17.6** | **17.0** |
| top 200 | 18.6 | – |

She runs ~0.3–0.6 years ahead of the real survivor pace in that band – a modest, separate issue. **The
dominant error is the door's depth, not her speed.** This independently reproduces
`real-ladder-pace.md` §7's own unactioned conclusion, written 05.08: *"she arrives at W75 far too early
… the bench measures her exiting by round two 90.0% of the time at W75 against a 75% floor."* That was
attributed to `FIELD.strengthCurve` and shipped as `ladder-pace-2026-08.md`'s step 2, **which was
measured and reverted.** The acceptance cut – the constant that literally decides when she may enter –
was never tried.

---

## 4. THE CONSEQUENCE, MEASURED

### 4a. W75 alone – and why it cannot move alone

First sweep, n = 54 per arm, own shipped baseline:

| arm | W75 entries | first W75 at | end WTA rank | prize | college shuts at | open at fork | which rung shuts it |
| --- | --- | --- | --- | --- | --- | --- | --- |
| **shipped (450)** | 8.4 | 17.2 | 225 | $172,567 | 17.3 | 6% | W75 73% |
| w75 = 350 | 7.6 | 17.3 | 261 | $164,313 | 17.4 | 9% | W75 62% |
| w75 = 250 | 4.0 | 17.9 | 285 | $157,793 | 17.6 | 9% | **W100 64%** |
| w75 = 150 | **0.0** | – | 222 | $179,529 | 17.7 | 4% | **W100 92%** |

⚠⚠ **A PROBE, NOT A CANDIDATE, FOR TWO REASONS.**

1. **It inverts the ladder below #351.** `tests/season/fieldPros.test.ts` pins that the cuts strictly
   tighten (`w35 700 > w50 550 > w75 450 > w100 350 > wta125 250`). A w75 of 250 is tighter than
   W100's, so W100 opens **first** – visible in the last column, where W100 takes over as the rung that
   shuts the college door.
2. **The college ending barely moves anyway** (17.3 → 17.7), because `collegeClosedFromTier` is a
   *rung threshold*: every rung at or above W75 shuts the door, and **W100's own cut is cleared at
   16.9**. Tightening one rung hands the job to the next one up.

### 4b. ⭐ THE SOURCED CHAIN – anchored on the observed cuts

`w35 = 700` (**unchanged – it is already right**), `w50 = 330`, `w75 = 300`, `w100 = 240`,
`wta125 = 180`. W50 and W75 land on the middle of their observed ranges; W100 and the 125 have no
sourced anchor and are placed only to keep the chain monotone. Second run, n = 54 per arm, **both arms
one engine state**:

| | shipped | **sourced chain** |
| --- | --- | --- |
| first W75 / W100 / WTA 125 entry | 17.1 / 17.4 / 18.0 | **17.3 / 18.2 / 18.5** |
| W75+ entries per career | 26.3 | **21.0** |
| W15 / W35 / W50 entries | 12.7 / 6.4 / 9.7 | **18.5 / 14.1 / 12.1** |
| careers the cut delays: w100 / wta125 | 12/50 · 27/50 | **33/52 · 44/45** |
| **end WTA rank** (mean / median) | 280 / 195 | **204 / 179** |
| **end WTA book** | 365 | **441** |
| **prize over the horizon** | $157,562 | **$185,792** |
| **end funds** | $59,124 | **$73,708** |
| survived | 100% | 100% |
| college shuts at | 17.2 | **17.6** |
| college open at the fork | 9% | **4%** |

**PREDICTED vs MEASURED**, registered before the arm was run:

| prediction | outcome |
| --- | --- |
| the upper cuts start to bind | ✅ w100 12/50 → **33/52**, wta125 27/50 → **44/45** |
| she reaches the top rungs later | ✅ W100 17.4 → **18.2**, WTA 125 18.0 → **18.5** |
| **W75's own cut starts to bind** | ❌ **still only 13/53** – at #300 the cut is cleared at 17.0, i.e. *still* on the doorway. §3a's finding survives the correction: at W75 the age gate dominates whatever the cut is. |
| her results get **worse** (fewer big draws) | ❌ **wrong, and this is the finding** – rank 280 → **204**, book 365 → **441**, prize **+$28k**, funds **+$14.6k** |
| the college ending comes back | ❌ **wrong, and it moves the other way** – 9% → **4%** open at the fork. The chain makes her reach W75 *more reliably* (53/54 careers shut the door against 50/54), so the ending gets rarer even as it gets later. |

**Read the money rows twice.** Tightening the doors does not punish her – she finishes 76 places
higher, 76 points richer, $28,000 better paid and $14,600 better off. The mechanism is in the entry
rows: with the shipped cuts she spends her season in W75+ draws she loses early; with the corrected
chain she spends it at W15/W35/W50, where she wins. Same phenomenon `points-economy.ts` warns about in
its own `freeBook` note – *"participation money at rungs the doors exist to keep her out of"* –
arriving from the other side.

### 4c. THE J300 CORRECTION, MEASURED – and it deletes the rung

`j300.enterPct 0.40 → 0.02` (reality's top ~2%), same run:

| | shipped | **j300 = 0.02** |
| --- | --- | --- |
| **J300 entries per career** | **3.8** | **0.0** |
| careers that ever enter one | 53 / 54 | **0 / 54** |
| J30 / J60 entries | 22.1 / 16.0 | 26.8 / 19.4 |
| end WTA rank / book | 280 / 365 | 281 / 354 |
| prize | $157,562 | $145,839 |

0.02 of our 200-row junior table is **#4**, so the prestige rung becomes unreachable and the career
falls back onto the two dense junior rungs. **This is a collision between two true things**: the sport
says a J300 is a top-2% event, and `two-ladders.md` §0's target – written down *before* tuning – says
*"0 for most careers, 1–2 for a good one, 2–3 for the best"*. Both cannot hold at our population.
Resolving it is the owner's, and the honest options are visible now that both sides have numbers:
accept that a J300 is nearly unreachable, or accept that our 200-row junior table cannot carry a
top-2% cut and keep 0.40 as a deliberate population adaptation.

---

## 5. THE COLLEGE COUPLING, STATED PLAINLY

**Today.** `ENDINGS.collegeClosedFromTier = 'w75'`, and `collegeStillOpen` returns false as soon as
`bestFinishByTier` holds a scoring finish at any rung from W75 up. `w75.acceptsRank = 450` is therefore
the load-bearing half of a decision about an *ending*, and `ending.ts` does not know it. Measured
(n = 54): the door shuts in **50 of 54 careers**, at mean age **17.2**; **W75 itself causes 76%** of
the closures, W100 16%, WTA 250 6%, WTA 125 2%; it is still open at the fork in **9%** of careers.
Round-21 #8 measured the same fact from the dialog side – *"26 of 26 careers that reached the fork had
`collegeStillOpen === false`"* – and escalated it as **«A DECISION FOR HIM, NOT TAKEN HERE»**, naming
two possible fixes: move `collegeClosedFromTier` up the ladder, or stop it being a hard precondition.

**This audit adds a third option nobody had named – and then measures it away.** Because the age the
door shuts is downstream of the acceptance cuts, *tightening the ladder to reality* looked like a way
to give the college ending back without touching `ending.ts`. **It is not, and it is worse than
neutral:** the sourced chain moves the closure from 17.2 to 17.6 but drops the fork-open rate from
**9% to 4%**, because correcting the ladder makes her reach W75 *more reliably* (53 of 54 careers
against 50). **A more realistic ladder makes the college ending rarer, not commoner.**

**So the coupling cannot be fixed from this end.** The fork is at 19, and any ladder that lets a good
junior onto the professional tour at all will have produced a W75+ result by then. If college is meant
to be a real second act, `collegeClosedFromTier` is the constant that has to move – exactly as
round-21 #8 left it. **What this audit changes is that the option of fixing it sideways is now closed
with evidence rather than left open as a maybe.**

---

## 6. THE VERDICTS, PER RUNG

Read against the brief's rule: **a constant whose comment records an owner decision is `needs the
owner` no matter what reality says.**

| rung | verdict | why |
| --- | --- | --- |
| `local` `regional` `national` | **leave** | No acceptance list; research §6 records these rungs as pure invention with no ITF analogue. Nothing real to audit against. |
| `j30` | **needs the owner** | `[250, MAX]` is stricter than a real J30 (which admits an unranked 13-year-old). But 250 carries an **owner ruling verbatim in the comment** – «National становится ступенью, через которую проходят, а не мимо которой – вот это мне нравится, да» (29.07) – and the comment states that this 250 and National's 150 *"are one decision and must move together"*. Not ours. |
| `j60` **0.50** | ✅ **leave – now sourced and correct** | Real J60 cuts are the top **44–64%**; ours is 50%. An invented number that lands inside the sport's own spread, recorded as such so the next reader does not assume it shares W75's problem. |
| **`j300` 0.40** | **needs the owner – and it is the largest error found** | Real: **top ~2%**. Ours: top 40%. Sourced, same unit, 20×. **But correcting it deletes the rung** (§4c: 3.8 → 0.0 entries) and contradicts a pre-registered design target the owner's ladder is aimed at. Two true things in collision; his call. |
| `w15` on-ramp `[120, MAX]` | **needs the owner** | The rule has **no floor** (Method D.c admits the unranked by random draw) and a **ceiling** we do not model (WTA #1–150 barred). ⚠ But in *practice* every direct acceptance at the W15s read held a WTA ranking, so the rule's openness is a dead letter and the de-facto cut is ~#550. Rule and practice disagree; both are sourced; the choice between them is a design decision. |
| `w35` **700** | ✅ **leave – now sourced and correct** | Observed 551–871. Ours is mid-range. It also binds 51/51 careers. **The one W rung that needed no correction, and we would not have known without asking.** |
| `w50` **550** | **change – as part of the chain** | Observed **204–441**; ours is 110–350 places too loose. Same defect as W75, one rung down. Cannot move alone (monotonicity). Recommended **330**. |
| **`w75` 450** | **change – and it is the owner's, because it cannot move alone** | Observed **262–359**; ours is 90–190 too loose. **Recommended: the sourced chain of §4b (w35 700 · w50 330 · w75 300 · w100 240 · wta125 180)**, which is measured Pareto-positive for the player. His call because (a) it moves four constants, (b) w100/wta125 have no sourced anchor and are placed only to keep the chain monotone, and (c) it makes the college ending *rarer* (§5). |
| `w100` **350** | **needs the owner** | **Not sourced** – no clean W100 list exists in the 2026 calendar. Moves as part of the chain or not at all. ⚠ And the **sponsor gates are derived from this constant** (`s.national.maxWtaRank === TIERS.w100.acceptsRank`), so it is not only a ladder number. |
| `wta125` **250** | **needs the owner** | Not sourced. Reality's rule here is a **ceiling** (#1–20 barred, 4 ranked 21–50 by wild card only). Chain member. |
| `wta250` **200** | **leave** (flagged not sourced) | No published depth exists to correct toward; a derived DA *count* (≈23–24) is not a rank cut. Binds 43/49 and sits above where a 14→20 career reaches. |
| `wta500` **120** | **leave** (flagged not sourced) | Cleared by 1 of 54 careers – functioning as the top of the ladder, which is what act 3 wants. |
| `wta1000` **65** | **leave** (flagged not sourced) | Cleared by 1 of 54. |
| **`slam` 104** | ✅ **leave – now sourced, by rule and observation** | Rule: 128 = 104/108/112 DA + 16/12/8 Q + 8 WC. Observed: AO 2026 #103, US Open 2026 #102. ⚠ The rule is prefaced *"Unless otherwise agreed"*, so 104/16/8 is one of three permitted configurations rather than a mandate. |
| `w75.minAgeYears` **17** | **needs the owner** | Reality's floor is **14**, not 17, and the one rung-specific rule is a *quota* (3 W75+ events inside a 14-year-old's 8), not a door. ⚠ **And on this rung the age gate is doing the acceptance list's job** – §3a, and it still is after the correction (§4b). A real change and a large one: it would put a fourteen-year-old on the professional tour. |

---

## 7. WHAT THIS WAVE ACTUALLY EDITS

| file | change | risk |
| --- | --- | --- |
| `tools/acceptance-cuts.ts` | **new.** Reads the doors out of the engine (§1/§1a) and measures careers under patched cuts (§2a–2d), patch-and-restore in memory – `tools/big-draw-cost.ts`'s own `drawSize` idiom. Changes no shipped constant. | none – measurement only |
| `docs/research/ranking-points-by-tier.md` | **new §4c** – the System of Merit verbatim, the observed cuts with their URLs and the zero-vacated-slot rule that makes them cuts, main-draw composition, the Play Down Rules, the Grand Slam composition and its observed cut-offs, the junior cuts against a 4,890-strong list, and an explicit `not sourced` list. | none |
| `docs/specs/acceptance-cuts-2026-08.md` | this file | none |
| `src/engine/season/calendar.ts` | **COMMENTS ONLY.** Every `acceptsRank`/`enterPct` note now records what the figure actually is – sourced-correct, sourced-wrong, or not sourced – instead of asserting *"the real tour's own acceptance ranges"*. **Verified: `git diff -U0` matches no `acceptsRank`/`enterPct`/`minAgeYears`/`enterPointBand`/`entrantPctBand`/`points`/`drawSize` line.** | none |

**NO GUARD MOVES**, because no constant moves. `vue-tsc -b --force` is clean. The three guards a future
chain change *would* have to re-aim are named here so the next wave does not find them one red run at a
time:

1. `tests/season/fieldPros.test.ts` – pins that the five W cuts **strictly tighten**. The §4b chain
   keeps it (700 > 330 > 300 > 240 > 180); the §4a probes at 250/150 violate it.
2. `tests/unranked-sentinel.test.ts` – pins that **every** W cut is strictly inside the pointed depth
   (1,600 rows). The §4b chain is well inside; a much tighter one is not automatically.
3. `tests/offers.test.ts` / `tests/ladder-floor.test.ts` – the **sponsor gates are derived from
   `w100.acceptsRank`**. Moving W100 moves what a national sponsor costs, in a file nobody retuning the
   ladder would open. Flagged when `acceptsRank` was introduced (`62ad7ab`: *"a looser gate, following
   from an honest table rather than from a decision"*) and still true in the other direction.

⚠ **And one consequence that is not a test.** `proDoors.at()` (`world/ladder.ts`) gives the **AI cohort
the kid's own door, line for line** – deliberately, so two doors onto one tour cannot drift. Any cut
change therefore also changes which rivals reach the professional tour, i.e. the field she *meets*, not
only when she may enter. A reason the chain must be measured as a chain.

---

## 8. FOR THE OWNER – four questions

1. **W75 and W50.** Sourced and both too loose. The chain of §4b is measured and leaves the player
   better off on every metric. Ship it, pick different anchors, or leave it?
2. **J300.** The sport says top-2%; our own written-down target says a good career plays one or two a
   season. Correcting it deletes the rung. Which of the two is the game's?
3. **The college ending.** Correcting the ladder does **not** rescue it – it makes it rarer (9% → 4%).
   Round-21 #8's question is unchanged and now has one fewer escape route:
   `collegeClosedFromTier` moves up the ladder, or stops being a hard precondition, or college stays
   theoretical.
4. **The correction nobody has costed.** Reality's rule on this whole family is a **ceiling** – WTA
   #1–50 barred from every W event, #1–150 from W15/W35, #1–20 from a WTA 125. We have no ceiling at
   all since the 06.08 ladder-floor ruling, which was explicitly about the *floor* and whose own words
   were *"an acceptance cut is the tour's own rule and is not ours to waive."* A published rank ceiling
   is a different mechanism from `tierOutgrown`'s sliding window, and it is the one thing in this audit
   that is both **real** and **completely unmodelled**.
