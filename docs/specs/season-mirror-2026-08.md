---
type: specification
status: current
area: ui-and-design
canonical: false
last-reviewed: 2026-08-08
---

# The season mirror – one line for what the season could not do

**Status: SHIPPED on `feat/season-mirror`. Schema v44 → v45, one persisted field, one line on the
season wrap-up card.**

> **THE WAVE IN FIVE LINES.** The ladder floor removed the window's lower bound, which is the owner's
> ruling and is right – and it grew a decision whose wrong answer is invisible. The wrap-up card gains
> one line: *"Tournaments entered 30 / 12 could not move her national ranking."* The definition was **chosen from
> a measurement, not from an argument**: the obvious one (a full best-N book) is exact and reads **0 on
> the median season of five seasons in six**, so it would have been decoration. The counter is
> **captured in the branch that commits the entry** – the `weeksLostToInjury` precedent – because
> `pruneResults` deletes the evidence 52 weeks before the wrap-up asks. A season the counter did not
> watch **shows no line at all**, never a zero.

## Current truth

* `SeasonSummary.entryMirror` is `{ entered, couldNotMove }` or **absent**. `SeasonSummaryDialog`
  renders a row and one sentence when it is present and nothing at all when it is not.
* The rule is `entryCouldNotMove(row, against)` in `src/engine/world/ladder.ts`, and it is the **only**
  place the definition is spelled.
* The facts it reads are captured by `captureEntryRow` at `enterEvent`'s commit
  (`src/engine/world/entries.ts`) into `world.seasonEntries` (v45), and folded by
  `maybeFireSeasonWrapUp` (`src/engine/world/milestones.ts`).
* **`SAVE_SCHEMA_VERSION` is 45.** Migration v44 → v45 opens the ledger at the load week and back-fills
  nothing. Golden fixture `tests/fixtures/saves/v45.json`.
* Nets: `tests/season-mirror.test.ts` (16 engine tests) and
  `tests/component/season-wrapup-mirror.test.ts` (6 mounted – the wrap-up card had **no** mounted test
  before this wave, which is how it acquired two wrong lines in one week), both mutation-verified – §8.
* Measured by `npm run bench:mirror` (`tools/season-mirror.ts`), which reads the engine's own banked
  figure rather than re-deriving it.

---

## 1. Why – the decision the last wave grew

`ladder-floor-2026-08.md` §3c, the owner's ruling of 08.08:

> «нет, теперь ей есть где играть ЕСЛИ игрок этого хочет. Турниры в реальности идут постоянно.»

Correct, and not in question here. What followed it is:
`human-arm-forward-2026-08.md` modelled the owner's own tactic forward on that tree and found a career
that **survives and stops climbing** – topping out at w35 instead of wta250, ranked #993 instead of
#260, earning 8.7% of its costs in prize money instead of 44.9% – while **six of nine axes stay inside
the human envelope**: matches, entries, win rate, spend, earned, net. Its own §1:

> **He would have no way of noticing from the money, the match count or the win rate.**

The counterweight already exists. `coachLadderNote` says the right thing and, taken, restores
everything and more. But it speaks **~1,150 times a career**, which is background rather than signal,
and it is gated on a coach the family may not have hired.

So the wave is one line, in the place he already looks. The owner, on the proposal:

> «прикольная идея, лишь бы реальную статистику показывал»

**That caveat is the whole brief**, and it is why §2 is a measurement and §4 is a confession.

---

## 2. The definition, and how it was chosen

### 2a. What ships

An entry counts against the season when, at the moment it was committed, **both** hold:

1. **She had already climbed past the rung** – `hasOutgrown(world, tier)`, either ceiling
   (`outgrewTier`'s point band or `tierOutgrown`'s sliding window), which is the ladder's own single
   answer and the same gate the coach's voice uses.
