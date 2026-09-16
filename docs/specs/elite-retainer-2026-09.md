---
type: spec
status: draft
area: economy
canonical: false
last-reviewed: 2026-09-16
---

# The elite tail, re-priced – round 42 item 19

The owner, on the phone: «элитный стоит 830 в неделю, это 43к в год… за такие деньги их не
существует. И то же про элит рекавери… 2900», and then the commission that unparked the item:
«у нас есть исследование и бенч, надо просто цифры проверить и актуализировать».

So this file does the two halves in that order. §2 is the CHECK – what our numbers actually are
today, measured rather than quoted, because one of the figures the item was written against had
already moved. §3 is the prediction, written down before the measuring arm was ever run. §4 is what
came back, misses named as misses. §5 is the proof that the middle did not move, which finding 3.2
makes a deliverable rather than a footnote.

Nothing here is a ruling. Every constant is a proposal and the numbers are the owner's.

---

## 1. Where his two figures come from

**$830 a week.** That is an elite coach drawn at about $166/h against the 12–16 band
(`hourlyRateCents.elite[0]` = $120–180), at the balanced plan's five sessions. $830 × 52 = $43,160,
which is his «43к в год» to the dollar. The conversion behind that band is his own 29.07 research –
per-hour individual lessons for a twelve-to-sixteen year old – and it is right for what it prices.
What is wrong is that it never stops being the price: the same signed man costs the same hour
whether she is #400 or #4, because our retainer reads the TIER the parent chose and her AGE, and
never her ranking.

**$2,900.** That is the `elite` vacation rung – «Elite recovery programme», $4,000–7,000 – at a
working family's wealth corridor: $4,000 × 0.725. The clinic the blurb calls «the clinic the pros
use» quotes the poorest family in the game a third off, and round 41 P1 already ruled on exactly
that shape for coaching («в про карьере с большими чеками цены для всех должны быть равны»). P1 was
applied to the coach ladder because that is what the wave in front of him was about; the service
ladder was never looked at.

## 2. The check – what our numbers are TODAY, and one of them had already moved

Measured on `tools/r42-elite-retainer.ts` §1 (9 presets × 4 seeds × 600 weeks, the player policy,
seasons folded through `financeWindow` per 52-week window so the ledger's 60-week pruning cannot
eat an early year). Team cost = coaching + facility + the staff prize shares.

| her W rank that season | season gross (median) | team cost (median) | team as % of gross |
| --- | --- | --- | --- |
| #1–3 | $2,665,000 | $679,557 | **25.5%** |
| #4–10 | $2,241,580 | $378,096 | **16.9%** |
| #11–25 | $936,310 | $161,707 | 17.3% |
| #26–50 | $612,225 | $112,113 | 18.3% |
| #101–200 | $67,545 | $8,155 | 12.1% |
| #201+ | $26,640 | $4,990 | 18.7% |

**Three findings, and the first one changes the item's own premise.**

**2a. The research file's §2 verdict is out of date, because #41 already shipped half the fix.**
`team-economics-2026-09` was written on 13.09 and says our whole top-end staff runs «≈ $80–130k/yr»
and is «an order under reality at the very top». That was true when it was written. Round 42 #41
then put the coach on 10% of EVERY cheque, and the measured top-end team bill is now **$378k a year
at #4–10 and $680k at #1–3** – inside the research's own $600k–1M band for a full elite team. The
gap at the very top is no longer an order of magnitude; it is roughly 1.5×, and it is concentrated
in the retainer because the share arm is already there.

**2b. The 25–40% target counts seats we deliberately do not have, so it is not our target.**
The research's «reality pays 25–40%» is a full tour team: head coach, fitness coach ($100–150k),
physio ($120–180k), sparring partner. Our audit refuses the fitness seat and the separate physio
salary on purpose, with reasons recorded. Our modelled team is a coach, a masseur and a
psychologist. Measuring ourselves against a number that includes two seats we will never have is
how a target becomes unreachable by construction. **The honest target is the research's own
retainer rows** – $90k at top-100, $150–250k at top-10 – and that is what §3 predicts against.

**2c. The rank table maps to reality's money well enough to gate on.** A season inside our top
hundred banks a median $330k; reality's #51–100 earns roughly $300–700k. A season inside our top ten
banks $2.24M; reality's top ten earns $2–6M. So «her live W ranking» is a legitimate instrument
here and not a proxy that needs a conversion factor.

## 3. What was changed, and what it was predicted to do

