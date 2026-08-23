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

## 3. The mechanic – ⭐ RE-CUT TO THE OWNER'S RULING, 22.08 (the form design is DEAD)

The owner ruled the model himself, in one sentence with his own worked example:

> «3млн призовые из них отчисляется процент дочери (скажем 30 для примера) и тренеру (скажем 10
> для примера) – это будет 900к дочери и 300к тренеру плюс остальные расходы»

...and on eligibility: «тренер может не ездить, но долю получать наверное за победы или 2е места
вполне может. За 2е только по-меньше». What ships (and SHIPPED, on `wave/staff-masseur`):

1. **A UNIVERSAL rule – no contract form, no choice at hire, nothing persisted per career.** The
   original §3.1 design (flat vs base+share, chosen at the market card, schema v60) is dead by his
   ruling; nobody rebuilds it. The share is computed at `finalizeTournament` from
   `ECONOMY.staffShare` and the finish, exactly like the kid's ramp – no schema move of any kind
   (verified: nothing persists beyond ordinary event/ledger rows).
2. **Results-stepped, not a cut of every cheque**: a TITLE pays `titleBps`, a FINAL pays half
   («за 2е только по-меньше»), below a final NOTHING – «за победы или 2е места», his words. The
   real convention (5–15% of everything, §1) was considered and his sharper version chosen.
3. **Rates** (`ECONOMY.staffShare`, tunable constants – the grid in the masseur spec §11 shows
   what they cost): coach `titleBps: 1000` / `finalBps: 500` – his own 10% example and its half.
4. **⭐ THE MASSEUR TAKES A SHARE TOO** – his ruling later the same day: «мне всё-таки кажется, что
   массажисту тоже можно за призовые месте давать бонус, может по-меньше чем тренеру, но давать,
   давай тоже сделаем». Same mechanism (`staffResultShareBps` / `staffPrizeShareCents` – ONE
   implementation, two takers), rates a third of the coach's: `titleBps: 300` / `finalBps: 150`.
   This SUPERSEDES the old step 3 ("one-off negotiated specialist title bonus"): what he chose is
   a standing percentage, smaller than the coach's, not a one-off.
5. **Both shares off the GROSS cheque, family pays, kid ramp untouched**: each share rounds once,
   the family keeps the remainder – `prize − kidShare − coachShare − masseurShare`, re-adding to
   the cheque to the cent (the round-23 #18 rounding discipline, now four hands on one cheque).
   On his Slam example at the age-22 rung: $900k hers, $300k coach, $90k masseur, $1.71M family.
6. **Pro tour only** (`track === 'wta'`), **independent of every travel switch** («может не
   ездить, но долю получать»), and only a FILLED seat – a self-coached family owes no coach share,
   an empty table no masseur share. Ledger: expense rows in the seats' own categories (`coaching` /
   `staff`), so the Money screen, the season wrap's coaching line and `careerTotals.spentCents`
   absorb them through `addEvent`'s one choke point – no second tally anywhere.
7. RNG: pure arithmetic at finalize – zero draws, the frozen MAIN capture cannot move (verified).

## 4. Engine seams (as built)

* `finalizeTournament` (world.ts, the prize block) – the one place a cheque lands; both shares are
  deductions beside it, after `kidPrizeShareCents`, same to-the-cent rounding discipline.
* `ECONOMY.staffShare` + `staffResultShareBps` / `staffPrizeShareCents` (economy.ts, beside the
  kid ramp) – the ONE share mechanism both takers call; a third seat asks the same function.
* **No schema move** – the v60 line above is retired with the form design: nothing persists.
* The season wrap and the Money screen itemise the shares through their own categories with no new
  code – `addEvent` is the one choke point that tallies `byCategory` and `careerTotals`.

## 5. Steps – re-cut to the ruling (22.08)

| # | step | status |
| --- | --- | --- |
| **1** | **the results-stepped share for the coach** – universal, title/final, at finalize | ⭐ **SHIPPED** on `wave/staff-masseur` (tests/team-share.test.ts reproduces his 3M example to the cent); measured in the combined grid, masseur spec §11 |
| **1b** | **the masseur's smaller share** – same mechanism, 3%/1.5% | ⭐ **SHIPPED beside it** – his same-day ruling; supersedes old step 3 (the one-off bonus): a standing percentage, smaller than the coach's |
| 2 | ~~sliding by depth~~ | DEAD – the ruled model IS stepped by finish (title/final/nothing); a deeper ladder is a retune of two constants, not a step |
| 3 | ~~one-off specialist title bonus~~ | SUPERSEDED by 1b – «массажисту тоже можно за призовые месте давать бонус … но давать» chose a standing share |
| 4 | tune the rates against the bench | the §11 grid carries the coach-%-of-prize "after" column against §2's table; rates are one-line retunes |

## 6. Rulings that closed the old questions

1. **Who pays** – the family; her ramp untouched; both staff shares off the GROSS (his own 3M
   arithmetic is exactly this shape).
2. **Форма контракта** – no forms exist, so nothing switches; killed by the universal rule.
3. **Junior prize money** – pro tour only (`track === 'wta'`); structurally free, since only W
   rungs carry `prizeCents` at all, and the gate is still written for the day that changes.

## 7. Sequencing – as it happened

Everything landed on `wave/staff-masseur` itself, by the owner's «в конце всё открытое по игровым
правкам в одну ветку собирай»: recovery variant C, the +1/+2/+3 dial, per-match tour pricing
($75 × matches – 7 at a Slam $525, 6 at a 1000 $450, 5 at a 32-draw $375), the return-week
session, and both prize shares – then ONE combined grid (masseur spec §11) measured the stack.
