---
type: round
status: current
area: rounds
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


### 3. ⚠⚠ THE HITTING PARTNER IS MISSING FROM THE TEAM BUDGET – and it is not cosmetic

His report: «спарринг не учитывается в недельных расходах на верхней плашке на вкладке тренеров, его
там просто нет».

**`src/composables/coachingBudget.ts:156`** – `seats` pushes `coach`, `masseur`, `psychologist` and
stops. The wire is complete (`sparringSalaryCents` crosses at `snapshot.ts:283`, written by
`snapshot.ts:1867`); only the composable was never extended when F2 shipped the seat.

⚠⚠ **AND `committedCents` IS SUMMED OFF `seats`** (line 142, «THE METER IS THE PAYROLL»). So a
family with a hitting partner is not merely missing a row – **the bar, the «committed» figure and
the «/week free» figure are all short by his salary.** The tile under-reports what the family has
promised, which is the one thing that tile exists to get right.

⭐ **The comment above the strip promised this could not happen**: «a fourth seat added later joins
the list without either surface being edited (`seats`)». It was aspirational – `seats` is a
hand-written push per seat, so a fourth does NOT join on its own. That promise is probably why
nobody checked. The fix carries a test that counts seats against the snapshot's hired flags rather
than against a literal, so a fifth seat cannot repeat this.

### 4. THE COACH'S PRICE MOVED ON ITS OWN, AND HE NEVER ASKED FOR A RAISE

His report: «я выбрал тренера за 2.2к в новом сезоне, сезон прошел хорошо, но во-первых, его цена в
неделю упала до 1.8к, а во-вторых он не приходил за добавкой. Мы сделали письма и функционал этот?»

**The second half answers first: no, that was never built.** The masseur's annual ask is round 43 #4
(`ECONOMY.masseur.raisePerYear`); there is no coach equivalent anywhere in `ECONOMY.coach` or
`world/coachMarket.ts`. He has never been asked for one and none was promised.

⭐⭐ **But the first half is the interesting one, because the coach ALREADY gets raises – silently,
and they can go DOWN.** His weekly price is not fixed at hire. It is re-derived every week:

```
bandedRateCents(rate, age, tier, band) = facilityRateCents(age, tier)
                                       + round(max(0, rate - court) * band)
```

– the court's share moves with HER AGE, and `band` is `coachRetainerBand(wtaRank)`, a STEP function
on her ranking: `≤ 10 → x4.5`, `≤ 100 → x2.0`, otherwise `x1`.

⚠ **So a man on the payroll is silently re-priced by her results**, with no letter, no decision and
no consent on either side – and a 2.2k → 1.8k fall is a **0.82x** move, which is not a band crossing
(those are x2 and x2.25), so the cause is in the court share or the rate rather than the band, and
naming it needs his actual career rather than a reading of the source.

⚠⚠ **The design question underneath, and it is his:** the number already behaves like a raise, it
just does so invisibly and in both directions. A coach whose fee DROPS because his player had a
quiet season is the half no real coach would accept, and it is the half a letter would expose.
Whether the fix is «fix the fee at hire and let him ASK, like the masseur» or «keep the float and
letter it» is a design call, not a repair.

⚠ **Next step is his save, read through `decodeExportFile` alone** – the standing protocol: nothing
is copied into the repo and only derived statistics leave it. Without the career the 0.82x is a
guess, and this round does not ship guesses.


---

## ⚠⚠ INHERITED FROM ROUND 42, AND ONE OF THEM HE HAD BEEN WAITING FOR

His 17.09, on the coach's raise: **«надо доделать, я ждал этого в предыдущей волне»**. He is right,
and it is a process failure rather than a forgotten idea – **#51 is fully specified in round 42's
ledger, with his own corridor, and has stood at `[ ]` since 16.09.** Round 43 even wrote the
sequencing down: «there is no annual-ask machinery in this game at all … build the masseur's first
and #51 inherits a tested mechanism». The masseur's shipped. Nobody came back.

⭐⭐ **THE STRUCTURAL CAUSE, because this will happen again otherwise.** `/pull-request`'s step 4c
exists precisely to stop items going quiet – it was added on round 29 #18, after an audit found a
round-8 item open for 34 days. But **it reads the CURRENT round's ledger only.** An item left `[ ]`
in an older ledger is invisible to every PR that follows, because no wave ever mentions it again.
The rule that would have caught this: **a round opens by auditing the previous round's unticked
items and either carrying them in or saying why not.**

⚠ **And the audit found two boxes that were simply never ticked** – #48 (the sparring seat) and #50
(chemistry) both SHIPPED in round 43 while their round-42 boxes stayed `[ ]`. A stale ledger is how
three genuinely open items hid among five.

**Genuinely open and carried in:**

