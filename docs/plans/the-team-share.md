---
type: plan
status: draft
area: economy
canonical: false
last-reviewed: 2026-08-22
---

# The team share – a percentage of the prize money (owner, round 24, 22.08)

The owner asked whether the real tour pays accompanying specialists a share of winnings, read the
answer, and ruled: «отлично. Посчитай пожалуйста что у нас получается и сделай план работ по
внедрению процентов.»

## 1. The real convention, sourced (22.08 search)

* **The coach: yes, almost always.** Weekly base **plus 5–15% of prize money** (most commonly
  5–10%), and sliding scales by depth exist – the share climbs for SF/F runs. The canonical example:
  Ivanisevic under Djokovic, ~€6–10k/week base plus **10% of a Slam title's prize**.
* **Physio / masseur / S&C: salary people.** $80–150k/yr (physio), $60–120k (S&C) on the top tour;
  result bonuses exist but are negotiated one-offs, not a standing percentage.
* A full team runs $400–700k/yr, and the player pays every dollar of it – no club behind her.

## 2. What OUR numbers say – the flat coach is inverted against the convention

Measured on the owner's own two careers (round 23 ledgers) and the current price book:

| | Alice, 18 | Ines, 24 | real convention |
| --- | ---: | ---: | --- |
| prize / yr | $113k | $2,566k | – |
| coach, flat / yr | $6.4k | $24k | base + share |
| **coach as % of prize** | **5.7%** | **0.94%** | **5–10%** |
| whole team as % of prize | 57% | 8.6% | ~5–10% at the top |
| a 10% share would cost | $11.3k | $257k | the Djokovic shape |

⭐⭐ **THE PERCENTAGE FIXES BOTH ENDS OF THE MEASURED PROBLEM AT ONCE.** At Alice's stage the flat
coach already sits inside the real 5–10% corridor – nothing is broken there. At Ines' stage he is
**0.94%**: this project has measured three separate times that at the top «staff is a rounding
error» (the travelling-team plan §1, the advertising plan §3, the masseur grid – prize +$516k
against $270k of staff). A share self-scales: real money at the top, near-nothing for a struggling
family. It is the one price shape that stays a decision at every stage of a career.

## 3. The mechanic

1. **A contract FORM, chosen at hire** – the real convention is a choice, so it is one in the game:
   * **Flat** – today's contract, unchanged (and what every existing save keeps);
   * **Base + share** – a reduced weekly base (candidate: ~60% of the rung's bill) plus a share of
     every cheque (candidate: 10%), deducted at `finalizeTournament` beside the prize row, with its
     own ledger row. Exact base/share pairs are bench-tuned (§5), not guessed.
2. **The share is computed on the FULL cheque and paid from the FAMILY wallet.** ⚠ Open design
   question for the owner (§6.1) – the recommendation: the parent is the employer (the game's own
   premise), so her `kidShare` split (round 23 #18) is untouched and the family's side carries the
   whole coach bill, as it carries every other cost.
3. **Specialists stay salary people** – the masseur and the future psychologist take no percentage,
   which is the real world's own line. An optional later step gives them the real thing they do
   get: a one-off negotiated TITLE bonus (§5 step 3).
4. RNG: pure arithmetic at finalize – zero draws, the frozen MAIN capture cannot move.

## 4. Engine seams (named so nobody rebuilds them)

* `finalizeTournament` (world.ts, the prize block) – the one place a cheque lands; the share is a
  deduction beside it, after `kidPrizeShareCents`, with the same to-the-cent rounding discipline.
* `hireCoach` / the coach market card – the form is chosen where the coach is chosen.
* Schema: the form + share persist → **v60, the full 4-part move**, as its own wave AFTER
  `wave/staff-masseur` merges (that branch's v59 is already carrying the masseur; two schema
  streams never run in parallel – the standing rule).
* The season wrap and the Money screen already itemise coaching – the share joins the same rows.

## 5. Steps (each with a bench arm and predicted-vs-measured in a spec – invariant 4)

| # | step | done when |
| --- | --- | --- |
| **1** | **the coach's base+share contract** – both forms at hire, share at finalize, ledger row | A/B bench: at Alice's stage the two forms cost within noise of each other; at Ines' stage the share form reads 5–10% of prize; no bankruptcy spike; old saves untouched on flat |
| 2 | **sliding by depth** – the share climbs for SF/F/title finishes | the sliding form pays more for a title run than a flat share, measured, and the card says so in words |
| 3 | **the specialist title bonus** – one-off, negotiated, masseur first | a title week shows the bonus row; no standing percentage anywhere on a specialist |
| 4 | tune the base/share pairs against the bench | the corridor matches §2's table |

⚠ **STOP AFTER STEP 1 – it is a complete feature.** Steps 2–3 are flavour on a working mechanic.

## 6. Open for the owner

1. **Who pays the share** – §3.2's recommendation (family pays, her split untouched), or off the
   gross before the split (her career co-pays her team, which is also defensible)?
2. **May an existing career SWITCH forms?** Re-negotiation at re-hire is the cheap honest answer –
   the form is the coach's contract, and a new contract is a new hire.
3. **Does the share apply to junior prize money?** Junior cheques are small; the real convention is
   a pro convention. Recommendation: pro tour only, from the same gate the masseur uses.

## 7. Sequencing

After `wave/staff-masseur` merges (it owns v59 and the coach-market surface this touches), as its
own wave. The masseur's approved amendments (+1/+2/+3 bonuses, per-match tour pricing at $75 x
matches played – 7 at a Slam, 6 at a 1000 – the return-week session, the per-round relief question)
land on the staff branch FIRST, driven by the S3 measurement.
