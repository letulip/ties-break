---
type: spec
status: draft
area: endings
canonical: false
last-reviewed: 2026-08-26
---

# The long goodbye – the career ends when her body says so, and she says it herself

Captured verbatim so the ask is not paraphrased away (owner, 26.08.2026):

> «я сегодня в новостях видел, что Roger Federer играл активно до 41 года, а сейчас вроде как решил
> снова вернуться в спорт. Отсюда у меня мысли на тему нашей жесткой концовки в 38 – может быть ее
> как-то пересмотреть и заложить как раз плавную и затухающую деградацию навыков просто, а девочка
> "сама" по итогам сезона будет говорить, что она "всё"? или вроде того.»

⚠ **HALF OF WHAT HE ASKS FOR IS ALREADY BUILT, AND THAT CHANGES THE PROPOSAL.** The smooth decay
exists and has since the development slice. What does not exist is the second half – her own voice –
and what is wrong is not the decay but the TRIGGER sitting on a birthday.

---

## 1. What is actually shipped today

**`ECONOMY.development.ageCurve`, and it is already a fade rather than a cliff.** `declineFactor`
returns `declineRate * (1 + (age - declineStart) * declineAccel)` – `declineRate: 0.00035` a week,
`declineAccel: 0.28`, from `declineStart: 29`. Its own comment says the shape out loud: «gentle at
first and steeper every year, which is how careers actually end: a season of "still fine", then a
season where the legs are gone.» Measured off the shipped function:

⚠⚠ **THIS TABLE WAS WRONG IN THE FIRST DRAFT AND THE BUILDER CAUGHT IT (26.08, step 1's report).**
I computed the curve with age as a STEP FUNCTION – one `declineFactor` per year, held constant across
its 52 weeks. The engine advances her age **every week**, so the factor rises continuously and the
real curve is 2–3 points kinder at every age. Verified three ways before the correction was accepted:
the builder's own arithmetic, its three walked careers, and my re-derivation with a weekly-advancing
age, which reproduces its figures to a tenth of a point. ⭐ **And the wrongness was visible inside this
file without measuring anything** – §3a said the 70% threshold fires at 38 while this table said 66%
was left at 38. Two tables of mine disagreed and I shipped them.

| age | lost that season | share of peak PHYSICAL left |
| --- | --- | --- |
| 29 | 2.0% | 100% |
| 33 | 4.0% | 89.3% |
| 35 | 5.0% | 81.8% |
| 37 | 6.0% | 73.5% |
| **38** | 6.4% | **69.1%** |
| 40 | 7.4% | 60.2% |
| **41** – Federer's age | 7.9% | **55.7%** |
| 43 | 8.8% | 47.0% |
| 45 | 9.7% | 38.9% |

⭐ **AND THE DECAY IS PHYSICAL ONLY** – `declineFactor`'s own doc line: «Physical only; composure is
handled by the caller.» Technique and composure do not fall. That is precisely the late-Federer
silhouette: the craft is intact, the legs are gone. The engine already models the thing he is asking
for; nobody had put a number in front of him.

**The retirement question.** `retirementDue` asks every off-season from `askFromAgeYears: 29`, and
again on a `plateau` reading (three flat seasons inside `plateauRankBand: 20`). The parent answers;
«one more year» is unlimited and counted in `oneMoreYearCount`. At `stopAskingAgeYears: 38` the offer
carries `final: true`, and `answerRetirement` **throws** on a refusal – `'This was the last time
anybody asked'`.

⚙ **AS OF STEP 2 (26.08) THE SENTENCE ABOVE IS HISTORY AND IS KEPT AS SUCH** – it is what this
proposal was written against. `stopAskingAgeYears` is deleted; the offer carries `final: true` when
`physicalShare <= ENDINGS.lastOfferPeakShare`. Everything else in the paragraph is unchanged: 29,
the plateau reading, `oneMoreYearCount`, and the throw.

---

## 2. What the floor at 38 is actually FOR – and this is the argument against simply deleting it

From this repo's own measured distribution ([endings-and-the-album.md](endings-and-the-album.md)
§2), on the arm that **refuses every offer**:

| ending | «plays on» share | median age |
| --- | --- | --- |
| bankruptcy | 51.1% | 17 |
| natural (the floor) | **41.1%** | **38** |
| injury | 7.8% | 31 |
| plateau | 0.0% | – |

