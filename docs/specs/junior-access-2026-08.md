---
type: specification
status: current
area: simulation-and-balance
canonical: false
last-reviewed: 2026-08-15
---

# Junior access – the Accelerator ladder and the W15 reserved place

**P1 step 1 of `docs/plans/college-and-the-junior-ladder.md`. Step 2 (the Play Down rules) is the
same files and a separate commit with a separate measurement – `docs/specs/play-down-2026-08.md` –
because the two push in opposite directions and one number would hide the other.**

> **THE STEP IN FIVE LINES.** In reality there are **no junior-reserved places at W35 and above**:
> a junior's only route up is the ITF's Junior Accelerator, and its table tops out at W100 and pays
> nothing at all below year-end junior #21. Ours let **94% of careers into a W75 at 17.2**. This
> commit gives the Accelerator to the kid as a per-rung ALLOWANCE, and moves W15's door off our own
> 120-point invention onto the sport's own junior RESERVED PLACE, which reads a junior RANKING.
> An adult entrant is untouched. **Zero schema: v49 unmoved, no migration, no fixture.**

---

## 0. THE PREDICTIONS, WRITTEN BEFORE THE ARM WAS RUN

Invariant 4. The baseline is `tools/junior-access.ts` run on `ea8b97f` (the commit before this one)
in a worktree; the arm is the same file on the same seeds after the change. n = 54 (9 presets x 6
seeds), 416 weeks (14 -> 22), policy 1 (the rebuilt "reasonable parent"), identical seeds.

| # | claim | predicted |
| --- | --- | --- |
| P1 | share of careers that ever enter a W75 | stays high (>= 80%) – the horizon runs to 22 and an ADULT enters on her ranking again |
| P2 | age at first W75 | 17.2 -> ~19.0-19.3, i.e. it moves to the far side of the fork |
| P3 | age at first W35 | 16.5 -> ~17.5-19 (only a top-20 junior holds W35 places) |
| P4 | the W15 door | unchanged in difficulty: ever% ~96%, floor age 15.6 +/- 0.3 |
| P5 | W entries per season at 16 / 17 | 19.1 / 12.2 -> roughly halved, and what remains is W15 |
| P6 | college closure rate | 94% -> well under half |
| P7 | college door open at the fork (19) | 7% -> a majority |
| P8 | rank at 19 / 21 | 198 / 205 -> worse by 50-150 places |
| P9 | prize banked by 19 | $116,778 -> materially lower |
| P10 | survival | roughly unchanged (2 of 54 ended early) |

---

## 1. WHAT THE SPORT ACTUALLY SAYS

Sourced in `docs/research/ranking-points-by-tier.md` §4 and `docs/research/real-ladder-pace.md` §4,
both quoting the 2026 WTT Regulations. **No junior point ever becomes a WTA point.** What exists is
ACCESS, in three formal mechanisms, and two of them are this commit:

* **Junior Reserved places** (§VII.A Method E) – at **W15 events only**, up to three main-draw places
  for a player with an ITF **combined junior ranking of 1-100** who could not get in any other way,
  and who has turned 14. *This is the literal junior->pro door.*
* **the Junior Accelerator** (App. D / juniors App. M) – the girls' **year-end junior top 20** get
  direct main-draw entry into a counted number of designated women's events:

  | year-end ITF junior rank | reserved access |
  | --- | --- |
  | 1 | 3 tournaments up to W100, 2 up to W75 |
  | 2 | 2 up to W100, 3 up to W75 |
  | 3 | 1 up to W100, 2 up to W75, 2 up to W50 |
  | 4-5 | 2 up to W75, 3 up to W50 |
  | 6-10 | 2 up to W50, 3 up to W35 |
  | 11-20 | 1 up to W50, 4 up to W35 |
  | 21+ | **nothing above W15** |

* the third, **Pro Path Merited Increases**, is P2's and is not touched here.

**And the composition table says the same thing from the other side.** A real 32-draw at W15 holds
three Junior Reserved chairs; at W35-W100 it holds **none**.

---

## 2. WHAT SHIPPED

### 2a. W15's door is the junior reserved place, and it reads a RANKING

