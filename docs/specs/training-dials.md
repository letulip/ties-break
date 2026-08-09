---
type: spec
status: draft
area: training/plan
canonical: false
last-reviewed: 2026-08-09
---

# The training dials – what a week is made of, and the job that makes a coach worth money

**Design proposal. Nothing here is built, and nothing in `src/` was touched to write it.** Where a
number could not be established without prototyping, it is named as open rather than guessed.

The owner, 09.08, replacing my four-pillar framing with a sharper one:

> «Самокоуч, по сути, ничем в данный момент не отличается от коуча, кроме того, что ничего не стоит –
> вся программа тренировок как была автоматической, так и осталась, мы обсуждали ручки что и в какие
> дни тренировать, чтобы игрок имел весь контроль и все последствия.»

and, on the price:

> «Есть мир, там есть тренеры, они стоят денег и не просто так, вот нам надо как-то показать почему
> они столько стоят.»

He is right, and the consequence runs deeper than a missing feature: **the coach cannot be better
than self-coaching at a thing neither of them does.** `world.plan` is one train/rest split, the week
resolves itself, and there is no training decision in the game for a coach to be good at. Every
attempt to justify his price has therefore had to reach for something outside training – scheduling,
physio, a fogged read – because training itself was not a place where anyone could be better or
worse.

`docs/specs/round15-triage.md` measured what that costs. 50 careers a cell, four seasons,
`tools/two-cells.ts`:

| | self-coached | middle coach | what the coach buys |
|---|---|---|---|
| **8k / working** | $19,522 · ITF #48 · 101 entries | $5,453 · ITF #56 · 85 entries | **−$14,069, −8 places** |
| **25k / middle** | $22,712 · ITF #44 · 101 entries | $5,998 · ITF #57 · 97 entries | **−$16,714, −13 places** |

Hiring makes the family poorer **and** the daughter lower-ranked, at both backgrounds, because the
retainer is entry money and fewer entries is fewer results. This spec is what he is supposed to be
buying instead.

---

## 1. What a training week is made of today

The boundary between what the grid **draws** and what the engine **simulates** is the foundation of
everything below, and `src/composables/weekDays.ts` argues it explicitly in its own header: *"the
engine resolves whole WEEKS and knows nothing of days (there is no day resolution anywhere in the
sim), so the alternative to a stated convention is not a truer layout, it is no layout."*

### 1a. Furniture – what the grid draws, and the engine has never heard of

All of it derives from one number, `plan.train`, and none of it reaches the sim.

| drawn | source | the engine's view |
|---|---|---|
| how many sessions | `sessionsForPlan(plan.train)` = `round(train/100 × 7)` → 4 / 5 / 6 | never asked |
| which days are rest | `REST_PRIORITY = [6,2,4,1,5,3,0]` – Sunday, then Wednesday, then Friday | never asked |
| the one gym day | `GYM_PRIORITY`, lands on Tuesday at all three presets | **never asked – fitness is not a thing she trains** |
| the practice match on Saturday | last court day of the week | the booking is real; the day is not |
| morning / afternoon blocks | `composables/weekGrid.ts`, whole file | *"Времени суток у движка нет и не будет"* |
| school hours, exam papers, travel days | display conventions, each written down | `isExamWeek` gates entries only |

`weekGrid.ts` states the rule for its whole layer: **this is visualisation.** Not one hour, minute or
session time exists in the sim, the `Snapshot` or the save.

### 1b. Simulation – the four things `plan` actually moves

`plan.train` is a scalar that means four different things at once, and `plan.rest` one:

| channel | function | today's values |
|---|---|---|
| growth rate | `trainFactor(plan)` (`engine/development.ts`) | 0.72 at 60 → 1.056 at 75 → 1.28 at 85, **clamped at both ends** |
| the whole weekly bill | `coachHoursForPlan(plan)` (`engine/coach.ts`) → `coachWeeklyCents` | 4 / 5 / 6 billed hours |
| knock arrival | `knockChance(condition, plan)` (`engine/knock.ts`) | `0.10 + fatigue×0.0022 + (train−75)×0.006`, floor 0.005, cap 0.34 |
| recovery | `restRecoveryBonus(plan.rest)` (`world/medical.ts`) | +2 at rest ≥ 40, +1 at ≥ 25, 0 at 15 – **match-free weeks only** |

And `growWeek` (`engine/development.ts`) is the only place skills change:

```
rate = ageFactor(age) × trainFactor(plan) × loadFactor × coachFactor(tier, fit) × (1 + min(matches,3)×0.18)
gain[k] = rate × max(0, potential[k] − skills[k]) × luck      // one luck draw, shared by all five keys
```

**Three properties of that expression are what this design is built on.**

1. **Growth is uniform across the five skills.** The same `rate` and the same `luck` multiply five
   independent headrooms. The engine has no concept of training the serve rather than the return.
   *This is the hole. Everything the owner asked for lands in it.*
