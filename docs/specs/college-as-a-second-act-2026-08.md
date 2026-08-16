---
type: spec
status: current
area: engine/content
canonical: true
last-reviewed: 2026-08-16
---

# P5 – what is behind the door: four college years, and the one week that is not ours (16.08.2026)

**The phase that was scoped to put national-team competitions on the college calendar, found that
the recommended ones are five years too young for it, and measured that the door they sit behind is
the cheapest option in the game.**

`docs/plans/college-and-the-junior-ladder.md` §P5 set the brief:

> *"College today is a four-year silent skip that returns her with no ranking and one line of text.
> The door works; there is nothing behind it. … tasks #102 (college as a second act) and #108
> (national teams) are one mechanic, not two."*

---

## Current truth

- **College is four years she lives through, one at a time, and she may leave after any of them.**
  `resumeFromCollege` spends ONE year and re-latches the ending with the next year's date;
  `endCollegeEarly` is the other answer and it is refused engine-side before the first year is spent.
  Reality's own case is the early one: Diana Shnaider left NC State after about a season and is
  inside the WTA top 15.
- **One week of each year is not hers.** A national-team call-up arrives in the season's fourteenth
  week, cannot be declined, and pays **no prize money and no ranking points** – because the sport
  awards neither. It never touches `world.results`, never moves a rank, and rides
  `seed:callup:<week>`, its own sub-stream.
- ⚠⚠ **The competition is the SENIOR one, not the junior one the research recommends, and that is an
  age fact.** §0.
- ⚠⚠ **AND THE MEASUREMENT THAT MATTERS MOST IS NOT ABOUT THE CONTENT.** Four years at college
  against four years on tour, same 52 seeds: **college banks $106,699 more and finishes 121 ranking
  places worse**, at a cost of about a tenth of one skill point. That is a real trade and the year
  card now states it – but it is also the first time anyone has priced the third answer, and §6.1 is
  the owner's question about it.

---

## ⚠⚠ 0. THE FINDING THAT MOVED THE SCOPE, BEFORE A LINE WAS WRITTEN

**The two national-team competitions the research recommends building CANNOT happen during college,
and it is an age fact, not a judgement.**

| competition | real age band (`national-team-competitions.md`) | our college years |
| --- | --- | --- |
| World Junior Tennis (14U) | **11–14** (§2.1, born 2012–2015 for the 2026 edition) | 19 → 23 |
| BJK Cup Juniors (16U) | **13–16** (§3.1, born 2010–2013) | 19 → 23 |
| **the senior competition** | **14 and over** (§5.7, Reg 13.1.1) | 19 → 23 ✅ |
| the Olympics | 15 and over (§6.7) | 19 → 23 ✅ |

