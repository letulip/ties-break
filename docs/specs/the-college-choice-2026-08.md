---
type: spec
status: current
area: engine/balance
canonical: true
last-reviewed: 2026-08-17
---

# The college choice – three places with three prices, and the player picks one (17.08.2026)

**An eleventh phase on `wave/round21`, and it REPLACES the tenth's model rather than extending it.**
[`the-college-tariff-2026-08.md`](the-college-tariff-2026-08.md) reported college as a DELTA AGAINST
THE TOUR – how much better or worse off four years at college leave a family than four years on the
tour. **The owner read that report and did not understand it, and he was right not to: it answers a
question he never asked.**

> **The owner, 17.08, verbatim:**
> «Есть стоимость в год, она складывается из 52 недельных платежей семьи простым суммированием, плюс
> может быть ситуация, что есть деньги на счете и семья хочет выбрать колледж дороже… И всё. мы больше
> ничего ни с чем не сравниваем.»

⚠ **The age grid is not restated here.** It is written out once, in
[`college-is-its-own-branch-2026-08.md` §0a](college-is-its-own-branch-2026-08.md).

---

## 0. THE SCHEME, AS HE APPROVED IT

1. **A college TIER is a price AND a quality.** Three of them, on the sourced prices: **$30,990 ·
   $50,920 · $65,470** a year (College Board, *Trends in College Pricing and Student Aid 2025*,
   Figure CP-1 `[S]`).
2. **The scholarship is merit-only** – a share of the price of the college **she chose**, never above
   100%.
3. **The family pays the remainder in 52 weekly payments** and may go into debt. ⚠ This already
   worked and was NOT rebuilt: `resolveCollegeBill` has debited `familyPerYearCents / 52` with a
   `tuition` ledger row since v51.
4. **Choosing the college is the PLAYER'S decision**, and a dearer one is available if she can pay.
5. **No tour comparison anywhere in the reporting.** The price, the scholarship, the weekly payment,
   and whether she can afford it.

### ⚠⚠ WHAT THIS PHASE REPLACES, AND WHY IT IS A REBUILD

Before it, `CollegeProgrammeTier = 'strong' | 'solid' | 'small'` were **funding shares** – 0.85 /
0.55 / 0.30 – **derived from her junior record**, and every college cost the same. Two things were
wrong with that at once:

* **the player chose nothing** – the "tier" was assigned by her results;
* **the price was a constant** – nationality picked between two stickers and that was the whole of it.

So the card could say *"$8,673 a year"* under a sourced *"$30,990"* sticker and nothing on it
explained the gap. **$8,673 is the family's RESIDUAL after the award**, and the owner could not find
where it came from because no surface said so. This phase makes the residual arithmetic the player
can watch happen: a price she picked, minus an award she earned, equals a weekly payment.

---

## 0a. ⚠⚠ WHAT IS SOURCED HERE AND WHAT IS OURS – READ THIS BEFORE RE-TUNING ANYTHING

**The three PRICES are sourced.** Everything else in the tier is ours.

| the thing | ours or sourced | what stands behind it |
| --- | --- | --- |
| $30,990 / $50,920 / $65,470 a year | **`[S]`** | College Board, Trends 2025, Figure CP-1 – public in-state, public out-of-state, private nonprofit |
| the in-state price needs residence | **`[S]`** | it IS residence; a non-resident alien is never in-state anywhere |
| a scholarship may not exceed the price | **`[S]`** | NCAA Bylaw 15.1, and the trim falls on the need layer (15.1.3) |
| partial awards are the norm | **`[S]`** | NCAA: *"Most scholarships are partial"* |
| **the squad strength 55 / 65 / 75** | **OURS** | no source rates a programme on our skill scale. Invented, and set so the ladder brackets the measured 58.6 skill mean at the fork |
| **the recruiting bar 11 / 18 / 23** | **OURS** | set on the MEASURED quantiles of our own junior score – median / p75 / p90 – not on any published recruiting standard |
| **the dual-match season, and 1 / 2 / 3 matches a week in it** | **OURS** | the NCAA dual-match season is real; its length here and the per-tier match count are ours |
| **the chance of returning to the tour** | **OURS, AND NOT BUILT AS A DIE** – §2c | measured per tier as a consequence, never granted |