2. **`loadFactor` is the escape hatch and it is twice precedented.** `KNOCK_REST_GROWTH = 0.35` and
   `summerBlock.loadFactor = 1.4` / `school.loadFactor = 1.4` both ride it, and both notes say why:
   `trainFactor` clamps `(train−60)/25` to `[0,1]`, so anything expressed as a lower or higher
   `train` is free for a career already at an end of the range.
3. **Growth is a share of REMAINING headroom.** Aiming a week at a wing that is already full converts
   rate into almost nothing. The asymptote is a cost function that is already tuned and already
   honest – and, critically, it is a cost the player **cannot see**, because `engine/radar.ts` keeps
   `potential` behind a permanent fog (`CEILING_FLOOR_HALF = 4`, never narrowing further).

### 1c. So the precise statement of the problem

The grid draws seven days of decisions. The engine reads one number. **The whole of the week's
content is furniture, and the one number it is furniture for is a rate multiplier that nobody can be
good or bad at choosing.**

---

## 2. The dials

Three, and no more. `docs/specs/coach-as-load-manager.md` risk (b) is binding: *"Weekly load sliders
are exactly the chore the story screen was designed to avoid. It has to be a few decisions with
consequences, in the shape the knock already proved."*

The standing ruling «мы ни за что не наказываем» is honoured throughout: **no dial adds a penalty
term.** Every downside below is either money the family chose to spend, a system that is already
tuned (condition, knock chance), or an opportunity forgone. The tour punishes; the game never does.

### Dial 1 – VOLUME. How many sessions.

Range **3 … 7**, replacing the three presets as the primary value (the presets survive as shortcuts:
Light 4, Balanced 5, Grind 6).

* **Buys:** the growth rate, through the existing `trainFactor` channel.
* **Costs money.** `coachHoursForPlan` is linear in sessions and drives the *entire* weekly bill –
  coach line and facility line both (`weeklyBillSplit`). A seventh session is a seventh hour billed
  at his rate through the corridor. This is the dial that pays for the coach.
* **Costs recovery.** Fewer rest days is a lower `plan.rest` is a smaller `restRecoveryBonus`, and
  condition feeds `knockChance` and `injuryTau`.
* **Costs availability.** `KNOCK_TRAIN_SLOPE = 0.006` per point: Light sits near 2%, Grind near 25%.

⚠ **The two new rungs cannot be expressed through `train` and this is a real constraint, not a
detail.** `trainFactor` clamps at 60 and 85, so a 3-session week would develop at exactly the Light
rate and a 7-session week at exactly the Grind rate – the identical hole `KNOCK_REST_GROWTH`'s note
documents. The fix is the one the codebase has already made twice: **replace `trainFactor(plan)`
with `volumeFactor(sessions)`, a five-point table anchored so that 4 / 5 / 6 reproduce 0.72 / 1.056 /
1.28 byte for byte**, and extend to 3 and 7 by the same slopes. Every shipped career is unmoved at
the three presets. **The two new endpoints have no measured value and must not be guessed** – see
§8, and see §9 Q3, because whether the range widens at all is the owner's call.

### Dial 2 – EMPHASIS. What she works on.

The seven day-slots are allocated across **four blocks**, and the counts are what the engine reads.

| block | skills it feeds | why it is a block and not two |
|---|---|---|
| **Serve & return** | `serve`, `ret` | first-strike tennis; the two ends of the same drill hour |
| **Rally** | `groundstrokes` | the leg the point model was missing (v25); enters `basePServe` as a *difference*, so it both holds and breaks |
| **Fitness** | `stamina` | the gym day, which is furniture today and becomes a decision |
| **Match play** | `composure` | sets, pressure drills, the sparring the practice-match booking already models |

* **Buys:** growth aimed where the player wants it.
* **Costs the other four axes, and nothing else.** ⚠ **Emphasis REDISTRIBUTES a fixed weekly rate; it
  never adds one.** The weight vector renormalises to the identity total, so emphasising the serve is
  paid for by the return, the legs and the head. If it were additive it would be free growth and the
  dial would be a button labelled "yes please", which is precisely the shape `knock.ts` rejects.
* **And its real cost is the fog.** Growth is headroom-proportional, so the efficient allocation is
  the axis furthest from its ceiling – and `radar.ts` guarantees the player cannot read that number.
  A mis-aimed week is not punished; it simply converts rate into almost nothing, because
  `max(0, potential[k] − skills[k])` is small. **No new penalty term exists or is needed.** This is
  the first decision in the game whose currency is neither money nor her body but *being right*, and
  it is the decision the coach is sold on.

The match engine reads all five skills, so an over-specialised girl is punished by the tour and not
by us. A huge serve with no legs loses long matches for a reason already in the model:
`fatigueTerm` (`engine/match/point.ts`) scales the in-match fatigue penalty by `(1 − stamina/100)`
and `match/style.ts` moves stamina again by surface, so a stamina-starved build is worst exactly
where the ladder is deepest – the third set on clay. Nothing is added to punish a lopsided emphasis;
the existing point model already does it.

