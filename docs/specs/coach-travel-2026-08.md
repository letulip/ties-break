---
type: specification
status: draft
area: simulation-and-balance
canonical: false
last-reviewed: 2026-08-15
---

# The coach who travels – the three cancelled arms, re-measured

**MEASUREMENT ONLY. No engine line is touched, no constant is decided, no fixture is written.**
Everything below is `tools/coach-travel-bench.ts` (patch-and-restore over existing knobs) plus two
runs of `tools/draw-vs-band.ts` on the owner's own saves.

**Why it is needed now:** the presence mechanic being built in round-21 #2 charges a second seat, puts
him in the diary and on screen T, and gives her **nothing** – it is, as it stands, exactly the «tax,
not a decision» the 30.07 boolean was killed for. The owner's «бонус какой-то тоже нужен, я считаю. А
может и не один даже» is the question this document answers with numbers instead of a guess.

## 0. Why a cancelled mechanic is being measured again

`docs/decisions.md` carries **«Do NOT build a "he contributes differently at a tournament"
mechanic»**, on the strength of three arms built and measured on 30.07 (commit `77e08aa`). The owner
overruled that on 15.08, and his reason is the brief:

> «прибавка к силе матча сделала элитные результаты ХУЖЕ – это на старых измерениях? мы построили
> новый стенд, надо актуализировать данные.»

**He is right that the verdict is stale, and the reason is worse than "the bench changed".** All
three arms were measured on the OLD bench policy – the one `the-wall-2026-08.md` §6-§7 later proved
never got anybody ranked, because an absolute $5,000 reserve permanently refused the trips that pay
and permanently allowed the ones that do not. Task #89 records that **every absolute economy verdict
from that bench is suspect**. Two further things changed after 30.07: the Slam draw is 128 and the
WTA 1000 is 64, and a first-round loss at either now pays the rulebook's **10** instead of 130/65.

So the 30.07 numbers describe a world that no longer exists, measured through a player who could not
play. Re-measuring is correct. What follows is what the rebuilt bench says.

## 1. The measurement, pre-registered

`tools/coach-travel-bench.ts`, `POLICIES[1]` (the rebuilt parent), 30 seeds, full 14→39 careers,
fork answered `continue`, retirement refused, bankruptcy NOT defused. **Every arm shares every seed,
world and talent draw** – `openCareer` keys the world on `bench-<background>-<index>` – so the only
difference between an arm and its control is the knob.

