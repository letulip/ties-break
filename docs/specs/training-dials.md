---
type: spec
status: partly-built (engine slice shipped; §7 §8 §9 open)
area: training/plan
canonical: false
last-reviewed: 2026-08-10
---

# The week is the plan – making the calendar real, and giving the coach a job

**Design proposal. Nothing here is built, and nothing in `src/` was touched to write it.** Third
draft, 09.08, after the owner's corrections to the layout. Where a number cannot be established
without a bench run it is listed in §12 rather than guessed.

## ✅ Approved to build – the owner's rulings, 10.08

The design is cleared. Three answers, and one of them pre-empts a bench item:

1. **WHEN is not counted as a separate term.** «когда – не считаем пока что, покликаю и скажу потом
   если что не так.» The run-length term stays removed (§6): the per-day cap and the school/no-school
   difference already supply that pressure from constants that ship today. ⚠ **Held open by the owner
   himself, not by us** – he intends to play the built version and re-open it if placement turns out
   not to bite. Do not treat its absence as settled design; treat it as a measurement he will take by
   hand.
2. **The coach reaches inside the match.** «да.» The mechanism in §8 is approved as specified:
   `applySurfaceStyle` takes her `MatchPlayer` and returns an adjusted one with zero RNG, and what
   moves is **composure**, which the point model spends precisely at break points
   (`p -= (1 - composure/100) * BIG_POINT_MAX_PENALTY`). It does not fade with headroom, which is the
   whole answer to «он нам вообще зачем?» at +0.2–0.4% a season. Only its **size by rung** is still
   open (§12 item 4).
3. **`summerLoadFactor` follows the doubling, not the calendar.** «да.» §12's headline bench item is
   ruled **in advance**: the direction is decided and the sweep measures the SIZE, not whether to do
   it. ⚠ This is a behavioural change to a shipped, measured window – `school-ends-2026-08.md` owns
   the harness – so the fallback in §12 item 1 stays available if the sweep says the magnitude is
   wrong, but the fallback may no longer be chosen merely because the change is inconvenient.

**And one ruling that lands outside this spec**, recorded here because it is the same question:
Home's "Coach note" card makes the coach's claim to a family paying nobody. The owner, 10.08: «для
самотренера надо убрать пока картинку оттуда и подпись, а мысль пусть останется.» The thought stays,
the portrait and the signature go. That is a `HomeScreen.vue` change and belongs to whichever wave
touches it, not to this design.

---

## 🔨 What is BUILT, and the three places the code contradicted this page

**Slice 1 of the wave – the ENGINE – shipped on `feat/dials-engine`.** §2, §3, §4, §5, §6, §10 and §11
are built and under test. **§7 (the coach's proposal), §8 (on-court coaching) and §9 (the screen) are
NOT built** – the seams are left open for them and named at the bottom of this block.

### ⚠ Three corrections, found by building it

1. **`SAVE_SCHEMA_VERSION` was 46, not 45, so the move is 46 → 47.** §10 was written against a branch
   point that the season-by-table wave had already moved past. Everything §10 says is otherwise
   unchanged; substitute 47 for 46 and 46 for 45 throughout it. The fixture is
   `tests/fixtures/saves/v47.json`.
2. **`WeekPlan.week` ships OPTIONAL, not required.** §10 specifies `week: SessionKind[][]`. Required
   would have forced a seven-day matrix onto **48 `{ train, rest }` literals across 17 files** –
   including `tests/condition.test.ts`'s RNG-invariance variants, whose entire job is to poke a
   *hostile* plan (`{ train: 100, rest: 0 }`) at the tick. That is the one guard this slice most has to
   leave alone. Absence is a shape with a meaning rather than a hole: `planWeek()` reads it back as the
   week the calendar has been drawing all along, which is byte-for-byte what the migration writes.
3. **The plan outlives the week it was built in, and §3 does not say what happens then.** Three doubled
   days in July are still three doubled days in September, when school takes the second session back.
   Dropping the overflow would silently take hours off the bill; refusing the plan would make
   `setPlan`'s verdict depend on which week he happened to be looking at. `resolveWeek` **moves** it:
   the session count, the kinds, the bill, the rate and the knock chance are untouched, and the only
   thing school takes away is the DOUBLING – which is what school takes away in the fiction.
   `planShapeError` therefore validates the SHAPE (7 days, ≤2 a day, 4–6 sessions) and never the
   current week's capacity.

### The answers the bench and the build settled

* **§12 item 1 – the headline.** Measured on `school-ends-2026-08.md` §10, that page's own harness.
  Not doubling costs **0.14 junior years** on the careful-player arm (0.39 on the grinder) and moves
  the median ranking five places in the direction of noise. **The fallback was NOT taken**: the
  magnitude is right, and the change leaves both arms *fresher* because the −3 is no longer charged for
  a week she did not double.
* **§12 item 2 – the partly doubled week's condition charge.** `Math.round(cost × doublingShare)`. It
  stays integer («no fractions») and reproduces 0 and 3 at the ends exactly; a six-session week
  doubling one of its three possible days pays 1.
* **§12 item 3 – zero or a floor for an untargeted skill.** Ships at **zero**, which is what §5's own
  worked table states, and is wired as one constant (`SESSION_SPILL`, engine/development.ts) so the
  other reading is a one-line sweep. A kind that already aims at everything has nothing to spill, so
  `general` reads exactly 1.0 at any value and the migration's byte-identity survives the knob.
* **§12 criterion 7 – RNG.** The frozen capture is **unchanged at 41550 / `e6b0c709`**, and `B1d` in
  `tests/condition.test.ts` repaints the whole week before every one of 52 ticks – all five kinds, all
  three volumes, a fully doubled week – against an identical MAIN sequence.
* **§12 criterion 8 – schema.** Proved twice: `aimWeights` is `Object.is`-exactly 1 on every skill at
  every session count for a migrated week, and a v46 fixture ticked one whole week under v47 code banks
  byte-identical `skills`, funds, condition, knock and `rngMain`. A one-part-in-10¹⁰ drift in the aim
  vector turns three tests red.

### ⚠ The one thing that is deliberately NOT byte-identical, and it is ruled

**A migrated career's school-free weeks come back at 1.0 instead of the automatic 1.4** until the
player ticks a second session onto a day. §10's own ⚠ predicted this and the owner ruled the direction
in advance. §10's byte-identity claim is therefore scoped, and the scope is *tested* rather than
asserted: on every week `summerBlockWeek` refuses – every school week, plus injury, tournament, family
week and rested knock – the two versions agree at 1, whatever the player ticked.

### The seams left open

| for | what exists | where |
|---|---|---|
| **§9, the screen** | `planWeek` / `planSessions` / `sessionCounts` / `resolveWeek` / `planShapeError` / `planFromWeek`, and `Snapshot.planDayCapacity` – the day-head capacity for the week the main button plays, carried as data because `summerBlockWeek` is not a predicate a screen could re-derive | `src/engine/plan.ts`, `src/shared/protocol.ts` |
| **§9, the command** | `setPlan` takes a `plan.week`, re-validates the shape engine-side and DERIVES `train`/`rest` from it – the caller's own pair is ignored, so there is exactly one writer | `src/worker/sim.worker.ts` |
| **§7, the coach's intervention** | nothing built, and nothing in the way: a proposal is a `SessionKind[][]` written through the same `setPlan` path, and `planShapeError` is the only rule it has to satisfy | – |
| **§7 + §9, the Calendar** | ⚠ **NOT DONE, AND IT IS A REAL GAP.** `calendarWeekFor` still lays its days out with the preset expander (`sessionsForPlan` + `sessionDays`) rather than reading `plan.week`, so the moment a player ticks a custom week the Calendar will draw the wrong DAYS. It is identical for every legacy and migrated plan, which is why it is not a defect today – it becomes one when §9 ships. The switch is `resolveWeek(planWeek(plan), snap.planDayCapacity)`, plus a decision about what `gymIndex` means once Fitness is a real kind | `src/composables/weekDays.ts` |


---

## 1. What a training week is today: a picture of one number

Open the Calendar and you see seven days: court days, a gym day, rest days, a booked friendly on the
Saturday. It looks like a plan.

**It is a drawing of a single number.** `composables/weekDays.ts` computes
`sessionsForPlan(plan.train)` – `plan.train` read as a percentage of seven days – and lays the result
out by two fixed lists: rest is claimed Sunday, then Wednesday, then Friday (`REST_PRIORITY`); the gym
is claimed Tuesday (`GYM_PRIORITY`). None of it reaches the engine, and the file says so:

> *"the engine resolves whole WEEKS and knows nothing of days (there is no day resolution anywhere in
> the sim), so the alternative to a stated convention is not a truer layout, it is no layout."*

