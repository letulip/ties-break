# The sponsor window – five weeks of post, and contracts that end with the season

**Branch** `feat/sponsor-window` · **schema** v41 · **05.08.2026**
**Bench** `npm run bench:sponsor` (`tools/sponsor-window-bench.ts`) · 432 careers x 312 weeks per arm

---

## 1. The bug report is the owner's own career

He played a save and decoded it. Three kit deals in six seasons:

| week | tier | brand | outcome |
|---|---|---|---|
| 153 | global | Play Beyond | signed, ran to 207 |
| 257 | local | String House | **expired unsigned at 262** |
| 309 | national | Netrally Distribution | signed, runs to 415 |

Letters were raised on exactly one week a year – `isSponsorReviewWeek(week) = isOffSeasonWeek(week)
&& !isOffSeasonWeek(week - 1)`, the first quiet week of a three-week off-season. So when the String
House letter lapsed at week 262 – the *second week of a season*, because a four-week deadline from
week 257 reached past the year's end – **the next letter did not arrive until week 309. Forty-seven
weeks with no kit deal at all**, and no way to shorten them.

The goal he stated is not "more sponsorship". It is continuity:

> «Основная цель: если девочка хорошо играет, то наверняка ее замечают и у нее есть спонсоры в том
> или ином виде на протяжении всей карьеры. Сейчас меня выручали локальные, которые денег давали
> иногда – это тоже хорошо, без них было бы сильно хуже.»

And the design, in his words:

> «мне кажется нужно делать окно на все 5 недель (межсезонье +2) а заканчивать контракты вместе с
> сезоном на 49 неделе (если они однолетние), т.е. чтобы с 50 точно уже было пусто… и как раз в окно
> могут приходить письма и есть время на принятие решения и выбор (если он будет конечно).»

---

## 2. What was measured BEFORE anything changed

The headline is worse than his anecdote. His 47-week hole was **better than the median career**.

| | eager signer | patient signer |
|---|---|---|
| career sponsor coverage | **37.3%** | 35.8% |
| longest gap, p50 / p90 / max | **104 / 208 / 265** | 104 / 208 / 265 |
| longest gap after her first deal | 101 / 208 / 208 | 103 / 208 / 208 |
| letters per career (6 seasons) | 2.2 | 2.2 |
| signed / refused / expired | 2.2 / 0.0 / 0.0 | 2.2 / 0.0 / 0.0 |
| sponsor value per career | $1,893 | $1,871 |
| ...as a share of total income | 0.8% | 0.8% |
| letters by rung, per career | local 1.75, national 0.33, global 0.01 | local 1.73, national 0.35, global 0.01 |

Read plainly: a career spent **two thirds of its life with no kit deal**, got 2.2 letters in six
seasons, and its typical dry spell was **two whole seasons**. 213 of 216 careers were covered at some
point, so the ladder was reachable – it simply did not hold. Nothing expired, either: the failure was
never that players missed letters, it was that **letters were not written**.

Two mechanisms produced it, and both are schedule rather than balance:

1. **One arrival week a year, one rung.** `rungFor` returned the single best rung she cleared, rolled
   once at `offerChance` 0.7–0.9. A failed roll cost the whole season, and the rungs below the best
   one never got to try.
2. **A running contract shut the post.** `raiseKitOffer` refused to write while *any* deal was live
   or *any* letter unanswered – and a term ran to week 51, three weeks past the only week a letter
   could be raised on. So a one-season deal and its successor could never meet.

---

## 3. The schedule that ships

### 3.1 A five-week window, weeks 47–51

`SPONSOR_WINDOW_WEEKS = OFF_SEASON_WEEKS + 2` – written as the owner's own sentence rather than as
the number 5, so a change to the off-season moves the window with it.

```
week   45 46 | 47   48   49   50   51 | 52
             |  ^ window opens        |  ^ season 1 opens
                verdict on the        |
                outgoing deal      window closes
             |<------- letters ------>|
                                   ^ nobody writes here
```

* **`isSponsorWindowWeek`** – 47..51. `reviewSponsors` runs on every one of them.
* **`isSponsorWindowOpenWeek`** – 47. The outgoing deal is judged here and the brand's goodbye letter
  is posted here, because the verdict decides who may write and the first letter goes out today.
* **`isSponsorLetterWeek`** – 47..50. At most one letter a week.
* **`isSponsorWindowCloseWeek`** – 51. The one feed row of the sponsor year is written here.

**Every letter in a window expires when the window closes.** That is the answer to "does a letter
raised late in the window expire before he can act on it": the deadline is a property of the window,
not of the letter, so the first letter of a winter carries five weeks and the last carries two, and
**no decision is ever open while she is playing**. That last property is what the 01.08 move into
the off-season existed to buy, and a per-letter `decideWeeks` deadline would have thrown it away – a
letter raised on week 50 would have run to week 54, deep into the new season. `SPONSOR_LETTER_WEEKS =
SPONSOR_WINDOW_WEEKS - 1` is the guarantee that replaces "four weeks each": the closing week is the
parent's, so no letter can ever get less than two.

