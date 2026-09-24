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

⚠ AND ONE THING THAT SHIPS TODAY IS A DEFECT: the championship block's row does **not** fit a 375px
phone on the long-name and `ret.` tails – measured 24.09, **§3a**. It truncates the opponent's name
rather than stranding a control, and the repair is his ruling.

## 1. One sentence of design

Nothing new is simulated and no prize is added: the wave gives the championship that already happens
a face that is MEASURED (the bracket shipped on 22.08 and this wave measured it against a phone – ⚠
it does **not** fit on the long-name and `ret.` tails, §3a, and the repair is his), a memory (the
album and the handover), and the graduate her honest shelf – reusing the kept match rows, the fixed
album machinery and the dynasty door as they stand.

## 2. The floor – the graduate's shelf (his «ок», closing the parting's §12)

`dynastyHandoverOf` maps the new family's background off her own account
(`dynastyBackgroundOf(kidFundsCents)`: wealthy from $120k, middle from $25k, working below). ONE
clause on top: **a career that holds the DEGREE reads no lower than `middle`** – a degree and a
profession are a middle start whatever the account says. The floor, never a ceiling: a graduate who
retires wealthy stays wealthy, and the clause lifts only `working`.

⚠⚠ THE READER IS THE DEGREE, AND THE SENTENCE THAT STOOD HERE ASKED FOR A STATE THAT CANNOT OCCUR.
This paragraph used to say «a career whose standing ending is the college one» and «the clause reads
the ENDING, not the biography». Ruling A (`docs/plans/college-scene-rulings-2026-09.md`) measured
that on the branch head before a line was dispatched: all three sites that construct a
`type: 'college'` latch carry a NON-NULL `resumesWeek`, `finishCollege` takes the latch off for good
at graduation, and `EndingScreen.vue` draws the dynasty control under `resumes === null && dynasty`
– so a college latch cannot open this door at all. A clause on the ending type would have been dead
code with a measured share of zero, and §6 row 1 would have measured it as a success. Corrected in
the same wave, 24.09; the shipped predicate is
`college.doneWeek !== null && finishedTheCourse(years.length, ENDINGS.collegeYears)`, which is the
ONE spelling this repo already keeps for the degree (the album's `graduated` occasion and
`CollegeDoneDialog.vue` read the same one). The fork answer was refused by name as well: it would
price a girl who enrolled and left after a year exactly like a graduate, and what he ruled on is
«a degree and a profession».

⚠ THE CONSEQUENCE, STATED RATHER THAN HIDDEN: a graduate who then had a full tour career and
retired thin reads `middle` too – the degree does not stop being a degree when the tour is over.
That is a widening of what the old sentence promised («a college CHAPTER inside a pro career changes
nothing»), it is the honest reading of the ruling, and it is **question 1 of the wave's report**.

⚠ This CLOSES the «middle band is structurally empty» finding for the college route (the dynasty
spec §8 row 3): the dated note is appended there, predicted and measured. Zero schema, zero draws,
one wrapper (`dynastyBackgroundFloored`, no new exported symbol) and its tests.

## 3. The bracket – SHIPPED 22.08; the measurement is what this wave added, and it found a defect

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
was never measured – **the phone law** – and measuring it found a defect. Nothing on the card changed
while measuring it: not a string, not a class, not a control.

### 3a. The phone law, measured – ⚠⚠ THE BLOCK DOES **NOT** FIT AT 375x667

