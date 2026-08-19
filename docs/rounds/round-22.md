---
type: round-ledger
status: current
area: rounds/22
canonical: false
last-reviewed: 2026-08-19
---

# Round 22 – the age clock, the living table, and the review's first three waves (18–19.08.2026)

Status: `[x]` shipped on `wave/round22` · `[~]` answered, nothing to build · `[ ]` open ·
`[?]` waiting on the owner · `[!]` REOPENED (was reported done, was not).

## ⚠ Read this before the checklist – what this ledger is, and what it cannot be

**This file was written on 19.08, after the wave, from the commits.** Every other round in this
folder was captured before triage in the owner's own numbering – round 21 has a commit for exactly
that (`a0a9945`, *"round 21: capture before triage, 12 items in his numbering"*). **Round 22 has
none, on any branch.** His list exists only as the item numbers in six commit subjects, `#1` through
`#20`.

So this ledger is honest about two different grades of evidence:

* where a commit body quotes him verbatim, the item is his and the quote is here;
* where it does not, the entry describes **what shipped under that number** and says so. It does not
  reconstruct a sentence he may never have written.

⚠ **The numbering does not divide evenly and this file does not pretend it does.** `#2-5` covers
four numbers over a commit whose own body opens *"FOUR FIXES HE ASKED FOR"* and then names three;
`#9-14` covers six numbers over a wave of DRY consolidations that came from
the principles review rather than from a playtest.
Grouping below follows the commits. **The gap is unestablished, not resolved** – if the exact
mapping matters, it needs his list and not an inference from a subject line.

---

## The checklist

### #1 – the age clock reads her DATE, not her month

- [x] **«23 года было в интерфейсе на главной написано на неделю раньше, чем случился сам день
  рождения»** – `ef776eb`. `kidAgeExact` was built on the birth MONTH, so her age rose on the first
  Monday of that month. **287 of 365 birth dates printed an age she had not reached**, 7,574
  (date, week) pairs over a career, by as much as six weeks; a 31 December date printed 19 while she
  was 17. It contradicted his ruling of 09.08 head-on and survived eleven waves because the guard
  measured the opposite direction – `birthday-announce.test.ts` bounded how far the ANNOUNCEMENT
  could lead the print and returned 0 for exactly the weeks that were wrong.
  Full record and the blast-radius table: [decisions.md, 18.08](../decisions.md).

### #2–5 – three defects he sent back, plus the review's first wave

- [x] **Lost birthdays – 14 a career, now 0** – `b93e178`. Dates 1–6 January and 31 December fall in
  the gap between the last career week of one season and the first of the next, so `weekOfDate`
  returned null and the girl silently got no note and no gift. A birthday the calendar cannot place
  is now carried by the first career week past it (`world/age.ts`, `birthdayYearIn`).
  **Verified 19.08, not assumed**: `npx vite-node tools/birthday-age-read.ts` reads
  *"birthday never fired: before 43 (over 7 dates), after 0"* and *"dates that lose one after:
  (none)"*. ⚠ The tool that once reported "0 lost" was fixed in the same commit – it `continue`d on
  exactly the years `weekOfDate` returned null for, then counted the remainder.
- [x] **Wild cards: the door admitted, the calendar showed shut** – `b93e178`. `homeWildCardPlace`
  answered FALSE without an event id and `Snapshot.tierOpen` is built per rung with no event, so the
  calendar judged every card on a rung the turnstile would have opened. `tierOpenFor` now scans her
  own season and asks the same function; it can never be more generous than the door, only as
  generous. The temporary exemption in `tests/ladder-floor.test.ts` is gone and the strict assertion
  is back (that file's own comment records the removal, and the owner's ruling on it:
  «есть дефект – чиним»).
- [x] **TB-04 – the eight condition points** – `b93e178`. A manual `skipEvent` now pays what a
  medical withdrawal pays. Ruled a FIX and not a tuning call; see
  [decisions.md](../decisions.md), 18.08.
  ⚠ **Shipped without a bench arm, declared rather than hidden**: no tool in `tools/` calls
  `skipEvent`, so the arm would have been null. That declaration is the case behind
  [the balance-methodology proposal](../plans/balance-methodology-proposal-2026-08-19.md).
- [x] **TB-01 / TB-02 / TB-03 / TB-07 – the review's first wave** – `b93e178`. One definition of the
  tiebreak serve rotation, owned by `match/scoring.ts` and mutation-verified; all three runtime
  import cycles closed and pinned by a real SCC detector (`tests/import-cycles.test.ts`) run against
  a control tree; fourteen stale claims corrected in the canonical context packs.

