---
type: spec
status: draft
area: training/plan
canonical: false
last-reviewed: 2026-08-09
---

# The week is the plan – making the calendar real, and giving the coach a job

**Design proposal. Nothing here is built, and nothing in `src/` was touched to write it.** Revised
09.08 after the owner's corrections; where a number could not be established without prototyping it
is named as open rather than guessed.

---

## 1. What a training week is today: a picture of one number

Open the Calendar screen and you see seven days. Some are court days, one is a gym day, one or three
are rest days, a booked friendly sits on the Saturday. It looks like a plan.

**It is a drawing of a single number.**

`composables/weekDays.ts` computes `sessionsForPlan(plan.train)` – `plan.train` as a percentage of
seven days – and then lays the result out by two fixed priority lists: rest is claimed Sunday, then
Wednesday, then Friday (`REST_PRIORITY`); the gym is claimed Tuesday (`GYM_PRIORITY`). Not one of
those facts reaches the engine. The file's own header says so, and says why:

> *"the engine resolves whole WEEKS and knows nothing of days (there is no day resolution anywhere
> in the sim), so the alternative to a stated convention is not a truer layout, it is no layout."*

So of everything the week shows, the sim reads exactly two fields – `plan.train` and `plan.rest` –
through four channels:

| what the engine actually does with the week | function | today |
|---|---|---|
| how fast she improves | `trainFactor(plan)` (`engine/development.ts`) | 0.72 / 1.056 / 1.28 at Light / Balanced / Grind |
| what the week costs | `coachHoursForPlan(plan)` (`engine/coach.ts`) | 4 / 5 / 6 billed hours |
| how likely she is to pick something up | `knockChance(condition, plan)` (`engine/knock.ts`) | ~2% / ~10% / ~25% |
| how much she recovers | `restRecoveryBonus(plan.rest)` (`world/medical.ts`) | +2 / +1 / 0 |

And `growWeek` – the only place skills change – grows **all five skills at the same rate off one
shared luck draw**. The gym day is furniture: nothing in the sim knows she went to a gym.

**That is the whole problem in one sentence.** The owner:

> «Самокоуч, по сути, ничем в данный момент не отличается от коуча, кроме того, что ничего не стоит –
> вся программа тренировок как была автоматической, так и осталась.»

He is right, and it is worse than "the coach has no job": **nobody has a job.** There is no week to
plan well or badly, so there is nothing for a coach to be better at, and no reason for the price.
`docs/specs/round15-triage.md` measured the bill for that – 50 careers a cell, four seasons:

| | self-coached | middle coach | what hiring buys |
|---|---|---|---|
| **8k / working** | $19,522 · ITF #48 · 101 entries | $5,453 · ITF #56 · 85 entries | **−$14,069, −8 places** |
| **25k / middle** | $22,712 · ITF #44 · 101 entries | $5,998 · ITF #57 · 97 entries | **−$16,714, −13 places** |

---

## 2. What changes: the picture becomes the plan

> «у нас есть расписание недели и на каждый день там идут разные тренировки – **это и есть ручки**,
> игрок должен сам спланировать как и когда выглядит неделя... **Может вообще всю неделю из одного и
> того же собрать – его право**»

**The seven days stop being a drawing and become the thing the player sets.** He fills the week: each
day is either a rest day or a session, and each session is of one kind. That arrangement *is* the
plan. There is no slider, no preset dial and no allocator sitting above the grid deciding what the
grid renders – the grid is where the decision is made.

**Five kinds of session, and the day is one of them or it is rest:**

| kind | what it works on | in engine terms |
|---|---|---|
| **General** | everything, a bit | all five skills equally – *exactly today's week* |
| **Serve & return** | the first two shots of the point | `serve`, `ret` |
| **Rally** | ball-striking off the ground | `groundstrokes` |
| **Fitness** | the gym day, made real | `stamina` |
| **Match play** | sets, sparring, playing under pressure | `composure` |

**General exists for two reasons and both matter.** It is what every career has been training since
the game shipped, so it is what a loaded save reads back as, exactly (§8). And it is the honest
option for a parent who does not want to choose: never sharp, never wrong.

**Volume and emphasis are no longer controls. They are what the filled week adds up to.** How many
sessions he placed is the volume; what kinds he placed is the emphasis. He never sets either
directly.

**Volume stays 4, 5 or 6 sessions** (owner: «зачем? ну нас всё ок в этом плане я считаю»), so between
one and three days are rest. The three presets survive as a fast path – tapping *Balanced* lays out
five sessions in the standard shape – but they are now a shortcut for an arrangement, not the model.