⚠⚠ **THE TABLE ABOVE IS THE 04.08 ONE AND IT NO LONGER REPRODUCES – IT IS QUOTED HERE FOR ITS
ARGUMENT, NOT AS A CURRENT MEASUREMENT.** Its own source says so («⚠ THE TABLE ABOVE IS 04.08 AND IT
HAS DRIFTED – RE-MEASURED 13.08»), and step 2 re-ran the bench on **untouched main** to be sure
before changing anything (9 presets × 10 seeds, 26.08 – §2's own 04.08 sample size):

| ending | 04.08 recorded | 13.08 re-measure | **main, 26.08 (the control)** |
| --- | --- | --- | --- |
| bankruptcy | 51.1% @ 17 | 59.4% | **51.1% @ 16** |
| natural | 41.1% @ 38 | 23.9% | **36.7% @ 38** |
| injury | 7.8% @ 31 | 16.7% | **12.2% @ 30** |
| plateau | 0.0% | 0.0% | **0.0%** |

So «reproduces §2 byte for byte» was never an achievable acceptance for step 2 – the code had already
drifted away from that table on its own. **The control it was actually held to is untouched main**,
and at 70% the change reproduces THAT, ending for ending and median for median, on both arms.

⚠⚠ **FOR A PLAYER WHO NEVER SAYS YES, THE LAST OFFER IS THE ONLY ENDING THE GAME HAS.** Of the careers
that survive the money and the injuries, **every single one** ends because the game stopped asking.
Delete it and a third of that arm has no ending at all – she slides to 37% of peak at 45 and keeps
going, which is not a gentler story than a wall. It is no story.

**So the fade cannot replace the ending. It never was competing with it.**

---

## 3. The verdict

**Keep the ending. Move its trigger off the birthday and onto her body.**

Federer at 41 is an argument against a fixed NUMBER, not against a finish. A rule that reads the body
gives him the Federer career he wants *and* keeps the ending honest:

- a body kept well plays to 40–41, and that is **earned** rather than granted;
- a body wrecked by 33 finishes at 33, and that is the game telling the truth about the choices made;
- the fade still ends every career, because the curve accelerates.

### 3a. The dial, and today's rule is a special case of it

The last offer arrives when her physical drops below a share of **her own peak**. Because the curve
is deterministic in age, that share maps to an age for an UNDAMAGED career – and this is what makes
the change safe to reason about:

⭐ **THIS TABLE WAS ALWAYS RIGHT** – it is the half that reproduced against the shipped curve when
§1 did not, and it is why the owner's ruling needed no revisiting. Figures below re-derived 26.08 on
the weekly-advancing age and stated to a tenth.

| threshold | last offer lands at (undamaged) | what it means |
| --- | --- | --- |
| 70% of peak | **37.8** | ⭐ **today's rule exactly** – the change is a strict generalisation |
| 65% | 38.9 | |
| 60% | 40.0 | |
| **55%** | **41.2** | ⭐⭐ **RULED BY THE OWNER, 26.08: «я бы взял 55% по уходу – согласен, звучит ок»** – Federer's age, reachable only on a body kept well |
| 50% | 42.3 | |
| 45% | 43.5 | the tail gets long and the tennis gets sad |

**Settled: 55%, by his word on 26.08.** It buys three years over today's rule, it puts the ceiling exactly where the
real case he read about sits, and every year of it has to be paid for in physio, load and luck. ⚠ The
number is a dial and this table is the whole argument for it, so a rollback is one constant.

### ⚙ 26.08 – TWO CORRECTIONS FROM STEP 2, BOTH FOUND BY BUILDING IT

⚠ **THE TABLE ABOVE IS THE CROSSING, NOT THE WEEK THE OFFER ARRIVES – ADD UP TO A YEAR.** The share
falls continuously; the question is asked on ONE week a year, the off-season wrap. So 55% is crossed
at 41.2 and the last offer actually lands between **41.2 and 42.1** depending on her birth month
(41.5 for `DEFAULT_PROFILE`'s 15 June). Same for every other row. This does not move the ruling – it
is still the Federer ceiling – but the table should not be quoted as "the age she is asked".

⚠⚠ **AND «70% REPRODUCES THE CURRENT GAME BYTE FOR BYTE» IS NOT QUITE TRUE – 8 BIRTH DATES IN 36
DIVERGE.** The crossing is 37.81 and the old rule woke at 38.00, so a girl whose off-season wrap falls
in that 0.19-year window gets her last offer a YEAR early under 70%. Swept over all 36 birth dates:
the eight are every date from 12 December to 28 February. `DEFAULT_PROFILE` is 15 June and is not one,
which is why the endings bench reproduces exactly and the generalisation claim stands for the
measurement – but the *rule* is a strict generalisation only up to that fortnight-wide seam.

⚠⚠⚠ **AND §3'S CENTRAL PROMISE IS NOT MET BY THIS CHANGE ALONE: A WRECKED BODY DOES NOT FINISH
EARLY.** «a body wrecked by 33 finishes at 33» requires the share to differ between careers, and
**it cannot today** – measured, not argued:

* `growWeek` is the only writer of `world.skills`, and its gain term is `ageFactor(age) * …`, which
  returns **0** from `declineStart`. So the peak is frozen the week she turns 29 and **every career
  leaves 29 at a share of exactly 1.00**.
* its loss is `decline * skills[k]` – **proportional per attribute** – so from 29 every career is
  multiplied by the same factor every week and keeps the same share at the same age.
* Measured on two walked careers 26% apart in peak (69.45 against 55.25, the widest pair in a
  fourteen-seed sweep of both extremes of background, coach tier and training): **identical shares to
  three decimals at every off-season week, and the same last offer, to the week.**

What a wrecked body loses is the **level** of the peak – which is real tennis, and no part of a ratio
taken against that same peak. Step 1's own commit note has this backwards («a career full of them
arrives at 29 with a LOWER peak and therefore starts its last chapter from a lower number») – the
number is lower and the *share* is not, and the share is what the trigger reads.

⭐ **So step 2 is exactly what its own step table claims and no more: the trigger leaves the birthday
and the rule generalises.** Making the goodbye personal needs a mechanism that does not exist yet, and
**§4a's recovery corridor is not it either** – it slows her rest weeks, not her skills. Three shapes
that would do it, none of them built and none of them ruled on: an atrophy term that takes physical
off a body that is injured or unloaded; a peak that keeps rising past 29 for a body that is still
being developed; or a second signal on the view (`condition`, weeks lost) that the threshold reads
alongside the share. `tests/ending.test.ts` pins the age-equivalence as the measured fact it is, so
the day one of them lands the pin goes red and gets re-aimed rather than quietly agreeing.

### 3b. Why «her own peak» and not «her potential»

Reading current physical against `potential` would cost nothing (it is already persisted) and it
would be **wrong**: a girl who never came near her ceiling would read as finished while still young.
The signal has to be what she actually reached. That costs **one persisted number** – her best
physical ever – and a save-schema move.

⚠ The `askFromAgeYears: 29` floor stays as it is, so nothing can fire before the decline even starts.

---

## 4. Her own last word – the half that genuinely does not exist

Today the parent answers, and at 38 the game forbids the answer «no» with a thrown error. She is
absent from her own retirement. The code even apologises for it in `answerRetirement`'s header: «the
copy on the card has to carry the difference between "we are retiring you" and "nobody is going to
ask again".»

**That difference should not be carried by the copy. It should be carried by whose voice it is.**

- Every non-final offer stays exactly as it is: the parent's question, the parent's answer, «One more
  year, she said. Same as last time.»
- The **final** one stops being a question. It is her line, at the end of the season, in her own
  words – she says she is done, and the card acknowledges rather than asks.

⭐ **This needs no preference model and therefore does not wait on the private-life layer.** The
owner PAUSED E1 («её мнение») on 22.08, and this is deliberately not that: E1 is her opinion about a
choice still open (the college fork), where the game would need to know what she WANTS. Here the
choice is closed by her body, and the two inputs – what she has left and what her results did – are
both already on the snapshot. ⚠ If the private-life layer later gives her a spirit, this line is the
obvious first place it should colour, and the wording should be written so that it can.

---

## 4a. The fade has a second half – recovery, and it was his own addition

The owner, 26.08, on reading §1:

> «для концовок и возраста предлагаю еще уменьшать недельное восстановление после матчей, т.е. и
> физика будет падать и восстанавливаться будет дольше, надо угасающий коридор сделать какой-то
> разумный тоже.»

⭐ **He is right and it closes a hole in §1.** Today the ONLY thing age touches is the attribute
value. A thirty-eight-year-old drains from a match exactly as fast as a twenty-two-year-old and
recovers exactly as fast – so the old body is weaker but never *tireder*, which is backwards. Every
professional account of a late career is about the recovery, not the peak.

**The shape, and it deliberately introduces no new curve.** `ECONOMY.condition.proPhaseRecoveryBase`
is **5** points a rest week (variant C, his 22.08 ruling). The proposal is that the recovery a week
returns scales with **what is left of her body** – the same share §3a already computes:

⚠ **RE-TAKEN 26.08 on the corrected curve** – the first version of this table copied §1's wrong
column and inherited its error.

| age | share of peak left | rest week returns | note |
| --- | --- | --- | --- |
| ≤29 | 100% | 5.00 | untouched – the peak is the peak |
| 33 | 89.3% | 4.46 | |
| 36 | 77.7% | 3.89 | |
| 38 | 69.1% | 3.45 | |
| **41** | 55.7% | **2.79** | at the threshold that ends the career |
| 43 | 47.0% | **2.50** | ⚠ the floor, `recoveryAgeFloor: 0.5` – approved 26.08, «пол 2.5 ок» |

⚠ The right-hand column is what the ENGINE holds. What a screen shows is that number rounded – see
the rule directly below, which he set the same day.

### ⚙ 26.08 – IT ALREADY FADES EVERY YEAR, and the sparse table was mine

> «можно даже сделать на каждый год затухающую динамику – будет вообще красиво, а не жесткую привязку»

⭐ **It is already exactly that, and the "hard binding" he saw was my table's sparse rows rather than
the mechanic.** Because the multiplier is the share of peak, and the share moves every week, the
recovery moves every year with no steps in it at all. Taken off the shipped `declineFactor`:

| age | body left | engine holds | screen shows |
| --- | --- | --- | --- |
| 29 | 100% | 5.00 | 5 |
| 30 | 98.0% | 4.90 | 5 |
| 31 | 95.5% | 4.77 | 5 |
| 32 | 92.6% | 4.63 | 5 |
| 33 | 89.3% | 4.46 | 4 |
| 35 | 81.8% | 4.09 | 4 |
| 37 | 73.5% | 3.67 | 4 |
| 38 | 69.1% | 3.45 | 3 |
| 40 | 60.2% | 3.01 | 3 |
| **41** | 55.7% | **2.79** | 3 |
| 42 | 51.3% | 2.57 | 3 |
| 43 | 47.0% | 2.50 | 3 ⚠ floor |

⚠⚠ **AND THE FLOOR TURNS OUT TO BE ALMOST INERT, which is worth knowing before it is built.** It
first bites at **42.31** (the table's 43 row is the first whole year past it) – over a year AFTER the
55% threshold has ended the career at 41.17. So under the
settled rules it is a safety net that fires on essentially no career: it exists for the outliers (a
body that somehow held past the threshold, a migrated save, a future rule change) and not as a dial.
⭐ That is the right shape for a floor and it means §7 has one fewer number to tune – but nobody
should later "raise the floor to fix something" without noticing it is not currently doing anything.

**One question this leaves open, and I would not change it without measuring.** Recovery could fade
FASTER than the body rather than in step with it – physiologically that is truer, and a veteran who
still hits hard but cannot back it up two days later is the more accurate portrait. It would cost a
second accel constant. **My recommendation is to ship the derived version first**: it needs no new
number, the table above already reads right, and §6's measurements will say plainly whether the last
seasons are too easy. Adding a curve before the measurement is tuning something nobody has felt yet.

### ⚙ 26.08 – FRACTIONAL IN THE LOGIC, WHOLE IN THE INTERFACE (his rule, and it is general)

> «у нас в логике могут быть дробные числа – это окей, а у пользователя целые в интерфейсе»
> · «пусть падает, но на фронт едет в отображение округленное значение»

⚠ **THE CORRIDOR IS CONTINUOUS AND MUST STAY SO.** My first reading quantised the mechanic itself to
5 → 4 → 3 and he corrected it: the ENGINE keeps the fraction and it keeps falling; only the number
that reaches a screen is rounded. A quantised recovery would make the fade arrive in three visible
jumps instead of as a slope, which is the opposite of what §4a is for.

**Rounding is `Math.round` – half away from zero, «по правилам математики».**

⚠⚠ **AND IT HAPPENS ONCE, AT THE SNAPSHOT BOUNDARY, NOT IN EACH COMPONENT.** Verified 26.08: today
`buildSnapshot` hands `world.condition` over RAW (`snapshot.ts:960` and `:1093`) and the components
each round it themselves – `KidScreen.vue:198` and `TournamentFlow.vue:936` both carry their own
`Math.round`. That is two sides asking the same question separately, this repo's most-repeated defect
class, and the third caller that forgets will print `73.41999999` on a screen. **The snapshot is the
boundary and it is where the rounding belongs**, so a component cannot get it wrong by omission.

⭐ **This is a house rule, not a detail of this spec.** Any number that crosses into `Snapshot` for a
person to read is whole; the fractions stay behind it. Cents are already integers and stay integers.
A guard test should pin it for `condition` and the recovery figure at minimum.

**Why a floor at all.** Without one the corridor keeps closing and the career does not end – it
becomes unplayable, which is a different and worse thing. A wreck who cannot recover would be pushed
out by exhaustion and injury rather than by the ending this spec is about, and that would quietly
steal careers from the other three finishes (§6.4). The floor keeps the last seasons hard and
playable, and lets the ENDING be what ends it.

⚠ **THE JUNIOR ERA CANNOT MOVE.** `recoveryBase: 8` and everything below 29 is untouched by
construction – the multiplier is 1 until `declineStart`. This is the same guarantee §5 of
[fatigue-reprice-2026-08.md](fatigue-reprice-2026-08.md) makes about its own re-price, and for the
same reason: the junior benches are pinned reference tables and a drift there is invisible.

### ⚠ And this is the risk that has to be MEASURED, not argued

A slower recovery raises fatigue, and fatigue is what feeds the injury door. Round 26 already found
the season prevalence sitting **17 points over its own band** (71% against the professional 30–54%,
[round-26.md](../rounds/round-26.md) 14b) with nine of those points unauthored. **Closing the
recovery corridor pushes on exactly that number in exactly the wrong direction, and it does so only
in the years this spec is about.** So §6 gains a sixth acceptance number, and if it fails, the floor
rises before anything else is touched.

⭐ **There is also a prize here.** «She can no longer open a season at 90» is a fact her body already
knows how to state – the fatigue spec's own acceptance number (`opens the next season at >= 90`). If
the measurements say so, that is a better sentence for her last word in §4 than any threshold: not
«she is 41» but «she did not come back from the winter».

### ⚙ 27.08 – BUILT, AND MEASURED AGAINST §6.6'S VETO. THE FADE SHIPS AT THE APPROVED FLOOR

`ECONOMY.condition.recoveryAgeFloor: 0.5` exists and `recoveryBaseFor` (world/medical.ts) multiplies
the phase's base by `Math.max(recoveryAgeFloor, physicalShare)` from `declineStart`. **No schema
move** – step 1 shipped `peakPhysical` at v62 and this reads it, exactly as step 2 does. **Zero
draws**: a comparison and a division; the frozen MAIN capture (41550 / `e6b0c709`) is unmoved.

⭐ **THE FADE GOES INSIDE THE HELPER, SO BOTH ITS READERS INHERIT IT.** ⚠ And the helper's own header
was one merge out of date: it said «three readers – `accrueCondition` plus the two 18.08 makeup
expressions in world.ts», and the round-25 collect had already folded those makeups into
`withheldFreeWeekRecovery`, which is now the ONE oracle behind **three** refund sites (world.ts's
medical-withdrawal arm, `skipEvent`, planner.ts's practice cancellation). Same closed set, one level
of indirection deeper: every read of `recoveryBaseFor` in the repo is inside world/medical.ts. There
is no fourth reader, and no reader that must not fade. The header is corrected in place.

⚠ **THE RIVALS ARE UNTOUCHED AND STRUCTURALLY CANNOT FADE** – `season/rival.ts`'s `walkWindow` reads
`ECONOMY.condition.recoveryBase` directly, and `rivalCondition(results, playerId, week)` takes no
world, no skills and no peak, so there is nothing for a share of a peak to be taken against.
Field-pro ageing stays its own backlog item.

**The rounding moved to the boundary and the duplicates are gone.** `toSnapshot` computes
`shownCondition = Math.round(world.condition)` once and both `Snapshot` sites read it;
`KidScreen.vue` and `TournamentFlow.vue` no longer round for themselves, and the FIVE other readers
of the same field that never rounded at all (`HomeScreen` twice, `PlanWeekSheet`, `SeasonScreen`,
`WeekRecapCard`) are correct now by construction rather than by luck.
`tests/condition-boundary.test.ts` pins it behaviourally AND ratchets the class: nothing under
`src/components` may apply `Math.round` to a `condition` again.

⚠ Two things deliberately still read the RAW fraction, and it is the right call:
`coachEntryLine(e.tier, world.condition)` and `buildKnockPrompt(..., world.condition)`. Neither
crosses a NUMBER – they cross a sentence – and both are threshold reads that must agree with the
engine's own gates (`availabilityStatus`, the doctor's veto), which read the fraction too. Rounding
them would make the coach disagree with the doctor at a boundary point.

#### The measurement, on the FIXED `tools/pro-season-probe.ts`

⚠ **THE DEFAULT CELL IS A NULL ARM FOR THIS CHANGE AND MUST NOT BE QUOTED AS THE ANSWER.** The probe
walks three seasons from age 16; the fade cannot bite before 29. Run at the default cell the two arms
come back **byte-identical** – which proves the arms differ only by the knob and
proves nothing at all about the risk. The probe therefore gained two things, both in `tools/` only:
`--recoveryFloor X`, and a prevalence line split at `declineStart`.

⭐ **`--recoveryFloor 1` IS THE CONTROL ARM BY CONSTRUCTION, NOT BY A WORKTREE.** The multiplier is
`Math.max(floor, share)` and the share can never exceed 1, so a floor of 1 pins it at exactly 1 and
the engine is the un-faded one – same tree, same commit, same code path, with the reader provably
present.

**48 careers × 27 seasons (ages 16–42), 1 296 season-rows per arm, `--plan light --policy pair
--vac elite --physio off`:**

| | control (fade OFF) | shipped (floor 0.5) | read |
| --- | --- | --- | --- |
| season injury prevalence, pooled | 65% | 66% | |
| ...under 29 – the fade cannot bite | **70%** | **70%** | ⭐ identical, as it must be |
| ...**over 29 – the fade's own years** | **60%** | **61%** | **+1 pt, SEM ±1.9** |
| onsets / season | 1.07 ± 0.03 | 1.08 ± 0.03 | +0.01, a third of one SEM |
| weeks lost / season | 3.3 ± 0.1 | 3.4 ± 0.1 | |
| total onsets | 1 389 | 1 403 | +1.0% |
| weeks below the knee / season | 33.2 ± 0.5 | **35.4 ± 0.5** | ⚠ **+2.2, 4.4 SEM – REAL** |
| matches walked | 45 694 | 44 841 | −1.9% |
| at the off-season door | 54 | **49** | ⭐ back INSIDE §6.2's 45–50 |

⭐⭐ **6 ✅ THE VETO DOES NOT FIRE, AND THE FLOOR STAYS AT 0.5.** The MECHANISM moves exactly as
designed and measurably – she spends 2.2 more weeks a season below the injury knee, 4.4 SEM, in the
years the spec is about. The injury DOOR's output does not: onsets/season +0.01 against ±0.03, and
season prevalence in the fade's own years 60% → 61% against a ±1.9 pt SEM. ⚠ **Said plainly: the
point estimate moved UP, in the predicted direction, by an amount this sample cannot distinguish from
zero** – at 12 seeds it read +2, at 48 seeds +1, which is what noise does. It is not a licence to
ignore the number; it is a statement that there is no measured increase to act on.

⚠ **AND IF IT EVER DOES FIRE, `recoveryAgeFloor` IS THE WRONG LEVER AND §6.6 SHOULD SAY SO.** The
floor is inert until **42.31** – past the 41.17 at which `lastOfferPeakShare` has already ended the
career. A floor that actually blunted the fade in the years that carry the risk would have to be
~0.8 (biting from ~35.6), which is a different mechanic and contradicts his own «пол 2.5 ок».

**7 ⚠ AND THE «PRIZE» IN §4a IS NOT DELIVERED – THE MEASUREMENT SAYS THE OPPOSITE, PLAINLY.** «She
did not come back from the winter» was to be read off the fatigue spec's `opens the next season
at >= 90`. What the walk shows is the reverse: she opens the season *better* the older she gets,
because her level falls, she loses earlier, and she plays **38.9 matches a season at 16 against 19.7
at 42**. Less tennis outruns slower recovery.

| age | 30 | 33 | 35 | 37 | 39 | 41 |
| --- | --- | --- | --- | --- | --- | --- |
| opens next season – control | 87 | 86 | 91 | 94 | 94 | 97 |
| opens next season – **shipped** | 83 | 84 | 90 | 91 | 93 | 97 |

The fade costs her at most ~3 points at the season door, in the mid-thirties, and she is over 90 from
35 in both arms. **The pooled 86 → 85 shortfall against `>= 90` is real but is NOT this change's**:
ages 16–29 are byte-identical between the arms and are where the shortfall lives. So §4's last word
cannot be «she did not come back from the winter» – it is not true of this engine. ⭐ If that sentence
is wanted it needs a mechanism that makes the last seasons HARDER, not a corridor that makes them
quieter; the honest late-career sentence available today is about how little tennis is left in her.

⚠ **AND THE ARMS ARE IDENTICAL TO THE INTEGER AT EVERY AGE THROUGH 29** – played, matches, mean
condition, the wk49 door, «opens next» – so «the junior era and the whole pre-peak career are
untouched by construction» is measured, not asserted.

---

## 5. What it costs

| piece | where | size |
| --- | --- | --- |
| the stored peak physical | `world/state.ts` + a phase writes it each tick | S – **one field, one save-schema move** (bump, append-only migration, golden fixture, `e2e:fixtures`) |
| the trigger | `retirementDue` in `src/engine/ending.ts` reads the share instead of `stopAskingAgeYears` | S |
| the constant | `ENDINGS.lastOfferPeakShare: 0.55`, and `stopAskingAgeYears` is **deleted, not left dangling** | XS |
| ⚙ *(not costed, and it was real)* the constant's **other four readers** | it was never only the trigger: the epilogue's detail line and the last-offer event line both INTERPOLATED it, and `tools/endings-bench.ts` + `tools/injury-audit.ts` both derived their WALK HORIZON from it. The two copy lines now print her real age (`kidAgeYears`, already whole); the two horizons read a new `ageAtPhysicalShare(share)` in `development.ts`, so a dial that moves takes the bench with it | S |
| her line | the retirement card's final state, and one event line | S |
| the recovery fade (§4a) | `ECONOMY.condition` gains `recoveryAgeFloor`; the rest-week return is multiplied by the §3a share | S |
| the re-measure | §6 below | M |

⚠ **RNG: ZERO DRAWS.** Nothing here is random – the peak is a running maximum, the threshold is
arithmetic, the line is text. The frozen MAIN capture (41550 / `e6b0c709`) cannot see this change,
and if it moves, something is wrong.

---

## 6. Acceptance – the numbers that decide whether it worked

⚙ **27.08: 6 AND 7 ARE NOW MEASURED TOO** – §4a's own ⚙ 27.08 block carries the arms, the sample and
the numbers. In one line each: **6 ✅ the veto does not fire** (season injury prevalence in the fade's
own years 60% → 61%, one point against a ±1.9-point SEM, on 48 careers × 27 seasons; the EXPOSURE it
works through does move, +2.2 weeks a season below the knee at 4.4 SEM), so `recoveryAgeFloor` ships
at the approved 0.5. **7 ⚠ NOT AS PREDICTED, AND THE «PRIZE» IS OFF**: she opens her last seasons
BETTER, not worse – less tennis outruns slower recovery – so «she did not come back from the winter»
is not a sentence this engine can say.

### ⚙ 26.08 – MEASURED FOR STEP 2 (the trigger only; §4a is not built)

`npm run bench:endings -- --seeds 10`, three runs of ~11 minutes each: untouched main, the same tree
at **70%**, and the shipped **55%**. Numbers 1-5 below are step 2's; 6 and 7 belong to §4a.

| ending | control (main) | at 70% | at **55%** |
| --- | --- | --- | --- |
| bankruptcy | 51.1% @ 16 | 51.1% @ 16 | **51.1% @ 16** |
| natural | 36.7% @ **38** | 36.7% @ **38** | **33.3% @ 41** |
| injury | 12.2% @ 30 | 12.2% @ 30 | **15.6% @ 31** |
| plateau | 0.0% | 0.0% | **0.0%** |
| *(still playing)* | 0.0% | 0.0% | **0.0%** |

**1 ✅ «plays on» still ends.** Natural stays the dominant non-money finish and *(still playing)* is
0.0% – every career on that arm gets an ending.

**2 ⚠ HALF.** The median moved **38 → 41**, as asked. **The spread did not widen and cannot** – see
§3a's third correction: the share is the same function of age for every career, so all thirty natural
endings still land on the same birthday. «today every career ends at the same birthday, and the point
of the change is that they stop agreeing» is **not yet delivered**, and no threshold delivers it.

**3 ❌ NOT MET.** Nothing finishes before the old floor, because nothing can. Stated in §3a rather
than worked around.

**4 ⚠ BANKRUPTCY AND PLATEAU ARE UNMOVED TO THE CAREER; INJURY ROSE 12.2% → 15.6%.** That is the
opposite of the failure §6.4 guards against: the last offer *gave three careers back* to the injury
door by letting them play three more years into it, rather than stealing any. The bankruptcy grace
sweep and the college-door tables are byte-identical across all three runs.

**5 ✅ `condition.test.ts` unmoved** – 41550 / `e6b0c709`, 51 tests green, the file not touched.

⚠ **Two second-order effects worth having on the record**, both from the three extra years and
neither a defect: fresh-severe exposure 14.4% → 16.7% of full-life careers, and prize/spend at the
end mean 2.0% → 1.8% (best 29.7% → 27.7%) as three low-earning seasons dilute the ratio.

---

The original text of this section, unchanged:

Re-run the endings bench on both arms and compare against §2's table:

1. **«plays on» still ends.** Natural endings stay the dominant finish on that arm – the share may
   move a few points, but it may not collapse toward zero. A career that never ends is the failure
   this whole section exists to prevent.
2. **The median age moves 38 → 40–41**, and the SPREAD widens: today every «plays on» career ends at
   the same birthday, and the point of the change is that they stop agreeing.
3. **A wrecked body ends earlier than 38** on at least some careers – if nothing finishes before the
   old floor, the rule is still a birthday wearing a costume.
4. **The other three endings do not move**: bankruptcy 51.1% at 17, injury 7.8% at 31, plateau on the
   «her words» arm at 48.9%. This change must not steal careers from them.
5. **`condition.test.ts` unmoved** – 41550 / `e6b0c709`.
6. ⚠ **The injury prevalence does not get worse** (§4a's risk). Re-taken on the FIXED
   `pro-season-probe`, the professional band is 30–54% and today reads 71%. The recovery fade may not
   push it further – if it does, `recoveryAgeFloor` rises until it does not. **This is a veto
   condition, not a note**: the fade is a texture, and it may not buy texture with a prevalence that
   is already over.
7. **She opens her last seasons able to play them** – the fatigue spec's `>= 90` at the season door
   holds through the mid-thirties and drifts below only in the final years. A career that arrives at
   the off-season door unable to recover has been ended by the wrong system.

---

## 7. The questions that are his

1. **The threshold: 55%, or another row of §3a's table?** 70% is today's game unchanged; 55% is the
   Federer ceiling; 50% starts to get long.
2. **Does the plateau offer change at all?** It is untouched by this proposal and stays a question the
   parent answers. A body-driven last word and a results-driven mid-career question are different
   things, and I would leave the second alone.
3. **Can she come back?** He mentioned it – Federer «решил снова вернуться». This spec deliberately
   does NOT propose it: an ending that can be undone is not an ending, and the album is built on the
   latch. If he wants it, it is a separate design with its own risks, and it should be argued on its
   own rather than smuggled in beside a threshold.
4. **Does the fade need to be VISIBLE before the end?** Today nothing tells the player her physical is
   falling; the first news is the offer. A quiet line in the season summary from the first year past
   the peak would make the goodbye long rather than sudden – which is the word in his own question.

---

## 8. Steps

⚙ **§7.1 IS ANSWERED (26.08): 55%.** Steps 1–4 are unblocked. Step 5 and §7.2–7.4 are still his.

| # | step | done when |
| --- | --- | --- |
| **1** | the stored peak, with its schema move – written, migrated, fixtured, and read by nothing yet | a golden fixture round-trips it and `e2e:fixtures` is green |
| **2** ✅ | the trigger moves to the share; `stopAskingAgeYears` deleted | ⚙ **DONE 26.08.** Built at 70% FIRST and measured against untouched main: the endings bench's **whole 127-line report came back byte-identical** – six endings, both retirement arms, the fork arms, the plateau sweep, the grace sweep, the college door, the injury table and the per-preset grid – then the constant was set to 55%. ⚠ The stated gate («reproduces §2 byte for byte») was not achievable and §2 above says why: that table is 04.08 and main had already drifted off it. The control is main, which is the stronger arm anyway |
| **3** | the threshold set to his answer, and §6 re-measured | the five acceptance numbers |
| **3a** ✅ | *(§4a)* the recovery fade, its floor, and the rounding moved to the snapshot boundary | ⚙ **DONE 27.08.** `recoveryAgeFloor: 0.5` inside `recoveryBaseFor`, so both its readers inherit it; the rivals untouched; NO schema move and zero draws. §6.6's veto measured on the fixed probe against a `--recoveryFloor 1` control – it does not fire. ⚠ Two things the spec had wrong are corrected in §4a: the helper's «three readers in world.ts» was one merge stale, and §6.7's hoped-for «she did not come back from the winter» is the OPPOSITE of what the walk shows |
| **4** | her last word – the card's final state and the event line | the copy reads as hers, and the parent is not asked a question with one legal answer |
| **5** | *(optional, §7.4)* the fade becomes visible in the season summary | a season past the peak says so without naming a number |
