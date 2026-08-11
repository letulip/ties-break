# The skills radar — a contour that sharpens as she is discovered

The owner, 29.07: «раз уж мы переделываем UI и ввели тренеров и реальное развитие, может быть пока
нам и над твоей "более интересной" задумкой для розы ветров навыков в профиле героини подумать?»

He is right that it is the moment, and this is why: the idea has been parked since round 3 waiting
for two things that did not exist, and both landed this week. `decisions.md` #11 records it as
*"axes without numbers; contour sharpens as coach confidence grows (fog-of-war stats) — radar that
respects 'talent is discovered'"*, and `KidScreen.vue` has carried a `Skills & development – Phase 4`
placeholder ever since.

The engine has been holding a seat for it the whole time. `world.potential` is rolled once from
`seed:potential` and its own comment says **"never shown (decisions.md #11 – the radar…)"**. The
ceiling already exists, is already hidden, and is already earmarked for exactly this.

## 1. What I would change about the original idea

Three sharpenings, now that a coach is a ladder and development is real.

### Two contours, not one

Draw **where she is** and **how far she could go** as two shapes: a solid inner contour for her
current skills, and a soft outer haze for her potential.

The whole thesis of this game is investing without knowing the return. The outer haze *is* that
thesis, rendered. And the important half is the asymmetry:

> **The inner contour converges to the truth. The outer one never fully does.**

You finish the career still not certain how good she could have been. That is not a limitation of
the model; it is the model. It is also the honest thing — nobody knows what a nineteen-year-old had
in her, including the nineteen-year-old.

### What lifts the fog is EVIDENCE, not elapsed time

This is the part that turns a progress bar into a mechanic. Three sources, and the third is the one
worth building:

1. **The coach's tier.** A better coach reads a player faster and more accurately. This hands the
   coach ladder a *second job* beyond the development multiplier — and it is a reason to pay that is
   completely independent of the ranking gain the combined bench just measured (`combined-measure.md`
   §2). An Elite coach tells you *who she is* sooner. That is worth money to a parent even when it is
   not worth ranking places.
2. **Weeks together.** Trivially, time — and it resets, partially, when she changes coach. A new
   coach has to learn her.
3. **Match evidence, per axis** — the good one. **Stamina is unknown until she has played a long
   match. Composure is unknown until she has played a tight one.** Serve and return sharpen with
   matches generally, faster against opponents who tested them.

Source 3 makes the radar **a record of what she has been through** rather than a stat block. A girl
who has only ever won easy first rounds has a fuzzy composure axis, and that is *true about her*. It
also costs us almost nothing: `WorldMatch` already stores the scoreline and both skill snapshots for
every match she has played, so "was it long" and "was it tight" are reads over data we already keep,
not new state.

### Numbers never appear — but a verdict does

Axes without digits, per the original decision. In their place, the coach's read in words: *"her
serve is her weapon"*, *"nobody knows yet how she holds up in a third set"*. That is the same voice
as the coach note on Home, which already exists and which the owner has just given a handwritten
signature. One voice, two surfaces.

## 2. The shape, in the terms this codebase uses

**A confidence per axis, 0..1**, derived — not stored as a fourth parallel skill block. Persisting it
would mean a schema bump and a migration for a number we can recompute from the ledger we already
keep. Derived at snapshot time, like `coachMarket` already is.

```
confidence(axis) = f( weeksWithCoach, coachTier, evidence(axis) )
```

The UI reads a single shape and never sees the true values:

```
RadarAxis { key, shownValue, band, ceilingLo, ceilingHi, note }
```

- `shownValue` — the estimate, not the truth. At low confidence it is deliberately *wrong*, drawn
  off a purpose-scoped sub-stream so it is stable per career rather than shimmering week to week.
- `band` — how wide the error is. This is the fog.
- `ceilingLo/Hi` — the outer haze, which narrows toward but **never below** a floor width.
- `note` — the coach's sentence for that axis, or null when he has nothing to say yet.

