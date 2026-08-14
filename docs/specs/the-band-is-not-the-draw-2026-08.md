---
type: spec
status: draft
area: engine/season
canonical: false
last-reviewed: 2026-08-14
---

# The band is not the draw – what a 32-draw actually costs her, by round

**Status: MEASUREMENT. Nothing shipped.** No constant moved, no engine behaviour moved, no test
bound moved. One new probe in `tools/` (`draw-vs-band.ts`), read-only, driving the engine's own
draw construction. `docs/specs/the-wall-2026-08.md` §0 asserted this in one line ("The BAND is not
the DRAW"); this page is the number.

## 0. The question, and why the obvious instrument answers a different one

`tools/winrate-read.ts` [B] prints her mean match-win probability against the **eligible band** –
every player whose ranking percentile falls inside the rung's `entrantPctBand`. For the owner's
Naomi at `wta500` that is **83.6%**. He then played a season of `wta500`s at full condition and won
**one match in nine entries**. Both numbers are correct.

A 32-draw is not a random 32 of the band. `selectEntrants` keys entry on **standings position** plus
a jitter of one draw size, so the field is filled from the **top** of the band. The band is the
people who *could* be there; the draw is the people who *are*.

So: measure her per-round win rate, the strength of the opponent she actually meets per round
against the band's mean, whether she is seeded, and what an entry is worth – through the engine's
own machinery, not a model of it.

## 1. The instrument

`tools/draw-vs-band.ts`. Every event is run exactly as `computeShadowTournament` (world.ts) runs
it, and nothing about seeding or the bracket is re-implemented:

* universe = `universeForTier` (LIVE cohort ∪ derived field pros), standings = the kid-free
  `mergedWtaRanking` fold, availability = `rivalConditions`;
* `weekFieldExclusion` → `selectEntrants` → `rivalMatchPlayer` → `kidSeedIndexIn` → `runTournament`,
  all sharing **one** `seed:kidtour:<eventId>` sub-stream in that order;
* her matches resolved by the full point engine, AI-AI by the closed form – the shipped split.

**Trials.** One event is one draw, so n comes from events. The probe deals future year-blocks of
each career's own calendar (`buildSeason(`${seed}:s<chunk>`, …)` – `ensureSeason`'s own call) and
runs every event of the rung in them. 400 blocks per save gives **1,600–4,000 draws per rung**.
The world is held at today – her build, the standings, the cohort's fatigue – which is the Season
card's own stance ("the field she would meet if it started now").

**Condition held FRESH at 95**, the middle of the owner's 90-100. `conditionMatchFactor` is
**1.000 at 90, 95 and 100**, so fatigue is arithmetically excluded as a confounder rather than
argued away.

**Saves are read locally and are never committed**, and nothing derived from one leaves this page
beyond the aggregates below – the same rule `winrate-read.ts` and `round16-read.ts` carry.

## 2. Naomi (`w621`, age 25.8, wta #106, core 61.6)

Per-round win rate, and the opponent she meets. "core" is the cohort's own mean-of-four (`power`).

| rung | band core | draw core | flat-field P vs band | R1 | R2 | QF | SF | F |
|---|---|---|---|---|---|---|---|---|
| w100 (n=1600) | 41.8 | 49.6 | 94.3% | **88.4%** | 87.2% | 86.4% | 83.4% | 84.7% |
| wta125 (n=1600) | 44.9 | 55.1 | 91.5% | **78.1%** | 73.6% | 72.9% | 67.4% | 59.7% |
| wta250 (n=3200) | 48.1 | 66.6 | 85.9% | **48.6%** | 46.7% | 41.6% | 44.0% | 42.9% |
| wta500 (n=4000) | 49.5 | 69.4 | 83.6% | **43.6%** | 44.4% | 37.9% | 39.1% | 39.1% |
| wta1000 (n=3200) | 51.1 | 71.2 | 80.7% | **37.9%** | 33.7% | 35.5% | 30.3% | 34.1% |
| slam (n=1600) | 52.7 | 73.4 | 77.9% | **31.4%** | 28.5% | 31.5% | 31.1% | 28.6% |

Opponent core by round, `wta500`: R1 69.6 · R2 69.9 · QF 70.0 · SF 70.4 · F 70.5. Over five rounds
the survivor she meets gets **0.9 points** harder. The step from the band's mean to the draw's is
**+20.1**.

Finishes and what an entry is worth:

| rung | R1 exit | R2 exit | QF | SF | F | title | pts/entry | prize/entry |
|---|---|---|---|---|---|---|---|---|
| w100 | 11.6% | 11.3% | 10.5% | 11.1% | 8.5% | 47.0% | 60.9 / 100 | $8,686 |
| wta125 | 21.9% | 20.6% | 15.6% | 13.7% | 11.4% | 16.9% | 44.5 / 125 | $6,956 |
| wta250 | 51.4% | 25.9% | 13.3% | 5.3% | 2.4% | 1.8% | 28.9 / 250 | $5,387 |
| wta500 | 56.4% | 24.3% | 12.0% | 4.5% | 1.8% | 1.1% | 48.1 / 500 | $16,650 |
| wta1000 | 62.1% | 25.1% | 8.3% | 3.2% | 0.9% | 0.5% | 111.1 / 1000 | $51,050 |
| slam | 68.6% | 22.4% | 6.1% | 1.9% | 0.6% | 0.3% | 197.6 / 2000 | $276,806 |

