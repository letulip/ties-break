# The wallet that read zero, and the wrap-up that forgot the season

**Branch** `fix/wallet-and-wrapup` (wave `wave/endings-and-debts`) · **05.08.2026**
**Probe** `tools/wallet-audit.ts` · **Guards** `tests/long-career-ledgers.test.ts`,
`tests/component/week-recap-money.test.ts`

The owner, playing a long career into season 2038 at age twenty-one on the W tour, reported three
things on one screen:

> «Что-то сломалось в кошельке в конце сезона, не видно вообще никаких доходов ни на каком экране,
> кроме Home. В турнирах пишут ноль, в week recap тоже, в самом ledger на вкладке расходов вообще нет
> транзакций.»

> «итоговый рейтинг сломался... и на том же экране всегда показывается international, хотя мы уже
> давно там не играем. Это тоже надо как-то динамично делать в зависимости от текущего уровня
> турнира, ну или доминирующего в этом году.»

And, about the suite:

> «Вероятно наши поломки случились после рефакторинга, но в этом случае не очень понятно что делают
> наши тесты и почему не ловят таких вещей. Нужно понять и разобраться.»

All three are one family of defect: **a screen asking a pruned ledger a question that ledger cannot
answer.** None of them lost any money or any result. Every number was in the save the whole time.

---

## 1. The evidence, from his own save

Decoded locally (schema v40, never committed – it is his personal career):

| fact | value |
| --- | --- |
| `world.week` | 412 (season 8) |
| `events` | **400 – the cap, full** |
| ...by type | `{match: 382, milestone: 11, info: 7}` |
| ...by category | `{}` – **not one row carries a category, i.e. no money row at all** |
| ...`keep: true` | 18 |
| `financeWeeks` | 60 weeks, **complete and correct** |
| `results` | 2169 rows; 21 of them hers, this season |
| `seasonHistory` | 7 seasons, each with `endRank`, `points`, `wins`, `losses`, `bestFinish`, `spentCents`, `earnedCents` |
| `careerTotals` | earned $147,413.76 · spent $167,802.15 · prize $75,380 |
| `kidRank` / `kidRankDomestic` / `kidRankWta` | 74 / 1 / **288** |
| `seasonRecord` | domestic 23-5 · itf **0-0** · wta 21-14 |

Week 411, side by side:

```
events   : 4 rows, all `match`
finance  : {interest: 482, income: 41160, coaching: -24302, physio: -3894, travel: -224129, prize: 200000}
```

She was paid $2,000 and spent $2,241 on travel. The ledger knows. The feed has four matches and
nothing else. That is his screenshot exactly: HIGHLIGHTS populated, FINANCES `+$0 / +$0 / +$0`.

---

## 2. Root cause (A) and (B): the cap was spent BY CLASS, not by age

`pruneEvents` (world.ts) trimmed in a fixed class order – kept rows, then her competitive matches,
then "everything else", with the ordinary class sacrificed **entirely** before the first match row
was touched:

```ts
const restTrimmed = overflow >= rest.length ? [] : rest.slice(overflow)
```

The intent was good and is documented in the file: the radar reads her matches out of the feed, so
every bookkeeping row a feature adds costs the radar a match. What the rule did not account for is
that **the two classes have different shapes**:

* ordinary rows are a **FLOW** – two to six every week, for ever;
* her match rows are a **STOCK** the pruner protected without a ceiling.

So the protected class grows monotonically until it fills the cap on its own. In his save it had:
**382 matches + 18 kept = 400 exactly, and `rest` = 0.** From that week on every income and expense
row was deleted by the tick that wrote it. This is the asymmetry, stated precisely: *it is not that
old money was pruned – new money never survived its own week.* The eviction is not oldest-first once
the protected class saturates; it is total.

Everything downstream of the feed went with it:

| surface | reads | symptom |
| --- | --- | --- |
| WeekRecapCard FINANCES | `snapshot.events` filtered to the week | `+$0 / +$0 / +$0` |
| MoneyScreen ledger tab | `snapshot.financialEvents` (a slice of `world.events`) | no transactions |
| Season wrap-up "Best result" | `world.events` `type === 'tournament'` | "no tournaments played" |
| WeekRecapCard flavour line / travel note | the same feed | silently blank |

**(B) bites years earlier than (A), which is why it survived so many playtests.** The feed does not
go from correct to empty – it **decays**. A season's earliest tournament summaries are pruned while
its later ones survive, so the wrap-up reports a *weaker but plausible* finish long before it
collapses into "no tournaments played". Measured (below): wrong from season 3.

