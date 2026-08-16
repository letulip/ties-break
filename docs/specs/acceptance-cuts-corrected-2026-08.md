---
type: specification
status: current
area: simulation-and-balance
canonical: false
last-reviewed: 2026-08-16
---

# The acceptance cuts, corrected – and the audit's verdict, re-measured two phases later

**P3 of `docs/plans/college-and-the-junior-ladder.md`, on `wave/round21`, after P1
(`docs/specs/junior-access-2026-08.md`) and P2 (`docs/specs/age-eligibility-window-2026-08.md`).
It implements the audit `docs/specs/acceptance-cuts-2026-08.md`, which moved no constant.**

> **THE PHASE IN SEVEN LINES.** The sourced acceptance chain ships – **w50 330 · w75 300 · w100 240 ·
> wta125 180**, with **w35 700 and slam 104 untouched because the audit verified both correct**. `j300`
> goes **0.40 → 0.20**, halved rather than corrected to the sport's 2%, because 2% was measured to
> delete the rung and – since P1 – to cost far more than the audit could see.
> **And the audit's headline verdict does NOT survive.** On its own horizon the money gain shrinks
> fifteenfold, end funds flip sign and the college column flips direction, so *Pareto-positive* no
> longer holds. **But the phase is not a pure cost either**: run to 26.6 rather than to 20 it is a
> **delay** – she pays it at seventeen to nineteen and is repaid from twenty-one – the same shape P1
> and P2 each measured. **Zero schema: v49 unmoved, no migration, no fixture.**

---

## 0. THE PREDICTIONS, REGISTERED BEFORE ANY ARM WAS RUN

Invariant 4. Ruler: `tools/ladder-baseline.ts`, P0's frozen battery – n = 90 (9 presets x 10 seeds),
676 weeks, `POLICIES[1]`. **Before = this branch at `c04253f`** (P1 + P2 shipped); P0's own frozen
column is carried alongside so the whole chain stays legible.

**The reasoning behind the headline prediction, written down with it.** The audit named its own
mechanism: *"with the shipped cuts she spends her season in W75+ draws she loses early; with the
corrected chain she spends it at W15/W35/W50, where she wins."* **P1 already banked exactly that
substitution** – it moved her first W75 from 17.2 to 19.0 and put ~54 W15 entries in a career. The
premature W75+ entries the chain was recovering are gone before the chain arrives. What is left is the
cost half: refusing an **adult** at the rungs she has only just reached.

