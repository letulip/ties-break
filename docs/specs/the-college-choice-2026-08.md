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

*(filled in by the build – see `src/engine/collegeOffer.ts`)*

---

## 3. MEASURED

*(filled in after the arms run)*

---

## 4. WHAT WOULD REPLACE OUR NUMBERS

*(filled in)*