### The off-by-one lead: checked and refuted

The `matchBonus` defect earlier in this wave was an off-by-one (`e.week === world.week` read against
a week `tickWeek` had already incremented). Mirrored onto the money rows it would produce the same
screenshot. It is **not** what happened here: in his save week 411 carries its four match rows under
week 411 *and* `financeWeeks` carries week 411's money under 411. Both writers use the post-increment
week. No off-by-one; the rows are simply gone.

---

## 3. Root cause (C): the rank line was pinned to the junior table, and the career walked past it

The wrap-up printed `International rank #N`, or `Unranked internationally` when she held no counting
ITF point in the 52-week window – with the dialog adding *"She has not played a Junior Tour event
yet. Her national standing is on the Stats tab."* Her junior rank in his save is **#74** and her
world rank is **#288**; neither is "unranked", and the junior table is not the one she played in.

**Which change caused it** (`git log -S`):

| commit | date | what it did |
| --- | --- | --- |
| `79567f9` | 30.07 | *"Make both ladders visible"* – made `kidRank` the ITF-only fold and rewrote the wrap-up line as `${LADDER_LABEL.itf} rank #${world.kidRank}`. Before it, the line was a track-agnostic `rank #N` over a both-ladders `kidRank`. **This is the commit that hard-wired the junior table into the wrap-up.** |
| `a676dfa` | 30.07 (11 min later) | added the `Unranked internationally` branch and the dialog's Junior-Tour sentence – correct for the two-table world it was written in. |
| `d0ba6ce` / `1560d25` | 31.07 | the professional table (`wta`) arrives. The wrap-up is not touched. |
| `b3d06bd` | 02.08 | `activeLadderOf` gains its professional arm and every other rank surface – Home's chip, Stats, the Kid screen, the week recap's own move line – moves onto it. **The wrap-up is still not touched.** |
| `b3f0e41` | 02.08 | the P4 decomposition moves the line verbatim into `world/milestones.ts`. |

So the owner's 2034 `#6 · 719 pts` is genuine, not a regression that "worked then broke": season 3
in his `seasonHistory` really is `endRank 6, points 719`, earned on the junior table he was still on.
The line stopped being right the day the third table shipped and nobody widened it.

**It is the same family as (A)/(B), which is worth saying out loud.** "Has she played a junior
event?" was answered by `kidPoints(world, 'itf') > 0` – a fold over `world.results`, which is pruned
to **52 weeks**. She had played no junior event *recently*, so a ledger that only remembers a year
answered *never*. A pruned ledger answering a whole-career question, for the third time on one card.

---

## 4. Which ledger is durable enough to answer which question

The thing nobody had written down. A save carries **five** stores with **four different retention
rules**, and almost every screen reads across them.

| store | retention | safe to ask | NOT safe to ask |
| --- | --- | --- | --- |
| `world.events` | **400 rows, by COUNT**, class-ordered (kept → matches → ordinary) | "what happened in the last few weeks", as PROSE | anything about money, any total, anything about a whole season, anything about "ever" |
| `world.financeWeeks` | **60 weeks, by TIME**, per week per category | any week's or any season's money, in cents, by category | a season older than ~14 months; individual transactions (it stores totals, not rows) |
| `world.careerTotals` | **never pruned** (running counters, v39/v40) | career earned / spent / prize / weeks lost to injury | any breakdown by week, season or category |
| `world.results` | **52 weeks, by TIME** | anything about the season being wrapped (the wrap fires at `yearStart + 49`, so the whole season is inside the window **by construction**); current standings | "has she ever…"; a season already banked; a scoreless appearance (her row is **award-only** – written only when `points > 0`) |
| `world.seasonHistory` | **30 seasons**, appended at each wrap | any FINISHED season's rank, points, W-L, best finish, spend, income | the season in progress |
| `world.seasonWins/Losses`, `world.seasonRecord` | running counters, reset at the wrap | how many matches she played this season, per track | anything before this season (that is `seasonHistory`) |
| `world.milestones`, `world.bestFinishByTier`, `world.trophiesByTier` | **never pruned** | "has this ever happened", firsts, career-best finish per rung | "how many", "when, exactly, in a season" |

Two rules follow, and they are the whole of this wave:

1. **A count-capped store may never be asked a question with a deadline.** "This week's money", "this
   season's best result" and "has she ever played a junior event" all have deadlines the row count
   cannot honour.