**The retainer gains a rank band.** `ECONOMY.coach.retainerBandByRank` – two rows, read top-down off
`kidLadderRank(world, 'wta')`, multiplying the coach's LABOUR and never the court
(`bandedRateCents`). Anything outside the last row is 1.0.

| her live W rank | factor | why |
| --- | --- | --- |
| #1–10 | ×4.5 | research: $150–250k/yr |
| #11–100 | ×2.0 | research: ≈$90k/yr |
| #101+ / unranked | ×1.0 | finding 3.2: the middle does not move |

**The `elite` vacation rung was proposed for the same treatment and refused.** `uniformPrice: true` –
one price for every family, round 41 P1's sentence applied to the one service rung that is
unambiguously top-of-market. It is built, it is one line, and §7 records why it is not set.

### The predictions (written before the B arm ran)

| # | claim | predicted |
| --- | --- | --- |
| P1 | the middle | every career that never enters the W top 100 bills the same integer cents every week; wallet at horizon end byte-identical, all seeds |
| P2 | retainer at #11–100, elite rung, 5 sessions | labour $1,472/wk (17–22) and $1,924/wk (23+) = **$76.5k / $100k a year**, bracketing the research's $90k |
| P3 | retainer at #1–10, elite rung, 5 sessions | labour $3,312/wk and $4,329/wk = **$172k / $225k a year**, inside the research's $150–250k |
| P4 | team as % of gross | #4–10: 16.9% → **22–25%**; #1–3: 25.5% → **31–34%** |
| P5 | survival | no new bankruptcy among careers that reach the band – she banks $2.2M a season against a raise of $134–187k |
| P6 | the elite recovery rung | a working family's quote moves from ~$2,900 to the band's own ~$4,000 floor (mid ~$5,500); a wealthy family's FALLS from ~$6,875 to ~$5,500 |
| P7 | RNG | zero MAIN draws added; the frozen capture (41550 / `e6b0c709`) unmoved |
| P8 | frozen careers | the 18 `coachTravelEdgeFixtures` hashes (156 weeks, to age 16.6) unmoved – she cannot be in the W top hundred at 16.6 and no `elite` vacation week is bought there |

## 4. Measured

`tools/r42-elite-retainer.ts`, two runs: 9 presets × 4 seeds × 600 weeks, and 9 × 6 × 312 weeks.

| # | predicted | measured | verdict |
| --- | --- | --- | --- |
| P1 | the middle bills identical cents | **0 of 20 mid-careers moved, worst $0** (312-week run; the 600-week run could not answer – see below) | **hit** |
| P2 | #11–100 elite rung: $76.5k / $100k a year | $76,544 / $100,048 | **hit, exactly** |
| P3 | #1–10 elite rung: $172k / $225k a year | $172,224 / $225,108 | **hit, exactly** |
| P4 | team as % of gross: #4–10 → 22–25%, #1–3 → 31–34% | **#4–10 → 17.9%, #1–3 → 26.3%** | **MISS, and the prediction was wrong for a reason worth keeping** |
| P5 | no new bankruptcy in the band | 0 of 36 before, 0 of 36 after (600wk); 0 of 54 both ways (312wk) | **hit** |
| P6 | the elite clinic rung goes uniform | $5,715 for every background, from $4,143 / $5,715 / $7,144 | **hit – and then refused, see §7** |
| P7 | zero MAIN draws; the frozen capture unmoved | `tests/condition.test.ts` green – 41550 / `e6b0c709` | **hit** |
| P8 | the 18 frozen career hashes unmoved | green; and per-key against a control tree at `92f363e3`, presets 0 / 5 / 8 byte-identical | **hit** |

**P4 missed, and the miss is the finding.** The retainer roughly doubles for a top-hundred player and
quadruples in the top ten, yet the team's share of gross barely moves – because at that end of the
game the coach's 10%-of-every-cheque share (round 42 #41) is already several times the retainer. At
#4–10 the median team bill is $378k against a $2.24M gross, and the retainer is a small part of it.
So the retainer band is the right fix for the RETAINER, and it is not a lever on the team share; the
team share was already fixed by #41, and the residual distance to the research's 25–40% is the two
salaried seats the audit deliberately refuses. That is §2b restated with the after-numbers behind it.