**No new randomness in the main stream.** The estimate's error is post-draw arithmetic on a
purpose-scoped sub-stream (`rngFromSeed(seed + ':read:' + axis)`); the frozen MAIN capture (41550
draws / `e6b0c709`) must not move.

## 3. The risk I would flag before building it

**A narrowing haze can be reverse-engineered.** `potential` is rolled once and never moves, so if the
outer band tightened without limit, a patient player could read the exact ceiling off the screen and
the fog would have been theatre. The floor width in §2 is what prevents that: **you learn the range,
never the number.** It is one constant, and it is load-bearing — it is the difference between
"talent is discovered" and "talent is displayed after a delay".

Second, smaller: the estimate must not shimmer. If `shownValue` is redrawn every week the contour
breathes and reads as noise rather than uncertainty. Hence the per-career sub-stream: her coach's
misreading of her backhand is *consistent* until evidence corrects it, which is also how misreading
a person actually works.

## 4. Where it goes, and my recommendation

It is **an engine slice plus a UI face**, and I would not bolt the engine half onto a screen agent —
that is how scope goes sideways.

- **Engine slice, its own branch, parallel to the UI wave:** the confidence model, the evidence read
  over `WorldMatch`, the derived `RadarAxis[]` on the snapshot, and the coach's per-axis sentences.
- **U1 (Kid Profile, screen C) builds the radar as a first-class element** against the contract in §2.
  If the engine half is not ready when U1 gets there, U1 renders against a stub **of the final shape**
  — so there is no rework, only a data source swap.

Honest cost statement: this is **an extra slice on top of a wave that already has six pieces**. It is
not free, and the UI wave will finish later because of it. The reason to do it now anyway is the one
the owner gave — the Kid Profile screen is being rebuilt *this wave*, and building it twice would
cost more than building the radar once.

---

# 5. A fifth axis (owner, 30.07)

> «Maybe add one or two other skills to our wind rose and character?»

## 5.1 The test an axis has to pass

An axis is not a word on a picture. To earn a spoke it has to answer five questions, and four of the
five are already answered *for* the existing four by the machinery above:

1. **Is it distinct?** Not a second name for something the model already has.
2. **Does the match read it?** The radar sits on the one screen in this game that is otherwise all
   consequence. An axis `src/engine/match/` never opens is decoration.
3. **What proves it?** Stamina is proved by a long match, composure by a tight one (§1, source 3).
   An axis with no evidence source is **permanently foggy**, which is worse than absent — the fog
   would stop meaning "nobody knows yet" and start meaning "we never modelled this".
4. **Does it develop?** `growWeek` must move it and `rollPotential` must cap it, or it is a constant
   wearing a spoke.
5. **Does it make an existing DECISION mean something?** This is the one that decides it. The game
   has few decisions and they are all expensive; a fifth attribute that does not sharpen one of them
   is a fifth thing to read and nothing else.

## 5.2 The two candidates, and the one that fails

**Movement / court coverage — rejected.** It fails (1) outright. `MatchPlayer.ret` is documented as
*"return + neutralizing quality"* — neutralising **is** movement, and the only match wiring available
to a movement axis is "reduce the server's advantage", which is the term `ret` already occupies in
`basePServe`. Its evidence would be the scoreline (long matches, tight matches), which is where
stamina and composure already live. It would be a fourth reading of the same two facts. Net-play and
"tactical reading" fail differently and for the same underlying reason: nothing in `point.ts` models
court position or opponent-specific tactics, so wiring either means inventing a subsystem first, and
until that exists both are words. Mental resilience is composure with a longer name.

**The groundstroke — shipped.** `groundstrokes`, drawn as **Groundstrokes**: how much she hurts
people off the ground.

## 5.3 Why the groundstroke

