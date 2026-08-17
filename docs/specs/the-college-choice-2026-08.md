---
type: spec
status: current
area: engine/balance
canonical: false
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

### 3a. ⚠⚠ THE ARMS, AND THE COMMIT EACH WAS BUILT AT

| arm | commit | instrument |
| --- | --- | --- |
| **A** – the model this replaces | `9dca805` **with `9dca805` reverted** (`git revert --no-commit`), in a dedicated worktree `../tb-college-A` | `tools/college-price-probe.ts --seeds 6 --all` (the instrument that shipped at that commit) |
| **B** – the rebuild | `9dca805` | `tools/college-choice-probe.ts --seeds 6` |

⚠ **The obvious A would have been wrong.** Another agent is committing wild-card work on this same
branch, so "the branch head before I started" measures both waves. Reverting MY OWN commit leaves the
wild cards present in both arms – CLAUDE.md's shared-checkout rule, and the reason it exists.

⚠ **Provenance checked before the numbers were believed**: `git grep COLLEGE_TIERS -- src/` returns
**nothing on A** and **three files on B** – the constant, its reader in `world/college.ts`, and the
card. Neither arm is a tree where the change sits without its reader.

⚠ **The two arms use different instruments and that is unavoidable, not sloppy**: arm A's model has no
tiers, so the new probe cannot compile against it and the old probe cannot express a choice. **Only
the columns both can express are compared** – the family's bill, the covered share, free rides, and
whether anybody ran out. Population, policy and seeds are identical: `POLICIES[1]` (`player`), 6 seeds
x 9 presets, **n = 53** careers reaching the fork in both.

### 3b. THE PREDICTIONS, JUDGED

| # | prediction | verdict |
| --- | --- | --- |
| **P1** | state takes ≥ 70% under a dearest-affordable player | ⚠⚠ **WRONG, AND BACKWARDS.** Under that rule **72% take the PRIVATE place**, 26% national, 2% state. I predicted a poor population; by the fork the median family has **$41,635 a year** of income-plus-cushion against a $23,128 private bill. §3d |
| **P2** | median family bill $0 · ~$20,000 · ~$34,000 | **half held.** $0 · **$14,144** · **$23,128**. The state figure is exact by construction; the two above it are ~30% cheaper than predicted, because the ±10% funding spread and the need layer both lift the covered share off the bare recruiting-board arithmetic |
| **P3** | >0 and <20% run out under the dearest-affordable rule | ⚠⚠ **WRONG ON THE CEILING, AND IT FOUND SOMETHING THE PREDICTION DID NOT NAME.** At the private place **11 of 53 (21%) finish under water and 6 of 53 (11%) go BANKRUPT – the career ENDS.** Arm A: 0 of 53 on both. §3e |
| **P4** | the development gap between cheapest and dearest is under 0.5 of one skill point | ✅ **HELD, BY A FACTOR OF EIGHT.** +1.11 / +1.14 / **+1.17** – the dear place buys **0.06 of one skill point** over four years. **The tier is not legible through her game and I am saying so rather than tuning until it is.** §3f |
| **P5** | the merit-only property survives | ✅ **held**, and the sweep is wider than before: every background x both nationalities x four incomes x four savings **x every tier**, mutation-verified |
| **P6** | the walk-on share does not move | ✅ **held at 0 of 53 on this population, in both arms.** ⚠ The "3 of 90" figure quoted in §0b is `ladder-baseline`'s 90-career battery, a different instrument; this one's 53 careers all reached at least one junior quarter-final |
| **P7** | the frozen MAIN capture does not move | ✅ **held – no re-pin.** And the three frozen careers moved by **exactly `schemaVersion`**: rolling v52 back to 51 on the new worlds reproduces all three old hashes byte for byte (`PRE_V52` in `tests/coach-travel-edge.test.ts`) |

### 3c. ⭐⭐ THE THREE PLACES, PRICED (n = 53, medians)

| place | price a year `[S]` | athletic | need | covered | **the family pays** | a week | full rides |
| --- | --- | --- | --- | --- | --- | --- | --- |
| **state** | $30,990 | **100.0%** | 0.0% | **100.0%** | **$0** | $0 | **29 / 53** |
| **national** | $50,920 | 58.5% | 0.0% | 72.2% | **$14,144** | $272 | 14 / 53 |
| **private** | $65,470 | 40.5% | 0.0% | 64.7% | **$23,128** | $445 | 7 / 53 |

