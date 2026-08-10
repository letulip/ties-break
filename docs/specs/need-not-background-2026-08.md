---
type: spec
status: current
area: economy
canonical: false
last-reviewed: 2026-08-10
---

# The cameo gates on need, not on background – and the familiar brand writes last

Two owner rulings of 10.08, and the second one arrived because the first one has a hazard in it.

> «порог по деньгам на счету, а не по строчке в анкете – всё именно так, и с самого начала так и
> затевалось, в том числе и для 8к, я про это же и писал в своих раундах»

He is right about the history, and that is the whole point of this wave. `docs/rounds/round-7.md`,
24.07, records the original design in one line: *«спонсор нужде-ориентирован (платит только
working)»*. **The intent was need. The implementation was background** – taken as a proxy for need
because at the time the two coincided. They have since come apart, and
`docs/specs/round15-triage.md` measured how far.

---

## 1. What was wrong

`ECONOMY.sponsor` was `rollChance 0.06`, `amountCents [500_00, 1500_00]`, `eligible: ['working']`.
Over four seasons that is a median **$12,866 – 22.6% of a working family's parent income, fired for
50/50 careers** – against **$0 and 0/50 for `middle`**.

It silently repaid 44% of the difference between the two difficulty settings, with no cause, no
relationship and no player agency. It paid the owner's own career in week 2, before a ball was
struck (round-15 item 16).

## 2. The gate, and why it has the shape it has

`sponsorNeedMet` (`src/engine/world/sponsors.ts`) replaces the background list. Two rules.

### 2.1 A RUNWAY, not a dollar figure

A flat threshold is wrong for the same reason `ECONOMY.sponsorship` gives about the product-sponsorship
valve it replaced: **the weekly bill scales with the coach rung, the court that follows it and the
wealth corridor**, so the same $3,000 is most of a season to one family and a fortnight to another.
"Fewer than N weeks of the bill" is the same test everywhere and is background-blind by construction.

### 2.2 The COURT, not the whole bill – and this is the anti-exploit half

The owner named the hazard himself: a need gate rewards spending. Measured against the **total**
training bill it is real and large, because hiring up shrinks the runway *twice over* – it drains the
balance **and** inflates the unit the balance is measured in.

Measured against the **court** (`weeklyBillSplit().facilityCents` – the half she cannot get out of;
you cannot train without booking one, and it is charged at every rung including `self`) only the
first of those survives. And the first one is not an exploit: hiring an expensive coach genuinely
makes a family poorer, and a gate that could not see that would not be a need gate.

| cameo paid over 4 seasons, working background | self | budget | middle | ratio middle : self |
|---|---|---|---|---|
| gate on the **court** (N = 58) | $154 | $892 | $6,082 | **39x** |
| gate on the **total bill** (N = 28, matched payout) | $14 | $248 | $5,726 | **409x** |

The split that separates the man from the court was built in the split-the-bill wave for a different
reason. This is the second thing it turns out to be for.

### 2.3 …and above `middle`, nobody writes at all

> «у нас есть маркер трат в неделю, если тренер стоит дороже, то нечего и помогать»

A story rule before it is an anti-exploit one: a shop backs the girl whose family is doing this on a
shoestring, not the one that has hired the best coach in the city. Both of the owner's own careers –
8k self-coached, 25k middle – stay inside it.

**The cut is on the RUNG, not on weekly dollars**, and that matters more here than anywhere else in
the file. The corridor prices the same rung differently by background (`coachCorridorFactor`:
~0.7–0.8x working against 1.2–1.3x wealthy), so the price bands of adjacent rungs **overlap across
backgrounds** – a wealthy family's `middle` week can cost more than a working family's `high` week. A
dollar cut would refuse the wealthy family's ordinary coach and allow the working family's expensive
one: background back through the side door, in the one mechanic this wave exists to take it out of.
Pinned in `tests/economy.test.ts`.

## 3. Choosing N – 62, and the band it is the middle of

