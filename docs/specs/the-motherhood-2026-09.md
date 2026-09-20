---
type: spec
status: draft
area: life
canonical: false
last-reviewed: 2026-09-20
---

# The motherhood – what the drafted constants produce (wave 8, v85)

Invariant 5's record for `ECONOMY.motherhood` and the arc around it (wave-8 brief
[§2 T9](../plans/life-wave-8-builder-2026-09.md)). ⚠ **THIS DOCUMENT IS OPENED BY T7 AND OWNED BY
T9.** T7's task is one question – «what does a twelve-month absence cost in brand income under
EXISTING rules?» – and its answer decides whether a constant ships at all, so it is written down the
day it is measured rather than held for the task that will surround it. Everything T9 measures (the
census, the decision, the comeback, the protected rank, the postpartum shock, input-independence)
lands beside it under its own headings; **§1 and §7 are T7's and complete, and the rest is T9's to
fill.**

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

## §7 T7's question for the owner

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
