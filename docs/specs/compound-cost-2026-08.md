---
type: specification
status: current
area: simulation-and-balance
canonical: false
last-reviewed: 2026-08-08
---

# The compound cost – what two rulings cost together that neither costs alone

**PROBE, NOT A WAVE. No engine line is touched, nothing is proposed for the engine, and neither
ruling is reverted anywhere except inside a detached worktree that exists to be measured.**

## Current truth

`tests/econ-reach.test.ts`'s 14→18 arm reads **1 of 30** on the assembled tree against a pinned floor
of 12. Six arms, same fixture, same seeds, one tree per arm:

| # | arm | tree | **reachedH18** |
| --- | --- | --- | --- |
| 1 | baseline – both waves absent | `d9efb4e` | **16** of 30 |
| 2 | ladder floor only | `6d80792` | **19** of 30 |
| 3 | coach retainer only | `d9efb4e` + `bf00acb` | **9** of 30 |
| 4 | both | `1e24f71` (HEAD) | **1** of 30 |
| 5 | both + a parent who takes his coach's advice | HEAD + veto | **9** of 30 |
| 6 | all four cells again, with a wallet that cannot empty | – | **29 · 28 · 29 · 25** |

**Four findings, in the order they change what the owner has to decide.**

1. **THE BRIEF'S BASELINE OF 25 IS NOT ON THIS LINEAGE, AND HAS NOT BEEN SINCE 05.08.** The tree with
   both waves removed reads **16**, not 25. The 25 is real – it reproduces exactly on the branch it
   was measured on – but it decayed to 16 across three merges that landed *before* either wave under
   investigation, and the band `[12, 27]` absorbed every one of them silently (§3). **The two waves
   are answerable for 16 → 1, not for 25 → 1.** Nine of the twenty-four missing careers were already
   gone.

2. **IT IS NOT "TWO CHANGES PUSHING THE SAME NUMBER THE SAME WAY". THE LADDER FLOOR ALONE PUSHES IT
   UP.** 16 → **19**, and it also halves the bankruptcies (26 → 17 of 30) and buys twenty-five extra
   weeks of solvency. The retainer alone is 16 → 9. Together they are 1. The interaction is real, it
   is superadditive, and §2 traces its mechanism to one line.

3. **THE MECHANISM: R4 WAS AN UNDECLARED PARTICIPATION SUBSIDY, AND THE RETAINER REMOVED IT.** Under
   R4 the coach was stood down on every competition week, so entering more events made the season
   **cheaper**: the ladder floor took her billed coach-weeks from **76.7% to 48.9%** and her coaching
   bill from $17,345 to $11,136 a season, which more than paid for the extra travel. The retainer
   pins billed weeks at **100%** and coaching at **$22,208** whatever she does. The same doubled
   participation that used to fund itself now arrives as pure cost, and she goes under at week 90
   instead of week 133.

4. **THE COACH'S VOICE DOES NOT RESTORE THE REACH – IT RESTORES THE LADDER FLOOR'S HALF OF IT,
   EXACTLY.** A listening parent reads **9 of 30**, which is arm 3 to the career. He is still below
   the tripwire's floor of 12 and seven careers below the pre-wave 16, because the residual loss is
   the retainer and **no scheduling advice can touch a bill that is owed whether she plays or not**
   (§4).

**AND THE LOSS IS FINANCIAL, NOT PHYSICAL.** With a wallet that cannot empty, all four cells read
**25–29 of 30**. Of the 15 careers this fixture loses between arm 1 and arm 4, **four** are the
tennis (fatigue and entry mix, the mechanism `ladder-floor-2026-08.md` §2c traces) and **eleven** are
the family going broke. On this fixture the 14→18 arm is a solvency test wearing a tennis test's
clothes (§5).

**NO DEFECT WAS FOUND**, and none is shipped. Every charge in every arm reconciles with the bench's
own category fold; the coach is billed on exactly the weeks the two rulings say he should be. The
recommendation for the tripwire is in §7, and it is a ruling for the owner rather than a change.

