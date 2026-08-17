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

⚠ **THE TABLE ABOVE IS 04.08 AND IT HAS DRIFTED – RE-MEASURED 13.08** (9 presets × 20 seeds, on the
run §10 below was taken from). Recorded, not corrected: re-arguing what the rates should be is a
balance conversation and the shape of it has changed, so it wants the owner rather than an edit.

| ending | her words 04.08 → 13.08 | plays on 04.08 → 13.08 |
| --- | --- | --- |
| bankruptcy | 51.1% → **59.4%** (median age 16) | 51.1% → **59.4%** |
| plateau | 48.9% → **17.8%** | 0.0% → 0.0% |
| natural | 0.0% → **10.0%** | 41.1% → **23.9%** |
| injury | 0.0% → **12.8%** | 7.8% → **16.7%** |

The one that overturns an argument rather than a number is `injury` on «her words»: the paragraph
above explains a 0% that is now 12.8%, so the plateau offer is no longer stopping her before the
exposure exists. `plateau` halving and `bankruptcy` rising are the same story from the other side.

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

⚠ **HALF-CORRECTED 04.08 by the fatigue-and-injury audit** (docs/specs/fatigue-injury-audit-2026-08.md
§7). «Nothing the player chooses moves it» is measurably false: the same 90 careers end on injury
**13.3% under the grinder entry policy and 3.3% under the careful one**. No knob the player picks
changes the threshold – that part stands, and it is what «never a difficulty setting» meant – but the
RATE is earned rather than dealt, which is the better property. The same audit swept N again on a
wider ladder and left it at 20; it also fixed the accumulator this rule reads, which was summing a
list the engine prunes to twenty entries (schema v40).

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

### 9.4 What is actually missing, brought up to date (13.08.2026)

The owner, 12.08: «т.е. у нас там ничего нет дальше при выборе «колледж»? может быть нам надо
какой-то шорт-кат сделать при этом выборе? типа экран "прошло 4 года"… И вилка «закончить» тоже
должна наверное что-то показать, какие-то результаты, а потом предложить начать заново». Task #102
was opened on that and never started. Re-reading the code first, because **half of it turns out to
exist**:

* **«Закончить» is BUILT.** `EndingScreen.vue` shows the album page by page, opens the scroll
  underneath for the player who wants the record rather than the story, and closes with the three
  background cards and a new daughter. That half of #102 needs nothing.
* **College is the black box.** `resumeFromCollege` ticks 208 weeks inside one call and writes ONE
  line: «Four years, a degree and no ranking at all. She is 23, and the only way back in is
  qualifying.» Four years of her life, one sentence, no screen.

**What those four years really contain, so the card can be honest rather than decorative.** She
keeps training and keeps developing, but WITHOUT the coach multiplier – `world.ts:1015` returns
false for the whole freeze, and the ledger line says why in her own world's voice: «At college – the
programme coaches her, not us». Meanwhile no coach bill, no gear, no sponsor review, no academy, and
parent income and interest keep running. So she comes back at twenty-three with a degree, a balance
that has recovered for four years, a body that was never raced, and no ranking.

⚠ **AND HERE IS THE DESIGN QUESTION THE SCREEN CANNOT DUCK.** `growth-age-curve-2026-08.md` measured
18→26 at **2.2 skill points** for the median career, and `ladder-vs-targets-2026-08.md` put the
wta250 door at #200 with 53.1% of careers clearing it over a WHOLE career. A twenty-three-year-old
starting from qualifying has neither the points nor the years. Before any screen is drawn, somebody
has to answer: **is the college return a playable second act, or a graceful way to end the career?**

Both are legitimate designs and they want opposite screens:

* **A second act** – then the return needs something to stand on (a protected entry for a season, a
  college record that counts for something at the door, or the fork moved later) and the card should
  read as a beginning.
* **A graceful ending** – then the card is a coda: the degree, the four years, the life she has, and
  the game says so plainly instead of handing her a qualifying draw she cannot survive. This is the
  cheaper and, on the numbers above, the more honest of the two.

