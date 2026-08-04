# The endings and the album — W2-ENDINGS, shipped 2026-08-04

What career-contract-v1.md §4 and §9 became in code, and every number that was measured rather than
picked. The contract is the specification; this page is the receipt.

Bench: `npm run bench:endings` (`tools/endings-bench.ts`). All figures below are 9 presets × 10
seeds, fourteen to thirty-eight, unless a row says otherwise.

---

## 1. The shape

Six endings, one surface.

| # | ending | `CareerEndingType` | trigger |
| --- | --- | --- | --- |
| 1 | She stops at nineteen | `stopped` | the player's answer at the fork |
| 2 | College | `college` | the player's answer at the fork — **the only one that resumes** |
| 3 | Bankruptcy | `bankruptcy` | 12 consecutive weeks below zero and unable to fund the cheapest entry |
| 4 | The career-ending injury | `injury` | a fresh `severe` on a body that has already lost ≥ 20 weeks |
| 5 | The natural end | `natural` | her answer to the off-season offer, from 29; the last offer at 38 |
| 6 | The plateau | `plateau` | the same offer, asked early by a measured reading |

`'ending'` is a stop reason and it leads `STOP_PRECEDENCE`; `'fork'` and `'retirement'` are two more,
and both BLOCK the advance exactly as an undecided knock does. `guardNotEnded` is on every mutating
command. **`tickWeek` stays total** — no ended-world early return, because `replayMainState`
reconstructs the MAIN position by re-ticking a probe world and a probe that stopped mid-replay would
leave every recovered career on a wrong stream (`tests/ending.test.ts` pins the twin).

Schema **v39**: `ending`, `debtSinceWeek`, `careerTotals`, `fork`, `retirementOffer`,
`oneMoreYearCount`, `college`. One new `MilestoneType`: `break-even`.

---

## 2. The rates, measured

Two arms, because the split between #5 and #6 is a PLAYER CHOICE and not a game rate: «her words»
takes the plateau offer the moment it comes («не могу выйти в топ – уйду»), «plays on» refuses every
offer until the game stops asking at 38.

| ending | her words | plays on | median age |
| --- | --- | --- | --- |
| bankruptcy | 51.1% | 51.1% | 17 |
| plateau | 48.9% | 0.0% | 24 |
| natural | 0.0% | 41.1% | 38 |
| injury | 0.0% | **7.8%** | 31 |

The fork's other two answers are decisions rather than rates: on one seed per preset, **6/9 latched
`stopped`** and **6/9 took the scholarship and came back at twenty-two** (all six then went on to a
plateau ending). The other 3 never reached nineteen — the money went first, which is the game.

⚠ **`injury` is 0% on the «her words» arm and that is not a bug.** A career-ending injury is a
late-career event by construction: it needs a body that has already lost months. A player who takes
the plateau offer at twenty-four has stopped before the exposure exists. The denominator that means
anything is the careers that play long enough to have one.

---

## 3. Bankruptcy's N — swept and defended

adult-tour-and-endings.md B4: «N is a design decision, not an obvious one, and it should be measured
before it is picked.» It was swept against career-outcome-targets.md's own row — **«Family did not go
bankrupt, 14→18: 60-80% of all starts»** — on both bench entry policies, over that exact window.

| N | grinder: bankrupt / **survived** | careful: bankrupt / **survived** |
| --- | --- | --- |
| 4 | 60.0% / **40.0%** ✗ | 20.0% / **80.0%** |
| 6 | 50.0% / **50.0%** ✗ | 20.0% / **80.0%** |
| 8 | 37.8% / **62.2%** | 20.0% / **80.0%** |
| **12** | 25.6% / **74.4%** | 20.0% / **80.0%** |
| 16 | 16.7% / **83.3%** ✗ | 20.0% / **80.0%** |
| 24 | 15.6% / **84.4%** ✗ | 20.0% / **80.0%** |

Debt-spell distribution: grinder **median 4w, mean 10.8w, longest 146w** (182 spells); careful
**median 60w, mean 74.3w** (19 spells).

**N = 12, and three things pick it over 8.**

1. It is the only candidate that puts BOTH policies MID-band. N=8 leaves the reckless parent at
   62.2%, a rounding error from failing the target on a different seed set.
