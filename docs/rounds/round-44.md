---
type: round
status: live
area: life
last-reviewed: 2026-09-17
---

# Round 44 – the corpus becomes the game

Round 43 shipped the corpus as a DOCUMENT: 43 situations, 172 voiced openers, 516 replies, and the
frame pool he wrote on 17.09. The engine still runs the 11 entries it has run since wave 2. This
round closes that gap.

His ruling on scope, 17.09: **«доделываем здесь, дальше надо возвращаться к отношениям»** – and on
the old eight, asked directly: **«надо их причесать, актуализировать, дописать и использовать, я
считаю. Больше вариативности – хорошо. И добрый ситуативный юмор приветствуется.»**

## The shape of the thing, because it decides everything else

⚠⚠ **STEPS «TRANSCRIBE» AND «FRAMES» ARE NOT SEPARABLE, and the architect's first plan was wrong to
split them.** A live entry stores the frame and the quotation as ONE string:

```ts
opener: {
  roof: 'She put the kettle on. "Practice finally felt easy today."',
  away: 'She mentioned it halfway through the call. "Practice finally felt easy today."',
}
```

The document holds **only the quotation**, one per voice, precisely because 43 lifted the frame into
its own layer. So a transcription into the CURRENT shape has nothing to put in the frames: it would
have to invent them per row – the thing the pool exists to abolish – or duplicate the payload into
both fields, which erases the only difference between `roof` and `away`. **The shape change and the
transcription are one move.**

## ⭐⭐ THE CATALOGUE IS GENERATED FROM THE DOCUMENT, NEVER RETYPED

817 strings – 172 openers, 129 stance labels, 516 replies. **An agent retyping 817 strings produces
typos that no test can catch, because the tests compare against what was typed.**

⭐ Measured before this round opened: the document parses **completely and cleanly** – 43/43 rows,
172/172 openers, 129/129 labels, 516/516 replies, **zero rows that fail to parse**. So:

1. A one-off script reads `docs/specs/small-talk-corpus-2026-09.md` and emits the catalogue.
2. Its output is committed as ordinary source – no build step, no codegen in the pipeline, «boring
   TypeScript» intact.
3. **A test re-parses the document and asserts the catalogue matches it string for string.** That is
   what makes the document the source of truth rather than a draft somebody copied from, and it is
   the difference between a divergence being unlikely and being impossible.

## The wave, in two builders with a gate between

### Builder 1 – the mechanism. No new copy, not one word.

- **The shape.** `opener` stops carrying a frame and becomes one spoken payload per voice.
  `smallTalkOpener` joins a pool frame to it. ⚠ The law round 43 pinned stays pinned: the quoted span
  is IDENTICAL at both distances (`tests/wave3-presence.test.ts` §D) – now by construction rather
  than by convention, since there is only one payload.
- **The generated catalogue**, plus the round-trip test above.
- **The frame pool**: his 18 lines (9 `roof`, 9 `away`) from `docs/specs/the-frame-pool-2026-09.md`,
  with stable ids. The draw is on a purpose-scoped sub-stream, never MAIN.
- **The exclusion, his ruling**: each presence pool remembers its own last TWO, compared by **id**
  and never by rendered text – «roof remembers roof, away remembers away».
- **The schema, v80 → v81, the full six-part move.** His ruling: a frame may not change after a save,
  a reload, **or the pool growing**. Derivation survives the first two and fails the third, so the
  chosen frame id is PERSISTED on `LifeBeatRecord`. ⭐ The field is optional and old rows fall back,
  which keeps the migration trivial.
- **The eleven live entries migrate to the new shape**, keeping their own words: split each opener on
  its first `"` – the lead-in is dropped because the pool now supplies one, the quotation becomes the
  payload. ⚠ Some have no lead-in at all; those are already payload-only.