2. **When a durable store cannot answer completely, say which part it cannot answer** rather than
   collapsing the gap into a lie. `world.results` cannot see a scoreless appearance, so the wrap-up
   now distinguishes *"no result that scored"* from *"no tournaments played"* using the W-L counters.

---

## 5. Reproduce, then fix – the numbers

`npx vite-node tools/wallet-audit.ts --weeks 520` (seed `wallet-audit`, greedy strongest-first
entries, one per week – the same career `tests/long-career-ledgers.test.ts` walks).

### Before

```
week | kept  evid  rest  total | recap in/out    | ledger in/out    | ledgerTx
 403 |   13   355    32   400  | $1226 / $-2061  | $1226 / $-2061   |    22
 416 |   14   366    20   400  |  $734 /  $-422  |  $734 /  $-422   |    16
 429 |   14   380     6   400  |  $350 / $-2085  | $1084 / $-2124   |     4
 436 |   14   386     0   400  |    $0 /     $0  | $1284 / $-1823   |     0   <- WALLET READS ZERO
 ...every week thereafter is $0 / $0
```

| symptom | starts |
| --- | --- |
| the recap card drifts from the ledger | **week 424 – W9 2039** |
| the Money ledger tab is handed zero transactions | **week 432 – W17 2039** |
| the ordinary class is completely evicted (`kept 14 + evidence 386 = 400`) | **week 436 – W21 2039** |
| the wrap-up's best result is wrong | **season 3 – 2034** ("Semifinalist" over a real Champion) |
| the wrap-up says "no tournaments played" | **season 8 – 2039** |
| the wrap-up quotes a table she barely played in | **season 2 – 2033** |
| the wrap-up says "Unranked internationally" at a professional | **season 5 – 2036** (she is `wta #365`) |

The probe's career is *lighter* than the owner's (≈45 matches a season against his ≈60), which is why
its collapse lands in 2039 rather than his 2038. **The crossing is a function of matches played, not
of the calendar** – it arrives the week `kept + evidence` reaches 400, whenever that is.

Cross-checked against the real save: probe at week 436 is `kept 14 + evidence 386 + rest 0`; his save
at week 412 is `kept 18 + evidence 382 + rest 0`. The same state, reached by the same road.

### After

```
week | kept  evid  rest  total | card in/out      | ledgerTx
 403 |   13   267   120   400  | $1226 / $-2061   |   50
 468 |   15   265   120   400  |  $775 /  $-613   |   50
 520 |   16   264   120   400  |  $840 /  $-503   |   50

(A) weeks where the legacy event-feed fold drifts from the durable ledger: 0 of 520
    the ordinary class NEVER empties - min rest over the 247 saturated weeks: 120
    the Money ledger tab always has transactions - min over the saturated weeks: 50 of 50
```

| season | banked (shipped) | results ledger | what a feed scrape would still say |
| --- | --- | --- | --- |
| 2034 | Champion | Champion | Semifinalist |
| 2036 | Champion | Champion | Runner-up |
| 2037 | Champion | Champion | Semifinalist |
| 2038 | Champion | Champion | Semifinalist |
| 2039 | Champion | Champion | Semifinalist |

Five seasons of ten still under-reported by a feed scrape **even with the floor in place** – because
the floor holds ~120 ordinary rows, about thirty weeks, and a season is forty-nine. That is the
measurement that says the prune fix alone would not have been enough, and the read-side fix alone
would have left the ledger tab and the flavour lines empty. Both were needed.

And the rank line, following the per-track match record:

| season | matches dom/itf/wta | banked | the old line |
| --- | --- | --- | --- |
| 2031 | 10 / 1 / 0 | `National #4` | International #73 |
| 2032 | 0 / 8 / 0 | `International #8` | International #8 |
| 2034 | 0 / 5 / 13 | `Professional #367` | International #31 |
| 2038 | 2 / 0 / 17 | `Professional #363` | **Unranked internationally** |

On the owner's own save the same rule gives **Professional #288** for 2038, off a 21-14 W record
against 0-0 junior – and his 2038 best result, inverted from his own result rows, is **Champion**
(a W75 title paying 75 points, plus two National titles at 200).

---

## 6. What changed

