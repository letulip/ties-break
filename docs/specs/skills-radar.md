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