### 5. ⭐⭐ #51 – THE COACH'S FEE IS FIXED AT HIRE, AND HE ASKS. RULED 17.09.

His two sentences settle both halves. On the silent re-pricing: **«мне кажется это не корректно»**.
On the fix: **«"зафиксировать при найме и пусть просит, как массажист" – верно»**.

**What is wrong today.** The hired man's weekly figure is not stored anywhere. It is re-derived every
week as `facilityRateCents(her age, tier) + round(max(0, rate - court) * coachRetainerBand(her WTA
rank))`, so the family's payroll moves with her results, her birthdays and nothing either party
agreed to. It can fall, which is the half no real coach would accept, and it happened to him:
2.2k → 1.8k across a season that went well.

**The shape of the fix:**
- **The agreed weekly figure is PERSISTED at hire** and does not float. ⚠ That is a new world key
  and therefore a schema move – named here rather than discovered mid-build.
- **He ASKS**, on the masseur's tested annual mechanism, and his ask reads a **PROGRESS SCORE**
  rather than a single title – which is #51's own content and his own objection to the first
  draft: «кажется, что самого факта такого единственного титула маловато, нужна какая-то общая
  оценка прогресса». Components the world already holds: rank movement over the year, realised
  development against remaining headroom, titles weighted by tier – and now that F1 has landed, the
  **residual against expectation**, which is the best of the four, because a coach who got more out
  of her than the odds said is exactly the one who should ask.
- **Corridor 5–15%, ceiling the rank band, refusal = he works out the season.** All his, from #51.
- ⭐ **And he never asks for less.** The downward half is deleted rather than lettered: a contract
  that falls because she had a quiet season is the thing he called incorrect.

⚠ **The market's own quotes go on floating, and that is correct** – what a NEW coach costs is a fact
about the market and her standing. What stops floating is the fee of a man already on the payroll.

⚠ **The letters are new player-facing copy and therefore DRAFTS.** The masseur's ask is the model
for their shape, not their words.

⚠ **His career is coming** – «карьеру пришлю чуть позже». The 2.2k → 1.8k is a 0.82× move and the
band's steps are ×2 and ×2.25, so the cause is in the court share or the rate, not the band. That
number gets named from the save through `decodeExportFile` alone before the fix is written, because
a repair aimed at the wrong term is how a null result gets manufactured.

### 6. #46 – SHOW THE PLAYER WHAT EVERY TRAVELLING SPECIALIST BUYS (his 15.09). Open, untouched.

### 7. #52 – THE CHEMISTRY MARKER ON THE COACH CARD (his 16.09, icon handed over). Open: C1 shipped
the mechanic in round 43 and the card still carries no marker.


---

## ⭐⭐⭐ 8. HIS CAREER, READ (17.09) – «это было максимально больно»

Read through `decodeExportFile` alone; nothing copied into the repo, only derived figures leave.
Week 777, age **28.76**, schema v81 on read.

### What actually happened

⚠ **The architect's first season table was off by one year** and the feed's own wrap-up milestones
corrected it (`w673 = Season 2043 wrap`, `w725 = Season 2044 wrap`). The true shape:

| season | W–L | points | end rank |
| --- | --- | ---: | ---: |
| 2043 | 36–20 | 2,764 | 22 |
| **2044** | **42–18** | **4,008** | **13** |
| **2045** | **26–23** | **1,584** | **59** |

He is **literally right about the Slams**: both mid-match retirements were in 128-draws.
**w710** (2044, Round of 16) and **w754** (2045, Round of 64).

### ⭐⭐ The finding that explains the rest: HER GROWTH ENDED AT WEEK 633

`ageFactor` returns **exactly 0** from `declineStart`, and hers is crossed. Computed with the
engine's own helpers, not by hand:

| | |
| --- | --- |
| `declineStart` drawn for this career | **26.41** |
| 17 weeks lost to injury pull it earlier by | **−0.43 years** |
| `declineStart` EFFECTIVE | **25.99** – crossed at **week 633** |
| years in decline at w777 | **2.77** |
| `ageFactor` (the growth term) now | **0.00000** |
| loss per attribute per season | `0.00035 × (1 + 2.77 × 0.24) × 52` = **3.0%**, accelerating |

⚠⚠ **And she still has headroom she can never reach.** serve −3.3, return −4.4, stamina −5.8,
groundstrokes −4.3 below her own potential – `development.ts`'s own note says it: «whatever is still
unfilled at that age is» gone.

⭐⭐⭐ **THE ENGINE ALREADY PREDICTED THIS EXACT SHAPE FOR A PLAYER AT HER LEVEL.** `ECONOMY`'s
`declineAccel` comment, round 38 #3d: «she is at 47 on four attributes where the tour's elite sit at
**65–70** – so **any loss at all is decisive there**. This dial softens the slope; **the level is
C2's question and it is still open.** Said out loud so the next reader does not credit this change
with a fix it does not deliver.» Her four non-composure attributes are **54–63**. She was ranked #13
on a below-elite skill set carried by composure 78 – and 3% a season off that base is a cliff.

