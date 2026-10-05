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

**S2a · landed whole (06.10, sonnet) – the pure reader `legacyInputOf(world)`.** New module `src/engine/world/succession.ts`, off the barrel (no frozen-surface pin asked for it, so it is imported from its module per A-03) and with no consumer yet. **Exports:** `legacyInputOf`, `legacyBandOf(kind, bestRank, slams)`, `LEGACY_BANDS`, `LEGACY_SAVINGS_MULTIPLIER`, `LEGACY_ENDING_CEILING`, `LEGACY_SOLID_RANK` (100), `LEGACY_DAUGHTER_LAG_YEARS` (2), the types `LegacyBand` and `LegacyInput { motherName, motherPeakRank, motherSlamTitles, surname, endingKind, savingsMultiplier, houseId, carId, daughterBirthYear, heirloomAlbum }`. **It reuses and never re-derives:** name, surname, pro-table peak, Slam shelf and ending kind are read off `dynastyHandoverOf`'s `motherCareer` (one cabinet and one peak – the parity arm asserts it against the ending view); the house and car off `deliveredAssets` (best = the higher catalogue rung; a stage under construction is not owned); the book off `assembleAlbum`. **The multiplier is the LOWER of what her record achieved and what her ending's kind allows** – a total `Record<CareerEndingType, LegacyBand>`, so a tenth ending goes red until it is priced. Achievement: a Slam title or a pro-table best of №1 is held, a best inside the top-100 is solid, ranked on the pro table and never inside is faded, never on it is early. Ceiling by kind: `peak`, `natural`, `family` reach held (3.0); `plateau`, `fall` reach solid at most (2.0 – the quiet fade is not the farewell); `injury`, `bankruptcy`, `stopped`, `college` are early (1.0). Values 3.0 / 2.0 / 1.3 / 1.0 in one constant with §4 quoted, none outside [1.0, 3.0], and a world with no latched ending reads 1.0. **The daughter's birth year has two sources, told apart by `world.children` alone:** (a) a row with `sex: 'girl'` (the first one, as the wizard's `childBirthdays[0]` does) gives `weekYear(bornWeek, world.startYear)`; (b) none (an empty list, or boys only) gives the ending's week, or `world.week` when none latched, through the same call, plus 2. **The heirloom is the finished `AlbumBook`, whole** – not the milestone slice: generation 2 has no generation-1 world to re-assemble from (§5), the book reads far more than `milestones`, and it is already plain data (1 to 9 KB of JSON over 14 walked careers, strictly equal after a JSON round trip). **Evidence:** `tests/succession-s2a-legacy-input.test.ts`, 32 cases over three lived careers (a real bankruptcy, a real injury, and the player policy's top-100 career) with the farewell kinds and the Slam posed on clones through the real `latchEnding` and the real shelf, plus the whole nine-kinds-by-four-facts matrix over `legacyBandOf`. Mutations, each restored byte-identical (`cmp`): every multiplier flattened to 1.0 gives 5 red (all in the multiplier arm); `startYear` dropped from the two calendar calls gives 2 red; best rung turned cheapest rung gives 1 red; `injury`'s ceiling lifted gives 3 red. **FINDINGS FOR THE ARCHITECT:** (1) `injury` at 1.0 is the LITERAL §4 reading (forced is 1.0), so an injured top-100 career prices at 1.0 – one word in `LEGACY_ENDING_CEILING` if the owner wants her record to follow. (2) The census of 14 walked careers (grinder x 12, player x 2) met no Slam, no №1 and no house or car, and the two top-100 careers (#13, #20) latched no ending inside 1600 weeks – so the 3.0 row has never been seen by a bench, and S2b's predicted-versus-measured needs a policy that reaches it. (3) S1's persisted `legacy` block holds `savingsSliceCents` and nothing for house, car or birth year: those are creation-time inputs, and S2b multiplies by B and applies them once. (4) `children` and `assets` are required on every legal world and both the album and the dynasty block read them unguarded, so «never throws» holds for every legal career (no house is an empty list), not for a hand-stripped object.