**Why four blocks and not five (one per skill).** Composure has no drill of its own and stamina has
no wing; pairing serve with return is the only pairing that is a real training hour rather than a
compromise. Four also fits the grid at 375 (§6) and five does not. This is a design call, not a
ruling – if the owner wants five, the schema below carries it unchanged.

### Dial 3 – INTENSITY. How hard those sessions are.

Three settings – **light / normal / hard** – on the `loadFactor` channel.

* **Buys:** a multiplier on the whole week's rate, exactly as `summerBlock.loadFactor = 1.4` does.
* **Costs her body, and not money.** An integer condition charge, in the shape
  `summerBlock.conditionCost = 3` already uses – subtracted beside `accrueCondition` rather than
  inside it, so the arity-2 zero-RNG contract `tests/condition.test.ts` pins is untouched. Plus a
  knock-chance term.
* **Deliberately not billed.** An hour is an hour: `coachHoursForPlan` counts sessions, not effort.

**This split is the sentence the whole design needs: volume costs money, intensity costs her.** Two
dials, two currencies, and the reason they are not one dial is that "five hard sessions or six easy
ones" is a genuine question with no dominant answer. Today they are fused inside `plan.train`, which
is why the plan has never been a decision so much as a spending level.

### Refused: a fourth dial for recovery

Physio already has a command (`setPhysio`) and a measured per-rung ladder (`physioQuality`), and rest
days already fall out of volume. A fourth dial would break "a few decisions" and would re-litigate a
tuned system. Named here so nobody adds it later thinking it was overlooked.

### The dial set, and the check that no dial is strictly better

| dial | buys | costs |
|---|---|---|
| Volume 3–7 | rate | money (linear in the bill), recovery, knock exposure |
| Emphasis (4 blocks) | aim | the other four axes; and a wasted week when aimed at a full wing |
| Intensity light/normal/hard | rate | condition, knock exposure |

Max volume + max intensity is the most expensive, most fatiguing, most injury-exposed week available,
and the knock bench already measured that the grinder arm finishes **20 rank places behind** the
disciplined one. Balanced emphasis is the correct play under fog and is never wrong; a bet is
available to a player who thinks he has read her. There is no third button and no branch that ends
better than the week would have ended without the decision – the standard `knock.ts` sets.

---

## 3. What the coach does that the parent cannot

This is the owner's question, and the answer has to survive his own constraint: **self-coaching stays
a real option, not a punishment – a blank sheet plus the consequences.**

The dials are **identical** for both. Same range, same ceiling, same everything. `COACH_TIERS` is
literally `['self','budget','middle','high','elite']` and `self` is a rung of one ladder, not a
different kind of object. What money buys is four things, in descending order of importance:

### (a) He proposes the plan, and his rung decides how good the proposal is.

The mechanism is already ruled and already measured – `coach-as-load-manager.md` §8: *"he decides on
the facts he can see, and the fog is how much he can see."* A hidden oracle was explicitly rejected
there and stays rejected.

The proposal is a **pure function of `axisReadings`** – the coach's own fogged read of her. He aims
emphasis at the axis he *believes* has the most headroom. An Elite coach is usually right; a Budget
coach is often not. Same rule, different clarity, no new balance surface, no new draw.

**And this is the answer to the question.** The dials are aimed at a target nobody can see, and what
the family is buying is **the aim**. The self-coached parent's numbers are already in the model:
`COACH_EYE.self = 0.15` against elite's `0.55`, `COACH_ACCURACY.self = 0.72` against `1.0`, and a
career that never hires anybody ends with a permanent ~3.4-point haze – *"they watched every match
and still could not quite tell you what they were looking at."*

He is not worse at training. He is less informed, and he can fix that himself by playing her more
(`EVIDENCE_PER_UNIT` saturates on matches, not on money). **Skilled attentive play may beat a paid
coach and that is the reward for attention** – the owner's own refusal of a cap, and the Richard
Williams argument, both preserved intact.

### (b) He holds the pen, so you stop being asked.

On a hired rung the plan re-aims itself week to week: intensity down when condition falls under the
tier's floor, emphasis re-aimed as his read sharpens. The parent may override at any time and the
override stands until he changes it. Self-coaching means the plan holds until *he* changes it, every
week, forever.

The currency is attention, and it is measured: the tap ladder from the load wave runs **14.2 (self) →
6.5 → 4.6 → 3.1 → 1.8 (elite)**. *"You are buying your attention back"* is the truest sentence
available about junior tennis economics and this is where it finally becomes a mechanic rather than a
slogan. **⚠ Whether he may override the parent is an owner ruling, not mine – §9 Q1.**

### (c) He names the wing.