**Intensity is dropped, and that is a reversal of my own earlier draft.** I proposed light / normal /
hard as a third setting. Under a grid where the player places every session it is a second way of
saying "a harder week", which the number of sessions and their arrangement already say. Adding it
would put a widget back above the grid, which is the exact thing this revision removes. It is out.

---

## 3. The three questions the week asks, and what each one costs

Every choice on the grid has a price, and none of them is a penalty the game invents. The standing
ruling «мы ни за что не наказываем» holds throughout: the tour punishes, we never do.

### How many sessions – that costs **money**

`coachHoursForPlan` counts sessions, and the whole weekly bill is `rate × hours × corridor × jitter`,
split into the coach line and the facility line (`weeklyBillSplit`). A sixth session is a sixth hour
billed at his rate. **This is the dial that pays for the coach, and it is the only one that costs
cash** – the bill does not care what she did, only how much of him she had, which is also what a real
coach's invoice says.

It also costs recovery (fewer rest days is a smaller `restRecoveryBonus`) and availability
(`knockChance` rises with the session count).

### How the week is arranged – that costs **her body**

Five sessions run Monday to Friday are harder than five with Wednesday off, and the game already
believes this: `REST_PRIORITY`'s own note says the spread exists so *"no two rest days are ever
adjacent... the shape a junior's week actually has."* Today that belief is drawn and never charged.

**One quantity, derived from the arrangement: the longest unbroken run of training days.** It feeds
`knockChance` as a term that is **exactly zero at every preset arrangement and on every migrated
career**, and positive only when the player stacks his sessions tighter than the standard shape. Five
sessions laid out Mon–Fri run 5 against the standard 3, so he pays two steps of a slope.

⚠ **This is the one place the design adds arithmetic rather than re-routing it, and it is the owner's
call whether to have it – §11 Q1.** Without it, "когда" is decoration: the engine cannot tell Tuesday
from Wednesday, so an arrangement with no consequence would be the screen inviting a choice the sim
cannot read. With it, the slope needs a bench number before anything ships.

### What kinds of session – that costs **her game**

⚠ **The week's total improvement is fixed by its size; the kinds only decide where it lands.** A week
of six serve sessions does not improve her more than a week of six mixed ones – it improves her
differently. If kinds added rate rather than redirecting it, the choice would be a button marked "yes
please", and `knock.ts`'s standing rule is that a branch which always ends better is not a decision.

The cost of pointing the week at her serve is that her legs, her hands and her head are getting
nothing that week. **And there is a second cost the player cannot see, which is the whole point:**
`growWeek` takes a share of the *remaining* distance to her ceiling, and `engine/radar.ts` keeps that
ceiling behind a permanent fog (`CEILING_FLOOR_HALF = 4`, which never narrows further). Aim a season
at a wing that is nearly full and the week converts into almost nothing – not because anything
punished it, but because `max(0, potential[k] − skills[k])` is small.

**This is the first decision in the game whose currency is being right**, and it is the decision the
coach is sold on.

**In one line: how much of him you buy is money; how you arrange it is her body; what you point it at
is her game.**

---

## 4. A whole week of one thing – what it actually does to her

The owner asked for this to be legal and it is. Here is precisely what it produces, channel by
channel. Take six Serve & return sessions and one rest day.

| channel | what happens | changed? |
|---|---|---|
| the bill | six billed hours at his rate. Identical to six mixed sessions. | **no** |
| `trainFactor` | 1.28, the Grind rate. Identical. | **no** |
| `restRecoveryBonus` | one rest day → 0. Identical to any other 6-session week. | **no** |
| `knockChance` | the 6-session term, plus the run term if he stacked them tighter than the standard shape (at six sessions he cannot – there is one rest day and the standard shape already has the longest run) | **no** |
| `growWeek` | serve and return take the entire week's improvement; groundstrokes, stamina and composure take none | **yes, and this is the feature** |

**Nothing breaks.** No channel needs a special case, no clamp is hit, no arithmetic goes out of range.

**What it does to her over a season is the interesting part, and it is self-limiting without a single
rule against it:**

1. Serve and return sprint toward their ceilings – and because growth is a share of remaining
   headroom, they **arrive sooner, not higher**. That is `coach-as-load-manager.md` §1's measured
   finding used deliberately: *"a faster rate mostly means arriving sooner rather than arriving
   higher."*
2. Once they are close to those ceilings the week converts into nearly nothing, while the cohort keeps
   drifting upward (`driftCohort`, four draws a player, every tick). **The exploit eats itself.**