Two cells: `wealthy · elite` (the cell the cancelled record's headline is about) and
`middle · middle` (so the verdict is not a fact about one corner of the wealth corridor).

| arm | knob patched | size, and why that size |
| --- | --- | --- |
| `ctl` | – | the shipped game |
| `a1-cost` | `TIERS[t].travelCostCents` **×2** on the 13 rungs above `local/regional/national` | the owner's own price, `the-wall-2026-08.md` §L1: «a per-tournament top-up when the coach travels with her, **at double the travel cost**». The 30.07 fare was reverted uncommitted and is not recoverable from git |
| `a1-gain` | `ECONOMY.coach.developmentFactor[tier]` +0.04 | ⚠ **the CEILING, not the size** – a full rung of the ladder (`high`→`elite` is +0.04) applied to EVERY week of her life, where he only travels on ~a third of them. If the ceiling buys nothing, no honest size can |
| `a1-both` | both | the boolean as it was built on 30.07 |
| `a2-ceiling` | `runFatigueLadder` and `runFatigueLadderWta` zeroed | the absolute most a "cheaper ladder" could ever hand back (see §2) |
| `a3-small` | the cell's `COACH_EDGE_CORRIDOR_PP` shifted +0.5 pp | about one rung of the coach ladder |
| `a3-big` | shifted +3.0 pp | the middle of the cancelled arm's own 2.8–5.0 band |

The corridor is **shifted, never widened**, so the man's uniform position inside his bracket is
preserved: the same seed hires the same coach and only his number moves.

⚠⚠ **THE FIRST FULL RUN WAS THROWN AWAY AND THE REASON BELONGS ON THE RECORD.** It was run in the
shared checkout while another agent was building the presence mechanic in it, and that agent's
uncommitted `chargeCoachTravel` was already wired into `tickWeek`. `POLICIES[1]` sets
`coachOnEventWeeks: true`, so **the control arm was already paying a doubled fare on every trip** and
`a1-cost` was stacking a second fare on top of it. Worse than a wrong control: a working tree that
can change *between* arms breaks the one guarantee the whole design rests on. The numbers below are
from `git worktree add --detach ../tb-coach-travel HEAD` (`5c3a6cc`), where the engine is the
committed game and cannot move under the run.

⚠ **One distortion in `a1-cost`, stated rather than hidden.** The fare rides on the event's own
travel line, so the academy scholarship and a kit deal's travel share discount the coach's seat too.
The alternative – debiting `fundsCents` directly – hides the bill from the policy's R1 reserve and R6
coach review entirely, which understates the cost. The ledger route was chosen for that reason.

## 2. ⚠ ARM 2 IS REFUSED BY ARITHMETIC, BEFORE ANY CAREER RUNS

The brief asked for this derivation first, because the ladder changed on 14.08. Here it is.

A run's condition toll is `Σ (matchDrain + runFatigueExtra)`. `matchDrain` = scoreline 2–4
(`straightSets 2`, `hardMatch 3`, `extraTiebreaks +1`) plus the rung's `tierMatchFatigue`. The
*ladder* is the second term only, and it is what a travelling coach was supposed to discount.

| rung family | ladder | matches in a title run | **ladder over the whole run** | run toll | ladder's share |
| --- | --- | --- | --- | --- | --- |
| domestic / junior | `[0,1,1,2,2]` | 5 | **+6** | 31–41 | 15–19% |
| W family, 32-draw | `[0,1,1,1,1]` | 5 | **+4** | 29–39 | 10–14% |
| **WTA 1000 (64-draw)** | `[-2,-1,0]` | 6 | **−3** | 39–51 | −6% |
| **Grand Slam (128-draw)** | `[-2,-1,0]` | 7 | **−3** | 46–60 | −5% |

**On the two rungs an elite career is decided on the ladder is ALREADY a discount.** There is
nothing for a coach to discount. A "cheaper ladder when he is there" can only ever pay out on the
rungs she has outgrown – and the most it can pay there is **6 condition points on a junior run and 4
on a W one, against a `recoveryBase` of 8 a week**. The entire mechanic, at its ceiling, is worth
less than one week of sitting still.

**So the arm is smaller now than on 30.07, not larger.** That record says it «moved 2 condition
points out of ~36, because the whole ladder is 6 points». Today the W family's ladder is 4, and the
two biggest rungs run negative. It is run ONCE, at its ceiling, and not swept: a dose sweep inside a
4-point envelope is a pointless sweep.

### 2a. ⚠ AND THE COLUMN ABOVE IS THE TITLE RUN – WHAT SHE IS ACTUALLY CHARGED IS NEARLY ZERO

`runFatigueExtra` is indexed by **match-within-run**, and a first match always costs 0. So the table
above prices a run to the trophy, which is not the week the mechanic was meant to rescue:

| how far she got | ladder charged, W 32-draw | ladder charged, Slam / 1000 |
| --- | --- | --- |
| lost the opener | **0** | **−2** |
| won one, lost the next | **1** | **−3** |
| reached the quarters | 2 | −3 |
| won the title | 4 | −3 |

`tools/draw-vs-band.ts` (§4) measures the owner's own #106 girl exiting at the first hurdle in
**62.5%** of wta500 draws and 54.2% of WTA 1000 draws. **For the player this bonus was designed for,
a "cheaper run-fatigue ladder when the coach travels" is worth zero to one condition point a
tournament, and at a Slam or a 1000 she is already being handed two or three.** There is no version
of arm 2 that is worth building. That is the finding, and it is a finding rather than a failure.

*(The `a2-ceiling` arm deliberately leaves `runFatigueLadderDeep` alone. Zeroing it would make the
arm a PENALTY of 3 points on the Slam and the 1000 – measuring the opposite of the mechanic.)*

⚠ **AND ARM 2 IS THE ONE ARM THAT CANNOT BE SCOPED TO HER, WHICH IS WHY THE ARITHMETIC IS THE
VERDICT AND THE RUN IS ONLY A CROSS-CHECK.** `runFatigueExtra` is deliberately shared with the rival
cohort – «the ladder must apply to BOTH sides or a deep run would grind only the player»
(`engine/condition.ts`) – so a bench patch makes the whole WORLD fresher rather than her. It
therefore UNDER-states a kid-only discount. Scoping it to her needs an engine hook, and this
measurement ships none. The bound above does not depend on who else gets it, so nothing is lost.

## 3. Measured – the three arms on the rebuilt bench

### 3a. ⚠ ARM 1's COST IS NOT A TAX ANY MORE. IT IS A CAREER-ENDER, AND IT ENDS THEM AT SIXTEEN.

`wealthy · elite` – **the richest cell in the game**, 30 careers, 14→39:

| arm | best rank p50 | top-100 | ranked | prize p50 | end funds p50 | peak skill | matches won | **bankrupt** |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| control | **#96.5** | **53.3%** | 100% | $1,804,325 | $1,661,047 | 306.5 | 635.7 | **0/30** |
| `a1-cost` (fare only) | #114 | **26.7%** | **73.3%** | $921,995 | $144,831 | 298.4 | 431.7 | **8/30** |
| `a1-gain` (skill, ceiling) | **#87** | 56.7% | 100% | $1,757,260 | $1,742,986 | 307.0 | 639.1 | 0/30 |

Paired on the same seed (Δ rank negative = better; b/w/t on best rank):

| arm | Δbest rank | b/w/t | Δwins | Δpeak skill | Δprize | Δfunds | **Δtravel** | Δspend |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `a1-cost` | **+37.2** | 4/**21**/5 | **−203.9** | −8.14 | −$658,395 | −$1,373,433 | **+$995,979** | +$468,768 |
| `a1-gain` | −4.2 | 16/10/4 | +3.4 | **+0.47** | +$61,555 | +$36,198 | +$14,146 | +$25,495 |

**Read the bankruptcy ages before anything else: 16, 16, 16, 16, 16, 17, 17, 18.** Every one of them
lands in the junior years. That is the owner's own 30.07 sentence arriving as a number – «JUNIOR
TENNIS HAS NO PRIZE MONEY … a fare can only be a decision if something might come back» – and the
rebuilt bench says it far more loudly than the old one could, because the old bench player was too
poor to enter anything in the first place. The 30.07 record priced the boolean at **+$21,000**; on a
career that is actually played it is **+$995,979**, and it takes the top-100 rate from 53.3% to 26.7%
and unranks a quarter of the careers *of the wealthiest family in the game*.

⚠ **THIS IS A LIVE WARNING ABOUT THE MECHANIC BEING BUILT RIGHT NOW.** `chargeCoachTravel` is gated
only on `coachTravelsWithHer` = «a coach is hired and the switch is on». There is no age gate and no
rung floor, so it charges the second seat on a `local` at fourteen exactly as on a Slam at
twenty-six. This arm is that mechanic, and this is what it does.

**The other half is real but small.** The development ceiling – a full rung of
`developmentFactor`, every week of her life, which is roughly three times an honest event-week-only
bonus (she plays ~414 of her 1300 weeks) – buys **+0.47 peak skill points** and about four rank
places, winning 16 of 30 pairings. The 30.07 record's «+0.6 skill points» reproduces almost exactly.
It does not come close to paying for the fare: **+$61,555 of prize against +$995,979 of fare.**

**And the boolean, both halves together, is worse than the cost alone** – #118 best, 23.3% top-100,
8/30 bankrupt, 25 of 30 pairings worse. The skill it buys is spent on entering more, which the family
then cannot afford. «A tax, not a decision» was right, and it was an understatement.

### 3b. ARM 2, AT ITS CEILING, MOVES NOTHING – exactly as §2 said it could not

`wealthy · elite`, both positive ladders zeroed for the whole world:

| | Δbest rank | b/w/t | Δwins | Δpeak skill | Δprize |
| --- | --- | --- | --- | --- | --- |
| `a2-ceiling` | **−0.9** | 15/13/2 | +9.3 | **+0.02** | −$23,990 |

**Fifteen careers better, thirteen worse, two tied is a coin.** This is the absolute maximum the
mechanic could ever be worth – the entire cumulative ladder deleted, not discounted – and it is
indistinguishable from noise. The arithmetic in §2 predicted it and the careers confirm it. **Arm 2
is dead at every size, and no version of it should be built.**

### 3c. ⚠⚠ ARM 3 DOES NOT MAKE ELITE RESULTS WORSE. IT MAKES THEM BETTER, AND MORE THE BIGGER IT IS.

This is the number the owner asked for.

| arm | best rank p50 | top-100 | prize p50 | end funds p50 | matches won | Δbest rank | **b/w/t** |
| --- | --- | --- | --- | --- | --- | --- | --- |
| control | #96.5 | 53.3% | $1,804,325 | $1,661,047 | 635.7 | – | – |
| `a3-small` (+0.5 pp) | **#76** | 60.0% | $2,185,715 | $2,116,828 | 627.0 | **−5.0** | 14/10/6 |
| `a3-big` (+3.0 pp) | **#69.5** | **63.3%** | **$2,445,050** | **$2,717,588** | 659.9 | **−14.5** | **22/8/0** |

**The 30.07 verdict is reversed, at the same dose, on the same cell.** That record reads «12.7 wins →
5.8, rank 90.7 → 103.6»; the rebuilt bench, at the middle of the same 2.8–5.0 pp band, reads
**+24.2 matches won and −14.5 rank places, better in 22 of 30 paired careers and worse in 8, with no
ties.** It is also the only arm in the whole table that pays for itself: +$546,395 of prize money
against +$56,189 of extra travel.

**And the promotion loop of §4 is visibly running – it has simply stopped being a loss.** `a3-big`
enters the four big rungs 4539 times against the control's 3679 and arrives ranked **#113 against
#139**, i.e. the bonus does promote her, exactly as suspected. What changed is the conversion: her
opener-loss share at those rungs **falls** (56.4% → 53.7%) and her ranking points per entry **rise**
(36.1 → 41.5). On the old bench she was promoted into draws she could not compete in, and the
promotion was pure loss. On a bench where the career is actually funded and played, she is strong
enough for the rung she is promoted to, and the same loop pays.

### 3d. The second cell – `middle · middle`, where the fare is not survivable at all

30 careers, same seeds, same arms:

| arm | best p50 | top-100 | **ranked** | prize p50 | end funds p50 | Δbest rank | b/w/t | **bankrupt** |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| control | #115 | 26.7% | 96.7% | $1,143,270 | $1,060,175 | – | – | 0/30 |
| `a1-cost` | #131 | 16.7% | **46.7%** | **$0** | **$17** | +43.8 | 3/**25**/2 | **15/30** |
| `a1-gain` | #111.5 | 33.3% | 100% | $1,206,860 | $1,120,423 | **−8.2** | 18/7/5 | 0/30 |
| `a1-both` | #114 | 20.0% | 50.0% | $11,835 | $5,891 | +12.6 | 7/21/2 | **14/30** |
| `a2-ceiling` | #118 | 33.3% | 96.7% | $1,174,045 | $1,072,954 | −3.9 | **14/14**/2 | 0/30 |
| `a3-small` | #116 | 33.3% | 100% | $1,128,105 | $1,081,074 | +9.1 | 15/10/5 | 0/30 |
| `a3-big` | **#104.5** | **46.7%** | 100% | **$1,371,305** | **$1,345,570** | **−19.3** | **25/5/0** | 0/30 |

**Half the cell goes bankrupt on the fare alone**, its median career banks **$0 of prize money in
twenty-five years**, and only 46.7% of careers ever hold a ranking. `a1-cost`'s Δtravel is *negative*
here (−$884,743) and that is not a bug – she plays so much less that her total travel bill falls even
at double the price. The mechanic does not tax the career; it deletes it.

Everything else replicates. `a2-ceiling` is **14 better / 14 worse / 2 tied** – a coin, on the second
cell as on the first. `a3-big` is **25/5/0** and takes top-100 from 26.7% to 46.7%.

**⚠ ONE HONEST DISAGREEMENT, REPORTED RATHER THAN SMOOTHED: the SMALL edge is inside the noise.**
`a3-small` reads Δ−5.0 at elite and Δ**+9.1** at middle – opposite signs on the mean. Its paired
counts agree in direction (14/10/6 and 15/10/5, so 29 of 60 pairings better against 20 worse) but the
mean rank delta is dominated by a handful of outlier careers. **+0.5 pp is not enough to be sure of;
+3.0 pp is: 47 better, 13 worse, 0 tied over 60 paired careers, on both cells.**

## 4. The confound behind «elite results got WORSE» – found, and it is not the bonus

The brief's suspicion was right and its first guess was wrong. It is not the entrant band. It is
**promotion**, and `tools/draw-vs-band.ts` prices it exactly.

One run on the owner's Naomi (week 621, wta #106, her core 61.6, condition held at 95, 12 future
year-blocks of her own calendar = 48–120 real draws per rung):