- **R3's key**: `the-stranger's-sock` → `the-strangers-sock`. An apostrophe in an id that gets
  persisted into `lifeLog`, compared in exclusion sets and read back by the album.
- Frozen-career re-stamp, and **K1–K5 re-run against the 51**.

### Builder 2 – the eight brought up to strength. New copy, therefore DRAFTS.

- **21 missing voice-entries.** `court-four` already has all four; the other seven have one each:

  | situation | subject | has | missing |
  | --- | --- | --- | --- |
  | `practice-clicked` | good-news | `deep` | sunny, fiery, quiet |
  | `line-call` | worry | `fiery` | sunny, deep, quiet |
  | `march-entry` | decision | `quiet` | sunny, fiery, deep |
  | `coach-real` | curiosity | `sunny` | fiery, deep, quiet |
  | `watching-players` | observation | `deep` | sunny, fiery, quiet |
  | `new-place` | worry | `quiet` | sunny, fiery, deep |
  | `beat-her-conqueror` | good-news | `sunny` | fiery, deep, quiet |

- **Tidy and bring the existing eleven up to the corpus's standards** – his «причесать,
  актуализировать». The 43's rules apply: no «today», no fact a `generated` kernel cannot license,
  contractions where she would use them, and the four voices publishing ONE factual edition of the
  same afternoon.
- ⭐ **«Добрый ситуативный юмор приветствуется»** – his, 17.09. It belongs INSIDE the quotation
  marks, where the voice carries it. Not in a frame: a frame wraps all 51 situations including the
  worries, and that is his own rule from the pool's rejected list.
- ⚠⚠ **Every one of these 21 entries is a DRAFT.** Invariant 4: he reads them before they ship, the
  same as the 516.

## Still open, and not this round's to decide

- The 516 replies and 172 openers are drafts he has not read.
- Four of the frame pool's eighteen lines are the architect's, marked DRAFT.
- R29 `fiery` and R12's converging `space` stance are recorded with the architect's concern intact
  and his ruling to keep them.


---

## OFF HIS OWN PLAY, 17.09 – two items on the psychologist's year

### 1. ⚠⚠ RE-CHOOSING THE YEAR'S WORK YOU ALREADY HAVE DOES NOTHING – a real defect, one line

His report: «у меня в межсезонье мигает группа плашек выбора что делать с психологом, но почему-то
не выбирается повторно существующая».

**`world/psychologist.ts:536`:**
```ts
if ((world.psychologistFocus ?? null) === focus) return
```

That early return never reaches line 544, where the season is stamped
(`world.psychologistFocusSeason = psychologistFocusSeasonFor(world.week)`). The sequence he hit:

1. He reaches the off-season carrying LAST season's focus, so `psychologistFocusSeason` is last
   season's, `psychologistFocusRefusal` returns `null` for every focus, every option is open, the
   marker is up and (since round 43) the block glows.
2. He presses **the one he already has** – «same again this year» – and the setter returns on the
   spot. No stamp.
3. `psychologistFocusOpen` is still non-empty, so the marker never clears and the block keeps
   glowing. His choice was never recorded.

⭐ **Choosing a different focus works**, which is exactly why his sentence names the existing one.

⚠ **The guard is not wrong about what it was for** – not writing a feed row for a no-op change – but
**the season stamp is not a no-op.** Confirming last year's work FOR THIS SEASON is a full decision
and the model has nowhere to put it. The fix separates the two: the stamp (and the refusal it
drives) is unconditional; the ledger row stays suppressed when the focus itself did not move.

⚠ `psychologistFocusSeason` is persisted, so when it is written changes what a save holds – but the
field already exists and no schema move is needed. It DOES want a test that a re-affirmation clears
the marker, mutation-verified by restoring the early return and watching it go red.

### 2. A CONFIRMATION BEFORE THE YEAR IS SET – his ask, "вдруг человек промахнулся"

The pick is a season-long commitment that LOCKS once taken (`PSYCHOLOGIST_FOCUS_SEASON_REFUSAL`
closes the row for the rest of the off-season), and it is taken by a single press on a small
half-width card. A misfire costs a year.

`SupportStaffTab.vue` already owns the idiom – `hireMessage` / `releaseMessage` drive the same
confirm dialog for hiring and letting go – so this is the existing pattern asked of one more control,
not a new component.

⚠⚠ **AND THE DIALOG IS MEASURED AGAINST A PHONE BEFORE IT SHIPS** (round-20 #1's standing rule): a
mounted assertion that its dismiss control's box is inside 375x667, proved by mutating to the
too-tall version and watching the test fail. A blocking overlay taller than the screen is how a
career once stopped dead.

⚠ The confirmation's wording is NEW PLAYER-FACING COPY and therefore a DRAFT for him.