**Against arm A**, whose single offer had one price and no choice:

| | **A** (the model replaced) | B state | B national | B private |
| --- | --- | --- | --- | --- |
| the family pays a year | **$8,539** | $0 | $14,144 | $23,128 |
| covered, median | 72.4% | 100% | 72.2% | 64.7% |
| free rides | 3 / 53 | 29 / 53 | 14 / 53 | 7 / 53 |

⭐ **Arm A's single offer sits almost exactly on the new NATIONAL place** (72.4% vs 72.2% covered).
The rebuild did not make college dearer or cheaper – **it put a $23,128 spread around the price that
used to be the only one**, and handed the player the dial.

⚠ **The need column reads 0.0% at the median at every tier, and that is round 21's own earlier change
showing up rather than a defect.** The means test reads the family's REAL position at enrolment
(income + savings over the shield), and by nineteen the median family's position is **$41,635 a
year** – above `noNeedAboveCents` ($35,000), so the layer pays nothing. It still reaches the families
below the knot; it no longer reaches the median one.

### 3d. ⭐⭐ WHICH PLACE THE POPULATION CAN TAKE – ⚠ OUR MODELS OF A PLAYER, NOT A MEASUREMENT OF PLAYERS

Nobody has played this build. What the table measures is what the population ALLOWS under a rule
stated out loud.

| model of a player | state | national | private | median $/week |
| --- | --- | --- | --- | --- |
| cheapest always | 53 (100%) | 0 | 0 | $0 |
| **dearest affordable** | 1 (2%) | 14 (26%) | **38 (72%)** | $392 |
| dearest always | 0 | 0 | 53 (100%) | $445 |

**The dear place is within reach of nearly three quarters of the population**, which is the finding
P1 got backwards. `affordable` is `familyPerYearCents <= income + savings/4`, and by the fork the
family's cushion is large: **min $18,774 · p25 $32,815 · median $41,635 · p75 $59,994 · max
$120,370** a year.

### 3e. ⚠⚠ THE ONE THING THE OWNER HAS TO RULE ON: THE DEAR PLACE CAN END THE CAREER

| place | affordable | ran out of money | **career ENDED inside the four years** | funds after, median |
| --- | --- | --- | --- | --- |
| state | 53/53 (100%) | 0/53 | **none** | $164,736 |
| national | 52/53 (98%) | 1/53 (2%) | **bankruptcy 1** | $116,844 |
| private | 38/53 (72%) | **11/53 (21%)** | **bankruptcy 6** | $64,903 |

**Arm A: 0 of 53 under water and 0 of 53 ended.** Before this phase the college branch could not end
a career; it can now, through the bankruptcy mechanic that was already there.

⚠ **This does not touch the owner's ruling of 16.08.** Nothing removes the college ANSWER – all three
places are on the card, at their price, and a family that cannot pay goes into debt. What is new is
that the debt can run to bankruptcy over four years, which is what «может пойти в долг» means when
the debt spell is a real mechanic. **It is reported rather than tuned away**, and §5 states the three
levers if he wants it softer.

⚠ **And the card charges what it quotes.** Over the first year, quoted against the ledger:
national **$14,144 quoted / $14,144 charged**, exactly; private $23,128 / $21,030, the gap being the
six careers that ended mid-year. (One year and not four, because `financeWeeks` is a rolling 60-week
window – a four-year sum off it reads a quarter of the truth and looks like an engine that under-bills.)

### 3f. ⚠⚠ THE DIMENSION I PROPOSED, AND THE HONEST ANSWER IS THAT IT IS TINY

