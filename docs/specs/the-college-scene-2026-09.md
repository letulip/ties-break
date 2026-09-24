---
type: spec
status: current
area: college-scene
canonical: true
last-reviewed: 2026-09-24
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

⚠⚠ THE SENTENCE THAT STOOD HERE SAID «NOTHING OF IT IS BUILT», AND FOR §3 THAT WAS FALSE BY A
MONTH. It was written from a reading rather than from a measurement, and ruling B
(`docs/plans/college-scene-rulings-2026-09.md`) measured it on the branch head before a line was
dispatched: **the championship's own block on the year card SHIPPED in `1356712f`, 22.08** («Wave 3
/ G1: a college year gets a tournament, and the call-up is earned»). The correction is recorded
rather than smoothed, because a spec that asks for what exists is how a wave rebuilds a shipped
surface – and this one nearly asked a builder to remove a control the owner has been pressing since
August. Corrected in the same wave, 24.09.

What ships today (re-read in source, 24.09): the College League plays one championship per college
year (`COLLEGE_LEAGUE`, draw of 8, season week 12, field standard 56/spread wide, zero money and
zero ranking points BY DESIGN – a paying student fixture would make college a ranking route and
unmake the fork); the run is banked per year (`CollegeLeagueRun {week, roundsWon, rounds}`, v56) and
its three matches are REAL `WorldMatch` rows kept for ever in `world.events` under
`college-w<week>-r<round>` (`collegeLeagueMatchesOf`); the year card prints the fact
(`leagueFact` – «Won it» or the exit label) **AND the championship's whole block beside it**
(`.college-league` in `CollegeYearCard.vue`: the head, the occasion art, `leagueNote`,
`leagueStakeLine`, and ONE ROW PER PLAYED MATCH – `leagueLabel(m)` is `stageLabel(round, 2 **
rounds)` plus the opponent's short name, `rubberOutcome(m)` is the score with `ret.` notation, and
each row is a **Watch** control wired to `MatchReplay`); the data path is settled and needs no new
field, `collegeProgressOf` (`world/college.ts`) crossing `league: lastLeagueRun(college)` and
`leagueMatches: collegeLeagueMatchesOf(world, run.week)` on `CollegeProgressView`; the album's only
college reading is the closing `'left-the-tour'` latch; the dynasty handover carries
`titles / proTitles / bestRank / slams` and nothing about the student game; and
`dynastyBackgroundOf` reads her account alone, so a graduate's door reads `working`. The builder
updates this section as tasks ship and fills §6's measured column.

## 1. One sentence of design

Nothing new is simulated and no prize is added: the wave gives the championship that already happens
a face that is MEASURED (the bracket shipped on 22.08 – §3 – and this wave holds it to the phone
law), a memory (the album and the handover), and the graduate her honest shelf – reusing the kept
match rows, the fixed album machinery and the dynasty door as they stand.

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

## 3. The bracket – SHIPPED 22.08; what this wave added is the measurement

⚠⚠ THE ASK THAT STOOD HERE WAS ALREADY ANSWERED, AND IT IS CORRECTED RATHER THAN SOFTENED (ruling B,
24.09). This section asked for «the year card's one `leagueFact` line grows into the championship's
own block: three rows – Quarterfinal / Semifinal / Final … each with the opponent's name and the
score, read from the kept match rows of the run's week», for «a run that ended early shows the rounds
she played» and for «the `null` run keeps today's absence». **All four are true in `main` and have
been since `1356712f`, 22.08** – `.college-league` in `CollegeYearCard.vue`, `v-for="m in
leagueMatches"`, `leagueLabel` composed from `stageLabel(match.round, 2 ** rounds)` (the run's OWN
persisted draw, so a re-tune cannot rename an old career's rounds) and `formatShortName(oppName)`,
`rubberOutcome` for the score, the block itself behind `v-if="league"`.

Re-verified in source on the branch head, 24.09, and now held by
`tests/component/college-scene-ui.test.ts`: **a title run draws three rows** (Quarterfinal /
Semifinal / Final, all reading «Won»), **an early exit draws the one round she played** and names
neither of the two she never stood in – `playCollegeLeague` breaks the knockout loop on a loss, so
the feed holds only the matches she played and `collegeLeagueMatchesOf` can answer with nothing else
– and **a `null` run draws no block at all**. The data path needs no new field and no new RPC:
`collegeProgressOf` crosses `league` and `leagueMatches` on `CollegeProgressView` and the card reads
both.

⚠ SO T2 SHIPPED NO MARKUP AND NO ENGINE FIELD. What the wave owed on this surface is the half that
was never measured – **the phone law**, now a mounted 375x667 assertion over both shapes, mutated
before believed (the numbers are in the test file's own header: a 291.0px row, 275.2px demanded on
the worst title row and 281.1px on the early exit's, and the mutation arm – one longer surname –
puts them at 319px and 325px of the same 291px). Nothing on the card changed: not a string, not a
class, not a control.

⚠⚠ AND THE WATCH CONTROL IS THE ONE THING THIS SECTION GOT BACKWARDS. §3 and §5 both refused a
replay button as «his to ask for later»; it shipped a month ago, one per row, wired to
`MatchReplay`. It is NOT removed. Invariant 4 binds a control exactly as it binds a label, and a
card that quietly loses a button nobody asked to lose is round 29's rename in a different hat.

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
tournament, no new field model, no scaling of the field with the programme tier (the standing
ruling: the tier buys development, development wins matches). No re-wording of any shipped line: the
year card's existing sentences stand, and so does its championship block, which shipped on 22.08.

⚠⚠ «NO REPLAY BUTTON» STOOD IN THAT LIST AND IS STRUCK, BECAUSE IT WAS A REFUSAL OF SOMETHING
ALREADY ON THE CARD (ruling B, 24.09). `1356712f` gave every championship row a **Watch** control
that opens the app's own `MatchReplay`, and the owner has been pressing it for a month. A refusal
written from a reading cannot retire a shipped control: what the wave refuses is *inventing a second
replay route*, and what it may never do is take the first one away. ⚠ The distinction is invariant
4's, and the cost of getting it wrong is measured – round 29 renamed a tab while fixing something
adjacent and the owner found it in play.

⚠ The wave also refuses the OTHER shape of the same error: no re-styling, no re-labelling and no
re-laying-out of the block while measuring it. T2's whole diff is one new test file and this
document's corrections.

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
