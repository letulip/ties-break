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

Build timing (re-ruled 05.10, evening): the wave STARTS the night round 46 closes – «поставь себе
задачу начать эту волну сразу после окончания раунда 46 в отдельной ветке от самого раунда… будешь
шаг за шагом всю ночь работать». Its branch cuts from the round's head (unmerged until morning, so
a round-46 schema bump and the wave's own cannot collide), §7 step 1 first. The SHIPPING decision
– into the launch build or after it – stays his at merge time; nothing in the feature leaks before
a career finishes, so carrying it pre-launch is safe by construction.

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
- **The brand** (ruled 05.10): «новая карьера - это карьера дочки, просто новая карьера с
  небольшими бенефитами в начале, больше ничего».
- **The academy** (ruled 05.10): «она не продана, а не основана» – in generation 2 it simply was
  never founded; nothing to inherit, nothing sold off screen.
- Everything else by default.

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

## 6. The small forks – all four ruled the same day (05.10)

1. **The brand**: does not carry – «просто новая карьера с небольшими бенефитами в начале, больше
   ничего» (§3).
2. **The academy**: does not exist in generation 2 – «не продана, а не основана» (§3).
3. **The door**: not gated by the ending. His answer reframed the question as the dynasty loop:
   «У нас там когда-то позже мальчики появятся, будет больше вариативности. Но по сути,
   околобесконечный процесс, разве что может средненькая рождаться или вообще "не про теннис"» –
   succession is a near-infinite process; the variability lives in the CHILD, not the door. Boys
   arrive in a later iteration. The child's draw varies by generation: sometimes a modest talent,
   sometimes a girl who is not about tennis at all – the talent/inclination draw is build-wave
   design (what a «не про теннис» generation means for play – a hard start, or the line pausing –
   goes back to him with measurements when the creation path builds).
4. **Payment**: no interaction – the paywall is ONE-TIME, after the first prologue and the first
   junior year («Он единоразовый»); a succession career sits behind no second gate by
   construction.

## 7. Build shape (post-launch)

Three steps, each its own wave-sized slice:

1. **Start-year parameterisation** – the §2 audit and the schema field, shippable alone and
   invisible to players. The earlier this lands, the fewer fixtures to touch.
2. **The legacy creation path** – the ending door, the blob, the multiplier, the carried assets
   and album. The core of the feature; one schema bump together with step 1 if they ship together.
3. **The fame content** – press lines, brand doors, rival daughters, the mother's record visible
   in the world. Pure content on top; can trickle in over rounds.

## 8. The night build plan (05–06.10, ruled: the wave starts when round 46 closes)

Branch `wave/succession`, cut from `round/46`'s final head (the round is unmerged until morning;
cutting from it keeps the round's possible schema bump and this wave's from colliding – this wave
takes the NEXT version number after whatever the round shipped). Sequential dispatch under the
29.09 token law; the architect runs the gates between steps and at the close; every new
player-facing string lands in this wave's own DRAFT table below for the owner's blessing.

| Step | What | Who · budget |
| --- | --- | --- |
| W0 | The 2031 census: `git grep -n "2031" -- src tests e2e tools` read and sorted into «reads the world after S1» vs «genuinely constant, dated note» – the input to S1's brief | architect, read-only |
| S1 | `startYear` into `WorldState` + creation input, defaulted 2031; ONE schema bump carrying ALL succession fields (startYear + the optional legacy block, declared up front so later steps add no second bump); append-only migration, golden fixture, `npm run e2e:fixtures`; regression arm: a default-2031 career is byte-identical (rngMain untouched, frozen capture green); a 2048-born world runs a season with consistent years | sonnet · 60 |
| S2a | `legacyInputOf(finishedSave)` – the pure reader: surname, mother + her peak, daughter's name and birth year, ending kind, the house, the car, the savings slice, the album blob; tests over a walked finished-career fixture | sonnet · 50 |
| S2b | Creation consumes the legacy input: start year = birth year + prologue age; house and car arrive owned at aged value; the §4 multiplier with its bench (predicted vs measured against the ordinary start budget); the mother as the named parent | sonnet · 60 |
| S2c | The door: the ending screen offers her career when the epilogue has the daughter; flows into creation; mounted tests, dismiss/controls inside 375×667 (the popup law); strings → DRAFT | sonnet · 45 |
| S2d | The heirloom: generation 1's album openable read-only from generation 2; entry point + mounted test; strings → DRAFT | sonnet · 40 |
| S2e | The UI year sweep: S1 measured 135 date-formatting call sites in components/composables still on the default year – correct for every gen-1 career, WRONG on a 2048 world; thread `snapshot.startYear` through them before the door ships | sonnet · 45 |
| S3 | Content (rival daughters in the conveyor, press/fame lines) – PLANNED, not tonight: corpus-heavy, needs his blessing batches by daylight | next wave |
| Close | Gates (check / component / capture verdict / sim / e2e) from files on a quiet machine; push; PR body by the pull-request skill | architect |