## 3. Olivia (`w413`, age 21.8, wta #51, core 51.4)

| rung | band core | draw core | flat-field P vs band | R1 | R2 | QF | SF | F |
|---|---|---|---|---|---|---|---|---|
| w100 (n=1600) | 41.7 | 50.5 | 89.9% | **74.6%** | 73.9% | 72.1% | 70.1% | 67.7% |
| wta125 (n=1600) | 44.9 | 56.1 | 85.6% | **61.9%** | 55.7% | 42.8% | 46.2% | 28.4% |
| wta250 (n=3200) | 48.1 | 66.3 | 79.1% | **33.3%** | 29.6% | 24.8% | 25.6% | 30.0% ⚠ |
| wta500 (n=4000) | 49.7 | 70.9 | 76.0% | **23.1%** | 19.7% | 17.0% | 29.0% | 0.0% ⚠ |
| wta1000 (n=3200) | 51.4 | 72.9 | 72.6% | **20.1%** | 19.6% | 22.2% | 21.4% ⚠ | 16.7% ⚠ |
| slam (n=1600) | 52.9 | 74.5 | 69.4% | **16.5%** | 12.5% | 15.2% | 0.0% ⚠ | – |

⚠ = fewer than 30 matches in the cell, and it is stated rather than smoothed: at the top four rungs
she reaches an SF in under 1% of entries, so those rows are anecdote, not rate. Every **R1 and R2**
cell in both tables is 250+ matches, and R1 is 1,600–4,000. The verdict rests on R1-QF only.

| rung | R1 exit | R2 exit | QF | SF | F | title | pts/entry | prize/entry |
|---|---|---|---|---|---|---|---|---|
| w100 | 25.4% | 19.4% | 15.4% | 11.9% | 9.0% | 18.9% | 35.7 / 100 | $5,091 |
| wta125 | 38.1% | 27.4% | 19.7% | 7.9% | 4.9% | 1.9% | 20.1 / 125 | $3,361 |
| wta250 | 66.8% | 23.4% | 7.4% | 1.8% | 0.4% | 0.2% | 14.6 / 250 | $3,676 |
| wta500 | 76.9% | 18.6% | 3.8% | 0.6% | 0.2% | 0.0% | 17.8 / 500 | $10,754 |
| wta1000 | 79.9% | 16.2% | 3.1% | 0.7% | 0.2% | 0.0% | 81.9 / 1000 | $38,313 |
| slam | 83.5% | 14.4% | 1.8% | 0.3% | 0.0% | 0.0% | 153.2 / 2000 | $219,363 |

**The owner's season is in the ledger and the model reproduces it.** Olivia's retained rows: nine
`wta500` entries, **one match won**, eight R1 exits. The model gives her 23.1% in R1 and 0.288
matches per entry; over nine entries, P(one match or fewer) ≈ **30%**. His season was ordinary, not
unlucky – which is the finding, because "unlucky" would have meant there was nothing to fix.

## 4. The single number

How many of the players she faces are stronger than she is, in her own currency:

| rung | Naomi: band / draw | Olivia: band / draw |
|---|---|---|
| w100 | 1.1% / **0.0%** | 5.7% / **40.2%** |
| wta125 | 2.3% / **12.6%** | 13.6% / **75.0%** |
| wta250 | 12.6% / **87.0%** | 24.9% / **97.8%** |
| wta500 | 16.4% / **100.0%** | 29.6% / **100.0%** |
| wta1000 | 20.7% / **100.0%** | 34.7% / **100.0%** |
| slam | 24.8% / **100.0%** | 39.4% / **100.0%** |

At `wta500` and above, **every one of the 31 other players in her draw is stronger than she is**, in
every draw, in both careers. Sixteen per cent of the band is. That gap – 16% against 100% – is the
whole distance between 83.6% and one match in nine, and it needs no other explanation.

## 5. Seeded or not

**She is never seeded. At any rung. In 20,800 draws, in both careers, the median standing she is
given in her own 32-draw is #32 of 32.**