A hired coach's proposal carries one sentence, derived from `axisReadings` and fogged by rung: *"her
return is what is costing her matches."* Below `NOTE_MIN_CONFIDENCE` he says nothing rather than
guessing out loud, which the radar already enforces.

The self-coached family gets **no sentence** – and note that this is not a new withholding, it is the
fix for R15 item 18: *"`coachSays(e)` reads `e.preview` alone and never asks whether anybody is
hired, so a family paying nothing gets professional draw analysis for free."* Round 15 called that
"the same finding as the headline from the other side". This design closes it as a side effect
instead of orbiting it.

### (d) What travelling to a tournament buys.

`world.coachOnEventWeeks` exists, means **travel only** since 08.08, and is a locked row on screen T
because 30.07 cancelled the mechanic behind it. The owner has now named it as the next question, and
it must be answered inside this system rather than as a new mechanic.

**With him there, a tournament week teaches her the thing the week actually exposed.**

The whole apparatus already exists and is currently wasted. `growWeek`'s `matchBonus` (up to +54% on
a week's rate) is uniform across five skills like everything else – so a week in which her return was
taken apart teaches her serve exactly as much. Meanwhile `radar.ts` already computes
`testedFraction` per axis from the opponent's own build (`TEST_SPAN = 12`) and today feeds it only
into *confidence*.

So: **without him, a competition week teaches a bit of everything; with him, the match bonus is
aimed by `testedFraction`.** That is what a coach at a tournament does – he watches the thing that
went wrong and works on it on the Monday – it invents nothing, it costs no new draw (both quantities
are already computed), and it is the honest content of pillar 3 without a match-time modifier.

It also becomes payable exactly when the owner said it should: the fare is weighed against prize
money, which is why the row is locked until the adult tour.

**Second half, and it is a balance change dressed as a fiction – §9 Q2.** A coach left at home did
not see the week, so arguably his tenure clock and his evidence should not accrue on a week he did
not travel to. That would make travel buy *read* as well as *aim*, which is the coherent version. It
also silently reduces what the retainer already buys, and needs the owner's word.

---

## 4. The schema

`SAVE_SCHEMA_VERSION` is **45**. This is a three-part move under CLAUDE.md invariant 3: bump to 46,
append-only migration in `engine/migrations.ts`, golden fixture `tests/fixtures/saves/v46.json`.
**I specify it; I do not write it.**

### The shape

```ts
// shared/protocol.ts
export type TrainingBlock = 'serve' | 'rally' | 'fitness' | 'matchplay'
export type TrainingIntensity = 'light' | 'normal' | 'hard'

export interface WeekPlan {
  /** LEGACY AND KEPT. Still what `knockChance` reads and what screens D and the recap print.
   *  Written by the same command that writes `sessions`, never independently. */
  train: number
  rest: number

  /** v46 – THE COMPOSITION. `sessions` is PRIMARY; `train`/`rest` are its stored projection. */
  sessions: number                              // 3..7
  blocks: Record<TrainingBlock, number>         // counts, summing exactly to `sessions`
  intensity: TrainingIntensity
  /** Does the coach re-aim it each week, or does the plan hold until the parent moves it?
   *  False on every migrated career – see below. */
  autoPlan: boolean
}
```

`WEEK_PLAN_PRESETS` keeps its three keys and gains the new fields; `grind/balanced/light` stay
85/15, 75/25, 60/40 with `sessions` 6/5/4, balanced `blocks`, `intensity: 'normal'`.

### Why extend rather than replace

`plan.train` is load-bearing in four engine systems and two UI surfaces, and the RNG-invariance test
pokes `train: 100` deliberately. Replacing it means touching all of them in one wave. Keeping it as a
**stored projection written by one command** means every existing reader keeps working and the
migration is a pure default. The drift risk is real and the answer is that `setPlan` is the only
writer of either field – the same discipline `weeklyBillSplit` uses to guarantee
`coach + facility === total`.

`coachHoursForPlan` should be re-aimed at `sessions` directly rather than interpolating `train`
through `sessionsByTrain`; at 4/5/6 the two agree exactly, so the bill does not move for any shipped
career.

### The migration, v45 → v46

Every step is a default that reproduces today's behaviour **byte for byte**:

| field | back-fill | why |
|---|---|---|
| `sessions` | `sessionsForPlan(save.plan.train)` | a Balanced career reads back as the 5 sessions it was living |
| `blocks` | the balanced vector – the identity weight, so `growWeek`'s next tick is byte-identical | a migrated career must not develop differently on the week it is loaded |
| `intensity` | `'normal'` → `loadFactor` exactly 1 | same |
| `autoPlan` | **`false`, even on a coached career** | the owner of a shipped save has been setting the plan himself; taking the pen away on load is the migration changing his game |

**What a career saved before v46 must read as:** exactly the career it was. Same sessions, same rate,
same bill, same knock chance, same grid. The only visible difference is that the dials are now on
screen and the coach now has a proposal to offer – which the parent has not accepted.