---

## 0. How the arms were built, and why they are trees rather than flags

**⚠ THE ARM IS THE TREE.** Reverting a ruling in code to measure it would be a second implementation
of that ruling, and a wrong one is indistinguishable from a finding. So each arm is a detached
worktree at a real commit, and the tool is the same file copied into each:

```
baseline      git worktree add --detach ../tb-arm-base   d9efb4e   # the assembly before either wave
ladder only   git worktree add --detach ../tb-arm-ladder 6d80792   # + fix/ladder-window-floor
coach only    git worktree add --detach ../tb-arm-coach  d9efb4e && git merge bf00acb
both          the probe branch itself
```

`d9efb4e` is the merge immediately before the ladder wave landed, so it is the assembled tree minus
both waves and nothing else. The coach arm is the coach wave merged onto that same base – the merge
`4177d4e` made, with the ladder wave taken out from underneath it. It merged clean.

**THE MECHANISM MATRIX, read out of the four trees rather than asserted:**

| tree | `tierOpenFor` | `coachWorksThisWeek` |
| --- | --- | --- |
| baseline | `tierFloorOpen(...) && !tierOutgrown(...)` | `world.coachOnEventWeeks \|\| !isCompetitionWeek(world)` |
| ladder only | `tierFloorOpen(...)` | `world.coachOnEventWeeks \|\| !isCompetitionWeek(world)` |
| coach only | `tierFloorOpen(...) && !tierOutgrown(...)` | `true` |
| both | `tierFloorOpen(...)` | `true` |

**THE FIXTURE IS THE TRIPWIRE'S OWN**, named rather than assumed: `middleHigh` (25k · middle · high
coach), 30 careers, indices 0-29, the **grinder** policy (`runCareer`'s default, which is what the
test calls), 208 weeks, and the H18 predicate copied verbatim off `reachedTarget`'s pro arm.

**⚠ THE HARNESS PROVES ITSELF AGAINST `runCareer` IN EVERY ARM.** `tools/compound-cost.ts` has to
write its own loop because the listening arm needs `stepCareerWeek`'s veto and `runCareer` does not
take one, so `--verify` re-runs the same careers through `runCareer` itself and compares. **Per-career
`reachedWeek` mismatches: 0, in all four unmodified arms.** The reach counts below are the bench's,
not a re-derivation of it.