### The shoulder: four warnings, four pushes, one breakdown

`knockHistory` – w676 `push`, w685 `push`, w699 `push`, **w709 `push` with `brokeDown: true`**. The
2044 titles (w679, w694, w700) were won in the gaps between them; the retirement at w710 and the
shoulder injury at w711 close the sequence. ⚠ **This is not a reproach**: the model did exactly what
it says, and round 43 #9 stood the knock-cadence tuning down on his own «по ноккам отбой». It is
recorded because the causal chain is legible in the save and answers «why at the Slam».

### ⚠⚠ WHAT THE FOUR SEATS DO – AND NOT ONE OF THEM TOUCHES THE AGE CURVE

This is the gap between what the seats promise and what a player buying all four expects.

| seat | since | what it actually moves |
| --- | --- | --- |
| coach `elit-4` | – | development rate **while `ageFactor` > 0**. At 0 it multiplies zero. |
| masseur | w222 | shortens layoffs (his w420 injury shows `weeksSaved: 1`) and rehab |
| psychologist | w280 | `herself` focus – **`composureBonus` is 0** |
| hitting partner | w673 | rust between matches (`world.form`) |

⭐ **`composureBonus: 0` is worth his eye.** The +5 composure HEADROOM accrues only on the
`'coolhead'` focus; his psychologist has been on `'herself'`. Both are legitimate, and nothing on
screen says one of them is the only route to the ceiling lift.

⚠⚠ **The honest summary: he bought four specialists against a decline, and not one of them is
aimed at it.** The coach multiplies a growth term that is zero. That is a DESIGN question, not a
defect – and it is the same question round 38 left open as C2.

### ⚠ What could NOT be determined from the save, said rather than guessed

**His «элитные отпуска» cannot be counted.** `world.vacations` is pruned
(`planner.ts:485` keeps only `week >= from`) and the feed is capped at 402 rows for a 777-week
career, so the holidays he took are simply not in the file. Whether they did anything is a question
for a bench arm, not for this save.


---

## ⭐⭐⭐ 9. HIS REVIEW OF THE 516 (17.09) – EIGHT FINDINGS, ALL EIGHT VERIFIED

He read the extracted corpus and returned eight findings. **Every one was checked against the file
before anything was touched, and every one is real** – no false positives. His verdict: «the voice
work is good enough to preserve. I'd repair the factual seams rather than conduct another broad
prose rewrite.»

⚠ **They are all one family: a line that asserts more than its kernel licenses.** That is the law
the corpus was rebuilt around, and it is the law it is still leaking at the seams.

### Repaired immediately – mechanical, and one of them was time-critical

- ⭐⭐ **R18's ID asserted the loss its gate refuses to assert.** `the-loss-she-is-still-carrying`
  against a kernel that says only «a match she played is still in her head», gated on
  `played-recently`, which licenses participation and not a result. **Renamed to
  `the-match-she-is-still-carrying`.** ⚠⚠ **This was the last moment it could be done**: an id is
  persisted into `lifeLog` and becomes append-only once a career has seen it, and the catalogue has
  not merged yet. A day later it would have been permanent.
- **R15 published two editions of one number.** The kernel says three repackings; `quiet` said «a
  couple». Re-aligned to three – «same event, four voices» is the instrument, and a voice may
  interpret the afternoon but not restate its arithmetic.

### ⚠ The four he ruled must be resolved before the catalogue is trusted

1. **[P1] R36 describes an ending she did not witness.** The kernel and two openers put her there «at
   the end of it»; **all four `invite` replies say she left before it**, and `quiet`'s `respond` even
   has them «walked off fine». One situation cannot hold both. His fix: the kernel becomes «when she
   left, both were still moving properly», the two openers follow it, and «Ask who won it» is
   replaced by something the row can answer.
2. **[P2] R44 invents the calendar gap its own note says it does not name.** «Two quiet days
   coming. Nothing planned» IS a calendar fact – R17's class exactly. ⭐ **And the fix is cheaper than
   he proposed**: `clear-next-week` now EXISTS, built in round 43 at his own ask, so the row can be
   GATED rather than made hypothetical. The line stays as written and becomes true.
3. **[P2] R30 adds a result and a competitive history no `generated` kernel licenses.** `fiery`'s
   «and then they called it off anyway» is an outcome the kernel does not hold; `deep`'s «people I've
   shared a draw with for two years» is longitudinal competitive history.
4. **[P2] R34 crosses the boundary its own note draws.** The note says the row asserts nothing about
   her second serve; `invite` then establishes a persistent technical pattern – «Every time», «I've
   never once just gone». `played-recently` licenses participation, never a playing habit. His
   suggested label: ask what she notices immediately before the better players move.

