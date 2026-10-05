---
type: spec
status: draft
area: life
last-reviewed: 2026-10-05
---

# Succession – the second generation (05.10.2026)

The owner's idea, the day round 46 opened: «может быть нам в свежей карьере после преемственности
и год делать соответствующий, а не снова 31? Можно как-то этот механизм передачи сделать вообще?»

A finished career already ends with «A daughter came later» in the epilogue. This spec turns that
sentence into a door: a new career as that daughter, with the calendar continuing instead of
resetting to 2031, and the ex-star as the new parent.

He ruled the three big forks the same hour (decisions.md, 05.10):

- **(а) Who the player is in generation 2**: «Александра-мать конечно» – the ex-star herself, now
  the mother. The player keeps playing the parent of a tennis girl; the parent is the woman whose
  career they built.
- **(б) What inherits**: «символы да, но мы обсуждали, что она по умолчанию в богатой карьере
  стартует вроде, может быть разве что можно какой-то мультипликатор на начальные деньги делать в
  зависимости от того, как закончилась предыдущая картера, ну и дом, машину и может быть какие-то
  накопления тоже можно оставить, не все миллионы» – the house, the car, a slice of savings sized
  by how the previous career ended. Never the whole fortune.
- **(в) When**: «спека сейчас, стройка пост-лонч» – this document now, the build after launch.

Build target: post-launch wave(s). One piece – the start-year parameterisation – is worth pulling
earlier if a convenient wave appears, because every passing month adds fixtures that silently
assume 2031.

## 1. The loop

1. A career ends. The ending screen already tells the epilogue; when the epilogue contains the
   daughter, the screen offers one more door: start her career.
2. The new career is created FROM the finished save: the game reads it once at creation and builds
   a `legacy` input. The old save is never modified and stays loadable.
3. The new world starts at the daughter's prologue age, in the year that follows from her birth
   year in generation 1. The calendar continues; nothing resets to 2031.
4. The parent on screen is the ex-star, by name. Generation 1's player surname carries; the
   daughter's given name is the one the epilogue drew (round 46 #21 already guarantees it is not
   her mother's).

## 2. The calendar

Today the start year is a constant. The move: `WorldState` carries `startYear`, creation takes it
as an input (default: today's 2031 – an ordinary career is byte-identical to before), and
everything that prints or computes a year reads the world, not the constant. The build's first
step is an audit: `git grep -n "2031" -- src tests e2e` and every hit either reads
`world.startYear` afterwards or gets a dated note saying why it is genuinely constant.

Prehistory, the cohort and the conveyor already generate from a seed; they take the start year as
an input and generate the same kind of world around a later date. Rival ages, records and the
champions list must simply be consistent with the given year – nothing about 2031 is special to
them.

## 3. What carries, and what does not

Carries:

- **The family name**, and the mother as the named parent with her generation-1 peak (rank, titles)
  known to the world.
- **The house and the car** he named – the ones owned at the end of generation 1, arriving as owned
  assets at their aged value.
- **A slice of savings** through the ending multiplier (§4).
- **The album** – generation 1's album, read-only, openable from the new career as an heirloom. It
  is already a self-contained structure; it travels as one blob.
- **Rival daughters**: the conveyor seeds a few generation-2 girls with generation-1 rival
  surnames. Cheap, and the callback is the point: a known name across the net twenty years later.
- **The mother's fame as pressure and doors**: press compares the girl to her mother; brand
  interest opens earlier than for an unknown family. The exact mechanics are content work for the
  build wave, not schema – the legacy blob just has to carry the mother's peak.

Does not carry:

- **The fortune.** His words: «не все миллионы». The slice is the multiplier's, the rest is the
  retired star's own life, off screen.
- **Staff.** Twenty years pass; her coaches retired. Chemistry starts clean.
- Everything else by default. Two open rows for him sit in §6.

## 4. The ending multiplier

«Мультипликатор на начальные деньги в зависимости от того, как закончилась предыдущая карьера».
The ending signal already exists (`engine/world/endings.ts` knows how a career closed: the farewell
after a held №1 and the quiet fade are different endings). Sketch, to be measured at build time
against the ordinary start budget B:

| generation-1 ending | starting money |
| --- | --- |
| held a Slam or №1, farewell ending | 3.0 × B |
| a solid pro career (top-100 reached) | 2.0 × B |
| the career faded before the top | 1.3 × B |
| early/forced endings | 1.0 × B |

The corridor's intent: a generation-2 start is never POORER than an ordinary one and never so rich
that the junior-years budget tension disappears – the pressure of money is the game, so the cap
stays low (around 3×), and the house/car arriving owned is already a real easing. Exact thresholds
and values are the build wave's bench work (predicted vs measured, as always).

## 5. Saves and determinism

- The new career is an ordinary new save with its own fresh `rngMain`. The legacy blob is INPUT
  data at creation, like the prologue's choices – after creation the world owes the old save
  nothing.
- Schema: `startYear` and the legacy fields ride one version bump with the full four-part move.
  A career without them behaves exactly as today – append-only, defaulted.
- Reproducibility law holds per career: same seed + same legacy blob = the same generation-2
  world, byte for byte. The frozen MAIN capture stays about the default creation path; a legacy
  creation is a documented second path with its own fixture.
- The finished generation-1 save is read, never written. If it is deleted later, the running
  generation-2 career keeps everything it copied (album blob included) – no live link.

## 6. Still his to rule (small forks, any time before the build wave)

1. **The brand**: does a generation-1 clothing brand survive into generation 2 (as the mother's
   brand the girl can later join), or does it close with the career?
2. **The academy**: if generation 1 owned the academy stage, does it exist in the world of
   generation 2 (a place, maybe a training option), or is it sold off screen?
3. **The door's condition**: is succession offered after EVERY ending with the daughter, or only
   when the epilogue's circumstances allow (he may want some hard endings to stay final)?
4. **Steam/payment**: generation 2 sits in the paid version (the free segment ends at the first
   junior year – presumably moot, since succession needs a finished career; stated to be checked
   against the payment-gate spec when both build).

## 7. Build shape (post-launch)

Three steps, each its own wave-sized slice:

1. **Start-year parameterisation** – the §2 audit and the schema field, shippable alone and
   invisible to players. The earlier this lands, the fewer fixtures to touch.
2. **The legacy creation path** – the ending door, the blob, the multiplier, the carried assets
   and album. The core of the feature; one schema bump together with step 1 if they ship together.
3. **The fame content** – press lines, brand doors, rival daughters, the mother's record visible
   in the world. Pure content on top; can trickle in over rounds.