**S2b · landed whole (06.10, sonnet) – `createLegacyWorld`, generation 2's creation path.** `createLegacyWorld(legacy, seed, daughterName, profile = DEFAULT_PROFILE, careerId?)` at the foot of `src/engine/world/succession.ts` (off the barrel like the reader; the worker command and the door are S2c's, so nothing outside the tests calls it yet) plus ONE new optional argument on `createWorld`, the eighth, `openingFundsCents`. **The opening age is `START_AGE_YEARS` = 14** (`src/engine/world/age.ts`: the age every career hands a girl to the world at – the childhood prologue's nine years, 5 to 13, end there – and `kidBirthYear(startYear)` is its inverse), so `startYear = daughterBirthYear + 14`. **The start budget B is `STARTING_FUNDS_CENTS[profile.background]`** = `ECONOMY.startingFundsCents` (working 800_000, middle 2_500_000, wealthy 12_000_000 cents; the default girl is middle = $25,000); the wallet is `Math.round(B x savingsMultiplier)`, one multiply. ⚠ **WHY `createWorld` WAS TOUCHED AND NOT JUST WRAPPED:** its week-0 feed line states «Family budget» from the very number the wallet opens with; a grant written onto `world.fundsCents` afterwards would leave the career's first sentence naming the ordinary budget beside a wallet up to three times its size, and patching the sentence from outside would make a second writer of it. Absent argument = byte-identical: the three default creations match S1's pristine digests inside the S2b suite, and a guard refuses a negative, fractional or non-finite wallet (zero is a wallet). **`legacy.savingsSliceCents` is the WHOLE opening wallet (B x m), the amount GRANTED** – the brief's «write the result» – not the extra over an ordinary start; at the 1.0 floor the two differ by exactly B. **The house and the car arrive as ordinary owned rows** (`id`, `boughtWeek: 0`, `paidCents`, `valueCents`, `entries: []`), written beside the purchase flow and not through it – no funds move, no feed line, no milestone. A parity arm buys the same car through the real `buyAsset` and compares the rows: the same keys in the same order at the same price. `paidCents` = `assetEntryPriceCents` at week 0 (for a house that is the catalogue figure, because its quote indexes from the career's first week), `valueCents` through `assetWorthCents`, `entries` empty (the v77 -> v78 migration's own «no marks»). ⚠ **This departs from spec §3's «at their aged value»** on the architect's brief: the rows open at the market quote on a clock that starts now, since an aged row needs a negative `boughtWeek` the shop was never written for – the one thing to rule on if the owner wants a visibly older car. **The rest:** the given name is the caller's, the family name generation 1's, and `profileShapeError` judges the final profile; `world.legacy` is written in S1's declared shape and order with the album `structuredClone`d in (no live link); a multiplier outside the table's own corridor, a «house» that is not a house or a «car» that is not a car throws a `RangeError`. **Bench, predicted vs measured** (B = 2_500_000, three seeds each, every seed identical, the feed figure in brackets): early 1.0 predicted 2_500_000, measured 2_500_000 ($25,000); faded 1.3 predicted 3_250_000, measured 3_250_000 ($32,500); solid 2.0 predicted 5_000_000, measured 5_000_000 ($50,000); held 3.0 predicted 7_500_000, measured 7_500_000 ($75,000). Also measured exact: a 1.2345679 multiplier landing on 3_086_420 (the whole-cent rule), all twelve background x band cells, and the wallet unchanged by the arriving rows. ⚠ The four multipliers are POSED on a real walked bankruptcy's real input (S2a's finding 2: no walked career reaches 3.0), so the bench measures creation and not the walk; the one real chain is bankruptcy -> reader -> 1.0 -> an ordinary start. **No draws:** a legacy world's `rngMain` equals a plain `createWorld`'s on the same seed and year (twelve cells, position 0), and every key of the world but `fundsCents`, `assets`, the first feed line and the one added `legacy` is byte-equal to its plain twin's. **Evidence:** `tests/succession-s2b-create.test.ts`, 39 cases – the calendar both ways (a walked mother's synthesized year and a posed real child, plus literal 2060 -> 2074 and the guard), the money, the names and the block, the rows, the plain path's digests, no draws, a `compressWorld`/`decompressWorld` and an export-file round trip that also ticks on identically, twenty weeks of play with every persisted label naming 2074 (the mother's album is left out of that scan – it rightly names her own years), and the refusals. **Mutations, each restored byte-identical (`cmp`):** the multiplier flattened to 1.0 gives 8 red of 39 (every money arm, the mother's-block arm and the twelve-cell arm; the 1.0 band stays green on purpose); the start year pinned to 2031 gives 6 red (all four calendar arms, the compress round trip and the twenty-week labels). The frozen MAIN capture (`tests/condition.test.ts`, 41550 / e6b0c709) is green, 51 of 51; S1, S2a, S2b, goldenSaves and migrations together are green (219 tests); so are twelve files that guard what this edit touched (265 tests: the frozen capture's file, the seven that read `create.ts`, the two A-03 ratchets, the import-cycle and the pin-hygiene guards); `vue-tsc -b --force` exits 0. **Not done, by design:** no `prologue` and no `weightEnabled` pass-through (one argument each when the door needs them); no worker command, no snapshot field and no UI – that is S2c. **FINDINGS FOR THE ARCHITECT:** (1) B follows the profile's background and `LegacyInput` carries none: if the door also applies wave 10's origins-card band (`dynasty.background`), a wealthy-origin daughter of a held champion opens on 3 x $120,000 = $360,000 – the «around 3x» corridor is relative to HER family's B, so this is one decision for S2c (this build takes the profile's background as given). (2) Creation caps a name at 20 characters (`profileShapeError`), so an inherited surname longer than that – possible only on a career opened before 06.09, when the cap was 200 – is refused rather than carried; the door should pre-check, or the cap should be waived for inherited names. (3) No wave-10 `dynasty` handover is passed to `createWorld`: it and the `legacy` block would both carry «who the mother was». (4) The arrived house and car are billed by the shop's own `weeklyAssetUpkeepCents` from week 1 (arm 8 asserts it is above zero, and zero for a family that owns nothing), so §4's «real easing» is the asset's value and not a free roof; how much a legacy home should cost to keep is balance work and is not measured here. (5) THE WHOLE UNIT PROJECT RAN ON THIS TREE (`node scripts/units.mjs`, 413 files): 7487 of 7488 green, and the one red – `tests/secondary-market-s2.test.ts` line 291, the v90 recipe pin – fails identically on a control worktree of pristine HEAD `dd43f77d` (no S2b change in it), so it is S1's and not this step's: `migrateSave(read(89))` now carries `startYear: 2031` from the v92 step and the expectation `{ ...read(90), schemaVersion }` does not. The one-line repair is to add `startYear: 2031` to that expected object, the way round 45's re-aim moved the version number there; left untouched because the pin is S1's, and `npm run check` goes red on it until somebody does.