The golden fixture must be checked the hard way: **a v45 fixture loaded and ticked one week under v46
code must produce byte-identical `skills` to the same fixture ticked under v45 code.** A green
`goldenSaves.test.ts` proves the shape loads; it does not prove the arithmetic held.

---

## 5. RNG

Invariant 2 is permanent law: *a no-action run and an action-laden run under the same code must tap
identical MAIN sequences.* The dials are player input, so this section is the one that has to be
airtight.

1. **No dial adds, removes or reorders a draw on any stream.** Every dial is a post-draw multiply or
   a redistribution – the pattern `knockTauFactor`, `physioRiskFactor` and the vacation buff already
   document, and the reason each of those could ship without moving a single draw.
2. **`growWeek` keeps exactly one draw off `seed:growth:<week>`, in the same position.** The luck
   value is drawn *before* the per-key loop and then multiplied into each key's gain. **Emphasis
   changes what is done with the number, never which number is drawn.** The key is unchanged, so a
   career's week 30 draws the same luck under every possible emphasis vector.
3. **The knock's three draws stay unconditional and in order.** `drawKnock` takes arrival, repeat and
   part off `seed:knock:<week>` *before* comparing against `knockChance`. Moving the slope onto
   intensity moves the **threshold**, not the draw – the identical shape the file already relies on
   so that re-tuning the knobs cannot shift the sequence.
4. **The coach's proposal draws nothing.** `axisReadings` runs at snapshot time on
   `seed:read:<axis>` / `seed:ceil:<axis>`, keyed with **no week in it**, so the read is fixed per
   career per axis and the proposal cannot shimmer under a player who leaves the screen open.
5. **MAIN is untouched by construction.** A tick's whole MAIN budget is base costs plus four draws
   per cohort player, and nothing here is either. The frozen capture (41550 draws / `e6b0c709`,
   pinned in `tests/condition.test.ts`) should be **unchanged** – and it is worth restating that the
   pin is a *documented measurement, not a change-gate* since v35: a future wave that legitimately
   adds a MAIN draw updates it rather than routing around it. This wave should not need to.
6. **The test to write:** sweep every dial to a different value every week across a career and assert
   the MAIN sequence is identical to a no-action run. The existing invariance test that pokes
   `train: 100` is the shape; it needs `sessions`, `blocks` and `intensity` added to the sweep.

---

## 6. The screen

### 6a. Verdict on the two horizontal tabs: the split is right, the axis is wrong

The owner's instinct:

> «делать будем на странице тренеров, предложи что-то, что хорошо впишется в дизайн-систему. Может
> быть нам надо сделать там две раскрывающиеся вкладки горизонтальные Self-coaching/Coaches и с ними
> работать, чтобы не превращать экран в лонгрид. Надо подумать.»

**The Coach Market screen is the right home, and a two-segment switcher is the right control. Splitting
it Self-coaching / Coaches is the one thing that would undo the design.**

Three reasons, in order of weight:

1. **It re-tells the lie this wave exists to fix.** `self` is a rung of one ladder – `coachFactor`,
   `COACH_EYE`, `COACH_ACCURACY` and `physioQuality` all have a `self` row. Two tabs assert they are
   different kinds of thing, when the owner's own sentence is that they are the *same* thing at
   different prices. The screen already handles this correctly today: self-coaching is a row *below*
   the market, always available, never hidden behind affordability.
2. **It hides the only comparison the screen exists to make.** A parent on the Self-coaching tab
   cannot see what hiring would change. The whole screen is a price against a benefit.
3. **The labels answer "who", and the new question is "what".** The thing that needs a home is not
   self-coaching – it is **the training plan**, which is now a real object with three dials and a
   proposal. It belongs to *both* sides, so it cannot live in either.

**The honest split is `Her week` / `Coaches`:**

* **Her week** – the three dials, the grid as the readable consequence, the coach's proposal, the
  room note, and what the week costs.
* **Coaches** – exactly what the screen has today: the budget meter, the tier chips, the style lens,
  the sort control, the tier sections, the rows, and the self-coached row at the bottom.

The Plan tab is the same object whether or not she has a coach. **The only difference is whether it
arrives pre-filled with a proposal and a sentence** – which is this design's entire claim, made
legible in one control.

**On "раскрывающиеся" (expanding).** Push back: an accordion that expands in place makes the page
*longer*, which is the longread he is trying to avoid; a segmented row swaps the content and keeps
the screen one viewport tall. The app also has no accordion anywhere, and inventing one here would
make this screen the odd one out – the same argument `CoachMarketScreen.vue` already makes for
refusing a slider: *"there is no slider anywhere in this app."*

**No new component is needed.** `src/components/ui/SegmentedRow.vue` is the app's one segmented
switcher (`.tab-row` / `.tab-pill`), it carries `aria-pressed` and a `groupLabel`, and two segments
is its comfortable case.

### 6b. The Her-week tab, in enough detail to build from