`ECONOMY.sponsorship.decideWeeks` did not move. It now sizes the window – `decideWeeks + 1 = 5` – and
that is the same five as «межсезонье +2», to the week. Both readings are pinned in the tests.

### 3.2 The rungs she clears write, strongest first

`windowLadder(standing)` takes the rungs `standingClears` says would have her, cuts the list to the
window's four letter weeks **from the top**, and hands them out one per week in that order. A girl
inside the world top 8 hears from Play Beyond on week 47, Netrally on week 48 and String House on
week 49. By week 49 she holds three letters and may sign any of them; on week 51 she must have
decided.

**The order is the whole safety property.** My first build had it weakest-first, on the reasoning
that a modest deal on the table in week 47 against a bigger name that may not come by week 50 is the
gamble the owner described. It is not a gamble – it is a **trap**: a parent who signs the first
letter he is ever sent would have thrown away the better one without ever seeing it. Four existing
guard tests failed on exactly that (`expected 'local' to be 'global'`), and they were right to. The
shipped order keeps `rungFor`'s own rule – *"an ambitious parent is being written to by the biggest
name that would have him"* – and relaxes only its exclusivity, so the lower rungs arrive as
**alternatives** to a letter he already holds rather than as a replacement for it. Signing on sight is
never a mistake; waiting is always optional.

**Nothing is manufactured.** Every letter is from a rung her standing genuinely clears; a career that
clears one rung gets one letter and a career that clears none gets none. Each letter rolls its own
dice on its own week (`shopWritesAt(seed, week, ...)` – the same purpose-scoped `seed:offer:<week>`
sub-stream, never MAIN). The lower rungs are what catch a career the big brands passed on, which is
the *mechanism* behind the owner's stated goal rather than a guarantee bolted on top of it.

### 3.3 Contracts end with the season, on week 49

`contractEndWeek(week) = floor(week / 52) * 52 + 49`. `dealUntilWeek` is built on it:

```
coveredSeasonStart(offer.week) + (seasons - 1) * 52 + 49
```

A one-season deal signed in this winter's window covers weeks 0–49 of the next season and stops. By
week 50 the slot is demonstrably empty while the window is still open – «чтобы с 50 точно уже было
пусто». The fortnight a term gives up carries no tournament, no ranking and no entry.

### 3.4 "One brand at a time" becomes "is the season ahead spoken for"

The old rule turned a letter away while *anything* was running or unanswered. Under a five-week
window that is backwards on both counts – the outgoing contract is live for the window's first three
weeks *by construction*, and an unanswered letter blocking the next one makes an accumulating choice
impossible.

`seasonSpokenFor(offers, week)` asks the narrower question that actually matters: **is the season she
is about to play promised to a brand?** A multi-season deal with a year left to run still turns the
whole window away – that is its bite, and it is pinned. A deal in its last season does not.

### 3.5 `fromWeek`: the deals meet exactly

The window opens three weeks before the outgoing contract closes, so a letter signed on week 47 would
otherwise be in force in the same week as the deal it replaces – and `activeKitDeal` promises there
is at most one. `dealStartsAt(offers, week)` returns today, unless a signed contract runs past today,
in which case it returns **the week after that one stops**. `signOffer` freezes it onto the offer as
`fromWeek`, and `activeKitDeal` reads it instead of `decidedWeek`.

The result is a seam with neither an overlap nor a gap, swept week by week in the tests: over two
consecutive terms, exactly one deal in force every week.

Signing also **closes the other open letters** (`refused`, same week), because the inbox dot is
`hasLiveOffer` and a letter left open would keep knocking about a decision already taken.
`offerAnswerError` refuses a second kit signature independently, so a stale screen cannot break the
one-deal invariant either.

---

## 4. Schema v41 – the migration, and which way it rounds

Two fields on signed kit offers, both forced by the schedule change.

| field | back-fill | exactness |
|---|---|---|
| `fromWeek` | `decidedWeek` | **exact.** `decidedWeek` is precisely what a pre-v41 deal meant by "the first week it covers" – `activeKitDeal` read it as the start of cover. Nothing is reconstructed. |
| `untilWeek` | `floor(w / 52) * 52 + 49` | one rule, both directions |

**The direction, stated.** Every term written before v41 ended on the calendar year's last week
(offset 51): `dealUntilWeek` ran `seasons * 52 - 1` from the covered season's start, and
`endDealWithSeason` used `seasonLastWeek`. Those land **two weeks later** than the new rule, so every
shipped shape is trimmed **DOWN** by one or two weeks – and they are off-season weeks that carry no
tournament, no ranking and no entry, so what is actually lost is at most a fortnight of the freshness
ceiling. A term ending **earlier** in a season – which no shipped rule produces, but a hand-edited or
a future save could – is rounded **UP** to the same week, because extending a promise is the safe
direction and shortening one is not. Both cases are one expression; both are pinned.

Append-only migration in `engine/migrations.ts` (`if (v === 40)`), golden fixture
`tests/fixtures/saves/v41.json`, README row. Zero draws on any stream – a signed contract is
post-draw state – so the frozen MAIN capture (41550 / `e6b0c709`) is untouched by construction.

