# A finished season, told apart by table (schema v46)

**The report, twice.** Owner, 09.08 (round-15 item 11): «Season by season в stats в разных вкладках
всё ещё одно и то же показывает». And before that, in the round-14 list.

**The screen was never the defect, and that is the whole spec.** `SeasonHistoryEntry` carried

```
seasonIndex  endRank  points  wins  losses  fundsDeltaCents  endFundsCents  bestFinish?  spentCents?  earnedCents?
```

– where `endRank` is **the ITF rank** (the wrap-up writes `world.kidRank`) and `points` / `wins` /
`losses` are **folds over all three tables**. The three tabs showed one row because the record held
one row. The component's own footnote had said so since July: telling them apart "is a schema
decision rather than a copy fix".

## What v46 adds

```ts
byTrack?: Record<LadderTrack, { endRank?: number; points: number; wins: number; losses: number }>
```

It is **`Snapshot.seasonRecord`'s shape widened**, deliberately, rather than a second convention: the
live season's W-L is already `Record<LadderTrack, { wins, losses }>`, and the wrap-up copies that very
record into the history row. A finished season and the season in progress are therefore read with the
same keys, and the two cannot drift.

Banked at the wrap-up, and it has to be, for `spentCents`' reason at a different ledger: the points
come off `world.results` (pruned to a rolling 52 weeks) and the W-L off `world.seasonRecord` (which the
wrap resets nine lines later). At the wrap the whole season is still inside both; a week later it is
not.

`endRank` is **optional inside the row too**. Absent means she held no counting result in that table,
which is not a place – `rankIn` would have returned the tie floor every pointless player shares, the
number `LadderView.rank`'s null exists to refuse. The v46 golden save carries the case: a professional
row with **6 points and no rank**, because `rankableTotal` withholds a W ranking until the tour's
minimum activity is met.

## What an old row shows, and why it is not more

**Nothing is back-filled.** A career saved before v46 has one number per figure per season and the
other two are unrecoverable – not expensively, not approximately, but gone:

| where the evidence would have been | what is left of it |
|---|---|
| `world.results` | pruned at 52 weeks (`pruneResults`) – season 1 was gone before season 3 opened |
| `world.events` | capped at 400 rows, oldest first |
| `bestFinishByTier` | a career high-water mark with no year on it |
| `milestones` (`season-rank`) | the season's rank – and it is the ITF one again |

This is the same 49-week hole `seasonStartRank` (v17) and the season mirror (v45) exist because of,
and it gets the same answer. So the migration is a **bump**, v44's shape for v44's reason, and the
screen is told what an old row may say:

| tab | rank | points / W-L |
|---|---|---|
| International | its stored `endRank` – that number always **was** the ITF rank | the fold, marked `*` |
| National | **nothing** | the fold, marked `*` |
| Professional | **nothing** | the fold, marked `*` |

**A blank means "not recorded"; a zero means "she scored nothing".** They are different claims and
this project has been bitten by the difference before – v45's own note: «0 could not move her ranking»
is the good news, printed over a season nobody counted. So `byTrack` is left **absent** on an old row
rather than written as three zeroed rows: absent is a shape the reader can recognise, three zeros are
a lie it cannot.

**The rank is refused outside International for a harder reason than tidiness.** Printing a junior
#128 under a heading reading "Professional rank" is the class of claim that produced «Rank #4» on Home
against «#128» in Stats (30.07) and «Final national rank #3» over thirteen domestic events (05.08).
One card, two tables, and the reader is right and the card is wrong.

**The fold is kept rather than deleted**, marked with a star and a footnote. A 44-19 season is not
nothing, and this table is the only place it survives.

## Consequences for a live career

- Seasons wrapped from this build on differ per tab, exactly as reported.
- A career loaded from v45 or earlier keeps its old rows as above; its **next** wrap-up writes the
  first split row. The owner's own save is mid-season, so it is one wrap away.
- Save size: a row goes from ~174 to ~340 characters, against a 30-season cap. `tests/round10-view.test.ts`
  holds the whole row under 400 and the pre-v46 part under its original 160.

## Alongside it: the ages (same wave)

Owner, 06.08 item 12 and again 09.08: «я просил возраста девочек добавить в stats доп колонкой и в
турнирах перед матчем тоже можно показывать». Two surfaces – a column in the Stats standings
(`StandingRow.ageYears`) and both girls' ages on the tournament splash and pre-match card
(`PendingView.opponent.ageYears`).

**The age printed is HER OWN, never the band.** `AiPlayer.ageYears` was checked before it was printed:
it is drawn once per girl at intake and advanced by one at each season boundary – `COHORT.ageBand`
[13, 19] is the RANGE the draw comes from, and no cohort row carries a band. It is the same number
`rivalMatchPlayer` feeds the serve-speed curve, so the girl on the table serves like the girl in the
box score. The kid's is `kidAgeAt`, off her birth date, per the one-clock ruling of 09.08.

**The two clocks tick differently and both are honest**: hers on her birthday, a rival's at the season
boundary, because a cohort girl has no birth date to be exact about (`engine/world/age.ts` says so in
as many words). Whole years on both sides, so the column compares like with like.

**The opponent's age on the tournament card comes off the FROZEN match player**, not off today's
cohort row – the ruling `MatchPlayer.age` already carries. A card re-opened three seasons later reports
the girl who played, not the girl she has since become.