Top to bottom, inside the app's 16px gutter:

1. **Segmented row** – `Her week` · `Coaches`, `tone="page"`, `groupLabel="Coach screen section"`.
2. **The coach's proposal card**, only when someone is hired. A `Card`, lime `Eyebrow` reading
   `HIS PLAN FOR THE WEEK`, his one sentence in body text, and a two-button row:
   `Accept` (a `PrimaryPill`) and `Adjust` (a bare button that simply leaves the grid editable).
   When `autoPlan` is on the card instead reads as a statement – *"He set her week: five sessions,
   the return, normal."* – with one `Take it back` control. Self-coached: **the card is absent**, not
   a disabled version of itself. Absence is the honest rendering of "nobody is being paid to have a
   view".
3. **Three preset pills** – `.option-row` / `.option-pill`, exactly as ThisWeek and the market's
   training regulator already use: `Light 4/wk` · `Balanced 5/wk` · `Grind 6/wk`. They set the whole
   week at once and stay the fast path for a player who does not want to fiddle.
4. **The week grid** – seven columns, the same `DAY_SHORT` heads, `grid-template-columns: repeat(7, 1fr)`
   as `CalendarScreen.vue` already uses. **This is the emphasis control and the volume control.**
   * tapping a **court cell** cycles its block: serve & return → rally → fitness → match play → rest;
   * tapping a **rest cell** makes it a session (volume up), at the block the week already leans on;
   * a cell the week does not own – away, off, exams, rehab – is inert and says so.
5. **The read-out sentence** under the grid, which `trainingReadout()` already owns, gaining a clause
   for the composition: *"5 sessions – 3 on court, 1 in the gym, 1 set of practice sets."*
6. **Three intensity pills** – `.option-row`: `Light` · `Normal` · `Hard`, with a single `.hint`
   line naming the cost in the register `knockLineFor` uses – *"She will come off court tired. Things
   get picked up on tired legs."* – never a number.
7. **The price line**, reusing the market's own `cm-travel-cost` treatment: *"$X a week at her
   current plan – $Y over Z weeks."* This is the one place the two tabs meet, and it is why the plan
   belongs on this screen and not on ThisWeek.

**⚠ This changes `weekDays.ts`'s standing rule and the change must be made deliberately, not by
drift.** That file's header currently reads: *"NOTHING here is editable... a per-day editor is not a
later refinement of this file, it is the thing this file exists instead of."* That was correct while
the plan was one scalar. It is now the owner's explicit ask. **What survives, and must be written
into the header rather than deleted from it:**

> **The cells are a tally, drawn as a week.** What the engine reads is the *count* per block, never
> a schedule. Which day a session lands on is still a display convention decided by `REST_PRIORITY`
> and `GYM_PRIORITY`, because the sim still has no day resolution and never will. Tapping a cell
> changes what that session **is**, not when it happens.

That keeps the file's argument literally true – no day is placed by the player – while allowing the
composition to be set on the object that displays it. **Per-day *placement* is refused**, and the
reason is that it would be a fake choice: the engine cannot tell Tuesday from Wednesday, so offering
the choice would be the screen asserting a fact the week does not contain.

### 6c. 375px – what fits, what breaks, what collapses

Content width is `375 − 2×16 = 343px` (`--app-pad-x: 16px`). The estimates below are read off the
CSS – `.option-pill` is `padding: 8px 16px` at `font-size: 13px`, `.tab-pill` is `padding: 6px 16px`,
`.option-row` is `display: flex; gap: 8px` **with no wrap** – at roughly 7.2px per character.
**⚠ Every width claim here needs confirming in the browser at 375 before it is built; I could not run
one without touching `src/`.**

**Fits:**
* Segmented row, two segments: ~190px for `Her week` · `Coaches` plus the row's `4px` padding and
  `2px` gap. Comfortable.
* Three intensity pills – `Light` · `Normal` · `Hard`, 5–6 characters each: ~75px each + 16px of gaps
  ≈ **250px**. Comfortable.
* The grid: 343 / 7 ≈ **49px per column**, above the 44px tap target with a hair to spare.