**One known consequence for a career loaded mid-window.** The outgoing deal's verdict runs on week 47
only. A save that is loaded at week 48–51 in its first migrated season therefore skips that one
year's verdict: no goodbye letter, and no `minEvents` check for that season. The contract still ends
on week 49 by term, so nothing is over-paid, and the following window is normal. Judging on a later
week instead would mean judging a season with two of its competitive weeks unplayed and failing a
girl for events she had not yet had the chance to enter, which is the worse trade.

> ⚠ **CLOSED, 06.08 – and it was not a small consequence, it was the bug.** Shipping this as a
> stated cost was the wrong call: the owner merged the wave, loaded his own career, and it was a save
> at exactly week 48. He got **no sponsor letter at all** – the outcome the whole wave existed to
> prevent. The trade above is real and the answer was to take it on both sides: the verdict is now
> **once a season, on whichever week of the window the career first reaches**, and the count it is
> judged on is anchored on the window's OPENING week so a late verdict judges the same rolling year
> an early one would have. See §10. Nothing in §§1–5 below it is superseded.

---

## 5. What was measured AFTER

Same bench, same 432 careers per arm, same seeds. Nine presets x two management policies x twelve
seeds x 312 weeks, both signing policies.

### 5.1 The headline – coverage and the gap

| | BEFORE eager | AFTER eager | | BEFORE patient | AFTER patient |
|---|---|---|---|---|---|
| **career sponsor coverage** | 37.3% | **50.1%** | | 35.8% | **47.5%** |
| **longest gap after her first deal** – p50 | 101 | **54** | | 103 | **54** |
| ...p90 | 208 | 205 | | 208 | 210 |
| ...max | 208 | 210 | | 208 | 210 |
| longest gap from week 47 – p50 / p90 / max | 104 / 208 / 265 | 101 / 210 / 265 | | 104 / 208 / 265 | 105 / 210 / 265 |
| careers ever covered | 213 / 216 | 211 / 216 | | 213 / 216 | 211 / 216 |
| week of her first deal, p50 | 49 | **47** | | 51 | 51 |

**The owner's own number halves.** The median longest hole *after she has been signed once* goes
**101 weeks to 54** – from two seasons to one. That is the number he felt: his was 47 weeks and it
was better than the median career of the day.

**Coverage goes 37.3% to 50.1%**, a third more of her life in somebody's kit.

**The overall gap barely moves, and that is honest.** 104 -> 101 weeks at the median, because that
statistic is dominated by the years *before anybody had ever written to her*. The window is a
schedule fix; it cannot make a fourteen-year-old good enough for a rung she does not clear. Which is
the point – see §5.4.

### 5.2 The mail

| | BEFORE eager | AFTER eager | BEFORE patient | AFTER patient |
|---|---|---|---|---|
| letters raised per career (6 seasons) | 2.10 | **2.85** | 2.10 | **3.16** |
| signed | 2.07 | 2.80 | 2.05 | 2.79 |
| refused | 0.00 | 0.00 | 0.00 | **0.32** |
| expired unsigned | 0.03 | 0.05 | 0.04 | 0.05 |
| by rung: local / national / global | 1.75 / 0.33 / 0.01 | 2.31 / 0.50 / 0.03 | 1.73 / 0.35 / 0.01 | 2.57 / 0.54 / 0.03 |

Both rungs grow by about the same *proportion* – local x1.32, national x1.52 – so the extra post is
the ladder writing more often, not the floor being widened. `tour` / `premium` / `icon` stay at
essentially zero: no career in these presets reaches the professional gates inside six seasons, which
is `brand-gate-bench`'s own finding and not this change's business.

**Expiry is still ~0.05 per career.** It was never the failure mode: players did not miss letters,
letters were not written.

### 5.3 The money

| | BEFORE | AFTER | delta |
|---|---|---|---|
| sponsor value per career (eager) | $1,893 | $2,855 | **+$962** |
| ...per season | $316 | $476 | +$160 |
| total career income | $209,867 | $209,736 | ~unchanged |
| **sponsor as a share of income** | **0.77%** | **1.12%** | **+0.35 pp** |
| patient arm, same figures | $1,871 / 0.76% | $3,044 / 1.20% | +$1,173 / +0.44 pp |

**This is a finding the owner should have in front of him, and it is a small one.** Sponsorship is
worth about half as much again, but it goes from three quarters of one percent of career income to
just over one percent. On a ~$210k career that is **+$160 a season**. It is not a silent subsidy, and
it is not going to move a bankruptcy verdict – the econ bench's survival numbers should be
unaffected. The worst cell is `120k wealthy / high coach / player`, where it reaches **3.0% of
income** ($11,986) – a career already winning, taking the top rung's travel share on a large travel
bill. That is the earned direction, but it is the number to watch if the ladder is ever retuned.

Where the extra money comes from, per career (eager): kit cover $1,496 -> $2,192, travel share
$314 -> $581, retainer/bonus unchanged at $82. So it is **more weeks under a deal**, not a richer
deal – which is exactly what a schedule change should produce, and is the cross-check that no rung's
terms moved.