| rung | accepts | BAND mean core | **DRAW mean core** | of her DRAW stronger than her | seeded in | R1 win% | **ranking points per entry** |
| --- | --- | --- | --- | --- | --- | --- | --- |
| w100 | top 350 | 41.8 | 49.6 | **0.1%** | **100%** | 89.6% | **61.1** |
| wta125 | top 250 | 44.9 | 53.7 | 9.6% | 20.8% | 93.8% | **55.0** |
| wta250 | top 200 | 48.1 | 63.6 | 69.4% | 11.5% | 53.1% | **43.0** |
| wta500 | top 120 | 49.5 | 69.4 | **100.0%** | 0.0% | 37.5% | 48.6 |
| wta1000 | top 65 | 51.1 | 68.3 | 88.9% | 0.0% | 45.8% | 66.9 |
| slam | top 104 | 52.7 | 63.0 | 59.6% | 0.0% | 52.1% | 52.3 |

**Three readings, in order of how much they explain.**

1. **The band is not the draw, and the gap widens as she climbs.** The BAND's mean core rises gently
   across the professional ladder – 41.8 → 52.7, about eleven points over five rungs. The DRAW's
   rises nearly twice as fast, 49.6 → 69.4, because `selectEntrants` fills from the TOP of the band.
   At wta500 **every single one of the other 31 in her draw is stronger than she is.**