**Already at the edge, and worth fixing while we are here:** the market's existing preset labels come
from `planLabel()` – `Light 4/wk` · `Balanced 5/wk` · `Grind 6/wk`. At 13px those are roughly
106 + 127 + 106 = 339px of pill plus 16px of gaps ≈ **355px against 343 available**, i.e. the row that
ships today is at or slightly past the limit on the narrowest supported phone. **The plan tab should
carry the short labels – `Light` · `Balanced` · `Grind`, ≈ 235px – and move the session count into
the read-out sentence under the grid**, which is where every other count in this app already lives.
(Whether the market tab's own row should be shortened to match is a separate, one-line fix and not
this spec's to make.)

**Breaks outright, and this is the load-bearing 375 finding:** a four-pill `.option-row` for emphasis
does **not** fit at any labelling that names the blocks – `Serve & return` alone is ~130px, and four
pills plus 24px of gaps clears 400px against 343. `.option-row` does not wrap. This is not
speculation; the same screen already recorded exactly this failure mode: *"at 375px it truncated to
'Group ses…' and pushed the uplift off the row entirely, which is the one number the owner asked
for."*

**So the collapse is the design:** emphasis has no pill row at any width. It lives on the grid, which
is 49px per cell at 375 and has room for a mark. That is why the grid is the control rather than a
read-out – not elegance, arithmetic.

**What else collapses at 375:**
* The block **name** never appears inside a cell. A 49px cell carries a mark and nothing else; the
  names live in the read-out sentence under the grid, which is already the app's idiom for exactly
  this (`trainingReadout` is *"the legend – rather than a row of glyphs and their names"*).
* The proposal card's `Accept` / `Adjust` stack vertically below 400px rather than sitting side by
  side; the confirm dialog's own note records that sentence-length copy is where 375 bites.
* The price line wraps to two lines and must not be `white-space: nowrap`.

### 6d. ⚠ Art gap – named, not filled

**The four block marks do not exist and I have not made them.** `DayKind` today is
`court | gym | rest | match | away | off | school | rehab`; the design needs distinguishable marks
for *serve & return*, *rally*, *fitness* and *match play* at ~20px inside a 49px cell, in the
existing dark-panel palette with lime as the only accent. `docs/art-placeholders.md` is where the gap
belongs. Until it is filled the grid can ship with the existing court/gym marks plus a one-letter
overlay, which is a placeholder and should be labelled one.

---

## 7. What survives of `what-a-coach-is-for.md`, and what is superseded

That file is canonical for `area: economy/progression` and **must not be edited here** – another wave
will. This section is the statement of what the owner's ruling did to it.

**Survives, unchanged:**
* **§1's measurement.** The fade is real, it is headroom-driven, and it was measured honestly.
* **§3's three refusals, all of them.** No inflated multiplier; no second currency, coaching minigame
  or skill tree; no coach who is always right. This design breaks none of them – emphasis
  redistributes an existing rate, the proposal is fogged, and nothing new is bolted beside the tuned
  systems.
* **The rule that `growWeek` takes a share of remaining headroom and must not be propped up.** This
  design *depends* on it: the asymptote is the cost function for a mis-aimed week.
* **Pillar 1 (scheduling)** – shipped, working, untouched. **Pillar 4 (the person)** – untouched.

**Superseded by the owner's ruling of 09.08:**

* **The central framing – "the coach's job changes as she grows, and that is the design".** Overruled.
  He is not a role that migrates across a decade until it finds work; he does a job that exists in
  week one, and the job is the training plan. The four pillars survive as a description of *what he
  has opinions about*, not of *when he becomes useful*.
* **§1's implied diagnosis.** The spec measured the *slope* of his value and never asked whether the
  *level* was positive. Round 15 answered that: at both backgrounds it is negative. Different defect,
  different fix.
* **§4's ordering of what is open.** Pillars 2–4 were the roadmap. The ruling puts the training plan
  first and makes load (2) and the opponent (3) *consequences* of it rather than separate builds.
* **Pillar 3 as "a small edge in that match".** Superseded by §3(d) above, which routes the opponent
  through `testedFraction` and the emphasis dial instead of a match-time modifier – no new mechanic,
  and it answers the travel question in the same breath.

---

## 8. The ship rule – acceptance criteria, authored before anything is built

Invariant 4: *tuning is measured, not guessed; a balance change ships with a bench run and a spec
recording predicted vs measured.*

**⚠ The bench needs a third arm before any of this can be judged.** `tools/two-cells.ts` hires at
week 0, never upgrades and **never takes his advice** – round 15 says so explicitly. This design *is*
advice. So the arms must be: **self-coached**, **coached-and-ignoring**, **coached-and-listening**
(accepts the proposal), at both backgrounds. `coach-as-load-manager.md` §9 already built the listener
arm once and it produced that wave's biggest number; the same shape applies.

### What must become true for the coach to stop being a losing trade

| # | criterion | today | ship at |
|---|---|---|---|
| 1 | **Rank.** Coached-listener must finish above self-coached at both backgrounds. Rank is the outcome the rest are proxies for. | −8 (8k), −13 (25k) | **≥ +5 places at both** |
| 2 | **Money.** End funds within one season's retainer of the self-coached arm. He is a cost; the product is the daughter, not the balance. Requiring him to be *richer* would be the wrong target. | −$14,069 / −$16,714 | **≥ −$5,000 at both** |
| 3 | **Entries.** The measured mechanism of the whole defect. If entries do not recover, nothing else matters. | 85 / 101 = 84% | **≥ 93% of the self-coached count** |
| 4 | **The rung ladder is monotone in something nameable.** §9a records that rank does *not* separate the hired rungs and that this is structural. If emphasis is real, **aim** is what should separate them: measure *the share of the season's growth that landed on the axis with the most headroom*, budget → elite. | not measurable today | **monotone across all four hired rungs** |
| 5 | **Self-coaching is not dominated.** A well-played self-coached arm – a policy that reads the radar and re-aims – must stay close to the middle-coach listener, and must not beat Elite. | n/a | **within 5 ITF places of middle-listener; behind elite-listener** |
| 6 | **RNG.** Every dial swept every week taps an identical MAIN sequence to a no-action run. | law | **capture unchanged at 41550 / `e6b0c709`** |
| 7 | **Schema.** A v45 fixture ticked one week under v46 code produces byte-identical `skills`. | n/a | **exact** |

**Criterion 4 is the one that decides whether the mechanism fired at all**, and it is deliberately
not an outcome metric. `coach-as-load-manager.md` §9a is the cautionary tale: the fog mechanism
produced a beautiful monotone *tap* ladder and moved no outcome, and the outcome ladder had to come
from `physioQuality` instead. If aim is monotone and rank is not, the mechanism works and the
*magnitude* is the knob – which is a tuning conversation, not a redesign.

**Criterion 5 is the one to watch in playtest**, and its failure mode is the thing the owner
explicitly forbade: if a self-coached career falls far behind, the fog is doing too much work and
self-coaching became a punishment. The fix in that case is `COACH_ACCURACY.self`, not a cap on
anybody.

**If criterion 1 fails while 3 and 4 pass**, the honest reading is that the dials work and the price
is wrong – and round 15's question 4 becomes live again: *"either pillars get built so the price buys
something, or the price comes down."* That is a real outcome to report, not a failure to hide.

---

## 9. Three things the owner has to decide, not me

**Q1. Does a hired coach hold the pen, and may he override a plan the parent set?**

Two of his own rulings point in opposite directions. «игрок имеет весь контроль» says the parent's
setting always wins and the coach only ever proposes. `coach-as-load-manager.md` §4(a) – *"the
knob-holder pays in taps"*, the measured 14.2 → 1.8 ladder – says the coach must actually take the
work off you, which means acting without being asked. The three shapes:

* **(a) He proposes, the parent always confirms.** Maximum control; the tap ladder collapses and
  self-coaching loses its only cost.
* **(b) He sets it; the parent may override and the override stands.** The tap ladder survives and
  *"you are buying your attention back"* stays true – but he can re-aim a deliberate emphasis on a
  week the parent was not looking.
* **(c) `autoPlan` is a per-career switch the parent flips.** Honest, and one more control on a
  screen that is trying not to be a longread.

I lean (c) with the switch defaulting **off** on a migrated career and **on** at hire, but this is his
ruling and it changes what the product *is*.

**Q2. Does a coach left at home stop learning her?**

The clean version of the travel answer says a coach who did not travel did not see the week, so his
tenure and evidence should not accrue on it. It makes `coachOnEventWeeks` worth a fare. It is also a
**nerf to every non-travelling coach**, moves shipped fog numbers, and reduces what a retainer he is
already paying buys. A balance change dressed as a fiction needs his word, not mine.

**Q3. Does volume widen past the presets at all – 3 sessions, and 7?**

`trainFactor` clamps at 60/85, so both new rungs must be priced on the `loadFactor` channel and
**neither has a measured value**. A 7-session week is also a week with *no rest day*, which the
rest-day convention has never had to draw and which interacts with `restRecoveryBonus` (0 at 15%
rest) and `knockChance` in ways that need a sweep. Two options:

* **widen** – the dial has a real range, and it costs a bench sweep of `volumeFactor`'s two new
  endpoints before anything ships;
* **hold at 4/5/6** – volume stays exactly today's control, emphasis and intensity carry the whole
  design, and the wave is smaller and safer.

Emphasis is the dial that makes a coach worth money. Volume is the dial that already works. If the
wave has to shrink, this is the thing to cut.

---

## 10. Not in this slice

* **No change to `potential`.** A great coach does not raise her ceiling – he aims at it sooner.
  Letting him touch it would make the fog decorative, which is the one thing that design cannot
  survive (`coach-as-load-manager.md` §6).
* **No new `developmentFactor` values.** If aim works, the multiplier ladder stays exactly where it
  is and the coach's value comes from where the growth landed, not from how much of it there was.
* **No coach-style / emphasis coupling.** A `serve-first` coach preferring serve work is a coherent
  idea and an unmeasured one; `fitFactor` already carries style and doubling it here would be two
  knobs for one fiction.
* **No per-day placement.** §6b: the engine cannot tell Tuesday from Wednesday, and a choice the sim
  cannot read is a screen asserting a fact the week does not contain.
* **No AI emphasis for the cohort.** The rivals do not model load and do not model aim; giving them
  one is a different slice, and `rival-life`'s condition sharing is the precedent for how it would
  have to be done if it ever is.