3. Meanwhile the tour collects. `fatigueTerm` (`engine/match/point.ts`) scales the in-match fatigue
   penalty by `(1 − stamina/100)`, so a stamina-starved build fades in exactly the matches that decide
   a run. `groundstrokes` enters `basePServe` as a *difference* between the two players, so she is
   outhit from the back of the court in every rally she does not end. `composure` sets the break-point
   penalty (`point.ts`, the Klaassen–Magnus term), so she is worst on the points that swing a set.
4. And if a knock arrives, it lands where she worked. `drawKnock`'s part draw already walks a weighted
   table (`KNOCK_PARTS`); **weighting that table by what the week actually contained costs no new
   draw** – the same single uniform, mapped through a different table. Six weeks of serving develops a
   shoulder, and `pushedParts`' accumulating thread then makes that shoulder her career's story rather
   than a series of unrelated Fridays.

So a monomaniac week is legal, cheap, and slowly ruinous **entirely through systems that are already
tuned**. Nothing was added to punish it.

⚠ **One knob is open: does an untargeted skill get literally zero, or a floor?** Physiologically a
serve session still involves moving and missing, so a small floor (a quarter rate, say) is the truer
fiction and softens the cliff. **Balance does not depend on it** – the asymptote in (1)–(2) does the
work either way – so it is a fiction choice with a bench number attached, not a safety measure.

---

## 5. What the coach does: he comes and changes something

> «иногда может приходить и менять что-то»

**The pen stays with the player. There is no auto-plan and no switch.** The week the parent left is
the week that runs. What a hired coach does is turn up occasionally, point at one thing, and ask.

### The shape

**One intervention, one change, one dialog, and both costs visible** – the shape `engine/knock.ts`
already proved and the register `buildKnockPrompt` already writes in. He names the day and the
change: *"Give me Thursday for her return."* The player accepts or refuses. On accept the cell flips
and is marked as his. On refuse, nothing happens and he does not ask the same thing again next week.

**Self-coached: no card, ever.** Not a greyed-out one – absent. Nobody is being paid to have a view.
That is also the fix for R15 item 18 (*"`coachSays(e)` reads `e.preview` alone and never asks whether
anybody is hired, so a family paying nothing gets professional draw analysis for free"*), which round
15 called *"the same finding as the headline from the other side"*.

### ⚠ His rung decides how often he is RIGHT, not how often he speaks

This is a deliberate reversal of the load wave's mechanism, and it is worth stating plainly because
that wave shipped the opposite. `coach-as-load-manager.md` §9 made the rung control the **interruption
rate** (14.2 taps a career self-coached, 1.8 at Elite) and §9a then recorded that this produced a
lovely monotone ladder and *moved no outcome at all*.

So here: **every rung speaks at the same rate.** A coach is a coach; he says something when he sees
something. What the rung changes is whether he is pointing at the right thing – because his proposal
is a pure function of `axisReadings`, his own **fogged** read of her. The numbers already exist and
are already measured: `COACH_EYE` runs 0.15 (self) → 0.55 (elite), `COACH_ACCURACY` 0.72 → 1.0, and a
family that never hires anybody ends a career with a permanent ~3.4-point haze – *"they watched every
match and still could not quite tell you what they were looking at."*

A Budget coach points at the wing he *thinks* has the most room. An Elite coach is usually pointing at
the one that really does. Same rule, different clarity. **The hidden oracle stays rejected** – he
never knows the future, only what he can see.

**And this is why a coach beats a self-coach without self-coaching being a punishment.** The week is
aimed at a target nobody can see. What money buys is the aim. The parent has the same grid, the same
kinds, the same ceiling and no cap of any sort – he is simply the one deciding in the dark, and he can
fix that himself by playing her more, because `EVIDENCE_PER_UNIT` saturates on matches and not on
money. A parent who reads the radar carefully and plays her often can beat a paid coach; that is the
reward for attention and the owner's own refusal of a cap («Может быть игрок будет хорош и знает, что
и как делать?»).

### When he speaks – all from state he can see, no foresight, no draw

| trigger | what he asks for | existing state it reads |
|---|---|---|
| she is under the tier's condition floor | a session becomes rest | `ECONOMY.availability.minConditionToEnter` |
| a knock on a joint her week is loaded toward | that kind moves off the week | `world.knock`, `pushedParts` |
| an axis his read puts far from its ceiling is getting no sessions | one day for that kind | `axisReadings` |
| a tournament inside **his own horizon** | a hard kind becomes match play the week before | `COACH_HORIZON_WEEKS`, already per-rung |

That last row is a free win: the horizon constant already encodes *"a budget coach notices the
obvious, an elite one sees the block ahead"*, and it is already shipped.