| place | skill mean before | after | gain over 4 years | **vs the cheap place** | has a professional rank after |
| --- | --- | --- | --- | --- | --- |
| state | 58.59 | 59.88 | **+1.11** | – | 0 / 53 |
| national | 58.59 | 59.37 | **+1.14** | +0.03 | 0 / 53 |
| private | 58.59 | 59.39 | **+1.17** | **+0.06** | 1 / 53 (#998) |

**Paying $92,510 more over four years buys six hundredths of one skill point.** The mechanism works –
the gain really does climb with the squad, monotonically, and it is the engine's own tuned match
bonus doing it – but the AMOUNT is invisible, and P4 said so before the build for the right reason:
**at nineteen she is nearly out of headroom**. P5 measured the entire coached/un-coached gap over the
same four years at 0.12 points; this is half of that, which is exactly what a term of that size can
buy.

⭐ **AND IN THE OWNER'S OWN FRAME – "college costs 90% of what a coached year develops, so a strong
programme should cost less of it" – it does, and by almost nothing.** Against P5's coached
counterfactual (+1.177 over the same four years) the three places keep **94% · 97% · 99%** of it. The
loss the dear place saves her is **six per cent of a tenth of a skill point**. ⚠ That comparison is
across two runs at different commits, not a paired arm, so it is indicative; the paired figure is the
+0.06 above.

⭐⭐ **So "the chance of returning to the tour" is measured and it is FLAT: 0 / 53, 0 / 53, 1 / 53.**
She comes back off the professional list at every place, because she was off it walking in (P5 §2c) –
and no tier changes that. **The tier's real currency is money, not her game.** That is the answer to
the third dimension, and it is a measurement rather than a die.

---

## 5. WHAT IS THE OWNER'S TO DECIDE

1. **Should four years at the dear place be able to bankrupt the family?** 6 of 53 careers end there
   today and 0 did before. Three levers, none pulled: raise `fullAwardScore` at `private` (a bigger
   award), lower the `private` price (it is sourced – so no), or make the debt spell warn louder
   during the freeze.
2. **Is a 0.06-skill-point difference worth keeping as a dimension at all?** It is honest, it is
   monotone, and it is invisible. The alternative is college MATCH RESULTS (§4b item 1), which is a
   real build and would make the squad calibratable.
3. **The need layer now pays the median family nothing** (§3c), because it reads the family's real
   position and that position is large by nineteen. That was round 21's earlier change working as
   designed; whether the knots are in the right place on a population this wealthy is a separate
   question and this phase did not move them.

---

## 4. WHAT WOULD REPLACE OUR NUMBERS, AND WHAT IS DELIBERATELY NOT HERE

### 4a. The invented numbers, and the evidence that would retire each

| ours | what would replace it |
| --- | --- |
| **squad 55 / 65 / 75** | nothing published rates a college squad on our skill scale, and nothing will. The honest replacement is not a source but a CALIBRATION: play the three tiers against our own cohort and set the squad where a programme's median player actually sits. That needs college MATCH PLAY as results, which this phase deliberately did not build (§4b) |
| **recruiting bar 11 / 18 / 23** | a per-sport award distribution. §4 items 15 and 16 of `docs/research/college-and-the-junior-exit.md` are explicit that none could be sourced: no per-sport award figure exists and the share of programmes funding to their limit is unknown. Until one does, these are the measured quantiles of our own score and nothing better |
| **the dual-match season, 13 weeks at season weeks 4-17** | the real NCAA calendar. It is public and could be used; it was not, because the game's season week 0 is not January and mapping one onto the other is a calendar decision the repo has not taken |
| **1 / 2 / 3 matches a week** | the same calendar, plus a real dual-match count per division. ⚠ Note the cap: 3 saturates `ECONOMY.development.matchBonusCap`, so a truer number above 3 would change nothing without moving a constant this phase had no licence to move |
| **the affordability rule** (income + savings/4) | nothing external. It is the arithmetic a parent does, said out loud, and it is used for a FACT on the card and for a stated model of a player in the probe – never as a gate |

### 4b. Three things this phase could have built and did not, each for a reason

1. **College match RESULTS.** `matchesThisWeek` is a count fed to `growWeek` and nothing else: no
   `world.results` row, no rank, no prize. The sport awards neither ranking points nor money for
   college tennis, so a result row would break the `prizeCentsFor` invariant ("a result cannot award
   one without the other") to no purpose. It is also what would be needed to calibrate `squad`, which
   is the honest cost of the decision.
2. **A per-tier return-to-tour die.** §2c. It would override the career the player had.
3. **A coaching multiplier per tier.** The programme does coach her, and `coachWorksThisWeek` already
   returns false at college so the family is not billed. A second rate multiplier beside the match
   term would be **double-counting one fiction** – and P5 measured the entire coached/un-coached gap
   over these four years at 0.12 skill points, so it would have bought a third of nothing.