### #6–8 – the alternates list, `power()`, and the bench asking the real door

- [x] **The alternates list – the rung's MIDDLE** – `cc04337`. His answer to "every rung of ours is a
  cliff", after a probabilistic tail was refused twice
  («заявка станет частично броском кубика, а это реальная потеря в игре про планирование сезона»);
  what he asked for instead was «доп. окно допуска здесь просто, тогда как раз и проще планировать
  будет». Four places below the cut. **The world rolls and she does not**: `alternatePlacesOpen`
  draws how many of the field withdrew, once per event on its own sub-stream, never MAIN, and her
  queue position is arithmetic. Both numbers reach the card before she commits.
  ⚠ The withdrawal rate is DERIVED on his instruction – `ECONOMY.availability.injuryBaseChance` over
  the weeks an entry list already stands. No new balance constant entered the game.
- [x] **`power()` reads every skill** – `cc04337`, on his instruction «нам точно нужен один источник
  истины везде без дублей кода». It was `(serve+ret+composure+stamina)/4` and dropped
  GROUNDSTROKES, the attribute the rally weighs most. Reported as a CORRECTNESS fix rather than a
  balance lever, and measured as one: whole-population top-10 58% → 59%, with the per-band edges
  pulling in (untalented 21→31, gifted 91→85) and the LEVEL unmoved.
- [x] **`econ-bench` asks the door it claimed to be predicting** – `cc04337`. It pre-filtered on
  `availabilityStatus` while saying it skipped events `enterEvent` throws on – but `enterEvent`
  re-validates against `entryStatus`, which is availability PLUS the acceptance cut. **Third defect
  of this class in one day** (wild cards, age gates, this): two sides asking different functions
  about one question.

### #9–14 – the review's optimisation wave, and two guards that had stopped measuring

⚠ These six numbers cover work whose source is the principles review, not a playtest note. What
shipped under them, from `5aa1e9a`:

- [x] **DRY-1 the 8-week horizon** – three copies → `UPCOMING_WEEKS`. ⚠ SeasonScreen's two eights
  were a live divergence: the loop drew `CALENDAR_HORIZON` and the sentence printed `HORIZON_WEEKS`,
  so the screen could draw one horizon and describe another.
- [x] **DRY-3 tournament-card presentation** → `composables/eventCard.ts`. ⚠ `surfaceNote` and
  `surfaceVerdict` were the same function under two names – the version of this defect a grep can
  never find, because searching either name returns one copy.
- [x] **DRY-4 the allocation comparator** – three copies → `byAllocationPriority`, owned by
  `season/tournament.ts`, adding no new import edge.
- [x] **DRY-5 countries and flags** – five copies of `flagEmoji`, two of `COUNTRY_NAMES` → one
  module.
- [x] **DRY-7 competition-rank assignment** – two copies → `assignCompetitionRanks(rows, compare)`.
- [x] **Three dead exports deleted**, each after a word-boundary grep showing one hit: its own
  declaration. The dormant `HandoffView` fields are CONFIRMED dormant and left standing with a dated
  note – **the owner has not ruled on them**.
- [x] **The heavy-test lists have one source of truth** (`scripts/heavy-tests.mjs`); `sim.mjs` had
  been regex-parsing them out of TypeScript source and `units.mjs` kept a hand-copy. Proven inert:
  both scripts shard byte-identically before and after.
- [x] **`context:audit` added to CI**, where it was missing while living inside `npm run check`.
- [x] **Five false comments fixed**, each verified by grep BEFORE the rewrite, under the owner's
  narrowed TB-10/PR-19 ruling – fix what is false about behaviour, keep what records a decision.
  ⚠ The weather seam's *"NOT WIRED YET"* was the expensive one: **it was wired end to end at the
  review's own baseline, and the review was misled by that comment into reporting the wiring as
  missing.** TB-10's failure mode, happening to TB-10's own author.
- [x] **Two guards had stopped measuring, and both were re-aimed rather than relaxed.** The mirror's
  non-vacuity arm found ZERO "could not move" entries on its seed – it was passing nothing. The
  `rankTrack`-vs-`activeLadderOf` arm had had its week hand-moved twice already (49, 153); it now
  SEARCHES the wraps and goes red saying the distinction may be gone, which is a finding rather than
  a fixture to repoint.

### #15–16 – one colour ramp, and the epilogues come back