Honest night scope: S1–S2b are the engine spine and must land whole or not at all (schema moves do
not ship half-done); S2c/S2d are each severable. If the night runs short, the branch stops at the
last green gate and the morning report says exactly where.

**S1 · landed whole (06.10, sonnet, 56 of 60 moves) – schema v92.** `startYear` is a `WorldState` field (right after `week`), `createWorld`'s seventh argument (default 2031; a whole year 1900–2400 or it throws) and `Snapshot.startYear`; the optional `legacy?` block is declared with exactly the spec's shape and nothing reads it. `shared/dates.ts` keeps `DEFAULT_START_YEAR = 2031` and gives every year-dependent function an OPTIONAL LAST `startYear` argument (memo keyed per year, no module global); every `src/engine` call passes `world.startYear` – none left bare, and `tests/succession-s1-start-year.test.ts` refuses a new one (a source ratchet; migrations are frozen history and default to 2031). **Not done, by design:** the UI's 135 call sites in components and composables still format against the default – the follow-up, fed by `Snapshot.startYear`; the worker's create command carries no `startYear` yet (S2b/S2c). **Evidence:** regression arm – nine careers (3 seeds x {default, 31 Dec, 6 Jan}) walked 110 no-action weeks match digests taken from the PRISTINE tree on `rngMain` and on every byte (minus `startYear` and the version); the three frozen careers' rollback to v91 returns the old `FROZEN` constants character for character (`PRE_V92`) and the eleven live cells re-stamped; the frozen MAIN capture (`tests/condition.test.ts`, 41550 / e6b0c709) is green; 2048 arm – labels (`W1 '48`), the leap-day week (`Mar 2–8, 2048`), her age clock against an independent calendar for five birth dates x 260 weeks, the engine's own birthday mark landing a week later for a 3 March girl than in 2031, the diary's memory lines, the snapshot, and a cohort and pre-history identical to 2031's (rivals carry an age, never a year). **Mutations, each restored byte-identical (the `src` diff hash equal before and after):** migration default 2032 -> 2 red (the schema arm, round 45 C1); `markBirthday` without the argument -> 2 red (the birthday-week case, the ratchet); `createWorld` default 2032 -> 14 red (the regression arm among them). **Schema carriers:** state, migration, `v92.json` + README row, history entry, the saves-and-worker sentence, `careerHashAtSchema`'s `startYear` rung + `PRE_V92`, the e2e fixtures, and eight test pins that name the head or the wire (migrations, round43, round45 x2, round29 build line, round31, wave5, wave6, D-07's wire count 116 -> 117). **FINDINGS FOR THE ARCHITECT:** (1) the committed e2e fixtures were already STALE against HEAD – a fresh `npm run e2e:fixtures` on pristine HEAD picks other seeds (`soft-0`, `sinking-1`, `junior-28`, the same as on this tree, checked in a control worktree) and the careers it finds for `expecting` and `parting` fail two existing invariants (`e2e-fixtures.test.ts`: term 26 not 31; D-07: 200 letters, not more than 200) – so the fixtures were RE-STAMPED at v92 from the committed careers (decode, migrate, re-encode; all 13 manifest `facts` equal the committed ones, +7 to +13 bytes each) instead of searched again; the generator's recipes need a clause for both before anyone regenerates for real. (2) A bare `npx vite-node tools/e2e-fixtures.ts` exits 0 having done nothing unless `TB_FIXTURES_RUN=1` – use `npm run e2e:fixtures`. (3) Pre-existing and untouched: `ageWindowStartWeek`'s memo key carries the birth month but not the birth day, so two girls born in one month share a window within one process.

### DRAFT strings (W-S…)

| id | where | the line |
| --- | --- | --- |
| – | appended by the wave's builders as they add player-facing words | – |
