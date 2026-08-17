---
type: specification
status: current
area: simulation-and-balance
canonical: false
last-reviewed: 2026-08-16
---

# The age-eligibility rule: the window, the merited increases, the sub-cap and the cohort

**P2 of `docs/plans/college-and-the-junior-ladder.md`, on the branch `wave/round21`, immediately after
P1 (`docs/specs/junior-access-2026-08.md`).**

> **THE PHASE IN FIVE LINES.** The rulebooks count a teenager's allowance **birthday-to-birthday**;
> we counted it by season block while reading the limit off her age, so every girl not born in the
> first week of January had her birth year straddling **two** allowances. Measured on this branch
> before anything moved: **19.0 professional events in her sixteenth year against a limit of 12.**
> After: **10.8.** The phase also ships the merited increases, the 14-year-old's W75+ sub-cap, the
> owner's ruling of 16.08 on `w15.minAgeYears`, and both budgets on the planner. **Zero schema: v49
> unmoved, no migration, no fixture.**

---

## 0. THE PREDICTIONS

Invariant 4. The ruler is `tools/ladder-baseline.ts` – P0's frozen battery – so every column below is
comparable with `docs/specs/ladder-baseline-2026-08.md`. n = 90 (9 presets x 10 seeds), 676 weeks
(13 season blocks, ages 13.6 → 26.6), `POLICIES[1]`.

⚠ **THE BASELINE ARM IS THIS BRANCH, NOT P0's TREE, AND BOTH ARE REPORTED.** P1 landed between them
and moved the ladder a long way (first W75 17.2 → 19.0), so a P2 diff taken against P0 would be
measuring P1. The "before" column here is `tools/ladder-baseline.ts` run on `4d49fc3`, the commit this
phase starts from; P0's own numbers are carried alongside so the whole chain stays legible.

| # | claim | predicted |
| --- | --- | --- |
| P1 | pro-family entries in her sixteenth year | 19.0 → at or under the rulebook's 12 |
| P2 | pro-family entries at 17 | roughly unchanged (14.8 against a limit of 16 – the cap was not binding there) |
| P3 | what she plays instead at 16 | the junior rungs take it back – `tierOutgrown` re-opens them when the pro allowance is spent |
| P4 | the merited increases | near-inert: both gates are top-5/top-20 junior lists that 1-4 careers of 90 reach |
| P5 | the W75+ sub-cap at 14 | **cannot bind at shipped constants** – W75 opens at 17 – so it ships as a rule with a measured zero |
| P6 | the cohort | to be decided by measurement, not by build – see §4 |
| P7 | `w15.minAgeYears` 16 → 14 | opens the two-tour overlap to 14-18 and gives back some of the W15 volume P1 moved her onto |
| P8 | rank at 19 / 21 | worse at 19, converging by 21 – the same delay-not-tax shape P1 measured |
| P9 | the boredom guard | must stay green; a cap that leaves a week empty moves the numbers before it ships |
| P10 | survival | unchanged (0 bankruptcies before, 2 careers of 90 ending early on injury) |

---

## 1. THE LEAK, AND THE SOURCE THAT SETTLES IT

`docs/research/retirement-and-withdrawal.md` §6, quoting ITF Juniors Appendix F, is explicit that the
allowance is *"counted birthday-to-birthday, not by calendar year"*. The WTA's §X.A.2 rows are the same
shape. `entryCaps.ts` argued the season block was close enough; the argument was that both are one year
long, and it is preserved verbatim in the file rather than deleted.

**It is not close enough, and the gap is exactly one extra allowance.** With the window on the season
block and the limit on her age, a June girl's sixteenth year runs from her June to the next June and
crosses New Year in the middle – so it contains the *tail* of one twelve-entry allowance and the *head*
of the next. P0 measured 18.8 against 12; this branch, after P1 pushed her onto W15, measured **19.0**.


**THE FIX IS A COMPARISON, NOT A BOUNDARY.** Both allowances now ask *"is this ledger row inside the
same age-year as this event?"* – `kidAgeAt(row) === kidAgeAt(event)` – read off the ONE clock
(`world/age.ts`, the ruling of 09.08) that also picks the limit. There is no second spelling of a
boundary to drift, and the two properties the old comment protected both survive, one of them
strengthened:

* **inside** a window the limit is now **constant** rather than merely non-decreasing, so an entry she
  was allowed to make can never be retro-invalidated by a later question;