### ⚠ The rest, recorded and not yet repaired

5. **[P2] Three rows manufacture ongoing relationships**, which the implementation contract forbids
   («an invented name must not silently become a relationship the world must honour»): R16's «we've
   shared a warm-up a few times» – in the row that was REPAIRED on 17.09 for exactly this; R29's «we
   talk a bit more now»; R2's «I've said nothing for three weeks».
6. **[P3] Two parent labels manufacture four similar non-answers.** R33 asks whether the behaviour
   helped and R36 asks who won; neither kernel licenses an answer, so all four voices must decline –
   honest once, a dodge four times, and it wastes the row's whole instrument. **The label is the
   defect, not the reply**, which is the builder's own finding from the writing pass, independently
   reached.


### ⚠⚠ 10. FOUR GATED ROWS MAY BE UNREACHABLE, AND R44 JUST BECAME THE FOURTH

R44 is gated on `clear-next-week` at his ask, which repairs the seam his review found. ⚠ **But it
walks into a measured problem rather than away from one.** Builder 1's K5 run reported twelve voice
columns never drawn in a 25-year walk, and named the rows: **`alone-or-with-them` (R8),
`the-week-with-nothing-in-it` (R17) and `the-money-she-did-not-ask-about` (R20)** – every one gated,
every one at `college` / `independent`. **R44 now joins them.**

⭐ **The tell that this is NOT about the new predicate:** R8 and R20 are gated on
`march-entry-open`, which has shipped for waves. If a long-standing gate is as unreachable as the
new one, the fault is in the STAGE interaction – the college freeze – and not in
`clear-next-week`'s two clauses.

⚠ **The architect's own first probe of this was INVALID and is not evidence.** It set `world.week`
by hand on a fresh `createWorld`, which never advances the life stage, so it reported `school` for
all 2,700 weeks it walked. Recorded because a broken arm that produces a plausible number is exactly
how a false null gets manufactured here. The standing finding is the BENCH's, which walked real
careers.

**Owed:** decide whether this is a bench-fixture limit or a real gate/stage mismatch, and say which
by measurement. Until then four rows and twelve voice columns are written, shipped and never seen.


---

## BUILDER 2's SPEC – the eight brought up to strength, and his six review findings

One builder, both jobs, because they are the same prose in the same file and splitting them would
re-stamp the frozen careers twice for one wave.

### ⭐⭐ THE ARCHITECTURAL DECISION, TAKEN RATHER THAN DEFERRED

The eight legacy situations are hand-written in `SMALL_TALK_SHIPPED` (`world/lifeBeat.ts`) while the
43 are generated from the document – `SMALL_TALK_SITUATIONS = [...SHIPPED, ...CORPUS]`. **The eight
move INTO the document and `SMALL_TALK_SHIPPED` disappears.** Reasons, in order:

1. **One source of truth.** The round-trip test then covers all 51 instead of 43, and «fixed in the
   code, document drifted» stops being possible.
2. **His tidy-and-extend pass is ONE file he reads**, not two in different formats.
3. The alternative – hand-writing 21 entries into a TypeScript literal – is exactly the 817-string
   retyping hazard this round was built to abolish.

⚠⚠ **TWO HARD CONSTRAINTS ON THE MOVE:**
- **The eight ids MUST NOT CHANGE.** They are persisted in `lifeLog` and re-rendered by the album, so
  a renamed key orphans an old career's record. `court-four`, `practice-clicked`, `line-call`,
  `march-entry`, `coach-real`, `watching-players`, `new-place`, `beat-her-conqueror` – verbatim.
- **Their banner comments carry owner rulings** and must survive as the document's prose, not be
  dropped in the move. `court-four`'s four-voice note and `practice-clicked`'s «a practice that felt
  easy is a mood, never a training gain» are rulings, not decoration.

### The 21 missing voice-entries – DRAFTS, every one

`court-four` already has four voices. The other seven have one each:

| situation | subject | has | to write |
| --- | --- | --- | --- |
| `practice-clicked` | good-news | `deep` | sunny, fiery, quiet |
| `line-call` | worry | `fiery` | sunny, deep, quiet |
| `march-entry` | decision | `quiet` | sunny, fiery, deep |
| `coach-real` | curiosity | `sunny` | fiery, deep, quiet |
| `watching-players` | observation | `deep` | sunny, fiery, quiet |
| `new-place` | worry | `quiet` | sunny, fiery, deep |
| `beat-her-conqueror` | good-news | `sunny` | fiery, deep, quiet |

⭐ **His 17.09 ruling travels with them: «добрый ситуативный юмор приветствуется»** – and it belongs
INSIDE the quotation marks, where the voice carries it. Never in a frame: a frame wraps all 51
situations including the worries, which is his own rule from the pool's rejected list.