`tools/runway-probe.ts` is the instrument. It re-derives the engine's own quantity rather than
guessing: `resolveBaseCosts` is the first thing `tickWeek` does, so at the moment the cameo is
decided the balance is exactly (funds at the top of the week) − (this week's bill). The corridor
comes off the same deterministic `seed:coachbg:<week>` sub-stream the engine reads.

Three walls, all numbers:

| wall | value | why |
|---|---|---|
| **not under ~58** | crossover 55–56 | below it the gate pays the `middle` background MORE than `working` and the difficulty setting inverts. It is the corridor doing it – a middle-market court costs more, so the same balance buys fewer weeks of it. What puts working back on top is the thing that should: it opens the game $17,000 poorer. |
| **not over ~68** | self cells cross 2% at 72, 10% at 90 | above it the two SELF-COACHED cells start collecting it, and they are the definition of a family that does not need it: they finish four seasons at **+$25,626** and **+$39,001** and neither goes under water once in 50 careers. |
| **never over 81** | worst week-0 runway 81.5 | **nobody is in need before a ball is struck.** That is round-15 item 16 in one number, and it is the only wall here that is a correctness condition rather than a balance preference. |

**62 is the middle of [58, 68].** `tests/economy.test.ts` asserts it stays inside that band, so a
future retune has to move this measurement with it.

⚠ **62 court weeks are not 62 money weeks.** The court is roughly a quarter of what a family actually
spends in a week (measured: $77 of a $335 week self-coached, $92 of $357 with a middle coach), so the
gate opens at nearer 15 weeks of the real burn.

⚠ **The bench understates real exposure.** `POLICIES[1]` keeps a $5,000 reserve and stops entering
below it, so the self-coached cells are artificially safe. A player who enters everything will dip
under the gate more often than these numbers show.

## 4. The gradient per rung – the test of whether hiring up buys charity

`tools/runway-probe.ts --mode rungs`, 30 seeds x 4 seasons. **% of decided weeks inside the gate**,
court denominator, at N = 60 / 64 bracketing 62:

| rung | working | middle | weekly bill (working) |
|---|---|---|---|
| self | 1% / 2% | 1% / 1% | $77 |
| budget | 9% / 14% | 17% / 19% | $117 |
| middle | 53% / 60% | 38% / 39% | $190 |
| ~~high~~ | ~~99% / 100%~~ **cut → 0** | ~~61% / 62%~~ **cut → 0** | $299 |
| ~~elite~~ | ~~100% / 100%~~ **cut → 0** | ~~65% / 68%~~ **cut → 0** | $452 |

**The gradient below the cut is real and is not removable.** Stated plainly rather than argued away:
hiring up still raises the chance of the cameo, not because the unit moved but **because the family
is poorer** – and a need gate that could not see that would not be a need gate.

What *is* removable is the **price** of the gradient, and it is measured. Working background, over
four seasons:

| step | extra bill paid | extra cameo received | return |
|---|---|---|---|
| self → budget | $8,320 | $1,196 | **14c on the dollar** |
| self → middle | $23,504 | $6,830 | **29c on the dollar** |
| middle → high | +$22,672 | **−$6,082** (loses it entirely) | **the cliff** |

Nobody farms an instrument that pays 29 cents on the dollar and then confiscates itself. And that is
before `round15-triage.md`'s finding that the coach is a net negative on every measured axis anyway
(−$20,173 and −27 prize careers at 8k). It is a **chance**, not a payment, so it cannot be farmed
even in principle.

## 5. Before and after – `tools/two-cells.ts`, 50 seeds x 4 seasons, `player` policy

| cell | end funds | ever under water | cameo (median, careers) | cameo % of parent income |
|---|---|---|---|---|
| **8k · self-coached** | $25,626 → **$12,643** | 0/50 → 0/50 | $12,866 (50/50) → **$0 (11/50)** | 22.6% → **0.0%** |
| **25k · middle coach** | $5,943 → **$7,403** | 0/50 → 0/50 | $0 (0/50) → **$3,794 (46/50)** | 0.0% → **3.8%** |
| **8k · middle coach** | $5,453 → **$5,330** | 1/50 → **2/50** | $12,866 (50/50) → **$7,989 (50/50)** | 22.6% → **14.2%** |
| **25k · self-coached** | $39,001 → **$39,166** | 0/50 → 0/50 | $0 (0/50) → **$0 (1/50)** | 0.0% → 0.0% |

Movements worth naming beside the money: 8k self-coached spends $69,697 → $63,136 and its prize money
falls $10,060 → $6,065 (it can afford fewer good draws); 25k coached spends $121,553 → $128,560, its
prize money rises $0 → $2,680 and its ITF rank moves #56 → #51.

### The three ship rules, judged

**1. Fires for some `middle`, and more for `working` – PASSES.** By careers: working 61/100
(50 coached + 11 self), middle 47/100 (46 coached + 1 self). By money the gap is wider still. The
gate has not become wealth-blind.

**2. The outcome gap between backgrounds must not invert – PASSES.** 25k self-coached ends
**$39,166 against $12,643** – 210% richer, against 52% before. Not inverted; **widened**. The
difficulty setting now means considerably more, which is what the owner asked for
(«а надо как-то чтобы более сложно было»). Worth his eye: it is a big move, and it is the $12,866
`round15-triage.md` identified as unearned coming off the easier setting.

**3. Nothing may make the coached cells better off – ⚠ FAILS, on one of the two cells.**

* 8k coached is **worse off**: $5,453 → $5,330, and under water 1/50 → 2/50. ✔
* 25k coached is **better off by $1,460**: $5,943 → $7,403. ✘

**No threshold in the admissible band avoids this, and the reason is structural rather than a tuning
miss: the 25k coached cell is the poorest cell in the 2x2, and a need gate that cannot reach the
poorest cell is not a need gate.** It is also not "the subsidy quietly paying for the coach" in the
sense the rule was written to prevent – the coach costs roughly $52,000 over four seasons and the
cameo returns $3,794 of it, 7%, while the cell's end funds remain pinned near the bench's $5,000
reserve. What the money actually buys there is **entries** (96 → 97) and **ranking** (#56 → #51).

It is also, precisely, the complaint that started round 15: his 8k self-coached career against his
25k coached one was **$25,626 : $5,943, 4.3x**. It is now **$12,643 : $7,403, 1.7x**.

**Reported, not smuggled. The owner's ruling is wanted before this is called settled.**

### ⚠ RULED, 10.08: the rule was wrong and is withdrawn

The owner: «снимай правило или делай менее жестким». **It is withdrawn, and the fault is in how it
was written rather than in what the build did.**

I wrote rule 3 to guard against one specific failure – *the subsidy quietly paying for the coach* –
and then expressed it as "nothing may make the coached cells better off", which is a much larger
claim. Those two are not the same rule, and the difference is exactly the case that fired: a cameo
returning **7% of a coaching bill** to the poorest cell in the grid is not paying for a coach. The
rule as written forbade help reaching the family most in need of it, which is the opposite of what
the mechanic is for and the opposite of what rule 1 demands.

**The replacement, and it says what rule 3 meant to say:**

> **3'. The cameo may not return a material share of a coaching bill.** Measured as the cameo's
> season total against the coach's season total, at every rung below the cut. **Ship at ≤ 15%;
> today it reads 7% on 25k-coached and 0% on both self-coached cells** (they pay no coaching bill,
> so the ratio is undefined rather than favourable – state it that way, do not report a zero as a
> pass).

This is falsifiable, it is denominated in the thing the original fear was about, and it stays red in
the case anybody actually worried about: if a future re-pricing made the cameo worth a third of a
coach, 3' fires and the old rule would not have, because that world could easily leave "better off"
false while the subsidy became real.

⚠ **A ship rule withdrawn after it fires needs its reasoning in public**, which is why this is an
appended section rather than an edit to the rule above. The failed reading stays visible: a rule
that was too broad and fired correctly against its own wording is a different artefact from a rule
that was wrong about the world, and only the first can be safely replaced.

## 6. The renewal – a letter, at the END of the window

Owner, 10.08, confirming the shape: renewal is **a letter, not an automatic re-signing**, new letters
still arrive, and the five-week window stays.

**Why it must be last, and it is a real trap.** `seasonSpokenFor` enforces "the season ahead may be
promised to ONE brand", so the moment a letter is *signed* every other rung is turned away for as
long as its term runs and `raiseKitOffers` stops writing. A renewal offered on the window's opening
week would therefore let the shop in her home town crowd out the global brand that would have written
on week three – the exact inversion `windowLadder` exists to prevent, and **worse** than the
weakest-first ordering that argument was written against, because the incumbent is the letter a
parent is likeliest to sign on sight.

So `raiseKitRenewal` lands on the window's **closing week** (offset 51), after all four rung slots
(47–50) have had their turn. It is the last letter she can still take, and taking it is always a
choice made with every other letter of the winter already on the table.

| property | how |
|---|---|
| the placement | `isSponsorWindowCloseWeek`, enforced in the function **and** at the call site |
| no dice | `shopWritesAt` is not consulted; zero draws on any stream, main or scoped |
| no table | `standingClears` is not re-run – a girl who has slid out of every rung's gate still hears from the brand she has been with |
| refusable | an ordinary `open` kit offer: sign, refuse, or let it expire with the window |
| one brand at a time | `seasonSpokenFor` – a signature already given answers the incumbent |
| a let-down does not renew | `letDownThisWindow`, read off the goodbye letter the review already posted |
| same paper | terms copied verbatim from the ending contract, `renewal: true` the only addition |

⚠ **The closing week is still "the parent's own".** `SPONSOR_LETTER_WEEKS` reserves it so no *rung's*
turn falls there; a renewal is not a rung's turn but the relationship he is already in. Its deadline
is the window's own close, which on that week is today – the feed row says so out loud for that
reason.

⚠ **It is not a floor under the dice** (explicitly out of scope, owner 10.08: 19.4% of seasons opening
with no kit deal stays as it is). Nothing here manufactures a *first* deal. A renewal exists only
where a deal already existed, was signed by the parent, and was honoured on both sides.
`offerChance` is untouched.

## 7. Schema

**Not bumped – still 45.** `KitOfferTerms.renewal` is additive and optional, the same move
`EntryLetterTerms.releasedBy` shipped as (and the `entry` letter family before it, commit `2763caa`).
An old save's letters simply lack it and render exactly as they did; there is nothing to back-fill,
because before this wave no letter was ever a renewal.

## 8. What was measured with what

* `tools/two-cells.ts` – the 2x2 (background x coach), 50 seeds, four seasons. Same instrument
  before and after; only its banner line changed, because the field it printed no longer exists.
* `tools/runway-probe.ts` – **new**, and it exists to size one number rather than have it picked. Two
  modes: `cells` (the same 2x2, runway distributions and gate sweeps on both denominators) and
  `rungs` (background x every coach rung, which is the gradient test in §4).

⚠ The probe cannot see the week's ±8% jitter without spending a MAIN draw, so it quotes the bill at
the middle of that band – worth at most half a week of runway at these thresholds, and it moves
numerator and denominator together.