2. It sits between the two medians that matter: **three times** the reckless policy's median spell
   (4w), so it cannot fire on a wobble, and **a fifth** of the careful policy's median spell (60w),
   so it cannot miss a real collapse. Those two numbers are the bracket the grace window has to sit
   inside, and they are far apart — a family that goes under water carefully stays there.
3. It is exactly the window the Money screen already draws. `FINANCE_WEEKS` is «12w + a full 52w
   season» and the breakdown opens on "Last 12 weeks", so a family inside the grace period can see
   the whole of it on one chart. The warning phase B4 demands, with no new surface invented for it.

⚠ **The sweep is one pass, not six.** The arm runs with the latch disabled and records every spell
in full; "would N have fired" is then exact. What it cannot claim — how the rest of the career would
have differed afterwards — it does not claim.

⚠ **The second clause is redundant and is written out anyway.** «Unable to fund the cheapest entry»
is implied by «funds below zero» on every calendar this game can generate, because the engine's own
affordability test is `fundsCents >= entryFeeCents` and −1 ≥ 0 is false even for a free entry. It
stays because the contract words it that way, and because a rung that ever pays a player to turn up
would need it. `tests/ending.test.ts` says this out loud rather than pretending the clause bites.

---

## 4. The plateau's N

Swept without re-running: at every season wrap the reading is evaluated at 2, 3 and 4 seasons and
the first season each would have asked in is banked.

| seasons | careers asked | median season |
| --- | --- | --- |
| 2 | 50.0% | 10 (age ~24) |
| 3 | **48.9%** | 10 (age ~24) |
| 4 | 48.9% | 10 (age ~24) |

**N barely matters**, which is itself the finding: the reading is dominated by the age gate (24) and
by the drought, not by the window's length. 3 ships because it is the middle of a flat curve and
because two seasons without a new rung is a normal quiet patch rather than a plateau.

The reading is a conjunction and both halves are load-bearing: no rung cleared in the window, AND
her season-end ranks neither beat her best from before it nor wander more than 20 places inside it.
"No improvement" alone would fire on a career that is falling apart, which is a different story;
"inside the band" alone would fire on the quiet seasons of a nineteen-year-old about to break
through.

---

## 5. The career-ending injury — the specified rule was unreachable

P1 proposed «a fresh `severe` on a body with ≥ 2 prior `major`/`severe` entries» and predicted 1-2%
of careers. Instrumented on the arm with maximum exposure (90 full careers, plays-on):

| | rate |
| --- | --- |
| ever saw a fresh `severe` at all | 5.6% – 11.1% depending on policy |
| major-or-worse layoffs per WHOLE career | mean 0.37 – 0.64, max 4 |
| a severe with ≥ 1 prior major+ | **0.0% – 3.3%** |
| a severe with ≥ 2 prior major+ | **0.0%** |

It is not rare, it is impossible. `severe` is 2.5% of injuries and `major` is 7.5%; needing three of
them inside one career asks for a coincidence the injury model cannot produce.

**Re-aimed to WEEKS LOST: a fresh `severe` on a body that has already lost ≥ 20 weeks to injury.**
Measured at **7.8% of careers on the plays-on arm, median age 31**. It is reachable, and it is the
better rule anyway: physical rather than bookkeeping (a body that has already spent five months off
court), indifferent to which labels the severity bands happen to carry, and a number the epilogue can
print. Nothing the player chooses moves it, so it is a story and never a difficulty setting.

---

## 6. Slot 6 — the measurement the copy was written against

career-contract-v1.md §9.2 required this before the wording: *«the endings wave must run the crossing
over the bench presets and report the rate before the empty page's wording is written»*.

**«Break-even» names two events, and they are years apart.**

| crossing | rate | median |
| --- | --- | --- |
| a WEEK whose prize money beat that week's costs | **84/180 = 46.7%** | week 187 — age **17** |
| the CUMULATIVE crossing §9.2 asks for | **0/180 = 0.0%** | never |

At the end of a career: prize/spend **median 8.0%, mean 7.6%, best 22.9%**. 136 of 180 careers were
ever paid a cheque at all.

