---
type: spec
status: draft
area: life
canonical: false
last-reviewed: 2026-09-18
---

# The wedding – what the drafted constants produce (wave 7, v83)

Invariant 5's record for `ECONOMY.wedding` (wave-7 brief §2 T8): every constant in the block shipped
at its DRAFTED value, unruled, and this document is the measurement his rulings land on. The bench is
`tools/wedding-bench.ts` (`npm run bench:wedding`); every measured number below names the run it came
from. **§2 was written before the bench's first run** – the predictions are arithmetic from the
constants, not descriptions of output – and §3 is the run. Where they disagree, §4 names a suspect
and nothing is retuned: constants move only on the owner's word.

The constants under measurement, all drafted 18.09 (src/engine/economy.ts, `ECONOMY.wedding`):

| constant | drafted | whose draft |
| --- | ---: | --- |
| `ageGate` | 23 | ⚠ RULED 11.09 – not a draft, not measured, not movable here |
| `minEpisodeWeeks` | 52 | the brief's |
| `perWeek` | 0.006 | ⚠ the previous builder's own – the one number the brief did not draft |
| `blessBond / distanceBond / opposeBond` | +2.5 / −1 / −4 | the brief's |
| `weeksAfterEngagement` | 8 | the brief's |
| `costCents` | 1 200 000 ($12,000) | the brief's – ⚠ RULED OUT 18.09 while this spec was being measured («я думаю как с подарками, никто и нисколько»); the mechanic's removal is a follow-up task, and §3c below is the record of what the drafted cost weighed on the tree that still carried it |
| `latchEndFactor` | 0.15 | the brief's |
| `spouseViewCooldownWeeks` | 10 | the brief's |
| `spouseViewSpendCents` | 250 000 ($2,500) | the previous builder's own |
| `spouseViewHear/Level/BrushBond` | +1 / −0.5 / −1.5 | the previous builder's own, inside the brief's ±0.5..±1.5 |

## §1 The model, in prose

She decides; the hazard is the deciding. From the week she turns 23 (`kidAgeExact`, the ruled gate),
on any week the slot holds an episode at least 52 weeks deep whose `'engaged'` receipt has not been
written, one uniform on `seed:life:wedding:<week>` is compared to `perWeek` = 0.006. The beat blocks
the week, the parent answers one of three priced words (bond and nothing else), and the wedding
lands 8 weeks later ON ANY ANSWER – unless the ordinary ending hazard kills the episode inside those
8 weeks, in which case the receipt stays spent and no latch is written (builder 1's deviation #5;
§3e measures its frequency). Landing writes `latchedWeek`, one $12,000 ledger event through the
family wallet (⚠ as measured – the charge was RULED OUT on 18.09 and leaves in a follow-up task;
§3c and §5), and from then on the episode's ending hazard is wave-4's product × 0.15. While the
latch lives, the spouse speaks at most once per 10 weeks, only when one of four world-fact occasions
is true, and the occasion pick is the section's only draw.

Nothing above touches MAIN: every draw is a purpose-scoped sub-stream, an ineligible week derives
nothing, and §3g is the wave's mandatory input-independence arm.

## §2 Predicted, before the run – the arithmetic stated

Written 18.09 against the constants and `ECONOMY.life`'s own tables (arrival 2.5%/wk from 18 ×
temperament mult {sunny 1.2, fiery 1.6, quiet 0.6, deep 0.5}; endings 1.2%/wk × {0.6, 1.5, 0.35,
0.9}), before `tools/wedding-bench.ts` existed to run. Assumptions named: episode lengths treated as
exponential (memoryless), the cooldown between episodes ignored against the mean gap, depth
accumulated before 23 taken as roughly cancelling the receipt's truncation.

**(a) The census.** Mean episode length = 1/endHazard: sunny 139 wks, fiery 56, quiet 238, deep 93.
Slot occupancy = length/(length + 1/arrival): sunny 0.81, fiery 0.69, quiet 0.78, deep 0.54.
P(depth ≥ 52 | active) = e^(−52/mean): 0.69, 0.40, 0.80, 0.57. Eligible-week rate per calendar week
= product: sunny 0.56, fiery 0.27, quiet 0.63, deep 0.31. Over the 364 weeks from 23 to 30 that is
E ≈ 204 / 99 / 228 / 112 eligible weeks, and P(latch by 30) = 1 − (1 − 0.006)^E:

| voice | predicted eligible weeks 23→30 | predicted latched by 30 |
| --- | ---: | ---: |
| sunny | ~204 | ~71% |
| fiery | ~99 | ~45% |
| quiet | ~228 | ~75% |
| deep | ~112 | ~49% |
| **population (≈uniform mix)** | | **~60%** |

