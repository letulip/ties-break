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