Whichever it is, the shape of the screen is the same and is worth building either way: not four
years played out week by week – that is a second game – but **a short readable passage**: what she
did, what she gained, what it cost, and where she stands the morning after. The measurement in §10
says who ever sees it: 100% of careers that never got going, 50% of well-managed ones.

## 10. The college door – how often is it still there at nineteen? (measured 13.08.2026)

⚠ **The owner asked this in his own words and it had never been given a rate:** «т.е. если она
получает зачетный w75+ раньше 19 летия, то она не получит права идти в академию?» Yes, by design –
round-17 #6 made `collegeStillOpen` a precondition and `answerFork` re-validates it engine-side. The
full triage is `round17-triage.md` §B, which also settles that the ACADEMY is untouched by it: only
this one answer and the `college` card in the album are at stake.

What nobody had measured is how OFTEN the rule removes the answer, and that decides something real.
If the door is nearly always shut for a career worth playing, then slot 2 is close to dead content
and the fork's card is a two-way choice in a three-way layout.

The bench reports it now (`tools/endings-bench.ts`, ⭐ THE COLLEGE DOOR), off the sweep it already
runs – presets × seeds × policies, no extra careers simulated. Run below: 9 presets × 20 seeds,
`npm run bench:endings`, 28 minutes.

⚠ **The denominator is «reached the fork», not «started».** A family that went under at fifteen was
never offered anything, so counting it as "door shut" would blame the scholarship rule for the
economy. Both columns are printed so the gap is visible rather than taken on trust.

| arm | careers | reached 19 | door OPEN | of those |
| --- | --- | --- | --- | --- |
| grinder · latched (the shipped game) | 180 | 73 | 72 | **98.6%** |
| grinder · no-latch | 90 | 90 | 89 | 98.9% |
| player · no-latch | 90 | 90 | 45 | **50.0%** |

**⚠ THE ENTRY POLICY DECIDES IT, AND NOTHING ELSE COMES CLOSE.** The grinder – no reserve, no rest
floor, coach left at home – almost never loses the door: 72 of the 73 careers that got to nineteen
still had it. The `player` policy, which is someone actually managing the career (a season's runway
kept back, refuses to race worn out, takes the paid coach to the tournaments), loses it in **exactly
half** of careers. The reason is not subtle: the grinder is broke, so she never enters a W75 at all.

**The college door is therefore open mainly to careers that did not get going.** That is the finding,
and it is the opposite of what the fork's card implies by giving three answers equal weight.

### What shuts it, and when

| rung | careers | share of closures | median age | earliest |
| --- | --- | --- | --- | --- |
| `w75` | 120 | **95.2%** | 19 | **17** |
| `w100` | 5 | 4.0% | 18 | 17 |
| `wta125` | 1 | 0.8% | 22 | 22 |

126 of 360 careers ever lost the door; **47 of those lost it before the fork**, which is the only
half that costs her the answer. (The other 79 shut it at nineteen or later, after the card was
already answered.)

**⚠ AND IT IS NOT "SHE BECAME A PROFESSIONAL" – IT IS "SHE TURNED UP AT ONE W75".**
`ENDINGS.collegeClosedFromTier`'s own note says the opposite: *«AND IT IS A COUNTING RESULT, not an
entry. Playing a W75 and losing in the first round is a junior trying the tour.»* That is not what
the code does. `collegeStillOpen` is `TIERS[tier].points[finish] > 0`, and `TIERS.w75.points` is
`[75, 49, 29, 16, 9, 1]` – **the opening-round loser is paid a nominal 1**, so losing your first
match in a W75 main draw already spends the eligibility. Instrumented over 90 careers, the finish
index that actually shut the door:

| what she did at W75 | careers |
| --- | --- |
| **lost her first match** (finish #5, pays 1) | **12** |
| lost in the round of 16 (finish #4, pays 9) | 5 |
| reached the semi-final (finish #2, pays 29) | 3 |
| won it (finish #0, pays 75) | 2 |
| lost in the quarter-final (finish #3, pays 16) | 2 |
| won a W100 (finish #0, pays 100) | 1 |

Nearly half of all closures are the exact case the comment says is safe. And the tables disagree
with each other at the boundary: W15, W35 and **W100** pay the opening-round loser **0**, while W50,
W75, WTA125, WTA250, WTA500, WTA1000 and the slams pay ≥ 1 – so the same first-round loss keeps the
door at W100 and takes it at W75, for no reason anybody chose. The nominal 1 is a real 2026 chart
row (`calendar.ts`: «nominal 1 for the opening-round loser, as at every rung from W50 up»); it was
never meant to carry an eligibility rule.

### When it happens, and why that is the awkward part

> ⚠⚠ **BOTH HALVES OF THIS PARAGRAPH WERE REMOVED BY THE OWNER ON 16.08, AND IT IS KEPT AS THE
> RECORD.** `TIERS.w75.minAgeYears` is **14** now (the age grid is the sport's:
> [`college-is-its-own-branch-2026-08.md` §0a](college-is-its-own-branch-2026-08.md)), so W75 is not
> a rung that "first exists" at seventeen. And `collegeClosedFromTier` is gone outright, so there are
> no closures left to instrument: the college answer is on the fork card in 100% of careers.
> **The design question below – the SILENCE around a rule that spends something – was answered by
> deleting the rule**, and P4's warning went with it because it had become false.

`TIERS.w75.minAgeYears` is **17**, and 15 of those 25 instrumented closures land at exactly
seventeen – the first season the rung exists at all. Round-17's triage saw this coming and left the
question open:

> the design actively invites the result that closes the door, and nothing at seventeen tells the
> player that a good week there spends something. The precondition is correctly scoped; the SILENCE
> around it is a design question, and it is the owner's call.

This is that question with a number on it: **a well-managed career loses the third answer half the
time, usually at seventeen, and about half of those lose it by losing.** `ForkDialog.vue` then simply
does not draw the button – deliberately, so the card cannot be read as recommending – so the player
never learns the answer existed.

**For task #102 (the fork's exits need screens):** the college exit is genuinely reachable and worth
building for – 98.6% of grinder careers and 50% of managed ones still have it at nineteen, so it is
not dead content. What is worth deciding separately is whether a seventeen-year-old's first W75 entry
should say out loud what it costs.

### The ruling, and the re-measure that falsified my prediction of it

The owner read the above and ruled the same day: «чини дверь по набранному результату, а не по
единице, что бы это ни значило». Shipped as the finish test rather than a points threshold – the
door closes only on a rung where **she won a match** – because points thresholds differ per rung and
would drift with any table edit, while the opening-round slot is structural.

**I registered a prediction before re-running, and the sweep falsified it.** I expected the `player`
arm to rise from 50% to roughly three quarters, on the grounds that 12 of 25 instrumented closures
were first-round losses. Same sweep, same seeds, after the fix:

| arm | before | after |
| --- | --- | --- |
| grinder · latched | 98.6% | **100.0%** |
| grinder · no-latch | 98.9% | **100.0%** |
| player · no-latch | **50.0%** | **50.0%** – unmoved |

Careers that ever lost the door: 126 → **124** of 360. Lost it before the fork: 47 → **45**. Two
careers gained the answer.

**Why the mechanism is real and the effect is not.** The closures did not disappear, they MOVED: the
`w75` share fell 95.2% → 90.3% (120 → 112 careers) while `w100` rose 4.0% → **8.9%** (5 → 11), and
the median age of a `w75` closure slid 19 → **20**. A girl whose door used to shut on a first-round
loss now keeps it for a season or two and then loses it to a result she actually earned. The wooden
spoon was almost never the ONLY thing she did at that level – it was just the FIRST.

**So the fix is right for its own reasons and buys nothing in outcomes**, and both halves of that
belong in the record. The rule now means what its own comment always said, and the W75/W100
asymmetry is gone – but the finding above stands untouched: a well-managed career still loses the
third answer half the time, and it loses it to genuine professional results before nineteen.

**Which names the real lever, for whenever the owner wants one.** If college is to be a live choice
for a career that is going somewhere, the dial is `collegeClosedFromTier` (W75 is early – it opens
at seventeen, which is why the closures cluster there) or the age the fork is asked at. It is not
the wooden spoon, and it never was.
