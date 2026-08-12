---
type: spec
status: current
area: rounds/17
canonical: false
last-reviewed: 2026-08-12
---

# Round 17, the match screen – items 10, 24, 9, 8, 25, and the price of 22

`docs/specs/round17-triage.md` §3, as one slice, because #10, #24, #9 and #8 all touch the same
component and the same header. #25 is the commentary half. #22 is **priced, not built** – §6.

---

## 1. #10 – the match no longer ejects her, and an in-match injury says so where she is

The owner's ruling, in full:

> «Если травма случилась внутри матча надо сразу попап показать и не выбрасывать из матча. Вообще
> мне кажется надо по завершению матча не автоматически выкидывать на результаты, а заменить панель
> скорости и shout на одну кнопку Proceed или вроде того.»

**The two halves were ONE mechanism, and that is the finding.** `MatchViewer` emitted `finish` the
instant playback reached its last beat; both flows that listen change phase in the same flush, so
the component unmounted before it could paint a single frame of its own box score. That is the
eject – and it is also why the popup had nowhere to go: there was no screen left to raise it on.

### 1.1 What shipped

| # | Change | Where |
|---|---|---|
| 1 | `proceedLabel: string \| null` prop. Non-null ⇒ the button, and `finish` waits for the press | `MatchViewer.vue` |
| 2 | the finished control bar is that one button – no speed plate, no resolution plate, no shout | `.mv-controls-done` |
| 3 | the viewer's own box score now PAINTS, which is where round 16's "she retired hurt" lives | unchanged markup, newly reachable – superseded 12.08, see below |
| 4 | a dismissible popup when SHE is the one who stopped, over the match rather than instead of it | `.mv-hurt` |
| 5 | `"To the result"` at TournamentFlow and PracticeFlow; the other two callers pass nothing | both flows |

**⚠ #3 SUPERSEDED 12.08 – THE PANEL UNDER THE FINISHED BAR IS DELETED, by the owner's second ruling
on it: «просто вот эта нижняя "борода" под кнопками на экране матча не нужна всё».** The first pass
kept the card because it held the only sentence explaining an OPPONENT's retirement (`.mv-hurt` is
hers-only) and `WorldMatch` carries no `retired` field for a flow's result card to inherit. That
objection is closed without a protocol change: the commentary's own final beat carries the story –
lead *"Retired."*, *"X cannot go on. Y advances. A long match on tired legs."* – at the top of the
log the moment the match ends, on the same screen the ruling is about. The witness moved, it did not
die: its visibility at end-of-match is pinned by `tests/component/injury-surfacing.test.ts` (a real
engine retirement, driven through `seed:ret`) and `tests/component/match-viewer.test.ts`, both
mutation-verified (hiding the final beat from the log turns five pins red). The finished bar itself
is exactly the earlier ruling – `Watch again ↻ | Proceed`, same place, nothing grown around it – and
the stats the panel duplicated stay one press away on the flow's own result card.

**⚠ `null` IS A REAL ANSWER.** MatchReplay and SeasonScreen's sandbox have nowhere to proceed *to* –
one is opened on top of a finished match, the other ends on its own box score – so a Proceed there
would be a control that does nothing. They keep the old behaviour byte for byte: `finish` fires at
the end of playback and they ignore it. `"Watch again ↻"` gained `&& !props.proceedLabel` for the
same reason: the unmount-in-the-same-flush that used to hide it is gone, so without that condition it
would now sit beside Proceed – the exact duplication its own comment forbids.

### 1.2 ⚠ The popup says only what the model knows, and it is not the App's

`retireHazard` is `RETIRE_K * spentness(pointNumber, stamina)` and `spentness` is **exactly zero**
up to `FATIGUE_START` (120 points), so every retirement this engine can produce happened deep into a
long match to a girl who was not fresh. *"A long match on tired legs."* is true by construction, and
it is the same sentence round 16 put in the commentary beat – two surfaces saying one fact say it the
same way.

**The layoff is NOT in it, because the layoff does not exist yet.** A tournament retirement opens its
injury in `finalizeTournament`, which runs from `closeTournament` – long after this screen. The
weeks out, the withdrawn entries and the refunds are `InjuryStopDialog`'s report and it still
arrives; this popup is the *moment*, and the moment is all it claims. Two popups for one injury is a
real cost and it is the owner's own ask (#10 overrules `match-retirement.md` §6 the same way #18
did in round 16).