Against the proposed 45–70% corridor (Q2): the population lands inside it, upper half – and the
per-voice spread STRADDLES it, quiet/sunny predicted above 70 and fiery/deep at the floor. Predicted
median age at the wedding: eligibility roughly uniform over 24–30 for those who latch, so ~26–27.
Both trajectories reach it: the several-short girl needs one episode to survive 52 weeks, which even
fiery's 56-week mean gives about a third of her episodes. Predicted latch share by trajectory:
one-long ≥ several-short, both well above 0 – a 0% in either population is a finding, not a shrug.

**(b) The latch factor.** Unlatched endings per 100 episode-years = hazard × 52 × 100: sunny 37,
fiery 94, quiet 22, deep 56 – population ~50, latch-weighted (the latched population skews to the
voices that latch, i.e. the low hazards) ~30–40. At `latchEndFactor` 0.15 the latched rate is that
× 0.15 ≈ **4–8 per 100 latched-years**; at the neutralised control 1.0 the two rates should be
statistically the SAME number (~30–50), which is what proves the wiring rather than the story.

**(c) The cost.** Not derivable from constants – the prediction is coarse and says so: at a latch
week in her mid-twenties a wealthy family (120k start, high/elite coach paid all career) should hold
$100k+, so median share < 10% and the >20% share near zero; a working family lives near its reserve,
so median share 20–60% and the >20% share 40–80%; middle between. Confidence low; the measurement is
the point (Q1 rides it).

**(d) The bond trajectory under the drain.** The bench's answer mix is degenerate by construction –
every `'engaged'` drains at `distance` (−1), spouse-view rows are soft and never drained – so the
predicted medians are flat: bond ~66–70 at engagement, at the wedding, and one season later, the
−1s healing at `bond.regress` toward 70. The deltas' corridor (+2.5/−1/−4, ±0.5..±1.5) is therefore
2–6% of the live scale; the trajectory is printed so that scale is visible, not to test a corridor.

**(e) The engagement-cancel rate.** During the 8 weeks the episode is NOT yet latched, so it dies at
the full ending hazard: 1 − (1 − h)^8 per voice = sunny 5.6%, fiery 13.5%, quiet 3.3%, deep 8.3% –
latch-population-weighted **~5–7% of engagements cancelled**.

**(f) The spouse-view realised rate.** Ceiling 5.2/latched-year (the cooldown). The occasions:
`distant-swing` is true on most weeks holding a committed international entry (at 24+ her calendar
is the W/WTA rungs); `road-stretch` on any busy stretch; `no-vacation` one week a season and the
player policy books a family week most years, so rarely; `money` needs her account above the
family's AND a ≥$2,500 category week. Predicted realised **~3.5–5 per latched season**, i.e. near
the ceiling – CHATTY rather than quiet, and if measured so, the missing hazard constant (builder 2
shipped deterministic occasions) is the named suspect, for the owner to rule on.

