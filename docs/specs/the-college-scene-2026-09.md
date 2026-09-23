---
type: spec
status: current
area: college-scene
canonical: true
last-reviewed: 2026-09-23
---

# The college scene – the championship gets eyes, the history gets the record (college/scene)

His ask, 23.09, verbatim: «я в интернете видел видео типа "10 любителей против #1 из лиги
колледжа", будем ли мы строить как в прологе отдельную сетку на колледж и отдельно как-то там
регистрировать в нашей истории все успехи и проходы оттуда?» – and, the same message, the ruling
that closes the parting's §12: «Предложение в одну строку: концовка-колледж даёт полку не ниже
"середины" - ок». One wave answers both: the championship that already plays gets a visible
bracket, the successes get registered in the album and the dynasty, and the graduate's door reads
no lower than the middle.

## Current truth

Written before the wave landed – NOTHING of it is built. What ships today (re-read in source,
23.09): the College League plays one championship per college year (`COLLEGE_LEAGUE`, draw of 8,
season week 12, field standard 56/spread wide, zero money and zero ranking points BY DESIGN – a
paying student fixture would make college a ranking route and unmake the fork); the run is banked
per year (`CollegeLeagueRun {week, roundsWon, rounds}`, v56) and its three matches are REAL
`WorldMatch` rows kept for ever in `world.events` under `college-w<week>-r<round>`
(`collegeLeagueMatchesOf`); the year card prints ONE line about it (`leagueFact` – «Won it» or the
exit label); the album's only college reading is the closing `'left-the-tour'` latch; the dynasty
handover carries `titles / proTitles / bestRank / slams` and nothing about the student game; and
`dynastyBackgroundOf` reads her account alone, so a graduate's door reads `working`. The builder
updates this section as tasks ship and fills §6's measured column.

## 1. One sentence of design

Nothing new is simulated and no prize is added: the wave gives the championship that already
happens a face (the bracket), a memory (the album and the handover), and the graduate her honest
shelf – reusing the kept match rows, the fixed album machinery and the dynasty door as they stand.

## 2. The floor – the graduate's shelf (his «ок», closing the parting's §12)

`dynastyHandoverOf` maps the new family's background off her own account
(`dynastyBackgroundOf(kidFundsCents)`: wealthy from $120k, middle from $25k, working below). ONE
clause on top: **a career whose standing ending is the college one reads no lower than `middle`**
– a degree and a profession are a middle start whatever the account says. The floor, never a
ceiling: a college career that somehow retires wealthy stays wealthy. A college CHAPTER inside a
pro career changes nothing – the clause reads the ENDING, not the biography, and a career that
left college for the tour is priced by the tour career it became.

⚠ This CLOSES the «middle band is structurally empty» finding for the college route (the dynasty
spec §8 row 3): the builder appends the dated note there, predicted and measured. Zero schema,
zero draws, one clause and its tests.

## 3. The bracket – the championship's own block on the year card

The year card's one `leagueFact` line grows into the championship's own block: three rows –
Quarterfinal / Semifinal / Final (`stageLabel` already answers a draw of 8) – each with the
opponent's name and the score, read from the kept match rows of the run's week. A run that ended
early shows the rounds she played and the round she left; the `null` run (a migrated or cut-short
year) keeps today's absence.

⚠ READ-ONLY AND DERIVED: the rows already cross to the UI as kept events; the block adds NO state,
NO draw and NO replay – watching a match stays the feed's business, and a «replay from the
bracket» button is his to ask for later, not this wave's to invent. ⚠ The block obeys the phone
law (a mounted 375x667 assertion, mutated before believed).

## 4. The record – the album and the dynasty

1. **The album book**: the college chapter gains the championship's line per year that held one –
   a title year says so, an exit year says how far she went (DRAFT wording, one line per shape,
   his pass). The fixed seven-slot ending album is NOT touched (its redesign is his reserved
   backlog item); this is the BOOK's college pages.
2. **The handover** (schema v89, the wave's one move): `motherCareer` gains
   `collegeTitles: number` – the count of her banked years with `wonTheLeague` – carried through
   `DynastyRecord` like every sibling field. Back-fill 0 for saves that predate it; append-only
   migration, golden fixture v89.json, e2e fixtures regenerated – the full four-part move.
3. **The booth**: a lineage line for a college-champion mother, licensed off
   `collegeTitles > 0` – the KNOWN-claim register, never the pro-cabinet one (a student title is
   not a WTA title; `proTitles`' own lesson applied before it bites). One or two lines, DRAFT.

⚠ Task 4 is the wave's only schema move and it is cleanly strikeable at dispatch: without it the
wave still ships the floor, the bracket and the album lines, schema-free.

## 5. What the wave refuses

No prize money and no ranking points for the league – the fork stays a real choice. No new
tournament, no new field model, no replay button, no scaling of the field with the programme tier
(the standing ruling: the tier buys development, development wins matches). No re-wording of any
shipped line: the year card's existing sentences stand and the new block sits beside them.

## 6. Predictions and measurements

The builder runs the arms AFTER the code tasks, machine quiet, exit codes from files, and writes
every measured number HERE – deviations flagged, never smoothed.

| # | claim | predicted | measured |
| --- | --- | --- | --- |
| 1 | the floor: posed college endings read `middle` or better, posed pro endings unmoved | 100% / 0 moved – a deviation is a defect | |
| 2 | share of college YEARS that win the League (walked corpus, the fork answered `college`) | coarse 15–35%: field standard 56 under her year-2+ skill, three wins at draw 8 (confidence low, the measurement is the point) | |
| 3 | share of college CAREERS with at least one title over their years | above row 2, coarse 40–70% | |
| 4 | `collegeTitles` on the handover equals the banked `wonTheLeague` count on every walked ending | equality, every career – a disagreement is a defect | |
| 5 | the frozen MAIN capture | untouched (41550 / `e6b0c709`) – the wave adds zero draws | |

## 7. The strings

Every player-facing string is a DRAFT for his pass (invariant 4): the album's college lines, the
booth's college-lineage line(s), and any label the bracket block needs beyond the `stageLabel`
words it reuses. The wave's strings table (`docs/plans/college-scene-strings-2026-09.md`) owns
the list and the count, pinned both ways – the wave-12 roundtrip is the model; this prose states
no total.