**It is the hole in the model, and it is visible on the picture.** The point model has three legs in
real tennis — the serve, the return, and the rally that follows. Ours has two. Any tennis follower
reading a radar labelled Serve / Return / Composure / Stamina asks where the forehand is, and the
honest answer until now was "nowhere".

**The match wiring is the leg that is missing, not a re-weighting of one that is there.** `serve`
enters `basePServe` on the server's side only; `ret` on the receiver's side only. The rally is
contested by *both*, so the groundstroke enters as a **difference**:

```
p += (server.groundstrokes - receiver.groundstrokes) * RALLY_K
```

Two consequences worth stating. First, whoever hits bigger both **holds** better and **breaks**
better — which is what being the bigger hitter means, and which neither of the existing two terms can
express. Second, the term is **exactly zero when the two players are equal**, so it changes no
calibration constant and no symmetric fixture: it is the same "neutral is byte-identical" property
`applySurfaceStyle` was built around. `RALLY_K` sits *below* `SKILL_K` on purpose — the serve is the
most valuable shot in tennis, and a ten-point serve edge should still outweigh a ten-point forehand.

**The DECISION it sharpens is the play style — the most expensive decision in the game, because it is
made on screen R before the player knows anything and is then persisted for the whole career.** Today
the four styles differ in the model by which of `serve`/`ret` gets a ±3–6% surface nudge, and by which
coach reads as `great`. That is thin for a choice you cannot take back, and it is thinnest exactly
where it should be richest: **the aggressive baseliner has no attribute of her own.** Her whole
identity is hitting through people from the back of the court, and the model had no field for it, so
she was implemented as "a server-and-returner who likes hard courts". `groundstrokes` is the attribute
her style is about. `SURFACE_STYLE_DELTAS` gains one row and only one — hers — and the three zeros
around it are a statement rather than an omission: a serve-first player's court is decided by her
serve, a counterpuncher's by her return and her legs, and all-court is the zero row by definition.

It sharpens the **coach** decision in the same motion, without a line of new code: a `great`-fit
aggressive coach is now developing the attribute her game actually runs on.

## 5.4 What proves it

**A baseline exchange is a mutual examination.** Serve and return are cross-paired — her serve is
tested by the other girl's return, her return by the other girl's serve. The groundstroke is
**self-paired**: her groundstrokes are tested by *groundstrokes as good as hers*. That is both true of
tennis and a genuinely new question about her career, distinct from the four that exist:

| axis | what proves it |
|---|---|
| serve | a returner who could hurt her |
| return | a serve that troubled her |
| composure | a tight match |
| stamina | a long match |
| **groundstrokes** | **somebody who could out-hit her** |

So `technicalUnitsOf` generalises from two axes to three and the fog behaves like the other four's by
construction — same saturating curve, same `TEST_SPAN`, same `TECHNICAL_BASE_UNIT` floor, because
every match contains rallies just as every match contains serves.

**⚠ Pre-v25 match records carry no groundstrokes, and they must count for nothing rather than for
zero.** `WorldMatch.a/.b` are `MatchPlayer` snapshots, so a career that has been running since v24
has a rolling window of matches with the field absent. Treating a missing value as `0` would read as
"she was out-hit by every opponent she ever played". They are skipped — excluded from `seen`, so they
do not dilute the per-match rate the imputation is built on either. A migrated career therefore opens
with maximum fog on the new axis and the coach's honest line about it, and it sharpens from her next
real match onward.

## 5.5 The three things that must not move, and how each is held

**The frozen MAIN capture (41550 draws / `e6b0c709`).** It is
`52 × (4 × 199 cohort drift + 3 base costs) + 2 sponsor gifts` — a function of cohort size and career
length. Three separate hazards, all closed:

- *Her build at birth.* `startingSkills` gains a fifth `pickInt` **appended last** on the
  purpose-scoped `seed:kid` sub-stream. Appending to the end of a sub-stream leaves every earlier
  draw byte-identical (verified, not assumed), so no existing career's serve, return, composure or
  stamina moves by a hundredth. Same argument for `rollPotential` on `seed:potential`, and
  `SKILL_KEYS` therefore grows **append-only** — the draw order *is* the key order.
- *Weekly growth.* `growWeek` draws **one** luck value before the loop over `SKILL_KEYS`, on
  `seed:growth:<week>`. A fifth key costs zero additional draws anywhere.
- *The cohort.* `driftCohort` spends **exactly four main-stream draws per player**, and that count is
  what the capture is made of. So **the cohort does not store a fifth attribute**: `AiPlayer` becomes
  `extends Omit<MatchPlayer, 'groundstrokes'>` and a rival's groundstroke is **derived at match
  time** — the precedent is `styleOf`, which already derives a rival's play style from her attributes
  and stores nothing (`rival-life.md`: a stored field would cost a schema bump *and* shift every
  subsequent attribute for all 199). The `Omit` is not a convenience; it makes the compiler refuse
  any path that would smuggle the field into a persisted cohort row.

**The fog design (§§1–3).** Untouched. Nothing above changes `bandFor`, `ceilingHalfWidth`,
`CEILING_FLOOR_HALF`, the per-career `seed:read:<axis>` draw or the no-numbers rule. The new axis is
one more member of `SKILL_KEYS`, and every fold in `radar.ts` is already generic over it.

**Confidence stays derived.** The radar still persists nothing. What *is* persisted is the attribute
itself, and that is a schema bump: **v24 → v25**, append-only block, plus a golden `v25.json`.

## 5.6 The starting value a migrated career gets

An existing save has never had this attribute, and the two obvious answers are both wrong. Her
**birth** value is wrong: a girl at week 200 would open with a fourteen-year-old's forehand and a
radar with one absurd spike missing. Her **ceiling** is wrong for the mirror reason.

The defensible answer is that *she has been hitting forehands the whole time — the attribute was not
modelled, but the girl was.* So the migration places her at **the same share of the new axis's
headroom that she has taken on the other four**:

```
progress    = mean over the old four of (skills[k] - start[k]) / (potential[k] - start[k])
groundstroke = start + progress × (potential - start)
```

with `start` and `potential` from the appended draws on `seed:kid` / `seed:potential`. A fresh career
gets `progress = 0`, i.e. exactly `startingSkills`, so a new game and a migrated week-1 game are the
same career — which is the property v19 established and worth keeping.

## 5.7 Scope: what this slice does NOT do

- **`power()` in `season/cohort.ts` stays the mean of four.** It is the conveyor's "how good is she",
  read over *persisted* attributes; feeding it a derived fifth would change which rivals the conveyor
  retires, for no gain the player can see.
- **`matchStats.ts` still reads `serve` only** for serve speed. A groundstroke has no counter in the
  stats panel yet; inventing one is the match-viz slice's call, not this one's.
- **No new axis on the AI's `styleOf`.** A rival's style is still read off serve/ret/stamina, which
  are the three she stores.

# 6. Three contours, no ceiling line, and an axis that ends where the game ends (owner, 11.08)

Three rulings on one day, all of them about the same complaint: **on a live career the picture read
as a verdict.** Measured on his own save at seventeen (`olivia-o1p7_w195`), derived with
`startingSkills` + `withHeadStart` against `world.potential`:

| skill | start | now | ceiling | grown | left |
|---|---|---|---|---|---|
| serve | 51.7 | 53.8 | 55.1 | 2.1 | 1.3 |
| return | 50.7 | 62.8 | 70.1 | 12.1 | 7.3 |
| composure | 37.7 | 39.5 | 41.5 | 1.8 | 2.0 |
| stamina | 42.7 | 45.0 | 46.5 | 2.3 | 1.4 |
| groundstrokes | 58.7 | 63.2 | 65.9 | 4.5 | 2.7 |