### 5.4 Does a weak career still get deals? No – and the split widened

The bench splits each arm at the median tournament count.

| | BEFORE eager | AFTER eager |
|---|---|---|
| the competing half (>= median events) | 44.7% covered, 2.4 letters | **62.8% covered, 3.5 letters** |
| the quieter half | 29.8% covered, 1.7 letters | **35.3% covered, 2.0 letters** |
| **the spread** | 14.9 pp | **27.5 pp** |

The competing half gains **+18.1 pp** of coverage; the quieter half gains **+5.5 pp**. The window
rewards a career that is playing roughly three times as much as one that is not, and the gap between
them nearly doubles. Continuity is earned, not granted.

The single sharpest case is the `25k middle / high coach` cell, which the econ bench already
identifies as the family that cannot afford its coach: **19.0% -> 20.6% coverage, 1.0 -> 1.0 letters,
gap p50 208 -> 210 weeks.** A career that stops competing gets nothing extra from the window at all.

### 5.5 Waiting became a real decision, which it was not before

BEFORE, the patient arm was strictly worse than the eager one – 35.8% against 37.3% coverage, the
same money, zero refusals. There was only ever one letter, so holding it could only lose.

AFTER, holding to the last quiet week costs **2.6 pp of coverage** (47.5% vs 50.1%) and buys
**+$189 of sponsor value** (3,044 vs 2,855), with 0.32 letters a career refused because a better one
was taken instead. That is the trade the owner asked for – «есть время на принятие решения и выбор» –
and it is now priced in both directions rather than being a pure penalty.

---

## 6. The reading

1. **The mechanism was the schedule, and fixing the schedule fixed it.** No gate moved, no allowance
   moved, no `offerChance` moved. Coverage rose a third and the post-signature hole halved purely
   because letters are written on four weeks instead of one, from every rung she clears instead of
   the best one, and because a contract stopped shutting the door on its own successor.
2. **The residual p90 gap is a career that STOPPED, and that is the design working.** The p90 is
   still 205 weeks, so I went and looked rather than theorising. Of the 216 eager careers, **63 carry
   a gap of 150+ weeks after their first deal**, and they are a different population:

   | | gap >= 150 wk (63 careers) | gap < 100 wk (117 careers) |
   |---|---|---|
   | mean tournaments entered, 6 seasons | **6.2** | **14.8** |
   | letters raised | 1.73 | 3.41 |
   | careers that ENDED (bankruptcy / retirement) | **32 of 63** | 13 of 117 |

   They played about one tournament a season and half of them ended. By preset they concentrate
   exactly where the econ bench says the family cannot afford its coach – 19 in `25k middle / high
   coach`, 13 in `25k middle / middle coach`. **The long gaps are careers that stopped competing, and
   a career that stops competing is supposed to lose its sponsors.** That is the owner's own framing
   and the measurement says it holds.

   ⚠ I had written a different explanation here first – that the p90 was a girl whose domestic points
   decayed while she went international, leaving her between the `local` and `national` gates. The
   data does not support it and it is recorded here as a discarded hypothesis rather than deleted,
   because it is a plausible-sounding story that a reader might otherwise re-invent. Whether that
   band-gap exists at all is a separate question and would need its own measurement.
3. **The money is small and should be stated anyway.** +0.35 pp of career income. The whole economy
   is being re-measured this week; this is the size of the footprint the sponsor change leaves in it.
4. **Nothing about the letters changed.** They still read as letters from a person at a company; the
   only line that moved is the one the code already generated («N weeks to decide»), which now says
   five for the first letter of a winter and two for the last, because it is computed from the
   deadline rather than written down.

---

## 9. Gates

| gate | result |
|---|---|
| `vue-tsc -b --force` | clean |
| `npm run test:quiet` | **112 files / 2,386 tests green** |
| `npm run test:component` | 8 files / 88 tests green |
| `npm run test:sim` | **8 files / 80 tests green.** Exit 1 is the documented birpc artefact – «a hard-coded 60s RPC timeout that a minutes-long synchronous Monte-Carlo file will blow past, exiting 1 with every test green» (CLAUDE.md). The run took 317 s against its usual ~70 s because a second agent's bench held the machine, which is the contention the same note warns about. Zero assertion failures. |

The sim project is the load-bearing one here: `econ-bench.test.ts`, `econ-reach.test.ts`,
`econ-reach-pro.test.ts` and `endings-bench.test.ts` all drive full careers and assert survival and
reach rates. They are green with the sponsor change in, which is the independent confirmation that
+0.35 pp of income does not move the family's economics.

**Mutation-verified, all three new nets** – the green run was not taken on trust:

| mutation | tests reddened |
|---|---|
| `seasonSpokenFor` returns null (nothing ever blocks) | 4 |
| `signOffer` writes `fromWeek = week` (the seam re-opens) | 2 |
| `windowLadder` reversed (weakest-first) | 9 |