The sim reads two fields, through four channels:

| what the engine does with the week | function | today |
|---|---|---|
| how fast she improves | `trainFactor(plan)` (`engine/development.ts`) | 0.72 / 1.056 / 1.28 |
| what the week costs | `coachHoursForPlan(plan)` (`engine/coach.ts`) | 4 / 5 / 6 billed hours |
| how likely she is to pick something up | `knockChance(condition, plan)` (`engine/knock.ts`) | ~2% / ~10% / ~25% |
| how much she recovers | `restRecoveryBonus(plan.rest)` (`world/medical.ts`) | +2 / +1 / 0 |

`growWeek` – the only place skills change – grows **all five skills at the same rate off one shared
luck draw**. The gym day is furniture: nothing in the sim knows she went to a gym.

**That is the problem in one sentence.** The owner:

> «Самокоуч, по сути, ничем в данный момент не отличается от коуча, кроме того, что ничего не стоит –
> вся программа тренировок как была автоматической, так и осталась.»

It is worse than "the coach has no job": **nobody has a job.** There is no week to plan well or badly,
so nothing for a coach to be better at and no reason for the price. `round15-triage.md` measured the
bill – 50 careers a cell, four seasons:

| | self-coached | middle coach | what hiring buys |
|---|---|---|---|
| **8k / working** | $19,522 · ITF #48 · 101 entries | $5,453 · ITF #56 · 85 entries | **−$14,069, −8 places** |
| **25k / middle** | $22,712 · ITF #44 · 101 entries | $5,998 · ITF #57 · 97 entries | **−$16,714, −13 places** |

---

## 2. What changes: the days become the plan

> «у нас есть расписание недели и на каждый день там идут разные тренировки – **это и есть ручки**...
> для выбора родителя надо сделать **строчку с названием занятия а ниже набор из 7 галочек на каждый
> день недели** – он кликает и решает когда что тренировать.»

**One block per kind of session. A line with its name, and under it seven checkboxes, one per
weekday.** Five blocks stacked down the tab. He ticks the days.

| block | what it works on | in engine terms |
|---|---|---|
| **General practice** | everything, a bit – the ordinary mixed session | all five skills equally: *exactly today's week* |
| **Serve & return** | the first two shots of the point | `serve`, `ret` |
| **Rally** | ball-striking off the ground | `groundstrokes` |
| **Fitness** | the gym, made real | `stamina` |
| **Match play** | sets, sparring, playing under pressure | `composure` |

**Rest is the absence of a tick.** A day with nothing ticked is a day off. It is not a sixth block and
there is nothing to paint – which is simpler than the previous draft and removes a whole class of
"what happens if you tick rest and serve on the same day".