### His six review findings, in his own order of severity

1. **[P1] R36 describes an ending she did not witness.** Kernel and two openers put her there «at the
   end of it»; all four `invite` replies say she left before it; `quiet`'s `respond` has them «walked
   off fine». His fix: the kernel becomes «when she left, both were still moving properly», the
   openers follow, and «Ask who won it» is replaced by something the row can answer.
2. **[P2] R30 asserts beyond its kernel** – `fiery`'s «and then they called it off anyway» is an
   outcome the kernel does not hold; `deep`'s «people I've shared a draw with for two years» is
   longitudinal competitive history.
3. **[P2] R34 crosses its own stated boundary** – the note says the row asserts nothing about her
   second serve and `invite` establishes a persistent technical pattern. His suggested label: ask
   what she notices immediately before the better players move.
4. **[P2] Three rows manufacture ongoing relationships** – R16's «we've shared a warm-up a few
   times» (in the row repaired on 17.09 for exactly this), R29's «we talk a bit more now», R2's
   «I've said nothing for three weeks».
5. **[P3] Two labels manufacture four similar non-answers** – R33 «whether it seemed to help her»
   and R36 «who won it». **The label is the defect, not the reply.**
6. R15 and R18 are already repaired.

⚠ **His own scope instruction governs: «I'd repair the factual seams rather than conduct another
broad prose rewrite.»** A line not named above is not to be improved.


---

## ⭐⭐⭐ 11. WHERE THE CHEMISTRY WENT (his 17.09: «я не увидел её в игре нигде»)

He is right, and the point of loss is nameable rather than vague.

### ⚠⚠ THE MECHANIC RUNS AND THE NUMBER NEVER CROSSES THE WIRE

`coachPairs` is read in **seven engine files** – `chemistry.ts`, `development.ts`, `phaseGrowth.ts`,
`world/form.ts`, `world.ts`, `state.ts`, `migrations.ts` – so it is live and it moves her development
every week. And **`src/shared/protocol/` does not carry it; `snapshot.ts` does not build it.** The
UI cannot render a gauge for a number it is structurally unable to see.

⭐ **So this is not «the card marker was not built». The PREREQUISITE for every visible half was
never built, and nobody named it as owed** – not the spec, not the round-43 ledger, not the PR.

### The chain, in order

1. **16.09** – he raises three items: **#50** the chemistry design, **#51** the raise basket, **#52**
   the card marker with the icon handed over.
2. `the-chemistry-2026-09.md` is written as the buildable form of #50 **plus** #51 and #52, and says
   of itself: «**Nothing here is built.** It ends in numbered open questions with recommendations».
   §8a designs the gauge and **he ruled it**: C11 «yes, and by GRADIENT – his design, and it is better
   than the recommendation it answers», C12 «the figure stays, with the sign», struck the architect's
   own «no percentage anywhere» himself.
3. **Round 43 builds C1 – the engine half only.** v79 ships.
4. **#51 and #52 stay `[ ]` in ROUND 42's ledger.** `/pull-request`'s step 4c reads the CURRENT
   round's ledger only, so neither appears in any PR that follows. Same mechanism that lost #51 and
   that he caught this morning.
5. **17.09 – the architect ticks #50 as shipped during the audit. Too generous, corrected the same
   day to `[~]`**: his own design makes the RATE the signal the player reads («если химия прибавляется
   по 3-5-7% в год, возможно, это не самый подходящий тренер»), and a rate nobody can read is not a
   signal.

### What is owed, and it is four things rather than one

| | owed | state |
| --- | --- | --- |
| **the wire** | `coachPairs` → snapshot, as the shape the UI needs | **not built, never named** |
| **the gauge** | §8a: gradient, light→bright green up, orange→red down; the FIGURE stays with its sign | designed, ruled 16.09, not built |
| **the icon** | he handed one over | not in `public/` – to be re-sent |
| **#52 the card** | marker in the bottom-right corner, price moves to the top-right | not built |

⚠ **The accessibility constraints he set are part of the design and travel with it**: the fill
FRACTION must carry the sign too, because red/green is the commonest colour-vision confusion; the
neutral must read «nothing has happened yet» rather than «bad»; and `--accent` stays the icon's so
the two never compete.


---

## THE WAVE'S REMAINING SEQUENCE (his 17.09: «добавляй в эту волну и продолжай пошагово»)

One builder at a time, the architect's gate between each, one final gate over the whole wave.

| # | step | state |
| --- | --- | --- |
| 1 | the corpus into the engine, generated and round-tripped | ✅ gated |
| 2 | the decline bench and the four seats | ✅ gated, coach row held at 0 |
| 3 | the eight into the document, 21 voices, his six findings | 🔨 running |
| 4 | the fairness pin re-aimed, the sweep re-run with the coach row LIVE, the constant chosen by measurement, Q2's floor re-tested | queued |
| 5 | the chemistry made VISIBLE: the wire first, then §8a's gauge, then #52's card marker | queued |

