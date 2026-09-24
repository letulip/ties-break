---
type: plan
status: current
area: college-scene
last-reviewed: 2026-09-24
---

# The college scene – the architect's rulings, measured before the briefs

The spec is [the-college-scene-2026-09.md](../specs/the-college-scene-2026-09.md); the step plan is
[college-scene-builder-2026-09.md](college-scene-builder-2026-09.md). This file is the third
document and the one the builders are briefed off: every ruling below was **measured in source on
the branch head** before a task was dispatched, and the two that contradict the spec say so in as
many words. Where a ruling overturns a spec sentence, the spec is corrected in the same wave and
the correction is named in the report.

⚠ THE WAVE'S TWO GRAVEST FINDINGS ARE BOTH «IT IS ALREADY THERE OR IT CANNOT HAPPEN»: the bracket
§3 asks for shipped on 22.08, and the ending §2 floors on cannot occur. Neither is a defect in the
code. Both are a spec written from a reading rather than from a measurement, which is exactly what
this pass exists to catch.

## A – the floor reads the DEGREE, never the latch (T1, and it overturns spec §2)

**Measured.** `type: 'college'` is constructed at exactly three sites – `ending.ts:485`,
`world.ts:2783`, `world.ts:2819` – and **every one of them carries a non-null `resumesWeek`**
(`week + weeksPerYear`, `yearEnds`, `min(untilWeek, week + WEEKS_PER_YEAR)`). `albumBook.ts:601`
already says so in its own comment: «a college ending that never resumes (`resumesWeek === null`,
**which no engine path writes today**)». And graduation does not leave one either – `finishCollege`
takes the latch OFF for good (`world.ts:2807`, «NO 'ending' HERE, AND THE ASYMMETRY IS THE FACT»).

**So the state spec §2 floors on has no producer**, and the clause as written would be dead code
whose measured share in §6 row 1 is 0. The second receipt is the door itself:
`EndingScreen.vue:348` draws the dynasty control under `v-if="resumes === null && dynasty"`, so a
college latch cannot open the handover at all – the only ending that reaches `dynastyBackgroundOf`
is a standing one, and a standing one is never `'college'`.

**RULED.** The floor reads **the degree**: `world.college.doneWeek !== null` and
`finishedTheCourse(world.college.years.length, ENDINGS.collegeYears)` – the SAME predicate the
album's `graduated` occasion is gated on (`albumBook.ts:706`, `shared/avatarEmotion.ts`) and the
same one `CollegeDoneDialog.vue:67` draws the graduation card on. One spelling of «she has a
degree», three readers.

Why this and not the two alternatives, both refused by name:

* **the fork answer** (`world.fork?.answer === 'college'`) prices a girl who enrolled, played one
  year and walked exactly like a graduate. The justification the owner ruled on is «a degree and a
  profession» – one year is neither.
* **the ending type**, above: no producer.

⚠ The spec's own sentence «the clause reads the ENDING, not the biography» therefore falls, and
the consequence is stated rather than hidden: **a graduate who then had a full tour career and
retired thin now reads `middle`.** That is a FLOOR and never a ceiling – a graduate who retires
wealthy stays wealthy – and it is the honest reading of his ruling, because the degree does not
stop being a degree when the tour is over. It is question 1 of the report.

## B – the bracket is SHIPPED, and the wave owes the measurement (T2, and it overturns spec §3)

**Measured.** `CollegeYearCard.vue` already draws the championship's own block – commit
`1356712f`, 22.08, «Wave 3 / G1: a college year gets a tournament, and the call-up is earned». The
`.college-league` div carries the head, the occasion art, `leagueNote`, `leagueStakeLine` and
**one row per played match**: `leagueLabel(m)` is `stageLabel(match.round, 2 ** rounds)` + the
opponent's short name («Quarterfinal – L. Kovac»), `rubberOutcome(m)` is the score with `ret.`
notation, and there is a **Watch** control per row wired to `MatchReplay`.

So three of spec §3's four sentences are already true, and the fourth is false in the other
direction: §3 and §5 both say a replay button is «his to ask for later, not this wave's to
invent» – **it shipped a month ago**. ⚠ It is not removed and not touched: invariant 4 binds a
control exactly as it binds a label, and a card that loses a button nobody asked to lose is the
round-29 rename wearing a different hat.

The data path §3 asks the builder to settle by reading is settled and needs no new field:
`collegeProgressOf` (world/college.ts:1082) already crosses `league: lastLeagueRun(college)` and
`leagueMatches: collegeLeagueMatchesOf(world, run.week)` on `CollegeProgressView`, off the latched
ending, and the card reads both.

**RULED.** T2 ships **no new markup**. What the wave owes on this surface is the half that was
never measured – the phone law – and it is measured with the helper this repo already keeps for a
three-span row rather than with a dialog assertion the card has no control for:
`assertInlineRowFits(row, [who, score, watch], PHONE, label)` from `tests/component/fits.ts`, over
a title run AND an early exit, mutation-verified (lengthen the label and watch it redden). The
spec's «Current truth» and §3 are corrected in the same commit.

## C – the album has no college chapter; the line is a CHECKLIST on the graduate's page (T3)

**Measured.** `AlbumBand` is `'prologue' | 'young' | 'teen' | 'adult' | 'lateCareer'`
(`albumCorpus.ts:42`) and `ALBUM_CHAPTER_TITLES` has five entries. **There is no college
chapter and no per-year college page.** The album's whole college reading is occasion **A30
`graduated`** (`albumCorpus.ts:1036`), `kind: 'closing'`, bands `['teen', 'adult']`, gate
`'college-finished'`, four temperament voices – plus the `'left-the-tour'` closing family.