**S2c · landed whole (06.10, sonnet) – the dynasty door carries the legacy.** **THE DOOR IS WAVE 10'S, NOT «Raise another»:** the ending's SECOND button (`EndingScreen.vue` `continueLine`, «Raise her daughter» / «A daughter came later») emits `continueLine(block)` -> `App.vue` `continueTheLine` -> `ChildhoodPrologue` (or `OnboardingWizard` on the skip) -> `begin()` / `start()` / `skipToDefaults()` -> `game.newCareer` -> the worker's `new`. «Raise another» is the unrelated-story button beside it: `raiseAnother` clears the line, so it never asks and carries nothing (an arm pins that). **Added on that road:** a read query `legacyInput` (a `ToWorker` arm, an ok-reply arm `{ legacy: LegacyInput }`, a `REPLY_BY_COMMAND` row and a `query` row in the worker's classification table) whose handler is `legacyInputOf(world)` on the committed world – no draws, no commit, revision unchanged; the store's `loadLegacyInput()`; `App.vue`'s async `continueTheLine`, which asks FIRST (the snapshot is dropped three lines later) and holds the answer in `pendingLegacy` beside `pendingDynasty`, spent by the same watcher and cleared by `raiseAnother`; a `legacy` prop on the prologue and the wizard; `newCareer`'s sixth parameter and the `new` command's optional `legacy`. ⚠ **`pendingLegacy` IS A `shallowRef`:** the blob goes back over `postMessage`, which cannot clone a reactive proxy (`plainDynasty`'s whole history), and one mutation shows the shell arm red on a `ref`. **At creation** the worker calls `createLegacyWorld` when `legacy` is present and `createWorld` otherwise (absent = the same single call, argument for argument); `createLegacyWorld` gained ONE optional sixth argument, `creation: { prologue?, dynasty?, weightEnabled? }`, handed to `createWorld` untouched – S2b's «one argument each when the door needs them» – so the nine years she walked are applied and not discarded at the last card. **Two decisions S2b left to the door:** (1) THE LINE'S WAVE-10 RECORD IS PASSED – `world.dynasty` is what carries `generation` and `ancestorSeed` to her own daughter and the mother's temperament to §7's lean, so dropping it would break the chain to add the money; the two blocks are written in one instant off one `dynastyHandoverOf` and cannot disagree. (2) THE ORIGINS RULING (the architect's, S2b finding 1): `LEGACY_FAMILY_BACKGROUND = 'middle'` is forced on BOTH places a band arrives from – `profile.background` and the handover's `background`, which `createWorld` applies OVER the profile – so a wealthy origin opens on the ordinary family's budget times the multiplier ($25,000 x m, never $120,000 x m); the builder prices the grant against the band `createWorld` will actually apply. **What the origins field controls** is wider than the wallet: ONE field, `world.profile.background`, read for the opening wallet, the coach rung she arrives on, the parents' weekly money, the coach, vacation, practice, kit and treatment price corridors, the season's build and a college's aid – so «only the budget band» is not expressible, and forcing the field IS the narrowest true version. Untouched: the nine years as lived (cards, costs, picks, the trace), her name, birthday and country, the line's generation and temperament, the weight ask. **The surname** already pre-fills from the dynasty block (`ChildhoodPrologue.vue` `openingIdentity`, locked – `PrologueCard.vue` `readonly`); the legacy's `surname` is the same string off the same `dynastyHandoverOf`, so nothing was re-pointed. **Evidence:** `tests/succession-s2c-door.test.ts` (5 cases at the worker seam: query parity with `legacyInputOf`, pure read, plain data, refused with no career; creation whole-world equal to `createLegacyWorld`'s from the same inputs with the band, calendar, wallet, holdings, block, nine years, line and weight ask asserted off the engine's constants and no MAIN draw; the plain path whole-world equal to a direct `createWorld`; three refusals that leave the loaded career alone) and seven mounted arms appended to `tests/component/wave10-dynasty-door.test.ts` (the shell: one ask, while loaded, the prologue handed the SAME object; a refused query is wave 10's line; «Raise another» never asks; the surname pre-fill; the over-long surname does not crash the card; the ninth card's sixth argument, with and without; the wizard's two create calls), with `tests/helpers/completeRun.ts` shared; the enumerations that name every command or reply arm were re-aimed (`worker-reply-correlation`, `principles-d05`, `principles-d08` and its `new.legacy` carrier row, the worker's own classification table). **Mutations, each restored byte-identical (sha256):** the worker's branch dropped -> 2 red; the handover's band not forced -> 1; the builder's `prologue` pass-through dropped -> 1; its `dynasty` dropped -> 1; `shallowRef` -> `ref` -> 1; the door not asking -> 2; the ninth card dropping `props.legacy` -> 1; the wizard's `start()` / `skipToDefaults()` dropping it -> 1 each. The frozen MAIN capture (`tests/condition.test.ts`, 41550 / e6b0c709) is green, 51 of 51; the neighbours (27 unit files, 602 tests: S1, S2a, S2b, the worker pins, d05/d08, import-cycles, goldenSaves, migrations, wave10, dev-fast-forward) and the whole component project (258 files, 2711 tests) are green; `vue-tsc -b --force` and `check:tools` exit 0. **Not touched, by design:** no string moved and none was written (the door names nothing about the inheritance); `EndingScreen.vue` is not in this diff, so its three year sites (`seasonYear` / `weekLabel`, lines 278, 281, 318) stay S2e's, and App, the prologue and the wizard print no year; no popup was added or lengthened, so no phone arm. **FINDINGS FOR THE ARCHITECT:** (1) ON A LEGACY CAREER WHAT THE PROLOGUE SPENT NO LONGER COSTS ANYTHING – `openingFundsCents` REPLACES `prologueFundsCents(background, spentCents)`, so the nine cards' spending no longer reduces the wallet (the grant is B x m of the ordinary start, not of the childhood's remaining reserve); pricing B as `prologueFundsCents('middle', spent)` would restore the trade, and it is a balance decision with a bench, so it was not made here. (2) The brief's «the player edits» an over-long inherited surname does not hold: the field is `readonly` on a dynasty run, so a name over the cap (possible only for careers opened before 06.09) is refused at the ninth card by the profile's law with no way to edit it – wave 10's behaviour, unchanged and now also the legacy path's; an unlock-on-overflow is a UX call. (3) The `legacy` payload is re-validated only as far as `createLegacyWorld` guards (the multiplier's corridor, house and car families, the year, the profile): scalar types and the album's inner shape are not checked, and a refusal sentence for them would be a new string – a DRAFT candidate in the report, not written. (4) The inherited house and car still arrive at the week-0 quote (S2b's departure from §3), unchanged here.

### DRAFT strings (W-S…)

| id | where | the line |
| --- | --- | --- |
| – | appended by the wave's builders as they add player-facing words | – |