Only when the retiree is **hers**: `kidSide` is null in a match she is not in, and the opponent
stopping is not an injury to this family. Raised on a **skip** too, which is round 16 #19's rule
restated – the report is a consequence of what happened, not of a screen having been watched.

---

## 2. #24 – the elapsed match time

New module: **`src/viz/matchClock.ts`**. Pure, RNG-free, no engine change.

### 2.1 ⚠ The clock is diegetic, and both of the owner's conditions fall out of one decision

The reading is a function of the **playback position**, not of elapsed real time. The viewer's clock
already advances at `speed x` timeline seconds per real second, so a reading taken off it advances at
`x1 / x2 / x4` without this file, or the module, ever reading the speed pills. Nothing scales
anything by hand – which is also what stops the clock and the playback becoming two implementations
of one rate.

### 2.2 Where the minutes come from – four terms, three of them the rulebook's

| term | value | source |
|---|---|---|
| ball in play, per strike | 1.4 s | ours, calibrated: at the engine's measured 5.7 shots/point that is a **mean rally of 8.0 s**, the published women's figure |
| between points | 23 s | ITF allows 25; the tour plays ~20-23 with the shot clock |
| changeover | 90 s | the rule's own number, applied on the games the ends actually change on |
| set break | 120 s | the rule's own number |

⚠ **A tie-break's six-point end changes are not rest periods** under the rules and are not counted:
the test is `gameEnd`, and the only game a tie-break ends is its last point.

### 2.3 Measured (`tools/match-clock-probe.ts`, 400 seeded matches, three surfaces)

| matches | shortest | p10 | **median** | p90 | longest |
|---|---|---|---|---|---|
| two sets (202) | 0:46 | 1:03 | **1:19** | 1:38 | 1:58 |
| three sets (198) | 1:21 | 1:36 | **1:58** | 2:24 | 2:45 |

That is the shape of real women's tennis. The sweep that picked the one free dial:

| between points | median 2-set | median 3-set |
|---|---|---|
| 20 s | 1:13 | 1:49 |
| **23 s** | **1:19** | **1:58** |

**Predicted vs measured (invariant 4).** Predicted before the run: a two-setter in the 70-90 minute
band, a three-setter around two hours. Measured: 1:19 and 1:58. No re-tune was needed.

### 2.4 ⚠ It replaced `POINT_SECONDS = 42`, and that constant was wrong in a direction nobody had checked

`MatchStats.durationEstimate` was `formatDuration(totalPoints * 42)`. Over the same 400 matches that
reads **1:31 for the median two-setter** – a straight-sets match as long as most three-setters –
because a constant per point cannot know that a set break is two minutes and a point is
twenty-three. The box score now calls `matchDurationSeconds`, so the live clock over the court and
the duration in the box score are ONE number by construction (the rule the serve speed already lives
by). `tests/match/matchStats.test.ts`'s duration pin was re-aimed with a ⚠ note.

### 2.5 ⚠ The track is built per TIMELINE, which is what makes 'key' honest

'key' drops points the players nonetheless played: the same match is 580 playback seconds in 'full'
and 184 in 'key' while being the same hour and twenty of tennis either way. Anchoring each **shown**
point's first beat to that point's true match-time start means the reading crosses the skipped block
while the shown point is on screen, and still arrives at the true final duration. A per-playback
clock would report a key watch as a three-minute match.

⚠ **Found by mutation.** The first version of the mounted test reached the end through *Skip to the
result* – and skip's timeline is one beat long in every mode, so it passed against a clock reading
the raw playback position. It plays the match out frame by frame now.

Where: the top run-off band, between the Live badge and the weather, as the owner asked. Two `auto`
margins in a `justify-content: flex-end` row split the free space evenly, so the badge holds the left
end, the weather the right, and the clock lands in the gap. It survives the end of the match: with
the badge gone, the reading is how long the thing he just watched actually took.

Format is always `h:mm:ss`, floored. Fixed width because the band is a row of furniture and a form
that dropped the hour under sixty minutes would shift everything beside it; floored because a clock
that reads 1:00 before a minute has passed is wrong in the one direction people notice.