`national-team-competitions.md` §11.3 recommends **exactly the two rows that do not overlap** –
*"Build ITF World Junior Tennis (14U), or its 16U twin … Do not build the Billie Jean King Cup"* –
and its reason is sound on its own terms (§11.1.1: the junior bands *"are the only ones a new player
would ever meet"*, because they are live from the first season). **But the plan asked for the
calendar of the COLLEGE years, and the junior bands closed three years before the fork.**

So "#102 and #108 are one mechanic" is **true, and the mechanic is the senior one** – the only
national-team competition whose real age band covers a college player, and the one the research puts
last. What makes that affordable is that §11's objection to the senior competition is an objection to
its **shape**, not to its existence: *"Four levels, promotion and relegation, a Nations Ranking, three
different tie formats"*. **None of that is built here.** §11.3's own recommended shape – *"the
letter"*, one week a year, arriving rather than chosen – is what ships, pointed at the age band
college actually occupies.

⚠ The Olympics is the other age-eligible row and it is **not built**, for the research's own reason
(§11.3): the LA28 tennis regulations are unpublished, so a faithful version cannot be written today,
and *"building the eligibility gate without the Games is worse than not building either"*.

---

## 1. PREDICTIONS – WRITTEN BEFORE ANYTHING WAS RUN

CLAUDE.md invariant 4. These were committed in `71114d6`, before the probe ran and before a line of
the feature existed. **Two of the five were wrong, and both errors are more useful than the feature.**

| # | prediction | verdict |
| --- | --- | --- |
| **P1** | **Every P0 column moves by exactly zero.** `tools/ladder-baseline.ts` never answers the fork (its own header: *"THE FORK AT NINETEEN IS NEVER ANSWERED"*), so no career in the battery ever enters college, so nothing this phase adds is reachable from it. | ✅ **held** – §5 |
| **P2** | **The frozen MAIN capture (41550 draws / `e6b0c709`) is unchanged.** The call-up draws on `seed:callup:<week>`; every other new step is pure state. | ✅ **held – no pin update** |
| **P3** | **The freeze costs her development, and by a lot** – four years at the un-coached rate, so the measured rating gain is **positive but under half** of four coached years. | ⚠⚠ **WRONG. 90%.** |
| **P4** | **She comes out with a rank the engine can state**, at the dense floor of the zero-point group. | ⚠⚠ **WRONG, and interestingly.** Her rank is **identical at both ends** – she was already off the list walking in. |
| **P5** | **The early return is the whole feature** – three of the four years are a real question and the fourth is not. | ✅ **held**, and it is what `CollegeProgressView.final` carries |

---

## 2. ⭐⭐ THE MEASUREMENT – AND THE HEADLINE IS NOT ABOUT THE CONTENT

### 2a. Method

A pre-build probe over `tools/econ-bench.ts`'s nine presets × 6 seeds on `POLICIES[1]`, walked to the
fork and then split into **three arms sharing the same seeds and the same world up to that week**:

| arm | what it does after the fork |
| --- | --- |
| **COLLEGE** | `answerFork('college')` then the full four years |
| **coached, no events** | four years of `tickWeek` with the coach still working – the counterfactual for P3, holding tournaments at zero so the ONLY difference is the coach |
| **ON TOUR** | four years of `stepCareerWeek` under the same policy – the real counterfactual for "is the third answer free" |

n = **52** careers reached the fork with the college answer still on the card. The probe is scratch
and is not committed; it reads the engine and patches nothing.

### 2b. P3 – what four college years do to her game: **almost nothing**

| | median | min | max |
| --- | --- | --- | --- |
| skill mean at the fork | **58.64** | – | – |
| +4 years AT COLLEGE | **+1.057** | +0.554 | +1.541 |
| +4 years COACHED | **+1.177** | +0.554 | +1.593 |
| **college / coached** | **90%** | | |

⭐ **THE PREDICTION WAS WRONG AND THE REASON IS THE AGE CURVE.** `coachWorksThisWeek` returns `false`
for the whole freeze and `growWeek` reads the same predicate, so college really is 208 weeks at the
un-coached rate – but at nineteen she is nearly done growing, so the whole four-year difference
between a coached year and an un-coached one is **0.12 of one skill point on a base of 58.6**. The
scholarship does not cost her her game. **So the year card does not say that it does**, which is the
sentence a guess would have shipped.

### 2c. P4 – what she comes back with: **the same rank she walked in with**

| | at the fork | after four years |
| --- | --- | --- |
| ITF rank | #86 | **#86** |
| professional rank | #290 | **#290** |

⭐ **"NO RANKING AT ALL" WAS DESCRIBING A STATE SHE WAS ALREADY IN.** The old epilogue line asserted
that four years of student tennis cost her a ranking. It did not: at nineteen her professional
results are too few and too recent to put her on the list at all (`RANKABLE_MIN` – three counting
tournaments or ten points), so `kidLadderRank(world, 'wta')` is already `null` the week she walks in
and is still `null` the week she walks out. **The four years took nothing from her because there was
nothing there to take**, which is a much better sentence than the one it replaces and it is the
research's own shape: only ~4-5% of incoming Division I women hold any professional ranking at all.

### 2d. ⭐⭐ THE ONE THIS PHASE DID NOT GO LOOKING FOR: **college is the cheapest answer at the fork**

Same 52 seeds, four years, college against the tour:

| | COLLEGE | ON TOUR | difference |
| --- | --- | --- | --- |
| funds delta over four years | **+$152,243** | **+$45,544** | **college banks $106,699 more** |
| professional rank after | **#290** | **#169** | the tour is **121 places** better |
| skill gain | +1.057 | – | ~0.12 behind the coached arm |
| careers that ENDED in the four years | 0 / 52 | **0 / 52** | neither arm kills anybody |

**So the third answer costs 121 ranking places and pays $106,699.** For scale, the largest starting
capital in the game is $120,000 (`STARTING_FUNDS_CENTS.wealthy`) and the smallest is $8,000: **four
years at college hands a working-class family more than thirteen times what it began with.**

⚠ That is not a claim that college is overpowered – it buys nothing that wins a career, and the 121
places are real. It is a claim that **nobody had ever priced the answer**, and now somebody has.
§6.1 puts it to the owner.

---

## 3. WHAT A COLLEGE YEAR IS NOW, WEEK BY WEEK, AND WHAT THE PLAYER DECIDES IN IT

**Weeks 0–51 of each year** – unchanged, and that is deliberate: every one of them was already
modelled and none of it was visible.

| what happens | where the rule already lived |
| --- | --- |
| the programme coaches her, the family is billed nothing | `coachWorksThisWeek` returns false at college – **one clause moves the bill and the development rate together** |
| she trains and develops at the un-coached rate | `growWeek`, reading the same predicate – measured in §2b |
| she enters nothing, so her results age out of the 52-week window | `pruneResults` + `computeRanking` – measured in §2c |
| no academy reviews her, no sponsor writes, no kit deal, no knock | five `inCollege` guards in `tickWeek`, all pre-existing |
| **week 14: her country may call** | ⭐ NEW – `resolveCallUp`, in the slot `rollKnock` occupies on an ordinary week |

**The decision is at the boundary, and there are three of them.** At the end of each year the
epilogue screen shows the year that just happened and asks two questions of equal weight:

* **Another year** – student tennis, no ranking points, the family still pays nothing.
* **Back on tour now** – she leaves the scholarship and starts again from qualifying.

⚠ **THE CARD MAY NOT RECOMMEND** (ruling 4, 30.07 – the same rule the fork at nineteen keeps). Two
options of ONE weight, not a CTA pill beside a text link, because the styling is an opinion in a
different font. A mounted test asserts no verdict word appears anywhere in the block.

**What the card states, all of it off the engine:**

| row | what it is |
| --- | --- |
| `Year N of 4` | `CollegeProgressView.yearsDone` + `ENDINGS.collegeYears` – never a template's idea of four |
| **Banked** | `CollegeYear.fundsDeltaCents` – the one stretch of the game where the money goes the other way |
| **Rank** | `#A to #B`, or `– to –`. ⚠ **A dash is not #1** – the contract `LadderView.rank` keeps |
| the call-up | who called, what she played, where the nation finished, and that it paid nothing |

⚠ **THE ROWS ARE MEASURED AT THE TWO ENDS AND PERSISTED, because nothing else in the save can rebuild
them.** `pruneResults` deletes a result 52 weeks after it happened and `financeWeeks` keeps a 60-week
window, so by the fourth year's card the first year's rank and balance are gone. Same argument
`CareerTotals` makes; same 49-week hole v45 and v46 exist because of.

---

## 4. THE CALL-UP – WHAT IT IS AND WHAT IT REFUSES TO BE

`src/engine/nationalTeam.ts` is a leaf: no `WorldState`, no calendar constant, an `Rng` handed in.
Every constant carries `[R]` and a research section, or says **OURS** in as many words.

| constant | value | source |
| --- | --- | --- |
| minimum age | **14** | `[R]` §5.7, Reg 13.1.1 |
| the week | season week **14** (April) | `[R]` §5.4 – the qualifying round |
| squad | **4** | `[R]` §5.3, Reg 37.3 (three to five plus a captain) |
| ties in the week | **3** | OURS – §5.4's "up to seven days" at two days a tie |
| nations at her level | **14** | `[R]` §5.1 |
| chance the letter comes | **0.4** | ⚠ **OURS, and the one number with no source at all** |
| rubber win chance | `0.5 + (skill − 62) × 0.02`, clamped 0.08–0.92 | OURS – calibrated on §2b's measured 58.64, so a median nineteen-year-old is a **43%** bet against her nation's senior squad, which is where a player low in the order of merit belongs |

**Three properties, all tested:**

1. ⭐⭐ **IT PAYS NOTHING, IN BOTH CURRENCIES.** No ranking points (§0.4/§5.5: no row in the 2026 WTA
   chart, no player ranking-points provision in the competition's own regulations) and no prize money
   that reaches her (§5.6: player prize money exists *"For the Finals only"*; below that a player's
   compensation is entirely at her federation's discretion). It never writes to `world.results`,
   never recomputes a rank, and never moves `fundsCents` – so the `prizeCentsFor` invariant
   (*"a result cannot award one without the other"*) is not being bent. **There is no result.**
2. **SHE DOES NOT CHOOSE IT AND CANNOT DECLINE IT** (§0.7, §0.8), and she may be named and never take
   the court (§5.7 – representation *"is deemed to occur on nomination, not on playing"*). The copy
   says both.
3. ⚠ **HER NATION'S FINISH IS NOT ABOUT HER.** Drawn flat; the rule reads nothing about her to place
   it. A test runs the strongest and the weakest possible player through identical seeds and asserts
   the placings are **equal**. Research §11.1.2 calls this the reason to build the thing at all –
   *"Nothing else we model pays her on somebody else's result"* – and at senior level the payment is
   zero either way, which is the sharper version of the same point.

**Four draws, always, in the same order**, whether or not the letter comes – the same post-draw
discipline the sponsor gift keeps, so the draw count cannot depend on its own outcome. Counted
through a wrapper over 200 weeks in the test, with both branches exercised.

⚠ **A TIE IS TWO SINGLES AND A DOUBLES AND WE MODEL THE SINGLES ONLY** – a deviation written down
rather than discovered (§11.2e: *"this engine has no doubles at all"*). The copy never says the word.

⚠ **THE NAME IS FICTIONAL.** ITF/WTA/ATP and the real competitions are trademarks, so it is named for
its category the way every rung is (`Local Open`, `World Tour 75`, `Grand Slam`). A test asserts no
real body's name is constructible from the label.

---

## 5. PREDICTED vs MEASURED – this phase's own changes

**PREDICTION P1, written before the work:** every P0 column moves by **zero, exactly**, because
`tools/ladder-baseline.ts` never answers the fork and every new code path in the tick is behind
`inCollege`.

| claim | how it was checked | result |
| --- | --- | --- |
| no career in the battery can reach the new code | the tool's own documented property (*"THE FORK AT NINETEEN IS NEVER ANSWERED"*) plus the one tick hook, which is the `else` branch of `if (!inCollege(world))` | ✅ inert by construction |
| P0's battery is unchanged on the tree | `npx vite-node tools/ladder-baseline.ts` re-run after the change | ✅ §5a |
| **no MAIN draw added** | `tests/condition.test.ts`'s frozen capture (41550 draws / `e6b0c709`) | ✅ **unchanged – no pin update needed** |
| input-independence survives a college YEAR | `tests/college-second-act.test.ts` – a career that answered "college" and a control that did nothing are on the same MAIN position after 52 weeks, and the next value off each stream is equal | ✅ |
| input-independence survives all four | `tests/ending.test.ts`'s existing case, re-aimed to four calls | ✅ |
| the save schema move is complete | `SAVE_SCHEMA_VERSION` 49 → **50**, an append-only v49→v50 step, `tests/fixtures/saves/v50.json`, `tests/goldenSaves.test.ts` green on all 51 fixtures | ✅ |

### 5a. The battery, re-run

<!-- MEASURED -->

---

## 6. ⚠⚠ FOR THE OWNER – three things, and one of them is a balance decision

### 6.1 ⭐ THE THIRD ANSWER HAS NEVER BEEN PRICED, AND IT IS NOW

§2d: four years at college bank **$106,699 more** than four years on tour and finish **121 ranking
places worse**, on the same 52 seeds. Nobody has ever put those two numbers beside each other,
because until this phase the answer was a skip.

**That is a real trade and it is probably a good one to have in the game** – it is exactly the
"invest without knowing the return" question the whole design is about, pointed at the parent instead
of at the tennis. But two things should be said out loud:

* **The money is very large in the family's own terms.** $152,243 over four years is more than the
  wealthiest starting capital ($120,000) and nineteen times the working-class one ($8,000). A family
  that goes to college comes out solvent whatever it was before.
* **P6 will re-measure the ladder and this number will move with it.** Do not tune it here. If the
  balance wants an answer, the honest lever is the same one P6 names – the points table or the
  calendar's density – not a quiet cost added to the scholarship.

**No agent should pick.** What ships is the do-nothing option: the years are lived, the numbers are
stated on the card, and nothing was tuned.

### 6.2 THE JUNIOR TEAM COMPETITIONS ARE REAL, ARE NOT BUILT, AND ARE CHEAP TO ADD LATER

§0. World Junior Tennis (11–14) and the 16U competition (13–16) both land inside the game's own first
seasons and both would be the same mechanic with a different age row – and they carry the property
the senior one does not: **≤95 ranking points, once, and only if her nation finishes top 8.**

They are not here for one reason and it is a measurement, not taste: **a call-up week before the fork
displaces a week she would have played for points**, which is a balance change and P6's re-measure
owns the balance. The wiring is a table row and a widened age gate; the cost is a P0 run to prove
what it moved.

### 6.3 THE EPILOGUE LINE THAT WAS WRONG, AND IT WAS WRONG IN A NUMBER

*"Four years, a degree and no ranking at all."* Three defects: it said "four years" unconditionally
(so an early return would have printed it after one), it promised a degree, and it asserted a ranking
loss that §2c shows never happened. Replaced with the years she actually spent, the money the family
actually banked, and her actual standing – all read off state rather than written into a template.

---

## 7. WHAT WAS DELIBERATELY NOT BUILT

| | why |
| --- | --- |
| **a college competition** – a dual-match season, a line-up position, a team title | ⚠ **NOT SOURCED.** `college-and-the-junior-exit.md` §3 has exactly one anecdote about it (Reese Brantmeier played No. 1 singles on the 2023 NCAA team title winners) and §2's own headline is that **nobody publishes the join**. One case is not a distribution, and a simulated college season would have been a table of invented numbers on the one screen this phase exists to make honest. |
| **the junior 14U / 16U call-ups** | §6.2 – real, cheap, and a balance change P6 owns. |
| **the Olympics** | The research's own verdict (§11.3): the LA28 tennis regulations are unpublished, so a faithful version cannot be written, and the eligibility gate without the Games is *"a cost with no reward"*. |
| **the senior competition as a LADDER** – four levels, promotion, relegation, a Nations Ranking | §11.3, and §11.4's own cut criterion: *"the moment this competition has promotion, relegation and a points table, it has become another rung of the thing it was supposed to be a relief from."* |
| **the United Cup** | §11.3: mixed, needs a men's tour we will never have, unreachable below the top ten. |
| **a doubles rubber** | §11.2e: this engine has no doubles at all. Modelled as singles, said so in §4. |
| **a degree, or anything a degree does** | It does nothing in this game, and a mechanic that pays for staying would have put a thumb on §6.1's scale. |
| **a compatriot team of named players** | §11.2a: `NATION_WEIGHTS` has 36 nations and `OnboardingWizard`'s list has 24, they are not nested, and a guaranteed compatriot pool changes `makeJunior`'s draw order – which is the one thing the frozen MAIN capture most forbids. The letter names no team-mates. |

**AND THE HONEST SIZE OF WHAT DID SHIP.** The plan's phrase was *"a stretch of playable life"*, and
what is here is smaller than that: four years of weeks the player advances through one year at a
time, one arriving event a year, and **three decisions where there were none**. Nothing in the
college years is week-to-week playable, because nothing sourced says what a college week contains.
What was buildable was the shape of the years and the question at the end of each, and that is what
was built.

---

## 8. FILES

| file | what changed | risk |
| --- | --- | --- |
| `src/engine/nationalTeam.ts` | **new.** The call-up as a leaf – constants with sources, `rollCallUp`, `rubberWinChance`, `callUpLine` | none – nothing calls it outside the freeze |
| `src/engine/world/college.ts` | **new.** The seam: `inCollege` (moved here to break a cycle), `resolveCallUp`, `bankCollegeYear`, `leaveCollege`, `collegeProgressOf`, `collegeEpilogueLine` | none – every path is behind `inCollege` |
| `src/engine/world.ts` | `resumeFromCollege` spends ONE year and re-latches; `endCollegeEarly` added; the tick's `rollKnock` line gains an `else`; `SAVE_SCHEMA_VERSION` 49 → 50 | ⚠ the resume's contract changed – three tests re-aimed with notes |
| `src/engine/world/endings.ts` | `answerFork` writes the two new `CollegeState` fields; `buildEndingView` carries the progress; `inCollege` moved out | none |
| `src/engine/world/birthday.ts` | imports `inCollege` from its new home | none |
| `src/engine/ending.ts` | the college ending's `resumesWeek` is one year; the blurb no longer promises four years, a degree or a ranking loss | copy + one expression |
| `src/engine/migrations.ts` | the v49 → v50 step – an empty ledger, no invented rows, the span untouched | none – append-only, idempotent |
| `src/shared/protocol.ts` | `CollegeYear`, `CollegeCallUp`, `CollegeProgressView`; `CollegeState` +2 fields; `EndingView.college`; the `endCollegeEarly` wire | none – additive |
| `src/worker/sim.worker.ts`, `src/stores/game.ts` | the `endCollegeEarly` command | none |
| `src/components/EndingScreen.vue` | the year card and the two answers replace the one pill | ⚠ the only screen change in the phase |
| `tests/college-second-act.test.ts` | **new.** 20 engine cases | – |
| `tests/component/college-second-act.test.ts` | **new.** 12 mounted cases, incl. two phone measurements and two mutation proofs | – |
| `tests/ending.test.ts` | 4 cases re-aimed with ⚠ notes; none deleted or weakened | – |
| `tests/component/endings-ui.test.ts`, `tests/birthday-gifts.test.ts` | re-aimed with ⚠ notes | – |
| `tests/fixtures/saves/v50.json` + `README.md` | the golden fixture, with a real banked year in it | – |

**Reproduce:**

```bash
npx vite-node tools/ladder-baseline.ts   # §5a – P0's frozen battery, unchanged
npm run test:quiet                        # the unit project
npm run test:component                    # the mounted UI gate
```