- [x] **The ramp** – `46998dd`, on his own question: «если шкала одна и везде одинаково работает, то
  зачем 5 разных копий? Если "родственная функция, не та же" – то наверняка можно сделать одну
  функцию с аргументами». ⚠ **The count in the brief was wrong and the agent checked it**: four
  implementations, not five, and the four were IDENTICAL – same hue span, saturation, lightness and
  midpoint, differing only in clamp ORDER. Verified at 10,001 swept points plus the negative,
  over-range and NaN tails, zero disagreements. There was nothing to parameterise; the app really
  does have one ramp.
  ⚠ **And the unit mix-up is a compile error now, not a comment**: `readingColor` takes `{ pct }`
  XOR `{ fraction }`, never a bare number. The honest residual is stated rather than hidden –
  `{ pct: 0.85 }` still compiles, because TypeScript has no nominal numbers. What is gone is the
  SILENT class.
- [x] **`ENDING_BLURB` restored**, on his call: «может быть мы просто не добрались еще до концовок и
  рано что-то удалять».
  ⚠ **AND THE COMMIT MESSAGE MISSTATES THIS ONE, so the ledger corrects it rather than repeating
  it.** `46998dd` reads *"nothing renders it" meant the ending screen is unbuilt*. **The ending
  screen is built and shipping** – `EndingScreen.vue` is mounted in `App.vue:1130` and the packs say
  so. What is true is narrower and still worth the reprieve: `ENDING_BLURB`
  (`engine/ending.ts:423`) has **no importer anywhere in `src/`** – six lines of authored epilogue
  prose that the shipped ending screen does not render.
  ⭐ **The rule that corrects**: an unconsumed EXPORT is a candidate for deletion; unconsumed WRITING
  is a candidate for the owner. A grep cannot tell them apart.
- [~] **The seven image frames stay** – two claims for deleting them collapsed on inspection.
  "GRAND SLAM CHAMPION" on the art is not a naming violation, because `slam.label` in our own
  calendar IS 'Grand Slam'; and the beaten opponent's surname is not legible.
  - [?] ⚠ **What that surfaced instead is about the code and is HIS call, flagged not touched**: our
    own tier labels are `WTA 125/250/500/1000` and `Grand Slam`, literally, while `CLAUDE.md`'s
    invariant says tournament and organisation names are fictional because ITF/WTA/ATP are
    trademarks – and the ITF rungs ARE fictionalised as `World Tour`.

### #17–20 – the professional table comes alive