| # | claim | predicted |
| --- | --- | --- |
| P1 | the audit's Pareto-positive verdict | **does not survive** – end rank within ±30 of before, not a 76-place gain |
| P2 | W75+ entries per career | falls only slightly, not the audit's 26.3 → 21.0 |
| P3 | the new binding rungs are W100 and WTA 125, for an ADULT | first W100 +≥1.0y, first WTA 125 +≥1.0y |
| P4 | W75 itself stays inert | first W75 moves <0.3y – pinned at 19.0 by the junior/adult boundary |
| P5 | W35's reach (P1 flagged this as P3's question) | roughly unchanged, ±10pp |
| P6 | prize money | flat to −$20k, not the audit's +$28k |
| P7 | the counting book at 19 | thins slightly or flat |
| P8 | the college door / fork-open rate | flat or slightly **up**, the opposite direction from the audit's 9% → 4% |
| P9 | where j300 lands | **0.10–0.15** (row #20–#30 of 200) – tight enough to matter, loose enough not to delete the rung |
| P10 | survival unchanged; the sponsor gate must move with w100 | `maxWtaRank` 350 → 240 or `tests/offers.test.ts` goes red |

---

## 1. WHAT SHIPPED, AND WHAT DELIBERATELY DID NOT

| rung | was | ships | verdict | the source behind it |
| --- | --- | --- | --- | --- |
| `w35` | 700 | **700** | ✅ **leave – verified correct** | observed clean cuts **551 · 662 · 716 · 724 · 730 · 835 · 871**; ours is mid-range |
| `w50` | 550 | **330** | ⭐ **change** | observed **204 · 234 · 390 · 424 · 441**; 330 is the middle of that spread |
| `w75` | 450 | **300** | ⭐ **change** | observed **262 · 305 · 334 · 359**; 300 is the middle of that spread |
| `w100` | 350 | **240** | ⚠ **change, NOT SOURCED** | no clean list exists in the 2026 calendar; **placed** to keep the chain monotone |
| `wta125` | 250 | **180** | ⚠ **change, NOT SOURCED** | no published depth; the real per-rung rule here is a *ceiling*. **Placed** |
| `slam` | 104 | **104** | ✅ **leave – verified exact** | rule 128 = 104/108/112 DA + 16/12/8 Q + 8 WC; observed AO 2026 #103, US Open 2026 #102 |
| `j300` | 0.40 | **0.20** | ⭐ **change, by measurement** | real J300 lists cut at ITF Combined Junior **81 / 101 / 182** of a **4,890**-strong girls' list = top ~2%. §3 is why 2% is not what ships |
| `j60` | 0.50 | **0.50** | ✅ leave | real cuts are the top 44–64%; ours is inside the sport's own spread |
| `j30`, the domestic three, `w15`'s on-ramp | – | unmoved | **needs the owner** | each carries an owner ruling or has no real analogue – §6 |

⚠ **TWO OF THE FOUR LINKS CARRY NO EVIDENCE AND THE TABLE SAYS SO IN ITS OWN COLUMN.** W100 and
WTA 125 are *placed*, not sourced: they exist to keep the ladder monotone between w75's sourced 300
and `wta250`'s 200. This is finding 2 of the audit (*"the figures were never sourced – they were
repeated from a comment"*) being deliberately not repeated: the provenance column is now in
`calendar.ts` beside the numbers, so the next reader cannot mistake a placed figure for a real one.

⚠ **AND A REAL CUT IS NOT A CONSTANT.** It is set at the entry deadline and drifts deeper as players
withdraw; it varies by geography (US-based W75s ran ≥494 against European 262–359); and only 16–20 of
a real W75's 32 chairs are direct acceptances at all. Any single number we ship is a flattening of all
three, and that is true of the corrected chain exactly as it was of the old one.

---

## 2. THE STRONG-OUT RULES WERE ALREADY SHIPPED, AND THE CHAIN DOES NOT CONTRADICT THEM

P1 step 2 built them (`277661d`, *"the rungs she has outgrown stop being hers – and give themselves
back"*): `PLAY_DOWN` in `world/ladder.ts` bars a WTA top-50 from **every** W-series rung and a top-150
from **W15/W35**, as a live rank read that self-reverses. **Nothing was rebuilt here.** What this phase
owed was the check that a *tightened* floor cannot collide with an existing ceiling, and it was made
rather than assumed:

| rung | play-down bar | new cut | the window it leaves |
| --- | --- | --- | --- |
| w15 | top 150 | on-ramp | #151 → the bottom of the table |
| w35 | top 150 | 700 | **#151 – #700** |
| w50 | top 50 | 330 | **#51 – #330** |
| w75 | top 50 | 300 | **#51 – #300** |
| w100 | top 50 | 240 | **#51 – #240** |
| wta125 | *none* – not a W-series event | 180 | **#1 – #180** |

**No window is empty, and no rank from #1 to the bottom of the table is left with nothing open to it.**
Had a corrected cut landed at or under its own rung's bar, that rung would have become unreachable in
silence – the one failure mode this pairing can produce. The check is recorded in `calendar.ts` beside
the chain so the next tightening re-runs it.

⚠ **The band consistency the audit checked (§2c) also survives**: every W rung's `entrantPctBand` still
reaches past its own cut (w50 #261–936 vs 330 · w75 #189–756 vs 300 · w100 #117–594 vs 240 ·
wta125 #79–468 vs 180), so the two encodings of the range still agree.

---

## 3. J300 – WHAT IT LANDED ON, AND EVERYTHING ELSE THAT WAS TRIED

The plan's instruction was exact: *"0.40 → ~0.02: it is 20× out, and the audit measured 0.02 as
deleting the rung entirely, so this one needs a size that is neither today's nor a deletion."*

**Seven values were measured**, `tools/acceptance-cuts.ts`, n = 27 (9 presets x 3 seeds), 312 weeks,
identical seeds across every arm:

| `j300.enterPct` | = row of 200 | J300 entries | reach | first W15 | end WTA rank | prize |
| --- | --- | --- | --- | --- | --- | --- |
| **0.40** (was) | #80 | **4.4** | **27/27** | 15.6 | 258 | $105,511 |
| 0.25 | #50 | 3.0 | 25/27 | 15.9 | 204 | $108,997 |
| **0.20** (ships) | **#40** | **1.7** | **17/27** | 16.2 | **259** | $99,562 |
| 0.15 | #30 | 0.4 | 5/27 | 16.3 | **368** | $89,049 |
| 0.10 | #20 | 0.3 | 4/27 | 16.3 | 371 | $89,686 |
| 0.05 | #10 | 0.0 | 1/27 | 16.3 | 373 | $87,437 |
| 0.02 | #4 | **0.0** | **0/27** | 16.3 | 372 | $87,410 |

### 3a. ⚠⚠ IT FALLS OFF A STEEP EDGE BELOW 0.20, AND P1 IS WHAT PUT THE EDGE THERE

Four arms sit at end rank ~#370 and three at ~#204–259. That is not a gradient, it is a step – and
the mechanism is in the **first W15** column, which moves 15.6 → 16.3 and loses two careers entirely.

**The audit measured the 0.02 arm as roughly NEUTRAL on the professional ladder (end rank 280 → 281).
It is not neutral any more.** P1 made the junior ranking **load-bearing for professional access**:
W15's door is now the junior-reserved place (`JUNIOR_RESERVED`, a share of the junior table) and every
rung above it is the Accelerator, both keyed on a junior standing that a J300's 300 points is the
fastest way to build. Delete the prestige rung and the whole professional on-ramp is late.

> **This is the clearest single example of why the plan ordered P3 after P1.** The same edit, measured
> four days apart, is worth 1 rank place on one ladder and ~110 on the other.

⚠ **AND THE WORD "CLIFF" IS OVERSTATED BY THE n = 27 TABLE – SAID HERE RATHER THAN LEFT TO FLATTER
THE CHOICE.** A **0.175** probe at n = 54 lands *part-way down*: end rank **283** against shipped 250,
prize **−$11.9k**, J300 entries 1.3 with reach 32/54. So the edge is a steep **slope**, not a wall, and
0.20 is the last value before it rather than the last value above a precipice. What the probe does not
change is the direction – every value below 0.20 is further downhill and buys nothing the target asks
for.

⚠ **NOR IS 0.20 FREE, AND §4c PRICES IT**: about **−$9k of prize money and ~40 mean rank places** on
the audit's horizon. It ships because the rung was measurably outside its own target in the loose
direction (§3b) and because the sport says 2% – **not because the correction pays. It does not.**

### 3b. AND HALVING IT MOVES THE RUNG BACK TOWARDS ITS OWN TARGET, NOT AWAY FROM IT

`docs/specs/two-ladders.md` §0 wrote the target down **before** tuning: *"0 for most careers, 1–2 for
a good one, 2–3 for the best"* per four-year junior career. It was hit when it was written on 30.07.

**On today's population the shipped 0.40 measured 4.4 entries a career with 27 of 27 careers reaching
the rung – it had drifted outside its own target, in the loose direction.** 0.20 reads **1.7 and
17 of 27**.

⚠ **So the collision the audit escalated is smaller than it looked.** For this half of the move the
sport and our own pre-registered target point the **same way**; only the last stretch – from a fifth
of the table down to a fiftieth – is genuinely contested.

### 3c. WHAT IS STILL THE OWNER'S

0.20 is **#40 of 200 – the top 20%**, against a sport that cuts at the top ~2%. **A tenfold gap has
been closed to a fivefold one, and the remaining fivefold is real.** It was not closed further because
every value that closes it deletes the rung and costs ~110 rank places by the mechanism in §3a. Whether
the game should keep a reachable prestige rung at all, or accept a J300 nearly nobody plays, is his
call. It is not taken here.

---

## 4. MEASURED – DID THE AUDIT'S VERDICT SURVIVE?

### 4a. ⭐⭐ THE AUDIT'S OWN TABLE, RE-RUN ON THE POPULATION P1 AND P2 BUILT

`tools/acceptance-cuts.ts`, **the audit's own tool, its own n, its own horizon and its own policy** –
n = 54 (9 presets x 6 seeds), 312 weeks, `POLICIES[1]`, identical seeds across arms, **both arms in one
engine state**. The only thing that differs from the audit's §4b run is the *tree*: P1 and P2 have
landed in between.

| | **audit, 15.08** (pre-P1) | | **this run, 16.08** (post-P1+P2) | |
| --- | --- | --- | --- | --- |
| | shipped | sourced chain | shipped | **sourced chain** |
| first W75 / W100 / WTA 125 entry | 17.1 / 17.4 / 18.0 | 17.3 / 18.2 / 18.5 | 19.0 / 19.1 / 18.9 | **19.0 / 19.2 / 19.2** |
| W75+ entries per career | 26.3 | 21.0 | 8.7 | **6.2** |
| W15 / W35 / W50 entries | 12.7 / 6.4 / 9.7 | 18.5 / 14.1 / 12.1 | 51.0 / 3.1 / 2.8 | **53.0 / 5.7 / 4.3** |
| **end WTA rank** (mean / median) | 280 / 195 | **204 / 179** | 250 / 184 | **227 / 188** |
| **end WTA book** | 365 | **441** | 377 | **386** |
| **prize over the horizon** | $157,562 | **$185,792** | $114,716 | **$116,582** |
| **end funds** | $59,124 | **$73,708** | $38,456 | **$37,433** |
| survived | 100% | 100% | 100% | **100%** |
| college shuts at | 17.2 | 17.6 | 18.9 | **19.1** |
| **college open at the fork** | 9% | **4%** | 76% | **93%** |

> ### ⚠⚠ THE PARETO-POSITIVE VERDICT DOES NOT SURVIVE, AND THE WAY IT FAILS IS MORE USEFUL THAN A FLAT NO.
>
> It is not reversed – it is **attenuated to nothing and then inverted on two columns**:
>
> * **the money gain is gone.** +$28,230 becomes **+$1,866** – a fifteenfold shrink, inside the noise
>   of a 54-career sample.
> * **end funds flip sign.** +$14,584 becomes **−$1,023**. A "Pareto-positive" change is one that is
>   better on *every* metric; this one is not, so the label no longer applies whatever the rank does.
> * **the college column flips direction.** The audit's most-quoted secondary finding was that
>   correcting the ladder makes the college ending *rarer* (9% → 4%) and therefore cannot rescue it.
>   On this tree the same chain makes it **commoner: 76% → 93%.**
> * **only the rank gain partly survives** – mean 250 → 227 against the audit's 280 → 204 – and the
>   **median moves the other way (184 → 188)**, so even that is a thinner tail rather than a better
>   median career.

**WHY, MECHANICALLY.** The audit stated its own mechanism: *"with the shipped cuts she spends her
season in W75+ draws she loses early; with the corrected chain she spends it at W15/W35/W50, where she
wins."* **P1 already banked that substitution.** Compare the entry rows: on the audit's tree the chain
moved 5.3 entries out of W75+ and 20 into W15/W35/W50; on this tree there are only 8.7 W75+ entries to
move at all, because P1's Accelerator had already taken her first W75 from 17.2 to **19.0**. The chain
arrives to collect a saving that has been collected.

### 4b. ⭐ WHAT THE CHAIN DID DO – IT PUT W35 BACK, WHICH IS THE QUESTION P1 LEFT IT

`junior-access-2026-08.md` §4g closed with: *"The W35 collapse (94% → 56%) is a prediction about P3.
The corrected acceptance chain lands on a rung almost nobody now visits; whether that survives is the
question P3 was ordered to ask."* **Answered, and the chain repairs it:**

| reach, of 54 | shipped | **sourced chain** |
| --- | --- | --- |
| **W35** | **31** | **53** |
| W50 | 52 | 51 |
| W75 | 49 | 47 |
| **W100** | **50** | **39** |
| **WTA 125** | **40** | **18** |

**W35 goes from a rung 57% of careers ever see to one 98% do**, and its entries nearly double
(3.1 → 5.7). The reason is the chain's own shape: an adult at #250–330 used to step straight past W35
and W50 into a W75/W100/125 she could enter but not win; with W100 at 240 and the 125 at 180 she
cannot, so she plays the rungs beneath. **That is the audit's mechanism actually firing – just one
storey higher up the ladder than the audit found it, and for an adult rather than a junior.**

⚠ **AND WTA 125 IS WHERE IT BITES.** The cut is cleared inside the horizon by **25 of 54** careers
against **47 of 54** before – so for 29 careers the WTA 125 stops existing before age 20 entirely.
W100's is cleared by 45 against 52. Those two rungs are the whole of the chain's cost.

### 4c. THE J300 HALF, MEASURED SEPARATELY SO THE TWO NUMBERS DO NOT HIDE EACH OTHER

Same run, same seeds, n = 54:

| | shipped | chain only | **chain + j300 0.20 (ships)** | j300 0.175 only |
| --- | --- | --- | --- | --- |
| J300 entries / reach | 4.6 / 54 | 4.7 / 54 | **2.2 / 42** | 1.3 / 32 |
| end WTA rank (mean / median) | 250 / 184 | 227 / 188 | **294 / 182** | 283 / 190 |
| end WTA book | 377 | 386 | **378** | 357 |
| prize | $114,716 | $116,582 | **$105,964** | $102,845 |
| end funds | $38,456 | $37,433 | **$35,631** | $36,925 |
| survived | 100% | 100% | **100%** | 100% |

**The j300 correction is the expensive half and it is stated as such.** The chain alone is roughly
money-neutral (+$1.9k); adding j300 costs **−$10.6k against the chain and −$8.8k against shipped**, and
takes the mean end rank from 227 to 294. The median is unmoved (184 → 182), so the cost falls on the
strong tail – the careers that were using the prestige rung to build a junior ranking fast.

⚠ **This is the §3a mechanism showing up in the headline**, and it is the reason the value shipped is
0.20 rather than anything closer to the sport's 2%.

### 4d. ⭐⭐ P0's OWN BATTERY, FULL HORIZON – AND IT CHANGES THE ANSWER TO §4a

`tools/ladder-baseline.ts --seeds 10`, n = 90, **676 weeks (13.6 → 26.6)**, `POLICIES[1]`, identical
seeds. **Before** = `c04253f`; P0's frozen column carried alongside.

⚠ **THE AFTER ARM WAS RUN TWICE, AND THE SECOND RUN IS WHY IT CAN BE TRUSTED.** The first was taken
before `global.maxWtaRank` moved 87 → 60, so it measured a tree that is not the one shipping. It was
re-run on the exact shipped tree and **the two outputs are byte-identical apart from the wall-clock
line** – so the global sponsor gate's narrowing is **inert on this battery**: no career of the ninety
was in the rank band 61–87 at a week the offer was evaluated. That makes the table below valid for the
shipped tree, and it makes §6.1's narrowing a **latent** change rather than a measured one – which is
an argument for showing it to him, not for ignoring it.

⚠⚠ **THE AUDIT'S HORIZON WAS 312 WEEKS AND IT STOPPED AT TWENTY.** §4a is measured on that horizon
because it has to be, to be comparable. **This table runs to 26.6 and the sign flips halfway.**

| | P0 (pre-P1) | before (P1+P2) | **after (P3)** | |
| --- | --- | --- | --- | --- |
| age / rank at first W75 | 17.0 / #272 | 19.0 / #273 | **19.0 / #261** | unmoved – **P4 ✓** |
| age at first W100 / WTA 125 | 17.5 / 17.8 | 19.1 / 19.1 | **19.3 / 19.6** | the chain's bite |
| **W35 reach** | 86/90 | **63/90** | **82/90** | ⭐ **the collapse is repaired** |
| W50 / W75 / W100 / WTA 125 reach | 86 / 84 / 86 / 86 | 88 / 84 / 88 / 88 | **83 / 82 / 83 / 82** | |
| **J300 reach** | 89/90 | 90/90 | **71/90** | the rung starts sorting |
| **rank at 17** | #246 | #426 | #423 | flat |
| ...careers holding a ranking at 17 | 78/90 | 82/90 | **68/90** | ⚠ she is unranked longer |
| rank at 19 | #177 | #272 | #270 | flat |
| **rank at 21** | #185 | #199 | **#174** | ⭐ better |
| **rank at 25** | #172 | #176 | **#158** | ⭐ better |
| career high (median) | #111 | #121 | **#115** | better |
| **prize banked by 19** | $125,855 | $79,165 | **$69,780** | ⚠ **−$9,385** |
| **prize by 21** | $251,215 | $196,625 | **$211,715** | ⭐ **+$15,090** |
| **career prize** | $654,430 | $589,705 | **$646,795** | ⭐ **+$57,090** |
| counting book at 19 (median) | 391 | 234 | 226 | thins – **P7 ✓** |
| **counting book at 21** | 381 | 363 | **421** | ⭐ |
| **slots full at 21** | 17/90 | 9/90 | **42/90** | ⭐ the book fills again |
| college door shut | 86/90 mean 17.3 | 88/90 mean 19.0 | **83/90 mean 19.2** | |
| **open AT the fork** | 8% | 79% | **96%** | **P8 ✓** |
| **open a full season later** | 4% | 2% | **8%** | ⭐ 4× |
| bankruptcies | 1 | 1 (at 14.8) | **0** | |
| careers ending early | 2 | 1 | 1 (injury, 24.9) | |

> ### ⭐⭐ THE VERDICT, STATED PROPERLY
>
> **"Pareto-positive" is wrong on both horizons** – there is no arm in which every column improves.
> But **"it is a pure cost" is wrong too**, and that is the thing the audit's 312-week window could
> not have shown:
>
> **The chain costs her the years seventeen to nineteen and pays from twenty-one.** Fourteen fewer
> careers hold a ranking at seventeen and she banks $9,385 less by nineteen; by twenty-one she is
> **25 places higher with a book of 421 against 363 and 42 careers of 90 holding a full eighteen
> slots against 9**, and the career finishes **$57,090 better off**.
>
> **That is the same delay-not-tax shape P1 and P2 each measured, arriving a third time** – and it is
> the shape the owner should be told about, because it is the one that makes «скорость и продвижение
> точно упадут» true and survivable at the same time.

### 4e. ⚠ AND THE COLLEGE FINDING THE AUDIT CLOSED OFF HAS RE-OPENED

`acceptance-cuts-2026-08.md` §5 concluded, with evidence: *"A more realistic ladder makes the college
ending rarer, not commoner… what this audit changes is that the option of fixing it sideways is now
closed with evidence rather than left open as a maybe."*

**On this population it runs the other way.** Fork-open **79% → 96%**, and the honest column – still
open a **full season** later – goes **2% → 8%**, a fourfold improvement. The mechanism inverted with
the population: before P1 a tighter ladder made her reach W75 *more* reliably and so shut the door
*more*; now the door is shut at 19.0 by a W75 she reaches on her birthday, and the chain pushes the
W100/WTA 125 counting finishes that used to shut it out past the fork entirely (W75's share of
closures goes 57% → **92%**, i.e. the other rungs stop closing it at all).

⚠ **This does not rescue the college ending and it is not offered as doing so** – 92% of careers still
lose it. What it does is **retire a piece of evidence**: P4 must not quote §5's conclusion as settled,
because the arm it rests on now measures the opposite sign.

### 4f. PREDICTED VS MEASURED, SCORED

| # | predicted | measured | |
| --- | --- | --- | --- |
| P1 | the Pareto verdict does not survive | money gain 15× smaller, end funds flips sign, college flips direction | ✓ |
| P2 | W75+ entries fall only slightly | 8.7 → 5.7 (−34%), proportionally MORE than the audit's −20% | ✗ |
| P3 | first W100 / WTA 125 +≥1.0y | **+0.2 / +0.5** | ✗ – the delay is small because she meets those doors at 19+, where her rank moves fast |
| P4 | W75 stays inert, <0.3y | 19.0 → 19.0 | ✓ |
| P5 | W35 reach ±10pp | **63/90 → 82/90, +21pp** | ✗ – **and this is the best miss**: the chain repaired P1's W35 collapse |
| P6 | prize flat to −$20k | −$9.4k by 19, **+$57k career** | ½ – right about the early cost, wrong about the sign at the end |
| P7 | the book at 19 thins or is flat | 234 → 226 | ✓ |
| P8 | fork-open flat or up (≥79%) | **96%** | ✓ |
| P9 | j300 lands in 0.10–0.15 | **0.20** – 0.15 is over the cliff | ✗ |
| P10 | survival unchanged; the sponsor gate must move | 1 → 0 bankruptcies; **two** sponsor gates had to move | ✓ |

**Five right, one half, four wrong – and the four misses are the findings.** P5 and P3 were both wrong
because they assumed the chain's bite would land where the audit found it; it landed one storey up and
on an adult, which is why W35 came back instead of thinning further. P6 was wrong about the sign
because the audit's horizon stops at twenty and this one does not. P9 was wrong because the cliff in
§3a is a P1 artefact nobody had measured.

---

## 5. GUARDS – what moved and why

**24 assertions across 9 files went red** (ladder-floor 12 · offers 2 · unranked-sentinel 2 ·
coach-travel-edge 2 · ladder-separation 2 · ladder 1 · outgrownWithdraw 1 · play-down 1 ·
endings-bench 1). **Every one is RE-AIMED with a ⚠ note at the site, none is weakened or deleted**,
and two are strictly stronger than the line they replace. They are four families, plus one thing that
is not a re-aim at all.

**(a) A PIN ON A NUMBER THIS FILE HAS NO OPINION ABOUT.** `tests/unranked-sentinel.test.ts` asserted
`expect(TIERS.w100.acceptsRank).toBe(350)` – a literal, inside a case about the *sentinel*, whose real
precondition is only that the cut is **inside** the table. The literal is replaced by that inequality,
which is what the case was always about and which survives the next chain change too. **Strictly
stronger.**

**(b) FIXTURES PARKED NEXT TO A DOOR THAT MOVED.** A cut is a rank, but what a fixture has to hand the
kid is the **book standing on that rank** – and those moved with the cuts: W50's price went 59 → **159**,
W75's 90 → **189**, W100's 147 → **272**.
* `tests/unranked-sentinel.test.ts`' four-stage slide: probes 50 / 75 / 140 → 50 / **170** / **200**.
  The stages, the exact lists and the one-rung-at-a-time claim are untouched.
* `tests/ladder-floor.test.ts`: every "a climbed professional" fixture passed a book of **140**, chosen
  to clear W75 and not W100. It now clears neither, so twelve cases were failing on scaffolding rather
  than on the sliding window they measure. **Book 140 → 250.**
  ⚠ **250 is the MIDDLE of the window, not the first value that passed** – measured against the real
  fixture by bisection (200 does not open W75; 300 already opens W100), because this world is *ticked*
  to seventeen and its cohort has earned points meanwhile, so its table is deeper than a fresh one's.
  The whole failure was a fixture parked on a threshold; parking it on another one would be the same
  bug with a new number.

**(c) A BEHAVIOURAL CONSEQUENCE, NOT A FIXTURE PROBLEM – AND IT IS AN ECONOMY CHANGE.**
`tests/offers.test.ts` broke because **both professional sponsor gates are derived from
`TIERS.w100.acceptsRank`** and it moved. `ECONOMY.sponsors.national.maxWtaRank` **350 → 240** and
`global.maxWtaRank` **87 → 60** (a quarter of its neighbour, as its own comment defines it). The
probes re-point (#300 → #230 for national, #60 → #55 for global) and the claim – *a professional
standing alone signs her* – is unchanged. **See §6.1: this is a balance change to the economy that
rode in on a ladder correction, and it is the owner's to accept or reject.**

**Also in family (b), not (c):** `tests/play-down.test.ts`' reversal probe **#300 → #200** (that rank
exists to clear *every* W acceptance cut, so anything shut below is demonstrably the play-down rule and
not the list – the chain took the tightest W-series cut to 240, so #300 stopped doing its job);
`tests/outgrownWithdraw.test.ts`' seed book **30 → 40 a side** (`tierOutgrown('w50')` asks whether the
WTA 125 is open, and its price went from a book of ~249 to ~384); and `tests/ladder-separation.test.ts`'
two sweeps **140 → 210 weeks** (both assert they reached *both halves of the ladder or they guard
nothing*, and the tighter j300 door moved this seed's international debut past week 140).

**(c2) TWO FROZEN ARTEFACTS, RE-FROZEN UNDER THEIR OWN PROTOCOL.**
* `tests/coach-travel-edge.test.ts`' three career hashes. ⚠ **The per-key diff was taken FIRST, as
  that file demands** – a worktree at `c04253f`, all 64 top-level keys hashed on both sides.
  **27–32 keys move per career** (`results`, the rank caches, the season counters, the wallet – and
  on the middle grinder `ending`, `debtSinceWeek` and `medicalWithdrawalWeek`, i.e. **that career now
  ends differently**), while **`coachId`, `coachOnEventWeeks`, `coachOnJuniorEvents`, `profile`,
  `seed`, `rngMain`, `cohort` and `schemaVersion` are byte-identical on all three**. What the hashes
  exist to catch is a coach change leaking past the trip; a ladder change that left `results` alone
  would be the alarm.
* `tests/endings-bench.test.ts`' fork cell. Its `steady` career (PRESETS[3]) **stopped reaching the
  fork at all** – on the corrected ladder it takes a career-ending injury at week 262 – so the case
  exploded on its own precondition, which is what it is built to do. The board was re-swept over ten
  seeds and the cell moved to **PRESETS[0]**, which ties for the widest margin (fork reached 10/10,
  door open 10/10, never shut 10/10 over six years), keeps the "self-coached family grinds the
  calendar" property the cell was chosen for, and is **stronger than the cell it replaces**.

⚠ **`rngMain` UNMOVED IS THE INVARIANT-2 RESULT, AND IT IS WHY NOTHING IN `tests/condition.test.ts`
NEEDED A PARAGRAPH.** An acceptance cut is a **post-draw gate** and taps no stream, so the persisted
MAIN position after 156 weeks is identical in both trees. The frozen capture (count 41550, hash
`e6b0c709`) is untouched – and unlike P1 and P2, **its companion `REF.kidRank` did not move either**.

**(d) ⚠⚠ AND ONE GUARD WAS ADDED, BECAUSE THE CHAIN BROKE SOMETHING NOBODY WAS WATCHING.** See §5a.
**Plus one direction pin that INVERTED, in `tests/ladder.test.ts` – see §5b.**

### 5a. ⚠⚠ THE CHAIN INVERTS THE LADDER ONE RUNG ABOVE WHERE THE GUARD STOPS LOOKING

`tests/season/fieldPros.test.ts` pins that the cuts **strictly tighten** – and it pins it over
**five** rungs, `w35 → w50 → w75 → w100 → wta125`. The sourced chain keeps that (700 > 330 > 300 >
240 > 180). **But the ladder does not stop at WTA 125:**

| rung | cut |
| --- | --- |
| w100 | 240 |
| **wta125** | **180** |
| **wta250** | **200** ⚠ |

**`wta125` at 180 is TIGHTER than the WTA 250 above it, so a WTA 250 now admits a deeper ranking than
the WTA 125 beneath it.** The five-rung guard cannot see this, and nothing else was watching.

**It is visible in behaviour, not only in the table**: n = 54, she plays **2.1 WTA 250s a career
against 0.5 WTA 125s**, and on the full battery the WTA 125's own reach falls to 82/90 while WTA 250's
holds at 83/90 – the smaller event has become the harder one.

⚠ **SHIPPED AS INSTRUCTED AND PINNED AS A CHARACTERISATION.** The chain `w50 330 · w75 300 · w100 240 ·
wta125 180` is the one the audit recommended and the staged plan ordered built, so the number is not an
agent's to re-pick. What ships beside it is an explicit pin on the inversion with a note saying
**delete this and widen the loop to the whole ladder** the day it is resolved – so a future wave meets
the fact instead of rediscovering it. **§6.2 is the decision.**

⚠ **What was CHECKED and is fine:** the chain does **not** collide with the play-down ceilings (§2 –
every rung keeps a non-empty window), and every **W** rung's `entrantPctBand` still reaches past its
own cut, so the two encodings of the range still agree there.

### 5b. ⚠⚠ AND THE SECOND INVERSION: j300's CUT IS NOW STRICTER THAN ITS OWN FIELD

`tests/ladder.test.ts` pinned, as a **direction** rather than a number, that j300's acceptance cut sits
**above** the top of the band its field is drawn from – *"the prestige rung is the one that admits
players from outside its own regular field"*. With `enterPct` 0.20 against an `entrantPctBand` reaching
0.25, **that has inverted**: the kid now needs a better junior standing to ENTER a J300 than the
weakest AI player the draw is MADE of.

**The pin's own stated reason has expired, and that is why it could move.** It was measured, on 30.07:
a cut at the field's top *"would be a wall no career in any preset ever cleared"* – 0.0–0.3 entries per
four-year career across all eighteen cells. **P1 and P2 rebuilt the junior game around this table and
the wall is not a wall:** at 0.20, **42 of 54 careers still enter a J300** (2.2 each), and 71 of 90
over the full baseline horizon. The property the line protected – *the prestige rung is reachable* –
survives; the proxy it used does not.

⚠ **Pinned as a characterisation with the evidence beside it**, and with instructions to restore the
strict form if j300 is ever re-picked at 0.25 or above. **It is the second thing this chain inverted
(§5a is the first), and both are on the owner's list rather than an agent's.**

---

## 6. FOR THE OWNER – four things, in order of how much they need him

### 6.1 ⚠⚠ THE SPONSOR ECONOMY MOVED, AND NOBODY DECIDED THAT

Two constants in `economy.ts` are **defined** as `TIERS.w100.acceptsRank` and a quarter of it, so
correcting the ladder moved them:

| gate | was | now | what it means |
| --- | --- | --- | --- |
| `national.maxWtaRank` | 350 | **240** | a national sponsor now wants a top-240 professional |
| `global.maxWtaRank` | 87 | **60** | and the global rung's band narrows from ranks **51–87** to **51–60** |

The *rule* did not change a word – *"National signs the girl who would be IN the W100 draw, whatever
that list currently is"* – and the equality is pinned, so leaving them behind was not an option. But a
sponsorship rung **ten ranks wide** may no longer be a rung, and this is a balance change to the money
economy that arrived as a side effect of a realism fix. **Accept it, or decouple the sponsor gates from
the ladder and give them their own numbers.**

⚠ **AND IT IS LATENT RATHER THAN MEASURED, WHICH CUTS BOTH WAYS.** Re-running the whole battery with
and without the global gate's move produced **byte-identical output** (§4d), so nothing in the ninety
careers noticed. That is not evidence the narrowing is harmless – it is evidence that **this sample
never tested it**, because no career sat in the band 61–87 when an offer was evaluated. A career that
does will meet a rung a third of its former width.

### 6.2 ⚠⚠ THE WTA 125 NOW SITS BELOW THE WTA 250 (§5a)

The chain's top link makes the smaller event harder to enter than the bigger one. Three ways out, none
of them an agent's: **(a)** accept it – 180 is placed, not sourced, and nothing about it is precious;
**(b)** re-place `wta125` between `w100` 240 and `wta250` 200 – i.e. **210** – which restores
monotonicity across the whole ladder at the cost of a slightly looser 125; **(c)** move `wta250` down
instead, which is a bigger change and reaches into act 3.

### 6.3 J300: A TENFOLD GAP CLOSED TO FIVEFOLD, AND THE REST IS CONTESTED

0.20 is the top 20% of our junior table; the sport cuts at the top ~2%. **Everything closer to the sport
deletes the rung** (§3), and since P1 that costs the professional on-ramp about 110 rank places rather
than the ~1 the audit measured. ⚠ **And note what halving the SHARE did to the PRICE**: the book
standing on the cut went from **92 junior points to 880**, because our junior table's points curve is
very steep in its top 40. A share is a gentle-looking instrument on a steep table.

⚠⚠ **AND 0.20 INVERTS A SECOND DIRECTION (§5b): the cut is now stricter than the band the J300 field
is drawn from (0.20 against 0.25)**, so the kid needs a better junior standing to enter than the
weakest AI player in the draw. The reason that direction was pinned – a cut at the field's top was a
wall nobody cleared – was measured false on this population (42 of 54 careers still enter one). It is
flagged rather than fixed, and **0.25 is the value that would restore it** if he wants the property
back at the cost of most of the correction.

**The question is the one the audit asked and it is unchanged**: is a J300 a prestige rung a good career
plays once or twice a season (our pre-registered target, which 0.20 restores), or the top-2% event the
sport says it is (which our 200-row table cannot carry)?

### 6.4 WHAT THIS PHASE DID NOT TOUCH, AND WHY

| | verdict | why it is his |
| --- | --- | --- |
| `w35` 700 · `slam` 104 | **leave** | the audit verified both correct – 700 is mid-range against seven observed cuts, 104 is exact by rule and by observation |
| `j30`'s `[250, MAX]` | **needs the owner** | 250 carries his ruling verbatim (29.07) and its comment says 250 and National's 150 *"are one decision and must move together"* |
| `w15`'s on-ramp | **needs the owner** | rule and practice disagree and both are sourced; choosing between them is design, not correction |
| `w75.minAgeYears` 17 | ✅ **ANSWERED 16.08 – now 14** | reality's floor is 14 and the one rung-specific rule is a quota, not a door. It would put a fourteen-year-old on the professional tour. ⭐ He ruled exactly that, for the whole grid: [`college-is-its-own-branch-2026-08.md` §0a](college-is-its-own-branch-2026-08.md) |
| the **ceiling** family | **unmodelled, and now half-modelled** | P1 step 2 shipped the play-down rules, so the audit's §8 question 4 is partly answered; the WTA 125's own ceiling (#1–20 barred, four ranked 21–50 by wild card) is still not modelled |

---

## 7. WHAT THIS WAVE EDITS

| file | change | risk |
| --- | --- | --- |
| `src/engine/season/calendar.ts` | `w50` 550→330, `w75` 450→300, `w100` 350→240, `wta125` 250→180, `j300` 0.40→0.20, and the provenance columns beside them | the balance change this phase is |
| `src/engine/economy.ts` | `national.maxWtaRank` 350→240, `global.maxWtaRank` 87→60 – **derived, and pinned as equalities** | §6.1 |
| `tests/unranked-sentinel.test.ts` | one literal pin → the inequality it meant; three probe books re-spaced | none – strictly stronger |
| `tests/ladder-floor.test.ts` | the climbed-professional book 140 → 250, bisected against the real fixture | none |
| `tests/offers.test.ts` | two sponsor probes re-pointed | none |
| `tests/season/fieldPros.test.ts` | **added:** a characterisation pin on the WTA 125 / WTA 250 inversion, with instructions to delete it when resolved | none |
| `tests/ladder.test.ts` | the j300 pin 0.4 → 0.2, and its direction pin inverted as a characterisation (§5b) | none |
| `tests/play-down.test.ts` | the reversal probe #300 → #200 – the rank that clears every W cut | none |
| `tests/outgrownWithdraw.test.ts` | the seed book 30 → 40 a side | none |
| `tests/ladder-separation.test.ts` | both sweeps 140 → 210 weeks | none |
| `tests/coach-travel-edge.test.ts` | three career hashes re-frozen, **per-key diff taken first** | none |
| `tests/endings-bench.test.ts` | the fork cell PRESETS[3] → PRESETS[0], re-swept over ten seeds | none |
| `docs/specs/acceptance-cuts-corrected-2026-08.md` | this file | none |

**No new tool.** The measurements are `tools/acceptance-cuts.ts` (the audit's own, unchanged) and
`tools/ladder-baseline.ts` (P0's frozen battery, unchanged) – which is the property P0 was built for.

**Schema is unmoved: v49, no migration, no fixture. Nothing here persists, and no MAIN draw moves** –
an acceptance cut is a post-draw gate, so the frozen capture (41550 / `e6b0c709`) is untouched and no
pin in `tests/condition.test.ts` needed a paragraph this time. ⚠ **That is a measured claim, not an
assumption**: `rngMain` is byte-identical on all three frozen careers after 156 weeks (§5 c2).

**The gate this agent ran:** `npm run test:quiet` **green in 227s** (2,827 tests in the bulk group plus
nine further groups), `npm run test:component` **green, 426 tests / 37 files**, and `vue-tsc -b --force`
**clean**. ⚠ `npm run e2e:fixtures` and `npm run test:e2e` were deliberately NOT run – the wave
regenerates the e2e corpus once at the end.

---

## 8. WHAT THE NEXT PHASE MUST NOT READ OFF THIS

* **P4 must not quote `acceptance-cuts-2026-08.md` §5 as settled.** Its conclusion – a more realistic
  ladder makes the college ending *rarer* – measured the opposite sign on this population (§4e). The
  fork is open in 96% of careers at nineteen and in 8% a full season later.
* **The chain's own verdict is horizon-dependent and both halves must travel together.** To twenty it
  is a cost; to 26.6 it is a delay that is repaid with interest (§4d). Quoting either alone
  misrepresents it – which is exactly the error this phase was ordered to catch in the audit.
* **Two of the four links carry no evidence.** W100's 240 and WTA 125's 180 are placed. If a real
  acceptance list for either is ever found, they should move to it, and §6.2's inversion may resolve
  itself.
* **The junior ranking is now load-bearing for professional access** (§3a). Any future change to a
  junior rung's door is also a change to when she reaches the professional tour, and must be measured
  as one.