The cause is mechanical, not statistical. `computeShadowTournament` seeds her with
`kidSeedIndexIn(field, selRanking, KID_ID)`, and `selRanking` is folded over `cohortIds(world)` –
which excludes `KID_ID` – so the table the bracket places her by **has no row for her**.
`kidSeedIndexIn` falls through to its sentinel (`posOf.get(kidId) ?? ranking.length`), every entrant
counts as ahead of her, and `buildDraw` splices her into the last standings slot. This is the exact
opposite of the intent stated at the call site ("she goes into the draw AT HER STANDING, not at the
bottom of it … and is seeded, or not, on the terms everybody else gets", v21b). The same defect
holds on the junior and domestic rungs, which take `aiRanking` – also kid-free.

It also means the **Season card and the bracket disagree about her**: `upcomingEvents`
(`world/snapshot.ts`) previews a W card off `rankingFor(world, 'wta')`, which *does* carry her row.
`tests/preview.test.ts` cannot see this – its fixture builds one kid-inclusive table and hands the
same object to both sides, so it proves the two implementations agree given a table, never that the
two shipped call sites pass the same one.

**What the defect costs, measured.** The probe replays every draw with the one argument changed –
her place in the kid-inclusive table – same sub-stream, same entrants, same opponents:

| rung | Naomi: seeded → R1, pts/entry | Olivia: seeded → R1, pts/entry |
|---|---|---|
| w100 | 100% → 88.2% vs 88.4%, 58.4 vs 60.9 | 100% → 75.4% vs 74.6%, 36.9 vs 35.7 |
| wta125 | 0% → 77.9% vs 78.1%, 45.5 vs 44.5 | 100% → 66.6% vs 61.9%, 22.3 vs 20.1 |
| wta250 | 0% → identical | 30.6% → 36.2% vs 33.3%, 16.5 vs 14.6 |
| wta500 | 0% → identical | 0% → identical |
| wta1000 | 0% → identical | 0% → identical |
| slam | 0% → identical | 0% → identical |

At `wta500` and above the two arms are **identical runs** – she is unseeded under both tables, so
the argument to `runTournament` is the same number and no comparison is being made. Below the wall
the correction is worth 0 to +4.7 points of R1 win rate. **The seeding defect is real and should be
fixed on its own terms, and it is not the wall.** It bites at the rungs she already wins.

Two further checks that the draw's structure is not the culprit:

* her R1 opponent is a seed in **33.1-34.9%** of draws at every rung in both careers – exactly the
  structural rate for an unseeded player in a 32-draw with 8 seeds (8 of 24 unseeded slots face a
  seed). There is no ambush; she meets seeds at the rate the bracket shape dictates.
* the finish distribution is the geometric decay of a flat per-round rate, not a first-round cliff.
  Naomi at `wta500`: a constant ~0.42 predicts R1 exit 56.4% (measured 56.4), R2 exit 24.2
  (measured 24.3), QF 12.0 (measured 12.0). The R1 exit share is **arithmetic** – R1 is where the
  most players are – and R1 is in fact her *easiest* round there.

## 6. Verdict

**She does not die at the first hurdle. She loses uniformly, at every round, to a field that is
entirely above her.**

The two hypotheses were pre-separated and the numbers separate them:

* **"The draw's structure" is falsified.** She meets seeds at the structural rate; the opponent she
  meets gets 0.9 core points harder across five rounds; her per-round win rate is flat; and pricing
  the one real structural defect (never being seeded) is worth exactly **zero** at `wta500` and
  above, because the correction does not change her seeding status there.
* **"Her build against the field" is what the numbers point at.** The band's mean opponent is 12
  core points *below* her; the draw's mean opponent is 8 points *above* her; and 100% of her draw
  outranks her build at every rung from `wta500` up. This is the-wall-2026-08 §0's last bullet
  arriving from the other side: the top storey's core is `[67, 77]` and a career's wings cap in the
  low-to-mid 60s, so at the rungs made of that storey there is no opponent she is favoured against.

Consequences for the levers priced in `the-wall-2026-08.md` §2:

* **L2 (align her attainable build with the field's top storey) is the one this measurement
  supports.** It is the expensive lever, and this page is the evidence that the cheap ones cannot
  reach.
* **L3 (doors that read more than rank) is not it.** She already gets into these draws; the doors
  are not what stops her.
* **L1 (the coach's per-match edge) is not contradicted here and is not evaluated here.** It moves
  every match by a small amount, and the shape this page finds – a flat per-round deficit over
  ~4-5 rounds – is the shape a per-match edge compounds against. What this page does say is where
  it has to land: at `wta500`+, against a 43.6% / 23.1% R1, not at `w100` where she already takes
  47% / 19% of the titles.
* **A separate, non-balance fix falls out of §5**: the bracket should seed her off a table that
  contains her, and the preview and the bracket should read one table. It is worth 0 to +4.7 points
  of R1 at `w100`/`wta125`/`wta250` and nothing at the wall, so it is a correctness item, not a
  balance one, and it must not be sold as a fix for the wall.

## 7. Reproducing

```bash
npx vite-node tools/draw-vs-band.ts -- \
  --save ~/Downloads/<career-a>.tsave --save ~/Downloads/<career-b>.tsave --chunks 400
```

~30 s for both careers, 20,800 draws, zero writes. `--chunks` is the only handle on n; `--condition`
defaults to 95. The `wta500` "flat-field P vs the band" cell re-derives `winrate-read`'s 83.6% for
Naomi, which is the check that the band here and the band there are the same population.