2. **A title there could not have changed her position on the table the season was played on** –
   either because the rung pays into a **different table** (a Local title is thirty domestic points and
   thirty domestic points are exactly zero on the professional list), or because it pays into that
   table and her **book there was shut** to it (`bookClosedTo`: the best-N window full, its weakest
   counted row already paying at least the title, so winning it outright would displace nothing).

⚠ **Clause 1 is what stops the counter flagging the climb.** Clause 2 alone counts a fourteen-year-old's
first J30 – a junior title pays no domestic point, so it cannot move the only table she is on yet – and
a line that scolded a parent for stepping UP would be worse than no line at all.

⚠ **Clause 2 is judged against the table the CARD names**, `SeasonSummary.rankTrack`, not against
whatever was true at the entry week. §4 is the bug that taught this.

### 2b. Why not the obvious definition – measured

The proposal this wave started from was clause 2's second half alone: *the title is at or below the
weakest result already counting in her best-N book*. It is exact, unarguable, and it is already in the
engine as `bookClosedTo` – the sharpest of the coach's three arguments.

**It is also nearly silent.** `npm run bench:mirror`, 9 presets x 6 seeds x 6 seasons, both policy arms,
the engine's own banked figures:

| grinder, medians per season | s0 | s1 | s2 | s3 | s4 | s5 |
| --- | --- | --- | --- | --- | --- | --- |
| tournaments entered | 30.0 | 33.0 | 32.0 | 31.0 | 16.0 | 0.0 |
| **SHIPPED – could not move her** | **0.0** | **3.5** | **0.0** | **0.0** | **0.0** | **0.0** |
| `bookClosedTo` alone | **0.0** | **1.0** | **0.0** | **0.0** | **0.0** | **0.0** |
| `hasOutgrown` alone | 11.0 | 15.0 | 12.0 | 8.5 | 6.5 | 0.0 |
| everything an elite coach would say | 11.0 | 15.0 | 12.0 | 8.5 | 6.5 | 0.0 |

| player, medians per season | s0 | s1 | s2 | s3 | s4 | s5 |
| --- | --- | --- | --- | --- | --- | --- |
| tournaments entered | 26.5 | 23.0 | 22.0 | 21.0 | 20.5 | 21.0 |
| **SHIPPED – could not move her** | **0.0** | **5.0** | **3.0** | **3.0** | **3.0** | **0.0** |
| `bookClosedTo` alone | **0.0** | **2.0** | **0.0** | **0.0** | **0.0** | **0.0** |
| `hasOutgrown` alone | 8.0 | 8.5 | 8.0 | 8.0 | 8.0 | 9.0 |

| over every entry, 54 careers an arm | grinder | player |
| --- | --- | --- |
| entries the wrap banked | 7,811 | 6,633 |
| **SHIPPED** | **926 (11.9%)** | **1,084 (16.3%)** |
| `bookClosedTo` alone | **503 (6.4%)** | **551 (8.3%)** |
| `hasOutgrown` alone | 3,247 (41.6%) | 2,766 (41.7%) |
| an elite coach's whole voice | 3,233 (41.4%) | 2,758 (41.6%) |
| careers where the line is EVER non-zero – shipped | **50/54** | **54/54** |
| ...on `bookClosedTo` alone | 42/54 | 48/54 |

**The finding, and it is the reason the definition moved.** `bookClosedTo` alone fires on 6.4% and 8.3%
of entries and its **median is zero in five seasons of six on both arms** – the line it produced would
have read *"0 could not move her ranking"* on most seasons of most careers. That is decoration, and
decoration is exactly what the owner's caveat rules out. The shipped rule roughly **doubles** it on
each arm and, more to the point, is non-zero on **50 of 54** grinder careers and **54 of 54** player
ones, with a median of **three to five entries a season through the climbing years** on the arm that
has any judgement in it.

**And `hasOutgrown` alone is not the answer either**, though it has the right magnitude. It is not the
claim the line makes: most rungs beneath her *can* still pay her. A girl whose domestic best-6 is six
results of fifteen points has outgrown Local at 90 points, and a Local title pays 30 – it displaces one
of them and moves her. Printing "could not move her ranking" over that entry would be false, which is
the whole failure mode this document exists to avoid.

