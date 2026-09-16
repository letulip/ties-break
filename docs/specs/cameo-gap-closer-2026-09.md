---
type: spec
status: superseded
area: simulation-and-balance
canonical: false
last-reviewed: 2026-09-16
superseded-by: docs/specs/cameo-gap-closer-corrected-2026-09.md
---

# The cameo closes a trip (round 42 #47)

> ⚠⚠ **SUPERSEDED 16.09.2026, THE SAME DAY IT WAS WRITTEN – THE OWNER: «вообще всё не так».**
>
> **The misreading, in one line: «60-80% закрытия» IS A FREQUENCY AND THIS DOCUMENT READ IT AS A
> FRACTION OF A SUM.** He meant the share of NEED CASES that get help; the build implemented
> `shortfall × U(0.60, 0.80)` as the size of the cheque. Measured, the distance is not subtle: help
> arrives in about **4%** of need cases against the **60–80%** he asked for.
>
> **And the size was never the broken part.** His words: the mechanism «normally gave money, in normal
> amounts» – its one defect was that it read the WALLET rather than the family's whole budget. A
> J-series trip costs **$1,100–3,600** before staff fares (`TIERS`: j30 $200 + $900–2,000; j60 $250 +
> $1,100–2,400; j300 $400 + $1,600–3,200), so #43's flat $500–1,500 covered a third to a half of one
> trip. The gap-fraction pays a median **$129**.
>
> **What survives this document:** every measurement in it, the `unpayableTrip` probe, the honest
> need read, and §«the honest reading»'s refusal to quote Q4/Q5 as findings. **What does not:** the
> sizing, and the conclusion that a −95% collapse was an acceptable consequence of his ruling.
>
> The corrected design is in round 42's ledger under #47 and ships with the chemistry/sparring wave:
> the flat draw returns, the whole-budget need test stays, and the COOLDOWN is re-derived from a
> 60–80% coverage target rather than left as the binding constraint.
>
> ⭐ **Kept rather than deleted, because the measurement was right and only the reading was wrong** –
> and because a spec that records how a ruling was misread is worth more than one that quietly
> disappears.

The owner, 15.09, recovering what he first asked the local sponsor to be:

> «мы не фиксируем эти разрывы, а выдаём в край нужды для закрытия поездок, самый сложный этап
> J серия, там самые большие расходы»

and then the number:

> «давай что-то вроде 60-80% закрытия попробуем сделать»

That supersedes the cadence tuning of #5 and #43. The cameo was never meant to be a weekly lottery
with a spacing rule; it was meant to arrive at the edge of need to close a trip she cannot pay for,
and to close **most** of it and never all – so help is real and **a missed trip stays possible**.