She was born with 7.5 points of headroom an attribute. The rose drew the sliver that was **left** and
nothing else – so a girl ranked 255th in the world, paying her own way, was drawn as a career already
over. **The chart was wrong about her, not the other way round.**

## 6.1 Draw where she started

> «на розе как раз показывать "старт" – т.е. с чего начала, может быть так будет приятнее и нагляднее»

`RadarAxis` gains **`startValue`**, and it needs no storage, no schema bump and no migration: the
week-one build is `withHeadStart(startingSkills(seed, profile), birthMonth)`, a pure function of the
seed and the profile, derived at snapshot time like every other number on that object.

**It goes through the same fog, on the same draw.** `readAs` in `engine/radar.ts` is the misreading
`shownValue` already used, factored out: one draw off `seed:read:<axis>`, once per career, so the
coach is wrong about her past by exactly the amount he is wrong about her present. Two consequences,
and both are wanted:

- The start contour is **inside** the current one on any career that has gone forward, always. An
  independent draw would put "where she began" outside "where she is" whenever the gain was smaller
  than the error – a *false* claim, not an uncertain one.
- The **distance between the two shapes is her true career gain, exactly**. That is the one exact
  thing on the picture, and it is a distance and never a value: neither contour says where she is,
  the axes carry no digits or ticks to read it off, and one career-long distance does not integrate
  into a build the way the weekly deltas §"what moved this week" forbids would.

At week one the two contours coincide exactly, which is the honest opening: the story is the two
coming apart.

## 6.2 The dashed ceiling edge goes; the haze stays

> «контур "безнадежности" текущий надо убрать… мы знаем в игре её потолок, потому что он
> запрограммирован нами, но в жизни потолок можно только по прогрессу в играх увидеть. Заблюренная
> зона это ок.»

`ceilingEdge` and `.radar-ceiling-edge` are deleted; `ceilingPath` – the blurred band between
`ceilingLo` and `ceilingHi` – is untouched, and so is every constant in §3. The old argument for the
hairline (an early career's fog and haze overlap and read as one glow) was a good one and it lost on
a point it never addressed: **a soft region reads as "somewhere out there"; a drawn polygon reads as
a number the game has already decided about her.** The argument is kept in the component's own
comments, marked superseded, per this repo's habit.

The legend (R15-15) grows to three keys, and the haze's key becomes a filled rect: `.radar-ceiling`
is a fill with no stroke now, so a line wearing it would draw nothing.

## 6.3 The axis ends at the maximum, not at 100

> «если мы до 100 вообще не можем дорасти, то явно имеет смысл цену деления пересмотреть на графике,
> чтобы максимумы упирались в максимумы… Блюр при этом может и за границы оверлапом выходить, не вижу
> проблем»

Nothing this game can produce exceeds **`SKILL_CEILING_MAX` = 86**, and nobody chose that number: it
is the top of `STARTING_SKILL_BAND` (stamina, 60) plus the top of `ECONOMY.development.potentialBand`
(26), two constants picked separately. `rollPotential` is the only thing that sets a ceiling and
growth is asymptotic toward it, so 86 bounds every career for every seed – a supremum, strictly
(`rng()` is in `[0, 1)`; the best of 60,000 seeds was 85.998). The outer seventh of the rose was
therefore unreachable, always.

**The constant is DERIVED in `engine/development.ts` and imported by the component, never written
down there.** Widening `potentialBand` is a live question (`skill-model-audit-2026-08.md`'s first
dial); a literal `86` in a Vue file would go out of date silently on that commit, with every mounted
assertion still green. That is why `radar.test.ts` §12 pins the import as well – see the note there
for the second mutation only source can catch.

**Zero stays at the centre** (a skill of 30 must not read as nothing) and the contract's own `0..100`
clamp stays, so a haze the engine clamps at 100 draws *outside* the ring rather than being flattened
onto it – explicitly allowed above.