⚠ **The elite coach's whole voice tracks `hasOutgrown` almost exactly** (3,233 against 3,247), which is
its own small finding: his gate is that clause and he nearly always has *some* argument once it opens.
The line is the arithmetic subset of what he says – and unlike him, it is not gated on being hired.

### 2c. The limit, stated rather than buried – and it is a real one

**The grinder arm's shipped median is zero in four seasons of six**, and the reason is worth writing
down because it is a property of the definition and not a bug in it.

`rankTrack` is `dominantTrackOfSeason` – *the table that carried the most competitive matches this
season*. So the table the count is judged against is partly decided by the entries being counted: a
season of twenty club draws and four W trips is a season whose table is the domestic one, and on the
domestic table those twenty club draws **did** move her. The grinder plays domestic all career, so its
seasons are judged on the domestic table and only the book arithmetic can fire.

**That is the honest answer and it is deliberately the conservative one.** The alternative – judging
against the table her CAREER is heading for – reports a larger number and is the one §4 caught printing
a self-contradiction. Between a bigger number that argues with the row above it and a smaller number
that cannot, this wave takes the smaller. It under-reports where a parent's whole season was spent
beneath her; it never over-reports.

⚠ **What this means for the human-arm case specifically.** `human-arm-forward-2026-08.md` §4's
complaint is that seasons 2-4 pay 10.3, 7.7 and 7.3 entries into domestic rungs *while her career is
the professional one*. Where those seasons' matches are mostly domestic, the card names the national
table and the line reports only the book-shut subset. **A line that named the career's destination
rather than the season's table would report all of them** – and would need the wrap-up's rank row to
name that table too, which is a change to `dominantTrackOfSeason` and a separate owner question. It is
recorded here as the one thing this wave deliberately does not settle.

---

## 3. Where the counter lives, and how it survives pruning

**`world.seasonEntries: { fromWeek, rows: SeasonEntryRow[] }`**, v45. One row per entry:
`{ id, track, outgrown, bookShut }`.

* **WRITTEN** at `enterEvent`'s commit branch, immediately after `world.entries.push(eventId)` –
  `git grep 'world.entries.push'` returns exactly one site, so this is the one choke point and the
  player command, the bench policies and every tool all pass through it.
* **UN-WRITTEN** in `releaseEntry`, beside the ITF participation slot, under that function's own
  standing rule: **the count follows the fee.** A withdrawal inside the deadline hands the money and the
  week back, so it was not a wasted entry; every forfeiting exit (a late cancel, a skip, a medical
  forfeit) keeps its row, because she paid and the week went.
* **READ AND RESET** by `maybeFireSeasonWrapUp`, beside `seasonWins` / `seasonLosses` / `seasonRecord`,
  which is the same family: a per-season running total only a season boundary clears. It re-opens at
  the **wrap week** and not at the next season's first week, so the three off-season weeks' entries –
  all of them for events in the season ahead – land in the season that will play them.

### 3a. Why it is a capture and not a fold, stated as arithmetic

`pruneResults` keeps `world.week - r.week <= 52`. The wrap fires at `yearStart + 49`. The book behind
an entry made in week 3 of that season is her results over `[yearStart - 49, yearStart + 3]` – and the
pruner deleted everything before `yearStart - 3` weeks ago. **The question is not expensive to re-ask
at the wrap; it is unanswerable.** This is the identical 49-week hole that made `seasonStartRank` a
persisted capture in v17, and the precedent for the shape is `careerTotals.weeksLostToInjury`: a total
written in the same branch as the thing it counts, so the durable number and the prunable list cannot
disagree about the triggering moment.

`tests/season-mirror.test.ts` pins both halves: that the evidence really is gone by the wrap, and that
**re-asking the question at the wrap gives a different answer**. Measured over six careers of four
seasons, the verdict flips on **18, 33, 61 and 67** of a career's ~170 entries on four of them, and on
none on the two whose season was played on the domestic table with a book that never filled. The test
therefore asserts the aggregate over three careers rather than pinning one seed, and says why.