`npm run check` was NOT run: a second agent is active, and the same CLAUDE.md note records a full
gate coming back with three RED files under contention, all of them timeouts and none of them real.

---

## 7. What this makes easier and harder for the legibility task

There is a separate open task about making sponsor and academy support **legible on screen** – the
owner cannot currently tell what covered what. No UI was built here. Three notes for whoever does:

**Easier.**
* `Offer.fromWeek` and `untilWeek` now bound a signed deal as a plain interval on the same boundary
  every contract shares. "Which weeks was she covered?" is a subtraction rather than a case analysis
  over `decidedWeek`, `seasons` and the calendar.
* Every contract in a career now starts and ends on week 49/50 of a season, so a coverage strip
  drawn per season has no ragged edges and no mid-season stubs.
* The single feed row is written at the window's close and can name several brands at once, so the
  season wrap has one honest sentence instead of a row per event.

**Harder – one thing, and it is a real rough edge.** A letter closed because the parent signed a
*different* brand is marked `refused`, and `OfferLetter.vue` renders that as **"Turned down."** It is
true in substance – he chose someone else – but it reads as though he opened the letter and declined
it, which he may not have. Distinguishing the two needs either a new `OfferState` or a flag on the
offer, and both are UI-shaped decisions that belong with the legibility task rather than here. It is
flagged rather than fixed.

---

## 8. Files

| file | what changed |
|---|---|
| `src/engine/offers.ts` | the window predicates, `contractEndWeek`, `windowLadder`, `seasonSpokenFor`, `dealStartsAt`, `dealEndingWithSeason`, `letDownThisWindow`; `raiseKitOffer` per-week/per-rung; `signOffer` writes `fromWeek` and closes the losers; `dealUntilWeek` and `endDealWithSeason` on the contract boundary |
| `src/engine/world/sponsors.ts` | `reviewSponsors` split across the window: verdict on the open week, a letter on each letter week, one feed row on the close week |
| `src/engine/world.ts` | the tick gates on `isSponsorWindowWeek`; `SAVE_SCHEMA_VERSION` 40 -> 41 |
| `src/shared/protocol.ts` | `Offer.fromWeek` |
| `src/engine/migrations.ts` | the v41 block |
| `src/engine/economy.ts` | `decideWeeks` re-documented – it sizes the window now |
| `tests/offers.test.ts` | `LETTER_WEEK` re-aimed to 47; a new `the sponsor window` block; two guards **reversed** with their reasons written out |
| `tests/economy.test.ts` | two guards re-aimed onto the new expiry week and the new feed-row week |
| `tools/sponsor-window-bench.ts` | new – coverage, gaps, mail and money as distributions |
| `tests/fixtures/saves/v41.json` | the golden fixture |

`isSponsorReviewWeek` is **unchanged and still exported**: a second caller, `settleMandatoryQuota`,
settles the tour's annual obligation on that exact week, and moving the sponsors was never a reason
to move the tour.

---

# 10. The window can be entered late (06.08, `fix/sponsor-catchup`)

**Branch** `fix/sponsor-catchup` · **schema unchanged at v41** · **06.08.2026**

## 10.1 The bug report is the owner's own career, again

He merged the wave, loaded a save and **got no sponsor letter at all** – the exact outcome §1–§5
existed to prevent. The save sits at week 412: **season week 48**, one week past the window's opening
week 47.

Everything about his standing was healthy. Migration clean (v41, `kit-309` snapped `untilWeek`
415 → 413, `fromWeek` back-filled), `seasonSpokenFor` NOBODY, the outgoing deal passing its verdict
(20 events against a minimum of 10, national rank 1 against a `keepDomesticRank` of 30),
`letDownThisWindow` false, `windowLadder` `['national', 'local']`.

`reviewSponsors` driven forward over that migrated save from two entry weeks:

```
loaded at week 411 (the window opens):  3 letters -> kit-end-kit-309, kit-411/national, kit-412/local
loaded at week 412 (where he sits):     1 letter  -> kit-412/local
```

**Two defects, and they are different.**

### Defect 1 – the opening week did work no other week could do

The verdict was guarded by `isSponsorWindowOpenWeek`: the outgoing deal judged, `eventsPlayed`
recorded, a failed deal ended, the goodbye posted – **on week 47 and no other week**. §4 shipped this
as a stated consequence for a migrated save. That was the wrong call, and not only because he hit it
on the first career he loaded: **any career inside the window when the app updates has the same
hole**. Tying "once a year she gets looked at" to one specific week makes it skippable.

### Defect 2 – the ladder was indexed by the calendar

`windowLadder(standing)[sponsorWindowSlot(week)]`. At 411 he is written to by `national`; at 412 – the
SAME standing, one week later – by `local`. The rung was picked by which week of the window it was,
so a career that arrives mid-window is **silently offered a worse brand and never told the stronger
one existed**. That is the precise inversion §3.2 reversed the arrival order to prevent: *"signing on
sight is never a mistake; waiting is optional"* is only true if the strongest rung she clears is the
one that writes first **from wherever she actually is**.

## 10.2 What ships