* **across** windows it is still non-decreasing, because the table is monotone in the age.

⚠ **AND IT IS STILL ASKED OF THE EVENT'S WEEK**, never of today's – the R10-17 rule the caps already
obeyed. A December horizon full of next season's fixtures must be judged against the allowance those
fixtures are in.

⚠ **THE PRUNE HAD TO LEARN BOTH YEARS.** `pruneInternationalEntries` dropped rows before
`seasonStartWeek(world.week)`; after P2 the age window reaches back across New Year, and
`quotaPlayedIn` (the tour's six-500 commitment, `world/mandatory.ts`) still counts the season block.
The prune therefore takes the **earlier** of the two, so neither rule can lose a row the other needs.

---

## 2. THE MERITED INCREASES – and the blocker that was removed somewhere else

`ECONOMY.entryCap` recorded why they were left out: *"top 20 of the ITF has no defensible mapping onto
top 20 of 200 without an owner decision about what our standings represent."* **That comment is updated
rather than deleted, because the blocker was real and was removed by P1.** `junior-access-2026-08.md`
built `yearEndJuniorRank` – a read of persisted history – and keyed `ACCELERATOR` on the regulation's
own **absolute** rows (1 / 2 / 3 / 4-5 / 6-10 / 11-20). The decision has therefore been taken and
shipped; the merit rows read the same function on the same convention, and inventing a second mapping
here is exactly what the old comment was warning against.

⚠ **THE ONE PLACE THE CONVENTIONS DIFFER IS STATED.** `JUNIOR_RESERVED` resolves W15's door as a
*fraction* of the table, because that door had a shipped difficulty to hold through a change of unit. A
merit bonus has no difficulty to hold: it is additive and can only ever be generous.

**What shipped** (`ECONOMY.entryCap.meritIncrease`, sourced line for line):

| rule | source | row |
| --- | --- | --- |
| ITF | Appendix F | 13 → +4 if year-end junior top **50**; 14 and 15 → +4 if top **20**; nothing at 16+ |
| WTA | Pro Path | +4 professional events, earned by year-end junior top **5** **or** direct acceptance to a Slam / WTA 1000 |

⚠ **A BONUS MAY NEVER FALL INSIDE A WINDOW, and that is what shapes both arms.** The limit is what
refuses an entry, and `tierOutgrown` reads `remaining <= 0` to re-open the rungs below her – so an
oscillating limit would flicker the whole ladder on and off. Both arms therefore read a **banked
year-end row** and never a live rank, and take the **best of the rows current at any point in the
window**. An age year straddles at most one season boundary, so that is at most two rows; the result is
monotone by construction, resets with the window, and lands on the same generous side as the age table
(the limit rises on her birthday, and rises again when a season she finished well closes inside her
birth year).

⚠ **"DIRECT ACCEPTANCE" IS THE RUNG'S OWN CUT**, `TIERS[t].acceptsRank` for the tiers the knob names,
never a copied number – so a phase that re-tunes those lists moves this rule with it. Same discipline
as `ECONOMY.mandatory.perEventTiers`.

⚠ **THE 13 ROW CANNOT FIRE IN THIS GAME AND SHIPS ANYWAY.** Her thirteenth year runs from week 0 to her
birthday, so no season has wrapped and there is no year-end list to be on. This is the same choice
`proPerYearByAge` already records for 14 and 15: the game does not invent a number where the calendar
makes the rulebook's row unreachable, and the day a career opens earlier the row is already right.

⚠ **`yearEndJuniorRank` MOVED FILE.** It is a five-line read of `world.seasonHistory` with no ladder
dependency, and `world/entryCaps.ts` – which owns the Accelerator table it feeds – is imported *by*
`world/ladder.ts`. Reading it upward would have been a runtime cycle and copying it would have been the
second read the design forbids, so it moved down and is re-exported from `ladder.ts` under its
historical name. It gained one optional `week` argument; no existing caller passes it.

---

## 3. THE SUB-CAP AT FOURTEEN, AND WHY A ZERO IS THE HONEST RESULT

WTA §X.A.2, quoted in `docs/specs/acceptance-cuts-2026-08.md` line 145: **at most three of a
fourteen-year-old's eight professional entries may be at W75 or above** – *"a quota, not a door"*. It
ships as a real gate, immediately after its parent allowance in `availabilityStatus`, with a refusal
that names the rule and says the smaller rungs stay open.

**It cannot bind at the shipped constants, and that is measured rather than assumed.** W75 opens at 17
and no W rung above W15 opens below 16, so a fourteen-year-old's count of W75-or-above entries is
structurally zero. The last test of `A3c` walks every rung at or above the quota's floor and asserts
the age gate shuts it to a fourteen-year-old – so *"it cannot bind"* is a **checked claim**, and the
day a phase opens one of those rungs lower it goes red and the quota becomes live machinery.

> ### ⚠⚠ THAT DAY WAS THE SAME DAY, AND THE TRIPWIRE FIRED AS DESIGNED
>
> The owner's age-grid ruling of 16.08 put `w75.minAgeYears` at **14**, so the paragraph above is now
> false in its premise – *"W75 opens at 17"* – and true in the thing it was written to guarantee. It
> is kept because it is the reason `A3c` existed to catch this. **The quota is live machinery**: the
> test's last case was re-aimed rather than deleted, and the code says so at
> `proSubCapUsage` (`src/engine/world/entryCaps.ts`) with the old text above the line reversing it.
>
> ⚠ **And it still measures zero, for a different reason** – `w75.acceptsRank` is #300 and she holds
> no professional ranking at fourteen, so the gate moved from the doorway to the acceptance list. The
> season-ledger limitation named below is therefore reachable in principle and unreached in practice.
>
> Grid, stated once:
> [`docs/specs/college-is-its-own-branch-2026-08.md` §0a](college-is-its-own-branch-2026-08.md).

⚠ **ONE STATED LIMITATION, WITH ITS FIX NAMED.** The count is folded off `world.seasonEntries`, which
is a **season** ledger, because `proEntryWeeks` records a week and no rung – so a birth year that
straddles a wrap sees only its post-wrap half. Three things make that proportionate: the under-count
is the **generous** direction (a sub-cap that forgets never invents); the rule cannot fire at all
today; and the fix is written down – give the pro ledger a tier, which is a save-schema three-part
move. Buying a schema bump for a rule that cannot fire would be machinery bought on speculation.

---

## 4. THE COHORT – the plan's larger half turned out to be a measurement

The plan warned: *"if only the kid is capped she is uniquely handicapped… this may be the larger half
of the work."* **Checked before building, and there is nothing to build.**

`npx vite-node tools/aer-cohort.ts --seeds 3 --weeks 312`, folding `world.results` – one row per
entrant per draw for every live cohort player – over each season:

| her age | player-seasons | mean W entries | max | AER row | over it |
| --- | --- | --- | --- | --- | --- |
| 16 | 39 | 3.0 | 7 | 12 | **0** |
| 17 | 66 | 2.5 | 11 | 16 | **0** |
| 18 | 69 | 3.1 | 12 | – | 0 |
| 19 | 57 | 5.7 | 19 | – | 0 |
| 20+ | 81 | 8.5 – 12.0 | 20 | – | 0 |

**0 of 312 player-seasons exceed the AER row for that player's age**, and nobody under 16 entered a
professional draw at all.

**WHY IT IS STRUCTURAL.** A W draw's universe is `universeForTier` = the live cohort **plus** the field
pros, and the pros are derived adults who carry no persisted row and no age rule. A live junior reaches
a professional draw two ways: through `selectEntrants`' percentile band, where a player with no W points
sits at the back of the merged table, and through `fillOnRamp`, which holds `ON_RAMP.slots` – **two of
thirty-two** – per event behind the rung's own acceptance door. Neither route can hand one player a
season.

⚠⚠ **AND THE ASYMMETRY RUNS THE OPPOSITE WAY FROM THE PLAN'S FEAR.** Before P2 the kid played **19.0**
professional events in her sixteenth year against the cohort's mean **3.0**. She was not handicapped by
the cap – she was six times outside it, in a world where everyone else already obeyed it. After P2 she
plays **10.8** against their 3.0. **The rule brings her towards the field, not away from it.**

What ships is therefore the measurement plus a guard (`tests/aer-cohort.test.ts`), whose bound is the
engine's own `annualProEntryLimit` and whose age floor is the tier catalogue's – so the ruling in §6
re-measures it instead of outliving it.

---

## 5. BOTH BUDGETS, ON THE PLANNER, BEFORE THEY ARE SPENT

`docs/specs/act2-pro-tour.md` §5 asks for this in one sentence – *"The player sees the budget: «pro
entries this season: 9 of 12» on the planner, and the refusal names the rule"* – and **only half of it
had shipped**. The professional counter has ridden every W card since round-17 #2; the ITF one appeared
only on a card the cap had **already refused**, which is the fuel gauge that lights up when the tank is
empty. A junior season is where the budget is tightest: fourteen international events at fourteen,
against a calendar that offers far more.

`junior entries N / M` now rides every ITF card on the same terms: the engine's own per-event figure,
read at the **event's** week, silent once the row is unlimited. The two families are disjoint
(`isCappedTier` / `isCappedProTier`), so **exactly one chip can ever be on a card** – asserted rather
than hoped, because `.controls` wraps and a second pill would be a second line nobody signed off. Both
tooltips now say the year runs **birthday to birthday**, which is what §1 made true.

⚠ **A GUARD WAS RE-AIMED AND THE RE-AIM IS ITSELF A FINDING.** `round16-surfaces.test.ts` asserted that
a card in the **next season** prints a lower `used` – i.e. that the ledger resets at New Year. After §1
it resets on her birthday, and this fixture's eight-week horizon crosses the season boundary **without**
crossing it. The test now states the property round-17 #2 actually exists to protect – *every card's
figure is the engine's answer about that card's own week* – which is stronger than the season-boundary
proxy and survives the next change of window. The old intuition is kept as an assertion so the next
reader meets the fact rather than the habit. Mutation-proved in both directions.

---

## 6. ⭐ THE OWNER'S RULING OF 16.08 – `w15.minAgeYears` 16 → 14, AND WHAT IT COSTS THE PILLAR

**Verbatim:** «мы же вроде наресерчили четкую возрастную сетку с количеством доступных турниров
каждого тира на каждом возрасте, мне кажется надо использовать.»

He is answering P1's own note, which recorded 16 as a **deliberate** deviation from the sport's 14+:
*"⚠ `minAgeYears: 16` IS UNCHANGED AND THE DEVIATION IS DELIBERATE"* (`junior-access-2026-08.md`
§2a). His ruling is to use the researched grid, and the grid is real, sourced and already in
`ECONOMY.entryCap` – the ITF junior-reserved place at W15 is **age 14+**, and the WTA's own AER rows
start at 14 precisely because a fourteen-year-old *can* play a professional event. **Shipped: 14.**

### ⚠⚠ 6a. THE COLLISION, STATED RATHER THAN DECIDED

`docs/specs/adult-tour-and-endings.md` §4.1 makes the two-tour overlap load-bearing – *"a
sixteen-to-eighteen-year-old holds both tours at once and arrives at nineteen having seen what each
one costs and pays"* – and its own body is blunter still: *"a J30 field is juniors and a **W15 field
is adults**"*. Opening W15 at 14 widens the window to **14-18** and puts fourteen-year-olds in a draw
that spec calls an adult one.

**Neither silently discarded nor silently kept. Measured** (`npx vite-node tools/two-tour-overlap.ts`,
careers that entered at least one event of EACH family in that year of her life):

| her age | both tours, BEFORE (`minAgeYears` 16) | both tours, AFTER (14) | mean W entries before → after |
| --- | --- | --- | --- |
| **14** | **0 of 27 (0%)** | **7 of 27 (26%)** | 0.0 → **1.7** |
| **15** | **0 of 27 (0%)** | **18 of 27 (67%)** | 0.0 → **6.1** |
| 16 | 24 of 27 (89%) | 25 of 27 (93%) | 10.4 → 11.0 |
| 17 | 25 of 27 (93%) | 24 of 27 (89%) | 14.9 → 14.7 |
| 18 | 17 of 27 (63%) | 14 of 27 (52%) | 22.5 → 21.1 |
| 19 | 0% – the junior tour is over | 0% | 12.7 → 12.2 |

n = 27 careers x 312 weeks, identical seeds, the arm run in a worktree at `53223b3` (the commit
before the ruling) so the diff is the RULING and nothing else.

**THE OVERLAP WIDENS EXACTLY WHERE THE RULING SAYS IT SHOULD AND NOWHERE ELSE.** 16-18 is unmoved
(89 → 93%, 93 → 89%, 63 → 52%); what appears is a **fifteenth year in which two thirds of careers now
hold both tours**, and a **fourteenth year in which a quarter do, on 1.7 professional events**. So the
pillar's window is 14-18 in name and, in weight, 15-18: at fourteen the second tour is a handful of
W15s beside a full junior calendar (mean 7.3 junior entries against 1.7 professional ones).

**What makes it survivable, and it is P2's own doing:** at 14 the professional year is **8 events**
against an unrestricted junior fourteen, and at 15 it is **10** – so the wider overlap is a door she
may step through occasionally, not a tour she can move onto. Before this phase the same door at 16
leaked 19 events a year. **The ruling and the window belong together; either alone would have been
worse than both.**

⚠ **THE OWNER SHOULD SEE THIS AND HAS THE FINAL WORD.** He has given it once already. What this
section exists to do is make the consequence visible, not to re-litigate it: if the 16-18 framing in
`adult-tour-and-endings.md` §4.1 is still the intent, the two documents now disagree and one of them
should be amended – that is his call, not the agent's.

> ### ✅ CLOSED 16.08 – HE GAVE IT A SECOND AND A THIRD TIME, AND §4.1 IS AMENDED
>
> «настоящих порогов только два – 14 и 18. – вот как есть в регламенте, так и у нас», and then, when
> the same disagreement reached him again: **«у нас есть регламент, точка. Разрули противоречия и
> оставь один источник истины, хватит мне это возвращать.»** The 16-18 framing is **not** the intent.
>
> `adult-tour-and-endings.md` §4.1 now carries a banner: the cap and the age view are right, *"a W15
> field is adults"* is false, and the overlap runs **14-18**. The measurement above is what it always
> was – evidence – and needs no change.
>
> ⚠ **One thing this section got wrong about itself, and it is the reason the argument kept
> restarting.** The sentence quoted above as §4.1's – *"a sixteen-to-eighteen-year-old holds both
> tours at once and arrives at nineteen having seen what each one costs and pays"* – **is not in
> §4.1 and never was.** It was written as a paraphrase in `junior-access-2026-08.md` §2a and quoted
> from there. A pillar defended in three documents turned out to have no original.
>
> **The grid is now stated once and this document does not restate it:**
> [`docs/specs/college-is-its-own-branch-2026-08.md` §0a](college-is-its-own-branch-2026-08.md).

---

## 7. THE BOREDOM GUARD – the acceptance test, and it is an owner ruling

«Мы ни за что не наказываем», and on the AER specifically: **she must always have tennis.**
`tools/boredom-guard.ts` mechanises it – across the sweep, every non-rest, non-blackout week where a
W entry is refused by the cap must still offer a playable J or domestic event she qualifies for.

### ⚠⚠ 7a. IT FAILS, IT ALREADY FAILED BEFORE P2, AND THE NUMBERS ARE HERE LOUDLY

`npx vite-node tools/boredom-guard.ts --seeds 12 --weeks 260`, run on both trees:

| | pre-P2 (`4d49fc3`) | P2 |
| --- | --- | --- |
| non-blackout weeks a cap refusal covered | 72 | **354** |
| ...of which offered **nothing** else | **9** | **29** |
| as a share of refused weeks | 12.5% | **8.2%** |
| strongest fallback family | ITF 51 weeks / domestic 12 | ITF 286 / domestic 39 |

**READ BOTH COLUMNS.** The guard was **already red** – this is the pre-existing failure
`tools/boredom-guard.ts`'s own header documents at length and exits 1 on. P2 did not introduce it. What
P2 did is make the cap **fire five times as often** (72 → 354 weeks), because closing the window is
exactly what makes an allowance bind – and that exposes more of the same calendar holes. The *rate*
improved (12.5% → 8.2%); the *count* did not.

**AND THE CLASSIFIER SAYS IT IS NOT A CAP-NUMBER PROBLEM.** Every violating week reports *"NO non-W
event scheduled"* – the calendar carries a W event on that week and no junior or domestic one at all.
The tool's header states the consequence: *"No value of `proPerYearByAge` can fix a week with no J or
National on it."* Pre-P2 the stranded weeks sat at season offsets 38-48; P2 adds offsets 1-21, i.e. the
first half of the season, because the cap can now bite early in a birth year instead of only late in a
season block.

⚠ **SO THE REMEDY IS A CALENDAR CHANGE AND IT IS OUTSIDE P2's REMIT, WHICH IS WHY THIS IS FLAGGED
RATHER THAN QUIETLY FIXED.** The two candidates are the ones the tool already names for the architect:
**co-phase the W rungs with their J mirrors in `tierPhase`** so a W week always carries its J fallback
(one line, but it re-deals the whole world's calendar), or **densify the second-half domestic/J
coverage** (an owner-priced knob). Both move the fields she meets everywhere at once, which would
destroy this wave's attribution – the exact thing the staged plan exists to prevent.

⚠ **WHAT IS TRUE OF THE STRANDED WEEKS TODAY:** they are weeks with no tournament of any kind she may
enter, and the planner still offers her a practice friendly and a family week – so she is not left
staring at an empty screen. That is a mitigation, not the promise: the promise is a *playable event*.

**OWNER DECISION NEEDED.** Either the calendar co-phasing lands as its own phase (with its own
measurement, because it moves every field), or the promise is restated as "a playable WEEK" rather than
"a playable EVENT". This agent will not choose between those.

---

## 8. MEASURED – P0's columns, before and after

`npx vite-node tools/ladder-baseline.ts --seeds 10`, n = 90, identical seeds both arms, 676 weeks,
`POLICIES[1]`. **Before** = this branch at `4d49fc3` (P1 shipped, P2 not started). **After** = all six
items. P0's own frozen column is carried alongside so the whole chain stays legible.

### 8a. THE LEAK, WHICH IS WHAT THE PHASE IS FOR

Professional entries in that **year of her life**, against the AER row for that age:

| her age | P0 (pre-P1) | before (P1) | **after (P2)** | rulebook row |
| --- | --- | --- | --- | --- |
| 14 | 0.0 | 0.0 | **1.0** | 8 |
| 15 | 0.8 | 0.8 | **6.9** | 10 |
| **16** | **18.8** ⚠ | **19.0** ⚠ | **10.8** ✓ | **12** |
| 17 | 11.4 | 14.8 | **15.4** ✓ | 16 |
| 18+ | 15.1 – 16.3 | 23.2 | 21.6 – 22.2 | unlimited |

**THE LEAK IS CLOSED.** Her sixteenth year goes from 58% over the rulebook to 10% under it, and no
year is now over its row. The 14 and 15 rows fill because of §6's ruling, not because of the window –
they were structurally zero while W15 opened at 16.

### 8b. WHAT SHE PLAYS INSTEAD – the boredom promise, from the other side

| her age | junior entries before | after | total entries before | after |
| --- | --- | --- | --- | --- |
| 14 | 9.9 | 7.5 | 20.3 | 19.0 |
| 15 | 17.8 | 14.0 | 20.0 | 24.0 |
| **16** | **5.0** | **12.9** | 24.6 | **25.8** |
| 17 | 10.0 | 9.3 | 26.3 | 26.0 |

**She is not idle – she is at a junior event.** At sixteen the junior family goes 5.0 → 12.9 while the
professional one halves, and her TOTAL entries *rise* (24.6 → 25.8). That is `tierOutgrown`'s own
clause for the owner's ruling 2 doing its job: a spent pro allowance lifts the ceiling on the
non-professional rungs. The engine-level promise holds; §7a is about the CALENDAR's holes, which are a
different failure and predate this phase.

### 8c. THE LADDER AND THE CLIMB

| | P0 | before | after | |
| --- | --- | --- | --- | --- |
| age at first W15 | 16.2 | 15.9 | **15.2** | the ruling, visible |
| age / rank at first W75 | 17.2 / #272 | 19.0 / #264 | **19.0 / #273** | unmoved by P2 |
| share ever entering a W75 | 92% | 84/90 | 84/90 | unmoved |
| **rank at 17** | #300 | #300 | **#426** | the cost, and it lands here |
| rank at 19 | #177 | #275 | **#272** | already converged |
| rank at 21 | – | #182 | #199 | |
| rank at 25 | – | #174 | #176 | |
| career high (median) | – | #123 | **#121** | slightly better |
| counting slots at 19 (full) | – | 77/90 | 75/90 | |

**THE COST IS A YEAR AT SEVENTEEN AND IT IS GONE BY NINETEEN** – the same delay-not-tax shape P1
measured one phase earlier, and for the same reason: she reaches the same place having played a
different set of events.

### 8d. MONEY, COLLEGE, SURVIVAL

| | before | after | |
| --- | --- | --- | --- |
| prize banked by 19 (median) | $81,630 | **$79,165** | −3% |
| prize by 21 | $208,245 | $196,625 | −6% |
| career prize | $592,710 | $589,705 | flat |
| college door shut | 86/90 (96%), mean 18.8 | 88/90 (98%), mean **19.0** | later still |
| open AT the fork | 72% | **79%** | |
| open a full season later | 4% | 2% | |
| careers ending early | 2/90 (injury) | **1/90** | |
| **bankruptcies** | **0/90** | **1/90, at age 14.8** ⚠ | see below |
| ever in debt | 40/90 | 39/90 | |

⚠ **THE ONE BANKRUPTCY IS NEW AND IT IS THE RULING'S BILL, NOT THE WINDOW'S.** It falls at **14.8** –
before P2 no career could enter a professional event at that age at all. A W15 costs a $300 entry fee
plus $1,000-2,200 of travel, and a fourteen-year-old's family is at its poorest. One career in ninety
is not a balance emergency, but it is a NEW failure mode that did not exist, it is attributable to §6
alone, and the owner should see it beside the ruling.

### 8e. PREDICTED VS MEASURED, SCORED

| # | predicted | measured | |
| --- | --- | --- | --- |
| P1 | sixteenth year at or under 12 | 19.0 → 10.8 | ✓ |
| P2 | 17 roughly unchanged | 14.8 → 15.4 | ✓ |
| P3 | the junior rungs take it back | 5.0 → 12.9 at 16, total entries UP | ✓ |
| P4 | merited increases near-inert | inert on the population; live and pinned in unit tests | ✓ |
| P5 | sub-cap cannot bind | zero, and the zero is a checked claim | ✓ |
| P6 | cohort decided by measurement | 0 of 312 player-seasons over the row – nothing to build | ✓ |
| P7 | overlap widens to 14-18 | 14: 0 → 26%, 15: 0 → 67%, 16-18 unmoved | ✓ |
| P8 | rank worse at 19, converging by 21 | **17: +126. 19: −3 (already converged)** | ✗ – the cost lands a year EARLIER than predicted and has already unwound by nineteen |
| P9 | boredom guard green | **RED: 29 weeks of 354** – and it was red before P2 too (9 of 72) | ✗ – §7a, and it needs the owner |
| P10 | survival unchanged | 2 → 1 ended early, but **a new bankruptcy at 14.8** | ½ |

**Seven of ten, and the three misses are the findings.** P8 was wrong about WHERE the cost lands, not
whether it does. P9 is the one that matters and it is reported rather than shipped quietly. P10 found a
failure mode nobody predicted because nobody could: a fourteen-year-old could not spend that money
before.

---

## 9. WHAT THE NEXT PHASE MUST NOT READ OFF THIS

* **The boredom guard is RED and it is the only thing here that blocks.** §7a. It failed before P2 as
  well, the cause is a calendar-coverage hole rather than a cap number, and both remedies move every
  field in the world. It needs the owner, and it needs its own phase.
* **P3 (the acceptance cuts) inherits a different population again.** Her rank at seventeen went
  #300 → #426; the cuts are read against the merged table, so the audit's "Pareto-positive in
  isolation" verdict is now two phases stale.
* ~~**`w15.minAgeYears: 14` is an owner ruling and `adult-tour-and-endings.md` §4.1 has not been
  amended.** Two shipped documents disagree about what a W15 field is. §6a states the disagreement; it
  is not an agent's to settle.~~ ✅ **SETTLED 16.08 and §4.1 is amended** – «у нас есть регламент,
  точка». The grid is now written out in exactly one place,
  [`college-is-its-own-branch-2026-08.md` §0a](college-is-its-own-branch-2026-08.md), and every other
  document links to it. See §6a.
* ~~**The sub-cap is dormant machinery with a named wake-up condition.** The day a rung at W75 or above
  opens below 16, `tests/age-caps.test.ts`'s A3c goes red and the season-ledger limitation in §3 stops
  being proportionate.~~ ⭐ **IT WOKE THE SAME EVENING.** `w75.minAgeYears` is 14, A3c was re-aimed
  rather than deleted, and the sub-cap is live machinery that measures zero for a new reason – the
  acceptance list, not the doorway. §3's banner.
* **The merit increases are inert on this population and live in the tests.** Both gates are year-end
  junior top-5 / top-20 lists that 1-4 careers of 90 reach. If a later phase makes the junior top 20
  reachable, they start paying – which is the rulebook's own intent and would need re-measuring.
* **Schema is unmoved.** v49, no migration, no fixture. Nothing in P2 persists.
