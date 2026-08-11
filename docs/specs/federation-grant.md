---
type: spec
status: draft
area: economy/federation
canonical: false
last-reviewed: 2026-08-10
---

# The federation pays the family, and it pays them to keep their own coach

**Design proposal. Nothing built.** It replaces the premise of `academy-invitation.md`, which the
research overturned: an academy place does not buy a rung the weekly market refuses to sell, because
**our coach ladder already IS the academy ladder** – `coachFactor(tier, fit)` and
`facilityRateCents(age, tier)` price the environment, and hiring the rung by the week gets you the
same environment. What the research found federations actually sell is different and is not in the
game at all:

> the dominant federation product is a **cash grant to a family that keeps its own coach**

The owner, 10.08: «давай так попробуем, грант во многих исследованиях фигурировал. Надо аккуратно
вплести в экономику нашу, чтобы хорошо и обоснованно легло, у нас не лёгкая прогулка всё таки.»

## 0. The one thing that has to be true first, and it is not optional

⚠ **A federation grant is awarded on NATIONAL rank. National rank does not currently mean anything.**

Measured (`tools/nation-depth.ts`): **177 of 199 cohort juniors – 89% – carry a flag that is not
hers**, and `selectEntrants` filters the domestic rungs by age, by condition and by ranking
percentile, **never by nation**. So today a "national championship" is contested by 89% foreigners
and `standing.nationalRank` is a place in a field that is not a nation.

The owner's own flag item («на national, regional, local раундах делать всех соперниц с флажком
нашей героини») is therefore not a cosmetic fix that happens to be nearby. **It is this spec's
denominator.** Flags ship first, in the same wave, and the grant is written against the table they
make honest. Nothing below can be measured until they do.

## 1. What it is

**A cash grant, paid to the family, once per season, that changes nothing about who coaches her.**

That last clause is the whole design. The academy's trade is *you get a better environment and you
stop choosing*; the grant's trade is *you keep everything you have chosen and you can afford it for
another year*. They are opposite products and the game currently sells neither.

| | academy place (the old draft) | federation grant (this one) |
|---|---|---|
| what arrives | an environment | **money** |
| who coaches her | the academy's | **hers, unchanged** |
| what it replaces | coach bill + court + part of travel | **nothing – it offsets** |
| decided by | price, with funded places on merit | **merit only** |
| legibility | a discount buried in travel (#90) | **a line in the ledger** |

### 1a. It pays as a LINE, not as a discount

⚠ This is a direct correction of a shipped mistake. The academy scholarship pays by reducing
`travelCoverShare`, and the bench reads **$948 of `academy` income across four seasons while 50 of 50
careers hold a scholarship** – the support is real and invisible. Task #90 exists because of it.

The grant lands as an `income` event with its own category, at a known week, for a stated amount.
The parent sees the money arrive. That is not presentation polish: a support the player cannot see is
a support the player cannot plan around, and planning is the game.

## 2. Who gets it – scarcity, never a threshold

**The best k juniors of her nation in her age band, re-decided every season.**

Not a rank bar. The precedent is on file and it is expensive: `ECONOMY.sponsorship` was gated at
`world.kidRank <= 30`, **fired for nobody across 120 seeds in any preset**, and had to be rebuilt
(30.07). A threshold is a number somebody guesses; a place in a field is a measurement.

⚠ **And NOT on win rate, which was measured and does not discriminate.** `tools/winrate-read.ts`
across the owner's four careers – four backgrounds, four coach rungs, four fates:

| | Olivia | Zoe | Ines | Naomi |
|---|---|---|---|---|
| career W-L | 67.9% | 68.3% | 71.0% | 75.5% |

**A band of eleven points across careers that have nothing else in common.** A grant gated on
"выигрываемость" fires for everybody, which is the same defect as the sponsorship bar with the sign
flipped. What separates these four is `endRank` and the rung reached – so that is what the gate
reads.

### 2a. The three inputs, and none of them is the family's money

`reviewLevel` already computes exactly the right quantity and survives unchanged:

* `resultScore(rank)` – what she has done, now read off the **national** table;
* `scoutScore(ceiling)` – what she might do, through the scout's eye;
* `ageBand` / `minEventsPerYear` – she must be the right age and actually be playing.

⚠ **`needFactor` DOES NOT ENTER THE GATE.** `{ working: 1, middle: 0.6, wealthy: 0 }` prices what a
grant is WORTH to a family; it must never price whether she gets one. A wealthy girl who is the best
14-year-old in the country gets the grant – in life she does – and it changes nothing for her
family's balance. **The award is about her. The amount is about them.**

## 3. How it lands in the economy without making it a walk

The owner's constraint is the hard part: «у нас не лёгкая прогулка всё-таки». Three rules, each with
a number to measure it by.

### 3a. It covers a FRACTION of the gap, never the gap

The failure mode this economy actually has is not "the season is expensive", it is **insolvency**.
Measured (`tools/failure-modes.ts`, balanced policy, 4 seasons, 30 seeds): a `working` self-coached
family goes broke in **100%** of careers. A grant sized to fix that would delete the difficulty
setting; a grant sized to buy her **one more season before the wall** turns a hard stop into a
decision, which is what the money system is for.

So the grant is denominated against the **coaching bill she already pays**, not against the whole
season – the same discipline the cameo's runway fix used (measured against the court, not the bill).

### 3b. It is losable, and losing it is a story

Re-decided every season off the same review. A girl who wins a place at 15 and loses it at 16 has had
something happen to her, and the ledger has to be able to say so. This is the kit deal's shape (term
+ review), not the academy scholarship's.

