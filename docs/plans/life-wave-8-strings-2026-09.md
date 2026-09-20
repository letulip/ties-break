---
type: plan
status: current
area: life
canonical: false
last-reviewed: 2026-09-20
---

# Wave 8 – every player-facing string the wave adds (the вычитка table)

The pregnancy-and-return wave's whole copy set, in one place, for the architect's read and the
owner's playtest. T8 of [the wave-8 builder brief](life-wave-8-builder-2026-09.md); the shape and the
rigour are [wave 7's](life-wave-7-strings-2026-09.md) strings document, whose own antecedents are
[wave 5's](life-wave-5-strings-2026-09.md) and [wave 6's](life-wave-6-strings-2026-09.md).

**Not one shipped string moved in this wave.** Every row below is an ADDITION, quoted **verbatim from
the tree**, and every one is a **DRAFT – awaiting his pass** (invariant 4): nothing here ships as
approved until his word, and the PR says so. The wave's NUMBERS – the hazard curve's four rungs, the
three answer deltas, `playsOnWeeks`, `termWeeks`, `decisionWeeksAfterBirth`, the postpartum band and
its support scale, the four return-decision weights, the staged factor's staircase and the freeze's
12 / 156 – are not strings; they ride T9's bench and are **out of this table's scope on purpose**
(the brief's §4 contract). They are NAMED in §7 so nobody has to wonder whether they were forgotten,
together with the wave's three non-string PICKS.

**Provenance.** The rows were transcribed from the working tree and reconciled against the wave's own
draft flags: `git diff c322301c..HEAD -- src/` read at the close of T7 (`c322301c` is this branch's
docs-only first commit, so the diff is the whole wave). §9 walks that flag list against this table in
both directions – **a draft in code missing here is a defect of T8**, and none is missing. ⚠ §9 also
records a **defect in the sweep command itself**, found while walking it: the prescribed
`grep '⚠ DRAFT'` returns **22 of the wave's 38 flagged lines**, and the sixteen it drops carry seven
string sites covering **eight of this table's thirty rows**. The walk was redone against `grep DRAFT`
and §9 is the complete list.

## 0. The count

| | |
| --- | ---: |
| player-facing **strings** the wave ADDED to the tree | **30** |
| of them **ruled** | **0** |
| of them **draft – awaiting his pass** | **30** |
| shipped strings that **MOVED** | **0** |
| per task | T2 **16** · T3 **2** · T4 **2** · T5 **4** · T6 **6** |
| flagged **non-string** drafts carried in §7 | the drafted numbers · three picks (two faces, one glyph) |
| explicit **NON-rows**, with the reason (§6) | `PSY_COUNSEL.postpartum` · `ALBUM_CLOSING_FAMILY.family` · `SOFT_BEAT_CARD` × 2 · the invariant throws · the harness literals |

⚠ **THIRTY, AGAINST THE BRIEF'S ESTIMATE OF ~70, AND THE GAP IS REAL RATHER THAN A MISSED SURFACE.**
The estimate was written before the tasks were built and it priced this wave like wave 7, which
carried three quoting pools, a 28-name pool and the staff's 31 letters. Wave 8 is machinery: a schema
move, a derived hazard, an entries seam, a protected-rank freeze, a staged match factor and a ninth
ending – and exactly ONE pool in it obeys the completeness law (`EXPECTING_HER_LINE`'s four voices ×
two presences, the eight rows of §1). Everything else is a single line per surface. §9's sweep is
what says the shortfall is not a missing table rather than a smaller wave: every flagged site in the
code has a row, and **three named surfaces produced no string at all** – the album's closing family
(§6.2), the pause's diary band (§6.5) and T7's sponsors (§7.3).

---

## 1. T2 – the announcement (`'expecting'`)

`src/engine/world/lifeBeat.ts` §3j – **16 strings**, all draft. SHE announces; the parent reacts, and
no answer unmakes it (the record is written at the raise). The quoted span is shared between the two
presences by the вычитка's own law: what presence changes is the frame, never her sentence.

⚠ **No name and no gender for the one she married** – §3g's and §3h's standing law, unchanged: the
episode has held a persisted `partnerName` since wave 7 and no surface speaks it. ⚠ **And no sex for
the child here**, which is a different law: the row is ruled girls-only, but the row does not exist
yet on the week she says this. The birth may say «daughter» (§3); this beat may not.

| # | home (`file` · constant) | when the player sees it | the string, verbatim | |
| ---: | --- | --- | --- | --- |
| P1 | `lifeBeat.ts` · `EXPECTING_HER_LINE.sunny.roof` | the `'expecting'` card while she lives under the roof, bond `close`/`steady`, voice `sunny` | She waited until we were all sitting down, and then said it straight out. "We are having a baby. I am happy and I am frightened, and I wanted you to know both." | `DRAFT – awaiting his pass` |
| P2 | `EXPECTING_HER_LINE.sunny.away` | the same card from college/independence – the call frame | She called on a Sunday, before anything else had been said. "We are having a baby. I am happy and I am frightened, and I wanted you to know both." | `DRAFT – awaiting his pass` |
| P3 | `EXPECTING_HER_LINE.fiery.roof` | as P1, voice `fiery` | She came in and said it before her coat was off. "We are having a baby. I have thought about the tennis. I am not finished." | `DRAFT – awaiting his pass` |
| P4 | `EXPECTING_HER_LINE.fiery.away` | as P2, voice `fiery` | She rang between flights and led with it. "We are having a baby. I have thought about the tennis. I am not finished." | `DRAFT – awaiting his pass` |
| P5 | `EXPECTING_HER_LINE.quiet.roof` | as P1, voice `quiet` | She mentioned it while she was looking at the calendar, as if it were a fixture change. "We are having a baby. I will play a while yet, and then I will not." | `DRAFT – awaiting his pass` |
| P6 | `EXPECTING_HER_LINE.quiet.away` | as P2, voice `quiet` | She sent the next block of dates through, and this was underneath them. "We are having a baby. I will play a while yet, and then I will not." | `DRAFT – awaiting his pass` |
| P7 | `EXPECTING_HER_LINE.deep.roof` | as P1, voice `deep` | She sat with it through most of the evening, and then put it in one sentence. "We are having a baby. I know what it costs. I want it." | `DRAFT – awaiting his pass` |
| P8 | `EXPECTING_HER_LINE.deep.away` | as P2, voice `deep` | She was quiet for most of the call, and said it just before goodbye. "We are having a baby. I know what it costs. I want it." | `DRAFT – awaiting his pass` |
| P9 | `EXPECTING_DRY` | the same card at `strained`/`cold` – the dry rung, not one word of hers | She is expecting a child. Nobody in this house was told first. | `DRAFT – awaiting his pass` |
| P10 | `EXPECTING_HEADING` | the parent's frame over the card, every bond band, every week | A child is coming, and she has already decided | `DRAFT – awaiting his pass` |
| P11 | `LIFE_BEAT_OPTIONS.expecting[0]` (`joy`) | the card's first answer button (+2.5 on `bond`, and it persists `support: 'warm'`) | Tell her it is the best news in the house | `DRAFT – awaiting his pass` |
| P12 | `LIFE_BEAT_OPTIONS.expecting[1]` (`worry`) | the second button (−0.5, `support: 'measured'`) | Say we are glad, and that we will worry | `DRAFT – awaiting his pass` |
| P13 | `LIFE_BEAT_OPTIONS.expecting[2]` (`career-first`) | the third button (−4, `support: 'cold'`) | Ask her what this does to the tennis | `DRAFT – awaiting his pass` |
| P14 | `ANSWER_EVENT.expecting.joy` | the feed's `info` row after answering `joy` | She is expecting a child. We told her it was the best news in the house. | `DRAFT – awaiting his pass` |
| P15 | `ANSWER_EVENT.expecting.worry` | the same row after `worry` | She is expecting a child. We said we were glad, and that we would worry. | `DRAFT – awaiting his pass` |
| P16 | `ANSWER_EVENT.expecting['career-first']` | the same row after `career-first` | She is expecting a child. We asked what it does to the tennis. | `DRAFT – awaiting his pass` |

⚠ **P14–P16 open on the same clause**, the `met`/`ended`/`engaged` pools' established parallel shape,
kept deliberately on one more kind rather than broken here.

⚠⚠ **P11–P13 ARE THE ONLY ANSWER SET IN THE GAME WHOSE REPLY OUTLIVES ITS CARD.** Each one also
writes a persisted `support` grade (`warm` / `measured` / `cold`) that T4's postpartum recovery scales
by and T5's return decision weights on, eleven months later. A rewording of any of the three is free;
a re-GRADING of which answer is which is a mechanical change and is §8 Q-1.

## 2. T3 – the pause

`src/engine/world/lifeBeat.ts` §14, `src/engine/world/medical.ts` – **2 strings**. She stops entering
and the weeks go on; the parent's week is untouched underneath.

| # | home (`file` · constant) | when the player sees it | the string, verbatim | |
| ---: | --- | --- | --- | --- |
| P17 | `lifeBeat.ts` · `PAUSE_EVENT` | the KEPT `life` feed row on the week entries close (`playsOnWeeks` after the announcement), white-heart marked until he picks a glyph | She is entering no more tournaments before the birth. What she is already in, she will play. | `DRAFT – awaiting his pass` |
| P18 | `medical.ts` · `PREGNANCY_PAUSE_DETAIL` | the `detail` under every refused tournament entry on the Season screen, from `pausesWeek` until she decides (`entryStatus` → `blocked` / `unavailable`) | She is expecting – no new entries. The ones she already holds still stand. | `DRAFT – awaiting his pass` |

⚠⚠ **P18 GOES STALE BY TWENTY WEEKS AND THE SOURCE SAYS SO RATHER THAN QUIETLY REWORDING IT.** The
refusal window has no upper bound of its own – `pauseCovering` returns the record for every week from
`pausesWeek` on, and the record is cleared by her DECISION and not by the birth (`landBirth`
deliberately writes nothing to it, because clearing it would re-open the entry gate the week after a
child is born on a career that has not yet decided whether it is coming back). So for exactly
`decisionWeeksAfterBirth` weeks – 20 at the drafted constant – this card says «She is expecting» about
a woman who is not. **The refusal is right and the WORD is stale.** It is §8 Q-2, and it is his: a
builder softening a ruled-shape sentence to fit a new window is the move invariant 4 forbids.

⚠ **Both lines are husband-agnostic** (§0's decoupling ruling) – a mid-pregnancy divorce is ordinary
life and neither sentence mentions him, so both read correctly on a career that had one.

⚠ **P17 names no return.** «Until she is back» would be a promise T5 is allowed to break; the birth is
the one date this wave knows, so it is the only one the line uses. ⚠ Its first draft read «entering
nothing more» and the tail-lint caught it (`tests/helpers/bannedTails.ts`) – recorded here rather than
quietly reworded, because the guard worked and the rejected phrasing is the one a reader would
otherwise wonder about.

## 3. T4 – the birth

`src/engine/world/lifeBeat.ts` §14, `src/engine/world/album.ts` – **2 strings**. The birth is NEWS
and not a decision: no card, no answer, no beat.

| # | home (`file` · constant) | when the player sees it | the string, verbatim | |
| ---: | --- | --- | --- | --- |
| P19 | `lifeBeat.ts` · `BIRTH_EVENT` (through `fireMilestone`) | the KEPT feed line on the due week – survives every prune, once per pregnancy | Her daughter was born this week. The family has somebody new in it. | `DRAFT – awaiting his pass` |
| P20 | `album.ts` · `SCROLL_LABEL.birth` | the album scroll's label for the `'birth'` milestone; the detail cell is deliberately empty (the row carries no `kind` at all) | Her daughter | `DRAFT – awaiting his pass` |

⭐ **BOTH MAY SAY «daughter» AND DO** – the sex is RULED (20.09, «пол нужен, но мальчиков у нас пока
нет, можно сделать заготовку, но пока будут только девочки») and written as a literal `'girl'` on the
row, so the sentence states a fact the save holds rather than guessing at one. ⚠ The day boys exist,
these are the two rows that have to bend, and they are the only two.

⚠ **P19 is husband-agnostic and here that is load-bearing rather than polite**: the marriage may have
ended months before and the birth fires anyway, so a line that mentioned him would be false on exactly
the careers the decoupling ruling exists to protect. «The family» is the reader's own household.

⚠ **No figure and no price in either, because there is none.** There is no birth fee – the wedding's
own ruling is the precedent («я думаю как с подарками, никто и нисколько», 18.09) and the guard is the
byte-equality of `fundsCents` across the day. The child's STANDING cost line is W5's question.

## 4. T5 – her decision and the `'family'` ending

`src/engine/world/endings.ts`, `src/engine/ending.ts` – **4 strings**. One coin, two terminal shapes.
⭐ «The ending cannot ship without its copy, and the copy is HIS» is §0's own sentence about exactly
these rows.

| # | home (`file` · constant) | when the player sees it | the string, verbatim | |
| ---: | --- | --- | --- | --- |
| P21 | `endings.ts` · `RETURN_EVENT` | the KEPT `milestone` feed row on the arm that does NOT end the career – the week she says she is going back | She has decided to go back. From this week she can enter tournaments again. | `DRAFT – awaiting his pass` |
| P22 | `ending.ts` · `ENDING_BLURB.family` | the epilogue's headline paragraph when the career ends `'family'` | She had a child, and the months after it went by without an entry in them. Nobody put the question to her and nobody had to – it was hers to answer and she answered it. | `DRAFT – awaiting his pass` |
| P23 | `ending.ts` · `ENDING_TITLE.family` | the epilogue's title, the album's last page, AND the latch's feed row | She did not go back | `DRAFT – awaiting his pass` |
| P24 | `ending.ts` · `endingForFamily`'s `detail` | the specifics line beside P23 – `latchEnding` prints «`<title>` – `<detail>`.» so the feed row reads «She did not go back – 51 weeks without a new entry.» | *N* weeks without a new entry | `DRAFT – awaiting his pass` |

⚠⚠ **P22 KEEPS BOTH HALVES OF THIS RECORD'S STANDING RULE AND BOTH ARE HARDER HERE THAN ANYWHERE
ABOVE IT.** It may not CONSOLE – «a life completed rather than a career failed» is the DESIGN's
sentence about the ending and not a sentence the epilogue is allowed to say to the player, because
saying it would be the game deciding for him how the last year felt. And it may not CONGRATULATE
either, which is the mirror the peak's own row states.

⚠⚠ **P22 SHARES SIXTY CHARACTERS WITH THE `peak` BLURB, VERBATIM, AND THAT IS FLAGGED RATHER THAN
FIXED.** Measured, not eyeballed – the longest common substring of the two is
«`. Nobody put the question to her and nobody had to – it was `», which is the whole middle clause of
each. The source calls it «`peak`'s own idiom» and the reason is sound (§4a's law at this layer's
second-biggest moment: nobody put the question to her), but *idiom* understates what is on the page:

> **peak** – She was at the top of the sport the season she stopped. **Nobody put the question to her
> and nobody had to** – it was decided before anybody else heard about it.
>
> **family** – She had a child, and the months after it went by without an entry in them. **Nobody put
> the question to her and nobody had to** – it was hers to answer and she answered it.

Two of the nine epilogue blurbs now open their second sentence identically, and a player who reaches
both across two careers reads the same eight words twice on the same screen. **Nothing was changed** –
a builder harmonising two of his blurbs to taste is the move invariant 4 forbids, and the sentence is
right about both endings. It is §8 Q-8 and it is his: keep the echo as a deliberate rhyme between the
two endings that are HERS, or reword the newer one.

⚠ **P23 is deliberately about the TENNIS rather than about the child.** «She stayed with the family»
is the warmer alternative and was refused: it tells the player what she chose INSTEAD, which is a
larger claim than the record is entitled to make. It also has to survive the concatenation in P24.

⚠ **P24's «without a new entry» is exact where «off tour» would have been a shade false**: the pause
refuses NEW entries and the ones she already holds still play out (P18), so she may well have been on
a court inside those weeks. The span is counted from `pausesWeek`, not from the announcement – the
weeks the entries were actually shut. At the drafted constants that is 31 + 20 = 51.

⚠ **P21 says she is TRYING and never that she is BACK**, and that is the wave's honest split made into
a sentence rather than only into arithmetic. Whether the comeback WORKS is emergent from T6's pricing
and measured by T9; a row that said «she is back» would be the model announcing an outcome it has not
computed, on the one screen the player reads as a record of what happened.

⚠ **The ending's type name `'family'` is RULED** (20.09, «мне здесь не принципиально» – the draft
stands). It is a machine value and appears on no screen.

## 5. T6 – the return plan (`'return-plan'`)

`src/engine/world/lifeBeat.ts` §3k – **6 strings**. ⭐ The one card in this layer that is the
PARENT's, and that is §4a read exactly rather than bent: «SHE decides, the parent REACTS» is a law
about HER LIFE, and she has already decided. What is left is the SCHEDULING, which is what the parent
has always decided (the college fork's mechanical questions are the precedent).

| # | home (`file` · constant) | when the player sees it | the string, verbatim | |
| ---: | --- | --- | --- | --- |
| P25 | `lifeBeat.ts` · `RETURN_PLAN_SAID` | the card's one line on the return week – one cell, no voice axis, the card quotes nobody | She is entered again from this week. The desk wants to know what the first months look like – the small draws she can win, or the big ones she can still get into. | `DRAFT – awaiting his pass` |
| P26 | `RETURN_PLAN_HEADING` | the parent's frame over it, every distance and every weather | She is back, and the first months have to be built | `DRAFT – awaiting his pass` |
| P27 | `LIFE_BEAT_OPTIONS['return-plan'][0]` (`small-first`) | the first answer button (**0 bond** – the price of this answer is paid in tennis) | Start with the small draws she can win | `DRAFT – awaiting his pass` |
| P28 | `LIFE_BEAT_OPTIONS['return-plan'][1]` (`straight-back`) | the second button (**0 bond**) | Put her straight back in the big ones | `DRAFT – awaiting his pass` |
| P29 | `ANSWER_EVENT['return-plan']['small-first']` | the feed's `info` row after answering `small-first` | She is entering again. We start with the small draws and build from there. | `DRAFT – awaiting his pass` |
| P30 | `ANSWER_EVENT['return-plan']['straight-back']` | the same row after `straight-back` | She is entering again. We put her straight back in the big ones. | `DRAFT – awaiting his pass` |

⚠⚠ **NEITHER LABEL NAMES THE FREEZE AND NEITHER PROMISES ANYTHING, AND THAT IS THE TRAP WORKING.**
The protected ranking enters the big draws either way – which is what makes the wrong ramp real: the
staged factor loses them. How many entries a protected ranking buys is a rule the card may not turn
into a guarantee, and what either ramp is WORTH is emergent and measured (T9), so a row reading «the
safe way back» would be the game grading a decision it has not simulated yet.

⚠ **P25's «The desk» is NOT a new word and that is checked rather than assumed** – the entry letter's
own sender in the inbox is the shipped string `Tournament desk` (`InboxSheet.vue`), so the card names
the surface the player already books through. (The word also appears four times in shipped copy as a
piece of FURNITURE – the college room's desk, the cleared desk – which is a different sense and is
why this was worth checking.) The alternatives were «The tour wants to know», which names a body the
game does not model, and «They want to know», which names nobody. It is a draft like every row here.

⚠ **The card quotes nobody, by the same argument `'own-key'` shipped under one wave down**: the
completeness rule («a `quiet` girl can never silently receive a `fiery` girl's line») binds pools that
quote HER, and this one is a question put to the parent about a calendar. Giving it a voiced line of
hers is a wording decision that is HIS to take – §8 Q-3.

---

## 6. ⚠ What this wave does NOT owe – the explicit non-rows, with reasons

Wave 7's §6 carried three of these and the practice is the reason none of them gets «found» again a
wave later. This wave has six, and the first is the one his reading pass would otherwise stop on.

### 6.1. ⚠⚠ `PSY_COUNSEL.postpartum` is `null`, it LOOKS like three owed sentences, and it is NOT owed

`src/engine/world/lifeBeat.ts` · `PSY_COUNSEL`. T1 widened `spiritShock.kind` to
`'breakup' | 'postpartum'`, the register record is total by type, and the table went red – which is
that design working exactly as its own note says it will. What the red asks for is three more
sentences in the psychologist's voice, one per `ForkStopDriver`, and **wording is not an agent's to
write**, so T1 left the cell `null` and named T8.

**T8 declines, and the reason is STRUCTURAL rather than «not yet»** – the architect's gate-1 finding,
commit `b43729a9`, with the full argument in the source at that cell. Three facts, each one
grep-checkable:

1. the register is stamped at **exactly one site** – the single `raiseLifeBeat(…, 'fork-psy', …)` in
   `src/`, which reads `world.spiritShock?.kind ?? 'plain'`;
2. that site fires **only off a `'fork-opinion'` row answered `stop`**, and `'fork-opinion'` is raised
   in exactly one place – the fork at nineteen, asked on `schoolEndWeek`;
3. it **BLOCKS**, and the advance refuses while a blocking row is unanswered, so the career cannot
   tick past it. **She answers it at 18.0–18.9 or not at all.**

A `'postpartum'` shock needs a marriage (`ECONOMY.wedding.ageGate` 23), a pregnancy and a birth, so it
cannot exist before ~24. ⭐ **THE TWO WINDOWS CANNOT OVERLAP.** The column is owed only if a later
wave raises `'fork-psy'` from somewhere other than the fork, and the throw at that cell
(`A fork-psy register has no counsel column yet: …`) is what makes that safe to rely on: the day a
second raise site appears it names the cell by register instead of reading `undefined[driver]`.

⚠ **The tempting shortcut is refused and named here too**, so nobody re-discovers it as a good idea:
aliasing this column to `plain`'s would compile, keep every test green, and make the psychologist tell
a woman eight weeks after a birth that «nothing is sitting on top of this one» – false about the one
week it could be shown in. A missing column is a bug that announces itself; a wrong column is a bug
that reads well.

### 6.2. `ALBUM_CLOSING_FAMILY.family` – a mapping, and it adds no string

`src/engine/world/albumBook.ts`. The brief anticipated «the album's closing-family lines if the
mapping needed new ones». It did not. The ninth ending maps to `decision` – beside `stopped`, which is
the same shape of story: she was never stopped, she decided – and **all three families still take
`A32`** under his own ruling, so the row adds no occasion and no copy. The extension point working
exactly as its note says.

### 6.3. `SOFT_BEAT_CARD.expecting` and `SOFT_BEAT_CARD['return-plan']` are `null` – no card lines owed

Both kinds are BLOCKING, so the row stops the week and never reaches the soft surface. A card line for
either would be dead copy pretending to be reachable. The `null` is the record's own rule for every
blocking kind, not a choice this wave made.

### 6.4. The invariant throw messages are not rows

`A fork-psy register has no counsel column yet: …`, `An expecting answer has no support grade: …`,
`A return-plan answer has no plan: …`. Unreachable through any interface, and the standing precedent
of every prior wave's table, which carried none of their kind.

### 6.5. The pause's DIARY band was not built, and that is a real gap rather than a silent one

The brief's T8 section names «the pregnancy feed/diary texture». **The feed half shipped** (P17) and
**the diary half did not**: `src/engine/diary/weekNotes.ts` is untouched by this wave – it is not in
`git diff --name-only c322301c..HEAD`. Wave 7's `spouseSpoke` and `ownKey` bands are the precedent for
what a diary band looks like, and nothing equivalent exists for the months she is away. Carried as
§8 Q-4 rather than invented: a band is four-to-eight new lines and a trigger, which is a build and not
a transcription.

### 6.6. The harness literals are not rows

`tools/_lifeBeats.ts`' `DRAIN_ANSWER` gained `expecting: 'worry'` and `'return-plan': 'small-first'`,
and the test suites transcribe the strings above to pin them. Both are outside `src/` and are harness
material, not player copy – wave 7's own sentence about the same two kinds of file.

---

## 7. ⚠ The non-string drafts, CARRIED – every number and every pick this wave ships

⚠ **None of these is a string and none is in §0's 30.** They ride T9's bench (invariant 5: tuning is
measured, not guessed) and are named here so nobody has to wonder whether the вычитка forgot them.
**Every one ships at its drafted value, unruled** – the brief's §4 contract, which is not an omission.

### 7.1. The numbers – `ECONOMY.motherhood` unless noted

| what | drafted | whose draft | where it is argued |
| --- | --- | --- | --- |
| the hazard's four rungs, `perWeekByAge` | 2 / 3 / 4 / 3 %-a-year at ages 24 / 27 / 30 / 34, then **0** from 35 | the ARCHITECT drafts window + derivation; the **builder** drafts the rung SHAPE | flagged in the source at the constant; predicts the ruled 15–30% census |
| `playsOnWeeks` | **8** | the brief's figure | «pros play into the early months» |
| `termWeeks` | **31** | the brief's figure | 8 + 31 = 39 is the term |
| the three answer deltas | `joyBond` **+2.5** · `worryBond` **−0.5** · `careerFirstBond` **−4** | the brief's figures | §2 T2 |
| `decisionWeeksAfterBirth` | **20** | the brief's figure | §2 T5; it is also the window P18 goes stale across |
| the postpartum band, `ECONOMY.spirit.shock.postpartum` | **−24 / −37.5** (steady / intense) | the **builder's** | +9% over the break-up band, argued at the constant |
| `ECONOMY.spirit.postpartumSupportScale` | `warm` **0.8** · `measured` **1** · `cold` **1.25** | the **builder's** | the direction is the brief's («warm shortens, cold lengthens»); the sizes are not |
| the return decision's five terms | `returnBase` **0.65** · `returnSupportShift` **+0.15 / 0 / −0.2** · `returnSpiritPerPoint` **0.004** · `returnBondPerPoint` **0.002** · `returnAgePivotYears` **30** / `returnAgePerYearOver` **0.015**, held inside **0.1–0.9** | base is the brief's; the four weights and the band are the **builder's** | argued per constant; T9 benches the PRODUCT 0.65 × ~0.6 ≈ 0.4 |
| the staged factor, `comebackStages` | **0.6 / 0.8 / 0.9 / 1.0** at 0 / 3 / 6 / 12 months back | the research's own staircase, transcribed | §2 T6 |
| the freeze | **12 entries / 156 weeks** | ⭐ **RULED 20.09** – «наверное да, у нас тоже были исследования». NOT a draft | the anchor (`returnedWeek`, not `pausesWeek`) IS a builder's reading and is §8 Q-5 |

⭐ **AND T7 SHIPPED NO CONSTANT AT ALL, WHICH BELONGS ON THIS LIST RATHER THAN IN A FOOTNOTE.**
`ECONOMY.motherhood.pauseBrandFactor` was drafted in the brief and **does not enter**. T7 measured
first, as §2 T7 instructed: two arms of 240 careers from one commit, differing only by the hazard, so
each of the **25 that paused** is compared against itself without the pregnancy. A career that pauses
already keeps only **70.0% of the brand income** its own twin earns over the 155 weeks from the pause
– **$3,865,406 less each** – and holds **24.3%** of the control's kit-deal weeks in the year after
coming back, with fifteen kit deals dead on the events clause against **none** in the control.
The world already charges the research's «sponsors partially lost during the pause» through
machinery no part of this wave wrote. **So the absence is a measurement, not an oversight, and the
wave declined to charge her twice.** The record is
[the motherhood spec §1](../specs/the-motherhood-2026-09.md); the branch not taken (a flat 0.6) would
have taken her to ~58% and would have billed her in the wrong year.

### 7.2. The three picks – not words, and each one the owner's to move

| what | picked | why it is not a string, and what it cost |
| --- | --- | --- |
| `EMOTION_BY_ENDING.family` (`world/album.ts`) | `'serious'` | her face on the `'family'` epilogue. `norm` was the real alternative (`college` takes it) and lost because `college` is the one ending that RESUMES, so its `norm` reads «nothing has ended». `happy` is refused for the peak's own repaired reason: all four voices reach this ending |
| `MEMORY_EMOTION.birth` (`diary/facts.ts`) | `'norm'` | the album polaroid's face for the birth week. **There is no birth painting** – `FACE_BANDS` holds exactly one moment-face (`bride`) – so the honest pick is the app's own fallback. A smile is the one face the same week's arithmetic (−24 / −37.5 of spirit) actively contradicts |
| `LIFE_BEAT_ROW_KINDS` gains `'expecting'` (`screens/lifeRowGlyphs.ts`) | **no glyph picked** | mechanically required by `tests/wave4-life-row-stamp.test.ts`, not a design choice. P17's row wears the standing white-heart fallback until he rules – «no agent adds or swaps one unasked» |

### 7.3. And one measurement with no artefact at all

T7's finding produced no constant, no string and no pick. It is named in 7.1 so that a reader
comparing the brief's task list against this table does not find T7 missing and go looking.

---

## 8. Questions for the owner – wording his pass decides

None of these blocks the wave; they are collected here per his own instruction.

1. **⚠⚠ Which answer is which GRADE** (P11–P13). The three labels are a rewording away from anything
   he prefers, but the MAPPING – joy→`warm`, worry→`measured`, career-first→`cold` – is mechanical:
   it scales the postpartum shock and weights her decision to come back. If he wants «Say we are glad,
   and that we will worry» to read as warm support rather than as the measured middle, that is an
   engine change and a re-bench, not a copy edit. Flagged because the three labels read closer
   together than the three grades are.
2. **⚠⚠ P18 says «She is expecting» for twenty weeks after she is not.** §2 carries the full
   mechanism. Three shapes, all his: leave it (the refusal is right, the word is loose); reword it to
   something true across both halves (e.g. a sentence about entries rather than about her state); or
   split it in two, which costs one branch in `entryStatus` and a second drafted line. **Nothing was
   done**, because the sentence is his.
3. **A voiced line of hers on the return card** (P25). Today the card is the parent's narration by
   design – one cell, no voice axis, `'own-key'`'s precedent. Her own sentence there means four voices
   × two presences, the standing completeness law, and eight more drafted rows the day he wants them.
4. **The pause's diary band** (§6.5). The months she is away currently produce one feed row and no
   diary scrap at all. Wave 7's `spouseSpoke` band is the shape. Not built, because a band is new copy
   and new copy is his to ask for.
5. **The freeze's anchor** – `validUntilWeek` is 156 weeks from the RETURN, not from the pause. That is
   a reading of his ruling rather than a number he gave: anchored at the pause it would be 105 usable
   weeks and the ruled 12 entries and ruled 156 weeks would be about two different spans. Carried as a
   reading to confirm.
6. **Does any surface speak the persisted `partnerName`?** Still open from wave 7 §5 Q-2. This wave
   added **five more surfaces that could have spoken it and do not** – the announcement card
   (P1–P10), the pause row (P17), the birth row (P19), the return row (P21) and the epilogue's blurb
   (P22). Unchanged, and listed so that whatever he rules covers this wave too.
7. **What the spouse is CALLED on screen** – wave 7 §5 Q-1, still open. ⚠ Wave 8 does not widen it:
   **not one row in this table refers to him at all**, which is §0's decoupling ruling read strictly.
   A mid-pregnancy divorce is ordinary life, so every line above is true of a career that had one.

8. **The echo between the `peak` and `family` blurbs** (§4). Sixty characters verbatim, measured, on
   two of the nine epilogues. A deliberate rhyme between the two endings that are HERS is a defensible
   reading and may be what he wants; so is rewording the newer one. Not touched either way.

⚠ **One observation offered as a question rather than as a fix, per invariant 4.** The wave makes an
existing RULED string reachable in a context it was not written for: `RECOVERY_RECEIPT` – «She came
back sooner than last time.» – can now print at a POSTPARTUM clear, for a career whose marriage ended
before the birth (the predicate it guards on is «some attachment of hers ended before this week», any
attachment, any time). The sentence is one of wave 5's nine ruled rows and **nothing was changed**; a
builder narrowing a ruled sentence's trigger to suit a new kind is the move its own history warns
about. Reachable, rare, and his.

---

## 9. The reconciliation – code drafts against this table

The sweep: every draft flag the wave added under `src/`, read at the close of T7 over
`git diff c322301c..HEAD -- src/`. **Verdict: every flagged STRING site has rows above; no row above
lacks its flag in code.**

⚠⚠ **AND THE PRESCRIBED SWEEP COMMAND IS DEFECTIVE, WHICH IS REPORTED HERE BECAUSE THE NEXT WAVE WILL
RUN IT.** `grep '⚠ DRAFT'` matches `⚠ ⚠ DRAFT` and `// ⚠ DRAFT` but **NOT** `⚠⚠ **DRAFT – T8's
TABLE**` and **NOT** `⚠ WAVE 8 T5 – A DRAFT`, which are the two spellings the later tasks reached
for. Measured on this wave: the narrow sweep returns **22 added lines**, the wide one **38**, and the
sixteen dropped lines carry **seven string sites covering eight of this table's thirty rows** –

> P17 the pause row · P18 the entry refusal · P19 the birth row · P21 the return row ·
> P22 the ending's blurb · P23 its title · P29 and P30 the return-plan answer rows

– plus the `EMOTION_BY_ENDING.family` pick and every flagged number in `economy.ts`. **That is four of
this wave's five tasks invisible to the command that is supposed to prove the table complete.** Run
`grep DRAFT` instead, or `grep -E '⚠+ ?\*{0,2}DRAFT'`. The table below is the complete list under the
wider sweep, and a builder who runs only the narrow one will believe a short table is a finished one.

| flagged site (file · what) | rows here |
| --- | --- |
| `lifeBeat.ts` §3j banner + `EXPECTING_HER_LINE` / `EXPECTING_DRY` / `EXPECTING_HEADING` | P1–P10 |
| `lifeBeat.ts` `LIFE_BEAT_OPTIONS.expecting` (banner + three `⚠ DRAFT` rows) | P11–P13 |
| `lifeBeat.ts` `ANSWER_EVENT.expecting` (banner + three `⚠ DRAFT` rows) | P14–P16 |
| `lifeBeat.ts` `PAUSE_EVENT` (`⚠⚠ **DRAFT – T8's TABLE, NOT SHIPPED COPY**`) | P17 |
| `medical.ts` `PREGNANCY_PAUSE_DETAIL` (same spelling) | P18 |
| `lifeBeat.ts` `BIRTH_EVENT` (same spelling) + `landBirth`'s `// ⚠ DRAFT – the kept line` | P19 |
| `album.ts` `SCROLL_LABEL.birth` (`⚠ DRAFT (v85, the birth – wave 8 T4)`) | P20 |
| `endings.ts` `RETURN_EVENT` (`⚠⚠ **DRAFT – T8's TABLE, NOT SHIPPED COPY**`) | P21 |
| `ending.ts` `ENDING_BLURB.family` (`⚠ WAVE 8 T5 – A DRAFT`) | P22 |
| `ending.ts` `ENDING_TITLE.family` (`⚠ WAVE 8 T5 – A DRAFT`) | P23 |
| `ending.ts` `endingForFamily`'s detail (`⚠ DRAFT (invariant 4) – T8's table`) | P24 |
| `lifeBeat.ts` §3k banner + `RETURN_PLAN_SAID` / `RETURN_PLAN_HEADING` | P25–P26 |
| `lifeBeat.ts` `LIFE_BEAT_OPTIONS['return-plan']` (banner + two `⚠ DRAFT` rows) | P27–P28 |
| `lifeBeat.ts` `ANSWER_EVENT['return-plan']` (`⚠⚠ **DRAFT – T8's TABLE**` + two `⚠ DRAFT` rows) | P29–P30 |
| `lifeBeat.ts` `PSY_COUNSEL.postpartum` – a `null` CELL, and the flag says T8 drafts it | **§6.1 – declined, with the structural reason** |
| `album.ts` `EMOTION_BY_ENDING.family` – a PICK, not a string | §7.2 |
| `diary/facts.ts` `MEMORY_EMOTION.birth` – a PICK, «THE BUILDER'S DRAFT» | §7.2 |
| `lifeRowGlyphs.ts` `LIFE_BEAT_ROW_KINDS` – a roster row, no glyph picked | §7.2 |
| `albumBook.ts` `ALBUM_CLOSING_FAMILY.family` – a MAPPING, «the brief's drafted mapping» | **§6.2 – adds no string** |
| `economy.ts` `ECONOMY.motherhood` whole + `ECONOMY.spirit.shock.postpartum` + `postpartumSupportScale` – NUMBERS, «draft for the bench» | §7.1 |

**The walk backwards**: every one of P1–P30 was transcribed from a flagged site in the column above,
and no row in this table was written from a plan document, a test fixture or a commit message. Three
rows are worth naming because their flag is not on the string's own line – P19 carries two flags (the
constant's and `fireMilestone`'s call site), P24's flag sits in `endingForFamily`'s doc comment rather
than on the template literal, and P20's sits above the record's cell.

**The additions the sweep shows that are deliberately NOT rows** are §6 in full, with a reason each:
the `null` counsel column (structurally unreachable), the closing-family mapping (no string), the two
`null` soft-beat cards (blocking kinds), the three invariant throws (unreachable through any
interface), and the harness literals in `tools/` and `tests/` (not player copy). The wave-8 doc
comments themselves flag rules, not strings.