**The verdict is once a season, not once on week 47.** `dealUnderReview` is taken on whichever week of
the window the career first reaches, and re-reading it on the remaining weeks returns the same answer.
Three things make that true, and each is one line:

| | before | after |
|---|---|---|
| its **subject** | `activeKitDeal(offers, today)` | the deal that was **already running when the window opened** – `fromWeek < opened && untilWeek >= opened` |
| its **count** | `eventsPlayedInSeason(world, today)` | `eventsPlayedInSeason(world, sponsorWindowOpensAt(today))` |
| its **goodbye** | `offers.push(notice)`, unconditionally | idempotent on `kit-end-<id>`, like every other letter the module raises |

The subject clause is not tidiness, it is a trap that had to be closed: once the verdict runs on every
week of the window, *"the deal in force today"* stops meaning *"the deal that covered the season now
finishing"* – by week 49 it is the letter he signed on week 47. Judged on a season it never covered, a
brand-new two-season contract would fail its obligation and **be ended before it began**. Pinned.

The count clause is why the §4 trade does not have to be paid twice. A verdict taken on week 51 would
read a rolling year that has dropped weeks 47–48 of the season just played – two competitive weeks,
real tournaments – and could fail a girl for events she did enter. Anchored on the window's opening
week, the same year is read whichever week the verdict is taken on.

**The ladder is walked from the entry point.** `raiseKitOffers` (was `raiseKitOffer`) walks
`windowLadder` from the top on every week of the window and raises everything that has come due and
has not yet written. Two consequences and both are the point:

* a career present from the opening week is **unchanged, to the draw**. For it, slot and week are the
  same number, so the id is the same id and `shopWritesAt` reads the same key.
* a career that arrives on week 48, 49, 50 or 51 finds the letters it had already earned waiting for
  it, **in ladder order, in one post**.

**The dice are keyed on the rung's place in the queue**, `sponsorWindowOpensAt(week) + slot`, not on
the day the letter lands. That is what turns "the same letters, from the same rungs, in the same
order" from a hope into a property. A rung that misses stays missed for the whole window – the roll is
deterministic in (seed, window, slot), so re-reading it on a later week returns the same answer rather
than a second chance. **Nothing is manufactured**, which is §3.2's own promise and the reason the
catch-up cannot become a re-roll.

`isSponsorLetterWeek` is no longer the gate on raising, and is re-documented as what it now is: whose
TURN falls on this week. The closing week can deliver a turn that came due earlier, because a career
whose first week inside the window is its last would otherwise have the whole winter's post cancelled
by a rule written to guarantee it thinking time.

**No schema change.** Both halves are derived from what is already in `offers` – the same call
`letDownThisWindow` made in §3.4, and the right one again. A persisted "verdict taken" mark was
considered and is not needed: with the subject and the count anchored on the window's opening week and
the goodbye idempotent, taking the verdict twice is a no-op.

**One UI line moved.** `InboxSheet` ordered letters by "newest first", which for several letters
sharing one arrival week is push order reversed – i.e. **weakest rung at the top of the pile**. Within
a week it now orders by rung, strongest first, so a parent who signs the letter on top is never
signing the worst one on the table. Nothing else about the letters changed: a caught-up letter is an
ordinary kit letter with ordinary terms and reads as one, and its "N weeks to decide" line is computed
from the deadline exactly as before.

## 10.3 What was measured

`npm run bench:sponsor`, same tool, same 288 careers per arm, plus two new counters
(`probeTheWinter`) that replay every winter **from every week it could have been entered on** and
report whether the post that falls out of it depends on when the career met the window.

### 10.3.0 ⚠ The §5 baseline is gone, and it is not this branch that moved it

