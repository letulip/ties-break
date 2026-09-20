---
type: spec
status: draft
area: life
canonical: false
last-reviewed: 2026-09-20
---

# The motherhood – what the drafted constants produce (wave 8, v85)

Invariant 5's record for `ECONOMY.motherhood` and the arc around it (wave-8 brief
[§2 T9](../plans/life-wave-8-builder-2026-09.md)). ⚠ **THIS DOCUMENT WAS OPENED BY T7 AND IS OWNED BY
T9.** T7's task was one question – «what does a twelve-month absence cost in brand income under
EXISTING rules?» – and its answer decided whether a constant shipped at all, so it was written down
the day it was measured rather than held for the task that would surround it. **§1 is T7's and is
untouched**; everything from §2 on is T9's.

⚠ **HOW THIS DOCUMENT IS NUMBERED.** §1 keeps its number because the wave brief links to it by name
([§3a](../plans/life-wave-8-builder-2026-09.md)). T7's closing question to the owner, which it wrote
as «§7», is carried **verbatim** into [§14](#14-the-questions-for-the-owner) so that every question in
this wave's arc sits in one place; not a word of it is changed, and nothing of T7's measurement moved.

⚠ **T9 TOUCHED NO ENGINE CODE.** Every number below is a MEASUREMENT of the values §2 of the brief
drafted, at those values. Where a measurement disagrees with its prediction, §13 names the
disagreement and both readings – **a disagreement is reported, never averaged** – and nothing is
retuned: constants move only on the owner's word, which is the whole reason the wave shipped them
undrafted-by-him.

## §0 The constants under measurement, and whose draft each one is

⚠ The column that decides how a reading is read. The brief drafted some of these, the builders drafted
the rest inside the brief's shape, and **two are RULED and are not drafts at all** – a measurement of
a ruled number is a description of the game, not a proposal about it.

| constant | ships at | whose draft |
| --- | ---: | --- |
| `perWeekByAge` | 2 / 3 / 4 / 3 / 0 %/yr at 24 / 27 / 30 / 34 / 35 | the annual figures are **his own digest's**; the five-rung SHAPE is T2's draft |
| `playsOnWeeks` | 8 | the brief's |
| `termWeeks` | 31 | the brief's (8 + 31 = a 39-week term from the announcement) |
| `joyBond / worryBond / careerFirstBond` | +2.5 / −0.5 / −4 | the brief's |
| `decisionWeeksAfterBirth` | 20 | the brief's |
| `returnBase` | 0.65 | the brief's («~65% to TRY») |
| `returnSupportShift` | warm +0.15 / measured 0 / cold −0.20 | **T5's own draft** – the brief drafts the ordering, not the sizes |
| `returnSpiritPerPoint` | 0.004 | T5's own draft |
| `returnBondPerPoint` | 0.002 | T5's own draft |
| `returnAgePivotYears / returnAgePerYearOver` | 30 / 0.015 | T5's own draft |
| `returnChanceMin / Max` | 0.1 / 0.9 | T5's own draft |
| `protectedRankEntries` | 12 | ⚠⚠ **RULED 20.09** – not a draft, not movable here |
| `protectedRankWeeks` | 3 × 52 = 156 | ⚠⚠ **RULED 20.09** – not a draft, not movable here |
| `comebackStages` | 0.6 / 0.8 / 0.9 / 1.0 over 0 / 13 / 26 / 52 weeks back | **the research's own staircase**, transcribed by the brief |
| `spirit.shock.postpartum` | −24 steady / −37.5 intense | T4's own draft |
| `spirit.postpartumSupportScale` | warm 0.8 / measured 1 / cold 1.25 | T4's own draft |
| `pauseBrandFactor` | ⚠ **DOES NOT EXIST** | drafted by the brief, **refused by §1's measurement** |

## §1 T7 – sponsors: what the absence already costs, before any factor

### §1.0 The question, and why it is asked before anything is built

The research digest says «sponsors partially lost during the pause»
([life-events-motherhood.md:37](../research/life-events-motherhood.md)), and the obvious build is a
`ECONOMY.motherhood.pauseBrandFactor`. The brief refuses to let that be obvious
(§2 T7): brand contracts and their windows **already expire on their own machinery**, and a pause is
already a year with no results. If the absence already costs her the sponsors, a factor would
double-charge a price the world has taken.

### §1.1 The instrument

`tools/pause-brand-probe.ts` – archival, run by hand, not wired to a `bench:*` command. It walks the
proven recipe (`openCareer` + `stepCareerWeek`, the fork continued, the birthday answered neutrally,
retirement refused until final, every blocking life beat drained through `tools/_lifeBeats`'
registry) and adds the two things that walk does not do:

* **it answers the post.** `tools/econ-bench.ts` contains no `acceptOffer` at all, so a career walked
  by the wedding-bench recipe alone never signs a kit deal or an endorsement. ⚠ **The first smoke run
  measured `$0` of brand money over 1300 weeks on 9 of 9 careers** – an arm with nothing to lose,
  which is T6's «the fixture, not the mechanic» in this task's own terms.
* **it buys the merch brand** when the family holds four times its shelf price. Merch income is
  `assetWeeklyIncomeCents(world, 'merch-brand')` – a SHOP ASSET, not something a career grows – so a
  walk that never shops reads `$0` for ever. Excluding it would have biased the answer in the
  dangerous direction: merch is the half of brand income that follows FAME rather than a contract,
  and fame is what a year with no results takes away.

**What «brand income» means here**, asked of the ledger and never of a string: `FinanceWeek.kidShare`
is tagged by source (`world/ledger.ts`, `accrueKidShare`) and carries `baseCents`, the GROSS of the
cheque before the manager's fee. `kidShare.sponsor.baseCents` is every cheque through
`bankSponsorCheque` – the quarterly kit retainer, appearance fees, result bonuses, the endorsement
signature fee, its anniversaries and the ad shoot's fee; `kidShare.brand.baseCents` is the merch
brand's weekly gross. ⚠ Not `byCategory`: the retainer books under `'income'` beside the parent's
WAGE and `'business'` carries the academy beside the merch, so the category fold cannot answer this
question. ⚠ Not the family's side either: `bankSponsorCheque` credits the family only the manager's
commission, so a family-side reading understates the brand's cheque by ~85%.

One thing the instrument does not see, stated so its silence is not read as a zero: the local
sponsor's cameo gift («A local sponsor chipped in!») does not go through `bankSponsorCheque` and has
no tagged share. This probe therefore measures **contracted** brand income plus merch.

### §1.2 The two arms, and the 17.08 law

Both arms are walked **from the same commit**, `82b23137` (`life/wave-8`, v85, T6 landed). They
differ by the career's history and not by the code; what separates them is one reverse-edited
constant in `src/engine/economy.ts`, which is `tools/wedding-bench.ts` section (b)'s own control
discipline («THE CONTROL ARM IS A REVERSE EDIT, NOT A FLAG»), and each log's header prints the live
value so every run self-describes.

| arm | `perWeekByAge` | what it is |
| --- | --- | --- |
| **A** | shipped rungs (2/3/4/3/0 %/yr) | careers that pause and return |
| **B** | every rung reverse-edited to 0 | THE CONTROL – the same seeds, never pausing |

⭐ **The pairing is exact rather than merely «comparable».** The hazard draws on
`seed:life:pregnancy:<week>` and takes ZERO MAIN draws, and `rollPregnancy` returns on a chance of 0
**before** it derives the stream – so an arm-B career is byte-identical to its arm-A twin for every
week up to the announcement, and the two part only where the pregnancy itself acts. The comparison
prints the season of brand income BEFORE the pause for both arms precisely so that identity can be
seen holding; a run whose PRE columns disagree is a broken pairing, not a finding.

### §1.3 Predicted, before the arms ran

Written from the code path and a 9-career smoke, before the 240-career arms existed – so it is a
reading of the mechanism, not a description of output.

1. **The absence produces a loss, and it is not a small one**, because four existing readers all
   point the same way and none of them was written by this wave.
2. **The loss is DEFERRED rather than concurrent.** The deal is failed by `reviewSponsors` in the
   sponsor window, on `eventsPlayedInSeason` read at the window's opening week – a ROLLING year. A
   51-week absence contains one such window, and its rolling year still reaches back into the season
   she played, so the first verdict inside the absence can still pass. The verdict that fails her is
   the NEXT one, which falls after she is already back. So the ABSENCE window should show the deal
   still running and still paying, and the YEAR AFTER should show it gone.
3. **Merch should barely move for the biggest careers**, because `brandReachOf` clamps at
   `ECONOMY.fame.cap` and a top-ten career sits on that cap with years of history under it: a single
   silent year does not drop her through it.

### §1.4 The readers, shown present on the measured tree

The 17.08 law's second requirement – `git grep` on the tree the arms were built at (`82b23137`),
showing that the code which would produce a loss is actually there:

| # | reader | where |
| --- | --- | --- |
| 1 | `played >= dealTerms.minEventsPerSeason` – the deal is FAILED on events entered | `world/sponsors.ts:508` |
| 2 | `if (deal && !heldUp) endDealWithSeason(deal, world.week)` – a failed deal stops with the season | `world/sponsors.ts:547` |
| 3 | `world.results.filter(... r.week >= from && r.week < reviewWeek)` – the count is of RESULTS in the rolling year, and an absence writes none | `world/sponsors.ts:382` |
| 4 | `raiseKitOffers({... standing })` / `standingClears(standing, tier)` – a NEW letter is gated on her LIVE standing, which the windowed tables erode during the absence | `world/sponsors.ts:572`, `offers.ts:334` |
| 5 | merch = `assetEarningsRateCents` = fame x the dial, and `decayAt` halves fame every `ECONOMY.fame.halfLifeWeeks` | `world/business.ts:53`, `world/fame.ts:57` |

⚠ **And none of them is this wave's.** `git diff --name-only 2bcd2b58..HEAD` over
`world/sponsors.ts`, `offers.ts`, `world/brand.ts`, `world/fame.ts`, `world/business.ts` and
`world/brandStrength.ts` is **empty**: wave 8 touches `economy.ts` and nothing else in the brand
machinery, so both arms read the same brand code that `main` ships.

### §1.5 Measured – the runs

Three runs, all from `82b23137`, 240 careers each (3 backgrounds x 80 seeds, every one a distinct
seed), 1300 weeks, policy `player`. Each log's header prints the live constant, so the runs
self-describe:

| arm | command | sentinel |
| --- | --- | --- |
| A | `npx vite-node tools/pause-brand-probe.ts -- --seeds 80 --walk 1300 --arm "A shipped hazard" --emit …` | `ARM_A_EXIT=0` |
| B | the same, after reverse-editing `perWeekByAge`'s four live rungs to 0 in `src/engine/economy.ts`; **restored immediately after, `git diff --stat` clean** | `ARM_B_EXIT=0` |
| X | the same, after reverse-editing `decisionWeeksAfterBirth: 20 -> 156` – the absurd-value arm, §1.5.5 | `ARM_X_EXIT=0` |
| – | `… -- --compare <A> <B>` | `COMPARE_AB_EXIT=0` |

The walk's drain skew is stated arithmetic, not noise: `drained 2937: fork-opinion 236 x 0 ·
met 1307 x 0 · fork-counsel 16 x 0 · ended 1145 x -1 · engaged 189 x -1 · expecting 25 x -0.5 ·
return-plan 19 x 0 = bond skew -1346.5` over 240 careers (arm A).

#### §1.5.1 The census the arm produced

| reading | arm A |
| --- | ---: |
| ever married | 106/240 |
| **reached a pregnancy** | **25 = 23.6% of married**, 10.4% of all careers |
| announcement age | median **30.3** (min 25.5, max 34.6) |
| came back / ended `'family'` | **19 / 6** |
| support grade | `measured` x 25 – the drain's own answer, not a distribution |
| return plan | `small-first` x 19 – likewise |

⚠ The census is **T9's to measure properly** and is quoted here only because it is this arm's
denominator. It happens to land inside the brief's predicted 15–30% corridor, and the grade and plan
columns are the harness's answers rather than the game's – `tools/_lifeBeats.ts` names both.

#### §1.5.2 The arm can earn – T6's warning, answered before the number is believed

| reading | arm A |
| --- | ---: |
| careers that ever took brand money | **223/240 (92.9%)** |
| paused careers taking brand money in the season before the pause | **22/25**, median $4,324,420, max $23,913,500 |
| paused careers holding a live kit deal the week entries closed | **22/25** |
| families that bought the merch brand and earned from it | 221/240 |
| the inbox over the walk | 3,056 kit letters (3,042 signed) · 10,135 ad letters (10,133 signed) |

⚠⚠ **And the first fixture measured $0.** Before the probe answered the post and bought the brand, 9
of 9 smoke careers took **$0 of brand money over 1300 weeks** – an arm with nothing to lose would
have reported «the pause costs nothing» about a population that could not have paid. That is the
17.08 law's own failure mode and it is recorded rather than quietly fixed.

#### §1.5.3 The pairing, witnessed

Over the 52 weeks **before the announcement**, across all 25 paired careers:

| reading | A | B |
| --- | ---: | ---: |
| entry-weeks | 557 | **557** |
| brand money | $139,814,780 | **$139,814,780** |

Identical to the cent – the two arms are the same career until she says it. Over the window the
table below actually cuts (`[pausesWeek − 52, pausesWeek)`, which contains the 8 play-on weeks) the
brand total is **$135,082,826 in both arms, delta $0, 1151 kit-deal weeks in both**.

⚠ **One reading does move before the pause and it is arm A's own mechanic, not a broken pairing**:
across the 8 play-on weeks between the announcement and the closing of entries, arm A enters **46**
event-weeks against the control's **88**. That is the announcement's live effects (T2/T3, and
82b23137's fall-door clause) and not a brand mechanism – but «she plays on for eight weeks» is
delivering barely half the control's entries, which is **a finding for T9's comeback arm, flagged
here and not touched**.

#### §1.5.4 The loss – gross brand income, 25 paired careers

| window | A (pauses) | B (control) | A − B | A / B | per career | pairs A < B |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| the season before | $135,082,826 | $135,082,826 | $0 | 100.0% | $0 | 0/25 |
| **THE ABSENCE (51 wks)** | $99,041,706 | $120,584,067 | **−$21,542,361** | **82.1%** | −$861,694 | 22/25 |
| **the year after** | $65,470,487 | $104,737,061 | **−$39,266,573** | **62.5%** | −$1,570,663 | 21/25 |
| the second year after | $61,172,305 | $96,998,520 | −$35,826,214 | 63.1% | −$1,433,049 | 19/25 |

Over the 155 weeks from the pause to the end of the second year after: **A $225,684,498 against B
$322,319,648 – she keeps 70.0%, and the absence costs $96,635,150 over 25 careers, $3,865,406 each.**

Split by source, which matters because the two are taken away by different machinery:

| window | contracted A/B | merch A/B | kit-deal weeks A/B |
| --- | ---: | ---: | ---: |
| the absence | **76.1%** | 99.8% | 1047 / 1178 = 88.9% |
| the year after | **60.1%** | **68.6%** | **289 / 1191 = 24.3%** |
| the second year after | 60.8% | 68.9% | 793 / 1179 = 67.3% |

**And the reader's own receipt.** Goodbye letters raised inside the absence window, by reason:

| reason | A (pauses) | B (control) |
| --- | ---: | ---: |
| **`events`** | **15** | **0** |
| `stepped` | 2 | 5 |
| `term` | 0 | 10 |

Fifteen kit deals killed by the events clause on twenty-five careers, and **none at all in the
control**. That is not «the reader is present»; it is the reader firing, counted, in the arm.

**The mechanism, end to end, and it explains the deferral.** `reviewSponsors` judges the season on
`eventsPlayedInSeason` read at the sponsor window's OPENING week – a rolling year. A 51-week absence
contains one such window, and its rolling year still reaches into the season she played, so the deal
usually survives the absence and keeps paying (82.1%). The verdict that fails her lands at the NEXT
window, when she is already back. `endDealWithSeason` then stops the contract – and `letDown` bars
`raiseKitOffers` for the same winter, so the year that follows loses the deal AND the post that
would have replaced it: **24.3% of the control's kit-deal weeks**. Merch falls a season later again,
on fame's own half-life, once there are no results topping it up.

#### §1.5.5 The absurd-value check

⚠ The 17.08 law's third requirement, and it is asked of **the thing this measurement says is doing
the work – the absence itself**. `decisionWeeksAfterBirth` reverse-edited `20 -> 156` takes the pause
from `termWeeks + 20` = 51 weeks to `termWeeks + 156` = **187 weeks**, three and a half years off
tour instead of one. The hazard is untouched, so arm X's pregnancies land on exactly the same weeks
in exactly the same 25 careers – nothing before the announcement can see this constant.

**The pairing survives the edit, witnessed the same way**: over `[pausesWeek − 52, pausesWeek)` arm X
and the control agree at **$135,082,826, delta $0, 1151 kit-deal weeks each** – the same figures arm
A produced, because nothing before the announcement can read this constant. Same 25 careers, same
median announcement age 30.3, same min 25.5 / max 34.6.

**And the output moves, hard, in the predicted direction:**

| reading | A – a 51-week absence | X – a 187-week absence |
| --- | ---: | ---: |
| the absence window, brand A/B | 82.1% | **67.3%** |
| ...contracted only | 76.1% | **56.3%** |
| ...merch only | 99.8% | 96.8% |
| ...kit-deal weeks | 88.9% | **29.3%** |
| ...cost per paused career | −$861,694 | **−$4,959,477** |
| `'events'` goodbyes inside the absence, arm vs control | **15 vs 0** | **24 vs 4** |
| the year after, brand A/B | 62.5% | **44.7%** |
| the second year after, brand A/B | 63.1% | **38.8%** |

✅ **The arm contains the change, the reader, and the response to both.** Lengthening the absence
3.7x moves every column the mechanism says it should and leaves the pre-window identity untouched.
⭐ The merch row is the sharpest confirmation of the mechanism rather than the loudest: at 51 weeks
merch barely notices (99.8%), because `brandReachOf` clamps at `ECONOMY.fame.cap` and a top career
sits on that cap – but a 187-week silence finally drops her through it, and the year after reads
59.7% against the 51-week arm's 68.6%.

### §1.6 The decision – nothing ships

**Natural expiry already produces the loss the research describes, and it is large.** Over the 155
weeks from the pause, a career that pauses keeps **70.0%** of the brand income the identical career
without the pregnancy takes – **$3,865,406 less per paused career**, on 22 of 25 pairs in the
absence window and 21 of 25 in the year after. The contract book is the bulk of it: **24.3% of the
control's kit-deal weeks in the year after the pause**, and fifteen kit deals killed by the events
clause against none in the control.

⚠⚠ **So `ECONOMY.motherhood.pauseBrandFactor` does not enter, and the reason is arithmetic rather
than taste.** A factor drafted by the obvious analogy – the research's own `−40%`, matching
`comebackStages`' first rung, so `0.6` on brand income through the absence – would take the absence
window from $99,041,706 to $59,425,024: **49.3% of the control instead of 82.1%, and 57.7% instead
of 70.0% over the three windows.** That is not a refinement of the measured price, it is very nearly
a second one of the same size, on a mechanism that has already charged it.

⭐ **And it would take it in the wrong window, which is the sharper objection.** The measurement says
the absence itself is NOT when the brand leaves: the contract is still live and still paying
**82.1%** of the control through those 51 weeks, because `eventsPlayedInSeason` reads a rolling year
that still contains the season she played. The bill lands the year AFTER, when the next verdict fails
her and `letDown` bars the winter's post. A factor applied during the absence would charge her
exactly where the game currently does not, and would leave the deferral – the most interesting thing
this arc does with money – buried under a flat multiplier.

**What T9 inherits.** Nothing to bench, one thing to watch: this is the measurement the comeback arm
reads when it prices «the wrong ramp must measurably fail more often». The ramp's money consequence
is already in here, because the protected rank enters the big draws either way and the contract book
does not.

## §2 T9 – the instrument, the walk, and the two forks

`tools/motherhood-bench.ts`, archival like T7's probe and not wired to a `bench:*` command. **168
careers** – three backgrounds × 56 seeds, every one a distinct seed – walked **1300 weeks** past the
wedding and into the window, on the proven recipe (`openCareer` + `stepCareerWeek`, the fork
continued, the birthday answered neutrally, retirement refused until final, every blocking life beat
drained through `tools/_lifeBeats`' registry). Policy `player`, the arm that reaches professional
winters.

⚠ **1300 and not the wedding bench's 912, and the arithmetic is the window's** – T7's sizing, kept so
the two instruments cut the same careers. The hazard's last live rung is 34–35, the pause opens 8
weeks after the announcement and runs 51, and the comeback arm then wants a full season: a pregnancy
announced at 34.9 needs (34.9 − 13.56) × 52 + 8 + 51 + 52 = 1221 weeks before its year closes.

### §2.1 ⚠⚠ Why the bench FORKS, and why a drained walk could not have answered three of these sections

`tools/_lifeBeats.ts` states it at the rows themselves, and this is the file that has to act on it:

* `DRAIN_ANSWER['expecting']` is **`worry`**, which persists `support: 'measured'`. A drained walk
  therefore carries **one grade and no others**.
* `DRAIN_ANSWER['return-plan']` is **`small-first`**. A drained walk is therefore **one ramp and no
  others** – and the wave's whole trap is the comparison between two.

A bench that measured «the decision by grade» or «the two ramps» off a drained walk would be measuring
one cell of each table and reporting it as the table. So the walk **clones the world at both cards**:

| fork | arms | why the pairing is exact |
| --- | --- | --- |
| the `'expecting'` card | warm / measured / cold | the decision draws **one** number on `seed:life:return:<week>`, and `support` moves neither the key nor the date – so all three arms compare the **same u** against three thresholds, and the difference between two grades is exactly the mass of u between them |
| ...each arm again, at the birth | psychologist off / on | the grade's own blow has already landed (`postpartumSupportScale` scales the magnitude on the one week the mark is stamped), so the two sub-arms differ only in the **return rate** |
| the `'return-plan'` card | small-first / straight-back | T6 §D's own apparatus – one career, `structuredClone`d, differing in exactly one field – at bench scale and on **grown** careers instead of posed ones |

⚠ **The small-first arm's booking policy is one line and invents no tier boundary.** `stepCareerWeek`
takes an `EntryVeto`, and the veto refuses exactly what the engine already labels `offReturnPlan` –
which `entryVerdict` computes from `onProtectedRank`, «the entries the freeze had to open». A veto in
the BENCH and a label in the ENGINE: the seam is a preference and not a lock, and this arm is simply
the player who does not override it. `straight-back` gets no veto at all, which is the asymmetry the
field itself carries.

⚠ **Sections 5, 6 and 10 are the forks; sections 2, 3, 4, 7, 8 and 11 are the DRAINED base walk** – so
every figure taken off the base walk is a `measured`-grade, `small-first` figure and says so where it
is printed. Those two facts are not neutral and are never left implicit.

### §2.2 What the walk does NOT do

It does not answer the post and does not buy the merch brand. **That is T7's probe's job and not
this one's**, and the omission is stated rather than left to be noticed: `tools/econ-bench.ts`
contains no `acceptOffer` at all, so no career here signs a kit deal, and none of T9's sections reads
brand money. §1 is the brand measurement and this file adds nothing to it.

## §3 Predicted, before the runs – the arithmetic stated

⚠ Written from the constants and from the brief's own corridors **before the 168-career grid existed**
(the git history carries the two commits in that order). These are readings of the mechanism, not
descriptions of output.

| § | what | predicted | where the prediction comes from |
| --- | --- | --- | --- |
| 4 | **input-independence** | the MAIN stream **identical** on the shipped tree and on a control tree | invariant 2 – «player choices may never re-roll the world's dice» |
| 5 | the census | **15–30% of latched** careers reach a pregnancy by 35; ~8–15% of ALL careers | RULED 20.09 («и это ок»), derived from his digest's 2–4%/yr over ~8.5 married window-years: 1 − 0.98^8.5 ≈ 15.8%, 1 − 0.96^8.5 ≈ 29.3%; and wave 7's measured 51.2% latch rate |
| 5 | the ages | every announcement **inside 24–35** and **zero outside it**, median near 30 | the rungs read 0 below 24 and at 35, and `rollPregnancy` returns on a chance of 0 before deriving a stream |
| 5 | the fairness corridor | the four voices within **±1.5 pp** of one another on the share of married | §2 T2's own corridor – the hazard carries no temperament term at all |
| 6 | the mid-term ending | **~5%** of pregnancies lose the carrying marriage before the birth | wave 7 measured 6.2 endings / 100 latched episode-years; the term is 39 weeks = 0.75 yr, so 0.062 × 0.75 ≈ **4.7%** |
| 7 | the decision | warm ≈ **0.80**, measured ≈ **0.65**, cold ≈ **0.45**, each moved a few points by her `spirit`, the `bond` the answer itself left, and her age | `returnBase` + `returnSupportShift`, and `returnChanceFor`'s four terms |
| 8 | the comeback | ⚠ «the wrong ramp fails more often, **or it is a finding**» – and **T6 already measured the finding**: the arms REVERSE, straight-back ahead on 8 of 8, 12 of 12 protected entries spent against 0. This bench predicts **T6's reversal reproduces at bench scale** | §2 T6, and `tests/wave8-return-ramp.test.ts` §D |
| 8 | the product | share who TRY × share who regain their band ≈ the research's **~40%** – ⚠ **checked, never forced on either factor** | §2 T5's deliberate split: the try is drawn, the success is emergent |
| 9 | the protected rank | **no prediction.** A measurement of a ruled rule (12 / 156) | the brief, in those words |
| 10 | the ranking decay | **near-total**: the WTA window is `rolling52` and the pause is **51 weeks**, so almost every result that made her rank has aged out by the week she is back | ⭐ it happens BY CONSTRUCTION – `WINDOW_BY_TRACK` / `windowedBestSum`. MEASURE it; do not build it |
| 11 | the postpartum shock | psychologist OFF: T4 measured **3 / 4 / 5** weeks steady and **8 / 11 / 13** intense by grade on a posed career. Psychologist ON: **shorter**, by `recoverySlope[rung]` added to the weekly return | `ECONOMY.spirit.shock.postpartum`'s own note; `engine/spirit.ts` §3b |
| 12 | the play-on anomaly | ⚠⚠ **a prediction with a mechanism attached, written before the table ran** – see §12.1. The last **three** of the eight «plays on» weeks should book **nothing at all**, and the window should deliver ≈**58%** of a control's entry-weeks at T7's own observed booking rate | `pauseCovering(world, event.week)` + `deadlineWeek = week − 2` + `ENTRY_LOOKAHEAD = 3` |

⚠ **And one prediction about the instrument rather than about the game**, recorded because it is the
kind of thing that is only honest before the run: the fairness corridor is **±1.5 pp on a share of
married**, and a voice with a handful of marriages moves 25 pp when one of them conceives. The bench
therefore excludes any voice with fewer than 20 marriages from the spread and names it. If the grid
cannot supply four voices at that depth, the corridor is **not measurable on this grid** and that is
the honest verdict rather than a number.

## §4 INPUT-INDEPENDENCE – the law, measured first, and one correction to wave 7's own arm

⚠⚠ **Run first and reported first, because nothing below means anything if this is red** (the brief,
in those words). CLAUDE.md's invariant 2: «a no-action run and an action-laden run under the same code
must tap identical MAIN sequences. Player choices may never re-roll the world's dice. **This is a
fairness property.**»

### §4.1 The arm, and why it is not the wedding bench's

Two walks of ONE seed under the same policy, 1300 weeks. The NEUTRAL arm answers only what blocks,
with `tools/_lifeBeats`' registry answers. The EAGER arm answers every blocking beat with a
**different** priced option, answers every live soft row, and picks a different birthday gift.

⚠ **The seed is SEARCHED, not picked.** An independence walk over a career that never conceives has
not exercised one line this wave shipped – it would report «IDENTICAL» about a property nothing
tested, which is CLAUDE.md's 17.08 null-arm shape wearing the law's clothes. The arm walks seeds until
one raises an `'expecting'` card and prints which: **`wealthy-1`, found on the 6th seed searched, and
it reaches BOTH new blocking cards** (`'expecting'` and `'return-plan'`).

⚠⚠ **And the comparison is per CHANNEL rather than per printed line, which is a correction to wave 7's
own arm rather than a preference.** `tools/wedding-bench.ts` section (g) compares one line a week –
MAIN position, funds, condition and the season wrap folded together – and calls any difference a P0.
That was sound while its own justification held: «everything either arm may differ on moves `bond` and
nothing else (§4a.2's law)». **In wave 8 it does not hold.** The `'expecting'` answer ALSO persists
`support`, and `support` reaches `world.spirit` through the postpartum blow's magnitude and
`returnChanceFor` through her decision; the `'return-plan'` answer changes WHICH EVENTS she books. A
folded comparison would therefore report the wave's own design as a violation of the law. The channels
are separated so the verdict stays where invariant 2 puts it: **on MAIN.**

### §4.2 Measured – the shipped tree, `f35acf98`

| channel | first parts at | the two values there |
| --- | --- | --- |
| **MAIN position** | **never** | – |
| **season wrap** | **never** | – |
| **funds** | **never** | – |
| `bond` | week 22 | 68.5 vs 72.5 |
| `spirit` | week 732 | 51 vs 55.8 |
| `condition` | week 756 | 93.68458735363262 vs 93.68458757023012 |

✅ **THE LAW HOLDS.** The MAIN stream, every season wrap (points, rank, previous season, professional)
and the family's funds are **identical over all 1300 weeks**, on a career that answered every card
differently and reached both of the wave's new blocking beats.

✅ **And the sharper half, asserted per ANSWER rather than inferred from two walks agreeing**:
`rngMain.n` is read either side of every `answerLifeBeat` the eager arm makes, and it never moves.
Answering a blocking beat takes **zero MAIN draws** – a claim about the engine that a career with no
cards could not have satisfied by accident.

### §4.3 ⭐ The three channels that DO part, attributed rather than described

The drift is not noise and is not left as «floating point». Read in order it is one chain, and every
link is a mechanic this wave shipped on purpose:

1. **`bond` at week 22** – the first beat the two arms answer differently. By design; §4a.2's law.
2. **`spirit` at week 732**, and the two values are **exactly 4.8 apart**. That is not a number to be
   noted, it is `ECONOMY.spirit.shock.postpartum.steady` seen through `postpartumSupportScale`:
   24 × 1.0 (`measured`, the neutral arm's `worry`) against 24 × 0.8 (`warm`, the eager arm's `joy`).
   **Week 732 is the birth.** T4's mechanic, working.
3. **`condition` at week 756** – twenty-four weeks later, the first weeks back on court, at a
   relative 2 × 10⁻⁹. Downstream of her spirit and of nothing else this wave wrote.

### §4.4 The control tree – `perWeekByAge` reverse-edited to 0, same seed, same 1300 weeks

The wedding bench's own control discipline («THE CONTROL ARM IS A REVERSE EDIT, NOT A FLAG») and §1's,
in this wave, on this same constant. The header prints the live hazard, so the log self-describes:
`perWeekByAge THIS RUN: 24:0.0%/yr 27:0.0%/yr 30:0.0%/yr 34:0.0%/yr 35:0.0%/yr`. **Restored
immediately; `git status` clean, `git diff` empty.**

| channel | shipped tree | control tree |
| --- | --- | --- |
| MAIN position | never | **never** |
| season wrap | never | **never** |
| funds | never | **never** |
| `bond` | week 22 | **week 22 – identical, 68.5 vs 72.5** |
| `spirit` | week 732 | **never** |
| `condition` | week 756 | **never** |
| reached `'expecting'` / `'return-plan'` | YES / YES | no / no – *the mechanic is absent, which is what a control is* |

⭐ **This is the attribution closing.** Take the pregnancy away and the `spirit` and `condition`
divergences vanish completely while the `bond` divergence stays at the same week and the same two
values. The chain in §4.3 is therefore measured and not argued.

⚠ One thing the control run also shows, flagged as an observation rather than an isolated finding:
the control career **ends at week 1113** where the shipped one reaches 1300. A pause suppresses the
fall door (`82b23137`), so a paused career can survive a wrap week that would otherwise have closed
it. Not isolated here – one seed, and retirement has other doors – and named so nobody reads the
different walk lengths as a defect in the pairing.

### §4.5 ⚠⚠ The absurd-value check – what this null result owes, and pays

«The MAIN stream is identical» is a **NULL RESULT**, and CLAUDE.md's 17.08 law applies to it exactly
as to a positive one: the one thing a null cannot prove about itself is that the comparator could have
seen a difference. `--indepAbsurd` opens the eager walk on a **different seed index** and changes
nothing else:

| channel | shipped arm | absurd arm |
| --- | --- | --- |
| MAIN position | never | **week 0** – `-1686077540/799` vs `1085426981/799` |
| funds | never | **week 0** – 12,025,870 vs 12,021,585 |
| season wrap | never | **week 48** – 324 pts / #7 against 166 pts / #14 |
| the verdict line | ✅ the law holds | ❌ **P0**, and the process exits 1 |

✅ **The comparator can see a MAIN divergence, and says so loudly.** The «never» above is a
measurement, not a blindness.

| what the law asks | where it is answered |
| --- | --- |
| the commit each arm was built at | `f35acf98` for both arms of §4.2 and §4.5; §4.4's arms differ from it by one reverse-edited constant, restored |
| the reader is present on that tree | the walk reaches **both** of the wave's blocking cards (printed in the header line), and three channels really do move – an arm that could detect nothing could not have produced §4.3 |
| the absurd-value check moves the output | §4.5 – MAIN parts at week 0 and the exit code turns |

## §5 The census, the ages, and the fairness corridor

**The run.** 240 careers (3 backgrounds × 80 seeds, every one a distinct seed), 1300 weeks, policy
`player`, built at `e86eed27`. The walk's drain skew is stated arithmetic, not noise:
`drained 2944: fork-opinion 235 × 0 · met 1309 × 0 · fork-counsel 17 × 0 · ended 1152 × −1 ·
engaged 189 × −1 · expecting 24 × −0.5 · return-plan 18 × 0 = bond skew −1353`.

### §5.1 The census

| reading | measured | predicted |
| --- | ---: | --- |
| ever married (latched at any point in the walk) | **159 / 240 = 66.3%** | – |
| **reached a pregnancy** | **24 = 15.1% OF MARRIED** | **15–30%** ✅ *at the bottom edge* |
| ...of ALL careers | **10.0%** | 8–15% ✅ |
| ...announced before 35 | 24 of 24 | all of them |
| eligible weeks per career | median 131, p10 0, p90 588 | – |
| careers ending `'family'` | 6 / 240 = 2.5% | – |

### §5.2 ⚠⚠ The cross-check against T7's instrument – a DISAGREEMENT, resolved, and both readings named

T7's probe produced the census incidentally on its own 240 careers: **25 / 106 married = 23.6%**. This
bench says **24 / 159 married = 15.1%**. ⚠ **A disagreement is reported, never averaged**, so here are
both readings and the reason they differ:

| instrument | pregnancies | «married» | share of married | share of ALL careers |
| --- | ---: | --- | ---: | ---: |
| `tools/pause-brand-probe.ts` (T7) | 25 / 240 | `latchedEpisode(world)` at the END of the walk – **still married when the walk stopped** | 23.6% | **10.4%** |
| `tools/motherhood-bench.ts` (T9) | 24 / 240 | latched at **any point** in the walk – ever married | 15.1% | **10.0%** |

⭐ **The two instruments agree to 0.4 pp on the number that has no definitional choice in it** – the
share of ALL careers reaching a pregnancy, 10.4% against 10.0%. They differ only in the DENOMINATOR:
T7 read the married episode off the world's end state, which silently excludes every career whose
marriage had ended by week 1300, and this bench counts a career as married the week it latches.

**Which one the corridor is about.** The brief's own quantity is «share of **latched** careers
reaching a pregnancy by 35», and its derivation is a hazard applied over ~8.5 **married window-years**
of exposure – an exposure a career has whether or not the marriage is still standing at week 1300. So
**15.1% is the corridor's number** and 23.6% is the same measurement over a narrower population.
Neither is wrong; only one answers the question.

⚠ And the answer sits **at the bottom edge**: 15.1% against a corridor of 15–30% derived from
1 − 0.98^8.5 ≈ 15.8%. That is the corridor's own LOWER bound almost exactly, which is what a hazard
whose rungs average nearer 2–3%/yr than 4%/yr should produce.

### §5.3 The ages – ✅ as predicted, on both instruments

| reading | measured |
| --- | ---: |
| announcement age | median **30.2** (min 25.5, max 34.5, p10 26.5, p90 32.5) |
| T7's instrument, independently | median **30.3** |
| under 24 | **0** |
| 35 or over | **0** |

| the hazard's own rung | announcements | share |
| --- | ---: | ---: |
| 24–27 (2%/yr) | 5 | 20.8% |
| 27–30 (3%/yr) | 6 | 25.0% |
| **30–34 (4%/yr)** | **12** | **50.0%** |
| 34–35 (3%/yr) | 1 | 4.2% |
| 35+ (0) | **0** | 0.0% |

✅ Both zeroes are real zeroes: `rollPregnancy` returns on a chance of 0 **before** it derives the
stream, so a week outside the window takes no draw at all rather than a discarded one. And the mass
sits on the 4%/yr rung exactly as the table shapes it.

### §5.4 ⚠⚠ The ±1.5 pp fairness corridor – NOT MEASURABLE, and the honest answer is construction

The raw per-voice share **looks** like a violation and is not one:

| voice | girls | married | pregnant | of married | median eligible wks |
| --- | ---: | ---: | ---: | ---: | ---: |
| sunny | 65 | 52 | 9 | 17.3% | 246 |
| fiery | 54 | 28 | 6 | 21.4% | **12** |
| quiet | 57 | 47 | 5 | 10.6% | **297** |
| deep | 64 | 32 | 4 | 12.5% | **3** |

Raw spread **10.8 pp**, against a corridor of ±1.5 pp. ⚠ **That table cannot answer the corridor's
question**, and its own last column says why: the median eligible weeks run from **3 to 297**, a factor
of a hundred. A share of *married careers* confounds this wave's hazard with wave 7's mechanic – who
marries, how old she is when she does, and how long the marriage lives. The hazard itself reads **age
alone**.

**So the section asks the exposure-adjusted question instead**: Σ `pregnancyChanceAt` over every week
the gate was open – the engine's own function, summed week by week – is the number of pregnancies the
shipped hazard *promises* that voice.

| voice | eligible weeks | expected | observed | obs / exp | ±1 Poisson |
| --- | ---: | ---: | ---: | ---: | ---: |
| sunny | 17,955 | 7.88 | 9 | 1.14 | ±0.36 |
| fiery | 5,966 | 2.78 | 6 | 2.16 | ±0.60 |
| quiet | 18,464 | 8.41 | 5 | 0.59 | ±0.34 |
| deep | 7,437 | 3.44 | 4 | 1.16 | ±0.54 |
| **ALL** | **49,822** | **22.49** | **24** | **1.07** | **±0.21** |

✅ **Over the whole grid the hazard delivers what it promises: 1.07 ± 0.21.** Per voice, the widest
departure is `fiery` at +1.9 σ and `quiet` at −1.2 σ; across four voices a largest |z| near 1.9 is an
ordinary draw, not a signal.

⚠⚠ **And the corridor is not measurable by this instrument at any feasible grid, which is stated
rather than worked around.** A ±1.5 pp corridor on a share near 15% needs a standard error near
0.5 pp, i.e. **~5,126 married careers PER VOICE**. This grid has **159 married careers in total**, and
a grid two orders of magnitude larger is days of machine time for a number whose answer is already
available for free:

⭐ **The fairness claim rests on CONSTRUCTION, and construction is the stronger evidence here.**
`pregnancyChanceAt` takes `kidAgeNow(world)` and the rung table and nothing else; `rollPregnancy` has
no temperament term anywhere in it, by its own documented decision («a per-voice column here would be
a design decision wearing a constant»). A proof that the hazard cannot see a voice beats any sample of
twenty-four events, and the measurement above is what confirms nothing downstream re-introduced one.

## §6 The mid-term ending – the decoupling law, priced

| window | measured | predicted |
| --- | ---: | --- |
| the carrying marriage ends **before the birth** (39 weeks) | **0 / 24 = 0.0%** | ~4.7% |
| ...before the **decision** closes the arc (51 weeks from the pause) | **1 / 24 = 4.2%** | – |

⚠ **The narrow window reads zero and that is not a contradiction of the prediction at this sample.**
The prediction is wave 7's measured 6.2 endings per 100 latched episode-years applied over a 0.75-year
term: 4.7%. At 24 pregnancies, P(zero events | p = 0.047) = 0.953²⁴ = **0.31** – so a zero here is the
single commonest outcome the prediction itself produces, and calling it a disagreement would be
over-reading one in three. Over the **full 51 weeks the pregnancy record stands**, one marriage of 24
did end, which is 4.2% against the same 4.7%.

⭐ **What matters more than the rate is that those careers walked on.** The decoupling law (RULED
20.09, «развелись и развелись, жизнь продолжается») says the birth and the decision read
`world.pregnancy` and never the episode's aliveness – and the career whose marriage ended inside the
window reached its birth, its decision and its return through the standing machinery with no
special-case code. The rate is small; the property is total.

## §7 The decision – who goes back, by `support` grade

24 pregnancies forked **three ways at the `'expecting'` card**. ⭐ The pairing is exact: the decision
draws **one** number on `seed:life:return:<week>`, and `support` moves neither the key nor the date, so
all three arms compare the **same u** against three thresholds.

| grade | the answer | bond | returned | share | drafted | **LIVE chance** | at clamp |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: |
| `warm` | joy | +2.5 | 19 / 24 | **79.2%** | 0.80 | **0.81** | 0 / 24 |
| `measured` | worry | −0.5 | 18 / 24 | **75.0%** | 0.65 | **0.66** | 0 / 24 |
| `cold` | the career first | −4 | 15 / 24 | **62.5%** | 0.45 | **0.46** | 0 / 24 |

⚠⚠ **Read the LIVE column and not the drafted one.** `returnChanceFor` has four terms and the grade is
one of them; `returnBase + returnSupportShift` is two of four, and comparing a measured share against
it would be the wrong measurement wearing the right number. The LIVE column is the median chance the
engine was about to compare a uniform against, read at the top of the decision week.

✅ **And the model is behaving exactly as drafted.** The live chances land at 0.81 / 0.66 / 0.46
against drafted 0.80 / 0.65 / 0.45 – within 0.01 on every grade. Her `spirit`, the `bond` the answer
left and her age move the chance by about **one point in total**, because by the decision week she has
recovered (§11) and the age term is small at a median 31. **Nobody reaches the 0.9 clamp.**

⚠ **The measured SPREAD is about half the drafted spread, and it is one deviation rather than three.**
Drafted warm − cold = 35 pp; measured = 79.2 − 62.5 = **16.7 pp**. Because the three arms share the
same 24 draws, that difference is simply *how many of those 24 uniforms fell between 0.46 and 0.81* –
4 of 24, against an expectation of 8.4, which is **−1.9 σ**. The three rows therefore carry **one**
sampling fluctuation, not three independent ones, and the correct statement is «at 24 draws the grade
spread came out low», not «the grade term is weaker than drafted».

⭐ The ordering is monotone on every reading and the direction is the research's own row («support
only – reaction sets recovery trajectory»).

## §8 The comeback – the two ramps, and T6's reversal at bench scale

18 returns forked at the `'return-plan'` card, walked **104 weeks** through the real tick and the real
match engine, **sampled at 52** so the head-to-head is cut on T6 §D's own horizon.

| arm | mean pts @52w | med pts | mean rank @52w | entered/yr | freeze spent | mean pts @104w | mean rank @104w |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| `small-first` | **0** | 0 | 1622 | **2.2** | 0.0 | **0** | 1621 |
| `straight-back` | **330** | 327 | 391 | 20.6 | **10.7** | 450 | 341 |
| `small-first` **brakes off** (diagnostic) | 163 | 167 | 469 | 24.2 | 0.0 | **499** | 352 |

**Head to head on WTA points at +52 weeks: straight-back ahead on 16 of 18, small-first on 0 of 18,
tied 2.**

### §8.1 ⚠⚠ T6's reversal is CONFIRMED, and the confirmation is stronger than T6's own

§2 T6 predicts «the wrong ramp must measurably fail more often – if the two arms tie, that is a
finding to bring, not a shrug». `tests/wave8-return-ramp.test.ts` §D measured them **reversing** on 8
of 8 posed careers. This bench measured 18 **grown** careers – walked from `openCareer` through a full
childhood, a fork, a marriage, a pregnancy and a pause – and got the same direction, **16 of 18, none
against**. ⚠ **No constant was moved to make either result appear, and none was moved to hide it.**

### §8.2 ⭐⭐⭐ But the margin was measuring the ARM, and the third arm says so

Run 1 of this bench printed `small-first` entering **1.7 events in a year and banking 0 points**. That
is not «small events first», it is **nothing at all** – and a head-to-head whose losing arm did not
play is measuring the arm rather than the ramp, which is CLAUDE.md's «the fixture, not the mechanic».
So a third arm runs the **same `small-first` plan** with two brakes released, and both brakes are the
**bench policy's rather than the engine's**:

* `skipOutgrown` – «a rung she has passed». `hasOutgrown` reads her best-finish history, and a career
  that reached the top fifty has outgrown the W15s **for ever**: the pause does not give them back,
  because a year of not playing does not erase a result.
* `onlyHerTable` – «never pay into a table below the one she is climbing». Once she is a wta player the
  domestic and junior rungs are refused, and after the pause her live wta standing opens nothing on her
  own table.

⭐ **The engine refuses neither.** `hasOutgrown` rides out as a LABEL on `EntryStatus` and
`tierOpenFor` does not consult it (the 06.08 ruling – «NEITHER refuses»), so a real player MAY enter an
outgrown rung; this parent simply does not.

**And the diagnostic answers the question cleanly: small-first's zero is the POLICY, not the plan.**
With the brakes off, the same plan books **24.2 events a year** and banks **163 points** by 52 weeks.

### §8.3 ⚠⚠ And over TWO years the ordering flips back – which is new, and is T6's own caveat paying off

| horizon | `straight-back` | `small-first` brakes off |
| --- | ---: | ---: |
| 52 weeks | **330** pts | 163 pts |
| 104 weeks | 450 pts | **499 pts** |

T6's header says of the reversal that «what is missing is an OPPORTUNITY COST for spending it – in
this model a wasted protected entry costs her the entry and nothing else». This is the other side of
that sentence, measured: the freeze is **spent** (10.7 of 12 inside two years) and then it is **gone**,
and after it is gone the arm that rebuilt a live ranking the honest way keeps climbing while the arm
that rode the freeze has nothing left to ride. ⚠ It is one crossing on 18 careers and is reported as a
crossing, not as a law: the 104-week means are 450 against 499, which is inside the spread of a
16-career sample.

### §8.4 ⚠⚠ The product sanity line – and the largest disagreement in this document

| factor | measured | drafted / predicted |
| --- | ---: | --- |
| share who **TRY** (base walk, drained `measured` grade) | **18 / 24 = 75.0%** | ~65% |
| share who **REGAIN THEIR BAND** – back to at least her rank at the pause, best arm at 104 weeks | **0 / 16 = 0.0%** | ~60% |
| **the PRODUCT** | **0.0%** | the research's **~40%** |

⚠⚠ **The bar is stated so the number can be read**: «regained her band» is taken here as *her live WTA
rank being at least as good as `rankAtPause`*, whose median was **#43**. On that bar **nobody** – on
any of the three arms, at 52 weeks, at 104 weeks, or on the base walk at +1, +2 and +3 years from the
return – gets back. The base walk reads 0/16, 0/16, 0/15.

⚠ **This is carried as a disagreement, not as a tuning.** §2 T5's split is deliberate: her decision to
try is DRAWN and the comeback's success is EMERGENT, and the brief's own instruction is that the ~40%
is «the PRODUCT sanity line, **checked, never forced on either factor**». The try factor measured
**above** its draft (75% against ~65%, which is §7's single shared draw coming in high); the success
factor measured **at zero**. §13 carries it and §14 puts it to the owner.

⭐ **What she does do is climb a long way without getting home**, which is the part a single share
hides: her live table has her at a median **#1620** the week she comes back (§10), and two years later
the straight-back arm's mean is **#341**. That is a real recovery – it is simply not a recovery *to
the rank she paused with*, and 52 weeks was never going to be enough for one.

## §9 The protected rank – what 12 entries / 156 weeks actually buys

⚠ Both numbers are **RULED 20.09** and are not drafts. This section is a description of the game, not
a proposal about it.

| reading | measured |
| --- | ---: |
| returns | 18 |
| ...that came back holding a freeze | **16 = 88.9%** |
| freezes that reached their 156-week expiry inside the walk | 15 |
| entries spent by expiry | **mean 12.0, median 12.0, of 12** |
| **expired with at least one entry UNUSED** | **0 / 15 = 0.0%** |

⚠ **The two counts differ for a reason the record itself states**: «a comeback is a FACT, a freeze is
an ENTITLEMENT» (`ComebackState`). Two of the eighteen paused holding no WTA ranking worth freezing and
still came back.

**Spend by arm, over 104 weeks:**

| arm | entries spent, of 12 | careers that spent NONE |
| --- | ---: | ---: |
| `small-first` | 0.0 | **18 / 18** |
| `straight-back` | **10.7** | 2 / 18 |
| `small-first` brakes off | 0.0 | 18 / 18 |

⭐ **The entitlement is never wasted, and it is spent by exactly one kind of comeback.** The
brief asked for «entries it actually buys, and how often it expires unused»: the answer is **all
twelve, and never**. ⚠ Note the asymmetry that produces it – a freeze entry is spent only where the
frozen rank was **DECISIVE** (`entryVerdict`'s own word), so a plan that never enters a draw her live
standing would refuse can walk the whole three years and spend nothing, which is what both small-first
arms do.

⚠ **The 156 weeks run from the RETURN and not from the pause** – `resolveReturnDecision` writes
`validUntilWeek = returnedWeek + protectedRankWeeks`. Anchored at `pausesWeek` it would be
156 − 51 = **105** usable weeks. T6 flagged this as the one place his «3 years» could honestly be read
the other way; §14.4 carries it to him with these numbers beside it.

## §10 The ranking decay during the absence – ⭐ MEASURED, NOT BUILT

It happens by construction: `WINDOW_BY_TRACK.wta` is `rolling52` and the pause is
`termWeeks + decisionWeeksAfterBirth` = **51 weeks**, so by the week she is back, every result that
made her rank has aged out of `windowedBestSum`. Nothing in this wave built a decay and nothing needed
to.

| WTA points | mean | median | max | at zero |
| --- | ---: | ---: | ---: | ---: |
| at the announcement | 1853 | 1774 | 4540 | 11.1% |
| at the pause | 1639 | 1484 | 4195 | 11.1% |
| at the birth | 655 | 575 | 1758 | 11.1% |
| **at the return** | **24** | **0** | 215 | **66.7%** |

**Points kept from the announcement to the return: mean 1.9%, median 0.0%.** Live WTA rank: median
**#31** at the announcement → **#1620** at the return.

⭐ **This is exactly why the fall door needed its clause** (`82b23137`, the architect's ruling B): that
door latches on points at most halved, rank at least doubled and thirty places gone – and every one of
those three is what a year of not playing produces by itself. Without the clause a career could have
ENDED, irreversibly, about a season she spent having a child.

## §11 The postpartum shock – recovery weeks by grade, psychologist off and on

| grade | × magnitude | psy OFF (median wks) | n | **psy ON** | n | T4's posed prediction (steady / intense) |
| --- | ---: | ---: | ---: | ---: | ---: | --- |
| `warm` | 0.8 | **3.5** | 24 | **2.0** | 22 | 3 / 8 |
| `measured` | 1 | **4.5** | 24 | **3.0** | 22 | 4 / 11 |
| `cold` | 1.25 | **5.5** | 24 | **3.5** | 22 | 5 / 13 |

✅ **Both drafted directions hold, measured on grown careers rather than on a posed one.**
`postpartumSupportScale`'s warm 0.8 / cold 1.25 produce a **two-week** span between the best and worst
answer with the psychologist standing down, and the ordering is strictly monotone in the grade.

✅ **And wave 5's channel works on this shock without one line of new code.** A hired seat on the
`'recovery'` focus takes **1.5 to 2 weeks** off every grade – `recoverySlope[rung]` added to
`returnPerWeek` while a live mark is being worked (`engine/spirit.ts` §3b). ⚠ Two of the 24 careers
are missing from the psy-ON column (n 22): the seat **refused the focus** on those, and a refusal is
reported as a missing cell rather than as «he did nothing».

⚠ **Against T4's own numbers this is the steady end of its band**, which is what a bench of grown
careers should produce: T4 posed a career at the lifted 75 and measured 3/4/5 steady and 8/11/13
intense, and the medians here (3.5 / 4.5 / 5.5) sit just above its steady column because the median
career is a steady one carrying a spirit the pause left near the baseline.

## §12 ⚠⚠ THE PLAY-ON ANOMALY – the investigation, and the cause

### §12.0 What was handed over

§1.5.3 and the wave brief's §3a both carry it, and neither could explain it:

> Across the **8 «she plays on» weeks** between the announcement and the closing of entries, the
> paused arm enters **46** event-weeks against its own twin's **88**. **Half.**

Same careers, same seeds, same ages, differing only in whether the pregnancy hazard fired – and in
that window *nothing is supposed to stop her yet*. T3's gate does not close until `pausesWeek`. T7
checked the brand machinery and found no mechanism there.

⚠⚠ **Half is not noise and is not averaged away here.** The brief named three candidates and asked
for the cause, not a confirmation.

### §12.1 The three candidates, and two of them are RULED OUT mechanically

**Candidate 1 – the `'expecting'` beat is BLOCKING, and the harness answers it after the entry phase,
so a booking week is simply lost. A BENCH ARTIFACT.** ⚠ **Ruled out, and by reading rather than by
argument.** Two facts settle it:

* `enterEvent` (`world/entries.ts`, 93 lines) contains **no life-beat guard of any kind** – `grep`
  over the whole function for `pendingLifeBeat` / `LIFE_BEAT` returns nothing. A pending card does not
  refuse an entry.
* the walk's order is entries → `tickWeek` → answer. `rollPregnancy` raises the card inside the tick,
  and `answerWhateverIsOpen` clears it before the next week's entry phase runs. There is no week in
  which the harness holds an unanswered card across an entry phase.

**Candidate 2 – the same thing happening to a REAL player: a blocking card stops the week and a human
loses a booking week to it.** ⚠ **Ruled out for the same first reason.** `advanceWeeks` refuses to
tick while a row is unanswered – that is the card blocking – but `enterEvent` is a different command
and is not gated on it. A human answers the card, and the entries they could have made are still there
to make.

**Candidate 3 – something else. ⭐ AND THIS IS IT, AND IT IS THE ENGINE RATHER THAN THE HARNESS.**

### §12.2 The cause, in three lines of shipped code

| # | the line | where |
| --- | --- | --- |
| 1 | `const pause = pauseCovering(world, event.week)` → `blocked` | `src/engine/world/medical.ts:715` – the pause is read **at the EVENT's week**, never at the entry week |
| 2 | `deadlineWeek: week - 2` | `src/engine/season/calendar.ts:2060` – entries for an event in week X close at the end of week X − 2 |
| 3 | `if (e.deadlineWeek - world.week > ENTRY_LOOKAHEAD) continue`, `ENTRY_LOOKAHEAD = 3` | `tools/econ-bench.ts:683`, `:87` – a parent commits a few weeks out, not a year ahead |

Put together, on week `w` the entry policy can book **exactly** the events whose own week lies in
`[w + 2, w + 5]`:

* `world.week > e.deadlineWeek` is skipped ⇒ `e.week − 2 ≥ w` ⇒ `e.week ≥ w + 2`
* `e.deadlineWeek − world.week > 3` is skipped ⇒ `e.week − 2 − w ≤ 3` ⇒ `e.week ≤ w + 5`

and the pause refuses every event from `pausesWeek = announcedWeek + 8` onward. So across the eight
«she plays on» weeks, indexed `k = 0…7` from the announcement:

| k | the four bookable event weeks | how many the pause refuses |
| ---: | --- | ---: |
| 0, 1, 2 | a+2…a+5, a+3…a+6, a+4…a+7 | **0 – nothing is lost** |
| 3 | a+5…**a+8** | 1 of 4 |
| 4 | a+6…**a+9** | 2 of 4 |
| 5 | a+7…**a+10** | 3 of 4 |
| 6, 7 | **all four** past the pause | **4 of 4 – nothing can be booked at all** |

### §12.3 Measured – the profile, and it is the arithmetic

24 careers × 8 weeks = 192 career-weeks, instrumented with the entry policy's own veto hook used as a
**pure observer** (it returns `false` always, so the base walk is byte-identical to a walk with no veto
at all; all it does is count). `considered` is every event the policy still had in hand past the
ranking gate; `PAUSE-REFUSED` is the subset the gate turned away, identified by the engine's own
refusal detail (`PREGNANCY_PAUSE_DETAIL`) and never by re-deriving the rule here.

| week k from the announcement | career-wks | considered | at/after the pause | **PAUSE-REFUSED** | entry-weeks | rate |
| ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| 0 | 24 | 24 | 0 | **0** | 14 | 58.3% |
| 1 | 24 | 25 | 0 | **0** | 10 | 41.7% |
| 2 | 24 | 26 | 0 | **0** | 11 | 45.8% |
| 3 | 24 | 35 | 21 | **21** | 1 | 4.2% |
| 4 | 24 | 57 | 46 | **46** | 0 | **0.0%** |
| 5 | 24 | 58 | 56 | **56** | 0 | **0.0%** |
| 6 | 24 | 77 | 77 | **77** | 0 | **0.0%** |
| 7 | 24 | 77 | 77 | **77** | 0 | **0.0%** |
| **TOTAL** | **192** | | | | **36** | **18.8%** |

✅ **The predicted profile is the measured profile.** Weeks 0–2 lose **nothing** – zero refusals, and
the booking rate holds at 41–58%. Week 3 is the first with anything past the pause and the rate falls
off a cliff to 4.2%. From week 4 on **every single event the policy still had in hand was past the
pause**, and not one new entry is made for the rest of the window.

⚠ One honest correction to the prediction: §12.2's arithmetic expected weeks 4 and 5 to be *thinning*
rather than empty, and they are empty. The reason is in the table's own third column – at k = 4, 46 of
57 considered events were past the pause and the 11 that were not did not get booked either, because
the policy takes at most one event per calendar week and those weeks were already spoken for. The
structure is exactly as predicted; the tail is one week longer than the arithmetic alone suggested.

### §12.4 The magnitude, against two independent controls

| control | before | during | the play-on window delivers |
| --- | ---: | ---: | ---: |
| **within-career** – the 8 weeks immediately before she says it, same careers | 72 / 192 = 37.5% | 36 / 192 = 18.8% | **50%** |
| **between-tree** – T7's reverse-edited twin, `perWeekByAge` at 0 | 88 event-weeks | 46 event-weeks | **52%** |

⭐ **Two different instruments, two different control designs, one point apart.** T7's is the stronger
pairing – a byte-identical twin up to the announcement – and this one is cheaper and holds the career
fixed rather than the calendar. They agree.

### §12.5 The verdict, and what it means for a real player

**IT IS THE ENGINE, NOT THE HARNESS – and it is the design working, with one consequence nobody has
been told about.** The pause gate is read at the EVENT's week, which is right: an entry made today for
a tournament three weeks after the entries close would be an entry she cannot play. What follows from
it, and was not stated anywhere, is that **the window in which she can still ENTER something is
shorter than the window before the door shuts**:

* **for anybody**, human or bench: an entry for week X closes at the end of week X − 2, so the last
  **two** weeks of the eight can produce no new booking at all. «She plays on for 8 weeks» is
  **6 weeks of entering** and 8 weeks of playing what she already holds;
* **for this parent**, who commits within three weeks of a deadline: the last **five**.

⚠ And `PREGNANCY_PAUSE_DETAIL` already says the true half of it – «no new entries. The ones she
already holds still stand» – so nothing on screen is wrong. What is new is that the 8 in
`playsOnWeeks` is a door-closing date rather than an entry budget. §14.2 puts the choice to the owner;
**T9 changed nothing** (invariant 4).

⚠⚠ **And the two candidates the brief offered are ruled OUT rather than left open** – §12.1 – which
matters because one of them would have been a defect in every bench this layer runs. The blocking beat
costs nobody a booking week: `enterEvent` has no life-beat guard in any of its 93 lines.

## §13 Predicted against measured, in one table – and where they disagree

⚠ **A disagreement is REPORTED, never averaged, and both readings are named.**

| the brief's section | predicted | measured | verdict |
| --- | --- | --- | --- |
| 1 · input-independence | MAIN identical, shipped and control | **identical on both trees**, 1300 weeks; absurd arm parts at week 0 | ✅ §4 |
| 2 · the census | 15–30% of latched | **15.1%** | ✅ at the lower bound · ⚠ **disagrees with T7's 23.6%, resolved: a different denominator** (§5.2) |
| 3 · the ages | inside 24–35, none outside | median **30.2**, none outside, mass on the 4%/yr rung | ✅ §5.3 |
| 3 · the ±1.5 pp corridor | four voices within 1.5 pp | **not measurable** – needs ~5,126 married careers per voice, the grid has 159. Exposure-adjusted obs/exp **1.07 ± 0.21** overall | ⚠ §5.4 – answered by construction |
| 4 · the mid-term ending | ~4.7% before the birth | **0 / 24** before the birth (P = 0.31 under the prediction), **1 / 24 = 4.2%** before the decision | ✅ §6 |
| 5 · the decision | warm 0.80 / measured 0.65 / cold 0.45 | **live chances 0.81 / 0.66 / 0.46**; shares 79.2 / 75.0 / 62.5% | ✅ on the chance · ⚠ the measured SPREAD is 16.7 pp against 35, one shared draw at −1.9 σ (§7) |
| 6 · the ramp arms | the wrong ramp fails more often, **or it is a finding** – and T6 measured the finding | **T6 CONFIRMED**: straight-back ahead on **16 of 18** grown careers, 0 against | ⚠ §8.1 – a finding, carried, not tuned |
| 6 · the product | ≈ 40% | **0.0%** = 75.0% who try × 0.0% who regain their rank at the pause | ⚠⚠ §8.4 – **the largest disagreement in this document** |
| 7 · the protected rank | no prediction | **12.0 of 12 spent by expiry, 0 of 15 expired unused** – and only by `straight-back` | ✅ §9 |
| 8 · the ranking decay | near-total, by construction | **1.9% of points kept**; #31 → #1620 | ✅ §10 |
| 9 · sponsors | T7's, re-stated | **70.0% of a twin's brand income over 155 weeks**; no constant ships | ✅ **§1** (T7's, untouched) |
| 10 · the postpartum shock | warm shortens, cold lengthens; psychologist shortens | **3.5 / 4.5 / 5.5** off, **2.0 / 3.0 / 3.5** on | ✅ §11 |
| 11 · the play-on anomaly | the pause is read at the EVENT's week; the last weeks book nothing; ≈58% of a control | **50%** (T7: 52%); zero refusals at k 0–2, **zero entries from k 4** | ✅ §12 – cause named, both harness candidates ruled out |

### §13.1 The three disagreements, each with both readings named

1. **The census, 15.1% against T7's 23.6%.** Not a contradiction: a different denominator (ever
   married against still married at week 1300). The instrument-independent figure – the share of ALL
   careers – agrees to **0.4 pp** (10.0% against 10.4%). §5.2.
2. **The decision's grade spread, 16.7 pp against a drafted 35 pp.** The LIVE chances match their
   drafts to 0.01, so the model is not weak; the three arms share 24 draws and 4 of them fell in the
   35-pp band against an expectation of 8.4, which is −1.9 σ. A bigger grid moves this and nothing
   else does. §7.
3. **The product, 0.0% against ~40%.** ⚠⚠ Real, large, and not a sampling artifact: **no career on
   any arm at any horizon up to three years** gets back to the rank it paused with (median #43). The
   try factor is fine – 75% against a drafted ~65%. §8.4 and §14.3.

## §14 The questions for the owner

⚠ Collected in flight and brought at the end of the work, on his own instruction (the wave brief's
§3). Nothing here asks for a constant to move: every constant in §0 ships at its drafted value, and
they move only on his word.

### §14.1 T7's question – sponsors, and the constant that did NOT ship

⚠ **Verbatim from T7, which wrote it as this document's «§7». Moved here unedited so the wave's
questions sit together; not a word is changed, and nothing of T7's measurement in §1 moved with it.**

**The figure.** A career that pauses for the child keeps **70% of the brand income** the same career
without the pregnancy earns over the three years around it – $3.9M less each, on our money scale –
and loses **three quarters of its contract weeks** in the year after coming back. That is the game
as it stands today, with nothing added.

**The decision taken.** T7 ships **no constant**. The research's «sponsors partially lost during the
pause» is already true of the engine, and the drafted `pauseBrandFactor` would have charged the price
a second time.

**What the other branch would have cost.** Shipping the obvious `0.6` would have taken her from 70%
to ~58% of a comparable career's brand income, and would have taken it during the absence – where
the measurement shows the contract still paying – rather than in the year after, where the game
already takes it. ⚠ The reverse risk is stated too: if the owner reads «partially lost» as meaning
something SHARPER than a 30% three-year haircut, the honest lever is not a new factor on top but a
re-tune of the existing ones (`minEvents`, the sponsor window's own verdict), and that is a decision
about the whole brand ladder rather than about motherhood.

**The one thing found in flight that is not T7's.** Across the 8 weeks between the announcement and
the closing of entries – the stretch the brief calls «she plays on» – arm A enters **46** event-weeks
against the identical career's **88**. Half. Nothing in the brand machinery causes it; it is the
announcement's own live effects. Flagged for T9, untouched here.
### §14.2 «She plays on for eight weeks» is six weeks of entering, and three for this parent

See §12. `playsOnWeeks: 8` is the week the **door shuts**, and it does exactly that. What it is not is
eight weeks in which she can still enter something new: an entry for an event in week X closes at the
end of week X − 2, so the last **two** weeks of the window can produce no new booking for **anyone**,
human or bench – and a parent who commits within three weeks of a deadline loses the last **five**.
Measured: zero refusals in weeks 0–2, and **zero entries from week 4 on**, across 24 careers.

**The question is about meaning, not tuning.** If «she plays on» should mean «she can still enter for
eight more weeks», the constant that expresses that is **10**. If it means «the door shuts eight weeks
after she says it», it ships correct and only the sentence around it needs to know. ⚠ Invariant 4: the
sentence is his and T9 changed nothing. Nothing on screen is wrong today –
`PREGNANCY_PAUSE_DETAIL` already says «no new entries. The ones she already holds still stand».

### §14.3 ⚠⚠ Nobody gets their ranking back – the product reads 0% against the research's ~40%

See §8.4. Her decision to try measures **75%** against a drafted ~65%, so that half is sound. The other
half – whether the comeback WORKS – measures **0 of 16** at every horizon this bench can see, up to
three years from the return, on all three arms. The bar used is «back to at least her live rank at the
pause», median **#43**.

⭐ She does climb: from a median **#1620** the week she returns to a mean **#341** two years later.
That is a long way and it is not home. **The bar is the question**: if «returned successfully» means
top 100, or «playing a full main-tour calendar again», rather than «back to her old rank», the answer
may already be yes and this document simply measured the strictest reading. ⚠ T9 did not pick a softer
bar on its own judgement, because picking the bar decides the answer.

### §14.4 The ramp trap runs backwards at bench scale too – and flips again at two years

See §8.1–§8.3. T6 measured the two arms reversing on eight posed careers and pinned it;
this bench measured **16 of 18 grown careers, none against**, at one year. ⭐ And at **two** years the
small-first arm that is actually allowed to play (the diagnostic, brakes off) passes straight-back –
499 points against 450 – because the freeze has been spent by then and there is nothing left to ride.

The candidates for what to do about it are all design decisions rather than tuning, and all of them are
his: a points floor on a draw she is not competitive in, a body cost on the big weeks, or accepting
that our economy makes the freeze a good bet. ⚠ **No constant of this wave was moved in either
direction**, and the staged factor could not have closed the one-year gap anyway.

### §14.5 The freeze's three years are counted from the RETURN

See §9. `resolveReturnDecision` writes `validUntilWeek = returnedWeek + protectedRankWeeks`, so the
entitlement runs 156 weeks from the week she comes back. Anchored at `pausesWeek` instead it would be
156 − 51 = **105** usable weeks. T6 flagged this as the one place his «3 years» could honestly be read
the other way, and the measurement says what the choice is worth: **all twelve entries are spent, and
none of the fifteen freezes that reached expiry had one left over** – so the longer anchor is not
currently being *wasted*, and shortening it to 105 weeks would bite.
