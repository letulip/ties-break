# School ends – W4-SCHOOL, 05.08.2026

The owner, from his own playtest, twice:

> *«Школа должна когда-то закончиться, ей уже 21, а тренировки и прогресс должны удвоиться,
> соответственно, как мне кажется. Школа уже после 18 вроде не должна быть.»*

and, a day later, still true in his career:

> *«и школа с уроками в 22 года всё еще со мной»*

Two things in one sentence, and only one of them was a bug. **School never ending is a defect and it
is fixed.** **Training doubling is a balance change**, so invariant 4 applies: it ships with a bench
and this page, predicted against measured. And in front of both there was a factual question the
owner asked to have checked rather than confirmed – *«это про то, как реальные спортсменки
тренируются, на сколько я знаю. Проверь.»* – answered in `docs/research/real-training-hours.md`.

Bench: `npx vite-node tools/school-bench.ts --seeds 4`. All figures below are that run.

> **THE THREE ANSWERS.**
> **(1) School ends at the 1 September after her last grade** – his own ruling, «Конец школы – в
> конце учебного года» – which lands at a real age between **18.00 and 18.92** for every birth month
> the game can roll, and clears the act-3 fork at nineteen. The player learns of it from a milestone
> in the feed and the album's scroll, a calendar that stops drawing lessons, and a tile that says
> *School's done*. A career already past it – his – gets the milestone from the **v43** migration.
> **(2) "Doubles" does not survive contact with the world.** The real multiplier when school ends is
> **1.2–1.4x, not 2x**, and the reason is that the school-age baseline is already high: the LTA's own
> term-time standard for an 18U girl is 23 h/week against measured professional weeks of 17–23.
> **(3) And it does not survive contact with the bench either, in the direction he suspected least.**
> Doubling the load buys **+0.69 peak skill – 0.29 of one junior year** – because realisation was
> already 94% and the dial is fighting over the six points of headroom the model has left. What
> genuinely moves is the **median** rank, and it moves as much at 1.4 as at 2.0.
> **`ECONOMY.school.loadFactor` ships at 1.4 – the summer block's own number – and `conditionCost`
> at 0.**

---

## 1. What was actually wrong

`isExamWeek(week)` was a pure function of the season week. Nothing in the game knew that school ends,
so at twenty-two:

* she still sat two exam papers every June, and could enter no tournament in that fortnight;
* the calendar drew a `School` block at eight in the morning on every weekday of every week, and a
  `Study` hour at six in the evening – `weekGrid.ts`'s `BAND_FROM` had exactly one rung, `{ from: 0,
  band: 'school' }`, and its own note called the other two bands "a design decision nobody has taken
  yet";
* the diary wrote her revising at the kitchen table, the fridge scrap wished her luck in the exam,
  the season wrap-up said *«Off-season now: rest, school, family time»*, and a light week was *«school
  catches up»*.

⚠ **AND ONE SURFACE HAD BEEN RIGHT ALL ALONG, WHICH IS WHY THE FIX IS SMALL.** `kidLife.ts`'s
`gradeOf` has modelled a real school year – 1 September cut-off, twelve grades – since the School
tile shipped, and it already returned `null` past the last grade with the tile reading *School's done
/ Tennis full-time*. **No other surface read it.** This wave did not invent a school calendar; it
made the rest of the game read the one that was already there.

---

## 2. Where school ends, and why there

The owner ruled it: **«Конец школы – в конце учебного года»** – the end of the school year containing
her eighteenth birthday, not the birthday itself. That is what happens to a person, the calendar
already has the boundary (`SCHOOL_YEAR_TURNS_AT = 34`, the season-week whose Monday is 1 September),
and `gradeOf` already computes it. `schoolEndWeek(birthMonth)` solves the same arithmetic for the
year instead of the grade.

Measured over all twelve birth months (`school-bench --only 0`):

| birth month | career week | season | offset | her REAL age that week |
| --- | --- | --- | --- | --- |
| 1–8 (Jan–Aug) | **242** | 4 | 34 | 18.58 · 18.50 · 18.42 · 18.33 · 18.25 · **18.17** · 18.08 · **18.00** |
| 9–12 (Sep–Dec) | **294** | 5 | 34 | **18.92** · 18.83 · 18.75 · **18.67** |

**Never before eighteen and never at nineteen**, for any girl the game can generate – which satisfies
«школа уже после 18 вроде не должна быть» exactly. The two-week spread is the relative-age effect
seen from the classroom instead of the draw sheet: a September-born girl is the oldest in her class
and leaves a whole year later in absolute time than an August-born one, at almost the same age.

⚠ **AND IT DOES NOT CONTRADICT THE ACT-3 FORK, which was checked before anything was written.**
`ENDINGS.forkAgeYears` is **19** and the fork is raised on her birthday week
(`docs/specs/endings-and-the-album.md` §1): *"She is nineteen. The junior ladder is behind her, and
the next one has to be paid for."* She is out of school **before** she is asked whether to turn
professional or take the college scholarship – which is the order those two questions come in for a
real player, and would not have been true of a rule keyed on her eighteenth birthday for eleven
months of the twelve.

**Rejected: her eighteenth birthday.** It would end school mid-term for eleven girls in twelve, it
would contradict the tile that has said otherwise since it shipped, and it would put the leaving beat
on the same week as `markBirthday`'s own line – two announcements about the same girl in one feed.

### 2a. How the player learns of it

Not a flag flip. The register of this game is that things happen to a family and get noticed, so
leaving school is **a moment**, on four surfaces:

| surface | what she sees |
| --- | --- |
| the news feed, that week | *"School is behind her. From Monday the mornings are hers too."* – a `milestone` event with `keep: true`, so the ledger's 400-row prune can never lose it |
| the album's scroll | a new `MilestoneType: 'school'`, labelled **School behind her** / *the last school year is over*. ⚠ Not an eighth polaroid – the seven slots are §9.2's and this is a change rather than a triumph. Its memory face is `norm`, not `happy`: nobody beat anybody |
| the Kid screen | the School tile flips to **School's done / Tennis full-time** – the line that was already written and never reachable in a playtest |
| the calendar, from that Monday | the eight-o'clock lesson block and the evening homework hour are gone; a court day draws **Early hit 09:00** and the plan's **Tennis drills 15:00**, and the sentence under the grid reads *"N days on, two sessions a day – the mornings are hers now."* |

---

## 3. Predicted, then measured (invariant 4)

Predictions were written from `docs/specs/skill-model-audit-2026-08.md` §4's headroom table before
the population run was read; the arithmetic is reproduced so each is checkable rather than
remembered.

| # | predicted | measured | verdict |
| --- | --- | --- | --- |
| P1 | Removing the exam blackout on its own is **worth nothing measurable** either way: it is 2 weeks of 52, and only from season 4 of a career that lives ~10 | peak **59.55 → 59.48** (grinder), **60.00 → 59.93** (player); events/season 26.2 → 26.2 and 16.6 → 16.9; every rank column inside its own noise | **right** |
| P2 | Doubling the load buys **≈ +0.5 skill**. §4 of the audit puts realisation at 81.1% by 18 and 95.6% ever, so the post-18 decay factor is `(1−.956)/(1−.811) = 0.233`; doubling the rate squares it to `0.054`, leaving 98.97% realised, i.e. `(0.9897−0.956) × 15 = +0.51` points | **+0.69** peak skill, realisation **93.9% → 97.6%** | **right, and slightly under** |
| P3 | It does not move her RANK outside noise – skill and rank are only loosely coupled below the top of the ladder (audit §8a) | **best** moves in no consistent direction on any arm (isolated #115 → #109, grinder #129 → **#141 worse**, player #102 → #101); **median** improves monotonically with the dial on all three (#176 → #150, #216 → #190, #159 → #151) | **half right** – best is noise, the MEDIAN moves and it moves the same way three times |
| P4 | Charging the summer block's `conditionCost: 3` year-round is a real fatigue change and will show at the off-season door | mean condition **83 → 78**, door **91 → 84**, weeks lost per career **12.9 → 16.0**, and **+0.00 extra skill** for all of it | **right, and it is the finding that decides the shape** |

---

## 4. The load dial, swept – THE GROWTH MODEL ISOLATED

`skill-ceiling.ts` §2(b)'s own arm, so the two pages compare: the richest preset, an elite coach, the
careful policy, plays-on, the bankruptcy latch defused. **Whatever more training can do, it does
here.** 12 careers, fourteen to thirty-eight.

| arm | peak skill | realised % | age at peak | best W | median W | ev/season |
| --- | --- | --- | --- | --- | --- | --- |
| school never ends (**SHIPPED**) | 60.95 | 94.2 | 28.9 | #115 | #170 | 13.9 |
| school ends, load **1.0** | 60.89 | 93.9 | 28.9 | #115 | #176 | 14.0 |
| ends, load **1.2** | 61.08 | 94.9 | 28.9 | #103 | #171 | 13.8 |
| ends, load **1.4** (summer parity – **SHIPS**) | **61.25** | **95.8** | 28.9 | #106 | **#161** | 14.0 |
| ends, load **1.7** | 61.44 | 96.8 | 28.9 | #106 | #167 | 13.9 |
| ends, load **2.0** (his number) | 61.58 | 97.6 | 28.9 | #109 | **#150** | 13.9 |
| ends, load 1.4, **cost 3** | 61.24 | 95.8 | 28.9 | #115 | #163 | 12.8 |
| ends, load 2.0, **cost 3** | 61.58 | 97.6 | 28.9 | #115 | #180 | 12.7 |

Against the yardstick the whole codebase prices development in – `SKILL_POINTS_PER_YEAR` = 2.4:

| arm | Δ skill vs load 1.0 | = years of junior development | Δ weeks lost per career |
| --- | --- | --- | --- |
| load 1.2 | +0.19 | 0.08 | +0.8 |
| load **1.4** | **+0.36** | **0.15** | +0.8 |
| load 1.7 | +0.55 | 0.23 | −1.3 |
| load **2.0** | **+0.69** | **0.29** | +0.7 |
| load 1.4, cost 3 | +0.35 | 0.15 | **+3.1** |
| load 2.0, cost 3 | +0.69 | 0.29 | **+3.3** |

**Three readings, and the third is the one that decides the shape.**

1. **The dial works and it is small.** Doubling the hours moves realisation from 93.9% to 97.6% and
   buys 0.69 skill points – **less than a third of one junior year**, and about half of what the
   whole coach ladder is worth (1.34 points, audit §8a). That is not the dial failing; it is the
   dial hitting the wall the skill audit already measured. **Realisation was 94% before this wave
   touched anything, so more of the same training could only ever buy the last six points, and even
   perfect realisation is only +0.9.**
2. **The curve is almost exactly linear in the multiplier and it does not saturate**, which is worth
   saying because it means there is no "correct" value to find by measurement. 1.2 → 1.4 → 1.7 → 2.0
   buys 0.19 → 0.36 → 0.55 → 0.69. Anything in that band is defensible on the skill axis alone; the
   number has to be picked on other grounds, and §6 is those grounds.
3. ⚠ **THE CONDITION COST IS PURE LOSS AND THAT IS THE ONE UNAMBIGUOUS RESULT ON THIS PAGE.** Charging
   the summer block's 3 points year-round buys **+0.00 skill** at either multiplier – 61.24 against
   61.25, 61.58 against 61.58 – and costs **+3.1 to +3.3 weeks in the treatment room per career**,
   five points of mean condition, six at the off-season door, and a season's worth of entries
   (14.0 → 12.7 events a season). It is a bill with nothing on the other side of it.

**«Мы ни за что не наказываем» settles it.** A change that makes her more injured and less able to
enter tournaments *because she left school* is the game punishing her for growing up, and it buys
nothing. `ECONOMY.school.conditionCost` is **0**.

⚠ **AND THAT IS NOT AN INCONSISTENCY WITH THE SUMMER BLOCK'S 3.** The summer cost was sized for a
NINE-WEEK window against a body carrying a season; it bites, correctly, on the girl who is already
tired (`summer-bench` §1c). Applied to thirty-odd weeks a year it stops being a block and becomes the
recovery rate wearing a different hat – `recoveryBase` 8 → effectively 5, which
`docs/specs/fatigue-injury-audit-2026-08.md` §5a swept and declined explicitly, in the week the owner
asked for MORE recovery. Same number, four times the window, different object.

---

## 5. The same dial on the population the game ships

§4 measures what the dial CAN do. This measures what it DOES to a career money and the plateau
reading can stop. All nine presets, 4 seeds, every latch live – 36 careers an arm.

**GRINDER policy**

| arm | peak | realised % | best W | median W | prevalence % | wks lost/career | mean cond |
| --- | --- | --- | --- | --- | --- | --- | --- |
| never ends (SHIPPED) | 59.55 | 79.0 | #127 | #231 | 44.0 | 21.7 | 49 |
| ends, load 1.0 | 59.48 | 78.4 | #129 | #216 | 41.8 | 19.1 | 49 |
| ends, load **1.4** | 59.75 | 80.2 | #137 | **#196** | 41.1 | 19.7 | 50 |
| ends, load 2.0 | 59.94 | 81.6 | #141 | **#190** | 42.1 | 17.1 | 49 |

**PLAYER (careful) policy**

| arm | peak | realised % | best W | median W | prevalence % | wks lost/career | mean cond |
| --- | --- | --- | --- | --- | --- | --- | --- |
| never ends (SHIPPED) | 60.00 | 82.4 | #94 | #154 | 25.8 | 9.6 | 76 |
| ends, load 1.0 | 59.93 | 81.9 | #102 | #159 | 27.6 | 9.6 | 77 |
| ends, load **1.4** | 60.16 | 83.5 | #102 | **#155** | 26.9 | 8.4 | 77 |
| ends, load 2.0 | 60.45 | 85.6 | #101 | **#151** | 26.4 | 9.3 | 76 |

⚠ **THE `best` COLUMN GOES THE WRONG WAY AND IT IS NOISE, WHICH THE SKILL AUDIT PREDICTED IN
WRITING.** Its §12 says *"single-career ranks swing 100 places on the same dial – treat every rank in
section 8 as a direction, not a value."* A best-of-36 is one career; the median is thirty-six. The
median improves monotonically with the dial on both arms and the best does not move consistently on
either. **The honest claim is therefore: more training makes the TYPICAL career slightly better and
does nothing detectable for the best one.**

⚠ **AND NOTHING HERE COSTS THE BODY, ON EITHER ARM.** Grinder: prevalence 44.0% → 41.1–42.1%, weeks
lost 21.7 → 17.1–19.7, mean condition flat at 49–50. Player: prevalence 25.8% → 26.4–27.6%, weeks
lost 9.6 → 8.4–9.3, mean condition flat at 76–77. Against `docs/specs/fatigue-injury-audit-2026-08.md`'s own baselines
(prevalence 38% on the pro-season probe, 39.5% whole-life; 34 weeks lost per career on the
maximum-exposure arm) the shipped configuration moves nothing out of band. **The fatigue re-price
survives this wave untouched, and no injury knob moved.**

---

## 6. Why 1.4 and not 2.0, in three sentences

1. **The world says 1.2–1.4x.** `docs/research/real-training-hours.md` §3: the LTA's own term-time
   standard for an 18U girl is 18 court + 5 gym = **23 h/week**, and *measured* professional weeks
   are **17 ± 2.5** to **~22.6**. Every same-institution comparison lands between **1.0x and 1.6x**;
   the only 2x reading in the corpus comes from an academy whose school-side figure (10–15 h/week) is
   half what every federation prescribes for the same age.
2. **The engine says the same week must cost the same.** `ECONOMY.summerBlock.loadFactor` has been
   **1.4** since W3-SUMMER, argued from the owner's own ruling about two sessions a day and sized
   from first principles – "two sessions a day is not twice the learning". A school-free week in July
   at sixteen and a school-free week in October at nineteen are the same week, and a game that priced
   them 1.4 and 2.0 would be giving two answers to one question.
3. **And the bench says the difference barely exists.** 1.4 buys 0.36 skill points and 2.0 buys 0.69
   – **0.15 against 0.29 of one junior year.** The gap between his number and the researched one is a
   third of a skill point over a twenty-four-season career, which is well inside what a coach rung or
   a single season's plan slider is worth. There is nothing to defend at 2.0 that 1.4 does not
   already deliver.

⚠ **WHAT WOULD CHANGE IT, stated so the owner can overrule with one line.** `ECONOMY.school.loadFactor`
is a knob and the curve is linear: 2.0 is +0.33 skill over the shipped 1.4 and costs nothing
measurable in injury, so if he wants his number it is a one-line change and this page is the
measurement it would ship against. What is NOT recommended in any case is the condition cost – §4's
third reading is unambiguous.

---

## 7. What the wave found that nobody asked for

⚠ **THE REAL STEP AT EIGHTEEN IS COMPETITION, NOT TRAINING, AND THIS GAME ALREADY HAS IT BACKWARDS.**
`docs/research/real-training-hours.md` §3.5: the WTA Age Eligibility Rule caps a seventeen-year-old
at **16 tournaments** and lifts to **unlimited** at eighteen, and professionals compete ~30 weeks a
year, which *displaces* training – a female player's on-court duration falls **18.6%** in a
tournament week and her technical work falls **37%**. Two players describing what changed when they
finished school both name playing more, not training more.

This wave's own §1 arm moves in that direction by accident (the exam fortnight stops blacking out two
entry weeks a year from eighteen) and it measured **nothing** – 26.2 → 26.2 events a season on the
grinder – because two weeks of fifty-two is not a step. **The lever that would model the real
transition is `ECONOMY.entryCap`, not the training dial**, and it is named here rather than
half-built: it is a separate measurement, on a population the entry cap actually binds, and it is the
owner's call whether the game should have an age-eligibility rule at all.

---

## 8. The shape of the change

**The predicate is derived, not persisted, and that is deliberate.** `schoolIsOver(week, birthMonth)`
is a pure function of two numbers every save has always carried, so the owner's twenty-two-year-old
career is out of school the moment this build reads it – no flag, nothing to drift out of step with
`world.week`, and the same discipline `inCollege` already uses ("derived from the span, never a
second flag").

**`isExamWeek` and `isBlackoutWeek` gained a REQUIRED `schoolOver` argument.** Not a defaulted one: a
default of `false` silently restores the bug at every call site somebody forgets, and there were
twenty. Making it required turned the change into twenty compiler errors, which is the only kind of
exhaustive search that cannot miss one. The answer comes from `schoolIsOver` in the engine,
`schoolIsOverForBand` for the rivals (who carry no birth month – they leave on the band's own
September, or the exam fortnight would keep paying THEM the blackout week's extra recovery for the
rest of their careers while it stopped paying her), and `w >= snap.schoolEndsWeek` in the UI.

**`Snapshot.schoolEndsWeek` is a WEEK and not a boolean**, because three surfaces ask about weeks that
are not this one – the calendar's seven-week look-ahead, the Season screen's rows, the planner's
future bookings – and a boolean captured at the current week would paint a lesson on a week she will
not be at school in.

**The calendar's `full-time` band is the summer day made permanent.** `weekGrid.ts`'s `AgeBand` has
carried `'full-time'` since it was written, with its own note calling the content "a design decision
nobody has taken yet"; the owner has now taken it. ⚠ It is **not** an age rung – school ends at the
September after her last grade, which for a September-born girl is a whole year later in absolute
time than for an August-born one, so `bandFor` takes the answer rather than deriving it from an age.
And the row is deliberately `summerOrdinary`'s own output rather than a fresh invention: two tables
that drew the same week differently would be two answers to one question.

**Schema v43**, and ⚠ **v42 is a deliberate no-op bridge** reserved for a concurrent wave – the
merge instruction is written in `migrations.ts` at the rung itself, because the ladder is walked in
file order and a real 41 → 42 step placed *after* the bridge would never fire. The v43 step
back-fills the `school` milestone for any career already past `schoolEndWeek`. **The milestone only,
never the feed line**: `world.events` is a news feed pruned to 400 rows oldest-first, so a row dated
three seasons ago is either already past the horizon or an old headline in a current feed. Fixtures
`v42.json` (a real career at week 300 with the milestone REMOVED, so loading it exercises the
back-fill) and `v43.json`.

**RNG: zero new draws, on any stream.** Every effect is post-draw arithmetic on state the world
already holds – `schoolIsOver` is two integers compared, `markSchoolEnd` is two idempotent writes,
the load factor multiplies a rate `growWeek` was already computing, and the post-school rest-flavour
pool is built with `map` so its LENGTH matches its parent and the single `pickInt` stays one draw.
The frozen MAIN capture (41550 / `e6b0c709`) re-derives byte-for-byte and its pin is untouched.

---

## 9. What moved, what did not

| | verdict |
| --- | --- |
| `isExamWeek` / `isBlackoutWeek` take `schoolOver` | **SHIPPED** – §8, and it is what fixes the report |
| `schoolEndWeek` / `schoolIsOver` / `schoolIsOverForBand` | **SHIPPED** – derived from `gradeOf`, §2 |
| `MilestoneType: 'school'` + `markSchoolEnd` + the scroll row | **SHIPPED** – §2a, the moment |
| `weekGrid.ts` `full-time` band + `dropSchoolFurniture` | **SHIPPED** – §8, the thing he can see |
| `ECONOMY.school.loadFactor` = **1.4** | **SHIPPED** – §6, the summer block's own number |
| `ECONOMY.school.conditionCost` = **0** | **SHIPPED** – §4, it bought nothing and cost three weeks |
| `ECONOMY.school.lastGrade` (12) | **SHIPPED** – moved out of `kidLife.LAST_GRADE` so the bench can sweep it (99 re-plays the shipped game) |
| schema **v43** + v42 bridge + two fixtures | **SHIPPED** – §8 |
| copy: off-season note, season scrap, rest flavour, summer read-out, two friend lines | **SHIPPED** |
| `ECONOMY.summerBlock` (1.4 / 3) | **no change** – §4, its window is nine weeks and its cost is right for nine |
| every injury and fatigue knob | **no change** – §5, nothing left its band |
| `ECONOMY.entryCap` / an age-eligibility rule | **NOT BUILT** – §7, named rather than half-built |

**Guard tests: five re-aimed with a ⚠ and a reason, none deleted or weakened, and two of the
re-aimings are STRICTER than what they replaced.** `round12-view.test.ts` keeps every original
assertion and adds the half it could not previously ask – *once school is over the fortnight never
comes again, at any offset, for ever*. `condition.test.ts` gains the same companion.
`calendar-grid.test.ts`'s band-completeness pins moved from `toEqual(['school'])` to naming both
populated bands and asserting `senior-school` is still empty and still draws nothing. Its
one-session rule was re-aimed exactly the way the holidays already re-aimed it – the rule was never
"one block of tennis", it is *«the picture cannot claim more tennis than the WEEK bought»*, and past
school the week buys two. `trophy-cabinet.test.ts` stopped asserting a bare milestone LENGTH, which
made it a tripwire for every future migration rather than a guard on the one it is about; it now
asserts that v31 mines nothing by naming the three rows it must leave untouched.