`w15.enterPointBand`'s `[120, MAX]` ITF junior points is **our own invention** – a sensible number
for what it bought (the rung's own comment: *"a J60 title, or a J300 quarter-final, or a full book of
J30 results"*) in a unit the rule does not use. `onRampOpen`'s professional arm now reads her ITF
junior **rank** instead, against `JUNIOR_RESERVED` (world/entryCaps.ts).

⚠ **THE CUT IS A SHARE OF OUR OWN TABLE, NOT THE REGULATION'S 100.** `TierDef.enterPct` spells the
reason out at length: the ITF table here is a population artefact – 199 juniors plus the kid, no
external anchor – so "top 100" of the real combined list and "top 100" of ours are not the same rule,
and copying the count across is exactly the time bomb that field's warning is about. `rankPct = 0.15`
resolves to **#30 of 200**.

⚠ **AND 0.15 WAS CHOSEN TO HOLD TODAY'S DIFFICULTY, NOT TO RETUNE IT.** The baseline measured the
mean ITF rank at her first W15 entry at **#21**, and the median year-end junior rank at 15/16/17 at
33 / 30 / 31 – so a cut at #30 lands where the 120-point band already was. Step 1 is a change of UNIT
on this door and a change of RULE above it; loosening the door at the same time would have made the
wave's headline slowdown two effects wearing one number. **P4 is the check that it worked.**

⚠ **THE COHORT'S W15 DOOR MOVED WITH HERS.** `proDoors` is *"the kid's rule, line for line"* by
design – two doors onto one tour is what the comment there exists to prevent – so the AI side reads
the same cut, resolved against its own kid-free table. Blast radius is small and bounded: `proDoors`
feeds only `ON_RAMP.slots`, which is **2 of 32** in the canonical AI brackets, and her own shadow
draws never call it.

⚠ **`minAgeYears: 16` IS UNCHANGED AND THE DEVIATION IS DELIBERATE.** The real reserved place is age
14+. Ours opens W15 at 16 because `docs/specs/adult-tour-and-endings.md` §4.1 makes the 16-18 overlap
a design pillar – *"a sixteen-to-eighteen-year-old holds both tours at once and arrives at nineteen
having seen what each one costs and pays"* – and moving it is a separate decision with its own
measurement, not a side effect of changing a currency.

### 2b. Above W15, a junior's access is the Accelerator

`ACCELERATOR` (world/entryCaps.ts) is the table above, keyed on `yearEndJuniorRank` – a read of
**persisted history**, not a live fold, because the rule says year-end. The wrap-up has banked
exactly this number since v14 and per-table since v46, so **nothing new is persisted**.

⚠ **THE ALLOWANCE IS POOLS WITH CEILINGS, NOT A PER-RUNG COUNTER.** "3 tournaments up to W100, 2 up
to W75" is a sentence a per-rung counter cannot represent: #1's three W100 places may be spent at a
W35, and her two W75 places may not be carried up to a W100. `acceleratorAdmits` therefore checks
Hall's condition over the nested pools – for every rung L at or below the one asked about, the
entries already at L-or-above plus this one must fit the capacity that can serve L-or-above. Both
directions are walked explicitly in `tests/junior-access.test.ts` §2.

⚠ **SPENT ENTRIES ARE FOLDED OFF `seasonEntries` (v45), WHICH IS THE ONLY LEDGER THAT CAN ANSWER.**
`world.results` is award-only for the kid, so a first-round W35 exit leaves no row – and those are
precisely the entries an allowance counts. `proEntryWeeks` counts the right entries but keeps only
their week. `world.entries` is pruned to future events. `seasonEntries` holds one row per committed,
non-refunded entry, is reset by the wrap at the season boundary, and already obeys the rule an
allowance wants (a refunding withdrawal hands the slot back, every forfeiting exit keeps it). The
rung comes out of the row's event id, matched as a whole trailing segment against the catalogue.

### 2c. ⚠⚠ IT IS A CEILING, NOT AN EXTRA DOOR – and that is the finding, not a detail

Read as an extra door (an OR beside the acceptance cut) the Accelerator would change **nothing**,
because our W cut already admits 93-94% of careers to a W75 at 17.2 / #291. The real brake on a real
seventeen-year-old is that the direct-acceptance list is made of rankings built by playing W15s under
an age cap she cannot exceed – **two rules this game does not have yet (P2) and one cut that is
measurably too loose (P3)**. Until those land, the only honest model of *"a junior cannot reach a W75
unless she is world top 5"* is a ceiling on the junior.

**⚠ SO THIS IS THE FIRST THING TO REVISIT AFTER P2 AND P3.** Once the AER caps her season and the
cuts are the sourced ones, the rank route may become a real gate on its own, and the Accelerator
should then be re-measured as the OR the regulation literally is.

### 2d. What it is deliberately not asked of

1. **An adult entrant.** Past `JUNIOR_MAX_AGE_YEARS` (derived from the J rungs' own U18 ceiling)
   `juniorAccessOpen` returns true and she enters on her professional ranking exactly as today.
2. **W15.** The bottom rung has its own door, so a junior can never be left with nothing – her whole
   junior calendar and the dense W15 cadence remain.
3. **The WTA's own rungs.** `W_SERIES` is the ITF World Tennis Tour's five; the Accelerator's table
   stops at W100. Reading it against the whole `track === 'wta'` family would have barred a
   seventeen-year-old from the majors, which is the opposite of what juniors actually do.
4. **The cohort.** ⚠ **STATED SCOPE, NOT AN OVERSIGHT.** The rivals' access above W15 is unchanged.
   Capping them too would move the FIELD at every W rung, which changes her measured difficulty
   everywhere at once and destroys this wave's attribution – and it is P2's own explicit question
   («⚠ THE COHORT NEEDS IT TOO, or the field she meets is playing a different sport»). It belongs in
   that phase, with the AER, measured together.

---

## 3. GUARDS – what moved and why

**28 tests across 11 files went red. Every one is RE-AIMED with a ⚠ note at the site, none is
weakened or deleted, and the whole unit suite (2,987) plus the 415 component tests are green.**
They fall into four families:

**(a) FIXTURES THAT SPELLED THE OLD DOOR.** `tests/rankingGate.test.ts` asserted
`pointsToEnter === TIERS[w15].enterPointBand[0]` for any rung with no acceptance list; there are two
such rungs and they no longer share a currency, so the assertion became a helper (`expectOnRampLock`)
that says which of the two rules a rung obeys – **strictly more than the line it replaced**.
`tests/season/wOnRamp.test.ts` re-derives the cohort's door from `juniorReservedRank` instead of
`enterPointBand[0]`, with the bite assertion untouched.

**(b) FIXTURES THAT ARE ABOUT A DIFFERENT GATE AND NOW STAND BEHIND THIS ONE.**
`tests/ladder-floor.test.ts`' `proWorld`, `tests/unranked-sentinel.test.ts`' `worldAt` and
`tests/age-caps.test.ts`' `openProWorld` all build a SEVENTEEN- or SIXTEEN-year-old, i.e. a junior.
Each now banks a year-end junior **#1** season, exactly as each already sets `onRampCleared` – it
puts her past the new, orthogonal gate so the sliding window / the acceptance cuts / the pro cap stay
what those files measure. `tests/offers.test.ts` sets the latch for the same reason (its junior book
is written at week 0 and read at week 106, outside the ranking window).

**(c) THE FIXTURE WHOSE WEEK MOVED.** `tests/season-mirror.test.ts` needs a wrap where the card's
table and the latched table disagree; junior access changed WHEN this career reaches the professional
tour, so the same seed shows the same contradiction at the week-153 wrap instead of week 205 – the
same PAIR of tables (`itf` on the card, `wta` latched), not one assertion touched. Third re-aim of
the same kind on that file. `tests/season/wOnRamp.test.ts`' displacement case moved 45 → 105 weeks
because its precondition (`added.length > 0`) needs the rung to have an on-ramp candidate at all:
measured 1 candidate at week 45, 7 at week 105.

**(d) COMPANION MEASUREMENTS, NOT CHANGE-GATES.**
* `tests/condition.test.ts` / `planner.test.ts` / `injuries.test.ts`: `REF.kidRank` 87 → **89**, the
  sixth re-aim of that constant in six waves and the same second-order mechanism every time. ⚠ **The
  frozen MAIN capture is untouched – count 41550, hash `e6b0c709`** – and is asserted BEFORE the
  constant in each file. P1 draws on no stream at all: an access rule is a post-draw gate.
* `tests/coach-travel-edge.test.ts`: all three frozen career hashes re-frozen. ⚠ **The per-key diff
  that file demands was taken first**, all 63/64 top-level keys hashed on both trees: `results`,
  `bestFinishByTier`, the rank caches, `fundsCents`, `financeWeeks` and ~25 more moved – and
  **`coachId`, `coachOnEventWeeks`, `coachOnJuniorEvents`, `coachSince`, `profile`, `seed`,
  `rngMain`, `cohort` and `schemaVersion` did not**. What those hashes exist to catch is a coach
  change leaking past its scope; a ladder change that left `results` alone would be the alarm.

**(e) ONE UI LINE, and it is the round-17 #19 fix arriving on the other code.** `SeasonScreen`'s lock
chip fell back to the LADDER's note whenever a `locked` verdict carried no `pointsToEnter` – which
after this change would print *"takes the top 700 – she is #291"* on a card refused by the
Accelerator, about a cut she can see she is inside. It now prefers `ineligibleDetail`, the sentence
the gate itself wrote, exactly as the `unavailable` branch already does.

---

## 4. MEASURED

`npx vite-node tools/junior-access.ts -- --seeds 6 --weeks 416`, n = 54, identical seeds both arms,
baseline run in a worktree at `ea8b97f`. The baseline reproduces the plan's own headline figures
(W75 at 17.2 / #291 in 94% of careers; college shut in 94% at mean 17.3), which is what makes it the
right ruler.

### 4a. The headline

| | baseline | step 1 | |
| --- | --- | --- | --- |
| **age at first W75** | **17.2** | **19.0** | **+1.8 years** |
| ...its p25 / p75 | 16.9 / 17.2 | 19.0 / 19.0 | a hard step, not a spread |
| share ever entering a W75 | 94% | 94% | unchanged |
| her W rank at that first W75 | #291 | #279 | unchanged |
| **her ITF junior rank at it** | #52 | **#11** | the gate, visible |
| age at first W35 | 16.5 | 16.9 | |
| **share ever entering a W35** | **94%** | **56%** | |
| age at first W15 / its floor | 16.2 / 15.6 | 16.1 / **15.5** | **P4 HOLDS** |
| share ever entering a W15 | 96% | 96% | unchanged |

**The predicted slowdown is 1.8 years on the W75 door, and it lands as a STEP rather than a slope:**
p25 and p75 are both 19.0, because for 95% of careers the rung opens on the birthday that ends junior
eligibility rather than on a result. That is the Accelerator saying what it says – *nothing above W15
below year-end junior #21* – and the year-end table (§7 of the run) is why: across ages 15-18 only
1-4 careers of ~50 finish a season inside the junior top 10, and 7-15 inside the top 20.

### 4b. What she plays instead – and this is the other half of the finding

| entries per career | baseline | step 1 |
| --- | --- | --- |
| **W15** | 12.4 | **54.6** |
| W35 | 6.3 | 2.1 |
| W50 | 12.1 | 4.8 |
| W75 | 12.9 | 7.1 |
| W100 | 11.2 | 6.7 |
| WTA 125 | 10.2 | 7.2 |
| J30 / J60 / J300 | 22.0 / 16.0 / 3.7 | 22.4 / 16.5 / 3.2 |

**She is not idle – she is at a W15.** W entries per season at 16 and 17 are 19.3 and 14.8 against
19.1 and 12.2: the same volume, at the rung the sport actually holds open for her. **⚠ This is the
predicted halving (P5) failing, and failing in the right direction**: the boredom failure the owner
has ruled against twice did not happen, and the reason is structural rather than lucky – W15 keeps
its own door, its cadence is one every two weeks, and `tierOutgrown` stops closing rungs behind a
girl who cannot open the one above (world/ladder.ts records this).

**W35 is the rung that pays for it.** 94% → 56% ever, 6.3 → 2.1 entries: a junior needs year-end
top-20 for it and an adult steps straight past it, because by nineteen her W ranking already clears
W50 and W75. That is a real prediction to check against reality in P3, not a defect of this change.

### 4c. The climb – a DELAY, not a permanent cost

| median W rank at | baseline | step 1 |
| --- | --- | --- |
| 17 | 259 | 298 |
| 18 | 218 | 372 |
| **19** | **173** | **279** |
| 20 | 173 | 168 |
| **21** | **187** | **178** |
| career-high (mean) | 152 | 135 |

**The slowdown is worth about 100 places at nineteen and is GONE by twenty-one.** She arrives at the
same place roughly a year later and then very slightly ahead – the W15 grind is a worse year and a
better book. Prize banked by 19 falls **$116,778 → $80,146 (−31%)**; by the horizon it is
$314,068 → $305,613, i.e. **the money comes back too**.

### 4d. The college door – the plan's own hypothesis, confirmed

| | baseline | step 1 |
| --- | --- | --- |
| closure rate | 94% (51/54) | 96% (52/54) |
| **mean / median closure age** | **17.3 / 17.1** | **18.9 / 19.1** |
| closures at 17 / 18 / 19 | 47 / 3 / 1 | 5 / 8 / 39 |
| **open at the fork (19)** | **7%** | **76%** |
| closed by w75 / w100 / wta125 / wta250 | 38 / 8 / 2 / 3 | 30 / 9 / 13 / 0 |

⚠ **THE RATE DID NOT MOVE AND THAT IS NOT THE POINT – THE AGE DID.** The door still shuts in almost
every career, but it now shuts AT or AFTER the fork instead of two years before it, so the third
answer is actually on the table when the game asks the question: **7% → 76%**. This is exactly what
P1-before-P4 was ordered for, and it is the evidence P4 should re-read before adding machinery:
`collegeClosedFromTier` may now be doing approximately the right thing for the wrong reason.

### 4e. Survival

Careers ending before the horizon: **2 of 54 → 0 of 54** (the baseline lost one to bankruptcy and one
to injury). Nothing here made a career less survivable; the cheaper rung is cheaper.

### 4f. Predicted vs measured, scored

| # | predicted | measured | |
| --- | --- | --- | --- |
| P1 | ever-W75 >= 80% | 94% | ✓ |
| P2 | first W75 ~19.0-19.3 | 19.0 | ✓ |
| P3 | first W35 17.5-19 | 16.9, but only 56% ever get one | ✗ – the shape was wrong, not the direction |
| P4 | W15 door held | floor 15.6 → 15.5, ever 96% → 96% | ✓ |
| P5 | W entries at 16/17 halved | 19.1 → 19.3, 12.2 → 14.8 | ✗ – she plays the SAME amount, at W15 |
| P6 | closure rate well under half | 94% → 96% | ✗ – the rate is not what moved; the AGE is |
| P7 | open at the fork: a majority | 7% → 76% | ✓ |
| P8 | rank at 19/21 worse by 50-150 | 19: +106. 21: −9 (better) | ½ – the cost is a delay and it unwinds |
| P9 | prize by 19 materially lower | −31% | ✓ |
| P10 | survival unchanged | 2 → 0 ended early | ✓ |

**Six of ten, and the four misses are the findings.** P5 and P6 were both wrong because they assumed
the change would take tennis away from her; it moved her onto a different rung instead. P8 was wrong
about the shape: the cost is a delay that unwinds by twenty-one, which is a far better answer for the
game than a permanent tax and is the number P6 (the re-measure phase) should carry forward.

### 4g. ⚠ What the next phase must not read off this

* **The cohort is uncapped** (§2d.4), so the fields she meets at W35+ are unchanged. Every figure
  above is "the kid under the new rule in the old world". P2 owns the cohort.
* **`tools/ladder-baseline.ts` (P0) is the baseline OF RECORD.** This wave's baseline arm is a second
  reading of the same careers, taken in a worktree while P0 was still being built. **P0 landed while
  this step was being measured (`a5972a7`, `cc0ab32`, `8375fa9`) and the two agree:**

  | | P0 (n = 90, 14 → 26) | this arm (n = 54, 14 → 22) |
  | --- | --- | --- |
  | age at first W75 | **17.2** | **17.2** |
  | her W rank there | #283 | #291 |
  | ever entered a W75 | 83 / 90 (92%) | 51 / 54 (94%) |
  | college door shut | 83 / 90 (92%), mean **17.2** | 51 / 54 (94%), mean **17.3** |

  Two tools, two n's, two horizons, one answer – which is what makes the +1.8 years above a
  measurement rather than an artefact of how this file counts. **Where the two disagree, P0 wins**,
  and P0's own §8 explains why its figures differ by a point or two from the ones the plan published
  (`college-fork-2026-08.md` was measured on an older tree).
* **The W35 collapse (94% → 56%) is a prediction about P3.** The corrected acceptance chain lands on
  a rung almost nobody now visits; whether that survives is the question P3 was ordered to ask.