### 3b. And the denominator comes from the same commit

"30 tournaments entered" cannot be folded either. `world.results` is **award-only** – a season of lost
openers leaves no row, which is the defect that made a 44-19 season report "no tournaments played" –
and `world.events` is capped at 400 rows. Counting both numbers at the same commit is what stops the
line being a ratio of two different seasons.

---

## 4. The contradiction found in the browser, and what it changed

The first implementation judged clause 2's table term at **entry** time, against `activeLadderOf` – the
game's own single answer to "which table is hers". Driven to a real wrap-up in Chromium at 576x1280, it
printed this:

> **Final national rank #3** … **13 could not move her ranking**

All thirteen were the domestic events that had **made her third**. `activeLadderOf` latches to the ITF
table on her first junior point; `dominantTrackOfSeason` – the field the card's own rank line uses –
said this season was played on the national ladder. One card, two tables, and the reader is right and
the card is wrong. **That is the same defect as the junior rank printed at a professional, arriving
through a new door**, and it is precisely the fourth wrong-ledger surface this wave was told not to add.

**The fix is the capture/fold split that the shipped design now has.** A row stores the two facts that
**decay** (both about her book, both captured at the commit) plus the tier's **track**, which is a
property of the calendar and never decays. The comparison happens at the wrap, against the same
`rankTrack` the card prints two rows above the line. `entryCouldNotMove(row, against)` takes the table
as an argument so that one card cannot name two, and
`tests/season-mirror.test.ts` pins it on the very career that produced the screenshot – a career where
`rankTrack` is `domestic` while `activeLadderOf` is `itf`, so the two folds provably differ.

The same career now reads **12** instead of 13, and every one of the twelve is an entry at a rung she
had outgrown whose title could not have entered the domestic best-6 that made her #3.

---

## 5. What an old save shows: nothing, on purpose

A migration cannot back-fill a judgement whose evidence the pruner deleted, and it must not pretend to.
So v44 → v45 opens the ledger **at the load week** – `{ fromWeek: save.week, rows: [] }` – and claims
nothing about the weeks before it. The wrap's own test is `fromWeek <= yearStart`:

* a career loaded **mid-season** shows **no line at all** for the season in progress, and a real one
  from the next wrap onward;
* a career loaded in the **off-season** is already covered, because the next season has not started;
* a career **born on this build** opens at week 0 and its very first wrap can speak.

⚠ **A ZERO WOULD HAVE BEEN THE WRONG SILENCE.** *"0 could not move her ranking"* is a claim – it is the
good news – and printing it over a season nobody counted is the same class of defect as the 44-19 year
that reported "no tournaments played". Absence is the honest answer and the card renders no row for it,
which is the `spentCents` precedent (a summary banked before R11-12a shows no spend row, not $0).

---

## 6. The copy, and where it sits

```
RANKING                          MATCHES
Final national rank  #3          Record                32–24
Season points        513         Best result           Champion
                                 Lost to injury        1 wk
                                 Tournaments entered
                                 30
                                 12 could not move her national ranking
```

* **In MATCHES, not in RANKING**, and that is the design: the number it corrects is the *record two
  rows above it*. A season of 32-24 with a title in it reads as a career that is working, and that
  reading is exactly what the probe found a parent cannot get past.
* **It names the table** – the same one the RANKING tile names, read off the same `rankTrack` the
  engine judged the count against. Saying which table makes the agreement visible instead of merely
  true, and §4 is what that is worth.
* **"Tournaments entered", not "played"** – the count is entries she committed and paid for, and the
  copy says so. §3's fee rule is what makes "entered" exact rather than approximate.
* The value drops under its label on a 360px dialog's half-width tile, exactly as "Best result /
  Quarterfinalist" already does; the sentence wraps to two lines under it. Verified in Chromium at the
  owner's own **576x1280**, not asserted.