⚠ **No number in the right-hand half of that table is a finding.** Anyone re-tuning them is tuning
ours, and §4 says what evidence would replace them.

---

## 0b. THE QUESTIONS HE ASKED AND NEVER GOT AN ANSWER TO

**Does a scholarship exist at all?** Yes.

**Does everyone get one?** No. A girl who never reached a quarter-final at any junior rung in her
whole junior career has an empty record – nobody ever saw her – and she enrols as a **walk-on**, at
the full price of whichever place she picks. Measured, that is **3 of 90 careers**. Nothing removes
the college answer from her (owner's ruling, 16.08); what she does not have is anyone paying for it.

**On what principle?** **Merit, on her junior record alone.** `athleticShareOf(tier, juniorScore,
rng)` takes a tier, a score and a die – **it cannot be handed a family**, which is the owner's
question of 16.08 («едины для всех или тоже от достатка?») answered in the type system rather than in
a comment. A separate need-based layer beside it is means-tested and reads no tennis at all.

**How much?** A share of the price of the place **she chose**, and partial is the norm. At the state
tier a median junior record earns the whole bill; the same record at the private tier earns under
half of a bill that is twice the size. That is the trade the choice is about.

**⚠⚠ AND HE GUESSED THE RULE EXACTLY, WHICH IS WORTH SAYING OUT LOUD.** He said a scholarship cannot
exceed the price. That is **NCAA Bylaw 15.1** – a student-athlete is ineligible if she *"receives
financial aid that exceeds the value of the cost of attendance"* `[S]` – and it is already how the
engine meters the two layers. **The trim falls on the need layer, never on the award** (15.1.3: the
institution reduces INSTITUTIONAL aid), because trimming the award instead would make a merit number
move with family wealth.

---

## 1. ⭐⭐ PREDICTIONS – WRITTEN BEFORE THE BUILD, AND BEFORE ANY ARM WAS RUN

Recorded here first, per CLAUDE.md invariant 4 and the standing practice of
[`rank-plateau.md`](rank-plateau.md). §3 marks each one held or wrong.

| # | prediction | verdict |
| --- | --- | --- |
| **P1** | **Take-up is lopsided towards the cheap place.** Under a policy that takes the dearest tier the family can pay for out of income plus savings, **the state tier takes ≥ 70%** of careers, national 15–30%, private under 10%. | |
| **P2** | **The median family bill by tier is $0 · ~$20,000 · ~$34,000 a year.** A median junior score (11) earns a full ride at the state tier by construction, about 61% at national and about 48% at private. | |
| **P3** | **Somebody runs out.** Under the dearest-affordable policy, **more than 0 and fewer than 20%** of families finish the four years under water who would not have at the state tier. | |
| **P4** | ⚠⚠ **THE DEVELOPMENT DIMENSION WILL BE SMALL, AND I EXPECT TO BE ABLE TO SAY SO WITH A NUMBER.** Four years of the private tier's match play against the state tier's will differ by **under 0.5 of one skill point**, because P5 measured the ENTIRE coached/un-coached gap over the same four years at **0.12 points** – she is nearly out of headroom at nineteen. **If this holds, the tier is not legible through her game and I have to say so rather than tune until it is.** | |
| **P5** | **The merit-only property survives the rebuild.** The athletic share is identical across all three backgrounds, both nationalities, four incomes and four savings positions **at every tier**. | |
| **P6** | **The walk-on share does not move.** `juniorRecordScore` and the empty-record rule are untouched, so it stays at 3 of 90. | |
| **P7** | **The frozen MAIN capture (41550 / `e6b0c709`) does not move.** Every new draw is on a purpose-scoped sub-stream and the match-play term is arithmetic. | |

---

## 2. WHAT A TIER IS

### 2a. The table

| place | price a year `[S]` | squad **(ours)** | full-award score **(ours)** | matches a week in season **(ours)** | open to |
| --- | --- | --- | --- | --- | --- |
| **state** | **$30,990** public in-state | 55 | 11 | 1 | US residents only `[S]` |
| **national** | **$50,920** public out-of-state | 65 | 18 | 2 | everybody |
| **private** | **$65,470** private nonprofit | 75 | 23 | 3 | everybody |

**The prices are College Board, Trends 2025, Figure CP-1.** Everything in the three middle columns is
ours, and `COLLEGE_TIERS` says so on each line.

* **`squad`** is the programme's own playing level on the same 0-100 scale her skills use, so the card
  can print it beside her. The three bracket the measured skill mean at the fork (**58.64**, P5 §2b,
  n = 52): the cheap place is below her, the middle just above, the dear one well above.
* **`fullAwardScore`** is the junior score at which a programme funds her whole bill – the score at
  which she is the top of its recruiting board. The three are the **measured quantiles** of our own
  junior score over 44 careers walked to the fork (min 4 · p25 6 · **median 11** · **p75 18** ·
  **p90 23** · max 25). So the cheap place funds the median junior completely and the dear place funds
  only the top tenth completely.
* **`matchesPerWeek`** is what the squad DOES – see §2c.

### 2b. The award, and why it is smaller at a dearer place

```ts
export function athleticShareOf(tier: CollegeTier, juniorScore: number, rng: Rng): number {
  if (!recruitedAtAll(juniorScore)) return 0
  const merit = juniorScore / COLLEGE_TIERS[tier].fullAwardScore
  return clamp(merit + funding, COLLEGE_OFFER.minAthleticShare, 1)
}
```

**The signature is still the argument.** It takes a tier, a score and a die and **cannot be handed a
family** – the owner's question of 16.08 («едины для всех или тоже от достатка?») answered in the type
system. What changed is only the first argument: it used to be the funding band her record had bought,
which was a re-statement of the second argument; it is now **the place the player picked**, which the
function cannot derive and must be told. **The merit-only property is stronger for it**, because the
one new input is a player's decision and a player's decision is not a family's wealth.

**The same record is worth less at a dearer place**, because a dearer place is a stronger squad and
she sits further down its recruiting board. That is the whole of the trade: pay more, get a stronger
team – and get less help paying for it.

### 2c. ⚠⚠ THE THREE DIMENSIONS COLLAPSE INTO ONE MECHANISM, AND THE COLLAPSING IS A CLAIM

The owner approved **team strength** and **the chance of returning to the tour**; this phase proposed
**how much her game develops in the four years**. They are not three knobs:

* **TEAM STRENGTH is what a programme HAS.** On its own it is a number on a card.
* **WHAT IT DOES is put her on court against it.** A stronger squad plays a longer, harder dual-match
  season, and `growWeek`'s `matchesThisWeek` term is the engine's own **already-tuned** price of
  competition (`ECONOMY.development.matchBonus` = 0.18 a match, capped at 3). Before this phase
  `matchesThisWeek` was **0 for all 208 weeks** – she entered nothing, so developmentally a college
  programme was a girl practising alone. ⚠ The dear tier saturates the engine's own cap, deliberately:
  the ceiling on what a match is worth was tuned long before college had a price and this phase is not
  entitled to raise it to make its own dimension look bigger.
* **⚠⚠ THE RETURN TO THE TOUR IS NOT A SECOND KNOB AND WAS DELIBERATELY NOT BUILT AS ONE.** A per-tier
  probability that she "makes it back" would be a die that overrides the career the player actually
  had. This repo does not grant outcomes; it measures them. What she comes back with is **her game and
  her family's balance**, and both already move with the tier – so §3 measures the return per tier
  instead of assigning it.
  ⚠ **And the natural home for a per-tier return lever already exists and is somebody else's**: the
  wild-card mechanism landing on this same branch is exactly the shape of "the programme's contacts
  get a returning player into a draw". It is named here and **not touched**.

### 2d. What was NOT rebuilt

`resolveCollegeBill` – the weekly drawdown, the `tuition` ledger row, the family going into debt. It
has worked since v51 and the owner's «52 недельных платежей» is a description of it. One line changed:
it reads **the quote she chose** instead of "the offer".

### 2e. Residence, and the one door it shuts

The in-state price **is** residence, so the cheap place is not open to a girl on a student visa. **Two
places always are**, so nothing here can remove the college answer (owner, 16.08) – it removes one
school from a list of three, states the reason on the row, and `answerFork` re-validates it
engine-side so a stale screen cannot enrol her somewhere she cannot be.

---

## 3. MEASURED

*(filled in after the arms run)*

---

## 4. WHAT WOULD REPLACE OUR NUMBERS

*(filled in)*