**⚠ And the 600-week run's §5 came back a null arm, which is why there are two runs.** Over 11.5
seasons the econ-bench walk puts **36 of 36** careers inside the top hundred at some point, so the
never-in-band cohort was empty and its «0/0 moved, worst $0» was vacuously true. The 312-week run
(14→20, the audit's own mid-career scale) has a real partition – 34 in-band, 20 never – and it is the
one the P1 row quotes. Two further proofs stand beside it and depend on no corpus: the sweep in
`tests/component/round42-elite-retainer.test.ts` (every rung × every age × every band edge × six
out-of-band ranks, all identity), and the arithmetic argument in §5.

**The actuation arm did its job**: at ×50 for everybody, 11 of 20 mid-careers move and 11 of 54
careers go bankrupt. The instrument reads.

## 5. The proof that the middle did not move

Finding 3.2 is the hard constraint, so the proof is two things and not one.

**By construction.** `coachRetainerBand` returns exactly `1` for a null rank and for any rank past
the last row, and `bandedRateCents` at band 1 is `court + Math.round(rate − court)`, which is `rate`
for any integer rate. So the till multiplies by one and rounds an integer: the cents charged are
identical, not close. This is the property that makes the gate a rank gate rather than a tier gate –
a tier gate would have re-priced every family that ever bought an elite coach for a junior, which is
precisely the blanket raise 3.2 forbids.

**Measured anyway**, because a byte-identical claim nobody ran is exactly the null arm CLAUDE.md
warns about: the bench partitions the corpus by whether the career ever entered the band and prints
the A-vs-B wallet delta per career for the ones that never did.

## 6. What this does NOT do, and what it costs to want it

**There is no renegotiation scene.** Finding 3.1 asks for «renegotiation as a scene, not a slider»,
and what ships here is the slider half – the arithmetic, applied silently the week her rank crosses.
The scene is a real build: a letter or a beat, a refuse-and-he-leaves branch, the copy, and a
decision about whether a family that will not pay keeps the coach. It is its own item, and the
argument for splitting it is that the arithmetic is the part the research prices and the part a
bench can settle; the scene is the part only the owner can write.

**The practice-match fee is not banded.** `practiceCoachRateCents` quotes an extra hour of the same
man for one friendly. The research prices «a fixed retainer paid weekly/monthly regardless of
results»; banding a one-off hour would be extending his figures past what they say.

**The masseur and the psychologist are not re-priced.** Nothing in the research asks for it, the
masseur is already a flat contract per rung with his own ruling behind it, and 3.2's warning is
about staff prices generally, not only the coach's.


## 7. The elite recovery rung – measured, and not taken

His second figure got the same treatment as the first and came out the other way, which is the
argument for measuring rather than reasoning.

The change works exactly as predicted: the rung quotes $5,715 to every family instead of $4,143 to a
working one and $7,144 to a wealthy one. What it does NOT do is stay in the elite tail. The bench
partitions its corpus by whether a career ever enters the rank band, and over 20 mid-careers that
never do:

| arm | mid-careers moved | worst |
| --- | --- | --- |
| the rank band alone | **0 of 20** | **$0** |
| the band plus the clinic rung | 4 of 20 | $178,701 |

Finding 3.2 is a hard constraint, so that settles it. The reasoning that made the change look safe –
«only a rich family buys a $4,000 clinic week» – is the kind of thing a bench exists to check: a
clinic week is a discretionary one-off a stretched family books after an injury, and the corridor was
what made it reachable. A rank gate has no such failure mode, because a rank is not something a
family can stretch for.

**Two things are left for him, and both are one word.**

First, which figure he meant. «элит рекавери… 2900» reads most naturally as the *Elite recovery
programme* ($4,000–7,000) at a working family's 0.725 corridor, which is $2,900. But the *Sports
recovery resort* at a **wealthy** family's corridor quotes **$2,950** – nearer his number – and that
is a different complaint with a different fix.

Second, whether he wants the change anyway. The mechanism is in the tree and unset
(`VacationPackage.uniformPrice`); the cost of turning it on is the four mid-careers above, and it is
his to spend if he thinks the clinic's price matters more than their wallets.

## 8. One thing the round should know about its own instruments

Over 600 weeks on the player policy, **36 of 36 econ-bench careers reach the professional top
hundred**, and a median season inside it banks $330k. The corpus is elite-skewed – which is fine for
most questions and fatal for any question of the form «what happens to the careers that do NOT get
there». Any bench asking that needs the 312-week horizon or a stated partition, and this one only
found out because its actuation arm was built before its conclusion was written.

---

# 9. Round 42 #49(b) – he ruled the other way, and here is what the bench can and cannot say

**The ruling, 16.09, and it is the un-refusal of §7:**

> «высокие тиры восстановлений в одном ценовом коридоре независимо от достатка… пользуются этими
> восстановлениями уже когда деньги реально есть. Вряд ли семья с доходом 200-300 в неделю туда
> поедет, а если и поедет – это их выбор.»

So `uniformPrice: true` is now SET, on **both** high tiers – he said «тиры» in the plural, and
`resort` ($1,800–3,000) is no more reachable on «200-300 в неделю» than `elite` ($4,000–7,000) is.
The band stops above `seaside` ($600–1,000), which is the family hotel a stretched family really does
book. `tests/planner.test.ts` pins which rungs carry it, by name and in both directions.

**What it does to a price**, arithmetic and exact: a WORKING family's quote rises out of its 0.7–0.8
corridor onto 1.0 (elite ≈$2,900 → ≈$4,000 at the floor) and a WEALTHY family's falls out of 1.2–1.3
(≈$6,875 → ≈$5,500). One price, as he asked.

## 9.1 The re-measurement, and the heading it does NOT get to keep

`tools/r42-elite-retainer.ts` gained a fourth arm (B3 · both high tiers) and its `vacationUniform`
boolean became a list of rung ids, so `resort` and `elite` can be separated. Re-run on **item 19's
own corpus** – 6 seeds × 9 presets, 14 → 20, the horizon that actually contains careers which never
enter the rank band:

| arm | never-in-band moved | worst | in-band moved | worst |
| --- | ---: | ---: | ---: | ---: |
| B1 · band only | **0 / 22** | $0 | 25 / 32 | $53,030 |
| B2 · + elite only (§7's refused arm) | 7 / 22 | $17,843 | 32 / 32 | $1,871,745 |
| **B3 · + BOTH high tiers (SHIPS)** | **10 / 22** | **$1,007,723** | 32 / 32 | $1,111,687 |
| 0 · ACTUATION (×50, everyone) | 9 / 22 | $132,775 | 27 / 32 | $3,678,680 |

Survival is unmoved: **1 bankruptcy of 54 in every arm but the actuation one** (which takes 8), and
the shipped arm's median end funds sit between the before arm's and the elite-only arm's.

## 9.2 ⚠⚠ THE TWO LIMITS, SAID OUT LOUD RATHER THAN QUOTED PAST

**(a) The policy books without judging, so what §5 prices is the AUTOPILOT's choice.** `econ-bench`'s
`planRecoveryWeek` books the best package inside 10% of current funds every off-season and on every
rescue. It has no notion of «a family like this one would not go to a clinic» – which is precisely
the judgement his ruling makes. No arm here can tell «a family that would never book this» from «a
family whose autopilot books everything», and no refinement of the corpus can supply it: it is a
statement about a player, and the bench has no player in it. **That is why §7's «4 of 20» was never
an answer to the question he has now asked.**

**(b) AND THE NUMBER ITSELF IS NOT RESOLVABLE, WHICH §7 DID NOT KNOW.** B3's worst never-in-band
career moves **$1,007,723**. A re-priced clinic week cannot do that arithmetically: the change is
about +$1,100 on an `elite` booking and +$660 on a `resort` one for a working family, so six seasons
of bookings come to roughly $10k. The million is **path divergence** – a changed wallet changes an
entry decision, a different tournament is played, and prize money is heavy-tailed enough for one
career to own the column. The tell is in the table: the ACTUATION arm, which multiplies the coach's
retainer ×50 for EVERY career, moves that same column by a *smaller* worst case ($132,775) than the
shipped arm does. An instrument in which the absurd arm is gentler than the real one is not measuring
the real one.

⚠ **And the 600-week horizon cannot be used to escape (b).** Run there, the partition is **34 careers
in the band and 2 never** – a denominator of two is not a measurement, and §8 of this spec already
warned that this corpus is elite-skewed for exactly this reason.

## 9.3 So what the bench is good for here, and what it is not

* It **is** good for the direct price arithmetic (§9's second paragraph) and for survival: nobody new
  goes bankrupt, at either horizon.
* It **is not** a verdict on finding 3.2's constraint any more. The constraint was «the raise must
  reach the elite tail and nothing else»; this change deliberately reaches a discretionary purchase a
  mid-career family may make, and the owner has ruled that such a family «если и поедет – это их
  выбор». That is a design decision with a stated reason, and the honest record is that **the bench
  cannot price it, not that the bench priced it at 4 of 20.**
* The cost he spent knowingly: a working family's recovery week at the top two rungs costs about a
  third more than it did; a wealthy family's costs about a fifth less.
