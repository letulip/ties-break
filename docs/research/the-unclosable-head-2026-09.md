---
type: research
status: current
area: season
canonical: false
last-reviewed: 2026-09-21
---

# The unclosable head – can a career reach the top of our own table, and what would it take?

Compiled 21.09.2026, wave 8b T7, on his ask at the wave-8 review: **«Алисину руку тоже давай»**.
Instrument: `tools/probe-favorite-curve.ts`, arms 3 and 4 (EXTENDED, not forked – the staircase
research's own arms 1 and 2 are untouched above them). Zero MAIN draws and zero ticks: no world is
created by either new arm.

⚠⚠ **THIS IS MEASUREMENT ONLY AND NO CONSTANT MOVED** – the wave-8b brief's §2 T7, verbatim: «T7 is
measurement ONLY – no constant moves on any Alice-arm finding; the numbers come back.» §5 names the
levers and leaves every one of them standing.

## 0. The headline

1. **The head is out of reach for four careers in five, at birth, before a week is played.**
   `rollPotential` is the ceiling and it is rolled once off `seed:potential`; its median overall(4)
   is **63.3**, and the `tourElite` floor is **67**. **19.1%** of careers can EVER clear 67.
   **5.8%** can clear 70. **0.0%** clear 77.
2. ⚠⚠ **RETRACTED 21.09, THE SAME DAY – the anchor was an instrument defect, the model half now
   points the other way.** This item read «zero titles in an 82-12 season is the arithmetic»: the
   specimen's titles were counted from `milestones`, which keeps FIRSTS – one `'title'` row per
   tier, ever. The cabinet (`trophiesByTier`) is the full record and it says the opposite career:
   **66 titles, 14 of them WTA1000** (11 of those AFTER her Slam), 9 titles in the 82-12 season
   this line called empty. What survives is the MODEL half: the closed form at her RAW overall
   (65.1, condition and every edge stripped) still prices a 64-draw title at 0.0008 – so a career
   that actually banks ~26% of the 1000s it enters is playing FAR above its raw sheet, and §3's
   model must be re-run with the EFFECTIVE player (condition, coach edge, form) before any
   sentence about title arithmetic is written again. The gap between raw and effective is now the
   measurement §3 owes, not a conclusion either way.
3. **The four voices are treated identically**, measured at 20,000 seeds: every bar sits inside the
   ±1.5 pp corridor, and the mechanism says why before the number does.
4. **The AI-vs-AI bracket resolves by a PROBABILISTIC draw, not argmax** – read and cited in §4, so
   the head of the table is decided by the same curve her own matches are.
5. ⭐ So the specimen's «сдулась at 24» is two different facts wearing one sentence: her `declineFactor`
   really is **0.0000** (nothing had decayed), and the head was never inside her reach. **What looks
   like a fade is a ceiling.**

## 0b. ⭐⭐⭐ RESOLVED 21.09 BY ARMS 5 AND 6 – the head was never the problem; the MODEL's field was

His three arms ran (`tools/probe-favorite-curve.ts` arms 5, 6, 6b) and between them they answer both
his question about the specimen and §0.2's retraction. In order, because each one kills the next
hypothesis:

1. **The court does not add core points.** Arm 5 put the specimen's own build through
   `kidMatchPlayerFor` – the composition point every match in the game is built at – and the
   effective player is **64.9 against a raw 65.1** at condition 100 and a high spirit; condition 60
   costs 4.4. So the factor of ~350 between §3's model (0.0008 a draw) and her measured cabinet
   (≈26% of entered 1000s) is **not in the player**.
2. **It is in the FIELD §3 assumed.** §3 drew every opponent from `FIELD.tiers.tourElite` – core
   67–77, the top 64 chairs. A real draw is not that: it is a **percentile band of the merged
   table**, `TierDef.entrantPctBand`, and the cores across it come from `coreForStanding`.
3. **Priced on the real bands (arm 6b), the specimen's career is ordinary arithmetic:**

| tier | rounds | the opponents a seeded bracket walks her through | p(title) at 65.1 | per season |
| --- | ---: | --- | ---: | --- |
| WTA1000 | 6 | 36.1 → 44.8 → 52.8 → 56.6 → 61.4 → **64.3** | **0.164** | 8 events → **1.3** |
| Grand Slam | 7 | 37.1 → 49.3 → 56.6 → 62.7 → 67.4 → 71.2 → **76.4** | **0.010** | 4 events → **0.04** |

⭐⭐ **The whole answer is in the two last columns.** The best player a 1000 draw MAY contain is core
**64.3 – weaker than the specimen herself** – so she is the strongest player in the room and banks
one in six of them: predicted **≈8 titles in six seasons, measured 11**. A Slam's last opponent is
**76.4, the world #1's own core**, and seven rounds of it price a title at one per ~25 seasons:
predicted **0.24 in six seasons, measured 1**. ⚠ She OVER-performed both, which is the opposite of
the complaint either reading of this document started from. **Nothing happened to her after the Slam
at 19; a Slam is simply a ~1-in-100 entry for a 65-core build, and she had already cashed hers.**

⚠⚠ **AND THE MECHANISM BEHIND IT IS A RULED CONSTANT, WHICH IS WHY THIS IS HIS DECISION AND NOT A
FIX.** The 1000's field tops out at 64.3 because its entrant band OPENS at 0.006 – the top ~11 of the
table are **not candidates for a 1000 draw at all**, while the Slam's band opens at 0. That lower
edge is his own hard-cut ruling of 16.08 («пусть остануться жесткие отсечки»,
[the-acceptance-tail-2026-08.md](../specs/the-acceptance-tail-2026-08.md)) applied to every rung
below the majors. ⚠ **It is the one place where that rule runs against the real tour**: WTA 1000s are
MANDATORY events for the top ten, the most contested tournaments in the sport after the majors, and
in our world they are the one class of event the very top never enters. The consequence is exactly
the shape he felt in his save – **a career that wins 1000s at will and cannot win a major** – and it
is one number (`TIERS.wta1000.entrantPctBand[0]`) whose change would be a whole-table decision with
its own bench.

⭐ What this does to §2's «four careers in five cannot reach the top storey»: it stands as a
statement about `rollPotential` and **stops being a statement about titles**. A 65-core career is
demonstrably a multi-1000 champion. The storey's floor gates the world #1's chair, not the trophy
cabinet.

## 1. The owner's specimen, quoted and not re-derived

Read once through `tools/fade-read.ts` (`decodeExportFile`, nothing of the save copied anywhere).
Carried here as the anchor every number below is answered against:

| | |
| --- | --- |
| overall(4) | **65.1** at WTA **#7** |
| what the table expects at that chair | `coreForStanding(#7)` = **67.4** |
| her best season | S9, **82-12**, **9,064 points**, **9 titles** (⚠ first written as «0 titles» off the firsts-only milestone list – corrected 21.09) |
| titles, nineteen to twenty-four | **35 across six seasons, 14 WTA1000 career** (⚠ first written as «1 in six» – same defect, same correction) |
| Slams over the same span | **1 title (age 19.0) + 1 final (17.5)** in ~24 main draws – the one row where the head really is unclosed |
| `declineFactor` at her age | **0.0000** – nothing had decayed |
| staff | masseur **and** psychologist, both hired |

⚠ **The save was not re-read for this document.** The instrument that produced these lines had a
defect of its own, found by `npm run check:tools` while this wave opened and fixed in its own commit:
`fade-read.ts` cast `knockHistory` to `{ week: number }[]` and `KnockRecord` has no `week`, so the
knocks line printed «0 in the last two years» for every save ever handed to it. **No figure in the
table above came from that line.**

## 2. The ceiling a career is born with – 20,000 seeds

`rollPotential(seed, startingSkills(seed))` is her ceiling: rolled once at birth off
`seed:potential`, never movable by any plan, coach or academy (`engine/radar.ts`' own sentence).
overall(4) is serve / ret / composure / stamina – the four `coreForStanding` is built on;
`groundstrokes` is the style's wing and is no part of the professional table.

| temperament | n | median | max | ≥ 67 | ≥ 70 | ≥ 77 |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| `sunny` | 4,968 | 63.3 | 76.8 | 19.7% | 5.9% | 0.0% |
| `fiery` | 5,026 | 63.2 | 76.6 | 18.8% | 5.8% | 0.0% |
| `quiet` | 4,937 | 63.4 | 77.5 | 19.5% | 5.7% | 0.0% |
| `deep` | 5,069 | 63.2 | 77.8 | 18.5% | 5.9% | 0.0% |
| **all** | **20,000** | **63.3** | **77.8** | **19.1%** | **5.8%** | **0.0%** |

The bars are the game's own: **67** is the `tourElite` floor (`FIELD.tiers`), **77** the top of that
band, and `SKILL_LAW.top` – the world #1's core – is **76.4**.

⭐ **THE MEDIAN CAREER'S CEILING IS BELOW THE TOP STOREY'S FLOOR.** Not below the world #1, below the
ENTRANCE: the median girl cannot, at her theoretical best, be a member of the band the top 64 players
are drawn from. That is the finding, and it is about the DRAW rather than about the ramp – a career
that cannot reach 67 in principle cannot be argued there by any amount of play.

⚠ **It is a ceiling and not an outcome.** Reaching it takes a whole career of growth; the shares above
are an upper bound on who could ever be in the conversation, not a forecast of who will be.

### 2.1 ⚠ Fairness, and the sample size the corridor actually needs

Every bar is **inside** the ±1.5 pp corridor: spreads of **1.16 / 0.25 / 0.04 pp** at 67 / 70 / 77.

⚠⚠ **AND THE FIRST RUN SAID OTHERWISE, WHICH IS WHY THE SIZE IS IN THE INSTRUMENT'S OWN NOTE.** At the
brief's «≥4000» the four voices hold ~1,000 each; a share near 19% then carries a standard error of
`sqrt(0.19 × 0.81 / 1000)` = **1.24 pp**, so a 1.5 pp corridor is INSIDE the noise and cannot conclude
anything. Measured at 4,000 the spread came out **1.78 pp** and would have READ as unfair. At 20,000
the standard error is 0.56 pp and the corridor means what it says. The arm prints the standard error
beside the spread from now on, so nobody has to take the verdict on trust.

⚠ **And the mechanism says the answer before the number does**: the ceiling is drawn on
`seed:potential` and the temperament on `seed:temperament` – two independent purpose-scoped
sub-streams – so the four shares are four samples of ONE distribution and anything but a tie is
sampling noise by construction. The arm exists to state that with a measurement rather than by
reading the code.

## 3. The title expectation at the head, closed form

A title is six consecutive wins in a 64-draw. Against a field drawn from the top storey's own band
(`FIELD.tiers.tourElite`, core 67–77 over 64 players), her per-match chance is the game's own Elo
form at the gap – `SKILL_LAW.eloPerCore` per core point, **by import** – so the per-event title chance
is the product over the six rounds:

| her overall(4) | p(beat the top of the band) | p(title, 64-draw) | titles / 20 events |
| ---: | ---: | ---: | ---: |
| **65.1** (his specimen) | 0.200 | **0.0008** | **0.02** |
| 67.4 (what #7 expects) | 0.247 | 0.0023 | 0.05 |
| 70.0 | 0.307 | 0.0067 | 0.13 |
| 73.0 | 0.386 | 0.0195 | 0.39 |
| 76.4 (`SKILL_LAW.top`) | 0.483 | 0.0535 | **1.07** |

⚠⚠ **THE PARAGRAPH BELOW IS RETRACTED 21.09 WITH §0.2 – its measured side was the firsts-only
count.** The model side stays as a RAW-sheet reading, and the corrected cabinet (≈26% of entered
1000s banked) turns this section's question around: not «why does she win nothing» but «what makes
the EFFECTIVE player so much stronger than the raw sheet, and is the Slam's shortfall against the
1000s (1 vs 14, ≈2.5x under the one-extra-round ratio) composition, condition timing, or variance
on n≈24». That re-run is owed before this table is cited again.
~~SO 0 TITLES IN AN 82-12 SEASON IS NOT A DEFECT – IT IS WHAT THE TABLE PREDICTS, BY A FACTOR OF
FIFTY.** At 65.1 the expectation is one title every **forty-odd seasons**. His measured **1 title in
six seasons** (≈0.17 a year) is ABOVE the closed form for her build; she over-performed it, which is
the opposite of the complaint the arm was asked to check.

⚠ **It is an upper bound on her side of the draw**, and the document says so rather than leaving it
to be found: the opponents get stronger each round in a seeded bracket and this uses the band's own
spread rather than modelling the seeding, so the true number is at or below every line above.

⭐ **And this is his own calibration working as he ruled it.** The live-list fit of 2026-08
deliberately killed 1990s dominance – «нам не нужно доминирования, как в 90х», #1 beats #10 only 78%
– so a thin title count at the head is that decision arriving, not a regression. What is NEW here is
that the same arithmetic reaches a long way DOWN the table: at 65.1 it is not thin, it is nearly zero.

## 4. ⚠ The bracket resolves by a draw, not by argmax – verified

`src/engine/season/tournament.ts:1055-1056`, the non-kid arm of `playMatch`:

```ts
const p = fastMatchProbability(a, b, { surface: event.surface, tour: JUNIOR_TOUR, seed: '' })
const aWins = rng() < p
```

The stronger AI player wins **with probability p** and never by construction. So the head of the
merged table turns over on the same curve her own matches are decided by, and «the same four names
win everything» is not a mechanism this build has. ⚠ Her own matches take the FULL engine
(`simulateMatch`) on the branch above it; the closed form is the AI-vs-AI shortcut, and §2 of
[the staircase research](the-comeback-staircase-2026-09.md) is where the two were measured against
each other.

## 5. ⭐ The candidate levers – NAMED, and every one of them LEFT STANDING

⚠⚠ **NOT ONE CONSTANT MOVED IN THIS TASK**, and none should move on this document alone: every lever
below is a whole-table decision with a bench of its own, and invariant 5 wants the prediction written
before the number. They are listed so his word has somewhere to land.

1. **`ECONOMY.development.potentialBand` – the ceiling roll itself.** The most direct lever: it is
   what puts the median ceiling at 63.3 against a floor of 67. ⚠ It moves EVERY career, not only the
   gifted ones, and the growth curve, the academy's worth and the whole junior ladder are calibrated
   underneath it.
2. **`FIELD.tiers.tourElite.core` – the bar, rather than the jump.** 67–77 is where the top 64 live.
   Lowering the floor brings the head into reach without touching a single career's ceiling. ⚠ It is
   the table the live WTA Elo list was FITTED to (547 pairs, 2026-08), so moving it re-opens the fit.
3. **The gap between the two.** `coreForStanding(#7)` = 67.4 and his specimen held #7 at 65.1 – the
   TABLE and the RANKING already disagree by two core points about what a #7 is. That gap is neither
   a bug nor a lever on its own; it is the measurement that says levers 1 and 2 are two views of one
   question, and picking either one alone leaves it.
4. **The growth curve's reach, not its ceiling.** Nothing here measures how close a career gets to
   its own ceiling – that is a different arm (walked careers, ceiling against achieved) and it is the
   one this document does NOT run. ⚠ If careers land far below their own ceilings, none of the three
   levers above is the right one and the answer is in `development.ts`.

## 6. ⚠ What this document does NOT answer

* **How close a career gets to its own ceiling.** §5's fourth lever, and it needs walked careers.
* **The middle of the table**, which the staircase research's §4 designed and parked: does her
  measured round depth by Elo gap track the logistic curve the field is built on? That arm was
  designed to run AFTER the staircase landed, and the staircase landed in this same batch (T3) – so
  it is clean to run now and has not been.
* **Whether any of this is a problem.** The numbers say what the model does. Whether a tour where
  four careers in five can never reach the top storey is the game he wants is his call, and it is the
  only question in this document that a measurement cannot answer.