**Volume and emphasis are not controls. They are what the ticked week adds up to.** How many ticks
there are is the volume; which rows they are in is the emphasis; which columns they are in is the
arrangement. He never sets any of the three directly.

**Volume stays 4, 5 or 6 sessions** – owner, settled: «зачем? ну нас всё ок в этом плане я считаю».
Four ticks is her minimum and six her maximum, whatever week it is. The three presets survive as a
fast path (tapping *Balanced* ticks five General days in the standard shape) but they are a shortcut
for an arrangement, not the model.

### ⚠ Why `General practice` is a block and not an absence of blocks

It looks redundant – four ticks across four kinds would also be "a bit of everything" – and it is not,
for three reasons:

1. **It is not the same amount of her time.** Four ticks is four sessions and four billed hours; one
   General tick is *one* session that touches all five skills. Without it there is no way to express
   an ordinary practice session at all, and an hour of mixed practice is what most training actually
   is.
2. **It is what every shipped career has been doing**, so a loaded save reads back as itself, exactly
   (§10).
3. **It is the honest option for a parent who does not want to choose.** Never sharp, never wrong.

### And intensity is dropped

The previous draft had light / normal / hard as a third setting. Under a layout where he picks the
days it is a second way of saying "a harder week", which the number of ticks and their arrangement
already say. It is out.

---

## 3. The per-day limit, which the engine already believes

> «Есть ограничение у нас по количеству тренировок в день в обычные дни и без школы, это тоже надо
> показать.»

**This is not a new rule. It is already in the engine, and the calendar has been printing it for
weeks.** Two ECONOMY blocks and one read-out all encode the same belief:

| where | what it says |
|---|---|
| `ECONOMY.summerBlock` (`loadFactor: 1.4`, `conditionCost: 3`) | the nine-week holidays are *"two sessions a day"* |
| `ECONOMY.school` (`loadFactor: 1.4`, `conditionCost: 0`) | past the last school year, every week is |
| `engine/world/summer.ts` – `summerBlockWeek()`, `summerLoadFactor()`, `pastSchool()` | the predicate both halves read |
| `composables/weekDays.ts:482/484` – `trainingReadout()` | *"N days on, two sessions a day – no school, so the work doubles up"* / *"– the mornings are hers now"* |

So the limit, stated rather than invented:

> **One session a day on an ordinary school day. Two on a day with no school** – that is, inside
> `SUMMER_WEEKS` (season weeks 25–33, `engine/season/calendar.ts`) or past
> `schoolIsOver(week, birthMonth)` (`engine/kidLife.ts`) – and one on the days `summerBlockWeek()`
> already refuses: injured, at a tournament, on a booked family week, or resting a knock.

Two consequences that fall straight out, and both of them are good:

* **School constrains the plan and leaving school frees it.** Six sessions in a school week must
  occupy six days, so there is one day off and almost no arrangement to choose. Six sessions in July
  can be three doubled days and four days off. That is the fiction, made mechanical, with no new
  constant.
* **The summer block becomes visible for the first time.** Today it silently grants +40% and the
  player has no way to see or set it; the read-out claims she trains twice a day and he has never been
  able to. Now the day head grows a second slot in July and he does it himself.

### ⚠ And the window bonus should follow what he actually does

Today `summerLoadFactor` is a property of the *window*: +40% rate and −3 condition, automatically,
whether or not the week is doubled. Once the player can double, that becomes double-counting, and the
honest shape is that **the bonus follows the doubling rather than the calendar**: a fully doubled
school-free week reproduces `1.4` and `−3` exactly, an undoubled one gets `1.0` and `0`.

That is a behavioural change to a shipped, measured window (`school-ends-2026-08.md` swept it), and it
is the single most consequential thing in this design because post-school weeks are most of a late
career. **It is listed as the headline bench item in §12**, with the fallback if the sweep dislikes it.

---

## 4. What each choice costs

Nothing here is a penalty the game invents. «Мы ни за что не наказываем» holds: the tour punishes, we
never do.

### How many ticks – that costs **money**

`coachHoursForPlan` counts sessions, and the weekly bill is `rate × hours × corridor × jitter`, split
into a coach line and a facility line (`weeklyBillSplit`). A sixth tick is a sixth hour at his rate.
**This is the only choice that costs cash** – the bill does not care what she did, only how much of
him she had, which is also what a real coach's invoice says.

### Which days – that costs **her body**

Two existing terms carry it, and **no new arithmetic is added**:

* **Rest days pay recovery.** `restRecoveryBonus` already reads the rest share and pays +2 / +1 / 0.
  Untouched: 3 or more days off is +2, two is +1, one is 0 – which is exactly the 40 / 25 / 15
  thresholds it already has, read as days.
* **Doubling up costs condition and buys rate.** `summerBlock.conditionCost` is already the price of a
  doubled day and `summerBlock.loadFactor` is already what it buys. Re-aimed from the calendar window
  to the week the player actually built (§3).

**This is why the "longest run of training days" term from the previous draft is removed** – see §6.

### Which rows – that costs **her game**

⚠ **The week's total improvement is fixed by its size; the rows only decide where it lands.** Six serve
sessions do not improve her more than six mixed ones – they improve her differently. If rows added
rate rather than redirecting it, the choice would be a button marked "yes please", and `knock.ts`'s
standing rule is that a branch which always ends better is not a decision.

The cost of pointing the week at her serve is that her legs, her hands and her head get nothing that
week. **And there is a second cost he cannot see, which is the whole point:** `growWeek` takes a share
of the *remaining* distance to her ceiling, and `engine/radar.ts` keeps that ceiling behind a permanent
fog (`CEILING_FLOOR_HALF = 4`, which never narrows further). Aim a season at a wing that is nearly full
and the week converts into almost nothing – not because anything punished it, but because
`max(0, potential[k] − skills[k])` is small.