⚠⚠ THE FIRST NUMBERS THIS SECTION CARRIED (275.2 / 281.1 of 291.0, «it fits») WERE WRONG AND ARE
STRUCK. They came from `tests/component/fits.ts`, which is a documented FLOOR: it charges the row's
**Watch** control **0.0px** (`demandedWidth` credits a label only under `white-space: nowrap`, which
`.rubber-watch` does not declare) and charges nothing anywhere for `letter-spacing`, for `uppercase`
being wider than the glyphs it counts, or for `tabular-nums`. On a row with ~5px of real margin that
floor does not merely under-count, it **inverts the verdict** – and a green test reporting the
opposite of the measurement is worse than no test. Re-measured in a one-off headless Chromium over
the row's verbatim markup with the real `src/style.css` and the repo's own self-hosted Manrope (the
harness `fits.ts`'s header describes for fitting its own constant), 24.09:

| row | demand | of room | verdict |
| --- | --- | --- | --- |
| `Quarterfinal – C. Ostergaard` / `Won 6-3 6-4` / `Watch` | 296.1 | 291.0 | ⚠ **OVER by 5.1** |
| `Semifinal – C. Ostergaard` / `Won 6-3 6-4` / `Watch` | 279.3 | 291.0 | 11.7 spare |
| `Final – C. Ostergaard` / `Won 6-3 6-4` / `Watch` | 251.5 | 291.0 | 39.5 spare |
| `Quarterfinal – C. Ostergaard` / `Lost 4-6 5-7` / `Watch` | 295.6 | 291.0 | ⚠ **OVER by 4.6** |

The Watch span costs **41.33px**, not the floor's 0.0: 29.75 plain, 31.61 at weight 800, 36.33
uppercased, 41.33 with the 0.1em tracking. So `.rubber-who`'s real budget is `291.0 − 16 − 72.28 −
41.33` = **161.4px** against the 166.5px it wants, and the rendered span confirms it independently
(`scrollWidth` 166.5 vs `clientWidth` 161.9, truncated).

⚠ AND THE WORST ROW IS THE **TITLE RUN'S QUARTERFINAL**, NOT THE EARLY EXIT'S – the earlier framing
in this wave's documents (mine included) had it the other way round, from counting characters.
`tabular-nums` gives every figure the same advance, so «Won 6-3 6-4» (72.28) is **wider** than the
longer string «Lost 4-6 5-7» (71.80). Struck and corrected.

**How much of the draw, counted over all 211 `SURNAMES`:**

| stage word | straight sets | after a retirement (`ret.`, score 94.6) |
| --- | --- | --- |
| Quarterfinal | 11 of 211 | **129 of 211** |
| Semifinal | 0 of 211 | 25 of 211 |
| Final | 0 of 211 | 0 of 211 |

⚠⚠ THE `ret.` COLUMN IS THE HEADLINE AND IT IS A MEASUREMENT, NOT A PROPOSAL: **the score span costs
22.3px more when it carries `ret.`, which takes the Quarterfinal row from 11 of 211 surnames to 129
of 211.** By surname length on straight sets: ≤7 characters all fit, 8 is over by 1.4, 9 by 8.4, 10
by 9.9. At **320x568** (no test arm, on the coordinator's ruling – 375x667 is the house's phone law by
name and a permanently red arm is not actionable) the room is **236.0px**, the same row is **over by
60.1**, and 211 of 211 surnames overflow both the Quarterfinal and the Semifinal row while 52 of 211
overflow even `Final`.

⚠ THE FAILURE MODE IS **TRUNCATION, NOT A LOST CONTROL**, and this is the half that keeps it out of
round-20 #3's category. `.college-rubber` declares no `flex-wrap`, so the row cannot spend a second
line and nothing leaves the screen; `.rubber-who` gives way through its own `text-overflow: ellipsis`
– what `src/style.css` calls «the safety net at 375px, not the plan» – so the owner sees
«Quarterfinal – C. Ostergaar…». The two spans that CANNOT yield cost 129.6 of the 291.0, leaving
161.4 for the name, so the Watch control and the score are never displaced. That is asserted and
mutation-verified (`flex-wrap: wrap` reddens it), not claimed.

⚠⚠ THE REPAIR IS **HIS RULING** AND NO BUILDER'S. Every candidate is a wording or a layout change to
a card that shipped on 22.08, which invariant 4 puts in his hands: shorten the row label, drop the
stage word, abbreviate or move the score's `ret.`, let the row wrap, restyle or shrink the Watch
pill, trade the 0.1em tracking. The wave names the candidates and picks none. Question in the wave's
report.

⚠⚠ AND THE WATCH CONTROL IS THE ONE THING THIS SECTION GOT BACKWARDS. §3 and §5 both refused a
replay button as «his to ask for later»; it shipped a month ago, one per row, wired to
`MatchReplay`. It is NOT removed. Invariant 4 binds a control exactly as it binds a label, and a
card that quietly loses a button nobody asked to lose is round 29's rename in a different hat.

## 4. The record – the album and the dynasty

1. **The album book**: the graduate's page gains the championship's line per year that held one –
   a title year says so, an exit year says how far she went (DRAFT wording, one line per shape,
   his pass). The fixed seven-slot ending album is NOT touched (its redesign is his reserved
   backlog item); this is the BOOK's.

   ⚠⚠ THERE IS NO COLLEGE CHAPTER, AND THIS LINE USED TO SAY THERE WAS. Ruling C measured it:
   `AlbumBand` has five members (`prologue` / `young` / `teen` / `adult` / `lateCareer`) and
   `ALBUM_CHAPTER_TITLES` five entries, and the album's whole college reading is the **`graduated`
   closer** (occasion A30, gate `college-finished`). So the lines land as `AlbumNote.lines` – the
   checklist form the wire already declares – on that sheet, built engine-side, exactly as the
   heirloom's cabinet facts are. Corrected 24.09.

   ⚠ AND THE RECORD IS THE **SHEET's** CHECKLIST, NOT THE LEAD FRAME's, which is a repair the build
   found and the spec could not have: `portraitStage` puts 17–22 in one band, so a girl who
   graduated at twenty-two shares her chapter with her seventeenth year and those weeks sort ahead
   of the degree. Measured – **one junior title erased all three college rows**. Captured is not
   surfaced, and the fix was to ask the sheet.
2. **The handover** (schema v89, the wave's one move): `motherCareer` gains
   `collegeTitles: number` – the count of her banked years with `wonTheLeague` – carried through
   `DynastyRecord` like every sibling field. Back-fill 0 for saves that predate it; append-only
   migration, golden fixture v89.json, e2e fixtures regenerated – the full four-part move.
3. **The booth**: a lineage line for a college-champion mother in the KNOWN-claim register, never
   the pro-cabinet one (a student title is not a WTA title; `proTitles`' own lesson applied before
   it bites). One or two lines, DRAFT.

   ⚠⚠ IT IS A REGISTER **INSIDE** THE SHIPPED LICENCE AND NOT A WIDENING OF IT. Read literally,
   «licensed off `collegeTitles > 0`» would overturn a ruling already in the code: `lineageLicensed`
   (`world/spotlight.ts`) returns `proTitles > 0 || motherWasKnown(dynasty)` under a ⚠⚠ that says
   «A COLLEGE-FORK MOTHER LICENSES NOTHING, AND THAT IS THE POINT RATHER THAN A SIDE EFFECT» (the
   dynasty spec §2). Ruling D keeps it: `boothLineageLines` forks three ways inside the existing
   licence – pro cabinet, else the student title, else the mother the tour merely knew – and
   `lineageLicensed` is untouched, its guard green. The line is live for a real career (college at
   nineteen, the student title, the degree, back on tour, a ranking inside `newsRankKnown`).
   Whether a college champion the professional press never saw should be mentioned at all is
   **question 2 of the wave's report**, and it is his.

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
