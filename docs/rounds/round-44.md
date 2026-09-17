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