---

## 3. #9 – the header, and #8 – the side margins

The owner wrote the target line out himself:

```
was:   Regional Championship
       Sep 1-7, 2035        Quarterfinal
       To result

is:    Regional   W36 '35   Quarterfinal   To result
```

Three decisions in it, and the first is what makes the other two possible:

1. **the tournament's generic noun comes off, IN THIS HEADER ONLY** – «слово Championship можно
   убрать из хедера». `shortTierLabel` (`shared/format.ts`), applied only while `replayOpen`.
2. **the date is `W36 '35`** – «такой формат W36 '35 вполне хорошо, даже лучше, чем с запятой».
   That is `weekLabel(week)`, which already produces exactly that string and already ships on Home
   and in the practice header. Nothing re-spells it.
3. **the round stays spelled out.**

### 3.1 ⚠ MEASURED FIRST, in real Chromium at 375x667 with the app's own faces

`tools/header-probe.mjs` serves the worktree, loads `tools/header-probe.html` against the real
`src/style.css` and the real self-hosted Sora/Manrope, and measures. Re-run it with
`node tools/header-probe.mjs`.

```
header BEFORE (title + sub line, 24px gutter): 74.39px
header AFTER  (one line, 16px gutter)        : 48.64px
DELTA                                        : 25.75px
room for the headline at a 16px gutter       : 283.8px
```

**`Quarterfinal` was the item's own ⚠, and the measurement is what let it stay whole.**

| piece | width @375pt |
|---|---|
| `Regional Championship` – the longest label *before* the noun comes off | 188.5px |
| `Junior Tour 300` – the longest label *after* | 122.8px |
| `W36 '35` (11.5px) | 44.2px |
| `Quarterfinal` (11.5px) | 68.0px |
| `Round of 128` (11.5px) – the longest round | 71.6px |

* with the full tournament name and full round names: **320.3px vs 283.8px of room → wraps**, which
  hands back the whole row the item was buying. This is the state the ⚠ predicted.
* with the noun dropped and the round still spelled out: **254.6px → fits, 29.2px to spare.**

**So nothing is abbreviated.** Dropping one word from the title bought more room than shortening the
round to `QF` would have (`Regional Championship` + `W36 '35` + `QF` was still 275.1px, 8.7px inside
the budget – i.e. it fitted, but only just, and it cost the reader a word). An earlier pass of this
slice did shorten the round and moved `BracketTabs`' private `shortStage` into
`engine/world/labels.ts` to share the vocabulary; that move is reverted, because a helper with one
caller belongs to its caller.

⚠ **`shortTierLabel` is an explicit list of three, not "drop the last word".** Three labels in the
whole ladder are *adjective + generic noun* – Local Open, Regional Championship, National Series –
and those are exactly the three whose first word already names the rung. Every other label ends in
something load-bearing: `Junior Tour 30` and `World Tour 100` end in the NUMBER that is the rung, and
`Grand Slam` would become "Grand". `tests/format.test.ts` walks the real `TIER_LADDER` and requires
every shortened label to be a PREFIX of the full one, so a new rung cannot quietly become a word.

⚠ **The full name is untouched everywhere else**, and he said so explicitly. The brief's hero, the
pre-match card, the box score, the poster, the letters and the season feed all still read "Regional
Championship". The match header is the one line short of room, and the one place the noun carries
nothing – the reader is already inside the tournament.

### 3.2 The sub line is not drawn at all while a match is on screen

The surface mark was already standing down there (the court is painted in it 20px lower), so with the
date and round gone the row had nothing left to carry. Every other phase – the brief, the pre-match
card, the box score, the poster – keeps the whole sub line.

Mechanism: a `headlineMeta?: readonly string[] | null` prop on `TakeoverShell`. Not a second sub
line – the absence of one. The meta never wraps and never shrinks; the **title** ellipsises, the same
ranking `.tf-top > button` already states.

### 3.3 #8 – the gutter, and what it costs

`.tf-body` and `.tf-top` take `--app-pad-x` (16px) instead of a hard 24. `.onboarding-body` keeps its
24: it is a reading surface with no canvas in it and its own handoff spec asks for a wider gutter.