Instrument: `tools/r42-cameo-gap-closer.ts`.
Run: `npx vite-node tools/r42-cameo-gap-closer.ts` (6 seeds × 9 presets = 54 careers an arm, six
seasons from fourteen, `econ-bench`'s `player` policy).

## What was built

1. **`unpayableTrip(world)`** (`world/phaseFinance.ts`) – the SOONEST event on the calendar she could
   still enter and cannot pay for, ties on the week going to the cheapest. The bill is entry fee +
   `travelCostFor` + the coach's and the masseur's fares, i.e. what the play week will really take,
   net of an academy scholarship and a kit brand's share. It is measured against
   `reachableFundsCents`, not the wallet, for wave-6 T12's reason. It asks `entryStatus`, the one
   gate `enterEvent` re-validates against – without it the probe would price a Slam for a
   twelve-year-old and the shop would be «in need» every week of the career.
2. **`sponsorCameoCents(seed, week, shortfall)`** – `shortfall × U(0.60, 0.80)` on the cameo's own
   `seed:sponsor:cameo:gift:<week>` sub-stream. One draw, the same stream and the same one `rng()`
   the flat `pickInt` spent, so the sub-stream's shape is unchanged.
3. **The gate gains a fourth condition and loses none.** The cooldown (`sponsorCameoWilling`), the
   college freeze and the need test (`sponsorNeedMet`) are untouched and still come first; a willing
   shop that finds no unpayable trip now writes nothing, which is the week the flat draw used to pay
   for no reason.

⚠ **Zero new draws on any stream.** The two deliberately dead MAIN draws at the cameo's site keep
their exact slots, so the per-week count and the frozen capture (41550 / `e6b0c709`) are untouched –
`tests/condition.test.ts` and `tests/rivals.test.ts` are green. ⚠ **No wording moved**: the feed line
is still `A local sponsor chipped in!`, byte for byte.

## Predicted, then measured (invariant 5)

Predictions written before the bench ran:

| # | claim | predicted |
| --- | --- | --- |
| Q1 | the cheque's size | median **$400–900**, i.e. 60–80% of a J-series travel bill |
| Q2 | dollars a season | **$900–1,600**, i.e. within about a third of #43's flat $1,125 |
| Q3 | cheques a season | **0.6–1.0**, below #43's 1.09 because a willing week can now find no gap |
| Q4 | she closes the rest and goes | **30–60%** of the trips a cheque was written for |
| Q5 | the trip is missed anyway | **40–70%** – the design's own cost |

Measured, 54 careers an arm:

| # | predicted | **measured** | verdict |
| --- | --- | ---: | --- |
| Q1 | $400–900 | **median $129** (median gap $281) | **MISS, by 3–7×** |
| Q2 | $900–1,600 | **$51 a season, −95% against $1,125** | **MISS, by an order of magnitude** |
| Q3 | 0.6–1.0 | **0.26** | **MISS** |
| Q4 | 30–60% | **7.2%** – and see the limitation below | **MISS, and not resolvable** |
| Q5 | 40–70% | **92.8%** after a cheque, 93.5% of every named trip | **MISS in the same direction** |

### The three prints his brief asked for

| arm | cheques/season | she closed the rest and went | the trip was missed | $/season |
| --- | ---: | ---: | ---: | ---: |
| ACTUATION, share 0 | 0.23 | 5.4% | 94.6% | $0 |
| ACTUATION, share 3.0 | 0.23 | 12.2% | 87.8% | $191 |
| **B · his 60–80% ⭐** | **0.26** | **7.2%** | **92.8%** | **$51** |
| 1.0 – the safety net he refused | 0.25 | 6.2% | 93.8% | $63 |

By background, at the shipped share: working **0.38 cheques/season, $83**; middle **0.28, $52**;
wealthy **0.01, $1**. The J-series block (seasons 0–3) takes **70 of the 83 cheques**, at a median gap
of $280 against the professional years' $367 – so the mechanic does land where he said it should.

## ⚠⚠ The honest reading, and two of these numbers are not findings

**Q2 IS a finding and it is the one he should read first. The gap-closer is worth $51 a season
against the flat draw's $1,125 – about a twentieth.** Two independent causes, both measured:

* **the cheque is smaller** – median $129, because the median gap the probe finds is only **$281**.
  It names the SOONEST unpayable trip, ties going to the cheapest, so it usually finds a small
  J-series entry she is just short of rather than the big trip of the season;
* **and the gate is far narrower** – 0.26 cheques a season against 1.09. A gap exists in about 7 of
  52 weeks, and the cooldown only lets the shop be willing about once a season, so the two coincide
  rarely.

The second cause is arguably beyond what he ruled. **He ruled on the SIZE** («60-80% закрытия»); the
narrowing is a consequence of the trip gate he also described («в край нужды»), and the two together
cost 95% of the cameo's money. ⚠ **This is the one question in the item worth putting back to him**,
and there are two dials rather than a re-design: which trip the probe names (the soonest-and-cheapest
against the strongest rung she could enter, which is where his «самые большие расходы» points), and
whether a willing week with no gap should still write a small flat cheque.

**Q4 and Q5 are NOT resolvable on this corpus and the spec says so rather than quoting 7.2% as a
result.** Two reasons:

1. **The actuation arms barely move them.** Share 0 gives 5.4% went, share 3.0 gives 12.2%, the
   shipped share 7.2% and share 1.0 gives 6.2% – the shipped and the full-closure arms are on the
   wrong side of each other, which is what noise looks like at 83 cheques. The money column's arm is
   proven ($0 → $51 → $63 → $191, monotone in the dial); the «went» column's is not.
2. **⚠⚠ THE BENCH'S POLICY IS STRICTER THAN THE ENGINE'S GATE, and no arm here can pass that.**
   `econ-bench`'s entry loop applies its own EARNED-points ranking gate before affordability, so it
   refuses cards a wild card opens; the engine's probe asks `entryStatus`, which is what a PLAYER may
   enter. A named trip on a rung above the autopilot's own line is one this corpus would never take
   with any amount of money, and it lands in the «missed» column for a reason that has nothing to do
   with the sponsor. The tier split shows it: `j60` 6.2% went, `j30` 2.2%, `wta125` 62.5%, `w100`
   37.5% – the rate tracks how close the rung is to the policy's line, not how much money arrived.

This is the same class of limit round 42 #49(b) names for the recovery ladder: **no bench can tell «a
family that would never take this trip» from «an autopilot that never takes it».** Answering Q4/Q5
properly needs either a policy whose entry rule is the engine's own gate, or a playtest.

## What this does not say

It measures six seasons from fourteen on one policy. It says nothing about a career that reaches the
professional rungs and stops being short of money, and nothing about what the mechanic feels like in
play – which, on a gift the player sees once or twice a season, is most of the question.

## ⚠⚠ The guarantee this narrows, and it is a question for the owner

Wave-6 T12 shipped a promise in his own words – «чтобы поддержка приходила реально тогда, когда
вообще уже край и денег нет» – and `tests/wave6-reachable-funds.test.ts` guards it: *when the money is
really gone, the shop still writes.* **#47 narrows that to «…and a trip she could take is out of
reach», and the two come apart at the bottom of the ladder.**

Measured on T12's own fixture, a self-coached thirteen-year-old who has entered nothing:

* 112 of 128 upcoming cards are gate-blocked on ranking; the only rung open to her is `local`, and a
  local trip costs **$87–$128**;
* the cameo is decided in phase 2, AFTER the parent's weekly contribution has landed, so a family on
  the fixture's $200 has six or seven hundred dollars in hand at the moment of the decision;
* over **300 broke weeks the probe found zero unpayable trips** – not because the gate is off, but
  because there was nothing she could not afford. Zero cheques followed.
* Held at a real deficit (−$500) instead, the shop writes on 4 of six working careers and 2 of six
  middle ones. The mechanic is alive; the family simply has to be short of the TRIP.

Both T12 arms and `economy.test.ts`'s end-to-end cameo arm were re-aimed to the new law, each with the
measurement written into the test. ⚠ **But the narrowing itself is his to confirm**, and it is the
same question §the honest reading asks from the money side: he ruled on the cheque's SIZE, and the
trip gate – which is also his sentence – is what took the other 80% of the channel.

## What a re-tune would cost, if he wants one

Two dials, neither a re-design, and both measurable with this bench in one run each:

1. **Which trip the probe names.** Today: the SOONEST unpayable one, ties to the cheapest – median gap
   $281. His «самые большие расходы» points at the opposite end (the dearest trip she could take),
   which would raise the median gap and the cheque with it.
2. **Whether a willing week with no gap still writes.** Today it writes nothing – that is what took
   cheques/season from 1.09 to 0.26. A small flat floor beneath the gap-closer would restore most of
   the money while keeping the targeting.

## An independent corroboration, from a bench that was not looking for it

Round 42 #40's junior-coverage instrument (`tools/r42-junior-coverage.ts`) walked 144 careers across
the junior band while this item was landing, and caught the change as a discontinuity between two of
its own runs ten minutes apart – a different corpus, a different horizon and a different question:

| | cameo, whole corpus | working-family median, per career |
| --- | ---: | ---: |
| before #47 | $442,307 | $4,410 |
| after #47 | $34,982 | $122 |

**A 12.6× collapse**, against this bench's own 22× on dollars-a-season. The two numbers are the same
finding at two horizons (that bench's $243 a career over four and a half seasons against this one's
$51 a season), measured by two instruments that share no code but the engine.
