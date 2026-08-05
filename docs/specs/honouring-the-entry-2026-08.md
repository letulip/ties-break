---
type: spec
status: current
area: entries
canonical: true
last-reviewed: 2026-08-05
---

# Honouring the entry – the outgrown release, retired (`fix/outgrown-entry`, 05.08.2026)

## 0. What the owner hit

> «моя уже 22 летняя выиграла 2 w50 подряд и ее автоматом сняли с 3-го письмом без объяснения
> причины – я понимаю, что она переросла, но это ощущается очень странно. Надо поправить.»

She won two W50s back to back. The points those wins earned closed the W50 rung under her, and the
game cancelled **the W50 she had already entered**. He was told by letter. And when he went looking
for the reason:

> «а в ленте (мы же про новости?) не увидел сообщение, может пропустил»

## 1. Reproduced, on both surfaces, before anything was changed

A 22-year-old W50 regular (eight W50 results, merged W rank #264, one place outside `wta125`'s
acceptance cut of #250) enters a third W50 while the list is open, then banks two W50 titles. The
very next weekly tick, with `releaseOutgrownEntries` still in the tree:

**Surface 1 – the inbox** (`world.offers`, rendered by `OfferLetter.vue`). Two letters about the
same event. The second is the one he pasted, word for word:

> *Your withdrawal from the World Tour 50 (Mar 28 – Apr 3, 2039) is confirmed – in time, free of
> charge, and nothing is recorded against her. The entry fee is on its way back.*
>
> *– Tournament desk*

**Surface 2 – the news feed** (`snapshot.events` minus the money rows). Three rows, all present:

```
wk427 [info]  Entry released – she's outgrown World Tour 50. Fee refunded.
wk427 [entry] Withdrew from World Tour 50 – W17 '39
wk426 [entry] Entered World Tour 50 – W17 '39 (hard)
```

### 1a. The diagnosis, in the order the defects matter

1. **The agency is misattributed.** `releaseOutgrownEntries` called `releaseEntry`, which raises the
   letter written for a *player-initiated* withdrawal. He never withdrew. The feed said it too:
   *"Withdrew from World Tour 50"* is his verb on the engine's action, sitting one line below the
   reason. Two of the three things he could read agreed with the letter.
2. **The reassurances answer a question he never asked.** *"In time, free of charge, and nothing is
   recorded against her"* is written to settle a parent who **chose** to pull out and is worried
   about the cost. Addressed to one who chose nothing, it reads as the desk being defensive about
   something he did not do.
3. **The cause is on the other surface.** The `info` row naming the reason went to `world.events`;
   the letter went to `world.offers`. The channel that told him lacked the reason; the channel with
   the reason was not the one that told him.

### 1b. Did the feed row survive? Measured, not assumed

He did not miss a row that had been pruned. **The `info` row reaches the feed and stays there.**
Over 76 releases on 90 full careers (`tools/outgrown-entry-probe.ts`), the row was inside the
snapshot window the News list is built from – `world.events.slice(-60)` – on the week it was written
(76/76), a week later (76/76) and four weeks later (76/76). It is gone by +12 weeks, which is the
window doing its job. `EVENTS_ORDINARY_FLOOR` (this week's other fix) is what keeps it there.

**And that holds at HIS volume, not just a fourteen-year-old's**, which is the reading that matters
because a professional's week writes far more rows. Measured over 208 weeks of a funded career at
ages 21-24: the 60-row snapshot spans **5 weeks at worst, 7 at the median**, and the News list is
showing 10-26 non-money rows at a time. His row was on that screen for over a month.

So the feed did its job and the inbox undid it. The surface that ALERTED him – the letter, the one
with a dot on it – told him he had withdrawn her; and the `entry` row sitting directly beneath the
reason in the feed said the same thing. Two of the three rows he could have read agreed with the
letter. Fixing the copy on one surface and not the other would have left that intact.

What he saw instead was the **letter**, because that is the surface with a dot on it – and the letter
said he had withdrawn her. The feed row directly beneath the reason said the same thing.

## 2. The ruling

**An entry already taken is honoured.** In the sport, acceptance into a draw is not revoked because
your ranking improved between the entry deadline and the tournament: you play, and it is your last
event at that level. Outgrowing a rung is a statement about what she may enter **next**.

So a rung closing removes it from the **feed** and the **offer list** – which `tierOpenFor` and
`entryStatus` already do, untouched by this wave – and never from her **schedule**.

### 2a. The two ceilings still agree

The retired comment demanded it: `outgrewTier` (the domestic band) and `tierOutgrown` (the ladder's
sliding window, `act2-pro-tour.md` §11) "are the same event for the player and must have the same
consequence". They still are. The consequence is now identically *nothing* for a committed entry and
identically *closed* for the next one, on both.

The asymmetry this removes is the one that was actually visible to a player: the **pre**-deadline
entry was cancelled while the **post**-deadline entry played on (R12-3), so which of two identical
commitments survived depended on a date he was not thinking about.

### 2b. The dead end it once guarded is guarded twice over

R10-3's trap – an entry to a rung she outgrew that could be neither played, planned nor abandoned –
is closed by `cancelEntry` (R10-13, the parent's own exit, full refund inside the deadline) and by
`arrivalStatus` returning `verdict: 'play'` with `outgrown: true` (R12-3). The week is playable, the
card is visible, the Next-week button reads *"W50 (outgrown)"*, and the fee is still refundable if he
would rather have the money. Nothing in this wave touches any of that.

### 2c. …and where a release is genuine, the letter says who and why

One automatic release survives: the **injury auto-withdraw** (F45-2), which takes her name off a
still-open list when the layoff swallows the event week. It was raising the same misattributed
letter, on every W-rung entry, for as long as it has existed. `releaseEntry` now carries an
`EntryReleaseReason` and the desk's letter has a **third arm** – entered / withdrew / released –
which names the actor in its first three words, gives the cause in the next sentence, and drops the
reassurances that only a voluntary exit asks for. The feed row obeys the same rule
(*"Taken out of World Tour 50 – W17 '39, she is not fit for that week."*).

### 2d. The other candidates for a genuine release, checked

The brief asked whether some rule makes an entry truly unplayable, so the released arm has real work.
Two were checked against the code:

* **The tour's own age rule – UNREACHABLE, and by construction rather than by luck.** The J rungs
  close at 18 inclusive (`TierDef.maxAgeYears`), so an entry taken at the end of one season for an
  event in the next could in principle age out between them. It cannot: `availabilityStatus` asks
  `tierAgeBlock(event.tier, ageAtWeek(event.week))` – **the event's own week**, not today's – so the
  entry is refused at the door, with "at 19 she has aged out". Nothing to release.
* **A tour suspension handed down AFTER she entered – a real gap, and it is not this wave's.**
  `isSuspendedAt` gates `availabilityStatus` (entry) and `mandatoryBinds`, and nothing else.
  `arrivalStatus` checks only the layoff and the medical floor, so a suspension that lands inside
  `tickWeek` and covers a week she is already committed to does not stop her playing it. That is
  genuinely "a rule that would make the event unplayable", but the answer is not automatically
  "release" – past the deadline the fee is forfeited by the existing rule, so a release there is a
  different decision from this one. Filed as its own task; when it is answered, `EntryReleaseReason`
  and the released arm are where the copy goes, and the engine's copy switch will not compile until
  somebody writes it.

## 3. Measured – `tools/outgrown-entry-probe.ts`, 180 careers per arm

⚠ **`tools/outgrown-entry-probe.ts` is new and is the instrument for all of §3.** It reads the world
and never writes to it, it runs unchanged on both sides of the fix, and its arm-A player column
reproduces `population-1600-2026-08.md` §4 to within two places – which is the check that licenses
believing anything else it says.

`npm run bench:outgrown -- --seeds 10 --weeks 1248 --policy both [--lookahead 14]`. Nine econ-bench
presets x 10 seeds x both policy arms, full 24-season horizon, fork answered "continue". Arm A is the
pinned pre-change tree; arm B is this branch, same command.

### 3a. How often it fired

| | careers hit | releases | mean/career | rungs | age |
| --- | --- | --- | --- | --- | --- |
| grinder, bench lookahead (3 wk) | 64/90 (71%) | 76 | 0.84 | local 62 · regional 13 · national 1 | median 14 |
| player, bench lookahead (3 wk) | 63/90 (70%) | 74 | 0.82 | local 63 · regional 10 · national 1 | median 14 |
| grinder, early committer (14 wk) | 90/90 (100%) | 602 | 6.69 | local 527 · regional 75 | median 14 |
| player, early committer (14 wk) | 90/90 (100%) | 599 | 6.66 | local 527 · regional 72 | median 14 |

**The bench understates it, and the reason is the axis the bench cannot express.** `stepCareerWeek`
commits only as a deadline nears (`ENTRY_LOOKAHEAD` = 3 weeks), so a bench career is exposed to the
ceiling for at most three weeks between entering and the list closing. A human plans a season. At a
14-week lookahead the same careers see it **eight times as often**, and every career sees it.

**But it lands on the DOMESTIC rungs**, at fourteen, where the fee is small and no letter is raised
at all (`raiseEntryCancelLetter` only fires for `cappedProTiers`). The professional variant – the one
that writes to the inbox, and the one the owner hit – needs the ladder ceiling to close inside the
window between committing and the deadline, which takes a career good enough to walk past a rung in a
fortnight. It is rare in a bench population and it is exactly what "won two W50s back to back" means.
`tests/outgrownWithdraw.test.ts` pins that case deterministically.

### 3b. What honouring it costs

Same command, 90 careers per policy, the only difference between the columns is this branch.

| | arm A (release) | arm B (honoured) | delta |
| --- | --- | --- | --- |
| releases | 76 grinder · 74 player | **0 · 0** | the mechanic is gone |
| **player** peak W rank – best / p10 / median / worst | #22 / #116 / #157 / #620 | **#22 / #117 / #160 / #706** | best identical, median **−3 places (1.9%)** |
| **grinder** peak W rank – best / p10 / median / worst | #101 / #150 / #230 / #766 | **#121 / #168 / #247 / #1,069** | median −17 places (7.4%) |
| peak ITF junior rank (player, median) | #19 | #21 | −2 |
| peak domestic rank (player, best/median/worst) | #1 / #1 / #5 | #1 / #2 / #5 | flat |
| draws at an outgrown rung, player | 266 of 7,290 (3.6%) | **476 of 7,193 (6.6%)** | +210 draws |
| points those draws paid, player | 6,097 · mean 22.9/draw | 10,661 · mean **22.4**/draw | the rung pays the same little |
| longest unbroken run of them | 2 tournaments | **2 tournaments** | unchanged |

⚠ **The arm-A player column reproduces the published baseline**, which is what licenses reading the
rest of the table: `population-1600-2026-08.md` §4 records player best **#22** / median **#155** over
180 careers of both retirement arms; this probe's single-arm population reads **#22 / #157**. The
instrument is measuring the same game.

**Reading it honestly: it is not free, and it is not much.** On the funded arm the change is
invisible – the best career reads the same #22, p10 moves one place, the median moves three. On the
grinder arm it drifts further, and the mechanism is real rather than noise: the grinder spends to the
floor, so it feels both halves of the honoured entry (the fee is not handed back, and the freed week
is not available to re-book at the rung she has just been promoted into) where a player arm holding a
$5,000 reserve absorbs them. Against 90 chaotic careers per cell a 3-place median move is inside what
this instrument can resolve and a 17-place one is at its edge; neither is a balance change worth
paying for, and the point of the wave is not a balance change.

**What she is playing is what the design says she is playing**: 22.4 points a draw at a rung she has
walked past, against a W50 title's 50 and a best-16 window that is already fuller than that. An
outgrown rung pays little by construction, and the measurement agrees.

#### 3b-bis. The early committer is where it costs, and that is the honest reading

Run the same A/B at a 14-week commitment horizon and the grinder arm – no reserve, no rest floor,
enters everything it can as soon as it can – moves further than anything above:

| early committer (14 wk) | arm A | arm B |
| --- | --- | --- |
| grinder – draws at an outgrown rung | 112 of 4,890 (2.3%) | **730 of 5,255 (13.9%)** |
| grinder – points they paid | mean 23.2/draw | mean **18.9**/draw |
| grinder – longest unbroken run | 2 | **3** |
| grinder – peak W rank, best / median | #133 / #286 | #159 / **#345** |
| player – draws at an outgrown rung | 249 of 6,669 (3.7%) | **1,251 of 7,035 (17.8%)** |
| player – longest unbroken run | 2 | **6** |
| player – peak W rank, best / median | #74 / #168 | #120 / **#182** |

**The release was partly a refund subsidy for over-committing, and removing it is the point rather
than a side effect.** A career that books a season ahead and spends to zero used to be handed its fee
back every time the ladder moved under it. It is not any more, so committing early now carries the
risk that committing early should carry – which is the same sentence as "an entry already taken is
honoured", read from the other side. The funded arm, which keeps a reserve and does not race worn
out, barely notices (§3b).

## 3c. Can a career now sit on an outgrown rung instead of climbing?

**Not indefinitely – but the tail is longer than "one last event", and the number deserves saying
out loud rather than being asserted away.**

The structural half first. `entryStatus` refuses a NEW entry at a closed rung, untouched by this
wave, so the only draws she can ever play there are ones **committed before the crossing**. The run
is therefore bounded by how many entries she can be holding at once, which is bounded by how far
ahead she commits (one tournament a week, so a 14-week horizon tops out around seven).

Measured, 180 careers per cell:

| longest unbroken run of outgrown-rung tournaments | arm A | arm B |
| --- | --- | --- |
| bench commitment horizon (3 wk) | 2 · mean 0.83–0.94 | **2** · mean 1.10–1.12 |
| early committer (14 wk), grinder | 2 · mean 0.76 | **3** · mean 1.66 |
| early committer (14 wk), player | 2 · mean 0.92 | **6** · mean 1.94 |

So a parent who books a quarter ahead and then walks past a rung can spend up to **six weeks**
finishing commitments there. That is the structural ceiling doing exactly what it should – it is the
entries he already took, and no more – but it is not "her last event at that level" in the singular,
and a career could feel it as a stall.

Three things keep it from being a plateau strategy, and none of them is new code:

1. **It cannot repeat.** Once the rung closes, no further entry can be taken at it. The tail runs
   down and there is no way to top it up.
2. **It pays nothing worth having.** 20.1 points a draw against a W50 title's 50, into a best-16
   window that already holds better – which is what an outgrown rung means.
3. **The exit is the parent's, which is the whole point of the ruling.** `cancelEntry` still hands
   the fee back inside the deadline and frees the week. The game no longer decides for him; he can
   still decide. The old behaviour was not a guard against sitting still – it was the game taking
   the choice away and calling it a withdrawal he had made.

## 4. What shipped

- `src/engine/world.ts` – `releaseOutgrownEntries` and its tick step **retired**, with the reasoning
  kept in place of the code. Zero draws before, zero draws after: the frozen MAIN capture
  (41550 / `e6b0c709`) and the B1/C1 invariance freezes cannot see the change.
- `src/engine/world/entries.ts` – `releaseEntry(world, id, releasedBy = 'parent')`. The `'parent'`
  arm is byte-identical in feed text, letter terms and ids.
- `src/engine/world/injury.ts` – the auto-withdraw passes `'injury'`.
- `src/engine/offers.ts` / `src/shared/protocol.ts` – `EntryLetterTerms.releasedBy?: EntryReleaseReason`.
- `src/components/OfferLetter.vue` – the third arm.
- **No schema bump.** The field is additive and optional, nothing back-fills (the reason was never
  recorded, so there is nothing to recover), and old letters render exactly as they did. This is the
  `wallet-and-wrapup` precedent from three days earlier – «No schema bump. `SeasonSummary` gains
  `rankTrack?` / `rankInTrack?`, both optional with defaulting readers» – and the precedent of the
  entry-letter family itself: commit `2763caa` added the `entry` offer kind, the whole
  `EntryLetterTerms` shape and `cancelled` with `SAVE_SCHEMA_VERSION` untouched at 36.
  **v44 was reserved for this wave and is not used; it remains free.**

## 5. The nets, and the two that were re-aimed

- `tests/outgrownWithdraw.test.ts` – **re-aimed, not deleted**. Every case the old file tested is
  still tested; the three the ruling inverts are asserted in their new direction, and four facts the
  old behaviour made unreachable are added (she plays it, the fee stays committed, the escape hatch
  still refunds, the LADDER ceiling behaves identically to the domestic one). Mutation-verified: put
  the release back and 6 of 8 go red.
- `tests/round11-followups.test.ts` – **re-aimed**: `withdrawnFrom` read only the parent's verb,
  which was the neighbouring half of the same bug. It now accepts both verbs and a new assertion
  requires the desk's own. Mutation-verified: drop the `'injury'` argument and it goes red.
- `tests/world-trio.test.ts` – **fixture seed moved**, per its own message ("tune the fixture, not
  the rule"). She now plays draws this career used to be withdrawn from, so the crossing loss fell
  outside five seasons. Assertions unchanged.
- `tests/offers.test.ts` – the desk suite grows three: the parent's letter carries no `releasedBy`
  key at all, an injury release carries `'injury'` on both surfaces, and an end-to-end run through
  the real `rollInjury` onset.
- `tests/component/home-strip-and-mail.test.ts` – five **mounted** assertions on the three arms,
  mutation-verified in both directions (kill the released arm: 1 red; let it swallow the voluntary
  one: 2 red).

---

## 6. THE SAME SHAPE, FROM THE OTHER SIDE – the dead weeks (05.08, second owner report)

> «у меня сейчас там висит 5 w-серий подряд, т.е. я вообще 5 недель не могу нигде играть, хотя j30,
> j60, j300 мне вполне доступны. Вместо этого я вижу 5 карточек с недоступными турнирами.»

Five consecutive weeks of W cards a sixteen-year-old cannot enter – his professional allowance is
spent (the AER, §5) – while J30/J60/J300 are open to him and not shown. Same defect family as §1:
**what the feed OFFERS is not what she can PLAY.** §1 is a rung closing above her; this is a whole
band shut for the season.

### 6.1 The principle was already written down – R10-3, in this very file family

`seasonSupply` (`src/engine/world/snapshot.ts`) counts what is left in a season and says it plainly:

> *"An entry already made is hers whatever the gate says now (R10-3: a committed week survives a
> band crossing), so it is counted before the gate is asked."*

That is the rule `releaseOutgrownEntries` broke. One surface of this codebase already knew that a
committed entry survives a band crossing and counted it that way; another cancelled it. §2's ruling
is not a new principle – it is a second place made to obey one the project decided at R10-3. The same
sentence is the spine of the fix below: `upcomingEvents` carries the entry verdict on every card
(`eligible` / `ineligibleReason`) and is explicit that it "is NOT a verdict on `entered`" – the data
was always right. What was wrong was the PICK.

### 6.2 Display or supply – measured before proposing anything

`tools/dead-week-probe.ts` (`npm run bench:deadweek`) reads the shipped predicates – `toSnapshot` for
the cards, `feedContext` / `feedShows` / `preferredWeekEvent` for the feed – so it cannot disagree
with the screen. 54 careers, 8 seasons, one record per calendar week judged 4 weeks out.

**It is common, not a corner.** 13–16% of card-bearing weeks show a card she cannot act on, the
longest run visible on one screen reaches **8** (median 6), and **51 of 54 careers hit a run of 3 or
more**. His five in a row is the normal experience.

**But most of it is SUPPLY, not display.** Split by why the shown card refuses her:

| shown card refuses because… | dead weeks | of those, DISPLAY (an enterable event was on the same week) |
| --- | --- | --- |
| `unavailable` (exam, vacation, age, suspension) | 381 / 579 | 1.8% / 8.1% |
| **`capped` (the pro allowance – his case)** | 341 / 110 | **16.1% / 38.2%** |
| `medical` | 141 / 34 | 0% |
| `injured` | 35 / 5 | 0% |

(grinder / player.) And on the supply weeks the calendar is **not empty** – only 13–27 of several
hundred carried no other event at all. The other events are there and refused for their own reasons:
`locked` (a rung she has not reached) dominates, with `outgrown` (a rung she has passed on points)
second.

### 6.3 What shipped here, and what deliberately did not

**Taken – the pick.** Both feed surfaces collapse a stacked week through `preferredWeekEvent`, which
asked only which rung was TALLER. `preferredWeekEvent` now has three tiebreaks: entered, then
**enterable**, then the highest rung. Measured after: the DISPLAY column is **0 in every row** – 62
and 89 dead weeks removed, and the `capped` case drops 341 → 286 and 110 → 68. A week where nothing
is enterable still shows its tallest card, so this is a re-order and never a filter.

**Not taken – the supply half, and it is the larger one.** The remaining dead weeks carry only rungs
she has not reached or has passed. Two things are worth separating there, and neither belongs in this
branch:

* **The `outgrown` slice is backlog #84's own case** – *"outgrown rungs stay playable as a fallback,
  never in the feed"*. Ruling 2's boredom guard already lifts the LADDER ceiling when the pro
  allowance is spent (`tierOutgrown` returns false for non-`wta` rungs), but the DOMESTIC POINT BAND
  is a second ceiling in a different function (`isTierEligible`, via `tierFloorOpen` and
  `entryStatus`'s domestic arm) and it is not lifted. So the guard's promise – «если не w-серии то
  где-то еще» – is delivered for the J rungs and not for local/regional/national. That is the same
  "two ceilings must agree" argument as §2a, and it is an ENGINE gate change with balance
  consequences.
* **The `locked` slice is genuine supply** – the calendar put rungs above her on those weeks. If
  anything is to be done there it is in calendar generation, which is a much bigger change than any
  brief here, and it should be decided against §11.1's own playable-weeks measurement.