- [x] **The live professional table (schema v53)** – `da9972f`, from his playtest: «таблица
  professional ranking не двигается вообще… И номер 1 мы обыгрывали на шлеме, кстати. Кажется что
  таблица просто "стоит"». He was right, and the cause was one line in `runAiTournament`: every AI
  event resolved and every finisher's points were computed, then `if (isFieldProId(playerId))
  continue` threw the field's rows away. A professional's standing was a pure function of
  (seed, seasonIndex), so nothing on court could move it – including losing to the player at a Slam.
  - **A TALLY, NOT ROWS**, and the byte objection that justified the drop is honoured: rows would be
    ~6,048 a season in a save pruned for 199 people; `fieldSeasonPoints` is 1,600 numbers, ~3 KB,
    measured before the shape was chosen.
  - **Verified moving rather than assumed**: over 40 weeks the #1 goes 7336 → 9636 and the top four
    RE-ORDER. 396 pros scored, 109,107 points awarded, and the probe throws if nothing was tallied.
  - **v52→v53 back-fills EMPTY, and that is a preservation**: every earlier career was played on an
    engine that discarded these results, so an empty tally is what those seasons contained.
  - [!] ⚠⚠ **THE FIRST CUT ADDED THE TALLY ON TOP OF THE DERIVED BOOK AND KILLED THE CAREER.** Fixed
    the same day in `1b22433` – see the entry below and
    [decisions.md](../decisions.md), 19.08.
- [x] **DRY-2 watermarks** – `useWatermark` exported and generalised. ⚠ THREE distinct missing-key
  rules were found where the brief assumed one, and `inboxMail` was REFUSED: its fact is a SET at
  per-letter grain, which no high-water mark can hold.
- [x] **DRY-6 the box score** – rows and meta shared; **the markup deliberately left per screen**,
  because neither screen has a mounted test and a markup move could not be mutation-verified.
- [x] **DRY-9 test helpers** – five families routed through `tests/helpers/`. ⚠ TWO were
  deliberately NOT merged: `codeOf` has three real shapes, and the 2-strip variant feeds a NEGATIVE
  pin (`.not.toMatch`) where a helper that reads LESS text turns the guard green.
- [x] **The document lifecycle** – both `-corrected` spec pairs resolved (each had BOTH halves
  `current`), the two August plans superseded, `now-next-later.md` created as the one delivery
  router, and `docs/context/engine-symbol-map.md` derived from the barrel's own imports.
  - [x] ⚠ **AND THE AUDIT COULD NOT CATCH THE `-corrected` CLASS – CLOSED LATER THE SAME DAY** in
    `20498b5`, hours after `da9972f` flagged it as needing `scripts/`. The rule reads the FILENAME
    CONVENTION only – an `x-corrected-<date>.md` beside an `x-<date>.md` requires the base to be
    `superseded`, an error naming the two lines that fix it, and a base superseded by anything OTHER
    than its own correction is a warning. No prose similarity and no title matching, which is what
    keeps it from costing somebody an afternoon on a false positive. Mutation-verified against a
    copy of the corpus: flipping the base back to `current` takes the run from 11 errors to 12 with
    exactly that message.
- [x] **One spelling for an age** (`ageInWords`) – the rule moved out of `markBirthday`'s inline
  `AGE_WORDS[turning] ?? String(turning)` before the voice branch could grow a second reader that
  disagreed with it. Unified across the birthday popup and the feed line on his instruction to bring
  them to one standard: the popup had five numeral bands and one 'Eighteen' while the feed had said
  "She is fourteen this week" since the birthday shipped – one birthday, three spellings, one
  screen. The change-over lands at twenty-one, where `ageInWords` returns the numeral.

### After the merge – three corrections and one climb, all on 19.08

- [x] **The live table corrected: winnings REPLACE a share of the book** – `1b22433`. The first cut
  added them on top, but `wtaPoints` is her WHOLE 52-week book and not a January opening balance, so
  it counted the same tennis twice. +24% inflation by mid-season, concentrated on the ~350 of 1,600
  pros who get a draw; the acceptance cuts read it and refused her, and a ten-season career reached
  the W tour in NO season. Corrected, the same career turns professional in season 2 and stays:
  30/43/45/43/61/62/55/60 W matches. Two further corrections on top, both caught by guards rather
  than by reading – the share is charged only to pros who PLAYED, and the per-season move is bounded
  (`FIELD.liveSwing`). Ruling: [decisions.md](../decisions.md), 19.08.
- [x] **The age-eligibility rule binds the FIELD, not the kid alone** – `1b22433`, on his ruling
  «да, это как раз защитит нас от 16 летних в топ-10». Gated on all four routes into a W draw.
  Ruling: [decisions.md](../decisions.md), 19.08.
- [x] **College birthdays get a diary entry** – `1b22433`, his words: «колледжевые годы получают не
  попап, а свою запись в дневнике, что механику не ломает». Four distinct lines for the four years;
  the prompt is still refused inside the four-year freeze and `world.birthdays` is untouched, so
  those years stay ABSENT rather than "gave nothing".
- [x] **'Martin' appended to `SURNAMES`** – his request, appended so nothing persisted is renamed.
- [x] **A pro CLIMBS into her chair instead of inheriting it** – `cacf5b8`, on a sixteen-year-old
  holding 65% of a top chair's book without playing a match: «вот я хочу, чтобы этого не было».
  `ageRampFloor` retired as a lever, `tenureRamp(seasons on tour)` owns the climb. Measured over 300
  seeds × 8 seasons: teens in the top 10 **59.21% → 28.63%**, in the top 3 **11.29% → 3.25%**.
  Ruling and the two wrong shapes that preceded it: [decisions.md](../decisions.md), 19.08.
- [x] **`CLAUDE.md` gotcha: a background task's "exit code 0" is not the command's exit code** –
  `9b41aa8`. Third variant of a hazard already named twice: on 19.08 the completion notice said
  *exit code 0* twice while the log said `CHECK_EXIT=2` and then `CHECK_EXIT=1`, sixteen real
  failures between them.

### The review's third wave, landing while this ledger was being written

⚠ **This wave was still live on 19.08 when the file was written.** Everything below `cacf5b8`
arrived after the checklist above was drafted and is recorded from the same source – the commits.
**The ledger is current through `faa5a6c`**; anything after that is not in it.

- [x] **TOK-4 – the world barrel gets a generated area-to-owner symbol map** – `e648985`.
  `engine/world.ts` re-exports the decomposed modules under their historical names for **277
  importers**, so the barrel is COMPATIBILITY and nothing answered discovery: a reader holding a
  symbol name had to open a 3,600-line file (~59k tokens) to learn which module declares it.
  `scripts/world-map.mjs` parses the barrel with the TypeScript compiler API, follows every
  re-export hop to the DECLARING file, and takes each module's own banner comment as its area name,
  **so the labels cannot drift from the source that writes them**. 233 symbols, 30 modules, a 22k
  map, plus a `--check` mode for CI and a one-symbol query that reads no map at all.
  Mutation-verified.
- [x] **YAGNI-2 – the reserved `conduct` penalty had no producer, so it goes** – `788aff8`.
  ⚠ **Checked as a schema question rather than assumed to be one**: `PenaltyReason` types
  `PenaltyRow.reason` and `PenaltyRow[]` is persisted (`WorldState.penalties`, v38) – but with no
  producer, no shipped save or fixture can hold the value, and the v38 migration never reads
  `reason`. So it narrows a declaration and not any data: no bump, no migration, no fixture.
- [x] **TOK-8 – size budgets become a reported warning** – `20498b5`. Every hub is over the review's
  suggested budget and two grew further while the review sat unread (`world.ts` 3,589 → 3,697,
  `protocol.ts` 3,466 → 3,511); 37 of 185 source files trip a trigger today.
  ⭐ **REPORTED, NEVER FAILING, and that is the design rather than timidity**: a build that goes red
  because a file grew is a build people learn to ignore, and then nobody has the number at all. A
  file may answer the question in writing with a `size-budget:` line, which is the written exception
  the review asked for, kept next to the code it excuses.
- [x] **The cohort gets a real fifth skill** – `faa5a6c`, from his own framing: «ты же вроде сделал
  хорошую формулу для него [power()]. Мне кажется надо на нее опираться, тогда у всех появится
  аналог пятого навыка». `rivalGroundstrokes` was `(serve + ret) / 2 + offset(±8)` – a third reading
  of the first two rather than a fifth axis – with two measured consequences: **no specialists**
  (0 of 199 rivals across five seeds could sit more than 8 points off what serve and return already
  said, so only the kid could specialise on the axis the match engine weighs most) and **no
  ceiling**. Now anchored on the mean of all four stored attributes, with
  `rivalGroundstrokePotential` the same function fed her ceilings.
  Measured (`tools/fifth-skill-probe.ts`): r(gs, (serve+ret)/2) **0.809 → 0.427**, deviation sd
  4.59 → 7.32, `|dev| > 8` **0/199 → 58.8/199**.
  ⚠ **One declared side effect**: the field's mean groundstroke rises 44.97 → 46.61, because
  composure and stamina are generated on higher bands than serve and return. She meets a marginally
  better-hitting field.
  ⚠ **Zero new draws on any stream** – both values come off the same one `gs:<id>` sub-stream draw
  the old formula spent, so the frozen MAIN capture reproduces byte-for-byte (41550 / `e6b0c709`).

---

## What is still open at the end of this wave

1. [ ] **No spec in `docs/specs/` for this wave's two balance changes.** `CLAUDE.md` invariant 4 –
   *"Balance changes ship with a bench run and a spec in `docs/specs/` recording predicted vs
   measured"* – was met on the measurement and not on the spec: the tenure ramp and the live table
   were both measured, and both records live in commit bodies and source comments only. Verified by
   `git log --diff-filter=A -- docs/` over the wave: the only documents added were
   `context/engine-symbol-map.md`, `now-next-later.md`, the human-voice trio and this ledger's own
   pair.
2. [x] **`docs/specs/round21-measured-2026-08.md` §4d described a retired knob as shipped** – its
   *"The arc's floor is 0.65 … she **inherits** it"* is exactly the behaviour `cacf5b8` removed, and
   its own verdict said the price was *"a price the owner should decide on rather than an agent"*.
   **Marked in place on 19.08 rather than rewritten**, because the measurement is still the honest
   record of what the field looked like on 17.08; the section now opens with the ruling that
   superseded it.
3. [x] ~~The `-corrected` pair class is uncatchable by `context:audit`~~ – **closed in `20498b5`**
   the same day it was flagged. Kept in this list so the flag and its closure are in one place.
4. [?] **The dormant `HandoffView` fields** – confirmed dormant, left standing, he has not ruled.
5. [?] **Our own tier labels are literal `WTA …` while the invariant says fictional** – flagged in
   `46998dd`, untouched, his call.
6. [?] **The balance methodology of the review's chapter 04** is written up as a proposal and is
   **not adopted**: [balance-methodology-proposal-2026-08-19.md](../plans/balance-methodology-proposal-2026-08-19.md).

## What is NOT in this ledger

`76cdc45` / `278dffe` – the human-voice wave – merged into this branch but is its own review and its
own proposal list ([human-language review](../review/human-language-2026-08-19.md),
[proposals](../plans/human-language-proposals-2026-08-19.md)). Only the part that collided with round
22 is recorded above: the birthday headings unifying onto `ageInWords`, and the pack conflict the
merge resolved in `docs/context/product-and-narrative.md`.