**(g) Input-independence.** Predicted IDENTICAL by construction: every answer the two arms differ on
moves `bond` and nothing else (§4a.2's law), and bond reaches no MAIN draw and no season mechanism.
Any weekly divergence in `rngMain` or the season results is a P0 finding that stops the wave.

## §3 Measured – the runs

Shipped arm: `npx vite-node tools/wedding-bench.ts` (18.09, 168 careers, 912 weeks each, policy
`player`, exit 0, ~25 minutes with the K5 rerun sharing the machine – the bench alone is ~15).
Control arm for (b): the same command after reverse-editing `latchEndFactor: 0.15 -> 1` in
`src/engine/economy.ts`, restored to 0.15 immediately after the run; each log's header prints the
live value, so the two runs self-describe. The walk's drain skew is stated arithmetic:
`drained 1534: fork-opinion 167 x 0 · met 684 x 0 · fork-counsel 16 x 0 · ended 567 x -1 ·
engaged 100 x -1 = bond skew -667` over 168 careers.

**(g) Input-independence – the verdict first.** ✅ IDENTICAL over 912 weeks: the neutral-drain walk
and the eager-different-answers walk (different priced options at every blocking beat, every soft
row answered, a different birthday gift) agree byte for byte on `rngMain` position and register,
funds, condition, and every season wrap's points/rank. The law holds on this tree.

**(a) The census.**

| reading | measured |
| --- | ---: |
| latched by 30 | **86/168 = 51.2%** |
| ever latched in the walk | 88 careers (89 weddings – one career married twice, the second-wedding machinery live) |
| median age at the wedding | **26.3** (min 23.2, max 30.6) |
| eligible weeks per career | median 62, p10 7, p90 174 (post-tick count, truncated by each engagement's receipt) |

Per voice: sunny 52.3% (44 girls) · fiery 40.0% (35) · quiet **73.8%** (42) · deep 38.3% (47);
median eligible weeks 75 / 60 / 93 / 37.

The trajectory split (classifier as stated in §2/the bench: pre-23 episode-weeks, one-long =
longest span ≥ 60% of them):

| trajectory | girls | latched by 30 | median episodes |
| --- | ---: | ---: | ---: |
| one-long | 113 | **56.6%** | 3.0 |
| several-short | 53 | **41.5%** | 6.0 |
| quiet-before-23 | 2 | 0/2 | 0 |

⭐ **Both trajectories marry** – the brief's hard requirement holds; no population sits at 0% (the
two-career quiet-before-23 bucket is a sample, not a wall – nothing gates on the pre-23 past).

**(b) The latch factor.**

| arm | population | endings | episode-years | per 100 yrs |
| --- | --- | ---: | ---: | ---: |
| shipped 0.15 | latched | 22 | 356.5 | **6.2** |
| shipped 0.15 | unlatched | 545 | 1092.2 | **49.9** |
| control 1.0 | latched | 71 | 201.6 | **35.2** |
| control 1.0 | unlatched | 573 | 1152.2 | **49.7** |

The control arm's own provenance, checked rather than assumed: its log header prints
`latchEndFactor THIS RUN: 1 <- NEUTRALISED CONTROL ARM (reverse edit)` (the bench reads the live
constant, so the arm provably contains the change); its (g) arm read IDENTICAL too; and the change
is VISIBLE downstream exactly where it should be – ended latches free the slot, so the control
corpus holds 98 weddings on the same 88 careers (second weddings) against the shipped 89, while
`latched by 30` stays 86/168 (the factor touches nothing before the first latch). The constant was
restored to 0.15 immediately after the run.

**(c) The cost – ⚠ RULED OUT 18.09, and the table below is a RECORD, not a proposal.** His word,
while this measurement was running: **«я думаю как с подарками, никто и нисколько»** – like the
gifts, nobody pays and nothing. The `costCents` charge and its ledger event are to be REMOVED by a
follow-up task; the numbers stand as the measurement of what the drafted $12,000 weighed on the
tree that still carried it (18.09's shipped run), and as the argument the ruling closed – see §4.3.
Weddings per preset: working 26, middle 28, wealthy 35.

| preset | median share of liquid funds | weddings costing >20% of funds | wallet ≤ 0 at the week |
| --- | ---: | ---: | ---: |
| working (8k) | 0.2% | 0/26 | 0 |
| middle (25k) | 0.3% | 0/28 | 0 |
| wealthy (120k) | 0.2% | 0/35 | 0 |

**(d) The bond trajectory.** Median bond at engagement 69.5 (n 100), at the wedding 70.5 (n 89),
one season later 70.5 (n 86) – flat at the regression target, p10–p90 inside ±1.5 everywhere. The
drafted deltas (+2.5/−1/−4; ±0.5..±1.5) are 2–6% of this live scale, and a single answer's mark has
healed within the season (`bond.regress`).

**(e) The engagement-cancel rate.** 100 engagements: **89 landed, 10 CANCELLED (10.0%)**, 1 still
inside its 8 weeks at walk end. One engagement in ten never becomes a wedding, through the ordinary
ending hazard alone – deviation #5's measured frequency.

**(f) The spouse-view realised rate.** 1,829 beats over 356.5 latched seasons = **5.13 per latched
season against the cooldown ceiling of 5.2** – the surface is SATURATED: the card fires at nearly
every cooldown expiry. The mix: road-stretch 35.6% · distant-swing 33.5% · money 30.9% ·
**no-vacation 0.0%**.

The walk's own denominator: 155/168 careers reached the 912-week end (12 injury, 1 bankruptcy),
median final age 31.1.

## §4 Deltas, and what they mean

1. **The census landed INSIDE the 45–70 corridor at 51.2%** (predicted ~60%): the population
   number needs no retune to satisfy Q2's proposed corridor. The per-voice spread is real and wide
   – quiet 73.8% against deep 38.3% – which §2 predicted in direction (episode LENGTH dominates)
   though not in every rank: sunny measured 52.3% against ~71% predicted. The named suspect for
   the per-voice miss is §2's own occupancy model, not the engine: it ignored the cooldown between
   episodes and the receipt's truncation, both of which bite the long-episode voices hardest –
   visible in the measured eligible weeks (median 62 against the model's 99–228, p90 174). The
   hazard arithmetic itself is confirmed where the model was honest: median wedding age 26.3 sits
   in the predicted 26–27, and 1 − 0.994^62 ≈ 31% per median career with the spread up to p90 174
   ≈ 65% brackets the measured 51.2%.
2. **The latch factor does exactly what it says, and the control proves the wiring.** Shipped: 6.2
   vs 49.9 endings per 100 episode-years – a x8 steadying. Neutralised to 1.0, the latched rate
   rises to **35.2** while the unlatched rate stays put (49.7 vs 49.9), and 35.2 is §2's own
   predicted 30–40: the latched population's base rate, lower than the general 50 because the
   voices that latch most (quiet, sunny) are the voices whose episodes end least. 6.2/35.2 = 0.176
   against the constant's 0.15 is sampling on 22 endings. The divorce door stays real and rare:
   22 latched endings in the shipped corpus, every one through wave-4's untouched machinery.
3. **⚠ The cost corridor DOES NOT EXIST at the drafted price – a corridor miss whose argument the
   owner's ruling closed the same day.** §2 predicted the $12,000 as a real event for a working
   family (20–60% of funds); measured, the median wedding costs **0.2–0.3% of liquid funds in
   every preset**, zero weddings over the 20% line, because by 26 a WTA career under the `player`
   policy has made every background rich – the wallet at the median wedding is ~$4–6M of prize
   money, and the birth preset's 8k/25k/120k is noise against it. The suspect was never the
   constant but the QUESTION: at wedding age there is no poor family in this population, so no
   price in this order of magnitude can produce a felt cost. **RULED 18.09, with these numbers on
   the table: «я думаю как с подарками, никто и нисколько»** – the wedding follows the gifts'
   doctrine, nobody pays and nothing; the charge and its ledger event leave the engine in a
   follow-up task. Nothing was moved in this pass; the measurement stands as the record.
4. **The spouse surface is CHATTY, as flagged**: 5.13 of a possible 5.2 per latched season – the
   deterministic occasions saturate the cooldown, and the mix never once includes `no-vacation`
   (the bench's `player` policy books a family week every season, so that occasion cannot arise on
   this arm – an instrument bound, stated). Whether ~5 spousal words a season is the right cadence
   is Q4's neighbouring wording-free question for the owner; the drafted shape (facts fire, no
   hazard constant) is builder 2's and this is its measured consequence.
5. **The cancel rate is 10%** against §2's 5–7%: engagements skew toward the voices that latch
   less cleanly than the model assumed (fiery engagements die at 1−(1−0.018)^8 ≈ 13.5% each). One
   in ten is a real story beat arriving for free; the wave's deviation #5 ships with a measured
   frequency rather than a guess.
6. **(g) held**, which is the only line that was allowed to stop the wave, and did not.

## §5 The questions – one ruled with the numbers on the table, two still open

**The price and who pays – RULED 18.09.** Drafted $12,000 through the family wallet; measured at
0.2–0.3% of liquid funds, 0 of 89 weddings over 20%, in every wealth preset (§3c, §4.3). His
ruling, verbatim: **«я думаю как с подарками, никто и нисколько»** – the wedding follows the
gifts' doctrine (spec §0 of the birthday: no charge, no affordability test, the record row is the
point). The charge and its ledger event are removed by a follow-up task; §3c stays as the dated
record. On the same 18.09 pass he confirmed the wave's other §3 shapes as built – no second
tracked number for the spouse, W1+W2 as one wave, the own-key beat.

**The census corridor – open, with the number beside it.** Proposed 45–70%; measured **51.2%
latched by 30** at the drafted `perWeek` 0.006 and `minEpisodeWeeks` 52, median wedding age 26.3,
both trajectories marrying (56.6% / 41.5%). The drafted constants land inside his proposed
corridor as they stand; the per-voice spread (38–74%) is the number to rule on if he wants the
corridor to bind per voice rather than per population.

**The three answers' deltas – open, with the scale beside them.** Drafted +2.5/−1/−4. Measured:
bond lives at 69.5–70.5 through the whole arc under the drain, so a single answer is 2–6% of the
live scale and regresses away within the season. If he wants the wedding answer to be REMEMBERED
mechanically, the deltas need an order of magnitude or a slower regress – as drafted they are
texture (which may be exactly the intent; the spouse-view deltas ±0.5..±1.5 read the same way).

*(The name pool stays a T7 review item and carries no number here.)*