⚠ **Step 5's order is not a preference.** The gauge cannot be built before the wire, because
`coachPairs` does not reach the snapshot at all – that is the finding, and building the visible half
first is how it stayed invisible for a whole round.

⚠⚠ **AND THE WAVE IS NOW LARGE, WHICH IS SAID RATHER THAN DISCOVERED AT THE PR.** Round 43 shipped
67 commits and its body needed a «what the round did not do» block to stay honest. This one already
carries a schema move, an 817-string catalogue, a development-model change and two UI surfaces. If
the final gate's diff stops being reviewable, the right answer is to say so and split the PR, not to
ship a body nobody can read.

### Still carried and NOT in the five steps above – his items, waiting on his priority

- **#51** the coach's fee fixed at hire and he asks – ruled 17.09, needs a schema key. **STILL OPEN**,
  and deliberately: it is its own pass (§13's row d).
- ✅ **Re-affirming the psychologist's year does nothing** (`psychologist.ts:536`), and the confirm
  dialog before the year is set. **SHIPPED** – see «the leftovers pass» below.
- ✅ **The hitting partner is missing from the team budget**, and `committedCents` is short by his
  salary. **SHIPPED.**
- ✅ **#46** show what every travelling specialist buys. **SHIPPED**, in his own approved words.
---

## ✅ WHAT BUILDER 2 DID – the eight moved, 21 voices written, six findings closed

### The move, and the one thing it cost

`SMALL_TALK_SHIPPED` is **deleted**. The eight are rows `R45`–`R52` of
`docs/specs/small-talk-corpus-2026-09.md` and `SMALL_TALK_SITUATIONS` is now simply
`SMALL_TALK_CORPUS`, so the catalogue has ONE source and the round-trip pin covers **51 rows instead
of 43**: 204 openers, 153 labels, 612 replies and `court-four`'s 4 shared second beats.

⚠ **The document format could not say one thing, and that is the whole of the machinery this needed.**
A `story` has a SECOND BEAT – the incident every route hears before its own branch, told in her own
words, so it is per voice. `court-four` is the only such row in the game. The parser, the emitter and
the round-trip pin each learned an optional `**shared**` block: strict, all four voices or none, with
its own count asserted so a block that silently stopped matching cannot read as «this row never had
one». Two new mutation arms were RUN, not asserted – deleting the block from the document alone
(**2 RED**, including the negative half) and renaming one of the eight ids in the document alone
(**7 RED**).

⚠⚠ **The eight ids are unchanged and are now pinned by name**, first in the array and first in the
document, because `pickInt` over the filtered pool reads POSITION and a renamed id orphans a
`lifeLog` row. Their refs run last (`R45`–`R52`) so `R1`–`R44` keep the numbers his review uses.
Every ruling their banner comments carried moved into the rows' own prose.

### The 21 – DRAFTS, marked NEW line by line beside the eleven marked HIS

Checked by script against the law they are written under: **0 duplicate payloads across all 973
authored strings, 0 masculine pronouns outside `court-four`** (whose seven remain pinned by count),
0 digits, prices, em-dashes or Cyrillic, every opener a single quoted span. No new line asserts a
result, a placing, a longitudinal history or an ongoing relationship; the gated rows say only what
their fact licenses – `coach-real` asks about a coach's quality and never answers it, `line-call`
never says she lost, `march-entry` never names a price, and `beat-her-conqueror`'s «four» is the one
number in the document a gate actually checks.

### His six findings

1. **[P1] R36** – kernel, both openers, the label and **four** `invite` replies rewritten; `quiet`'s
   «walked off fine» repaired. ⚠ **A fifth line carried the same claim and his inventory did not name
   it** – `sunny`'s `respond` «still running at the end» – so it is repaired WITH them and reported
   in the row, because leaving it would have left the row describing an ending she did not witness in
   one voice of four. **His line to put back if he wants it.**
2. **[P2] R30** – both openers: `fiery`'s outcome and `deep`'s two-year draw history.
3. **[P2] R34** – his own suggested label, and four `invite` replies that describe the players she
   watches rather than her own second serve.
4. **[P2] R16 / R29 / R2** – the three manufactured relationships.
5. **[P3] R33** – the label replaced and its four replies rewritten to answer it (R36's is finding 1).
6. R15 and R18 were already repaired and were not touched.

⚠ **Three lines his findings do NOT name are reported in the document and left exactly as they are**,
on his own scope instruction: R36 `fiery`'s «three hours», R33 `quiet`'s «twice now», and R34's
`respond` block, whose label invites her to talk about her own practice.

### What it cost the frozen careers, and what it did not

**35 cells of 98 moved; 63 held byte for byte. Exactly ONE key moved on every career: `lifeLog`.**
No schema, no migration. ⭐ The block at the head of `tests/coachTravelEdgeFixtures.ts` **predicted
this one in as many words** – «it will change for a reason that looks unrelated: a longer
`FREEZE_WEEKS`, or one corpus row given a `school` stage» – and six of the eight declare `school`,
which is the stage a 156-week career never leaves.

⚠ **The frozen MAIN capture is unmoved: 41550 draws / `e6b0c709`, re-run green.** A bigger catalogue
takes no draw – `rollSmallTalk` derives the same three keys in the same order whatever the pool holds
– and `rngMain` is byte-identical between the arms on all five cells, reproducing the three canonical
fingerprints.

⚠ **`tests/round42-small-talk-exchange.test.ts` §G widened from one column to four and that is REAL,
not a pin edited to match the code**: `line-call`'s «Tell her what worries us» is the §8d.1 label his
15.09 revision never reached, it is still his, and it is now answered by four girls instead of one.
Nothing was weakened; the growth is said out loud in the case itself.


---

## ⭐⭐⭐ 12. WHO DECIDES TO LEAVE, AND WHEN – read out on his 17.09 question

He asked the right question against the §8f finding: «+1 год сам по себе ок. Меня интересует
ГРАДИЕНТ и вообще понимание кто когда собирается или уходит», with two cases – **Zoe, who fell forty
places in a season**, and **someone who wants to stop at 25 at the peak of fame**.

### The model has exactly TWO doors

| door | opens | what it reads |
| --- | --- | --- |
| **plateau** | age **24** | no rung cleared for **3** seasons **AND** the rank flat – no season in the window beat her best from before it, and the window's ranks sit inside **20** places of each other |
| **age** | age **29** | asked every off-season from there; becomes the LAST asking when her physical share falls to **55%** of peak (`lastOfferPeakShare`) |

### ⚠⚠ ZOE HAS NO DOOR, AND THAT IS DELIBERATE RATHER THAN AN OVERSIGHT

`plateauReading`'s own comment rules her out in advance:

> «CONDITION 2 IS A CONJUNCTION AND BOTH HALVES ARE LOAD-BEARING. **«No improvement» alone would fire
> on a career that is FALLING APART – which is a different story and one the natural end should not
> be telling.**»

A collapse is excluded ON PURPOSE, because the plateau means «she is where she is going to be» and a
collapse means something else. ⭐ **But the story it defers to was never built.** His instinct is
pointing at a THIRD door – «it went wrong, and she knows it» – and there is no code behind it.

### ⚠ AND THE 25-YEAR-OLD LEAVING AT THE PEAK HAS NO DOOR EITHER

The plateau needs three flat seasons with no rung cleared; a player at the peak of fame has just
cleared rungs, so it cannot fire. The age door opens at 29. **Stopping while she is ahead is not
expressible in the current model at all.**

### ⭐ The engine already admits the gap, in its own voice

`lastOfferPeakShare`'s note: the share is a function of AGE alone, four careers with peaks 31% apart
read the same share to three decimals – «what a wrecked body loses is the LEVEL of the peak, which is
real tennis and **no part of this trigger**. **Making the goodbye personal needs a mechanism that does
not exist yet**, and §4a's recovery corridor is not it either.»

### What the model answers today, and what it does not

- ✅ «she is where she is going to be» (plateau)
- ✅ «she is old» (age)
- ❌ «it went wrong» – Zoe's case, deferred in a comment and never written
- ❌ «she wants to stop while she is ahead» – his reference case, no door

⚠ **This is a design question and not a defect**, and it is his. Nothing here is proposed as a fix;
the two doors work as specified and the third and fourth were never specified.


---

## ⭐ 13. HIS CLOSING RULINGS (17.09) – what he took, what he parked, what he would not let slide

- **The corpus drafts:** «посмотрим уже в игре». Not read line by line; he will meet them in play.
- **The K5 arm:** «жаль, что не починил, но хорошо, что уже работает, добавь в беклог на следующую
  волну». ✅ **BACKLOG, ROUND 45.** The rows ARE live – measured at 91% of college weeks – and it is
  the instrument that cannot see them. ⚠ The most likely cause is named so the next pass does not
  re-derive it: `tickWeek` alone does not advance a career, it stalls at every pending decision
  (reveal, knock, birthday, life beat). Four of the architect's own probes died on exactly that and
  the fifth worked only by copying a passing test's recipe. **If the bench's walk does the same, its
  careers never reach the late stages and every gated row there looks unreachable.**
- **Round 42's leftovers:** «чини, я был уверен, что уже это всё готово. Я просил это всё доделать.»
  ⚠⚠ **He is right and the record shows it** – #51 has stood at `[ ]` since 16.09 with his own
  corridor written into it, and the two items off his play were found on 17.09 and never built. They
  ship in this wave.

### The four, and why they are two builders

| | item | size | state |
| --- | --- | --- | --- |
| a | re-affirming the psychologist's year does nothing (`world/psychologist.ts`'s early return skips the season stamp) | one line + a test | ✅ |
| b | a confirmation before the year is set – the pick LOCKS the row for the rest of the off-season | existing dialog idiom | ✅ |
| c | the hitting partner is missing from `coachingBudget.ts`'s `seats`, so `committedCents` is short by his salary | one push + a test that counts against the snapshot | ✅ |
| d | **#51 – the coach's fee fixed at hire, and he ASKS** | ⚠⚠ **a schema move**: the agreed figure is stored nowhere today, so v81 → v82 and the six-part ritual | open |
| e | #46 – show what each travelling specialist buys | UI | ✅ |

a, b, c and e go together; **d is its own pass**, because a schema move next to three unrelated
repairs is how a bump gets half-done.

---

## ✅ THE LEFTOVERS PASS – a, b, c and e, on `round/44-leftovers`

### a. The re-affirmation was swallowed in TWO layers, not one

The brief named `world/psychologist.ts:536`. It was right, and it was half the defect: the SCREEN
carried the same early return (`setPsychologistFocusChoice`'s `if (focus === psychologistFocus.value)
return`), so the press never became a command at all and the engine's guard was never reached. Both
are gone. The refusal read and the season stamp are now unconditional; the assignment is idempotent
by being an assignment, which is the only half of the old guard that was ever about the feed.

⚠ **What the trade costs, said rather than discovered:** a press that arrives after the window has
closed is now REFUSED (`PSYCHOLOGIST_FOCUS_SEASON_REFUSAL`) where it used to return silently. That
cannot happen from a live card – `psychologistFocusOpen` is empty there and every option is disabled –
and it is the same sentence every other closed press already gets, which is the R10-16 doctrine
rather than a new behaviour.

⚠ **One pin moved, and it had been asserting the defect.** `tests/wave5-psychologist-focus.test.ts`'s
«re-choosing the year already running is a NO-OP – not a refusal and not a re-stamp» is replaced by
two cases, and its text is kept verbatim inside the new one, because the sentence was right about its
purpose and wrong about its scope. Nothing was weakened: the silence half it protected (no feed row,
no life-beat row, no charge) is now an assertion rather than a comment.

### b. The ask before the year is set

`ConfirmDialog`, the shell the two hire directions already use, asked of the picker. The press stores
what was pressed; only the confirm sends the command; Cancel leaves the year as it was. **The
confirmation names the year**, because a question that did not would not answer «вдруг человек
промахнулся» at all.

⚠ **ONE NEW PLAYER-FACING STRING, AND IT IS A DRAFT** (plus the `Set it` button label). Its vocabulary
is deliberately the engine's own refusal – «the year's work», «once a season», «the off-season» – so
the ask and the sentence it will one day be refused by read as one story.

> `Set the psychologist's work for this season to <year>? The year's work is chosen once a season, and
> the next choice comes in the next off-season.`

⚠ **MEASURED AGAINST A PHONE** (round-20 #1's standing rule), `psychologist-card.test.ts` §9c: the
dismiss control's box inside 375x667 through the real cascade, and the cap arm – `max-height` stripped
off the real card – watched throwing, because a fit test that cannot fail on the unbounded version is
not that test.

### c. The hitting partner joins the payroll

One clause in `coachingBudget.ts`'s `seats`, and the three figures that are summed off it stop being
short by his salary. ⭐ **The comment that promised this could not happen is corrected where it
stands** – «a fourth salaried seat added to the snapshot joins THIS array» was aspirational, and the
guard that replaces the promise counts the tile's rows against the snapshot's own `*Hired` flags,
discovered from the wire, so a FIFTH seat reddens it by existing.

⚠ The membership half is asserted SORTED, on purpose: the wire's key order is the order somebody typed
`toSnapshot`'s object literal in (`sparringHired` stands above `psychologistHired` there), which is a
fact about a file and not about a payroll. The ORDER the tile draws is a separate claim with its own
reason – the masseur stays first – and is asserted separately as a literal.

### e. #46, in his own words and no others

His 16.09 read is shipped verbatim: **46-a / 46-b** (the masseur's two states, «слова массажиста ок»)
and **46-c v2** (the psychologist, the re-draft made after he corrected the mechanic). No number
appears in any of them, which is #46's own rule.

⭐ **The hitting partner gets nothing, and that is asserted as a decision.** His travel sub-line
already says which half the fare buys, in his own 17.09 words, so a fourth sentence would be a draft
he never asked for beside an approved one he did.