**⚠ AND THE VERIFY CAUGHT A REAL BUG IN THIS PROBE, which is why it is worth the runtime.** The first
sweep read entry fees at **$20 a season** against the bench's $895. `accrueFinance` finds-or-creates
a week's row and adds into it, and `enterEvent` books the fee BEFORE the tick, at the week the parent
commits – so every fee after the first week landed on a row the scan had already marked seen. The
scan is a DELTA scan now and the categories agree with the bench to within the horizon's tail
(coaching 1.05x, entry 1.06-1.09x, travel 1.000x – the excess is the three weeks after the last
season wrap, which `runCareer`'s per-season fold does not reach and this loop does).

---

## 1. The six arms

### 1a. The 2x2, with the money as the game charges it

| | **1 baseline** | **2 ladder only** | **3 coach only** | **4 both** | **5 both + listens** |
| --- | --- | --- | --- | --- | --- |
| **reachedH18** | **16** of 30 | **19** of 30 | **9** of 30 | **1** of 30 | **9** of 30 |
| events entered / season | 12.4 | 27.7 | 8.8 | 14.8 | 8.9 |
| **weeks the coach was billed** | 4,787 of 6,240 (**76.7%**) | 3,050 (**48.9%**) | 6,240 (**100%**) | 6,240 (**100%**) | 6,240 (**100%**) |
| coaching / season | $17,345 | **$11,136** | **$22,208** | **$22,208** | $22,208 |
| entry fees / season | $1,843 | $3,289 | $1,022 | $1,160 | $1,012 |
| travel / season | $8,378 | $11,909 | $4,676 | $4,208 | $4,648 |
| season spend | $33,145 | $32,082 | $33,454 | $33,168 | $33,415 |
| **bankruptcy latched** | 26 of 30 | **17 of 30** | **30 of 30** | 29 of 30 | 30 of 30 |
| median week she first goes red | 108 | **133** | **75** | 90.5 | 75 |
| median end ITF points | 0 | 20.5 | 0 | 0 | 0 |
| peak ITF rank, best / median | #8 / #41 | #14 / #42 | #12 / #57.5 | #41 / #64 | #12 / #57.5 |

⚠ **READ THE SPEND ROW WITH THE BANKRUPTCY ROW OR IT LIES.** Season spend is flat at ~$33k across
every arm, and that is not four families making the same choices – it is **censoring**. A career that
latched at week 75 stops entering, stops travelling and stops being a tennis career; what it keeps
paying is the coach. The uncensored spend is in §5, where nobody goes bankrupt, and it is not flat at
all: $44,159 · $37,587 · $55,825 · $51,074.

⚠ **AND THE BENCH TICKS PAST AN ENDING WHERE THE GAME DOES NOT.** `tickWeek` deliberately has no
ended-world early return (`world/endings.ts` says why: `replayMainState` must not stop mid-replay),
and the latch is read at `advanceWeeks`, which returns `['ending']` and refuses. So a real player's
career stops; the bench's keeps ticking, and keeps paying the coach, for up to two and a half more
seasons. The `LIVE WEEKS ONLY` column in the tool's output exists for that reason – baseline
$35,201 / ladder $32,136 / coach $38,980 / both $36,557 a season – and it changes no conclusion here,
because a dead career reaches nothing either way.

### 1b. What the family actually earns, which is the number every row above is against

Measured on the same fixture, mean of five careers: **income $23,892 a season** – parent wages
$23,550, sponsor $0, prize money $0.

**The retainer alone charges this family $22,208 a season for its coach: 93% of everything it earns.**
Under R4 the same coach cost $10,922–$17,345. That is the whole of §2 in one line, and it is why the
`middle · high` cell was already described in the tripwire's own docstring as *the cell where the
coaching bill eventually stops the career*.

---

## 2. The mechanism – R4 was an undeclared participation subsidy

**The ladder floor alone makes this fixture BETTER, and the reason is not tennis.**

| | baseline | ladder only | |
| --- | --- | --- | --- |
| events entered / season | 12.4 | 27.7 | **+123%** |
| **weeks the coach was billed** | **76.7%** | **48.9%** | **−28pp** |
| coaching / season | $17,345 | $11,136 | **−$6,209** |
| entry + travel / season | $10,221 | $15,198 | +$4,977 |
| **net** | | | **−$1,232 a season** |
| bankruptcy latched | 26 of 30 | **17 of 30** | |
| median week she first goes red | 108 | **133** | **+25 weeks** |
| reachedH18 | 16 | **19** | |

Under R4, `coachWorksThisWeek` returned false on every competition week, so **the more she played the
less her coach cost**. Doubling her entries stood him down for a further 1,737 weeks of 6,240 and
took $6,209 a season off the bill – more than the $4,977 of extra entry fees and travel the same
entries cost. The ladder floor was **self-financing**, and the three extra careers it reaches are
bought with solvency, not with tennis.

⚠ **THAT SUBSIDY WAS THE DEFECT THE COACH WAVE FIXED, AND SAYING SO IS THE FAIR READING OF BOTH
RULINGS.** `coach-retainer-2026-08.md` §2 is explicit that R4 ran two questions together and that the
family «was being told it employed a coach and was employing one for 57% of the year». The same
predicate moves the development rate, so under R4 a girl who competed more also **grew more slowly**.
Neither ruling is wrong. What nobody could see from inside one worktree is that **the ladder floor's
measured benefit was riding on the defect**, so removing the defect removed the benefit and left the
cost.

**AND IT IS SUPERADDITIVE, WHICH IS THE ANSWER TO THE BRIEF'S OWN HYPOTHESIS.** Against a baseline of
16: ladder alone **+3**, coach alone **−7**, both **−15**. Two changes pushing the same number the
same way would sum to −4. The extra −11 is the interaction, and it is the subsidy being withdrawn
from a doubled calendar.

---

## 3. The pinned 25 – where it went, and why nobody heard it go

The tripwire's last recorded reading is *"LADDER-PACE STEP 1 (05.08): 21 of 30 → 25 of 30"*, and the
band `[12, 27]` was derived from it. **It reproduces exactly where it was written, and nowhere since.**
Same fixture, same predicate, same 30 seeds, walked up the first-parent line:

| commit | | reachedH18 |
| --- | --- | --- |
| `3ccb65d` | feat/ladder-pace, the tip the pin was written on | **25** |
| `bf80729` | merged into wave/endings-and-debts | **25** |
| `b1b6cca` | PR #79 to main | 24 |
| `4de529a` | PR #80 to main | **19** |
| `79c36c3` | PR #81, wave/population-1600 | 19 |
| `4c05aab` | PR #82, wave/sponsor-catchup | **16** |
| `34e75a9` | round-14 triage | 16 |
| `d9efb4e` | **the assembly before either wave** | **16** |

⚠ **NINE OF THE THIRTY CAREERS WERE GONE BEFORE EITHER WAVE EXISTED**, in three steps – one at
PR #79, **five at PR #80**, **three at PR #82** – and **the band absorbed every one without firing**,
because 24, 19 and 16 all sit inside `[12, 27]`. That is the band doing what its own note says it is
for ("a band absorbs that"), and it is also the cost of that design: the anchor the band is quoted
against went stale three merges ago and nothing said so.

⚠ **THIS IS REPORTED, NOT ACTED ON.** Attributing PR #80's five careers and PR #82's three is a
separate probe with its own arms; naming the drops is what this one owes. The point that matters here
is only that **the two waves under investigation are answerable for 16 → 1**, and every arm above is
measured against 16.

---

## 4. Arm 5 – does the coach's voice restore the reach?

**No. It restores the ladder floor's half of it, precisely, and stops there.**

`coachLadderNote` is the ladder wave's own counterweight, and it has never been measured on a tree
with the retainer on it. The listening parent is the same veto `tools/ladder-floor.ts` §4c used – the
engine refuses nothing, the parent does what his coach tells him.

| | 4 both | **5 both + listens** | 3 coach only |
| --- | --- | --- | --- |
| **reachedH18** | **1** | **9** | **9** |
| events entered / season | 14.8 | **8.9** | 8.8 |
| travel / season | $4,208 | $4,648 | $4,676 |
| bankruptcy latched | 29 of 30 | 30 of 30 | 30 of 30 |
| median week she first goes red | 90.5 | **75** | **75** |
| peak ITF rank, best / median | #41 / #64 | **#12 / #57.5** | **#12 / #57.5** |
| entries he talked her out of | – | **3,139** | – |

⚠⚠ **THE LISTENING ARM IS THE COACH-ONLY ARM, TO THE CAREER AND VERY NEARLY TO THE DOLLAR.** Nine of
thirty either way, the same peak ranks, the same week she first goes red, entries 8.9 against 8.8.
With 3,139 vetoes the coach talks her out of essentially every outgrown entry the floor opened, so a
parent who listens ends up exactly where the ladder floor never happened. **The counterweight works –
it is a complete undo of its own wave's effect on this cell** – and that is precisely its limit:
having undone the ladder floor, there is nothing left for it to undo.

**The residual, 16 → 9, is the retainer, and it is unreachable from the scheduling voice by
construction.** The coach's opinion is about WHICH WEEK she plays. The retainer is owed on every week
whether she plays or not – it is 100% of billed weeks in arms 3, 4 and 5 alike. Advice can move where
the money goes; it cannot move a bill that does not depend on the decision being advised.

⚠ **AND IT DOES NOT COST PARTICIPATION HERE EITHER**, which is the property `ladder-floor-2026-08.md`
§4c required: the listening arm's careers survive no worse, and its peak ranks are strictly better
than arm 4's (#41 → #12 best, #64 → #57.5 median). The voice is worth having. It is just not worth
seven careers, because those seven were never its to buy.

---

## 5. Arm 6 – declared before it ran, and it is the decisive one

**Declared in this file and committed as `34a939a` before the command was issued:** arms 2 and 3
already decompose "the extra entries" from "the extra coached weeks", so arm 6 asks the question
those two raise instead. **Both rulings live, plus a wallet that cannot empty** – $1,000,000 added to
the opening balance, so no trip is refused for cash and the bankruptcy latch can never fire. Return
toward baseline means the compound loss is **financial**; staying low means it is **physical**.

| | baseline | ladder only | coach only | both |
| --- | --- | --- | --- | --- |
| reachedH18, as the game charges it | 16 | 19 | 9 | **1** |
| **reachedH18, wallet that cannot empty** | **29** | **28** | **29** | **25** |
| events entered / season | 27.5 | 36.0 | 28.3 | 35.8 |
| season spend | $44,159 | $37,587 | **$55,825** | $51,074 |
| coaching / season | $10,922 | $7,562 | $22,208 | $22,208 |
| travel / season | $21,578 | $18,736 | $21,706 | $17,743 |
| prize money / season | $2,594 | $716 | **$3,398** | $988 |
| W-track entries / season (w15+) | 6.26 | 2.71 | **7.02** | 2.53 |
| median end ITF points | 98 | 81.5 | 57 | 92.5 |
| bankruptcy latched | 0 of 30 | 0 of 30 | 0 of 30 | 0 of 30 |

⚠⚠ **EVERY CELL READS 25–29 ONCE MONEY CANNOT RUN OUT.** Of the fifteen careers lost between arm 1
and arm 4, **four are the tennis and eleven are the wallet.** The four are real and they are exactly
the mechanism `ladder-floor-2026-08.md` §2c traces – W-track entries fall 6.26 → 2.53 a season
because the weeks that used to be rest or a W15 are now Local draws, and the ladder floor is the only
arm that moves that number. The other eleven are a family that stopped being able to pay.

⚠ **AND THE UNCENSORED SPEND SAYS WHICH RULING IS EXPENSIVE.** Against a $23,892 income: the
retainer adds **+$11,666 a season** (baseline $44,159 → coach-only $55,825). The ladder floor
**subtracts** $6,572 under R4 and a further $4,751 under the retainer, because a Local is cheaper to
travel to than a W15 – so the two together are only +$6,915. **The floor is not the expensive ruling.
It is the one that changes what she plays; the retainer is the one that changes what she can afford.**

⚠ **WHAT THIS ARM IS NOT.** It is a measuring instrument, not a proposal. A float changes the world
(no affordability refusal, no debt spell, no latch), so only the comparison between its four cells is
meaningful – never a single number from it against a number from §1.

---

## 6. The defect hunt – nothing to ship

The brief licensed a fix only for an outright defect, *"something neither ruling intended, like the
coach being billed for a week she does not play at all, or a double charge"*. Four candidates were
checked and all four are rulings or artefacts:

* **Billed on a week she does not play at all.** That is the retainer, and it is the ruling, quoted
  verbatim in `world.ts`. 100% of weeks in arms 3-5 is what «еженедельное списание» means.
* **Billed in the off-season.** Real, and it **predates both waves** – `coach-retainer-2026-08.md`
  found it from the other side (the season QUOTE priced 49 weeks while `resolveBaseCosts` charged 52)
  and fixed the quote to match the charge. Not created here and not mine to re-rule.
* **A double charge.** No. The probe's own category totals reconcile with the bench's independent
  per-season fold in every arm (§0), and total spend agrees to the horizon tail.
* **Billed after the career has ended.** A **bench** artefact, not an engine one: `advanceWeeks`
  returns `['ending']` and refuses to tick, so no player ever pays it. Named in §1a because it
  inflates a spend figure, and measured around rather than corrected.

**Nothing is shipped from this probe.** The one bug found was in the probe itself (§0).

---

## 7. The tripwire – the recommendation, and it is a ruling for the owner

**DO NOT RE-BASE IT, AND DO NOT WEAKEN IT.** At 1 of 30 the number is the finding. Re-basing the band
would erase the only instrument that noticed, and the file's own procedure says as much: the ladder
wave left it RED while the change was unruled, and its §4d is right that *"re-aiming the evidence
before the verdict is how a measurement stops being one"*.

**LEAVE IT RED.** It is red for a true reason on a tree where both rulings are the owner's, and the
red is the price of those rulings arriving in a second instrument.

**AND THE BAR ITSELF IS STILL HONEST – WHAT HAS STOPPED BEING HONEST IS THE FIXTURE.** This is the
distinction the owner is being asked to rule on, and it is not a way of re-basing by another name:

* **The CASE (`0 < n < 30`) is untouched and should stay untouched.** It is the property the file was
  written for.
* **The BAND `[12, 27]` is quoted against an anchor that went stale three merges before either wave**
  (§3). Whatever is decided, the anchor wants re-measuring rather than re-choosing.
* **The FIXTURE has stopped measuring what its name says.** `middleHigh` is described in the file's
  own docstring as *"the cell where the coaching bill eventually stops the career"*. It was chosen
  because it split widest, and the retainer has turned a bill-LIMITED cell into a bill-DOMINATED one:
  §5 shows eleven of the fifteen lost careers are solvency and four are tennis. **A 14→18 PRO proxy
  that is decided by the family's bank balance is measuring the wrong thing**, whichever way the
  owner rules on the balance.

**So the ruling in front of the owner is one question, and both answers are defensible:**

1. **"A 25k family buying a high coach SHOULD go bankrupt – that is the game telling the truth."**
   Then the balance is right and the FIXTURE is wrong, and the file's own sixth flip is the
   precedent: re-point the fixture at a cell where both branches fire for tennis reasons, chosen by
   `tools/reach-sweep.ts` across the nine presets exactly as `middleHigh` itself was chosen. That is
   a fixture change with a sweep behind it, not a re-based bar.
2. **"93% of a family's income for a coach is not a trade the game should offer."** Then this is a
   balance finding, the tripwire is doing its job by being red, and the fix belongs in a wave with
   its own arms – and `coach-retainer-2026-08.md` §2 already records that the retainer costs
   +12.1 points of bankruptcy for +0.285 peak skill points and no rank movement, on nine presets
   rather than this one.

**⚠ THE ONE THING THAT SHOULD NOT HAPPEN IS THE THIRD OPTION** – re-basing `[12, 27]` down to fit 1
of 30. That is not re-basing, and this file exists so that nobody has to take it on trust.

**Nothing in `tests/econ-reach.test.ts` was changed by this probe** except a ⚠ note recording these
readings, which alters no constant and no assertion.

---

## 8. Reproducing it

```bash
git worktree add --detach ../tb-arm-base   d9efb4e
git worktree add --detach ../tb-arm-ladder 6d80792
git worktree add --detach ../tb-arm-coach  d9efb4e && (cd ../tb-arm-coach && git merge bf00acb)
# node_modules symlinks in; the runtime deps are identical across all four commits
for d in ../tb-arm-*; do cp tools/compound-cost.ts $d/tools/; done

npx vite-node tools/compound-cost.ts -- --careers 30 --verify              # arms 1-4, per tree
npx vite-node tools/compound-cost.ts -- --careers 30 --listen              # arm 5
npx vite-node tools/compound-cost.ts -- --careers 30 --float 100000000     # arm 6, per tree
```

⚠ Every run prints `RUN compound-cost · <cwd> · HEAD <rev>` on its first line. A number whose banner
does not name the worktree it was supposed to come from is not evidence.