### 3c. It cannot buy a rung

The grant is money. It may not unlock a tier, waive an entry cap, or clear the doctor's floor. Every
gate in the game stays exactly where it is. **The only thing that changes is whether the family can
still afford the thing they already chose.**

## 4. The ship rule, authored before anything is built

`tools/two-cells.ts` is the instrument – background × coach, 50 careers, four seasons – plus
`tools/failure-modes.ts` for the tail, which is where a support system either works or lies.

1. **The AWARD RATE must not move by background.** Share of careers holding a grant, per background,
   within noise. If `wealthy` careers win more of them, `needFactor` has leaked into the gate and
   this became a difficulty lever – the one thing it must not be.
2. **It must reach the family it is for.** Of `working` careers in the top decile of the **national**
   table, most must hold a grant. If not, the scarcity is set wrong.
3. **It must not delete insolvency.** `working` bankruptcy share must fall, and must not fall to
   zero. A named target belongs here before a constant is chosen; my instinct is that it should buy
   about one extra season and no more, but that is a sweep, not an instinct.
4. **The unfunded arm must not move.** Careers holding no grant end within noise of today on funds,
   rank and entries. Additive or wrong.
5. **RNG.** A grant is a consequence of results, not a player choice, but the award draw – if any –
   goes on a purpose-scoped sub-stream. Invariant 2. The frozen MAIN capture may not move.
6. **Legibility, measured.** Grant income visible in the Money breakdown must equal grant income
   paid, to the cent. This is the assertion the academy never had, and its absence is task #90.

## 5. Open, and the owner's to answer

1. **How big, denominated how?** §3a argues "a fraction of the coaching bill". A share (25%? 50%?) or
   a flat sum per rung? A share tracks the wealth corridor for free; a flat sum is legible and can be
   said in one sentence on a card.
2. **How many places, and per what?** Per nation per age band is the honest unit but it makes the
   count depend on `NATION_WEIGHTS` – a US girl competes with 2.4 same-age compatriots, a Portuguese
   one with 0.24 (measured). Per nation ignoring size is simpler and kinder to small nations; per
   capita is realer and makes her flag a difficulty setting. **This is a design choice, not a fact.**
3. **Does it stack with the academy scholarship?** They are different products and in life they do
   stack. In our economy they would both land on a `working` family at once.
4. **Does the wealthy track see it at all?** `needFactor: 0` says the money is worth nothing to them,
   so the award would be a line that reads "$0". Either it is a HONOUR with no cash (which is real,
   and is content), or wealthy careers are simply not shown it.