**This is the first decision in the game whose currency is being right**, and it is the one the coach
is sold on.

### What each session costs in time – shown, because he asked

> «чтобы он видел какие тренировки сколько "стоят" по времени»

**Every session is one billed hour of him** – `coachHoursForPlan`'s own conversion, unchanged. So the
readouts are true by construction and need no new arithmetic:

* **on each block's title line, right-aligned:** `2 h` – what that row is spending;
* **on each day head:** the day's capacity as dots, filled as he ticks – `M ·` / `M ••` – so the limit
  is visible before he bumps into it rather than as a refusal;
* **one sentence under the whole thing**, which `trainingReadout()` already owns: *"5 sessions, 5 hours
  – two days off. $312 this week."*

Per-kind hour costs were considered and rejected: if match play cost two hours and fitness one, the
bill would depend on the mix, the 4–6 cap would become ambiguous, and a measured price would reopen.
Named in §12 as a real option if the owner wants it later.

---

## 5. A whole week of one thing

> «Может вообще всю неделю из одного и того же собрать – его право»

Legal. Tick one row across the week. Here is exactly what it produces – say six Serve & return
sessions in a school week, so six days ticked and one off.

| channel | what happens | changed? |
|---|---|---|
| the bill | six billed hours. Identical to six mixed sessions. | **no** |
| `trainFactor` | 1.28, the Grind rate. Identical. | **no** |
| `restRecoveryBonus` | one day off → 0. Identical to any other six-tick week. | **no** |
| `knockChance` | the six-session term. Identical. | **no** |
| `growWeek` | serve and return take the entire week's improvement; groundstrokes, stamina and composure take none | **yes, and this is the feature** |

**Nothing breaks.** No channel needs a special case, no clamp is hit, no arithmetic goes out of range.

**Over a season it is self-limiting, with no rule against it:**

1. Serve and return sprint at their ceilings and – because growth is a share of remaining headroom –
   **arrive sooner, not higher.** That is `coach-as-load-manager.md` §1's measured finding used
   deliberately: *"a faster rate mostly means arriving sooner rather than arriving higher."*
2. Once they are near those ceilings the week converts into nearly nothing, while the cohort keeps
   drifting up (`driftCohort`, four draws a player, every tick). **The exploit eats itself.**
3. The tour collects. `fatigueTerm` (`engine/match/point.ts`) scales the in-match fatigue penalty by
   `(1 − stamina/100)`, so a stamina-starved build fades in exactly the matches that decide a run.
   `groundstrokes` enters `basePServe` as a *difference* between the two players, so she is outhit
   from the back of the court in every rally she does not end. `composure` sets the break-point
   penalty, so she is worst on the points that swing a set.
4. If a knock arrives, it lands where she worked. `drawKnock`'s part draw already walks a weighted
   table (`KNOCK_PARTS`); **weighting that table by what the week contained costs no new draw** – the
   same single uniform, mapped through a different table. Six weeks of serving develops a shoulder, and
   `pushedParts`' accumulating thread then makes that shoulder her career's story rather than a series
   of unrelated Fridays.

So a monomaniac week is legal, cheap, and slowly ruinous **entirely through systems that are already
tuned.** Nothing was added to punish it.

---

## 6. ⚠ The "longest run of training days" term is removed

The previous draft invented one quantity – the longest unbroken run of training days, feeding
`knockChance` – because otherwise *when* he trained would have been decoration. It was the only place
that draft added arithmetic to a tuned system, and it was flagged as such.

**It is not needed, because this layout makes placement bite out of constants that already ship:**

* **the per-day limit** (§3) forces distribution: in a school week six sessions *must* occupy six days,
  and no arrangement can dodge that;
* **the rest-day count** already pays recovery through `restRecoveryBonus`, unchanged, so choosing to
  double up and take four days off is a real trade against spreading six singles;
* **doubling already costs condition** through `summerBlock.conditionCost`, and already buys rate
  through `loadFactor`.

Between them, *which days* and *how many on a day* both have prices, and both prices are numbers that
already exist and have already been swept. A third, new, unmeasured slope on top of that would be
paying twice for the same tension. **Removed.** If the bench later shows placement is flat, it can come
back – but adding arithmetic to a tuned system is a cost, and there is now a cheaper source of the same
pressure.

*(This also answers the question the previous draft put to the owner as "does WHEN bite". It does, by
construction: he is choosing days.)*

---

## 7. What the coach does: he comes and changes something

> «иногда может приходить и менять что-то»

**The pen stays with the player.** There is no auto-plan and no switch. What a hired coach does is turn
up occasionally, move one thing, and tell you he did.

### He changes it. He does not stop your week.

**No dialog, no block.** He moves a tick; the player finds out by looking. Three surfaces carry it, all
of them existing:

* **the matrix itself** – the tick he moved carries the accent, and one line under the blocks says what
  he did in the parent's language: *"Your coach moved Thursday to her return."*
* **the news feed** – an `addEvent` of type `'info'`, which is the app's channel for "somebody said
  something" and is exactly how `setCoachOnEventWeeks` already announces itself;
* **Home**, if it is worth surfacing – `composables/inboxCue.ts` is the existing idiom.

**Undo is untick.** There is no special affordance and there does not need to be one: the plan is a
matrix of checkboxes and every one of them is the player's to set. If he puts it back, the coach does
not propose the same change again for a while.

**A blocking dialog was considered and rejected**: the knock stops the career because the knock is *her
body* and only the parent can answer, whereas a coach rearranging Thursday is the thing you hired him
to do – and interrupting the paying parent while the self-coached one is asked nothing would invert
*"you are buying your attention back"*, which is the whole sentence the purchase rests on.

### ⚠ His rung decides how often he is RIGHT, not how often he speaks