1. **`pruneEvents` gets an ordinary-news floor** (`EVENTS_ORDINARY_FLOOR = 120`, world/constants.ts).
   Ordinary rows are still sacrificed first – but only down to the floor; then her matches,
   oldest-first; and only if trimming every match she ever played is still not enough does the floor
   itself give way. Her retained matches are therefore bounded at ~265 instead of growing to the
   whole cap.
   **Radar impact: none measurable.** `npm run bench:radar` is byte-identical before and after –
   the bench's horizon is 208 weeks and the change is invisible below week ~430. The argument that it
   is safe *above* that line is structural rather than empirical, and it is in `coachMarket.ts`
   already: the radar's confidence COUNT comes from `matchesEverPlayed`, which folds the durable W-L
   counters and `seasonHistory`, never the feed; the feed supplies only a per-match **rate**. A rate
   estimated over 265 matches instead of 386 is the same rate. 265 is also still four-plus
   professional seasons, i.e. more than the *"roughly the last year and a half"* window `radar.ts`
   describes itself as measuring over.
2. **WeekRecapCard reads `snapshot.finance.weekly12`** – the dense per-week series the engine already
   folds off `financeWeeks` for the Home budget chart – instead of scraping `snapshot.events`. The
   card only ever shows the CURRENT week, which a 60-week ledger always holds.
3. **The wrap-up's best result comes off `world.results`**, inverted through each tier's own points
   table (strictly decreasing, so a positive payout inverts to exactly one round). Three answers now,
   not two: a finish, *"no result that scored"* (she played, nothing counted), or *"no tournaments
   played"* (she did not play).
4. **The wrap-up's rank line follows the season's dominant track.** The rule, stated:
   > the track that carried the most **competitive matches** this season (`world.seasonRecord`, the
   > per-track W-L, read at the wrap before it is reset), ties broken by the points earned on each
   > track, and by the ladder's own order last so the higher table wins a dead heat. A season with no
   > matches at all falls back to `activeLadderOf` – the game's one answer to "which table is hers".

   Matches and not entries, because matches are the fact the save keeps: counting entries would mean
   counting result rows, which are award-only and would under-count exactly the rung a struggling
   professional plays most. `SeasonSummary` gains `rankTrack?` and `rankInTrack?` – both OPTIONAL with
   defaulting readers, the `weeksInjured` precedent, so **no schema bump**; a summary banked before
   this wave falls back to the old junior-table behaviour.
5. **`wtaEverCounted` / `activeLadderOf` move from `world/snapshot.ts` to `world/ladder.ts`** and are
   re-exported under their historical names. They are ladder facts, and the wrap-up needs the same one
   answer – but `snapshot.ts` imports `milestones.ts`, so reading it from up there would have been a
   runtime cycle and a second copy would have been the exact drift `activeLadderOf` exists to prevent.

---

## 7. Why the suite was blind – and it is a finding about the whole suite

**The caps are the untested region.** A save carries three independent caps (400 event rows by
count, 60 finance weeks by time, 52 result weeks by time) and every money and history screen reads
across them. Measured across every test file in the repo before this wave:

* the two longest careers are **520 weeks** (`tests/world.test.ts`) and **500** (`tests/offers.test.ts`)
  – and **neither enters a tournament**. With no matches in the feed the protected class is empty, the
  ordinary rows keep the whole budget, and the failure mode is unreachable *by construction*. The one
  test that explicitly checks the cap is respected (`world.test.ts`, "caps the event feed but never
  prunes keep:true events") is one of them: it asserts a bound that the bug never violated.
* the longest career that actually **plays** is **260–300 weeks** (`tests/ladder.test.ts`,
  `tests/world-trio.test.ts`) – five to six seasons, which is where a real career is while everything
  still works. The regime begins around **week 430**.
* the one test written *because of* this cap – `round11.test.ts` R11-12a, and it is a good test, it
  even carries its own anti-vacuity witness – runs **two seasons** and asserts the feed reaches 400
  rows once. Two seasons is where the cap starts biting, not where it saturates.
* even `tools/radar-bench.ts`, the tool that OWNS the events-cap coupling, has a **208-week** horizon.

So the honest summary is: **our tests only ever look at young careers, and the ones that look at old
careers do not play tennis in them.** Nothing in the suite had ever been to the part of the state
space where a cap has finished eating. It is not that the assertions were weak; the fixtures never
reached the bug.

### What now closes it

`tests/long-career-ledgers.test.ts` – one greedy 520-week career, built once, asserted many times
(~5 s):

* the regime is **reached** and stays reached (`kept + evidence >= EVENTS_CAP - FLOOR` on 20+ weeks;
  ≥200 retained matches) – the anti-vacuity claim every other assertion rests on;
* the ordinary floor holds on every saturated week; the ledger tab is never empty;
* the recap card's money equals `financeWeeks` cent for cent, every week;
* no wrap-up says "no tournaments played" over a season with a W-L; every wrap-up's best result
  equals the results ledger's;
* the old event-feed scrape **still disagrees** on at least three seasons – the bug's own witness,
  so the test cannot go quietly vacuous;
* the rank line names the track that carried the season, gives a professional season a professional
  number, and still names the junior table while she genuinely is a junior.

`tests/component/week-recap-money.test.ts` – the mounted half, because the snapshot was carrying the
money correctly the whole time and the *component* was reading a different field. One career, two
mounts: the snapshot as built, and the same snapshot with every `amountCents` row stripped from
`events` (which is precisely what the pruner did to the owner's save). A card on the durable ledger
renders identical figures both times.

**Mutation-verified**, each fix reverted in isolation:

| mutation | result |
| --- | --- |
| M1 – prune floor removed | RED (2 tests: the floor, the ledger tab) |
| M2 – recap card back on the event feed | RED (component: identical-figures) |
| M3 – best result back on the event feed | RED (1 test: equals the results ledger) |
| M4 – rank line pinned back to the junior table | RED (2 tests: dominant track, professional rank) |

### Two guard tests re-aimed, neither weakened

`tests/seasonWrapUp.test.ts`, both with a ⚠ comment naming the reason:

* *"fires the year-0 wrap-up milestone…"* – the alternation was `/International rank #\d+|Unranked
  internationally/`; it is now the three table names. The protected fact (fires on week 49, is kept,
  names the season, **states where she stands**) is unchanged, and a line that stopped stating where
  she stands is still RED. That fixture holds no point on any table, so it reads `Unranked – national`.
* *"a girl who HOLDS an international point…"* – the half asserting that a **domestic** girl reads
  `Unranked internationally` was itself the older half of this bug: she holds 300 national points and
  the Stats National tab has been calling her **#4** the whole time. It now asserts `National rank #4`.
  The claim the test exists for – a national result must never buy an *international* ranking – is
  untouched and still asserted, and a third case was **added**: a career with no counting result on
  any table still gets a word rather than the dense place of the 0-point tie.

---

## 8. Left open, deliberately

* **The rank-move arrow is ITF-only.** `world.seasonStartRank` (v17) is one persisted number and it
  is the junior rank; widening it to three tracks is a schema change and it cannot be back-filled,
  because the rank *at* the season's first week needs the 52 weeks before it, which `pruneResults`
  deleted 49 weeks earlier – the very reason v17 exists. Subtracting a junior start rank from a
  professional finish rank is the cross-currency subtraction `LadderView.prevRank` exists to forbid,
  so a professional season reports where she finished and no arrow. Fixing it properly is a v41
  three-part move: capture `seasonStartRank` per track at the season boundary.
* **`seasonHistory.endRank` is still the junior number** for every row, including rows banked for
  professional seasons. The Stats season table therefore shows a junior rank for a professional year.
  It is a persisted column with 30 rows of history behind it and changing its meaning retroactively
  would make the column incomparable down its own length; the honest fix is an added per-track column
  under a schema bump. Logged here rather than done, and it is the same "Still open" item
  `two-ladders.md` already carries.
* **"N pts this season" is still a mixed-currency sum.** `seasonPoints` folds every result row of the
  season regardless of track, so the wrap-up can print `Professional #288 · 460 pts` where the 460
  includes national points – the exact addition `LadderView.points` forbids ("National points and ITF
  points are different units and must never be added"). It is left alone here on purpose: the same
  figure is banked into `seasonHistory.points` and has been down the whole column, so narrowing it to
  the dominant track would make old rows and new rows mean different things – the identical objection
  that keeps `endRank` where it is. The honest fix is a per-track column under the same schema bump.
* **The recap's flavour line and the travel note still read the feed**, because they need a SENTENCE
  and `financeWeeks` stores cents. The floor is what keeps them alive; on a week older than the
  floor's reach they fall back to what they always fell back to (nothing).
* **`EVENTS_ORDINARY_FLOOR = 120` is a floor, not a tuning.** If the ledger tab ever wants more than
  `SNAPSHOT_FINANCIAL_EVENTS = 50` transactions, or the diary grows a read that needs more history,
  it moves – and the thing to re-measure when it does is the retained-match count, not the radar
  bench, which cannot see this at its current horizon.