| at 375pt | before | after |
|---|---|---|
| content column / canvas | 327px | **343px** |
| painted court | 274.9px | **288.3px** |
| canvas height (aspect 680/420) | 202.0px | 211.9px |

⚠ **The court is a fixed-ratio canvas, so a wider column is a TALLER one.** #8 gives 9.88px of height
back to the canvas, so the net vertical gain for the commentary log is **25.75 − 9.88 = 15.87px**,
not 25.75. Both halves are real and they are what the owner asked for in each item – the court grows,
and the log still ends up ahead.

---

## 4. #25 – the weather note that opens the commentary

> "It's chilly here today", "it's hot, everybody is sweating"

**It went into `viz/preview.ts`, not `viz/commentary.ts`, and that is a determinism decision rather
than a filing one.** `buildCommentary` is a pure function of the MATCH, pinned as such
(`tests/viz/commentary.test.ts:43` traps `Math.random` behaviourally, `:58` pins that the module
imports no RNG at all – both untouched and still green). The day's temperature is a fact about the
DRAW, which the match does not carry: a weather line inside `buildCommentary` would need an input
that pin exists to keep out. The preview already is the opening of the log – the log reads
newest-first, so the intro is its last block – and already takes `temperatureC`.

New `conditions` entry, **storey 1**, so the local Sunday-morning draw gets it too. Five bands over
the range `eventTemperature` can actually produce (hard 12-26, clay 16-28, grass 19-29):

| °C | line |
|---|---|
| ≤14 | *Cold enough that the ball will not fly, and cold hands on the racket all afternoon.* |
| 15-18 | *Cool, and it will take a while for either of them to feel the ball.* |
| 19-24 | *A comfortable day for it, and no excuses in the air.* |
| 25-27 | *Warm work out there, and the towel comes out between points.* |
| ≥28 | *Hot, and everybody is sweating before the end of the first game.* |

Vocabulary is `commentary-lexicon.md` §5.5's own – *the ball is not flying*, *numb hands*, the heat's
sweating. **None of them repeats the figure**: the occasion line one row up already prints "Clay, 21
degrees", and a generator that says the number and then says it again is reading its own slot back at
the reader (the rule `SURFACE_NOTE` is written under). `null` temperature says nothing at all rather
than inventing a day.

Monotonicity is unaffected: a line every storey has cannot break a rule about storeys having *more*
than the one below.

---

## 5. Verification

`npm run check` green – exit code read from the command itself, never through a pipe.
`unit: green in 161s (2628 tests)`, component 270/270, `vite build` ✓.

* `tests/viz/matchClock.test.ts` – 10 tests, new
* `tests/viz/preview.test.ts` – 22 tests (was 17), the conditions note
* `tests/component/match-viewer.test.ts` – 43 tests (was 31)
* `tests/screen-i-live-match.test.ts` – 52 tests, four re-aimed with ⚠ notes
* `tests/format.test.ts` – 10 tests (was 6), `shortTierLabel`
* `tests/match/matchStats.test.ts` – the duration pin re-aimed with a ⚠ note

**Mutation-verified, seven mutations, every one caught by the test that claims to cover it:**

| # | mutation | caught by |
|---|---|---|
| 1 | `finish` emitted at the end of playback regardless of `proceedLabel` | "does NOT emit finish when playback ends" (+3 more) |
| 2 | any retirement raises the popup, not only hers | "the OPPONENT stopping … raises nothing" |
| 3 | the clock reads the raw playback position | "lands on the match's own duration" |
| 4 | the clock reads a flat multiple of playback seconds | "…" + "keeps counting the points the KEY cut does not show" |
| 5 | one conditions sentence for every temperature | "says something DIFFERENT about a cold day and a hot one" (+2) |
| 6 | the header's meta binding changed | "the round rides the tournament's own line" |
| 7 | the full tournament name back in the match header | "the round rides the tournament's own line" |

⚠ `tests/season-mirror.test.ts` went red once during a full `npm run check` – a 20 s **timeout with
zero assertion failures**, in a file this branch does not touch, while another agent was working. It
passes on its own. That is contention, the hazard CLAUDE.md documents, not a regression.

---

## 6. #22 – rivals in the commentary. ⚠ PRICED, NOT BUILT

> "They have met before, at …, and it finished …"