A deliberate reversal of the load wave, worth stating because that wave shipped the opposite.
`coach-as-load-manager.md` §9 made the rung control the **interruption rate** (14.2 taps a career
self-coached, 1.8 at Elite) and §9a then recorded that this produced a lovely monotone ladder and
*moved no outcome at all.*

So: **every rung speaks at the same rate**, on the same cooldown. A coach is a coach; he says something
when he sees something. What the rung changes is whether he is pointing at the right thing – because
his proposal is a pure function of `axisReadings`, his own **fogged** read of her. The numbers exist and
are measured: `COACH_EYE` runs 0.15 (self) → 0.55 (elite), `COACH_ACCURACY` 0.72 → 1.0, and a family
that never hires anybody ends a career with a permanent ~3.4-point haze – *"they watched every match and
still could not quite tell you what they were looking at."*

A Budget coach moves Thursday to the wing he *thinks* has the most room. An Elite coach is usually
moving it to the one that really does. Same rule, different clarity. **The hidden oracle stays
rejected** – he never knows the future, only what he can see.

**And this is why a coach beats a self-coach without self-coaching being a punishment.** The week is
aimed at a target nobody can see, and what money buys is the aim. The parent has the same blocks, the
same limits, the same ceiling and no cap of any kind – he is simply deciding in the dark, and he can
fix that himself by playing her more, because `EVIDENCE_PER_UNIT` saturates on matches and not on
money. A parent who reads the radar and plays her often can beat a paid coach; that is the reward for
attention, and the owner's own refusal of a cap.

### When he speaks – observable state only, no foresight, no draw

| trigger | what he moves | existing state |
|---|---|---|
| she is under the tier's condition floor | a tick off, into a rest day | `ECONOMY.availability.minConditionToEnter` |
| a knock on a joint her week is loaded toward | that row off the week | `world.knock`, `pushedParts` |
| a wing his read puts far from its ceiling is getting no ticks | one day into that row | `axisReadings` |
| a tournament inside **his own horizon** | a hard row into Match play the week before | `COACH_HORIZON_WEEKS`, already per-rung |

The last row is free: that constant already encodes *"a budget coach notices the obvious, an elite one
sees the block ahead"*, and it already ships.

**Zero draws.** Triggered by state, never by a die – the discipline `coachEntryLine` already keeps:
*"picked by HOW tired she is rather than by luck – a draw here would make the same coach say different
things about the same Tuesday."*

---

## 8. What travelling with him buys

The owner killed the previous answer:

> «у нас век технологий, есть зум и прочее»

A coach who stayed home is not blind. He watches the recordings, he calls, he sees her numbers. So
aiming what a competition week teaches – by which wing the opponent actually tested – **is a home
coach's job**, not a fare. It stays in the design, attributed correctly.