The week crossing lands at seventeen, which is where the owner watched his own career cross it — and
independently confirms the econ bench's own A4 measure (median week 126-182 on the 14→18 horizon).
The cumulative crossing does not happen. Repaying four to twenty seasons of junior and professional
investment out of prize money is a bar the shipped ladder's ceiling (~real #45) does not clear.

**So the empty page is THE COMMON CASE, and the copy says so without apologising for it.** Both
crossings are captured as milestones (`break-even:week` / `break-even:career`) because neither
survives the ledger's 60-week prune, and slot 6's empty face carries the week when there was one:

> *The week the money turned – it never came, and for almost nobody does it*
> **One week, it paid for itself**
> W17 '35 – and in the end $4,120 won against $61,000 spent

That is the game's own thesis arriving as a fact about her rather than as a claim on the box. It is
honest rather than consoling, which is the bar §9.2 sets.

---

## 7. The album (§9)

Seven polaroids, paged one at a time. Each page carries four things and no fifth: the photograph
(`portraitUrl(stage, emotion)` — the engine emits the two keys, the UI builds the URL), the caption
**on the polaroid's own bottom lip in the app's handwriting face** (`Polaroid`'s new `caption` slot),
one hard fact off the milestone, and — always visible, empty page or not — WHY this week is in the
album.

Slot rules are §9.2's own, with two departures, both stated:

* **Slot 1 is week zero, not «her first entered event».** Nothing in a save can answer the latter:
  `milestones` records only her first INTERNATIONAL entry, `events` prunes at 400 rows, `results` at
  the 52-week window, and `bestFinishByTier` records finishes rather than entries. A second
  `MilestoneType` would have bought it at the price of a field no migrated save could back-fill
  honestly. The page is the true beginning instead — she was fourteen and the family counted what it
  had — which is never empty and is the same page for every career, as a page called "The beginning"
  should be. Her first passport week rides on it as the fact when she ever had one.
* **Slot 5 has no empty face**, per §9.2's own 05.08 correction.

Underneath: the full scroll, every milestone in order, paged by season (§9.3), reachable from the
album's last page.

---

## 8. The hand-off (§5.6)

The epilogue ends with an OFFER. One tap to a new career, the next daughter generated automatically,
and exactly one question asked — the starting-capital fork onboarding already asks. Nothing
mechanical carries over: the button drops the in-memory career, which is the same seam MoreScreen's
own new-career flow uses, and the wizard takes it from there.

**A FRESH capital fork, not the mother's final balance** (the architect's recommendation, taken):
carrying her balance is exactly the meta-currency §5.6 rules out, and a family that ended rich would
open the next daughter's story with its central tension already resolved.

**`wasThereAChild(world)` exists and returns false.** Pregnancy is post-v1 (§5.4) so nothing on a v1
world can answer yes — which is precisely why the question is asked at the hand-off now rather than
retrofitted the day the system lands. §5.6's second sentence («если ребенка родила за игру – то
вполне может попробовать продолжить») made a lineage part of the contract; this is the seam that
keeps the door open.

---

## 9. College — the only ending that resumes

It latches like the other five (the album is shown, every mutating command refuses) and then the
hand-off's single button spends four years in one tap and clears the latch.

The four years are REALLY TICKED, not skipped: the cohort ages, the conveyor turns the field over
twice, and she keeps developing on the age curve because she is playing student tennis the whole
time. A `world.week += 208` would have handed back a world whose ranking table, calendar and rivals
were four years stale.

**She comes back with no ranking at all, and no rule was written for it.** She enters nothing for 208
weeks, so every result she owned ages out of the rolling 52-week window. §5.1's requirement, bought
for free; qualifying is what the ladder's own floor already gives her.

The family stops paying: coaching, gear, sponsor money and the academy review are all suppressed
across the freeze, and parent income and interest are not — so the balance recovers, which is the
economics of a scholarship and what makes the fork a real three-way choice.

⚠ **Every suppression is POST-DRAW.** The sponsor cameo still rolls and still draws its gift, and
only the payout is discarded — the same discipline the background clause it rides on already uses.
A player's answer at the fork therefore cannot move the MAIN sequence, which is invariant 2 and a
fairness property. `tests/ending.test.ts` pins a college twin against a do-nothing twin: same seed,
same weeks, byte-identical `rngMain`.