---

## 7. An in-season surface – recommended, but NOT built here, and where it would go

**The case for it is real and the brief states it exactly:** a wrap-up is a verdict, and a player who
learns in week 49 that he spent twelve weeks on draws beneath her cannot act on it. The measurement
sharpens that – on the player arm the median season loses three to five entries this way, and they are
spent steadily rather than in a block, so the information is actionable from about week 10 onward.

**My view: yes, one surface, and it is a counter on the Season screen's header rather than a new
card.** The Season feed is where the decision is *made* – it is the screen carrying `coachCaution` and
the enter-confirm – so a running "N of M this season" beside the season's own title puts the tally at
the point of the choice, which is the only place it can change one. It costs no new state: the ledger
is already on the world and already per-season; it needs one snapshot field and one line of template.

**Two things would have to be decided first, and neither is mine:**

1. **Which table an in-season counter is judged against.** The wrap's answer is `rankTrack`, which only
   exists at the wrap. Live, the only available answer is `activeLadderOf` – and §4 is the record of
   what that costs. An in-season line would therefore either drift from the wrap-up line by a few
   entries, or need `dominantTrackOfSeason` folded live over the season so far. The second is correct
   and is a real change, not a display tweak.
2. **Whether it is a second voice saying what the coach already says.** He speaks on ~22% of rendered
   cards; a permanent counter on the same screen may read as nagging where one line a year reads as a
   report.

**Not built on my own authority.** The brief asked for the wrap-up line and for a view on this, and the
view is: build it, on the Season screen header, after ruling on (1).

---

## 8. Gates, and reproducing it

* `npm run context:audit` – ok.
* `npx vue-tsc -b --force` – clean.
* `npm run test:quiet` – **green, 115 files / 2,429 tests**.
* `npm run test:component` – **green, 9 files / 105 tests**.
* `npm run test:sim` – **8 of 9 files**; the ninth is `tests/econ-reach.test.ts`, inherited **red** and
  not touched.
  ⚠ **PROVED INHERITED RATHER THAN ASSUMED.** The same file was run in a detached worktree at the
  branch point (`ed143a8`) and at this head, one at a time, each printing its own `RUN v3.2.7 <root>`
  banner. Both fail the **14→18** case with the identical message – *"14→18 drifted (25 of 30 at
  ladder-pace): expected 1 to be greater than or equal to 12"*. Same case, same numbers, both trees.
* ⚠ **THE SCHEMA BUMP ALSO REGENERATES THE E2E FIXTURES.** `tests/e2e-fixtures.test.ts` asserts the
  five committed `.tsave` careers are written at the current schema, so `npm run e2e:fixtures` is part
  of a version bump and not an optional tidy. All five are rebuilt at v45 in this branch.

**Mutation-verified, and each break was caught by the test that names it:**

| the break | what failed |
| --- | --- |
| the outgrown gate dropped from the rule | *"a rung she has not climbed past is never counted"* |
| the book fact not captured (`bookShut: false`) | *"is a real count on a real career"* |
| the wrap judges against `activeLadderOf` | *"NOT against `activeLadderOf`, and this career proved it"* |
| the wrap recomputes instead of reading the capture | *"the counted entries are the ones judged AT THE COMMIT"* |
| the wrap emits a pair for a season it did not watch | *"a career migrated mid-season shows NO line"* |
| the withdrawal no longer follows the fee | *"a withdrawal inside the deadline hands the entry back"* |
| the card prints `entered` where `couldNotMove` belongs | 3 of 5 mounted tests |
| the card prints 0 instead of no row | *"says nothing at all when the pair is absent"* |

```bash
npm run bench:mirror -- --seeds 6 --seasons 6                 # the definition table, grinder
npm run bench:mirror -- --seeds 6 --seasons 6 --policy player #  ...and the player arm
```

⚠ Every run prints `RUN season-mirror · <cwd>` on its first line. A number whose banner does not name
the worktree it was supposed to come from is not evidence.