Round 16 left this undone and said why (`round16-commentary.md` §3.1): `SeasonResult` is
`{playerId, week, points, tier?}` with **no opponent field at all**, and match rows live in
`TournamentResult.matches`, which the world does not retain past the event. Both halves are still
true. **What round 16 did not check is whether anything ELSE in the world already keeps it – and
something does.**

### 6.1 The finding: her matches ARE persisted, with the opponent, the result and the scoreline

`WorldEvent.match` is a `WorldMatch`, which **extends `MatchRecord`**:

```
WorldMatch = { round, aId, bId, winnerId, seed?, score?, retiredId?,   // MatchRecord
               eventId, surface, oppName, a, b }
```

Every competitive match she plays writes one of these into `world.events`, which is persisted with
the save. And `pruneEvents` gives those rows a **protected class of their own**: ordinary news is
sacrificed first, down to `EVENTS_ORDINARY_FLOOR` (120), before a single match row is touched. So
the world holds roughly her **last 265 competitive matches**, with opponent id, winner id, event id,
surface and the scoreline – about four professional seasons.

A head-to-head is therefore **not** a save-schema question in the world. It is a **projection**
question at the snapshot boundary.

### 6.2 What actually blocks it: the Snapshot's 60-event window

`toSnapshot` carries `world.events.slice(-SNAPSHOT_EVENTS)`, and `SNAPSHOT_EVENTS = 60`. The UI only
ever sees a `Snapshot` (invariant 1), so the preview can see roughly the last two or three months of
feed – a handful of her matches, positionally chosen. Reading a head-to-head off *that* would forget a
meeting from two months ago while remembering one from three weeks, which reads as broken rather than
as quiet.

### 6.3 Three tiers, with prices

| tier | what it can say | what it costs | schema? |
|---|---|---|---|
| **0** – read the snapshot's 60 events in the UI | "they met three weeks ago" and nothing older | ~15 lines, all in `viz/preview.ts` | none |
| **1** – derive it at snapshot time from the full feed ✅ **recommended** | "They have met before, at the Junior Tour 60 in W12 '34, and Olivia won it 6-4 3-6 7-5" – across ~4 seasons | one derivation in `world/snapshot.ts` (~20 lines), one field on `PendingView`, one prop through TournamentFlow → MatchViewer → `preview.ts`, one ladder entry, tests | **none** |
| **2** – a persisted per-opponent ledger | "they have played six times; she leads 4-2", for ever | tier 1 **plus** the three-part move: `SAVE_SCHEMA_VERSION` bump, an append-only migration in `engine/migrations.ts`, a golden fixture in `tests/fixtures/saves/` (invariant 3), plus an engine write path | **yes** |

**Tier 1 is the answer, and it is much cheaper than round 16 assumed.** Nothing new is persisted: it
is a projection of state the world already keeps, computed on the side of the boundary that can see
it. Invariant 3 is not triggered, because invariant 3 is about what the save *holds* – and this adds
nothing to the save.

Everything the sentence needs is already on the row: `oppName` and the ids identify the opponent,
`winnerId` says who won, `score` is the scoreline (present on kid matches – AI-vs-AI rows resolve
through the closed form and never carry one, which does not matter here because every row in this
window has her in it), `eventId` names the tournament and `week` dates it.

### 6.4 ⚠ The honesty rule the line has to be written under

**It may only ever speak in the POSITIVE.** The window forgets – at tier 1 after ~265 matches, at
tier 0 after a couple of months – so the generator can prove *"they have met"* and can never prove
*"they have never met"*. So: a line when there is a meeting on the record, silence otherwise, and
**no "first time these two have played"** in any tier below 2. That is the same rule the whole
commentary lives by (`commentary.ts`: a beat may assert nothing the log does not carry) and it is
also why tier 0 looks worse than silence: its false negatives are frequent enough to be noticed.

### 6.5 What to tell the owner

He may believe this is a small ask; round 16 told him it was expensive. **Both were half right.**
"They have met before, and here is how it finished" is a **half-day of plumbing with no schema
change** and should be built. "She leads the head-to-head 4-2, across her whole career" is the
schema change, and it buys one extra sentence over what tier 1 already says for four seasons – which
is longer than any career this game has yet produced.

**Nothing in this slice implements any of it.** The recommendation is tier 1, and it is the owner's
call.