§5's numbers (37.3% → 50.1% coverage) were measured on a 520-strong FIELD. `main` now carries the
population wave (`FIELD.size` 520 → 1,600, PR #81), which moved sponsor coverage on its own. Today's
shipped baseline is **61.7% eager / 56.9% patient**, and the longest gap after her first deal is p50
**50** where §5 recorded 54. Everything below is against that, re-measured on the same commit.

### 10.3.1 The number that matters: 25.3% → 0%

| | BEFORE eager | AFTER eager | | BEFORE patient | AFTER patient |
|---|---|---|---|---|---|
| **winters replayed from every entry week** | 592 | 592 | | 584 | 584 |
| **...that came out DIFFERENT** | **150 (25.3%)** | **0 (0.0%)** | | **147 (25.2%)** | **0 (0.0%)** |
| **letters lost to arriving late** | **482** | **0** | | **468** | **0** |

**One winter in four was a different winter depending on which week the career met it**, and 482
letters across 288 careers were never written because the calendar had moved past their rung. Both
are now zero – and zero is a property rather than a measurement: every rung on her ladder gets
exactly one roll, keyed on its place in the queue, whichever week the career arrives on.

The second counter is the one that must NOT be zero, and it is the answer to "should a career past
the window get a catch-up":

| | BEFORE eager | AFTER eager | BEFORE patient | AFTER patient |
|---|---|---|---|---|
| winters open to her (a rung cleared, nobody promised, nobody let down) | 535 | 536 | 528 | 529 |
| ...in which no brand wrote | 79 (**14.8%**) | 78 (**14.6%**) | 81 (**15.3%**) | 80 (**15.1%**) |

That ~15% is `offerChance`. It is the design – «nothing is manufactured» – and it is exactly what a
catch-up on the far side of the window would be re-rolling. See §10.4.

### 10.3.2 Coverage, the gap, and the money

| | BEFORE eager | AFTER eager | | BEFORE patient | AFTER patient |
|---|---|---|---|---|---|
| career sponsor coverage | 61.7% | **62.2%** | | 56.9% | **57.6%** |
| longest gap – p50 / p90 / max | 52 / 158 / 210 | 52 / 158 / 210 | | 56 / 158 / 210 | 56 / 158 / 210 |
| longest gap after her first deal – p50 | 50 | 50 | | 53 | 53 |
| careers ever covered | 144 / 144 | 144 / 144 | | 144 / 144 | 144 / 144 |
| letters by rung: local / national / tour / global | 2.04 / 0.96 / 0.15 / 0.04 | 2.07 / 0.96 / 0.15 / 0.04 | | 2.69 / 1.04 / 0.14 / 0.04 | 2.72 / 1.04 / 0.14 / 0.04 |
| the competing half | 70.7%, 3.7 letters | 71.2%, 3.7 | | 66.3%, 4.7 | 66.9%, 4.7 |
| the quieter half | 50.1%, 2.6 letters | 50.7%, 2.6 | | 46.6%, 3.1 | 47.5%, 3.1 |
| **sponsor value per career** | $10,158 | **$10,178** | | $8,301 | **$8,329** |
| **...as a share of total income** | **2.6%** | **2.6%** | | **2.5%** | **2.5%** |
| ...kit / retainer / bonus / travel | 3,074 / 1,250 / 3,721 / 2,114 | 3,093 / 1,250 / 3,721 / 2,114 | | 2,852 / 1,208 / 2,179 / 2,062 | 2,879 / 1,208 / 2,179 / 2,062 |

**The money does not move: +0.2%, and the share of career income is unchanged to the decimal.** Three
of the four instruments – retainer, bonus, travel – are identical to the cent, which is the
cross-check that no rung's terms and no professional deal's life changed. The whole delta is $19–$27
of extra KIT cover, i.e. the +0.03 local letters a career: a rung whose roll missed at its own week
and whose standing had improved by the time the walk re-read it. Continuity is not a subsidy here
because nothing about a career that was never late is being paid more.

Coverage +0.5 pp / +0.7 pp, the gap distribution unmoved to the week, and the earned split holds –
the competing half gains and the quieter half gains less. This branch is a correctness fix, and the
bench's job was to prove it is *only* a correctness fix.

### 10.3.3 ⚠ The finding that cost the most: an anchored window is not an anchored count

The first build anchored `eventsPlayedInSeason` on the window's opening week and declared the verdict
idempotent. The bench disagreed – sponsor value fell 3.2% – and two careers out of 144 accounted for
all of it. Traced:

```
w255 (season wk 47)  played@open 14  kit-203/tour  min 14  seasons 2   -> holds
w256 (season wk 48)  played@open 13  kit-203/tour  min 14  seasons 2   -> ENDED, until 309 -> 257
```

Same anchor, different answer. **`world.results` is itself pruned on a rolling 52 weeks
(`RESULTS_WINDOW`), relative to `world.week` and not to the anchor** – so by week 48 the previous
season's week 47 has already aged out from under the anchored window. The career was ended for not
playing enough, in a season it had played enough of, and lost four seasons of retainer and bonus:
**$49,252 → $21,960**.

The same is true of the standing half: her domestic points are a rolling best-6 and decay across the
window for reasons that have nothing to do with the season being judged.

So the rule that ships is one sentence, applied to both halves:

> **A later week's verdict may confirm that she held up and may never declare that she did not.** The
> count it can see is a LOWER BOUND – short by at most the two competitive weeks 47-48 of the season
> before, since weeks 49-51 carry no events – and a lower bound is sound in exactly one direction.

A later week's verdict still does everything the owner's save was missing: it identifies the outgoing
deal, ends one whose TERM is up (arithmetic on `untilWeek`, not a judgement) and posts the brand's
goodbye. It simply cannot fail her on evidence that has begun to age out. The asymmetry that leaves –
a career reaching the window late is not failed that winter – is the safe direction, is confined to a
career the app updated under, and is pinned in both halves.

This is the second time in this file that a count read off a pruned ledger produced a wrong verdict
(§ `eventsPlayedInSeason`'s own note records the first, on `world.events` at its 400-row cap). Worth
stating as a pattern: **in this engine, "which window do I count over" and "which rows still exist"
are different questions, and the second one is the one that bites.**

### 10.3.4 The owner's save, before and after

Driven forward from every entry week over his own migrated career (week 412, season week 48):

```
BEFORE                                    AFTER
 411:  3 letters (goodbye, national, local)   411:  3 letters (goodbye, national, local)
 412:  1 letter  (local)                      412:  3 letters (goodbye, national, local)
 413:  0                                      413:  3 letters
 414:  0                                      414:  3 letters
 415:  0                                      415:  3 letters
```

Loading where he actually sits now yields exactly what loading at the window's opening week yields:
the brand's goodbye on `kit-309` (reason `term`, its 20 events recorded), the **national** letter he
was never sent, and the local one as the alternative below it. Both letters run to week 415, so the
decision is his for four weeks and never while she is playing.

---

## 10.4 What happens to a career PAST the window, and why it is nothing

The brief's own hypothesis was that a season whose window closed with no letter should get a catch-up
at the next tick, because a year of silence caused by an update is worse than one caused by the game.
**Measured, I disagree, and the disagreement is not a close call.**

1. **A career being PLAYED cannot pass a window it did not enter.** `world.week += 1` is the only
   writer of the week in the whole engine, and the window is five consecutive weeks. There is no path
   – not `advanceWeeks`, not the dev `▶▶ 52` button – that steps over it.
2. **A career LOADED past it has already had its winter.** The only way to be past week 51 with an
   untransacted window is a save written before the window existed, and that code's own review week
   (`isSponsorReviewWeek`, the off-season's first) is **inside** this window. Such a save was reviewed
   on week 49 by the code that wrote it, and its letter carries a `decideWeeks` deadline that is still
   open at week 52.
3. **And there is no honest test for it.** "The window closed and no letter was raised" cannot
   distinguish *she was not there* from *the shops said no*. Measured: **14.6% of winters open to a
   career end with no brand writing** – 78 of 536 on the eager arm. A catch-up on the far side of the
   window would fire on every one of them, re-rolling `offerChance` for careers the brands genuinely
   passed on. That is not a catch-up, it is the removal of the roll, and it breaks §3.2's own promise
   that nothing is manufactured.

What DOES need catching is a career that is *inside* the window when the code changes, and that is
now caught to the last week: the closing week raises the whole queue for a career that only reached
the window there. The one arm that differs is a career loaded past the close, and it differs because
it was never there – pinned as its own test, with the reasoning, rather than left as a silent hole.

## 10.5 Gates

| gate | result |
|---|---|
| `vue-tsc -b --force` | clean |
| `npm run test:quiet` | **green, 2,395 tests**, 116 s |
| `npm run test:component` | **8 files / 88 tests green** |
| `npm run test:sim` | **9 files green in 283 s, exit 0** – no birpc artefact at all once the machine was quiet, which is the first clean sim exit this wave has had |
| `npm run bench:sponsor` | §10.3 |

**Mutation-verified, nine mutations against the new nets** – the green run was not taken on trust:

| mutation | tests reddened |
|---|---|
| the ladder indexed by the calendar again (the shipped bug) | 3 |
| the verdict pinned to the window's opening week | 3 |
| `raiseKitEndLetter` pushes unconditionally | 3 |
| `eventsPlayedInSeason` read at today rather than at the window's open | 1 |
| `dealUnderReview` back to "the deal in force today" | 4 |
| no letter raised on the closing week | 3 |
| the STANDING half judged on every week of the window | 1 |
| the EVENTS half judged on every week of the window | 1 |
| `eventsPlayed` stamped from a later week's lower bound | 1 |

⚠ **A contention note, because it produced a false verdict here too.** A run of `test:sim` taken
while another agent's bench held the machine came back with three RED files – all three were
`[vitest-worker]: Timeout calling "onTaskUpdate"` with every test passing, the artefact CLAUDE.md
already documents. Worse, `vitest` printed its root as the OTHER agent's worktree: a leaked
`INIT_CWD` in the shell environment had pointed the run at `tb-school`. **Check the `RUN v… <root>`
line before believing a gate**, and re-run from a clean shell. Both were confirmed by re-running each
file alone from `tb-spon2`: exit 0, correct root, no artefact.

## 10.6 Files

| file | what changed |
|---|---|
| `src/engine/offers.ts` | `raiseKitOffer` → **`raiseKitOffers`**, walking the ladder from the top with the dice keyed on the rung's slot; `dealUnderReview` anchored on the window's opening week; `raiseKitEndLetter` idempotent on its id; `kitOfferId` and `isSponsorLetterWeek` re-documented |
| `src/engine/world/sponsors.ts` | the verdict off `isSponsorWindowOpenWeek` and onto "once a season"; `openWeekVerdict` gates the two clauses that can FAIL a deal and the `eventsPlayed` stamp; `sponsorStandingOf` extracted so the bench asks the engine's own question; the feed row reads the count off the goodbye letter |
| `src/components/InboxSheet.vue` | within one arrival week, the strongest rung at the top of the pile |
| `tests/offers.test.ts` | a new `the window can be entered late` block (8 tests); every `raiseKitOffer` call site re-aimed |
| `tools/sponsor-window-bench.ts` | `probeTheWinter` – every winter replayed from every entry week – and the two counters §10.3.1 reports |

**No schema change.** Both halves are derived from what is already in `offers`, which is the call
§3.4 made with `letDownThisWindow` and the right one again.