**What he does from home, and travel adds nothing to:** reading her (`axisReadings` accrues either
way); every plan intervention in §7; load calls; and opponent preparation – `growWeek`'s `matchBonus`
(up to +54% on a week's rate) is uniform across five skills today while `radar.ts` already computes
`testedFraction` per axis, so pointing a competition week's learning at the wing the matches examined
is a real improvement available at any rung, from anywhere.

### What he can only do there: on-court coaching

**The coach in her box changes what happens at break points, and the rules of tennis are why a video
call cannot.** On-court coaching has been permitted on the women's tour since 2022 – real, not
invented – and it is permitted only if he is *there*. That is the answer to «есть зум»: this is not
something technology has caught up with, it is something the sport allows only in person.

It lands on a channel that already exists. `applySurfaceStyle` (`engine/match/style.ts`) already takes
her `MatchPlayer` and returns an adjusted one – *"pure arithmetic, ZERO RNG, no world state"* – because
the surface changes how she plays. A coach in the box is the same shape of adjustment at the same
point, on **composure**, which the point model spends on exactly the moments a coaching word is for:

```
// engine/match/point.ts
const BIG_POINT_MAX_PENALTY = 0.03
p -= (1 - server.composure / 100) * BIG_POINT_MAX_PENALTY
```

**Break points.** That is where composure is cashed and where a changeover conversation matters. A coach
at the event moves that term, by an amount set by his rung.

**Why this answers «он нам вообще зачем?» at +0.2–0.4%:** the growth multiplier fades because it is a
share of remaining headroom, and nothing can save it. **A composure adjustment inside a match does not
fade at all** – it reads the scoreline, not her headroom. So his value stops being about making her
better, which is over, and becomes about the match in front of her, which is what tour coaching
actually is.

It costs no draw (deterministic arithmetic on the match player) and it is worth exactly what a tight
match is worth – nothing on the junior ladder, where the travel row is correctly locked, and real money
on the professional tour. That is the test the owner set when he locked it, and the bench criterion is
§12 row 6.

**Candidates evaluated and not proposed**, so nobody thinks they were missed: a hitting partner and a
warm-up at her level (genuinely presence-only, but there is **no existing quantity for match-day
readiness** to land it on – it would need a new modifier, and it is the next place to look if composure
is not enough); decisions between matches about a body that has just played three sets (retiring
mid-run is not a choice the game offers anyone, so there is nothing for him to decide); and the person
beside her when it goes wrong, which is the truest of them emotionally and is mechanically the *same
currency* – it is the fiction that dresses the composure term, not a second term.

---

## 9. The screen

### 9a. `Her week` / `Coaches` stands

Unchanged and unobjected to. The Coach Market screen is the right home and
`src/components/ui/SegmentedRow.vue` (`.tab-row` / `.tab-pill`) is the app's one segmented switcher, so
no component is invented.

**Self-coaching / Coaches is still the wrong axis.** `COACH_TIERS` is literally
`['self','budget','middle','high','elite']` and `coachFactor`, `COACH_EYE`, `COACH_ACCURACY` and
`physioQuality` all have a `self` row – one ladder, self on the bottom rung, which is the owner's own
«ничем не отличается, кроме того, что ничего не стоит». Two tabs would assert they are different kinds
of thing and hide the one comparison the screen exists to make. Self-coaching stays what it is today: a
row *below* the market, always available, never behind affordability.

**On "раскрывающиеся":** an accordion expands in place and makes the page longer, which is the longread
he is avoiding; a segmented row swaps the content and keeps the screen one viewport tall. The app has
no accordion anywhere.

### 9b. The `Her week` tab, top to bottom

1. **The segmented row** – `Her week` · `Coaches`.
2. **His line, when he has moved something.** One strip, not a card: *"Your coach moved Thursday to her
   return."* Absent otherwise, and absent entirely when self-coached – nobody is being paid to have a
   view. (That is also the fix for R15 item 18, *"a family paying nothing gets professional draw
   analysis for free"*, which round 15 called *"the same finding as the headline from the other side"*.)
3. **Three preset pills** – `Light` · `Balanced` · `Grind`, `.option-row` / `.option-pill`. A fast
   path; the blocks do everything they do.
4. **The day-head row** – `M T W T F S S` with each day's capacity as dots beneath it, filling as he
   ticks. One dot on a school day, two on a school-free one. **This is where the limit is shown.**
5. **Five blocks**, each a title line with its hours right-aligned, and seven checkboxes under it:

   ```
   SERVE & RETURN                                   2 h
   [ ]   [x]   [ ]   [x]   [ ]   [ ]   [ ]
   ```

6. **The read-out sentence**, which `trainingReadout()` already owns: *"5 sessions, 5 hours – two days
   off. $312 this week."* It is the legend, in the parent's language, exactly as that function's own
   note argues, and it absorbs what used to be a separate price line.

A week the player does not own – away, off, exams, rehab – draws as it does today and the checkboxes
are inert, with the sentence saying why.

### 9c. 375px, measured

Content width is `375 − 2×16 = 343px` (`--app-pad-x: 16px`); the shortest supported phone is 375×667
(`style.css:3103`). ⚠ **Widths below are computed from the CSS at ~7.2px per character and need a
browser check before building; I could not run one without touching `src/`.**

**Horizontally there is no constraint of consequence, and that is the point of this layout.** Seven
columns at a 4px gap are `(343 − 24) / 7 = 45.6px` each – above the 44px tap target – and a checkbox
glyph is 26–28px centred in that, so the column has slack rather than a squeeze. **Nothing in a column
has to be legible**: the kind is named on the title line above, where it competes with nothing. And if
the gap is implemented as button *padding* rather than margin, the tap target is the full 49px column
and even the 4px constraint disappears.

That is the difference from the previous draft, which put the day and the kind in the same 45px cell
and therefore needed five distinguishable wordless marks. Splitting them onto two lines dissolves the
whole problem.

**Everything else fits comfortably:** the segmented row ~190px; three short-label preset pills ~235px;
the block title line is one line of text with a right-aligned `2 h`.

**The real constraint is vertical, and it is mild.** Estimated component heights:

| | height |
|---|---|
| segmented row + margin | 52 |
| his line, when present | 44 |
| preset pills + margin | 52 |
| day heads + capacity dots | 26 |
| 5 blocks × (title 16 + gap 6 + row 44 + margin 12) | 390 |
| read-out sentence (two lines) | 40 |
| **total** | **~604** (≈560 on the weeks he has not moved anything) |

Against roughly **520–570px** of visible content on a 375×667 phone (viewport less the 24px top pad and
a ~76px tab bar). So **the tab fits on a 390×844 and scrolls by less than one block's height on the
shortest supported phone.** That is not a longread; it is one screen and a nudge.

**If zero scroll on the short phone is wanted**, one saving suffices: **drop the preset pills** (−52px),
since the blocks can do everything they do. I would not take it by default – the presets are the fast
path for a player who does not want to plan every week.

**What genuinely does not fit at 375, measured:** the market tab's own existing preset labels –
`Light 4/wk · Balanced 5/wk · Grind 6/wk` computes to ≈355px against 343 available, so the row that
ships today is already at or past the limit. The plan tab uses the short labels and puts the count in
the read-out sentence. (Whether the market tab gets the same treatment is a one-line fix and not this
spec's to make.)

### 9d. ⚠ No new art is needed

The previous draft's art gap is **gone.** Nothing in this layout has to be legible as a wordless mark:
block names are text, the controls are checkboxes, day heads are `DAY_SHORT`, and the capacity dots are
CSS. The five kinds never appear as an icon anywhere.

The Calendar screen also needs nothing: `DayKind` keeps `court` and `gym`, with Fitness drawing as `gym`
and every other kind as `court`, exactly as today. If the owner later wants the *calendar* to
distinguish the kinds, that is a separate request with its own art brief – it is not required by this
design.

### 9e. ⚠ This changes `weekDays.ts`'s standing rule, deliberately

That header says: *"NOTHING here is editable... a per-day editor is not a later refinement of this file,
it is the thing this file exists instead of."* Correct while the plan was one scalar; the owner has now
ruled otherwise, and the header must be rewritten rather than quietly contradicted. What survives, and
should be written in:

> The ticks are the plan. What the engine reads from them is how many sessions there are, which kinds,
> which days, and how many share a day – never a time of day. `REST_PRIORITY` and `GYM_PRIORITY` stop
> being the model and become the **preset expander**: the arrangement a preset lays down, and the
> arrangement a migrated career reads back as.

`weekGrid.ts` is untouched: the sim still has no hours, and *"Времени суток у движка нет и не будет"*
stands.

---

## 10. The schema

`SAVE_SCHEMA_VERSION` is **45**. Three-part move under CLAUDE.md invariant 3: bump to 46, append-only
migration, golden fixture. **I specify it; I do not write it.**

```ts
// shared/protocol.ts
export type SessionKind = 'general' | 'serve' | 'rally' | 'fitness' | 'matchplay'

export interface WeekPlan {
  /** LEGACY AND KEPT, now a three-valued projection of the week below: 4 sessions -> 60/40,
   *  5 -> 75/25, 6 -> 85/15. Written by the one command that writes `week`, never independently. */
  train: number
  rest: number
  /** v46 – Monday..Sunday. THE PLAN. Each day holds the kinds she trains that day: an empty array
   *  is a day off, and the array's length may not exceed the day's capacity (1, or 2 with no
   *  school). Between 4 and 6 sessions across the week. */
  week: SessionKind[][]
}
```

A day as an **array of kinds** rather than one kind is what lets a doubled day exist at all – which the
previous draft's one-kind-per-cell shape could not express.

**Why `train`/`rest` are kept.** They are read by four engine systems and two screens, and the
RNG-invariance test pokes `train: 100` on purpose. Keeping them as a projection means every existing
reader is byte-identical and the migration is a pure default. The drift risk is real and the answer is
that `setPlan` is the only writer of either – the discipline `weeklyBillSplit` uses to guarantee
`coach + facility === total`.

### The migration, v45 → v46

Build it out of the display conventions the calendar has been drawing all along:

```
sessions = sessionsForPlan(save.plan.train)     // 4 / 5 / 6, unchanged
sessionDays(sessions)                           // which indices are sessions – unchanged
every session day  -> ['general']
every other day    -> []
```

**A career saved before v46 reads back as exactly the career it was**: same session count, same rate,
same bill, same knock chance, same recovery, and – because `general` weights all five skills equally –
**byte-identical growth on the week it is loaded**.

⚠ **The drawn gym day migrates to `general`, not `fitness`, and that is deliberate.** The gym day has
never been simulated – `growWeek` has never heard of it – so making it a real fitness session on load
would be the migration changing his game. The visible consequence is small and honest: a loaded career
opens with no gym day ticked, and the screen's first invitation is to decide whether one of those days
is one.

⚠ **And a migrated career is never doubled**, so the §3 change to `summerLoadFactor` is what decides
whether its summer weeks still get +40% – which is exactly why that item is the headline bench
question and not a footnote.

**Fixture** `tests/fixtures/saves/v46.json`, and the test that matters: **a v45 fixture loaded and
ticked one week under v46 code must produce byte-identical `skills` to the same fixture ticked under
v45 code.** A green `goldenSaves.test.ts` proves the shape loads; it does not prove the arithmetic held.

---

## 11. RNG

Invariant 2 is permanent law: a no-action run and an action-laden run under the same code must tap
identical MAIN sequences. The week is player input, so this has to be airtight.

1. **No tick adds, removes or reorders a draw on any stream.** Everything is a post-draw multiply or a
   redistribution – the pattern `knockTauFactor`, `physioRiskFactor` and the vacation buff already
   document, and the reason each shipped without moving a draw.
2. **`growWeek` keeps exactly one draw off `seed:growth:<week>`, in the same position.** The luck value
   is drawn *before* the per-skill loop and multiplied into each skill's gain. **The ticks change what
   is done with the number, never which number is drawn** – so a career's week 30 draws the same luck
   under every possible week the player can build.
3. **The knock's three draws stay unconditional and in fixed order.** `drawKnock` takes arrival, repeat
   and part off `seed:knock:<week>` *before* comparing against `knockChance`. Weighting `KNOCK_PARTS`
   by what the week contained changes what the existing `partRoll` maps to, not what `partRoll` is –
   **the same single uniform, a different table.** Zero draws added.
4. **The doubling charge is integer arithmetic beside `accrueCondition`**, the shape the summer block
   and the knock's rest credit already use, which is what keeps `accrueCondition`'s arity-2 zero-RNG
   contract (pinned in `tests/condition.test.ts`) intact.
5. **The coach's intervention draws nothing.** Triggered by observable state, rate-limited by a
   cooldown; `axisReadings` runs at snapshot time on `seed:read:<axis>` keyed with **no week in it**, so
   his read is fixed per career per axis and the line cannot reword itself.
6. **On-court coaching draws nothing.** `applySurfaceStyle` is deterministic arithmetic on a
   `MatchPlayer`; this is a second multiplier at the same point.
7. **MAIN is untouched by construction.** A tick's whole MAIN budget is base costs plus four draws per
   cohort player, and nothing here is either. The frozen capture (41550 draws / `e6b0c709`) should be
   **unchanged** – restating that it is a documented measurement and not a change-gate since v35, so a
   future wave that legitimately adds a MAIN draw updates it. This wave should not need to.
8. **The test to write:** repaint the whole week every week across a career and assert the MAIN sequence
   is identical to a no-action run. The existing invariance test that pokes `train: 100` is the shape;
   it needs `week` added to the sweep.

---

## 12. The ship rule – acceptance criteria, authored before anything is built

Invariant 4: tuning is measured, not guessed. **The bench needs a third arm.** `tools/two-cells.ts`
hires at week 0 and **never takes his advice** – round 15 says so – and this design *is* advice. Arms:
**self-coached**, **coached-and-ignoring**, **coached-and-listening**, at both backgrounds.

| # | criterion | today | ship at |
|---|---|---|---|
| 1 | **Rank.** Coached-listener finishes above self-coached at both backgrounds. | −8 (8k), −13 (25k) | **≥ +5 places at both** |
| 2 | **Money.** End funds within one season's retainer of self-coached. He is a cost; the product is the daughter, not the balance. | −$14,069 / −$16,714 | **≥ −$5,000 at both** |
| 3 | **Entries.** The measured mechanism of the whole defect. | 85 / 101 = 84% | **≥ 93% of the self-coached count** |
| 4 | **His hit rate is a ladder.** Of the interventions the listener accepted, the share that pointed at the skill that really did have the most headroom, budget → elite. **The thing being sold, measured directly.** | not measurable today | **monotone across all four hired rungs** |
| 5 | **Self-coaching is not dominated.** A self-coached arm that reads the radar and re-aims stays close to the middle-coach listener and does not beat Elite. | n/a | **within 5 ITF places of middle-listener; behind elite-listener** |
| 6 | **Presence pays its fare.** Pro-tour arm only: prize money gained with him in the box against the second fare. | n/a | **positive over a season, at Middle and above** |
| 7 | **RNG.** Every week repainted every week taps an identical MAIN sequence to a no-action run. | law | **capture unchanged at 41550 / `e6b0c709`** |
| 8 | **Schema.** A v45 fixture ticked one week under v46 code produces byte-identical `skills`. | n/a | **exact** |

**Criterion 4 says whether the mechanism fired at all**, and it is deliberately not an outcome number.
`coach-as-load-manager.md` §9a is the cautionary tale: the fog produced a beautiful monotone *tap*
ladder and moved no outcome, and the outcome ladder had to come from `physioQuality` instead. **If hit
rate is monotone and rank is not, the mechanism works and the magnitude is the knob** – a tuning
conversation, not a redesign.

**Criterion 5 is the one to watch in playtest**, and its failure mode is what the owner explicitly
forbade: a self-coached career far behind means the fog is doing too much work and self-coaching became
a punishment. The fix in that case is `COACH_ACCURACY.self`, never a cap on anybody.

### What still needs a number before it ships

No open questions for the owner – these are bench items, and item 1's DIRECTION is now ruled
(see the approvals block at the top); what is left of it is a magnitude.

1. **⚠ THE HEADLINE, AND THE OWNER RULED IT IN ADVANCE (10.08): `summerLoadFactor` DOES follow the
   doubling instead of the calendar (§3).** So the sweep measures the SIZE, not the direction. The
   claim to test: a post-school career that doubles its days lands where today's does, and one that does
   not lands measurably lower **as a choice rather than a trap**. `school-ends-2026-08.md` already has
   the harness. **Fallback if the sweep dislikes it:** keep the window bonus automatic as it ships and
   charge condition for doubling only – less honest, no balance movement.
2. **The condition charge for a partly doubled week.** `summerBlock.conditionCost = 3` is the price of a
   fully doubled week; the middle needs a rule that stays integer ("no fractions", the owner's round-9
   redesign) and reproduces 0 and 3 at the ends.
3. **Does an untargeted skill get zero, or a floor?** A serve session still involves moving, so a small
   floor is the truer fiction. **Balance does not depend on it** – §5's asymptote does the work either
   way – so it is a fiction choice with a number attached.
4. **The size of the on-court coaching term, by rung**, against `BIG_POINT_MAX_PENALTY = 0.03`.
5. **Optional, if the owner wants it:** per-kind hour costs (match play as a two-hour session). Rejected
   for now because the bill would depend on the mix and the 4–6 cap would become ambiguous.

---

## 13. What survives of `what-a-coach-is-for.md`, and what is superseded

That file is canonical for `area: economy/progression` and **must not be edited here** – another wave
will.

**Survives, unchanged:**
* **§1's measurement.** The fade is real, headroom-driven, honestly measured.
* **§3's three refusals, all of them.** No inflated multiplier; no second currency, coaching minigame or
  skill tree; no coach who is always right. This design breaks none: the blocks redistribute an existing
  rate, the intervention is fogged, and nothing new is bolted beside the tuned systems.
* **The rule that `growWeek` takes a share of remaining headroom and must not be propped up.** This
  design *depends* on it – it is what makes an all-one-thing season eat itself.
* **Pillar 1 (scheduling)** – shipped and untouched. **Pillar 4 (the person)** – untouched.

**Superseded by the owner's rulings of 09.08:**
* **The central framing – "the coach's job changes as she grows, and that is the design".** Overruled.
  He is not a role that migrates across a decade until it finds work; he does a job that exists in week
  one, and the job is the week. The four pillars survive as a description of *what he has opinions
  about*, not of *when he becomes useful*.
* **§1's implied diagnosis.** It measured the *slope* of his value and never asked whether the *level*
  was positive. Round 15 answered that: at both backgrounds it is negative.
* **§4's ordering of what is open.** The training plan comes first; load and the opponent become
  consequences of it rather than separate builds.
* **Pillar 3 as "a small edge in that match".** Split in two by §8: opponent preparation is a **home**
  coach's job at any rung; the in-match edge is **presence**, and it is the only thing travel buys.

---

## 14. Not in this slice

* **No change to `potential`.** A great coach does not raise her ceiling – he aims at it sooner. Letting
  him touch it would make the fog decorative, which that design cannot survive.
* **No new `developmentFactor` values.** If aim works, the multiplier ladder stays where it is and the
  coach's value comes from where the growth landed, not how much of it there was.
* **No intensity setting**, per §2.
* **No volume outside 4–6 sessions**, per the owner.
* **No run-length term**, per §6.
* **No time of day.** `weekGrid.ts`'s rule is untouched.
* **No new session kinds on the Calendar screen.** `DayKind` keeps `court` and `gym`; distinguishing the
  five kinds there is a separate request with its own art brief.
* **No coach-style / session-kind coupling.** A `serve-first` coach favouring serve work is coherent and
  unmeasured; `fitFactor` already carries style and doubling it here is two knobs for one fiction.
* **No AI weeks for the cohort.** The rivals model neither load nor aim; giving them either is a
  different slice.