2. **Ranking points per entry FALL as she is promoted.** 61.1 at w100 against 43.0 at wta250 – she
   banks *more* ranking by staying on the rung she has outgrown. The prize money moves the other way
   ($8,750 → $116,417), so the two currencies disagree, and rank is the one every door in the game
   reads.
3. **Promotion strips the seeding.** Seeded in 100% of w100 draws, 0% from wta500 upward.

**AND IT REPLICATES ON A SECOND, INDEPENDENT SAVE** – Olivia (week 464, wta **#33**, core 51.4), a
better-ranked girl with a weaker build, so the two saves are not the same career told twice:

| rung | BAND mean core | DRAW mean core | of her DRAW stronger | seeded in | **points per entry** |
| --- | --- | --- | --- | --- | --- |
| w100 | 41.7 | 51.1 | 37.0% | 100% | **37.6** |
| wta125 | 44.9 | 55.3 | 73.9% | 100% | **28.4** |
| wta250 | 48.1 | 63.4 | 87.7% | 100% | **27.8** |
| wta500 | 49.6 | 70.6 | **100.0%** | 0% | **15.6** |
| wta1000 | 51.4 | 68.9 | 98.2% | 0% | 29.5 |
| slam | 53.0 | 63.5 | 82.6% | 0% | 38.5 |

Same shape, sharper: the band's core rises 11.3 points across the ladder and the draw's rises 19.5;
100% of her wta500 draw outranks her here too; and points per entry falls from 37.6 to **15.6**, a
factor of 2.4, for climbing three rungs.

So the mechanism is a loop, and every step of it is a shipped rule: **a strength bonus wins more
matches → her rank improves → the acceptance lists and the policy's own R3 («I'm not paying to enter
tournaments she's too good for») push her up a rung → up there she is unseeded against a draw where
70–100% of the field is better than her, and the rung banks her fewer ranking points than the one
she left.** A bonus can buy tennis and lose ranking at the same time, and «worse from a bonus» needs
no explanation beyond that.

⚠ **This also means the 30.07 arm-3 number cannot be read as evidence about the mechanic at all.** It
was measuring the promotion loop, on a bench player who additionally could not fund the trips.

**And §3c is the other half of the answer: the loop is still running, and it has stopped being a
loss.** `a3-big` promotes her exactly as predicted – 4539 big-rung entries against 3679, arriving at
#113 instead of #139 – but her opener-loss share *falls* and her points per entry *rise*. The
difference is not the bonus; it is that a funded career arrives at the higher rung strong enough for
it. Two saves above show what the trip costs a girl who is not: at wta500 the whole draw outranks
her.

Whether the ladder's middle being a ranking sink is a defect in its own right is a separate question,
a much bigger one, and NOT this document's to answer.

## 5. Verdict – which arm, if any, is worth attaching

**The owner was right and the stale verdict was wrong. Two of the three arms survive, and the third
is dead in a way that cannot be revived.**

### ⭐ ARM 3, THE MATCH-STRENGTH EDGE – BUILD THIS ONE, AND BUILD IT BIG

The single clearest result in the document. At +3.0 pp – the middle of the very band that was
recorded as making elite results worse – the rebuilt bench says **47 careers better, 13 worse, 0
tied, out of 60 paired careers on two cells**, top-100 from 53.3%→63.3% (elite) and 26.7%→46.7%
(middle), and it pays for itself in prize money by an order of magnitude over its travel cost.

**Why the old number said the opposite, in one sentence:** the 30.07 arm was measuring the promotion
loop of §4 on a bench player who could not fund the trips – a bonus made her rank better, a better
rank pushed her up into draws where 70–100% of the field outranked her and the rung banked fewer
points than the one she left, and she had no money to survive the transition. On a funded career the
same loop pays: she enters the big rungs 23% more often, arrives at #113 instead of #139, loses her
opener *less* often and banks *more* points per entry.

⚠ **Size it at the top of the range, not the bottom.** +0.5 pp is inside the noise – its two cells
disagree in sign. The shipped ladder's whole span is 0.2–1.1 pp, so a travel bonus of +3.0 pp is
**about three times the entire coach ladder**, and that is a design decision for the owner rather
than a number this document may set. What is measured is the shape: *the effect grows with the dose
and does not turn over anywhere inside the range tested.*

### ⭐ ARM 1's SKILL HALF – a real second bonus, and small

`a1-gain` is positive on both cells: Δbest rank −4.2 (elite, 16/10/4) and −8.2 (middle, 18/7/5) –
**34 of 60 pairings better against 17 worse** – for +0.3 to +0.5 peak skill points. So the answer to
«а может и не одинЕ» is yes: **there are two.** ⚠ But size it honestly: what was measured is the
CEILING – a full rung of `developmentFactor` applied to every week of her life – and she only plays
~414 of her 1300 weeks, so an event-week-scoped version is roughly a third of it. Expect one to three
rank places, not eight.

### ⛔ ARM 1's FARE – DO NOT SHIP IT UNGATED. THIS IS THE URGENT FINDING.

The presence mechanic in flight charges **double the travel cost** on every trip, gated only on «a
coach is hired and the switch is on» – no age gate, no rung floor. Measured, that is:

| | wealthy · elite | middle · middle |
| --- | --- | --- |
| bankrupt | **8/30** | **15/30** |
| bankruptcy ages | 16,16,16,16,16,17,17,18 | 15,15,15,16,16,16,16,17,17,17,17,17,18,18,19 |
| careers ever ranked | 100% → **73.3%** | 96.7% → **46.7%** |
| top-100 | 53.3% → 26.7% | 26.7% → 16.7% |
| median career prize | $1.80M → $0.92M | $1.14M → **$0** |

**Every bankruptcy is a junior-years bankruptcy**, which is the owner's own 30.07 argument arriving
as data: junior tennis has no prize money, so a fare taken before the professional years can never be
a decision – it is a bill against an income that does not exist yet. The 30.07 record's «+$21,000»
was measured on a bench player who barely travelled; on a career that is actually played the same
mechanic costs **+$995,979** and bankrupts the richest family in the game one time in four.

**This is a warning about a live build, not a comment on a cancelled one.** Nothing here says the
fare is wrong – it says an *ungated* fare is. The obvious gates are the two the game already knows:
the professional years (`w15` and up, where a cheque exists) and the switch's own locked row, which
already says it is waiting for 18+.

### ⛔ ARM 2, THE RUN-FATIGUE DISCOUNT – DEAD AT EVERY SIZE

Refused by arithmetic (§2, §2a) and confirmed by careers (§3b): **15/13/2 and 14/14/2** – two coins.
The ladder over a whole title run is 4–6 condition points on the rungs where it is positive and
**−3** on the Slam and the 1000, and what a first-round loser is actually charged is **zero**. There
is no dose that makes this matter. It should not be attached to the presence mechanic, and the reason
should be written into `docs/decisions.md` so it is not proposed a fourth time.

## 6. Where the headroom actually is, and why this document does not measure it

**Named because the honest answer to «а какой бонус» is not on the list of three.** The fatigue
family was the right instinct and the wrong knob. `ECONOMY.condition.matchWeekRecoveryBase` is **0**:
a competition week returns her *nothing*, against `recoveryBase` 8 on every other week of her life.
That is the owner's own V2 ruling from 25.07 («a tournament week is travel + competition, not rest»)
and it is not in dispute – but it is also, arithmetically, **the biggest single condition line in the
game that a coach could plausibly move**, and it is 20–40× the run-fatigue ladder the 30.07 arm went
after. A girl playing eighteen event weeks a season is handed 0 where a knob of 2 or 4 would hand her
36 or 72 – and unlike a strength bonus it buys FRESHNESS, so it never feeds the promotion loop of §4.

⚠ **AND IT IS NOT MEASURED HERE, DELIBERATELY, BECAUSE IT CANNOT BE.** `matchWeekRecoveryBase` is read
by the rival cohort's own reconstruction (`season/rival.ts`), exactly as the run-fatigue ladder is, so
a bench patch makes the whole world recover on match weeks rather than her. Scoping it to «the weeks
he came» needs an engine hook. **The brief's rule is to say so and stop, and this is that stop.** It
is written down as the first thing to price if the owner wants a second bonus, not as a
recommendation to build one unmeasured.

---

# 7. ⭐ THE DOSE, SETTLED BY THE OWNER AND MEASURED AT HIS SIZE (15.08)

**A NEW SECTION, NOT A REWRITE.** §3c and §5 stand exactly as they were: at +3.0 pp the effect is
real and grows with the dose. What §5 explicitly refused to decide – «that is a design decision for
the owner rather than a number this document may set» – he then decided, and this section is the
measurement of *his* number. The comparison between the two sizes is the point, so both are in the
table below and neither record is overwritten.

## 7.1 The ruling, and what was built

Told that +3.0 pp is about three times the entire coach ladder:

> «что если мы привяжем это как раз к тренерской лестнице? у нас там есть уже верхний процент, будет
> не так сильно влиять как будто.»

**So the travel bonus is HIS OWN EDGE AGAIN.** A coach who comes with her delivers a second helping
of exactly what his tier is worth, and `COACH_EDGE_CORRIDOR_PP` is the whole of the scale – elite
adds 0.9–1.1 pp, budget 0.2–0.7, and at most it doubles what a coach was already worth. No second
constant was added: «верхний процент» is a bound the table already carries, structurally rather than
as a clamp, because the helping *is* his draw from the bracket.

**SCALE, NOT SHIFT, and that is the one real design decision inside his sentence.** §1's rule – each
tier's ceiling is the next tier's midpoint, no tier reaches two rungs up – is a rule about *ratios*.
Doubling preserves it exactly, so the budget lottery survives the trip. The +3.0 pp **shift** §5
recommended does not: it turns 0.2 and 1.1 into 3.2 and 4.1, i.e. it makes every rung nearly the same
coach, which is why that dose could not simply be attached to the switch.

Shipped in `ff72dc5` (`engine/coach.ts`, `engine/world/player.ts`). Zero new randomness: the helping
is the same uniform multiplied – no second draw, no second sub-stream, nothing on MAIN. A career that
does not travel is byte-identical, held as a frozen capture of three 156-week career hashes taken at
the commit before (`tests/coach-travel-edge.test.ts`), mutation-verified: making the doubling inert
turns 7 of its 17 tests red.

## 7.2 Pre-registered prediction

Written into the bench before the run: the helping averages the corridor's own midpoint, so it is
**+1.0 pp at wealthy·elite and +0.7 pp at middle·middle** – between `a3-small` (+0.5 pp, which §3d
already found inconclusive) and `a3-big` (+3.0 pp, decisive), **and much nearer the small one.**
Predicted outcome: a small positive effect, probably not resolvable at n=30.

## 7.3 Measured – the same harness, the same seeds, both cells

`tools/coach-travel-bench.ts` at `2d7d336`, 30 seeds, full 14→39 careers, `POLICIES[1]`, paired on
identical seeds/worlds/talent, run in `git worktree --detach` so the engine cannot move under it. Two
new arms:

| arm | knob | what it is |
| --- | --- | --- |
| `a4-ladder` | the cell's corridor **×2** | the owner's sizing. ⚠ **Exact, not a proxy**: `coachEdgePp` is `lo + u(hi−lo)`, so a `[2lo, 2hi]` corridor returns twice the same man's number on the same `u`; and `POLICIES[1]` sets `coachOnEventWeeks` at birth and never re-hires a rung the preset did not choose, so the doubling applies at exactly the matches the shipped gate would apply it to |
| `a4-off` | the cell's corridor **×0** | ⚠ the OTHER reading of the ruling, priced. «Tie it to the ladder» can also mean the edge becomes *conditional* on his presence – today's edge when he comes, **nothing** when he does not. Every career here travels, so that arm would be the control and its whole effect would land on families who never send him. What it would cost them is the control against a deleted edge, which is this. It is also the **noise floor** for every number above it |

| cell | arm | best rank p50 | top-100 | b / w / t | Δbest rank (95% CI) | sign *p* | Δprize | Δtravel |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **wealthy·elite** | control | #91.5 | 56.7% | – | – | – | – | – |
| | `a4-ladder` ×2 | #95.5 | **50.0%** | 13/16/1 | **+1.1** [−7.3, +9.6] | 0.71 | +$19,465 | +$15,808 |
| | `a3-small` +0.5 | #85 | 56.7% | 14/13/3 | −2.3 [−9.5, +4.8] | 1.00 | −$130 | +$21,121 |
| | `a3-big` +3.0 | #76 | **66.7%** | 14/15/1 | −11.4 [−22.4, −0.3] | 1.00 | +$115,235 | +$50,388 |
| | `a4-off` ×0 | #108 | **46.7%** | 10/18/2 | +7.9 [−3.7, +19.5] | 0.19 | −$48,770 | −$32,011 |
| **middle·middle** | control | #118 | 23.3% | – | – | – | – | – |
| | `a4-ladder` ×2 | #118.5 | **26.7%** | 18/7/5 | **+7.2** [−21.2, +35.5] | 0.05 | +$49,020 | +$41,360 |
| | `a3-small` +0.5 | #124 | 26.7% | 13/13/4 | +11.6 [−16.6, +39.7] | 1.00 | +$2,635 | −$13,752 |
| | `a3-big` +3.0 | #92 | **56.7%** | 24/5/1 | **−20.9** [−29.3, −12.5] | 0.001 | +$231,170 | +$96,097 |
| | `a4-off` ×0 | #118 | 23.3% | 8/20/2 | +4.9 [−0.0, +9.8] | 0.04 | – | – |

Pooled over both cells, 60 paired careers per arm:

| arm | ≈ dose | b / w / t | Δbest rank (95% CI) | sign *p* | verdict |
| --- | --- | --- | --- | --- | --- |
| `a4-off` | **×0 (delete)** | **18/38/4** | **+6.4 [0.0, +12.8]** | **0.011** | **real – and it is the yardstick** |
| `a3-small` | +0.5 pp | 27/26/7 | +4.6 [−9.9, +19.1] | 1.00 | **a coin** |
| `a4-ladder` | +0.7…1.0 pp | **31/23/6** | **+4.1 [−10.4, +18.6]** | **0.34** | **not resolvable** |
| `a3-big` | +3.0 pp | **38/20/2** | **−16.0 [−23.1, −9.0]** | **0.026** | real |

## 7.4 ⛔ THE VERDICT: THE LADDER-TIED DOSE IS INSIDE THE NOISE, AND THAT IS THE RESULT

**Do not ship it as a demonstrated improvement, because it has not been demonstrated.** The mechanic
is built, correct and free of RNG cost, and the shape is the owner's own – but at his size the bench
cannot tell it from nothing, and three unmeasured coach mechanics have already cost this project two
weeks. The evidence, in the order it convinces:

1. **The two cells disagree in sign, on both readings.** Elite: 13 better / 16 worse, top-100
   **56.7% → 50.0%**. Middle: 18 better / 7 worse, top-100 **23.3% → 26.7%**. This is the identical
   failure pattern §3d recorded for `a3-small` and refused to call a result, and it is the reason
   the honest statement is not "a small positive" but **the sign of the effect is not determined.**
2. **Even the mean and the count disagree *inside* the middle cell.** 18/7/5 by paired count, yet
   Δbest rank **+7.2** – worse on the mean – because a handful of careers move a long way. Two
   statistics of the same 30 pairs pointing in opposite directions is what "inside the noise" looks
   like from the inside.
3. **⚠⚠ THE YARDSTICK IS THE PART THAT SETTLES IT, AND IT DOES NOT SAY "THE BENCH IS BLIND".** The
   obvious defence of a null result is that 30 seeds cannot see anything this size – so the same
   size was measured in the *other* direction. `a4-off` deletes the whole shipped edge, and it is
   **resolvable at exactly this n: 18 better / 38 worse / 4 tied, Δ+6.4 rank places, *p* = 0.011.**
   **So the bench CAN see one helping of the edge. It looked for the second helping and did not find
   it.** That is a finding about the mechanic, not about the sample size: the first helping is worth
   ~6 rank places and the second is worth something the same experiment cannot distinguish from
   zero. Diminishing returns is exactly what point 4 predicts.
4. **⚠ THE DOSE-RESPONSE IS NOT A STRAIGHT LINE, AND HIS NUMBER LANDS IN THE FLAT PART OF IT.**
   Removing the edge costs 6.4 rank places (*p* = 0.011). Doubling it buys −4.1 (*p* = 0.34, wrong
   sign). Sextupling it buys 16.0 (*p* = 0.026). **The curve is steep at zero, flat through the
   ladder-tied dose, and steep again by +3.0 pp** – which is a real shape rather than an artefact,
   because point 5 gives the mechanism for it.
5. **The mechanism is §4's promotion loop, and it is why a SMALL bonus is the worst place to stand.**
   `a4-ladder` moves her rank at entry to the big rungs from #136 to #133 and her **points per entry
   DOWN, 37.8 → 36.1**. `a3-big` moves it from #136 to #110 and her points per entry **UP, 37.8 →
   42.9**. A small bonus promotes her just far enough to be outclassed in the bigger draw; a large
   one promotes her *and* makes her strong enough for it. **The dead zone is real and the ladder-tied
   dose sits in it.**

## 7.5 What n would settle it

The observed flip rate is 31/54 = **57.4%**. Resolving that at 80% power, two-sided α = 0.05, needs
**≈358 non-tied paired careers** – about **180 seeds per cell against today's 30, a 6× run.** On this
machine the two `a4-ladder` cells took 145 s and 1,915 s for 30 careers, so 180 seeds is roughly
**8–12 hours** of single-process bench time. That is the honest price of turning this row into a fact.

⚠ **That prerequisite has already been paid, which is why the null above is worth reading.** The same
calculation puts `a4-off` at ≈62 non-tied pairs, and it duly came back significant on the 60 this run
already has. The bench is not blind at this size; the second helping is simply smaller than the first.

**→ RUN AT n=250 PER CELL. See §7.7 for the settlement.**

## 7.6 ⚠ TWO THINGS THE OWNER SHOULD BE TOLD BEFORE ANYTHING IS MERGED

**(a) THE CONTROL MOVED BETWEEN THE TWO RUNS, AND THE FARE IS WHY.** §3's numbers were taken at
`5c3a6cc`, *before* the presence fare shipped; these are taken with the gated fare live in the control
of every arm. Tennis barely moved (elite control: prize p50 $1.80M → $1.79M, 635.7 → 633.1 matches
won) but **end funds p50 collapsed – elite $1,661,047 → $382,789, middle $1,060,175 → $94,849.** The
gated fare bankrupts nobody (0/30 in both cells, which is what the gate was for) and it costs the
family roughly a million dollars of what it retires on. That is a real and previously unstated price
of a mechanic that is already merged.

⚠ It also means one §3c headline does not fully replicate: `a3-big` at wealthy·elite was **22/8/0**
against the old control and is **14/15/1** against this one, though it holds at middle·middle (25/5/0
→ 24/5/1) and is still the only arm with a defensible pooled *p*. The +3.0 pp recommendation survives;
its elite-cell evidence does not.

**(b) THE MECHANIC IS INVISIBLE ON SCREEN T, DELIBERATELY.** `coachMarket`'s `edgePct` and
`coachEdgeView`'s `corridorPct` still print the rung's **home** corridor to a family that travels, so
a player who flips the switch is shown no reason to. Copy is the owner's call and it was not smuggled
in beside a balance change – but a bonus nobody can see is exactly the «четвёртый невидимый бонус»
that got this item reported three times, so it should not merge silently either way.

**(c) A SMALLER ASYMMETRY, RECORDED SO IT IS NOT DISCOVERED AS A BUG.** The fare is gated to rungs
that pay prize money; the presence predicate `coachTravelsWithHer` is not, and the travel helping
follows the predicate. So at a junior event the flow says he is there, no fare is charged, and she now
gets the doubled edge – free. Aligning them means giving the *presence* predicate the fare's own rung
test, which touches the snapshot rather than the coach's edge, and the fare gate itself is settled and
was not to be touched.