**RULED.** «One line per year that held a championship» lands as `AlbumNote.lines`
(`protocol/album.ts:60`, «the checklist form: short ruled lines instead of a paragraph») on the
`graduated` sheet, built ENGINE-side from `world.college.years`, one entry per banked year whose
`league` run is non-null. That is A-L1's own precedent, quoted from the corpus: «THE FACTS ARE NOT
HERE, DELIBERATELY … her name, her cabinet and the line's generation ride the note's CHECKLIST».
No new occasion, no new chapter, no new band, and the corpus's «no placeholders and no
interpolation» law stays intact because the interpolation happens where it already happens.

⚠ A career that never finished the course draws no `graduated` sheet, so its championships get no
album line – and that is the same rule as ruling A, arrived at from the other side.

## D – the booth's college register goes INSIDE the shipped licence (T4.3)

**Measured.** `lineageLicensed` (`world/spotlight.ts:156`) returns
`motherCareer.proTitles > 0 || motherWasKnown(dynasty)`, and directly above it stands a ⚠⚠ that is
a RULING and not a note: «**A COLLEGE-FORK MOTHER LICENSES NOTHING, AND THAT IS THE POINT RATHER
THAN A SIDE EFFECT** (§2's own sentence) … what she does not get is a booth saying «дочь той самой»
about a woman nobody watched.»

Spec §4.3 asks for a line «licensed off `collegeTitles > 0`». Read literally that WIDENS the
licence and overturns the dynasty spec's §2 – which is not a builder's move and not an architect's
either.

**RULED.** The spec's own words settle it without a widening: «the **KNOWN-claim register**, never
the pro-cabinet one». `boothLineageLines` becomes a three-arm fork **inside** the existing licence –
`proTitles > 0` keeps `BOOTH_LINEAGE_TITLED`; else `collegeTitles > 0` takes a new college pool in
the KNOWN register; else `BOOTH_LINEAGE_KNOWN` as today. `lineageLicensed` is **not touched**, its
guard test stays green, and the line is live for a real career: college at nineteen, the student
title, the degree, back to the tour, a WTA ranking inside `newsRankKnown`.

Whether a college champion the professional press never saw should license a mention at all is
his, not mine – question 2 of the report.

## E – v89's cost, counted (T4.1/T4.2)

`collegeTitles` is **required, never optional** – the field is a count and 0 is its honest value,
so an optional field would be a second spelling of zero. Measured cost of that decision:
`motherCareer` literals live in **six** files outside the engine
(`tests/helpers/dynastyHandover.ts`, `tests/wave10-handover.test.ts` ×3,
`tests/wave10-heredity.test.ts`, `tests/wave10-lineage.test.ts`, `tests/wave10-fame.test.ts`,
`tests/wave10-walker-retirement.test.ts`, `tools/dynasty-bench.ts` ×2) plus the four engine sites
(`protocol/profile.ts`, `world/endings.ts`, `world/state.ts`'s `DynastyRecord` – which aliases
`DynastyHandover['motherCareer']` and therefore needs no edit – and `stores/game.ts`'s
field-by-field copy).

The booth packet is a second, narrower widening: `{ proTitles, slams }` is spelled inline at
`world/spotlight.ts:176`, `protocol/competition.ts:396`, `components/MatchViewer.vue:172` and
`viz/commentary.ts:886`, and constructed in `world/snapshot.ts` (5 hits) and
`tests/wave10-fame.test.ts` (18 hits).

**Predicted frozen diff, to be MEASURED not trusted:** every frozen career carries
`dynasty: null` (`v88.json:32714`), the new field is NESTED inside that null, and the serialised
world therefore gains **no key at all** – so v89 is v88's case exactly: `schemaVersion` moves,
`careerHashAtSchema` needs **no new peel rung**, and `PRE_V89` holds the verbatim v88 constants.
A key appearing anywhere else is a STOP.

## F – the walker exists; extend it, do not write a second one (T5)

`tools/college-year-content.ts` already opens careers, answers the fork through
`answerFork(world, 'college')`, walks the years with `resumeFromCollege`, drains the birthday and
the life beats, and prints per-year tables off `world.college.years` – with a file note explaining
that it reads the WORLD and not the feature, which is what makes it an A/B instrument. Spec §6
rows 2–4 are three more columns on that instrument, not a new tool. ⚠ Its «⚠ MEASUREMENT ONLY»
contract holds: nothing under `src/` is touched and no save is written.

## G – the gate hazards on this tree, named before they bite

1. **Untracked files from another live session** sit in the checkout (`playwright.devlog.config.ts`,
   `tools/_devlog_*.ts`, `tools/devlog/`, `tools/generated/devlog-clash-hits.json`). `npm run check`
   runs `check:tools` over **all** of `tools/` and the tools registry check scans the DIRECTORY, so
   a foreign file can redden this wave's gate. Read the failure before believing it, never commit
   one of them, and never delete one.
2. `origin/main` moved ahead while the branch sat (wave 12 merged as `df8022a3`). **Merged once**,
   `git merge origin/main`, 24.09 – not rebased.
3. The pathspec commit form is mandatory in this shared checkout, and a NEW file needs
   `git add -- <path>` before `git commit -F msg -- <paths>` can carry it.
