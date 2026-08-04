---
type: specification
status: current
area: simulation-and-balance
canonical: false
last-reviewed: 2026-08-04
---

# The points economy – two units of account wearing the same name

**Status: an authorised experiment, built, measured and REVERTED, plus one instrument and one
guard.** The owner's ruling, 04.08: *«согласовать выданные книжки поля с тем, что игрок такой силы
заработал бы по нашей же таблице – давай это попробуем и узнаем ответ.»* This page is the answer, and
it is not the one the experiment was expected to give.

> **IN ONE PARAGRAPH.** Priced through our own table and calendar, the field's issued books are
> **2.57x** what its members could earn, and the error is not uniform: the top storey is already
> self-consistent (0.9x) while the bottom 270 are over-issued five to twenty-five times and 150 of
> them are dealt **no events at all**. Setting the generated book to the earned one does converge HER
> ability and points ranks – skill #68 to points #69 – and it destroys everything around her:
> the population's own skill/points correlation falls from 0.891 to 0.761, the real-curve calibration
> becomes a staircase (#50 = 1,872 and #100 = 48), five acceptance cuts spanning 246 rank places end
> up twenty points apart, and **118 of 180 careers become top-100 players with the median at world
> #69.** The constant is reverted. What the numbers do support is a fifth option nobody had priced:
> **the field's strength spread, not its book, is the side that has no real-world calibration** –
> our 364 professionals span 847 Elo where the real top 364 span 515.

Instrument: `npm run bench:points` (`tools/points-economy.ts`), fourteen sections, **2.8 s** at
`--seeds 4` – it simulates no matches, only closed forms and the engine's own selection and ranking.
It writes no engine number. `-- --only 13` prints the arm-comparable summary block alone.

---

## 0. Where this starts

Three probes landed in `wave/endings-and-debts` and between them eliminated every other suspect for
why no career in 180 ever passes rank #237:

| probe | finding |
| --- | --- |
| `ranking-ceiling-2026-08.md` | **entry rights are not the constraint** – a perfect player's fixed point is **#1** |
| `skill-model-audit-2026-08.md` | **the skill model is not the constraint** – she realises **94.1%** of her ceiling |
| `world-strength-audit-2026-08.md` | **the static world was not it either** – ageing and retirement moved her peak #237 → #241 |

What was left is one number: **her SKILL rank is #72 of 364 and her POINTS rank is #298.**

The mechanism under test: the field's books are handed out in one stroke by a generator
(`season/fieldPros.ts`, four storeys, 88–11,500 points) calibrated against the **real WTA
distribution**, while hers is earned match by match inside a window of 14–21 events on rungs that pay
10–125 a title. Two different processes produce the numbers that are then sorted into one table.

## 1. Predicted, then measured – the experiment as it was specified

Written before the change was compiled, from sections 2, 6 and 10 of the probe.

| # | predicted | measured | verdict |
| --- | --- | --- | --- |
| P1 | pricing the field honestly bunches the bottom: #150 ≈ 36, #250 ≈ 30, #300 ≈ 26 | #150 **36** · #250 **30** · #300 **28** | right, to the point |
| P2 | her peak rank improves a lot – best #184 → about #100-115, median #358 → about #130 | best **#7**, median **#69** | **wrong, and far too timid** |
| P3 | the real-curve calibration dies: #10 ≈ 2,900 against 4,000; #150 ≈ 36 against 520 | #10 **3,533** · #150 **36** | right about the death, wrong about the head |
| P4 | ability and points do **not** converge at the top: the prodigy (skill #21) and a median career (skill #72) land within ~20 places of each other | prodigy **#18**, median career **#75**; the FIELD's own Spearman falls 0.891 → **0.761** | **wrong in the detail, right in the substance** – her three builds converge almost exactly, and the population's correspondence gets worse |
| P5 | the acceptance cuts stop discriminating: with ~260 pros between 21 and 40 points, one result moves her a hundred places | five cuts spanning 246 places end up separated by **20 points** | right |
| P6 | top-100 becomes reachable for most careers – a conveyor, not a chance | **118 of 180** reach the top 100; median career world **#69** | right, and worse than predicted |
| P7 | tick cost and ledger unchanged: the pricing is a pure function of the same shape | **1.21 ms** per season-boundary derivation on both arms; ledger unchanged by construction | right |

**P2 and P4 are the useful misses.** P2 was written from the table half alone and missed that the
acceptance cuts are rank-denominated, so a deflated table does not merely re-label her – it opens
every door on the ladder at once and she then plays the rungs that pay thousands. And P4 predicted
the wrong shape of failure: her own ability and points converged almost perfectly (skill #68 → points
#69), while the population's fell apart. Convergence for one player is not the invariant.

---

## 2. The instrument, and the one thing it had to prove before anything else

`tools/points-economy.ts` is `tools/ceiling-walk.ts` **inverted**. That tool asks *"at rank R, what
does a PERFECT season pay?"*; this one asks *"at core C, what does an EXPECTED season pay?"* – same
doors (`acceptanceRank`), same sliding window (`tierFloorOpen` / `tierOutgrown`), same real calendar
(`buildSeason`), same one-entry-a-week rule, same AER allowance, same best-16 fold, and the engine's
own `mergedWtaRanking` for the book → rank map. Only the pricing of an entered event changes: its
closed-form finish distribution against that rung's real field, instead of the title.

**Who a rung's field is, is the engine's own answer and not a model of it.** `selectEntrants` is run
on real events of each rung against the real merged universe. That has to reproduce the six numbers
`tools/field-quality.ts` measured before its answers for the four rungs **nobody has ever entered**
can be believed:

| rung | w15 | w35 | w50 | w75 | w100 | wta125 | wta250 | wta500 | wta1000 | slam |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| measured (field-quality) | 48.5 | 50.4 | 55.1 | 60.0 | 65.9 | 70.7 | – | – | – | – |
| this tool | 49.1 | 51.1 | 55.7 | 60.9 | 67.5 | 71.5 | **72.2** | **73.2** | **73.5** | **74.1** |
| delta | +0.6 | +0.7 | +0.6 | +0.9 | +1.6 | +0.8 | | | |

Within a point at five of six rungs. (The tool reads a fresh world and no week exclusivity;
field-quality ticks forty weeks and applies it, which weakens a shared week's lower rung slightly.
The residual is in the conservative direction for every claim below: a *stronger* field means a
*smaller* earned book.)

**Scale invariance is what makes the derivation well-posed.** Every gate is rank-denominated
(`acceptsRank`) or percentile-denominated (`entrantPctBand`), so re-pricing the table's rows moves
nobody's window: the field composition at a rung is a function of the points **order**, not of the
points **scale**. Were that false the whole derivation would be circular.

⚠ **And it is only half true – see §5a, which corrects this paragraph with a measurement.** The
shipped storeys' CORE bands overlap while their points bands do not, so a re-pricing that makes points
monotone in core also re-*orders* the middle of the table. Scale invariance holds; order invariance
does not, and the derivation is therefore one step of a fixed point rather than its limit.

---

## 3. The mechanism, measured three ways

### 3a. What our own economy pays a player of core C

The fixed point: climb from unranked, earn a season, read the rank, re-open the window there,
repeat. `--seeds 4`, age 24.

| core | skill rank | window at the fixed point | entered | **earned** | → rank | **issued** | ratio |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 38 | #345 | w35, w50, w75 | 28.0 | 25 | #365 | 138 | 5.5× |
| 45 | #233 | w35, w50, w75 | 28.0 | 39 | #365 | 367 | 9.4× |
| 51 | #140 | w35, w50, w75 | 28.0 | 66 | #365 | 739 | **11.2×** |
| 57 | #91 | w35, w50, w75 | 28.0 | 127 | #358 | 954 | 7.5× |
| 63 | #73 | w50, w75, w100 | 20.0 | 243 | #261 | 1,175 | 4.8× |
| 69 | #50 | w75, w100, wta125 | 14.0 | 291 | #232 | 1,285 | 4.4× |
| 75 | #15 | w100, wta125, wta250 | 14.3 | 554 | #140 | 3,458 | 6.2× |
| **77** | **#7** | **wta250, 500, 1000, slam** | 25.8 | **3,998** | **#13** | 10,554 | **2.6×** |
| 85 | #1 | wta250, 500, 1000, slam | 25.8 | 8,272 | #3 | – | – |

**Every row is over-issued, and the middle worst of all.** A player who is the world's 140th-best
holds 739 points and would earn 66.

### 3b. …and what the engine's own season would have paid each pro

The literal question. `selectEntrants` deals the W season the engine already runs every week (it
simply throws the result away – `runAiTournament` skips the ledger row for an `fp-` id); each
appearance is priced by its closed-form expectation against *that draw's own* field; best-16 folds
them.

| storey | n | mean core | events/season | issued (median) | **earned (median)** | ratio |
| --- | --- | --- | --- | --- | --- | --- |
| `tourElite` | 64 | 72.4 | 17.8 | 1,510 | **1,621** | **0.9×** |
| `elite` | 30 | 61.1 | 14.8 | 970 | 186 | 5.2× |
| `contender` | 120 | 48.2 | 13.2 | 491 | 20 | 24.9× |
| `journeyman` | 150 | 42.9 | **0.0** | 207 | **0** | – |

> **150 OF 364 PROFESSIONALS ARE NEVER DRAWN INTO A SINGLE EVENT ALL SEASON.** They hold a median of
> 207 points each and occupy ranks ~#215–364 – the exact band a climbing career has to pass through.
> The population total is **294,195 points issued against 114,529 earned: 2.57×.**

Why: `selectEntrants` is position-biased (`key = position + rng × 32`), so a rung's band is filled
from its **top**. W15's band is [0.22, 0.72] of a 563-row table – positions 124 to 405 – and thirty-two
slots go to positions ~124-165. Everybody below that is inside the window and never picked. The
same arithmetic accounts for the whole season: 64 x 17.8 + 30 x 14.8 + 120 x 13.2 = **3,167 of the
3,168 entrant slots** a 99-event W calendar deals at draw 32. What that leaves for the LIVE cohort is
a separate finding and is recorded in §8c.

**The top storey is already self-consistent (0.9×).** Only the three below it are not.

### 3c. ⚠ THE TRAP – the sliding window is monotone in title value and NOT in expected value

`ranking-ceiling-2026-08.md` §4a proved there is no band where a **perfect** player's window slides
into rungs worth less than the ones it closed. That proof does not survive a real win rate. The same
sweep, in expected points, with the player *pinned* at each band:

| core | #400 | #300 | #250 | #200 | #150 | #120 | #100 | #75 | #50 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 48 | 50 | 50 | 31 | 27 | 27 | 46 | 572 | 572 | 1,085 |
| 54 | 91 | 91 | 54 | 48 | 48 | 89 | 632 | 632 | 1,148 |
| **60** | **177** | **177** | **105** | **93** | **93** | 177 | 765 | 765 | 1,294 |
| 66 | 325 | 325 | 210 | 188 | 188 | 362 | 1,060 | 1,060 | 1,641 |
| 72 | 519 | 519 | 391 | 390 | 390 | 760 | 1,748 | 1,748 | 2,500 |

**Climbing from #300 to #200 cuts a core-60 player's book by 47%.** At #300 her window holds twelve
W50s – the rung she can win. At #250 `tierOutgrown` closes it and opens the WTA 125, where she loses
in the second round. She oscillates on the rim of that valley – and the rim is where every measured
career has stopped: #237 (money spec), #241 (world audit), **#184** (this branch's head).

The valley is a pure function of the window's width. Same sweep at `WINDOW_RUNGS` 4, 5 and off:

| WINDOW_RUNGS | 3 (shipped) | 4 | 5 | off |
| --- | --- | --- | --- | --- |
| core 60 at #250 / #200 | 105 / 93 | 177 / 134 | 177 / 177 | 177 / 177 |
| monotone at cores 54-72? | **no** | no | **yes** | **yes** |

⚠ This is a defect in its own right and it is **not fixed here** – widening the window is a pacing
change and the ceiling walk already priced the same knob for a perfect player (+8 places at 4, −60 at
2). It is reported because it explains #237 and because any re-pricing has to be read against it.

---

## 4. The four pricings, and which route the numbers support

The decisive table. For each rank, the core that *stands* at that rank in our field, and four books:
the real WTA curve's, the generator's, what our ladder pays a player of that core at that rank, what
the acceptance cuts alone pay her, and what she could take with no rule at all.

| rank | core there | REAL | ISSUED | LADDER | DOORS-only | FREE |
| --- | --- | --- | --- | --- | --- | --- |
| #1 | 77.8 | 10,500 | 11,680 | 4,337 | 4,337 | 4,337 |
| #10 | 75.9 | 4,000 | 4,688 | **3,599** | 3,599 | 3,599 |
| #25 | 73.4 | 2,200 | 1,740 | **2,832** | 2,832 | 2,832 |
| #50 | 69.9 | 1,400 | 1,347 | **2,102** | 2,102 | 2,102 |
| #75 | 62.3 | 1,050 | 1,051 | 850 | 859 | 1,392 |
| #100 | 53.3 | 850 | 830 | 622 | 626 | 1,137 |
| #150 | 49.1 | 520 | 518 | **30** | 55 | 1,093 |
| #200 | 46.3 | 350 | 352 | **24** | 43 | 1,075 |
| #300 | 42.1 | 190 | 195 | **31** | 31 | 1,059 |
| #364 | 35.8 | 130 | 112 | **22** | 22 | 1,049 |

Read it against the brief's three routes:

* **(a) "our points tables pay too little for the calendar we allow."** **False everywhere except the
  single top row.** From #10 to #100 our own ladder pays **0.73× to 1.50×** the real curve, and at #25
  and #50 it pays *more* than reality (2,832 against 2,200; 2,102 against 1,400). Only the world #1
  is short – 4,337 against 10,500 – and that is not a table problem either: it is §4's win-rate
  finding, our #1 beating our #10 51.8% of the time where the real one wins 68%, so nobody in our
  world can compile a champion's book. The points arrays themselves are the real sport's own numbers
  and the calendar carries a real season's worth of them.
* **(b) "our calendar is too thin."** **False as stated.** The top window supplies 30 events and
  26.3 are entered; the bottom window supplies 24–28. Nothing is thin. But the *shape* of the season
  IS a culprit in the precise form §3c measures: the window's closure costs a real player up to 47%
  of her book on the way up.
* **(c) "accept a different scale, preserve the shape."** **The shape is exactly what does not
  survive.** The DOORS column collapses by a factor of twenty between #100 and #150 – not because
  the scale is different but because there is a **hole in our points ladder between 90 and 520
  points**. Sixteen ITF results at 10–125 a title top out near 90 for a player who is not winning
  them; the first WTA rung that pays a loser anything (four Slam first rounds at 130) starts at 520.
  Nothing in our economy pays a book in between.

**None of the three, then.** What the numbers do support is a fourth, and it is the same statement
the whole wave has been circling:

> **(d) THE FIELD'S POINTS CURVE IS CALIBRATED ON THE REAL WTA AND ITS STRENGTH CURVE IS CALIBRATED
> ON `rollPotential`. Those are two different distributions, and the exchange rate between them is
> what is broken.**

Priced in the only unit both sides share – the match engine's own core → probability curve, read as
Elo (**~20 Elo per core point** around core 55):

| pair | our P | real WTA | delta |
| --- | --- | --- | --- |
| #1 v #10 | 51.8% | 68% | **−16pp** (our head is too flat) |
| #10 v #50 | 55.4% | 66% | −11pp |
| **#50 v #100** | **89.3%** | **58%** | **+31pp** |
| **#50 v #150** | **96.0%** | **62%** | **+34pp** |
| #100 v #300 | 79.5% | 65% | +15pp |

> **Our 364 professionals span 42.0 core points = 847 Elo. The real WTA's top 364 span 515 Elo =
> 25.5 core points. The field is 1.64× too spread out, and almost all of the error is in the tail:
> our #364 is core 35.8 where the real curve wants 52.3 – 330 Elo of it.**

That is why a player at rank R below about #80 cannot earn rank R's book. She is not a #150 player
facing #150-level opposition; she is a #150 *name* on a #400 player's game.

### 4a. The other direction, priced

The same alignment has two solutions. §5 builds the one the ruling names – deflate the books. This is
the other – hold the books (a faithful copy of a real curve, and `act2-pro-tour.md` §11 calls that a
deliberate achievement) and compress the **strength** to the real Elo spread at our own exchange
rate, anchored on our world #1:

| rank | core now → compressed | REAL book | earned under compression | ratio |
| --- | --- | --- | --- | --- |
| #1 | 77.8 → 77.8 | 10,500 | 7,311 | 0.70× |
| #10 | 75.9 → 70.4 | 4,000 | 3,641 | **0.91×** |
| #25 | 73.4 → 66.2 | 2,200 | 2,467 | **1.12×** |
| #50 | 69.9 → 63.0 | 1,400 | 1,926 | 1.38× |
| #75 | 62.3 → 60.9 | 1,050 | 1,116 | **1.06×** |
| #100 | 53.3 → 59.5 | 850 | 1,011 | **1.19×** |
| #150 | 49.1 → 57.5 | 520 | 138 | 0.27× |
| #300 | 42.1 → 53.3 | 190 | 68 | 0.36× |

**From #10 to #100 the issued books become what a player of that strength earns, to within ±30%, with
the real-curve calibration untouched.** Below #150 the §3c valley still bites, so it is not a complete
answer on its own.

⚠ **And it has a price that stops it being shippable in this branch.** The same compression puts the
reference strong junior (power 56.75) into a W15 field of core 57.8 instead of 49.1:

| | W15 | W35 | W50 |
| --- | --- | --- | --- |
| P(match) now → compressed | 70.7% → **46.9%** | 65.6% → 44.9% | 52.9% → 42.0% |
| P(title) now → compressed | 17.7% → **2.3%** | 12.1% → 1.8% | 4.1% → 1.3% |

The calibrated target for that number is **15–35%** (`fieldPros.ts`, measured 20.3% at W2-FIELD2).
Compression destroys the on-ramp. The reason is structural and is the world audit's own open question
2: our table is 564 rows where the real one is 1,500+, so `entrantPctBand` maps every W rung onto a
slice of the table two to four times better-ranked than the real rung draws. **The compression needs
a deeper population first.**

---

## 5. THE EXPERIMENT, BUILT – `FIELD.earnCurve`

The ruling's own direction, implemented exactly as the brief specifies: *for a player of storey
strength S, compute the season book our own table and calendar would actually pay her, and use that
to set the generated book.*

**What changed, in `src/engine/season/fieldPros.ts` and nowhere else:**

* the four per-storey `pts` bands and their gammas are **gone**;
* `FIELD.earnCurve` replaces them – twenty-five (core, book) anchors, every one computed by
  `npm run bench:points --only 10`;
* `pointsForCore` is no longer a function of the storey. It reads the curve by **core**, linearly
  interpolated, flat below the first anchor and extended on the last segment's slope above the last.

The storeys keep their counts and their core bands – the pyramid is the shape of the world and is
the one thing in that file with a bench behind it. What they lose is the right to set a points band:
**a storey now says how strong the people in it are, and the economy says what that is worth.**

A side effect worth naming: two pros of equal strength now hold equal books whichever chair they sit
in. Under the old table a core-48 `contender` held 518 points and a core-48 `journeyman` held 207 –
the same player, two books, because of which chair she happened to sit in.

**The curve, and the dips it hides.** `-- --only 10` prints the raw column beside the monotonised one:

| core | 38 | 44 | 46 | 48 | 50 | 52 | 54 | 56 | 60 | 66 | 72 | 77 | 82 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| raw | 25 | 36 | **26** | **27** | **33** | 40 | 89 | 666 | 765 | 1,641 | 2,500 | ~4,018 | 6,440 |
| the experiment's curve (monotone) | 25 | 36 | 36 | 36 | 36 | 40 | 89 | 666 | 765 | 1,641 | 2,500 | ~4,018 | 6,440 |

The three dips are §3c's valley seen from the other side: between cores 46 and 50 the player gets
*better*, her rank improves, `tierOutgrown` closes the W50 and her book falls. A points table that
dipped there would rank a stronger player below a weaker one for ever, so the curve is monotonised by
running maximum and the dips are printed rather than smoothed.

**Two cliffs in that curve are real and are the doors:** core 54 → 56 is ×7.5 (the Grand Slam's
`acceptsRank: 104` – four first-round exits at 130 points apiece), and core 64 → 66 is ×1.8 (the WTA
1000's `acceptsRank: 65`). They are honest features of a real tour. They are also, as §6 measures,
what makes the resulting table a staircase.

**No schema, no migration, no golden save, no MAIN draw.** `fieldProsFor` is still a pure function of
`(seed, seasonIndex)` with zero persisted bytes; the frozen capture (41550 / `e6b0c709`) cannot see
this file. Delete it and every save still loads.

### 5a. ⚠ One step of a fixed point, and the second step moved – a correction to §2's own claim

§2 argues the derivation is well-posed because every gate is rank- or percentile-denominated, so
re-pricing the rows cannot move anybody's window or anybody's opponents. **That is true of the points
SCALE and it is not true of the points ORDER, and the old table changed both.** The shipped storeys'
core bands *overlap* (journeyman 38-48 against contender 43-53) while their points bands did not, so a
core-45 contender outranked a core-47 journeyman. Removing the storey from the pricing makes points
monotone in core, which re-orders the middle of the table, which changes who `selectEntrants` draws:

| rung | w15 | w35 | w50 | w75 | w100 | wta125 |
| --- | --- | --- | --- | --- | --- | --- |
| field core BEFORE | 49.1 | 51.1 | 55.7 | 60.9 | 67.5 | 71.5 |
| field core AFTER | 46.9 | 47.4 | 53.7 | 61.6 | 68.9 | 72.0 |

Up to 3.7 points at W35. The curve in §5 is therefore **one step of a fixed point, not its limit** –
the second step would price a slightly easier bottom and a slightly harder top. It is recorded rather
than iterated because the verdict below does not turn on it: the failures in §6 are one and two orders
of magnitude larger than this correction.

---

## 6. THE SEVEN MEASUREMENTS

Bench: `npm run bench:money` (9 presets x 10 seeds x 2 retirement arms = **N = 180 careers**, the
population the money spec and the world audit both used), both policy arms; and
`npm run bench:points -- --only 13` for the table half. A/B by file copy on `fieldPros.ts` – never
`git checkout`, which writes the index and silently un-stages the arm being tested
(`world-strength-audit-2026-08.md` §9g records that trap).

### 6a. The ship rule, written before the numbers were read

The experiment is authorised, not decided, so the test it has to pass is stated first and not fitted
afterwards. `FIELD.earnCurve` ships **only if all four hold**:

1. measurement 1 improves – ability and points agree better than they did;
2. measurement 6 is a chance and not a conveyor – reaching the top 100 stays a minority of 180;
3. measurement 3 keeps a pointed depth – the table does not become a staircase with a hole in it;
4. measurement 4 leaves the acceptance cuts separating people.

If any one fails, the instrument and this page ship and the constant does not.

### 6b. The numbers

#### 1. Ability rank vs points rank – **the headline, and it splits in two**

| | BEFORE | AFTER |
| --- | --- | --- |
| **the FIELD**: Spearman(skill, points) over all 364 | **0.891** | **0.761** |
| mean \|skill rank − points rank\| | **35.6 places** | **51.8 places** |
| median managed career (skill **#85**) | points #327 | **points #75** |
| best managed career (skill **#68**) | points #241 | **points #69** |
| top-of-band prodigy (skill **#25**) | points #165 | **points #18** |

⚠ The skill ranks read #85 / #68 / #25 here against the skill audit's #72 / #27 / #21. Same builds,
same method, **different world**: a skill rank is a count of the 364 professionals a build loses to
more often than not, and the field is re-derived per `(seed, season)`, so it moves by a storey's
worth of jitter between worlds. Both arms of every A/B below use the one world, which is what makes
the pairs comparable.

**She converges and the world stops making sense.** Her three reference builds land within 1 to 10
places of their own skill rank – #68 → #69 is as close as this measurement can get. But the
population's own correspondence gets **worse by 16 places on the mean**, because the earn curve is
flat between cores 44 and 52 (every one of those 260 professionals is priced at 36 points) and inside
a plateau the only thing separating them is `careerArc` × jitter, i.e. noise.

⚠ **That is the "gift" failure mode with its numbers.** Her rank improved by 250 places without her
winning one more match; what improved was that the table underneath her emptied out.

#### 3. The table's shape

| rank | #1 | #10 | #50 | #100 | #150 | #250 | #300 | pointed rows |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| REAL WTA | 10,500 | 4,000 | 1,400 | 850 | 520 | 260 | 190 | – |
| BEFORE | 11,680 | 4,688 | 1,347 | 830 | 518 | 260 | 195 | 364 of 563 |
| AFTER | 4,340 | 3,533 | 1,872 | **48** | **36** | **30** | **28** | 364 of 563 |

**The calibration does not survive, and it does not survive as a cliff rather than as a scale.** The
depth is unchanged – all 364 pros still hold a row – but #50 holds 1,872 and #100 holds 48. Thirty-nine
times the points across fifty places, and then nothing at all for 264 rows.

#### 4. Do the doors still gate?

The book standing on each acceptance cut:

| rung | cut | BEFORE | AFTER |
| --- | --- | --- | --- |
| W100 | #350 | 137 | **21** |
| WTA 125 | #250 | 260 | **30** |
| WTA 250 | #200 | 352 | **34** |
| WTA 500 | #120 | 652 | **39** |
| Grand Slam | #104 | 792 | **41** |
| WTA 1000 | #65 | 1,185 | 1,296 |

**Five rungs spanning 246 rank places end up separated by twenty points** – one W35 title. The ladder
stops being a ladder. (W35 / W50 / W75 were already inert past the table's end before the change and
still are; that is the world audit's §6b, unmoved.)

And the pacing pin, which is the same fact in the currency the player sees:

| a LIVE book of | 10 | 50 | 100 | 250 | 500 | 1,000 |
| --- | --- | --- | --- | --- | --- | --- |
| BEFORE | #365 | #365 | #365 | #260 | #153 | #79 |
| AFTER | #365 | **#99** | **#95** | **#95** | **#92** | #69 |

> **Five W15 titles – 50 points, one season at the entry rung of the professional game – is world
> #99.** That is `tests/season/fieldPros.test.ts`'s honest-rank promise breaking: the number the pin
> exists to kill is "#9 in two seasons", and #99 is the same defect wearing a different suit.

#### 5. The prodigy

Skill **#25**, points **#165 → #18**. On its own that is the target invariant met. Beside
measurement 1's median career at #75 and measurement 4's twenty-point ladder it is not: she is #18
because 264 rows below her hold less than fifty points, not because she is the 25th-best player.

#### 2, 6, 7. Her careers – N = 180 (9 presets x 10 seeds x 2 retirement arms), both policy arms

⚠ **THE SHIPPED BASELINE IS #184, NOT #237 OR #241, AND THE DIFFERENCE IS NOT THIS WAVE.** The brief's
#237 is `money-decomposition-2026-08.md`'s figure and #241 is the world audit's §9f – both measured
before `probe/skill-model` merged, and that probe fixed `matchBonus`, which had never once fired
(skill audit §7: best peak W rank #223 → #203 on its own bench). Re-measured at this branch's head
the same 180 careers give **#184**. Every before/after pair below is a same-head A/B by file copy.

**2. Her peak rank.** `npm run bench:money -- --no-verify`, both policy arms.

| | BEFORE | AFTER |
| --- | --- | --- |
| **grinder** best / p10 / median / worst | #184 / #275 / #358 / #383 | **#7** / #52 / **#69** / #382 |
| **player policy** best / p10 / median / worst | #144 / #222 / #296 / #373 | **#3** / #47 / **#67** / #378 |

**6. The distribution – a chance, or a conveyor?** Careers of 180 whose peak professional rank ever
reached each depth:

| | top 10 | top 50 | **top 100** | top 200 | ever ranked |
| --- | --- | --- | --- | --- | --- |
| grinder BEFORE | 0 | 0 | **0** | 1 | 152 |
| grinder AFTER | **4** | **11** | **118** | 132 | 144 |
| player BEFORE | 0 | 0 | 0 | 6 | 144 |
| player AFTER | **5** | **18** | **119** | 134 | 138 |

> **A CONVEYOR, AND NOT A NARROW ONE: 118 of 180 careers on the grinder arm and 119 of 180 on the
> player arm – two in three – become top-100 players, and the MEDIAN career is world #69.** The owner
> asked for *a chance* at the top. This is a delivery service, and it reads the same on both policies,
> so it is the table and not the play.

And the rung entries and the money follow it straight off the cliff:

| | wta125 | wta250 | wta500 | wta1000 | slam | prize/spend median |
| --- | --- | --- | --- | --- | --- | --- |
| grinder BEFORE | 11/180 | 1 | 0 | 0 | 0 | **16.6%** |
| grinder AFTER | 128/180 | 126 | 126 | 31 | **119** | **596.5%** |
| player BEFORE | 27/180 | 4 | 0 | 0 | 0 | 20.9% |
| player AFTER | 122/180 | 122 | 121 | 41 | **117** | **602.5%** |

**119 of 180 careers play a Grand Slam** and the career prize/spend ratio goes from 16.6% to 596% –
the whole money economy, which `money-decomposition-2026-08.md` spent a wave decomposing, inverts as
a side effect of a points table. That is the clearest possible statement that a rank in this game is
not a cosmetic number: the acceptance cuts are rank-denominated, so deflating the table opens every
door at once.

**7. Tick cost and ledger.** Nothing given back, and structurally it cannot be: the change is inside
`pointsForCore`, which went from one `Math.pow` to a bounded scan over ≤25 anchors, called once per
pro per `fieldProsFor` derivation and memoised by `(seed, season, cohort names)`. Measured directly –
200 cold derivations of all 364 pros: **1.21 ms per season-boundary derivation** on both arms. The
ledger cannot grow at all: `runAiTournament` still skips the row for an `fp-` id, so a professional
writes nothing into `world.results` whatever her book says. (The bench wall clocks – 356 s / 468 s before,
436 s / 398 s after – were taken with two benches and another agent on the machine and are a floor on
the claim, not a benchmark.)

---

## 7. What moved in the guards

**Nothing was re-aimed, weakened or deleted, because the constant is reverted.** One guard is
*added*: `tests/season/fieldPros.test.ts` gains the §8b characterisation – a full W season of
`selectEntrants`, week by week, strongest rung first, counting the entrant slots the `journeyman`
storey is dealt. It asserts **0 of 150** and that every one of them nevertheless carries a book.
Mutation-verified: widening W15's `entrantPctBand` from [0.22, 0.72] to [0.5, 0.95] makes 47
journeymen appear in draws and the test goes red on the number, not on a crash.

**And what the experiment WOULD have cost, run against the same suite, is itself a measurement.** The
three reds it produced are exactly the three calibrations the wave is in tension with:

| guard | assertion | under `earnCurve` |
| --- | --- | --- |
| `the fourth storey is a head` | the world #1's book > 8,000 | **3,811** |
| `five W15 titles is a two-figure rank behind a real head` | her rank ≥ #300 | **#102** |
| the new characterisation | 0 journeymen drawn | **33** |

The second is the pacing requirement itself – *«the climb must take roughly as long as it does in
life, not 1-2 seasons»* – and #102 for one season at the entry rung is that requirement failing. The
third is the second-order effect §5a describes: re-pricing re-orders the middle of the table, which
moves who the entrant bands reach.

**Gates, on the shipped (reverted) tree with the machine idle:** `vue-tsc -b --force` clean ·
`npm run test:quiet` **110 files / 2,344 tests green** · `npm run test:sim` **8 files / 80 tests
green**. `vue-tsc` was also clean on the experiment arm. No MAIN draw was added on either arm, so the
frozen capture (41550 / `e6b0c709`) is untouched; no schema field moved, so `SAVE_SCHEMA_VERSION`
stays at **v40** with no migration and no golden save.

---

## 8. Three findings this branch reports and does not fix

Each is a consequence of the mechanism above, each is measured, and none is this branch's to rule on.

**8a. The sliding window is not monotone in expected value.** §3c. `tierOutgrown` closes a rung when
the rung three above it *opens* – a title-value test. In expected value the rung it closes is worth
more than the one it opens for every player who is not perfect, so a career's book falls by up to 47%
between #300 and #200. `ranking-ceiling-2026-08.md` §4a proved the converse for a player who wins
every match, and both proofs are correct: **it is the win rate that separates them.** The knob is
`WINDOW_RUNGS`, the sweep is in §3c, and widening it is a pacing decision the owner has already been
asked about once.

**8b. 150 of 364 professionals never play.** §3b. The bottom storey is dealt zero entrant slots a
season and holds a median 207 points for it. The cause is `selectEntrants`' position bias filling a
band from its top, and it is the same arithmetic as the world audit's open question 2 (the table is
564 rows where the real one is 1,500+).

**8c. …and `selectEntrants` alone reaches no LIVE player either.** Counting the season's entrant
slots as `selectEntrants` deals them, the 364 pros absorb **3,167 of 3,168**: in a fresh world every
junior sits at position 365+ of the merged table and a band filled from its top never gets there.
⚠ **That is NOT the whole picture and must not be read as one** – W3-ONRAMP added `fillOnRamp`
(`ON_RAMP.slots = 2` held per W event, filled after the week's double-bookings resolve), which is
precisely the door this arithmetic would otherwise shut, and `tools/w-onramp-probe.ts` measures it at
119.8 LIVE W rows a season. The finding here is narrower and still worth recording: **the percentile
band by itself is closed to everyone outside the top ~30% of the table**, so every LIVE result on the
professional tour arrives through the held slots rather than through the front door.

---

## 9. How the "gift" failure mode was guarded against

The brief names it explicitly and it is the easiest thing in this wave to do by accident:

> *A fix that simply deflates the table until she floats into the top 100 is a gift, not an
> achievement.*

Four things were built to make that visible rather than invisible.

1. **The headline is a correspondence, not a rank.** Measurement 1 is `Spearman(ability, points)`
   over the whole 364-strong population plus the three reference builds' skill-rank-against-points-rank
   pairs. A table that is merely deflated moves her rank and leaves the correspondence where it was;
   only a table that is re-*ordered* moves the correspondence.
2. **The prodigy and the median career are measured side by side** (measurements 1 and 5). A gift
   lifts both by the same amount and the gap between them stays flat or shrinks; an achievement widens
   it. Under the shipped table the pair is skill #85 → points #327 and skill #25 → points #165.
3. **The distribution, not the best** (measurement 6). "One career at #90" and "ninety careers at #90"
   print the same headline and are opposite games, so the count at #10 / #50 / #100 / #200 was added
   to `tools/money-decomposition.ts` before either arm was run.
4. **The doors are re-measured** (measurement 4). If a re-priced table bunches the field, an
   acceptance cut denominated in ranks stops separating anybody, and the ladder's rungs become
   decoration. The world audit already found three of ten cuts inert; the count is re-taken here.

---

## 10. What would have to be true for the alignment to work

Ordered by what it buys, with the measurement beside each. **Nothing here is shipped and nothing here
is recommended** – the target ("how often should a prodigy reach the top 10?") is the owner's and he
has not set it.

| # | change | measured effect | cost |
| --- | --- | --- | --- |
| 1 | **a deeper population** – `FIELD.size` 364 → ~520 with a fifth storey | the prerequisite for everything else: three of ten acceptance cuts are inert past the table's end (world audit §6b), the entrant bands map every rung onto a slice two to four times better-ranked than the real rung draws (§4a), and 150 pros are dealt no events (§3b) | re-opens every `entrantPctBand` and the sponsor derivation that reads `FIELD.size`; `fieldPros.ts` has flagged it since W2-FIELD2 |
| 2 | **compress the field's strength spread** to the real Elo curve | from #10 to #100 the issued books become earnable to within ±30% (§4a), with the real-curve points calibration untouched | needs #1 first: on today's 564-row table it puts the reference strong junior's W15 title chance at **2.3%** against a calibrated 15-35% |
| 3 | **`WINDOW_RUNGS` 3 → 5** (or `tierOutgrown` off for the W arm) | removes the §3c valley: a core-60 player's book stops falling 47% between #300 and #200 | a pacing change; the ceiling walk priced the same knob at +8 places for a perfect player, so it is worth far more to a real one than that number suggests |
| 4 | **re-price the field from the earn curve** (this branch's experiment) | §6 | see the verdict |

The ordering is the finding. **(4) is last because it is downstream of (1) and (2):** a table cannot
be priced in a currency the population cannot earn, and our population cannot earn it because it is
too thin and too steeply spread, not because the numbers on the cheques are wrong.

---

## 11. THE VERDICT

**Did ability rank and points rank converge?** *Her* ability and *her* points converged almost
exactly – skill #68 → points #69, skill #25 → points #18, skill #85 → points #75, against #241 /
#165 / #327 before. **And the population's did not: Spearman fell from 0.891 to 0.761 and the mean
gap widened from 35.6 places to 51.8.** Those two sentences are the same fact told from two ends.
Her rank improved by two hundred and fifty places without her winning a single extra match; what
improved was that 264 rows underneath her collapsed onto forty points, and inside that plateau the
table stopped ordering anybody. **That is the gift the brief names, measured.**

**Which of routes (a) / (b) / (c) do the numbers support?** None of them cleanly, and §4 is the
evidence for each:

* **(a) the tables pay too little** – no. From #10 to #100 our own ladder pays 0.73× to 1.50× the
  real curve; at #25 and #50 it pays *more* than reality. The points arrays are the real sport's own
  numbers and the calendar carries a real season of them.
* **(b) the calendar is too thin** – no as stated (26 of 30 top-window events entered, 24-28 supplied
  at the bottom), **but yes in a precise, different form:** the sliding window is monotone in title
  value and not in expected value, and it costs a real player up to 47% of her book on the way up
  (§3c, §8a). That is a shape-of-the-season defect and it is real.
* **(c) keep only the shape** – no, because the shape is exactly what does not survive. A
  self-consistent field has a hole in it: our economy pays nothing between 90 and 520 points, because
  sixteen ITF results at 10-125 a title top out near 90 for a player who is not winning them and the
  first WTA rung that pays a loser anything starts at 520.

**What the numbers do support is (d): the field's points curve is calibrated on the real WTA and its
strength curve is calibrated on `rollPotential`, and the exchange rate between them is what is
broken.** Our 364 professionals span 42.0 core points = 847 Elo where the real top 364 span 515 Elo =
25.5 core points on our own engine's scale. The tail carries almost all of the error: our #364 is
core 35.8 where the real curve wants 52.3. Section 4a prices the fix from that side and finds the
books become earnable to within ±30% from #10 to #100 **with the real-curve calibration untouched** –
and that it needs a deeper population first, because on a 564-row table it puts the reference strong
junior's W15 title chance at 2.3% against a calibrated 15-35%.

### Would I ship this?

**No, and the ship rule written in §6a before the numbers were read fails on all four counts:**
ability and points did not converge for the population (1); the table became a staircase with a
39× cliff between #50 and #100 (3); five acceptance cuts spanning 246 rank places ended up separated
by twenty points, one W35 title (4); and five W15 titles became world #99 (the pacing requirement).

So `FIELD.earnCurve` is **measured and reverted.** What ships is the instrument, the guard and this
page. The experiment was worth running: it is the reason §4 can say which of the routes the numbers
support instead of arguing about it, and the reason §10 can put the population depth first.