**Rate limiting** is the knock's, for the knock's reason: a cooldown of a few weeks after he speaks,
identical at every rung, so he is frequent enough to matter and never a treadmill.

**Zero draws.** He is triggered by state and never by a die – the same discipline `coachEntryLine`
already keeps: *"picked by HOW tired she is rather than by luck – a draw here would make the same coach
say different things about the same Tuesday."*

---

## 6. What travelling with him buys, and what he does perfectly well from home

The old draft answered this wrongly and the owner caught it:

> «у нас век технологий, есть зум и прочее»

A coach who stayed home is not blind. He watches the recordings, he calls, he sees her condition. So
**"he learns less about her when he does not travel" is dead**, and so is my previous answer – aiming
the competition week's learning by which wing the opponent tested. That is a good mechanism and it is
**not about presence**: it is precisely the thing a coach does on Monday with a video file.

The real question, in his words:

> «просто надо будет для про карьеры и реальным поездкам с тренером понять что он дает своим живым
> присутствием, мы видим, что на поздних годах +0.2-0.4% или даже меньше, отсюда вопрос "он нам вообще
> зачем?"»

### The honest split

**What he does from home, and travel adds nothing to:**

* **Reads her.** Video, calls, the numbers. `axisReadings` accrues whether or not he flew.
* **The plan interventions of §5.** All of them.
* **Load calls.** He can see her condition and her knock history from anywhere.
* **Scouting the opponent, and aiming what a competition week teaches.** `growWeek`'s `matchBonus`
  (up to +54% on a week's rate) is uniform across five skills today, while `radar.ts` already computes
  `testedFraction` per axis from the opponent's own build. Pointing the competition week's learning at
  the wing the matches actually examined is a real improvement and it **stays in the design** – as a
  thing a hired coach does, at any rung, from anywhere. It is not a fare.

**What he can only do there – and there is one, which is better than a list:**

### On-court coaching. Presence buys composure, and the sport's own rules are why.

On-court coaching has been permitted on the women's tour since 2022. **A video call cannot deliver it
because the rules of tennis forbid remote coaching during a match.** That is the cleanest possible
answer to «есть зум»: this is not a thing technology has caught up with, it is a thing the sport
allows *only* if he is in the box.

**It lands on a channel that already exists.** `applySurfaceStyle` (`engine/match/style.ts`) already
takes her `MatchPlayer` and returns an adjusted one – *"pure arithmetic, ZERO RNG, no world state"* –
because the surface changes how she plays. A coach in the box is the same shape of adjustment on the
same object, applied at the same point, and it touches **composure**, which is the attribute the point
model spends on exactly the moments a coaching word is for:

```
// point.ts, the Klaassen–Magnus big-point term
p -= (1 - server.composure / 100) * BIG_POINT_MAX_PENALTY
```

**Break points.** That is where composure is cashed, and it is where a changeover conversation
matters. So a coach at the event moves the term that decides tight sets, by an amount set by his rung.

**Why this answers «он нам вообще зачем?» at +0.2–0.4%:** the growth multiplier fades because it is a
share of remaining headroom, and nothing can save it. **A composure adjustment inside a match does not
fade at all** – it does not read her headroom, it reads the scoreline. So his value stops being about
making her better, which is over, and becomes about the match in front of her, which is what tour
coaching actually is.

**Against the owner's three tests:**

* **(a) impossible over video** – by the rules of the sport, not by our assumption. ✓
* **(b) no new random draw** – `applySurfaceStyle` is deterministic arithmetic on the match player,
  and this is a second multiplier in the same place. Zero draws on any stream. ✓
* **(c) worth a fare against prize money** – it is worth exactly what a tight match is worth, which is
  nothing on the junior ladder (where the row is correctly locked) and real money on the pro tour.
  **This is why the toggle unlocks with `act2-pro-tour`, and it is the reason the owner locked it.**
  The bench criterion is in §10.

### Candidates I evaluated and am not proposing

Named so nobody thinks they were missed:

* **A hitting partner and a warm-up at her level.** Genuinely presence-only and genuinely real – and
  there is **no existing quantity for match-day readiness** to land it on. It would need a new
  match-day modifier, which breaks the no-new-mechanic rule for a second time in one wave. If the
  composure term is not enough, this is the next place to look.
* **Decisions between matches about a body that has just played three sets.** `tournamentRunStrain`
  and `runFatigueExtra` model the grind, but retiring mid-run is not a choice the game offers anyone,
  so there is nothing for him to decide. Needs a mechanic first.
* **The person beside her when it goes wrong.** The truest of them emotionally, and mechanically it is
  the *same currency* as on-court coaching – composure. It is the fiction that dresses the term, not a
  second term.

---

## 7. The screen

### 7a. The two tabs: `Her week` / `Coaches` stands

Unchanged from the previous draft and unobjected to. The Coach Market screen is the right home and
`src/components/ui/SegmentedRow.vue` (`.tab-row` / `.tab-pill`) is the app's one segmented switcher,
so no component is invented.

**Self-coaching / Coaches is still the wrong axis.** `COACH_TIERS` is literally
`['self','budget','middle','high','elite']` and `coachFactor`, `COACH_EYE`, `COACH_ACCURACY` and
`physioQuality` all have a `self` row – it is one ladder with self on the bottom rung, which is the
owner's own «ничем не отличается, кроме того, что ничего не стоит». Two tabs would assert they are
different kinds of thing and would hide the one comparison the screen exists to make. Self-coaching
stays what it is today: a row *below* the market, always available, never behind affordability.

**On "раскрывающиеся":** an accordion expands in place and makes the page longer, which is the
longread he is avoiding; a segmented row swaps the content and keeps the screen one viewport tall.
The app has no accordion anywhere.

**What the tab now contains is a grid he fills, not a stack of dials.**

### 7b. The `Her week` tab, top to bottom

1. **The segmented row** – `Her week` · `Coaches`.
2. **His card, only when he is asking.** A `Card` with a lime `Eyebrow`, one sentence naming the day
   and the kind, and two controls: `Give him Thursday` / `Not this week`. Absent the rest of the time,
   and absent entirely when self-coached.
3. **Three preset pills** – `Light` · `Balanced` · `Grind`, `.option-row` / `.option-pill`. They lay
   out the volume and the standard arrangement; the kinds on surviving session days are kept, and a
   newly added day takes the week's most common kind.
4. **The palette** – six swatches: General, Serve & return, Rally, Fitness, Match play, Rest. Pick
   one, then paint it onto days. The chosen swatch names itself in a `.hint` line below, so no swatch
   carries text.
5. **The week** – seven cells, Monday first, `DAY_SHORT` heads, the same
   `grid-template-columns: repeat(7, 1fr)` `CalendarScreen.vue` already uses. Tapping a cell paints it
   with the chosen kind. **This is the whole control.** A week the player does not own – away, off,
   exams, rehab – draws as it does today and is inert.
6. **The read-out sentence**, which `trainingReadout()` already owns, gaining the composition:
   *"5 sessions – three on court, one in the gym, one set of practice sets. Two days off."* This is the
   legend, in the parent's language, exactly as that function's own note argues.
7. **The price line**, reusing the market's `cm-travel-cost` treatment: what the week costs and what
   the season costs. It is the one place the two tabs meet, and the reason the plan lives on this
   screen and not on ThisWeek.

**The rest swatch greys out at four sessions.** Volume is 4–6, so the floor has to be visible rather
than enforced by a refusal – a greyed swatch says "you are at her minimum" before he taps, which is
the same courtesy the market's over-budget row already extends.

### 7c. 375px – the numbers, and what does not fit

Content width is `375 − 2×16 = 343px` (`--app-pad-x: 16px`). ⚠ **Every width below is read off the CSS
at ~7.2px per character; all of it needs confirming in a browser at 375 before it is built, which I
could not do without touching `src/`.**

**The grid is the binding constraint and it is tighter than my previous draft said.** Seven cells with
a 4px gap: `(343 − 6×4) / 7 = 45.6px`. With a 6px gap it falls to **43.9px, below the 44px tap
target**. So:

> **The cell gap may not exceed 4px, and the cells are ~45px.** That is the layout's hard constraint
> and everything else bends around it.

**Fits at 45px cells:**
* The day heads: `MON` at 10px ≈ 21px. ✓
* **One mark per cell and nothing else.** ✓
* The segmented row, two segments: ~190px. ✓
* The palette, six swatches at ~48px with 4px gaps: `6×48 + 5×4 = 308px`. ✓
* Three preset pills at short labels (`Light` / `Balanced` / `Grind`): ~235px. ✓

**Does not fit, stated plainly:**
* **A text label inside a cell.** 45px carries a mark. The kinds are named in the read-out sentence
  and in the palette's `.hint` line, never in the grid.
* **Text on the palette swatches.** `Serve & return` alone is ~130px; six labelled chips clear 600px
  against 343 and `.option-row` does not wrap. Marks only.
* **The market's existing preset labels.** `Light 4/wk · Balanced 5/wk · Grind 6/wk` computes to
  ≈ 355px against 343 – the row that ships today is already at or past the limit on the narrowest
  supported phone. The plan tab uses the short labels and puts the count in the read-out. (Whether the
  market tab's own row gets the same treatment is a one-line fix and not this spec's to make.)
* **A per-cell intensity or a second per-cell property of any sort.** Kind × anything is a cell with
  more than one state to show at 45px, and it is the "seven dropdowns" `weekDays.ts` exists instead
  of. This is an independent reason intensity is dropped.

**What I would collapse, in order, if the browser disagrees with the arithmetic:**
1. The palette drops to five swatches by making **Rest a long-press on a cell** rather than a paint
   colour. Saves ~52px.
2. The preset pills move into the palette row's overflow or go away entirely – they are a convenience,
   and the grid can do everything they do.
3. **Last resort: the week wraps to two rows (4 + 3).** Ugly, and it breaks the read of a week as a
   line – but the 44px tap target does not bend, so a two-row week beats a 40px cell.

### 7d. ⚠ Art gap – named, not filled

**Five session marks and a rest mark do not exist and I have not made them.** They are needed at ~20px
inside a 45px cell and at ~24px on a palette swatch, in the existing dark-panel palette with lime as
the only accent, and they must be distinguishable **without text at 45px** – which is a harder brief
than it sounds and is the single biggest execution risk in this design. `DayKind` today is
`court | gym | rest | match | away | off | school | rehab`; the new kinds need marks of their own.
Belongs in `docs/art-placeholders.md`. Until then the grid can ship with the existing court/gym marks
plus a one-letter overlay, clearly labelled a placeholder.

### 7e. ⚠ This changes `weekDays.ts`'s standing rule, deliberately

That file's header currently says: *"NOTHING here is editable... a per-day editor is not a later
refinement of this file, it is the thing this file exists instead of."* That was correct while the
plan was one scalar. The owner has now ruled otherwise, and the header must be rewritten rather than
quietly contradicted. **What survives, and should be written in:**

> The seven cells are the plan. What the engine reads from them is how many sessions there are, what
> kinds they are, and how long the longest run of training days is – never a time of day and never a
> named weekday. `REST_PRIORITY` and `GYM_PRIORITY` stop being the model and become the **preset
> expander**: the arrangement a preset lays down, and the arrangement a migrated career reads back as.

`weekGrid.ts`'s rule is untouched: the sim still has no hours, and *"Времени суток у движка нет и не
будет"* stands.

---

## 8. The schema

`SAVE_SCHEMA_VERSION` is **45**. Three-part move under CLAUDE.md invariant 3: bump to 46, append-only
migration, golden fixture. **I specify it; I do not write it.**

```ts
// shared/protocol.ts
export type SessionKind = 'general' | 'serve' | 'rally' | 'fitness' | 'matchplay'
export type DaySlot = SessionKind | 'rest'

export interface WeekPlan {
  /** LEGACY AND KEPT, now a three-valued projection of the week below: 4 sessions -> 60/40,
   *  5 -> 75/25, 6 -> 85/15. Written by the one command that writes `week`, never independently. */
  train: number
  rest: number
  /** v46 – Monday..Sunday. THE PLAN. Between 4 and 6 slots are sessions. */
  week: DaySlot[]
}
```

**Why `train`/`rest` are kept rather than deleted.** They are read by four engine systems and two
screens, and the RNG-invariance test pokes `train: 100` on purpose. Keeping them as a projection means
every existing reader is byte-identical and the migration is a pure default. The drift risk is real
and the answer is that `setPlan` is the only writer of either – the same discipline `weeklyBillSplit`
uses to guarantee `coach + facility === total`.

### The migration, v45 → v46

Build the array out of the display conventions the calendar has been drawing all along:

```
sessions   = sessionsForPlan(save.plan.train)      // 4 / 5 / 6, unchanged
sessionDays(sessions)                              // which indices are sessions – unchanged
every session day  -> 'general'
every other day    -> 'rest'
```

**A career saved before v46 reads back as exactly the career it was**: same session count, same rate,
same bill, same knock chance, same recovery, and – because `general` weights all five skills equally –
**byte-identical growth on the week it is loaded**.

⚠ **The drawn gym day migrates to `general`, not to `fitness`, and that is deliberate.** The gym day
has never been simulated – `growWeek` has never heard of it – so turning it into a real fitness
session on load would be the migration changing his game. The visible consequence is honest and small:
a loaded career opens with no gym day marked, and the screen's first invitation is to decide whether
one of those days is one. The alternative (migrate it to `fitness` and accept a measured one-time
shift in every career's stamina) is defensible but costs a bench run to justify, and byte-identical is
the safer read.

**Fixture** `tests/fixtures/saves/v46.json`, and the test that actually matters: **a v45 fixture loaded
and ticked one week under v46 code must produce byte-identical `skills` to the same fixture ticked
under v45 code.** A green `goldenSaves.test.ts` proves the shape loads; it does not prove the
arithmetic held.

---

## 9. RNG

Invariant 2 is permanent law: a no-action run and an action-laden run under the same code must tap
identical MAIN sequences. The week is player input, so this section has to be airtight.

1. **No choice on the grid adds, removes or reorders a draw on any stream.** Everything is either a
   post-draw multiply or a redistribution – the pattern `knockTauFactor`, `physioRiskFactor` and the
   vacation buff already document, and the reason each shipped without moving a draw.
2. **`growWeek` keeps exactly one draw off `seed:growth:<week>`, in the same position.** The luck value
   is drawn *before* the per-skill loop and then multiplied into each skill's gain. **The kinds change
   what is done with the number, never which number is drawn** – so a career's week 30 draws the same
   luck under every possible arrangement of every possible week.
3. **The knock's three draws stay unconditional and in fixed order.** `drawKnock` takes arrival, repeat
   and part off `seed:knock:<week>` *before* comparing against `knockChance`. The run term moves the
   **threshold**, not the draw. And weighting `KNOCK_PARTS` by what the week contained changes what
   the existing `partRoll` maps to, not what `partRoll` is – **the same single uniform, a different
   table.** Zero draws added.
4. **The coach's intervention draws nothing.** It is triggered by observable state and rate-limited by
   a cooldown; `axisReadings` runs at snapshot time on `seed:read:<axis>` keyed with **no week in it**,
   so his read is fixed per career per axis and the card cannot reword itself under a player who leaves
   it open.
5. **On-court coaching draws nothing.** `applySurfaceStyle` is deterministic arithmetic on a
   `MatchPlayer`; a second multiplier at the same point is the same.
6. **MAIN is untouched by construction.** A tick's whole MAIN budget is base costs plus four draws per
   cohort player, and nothing here is either. The frozen capture (41550 draws / `e6b0c709`, pinned in
   `tests/condition.test.ts`) should be **unchanged** – restating that it is a documented measurement
   and not a change-gate since v35, so a future wave that legitimately adds a MAIN draw updates it.
   This wave should not need to.
7. **The test to write:** repaint the whole week to a different arrangement every week across a career
   and assert the MAIN sequence is identical to a no-action run. The existing invariance test that
   pokes `train: 100` is the shape; it needs `week` added to the sweep.

---

## 10. The ship rule – acceptance criteria, authored before anything is built

Invariant 4: tuning is measured, not guessed. **The bench needs a third arm before any of this can be
judged.** `tools/two-cells.ts` hires at week 0 and **never takes his advice** – round 15 says so – and
this design *is* advice. Arms: **self-coached**, **coached-and-ignoring**, **coached-and-listening**
(accepts his interventions), at both backgrounds. The load wave built a listener arm once and it
produced that wave's biggest number.

| # | criterion | today | ship at |
|---|---|---|---|
| 1 | **Rank.** Coached-listener finishes above self-coached at both backgrounds. | −8 (8k), −13 (25k) | **≥ +5 places at both** |
| 2 | **Money.** End funds within one season's retainer of self-coached. He is a cost; the product is the daughter, not the balance. | −$14,069 / −$16,714 | **≥ −$5,000 at both** |
| 3 | **Entries.** The measured mechanism of the whole defect. If entries do not recover, nothing else matters. | 85 / 101 = 84% | **≥ 93% of the self-coached count** |
| 4 | **His hit rate is a ladder.** Of the interventions the listener arm accepted, the share that pointed at the skill that really did have the most headroom, budget → elite. **This is the thing being sold, measured directly.** | not measurable today | **monotone across all four hired rungs** |
| 5 | **Self-coaching is not dominated.** A self-coached arm that reads the radar and re-aims stays close to the middle-coach listener and does not beat Elite. | n/a | **within 5 ITF places of middle-listener; behind elite-listener** |
| 6 | **Presence pays its fare.** On the pro-tour arm only: prize money gained with him in the box, against the second fare. | n/a | **positive over a season, at Middle and above** |
| 7 | **RNG.** Every week repainted every week taps an identical MAIN sequence to a no-action run. | law | **capture unchanged at 41550 / `e6b0c709`** |
| 8 | **Schema.** A v45 fixture ticked one week under v46 code produces byte-identical `skills`. | n/a | **exact** |

**Criterion 4 replaces the previous draft's "aim" metric.** Under the old shape emphasis was the
coach's; under this one it is the player's, and what the rung buys is whether *his interventions* were
right. Measuring his hit rate directly is both closer to the product and easier to read than an
outcome proxy.

**Criterion 4 is also the one that says whether the mechanism fired at all**, and it is deliberately
not an outcome number. `coach-as-load-manager.md` §9a is the cautionary tale: the fog produced a
beautiful monotone *tap* ladder and moved no outcome, and the outcome ladder had to come from
`physioQuality` instead. **If hit rate is monotone and rank is not, the mechanism works and the
magnitude is the knob** – a tuning conversation, not a redesign.

**Criterion 5 is the one to watch in playtest**, and its failure mode is what the owner explicitly
forbade: a self-coached career far behind means the fog is doing too much work and self-coaching became
a punishment. The fix in that case is `COACH_ACCURACY.self`, never a cap on anybody.

---

## 11. Three questions for the owner

**Q1. Does WHEN matter, or is the arrangement presentation?**

He asked the player to plan «как и когда». The engine has no days, so *when* can only bite through
one derived quantity – the longest run of training days – feeding `knockChance`, zero at every preset
and every migrated career, positive only when he stacks. Two answers:

* **it bites** – "когда" is a real decision, and the slope needs a bench number before shipping;
* **it does not** – the arrangement is how the week *reads* and nothing more, which is honest, costs
  nothing, and means a player who lays five sessions Mon–Fri has made a picture rather than a choice.

Either is defensible. It is the only place this design adds arithmetic to a tuned system, so it should
be his.

**Q2. May the coach reach inside a match?**

Presence buying composure means the match's own player object gains a term it has never had from a
coach. `what-a-coach-is-for.md`'s pillar 3 imagined exactly this ("a small edge in that match") and it
was never built, so the line has never been crossed. It is the only answer I found that a video call
genuinely cannot deliver, and it is the only one that does not fade with her headroom – which is the
whole of «он нам вообще зачем?». But it is a line, it lands in the most carefully-tuned part of the
game, and crossing it should be a decision rather than a consequence.

**Q3. Does his intervention stop the week, or wait on the screen?**

The knock **stops the career** – `advanceWeeks` refuses to move while a decision is open – and that is
what makes it a decision rather than a notification. If the coach's intervention does the same, then
hiring him *costs taps*, which inverts the load wave's whole sentence («you are buying your attention
back»): the self-coached parent is asked nothing and the paying one is interrupted. If it waits
quietly on the Her-week tab, it is easy to never see, and a coach nobody hears is a coach nobody is
buying.

My instinct is that it waits on the screen and Home carries a cue (`composables/inboxCue.ts` is the
existing idiom), so he is unmissable without being a stop. But this decides what the purchase *feels*
like and it is his call.

---

## 12. What survives of `what-a-coach-is-for.md`, and what is superseded

That file is canonical for `area: economy/progression` and **must not be edited here** – another wave
will.

**Survives, unchanged:**
* **§1's measurement.** The fade is real, headroom-driven, and honestly measured.
* **§3's three refusals, all of them.** No inflated multiplier; no second currency, coaching minigame
  or skill tree; no coach who is always right. This design breaks none: the kinds redistribute an
  existing rate, the intervention is fogged, and nothing new is bolted beside the tuned systems.
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
* **§4's ordering of what is open.** The training plan comes first, and load and the opponent become
  consequences of it rather than separate builds.
* **Pillar 3 as "a small edge in that match".** Split in two by §6 above: opponent preparation is a
  **home** coach's job, at any rung; the in-match edge is **presence**, and it is the only thing travel
  buys.

---

## 13. Not in this slice

* **No change to `potential`.** A great coach does not raise her ceiling – he aims at it sooner.
  Letting him touch it would make the fog decorative, which that design cannot survive.
* **No new `developmentFactor` values.** If aim works, the multiplier ladder stays exactly where it is
  and the coach's value comes from where the growth landed, not how much of it there was.
* **No intensity setting**, per §2 – and independently per §7c, which has no room for a second per-cell
  property.
* **No volume outside 4–6 sessions**, per the owner.
* **No time of day.** `weekGrid.ts`'s rule is untouched.
* **No coach-style / session-kind coupling.** A `serve-first` coach favouring serve work is coherent
  and unmeasured; `fitFactor` already carries style and doubling it here is two knobs for one fiction.
* **No AI weeks for the cohort.** The rivals model neither load nor aim; giving them either is a
  different slice.
